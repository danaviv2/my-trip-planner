import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Tabs, 
  Tab, 
  Autocomplete,
  CircularProgress,
  Card,
  CardMedia,
  CardContent,
  Divider,
  Chip,
  IconButton,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Fade,
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import InfoIcon from '@mui/icons-material/Info';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import DirectionsIcon from '@mui/icons-material/Directions';
import HistoryIcon from '@mui/icons-material/History';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import GitHubIcon from '@mui/icons-material/GitHub';
import AddRoadIcon from '@mui/icons-material/AddRoad';
import DeleteIcon from '@mui/icons-material/Delete';

import InteractiveMap from '../components/maps/InteractiveMap'
import DestinationInfo from '../components/DestinationInfo';
import { fetchWeatherForecast, fetchGeoInfo } from '../components/WeatherForecast';
import { useTripContext } from '../contexts/TripContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
// יעדים פופולריים לחיפוש מהיר
const popularDestinations = [
  'פריז, צרפת',
  'בורדו, צרפת',
  'ניו יורק, ארה"ב',
  'רומא, איטליה',
  'ברצלונה, ספרד',
  'לונדון, בריטניה',
  'ברלין, גרמניה',
  'אמסטרדם, הולנד',
  'וינה, אוסטריה',
  'אתונה, יוון',
  'ירושלים, ישראל',
  'תל אביב, ישראל',
  'אילת, ישראל',
  'חיפה, ישראל',
  'דובאי, איחוד האמירויות',
  'טוקיו, יפן',
  'בנגקוק, תאילנד',
  'סידני, אוסטרליה',
  'ניו דלהי, הודו',
  'ריו דה ז׳נרו, ברזיל',
  'קייפטאון, דרום אפריקה'
];

const MapPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { tripData, updateOrigin, updateDestination, addWaypoint, removeWaypoint } = useTripContext();
  const { favoriteDestinations, addFavoriteDestination, removeFavoriteDestination } = useUserPreferences();
  
  const [destination, setDestination] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showDestinationInfo, setShowDestinationInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tripMode, setTripMode] = useState(false);
  
  // עדכון חיפושים אחרונים מהלוקל סטורג'
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches));
      } catch (err) {
        console.error('שגיאה בטעינת חיפושים אחרונים:', err);
      }
    }
  }, []);
  
  // שמירת חיפושים אחרונים ללוקל סטורג'
  useEffect(() => {
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
  }, [recentSearches]);
  
  // הוספת יעד לחיפושים אחרונים
  const addToRecentSearches = (location) => {
    if (!location) return;
    
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item !== location);
      return [location, ...filtered].slice(0, 5);
    });
  };
  
  // טיפול בשינוי יעד
  const handleDestinationChange = (newDestination) => {
    if (!newDestination) return;
    
    setDestination(newDestination);
    setSearchInput(newDestination);
    addToRecentSearches(newDestination);
    
    if (tripMode) {
      if (!tripData?.origin) {
        updateOrigin(newDestination);
      } else if (!tripData?.destination) {
        updateDestination(newDestination);
      } else {
        addWaypoint(newDestination);
      }
    }
  };
  
  // טיפול בחיפוש
  const handleSearch = () => {
    if (searchInput.trim()) {
      setDestination(searchInput.trim());
      addToRecentSearches(searchInput.trim());
    }
  };
  
  // טיפול בשינוי לשונית
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // אם לחצו על לשונית 'מידע על היעד', פתח את חלון המידע
    if (newValue === 1 && destination) {
      setShowDestinationInfo(true);
    } else {
      setShowDestinationInfo(false);
    }
  };
  
  // טיפול בהוספה/הסרה ממועדפים
  const toggleFavorite = (dest) => {
    if (favoriteDestinations.includes(dest)) {
      removeFavoriteDestination(dest);
    } else {
      addFavoriteDestination(dest);
    }
  };
  
  // בדיקה אם יעד הוא במועדפים
  const isFavorite = (dest) => {
    return favoriteDestinations && favoriteDestinations.includes(dest);
  };
  
  // איפוס נתוני הטיול
  const handleResetTrip = () => {
  };
  
  return (
    <Container maxWidth="xl" sx={{ py: 4, direction: 'rtl' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ 
          display: 'flex', 
          alignItems: 'center',
          fontWeight: 700,
          color: theme.palette.primary.main
        }}>
          <TravelExploreIcon sx={{ mr: 1, fontSize: 32 }} />
          מפה וחיפוש יעדים
        </Typography>
        <Typography variant="body1" color="text.secondary">
          חפש יעדים, קבל מידע מפורט, וצפה בתחזית מזג האוויר לתכנון הטיול המושלם.
        </Typography>
      </Box>
      
      {/* תיבת חיפוש יעד */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: '12px',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              חיפוש יעד
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'stretch', mb: 2 }}>
              <Autocomplete
                freeSolo
                options={popularDestinations}
                value={searchInput}
                onChange={(event, newValue) => {
                  setSearchInput(newValue || '');
                }}
                onInputChange={(event, newValue) => {
                  setSearchInput(newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    placeholder="הזן שם עיר או יעד..."
                    variant="outlined"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOnIcon color="action" />
                        </InputAdornment>
                      )
                    }}
                  />
                )}
                sx={{ flexGrow: 1, mr: 1 }}
              />
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSearch}
                startIcon={<SearchIcon />}
                sx={{ 
                  height: 'auto',
                  px: 3,
                  borderRadius: '8px',
                  fontWeight: 'bold'
                }}
              >
                חפש
              </Button>
            </Box>
            
            {/* יעדים פופולריים ומועדפים */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                יעדים פופולריים:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {popularDestinations.slice(0, isMobile ? 3 : 5).map((dest) => (
                  <Chip 
                    key={dest} 
                    label={dest}
                    clickable
                    onClick={() => {
                      setSearchInput(dest);
                      setDestination(dest);
                      addToRecentSearches(dest);
                    }}
                    icon={<LocationOnIcon />}
                    sx={{ borderRadius: '8px' }}
                  />
                ))}
              </Box>
              
              {/* חיפושים אחרונים */}
              {recentSearches && recentSearches.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <HistoryIcon fontSize="small" sx={{ mr: 0.5 }} />
                    חיפושים אחרונים:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {recentSearches.map((search, index) => (
                      <Chip 
                        key={index}
                        label={search}
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setSearchInput(search);
                          setDestination(search);
                        }}
                        onDelete={() => {
                          setRecentSearches(prev => prev.filter(item => item !== search));
                        }}
                        sx={{ borderRadius: '8px' }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
              
              {/* יעדים מועדפים */}
              {favoriteDestinations && favoriteDestinations.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <FavoriteIcon fontSize="small" sx={{ mr: 0.5, color: theme.palette.error.main }} />
                    יעדים מועדפים:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {favoriteDestinations.map((dest, index) => (
                      <Chip 
                        key={index}
                        label={dest}
                        color="primary"
                        variant="outlined"
                        icon={<FavoriteIcon color="error" />}
                        onClick={() => {
                          setSearchInput(dest);
                          setDestination(dest);
                        }}
                        sx={{ borderRadius: '8px' }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              תכנון מסלול
            </Typography>
            
            <Paper 
              elevation={1} 
              sx={{ 
                p: 2, 
                borderRadius: '8px',
                bgcolor: tripMode ? 'primary.50' : 'background.default',
                border: tripMode ? `1px solid ${theme.palette.primary.main}` : '1px solid rgba(0,0,0,0.1)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {tripMode ? 'מצב תכנון מסלול פעיל' : 'תכנון מסלול'}
                </Typography>
                <Button 
                  variant={tripMode ? "contained" : "outlined"} 
                  color={tripMode ? "primary" : "inherit"}
                  size="small"
                  startIcon={<DirectionsIcon />}
                  onClick={() => setTripMode(!tripMode)}
                  sx={{ borderRadius: '20px' }}
                >
                  {tripMode ? 'כבה תכנון' : 'הפעל תכנון'}
                </Button>
              </Box>
              
              {tripMode && (
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      לחץ על המפה או חפש יעדים כדי להוסיף למסלול
                    </Typography>
                    
                    {/* מידע על המסלול */}
                    <Box sx={{ mt: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2">מוצא:</Typography>
                        <Chip 
                          label={tripData?.origin || 'טרם נבחר'} 
                          color={tripData?.origin ? "primary" : "default"}
                          size="small"
                          sx={{ borderRadius: '4px' }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2">יעד:</Typography>
                        <Chip 
                          label={tripData?.destination || 'טרם נבחר'} 
                          color={tripData?.destination ? "primary" : "default"}
                          size="small"
                          sx={{ borderRadius: '4px' }}
                        />
                      </Box>
                      
                      {/* נקודות ביניים */}
                      {tripData?.waypoints && tripData?.waypoints.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2">נקודות ביניים:</Typography>
                          <Box sx={{ mt: 1 }}>
                            {tripData?.waypoints.map((waypoint, index) => (
                              <Box 
                                key={index}
                                sx={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center',
                                  mb: 1
                                }}
                              >
                                <Chip 
                                  label={`${index + 1}. ${waypoint}`} 
                                  size="small"
                                  variant="outlined"
                                  sx={{ borderRadius: '4px', maxWidth: '85%' }}
                                />
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => removeWaypoint(index)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                  
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={handleResetTrip}
                    fullWidth
                    sx={{ mt: 1, borderRadius: '8px' }}
                  >
                    אפס מסלול
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Paper>
      
      {/* לשוניות */}
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange} 
        sx={{ mb: 2 }}
        variant={isMobile ? "fullWidth" : "standard"}
        centered={!isMobile}
        indicatorColor="primary"
        textColor="primary"
      >
        <Tab 
          icon={<LocationOnIcon />} 
          label="מפה" 
          iconPosition="start"
          sx={{ fontWeight: 'bold' }}
        />
        <Tab 
          icon={<InfoIcon />} 
          label="מידע על היעד" 
          iconPosition="start"
          disabled={!destination}
          sx={{ fontWeight: 'bold' }}
        />
        <Tab 
          icon={<WbSunnyIcon />} 
          label="מזג אוויר" 
          iconPosition="start"
          disabled={!destination}
          sx={{ fontWeight: 'bold' }}
        />
      </Tabs>
      
      {/* הצגת שגיאות */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}
      
      {/* תוכן הלשונית הפעילה */}
      <Box sx={{ minHeight: '500px' }}>
        {/* מפה */}
        {activeTab === 0 && (
          <Fade in={activeTab === 0}>
            <Paper elevation={0} sx={{ p: 0, overflow: 'hidden', borderRadius: '12px' }}>
              <InteractiveMap 
                destination={destination} 
                onDestinationChange={handleDestinationChange}
                onAddWaypoint={tripMode ? addWaypoint : undefined}
                height={600}
              />
              
              {destination && (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: 2,
                    borderTop: '1px solid rgba(0,0,0,0.1)'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationOnIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      {destination}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <IconButton 
                      color={isFavorite(destination) ? "error" : "default"}
                      onClick={() => toggleFavorite(destination)}
                    >
                      {isFavorite(destination) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                    </IconButton>
                    
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<InfoIcon />}
                      onClick={() => {
                        setActiveTab(1);
                        setShowDestinationInfo(true);
                      }}
                      sx={{ ml: 1, borderRadius: '8px' }}
                    >
                      מידע על היעד
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>
          </Fade>
        )}
        
        {/* מידע על היעד */}
        {activeTab === 1 && destination && (
          <Fade in={activeTab === 1}>
            <Box>
              <DestinationInfo 
                destination={destination} 
                onClose={() => setActiveTab(0)} 
              />
            </Box>
          </Fade>
        )}
        
        {/* מזג אוויר */}
        {activeTab === 2 && destination && (
          <Fade in={activeTab === 2}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: '12px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
                  <WbSunnyIcon sx={{ mr: 1, color: '#f9a825' }} />
                  תחזית מזג האוויר ב{destination}
                </Typography>
                
                <Box>
                  <IconButton 
                    color={isFavorite(destination) ? "error" : "default"}
                    onClick={() => toggleFavorite(destination)}
                  >
                    {isFavorite(destination) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                  </IconButton>
                </Box>
              </Box>
              
            </Paper>
          </Fade>
        )}
      </Box>
      
      {/* קרדיט בתחתית העמוד */}
      <Box 
        sx={{ 
          mt: 6, 
          pt: 2, 
          borderTop: '1px solid rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'text.secondary',
          fontSize: '0.875rem'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          מערכת תכנון טיולים מתקדמת - פותחה בעזרת Claude AI
        </Typography>
      </Box>
    </Container>
  );
};

export default MapPage;