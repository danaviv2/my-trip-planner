// src/components/travel-info/FlightInfo.js
import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, Typography, TextField, Button, IconButton, Grid, Paper
} from '@mui/material';

/**
 * FlightInfo - רכיב לניהול פרטי טיסות
 */
const FlightInfo = ({ flights, setFlights, showFlights, setShowFlights }) => {
  const { t } = useTranslation();
  // פונקציה להוספת טיסה נוספת
  const addFlight = () => {
    const newId = Math.max(...flights.map(f => f.id), 0) + 1;
    setFlights([...flights, { 
      id: newId, 
      type: 'return', 
      flightNumber: '', 
      airline: '', 
      date: '', 
      departureTime: '', 
      departureAirport: '', 
      arrivalTime: '', 
      arrivalAirport: '', 
      terminal: '' 
    }]);
  };
  
  // פונקציה לעדכון פרטי טיסה
  const updateFlight = (id, field, value) => {
    setFlights(flights.map(flight => 
      flight.id === id ? { ...flight, [field]: value } : flight
    ));
  };
  
  // פונקציה למחיקת טיסה
  const removeFlight = (id) => {
    setFlights(flights.filter(flight => flight.id !== id));
  };
  
  // פונקציה להצגת מידע על שדה תעופה
  const showAirportInfo = (airportCode) => {
    // פה נוכל לקרוא ל-API שמספק מידע על שדות תעופה
    window.open(`https://www.iata.org/en/publications/directories/code-search/?airport.search=${airportCode}`, '_blank');
  };
  
  return (
    <Box sx={{ mb: 4 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid #e0e0e0',
          pb: 1,
          mb: 2
        }}
        onClick={() => setShowFlights(!showFlights)}
        style={{ cursor: 'pointer' }}
      >
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
          <i className="material-icons" style={{ marginRight: '8px', color: '#2196F3' }}>flight</i>
          {t('travelInfoPage.flights_section')}
        </Typography>
        <IconButton size="small">
          <i className="material-icons">{showFlights ? 'expand_less' : 'expand_more'}</i>
        </IconButton>
      </Box>
      
      {showFlights && (
        <>
          {flights.map((flight, index) => (
            <Paper key={flight.id} sx={{ p: 2, mb: 2, borderRadius: '8px', bgcolor: '#f5f5f5' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {flight.type === 'departure' ? t('travelInfoPage.flight_departure') : t('travelInfoPage.flight_return')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => removeFlight(flight.id)}
                  >
                    <i className="material-icons">delete</i>
                  </IconButton>
                </Box>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('travelInfoPage.airline')}
                    value={flight.airline}
                    onChange={(e) => updateFlight(flight.id, 'airline', e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('travelInfoPage.flight_number')}
                    value={flight.flightNumber}
                    onChange={(e) => updateFlight(flight.id, 'flightNumber', e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('travelInfoPage.date')}
                    type="date"
                    value={flight.date}
                    onChange={(e) => updateFlight(flight.id, 'date', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('travelInfoPage.terminal')}
                    value={flight.terminal}
                    onChange={(e) => updateFlight(flight.id, 'terminal', e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('travelInfoPage.departure_airport')}
                    value={flight.departureAirport}
                    onChange={(e) => updateFlight(flight.id, 'departureAirport', e.target.value)}
                    size="small"
                    InputProps={{
                      endAdornment: (
                        <IconButton 
                          size="small"
                          onClick={() => showAirportInfo(flight.departureAirport)}
                        >
                          <i className="material-icons" style={{ fontSize: '18px' }}>info</i>
                        </IconButton>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('travelInfoPage.departure_time')}
                    type="time"
                    value={flight.departureTime}
                    onChange={(e) => updateFlight(flight.id, 'departureTime', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('travelInfoPage.arrival_airport')}
                    value={flight.arrivalAirport}
                    onChange={(e) => updateFlight(flight.id, 'arrivalAirport', e.target.value)}
                    size="small"
                    InputProps={{
                      endAdornment: (
                        <IconButton 
                          size="small"
                          onClick={() => showAirportInfo(flight.arrivalAirport)}
                        >
                          <i className="material-icons" style={{ fontSize: '18px' }}>info</i>
                        </IconButton>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('travelInfoPage.arrival_time')}
                    type="time"
                    value={flight.arrivalTime}
                    onChange={(e) => updateFlight(flight.id, 'arrivalTime', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<i className="material-icons">search</i>}
                  onClick={() => {
                    if (flight.airline && flight.flightNumber && flight.date) {
                      const year = new Date(flight.date).getFullYear();
                      const month = new Date(flight.date).getMonth() + 1;
                      const date = new Date(flight.date).getDate();
                      window.open(`https://www.flightstats.com/v2/flight-tracker/${flight.airline}/${flight.flightNumber}?year=${year}&month=${month}&date=${date}`, '_blank');
                    } else {
                      alert(t('travelInfoPage.alert_fill_flight'));
                    }
                  }}
                >
                  {t('travelInfoPage.check_status')}
                </Button>
              </Box>
            </Paper>
          ))}
          
          <Button
            variant="outlined"
            startIcon={<i className="material-icons">add</i>}
            onClick={addFlight}
            sx={{ mb: 2 }}
          >
            {t('travelInfoPage.add_flight')}
          </Button>
        </>
      )}
    </Box>
  );
};

export default FlightInfo;