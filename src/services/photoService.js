/**
 * מביא תמונות ממוזיאון ויקיפדיה (ללא API key, חינמי לחלוטין)
 */

const MEM_CACHE = {};
const LS_PREFIX = 'place_photo_';
const LS_TTL = 7 * 24 * 60 * 60 * 1000; // שבוע

function lsGet(key) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return undefined;
    const { url, ts } = JSON.parse(raw);
    if (Date.now() - ts > LS_TTL) { localStorage.removeItem(LS_PREFIX + key); return undefined; }
    return url; // יכול להיות null (נמצא אבל אין תמונה)
  } catch { return undefined; }
}

function lsSet(key, url) {
  try { localStorage.setItem(LS_PREFIX + key, JSON.stringify({ url, ts: Date.now() })); } catch {}
}

/**
 * מחזיר URL לתמונה מייצגת של מקום דרך Wikipedia REST API
 * @param {string} placeName  — שם המקום באנגלית
 * @param {string} country    — שם המדינה (אופציונלי, משפר את הדיוק)
 * @returns {Promise<string|null>}
 */
export async function getPlacePhoto(placeName, country = '') {
  // נסה קודם רק שם המקום, אח"כ עם מדינה
  const candidates = [
    `${placeName}${country ? ', ' + country : ''}`,
    placeName.split(',')[0].trim(),
  ].filter((v, i, a) => a.indexOf(v) === i); // unique

  for (const name of candidates) {
    const cacheKey = name.toLowerCase().replace(/[^a-z0-9]/g, '_');

    if (MEM_CACHE[cacheKey] !== undefined) return MEM_CACHE[cacheKey];
    const cached = lsGet(cacheKey);
    if (cached !== undefined) { MEM_CACHE[cacheKey] = cached; return cached; }

    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
        { headers: { 'Api-User-Agent': 'MyTripPlanner/1.0 (educational)' } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const url = data.thumbnail?.source || null;
      MEM_CACHE[cacheKey] = url;
      lsSet(cacheKey, url);
      if (url) return url;
    } catch {}
  }

  return null;
}
