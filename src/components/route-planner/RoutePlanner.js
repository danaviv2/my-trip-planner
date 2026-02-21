// src/components/route-planner/RoutePlanner.js
import React, { useContext } from 'react';
import { Box, CircularProgress, Button } from '@mui/material';
import { TripContext } from '../../contexts/TripContext';
import RouteForm from './RouteForm';
import RouteMap from './RouteMap';
import RouteInfo from './RouteInfo';
import AttractionFilters from './AttractionFilters';
import RouteNavigationButtons from './RouteNavigationButtons';
import { UserPreferencesContext } from '../../contexts/UserPreferencesContext';
import PreferencesForm from '../trip-planner/PreferencesForm';
import TripPlanner from '../trip-planner/TripPlanner';
import AccommodationPlanner from '../trip-planner/AccommodationPlanner';
import ShareButtons from '../shared/ShareButtons';
import InviteButton from '../shared/InviteButton';
import TripLogs from './TripLogs';

/**
 * RoutePlanner - קומפוננט ראשי לתכנון מסלול
 * מרכז את כל הקומפוננטים הקשורים לתכנון מסלול
 */
const RoutePlanner = () => {
  const { 
    startPoint, endPoint, 
    isLoading, searchRoute, 
    attractions, activeFilters, 
    saveTripLog 
  } = useContext(TripContext);
  
  return (
    <Box>
      {/* טופס נקודות המסלול */}
      <RouteForm />
      
      {/* כפתור חיפוש מסלול */}
      <Box sx={{ textAlign: 'center', mb: 2 }} role="group" aria-label="חיפוש מסלול">
        {isLoading ? (
          <CircularProgress aria-label="טוען מסלול" />
        ) : (
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth 
            onClick={searchRoute} 
            disabled={!startPoint || !endPoint}
            sx={{ 
              background: '#2196F3', 
              padding: '10px 20px', 
              borderRadius: '8px', 
              '&:hover': { background: '#1976D2' } 
            }} 
            aria-label="חפש מסלול"
          >
            חפש מסלול
          </Button>
        )}
      </Box>
      
      {/* סינון אטרקציות */}
      {attractions.length > 0 && (
        <AttractionFilters activeFilters={activeFilters} />
      )}
      
      {/* טופס העדפות */}
      <PreferencesForm />
      
      {/* תכנון טיול */}
      <TripPlanner />
      
      {/* פרטי ניווט */}
      <RouteNavigationButtons />
      
      {/* תכנון לינה */}
      <AccommodationPlanner />
      
      {/* שיתוף ושמירה */}
      <Box sx={{ mt: 2 }}>
        <ShareButtons />
        <InviteButton />
        <Button 
          variant="contained" 
          color="primary" 
          onClick={saveTripLog} 
          sx={{ 
            mt: 2, 
            background: '#4CAF50', 
            color: '#fff', 
            borderRadius: '8px', 
            padding: '10px 20px', 
            '&:hover': { background: '#388E3C' } 
          }} 
          aria-label="שמור מסלול"
        >
          שמור מסלול
        </Button>
      </Box>
      
      {/* יומני טיולים קודמים */}
      <TripLogs />
      
      {/* מפת המסלול */}
      <RouteMap />
    </Box>
  );
};

export default RoutePlanner;