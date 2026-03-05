import React, { useState } from 'react';
import {
  Box, Button, Typography, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Chip, Paper, Divider,
  Alert, TextField, IconButton, Tooltip,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import { parseBookingEmail, bookingEmoji, bookingColor, bookingLabel } from '../../services/bookingParserService';

const FIELD_MAP = {
  hotel:      [['name','מלון'], ['destination','יעד'], ['checkIn','צ׳ק-אין'], ['checkOut','צ׳ק-אאוט'], ['nights','לילות'], ['price','מחיר'], ['confirmationNumber','מספר אישור'], ['notes','הערות']],
  flight:     [['name','טיסה'], ['from','מוצא'], ['to','יעד'], ['checkIn','יציאה'], ['checkOut','חזרה'], ['passengers','נוסעים'], ['price','מחיר'], ['confirmationNumber','מספר הזמנה']],
  car_rental: [['name','חברה'], ['destination','מיקום'], ['checkIn','איסוף'], ['checkOut','החזרה'], ['price','מחיר'], ['confirmationNumber','מספר אישור']],
  activity:   [['name','פעילות'], ['destination','יעד'], ['checkIn','תאריך'], ['price','מחיר'], ['confirmationNumber','מספר אישור'], ['notes','הערות']],
};

const BookingCard = ({ booking, onAdd, added }) => {
  const color = bookingColor(booking.type);
  const fields = FIELD_MAP[booking.type] || FIELD_MAP.hotel;

  return (
    <Paper elevation={2} sx={{
      p: 2, borderRadius: 2,
      borderLeft: `4px solid ${color}`,
      opacity: added ? 0.6 : 1,
      transition: 'opacity 0.3s',
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography fontSize="1.6rem">{bookingEmoji(booking.type)}</Typography>
          <Box>
            <Box sx={{ display: 'flex', gap: 0.5, mb: 0.3 }}>
              <Chip label={bookingLabel(booking.type)} size="small"
                sx={{ bgcolor: color, color: 'white', fontWeight: 700, fontSize: '0.65rem', height: 20 }} />
              {booking.status === 'confirmed' && (
                <Chip label="מאושר ✓" size="small" color="success" sx={{ fontSize: '0.65rem', height: 20 }} />
              )}
            </Box>
            <Typography variant="subtitle2" fontWeight={700}>{booking.name}</Typography>
          </Box>
        </Box>
        {added ? (
          <Chip icon={<CheckCircleIcon />} label="נוסף!" color="success" size="small" />
        ) : (
          <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => onAdd(booking)}
            sx={{ bgcolor: color, fontWeight: 700, '&:hover': { bgcolor: color, filter: 'brightness(0.85)' } }}>
            הוסף לטיול
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        {fields.map(([key, label]) =>
          booking[key] ? (
            <Box key={key}>
              <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
              <Typography variant="caption" fontWeight={600}>{String(booking[key])}</Typography>
            </Box>
          ) : null
        )}
      </Box>

      {booking.notes && (
        <Typography variant="caption" sx={{
          mt: 1, display: 'block', bgcolor: '#fff8e1', p: 0.5,
          borderRadius: 1, borderLeft: '3px solid #FFC107', color: '#555',
        }}>
          💡 {booking.notes}
        </Typography>
      )}
    </Paper>
  );
};

const BookingSync = ({ onBookingsAdded }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [phase, setPhase] = useState('input'); // input | parsing | result | error
  const [booking, setBooking] = useState(null);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState('');

  const handleParse = async () => {
    if (!text.trim()) return;
    setPhase('parsing');
    setError('');
    try {
      const result = await parseBookingEmail({
        subject: '',
        from: '',
        date: '',
        body: text,
      });
      if (!result || !result.type) {
        setError('לא זוהתה הזמנת נסיעה בטקסט. נסה להדביק את כל תוכן האישור.');
        setPhase('error');
      } else {
        setBooking(result);
        setPhase('result');
      }
    } catch (err) {
      setError('שגיאה בניתוח הטקסט. נסה שוב.');
      setPhase('error');
    }
  };

  const handleAdd = (b) => {
    setAdded(true);
    if (onBookingsAdded) onBookingsAdded(b);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setText('');
      setPhase('input');
      setBooking(null);
      setAdded(false);
      setError('');
    }, 300);
  };

  const handleAnother = () => {
    setText('');
    setPhase('input');
    setBooking(null);
    setAdded(false);
    setError('');
  };

  return (
    <>
      <Tooltip title="הוסף הזמנה מאישור מייל">
        <Button
          variant="outlined"
          startIcon={<ContentPasteIcon />}
          onClick={() => setOpen(true)}
          sx={{
            borderColor: '#667eea', color: '#667eea', fontWeight: 700,
            '&:hover': { bgcolor: '#667eea11', borderColor: '#667eea' },
          }}
        >
          הוסף מאישור
        </Button>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddCircleIcon sx={{ color: '#667eea' }} />
            <Typography fontWeight={700}>הוסף הזמנה מאישור</Typography>
          </Box>
          <IconButton size="small" onClick={handleClose}><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent>
          {/* שלב 1 — הדבקת טקסט */}
          {(phase === 'input' || phase === 'error') && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                העתק והדבק את תוכן מייל האישור שלך — טיסה, מלון, השכרת רכב או כל הזמנת נסיעה אחרת.
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                עובד עם: Booking.com · Airbnb · Expedia · El Al · Ryanair · Avis · ועוד
              </Typography>

              <TextField
                multiline
                rows={9}
                fullWidth
                placeholder={`לדוגמה:\n\nYour booking is confirmed!\nHotel: The Standard, New York\nCheck-in: March 15, 2025\nCheck-out: March 18, 2025\nConfirmation #: ABC123\nTotal: $450`}
                value={text}
                onChange={e => { setText(e.target.value); if (phase === 'error') setPhase('input'); }}
                sx={{ mb: 1, '& textarea': { fontSize: '0.8rem', lineHeight: 1.5 } }}
              />

              {phase === 'error' && (
                <Alert severity="warning" sx={{ mb: 1 }}>{error}</Alert>
              )}

              <Typography variant="caption" color="text.disabled">
                💡 טיפ: ב-Gmail לחץ על "Forward" → Ctrl+A → Ctrl+C → הדבק כאן
              </Typography>
            </Box>
          )}

          {/* שלב 2 — ניתוח AI */}
          {phase === 'parsing' && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#667eea', mb: 2 }} />
              <Typography variant="body1" fontWeight={600}>מנתח את האישור עם AI...</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                מזהה פרטי הזמנה, תאריכים ומחירים
              </Typography>
            </Box>
          )}

          {/* שלב 3 — תוצאה */}
          {phase === 'result' && booking && (
            <Box>
              <Alert severity="success" icon={<AutoAwesomeIcon />} sx={{ mb: 2 }}>
                זוהתה הזמנה! בדוק את הפרטים ולחץ "הוסף לטיול"
              </Alert>
              <BookingCard booking={booking} onAdd={handleAdd} added={added} />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          {phase === 'input' || phase === 'error' ? (
            <>
              <Button onClick={handleClose} sx={{ color: 'text.secondary' }}>ביטול</Button>
              <Button
                variant="contained"
                startIcon={<AutoAwesomeIcon />}
                onClick={handleParse}
                disabled={!text.trim()}
                sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', fontWeight: 700, px: 3 }}
              >
                נתח עם AI
              </Button>
            </>
          ) : phase === 'result' ? (
            <>
              <Button onClick={handleAnother} variant="outlined">הוסף עוד הזמנה</Button>
              <Button
                variant="contained"
                onClick={handleClose}
                color={added ? 'success' : 'inherit'}
                sx={{ fontWeight: 700 }}
              >
                {added ? 'נשמר! ✓' : 'סגור'}
              </Button>
            </>
          ) : null}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BookingSync;
