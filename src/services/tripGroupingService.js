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
    start = parseDate(b.startDate);
    end = parseDate(b.endDate) || start;
    location = '';
    title = b.provider || 'ביטוח נסיעות';
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

/** קבוצה להזמנות שלא ניתן לתארך, כדי שלא ייעלמו מהמסך. */
const undatedTrip = (group) => ({
  id: 'trip_undated',
  title: 'הזמנות ללא תאריך',
  destination: 'ללא תאריך',
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
export const groupBookingsIntoTrips = (bookings = []) => {
  const normalized = bookings.map(normalizeBooking);
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

  const trips = clusters.map((group) => {
    const start = group.reduce((min, x) => (x.start < min ? x.start : min), group[0].start);
    const end = group.reduce((max, x) => {
      const e = x.end || x.start;
      return e > max ? e : max;
    }, group[0].end || group[0].start);

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
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
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

  return undated.length ? [...trips, undatedTrip(undated)] : trips;
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
