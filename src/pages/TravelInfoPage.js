import React from 'react';
import { Typography, Paper, Box } from '@mui/material';
import TravelInfoComponent from '../components/travel-info/TravelInfoComponent';

const TravelInfoPage = () => {
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
          פרטי הנסיעה שלך
        </Typography>
        
        <Typography variant="subtitle1" align="center" sx={{ mb: 4, color: '#666' }}>
          כאן תוכל לנהל את כל פרטי הנסיעה שלך - טיסות, השכרת רכב ופרטי הזמנות
        </Typography>
        
        {/* רכיב פרטי הנסיעה */}
        <TravelInfoComponent />
      </Paper>
    </Box>
  );
};

export default TravelInfoPage;