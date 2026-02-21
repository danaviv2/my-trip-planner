// src/components/trip-planner/HotelModal.js
import React, { useState, useContext } from 'react';
import { Box, Typography, TextField, Button, Modal, Paper } from '@mui/material';
import { TripContext } from '../../contexts/TripContext';

/**
 * HotelModal - חלון דו-שיח להוספת מלון
 */
const HotelModal = () => {
  const { hotelModalOpen, setHotelModalOpen, accommodations, setAccommodations } = useContext(TripContext);
  
  const [hotel, setHotel] = useState({
    name: '',
    address: '',
    checkIn: '',
    checkOut: '',
    notes: ''
  });
  
  const handleSave = () => {
    setAccommodations([...accommodations, hotel]);
    setHotelModalOpen(false);
    setHotel({ name: '', address: '', checkIn: '', checkOut: '', notes: '' });
  };
  
  const searchHotel = (site) => {
    const query = encodeURIComponent(`${hotel.name || ''} ${hotel.address || ''}`);
    let url = '';
    
    switch(site) {
      case 'booking':
        url = `https://www.booking.com/search.he.html?ss=${query}`;
        break;
      case 'hotels':
        url = `https://he.hotels.com/search.do?q-destination=${query}`;
        break;
      case 'airbnb':
        url = `https://www.airbnb.com/s/${query}/homes`;
        break;
      case 'expedia':
        url = `https://www.expedia.com/Hotel-Search?destination=${query}`;
        break;
      default:
        url = `https://www.booking.com/search.he.html?ss=${query}`;
    }
    
    window.open(url, '_blank');
  };
  
  return (
    <Modal open={hotelModalOpen} onClose={() => setHotelModalOpen(false)}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '500px',
        bgcolor: 'background.paper',
        borderRadius: '8px',
        boxShadow: 24,
        p: 4,
      }}>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
          הוספת מלון למסלול
        </Typography>
        
        <TextField
          fullWidth
          label="שם המלון"
          value={hotel.name}
          onChange={(e) => setHotel({ ...hotel, name: e.target.value })}
          sx={{ mb: 2 }}
        />
        
        <TextField
          fullWidth
          label="כתובת"
          value={hotel.address}
          onChange={(e) => setHotel({ ...hotel, address: e.target.value })}
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="תאריך צ׳ק-אין"
            type="date"
            value={hotel.checkIn}
            onChange={(e) => setHotel({ ...hotel, checkIn: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1 }}
          />
          
          <TextField
            label="תאריך צ׳ק-אאוט"
            type="date"
            value={hotel.checkOut}
            onChange={(e) => setHotel({ ...hotel, checkOut: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1 }}
          />
        </Box>
        
        <TextField
          fullWidth
          multiline
          rows={3}
          label="הערות"
          value={hotel.notes}
          onChange={(e) => setHotel({ ...hotel, notes: e.target.value })}
          sx={{ mb: 3 }}
        />
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            חפש מלון באתרי הזמנות:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Button 
              variant="outlined"
              onClick={() => searchHotel('booking')}
              startIcon={<i className="material-icons">hotel</i>}
            >
              Booking.com
            </Button>
            <Button 
              variant="outlined"
              onClick={() => searchHotel('hotels')}
              startIcon={<i className="material-icons">business</i>}
            >
              Hotels.com
            </Button>
            <Button 
              variant="outlined"
              onClick={() => searchHotel('airbnb')}
              startIcon={<i className="material-icons">home</i>}
            >
              Airbnb
            </Button>
            <Button 
              variant="outlined"
              onClick={() => searchHotel('expedia')}
              startIcon={<i className="material-icons">flight_takeoff</i>}
            >
              Expedia
            </Button>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={() => setHotelModalOpen(false)}>בטל</Button>
          <Button 
            variant="contained" 
            onClick={handleSave}
            disabled={!hotel.name || !hotel.address}
          >
            שמור
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default HotelModal;