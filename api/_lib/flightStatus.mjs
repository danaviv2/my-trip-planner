/**
 * שליפת סטטוס טיסה בפועל, משותפת לנקודות הקצה.
 *
 * הופרדה כדי שהבדיקה היזומה מהמסך והבדיקה התקופתית של הקרון ישתמשו באותו
 * קוד. שכפול כאן היה מוביל לכך שתיקון באחד לא חל על השני — הדפוס שחזר
 * בפרויקט הזה יותר מפעם אחת.
 */

const HOST = 'aerodatabox.p.rapidapi.com';

export const isValidFlight = (s) => /^[A-Z0-9]{2,8}$/i.test(String(s || '').replace(/\s+/g, ''));
export const isValidDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));

/**
 * @returns {{ok:true, leg:object} | {ok:false, code:string}}
 */
export const fetchFlight = async (flight, date) => {
  const apiKey = (process.env.RAPIDAPI_KEY || '').trim();
  if (!apiKey) return { ok: false, code: 'NOT_CONFIGURED' };

  const num = String(flight).replace(/\s+/g, '').toUpperCase();
  if (!isValidFlight(num) || !isValidDate(date)) return { ok: false, code: 'BAD_REQUEST' };

  try {
    const res = await fetch(
      `https://${HOST}/flights/number/${encodeURIComponent(num)}/${encodeURIComponent(date)}` +
      '?withAircraftImage=false&withLocation=false',
      {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': HOST,
          // סביבת השרת אינה שולחת User-Agent כברירת מחדל, ויש שערים
          // שדוחים בקשה כזו ב-403 — שגיאה שנראית כמו בעיית הרשאה.
          'User-Agent': 'my-trip-planner/1.0',
          Accept: 'application/json',
        },
      }
    );

    if (res.status === 403) return { ok: false, code: 'NO_SUBSCRIPTION' };
    if (res.status === 404) return { ok: false, code: 'NOT_FOUND' };
    if (!res.ok) return { ok: false, code: `UPSTREAM_${res.status}` };

    const data = await res.json();
    const leg = Array.isArray(data) ? data[0] : data;
    if (!leg) return { ok: false, code: 'NOT_FOUND' };
    return { ok: true, leg };
  } catch (err) {
    return { ok: false, code: 'FETCH_FAILED' };
  }
};

const minutesBetween = (a, b) => {
  if (!a || !b) return null;
  const t1 = Date.parse(a);
  const t2 = Date.parse(b);
  if (Number.isNaN(t1) || Number.isNaN(t2)) return null;
  return Math.round((t2 - t1) / 60000);
};

/**
 * מחשב את העיכוב מתוך תשובת הספק.
 *
 * העיכוב שקובע לפיצוי הוא בהגעה ולא בהמראה: טיסה שיצאה באיחור שעה ונחתה
 * בזמן אינה מזכה בדבר. לכן שעת ההגעה מועדפת, וכשהיא אינה זמינה עדיין
 * מדווח עיכוב ההמראה ומסומן ככזה במפורש.
 *
 * @returns {{departureDelay:number|null, arrivalDelay:number|null,
 *            delay:number|null, basis:'arrival'|'departure'|null, status:string}}
 */
export const delayFrom = (leg) => {
  const dep = leg.departure || {};
  const arr = leg.arrival || {};

  const departureDelay = minutesBetween(
    dep.scheduledTime?.utc,
    dep.runwayTime?.utc || dep.actualTime?.utc
  );

  // התקנה מודדת את רגע פתיחת הדלת. ההגעה לעמדה היא הנתון הקרוב ביותר;
  // זמן הנחיתה על המסלול מוקדם ממנו ומחמיץ את ההסעה, ולכן הוא גיבוי.
  const arrivalDelay = minutesBetween(
    arr.scheduledTime?.utc,
    arr.actualTime?.utc || arr.runwayTime?.utc
  );

  const basis = arrivalDelay != null ? 'arrival' : departureDelay != null ? 'departure' : null;

  return {
    departureDelay,
    arrivalDelay,
    delay: arrivalDelay != null ? arrivalDelay : departureDelay,
    basis,
    status: leg.status || '',
    departureAirport: dep.airport?.iata || '',
    arrivalAirport: arr.airport?.iata || '',
  };
};
