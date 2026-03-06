import { jsonrepair } from 'jsonrepair';

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || window.env?.REACT_APP_GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const CACHE_PREFIX = 'rolling_trip_';
const CACHE_TTL = 24 * 60 * 60 * 1000;

function getCached(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(CACHE_PREFIX + key); return null; }
    return data;
  } catch { return null; }
}

function setCache(key, data) {
  try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, ts: Date.now() })); } catch {}
}

/**
 * מגלה עצירות מעניינות לאורך מסלול
 * @param {string} start - נקודת מוצא
 * @param {string} end - יעד סופי
 * @param {string[]} waypoints - עצירות ביניים אופציונליות
 * @param {object} preferences - { pace: 'slow'|'medium'|'fast', interests: string[] }
 * @returns {Promise<Array>} עצירות מוסמכות
 */
export const discoverRouteStops = async (start, end, waypoints = [], preferences = {}) => {
  if (!GEMINI_API_KEY) throw new Error('NO_API_KEY');

  const { pace = 'medium', interests = [] } = preferences;
  const waypointsStr = waypoints.filter(Boolean).join(', ');
  const routeStr = waypointsStr ? `${start} → ${waypointsStr} → ${end}` : `${start} → ${end}`;

  const cacheKey = `${routeStr}_${pace}_${interests.join(',')}`.toLowerCase().replace(/\s+/g, '_');
  const cached = getCached(cacheKey);
  if (cached) { console.log('📦 טוען עצירות מסלול מהמטמון'); return cached; }

  const paceLabel = pace === 'slow' ? 'relaxed (prefer fewer, deeper experiences)'
    : pace === 'fast' ? 'fast-paced (many stops, efficient)'
    : 'balanced';
  const interestsStr = interests.length > 0 ? interests.join(', ') : 'culture, history, food, nature';

  const prompt = `You are a route discovery expert for Israeli tourists.
The traveler wants to drive/travel from ${start} to ${end}${waypointsStr ? ` passing through ${waypointsStr}` : ''}.

Travel pace: ${paceLabel}
Interests: ${interestsStr}

Discover 6 to 10 interesting stops along this route — cities, towns, natural sites, viewpoints, or unique attractions that are actually on or near this route.

Return ONLY a valid JSON array (no markdown, no extra text). Use Hebrew for ALL text values (whyVisit, highlights, drivingFromPrev).

Required format:
[
  {
    "name": "Lyon",
    "country": "France",
    "emoji": "🏛️",
    "type": "city",
    "whyVisit": "עיר קולינרית מדהימה עם ארכיטקטורה עתיקה",
    "highlights": ["שוק הבושון המסורתי", "גבעת פורוויאר עם נוף פנורמי", "רובע הביניים ההיסטורי"],
    "lat": 45.75,
    "lng": 4.85,
    "recommendedDays": 2,
    "bestSeason": "Spring/Summer",
    "drivingFromPrev": "2 שעות נסיעה"
  }
]

Rules:
- type must be one of: city, nature, viewpoint, historic, beach, adventure, food
- stops must be geographically ordered along the route from ${start} to ${end}
- include both ${start} and ${end} as first and last stops
- recommendedDays: 1-4 realistic days for each stop
- highlights: exactly 3 highlights in Hebrew
- drivingFromPrev: driving time from previous stop in Hebrew (e.g. "3 שעות נסיעה")
- whyVisit: 1-2 sentences in Hebrew explaining why this stop is special`;

  console.log(`🗺️ מגלה עצירות מסלול: ${routeStr}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 4000,
          temperature: 0.7,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    clearTimeout(timeout);
    if (!response.ok) {
      if (response.status === 429) throw new Error('RATE_LIMIT');
      throw new Error(`API_ERROR_${response.status}`);
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const content = (parts.find(p => !p.thought && p.text) || parts[0])?.text || '';

    let cleaned = content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .replace(/[\uFEFF\u200B\u200C\u200D\u00AD\u2060\u00A0]/g, '')
      .trim();

    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1) {
      cleaned = cleaned.slice(firstBracket, lastBracket + 1);
    }

    let parsed;
    try { parsed = JSON.parse(cleaned); }
    catch { parsed = JSON.parse(jsonrepair(cleaned)); }

    setCache(cacheKey, parsed);
    console.log(`✅ התגלו ${parsed.length} עצירות לאורך המסלול`);
    return parsed;
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('TIMEOUT');
    throw err;
  }
};
