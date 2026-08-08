import React, { useState, useRef, useEffect } from 'react';
import useAppUpdate from './hooks/useAppUpdate';
import {
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  CircularProgress,
  IconButton,
  Modal,
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
  Tabs,
  Tab,
  Snackbar,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { FacebookShareButton, TwitterShareButton, EmailShareButton } from 'react-share';
import { v4 as uuidv4 } from 'uuid';
import ErrorBoundary from './ErrorBoundary'; // ודא שקובץ זה קיים בנתיב src/ErrorBoundary.js
import './style.css';
import WeatherWidget from "./components/maps/WeatherWidget";
import HotelSearch from './components/travel-services/HotelSearch';
import FlightSearch from './components/travel-services/FlightSearch';
import CarRentalSearch from './components/travel-services/CarRentalSearch';
import TravelServicesTab from './components/travel-services/TravelServicesTab';
import DestinationInfo from './components/DestinationInfo';
import AppRoutes from './routes';
import { TripProvider } from './contexts/TripContext';
import './assets/css/theme.css'; // קובץ העיצוב החדש
import { useNavigate, useLocation } from 'react-router-dom';

// יבוא הקומפוננטות הקיימות שלך
import Header from './components/layout/Header';
import ThemeWrapper from './components/layout/ThemeWrapper';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';
import { TripSaveProvider } from './contexts/TripSaveContext';
import { BookingsProvider } from './contexts/BookingsContext';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

// ייבוא הסמלים הנדרשים
import FlightIcon from '@mui/icons-material/Flight';
import HotelIcon from '@mui/icons-material/Hotel';
import DriveEtaIcon from '@mui/icons-material/DriveEta';

// פיצ'רים חדשים
import BudgetMeter from './components/budget/BudgetMeter';
import PackingListModal from './components/packing/PackingListModal';

// AI Features
import { AIChatProvider } from './contexts/AIChatContext';
import TravelAIChat from './components/ai/TravelAIChat';
import AIItineraryGenerator from './components/ai/AIItineraryGenerator';
import TripChatWidget from './components/chat/TripChatWidget';
import PreferencesForm from './components/trip-planner/PreferencesForm';
import InviteButton from './components/trip-planner/InviteButton';
import HotelModal from './components/trip-planner/HotelModal';
import EditAttractionModal from './components/trip-planner/EditAttractionModal';
import AccommodationList from './components/trip-planner/AccommodationList';
import ShareButtons from './components/trip-planner/ShareButtons';
import TripItineraryView from './components/trip-planner/TripItineraryView';
import RouteNavigationButtons from './components/trip-planner/RouteNavigationButtons';



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
// travelStyles ו-paceLevels עברו ל-src/constants/tripOptions.js
// יחד עם PreferencesForm שהיה המשתמש היחיד בהם.

const mapContainerStyle = {
  height: '500px',
  width: '70%',
  margin: '20px auto',
  borderRadius: '15px',
  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
};
function App() {
  const { updateAvailable, applyUpdate } = useAppUpdate();
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
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

  // מצב לפיצ'רים חדשים
  const [packingModalOpen, setPackingModalOpen] = useState(false);

  // החלף במפתחות API אמיתיים שלך או ודא שהם מוגדרים במשתני הסביבה שלך
  const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY || 'המפתח_האמיתי_שלך_ל_GOOGLE_API';

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

  // אם Google Maps JS API אינו זמין — המפה (iframe) כבר מציגה את המסלול אוטומטית
  if (!window.google?.maps || !isMapsLoaded || !mapRef.current) {
    setRouteInfo({ distance: '', duration: '' });
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

// פתיחת חלון עריכת פעילות. אוחדה מארבע קריאות setState שהיו מפוזרות
// בתוך DailyTimeline לפני שהוא הוצא לקובץ נפרד.
const handleEditActivity = (activity, day, activityIndex) => {
  setEditedAttraction(activity);
  setSelectedDay(day);
  setSelectedActivityIndex(activityIndex);
  setEditModalOpen(true);
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

// 3. עדכון רכיב תצוגת לוח זמנים יומי משופר - לתמיכה במקומות ספציפיים
// 2. שדרוג טופס העדפות - עם שדות נוספים

// רכיב תצוגת מידע על טיול מתגלגל

// פונקציית עזר לבחירת צבע התחנה

  // 4. עדכון רכיב תכנון הטיול - משתמש ברכיב הטיימליין החדש

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
// 7. הוספת אפשרות ניווט לנקודות המסלול

// 3. שדרוג רכיב תכנון מלונות עם קישורים לאתרי הזמנת מלונות

// 4. שיפור חלונית המלונות עם קישורים לאתרי הזמנות


const shareUrl = `https://yourtripplandomain.com/trip?id=${Date.now()}`;



  // חשוב מאוד - זהו ה-return הראשי של הרכיב App
  return (
    <ErrorBoundary>
      <AuthProvider>
        <TripSaveProvider>
        <BookingsProvider>
        <UserPreferencesProvider>
        <LanguageProvider>
          <ThemeWrapper>
          <TripProvider>
          <AIChatProvider>
          <Box className="app" sx={{ p: { xs: '8px 8px calc(70px + env(safe-area-inset-bottom)) 8px', md: '20px' } }} role="main" aria-label="אפליקציית תכנון טיולים">
            {/* רכיב Header שמכיל את הניווט לדפים השונים */}
            <Header />
            {/* spacer — גובה AppBar + safe-area-inset-top (notch / Dynamic Island) */}
            <Box sx={{ height: { xs: 'calc(56px + env(safe-area-inset-top))', md: '64px' } }} />

            {/* רכיב הנתיבים החדש שיטפל בניתוב לדפים השונים */}
            <AppRoutes />

            {/* AI Trip Chat Widget - צ'אט חכם עם ידע על הטיולים */}
            <TripChatWidget />

            {/* באנר עדכון גרסה */}
            <Snackbar
              open={updateAvailable}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              sx={{ mb: { xs: 8, md: 2 } }}
            >
              <Alert
                severity="info"
                variant="filled"
                action={
                  <Button color="inherit" size="small" fontWeight={700} onClick={applyUpdate}>
                    רענן עכשיו
                  </Button>
                }
                sx={{ width: '100%', bgcolor: '#667eea', alignItems: 'center' }}
              >
                ✨ גרסה חדשה זמינה!
              </Alert>
            </Snackbar>

            {isHomePage && <>
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
                  {/* מד תקציב חי 💰 */}
                  <BudgetMeter
                    destination={endPoint}
                    days={userPreferences.days}
                    budget={userPreferences.budget}
                  />

                  {/* מחולל מסלול AI ✨ */}
                  <AIItineraryGenerator
                    destination={endPoint}
                    preferences={userPreferences}
                  />

                  {/* כפתור מה לארוז */}
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => setPackingModalOpen(true)}
                      sx={{ borderRadius: '8px', py: 1.2, fontWeight: 600, borderColor: '#667eea', color: '#667eea' }}
                    >
                      🧳 מה לארוז?
                    </Button>
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
      
                  <PreferencesForm
                    userPreferences={userPreferences}
                    setUserPreferences={setUserPreferences}
                    onPlanTrip={planTripWithAI}
                    onPlanRoadTrip={planRoadTrip}
                  />
                  <TripItineraryView
                    tripPlan={tripPlan}
                    userPreferences={userPreferences}
                    startPoint={startPoint}
                    endPoint={endPoint}
                    routeInfo={routeInfo}
                    onAddActivity={addActivityToDay}
                    onEditActivity={handleEditActivity}
                  />
                  <RouteNavigationButtons startPoint={startPoint} endPoint={endPoint} waypoints={waypoints} />
                  <AccommodationList
                    accommodations={accommodations}
                    onAddHotel={() => setHotelModalOpen(true)}
                  />
                  <ShareButtons
                    shareUrl={shareUrl}
                    startPoint={startPoint}
                    endPoint={endPoint}
                  />
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
                        <Typography sx={{ color: '#666' }}>תחנות ביניים: {(log.waypoints || []).join(', ')}</Typography>
                        <Box sx={{ mt: 1, display: 'flex', gap: 1 }} role="group" aria-label="פעולות על יומן טיול">
                          <Button variant="outlined" color="secondary" onClick={() => editTripLog(log.id, { startPoint: prompt('עדכן נקודת התחלה:', log.startPoint) || log.startPoint, endPoint: prompt('עדכן יעד:', log.endPoint) || log.endPoint, waypoints: prompt('עדכן תחנות ביניים (הפרד עם פסיק):', (log.waypoints || []).join(', '))?.split(', ') || log.waypoints })} sx={{ borderRadius: '8px' }} aria-label="ערוך יומן טיול">
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
      
            {/* מפה - iframe במקום Google Maps JS API */}
            {(() => {
              const parts = [startPoint, ...waypoints, endPoint].filter(Boolean);
              let src;
              if (parts.length >= 2) {
                // פורמט saddr/daddr עם +to: לנקודות ביניים - עובד ב-iframe
                const saddr = encodeURIComponent(parts[0]);
                const daddrParts = [encodeURIComponent(parts[1])];
                for (let i = 2; i < parts.length; i++) {
                  daddrParts.push(`to:${encodeURIComponent(parts[i])}`);
                }
                const daddr = daddrParts.join('+');
                src = `https://maps.google.com/maps?saddr=${saddr}&daddr=${daddr}&dirflg=d&output=embed&hl=en`;
              } else if (parts.length === 1) {
                src = `https://maps.google.com/maps?q=${encodeURIComponent(parts[0])}&output=embed&hl=en`;
              } else {
                const fallback = userPreferences.location || 'world';
                src = `https://maps.google.com/maps?q=${encodeURIComponent(fallback)}&output=embed&hl=en`;
              }
              return (
                <Box sx={{ mt: 2, mb: 2 }}>
                  {parts.length >= 2 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1, gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" color="text.secondary">
                        🗺️ מסלול: {parts.join(' → ')}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          const txt = parts.join(' ').toLowerCase();
                          let gl = '';
                          if (/paris|bordeaux|lyon|marseille|nice|toulouse|france/.test(txt)) gl = 'fr';
                          else if (/london|manchester|birmingham|england/.test(txt)) gl = 'gb';
                          else if (/rome|milan|naples|italy/.test(txt)) gl = 'it';
                          else if (/madrid|barcelona|seville|spain/.test(txt)) gl = 'es';
                          else if (/berlin|munich|hamburg|germany/.test(txt)) gl = 'de';
                          else if (/amsterdam|rotterdam|netherlands/.test(txt)) gl = 'nl';
                          const [origin, ...rest] = parts;
                          const daddrParts = [encodeURIComponent(rest[0])];
                          for (let i = 1; i < rest.length; i++) daddrParts.push(`to:${encodeURIComponent(rest[i])}`);
                          const url = `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${daddrParts.join('+')}&dirflg=d&hl=en${gl ? `&gl=${gl}` : ''}`;
                          window.open(url, '_blank');
                        }}
                        sx={{ fontSize: '0.7rem', py: 0.3, px: 1 }}
                      >
                        פתח לניווט ←
                      </Button>
                    </Box>
                  )}
                  <Box sx={{ width: { xs: '100%', md: '70%' }, mx: 'auto', height: { xs: '350px', md: '500px' }, borderRadius: '15px', overflow: 'hidden', boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}>
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
                </Box>
              );
            })()}
            <EditAttractionModal
              open={editModalOpen}
              onClose={() => setEditModalOpen(false)}
              attraction={editedAttraction}
              defaultLocation={userPreferences.location}
              onSave={(updatedAttraction) => {
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
              }}
            />
            <HotelModal
              open={hotelModalOpen}
              onClose={() => setHotelModalOpen(false)}
              onSave={(hotel) => setAccommodations([...accommodations, hotel])}
              defaultLocation={userPreferences.location}
            />
            <PackingListModal
              open={packingModalOpen}
              onClose={() => setPackingModalOpen(false)}
              initialDestination={endPoint}
              initialDays={userPreferences.days}
            />
            </>}
          </Box>
          </AIChatProvider>
        </TripProvider>
          </ThemeWrapper>
        </LanguageProvider>
      </UserPreferencesProvider>
        </BookingsProvider>
        </TripSaveProvider>
      </AuthProvider>
  </ErrorBoundary>
  );
}

export default App;