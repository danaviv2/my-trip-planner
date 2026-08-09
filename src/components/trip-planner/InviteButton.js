import React, { useState } from 'react';
import { Box, Button, Modal, Typography, TextField, Alert, Snackbar } from '@mui/material';

/**
 * כפתור הזמנת חבר לטיול.
 *
 * הוצא מתוך הפונקציה App: כשהוא הוגדר שם, React בנה אותו מחדש בכל render
 * של App — מה שאיפס את השדה "כתובת אימייל" וסגר את החלון תוך כדי הקלדה.
 * הרכיב עצמאי לחלוטין ואינו תלוי ב-state של App.
 *
 * הגרסה הקודמת הודיעה "הזמנה נשלחה ל-X" מבלי שנשלח דבר, וייצרה קישור
 * אל yourtripplandomain.com — דומיין שאינו קיים, ואל נתיב /invite שאינו
 * מוגדר באפליקציה. החבר שקיבל את הקישור הגיע לשום מקום.
 *
 * כאן הקישור מצביע על עמוד אמיתי, והשליחה נעשית מתוכנת הדואר של המשתמש
 * עצמו. איננו שולחים בשמו, וגם איננו טוענים שכן.
 */
const InviteButton = ({ destination = '' }) => {
  const [open, setOpen] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const [toast, setToast] = useState(null);

  const handleClose = () => setOpen(false);

  /** קישור לעמוד שקיים באמת. עם יעד — ישר לתכנון שלו. */
  const inviteLink = destination
    ? `${window.location.origin}/trip-planner?destination=${encodeURIComponent(destination)}`
    : window.location.href;

  const subject = destination ? `בוא נתכנן יחד טיול ל${destination}` : 'בוא נתכנן יחד את הטיול';
  const body = `היי,\n\nתכננתי טיול ואשמח שתצטרף.\n${inviteLink}\n`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setToast({ severity: 'success', text: 'הקישור הועתק ללוח' });
    } catch {
      // הדפדפן חסם גישה ללוח. בגרסה הקודמת זה נרשם לקונסול בלבד,
      // והמשתמש נשאר עם ההודעה שההעתקה הצליחה.
      setToast({ severity: 'warning', text: 'ההעתקה נחסמה על ידי הדפדפן. סמן את הקישור והעתק ידנית.' });
    }
  };

  const openMailClient = () => {
    const to = friendEmail.trim();
    window.location.href =
      `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    handleClose();
  };

  return (
    <Box sx={{ mt: 2 }} role="group" aria-label="הזמן חבר">
      <Button
        variant="contained"
        onClick={() => setOpen(true)}
        sx={{ background: '#4CAF50', color: '#fff', borderRadius: '8px', '&:hover': { background: '#388E3C' } }}
        aria-label="הזמן חבר לטיול"
      >
        הזמן חבר
      </Button>

      <Modal open={open} onClose={handleClose} aria-labelledby="invite-modal-title">
        <Box
          sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 440 }, bgcolor: 'background.paper',
            boxShadow: 24, p: 3, borderRadius: '12px', direction: 'rtl', textAlign: 'right',
          }}
          role="dialog"
          aria-label="חלון הזמנת חבר"
        >
          <Typography id="invite-modal-title" variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            הזמן חבר לטיול
          </Typography>

          <Typography variant="body2" sx={{ mb: 1.5, color: 'text.secondary' }}>
            זה הקישור שיקבל החבר:
          </Typography>
          <Box
            sx={{
              p: 1, mb: 2, bgcolor: 'action.hover', borderRadius: 1,
              fontSize: '0.78rem', wordBreak: 'break-all', direction: 'ltr', textAlign: 'left',
            }}
          >
            {inviteLink}
          </Box>

          <TextField
            fullWidth
            id="friendEmail"
            name="friendEmail"
            type="email"
            label="כתובת אימייל (לא חובה)"
            value={friendEmail}
            onChange={(e) => setFriendEmail(e.target.value)}
            sx={{ mb: 1 }}
          />
          <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'text.secondary' }}>
            תיפתח תוכנת הדואר שלך עם ההודעה מוכנה. השליחה בידיים שלך.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }} role="group" aria-label="פעולות הזמנה">
            <Button variant="contained" onClick={copyLink} sx={{ borderRadius: '8px' }}>
              העתק קישור
            </Button>
            <Button variant="outlined" onClick={openMailClient} sx={{ borderRadius: '8px' }}>
              פתח במייל
            </Button>
            <Button variant="text" onClick={handleClose} sx={{ borderRadius: '8px' }}>
              סגור
            </Button>
          </Box>
        </Box>
      </Modal>

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? <Alert severity={toast.severity}>{toast.text}</Alert> : undefined}
      </Snackbar>
    </Box>
  );
};

export default InviteButton;
