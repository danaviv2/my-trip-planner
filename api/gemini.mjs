/**
 * Vercel Serverless Function — פרוקסי ל-Google Gemini.
 *
 * המפתח יושב כאן, בצד השרת, ולעולם לא נארז ל-bundle של הדפדפן.
 * הגדר אותו ב-Vercel כמשתנה סביבה בשם GEMINI_API_KEY (בלי הקידומת REACT_APP_).
 */

import { rejectForeign, rejectOversized } from './_lib/guard.mjs';

// רשימת היתר — מונע ממישהו לשלוח model שרירותי דרך ה-query string.
// 2.0 ו-1.5 הוסרו: 2.0 נסגר ב-01.06.2026 ו-1.5 אינו מופיע עוד ברשימת
// המודלים של Google (נבדק 14.09.2026). הלקוח אינו מבקש אף אחד מהם.
const ALLOWED_MODELS = new Set([
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
]);

const DEFAULT_MODEL = 'gemini-2.5-flash';

// ── חזרה אחורה בלי שינוי קוד ──
// `GEMINI_FORCE_MODEL` ב-Vercel מחליף כל מודל שהלקוח ביקש. הוא קיים בשביל
// יום אחד: מעבר למודל חדש שמתגלה כשגוי באתר החי. משנים משתנה, פורסים מחדש,
// וכל הקריאות חוזרות למודל הקודם — בלי revert ובלי בילד של הלקוח.
//
// הלקוח בונה `thinkingConfig` למודל שחשב שהוא מקבל, וכל מודל מקבל ערך
// אחר (3.8 דוחה `minimal`, 3.6 דוחה `thinkingBudget`). בלי תרגום, חזרה
// אחורה הייתה נכשלת בדיוק ברגע שהיא נחוצה.
// אותה טבלה כמו `THINKING` ב-src/services/geminiClient.js — ראה שם את
// המדידות. בדיקה ב-scratchpad משווה את שתיהן; אי-התאמה = 400 בחזרה אחורה.
const THINKING = {
  'gemini-2.5-flash': { thinkingBudget: 0 },
  'gemini-2.5-pro': { thinkingBudget: 128 },
  'gemini-3.5-flash-lite': { thinkingLevel: 'minimal' },
  'gemini-3.5-flash': { thinkingLevel: 'minimal' },
  'gemini-3.6-flash': { thinkingLevel: 'minimal' },
  'gemini-3.7-flash': { thinkingLevel: 'low' },
  'gemini-3.8-flash': { thinkingLevel: 'low' },
};

export const adaptBody = (body, requested, model) => {
  if (!body || typeof body !== 'object' || requested === model) return body;
  const cfg = { ...(body.generationConfig || {}) };
  cfg.thinkingConfig = THINKING[model];
  if (/^gemini-3/.test(model)) delete cfg.temperature; // Google: מתחת ל-1.0 עלול לגרום ללולאות
  return { ...body, generationConfig: cfg };
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  // נמדד חי ב-04.09.2026: POST אנונימי מ-curl החזיר תשובה מלאה מ-Gemini,
  // על חשבון בעל האתר. אימות זהות אינו אפשרי כאן — שמונה מסכים ציבוריים
  // קוראים ל-Gemini, ראה ההסבר ב-`_lib/guard.mjs`.
  if (rejectForeign(req, res)) return;
  if (rejectOversized(req, res)) return;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: { message: 'GEMINI_API_KEY is not configured on the server' },
    });
  }

  const requested = ALLOWED_MODELS.has(req.query.model) ? req.query.model : DEFAULT_MODEL;
  const forced = process.env.GEMINI_FORCE_MODEL;
  const model = forced && ALLOWED_MODELS.has(forced) ? forced : requested;
  const body = adaptBody(req.body, requested, model);
  const stream = req.query.stream === '1';

  const method = stream ? 'streamGenerateContent' : 'generateContent';
  const suffix = stream ? '&alt=sse' : '';

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:${method}?key=${apiKey}${suffix}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    // מצב streaming: מזרימים את ה-SSE כמו שהוא ללקוח
    if (stream && upstream.ok && upstream.body) {
      res.status(upstream.status);
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');

      const reader = upstream.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      return res.end();
    }

    // מעבירים את גוף התשובה כמו שהוא כדי ששגיאות Gemini יגיעו ללקוח ללא שינוי
    const payload = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', 'application/json');
    return res.send(payload);
  } catch {
    return res.status(502).json({
      error: { message: 'Upstream request to Gemini failed' },
    });
  }
}
