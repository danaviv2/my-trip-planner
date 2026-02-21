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
  Chip,
  CircularProgress
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import SearchIcon from '@mui/icons-material/Search';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import AirlineSeatReclineNormalIcon from '@mui/icons-material/AirlineSeatReclineNormal';

const CarRentalSearch = () => {
  const [location, setLocation] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [cars, setCars] = useState([]);

  const handleSearch = () => {
    setLoading(true);
    
    setTimeout(() => {
      const mockCars = [
        {
          id: 1,
          name: 'טויוטה יאריס',
          category: 'קומפקט',
          transmission: 'אוטומט',
          passengers: 5,
          fuel: 'בנזין',
          price: 150,
          image: 'https://source.unsplash.com/400x300/?toyota,car'
        },
        {
          id: 2,
          name: 'הונדה סיוויק',
          category: 'בינוני',
          transmission: 'אוטומט',
          passengers: 5,
          fuel: 'בנזין',
          price: 180,
          image: 'https://source.unsplash.com/400x300/?honda,car'
        },
        {
          id: 3,
          name: 'קיה ספורטאז׳',
          category: 'SUV',
          transmission: 'אוטומט',
          passengers: 7,
          fuel: 'היברידי',
          price: 250,
          image: 'https://source.unsplash.com/400x300/?suv,car'
        }
      ];
      
      setCars(mockCars);
      setLoading(false);
    }, 1500);
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <DirectionsCarIcon sx={{ mr: 1 }} />
          השכרת רכב
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="מיקום איסוף"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="שדה תעופה בן גוריון"
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="תאריך איסוף"
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="תאריך החזרה"
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSearch}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
              sx={{ height: '56px' }}
            >
              {loading ? 'מחפש...' : 'חפש'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {cars.length > 0 && (
        <Grid container spacing={3}>
          {cars.map((car) => (
            <Grid item xs={12} md={4} key={car.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={car.image}
                  alt={car.name}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {car.name}
                  </Typography>
                  
                  <Chip label={car.category} size="small" sx={{ mb: 2 }} />
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <AirlineSeatReclineNormalIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {car.passengers} מקומות
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocalGasStationIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {car.fuel}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary">
                      {car.transmission}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" color="primary">
                      ₪{car.price}/יום
                    </Typography>
                    <Button variant="contained" size="small">
                      הזמן
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

export default CarRentalSearch;