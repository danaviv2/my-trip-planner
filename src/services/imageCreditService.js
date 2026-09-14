// services/imageCreditService.js
//
// קרדיט לתמונות מוויקיפדיה ומוויקישיתוף — יוצר ורישיון, כפי שהרישיון דורש.
//
// ── למה ──
// סקר 14.09.2026 על 36 התמונות שהאפליקציה מציגה בפועל: 32 ברישיון CC BY
// או CC BY-SA, שמחייבים ציון יוצר ורישיון "באופן סביר לאמצעי"
// (commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia).
// שלוש בנחלת הכלל, ואחת מוויקיפדיה העברית המקומית, ברישיון "ייחוס" ובלי שם
// יוצר. עד היום אף אחת לא הוצגה עם קרדיט.
//
// ── בקשה אחת לכל המסך ──
// באותו סקר, בקשה נפרדת לכל תמונה החזירה 429 מוויקימדיה אחרי כמה עשרות
// קריאות. כרטיסי תמונה נטענים יחד, ולכן הבקשות נאספות לחלון קצר ונשלחות
// כקבוצה של עד 40 כותרות לכל ויקי. הרישיון של קובץ אינו משתנה, והמטמון ארוך.
//
// ── קובץ שאינו חופשי ──
// קובץ מקומי בוויקיפדיה עשוי להיות בשימוש הוגן (NonFree), ושימוש חוזר בו אסור.
// הוא מסומן כך, והקורא אינו מציג את התמונה — שדה ריק עדיף על הפרה.

const CACHE_PREFIX = 'img_credit_v1_';
const TTL = 30 * 24 * 60 * 60 * 1000;
const BATCH_WINDOW_MS = 60;
const MAX_TITLES = 40;

/** הקובץ שמאחורי כתובת תמונה של ויקימדיה, או null כשזו אינה כזו. */
export const fileOf = (url) => {
  try {
    const u = new URL(url);
    if (!/(^|\.)wikimedia\.org$/.test(u.hostname)) return null;
    const m = u.pathname.match(/\/wikipedia\/([a-z-]+)\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/]+)/);
    return m ? { wiki: m[1], file: decodeURIComponent(m[2]) } : null;
  } catch {
    return null;
  }
};

const apiOf = (wiki) =>
  wiki === 'commons' ? 'https://commons.wikimedia.org/w/api.php' : `https://${wiki}.wikipedia.org/w/api.php`;

export const pageOf = ({ wiki, file }) =>
  wiki === 'commons'
    ? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`
    : `https://${wiki}.wikipedia.org/wiki/File:${encodeURIComponent(file)}`;

/**
 * ניקוי שדה היוצר. הערך מגיע כ-HTML ולעיתים עם הקדמה טכנית: נמדד
 * "No machine-readable author provided. Oss assumed (based on copyright
 * claims)." — השם האמיתי הוא "Oss".
 */
export const cleanArtist = (html = '') => {
  let s = String(html).replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
  const m = s.match(/No machine-readable author provided\.\s*(.+?)\s+assumed/i);
  if (m) s = m[1];
  s = s.replace(/\s*\(talk\)\s*/gi, ' ').trim();
  return s.length > 40 ? `${s.slice(0, 38)}…` : s;
};

const cacheGet = (key) => {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return undefined;
    const { v, at } = JSON.parse(raw);
    return Date.now() - at > TTL ? undefined : v;
  } catch {
    return undefined;
  }
};
const cacheSet = (key, v) => {
  try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ v, at: Date.now() })); } catch { /* אחסון מלא */ }
};

const pending = new Map(); // key -> {ref, resolvers[]}
let timer = null;

const flush = async () => {
  timer = null;
  const batch = [...pending.values()];
  pending.clear();
  const byWiki = {};
  batch.forEach((item) => (byWiki[item.ref.wiki] ||= []).push(item));

  await Promise.all(Object.entries(byWiki).map(async ([wiki, items]) => {
    for (let i = 0; i < items.length; i += MAX_TITLES) {
      const chunk = items.slice(i, i + MAX_TITLES);
      const titles = chunk.map((it) => `File:${it.ref.file}`).join('|');
      let pages = [];
      try {
        const res = await fetch(`${apiOf(wiki)}?action=query&format=json&origin=*&prop=imageinfo&iiprop=extmetadata`
          + `&iiextmetadatafilter=Artist|LicenseShortName|LicenseUrl|AttributionRequired|NonFree&titles=${encodeURIComponent(titles)}`);
        if (res.ok) pages = Object.values((await res.json()).query?.pages || {});
      } catch { /* רשת — הקרדיט לא יוצג, התמונה כן */ }

      const norm = (t) => String(t || '').replace(/^File:|^קובץ:/, '').replace(/_/g, ' ');
      chunk.forEach((it) => {
        const page = pages.find((p) => norm(p.title) === norm(it.ref.file));
        const md = page?.imageinfo?.[0]?.extmetadata;
        let credit = null;
        if (md) {
          const v = (k) => String(md[k]?.value ?? '').trim();
          credit = {
            artist: cleanArtist(v('Artist')),
            license: v('LicenseShortName').replace(/<[^>]+>/g, ''),
            licenseUrl: v('LicenseUrl'),
            page: pageOf(it.ref),
            nonFree: !!v('NonFree') && v('NonFree') !== 'false',
          };
          cacheSet(it.key, credit);
        }
        // תשובה ריקה אינה נשמרת: ייתכן שזו תקלה רגעית, ולא היעדר מידע.
        it.resolvers.forEach((r) => r(credit));
      });
    }
  }));
};

/**
 * הקרדיט של תמונה, או null כשאין (לא מוויקימדיה, או שהשירות לא ענה).
 * @returns {Promise<{artist,license,licenseUrl,page,nonFree}|null>}
 */
export const getImageCredit = (url) => {
  const ref = fileOf(url);
  if (!ref) return Promise.resolve(null);
  const key = `${ref.wiki}:${ref.file}`;
  const cached = cacheGet(key);
  if (cached !== undefined) return Promise.resolve(cached);
  return new Promise((resolve) => {
    const item = pending.get(key) || { ref, key, resolvers: [] };
    item.resolvers.push(resolve);
    pending.set(key, item);
    if (!timer) timer = setTimeout(flush, BATCH_WINDOW_MS);
  });
};
