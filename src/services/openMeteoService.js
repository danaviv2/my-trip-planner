const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * תחזית מסוכמת לעצירה לפי קואורדינטות — חינמי, ללא API key
 * מחזיר null אם הטיול מחוץ לחלון התחזית (16 יום)
 */
export async function getStopWeatherSummary(lat, lng, startDateStr, days) {
  if (!lat || !lng || !startDateStr) return null;

  const start = new Date(startDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysOut = Math.floor((start - today) / 86400000);
  if (daysOut < 0 || daysOut > 14) return null;

  const forecastDays = Math.min(days, Math.max(1, 16 - daysOut));
  const url =
    `${FORECAST_URL}?latitude=${lat}&longitude=${lng}` +
    `&daily=temperature_2m_max,temperature_2m_min,weathercode` +
    `&forecast_days=${forecastDays}&timezone=auto&start_date=${startDateStr}`;

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

async function geocodeCity(name) {
  try {
    const res = await fetch(`${GEOCODE_URL}?name=${encodeURIComponent(name)}&count=1&language=en&format=json`);
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

  const cacheKey = `om_weather_${cityName}_${startDate || 'none'}`;
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
  let startDateParam = '';
  if (startDate) {
    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((start - today) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 16) {
      startDateParam = `&start_date=${startDate}`;
    }
  }

  const url = `${FORECAST_URL}?latitude=${coords.lat}&longitude=${coords.lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&forecast_days=${forecastDays}&timezone=auto${startDateParam}`;

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
