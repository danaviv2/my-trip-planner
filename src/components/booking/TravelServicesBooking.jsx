import React, { useMemo, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Paper,
  Box,
  Alert,
  AlertTitle,
  Card,
  CardContent,
  Chip,
  Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';

import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import { useBookings } from '../../contexts/BookingsContext';
import { providerLinks } from '../../services/providerLinks';

/**
 * מסך הזמנת שירותי נסיעה.
 *
 * הגרסה הקודמת הציגה אשף תשלום מלא: היא דרשה מספר כרטיס אשראי ו-CVV,
 * המתינה שנייה וחצי, והודיעה "ההזמנה שלך התקבלה בהצלחה" — בעוד שהקריאה
 * לשרת הייתה מסומנת כהערה ושום בקשה לא נשלחה לשום מקום. משתמש שהאמין
 * לה היה עלול להגיע לשדה התעופה בלי כרטיס.
 *
 * כאן המסך עושה את מה שהוא באמת יכול: אוסף את פרטי החיפוש, ומעביר
 * לספק שבאמת מבצע את ההזמנה. פרטי התשלום נמסרים לספק ישירות ואינם
 * עוברים דרכנו כלל.
 */

const serviceTypes = [
  { value: 'flight', label: '✈️ טיסות' },
  { value: 'hotel', label: '🏨 בתי מלון' },
  { value: 'car', label: '🚗 השכרת רכב' },
  { value: 'tour', label: '🎫 סיורים ואטרקציות' },
];

const toDate = (v) => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const TravelServicesBooking = () => {
  const { userPreferences } = useUserPreferences() || {};
  const { trips } = useBookings() || { trips: [] };

  const [serviceType, setServiceType] = useState('flight');
  const [destination, setDestination] = useState(userPreferences?.location || '');
  const [origin, setOrigin] = useState('TLV');
  const [startDate, setStartDate] = useState(toDate(userPreferences?.startDate));
  const [endDate, setEndDate] = useState(null);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const links = useMemo(
    () => providerLinks(serviceType, { destination, origin, startDate, endDate, adults, children }),
    [serviceType, destination, origin, startDate, endDate, adults, children]
  );

  /** ממלא את הטופס מנסיעה שכבר יובאה מהמייל, במקום הקלדה מחדש. */
  const fillFromTrip = (trip) => {
    setDestination(trip.destination || '');
    setStartDate(toDate(trip.startDate));
    setEndDate(toDate(trip.endDate));
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', pt: 10, pb: 6 }}>
      <Container maxWidth="md">
        <Typography variant="h4" sx={{ color: '#fff', fontWeight: 800, mb: 1, textAlign: 'center' }}>
          הזמנת שירותי נסיעה
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', mb: 3, textAlign: 'center' }}>
          מלא את הפרטים ונפנה אותך לספקים עם החיפוש מוכן
        </Typography>

        <Paper elevation={4} sx={{ p: 3, borderRadius: '14px' }}>
          {/* אמירה מפורשת של מה שקורה כאן. השקיפות הזו היא בדיוק מה
              שחסר בגרסה הקודמת, שהודיעה על הזמנה שמעולם לא בוצעה. */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <AlertTitle sx={{ fontWeight: 700, mb: 0.25 }}>ההזמנה מתבצעת אצל הספק</AlertTitle>
            אנחנו לא גובים תשלום ולא מבקשים פרטי אשראי. הכפתורים למטה פותחים את
            אתר הספק עם היעד והתאריכים שמילאת, וההזמנה והתשלום נעשים שם.
          </Alert>

          {/* נסיעות שכבר יובאו מהמייל — קיצור דרך במקום הקלדה חוזרת */}
          {trips.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                מלא מתוך נסיעה קיימת:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {trips.map((trip) => (
                  <Chip
                    key={trip.id}
                    label={`${trip.destination} · ${trip.startDate}`}
                    onClick={() => fillFromTrip(trip)}
                    variant="outlined"
                    clickable
                  />
                ))}
              </Box>
              <Divider sx={{ mt: 2 }} />
            </Box>
          )}

          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="מה מחפשים?"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
              >
                {serviceTypes.map((s) => (
                  <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                ))}
              </TextField>
            </Grid>

            {serviceType === 'flight' && (
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="ממוצא"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  helperText="קוד שדה או שם עיר"
                />
              </Grid>
            )}

            <Grid item xs={12} sm={serviceType === 'flight' ? 8 : 12}>
              <TextField
                fullWidth
                required
                label="יעד"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="למשל: נאפולי, רומא, ברצלונה"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
                <DatePicker
                  label="תאריך התחלה"
                  value={startDate}
                  onChange={setStartDate}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
                <DatePicker
                  label="תאריך סיום"
                  value={endDate}
                  onChange={setEndDate}
                  minDate={startDate || undefined}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={6} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="מבוגרים"
                value={adults}
                onChange={(e) => setAdults(Math.max(1, Number(e.target.value) || 1))}
                inputProps={{ min: 1, max: 12 }}
              />
            </Grid>

            <Grid item xs={6} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="ילדים"
                value={children}
                onChange={(e) => setChildren(Math.max(0, Number(e.target.value) || 0))}
                inputProps={{ min: 0, max: 10 }}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4 }}>
            {!destination.trim() ? (
              <Alert severity="warning">הזן יעד כדי לראות את אפשרויות ההזמנה.</Alert>
            ) : (
              <>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                  המשך אצל אחד מהספקים:
                </Typography>
                <Grid container spacing={2}>
                  {links.map((p) => (
                    <Grid item xs={12} sm={6} key={p.id}>
                      <Card variant="outlined" sx={{ height: '100%', borderRadius: '10px' }}>
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{p.name}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                            {p.note}
                          </Typography>
                          <Button
                            fullWidth
                            variant="contained"
                            href={p.url}
                            target="_blank"
                            // noopener מונע מהאתר הנפתח גישה לחלון שלנו
                            rel="noopener noreferrer"
                          >
                            חפש ב-{p.name}
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                  לאחר שתזמין, אישור ההזמנה שיגיע למייל ייקלט אוטומטית ויתווסף לנסיעות שלך.
                </Typography>
              </>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default TravelServicesBooking;
