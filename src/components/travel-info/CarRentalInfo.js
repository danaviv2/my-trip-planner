// src/components/travel-info/CarRentalInfo.js
import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, Typography, TextField, Button, IconButton, Grid, Paper
} from '@mui/material';

/**
 * CarRentalInfo - רכיב לניהול פרטי השכרת רכב
 */
const CarRentalInfo = ({ carRental, setCarRental, showCarRental, setShowCarRental }) => {
  const { t } = useTranslation();
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
          {t('travelInfoPage.car_section')}
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
                label={t('travelInfoPage.rental_company')}
                value={carRental.company}
                onChange={(e) => updateCarRental('company', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('travelInfoPage.confirmation_number')}
                value={carRental.confirmationNumber}
                onChange={(e) => updateCarRental('confirmationNumber', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('travelInfoPage.pickup_date_car')}
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
                label={t('travelInfoPage.pickup_time_car')}
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
                label={t('travelInfoPage.pickup_location_car')}
                value={carRental.pickupLocation}
                onChange={(e) => updateCarRental('pickupLocation', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('travelInfoPage.return_date_car2')}
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
                label={t('travelInfoPage.return_time_car')}
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
                label={t('travelInfoPage.return_location_car')}
                value={carRental.returnLocation}
                onChange={(e) => updateCarRental('returnLocation', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('travelInfoPage.car_type')}
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
                  alert(t('travelInfoPage.alert_fill_company'));
                }
              }}
            >
              {t('travelInfoPage.check_company')}
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<i className="material-icons">map</i>}
              onClick={() => {
                if (carRental.pickupLocation) {
                  window.open(`https://www.google.com/maps/search/${encodeURIComponent(`${carRental.company || ''} car rental ${carRental.pickupLocation}`)}`, '_blank');
                } else {
                  alert(t('travelInfoPage.alert_fill_pickup'));
                }
              }}
            >
              {t('travelInfoPage.show_map')}
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default CarRentalInfo;