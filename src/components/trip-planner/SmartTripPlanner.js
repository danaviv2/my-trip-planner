// src/components/trip-planner/SmartTripPlanner.js
import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, Paper, Typography, TextField, Slider, Chip, Button, 
  Grid, FormControl, InputLabel, Select, MenuItem, Rating,
  Card, CardContent, CardMedia, IconButton, Alert, Divider,
  ListItem, List, CircularProgress, Accordion, AccordionSummary, 
  AccordionDetails, Tooltip, Switch, FormControlLabel
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import AttractionsIcon from '@mui/icons-material/Attractions';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import MuseumIcon from '@mui/icons-material/Museum';
import HotelIcon from '@mui/icons-material/Hotel';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import NatureIcon from '@mui/icons-material/Nature';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ShareIcon from '@mui/icons-material/Share';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import TripContext from '../../contexts/TripContext';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

/**
 * קומפוננטת תכנון טיולים חכמה
 * מאפשרת למשתמש לתכנן טיול לפי העדפות, זמן, תקציב ואינטרסים
 */
const SmartTripPlanner = () => {
  const { tripPlan, updateTripPlan, destinations, saveTrip } = useContext(TripContext);
  
  // משתני מצב
  const [preferences, setPreferences] = useState({
    activityLevel: 3, // 1-5: נמוך עד גבוה
    startTime: '09:00',
    endTime: '18:00',
    includeBreakfast: true,
    includeLunch: true,
    includeDinner: true,
    maxBudgetPerDay: 500,
    interests: ['culture', 'nature', 'food', 'history']
  });
  
  const [availableInterests] = useState([
    { id: 'culture', label: 'תרבות', icon: <MuseumIcon /> },
    { id: 'nature', label: 'טבע', icon: <NatureIcon /> },
    { id: 'food', label: 'אוכל', icon: <RestaurantIcon /> },
    { id: 'history', label: 'היסטוריה', icon: <AttractionsIcon /> },
    { id: 'beaches', label: 'חופים', icon: <BeachAccessIcon /> },
    { id: 'shopping', label: 'קניות', icon: <ShoppingBagIcon /> },
    { id: 'nightlife', label: 'חיי לילה', icon: <LocalCafeIcon /> },
    { id: 'family', label: 'משפחות', icon: <HotelIcon /> },
  ]);

  const [currentPlan, setCurrentPlan] = useState([]);
  const [optimizedPlan, setOptimizedPlan] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreferences, setShowPreferences] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // עדכון העדפות
  const handlePreferenceChange = (name, value) => {
    setPreferences({
      ...preferences,
      [name]: value
    });
  };
  
  // הוספה/הסרה של תחומי עניין
  const toggleInterest = (interestId) => {
    const newInterests = [...preferences.interests];
    
    if (newInterests.includes(interestId)) {
      // הסר את התחום עניין אם הוא כבר קיים
      setPreferences({
        ...preferences,
        interests: newInterests.filter(id => id !== interestId)
      });
    } else {
      // הוסף את תחום העניין אם הוא לא קיים
      setPreferences({
        ...preferences,
        interests: [...newInterests, interestId]
      });
    }
  };
  
  // פונקציה לחישוב תכנית יום אופטימלית
  const generateOptimizedPlan = () => {
    setIsGenerating(true);
    setError(null);
    
    // סימולציה של תהליך החישוב (במציאות היה כאן אלגוריתם)
    setTimeout(() => {
      try {
        // מייצרים רשימת פעילויות לפי ההעדפות
        const placesToVisit = [];
        
        // הוסף ארוחת בוקר אם נבחרה
        if (preferences.includeBreakfast) {
          placesToVisit.push({
            id: `breakfast-${Date.now()}`,
            type: 'meal',
            subtype: 'breakfast',
            title: 'ארוחת בוקר',
            startTime: preferences.startTime,
            endTime: addMinutesToTime(preferences.startTime, 45),
            location: 'מסעדה מקומית',
            price: Math.floor(Math.random() * 50) + 30,
            description: 'ארוחת בוקר מקומית',
            image: 'https://source.unsplash.com/300x200/?breakfast',
            rating: 4.2
          });
        }
        
        // הוסף אטרקציות לפי תחומי עניין
        preferences.interests.forEach((interest, index) => {
          const interestData = availableInterests.find(item => item.id === interest);
          
          for (let i = 0; i < preferences.activityLevel; i++) {
            // מספר הפעילויות תלוי ברמת הפעילות
            placesToVisit.push({
              id: `activity-${interest}-${i}-${Date.now()}`,
              type: 'activity',
              subtype: interest,
              title: `פעילות ${interestData?.label || interest}`,
              startTime: '',  // יחושב בהמשך
              endTime: '',    // יחושב בהמשך
              location: 'מיקום כלשהו',
              price: Math.floor(Math.random() * 100) + 50,
              description: `פעילות בתחום ${interestData?.label || interest}`,
              image: `https://source.unsplash.com/300x200/?${interest}`,
              rating: (Math.random() * 2) + 3, // דירוג בין 3 ל-5
              duration: 60 + (Math.floor(Math.random() * 4) * 30) // בין שעה לשעתיים וחצי
            });
          }
        });
        
        // הוסף ארוחת צהריים אם נבחרה
        if (preferences.includeLunch) {
          placesToVisit.push({
            id: `lunch-${Date.now()}`,
            type: 'meal',
            subtype: 'lunch',
            title: 'ארוחת צהריים',
            startTime: '13:00',
            endTime: '14:00',
            location: 'מסעדה מקומית',
            price: Math.floor(Math.random() * 80) + 60,
            description: 'ארוחת צהריים מקומית',
            image: 'https://source.unsplash.com/300x200/?lunch',
            rating: 4.5
          });
        }
        
        // הוסף ארוחת ערב אם נבחרה
        if (preferences.includeDinner) {
          placesToVisit.push({
            id: `dinner-${Date.now()}`,
            type: 'meal',
            subtype: 'dinner',
            title: 'ארוחת ערב',
            startTime: '19:00',
            endTime: '20:30',
            location: 'מסעדה מקומית',
            price: Math.floor(Math.random() * 120) + 80,
            description: 'ארוחת ערב מקומית',
            image: 'https://source.unsplash.com/300x200/?dinner',
            rating: 4.8
          });
        }
        
        // ארגון פעילויות לפי זמן אופטימלי
        const timeSlotActivities = organizeDaySchedule(placesToVisit, preferences);
        
        // עדכון התכנית
        setOptimizedPlan(timeSlotActivities);
        setCurrentPlan(timeSlotActivities);
        
        setSuccessMessage('תכנית היום חושבה בהצלחה!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        console.error('שגיאה בחישוב תכנית יום:', err);
        setError('אירעה שגיאה בחישוב תכנית היום. נסה שוב.');
      } finally {
        setIsGenerating(false);
      }
    }, 1500);
  };
  
  // פונקציה לארגון סדר היום
  const organizeDaySchedule = (activities, prefs) => {
    const { startTime, endTime } = prefs;
    
    // ממיינים ארוחות וקובעים להן זמנים קבועים
    const meals = activities.filter(act => act.type === 'meal');
    
    // מחשבים זמן כולל זמין (בדקות)
    const dayStartMinutes = timeToMinutes(startTime);
    const dayEndMinutes = timeToMinutes(endTime);
    let totalAvailableTime = dayEndMinutes - dayStartMinutes;
    
    // מחסירים את זמן הארוחות
    meals.forEach(meal => {
      const mealDuration = timeToMinutes(meal.endTime) - timeToMinutes(meal.startTime);
      totalAvailableTime -= mealDuration;
    });
    
    // בוחרים פעילויות שאינן ארוחות
    const otherActivities = activities.filter(act => act.type !== 'meal')
      .sort((a, b) => b.rating - a.rating); // ממיינים לפי דירוג
    
    // בודקים אם יש מספיק זמן לכל הפעילויות
    let totalActivitiesTime = otherActivities.reduce((sum, act) => sum + act.duration, 0);
    
    // אם אין מספיק זמן, מסירים פעילויות בדירוג נמוך
    while (totalActivitiesTime > totalAvailableTime && otherActivities.length > 0) {
      const removedActivity = otherActivities.pop();
      totalActivitiesTime -= removedActivity.duration;
    }
    
    // עכשיו מארגנים את הפעילויות לאורך היום
    const organizedActivities = [...meals]; // מתחילים עם הארוחות
    
    let currentTime = dayStartMinutes;
    otherActivities.forEach(activity => {
      // מוצאים פער זמן מתאים
      let foundSlot = false;
      
      // בודקים אם הפעילות מתאימה לפני כל ארוחה
      for (const meal of meals.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))) {
        const mealStartTime = timeToMinutes(meal.startTime);
        
        if (currentTime + activity.duration <= mealStartTime) {
          // מצאנו מקום מתאים
          const activityWithTimes = {
            ...activity,
            startTime: minutesToTime(currentTime),
            endTime: minutesToTime(currentTime + activity.duration)
          };
          
          organizedActivities.push(activityWithTimes);
          currentTime += activity.duration + 15; // 15 דקות מעבר
          foundSlot = true;
          break;
        }
      }
      
      // אם לא מצאנו מקום לפני ארוחה, בודקים אחרי ארוחת הערב (אם יש)
      if (!foundSlot) {
        const lastMeal = meals.sort((a, b) => timeToMinutes(b.endTime) - timeToMinutes(a.endTime))[0];
        
        if (lastMeal) {
          currentTime = Math.max(currentTime, timeToMinutes(lastMeal.endTime) + 15);
        }
        
        if (currentTime + activity.duration <= dayEndMinutes) {
          const activityWithTimes = {
            ...activity,
            startTime: minutesToTime(currentTime),
            endTime: minutesToTime(currentTime + activity.duration)
          };
          
          organizedActivities.push(activityWithTimes);
          currentTime += activity.duration + 15; // 15 דקות מעבר
        }
      }
    });
    
    // ממיינים את התוצאה הסופית לפי זמן התחלה
    return organizedActivities.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  };
  
  // פונקציות עזר לחישובי זמן
  const timeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };
  const addMinutesToTime = (timeString, minutesToAdd) => {
    const totalMinutes = timeToMinutes(timeString) + minutesToAdd;
    return minutesToTime(totalMinutes);
  };
  
  // פונקציה למחיקת פעילות מהתכנית
  const removeActivity = (activityId) => {
    setCurrentPlan(currentPlan.filter(activity => activity.id !== activityId));
  };
  
  // פונקציה להוספת פעילות חדשה
  const addNewActivity = (activityType) => {
    const newActivity = {
      id: `new-activity-${Date.now()}`,
      type: 'activity',
      subtype: activityType || 'culture',
      title: 'פעילות חדשה',
      startTime: '12:00',
      endTime: '13:00',
      location: 'הזן מיקום',
      price: 0,
      description: 'תיאור הפעילות',
      image: `https://source.unsplash.com/300x200/?${activityType || 'activity'}`,
      rating: 4.0
    };
    
    setCurrentPlan([...currentPlan, newActivity]);
  };
  
  // פונקציה לעדכון פעילות
  const updateActivity = (activityId, field, value) => {
    setCurrentPlan(currentPlan.map(activity => 
      activity.id === activityId ? { ...activity, [field]: value } : activity
    ));
  };
  
  // פונקציה לחישוב הסכום הכולל של התכנית
  const calculateTotalCost = () => {
    return currentPlan.reduce((total, activity) => total + activity.price, 0);
  };
  
  // פונקציה לחישוב משך הזמן הכולל של התכנית
  const calculateTotalDuration = () => {
    let totalMinutes = 0;
    
    currentPlan.forEach(activity => {
      const startMinutes = timeToMinutes(activity.startTime);
      const endMinutes = timeToMinutes(activity.endTime);
      totalMinutes += (endMinutes - startMinutes);
    });
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };
  
  // שמירת התכנית
  const savePlanToTrip = () => {
    // הנח שיש לנו פונקציה שמעדכנת את תכנון הטיול הכולל ביום הנוכחי
    // saveTrip(currentDay, currentPlan);
    alert('התכנית נשמרה בהצלחה!');
  };
  
  // טיפול בגרירה ושחרור
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(currentPlan);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setCurrentPlan(items);
    
    // כאן צריך להתאים את שעות הפעילויות לפי הסדר החדש
    // לא מיושם במלואו במדריך זה
  };
  
  return (
    <Box sx={{ mb: 4 }}>
      {/* כותרת */}
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
        <DirectionsWalkIcon sx={{ mr: 1 }} />
        תכנון טיול חכם
      </Typography>
      
      {/* הודעות אישור ושגיאה */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* טופס העדפות */}
      <Accordion 
        expanded={showPreferences}
        onChange={() => setShowPreferences(!showPreferences)}
        sx={{ mb: 3 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight="bold">העדפות לתכנון טיול</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                רמת פעילות
              </Typography>
              <Box sx={{ px: 1 }}>
                <Slider
                  value={preferences.activityLevel}
                  onChange={(e, value) => handlePreferenceChange('activityLevel', value)}
                  step={1}
                  marks
                  min={1}
                  max={5}
                  valueLabelDisplay="auto"
                  aria-label="רמת פעילות"
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption">פעילות מועטה</Typography>
                  <Typography variant="caption">פעילות מרובה</Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                שעות פעילות
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="שעת התחלה"
                  type="time"
                  value={preferences.startTime}
                  onChange={(e) => handlePreferenceChange('startTime', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 300 }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="שעת סיום"
                  type="time"
                  value={preferences.endTime}
                  onChange={(e) => handlePreferenceChange('endTime', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 300 }}
                  sx={{ flex: 1 }}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                ארוחות
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={preferences.includeBreakfast}
                      onChange={(e) => handlePreferenceChange('includeBreakfast', e.target.checked)}
                    />
                  }
                  label="ארוחת בוקר"
                />
                <FormControlLabel
                  control={
                    <Switch 
                      checked={preferences.includeLunch}
                      onChange={(e) => handlePreferenceChange('includeLunch', e.target.checked)}
                    />
                  }
                  label="ארוחת צהריים"
                />
                <FormControlLabel
                  control={
                    <Switch 
                      checked={preferences.includeDinner}
                      onChange={(e) => handlePreferenceChange('includeDinner', e.target.checked)}
                    />
                  }
                  label="ארוחת ערב"
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                תקציב מרבי ליום
              </Typography>
              <TextField
                fullWidth
                type="number"
                label="תקציב (₪)"
                value={preferences.maxBudgetPerDay}
                onChange={(e) => handlePreferenceChange('maxBudgetPerDay', parseInt(e.target.value))}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                תחומי עניין
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {availableInterests.map((interest) => (
                  <Chip
                    key={interest.id}
                    icon={interest.icon}
                    label={interest.label}
                    clickable
                    color={preferences.interests.includes(interest.id) ? 'primary' : 'default'}
                    onClick={() => toggleInterest(interest.id)}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={generateOptimizedPlan}
              disabled={isGenerating}
              startIcon={isGenerating ? <CircularProgress size={20} /> : null}
            >
              {isGenerating ? 'מחשב תכנית...' : 'חשב תכנית יום אופטימלית'}
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>
      
      {/* תצוגת התכנית הנוכחית */}
      {currentPlan.length > 0 && (
        <Box>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2
          }}>
            <Typography variant="h6">
              תכנית היום שלך ({currentPlan.length} פעילויות)
            </Typography>
            
            <Box>
              <Button 
                startIcon={<AddIcon />} 
                size="small" 
                onClick={() => addNewActivity()}
                sx={{ mr: 1 }}
              >
                הוסף פעילות
              </Button>
              <Button 
                startIcon={<SaveIcon />} 
                variant="contained" 
                size="small"
                onClick={savePlanToTrip}
              >
                שמור תכנית
              </Button>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Paper sx={{ p: 2, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" sx={{ mr: 1 }}>סה"כ עלות:</Typography>
              <Typography variant="h6" color="primary">{calculateTotalCost()} ₪</Typography>
            </Paper>
            
            <Paper sx={{ p: 2, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" sx={{ mr: 1 }}>משך זמן כולל:</Typography>
              <Typography variant="h6" color="primary">{calculateTotalDuration()}</Typography>
            </Paper>
          </Box>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="activities">
              {(provided) => (
                <Box
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {currentPlan.map((activity, index) => (
                    <Draggable key={activity.id} draggableId={activity.id} index={index}>
                      {(provided) => (
                        <Paper
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          sx={{ 
                            mb: 2, 
                            overflow: 'hidden',
                            border: activity.type === 'meal' ? '2px solid #4caf50' : undefined
                          }}
                        >
                          <Box sx={{ 
                            display: 'flex', 
                            borderBottom: '1px solid #eee',
                            bgcolor: activity.type === 'meal' ? '#e8f5e9' : '#f5f5f5',
                            p: 1
                          }}>
                            <Box {...provided.dragHandleProps} sx={{ pr: 1, display: 'flex', alignItems: 'center' }}>
                              <DragIndicatorIcon />
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                              <Typography fontWeight="bold">
                                {activity.startTime} - {activity.endTime}
                              </Typography>
                            </Box>
                            
                            <Box>
                              <IconButton size="small" onClick={() => removeActivity(activity.id)}>
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Box>
                          
                          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                            <Box sx={{ 
                              width: { xs: '100%', sm: '200px' }, 
                              height: { xs: '150px', sm: '100%' }
                            }}>
                              <img 
                                src={activity.image} 
                                alt={activity.title}
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  objectFit: 'cover'
                                }}
                              />
                            </Box>
                            
                            <Box sx={{ flex: 1, p: 2 }}>
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                flexDirection: { xs: 'column', sm: 'row' },
                                mb: 1
                              }}>
                                <Typography variant="h6">
                                  {activity.title}
                                </Typography>
                                
                                <Typography color="primary" fontWeight="bold">
                                  {activity.price} ₪
                                </Typography>
                              </Box>
                              
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {activity.location}
                              </Typography>
                              
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                {activity.description}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Chip 
                                  size="small" 
                                  label={activity.type === 'meal' ? `ארוחת ${activity.subtype}` : activity.subtype}
                                  color={activity.type === 'meal' ? 'success' : 'primary'}
                                />
                                
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Rating value={activity.rating} precision={0.5} readOnly size="small" />
                                  <Typography variant="body2" sx={{ ml: 0.5 }}>
                                    ({activity.rating.toFixed(1)})
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          </Box>
                        </Paper>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </DragDropContext>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
            >
              הדפס תכנית
            </Button>
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'תכנית הטיול שלי',
                    text: `תכנית טיול עם ${currentPlan.length} פעילויות`,
                    // url: window.location.href
                  });
                } else {
                  alert('שיתוף אינו נתמך בדפדפן זה');
                }
              }}
            >
              שתף תכנית
            </Button>
          </Box>
        </Box>
      )}
      
      {currentPlan.length === 0 && !isGenerating && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            עדיין אין תכנית טיול
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            הגדר את ההעדפות שלך וצור תכנית טיול אופטימלית
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={generateOptimizedPlan}
          >
            צור תכנית עכשיו
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default SmartTripPlanner;