import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';

/**
 * תצוגת פרטי הטיול המתגלגל.
 * הוצא מתוך הפונקציה App כדי שלא ייבנה מחדש בכל render. ה-JSX זהה למקור;
 * tripPlan, startPoint ו-endPoint עברו ל-props. getStopColor הועבר לכאן
 * כי זה הרכיב היחיד שהשתמש בו.
 */
const getStopColor = (index) => {
  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000'];
  return colors[index % colors.length];
};

const RoadTripInfo = ({ tripPlan, startPoint, endPoint }) => {
  // אם אין מידע על טיול מתגלגל, לא מציגים כלום
  if (!tripPlan.isRoadTrip) return null;
  
  return (
    <Paper sx={{ mt: 2, p: 2, bgcolor: '#e8f5fe', borderRadius: '8px', boxShadow: 1 }}>
      <Typography variant="h6" sx={{ 
        color: '#0277bd', 
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        mb: 2
      }}>
        <i className="material-icons" style={{ marginRight: '8px' }}>alt_route</i>
        פרטי הטיול המתגלגל
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 1 }}>
        טיול מתגלגל מ-<strong>{startPoint}</strong> ל-<strong>{endPoint}</strong>
      </Typography>
      
      <Typography variant="subtitle2" sx={{ mt: 1, mb: 1, fontWeight: 'bold' }}>
        תחנות לאורך המסלול:
      </Typography>
      
      <Box sx={{ ml: 2 }}>
        {tripPlan.routeStops && tripPlan.routeStops.map((stop, index) => (
          <Box key={index} sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 1,
            p: 1,
            borderRadius: '4px',
            bgcolor: '#ffffff'
          }}>
            <Box sx={{ 
              width: 24, 
              height: 24, 
              borderRadius: '50%', 
              bgcolor: getStopColor(index), 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1,
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              {index + 1}
            </Box>
            <Typography variant="body2" sx={{ flex: 1 }}>{stop}</Typography>
            <Typography variant="body2" sx={{ 
              color: '#0277bd', 
              fontWeight: 'bold',
              borderRadius: '4px',
              px: 1
            }}>
              {tripPlan.daysPerStop ? `${tripPlan.daysPerStop[index]} ימים` : ''}
            </Typography>
          </Box>
        ))}
      </Box>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Button 
          variant="outlined" 
          color="primary"
          startIcon={<i className="material-icons">map</i>}
          onClick={() => window.scrollTo({
            top: document.querySelector('.gm-style')?.getBoundingClientRect().top + window.pageYOffset - 100,
            behavior: 'smooth'
          })}
        >
          הצג במפה
        </Button>
      </Box>
    </Paper>
  );
};

export default RoadTripInfo;
