/**
 * עלות נסיעה מתוך המחירים שנקלטו באישורי ההזמנה.
 *
 * עד כה מסך הסטטיסטיקה גזר עלות מהשדה budget, שערכו 'low' או 'medium' —
 * מחרוזת ולא סכום. Number() החזיר NaN, הכול נפל לאפס, והמסך הציג
 * "היעד היקר ביותר: נאפולי (₪0)". כאן העלות מגיעה מהמחיר שכתוב באישור.
 *
 * שלושה כללים שמונעים מספר שקרי:
 *
 * 1. אין המרת מטבע. אין לנו שער חליפין, והמצאת שער היא המצאת נתון.
 *    סכומים נצברים לפי מטבע ומוצגים בנפרד.
 * 2. כיסוי מדווח תמיד. סכום של שלושה מלונות מתוך שמונה הזמנות אינו
 *    "עלות הטיול", והצגתו ככזו מטעה יותר מאשר לא להציג דבר.
 * 3. מה שלא נקלט לא מנוחש. הזמנה בלי מחיר פשוט אינה נספרת.
 */

/** סמלים וקודים נפוצים, לזיהוי המטבע מתוך המחרוזת שנכתבה באישור. */
const CURRENCIES = [
  { test: /€|\beur\b/i, code: 'EUR', symbol: '€' },
  { test: /₪|\bils\b|\bnis\b|ש"ח|ש״ח/i, code: 'ILS', symbol: '₪' },
  { test: /\$|\busd\b/i, code: 'USD', symbol: '$' },
  { test: /£|\bgbp\b/i, code: 'GBP', symbol: '£' },
  { test: /\bchf\b/i, code: 'CHF', symbol: 'CHF' },
  { test: /¥|\bjpy\b/i, code: 'JPY', symbol: '¥' },
];

/**
 * מפרק מחרוזת מחיר לסכום ולמטבע.
 *
 * מטפל בשתי שיטות ההפרדה הנפוצות: "1,234.56" (אנגלית) ו-"1.234,56"
 * (אירופית). בלי ההבחנה הזו "€ 2.561,58" היה נקרא כשניים ומשהו.
 *
 * @returns {{amount:number, code:string}|null}
 */
export const parsePrice = (raw) => {
  if (!raw) return null;
  const text = String(raw);

  const cur = CURRENCIES.find((c) => c.test.test(text));
  const digits = text.replace(/[^\d.,]/g, '').trim();
  if (!digits) return null;

  // מה שמכריע אינו סוג המפריד אלא כמה ספרות באות אחריו: שתיים מציינות
  // שבר עשרוני, שלוש מציינות קבוצת אלפים. הנחה שפסיק הוא תמיד עשרוני
  // הפכה את "3,500" ל-3.5.
  const lastSep = Math.max(digits.lastIndexOf(','), digits.lastIndexOf('.'));
  let normalized;

  if (lastSep === -1) {
    normalized = digits;
  } else {
    const tail = digits.length - lastSep - 1;
    normalized =
      tail === 3
        ? digits.replace(/[.,]/g, '') // מפריד אלפים
        : digits.slice(0, lastSep).replace(/[.,]/g, '') + '.' + digits.slice(lastSep + 1);
  }

  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  return { amount, code: cur?.code || 'UNKNOWN' };
};

export const formatMoney = (amount, code) => {
  const sym = CURRENCIES.find((c) => c.code === code)?.symbol;
  const num = amount.toLocaleString('he-IL', { maximumFractionDigits: 2 });
  return sym ? `${sym}${num}` : `${num} ${code}`;
};

const LABELS = {
  flight: 'טיסות',
  hotel: 'לינה',
  car_rental: 'רכב',
  transfer: 'הסעות',
  activity: 'אטרקציות',
  insurance: 'ביטוח',
};

/**
 * מחשב את עלות הנסיעה מתוך ההזמנות.
 *
 * @param {Array} bookings
 * @returns {{
 *   byCurrency: Record<string, number>,
 *   byCategory: Record<string, Record<string, number>>,
 *   withPrice: number, total: number, hasCost: boolean, complete: boolean
 * }}
 */
export const tripCost = (bookings = []) => {
  const byCurrency = {};
  const byCategory = {};
  let withPrice = 0;

  bookings.forEach((b) => {
    const parsed = parsePrice(b.price);
    if (!parsed) return;
    withPrice++;

    const { amount, code } = parsed;
    byCurrency[code] = (byCurrency[code] || 0) + amount;

    const label = LABELS[b.type] || 'אחר';
    byCategory[label] = byCategory[label] || {};
    byCategory[label][code] = (byCategory[label][code] || 0) + amount;
  });

  return {
    byCurrency,
    byCategory,
    withPrice,
    total: bookings.length,
    hasCost: withPrice > 0,
    // רק כשלכל ההזמנות יש מחיר אפשר לקרוא לזה "עלות הנסיעה"
    complete: bookings.length > 0 && withPrice === bookings.length,
  };
};

/** "€4,313.83" או "€4,313.83 + $200" כשיש כמה מטבעות. */
export const formatTotals = (byCurrency = {}) =>
  Object.entries(byCurrency)
    .sort(([, a], [, b]) => b - a)
    .map(([code, amount]) => formatMoney(amount, code))
    .join(' + ');
