import React, { useState, useRef, useEffect } from 'react';
import {
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  CircularProgress,
  IconButton,
  Tabs,
  Tab,
  Grid,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { useTripSave } from '../contexts/TripSaveContext';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TravelInfoComponent from '../components/travel-info/TravelInfoComponent';
import PreferencesForm from '../components/trip-planner/PreferencesForm';
import TripPlanner from '../components/trip-planner/TripPlanner';
import RouteNavigationButtons from '../components/trip-planner/RouteNavigationButtons';
import AccommodationPlanner from '../components/trip-planner/AccommodationPlanner';
import ShareTripDialog from '../components/shared/ShareTripDialog';
import ShareIcon from '@mui/icons-material/Share';
import TravelServicesTab from '../components/travel-services/TravelServicesTab';
import FlightIcon from '@mui/icons-material/Flight';
import HotelIcon from '@mui/icons-material/Hotel';
import DriveEtaIcon from '@mui/icons-material/DriveEta';
import FlightSearch from '../components/travel-services/FlightSearch';
import HotelSearch from '../components/travel-services/HotelSearch';
import CarRentalSearch from '../components/travel-services/CarRentalSearch';
import { fetchWeatherForecast, fetchGeoInfo } from '../components/WeatherForecast';
import { useTranslation } from 'react-i18next';
/**
 * דף תכנון מסלול - מרכז את כל פונקציונליות תכנון הטיול
 */
const TripPlannerPage = () => {
  // שימוש בהעדפות משתמש מהקונטקסט
  const { userPreferences, updateLocation } = useUserPreferences();
  const { saveTripToList } = useTripSave();
  const { t } = useTranslation();
  const [saved, setSaved] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // משתני מצב מהאפליקציה המקורית
  const [mainTab, setMainTab] = useState('plan');
  const [servicesTab, setServicesTab] = useState(0);
  const [startPoint, setStartPoint] = useState('');
  const [endPoint, setEndPoint] = useState('');
  const [waypoints, setWaypoints] = useState([]);
  const [waypointInput, setWaypointInput] = useState('');
  const [directions, setDirections] = useState(null);
  const [attractions, setAttractions] = useState([]);
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState(['all', 'nature', 'winery', 'culinary', 'touristAttraction', 'museum', 'restaurant', 'hotel', 'cafe', 'hospital', 'pharmacy', 'amusementPark', 'beach', 'historicalSite', 'nationalPark', 'localMarket', 'festival', 'spa']);
  const [mapCenter, setMapCenter] = useState({ lat: 31.771959, lng: 35.217018 }); // ברירת מחדל: ירושלים
  const [isMapsLoaded, setIsMapsLoaded] = useState(false);
  const [tripLogs, setTripLogs] = useState(JSON.parse(localStorage.getItem('tripLogs')) || []);
  const [tripPlan, setTripPlan] = useState({
    location: 'Bordeaux, France',
    duration: 7,
    theme: ['nature', 'winery', 'culinary'],
    dailyItinerary: [],
  });
  const [routeInfo, setRouteInfo] = useState({ distance: '', duration: '' });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedActivityIndex, setSelectedActivityIndex] = useState(null);
  const [editedAttraction, setEditedAttraction] = useState({ time: '', name: '', category: '', address: '', description: '', openingHours: '' });
  const [markers, setMarkers] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [hotelModalOpen, setHotelModalOpen] = useState(false);
  
  const mapRef = useRef();
  

  // פונקציות מקוריות מהאפליקציה
  const addWaypoint = () => {
    if (waypointInput) {
      setWaypoints([...waypoints, waypointInput]);
      setWaypointInput('');
    }
  };

  const onMapLoad = (map) => {
    mapRef.current = map;
    if (!map) {
      console.error('המפה נכשלה בטעינה.');
    }
    setIsMapsLoaded(true);
  };

  // פונקציית החיפוש מהאפליקציה המקורית
  const searchRoute = async () => {
    if (!startPoint || !endPoint) {
      alert(t('tripPlanner.fillStartAndEnd'));
      return;
    }

    setIsLoading(true);
    try {
      // כאן יש את לוגיקת החיפוש המקורית שלך
      // ...
      
      // לצורך הדוגמה, נדמה הצלחה לאחר 1.5 שניות
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // דוגמה להגדרת מידע מסלול
      setRouteInfo({
        distance: '150 km',
        duration: '2h 30m'
      });
      
      // אחרי פעולת החיפוש, נעדכן את ההעדפות
      if (endPoint) {
        updateLocation(endPoint);
      }
      
    } catch (error) {
      console.error('שגיאה בחיפוש המסלול:', error);
      alert(t('tripPlanner.routeSearchError', { msg: error.message || '' }));
    } finally {
      setIsLoading(false);
    }
  };

  // פונקציית תכנון עם AI מהאפליקציה המקורית
  const planTripWithAI = async () => {
    setIsLoading(true);
    try {
      // כאן יש את לוגיקת תכנון AI המקורית שלך
      // ...
      
      // לצורך הדוגמה, נדמה הצלחה לאחר 2 שניות
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // דוגמה לתכנית
      const mockItinerary = Array(userPreferences.days).fill(0).map((_, i) => ({
        day: i + 1,
        date: `Day ${getDayName(i)}`,
        location: userPreferences.location,
        summary: i === 0 ? `Arrival in ${userPreferences.location}` : `Day ${i + 1} in ${userPreferences.location}`,
        schedule: [
          {
            timeStart: "09:00",
            timeEnd: "11:00",
            type: "attraction",
            activity: "Site Visit",
            name: `Attraction ${i + 1}`,
            address: `${userPreferences.location}, City Center`,
            description: "Visit to a central city attraction"
          },
          {
            timeStart: "12:00",
            timeEnd: "13:30",
            type: "lunch",
            activity: "Lunch",
            name: `Local Restaurant`,
            address: `${userPreferences.location}, Restaurant Street`,
            description: "Authentic restaurant with local food"
          }
        ]
      }));
      
      setTripPlan(prev => ({ 
        ...prev, 
        dailyItinerary: mockItinerary, 
        location: userPreferences.location 
      }));
      
    } catch (error) {
      console.error('שגיאה בתכנון הטיול:', error);
      alert(t('tripPlanner.planError'));
    } finally {
      setIsLoading(false);
    }
  };

  // פונקציית הטיול המתגלגל מהאפליקציה המקורית
  const planRoadTrip = async () => {
    // כאן יש את הלוגיקה המקורית שלך
    // ...
    
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // לוגיקת הדוגמה
      alert(t('tripPlanner.roadTripDone'));
      
    } catch (error) {
      console.error('שגיאה בתכנון טיול מתגלגל:', error);
      alert(t('tripPlanner.roadTripError'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // פונקציה לטיפול בסינון אטרקציות
  const handleButtonFilter = (filter) => {
    try {
      setActiveFilters(prev => 
        prev.includes(filter) 
          ? prev.filter(f => f !== filter) 
          : [...prev, filter].filter(f => f !== 'all' || prev.length === 1)
      );
    } catch (error) {
      alert(t('tripPlanner.filterError', { msg: error.message || '' }));
    }
  };
  
  // שמירת טיול ל-Firestore דרך TripSaveContext
  const handleSaveTrip = async () => {
    await saveTripToList({
      endPoint,
      startPoint,
      waypoints,
      destination: endPoint || userPreferences.location,
      days: userPreferences.days,
      budget: userPreferences.budget,
      startDate: userPreferences.startDate,
      dailyItinerary: tripPlan.dailyItinerary,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // פונקציה לשמירת טיול
  const saveTripLog = () => {
    const newLog = {
      id: Date.now(),
      date: new Date().toISOString(),
      startPoint,
      endPoint,
      waypoints,
      attractions,
      dailyItinerary: tripPlan.dailyItinerary,
    };
    const updatedLogs = [...tripLogs, newLog];
    setTripLogs(updatedLogs);
    localStorage.setItem('tripLogs', JSON.stringify(updatedLogs));
    alert(t('tripPlanner.tripSaved'));
  };
  
  // פונקציות עזר
  const getDayName = (dayIndex) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex % 7];
  };
  
  // פונקציה לעריכת רשומות הטיול
  const editTripLog = (id, updatedLog) => {
    const updatedLogs = tripLogs.map(log => log.id === id ? { ...log, ...updatedLog } : log);
    setTripLogs(updatedLogs);
    localStorage.setItem('tripLogs', JSON.stringify(updatedLogs));
  };
  
  // פונקציה למחיקת רשומות הטיול
  const deleteTripLog = (id) => {
    const updatedLogs = tripLogs.filter(log => log.id !== id);
    setTripLogs(updatedLogs);
    localStorage.setItem('tripLogs', JSON.stringify(updatedLogs));
  };

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
            <Tab 
              value="plan" 
              label={t('tripPlanner.tabPlan')}
              icon={<i className="material-icons">map</i>} 
              iconPosition="start"
            />
            <Tab 
              value="services" 
              label={t('tripPlanner.tabServices')}
              icon={<i className="material-icons">flight</i>} 
              iconPosition="start"
            />
            <Tab 
              value="destination" 
              label={t('tripPlanner.tabDestination')}
              icon={<i className="material-icons">location_city</i>} 
              iconPosition="start"
            />
          </Tabs>
        </Box>
        
        {/* לשונית תכנון מסלול */}
        {mainTab === 'plan' && (
          <>
            {/* כפתור שמירת טיול */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={saved ? <CheckCircleIcon /> : <SaveIcon />}
                onClick={handleSaveTrip}
                disabled={!endPoint && !userPreferences.location}
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

            {/* מידע על נסיעה */}
            <TravelInfoComponent />
            
            {/* טופס חיפוש */}
            <Paper elevation={1} sx={{ p: 3, mb: 3, bgcolor: '#f8f9fa', borderRadius: '12px' }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <i className="material-icons" style={{ marginRight: '8px' }}>directions</i>
                {t('tripPlanner.routeSetup')}
              </Typography>
              
              <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label={t('tripPlanner.startPoint')}
                  value={startPoint}
                  onChange={(e) => setStartPoint(e.target.value)}
                  sx={{ mr: 1 }}
                  variant="outlined"
                />
                <IconButton onClick={searchRoute} color="primary" disabled={!startPoint || !endPoint} sx={{ background: '#4CAF50', color: '#fff' }}>
                  <AddIcon />
                </IconButton>
              </Box>
              
              {waypoints.map((wp, index) => (
                <Box key={index} display="flex" alignItems="center" sx={{ mb: 1 }}>
                  <TextField
                    fullWidth
                    label={t('tripPlanner.waypoint', { num: index + 1 })}
                    value={wp}
                    onChange={(e) => {
                      const newWaypoints = [...waypoints];
                      newWaypoints[index] = e.target.value;
                      setWaypoints(newWaypoints);
                    }}
                    sx={{ mr: 1 }}
                    variant="outlined"
                  />
                  <IconButton onClick={() => setWaypoints(waypoints.filter((_, i) => i !== index))} color="secondary" sx={{ background: '#f44336', color: '#fff' }}>
                    <AddIcon sx={{ transform: 'rotate(45deg)' }} />
                  </IconButton>
                </Box>
              ))}
              
              <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label={t('tripPlanner.addWaypoint')}
                  value={waypointInput}
                  onChange={(e) => setWaypointInput(e.target.value)}
                  sx={{ mr: 1 }}
                  variant="outlined"
                />
                <IconButton onClick={addWaypoint} color="primary" sx={{ background: '#4CAF50', color: '#fff' }}>
                  <AddIcon />
                </IconButton>
              </Box>
              
              <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label={t('tripPlanner.destination')}
                  value={endPoint}
                  onChange={(e) => setEndPoint(e.target.value)}
                  sx={{ mr: 1 }}
                  variant="outlined"
                />
                <IconButton onClick={searchRoute} color="primary" disabled={!startPoint || !endPoint} sx={{ background: '#4CAF50', color: '#fff' }}>
                  <AddIcon />
                </IconButton>
              </Box>
              
              <Box sx={{ textAlign: 'center' }}>
                {isLoading ? (
                  <CircularProgress />
                ) : (
                  <Button variant="contained" color="primary" fullWidth onClick={searchRoute} 
                    sx={{ background: '#2196F3', padding: '10px 20px' }}>
                    {t('tripPlanner.searchRoute')}
                  </Button>
                )}
              </Box>
            </Paper>
            
            {/* מידע על המסלול אם קיים */}
            {routeInfo.distance && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f0f0f0', borderRadius: '8px', boxShadow: 1, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
                  {t('tripPlanner.routeDetails')}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  {t('tripPlanner.distance')}: {routeInfo.distance} | {t('tripPlanner.travelTime')}: {routeInfo.duration}
                </Typography>
              </Box>
            )}
            
            {/* אפשרויות סינון אטרקציות */}
            <Box mt={3} display="flex" flexWrap="wrap" justifyContent="center" gap={1} mb={3}>
              <Button 
                variant={activeFilters.includes('all') ? 'contained' : 'outlined'} 
                onClick={() => handleButtonFilter('all')}
              >
                {t('tripPlanner.filterAll')}
              </Button>
              <Button
                variant={activeFilters.includes('nature') ? 'contained' : 'outlined'}
                onClick={() => handleButtonFilter('nature')}
                color="success"
              >
                {t('tripPlanner.filterNature')}
              </Button>
              <Button
                variant={activeFilters.includes('restaurant') ? 'contained' : 'outlined'}
                onClick={() => handleButtonFilter('restaurant')}
                color="warning"
              >
                {t('tripPlanner.filterRestaurants')}
              </Button>
              {/* שאר הכפתורים */}
            </Box>
            
            {/* טופס העדפות */}
            <PreferencesForm 
              userPreferences={userPreferences}

              onPlanTrip={planTripWithAI}
              onPlanRoadTrip={planRoadTrip}
            />
            
            {/* תחזית מזג אוויר */}
            <Paper sx={{ p: 2, mt: 1, mb: 3, bgcolor: '#f9f9f9', borderRadius: '8px', boxShadow: 1 }}>
              <Typography variant="h6" sx={{ 
                color: '#2c3e50', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                mb: 2
              }}>
                <i className="material-icons" style={{ marginRight: '8px' }}>wb_sunny</i>
                {t('tripPlanner.weatherForecast')}
              </Typography>
                {/* WeatherForecast הוסר */} 
                destination={userPreferences.location} 
              /
          
            </Paper>
            
            {/* רכיב תכנון הטיול */}
            <TripPlanner 
              tripPlan={tripPlan}
              editModalOpen={editModalOpen}
              setEditModalOpen={setEditModalOpen}
              editedAttraction={editedAttraction}
              setEditedAttraction={setEditedAttraction}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              selectedActivityIndex={selectedActivityIndex}
              setSelectedActivityIndex={setSelectedActivityIndex}
            />
            
            {/* כפתורי ניווט למסלול */}
            <RouteNavigationButtons 
              startPoint={startPoint}
              endPoint={endPoint}
              waypoints={waypoints}
            />
            
            {/* רכיב תכנון לינה */}
            <AccommodationPlanner 
              accommodations={accommodations}
              setAccommodations={setAccommodations}
              hotelModalOpen={hotelModalOpen}
              setHotelModalOpen={setHotelModalOpen}
            />
            
            {/* אפשרויות שיתוף ושמירה */}
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
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={saveTripLog}
                    startIcon={<i className="material-icons">save</i>}
                  >
                    {t('tripPlanner.saveRoute')}
                  </Button>
                </Grid>
              </Grid>
            </Box>

            <ShareTripDialog
              open={shareOpen}
              onClose={() => setShareOpen(false)}
              trip={{
                destination: endPoint,
                days: userPreferences?.days,
                budget: userPreferences?.budget,
                startDate: userPreferences?.startDate,
              }}
            />
            
            {/* יומני טיולים קודמים */}
            <Box mt={3} mb={3}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t('tripPlanner.tripLogs')}
              </Typography>
              {tripLogs.map(log => (
                <Paper key={log.id} sx={{ p: 2, m: '5px 0', bgcolor: '#f9f9f9', borderRadius: '8px', boxShadow: 1 }}>
                  <Typography>{t('tripPlanner.date')}: {new Date(log.date).toLocaleDateString()}</Typography>
                  <Typography>{t('tripPlanner.start')}: {log.startPoint}</Typography>
                  <Typography>{t('tripPlanner.end')}: {log.endPoint}</Typography>
                  <Typography>{t('tripPlanner.waypoints')}: {log.waypoints.join(', ')}</Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <Button variant="outlined" color="secondary" onClick={() => editTripLog(log.id, { startPoint: prompt(t('tripPlanner.updateStart'), log.startPoint) || log.startPoint, endPoint: prompt(t('tripPlanner.updateEnd'), log.endPoint) || log.endPoint, waypoints: prompt(t('tripPlanner.updateWaypoints'), log.waypoints.join(', '))?.split(', ') || log.waypoints })}>
                      {t('tripPlanner.edit')}
                    </Button>
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
                origin={startPoint || "Tel Aviv"}
                destination={endPoint || userPreferences.location}
              />
            )}
            
            {servicesTab === 1 && (
              <HotelSearch 
                destination={endPoint || userPreferences.location}
              />
              )}
            
            {servicesTab === 2 && (
              <CarRentalSearch 
                location={endPoint || userPreferences.location}
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
            
            {/* כאן ייכנס רכיב מידע על היעד */}
            <Box sx={{ textAlign: 'center', p: 5, color: '#666' }}>
              <i className="material-icons" style={{ fontSize: '64px', color: '#ccc' }}>info</i>
              <Typography variant="body1">
                {t('tripPlanner.destinationInfoPlaceholder')}
              </Typography>
            </Box>
          </>
        )}
      </Paper>
      
      {/* מפה - iframe */}
      {(() => {
        const parts = [startPoint, ...waypoints, endPoint].filter(Boolean);
        let src;
        if (parts.length >= 2) {
          const saddr = encodeURIComponent(parts[0]);
          const daddrParts = [encodeURIComponent(parts[1])];
          for (let i = 2; i < parts.length; i++) {
            daddrParts.push(`to:${encodeURIComponent(parts[i])}`);
          }
          const daddr = daddrParts.join('+');
          src = `https://maps.google.com/maps?saddr=${saddr}&daddr=${daddr}&dirflg=d&output=embed&hl=he`;
        } else if (parts.length === 1) {
          src = `https://maps.google.com/maps?q=${encodeURIComponent(parts[0])}&output=embed&hl=he`;
        } else {
          const defaultLocation = userPreferences.location || 'ישראל';
          src = `https://maps.google.com/maps?q=${encodeURIComponent(defaultLocation)}&output=embed&hl=he`;
        }
        return (
          <Paper elevation={3} sx={{ p: 0, mb: 4, borderRadius: '16px', overflow: 'hidden' }}>
            {parts.length >= 2 && (
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary">
                  🗺️ {t('tripPlanner.route')}: {parts.join(' → ')}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => window.open(`https://www.google.com/maps/dir/${parts.map(p => encodeURIComponent(p)).join('/')}`, '_blank')}
                  sx={{ fontSize: '0.7rem', py: 0.3, px: 1 }}
                >
                  {t('tripPlanner.openNavigation')} ←
                </Button>
              </Box>
            )}
            <Box sx={{ height: { xs: '350px', md: '500px' }, width: '100%' }}>
              <iframe
                key={src}
                src={src}
                width="100%"
                height="100%"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="מפת מסלול"
              />
            </Box>
          </Paper>
        );
      })()}
    </Box>
  );
};

export default TripPlannerPage;