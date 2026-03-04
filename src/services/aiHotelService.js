const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const CACHE_HOURS = 24;

const getCacheKey = (destination) => `hotels_ai_${destination.toLowerCase().trim()}`;

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

export const generateHotelRecommendations = async (destination) => {
  if (!destination) return [];
  const key = getCacheKey(destination);
  const cached = getCached(key);
  // השתמש ב-cache רק אם הוא כולל קואורדינטות
  if (cached && cached[0]?.lat) return cached;

  if (!GEMINI_API_KEY) throw new Error('NO_API_KEY');

  const prompt = `You are a travel expert with precise geographic knowledge. Recommend 9 real, well-known hotels in ${destination} — 3 budget, 3 boutique/unique, 3 luxury.
Return ONLY a valid JSON array (no markdown, no explanation):
[
  {
    "name": "Real hotel name",
    "category": "budget" | "boutique" | "luxury",
    "neighborhood": "neighborhood or area name",
    "pricePerNight": "price range in local currency e.g. €60-90",
    "rating": 4.3,
    "lat": 48.8566,
    "lng": 2.3522,
    "description": "2 sentence description in Hebrew",
    "whyRecommended": "1 sentence in Hebrew — what makes it special",
    "amenities": ["WiFi", "Breakfast", "Pool"],
    "emoji": "🏨"
  }
]
CRITICAL: Include accurate lat/lng coordinates for each hotel's real location. Use real hotels that actually exist. Vary the neighborhoods. Be specific.`;

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

  let hotels;
  try {
    hotels = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/);
    hotels = match ? JSON.parse(match[0]) : [];
  }

  setCache(key, hotels);
  return hotels;
};
