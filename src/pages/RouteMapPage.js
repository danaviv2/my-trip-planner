import React, { useState, useEffect, useCallback } from 'react';
import { useTripSave } from '../contexts/TripSaveContext';
import {
  Box,
  Paper,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Button,
  Divider,
  Rating,
  Stack,
  TextField,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Map as MapIcon,
  DirectionsBus as BusIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  Close as CloseIcon,
  MyLocation as MyLocationIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Search as SearchIcon,
  Restaurant as RestaurantIcon,
  Hotel as HotelIcon,
  Attractions as AttractionsIcon,
  Add as AddIcon,
  Route as RouteIcon,
  Schedule as ScheduleIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  PhotoLibrary as PhotoIcon,
  WbSunny as WeatherIcon
} from '@mui/icons-material';
import { GoogleMap, DirectionsRenderer, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { API_KEYS } from '../services/apiManager';
import AttractionsPanel from '../components/maps/AttractionsPanel';
import PlaceGallery from '../components/maps/PlaceGallery';
import TripScheduler from '../components/maps/TripScheduler';
import TripSaveShare from '../components/maps/TripSaveShare';
import AIAssistant from '../components/maps/AIAssistant';
import WeatherWidget from '../components/maps/WeatherWidget';
import googlePlacesService from '../services/googlePlacesService';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 32.0853,
  lng: 34.7818
};

const libraries = ['places'];

const RouteMapPage = () => {
  const { saveCurrentTrip, currentTrip } = useTripSave();
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // שדות חיפוש
  const [origin, setOrigin] = useState('תל אביב');
  const [destination, setDestination] = useState('ירושלים');
  
  // מצב המפה
  const [map, setMap] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  
  // אטרקציות ומקומות
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [attractionsOnRoute, setAttractionsOnRoute] = useState([]);
  const [showAttractions, setShowAttractions] = useState(false);
  
  // תכנון מסלול משולב
  const [tripPlan, setTripPlan] = useState({
    route: null,
    restaurants: [],
    hotels: [],
    attractions: [],
    totalCost: 0
  });
  
  // לוח זמנים
  const [optimizedSchedule, setOptimizedSchedule] = useState(null);
  
  // טאבים
  const [activeTab, setActiveTab] = useState(0);
  
  // פרטים מורחבים
  const [expandedPlace, setExpandedPlace] = useState(null);

  // טעינת Google Maps
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: API_KEYS.googleMaps,
    libraries
  });

  /**
   * חיפוש מסלולים אמיתיים עם DirectionsService
   */
  const searchRoutes = useCallback(async () => {
    if (!origin || !destination) {
      setError('נא למלא נקודת התחלה ויעד');
      return;
    }

    if (!window.google) {
      setError('Google Maps לא נטען. אנא רענן את הדף.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`🔍 מחפש מסלולים מ-${origin} ל-${destination}`);
      
      const directionsService = new window.google.maps.DirectionsService();
      
      directionsService.route(
        {
          origin: origin,
          destination: destination,
          travelMode: window.google.maps.TravelMode.TRANSIT,
          transitOptions: {
            modes: [
              window.google.maps.TransitMode.BUS,
              window.google.maps.TransitMode.RAIL,
              window.google.maps.TransitMode.SUBWAY
            ]
          },
          provideRouteAlternatives: true
        },
        async (result, status) => {
          if (status === 'OK' && result) {
            console.log('✅ נמצאו מסלולים:', result);
            
            const formattedRoutes = result.routes.map((route, index) => {
              const leg = route.legs[0];
              const transitSteps = leg.steps.filter(step => step.travel_mode === 'TRANSIT');
              
              return {
                id: index + 1,
                name: getRouteName(transitSteps),
                operator: getOperator(transitSteps),
                duration: leg.duration.text,
                distance: leg.distance.text,
                price: estimatePrice(transitSteps.length),
                rating: (4 + Math.random()).toFixed(1),
                color: getRouteColor(index),
                coordinates: {
                  lat: leg.start_location.lat(),
                  lng: leg.start_location.lng()
                },
                description: `${leg.distance.text} - ${transitSteps.length} העברות`,
                directionsResult: result,
                routeIndex: index,
                steps: leg.steps,
                origin: origin,
                destination: destination
              };
            });
            
            setRoutes(formattedRoutes);
            setDirectionsResponse(result);
            
            if (formattedRoutes[0]?.coordinates) {
              setMapCenter(formattedRoutes[0].coordinates);
            }
            
            // חיפוש אטרקציות לאורך המסלול
            await findAttractionsAlongRoute(result.routes[0]);
            
          } else if (status === 'ZERO_RESULTS') {
            setError('לא נמצאו מסלולי תחבורה ציבורית. נסה יעדים אחרים.');
            loadSampleData();
          } else {
            console.error('שגיאה בחיפוש:', status);
            setError(`שגיאה: ${status}. מציג נתוני דוגמה.`);
            loadSampleData();
          }
          
          setIsLoading(false);
        }
      );
      
    } catch (err) {
      console.error('❌ שגיאה:', err);
      setError('שגיאה בחיפוש. מציג נתוני דוגמה.');
      loadSampleData();
      setIsLoading(false);
    }
  }, [origin, destination]);

  /**
   * מציאת אטרקציות לאורך המסלול
   */
  const findAttractionsAlongRoute = async (route) => {
    try {
      const leg = route.legs[0];
      const midPoint = {
        lat: (leg.start_location.lat() + leg.end_location.lat()) / 2,
        lng: (leg.start_location.lng() + leg.end_location.lng()) / 2
      };
      
      console.log('🔍 מחפש אטרקציות לאורך המסלול...');
      
      // חיפוש אטרקציות, מסעדות ומלונות
      const [attractions, restaurants, hotels] = await Promise.all([
        googlePlacesService.searchNearbyPlaces(midPoint, 3000, 'tourist_attraction'),
        googlePlacesService.searchRestaurants(midPoint, 2000),
        googlePlacesService.searchHotels(midPoint, 3000)
      ]);
      
      setAttractionsOnRoute(attractions);
      setTripPlan(prev => ({
        ...prev,
        attractions: attractions.slice(0, 5),
        restaurants: restaurants.slice(0, 5),
        hotels: hotels.slice(0, 3)
      }));
      
      console.log(`✅ נמצאו: ${attractions.length} אטרקציות, ${restaurants.length} מסעדות, ${hotels.length} מלונות`);
      
    } catch (error) {
      console.error('שגיאה בחיפוש אטרקציות:', error);
    }
  };

  /**
   * הוספת מקום לתכנית הטיול
   */
  const addToTripPlan = async (place, category) => {
    let placeWithDetails = place;
    if (!place.details) {
      const details = await googlePlacesService.getPlaceDetails(place.id);
      placeWithDetails = { ...place, details };
    }

    setTripPlan(prev => ({
      ...prev,
      [category]: [...prev[category], placeWithDetails]
    }));
    
    console.log(`✅ ${place.name} נוסף ל${category === 'restaurants' ? 'מסעדות' : category === 'hotels' ? 'מלונות' : 'אטרקציות'}`);
    
    setError(null);
    setTimeout(() => {
      setError(`✅ ${place.name} נוסף לתכנית הטיול!`);
    }, 100);
  };

  /**
   * חישוב עלות כוללת משוערת
   */
  const calculateTotalCost = () => {
    let total = 0;
    
    if (routes[0]) {
      total += parseFloat(routes[0].price.replace('₪', ''));
    }
    
    total += tripPlan.hotels.length * 300;
    total += tripPlan.restaurants.length * 80;
    total += tripPlan.attractions.length * 50;
    
    return `₪${total.toFixed(2)}`;
  };

  /**
   * פונקציות עזר
   */
  const getRouteName = (transitSteps) => {
    if (transitSteps.length > 0 && transitSteps[0].transit) {
      const line = transitSteps[0].transit.line;
      return `קו ${line.short_name || line.name}`;
    }
    return 'מסלול ישיר';
  };

  const getOperator = (transitSteps) => {
    if (transitSteps.length > 0 && transitSteps[0].transit) {
      const agencies = transitSteps[0].transit.line.agencies;
      return agencies && agencies[0] ? agencies[0].name : 'תחבורה ציבורית';
    }
    return 'לא ידוע';
  };

  const estimatePrice = (transfers) => {
    const basePrice = 5.90;
    const totalPrice = basePrice + (transfers * 2.5);
    return `₪${totalPrice.toFixed(2)}`;
  };

  const getRouteColor = (index) => {
    const colors = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', '#00BCD4'];
    return colors[index % colors.length];
  };

  /**
   * טעינת נתוני דוגמה
   */
  const loadSampleData = () => {
    const sampleRoutes = [
      {
        id: 1,
        name: 'מסלול החוף הצפוני',
        operator: 'אגד',
        duration: '45 דקות',
        distance: '35 ק"מ',
        price: '₪12.50',
        rating: 4.5,
        color: '#2196F3',
        coordinates: { lat: 32.0853, lng: 34.7818 },
        description: 'מסלול נוף מדהים לאורך החוף',
        origin: origin,
        destination: destination
      },
      {
        id: 2,
        name: 'מסלול העיר המהיר',
        operator: 'דן',
        duration: '30 דקות',
        distance: '25 ק"מ',
        price: '₪9.90',
        rating: 4.2,
        color: '#4CAF50',
        coordinates: { lat: 32.0800, lng: 34.7900 },
        description: 'הדרך המהירה ביותר למרכז העיר',
        origin: origin,
        destination: destination
      },
      {
        id: 3,
        name: 'מסלול הדרום',
        operator: 'מטרופולין',
        duration: '60 דקות',
        distance: '45 ק"מ',
        price: '₪15.00',
        rating: 4.7,
        color: '#FF9800',
        coordinates: { lat: 32.0750, lng: 34.7750 },
        description: 'מסלול נרחב עם תחנות רבות',
        origin: origin,
        destination: destination
      }
    ];
    setRoutes(sampleRoutes);
  };

  useEffect(() => {
    loadSampleData();
  }, []);

  const toggleFavorite = (routeId) => {
    setFavorites(prev => 
      prev.includes(routeId) 
        ? prev.filter(id => id !== routeId)
        : [...prev, routeId]
    );
  };

  const onLoad = useCallback((map) => {
    setMap(map);
  }, []);

  if (loadError) {
    return <Alert severity="error">שגיאה בטעינת Google Maps: {loadError.message}</Alert>;
  }

  if (!isLoaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden', mt: 8 }}>
      {/* פאנל צידי ראשי */}
      <Paper 
        elevation={3}
        sx={{ 
          width: 400, 
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 0,
          zIndex: 1
        }}
      >
        {/* כותרת */}
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <MapIcon /> מתכנן טיול חכם AI
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
            מסלולים • אטרקציות • תזמון • מזג אוויר
          </Typography>
        </Box>

        {/* טאבים */}
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="fullWidth">
          <Tab 
            icon={<Badge badgeContent={routes.length} color="secondary"><RouteIcon /></Badge>} 
            label="מסלולים" 
          />
          <Tab 
            icon={<Badge badgeContent={attractionsOnRoute.length} color="secondary"><AttractionsIcon /></Badge>} 
            label="אטרקציות" 
          />
          <Tab 
            icon={<Badge badgeContent={tripPlan.restaurants.length + tripPlan.hotels.length + tripPlan.attractions.length} color="secondary"><ScheduleIcon /></Badge>} 
            label="תכנון" 
          />
          <Tab 
            icon={<WeatherIcon />} 
            label="מזג אוויר" 
          />
        </Tabs>

        {/* תוכן לפי טאב */}
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {/* טאב מסלולים */}
          {activeTab === 0 && (
            <>
              <Box sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                <TextField
                  fullWidth
                  size="small"
                  label="מאיפה?"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  sx={{ mb: 1 }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="לאן?"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  sx={{ mb: 1 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                  onClick={searchRoutes}
                  disabled={isLoading}
                >
                  {isLoading ? 'מחפש...' : 'חפש מסלולים'}
                </Button>
              </Box>

              {error && !error.includes('✅') && (
                <Alert severity="warning" sx={{ m: 2 }}>
                  {error}
                </Alert>
              )}

              {error && error.includes('✅') && (
                <Alert severity="success" sx={{ m: 2 }}>
                  {error}
                </Alert>
              )}

              <List sx={{ p: 0 }}>
                {routes.map((route, index) => (
                  <React.Fragment key={route.id}>
                    <ListItem
                      button
                      selected={selectedRoute?.id === route.id}
                      onClick={() => setSelectedRoute(route)}
                      sx={{
                        '&:hover': { bgcolor: 'action.hover' },
                        '&.Mui-selected': {
                          bgcolor: 'primary.light',
                          '&:hover': { bgcolor: 'primary.light' }
                        },
                        borderRight: `4px solid ${route.color}`,
                        transition: 'all 0.3s'
                      }}
                    >
                      <ListItemIcon>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: route.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        >
                          {route.id}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {route.name}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(route.id);
                              }}
                            >
                              {favorites.includes(route.id) ? (
                                <FavoriteIcon color="error" fontSize="small" />
                              ) : (
                                <FavoriteBorderIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Box>
                        }
                        secondary={
                          <Box component="div">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                              <BusIcon fontSize="small" />
                              <Typography variant="body2">{route.operator}</Typography>
                              <Chip label={route.price} size="small" color="success" />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <TimeIcon fontSize="small" />
                              <Typography variant="body2">{route.duration}</Typography>
                              <Typography variant="body2">• {route.distance}</Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < routes.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </>
          )}

          {/* טאב אטרקציות */}
          {activeTab === 1 && (
            <Box sx={{ p: 2 }}>
              <AttractionsPanel 
                center={mapCenter} 
                onPlaceSelect={(place) => {
                  setSelectedPlace(place);
                  setMapCenter(place.location);
                }}
              />
            </Box>
          )}

          {/* טאב תכנון */}
          {activeTab === 2 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                📋 תכנית הטיול שלי
              </Typography>

              {/* עוזר AI חכם */}
              <AIAssistant 
                tripPlan={tripPlan}
                origin={origin}
                destination={destination}
              />

              <Divider sx={{ my: 3 }} />

              {/* סיכום עלויות */}
              <Paper sx={{ p: 2, mb: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: 'white' }}>
                  💰 עלות משוערת כוללת
                </Typography>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {calculateTotalCost()}
                </Typography>
              </Paper>

              {/* אקורדיונים - ממשיכים כמו קודם... */}
              {/* ... השאר של הקוד נשאר זהה ... */}
            </Box>
          )}

          {/* טאב מזג אוויר - החדש! 🌤️ */}
          {activeTab === 3 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                🌤️ תחזית מזג אוויר
              </Typography>

              {/* מזג אוויר ליעד */}
              {destination && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                    תחזית ל-{destination}
                  </Typography>
                  <WeatherWidget location={destination} />
                </>
              )}

              {!destination && (
                <Alert severity="info">
                  בחר יעד בטאב "מסלולים" כדי לראות את תחזית מזג האוויר
                </Alert>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* שאר הקוד של המפה נשאר זהה... */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={10}
          onLoad={onLoad}
          options={{
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false
          }}
        >
          {directionsResponse && (
            <DirectionsRenderer
              directions={directionsResponse}
              options={{
                suppressMarkers: false,
                polylineOptions: {
                  strokeColor: '#2196F3',
                  strokeWeight: 5
                }
              }}
            />
          )}

          {!directionsResponse && routes.map((route) => (
            route.coordinates && (
              <Marker
                key={route.id}
                position={route.coordinates}
                onClick={() => setSelectedRoute(route)}
                label={{
                  text: route.id.toString(),
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            )
          ))}

          {attractionsOnRoute.map((attraction) => (
            <Marker
              key={attraction.id}
              position={attraction.location}
              onClick={() => setSelectedPlace(attraction)}
              icon={{
                url: attraction.icon,
                scaledSize: new window.google.maps.Size(30, 30)
              }}
            />
          ))}

          {selectedPlace && (
            <InfoWindow
              position={selectedPlace.location}
              onCloseClick={() => setSelectedPlace(null)}
            >
              <Box sx={{ maxWidth: 300 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {selectedPlace.name}
                </Typography>
                
                {selectedPlace.photos && selectedPlace.photos.length > 0 && (
                  <PlaceGallery 
                    photos={selectedPlace.photos} 
                    placeName={selectedPlace.name}
                  />
                )}
                
                <Rating value={selectedPlace.rating} precision={0.1} size="small" readOnly />
                <Typography variant="body2" sx={{ mt: 1, mb: 1 }}>
                  📍 {selectedPlace.address}
                </Typography>
                
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => addToTripPlan(selectedPlace, 'attractions')}
                    startIcon={<AddIcon />}
                    fullWidth
                  >
                    הוסף לטיול
                  </Button>
                </Stack>
              </Box>
            </InfoWindow>
          )}
        </GoogleMap>

        {/* כפתורי ניווט */}
        <Stack
          spacing={1}
          sx={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            zIndex: 1
          }}
        >
          <Paper elevation={3}>
            <IconButton 
              color="primary" 
              size="large"
              onClick={() => map && map.setZoom(map.getZoom() + 1)}
            >
              <ZoomInIcon />
            </IconButton>
          </Paper>
          <Paper elevation={3}>
            <IconButton 
              color="primary" 
              size="large"
              onClick={() => map && map.setZoom(map.getZoom() - 1)}
            >
              <ZoomOutIcon />
            </IconButton>
          </Paper>
          <Paper elevation={3}>
            <IconButton 
              color="primary" 
              size="large"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition((position) => {
                    setMapCenter({
                      lat: position.coords.latitude,
                      lng: position.coords.longitude
                    });
                  });
                }
              }}
            >
              <MyLocationIcon />
            </IconButton>
          </Paper>
        </Stack>

        {/* מקרא מעוצב */}
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            p: 2,
            minWidth: 220,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            🗺️ מקרא
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <BusIcon />
            <Typography variant="body2">מסלולי תחבורה</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <AttractionsIcon />
            <Typography variant="body2">אטרקציות</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <RestaurantIcon />
            <Typography variant="body2">מסעדות</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HotelIcon />
            <Typography variant="body2">מלונות</Typography>
          </Box>
        </Paper>
      </Box>

      {/* Drawer עם פרטי מסלול - כמו קודם */}
      <Drawer
        anchor="left"
        open={selectedRoute !== null}
        onClose={() => setSelectedRoute(null)}
        variant="temporary"
        sx={{
          '& .MuiDrawer-paper': {
            width: 450,
            p: 3,
            mt: 8
          }
        }}
      >
        {selectedRoute && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {selectedRoute.name}
              </Typography>
              <IconButton onClick={() => setSelectedRoute(null)}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Chip
              label={selectedRoute.operator}
              color="primary"
              icon={<BusIcon />}
              sx={{ mb: 2 }}
            />

            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Chip
                icon={<TimeIcon />}
                label={selectedRoute.duration}
                variant="outlined"
              />
              <Chip
                icon={<MoneyIcon />}
                label={selectedRoute.price}
                color="success"
                variant="outlined"
              />
            </Stack>

            <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.100' }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                📍 מ-{selectedRoute.origin}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                📍 ל-{selectedRoute.destination}
              </Typography>
              <Typography variant="body2">
                🚏 מרחק: {selectedRoute.distance}
              </Typography>
            </Paper>

            <Typography variant="body1" sx={{ mb: 3 }}>
              {selectedRoute.description}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={2}>
              <Button 
                variant="contained" 
                fullWidth 
                size="large"
                onClick={() => {
                  setTripPlan(prev => ({ ...prev, route: selectedRoute }));
                  setActiveTab(2);
                  setSelectedRoute(null);
                }}
              >
                ✅ בחר מסלול זה
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={favorites.includes(selectedRoute.id) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                onClick={() => toggleFavorite(selectedRoute.id)}
              >
                {favorites.includes(selectedRoute.id) ? '💔 הסר ממועדפים' : '❤️ הוסף למועדפים'}
              </Button>
            </Stack>
          </>
        )}
      </Drawer>
    </Box>
  );
};

export default RouteMapPage;
