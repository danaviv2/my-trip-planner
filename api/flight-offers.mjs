/**
 * Vercel Serverless Function — הצעות טיסה עם מה שהמחיר לא כולל.
 *
 * ── מה זה עושה, ומה זה במפורש אינו עושה ──
 * מציג. לא מוכר. אין כאן הזמנה, אין תשלום, ואין אחריות על כרטיס —
 * המשתמש רואה את התמונה המלאה וממשיך לאתר של חברת התעופה.
 *
 * ── מה מוסתר, לפי מדידה ולא לפי הנחה ──
 * מנועי החיפוש אינם מסתירים מחירים זולים; הם מסתירים את מה שהמחיר אינו
 * כולל. תעריף Light בלי מזוודה, קנס שינוי, מושבים שאינם צמודים. המספר
 * שמוצג בעמוד הראשון נכון פורמלית ומטעה בפועל, וזה לא במקרה: המודל שלהם
 * בנוי על להציג את הנמוך ביותר.
 *
 * לכן מוחזר גם includedCheckedBags לכל הצעה — הנתון שהופך "180 יורו"
 * ל"244 יורו עבורך", ומשנה איזו טיסה באמת הזולה.
 *
 * הגדר ב-Vercel:
 *   AMADEUS_CLIENT_ID
 *   AMADEUS_CLIENT_SECRET
 *   AMADEUS_ENV        — 'test' (ברירת מחדל) או 'production'
 *
 * ── עלות ──
 * Flight Offers Search: 2,000 בקשות חינם בחודש, ואין חובת הזמנה. סביבת
 * הבדיקות חינמית לחלוטין, ונתוניה חלקיים במכוון — לכן היא מספיקה כדי
 * לדעת אם השדות קיימים, ולא כדי להסיק על מחירים אמיתיים.
 */

const HOSTS = {
  test: 'https://test.api.amadeus.com',
  production: 'https://api.amadeus.com',
};

const isIata = (s) => /^[A-Z]{3}$/.test(String(s || '').toUpperCase());
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));

/**
 * אסימון גישה.
 *
 * תקף לכחצי שעה, ולכן נשמר בזיכרון הפונקציה. בקשת אסימון לכל חיפוש
 * הייתה מכפילה את מספר הקריאות ואת זמן התגובה בלי צורך.
 */
let cachedToken = { value: '', expires: 0 };

const getToken = async (host, id, secret) => {
  if (cachedToken.value && Date.now() < cachedToken.expires) return cachedToken.value;

  const res = await fetch(`${host}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: id,
      client_secret: secret,
    }),
  });

  if (!res.ok) return '';
  const data = await res.json();
  if (!data.access_token) return '';

  // שוליים של דקה, כדי לא לשלוח אסימון שפג בדיוק בדרך
  cachedToken = {
    value: data.access_token,
    expires: Date.now() + Math.max(0, (data.expires_in || 1800) - 60) * 1000,
  };
  return cachedToken.value;
};

/** כמה מזוודות כלולות, כפי שהתעריף מצהיר. */
const includedBags = (offer) => {
  const seg = offer?.travelerPricings?.[0]?.fareDetailsBySegment?.[0];
  const bags = seg?.includedCheckedBags;
  if (!bags) return null;
  // חברות מדווחות או במספר פריטים או במשקל — שתיהן משמעותיות
  if (typeof bags.quantity === 'number') return { quantity: bags.quantity };
  if (bags.weight) return { weight: bags.weight, unit: bags.weightUnit || '' };
  return null;
};

const simplify = (offer) => {
  const itin = offer.itineraries?.[0];
  const segs = itin?.segments || [];
  const first = segs[0];
  const last = segs[segs.length - 1];

  return {
    id: offer.id,
    price: Number(offer.price?.grandTotal || offer.price?.total || 0),
    currency: offer.price?.currency || '',
    carrier: first?.carrierCode || '',
    flightNumber: first ? `${first.carrierCode}${first.number}` : '',
    from: first?.departure?.iataCode || '',
    to: last?.arrival?.iataCode || '',
    departsAt: first?.departure?.at || '',
    arrivesAt: last?.arrival?.at || '',
    stops: Math.max(0, segs.length - 1),
    duration: itin?.duration || '',
    // השדה שבגללו כל זה נבנה
    includedCheckedBags: includedBags(offer),
    fareBrand: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.brandedFareLabel || '',
    cabin: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || '',
  };
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id = (process.env.AMADEUS_CLIENT_ID || '').trim();
  const secret = (process.env.AMADEUS_CLIENT_SECRET || '').trim();

  if (!id || !secret) {
    // אין מפתח אינו שגיאה: המסך פשוט לא יציג את החלק הזה, כפי שנעשה
    // גם בשירותים האחרים כאן.
    return res.status(200).json({ offers: [], source: 'NOT_CONFIGURED' });
  }

  const host = HOSTS[(process.env.AMADEUS_ENV || 'test').trim()] || HOSTS.test;

  const from = String(req.query.from || '').toUpperCase();
  const to = String(req.query.to || '').toUpperCase();
  const date = String(req.query.date || '');
  const adults = Math.min(9, Math.max(1, Number(req.query.adults) || 1));

  if (!isIata(from) || !isIata(to) || !isDate(date)) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'קוד שדה או תאריך אינם תקינים.' });
  }

  try {
    const token = await getToken(host, id, secret);
    if (!token) return res.status(502).json({ error: 'AUTH_FAILED' });

    const url =
      `${host}/v2/shopping/flight-offers?originLocationCode=${from}` +
      `&destinationLocationCode=${to}&departureDate=${date}&adults=${adults}` +
      '&currencyCode=EUR&max=12';

    const upstream = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

    if (!upstream.ok) {
      const body = await upstream.text();
      return res.status(502).json({ error: 'UPSTREAM', status: upstream.status, detail: body.slice(0, 300) });
    }

    const data = await upstream.json();
    const offers = (data.data || []).map(simplify);

    return res.status(200).json({
      offers,
      // מדד שקיפות: כמה מההצעות בכלל הצהירו על כבודה. אם הוא נמוך,
      // התכונה אינה שווה מסך — ועדיף לדעת זאת עכשיו.
      withBaggageInfo: offers.filter((o) => o.includedCheckedBags).length,
      source: host.includes('test.') ? 'test' : 'production',
    });
  } catch {
    return res.status(502).json({ error: 'UPSTREAM' });
  }
}
