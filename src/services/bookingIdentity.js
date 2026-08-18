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
  const raw = String(value || '').trim();
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
  const raw = String(value || '').toUpperCase().replace(/[\s-]/g, '');
  const m = /^([A-Z]{1,3})0*(\d{1,4})$/.exec(raw);
  return m ? `${m[1]}${m[2]}` : raw;
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
  String(value || '')
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
 */
export const sameName = (a, b) => {
  const x = nameKey(a);
  const y = nameKey(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const [short, long] = x.length <= y.length ? [x, y] : [y, x];
  return short.length >= 5 && long.startsWith(short);
};
