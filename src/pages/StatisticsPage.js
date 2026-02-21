import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import StatisticsPanel from '../components/statistics/StatisticsPanel';

const StatisticsPage = () => {
  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      pt: 10,
      pb: 4
    }}>
      <Container maxWidth="xl">
        <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 'bold', 
            mb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            📊 דוחות וסטטיסטיקות
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            ניתוח מעמיק של היסטוריית הטיולים שלך, גרפים אינטראקטיביים והמלצות אישיות
          </Typography>
          
          <StatisticsPanel />
        </Paper>
      </Container>
    </Box>
  );
};

export default StatisticsPage;
