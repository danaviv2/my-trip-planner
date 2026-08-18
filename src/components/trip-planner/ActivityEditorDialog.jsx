import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  MenuItem, Grid, Alert, CircularProgress, Box, Typography, InputAdornment,
  IconButton, List, ListItemButton, ListItemText, Chip, Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { locatePlace, searchPlaces, isGoodCoord } from '../../services/placeLookupService';

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

/**
 * סוג OSM → סוג הפעילות שלנו, כדי שבחירת מקום תמלא גם את הסוג והסמל.
 * לא כל סיווג ממופה; מה שאינו מוכר נשאר על הבחירה הקיימת.
 */
const KIND_TO_TYPE = {
  'amenity/restaurant': 'food', 'amenity/cafe': 'food', 'amenity/fast_food': 'food',
  'amenity/bar': 'nightlife', 'amenity/pub': 'nightlife', 'amenity/nightclub': 'nightlife',
  'amenity/ice_cream': 'food', 'shop/bakery': 'food',
  'tourism/museum': 'museum', 'tourism/gallery': 'museum', 'amenity/arts_centre': 'museum',
  'tourism/attraction': 'attraction', 'tourism/artwork': 'attraction',
  'tourism/viewpoint': 'attraction', 'tourism/theme_park': 'attraction', 'tourism/zoo': 'attraction',
  'man_made/tower': 'attraction',
  'leisure/park': 'nature', 'leisure/garden': 'nature', 'leisure/nature_reserve': 'nature',
  'natural/beach': 'beach',
  'amenity/marketplace': 'shopping',
};

const EMPTY = {
  time: '09:00', name: '', type: 'attraction', duration: '2h',
  address: '', description: '', price: '', tips: '',
};

const ActivityEditorDialog = ({ open, activity, dayTitle, destination, onClose, onSave }) => {
  const [form, setForm] = useState(EMPTY);
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState(null);
  // תוצאות החיפוש. הבחירה של המשתמש היא האימות: חיפוש "Les Cocottes"
  // מחזיר גם מסעדה וגם חנות בעלת שם דומה, ולקיחת הראשונה נועלת כתובת
  // שגויה תחת סימון "אומת".
  const [candidates, setCandidates] = useState(null);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState(null);
  // איזו רשומה מציגה כרגע את שעות הפתיחה במקום את התגית
  const [shownHours, setShownHours] = useState(null);

  const isEdit = !!activity;

  useEffect(() => {
    if (!open) return;
    setForm(activity ? { ...EMPTY, ...activity } : EMPTY);
    setLocationNote(null);
    setCandidates(null);
    setPicked(null);
    setShownHours(null);
  }, [open, activity]);

  // שינוי ידני בשם או בכתובת מבטל מקום שנבחר: הקואורדינטות שייכות למה
  // שנבחר, ולא למה שנכתב אחריו.
  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (key === 'name' || key === 'address') setPicked(null);
  };

  const runSearch = async () => {
    const name = form.name.trim();
    if (!name) return;
    setSearching(true);
    setCandidates(await searchPlaces(name, destination));
    setSearching(false);
  };

  /**
   * שדה fee ב-OSM הוא לעיתים סכום ("10-25€") ולעיתים בוליאני ("yes"/"no").
   * "yes" אינו מחיר אלא ידיעה שיש תשלום, ומילויו בשדה המחיר היה יוצר
   * "מחיר: yes" על הכרטיס.
   */
  const priceFromFee = (fee) => {
    const v = String(fee || '').trim().toLowerCase();
    if (!v || v === 'yes') return '';
    if (v === 'no' || v === 'free') return 'חינם';
    return fee;
  };

  /** בחירת מקום ממלאת את כל מה שידוע עליו — ושום דבר שאינו ידוע. */
  const choose = (place) => {
    setPicked(place);
    setCandidates(null);
    setForm((f) => ({
      ...f,
      name: place.label || f.name,
      address: place.address,
      type: KIND_TO_TYPE[place.kind] || f.type,
      price: priceFromFee(place.fee) || f.price,
      // שעות ואתר הם שדות בפני עצמם ולא טקסט חופשי: דחיסתם לתיאור מנעה
      // הצגה שלהם ככפתור על הכרטיס, והפכה אותם למחרוזת שאי אפשר לפעול לפיה.
      openingHours: place.openingHours || f.openingHours || '',
      website: place.website || f.website || '',
      description: f.description || place.cuisine || '',
    }));
  };

  // המקום נבדק מול מקור חיצוני ולא מנוחש. הפרדה בין "המקום נמצא" לבין
  // "הרחוב נמצא" נשמרת גם כאן, כי היא ההבדל בין נקודה אמיתית על המפה
  // לבין נקודה שנראית אמיתית.
  const handleSave = async () => {
    const name = form.name.trim();
    if (!name) return;

    // מקום שנבחר מהרשימה כבר אומת על ידי המשתמש — אין צורך לחפש שוב.
    if (picked) {
      onSave({
        ...form,
        name,
        lat: picked.lat,
        lng: picked.lng,
        website: picked.website || undefined,
        openingHours: picked.openingHours || undefined,
        emoji: TYPES.find((t) => t.value === form.type)?.emoji || '📍',
      });
      onClose();
      return;
    }

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
    const { coords, confidence } = await locatePlace(name, form.address.trim(), destination, form.type);
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
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); runSearch(); } }}
              helperText={picked ? '✓ מקום נבחר — הכתובת והמיקום מאומתים' : 'הקלד שם ולחץ חיפוש כדי למלא את שאר הפרטים'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={runSearch} disabled={searching || !form.name.trim()} title="חפש את המקום">
                      {searching ? <CircularProgress size={20} /> : <SearchIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* מועמדים. הבחירה של המשתמש היא האימות — במקום שהמערכת תכריע
              לבד ותנעל כתובת שגויה תחת סימון "אומת". */}
          {candidates && (
            <Grid item xs={12}>
              {candidates.length === 0 ? (
                <Alert severity="info">
                  לא נמצא מקום בשם הזה. אפשר למלא את הפרטים ידנית — הפעילות תתווסף
                  ללוח הזמנים ותסומן כלא מאומתת על המפה.
                </Alert>
              ) : (
                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ px: 1.5, pt: 1, display: 'block', color: 'text.secondary' }}>
                    בחר את המקום הנכון ({candidates.length} תוצאות)
                  </Typography>
                  {/* שמות בעברית קיימים ב-OpenStreetMap רק על חלק מהרשומות:
                      "מוזיאון הלובר" מחזיר את הפירמידה, בעוד הרשומה של
                      המוזיאון עצמה — זו שיש בה שעות ומחיר — נמצאת רק תחת
                      השם הלועזי. */}
                  {/[\u0590-\u05FF]/.test(form.name) && candidates.length < 4 && (
                    <Typography variant="caption" sx={{ px: 1.5, pb: 0.5, display: 'block', color: 'warning.dark' }}>
                      מעט תוצאות. נסה את השם באנגלית או בשפת המקום — למשל "Louvre" — שם יש לרוב גם שעות ומחיר.
                    </Typography>
                  )}
                  <List dense disablePadding>
                    {candidates.map((c, i) => (
                      <React.Fragment key={c.id}>
                        {i > 0 && <Divider component="li" />}
                        <ListItemButton onClick={() => choose(c)} alignItems="flex-start">
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                                <Typography variant="body2" fontWeight={700}>{c.label}</Typography>
                                <Chip size="small" label={c.kind} sx={{ height: 18, fontSize: '0.65rem' }} />
                                {/* תגיות שהן פעולה ולא קישוט: "אתר" פותח
                                    את האתר, "שעות" מציג אותן. תגית שנראית
                                    לחיצה וסתם יושבת היא הבטחה ריקה. */}
                                {c.website && (
                                  <Chip
                                    size="small" color="success" label="אתר" clickable
                                    onClick={(e) => { e.stopPropagation(); window.open(c.website, '_blank', 'noopener,noreferrer'); }}
                                    sx={{ height: 20, fontSize: '0.65rem' }}
                                  />
                                )}
                                {c.openingHours && (
                                  <Chip
                                    size="small" color="info" clickable
                                    label={shownHours === c.id ? c.openingHours : 'שעות'}
                                    onClick={(e) => { e.stopPropagation(); setShownHours(shownHours === c.id ? null : c.id); }}
                                    sx={{ height: 20, fontSize: '0.65rem', maxWidth: 320 }}
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {c.address.split(',').slice(0, 4).join(',')}
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      </React.Fragment>
                    ))}
                  </List>
                </Box>
              )}
            </Grid>
          )}

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

          {/* מה שנקלט מהמקום. בלי התצוגה הזו השעות והאתר נשמרים בשקט
              ונראים כאילו אבדו — המשתמש בחר מקום שהיו לו שעות ואתר,
              והטופס לא הראה מהם. */}
          {(form.openingHours || form.website) && (
            <Grid item xs={12}>
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap',
                p: 1, bgcolor: 'action.hover', borderRadius: 1,
              }}>
                {form.openingHours && (
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'info.dark' }}>
                    🕒 {form.openingHours}
                  </Typography>
                )}
                {form.website && (
                  <Button
                    size="small"
                    onClick={() => window.open(form.website, '_blank', 'noopener,noreferrer')}
                    sx={{ minWidth: 0, px: 1, py: 0, fontSize: '0.7rem', fontWeight: 700 }}
                  >
                    🌐 האתר הרשמי
                  </Button>
                )}
              </Box>
            </Grid>
          )}

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
