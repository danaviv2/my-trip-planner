// src/components/travel-info/CarRentalInfo.js
import React from 'react';
import { 
  Box, Typography, TextField, Button, IconButton, Grid, Paper
} from '@mui/material';

/**
 * CarRentalInfo - רכיב לניהול פרטי השכרת רכב
 */
const CarRentalInfo = ({ carRental, setCarRental, showCarRental, setShowCarRental }) => {
  // עדכון שדה בפרטי השכרת הרכב
  const updateCarRental = (field, value) => {
    setCarRental(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Box>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid #e0e0e0',
          pb: 1,
          mb: 2
        }}
        onClick={() => setShowCarRental(!showCarRental)}
        style={{ cursor: 'pointer' }}
      >
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
          <i className="material-icons" style={{ marginRight: '8px', color: '#4CAF50' }}>directions_car</i>
          השכרת רכב
        </Typography>
        <IconButton size="small">
          <i className="material-icons">{showCarRental ? 'expand_less' : 'expand_more'}</i>
        </IconButton>
      </Box>
      
      {showCarRental && (
        <Paper sx={{ p: 2, borderRadius: '8px', bgcolor: '#f5f5f5' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="חברת השכרה"
                value={carRental.company}
                onChange={(e) => updateCarRental('company', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="מספר הזמנה/אישור"
                value={carRental.confirmationNumber}
                onChange={(e) => updateCarRental('confirmationNumber', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="תאריך קבלת הרכב"
                type="date"
                value={carRental.pickupDate}
                onChange={(e) => updateCarRental('pickupDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="שעת קבלת הרכב"
                type="time"
                value={carRental.pickupTime}
                onChange={(e) => updateCarRental('pickupTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="מיקום קבלת הרכב"
                value={carRental.pickupLocation}
                onChange={(e) => updateCarRental('pickupLocation', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="תאריך החזרת הרכב"
                type="date"
                value={carRental.returnDate}
                onChange={(e) => updateCarRental('returnDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="שעת החזרת הרכב"
                type="time"
                value={carRental.returnTime}
                onChange={(e) => updateCarRental('returnTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="מיקום החזרת הרכב"
                value={carRental.returnLocation}
                onChange={(e) => updateCarRental('returnLocation', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="סוג רכב"
                value={carRental.carType}
                onChange={(e) => updateCarRental('carType', e.target.value)}
                size="small"
              />
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<i className="material-icons">search</i>}
              onClick={() => {
                if (carRental.company) {
                  window.open(`https://www.google.com/search?q=${encodeURIComponent(`${carRental.company} car rental`)}`, '_blank');
                } else {
                  alert('נא להזין שם חברת השכרה');
                }
              }}
            >
              בדוק מידע על חברת ההשכרה
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<i className="material-icons">map</i>}
              onClick={() => {
                if (carRental.pickupLocation) {
                  window.open(`https://www.google.com/maps/search/${encodeURIComponent(`${carRental.company || ''} car rental ${carRental.pickupLocation}`)}`, '_blank');
                } else {
                  alert('נא להזין מיקום איסוף');
                }
              }}
            >
              הצג במפה
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default CarRentalInfo;