// src/components/trip-planner/DailyTimeline.js
import React, { useContext } from 'react';
import { 
  Box, Typography, Paper, Button
} from '@mui/material';
import { TripContext } from '../../contexts/TripContext';
import { UserPreferencesContext } from '../../contexts/UserPreferencesContext';

/**
 * DailyTimeline - קומפוננט להצגת לוח זמנים יומי
 * מציג את כל הפעילויות המתוכננות ליום מסוים
 */
const DailyTimeline = ({ dayData }) => {
  const { handleEditAttraction } = useContext(TripContext);
  const { userPreferences } = useContext(UserPreferencesContext);

  // ניתוח תצוגת פעילות לפי סוג - כדי להציג אייקון ועיצוב מתאים
  const getActivityIcon = (type) => {
    switch (type) {
      case 'breakfast': return 'restaurant_menu';
      case 'lunch': return 'lunch_dining';
      case 'dinner': return 'dinner_dining';
      case 'attraction': return 'attractions';
      case 'museum': return 'museum';
      case 'tour': return 'tour';
      case 'activity': return 'event';
      case 'shopping': return 'shopping_bag';
      case 'accommodation': return 'hotel';
      case 'transport': return 'directions_car';
      default: return 'place';
    }
  };
  
  // קבלת צבע לפי סוג הפעילות
  const getActivityColor = (type) => {
    switch (type) {
      case 'breakfast': return '#FF9800';
      case 'lunch': return '#FB8C00';
      case 'dinner': return '#F57C00';
      case 'attraction': return '#2196F3';
      case 'museum': return '#9C27B0';
      case 'tour': return '#3F51B5';
      case 'activity': return '#4CAF50';
      case 'shopping': return '#E91E63';
      case 'accommodation': return '#673AB7';
      case 'transport': return '#607D8B';
      default: return '#9E9E9E';
    }
  };
  
  // המרת מחרוזת מחיר לאייקון
  const getPriceIcons = (priceRange) => {
    if (!priceRange) return null;
    
    let count = 0;
    if (priceRange.includes('€€€€')) count = 4;
    else if (priceRange.includes('€€€')) count = 3;
    else if (priceRange.includes('€€')) count = 2;
    else if (priceRange.includes('€')) count = 1;
    
    return (
      <Box sx={{ display: 'flex', color: '#9e9e9e' }}>
        {Array(count).fill(0).map((_, i) => (
          <i key={i} className="material-icons" style={{ fontSize: '16px' }}>euro</i>
        ))}
      </Box>
    );
  };
  
  // עיבוד זמני התחלה וסיום לתצוגה
  const formatTimeRange = (timeStart, timeEnd) => {
    if (!timeStart) return '';
    if (!timeEnd) return timeStart;
    return `${timeStart} - ${timeEnd}`;
  };

  // פונקציית ניווט משופרת - משתמשת בשאילתת Google Maps אם זמינה, אחרת בכתובת או שם
  const navigateToActivity = (activity) => {
    // אם יש שאילתת חיפוש ספציפית ל-Google Maps, השתמש בה
    const searchQuery = activity.googleMapsSearchQuery || 
                     `${activity.name} ${activity.address || dayData.location || ''}`;
    
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`);
  };
  
  return (
    <Box sx={{ my: 2 }}>
      <Typography variant="h6" sx={{ 
        mb: 2, 
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '2px solid #e0e0e0',
        paddingBottom: '8px'
      }}>
        <i className="material-icons" style={{ marginRight: '8px' }}>today</i>
        {dayData.date} - {dayData.summary}
      </Typography>
      
      {/* הוספת מיקום יומי */}
      <Paper elevation={1} sx={{ p: 1.5, mb: 2, bgcolor: '#e8f5e9', borderRadius: '8px', border: '1px solid #c8e6c9' }}>
        <Typography variant="subtitle1" sx={{ 
          fontWeight: 'bold', 
          display: 'flex', 
          alignItems: 'center',
          color: '#2e7d32'
        }}>
          <i className="material-icons" style={{ marginRight: '8px', fontSize: '20px' }}>location_on</i>
          מיקום: {dayData.location || userPreferences.location}
        </Typography>
      </Paper>
      
      {/* רכיב ניווט להמלצות תחבורה יומיות */}
      {dayData.transportation && (
        <Paper elevation={0} sx={{ p: 1.5, mb: 2, bgcolor: '#f5f5f5', borderRadius: '8px', border: '1px dashed #ccc' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <i className="material-icons" style={{ marginRight: '4px', fontSize: '18px' }}>directions</i>
            המלצות תחבורה להיום:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
            {Object.entries(dayData.transportation).map(([time, recommendation]) => (
              <Typography key={time} variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                <Box component="span" sx={{ fontWeight: 'bold', minWidth: '60px' }}>{time}:</Box>
                {recommendation}
              </Typography>
            ))}
          </Box>
        </Paper>
      )}
      
      {/* לוח זמנים - פעילויות */}
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {dayData.schedule && dayData.schedule.map((activity, idx) => (
          <Box 
            key={idx} 
            sx={{ 
              display: 'flex', 
              mb: 2,
              position: 'relative',
              '&::after': idx < dayData.schedule.length - 1 ? {
                content: '""',
                position: 'absolute',
                left: '20px',
                top: '40px',
                bottom: '-20px',
                width: '2px',
                bgcolor: '#e0e0e0',
                zIndex: 0
              } : {}
            }}
          >
            {/* אייקון הפעילות וזמן */}
            <Box sx={{ 
              mr: 2, 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: '40px'
            }}>
              <Box sx={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                bgcolor: getActivityColor(activity.type),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                position: 'relative',
                zIndex: 1
              }}>
                <i className="material-icons">{getActivityIcon(activity.type)}</i>
              </Box>
              <Typography variant="caption" sx={{ mt: 0.5, textAlign: 'center', fontWeight: 'bold' }}>
                {formatTimeRange(activity.timeStart, activity.timeEnd)}
              </Typography>
            </Box>
            
            {/* פרטי הפעילות */}
            <Paper sx={{ 
              flex: 1, 
              p: 1.5, 
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              '&:hover': {
                boxShadow: '0 3px 8px rgba(0,0,0,0.1)'
              }
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: getActivityColor(activity.type) }}>
                  {activity.name}
                </Typography>
                {getPriceIcons(activity.priceRange)}
              </Box>
              
              <Typography variant="body2" sx={{ mb: 1 }}>
                {activity.description}
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {/* מידע נוסף */}
                {activity.address && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <i className="material-icons" style={{ fontSize: '16px', marginRight: '4px', color: '#666', marginTop: '2px' }}>place</i>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      {activity.address}
                    </Typography>
                  </Box>
                )}
                
                {activity.openingHours && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <i className="material-icons" style={{ fontSize: '16px', marginRight: '4px', color: '#666' }}>access_time</i>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      שעות פתיחה: {activity.openingHours}
                    </Typography>
                  </Box>
                )}
                
                {activity.entranceFee && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <i className="material-icons" style={{ fontSize: '16px', marginRight: '4px', color: '#666' }}>payments</i>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      מחיר כניסה: {activity.entranceFee}
                    </Typography>
                  </Box>
                )}
                
                {activity.recommendedDuration && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <i className="material-icons" style={{ fontSize: '16px', marginRight: '4px', color: '#666' }}>schedule</i>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      משך זמן מומלץ: {activity.recommendedDuration}
                    </Typography>
                  </Box>
                )}
                
                {activity.tips && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <i className="material-icons" style={{ fontSize: '16px', marginRight: '4px', color: '#666' }}>lightbulb</i>
                    <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                      טיפ: {activity.tips}
                    </Typography>
                  </Box>
                )}
                
                {activity.travelTimeToNext && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <i className="material-icons" style={{ fontSize: '16px', marginRight: '4px', color: '#666' }}>directions</i>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      זמן נסיעה למקום הבא: {activity.travelTimeToNext}
                    </Typography>
                  </Box>
                )}
                
                {activity.reservationNeeded && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <i className="material-icons" style={{ fontSize: '16px', marginRight: '4px', color: '#f44336' }}>event_available</i>
                    <Typography variant="body2" sx={{ color: '#f44336', fontWeight: 'bold' }}>
                      מומלץ להזמין מראש!
                    </Typography>
                  </Box>
                )}
              </Box>
              
              {/* כפתורי פעולה */}
              <Box sx={{ display: 'flex', mt: 1.5, pt: 1, borderTop: '1px dashed #e0e0e0', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigateToActivity(activity)}
                  startIcon={<i className="material-icons">directions</i>}
                  sx={{ borderRadius: '20px', fontSize: '12px' }}
                >
                  נווט
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(activity.name)}`)}
                  startIcon={<i className="material-icons">search</i>}
                  sx={{ borderRadius: '20px', fontSize: '12px' }}
                >
                  חפש מידע
                </Button>
                
                {(activity.type === 'restaurant' || activity.type === 'breakfast' || activity.type === 'lunch' || activity.type === 'dinner') && (
                  <>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => window.open(`https://www.tripadvisor.com/Search?q=${encodeURIComponent(activity.name)}`)}
                      startIcon={<i className="material-icons">restaurant</i>}
                      sx={{ borderRadius: '20px', fontSize: '12px' }}
                    >
                      ביקורות
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => window.open(`https://www.thefork.com/search?q=${encodeURIComponent(activity.name)}`)}
                      startIcon={<i className="material-icons">book_online</i>}
                      sx={{ borderRadius: '20px', fontSize: '12px' }}
                    >
                      הזמן שולחן
                    </Button>
                  </>
                )}
                
                {activity.type === 'accommodation' && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => window.open(`https://www.booking.com/search.he.html?ss=${encodeURIComponent(activity.name)}`)}
                    startIcon={<i className="material-icons">hotel</i>}
                    sx={{ borderRadius: '20px', fontSize: '12px' }}
                  >
                    הזמן
                  </Button>
                )}
                
                {/* כפתור להצגת תמונות */}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(activity.name)}&tbm=isch`)}
                  startIcon={<i className="material-icons">photo_library</i>}
                  sx={{ borderRadius: '20px', fontSize: '12px' }}
                >
                  תמונות
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleEditAttraction(dayData.day, idx)}
                  startIcon={<i className="material-icons">edit</i>}
                  sx={{ 
                    borderRadius: '20px', 
                    fontSize: '12px',
                    marginLeft: 'auto'
                  }}
                >
                  ערוך
                </Button>
              </Box>
            </Paper>
          </Box>
        ))}
      </Box>
      
      {/* תצוגת מידע על המלון/לינה אם קיים */}
      {dayData.accommodation && (
        <Paper sx={{ p: 2, mt: 3, bgcolor: '#f3e5f5', borderRadius: '8px', border: '1px solid #e1bee7' }}>
          <Typography variant="subtitle1" sx={{ 
            mb: 1, 
            fontWeight: 'bold', 
            display: 'flex', 
            alignItems: 'center',
            color: '#673ab7'
          }}>
            <i className="material-icons" style={{ marginRight: '8px' }}>hotel</i>
            לינה: {dayData.accommodation.name}
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2">{dayData.accommodation.description}</Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <i className="material-icons" style={{ fontSize: '16px', marginRight: '4px', color: '#666' }}>place</i>
              <Typography variant="body2" sx={{ color: '#666' }}>
                {dayData.accommodation.address}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <i className="material-icons" style={{ fontSize: '16px', marginRight: '4px', color: '#666' }}>euro</i>
              <Typography variant="body2" sx={{ color: '#666' }}>
                {dayData.accommodation.priceRange}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => window.open(`https://www.booking.com/search.he.html?ss=${encodeURIComponent(dayData.accommodation.name)}`)}
                startIcon={<i className="material-icons">book_online</i>}
                sx={{ borderRadius: '20px', fontSize: '12px' }}
              >
                הזמן
              </Button>
              
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const searchQuery = dayData.accommodation.googleMapsSearchQuery || 
                                    `${dayData.accommodation.name} ${dayData.accommodation.address || dayData.location || ''}`;
                  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`);
                }}
                startIcon={<i className="material-icons">directions</i>}
                sx={{ borderRadius: '20px', fontSize: '12px' }}
              >
                נווט
              </Button>
              
              <Button
                variant="outlined"
                size="small"
                onClick={() => window.open(`https://www.tripadvisor.com/Search?q=${encodeURIComponent(dayData.accommodation.name)}`)}
                startIcon={<i className="material-icons">star_rate</i>}
                sx={{ borderRadius: '20px', fontSize: '12px' }}
              >
                ביקורות
              </Button>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default DailyTimeline;