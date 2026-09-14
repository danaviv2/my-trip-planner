// services/staleSourceService.js
//
// רשומות שהמסמך שלהן נקרא מחדש — והפענוח הנוכחי כבר לא מפיק מהן הזמנה.
//
// ── הבעיה ──
// הפענוח משתפר: כלל חדש דוחה שובר טרקלין, פוליסה שאינה נסיעה. אבל כלל חדש
// רק מונע רשומה חדשה; את זו שנקלטה לפניו אין מי שמסיר. נמדד 14.09.2026
// ב-Firestore של הבעלים: "LoungeKey participating lounges" (07-19) ו-"PassportCard
// Policy.pdf" עדיין שמורות, אף שהסריקה מאותו בוקר דחתה את שני המסמכים
// (STATUS סעיף 14). הטרקלין לבדו מתח את לוח הימים ב-13 ימים ריקים.
//
// ── למה סימון ולא מחיקה ──
// "הפענוח לא מצא הזמנה" אינו ודאות: המודל אינו דטרמיניסטי, ואישור אמיתי
// שנקרא פעם אחת לא נכון היה נמחק בשקט — כשל שמוצג כהצלחה (דפוס 3). לכן
// הרשומה מסומנת, והמשתמש מכריע: להסיר (עם סימון מחיקה הרגיל) או להשאיר.
// "השאר" נזכר, והסריקה הבאה לא תשאל שוב על אותה רשומה.

/** מקורות שאינם מייל — אין "מסמך שנקרא מחדש" שיכול לבטל אותם. */
const NOT_FROM_MAIL = new Set(['paste', 'upload', 'manual']);

/**
 * @param {Array} bookings הרשומות השמורות
 * @param {Array<{messageId?: string, subject?: string}>} retracted מיילים שנקראו בלי שגיאה ולא הניבו הזמנה
 * @returns {string[]} מזהי רשומות לסימון
 */
export const matchRetracted = (bookings = [], retracted = []) => {
  if (!retracted.length) return [];
  const ids = new Set(retracted.map((r) => r.messageId).filter(Boolean));
  const subjects = new Set(retracted.map((r) => r.subject).filter(Boolean));

  return bookings
    .filter((b) => b && !b.keepDespiteRetraction && !b.retracted && !NOT_FROM_MAIL.has(b.sourceKind))
    .filter((b) => {
      // מזהה המייל הוא הזהות. כשהוא קיים — רק הוא קובע: אל-על שולחת שני
      // מיילים שונים באותה שורת נושא ("check-in for your flight to Naples"),
      // והתאמה לפי נושא הייתה מסמנת טיסה תקינה בגלל אחותה.
      if (b.sourceMessageId) return ids.has(b.sourceMessageId);
      // רשומות מלפני שמזהה המייל נשמר (הטרקלין, 19.08) — הנושא הוא האחיזה היחידה.
      return !!b.sourceSubject && subjects.has(b.sourceSubject);
    })
    .map((b) => String(b.id));
};
