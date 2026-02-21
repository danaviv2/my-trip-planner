import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  IconButton,
  Collapse,
  Stack,
  Avatar,
  Divider,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  Restaurant as RestaurantIcon,
  Hotel as HotelIcon,
  Attractions as AttractionIcon,
  Flight as FlightIcon,
  DirectionsCar as CarIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  Star as StarIcon,
  Language as WebIcon,
  Phone as PhoneIcon,
  Map as MapIcon,
  ShoppingCart as BookIcon
} from '@mui/icons-material';
import bookingLinks from '../../utils/bookingLinks';

const EnhancedDayItinerary = ({ day, activities, tripInfo }) => {
  const [expanded, setExpanded] = useState(true);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'restaurant':
      case 'breakfast':
      case 'lunch':
      case 'dinner':
        return <RestaurantIcon />;
      case 'hotel':
      case 'accommodation':
        return <HotelIcon />;
      case 'flight':
        return <FlightIcon />;
      case 'car':
        return <CarIcon />;
      case 'attraction':
      case 'activity':
      default:
        return <AttractionIcon />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'restaurant':
      case 'breakfast':
      case 'lunch':
      case 'dinner':
        return 'error';
      case 'hotel':
      case 'accommodation':
        return 'primary';
      case 'flight':
        return 'secondary';
      case 'car':
        return 'info';
      case 'attraction':
      case 'activity':
      default:
        return 'success';
    }
  };

  const getBookingLink = (activity) => {
    const location = activity.location || tripInfo?.destination || '';
    const checkIn = tripInfo?.startDate || '';
    const checkOut = tripInfo?.endDate || '';

    switch (activity.type) {
      case 'flight':
        return bookingLinks.flight(tripInfo?.origin, tripInfo?.destination, checkIn);
      case 'hotel':
      case 'accommodation':
        return bookingLinks.hotel(location, checkIn, checkOut);
      case 'car':
        return bookingLinks.car(location, checkIn, checkOut);
      case 'restaurant':
      case 'breakfast':
      case 'lunch':
      case 'dinner':
        return bookingLinks.restaurant(activity.name, location);
      case 'attraction':
      case 'activity':
        return bookingLinks.attraction(activity.name, location);
      default:
        return null;
    }
  };

  return (
    <Card sx={{ mb: 2, boxShadow: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            📅 יום {day}
          </Typography>
          <IconButton onClick={() => setExpanded(!expanded)}>
            <ExpandIcon sx={{ 
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s'
            }} />
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Stack spacing={2}>
            {activities.map((activity, index) => (
              <Box key={index}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    p: 2,
                    transition: 'all 0.3s',
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-4px)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Avatar sx={{ 
                      bgcolor: `${getActivityColor(activity.type)}.main`,
                      width: 56,
                      height: 56
                    }}>
                      {getActivityIcon(activity.type)}
                    </Avatar>

                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {activity.name}
                      </Typography>

                      {activity.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {activity.description}
                        </Typography>
                      )}

                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                        {activity.time && (
                          <Chip 
                            icon={<TimeIcon />} 
                            label={activity.time} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        )}
                        {activity.duration && (
                          <Chip 
                            label={`⏱️ ${activity.duration}`}
                            size="small" 
                            variant="outlined"
                          />
                        )}
                        {activity.price && (
                          <Chip 
                            icon={<MoneyIcon />} 
                            label={`₪${activity.price}`}
                            size="small" 
                            color="success"
                          />
                        )}
                        {activity.rating && (
                          <Chip 
                            icon={<StarIcon />} 
                            label={activity.rating}
                            size="small" 
                            color="warning"
                          />
                        )}
                      </Stack>

                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<BookIcon />}
                          onClick={() => {
                            const link = getBookingLink(activity);
                            if (link) window.open(link, '_blank');
                          }}
                          sx={{ 
                            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                          }}
                        >
                          🎫 הזמן עכשיו
                        </Button>

                        {activity.website && (
                          <Button
                            size="small"
                            startIcon={<WebIcon />}
                            variant="outlined"
                            onClick={() => window.open(activity.website, '_blank')}
                          >
                            אתר
                          </Button>
                        )}

                        {activity.phone && (
                          <Button
                            size="small"
                            startIcon={<PhoneIcon />}
                            variant="outlined"
                            onClick={() => window.open(`tel:${activity.phone}`)}
                          >
                            התקשר
                          </Button>
                        )}

                        <Tooltip title="פתח ב-Google Maps">
                          <Button
                            size="small"
                            startIcon={<MapIcon />}
                            variant="outlined"
                            color="success"
                            onClick={() => {
                              const query = activity.address || activity.name;
                              window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
                            }}
                          >
                            נווט
                          </Button>
                        </Tooltip>
                      </Stack>

                      {activity.address && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          📍 {activity.address}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Card>
                {index < activities.length - 1 && <Divider sx={{ my: 1 }} />}
              </Box>
            ))}
          </Stack>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default EnhancedDayItinerary;
