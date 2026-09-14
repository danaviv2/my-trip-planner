import React, { useState } from 'react';
import {
  Alert, AlertTitle, Box, Button, Paper, TextField, Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { fetchFlightStatus, formatClock } from '../../services/flightStatusService';
import FlightRights from './FlightRights';

// "YYYY-MM-DD" מקומי. `toISOString` מחזיר UTC, וחצות בישראל היא אתמול —
// המלכודת שכבר נשרפה ב-openMeteoService.
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// מצבי AeroDataBox שנצפו בפועל (EnRoute ב-LY 315, 14.09.2026) ומתועדים אצלם.
// מצב שאינו ברשימה מוצג כמו שהוא — עדיף מילה באנגלית מאשר תרגום מומצא.
const STATUS_KEYS = ['Expected', 'EnRoute', 'CheckIn', 'Boarding', 'GateClosed', 'Departed', 'Delayed', 'Approaching', 'Arrived', 'Canceled', 'Diverted', 'CanceledUncertain'];

/**
 * בדיקת מצב טיסה, בלי הרשמה ובלי הזמנה שמורה.
 *
 * ── למה ──
 * עד 14.09.2026 מצב טיסה נבדק רק מתוך כרטיס "מה מגיע לך" של טיסה שכבר
 * יובאה — כלומר אחרי הרשמה, סריקה ופענוח. MyTravel מציגים בדיקה כזו בדף
 * הראשי, והיא הדבר השימושי הראשון שמבקר חדש יכול לעשות. אצלנו היא מוסיפה
 * את מה שאצלם אין: כמה פיצוי מגיע על העיכוב, מאותו חישוב שכבר קיים.
 *
 * העלות מוגנת בשרת: התשובה נשמרת במטמון המשותף (api/flight-status.mjs),
 * ולכן אותה טיסה שנבדקת שוב אינה צורכת מהמכסה בתשלום.
 */
const FlightLookupCard = () => {
  const { t } = useTranslation();
  const [number, setNumber] = useState('');
  const [date, setDate] = useState(todayIso());
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [checked, setChecked] = useState(null); // {flightNumber, date} של הבדיקה שהוצגה

  const valid = /^[A-Z0-9]{2,8}$/i.test(number.replace(/\s+/g, '')) && /^\d{4}-\d{2}-\d{2}$/.test(date);

  const check = async (e) => {
    e?.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setResult(null);
    const flightNumber = number.replace(/\s+/g, '').toUpperCase();
    const r = await fetchFlightStatus(flightNumber, date);
    setResult(r);
    setChecked({ flightNumber, date });
    setBusy(false);
  };

  const statusLabel = (s) => (STATUS_KEYS.includes(s) ? t(`flightLookup.status.${s}`) : s);

  // רשומת טיסה בצורה ש-FlightRights מצפה לה. נבנית רק ממה שהשרת החזיר —
  // בלי שדות משוערים. כששדות התעופה אינם במאגר, FlightRights מחזיר null
  // ולא מציג זכאות שאין לה בסיס.
  const flight = result?.route && checked ? {
    flightNumber: checked.flightNumber,
    date: checked.date,
    departureAirport: result.route.departureAirport,
    arrivalAirport: result.route.arrivalAirport,
    airline: result.route.airline,
  } : null;

  return (
    <Paper variant="outlined" className="no-print" sx={{ p: { xs: 1.5, sm: 2 }, mb: 3, borderRadius: '10px' }}>
      <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700, mb: 0.25 }}>
        {t('flightLookup.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {t('flightLookup.subtitle')}
      </Typography>

      <Box component="form" onSubmit={check} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <TextField
          size="small"
          label={t('flightLookup.number')}
          placeholder="LY 315"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          inputProps={{ dir: 'ltr', autoCapitalize: 'characters', maxLength: 10 }}
          sx={{ flex: '1 1 130px' }}
        />
        <TextField
          size="small"
          type="date"
          label={t('flightLookup.date')}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ flex: '1 1 150px' }}
        />
        <Button type="submit" variant="contained" disabled={!valid || busy} sx={{ minHeight: 40, flex: '0 0 auto' }}>
          {busy ? t('flightLookup.checking') : t('flightLookup.check')}
        </Button>
      </Box>

      {result && (
        <Box sx={{ mt: 1.5 }} aria-live="polite">
          {result.found && (
            <Alert severity={result.delayHours > 0 ? 'warning' : 'success'} sx={{ mb: 1 }}>
              <AlertTitle sx={{ fontWeight: 700, mb: 0.25 }}>
                {checked.flightNumber}
                {result.route?.departureAirport && result.route?.arrivalAirport && ` · ${result.route.departureAirport} → ${result.route.arrivalAirport}`}
                {result.status && ` · ${statusLabel(result.status)}`}
              </AlertTitle>
              {result.delayHours > 0
                ? t('flightLookup.arrivedLate', { h: result.delayHours })
                : t('flightLookup.arrivedOnTime')}
              {' · '}{t('flightLookup.times', { s: formatClock(result.scheduled), a: formatClock(result.actual) })}
            </Alert>
          )}
          {!result.found && result.status && (
            <Alert severity={result.departureOnly ? 'warning' : 'info'} sx={{ mb: 1 }}>
              <AlertTitle sx={{ fontWeight: 700, mb: 0.25 }}>
                {checked.flightNumber}
                {result.route?.departureAirport && result.route?.arrivalAirport && ` · ${result.route.departureAirport} → ${result.route.arrivalAirport}`}
                {` · ${statusLabel(result.status)}`}
              </AlertTitle>
              {result.reason}
            </Alert>
          )}
          {!result.found && !result.status && (
            <Alert severity="info" sx={{ mb: 1 }}>{result.reason}</Alert>
          )}
          {flight && <FlightRights flight={flight} initialStatus={result} key={`${flight.flightNumber}-${flight.date}`} />}
        </Box>
      )}
    </Paper>
  );
};

export default FlightLookupCard;
