/**
 * שיתוף טיול — תמונת מצב שאפשר להצביע עליה.
 *
 * ── הבעיה שזה פותר ──
 * עד 04.09.2026 "שתף טיול" בנה `/trip-planner?destination=Rome` — כלומר
 * **שם העיר בלבד**. מי שקיבל מסלול מתוכנן לשבוע ברומא פתח מתכנן ריק.
 * הסיבה לא הייתה עצלות: הטיולים יושבים תחת `users/{uid}` עם הרשאה
 * לבעלים בלבד, ולכן **לא היה למה להפנות**. זה האוסף שאפשר להפנות אליו.
 *
 * ── תמונת מצב ולא מראה חיה ──
 * הטיול מועתק ברגע השיתוף ואינו משתקף. קישור חי נשמע עדיף עד שחושבים
 * עליו: שינוי שנעשה בשלוש לפנות בוקר היה משנה למקבל את המסלול בלי
 * שנאמרה מילה. תמונת מצב אומרת "זה מה ששיתפתי", ויש כפתור מפורש
 * לעדכון. הבעלות על הרגע נשארת אצל המשתף.
 *
 * ── רשימת היתר ולא העתקה ──
 * נמדד ב-04.09.2026 על 25 טיולים שמורים (758KB): אפס מספרי אסמכתה,
 * אפס שמות נוסעים, אפס מספרי טיסה, אפס `messageId`. טיול שמור הוא
 * מסלול AI, וההזמנות שיובאו מהמייל יושבות במאגר נפרד.
 *
 * כלומר הרשימה אינה מגנה מפני סכנה קיימת — **היא ביטוח לעתיד.** ביום
 * שבו טיול יתחיל להתמזג עם הזמנות אמיתיות, שדה חדש לא ידלוף מעצמו,
 * כי הוא לא יהיה כאן. `budget` הושאר בחוץ בכוונה: הוא אינו מזהה אדם
 * אך כן מגלה כמה הוא מתכנן להוציא.
 */

import { doc, getDoc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { generateRoomCode } from './groupTripService';

const COLLECTION = 'sharedTrips';

/**
 * השדות היחידים שיוצאים החוצה. כל השאר נשאר אצל הבעלים.
 * הרשימה מפורשת ולא "הכול חוץ מ-", כי שדה חדש שנוסף לטיול צריך
 * החלטה אקטיבית כדי להישלח — ולא להישלח מעצמו.
 */
const SHARED_FIELDS = ['destination', 'days', 'startDate', 'dailyItinerary', 'stops', 'rollingTrip'];

/** 30 יום אחרי שהטיול נגמר — ולא 30 יום מהשיתוף. */
const GRACE_DAYS = 30;
/** לטיול בלי תאריך אין "סוף", ולכן נדרשת תקרה. */
const NO_DATE_DAYS = 365;

const tripRef = (code) => doc(db, COLLECTION, String(code).toUpperCase());

/**
 * מתי הקישור פג.
 *
 * מספר קבוע היה שגוי בשני הכיוונים: 30 יום קוטע טיול שמתוכנן לשנה
 * הבאה, ו-60 יום משאיר קישור של סוף שבוע פתוח לחודשיים. התפוגה נגזרת
 * מהטיול עצמו — סוף הטיול ועוד חודש.
 */
export const expiryFor = (trip = {}, now = new Date()) => {
  const start = trip.startDate ? new Date(trip.startDate) : null;
  const days = Number(trip.days) > 0 ? Number(trip.days) : 0;

  if (!start || Number.isNaN(start.getTime())) {
    return new Date(now.getTime() + NO_DATE_DAYS * 86400000);
  }
  const end = new Date(start.getTime() + days * 86400000);
  // טיול שכבר חלף עדיין מקבל חלון: משתפים גם כדי לספר איפה היית.
  const base = end > now ? end : now;
  return new Date(base.getTime() + GRACE_DAYS * 86400000);
};

/** תמונת המצב — רק מה שברשימה, ורק אם יש בו ערך. */
export const snapshotOf = (trip = {}) => {
  const out = {};
  for (const key of SHARED_FIELDS) {
    if (trip[key] !== undefined && trip[key] !== null) out[key] = trip[key];
  }
  return out;
};

/**
 * יוצר שיתוף חדש ומחזיר את המסמך.
 *
 * @param {object} trip הטיול השמור
 * @param {string} uid  מזהה הבעלים
 * @param {'view'|'comment'} mode ברירת המחדל היא `comment`.
 *
 * ── למה ברירת המחדל פתוחה להערות ──
 * שיתוף שנוצר תמיד כ-`view` היה הופך את כל מנגנון ההערות לקוד מת:
 * אי אפשר היה להגיע אליו משום מסך. בורר ההרשאות (שלב 3) יאפשר
 * **לצמצם** ל-`view`, ולא להרחיב — הכיוון הנכון, כי התרחיש שביקש
 * המשתמש היה קבלת פידבק.
 */
export const createShare = async (trip, uid, mode = 'comment') => {
  const snapshot = snapshotOf(trip);
  // טיול בלי מסלול אינו שווה שיתוף, והקישור היה מוביל למסך ריק —
  // בדיוק התקלה שהאוסף הזה נועד לתקן.
  if (!snapshot.dailyItinerary?.length && !snapshot.stops?.length) {
    throw new Error('EMPTY_TRIP');
  }

  const code = generateRoomCode();
  const now = new Date();
  const shared = {
    code,
    ownerUid: uid,
    mode,
    createdAt: now.toISOString(),
    expiresAt: expiryFor(trip, now).toISOString(),
    snapshot,
    // נוצר ריק מראש ולא בהוספה הראשונה: חוק האבטחה משווה מול
    // `resource.data.comments`, ושדה שאינו קיים היה מפיל את ההשוואה
    // ומונע את ההערה הראשונה — תקלה שהייתה נראית כבאג הרשאות.
    comments: {},
  };

  await setDoc(tripRef(code), shared);
  return shared;
};

/**
 * שולף שיתוף לפי קוד.
 * @returns {Promise<object|null>} null כשאינו קיים או שפג תוקפו
 */
export const getShare = async (code) => {
  if (!code) return null;
  const snap = await getDoc(tripRef(code));
  if (!snap.exists()) return null;

  const data = snap.data();
  // התפוגה נאכפת גם כאן ולא רק בחוקים: החוקים מונעים כתיבה, והבדיקה
  // הזו מונעת הצגה של תוכן שפג. שתיהן נחוצות.
  if (data.expiresAt && new Date(data.expiresAt) < new Date()) return null;
  return data;
};

/** מעדכן שיתוף קיים לתמונת המצב הנוכחית — הכפתור "עדכן את השיתוף". */
export const refreshShare = async (code, trip) => {
  const existing = await getShare(code);
  if (!existing) return null;
  const updated = {
    ...existing,
    snapshot: snapshotOf(trip),
    expiresAt: expiryFor(trip).toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(tripRef(code), updated);
  return updated;
};

/**
 * מוסיף או מעדכן את ההערה של הכותב.
 *
 * ── מדוע הערה אחת לכל אדם ──
 * ההערות ממופתחות לפי מזהה הכותב, וזה מה שמאפשר לחוק לאכוף "כל אחד
 * נוגע רק בשלו". המחיר: אדם מחזיק הערה אחת, והוספה חוזרת מחליפה
 * אותה. זה גם היתרון — אין שרשור בלי סוף, ומי שהעיר יכול לתקן.
 *
 * `updateDoc` ולא `setDoc`: כתיבה מלאה הייתה נוגעת בכל השדות, והחוק
 * דורש ששדה ההערות יהיה היחיד שמשתנה.
 */
export const addComment = async (code, uid, name, text) => {
  const body = String(text || '').trim();
  if (!code || !uid || !body) throw new Error('INVALID_COMMENT');
  await updateDoc(tripRef(code), {
    [`comments.${uid}`]: {
      name: String(name || 'אורח').slice(0, 40),
      text: body.slice(0, 1000),
      at: new Date().toISOString(),
    },
  });
  return true;
};

/** ביטול מיידי. תפוגה שאי אפשר לעצור היא הפתעה, לא הגנה. */
export const revokeShare = async (code) => {
  if (!code) return false;
  await deleteDoc(tripRef(code));
  return true;
};

export default { createShare, getShare, refreshShare, revokeShare, addComment, snapshotOf, expiryFor };
