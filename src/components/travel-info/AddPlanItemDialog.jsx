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

/**
 * שעה תקנית, או ריק.
 *
 * הבדיקה נשארת כרשת ביטחון גם אחרי המעבר לבורר: דפדפן ישן עשוי להגיש
 * שדה טקסט רגיל, ואז ערך חופשי יכול עדיין להגיע לכאן.
 */
const isTime = (v) => !v || /^([01]?\d|2[0-3]):[0-5]\d$/.test(String(v).trim());

const AddPlanItemDialog = ({ open, dayKey, pickDate = false, onClose, onAdd }) => {
  const [form, setForm] = useState({ title: '', time: '', location: '', note: '', date: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const t = new Date();
    const today = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    setForm({ title: '', time: '', location: '', note: '', date: dayKey || today });
  }, [open, dayKey]);

  const timeOk = isTime(form.time);
  const canSave = form.title.trim().length > 0 && timeOk && !!form.date && !busy;

  const submit = async () => {
    if (!canSave) return;
    setBusy(true);
    await onAdd({
      type: 'custom',
      date: form.date,
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
        {pickDate ? 'הוספת פריט' : 'הוספה לתוכנית היום'}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* בורר תאריך רק כשנפתח מחוץ ליום מסוים.
              בתוך יום התאריך ידוע, ושדה נוסף היה בקשה למידע שכבר נאמר.
              מחוץ ליום הוא חובה — בלעדיו אין דרך לרשום מסעדה שסגרת
              לחודש הבא, כי כפתור ההוספה קיים רק על ימים שכבר יש בהם
              הזמנה, ולתאריך הזה אין אף אחת. */}
          {pickDate && (
            <TextField
              label="תאריך" type="date" size="small" fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          )}
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              label="מה" size="small" fullWidth autoFocus
              placeholder="ארוחת ערב אצל מרקו"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            {/* שעה אינה חובה: "מתישהו ביום הזה" הוא מצב אמיתי, ואילוץ
                שעה היה מכניס לציר מספר שאיש לא התכוון אליו. */}
            {/* בורר ולא הקלדה חופשית. הגרסה הקודמת דרשה נקודתיים ודחתה
                "1000" באדום בלי לומר מה חסר — דחייה שקטה שאין ממנה דרך
                החוצה חוץ מניחוש. */}
            <TextField
              label="שעה" type="time" size="small" sx={{ width: 118 }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }}
              value={form.time}
              error={!timeOk}
              helperText={timeOk ? '' : 'שעה לא תקינה'}
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
