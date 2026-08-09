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

export const deleteTrip = async (uid, tripId) => {
  const tripRef = doc(db, 'users', uid, 'trips', String(tripId));
  await deleteDoc(tripRef);
  // סימון מחיקה. בלעדיו אין דרך להבחין בין טיול חדש שטרם סונכרן לבין
  // טיול שנמחק במכשיר אחר, ומכשיר שעדיין מחזיק עותק מקומי מעלה אותו
  // חזרה לענן — כך שהמחיקה מתבטלת מעצמה.
  await setDoc(doc(db, 'users', uid, 'deletedTrips', String(tripId)), {
    id: String(tripId),
    deletedAt: new Date().toISOString(),
  });
};

/** מזהי הטיולים שנמחקו, כדי שלא ישוחזרו ממטמון מקומי של מכשיר אחר. */
export const loadDeletedTripIds = async (uid) => {
  const snapshot = await getDocs(collection(db, 'users', uid, 'deletedTrips'));
  return new Set(snapshot.docs.map((d) => String(d.id)));
};

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
