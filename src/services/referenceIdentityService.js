/**
 * מה מספר האסמכתה מסגיר על עצמו.
 *
 * ── מה נבדק ונפסל ──
 * התחקיר חיפש כלל צורה שיבדיל בין הזמנה לזכאות, ושלוש השערות נמדדו
 * ונפלו:
 *
 * 1. **אורך.** שובר הטרקלין נשא `8100075717619000` והזמנת מלון אמיתית
 *    נשאה `2025122845091373` — שש-עשרה ספרות רצופות, שתיהן.
 * 2. **Luhn.** ההשערה שהשובר הוא מספר כרטיס אשראי נבדקה: הוא אינו עובר
 *    Luhn. המכשיר כויל על שני מספרי בדיקה ידועים שכן עוברים.
 * 3. **ספרת ביקורת של כרטיס טיסה.** האלגוריתם לא אומת מול מספר כרטיס
 *    אמיתי; המקורות סותרים זה את זה בשאלה אילו ספרות נכנסות לחישוב.
 *    בדיקה שפוסלת כרטיס אמיתי גרועה מהיעדר בדיקה, ולכן אינה כאן.
 *
 * ── מה כן נשאר ──
 * קידומת ספק. היא אינה מנחשת: `GYG` הוא GetYourGuide ותו לא. ומספר
 * שאינו יכול להיות כרטיס טיסה — ספרת ביקורת בכרטיס לעולם אינה גדולה
 * מ-6, כי היא שארית חלוקה בשבע.
 *
 * ── ולמה זה מזהה ולא פוסל ──
 * הזיהוי משמש להצלבה בלבד: כשהאסמכתה אומרת GetYourGuide והרשומה אומרת
 * ביטוח, משהו נקרא לא נכון. סתירה שווה הצגה; היא אינה שווה מחיקה
 * אוטומטית של הזמנה שהמשתמש אולי צריך.
 */

/** קידומות שספק אחד ויחיד משתמש בהן. */
const PREFIXES = [
  { re: /^GYG[A-Z0-9]{6,}$/i, vendor: 'GetYourGuide', type: 'activity' },
  { re: /^BR-?\d{6,}$/i, vendor: 'Viator', type: 'activity' },
  { re: /^TQ[A-Z0-9]{6,}$/i, vendor: 'Tiqets', type: 'activity' },
  { re: /^HM[A-Z0-9]{8,}$/i, vendor: 'Airbnb', type: 'hotel' },
];

const digitsOnly = (s) => String(s || '').replace(/\D/g, '');

/**
 * קוד החשבונאות של חברת התעופה — שלוש הספרות הראשונות בכרטיס.
 * רשימה חלקית בכוונה: רק חברות שנצפו או שהן נפוצות בישראל. קוד שאינו
 * ברשימה אינו "לא תקין" — הוא פשוט אינו מזוהה.
 */
const AIRLINE_PLATES = {
  114: 'אל על', 214: 'ארקיע', 175: 'ישראייר',
  1: 'American', 6: 'Delta', 16: 'United', 125: 'British Airways',
  220: 'Lufthansa', 57: 'Air France', 74: 'KLM', 235: 'Turkish',
  390: 'Aegean', 75: 'Iberia', 176: 'Emirates', 157: 'Qatar',
};

/**
 * האם המחרוזת יכולה להיות כרטיס טיסה אלקטרוני.
 *
 * שלוש-עשרה ספרות, קוד חברה מזוהה, וספרה אחרונה בטווח 0–6. השלישי הוא
 * הכלל היחיד מהתקן שאפשר להישען עליו בלי לאמת את האלגוריתם המלא: ספרת
 * ביקורת היא שארית חלוקה בשבע, ולכן 7, 8 ו-9 אינם אפשריים.
 */
export const asETicket = (ref) => {
  const d = digitsOnly(ref);
  if (d.length !== 13) return null;
  const plate = Number(d.slice(0, 3));
  const airline = AIRLINE_PLATES[plate];
  if (!airline) return null;
  if (Number(d[12]) > 6) return null;
  return { type: 'flight', vendor: airline, plate, why: 'כרטיס טיסה — קוד חברה וספרת ביקורת בטווח' };
};

/**
 * זיהוי אסמכתה.
 *
 * @returns {{type:string, vendor:string, why:string}|null} null = לא מזוהה,
 *   וזה המצב הרגיל: לרוב הספקים אין תבנית ייחודית כלל.
 */
export const identifyReference = (ref) => {
  const raw = String(ref || '').trim();
  if (!raw) return null;

  const byPrefix = PREFIXES.find((p) => p.re.test(raw));
  if (byPrefix) {
    return { type: byPrefix.type, vendor: byPrefix.vendor, why: `קידומת ${byPrefix.vendor}` };
  }

  return asETicket(raw);
};

/**
 * סתירה בין מה שהאסמכתה אומרת לבין הסוג שנשמר.
 *
 * @returns {string} תיאור הסתירה, או '' כשאין — או כשאין מה להשוות.
 */
export const referenceConflict = (booking) => {
  const id = identifyReference(booking && booking.confirmationNumber);
  if (!id || !booking || !booking.type) return '';
  if (id.type === booking.type) return '';
  return `האסמכתה נראית כשל ${id.vendor} (${id.type}), אך הרשומה נשמרה כ-${booking.type}`;
};

export default { identifyReference, asETicket, referenceConflict };
