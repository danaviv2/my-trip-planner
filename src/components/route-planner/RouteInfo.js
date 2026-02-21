// src/components/route-planner/RouteInfo.js
import React, { useContext } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { TripContext } from '../../contexts/TripContext';

/**
 * RouteInfo - קומפוננט להצגת מידע על המסלול
 * מציג מרחק וזמן נסיעה
 */
const RouteInfo = () => {
  const { routeInfo } = useContext(TripContext);

  if (!routeInfo.distance && !routeInfo.duration) {
    return null;
  }

  return (
    <Box sx={{ mt: 2, p: 2, bgcolor: '#f0f0f0', borderRadius: '8px', boxShadow: 1 }} role="region" aria-label="פרטי מסלול">
      <Typography variant="subtitle1" sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
        פרטי המסלול:
      </Typography>
      <Typography variant="body2" sx={{ color: '#666' }}>
        מרחק: {routeInfo.distance || 'לא זמין'} | זמן נסיעה: {routeInfo.duration || 'לא זמין'}
      </Typography>
    </Box>
  );
};

export default RouteInfo;