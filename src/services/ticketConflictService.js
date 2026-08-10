/**
 * הצלבת כרטיסים מתוזמנים מול התכנון היומי.
 *
 * כרטיס לשעה מסוימת אינו מסמך אלא אילוץ. כניסה לפומפיי בעשר בבוקר קובעת
 * את היום כולו, ואם המתכנן שיבץ באותה שעה משהו אחר — אחד מהם ייפול, ואיש
 * לא יידע עד שיהיה מאוחר. הכרטיס לרוב אינו ניתן לשינוי ואינו מוחזר;
 * התכנון כן.
 *
 * עד כה שני הצדדים חיו בנפרד: הכרטיסים נשמרו בהזמנות, התכנון נבנה
 * בנפרד, ואיש לא הצליב ביניהם. כאן הם נפגשים.
 */

const DAY_MS = 86400000;

const toDate = (v) => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const dayKey = (d) => (d ? d.toISOString().slice(0, 10) : '');

/** "09:30" → 570 דקות מחצות. */
const minutesOf = (time) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(time || '').trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h >= 0 && h < 24 && min >= 0 && min < 60 ? h * 60 + min : null;
};

/**
 * "2h", "1h30m", "90m" → דקות.
 * ברירת מחדל שעה וחצי כשאין נתון — טווח סביר לפעילות, ומספיק כדי
 * לזהות חפיפה אמיתית בלי להמציא התנגשויות על סמך שכנות בלבד.
 */
const durationMinutes = (raw) => {
  const text = String(raw || '').toLowerCase();
  const h = /(\d+(?:\.\d+)?)\s*h/.exec(text);
  const m = /(\d+)\s*m/.exec(text);
  if (!h && !m) return 90;
  return Math.round((h ? parseFloat(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0)) || 90;
};

const fmt = (mins) =>
  `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

/**
 * ממפה כל יום במסלול לתאריך אמיתי.
 *
 * המסלול נושא מספר יום ולא תאריך, ולכן בלי תאריך התחלה אי אפשר להצליב
 * דבר — וזו הסיבה שהפונקציה מחזירה רשימה ריקה במקום לנחש.
 */
const datedDays = (dailyItinerary = [], startDate) => {
  const start = toDate(startDate);
  if (!start) return [];
  return dailyItinerary
    .map((day, i) => {
      const n = Number(day?.day) || i + 1;
      return { ...day, date: new Date(start.getTime() + (n - 1) * DAY_MS) };
    })
    .filter((d) => d.date);
};

/**
 * @param {Array} bookings הזמנות הנסיעה
 * @param {Array} dailyItinerary התכנון היומי
 * @param {string|Date} startDate תאריך היום הראשון
 * @returns {Array<{severity,title,detail}>}
 */
export const findTicketConflicts = (bookings = [], dailyItinerary = [], startDate) => {
  const tickets = bookings.filter(
    (b) => b.type === 'activity' && b.date && minutesOf(b.time) !== null
  );
  if (!tickets.length) return [];

  const days = datedDays(dailyItinerary, startDate);
  const issues = [];

  tickets.forEach((ticket) => {
    const tStart = minutesOf(ticket.time);
    const tEnd = tStart + durationMinutes(ticket.duration);
    const key = dayKey(toDate(ticket.date));
    const day = days.find((d) => dayKey(d.date) === key);

    // אין תכנון ליום הזה כלל — לא התנגשות אלא חוסר
    if (!day) {
      if (days.length) {
        issues.push({
          severity: 'info',
          title: `${ticket.name || 'כרטיס'} — אין תכנון ליום הזה`,
          detail: `יש לך כניסה ב-${ticket.date} בשעה ${ticket.time}, אך היום הזה אינו מכוסה במסלול. שווה לבנות סביבו את היום.`,
        });
      }
      return;
    }

    const planned = (day.activities || []).filter((a) => minutesOf(a.time) !== null);

    // פעילות שהיא הכרטיס עצמו. בלי ההבחנה הזו כרטיס ששובץ נכון במסלול
    // דווח כמתנגש בעצמו — התראה שגויה על המצב הרצוי ביותר.
    const sameAs = (a) => {
      const an = String(a.name || '').trim().toLowerCase();
      const tn = String(ticket.name || '').trim().toLowerCase();
      if (!an || !tn) return false;
      return an.includes(tn.slice(0, 8)) || tn.includes(an.slice(0, 8));
    };

    const isInPlan = planned.some(sameAs);

    const clashes = planned.filter((a) => {
      if (sameAs(a)) return false;
      const aStart = minutesOf(a.time);
      const aEnd = aStart + durationMinutes(a.duration);
      // חפיפה אמיתית בלבד: סיום בדיוק בשעת ההתחלה אינו התנגשות
      return aStart < tEnd && tStart < aEnd;
    });

    if (clashes.length) {
      issues.push({
        severity: 'error',
        title: `התנגשות עם כרטיס שכבר שילמת עליו — ${ticket.name || 'כרטיס'}`,
        detail:
          `הכניסה ב-${ticket.date} בשעה ${ticket.time}, ובאותו זמן מתוכנן ` +
          clashes.map((c) => `"${c.name}" (${c.time})`).join(' ו-') +
          `. כרטיס מתוזמן לרוב אינו ניתן לשינוי ואינו מוחזר — עדיף להזיז את התכנון.`,
      });
      return;
    }

    // הכרטיס אינו מתנגש אך גם אינו מופיע בתכנון — היום נראה פנוי בשעה
    // שבה אתה כבר מחויב, ובקלות ישובץ בה משהו.
    if (!isInPlan) {
      issues.push({
        severity: 'warning',
        title: `הכרטיס אינו מופיע במסלול — ${ticket.name || 'כרטיס'}`,
        detail:
          `הכניסה ב-${ticket.date} בשעה ${ticket.time} (עד ${fmt(tEnd)}), אך היום ` +
          `נראה פנוי בשעה הזו. הוסף אותו למסלול כדי שלא ישובץ שם משהו אחר.`,
      });
    }
  });

  return issues.sort((a, b) => {
    const order = { error: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });
};
