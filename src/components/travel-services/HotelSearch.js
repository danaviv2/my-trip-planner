import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Grid,
  Card, CardContent, Rating, Chip, CircularProgress,
  Alert, Tabs, Tab, Divider, Tooltip
} from '@mui/material';
import HotelIcon from '@mui/icons-material/Hotel';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MapIcon from '@mui/icons-material/Map';
import { generateHotelRecommendations } from '../../services/aiHotelService';

const CATEGORY_LABELS = {
  budget: { label: '💰 חסכוני', color: '#4CAF50', bg: '#E8F5E9' },
  boutique: { label: '✨ בוטיק', color: '#9C27B0', bg: '#F3E5F5' },
  luxury: { label: '👑 יוקרה', color: '#FF8F00', bg: '#FFF8E1' },
};

const BOOKING_SITES = [
  {
    name: 'Booking.com',
    logo: '🏨',
    color: '#003580',
    getUrl: ({ destination, checkIn, checkOut, guests }) =>
      `https://www.booking.com/search.html?ss=${encodeURIComponent(destination)}&checkin=${checkIn || ''}&checkout=${checkOut || ''}&group_adults=${guests}&no_rooms=1&lang=he`,
  },
  {
    name: 'Airbnb',
    logo: '🏠',
    color: '#FF385C',
    getUrl: ({ destination, checkIn, checkOut, guests }) =>
      `https://www.airbnb.com/s/${encodeURIComponent(destination)}/homes?checkin=${checkIn || ''}&checkout=${checkOut || ''}&adults=${guests}`,
  },
  {
    name: 'Hotels.com',
    logo: '🌟',
    color: '#D4111E',
    getUrl: ({ destination, checkIn, checkOut, guests }) =>
      `https://www.hotels.com/search.do?q-destination=${encodeURIComponent(destination)}&q-check-in=${checkIn || ''}&q-check-out=${checkOut || ''}&q-rooms=1&q-room-0-adults=${guests}`,
  },
];

const HotelSearch = ({ destination: propDestination, onShowOnMap, onHotelsLoaded }) => {
  const [destination, setDestination] = useState(propDestination || '');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searched, setSearched] = useState(false);

  // טעינה אוטומטית אם היעד הגיע מהפרופס
  useEffect(() => {
    if (propDestination && propDestination !== destination) {
      setDestination(propDestination);
      // אפס מלונות קודמים כשהיעד משתנה
      setHotels([]);
      if (onHotelsLoaded) onHotelsLoaded([]);
    }
  }, [propDestination]);

  const handleSearch = async () => {
    if (!destination) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const results = await generateHotelRecommendations(destination);
      setHotels(results);
      if (onHotelsLoaded) onHotelsLoaded(results);
    } catch (err) {
      if (err.message === 'RATE_LIMIT') setError('יותר מדי בקשות — נסה שוב בעוד דקה');
      else if (err.message === 'NO_API_KEY') setError('מפתח API חסר');
      else setError('שגיאה בטעינת המלצות מלונות');
    } finally {
      setLoading(false);
    }
  };

  const params = { destination, checkIn, checkOut, guests };

  const filtered = categoryFilter === 'all'
    ? hotels
    : hotels.filter(h => h.category === categoryFilter);

  const openBookingSite = (site, hotelName) => {
    const url = hotelName
      ? `${site.getUrl({ ...params, destination: `${hotelName} ${destination}` })}`
      : site.getUrl(params);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Box>
      {/* טופס חיפוש */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HotelIcon />
          חיפוש מלונות
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          המלצות AI אמיתיות על מלונות מומלצים — ולינקים ישירים לאתרי ההזמנה
        </Alert>

        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth label="יעד"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="פריז, רומא, ניו יורק..."
              InputProps={{ startAdornment: <LocationOnIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth label="צ'ק-אין" type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth label="צ'ק-אאוט" type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6} md={1}>
            <TextField
              fullWidth label="אורחים" type="number"
              value={guests}
              onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value) || 1))}
              inputProps={{ min: 1, max: 10 }}
            />
          </Grid>
          <Grid item xs={6} md={4}>
            <Button
              fullWidth variant="contained" size="large"
              onClick={handleSearch}
              disabled={!destination || loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}
              sx={{ height: '56px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              {loading ? 'מחפש...' : 'המלץ מלונות עם AI'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* המלצות AI */}
      {hotels.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AutoAwesomeIcon sx={{ color: '#764ba2' }} />
            <Typography variant="h6" fontWeight={700}>
              מלונות מומלצים ב-{destination}
            </Typography>
          </Box>

          {/* פילטר קטגוריה */}
          <Tabs
            value={categoryFilter}
            onChange={(e, v) => setCategoryFilter(v)}
            sx={{ mb: 3, '& .MuiTabs-indicator': { background: 'linear-gradient(135deg, #667eea, #764ba2)' } }}
          >
            <Tab value="all" label="הכל" />
            <Tab value="budget" label="💰 חסכוני" />
            <Tab value="boutique" label="✨ בוטיק" />
            <Tab value="luxury" label="👑 יוקרה" />
          </Tabs>

          <Grid container spacing={2}>
            {filtered.map((hotel, idx) => {
              const cat = CATEGORY_LABELS[hotel.category] || CATEGORY_LABELS.boutique;
              return (
                <Grid item xs={12} md={4} key={idx}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      border: `1px solid ${cat.color}30`,
                      boxShadow: 2,
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
                    }}
                  >
                    {/* כותרת צבעונית */}
                    <Box sx={{ background: `linear-gradient(135deg, ${cat.color}22, ${cat.color}44)`, p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h2" sx={{ fontSize: '2.5rem', lineHeight: 1 }}>
                          {hotel.emoji || '🏨'}
                        </Typography>
                        <Chip
                          label={cat.label}
                          size="small"
                          sx={{ background: cat.bg, color: cat.color, fontWeight: 700, border: `1px solid ${cat.color}` }}
                        />
                      </Box>
                      <Typography variant="h6" fontWeight={700} sx={{ mt: 1, color: '#1a1a2e' }}>
                        {hotel.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <LocationOnIcon sx={{ fontSize: 14, color: '#666' }} />
                        <Typography variant="caption" color="text.secondary">{hotel.neighborhood}</Typography>
                      </Box>
                    </Box>

                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {/* דירוג ומחיר */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Rating value={hotel.rating || 4} precision={0.5} readOnly size="small" />
                          <Typography variant="caption" color="text.secondary">({hotel.rating})</Typography>
                        </Box>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ color: cat.color }}>
                          {hotel.pricePerNight}
                        </Typography>
                      </Box>

                      {/* תיאור */}
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {hotel.description}
                      </Typography>

                      {/* למה מומלץ */}
                      <Box sx={{ background: '#f8f9ff', borderRadius: 2, p: 1, borderLeft: `3px solid ${cat.color}` }}>
                        <Typography variant="caption" fontWeight={700} sx={{ color: cat.color }}>למה מומלץ:</Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {hotel.whyRecommended}
                        </Typography>
                      </Box>

                      {/* שירותים */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(hotel.amenities || []).slice(0, 4).map((a, i) => (
                          <Chip key={i} label={a} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                        ))}
                      </Box>

                      {/* כפתורי מפה */}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {onShowOnMap && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<MapIcon sx={{ fontSize: '0.9rem' }} />}
                            onClick={() => onShowOnMap(hotel.name)}
                            sx={{
                              flex: 1,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              fontSize: '0.72rem',
                              py: 0.5,
                            }}
                          >
                            מיקוד במפה ↓
                          </Button>
                        )}
                        <Tooltip title="פתח ב-Google Maps">
                          <Button
                            size="small"
                            variant="outlined"
                            endIcon={<OpenInNewIcon sx={{ fontSize: '0.8rem' }} />}
                            onClick={() => window.open(
                              `https://maps.google.com/maps?q=${encodeURIComponent(hotel.name + ' ' + destination)}`,
                              '_blank', 'noopener,noreferrer'
                            )}
                            sx={{ fontSize: '0.72rem', py: 0.5, color: '#4285F4', borderColor: '#4285F4' }}
                          >
                            📍 Maps
                          </Button>
                        </Tooltip>
                      </Box>

                      {/* כפתורי הזמנה */}
                      <Box sx={{ mt: 0.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {BOOKING_SITES.map(site => (
                          <Tooltip key={site.name} title={`חפש ב-${site.name}`}>
                            <Button
                              size="small"
                              variant="outlined"
                              endIcon={<OpenInNewIcon sx={{ fontSize: '0.75rem' }} />}
                              onClick={() => openBookingSite(site, hotel.name)}
                              sx={{
                                flex: 1,
                                borderColor: site.color,
                                color: site.color,
                                fontSize: '0.7rem',
                                py: 0.5,
                                '&:hover': { background: `${site.color}15` }
                              }}
                            >
                              {site.logo} {site.name.split('.')[0]}
                            </Button>
                          </Tooltip>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* חיפוש כללי באתרי הזמנה */}
      {searched && destination && !loading && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>חפש בכל אתרי ההזמנה:</Typography>
          <Grid container spacing={2}>
            {BOOKING_SITES.map(site => (
              <Grid item xs={12} md={4} key={site.name}>
                <Paper
                  onClick={() => openBookingSite(site)}
                  sx={{
                    p: 3, borderRadius: 3, cursor: 'pointer', textAlign: 'center',
                    border: '2px solid transparent',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: site.color, transform: 'translateY(-2px)', boxShadow: 4 }
                  }}
                >
                  <Typography variant="h3" sx={{ mb: 1 }}>{site.logo}</Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ color: site.color }}>{site.name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {destination}
                    {checkIn && ` · ${new Date(checkIn).toLocaleDateString('he-IL')}`}
                    {checkOut && ` ← ${new Date(checkOut).toLocaleDateString('he-IL')}`}
                    {` · ${guests} אורח${guests > 1 ? 'ים' : ''}`}
                  </Typography>
                  <Button variant="contained" endIcon={<OpenInNewIcon />} sx={{ background: site.color }}>
                    חפש ב-{site.name}
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            * המחירים מוצגים ישירות על ידי אתרי ההזמנה ומשקפים מחירים בזמן אמת
          </Typography>
        </>
      )}
    </Box>
  );
};

export default HotelSearch;
