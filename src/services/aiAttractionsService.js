import { callGemini } from './geminiClient';

/**
 * אטרקציות מומלצות ליעד, מ-Gemini.
 *
 * החליף את getMockAttractions שהייתה ב-TripPlanner: היא קיבלה פרמטר יעד
 * אבל התעלמה ממנו והחזירה תמיד את אותן אטרקציות בפריז, כך שמי שתכנן טיול
 * למילאנו קיבל את מגדל אייפל והלובר.
 *
 * הצורה המוחזרת תואמת למה שמסך תכנון הטיול צורך:
 * { id, name, category, location, address, description, image, rating,
 *   duration, price, openingHours, coordinates: { lat, lng } }
 */

const CACHE_HOURS = 24;

const getCacheKey = (destination) => `attractions_ai_${destination.toLowerCase().trim()}`;

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

// הקטגוריות שמסך התכנון מסנן לפיהן
const ALLOWED_CATEGORIES = [
  'attractions',
  'museums',
  'restaurants',
  'cafes',
  'nature',
  'wineries',
  'shopping',
  'hotels',
];

export const generateAttractions = async (destination) => {
  if (!destination) return [];

  const key = getCacheKey(destination);
  const cached = getCached(key);
  // משתמשים במטמון רק אם הוא כולל קואורדינטות תקינות
  if (cached && cached.length && cached[0]?.coordinates?.lat) return cached;

  const prompt = `You are a local travel expert. List 12 real, currently-operating places in ${destination}.
Mix categories: major attractions, museums, notable restaurants, cafes, nature spots, and wineries if the region has them.

Return ONLY a valid JSON array (no markdown, no explanation):
[
  {
    "name": "real place name in Hebrew",
    "category": one of ${JSON.stringify(ALLOWED_CATEGORIES)},
    "address": "real street address",
    "description": "2 sentences in Hebrew explaining why it is worth visiting",
    "rating": 4.5,
    "duration": 90,
    "price": "price range with local currency, or 'חינם'",
    "openingHours": "e.g. 09:00-18:00",
    "lat": 45.4642,
    "lng": 9.1900
  }
]

Rules:
- Use REAL places that actually exist in ${destination}. Never invent a place.
- lat/lng must be the real coordinates of that specific place, not the city center.
- duration is the recommended visit length in minutes.
- If a place is permanently closed, do not include it.`;

  const res = await callGemini({ contents: [{ parts: [{ text: prompt }] }] });

  if (res.status === 429) throw new Error('RATE_LIMIT');
  if (!res.ok) throw new Error('API_ERROR');

  const json = await res.json();
  const raw = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const cleaned = raw.replace(/```json|```/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('INVALID_RESPONSE');
  }
  if (!Array.isArray(parsed)) throw new Error('INVALID_RESPONSE');

  const seed = destination.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  const attractions = parsed
    // בלי קואורדינטות אמיתיות הפריט חסר ערך על המפה
    .filter((a) => a && a.name && Number.isFinite(Number(a.lat)) && Number.isFinite(Number(a.lng)))
    .map((a, i) => ({
      id: i + 1,
      name: a.name,
      category: ALLOWED_CATEGORIES.includes(a.category) ? a.category : 'attractions',
      location: destination,
      address: a.address || '',
      description: a.description || '',
      image: null /* picsum הוסר: תצלום אקראי תחת שם מקום אמיתי */,
      rating: Number(a.rating) || 4.3,
      duration: Number(a.duration) || 90,
      price: a.price || '',
      openingHours: a.openingHours || '',
      coordinates: { lat: Number(a.lat), lng: Number(a.lng) },
    }));

  if (attractions.length) setCache(key, attractions);
  return attractions;
};
