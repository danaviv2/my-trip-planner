// services/analyticsRedaction.js
//
// מה נשלח ל-Vercel Analytics, אחרי הסרת מזהים.
//
// ── למה ──
// Vercel Analytics שומר את הכתובת המלאה של כל צפייה (נבדק 13.09.2026 מול
// /docs/analytics/privacy-policy). בכתובות של האפליקציה יושבים מזהים שהם
// בעצמם מפתח גישה: `/trip/<קוד>` פותח עותק של טיול לכל מי שמחזיק בקוד, ו-
// `?room=<קוד>` מצרף לחדר הצבעה. קוד כזה בלוח מחוונים של צד שלישי הוא דליפה
// של הרשאה, לא של סטטיסטיקה. `tripId` אינו סוד, אבל מזהה טיול של משתמש
// מסוים ואינו אומר דבר על שימוש במוצר.
//
// הצורה נשמרת (`/trip/[code]`) כדי שהדוח עדיין יספור כמה נכנסו לשיתופים.

const SECRET_PATHS = [/^(\/trip\/)[^/?#]+/];
const REDACT_PARAMS = ['room', 'tripId', 'code', 'token', 'key'];

export const redactUrl = (url) => {
  try {
    const u = new URL(url);
    for (const re of SECRET_PATHS) u.pathname = u.pathname.replace(re, '$1[code]');
    for (const p of REDACT_PARAMS) if (u.searchParams.has(p)) u.searchParams.set(p, '[redacted]');
    // העוגן לעולם אינו חלק מהדוח, וקישורי שיתוף עתידיים עלולים לשאת בו מזהה.
    u.hash = '';
    return u.toString();
  } catch {
    // כתובת שלא ניתן לפענח לא נשלחת כמו שהיא: עדיף לאבד צפייה מלדלוף מזהה.
    return null;
  }
};

/** `beforeSend` ל-<Analytics />: מחזיר null כשאין כתובת בטוחה לשלוח. */
export const analyticsBeforeSend = (event) => {
  const url = redactUrl(event?.url);
  return url ? { ...event, url } : null;
};
