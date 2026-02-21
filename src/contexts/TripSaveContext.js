import React, { createContext, useContext, useState, useEffect } from 'react';

const TripSaveContext = createContext();

export const TripSaveProvider = ({ children }) => {
  const [currentTrip, setCurrentTrip] = useState(null);
  const [savedTrips, setSavedTrips] = useState([]);

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

  const saveCurrentTrip = (tripData) => {
    setCurrentTrip(tripData);
    localStorage.setItem('currentTrip', JSON.stringify(tripData));
    console.log('✅ טיול נשמר:', tripData);
  };

  const saveTripToList = (tripData) => {
    const trip = {
      id: Date.now(),
      ...tripData,
      savedAt: new Date().toISOString()
    };
    const updated = [...savedTrips, trip];
    setSavedTrips(updated);
    localStorage.setItem('savedTrips', JSON.stringify(updated));
    alert('✅ הטיול נשמר בהצלחה!');
    return trip;
  };

  const deleteTrip = (tripId) => {
    const updated = savedTrips.filter(t => t.id !== tripId);
    setSavedTrips(updated);
    localStorage.setItem('savedTrips', JSON.stringify(updated));
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
