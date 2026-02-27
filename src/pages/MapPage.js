import React, { useState, useEffect } from 'react';
import {
  Container, Box, Paper, Typography, Button, Chip, InputAdornment,
  TextField, useTheme, useMediaQuery,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HistoryIcon from '@mui/icons-material/History';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useTranslation } from 'react-i18next';

const popularDestinations = [
  'Paris, France',
  'New York, USA',
  'Rome, Italy',
  'Barcelona, Spain',
  'London, UK',
  'Berlin, Germany',
  'Amsterdam, Netherlands',
  'Vienna, Austria',
  'Athens, Greece',
  'Dubai, UAE',
  'Tokyo, Japan',
  'Bangkok, Thailand',
  'Sydney, Australia',
  'Cape Town, South Africa',
  'Rio de Janeiro, Brazil',
];

const MapPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();

  const [searchInput, setSearchInput] = useState('');
  const [mapQuery, setMapQuery] = useState('Tel Aviv, Israel');
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mapRecentSearches');
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch {}
  }, []);

  const handleSearch = () => {
    const q = searchInput.trim();
    if (!q) return;
    setMapQuery(q);
    const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('mapRecentSearches', JSON.stringify(updated));
  };

  const handleChipClick = (dest) => {
    setSearchInput(dest);
    setMapQuery(dest);
    const updated = [dest, ...recentSearches.filter(s => s !== dest)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('mapRecentSearches', JSON.stringify(updated));
  };

  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9ff', pt: '64px', pb: 4 }}>
      <Box sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        py: { xs: 3, md: 4 },
        px: 3,
        textAlign: 'center',
        mb: 3
      }}>
        <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.4rem', md: '2rem' } }}>
          {t('map.title')}
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5, fontSize: { xs: '0.85rem', md: '1rem' } }}>
          {t('map.subtitle')}
        </Typography>
      </Box>

      <Container maxWidth="lg">
        <Paper elevation={4} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder={t('map.search_placeholder')}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOnIcon color="action" fontSize="small" />
                  </InputAdornment>
                )
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              startIcon={<SearchIcon />}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 2,
                px: { xs: 2, md: 3 },
                whiteSpace: 'nowrap',
                fontWeight: 600
              }}
            >
              {isMobile ? '' : t('map.search_btn')}
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: recentSearches.length ? 1.5 : 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ width: '100%', mb: 0.5 }}>
              {t('map.popular_label')}
            </Typography>
            {popularDestinations.slice(0, isMobile ? 4 : 7).map(dest => (
              <Chip
                key={dest}
                label={dest}
                size="small"
                clickable
                onClick={() => handleChipClick(dest)}
                sx={{
                  borderRadius: 2,
                  bgcolor: mapQuery === dest ? '#667eea' : undefined,
                  color: mapQuery === dest ? 'white' : undefined,
                  '&:hover': { bgcolor: '#667eea22' }
                }}
              />
            ))}
          </Box>

          {recentSearches.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              <HistoryIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">{t('map.recent_label')}</Typography>
              {recentSearches.map((s, i) => (
                <Chip
                  key={i}
                  label={s}
                  size="small"
                  variant="outlined"
                  clickable
                  onClick={() => handleChipClick(s)}
                  onDelete={() => {
                    const updated = recentSearches.filter((_, idx) => idx !== i);
                    setRecentSearches(updated);
                    localStorage.setItem('mapRecentSearches', JSON.stringify(updated));
                  }}
                  sx={{ borderRadius: 2 }}
                />
              ))}
            </Box>
          )}
        </Paper>

        <Paper elevation={4} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{
            px: 2, py: 1.5,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid rgba(0,0,0,0.08)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOnIcon color="primary" fontSize="small" />
              <Typography variant="subtitle1" fontWeight={600}>{mapQuery}</Typography>
            </Box>
            <Button
              size="small"
              startIcon={<OpenInNewIcon />}
              onClick={() => window.open(`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}`, '_blank')}
              sx={{ fontSize: '0.75rem' }}
            >
              {t('map.open_google_maps')}
            </Button>
          </Box>

          <Box sx={{ position: 'relative', width: '100%', height: { xs: '55vh', md: '65vh' } }}>
            <iframe
              key={mapQuery}
              src={mapSrc}
              width="100%"
              height="100%"
              style={{ border: 0, display: 'block' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={mapQuery}
            />
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default MapPage;
