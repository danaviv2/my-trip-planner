/**
 * מסלול משותף — תצוגה לקריאה בלבד.
 *
 * זהו הצד השני של הקישור. עד 04.09.2026 "שתף טיול" שלח
 * `?destination=Rome` והנמען פתח מתכנן ריק; כאן הוא רואה את המסלול
 * עצמו.
 *
 * ── הנמען אינו נדרש להתחבר ──
 * הנתיב יושב מחוץ ל-`ProtectedRoute` בכוונה. שיתוף שדורש הרשמה אינו
 * שיתוף — הוא דף נחיתה, ובן זוג שרק רצה לראות מסלול נוטש. ההגנה היא
 * הקוד עצמו: עשרה תווים מאלפבית בן 31, ו-`list` חסום בחוקי האבטחה
 * כדי שאי אפשר יהיה למנות קודים.
 *
 * ── שלוש תוצאות, ולכל אחת מסך משלה ──
 * טוען · נמצא · לא נמצא-או-פג. מסך אחד לשני המקרים האחרונים הוא נכון
 * כאן דווקא: להבחין בין "הקוד שגוי" ל"הקוד נכון אך פג" הוא לאשר למי
 * שמנחש שהקוד קיים.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Paper, Chip, Button, CircularProgress, Divider,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  Hotel as HotelIcon,
  Place as PlaceIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { getShare } from '../services/sharedTripService';

/** תאריך יום במסלול, נגזר מתאריך ההתחלה. */
const dayDate = (startDate, index) => {
  if (!startDate) return '';
  const d = new Date(startDate);
  if (Number.isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + index);
  return d.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
};

const SharedTripPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, share: null });

  useEffect(() => {
    let alive = true;
    getShare(code)
      .then((share) => alive && setState({ loading: false, share }))
      // כשל רשת ומסמך שאינו קיים מובילים לאותו מסך, כי אין למבקר מה
      // לעשות עם ההבדל.
      .catch(() => alive && setState({ loading: false, share: null }));
    return () => { alive = false; };
  }, [code]);

  if (state.loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh', gap: 2 }}>
        <CircularProgress />
        <Typography color="text.secondary">טוען את המסלול…</Typography>
      </Box>
    );
  }

  if (!state.share) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" fontWeight={800} mb={1}>הקישור אינו זמין</Typography>
        <Typography color="text.secondary" mb={3}>
          ייתכן שהשיתוף בוטל, שפג תוקפו, או שהכתובת אינה מדויקת.
          בקש מהמשתף קישור חדש.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>לדף הבית</Button>
      </Container>
    );
  }

  const { snapshot = {}, expiresAt } = state.share;
  const days = snapshot.dailyItinerary || [];

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 3 }}>
        <Chip
          icon={<ViewIcon sx={{ fontSize: 17 }} />}
          label="מסלול משותף — לצפייה בלבד"
          size="small"
          sx={{ mb: 1.5, fontWeight: 600 }}
        />
        <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.2 }}>
          {snapshot.destination || 'מסלול'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1, color: 'text.secondary' }}>
          {snapshot.days > 0 && (
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: .5 }}>
              <CalendarIcon sx={{ fontSize: 17 }} /> {snapshot.days} ימים
            </Typography>
          )}
          {snapshot.startDate && (
            <Typography variant="body2">
              {new Date(snapshot.startDate).toLocaleDateString('he-IL')}
            </Typography>
          )}
        </Box>
      </Box>

      {days.length === 0 && (
        <Typography color="text.secondary">אין ימים במסלול הזה.</Typography>
      )}

      {days.map((day, i) => (
        <Paper key={day.day ?? i} elevation={0}
          sx={{ p: { xs: 2, md: 3 }, mb: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '.08em' }}>
            יום {day.day ?? i + 1}{dayDate(snapshot.startDate, i) ? ` · ${dayDate(snapshot.startDate, i)}` : ''}
          </Typography>
          <Typography variant="h6" fontWeight={700} sx={{ mt: .25, lineHeight: 1.3 }}>
            {day.title || ''}
          </Typography>
          {day.theme && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{day.theme}</Typography>
          )}

          {(day.activities || []).map((act, j) => (
            <Box key={j} sx={{ display: 'flex', gap: 1.5, py: 1.25,
                               borderTop: j === 0 ? 'none' : '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" sx={{
                minWidth: 52, fontWeight: 700, color: 'primary.main',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {act.time || '—'}
              </Typography>
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={600} sx={{ lineHeight: 1.35 }}>{act.name}</Typography>
                {act.description && (
                  <Typography variant="body2" color="text.secondary">{act.description}</Typography>
                )}
                {act.address && (
                  <Typography variant="caption" color="text.secondary"
                    sx={{ display: 'flex', alignItems: 'center', gap: .4, mt: .4 }}>
                    <PlaceIcon sx={{ fontSize: 14 }} /> {act.address}
                  </Typography>
                )}
                {/* המחיר מוצג רק כשהוא קיים: "מחיר: —" נראה כמו נתון
                    חסר ולא כמו שדה שלא מולא. */}
                {act.price && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {act.price}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}

          {day.hotel?.name && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <HotelIcon sx={{ fontSize: 19, color: 'text.secondary', mt: .3 }} />
                <Box>
                  <Typography fontWeight={600}>{day.hotel.name}</Typography>
                  {day.hotel.address && (
                    <Typography variant="caption" color="text.secondary">{day.hotel.address}</Typography>
                  )}
                </Box>
              </Box>
            </>
          )}
        </Paper>
      ))}

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        {expiresAt && (
          <Typography variant="caption" color="text.secondary" display="block" mb={2}>
            הקישור זמין עד {new Date(expiresAt).toLocaleDateString('he-IL')}
          </Typography>
        )}
        <Button variant="outlined" onClick={() => navigate('/trip-planner')}>
          תכנן טיול משלך
        </Button>
      </Box>
    </Container>
  );
};

export default SharedTripPage;
