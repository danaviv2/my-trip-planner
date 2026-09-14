/**
 * Vercel Serverless Function — שער אחד לשרתי המפה, המסלולים ומזג האוויר.
 *
 * ── למה השער קיים ──
 * עד 14.09.2026 כל דפדפן פנה ישירות ל-Nominatim, ל-OSRM ול-Open-Meteo.
 * מדיניות Nominatim (נקראה באותו יום) קובעת מקסימום בקשה בשנייה **לסכום
 * כל המשתמשים**, מחייבת זיהוי אפליקציה, ו"Results must be cached on your
 * side" — וממליצה במפורש על proxy עם מטמון. OSRM דורש User-Agent מזהה.
 * דפדפן אינו יכול לקבוע User-Agent, ומטמון ב-localStorage של כל משתמש
 * אינו מטמון "בצד שלנו": אלף משתמשים ששואלים על "פריז" הם אלף בקשות.
 *
 * ── מה השער נותן ──
 * 1. זיהוי: User-Agent עם כתובת האתר, כפי שכל שלושת השירותים מבקשים.
 * 2. מטמון משותף: `s-maxage` נשמר ב-CDN של Vercel לכל המשתמשים יחד
 *    (מתועד: "To cache the response of Functions on Vercel's CDN, you must
 *    include Cache-Control headers with s-maxage"). שאלה שנשאלה פעם אחת
 *    אינה מגיעה לשרת החיצוני שוב — וזה הרכיב שמקטין את הקצב הכולל.
 * 3. נקודת החלפה אחת: מעבר לספק אחר (מפתח, תשלום) משנה קובץ אחד, לא ארבעה.
 *
 * ── מה הוא אינו נותן ──
 * הגבלת קצב גלובלית אמיתית. מופעי serverless אינם חולקים זיכרון, ומונה
 * מקומי נותן ביטחון כוזב (ראה `_lib/guard.mjs`). תחת תנועה אמיתית, המטמון
 * לבדו אינו מבטיח בקשה בשנייה ל-Nominatim — זו הסיבה שסעיף 8 ב-STATUS
 * נשאר פתוח עד מעבר לספק בתשלום או לשרת משלנו.
 *
 * ── לא proxy פתוח ──
 * כל פעולה מקבלת רשימה סגורה של פרמטרים עם תקרת אורך. בלי זה השער היה
 * מאפשר לכל אחד לירות בשם האתר שלנו כל בקשה לשירותים האלה.
 */

import { rejectForeign } from './_lib/guard.mjs';

const UA = 'MyTripPlanner/1.0 (+https://my-trip-planner-ten.vercel.app)';

const DAY = 24 * 60 * 60;

// מקום אינו זז; מסלול כביש כמעט אינו משתנה; תחזית מתעדכנת כל כמה שעות.
const OPS = {
  search: {
    url: () => 'https://nominatim.openstreetmap.org/search',
    params: { q: 300, limit: 2, extratags: 1, 'accept-language': 40 },
    fixed: { format: 'json' },
    ttl: 30 * DAY,
  },
  route: {
    url: (req) => `https://router.project-osrm.org/route/v1/driving/${req.query.coords}`,
    params: { overview: 10, geometries: 10 },
    ttl: 30 * DAY,
  },
  forecast: {
    url: () => 'https://api.open-meteo.com/v1/forecast',
    params: {
      latitude: 20, longitude: 20, daily: 200, current: 200, timezone: 40,
      start_date: 10, end_date: 10, forecast_days: 2, wind_speed_unit: 5,
    },
    // שלוש שעות — אותו חלון שהלקוח כבר שמר (CACHE_TTL_MS ב-openMeteoService)
    ttl: 3 * 60 * 60,
  },
  wgeocode: {
    url: () => 'https://geocoding-api.open-meteo.com/v1/search',
    params: { name: 200, count: 2, language: 10 },
    fixed: { format: 'json' },
    ttl: 30 * DAY,
  },
};

// OSRM: `lng,lat;lng,lat` — 2 עד 25 נקודות, מספרים בלבד.
const COORD = '-?\\d{1,3}(\\.\\d+)?,-?\\d{1,2}(\\.\\d+)?';
const COORDS_RE = new RegExp(`^${COORD}(;${COORD}){1,24}$`);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'METHOD' });
  if (rejectForeign(req, res)) return undefined;

  const op = OPS[req.query.op];
  if (!op) return res.status(400).json({ error: 'BAD_OP' });
  if (req.query.op === 'route' && !COORDS_RE.test(String(req.query.coords || ''))) {
    return res.status(400).json({ error: 'BAD_COORDS' });
  }

  const qs = new URLSearchParams();
  for (const [name, max] of Object.entries(op.params)) {
    const v = req.query[name];
    if (v == null || v === '') continue;
    const s = String(v);
    if (s.length > max) return res.status(400).json({ error: 'BAD_PARAM', param: name });
    qs.set(name, s);
  }
  for (const [k, v] of Object.entries(op.fixed || {})) qs.set(k, v);

  try {
    const upstream = await fetch(`${op.url(req)}?${qs}`, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
    });
    const body = await upstream.text();

    // רק תשובה תקינה נשמרת במטמון המשותף. שגיאה זמנית שנשמרת לחודש
    // הייתה מקבעת "אין תוצאה" לכל המשתמשים — אותה מלכודת שכבר נשרפה
    // ב-localStorage (roadRouteService: "רק תוצאה חיובית נשמרת").
    res.setHeader('Cache-Control', upstream.ok
      ? `public, s-maxage=${op.ttl}, stale-while-revalidate=${DAY}`
      : 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(upstream.ok ? 200 : 502).send(body);
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ error: 'UPSTREAM_UNREACHABLE' });
  }
}
