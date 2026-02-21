import React, { createContext, useState, useContext } from 'react';

// Create context
const DestinationContext = createContext();

// Provider component
export const DestinationProvider = ({ children }) => {
  const [currentDestination, setCurrentDestination] = useState(null);
  const [recentDestinations, setRecentDestinations] = useState([]);
  const [favoriteDestinations, setFavoriteDestinations] = useState([]);

  // Add a destination to recent list
  const addToRecent = (destination) => {
    // Prevent duplicates
    const filtered = recentDestinations.filter(dest => dest.id !== destination.id);
    // Add to beginning of array and limit to 5 items
    setRecentDestinations([destination, ...filtered].slice(0, 5));
  };

  // Toggle a destination as favorite
  const toggleFavorite = (destinationId) => {
    if (favoriteDestinations.includes(destinationId)) {
      setFavoriteDestinations(favoriteDestinations.filter(id => id !== destinationId));
    } else {
      setFavoriteDestinations([...favoriteDestinations, destinationId]);
    }
  };

  // Check if a destination is in favorites
  const isFavorite = (destinationId) => {
    return favoriteDestinations.includes(destinationId);
  };

  return (
    <DestinationContext.Provider value={{
      currentDestination,
      setCurrentDestination,
      recentDestinations,
      addToRecent,
      favoriteDestinations,
      toggleFavorite,
      isFavorite
    }}>
      {children}
    </DestinationContext.Provider>
  );
};

// Custom hook to use the destination context
export const useDestinationContext = () => {
  const context = useContext(DestinationContext);
  if (!context) {
    throw new Error('useDestinationContext must be used within a DestinationProvider');
  }
  return context;
};