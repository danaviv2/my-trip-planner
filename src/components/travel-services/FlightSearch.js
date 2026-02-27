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
  Chip,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import FlightIcon from '@mui/icons-material/Flight';
import SearchIcon from '@mui/icons-material/Search';
import { useTranslation } from 'react-i18next';

const FlightSearch = () => {
  const { t } = useTranslation();
  const [tripType, setTripType] = useState('roundtrip');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [loading, setLoading] = useState(false);
  const [flights, setFlights] = useState([]);

  const handleSearch = () => {
    setLoading(true);
    
    setTimeout(() => {
      const mockFlights = [
        {
          id: 1,
          airline: 'El Al',
          origin: origin || 'Tel Aviv',
          destination: destination || 'Paris',
          departure: '08:00',
          arrival: '12:30',
          duration: '4h 30m',
          price: 1200,
          direct: true
        },
        {
          id: 2,
          airline: 'Wizz Air',
          origin: origin || 'Tel Aviv',
          destination: destination || 'Paris',
          departure: '14:15',
          arrival: '18:45',
          duration: '4h 30m',
          price: 890,
          direct: true
        },
        {
          id: 3,
          airline: 'Turkish Airlines',
          origin: origin || 'Tel Aviv',
          destination: destination || 'Paris',
          departure: '06:30',
          arrival: '14:20',
          duration: '7h 50m',
          price: 750,
          direct: false
        }
      ];
      
      setFlights(mockFlights);
      setLoading(false);
    }, 1500);
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <FlightIcon sx={{ mr: 1 }} />
          {t('travelServices.search_flights_title')}
        </Typography>

        <Box sx={{ mb: 3 }}>
          <ToggleButtonGroup
            value={tripType}
            exclusive
            onChange={(e, newValue) => newValue && setTripType(newValue)}
            size="small"
          >
            <ToggleButton value="roundtrip">{t('travelServices.roundtrip')}</ToggleButton>
            <ToggleButton value="oneway">{t('travelServices.oneway')}</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label={t('travelServices.origin')}
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Tel Aviv"
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label={t('travelServices.destination')}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Paris"
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label={t('travelServices.departure_date')}
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {tripType === 'roundtrip' && (
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label={t('travelServices.return_date')}
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          )}

          <Grid item xs={12} md={tripType === 'roundtrip' ? 1 : 2}>
            <TextField
              fullWidth
              label={t('travelServices.passengers')}
              type="number"
              value={passengers}
              onChange={(e) => setPassengers(parseInt(e.target.value))}
              inputProps={{ min: 1, max: 9 }}
            />
          </Grid>

          <Grid item xs={12} md={tripType === 'roundtrip' ? 1 : 2}>
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

      {flights.length > 0 && (
        <Box>
          {flights.map((flight) => (
            <Card key={flight.id} sx={{ mb: 2 }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={2}>
                    <Typography variant="h6">{flight.airline}</Typography>
                    <Chip
                      label={flight.direct ? t('travelServices.direct') : t('travelServices.one_stop')}
                      size="small"
                      color={flight.direct ? 'success' : 'default'}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5">{flight.departure}</Typography>
                        <Typography variant="body2" color="text.secondary">{flight.origin}</Typography>
                      </Box>
                      
                      <Box sx={{ textAlign: 'center', mx: 2 }}>
                        <FlightIcon sx={{ transform: 'rotate(90deg)' }} />
                        <Typography variant="caption" display="block">{flight.duration}</Typography>
                      </Box>
                      
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5">{flight.arrival}</Typography>
                        <Typography variant="body2" color="text.secondary">{flight.destination}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={2}>
                    <Typography variant="h5" color="primary" align="center">
                      ${flight.price}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" align="center">
                      {t('travelServices.per_passenger')}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={2}>
                    <Button variant="contained" fullWidth>
                      {t('travelServices.select_btn')}
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default FlightSearch;