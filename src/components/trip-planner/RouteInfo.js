import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * מרחק וזמן נסיעה של המסלול.
 *
 * ── למה אין כאן "לא זמין" ──
 * השורה הציגה "מרחק: לא זמין | זמן נסיעה: לא זמין" בעוד המפה שמתחתיה
 * הראתה 347 ק"מ ו-3:53. טקסט שמכחיש נתון שמוצג לצידו מלמד שאין טעם
 * לקרוא אותו. כשאין מה לומר — לא נאמר דבר.
 */
const RouteInfo = ({ routeInfo }) => {
  const distance = (routeInfo && routeInfo.distance) || '';
  const duration = (routeInfo && routeInfo.duration) || '';
  if (!distance && !duration) return null;

  return (
    <Box sx={{ mt: 2, p: 2, bgcolor: '#f0f0f0', borderRadius: '8px', boxShadow: 1 }} role="region" aria-label="פרטי מסלול">
      <Typography variant="subtitle1" sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
        פרטי המסלול:
      </Typography>
      <Typography variant="body2" sx={{ color: '#666' }}>
        {distance && `מרחק: ${distance}`}
        {distance && duration && ' | '}
        {duration && `זמן נסיעה: ${duration}`}
      </Typography>
    </Box>
  );
};

export default RouteInfo;
