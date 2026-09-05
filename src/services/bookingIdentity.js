import { findAirport } from './airportsData';

/**
 * קנוניזציה של הערכים שלפיהם מזוהות הזמנות.
 *
 * זהו השורש של סבב הכפילויות הארוך. כללי ההשוואה היו נכונים, אבל הם
 * הופעלו על מחרוזות גולמיות: אותו מלון חזר כ-"Caruso Place" וכ-"Caruso
 * Place Luxury Rooms", אותה טיסה כ-"LY384" וכ-"LY0384", ואותו תאריך
 * כ-"2026-06-24" וכ-"24/06/2026". השוואת מחרוזות קבעה שאלה דברים שונים,
 * וכל תיקון בכללים לא נגע בבעיה.
 *
 * עיקרון מנחה: המפתחות משמשים להשוואה בלבד ואינם מחליפים את הערך
 * המוצג. לכן כשפורמט תאריך דו-משמעי (06/07 — שישה ביולי או שבעה ביוני),
 * די בכך שהפירוש יהיה עקבי: שתי הרשומות יקבלו את אותו מפתח ויתאחדו
 * נכון, גם אם הפירוש עצמו שגוי. עקביות חשובה כאן יותר מדיוק.
 */

/**
 * תווים שאינם נראים על המסך ומשנים את המחרוזת.
 *
 * טקסט עברי מעורב באנגלית נושא סימני כיווניות (RLM, LRM, isolates), וגם
 * רווח קשיח ותו BOM מגיעים מתוך HTML של מיילים. הם בלתי נראים לחלוטין,
 * אך "LY 384" ו-"LY\u200f 384" הם שתי מחרוזות שונות — ולכן אותה טיסה
 * נחשבה לשתיים, ובדיקה על ערכים מודפסים הראתה שהם זהים.
 *
 * זה גם ההסבר לכך שהשוואה במעבדה הצליחה בעוד היישום נכשל: הערכים
 * שהודפסו לקונסול נראו זהים, וההבדל היה בתווים שאינם מודפסים.
 */
const INVISIBLE = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF\u00AD]/g;

/** מסיר תווים בלתי נראים לפני כל השוואה. */
/**
 * קוד שדה תעופה אחיד.
 *
 * הפענוח מחזיר לעיתים קוד ("FCO") ולעיתים שם מלא ("ROME FIUMICINO"),
 * לפי מה שכתוב באישור. השוואת מחרוזות הכריזה עליהם כשדות שונים, וטיסת
 * החזור הופיעה פעמיים — הטבלה שיודעת לתרגם ביניהם כבר הייתה בפרויקט,
 * אבל הזיהוי לא השתמש בה.
 */
export const airportKey = (value) => {
  const raw = stripInvisible(value).trim();
  if (!raw) return '';
  const found = findAirport(raw);
  return found ? found.code : raw.toUpperCase().replace(/\s+/g, ' ');
};

/**
 * האם שני ערכים מתארים את אותו שדה תעופה.
 *
 * ערך ריק אינו סותר דבר: רשומה שלא נכתב בה שדה יציאה אינה טיסה אחרת,
 * היא פחות מפורטת — אותו עיקרון שכבר חל על מספר טיסה בלי קוד חברה.
 */
export const sameAirport = (a, b) => {
  const x = airportKey(a);
  const y = airportKey(b);
  if (!x || !y) return true;
  return x === y;
};

export const stripInvisible = (v) => String(v || '').replace(INVISIBLE, '');

const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  ינואר: 1, פברואר: 2, מרץ: 3, מרס: 3, אפריל: 4, מאי: 5, יוני: 6,
  יולי: 7, אוגוסט: 8, ספטמבר: 9, אוקטובר: 10, נובמבר: 11, דצמבר: 12,
};

const pad = (n) => String(n).padStart(2, '0');

/**
 * תאריך במבנה אחיד להשוואה: YYYY-MM-DD.
 *
 * @returns {string} ריק כשלא ניתן לפענח — ערך ריק אינו סותר דבר, וזה
 *   עדיף על ניחוש שיפריד בין שתי רשומות של אותה הזמנה.
 */
export const dateKey = (value) => {
  const raw = stripInvisible(value).trim();
  if (!raw) return '';

  // ISO, גם בלי ריפוד: 2026-6-4
  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(raw);
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;

  // יום/חודש/שנה — הנפוץ באירופה ובישראל. כשהראשון גדול מ-12 אין
  // ספק; אחרת מפרשים אותו כיום, וההנחה עקבית בשני הצדדים.
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/.exec(raw);
  if (m) {
    let [, a, b, y] = m;
    if (Number(b) > 12) [a, b] = [b, a];
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${pad(b)}-${pad(a)}`;
  }

  // "24 ביוני 2026" / "24 June 2026" / "June 24, 2026"
  const lower = raw.toLowerCase();
  const monthName = Object.keys(MONTHS).find((k) => lower.includes(k));
  if (monthName) {
    const day = /(\d{1,2})/.exec(lower.replace(/\d{4}/, ''));
    const year = /(\d{4})/.exec(lower);
    if (day && year) return `${year[1]}-${pad(MONTHS[monthName])}-${pad(day[1])}`;
  }

  return '';
};

/**
 * מספר טיסה אחיד: LY384.
 *
 * חברות תעופה מרפדות באפסים באופן לא עקבי — אותה טיסה מופיעה כ-LY384
 * באישור וכ-LY0384 בכרטיס האלקטרוני.
 */
export const flightKey = (value) => {
  const raw = stripInvisible(value).toUpperCase().replace(/[\s-]/g, '');
  const m = /^([A-Z]{1,3})0*(\d{1,4})$/.exec(raw);
  return m ? `${m[1]}${m[2]}` : raw;
};

/**
 * האם שני מספרי טיסה מתארים את אותה טיסה.
 *
 * מקור אחד רושם "LY 5111" ואחר "5111" בלבד — מספר בלי קוד חברה אינו
 * מספר אחר, הוא פחות מפורט. השוואה ישירה הכריזה עליהם כסותרים, ולכן
 * אותה טיסה הופיעה פעמיים: אחת מהכרטיס ואחת ממייל של שירות נלווה.
 *
 * שני מספרים שלשניהם יש קוד חברה כן מושווים במלואם: LY384 ו-BA384 הן
 * טיסות שונות לחלוטין.
 */
const digitsOf = (v) => (/^[A-Z]{0,3}(\d{1,4})$/.exec(v) || [])[1] || '';
const hasCarrier = (v) => /^[A-Z]/.test(v);

export const sameFlightNumber = (a, b) => {
  const x = flightKey(a);
  const y = flightKey(b);
  if (!x || !y) return false;
  if (x === y) return true;
  // רק כשצד אחד חסר את קוד החברה מסתפקים בהשוואת הספרות
  if (hasCarrier(x) === hasCarrier(y)) return false;
  const dx = digitsOf(x);
  return !!dx && dx === digitsOf(y);
};

// מילים שספקים מוסיפים לשם ואינן מזהות את העסק
const NOISE = new RegExp(
  '\\b(' +
  'hotel|hostel|motel|resort|suites?|rooms?|apartments?|apartment|residence|' +
  'guest\\s*house|b&b|bed\\s*and\\s*breakfast|luxury|boutique|palace|inn|' +
  'the|by|and|מלון|אכסניית|אכסניה|דירות|סוויטות' +
  ')\\b',
  'gi'
);

/**
 * שם עסק אחיד להשוואה.
 *
 * "Caruso Place" ו-"Caruso Place Luxury Rooms & Suites" הם אותו מלון,
 * ושני ספקים כותבים אותו אחרת. הניקוי משאיר את הליבה המזהה.
 */
export const nameKey = (value) =>
  stripInvisible(value)
    .toLowerCase()
    .replace(/[''`"״׳,.\-–—|()]/g, ' ')
    .replace(NOISE, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * האם שני שמות מתארים את אותו עסק.
 *
 * הכלה ולא זהות: ספק אחד כותב את השם המלא והשני את הליבה. נדרש אורך
 * מזערי כדי ש-"roma" לא יבלע כל מלון שיש בשמו רומא.
 *
 * ── למה ההכלה אינה `startsWith` ──
 * כך זה נכתב, כי המקרה שהוליד את הכלל היה סיומת: "Caruso Place" מול
 * "Caruso Place Luxury Rooms & Suites". ב-05.09.2026 נמדד ההפך בתיבה
 * האמיתית: אותו שולחן בנאפולי הוזמן גם דרך גוגל ריזרב וגם דרך TheFork,
 * והם כתבו "Trattoria Pizzeria Ieri, Oggi, Domani" מול "Ieri Oggi,
 * Domani" — הליבה בסוף, כי הספק מקדים את סוג העסק. שתי הרשומות לא מוזגו
 * והמסך הציג "2 מסעדות" לארוחה אחת.
 *
 * ההכלה נבדקת עכשיו בכל מקום, אך על **גבול מילה**: `includes` גולמי היה
 * מזהה "oggi" בתוך "oggidomani" ומאחד עסקים שאין ביניהם דבר. הרווחים
 * המוקפים הם מה שהופך הכלה למילים שלמות.
 */
export const sameName = (a, b) => {
  const x = nameKey(a);
  const y = nameKey(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const [short, long] = x.length <= y.length ? [x, y] : [y, x];
  return short.length >= 5 && ` ${long} `.includes(` ${short} `);
};
