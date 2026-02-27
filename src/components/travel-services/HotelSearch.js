import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Rating,
  Chip,
  CircularProgress
} from '@mui/material';
import HotelIcon from '@mui/icons-material/Hotel';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
import { useTranslation } from 'react-i18next';

const HotelSearch = () => {
  const { t } = useTranslation();
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [loading, setLoading] = useState(false);
  const [hotels, setHotels] = useState([]);

  const handleSearch = () => {
    setLoading(true);
    
    // סימולציה של חיפוש
    setTimeout(() => {
      const mockHotels = [
        {
          id: 1,
          name: 'Grand Hotel',
          location: destination || 'Tel Aviv',
          rating: 4.5,
          price: 450,
          image: 'https://source.unsplash.com/400x300/?hotel,luxury',
          amenities: ['WiFi', 'Pool', 'Parking']
        },
        {
          id: 2,
          name: 'Plaza Hotel',
          location: destination || 'Tel Aviv',
          rating: 4.2,
          price: 380,
          image: 'https://source.unsplash.com/400x300/?hotel,room',
          amenities: ['WiFi', 'Breakfast', 'A/C']
        },
        {
          id: 3,
          name: 'Central Hotel',
          location: destination || 'Tel Aviv',
          rating: 4.0,
          price: 320,
          image: 'https://source.unsplash.com/400x300/?hotel,modern',
          amenities: ['WiFi', 'Parking']
        }
      ];
      
      setHotels(mockHotels);
      setLoading(false);
    }, 1500);
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <HotelIcon sx={{ mr: 1 }} />
          {t('travelServices.search_hotels_title')}
        </Typography>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label={t('travelServices.destination')}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              InputProps={{
                startAdornment: <LocationOnIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label={t('travelServices.checkin_date')}
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label={t('travelServices.checkout_date')}
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label={t('travelServices.guests')}
              type="number"
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value))}
              inputProps={{ min: 1, max: 10 }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSearch}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
              sx={{ height: '56px' }}
            >
              {loading ? t('travelServices.searching') : t('travelServices.search_btn')}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {hotels.length > 0 && (
        <Grid container spacing={3}>
          {hotels.map((hotel) => (
            <Grid item xs={12} md={4} key={hotel.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={hotel.image}
                  alt={hotel.name}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {hotel.name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationOnIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {hotel.location}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Rating value={hotel.rating} precision={0.1} readOnly size="small" />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {hotel.rating}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    {hotel.amenities.map((amenity, index) => (
                      <Chip
                        key={index}
                        label={amenity}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" color="primary">
                      ${hotel.price}
                    </Typography>
                    <Button variant="contained" size="small">
                      {t('travelServices.book_btn')}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default HotelSearch;