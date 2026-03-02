const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || window.env?.REACT_APP_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const CACHE_PREFIX = 'dest_ai_';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

function getCached(name) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + name.toLowerCase());
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      localStorage.removeItem(CACHE_PREFIX + name.toLowerCase());
      return null;
    }
    return data;
  } catch { return null; }
}

function setCache(name, data) {
  try {
    localStorage.setItem(CACHE_PREFIX + name.toLowerCase(), JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

export const fetchDestinationFromAI = async (destinationName) => {
  if (!GEMINI_API_KEY) {
    throw new Error('NO_API_KEY');
  }

  const cached = getCached(destinationName);
  if (cached) {
    console.log(`📦 נטען מהמטמון: ${destinationName}`);
    return cached;
  }

  const seed = destinationName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  // פרומפט קצר וממוקד - פחות טוקנים = תגובה מהירה יותר
  const prompt = `You are a travel guide. Return ONLY a valid JSON object (no markdown, no extra text) about "${destinationName}" for Israeli tourists. Use Hebrew for all text values.

Required JSON structure:
{
  "country": "country name in Hebrew",
  "tags": ["tag1","tag2","tag3"],
  "description": "2-3 sentence description in Hebrew",
  "language": "official language",
  "currency": "currency (symbol)",
  "timezone": "GMT+X",
  "airport": "main airport name (CODE)",
  "bestTimeToVisit": "best months",
  "seasons": {"summer": "summer description with temps", "winter": "winter description with temps"},
  "events": [{"name":"event","date":"month","description":"desc"}],
  "attractions": [
    {"name":"name","rating":4.5,"description":"desc in Hebrew","recommendedDuration":"X hours","price":"price","tips":"tip"}
  ],
  "food": {
    "intro": "cuisine intro in Hebrew",
    "dishes": [{"name":"dish","description":"desc"}],
    "restaurants": [{"name":"name","rating":4.4,"description":"desc","cuisine":"type","priceRange":"$$","area":"area","website":""}],
    "markets": [{"name":"name","description":"desc","hours":"hours"}]
  },
  "transportation": {
    "overview": "transport overview",
    "fromAirport": "how to get from airport to city",
    "options": [{"name":"type","icon":"subway","iconColor":"#1976D2","description":"desc","cost":"cost","hours":"hours","website":""}],
    "tips": [{"title":"title","description":"desc"}]
  },
  "tips": {
    "beforeTravel": [{"icon":"language","title":"title","description":"desc"}],
    "hours": {"shopping":"hours","restaurants":"hours","attractions":"hours"},
    "local": [{"title":"title","description":"desc"}]
  },
  "nearbyDestinations": [{"name":"city","distance":"km"}],
  "itinerary": {
    "3days": [
      {"day":1,"title":"Day title","morning":"morning activity","afternoon":"afternoon activity","evening":"evening activity","food":"food recommendation","tip":"tip"},
      {"day":2,"title":"Day title","morning":"morning activity","afternoon":"afternoon activity","evening":"evening activity","food":"food recommendation","tip":"tip"},
      {"day":3,"title":"Day title","morning":"morning activity","afternoon":"afternoon activity","evening":"evening activity","food":"food recommendation","tip":"tip"}
    ],
    "5days": [
      {"day":1,"title":"title","morning":"activity","afternoon":"activity","evening":"activity","food":"food","tip":"tip"},
      {"day":2,"title":"title","morning":"activity","afternoon":"activity","evening":"activity","food":"food","tip":"tip"},
      {"day":3,"title":"title","morning":"activity","afternoon":"activity","evening":"activity","food":"food","tip":"tip"},
      {"day":4,"title":"title","morning":"activity","afternoon":"activity","evening":"activity","food":"food","tip":"tip"},
      {"day":5,"title":"title","morning":"activity","afternoon":"activity","evening":"activity","food":"food","tip":"tip"}
    ]
  },
  "budget": {
    "currency": "€",
    "note": "cost of living note",
    "budget": {"accommodation":30,"food":20,"transport":10,"activities":10,"total":70,"notes":"budget tips"},
    "mid": {"accommodation":100,"food":50,"transport":20,"activities":30,"total":200,"notes":"mid-range tips"},
    "luxury": {"accommodation":300,"food":150,"transport":50,"activities":100,"total":600,"notes":"luxury tips"},
    "tips": ["saving tip 1","saving tip 2"]
  },
  "practical": {
    "visa": "visa info for Israelis",
    "plugType": "plug type",
    "voltage": "220V",
    "simCard": "SIM card info",
    "currencyTips": "currency exchange tips",
    "health": "health tips and vaccinations",
    "emergencyNumbers": {"police":"number","ambulance":"number","touristPolice":"number"},
    "safety": {"level":"safe/caution/danger","color":"green","overview":"safety overview","tips":["tip"],"avoidAreas":["area"]},
    "neighborhoods": [{"name":"name","description":"desc","bestFor":"best for","priceRange":"$$"}],
    "shopping": {"intro":"intro","items":["item1","item2"],"areas":[{"name":"area","description":"desc"}]},
    "nightlife": {"intro":"intro","areas":[{"name":"area","description":"desc","type":"bars/clubs"}]}
  }
}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60 שניות

  try {
    console.log(`🌍 מחפש מידע AI על: ${destinationName}`);

    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 3500, temperature: 0.5 }
      })
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini error:', response.status, errText);
      if (response.status === 429) throw new Error('RATE_LIMIT');
      throw new Error(`API_ERROR_${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('✅ תגובת AI התקבלה');

    // נקה markdown אם יש
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // בדוק שהתגובה היא JSON ולא HTML
    if (!cleaned.startsWith('{')) {
      console.error('תגובה לא תקינה:', cleaned.substring(0, 200));
      throw new Error('INVALID_RESPONSE');
    }

    const parsed = JSON.parse(cleaned);

    // תמונות דינמיות לפי seed של שם היעד
    const coverImage = `https://picsum.photos/seed/${seed}/1200/600`;
    const attractions = (parsed.attractions || []).map((a, i) => ({
      ...a,
      image: `https://picsum.photos/seed/${seed + i + 10}/500/400`
    }));
    const food = {
      ...parsed.food,
      dishes: (parsed.food?.dishes || []).map((d, i) => ({
        ...d,
        image: `https://picsum.photos/seed/${seed + i + 20}/150/150`
      })),
      markets: (parsed.food?.markets || []).map((m, i) => ({
        ...m,
        image: `https://picsum.photos/seed/${seed + i + 30}/300/200`
      }))
    };
    const nearbyDestinations = (parsed.nearbyDestinations || []).map((n, i) => ({
      ...n,
      image: `https://picsum.photos/seed/${seed + i + 40}/300/200`
    }));

    const result = {
      name: destinationName,
      ...parsed,
      coverImage,
      attractions,
      food,
      nearbyDestinations,
      isAIGenerated: true,
      generalInfo: {
        language: parsed.language,
        currency: parsed.currency,
        timezone: parsed.timezone,
        airport: parsed.airport,
        bestTimeToVisit: parsed.bestTimeToVisit,
        seasons: parsed.seasons
      },
      currentWeather: {
        temperature: 22, feelsLike: 24, description: 'בהיר',
        icon: 'https://openweathermap.org/img/wn/01d@2x.png',
        humidity: 70, windSpeed: 3
      }
    };

    setCache(destinationName, result);
    return result;

  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('TIMEOUT');
    throw err;
  }
};
