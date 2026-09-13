// services/accountService.js
//
// מחיקת חשבון. הפעולה ההרסנית היחידה באפליקציה שאין ממנה חזרה.
//
// ── סדר המחיקה אינו שרירותי ──
// קודם הנתונים ב-Firestore, ורק בסוף משתמש ה-Auth. הפוך מזה היה
// משאיר יתומים לנצח: אחרי `deleteUser` אין עוד `uid` מאומת, וכללי
// `firestore.rules` חוסמים כתיבה לתת-האוסף של משתמש שאינו מחובר.
//
// ── אימות מחדש לפני כל מחיקה, לא אחרי ──
// נבדק מקצה לקצה ב-13.09.2026 בחשבון בדיקה אמיתי. הניסיון הראשון
// (התחברות מלפני שעה) מחק את כל הנתונים, ואז `deleteUser` זרק
// `requires-recent-login`. הנתונים אבדו, החשבון נשאר, וההודעה אמרה
// "צריך להתחבר מחדש לפני מחיקה" — משתמש שמתחרט באותו רגע היה חושב
// שדבר לא נמחק. הסף של "התחברות טרייה" אינו מתועד ב-Firebase, ולכן
// אין בדיקת זמן מקדימה: האימות נעשה **תמיד**, ומצב ביניים לא נוצר.
import {
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider,
  GoogleAuthProvider,
} from 'firebase/auth';
import { collection, getDocs, getDoc, deleteDoc, doc, writeBatch, query, where, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '../firebase';

// תת-האוספים שמתחת ל-`users/{uid}`.
//
// ── הרשימה הקודמת נגזרה מקריאה, ופספסה חמישה ──
// נמדד 13.09.2026 בחשבון הבעלים: שבעה אוספים בענן, שלושה מהם מחוץ
// לרשימה (`deletedTrips`, `cancelledBookings`, `pushSubscriptions`).
// בקוד נמצאו עוד שניים: `deletedJournal`, ו-`flightAlerts` שהשרת
// (`api/check-flights.mjs`) כותב בעצמו. מחיקה "מוצלחת" הייתה משאירה
// מינויי התראות למכשיר של מי שמחק את חשבונו — והשרת עובר על
// `users` ב-`listDocuments`, שמחזיר גם מסמך שורש שנמחק ויש לו ילדים.
//
// הדפדפן אינו יכול למנות תת-אוספים (`listCollections` קיים רק ב-Admin
// SDK), ולכן זו רשימה מפורשת. `scripts/check-account-deletion.mjs`
// משווה אותה לכל נתיב שהקוד כותב, כדי שאוסף חדש לא יישכח שוב.
// `deletedBookings` אינו נכתב היום; נשאר בשביל נתונים מגרסאות קודמות.
const SUBCOLLECTIONS = [
  'trips', 'deletedTrips',
  'bookings', 'dismissedBookings', 'cancelledBookings', 'deletedBookings',
  'journal', 'deletedJournal',
  'pushSubscriptions', 'flightAlerts',
  // אינדקס החדרים הקבוצתיים; נקרא ב-`deleteSharedData` לפני שנמחק.
  'groupRooms',
];

// מפתחות מקומיים שנמחקים יחד עם החשבון. `appLanguage` נשאר בכוונה:
// אחרי המחיקה המשתמש עדיין קורא את המסך, ואיפוס השפה לעברית באמצע
// היה נראה כתקלה נוספת.
const LOCAL_KEYS = [
  'savedTrips', 'importedBookings', 'syncedBookings', 'accommodations',
  'journal_entries', 'userPreferences', 'currentTrip', 'favorites',
  'onboardingTour', 'onboardingMuted', 'groupTrip_lastRoom',
  // הרשימה הישנה של "שמור מסלול". אמורה להיעלם בהעברה, אבל העברה שנכשלה
  // משאירה אותה — ומחיקת חשבון לא יכולה להסתמך על כך שהצליחה.
  'tripLogs',
];

const deleteCollection = async (uid, name, tally) => {
  const snap = await getDocs(collection(db, 'users', uid, name));
  if (snap.empty) return;
  // batch ולא מחיקה-לכל-מסמך: פחות סיבובים, והכול-או-כלום לכל חבילה.
  // התקרה של Firestore היא 500 פעולות לחבילה.
  // המונה מתעדכן אחרי כל חבילה: חבילה שנייה שנכשלת אחרי שהראשונה
  // נמחקה לא תדווח "שום דבר לא נמחק".
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += 400) {
    const batch = writeBatch(db);
    const slice = docs.slice(i, i + 400);
    slice.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    tally.n += slice.length;
  }
};

// ── מה שהמשתמש השאיר מחוץ ל-users/{uid} ──
// קישורי שיתוף (`sharedTrips`) וחדרי הצבעה (`groupTrips`). עד 13.09.2026
// המחיקה לא נגעה בהם: עותק הטיול נשאר פתוח לכל מחזיק קישור, ושם המשתמש
// נשאר בחדרים. `list` הותר בחוקים רק בסינון לפי הבעלים.
const LAST_ROOM_KEY = 'groupTrip_lastRoom';

// `tally` ולא ערך מוחזר: כשל באמצע (אחרי שנמחקו שני שיתופים) היה זורק
// לפני ה-return, והקורא היה מדווח "שום דבר לא נמחק". המונה משותף.
const deleteSharedData = async (uid, tally) => {

  const shares = await getDocs(query(collection(db, 'sharedTrips'), where('ownerUid', '==', uid)));
  for (const d of shares.docs) { await deleteDoc(d.ref); tally.n += 1; }

  const created = await getDocs(query(collection(db, 'groupTrips'), where('createdBy', '==', uid)));
  const createdCodes = new Set(created.docs.map((d) => d.id));
  for (const d of created.docs) { await deleteDoc(d.ref); tally.n += 1; }

  // חדרים שהצטרף אליהם: מהאינדקס, ומהחדר האחרון שבמכשיר — שמכסה גם
  // חדר מלפני שהאינדקס נוסף.
  const joined = new Set();
  const index = await getDocs(collection(db, 'users', uid, 'groupRooms'));
  index.docs.forEach((d) => joined.add(d.id));
  try {
    const last = localStorage.getItem(LAST_ROOM_KEY);
    if (last) joined.add(String(last).toUpperCase());
  } catch { /* אחסון חסום */ }

  for (const code of joined) {
    if (createdCodes.has(code)) continue;
    const ref = doc(db, 'groupTrips', code);
    const snap = await getDoc(ref);
    if (!snap.exists() || !snap.data()?.votes?.[uid]) continue;
    await updateDoc(ref, { [`votes.${uid}`]: deleteField() });
    tally.n += 1;
  }
};

/**
 * באיזו דרך המשתמש התחבר בסשן הזה. `providerData` אינו התשובה: בחשבון
 * הבעלים מקושרים גם Google וגם סיסמה, והוא מתחבר ב-Google — בקשת
 * סיסמה שהוא אולי לא זוכר הייתה חוסמת אותו מלמחוק.
 *
 * @returns {Promise<'password'|'google.com'|string|null>}
 */
export const signInMethod = async (user) => {
  if (!user) return null;
  try {
    const { signInProvider } = await user.getIdTokenResult();
    return signInProvider || null;
  } catch {
    return null;
  }
};

const REAUTH_CANCELLED = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled'];
const WRONG_PASSWORD = ['auth/wrong-password', 'auth/invalid-credential', 'auth/invalid-login-credentials'];

/**
 * מוחק את כל נתוני המשתמש ואת חשבונו.
 *
 * @param {import('firebase/auth').User} user המשתמש המחובר
 * @param {{password?: string}} opts סיסמה, כשהסשן נפתח בסיסמה
 * @returns {Promise<{ok: true, removed: number} | {ok: false, reason: string, detail?: string, removed?: number}>}
 *   `reason`:
 *   - 'needs-password' / 'wrong-password' / 'reauth-cancelled' — **שום דבר לא נמחק**
 *   - 'failed' עם `removed: 0` — שום דבר לא נמחק
 *   - 'partial' — הנתונים (או חלקם) נמחקו והחשבון לא. חייב להיאמר במפורש.
 *   **אין זריקה**: הקורא גוזר את ההודעה מהתוצאה.
 */
export const deleteAccountAndData = async (user, { password } = {}) => {
  if (!user) return { ok: false, reason: 'failed', detail: 'no user', removed: 0 };

  // ── שלב 1: אימות. כשל כאן אינו נוגע בנתון אחד ──
  try {
    const method = await signInMethod(user);
    if (method === 'password') {
      if (!password) return { ok: false, reason: 'needs-password', removed: 0 };
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
    } else if (method === 'google.com') {
      await reauthenticateWithPopup(user, new GoogleAuthProvider());
    } else {
      // ספק שלא טופל כאן. עדיף לסרב מראש מאשר למחוק נתונים ולהיתקע
      // על `deleteUser` — בדיוק המצב שהשינוי הזה נועד למנוע.
      return { ok: false, reason: 'failed', detail: `unsupported provider: ${method}`, removed: 0 };
    }
  } catch (err) {
    const code = err?.code || '';
    if (WRONG_PASSWORD.includes(code)) return { ok: false, reason: 'wrong-password', removed: 0 };
    if (REAUTH_CANCELLED.includes(code)) return { ok: false, reason: 'reauth-cancelled', removed: 0 };
    return { ok: false, reason: 'failed', detail: String(err?.message || code || err), removed: 0 };
  }

  const tally = { n: 0 };
  let removed = 0;
  try {
    // לפני תת-האוספים: אינדקס החדרים נקרא כאן, ונמחק רק אחר כך.
    await deleteSharedData(user.uid, tally);
    for (const name of SUBCOLLECTIONS) {
      await deleteCollection(user.uid, name, tally);
    }
    // מסמך השורש עצמו, אם קיים
    try { await deleteDoc(doc(db, 'users', user.uid)); } catch { /* ייתכן שאינו קיים */ }
    removed = tally.n;
  } catch (err) {
    // אוספים נמחקים לפי הסדר, ולכן כשל באמצע משאיר חלק. `removed` אומר
    // כמה; אפס פירושו ששום דבר לא נמחק, וההודעה חייבת להבדיל.
    removed = tally.n;
    return {
      ok: false,
      reason: removed > 0 ? 'partial' : 'failed',
      detail: String(err?.message || err),
      removed,
    };
  }

  try {
    await deleteUser(user);
  } catch (err) {
    // שלב הנתונים הושלם — גם אם היו בו אפס מסמכים — והחשבון נשאר.
    // אחרי אימות מוצלח זה לא אמור לקרות; אם קרה, זה מצב חלקי ונאמר כך.
    return { ok: false, reason: 'partial', detail: String(err?.code || err?.message || err), removed };
  }

  for (const k of LOCAL_KEYS) {
    try { localStorage.removeItem(k); } catch { /* אחסון חסום */ }
  }
  return { ok: true, removed };
};

export { SUBCOLLECTIONS, LOCAL_KEYS };
