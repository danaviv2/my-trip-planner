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
import TravelInfoComponent from '../components/travel-info/TravelInfoComponent';
import PreferencesForm from '../components/trip-planner/PreferencesForm';
import TripPlanner from '../components/trip-planner/TripPlanner';
import RouteNavigationButtons from '../components/trip-planner/RouteNavigationButtons';
import AccommodationPlanner from '../components/trip-planner/AccommodationPlanner';
import ShareButtons from '../components/shared/ShareButtons';
import InviteButton from '../components/shared/InviteButton';
import LoadScript from '../components/maps/LoadScript';
import TravelServicesTab from '../components/travel-services/TravelServicesTab';
import FlightIcon from '@mui/icons-material/Flight';
import HotelIcon from '@mui/icons-material/Hotel';
import DriveEtaIcon from '@mui/icons-material/DriveEta';
import FlightSearch from '../components/travel-services/FlightSearch';
import HotelSearch from '../components/travel-services/HotelSearch';
import CarRentalSearch from '../components/travel-services/CarRentalSearch';
import { fetchWeatherForecast, fetchGeoInfo } from '../components/WeatherForecast';
/**
 * דף תכנון מסלול - מרכז את כל פונקציונליות תכנון הטיול
 */
const TripPlannerPage = () => {
  // שימוש בהעדפות משתמש מהקונטקסט
  const { userPreferences, setUserPreferences } = useUserPreferences();
  
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
    location: 'בורדו, צרפת',
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
  
  // API Keys
  const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY || '';
  const GOOGLE_MAPS_LIBRARIES = ['places'];

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
      alert('אנא מלא את נקודת ההתחלה ואת היעד.');
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
        distance: '150 ק"מ',
        duration: '2 שעות ו-30 דקות'
      });
      
      // אחרי פעולת החיפוש, נעדכן את ההעדפות
      if (endPoint) {
        setUserPreferences(prev => ({ ...prev, location: endPoint }));
      }
      
    } catch (error) {
      console.error('שגיאה בחיפוש המסלול:', error);
      alert('שגיאה בחיפוש מסלול: ' + (error.message || 'שגיאה לא ידועה'));
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
        date: `יום ${getDayName(i)}`,
        location: userPreferences.location,
        summary: i === 0 ? `הגעה והתמקמות ב${userPreferences.location}` : `יום ${i + 1} ב${userPreferences.location}`,
        schedule: [
          {
            timeStart: "09:00",
            timeEnd: "11:00",
            type: "attraction",
            activity: "ביקור באתר",
            name: `אטרקציה ${i + 1}`,
            address: `${userPreferences.location}, מרכז העיר`,
            description: "ביקור באתר מרכזי בעיר"
          },
          {
            timeStart: "12:00",
            timeEnd: "13:30",
            type: "lunch",
            activity: "ארוחת צהריים",
            name: `מסעדה מקומית`,
            address: `${userPreferences.location}, רחוב המסעדות`,
            description: "מסעדה אותנטית עם אוכל מקומי"
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
      alert('התרחשה שגיאה בתכנון הטיול.');
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
      alert('תכנון טיול מתגלגל הושלם!');
      
    } catch (error) {
      console.error('שגיאה בתכנון טיול מתגלגל:', error);
      alert('התרחשה שגיאה בתכנון הטיול המתגלגל.');
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
      alert('שגיאה בעדכון הסינון: ' + (error.message || 'שגיאה לא ידועה'));
    }
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
    alert('הטיול נשמר בהצלחה!');
  };
  
  // פונקציות עזר
  const getDayName = (dayIndex) => {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
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
            ? `תכנון טיול ל${userPreferences.location}`
            : 'תכנון טיול מותאם אישית'}
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
              label="תכנון מסלול" 
              icon={<i className="material-icons">map</i>} 
              iconPosition="start"
            />
            <Tab 
              value="services" 
              label="שירותי נסיעות" 
              icon={<i className="material-icons">flight</i>} 
              iconPosition="start"
            />
            <Tab 
              value="destination" 
              label="מידע על היעד" 
              icon={<i className="material-icons">location_city</i>} 
              iconPosition="start"
            />
          </Tabs>
        </Box>
        
        {/* לשונית תכנון מסלול */}
        {mainTab === 'plan' && (
          <>
            {/* מידע על נסיעה */}
            <TravelInfoComponent />
            
            {/* טופס חיפוש */}
            <Paper elevation={1} sx={{ p: 3, mb: 3, bgcolor: '#f8f9fa', borderRadius: '12px' }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <i className="material-icons" style={{ marginRight: '8px' }}>directions</i>
                הגדרת מסלול
              </Typography>
              
              <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="נקודת ההתחלה"
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
                    label={`תחנה ${index + 1}`}
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
                  label="הוסף תחנה ביניים"
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
                  label="היעד"
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
                    חפש מסלול
                  </Button>
                )}
              </Box>
            </Paper>
            
            {/* מידע על המסלול אם קיים */}
            {routeInfo.distance && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f0f0f0', borderRadius: '8px', boxShadow: 1, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
                  פרטי המסלול:
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  מרחק: {routeInfo.distance} | זמן נסיעה: {routeInfo.duration}
                </Typography>
              </Box>
            )}
            
            {/* אפשרויות סינון אטרקציות */}
            <Box mt={3} display="flex" flexWrap="wrap" justifyContent="center" gap={1} mb={3}>
              <Button 
                variant={activeFilters.includes('all') ? 'contained' : 'outlined'} 
                onClick={() => handleButtonFilter('all')}
              >
                הכל
              </Button>
              <Button 
                variant={activeFilters.includes('nature') ? 'contained' : 'outlined'} 
                onClick={() => handleButtonFilter('nature')}
                color="success"
              >
                טבע
              </Button>
              <Button 
                variant={activeFilters.includes('restaurant') ? 'contained' : 'outlined'} 
                onClick={() => handleButtonFilter('restaurant')}
                color="warning"
              >
                מסעדות
              </Button>
              {/* שאר הכפתורים */}
            </Box>
            
            {/* טופס העדפות */}
            <PreferencesForm 
              userPreferences={userPreferences}
              setUserPreferences={setUserPreferences}
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
                תחזית מזג אוויר
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
              <Typography variant="h6" sx={{ mb: 2 }}>שתף ושמור את הטיול</Typography>
              <Grid container spacing={2}>
                <Grid item>
                  <ShareButtons />
                </Grid>
                <Grid item>
                  <InviteButton />
                </Grid>
                <Grid item>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={saveTripLog}
                    startIcon={<i className="material-icons">save</i>}
                  >
                    שמור מסלול
                  </Button>
                </Grid>
              </Grid>
            </Box>
            
            {/* יומני טיולים קודמים */}
            <Box mt={3} mb={3}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                יומני טיולים קודמים
              </Typography>
              {tripLogs.map(log => (
                <Paper key={log.id} sx={{ p: 2, m: '5px 0', bgcolor: '#f9f9f9', borderRadius: '8px', boxShadow: 1 }}>
                  <Typography>תאריך: {new Date(log.date).toLocaleDateString()}</Typography>
                  <Typography>התחלה: {log.startPoint}</Typography>
                  <Typography>יעד: {log.endPoint}</Typography>
                  <Typography>תחנות ביניים: {log.waypoints.join(', ')}</Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <Button variant="outlined" color="secondary" onClick={() => editTripLog(log.id, { startPoint: prompt('עדכן נקודת התחלה:', log.startPoint) || log.startPoint, endPoint: prompt('עדכן יעד:', log.endPoint) || log.endPoint, waypoints: prompt('עדכן תחנות ביניים (הפרד עם פסיק):', log.waypoints.join(', '))?.split(', ') || log.waypoints })}>
                      ערוך
                    </Button>
                    <Button variant="outlined" color="error" onClick={() => deleteTripLog(log.id)}>
                      מחק
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
              שירותי נסיעות
            </Typography>
            
            <Tabs 
              value={servicesTab} 
              onChange={(e, newValue) => setServicesTab(newValue)}
              variant="fullWidth"
              sx={{ mb: 3 }}
            >
              <Tab label="טיסות" icon={<FlightIcon />} />
              <Tab label="מלונות" icon={<HotelIcon />} />
              <Tab label="השכרת רכב" icon={<DriveEtaIcon />} />
            </Tabs>
            
            {servicesTab === 0 && (
              <FlightSearch 
                origin={startPoint || "תל אביב"} 
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
              מידע על {userPreferences.location}
            </Typography>
            
            {/* כאן ייכנס רכיב מידע על היעד */}
            <Box sx={{ textAlign: 'center', p: 5, color: '#666' }}>
              <i className="material-icons" style={{ fontSize: '64px', color: '#ccc' }}>info</i>
              <Typography variant="body1">
                מידע מפורט על היעד יתווסף בהמשך.
              </Typography>
            </Box>
          </>
        )}
      </Paper>
      
      {/* מפה */}
      <Paper elevation={3} sx={{ p: 0, mb: 4, borderRadius: '16px', overflow: 'hidden' }}>
        <Box sx={{ height: '500px', width: '100%' }}>
          <LoadScript
            googleMapsApiKey={GOOGLE_API_KEY}
            libraries={GOOGLE_MAPS_LIBRARIES}
          >
            {/* כאן תהיה המפה שלך */}
            <Box sx={{ height: '100%', width: '100%', bgcolor: '#e0e0e0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ color: '#666' }}>
                מפה אינטראקטיבית תופיע כאן
              </Typography>
            </Box>
          </LoadScript>
        </Box>
      </Paper>
    </Box>
  );
};

export default TripPlannerPage;