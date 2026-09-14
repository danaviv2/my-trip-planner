import React, { useState } from 'react';
import { Alert, AlertTitle, Box, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useBookings } from '../../contexts/BookingsContext';
import { bookingEmoji } from '../../services/bookingParserService';

// שם שמזהה את הרשומה בעיני המשתמש. הזמנת ביטוח ישנה לא נושאת `name`, ולכן
// נושא המייל — שהוא גם מה שהמשתמש יזהה בתיבה — משמש כגיבוי.
const titleOf = (b) => b.name || b.hotelName || b.company || b.provider || b.flightNumber || b.sourceSubject || '—';

/**
 * רשומות שהמסמך שלהן נקרא מחדש והפענוח הנוכחי כבר לא מזהה בו הזמנה.
 *
 * ההכרעה אצל המשתמש (ראה staleSourceService): "הסר" עובר דרך removeBooking,
 * כלומר עם סימון מחיקה, כך שהסריקה הבאה לא תחזיר את הרשומה; "השאר" נזכר.
 */
const RetractedBookingsAlert = () => {
  const { t } = useTranslation();
  const { bookings, removeBooking, keepBooking } = useBookings();
  const [busy, setBusy] = useState(null);
  const flagged = bookings.filter((b) => b && b.retracted);
  if (!flagged.length) return null;

  const act = async (id, fn) => {
    setBusy(id);
    try { await fn(id); } finally { setBusy(null); }
  };

  return (
    <Alert severity="warning" sx={{ mb: 2 }} className="no-print">
      <AlertTitle sx={{ fontWeight: 700, mb: 0.5 }}>{t('retracted.title', { count: flagged.length })}</AlertTitle>
      <Typography variant="body2" sx={{ mb: 1 }}>{t('retracted.body')}</Typography>
      {flagged.map((b) => (
        <Box key={b.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', py: 0.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ flex: '1 1 180px', minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{bookingEmoji(b.type)} {titleOf(b)}</Typography>
            {b.sourceSubject && (
              <Typography variant="caption" color="text.secondary" component="div" noWrap>
                {t('retracted.source', { subject: b.sourceSubject })}
              </Typography>
            )}
          </Box>
          <Button size="small" color="error" variant="outlined" disabled={busy === b.id} onClick={() => act(b.id, removeBooking)} sx={{ minHeight: 36 }}>
            {t('retracted.remove')}
          </Button>
          <Button size="small" disabled={busy === b.id} onClick={() => act(b.id, keepBooking)} sx={{ minHeight: 36 }}>
            {t('retracted.keep')}
          </Button>
        </Box>
      ))}
    </Alert>
  );
};

export default RetractedBookingsAlert;
