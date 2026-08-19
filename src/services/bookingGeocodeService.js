/**
 * השלמת מיקומים להזמנות שיובאו מהמייל.
 *
 * אישור הזמנה נושא כתובת כטקסט ולא קואורדינטות, ולכן מפת היום לא היה לה
 * ממה להיבנות. הרכיב לא המציא נקודות — וזה נכון — אבל זה השאיר את המפה
 * ריקה תמיד.
 *
 * ── למה לא בזמן הייבוא ──
 * שירות המיקומים מגביל לבקשה בשנייה. הרצה בזמן הסריקה הייתה מוסיפה
 * עשרות שניות לפעולה שהמשתמש מחכה לה. כאן זה רץ ברקע, אחרי שהמסך כבר
 * מוצג, ורק פעם אחת לכל מקום.
 *
 * ── מה נשמר ──
 * המפתח הוא סוג האירוע ולא ההזמנה: איסוף רכב והחזרתו הם שתי כתובות באותה
 * רשומה, ולעיתים בשתי ערים. מיקום אחד להזמנה היה מציב את ההחזרה ברומא על
 * נקודת האיסוף בנאפולי.
 */

import { locatePlace } from './placeLookupService';
import { eventsFor } from './tripTimelineService';

/** טיסה אינה מקום על הקרקע: מיקומה שדה תעופה, והיא אינה מופיעה במפת היום. */
const LOCATABLE = new Set(['hotel-in', 'hotel-out', 'car-pickup', 'car-return', 'transfer', 'activity']);

const hasGeo = (b, kind) => {
  const g = b.geo && b.geo[kind];
  return !!g && (Number.isFinite(Number(g.lat)) || g.failed);
};

/**
 * מה חסר מיקום, בלי כפילויות.
 *
 * שתי הזמנות באותה כתובת מאותרות פעם אחת: כל בקשה עולה שנייה שלמה, ואין
 * טעם לשלם עליה פעמיים.
 */
export const missingPlaces = (bookings = []) => {
  const out = [];
  const seen = new Set();

  // המקור הוא האירועים שההזמנה באמת מייצרת, ולא רשימת הסוגים כולה.
  // מעבר עיוור על כל הסוגים שאל מלון "מה מיקום הפעילות", והתשובה נפלה
  // על שם המלון — משימת איתור שהומצאה יש מאין.
  bookings.forEach((b) => {
    eventsFor(b).forEach((ev) => {
      if (!LOCATABLE.has(ev.kind) || !ev.place || hasGeo(b, ev.kind)) return;
      const key = ev.place.trim().toLowerCase();
      out.push({ booking: b, kind: ev.kind, place: ev.place, dedupeKey: key, repeat: seen.has(key) });
      seen.add(key);
    });
  });

  return out;
};

/**
 * מאתר את החסרים ומחזיר את ההזמנות המעודכנות בלבד.
 *
 * @param {Array} bookings
 * @param {string} destination יעד הנסיעה, לצמצום החיפוש
 * @param {number} max תקרה לבקשות בריצה אחת
 * @returns {Promise<Array>} הזמנות עם שדה geo מעודכן
 */
export const geocodeBookings = async (bookings = [], destination = '', max = 12) => {
  const tasks = missingPlaces(bookings).slice(0, max);
  if (!tasks.length) return [];

  const resolved = new Map();
  const touched = new Map();

  for (const task of tasks) {
    let found = resolved.get(task.dedupeKey);

    if (found === undefined) {
      const { coords, confidence } = await locatePlace(task.place, '', destination);
      found = coords ? { ...coords, unverified: confidence === 'address' } : null;
      resolved.set(task.dedupeKey, found);
    }

    const id = String(task.booking.id);
    const current = touched.get(id) || { ...task.booking, geo: { ...(task.booking.geo || {}) } };

    // כישלון נרשם גם הוא. בלעדיו אותה כתובת שלא נמצאה הייתה נבדקת שוב
    // בכל טעינה, ומשלמת את מגבלת הקצב לנצח.
    current.geo[task.kind] = found || { failed: true };
    touched.set(id, current);
  }

  return [...touched.values()];
};
