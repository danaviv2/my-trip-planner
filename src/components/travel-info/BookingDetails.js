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
  if (b.type === 'transfer') return `🚕 הסעה${b.company ? ` · ${b.company}` : ''}`;
  if (b.type === 'insurance') return `🛡️ ביטוח נסיעות${b.provider ? ` · ${b.provider}` : ''}`;
  if (b.type === 'activity') return `🎟️ ${b.name || 'אטרקציה'}`;
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

      {/* להסעה אין תאריך החזרה ואין סוג רכב — הצגת השדות האלה ריקים
          מרמזת שחסר מידע, בעוד שבפועל הם פשוט לא קיימים בהזמנה כזו. */}
      {/* ביטוח: הטלפון הוא השדה החשוב ביותר ולכן מוצג ראשון ובולט.
          את הפוליסה מחפשים בבית חולים בחו״ל, עם קליטה גרועה ובלחץ —
          ואז לא מחפשים "מה מכוסה" אלא למי מתקשרים. */}
      {b.type === 'insurance' && (
        <>
          {b.emergencyPhone && (
            <Box sx={{ mb: 1, p: 1.25, bgcolor: 'error.light', borderRadius: 1.5 }}>
              <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'error.contrastText' }}>
                טלפון חירום 24/7
              </Typography>
              <Typography
                component="a"
                href={`tel:${String(b.emergencyPhone).replace(/[^\d+]/g, '')}`}
                dir="ltr"
                sx={{ fontSize: '1.15rem', fontWeight: 800, color: 'error.contrastText', textDecoration: 'none' }}
              >
                {b.emergencyPhone}
              </Typography>
            </Box>
          )}
          <Row label="חברה" value={b.provider} />
          <Row label="מספר פוליסה" value={b.policyNumber} />
          <Row label="תוקף" value={[b.startDate, b.endDate].filter(Boolean).join(' → ')} />
          <Row label="מבוטחים" value={b.insured} />
          <Row label="כיסוי" value={b.coverage} />
          <Row label="מחיר" value={b.price} />
        </>
      )}

      {b.type === 'activity' && (
        <>
          <Row label="מועד" value={[b.date, b.time].filter(Boolean).join(' · ')} />
          <Row label="מקום" value={b.location} />
          <Row label="מספר אישור" value={b.confirmationNumber} />
          <Row label="משתתפים" value={b.guests} />
          <Row label="מחיר" value={b.price} />
        </>
      )}

      {b.type === 'transfer' && (
        <>
          <Row label="הוזמן דרך" value={b.company} />
          <Row label="מספר אישור" value={b.confirmationNumber} />
          <Row label="מועד" value={[b.pickupDate, b.pickupTime].filter(Boolean).join(' ') || ''} />
          <Row label="מוצא" value={b.pickupLocation} />
          <Row label="יעד" value={b.returnLocation} />
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
