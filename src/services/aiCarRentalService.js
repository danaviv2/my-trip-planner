const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const CACHE_HOURS = 24;

const getCacheKey = (location) => `carrental_ai_${location.toLowerCase().trim()}`;

const getCached = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp < CACHE_HOURS * 60 * 60 * 1000) return data;
    localStorage.removeItem(key);
  } catch {}
  return null;
};

const setCache = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {}
};

export const generateCarRentalTips = async (location) => {
  if (!location) return null;
  const key = getCacheKey(location);
  const cached = getCached(key);
  if (cached) return cached;

  if (!GEMINI_API_KEY) throw new Error('NO_API_KEY');

  const prompt = `You are a travel expert on car rentals. For the destination: ${location}, provide:
1. 6 car recommendations across 3 categories (2 per category): economy, family, premium
2. 3 practical local driving tips specific to this destination

Return ONLY valid JSON (no markdown):
{
  "cars": [
    {
      "name": "e.g. Renault Clio",
      "category": "economy" | "family" | "premium",
      "seats": 5,
      "transmission": "אוטומטי" | "ידני",
      "fuel": "בנזין" | "דיזל" | "היברידי" | "חשמלי",
      "pricePerDay": "price range e.g. €25-40/יום",
      "idealFor": "short description in Hebrew of who this car suits",
      "pros": ["pro1 in Hebrew", "pro2 in Hebrew"],
      "emoji": "🚗"
    }
  ],
  "drivingTips": [
    {
      "tip": "tip title in Hebrew",
      "detail": "detail in Hebrew",
      "emoji": "⚠️"
    }
  ],
  "localInfo": {
    "driveSide": "right" | "left",
    "tollRoads": true | false,
    "parkingDifficulty": "קל" | "בינוני" | "קשה",
    "recommendRenting": true | false,
    "recommendRentingReason": "one sentence in Hebrew"
  }
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );

  if (res.status === 429) throw new Error('RATE_LIMIT');
  if (!res.ok) throw new Error('API_ERROR');

  const json = await res.json();
  const raw = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const cleaned = raw.replace(/```json|```/g, '').trim();

  let result;
  try {
    result = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    result = match ? JSON.parse(match[0]) : { cars: [], drivingTips: [], localInfo: null };
  }

  setCache(key, result);
  return result;
};
