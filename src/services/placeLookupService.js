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

const API = 'https://nominatim.openstreetmap.org/search';

/** מדיניות Nominatim מגבילה לבקשה בשנייה. מטח מקבילי גורר חסימה. */
const RATE_MS = 1100;

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

/**
 * סוגי OSM שמתאימים לכל סוג פעילות.
 *
 * נדרש משום שחיפוש לפי שם מחזיר לעיתים עסק אחר לגמרי בעל שם דומה:
 * "Les Cocottes, Paris" החזיר shop/erotic כתוצאה הראשונה, בעוד שתי
 * המסעדות בשם הזה היו במקומות השני והשלישי. לקיחת התוצאה הראשונה
 * נעלה כתובת שגויה תחת סימון "אומת".
 */
const EXPECTED = {
  food: ['amenity/restaurant', 'amenity/cafe', 'amenity/fast_food', 'amenity/bar', 'amenity/pub', 'amenity/ice_cream', 'shop/bakery'],
  museum: ['tourism/museum', 'tourism/gallery', 'amenity/arts_centre'],
  attraction: ['tourism/attraction', 'tourism/artwork', 'tourism/viewpoint', 'tourism/theme_park', 'tourism/zoo', 'man_made/tower', 'leisure/park'],
  nature: ['leisure/park', 'leisure/garden', 'leisure/nature_reserve'],
  beach: ['natural/beach', 'leisure/beach_resort'],
  shopping: ['amenity/marketplace'],
  nightlife: ['amenity/bar', 'amenity/pub', 'amenity/nightclub', 'amenity/casino', 'amenity/theatre'],
  transport: ['amenity/bus_station', 'public_transport/station'],
};

const kindOf = (raw) => `${raw.class}/${raw.type}`;

/** קטגוריות רחבות שאין להן ערך מדויק ברשימה, אך עדיין מתאימות. */
const looselyMatches = (raw, activityType) => {
  const cls = raw.class;
  if (activityType === 'shopping') return cls === 'shop';
  if (activityType === 'nature') return cls === 'natural' || cls === 'leisure';
  if (activityType === 'attraction') return cls === 'historic' || cls === 'tourism';
  if (activityType === 'transport') return cls === 'railway' || cls === 'aeroway';
  return false;
};

/** ממיר תוצאה גולמית של Nominatim לשדות שהמסכים צורכים. */
const toPlace = (raw) => {
  const tags = raw.extratags || {};
  return {
    id: raw.place_id,
    label: (raw.display_name || '').split(',')[0].trim(),
    address: raw.display_name || '',
    lat: parseFloat(raw.lat),
    lng: parseFloat(raw.lon),
    kind: kindOf(raw),
    website: tags.website || tags['contact:website'] || '',
    openingHours: tags.opening_hours || '',
    phone: tags.phone || tags['contact:phone'] || '',
    fee: tags.fee || '',
    cuisine: tags.cuisine || '',
    // מזהי ויקיפדיה, שמאפשרים למשוך תקציר עובדתי על המקום
    wikidata: tags.wikidata || '',
    wikipedia: tags.wikipedia || '',
    raw,
  };
};

/**
 * שם היעד מגיע משדה חופשי שהמשתמש מילא, ולכן הוא לא תמיד שם עיר נקי:
 * "פריז, צרפת - טיול משפחתי" הוא ערך לגיטימי במסך התכנון. הדבקתו
 * לשאילתה מאפסת את החיפוש — "מגדל אייפל, פריז" מחזיר תוצאה, ואותו מגדל
 * עם היעד המלא מחזיר אפס.
 */
const cleanDestination = (d) =>
  String(d || '')
    .split(/[-–—|(]/)[0]   // מה שאחרי מקף הוא כינוי לטיול, לא מקום
    .split(',')[0]          // המקטע הראשון הוא העיר
    .trim();

const query = async (q, limit) => {
  try {
    const res = await fetch(
      `${API}?q=${encodeURIComponent(q)}&format=json&limit=${limit}&extratags=1`,
      { headers: { 'Accept-Language': 'he,en', 'User-Agent': 'MyTripPlanner/1.0' } }
    );
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

/**
 * מחפש מקום ומחזיר מועמדים לבחירת המשתמש.
 *
 * הבחירה של המשתמש היא האימות. במקום שהמערכת תכריע לבד ותטעה בשקט,
 * מוצגות האפשרויות — וברור מיד שהשלישית אינה המקום המבוקש.
 *
 * @returns {Promise<Array>} עד `limit` מקומות, עם כתובת, אתר, שעות ומחיר
 */
export const searchPlaces = async (name, destination = '', limit = 6) => {
  const term = String(name || '').trim();
  if (!term) return [];

  const city = cleanDestination(destination);

  // שתי שאילתות ואיחוד ביניהן, לא נסיגה בלבד.
  //
  // הצירוף עם העיר ממקד, אך גם מסתיר: "מוזיאון הלובר, פריז" החזיר את
  // פירמידת הלובר בלבד, בעוד המוזיאון עצמו — הרשומה שיש בה שעות ומחיר —
  // לא הופיע כלל. השם לבדו מחזיר מועמדים אחרים, ושילובם נותן למשתמש
  // לבחור מתוך התמונה המלאה.
  const seen = new Set();
  const merged = [];
  const collect = (rows) => {
    rows.forEach((r) => {
      if (seen.has(r.place_id)) return;
      seen.add(r.place_id);
      merged.push(r);
    });
  };

  collect(await query(city ? `${term}, ${city}` : term, limit));

  if (city && merged.length < limit) {
    await new Promise((r) => setTimeout(r, RATE_MS));
    collect(await query(term, limit));
  }

  return merged.map(toPlace).filter((p) => isGoodCoord(p)).slice(0, limit);
};

/**
 * @returns {{coords: {lat,lng}|null, confidence: 'name'|'address'|'none', place}}
 *   'name'    — המקום עצמו נמצא
 *   'address' — הרחוב נמצא, אך לא אושר שהמקום קיים בו
 *   'none'    — לא נמצא דבר. אין להמציא מיקום.
 *
 * @param {string} activityType סוג הפעילות, אם ידוע. משמש לבחירת המועמד
 *   הנכון מבין כמה בעלי אותו שם, במקום לקחת את הראשון.
 */
export const locatePlace = async (name, address, destination = '', activityType = '') => {
  const city = cleanDestination(destination);
  const suffix = city ? `, ${city}` : '';

  if (name) {
    // חמש תוצאות ולא אחת: התוצאה הראשונה עלולה להיות עסק אחר בעל שם
    // דומה, וכאן אין משתמש שיבחין בכך.
    let raw = await query(`${name}${suffix}`, 5);
    if (!raw.length && suffix) {
      await new Promise((r) => setTimeout(r, RATE_MS));
      raw = await query(name, 5);
    }
    const candidates = raw.map(toPlace).filter(isGoodCoord);

    if (candidates.length) {
      const expected = EXPECTED[activityType] || [];
      const best =
        candidates.find((c) => expected.includes(c.kind)) ||
        candidates.find((c) => looselyMatches(c.raw, activityType)) ||
        candidates[0];
      return { coords: { lat: best.lat, lng: best.lng }, confidence: 'name', place: best };
    }
  }

  if (address) {
    await new Promise((r) => setTimeout(r, RATE_MS));
    const byAddress = (await query(`${address}${suffix}`, 1)).map(toPlace).filter(isGoodCoord);
    if (byAddress.length) {
      const p = byAddress[0];
      return { coords: { lat: p.lat, lng: p.lng }, confidence: 'address', place: p };
    }
  }

  return { coords: null, confidence: 'none', place: null };
};
