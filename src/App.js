import React, { useState, useRef, useEffect } from 'react';
import {
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  CircularProgress,
  IconButton,
  Modal,
  TextareaAutosize,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
} from '@mui/material';
import { GoogleMap, LoadScript, InfoWindow, DirectionsRenderer, Marker } from '@react-google-maps/api';
import AddIcon from '@mui/icons-material/Add';
import { FacebookShareButton, TwitterShareButton, EmailShareButton } from 'react-share';
import { v4 as uuidv4 } from 'uuid';
import ErrorBoundary from './ErrorBoundary'; // ודא שקובץ זה קיים בנתיב src/ErrorBoundary.js
import './style.css';
import TripPlanner from './components/trip-planner/TripPlanner';
import WeatherWidget from "./components/maps/WeatherWidget";
import PriceComparison from "./components/maps/PriceComparison";
import StatisticsPanel from './components/statistics/StatisticsPanel';
import HotelSearch from './components/travel-services/HotelSearch';
import FlightSearch from './components/travel-services/FlightSearch';
import CarRentalSearch from './components/travel-services/CarRentalSearch';
import TravelServicesTab from './components/travel-services/TravelServicesTab';
import DestinationInfo from './components/DestinationInfo';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppRoutes from './routes';
import { TripProvider } from './contexts/TripContext';
import './assets/css/theme.css'; // קובץ העיצוב החדש
import { useNavigate } from 'react-router-dom';

// יבוא הקומפוננטות הקיימות שלך
import Header from './components/layout/Header';
import HomePage from './pages/HomePage';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';
import { TripSaveProvider } from './contexts/TripSaveContext';

// יבוא הדפים החדשים
import SmartTripPage from './pages/SmartTripPage';
import AdvancedSearchPage from './pages/AdvancedSearchPage';
import MapPage from './pages/MapPage';

// ייבוא הסמלים הנדרשים
import FlightIcon from '@mui/icons-material/Flight';
import HotelIcon from '@mui/icons-material/Hotel';
import DriveEtaIcon from '@mui/icons-material/DriveEta';
import { Tabs, Tab } from '@mui/material';
// import BudgetManager from './components/Budget/BudgetManager'; // הערה: הוסר כפי שביקשת

// הגדרת ספריות Google Maps כקבוע סטטי מחוץ לרכיב
const GOOGLE_MAPS_LIBRARIES = ['places'];

// הגדרת צבעים ואייקונים לכל קטגוריה - עם אייקוני Material Icons
const CATEGORY_ICONS = {
  nature: { 
    color: '#4CAF50', 
    icon: 'park',
    label: 'טבע'
  },
  winery: { 
    color: '#D81B60', 
    icon: 'wine_bar',
    label: 'יקבים'
  },
  culinary: { 
    color: '#FF9800', 
    icon: 'restaurant',
    label: 'קולינריה'
  },
  touristAttraction: { 
    color: '#2196F3', 
    icon: 'photo_camera',
    label: 'אטרקציות'
  },
  museum: { 
    color: '#9C27B0', 
    icon: 'museum',
    label: 'מוזיאונים'
  },
  restaurant: { 
    color: '#FF5722', 
    icon: 'restaurant_menu',
    label: 'מסעדות'
  },
  hotel: { 
    color: '#3F51B5', 
    icon: 'hotel',
    label: 'מלונות'
  },
  cafe: { 
    color: '#795548', 
    icon: 'coffee',
    label: 'בתי קפה'
  },
  hospital: { 
    color: '#F44336', 
    icon: 'local_hospital',
    label: 'בתי חולים'
  },
  pharmacy: { 
    color: '#2196F3', 
    icon: 'local_pharmacy',
    label: 'בתי מרקחת'
  },
  amusementPark: { 
    color: '#FFEB3B', 
    icon: 'attractions',
    label: 'פארקי שעשועים'
  },
  beach: { 
    color: '#00BCD4', 
    icon: 'beach_access',
    label: 'חופים'
  },
  historicalSite: { 
    color: '#8BC34A', 
    icon: 'account_balance',
    label: 'אתרים היסטוריים'
  },
  nationalPark: { 
    color: '#4CAF50', 
    icon: 'terrain',
    label: 'פארקים לאומיים'
  },
  localMarket: { 
    color: '#F57F17', 
    icon: 'shopping_cart',
    label: 'שווקים מקומיים'
  },
  festival: { 
    color: '#E91E63', 
    icon: 'celebration',
    label: 'פסטיבלים'
  },
  spa: { 
    color: '#9C27B0', 
    icon: 'spa',
    label: 'מרכזי ספא'
  },
};
// קומפוננט חדש לניהול פרטי נסיעה - טיסות והשכרת רכב
const TravelInfoComponent = () => {
  // מצבים לניהול פרטי הטיסות
  const [flights, setFlights] = useState([
    { id: 1, type: 'departure', flightNumber: '', airline: '', date: '', departureTime: '', departureAirport: '', arrivalTime: '', arrivalAirport: '', terminal: '' }
  ]);
  
  // מצבים לניהול פרטי הרכב
  const [carRental, setCarRental] = useState({
    company: '',
    pickupDate: '',
    pickupTime: '',
    pickupLocation: '',
    returnDate: '',
    returnTime: '',
    returnLocation: '',
    carType: '',
    confirmationNumber: ''
  });
  
  // מצב פתיחת חלונית מידע
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [emailImportModalOpen, setEmailImportModalOpen] = useState(false);
  
  // מצבים לניהול תצוגה
  const [showFlights, setShowFlights] = useState(true);
  const [showCarRental, setShowCarRental] = useState(true);
  
  // פונקציה להוספת טיסה נוספת
  const addFlight = () => {
    const newId = Math.max(...flights.map(f => f.id), 0) + 1;
    setFlights([...flights, { 
      id: newId, 
      type: 'return', 
      flightNumber: '', 
      airline: '', 
      date: '', 
      departureTime: '', 
      departureAirport: '', 
      arrivalTime: '', 
      arrivalAirport: '', 
      terminal: '' 
    }]);
  };
  
  // פונקציה לעדכון פרטי טיסה
  const updateFlight = (id, field, value) => {
    setFlights(flights.map(flight => 
      flight.id === id ? { ...flight, [field]: value } : flight
    ));
  };
  
  // פונקציה למחיקת טיסה
  const removeFlight = (id) => {
    setFlights(flights.filter(flight => flight.id !== id));
  };
  
  // פונקציה להצגת מידע על שדה תעופה
  const showAirportInfo = (airportCode) => {
    // פה נוכל לקרוא ל-API שמספק מידע על שדות תעופה
    setInfoModalOpen(true);
  };
  
  // חלונית ייבוא פרטים ממייל
  const EmailImportModal = () => (
    <Modal
      open={emailImportModalOpen}
      onClose={() => setEmailImportModalOpen(false)}
      aria-labelledby="email-import-modal-title"
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '600px',
        bgcolor: 'background.paper',
        borderRadius: '12px',
        boxShadow: 24,
        p: 4,
        textAlign: 'right',
        direction: 'rtl'
      }}>
        <Typography id="email-import-modal-title" variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          ייבוא פרטים מהמייל
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 3 }}>
          אשף זה יעזור לך לייבא פרטי טיסה והשכרת רכב מהמייל שלך. ניתן להעתיק ולהדביק את המידע מהמייל או לאפשר חיבור ישיר לתיבת הדואר שלך.
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>העתק והדבק את המייל:</Typography>
          <TextField
            fullWidth
            multiline
            rows={8}
            placeholder="הדבק כאן את תוכן המייל עם פרטי ההזמנה..."
          />
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            variant="outlined"
            startIcon={<i className="material-icons">mail</i>}
            sx={{ ml: 2 }}
          >
            התחבר לג'ימייל
          </Button>
          
          <Box>
            <Button 
              variant="outlined" 
              onClick={() => setEmailImportModalOpen(false)}
              sx={{ ml: 2 }}
            >
              ביטול
            </Button>
            <Button 
              variant="contained"
              onClick={() => {
                // כאן צריך לממש את הלוגיקה של חילוץ פרטים מהמייל
                setEmailImportModalOpen(false);
                // לדוגמה, נדמיין שהצלחנו לחלץ פרטי טיסה
                setFlights([
                  { 
                    id: 1, 
                    type: 'departure', 
                    flightNumber: 'LY315', 
                    airline: 'אל על', 
                    date: '2023-10-15', 
                    departureTime: '12:30', 
                    departureAirport: 'TLV', 
                    arrivalTime: '16:45', 
                    arrivalAirport: 'CDG', 
                    terminal: 'T3' 
                  },
                  { 
                    id: 2, 
                    type: 'return', 
                    flightNumber: 'LY318', 
                    airline: 'אל על', 
                    date: '2023-10-22', 
                    departureTime: '09:15', 
                    departureAirport: 'CDG', 
                    arrivalTime: '14:30', 
                    arrivalAirport: 'TLV', 
                    terminal: 'T2E' 
                  }
                ]);
                // ודמיון פרטי השכרת רכב
                setCarRental({
                  company: 'Hertz',
                  pickupDate: '2023-10-15',
                  pickupTime: '17:30',
                  pickupLocation: 'נמל התעופה שארל דה גול, פריז',
                  returnDate: '2023-10-22',
                  returnTime: '06:30',
                  returnLocation: 'נמל התעופה שארל דה גול, פריז',
                  carType: 'Peugeot 208 או דומה',
                  confirmationNumber: 'HR123456789'
                });
              }}
            >
              חלץ פרטים
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
  
  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: '10px', mb: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
        <i className="material-icons" style={{ marginRight: '8px', color: '#2196F3' }}>flight</i>
        פרטי נסיעה
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<i className="material-icons">email</i>}
          onClick={() => setEmailImportModalOpen(true)}
        >
          ייבא פרטים ממייל
        </Button>
        
        <Button 
          variant="outlined"
          startIcon={<i className="material-icons">print</i>}
          onClick={() => window.print()}
        >
          הדפס פרטי נסיעה
        </Button>
      </Box>
      
      {/* אזור טיסות */}
      <Box sx={{ mb: 4 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: '1px solid #e0e0e0',
            pb: 1,
            mb: 2
          }}
          onClick={() => setShowFlights(!showFlights)}
          style={{ cursor: 'pointer' }}
        >
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <i className="material-icons" style={{ marginRight: '8px', color: '#2196F3' }}>flight</i>
            טיסות
          </Typography>
          <IconButton size="small">
            <i className="material-icons">{showFlights ? 'expand_less' : 'expand_more'}</i>
          </IconButton>
        </Box>
        
        {showFlights && (
          <>
            {flights.map((flight, index) => (
              <Paper key={flight.id} sx={{ p: 2, mb: 2, borderRadius: '8px', bgcolor: '#f5f5f5' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {flight.type === 'departure' ? 'טיסה ליעד' : 'טיסה חזרה'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => removeFlight(flight.id)}
                    >
                      <i className="material-icons">delete</i>
                    </IconButton>
                  </Box>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="חברת תעופה"
                      value={flight.airline}
                      onChange={(e) => updateFlight(flight.id, 'airline', e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="מספר טיסה"
                      value={flight.flightNumber}
                      onChange={(e) => updateFlight(flight.id, 'flightNumber', e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="תאריך"
                      type="date"
                      value={flight.date}
                      onChange={(e) => updateFlight(flight.id, 'date', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="טרמינל"
                      value={flight.terminal}
                      onChange={(e) => updateFlight(flight.id, 'terminal', e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="שדה תעופה יציאה"
                      value={flight.departureAirport}
                      onChange={(e) => updateFlight(flight.id, 'departureAirport', e.target.value)}
                      size="small"
                      InputProps={{
                        endAdornment: (
                          <IconButton 
                            size="small"
                            onClick={() => showAirportInfo(flight.departureAirport)}
                          >
                            <i className="material-icons" style={{ fontSize: '18px' }}>info</i>
                          </IconButton>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="שעת יציאה"
                      type="time"
                      value={flight.departureTime}
                      onChange={(e) => updateFlight(flight.id, 'departureTime', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="שדה תעופה הגעה"
                      value={flight.arrivalAirport}
                      onChange={(e) => updateFlight(flight.id, 'arrivalAirport', e.target.value)}
                      size="small"
                      InputProps={{
                        endAdornment: (
                          <IconButton 
                            size="small"
                            onClick={() => showAirportInfo(flight.arrivalAirport)}
                          >
                            <i className="material-icons" style={{ fontSize: '18px' }}>info</i>
                          </IconButton>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="שעת הגעה"
                      type="time"
                      value={flight.arrivalTime}
                      onChange={(e) => updateFlight(flight.id, 'arrivalTime', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                </Grid>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<i className="material-icons">search</i>}
                    onClick={() => window.open(`https://www.flightstats.com/v2/flight-tracker/${flight.airline}/${flight.flightNumber}?year=${new Date(flight.date).getFullYear()}&month=${new Date(flight.date).getMonth() + 1}&date=${new Date(flight.date).getDate()}`)}
                  >
                    בדוק סטטוס טיסה
                  </Button>
                </Box>
              </Paper>
            ))}
            
            <Button
              variant="outlined"
              startIcon={<i className="material-icons">add</i>}
              onClick={addFlight}
              sx={{ mb: 2 }}
            >
              הוסף טיסה
            </Button>
          </>
        )}
      </Box>
      
      {/* אזור השכרת רכב */}
      <Box>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: '1px solid #e0e0e0',
            pb: 1,
            mb: 2
          }}
          onClick={() => setShowCarRental(!showCarRental)}
          style={{ cursor: 'pointer' }}
        >
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <i className="material-icons" style={{ marginRight: '8px', color: '#4CAF50' }}>directions_car</i>
            השכרת רכב
          </Typography>
          <IconButton size="small">
            <i className="material-icons">{showCarRental ? 'expand_less' : 'expand_more'}</i>
          </IconButton>
        </Box>
        
        {showCarRental && (
          <Paper sx={{ p: 2, borderRadius: '8px', bgcolor: '#f5f5f5' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="חברת השכרה"
                  value={carRental.company}
                  onChange={(e) => setCarRental({ ...carRental, company: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="מספר הזמנה/אישור"
                  value={carRental.confirmationNumber}
                  onChange={(e) => setCarRental({ ...carRental, confirmationNumber: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="תאריך קבלת הרכב"
                  type="date"
                  value={carRental.pickupDate}
                  onChange={(e) => setCarRental({ ...carRental, pickupDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="שעת קבלת הרכב"
                  type="time"
                  value={carRental.pickupTime}
                  onChange={(e) => setCarRental({ ...carRental, pickupTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="מיקום קבלת הרכב"
                  value={carRental.pickupLocation}
                  onChange={(e) => setCarRental({ ...carRental, pickupLocation: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="תאריך החזרת הרכב"
                  type="date"
                  value={carRental.returnDate}
                  onChange={(e) => setCarRental({ ...carRental, returnDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="שעת החזרת הרכב"
                  type="time"
                  value={carRental.returnTime}
                  onChange={(e) => setCarRental({ ...carRental, returnTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="מיקום החזרת הרכב"
                  value={carRental.returnLocation}
                  onChange={(e) => setCarRental({ ...carRental, returnLocation: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="סוג רכב"
                  value={carRental.carType}
                  onChange={(e) => setCarRental({ ...carRental, carType: e.target.value })}
                  size="small"
                />
              </Grid>
            </Grid>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<i className="material-icons">search</i>}
                onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(`${carRental.company} car rental`)}`)}
              >
                בדוק מידע על חברת ההשכרה
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<i className="material-icons">map</i>}
                onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(`${carRental.company} car rental ${carRental.pickupLocation}`)}`)}
              >
                הצג במפה
              </Button>
            </Box>
          </Paper>
        )}
      </Box>
      
      <EmailImportModal />
    </Paper>
  );
};
// הגדרת סגנונות טיול לשימוש בטופס העדפות
const travelStyles = [
  { value: 'cultural', label: 'תרבותי - מוזיאונים, היסטוריה, אמנות' },
  { value: 'adventure', label: 'הרפתקני - טיולים, ספורט אתגרי' },
  { value: 'relaxation', label: 'מנוחה - ספא, חופים, הרפיה' },
  { value: 'culinary', label: 'קולינרי - אוכל, יין, שווקים' },
  { value: 'nature', label: 'טבע - פארקים, נופים, חיות בר' },
  { value: 'urban', label: 'עירוני - קניות, אטרקציות עירוניות' },
  { value: 'mixed', label: 'מעורב - שילוב של מספר סגנונות' }
];

// הגדרת רמות קצב לשימוש בטופס העדפות
const paceLevels = [
  { value: 'slow', label: 'איטי - מעט פעילויות, הרבה זמן פנוי' },
  { value: 'medium', label: 'בינוני - איזון בין פעילויות ומנוחה' },
  { value: 'fast', label: 'מהיר - ימים עמוסים, הרבה פעילויות' }
];

const mapContainerStyle = {
  height: '500px',
  width: '70%',
  margin: '20px auto',
  borderRadius: '15px',
  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
};
function App() {
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState('plan');
  const [activeTab, setActiveTab] = useState(0);
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
  const [isMapsLoaded, setIsMapsLoaded] = useState(false); // מצב לטעינת Google Maps
  const [tripLogs, setTripLogs] = useState(JSON.parse(localStorage.getItem('tripLogs')) || []); // יומן טיולים
  const [tripPlan, setTripPlan] = useState({
    location: 'בורדו, צרפת',
    duration: 7, // ימים
    theme: ['nature', 'winery', 'culinary'],
    dailyItinerary: [],
  });
  const [userPreferences, setUserPreferences] = useState({
    location: 'בורדו, צרפת',
    themes: ['nature', 'winery', 'culinary', 'touristAttraction', 'museum', 'restaurant', 'hotel', 'cafe', 'hospital', 'pharmacy', 'amusementPark', 'beach', 'historicalSite', 'nationalPark', 'localMarket', 'festival', 'spa'],
    budget: 'medium',
    days: 7,
    startDate: new Date().toISOString().split('T')[0],
    advancedPreferences: {
      foodPreferences: '',
      travelPace: 'medium',
      travelStyle: 'mixed',
      hasChildren: false,
      specialNeeds: ''
    }
  });
  const [routeInfo, setRouteInfo] = useState({ distance: '', duration: '' }); // מצב חדש לזמן ומרחק
  const [editModalOpen, setEditModalOpen] = useState(false); // מצב לחלון עריכה
  const [selectedDay, setSelectedDay] = useState(null); // יום נבחר לעריכה
  const [selectedActivityIndex, setSelectedActivityIndex] = useState(null); // אינדקס הפעילות הנבחרת לעריכה
  const [editedAttraction, setEditedAttraction] = useState({ time: '', name: '', category: '', address: '', description: '', openingHours: '' }); // פעילות לעריכה
  const [markers, setMarkers] = useState([]); // מצב למעקב אחר סמני המפה
  const mapRef = useRef();
  
  // הוספת מצב חדש ללינה והמודאל
  const [accommodations, setAccommodations] = useState([]);
  const [hotelModalOpen, setHotelModalOpen] = useState(false);

  // החלף במפתחות API אמיתיים שלך או ודא שהם מוגדרים במשתני הסביבה שלך
  const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY || 'המפתח_האמיתי_שלך_ל_GOOGLE_API'; 
  const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY || "";
  const RAPIDAPI_KEY = process.env.REACT_APP_RAPIDAPI_KEY || "המפתח_האמיתי_שלך_RAPIDAPI"; // הוסף את זה

  // פונקציית עזר להמרת אינדקס למחרוזת יום בשבוע
  const getDayName = (dayIndex) => {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return days[dayIndex % 7];
  };

  // פונקציה ליצירת אייקון SVG מותאם אישית
  const createCustomMarkerIcon = (iconName, backgroundColor) => {
    try {
      // יצירת צבע רקע עם שקיפות קלה
      const bgColor = backgroundColor + "B3"; // 70% אטימות
      
      // יצירת SVG עם האייקון המבוקש
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40">
          <circle cx="12" cy="12" r="12" fill="${bgColor}"/>
          <text x="12" y="16" font-family="Material Icons" font-size="16" fill="white" text-anchor="middle">${iconName}</text>
        </svg>
      `;
      
      // המרת SVG לdata URL
      const svgBase64 = btoa(unescape(encodeURIComponent(svg)));
      return `data:image/svg+xml;base64,${svgBase64}`;
    } catch (error) {
      console.error('שגיאה ביצירת אייקון:', error);
      // החזר אייקון ברירת מחדל במקרה של שגיאה
      return 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
    }
  };
// טיפול מתון בשגיאות חיבור WebSocket
useEffect(() => {
  // מוסיף מאזין אירועים גלובלי לטיפול בשגיאות WebSocket
  window.addEventListener('error', (e) => {
    if (e.target instanceof WebSocket) {
      console.log('שגיאת חיבור WebSocket טופלה');
      e.preventDefault();
    }
  });

  return () => {
    window.removeEventListener('error', () => {});
  };
}, []);

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

const searchRoute = async () => {
  console.log('מתחיל חיפוש מסלול');
  if (!startPoint || !endPoint) {
    alert('אנא מלא את נקודת ההתחלה ואת היעד.');
    return;
  }

  if (!isMapsLoaded || !mapRef.current) {
    alert('Google Maps לא נטען נכון. אנא נסה שוב.');
    setAttractions([]);
    setDirections(null);
    setIsLoading(false);
    return;
  }

  setIsLoading(true);
  try {
    const geocoder = new window.google.maps.Geocoder();
    const startResult = await new Promise((resolve, reject) => {
      geocoder.geocode({ address: startPoint }, (results, status) => {
        if (status === window.google.maps.GeocoderStatus.OK && results && results.length > 0) {
          resolve(results[0].geometry.location);
        } else {
          reject(new Error('לא נמצאו תוצאות עבור נקודת ההתחלה: ' + status));
        }
      });
    });
    console.log('נקודת התחלה מקודדת:', startResult);

    const endResult = await new Promise((resolve, reject) => {
      geocoder.geocode({ address: endPoint }, (results, status) => {
        if (status === window.google.maps.GeocoderStatus.OK && results && results.length > 0) {
          resolve(results[0].geometry.location);
        } else {
          reject(new Error('לא נמצאו תוצאות עבור היעד: ' + status));
        }
      });
    });
    console.log('נקודת יעד מקודדת:', endResult);

    const waypointResults = await Promise.all(
      waypoints.map(wp => 
        new Promise((resolve, reject) => {
          geocoder.geocode({ address: wp }, (results, status) => {
            if (status === window.google.maps.GeocoderStatus.OK && results && results.length > 0) {
              resolve(results[0].geometry.location);
            } else {
              reject(new Error(`לא נמצאו תוצאות עבור תחנה ביניים "${wp}": ${status}`));
            }
          });
        })
      )
    ).catch(error => {
      console.error('שגיאת קידוד תחנות ביניים:', error);
      return [];
    });
    console.log('תחנות ביניים מקודדות:', waypointResults);

    const centerLat = (startResult.lat() + endResult.lat()) / 2;
    const centerLng = (startResult.lng() + endResult.lng()) / 2;
    setMapCenter({ lat: centerLat, lng: centerLng });

    const waypointsForDirections = waypointResults.filter(result => result !== undefined).map(result => ({
      location: result,
      stopover: true,
    }));

    const directionsService = new window.google.maps.DirectionsService();
    const result = await directionsService.route({
      origin: startResult,
      destination: endResult,
      waypoints: waypointsForDirections,
      travelMode: window.google.maps.TravelMode.DRIVING,
    });
    console.log('תוצאות הכיוונים:', result);
    setDirections(result);

    const route = result.routes[0];
    const distance = route.legs.reduce((total, leg) => total + leg.distance.value, 0);
    const duration = route.legs.reduce((total, leg) => total + leg.duration.value, 0);
    
    // פורמט מרחק וזמן באופן יפה
    const formattedDistance = distance < 1000 
      ? `${distance} מ'` 
      : `${(distance / 1000).toFixed(1)} ק"מ`;
    
    const formattedDuration = duration < 60 
      ? `${duration} שניות` 
      : duration < 3600 
        ? `${Math.floor(duration / 60)} דקות` 
        : `${Math.floor(duration / 3600)} שעות ${Math.floor((duration % 3600) / 60)} דקות`;
    
    setRouteInfo({ 
      distance: formattedDistance, 
      duration: formattedDuration 
    });

    const placesService = new window.google.maps.places.PlacesService(mapRef.current);
    console.log('PlacesService אותחל');

    const locations = [startPoint, endPoint, ...waypoints];
    const allAttractions = [];
    const themes = ['nature', 'winery', 'culinary', 'touristAttraction', 'museum', 'restaurant', 'hotel', 'cafe', 'hospital', 'pharmacy', 'amusementPark', 'beach', 'historicalSite', 'nationalPark', 'localMarket', 'festival', 'spa'];

    for (const location of locations) {
      for (const theme of themes) {
        let types;
        switch (theme) {
          case 'nature': types = ['park', 'natural_feature', 'tourist_attraction']; break;
          case 'winery': types = ['bar', 'liquor_store']; break; // 'winery' אינו סוג סטנדרטי
          case 'culinary': types = ['restaurant', 'cafe', 'bakery']; break;
          case 'touristAttraction': types = ['tourist_attraction']; break;
          case 'museum': types = ['museum']; break;
          case 'restaurant': types = ['restaurant']; break;
          case 'hotel': types = ['lodging', 'hotel']; break;
          case 'cafe': types = ['cafe']; break;
          case 'hospital': types = ['hospital']; break;
          case 'pharmacy': types = ['pharmacy']; break;
          case 'amusementPark': types = ['amusement_park']; break;
          case 'beach': types = ['beach', 'natural_feature']; break;
          case 'historicalSite': types = ['museum', 'church', 'hindu_temple', 'mosque', 'synagogue']; break;
          case 'nationalPark': types = ['park']; break;
          case 'localMarket': types = ['grocery_or_supermarket', 'shopping_mall']; break;
          case 'festival': types = ['point_of_interest']; break;
          case 'spa': types = ['spa', 'health']; break;
          default: types = ['tourist_attraction'];
        }

        const geocodeResult = await new Promise((resolve, reject) => {
          geocoder.geocode({ address: location }, (results, status) => {
            if (status === window.google.maps.GeocoderStatus.OK && results && results.length > 0) {
              resolve(results[0].geometry.location);
            } else {
              reject(new Error(`לא נמצאו תוצאות עבור ${location}: ${status}`));
            }
          });
        });

        const request = {
          location: geocodeResult,
          radius: '50000',
          type: types[0], // השתמש בסוג הראשון עבור הבקשה
        };

        const placesResult = await new Promise((resolve) => {
          placesService.nearbySearch(request, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
              console.log(`נמצאו ${results.length} אטרקציות עבור ${theme} ב-${location}`);
              resolve(results);
            } else {
              console.warn(`אין תוצאות עבור ${theme} ב-${location}, סטטוס: ${status}`);
              resolve([]);
            }
          });
        });

        allAttractions.push(...placesResult.map(place => ({
          name: place.name,
          location: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          },
          category: theme,
          rating: place.rating || 0,
          photo: place.photos?.[0]?.getUrl({ maxWidth: 300, maxHeight: 300 }) || 'https://via.placeholder.com/300x300?text=תמונה+לא+זמינה',
          website: place.website || '',
          address: place.vicinity || place.formatted_address || 'כתובת לא זמינה',
        })));
      }
    }

    console.log('סך כל האטרקציות שנאספו:', allAttractions.length, allAttractions);
    const filteredAttractions = allAttractions.filter(attraction => 
      activeFilters.includes('all') || activeFilters.includes(attraction.category)
    );
    console.log('אטרקציות מסוננות:', filteredAttractions.length, filteredAttractions);
    setAttractions(filteredAttractions);

    // עדכון העדפות המשתמש לפי היעד
    if (endPoint) {
      setUserPreferences(prev => ({ ...prev, location: endPoint }));
    }

  } catch (error) {
    console.error('שגיאה בחיפוש מסלול:', error);
    alert('שגיאה בחיפוש מסלול: ' + (error.message || 'שגיאה לא ידועה'));
    setAttractions([]);
  } finally {
    setIsLoading(false);
  }
};
// הפונקציה המעודכנת לתכנון טיול - החלף את זו הקיימת בקוד שלך
const planTripWithAI = async () => {
  setIsLoading(true);
  try {
    console.log('מתחיל תכנון טיול מותאם ליעד:', userPreferences.location);
    
    // בניית רשימת מיקומים המתאימים ליעד הנבחר
    let secondaryLocations = [];
    
    // מיקומים ליד וושינגטון
    if (userPreferences.location.toLowerCase().includes('washington') || 
        userPreferences.location.toLowerCase().includes('וושינגטון')) {
      secondaryLocations = [
        "Alexandria, Virginia", 
        "Arlington, Virginia", 
        "Georgetown", 
        "Annapolis, Maryland", 
        "Baltimore, Maryland"
      ];
    } 
    // מיקומים ליד בורדו
    else if (userPreferences.location.toLowerCase().includes('bordeaux') || 
             userPreferences.location.toLowerCase().includes('בורדו')) {
      secondaryLocations = [
        "Saint-Émilion", 
        "Médoc", 
        "Arcachon", 
        "Cognac", 
        "Bergerac"
      ];
    } 
    // ברירת מחדל למיקומים כלליים
    else {
      secondaryLocations = [
        `Areas near ${userPreferences.location}`, 
        `Suburbs of ${userPreferences.location}`, 
        `Day trip from ${userPreferences.location}`, 
        `Attractions around ${userPreferences.location}`, 
        `${userPreferences.location} region`
      ];
    }
    
    // יצירת מידע מותאם ליעד
    let locationsData = {};
    
    // נתונים עבור וושינגטון
    if (userPreferences.location.toLowerCase().includes('washington') || 
        userPreferences.location.toLowerCase().includes('וושינגטון')) {
      locationsData = {
        breakfasts: ["Lincoln's Waffle Shop", "Founding Farmers", "Busboys and Poets", "Ted's Bulletin"],
        attractions: ["Smithsonian National Air and Space Museum", "National Mall", "Capitol Building", "Lincoln Memorial"],
        lunch: ["Old Ebbitt Grill", "District Commons", "Ben's Chili Bowl", "The Hamilton"],
        afternoon: ["National Gallery of Art", "Washington Monument", "Tidal Basin", "Georgetown Historic District"],
        dinner: ["Rasika", "Oyamel", "Le Diplomate", "Zaytinya"],
        accommodations: ["The Hay-Adams", "Hotel Washington", "The Willard InterContinental", "Kimpton Hotel Monaco"]
      };
    }
    // נתונים עבור בורדו
    else if (userPreferences.location.toLowerCase().includes('bordeaux') || 
             userPreferences.location.toLowerCase().includes('בורדו')) {
      locationsData = {
        breakfasts: ["Café Français", "Karl Pâtisserie", "Plume Bakery & Coffee", "Horace"],
        attractions: ["La Cité du Vin", "Place de la Bourse", "Cathédrale Saint-André", "Grand Théâtre de Bordeaux"],
        lunch: ["Le Bistro du Musée", "La Brasserie Bordelaise", "Le Pressoir d'Argent", "Le Gabriel"],
        afternoon: ["Musée d'Aquitaine", "Jardin Public", "Rue Sainte-Catherine", "Basilique Saint-Michel"],
        dinner: ["Le Chapon Fin", "Le Pressoir d'Argent", "La Tupina", "Le Bistrot des Vignes"],
        accommodations: ["Hôtel de Sèze", "InterContinental Bordeaux", "Yndo Hôtel", "Les Sources de Caudalie"]
      };
    }
    // נתונים כלליים
    else {
      locationsData = {
        breakfasts: ["Local Café", "Breakfast House", "Morning Bakery", "Brunch Place"],
        attractions: ["Main Museum", "City Center", "Historic Site", "Cultural Center"],
        lunch: ["Local Bistro", "Traditional Restaurant", "City Grill", "Market Eatery"],
        afternoon: ["City Park", "Shopping District", "Art Gallery", "Cultural Experience"],
        dinner: ["Fine Dining Restaurant", "Local Cuisine Restaurant", "Popular Eatery", "Chef's Table"],
        accommodations: ["City Center Hotel", "Boutique Hotel", "Luxury Stay", "Historic Hotel"]
      };
    }
    
    // יצירת תוכנית טיול דינמית בהתאם ליעד
    const tripItinerary = [];
    
    for (let i = 0; i < userPreferences.days; i++) {
      // בימים הראשונים בעיר המרכזית, אח"כ במקומות אחרים
      const isInCity = i < 3;
      const location = isInCity ? userPreferences.location : 
                     secondaryLocations[i % secondaryLocations.length];
      
      // יצירת פעילויות ליום
      let dailySchedule = [];
      
      // ארוחת בוקר
      dailySchedule.push({
        timeStart: "08:00",
        timeEnd: "09:30",
        type: "breakfast",
        activity: "ארוחת בוקר",
        name: locationsData.breakfasts[i % locationsData.breakfasts.length],
        address: `${location}, אזור מרכזי`,
        description: "ארוחת בוקר מקומית עם מאפים טריים וקפה משובח",
        reservationNeeded: false,
        priceRange: "€€",
        openingHours: "07:00-11:00",
        travelTimeToNext: isInCity ? "15 דקות הליכה" : "20 דקות נסיעה",
        googleMapsSearchQuery: `${locationsData.breakfasts[i % locationsData.breakfasts.length]} ${location}`
      });
      
      // אטרקציה בוקר
      dailySchedule.push({
        timeStart: "10:00",
        timeEnd: "12:30",
        type: "attraction",
        activity: "ביקור באתר",
        name: locationsData.attractions[i % locationsData.attractions.length],
        address: `${location}, אזור מרכזי`,
        description: "אתר תיירות מרכזי באזור",
        entranceFee: "כניסה חופשית או כ-15€",
        openingHours: "09:00-17:00",
        recommendedDuration: "שעתיים וחצי",
        tips: "מומלץ להגיע בשעות הבוקר המוקדמות",
        travelTimeToNext: isInCity ? "15 דקות הליכה" : "20 דקות נסיעה",
        googleMapsSearchQuery: `${locationsData.attractions[i % locationsData.attractions.length]} ${location}`
      });
      
      // ארוחת צהריים
      dailySchedule.push({
        timeStart: "12:45",
        timeEnd: "14:15",
        type: "lunch",
        activity: "ארוחת צהריים",
        name: locationsData.lunch[i % locationsData.lunch.length],
        address: `${location}, מרכז העיר`,
        description: "מסעדה מקומית עם תפריט אזורי",
        reservationNeeded: true,
        priceRange: "€€-€€€",
        openingHours: "12:00-14:30",
        travelTimeToNext: isInCity ? "20 דקות הליכה" : "15 דקות נסיעה",
        googleMapsSearchQuery: `${locationsData.lunch[i % locationsData.lunch.length]} ${location}`
      });
      
      // אטרקציה אחה"צ
      dailySchedule.push({
        timeStart: "14:45",
        timeEnd: "17:00",
        type: "attraction",
        activity: "ביקור באתר",
        name: locationsData.afternoon[i % locationsData.afternoon.length],
        address: `${location}, אזור מרכזי`,
        description: "אתר תרבות או היסטוריה חשוב באזור",
        entranceFee: "כ-10€",
        openingHours: "10:00-18:00",
        recommendedDuration: "שעתיים",
        tips: "כדאי להשתתף בסיור מודרך",
        travelTimeToNext: "15-20 דקות נסיעה",
        googleMapsSearchQuery: `${locationsData.afternoon[i % locationsData.afternoon.length]} ${location}`
      });
      
      // ארוחת ערב
      dailySchedule.push({
        timeStart: "19:00",
        timeEnd: "21:00",
        type: "dinner",
        activity: "ארוחת ערב",
        name: locationsData.dinner[i % locationsData.dinner.length],
        address: `${location}, אזור יוקרתי`,
        description: "מסעדה איכותית עם מטבח מקומי משובח",
        reservationNeeded: true,
        priceRange: "€€€",
        openingHours: "19:00-22:30",
        travelTimeToNext: "10 דקות נסיעה",
        googleMapsSearchQuery: `${locationsData.dinner[i % locationsData.dinner.length]} ${location}`
      });
      
      // יצירת יום טיול שלם
      tripItinerary.push({
        day: i + 1,
        date: `יום ${getDayName(i)}`,
        location: location,
        summary: isInCity ? `יום גילוי ${userPreferences.location}` : `יום טיול באזור ${location}`,
        schedule: dailySchedule,
        transportation: {
          morning: isInCity ? "הליכה רגלית או תחבורה ציבורית" : "נסיעה ברכב שכור",
          afternoon: isInCity ? "תחבורה ציבורית או הליכה" : "המשך עם הרכב השכור",
          evening: "מומלץ להזמין מונית לחזרה למלון"
        },
        accommodation: {
          name: locationsData.accommodations[i % locationsData.accommodations.length],
          address: `${location}, מיקום מרכזי`,
          priceRange: "€€€",
          description: "מלון איכותי במיקום מרכזי עם שירות מעולה",
          bookingLink: "booking.com",
          googleMapsSearchQuery: `${locationsData.accommodations[i % locationsData.accommodations.length]} ${location}`
        }
      });
    }

    // עדכון מסלול הטיול
    console.log('מסלול טיול מלא ומפורט נוצר בהצלחה:', tripItinerary.length, 'ימים');
    setTripPlan(prev => ({ ...prev, dailyItinerary: tripItinerary, location: userPreferences.location }));

  } catch (error) {
    console.error('שגיאה בתכנון הטיול:', error);
    alert('התרחשה שגיאה בתכנון הטיול. נוצר מסלול בסיסי.');
    
    // יצירת מסלול בסיסי במקרה של כישלון - בלי להשתמש בפונקציות עזר נוספות
    const basicItinerary = [];
    
    for (let i = 0; i < userPreferences.days; i++) {
      const isInCity = i < 2;
      
      let location = userPreferences.location;
      if (!isInCity) {
        if (userPreferences.location.toLowerCase().includes('washington')) {
          location = ["Alexandria", "Arlington", "Georgetown"][i % 3];
        } else if (userPreferences.location.toLowerCase().includes('bordeaux') || 
                  userPreferences.location.toLowerCase().includes('בורדו')) {
          location = ["Saint-Émilion", "Médoc", "Arcachon"][i % 3];
        } else {
          location = `${userPreferences.location} surroundings`;
        }
      }
      
      basicItinerary.push({
        day: i + 1,
        date: `יום ${getDayName(i)}`,
        location: location,
        summary: isInCity ? `יום גילוי ${userPreferences.location}` : `יום טיול באזור ${location}`,
        schedule: [
          {
            timeStart: "10:00",
            timeEnd: "12:30",
            type: "attraction",
            activity: "ביקור באתר",
            name: isInCity ? "אתר תיירות מרכזי" : "אטרקציה מקומית",
            address: `${location}, אזור מרכזי`,
            description: "אתר תיירות פופולרי"
          },
          {
            timeStart: "12:45",
            timeEnd: "14:15",
            type: "lunch",
            activity: "ארוחת צהריים",
            name: "מסעדה מקומית",
            address: `${location}, מרכז העיר`,
            description: "מסעדה אותנטית עם מאכלים מקומיים"
          },
          {
            timeStart: "14:45",
            timeEnd: "17:00",
            type: "attraction",
            activity: "ביקור באתר",
            name: "אתר תרבות",
            address: `${location}, אזור מרכזי`,
            description: "אתר תרבות או היסטוריה מרכזי"
          }
        ],
        transportation: {
          morning: "תחבורה מקומית",
          afternoon: "תחבורה מקומית",
          evening: "מונית"
        },
        accommodation: {
          name: "מלון מרכזי",
          address: `${location}, מיקום מרכזי`,
          priceRange: "€€€",
          description: "מלון איכותי"
        }
      });
    }
    
    setTripPlan(prev => ({ ...prev, dailyItinerary: basicItinerary, location: userPreferences.location }));
  } finally {
    setIsLoading(false);
  }
};

// פונקציית תכנון טיול מתגלגל לאורך כל המסלול
const planRoadTrip = async () => {
  setIsLoading(true);
  try {
    // וידוא שיש לנו את נקודת ההתחלה, היעד ונקודות ביניים
    if (!startPoint || !endPoint) {
      alert('יש להזין נקודת התחלה ויעד כדי לתכנן טיול מתגלגל');
      setIsLoading(false);
      return;
    }

    // איסוף כל הנקודות במסלול
    const allStops = [startPoint, ...waypoints, endPoint];
    console.log('תחנות במסלול:', allStops);
    
    // חישוב מספר הימים בכל עצירה - מינימום יום אחד בכל נקודה
    const totalDays = userPreferences.days;
    const stopsCount = allStops.length;
    
    // חלוקת ימים בסיסית - לפחות יום אחד בכל תחנה
    let daysPerStop = new Array(stopsCount).fill(1);
    
    // חלוקת שארית הימים לפי חשיבות (יותר בהתחלה וביעד הסופי)
    let remainingDays = totalDays - stopsCount;
    if (remainingDays > 0) {
      // חלוקה לא שווה - יותר ימים בנקודת ההתחלה והיעד הסופי
      const startAndEndExtra = Math.floor(remainingDays * 0.7);
      const middleExtra = remainingDays - startAndEndExtra;
      
      // הוספת ימים לנקודת התחלה ויעד
      const extraPerMainStop = Math.floor(startAndEndExtra / 2);
      daysPerStop[0] += extraPerMainStop; // נקודת התחלה
      daysPerStop[daysPerStop.length - 1] += extraPerMainStop; // יעד סופי
      
      // הוספת ימים נותרים לתחנות ביניים
      if (stopsCount > 2 && middleExtra > 0) {
        const extraPerMiddleStop = Math.floor(middleExtra / (stopsCount - 2));
        for (let i = 1; i < stopsCount - 1; i++) {
          daysPerStop[i] += extraPerMiddleStop;
        }
      }
      
      // הוסף את הימים הנותרים לתחנה האחרונה אם יש
      const finalRemainingDays = totalDays - daysPerStop.reduce((a, b) => a + b, 0);
      if (finalRemainingDays > 0) {
        daysPerStop[daysPerStop.length - 1] += finalRemainingDays;
      }
    }
    
    console.log('חלוקת ימים לפי תחנות:', daysPerStop);
    
    // יצירת תכנית טיול מלאה לכל הנקודות
    let fullItinerary = [];
    let currentDay = 1;
    
    for (let stopIndex = 0; stopIndex < allStops.length; stopIndex++) {
      const location = allStops[stopIndex];
      const daysHere = daysPerStop[stopIndex];
      
      // יצירת תוכן ספציפי ליעד הנוכחי
      const locationData = getLocationData(location);
      
      // יצירת תכנית ליעד נוכחי
      const stopItinerary = createItineraryForLocation(location, locationData, daysHere, currentDay, stopIndex === allStops.length - 1, stopIndex < allStops.length - 1 ? allStops[stopIndex + 1] : null);
      
      // הוספה למסלול המלא
      fullItinerary = [...fullItinerary, ...stopItinerary];
      
      // עדכון מספר היום הבא
      currentDay += daysHere;
    }
    
    // עדכון תכנית הטיול
    setTripPlan(prev => ({ 
      ...prev, 
      dailyItinerary: fullItinerary,
      location: `מסלול מ${startPoint} ל${endPoint}`,
      isRoadTrip: true,
      routeStops: allStops,
      daysPerStop: daysPerStop
    }));
    
    console.log('תכנון טיול מתגלגל הושלם:', fullItinerary.length, 'ימים');
    
    // אם יש מסלול מוגדר כבר, נצבע אותו לפי חלוקת הימים
    if (directions) {
      colorRouteByDays(directions, daysPerStop);
    }
    
  } catch (error) {
    console.error('שגיאה בתכנון טיול מתגלגל:', error);
    alert('התרחשה שגיאה בתכנון הטיול המתגלגל.');
  } finally {
    setIsLoading(false);
  }
};

// פונקציה להחזרת מידע ספציפי ליעד
const getLocationData = (location) => {
  // פריז
  if (location.toLowerCase().includes('paris') || 
      location.toLowerCase().includes('פריז')) {
    return {
      breakfasts: ["Café de Flore", "Du Pain et des Idées", "Ladurée", "Angelina"],
      attractions: ["מגדל אייפל", "מוזיאון הלובר", "שאנז אליזה", "נוטרדאם"],
      lunch: ["Chez Janou", "Le Comptoir du Relais", "Le Relais de l'Entrecôte", "L'As du Fallafel"],
      afternoon: ["גני לוקסמבורג", "מונמארטר", "מוזיאון אורסיי", "קרוסל דו לובר"],
      dinner: ["L'Atelier de Joël Robuchon", "Le Jules Verne", "Septime", "Frenchie"],
      accommodations: ["מלון ריץ פריז", "פארק חיות", "הוטל קוסטס", "מלון קריון"],
      photos: ["https://via.placeholder.com/300x200?text=Paris"],
      localTips: "התחבורה הציבורית בפריז מצוינת. כדאי לרכוש כרטיסיות למטרו.",
      bestTime: "אביב (אפריל-יוני) וסתיו (ספטמבר-אוקטובר)",
      language: "צרפתית, אך אנגלית מדוברת במקומות תיירותיים",
      currency: "אירו (€)",
      festivals: [
        { name: "פסטיבל הג'אז בפריז", date: "יוני-יולי" },
        { name: "יום הבסטיליה", date: "14 ביולי" },
        { name: "נשף לבן", date: "יוני" }
      ]
    };
  }
  
  // לונדון
  else if (location.toLowerCase().includes('london') || 
           location.toLowerCase().includes('לונדון')) {
    return {
      breakfasts: ["The Breakfast Club", "Dishoom", "Granger & Co.", "Duck & Waffle"],
      attractions: ["ארמון בקינגהאם", "לונדון איי", "מוזיאון הבריטי", "טאואר ברידג'"],
      lunch: ["Borough Market", "The Wolseley", "Ottolenghi", "Sketch"],
      afternoon: ["פארק הייד", "מוזיאון ויקטוריה ואלברט", "קובנט גארדן", "גריניץ'"],
      dinner: ["The Ledbury", "Gordon Ramsay", "The Ivy", "Dinner by Heston Blumenthal"],
      accommodations: ["The Savoy", "The Ritz London", "Claridge's", "Shangri-La at The Shard"],
      photos: ["https://via.placeholder.com/300x200?text=London"],
      localTips: "כרטיס האויסטר חוסך כסף בתחבורה ציבורית. זכרו שמנהגים כמו לעמוד בצד ימין במדרגות נעות נחשבים לחשובים.",
      bestTime: "מאי עד ספטמבר",
      language: "אנגלית",
      currency: "ליש״ט (£)",
      festivals: [
        { name: "קרנבל נוטינג היל", date: "סוף אוגוסט" },
        { name: "פסטיבל תמזה", date: "ספטמבר" },
        { name: "לונדון פילם פסטיבל", date: "אוקטובר" }
      ]
    };
  }
  
  // ברצלונה
  else if (location.toLowerCase().includes('barcelona') || 
           location.toLowerCase().includes('ברצלונה')) {
    return {
      breakfasts: ["La Boqueria Market", "Café de l'Òpera", "Milk Bar & Bistro", "Chök"],
      attractions: ["סגרדה פמיליה", "פארק גואל", "לה רמבלה", "קמפ נואו"],
      lunch: ["El Quim de la Boqueria", "Tickets", "La Cova Fumada", "Bar Cañete"],
      afternoon: ["חוף ברצלונטה", "מוזיאון פיקאסו", "הרובע הגותי", "מונז'ואיק"],
      dinner: ["Disfrutar", "Enigma", "ABaC", "El Celler de Can Roca"],
      accommodations: ["W Barcelona", "Hotel Arts", "Mandarin Oriental Barcelona", "Cotton House Hotel"],
      photos: ["https://via.placeholder.com/300x200?text=Barcelona"],
      localTips: "שעות האוכל בספרד שונות - ארוחת הערב מתחילה לרוב ב-21:00 ומאוחר יותר.",
      bestTime: "אפריל עד יוני, ספטמבר עד נובמבר",
      language: "ספרדית וקטלאנית",
      currency: "אירו (€)",
      festivals: [
        { name: "פסטה מאג'ור דה לה מרסה", date: "ספטמבר" },
        { name: "פסטיבל סונאר", date: "יוני" },
        { name: "פרימברה סאונד", date: "מאי-יוני" }
      ]
    };
  }

  // טוקיו
  else if (location.toLowerCase().includes('tokyo') || 
           location.toLowerCase().includes('טוקיו')) {
    return {
      breakfasts: ["Tsukiji Fish Market", "Eggs 'n Things", "Café de l'Ambre", "Bills"],
      attractions: ["מקדש מייג'י", "טוקיו סקייטרי", "שינג'וקו גיואן", "מקדש סנסו-ג'י"],
      lunch: ["מסעדות ראמן באיבושו", "Tonkatsu Maisen", "Sushi Dai", "Ichiran"],
      afternoon: ["אזור שיבויה", "אזור הרפובה", "חנויות באקיהברה", "אודאיבה"],
      dinner: ["Sukiyabashi Jiro", "Narisawa", "Nihonryori RyuGin", "Ginza Kyubey"],
      accommodations: ["Park Hyatt Tokyo", "Mandarin Oriental Tokyo", "Aman Tokyo", "The Ritz-Carlton Tokyo"],
      photos: ["https://via.placeholder.com/300x200?text=Tokyo"],
      localTips: "שימו לב לכללי הנימוס המקומיים. תיפים אינם מקובלים.",
      bestTime: "מרץ-מאי (פריחת הדובדבן) או אוקטובר-נובמבר (סתיו)",
      language: "יפנית, אנגלית מוגבלת במקומות תיירותיים",
      currency: "ין (¥)",
      festivals: [
        { name: "פסטיבל סנג'ה", date: "מאי" },
        { name: "פסטיבל קנדה מטסורי", date: "יולי" },
        { name: "פסטיבל סומידה", date: "יולי" }
      ]
    };
  }
  
  // בדיקה עבור וושינגטון
  if (location.toLowerCase().includes('washington') || 
      location.toLowerCase().includes('וושינגטון')) {
    return {
      breakfasts: ["Lincoln's Waffle Shop", "Founding Farmers", "Busboys and Poets", "Ted's Bulletin"],
      attractions: ["Smithsonian National Air and Space Museum", "National Mall", "Capitol Building", "Lincoln Memorial"],
      lunch: ["Old Ebbitt Grill", "District Commons", "Ben's Chili Bowl", "The Hamilton"],
      afternoon: ["National Gallery of Art", "Washington Monument", "Tidal Basin", "Georgetown Historic District"],
      dinner: ["Rasika", "Oyamel", "Le Diplomate", "Zaytinya"],
      accommodations: ["The Hay-Adams", "Hotel Washington", "The Willard InterContinental", "Kimpton Hotel Monaco"],
      photos: ["https://via.placeholder.com/300x200?text=Washington+DC"]
    };
  } 
  // בדיקה עבור לוס אנג'לס
  else if (location.toLowerCase().includes('los angeles') || 
           location.toLowerCase().includes('לוס אנג\'לס')) {
    return {
      breakfasts: ["Blu Jam Café", "Republique", "Eggslut", "Urth Caffé"],
      attractions: ["Hollywood Walk of Fame", "Griffith Observatory", "Santa Monica Pier", "Getty Center"],
      lunch: ["Grand Central Market", "In-N-Out Burger", "Bestia", "Langer's Deli"],
      afternoon: ["Venice Beach", "Universal Studios", "LACMA", "The Grove"],
      dinner: ["Nobu", "Providence", "Animal", "Jon & Vinny's"],
      accommodations: ["The Beverly Hills Hotel", "Chateau Marmont", "The Standard", "Ace Hotel Downtown"],
      photos: ["https://via.placeholder.com/300x200?text=Los+Angeles"]
    };
  }
  // בדיקה עבור ניו יורק
  else if (location.toLowerCase().includes('new york') || 
           location.toLowerCase().includes('ניו יורק')) {
    return {
      breakfasts: ["Russ & Daughters", "Clinton St. Baking Company", "Balthazar", "Sarabeth's"],
      attractions: ["Empire State Building", "Central Park", "Statue of Liberty", "Times Square"],
      lunch: ["Katz's Delicatessen", "Shake Shack", "Eataly", "Chelsea Market"],
      afternoon: ["MoMA", "High Line", "Brooklyn Bridge", "Metropolitan Museum of Art"],
      dinner: ["Peter Luger", "Le Bernardin", "Momofuku Ko", "Gramercy Tavern"],
      accommodations: ["The Plaza", "The Standard High Line", "Ace Hotel", "The NoMad Hotel"],
      photos: ["https://via.placeholder.com/300x200?text=New+York"]
    };
  }
  // בדיקה עבור בורדו
  else if (location.toLowerCase().includes('bordeaux') || 
           location.toLowerCase().includes('בורדו')) {
    return {
      breakfasts: ["Café Français", "Karl Pâtisserie", "Plume Bakery & Coffee", "Horace"],
      attractions: ["La Cité du Vin", "Place de la Bourse", "Cathédrale Saint-André", "Grand Théâtre de Bordeaux"],
      lunch: ["Le Bistro du Musée", "La Brasserie Bordelaise", "Le Pressoir d'Argent", "Le Gabriel"],
      afternoon: ["Musée d'Aquitaine", "Jardin Public", "Rue Sainte-Catherine", "Basilique Saint-Michel"],
      dinner: ["Le Chapon Fin", "Le Pressoir d'Argent", "La Tupina", "Le Bistrot des Vignes"],
      accommodations: ["Hôtel de Sèze", "InterContinental Bordeaux", "Yndo Hôtel", "Les Sources de Caudalie"],
      photos: ["https://via.placeholder.com/300x200?text=Bordeaux"]
    };
  }
  // בדיקה עבור רומא
  else if (location.toLowerCase().includes('rome') || 
           location.toLowerCase().includes('roma') || 
           location.toLowerCase().includes('רומא')) {
    return {
      breakfasts: ["Roscioli Caffè", "Sant'Eustachio Il Caffè", "Panella", "Coromandel"],
      attractions: ["Colosseum", "Vatican Museums", "Trevi Fountain", "Roman Forum"],
      lunch: ["Da Enzo al 29", "Roscioli", "Pizzarium", "Armando al Pantheon"],
      afternoon: ["Pantheon", "Galleria Borghese", "Spanish Steps", "Castel Sant'Angelo"],
      dinner: ["Pierluigi", "Cesare al Casaletto", "La Pergola", "Checchino dal 1887"],
      accommodations: ["Hotel Hassler", "Hotel de Russie", "The St. Regis Rome", "Hotel Eden"],
      photos: ["https://via.placeholder.com/300x200?text=Rome"]
    };
  }
  // בדיקה עבור פירנצה
  else if (location.toLowerCase().includes('florence') || 
           location.toLowerCase().includes('firenze') || 
           location.toLowerCase().includes('פירנצה')) {
    return {
      breakfasts: ["Ditta Artigianale", "La Ménagère", "S.forno", "Caffè Gilli"],
      attractions: ["Uffizi Gallery", "Duomo", "Ponte Vecchio", "Galleria dell'Accademia"],
      lunch: ["All'Antico Vinaio", "Trattoria Mario", "Osteria Santo Spirito", "Il Latini"],
      afternoon: ["Pitti Palace", "Boboli Gardens", "Piazzale Michelangelo", "Basilica of Santa Croce"],
      dinner: ["Enoteca Pinchiorri", "La Giostra", "Il Palagio", "Osteria Francescana"],
      accommodations: ["Four Seasons Hotel Firenze", "Hotel Savoy", "The St. Regis Florence", "Portrait Firenze"],
      photos: ["https://via.placeholder.com/300x200?text=Florence"]
    };
  }
  // בדיקה עבור סיאטל
  else if (location.toLowerCase().includes('seattle') || 
           location.toLowerCase().includes('סיאטל')) {
    return {
      breakfasts: ["Biscuit Bitch", "The Crumpet Shop", "Portage Bay Cafe", "General Porpoise"],
      attractions: ["Space Needle", "Pike Place Market", "Chihuly Garden and Glass", "Museum of Pop Culture"],
      lunch: ["Pike Place Chowder", "Salumi", "Serious Pie", "Ivar's Acres of Clams"],
      afternoon: ["Olympic Sculpture Park", "Kerry Park", "Seattle Aquarium", "Gas Works Park"],
      dinner: ["Canlis", "The Walrus and the Carpenter", "Altura", "Spinasse"],
      accommodations: ["Fairmont Olympic Hotel", "Thompson Seattle", "Four Seasons Hotel Seattle", "The Edgewater"],
      photos: ["https://via.placeholder.com/300x200?text=Seattle"]
    };
  }
  
  // ברירת מחדל למיקום לא מוכר
  return {
    breakfasts: ["מסעדת בוקר מקומית", "בית קפה פופולרי", "קונדיטוריה מומלצת", "מאפייה מקומית"],
    attractions: ["אתר תיירות מרכזי", "מוזיאון מקומי", "אתר היסטורי", "מרכז תרבות"],
    lunch: ["מסעדה מקומית", "ביסטרו מומלץ", "מסעדת שף", "מזנון מקומי"],
    afternoon: ["פארק עירוני", "אזור קניות", "גלריה לאמנות", "אזור בילויים"],
    dinner: ["מסעדה יוקרתית", "מסעדה מקומית", "מסעדת שף", "ביסטרו ערב"],
    accommodations: ["מלון מרכזי", "מלון בוטיק", "מלון יוקרה", "אכסניה מומלצת"],
    photos: ["https://via.placeholder.com/300x200?text=" + encodeURIComponent(location)]
  };
};

// פונקציה ליצירת תכנית יומית ליעד מסוים
const createItineraryForLocation = (location, locationData, days, startingDay, isLastStop, nextStop) => {
  // יצירת תכנית יומית לפי יעד
  const itinerary = [];
  
  for (let i = 0; i < days; i++) {
    const dayNumber = startingDay + i;
    const isLastDay = i === days - 1 && !isLastStop;
    
    // יצירת סיכום מותאם למיקום ביום
    let summary = '';
    if (i === 0 && startingDay === 1) {
      summary = `הגעה ל${location} והתמקמות`;
    } else if (isLastDay && nextStop) {
      summary = `יום אחרון ב${location} ונסיעה ל${nextStop}`;
    } else if (i === 0) {
      summary = `הגעה ל${location}`;
    } else {
      summary = `יום ${i+1} ב${location}`;
    }
    
    // יצירת לוח זמנים מותאם ליום
    const dailySchedule = [];
    
    // ארוחת בוקר
    dailySchedule.push({
      timeStart: "08:00",
      timeEnd: "09:30",
      type: "breakfast",
      activity: "ארוחת בוקר",
      name: locationData.breakfasts[i % locationData.breakfasts.length],
      address: `${location}, אזור מרכזי`,
      description: "ארוחת בוקר מקומית עם מאפים טריים וקפה משובח",
      reservationNeeded: false,
      priceRange: "€€",
      openingHours: "07:00-11:00",
      travelTimeToNext: "15 דקות הליכה",
      googleMapsSearchQuery: `${locationData.breakfasts[i % locationData.breakfasts.length]} ${location}`
    });
    
    // אטרקציה בוקר
    dailySchedule.push({
      timeStart: "10:00",
      timeEnd: "12:30",
      type: "attraction",
      activity: "ביקור באתר",
      name: locationData.attractions[i % locationData.attractions.length],
      address: `${location}, אזור מרכזי`,
      description: "אתר תיירות מרכזי באזור",
      entranceFee: "כניסה חופשית או כ-15€",
      openingHours: "09:00-17:00",
      recommendedDuration: "שעתיים וחצי",
      tips: "מומלץ להגיע בשעות הבוקר המוקדמות",
      travelTimeToNext: "15 דקות הליכה",
      googleMapsSearchQuery: `${locationData.attractions[i % locationData.attractions.length]} ${location}`
    });
    
    // ארוחת צהריים
    dailySchedule.push({
      timeStart: "12:45",
      timeEnd: "14:15",
      type: "lunch",
      activity: "ארוחת צהריים",
      name: locationData.lunch[i % locationData.lunch.length],
      address: `${location}, מרכז העיר`,
      description: "מסעדה מקומית עם תפריט אזורי",
      reservationNeeded: true,
      priceRange: "€€-€€€",
      openingHours: "12:00-14:30",
      travelTimeToNext: "20 דקות הליכה",
      googleMapsSearchQuery: `${locationData.lunch[i % locationData.lunch.length]} ${location}`
    });
    
    // אטרקציה אחה"צ
    dailySchedule.push({
      timeStart: "14:45",
      timeEnd: "17:00",
      type: "attraction",
      activity: "ביקור באתר",
      name: locationData.afternoon[i % locationData.afternoon.length],
      address: `${location}, אזור מרכזי`,
      description: "אתר תרבות או היסטוריה חשוב באזור",
      entranceFee: "כ-10€",
      openingHours: "10:00-18:00",
      recommendedDuration: "שעתיים",
      tips: "כדאי להשתתף בסיור מודרך",
      travelTimeToNext: "15-20 דקות נסיעה",
      googleMapsSearchQuery: `${locationData.afternoon[i % locationData.afternoon.length]} ${location}`
    });
    
    // אם זה היום האחרון במיקום והמיקום הבא קיים, נוסיף נסיעה למיקום הבא
    if (isLastDay && nextStop) {
      dailySchedule.push({
        timeStart: "17:30",
        timeEnd: "19:00",
        type: "transport",
        activity: "נסיעה ליעד הבא",
        name: `נסיעה מ${location} ל${nextStop}`,
        description: `נסיעה ליעד הבא במסלול: ${nextStop}`,
        tips: "וודא שאספת את כל החפצים מהמלון לפני העזיבה",
        googleMapsSearchQuery: `from:${location} to:${nextStop}`
      });
      
      // נוסיף ארוחת ערב ביעד החדש
      dailySchedule.push({
        timeStart: "19:30",
        timeEnd: "21:00",
        type: "dinner",
        activity: "ארוחת ערב",
        name: `מסעדה מקומית ב${nextStop}`,
        address: `${nextStop}, אזור מרכזי`,
        description: `ארוחת ערב ראשונה ב${nextStop} לאחר ההגעה`,
        reservationNeeded: true,
        priceRange: "€€€",
        openingHours: "19:00-22:30",
        travelTimeToNext: "10 דקות נסיעה",
        googleMapsSearchQuery: `restaurant ${nextStop}`
      });
      
    } else {
      // ארוחת ערב רגילה אם זה לא יום מעבר
      dailySchedule.push({
        timeStart: "19:00",
        timeEnd: "21:00",
        type: "dinner",
        activity: "ארוחת ערב",
        name: locationData.dinner[i % locationData.dinner.length],
        address: `${location}, אזור יוקרתי`,
        description: "מסעדה איכותית עם מטבח מקומי משובח",
        reservationNeeded: true,
        priceRange: "€€€",
        openingHours: "19:00-22:30",
        travelTimeToNext: "10 דקות נסיעה",
        googleMapsSearchQuery: `${locationData.dinner[i % locationData.dinner.length]} ${location}`
      });
    }
    
    // הוספת היום לתכנית
    itinerary.push({
      day: dayNumber,
      date: `יום ${getDayName(dayNumber - 1)}`,
      location: location,
      summary: summary,
      schedule: dailySchedule,
      transportation: {
        morning: "הליכה רגלית או תחבורה מקומית",
        afternoon: "תחבורה מקומית",
        evening: isLastDay && nextStop ? `נסיעה ל${nextStop}` : "מונית או תחבורה מקומית"
      },
      accommodation: {
        name: isLastDay && nextStop ? `מלון ב${nextStop}` : locationData.accommodations[i % locationData.accommodations.length],
        address: isLastDay && nextStop ? `${nextStop}, מיקום מרכזי` : `${location}, מיקום מרכזי`,
        priceRange: "€€€",
        description: isLastDay && nextStop ? `לינה ראשונה ב${nextStop}` : "מלון איכותי במיקום מרכזי",
        bookingLink: "booking.com",
        googleMapsSearchQuery: isLastDay && nextStop ? `hotel ${nextStop}` : `${locationData.accommodations[i % locationData.accommodations.length]} ${location}`
      },
      stopIndex: startingDay === 1 ? 0 : Math.floor((startingDay - 1) / days) + 1
    });
  }
  
  return itinerary;
};

// פונקציה לצביעת המסלול במפה לפי חלוקת הימים
const colorRouteByDays = (directions, daysPerStop) => {
  if (!directions || !directions.routes || directions.routes.length === 0 || !mapRef.current) {
    console.warn('אין אפשרות לצבוע מסלול - חסרים נתוני מסלול');
    return;
  }
  
  // בטל את המסלול הנוכחי
  if (window.currentRouteRenderers) {
    window.currentRouteRenderers.forEach(renderer => renderer.setMap(null));
  }
  
  window.currentRouteRenderers = [];
  
  // צור מערך של צבעים לסגמנטים
  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000'];
  
  // חלק את המסלול לסגמנטים לפי מספר התחנות
  const route = directions.routes[0];
  const legs = route.legs;
  
  // וודא שיש מספיק רגליים (legs) למסלול
  if (legs.length !== daysPerStop.length - 1) {
    console.warn('מספר הרגליים במסלול לא תואם למספר התחנות', legs.length, daysPerStop.length);
    return;
  }
  
  // צבע כל סגמנט בצבע אחר
  legs.forEach((leg, index) => {
    const color = colors[index % colors.length];
    const renderer = new window.google.maps.DirectionsRenderer({
      map: mapRef.current,
      directions: directions,
      routeIndex: 0,
      polylineOptions: {
        strokeColor: color,
        strokeWeight: 5,
        strokeOpacity: 0.7
      },
      suppressMarkers: true,
      preserveViewport: true,
      suppressPolylines: false,
      suppressBicyclingLayer: true,
      suppressInfoWindows: true,
    });
    
    // שמור את ה-renderer לניקוי עתידי
    window.currentRouteRenderers.push(renderer);
  });
  
  // הוסף סמנים לכל נקודת עצירה עם מספר הימים
  const allStops = [startPoint, ...waypoints, endPoint];
  
  allStops.forEach((stop, index) => {
    // צור סמן במיקום העצירה
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: stop }, (results, status) => {
      if (status === window.google.maps.GeocoderStatus.OK && results && results.length > 0) {
        const position = results[0].geometry.location;
        
        // צור סמן מותאם עם מספר הימים
        const daysText = daysPerStop[index].toString();
        const marker = new window.google.maps.Marker({
          position: position,
          map: mapRef.current,
          title: `${stop} - ${daysText} ימים`,
          label: {
            text: daysText,
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold'
          },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: colors[index % colors.length],
            fillOpacity: 0.9,
            strokeWeight: 2,
            strokeColor: 'white',
            scale: 18
          },
          zIndex: 1000
        });
        
        // הוסף חלון מידע עם פרטים על העצירה
        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div style="direction: rtl; text-align: right;">
            <h3>${stop}</h3>
            <p>מספר ימים: ${daysPerStop[index]}</p>
            <p>ימים: ${getStopDays(index, daysPerStop)}</p>
          </div>`
        });
        
        marker.addListener('click', () => {
          infoWindow.open(mapRef.current, marker);
        });
        
        // שמור את הסמנים לניקוי עתידי
        window.currentRouteRenderers.push(marker);
      }
    });
  });
};

// פונקציית עזר לחישוב הימים בכל עצירה
const getStopDays = (stopIndex, daysPerStop) => {
  let startDay = 1;
  for (let i = 0; i < stopIndex; i++) {
    startDay += daysPerStop[i];
  }
  
  const endDay = startDay + daysPerStop[stopIndex] - 1;
  return `${startDay}-${endDay}`;
};
// יצירת סמנים לאטרקציות - עם אייקונים מודרניים
useEffect(() => {
  if (!isMapsLoaded || !window.google || !mapRef.current || attractions.length === 0) return;

  // נקה תחילה סמנים קיימים
  if (markers.length > 0) {
    markers.forEach(marker => marker.setMap(null));
  }

  // סנן אטרקציות על פי מסננים פעילים
  const filteredAttractions = attractions.filter(
    attraction => activeFilters.includes('all') || activeFilters.includes(attraction.category)
  );

  console.log('מציג אטרקציות:', filteredAttractions.length);
  
  // בדיקה שיש אטרקציות לתצוגה
  if (filteredAttractions.length === 0) {
    console.log('אין אטרקציות להצגה לאחר סינון');
    setMarkers([]);
    return;
  }

  try {
    // יצירת סמנים עם אייקונים מותאמים אישית
    const newMarkers = filteredAttractions.map((attraction, index) => {
      const categoryKey = attraction.category || 'touristAttraction';
      const iconInfo = CATEGORY_ICONS[categoryKey] || { 
        color: '#888888', 
        icon: 'place',
        label: 'מקום'
      };
      
      // לוג לבדיקה
      if (index < 3) {
        console.log(`יוצר סמן: ${attraction.name}, קטגוריה: ${categoryKey}, אייקון: ${iconInfo.icon}`);
      }
      
      // יצירת סמן Google Maps עם אייקון מותאם
      const marker = new window.google.maps.Marker({
        position: { lat: attraction.location.lat, lng: attraction.location.lng },
        map: mapRef.current,
        title: attraction.name,
        icon: {
          url: createCustomMarkerIcon(iconInfo.icon, iconInfo.color),
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 20)
        },
        // הוספת אנימציה לסמנים
        animation: window.google.maps.Animation.DROP
      });

      // הוספת אירוע לחיצה על הסמן
      marker.addListener('click', () => setSelectedAttraction(attraction));
      return marker;
    });

    setMarkers(newMarkers);
    console.log('נוצרו סמנים:', newMarkers.length);

    // פונקציית ניקוי
    return () => {
      newMarkers.forEach(marker => marker.setMap(null));
    };
  } catch (error) {
    console.error('שגיאה ביצירת סמנים:', error);
  }
}, [isMapsLoaded, attractions, activeFilters]);

const handleButtonFilter = (filter) => {
  try {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter) 
        : [...prev, filter].filter(f => f !== 'all' || prev.length === 1)
    );
    
    // אין צורך לקרוא לsearchRoute שוב - הסמנים מתעדכנים אוטומטית בזכות useEffect
  } catch (error) {
    alert('שגיאה בעדכון הסינון: ' + (error.message || 'שגיאה לא ידועה'));
    console.error('שגיאה מפורטת בעדכון הסינון:', error);
  }
};

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

const deleteTripLog = (id) => {
  const updatedLogs = tripLogs.filter(log => log.id !== id);
  setTripLogs(updatedLogs);
  localStorage.setItem('tripLogs', JSON.stringify(updatedLogs));
};

const editTripLog = (id, updatedLog) => {
  const updatedLogs = tripLogs.map(log => log.id === id ? { ...log, ...updatedLog } : log);
  setTripLogs(updatedLogs);
  localStorage.setItem('tripLogs', JSON.stringify(updatedLogs));
};

// 2. הוספת אפשרות להוסיף פעילות ליום קיים - פונקציה חדשה להוספת פעילויות
const addActivityToDay = (dayIndex) => {
  const updatedItinerary = [...tripPlan.dailyItinerary];
  const newActivity = {
    timeStart: "לבחירתך",
    timeEnd: "לבחירתך",
    type: "attraction",
    activity: "פעילות חדשה",
    name: "שם המקום",
    category: "קטגוריה",
    address: `${userPreferences.location}, אזור מרכזי`,
    openingHours: "9:00-17:00",
    description: "תיאור מפורט של המקום"
  };
  
  updatedItinerary[dayIndex].schedule.push(newActivity);
  setTripPlan(prev => ({ ...prev, dailyItinerary: updatedItinerary }));
  
  // פתיחת חלון העריכה עבור הפעילות החדשה
  setEditedAttraction(newActivity);
  setSelectedDay(dayIndex + 1);
  setSelectedActivityIndex(updatedItinerary[dayIndex].schedule.length - 1);
  setEditModalOpen(true);
};

const handleEditAttraction = (day, activityIndex) => {
  const activity = tripPlan.dailyItinerary[day - 1]?.schedule[activityIndex] || {};
  setEditedAttraction(activity);
  setSelectedDay(day);
  setSelectedActivityIndex(activityIndex);
  setEditModalOpen(true);
};
// 3. עדכון רכיב תצוגת לוח זמנים יומי משופר - לתמיכה במקומות ספציפיים
const DailyTimeline = ({ dayData }) => {
  // ניתוח תצוגת פעילות לפי סוג - כדי להציג אייקון ועיצוב מתאים
  const getActivityIcon = (type) => {
    switch (type) {
      case 'breakfast': return 'restaurant_menu';
      case 'lunch': return 'lunch_dining';
      case 'dinner': return 'dinner_dining';
      case 'attraction': return 'attractions';
      case 'museum': return 'museum';
      case 'tour': return 'tour';
      case 'activity': return 'event';
      case 'shopping': return 'shopping_bag';
      case 'accommodation': return 'hotel';
      case 'transport': return 'directions_car';
      default: return 'place';
    }
  };
  
  // קבלת צבע לפי סוג הפעילות
  const getActivityColor = (type) => {
    switch (type) {
      case 'breakfast': return '#FF9800';
      case 'lunch': return '#FB8C00';
      case 'dinner': return '#F57C00';
      case 'attraction': return '#2196F3';
      case 'museum': return '#9C27B0';
      case 'tour': return '#3F51B5';
      case 'activity': return '#4CAF50';
      case 'shopping': return '#E91E63';
      case 'accommodation': return '#673AB7';
      case 'transport': return '#607D8B';
      default: return '#9E9E9E';
    }
  };
  
  // המרת מחרוזת מחיר לאייקון
  const getPriceIcons = (priceRange) => {
    if (!priceRange) return null;
    
    let count = 0;
    if (priceRange.includes('€€€€')) count = 4;
    else if (priceRange.includes('€€€')) count = 3;
    else if (priceRange.includes('€€')) count = 2;
    else if (priceRange.includes('€')) count = 1;
    
    return (
      <Box sx={{ display: 'flex', color: '#9e9e9e' }}>
        {Array(count).fill(0).map((_, i) => (
          <i key={i} className="material-icons" style={{ fontSize: '16px' }}>euro</i>
        ))}
      </Box>
    );
  };
  
  // עיבוד זמני התחלה וסיום לתצוגה
  const formatTimeRange = (timeStart, timeEnd) => {
    if (!timeStart) return '';
    if (!timeEnd) return timeStart;
    return `${timeStart} - ${timeEnd}`;
  };

  // פונקציית ניווט משופרת - משתמשת בשאילתת Google Maps אם זמינה, אחרת בכתובת או שם
  const navigateToActivity = (activity) => {
    // אם יש שאילתת חיפוש ספציפית ל-Google Maps, השתמש בה
    const searchQuery = activity.googleMapsSearchQuery || 
                     `${activity.name} ${activity.address || dayData.location || ''}`;
    
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`);
  };
  
  return (
    <Box sx={{ my: 2 }}>
      <Typography variant="h6" sx={{ 
        mb: 2, 
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '2px solid #e0e0e0',
        paddingBottom: '8px'
      }}>
        <i className="material-icons" style={{ marginRight: '8px' }}>today</i>
        {dayData.date} - {dayData.summary}
      </Typography>
      
      {/* הוספת מיקום יומי - חדש! */}
      <Paper elevation={1} sx={{ p: 1.5, mb: 2, bgcolor: '#e8f5e9', borderRadius: '8px', border: '1px solid #c8e6c9' }}>
        <Typography variant="subtitle1" sx={{ 
          fontWeight: 'bold', 
          display: 'flex', 
          alignItems: 'center',
          color: '#2e7d32'
        }}>
          <i className="material-icons" style={{ marginRight: '8px', fontSize: '20px' }}>location_on</i>
          מיקום: {dayData.location || userPreferences.location}
        </Typography>
      </Paper>
      
      {/* רכיב ניווט להמלצות תחבורה יומיות */}
      <Paper elevation={0} sx={{ p: 1.5, mb: 2, bgcolor: '#f5f5f5', borderRadius: '8px', border: '1px dashed #ccc' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
          <i className="material-icons" style={{ marginRight: '4px', fontSize: '18px' }}>directions</i>
          המלצות תחבורה להיום:
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
          {dayData.transportation && Object.entries(dayData.transportation).map(([time, recommendation]) => (
            <Typography key={time} variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
              <Box component="span" sx={{ fontWeight: 'bold', minWidth: '60px' }}>{time}:</Box>
              {recommendation}
            </Typography>
          ))}
        </Box>
      </Paper>
      
      {/* לוח זמנים */}
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {dayData.schedule && dayData.schedule.map((activity, idx) => (
          <Box 
            key={idx} 
            sx={{ 
              display: 'flex', 
              mb: 2,
              position: 'relative',
              '&::after': idx < dayData.schedule.length - 1 ? {
                content: '""',
                position: 'absolute',
                left: '20px',
                top: '40px',
                bottom: '-20px',
                width: '2px',
                bgcolor: '#e0e0e0',
                zIndex: 0
              } : {}
            }}
          >
            {/* אייקון הפעילות וזמן */}
            <Box sx={{ 
              mr: 2, 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: '40px'
            }}>
              <Box sx={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                bgcolor: getActivityColor(activity.type),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                position: 'relative',
                zIndex: 1
              }}>
                <i className="material-icons">{getActivityIcon(activity.type)}</i>
              </Box>
              <Typography variant="caption" sx={{ mt: 0.5, textAlign: 'center', fontWeight: 'bold' }}>
                {formatTimeRange(activity.timeStart, activity.timeEnd)}
              </Typography>
            </Box>
            
            {/* פרטי הפעילות */}
            <Paper sx={{ 
              flex: 1, 
              p: 1.5, 
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              '&:hover': {
                boxShadow: '0 3px 8px rgba(0,0,0,0.1)'
              }
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: getActivityColor(activity.type) }}>
                  {activity.name}
                </Typography>
                {getPriceIcons(activity.priceRange)}
              </Box>
              
              <Typography variant="body2" sx={{ mb: 1 }}>
                {activity.description}
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {/* מידע נוסף */}
                {activity.address && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <i className="material-icons" style={{ fontSize: '16px', marginRight: '4px', color: '#666', marginTop: '2px' }}>place</i>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      {activity.address}
                    </Typography>
                  </Box>
                )}
                
                {activity.openingHours && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <i className="material-icons" style={{ fontSize: '16px', marginRight: '4px', color: '#666' }}>access_time</i>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      שעות פתיחה: {activity.openingHours}
                    </Typography>
                  </Box>
                )}
                
                {activity.entranceFee && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <i className="material-icons" style={{ fontSize: '16px', marginRight: '4px', color: '#666' }}>payments</i>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      מחיר כניסה: {activity.entranceFee}
                    </Typography>
                  </Box>
                )}
                
                {activity.recommendedDuration && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <i className="material-icons" style={{ fontSize: '16px', marginRight: '4px', color: '#666' }}>schedule</i>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      משך זמן מומלץ: {activity.recommendedDuration}
                    </Typography>
                  </Box>
                )}
                
                {activity.tips && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <i className="material-icons" style={{ fontSize: '16px', marginRight: '4px', color: '#666' }}>lightbulb</i>
                    <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                      טיפ: {activity.tips}
                    </Typography>
                  </Box>
                )}
                
                {activity.travelTimeToNext && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <i className="material-icons" style={{ fontSize: '16px', marginRight: '4px', color: '#666' }}>directions</i>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      זמן נסיעה למקום הבא: {activity.travelTimeToNext}
                    </Typography>
                  </Box>
                )}
                
                {activity.reservationNeeded && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <i className="material-icons" style={{ fontSize: '16px', marginRight: '4px', color: '#f44336' }}>event_available</i>
                    <Typography variant="body2" sx={{ color: '#f44336', fontWeight: 'bold' }}>
                      מומלץ להזמין מראש!
                    </Typography>
                  </Box>
                )}
              </Box>
              
              {/* כפתורי פעולה - משודרגים */}
              <Box sx={{ display: 'flex', mt: 1.5, pt: 1, borderTop: '1px dashed #e0e0e0', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigateToActivity(activity)}
                  startIcon={<i className="material-icons">directions</i>}
                  sx={{ borderRadius: '20px', fontSize: '12px' }}
                >
                  נווט
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(activity.name)}`)}
                  startIcon={<i className="material-icons">search</i>}
                  sx={{ borderRadius: '20px', fontSize: '12px' }}
                >
                  חפש מידע
                </Button>
                
                {(activity.type === 'restaurant' || activity.type === 'breakfast' || activity.type === 'lunch' || activity.type === 'dinner') && (
                  <>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => window.open(`https://www.tripadvisor.com/Search?q=${encodeURIComponent(activity.name)}`)}
                      startIcon={<i className="material-icons">restaurant</i>}
                      sx={{ borderRadius: '20px', fontSize: '12px' }}
                    >
                      ביקורות
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => window.open(`https://www.thefork.com/search?q=${encodeURIComponent(activity.name)}`)}
                      startIcon={<i className="material-icons">book_online</i>}
                      sx={{ borderRadius: '20px', fontSize: '12px' }}
                    >
                      הזמן שולחן
                    </Button>
                  </>
                )}
                
                {activity.type === 'accommodation' && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => window.open(`https://www.booking.com/search.he.html?ss=${encodeURIComponent(activity.name)}`)}
                    startIcon={<i className="material-icons">hotel</i>}
                    sx={{ borderRadius: '20px', fontSize: '12px' }}
                  >
                    הזמן
                  </Button>
                )}
                
                {/* כפתור להצגת תמונות - חדש */}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(activity.name)}&tbm=isch`)}
                  startIcon={<i className="material-icons">photo_library</i>}
                  sx={{ borderRadius: '20px', fontSize: '12px' }}
                >
                  תמונות
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setEditedAttraction(activity);
                    setSelectedDay(dayData.day);
                    setSelectedActivityIndex(idx);
                    setEditModalOpen(true);
                  }}
                  startIcon={<i className="material-icons">edit</i>}
                  sx={{ 
                    borderRadius: '20px', 
                    fontSize: '12px',
                    marginLeft: 'auto'
                  }}
                >
                  ערוך
                </Button>
              </Box>
            </Paper>
          </Box>
        ))}
      </Box>
      
      {/* תצוגת מידע על המלון/לינה אם קיים - חדש! */}
      {dayData.accommodation && (
        <Paper sx={{ p: 2, mt: 3, bgcolor: '#f3e5f5', borderRadius: '8px', border: '1px solid #e1bee7' }}>
          <Typography variant="subtitle1" sx={{ 
            mb: 1, 
            fontWeight: 'bold', 
            display: 'flex', 
            alignItems: 'center',
            color: '#673ab7'
          }}>
            <i className="material-icons" style={{ marginRight: '8px' }}>hotel</i>
            לינה: {dayData.accommodation.name}
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2">{dayData.accommodation.description}</Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <i className="material-icons" style={{ fontSize: '16px', marginRight: '4px', color: '#666' }}>place</i>
              <Typography variant="body2" sx={{ color: '#666' }}>
                {dayData.accommodation.address}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <i className="material-icons" style={{ fontSize: '16px', marginRight: '4px', color: '#666' }}>euro</i>
              <Typography variant="body2" sx={{ color: '#666' }}>
                {dayData.accommodation.priceRange}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => window.open(`https://www.booking.com/search.he.html?ss=${encodeURIComponent(dayData.accommodation.name)}`)}
                startIcon={<i className="material-icons">book_online</i>}
                sx={{ borderRadius: '20px', fontSize: '12px' }}
              >
                הזמן
              </Button>
              
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const searchQuery = dayData.accommodation.googleMapsSearchQuery || 
                                    `${dayData.accommodation.name} ${dayData.accommodation.address || dayData.location || ''}`;
                  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`);
                }}
                startIcon={<i className="material-icons">directions</i>}
                sx={{ borderRadius: '20px', fontSize: '12px' }}
              >
                נווט
              </Button>
              
              <Button
                variant="outlined"
                size="small"
                onClick={() => window.open(`https://www.tripadvisor.com/Search?q=${encodeURIComponent(dayData.accommodation.name)}`)}
                startIcon={<i className="material-icons">star_rate</i>}
                sx={{ borderRadius: '20px', fontSize: '12px' }}
              >
                ביקורות
              </Button>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
};
// 2. שדרוג טופס העדפות - עם שדות נוספים
const PreferencesForm = () => {
  // הוספת משתני מצב חדשים למידע מפורט יותר
  const [foodPreferences, setFoodPreferences] = useState(userPreferences.advancedPreferences?.foodPreferences || '');
  const [travelPace, setTravelPace] = useState(userPreferences.advancedPreferences?.travelPace || 'medium');
  const [travelStyle, setTravelStyle] = useState(userPreferences.advancedPreferences?.travelStyle || 'mixed');
  const [hasChildren, setHasChildren] = useState(userPreferences.advancedPreferences?.hasChildren || false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [specialNeeds, setSpecialNeeds] = useState(userPreferences.advancedPreferences?.specialNeeds || '');
  
  // פונקציה לעדכון כל ההעדפות הנוספות בתוך userPreferences
  const updateAdvancedPreferences = () => {
    setUserPreferences(prev => ({ 
      ...prev, 
      advancedPreferences: {
        foodPreferences,
        travelPace,
        travelStyle,
        hasChildren,
        specialNeeds
      } 
    }));
  };
  
  // בעיה - מחקנו את ה-useEffect שהיה כאן קודם
  // שגרם ללולאה אינסופית של עדכוני state
  
  const handlePlanTrip = () => {
    // עדכון מפורש של ההעדפות המתקדמות לפני תכנון הטיול
    updateAdvancedPreferences();
    planTripWithAI();
  };
  
  return (
    <Box mt={2} sx={{ backgroundColor: '#f0f0f0', p: 2, borderRadius: '8px' }} role="form" aria-label="טופס העדפות טיול">
      <Typography variant="h6" sx={{ 
        color: '#2c3e50', 
        fontWeight: 'bold', 
        mb: 1,
        display: 'flex',
        alignItems: 'center'
      }} role="heading" aria-level="2">
        <i className="material-icons" style={{ marginRight: '8px' }}>tune</i>
        הגדר את העדפות הטיול שלך
      </Typography>
      
      {/* שדות בסיסיים */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          id="location"
          name="location"
          label="יעד הטיול"
          value={userPreferences.location}
          onChange={(e) => setUserPreferences(prev => ({ ...prev, location: e.target.value }))}
          sx={{ mt: 1 }}
          aria-label="יעד הטיול"
        />
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <TextField
            id="days"
            name="days"
            label="מספר ימים"
            type="number"
            value={userPreferences.days}
            onChange={(e) => setUserPreferences(prev => ({ ...prev, days: parseInt(e.target.value) || 1 }))}
            sx={{ flex: 1 }}
            aria-label="מספר ימי הטיול"
          />
          <TextField
            id="startDate"
            name="startDate"
            label="תאריך התחלה"
            type="date"
            value={userPreferences.startDate}
            onChange={(e) => setUserPreferences(prev => ({ ...prev, startDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1 }}
            aria-label="תאריך התחלת הטיול"
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <FormControl fullWidth sx={{ flex: 1 }}>
            <InputLabel>תקציב</InputLabel>
            <Select
              id="budget"
              value={userPreferences.budget}
              onChange={(e) => setUserPreferences(prev => ({ ...prev, budget: e.target.value }))}
              label="תקציב"
            >
              <MenuItem value="low">נמוך - חסכוני</MenuItem>
              <MenuItem value="medium">בינוני</MenuItem>
              <MenuItem value="high">גבוה - יוקרתי</MenuItem>
            </Select>
          </FormControl>
          <Button 
            variant="outlined" 
            color="primary"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            sx={{ 
              flex: 1, 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: 1
            }}
          >
            {showAdvancedOptions ? (
              <>
                <i className="material-icons">expand_less</i>
                פחות אפשרויות
              </>
            ) : (
              <>
                <i className="material-icons">expand_more</i>
                יותר אפשרויות
              </>
            )}
          </Button>
        </Box>
      </Box>
      
      {/* הגדרות מתקדמות */}
      {showAdvancedOptions && (
        <Box sx={{ mt: 2, p: 2, bgcolor: '#e0e0e0', borderRadius: '8px' }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
            העדפות מתקדמות
          </Typography>
          
          <TextField
            fullWidth
            id="foodPreferences"
            name="foodPreferences"
            label="העדפות אוכל (למשל: צמחוני, כשר, ללא גלוטן)"
            value={foodPreferences}
            onChange={(e) => setFoodPreferences(e.target.value)}
            sx={{ mt: 1 }}
            aria-label="העדפות אוכל"
          />
          
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>סגנון הטיול</InputLabel>
            <Select
              value={travelStyle}
              onChange={(e) => setTravelStyle(e.target.value)}
              label="סגנון הטיול"
            >
              {travelStyles.map(style => (
                <MenuItem key={style.value} value={style.value}>{style.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>קצב הטיול</InputLabel>
            <Select
              value={travelPace}
              onChange={(e) => setTravelPace(e.target.value)}
              label="קצב הטיול"
            >
              {paceLevels.map(pace => (
                <MenuItem key={pace.value} value={pace.value}>{pace.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={hasChildren}
                onChange={(e) => setHasChildren(e.target.checked)}
                name="hasChildren"
                color="primary"
              />
            }
            label="כולל ילדים"
            sx={{ mt: 1, display: 'block' }}
          />
          
          <TextField
            fullWidth
            id="specialNeeds"
            name="specialNeeds"
            label="צרכים מיוחדים או בקשות נוספות"
            value={specialNeeds}
            onChange={(e) => setSpecialNeeds(e.target.value)}
            multiline
            rows={2}
            sx={{ mt: 1 }}
            aria-label="צרכים מיוחדים"
          />
          
          <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: '#666' }}>
            הגדרות אלו יעזרו לתכנן את הטיול בצורה מותאמת יותר לצרכים שלך
          </Typography>
        </Box>
      )}
      
      <TextField
        fullWidth
        id="themes"
        name="themes"
        label="נושאי עניין (למשל, טבע, יקבים, קולינריה - מפריד עם פסיק)"
        value={userPreferences.themes.join(', ')}
        onChange={(e) => setUserPreferences(prev => ({ ...prev, themes: e.target.value.split(', ').map(t => t.trim()) }))}
        sx={{ mt: 2 }}
        aria-label="נושאי הטיול"
      />
      
<Button 
  variant="contained" 
  color="primary" 
  onClick={handlePlanTrip}
  startIcon={<i className="material-icons">travel_explore</i>}
  sx={{ 
    mt: 2, 
    background: '#4CAF50', 
    color: '#fff', 
    borderRadius: '8px', 
    padding: '10px 20px',
    '&:hover': { background: '#388E3C' } 
  }} 
  aria-label="תכנן טיול עם AI"
>
  תכנן טיול מפורט עם AI
</Button>
<RoadTripButton />
</Box>
  );
};
// כפתור תכנון טיול מתגלגל - הוסף אותו ליד כפתור תכנון הטיול הרגיל
const RoadTripButton = () => (
  <Button 
    variant="contained" 
    color="secondary" 
    onClick={planRoadTrip}
    startIcon={<i className="material-icons">explore</i>}
    sx={{ 
      mt: 2, 
      ml: 2,
      background: '#9C27B0', 
      color: '#fff', 
      borderRadius: '8px', 
      padding: '10px 20px',
      '&:hover': { background: '#7B1FA2' } 
    }} 
    aria-label="תכנן טיול מתגלגל לאורך המסלול"
  >
    תכנן טיול מתגלגל לאורך המסלול
  </Button>
);

// רכיב תצוגת מידע על טיול מתגלגל
const RoadTripInfo = () => {
  // אם אין מידע על טיול מתגלגל, לא מציגים כלום
  if (!tripPlan.isRoadTrip) return null;
  
  return (
    <Paper sx={{ mt: 2, p: 2, bgcolor: '#e8f5fe', borderRadius: '8px', boxShadow: 1 }}>
      <Typography variant="h6" sx={{ 
        color: '#0277bd', 
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        mb: 2
      }}>
        <i className="material-icons" style={{ marginRight: '8px' }}>alt_route</i>
        פרטי הטיול המתגלגל
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 1 }}>
        טיול מתגלגל מ-<strong>{startPoint}</strong> ל-<strong>{endPoint}</strong>
      </Typography>
      
      <Typography variant="subtitle2" sx={{ mt: 1, mb: 1, fontWeight: 'bold' }}>
        תחנות לאורך המסלול:
      </Typography>
      
      <Box sx={{ ml: 2 }}>
        {tripPlan.routeStops && tripPlan.routeStops.map((stop, index) => (
          <Box key={index} sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 1,
            p: 1,
            borderRadius: '4px',
            bgcolor: '#ffffff'
          }}>
            <Box sx={{ 
              width: 24, 
              height: 24, 
              borderRadius: '50%', 
              bgcolor: getStopColor(index), 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1,
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              {index + 1}
            </Box>
            <Typography variant="body2" sx={{ flex: 1 }}>{stop}</Typography>
            <Typography variant="body2" sx={{ 
              color: '#0277bd', 
              fontWeight: 'bold',
              borderRadius: '4px',
              px: 1
            }}>
              {tripPlan.daysPerStop ? `${tripPlan.daysPerStop[index]} ימים` : ''}
            </Typography>
          </Box>
        ))}
      </Box>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Button 
          variant="outlined" 
          color="primary"
          startIcon={<i className="material-icons">map</i>}
          onClick={() => window.scrollTo({
            top: document.querySelector('.gm-style')?.getBoundingClientRect().top + window.pageYOffset - 100,
            behavior: 'smooth'
          })}
        >
          הצג במפה
        </Button>
      </Box>
    </Paper>
  );
};

// פונקציית עזר לבחירת צבע התחנה
const getStopColor = (index) => {
  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000'];
  return colors[index % colors.length];
};

const TripDayWithStopIndicator = ({ day }) => {
  // אם זה טיול מתגלגל ויש מידע על stopIndex, מציגים אינדיקטור
  const hasStopInfo = tripPlan.isRoadTrip && day.stopIndex !== undefined;
  
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center',
      gap: 1
    }}>
      {hasStopInfo && (
        <Box sx={{ 
          width: 20, 
          height: 20, 
          borderRadius: '50%', 
          bgcolor: getStopColor(day.stopIndex),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          {day.stopIndex + 1}
        </Box>
      )}
      <Typography variant="h6" sx={{ 
        color: '#2c3e50', 
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center'
      }}>
        <i className="material-icons" style={{ marginRight: '8px' }}>event</i>
        יום {day.day}: {day.date || ''} {day.summary ? `- ${day.summary}` : ''}
      </Typography>
    </Box>
  );
};

  // 4. עדכון רכיב תכנון הטיול - משתמש ברכיב הטיימליין החדש
  const TripPlanner = () => {
    // הוספת משתנה מצב לתצוגת תצוגה מרוכזת/מפוצלת
    const [viewMode, setViewMode] = useState('detailed'); // 'detailed', 'compact'
    
    // הוספת משתנה מצב ליום הנבחר
    const [expandedDay, setExpandedDay] = useState(null);
    
    // פונקציה לטיפול בפתיחת/סגירת יום
    const handleDayToggle = (dayNum) => {
      if (expandedDay === dayNum) {
        setExpandedDay(null);
      } else {
        setExpandedDay(dayNum);
      }
    };
    
    return (
      <Box mt={2} role="region" aria-label="תכנון טיול">
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}>
          <Typography variant="h5" sx={{ 
            color: '#2c3e50', 
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center' 
          }}>
            <i className="material-icons" style={{ marginRight: '8px' }}>map</i>
            תכנון טיול ל{userPreferences.location ? `-${userPreferences.location}` : ''}
          </Typography>
          
          {/* כפתורי תצוגה */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={viewMode === 'detailed' ? 'contained' : 'outlined'}
              color="primary"
              size="small"
              onClick={() => setViewMode('detailed')}
              startIcon={<i className="material-icons">view_agenda</i>}
              sx={{ borderRadius: '8px' }}
            >
              תצוגה מפורטת
            </Button>
            <Button
              variant={viewMode === 'compact' ? 'contained' : 'outlined'}
              color="primary"
              size="small"
              onClick={() => setViewMode('compact')}
              startIcon={<i className="material-icons">view_list</i>}
              sx={{ borderRadius: '8px' }}
            >
              תצוגה מרוכזת
            </Button>
          </Box>
        </Box>
        {tripPlan.isRoadTrip && <RoadTripInfo />}

        <RouteInfo />
        {/* הוספת קומפוננט מזג אוויר */}
<Paper sx={{ p: 2, mt: 1, mb: 1, bgcolor: '#f9f9f9', borderRadius: '8px', boxShadow: 1 }}>
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
  <WeatherWidget location={userPreferences.location} />
</Paper>

        {/* השוואת מחירים */}
        <Paper elevation={3} sx={{ 
          p: 3, 
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          mb: 3
        }}>
          <Typography variant="h6" sx={{ 
            display: 'flex',
            alignItems: 'center',
            mb: 2,
            fontWeight: 'bold'
          }}>
            <i className="material-icons" style={{ marginRight: '8px' }}>attach_money</i>
            �� השוואת מחירים
          </Typography>
          <PriceComparison 
            origin="תל אביב"
            destination={userPreferences.location}
            dates={{
              startDate: userPreferences.startDate,
              endDate: new Date(new Date(userPreferences.startDate).getTime() + userPreferences.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }}
          />
        </Paper>

        {tripPlan.dailyItinerary.length > 0 ? (
          viewMode === 'detailed' ? (
            // תצוגה מפורטת - תצוגת לוח זמנים מלאה
            tripPlan.dailyItinerary.map((day) => (
              <Paper 
                key={day.day} 
                sx={{ 
                  p: 2, 
                  mt: 1, 
                  mb: 1, 
                  bgcolor: '#f9f9f9', 
                  borderRadius: '8px', 
                  boxShadow: 1,
                  border: day.day === expandedDay ? '2px solid #4CAF50' : '1px solid #e0e0e0'
                }} 
                role="article" 
                aria-label={`יום טיול ${day.day}`}
              >
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  mb: expandedDay === day.day ? 2 : 0,
                  pb: expandedDay === day.day ? 1 : 0,
                  borderBottom: expandedDay === day.day ? '1px dashed #e0e0e0' : 'none'
                }} onClick={() => handleDayToggle(day.day)}>
                  <Typography variant="h6" sx={{ 
                    color: '#2c3e50', 
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <i className="material-icons" style={{ marginRight: '8px' }}>event</i>
                    יום {day.day}: {day.date || ''} {day.summary ? `- ${day.summary}` : ''}
                  </Typography>
                  <Box>
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDayToggle(day.day);
                      }}
                    >
                      <i className="material-icons">
                        {expandedDay === day.day ? 'expand_less' : 'expand_more'}
                      </i>
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        addActivityToDay(day.day - 1);
                      }}
                    >
                      <i className="material-icons">add_circle_outline</i>
                    </IconButton>
                  </Box>
                </Box>
                
                {/* תוכן היום - מוצג רק אם היום הנבחר או אם אין יום נבחר */}
                {(expandedDay === day.day || expandedDay === null) && (
                  <DailyTimeline dayData={day} />
                )}
              </Paper>
            ))
          ) : (
            // תצוגה מרוכזת - רק כותרות וסיכום
            <Paper sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: '8px', boxShadow: 1 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                סיכום {tripPlan.dailyItinerary.length} ימי טיול ב{userPreferences.location}
              </Typography>
              
              <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>יום</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>תאריך</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>סיכום</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>פעילויות</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>פעולות</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tripPlan.dailyItinerary.map((day) => (
                      <TableRow key={day.day} hover>
                        <TableCell>{day.day}</TableCell>
                        <TableCell>{day.date || '-'}</TableCell>
                        <TableCell>{day.summary || 'יום טיול'}</TableCell>
                        <TableCell>{day.schedule ? day.schedule.length : 0} פעילויות</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton size="small" onClick={() => handleDayToggle(day.day)}>
                              <i className="material-icons" style={{ fontSize: '18px' }}>visibility</i>
                            </IconButton>
                            <IconButton size="small" onClick={() => addActivityToDay(day.day - 1)}>
                              <i className="material-icons" style={{ fontSize: '18px' }}>add_circle_outline</i>
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {expandedDay && (
                <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    פירוט יום {expandedDay}
                    <IconButton size="small" onClick={() => setExpandedDay(null)}>
                      <i className="material-icons">close</i>
                    </IconButton>
                  </Typography>
                  <DailyTimeline dayData={tripPlan.dailyItinerary[expandedDay - 1]} />
                </Box>
              )}
            </Paper>
          )
        ) : (
          <Typography variant="body2" sx={{ color: '#666' }}>
            אין תכנון זמין. נסה לחפש מסלול או להשתמש ב-AI לתכנון.
          </Typography>
        )}
      </Box>
    );
  };

  <Paper elevation={6} sx={{ p: 3, m: '20px auto', maxWidth: '900px', bgcolor: '#ffffff', borderRadius: '16px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' }}>
  <Typography variant="h4" align="center" gutterBottom sx={{ 
    color: '#2c3e50', 
    fontWeight: 'bold', 
    mb: 2
  }}>
    שירותי נסיעות
  </Typography>
  <TravelServicesTab 
  startPoint={startPoint}
  endPoint={endPoint}
  userPreferences={userPreferences}
/>
<Paper elevation={3} sx={{ p: 3, m: '20px auto', maxWidth: '900px', bgcolor: '#ffffff', borderRadius: '16px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' }}>
  <TravelServicesTab 
    startPoint={startPoint}
    endPoint={endPoint}
    userPreferences={userPreferences}
  />
</Paper>

  <Tabs 
    value={activeTab} 
    onChange={(e, newValue) => setActiveTab(newValue)}
    variant="fullWidth"
    sx={{ mb: 3 }}
  >
    <Tab label="טיסות" icon={<FlightIcon />} />
    <Tab label="מלונות" icon={<HotelIcon />} />
    <Tab label="השכרת רכב" icon={<DriveEtaIcon />} />
  </Tabs>
  
  {activeTab === 0 && (
    <FlightSearch 
      origin={startPoint || "תל אביב"} 
      location={endPoint}
    />
  )}
  
  {activeTab === 1 && (
    <HotelSearch 
      location={endPoint || userPreferences.location}
    />
  )}
  
  {activeTab === 2 && (
    <CarRentalSearch 
      location={endPoint || userPreferences.location}
    />
  )}
</Paper>
  const RouteInfo = () => (
    <Box sx={{ mt: 2, p: 2, bgcolor: '#f0f0f0', borderRadius: '8px', boxShadow: 1 }} role="region" aria-label="פרטי מסלול">
      <Typography variant="subtitle1" sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
        פרטי המסלול:
      </Typography>
      <Typography variant="body2" sx={{ color: '#666' }}>
        מרחק: {routeInfo.distance || 'לא זמין'} | זמן נסיעה: {routeInfo.duration || 'לא זמין'}
      </Typography>
    </Box>
  );
// 7. הוספת אפשרות ניווט לנקודות המסלול
const RouteNavigationButtons = () => {
  const navigateToPoint = (address) => {
    window.open(`https://www.google.com/maps/dir/?api=1&location=${encodeURIComponent(address)}`);
  };
  
  const navigateWithWaze = (address) => {
    window.open(`https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`);
  };
  
  return (
    <Box sx={{ mt: 2, p: 2, bgcolor: '#f0f8ff', borderRadius: '8px', boxShadow: 1 }}>
      <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
        <i className="material-icons" style={{ marginRight: '8px' }}>directions</i>
        ניווט למסלול
      </Typography>
      
      <Typography variant="body2" sx={{ mb: 1 }}>
        בחר נקודה לניווט:
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {startPoint && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: '#e6f2ff', borderRadius: '4px' }}>
            <Typography variant="body2">
              נקודת התחלה: {startPoint}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" 
                color="primary" 
                size="small" 
                onClick={() => navigateToPoint(startPoint)}
                startIcon={<i className="material-icons">map</i>}
              >
                Google Maps
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                size="small" 
                onClick={() => navigateWithWaze(startPoint)}
                startIcon={<span style={{ fontWeight: 'bold' }}>W</span>}
              >
                Waze
              </Button>
            </Box>
          </Box>
        )}
        
        {waypoints.map((waypoint, index) => (
          <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: '#e6f2ff', borderRadius: '4px' }}>
            <Typography variant="body2">
              נקודת ביניים {index + 1}: {waypoint}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" 
                color="primary" 
                size="small" 
                onClick={() => navigateToPoint(waypoint)}
                startIcon={<i className="material-icons">map</i>}
              >
                Google Maps
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                size="small" 
                onClick={() => navigateWithWaze(waypoint)}
                startIcon={<span style={{ fontWeight: 'bold' }}>W</span>}
              >
                Waze
              </Button>
            </Box>
          </Box>
        ))}
        
        {endPoint && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: '#e6f2ff', borderRadius: '4px' }}>
            <Typography variant="body2">
              נקודת יעד: {endPoint}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" 
                color="primary" 
                size="small" 
                onClick={() => navigateToPoint(endPoint)}
                startIcon={<i className="material-icons">map</i>}
              >
                Google Maps
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                size="small" 
                onClick={() => navigateWithWaze(endPoint)}
                startIcon={<span style={{ fontWeight: 'bold' }}>W</span>}
              >
                Waze
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

// 3. שדרוג רכיב תכנון מלונות עם קישורים לאתרי הזמנת מלונות
const AccommodationPlanner = () => {
  return (
    <Box sx={{ mt: 3, mb: 2 }}>
      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
        <i className="material-icons" style={{ marginRight: '8px' }}>hotel</i>
        תכנון לינה לאורך המסלול
      </Typography>
      
      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {accommodations.map((hotel, index) => (
          <Paper key={index} sx={{ p: 2, borderRadius: '8px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1">{hotel.name}</Typography>
                <Typography variant="body2">{hotel.address}</Typography>
                <Typography variant="body2">
                  <strong>תאריכים:</strong> {hotel.checkIn} עד {hotel.checkOut}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={<i className="material-icons">directions</i>}
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&location=${encodeURIComponent(hotel.address)}`)}
                >
                  נווט
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="primary"
                  startIcon={<i className="material-icons">bookmark</i>}
                  onClick={() => window.open(`https://www.booking.com/search.he.html?ss=${encodeURIComponent(hotel.address)}`)}
                >
                  הזמן
                </Button>
              </Box>
            </Box>
          </Paper>
        ))}
        
        <Button 
          variant="outlined" 
          startIcon={<i className="material-icons">add_circle</i>}
          onClick={() => setHotelModalOpen(true)}
        >
          הוסף מלון למסלול
        </Button>
      </Box>
    </Box>
  );
};

// 4. שיפור חלונית המלונות עם קישורים לאתרי הזמנות
const HotelModal = () => {
  const [hotel, setHotel] = useState({
    name: '',
    address: '',
    checkIn: '',
    checkOut: '',
    notes: ''
  });
  
  const [bookingSites, setBookingSites] = useState({
    booking: true,
    hotels: true,
    airbnb: false,
    expedia: false
  });
  
  const handleSave = () => {
    setAccommodations([...accommodations, hotel]);
    setHotelModalOpen(false);
    setHotel({ name: '', address: '', checkIn: '', checkOut: '', notes: '' });
  };
  
  const searchHotel = (site) => {
    const query = encodeURIComponent(`${hotel.name || ''} ${hotel.address || userPreferences.location}`);
    let url = '';
    
    switch(site) {
      case 'booking':
        url = `https://www.booking.com/search.he.html?ss=${query}`;
        break;
      case 'hotels':
        url = `https://he.hotels.com/search.do?q-location=${query}`;
        break;
      case 'airbnb':
        url = `https://www.airbnb.com/s/${query}/homes`;
        break;
      case 'expedia':
        url = `https://www.expedia.com/Hotel-Search?location=${query}`;
        break;
      default:
        url = `https://www.booking.com/search.he.html?ss=${query}`;
    }
    
    window.open(url, '_blank');
  };
  
  return (
    <Modal open={hotelModalOpen} onClose={() => setHotelModalOpen(false)}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '500px',
        bgcolor: 'background.paper',
        borderRadius: '8px',
        boxShadow: 24,
        p: 4,
      }}>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
          הוספת מלון למסלול
        </Typography>
        
        <TextField
          fullWidth
          label="שם המלון"
          value={hotel.name}
          onChange={(e) => setHotel({ ...hotel, name: e.target.value })}
          sx={{ mb: 2 }}
        />
        
        <TextField
          fullWidth
          label="כתובת"
          value={hotel.address}
          onChange={(e) => setHotel({ ...hotel, address: e.target.value })}
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="תאריך צ׳ק-אין"
            type="date"
            value={hotel.checkIn}
            onChange={(e) => setHotel({ ...hotel, checkIn: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1 }}
          />
          
          <TextField
            label="תאריך צ׳ק-אאוט"
            type="date"
            value={hotel.checkOut}
            onChange={(e) => setHotel({ ...hotel, checkOut: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1 }}
          />
        </Box>
        
        <TextField
          fullWidth
          multiline
          rows={3}
          label="הערות"
          value={hotel.notes}
          onChange={(e) => setHotel({ ...hotel, notes: e.target.value })}
          sx={{ mb: 3 }}
        />
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            חפש מלון באתרי הזמנות:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Button 
              variant="outlined"
              onClick={() => searchHotel('booking')}
              startIcon={<i className="material-icons">hotel</i>}
            >
              Booking.com
            </Button>
            <Button 
              variant="outlined"
              onClick={() => searchHotel('hotels')}
              startIcon={<i className="material-icons">business</i>}
            >
              Hotels.com
            </Button>
            <Button 
              variant="outlined"
              onClick={() => searchHotel('airbnb')}
              startIcon={<i className="material-icons">home</i>}
            >
              Airbnb
            </Button>
            <Button 
              variant="outlined"
              onClick={() => searchHotel('expedia')}
              startIcon={<i className="material-icons">flight_takeoff</i>}
            >
              Expedia
            </Button>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={() => setHotelModalOpen(false)}>בטל</Button>
          <Button 
            variant="contained" 
            onClick={handleSave}
            disabled={!hotel.name || !hotel.address}
          >
            שמור
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

// 5. תיקון בעיית ההקלדה בטופס העריכה - שימוש בשיטות React מתקדמות יותר
const EditAttractionModal = () => {
  // שימוש במצבים נפרדים לכל שדה במקום אובייקט אחד - למניעת רינדור מחדש של כל הקומפוננטה
  const [activityTime, setActivityTime] = useState('');
  const [activityName, setActivityName] = useState('');
  const [activityCategory, setActivityCategory] = useState('');
  const [activityAddress, setActivityAddress] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [activityOpeningHours, setActivityOpeningHours] = useState('');
  const [activityTips, setActivityTips] = useState('');
  const [activityDuration, setActivityDuration] = useState('');
  const [activityPrice, setActivityPrice] = useState('');
  const [activityReservation, setActivityReservation] = useState(false);
  
  // הגדרת שדות הקלט המצויים בטופס
  const activityTypes = [
    { value: 'breakfast', label: 'ארוחת בוקר' },
    { value: 'lunch', label: 'ארוחת צהריים' },
    { value: 'dinner', label: 'ארוחת ערב' },
    { value: 'attraction', label: 'אטרקציה' },
    { value: 'museum', label: 'מוזיאון' },
    { value: 'tour', label: 'סיור' },
    { value: 'activity', label: 'פעילות' },
    { value: 'shopping', label: 'קניות' },
    { value: 'accommodation', label: 'לינה' },
    { value: 'transport', label: 'תחבורה' },
  ];
  
  // עדכון הערכים בפתיחת החלון
  useEffect(() => {
    if (editModalOpen && editedAttraction) {
      setActivityTime(editedAttraction.timeStart || editedAttraction.time || '');
      setActivityName(editedAttraction.name || '');
      setActivityCategory(editedAttraction.category || '');
      setActivityAddress(editedAttraction.address || '');
      setActivityDescription(editedAttraction.description || '');
      setActivityOpeningHours(editedAttraction.openingHours || '');
      setActivityTips(editedAttraction.tips || '');
      setActivityDuration(editedAttraction.recommendedDuration || '');
      setActivityPrice(editedAttraction.entranceFee || editedAttraction.priceRange || '');
      setActivityReservation(editedAttraction.reservationNeeded || false);
    }
  }, [editModalOpen, editedAttraction]);
  
  // שמירה - מאחדת את כל השדות חזרה לאובייקט אחד
  const handleSave = () => {
    const updatedAttraction = {
      ...editedAttraction,
      time: activityTime,
      timeStart: activityTime,
      name: activityName,
      category: activityCategory,
      address: activityAddress,
      description: activityDescription,
      openingHours: activityOpeningHours,
      tips: activityTips,
      recommendedDuration: activityDuration,
      entranceFee: activityPrice,
      reservationNeeded: activityReservation
    };
    
    // האם זו פעילות מזון? אם כן, נעדכן את ה-priceRange במקום ה-entranceFee
    if (['breakfast', 'lunch', 'dinner'].includes(activityCategory)) {
      updatedAttraction.priceRange = activityPrice;
      delete updatedAttraction.entranceFee;
    }
    
    // קוראים לפונקציית השמירה המקורית
    if (selectedDay && selectedActivityIndex !== null) {
      const updatedItinerary = [...tripPlan.dailyItinerary];
      const dayIndex = selectedDay - 1;
      updatedItinerary[dayIndex] = {
        ...updatedItinerary[dayIndex],
        schedule: updatedItinerary[dayIndex].schedule.map((activity, index) =>
          index === selectedActivityIndex ? updatedAttraction : activity
        ),
      };
      setTripPlan(prev => ({ ...prev, dailyItinerary: updatedItinerary }));
      setEditModalOpen(false);
    }
  };
  
  // איפוס שדות בעת סגירת החלון
  const handleClose = () => {
    setEditModalOpen(false);
  };
  
  return (
    <Modal
      open={editModalOpen}
      onClose={handleClose}
      aria-labelledby="edit-attraction-modal-title"
      aria-describedby="edit-attraction-modal-description"
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '600px',
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 3,
        borderRadius: '12px',
        maxHeight: '80vh',
        overflow: 'auto'
      }} role="dialog" aria-label="עריכת פעילות">
        <Typography id="edit-attraction-modal-title" variant="h6" sx={{ 
          color: '#2c3e50', 
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          mb: 2,
          borderBottom: '2px solid #e0e0e0',
          paddingBottom: '8px'
        }} role="heading" aria-level="1">
          <i className="material-icons" style={{ marginRight: '8px' }}>edit</i>
          עריכת פעילות
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
            הכנס את פרטי הפעילות:
          </Typography>
          
          <Grid container spacing={2}>
            {/* שורה ראשונה - סוג פעילות וזמן */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>סוג פעילות</InputLabel>
                <Select
                  value={activityCategory}
                  onChange={(e) => setActivityCategory(e.target.value)}
                  label="סוג פעילות"
                  MenuProps={{ style: { zIndex: 9999 } }}
                >
                  {activityTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="זמן (למשל, 10:00-12:00)"
                value={activityTime}
                onChange={(e) => setActivityTime(e.target.value)}
                aria-label="זמן הפעילות"
              />
            </Grid>
            
            {/* שם ומיקום */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="שם הפעילות"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                aria-label="שם הפעילות"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="כתובת"
                value={activityAddress}
                onChange={(e) => setActivityAddress(e.target.value)}
                aria-label="כתובת הפעילות"
              />
            </Grid>
            
            {/* פרטים נוספים */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="שעות פתיחה"
                value={activityOpeningHours}
                onChange={(e) => setActivityOpeningHours(e.target.value)}
                aria-label="שעות פתיחה של הפעילות"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={activityCategory && ['breakfast', 'lunch', 'dinner'].includes(activityCategory) ? 
                  "טווח מחירים (€, €€, €€€)" : 
                  "מחיר כניסה"}
                value={activityPrice}
                onChange={(e) => setActivityPrice(e.target.value)}
                aria-label="מחיר"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="משך זמן מומלץ"
                value={activityDuration}
                onChange={(e) => setActivityDuration(e.target.value)}
                aria-label="משך זמן מומלץ לפעילות"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={activityReservation}
                    onChange={(e) => setActivityReservation(e.target.checked)}
                    color="primary"
                  />
                }
                label="נדרשת הזמנה מראש"
              />
            </Grid>
            
            {/* תיאור וטיפים */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="תיאור מפורט"
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
                multiline
                rows={3}
                aria-label="תיאור הפעילות"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="טיפים למבקרים"
                value={activityTips}
                onChange={(e) => setActivityTips(e.target.value)}
                multiline
                rows={2}
                aria-label="טיפים למבקרים בפעילות"
              />
            </Grid>
          </Grid>
        </Box>
        
        {/* כפתורי מידע נוסף */}
        <Box sx={{ mt: 2, mb: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            מידע נוסף:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(activityName + ' ' + userPreferences.location)}`)}
              startIcon={<i className="material-icons">search</i>}
              sx={{ borderRadius: '8px' }}
            >
              חפש בגוגל
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => window.open(`https://www.tripadvisor.com/Search?q=${encodeURIComponent(activityName + ' ' + userPreferences.location)}`)}
              startIcon={<i className="material-icons">star</i>}
              sx={{ borderRadius: '8px' }}
            >
              ביקורות TripAdvisor
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activityAddress || activityName + ' ' + userPreferences.location)}`)}
              startIcon={<i className="material-icons">place</i>}
              sx={{ borderRadius: '8px' }}
            >
              הצג במפה
            </Button>
          </Box>
        </Box>
        
        {/* כפתורי שמירה וביטול */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: 2, 
          mt: 3, 
          pt: 2,
          borderTop: '1px solid #e0e0e0'
        }} role="group" aria-label="פעולות שמירה וביטול">
          <Button 
            variant="contained" 
            onClick={handleSave} 
            startIcon={<i className="material-icons">save</i>}
            sx={{ 
              background: '#4CAF50', 
              color: '#fff', 
              borderRadius: '8px', 
              '&:hover': { background: '#388E3C' }
            }} 
            aria-label="שמור פעילות"
          >
            שמור
          </Button>
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={handleClose} 
            startIcon={<i className="material-icons">cancel</i>}
            sx={{ borderRadius: '8px' }} 
            aria-label="בטל עריכת פעילות"
          >
            בטל
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

const shareUrl = `https://yourtripplandomain.com/trip?id=${Date.now()}`;

const ShareButtons = () => (
  <Box mt={2} role="group" aria-label="שתף מסלול">
    <Typography variant="h5" sx={{ color: '#2c3e50', fontWeight: 'bold' }} role="heading" aria-level="2">
      שתף מסלול
    </Typography>
    <Box sx={{ display: 'flex', gap: 1 }}>
      <FacebookShareButton url={shareUrl} quote={`בוא לראות את המסלול שלי: ${startPoint} -> ${endPoint}`} hashtag="#TripPlanner">
        <Box
          component="span"
          sx={{
            display: 'inline-block',
            padding: '8px 16px',
            background: '#1877F2',
            color: '#fff',
            borderRadius: '8px',
            cursor: 'pointer',
            '&:hover': { background: '#1557B0' },
          }}
          aria-label="שתף ב-Facebook"
        >
          שתף ב-Facebook
        </Box>
      </FacebookShareButton>
      <TwitterShareButton url={shareUrl} title={`בוא לראות את המסלול שלי: ${startPoint} -> ${endPoint}`} hashtags={['TripPlanner']}>
        <Box
          component="span"
          sx={{
            display: 'inline-block',
            padding: '8px 16px',
            background: '#1DA1F2',
            color: '#fff',
            borderRadius: '8px',
            cursor: 'pointer',
            '&:hover': { background: '#0D8BD7' },
          }}
          aria-label="שתף ב-Twitter"
        >
          שתף ב-Twitter
        </Box>
      </TwitterShareButton>
      <EmailShareButton url={shareUrl} subject="מסלול טיול מדהים!" body={`בוא לראות את המסלול שלי: ${startPoint} -> ${endPoint}\nקישור: ${shareUrl}`}>
        <Box
          component="span"
          sx={{
            display: 'inline-block',
            padding: '8px 16px',
            background: '#D44638',
            color: '#fff',
            borderRadius: '8px',
            cursor: 'pointer',
            '&:hover': { background: '#B02F2A' },
          }}
          aria-label="שתף במייל"
        >
          שתף במייל
        </Box>
      </EmailShareButton>
    </Box>
  </Box>
);

const InviteButton = () => {
  const [open, setOpen] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleInvite = () => {
    const inviteLink = `https://yourtripplandomain.com/invite/${uuidv4()}`;
    const message = `הזמן חבר לטיול שלך! קישור: ${inviteLink}\nהעתק את הקישור ושלח לחברים.`;
    if (friendEmail) {
      alert(`הזמנה נשלחה ל-${friendEmail} עם הקישור: ${inviteLink}`);
      navigator.clipboard.writeText(inviteLink).then(() => {
        alert('הקישור הועתק ללוח!');
      }).catch(err => {
        console.error('נכשל להעתיק קישור הזמנה:', err);
      });
    } else {
      alert(message);
      navigator.clipboard.writeText(inviteLink).then(() => {
        alert('הקישור הועתק ללוח!');
      }).catch(err => {
        console.error('נכשל להעתיק קישור הזמנה:', err);
      });
    }
    handleClose();
  };

  return (
    <Box sx={{ mt: 2 }} role="group" aria-label="הזמן חבר">
      <Button variant="contained" color="primary" onClick={handleOpen} sx={{ background: '#4CAF50', color: '#fff', borderRadius: '8px', '&:hover': { background: '#388E3C' } }} aria-label="הזמן חבר לטיול">
        הזמן חבר
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="invite-modal-title"
        aria-describedby="invite-modal-description"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          border: '2px solid #000',
          boxShadow: 24,
          p: 3,
          borderRadius: '12px',
        }} role="dialog" aria-label="חלון הזמנת חבר">
          <Typography id="invite-modal-title" variant="h6" sx={{ color: '#2c3e50', fontWeight: 'bold' }} role="heading" aria-level="1">
            הזמן חבר לטיול
          </Typography>
          <Typography id="invite-modal-description" sx={{ mt: 2, color: '#666' }}>
            הכנס את כתובת האימייל של החבר או העתק את הקישור:
          </Typography>
          <TextField
            fullWidth
            id="friendEmail"
            name="friendEmail"
            label="כתובת אימייל של החבר"
            value={friendEmail}
            onChange={(e) => setFriendEmail(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
            aria-label="כתובת אימייל של החבר"
          />
          <Box sx={{ display: 'flex', gap: 2 }} role="group" aria-label="פעולות הזמנה">
            <Button variant="contained" color="primary" onClick={handleInvite} sx={{ background: '#4CAF50', color: '#fff', borderRadius: '8px', '&:hover': { background: '#388E3C' } }} aria-label="שלח הזמנה">
              שלח הזמנה
            </Button>
            <Button variant="outlined" color="secondary" onClick={handleClose} sx={{ borderRadius: '8px' }} aria-label="בטל הזמנה">
              בטל
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

  // חשוב מאוד - זהו ה-return הראשי של הרכיב App
  return (
    <ErrorBoundary>     
        <TripSaveProvider>
        <UserPreferencesProvider>
          <TripProvider>
          <div className="app" style={{ background: '#f5f5f5', padding: '20px', fontFamily: 'Roboto, Arial, sans-serif' }} role="main" aria-label="אפליקציית תכנון טיולים">
            {/* רכיב Header שמכיל את הניווט לדפים השונים */}
            <Header />
            
            {/* רכיב הנתיבים החדש שיטפל בניתוב לדפים השונים */}
            <AppRoutes />
            
            <Paper elevation={6} sx={{ p: 3, m: '20px auto', maxWidth: '900px', bgcolor: '#ffffff', borderRadius: '16px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' }} role="region" aria-label="אזור תכנון טיולים">
              <Typography variant="h3" align="center" gutterBottom sx={{ 
                color: '#2c3e50', 
                fontWeight: 'bold', 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center' 
              }} role="heading" aria-level="1">
                <i className="material-icons" style={{ marginRight: '8px', fontSize: '36px' }}>explore</i>
                {userPreferences.location 
                  ? `המדריך האישי שלך ל${userPreferences.location}`
                  : 'המדריך האישי שלך לטיולים'}
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
              
              {/* תצוגת לשוניות ראשיות */}
              {mainTab === 'plan' && (
                <>
                  <Box display="flex" alignItems="center" sx={{ mb: 2 }} role="group" aria-label="חיפוש נקודות מסלול">
                    <TextField
                      fullWidth
                      id="startPoint"
                      name="startPoint"
                      label="נקודת ההתחלה"
                      value={startPoint}
                      onChange={(e) => setStartPoint(e.target.value)}
                      sx={{ mr: 1, borderRadius: '8px' }}
                      variant="outlined"
                      aria-label="נקודת ההתחלה של המסלול"
                    />
                    <IconButton onClick={searchRoute} color="primary" disabled={!startPoint || !endPoint} sx={{ background: '#4CAF50', color: '#fff', borderRadius: '8px' }} aria-label="חפש מסלול">
                      <AddIcon />
                    </IconButton>
                  </Box>
                  {waypoints.map((wp, index) => (
                    <Box key={index} display="flex" alignItems="center" sx={{ mb: 1 }} role="group" aria-label={`תחנה ביניים ${index + 1}`}>
                      <TextField
                        fullWidth
                        id={`waypoint-${index}`}
                        name={`waypoint-${index}`}
                        label={`תחנה ${index + 1}`}
                        value={wp}
                        onChange={(e) => {
                          const newWaypoints = [...waypoints];
                          newWaypoints[index] = e.target.value;
                          setWaypoints(newWaypoints);
                        }}
                        sx={{ mr: 1, borderRadius: '8px' }}
                        variant="outlined"
                        aria-label={`תחנה ביניים ${index + 1}`}
                      />
                      <IconButton onClick={() => setWaypoints(waypoints.filter((_, i) => i !== index))} color="secondary" sx={{ background: '#f44336', color: '#fff', borderRadius: '8px' }} aria-label={`הסר תחנה ביניים ${index + 1}`}>
                        <AddIcon sx={{ transform: 'rotate(45deg)' }} />
                      </IconButton>
                    </Box>
                  ))}
                  <Box display="flex" alignItems="center" sx={{ mb: 2 }} role="group" aria-label="הוספת תחנה ביניים">
                    <TextField
                      fullWidth
                      id="waypointInput"
                      name="waypointInput"
                      label="הוסף תחנה ביניים"
                      value={waypointInput}
                      onChange={(e) => setWaypointInput(e.target.value)}
                      sx={{ mr: 1, borderRadius: '8px' }}
                      variant="outlined"
                      aria-label="הוסף תחנה ביניים חדשה"
                    />
                    <IconButton onClick={addWaypoint} color="primary" sx={{ background: '#4CAF50', color: '#fff', borderRadius: '8px' }} aria-label="הוסף תחנה ביניים">
                      <AddIcon />
                    </IconButton>
                  </Box>
                  <Box display="flex" alignItems="center" sx={{ mb: 2 }} role="group" aria-label="חיפוש יעד">
                    <TextField
                      fullWidth
                      id="endPoint"
                      name="endPoint"
                      label="היעד"
                      value={endPoint}
                      onChange={(e) => setEndPoint(e.target.value)}
                      sx={{ mr: 1, borderRadius: '8px' }}
                      variant="outlined"
                      aria-label="יעד המסלול"
                    />
                    <IconButton onClick={searchRoute} color="primary" disabled={!startPoint || !endPoint} sx={{ background: '#4CAF50', color: '#fff', borderRadius: '8px' }} aria-label="חפש מסלול ליעד">
                      <AddIcon />
                    </IconButton>
                  </Box>
                  <Box sx={{ textAlign: 'center', mb: 2 }} role="group" aria-label="חיפוש מסלול">
                    {isLoading ? (
                      <CircularProgress aria-label="טוען מסלול" />
                    ) : (
                      <Button variant="contained" color="primary" fullWidth onClick={searchRoute} sx={{ background: '#2196F3', padding: '10px 20px', borderRadius: '8px', '&:hover': { background: '#1976D2' } }} aria-label="חפש מסלול">
                        חפש מסלול
                      </Button>
                    )}
                  </Box>
      
                  <Box mt={3} display="flex" flexWrap="wrap" justifyContent="center" gap={2} role="group" aria-label="סינון אטרקציות">
                    <Button 
                      variant={activeFilters.includes('all') ? 'contained' : 'outlined'} 
                      onClick={() => handleButtonFilter('all')}
                      sx={{ 
                        background: activeFilters.includes('all') ? '#2196F3' : '#fff', 
                        color: activeFilters.includes('all') ? '#fff' : '#2196F3', 
                        borderRadius: '8px', 
                        padding: '8px 16px', 
                        '&:hover': { background: activeFilters.includes('all') ? '#1976D2' : '#f5f5f5' },
                      }}
                      aria-label="סנן הכל"
                      startIcon={<i className="material-icons">filter_list</i>}
                    >
                      הכל
                    </Button>
                    
                    {Object.entries(CATEGORY_ICONS).map(([key, value]) => (
                      <Button 
                        key={key}
                        variant={activeFilters.includes(key) ? 'contained' : 'outlined'} 
                        onClick={() => handleButtonFilter(key)}
                        sx={{ 
                          background: activeFilters.includes(key) ? value.color : '#fff', 
                          color: activeFilters.includes(key) ? '#fff' : value.color, 
                          borderRadius: '8px', 
                          padding: '8px 16px', 
                          '&:hover': { background: activeFilters.includes(key) ? value.color + 'CC' : '#f5f5f5' },
                        }}
                        aria-label={`סנן ${value.label}`}
                        startIcon={<i className="material-icons">{value.icon}</i>}
                      >
                        {value.label}
                      </Button>
                    ))}
                  </Box>
      
                  <PreferencesForm />
                  <TripPlanner />
                  <RouteNavigationButtons />
                  <AccommodationPlanner />
                  <ShareButtons />
                  <InviteButton />
                  <Button variant="contained" color="primary" onClick={saveTripLog} sx={{ mt: 2, background: '#4CAF50', color: '#fff', borderRadius: '8px', padding: '10px 20px', '&:hover': { background: '#388E3C' } }} aria-label="שמור מסלול">
                    שמור מסלול
                  </Button>
                  <Box mt={2} role="region" aria-label="יומני טיולים קודמים">
                    <Typography variant="h5" sx={{ color: '#2c3e50', fontWeight: 'bold', mb: 1 }} role="heading" aria-level="2">
                      יומני טיולים קודמים
                    </Typography>
                    {tripLogs.map(log => (
                      <Paper key={log.id} sx={{ p: 2, m: '5px 0', bgcolor: '#f9f9f9', borderRadius: '8px', boxShadow: 1 }} role="article" aria-label={`יומן טיול מ-${new Date(log.date).toLocaleDateString()}`}>
                        <Typography sx={{ color: '#666' }}>תאריך: {new Date(log.date).toLocaleDateString()}</Typography>
                        <Typography sx={{ color: '#666' }}>התחלה: {log.startPoint}</Typography>
                        <Typography sx={{ color: '#666' }}>יעד: {log.endPoint}</Typography>
                        <Typography sx={{ color: '#666' }}>תחנות ביניים: {log.waypoints.join(', ')}</Typography>
                        <Box sx={{ mt: 1, display: 'flex', gap: 1 }} role="group" aria-label="פעולות על יומן טיול">
                          <Button variant="outlined" color="secondary" onClick={() => editTripLog(log.id, { startPoint: prompt('עדכן נקודת התחלה:', log.startPoint) || log.startPoint, endPoint: prompt('עדכן יעד:', log.endPoint) || log.endPoint, waypoints: prompt('עדכן תחנות ביניים (הפרד עם פסיק):', log.waypoints.join(', '))?.split(', ') || log.waypoints })} sx={{ borderRadius: '8px' }} aria-label="ערוך יומן טיול">
                            ערוך
                          </Button>
                          <Button variant="outlined" color="error" onClick={() => deleteTripLog(log.id)} sx={{ borderRadius: '8px' }} aria-label="מחק יומן טיול">
                            מחק
                          </Button>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </>
              )}
      
      {mainTab === 'services' && (
  <>
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        mb: 3, 
        p: 2, 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px', 
        border: '1px solid #e0e0e0'
      }}
    >
      <Typography variant="h6" sx={{ mb: 1, color: '#2c3e50', fontWeight: 'bold' }}>
        <i className="material-icons" style={{ marginRight: '8px', verticalAlign: 'middle' }}>upgrade</i>
        שדרוג: טופס הזמנה חדש ומתקדם
      </Typography>
      
      <Typography variant="body2" sx={{ mb: 2, textAlign: 'center' }}>
        עכשיו אפשר להזמין שירותי נסיעה בצורה מפורטת יותר, כולל מעקב אחר שלבי ההזמנה, פרטי תשלום ועוד!
      </Typography>
      
      <Button 
        variant="contained" 
        color="primary" 
        onClick={() => navigate('/booking')}
        sx={{ 
          background: '#4CAF50', 
          color: '#fff', 
          borderRadius: '8px', 
          padding: '10px 20px',
          fontSize: '16px',
          '&:hover': { background: '#388E3C' },
          boxShadow: '0 3px 5px rgba(0,0,0,0.2)'
        }}
        startIcon={<i className="material-icons">flight_takeoff</i>}
      >
        עבור לטופס הזמנה המתקדם
      </Button>
    </Box>
    
    <Typography variant="h6" sx={{ mb: 2, borderBottom: '1px solid #e0e0e0', paddingBottom: '8px' }}>
      <i className="material-icons" style={{ marginRight: '8px', verticalAlign: 'middle' }}>search</i>
      חיפוש מהיר
    </Typography>
    
    <TravelServicesTab 
      startPoint={startPoint}
      endPoint={endPoint}
      userPreferences={userPreferences}
    />
  </>
)}
      
              {mainTab === 'destination' && (
                <DestinationInfo location={endPoint || userPreferences.location} />
              )}
            </Paper>
      
            <LoadScript
              googleMapsApiKey={GOOGLE_API_KEY}
              libraries={GOOGLE_MAPS_LIBRARIES}
              loading="async"
              preventGoogleFonts={true}
              onLoad={() => {
                setIsMapsLoaded(true);
                if (window.google && window.google.maps) {
                  console.log('Google Maps API נטען בהצלחה');
                } else {
                  console.error('Google Maps API נכשל בטעינה');
                }
              }}
              onError={(error) => {
                console.error('שגיאה בטעינת Google Maps:', error);
                alert('שגיאה בטעינת Google Maps API. אנא בדוק את מפתח ה-API או חיבור האינטרנט.');
              }}
            >
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={12}
                onLoad={onMapLoad}
                role="application"
                aria-label="מפת Google של מסלולי טיול"
              >
                {directions && (
                  <DirectionsRenderer
                    directions={directions}
                    options={{
                      suppressMarkers: false,
                      polylineOptions: { strokeColor: '#FF0000' },
                    }}
                  />
                )}
                {selectedAttraction && (
                  <InfoWindow
                    position={{ lat: selectedAttraction.location.lat, lng: selectedAttraction.location.lng }}
                    onCloseClick={() => setSelectedAttraction(null)}
                    aria-label={`מידע על ${selectedAttraction.name}`}
                  >
                    <Box sx={{ maxWidth: '250px', bgcolor: '#fff', p: 2, borderRadius: '8px', boxShadow: 1 }} role="dialog">
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <i className="material-icons" style={{ 
                          color: CATEGORY_ICONS[selectedAttraction.category]?.color || '#888888',
                          marginRight: '8px',
                          fontSize: '24px'
                        }}>
                          {CATEGORY_ICONS[selectedAttraction.category]?.icon || 'place'}
                        </i>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                          {selectedAttraction.name}
                        </Typography>
                      </div>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        קטגוריה: {CATEGORY_ICONS[selectedAttraction.category]?.label || selectedAttraction.category}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        דירוג: {selectedAttraction.rating} ⭐
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        כתובת: {selectedAttraction.address}
                      </Typography>
                      {selectedAttraction.photo && (
                        <img 
                          src={selectedAttraction.photo} 
                          alt={`${selectedAttraction.name} - תמונה`} 
                          style={{ width: '100%', marginTop: '5px', borderRadius: '5px' }} 
                        />
                      )}
                      {selectedAttraction.website && (
                        <Button
                          variant="outlined"
                          href={selectedAttraction.website}
                          target="_blank"
                          sx={{ mt: 1, color: '#2196F3', borderColor: '#2196F3', borderRadius: '8px' }}
                          aria-label="למידע נוסף על האטרקציה"
                          startIcon={<i className="material-icons">open_in_new</i>}
                        >
                         למידע נוסף
                        </Button>
                      )}
                    </Box>
                  </InfoWindow>
                )}
              </GoogleMap>
            </LoadScript>
            <EditAttractionModal />
            <HotelModal />
          </div>
        </TripProvider>
      </UserPreferencesProvider>
      </TripSaveProvider>
  </ErrorBoundary>
  );
}

export default App;