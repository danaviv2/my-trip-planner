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

const FlightSearch = () => {
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
          airline: 'אל על',
          origin: origin || 'תל אביב',
          destination: destination || 'פריז',
          departure: '08:00',
          arrival: '12:30',
          duration: '4ש 30ד',
          price: 1200,
          stops: 'ישיר'
        },
        {
          id: 2,
          airline: 'ויזאייר',
          origin: origin || 'תל אביב',
          destination: destination || 'פריז',
          departure: '14:15',
          arrival: '18:45',
          duration: '4ש 30ד',
          price: 890,
          stops: 'ישיר'
        },
        {
          id: 3,
          airline: 'טורקיש איירליינס',
          origin: origin || 'תל אביב',
          destination: destination || 'פריז',
          departure: '06:30',
          arrival: '14:20',
          duration: '7ש 50ד',
          price: 750,
          stops: '1 עצירה'
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
          חיפוש טיסות
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <ToggleButtonGroup
            value={tripType}
            exclusive
            onChange={(e, newValue) => newValue && setTripType(newValue)}
            size="small"
          >
            <ToggleButton value="roundtrip">הלוך חזור</ToggleButton>
            <ToggleButton value="oneway">כיוון אחד</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="מוצא"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="תל אביב"
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="יעד"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="פריז"
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="תאריך יציאה"
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
                label="תאריך חזרה"
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
              label="נוסעים"
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
              {loading ? 'מחפש...' : 'חפש'}
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
                    <Chip label={flight.stops} size="small" color={flight.stops === 'ישיר' ? 'success' : 'default'} />
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
                      ₪{flight.price}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" align="center">
                      לנוסע
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={2}>
                    <Button variant="contained" fullWidth>
                      בחר
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