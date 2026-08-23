import { eventsFor } from './tripTimelineService';
/**
 * קיבוץ הזמנות בודדות לטיולים — הלב של הייבוא האוטומטי.
 *
 * אישורי הזמנה מגיעים בנפרד ובסדר אקראי: טיסה בינואר, מלון בפברואר,
 * רכב שבוע לפני היציאה. מה שהופך אוסף אישורים לכלי שימושי הוא היכולת
 * להבין שכולם שייכים לאותה נסיעה.
 *
 * העיקרון: טיסות מגדירות את גבולות הטיול. הזמנות אחרות משויכות לטיול
 * שחלון התאריכים שלו מכיל אותן. הזמנות ללא טיסה מקובצות לפי קרבת
 * תאריכים.
 */

// פער מרבי בין הזמנות כדי שייחשבו לאותה נסיעה, כשאין טיסות שיגדירו גבולות.
const MAX_GAP_DAYS = 2;

const DAY_MS = 86400000;

const parseDate = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const daysBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / DAY_MS);

/**
 * ממיר הזמנה גולמית לצורה אחידה שאפשר להשוות לפיה.
 * תומך בשמות השדות שמגיעים מ-parseTravelDocument ומהמסכים הקיימים.
 */
/**
 * מתי ההזמנה מתרחשת בפועל, אחרי תיקוני המשתמש.
 *
 * ── הבאג שזה סוגר ──
 * תיקון ידני נשמר בשכבת overrides, ויושם בציר בלבד. הקיבוץ המשיך לקרוא
 * את השדות המקוריים, ולכן אותה רשומה הייתה בשני מקומות בו-זמנית: פריט
 * שהוזז ל-26.8 הוצג בציר תחת 26.8, אך נשאר משויך לנסיעה שהסתיימה ב-5.7
 * — כי מבחינת הקיבוץ הוא עדיין ב-26.6. המסך והמאגר לא הסכימו על עובדה
 * אחת, ואי אפשר היה לדעת איזה מהם צודק.
 *
 * ── למה דרך eventsFor ──
 * זו כבר הפונקציה שיודעת אילו רגעים הזמנה מייצרת ואיך תיקון משפיע
 * עליהם. חישוב מקביל כאן היה נכון היום ומתפצל בעדכון הבא — הדפוס שחזר
 * בפרויקט הזה שוב ושוב. הזמנה שאינה מייצרת רגע בזמן, כמו ביטוח, נופלת
 * בחזרה לשדות המקוריים.
 */
/** YYYY-MM-DD לפי השעון המקומי. */
const localKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const actualDates = (b) => {
  const moments = eventsFor(b).map((e) => e.at).filter((d) => d instanceof Date && !isNaN(d));
  if (!moments.length) return null;
  return {
    start: new Date(Math.min(...moments)),
    end: new Date(Math.max(...moments)),
  };
};

export const normalizeBooking = (b) => {
  const type = b.type || (b.flightNumber ? 'flight' : b.carType ? 'car_rental' : 'hotel');

  let start = null;
  let end = null;
  let location = '';
  let title = '';

  if (type === 'flight') {
    start = parseDate(b.date || b.checkIn);
    end = start;
    location = b.arrivalAirport || b.to || '';
    title = [b.airline, b.flightNumber].filter(Boolean).join(' ') || 'טיסה';
  } else if (type === 'insurance') {
    // פוליסה נושאת לעיתים תוקף סיום בלבד. היא עדיין שייכת לנסיעה, ובלי
    // הגיבוי היא נופלת לקבוצת "ללא תאריך" אף שיש בה תאריך.
    start = parseDate(b.startDate) || parseDate(b.endDate);
    end = parseDate(b.endDate) || start;
    location = '';
    title = b.provider || 'ביטוח נסיעות';
  } else if (type === 'custom') {
    // פריט שהמשתמש הוסיף בעצמו. יש לו תאריך ותו לא, וזה מספיק כדי
    // לשייך אותו לנסיעה הנכונה.
    start = parseDate(b.date);
    end = start;
    location = b.location || '';
    title = b.title || 'פריט בתוכנית';
  } else if (type === 'activity') {
    start = parseDate(b.date);
    end = start;
    location = b.location || '';
    title = b.name || 'אטרקציה';
  } else if (type === 'car_rental' || type === 'transfer') {
    start = parseDate(b.pickupDate || b.checkIn);
    end = parseDate(b.returnDate || b.checkOut) || start;
    location = b.pickupLocation || b.destination || '';
    title = b.company || b.name || 'השכרת רכב';
  } else {
    start = parseDate(b.checkIn);
    end = parseDate(b.checkOut) || start;
    location = b.address || b.destination || b.city || '';
    title = b.name || 'לינה';
  }

  // התיקונים גוברים על השדות המקוריים, בדיוק כפי שהם גוברים בציר.
  const fixed = actualDates(b);
  if (fixed) {
    start = fixed.start;
    end = fixed.end;
  }

  return {
    id: b.id || `${type}_${start ? start.getTime() : Math.random()}`,
    type,
    start,
    end,
    location,
    title,
    // כיוון הטיסה חשוב לקביעת גבולות הטיול
    direction: type === 'flight' ? (b.type === 'return' ? 'return' : b.direction || 'departure') : null,
    raw: b,
  };
};

/**
 * קובע לכל טיסה אם היא הלוך או חזור, לפי הנסיעה עצמה.
 *
 * הכיוון הגיע עד כה מהמודל, והוא כמעט תמיד החזיר "departure" — ולכן
 * טיסת החזור הוצגה כ"טיסת הלוך", וגם לא נמצא לה בן-זוג בבניית חלון
 * הנסיעה, כך שהנסיעה התפצלה לשתיים.
 *
 * הנתונים יודעים את התשובה בלי לנחש: הטיסה המוקדמת ביותר יוצאת מהבית,
 * וכל טיסה שנוחתת בנקודת המוצא ההיא היא חזור.
 */
const withFlightDirection = (bookings) => {
  const flights = bookings
    .filter((b) => b.type === 'flight' && b.date)
    .sort((x, y) => String(x.date).localeCompare(String(y.date)));

  const home = String(flights[0]?.departureAirport || '').trim().toUpperCase();
  if (!home) return bookings;

  const isHome = (v) => {
    const s = String(v || '').trim().toUpperCase();
    return !!s && (s === home || s.includes(home) || home.includes(s));
  };

  return bookings.map((b) => {
    if (b.type !== 'flight') return b;
    // הטיסה הראשונה היא ההלוך גם אם היא נוחתת קרוב לבית
    if (b === flights[0]) return { ...b, direction: 'departure' };
    return isHome(b.arrivalAirport) ? { ...b, direction: 'return' } : { ...b, direction: 'departure' };
  });
};

/** קבוצה להזמנות שלא ניתן לתארך, כדי שלא ייעלמו מהמסך. */
const undatedTrip = (group) => ({
  id: 'trip_undated',
  title: 'הזמנות שאינן משויכות לנסיעה',
  destination: 'לא משויך לנסיעה',
  startDate: '',
  endDate: '',
  nights: 0,
  undated: true,
  bookings: group.map((x) => x.raw),
  summary: {
    flights: group.filter((x) => x.type === 'flight').length,
    hotels: group.filter((x) => x.type === 'hotel').length,
    cars: group.filter((x) => x.type === 'car_rental').length,
    transfers: group.filter((x) => x.type === 'transfer').length,
    activities: group.filter((x) => x.type === 'activity').length,
    insurance: group.filter((x) => x.type === 'insurance').length,
  },
});

/**
 * מקבץ הזמנות לטיולים.
 *
 * @param {Array<object>} bookings הזמנות גולמיות
 * @returns {Array<{id,title,destination,startDate,endDate,bookings}>}
 */
/**
 * הפריטים שקובעים את גבולות הנסיעה.
 *
 * ── למה ביטוח אינו אחד מהם ──
 * פוליסה נמכרת לחלון תוקף רחב, ולא לתאריכי הנסיעה בפועל. פוליסה שתקפה
 * 24.6–31.8 מתחה את הנסיעה לנאפולי עד סוף אוגוסט, ואז כל פריט חדש
 * בתווך נבלע לתוכה: ארוחת ערב שנקבעה ל-26.8 הופיעה בתוך נסיעה שהסתיימה
 * ב-5.7, עם מפריד של "52 ימים ללא הזמנות" באמצע.
 *
 * הביטוח עדיין שייך לנסיעה ומוצג בה — הוא פשוט אינו מגדיר אותה. זו
 * אותה הבחנה שכבר קיימת בציר, שם ביטוח אינו אירוע אלא פריט שחל על
 * הנסיעה כולה.
 *
 * קבוצה שכולה ביטוח נשארת עם גבולותיה: אין ממה אחר לגזור אותם.
 */
const boundingItems = (group = []) => {
  const solid = group.filter((x) => x.type !== 'insurance');
  return solid.length ? solid : group;
};

export const groupBookingsIntoTrips = (bookings = []) => {
  // הכיוון נגזר לפני הקיבוץ ולא אחריו: הוא קובע אילו טיסות מזדווגות
  // לחלון נסיעה. כשכל הטיסות מסומנות "הלוך", כל אחת פותחת חלון משלה
  // והנסיעה מתפצלת.
  const normalized = withFlightDirection(bookings).map(normalizeBooking);
  const items = normalized.filter((b) => b.start).sort((a, b) => a.start - b.start);

  // הזמנה שתאריכיה לא נקראו נעלמה כאן לחלוטין — בלי הודעה ובלי מקום
  // להופיע בו. פוליסת ביטוח בלי תוקף קריא היא בדיוק המקרה: היא נסרקה,
  // נשמרה, ופשוט לא הוצגה. עדיף להראות אותה בקבוצה נפרדת.
  const undated = normalized.filter((b) => !b.start);

  if (!items.length) return undated.length ? [undatedTrip(undated)] : [];

  // שלב 1 — טיסות מגדירות את גבולות הנסיעה.
  // זוג הלוך-חזור יוצר חלון, גם אם אין ביניהם דבר. בלי השלב הזה נסיעה
  // של שמונה ימים בלי מלון הייתה מתפצלת לשני "טיולים" בגלל הפער.
  const flights = items.filter((x) => x.type === 'flight');
  const used = new Set();
  const windows = [];

  flights.forEach((f) => {
    if (used.has(f.id) || f.direction === 'return') return;
    const back = flights.find(
      (r) => r.direction === 'return' && !used.has(r.id) && r.start >= f.start
    );
    used.add(f.id);
    if (back) used.add(back.id);
    windows.push({
      start: f.start,
      end: back ? back.start : f.start,
      members: back ? [f, back] : [f],
    });
  });

  // טיסות שלא שויכו לזוג (למשל חזור בלי הלוך) פותחות חלון משלהן
  flights.forEach((f) => {
    if (used.has(f.id)) return;
    used.add(f.id);
    windows.push({ start: f.start, end: f.start, members: [f] });
  });

  // שלב 2 — כל הזמנה שאינה טיסה נכנסת לחלון שמכיל אותה
  const leftovers = [];
  items
    .filter((x) => x.type !== 'flight')
    .forEach((x) => {
      const w = windows.find(
        (win) =>
          daysBetween(x.end || x.start, win.start) <= MAX_GAP_DAYS &&
          daysBetween(win.end, x.start) <= MAX_GAP_DAYS
      );
      if (w) w.members.push(x);
      else leftovers.push(x);
    });

  // שלב 3 — מה שנשאר (נסיעה בלי טיסות כלל) מקובץ לפי קרבת תאריכים
  const clusters = windows
    .sort((a, b) => a.start - b.start)
    .map((w) => w.members);

  if (leftovers.length) {
    let current = [leftovers[0]];
    for (let i = 1; i < leftovers.length; i++) {
      const clusterEnd = current.reduce(
        (max, x) => ((x.end || x.start) > max ? x.end || x.start : max),
        current[0].end || current[0].start
      );
      if (daysBetween(clusterEnd, leftovers[i].start) <= MAX_GAP_DAYS) {
        current.push(leftovers[i]);
      } else {
        clusters.push(current);
        current = [leftovers[i]];
      }
    }
    clusters.push(current);
  }

  // איחוד קבוצות שטווחי התאריכים שלהן נחתכים.
  //
  // כל טיסה שלא נמצא לה בן-זוג פותחת חלון משלה, ולכן אישור צ׳ק-אין או
  // כרטיס טיסה בודד יצרו "נסיעה" נפרדת שנפלה בתוך נסיעה קיימת: אותה
  // נסיעה לנאפולי הופיעה כשש נסיעות, ובהן שתיים בשם TLV. נסיעה היא טווח
  // זמן רציף, ושני טווחים נחתכים אינם יכולים להיות שתי נסיעות.
  //
  // התנאי הוא חיתוך בפועל ולא סמיכות, כדי ששתי נסיעות עוקבות באמת
  // יישארו נפרדות.
  const rangeOf = (group) => {
    const src = boundingItems(group);
    return {
      start: src.reduce((min, x) => (x.start < min ? x.start : min), src[0].start),
      end: src.reduce((max, x) => {
        const e = x.end || x.start;
        return e > max ? e : max;
      }, src[0].end || src[0].start),
    };
  };

  const mergedClusters = [];
  clusters
    .filter((g) => g.length)
    .map((g) => ({ group: g, ...rangeOf(g) }))
    .sort((a, b) => a.start - b.start)
    .forEach((c) => {
      const prev = mergedClusters[mergedClusters.length - 1];
      if (prev && c.start <= prev.end) {
        prev.group.push(...c.group);
        if (c.end > prev.end) prev.end = c.end;
      } else {
        mergedClusters.push(c);
      }
    });

  // קבוצה שאינה יודעת לומר היכן — אינה נסיעה.
  //
  // הכלל נכתב תחילה על "insurance" בלבד: פוליסה שאינה נחתכת עם שום
  // נסיעה פתחה קבוצה משלה, ומכיוון שאין בה שם מקום היא הוצגה כ"יעד לא
  // ידוע". אבל הסוג מעולם לא היה הסיבה — היעדר המקום היה. שובר כניסה
  // לטרקלין, שנשמר כ-activity, החזיק תאריך ולא החזיק מקום, ולכן חמק מן
  // הכלל ובנה בדיוק את אותה נסיעה חסרת יעד. זהו הדפוס שחוזר כאן: תיקון
  // שהוחל על סוג אחד ולא על אחיו.
  //
  // הניסוח לפי מקום מכסה את שניהם בלי למנות סוגים, ומכסה מראש גם את
  // הבא בתור. פריט כזה עדיין מוצג — הוא נצמד לנסיעה קיימת או עומד
  // בקבוצת "לא משויך" — הוא פשוט אינו מגדיר נסיעה משל עצמו.
  const standalone = [];
  const realTrips = mergedClusters.filter(({ group }) => {
    const knowsWhere = group.some((x) => String(x.location || '').trim());
    if (!knowsWhere) {
      standalone.push(...group);
      return false;
    }
    return true;
  });

  const trips = realTrips.map(({ group }) => {
    const bounds = boundingItems(group);
    const start = bounds.reduce((min, x) => (x.start < min ? x.start : min), bounds[0].start);
    const end = bounds.reduce((max, x) => {
      const e = x.end || x.start;
      return e > max ? e : max;
    }, bounds[0].end || bounds[0].start);

    // שם היעד: מעדיפים מקום קריא לאדם על פני קוד IATA. "ורונה" עדיף
    // על "MXP" גם כשהטיסה מגדירה את הטיול.
    const outbound = group.find((x) => x.type === 'flight' && x.direction !== 'return');
    const stay = group.find((x) => x.type === 'hotel');
    const car = group.find((x) => x.type === 'car_rental');
    const stayFallback = group.find((x) => x.type === 'transfer');
    const isAirportCode = (s) => /^[A-Z]{3}$/.test((s || '').trim());

    // כתובת מלאה אינה שם יעד. שתי צורות נפוצות דורשות טיפול שונה:
    //
    // שדה תעופה — "Capodichino - Naples International Airport (NAP), ..."
    // שם העיר צמוד למילה Airport, ולכן מנקים ממנה את מילות השדה והקוד.
    // המקטע הראשון הוא לרוב שם הטרמינל, ואיש אינו אומר "אני טס לקפודיקינו".
    //
    // כתובת רגילה — "Palazzo Berio, Via Toledo, 256, 80132 Napoli NA, Italy"
    // כאן העיר נמצאת בסוף ולא בהתחלה: המקטע הראשון הוא שם הבניין. לכן
    // מסירים את המדינה, לוקחים את המקטע האחרון ומנקים מיקוד וקוד מחוז.
    const COUNTRIES = /^(italy|italia|france|spain|españa|greece|germany|deutschland|portugal|israel|usa|united states|united kingdom|uk|netherlands|austria|switzerland|belgium|croatia|cyprus)$/i;
    const AIRPORT_WORDS = /\b(international|intl|airport|aeroporto|aeropuerto|aéroport|flughafen|terminal)\b/gi;

    const cityOf = (raw) => {
      if (!raw) return '';
      const cleaned = String(raw).replace(/\s+/g, ' ').trim();
      const parts = cleaned.split(/[,\-–]/).map((p) => p.trim()).filter(Boolean);

      const airportPart = parts.find((p) => /\bairport|aeroporto|aeropuerto|aéroport|flughafen\b/i.test(p));
      if (airportPart) {
        const city = airportPart
          .replace(/\([A-Z]{3}\)/g, '')
          .replace(AIRPORT_WORDS, '')
          .replace(/\s+/g, ' ')
          .trim();
        if (city.length >= 3) return city;
      }

      if (cleaned.length <= 28) return cleaned;

      const withoutCountry = parts.filter((p) => !COUNTRIES.test(p));
      const tail = withoutCountry[withoutCountry.length - 1] || '';
      const city = tail
        .replace(/^\d{4,6}\s*/, '') // מיקוד מוביל
        .replace(/\s+[A-Z]{2}$/, '') // קוד מחוז נגרר (Napoli NA)
        .trim();
      if (city.length >= 3 && city.length <= 24 && !/^\d/.test(city)) return city;

      const named = withoutCountry.find(
        (p) => p.length >= 3 && p.length <= 24 && !/^\d/.test(p) && !isAirportCode(p)
      );
      return named || parts[0] || cleaned.slice(0, 28);
    };

    // יעד הטיסה הוא הסימן האמין ביותר ליעד הנסיעה — כשהוא כתוב בשם
    // ולא בקוד. אחריו כתובת הלינה, ורק לבסוף נקודת איסוף הרכב.
    const candidates = [outbound?.location, stay?.location, car?.location, stayFallback?.location, group[0].location];
    const readable = candidates.find((c) => c && !isAirportCode(c));
    const destination = readable
      ? cityOf(readable)
      : candidates.find(Boolean) || 'יעד לא ידוע';

    const nights = Math.max(0, daysBetween(start, end));

    return {
      id: `trip_${start.getTime()}_${destination.replace(/\s+/g, '').slice(0, 8)}`,
      title: `${destination}${nights ? ` · ${nights} לילות` : ''}`,
      destination,
      // מרכיבי הזמן המקומיים ולא toISOString: חצות מקומית בישראל היא
      // עדיין אתמול בשעון UTC, והנסיעה הייתה מוצגת יום אחד אחורה. זה
      // לא נראה קודם רק משום שהתאריכים הגיעו מ-parseDate; מרגע שהם
      // נגזרים מרגעי הציר, שהם מקומיים, הסטייה נחשפה.
      startDate: localKey(start),
      endDate: localKey(end),
      nights,
      bookings: group.map((x) => x.raw),
      summary: {
        flights: group.filter((x) => x.type === 'flight').length,
        hotels: group.filter((x) => x.type === 'hotel').length,
        cars: group.filter((x) => x.type === 'car_rental').length,
        transfers: group.filter((x) => x.type === 'transfer').length,
        activities: group.filter((x) => x.type === 'activity').length,
        insurance: group.filter((x) => x.type === 'insurance').length,
      },
    };
  });

  const unattached = [...undated, ...standalone];
  return unattached.length ? [...trips, undatedTrip(unattached)] : trips;
};

/**
 * משייך הזמנה חדשה לטיול קיים, או מסמן שיש לפתוח טיול חדש.
 * זו הפונקציה שתיקרא כשמגיע אישור חדש מהמייל.
 *
 * @returns {{action:'merged'|'created', trip:object}}
 */
export const assignBookingToTrips = (existingTrips = [], newBooking) => {
  const b = normalizeBooking(newBooking);
  if (!b.start) return { action: 'created', trip: null };

  const match = existingTrips.find((t) => {
    const s = parseDate(t.startDate);
    const e = parseDate(t.endDate);
    if (!s || !e) return false;
    // ההזמנה נופלת בתוך חלון הטיול, או צמודה לו עד MAX_GAP_DAYS
    const before = daysBetween(b.end || b.start, s);
    const after = daysBetween(e, b.start);
    return before <= MAX_GAP_DAYS && after <= MAX_GAP_DAYS;
  });

  if (match) {
    const merged = groupBookingsIntoTrips([...(match.bookings || []), newBooking])[0];
    return { action: 'merged', trip: { ...match, ...merged, id: match.id } };
  }

  return { action: 'created', trip: groupBookingsIntoTrips([newBooking])[0] };
};
