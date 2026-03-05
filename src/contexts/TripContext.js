import React, { createContext, useContext, useState } from 'react';
import { generateItinerary } from '../services/aiItineraryService';

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
  const [tripLoading, setTripLoading] = useState(false);
  const [tripError, setTripError] = useState(null);

  // היום הנבחר בתצוגת הלשוניות — TripPlanner מעדכן, TripPlannerPage קורא
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const planTripWithAI = async ({ destination, days = 3, interests = [], budget = 'medium', advancedPreferences = {} } = {}) => {
    if (!destination) return { success: false, error: 'NO_DESTINATION' };

    setTripLoading(true);
    setTripError(null);

    try {
      const dailyItinerary = await generateItinerary({ destination, days, interests, budget, advancedPreferences });
      setTripPlan({ destination, dailyItinerary });
      setSelectedDayIndex(0);
      return { success: true };
    } catch (err) {
      const msg = err.message === 'RATE_LIMIT'
        ? 'יותר מדי בקשות — נסה שוב בעוד דקה'
        : err.message === 'NO_API_KEY'
        ? 'מפתח API חסר'
        : 'שגיאה ביצירת המסלול';
      setTripError(msg);
      return { success: false, error: msg };
    } finally {
      setTripLoading(false);
    }
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
    tripLoading,
    tripError,
    accommodations: tripData.accommodations || [],
    tripPlan,
    updateTripPlan,
    saveTrip,
    selectedDayIndex,
    setSelectedDayIndex,
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
      tripLoading: false,
      tripError: null,
      accommodations: [],
      tripPlan: null,
      updateTripPlan: () => {},
      saveTrip: () => {},
      selectedDayIndex: 0,
      setSelectedDayIndex: () => {},
    };
  }
  return context;
};

export default TripContext;
