import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import SvgIcon from '@mui/material/SvgIcon';

const TikTokIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
  </SvgIcon>
);

const SnapchatIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M12.001 2C8.318 2 6.02 4.808 6.02 7.758c0 .548.054 1.084.148 1.605l-.7.32c-.27.124-.46.246-.46.492 0 .31.253.56.56.56.06 0 .12-.01.178-.03-.16.59-.378 1.14-.66 1.63-.03.05-.06.1-.09.148C4.3 13.1 3 13.54 3 14.37c0 .57.46.96 1.13 1.13.55.14 1.13.2 1.72.2.16 0 .32-.01.48-.02.36.54.54 1.16.54 1.8 0 .18-.01.36-.04.54-.03.17-.04.33-.04.49 0 .74.6 1.49 1.98 1.49.64 0 1.38-.14 2.25-.42.6-.2 1.23-.3 1.98-.3.75 0 1.38.1 1.98.3.87.28 1.61.42 2.25.42 1.38 0 1.98-.75 1.98-1.49 0-.16-.01-.32-.04-.49-.03-.18-.04-.36-.04-.54 0-.64.18-1.26.54-1.8.16.01.32.02.48.02.59 0 1.17-.06 1.72-.2.67-.17 1.13-.56 1.13-1.13 0-.83-1.3-1.27-1.996-1.467-.03-.048-.06-.098-.09-.148-.282-.49-.5-1.04-.66-1.63.058.02.118.03.178.03.307 0 .56-.25.56-.56 0-.246-.19-.368-.46-.492l-.7-.32c.094-.521.148-1.057.148-1.605C17.982 4.808 15.684 2 12.001 2z"/>
  </SvgIcon>
);

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
  const { t } = useTranslation();

  const destination = trip.destination || trip.endPoint || '';
  const shareUrl = shareUrlProp || `${window.location.origin}/trip-planner?destination=${encodeURIComponent(destination)}`;
  const displayLabel = label || destination;
  const shareText = t('share.shareText', { label: displayLabel ? ` — ${displayLabel}` : '', url: shareUrl });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showSnackbar(t('share.copied'));
    } catch {
      showSnackbar(t('share.cannotCopy'), 'warning');
    }
  };

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(t('share.emailSubject', { destination: destination ? t('share.emailDestination', { destination }) : '' }));
    const body = encodeURIComponent(t('share.emailBody', { url: shareUrl }));
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, '_blank');
  };

  const handleTikTok = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showSnackbar(t('share.tiktokHint'), 'info');
    } catch {
      showSnackbar(t('share.cannotCopy'), 'warning');
    }
  };

  const handleSnapchat = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showSnackbar(t('share.snapchatHint'), 'info');
    } catch {
      showSnackbar(t('share.cannotCopy'), 'warning');
    }
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
      showSnackbar(t('share.instagramHint'), 'info');
    } catch {
      showSnackbar(t('share.cannotCopy'), 'warning');
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
            {displayLabel ? `${t('share.title')} — ${displayLabel}` : t('share.title')}
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
            <ShareButton icon={<WhatsAppIcon />} label={t('share.whatsapp')} color="#25D366" onClick={handleWhatsApp} />
            <ShareButton icon={<LinkIcon />} label={t('share.copyLink')} color="#667eea" onClick={handleCopyLink} />
            <ShareButton icon={<FacebookIcon />} label={t('share.facebook')} color="#1877F2" onClick={handleFacebook} />
            <ShareButton icon={<EmailIcon />} label={t('share.email')} color="#D44638" onClick={handleEmail} />
            <ShareButton icon={<TikTokIcon />} label={t('share.tiktok')} color="#010101" onClick={handleTikTok} />
            <ShareButton icon={<SnapchatIcon />} label={t('share.snapchat')} color="#FFFC00" onClick={handleSnapchat} />
            <ShareButton icon={<PinterestIcon />} label={t('share.pinterest')} color="#E60023" onClick={handlePinterest} />
            <ShareButton icon={<LinkedInIcon />} label={t('share.linkedin')} color="#0A66C2" onClick={handleLinkedIn} />
            <ShareButton icon={<TelegramIcon />} label={t('share.telegram')} color="#26A5E4" onClick={handleTelegram} />
            <ShareButton icon={<XIcon />} label={t('share.twitter')} color="#000000" onClick={handleTwitter} />
            <ShareButton icon={<InstagramIcon />} label={t('share.instagram')} color="#C13584" onClick={handleInstagram} />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} variant="text" color="inherit">
            {t('share.close')}
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
