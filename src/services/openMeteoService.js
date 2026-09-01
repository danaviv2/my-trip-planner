const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * תאריך בפורמט שהשרת מבין, מכל צורה שהקורא מחזיק.
 *
 * `TripPlanner` מחזיק `startDate` כאובייקט `Date`, ו-`fetchTripWeather`
 * שרשר אותו כמו שהוא: `start_date=Tue Sep 01 2026 23:58:17 GMT+0300 (...)`.
 * Open-Meteo החזיר 400, השירות החזיר רשימה ריקה, והמסך אמר "תחזית אינה
 * זמינה" — כשל שנראה בדיוק כמו היעדר נתונים.
 *
 * הפורמט נבנה מרכיבי הזמן המקומיים ולא מ-`toISOString`, שמחזיר UTC:
 * חצות בישראל היא אתמול, ומלכודת זו נשרפה כאן ארבע פעמים ביום אחד.
 */
/** חצות מקומית מתוך `YYYY-MM-DD`. `new Date('2026-09-01')` הוא UTC. */
const localMidnight = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const toLocalISODate = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * תחזית מסוכמת לעצירה לפי קואורדינטות — חינמי, ללא API key
 * מחזיר null אם הטיול מחוץ לחלון התחזית (16 יום)
 */
export async function getStopWeatherSummary(lat, lng, startDateStr, days) {
  const isoDate = toLocalISODate(startDateStr);
  if (!lat || !lng || !isoDate) return null;

  const start = localMidnight(isoDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysOut = Math.round((start - today) / 86400000);
  if (daysOut < 0 || daysOut > 14) return null;

  // `start_date` בלי `end_date` מוחזר כ-400 ("must have the same number of
  // elements"), ו-`forecast_days` מתנגש בשניהם. הקוד שלח את הראשון בלבד,
  // ולכן תחזית העצירות החזירה `null` בשקט — כשל שנראה כמו "אין תחזית".
  const forecastDays = Math.min(days, Math.max(1, 16 - daysOut));
  const end = new Date(start);
  end.setDate(start.getDate() + forecastDays - 1);
  const url =
    `${FORECAST_URL}?latitude=${lat}&longitude=${lng}` +
    `&daily=temperature_2m_max,temperature_2m_min,weathercode` +
    `&timezone=auto&start_date=${isoDate}&end_date=${toLocalISODate(end)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const { daily } = await res.json();
    if (!daily?.temperature_2m_max?.length) return null;

    const avgMax = Math.round(daily.temperature_2m_max.reduce((s, t) => s + t, 0) / daily.temperature_2m_max.length);
    const avgMin = Math.round(daily.temperature_2m_min.reduce((s, t) => s + t, 0) / daily.temperature_2m_min.length);
    const codes = daily.weathercode;
    const dominant = [...codes].sort(
      (a, b) => codes.filter(c => c === b).length - codes.filter(c => c === a).length
    )[0];
    return { avgMin, avgMax, emoji: getWeatherEmoji(dominant) };
  } catch {
    return null;
  }
}
const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

function getWeatherEmoji(code) {
  if (code === 0) return '☀️';
  if (code <= 3) return '🌤️';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 55) return '🌦️';
  if (code >= 61 && code <= 65) return '🌧️';
  if (code >= 71 && code <= 75) return '❄️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code === 95 || code === 96 || code === 99) return '⛈️';
  return '🌤️';
}

const RAINY_CODES = new Set([61, 63, 65, 80, 81, 82, 95, 96, 99]);

/**
 * קוד WMO ⟵ מפתח תרגום. שמונה מצבים ולא ארבעים: תיאור מדויק מדי הוא
 * הבטחה שהתחזית אינה יכולה לקיים, וקצר מדי מאבד את ההבדל בין גשם לשלג.
 */
function conditionKeyFor(code) {
  if (code === 0) return 'clear';
  if (code <= 3) return 'partlyCloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 86) return 'showers';
  if (code >= 95) return 'thunderstorm';
  return 'partlyCloudy';
}

const CURRENT_TTL_MS = 30 * 60 * 1000; // חצי שעה: מזג אוויר עכשווי מתיישן

/**
 * מזג האוויר עכשיו בעיר, לפי שם.
 *
 * ── למה זה נכתב ──
 * שני מסכים הציגו עד 01.09.2026 ערך קשיח: `/destination-info` הראה
 * "22°C, בהיר" לרומא, ללונדון ולבנגקוק כאחד, ו-`weatherAPI.js` היה
 * סימולציה מוצהרת שהחזירה 22° אחרי `setTimeout(500)` — השהיה מזויפת
 * שגרמה לזה להיראות כמו קריאת רשת. נמדד מול Open-Meteo באותו רגע:
 * רומא 26.1°, אוסלו 16.9°, בנגקוק 25.8°.
 *
 * ── למה `null` ולא ברירת מחדל ──
 * מספר שהומצא זוכה לאמון, ושדה ריק מתוקן. כשאין תשובה המסך אינו מציג
 * מזג אוויר כלל — הוא אינו נופל חזרה ל-22°.
 *
 * Open-Meteo אינו דורש מפתח, ולכן אין כאן מפתח שיכול להתייתם.
 */
export async function getCurrentWeather(cityName) {
  if (!cityName) return null;

  const cacheKey = `om_current_${cityName}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { ts, data } = JSON.parse(cached);
      if (Date.now() - ts < CURRENT_TTL_MS) return data;
    }
  } catch {
    // מטמון פגום אינו סיבה לא לשאול
  }

  const coords = await geocodeCity(cityName);
  if (!coords) return null;

  // `wind_speed_unit=ms` — המסך כותב "m/s", וברירת המחדל של Open-Meteo
  // היא קמ"ש. יחידה שגויה בשדה מלא היא בדיוק הבאג שאין שומר נוכחות שיתפוס.
  const url =
    `${FORECAST_URL}?latitude=${coords.lat}&longitude=${coords.lng}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code` +
    `&wind_speed_unit=ms&timezone=auto`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const { current } = await res.json();
    if (!current || typeof current.temperature_2m !== 'number') return null;

    const code = current.weather_code ?? 0;
    const data = {
      temperature: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature ?? current.temperature_2m),
      humidity: Math.round(current.relative_humidity_2m ?? 0),
      windSpeed: Math.round((current.wind_speed_10m ?? 0) * 10) / 10,
      code,
      emoji: getWeatherEmoji(code),
      conditionKey: conditionKeyFor(code)
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data }));
    } catch {
      // ignore storage errors
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * שפת החיפוש נגזרת מכתב השם, ולא נקבעת מראש.
 *
 * נמדד על 18 ערים: `language=en` מצא 8 בלבד — **כל** שם עברי נכשל,
 * וזו הסיבה ש-"רומא" לא החזיר מזג אוויר. `language=he` מצא 18 מ-18,
 * אבל הכניס טעות גרועה יותר: `"New York"` נפתר ל-40.9,-97.6 — נברסקה,
 * לא ניו יורק. פגיעה שגויה אינה נספרת בשום מונה הצלחות.
 *
 * לכן: שם בעברית נשאל בעברית, שם לטיני נשאל באנגלית. בשני הכיוונים
 * נמדד מלא — 10/10 ו-8/8 בהתאמה.
 */
const searchLanguageFor = (name) => (/[\u0590-\u05FF]/.test(name) ? 'he' : 'en');

async function geocodeCity(name) {
  try {
    const language = searchLanguageFor(name);
    const res = await fetch(`${GEOCODE_URL}?name=${encodeURIComponent(name)}&count=1&language=${language}&format=json`);
    const data = await res.json();
    if (!data.results?.length) return null;
    const { latitude, longitude } = data.results[0];
    return { lat: latitude, lng: longitude };
  } catch {
    return null;
  }
}

export async function fetchTripWeather(cityName, startDate, days) {
  if (!cityName) return [];

  const isoStart = toLocalISODate(startDate);
  const cacheKey = `om_weather_${cityName}_${isoStart || 'none'}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { ts, data } = JSON.parse(cached);
      if (Date.now() - ts < CACHE_TTL_MS) return data;
    }
  } catch {
    // ignore cache errors
  }

  const coords = await geocodeCity(cityName);
  if (!coords) return [];

  const forecastDays = Math.min(days || 7, 16);

  // Only pass start_date if it's within the next 16 days
  // או טווח מפורש (`start_date`+`end_date`), או `forecast_days` — לא שניהם.
  let rangeParam = `&forecast_days=${forecastDays}`;
  if (isoStart) {
    const start = localMidnight(isoStart);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((start - today) / 86400000);
    if (diffDays >= 0 && diffDays < 16) {
      const end = new Date(start);
      end.setDate(start.getDate() + forecastDays - 1);
      rangeParam = `&start_date=${isoStart}&end_date=${toLocalISODate(end)}`;
    }
  }

  const url = `${FORECAST_URL}?latitude=${coords.lat}&longitude=${coords.lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto${rangeParam}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.daily) return [];

    const { temperature_2m_max, temperature_2m_min, precipitation_probability_max, weathercode, time } = data.daily;

    const result = (time || []).map((_, i) => {
      const code = weathercode?.[i] ?? 0;
      const rainProb = precipitation_probability_max?.[i] ?? 0;
      return {
        maxTemp: Math.round(temperature_2m_max?.[i] ?? 0),
        minTemp: Math.round(temperature_2m_min?.[i] ?? 0),
        rainProb,
        code,
        emoji: getWeatherEmoji(code),
        // הקורא לא ימפה את הקוד בעצמו: מיפוי שני היה נפרד מהראשון
        // בשינוי הבא, וזו המלכודת שרשומה ב-STATUS.
        conditionKey: conditionKeyFor(code),
        isRainy: rainProb > 60 || RAINY_CODES.has(code),
      };
    });

    try {
      localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: result }));
    } catch {
      // ignore storage errors
    }

    return result;
  } catch {
    return [];
  }
}
