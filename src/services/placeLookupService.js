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

/**
 * מילים בעברית בתוך כתובת לטינית מאפסות את החיפוש.
 *
 * הן מוסרות ברמת המילה ולא ברמת המקטע: "80100 נאפולי" מכיל גם מיקוד,
 * ומחיקת המקטע כולו הייתה מוחקת את העוגן היחיד שנשאר בכתובת.
 */
const HEBREW_WORD = /[\u0590-\u05FF][\u0590-\u05FF'"\u05F3\u05F4-]*/g;

/** הוראות מסירה וסיווג פנימי של הספק, שאינם חלק מהכתובת. */
const ADDRESS_NOISE = /\b(c\/o|piano interrato|galleria commerciale|mainland)\b/gi;

/** מנקה מקטע אחד; מחזיר מחרוזת ריקה אם לא נשאר בו דבר שמיש. */
const scrubSegment = (seg) => {
  const out = String(seg).replace(HEBREW_WORD, ' ').replace(ADDRESS_NOISE, ' ').replace(/\s+/g, ' ').trim();
  // שריד קצר כמו "Sn" הוא קוד סניף שנותר אחרי הניקוי, ושאילתה עליו
  // רק שורפת את מגבלת הקצב.
  return out.length >= 3 && /[A-Za-z0-9]/.test(out) ? out : '';
};

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

/**
 * וריאנטים של כתובת, מהמלא אל המצומצם.
 *
 * כתובת מאישור הזמנה אינה כתובת דואר: היא נושאת פירורי הוראות ("C/O",
 * "Piano Interrato"), סיווג פנימי של חברת ההשכרה ("Mainland"), ולעיתים
 * חצי ממנה מתורגם לעברית בעוד השאר לטיני. שירות המפות מחזיר אפס על
 * מחרוזת כזו — לא כי המקום אינו קיים, אלא כי הטקסט אינו כתובת.
 *
 * ── מדוע כל וריאנט שומר עוגן ──
 * מדידה הראתה שנסיגה לשם רחוב בלבד גרועה מכישלון: "Via Dei Campi"
 * נמצא — בסרדיניה, אי אחר לגמרי מהמלון בסורנטו; ו"Piazza Garibaldi"
 * של נאפולי נמצא בטוסקנה, 400 ק"מ צפונה. נקודה בעיר הלא נכונה נראית על
 * המפה בדיוק כמו נקודה נכונה. לכן שני המקטעים האחרונים — עיר, מיקוד,
 * מדינה — נשארים מוצמדים לכל ניסיון.
 */
export const addressVariants = (raw = '') => {
  const txt = String(raw).replace(/\s+-\s+/g, ',').replace(/\s+/g, ' ').trim();
  if (!txt) return [];

  const parts = txt.split(',').map(scrubSegment).filter(Boolean);
  if (!parts.length) return [txt];

  const anchor = parts.length >= 3 ? parts.slice(-2).join(', ') : parts[parts.length - 1];
  const body = parts.slice(0, Math.max(0, parts.length - (parts.length >= 3 ? 2 : 1)));

  const out = [];
  const push = (s) => {
    const v = String(s).trim().replace(/(^,|,$)/g, '').trim();
    if (v && !out.includes(v)) out.push(v);
  };

  push(txt);
  push(parts.join(', '));
  // הארוך קודם: המקטע המפורט ביותר הוא בדרך כלל הרחוב או שם המקום,
  // בעוד הקצרים הם קודי סניף.
  body
    .filter((s) => /[A-Za-z]/.test(s))
    .sort((a, b) => b.length - a.length)
    .forEach((s) => push(`${s}, ${anchor}`));
  push(anchor);

  return out;
};

/**
 * מאתר כתובת בלבד, בלי להעמיד פנים שהמקום עצמו אומת.
 *
 * ההחזרה תמיד ב-confidence 'address': מה שנמצא הוא הרחוב, ואין ראיה
 * שהמלון או המשרד באמת יושבים עליו.
 */
export const locateAddress = async (address) => {
  const variants = addressVariants(address);

  for (let i = 0; i < variants.length; i += 1) {
    if (i > 0) await new Promise((r) => setTimeout(r, RATE_MS));
    const rows = (await query(variants[i], 1)).map(toPlace).filter(isGoodCoord);
    if (rows.length) {
      return { coords: { lat: rows[0].lat, lng: rows[0].lng }, confidence: 'address', place: rows[0], matched: variants[i] };
    }
  }

  return { coords: null, confidence: 'none', place: null, matched: null };
};

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
