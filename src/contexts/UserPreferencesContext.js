import React, { createContext, useState, useContext, useEffect } from 'react';

// יצירת קונטקסט
const UserPreferencesContext = createContext();

// הוק שימושי לגישה לקונטקסט
export const useUserPreferences = () => useContext(UserPreferencesContext);

// ספק הקונטקסט
export const UserPreferencesProvider = ({ children }) => {
  // מצב העדפות המשתמש
  const [userPreferences, setUserPreferences] = useState({
    language: 'he',
    currency: 'ILS',
    darkMode: false,
    interests: [],
    travelStyle: 'balanced',
    budgetLevel: 'medium',
    accessibility: false,
    notificationsEnabled: true,
    mapPreference: 'google',
    unitSystem: 'metric'
  });
  
  const [isLoading, setIsLoading] = useState(true);

  // טעינת העדפות מאחסון מקומי בטעינה ראשונית
  useEffect(() => {
    const loadPreferences = () => {
      try {
        const savedPreferences = localStorage.getItem('userPreferences');
        
        if (savedPreferences) {
          setUserPreferences(JSON.parse(savedPreferences));
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('שגיאה בטעינת העדפות:', error);
        setIsLoading(false);
      }
    };
    
    loadPreferences();
  }, []);

  // שמירת העדפות באחסון מקומי כאשר הן משתנות
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('userPreferences', JSON.stringify(userPreferences));
    }
  }, [userPreferences, isLoading]);

  // פונקציה לעדכון העדפות המשתמש
  const updatePreferences = (newPreferences) => {
    setUserPreferences(prev => ({
      ...prev,
      ...newPreferences
    }));
  };

  // פונקציה לעדכון העדפה בודדת
  const updateSinglePreference = (key, value) => {
    setUserPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // פונקציה להוספת תחום עניין
  const addInterest = (interest) => {
    if (!userPreferences.interests.includes(interest)) {
      setUserPreferences(prev => ({
        ...prev,
        interests: [...prev.interests, interest]
      }));
    }
  };

  // פונקציה להסרת תחום עניין
  const removeInterest = (interest) => {
    setUserPreferences(prev => ({
      ...prev,
      interests: prev.interests.filter(item => item !== interest)
    }));
  };

  // פונקציה להחלפת מצב תצוגה (בהיר/כהה)
  const toggleDarkMode = () => {
    setUserPreferences(prev => ({
      ...prev,
      darkMode: !prev.darkMode
    }));
  };

  // פונקציה לאיפוס כל ההעדפות
  const resetPreferences = () => {
    const defaultPreferences = {
      language: 'he',
      currency: 'ILS',
      darkMode: false,
      interests: [],
      travelStyle: 'balanced',
      budgetLevel: 'medium',
      accessibility: false,
      notificationsEnabled: true,
      mapPreference: 'google',
      unitSystem: 'metric'
    };
    
    setUserPreferences(defaultPreferences);
  };

  // ערך הקונטקסט המוחזר
  const contextValue = {
    userPreferences,
    isLoading,
    updatePreferences,
    updateSinglePreference,
    addInterest,
    removeInterest,
    toggleDarkMode,
    resetPreferences
  };

  return (
    <UserPreferencesContext.Provider value={contextValue}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

export default UserPreferencesProvider;