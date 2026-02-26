import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Card, CardContent,
  CardActions, Button, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Avatar, Divider, Tooltip
} from '@mui/material';
import {
  Flight as FlightIcon,
  Delete as DeleteIcon,
  Map as MapIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as BudgetIcon,
  Schedule as DaysIcon,
  Add as AddIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { useTripSave } from '../contexts/TripSaveContext';
import { useAuth } from '../contexts/AuthContext';
import ShareTripDialog from '../components/shared/ShareTripDialog';

const BUDGET_LABELS = {
  low: { label: 'חסכוני', color: 'success' },
  medium: { label: 'בינוני', color: 'warning' },
  high: { label: 'פרימיום', color: 'error' },
};

const DESTINATION_EMOJIS = ['🗼', '🏖️', '🗽', '🏯', '🌋', '🏔️', '🌊', '🏛️', '🌴', '🎡'];
const getEmoji = (id) => DESTINATION_EMOJIS[id % DESTINATION_EMOJIS.length];

const formatDate = (iso) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return null;
  }
};

const TripCard = ({ trip, onDelete, onShare }) => {
  const navigate = useNavigate();
  const destination = trip.endPoint || trip.destination || trip.location || 'יעד לא ידוע';
  const days = trip.days || trip.duration || trip.userPreferences?.days || null;
  const budget = trip.budget || trip.userPreferences?.budget || null;
  const startDate = trip.startDate || trip.userPreferences?.startDate || null;
  const savedAt = formatDate(trip.savedAt);
  const budgetInfo = BUDGET_LABELS[budget];

  return (
    <Card elevation={3} sx={{
      borderRadius: 3,
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* כותרת הכרטיס */}
      <Box sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}>
        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', fontSize: '1.5rem', width: 48, height: 48 }}>
          {getEmoji(trip.id)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" fontWeight={700} color="white" noWrap>
            {destination}
          </Typography>
          {savedAt && (
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
              נשמר: {savedAt}
            </Typography>
          )}
        </Box>
        <Tooltip title="שתף טיול">
          <IconButton size="small" onClick={() => onShare(trip)} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.15)' } }}>
            <ShareIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="מחק טיול">
          <IconButton size="small" onClick={() => onDelete(trip.id)} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,0,0,0.2)' } }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <CardContent sx={{ flex: 1, pt: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {days && (
            <Chip icon={<DaysIcon />} label={`${days} ימים`} size="small" variant="outlined" />
          )}
          {startDate && (
            <Chip icon={<CalendarIcon />} label={formatDate(startDate) || startDate} size="small" variant="outlined" />
          )}
          {budgetInfo && (
            <Chip icon={<BudgetIcon />} label={budgetInfo.label} size="small" color={budgetInfo.color} />
          )}
        </Box>
      </CardContent>

      <Divider />

      <CardActions sx={{ p: 1.5, gap: 1 }}>
        <Button
          size="small"
          variant="contained"
          startIcon={<MapIcon />}
          onClick={() => navigate(`/trip-planner?destination=${encodeURIComponent(destination)}`)}
          sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', flex: 1 }}
        >
          המשך תכנון
        </Button>
      </CardActions>
    </Card>
  );
};

const EmptyState = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <Typography variant="h1" sx={{ fontSize: '5rem', mb: 2 }}>✈️</Typography>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        עדיין אין טיולים שמורים
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        תתחיל לתכנן את הטיול הראשון שלך!
      </Typography>
      <Button
        variant="contained"
        size="large"
        startIcon={<AddIcon />}
        onClick={() => navigate('/trip-planner')}
        sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', px: 4 }}
      >
        תכנן טיול חדש
      </Button>
    </Box>
  );
};

const MyTripsPage = () => {
  const { savedTrips, deleteTrip } = useTripSave();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);

  const handleDeleteConfirm = () => {
    if (deleteTarget !== null) {
      deleteTrip(deleteTarget);
      setDeleteTarget(null);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', pt: 10, pb: 6 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Avatar
            src={user?.photoURL}
            sx={{ width: 56, height: 56, bgcolor: 'rgba(255,255,255,0.2)', fontSize: '1.5rem' }}
          >
            {!user?.photoURL && (user?.displayName?.[0] || user?.email?.[0] || '?').toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight={800} color="white">
              הטיולים שלי
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              {user?.displayName || user?.email}
              {savedTrips.length > 0 && ` · ${savedTrips.length} טיולים שמורים`}
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => navigate('/trip-planner')}
            sx={{ bgcolor: 'white', color: '#764ba2', fontWeight: 700, '&:hover': { bgcolor: '#f3f0ff' } }}
          >
            תכנן טיול חדש
          </Button>
        </Box>

        {/* תוכן */}
        <Box sx={{ bgcolor: 'white', borderRadius: 3, p: { xs: 2, md: 4 }, minHeight: 400 }}>
          {savedTrips.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FlightIcon color="primary" /> כל הטיולים
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  href="/trip-planner"
                >
                  טיול חדש
                </Button>
              </Box>
              <Grid container spacing={3}>
                {savedTrips.map((trip) => (
                  <Grid item xs={12} sm={6} md={4} key={trip.id}>
                    <TripCard trip={trip} onDelete={setDeleteTarget} onShare={setShareTarget} />
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </Box>
      </Container>

      {/* דיאלוג שיתוף */}
      <ShareTripDialog
        open={shareTarget !== null}
        onClose={() => setShareTarget(null)}
        trip={shareTarget || {}}
      />

      {/* דיאלוג אישור מחיקה */}
      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>מחיקת טיול</DialogTitle>
        <DialogContent>
          <Typography>האם אתה בטוח שברצונך למחוק את הטיול? פעולה זו אינה הפיכה.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>ביטול</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">מחק</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyTripsPage;
