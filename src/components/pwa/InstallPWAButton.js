import React, { useState, useEffect } from 'react';
import { Button, Snackbar, Alert, Tooltip } from '@mui/material';
import { GetApp as InstallIcon } from '@mui/icons-material';

const InstallPWAButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [snack, setSnack] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (installed || !deferredPrompt) return null;

  const handleInstall = async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
      setSnack(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <>
      <Tooltip title="הוסף למסך הבית כאפליקציה">
        <Button
          size="small"
          variant="outlined"
          startIcon={<InstallIcon />}
          onClick={handleInstall}
          sx={{
            borderColor: 'rgba(255,255,255,0.7)',
            color: 'white',
            fontSize: '0.75rem',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.15)', borderColor: 'white' },
          }}
        >
          התקן אפליקציה
        </Button>
      </Tooltip>
      <Snackbar open={snack} autoHideDuration={4000} onClose={() => setSnack(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSnack(false)}>
          🎉 האפליקציה הותקנה בהצלחה!
        </Alert>
      </Snackbar>
    </>
  );
};

export default InstallPWAButton;
