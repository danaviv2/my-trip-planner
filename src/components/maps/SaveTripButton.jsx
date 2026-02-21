import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Alert
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useTripSave } from '../../contexts/TripSaveContext';

const SaveTripButton = ({ tripData }) => {
  const [open, setOpen] = useState(false);
  const [tripName, setTripName] = useState('');
  const [saved, setSaved] = useState(false);
  const { saveTripToList } = useTripSave();

  const handleSave = () => {
    if (!tripName.trim()) {
      alert('נא להזין שם לטיול');
      return;
    }

    saveTripToList({
      ...tripData,
      name: tripName
    });

    setSaved(true);
    setTimeout(() => {
      setOpen(false);
      setSaved(false);
      setTripName('');
    }, 2000);
  };

  return (
    <>
      <Button
        variant="contained"
        color="success"
        startIcon={<SaveIcon />}
        onClick={() => setOpen(true)}
      >
        שמור טיול
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>💾 שמירת טיול</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 300 }}>
            {saved ? (
              <Alert severity="success">✅ הטיול נשמר בהצלחה!</Alert>
            ) : (
              <>
                <TextField
                  fullWidth
                  label="שם הטיול"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  placeholder="לדוגמה: טיול משפחתי לפריז"
                  autoFocus
                />
              </>
            )}
          </Stack>
        </DialogContent>
        {!saved && (
          <DialogActions>
            <Button onClick={() => setOpen(false)}>ביטול</Button>
            <Button onClick={handleSave} variant="contained">שמור</Button>
          </DialogActions>
        )}
      </Dialog>
    </>
  );
};

export default SaveTripButton;
