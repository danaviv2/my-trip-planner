/**
 * איתור מקום, עם מידת הוודאות שהמקום עצמו קיים.
 *
 * הופרד מ-aiItineraryService כדי שגם עריכה ידנית של המסלול תשתמש באותה
 * לוגיקה. שכפול היה מוביל לכך שתיקון באחד מהם לא חל על השני — הדפוס
 * שחזר כאן כמה פעמים.
 *
 * ההבחנה בין השם לכתובת אינה קוסמטית: בדיקה הראתה ש-Eataly, מסעדה
 * אמיתית, אינה נמצאת לפי שם, בעוד מסעדה מומצאת ברחוב אמיתי כן נמצאת לפי
 * כתובת. לכן אי אפשר להכריע בין השתיים, ואין להעמיד פנים שכן.
 */

/** קואורדינטה שמישה — לא ריקה, לא NaN, ולא (0,0) שהוא ברירת מחדל שקטה. */
export const isGoodCoord = (a) => {
  if (!a) return false;
  const lat = Number(a.lat);
  const lng = Number(a.lng);
  return (
    a.lat != null && a.lng != null && a.lat !== '' && a.lng !== '' &&
    !isNaN(lat) && !isNaN(lng) &&
    Math.abs(lat) <= 90 && Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)
  );
};

const lookup = async (query) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'MyTripPlanner/1.0' } }
    );
    const data = await res.json();
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {}
  return null;
};

/**
 * @returns {{coords: {lat,lng}|null, confidence: 'name'|'address'|'none'}}
 *   'name'    — המקום עצמו נמצא
 *   'address' — הרחוב נמצא, אך לא אושר שהמקום קיים בו
 *   'none'    — לא נמצא דבר. אין להמציא מיקום.
 */
export const locatePlace = async (name, address, destination = '') => {
  const suffix = destination ? `, ${destination}` : '';

  if (name) {
    const byName = await lookup(`${name}${suffix}`);
    if (byName) return { coords: byName, confidence: 'name' };
  }

  if (address) {
    // מדיניות השימוש של Nominatim מגבילה לבקשה בשנייה. מטח מקבילי גורר
    // חסימה, ואז מקום אמיתי מסומן כלא מאומת רק משום שנחסמנו.
    await new Promise((r) => setTimeout(r, 1100));
    const byAddress = await lookup(`${address}${suffix}`);
    if (byAddress) return { coords: byAddress, confidence: 'address' };
  }

  return { coords: null, confidence: 'none' };
};
