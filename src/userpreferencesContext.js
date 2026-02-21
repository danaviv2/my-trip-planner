// src/contexts/UserPreferencesContext.js
import React, { createContext, useState, useContext } from 'react';

// יצירת הקונטקסט
const UserPreferencesContext = createContext();

// הוק לשימוש בקונטקסט
export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences חייב להיות בתוך UserPreferencesProvider');
  }
  return context;
};

// ספק הקונטקסט
export const UserPreferencesProvider = ({ children }) => {
  const [userPreferences, setUserPreferences] = useState({
    location: 'בורדו, צרפת',
    themes: ['nature', 'winery', 'culinary', 'touristAttraction', 'museum', 'restaurant', 'hotel', 'cafe', 'hospital', 'pharmacy', 'amusementPark', 'beach', 'historicalSite', 'nationalPark', 'localMarket', 'festival', 'spa'],
    budget: 'medium',
    days: 7,
    startDate: new Date().toISOString().split('T')[0],
    advancedPreferences: {
      foodPreferences: '',
      travelPace: 'medium',
      travelStyle: 'mixed',
      hasChildren: false,
      specialNeeds: ''
    }
  });

  return (
    <UserPreferencesContext.Provider value={{ userPreferences, setUserPreferences }}>
      {children}
    </UserPreferencesContext.Provider>
  );
};