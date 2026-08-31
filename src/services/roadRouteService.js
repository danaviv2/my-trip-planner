/**
 * מרחק וזמן נסיעה אמיתיים למסלול.
 *
 * ── מה היה כאן ──
 * "מרחק: לא זמין | זמן נסיעה: לא זמין" הוצג שני סנטימטרים מעל מפה שהראתה
 * 347 ק"מ ו-3:53. החישוב נשען על `DirectionsService` של Google Maps JS API,
 * שהוסר ב-25.2.2026 (קומיט fd94535) לטובת iframe. הפונקציה נשארה שלמה
 * בקוד, אך הדגל `isMapsLoaded` שהיא תלויה בו מעולם לא נדלק שוב — הוא
 * נקבע ב-`onMapLoad` של רכיב `<GoogleMap>` שאינו קיים עוד.
 *
 * ה-iframe מחשב את המסלול בעצמו ואינו מדבר עם האפליקציה, ולכן המסך
 * הכחיש נתון שהוצג עליו.
 *
 * ── למה לא קו אווירי ──
 * הפיתוי היה להשתמש ב-`routeGeometryService` הקיים. הקובץ עצמו כותב
 * שהמרחקים שם אוויריים ו"אינם מתיימרים להחליף ניווט": פורטו–ליסבון הוא
 * כ-275 ק"מ באוויר מול 347 בכביש — פער של 26%. מי שמתכנן נהיגה יטעה
 * לפיו, וזה בדיוק סוג הערך שנראה נכון ואינו.
 *
 * ── המקור ──
 * OSRM, ניתוב קוד פתוח, בלי מפתח ובלי חשבון. נמדד מול המסלול האמיתי של
 * המשתמש: 344 ק"מ מול 347 של גוגל — פחות מאחוז.
 *
 * **זהו שרת הדגמה ציבורי.** מדיניות השימוש שלו מיועדת לעומס קל, ולכן יש
 * כאן מטמון ופסק זמן קצר. אם השירות ייסגר או יגביל — ראה `null`.
 *
 * ── וכשאין תשובה, אין שורה ──
 * אין נפילה חזרה לקו אווירי. מספר שמוצג כ"מרחק נסיעה" ובאמת אווירי הוא
 * בדיוק הטעות שמנגנון זה בא לתקן. שדה ריק מתוקן; שדה שגוי מטעה.
 */

import { humanGap } from './tripTimelineService';

const OSRM = 'https://router.project-osrm.org/route/v1/driving';
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

const GEO_PREFIX = 'road_geo_';
// v2: ערכים שנשמרו לפני שהגיאומטריה נוספה אינם מכילים `path`. בלי החלפת
// הקידומת הם היו מוחזרים מהמטמון כתקינים, והמפה הייתה נשארת ריקה בלי
// שדבר ייכשל — בדיוק סוג הערך החסר שעובר כל בדיקת נוכחות.
const ROUTE_PREFIX = 'road_route_v2_';
const TTL = 30 * 24 * 60 * 60 * 1000; // קואורדינטות של עיר אינן זזות

/** פסק זמן קצר: מסך שממתין לשרת הדגמה גרוע ממסך בלי השורה. */
const TIMEOUT_MS = 6000;

const cacheGet = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    const { value, ts } = JSON.parse(raw);
    if (Date.now() - ts > TTL) { localStorage.removeItem(key); return undefined; }
    return value;
  } catch { return undefined; }
};

const cacheSet = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify({ value, ts: Date.now() })); } catch {}
};

const fetchWithTimeout = async (url) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    return res.ok ? res : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

/**
 * קואורדינטות של שם מקום.
 *
 * Nominatim מבקשת לא לירות בקשות במקביל, ולכן הקריאות כאן מסודרות בטור
 * בידי הקורא. תוצאה נשמרת לחודש: עיר אינה זזה.
 */
export const geocode = async (place) => {
  const name = String(place || '').trim();
  if (!name) return null;

  const key = GEO_PREFIX + name.toLowerCase();
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;

  const res = await fetchWithTimeout(
    `${NOMINATIM}?format=json&limit=1&q=${encodeURIComponent(name)}`
  );
  if (!res) return null;

  try {
    const data = await res.json();
    const hit = data && data[0];
    const point = hit ? { lat: Number(hit.lat), lng: Number(hit.lon) } : null;
    // רק תוצאה חיובית נשמרת. כישלון רשת שנשמר היה מקבע "אין מסלול"
    // לחודש שלם על מקום שקיים.
    if (point) cacheSet(key, point);
    return point;
  } catch {
    return null;
  }
};

/** "347 ק"מ" */
export const formatKm = (km) =>
  km == null ? '' : km < 1 ? `${Math.round(km * 1000)} מ'` : `${Math.round(km)} ק"מ`;

/**
 * משך הנסיעה, בעברית תקנית.
 *
 * הגרסה הראשונה כאן הייתה מעצב זמן שני שכתבתי בעצמי, והיא הציגה על
 * המסך "4 שעות ו-1 דקות". `humanGap` כבר קיים ומטפל ביחיד ובזוגי —
 * "דקה", "שעתיים", "יומיים" — ו-`CLAUDE.md` מזהיר במפורש שצורות אלה
 * אינן קישוט. מעצב אחד בפרויקט, לא שניים שיתפצלו בשינוי הבא.
 */
export const formatMinutes = (mins) =>
  mins == null ? '' : humanGap(Math.round(mins));

/**
 * דילול צורת המסלול לפני שמירה.
 *
 * OSRM מחזיר 2,930 נקודות לפירנצה–רומא, שהן 68KB במטמון לכל מסלול —
 * `localStorage` היה מתמלא אחרי כמה מסלולים ו-`cacheSet` נכשל בשקט.
 * `overview=simplified` נותן 28 נקודות בלבד, והמסלול נראה כקווים ישרים
 * שחותכים פניות. דילול לכ-300 נקודות הוא נקודה לכל קילומטר, מדויק בכל
 * זום סביר ושוקל כ-7KB. הקצוות נשמרים תמיד, אחרת המסלול לא נוגע בערים.
 */
const thinPath = (coords, max = 300) => {
  if (!Array.isArray(coords) || coords.length === 0) return [];
  const step = Math.max(1, Math.ceil(coords.length / max));
  const out = [];
  for (let i = 0; i < coords.length; i += step) out.push(coords[i]);
  const last = coords[coords.length - 1];
  if (out[out.length - 1] !== last) out.push(last);
  // OSRM מחזיר [lng, lat]; גוגל מצפה ל-{lat, lng}. היפוך שקט כאן היה
  // מציב את המסלול בסומליה.
  return out.map(([lng, lat]) => ({ lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) }));
};

/**
 * מסלול נהיגה דרך כל הנקודות, לפי סדרן.
 *
 * @param {Array<{lat:number,lng:number}>} points שתי נקודות לפחות
 * @returns {Promise<{km:number, minutes:number, distance:string, duration:string, path:Array<{lat:number,lng:number}>}|null>}
 */
export const routeThrough = async (points = []) => {
  const valid = points.filter(
    (p) => p && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng))
  );
  if (valid.length < 2) return null;

  const path = valid.map((p) => `${p.lng},${p.lat}`).join(';');
  const key = ROUTE_PREFIX + path;
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;

  const res = await fetchWithTimeout(`${OSRM}/${path}?overview=full&geometries=geojson`);
  if (!res) return null;

  try {
    const data = await res.json();
    const route = data && data.routes && data.routes[0];
    if (!route) return null;

    const km = route.distance / 1000;
    const minutes = route.duration / 60;
    const value = {
      km,
      minutes,
      distance: formatKm(km),
      duration: formatMinutes(minutes),
      path: thinPath(route.geometry && route.geometry.coordinates),
    };
    cacheSet(key, value);
    return value;
  } catch {
    return null;
  }
};

/**
 * אותו דבר, לפי שמות מקומות.
 *
 * הקידוד סדרתי בכוונה — Nominatim מבקשת בקשה אחת בכל פעם — ולכן מסלול
 * בן ארבע תחנות עולה כארבע שניות בפעם הראשונה, ואפס בכל פעם אחריה.
 * מקום אחד שלא זוהה מבטל את החישוב: מסלול חלקי שמוצג כמלא הוא מספר
 * שגוי, לא מספר חסר.
 */
export const routeThroughNames = async (names = []) => {
  const clean = names.map((n) => String(n || '').trim()).filter(Boolean);
  if (clean.length < 2) return null;

  const points = [];
  for (const name of clean) {
    const p = await geocode(name);
    if (!p) return null;
    points.push(p);
  }

  return routeThrough(points);
};

export default { routeThrough, routeThroughNames, geocode, formatKm, formatMinutes };
