import React from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';

/**
 * מציג את הפרטים המלאים של הזמנה בודדת.
 *
 * עד כה כרטיס הנסיעה הראה רק תאריכים ומספר הזמנות, כך שכדי לראות מספר
 * טיסה או חברת השכרה היה צריך לחזור למייל. כאן מוצג כל מה שחולץ.
 */

const Row = ({ label, value }) =>
  value ? (
    <Box sx={{ display: 'flex', gap: 1, py: 0.25 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 110, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Box>
  ) : null;

const titleOf = (b) => {
  if (b.type === 'flight') {
    const dir = b.direction === 'return' ? 'טיסת חזור' : 'טיסת הלוך';
    return `✈️ ${dir}${b.flightNumber ? ` · ${b.flightNumber}` : ''}`;
  }
  if (b.type === 'car_rental') return `🚗 השכרת רכב${b.company ? ` · ${b.company}` : ''}`;
  if (b.type === 'hotel') return `🏨 ${b.name || 'לינה'}`;
  return '📋 הזמנה';
};

const BookingDetails = ({ booking: b }) => {
  if (!b) return null;

  return (
    <Paper variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: '8px' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
        {titleOf(b)}
      </Typography>
      <Divider sx={{ mb: 1 }} />

      {b.type === 'flight' && (
        <>
          <Row label="חברת תעופה" value={b.airline} />
          <Row label="מספר טיסה" value={b.flightNumber} />
          <Row label="תאריך" value={b.date} />
          <Row
            label="מסלול"
            value={
              b.departureAirport || b.arrivalAirport
                ? `${b.departureAirport || '—'} → ${b.arrivalAirport || '—'}`
                : ''
            }
          />
          <Row label="שעת המראה" value={b.departureTime} />
          <Row label="שעת נחיתה" value={b.arrivalTime} />
          <Row label="טרמינל" value={b.terminal} />
        </>
      )}

      {b.type === 'car_rental' && (
        <>
          <Row label="חברה" value={b.company} />
          <Row label="מספר אישור" value={b.confirmationNumber} />
          <Row label="סוג רכב" value={b.carType} />
          <Row
            label="איסוף"
            value={[b.pickupDate, b.pickupTime].filter(Boolean).join(' ') || ''}
          />
          <Row label="מקום איסוף" value={b.pickupLocation} />
          <Row
            label="החזרה"
            value={[b.returnDate, b.returnTime].filter(Boolean).join(' ') || ''}
          />
          <Row label="מקום החזרה" value={b.returnLocation} />
        </>
      )}

      {b.type === 'hotel' && (
        <>
          <Row label="שם" value={b.name} />
          <Row label="מספר אישור" value={b.confirmationNumber} />
          <Row label="כניסה" value={b.checkIn} />
          <Row label="יציאה" value={b.checkOut} />
          <Row label="כתובת" value={b.address} />
          <Row label="סוג חדר" value={b.roomType} />
          <Row label="אורחים" value={b.guests ? String(b.guests) : ''} />
          <Row label="מחיר" value={b.price} />
        </>
      )}

      {/* כשהפרטים חלקיים — לרוב מפני שהם נמצאים בקובץ מצורף ולא בגוף המייל */}
      {!b.flightNumber && !b.company && !b.name && (
        <Typography variant="caption" color="text.secondary">
          לא חולצו פרטים נוספים מהמייל. ייתכן שהם נמצאים בקובץ מצורף.
        </Typography>
      )}
    </Paper>
  );
};

export default BookingDetails;
