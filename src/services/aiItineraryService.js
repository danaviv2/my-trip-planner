import { jsonrepair } from 'jsonrepair';
import { geminiEndpoint } from './geminiClient';
import { locatePlace, isGoodCoord } from './placeLookupService';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = geminiEndpoint(GEMINI_MODEL);

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
  winery: '🍷',
  castle: '🏰',
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
/**
 * שורות האילוץ למודל: מה שכבר סגור בימים האלה.
 *
 * ── למה זה נכנס לבקשה ולא רק לתצוגה ──
 * רצועת העוגנים מראה שהתוכנית דורסת את הכרטיס, אבל היא מראה זאת אחרי
 * שהוא כבר נדרס. מודל שיודע מראש על סיור ב-15:40 פשוט לא יקבע מוזיאון
 * ב-14:00 למשך שעתיים וחצי, ואין מה להתריע עליו.
 *
 * המודל מקבל את השעה, השם והמקום — ואיסור מפורש לתכנן עליהם. הוא אינו
 * מקבל רשות לשנות אותם: הזמנה סגורה אינה נתונה למשא ומתן.
 */
const anchorLines = (anchorsByDay, startDay, chunkDays) => {
  const rows = [];
  for (let d = startDay; d < startDay + chunkDays; d += 1) {
    (anchorsByDay[d] || []).forEach((a) => {
      const when = a.time ? `at ${a.time}` : 'sometime that day';
      rows.push(`  Day ${d} ${when}: ${a.title}${a.place ? ` (${a.place})` : ''}`);
    });
  }
  if (!rows.length) return '';

  return `\n\nALREADY BOOKED — these are fixed and paid for. You MUST plan around them:\n${rows.join('\n')}
- Do NOT schedule any activity that overlaps a booked time slot.
- Do NOT repeat a booked item as one of your activities.
- Leave realistic travel time before and after each booked item.`;
};

export const generateItinerary = async ({ destination, days = 3, interests = [], budget = 'medium', advancedPreferences = {}, anchorsByDay = {} }) => {

  const { hasChildren, travelPace, travelStyle, foodPreferences, specialNeeds } = advancedPreferences;
  const advKey = `${hasChildren ? 'kids' : ''}_${travelPace || ''}_${travelStyle || ''}_${foodPreferences || ''}_${specialNeeds || ''}`;
  // העוגנים נכנסים למפתח המטמון. בלעדיהם סגירת אטרקציה חדשה הייתה
  // מחזירה בדיוק את אותו מסלול שנבנה כשהיא לא הייתה קיימת — התכונה
  // הייתה נראית עובדת ולא משנה דבר.
  const anchorKey = Object.keys(anchorsByDay).sort().map(
    (d) => `${d}:${(anchorsByDay[d] || []).map((a) => `${a.time}${a.title}`).join('|')}`
  ).join(';');
  const cacheKey = `${destination}_${days}_${interests.sort().join(',')}_${budget}_${advKey}_${anchorKey}`.toLowerCase().replace(/\s+/g, '_');
  const cached = getCached(cacheKey);
  // השתמש ב-cache רק אם הוא כולל קואורדינטות תקינות (לא 0,0) ומספר ימים נכון
  const cacheIsValid = cached && cached.length === days &&
    cached.every(day => day.activities?.some(a => {
      const lat = Number(a.lat); const lng = Number(a.lng);
      return a.lat != null && !isNaN(lat) && !(lat === 0 && lng === 0) && Math.abs(lat) <= 90;
    }));
  if (cacheIsValid) {
    console.log(`📦 מסלול נטען מהמטמון: ${destination}`);
    return cached;
  }

  const interestsText = interests.length > 0 ? interests.join(', ') : 'general sightseeing, culture, food';
  const budgetLabel = budget === 'low' ? 'budget-friendly, free or cheap options' : budget === 'high' ? 'luxury, premium experiences' : 'mid-range';

  const paceLabel = travelPace === 'slow' ? 'relaxed pace with few activities and lots of free time'
    : travelPace === 'fast' ? 'packed schedule with many activities'
    : 'balanced pace';
  const styleLabel = travelStyle === 'cultural' ? 'cultural (museums, history, art)'
    : travelStyle === 'adventure' ? 'adventurous (hiking, outdoor sports)'
    : travelStyle === 'relaxation' ? 'relaxation (spas, beaches, calm)'
    : travelStyle === 'culinary' ? 'culinary (restaurants, food markets, wine)'
    : travelStyle === 'nature' ? 'nature (parks, landscapes, wildlife)'
    : travelStyle === 'urban' ? 'urban (shopping, city attractions)'
    : 'mixed';

  const specialLines = [
    hasChildren ? '- This is a FAMILY trip with children — prioritize kid-friendly attractions, avoid long walks without breaks, include parks and interactive museums.' : '',
    foodPreferences ? `- Food restrictions/preferences: ${foodPreferences}` : '',
    specialNeeds ? `- Special needs: ${specialNeeds}` : '',
  ].filter(Boolean).join('\n');

  const CHUNK_SIZE = 3;

  const buildPrompt = (startDay, chunkDays, totalDays) => `Travel expert. Days ${startDay}–${startDay + chunkDays - 1} of ${totalDays}-day trip to ${destination}.
Budget: ${budgetLabel}. Style: ${styleLabel}. Pace: ${paceLabel}.${specialLines ? '\n' + specialLines : ''}${anchorLines(anchorsByDay, startDay, chunkDays)}
Output JSON array of EXACTLY ${chunkDays} objects. Hebrew for title/theme/description/tips/bookingTip. description ≤20 Hebrew words, tips ≤10 Hebrew words.

[{"day":${startDay},"title":"כותרת","theme":"נושא","activities":[{"time":"09:00","name":"Eiffel Tower","type":"attraction","description":"תיאור קצר","address":"Champ de Mars, Paris, France","lat":48.8584,"lng":2.2945,"duration":"2h","tips":"טיפ","price":"free"}],"hotel":{"name":"Hotel du Louvre","stars":4,"description":"תיאור","priceRange":"€€","address":"Place André Malraux, Paris","lat":48.8638,"lng":2.3363,"bookingTip":"טיפ"}}]

CRITICAL RULES:
- EXACTLY ${chunkDays} day objects, day numbers ${startDay} to ${startDay + chunkDays - 1}
- EXACTLY 5 activities per day (morning, mid-morning, lunch, afternoon, evening)
- CRITICAL: provide REAL precise lat/lng for every activity and hotel — never use 0.0 or placeholder values
- English addresses only
- 1+ food activity per day
- "price" MUST be an actual amount with a currency symbol (e.g. "£25", "€12-18", "₪90")
  or the Hebrew word "חינם" when there is no entry fee. NEVER put a budget tier
  word such as "premium", "luxury", "mid-range" or "budget" in the price field.
- Opening hours matter: do not schedule a site at a time it is normally closed,
  and do not place a museum visit on its weekly closing day.${startDay === 1 ? `
- Day 1 realism: travellers arrive by air. Hotel check-in in most cities is not
  before 15:00, so day 1 should start with arrival logistics and nearby, flexible
  activities — not a timed ticketed attraction first thing in the morning.` : ''}${startDay + chunkDays - 1 === totalDays ? '\n- Last activity: sunset/night view' : ''}`;

  const callGeminiOnce = async (prompt, chunkDays, temperature = 0.7) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);
    try {
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          // ראה ההסבר ב-DestinationMatchmakerPage: בלי איפוס תקציב החשיבה
          // התשובה נקטעת ומגיעה שבורה, וכאן מדובר במסלול הטיול עצמו.
          generationConfig: {
            maxOutputTokens: 10000,
            temperature,
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 0 }
          }
        })
      });
      clearTimeout(timeout);
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        console.error(`❌ Gemini API error ${response.status}:`, errBody);
        if (response.status === 429) throw new Error('RATE_LIMIT');
        throw new Error(`API_ERROR_${response.status}: ${errBody?.error?.message || ''}`);
      }
      const data = await response.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      const content = (parts.find(p => !p.thought && p.text) || parts[0])?.text || '';
      const finishReason = data.candidates?.[0]?.finishReason;
      console.log(`📊 chunk finishReason: ${finishReason}, length: ${content.length}`);
      if (!content) throw new Error('EMPTY_RESPONSE');

      let cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '')
        .replace(/[\uFEFF\u200B\u200C\u200D\u00AD\u2060\u00A0]/g, '').trim();
      const fb = cleaned.indexOf('['), lb = cleaned.lastIndexOf(']');
      if (fb !== -1 && lb !== -1) cleaned = cleaned.slice(fb, lb + 1);

      let parsed;
      try { parsed = JSON.parse(cleaned); }
      catch { parsed = JSON.parse(jsonrepair(cleaned)); }

      console.log(`  📅 chunk: ${parsed.length}/${chunkDays} ימים`);
      return parsed;
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') throw new Error('TIMEOUT');
      throw err;
    }
  };

  const callGemini = async (prompt, chunkDays) => {
    const temperatures = [0.7, 0.4, 0.2];
    let lastErr;
    for (let i = 0; i < temperatures.length; i++) {
      try {
        if (i > 0) console.log(`  🔁 retry ${i} (temperature=${temperatures[i]})...`);
        return await callGeminiOnce(prompt, chunkDays, temperatures[i]);
      } catch (err) {
        if (err.message === 'RATE_LIMIT' || err.message === 'TIMEOUT') throw err;
        lastErr = err;
      }
    }
    throw lastErr;
  };

  // isGoodCoord, lookup ו-locateActivity הועברו ל-placeLookupService, כדי
  // שגם עריכה ידנית של המסלול תשתמש באותה בדיקת וודאות. שכפול היה מוביל
  // לכך שתיקון באחד לא חל על השני.
  const locateActivity = (address, name, type) => locatePlace(name, address, destination, type);

  const geocodeMissing = async (daysList) => {
    const tasks = [];
    daysList.forEach(day => {
      (day.activities || []).forEach(act => {
        if (!isGoodCoord(act)) tasks.push({ act, day });
      });
      if (day.hotel && !isGoodCoord(day.hotel)) tasks.push({ act: day.hotel, day, isHotel: true });
    });
    if (tasks.length === 0) return daysList;

    // סדרתי ולא במקביל: מדיניות השימוש של Nominatim מגבילה לבקשה
    // בשנייה, ומטח מקבילי גורר חסימה — כלומר מקומות אמיתיים היו
    // מסומנים כלא מאומתים רק משום שנחסמנו.
    for (const { act } of tasks) {
      const { coords, confidence } = await locateActivity(act.address || '', act.name || '', act.type || '');
      if (coords) {
        act.lat = coords.lat;
        act.lng = coords.lng;
        // נמצא לפי כתובת בלבד: הרחוב קיים, העסק לא אומת.
        if (confidence === 'address') act.nameUnverified = true;
      } else {
        // לא נמצא כלל — לא השם ולא הכתובת. אין לנו מיקום, ואסור להמציא
        // לו אחד.
        act.unverified = true;
      }
      await new Promise((r) => setTimeout(r, 1100));
    }
    return daysList;
  };

  const fixCoords = (daysList) => {
    const allValid = daysList.flatMap(d => d.activities).filter(isGoodCoord);
    const cLat = allValid.length ? allValid.reduce((s, a) => s + Number(a.lat), 0) / allValid.length : null;
    const cLng = allValid.length ? allValid.reduce((s, a) => s + Number(a.lng), 0) / allValid.length : null;
    return daysList.map(day => {
      const dValid = day.activities.filter(isGoodCoord);
      const fLat = dValid.length ? dValid.reduce((s, a) => s + Number(a.lat), 0) / dValid.length : cLat;
      const fLng = dValid.length ? dValid.reduce((s, a) => s + Number(a.lng), 0) / dValid.length : cLng;
      return {
        ...day,
        activities: day.activities.map((act) => {
          if (isGoodCoord(act) || fLat == null) return act;
          // מקום שלא אומת אינו מקבל קואורדינטות מומצאות. עד כה הוצב
          // כאן ממוצע שאר הפעילויות, כך שמקום שלא נמצא הופיע על המפה
          // בנקודה סבירה ונראה אמיתי לחלוטין.
          if (act.unverified) return act;
          return { ...act, lat: fLat, lng: fLng, approxCoord: true };
        }),
      };
    });
  };

  // --- חלוקה ל-chunks של CHUNK_SIZE ימים ---
  console.log(`🗺️ מייצר מסלול AI ל: ${destination} (${days} ימים)`);
  const chunks = [];
  let startDay = 1;
  while (startDay <= days) {
    const chunkDays = Math.min(CHUNK_SIZE, days - startDay + 1);
    console.log(`  🔄 מייצר ימים ${startDay}–${startDay + chunkDays - 1}...`);
    const chunkResult = await callGemini(buildPrompt(startDay, chunkDays, days), chunkDays);
    // תקן מספור ימים
    chunkResult.forEach((d, i) => { d.day = startDay + i; });
    chunks.push(...chunkResult);
    startDay += chunkDays;
  }

  // הוסף emoji
  const withEmoji = chunks.map(day => ({
    ...day,
    activities: (day.activities || []).map(act => ({ ...act, emoji: ACTIVITY_EMOJIS[act.type] || '📍' }))
  }));

  // geocode פעילויות ומלונות שחסרות קואורדינטות תקינות
  const geocoded = await geocodeMissing(withEmoji);
  const result = fixCoords(geocoded);
  setCache(cacheKey, result);
  console.log(`✅ מסלול נוצר בהצלחה: ${result.length} ימים`);
  return result;
};
