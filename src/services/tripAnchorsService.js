/**
 * עוגנים: מה שכבר סגור, כפי שהתכנון רואה אותו.
 *
 * ── הבעיה ──
 * מתכנן המסלול היה עיוור לחלוטין להזמנות. לא "לא מציג אותן" — לא ידע
 * שהן קיימות. לכן הוא יכול לתכנן מוזיאון ב-15:00 בצד השני של העיר כשיש
 * כרטיס לווזוב ב-15:40: הוא אינו מפספס את האטרקציה, הוא מתכנן את
 * הפספוס.
 *
 * ── למה קריאה ולא העתקה ──
 * הפיתוי הוא להעתיק את ההזמנה לתוך התוכנית. זה יוצר שני בעלים לאותה
 * עובדה, וזה נשבר בדיוק במקום שכואב: תבטל את הכרטיס, ההזמנה תימחק,
 * וההעתק בתוכנית יישאר. התוכנית תיבנה סביב אטרקציה שאין לך אליה כרטיס —
 * וזה גרוע מלפספס אותה, כי פספוס מגלים ותוכנית שגויה מוליכה שולל.
 *
 * כאן ההזמנה נשארת הבעלים היחיד. התכנון קורא אותה בזמן התצוגה, ולכן
 * ביטול או שינוי מועד משתקפים מעצמם — לא היה מה לסנכרן.
 */

import { eventsFor } from './tripTimelineService';
import { dateKey } from './bookingIdentity';

const DAY_MS = 86400000;

/**
 * התאריך של יום מספר N בתוכנית.
 *
 * התוכנית מדברת ב"יום 1, יום 2", וההזמנות בתאריכים. בלי הגשר הזה אין
 * לשני המסכים שפה משותפת, וזו הסיבה שהם חיו זה לצד זה בלי לדעת.
 *
 * @returns {string|null} 'YYYY-MM-DD', או null כשאין תאריך התחלה
 */
export const dateForDay = (startDate, dayNumber) => {
  const key = dateKey(startDate);
  const n = Number(dayNumber);
  if (!key || !Number.isFinite(n) || n < 1) return null;

  const [y, m, d] = key.split('-').map(Number);
  const at = new Date(y, m - 1, d + (n - 1));
  return `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`;
};

/**
 * העוגנים של יום מסוים, מסודרים לפי שעה.
 *
 * כל סוג הזמנה נכלל ולא רק אטרקציות: טיסה ב-15:00 היא האילוץ הקשה
 * ביותר של היום, והחזרת רכב בשדה התעופה קובעת את סופו. תוכנית שיודעת
 * רק על הכרטיסים עדיין תשלח אותך לסיור בשעה שאתה אמור להיות בטרמינל.
 */
export const anchorsForDay = (bookings = [], dayKey) => {
  if (!dayKey) return [];

  return bookings
    .flatMap(eventsFor)
    .filter((ev) => ev.dayKey === dayKey)
    .map((ev) => ({
      bookingId: ev.booking && ev.booking.id,
      kind: ev.kind,
      title: ev.title,
      place: ev.place || ev.detail || '',
      coords: ev.coords || null,
      icon: ev.icon,
      color: ev.color,
      allDay: ev.allDay,
      at: ev.at,
      order: ev.order,
      // שעה כטקסט, או ריק כשאין. אירוע בלי שעה לא יקבל שעה מומצאת רק
      // כדי להיראות מסודר בתוכנית.
      time: ev.allDay
        ? ''
        : `${String(ev.at.getHours()).padStart(2, '0')}:${String(ev.at.getMinutes()).padStart(2, '0')}`,
    }))
    .sort((a, b) => a.order - b.order);
};

/** האם ליום הזה יש בכלל משהו סגור. */
export const hasAnchors = (bookings, dayKey) => anchorsForDay(bookings, dayKey).length > 0;

/**
 * מיזוג לתצוגה: פעילויות מתוכננות ועוגנים על ציר אחד.
 *
 * המיזוג הוא לצפייה בלבד ואינו נכתב לשום מקום. שני המקורות נשארים
 * נפרדים בבעלות, ומשותפים רק בעין — "שני עורכים, קורא אחד".
 *
 * @returns {Array} פריטים עם isAnchor שמבדיל ביניהם
 */
export const mergeDayView = (activities = [], anchors = []) => {
  const minutes = (t) => {
    const m = /^(\d{1,2}):(\d{2})/.exec(String(t || '').trim());
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };

  const planned = (activities || []).map((a, i) => ({
    isAnchor: false,
    key: `a${i}`,
    order: minutes(a.time),
    activity: a,
  }));

  const fixed = (anchors || []).map((a, i) => ({
    isAnchor: true,
    key: `k${a.bookingId || i}-${a.kind}`,
    order: a.allDay ? null : minutes(a.time),
    anchor: a,
  }));

  // פריט בלי שעה יורד לסוף במקום להתיישב שרירותית בבוקר: מיקום מומצא
  // בתוך היום נראה כמו מידע, ואינו.
  return [...planned, ...fixed].sort((x, y) => {
    if (x.order == null && y.order == null) return 0;
    if (x.order == null) return 1;
    if (y.order == null) return -1;
    return x.order - y.order;
  });
};
