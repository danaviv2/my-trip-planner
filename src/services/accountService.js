// services/accountService.js
//
// מחיקת חשבון. הפעולה ההרסנית היחידה באפליקציה שאין ממנה חזרה.
//
// ── סדר המחיקה אינו שרירותי ──
// קודם הנתונים ב-Firestore, ורק בסוף משתמש ה-Auth. הפוך מזה היה
// משאיר יתומים לנצח: אחרי `deleteUser` אין עוד `uid` מאומת, וכללי
// `firestore.rules` חוסמים כתיבה לתת-האוסף של משתמש שאינו מחובר.
//
// ── למה זה לא נבדק מקצה לקצה ──
// אימות אמיתי דורש מחיקת חשבון אמיתי, ואין דרך לבטל. מה שכן נבדק:
// סדר הקריאות, הטיפול ב-requires-recent-login, וששום שלב אינו נבלע
// בשקט. **אל תכריז שזה "עובד" לפני שמישהו מחק חשבון בדיקה אמיתי.**
import { deleteUser } from 'firebase/auth';
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

// תת-האוספים שמתחת ל-`users/{uid}`. נגזר ממה שהקוד באמת כותב:
// firestoreService (trips, bookings, dismissedBookings, deletedBookings)
// ו-journalService (journal).
const SUBCOLLECTIONS = ['trips', 'bookings', 'dismissedBookings', 'deletedBookings', 'journal'];

// מפתחות מקומיים שנמחקים יחד עם החשבון. `appLanguage` נשאר בכוונה:
// אחרי המחיקה המשתמש עדיין קורא את המסך, ואיפוס השפה לעברית באמצע
// היה נראה כתקלה נוספת.
const LOCAL_KEYS = [
  'savedTrips', 'importedBookings', 'syncedBookings', 'accommodations',
  'journal_entries', 'userPreferences', 'currentTrip', 'favorites',
  'onboardingTour', 'onboardingMuted',
];

const deleteCollection = async (uid, name) => {
  const snap = await getDocs(collection(db, 'users', uid, name));
  if (snap.empty) return 0;
  // batch ולא מחיקה-לכל-מסמך: פחות סיבובים, והכול-או-כלום לכל חבילה.
  // התקרה של Firestore היא 500 פעולות לחבילה.
  const docs = snap.docs;
  let n = 0;
  for (let i = 0; i < docs.length; i += 400) {
    const batch = writeBatch(db);
    const slice = docs.slice(i, i + 400);
    slice.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    n += slice.length;
  }
  return n;
};

/**
 * מוחק את כל נתוני המשתמש ואת חשבונו.
 *
 * @param {import('firebase/auth').User} user המשתמש המחובר
 * @returns {Promise<{ok: true, removed: number} | {ok: false, reason: string, detail?: string, removed?: number}>}
 *          `reason` הוא 'recent-login' או 'failed'. **אין זריקה** — הקורא
 *          מציג הודעה, ומצב שבו חלק נמחק וחלק לא חייב להיאמר במפורש.
 */
export const deleteAccountAndData = async (user) => {
  if (!user) return { ok: false, reason: 'failed', detail: 'no user' };

  let removed = 0;
  try {
    for (const name of SUBCOLLECTIONS) {
      removed += await deleteCollection(user.uid, name);
    }
    // מסמך השורש עצמו, אם קיים
    try { await deleteDoc(doc(db, 'users', user.uid)); } catch { /* ייתכן שאינו קיים */ }
  } catch (err) {
    // הנתונים נמחקו חלקית והחשבון עדיין חי. זה מצב שחייב להיאמר,
    // ולא להיבלע — משתמש שיחשוב שנמחק הכול יופתע בהתחברות הבאה.
    return { ok: false, reason: 'failed', detail: String(err?.message || err), removed };
  }

  try {
    await deleteUser(user);
  } catch (err) {
    // Firebase דורש התחברות טרייה לפעולות רגישות. זו אינה תקלה אלא
    // דרישה, והניסוח למשתמש חייב להבדיל בין השתיים.
    if (err?.code === 'auth/requires-recent-login') {
      return { ok: false, reason: 'recent-login', removed };
    }
    return { ok: false, reason: 'failed', detail: String(err?.message || err), removed };
  }

  for (const k of LOCAL_KEYS) {
    try { localStorage.removeItem(k); } catch { /* אחסון חסום */ }
  }
  return { ok: true, removed };
};

export { SUBCOLLECTIONS, LOCAL_KEYS };
