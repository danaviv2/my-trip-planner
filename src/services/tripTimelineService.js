/**
 * הופך הזמנות לרצף אירועים לפי זמן.
 *
 * המסך הציג עד כה את הנסיעה לפי סוג — כל הטיסות, כל המלונות, כל הרכבים.
 * אבל אף אחד אינו חושב על נסיעה כך. השאלה היא "נחתתי ב-17:15, איך אני
 * מגיע למלון ומתי אוסף את הרכב", ולענות עליה דרש לפתוח כל כרטיס, לקרוא
 * תאריכים, ולסדר אותם בראש. המידע היה שם; הסידור לא.
 *
 * שתי הבחנות שמכתיבות את המבנה:
 *
 * • הזמנה אינה בהכרח אירוע אחד. מלון הוא כניסה ויציאה, רכב הוא איסוף
 *   והחזרה — שני רגעים נפרדים בימים שונים, ולעיתים בערים שונות. הצגתם
 *   כשורה אחת הסתירה את יום היציאה לגמרי.
 *
 * • ביטוח אינו אירוע. הוא חל על כל הנסיעה, ומקומו בכותרת ולא בציר.
 */

import { dateKey } from './bookingIdentity';

const MINUTE = 60000;

/** שעה תקנית, או null. שעה שגויה עדיפה כחסרה על פני ניחוש. */
const timeOf = (v) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(v || '').trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h >= 0 && h < 24 && min >= 0 && min < 60 ? { h, min } : null;
};

/**
 * רגע בזמן מתאריך ומשעה.
 *
 * אירוע בלי שעה מקבל את תחילת היום, אך מסומן ב-allDay — כדי שלא יוצג
 * כאילו הוא קורה בחצות, ולא ייכנס לחישוב פערים שאין לו בסיס.
 */
const momentOf = (date, time) => {
  const key = dateKey(date);
  if (!key) return null;
  const [y, mo, d] = key.split('-').map(Number);
  const t = timeOf(time);
  return {
    at: new Date(y, mo - 1, d, t ? t.h : 0, t ? t.min : 0),
    allDay: !t,
    dayKey: key,
  };
};

/**
 * מיקום האירוע בתוך היום כשאין לו שעה מפורשת.
 *
 * שעת הכניסה שמופיעה באישור היא מדיניות המלון ("מ-15:00"), לא השעה שבה
 * הגעת. הצבתה כשעה אמיתית דחפה את הכניסה למלון לפני ההסעה מהשדה — כלומר
 * הגעת ללינה שלוש שעות לפני שיצאת מנמל התעופה.
 *
 * הסדר הנכון נגזר מהמשמעות ולא מהשעה: יציאה ממלון פותחת את היום, וכניסה
 * למלון סוגרת אותו. זה נכון כמעט תמיד, ובוודאי נכון יותר מברירת מחדל.
 */
const DAY_ANCHOR = { 'hotel-out': -1, 'hotel-in': 24 * 60 + 1 };

const orderOf = (kind, moment) =>
  moment.allDay && DAY_ANCHOR[kind] != null
    ? DAY_ANCHOR[kind]
    : moment.at.getHours() * 60 + moment.at.getMinutes();

const EVENT_META = {
  flight: { icon: '✈️', color: '#1976d2', label: 'טיסה' },
  'hotel-in': { icon: '🏨', color: '#7b1fa2', label: 'כניסה למלון' },
  'hotel-out': { icon: '🧳', color: '#7b1fa2', label: 'יציאה מהמלון' },
  'car-pickup': { icon: '🚗', color: '#e65100', label: 'איסוף רכב' },
  'car-return': { icon: '🔑', color: '#e65100', label: 'החזרת רכב' },
  transfer: { icon: '🚕', color: '#f9a825', label: 'הסעה' },
  activity: { icon: '🎟️', color: '#2e7d32', label: 'פעילות' },
  custom: { icon: '📌', color: '#00838f', label: 'תוכנית' },
};

/**
 * טקסט המיקום של כל אירוע.
 *
 * לא כל אירוע יושב במקום של ההזמנה: איסוף רכב והחזרתו הם שתי כתובות
 * שונות באותה רשומה, ולעיתים בשתי ערים. מיקום אחד לכל הזמנה היה מציב את
 * ההחזרה ברומא על נקודת האיסוף בנאפולי.
 */
export const placeOf = (kind, b) => {
  switch (kind) {
    case 'hotel-in':
    case 'hotel-out':
      return b.address || b.name || '';
    case 'car-pickup':
      return b.pickupLocation || '';
    case 'car-return':
      return b.returnLocation || b.pickupLocation || '';
    case 'transfer':
      return b.pickupLocation || '';
    case 'activity':
      return b.location || b.name || '';
    case 'custom':
      return b.location || '';
    default:
      return '';
  }
};

/** קואורדינטות שנשמרו לאירוע הזה, אם אותרו. */
const coordsOf = (kind, b) => {
  const g = b.geo && b.geo[kind];
  return g && Number.isFinite(Number(g.lat)) && Number.isFinite(Number(g.lng))
    ? { lat: Number(g.lat), lng: Number(g.lng), unverified: !!g.unverified }
    : null;
};

/** כותרת ותיאור לכל סוג, בשפה שאדם היה משתמש בה. */
const describe = (kind, b) => {
  switch (kind) {
    case 'flight':
      return {
        title: [b.flightNumber, b.airline && b.airline.length <= 12 ? b.airline : ''].filter(Boolean).join(' · ') || 'טיסה',
        detail: b.departureAirport && b.arrivalAirport ? `${b.departureAirport} → ${b.arrivalAirport}` : '',
        extra: b.arrivalTime ? `נחיתה ${b.arrivalTime}${b.terminal ? ` · טרמינל ${b.terminal}` : ''}` : '',
      };
    case 'hotel-in':
      return { title: b.name || 'לינה', detail: b.address || '', extra: '' };
    case 'hotel-out':
      return { title: `יציאה · ${b.name || 'לינה'}`, detail: '', extra: '' };
    case 'car-pickup':
      return { title: `איסוף רכב · ${b.company || ''}`.trim(), detail: b.pickupLocation || '', extra: b.carType || '' };
    case 'car-return':
      return { title: `החזרת רכב · ${b.company || ''}`.trim(), detail: b.returnLocation || '', extra: '' };
    case 'transfer':
      return {
        title: `הסעה · ${b.company || ''}`.trim(),
        detail: b.pickupLocation || '',
        extra: b.returnLocation ? `אל ${b.returnLocation}` : '',
      };
    case 'activity':
      return { title: b.name || 'פעילות', detail: b.location || '', extra: b.participants ? `${b.participants} משתתפים` : '' };
    case 'custom':
      return { title: b.title || 'פריט בתוכנית', detail: b.location || '', extra: b.note || '' };
    default:
      return { title: '', detail: '', extra: '' };
  }
};

/**
 * תיקון שהמשתמש הזין, אם יש.
 *
 * ── למה שכבה נפרדת ולא כתיבה על השדה ──
 * מייל האישור נשאר בתיבה לנצח, וכל סריקה מייבאת אותו מחדש. כתיבת השעה
 * המתוקנת ישירות על ההזמנה הייתה מחזיקה עד הסריקה הבאה בלבד, ואז חוזרת
 * לערך שבאישור — בלי שדבר יסמן שזה קרה. שדה שאף מפענח אינו כותב אליו
 * הוא היחיד שיכול לשרוד את הייבוא.
 *
 * המפתח הוא סוג האירוע: איסוף רכב והחזרתו הם שני רגעים באותה רשומה,
 * ותיקון של אחד אינו נוגע לשני.
 */
const overrideFor = (b, kind) => (b && b.overrides && b.overrides[kind]) || null;

/** הזמנה אחת → אירוע אחד או שניים. */
export const eventsFor = (b) => {
  const out = [];
  const push = (kind, date, time) => {
    const ov = overrideFor(b, kind);

    // מחיקת השעה היא ערך לגיטימי ולא היעדר תיקון: "לא יודע מתי" הוא
    // מידע. לכן נבדקת נוכחות המפתח ולא האם הערך ריק.
    const m = momentOf(
      ov && ov.date ? ov.date : date,
      ov && 'time' in ov ? ov.time : time
    );
    if (!m) return;

    const base = describe(kind, b);

    out.push({
      kind, booking: b, ...m, order: orderOf(kind, m),
      place: (ov && ov.place) || placeOf(kind, b),
      coords: coordsOf(kind, b),
      ...base,
      ...EVENT_META[kind],
      ...(ov && ov.title ? { title: ov.title } : {}),
      ...(ov && ov.place ? { detail: ov.place } : {}),
      edited: !!ov,
    });
  };

  switch (b.type) {
    case 'flight':
      push('flight', b.date, b.departureTime);
      break;
    case 'hotel':
      push('hotel-in', b.checkIn, b.checkInTime);
      // יום היציאה נעלם לגמרי כשהמלון הוצג כשורה אחת, אף שהוא קובע את
      // תחילת היום האחרון.
      if (dateKey(b.checkOut) && dateKey(b.checkOut) !== dateKey(b.checkIn)) {
        push('hotel-out', b.checkOut, b.checkOutTime);
      }
      break;
    case 'car_rental':
      push('car-pickup', b.pickupDate, b.pickupTime);
      if (dateKey(b.returnDate)) push('car-return', b.returnDate, b.returnTime);
      break;
    case 'transfer':
      push('transfer', b.pickupDate || b.date, b.pickupTime || b.time);
      break;
    case 'activity':
      push('activity', b.date, b.time);
      break;
    case 'custom':
      push('custom', b.date, b.time);
      break;
    default:
      // ביטוח ומה שאין לו רגע בזמן אינם אירועים בציר
      break;
  }
  return out;
};

/**
 * הפער בין שני אירועים, בדקות.
 *
 * מחושב רק כששני הצדדים נושאים שעה אמיתית. פער שנגזר מאירוע בלי שעה הוא
 * מספר שנראה מדויק ואינו מבוסס על דבר.
 */
const gapMinutes = (prev, next) => {
  if (!prev || !next || prev.allDay || next.allDay) return null;
  return Math.round((next.at - prev.at) / MINUTE);
};

/**
 * בונה ציר זמן מקובץ הזמנות של נסיעה.
 *
 * @returns {Array<{dayKey, date, events:Array}>}
 */
export const buildTimeline = (bookings = []) => {
  const events = bookings
    .flatMap(eventsFor)
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey) || a.order - b.order);

  const days = [];
  events.forEach((ev) => {
    let day = days.find((d) => d.dayKey === ev.dayKey);
    if (!day) {
      day = { dayKey: ev.dayKey, date: ev.at, events: [] };
      days.push(day);
    }
    day.events.push(ev);
  });

  // הפער מחובר לאירוע שאחריו: הוא מתאר את מה שקורה לפני שמגיעים אליו.
  days.forEach((day) => {
    day.events.forEach((ev, i) => {
      ev.gapBefore = i === 0 ? null : gapMinutes(day.events[i - 1], ev);
    });
  });

  return days;
};

/**
 * השעה שאירוע צריך לקבל כדי לשבת בין שני שכניו.
 *
 * ── למה גרירה משנה את השעה ──
 * הציר ממוין לפי זמן. סדר ידני שסותר את השעות היה יוצר מסך שקרי: פריט
 * של 09:00 יושב מתחת לפריט של 14:00 מפני שגררת אותו לשם, והשעות שלצידם
 * אומרות את ההפך. מכיוון שהמסך הזה נועד לענות "מה עכשיו", סתירה כזו היא
 * בדיוק סוג התקלה שאסור להכניס.
 *
 * לכן הגרירה אינה "סדר מועדף" אלא קביעת שעה: הפריט מקבל שעה בין שכניו,
 * והמסך נשאר נכון בכל קריאה שלו.
 *
 * @returns {string|null} "HH:MM", או null כשאי אפשר לגזור שעה
 */
export const timeBetween = (prev, next) => {
  const minutes = (ev) => (ev && !ev.allDay ? ev.at.getHours() * 60 + ev.at.getMinutes() : null);
  const a = minutes(prev);
  const z = minutes(next);

  // שכן בלי שעה אינו נותן גבול. במקום להמציא אחד, הגרירה פשוט לא זמינה.
  let result;
  if (a == null && z == null) return null;
  if (a == null) result = z - 30;
  else if (z == null) result = a + 30;
  else if (z - a < 2) result = a;      // אין רווח לחלק — נצמד לקודם
  else result = Math.round((a + z) / 2);

  const clamped = Math.max(0, Math.min(23 * 60 + 59, result));
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`;
};

/** ביטוחים ופריטים שחלים על הנסיעה כולה ואינם רגע בזמן. */
export const spanningItems = (bookings = []) =>
  bookings.filter((b) => b.type === 'insurance');

/**
 * האם האירוע כבר מאחורינו.
 *
 * אירוע בלי שעה מיוצג בחצות, ולכן השוואה ישירה הכריזה עליו כחלף כבר
 * בתחילת היום: הכניסה למלון "עברה" בשש בבוקר, לפני שהגעת. אירוע כזה
 * נחשב עתידי עד סוף היום שלו — זה מה שידוע, ולא יותר.
 */
const hasPassed = (ev, now) => {
  if (!ev.allDay) return ev.at < now;
  const endOfDay = new Date(ev.at);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay < now;
};

/**
 * האירוע הקרוב ביותר שטרם קרה.
 *
 * זה מה שמעניין כשפותחים את האפליקציה באמצע נסיעה — לא הרשימה כולה.
 * הסדר נלקח מהציר עצמו ולא מהשעה, כדי שאירוע בלי שעה יישאר במקומו
 * ההגיוני ביום ולא יקפוץ לתחילתו.
 */
export const nextEvent = (days = [], now = new Date()) => {
  for (const day of days) {
    for (const ev of day.events) {
      if (!hasPassed(ev, now)) return ev;
    }
  }
  return null;
};

/**
 * משך זמן בעברית תקנית.
 *
 * צורת היחיד והזוגי אינן קישוט: "1 שעות ו-20 דקות" נקרא כתקלה ומוריד את
 * האמון בכל מה שסביבו, גם כשהמספר עצמו נכון.
 */
const plural = (n, one, two, many) => (n === 1 ? one : n === 2 ? two : `${n} ${many}`);

/**
 * חיבור שני חלקי משך.
 *
 * ו' החיבור נדבקת למילה שאחריה, אך לפני מספר היא נפרדת במקף: "יום ושעה"
 * מול "3 שעות ו-15 דקות". צורה אחת לשניהם נראית שגויה באחד מהם תמיד.
 */
const joinParts = (a, b) => `${a} ${/^\d/.test(b) ? 'ו-' : 'ו'}${b}`;

export const humanGap = (minutes) => {
  if (minutes == null) return '';
  const abs = Math.abs(minutes);
  if (abs < 60) return plural(abs, 'דקה', 'שתי דקות', 'דקות');

  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h < 24) {
    const hours = plural(h, 'שעה', 'שעתיים', 'שעות');
    return m ? joinParts(hours, plural(m, 'דקה', 'שתי דקות', 'דקות')) : hours;
  }

  const d = Math.floor(h / 24);
  const rh = h % 24;
  const days = plural(d, 'יום', 'יומיים', 'ימים');
  return rh ? joinParts(days, plural(rh, 'שעה', 'שעתיים', 'שעות')) : days;
};
