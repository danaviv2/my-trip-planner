import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

// מבנה: users/{uid}/trips/{tripId}

export const saveTrip = async (uid, trip) => {
  const tripRef = doc(db, 'users', uid, 'trips', String(trip.id));
  await setDoc(tripRef, trip);
};

export const loadTrips = async (uid) => {
  const snapshot = await getDocs(collection(db, 'users', uid, 'trips'));
  return snapshot.docs.map((d) => d.data());
};

/**
 * סימון מחיקה.
 *
 * כל מסך שממזג ענן ומטמון מקומי מתייחס לרשומה שקיימת רק מקומית כרשומה
 * חדשה שטרם סונכרנה — וזה נראה זהה לרשומה שנמחקה במכשיר אחר. בלי סימון
 * אי אפשר להבחין ביניהן, והמחיקה מתבטלת מעצמה בכניסה הבאה.
 *
 * @param {string} kind שם אוסף הסימונים, למשל 'deletedTrips'
 */
export const markDeleted = async (uid, kind, id) => {
  await setDoc(doc(db, 'users', uid, kind, String(id)), {
    id: String(id),
    deletedAt: new Date().toISOString(),
  });
};

/** מזהי הרשומות שנמחקו, כדי שלא ישוחזרו ממטמון מקומי של מכשיר אחר. */
export const loadDeletedIds = async (uid, kind) => {
  const snapshot = await getDocs(collection(db, 'users', uid, kind));
  return new Set(snapshot.docs.map((d) => String(d.id)));
};

export const deleteTrip = async (uid, tripId) => {
  await deleteDoc(doc(db, 'users', uid, 'trips', String(tripId)));
  await markDeleted(uid, 'deletedTrips', tripId);
};

export const loadDeletedTripIds = (uid) => loadDeletedIds(uid, 'deletedTrips');

// מבנה: users/{uid}/bookings/{bookingId}

export const saveBooking = async (uid, booking) => {
  const ref = doc(db, 'users', uid, 'bookings', String(booking.id));
  await setDoc(ref, booking);
};

export const loadBookings = async (uid) => {
  const snapshot = await getDocs(collection(db, 'users', uid, 'bookings'));
  return snapshot.docs.map((d) => d.data());
};

export const deleteBooking = async (uid, bookingId) => {
  const ref = doc(db, 'users', uid, 'bookings', String(bookingId));
  await deleteDoc(ref);
};

/**
 * סימון קבוע שהזמנה בוטלה, לפי מספר האישור.
 *
 * מחיקת הרשומה בלבד אינה מספיקה: מייל האישור המקורי נשאר בתיבה, וכל
 * סריקה עתידית מייבאת אותו מחדש. הביטול נמחק אפוא בכל סריקה, וההזמנה
 * שבוטלה חזרה למסלול — נצפה בפועל.
 */
export const markCancelledRef = (uid, ref) =>
  // אותה נורמליזציה כמו בהשוואת ההזמנות, אחרת "369 129 732" יישמר בצורה
  // אחת ויושווה בצורה אחרת, והסימון יאבד. הלוכסן אסור במזהה מסמך.
  markDeleted(
    uid,
    'cancelledBookings',
    String(ref || '').trim().toLowerCase().replace(/\s+/g, '').replace(/\//g, '-')
  );

export const loadCancelledRefs = (uid) => loadDeletedIds(uid, 'cancelledBookings');

/**
 * שמירת "צל" של הזמנה שנמחקה ידנית.
 *
 * מחיקת הרשומה בלבד אינה מספיקה מאותה סיבה שהביטול לא שרד: מייל האישור
 * נשאר בתיבה וכל סריקה מייבאת אותו מחדש. כאן נשמר תוכן הרשומה עצמו ולא
 * מספר אישור, כי להזמנות רבות אין מספר — ופוליסת ביטוח היא הדוגמה.
 */
export const saveDismissed = async (uid, booking) => {
  await setDoc(doc(db, 'users', uid, 'dismissedBookings', String(booking.id)), {
    ...booking,
    dismissedAt: new Date().toISOString(),
  });
};

/**
 * מוחק אוסף שלם תחת המשתמש.
 *
 * דרוש לאיפוס אמיתי: מחיקת ההזמנות בלבד משאירה את סימוני המחיקה
 * והביטול, ולכן סריקה חוזרת מדלגת דווקא על מה שנמחק — ומתקבלת תמונה
 * חלקית שנראית ככשל בסריקה.
 */
/**
 * שמירת הרשמה להתראות דחיפה.
 *
 * מזהה המסמך נגזר מכתובת ה-endpoint, שהיא ייחודית למכשיר. כך אותו מכשיר
 * אינו נשמר פעמיים, וכמה מכשירים של אותו משתמש מקבלים התראה כל אחד.
 *
 * הכתיבה נעשית מהדפדפן ולא מהשרת, כי כאן יש התחברות. השרת רק קורא.
 */
export const savePushSubscription = async (uid, subscription) => {
  const id = btoa(String(subscription?.endpoint || '')).replace(/[^A-Za-z0-9]/g, '').slice(-60);
  if (!id) return;
  await setDoc(doc(db, 'users', uid, 'pushSubscriptions', id), {
    ...subscription,
    updatedAt: new Date().toISOString(),
    // שפת ההתראה נשמרת עם ההרשמה: השרת אינו יודע מי המשתמש
    lang: 'he',
  });
};

export const deletePushSubscription = async (uid, subscription) => {
  const id = btoa(String(subscription?.endpoint || '')).replace(/[^A-Za-z0-9]/g, '').slice(-60);
  if (!id) return;
  await deleteDoc(doc(db, 'users', uid, 'pushSubscriptions', id)).catch(() => {});
};

export const clearCollection = async (uid, name) => {
  const snapshot = await getDocs(collection(db, 'users', uid, name));
  await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
  return snapshot.size;
};

export const loadDismissed = async (uid) => {
  const snapshot = await getDocs(collection(db, 'users', uid, 'dismissedBookings'));
  return snapshot.docs.map((d) => d.data());
};
