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

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

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
