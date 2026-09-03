/**
 * שומר משותף ל-endpoints שמחזיקים מפתח בתשלום.
 *
 * ── הבעיה שהוא פותר ──
 * המפתחות הועברו לשרת כדי שהדפדפן לא יחזיק אותם, וזה עבד. אבל ה-endpoint
 * עצמו נשאר פתוח לכל האינטרנט, ולכן המפתח לא נגנב — הוא פשוט הושאל.
 * נמדד ב-04.09.2026 מול האתר החי: POST אנונימי ל-`/api/gemini` החזיר
 * תשובה מלאה מ-Gemini, ו-GET אנונימי ל-`/api/place-website` ביצע בקשה
 * שעולה כסף. שניהם על חשבון בעל האתר.
 *
 * ── למה לא אימות זהות ──
 * זו הייתה התשובה המתבקשת, והיא שגויה כאן. נמדד: Gemini נקרא משמונה
 * מסכים **ציבוריים** (`/matchmaker`, `/journal`, `/rolling-trip`,
 * `/advanced-search`, `/destination-info`, `/map`, `/travel-info`,
 * `/booking`). דרישת התחברות הייתה שוברת אותם לכל מבקר שאינו מחובר.
 * `verifyIdToken` נשאר הכלי הנכון ל-endpoints שמשרתים משתמש מזוהה בלבד.
 *
 * ── מה זה כן נותן, ומה לא ──
 * זהו חסם מקור: בקשה חייבת להגיע מדפדפן שנמצא באחד מהדומיינים שלנו.
 * הוא עוצר סקריפט, curl ואתר זר — כלומר את הניצול שמדדתי בפועל.
 * **הוא אינו עוצר תוקף נחוש:** כותרת Origin ניתנת לזיוף בכלי שאינו דפדפן.
 * ההגנה מפני כזה היא הגבלת קצב עם מצב משותף, שאין לה כאן תשתית — אין KV,
 * ומונה בזיכרון על serverless מתאפס בין הרצות ונותן ביטחון כוזב.
 * זה נאמר במפורש כדי שאיש לא יקרא את הקובץ הזה כ"הפרויקט מוגן".
 */

/** הדומיינים שמהם האפליקציה באמת רצה. */
const ALLOWED = [
  'https://my-trip-planner-ten.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

/** פריסות תצוגה מקדימה של Vercel מקבלות כתובת אקראית בכל דחיפה. */
const PREVIEW = /^https:\/\/my-trip-planner-[a-z0-9-]+\.vercel\.app$/;

const isAllowed = (value) => {
  if (!value) return false;
  let origin;
  try {
    origin = new URL(value).origin;
  } catch {
    return false;
  }
  return ALLOWED.includes(origin) || PREVIEW.test(origin);
};

/**
 * בקשה מדפדפן שלנו?
 *
 * נבדקות שתי כותרות ולא אחת: דפדפן אינו שולח `Origin` בבקשת GET מאותו
 * מקור, ולכן בדיקה על `Origin` בלבד הייתה חוסמת את `place-website`
 * ואת `flight-status`, ששתיהן GET. `Referer` כן נשלח שם.
 */
export const fromOurSite = (req) =>
  isAllowed(req.headers?.origin) || isAllowed(req.headers?.referer);

/**
 * @returns {boolean} true אם הבקשה נדחתה והתשובה כבר נשלחה.
 *
 * ההודעה אינה מסבירה מה נכשל. "Origin לא מורשה" הוא הוראות למי שמנסה.
 */
export const rejectForeign = (req, res) => {
  if (fromOurSite(req)) return false;
  res.status(403).json({ error: 'FORBIDDEN' });
  return true;
};

/**
 * גוף בקשה גדול הוא בקשה יקרה. Gemini מתמחר לפי אסימונים, ולכן prompt
 * ענק הוא הדרך הזולה ביותר לשרוף כסף של מישהו אחר.
 */
export const rejectOversized = (req, res, maxBytes = 100_000) => {
  const declared = Number(req.headers?.['content-length'] || 0);
  const actual = declared || (req.body ? JSON.stringify(req.body).length : 0);
  if (actual > maxBytes) {
    res.status(413).json({ error: 'PAYLOAD_TOO_LARGE' });
    return true;
  }
  return false;
};
