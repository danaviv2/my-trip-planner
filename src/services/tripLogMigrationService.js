// services/tripLogMigrationService.js
//
// העברה חד-פעמית של `tripLogs` אל `savedTrips`.
//
// ── למה היו שתי רשימות ──
// במסך התכנון היו שני כפתורי שמירה. "שמור" כתב ל-`savedTrips` ולענן;
// "שמור מסלול" כתב ל-`tripLogs`, בדפדפן בלבד. "הטיולים שלי" מיזג את
// שתיהן, אבל יומן המסע, הסטטיסטיקה ומחיקת החשבון קראו רק את הראשונה.
// נמצא 13.09.2026 בחשבון בדיקה: שני טיולים שנשמרו בכפתור התחתון לא
// הגיעו לענן ולא הופיעו ביומן, ונעלמים עם סגירת חלון גלישה בסתר.
//
// הכפתור אוחד. מה שנשאר הוא הנתונים שכבר נכתבו — אצל הבעלים נמדד פער
// של טיול אחד בין "הטיולים שלי" (27) לדיאלוג המחיקה (26). בלי העברה
// הטיול הזה נעלם מהמסך ברגע ש"הטיולים שלי" מפסיק למזג.

export const LEGACY_KEY = 'tripLogs';

// ── חלון הכתיבה הכפולה ──
// "שמור" קרא גם לשמירת היומן, במזהה אחר (`Date.now()` שני). אותו טיול
// נכתב לשתי הרשימות בהפרש של מילישניות, ובלי זיהוי כזה ההעברה הייתה
// מכפילה כל טיול שנשמר בכפתור העליון. שתי דקות — ולא שנייה — כי
// `saveTripToList` מעדכן גם `savedAt` בשמירה חוזרת של אותו טיול.
const TWIN_WINDOW_MS = 2 * 60 * 1000;

const norm = (s) => String(s || '').trim().toLowerCase();
const at = (v) => {
  const n = new Date(v || 0).getTime();
  return Number.isFinite(n) ? n : 0;
};

/**
 * מחזיר את רשומות היומן שיש להוסיף כטיולים, בצורת טיול.
 *
 * זהות לפי אותות, כמו בהזמנות ולא לפי מפתח יחיד: מזהה זהה הוא אותו
 * טיול; אותו יעד שנשמר בתוך חלון הכתיבה הכפולה הוא אותו טיול. יעד זהה
 * בלבד **אינו** זהות — שתי נסיעות לפריז בחודשים שונים הן שתי נסיעות.
 *
 * @param {Array} savedTrips הרשימה הראשית
 * @param {Array} logs הרשימה הישנה
 */
export const tripsFromLogs = (savedTrips, logs) => {
  const saved = Array.isArray(savedTrips) ? savedTrips.filter(Boolean) : [];
  const out = [];
  const isTwin = (a, destination, when) =>
    norm(a.destination || a.endPoint) === norm(destination)
    && Math.abs(at(a.savedAt || a.date) - when) <= TWIN_WINDOW_MS;

  for (const log of Array.isArray(logs) ? logs : []) {
    if (!log || typeof log !== 'object') continue;
    // רשומה בלי יעד היא שארית של שמירה ריקה, לא טיול.
    if (!norm(log.destination)) continue;
    const when = at(log.date);
    const id = String(log.id ?? '');
    const known = [...saved, ...out];
    if (id && known.some((t) => String(t.id) === id)) continue;
    if (known.some((t) => isTwin(t, log.destination, when))) continue;

    out.push({
      // מזהה מספרי תקין נשמר; `NaN` שנכתב בבאג הישן מוחלף.
      id: Number.isFinite(Number(log.id)) && Number(log.id) > 0 ? Number(log.id) : (when || Date.now()),
      destination: log.destination,
      dailyItinerary: Array.isArray(log.dailyItinerary) ? log.dailyItinerary : [],
      ...(Array.isArray(log.waypoints) && log.waypoints.length ? { waypoints: log.waypoints } : {}),
      savedAt: log.date || new Date().toISOString(),
    });
  }
  return out;
};

/**
 * מריץ את ההעברה על האחסון המקומי. המפתח הישן נמחק **רק** אחרי שהרשימה
 * הראשית נכתבה — כתיבה שנכשלה (אחסון מלא, חסום) משאירה את המקור, והמשתמש
 * לא מאבד טיול בגלל ניסיון שלא הצליח.
 *
 * @returns {{added: number, ok: boolean}}
 */
export const migrateTripLogs = (storage) => {
  let logs;
  try {
    // הגישה ל-`window.localStorage` עצמה עלולה לזרוק (אחסון חסום), ולכן
    // היא בתוך ה-try. האחסון מוזרק בבדיקות.
    if (!storage) storage = window.localStorage;
    const raw = storage.getItem(LEGACY_KEY);
    if (raw == null) return { added: 0, ok: true };
    logs = JSON.parse(raw);
  } catch {
    return { added: 0, ok: false };
  }

  // רשימה ראשית פגומה עוצרת את ההעברה, ולא מתפרשת כריקה: `[]` כאן היה
  // דורס את כל הטיולים השמורים ומשאיר רק את מה שהגיע מהיומן.
  let saved;
  try {
    saved = JSON.parse(storage.getItem('savedTrips') || '[]');
    if (!Array.isArray(saved)) return { added: 0, ok: false };
  } catch {
    return { added: 0, ok: false };
  }

  const added = tripsFromLogs(saved, logs);
  try {
    if (added.length) storage.setItem('savedTrips', JSON.stringify([...saved, ...added]));
    storage.removeItem(LEGACY_KEY);
  } catch {
    return { added: 0, ok: false };
  }
  return { added: added.length, ok: true };
};
