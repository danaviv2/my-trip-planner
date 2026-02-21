import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Button,
  Stack
} from '@mui/material';
import {
  Flight as FlightIcon,
  Hotel as HotelIcon,
  DirectionsCar as CarIcon,
  OpenInNew as OpenIcon
} from '@mui/icons-material';
import bookingLinks from '../../utils/bookingLinks';

const PriceComparison = ({ origin, destination }) => {
  const [priceData, setPriceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (origin && destination) {
      fetchPrices();
    }
  }, [origin, destination]);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      // סימולציה של נתוני מחירים
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      setPriceData({
        flights: [
          { 
            provider: 'Booking.com Flights', 
            price: 450, 
            url: bookingLinks.flight(origin, destination, today)
          },
          { 
            provider: 'Google Flights', 
            price: 480, 
            url: `https://www.google.com/travel/flights?q=${encodeURIComponent(origin + ' to ' + destination)}`
          },
          { 
            provider: 'Skyscanner', 
            price: 420, 
            url: `https://www.skyscanner.com/transport/flights/${origin}/${destination}/`
          }
        ],
        hotels: [
          { 
            provider: 'Booking.com', 
            price: 120, 
            url: bookingLinks.hotel(destination, today, nextWeek)
          },
          { 
            provider: 'Hotels.com', 
            price: 135, 
            url: `https://www.hotels.com/search.do?destination=${encodeURIComponent(destination)}`
          },
          { 
            provider: 'Agoda', 
            price: 115, 
            url: `https://www.agoda.com/search?city=${encodeURIComponent(destination)}`
          }
        ],
        cars: [
          { 
            provider: 'RentalCars.com', 
            price: 45, 
            url: bookingLinks.car(destination, today, nextWeek)
          },
          { 
            provider: 'Hertz', 
            price: 52, 
            url: `https://www.hertz.com/rentacar/reservation/`
          },
          { 
            provider: 'Sixt', 
            price: 48, 
            url: `https://www.sixt.com/car-rental/${destination}/`
          }
        ]
      });
    } catch (error) {
      console.error('שגיאה בטעינת מחירים:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>טוען השוואת מחירים...</Typography>
      </Box>
    );
  }

  if (!priceData) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        בחר מוצא ויעד לצפייה בהשוואת מחירים
      </Alert>
    );
  }

  const renderPriceCards = (items, icon, type) => (
    <Grid container spacing={2}>
      {items.map((item, index) => (
        <Grid item xs={12} md={4} key={index}>
          <Card 
            sx={{ 
              transition: 'all 0.3s',
              '&:hover': { 
                boxShadow: 6,
                transform: 'translateY(-4px)'
              }
            }}
          >
            <CardContent>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {icon}
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {item.provider}
                  </Typography>
                </Box>
                
                <Chip 
                  label={`$${item.price}`} 
                  color="primary" 
                  size="large"
                  sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}
                />

                <Button
                  variant="contained"
                  color="success"
                  endIcon={<OpenIcon />}
                  onClick={() => window.open(item.url, '_blank')}
                  fullWidth
                >
                  הזמן עכשיו
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        💰 השוואת מחירים
      </Typography>

      <Tabs 
        value={activeTab} 
        onChange={(e, v) => setActiveTab(v)} 
        sx={{ mb: 3 }}
        variant="fullWidth"
      >
        <Tab icon={<FlightIcon />} label="טיסות" />
        <Tab icon={<HotelIcon />} label="מלונות" />
        <Tab icon={<CarIcon />} label="רכב" />
      </Tabs>

      {activeTab === 0 && renderPriceCards(priceData.flights, <FlightIcon color="primary" />, 'flight')}
      {activeTab === 1 && renderPriceCards(priceData.hotels, <HotelIcon color="primary" />, 'hotel')}
      {activeTab === 2 && renderPriceCards(priceData.cars, <CarIcon color="primary" />, 'car')}
    </Box>
  );
};

export default PriceComparison;
