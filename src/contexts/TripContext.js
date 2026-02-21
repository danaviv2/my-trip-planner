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

  const planTripWithAI = async (preferences) => {
    console.log('Planning trip with:', preferences);
    return { success: true };
  };

  const value = {
    tripData,
    setTripData,
    startPoint,
    setStartPoint,
    planTripWithAI,
    accommodations: tripData.accommodations || [],
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