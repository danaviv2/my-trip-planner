import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Paper,
  Box,
  Tabs,
  Tab,
  Grid,
} from '@mui/material';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { useTripSave } from '../contexts/TripSaveContext';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PreferencesForm from '../components/trip-planner/PreferencesForm';
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

const TripPlannerPage = () => {
  const { userPreferences, updateLocation } = useUserPreferences();
  const { saveTripToList } = useTripSave();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { tripPlan, selectedDayIndex } = useTripContext();
  const [saved, setSaved] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [mainTab, setMainTab] = useState('plan');
  const [servicesTab, setServicesTab] = useState(0);
  const [tripLogs, setTripLogs] = useState(JSON.parse(localStorage.getItem('tripLogs')) || []);
  const [accommodations, setAccommodations] = useState([]);
  const [hotelModalOpen, setHotelModalOpen] = useState(false);
  // מיקוד המפה — שם מלון/יעד ספציפי שנבחר
  const [mapFocus, setMapFocus] = useState(null);
  // רשימת מלונות שהוחזרה מ-AI — לציון על המפה
  const [hotelRecommendations, setHotelRecommendations] = useState([]);

  useEffect(() => {
    const dest = searchParams.get('destination');
    if (dest) updateLocation(dest);
  }, [searchParams]);

  // איפוס מיקוד המפה ורשימת המלונות בעת החלפת לשונית
  useEffect(() => {
    setMapFocus(null);
    if (servicesTab !== 1) setHotelRecommendations([]);
  }, [mainTab, servicesTab]);

  const handleSaveTrip = async () => {
    await saveTripToList({
      destination: userPreferences.location,
      days: userPreferences.days,
      budget: userPreferences.budget,
      startDate: userPreferences.startDate,
      dailyItinerary: tripPlan?.dailyItinerary || [],
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const saveTripLog = () => {
    const newLog = {
      id: Date.now(),
      date: new Date().toISOString(),
      destination: userPreferences.location,
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
          {userPreferences.location
            ? t('tripPlanner.title', { location: userPreferences.location })
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

            <PreferencesForm />
            <TripPlanner />

            <AccommodationPlanner
              accommodations={accommodations}
              setAccommodations={setAccommodations}
              hotelModalOpen={hotelModalOpen}
              setHotelModalOpen={setHotelModalOpen}
            />

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
              trip={{
                destination: userPreferences.location,
                days: userPreferences?.days,
                budget: userPreferences?.budget,
                startDate: userPreferences?.startDate,
              }}
            />

            <Box mt={3} mb={3}>
              <Typography variant="h6" sx={{ mb: 2 }}>{t('tripPlanner.tripLogs')}</Typography>
              {tripLogs.map(log => (
                <Paper key={log.id} sx={{ p: 2, m: '5px 0', bgcolor: '#f9f9f9', borderRadius: '8px', boxShadow: 1 }}>
                  <Typography>{t('tripPlanner.date')}: {new Date(log.date).toLocaleDateString()}</Typography>
                  <Typography>{t('tripPlanner.end')}: {log.destination}</Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <Button variant="outlined" color="error" onClick={() => deleteTripLog(log.id)}>
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
