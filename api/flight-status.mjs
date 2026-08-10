/**
 * Vercel Serverless Function — סטטוס טיסה בפועל.
 *
 * מחזיר את השעות שבהן הטיסה באמת המריאה ונחתה, מול השעות המתוכננות.
 * זהו הנתון שסוגר את מעגל הפיצויים: בלעדיו המשתמש יודע מה מגיע לו אך
 * לא אם קרה משהו שמזכה.
 *
 * המפתח יושב כאן ולא נארז ל-bundle. הגדר ב-Vercel:
 *   RAPIDAPI_KEY  — אותו מפתח שכבר קיים, לאחר הוספת מנוי ל-AeroDataBox
 *
 * ── למה דרך שרת ולא ישירות מהדפדפן ──
 * מפתח שנשלח מהדפדפן גלוי לכל מבקר, ומכסת השימוש היא של בעל האתר.
 * זה בדיוק הליקוי שתוקן בקריאות ל-Gemini.
 */

const HOST = 'aerodatabox.p.rapidapi.com';

/** מונע העברת פרמטרים שרירותיים ל-API החיצוני. */
const isValidFlight = (s) => /^[A-Z0-9]{2,8}$/i.test(String(s || '').replace(/\s+/g, ''));
const isValidDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'NOT_CONFIGURED',
      message: 'מעקב הטיסות אינו מוגדר בשרת.',
    });
  }

  const flight = String(req.query.flight || '').replace(/\s+/g, '').toUpperCase();
  const date = String(req.query.date || '');

  if (!isValidFlight(flight) || !isValidDate(date)) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'מספר טיסה או תאריך אינם תקינים.' });
  }

  try {
    const upstream = await fetch(
      `https://${HOST}/flights/number/${encodeURIComponent(flight)}/${encodeURIComponent(date)}?withAircraftImage=false&withLocation=false`,
      { headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': HOST } }
    );

    if (upstream.status === 403) {
      return res.status(503).json({
        error: 'NO_SUBSCRIPTION',
        message: 'המפתח אינו מנוי ל-API של נתוני הטיסות.',
      });
    }
    if (upstream.status === 404) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'לא נמצאו נתונים לטיסה בתאריך הזה.' });
    }
    if (!upstream.ok) {
      return res.status(502).json({ error: 'UPSTREAM', status: upstream.status });
    }

    const data = await upstream.json();
    const leg = Array.isArray(data) ? data[0] : data;
    if (!leg) return res.status(404).json({ error: 'NOT_FOUND' });

    // נשלחות רק השעות הדרושות לחישוב. אין טעם להעביר לדפדפן את כל
    // המטען של הספק, והצמצום גם מקטין את שטח החשיפה.
    return res.status(200).json({
      flight: leg.number || flight,
      status: leg.status || null,
      departure: {
        airport: leg.departure?.airport?.iata || null,
        scheduled: leg.departure?.scheduledTime?.utc || null,
        actual: leg.departure?.runwayTime?.utc || leg.departure?.actualTime?.utc || null,
      },
      arrival: {
        airport: leg.arrival?.airport?.iata || null,
        scheduled: leg.arrival?.scheduledTime?.utc || null,
        // התקנה מודדת את רגע פתיחת הדלת. הנתון הקרוב ביותר שזמין הוא
        // ההגעה לעמדה; זמן הנחיתה על המסלול מוקדם ממנו ומחמיץ את
        // ההסעה, ולכן הוא רק גיבוי.
        actual: leg.arrival?.actualTime?.utc || leg.arrival?.runwayTime?.utc || null,
        atGate: !!leg.arrival?.actualTime?.utc,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'FETCH_FAILED', message: String(err?.message || err) });
  }
}
