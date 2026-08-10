/**
 * סטטוס טיסה בפועל — הנתון שסוגר את מעגל הפיצויים.
 *
 * עד כה האפליקציה ידעה מה מגיע למשתמש אך לא אם קרה משהו שמזכה, ולכן
 * הוא נאלץ לזכור, לחשב ולהזין בעצמו. כאן מגיע העיכוב מהמקור.
 *
 * ── מה נמדד ──
 * התקנה האירופית מודדת את האיחור בהגעה, ובפסיקה — את רגע פתיחת הדלת.
 * לא את ההמראה ולא את הנחיתה על המסלול. ההבחנה מכריעה: טיסה שיצאה
 * באיחור של שלוש וחצי שעות וצמצמה בדרך עשויה שלא לזכות כלל.
 *
 * הנתון הקרוב ביותר שספקי מידע מספקים הוא ההגעה לעמדה, והוא המשמש כאן.
 * כשהוא חסר, נעשה שימוש בזמן הנחיתה — עם סימון מפורש, שכן הוא מוקדם
 * מפתיחת הדלת ועלול להצביע על איחור קצר מהאמיתי.
 */

const HOURS = 3600000;

/** נקודת הקצה. בפיתוח מקומי אין פונקציות שרת, ולכן ההפעלה בפרודקשן. */
const endpoint = (flight, date) =>
  `/api/flight-status?flight=${encodeURIComponent(flight)}&date=${encodeURIComponent(date)}`;

const parse = (iso) => {
  if (!iso) return null;
  const d = new Date(String(iso).replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * שולף את סטטוס הטיסה ומחשב את האיחור בהגעה.
 *
 * @returns {Promise<{
 *   found: boolean, delayHours: number|null, atGate: boolean,
 *   scheduled: Date|null, actual: Date|null, status: string|null, reason?: string
 * }>}
 */
export const fetchFlightStatus = async (flightNumber, date) => {
  const flight = String(flightNumber || '').replace(/\s+/g, '').toUpperCase();
  if (!flight || !/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) {
    return { found: false, delayHours: null, atGate: false, reason: 'חסר מספר טיסה או תאריך תקין.' };
  }

  let res;
  try {
    res = await fetch(endpoint(flight, date));
  } catch {
    return { found: false, delayHours: null, atGate: false, reason: 'לא ניתן היה לפנות לשירות נתוני הטיסות.' };
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const REASONS = {
      NOT_CONFIGURED: 'מעקב הטיסות אינו מוגדר עדיין בשרת.',
      NO_SUBSCRIPTION: 'למפתח אין מנוי ל-API של נתוני הטיסות.',
      NOT_FOUND: 'לא נמצאו נתונים לטיסה בתאריך הזה.',
    };
    return {
      found: false,
      delayHours: null,
      atGate: false,
      reason: REASONS[body.error] || 'שירות נתוני הטיסות אינו זמין כרגע.',
    };
  }

  const data = await res.json();
  const scheduled = parse(data.arrival?.scheduled);
  const actual = parse(data.arrival?.actual);

  if (!scheduled || !actual) {
    // הספק אינו מחזיק תמיד שעת הגעה בפועל, אך כן את שעת ההמראה. איחור
    // בהמראה אינו הנתון הקובע, ובכל זאת הוא אינדיקציה טובה: טיסה שיצאה
    // בזמן כמעט לעולם לא מגיעה באיחור של שלוש שעות. עדיף להציג אותו
    // ולומר במפורש מה הוא, מאשר להשאיר את המשתמש בלי דבר.
    const depSched = parse(data.departure?.scheduled);
    const depActual = parse(data.departure?.actual);

    if (depSched && depActual) {
      const depDelay = Math.max(0, Math.round(((depActual - depSched) / HOURS) * 4) / 4);
      return {
        found: false,
        departureOnly: true,
        departureDelayHours: depDelay,
        scheduled: depSched,
        actual: depActual,
        status: data.status || null,
        reason:
          `אין שעת הגעה בפועל במאגר. ידוע שההמראה אחרה ב-${depDelay} שעות — ` +
          'אך התקנה נמדדת לפי ההגעה, וטיסה מצמצמת לעיתים חלק מהאיחור באוויר.',
      };
    }

    return {
      found: false,
      delayHours: null,
      atGate: false,
      status: data.status || null,
      reason: 'הטיסה נמצאה אך אין לה עדיין שעת הגעה בפועל.',
    };
  }

  // עיגול לרבע שעה: דיוק גבוה מזה יוצר רושם מוטעה של ודאות, והספקים
  // עצמם חלוקים בדקות בודדות.
  const raw = (actual - scheduled) / HOURS;
  const delayHours = Math.max(0, Math.round(raw * 4) / 4);

  return {
    found: true,
    delayHours,
    atGate: !!data.arrival?.atGate,
    scheduled,
    actual,
    status: data.status || null,
  };
};

export const formatClock = (d) =>
  d ? d.toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
