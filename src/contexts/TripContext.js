import React, { createContext, useContext, useState } from 'react';

const TripContext = createContext();

export const TripProvider = ({ children }) => {
  const [tripData, setTripData] = useState({
    destinations: [],
    accommodations: [],
    flights: [],
    activities: [],
  });

  const [startPoint, setStartPoint] = useState('Tel Aviv');
  const [tripPlan, setTripPlan] = useState(null);

  const planTripWithAI = async (preferences) => {
    if (preferences) console.log('Planning trip with:', preferences);
    return { success: true };
  };

  const updateTripPlan = (plan) => setTripPlan(plan);

  const saveTrip = (planData) => {
    try {
      const saved = JSON.parse(localStorage.getItem('savedTrips') || '[]');
      saved.push({ ...planData, savedAt: new Date().toISOString() });
      localStorage.setItem('savedTrips', JSON.stringify(saved));
      return { success: true };
    } catch (e) {
      console.error('שגיאה בשמירת טיול:', e);
      return { success: false };
    }
  };

  const value = {
    tripData,
    setTripData,
    startPoint,
    setStartPoint,
    planTripWithAI,
    accommodations: tripData.accommodations || [],
    tripPlan,
    updateTripPlan,
    saveTrip,
  };

  return (
    <TripContext.Provider value={value}>
      {children}
    </TripContext.Provider>
  );
};

export const useTripContext = () => {
  const context = useContext(TripContext);
  if (!context) {
    console.warn('useTripContext must be used within TripProvider');
    return {
      tripData: { destinations: [], accommodations: [], flights: [], activities: [] },
      setTripData: () => {},
      startPoint: 'Tel Aviv',
      setStartPoint: () => {},
      planTripWithAI: async () => {},
      accommodations: [],
    };
  }
  return context;
};

export default TripContext;