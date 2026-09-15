// utils/stayDates.js
//
// תאריכי לינה לעצירה בטיול מתגלגל: מתי נכנסים ומתי יוצאים.
//
// ── למה זה קיים ──
// כפתור "חפש ב-Booking" שלח רק את שם המלון, ו-Booking פתחה בלי תאריכים.
// הבעלים (15.09.2026): "3 ימים בניו יורק — הייתי מצפה שיהיו התאריכים
// שהחלטנו עליהם". תאריך היציאה כבר נשאל במסך, אבל שימש רק למזג האוויר.
//
// ── החשבון נעשה על רכיבי התאריך, לא על Date מקומי ──
// `toISOString` מחזיר UTC: חצות מקומית בישראל היא עדיין אתמול, וכך יום 1
// של טיול מ-26.8 קיבל פעם 25.8 (TripPlanner.dayDate). כאן אין שעה בכלל.

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "2026-10-01" + 3 ⟵ "2026-10-04". מחרוזת לא תקינה ⟵ null. */
export const addDaysIso = (iso, n) => {
  const m = ISO.exec(String(iso || ''));
  if (!m || !Number.isFinite(n)) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + n));
  return d.toISOString().slice(0, 10);
};

/**
 * @param {string} startDate  תאריך היציאה של הטיול, YYYY-MM-DD (יכול להיות ריק)
 * @param {number} startDay   היום בטיול שבו מגיעים לעצירה, מ-1
 * @param {number} days       כמה ימים בעצירה
 * @returns {{checkIn: string, checkOut: string} | null}
 *   null כשאין תאריך יציאה — קישור בלי תאריכים עדיף על תאריך מנוחש.
 */
export const stopStay = (startDate, startDay, days) => {
  if (!(startDay >= 1) || !(days >= 1)) return null;
  const checkIn = addDaysIso(startDate, startDay - 1);
  if (!checkIn) return null;
  return { checkIn, checkOut: addDaysIso(checkIn, days) };
};

const hotelName = (day) => String(day?.hotel?.name || '').trim().toLowerCase();

/**
 * טווח הימים של הלינה שיום נתון שייך לה, במסך התכנון.
 *
 * כשהטיול נשמר עם עצירות (טיול מתגלגל) — הטווח הוא העצירה, כמו בכפתור
 * החיפוש שם, כדי ששני המסכים לא יחלקו על אותו מלון. בלי עצירות, או כשסכום
 * ימיהן אינו תואם את המסלול (נערך אחרי השמירה) — רצף הימים הצמודים עם אותו
 * מלון. נמדד 15.09.2026 על ארבעת הטיולים השמורים: המלון מופיע בכל יום
 * ונחזר בכל ימי העצירה (Clift בימים 1–3 בסאן פרנסיסקו).
 *
 * @returns {{start: number, end: number} | null} אינדקסים כוללים
 */
export const hotelStayRange = (days = [], index, stops = []) => {
  const name = hotelName(days[index]);
  if (!name) return null;

  const total = (stops || []).reduce((s, x) => s + (Number(x?.days) || 0), 0);
  if (stops?.length && total === days.length) {
    let start = 0;
    for (const s of stops) {
      const n = Number(s.days) || 0;
      if (index < start + n) return { start, end: start + n - 1 };
      start += n;
    }
  }

  let start = index;
  let end = index;
  while (start > 0 && hotelName(days[start - 1]) === name) start--;
  while (end < days.length - 1 && hotelName(days[end + 1]) === name) end++;
  return { start, end };
};

/**
 * האם מלון כבר נמצא בתכנון הלינה. לפי שם ותאריך כניסה, לא לפי דגל שנשמר
 * בכפתור: הכפתור מופיע בכל יום של העצירה, והרשימה היא מקור האמת היחיד.
 */
export const isHotelPlanned = (accommodations = [], name, checkIn = '') => {
  const n = String(name || '').trim().toLowerCase();
  if (!n) return false;
  return (accommodations || []).some(
    (a) => String(a?.name || '').trim().toLowerCase() === n && String(a?.checkIn || '') === String(checkIn || '')
  );
};
