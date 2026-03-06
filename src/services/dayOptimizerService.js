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
