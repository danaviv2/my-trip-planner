// src/components/route-planner/RouteNavigationButtons.js
import React, { useContext } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { TripContext } from '../../contexts/TripContext';

/**
 * RouteNavigationButtons - כפתורי ניווט למסלול
 * מאפשר ניווט לנקודות המסלול
 */
const RouteNavigationButtons = () => {
  const { startPoint, endPoint, waypoints } = useContext(TripContext);

  if (!startPoint && !endPoint && waypoints.length === 0) {
    return null;
  }

  const navigateToPoint = (address) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`);
  };
  
  const navigateWithWaze = (address) => {
    window.open(`https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`);
  };
  
  return (
    <Box sx={{ mt: 2, p: 2, bgcolor: '#f0f8ff', borderRadius: '8px', boxShadow: 1 }}>
      <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
        <i className="material-icons" style={{ marginRight: '8px' }}>directions</i>
        ניווט למסלול
      </Typography>
      
      <Typography variant="body2" sx={{ mb: 1 }}>
        בחר נקודה לניווט:
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {startPoint && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: '#e6f2ff', borderRadius: '4px' }}>
            <Typography variant="body2">
              נקודת התחלה: {startPoint}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" 
                color="primary" 
                size="small" 
                onClick={() => navigateToPoint(startPoint)}
                startIcon={<i className="material-icons">map</i>}
              >
                Google Maps
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                size="small" 
                onClick={() => navigateWithWaze(startPoint)}
                startIcon={<span style={{ fontWeight: 'bold' }}>W</span>}
              >
                Waze
              </Button>
            </Box>
          </Box>
        )}
        
        {waypoints.map((waypoint, index) => (
          <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: '#e6f2ff', borderRadius: '4px' }}>
            <Typography variant="body2">
              נקודת ביניים {index + 1}: {waypoint}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" 
                color="primary" 
                size="small" 
                onClick={() => navigateToPoint(waypoint)}
                startIcon={<i className="material-icons">map</i>}
              >
                Google Maps
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                size="small" 
                onClick={() => navigateWithWaze(waypoint)}
                startIcon={<span style={{ fontWeight: 'bold' }}>W</span>}
              >
                Waze
              </Button>
            </Box>
          </Box>
        ))}
        
        {endPoint && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: '#e6f2ff', borderRadius: '4px' }}>
            <Typography variant="body2">
              נקודת יעד: {endPoint}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" 
                color="primary" 
                size="small" 
                onClick={() => navigateToPoint(endPoint)}
                startIcon={<i className="material-icons">map</i>}
              >
                Google Maps
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                size="small" 
                onClick={() => navigateWithWaze(endPoint)}
                startIcon={<span style={{ fontWeight: 'bold' }}>W</span>}
              >
                Waze
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default RouteNavigationButtons;