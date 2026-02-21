import React from 'react';
import { Box, Button } from '@mui/material';
import { useTripContext } from '../../contexts/TripContext';

/**
 * כפתורי ניווט במסלול
 * מאפשרים למשתמש לנווט בין שלבי תכנון המסלול
 */
const RouteNavigationButtons = ({ onBack, onNext, isLastStep = false, isFirstStep = false }) => {
  const { tripData } = useTripContext();
  
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
      <Button
        variant="outlined"
        disabled={isFirstStep}
        onClick={onBack}
        startIcon={<i className="material-icons">arrow_back</i>}
      >
        חזרה
      </Button>
      
      <Button
        variant="contained"
        color="primary"
        onClick={onNext}
        endIcon={<i className="material-icons">{isLastStep ? 'check' : 'arrow_forward'}</i>}
      >
        {isLastStep ? 'סיום' : 'הבא'}
      </Button>
    </Box>
  );
};

export default RouteNavigationButtons;