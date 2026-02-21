// src/components/trip-planner/AccommodationPlanner.js
import React, { useContext } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useTripContext } from '../../contexts/TripContext';
/**
 * AccommodationPlanner - תכנון לינה
 * מאפשר למשתמש לנהל את הלינה לאורך המסלול
 */
const AccommodationPlanner = () => {
  const { accommodations, setHotelModalOpen } = useTripContext();
  if (accommodations.length === 0) {
    return (
      <Box sx={{ mt: 3, mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
          <i className="material-icons" style={{ marginRight: '8px' }}>hotel</i>
          תכנון לינה לאורך המסלול
        </Typography>
        
        <Button 
          variant="outlined" 
          startIcon={<i className="material-icons">add_circle</i>}
          onClick={() => setHotelModalOpen(true)}
          sx={{ mt: 1 }}
        >
          הוסף מלון למסלול
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3, mb: 2 }}>
      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
        <i className="material-icons" style={{ marginRight: '8px' }}>hotel</i>
        תכנון לינה לאורך המסלול
      </Typography>
      
      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {accommodations.map((hotel, index) => (
          <Paper key={index} sx={{ p: 2, borderRadius: '8px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1">{hotel.name}</Typography>
                <Typography variant="body2">{hotel.address}</Typography>
                <Typography variant="body2">
                  <strong>תאריכים:</strong> {hotel.checkIn} עד {hotel.checkOut}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={<i className="material-icons">directions</i>}
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(hotel.address)}`)}
                >
                  נווט
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="primary"
                  startIcon={<i className="material-icons">bookmark</i>}
                  onClick={() => window.open(`https://www.booking.com/search.he.html?ss=${encodeURIComponent(hotel.address)}`)}
                >
                  הזמן
                </Button>
              </Box>
            </Box>
          </Paper>
        ))}
        
        <Button 
          variant="outlined" 
          startIcon={<i className="material-icons">add_circle</i>}
          onClick={() => setHotelModalOpen(true)}
        >
          הוסף מלון למסלול
        </Button>
      </Box>
    </Box>
  );
};

export default AccommodationPlanner;