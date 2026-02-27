import React, { useState, useEffect } from 'react';
import {
  Box, Container, Paper, Typography, TextField, Button, Chip,
  InputAdornment, Grid, useTheme, useMediaQuery, Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DirectionsIcon from '@mui/icons-material/Directions';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FlagIcon from '@mui/icons-material/Flag';
import { useTranslation } from 'react-i18next';

const popularRoutes = [
  { from: 'Tel Aviv', to: 'Jerusalem' },
  { from: 'Tel Aviv', to: 'Haifa' },
  { from: 'Jerusalem', to: 'Eilat' },
  { from: 'Tel Aviv', to: 'Eilat' },
  { from: 'Tel Aviv', to: 'Paris' },
  { from: 'London', to: 'Paris' },
];

const RouteMapPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();

  const travelModes = [
    { value: 'driving', label: t('routeMap.mode_driving'), key: 'd' },
    { value: 'transit', label: t('routeMap.mode_transit'), key: 'r' },
    { value: 'walking', label: t('routeMap.mode_walking'), key: 'w' },
    { value: 'bicycling', label: t('routeMap.mode_bicycling'), key: 'b' },
  ];

  const [origin, setOrigin] = useState('Tel Aviv');
  const [destination, setDestination] = useState('Jerusalem');
  const [travelMode, setTravelMode] = useState('driving');
  const [mapSrc, setMapSrc] = useState('');
  const [searched, setSearched] = useState(false);

  const buildMapSrc = (from, to, mode) => {
    const modeKey = travelModes.find(m => m.value === mode)?.key || 'd';
    return `https://maps.google.com/maps?saddr=${encodeURIComponent(from)}&daddr=${encodeURIComponent(to)}&dirflg=${modeKey}&output=embed`;
  };

  useEffect(() => {
    setMapSrc(buildMapSrc('Tel Aviv', 'Jerusalem', 'driving'));
    setSearched(true);
  }, []);

  const handleSearch = () => {
    if (!origin.trim() || !destination.trim()) return;
    setMapSrc(buildMapSrc(origin.trim(), destination.trim(), travelMode));
    setSearched(true);
  };

  const handleSwap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const handleRouteChip = (route) => {
    setOrigin(route.from);
    setDestination(route.to);
    setMapSrc(buildMapSrc(route.from, route.to, travelMode));
    setSearched(true);
  };

  const openInGoogleMaps = () => {
    const modeKey = travelModes.find(m => m.value === travelMode)?.key || 'd';
    window.open(`https://www.google.com/maps/dir/${encodeURIComponent(origin)}/${encodeURIComponent(destination)}/?dirflg=${modeKey}`, '_blank');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9ff', pt: '64px', pb: 4 }}>
      <Box sx={{
        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        color: 'white',
        py: { xs: 3, md: 4 },
        px: 3,
        textAlign: 'center',
        mb: 3
      }}>
        <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.4rem', md: '2rem' } }}>
          {t('routeMap.title')}
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5, fontSize: { xs: '0.85rem', md: '1rem' } }}>
          {t('routeMap.subtitle')}
        </Typography>
      </Box>

      <Container maxWidth="lg">
        <Paper elevation={4} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="flex-start">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                value={origin}
                onChange={e => setOrigin(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                label={t('routeMap.origin')}
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnIcon color="primary" fontSize="small" />
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 1 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 0.5 }}>
                <Button
                  size="small"
                  onClick={handleSwap}
                  startIcon={<SwapVertIcon />}
                  sx={{ color: 'text.secondary', fontSize: '0.75rem' }}
                >
                  {t('routeMap.swap')}
                </Button>
              </Box>
              <TextField
                fullWidth
                value={destination}
                onChange={e => setDestination(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                label={t('routeMap.destination')}
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FlagIcon color="error" fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                {t('routeMap.travel_mode')}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {travelModes.map(mode => (
                  <Chip
                    key={mode.value}
                    label={mode.label}
                    size="small"
                    onClick={() => setTravelMode(mode.value)}
                    sx={{
                      borderRadius: 2,
                      bgcolor: travelMode === mode.value ? '#43e97b' : undefined,
                      color: travelMode === mode.value ? 'white' : undefined,
                      fontWeight: travelMode === mode.value ? 700 : 400,
                      '&:hover': { bgcolor: '#43e97b44' }
                    }}
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearch}
                startIcon={<DirectionsIcon />}
                sx={{
                  background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  color: 'white',
                  borderRadius: 2,
                  py: 1.5,
                  fontWeight: 700,
                  mb: 1
                }}
              >
                {t('routeMap.search_btn')}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={openInGoogleMaps}
                startIcon={<OpenInNewIcon />}
                size="small"
                sx={{ borderRadius: 2, color: '#43e97b', borderColor: '#43e97b' }}
              >
                {t('routeMap.open_google_maps')}
              </Button>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              {t('routeMap.popular_routes')}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
              {popularRoutes.map((route, i) => (
                <Chip
                  key={i}
                  label={`${route.from} → ${route.to}`}
                  size="small"
                  clickable
                  onClick={() => handleRouteChip(route)}
                  variant="outlined"
                  sx={{ borderRadius: 2, fontSize: '0.75rem' }}
                />
              ))}
            </Box>
          </Box>
        </Paper>

        {searched && (
          <Paper elevation={4} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{
              px: 2, py: 1.5,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '1px solid rgba(0,0,0,0.08)',
              bgcolor: '#f8fff8'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DirectionsIcon color="success" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600}>
                  {origin} → {destination}
                </Typography>
                <Chip
                  label={travelModes.find(m => m.value === travelMode)?.label}
                  size="small"
                  sx={{ bgcolor: '#43e97b22', fontSize: '0.7rem' }}
                />
              </Box>
              <Button
                size="small"
                startIcon={<SearchIcon />}
                onClick={() => window.open(`https://maps.google.com/maps?q=${encodeURIComponent(destination)}`, '_blank')}
                sx={{ fontSize: '0.75rem', color: 'text.secondary' }}
              >
                {t('routeMap.search_dest')}
              </Button>
            </Box>

            <Box sx={{ width: '100%', height: { xs: '60vh', md: '70vh' } }}>
              <iframe
                key={mapSrc}
                src={mapSrc}
                width="100%"
                height="100%"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`${origin} → ${destination}`}
              />
            </Box>
          </Paper>
        )}

        <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
          {t('routeMap.tip')}
        </Alert>
      </Container>
    </Box>
  );
};

export default RouteMapPage;
