import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Checkbox,
  Button
} from '@mui/material';

/**
 * חלון עריכת פעילות במסלול.
 *
 * הרכיב היה מוגדר בתוך הפונקציה App. בקוד המקורי נוסה לתקן את "בעיית ההקלדה"
 * על ידי פיצול ה-state ל-10 משתנים נפרדים, אבל זה טיפל בסימפטום: הסיבה
 * האמיתית היא שרכיב שמוגדר בתוך רכיב אחר מקבל זהות חדשה בכל render, ולכן
 * React מפרק ובונה אותו מחדש — יחד עם כל ה-state והפוקוס. ההוצאה לקובץ
 * נפרד מתקנת את השורש.
 *
 * לוגיקת עדכון המסלול נשארה ב-App ומועברת דרך onSave, כדי לשמור התנהגות זהה.
 */
const EditAttractionModal = ({ open, onClose, attraction, defaultLocation, onSave }) => {
  // שימוש במצבים נפרדים לכל שדה במקום אובייקט אחד
  const [activityTime, setActivityTime] = useState('');
  const [activityName, setActivityName] = useState('');
  const [activityCategory, setActivityCategory] = useState('');
  const [activityAddress, setActivityAddress] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [activityOpeningHours, setActivityOpeningHours] = useState('');
  const [activityTips, setActivityTips] = useState('');
  const [activityDuration, setActivityDuration] = useState('');
  const [activityPrice, setActivityPrice] = useState('');
  const [activityReservation, setActivityReservation] = useState(false);

  // הגדרת שדות הקלט המצויים בטופס
  const activityTypes = [
    { value: 'breakfast', label: 'ארוחת בוקר' },
    { value: 'lunch', label: 'ארוחת צהריים' },
    { value: 'dinner', label: 'ארוחת ערב' },
    { value: 'attraction', label: 'אטרקציה' },
    { value: 'museum', label: 'מוזיאון' },
    { value: 'tour', label: 'סיור' },
    { value: 'activity', label: 'פעילות' },
    { value: 'shopping', label: 'קניות' },
    { value: 'accommodation', label: 'לינה' },
    { value: 'transport', label: 'תחבורה' },
  ];

  // עדכון הערכים בפתיחת החלון
  useEffect(() => {
    if (open && attraction) {
      setActivityTime(attraction.timeStart || attraction.time || '');
      setActivityName(attraction.name || '');
      setActivityCategory(attraction.category || '');
      setActivityAddress(attraction.address || '');
      setActivityDescription(attraction.description || '');
      setActivityOpeningHours(attraction.openingHours || '');
      setActivityTips(attraction.tips || '');
      setActivityDuration(attraction.recommendedDuration || '');
      setActivityPrice(attraction.entranceFee || attraction.priceRange || '');
      setActivityReservation(attraction.reservationNeeded || false);
    }
  }, [open, attraction]);

  // שמירה - מאחדת את כל השדות חזרה לאובייקט אחד
  const handleSave = () => {
    const updatedAttraction = {
      ...attraction,
      time: activityTime,
      timeStart: activityTime,
      name: activityName,
      category: activityCategory,
      address: activityAddress,
      description: activityDescription,
      openingHours: activityOpeningHours,
      tips: activityTips,
      recommendedDuration: activityDuration,
      entranceFee: activityPrice,
      reservationNeeded: activityReservation
    };

    // האם זו פעילות מזון? אם כן, נעדכן את ה-priceRange במקום ה-entranceFee
    if (['breakfast', 'lunch', 'dinner'].includes(activityCategory)) {
      updatedAttraction.priceRange = activityPrice;
      delete updatedAttraction.entranceFee;
    }

    onSave(updatedAttraction);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="edit-attraction-modal-title"
      aria-describedby="edit-attraction-modal-description"
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '600px',
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 3,
        borderRadius: '12px',
        maxHeight: '80vh',
        overflow: 'auto'
      }} role="dialog" aria-label="עריכת פעילות">
        <Typography id="edit-attraction-modal-title" variant="h6" sx={{
          color: '#2c3e50',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          mb: 2,
          borderBottom: '2px solid #e0e0e0',
          paddingBottom: '8px'
        }} role="heading" aria-level="1">
          <i className="material-icons" style={{ marginRight: '8px' }}>edit</i>
          עריכת פעילות
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
            הכנס את פרטי הפעילות:
          </Typography>

          <Grid container spacing={2}>
            {/* שורה ראשונה - סוג פעילות וזמן */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>סוג פעילות</InputLabel>
                <Select
                  value={activityCategory}
                  onChange={(e) => setActivityCategory(e.target.value)}
                  label="סוג פעילות"
                  MenuProps={{ style: { zIndex: 9999 } }}
                >
                  {activityTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="זמן (למשל, 10:00-12:00)"
                value={activityTime}
                onChange={(e) => setActivityTime(e.target.value)}
                aria-label="זמן הפעילות"
              />
            </Grid>

            {/* שם ומיקום */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="שם הפעילות"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                aria-label="שם הפעילות"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="כתובת"
                value={activityAddress}
                onChange={(e) => setActivityAddress(e.target.value)}
                aria-label="כתובת הפעילות"
              />
            </Grid>

            {/* פרטים נוספים */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="שעות פתיחה"
                value={activityOpeningHours}
                onChange={(e) => setActivityOpeningHours(e.target.value)}
                aria-label="שעות פתיחה של הפעילות"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={activityCategory && ['breakfast', 'lunch', 'dinner'].includes(activityCategory) ?
                  "טווח מחירים (€, €€, €€€)" :
                  "מחיר כניסה"}
                value={activityPrice}
                onChange={(e) => setActivityPrice(e.target.value)}
                aria-label="מחיר"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="משך זמן מומלץ"
                value={activityDuration}
                onChange={(e) => setActivityDuration(e.target.value)}
                aria-label="משך זמן מומלץ לפעילות"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={activityReservation}
                    onChange={(e) => setActivityReservation(e.target.checked)}
                    color="primary"
                  />
                }
                label="נדרשת הזמנה מראש"
              />
            </Grid>

            {/* תיאור וטיפים */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="תיאור מפורט"
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
                multiline
                rows={3}
                aria-label="תיאור הפעילות"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="טיפים למבקרים"
                value={activityTips}
                onChange={(e) => setActivityTips(e.target.value)}
                multiline
                rows={2}
                aria-label="טיפים למבקרים בפעילות"
              />
            </Grid>
          </Grid>
        </Box>

        {/* כפתורי מידע נוסף */}
        <Box sx={{ mt: 2, mb: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            מידע נוסף:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(activityName + ' ' + defaultLocation)}`)}
              startIcon={<i className="material-icons">search</i>}
              sx={{ borderRadius: '8px' }}
            >
              חפש בגוגל
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => window.open(`https://www.tripadvisor.com/Search?q=${encodeURIComponent(activityName + ' ' + defaultLocation)}`)}
              startIcon={<i className="material-icons">star</i>}
              sx={{ borderRadius: '8px' }}
            >
              ביקורות TripAdvisor
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activityAddress || activityName + ' ' + defaultLocation)}`)}
              startIcon={<i className="material-icons">place</i>}
              sx={{ borderRadius: '8px' }}
            >
              הצג במפה
            </Button>
          </Box>
        </Box>

        {/* כפתורי שמירה וביטול */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2,
          mt: 3,
          pt: 2,
          borderTop: '1px solid #e0e0e0'
        }} role="group" aria-label="פעולות שמירה וביטול">
          <Button
            variant="contained"
            onClick={handleSave}
            startIcon={<i className="material-icons">save</i>}
            sx={{
              background: '#4CAF50',
              color: '#fff',
              borderRadius: '8px',
              '&:hover': { background: '#388E3C' }
            }}
            aria-label="שמור פעילות"
          >
            שמור
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={onClose}
            startIcon={<i className="material-icons">cancel</i>}
            sx={{ borderRadius: '8px' }}
            aria-label="בטל עריכת פעילות"
          >
            בטל
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default EditAttractionModal;
