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

import { doc, getDoc, setDoc, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
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
 * מאזין לשינויים בזמן אמת.
 *
 * ── זה מה שמחליף מנוע מיזוג ──
 * שני אנשים שעורכים ימים שונים לא מתנגשים ממילא, כי הכתיבה ממוקדת
 * לשדה. מי שעורך את אותו שדה — האחרון מנצח, וזה מקובל בקנה מידה של
 * שניים-שלושה מתכננים.
 *
 * המאזין הוא שהופך את זה לסביר: השותף רואה את השינוי שלך תוך שנייה,
 * ולכן שניכם כמעט אף פעם לא עורכים את אותו שדה בו-זמנית. **בלי
 * זמן אמת, "האחרון מנצח" הוא איבוד נתונים; איתו, זו שיחה.**
 *
 * @returns {function} ביטול ההאזנה. חובה לקרוא לו בפירוק הרכיב.
 */
export const watchShare = (code, onChange) => {
  if (!code) return () => {};
  return onSnapshot(tripRef(code), (snap) => {
    if (!snap.exists()) { onChange(null); return; }
    const data = snap.data();
    if (data.expiresAt && new Date(data.expiresAt) < new Date()) { onChange(null); return; }
    onChange(data);
  }, () => onChange(null));
};

/**
 * כתיבת עריכה.
 *
 * ── הטעות שהייתה כאן, ותוקנה תוך כדי בדיקה ──
 * הגרסה הראשונה כתבה נתיב מנוקד: `snapshot.dailyItinerary.0.activities.0.name`.
 * **Firestore אינו תומך באינדקס מערך בנתיב שדה** — הוא מפרש `0`
 * כמפתח במפה, ולכן המיר את המערך כולו למפה. המסך של הצופה קרס עם
 * `dailyItinerary.map is not a function`, והמסמך נהרס.
 *
 * זו הייתה גם טענה שגויה בתיעוד: נכתב שכתיבה ממוקדת מונעת התנגשות
 * בין שני עורכים בימים שונים. **היא אינה אפשרית על מערכים.**
 *
 * מה שנעשה במקום: קריאה, שינוי במקום, וכתיבה של `dailyItinerary`
 * כמערך שלם. המשמעות הכנה: **ההתנגשות היא ברמת המסלול ולא ברמת
 * השדה** — שניים שכותבים באותה שנייה, האחרון מנצח על כל המסלול.
 * זה עדיין סביר בזכות ההאזנה החיה, שמצמצמת את החלון לשנייה — אבל
 * זה לא מה שהובטח קודם, וההבדל נרשם כאן ולא מוסתר.
 */
export const editShared = async (code, dayIndex, actIndex, field, value) => {
  if (!code) throw new Error('INVALID_EDIT');
  const current = await getShare(code);
  if (!current) return null;

  const days = Array.isArray(current.snapshot?.dailyItinerary)
    ? current.snapshot.dailyItinerary
    : [];
  if (!days[dayIndex]) return null;

  const next = days.map((d, di) => {
    if (di !== dayIndex) return d;
    const acts = Array.isArray(d.activities) ? d.activities : [];
    if (actIndex == null) return { ...d, [field]: value };
    return {
      ...d,
      activities: acts.map((a, ai) => (ai === actIndex ? { ...a, [field]: value } : a)),
    };
  });

  await updateDoc(tripRef(code), {
    'snapshot.dailyItinerary': next,
    updatedAt: new Date().toISOString(),
  });
  return true;
};

/**
 * משנה את רמת ההרשאה של שיתוף קיים.
 *
 * הבעלים בלבד, לפי החוקים. השינוי מיידי: קישור שהיה פתוח להערות
 * ועבר ל-`view` מפסיק לקבל הערות ברגע זה — וזו הנקודה של הבורר.
 * ההערות שכבר נכתבו נשארות ומוצגות; מחיקתן היא פעולה אחרת שהמשתמש
 * לא ביקש, ולמחוק דעות של אנשים בלי שביקשו זה לא "צמצום הרשאה".
 */
export const setShareMode = async (code, mode) => {
  if (!['view', 'comment', 'edit'].includes(mode)) throw new Error('INVALID_MODE');
  const existing = await getShare(code);
  if (!existing) return null;
  const updated = { ...existing, mode, updatedAt: new Date().toISOString() };
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

export default { createShare, getShare, watchShare, editShared, refreshShare, revokeShare, addComment, setShareMode, snapshotOf, expiryFor };
