import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { saveTrip as fsaveTrip, loadTrips as floadTrips, deleteTrip as fdeleteTrip } from '../services/firestoreService';

const TripSaveContext = createContext();

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
    if (!user) {
      // טעינת טיולים מ-localStorage כ-fallback כאשר לא מחובר
      const local = localStorage.getItem('savedTrips');
      if (local) {
        try { setSavedTrips(JSON.parse(local)); } catch {}
      }
      return;
    }

    floadTrips(user.uid)
      .then((trips) => {
        setSavedTrips(trips);
        localStorage.setItem('savedTrips', JSON.stringify(trips));
      })
      .catch((err) => {
        console.error('שגיאה בטעינת טיולים מ-Firestore:', err);
        // fallback ל-localStorage
        const local = localStorage.getItem('savedTrips');
        if (local) {
          try { setSavedTrips(JSON.parse(local)); } catch {}
        }
      });
  }, [user]);

  const saveCurrentTrip = (tripData) => {
    setCurrentTrip(tripData);
    localStorage.setItem('currentTrip', JSON.stringify(tripData));
  };

  const saveTripToList = async (tripData) => {
    const trip = {
      id: Date.now(),
      ...tripData,
      savedAt: new Date().toISOString()
    };
    const updated = [...savedTrips, trip];
    setSavedTrips(updated);
    localStorage.setItem('savedTrips', JSON.stringify(updated));

    if (user) {
      try {
        await fsaveTrip(user.uid, trip);
      } catch (err) {
        console.error('שגיאה בשמירה ל-Firestore:', err);
      }
    }

    alert('✅ הטיול נשמר בהצלחה!');
    return trip;
  };

  const deleteTrip = async (tripId) => {
    const updated = savedTrips.filter(t => t.id !== tripId);
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
