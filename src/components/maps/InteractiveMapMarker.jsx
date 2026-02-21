import React, { useState } from 'react';
import { InfoWindow, Marker } from '@react-google-maps/api';
import {
  Box,
  Typography,
  Button,
  Stack,
  Chip,
  Paper
} from '@mui/material';
import {
  Flight as FlightIcon,
  Hotel as HotelIcon,
  Restaurant as RestaurantIcon,
  Attractions as AttractionIcon,
  DirectionsCar as CarIcon,
  OpenInNew as OpenIcon
} from '@mui/icons-material';
import bookingLinks from '../../utils/bookingLinks';

const InteractiveMapMarker = ({ 
  position, 
  title, 
  type = 'attraction', 
  description,
  tripInfo 
}) => {
  const [showInfo, setShowInfo] = useState(false);

  const getIcon = () => {
    const icons = {
      hotel: '🏨',
      restaurant: '🍽️',
      attraction: '🎯',
      flight: '✈️',
      car: '🚗'
    };
    return icons[type] || '📍';
  };

  const getBookingUrl = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    switch (type) {
      case 'hotel':
        return bookingLinks.hotel(tripInfo?.destination || title, today, nextWeek);
      case 'restaurant':
        return bookingLinks.restaurant(title, tripInfo?.destination || '');
      case 'flight':
        return bookingLinks.flight(tripInfo?.origin || '', tripInfo?.destination || '', today);
      case 'car':
        return bookingLinks.car(tripInfo?.destination || title, today, nextWeek);
      case 'attraction':
        return bookingLinks.attraction(title, tripInfo?.destination || '');
      default:
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title)}`;
    }
  };

  return (
    <>
      <Marker
        position={position}
        title={title}
        onClick={() => setShowInfo(true)}
        icon={{
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
              <circle cx="20" cy="20" r="18" fill="#2196F3" stroke="white" stroke-width="3"/>
              <text x="20" y="28" font-size="20" text-anchor="middle">${getIcon()}</text>
            </svg>
          `)}`,
          scaledSize: new window.google.maps.Size(40, 40)
        }}
      />

      {showInfo && (
        <InfoWindow
          position={position}
          onCloseClick={() => setShowInfo(false)}
        >
          <Paper sx={{ p: 2, maxWidth: 300 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              {getIcon()} {title}
            </Typography>
            
            {description && (
              <Typography variant="body2" sx={{ mb: 2 }}>
                {description}
              </Typography>
            )}

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<OpenIcon />}
                onClick={() => window.open(getBookingUrl(), '_blank')}
              >
                הזמן עכשיו
              </Button>
              
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title)}`;
                  window.open(googleMapsUrl, '_blank');
                }}
              >
                נווט
              </Button>
            </Stack>

            <Chip 
              label={type} 
              size="small" 
              sx={{ mt: 1 }}
              color={
                type === 'hotel' ? 'primary' :
                type === 'restaurant' ? 'error' :
                type === 'attraction' ? 'success' : 'default'
              }
            />
          </Paper>
        </InfoWindow>
      )}
    </>
  );
};

export default InteractiveMapMarker;
