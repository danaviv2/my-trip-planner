// services/geoEndpoints.js
//
// כתובות הבסיס של שירותי המפה, המסלולים ומזג האוויר — במקום אחד.
//
// בייצור הבקשות עוברות דרך `/api/geo` (ראה שם: זיהוי אפליקציה ומטמון
// משותף, כפי שמדיניות Nominatim ו-OSRM דורשות). מקומית `npm start` אינו
// מריץ פונקציות שרת, ולכן הפנייה ישירה — אותו מבנה כמו `geminiClient`.
// הבדיקה נקבעת בזמן הבנייה, והענף המקומי נמחק מחבילת הייצור.
//
// כל הכתובות שומרות על צורת ה-API המקורית (נתיב + `?פרמטרים`), כך שהקוראים
// אינם משתנים מלבד שם הקבוע. ספק חדש יוחלף בשרת, לא כאן.

const DIRECT = process.env.NODE_ENV !== 'production';

export const NOMINATIM_SEARCH = DIRECT
  ? 'https://nominatim.openstreetmap.org/search'
  : '/api/geo/search';

/** מצפה ל-`${OSRM_DRIVING}/${lng,lat;lng,lat}?overview=...` */
export const OSRM_DRIVING = DIRECT
  ? 'https://router.project-osrm.org/route/v1/driving'
  : '/api/geo/route';

export const WEATHER_FORECAST = DIRECT
  ? 'https://api.open-meteo.com/v1/forecast'
  : '/api/geo/forecast';

export const WEATHER_GEOCODE = DIRECT
  ? 'https://geocoding-api.open-meteo.com/v1/search'
  : '/api/geo/wgeocode';
