// src/components/route-planner/RouteMap.js
import React, { useContext, useEffect } from 'react';
import { Box } from '@mui/material';
import { GoogleMap, LoadScript, DirectionsRenderer, InfoWindow, Marker } from '@react-google-maps/api';
import { TripContext } from '../../contexts/TripContext';

// הגדרת הספריות הנדרשות ל-Google Maps
const GOOGLE_MAPS_LIBRARIES = ['places'];

// סגנון מיכל המפה
const mapContainerStyle = {
  height: '500px',
  width: '70%',
  margin: '20px auto',
  borderRadius: '15px',
  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
};

/**
 * RouteMap - קומפוננט המציג את מפת Google עם המסלול והאטרקציות
 */
const RouteMap = () => {
  const { 
    GOOGLE_API_KEY,
    mapRef, onMapLoad, mapCenter,
    directions, 
    selectedAttraction, setSelectedAttraction,
    attractions, activeFilters, markers, setMarkers,
    isMapsLoaded, setIsMapsLoaded
  } = useContext(TripContext);

  // יצירת סמנים לאטרקציות
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

    // יצירת סמנים חדשים
    const newMarkers = filteredAttractions.map((attraction) => {
      // יצירת סמן Google Maps פשוט
      const marker = new window.google.maps.Marker({
        position: { lat: attraction.location.lat, lng: attraction.location.lng },
        map: mapRef.current,
        title: attraction.name,
        animation: window.google.maps.Animation.DROP
      });

      // הוספת אירוע לחיצה על הסמן
      marker.addListener('click', () => setSelectedAttraction(attraction));
      return marker;
    });

    setMarkers(newMarkers);

    // פונקציית ניקוי
    return () => {
      newMarkers.forEach(marker => marker.setMap(null));
    };
  }, [isMapsLoaded, attractions, activeFilters, mapRef, setSelectedAttraction, markers, setMarkers]);

  return (
    <Box mt={4}>
      <LoadScript
        googleMapsApiKey={GOOGLE_API_KEY}
        libraries={GOOGLE_MAPS_LIBRARIES}
        onLoad={() => {
          setIsMapsLoaded(true);
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
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                  {selectedAttraction.name}
                </div>
                <div style={{ color: '#666', marginBottom: '5px' }}>
                  קטגוריה: {selectedAttraction.category}
                </div>
                <div style={{ color: '#666', marginBottom: '5px' }}>
                  דירוג: {selectedAttraction.rating || 'לא זמין'} ⭐
                </div>
                <div style={{ color: '#666', marginBottom: '5px' }}>
                  כתובת: {selectedAttraction.address || 'לא זמין'}
                </div>
                {selectedAttraction.photo && (
                  <img 
                    src={selectedAttraction.photo} 
                    alt={`${selectedAttraction.name} - תמונה`} 
                    style={{ width: '100%', marginTop: '5px', borderRadius: '5px' }} 
                  />
                )}
              </Box>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
    </Box>
  );
};

export default RouteMap;