import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';
import StatisticsPanel from '../components/statistics/StatisticsPanel';

const StatisticsPage = () => {
  const { t } = useTranslation();
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
            {t('statistics.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {t('statistics.subtitle')}
          </Typography>

          <StatisticsPanel />
        </Paper>
      </Container>
    </Box>
  );
};

export default StatisticsPage;
