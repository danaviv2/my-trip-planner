import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Stack,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  AccessTime as TimeIcon,
  Restaurant as RestaurantIcon,
  Hotel as HotelIcon,
  Attractions as AttractionsIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  AutoAwesome as OptimizeIcon
} from '@mui/icons-material';

const TripScheduler = ({ tripPlan, onUpdatePlan }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dailySchedule, setDailySchedule] = useState([]);
  const [optimizedSchedule, setOptimizedSchedule] = useState(null);

  /**
   * יצירת לוח זמנים אופטימלי
   */
  const optimizeSchedule = () => {
    if (!startDate || !endDate) {
      alert('נא לבחור תאריכי התחלה וסיום');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    console.log(`📅 מייצר לוח זמנים ל-${days} ימים`);

    const schedule = [];
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      
      const dayPlan = {
        date: currentDate.toLocaleDateString('he-IL'),
        dayNumber: i + 1,
        activities: []
      };

      // יום ראשון - הגעה ואכלוס במלון
      if (i === 0) {
        dayPlan.activities.push({
          time: '09:00',
          type: 'arrival',
          title: 'הגעה ליעד',
          icon: '✈️',
          duration: '2 שעות'
        });
        
        if (tripPlan.hotels[0]) {
          dayPlan.activities.push({
            time: '12:00',
            type: 'hotel',
            title: `אכלוס ב-${tripPlan.hotels[0].name}`,
            icon: '🏨',
            duration: '1 שעה',
            place: tripPlan.hotels[0]
          });
        }

        dayPlan.activities.push({
          time: '14:00',
          type: 'lunch',
          title: tripPlan.restaurants[0] ? `ארוחת צהריים ב-${tripPlan.restaurants[0].name}` : 'ארוחת צהריים',
          icon: '🍽️',
          duration: '1.5 שעות',
          place: tripPlan.restaurants[0]
        });

        if (tripPlan.attractions[0]) {
          dayPlan.activities.push({
            time: '16:00',
            type: 'attraction',
            title: tripPlan.attractions[0].name,
            icon: '🎯',
            duration: '2 שעות',
            place: tripPlan.attractions[0]
          });
        }

        dayPlan.activities.push({
          time: '19:00',
          type: 'dinner',
          title: tripPlan.restaurants[1] ? `ארוחת ערב ב-${tripPlan.restaurants[1].name}` : 'ארוחת ערב',
          icon: '🍴',
          duration: '2 שעות',
          place: tripPlan.restaurants[1]
        });
      }
      // ימי ביניים - אטרקציות מלאות
      else if (i < days - 1) {
        dayPlan.activities.push({
          time: '08:00',
          type: 'breakfast',
          title: 'ארוחת בוקר במלון',
          icon: '☕',
          duration: '1 שעה'
        });

        const morningAttraction = tripPlan.attractions[i % tripPlan.attractions.length];
        if (morningAttraction) {
          dayPlan.activities.push({
            time: '09:30',
            type: 'attraction',
            title: morningAttraction.name,
            icon: '🎯',
            duration: '3 שעות',
            place: morningAttraction
          });
        }

        dayPlan.activities.push({
          time: '13:00',
          type: 'lunch',
          title: tripPlan.restaurants[i % tripPlan.restaurants.length]?.name || 'ארוחת צהריים',
          icon: '🍽️',
          duration: '1.5 שעות',
          place: tripPlan.restaurants[i % tripPlan.restaurants.length]
        });

        const afternoonAttraction = tripPlan.attractions[(i + 1) % tripPlan.attractions.length];
        if (afternoonAttraction) {
          dayPlan.activities.push({
            time: '15:00',
            type: 'attraction',
            title: afternoonAttraction.name,
            icon: '🎯',
            duration: '2.5 שעות',
            place: afternoonAttraction
          });
        }

        dayPlan.activities.push({
          time: '18:30',
          type: 'free',
          title: 'זמן חופשי / קניות',
          icon: '🛍️',
          duration: '1.5 שעות'
        });

        dayPlan.activities.push({
          time: '20:00',
          type: 'dinner',
          title: tripPlan.restaurants[(i + 1) % tripPlan.restaurants.length]?.name || 'ארוחת ערב',
          icon: '🍴',
          duration: '2 שעות',
          place: tripPlan.restaurants[(i + 1) % tripPlan.restaurants.length]
        });
      }
      // יום אחרון - סיום ויציאה
      else {
        dayPlan.activities.push({
          time: '08:00',
          type: 'breakfast',
          title: 'ארוחת בוקר במלון',
          icon: '☕',
          duration: '1 שעה'
        });

        dayPlan.activities.push({
          time: '10:00',
          type: 'checkout',
          title: 'צ׳ק-אאוט מהמלון',
          icon: '🏨',
          duration: '1 שעה'
        });

        if (tripPlan.attractions.length > 0) {
          const lastAttraction = tripPlan.attractions[tripPlan.attractions.length - 1];
          dayPlan.activities.push({
            time: '11:30',
            type: 'attraction',
            title: lastAttraction.name,
            icon: '🎯',
            duration: '2 שעות',
            place: lastAttraction
          });
        }

        dayPlan.activities.push({
          time: '14:00',
          type: 'departure',
          title: 'יציאה חזרה הביתה',
          icon: '✈️',
          duration: '2 שעות'
        });
      }

      schedule.push(dayPlan);
    }

    setOptimizedSchedule(schedule);
    console.log('✅ לוח זמנים אופטימלי נוצר!', schedule);
  };

  const getActivityColor = (type) => {
    const colors = {
      arrival: '#2196F3',
      hotel: '#9C27B0',
      lunch: '#FF9800',
      dinner: '#F44336',
      breakfast: '#FFC107',
      attraction: '#4CAF50',
      free: '#00BCD4',
      checkout: '#9C27B0',
      departure: '#2196F3'
    };
    return colors[type] || '#757575';
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
        <ScheduleIcon color="primary" /> תזמון אופטימלי
      </Typography>

      {/* בחירת תאריכים */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2}>
          <TextField
            label="תאריך התחלה"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="תאריך סיום"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Stack>
        
        <Button
          fullWidth
          variant="contained"
          color="primary"
          startIcon={<OptimizeIcon />}
          onClick={optimizeSchedule}
          sx={{ mt: 2 }}
        >
          צור לוח זמנים אופטימלי
        </Button>
      </Box>

      {/* הצגת לוח זמנים */}
      {optimizedSchedule && (
        <Box>
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            📅 לוח הזמנים שלך
          </Typography>

          <Stepper orientation="vertical">
            {optimizedSchedule.map((day, dayIndex) => (
              <Step key={dayIndex} active>
                <StepLabel
                  StepIconComponent={() => (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                      }}
                    >
                      {day.dayNumber}
                    </Box>
                  )}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    יום {day.dayNumber} - {day.date}
                  </Typography>
                </StepLabel>
                <StepContent>
                  <List>
                    {day.activities.map((activity, actIndex) => (
                      <React.Fragment key={actIndex}>
                        <ListItem
                          sx={{
                            bgcolor: 'grey.50',
                            borderRadius: 1,
                            mb: 1,
                            borderLeft: `4px solid ${getActivityColor(activity.type)}`
                          }}
                        >
                          <ListItemIcon>
                            <Typography variant="h4">{activity.icon}</Typography>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                  {activity.title}
                                </Typography>
                                {activity.place && (
                                  <Chip
                                    label={`⭐ ${activity.place.rating}`}
                                    size="small"
                                    color="success"
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  🕐 {activity.time} • ⏱️ {activity.duration}
                                </Typography>
                                {activity.place?.address && (
                                  <Typography variant="caption" color="text.secondary">
                                    📍 {activity.place.address}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                </StepContent>
              </Step>
            ))}
          </Stepper>

          {/* כפתורי פעולה */}
          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="success"
              fullWidth
              onClick={() => {
                // שמירת לוח הזמנים
                const scheduleData = JSON.stringify(optimizedSchedule, null, 2);
                const blob = new Blob([scheduleData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `trip-schedule-${Date.now()}.json`;
                a.click();
                console.log('✅ לוח זמנים נשמר!');
              }}
            >
              💾 שמור לוח זמנים
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                // ייצוא ל-PDF
                alert('ייצוא ל-PDF - בקרוב! 📄');
              }}
            >
              📄 ייצא ל-PDF
            </Button>
          </Stack>
        </Box>
      )}
    </Paper>
  );
};

export default TripScheduler;
