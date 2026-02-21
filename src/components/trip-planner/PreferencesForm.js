// src/components/trip-planner/PreferencesForm.js
import React, { useState, useContext } from 'react';
import { 
  Box, Typography, TextField, Button, 
  FormControl, InputLabel, Select, MenuItem, 
  Checkbox, FormControlLabel 
} from '@mui/material';
import { useTripContext } from '../../contexts/TripContext';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
// הגדרת סגנונות טיול לשימוש בטופס העדפות
const travelStyles = [
  { value: 'cultural', label: 'תרבותי - מוזיאונים, היסטוריה, אמנות' },
  { value: 'adventure', label: 'הרפתקני - טיולים, ספורט אתגרי' },
  { value: 'relaxation', label: 'מנוחה - ספא, חופים, הרפיה' },
  { value: 'culinary', label: 'קולינרי - אוכל, יין, שווקים' },
  { value: 'nature', label: 'טבע - פארקים, נופים, חיות בר' },
  { value: 'urban', label: 'עירוני - קניות, אטרקציות עירוניות' },
  { value: 'mixed', label: 'מעורב - שילוב של מספר סגנונות' }
];

// הגדרת רמות קצב לשימוש בטופס העדפות
const paceLevels = [
  { value: 'slow', label: 'איטי - מעט פעילויות, הרבה זמן פנוי' },
  { value: 'medium', label: 'בינוני - איזון בין פעילויות ומנוחה' },
  { value: 'fast', label: 'מהיר - ימים עמוסים, הרבה פעילויות' }
];

/**
 * PreferencesForm - טופס העדפות טיול
 * מאפשר למשתמש להגדיר העדפות מפורטות לתכנון הטיול
 */
const PreferencesForm = () => {
  const { planTripWithAI, planRoadTrip } = useTripContext();
const { userPreferences, updateLocation, updateBudget, updateDays, updateStartDate, updateThemes, updateAdvancedPreferences } = useUserPreferences();
  // הוספת משתני מצב מקומיים
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [foodPreferences, setFoodPreferences] = useState(userPreferences.advancedPreferences?.foodPreferences || '');
  const [travelPace, setTravelPace] = useState(userPreferences.advancedPreferences?.travelPace || 'medium');
  const [travelStyle, setTravelStyle] = useState(userPreferences.advancedPreferences?.travelStyle || 'mixed');
  const [hasChildren, setHasChildren] = useState(userPreferences.advancedPreferences?.hasChildren || false);
  const [specialNeeds, setSpecialNeeds] = useState(userPreferences.advancedPreferences?.specialNeeds || '');
  
  // פונקציה לתכנון טיול עם עדכון מפורש של ההעדפות המתקדמות
  const handlePlanTrip = () => {
    updateAdvancedPreferences({
      foodPreferences,
      travelPace,
      travelStyle,
      hasChildren,
      specialNeeds
    });
    planTripWithAI();
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
          onChange={(e) => updateLocation(e.target.value)}
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
            onChange={(e) => updateDays(e.target.value)}
            sx={{ flex: 1 }}
            aria-label="מספר ימי הטיול"
          />
          <TextField
            id="startDate"
            name="startDate"
            label="תאריך התחלה"
            type="date"
            value={userPreferences.startDate}
            onChange={(e) => updateStartDate(e.target.value)}
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
              onChange={(e) => updateBudget(e.target.value)}
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
        value={(userPreferences.themes || []).join(', ')}
        onChange={(e) => updateThemes(e.target.value.split(', ').map(t => t.trim()))}
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
      
      <Button 
        variant="contained" 
        color="secondary" 
        onClick={planRoadTrip}
        startIcon={<i className="material-icons">explore</i>}
        sx={{ 
          mt: 2, 
          ml: 2,
          background: '#9C27B0', 
          color: '#fff', 
          borderRadius: '8px', 
          padding: '10px 20px',
          '&:hover': { background: '#7B1FA2' } 
        }} 
        aria-label="תכנן טיול מתגלגל לאורך המסלול"
      >
        תכנן טיול מתגלגל לאורך המסלול
      </Button>
    </Box>
  );
};

export default PreferencesForm;