// src/components/route-planner/TripLogs.js
import React, { useContext } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { TripContext } from '../../contexts/TripContext';

/**
 * TripLogs - מציג יומני טיולים שנשמרו בעבר
 */
const TripLogs = () => {
  const { tripLogs, deleteTripLog, editTripLog } = useContext(TripContext);

  if (tripLogs.length === 0) {
    return null;
  }

  return (
    <Box mt={2} role="region" aria-label="יומני טיולים קודמים">
      <Typography variant="h5" sx={{ color: '#2c3e50', fontWeight: 'bold', mb: 1 }} role="heading" aria-level="2">
        יומני טיולים קודמים
      </Typography>
      {tripLogs.map(log => (
        <Paper key={log.id} sx={{ p: 2, m: '5px 0', bgcolor: '#f9f9f9', borderRadius: '8px', boxShadow: 1 }} role="article" aria-label={`יומן טיול מ-${new Date(log.date).toLocaleDateString()}`}>
          <Typography sx={{ color: '#666' }}>תאריך: {new Date(log.date).toLocaleDateString()}</Typography>
          <Typography sx={{ color: '#666' }}>התחלה: {log.startPoint}</Typography>
          <Typography sx={{ color: '#666' }}>יעד: {log.endPoint}</Typography>
          <Typography sx={{ color: '#666' }}>תחנות ביניים: {log.waypoints.join(', ')}</Typography>
          <Box sx={{ mt: 1, display: 'flex', gap: 1 }} role="group" aria-label="פעולות על יומן טיול">
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={() => editTripLog(log.id, { 
                startPoint: prompt('עדכן נקודת התחלה:', log.startPoint) || log.startPoint, 
                endPoint: prompt('עדכן יעד:', log.endPoint) || log.endPoint, 
                waypoints: prompt('עדכן תחנות ביניים (הפרד עם פסיק):', log.waypoints.join(', '))?.split(', ') || log.waypoints 
              })} 
              sx={{ borderRadius: '8px' }} 
              aria-label="ערוך יומן טיול"
            >
              ערוך
            </Button>
            <Button 
              variant="outlined" 
              color="error" 
              onClick={() => deleteTripLog(log.id)} 
              sx={{ borderRadius: '8px' }} 
              aria-label="מחק יומן טיול"
            >
              מחק
            </Button>
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default TripLogs;