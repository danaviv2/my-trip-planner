/**
 * Vercel Serverless Function — הצעות טיסה עם מה שהמחיר אינו כולל.
 *
 * ── מה זה עושה, ומה זה במפורש אינו עושה ──
 * מציג. לא מוכר. אין כאן הזמנה, אין תשלום, ואין אחריות על כרטיס —
 * המשתמש רואה את התמונה המלאה וממשיך לאתר של חברת התעופה. זה מה שמסיר
 * רישוי, גביית כספים ותמיכה מהמשוואה.
 *
 * ── מה באמת מוסתר ──
 * מנועי החיפוש אינם מסתירים מחירים זולים; הם מסתירים את מה שהמחיר אינו
 * כולל. תעריף בלי מזוודה, קנס שינוי, כרטיס שאינו בר-החזר. המספר בעמוד
 * הראשון נכון פורמלית ומטעה בפועל, והמודל שלהם בנוי על להציג את הנמוך
 * ביותר. לכן מוחזרים כאן גם הכבודה וגם תנאי השינוי והביטול — הנתונים
 * שהופכים "180 יורו" ל"244 עבורך", ולעיתים הופכים את הסדר בין ההצעות.
 *
 * ── למה Duffel ולא Amadeus ──
 * המסלול העצמי של Amadeus, שהיה ההמלצה הראשונה, בוטל ב-17 ביולי ונשאר
 * רק מסלול ארגוני עם חוזה. דפי התיעוד שלהם עדיין מתארים אותו — האתר
 * החי אמר את האמת והתיעוד לא. Duffel פתוח להרשמה עצמית, מנפיק אסימון
 * בדיקות מיד, ומחזיר את שני השדות שבגללם כל זה נבנה.
 *
 * הגדר ב-Vercel:
 *   DUFFEL_TOKEN — אסימון מהלוח, מתחיל ב-duffel_test או duffel_live
 */

const API = 'https://api.duffel.com/air/offer_requests?return_offers=true';
const VERSION = 'v2';

const isIata = (s) => /^[A-Z]{3}$/.test(String(s || '').toUpperCase());
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));

/**
 * הכבודה הכלולה, כפי שהתעריף מצהיר עליה.
 *
 * נלקחת מהמקטע הראשון: חברות מצהירות לכל מקטע, והמקטע הפותח הוא מה
 * שקובע מה מותר לארוז ביציאה.
 */
const baggageOf = (offer) => {
  const seg = offer?.slices?.[0]?.segments?.[0];
  const bags = seg?.passengers?.[0]?.baggages || [];
  const find = (type) => bags.find((b) => b.type === type);
  const checked = find('checked');
  const carry = find('carry_on');
  return {
    checked: checked ? Number(checked.quantity) : null,
    carryOn: carry ? Number(carry.quantity) : null,
  };
};

/**
 * תנאי שינוי וביטול.
 *
 * זהו החלק שאף מנוע חיפוש אינו מציג לפני התשלום, והוא שמכריע אם
 * הכרטיס הזול באמת זול. ערך null פירושו שהמידע לא הוחזר — ואין
 * להציגו כ"לא ניתן", שכן היעדר ידיעה אינו תשובה.
 */
const conditionOf = (raw) => {
  if (!raw) return null;
  return {
    allowed: raw.allowed === true,
    penalty: raw.penalty_amount != null ? Number(raw.penalty_amount) : null,
    currency: raw.penalty_currency || '',
  };
};

const simplify = (offer) => {
  const slice = offer.slices?.[0];
  const segs = slice?.segments || [];
  const first = segs[0];
  const last = segs[segs.length - 1];

  return {
    id: offer.id,
    price: Number(offer.total_amount || 0),
    currency: offer.total_currency || '',
    carrier: offer.owner?.iata_code || '',
    carrierName: offer.owner?.name || '',
    flightNumber: first ? `${first.marketing_carrier?.iata_code || ''}${first.marketing_carrier_flight_number || ''}` : '',
    from: first?.origin?.iata_code || '',
    to: last?.destination?.iata_code || '',
    departsAt: first?.departing_at || '',
    arrivesAt: last?.arriving_at || '',
    stops: Math.max(0, segs.length - 1),
    duration: slice?.duration || '',
    fareBrand: slice?.fare_brand_name || '',
    // שני השדות שבגללם התכונה קיימת
    baggage: baggageOf(offer),
    change: conditionOf(offer.conditions?.change_before_departure),
    refund: conditionOf(offer.conditions?.refund_before_departure),
  };
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = (process.env.DUFFEL_TOKEN || '').trim();
  if (!token) {
    // אין אסימון אינו שגיאה: המסך פשוט לא יציג את החלק הזה, כמו בשאר
    // השירותים כאן.
    return res.status(200).json({ offers: [], source: 'NOT_CONFIGURED' });
  }

  const from = String(req.query.from || '').toUpperCase();
  const to = String(req.query.to || '').toUpperCase();
  const date = String(req.query.date || '');
  const adults = Math.min(9, Math.max(1, Number(req.query.adults) || 1));

  if (!isIata(from) || !isIata(to) || !isDate(date)) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'קוד שדה או תאריך אינם תקינים.' });
  }

  try {
    const upstream = await fetch(API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Duffel-Version': VERSION,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        data: {
          slices: [{ origin: from, destination: to, departure_date: date }],
          passengers: Array.from({ length: adults }, () => ({ type: 'adult' })),
          cabin_class: 'economy',
        },
      }),
    });

    if (!upstream.ok) {
      const body = await upstream.text();
      return res.status(502).json({ error: 'UPSTREAM', status: upstream.status, detail: body.slice(0, 400) });
    }

    const data = await upstream.json();
    const offers = (data.data?.offers || []).slice(0, 20).map(simplify);

    return res.status(200).json({
      offers,
      // מדדי שקיפות. אם הם נמוכים, התכונה אינה שווה מסך — ועדיף לדעת
      // זאת לפני שבונים אחד.
      withBaggage: offers.filter((o) => o.baggage.checked != null).length,
      withConditions: offers.filter((o) => o.change || o.refund).length,
      mode: token.startsWith('duffel_live') ? 'live' : 'test',
    });
  } catch {
    return res.status(502).json({ error: 'UPSTREAM' });
  }
}
