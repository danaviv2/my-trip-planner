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

/** תמונה מערך ויקיפדיה מסוים. */
const wikiPhoto = async (lang, title) => {
  const name = String(title || '').trim();
  if (!name) return null;
  try {
    const res = await fetch(WIKI_REST(lang, name), {
      headers: { 'Api-User-Agent': 'MyTripPlanner/1.0 (educational)' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.thumbnail?.source || null;
  } catch {
    return null;
  }
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
export const getPlacePhotoFast = async (displayName, localName = '') => {
  const key = `photo_${keyOf(displayName, localName)}`;
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;

  let photo = await wikiPhoto('he', displayName);
  if (!photo && localName) photo = await wikiPhoto('en', localName);

  // null נשמר גם הוא: ויקיפדיה החזירה תשובה ברורה שאין ערך כזה, וזו
  // ידיעה ולא כישלון. חיפוש חוזר בכל טעינה לא היה מוצא יותר.
  cacheSet(key, photo || null);
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
