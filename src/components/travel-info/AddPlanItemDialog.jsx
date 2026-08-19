import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Stack,
} from '@mui/material';

/**
 * הוספת פריט משלך לתוכנית היום.
 *
 * לא כל מה ששייך ליום מגיע באישור הזמנה: ארוחת ערב שסיכמת בטלפון, פגישה
 * עם חבר, תזכורת לאסוף מפתחות. עד כה הציר יכול היה להציג רק מה שהמייל
 * הביא, ולכן הוא תיאור חלקי של היום ולא התוכנית עצמה.
 *
 * הפריט נשמר כהזמנה מסוג משלו, ולכן הוא זוכה בחינם לכל מה שכבר קיים:
 * שמירה מקומית, סנכרון לענן, שיוך לנסיעה הנכונה, ומקום בציר לפי השעה.
 */

const isTime = (v) => !v || /^([01]?\d|2[0-3]):[0-5]\d$/.test(v.trim());

const AddPlanItemDialog = ({ open, dayKey, onClose, onAdd }) => {
  const [form, setForm] = useState({ title: '', time: '', location: '', note: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setForm({ title: '', time: '', location: '', note: '' });
  }, [open]);

  const timeOk = isTime(form.time);
  const canSave = form.title.trim().length > 0 && timeOk && !busy;

  const submit = async () => {
    if (!canSave) return;
    setBusy(true);
    await onAdd({
      type: 'custom',
      date: dayKey,
      time: form.time.trim(),
      title: form.title.trim(),
      location: form.location.trim(),
      note: form.note.trim(),
    });
    setBusy(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" dir="rtl">
      <DialogTitle sx={{ pb: 1, fontSize: '1.05rem', fontWeight: 700 }}>
        הוספה לתוכנית היום
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              label="מה" size="small" fullWidth autoFocus
              placeholder="ארוחת ערב אצל מרקו"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            {/* שעה אינה חובה: "מתישהו ביום הזה" הוא מצב אמיתי, ואילוץ
                שעה היה מכניס לציר מספר שאיש לא התכוון אליו. */}
            <TextField
              label="שעה" size="small" placeholder="20:00" sx={{ width: 110 }}
              value={form.time}
              error={!timeOk}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
            />
          </Box>

          <TextField
            label="מקום" size="small" fullWidth
            placeholder="Via Toledo 12, Napoli"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            helperText="אם תמלא, הפריט יופיע גם על מפת היום"
          />

          <TextField
            label="הערה" size="small" fullWidth multiline rows={2}
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={busy}>ביטול</Button>
        <Button onClick={submit} variant="contained" disabled={!canSave}>הוסף</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddPlanItemDialog;
