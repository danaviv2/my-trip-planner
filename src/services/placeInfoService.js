/**
 * תיאור וטיפים למקום, ממקורות עובדתיים בלבד.
 *
 * הפיתוי כאן הוא לבקש מהמודל "תאר את הלובר" ולקבל פסקה משכנעת. הניסיון
 * בפרויקט הזה מלמד מה קורה אז: כתובת אתר שהומצאה, תאריך תוקף שנגזר משם
 * מוצר, קואורדינטות של מקום שלא קיים. תיאור של מקום אמיתי כתוב כבר
 * בוויקיפדיה, ואין סיבה לייצר גרסה שאי אפשר לאמת.
 *
 * הטיפים נגזרים מנתונים שכבר בידינו — שעות הפתיחה והאם הכניסה בתשלום —
 * ולא מהשערה על עומסים.
 */

const WIKIDATA = 'https://www.wikidata.org/w/api.php';

/** שפות התקציר, לפי סדר העדפה. */
const LANGS = ['he', 'en'];

const summaryFrom = async (lang, title) => {
  try {
    const res = await fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
    );
    if (!res.ok) return '';
    const data = await res.json();
    return data?.extract || '';
  } catch {
    return '';
  }
};

/**
 * תקציר על המקום מוויקיפדיה, בעברית כשקיים.
 *
 * @param {string} wikidataId מזהה כמו Q19675, מתוך תגיות ה-OSM
 * @param {string} wikipediaTag ערך כמו "fr:Musée du Louvre", כגיבוי
 * @returns {Promise<{text:string, lang:string, title:string}>}
 */
export const fetchPlaceSummary = async (wikidataId, wikipediaTag = '') => {
  // דרך ויקינתונים: מזהה אחד מוביל לערך המקביל בכל שפה, ולכן אפשר
  // להעדיף עברית בלי לתרגם דבר.
  if (wikidataId) {
    try {
      const sites = LANGS.map((l) => `${l}wiki`).join('|');
      const res = await fetch(
        `${WIKIDATA}?action=wbgetentities&ids=${encodeURIComponent(wikidataId)}` +
        `&props=sitelinks&sitefilter=${sites}&format=json&origin=*`
      );
      const data = await res.json();
      const entity = Object.values(data?.entities || {})[0];
      const links = entity?.sitelinks || {};

      for (const lang of LANGS) {
        const title = links[`${lang}wiki`]?.title;
        if (!title) continue;
        const text = await summaryFrom(lang, title);
        if (text) return { text, lang, title };
      }
    } catch {
      // ממשיכים לגיבוי
    }
  }

  // גיבוי: התגית של OSM נושאת שפה וכותרת ("fr:Musée du Louvre"). היא
  // כמעט תמיד בשפת המקום, ולכן משמשת רק כשאין ערך עברי או אנגלי.
  const [lang, ...rest] = String(wikipediaTag || '').split(':');
  const title = rest.join(':');
  if (lang && title) {
    const text = await summaryFrom(lang, title);
    if (text) return { text, lang, title };
  }

  return { text: '', lang: '', title: '' };
};

const DAYS = {
  Mo: 'שני', Tu: 'שלישי', We: 'רביעי', Th: 'חמישי',
  Fr: 'שישי', Sa: 'שבת', Su: 'ראשון',
};

/**
 * טיפים שנגזרים מנתונים ולא מהשערה.
 *
 * יום סגירה הוא הטיפ בעל הערך הגבוה ביותר וגם היחיד שאפשר לדעת בוודאות:
 * הגעה ביום שהמקום סגור היא הכישלון היקר ביותר ביום טיול, והנתון כתוב
 * במפורש בשעות הפתיחה. השערות על שעות עומס אינן במקורות שבידינו, ולכן
 * אינן נוצרות כאן.
 *
 * @returns {string[]}
 */
export const derivePlaceTips = ({ openingHours = '', fee = '' } = {}) => {
  const tips = [];

  // "Tu off" או "Mo,Tu off" — ימים שבהם המקום סגור
  const closed = [];
  const re = /\b((?:(?:Mo|Tu|We|Th|Fr|Sa|Su)[,-]?)+)\s+off\b/g;
  let m;
  while ((m = re.exec(openingHours)) !== null) {
    m[1].split(/[,-]/).filter(Boolean).forEach((d) => {
      if (DAYS[d] && !closed.includes(DAYS[d])) closed.push(DAYS[d]);
    });
  }
  if (closed.length) {
    tips.push(`סגור בימי ${closed.join(' ו')} — ודא שהיום שבחרת אינו אחד מהם`);
  }

  // כאן היה טיפ על "כניסה אחרונה מוקדמת משעת הסגירה". הוא הוסר: אין
  // בידינו נתון על שעת הכניסה האחרונה, וזו הייתה הנחה כללית שנוסחה
  // כעובדה על המקום המסוים — בדיוק סוג המידע שאסור לייצר כאן.

  const paid = String(fee || '').toLowerCase();
  if (paid && paid !== 'no' && paid !== 'free') {
    tips.push('הכניסה בתשלום — בדוק אם אפשר להזמין כרטיס מראש ולחסוך תור');
  }

  return tips;
};
