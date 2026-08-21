/**
 * Vercel Serverless Function — האתר הרשמי של מקום.
 *
 * מחזיר את כתובת האתר של מסעדה או עסק, כדי שאפשר יהיה להזמין שולחן
 * במקום רק לקרוא עליו.
 *
 * ── למה נדרש מקור בתשלום ──
 * OpenStreetMap הוא המקור החינמי, והוא נוסה תחילה. מדידה על חמש מסעדות
 * אמיתיות החזירה שלוש עם אתר: "Da Enzo al 29" ו-"Roscioli" קיימים שם
 * כמסעדה וכמאפייה, פשוט בלי תגית אתר. זה חוסר בנתונים שתרמו מתנדבים,
 * ושיפור השאילתה אינו מרפא אותו.
 *
 * ── למה דרך שרת ולא ישירות מהדפדפן ──
 * מפתח שנשלח מהדפדפן גלוי לכל מבקר, והחיוב הוא של בעל האתר. כאן זה
 * חמור במיוחד: לשדה websiteUri יש מחיר לכל בקשה.
 *
 * הגדר ב-Vercel:
 *   GOOGLE_PLACES_KEY — מפתח עם Places API (New) מופעל
 *
 * ── עלות ──
 * $20 לאלף בקשות, ואלף חינם בחודש. הצד הקורא שומר כל תשובה לשבוע,
 * ולכן אותה מסעדה אינה נשאלת פעמיים.
 */

const SEARCH = 'https://places.googleapis.com/v1/places:searchText';

/**
 * שדה אחד בלבד.
 *
 * מסכת השדות קובעת את המחיר. בקשה שמחזירה גם ביקורות ותמונות עולה יותר
 * ומחזירה מידע שאיש כאן אינו משתמש בו.
 */
const FIELD_MASK = 'places.websiteUri,places.displayName';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = (process.env.GOOGLE_PLACES_KEY || '').trim();
  if (!key) {
    // אין מפתח אינו שגיאה: המסך פשוט לא יציג כפתור אתר, כפי שהוא
    // מתנהג גם כשלמקום אין אתר.
    return res.status(200).json({ website: '', source: 'NOT_CONFIGURED' });
  }

  const name = String(req.query.name || '').trim();
  const city = String(req.query.city || '').trim();

  // חסימת קלט ריק או ארוך מדי לפני שמשלמים על בקשה
  if (name.length < 2 || name.length > 120 || city.length > 80) {
    return res.status(400).json({ error: 'BAD_REQUEST' });
  }

  try {
    const upstream = await fetch(SEARCH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: city ? `${name}, ${city}` : name,
        maxResultCount: 1,
        languageCode: 'he',
      }),
    });

    if (!upstream.ok) {
      // כישלון מדווח ככישלון ולא כ"אין אתר". הצד הקורא לא ישמור אותו
      // במטמון, אחרת תקלה רגעית הייתה מסתירה את הכפתור לשבוע.
      return res.status(502).json({ error: 'UPSTREAM', status: upstream.status });
    }

    const data = await upstream.json();
    const place = (data.places && data.places[0]) || null;

    return res.status(200).json({
      website: (place && place.websiteUri) || '',
      matched: (place && place.displayName && place.displayName.text) || '',
      source: 'places',
    });
  } catch {
    return res.status(502).json({ error: 'UPSTREAM' });
  }
}
