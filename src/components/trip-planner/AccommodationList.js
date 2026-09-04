import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import bookingLinks from '../../utils/bookingLinks';

/**
 * תצוגת תכנון הלינה לאורך המסלול.
 * הוצא מתוך הפונקציה App כדי שלא ייבנה מחדש בכל render. ה-JSX זהה למקור.
 */
const AccommodationList = ({ accommodations, onAddHotel }) => {
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
                  onClick={() => window.open(bookingLinks.hotelSearch(`${hotel.name || ''} ${hotel.address || ''}`))}
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
          onClick={onAddHotel}
        >
          הוסף מלון למסלול
        </Button>
      </Box>
    </Box>
  );
};

export default AccommodationList;
