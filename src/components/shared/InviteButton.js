// src/components/shared/InviteButton.js
import React, { useState } from 'react';
import { Box, Typography, Button, Modal, TextField } from '@mui/material';
import { v4 as uuidv4 } from 'uuid';

/**
 * InviteButton - כפתור להזמנת חברים לטיול
 */
const InviteButton = () => {
  const [open, setOpen] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleInvite = () => {
    const inviteLink = `https://yourtripplandomain.com/invite/${uuidv4()}`;
    const message = `הזמן חבר לטיול שלך! קישור: ${inviteLink}\nהעתק את הקישור ושלח לחברים.`;
    
    if (friendEmail) {
      alert(`הזמנה נשלחה ל-${friendEmail} עם הקישור: ${inviteLink}`);
      navigator.clipboard.writeText(inviteLink).then(() => {
        alert('הקישור הועתק ללוח!');
      }).catch(err => {
        console.error('נכשל להעתיק קישור הזמנה:', err);
      });
    } else {
      alert(message);
      navigator.clipboard.writeText(inviteLink).then(() => {
        alert('הקישור הועתק ללוח!');
      }).catch(err => {
        console.error('נכשל להעתיק קישור הזמנה:', err);
      });
    }
    
    handleClose();
  };

  return (
    <Box sx={{ mt: 2 }} role="group" aria-label="הזמן חבר">
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleOpen} 
        sx={{ 
          background: '#4CAF50', 
          color: '#fff', 
          borderRadius: '8px', 
          '&:hover': { background: '#388E3C' } 
        }} 
        aria-label="הזמן חבר לטיול"
      >
        הזמן חבר
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="invite-modal-title"
        aria-describedby="invite-modal-description"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          border: '2px solid #000',
          boxShadow: 24,
          p: 3,
          borderRadius: '12px',
        }} role="dialog" aria-label="חלון הזמנת חבר">
          <Typography id="invite-modal-title" variant="h6" sx={{ color: '#2c3e50', fontWeight: 'bold' }} role="heading" aria-level="1">
            הזמן חבר לטיול
          </Typography>
          <Typography id="invite-modal-description" sx={{ mt: 2, color: '#666' }}>
            הכנס את כתובת האימייל של החבר או העתק את הקישור:
          </Typography>
          <TextField
            fullWidth
            id="friendEmail"
            name="friendEmail"
            label="כתובת אימייל של החבר"
            value={friendEmail}
            onChange={(e) => setFriendEmail(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
            aria-label="כתובת אימייל של החבר"
          />
          <Box sx={{ display: 'flex', gap: 2 }} role="group" aria-label="פעולות הזמנה">
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleInvite} 
              sx={{ 
                background: '#4CAF50', 
                color: '#fff', 
                borderRadius: '8px', 
                '&:hover': { background: '#388E3C' } 
              }} 
              aria-label="שלח הזמנה"
            >
              שלח הזמנה
            </Button>
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={handleClose} 
              sx={{ borderRadius: '8px' }} 
              aria-label="בטל הזמנה"
            >
              בטל
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default InviteButton;