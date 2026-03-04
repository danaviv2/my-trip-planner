import { jsonrepair } from 'jsonrepair';

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || window.env?.REACT_APP_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const CACHE_PREFIX = 'itinerary_ai_';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 שעות

function getCached(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data;
  } catch { return null; }
}

function setCache(key, data) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

const ACTIVITY_EMOJIS = {
  attraction: '🏛️',
  food: '🍽️',
  transport: '🚌',
  rest: '☕',
  shopping: '🛍️',
  nightlife: '🌙',
  nature: '🌿',
  beach: '🏖️',
  museum: '🖼️',
};

/**
 * מייצר מסלול יומי מפורט עם שעות ואטרקציות ספציפיות
 * @param {object} params
 * @param {string} params.destination
 * @param {number} params.days
 * @param {string[]} params.interests
 * @param {string} params.budget  low | medium | high
 * @returns {Promise<Array>} מערך ימים עם פעילויות
 */
export const generateItinerary = async ({ destination, days = 3, interests = [], budget = 'medium' }) => {
  if (!GEMINI_API_KEY) throw new Error('NO_API_KEY');

  const cacheKey = `${destination}_${days}_${interests.sort().join(',')}_${budget}`.toLowerCase().replace(/\s+/g, '_');
  const cached = getCached(cacheKey);
  // השתמש ב-cache רק אם הוא כולל קואורדינטות
  if (cached && cached[0]?.activities?.[0]?.lat) {
    console.log(`📦 מסלול נטען מהמטמון: ${destination}`);
    return cached;
  }

  const interestsText = interests.length > 0 ? interests.join(', ') : 'general sightseeing, culture, food';
  const budgetLabel = budget === 'low' ? 'budget-friendly, free or cheap options' : budget === 'high' ? 'luxury, premium experiences' : 'mid-range';

  const prompt = `You are a travel expert for Israeli tourists. Create a detailed ${days}-day itinerary for ${destination}.
Traveler interests: ${interestsText}. Budget level: ${budgetLabel}.

Return ONLY a valid JSON array (no markdown, no extra text). Use Hebrew for ALL text values (names, descriptions, tips).

Required format — return EXACTLY this structure:
[
  {
    "day": 1,
    "title": "כותרת היום בעברית",
    "theme": "נושא היום",
    "activities": [
      {
        "time": "09:00",
        "name": "שם המקום",
        "type": "attraction",
        "description": "תיאור קצר ומעניין בעברית",
        "address": "כתובת מלאה באנגלית לצורך חיפוש במפה",
        "lat": 48.8584,
        "lng": 2.2945,
        "duration": "2 שעות",
        "tips": "טיפ מעשי אחד בעברית",
        "price": "חינם / ₪50 / כניסה חופשית",
        "website": "https://official-website.com or empty string if unknown"
      }
    ]
  }
]

Rules:
- 4 to 6 activities per day
- Start at 09:00, end by 22:00
- Times must be realistic (account for travel time between places)
- activity types: attraction, food, transport, rest, shopping, nightlife, nature, beach, museum
- addresses must be in English (for Google Maps search)
- CRITICAL: include accurate lat/lng coordinates for each activity's real location
- Include at least one meal (type: food) per day
- Day ${days} should end with something special (sunset, night view, etc.)`;

  console.log(`🗺️ מייצר מסלול AI ל: ${destination} (${days} ימים)`);

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
          maxOutputTokens: 4096,
          temperature: 0.7,
          thinkingConfig: { thinkingBudget: 0 }
        }
      })
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
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = JSON.parse(jsonrepair(cleaned));
    }

    // הוסף emoji לכל פעילות
    const result = parsed.map(day => ({
      ...day,
      activities: (day.activities || []).map(act => ({
        ...act,
        emoji: ACTIVITY_EMOJIS[act.type] || '📍',
      }))
    }));

    setCache(cacheKey, result);
    console.log(`✅ מסלול נוצר בהצלחה: ${result.length} ימים`);
    return result;

  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('TIMEOUT');
    throw err;
  }
};
