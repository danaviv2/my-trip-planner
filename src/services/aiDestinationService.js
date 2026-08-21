import { jsonrepair } from 'jsonrepair';
import { geminiEndpoint } from './geminiClient';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = geminiEndpoint(GEMINI_MODEL);

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
  const cached = getCached(destinationName);
  if (cached) {
    console.log(`📦 נטען מהמטמון: ${destinationName}`);
    return cached;
  }

  const seed = destinationName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  // פרומפט קצר וממוקד - פחות טוקנים = תגובה מהירה יותר
  const prompt = `You are a travel guide. Return ONLY a valid JSON object (no markdown, no extra text) about "${destinationName}" for Israeli tourists. Use Hebrew for all text values.

CRITICAL: every place also carries "nameEn" — the official name as written locally
(e.g. "Basilica di Santa Maria del Fiore", "Mercato Centrale"). It is used to look the
place up in map and encyclopedia sources, which do not recognise Hebrew names, and a
wrong value there means the place is shown without a photo. Never translate it to
English if the place is known locally by another language. Do NOT invent website
addresses — that field was removed.

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
    {"name":"name in Hebrew","nameEn":"official local/English name","rating":4.5,"description":"desc in Hebrew","recommendedDuration":"X hours","price":"price","tips":"tip"}
  ],
  "food": {
    "intro": "cuisine intro in Hebrew",
    "dishes": [{"name":"dish","description":"desc"}],
    "restaurants": [{"name":"name in Hebrew","nameEn":"official local name","rating":4.4,"description":"desc","cuisine":"type","priceRange":"$$","area":"area"}],
    "markets": [{"name":"name in Hebrew","nameEn":"official local name","description":"desc","hours":"hours"}]
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

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 8192, temperature: 0.5, thinkingConfig: { thinkingBudget: 0 } }
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
    // Gemini 2.5 Flash returns thinking tokens in parts marked with {thought:true}
    // We need the actual response part, not the thinking part
    const parts = data.candidates?.[0]?.content?.parts || [];
    const content = (parts.find(p => !p.thought && p.text) || parts[0])?.text || '';
    console.log('✅ תגובת AI התקבלה');

    // נקה markdown + BOM + תווים בלתי נראים
    let cleaned = content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .replace(/[\uFEFF\u200B\u200C\u200D\u00AD\u2060\u00A0]/g, '') // invisible unicode
      .trim();

    // חלץ רק את ה-JSON (מ-{ הראשון עד } האחרון)
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }

    if (!cleaned.startsWith('{')) {
      console.error('תגובה לא תקינה:', cleaned.substring(0, 200));
      throw new Error('INVALID_RESPONSE');
    }

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.warn('⚠️ JSON parse failed, trying jsonrepair...');
      parsed = JSON.parse(jsonrepair(cleaned));
    }

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
