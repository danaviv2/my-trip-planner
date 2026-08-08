import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * תצוגת מרחק וזמן נסיעה של המסלול.
 * הוצא מתוך App; routeInfo עבר ל-prop. ה-JSX זהה למקור.
 */
const RouteInfo = ({ routeInfo }) => (
  <Box sx={{ mt: 2, p: 2, bgcolor: '#f0f0f0', borderRadius: '8px', boxShadow: 1 }} role="region" aria-label="פרטי מסלול">
    <Typography variant="subtitle1" sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
      פרטי המסלול:
    </Typography>
    <Typography variant="body2" sx={{ color: '#666' }}>
      מרחק: {routeInfo.distance || 'לא זמין'} | זמן נסיעה: {routeInfo.duration || 'לא זמין'}
    </Typography>
  </Box>
);

export default RouteInfo;
