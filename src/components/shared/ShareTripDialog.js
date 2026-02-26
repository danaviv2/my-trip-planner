import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, IconButton, Snackbar, Alert,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LinkIcon from '@mui/icons-material/Link';
import FacebookIcon from '@mui/icons-material/Facebook';
import EmailIcon from '@mui/icons-material/Email';
import InstagramIcon from '@mui/icons-material/Instagram';
import XIcon from '@mui/icons-material/X';
import TelegramIcon from '@mui/icons-material/Telegram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import PinterestIcon from '@mui/icons-material/Pinterest';

const ShareButton = ({ icon, label, color, onClick }) => (
  <Button
    variant="outlined"
    onClick={onClick}
    startIcon={icon}
    sx={{
      borderColor: color,
      color: color,
      fontWeight: 600,
      borderRadius: 2,
      py: 1.2,
      '&:hover': { bgcolor: color, color: 'white', borderColor: color },
      transition: 'all 0.2s',
    }}
    fullWidth
  >
    {label}
  </Button>
);

const ShareTripDialog = ({ open, onClose, trip = {}, shareUrl: shareUrlProp, label }) => {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const destination = trip.destination || trip.endPoint || '';
  const shareUrl = shareUrlProp || `${window.location.origin}/trip-planner?destination=${encodeURIComponent(destination)}`;
  const displayLabel = label || destination;
  const shareText = `בוא לנסות${displayLabel ? ` — ${displayLabel}` : ''}! 🌍✈️\n${shareUrl}`;

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showSnackbar('הקישור הועתק!');
    } catch {
      showSnackbar('לא ניתן להעתיק — העתק ידנית', 'warning');
    }
  };

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`טיול מדהים${destination ? ` ל${destination}` : ''}!`);
    const body = encodeURIComponent(`היי!\n\nבוא לראות את הטיול שלי:\n${shareUrl}\n\nבתכנון עם My Trip Planner 🌍`);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, '_blank');
  };

  const handlePinterest = () => {
    window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleInstagram = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showSnackbar('הקישור הועתק — פתח Instagram והדבק בסטורי 📸', 'info');
    } catch {
      showSnackbar('לא ניתן להעתיק — העתק ידנית', 'warning');
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pr: 6, pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>
            {displayLabel ? `שתף — ${displayLabel}` : 'שתף'}
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ position: 'absolute', top: 12, right: 12 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 2.5, pb: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <ShareButton
              icon={<WhatsAppIcon />}
              label="שתף ב-WhatsApp"
              color="#25D366"
              onClick={handleWhatsApp}
            />
            <ShareButton
              icon={<LinkIcon />}
              label="העתק קישור"
              color="#667eea"
              onClick={handleCopyLink}
            />
            <ShareButton
              icon={<FacebookIcon />}
              label="שתף ב-Facebook"
              color="#1877F2"
              onClick={handleFacebook}
            />
            <ShareButton
              icon={<EmailIcon />}
              label="שלח במייל"
              color="#D44638"
              onClick={handleEmail}
            />
            <ShareButton
              icon={<PinterestIcon />}
              label="שתף ב-Pinterest"
              color="#E60023"
              onClick={handlePinterest}
            />
            <ShareButton
              icon={<LinkedInIcon />}
              label="שתף ב-LinkedIn"
              color="#0A66C2"
              onClick={handleLinkedIn}
            />
            <ShareButton
              icon={<TelegramIcon />}
              label="שתף בטלגרם"
              color="#26A5E4"
              onClick={handleTelegram}
            />
            <ShareButton
              icon={<XIcon />}
              label="שתף ב-X / Twitter"
              color="#000000"
              onClick={handleTwitter}
            />
            <ShareButton
              icon={<InstagramIcon />}
              label="שתף ב-Instagram"
              color="#C13584"
              onClick={handleInstagram}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} variant="text" color="inherit">
            סגור
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ShareTripDialog;
