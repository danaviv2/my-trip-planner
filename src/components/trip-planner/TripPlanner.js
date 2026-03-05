import {
  Star as StarIcon,
  Nature as NatureIcon,
  EmojiEvents as CultureIcon,
  School as HistoricalIcon,
  Favorite as FavoriteIcon,
  AttachMoney as AttachMoneyIcon,
  WbSunny as WeatherIcon,
  FamilyRestroom as FamilyIcon,
  Language as LanguageIcon,
  ContentCopy as CopyIcon,
  FileDownload as DownloadIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  Close as CloseIcon,
  Collections as CollectionsIcon,
  Save as SaveIcon,
  AutoAwesome as AIIcon
} from '@mui/icons-material';
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Button,
  TextField,
  Divider,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Slider,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  styled,
  Tooltip,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Badge,
  Snackbar,
  Tabs,
  Tab,
  Collapse,
  Switch,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  InputLabel,
  Select,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Skeleton,
  Rating,
  Backdrop,
  LinearProgress
} from '@mui/material';

import {
  Place as PlaceIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  DateRange as DateRangeIcon,
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon,
  Flight as FlightIcon,
  Hotel as HotelIcon,
  Restaurant as RestaurantIcon,
  Hiking as HikingIcon,
  Museum as MuseumIcon,
  BeachAccess as BeachIcon,
  LocalBar as NightlifeIcon,
  LocalMall as ShoppingIcon,
  Attractions as AttractionsIcon,
  CameraAlt as CameraIcon,
  // ...existing code...
  FilterDrama,
  Cloud,
  Grain,
  LocationOn,
  Loop,
  MoreHoriz,
  QuestionAnswer,
  SortByAlpha,
  PhotoCamera,
  FilterAltOutlined
} from '@mui/icons-material';

import { useNavigate, useLocation } from 'react-router-dom';
import { useTripContext } from '../../contexts/TripContext';
import { useTripSave } from '../../contexts/TripSaveContext';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import ReactApexChart from 'react-apexcharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import WeatherForecast from '../../components/WeatherForecast';
import BudgetMeter from '../budget/BudgetMeter';

// רכיבים מסוגננים קיימים
const StepperContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '16px',
  marginBottom: theme.spacing(4),
  boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
}));

const CategoryChip = styled(Chip)(({ theme, selected }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: selected ? theme.palette.primary.main : 'rgba(0, 0, 0, 0.05)',
  color: selected ? theme.palette.primary.contrastText : theme.palette.text.primary,
  transition: 'all 0.2s',
  '&:hover': {
    backgroundColor: selected ? theme.palette.primary.dark : 'rgba(0, 0, 0, 0.1)',
  },
}));

const ItineraryDay = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderRadius: '12px',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  transition: 'all 0.2s',
  '&:hover': {
    boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
  },
}));

const ActivityItem = styled(Paper)(({ theme, isDragging }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(1.5),
  borderRadius: '8px',
  backgroundColor: isDragging ? 'rgba(13, 110, 253, 0.05)' : 'white',
  border: isDragging ? `1px solid ${theme.palette.primary.main}` : '1px solid rgba(0, 0, 0, 0.08)',
  boxShadow: isDragging ? '0 8px 20px rgba(0,0,0,0.1)' : 'none',
  transition: 'all 0.2s',
  '&:hover': {
    boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
  },
}));

// רכיבים מסוגננים חדשים
const AISuggestionCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: '16px',
  backgroundColor: 'rgba(104, 93, 221, 0.05)',
  borderLeft: '4px solid #6746c3',
  marginBottom: theme.spacing(2),
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(2)
}));

const BudgetCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '16px',
  boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column'
}));

const WeatherWidget = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: '12px',
  backgroundColor: 'rgba(0, 176, 255, 0.05)',
  marginBottom: theme.spacing(2)
}));

const TripTimeline = styled(Box)(({ theme }) => ({
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: '2px',
    backgroundColor: theme.palette.divider,
    transform: 'translateX(-50%)'
  }
}));

const FeatureCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: '16px',
  transition: 'all 0.2s',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
  }
}));

const CircularProgressWithLabel = (props) => {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress variant="determinate" {...props} />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="caption" component="div" color="text.secondary">
          {`${Math.round(props.value)}%`}
        </Typography>
      </Box>
    </Box>
  );
};

const travelStyles = [
  { value: 'cultural', label: 'תרבותי - מוזיאונים, היסטוריה, אמנות' },
  { value: 'adventure', label: 'הרפתקני - טיולים, ספורט אתגרי' },
  { value: 'relaxation', label: 'מנוחה - ספא, חופים, הרפיה' },
  { value: 'culinary', label: 'קולינרי - אוכל, יין, שווקים' },
  { value: 'nature', label: 'טבע - פארקים, נופים, חיות בר' },
  { value: 'urban', label: 'עירוני - קניות, אטרקציות עירוניות' },
  { value: 'mixed', label: 'מעורב - שילוב של מספר סגנונות' }
];

const paceLevels = [
  { value: 'slow', label: 'איטי - מעט פעילויות, הרבה זמן פנוי' },
  { value: 'medium', label: 'בינוני - איזון בין פעילויות ומנוחה' },
  { value: 'fast', label: 'מהיר - ימים עמוסים, הרבה פעילויות' }
];

// קומפוננט תכנון טיול עם התוספות החדשות
const TripPlanner = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { tripData, tripPlan, updateTripPlan, planTripWithAI, tripLoading, selectedDayIndex, setSelectedDayIndex } = useTripContext();
  const { saveTripToList: saveTrip } = useTripSave();
  const { userPreferences, updateLocation, updateBudget: updateBudgetPref, updateThemes, updateAdvancedPreferences } = useUserPreferences();
  
  // מחלץ את פרמטר היעד מה-URL אם קיים
  const searchParams = new URLSearchParams(location.search);
  const destinationParam = searchParams.get('destination');
  
  // שלבים של תהליך התכנון
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // מידע בסיסי על הטיול
  const [destination, setDestination] = useState(destinationParam || tripData?.destination || '');
  const [tripDays, setTripDays] = useState(tripPlan?.duration || Number(userPreferences?.days) || 5);
  const [startDate, setStartDate] = useState(
    tripPlan?.startDate ? new Date(tripPlan.startDate) : new Date()
  );
  const [interests, setInterests] = useState(tripPlan?.theme || userPreferences?.interests || []);
  const [tripName, setTripName] = useState(tripPlan?.name || `טיול ל${destination}`);
  
  // לוח זמנים (itinerary)
  const [itinerary, setItinerary] = useState(tripPlan?.dailyItinerary || []);
  
  // אטרקציות מומלצות
  const [recommendedAttractions, setRecommendedAttractions] = useState([]);
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [dayToAddActivity, setDayToAddActivity] = useState(null);
  
  // מצב של דיאלוגים
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  
  // מצב תפריטים
  const [dayMenuAnchor, setDayMenuAnchor] = useState(null);
  const [selectedDayForMenu, setSelectedDayForMenu] = useState(null);

  // פונקציה להחזרת אייקון לפי שם הקטגוריה
  const getCategoryIcon = (categoryId) => {
    const iconMap = {
      'all': StarIcon,
      'attractions': AttractionsIcon,
      'museums': MuseumIcon,
      'nature': NatureIcon,
      'beaches': BeachIcon,
      'food': RestaurantIcon,
      'nightlife': NightlifeIcon,
      'shopping': ShoppingIcon,
      'culture': CultureIcon,
      'historical': HistoricalIcon
    };
    
    const IconComponent = iconMap[categoryId] || StarIcon;
    return <IconComponent />;
  };

  // קטגוריות לסינון אטרקציות - עכשיו בלי אייקונים ישירות
  const categories = [
    { id: 'all', label: 'הכל' },
    { id: 'attractions', label: 'אטרקציות' },
    { id: 'museums', label: 'מוזיאונים' },
    { id: 'nature', label: 'טבע' },
    { id: 'beaches', label: 'חופים' },
    { id: 'food', label: 'אוכל' },
    { id: 'nightlife', label: 'חיי לילה' },
    { id: 'shopping', label: 'קניות' },
    { id: 'culture', label: 'תרבות' },
    { id: 'historical', label: 'היסטוריה' }
  ];
  
  // העדפות מתקדמות (הועברו מ-PreferencesForm)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [foodPreferences, setFoodPreferences] = useState(userPreferences.advancedPreferences?.foodPreferences || '');
  const [travelPace, setTravelPace] = useState(userPreferences.advancedPreferences?.travelPace || 'medium');
  const [travelStyle, setTravelStyle] = useState(userPreferences.advancedPreferences?.travelStyle || 'mixed');
  const [hasChildren, setHasChildren] = useState(userPreferences.advancedPreferences?.hasChildren || false);
  const [specialNeeds, setSpecialNeeds] = useState(userPreferences.advancedPreferences?.specialNeeds || '');

  // מצבים חדשים
  const [showWeatherForecast, setShowWeatherForecast] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [budgetData, setBudgetData] = useState({
    total: 0,
    categories: {
      accommodation: 0,
      transportation: 0,
      food: 0,
      activities: 0,
      other: 0
    }
  });
  const [budgetCurrency, setBudgetCurrency] = useState('ILS');
  const [showCollaborationPanel, setShowCollaborationPanel] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isGeneratingAiSuggestions, setIsGeneratingAiSuggestions] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const [activeFilters, setActiveFilters] = useState(['all']);
  const [currentDayInMap, setCurrentDayInMap] = useState(0);
  const [showPackingList, setShowPackingList] = useState(false);
  const [packingList, setPackingList] = useState([
    { id: 1, name: 'דרכון', category: 'מסמכים', checked: false, essential: true },
    { id: 2, name: 'כרטיסי טיסה', category: 'מסמכים', checked: false, essential: true },
    { id: 3, name: 'מטען וכבל לטלפון', category: 'אלקטרוניקה', checked: false, essential: true },
    { id: 4, name: 'מתאם חשמל', category: 'אלקטרוניקה', checked: false, essential: true },
    { id: 5, name: 'תרופות', category: 'בריאות', checked: false, essential: true },
    { id: 6, name: 'משקפי שמש', category: 'ביגוד', checked: false, essential: false },
    { id: 7, name: 'כובע', category: 'ביגוד', checked: false, essential: false },
    { id: 8, name: 'קרם הגנה', category: 'בריאות', checked: false, essential: false },
    { id: 9, name: 'מצלמה', category: 'אלקטרוניקה', checked: false, essential: false }
  ]);
  const [newPackingItem, setNewPackingItem] = useState({ name: '', category: 'כללי', essential: false });
  
  const [advancedFilters, setAdvancedFilters] = useState({
    priceRange: [0, 200],
    duration: [0, 480],
    rating: 0,
    accessibility: false,
    familyFriendly: false
  });
  
  // Refs
  const mapRef = useRef(null);
  const exportComponentRef = useRef(null);
  
  // רשימת צעדים בתהליך
  const steps = [
    'פרטי הטיול הבסיסיים',
    'בחירת קטגוריות ותחומי עניין',
    'תכנון לוח זמנים'
  ];

  // עדכון שם הטיול וסנכרון היעד לקונטקסט כאשר היעד משתנה
  useEffect(() => {
    if (destination) {
      setTripName(`טיול ל${destination}`);
      updateLocation(destination);
    }
  }, [destination]); // eslint-disable-line

  // אתחול מסלול יומי כשמספר הימים משתנה
  useEffect(() => {
    if (tripDays > 0 && tripDays !== itinerary.length) {
      const currentLength = itinerary.length;
      
      if (tripDays > currentLength) {
        const newDays = Array.from({ length: tripDays - currentLength }, (_, i) => ({
          day: currentLength + i + 1,
          date: new Date(startDate.getTime() + (currentLength + i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          title: `יום ${currentLength + i + 1}`,
          schedule: []
        }));
        
        setItinerary([...itinerary, ...newDays]);
      } else {
        setItinerary(itinerary.slice(0, tripDays));
      }
    }
  }, [tripDays, itinerary, startDate]);

  // אתחול מסלול יומי בטעינה הראשונית אם הוא ריק
  useEffect(() => {
    if (itinerary.length === 0 && tripDays > 0) {
      const initialItinerary = Array.from({ length: tripDays }, (_, i) => ({
        day: i + 1,
        date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        title: `יום ${i + 1}`,
        schedule: []
      }));
      
      setItinerary(initialItinerary);
    }
  }, []);

  // עדכון תאריכים כאשר תאריך ההתחלה משתנה
  useEffect(() => {
    if (itinerary.length > 0 && startDate) {
      const updatedItinerary = itinerary.map((day, index) => ({
        ...day,
        date: new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));
      
      setItinerary(updatedItinerary);
    }
  }, [startDate, itinerary.length, tripDays]);

  // כשטיול שמור נטען מהקונטקסט — קפוץ ישר לשלב האיטינרריה
  useEffect(() => {
    if (tripPlan?.dailyItinerary?.length > 0 && activeStep === 0) {
      if (tripPlan.destination) setDestination(tripPlan.destination);
      setActiveStep(2);
    }
  }, [tripPlan]);

  // שליפת אטרקציות מומלצות כשהיעד משתנה
  useEffect(() => {
    if (destination) {
      fetchRecommendedAttractions(destination);
    }
  }, [destination]);

  // תוספת - הבאת תחזית מזג אוויר
  const fetchWeatherForecast = async () => {
    setWeatherData(getMockWeatherData());
    setShowWeatherForecast(true);
  };

  // פונקציה להבאת אטרקציות מומלצות
  const fetchRecommendedAttractions = async (dest) => {
    setLoading(true);
    
    try {
      setTimeout(() => {
        const mockAttractions = getMockAttractions(dest);
        setRecommendedAttractions(mockAttractions);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('שגיאה בהבאת אטרקציות מומלצות:', error);
      setLoading(false);
    }
  };

  // נתונים לדוגמה עבור אטרקציות מומלצות
  const getMockAttractions = (dest) => {
    return [
      {
        id: 1,
        name: 'מגדל אייפל',
        category: 'attractions',
        location: 'פריז, צרפת',
        address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris',
        description: 'סמלה המפורסם של פריז, המגדל מציע נוף פנורמי מרהיב של העיר.',
        image: 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=500',
        rating: 4.7,
        duration: 120,
        price: '€18-28',
        openingHours: '9:00-23:45',
        coordinates: { lat: 48.8584, lng: 2.2945 }
      },
      {
        id: 2,
        name: 'מוזיאום הלובר',
        category: 'museums',
        location: 'פריז, צרפת',
        address: 'Rue de Rivoli, 75001 Paris',
        description: 'אחד המוזיאונים המפורסמים בעולם, בו מוצגות יצירות אמנות כמו המונה ליזה.',
        image: 'https://images.unsplash.com/photo-1527410-90b930c0a42b?w=500',
        rating: 4.8,
        duration: 180,
        price: '€17',
        openingHours: '9:00-18:00, סגור בימי שלישי',
        coordinates: { lat: 48.8606, lng: 2.3376 }
      },
      {
        id: 3,
        name: 'קתדרלת נוטרדאם',
        category: 'historical',
        location: 'פריז, צרפת',
        address: '6 Parvis Notre-Dame - Pl. Jean-Paul II, 75004 Paris',
        description: 'קתדרלה גותית מפורסמת הממוקמת בלב פריז, בעלת היסטוריה עשירה.',
        image: 'https://images.unsplash.com/photo-1584707824245-087f3505cfe4?w=500',
        rating: 4.7,
        duration: 90,
        price: 'חינם (תשלום לעלייה למגדל)',
        openingHours: '8:00-18:45',
        coordinates: { lat: 48.8530, lng: 2.3499 }
      }
    ];
  };

  // נתונים לדוגמה עבור מזג אוויר
  const getMockWeatherData = () => {
    const startDateObj = new Date(startDate);
    const forecast = [];
    
    for (let i = 0; i < tripDays; i++) {
      const date = new Date(startDateObj);
      date.setDate(startDateObj.getDate() + i);
      
      const conditions = ['שמשי', 'מעונן חלקית', 'מעונן', 'גשום'];
      const randomCondition = conditions[Math.floor(Math.random() * 4)];
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        day: `יום ${i + 1}`,
        temp: Math.floor(Math.random() * 10) + 20,
        condition: randomCondition,
        iconType: randomCondition
      });
    }
    
    return forecast;
  };
  
  // פונקציה להוספת פעילות ליום
  const addActivityToDay = (dayIndex, activity) => {
    const updatedItinerary = [...itinerary];
    
    const newActivity = {
      ...activity,
      id: Date.now(),
      startTime: '09:00',
      endTime: calculateEndTime('09:00', activity.duration)
    };
    
    updatedItinerary[dayIndex].schedule.push(newActivity);
    setItinerary(updatedItinerary);
    
    setSnackbarMessage(`הפעילות "${activity.name}" נוספה ליום ${dayIndex + 1}`);
    setSnackbarOpen(true);
  };

  // פונקציה לחישוב זמן סיום
  const calculateEndTime = (startTime, durationMinutes) => {
    const [hours, minutes] = startTime.split(':').map(num => parseInt(num, 10));
    const startDateCalc = new Date();
    startDateCalc.setHours(hours, minutes, 0);
    
    const endDate = new Date(startDateCalc.getTime() + durationMinutes * 60000);
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  };

  // פונקציה לעדכון פעילות
  const updateActivity = (dayIndex, activityId, updatedActivity) => {
    const updatedItinerary = [...itinerary];
    const activityIndex = updatedItinerary[dayIndex].schedule.findIndex(activity => activity.id === activityId);
    
    if (activityIndex !== -1) {
      updatedItinerary[dayIndex].schedule[activityIndex] = {
        ...updatedItinerary[dayIndex].schedule[activityIndex],
        ...updatedActivity,
        endTime: calculateEndTime(updatedActivity.startTime, updatedActivity.duration)
      };
      
      setItinerary(updatedItinerary);
      
      setSnackbarMessage(`הפעילות "${updatedActivity.name}" עודכנה`);
      setSnackbarOpen(true);
    }
  };

  // פונקציה להסרת פעילות
  const removeActivity = (dayIndex, activityId) => {
    const updatedItinerary = [...itinerary];
    const activityName = updatedItinerary[dayIndex].schedule.find(activity => activity.id === activityId)?.name;
    
    updatedItinerary[dayIndex].schedule = updatedItinerary[dayIndex].schedule.filter(
      activity => activity.id !== activityId
    );
    
    setItinerary(updatedItinerary);
    
    setSnackbarMessage(`הפעילות "${activityName}" הוסרה`);
    setSnackbarOpen(true);
  };

  // טיפול בשינוי סדר הפעילויות (גרירה)
  const handleDragEnd = (result) => {
    const { source, destination } = result;
    
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return;
    }
    
    const updatedItinerary = [...itinerary];
    const sourceDayIndex = parseInt(source.droppableId.split('-')[1]);
    const destinationDayIndex = parseInt(destination.droppableId.split('-')[1]);
    
    if (sourceDayIndex === destinationDayIndex) {
      const daySchedule = [...updatedItinerary[sourceDayIndex].schedule];
      const [movedActivity] = daySchedule.splice(source.index, 1);
      daySchedule.splice(destination.index, 0, movedActivity);
      
      updatedItinerary[sourceDayIndex].schedule = daySchedule;
    } else {
      const sourceSchedule = [...updatedItinerary[sourceDayIndex].schedule];
      const destSchedule = [...updatedItinerary[destinationDayIndex].schedule];
      
      const [movedActivity] = sourceSchedule.splice(source.index, 1);
      destSchedule.splice(destination.index, 0, movedActivity);
      
      updatedItinerary[sourceDayIndex].schedule = sourceSchedule;
      updatedItinerary[destinationDayIndex].schedule = destSchedule;
    }
    
    setItinerary(updatedItinerary);
  };

  // טיפול בלחיצה על כפתור ההוספה של פעילות ליום
  const handleAddActivityButtonClick = (dayIndex) => {
    setDayToAddActivity(dayIndex);
    setActivityDialogOpen(true);
  };

  // פתיחת דיאלוג לעריכת פעילות
  const handleEditActivity = (dayIndex, activity) => {
    setDayToAddActivity(dayIndex);
    setActivityToEdit(activity);
    setActivityDialogOpen(true);
  };

  // שמירת טיול
  const handleSaveTrip = () => {
    setLoading(true);
    
    const tripPlanData = {
      name: tripName,
      destination,
      startDate: startDate.toISOString(),
      duration: tripDays,
      theme: interests,
      dailyItinerary: itinerary,
      budget: budgetData,
      currency: budgetCurrency,
      packingList,
      lastModified: new Date().toISOString()
    };
    
    try {
      saveTrip(tripPlanData);
      
      setSnackbarMessage('הטיול נשמר בהצלחה');
      setSnackbarOpen(true);
      setLoading(false);
      
      setTimeout(() => {
        navigate('/my-trips');
      }, 1500);
    } catch (error) {
      console.error('שגיאה בשמירת הטיול:', error);
      setSnackbarMessage('שגיאה בשמירת הטיול');
      setSnackbarOpen(true);
      setLoading(false);
    }
  };

  // התקדמות לשלב הבא
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  // חזרה לשלב הקודם
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // סיום תהליך התכנון
  const handleFinish = () => {
    setCompleted(true);
  };

  // פתיחת תפריט יום
  const handleDayMenuOpen = (event, dayIndex) => {
    setDayMenuAnchor(event.currentTarget);
    setSelectedDayForMenu(dayIndex);
  };

  // סגירת תפריט יום
  const handleDayMenuClose = () => {
    setDayMenuAnchor(null);
    setSelectedDayForMenu(null);
  };

  // שינוי כותרת יום
  const handleDayTitleChange = (dayIndex, newTitle) => {
    const updatedItinerary = [...itinerary];
    updatedItinerary[dayIndex].title = newTitle;
    setItinerary(updatedItinerary);
    handleDayMenuClose();
  };

  // ניקוי יום
  const handleClearDay = (dayIndex) => {
    const updatedItinerary = [...itinerary];
    updatedItinerary[dayIndex].schedule = [];
    setItinerary(updatedItinerary);
    handleDayMenuClose();
    
    setSnackbarMessage(`כל הפעילויות הוסרו מיום ${dayIndex + 1}`);
    setSnackbarOpen(true);
  };

  // שיתוף יום
  const handleShareDay = (dayIndex) => {
    handleDayMenuClose();
    setShareDialogOpen(true);
  };

  // טיפול בסינון אטרקציות
  const handleFilterChange = (categoryId) => {
    if (activeFilters.includes(categoryId) && activeFilters.length === 1) {
      return;
    }
    
    if (categoryId === 'all') {
      setActiveFilters(['all']);
      return;
    }
    
    if (activeFilters.includes('all')) {
      setActiveFilters([categoryId]);
      return;
    }
    
    if (activeFilters.includes(categoryId)) {
      const updatedFilters = activeFilters.filter(filter => filter !== categoryId);
      
      if (updatedFilters.length === 0) {
        setActiveFilters(['all']);
      } else {
        setActiveFilters(updatedFilters);
      }
      return;
    }
    
    setActiveFilters([...activeFilters, categoryId]);
  };

  // יצירת מסלול מפורט עם AI
  const generateAiSuggestions = async () => {
    if (!destination) {
      setSnackbarMessage('נא להזין יעד לפני יצירת המסלול');
      setSnackbarOpen(true);
      return;
    }
    setIsGeneratingAiSuggestions(true);
    try {
      const result = await planTripWithAI({
        destination,
        days: tripDays,
        interests,
        budget: userPreferences?.budget || 'medium',
        advancedPreferences: {
          hasChildren,
          travelPace,
          travelStyle,
          foodPreferences,
          specialNeeds,
        },
      });
      if (result.success) {
        setSnackbarMessage('המסלול נוצר בהצלחה! 🎉');
        setSelectedDayIndex(0);
      } else {
        setSnackbarMessage(result.error || 'שגיאה ביצירת המסלול');
      }
      setSnackbarOpen(true);
    } catch (error) {
      console.error('שגיאה ביצירת מסלול:', error);
      setSnackbarMessage('שגיאה ביצירת המסלול');
      setSnackbarOpen(true);
    } finally {
      setIsGeneratingAiSuggestions(false);
    }
  };

  // אימוץ המלצת AI
  const adoptAiSuggestion = (suggestion) => {
    suggestion.attractions.forEach(attractionId => {
      const attraction = recommendedAttractions.find(attr => attr.id === attractionId);
      if (attraction) {
        addActivityToDay(suggestion.dayIndex, attraction);
      }
    });
    
    setAiSuggestions(aiSuggestions.filter(s => s.id !== suggestion.id));
    
    if (aiSuggestions.length <= 1) {
      setShowAiSuggestions(false);
    }
    
    setSnackbarMessage(`ההמלצה "${suggestion.title}" אומצה ליום ${suggestion.dayIndex + 1}`);
    setSnackbarOpen(true);
  };

  // יצוא PDF
  const exportToPdf = async () => {
    setIsExporting(true);
    setExportProgress(10);
    
    try {
      for (let i = 1; i <= 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setExportProgress(i * 20);
      }
      
      setIsExporting(false);
      setExportProgress(0);
      
      setSnackbarMessage('הטיול יוצא בהצלחה!');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('שגיאה ביצוא הטיול:', error);
      setIsExporting(false);
      setExportProgress(0);
      
      setSnackbarMessage('שגיאה ביצוא הטיול');
      setSnackbarOpen(true);
    }
  };

  // החלת תבנית
  const applyTemplate = (templateName) => {
    let templateData;
    
    switch (templateName) {
      case 'culture':
        templateData = {
          interests: ['museums', 'historical', 'culture'],
          attractions: [2, 3]
        };
        break;
      case 'family':
        templateData = {
          interests: ['attractions', 'nature', 'food'],
          attractions: [1]
        };
        break;
      case 'romantic':
        templateData = {
          interests: ['food', 'culture', 'nightlife'],
          attractions: [1]
        };
        break;
      default:
        return;
    }
    
    setInterests(templateData.interests);
    
    const updatedItinerary = [...itinerary];
    
    templateData.attractions.forEach((attractionId, index) => {
      const dayIndex = index % 2;
      const attraction = recommendedAttractions.find(attr => attr.id === attractionId);
      
      if (attraction && updatedItinerary[dayIndex]) {
        const startTime = dayIndex === 0 ? '09:00' : '10:00';
        
        updatedItinerary[dayIndex].schedule.push({
          ...attraction,
          id: Date.now() + index,
          startTime,
          endTime: calculateEndTime(startTime, attraction.duration)
        });
      }
    });
    
    setItinerary(updatedItinerary);
    
    setSnackbarMessage(`תבנית "${templateName}" הוחלה בהצלחה`);
    setSnackbarOpen(true);
  };

  // עדכון פריט ציוד
  const togglePackingItem = (itemId) => {
    const updatedList = packingList.map(item =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    
    setPackingList(updatedList);
  };

  // הוספת פריט ציוד
  const addPackingItem = () => {
    if (newPackingItem.name.trim() === '') {
      return;
    }
    
    const newItem = {
      id: Date.now(),
      name: newPackingItem.name,
      category: newPackingItem.category,
      checked: false,
      essential: newPackingItem.essential
    };
    
    setPackingList([...packingList, newItem]);
    setNewPackingItem({ name: '', category: 'כללי', essential: false });
  };

  // הסרת פריט ציוד
  const removePackingItem = (itemId) => {
    setPackingList(packingList.filter(item => item.id !== itemId));
  };

  // עדכון תקציב
  const updateBudget = (category, amount) => {
    const updatedBudget = { ...budgetData };
    updatedBudget.categories[category] = parseFloat(amount);
    
    const total = Object.values(updatedBudget.categories).reduce((sum, val) => sum + val, 0);
    updatedBudget.total = total;
    
    setBudgetData(updatedBudget);
  };

  // הוספת משתף פעולה
  const addCollaborator = (email) => {
    if (!email || collaborators.some(c => c.email === email)) {
      return;
    }
    
    const newCollaborator = {
      id: Date.now(),
      email,
      name: email.split('@')[0],
      role: 'עורך',
      avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=random`
    };
    
    setCollaborators([...collaborators, newCollaborator]);
    
    setSnackbarMessage(`הזמנה נשלחה ל-${email}`);
    setSnackbarOpen(true);
  };

  // הסרת משתף פעולה
  const removeCollaborator = (collaboratorId) => {
    setCollaborators(collaborators.filter(c => c.id !== collaboratorId));
  };

  // עדכון פילטרים מתקדמים
  const handleAdvancedFilterChange = (filterType, value) => {
    setAdvancedFilters({
      ...advancedFilters,
      [filterType]: value
    });
  };

  // פילטור אטרקציות
  const filteredAttractions = recommendedAttractions.filter(attraction => {
    const categoryMatch = activeFilters.includes('all') || activeFilters.includes(attraction.category);
    
    if (showAdvancedFilters) {
      const priceMatch = !attraction.price || 
        (typeof attraction.price === 'string' && attraction.price.includes('חינם'));
      
      const durationMatch = 
        attraction.duration >= advancedFilters.duration[0] && 
        attraction.duration <= advancedFilters.duration[1];
      
      const ratingMatch = attraction.rating >= advancedFilters.rating;
      
      return categoryMatch && priceMatch && durationMatch && ratingMatch;
    }
    
    return categoryMatch;
  });

  // רינדור שלבים
  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return renderBasicDetailsStep();
      case 1:
        return renderInterestsStep();
      case 2:
        return renderItineraryStep();
      default:
        return null;
    }
  };

  // שלב 1 - פרטים בסיסיים
  const renderBasicDetailsStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        פרטי הטיול הבסיסיים
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="יעד הטיול"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PlaceIcon />
                </InputAdornment>
              ),
            }}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="שם הטיול"
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
            <DatePicker
              label="תאריך התחלה"
              value={startDate}
              onChange={(newDate) => setStartDate(newDate)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: 'outlined',
                  InputProps: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <DateRangeIcon />
                      </InputAdornment>
                    ),
                  },
                },
              }}
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="מספר ימים"
            type="number"
            value={tripDays}
            onChange={(e) => setTripDays(parseInt(e.target.value, 10))}
            InputProps={{
              inputProps: { min: 1, max: 30 },
            }}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={fetchWeatherForecast}
            startIcon={<WeatherIcon />}
            disabled={!destination || showWeatherForecast}
          >
            הצג תחזית מזג אוויר
          </Button>
        </Grid>
        
        {showWeatherForecast && weatherData && weatherData.length > 0 && (
          <Grid item xs={12}>
            <WeatherWidget>
              <Typography variant="h6" gutterBottom>
                תחזית מזג אוויר ב{destination}
              </Typography>
              <Grid container spacing={2}>
                {weatherData.map((day, index) => (
                  <Grid item xs={6} sm={4} md={2} key={index}>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                      <Typography variant="subtitle2">{day.day}</Typography>
                      <Box sx={{ my: 1 }}>
                        {day.iconType === 'שמשי' && <WeatherIcon />}
                        {day.iconType === 'מעונן חלקית' && <FilterDrama />}
                        {day.iconType === 'מעונן' && <Cloud />}
                        {day.iconType === 'גשום' && <Grain />}
                      </Box>
                      <Typography variant="h6">{day.temp}°C</Typography>
                      <Typography variant="body2">{day.condition}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </WeatherWidget>
          </Grid>
        )}

        {/* תקציב + יותר אפשרויות */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>תקציב</InputLabel>
            <Select
              value={['low', 'medium', 'high'].includes(userPreferences.budget) ? userPreferences.budget : 'medium'}
              onChange={(e) => updateBudgetPref(e.target.value)}
              label="תקציב"
            >
              <MenuItem value="low">נמוך - חסכוני</MenuItem>
              <MenuItem value="medium">בינוני</MenuItem>
              <MenuItem value="high">גבוה - יוקרתי</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            sx={{ height: '56px', borderRadius: '8px' }}
          >
            {showAdvancedOptions ? '▲ פחות אפשרויות' : '▼ יותר אפשרויות'}
          </Button>
        </Grid>

        {/* אפשרויות מתקדמות */}
        {showAdvancedOptions && (
          <Grid item xs={12}>
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: '8px' }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>העדפות מתקדמות</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="העדפות אוכל (צמחוני, כשר, ללא גלוטן...)"
                    value={foodPreferences}
                    onChange={(e) => setFoodPreferences(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>סגנון הטיול</InputLabel>
                    <Select value={travelStyle} onChange={(e) => setTravelStyle(e.target.value)} label="סגנון הטיול">
                      {travelStyles.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>קצב הטיול</InputLabel>
                    <Select value={travelPace} onChange={(e) => setTravelPace(e.target.value)} label="קצב הטיול">
                      {paceLevels.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Checkbox checked={hasChildren} onChange={(e) => setHasChildren(e.target.checked)} color="primary" />}
                    label="כולל ילדים"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="צרכים מיוחדים או בקשות נוספות"
                    value={specialNeeds}
                    onChange={(e) => setSpecialNeeds(e.target.value)}
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </Box>
          </Grid>
        )}

        {/* נושאי עניין */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="נושאי עניין (טבע, יקבים, קולינריה — מפריד עם פסיק)"
            value={(userPreferences.themes || []).join(', ')}
            onChange={(e) => updateThemes(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
          />
        </Grid>
      </Grid>
    </Box>
  );

  // שלב 2 - תחומי עניין
  const renderInterestsStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        בחירת קטגוריות ותחומי עניין
      </Typography>
      
      <Typography variant="body1" gutterBottom>
        בחרו את תחומי העניין שלכם כדי שנוכל להתאים לכם אטרקציות מומלצות
      </Typography>
      
      <Box sx={{ my: 3 }}>
        {categories.slice(1).map((category) => (
          <CategoryChip
            key={category.id}
            label={category.label}
            icon={getCategoryIcon(category.id)}
            selected={interests.includes(category.id)}
            onClick={() => {
              if (interests.includes(category.id)) {
                setInterests(interests.filter(i => i !== category.id));
              } else {
                setInterests([...interests, category.id]);
              }
            }}
          />
        ))}
      </Box>
      
      <Typography variant="subtitle1" sx={{ mt: 4, mb: 2 }}>
        תבניות מוכנות מראש
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <FeatureCard>
            <Box sx={{ mb: 2 }}>
              <CultureIcon color="primary" fontSize="large" />
            </Box>
            <Typography variant="h6" gutterBottom>
              טיול תרבות
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              תבנית זו מתמקדת במוזיאונים, אתרים היסטוריים ומרכזי תרבות.
            </Typography>
            <Button 
              variant="outlined" 
              color="primary" 
              size="small"
              onClick={() => applyTemplate('culture')}
            >
              החל תבנית
            </Button>
          </FeatureCard>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <FeatureCard>
            <Box sx={{ mb: 2 }}>
              <FamilyIcon color="primary" fontSize="large" />
            </Box>
            <Typography variant="h6" gutterBottom>
              טיול משפחתי
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              תבנית זו מתמקדת באטרקציות ופעילויות מהנות לכל המשפחה.
            </Typography>
            <Button 
              variant="outlined" 
              color="primary" 
              size="small"
              onClick={() => applyTemplate('family')}
            >
              החל תבנית
            </Button>
          </FeatureCard>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <FeatureCard>
            <Box sx={{ mb: 2 }}>
              <FavoriteIcon color="primary" fontSize="large" />
            </Box>
            <Typography variant="h6" gutterBottom>
              טיול רומנטי
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              תבנית זו מתמקדת במקומות רומנטיים, ארוחות איכותיות ונופים מרהיבים.
            </Typography>
            <Button 
              variant="outlined" 
              color="primary" 
              size="small"
              onClick={() => applyTemplate('romantic')}
            >
              החל תבנית
            </Button>
          </FeatureCard>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 4 }}>
        <BudgetMeter
          destination={destination}
          days={tripDays || userPreferences.days || 7}
          budget={userPreferences.budget || 'medium'}
        />
      </Box>
    </Box>
  );

  // שלב 3 - לוח זמנים
  const renderItineraryStep = () => {
    const days = tripPlan?.dailyItinerary || [];
    const currentDay = days[selectedDayIndex];

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          תכנון לוח זמנים
        </Typography>

        {/* כפתור יצירת מסלול */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={isGeneratingAiSuggestions ? <CircularProgress size={18} color="inherit" /> : <AIIcon />}
            onClick={generateAiSuggestions}
            disabled={isGeneratingAiSuggestions || !destination}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              px: 3,
              fontWeight: 700,
            }}
          >
            {isGeneratingAiSuggestions ? 'מייצר מסלול...' : days.length > 0 ? 'צור מסלול מחדש' : 'צור מסלול חכם'}
          </Button>

          <Button
            variant={showPackingList ? 'contained' : 'outlined'}
            color="secondary"
            startIcon={<CollectionsIcon />}
            onClick={() => setShowPackingList(!showPackingList)}
          >
            רשימת ציוד
          </Button>

          {!destination && (
            <Typography variant="caption" color="error">
              יש להזין יעד בשלב 1 תחילה
            </Typography>
          )}
        </Box>

        {/* מסלול לפי ימים */}
        {days.length > 0 ? (
          <Box>
            {/* לשוניות ימים */}
            <Tabs
              value={selectedDayIndex}
              onChange={(_, v) => setSelectedDayIndex(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
            >
              {days.map((day, i) => (
                <Tab
                  key={i}
                  label={`יום ${day.day}`}
                  sx={{ fontWeight: selectedDayIndex === i ? 700 : 400, minWidth: 80 }}
                />
              ))}
            </Tabs>

            {/* תוכן היום הנבחר */}
            {currentDay && (
              <Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {currentDay.title}
                  </Typography>
                  {currentDay.theme && (
                    <Typography variant="body2" color="text.secondary">
                      {currentDay.theme}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  {(currentDay.activities || []).map((activity, i) => {
                    const nextActivity = currentDay.activities[i + 1];
                    const origin = encodeURIComponent(activity.address || activity.name);
                    const dest = nextActivity ? encodeURIComponent(nextActivity.address || nextActivity.name) : null;
                    return (
                      <React.Fragment key={i}>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            borderRight: '4px solid',
                            borderRightColor:
                              activity.type === 'food' ? '#ff9800'
                              : activity.type === 'attraction' || activity.type === 'museum' ? '#667eea'
                              : activity.type === 'nature' || activity.type === 'beach' ? '#43a047'
                              : activity.type === 'nightlife' ? '#7b1fa2'
                              : '#90a4ae',
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="h6" component="span">{activity.emoji || '📍'}</Typography>
                              <Box>
                                <Typography variant="subtitle2" fontWeight={700}>
                                  {activity.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {activity.time} · {activity.duration}
                                </Typography>
                              </Box>
                            </Box>
                            {activity.price && (
                              <Typography variant="caption" sx={{ bgcolor: '#f5f5f5', px: 1, py: 0.3, borderRadius: 1, whiteSpace: 'nowrap' }}>
                                {activity.price}
                              </Typography>
                            )}
                          </Box>

                          {activity.description && (
                            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                              {activity.description}
                            </Typography>
                          )}

                          {activity.tips && (
                            <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: '#667eea', fontStyle: 'italic' }}>
                              💡 {activity.tips}
                            </Typography>
                          )}

                          {activity.address && (
                            <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: 'text.disabled' }}>
                              📍 {activity.address}
                            </Typography>
                          )}
                        </Paper>

                        {/* סרגל ניווט בין פעילויות */}
                        {nextActivity && dest && (
                          <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 0.5,
                            px: 1, py: 0.5,
                          }}>
                            <Box sx={{ flex: 1, height: '1px', bgcolor: '#e8e8e8' }} />
                            <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: 'nowrap', fontSize: '0.65rem' }}>
                              {activity.time} → {nextActivity.time}
                            </Typography>
                            {[
                              { label: '🚶 הליכה', mode: 'w', color: '#43A047' },
                              { label: '🚌 תחבורה', mode: 'r', color: '#1976D2' },
                              { label: '🚗 רכב',    mode: 'd', color: '#E65100' },
                            ].map(({ label, mode, color }) => (
                              <Button
                                key={mode}
                                size="small"
                                variant="outlined"
                                onClick={() => window.open(
                                  `https://maps.google.com/maps?saddr=${origin}&daddr=${dest}&dirflg=${mode}`,
                                  '_blank', 'noopener,noreferrer'
                                )}
                                sx={{
                                  minWidth: 0, px: 1, py: 0.2,
                                  fontSize: '0.65rem', fontWeight: 600,
                                  borderColor: color, color,
                                  '&:hover': { bgcolor: `${color}11`, borderColor: color },
                                }}
                              >
                                {label}
                              </Button>
                            ))}
                            <Box sx={{ flex: 1, height: '1px', bgcolor: '#e8e8e8' }} />
                          </Box>
                        )}
                      </React.Fragment>
                    );
                  })}
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          /* מצב ריק — קריאה לפעולה */
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
              px: 3,
              bgcolor: '#f8f9fa',
              borderRadius: 3,
              border: '2px dashed #dee2e6',
            }}
          >
            <Typography variant="h2" sx={{ mb: 1 }}>✈️</Typography>
            <Typography variant="h6" gutterBottom>
              המסלול שלך ממתין להיווצר
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              לחץ על "צור מסלול חכם" ו-AI יבנה לך תכנית יומית מפורטת
              {destination ? ` ל${destination}` : ''}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AIIcon />}
              onClick={generateAiSuggestions}
              disabled={isGeneratingAiSuggestions || !destination}
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              {isGeneratingAiSuggestions ? 'מייצר...' : 'צור מסלול חכם'}
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  // רינדור ראשי
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          {tripName || 'תכנון טיול חדש'}
        </Typography>
        
        <Box>
          {!completed && activeStep === steps.length - 1 && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleFinish}
              disabled={loading}
            >
              סיים תכנון
            </Button>
          )}
        </Box>
      </Box>
      
      {!completed && (
        <StepperContainer>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </StepperContainer>
      )}
      
      <Box sx={{ mt: 2 }}>
        {renderStep()}
      </Box>
      
      {!completed && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<NavigateBeforeIcon />}
            onClick={handleBack}
            disabled={activeStep === 0 || loading}
          >
            הקודם
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            endIcon={<NavigateNextIcon />}
            onClick={activeStep === steps.length - 1 ? handleFinish : handleNext}
            disabled={loading}
          >
            {activeStep === steps.length - 1 ? 'סיים' : 'הבא'}
          </Button>
        </Box>
      )}
      
      {/* דיאלוג הוספת פעילות */}
      <Dialog
        open={activityDialogOpen}
        onClose={() => {
          setActivityDialogOpen(false);
          setActivityToEdit(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {activityToEdit ? 'עריכת פעילות' : 'הוסף פעילות ליום'}
        </DialogTitle>
        
        <DialogContent dividers>
          {!activityToEdit && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                בחר פעילות
              </Typography>
              
              <Autocomplete
                options={recommendedAttractions}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={selectedAttraction}
                onChange={(e, newValue) => setSelectedAttraction(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="פעילות"
                    fullWidth
                    variant="outlined"
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getCategoryIcon(option.category)}   
                      <Box sx={{ ml: 1 }}>
                        <Typography variant="body1">{option.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {option.duration} דקות | {option.price}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              />
              
              <Box sx={{ mt: 2 }}>
                <TextField
                  select
                  fullWidth
                  label="הוסף ליום"
                  value={dayToAddActivity !== null ? dayToAddActivity : ''}
                  onChange={(e) => setDayToAddActivity(parseInt(e.target.value, 10))}
                  variant="outlined"
                >
                  {itinerary.map((day, index) => (
                    <MenuItem key={index} value={index}>
                      {day.title} - {new Date(day.date).toLocaleDateString('he-IL')}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>
          )}
          
          {(selectedAttraction || activityToEdit) && (
            <Box>
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                פרטי פעילות
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="שם הפעילות"
                    defaultValue={(activityToEdit || selectedAttraction)?.name}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="שעת התחלה"
                    type="time"
                    defaultValue={(activityToEdit || selectedAttraction)?.startTime || '09:00'}
                    variant="outlined"
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="משך זמן (דקות)"
                    type="number"
                    defaultValue={(activityToEdit || selectedAttraction)?.duration || 60}
                    variant="outlined"
                    InputProps={{
                      inputProps: { min: 15, step: 15 },
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="הערות"
                    multiline
                    rows={3}
                    defaultValue={(activityToEdit || selectedAttraction)?.notes || ''}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button
            onClick={() => {
              setActivityDialogOpen(false);
              setActivityToEdit(null);
              setSelectedAttraction(null);
            }}
          >
            ביטול
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              if (activityToEdit) {
                updateActivity(dayToAddActivity, activityToEdit.id, {
                  ...activityToEdit,
                  startTime: document.querySelector('input[type="time"]').value,
                  duration: parseInt(document.querySelectorAll('input[type="number"]')[0].value, 10),
                  notes: document.querySelector('textarea').value
                });
              } else if (selectedAttraction && dayToAddActivity !== null) {
                addActivityToDay(dayToAddActivity, {
                  ...selectedAttraction,
                  startTime: document.querySelector('input[type="time"]').value,
                  duration: parseInt(document.querySelectorAll('input[type="number"]')[0].value, 10),
                  notes: document.querySelector('textarea').value
                });
              }
              
              setActivityDialogOpen(false);
              setActivityToEdit(null);
              setSelectedAttraction(null);
            }}
            disabled={!selectedAttraction && !activityToEdit}
          >
            {activityToEdit ? 'עדכן' : 'הוסף'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* דיאלוג שיתוף */}
      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          שיתוף טיול
        </DialogTitle>
        
        <DialogContent dividers>
          <Typography variant="body1" gutterBottom>
            בחר את האפשרות המועדפת לשיתוף הטיול
          </Typography>
          
          <List>
            <ListItem button onClick={() => {
              setShareDialogOpen(false);
              setSnackbarMessage('הטיול שותף בוואטסאפ');
              setSnackbarOpen(true);
            }}>
              <ListItemIcon>
                <LanguageIcon style={{ color: '#25D366' }} />
              </ListItemIcon>
              <ListItemText primary="וואטסאפ" secondary="שלח את הטיול לחברים או לקבוצה" />
            </ListItem>
            
            <ListItem button onClick={() => {
              setShareDialogOpen(false);
              setSnackbarMessage('הטיול שותף באימייל');
              setSnackbarOpen(true);
            }}>
              <ListItemIcon>
                <QuestionAnswer style={{ color: '#DB4437' }} />
              </ListItemIcon>
              <ListItemText primary="אימייל" secondary="שלח את פרטי הטיול בדוא״ל" />
            </ListItem>
            
            <ListItem button onClick={() => {
              setShareDialogOpen(false);
              setSnackbarMessage('קישור הטיול הועתק ללוח');
              setSnackbarOpen(true);
            }}>
              <ListItemIcon>
                <CopyIcon style={{ color: '#1976D2' }} />
              </ListItemIcon>
              <ListItemText primary="העתק קישור" secondary="העתק קישור לשיתוף הטיול" />
            </ListItem>
            
            <ListItem button onClick={() => {
              setShareDialogOpen(false);
              exportToPdf();
            }}>
              <ListItemIcon>
                <DownloadIcon style={{ color: '#FF5722' }} />
              </ListItemIcon>
              <ListItemText primary="יצוא ל-PDF" secondary="הורד את הטיול כקובץ PDF" />
            </ListItem>
          </List>
        </DialogContent>
        
        <DialogActions>
          <Button
            onClick={() => setShareDialogOpen(false)}
          >
            סגור
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* תפריט יום */}
      <Menu
        anchorEl={dayMenuAnchor}
        open={Boolean(dayMenuAnchor)}
        onClose={handleDayMenuClose}
      >
        <MenuItem onClick={() => {
          const newTitle = prompt('הכנס כותרת חדשה:', itinerary[selectedDayForMenu]?.title);
          if (newTitle) {
            handleDayTitleChange(selectedDayForMenu, newTitle);
          }
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>שנה כותרת</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleClearDay(selectedDayForMenu)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>נקה יום</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleShareDay(selectedDayForMenu)}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>שתף יום זה</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Snackbar להודעות */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        action={
          <IconButton size="small" color="inherit" onClick={() => setSnackbarOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
      
      {/* Backdrop לטעינה */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Container>
  );
};

export default TripPlanner;
