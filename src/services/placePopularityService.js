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
 *   באנגלית — 14 פגיעות, אפס החטאות, אפס פגיעות שגויות
 *   בעברית  — "בתי הקובייה" ⟵ "קוביית משחק". פגיעה שגויה שנראית נכונה.
 * לכן הפונקציה מקבלת `nameEn` בלבד, ומחזירה כלום בלעדיו. זה אותו לקח
 * שכבר מיושם ב-`placeMediaService` דרך `localName`.
 */

const KEY = 'placePopularity';
const TTL = 30 * 86400000; // הנתון עצמו חודשי; אין טעם לרענן מהר יותר
const UA = 'my-trip-planner (https://my-trip-planner-ten.vercel.app)';

const read = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
};
const write = (m) => {
  try { localStorage.setItem(KEY, JSON.stringify(m)); } catch { /* מכסה מלאה — לא נורא */ }
};

const monthRange = () => {
  const end = new Date();
  const start = new Date(Date.now() - 30 * 86400000);
  const f = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return [f(start), f(end)];
};

/**
 * הערך בוויקיפדיה שמתאים לשם, או null.
 *
 * ── שם העיר מצורף רק כשהוא באותיות לטיניות ──
 * המודל מחזיר `nameEn` בשם המקומי ("Colosseo", "Fontana di Trevi"),
 * והעיר מגיעה כפי שהמשתמש הקליד — בעברית. נמדד בדפדפן 05.09.2026:
 *
 *   "Colosseo"            ⟵ Colosseum       ✓
 *   "Colosseo רומא"       ⟵ null            ✗
 *   "Fontana di Trevi"    ⟵ Trevi Fountain  ✓
 *   "Musei Vaticani"      ⟵ Vatican Museums ✓
 *
 * ויקיפדיה מטפלת בהפניה מהשם המקומי לערך האנגלי לבדה; מילה בעברית
 * בשאילתה הורסת את ההתאמה לגמרי. לכן העיר מצורפת רק כשהיא עשויה
 * לעזור — כלומר כשהיא באותה מערכת כתב.
 */
const isLatin = (v) => /^[\p{Script=Latin}\d\s'’.,()-]+$/u.test(String(v || '').trim());

const findArticle = async (nameEn, city) => {
  const suffix = isLatin(city) ? ` ${city}` : '';
  const q = encodeURIComponent(`${nameEn}${suffix}`.trim());
  const url = `https://en.wikipedia.org/w/api.php?format=json&origin=*&action=query&list=search&srsearch=${q}&srlimit=1`;
  const r = await fetch(url, { headers: { 'Api-User-Agent': UA } });
  if (!r.ok) return null;
  const j = await r.json();
  return j?.query?.search?.[0]?.title || null;
};

/** סך הצפיות בערך ב-30 הימים האחרונים. */
const articleViews = async (title) => {
  const [from, to] = monthRange();
  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${encodeURIComponent(title)}/daily/${from}/${to}`;
  const r = await fetch(url, { headers: { 'Api-User-Agent': UA } });
  if (!r.ok) return null;
  const j = await r.json();
  return (j.items || []).reduce((s, i) => s + i.views, 0);
};

/**
 * פופולריות לרשימת מקומות, בזה אחר זה.
 *
 * הבקשות מווסתות ב-700ms: הסקירה נחסמה ב-429 כשהן נשלחו ברצף.
 * כל תוצאה נשמרת, ולכן חיפוש חוזר על אותו יעד אינו פונה לרשת כלל —
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

  for (const p of places) {
    const nameEn = (p && p.nameEn ? String(p.nameEn) : '').trim();
    // בלי שם באנגלית אין בדיקה. חיפוש בעברית מחזיר פגיעות שגויות,
    // וערך שגוי גרוע מערך חסר.
    if (!nameEn) continue;

    const k = `${nameEn}|${city}`.toLowerCase();
    const hit = cache[k];
    if (hit && Date.now() - hit.at < TTL) {
      if (hit.views) out[nameEn] = hit.views;
      continue;
    }

    try {
      const title = await findArticle(nameEn, city);
      await new Promise((r) => setTimeout(r, 700));
      const views = title ? await articleViews(title) : null;

      // גם היעדר נשמר, אחרת אותו מקום שאין לו ערך ייבדק בכל טעינה.
      cache[k] = { views: views || 0, at: Date.now() };
      dirty = true;
      if (views) out[nameEn] = views;
    } catch {
      // כשל רשת אינו נשמר: הוא זמני, ושמירתו הייתה קוברת את המקום
      // לחודש. שקט כאן נכון — זהו קישוט, לא תוכן.
    }
    await new Promise((r) => setTimeout(r, 700));
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
