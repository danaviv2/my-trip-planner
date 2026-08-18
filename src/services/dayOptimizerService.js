/**
 * Smart Day Optimizer
 * מנתח כל יום בטיול ומזהה ימים עמוסים מדי
 * לא דורש API — חישוב מקומי בלבד
 */

// ─── פרסור משך פעילות ─────────────────────────────────────────

const DURATION_RE = /(\d+(?:[.,]\d+)?)\s*(שעה|שעות|שעה וחצי|hour[s]?|hr[s]?|דקות?|min(?:ute)?s?)/i;

export function parseDurationMinutes(str = '') {
  if (!str) return 60; // ברירת מחדל: שעה

  // מקרה מיוחד: "שעה וחצי"
  if (str.includes('שעה וחצי') || str.includes('hour and a half')) return 90;

  const m = str.match(DURATION_RE);
  if (!m) return 60;

  const n = parseFloat(m[1].replace(',', '.'));
  const u = m[2].toLowerCase();
  const isHours = u.startsWith('ש') || u.startsWith('h');
  return Math.round(isHours ? n * 60 : n);
}

// ─── מרחק Haversine (ק"מ) ──────────────────────────────────────

function haversineKm(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lat2 || !lng1 || !lng2) return 0;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ממוצע מהירות עירונית: 20 קמ"ש → 3 דק' לק"מ
function travelMinutes(km) {
  return Math.round((km / 20) * 60);
}

// ─── ניתוח יום בודד ───────────────────────────────────────────

/**
 * @param {Array} activities
 * @returns {{ totalMinutes, actMinutes, travelMinutes, hours, score, label, color, emoji, warning }}
 */
export function analyzeDay(activities = []) {
  let actMin   = 0;
  let travMin  = 0;

  activities.forEach((act, i) => {
    actMin += parseDurationMinutes(act.duration);
    if (i > 0) {
      const prev = activities[i - 1];
      const km = haversineKm(prev.lat, prev.lng, act.lat, act.lng);
      travMin += travelMinutes(km);
    }
  });

  const total = actMin + travMin;
  const hours = +(total / 60).toFixed(1);

  let score, label, color, emoji, warning;
  if (hours <= 7) {
    score = 'green';  label = 'מאוזן';    color = '#43e97b'; emoji = '🟢'; warning = null;
  } else if (hours <= 9.5) {
    score = 'yellow'; label = 'עמוס';     color = '#f5af19'; emoji = '🟡';
    warning = `יום עמוס (${hours} שעות) — שקול להזיז פעילות אחת`;
  } else {
    score = 'red';    label = 'עמוס מדי'; color = '#f5576c'; emoji = '🔴';
    warning = `יום עמוס מדי (${hours} שעות) — מומלץ להזיז לפחות פעילות אחת`;
  }

  return { totalMinutes: total, actMinutes: actMin, travelMinutes: travMin, hours, score, label, color, emoji, warning };
}

// ─── ניתוח כל הטיול ───────────────────────────────────────────

/**
 * @param {Array} fullItinerary — [{ stop, days, itinerary }]
 * @returns {Array} — [{ stop, days, dayAnalyses: [analyzeDay result] }]
 */
export function analyzeItinerary(fullItinerary = []) {
  return fullItinerary.map(({ stop, days, itinerary }) => ({
    stop, days,
    dayAnalyses: (itinerary || []).map(day => analyzeDay(day.activities || [])),
  }));
}

/**
 * סיכום כללי של הטיול
 * @returns {{ green, yellow, red, hasIssues }}
 */
export function summarizeAnalysis(analysis = []) {
  let green = 0, yellow = 0, red = 0;
  analysis.forEach(({ dayAnalyses }) => {
    dayAnalyses.forEach(({ score }) => {
      if (score === 'green')  green++;
      else if (score === 'yellow') yellow++;
      else red++;
    });
  });
  return { green, yellow, red, hasIssues: yellow > 0 || red > 0 };
}

// ─── אופטימיזציה אוטומטית ─────────────────────────────────────

/**
 * מזיז פעילויות מימים עמוסים (אדום/צהוב) לימים קלים בתוך אותה עצירה
 * @param {Array} fullItinerary
 * @returns {{ newItinerary, movedCount, details: [string] }}
 */
export function autoOptimize(fullItinerary) {
  const next = JSON.parse(JSON.stringify(fullItinerary));
  let movedCount = 0;
  const details = [];

  next.forEach((stopObj) => {
    if (!stopObj.itinerary || stopObj.itinerary.length < 2) return;
    const days = stopObj.itinerary;

    let changed = true;
    let passes = 0;

    while (changed && passes < 10) {
      changed = false;
      passes++;

      for (let di = 0; di < days.length - 1; di++) {
        const analysisA = analyzeDay(days[di].activities || []);
        const analysisB = analyzeDay(days[di + 1].activities || []);

        // הזז רק אם יום A אדום/צהוב ויום B קל יותר
        const shouldMove =
          (analysisA.score === 'red' && days[di].activities.length > 3) ||
          (analysisA.score === 'yellow' && analysisB.score === 'green' && days[di].activities.length > 3);

        if (!shouldMove) continue;

        // מצא פעילות להזזה: האחרונה שאינה אוכל/מנוחה
        const acts = days[di].activities;
        let moveIdx = -1;
        for (let ai = acts.length - 1; ai >= 0; ai--) {
          if (!['food', 'rest', 'transport'].includes(acts[ai].type)) {
            moveIdx = ai;
            break;
          }
        }

        if (moveIdx === -1) continue;

        const [moved] = days[di].activities.splice(moveIdx, 1);
        // הכנס בתחילת היום הבא (אחרי תחבורה אם יש)
        const insertAt = days[di + 1].activities[0]?.type === 'transport' ? 1 : 0;
        days[di + 1].activities.splice(insertAt, 0, { ...moved, time: '09:30' });

        movedCount++;
        details.push(`"${moved.name}" הוזז מיום ${di + 1} ליום ${di + 2} ב-${stopObj.stop?.name || ''}`);
        changed = true;
      }
    }
  });

  return { newItinerary: next, movedCount, details };
}

// ─── סידור גיאוגרפי בתוך היום ─────────────────────────────────

/**
 * מסדר מחדש את פעילויות היום כדי לקצר את הנסיעה ביניהן.
 *
 * המודל בוחר מקומות לפי עניין ולא לפי גיאוגרפיה, ולכן יום שלם עלול
 * לזגזג בין שני קצות העיר ולחזור. הסידור אינו משנה מה עושים — רק באיזה
 * סדר, ובאילו משבצות זמן.
 *
 * שלוש מגבלות שנשמרות בכוונה:
 *
 * • ארוחות ומנוחה אינן זזות. צהריים ב-13:00 אינם "עצירה במסלול" אלא
 *   אילוץ; הזזתם לתשע בבוקר הייתה מקצרת נסיעה ומקלקלת את היום.
 * • פעילות בלי קואורדינטות מאומתות אינה זזה. אין עליה מידע גיאוגרפי,
 *   וניחוש מיקום הוא בדיוק מה שאסור כאן.
 * • משבצות הזמן נשארות במקומן והפעילויות מוצבות בהן מחדש, כך שהיום
 *   מתחיל ומסתיים באותן שעות ואורך הפעילויות נשמר.
 *
 * @returns {{activities, beforeKm, afterKm, savedKm, savedMinutes, moved}}
 */
export function optimizeDayOrder(activities = []) {
  const unchanged = {
    activities, beforeKm: 0, afterKm: 0, savedKm: 0, savedMinutes: 0, moved: 0,
  };
  if (activities.length < 3) return unchanged;

  const hasCoord = (a) =>
    a && a.lat != null && a.lng != null &&
    !isNaN(Number(a.lat)) && !isNaN(Number(a.lng)) &&
    !(Number(a.lat) === 0 && Number(a.lng) === 0);

  // אינדקסים שמותר להזיז את תוכנם
  const free = activities
    .map((a, i) => i)
    .filter((i) => {
      const a = activities[i];
      return hasCoord(a) && !['food', 'rest', 'transport'].includes(a.type);
    });

  if (free.length < 3) return unchanged;

  const pathKm = (list) => {
    let km = 0;
    for (let i = 1; i < list.length; i++) {
      const p = list[i - 1];
      const c = list[i];
      if (hasCoord(p) && hasCoord(c)) km += haversineKm(p.lat, p.lng, c.lat, c.lng);
    }
    return km;
  };

  const beforeKm = pathKm(activities);

  // 2-opt על המשבצות הפנויות בלבד. היום קצר (יחידות בודדות), ולכן
  // מיצוי מלא זול ומחזיר תוצאה יציבה — בלי אקראיות ובלי תלות בסדר הקלט.
  let best = [...activities];
  let bestKm = beforeKm;
  let improved = true;
  let passes = 0;

  while (improved && passes < 20) {
    improved = false;
    passes++;
    for (let x = 0; x < free.length; x++) {
      for (let y = x + 1; y < free.length; y++) {
        const candidate = [...best];
        const i = free[x];
        const j = free[y];
        [candidate[i], candidate[j]] = [candidate[j], candidate[i]];
        const km = pathKm(candidate);
        // סף קטן מונע החלפות שמקזזות שברי קילומטר הלוך ושוב
        if (km < bestKm - 0.05) {
          best = candidate;
          bestKm = km;
          improved = true;
        }
      }
    }
  }

  const moved = best.reduce((n, a, i) => (a !== activities[i] ? n + 1 : n), 0);
  if (!moved) return { ...unchanged, beforeKm, afterKm: beforeKm };

  // משבצות הזמן נשארות במקומן; רק התוכן שלהן התחלף.
  const times = activities.map((a) => a.time);
  const reordered = best.map((a, i) => (a.time === times[i] ? a : { ...a, time: times[i] }));

  const savedKm = beforeKm - bestKm;
  return {
    activities: reordered,
    beforeKm,
    afterKm: bestKm,
    savedKm,
    savedMinutes: travelMinutes(savedKm),
    moved,
  };
}
