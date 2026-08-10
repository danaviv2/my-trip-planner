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
