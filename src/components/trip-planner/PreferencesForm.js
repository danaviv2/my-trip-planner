import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { travelStyles, paceLevels } from '../../constants/tripOptions';
import RoadTripButton from './RoadTripButton';

/**
 * טופס העדפות הטיול.
 *
 * הרכיב הזה היה מוגדר בתוך הפונקציה App, ולכן React יצר ממנו טיפוס חדש
 * בכל render של App. התוצאה: הטופס התפרק ונבנה מחדש בכל הקלדה — הפוקוס
 * קפץ מהשדה ו-6 משתני ה-state הפנימיים אופסו. הוצאתו לקובץ נפרד מתקנת זאת.
 *
 * ה-JSX זהה למקור; רק התלויות שהגיעו מהסקופ של App עברו ל-props.
 */
const PreferencesForm = ({ userPreferences, setUserPreferences, onPlanTrip, onPlanRoadTrip }) => {
  // הוספת משתני מצב חדשים למידע מפורט יותר
  const [foodPreferences, setFoodPreferences] = useState(userPreferences.advancedPreferences?.foodPreferences || '');
  const [travelPace, setTravelPace] = useState(userPreferences.advancedPreferences?.travelPace || 'medium');
  const [travelStyle, setTravelStyle] = useState(userPreferences.advancedPreferences?.travelStyle || 'mixed');
  const [hasChildren, setHasChildren] = useState(userPreferences.advancedPreferences?.hasChildren || false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [specialNeeds, setSpecialNeeds] = useState(userPreferences.advancedPreferences?.specialNeeds || '');

  // פונקציה לעדכון כל ההעדפות הנוספות בתוך userPreferences
  const updateAdvancedPreferences = () => {
    setUserPreferences(prev => ({
      ...prev,
      advancedPreferences: {
        foodPreferences,
        travelPace,
        travelStyle,
        hasChildren,
        specialNeeds
      }
    }));
  };

  const handlePlanTrip = () => {
    // עדכון מפורש של ההעדפות המתקדמות לפני תכנון הטיול
    updateAdvancedPreferences();
    onPlanTrip();
  };

  return (
    <Box mt={2} sx={{ backgroundColor: '#f0f0f0', p: 2, borderRadius: '8px' }} role="form" aria-label="טופס העדפות טיול">
      <Typography variant="h6" sx={{
        color: '#2c3e50',
        fontWeight: 'bold',
        mb: 1,
        display: 'flex',
        alignItems: 'center'
      }} role="heading" aria-level="2">
        <i className="material-icons" style={{ marginRight: '8px' }}>tune</i>
        הגדר את העדפות הטיול שלך
      </Typography>

      {/* שדות בסיסיים */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          id="location"
          name="location"
          label="יעד הטיול"
          value={userPreferences.location}
          onChange={(e) => setUserPreferences(prev => ({ ...prev, location: e.target.value }))}
          sx={{ mt: 1 }}
          aria-label="יעד הטיול"
        />
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <TextField
            id="days"
            name="days"
            label="מספר ימים"
            type="number"
            value={userPreferences.days}
            onChange={(e) => setUserPreferences(prev => ({ ...prev, days: parseInt(e.target.value) || 1 }))}
            sx={{ flex: 1 }}
            aria-label="מספר ימי הטיול"
          />
          <TextField
            id="startDate"
            name="startDate"
            label="תאריך התחלה"
            type="date"
            value={userPreferences.startDate}
            onChange={(e) => setUserPreferences(prev => ({ ...prev, startDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1 }}
            aria-label="תאריך התחלת הטיול"
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <FormControl fullWidth sx={{ flex: 1 }}>
            <InputLabel>תקציב</InputLabel>
            <Select
              id="budget"
              value={userPreferences.budget}
              onChange={(e) => setUserPreferences(prev => ({ ...prev, budget: e.target.value }))}
              label="תקציב"
            >
              <MenuItem value="low">נמוך - חסכוני</MenuItem>
              <MenuItem value="medium">בינוני</MenuItem>
              <MenuItem value="high">גבוה - יוקרתי</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            sx={{
              flex: 1,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1
            }}
          >
            {showAdvancedOptions ? (
              <>
                <i className="material-icons">expand_less</i>
                פחות אפשרויות
              </>
            ) : (
              <>
                <i className="material-icons">expand_more</i>
                יותר אפשרויות
              </>
            )}
          </Button>
        </Box>
      </Box>

      {/* הגדרות מתקדמות */}
      {showAdvancedOptions && (
        <Box sx={{ mt: 2, p: 2, bgcolor: '#e0e0e0', borderRadius: '8px' }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
            העדפות מתקדמות
          </Typography>

          <TextField
            fullWidth
            id="foodPreferences"
            name="foodPreferences"
            label="העדפות אוכל (למשל: צמחוני, כשר, ללא גלוטן)"
            value={foodPreferences}
            onChange={(e) => setFoodPreferences(e.target.value)}
            sx={{ mt: 1 }}
            aria-label="העדפות אוכל"
          />

          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>סגנון הטיול</InputLabel>
            <Select
              value={travelStyle}
              onChange={(e) => setTravelStyle(e.target.value)}
              label="סגנון הטיול"
            >
              {travelStyles.map(style => (
                <MenuItem key={style.value} value={style.value}>{style.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>קצב הטיול</InputLabel>
            <Select
              value={travelPace}
              onChange={(e) => setTravelPace(e.target.value)}
              label="קצב הטיול"
            >
              {paceLevels.map(pace => (
                <MenuItem key={pace.value} value={pace.value}>{pace.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={hasChildren}
                onChange={(e) => setHasChildren(e.target.checked)}
                name="hasChildren"
                color="primary"
              />
            }
            label="כולל ילדים"
            sx={{ mt: 1, display: 'block' }}
          />

          <TextField
            fullWidth
            id="specialNeeds"
            name="specialNeeds"
            label="צרכים מיוחדים או בקשות נוספות"
            value={specialNeeds}
            onChange={(e) => setSpecialNeeds(e.target.value)}
            multiline
            rows={2}
            sx={{ mt: 1 }}
            aria-label="צרכים מיוחדים"
          />

          <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: '#666' }}>
            הגדרות אלו יעזרו לתכנן את הטיול בצורה מותאמת יותר לצרכים שלך
          </Typography>
        </Box>
      )}

      <TextField
        fullWidth
        id="themes"
        name="themes"
        label="נושאי עניין (למשל, טבע, יקבים, קולינריה - מפריד עם פסיק)"
        value={userPreferences.themes.join(', ')}
        onChange={(e) => setUserPreferences(prev => ({ ...prev, themes: e.target.value.split(', ').map(t => t.trim()) }))}
        sx={{ mt: 2 }}
        aria-label="נושאי הטיול"
      />

      <Button
        variant="contained"
        color="primary"
        onClick={handlePlanTrip}
        startIcon={<i className="material-icons">travel_explore</i>}
        sx={{
          mt: 2,
          background: '#4CAF50',
          color: '#fff',
          borderRadius: '8px',
          padding: '10px 20px',
          '&:hover': { background: '#388E3C' }
        }}
        aria-label="תכנן טיול עם AI"
      >
        תכנן טיול מפורט עם AI
      </Button>
      <RoadTripButton onClick={onPlanRoadTrip} />
    </Box>
  );
};

export default PreferencesForm;
