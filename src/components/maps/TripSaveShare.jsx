import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Snackbar,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  Share as ShareIcon,
  ContentCopy as CopyIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Facebook as FacebookIcon,
  Download as DownloadIcon,
  Check as CheckIcon
} from '@mui/icons-material';

const TripSaveShare = ({ tripPlan, schedule }) => {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [tripName, setTripName] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [savedTrips, setSavedTrips] = useState([]);

  /**
   * שמירת תכנית טיול
   */
  const saveTripPlan = () => {
    if (!tripName.trim()) {
      setSnackbar({ open: true, message: 'נא להזין שם לתכנית הטיול', severity: 'error' });
      return;
    }

    const tripData = {
      id: Date.now(),
      name: tripName,
      createdAt: new Date().toISOString(),
      tripPlan: tripPlan,
      schedule: schedule,
      origin: tripPlan.route?.origin || 'לא צוין',
      destination: tripPlan.route?.destination || 'לא צוין'
    };

    // שמירה ב-LocalStorage
    const existingTrips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
    existingTrips.push(tripData);
    localStorage.setItem('savedTrips', JSON.stringify(existingTrips));
    
    setSavedTrips(existingTrips);
    setSaveDialogOpen(false);
    setSnackbar({ open: true, message: '✅ תכנית הטיול נשמרה בהצלחה!', severity: 'success' });
    
    console.log('✅ תכנית טיול נשמרה:', tripData);
  };

  /**
   * שיתוף תכנית טיול
   */
  const shareTripPlan = (method) => {
    const tripUrl = generateShareUrl();
    const shareText = `בוא לראות את תכנית הטיול שלי!\n${tripPlan.route?.origin || ''} → ${tripPlan.route?.destination || ''}\n\n`;

    switch (method) {
      case 'copy':
        navigator.clipboard.writeText(shareText + tripUrl);
        setSnackbar({ open: true, message: '📋 הקישור הועתק ללוח!', severity: 'success' });
        break;
      
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + tripUrl)}`, '_blank');
        break;
      
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent('תכנית הטיול שלי')}&body=${encodeURIComponent(shareText + tripUrl)}`, '_blank');
        break;
      
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(tripUrl)}`, '_blank');
        break;
      
      default:
        break;
    }
  };

  /**
   * יצירת URL לשיתוף
   */
  const generateShareUrl = () => {
    const tripData = btoa(JSON.stringify({ tripPlan, schedule }));
    return `${window.location.origin}/shared-trip?data=${tripData}`;
  };

  /**
   * הורדת תכנית כקובץ JSON
   */
  const downloadTripPlan = () => {
    const tripData = {
      name: tripName || 'תכנית הטיול שלי',
      createdAt: new Date().toISOString(),
      tripPlan: tripPlan,
      schedule: schedule
    };

    const dataStr = JSON.stringify(tripData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trip-plan-${Date.now()}.json`;
    link.click();
    
    setSnackbar({ open: true, message: '✅ הקובץ הורד בהצלחה!', severity: 'success' });
  };

  /**
   * טעינת תכניות שמורות
   */
  React.useEffect(() => {
    const trips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
    setSavedTrips(trips);
  }, []);

  return (
    <Box>
      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          color="success"
          startIcon={<SaveIcon />}
          onClick={() => setSaveDialogOpen(true)}
          fullWidth
        >
          שמור תכנית
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<ShareIcon />}
          onClick={() => setShareDialogOpen(true)}
          fullWidth
        >
          שתף
        </Button>
      </Stack>

      {/* דיאלוג שמירה */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>💾 שמור תכנית טיול</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="שם תכנית הטיול"
            fullWidth
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
            placeholder="למשל: טיול משפחתי בצפון"
            sx={{ mb: 2, mt: 1 }}
          />

          <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              סיכום התכנית:
            </Typography>
            <Typography variant="body2">
              🚌 מסלול: {tripPlan.route?.name || 'לא נבחר'}
            </Typography>
            <Typography variant="body2">
              🎯 אטרקציות: {tripPlan.attractions?.length || 0}
            </Typography>
            <Typography variant="body2">
              🍽️ מסעדות: {tripPlan.restaurants?.length || 0}
            </Typography>
            <Typography variant="body2">
              🏨 מלונות: {tripPlan.hotels?.length || 0}
            </Typography>
          </Paper>

          {/* תכניות שמורות */}
          {savedTrips.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                תכניות שמורות ({savedTrips.length}):
              </Typography>
              <List dense>
                {savedTrips.slice(-3).map((trip) => (
                  <ListItem key={trip.id} sx={{ bgcolor: 'grey.50', borderRadius: 1, mb: 0.5 }}>
                    <ListItemIcon>
                      <CheckIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={trip.name}
                      secondary={new Date(trip.createdAt).toLocaleDateString('he-IL')}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>ביטול</Button>
          <Button onClick={saveTripPlan} variant="contained" color="success">
            שמור
          </Button>
        </DialogActions>
      </Dialog>

      {/* דיאלוג שיתוף */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>📤 שתף תכנית טיול</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            בחר איך תרצה לשתף את תכנית הטיול:
          </Typography>

          <Stack spacing={2}>
            <Button
              variant="outlined"
              startIcon={<CopyIcon />}
              onClick={() => shareTripPlan('copy')}
              fullWidth
            >
              העתק קישור
            </Button>

            <Button
              variant="outlined"
              startIcon={<WhatsAppIcon />}
              onClick={() => shareTripPlan('whatsapp')}
              sx={{ color: '#25D366', borderColor: '#25D366' }}
              fullWidth
            >
              שתף ב-WhatsApp
            </Button>

            <Button
              variant="outlined"
              startIcon={<EmailIcon />}
              onClick={() => shareTripPlan('email')}
              fullWidth
            >
              שלח במייל
            </Button>

            <Button
              variant="outlined"
              startIcon={<FacebookIcon />}
              onClick={() => shareTripPlan('facebook')}
              sx={{ color: '#1877F2', borderColor: '#1877F2' }}
              fullWidth
            >
              שתף ב-Facebook
            </Button>

            <Divider sx={{ my: 1 }} />

            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={downloadTripPlan}
              color="secondary"
              fullWidth
            >
              הורד כקובץ JSON
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>סגור</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar להודעות */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TripSaveShare;
