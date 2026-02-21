import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * רכיב להטענת סקריפטים חיצוניים (כמו Google Maps)
 */
const LoadScript = ({ 
  googleMapsApiKey, 
  children, 
  loadingComponent, 
  errorComponent 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    if (!googleMapsApiKey) {
      setHasError(true);
      return;
    }
    
    // בדיקה אם הסקריפט כבר נטען
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }
    
    // הטענת ה-API של גוגל מפות
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsLoaded(true);
    };
    
    script.onerror = () => {
      setHasError(true);
    };
    
    document.head.appendChild(script);
    
    return () => {
      // ניקוי במידת הצורך
    };
  }, [googleMapsApiKey]);
  
  if (hasError) {
    return errorComponent || (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">
          שגיאה בטעינת Google Maps API. נא לבדוק את מפתח ה-API.
        </Typography>
      </Box>
    );
  }
  
  if (!isLoaded) {
    return loadingComponent || (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return <>{children}</>;
};

export default LoadScript;