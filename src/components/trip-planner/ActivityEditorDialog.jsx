import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  MenuItem, Grid, Alert, CircularProgress, Box, Typography,
} from '@mui/material';
import { locatePlace, isGoodCoord } from '../../services/placeLookupService';

/**
 * הוספה ועריכה של פעילות ביום מסוים.
 *
 * המסלול הוא הצעה של מודל, לא גזירת גורל. עד כה הדרך היחידה לשנות משהו
 * הייתה "צור מסלול מחדש" — שמגריל את כל הימים ומוחק גם את מה שהמשתמש
 * אהב. בלי עריכה גם ההתראות שנבנו מצביעות על דלת נעולה: הצלבת הכרטיסים
 * אומרת "הוסף את פומפיי למסלול", ולא היה כיצד.
 *
 * הדיאלוג הקודם בקומפוננטה קרא את הערכים ב-document.querySelector, כתב
 * שמות שדות שאיש אינו קורא (startTime מול time), ואפשר לבחור רק מתוך
 * רשימת אטרקציות מוכנה. הוא גם לא היה מחובר לשום כפתור. לכן נכתב מחדש.
 */

// אותם סוגים שהמסלול מייצר, עם הסמלים שהתצוגה מסתמכת עליהם
const TYPES = [
  { value: 'attraction', label: 'אטרקציה', emoji: '🏛️' },
  { value: 'museum', label: 'מוזיאון', emoji: '🖼️' },
  { value: 'food', label: 'אוכל', emoji: '🍽️' },
  { value: 'nature', label: 'טבע', emoji: '🌳' },
  { value: 'beach', label: 'חוף', emoji: '🏖️' },
  { value: 'shopping', label: 'קניות', emoji: '🛍️' },
  { value: 'nightlife', label: 'חיי לילה', emoji: '🍸' },
  { value: 'transport', label: 'מעבר', emoji: '🚌' },
  { value: 'rest', label: 'מנוחה', emoji: '☕' },
];

const EMPTY = {
  time: '09:00', name: '', type: 'attraction', duration: '2h',
  address: '', description: '', price: '', tips: '',
};

const ActivityEditorDialog = ({ open, activity, dayTitle, destination, onClose, onSave }) => {
  const [form, setForm] = useState(EMPTY);
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState(null);

  const isEdit = !!activity;

  useEffect(() => {
    if (!open) return;
    setForm(activity ? { ...EMPTY, ...activity } : EMPTY);
    setLocationNote(null);
  }, [open, activity]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // המקום נבדק מול מקור חיצוני ולא מנוחש. הפרדה בין "המקום נמצא" לבין
  // "הרחוב נמצא" נשמרת גם כאן, כי היא ההבדל בין נקודה אמיתית על המפה
  // לבין נקודה שנראית אמיתית.
  const handleSave = async () => {
    const name = form.name.trim();
    if (!name) return;

    const addressChanged = isEdit && form.address !== (activity.address || '');
    const nameChanged = isEdit && name !== (activity.name || '');
    const keepCoords = isEdit && !addressChanged && !nameChanged && isGoodCoord(activity);

    let next = {
      ...form,
      name,
      emoji: TYPES.find((t) => t.value === form.type)?.emoji || '📍',
    };

    if (keepCoords) {
      onSave(next);
      onClose();
      return;
    }

    setLocating(true);
    const { coords, confidence } = await locatePlace(name, form.address.trim(), destination);
    setLocating(false);

    // שדות הוודאות מנוקים תחילה, אחרת סימון ישן נשאר על מקום שאומת מחדש
    delete next.unverified;
    delete next.nameUnverified;
    delete next.approxCoord;

    if (coords) {
      next = { ...next, lat: coords.lat, lng: coords.lng };
      if (confidence === 'address') next.nameUnverified = true;
    } else {
      // אין מיקום, ואסור להמציא לו אחד. הכרטיס בלוח הזמנים כבר מציג
      // תגית "לא אומת" לפי השדה הזה, ולכן ההסבר מגיע למשתמש שם ולא
      // בחלון שנעלם.
      next = { ...next, lat: undefined, lng: undefined, unverified: true };
    }

    onSave(next);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {isEdit ? 'עריכת פעילות' : 'הוספת פעילות'}
        {dayTitle && (
          <Typography variant="body2" color="text.secondary">{dayTitle}</Typography>
        )}
      </DialogTitle>

      <DialogContent dividers>
        {locationNote && <Alert severity="warning" sx={{ mb: 2 }}>{locationNote}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth autoFocus label="שם המקום" value={form.name} onChange={set('name')}
              placeholder="למשל: Musée d'Orsay"
            />
          </Grid>

          <Grid item xs={6} sm={4}>
            <TextField
              fullWidth label="שעה" type="time" value={form.time} onChange={set('time')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={6} sm={4}>
            <TextField
              fullWidth label="משך" value={form.duration} onChange={set('duration')}
              placeholder="2h"
              helperText="2h · 1h30m · 45m"
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField select fullWidth label="סוג" value={form.type} onChange={set('type')}>
              {TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.emoji} {t.label}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth label="כתובת" value={form.address} onChange={set('address')}
              helperText="משמשת לאיתור המקום על המפה ולחישוב זמני הנסיעה"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="מחיר" value={form.price} onChange={set('price')} placeholder="€13 / חינם" />
          </Grid>

          <Grid item xs={12}>
            <TextField fullWidth label="תיאור" multiline rows={2} value={form.description} onChange={set('description')} />
          </Grid>

          <Grid item xs={12}>
            <TextField fullWidth label="טיפ" value={form.tips} onChange={set('tips')} />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={locating}>ביטול</Button>
        <Box sx={{ position: 'relative' }}>
          <Button
            variant="contained" onClick={handleSave}
            disabled={locating || !form.name.trim()}
            startIcon={locating ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {locating ? 'מאתר את המקום...' : isEdit ? 'שמור' : 'הוסף'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ActivityEditorDialog;
