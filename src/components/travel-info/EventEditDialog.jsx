import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, Stack,
} from '@mui/material';

/**
 * עריכת אירוע בציר.
 *
 * ── מה נערך ומה לא ──
 * שעה, כותרת, מקום ותאריך. אלה הדברים שמשתנים במציאות אחרי שהאישור
 * נשלח: סיכמת עם חברת ההשכרה על שעה אחרת, המלון הודיע על כתובת כניסה
 * צדדית, הסיור נדחה ביום. מספר אישור ומספר טיסה אינם נערכים — הם אינם
 * שלך לשנות, ועריכתם הייתה שוברת את זיהוי הכפילויות שנשען עליהם.
 *
 * ── התיקון אינו נכתב על ההזמנה ──
 * הוא נשמר בשכבה נפרדת, כדי שהסריקה הבאה של אותו מייל לא תחזיר את הערך
 * שבאישור. לכן יש גם "החזר למקור": המקור לא נמחק, הוא רק מוסתר.
 */

const isTime = (v) => !v || /^([01]?\d|2[0-3]):[0-5]\d$/.test(v.trim());

const EventEditDialog = ({ open, event, onClose, onSave, onReset }) => {
  const [form, setForm] = useState({ time: '', title: '', place: '', date: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !event) return;
    const d = event.at;
    setForm({
      time: event.allDay ? '' : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
      title: event.title || '',
      place: event.place || '',
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    });
  }, [open, event]);

  if (!event) return null;

  const timeOk = isTime(form.time);
  const custom = event.booking?.type === 'custom';

  const submit = async () => {
    if (!timeOk || busy) return;
    setBusy(true);
    // ערכים ריקים נשלחים כמחרוזת ריקה במכוון: מחיקת שעה היא בחירה
    // ("לא יודע מתי"), לא היעדר עריכה.
    await onSave({
      time: form.time.trim(),
      title: form.title.trim() || undefined,
      place: form.place.trim() || undefined,
      date: form.date,
    });
    setBusy(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" dir="rtl">
      <DialogTitle sx={{ pb: 0.5, fontSize: '1.05rem', fontWeight: 700 }}>
        {custom ? 'עריכת פריט' : 'תיקון פרטים'}
      </DialogTitle>

      <DialogContent>
        {!custom && (
          <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mb: 2 }}>
            התיקון נשמר בנפרד מהאישור, ולכן הוא לא יימחק בסריקה הבאה של המייל.
          </Typography>
        )}

        <Stack spacing={2} sx={{ mt: custom ? 1 : 0 }}>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              label="תאריך" type="date" size="small" fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
            <TextField
              label="שעה" size="small" placeholder="16:00" sx={{ width: 120 }}
              value={form.time}
              error={!timeOk}
              helperText={timeOk ? '' : 'שעה לא תקינה'}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
            />
          </Box>

          <TextField
            label="כותרת" size="small" fullWidth
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />

          <TextField
            label="מקום" size="small" fullWidth multiline maxRows={3}
            value={form.place}
            onChange={(e) => setForm((f) => ({ ...f, place: e.target.value }))}
            helperText="שינוי המקום יאותר מחדש על המפה"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        {/* חזרה למקור מוצעת רק כשיש ממה לחזור */}
        <Box>
          {event.edited && !custom && (
            <Button
              size="small" color="inherit" disabled={busy}
              onClick={async () => { setBusy(true); await onReset(); setBusy(false); onClose(); }}
              sx={{ fontSize: '0.78rem' }}
            >
              החזר למה שכתוב באישור
            </Button>
          )}
        </Box>
        <Box>
          <Button onClick={onClose} color="inherit" disabled={busy}>ביטול</Button>
          <Button onClick={submit} variant="contained" disabled={!timeOk || busy}>שמור</Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default EventEditDialog;
