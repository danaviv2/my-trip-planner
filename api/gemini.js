/**
 * Vercel Serverless Function — פרוקסי ל-Google Gemini.
 *
 * המפתח יושב כאן, בצד השרת, ולעולם לא נארז ל-bundle של הדפדפן.
 * הגדר אותו ב-Vercel כמשתנה סביבה בשם GEMINI_API_KEY (בלי הקידומת REACT_APP_).
 */

// רשימת היתר — מונע ממישהו לשלוח model שרירותי דרך ה-query string
const ALLOWED_MODELS = new Set([
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
]);

const DEFAULT_MODEL = 'gemini-2.5-flash';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: { message: 'GEMINI_API_KEY is not configured on the server' },
    });
  }

  const requested = req.query.model;
  const model = ALLOWED_MODELS.has(requested) ? requested : DEFAULT_MODEL;
  const stream = req.query.stream === '1';

  const method = stream ? 'streamGenerateContent' : 'generateContent';
  const suffix = stream ? '&alt=sse' : '';

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:${method}?key=${apiKey}${suffix}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
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
