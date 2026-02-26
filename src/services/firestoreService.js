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
};
