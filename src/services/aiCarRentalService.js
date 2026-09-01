import { callGemini } from './geminiClient';
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

  const res = await callGemini({ contents: [{ parts: [{ text: prompt }] }] });

  if (res.status === 429) throw new Error('RATE_LIMIT');
  if (!res.ok) throw new Error('API_ERROR');

  const json = await res.json();
  const raw = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const cleaned = raw.replace(/```json|```/g, '').trim();

  let result;
  try {
    result = JSON.parse(cleaned);
  } catch {
    // חילוץ JSON מתוך טקסט עוטף הוא התאוששות לגיטימית ונשאר.
    // מה שהוסר: נפילה למבנה ריק. היא נשמרה ב-`setCache` ל-24 שעות,
    // ולכן תקלה רגעית של Gemini גרמה ליעד שלם להיראות בלי רכבים ליום
    // שלם — בלי שגיאה בשום מקום, וללא דרך להבדיל מתוצאה ריקה אמיתית.
    // `aiAttractionsService` כבר זורק כאן, והקוראים מטפלים בזריקה.
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('INVALID_RESPONSE');
    result = JSON.parse(match[0]);
  }

  setCache(key, result);
  return result;
};
