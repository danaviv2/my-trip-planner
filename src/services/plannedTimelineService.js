/**
 * הפעילויות המתוכננות, בצורה שהציר יודע לקרוא.
 *
 * ── הבעיה ──
 * "הבא בתור" קרא הזמנות בלבד. ביום שיש בו גם כרטיס וגם פעילות מתוכננת
 * הוא ענה תשובה חלקית: המשתמש רואה "הבא בתור: טיסה ב-15:00" בזמן
 * שהדבר הקרוב באמת הוא הסיור שתכנן לעשר בבוקר. כרטיס שנועד לענות על
 * "מה עכשיו" ועונה על חצי מהשאלה מטעה יותר משאינו קיים.
 *
 * ── והכיוון ההפוך כבר קיים ──
 * `tripAnchorsService` נותן לתכנון לקרוא את ההזמנות. כאן נסגר המעגל:
 * המסך שמציג את ההזמנות קורא את התכנון. שני העורכים נשארים נפרדים
 * בבעלות; רק התצוגה מאחדת — "שני עורכים, קורא אחד".
 *
 * ── ולמה `planned` מסומן ──
 * הזמנה היא התחייבות ששולם עליה, פעילות מתוכננת היא כוונה. הצגתן כשוות
 * מטעה לשני הכיוונים: היא הופכת כוונה למחייבת, ומורידה מכובד ההתחייבות.
 * לכן כל אירוע מכאן נושא `planned: true`, והמסך אומר זאת במפורש.
 */

const DRAFT_KEY = 'activeTripDraft';

/** דקות מתחילת היום, או null כשאין שעה. שעה מומצאת גרועה מהיעדרה. */
const minutesOf = (t) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(t || '').trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h >= 0 && h < 24 && min >= 0 && min < 60 ? h * 60 + min : null;
};

/**
 * התוכנית הפעילה, כפי שהיא נשמרת מקומית.
 *
 * הקריאה עטופה: מכסה מלאה או JSON פגום לא יפילו את המסך שכל תפקידו
 * להראות מה קורה עכשיו.
 */
export const readActivePlan = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    const plan = raw ? JSON.parse(raw) : null;
    return plan && Array.isArray(plan.dailyItinerary) && plan.dailyItinerary.length ? plan : null;
  } catch {
    return null;
  }
};

/**
 * פעילויות התוכנית כאירועי ציר.
 *
 * התאריך נלקח מ-`day.date` ולא מחושב כאן מחדש. אותו ערך כבר נגזר במקום
 * אחד, והנגזרת השנייה הייתה נפרדת ממנו בשינוי הבא — זה בדיוק מה שקרה
 * כאן פעם, כשאותה רשומה ישבה תחת שני תאריכים.
 *
 * פעילות בלי שעה אינה נכנסת: "הבא בתור" מדבר בזמן, ופריט בלי שעה אין
 * לו מקום בסדר. הוא מוצג ממילא במסך התכנון.
 *
 * @param {object} plan תוכנית עם dailyItinerary
 * @returns {Array} אירועים בצורת eventsFor, עם planned: true
 */
export const plannedEvents = (plan) => {
  if (!plan || !Array.isArray(plan.dailyItinerary)) return [];

  const events = [];
  plan.dailyItinerary.forEach((day) => {
    const dayKey = String(day && day.date ? day.date : '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) return;

    (day.activities || []).forEach((act, i) => {
      const mins = minutesOf(act && act.time);
      if (mins === null) return;

      const [y, m, d] = dayKey.split('-').map(Number);
      const at = new Date(y, m - 1, d, Math.floor(mins / 60), mins % 60);

      events.push({
        planned: true,
        kind: 'planned',
        dayKey,
        at,
        order: mins,
        allDay: false,
        icon: '📍',
        color: '#667eea',
        title: act.name || 'פעילות בתוכנית',
        detail: act.duration || '',
        place: act.address || act.name || '',
        coords: act.coords || null,
        id: `plan_${dayKey}_${i}`,
      });
    });
  });

  return events.sort((a, b) => a.at - b.at);
};

/**
 * האירוע הקרוב מבין ההזמנות והתוכנית גם יחד.
 *
 * מקבל את הימים שכבר נבנו מההזמנות ומוסיף עליהם, במקום לבנות ציר שני
 * ולהשוות ביניהם: שתי רשימות נפרדות מאבדות את הסדר בתוך היום, שנקבע גם
 * לפי משמעות האירוע ולא רק לפי שעה.
 *
 * @param {Array} bookingDays תוצאת buildTimeline
 * @param {object|null} plan  התוכנית הפעילה
 * @param {Date} now
 * @param {(ev:object, now:Date)=>boolean} hasPassed בדיקת "כבר עבר"
 */
export const nextFromBoth = (bookingDays = [], plan = null, now = new Date(), hasPassed) => {
  const fromBookings = bookingDays.flatMap((d) => d.events || []);
  // המיון הוא לפי היום ואז לפי `order` — בדיוק כמו ב-`buildTimeline` —
  // ולא לפי `at`. אירוע בלי שעה מקבל חצות ב-`at`, ולכן מיון לפי `at`
  // מקפיץ אותו לראש היום: כניסה למלון הופיעה לפני טיסת 06:20 של אותו
  // בוקר. `order` קיים בדיוק בשביל זה (`DAY_ANCHOR` נותן לכניסה 1441),
  // והוא היה כאן רק שובר-שוויון ולכן לא קיבל הזדמנות. שני מקומות שגזרו
  // את אותו סדר, ואחד מהם נשבר.
  const all = [...fromBookings, ...plannedEvents(plan)]
    .filter((ev) => (hasPassed ? !hasPassed(ev, now) : ev.at > now))
    .sort((a, b) =>
      String(a.dayKey || '').localeCompare(String(b.dayKey || '')) ||
      (a.order || 0) - (b.order || 0) ||
      a.at - b.at);

  return all[0] || null;
};

export default { readActivePlan, plannedEvents, nextFromBoth };
