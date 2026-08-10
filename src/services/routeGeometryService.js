/**
 * גיאומטריה של מסלול — לאימות הטענה המרכזית של מסך הטיול המתגלגל.
 *
 * הפרומפט מורה למודל ש"stops must be geographically ordered along the
 * route", אך איש אינו בודק זאת. תחנה שנמצאת מאות קילומטרים מהדרך נראית
 * ברשימת הכרטיסים בדיוק כמו תחנה בדרך, והמשתמש מתבקש להחליט אם להסיר
 * אותה — בלי המידע היחיד שדרוש להחלטה.
 *
 * לתחנות כבר יש lat/lng מהמודל, ולכן החישוב אינו עולה קריאת רשת כלשהי.
 * המרחקים הם קו אווירי ולא מרחק כביש: הם מספיקים להבחין בין תחנה שבדרך
 * לתחנה שאינה, ואינם מתיימרים להחליף ניווט.
 */

const R = 6371; // רדיוס כדור הארץ בק"מ
const rad = (deg) => (deg * Math.PI) / 180;

export const hasCoords = (s) =>
  s && Number.isFinite(Number(s.lat)) && Number.isFinite(Number(s.lng)) &&
  !(Number(s.lat) === 0 && Number(s.lng) === 0);

/** מרחק קו אווירי בין שתי נקודות, בק"מ. */
export const distanceKm = (a, b) => {
  if (!hasCoords(a) || !hasCoords(b)) return null;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)));
};

/**
 * כמה קילומטרים מוסיפה התחנה למסלול, לעומת נסיעה ישירה מהקודמת לבאה.
 *
 * זהו המספר שהמשתמש צריך כדי להחליט אם להשאיר אותה. תחנה בדרך מוסיפה
 * אפס או קרוב לכך; תחנה שדורשת סטייה מוסיפה את הסטייה פעמיים — הלוך
 * וחזור אל הקו.
 *
 * @returns {number|null} תוספת בק"מ, או null כשאין נתונים
 */
export const detourKm = (prev, stop, next) => {
  if (!hasCoords(prev) || !hasCoords(stop) || !hasCoords(next)) return null;
  const viaStop = distanceKm(prev, stop) + distanceKm(stop, next);
  const direct = distanceKm(prev, next);
  return Math.max(0, viaStop - direct);
};

/** הערכת זמן נהיגה גסה. 75 קמ"ש ממוצע כולל עצירות ודרכים צדדיות. */
export const drivingHours = (km) => (km == null ? null : km / 75);

export const formatDuration = (hours) => {
  if (hours == null) return '';
  const total = Math.round(hours * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h && m) return `${h} שעות ו-${m} דקות`;
  if (h) return h === 1 ? 'שעה' : `${h} שעות`;
  return `${m} דקות`;
};

// מעל זה כבר לא "בדרך" אלא עיקוף שכדאי להיות מודע לו
const DETOUR_NOTICE_KM = 60;

/**
 * מחשב לכל תחנה את התוספת שלה למסלול.
 *
 * @param {Array} stops תחנות לפי סדר
 * @returns {Array<{index, detour, notable, hours}>}
 */
export const analyzeRoute = (stops = []) =>
  stops.map((stop, i) => {
    // הראשונה והאחרונה הן נקודות הקצה — אין להן "עיקוף"
    if (i === 0 || i === stops.length - 1) {
      return { index: i, detour: null, notable: false, hours: null };
    }
    const detour = detourKm(stops[i - 1], stop, stops[i + 1]);
    return {
      index: i,
      detour,
      notable: detour != null && detour >= DETOUR_NOTICE_KM,
      hours: drivingHours(detour),
    };
  });

/** אורך המסלול כולו לעומת הקו הישיר בין הקצוות. */
export const routeTotals = (stops = []) => {
  const usable = stops.filter(hasCoords);
  if (usable.length < 2) return null;

  let total = 0;
  for (let i = 1; i < usable.length; i++) {
    total += distanceKm(usable[i - 1], usable[i]) || 0;
  }
  const direct = distanceKm(usable[0], usable[usable.length - 1]);
  return { total, direct, extra: Math.max(0, total - direct), stops: usable.length };
};

/**
 * מיקומי התחנות על לוח ציור, לשרטוט צורת המסלול.
 *
 * הטלה פשוטה של קו אורך ורוחב, עם תיקון יחס לפי קו הרוחב הממוצע — בלעדיו
 * מסלול צפון-דרומי באירופה נראה רחב מדי. אין כאן מפת רקע ואין קריאת
 * רשת: המטרה היא לראות את צורת המסלול ואיזו תחנה בולטת ממנו.
 */
export const projectStops = (stops = [], width = 600, height = 220, pad = 28) => {
  const usable = stops.filter(hasCoords);
  if (usable.length < 2) return null;

  const lats = usable.map((s) => Number(s.lat));
  const lngs = usable.map((s) => Number(s.lng));
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const kx = Math.cos(rad(midLat)); // תיקון יחס

  const xs = lngs.map((l) => l * kx);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...lats);
  const maxY = Math.max(...lats);

  const spanX = maxX - minX || 1e-6;
  const spanY = maxY - minY || 1e-6;
  const scale = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanY);

  // מרכוז אחרי ההתאמה, כדי שמסלול צר לא יידבק לקצה
  const offsetX = (width - spanX * scale) / 2;
  const offsetY = (height - spanY * scale) / 2;

  const raw = usable.map((s) => ({
    stop: s,
    x: (Number(s.lng) * kx - minX) * scale + offsetX,
    // ציר Y הפוך: קו רוחב גדל צפונה, ופיקסלים גדלים מטה
    y: (maxY - Number(s.lat)) * scale + offsetY,
  }));

  return separate(raw, width, height, pad);
};

// קוטר עיגול התחנה ועוד רווח מינימלי, כדי ששתי תחנות תישארנה קריאות
const MIN_GAP = 24;

/**
 * מרחיק נקודות שנופלות זו על זו.
 *
 * במסלול ארוך יש תחנות סמוכות מאוד: מרסיי וקאסיס מרוחקות 25 ק"מ במסלול
 * של 1,300, ובקנה המידה של השרטוט הן נופלות באותה נקודה ממש. בלי הפרדה
 * העיגולים מכסים זה את זה ואי אפשר לקרוא את המספרים.
 *
 * ההזזה מכוונת ומינימלית, ומוצהרת בכיתוב שמתחת לשרטוט: המטרה היא צורת
 * המסלול ולא מיקום מדויק. סדר התחנות והכיוון הכללי נשמרים, שכן ההזזה
 * קטנה בהרבה מהמרחקים שהיא נועדה להבהיר.
 */
const separate = (points, width, height, pad) => {
  const out = points.map((p) => ({ ...p }));

  for (let pass = 0; pass < 60; pass++) {
    let moved = false;
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const dx = out[j].x - out[i].x;
        const dy = out[j].y - out[i].y;
        let dist = Math.hypot(dx, dy);
        if (dist >= MIN_GAP) continue;

        // נקודות חופפות לגמרי — דוחפים בכיוון שרירותי יציב
        let ux = dist > 0.01 ? dx / dist : Math.cos(i);
        let uy = dist > 0.01 ? dy / dist : Math.sin(i);
        if (dist <= 0.01) dist = 0.01;

        const push = (MIN_GAP - dist) / 2;
        out[i].x -= ux * push;
        out[i].y -= uy * push;
        out[j].x += ux * push;
        out[j].y += uy * push;
        moved = true;
      }
    }
    // החזרה לגבולות הלוח
    out.forEach((p) => {
      p.x = Math.min(width - pad / 2, Math.max(pad / 2, p.x));
      p.y = Math.min(height - pad / 2, Math.max(pad / 2, p.y));
    });
    if (!moved) break;
  }

  return out;
};
