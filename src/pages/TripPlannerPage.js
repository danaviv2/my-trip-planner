import React, { useState, useEffect, useRef } from 'react';
import {
  Typography,
  Button,
  Paper,
  Box,
  Tabs,
  Tab,
  Grid,
  Chip,
  Divider,
} from '@mui/material';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { useTripSave } from '../contexts/TripSaveContext';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TripPlanner from '../components/trip-planner/TripPlanner';
import AccommodationPlanner from '../components/trip-planner/AccommodationPlanner';
import ShareTripDialog from '../components/shared/ShareTripDialog';
import ShareIcon from '@mui/icons-material/Share';
import FlightIcon from '@mui/icons-material/Flight';
import HotelIcon from '@mui/icons-material/Hotel';
import DriveEtaIcon from '@mui/icons-material/DriveEta';
import FlightSearch from '../components/travel-services/FlightSearch';
import HotelSearch from '../components/travel-services/HotelSearch';
import CarRentalSearch from '../components/travel-services/CarRentalSearch';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useTripContext } from '../contexts/TripContext';
import HotelMap from '../components/map/HotelMap';
import TripMap from '../components/map/TripMap';
import BookingSync from '../components/bookings/BookingSync';
import { useAuth } from '../contexts/AuthContext';
import { saveBooking, loadBookings, deleteBooking } from '../services/firestoreService';
import { bookingEmoji, bookingColor, bookingLabel } from '../services/bookingParserService';
import DeleteIcon from '@mui/icons-material/Delete';

const TripPlannerPage = () => {
  const { userPreferences, updateLocation, updateDays, updateBudget, updateStartDate } = useUserPreferences();
  const { saveTripToList, savedTrips } = useTripSave();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { tripPlan, selectedDayIndex, updateTripPlan } = useTripContext();
  const [saved, setSaved] = useState(false);
  const [lastSavedTripId, setLastSavedTripId] = useState(searchParams.get('tripId') || null);
  const [shareOpen, setShareOpen] = useState(false);
  const [mainTab, setMainTab] = useState('plan');
  const [servicesTab, setServicesTab] = useState(0);
  const [tripLogs, setTripLogs] = useState(JSON.parse(localStorage.getItem('tripLogs')) || []);
  const [accommodations, setAccommodations] = useState([]);
  const [hotelModalOpen, setHotelModalOpen] = useState(false);
  const [mapFocus, setMapFocus] = useState(null);
  const [hotelRecommendations, setHotelRecommendations] = useState([]);
  const [syncedBookings, setSyncedBookings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('syncedBookings') || '[]'); } catch { return []; }
  });
  const restoredRef = useRef(false);

  // טען הזמנות מ-Firestore כשמשתמש מתחבר
  useEffect(() => {
    if (!user) return;
    loadBookings(user.uid)
      .then(fb => {
        const local = syncedBookings;
        const fbIds = new Set(fb.map(b => String(b.id)));
        const merged = [...fb, ...local.filter(b => !fbIds.has(String(b.id)))];
        setSyncedBookings(merged);
        localStorage.setItem('syncedBookings', JSON.stringify(merged));
      })
      .catch(() => {});
  }, [user]); // eslint-disable-line

  const handleBookingAdded = async (booking) => {
    const updated = [...syncedBookings.filter(b => b.id !== booking.id), booking];
    setSyncedBookings(updated);
    localStorage.setItem('syncedBookings', JSON.stringify(updated));
    if (user) {
      try { await saveBooking(user.uid, booking); } catch {}
    }
  };

  const handleBookingDeleted = async (bookingId) => {
    const updated = syncedBookings.filter(b => b.id !== bookingId);
    setSyncedBookings(updated);
    localStorage.setItem('syncedBookings', JSON.stringify(updated));
    if (user) {
      try { await deleteBooking(user.uid, bookingId); } catch {}
    }
  };

  useEffect(() => {
    const tripId = searchParams.get('tripId');
    const dest = searchParams.get('destination');

    if (!tripId) {
      if (dest) updateLocation(dest);
      return;
    }

    if (restoredRef.current) return;

    // קרא מ-localStorage ישירות — לא לחכות ל-savedTrips שיטען מ-Firestore
    let allTrips = [];
    try {
      allTrips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
    } catch {}

    // אם localStorage ריק — נסה מ-savedTrips מהקונטקסט
    if (allTrips.length === 0) allTrips = savedTrips;

    const trip = allTrips.find(t => String(t.id) === String(tripId));
    console.log('🔍 restoring trip:', tripId, '| found:', !!trip, '| itinerary days:', trip?.dailyItinerary?.length || 0);
    if (!trip) return; // עדיין לא טעון — המתן לרנדר הבא

    restoredRef.current = true;
    const dest2 = trip.destination || trip.endPoint || trip.location;
    if (dest2) updateLocation(dest2);
    if (trip.days) updateDays(trip.days);
    const budgetVal = ['low', 'medium', 'high'].includes(trip.budget) ? trip.budget : 'medium';
    updateBudget(budgetVal);
    if (trip.startDate) updateStartDate(trip.startDate);
    if (trip.dailyItinerary?.length > 0) {
      updateTripPlan({ destination: dest2, dailyItinerary: trip.dailyItinerary });
    }
  }, [searchParams, savedTrips]);

  // איפוס מיקוד המפה ורשימת המלונות בעת החלפת לשונית
  useEffect(() => {
    setMapFocus(null);
    if (servicesTab !== 1) setHotelRecommendations([]);
  }, [mainTab, servicesTab]);

  const handleSaveTrip = async () => {
    const dest = tripPlan?.destination || userPreferences.location;
    const trip = await saveTripToList({
      destination: dest,
      days: userPreferences.days,
      budget: userPreferences.budget,
      startDate: userPreferences.startDate,
      dailyItinerary: tripPlan?.dailyItinerary || [],
    });
    if (trip?.id) setLastSavedTripId(String(trip.id));
    // שמור גם ביומן הטיולים
    saveTripLog();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const saveTripLog = () => {
    const newLog = {
      id: Date.now(),
      date: new Date().toISOString(),
      destination: tripPlan?.destination || userPreferences.location,
      dailyItinerary: tripPlan?.dailyItinerary || [],
    };
    const updatedLogs = [...tripLogs, newLog];
    setTripLogs(updatedLogs);
    localStorage.setItem('tripLogs', JSON.stringify(updatedLogs));
  };

  const deleteTripLog = (id) => {
    const updatedLogs = tripLogs.filter(log => log.id !== id);
    setTripLogs(updatedLogs);
    localStorage.setItem('tripLogs', JSON.stringify(updatedLogs));
  };

  // --- חישוב src המפה לפי הקשר ---
  const buildMapSrc = () => {
    const dest = userPreferences.location || 'ישראל';

    // לשונית שירותים
    if (mainTab === 'services') {
      if (servicesTab === 0) {
        // טיסות — שדה תעופה ביעד
        return {
          src: `https://maps.google.com/maps?q=airport+in+${encodeURIComponent(dest)}&output=embed&hl=en`,
          label: `✈️ שדה תעופה ב-${dest}`,
        };
      }
      if (servicesTab === 1) {
        // מלון ספציפי שנלחץ "הצג על המפה"
        if (mapFocus) {
          return {
            src: `https://maps.google.com/maps?q=${encodeURIComponent(mapFocus + ' ' + dest)}&output=embed&hl=en`,
            label: `🏨 ${mapFocus}`,
          };
        }
        // הצג חיפוש מלונות ביעד — מציג סיכות מלונות רבות על המפה
        return {
          src: `https://maps.google.com/maps?q=hotels+in+${encodeURIComponent(dest)}&output=embed&hl=en`,
          label: hotelRecommendations.length > 0
            ? `🏨 מלונות ב-${dest} — לחץ על כרטיסייה להתמקד במלון ספציפי`
            : `🏨 מלונות ב-${dest}`,
        };
      }
      if (servicesTab === 2) {
        // רכב — סוכנויות השכרה ביעד
        if (mapFocus) {
          return {
            src: `https://maps.google.com/maps?q=${encodeURIComponent(mapFocus + ' car rental ' + dest)}&output=embed&hl=en`,
            label: `🚗 ${mapFocus} ב-${dest}`,
          };
        }
        return {
          src: `https://maps.google.com/maps?q=car+rental+in+${encodeURIComponent(dest)}&output=embed&hl=en`,
          label: `🚗 השכרת רכב ב-${dest}`,
        };
      }
    }

    // לשונית מידע על יעד
    if (mainTab === 'destination') {
      return {
        src: `https://maps.google.com/maps?q=tourist+attractions+in+${encodeURIComponent(dest)}&output=embed&hl=en`,
        label: `📍 אטרקציות ב-${dest}`,
      };
    }

    // לשונית תכנון — לפי יום נבחר
    const currentDayActivities = tripPlan?.dailyItinerary?.[selectedDayIndex]?.activities || [];
    const dayAddresses = currentDayActivities.filter(a => a.address).map(a => a.address);

    if (dayAddresses.length >= 2) {
      const saddr = encodeURIComponent(dayAddresses[0]);
      const daddrParts = [encodeURIComponent(dayAddresses[1])];
      for (let i = 2; i < dayAddresses.length; i++) daddrParts.push(`to:${encodeURIComponent(dayAddresses[i])}`);
      return {
        src: `https://maps.google.com/maps?saddr=${saddr}&daddr=${daddrParts.join('+')}&dirflg=d&output=embed&hl=en`,
        label: `🗺️ מסלול יום ${selectedDayIndex + 1}: ${dayAddresses.slice(0, 3).join(' → ')}${dayAddresses.length > 3 ? ' ...' : ''}`,
      };
    }
    if (dayAddresses.length === 1) {
      return {
        src: `https://maps.google.com/maps?q=${encodeURIComponent(dayAddresses[0])}&output=embed&hl=en`,
        label: `📍 ${dayAddresses[0]}`,
      };
    }
    return {
      src: `https://maps.google.com/maps?q=tourist+attractions+in+${encodeURIComponent(dest)}&output=embed&hl=en`,
      label: dest ? `📍 אטרקציות ב-${dest}` : null,
    };
  };

  const { src: mapSrc, label: mapLabel } = buildMapSrc();

  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto' }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: '#ffffff', borderRadius: '16px' }}>
        <Typography variant="h4" align="center" gutterBottom sx={{
          color: '#2c3e50',
          fontWeight: 'bold',
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <i className="material-icons" style={{ marginRight: '8px', fontSize: '36px' }}>explore</i>
          {(tripPlan?.destination || userPreferences.location)
            ? t('tripPlanner.title', { location: tripPlan?.destination || userPreferences.location })
            : t('tripPlanner.titleDefault')}
        </Typography>

        {/* לשוניות ראשיות */}
        <Box sx={{ mb: 3 }}>
          <Tabs
            value={mainTab}
            onChange={(e, newValue) => setMainTab(newValue)}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab value="plan" label={t('tripPlanner.tabPlan')} icon={<i className="material-icons">map</i>} iconPosition="start" />
            <Tab value="services" label={t('tripPlanner.tabServices')} icon={<i className="material-icons">flight</i>} iconPosition="start" />
            <Tab value="destination" label={t('tripPlanner.tabDestination')} icon={<i className="material-icons">location_city</i>} iconPosition="start" />
          </Tabs>
        </Box>

        {/* לשונית תכנון מסלול */}
        {mainTab === 'plan' && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={saved ? <CheckCircleIcon /> : <SaveIcon />}
                onClick={handleSaveTrip}
                disabled={!userPreferences.location}
                sx={{
                  background: saved
                    ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  px: 3,
                  fontWeight: 700,
                  transition: 'all 0.3s',
                }}
              >
                {saved ? t('tripPlanner.saved') : t('tripPlanner.save')}
              </Button>
            </Box>

            <TripPlanner />

            <AccommodationPlanner
              accommodations={accommodations}
              setAccommodations={setAccommodations}
              hotelModalOpen={hotelModalOpen}
              setHotelModalOpen={setHotelModalOpen}
            />

            {/* פאנל הזמנות מסונכרנות */}
            <Box mt={3} mb={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="h6">
                  ✈️ הזמנות מסונכרנות
                  {syncedBookings.length > 0 && (
                    <Chip label={syncedBookings.length} size="small" color="primary" sx={{ ml: 1 }} />
                  )}
                </Typography>
                <BookingSync onBookingsAdded={handleBookingAdded} />
              </Box>

              {syncedBookings.length === 0 ? (
                <Box sx={{ bgcolor: '#f8f9fa', borderRadius: 2, p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    לחץ על "סנכרן מ-Gmail" כדי לייבא הזמנות טיסה, מלון ורכב אוטומטית
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {syncedBookings.map(b => (
                    <Paper key={b.id} elevation={1} sx={{
                      p: 1.5, borderRadius: 2,
                      borderLeft: `4px solid ${bookingColor(b.type)}`,
                      display: 'flex', alignItems: 'center', gap: 1.5,
                    }}>
                      <Typography fontSize="1.3rem">{bookingEmoji(b.type)}</Typography>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.2 }}>
                          <Chip label={bookingLabel(b.type)} size="small"
                            sx={{ bgcolor: bookingColor(b.type), color: 'white', fontSize: '0.6rem', height: 18 }} />
                          {b.status === 'confirmed' && <Chip label="מאושר ✓" size="small" color="success" sx={{ fontSize: '0.6rem', height: 18 }} />}
                        </Box>
                        <Typography variant="body2" fontWeight={700} noWrap>{b.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {b.checkIn}{b.checkOut && b.checkOut !== b.checkIn ? ` → ${b.checkOut}` : ''}
                          {b.destination ? ` · ${b.destination}` : ''}
                          {b.price ? ` · ${b.price}` : ''}
                        </Typography>
                      </Box>
                      <DeleteIcon
                        fontSize="small"
                        sx={{ color: '#ccc', cursor: 'pointer', '&:hover': { color: '#f44336' } }}
                        onClick={() => handleBookingDeleted(b.id)}
                      />
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Box mt={3} mb={3}>
              <Typography variant="h6" sx={{ mb: 2 }}>{t('tripPlanner.shareAndSave')}</Typography>
              <Grid container spacing={2}>
                <Grid item>
                  <Button
                    variant="contained"
                    startIcon={<ShareIcon />}
                    onClick={() => setShareOpen(true)}
                    sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                  >
                    {t('tripPlanner.shareTrip')}
                  </Button>
                </Grid>
                <Grid item>
                  <Button variant="contained" color="primary" onClick={saveTripLog} startIcon={<i className="material-icons">save</i>}>
                    {t('tripPlanner.saveRoute')}
                  </Button>
                </Grid>
              </Grid>
            </Box>

            <ShareTripDialog
              open={shareOpen}
              onClose={() => setShareOpen(false)}
              trip={{ destination: userPreferences.location }}
              shareUrl={
                lastSavedTripId
                  ? `${window.location.origin}/trip-planner?tripId=${lastSavedTripId}`
                  : undefined
              }
            />

            <Box mt={3} mb={3}>
              <Typography variant="h6" sx={{ mb: 2 }}>{t('tripPlanner.tripLogs')}</Typography>
              {tripLogs.length === 0 && (
                <Typography variant="body2" color="text.secondary">{t('tripPlanner.noLogs')}</Typography>
              )}
              {tripLogs.map(log => (
                <Paper key={log.id} sx={{ p: 2, m: '5px 0', bgcolor: '#f9f9f9', borderRadius: '8px', boxShadow: 1 }}>
                  <Typography fontWeight={700}>{log.destination}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('tripPlanner.date')}: {new Date(log.date).toLocaleDateString()}
                    {log.dailyItinerary?.length > 0 && ` · ${log.dailyItinerary.length} ${t('tripPlanner.days')}`}
                    {(log.waypoints || []).length > 0 && ` · ${(log.waypoints || []).join(', ')}`}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {log.dailyItinerary?.length > 0 && (
                      <Button
                        variant="contained"
                        size="small"
                        sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                        onClick={() => {
                          updateTripPlan({ destination: log.destination, dailyItinerary: log.dailyItinerary });
                          updateLocation(log.destination);
                          setMainTab('plan');
                        }}
                      >
                        {t('tripPlanner.openTrip')}
                      </Button>
                    )}
                    <Button variant="outlined" color="error" size="small" onClick={() => deleteTripLog(log.id)}>
                      {t('tripPlanner.delete')}
                    </Button>
                  </Box>
                </Paper>
              ))}
            </Box>
          </>
        )}

        {/* לשונית שירותי נסיעות */}
        {mainTab === 'services' && (
          <>
            <Typography variant="h5" align="center" gutterBottom sx={{ mb: 3 }}>
              {t('tripPlanner.servicesTitle')}
            </Typography>

            <Tabs
              value={servicesTab}
              onChange={(e, newValue) => setServicesTab(newValue)}
              variant="fullWidth"
              sx={{ mb: 3 }}
            >
              <Tab label={t('tripPlanner.flights')} icon={<FlightIcon />} />
              <Tab label={t('tripPlanner.hotels')} icon={<HotelIcon />} />
              <Tab label={t('tripPlanner.carRental')} icon={<DriveEtaIcon />} />
            </Tabs>

            {servicesTab === 0 && (
              <FlightSearch
                origin="תל אביב"
                destination={userPreferences.location}
              />
            )}
            {servicesTab === 1 && (
              <HotelSearch
                destination={userPreferences.location}
                onHotelsLoaded={(hotels) => { setHotelRecommendations(hotels); setMapFocus(null); }}
                onShowOnMap={(hotelName) => setMapFocus(hotelName)}
              />
            )}
            {servicesTab === 2 && (
              <CarRentalSearch
                location={userPreferences.location}
                onShowOnMap={(name) => setMapFocus(name)}
              />
            )}
          </>
        )}

        {/* לשונית מידע על היעד */}
        {mainTab === 'destination' && (
          <>
            <Typography variant="h5" align="center" gutterBottom sx={{ mb: 3 }}>
              {t('tripPlanner.destinationInfo', { location: userPreferences.location })}
            </Typography>
            <Box sx={{ textAlign: 'center', p: 5, color: '#666' }}>
              <i className="material-icons" style={{ fontSize: '64px', color: '#ccc' }}>info</i>
              <Typography variant="body1">{t('tripPlanner.destinationInfoPlaceholder')}</Typography>
            </Box>
          </>
        )}
      </Paper>

      {/* מפה חכמה */}
      <Paper elevation={3} sx={{ p: 0, mb: 4, borderRadius: '16px', overflow: 'hidden' }}>
        {/* כותרת */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {mapLabel && (
            <Typography variant="body2" color="text.secondary">{mapLabel}</Typography>
          )}
          {mapFocus && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => setMapFocus(null)}
              sx={{ fontSize: '0.7rem', py: 0.3, px: 1 }}
            >
              ← חזור לכל המלונות
            </Button>
          )}
        </Box>

        {/* מפת מסלול יומי — כשיש תכנון AI ואנחנו בלשונית תכנון */}
        {mainTab === 'plan' && tripPlan && (
          <TripMap
            tripPlan={tripPlan}
            selectedDayIndex={selectedDayIndex}
          />
        )}

        {/* מפת מלונות Leaflet — נשארת מותקנת (display:none שומר על הסיכות) */}
        {mainTab === 'services' && servicesTab === 1 && hotelRecommendations.length > 0 && (
          <Box sx={{ display: mapFocus ? 'none' : 'block' }}>
            <HotelMap
              hotels={hotelRecommendations}
              destination={userPreferences.location}
            />
          </Box>
        )}

        {/* iframe — לכל שאר המצבים */}
        {!(mainTab === 'plan' && tripPlan) &&
         !(mainTab === 'services' && servicesTab === 1 && hotelRecommendations.length > 0 && !mapFocus) && (
          <Box sx={{ height: { xs: '400px', md: '520px' }, width: '100%' }}>
            <iframe
              key={mapSrc}
              src={mapSrc}
              width="100%"
              height="100%"
              style={{ border: 0, display: 'block' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="מפה"
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default TripPlannerPage;
