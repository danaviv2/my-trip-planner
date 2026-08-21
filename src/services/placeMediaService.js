/**
 * תמונה וקישור רשמי של מקום — משני מקורות שבני אדם מתחזקים.
 *
 * ── מה זה מחליף ──
 * התמונות באו מ-picsum.photos, שירות תצלומים אקראיים: תחת "קתדרלת סנטה
 * מריה דל פיורה" הופיע גשר במקום אחר בעולם. מדידה הראתה גם ש-15 מתוך 84
 * מזהי התמונות שנבחרו ידנית מחזירים 404, ושהשירות source.unsplash.com,
 * שגיבה אותם, מת לחלוטין (503).
 *
 * תמונה אקראית שכתוב מתחתיה שם מקום היא עובדה מפוברקת. הנזק אינו
 * בתמונה עצמה — משתמש שזיהה אחת כזו מפסיק להאמין גם למחיר ולשעות
 * הפתיחה שלצידה, וזה בדיוק המידע שהוא בא בשבילו.
 *
 * ── הכלל ──
 * תמונה אמיתית של המקום, או שום תמונה. אין ממלא מקום שמתחזה לתצלום.
 *
 * ── סדר המקורות, לפי מדידה ולא לפי הנחה ──
 * 1. ויקיפדיה העברית, לפי השם שמוצג למשתמש. מדידה: תשעה מתוך עשרה
 *    מקומות ומאכלים נמצאו כך — מגדל אייפל, הקולוסיאום, פונטה וקיו,
 *    ואפילו קרואסון. זה גם החיפוש הזול ביותר, ולכן הוא ראשון: אין בו
 *    מגבלת קצב, בניגוד לשירות המפות שמגביל לבקשה בשנייה.
 * 2. ויקיפדיה הכללית לפי השם המקומי.
 * 3. תגית wikipedia של OpenStreetMap. אחרונה כי היא היקרה ביותר, אך
 *    נחוצה: "Boboli Gardens" לא נמצא בשום ויקיפדיה, בעוד OSM מחזיר
 *    "it:Giardino di Boboli" — הערך המדויק.
 * 4. אחרת — null, והכרטיס יוצג בלי תמונה.
 *
 * הקישור הרשמי מגיע מתגית website של OpenStreetMap בלבד. כתובת שהמודל
 * מייצר נראית סבירה ומובילה לדף שגיאה, וזה מה שקרה בפועל.
 */

import { getPlacePhoto } from './photoService';
import { distanceKmExact } from './routeGeometryService';

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const WIKI_REST = (lang, title) =>
  `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

/** מדיניות Nominatim מגבילה לבקשה בשנייה. */
const RATE_MS = 1100;

const LS_PREFIX = 'place_media_';
const LS_TTL = 7 * 24 * 60 * 60 * 1000;

const MEM = {};

/**
 * מפתח מטמון יציב לכל שפה.
 *
 * הגרסה הראשונה סיננה כל תו שאינו לטיני, ולכן כל שם בעברית הצטמצם
 * לאותו מפתח: שישה מקומות שונים קיבלו את תמונת מגדל אייפל. הבדיקה
 * הראתה "7 מתוך 8 נמצאו" ונראתה מוצלחת — הכשל התגלה רק בקריאת שמות
 * הקבצים שהוחזרו.
 *
 * גיבוב על המחרוזת המלאה מטפל בעברית, באיטלקית ובכל שפה אחרת.
 */
const keyOf = (name, city) => {
  const raw = `${name}|${city}`.toLowerCase().trim();
  let h = 5381;
  for (let i = 0; i < raw.length; i += 1) h = ((h << 5) + h + raw.charCodeAt(i)) >>> 0;
  return `${raw.replace(/[^a-z0-9|]+/g, '_').slice(0, 40)}_${h.toString(36)}`;
};

const cacheGet = (key) => {
  if (MEM[key] !== undefined) return MEM[key];
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return undefined;
    const { value, ts } = JSON.parse(raw);
    if (Date.now() - ts > LS_TTL) {
      localStorage.removeItem(LS_PREFIX + key);
      return undefined;
    }
    MEM[key] = value;
    return value;
  } catch {
    return undefined;
  }
};

const cacheSet = (key, value) => {
  MEM[key] = value;
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify({ value, ts: Date.now() }));
  } catch {}
};

/**
 * וריאנטים של שם מקום, מהמלא אל הגרעין.
 *
 * ── למה זה נחוץ ──
 * השמות שמגיעים אינם כותרות ערך אלא תיאורים: "קתדרלת סנטה מריה דל
 * פיורה (הדואומו)", "גלריית האקדמיה (דוד של מיכלאנג׳לו)", "סיור בהר
 * וזוב: כרטיס דילוג על התור". כל אחד מהם מחזיר 404 — וכל אחד מהם נמצא
 * מיד כשמסירים את התוספת. הקתדרלה מפורסמת ומצולמת, והחיפוש נכשל על
 * סוגריים.
 *
 * הסדר הוא מהמדויק למוכלל, כדי שערך ספציפי לא יידרס בכללי.
 */
export const nameVariants = (raw = '') => {
  const base = String(raw).replace(/\s+/g, ' ').trim();
  if (!base) return [];

  const out = [];
  const push = (v) => {
    const t = String(v).replace(/\s+/g, ' ').trim().replace(/[,.;·\-–—]+$/, '').trim();
    if (t.length > 1 && !out.includes(t)) out.push(t);
  };

  push(base);
  // מה שאחרי נקודתיים או מקף הוא תיאור הכרטיס, לא שם המקום
  push(base.split(/[:|]/)[0]);
  push(base.replace(/\s*[([][^)\]]*[)\]]\s*/g, ' '));
  push(base.split(/[:|]/)[0].replace(/\s*[([][^)\]]*[)\]]\s*/g, ' '));
  // פועל פותח: "סיור בהר וזוב" → "הר וזוב"
  const stripped = out
    .map((v) => v.replace(/^(סיור|ביקור|טיול|כניסה|כרטיס(ים)?|הופעה)\s+(ב|ל|ה)?/, ''))
    .filter(Boolean);
  stripped.forEach(push);

  return out.slice(0, 5);
};

/**
 * תקציר ערך: התמונה והמיקום.
 *
 * ── שלוש תוצאות ולא שתיים ──
 * נמצא · אין ערך כזה · הבדיקה נכשלה. ההבחנה בין השניים האחרונים
 * מכריעה: 404 הוא ידיעה ששווה לשמור, ואילו 429 — ויקיפדיה מגבילה קצב,
 * ודף עם שש-עשרה אטרקציות מגיע לשם בקלות — הוא כישלון זמני. שמירתו
 * במטמון הייתה מקבעת "אין תמונה" לשבוע שלם על מקום שיש לו תמונה.
 *
 * @returns {{photo, coords}|null|false} אובייקט = נמצא · null = אין
 *   ערך · false = הבדיקה נכשלה, אין להסיק דבר
 */
const wikiSummary = async (lang, title) => {
  const name = String(title || '').trim();
  if (!name) return null;
  try {
    const res = await fetch(WIKI_REST(lang, name), {
      headers: { 'Api-User-Agent': 'MyTripPlanner/1.0 (educational)' },
    });
    if (res.status === 404) return null;
    if (!res.ok) return false;
    const data = await res.json();
    return {
      photo: data.thumbnail?.source || null,
      coords: data.coordinates
        ? { lat: data.coordinates.lat, lng: data.coordinates.lon }
        : null,
    };
  } catch {
    return false;
  }
};

/**
 * תור בקשות עם רווח קבוע.
 *
 * הדפדפן ירה שש-עשרה בקשות בבת אחת וקיבל 429. הרווח קטן — ויקיפדיה
 * אינה מגבילה לבקשה בשנייה כמו שירות המפות — אך די בו כדי לא להיראות
 * כמטח.
 */
const GAP_MS = 250;
let chain = Promise.resolve();

const queued = (fn) => {
  const run = chain.then(fn);
  chain = run.then(
    () => new Promise((r) => setTimeout(r, GAP_MS)),
    () => new Promise((r) => setTimeout(r, GAP_MS))
  );
  return run;
};

const wikiPhoto = async (lang, title) => {
  const sum = await wikiSummary(lang, title);
  return sum ? sum.photo : null;
};

const WIKI_SEARCH = (lang, q) =>
  `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}` +
  '&srlimit=3&format=json&origin=*';

/**
 * האם הכותרת שנמצאה מתארת את מה שחיפשנו.
 *
 * ── למה שער נוסף על החיפוש ──
 * החיפוש פותר פירושונים וניסוחים ("קתדרלת נוטרדאם" → "קתדרלת נוטרדאם
 * (פריז)"), אך גם מחזיר שכנים סבירים למראה: "מקדש סנסו-ג׳י" החזיר
 * "טאייטו", שהוא הרובע שבו המקדש עומד. יש לו תמונה, הוא בטוקיו, ובדיקת
 * המרחק הייתה מאשרת אותו — תמונה אמיתית של הדבר הלא נכון.
 *
 * לכן נדרשת מילה משמעותית משותפת. זה פוסל את "טאייטו" ומאשר את
 * "מוזיאוני הוותיקן" מול "הוותיקן ומוזיאוניו".
 */
const NOISE_WORDS = /^(ה|ו|של|את|the|of|de|di|la|le|il|and|museum|מוזיאון|קתדרלת|מקדש|גן|שוק|רחוב)$/i;

const meaningfulWords = (text) =>
  String(text || '')
    .replace(/[()[\]{}''"״׳,.:;·\-–—]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !NOISE_WORDS.test(w));

const titleMatches = (query, title) => {
  const a = meaningfulWords(query);
  const b = meaningfulWords(title);
  if (!a.length || !b.length) return false;
  return a.some((w) => b.some((t) => t.includes(w) || w.includes(t)));
};

/** הכותרת המתאימה ביותר בוויקיפדיה, דרך חיפוש ולא דרך ניחוש כותרת. */
const searchTitles = async (lang, query) => {
  try {
    const res = await fetch(WIKI_SEARCH(lang, query));
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.query?.search || []).map((r) => r.title);
  } catch {
    return [];
  }
};

/**
 * מיקום העיר, לאימות שהערך שנמצא באמת שם.
 *
 * נשלף פעם אחת לעיר ונשמר, ולכן אינו מוסיף עלות מורגשת.
 */
const cityCoords = async (city) => {
  const name = String(city || '').trim();
  if (!name) return null;

  const key = `city_${keyOf(name, '')}`;
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;

  const he = await queued(() => wikiSummary('he', name));
  const sum = he || (await queued(() => wikiSummary('en', name)));
  if (sum === false || sum === null) return null;
  const coords = (sum && sum.coords) || null;
  cacheSet(key, coords);
  return coords;
};

/**
 * האם הערך שנמצא נמצא באמת בעיר הנכונה.
 *
 * ── למה זה קיים ──
 * "גלריית האקדמיה" מחזירה בוויקיפדיה את המוזיאון שבוונציה: תצלום
 * אמיתי, מקום אמיתי, ומאתיים קילומטר מפירנצה. זו בדיוק אותה תקלה
 * שהתחלנו ממנה — תמונה שאינה של המקום — רק בלבוש משכנע יותר.
 *
 * ערך בלי קואורדינטות עובר: מאכל, מנהג או מושג אינם נמצאים בשום מקום,
 * ופסילתם הייתה מוחקת את "קרואסון" ואת "בף בורגיניון".
 */
const MAX_KM_FROM_CITY = 60;

const belongsToCity = (articleCoords, city) => {
  if (!articleCoords || !city) return true;
  const km = distanceKmExact(articleCoords, city);
  return km == null || km <= MAX_KM_FROM_CITY;
};

/** תמונה מתגית "lang:Title" כפי שהיא מופיעה ב-OpenStreetMap. */
const photoFromWikiTag = (tag) => {
  const m = /^([a-z-]{2,10}):(.+)$/.exec(String(tag || '').trim());
  return m ? wikiPhoto(m[1], m[2]) : Promise.resolve(null);
};

/**
 * תמונה של מקום, בלי לגעת בשירות המפות.
 *
 * זהו המסלול של הרוב המכריע: שתי בקשות לכל היותר, בלי מגבלת קצב, ולכן
 * דף עם שש-עשרה אטרקציות מתמלא בשניות ולא בדקה.
 *
 * @param {string} displayName השם המוצג, בעברית
 * @param {string} localName   השם המקומי, אם ידוע
 */
export const getPlacePhotoFast = async (displayName, localName = '', city = '') => {
  const key = `photo_${keyOf(displayName, `${localName}|${city}`)}`;
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;

  const anchor = await cityCoords(city);
  let photo = null;

  let failed = false;

  const tryLang = async (lang, name) => {
    for (const variant of nameVariants(name)) {
      const sum = await queued(() => wikiSummary(lang, variant));
      if (sum === false) { failed = true; continue; }
      if (!sum || !sum.photo) continue;
      // תמונה של המקום הנכון בלבד. ערך בעיר אחרת נדחה גם כשהוא תקין.
      if (belongsToCity(sum.coords, anchor)) return sum.photo;
    }
    return null;
  };

  photo = await tryLang('he', displayName);

  // חיפוש, כשהכותרת המדויקת לא הספיקה. פותר פירושונים וניסוחים, ולכן
  // הוא זה שמביא את "קתדרלת נוטרדאם" ואת "מוזיאוני הוותיקן".
  if (!photo) {
    const titles = await queued(() => searchTitles('he', city ? `${displayName} ${city}` : displayName));
    for (const title of titles) {
      if (!titleMatches(displayName, title)) continue;
      const sum = await queued(() => wikiSummary('he', title));
      if (sum === false) { failed = true; continue; }
      if (sum && sum.photo && belongsToCity(sum.coords, anchor)) { photo = sum.photo; break; }
    }
  }

  if (!photo && localName) photo = await tryLang('en', localName);

  // null נשמר רק כשוויקיפדיה ענתה במפורש שאין ערך כזה. אם בקשה כלשהי
  // נכשלה בדרך, אין מסקנה לשמור — הניסיון הבא יבדוק מחדש.
  if (photo || !failed) cacheSet(key, photo || null);
  return photo || null;
};

/**
 * מה ש-OpenStreetMap יודע על המקום.
 *
 * ── ההבחנה שחייבת להישמר ──
 * "נבדק ואין לו אתר" ו"הבדיקה נכשלה" הם שני מצבים שונים לגמרי, והערך
 * המוחזר מבדיל ביניהם: אובייקט מול null. בגרסה הראשונה שניהם החזירו
 * ערך ריק, והתוצאה נשמרה במטמון לשבוע — כלומר תקלת רשת רגעית הייתה
 * מוחקת את הקישור הרשמי של המקום לשבוע שלם, בלי שדבר יסמן זאת.
 */
const lookupOsm = async (query) => {
  try {
    const res = await fetch(
      `${NOMINATIM}?q=${encodeURIComponent(query)}&format=json&limit=1&extratags=1`
    );
    if (!res.ok) return null;
    const rows = await res.json();
    const tags = (rows[0] && rows[0].extratags) || {};
    return {
      website: tags.website || tags['contact:website'] || '',
      wikipedia: tags.wikipedia || '',
    };
  } catch {
    return null;
  }
};

/**
 * @returns {Promise<{photo: string|null, website: string}>}
 *   photo ריק פירושו שלא נמצאה תמונה של המקום הזה — ואין להציג אחרת
 *   במקומה.
 */
export const getPlaceMedia = async (name, city = '', country = '') => {
  const clean = String(name || '').trim();
  if (!clean) return { photo: null, website: '' };

  const key = keyOf(clean, city);
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;

  const osm = await lookupOsm(city ? `${clean}, ${city}` : clean);

  let photo = await getPlacePhotoFast(clean, clean);
  if (!photo && osm && osm.wikipedia) photo = await photoFromWikiTag(osm.wikipedia);
  if (!photo) photo = await getPlacePhoto(clean, country || city);

  const result = { photo: photo || null, website: (osm && osm.website) || '' };

  // תוצאה נשמרת רק כשהבדיקה באמת רצה. כישלון רשת שנשמר במטמון היה
  // מקבע "אין תמונה ואין אתר" לשבוע, וזו הצגת כישלון כתשובה.
  if (osm) cacheSet(key, result);

  return result;
};

/**
 * מביא מדיה לרשימת מקומות, אחד אחרי השני.
 *
 * טורי ולא מקבילי: מטח בקשות ל-Nominatim גורר חסימה, וחסימה מוחקת את
 * התמונות לכל המשתמשים ולא רק לדף הזה. מה שכבר במטמון אינו עולה בקשה,
 * ולכן ביקור שני בעיר מיידי.
 *
 * @param {Function} onEach נקרא אחרי כל מקום, כדי שהמסך יתמלא בהדרגה
 */
export const fillPlaceMedia = async (places = [], city = '', country = '', onEach = () => {}) => {
  for (const place of places) {
    const name = typeof place === 'string' ? place : place && place.name;
    if (!name) continue;

    const cachedKey = keyOf(String(name).trim(), city);
    const wasCached = cacheGet(cachedKey) !== undefined;

    const media = await getPlaceMedia(name, city, country);
    onEach(name, media);

    if (!wasCached) await new Promise((r) => setTimeout(r, RATE_MS));
  }
};
