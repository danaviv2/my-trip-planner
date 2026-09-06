/**
 * כמה העולם קורא על המקום הזה.
 *
 * ── מה זה בא להחליף ──
 * בעמוד החיפוש הוצגו דירוג ומספר ביקורות שלא הגיעו משום מקום:
 * `reviews: 1000 + i * 347` — האינדקס בלולאה. בצילום של המשתמש
 * (05.09.2026) הופיעו "1,000 ביקורות" ו"1,347 ביקורות", שני האיברים
 * הראשונים של הנוסחה. הם הוסרו, וזה מה שבא במקומם.
 *
 * ── ומה זה **לא** ──
 * זה אינו דירוג ואינו מספר מבקרים. זו מדידה של כמה אנשים קראו את ערך
 * הוויקיפדיה של המקום בחודש האחרון — כלומר **מידת ההיכרות**, לא
 * האיכות. מקום יכול להיות מפורסם ומאכזב. לכן זה לעולם לא מוצג
 * ככוכבים, והניסוח נשאר "מהמוכרים ב…" ולא "הכי טוב".
 *
 * ── למה ויקיפדיה ולא Google ──
 * נבדק ב-05.09.2026: `rating` של Google Places הוא שדה Enterprise,
 * ותנאי השירות **אוסרים לשמור אותו במטמון**. כלומר כל רינדור של כרטיס
 * הוא קריאה מחויבת — עלות שגדלה עם צפיות ולא עם נתונים, בדיוק התקלה
 * שעלתה ₪254 לחודש ב-Places Photo. ויקיפדיה חינמית, בלי מפתח, ומותרת
 * לשמירה.
 *
 * ── והתנאי שבלעדיו זה לא עובד: שם באנגלית ──
 * סקירה על 14 אטרקציות בשש ערים:
 *   באנגלית — 14 פגיעות, אפס החטאות
 *   בעברית  — "בתי הקובייה" ⟵ "קוביית משחק". פגיעה שגויה שנראית נכונה.
 * לכן הפונקציה מקבלת `nameEn` בלבד, ומחזירה כלום בלעדיו. זה אותו לקח
 * שכבר מיושם ב-`placeMediaService` דרך `localName`.
 */

const KEY = 'placePopularity';
const TTL = 30 * 86400000; // הנתון עצמו חודשי; אין טעם לרענן מהר יותר
const UA = 'my-trip-planner (https://my-trip-planner-ten.vercel.app)';

// ויקיפדיה מקבלת 50 כותרות לבקשה למשתמש אנונימי. 50 שמות ≈ 1,100 תווים
// ב-URL — הרבה מתחת לכל תקרה מעשית.
const CHUNK = 50;

// מעקב אחרי `continue`. נמדד: סבב אחד ברוב המקרים, שניים לפעמים.
// התקרה קיימת כדי שתשובה פגומה לא תסובב לנצח.
const MAX_ROUNDS = 4;

const read = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
};
const write = (m) => {
  try { localStorage.setItem(KEY, JSON.stringify(m)); } catch { /* מכסה מלאה — לא נורא */ }
};

/**
 * ── למה בקשה אחת ולא אחת לכל מקום ──
 * הגרסה הראשונה שאלה `list=search` ואז את שירות הצפיות, בזה אחר זה,
 * עם ויסות של 700ms. נמדד ב-06.09.2026 על 12 מקומות ברומא:
 *
 *   1–5   200  קולוסיאום, פורום, פנתיאון, טרווי, מוזיאוני הוותיקן
 *   6–12  429  ומשם הכול נכשל
 *
 * שתי בקשות לכל מקום, 24 בסך הכול, חוצות את המכסה של ויקיפדיה אחרי
 * חמישה. הוויסות לא הציל — הוא רק האט את הדרך לחסימה, ועלה 17 שניות.
 *
 * `titles=` פותר את זה מהשורש: כל הרשימה בבקשה **אחת**, בלי צורך
 * בחיפוש בכלל. `redirects=1` מתרגם את השם המקומי לערך האנגלי —
 * "Colosseo" ⟵ Colosseum, "Musei Vaticani" ⟵ Vatican Museums —
 * בדיוק מה שהחיפוש עשה, ובלי לשלם עליו בקשה.
 *
 * ── והוא גם מדויק יותר ──
 * `list=search` על "Pantheon" החזיר את **Panthéon של פריז**, 20,741
 * צפיות. ערך שגוי שנראה נכון לחלוטין, והסקירה שדיווחה "אפס פגיעות
 * שגויות" לא תפסה אותו. התאמה מדויקת לפי כותרת אינה סובלת מזה.
 */
const buildUrl = (titles) => {
  const q = encodeURIComponent(titles.join('|'));
  return 'https://en.wikipedia.org/w/api.php'
    + '?format=json&formatversion=2&origin=*&action=query&redirects=1'
    // `coordinates` ו-`disambiguation` הם המסננים, ראה `isRealPlace`.
    + '&prop=pageviews|coordinates|pageprops&ppprop=disambiguation'
    // ── `colimit=max` אינו קישוט; בלעדיו הקוד קובר מקומות אמיתיים ──
    // נמדד ב-06.09.2026: `coordinates` מחזיר **עשרה עמודים בלבד**
    // לבקשה כברירת מחדל. על 50 כותרות חזרו 10 מתוך 42, ופיאצה נבונה,
    // גלריה בורגזה וריאלטו נראו כאילו אין להן מקום על המפה — כלומר
    // `isRealPlace` היה פוסל אותן ושומר 0 לחודש. התקרה תלויה באורך
    // הרשימה, ולכן הבאג היה מופיע ונעלם לפי מספר התוצאות בחיפוש.
    + '&colimit=max'
    + `&pvipdays=30&titles=${q}`;
};

/**
 * שואל את ויקיפדיה על רשימת כותרות, עד שהתשובה שלמה.
 *
 * ── למה `continue` ולא מנה קטנה יותר ──
 * ל-`pageviews` יש תקרה משלו, והיא **אינה יציבה**. נמדד ב-06.09.2026
 * על אותן 50 כותרות, בהפרש דקות:
 *
 *   ריצה א׳  38 מתוך 50, ואיתה `pvipcontinue`
 *   ריצה ב׳  50 מתוך 50, בלי `continue` כלל
 *
 * כלומר כל "גודל מנה בטוח" שהיה נבחר כאן הוא ניחוש שיחזיק עד שלא.
 * מעקב אחרי `continue` מסתגל מעצמו: ברוב הפעמים סבב אחד, ולפעמים שניים.
 *
 * @returns {Promise<{pages:Map, query:Object, complete:boolean}|null>}
 *   `null` כשהשרת סירב. `complete: false` כשהתשובה נקטעה — ואז אסור
 *   להסיק ממנה שלילה, ראה `fetchPopularity`.
 */
const askWiki = async (titles) => {
  const base = buildUrl(titles);
  const pages = new Map();
  let first = null;
  let cont = null;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const qs = cont
      ? Object.entries(cont).map(([k, v]) => `&${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('')
      : '';
    const r = await fetch(base + qs, { headers: { 'Api-User-Agent': UA } });

    // ── תשובת שרת שאינה 200 אינה נשמרת ──
    // כאן ישב הכשל שקבר את הפיצ'ר: 429 אינו חריגה אלא `!r.ok`,
    // והגרסה הקודמת גלגלה אותו למסלול "אין ערך בוויקיפדיה" ושמרה
    // `views: 0` **ל-30 יום**. כלומר חסימה זמנית אחת השביתה את
    // הסימון לחודש, וקולוסיאום המשיך לעבוד בבדיקה ישירה ולא על
    // המסך. סירוב לענות אינו תשובה.
    if (!r.ok) return null;

    const j = await r.json();
    const query = j && j.query;
    if (!query || !query.pages) return null;
    if (!first) first = query;

    // כל סבב ממלא תכונות אחרות של אותם עמודים; המיזוג הוא לפי כותרת.
    for (const p of query.pages) {
      const cur = pages.get(p.title) || { title: p.title };
      if (p.missing) cur.missing = true;
      if (p.coordinates) cur.coordinates = p.coordinates;
      if (p.pageprops) cur.pageprops = p.pageprops;
      if (p.pageviews) cur.pageviews = p.pageviews;
      pages.set(p.title, cur);
    }

    if (!j.continue) return { pages, query: first, complete: true };
    cont = j.continue;
  }

  return { pages, query: first, complete: false };
};

/**
 * מכותרת סופית בחזרה לשם שביקשנו.
 *
 * ויקיפדיה עונה בשתי שכבות תרגום: `normalized` (רישיות ורווחים)
 * ואז `redirects` (השם המקומי לערך האנגלי). בלי לעקוב אחריהן התשובה
 * חוזרת תחת כותרת שאיש לא ביקש, והתוצאה נזרקת בשקט.
 */
const chainBack = (query, originals) => {
  const pairs = (list) => Object.fromEntries((list || []).map(({ from, to }) => [from, to]));
  const norm = pairs(query.normalized);
  const red = pairs(query.redirects);

  const out = {};
  for (const o of originals) {
    let t = norm[o] || o;
    // הפניה עשויה להשתרשר; `seen` מונע לולאה אינסופית על הפניה מעגלית
    const seen = new Set();
    while (red[t] && !seen.has(t)) { seen.add(t); t = red[t]; }
    (out[t] = out[t] || []).push(o);
  }
  return out;
};

/**
 * האם הערך הזה הוא באמת המקום, או משהו שרק נושא את שמו.
 *
 * נמדד ב-06.09.2026, אותה בקשה מרוכזת:
 *
 *   Pantheon  — **דף פירושונים**, 2,089 צפיות שנראות תקינות לגמרי
 *   Duomo     — ערך גנרי על המונח "קתדרלה", 2,151
 *   Rialto    — 1,803
 *   Roscioli  — שם משפחה, 13. לא המסעדה.
 *
 * לכל אחד מהם יש מספר, וכולם שגויים. מה שמפריד בינם לבין קולוסיאום
 * אינו הצפיות אלא **קואורדינטות**: לכל מקום אמיתי יש נקודה על המפה,
 * ולמונח מופשט אין. זה אותו כלל שכבר מיושם ב-`placeMediaService`
 * בשם `mustBePlace`, ומכאן הוא חל גם על המספרים ולא רק על התמונות.
 *
 * שדה ריק עדיף על ערך שגוי: הוא מתוקן על ידי המקור הבא, וערך שגוי
 * נסמכים עליו.
 */
const isRealPlace = (page) =>
  !!(page.coordinates && page.coordinates.length)
  && !(page.pageprops && 'disambiguation' in page.pageprops);

/** סך הצפיות ב-30 הימים, או null כשהשדה כלל לא הגיע. */
const sumViews = (page) => {
  if (!page.pageviews) return null;
  const nums = Object.values(page.pageviews).filter((v) => typeof v === 'number');
  return nums.reduce((s, v) => s + v, 0);
};

/**
 * פופולריות לרשימת מקומות.
 *
 * כל התוצאות נשמרות, ולכן חיפוש חוזר על אותו יעד אינו פונה לרשת כלל —
 * וזה מה שהופך את זה לחינמי גם בשימוש אמיתי.
 *
 * @param {Array<{nameEn?:string}>} places
 * @param {string} city
 * @returns {Promise<Object<string, number>>} מפה של nameEn ⟵ צפיות
 */
export const fetchPopularity = async (places = [], city = '') => {
  const cache = read();
  const out = {};
  let dirty = false;

  const ck = (nameEn) => `${nameEn}|${city}`.toLowerCase();

  // שמות ייחודיים בלבד. אותו מקום יכול להופיע גם כאטרקציה וגם כשוק,
  // ואין סיבה לשאול עליו פעמיים באותה בקשה.
  const wanted = [];
  const seen = new Set();
  for (const p of places) {
    const nameEn = (p && p.nameEn ? String(p.nameEn) : '').trim();
    // בלי שם באנגלית אין בדיקה. חיפוש בעברית מחזיר פגיעות שגויות,
    // וערך שגוי גרוע מערך חסר.
    if (!nameEn || seen.has(nameEn)) continue;
    seen.add(nameEn);

    const hit = cache[ck(nameEn)];
    if (hit && Date.now() - hit.at < TTL) {
      if (hit.views) out[nameEn] = hit.views;
      continue;
    }
    wanted.push(nameEn);
  }

  for (let i = 0; i < wanted.length; i += CHUNK) {
    const chunk = wanted.slice(i, i + CHUNK);
    try {
      const res = await askWiki(chunk);
      if (!res) continue;

      const back = chainBack(res.query, chunk);

      for (const page of res.pages.values()) {
        const names = back[page.title] || [];
        if (!names.length) continue;

        const sum = sumViews(page);
        let views;

        if (page.missing) {
          // אין ערך כזה בוויקיפדיה. תשובה סופית ונשמרת, אחרת אותו
          // מקום ייבדק בכל טעינה.
          views = 0;
        } else if (!isRealPlace(page)) {
          // דף פירושונים או ערך בלי מקום על המפה. שלילה כזו נשענת על
          // **היעדר** שדה, ובתשובה שנקטעה היעדר אינו אומר דבר — הוא
          // עלול להיות רק הסבב שלא הגיע. זו בדיוק התקלה שהתקרה של
          // `coordinates` ייצרה, ולכן שלילה נרשמת רק על תשובה שלמה.
          if (!res.complete) continue;
          views = 0;
        } else {
          // הערך קיים והוא מקום, אבל שדה הצפיות לא הגיע. נמדד
          // ב-06.09.2026 מיד אחרי סופת 429: אותם ערכים חזרו `null`
          // ובארבע ריצות שאחריהן היו מלאים. תשובה חלקית אינה עובדה,
          // ושמירתה הייתה קוברת מקום תקין לחודש.
          if (sum === null) continue;
          views = sum;
        }

        for (const n of names) {
          cache[ck(n)] = { views, at: Date.now() };
          dirty = true;
          if (views) out[n] = views;
        }
      }
    } catch {
      // כשל רשת אינו נשמר: הוא זמני, ושמירתו הייתה קוברת את המקום
      // לחודש. שקט כאן נכון — זהו קישוט, לא תוכן.
    }
  }

  if (dirty) write(cache);
  return out;
};

/**
 * שמות המקומות הבולטים ברשימה.
 *
 * יחסי ולא מוחלט: 40,000 צפיות זה הרבה לעיירה וקצת לרומא. הסימון ניתן
 * לשלושת הראשונים בלבד, ורק כשיש לפחות ארבעה מועמדים — סימון שמופיע
 * על כולם אינו מבדיל בין דבר לדבר, ולכן אינו אומר כלום.
 */
export const topPlaces = (viewsByName = {}, count = 3) => {
  const entries = Object.entries(viewsByName).filter(([, v]) => v > 0);
  if (entries.length <= count) return new Set();
  return new Set(
    entries.sort((a, b) => b[1] - a[1]).slice(0, count).map(([name]) => name)
  );
};

export default { fetchPopularity, topPlaces };
