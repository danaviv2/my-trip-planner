import { jsonrepair } from 'jsonrepair';
import { geminiEndpoint } from './geminiClient';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = geminiEndpoint(GEMINI_MODEL);

// ── v2, 08.09.2026 ──
// הסכימה ביקשה מהמודל `"rating":4.5`, והשדה לא סונן: כוכבים שהמודל
// המציא הוצגו בדיוק כמו כוכבים שנמדדו. דפוס 6 ב-CLAUDE.md — שומר
// שבודק *נוכחות* ולא *מקור*. שש האטרקציות שנוספו ידנית לפריז ולרומא
// כבר נשמרו בלי `rating`; עכשיו זה חל על כל היעדים.
//
// **הגרסה במפתח היא חלק מהתיקון, לא קישוט.** המטמון חי שבעה ימים,
// ובלי העלאת הקידומת מי שכבר טען יעד היה ממשיך לראות את הדירוגים
// המומצאים עד שהתפוגה תעבור — בדיוק מה שקרה כאן עם `PARSER_VERSION`.
const CACHE_PREFIX = 'dest_ai_v3_';
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

"about", "honeyTraps", "localVault", "hiddenGems" and "queueTip" describe experience
and structure, never measurements. Do NOT write prices, opening hours, durations,
distances, wait times, percentages, or superlatives ("the best", "the only") in them.
A queueTip must be structural advice only — "book ahead on the official site",
"arrive at opening" — never a number.
For "hiddenGems" include only places you are confident actually exist; four certain
places are better than eight where half are invented. A wrong "nameEn" means the map
opens somewhere else entirely.

Required JSON structure:
{
  "country": "country name in Hebrew",
  "tags": ["tag1","tag2","tag3"],
  "description": "2-3 sentence description in Hebrew",
  "about": {
    "hook": "one sentence, 85-115 chars: what happens to you there, not what is there",
    "layout": "200-320 chars: the shape of the city, how to think about the map, what divides it",
    "firstTime": "250-400 chars: local custom, routine trap, something closed when you assumed open"
  },
  "language": "official language",
  "currency": "currency (symbol)",
  "timezone": "GMT+X",
  "airport": "main airport name (CODE)",
  "bestTimeToVisit": "best months",
  "seasons": {"summer": "summer description with temps", "winter": "winter description with temps"},
  "events": [{"name":"event","date":"month","description":"desc"}],
  "attractions": [
    {"name":"name in Hebrew","nameEn":"official local/English name","description":"desc in Hebrew","recommendedDuration":"X hours","price":"price","tips":"tip","queueTip":"structural advice only, no numbers"}
  ],
  "hiddenGems": [
    {"name":"name in Hebrew","nameEn":"official local name","description":"desc in Hebrew, up to 95 chars"}
  ],
  "food": {
    "intro": "cuisine intro in Hebrew",
    "dishes": [{"name":"dish","description":"desc"}],
    "honeyTraps": [{"name":"up to 28 chars","note":"what tourists do and why it disappoints, up to 95 chars"}],
    "localVault": [{"name":"up to 28 chars","note":"where people who live there go, up to 95 chars"}],
    "restaurants": [{"name":"name in Hebrew","nameEn":"official local name","description":"desc","cuisine":"type","priceRange":"$$","area":"area"}],
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
    // ── בלי תמונה מומצאת ──
    // כאן ישבו זרעי picsum.photos. השירות **חי** ומחזיר 200, וזו בדיוק
    // הסכנה: הוא מגיש תצלום אקראי שנראה כמו תצלום של המקום. זה הדפוס
    // שהוסר מהפרויקט ב-`placeMediaService` ("תמונת מקום שגויה תחת שם
    // נכון"), ונשאר כאן בחמישה מקומות.
    const coverImage = null;

    /**
     * ניקוי טיפ שהמודל הכניס בו מספר.
     *
     * הפרומפט אוסר מחירים, שעות ומשכי המתנה — אבל הוראה בפרומפט היא
     * בקשה ולא ערובה, בדיוק כמו `rating` שהמשיך לחזור אחרי שהוסר
     * מהסכימה. טיפ עם מספר נקרא כעובדה בדוקה ונכנס לתכנון אמיתי,
     * ולכן הוא נזרק ולא "מתוקן": תיקון הוא ניחוש בתחפושת של ידע.
     */
    const NUMERIC = /\d|[₪$€£]|%/;
    const cleanTip = (tip) => (typeof tip === 'string' && tip.trim() && !NUMERIC.test(tip) ? tip.trim() : undefined);

    /** פריטי {name, note} — נזרקים כשחסר אחד מהם. */
    const cleanPairs = (arr) => (Array.isArray(arr) ? arr : [])
      .filter((x) => x && typeof x.name === 'string' && typeof x.note === 'string' && x.name.trim() && x.note.trim())
      .map(({ name, note }) => ({ name: name.trim(), note: note.trim() }));

    /** פנינה בלי `nameEn` נזרקת: בלעדיו המפה נפתחת במקום אחר לגמרי. */
    const hiddenGems = (Array.isArray(parsed.hiddenGems) ? parsed.hiddenGems : [])
      .filter((g) => g && g.name && g.nameEn && g.description)
      .map(({ name, nameEn, description }) => ({ name, nameEn, description }));
    // ── `rating` נמחק גם כאן, לא רק מהסכימה ──
    // הסרת השדה מהפרומפט היא בקשה, לא ערובה: מודל שראה אלפי דפי
    // אטרקציות עם כוכבים נוטה להוסיף אותם גם כשלא ביקשו. השומר האמיתי
    // הוא הקוד, באותו מקום שכבר מסיר `image` מומצא מאותה סיבה בדיוק.
    // eslint-disable-next-line no-unused-vars
    const attractions = (parsed.attractions || []).map(({ rating, queueTip, ...a }) => ({
      ...a,
      queueTip: cleanTip(queueTip),
      image: null
    }));
    const food = {
      ...parsed.food,
      // המסעדות עברו כאן בלי מיפוי כלל — כלומר כל שדה שהמודל החזיר,
      // כולל `rating`, הגיע למסך כפי שהוא.
      // eslint-disable-next-line no-unused-vars
      restaurants: (parsed.food?.restaurants || []).map(({ rating, ...r }) => r),
      honeyTraps: cleanPairs(parsed.food?.honeyTraps),
      localVault: cleanPairs(parsed.food?.localVault),
      dishes: (parsed.food?.dishes || []).map((d, i) => ({
        ...d,
        image: null
      })),
      markets: (parsed.food?.markets || []).map((m, i) => ({
        ...m,
        image: null
      }))
    };
    const nearbyDestinations = (parsed.nearbyDestinations || []).map((n, i) => ({
      ...n,
      image: null
    }));

    const result = {
      name: destinationName,
      ...parsed,
      coverImage,
      attractions,
      food,
      hiddenGems,
      about: parsed.about,
      nearbyDestinations,
      isAIGenerated: true,
      // אותו גילוי נאות שכבר קיים ללשוניות שממולאות ב-AI: הקורא אינו
      // יכול להבחין לבד בין פסקה שנכתבה בידי אדם לאחת שנוצרה עכשיו.
      aiFilledSections: ['about', 'hiddenGems', 'food'],
      generalInfo: {
        language: parsed.language,
        currency: parsed.currency,
        timezone: parsed.timezone,
        airport: parsed.airport,
        bestTimeToVisit: parsed.bestTimeToVisit,
        seasons: parsed.seasons
      }
      // `currentWeather` קבוע — 22°C ו"בהיר" לכל יעד בעולם — הוסר.
      // המסך מביא מזג אוויר חי מ-`openMeteoService`, וכשאין תשובה אינו
      // מציג דבר. מספר שהומצא זוכה לאמון; שדה ריק מתוקן.
    };

    setCache(destinationName, result);
    return result;

  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('TIMEOUT');
    throw err;
  }
};
