import React, { useState } from 'react';
import { GoogleMap, DirectionsRenderer } from '@react-google-maps/api';
import { Paper, Typography } from '@mui/material';
import InteractiveMapMarker from './InteractiveMapMarker';

const EnhancedRouteMap = ({ origin, destination, directions, attractions = [] }) => {
  const [map, setMap] = useState(null);

  const defaultCenter = { lat: 32.0853, lng: 34.7818 }; // תל אביב
  const mapContainerStyle = { width: '100%', height: '500px' };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        🗺️ מפת מסלול אינטראקטיבית
      </Typography>
      
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={8}
        onLoad={setMap}
      >
        {directions && <DirectionsRenderer directions={directions} />}
        
        {/* סמנים לאטרקציות */}
        {attractions.map((attraction, index) => (
          <InteractiveMapMarker
            key={index}
            position={attraction.position}
            title={attraction.name}
            type={attraction.type || 'attraction'}
            description={attraction.description}
            tripInfo={{ origin, destination }}
          />
        ))}

        {/* סמן מוצא */}
        {origin && (
          <InteractiveMapMarker
            position={origin.position || defaultCenter}
            title={origin.name || 'מוצא'}
            type="flight"
            tripInfo={{ origin: origin.name, destination: destination?.name }}
          />
        )}

        {/* סמן יעד */}
        {destination && (
          <InteractiveMapMarker
            position={destination.position || defaultCenter}
            title={destination.name || 'יעד'}
            type="hotel"
            tripInfo={{ origin: origin?.name, destination: destination.name }}
          />
        )}
      </GoogleMap>

      <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
        💡 לחץ על הסמנים למידע נוסף וכפתורי הזמנה
      </Typography>
    </Paper>
  );
};

export default EnhancedRouteMap;
