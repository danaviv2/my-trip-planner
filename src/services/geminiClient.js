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
  // פענוח: נמדד 14.09.2026 על 10 מיילים אמיתיים, כרטיס טיסה ו-4 קבצי PDF.
  // 3.8 ⟵ 41/41 ו-PDF זהה ל-2.5; מספר ההפניה התחלף בין ריצות, וזה נפתר
  // בזהות כקבוצה (`referencesOf`) ובשדה otherReferences — שב-3.8 חזר עקבי
  // ונקי, ובו 2.5 הכניס קוד סודי. PDF עולה ~70% יותר טוקנים בדור 3.
  parse: 'gemini-3.8-flash',     // פענוח אישורי הזמנה ממייל ומ-PDF — דיוק קודם לכול
  content: 'gemini-3.8-flash',   // תוכן יעדים, מלונות, רכב, אטרקציות, ביטויים, יומן
  itinerary: 'gemini-3.8-flash', // מסלולים יומיים ועצירות בטיול המתגלגל
  // צ'אט: נמדד 14.09.2026 על 4 שיחות אמיתיות + נתיב הזרימה. 3.8 ענה על שאלה
  // ש-2.5 התחמק ממנה ושקל משפחה ותקציב, אך איטי פי ~2 (2.5–5.7s מול 1.5–3s)
  // וארוך יותר ("טיפ אחד קצר": 57 מילים מול 16). האורך נתחם בפרומפט.
  chat: 'gemini-3.8-flash',      // עוזר הטיול בשיחה
};

export const DEFAULT_GEMINI_MODEL = GEMINI_MODELS.content;

// ── הגדרת חשיבה לכל מודל, לא לכל דור ──
// נמדד 14.09.2026 מול השרת החי, עם בדיקת `modelVersion` בכל קריאה:
//   3.5-flash-lite: thinkingBudget:0 ⟵ 400;  minimal ⟵ 0 טוקני חשיבה
//   3.6-flash:      thinkingBudget:0 ⟵ 400;  minimal ⟵ 0;  low ⟵ תשובה נקטעה
//   3.8-flash:      minimal ⟵ 400;           low ⟵ 0;  בלי הגדרה ⟵ תשובה ריקה
// כלל "לפי דור" היה שולח `minimal` ל-3.8 ומקבל 400 בכל קריאה.
// העותק בשרת (`api/gemini.mjs`, `THINKING`) חייב להיות זהה.
export const THINKING = {
  'gemini-2.5-flash': { thinkingBudget: 0 },
  'gemini-2.5-pro': { thinkingBudget: 128 },
  'gemini-3.5-flash-lite': { thinkingLevel: 'minimal' },
  'gemini-3.5-flash': { thinkingLevel: 'minimal' },
  'gemini-3.6-flash': { thinkingLevel: 'minimal' },
  'gemini-3.7-flash': { thinkingLevel: 'low' },
  'gemini-3.8-flash': { thinkingLevel: 'low' },
};

/**
 * הגדרות ההרצה (`generationConfig`) למודל נתון.
 *
 * הקורא מתאר מה הוא צריך — אורך תשובה, יצירתיות, JSON — והפונקציה מתרגמת
 * לשפת המודל. החשיבה נספרת בתוך `maxOutputTokens`, ובלי הגבלה היא שורפת
 * את התשובה (נמדד בעוזר הטיול: 487 מתוך 512 טוקנים; ב-3.8 — תשובה ריקה).
 * בדור 3 `temperature` מושמט: Google ממליצה במפורש להשאיר 1.0, ומתחת לזה
 * "עלול לגרום ללולאות או לביצועים ירודים".
 */
export function generationFor(model, { maxOutputTokens, temperature, ...rest } = {}) {
  const cfg = { ...rest };
  if (maxOutputTokens != null) cfg.maxOutputTokens = maxOutputTokens;
  const gen3 = /^gemini-3/.test(model);
  if (temperature != null && !gen3) cfg.temperature = temperature;
  cfg.thinkingConfig = THINKING[model] || (gen3 ? { thinkingLevel: 'low' } : { thinkingBudget: 0 });
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
