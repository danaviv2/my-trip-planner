/**
 * בדיקת התנגשויות בין ההזמנות של הנסיעה.
 *
 * הערך של "הכל במקום אחד" הוא לא רק לרכז מידע אלא להצליב אותו. טיסה
 * שנוחתת ב-09:55 ורכב שנאסף ב-11:30 נראים תקינים בנפרד; רק ההצלבה
 * מגלה שהפער צפוף. הפונקציה מחזירה אזהרות מדורגות לפי חומרה.
 *
 * severity: 'error' — סתירה שמונעת את הנסיעה
 *           'warning' — אפשרי אך צפוף/מסוכן
 *           'info' — כדאי לדעת
 */

// זמן מינימלי סביר בין נחיתה לאיסוף רכב בשדה תעופה בינלאומי:
// ביקורת גבולות, כבודה, הליכה לדלפק והשלמת טפסים.
const MIN_LANDING_TO_PICKUP_MIN = 90;

// זמן מינימלי להחזרת רכב לפני טיסה בינלאומית.
const MIN_CAR_RETURN_BEFORE_FLIGHT_MIN = 180;

const toDate = (dateStr, timeStr) => {
  if (!dateStr) return null;
  const t = /^\d{1,2}:\d{2}$/.test(timeStr || '') ? timeStr : '00:00';
  const d = new Date(`${dateStr}T${t}:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

const fmtGap = (minutes) => {
  const abs = Math.abs(Math.round(minutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  // עברית מבדילה בין יחיד לרבים: "שעה ו-35 דקות", לא "1 שעות ו-35 דקות"
  const hours = h === 1 ? 'שעה' : `${h} שעות`;
  const mins = m === 1 ? 'דקה' : `${m} דקות`;
  if (h && m) return `${hours} ו-${mins}`;
  if (h) return hours;
  return mins;
};

/**
 * @param {Array} flights רשימת טיסות ({type,date,arrivalTime,departureTime,...})
 * @param {object|null} carRental פרטי השכרת רכב
 * @param {Array} accommodations רשימת מלונות (אופציונלי)
 * @returns {Array<{severity:string,title:string,detail:string}>}
 */
export const findConflicts = (flights = [], carRental = null, accommodations = []) => {
  const issues = [];

  const outbound = flights.find((f) => f.type === 'departure') || flights[0] || null;
  const inbound = flights.find((f) => f.type === 'return') || null;

  const landing = outbound ? toDate(outbound.date, outbound.arrivalTime) : null;
  const homeFlight = inbound ? toDate(inbound.date, inbound.departureTime) : null;

  // --- סדר הטיסות ---
  if (outbound && inbound) {
    const out = toDate(outbound.date, outbound.departureTime);
    const back = toDate(inbound.date, inbound.departureTime);
    if (out && back && back <= out) {
      issues.push({
        severity: 'error',
        title: 'טיסת החזור לפני טיסת ההלוך',
        detail: `ההלוך ב-${outbound.date} והחזור ב-${inbound.date}. בדוק את התאריכים.`,
      });
    }
  }

  // --- רכב מול טיסות ---
  if (carRental) {
    const pickup = toDate(carRental.pickupDate, carRental.pickupTime);
    const dropoff = toDate(carRental.returnDate, carRental.returnTime);

    if (pickup && dropoff && dropoff <= pickup) {
      issues.push({
        severity: 'error',
        title: 'החזרת הרכב לפני האיסוף',
        detail: `איסוף ב-${carRental.pickupDate} ${carRental.pickupTime}, החזרה ב-${carRental.returnDate} ${carRental.returnTime}.`,
      });
    }

    if (landing && pickup) {
      const gap = (pickup - landing) / 60000;
      if (gap < 0) {
        issues.push({
          severity: 'error',
          title: 'הרכב נאסף לפני שהטיסה נוחתת',
          detail: `הנחיתה ב-${outbound.date} ${outbound.arrivalTime} והאיסוף ${fmtGap(gap)} לפניה.`,
        });
      } else if (gap < MIN_LANDING_TO_PICKUP_MIN) {
        issues.push({
          severity: 'warning',
          title: 'פער צפוף בין הנחיתה לאיסוף הרכב',
          detail: `${fmtGap(gap)} בלבד. ביקורת גבולות, כבודה והדלפק לוקחים לרוב שעה וחצי. שקול לאסוף מאוחר יותר או לעדכן את ההשכרה.`,
        });
      }
    }

    if (homeFlight && dropoff) {
      const gap = (homeFlight - dropoff) / 60000;
      if (gap < 0) {
        issues.push({
          severity: 'error',
          title: 'הרכב מוחזר אחרי טיסת החזור',
          detail: `הטיסה ב-${inbound.date} ${inbound.departureTime} וההחזרה אחריה.`,
        });
      } else if (gap < MIN_CAR_RETURN_BEFORE_FLIGHT_MIN) {
        issues.push({
          severity: 'warning',
          title: 'החזרת הרכב קרובה מדי לטיסה',
          detail: `${fmtGap(gap)} עד ההמראה. לטיסה בינלאומית מומלץ להחזיר לפחות 3 שעות לפני.`,
        });
      }
    }

    // איסוף והחזרה במקומות שונים גוררים לרוב תוספת תשלום
    const p = (carRental.pickupLocation || '').trim();
    const r = (carRental.returnLocation || '').trim();
    if (p && r && p !== r) {
      issues.push({
        severity: 'info',
        title: 'איסוף והחזרה במקומות שונים',
        detail: `איסוף: ${p} · החזרה: ${r}. חברות השכרה גובות לרוב תוספת (one-way fee) — כדאי לוודא שהיא כלולה.`,
      });
    }
  }

  // --- מלונות מול טיסות ---
  accommodations.forEach((h) => {
    const checkIn = toDate(h.checkIn, '15:00');
    const checkOut = toDate(h.checkOut, '11:00');

    if (checkIn && checkOut && checkOut <= checkIn) {
      issues.push({
        severity: 'error',
        title: `תאריכי המלון לא תקינים${h.name ? ` — ${h.name}` : ''}`,
        detail: `צ׳ק-אין ${h.checkIn}, צ׳ק-אאוט ${h.checkOut}.`,
      });
    }
    if (landing && checkIn && checkIn.toDateString() !== landing.toDateString() && checkIn < landing) {
      issues.push({
        severity: 'warning',
        title: `המלון מתחיל לפני ההגעה${h.name ? ` — ${h.name}` : ''}`,
        detail: `צ׳ק-אין ב-${h.checkIn} אבל הנחיתה ב-${outbound.date}. אתה משלם על לילה שלא תנצל.`,
      });
    }
    if (homeFlight && checkOut && checkOut > homeFlight) {
      issues.push({
        severity: 'warning',
        title: `המלון נמשך אחרי טיסת החזור${h.name ? ` — ${h.name}` : ''}`,
        detail: `צ׳ק-אאוט ב-${h.checkOut} אבל הטיסה ב-${inbound.date}.`,
      });
    }
  });

  // --- פערי כיסוי ---
  if (landing && homeFlight && accommodations.length) {
    const nights = accommodations.reduce((sum, h) => {
      const a = toDate(h.checkIn, '15:00');
      const b = toDate(h.checkOut, '11:00');
      if (!a || !b || b <= a) return sum;
      return sum + Math.round((b - a) / 86400000);
    }, 0);
    const tripNights = Math.round((homeFlight - landing) / 86400000);
    if (tripNights > 0 && nights > 0 && nights < tripNights) {
      issues.push({
        severity: 'warning',
        title: 'חסרים לילות לינה',
        detail: `הנסיעה נמשכת ${tripNights} לילות אך יש הזמנות ל-${nights} בלבד. ${tripNights - nights} לילות ללא לינה.`,
      });
    }
  }

  const order = { error: 0, warning: 1, info: 2 };
  return issues.sort((a, b) => order[a.severity] - order[b.severity]);
};
