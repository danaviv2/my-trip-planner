import { findAirport } from './airportsData';
import { distanceKm } from './routeGeometryService';

/**
 * זכויות נוסע בעיכוב או ביטול טיסה.
 *
 * ── למה זה כאן ──
 * חברות התעופה האירופיות מחזיקות כשלושה מיליארד אירו בפיצויים שלא נתבעו,
 * ורק כ-42% מהנוסעים יודעים בכלל שקיימת להם זכות. הסיבה פשוטה: כדי לדעת
 * אם מגיע לך צריך להצליב מספר טיסה, מרחק, שדה מוצא, זהות המוביל ומשך
 * העיכוב — מול שני חוקים שונים. איש אינו עושה זאת בעצמו.
 *
 * כל הנתונים האלה כבר נקלטים אצלנו אוטומטית מאישור ההזמנה. זה ההבדל בין
 * אפליקציה שמארגנת מידע לאפליקציה שעושה בו שימוש.
 *
 * ── דיוק ──
 * הספים והסכומים אומתו מול מקורות רשמיים. שני החוקים שונים מהותית זה
 * מזה, ובמיוחד בסף: שלוש שעות באירופי מול שמונה בישראלי. חישוב שגוי
 * ישלח אדם לתבוע כשלא מגיע לו, או ישתוק כשכן — ולכן כשחסר נתון, המערכת
 * אומרת שחסר ואינה מנחשת.
 *
 * המערכת אינה מעניקה ייעוץ משפטי. היא מצביעה על זכאות אפשרית.
 */

/** תקנה אירופית 261/2004 — הסף הוא שלוש שעות באיחור בהגעה. */
const EU_DELAY_HOURS = 3;
const EU_BANDS = [
  { maxKm: 1500, amount: 250 },
  { maxKm: 3500, amount: 400 },
  { maxKm: Infinity, amount: 600 },
];

/**
 * חוק שירותי תעופה הישראלי — עיכוב נחשב לביטול רק מעל שמונה שעות.
 * בין חמש לשמונה שעות קמה זכות להחזר או לכרטיס חלופי, בלי פיצוי כספי.
 */
const IL_DELAY_HOURS = 8;
const IL_ASSISTANCE_HOURS = 5;
const IL_BANDS = [
  { maxKm: 2000, amount: 1530 },
  { maxKm: 4500, amount: 2450 },
  { maxKm: Infinity, amount: 3670 },
];

const bandAmount = (bands, km) => bands.find((b) => km <= b.maxKm)?.amount ?? null;

/** חברות תעופה אירופיות — משנה לזכאות בטיסה שנוחתת באיחוד. */
const EU_CARRIER = /alitalia|ita airways|lufthansa|air france|klm|iberia|tap|aegean|ryanair|wizz|easyjet|austrian|swiss|brussels airlines|sas|finnair|lot |tarom|croatia airlines|air europa|vueling|norwegian|volotea/i;

const isEuCarrier = (airline) => EU_CARRIER.test(String(airline || ''));

/**
 * מזהה אילו משטרים משפטיים חלים על הטיסה.
 *
 * התקנה האירופית חלה על כל טיסה שממריאה משדה באיחוד — ללא תלות בזהות
 * המוביל — ועל טיסה שנוחתת באיחוד רק כשהמוביל אירופי. החוק הישראלי חל
 * על כל טיסה שממריאה מישראל, נוחתת בה, או פנימית.
 */
export const applicableRegimes = (flight) => {
  const from = findAirport(flight?.departureAirport);
  const to = findAirport(flight?.arrivalAirport);
  const regimes = [];

  if (!from || !to) return { regimes, from, to, km: null };

  const km = distanceKm(from, to);

  if (from.eu261 || (to.eu261 && isEuCarrier(flight.airline))) {
    regimes.push('EU');
  }
  if (from.uk261 || (to.uk261 && isEuCarrier(flight.airline))) {
    regimes.push('UK');
  }
  if (from.country === 'IL' || to.country === 'IL') {
    regimes.push('IL');
  }

  return { regimes, from, to, km };
};

/**
 * מה מגיע לנוסע בעיכוב נתון.
 *
 * @param {object} flight רשומת טיסה מהמאגר
 * @param {number} delayHours אורך העיכוב בהגעה, בשעות
 * @param {number} passengers מספר נוסעים
 */
export const rightsFor = (flight, delayHours, passengers = 1) => {
  const { regimes, from, to, km } = applicableRegimes(flight);

  if (!from || !to) {
    return {
      known: false,
      reason: 'לא זוהו שדות התעופה של הטיסה, ולכן אי אפשר לחשב מרחק וזכאות.',
      entitlements: [],
    };
  }

  const entitlements = [];

  if (regimes.includes('EU') || regimes.includes('UK')) {
    const amount = bandAmount(EU_BANDS, km);
    const eligible = delayHours >= EU_DELAY_HOURS;
    entitlements.push({
      regime: regimes.includes('UK') ? 'בריטניה (UK261)' : 'האיחוד האירופי (EU261)',
      threshold: EU_DELAY_HOURS,
      eligible,
      amountPerPassenger: amount,
      currency: 'EUR',
      total: amount * passengers,
      note: eligible
        ? `עיכוב של ${delayHours} שעות חוצה את סף שלוש השעות.`
        : `נדרש עיכוב של ${EU_DELAY_HOURS} שעות לפחות בהגעה. העיכוב כאן ${delayHours}.`,
    });
  }

  if (regimes.includes('IL')) {
    const amount = bandAmount(IL_BANDS, km);
    const eligible = delayHours > IL_DELAY_HOURS;
    entitlements.push({
      regime: 'חוק שירותי תעופה (ישראל)',
      threshold: IL_DELAY_HOURS,
      eligible,
      amountPerPassenger: amount,
      currency: 'ILS',
      total: amount * passengers,
      note: eligible
        ? `עיכוב של ${delayHours} שעות עובר את סף שמונה השעות, והטיסה נחשבת מבוטלת.`
        : delayHours >= IL_ASSISTANCE_HOURS
          ? `אין פיצוי כספי מתחת לשמונה שעות, אך מעל חמש שעות קמה זכות לבחור בין המתנה לבין החזר כספי או כרטיס חלופי.`
          : `נדרש עיכוב של יותר מ-${IL_DELAY_HOURS} שעות. העיכוב כאן ${delayHours}.`,
    });
  }

  return { known: true, from, to, km, regimes, entitlements };
};

/**
 * תמונת הזכויות של הטיסה עוד לפני שקרה דבר.
 *
 * זהו החלק שאיש אינו מספק: לדעת מראש שלטיסת החזור מאירופה סף של שלוש
 * שעות בעוד לטיסת ההלוך סף של שמונה. ההבדל הזה שווה מאות אירו, והוא אינו
 * אינטואיטיבי כלל.
 */
export const flightRightsProfile = (flight, passengers = 1) => {
  const { regimes, from, to, km } = applicableRegimes(flight);
  if (!from || !to || !km) return null;

  const best = [];
  if (regimes.includes('EU') || regimes.includes('UK')) {
    best.push({
      label: regimes.includes('UK') ? 'UK261' : 'EU261',
      thresholdHours: EU_DELAY_HOURS,
      amount: bandAmount(EU_BANDS, km),
      currency: 'EUR',
    });
  }
  if (regimes.includes('IL')) {
    best.push({
      label: 'חוק שירותי תעופה',
      thresholdHours: IL_DELAY_HOURS,
      amount: bandAmount(IL_BANDS, km),
      currency: 'ILS',
    });
  }
  if (!best.length) return null;

  // הסף הנמוך ביותר הוא הרלוונטי בפועל — הוא שייכנס לתוקף ראשון
  const lowest = best.reduce((min, r) => (r.thresholdHours < min.thresholdHours ? r : min));

  return { from, to, km, regimes, options: best, lowestThreshold: lowest, passengers };
};

export const formatAmount = (amount, currency) =>
  currency === 'ILS' ? `₪${amount.toLocaleString()}` : `€${amount.toLocaleString()}`;

/**
 * נוסח פנייה לחברת התעופה.
 *
 * המכשול המעשי אינו הידיעה אלא הניסוח: אדם שיודע שמגיע לו עדיין נרתע
 * מלכתוב מכתב משפטי. הטקסט מוכן להעתקה ומצטט את הסעיף הרלוונטי.
 */
export const claimLetter = (flight, entitlement, delayHours, passengers = 1) => {
  const ref = flight.confirmationNumber ? `\nמספר הזמנה: ${flight.confirmationNumber}` : '';
  const amount = formatAmount(entitlement.amountPerPassenger, entitlement.currency);

  return `לכבוד ${flight.airline || 'חברת התעופה'},

הנדון: דרישת פיצוי בגין עיכוב בטיסה ${flight.flightNumber || ''}

טיסה: ${flight.flightNumber || ''} בתאריך ${flight.date || ''}
מסלול: ${flight.departureAirport || ''} → ${flight.arrivalAirport || ''}${ref}
מספר נוסעים: ${passengers}

הטיסה שבנדון הגיעה ליעדה באיחור של כ-${delayHours} שעות.

בהתאם ל${entitlement.regime}, קמה לנוסע זכות לפיצוי כספי בסך ${amount} לנוסע,
ובסך הכול ${formatAmount(entitlement.total, entitlement.currency)}.

אבקשכם להעביר את הפיצוי בתוך 14 ימים. ככל שלטענתכם מדובר בנסיבות
מיוחדות הפוטרות מפיצוי, אבקש לקבל את פירוטן בכתב.

בכבוד רב,`;
};
