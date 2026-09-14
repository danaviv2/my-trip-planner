import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  saveTrip as fsaveTrip,
  loadTrips as floadTrips,
  deleteTrip as fdeleteTrip,
  loadDeletedTripIds as floadDeletedTripIds,
} from '../services/firestoreService';
import { migrateTripLogs } from '../services/tripLogMigrationService';

const TripSaveContext = createContext();

/**
 * רשימת הטיולים כפי שהיא נקראת מהאחסון — מסוננת לרשומות שהן אובייקט.
 *
 * ── למה במקום הזה ──
 * נמדד 14.09.2026: `savedTrips = [null]` ב-localStorage הפיל את **כל
 * האתר**, לא רק את הסטטיסטיקה — `TripChatWidget` מוצג בכל עמוד וקרא
 * `trip.name` מכל רשומה, וה-ErrorBoundary החליף את האפליקציה כולה במסך
 * שגיאה. הרשימה נקראת כאן מארבעה מקומות (localStorage, Firestore, מיזוג,
 * כשל רשת) ונחשפת לכל המסכים; סינון אצל כל צרכן היה נשכח אצל הבא בתור.
 * `JSON.parse` מחזיר גם אובייקט או מחרוזת, ולכן גם הם הופכים לרשימה ריקה.
 */
export const cleanTrips = (value) =>
  (Array.isArray(value) ? value : []).filter((t) => t && typeof t === 'object' && !Array.isArray(t));

const readLocalTrips = () => {
  try { return cleanTrips(JSON.parse(localStorage.getItem('savedTrips') || '[]')); } catch { return []; }
};

export const TripSaveProvider = ({ children }) => {
  const [currentTrip, setCurrentTrip] = useState(null);
  const [savedTrips, setSavedTrips] = useState([]);
  const { user } = useAuth();

  // טעינת טיול נוכחי מ-localStorage
  useEffect(() => {
    const saved = localStorage.getItem('currentTrip');
    if (saved) {
      try {
        setCurrentTrip(JSON.parse(saved));
      } catch (error) {
        console.error('שגיאה בטעינת טיול:', error);
      }
    }
  }, []);

  // כאשר משתמש מתחבר — טען טיולים מ-Firestore
  useEffect(() => {
    // ── קודם ההעברה, אחר כך הקריאה ──
    // הרשומות הישנות של "שמור מסלול" נכנסות ל-`savedTrips` המקומי לפני
    // שהוא נקרא. משם הזרימה הקיימת עושה את השאר: אורח רואה אותן, ומשתמש
    // מחובר מעלה אותן לענן כ"טיולים שטרם סונכרנו" (`onlyLocal` למטה).
    const migration = migrateTripLogs();
    if (!migration.ok) console.error('העברת tripLogs נכשלה — הרשומות נשארו במקומן');
    if (!user) {
      // טעינת טיולים מ-localStorage כ-fallback כאשר לא מחובר
      setSavedTrips(readLocalTrips());
      return;
    }

    Promise.all([floadTrips(user.uid), floadDeletedTripIds(user.uid).catch(() => new Set())])
      .then(([loadedTrips, deletedIds]) => {
        let firestoreTrips = loadedTrips;
        // מיזוג: שמור טיולים מ-localStorage שאינם ב-Firestore (למקרה שהשמירה ל-Firestore נכשלה)
        const localTrips = readLocalTrips();
        firestoreTrips = cleanTrips(firestoreTrips);
        const firestoreIds = new Set(firestoreTrips.map(t => String(t.id)));

        // טיול שנמחק במכשיר אחר עדיין קיים במטמון המקומי כאן. בלי הסינון
        // הזה הוא ייחשב "טיול שטרם סונכרן", יעלה חזרה לענן, והמחיקה
        // תתבטל בכל המכשירים.
        const onlyLocal = localTrips.filter(
          t => !firestoreIds.has(String(t.id)) && !deletedIds.has(String(t.id))
        );
        const merged = [...firestoreTrips, ...onlyLocal];
        setSavedTrips(merged);
        localStorage.setItem('savedTrips', JSON.stringify(merged));
        // סנכרן לחזרה טיולים שהיו רק ב-localStorage
        onlyLocal.forEach(t => fsaveTrip(user.uid, t).catch(() => {}));
      })
      .catch((err) => {
        console.error('שגיאה בטעינת טיולים מ-Firestore:', err);
        // fallback ל-localStorage — אל תמחק נתונים קיימים
        setSavedTrips(readLocalTrips());
      });
  }, [user]);

  const saveCurrentTrip = (tripData) => {
    setCurrentTrip(tripData);
    localStorage.setItem('currentTrip', JSON.stringify(tripData));
  };

  const saveTripToList = async (tripData, existingId = null) => {
    if (existingId) {
      // עדכון טיול קיים
      const updated = savedTrips.map(t =>
        String(t.id) === String(existingId)
          ? { ...t, ...tripData, savedAt: new Date().toISOString() }
          : t
      );
      setSavedTrips(updated);
      localStorage.setItem('savedTrips', JSON.stringify(updated));
      const updatedTrip = updated.find(t => String(t.id) === String(existingId));
      if (user && updatedTrip) {
        fsaveTrip(user.uid, updatedTrip).catch(() => {});
      }
      return updatedTrip;
    }

    const trip = {
      id: Date.now(),
      ...tripData,
      savedAt: new Date().toISOString()
    };
    const updated = [...savedTrips, trip];
    setSavedTrips(updated);
    localStorage.setItem('savedTrips', JSON.stringify(updated));

    // Firestore sync runs in background — don't block the caller
    if (user) {
      fsaveTrip(user.uid, trip).catch(err =>
        console.error('שגיאה בשמירה ל-Firestore:', err)
      );
    }

    return trip;
  };

  const deleteTrip = async (tripId) => {
    // השוואה כמחרוזות, כמו בכל שאר ההשוואות בקובץ. מזהים מגיעים גם
    // מפרמטר ב-URL, שם הם תמיד מחרוזות, והשוואה קפדנית הייתה משאירה
    // את הטיול על המסך בעוד הוא נמחק מהענן.
    const updated = savedTrips.filter(t => String(t.id) !== String(tripId));
    setSavedTrips(updated);
    localStorage.setItem('savedTrips', JSON.stringify(updated));

    if (user) {
      try {
        await fdeleteTrip(user.uid, tripId);
      } catch (err) {
        console.error('שגיאה במחיקה מ-Firestore:', err);
      }
    }
  };

  const clearCurrentTrip = () => {
    setCurrentTrip(null);
    localStorage.removeItem('currentTrip');
  };

  return (
    <TripSaveContext.Provider value={{
      currentTrip,
      savedTrips,
      saveCurrentTrip,
      saveTripToList,
      deleteTrip,
      clearCurrentTrip
    }}>
      {children}
    </TripSaveContext.Provider>
  );
};

export const useTripSave = () => {
  const context = useContext(TripSaveContext);
  if (!context) {
    throw new Error('useTripSave must be used within TripSaveProvider');
  }
  return context;
};
