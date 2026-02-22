// src/components/maps/InteractiveMap.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Paper, Typography, IconButton, 
  Chip, Tooltip, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Slide, Zoom, Fab, Alert
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import HotelIcon from '@mui/icons-material/Hotel';
import AttractionsIcon from '@mui/icons-material/Attractions';
import NatureIcon from '@mui/icons-material/Nature';
import MuseumIcon from '@mui/icons-material/Museum';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

/**
 * קומפוננטת מפה אינטראקטיבית משופרת
 * תומכת בסינון מקומות, נתיבים, איתור מיקום ועוד
 */
const InteractiveMap = ({ 
  initialCenter = { lat: 32.0853, lng: 34.7818 }, // תל אביב כברירת מחדל
  initialZoom = 12,
  markers = [],
  routes = [],
  onMarkerClick,
  onRouteClick,
  onMapClick,
  height = '600px',
  allowFullscreen = true,
  showFilters = true
}) => {
  // רפרנס למפה עצמה
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const routesRef = useRef({});
  
  // משתני מצב
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapType, setMapType] = useState('roadmap');
  const [visibleCategories, setVisibleCategories] = useState([
    'restaurant', 'hotel', 'attraction', 'nature', 'museum'
  ]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showControls, setShowControls] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState(null);
  
  // קטגוריות אפשריות לסינון
  const categories = [
    { id: 'restaurant', label: 'מסעדות' },
    { id: 'hotel', label: 'מלונות' },
    { id: 'attraction', label: 'אטרקציות' },
    { id: 'nature', label: 'טבע' },
    { id: 'museum', label: 'מוזיאונים' }
  ];
  
  // פונקציה להחזרת אייקון לפי מזהה קטגוריה
  const getCategoryIcon = (categoryId) => {
    const iconMap = {
      'restaurant': RestaurantIcon,
      'hotel': HotelIcon,
      'attraction': AttractionsIcon,
      'nature': NatureIcon,
      'museum': MuseumIcon
    };
    
    const IconComponent = iconMap[categoryId] || AttractionsIcon;
    return <IconComponent />;
  };
  
  // סוגי מפות אפשריים
  const mapTypes = [
    { value: 'roadmap', label: 'דרכים' },
    { value: 'satellite', label: 'לוויין' },
    { value: 'hybrid', label: 'היברידי' },
    { value: 'terrain', label: 'טופוגרפי' }
  ];
  
  // אתחול המפה
  useEffect(() => {
    // בדוק אם ה-API של Google Maps כבר נטען
    if (!window.google || !window.google.maps) {
      // אם לא נטען, טען אותו
      loadGoogleMapsAPI();
    } else {
      // אם כבר נטען, אתחל את המפה
      initializeMap();
    }
  }, []);
  
  // טעינת ה-API של Google Maps
  const loadGoogleMapsAPI = () => {
    // בדיקה שה-script לא נטען כבר
    if (document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) {
      initializeMap();
      return;
    }
    
    const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = initializeMap;
    script.onerror = () => setError('שגיאה בטעינת מפות Google');
    document.head.appendChild(script);
  };
  
  // אתחול המפה
  const initializeMap = () => {
    if (!mapRef.current || !window.google || !window.google.maps) return;
    
    try {
      // יצירת אובייקט מפה
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        mapTypeId: mapType,
        fullscreenControl: false, // נשלוט בזה בעצמנו
        mapTypeControl: false,    // נשלוט בזה בעצמנו
        streetViewControl: true,
        rotateControl: true,
        zoomControl: true,
        scaleControl: true
      });
      
      // שמירת ההתייחסות למפה
      mapInstanceRef.current = mapInstance;
      
      // הוספת האזנת לחיצה על המפה
      mapInstance.addListener('click', (event) => {
        if (onMapClick) {
          onMapClick({
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          });
        }
      });
      
      // סימון שהמפה נטענה
      setIsMapLoaded(true);
      
      // הוספת סמנים וניתובים
      if (markers.length > 0) {
        addMarkersToMap(markers);
      }
      
      if (routes.length > 0) {
        addRoutesToMap(routes);
      }
    } catch (err) {
      console.error('שגיאה באתחול המפה:', err);
      setError('שגיאה באתחול המפה');
    }
  };
  
  // הוספת סמנים למפה
  const addMarkersToMap = (markersData) => {
    if (!mapInstanceRef.current || !window.google) return;
    
    // נקה סמנים קיימים
    clearMarkers();
    
    markersData.forEach((marker, index) => {
      // בדוק אם הקטגוריה של הסמן גלויה
      if (!visibleCategories.includes(marker.category)) return;
      
      // צור סמן חדש
      const markerIcon = {
        url: marker.icon || getMarkerIconByCategory(marker.category),
        scaledSize: new window.google.maps.Size(32, 32),
        origin: new window.google.maps.Point(0, 0),
        anchor: new window.google.maps.Point(16, 32)
      };
      
      const markerInstance = new window.google.maps.Marker({
        position: { lat: marker.lat, lng: marker.lng },
        map: mapInstanceRef.current,
        title: marker.title,
        icon: markerIcon,
        animation: window.google.maps.Animation.DROP,
        draggable: marker.draggable || false,
        opacity: 0.9
      });
      
      // הוסף חלון מידע
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="direction: rtl; text-align: right;">
            <h3 style="margin: 0 0 8px 0;">${marker.title}</h3>
            ${marker.description ? `<p style="margin: 0 0 8px 0;">${marker.description}</p>` : ''}
            ${marker.image ? `<img src="${marker.image}" alt="${marker.title}" style="width: 100%; max-width: 200px; height: auto;">` : ''}
          </div>
        `
      });
      
      // הוסף אירועי לחיצה לסמן
      markerInstance.addListener('click', () => {
        // סגור חלונות מידע פתוחים
        Object.values(markersRef.current).forEach(m => {
          if (m.infoWindow) {
            m.infoWindow.close();
          }
        });
        
        // פתח חלון מידע
        infoWindow.open(mapInstanceRef.current, markerInstance);
        
        // הפעל פונקציית קולבק אם קיימת
        if (onMarkerClick) {
          onMarkerClick(marker, index);
        }
      });
      
      // שמור התייחסות לסמן
      markersRef.current[marker.id || index] = {
        instance: markerInstance,
        infoWindow: infoWindow,
        data: marker
      };
    });
  };
  
  // הוספת נתיבים למפה
  const addRoutesToMap = (routesData) => {
    if (!mapInstanceRef.current || !window.google) return;
    
    // נקה נתיבים קיימים
    clearRoutes();
    
    routesData.forEach((route, index) => {
      // צור נתיב
      const routePath = new window.google.maps.Polyline({
        path: route.path,
        geodesic: true,
        strokeColor: route.color || '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 3
      });
      
      // הוסף את הנתיב למפה
      routePath.setMap(mapInstanceRef.current);
      
      // הוסף אירוע לחיצה
      routePath.addListener('click', () => {
        if (onRouteClick) {
          onRouteClick(route, index);
        }
      });
      
      // שמור התייחסות לנתיב
      routesRef.current[route.id || index] = {
        instance: routePath,
        data: route
      };
    });
  };
  
  // ניקוי סמנים מהמפה
  const clearMarkers = () => {
    Object.values(markersRef.current).forEach(marker => {
      if (marker.instance) {
        marker.instance.setMap(null);
      }
      if (marker.infoWindow) {
        marker.infoWindow.close();
      }
    });
    markersRef.current = {};
  };
  
  // ניקוי נתיבים מהמפה
  const clearRoutes = () => {
    Object.values(routesRef.current).forEach(route => {
      if (route.instance) {
        route.instance.setMap(null);
      }
    });
    routesRef.current = {};
  };
  
  // קבלת אייקון סמן לפי קטגוריה
  const getMarkerIconByCategory = (category) => {
    const defaultIcon = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
    
    switch (category) {
      case 'restaurant':
        return 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png';
      case 'hotel':
        return 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
      case 'attraction':
        return 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png';
      case 'nature':
        return 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';
      case 'museum':
        return 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
      default:
        return defaultIcon;
    }
  };
  
  // שינוי סוג המפה
  const handleMapTypeChange = (event) => {
    const newMapType = event.target.value;
    setMapType(newMapType);
    
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(newMapType);
    }
  };
  
  // שינוי הקטגוריות הגלויות
  const handleCategoryToggle = (category) => {
    if (visibleCategories.includes(category)) {
      setVisibleCategories(visibleCategories.filter(cat => cat !== category));
    } else {
      setVisibleCategories([...visibleCategories, category]);
    }
    
    // עדכון הסמנים בהתאם לקטגוריות הגלויות
    if (markers.length > 0) {
      addMarkersToMap(markers);
    }
  };
  
  // מעבר למסך מלא
  const toggleFullscreen = () => {
    const newFullscreenState = !isFullscreen;
    setIsFullscreen(newFullscreenState);
    
    // שינוי גודל המפה בהתאם למצב מסך מלא
    if (mapInstanceRef.current) {
      window.google.maps.event.trigger(mapInstanceRef.current, 'resize');
    }
  };
  
  // איתור מיקום הנוכחי של המשתמש
  const locateUser = () => {
    if (!navigator.geolocation) {
      setError('מכשירך אינו תומך באיתור מיקום');
      return;
    }
    
    setIsLocating(true);
    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      // הצלחה
      (position) => {
        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setUserLocation(userPos);
        
        // מרכז את המפה למיקום המשתמש
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(userPos);
          mapInstanceRef.current.setZoom(15);
          
          // הוסף סמן למיקום המשתמש
          if (window.google && window.google.maps) {
            new window.google.maps.Marker({
              position: userPos,
              map: mapInstanceRef.current,
              title: 'המיקום שלך',
              icon: {
                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                scaledSize: new window.google.maps.Size(40, 40),
                origin: new window.google.maps.Point(0, 0),
                anchor: new window.google.maps.Point(20, 20)
              },
              animation: window.google.maps.Animation.BOUNCE
            });
          }
        }
        
        setIsLocating(false);
      },
      // שגיאה
      (error) => {
        console.error('שגיאה באיתור מיקום:', error);
        setError('לא ניתן לאתר את מיקומך. אנא אשר גישה למיקום.');
        setIsLocating(false);
      },
      // אפשרויות
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };
  
  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {/* תצוגת שגיאה */}
      {error && (
        <Zoom in={!!error}>
          <Alert 
            severity="error" 
            onClose={() => setError(null)}
            sx={{ 
              position: 'absolute', 
              top: 10, 
              left: '50%', 
              transform: 'translateX(-50%)',
              zIndex: 10,
              maxWidth: '80%'
            }}
          >
            {error}
          </Alert>
        </Zoom>
      )}
      
      {/* מפה */}
      <Box
        ref={mapRef}
        sx={{
          width: '100%',
          height: isFullscreen ? '100vh' : height,
          borderRadius: isFullscreen ? 0 : '8px',
          position: isFullscreen ? 'fixed' : 'relative',
          top: isFullscreen ? 0 : 'auto',
          left: isFullscreen ? 0 : 'auto',
          right: isFullscreen ? 0 : 'auto',
          bottom: isFullscreen ? 0 : 'auto',
          zIndex: isFullscreen ? 1300 : 1,
          transition: 'all 0.3s ease'
        }}
      />
      
      {/* סרגל כלים של המפה */}
      <Slide in={showControls} direction="up">
        <Paper
          sx={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: isFullscreen ? 1301 : 2,
            borderRadius: '24px',
            boxShadow: 3,
            p: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}
        >
          {/* כפתור סוג מפה */}
          <FormControl size="small" variant="standard" sx={{ minWidth: 100 }}>
            <Select
              value={mapType}
              onChange={handleMapTypeChange}
              displayEmpty
              renderValue={(value) => {
                const selectedType = mapTypes.find(type => type.value === value);
                return selectedType ? selectedType.label : 'סוג מפה';
              }}
              sx={{ '& .MuiSelect-select': { px: 1, py: 0.5 } }}
            >
              {mapTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* כפתור סינון קטגוריות */}
          {showFilters && (
            <Box sx={{ px: 1, borderRight: '1px solid #eee', borderLeft: '1px solid #eee' }}>
              <Tooltip title="סינון על פי קטגוריות">
                <IconButton
                  color="primary"
                  onClick={() => setSelectedFilter(selectedFilter === 'categories' ? null : 'categories')}
                >
                  <FilterAltIcon />
                </IconButton>
              </Tooltip>
            </Box>
          )}
          
          {/* כפתור איתור מיקום */}
          <Tooltip title="איתור מיקום נוכחי">
            <IconButton 
              color="primary" 
              onClick={locateUser}
              disabled={isLocating}
            >
              {isLocating ? <CircularProgress size={24} /> : <MyLocationIcon />}
            </IconButton>
          </Tooltip>
          
          {/* כפתור מסך מלא */}
          {allowFullscreen && (
            <Tooltip title={isFullscreen ? 'יציאה ממסך מלא' : 'מסך מלא'}>
              <IconButton color="primary" onClick={toggleFullscreen}>
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>
          )}
        </Paper>
      </Slide>
      
      {/* פופ-אפ סינון קטגוריות */}
      {selectedFilter === 'categories' && (
        <Zoom in={selectedFilter === 'categories'}>
          <Paper
            sx={{
              position: 'absolute',
              bottom: 80,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: isFullscreen ? 1301 : 2,
              borderRadius: '12px',
              boxShadow: 3,
              p: 2,
              minWidth: 280
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              הצג מקומות לפי קטגוריה:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  icon={getCategoryIcon(category.id)}
                  label={category.label}
                  color={visibleCategories.includes(category.id) ? 'primary' : 'default'}
                  onClick={() => handleCategoryToggle(category.id)}
                  variant={visibleCategories.includes(category.id) ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Paper>
        </Zoom>
      )}
      
      {/* כפתור צף להוספת מיקום */}
      <Fab
        color="primary"
        sx={{
          position: 'absolute',
          bottom: 80,
          right: 20,
          zIndex: isFullscreen ? 1301 : 2
        }}
        onClick={() => {
          if (onMapClick && mapInstanceRef.current) {
            // שימוש במרכז המפה הנוכחי
            const center = mapInstanceRef.current.getCenter();
            onMapClick({
              lat: center.lat(),
              lng: center.lng(),
              addMode: true
            });
          }
        }}
      >
        <AddLocationIcon />
      </Fab>
    </Box>
  );
};

export default InteractiveMap;