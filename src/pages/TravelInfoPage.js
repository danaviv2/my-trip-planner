import React from 'react';
import { Typography, Paper, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import TravelInfoComponent from '../components/travel-info/TravelInfoComponent';

const TravelInfoPage = () => {
  const { t } = useTranslation();
  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: '#ffffff', borderRadius: '16px' }}>
        <Typography variant="h4" align="center" gutterBottom sx={{
          color: '#2c3e50',
          fontWeight: 'bold',
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <i className="material-icons" style={{ marginRight: '8px', fontSize: '36px' }}>flight_takeoff</i>
          {t('travelInfo.title')}
        </Typography>

        <Typography variant="subtitle1" align="center" sx={{ mb: 4, color: '#666' }}>
          {t('travelInfo.subtitle')}
        </Typography>

        <TravelInfoComponent />
      </Paper>
    </Box>
  );
};

export default TravelInfoPage;
