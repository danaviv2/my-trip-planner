import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import WeatherWidget from '../maps/WeatherWidget';
import DailyTimeline from './DailyTimeline';
import RouteInfo from './RouteInfo';
import RoadTripInfo from './RoadTripInfo';

/**
 * מסך תכנון הטיול — תצוגת הימים והמסלול.
 *
 * היה מוגדר בתוך הפונקציה App ולכן נבנה מחדש בכל render: מצב התצוגה
 * (מפורט/מרוכז) והיום הפתוח התאפסו בכל שינוי state של App.
 * ה-JSX זהה למקור; התלויות עברו ל-props.
 */
const TripItineraryView = ({ tripPlan, userPreferences, startPoint, endPoint, routeInfo, onAddActivity, onEditActivity }) => {
  // הוספת משתנה מצב לתצוגת תצוגה מרוכזת/מפוצלת
  const [viewMode, setViewMode] = useState('detailed'); // 'detailed', 'compact'
  
  // הוספת משתנה מצב ליום הנבחר
  const [expandedDay, setExpandedDay] = useState(null);
  
  // פונקציה לטיפול בפתיחת/סגירת יום
  const handleDayToggle = (dayNum) => {
    if (expandedDay === dayNum) {
      setExpandedDay(null);
    } else {
      setExpandedDay(dayNum);
    }
  };
  
  return (
    <Box mt={2} role="region" aria-label="תכנון טיול">
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2
      }}>
        <Typography variant="h5" sx={{ 
          color: '#2c3e50', 
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center' 
        }}>
          <i className="material-icons" style={{ marginRight: '8px' }}>map</i>
          תכנון טיול ל{userPreferences.location ? `-${userPreferences.location}` : ''}
        </Typography>
        
        {/* כפתורי תצוגה */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={viewMode === 'detailed' ? 'contained' : 'outlined'}
            color="primary"
            size="small"
            onClick={() => setViewMode('detailed')}
            startIcon={<i className="material-icons">view_agenda</i>}
            sx={{ borderRadius: '8px' }}
          >
            תצוגה מפורטת
          </Button>
          <Button
            variant={viewMode === 'compact' ? 'contained' : 'outlined'}
            color="primary"
            size="small"
            onClick={() => setViewMode('compact')}
            startIcon={<i className="material-icons">view_list</i>}
            sx={{ borderRadius: '8px' }}
          >
            תצוגה מרוכזת
          </Button>
        </Box>
      </Box>
      {tripPlan.isRoadTrip && <RoadTripInfo tripPlan={tripPlan} startPoint={startPoint} endPoint={endPoint} />}

      <RouteInfo routeInfo={routeInfo} />
      {/* הוספת קומפוננט מזג אוויר */}
<Paper sx={{ p: 2, mt: 1, mb: 1, bgcolor: '#f9f9f9', borderRadius: '8px', boxShadow: 1 }}>
<Typography variant="h6" sx={{ 
  color: '#2c3e50', 
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  mb: 2
}}>
  <i className="material-icons" style={{ marginRight: '8px' }}>wb_sunny</i>
  תחזית מזג אוויר
</Typography>
<WeatherWidget location={userPreferences.location} />
</Paper>

              {tripPlan.dailyItinerary.length > 0 ? (
        viewMode === 'detailed' ? (
          // תצוגה מפורטת - תצוגת לוח זמנים מלאה
          tripPlan.dailyItinerary.map((day) => (
            <Paper 
              key={day.day} 
              sx={{ 
                p: 2, 
                mt: 1, 
                mb: 1, 
                bgcolor: '#f9f9f9', 
                borderRadius: '8px', 
                boxShadow: 1,
                border: day.day === expandedDay ? '2px solid #4CAF50' : '1px solid #e0e0e0'
              }} 
              role="article" 
              aria-label={`יום טיול ${day.day}`}
            >
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                cursor: 'pointer',
                mb: expandedDay === day.day ? 2 : 0,
                pb: expandedDay === day.day ? 1 : 0,
                borderBottom: expandedDay === day.day ? '1px dashed #e0e0e0' : 'none'
              }} onClick={() => handleDayToggle(day.day)}>
                <Typography variant="h6" sx={{ 
                  color: '#2c3e50', 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <i className="material-icons" style={{ marginRight: '8px' }}>event</i>
                  יום {day.day}: {day.date || ''} {day.summary ? `- ${day.summary}` : ''}
                </Typography>
                <Box>
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDayToggle(day.day);
                    }}
                  >
                    <i className="material-icons">
                      {expandedDay === day.day ? 'expand_less' : 'expand_more'}
                    </i>
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddActivity(day.day - 1);
                    }}
                  >
                    <i className="material-icons">add_circle_outline</i>
                  </IconButton>
                </Box>
              </Box>
              
              {/* תוכן היום - מוצג רק אם היום הנבחר או אם אין יום נבחר */}
              {(expandedDay === day.day || expandedDay === null) && (
                <DailyTimeline dayData={day} defaultLocation={userPreferences.location} onEditActivity={onEditActivity} />
              )}
            </Paper>
          ))
        ) : (
          // תצוגה מרוכזת - רק כותרות וסיכום
          <Paper sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: '8px', boxShadow: 1 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
              סיכום {tripPlan.dailyItinerary.length} ימי טיול ב{userPreferences.location}
            </Typography>
            
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>יום</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>תאריך</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>סיכום</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>פעילויות</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>פעולות</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tripPlan.dailyItinerary.map((day) => (
                    <TableRow key={day.day} hover>
                      <TableCell>{day.day}</TableCell>
                      <TableCell>{day.date || '-'}</TableCell>
                      <TableCell>{day.summary || 'יום טיול'}</TableCell>
                      <TableCell>{day.schedule ? day.schedule.length : 0} פעילויות</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton size="small" onClick={() => handleDayToggle(day.day)}>
                            <i className="material-icons" style={{ fontSize: '18px' }}>visibility</i>
                          </IconButton>
                          <IconButton size="small" onClick={() => onAddActivity(day.day - 1)}>
                            <i className="material-icons" style={{ fontSize: '18px' }}>add_circle_outline</i>
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {expandedDay && (
              <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  פירוט יום {expandedDay}
                  <IconButton size="small" onClick={() => setExpandedDay(null)}>
                    <i className="material-icons">close</i>
                  </IconButton>
                </Typography>
                <DailyTimeline dayData={tripPlan.dailyItinerary[expandedDay - 1]} defaultLocation={userPreferences.location} onEditActivity={onEditActivity} />
              </Box>
            )}
          </Paper>
        )
      ) : (
        <Typography variant="body2" sx={{ color: '#666' }}>
          אין תכנון זמין. נסה לחפש מסלול או להשתמש ב-AI לתכנון.
        </Typography>
      )}
    </Box>
  );
};

export default TripItineraryView;
