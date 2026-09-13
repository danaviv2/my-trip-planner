/**
 * נקודת כניסה יחידה לכל הקריאות ל-Gemini.
 *
 * בפרודקשן: הבקשה עוברת דרך /api/gemini — פונקציית שרת ב-Vercel שמחזיקה את
 * המפתח. המפתח לא נארז ל-bundle ולכן לא נחשף למשתמשי האתר.
 *
 * בפיתוח מקומי: אם קיים REACT_APP_GEMINI_API_KEY ב-.env פונים ישירות ל-Google,
 * כך ש-`npm start` ממשיך לעבוד בלי להריץ `vercel dev`.
 */

// חשוב: התנאי על NODE_ENV נבדק בזמן הבילד. בבילד פרודקשן כל הענף הזה נמחק
// על ידי webpack, ולכן המפתח לא נארז ל-bundle גם אם הוא מוגדר בסביבת הבנייה.
const DEV_KEY =
  process.env.NODE_ENV !== 'production'
    ? process.env.REACT_APP_GEMINI_API_KEY || null
    : null;

// ── מודל לכל סוג משימה, במקום אחד ──
// עד 14.09.2026 שם המודל היה כתוב ב-11 קבצים. אז התגלה ש-`gemini-2.5-flash`
// חסום לפרויקטים חדשים ("no longer available to new users"), כלומר יום אחד
// גם הפרויקט הנוכחי יאבד אותו. מעבר מסודר דורש להחליף מודל **ואת** הגדרות
// ההרצה שלו יחד — ב-Gemini 3 אי אפשר לכבות חשיבה, והיא נספרת בתוך
// `maxOutputTokens`. שני דברים שמשתנים יחד חייבים לגור באותו מקום.
export const GEMINI_MODELS = {
  parse: 'gemini-2.5-flash',     // פענוח אישורי הזמנה ממייל ומ-PDF — דיוק קודם לכול
  content: 'gemini-2.5-flash',   // תוכן יעדים, מלונות, רכב, אטרקציות, ביטויים, יומן
  itinerary: 'gemini-2.5-flash', // מסלולים יומיים ועצירות בטיול המתגלגל
  chat: 'gemini-2.5-flash',      // עוזר הטיול בשיחה
};

export const DEFAULT_GEMINI_MODEL = GEMINI_MODELS.content;

/**
 * הגדרות ההרצה (`generationConfig`) למודל נתון.
 *
 * הקורא מתאר מה הוא צריך — אורך תשובה, יצירתיות, JSON — והפונקציה מתרגמת
 * לשפת המודל. ב-2.5 זה בדיוק מה שנכתב עד היום בכל קובץ: החשיבה כבויה
 * (`thinkingBudget: 0`), כי היא נספרת בתוך `maxOutputTokens` ובלעדיה
 * תשובות נקטעו (נמדד בעוזר הטיול: 487 מתוך 512 טוקנים נשרפו על חשיבה).
 */
export function generationFor(model, { maxOutputTokens, temperature, ...rest } = {}) {
  const cfg = { ...rest };
  if (maxOutputTokens != null) cfg.maxOutputTokens = maxOutputTokens;
  if (temperature != null) cfg.temperature = temperature;
  cfg.thinkingConfig = { thinkingBudget: 0 };
  return cfg;
}

/** ה-Gemini זמין תמיד: מקומית דרך המפתח, בפרודקשן דרך הפרוקסי. */
export const isGeminiAvailable = () => true;

/** מחזיר את כתובת ה-endpoint המתאימה לסביבה הנוכחית. */
export function geminiEndpoint(model = DEFAULT_GEMINI_MODEL) {
  return DEV_KEY
    ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${DEV_KEY}`
    : `/api/gemini?model=${encodeURIComponent(model)}`;
}

/** כתובת ה-endpoint לתשובות בזרימה (SSE). */
export function geminiStreamEndpoint(model = DEFAULT_GEMINI_MODEL) {
  return DEV_KEY
    ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${DEV_KEY}&alt=sse`
    : `/api/gemini?model=${encodeURIComponent(model)}&stream=1`;
}

/**
 * שולח בקשה ל-Gemini ומחזיר את אובייקט ה-Response הגולמי,
 * כדי שקוד קיים שבודק res.ok / res.json() ימשיך לעבוד ללא שינוי.
 */
export function callGemini(body, { model = DEFAULT_GEMINI_MODEL, signal } = {}) {
  return fetch(geminiEndpoint(model), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
    signal,
  });
}
