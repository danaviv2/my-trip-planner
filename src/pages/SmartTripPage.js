import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import SmartTripPlanner from '../components/trip-planner/SmartTripPlanner';
import { TripProvider } from '../contexts/TripContext';

const SmartTripPage = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Paper sx={{ p: 3, borderRadius: '12px' }}>
        <Typography variant="h4" gutterBottom sx={{ borderBottom: '2px solid #3498db', pb: 1, mb: 3 }}>
          תכנון טיול חכם
        </Typography>
        <Typography variant="body1" paragraph>
          תכנן את הטיול המושלם שלך בקלות באמצעות כלי התכנון החכם. התאם את ההעדפות שלך וקבל תוכנית יום מותאמת אישית.
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <SmartTripPlanner />
        </Box>
      </Paper>
    </Container>
  );
};

export default SmartTripPage;