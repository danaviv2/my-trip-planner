import React, { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Grid,
  ToggleButtonGroup, ToggleButton, Alert, Divider
} from '@mui/material';
import FlightIcon from '@mui/icons-material/Flight';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const BOOKING_SITES = [
  {
    name: 'Google Flights',
    color: '#4285F4',
    logo: '✈️',
    getUrl: ({ origin, destination, departureDate, returnDate, passengers, tripType }) => {
      const q = `flights from ${origin || 'Tel Aviv'} to ${destination || ''}${departureDate ? ` on ${departureDate}` : ''}`;
      return `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}&curr=ILS`;
    }
  },
  {
    name: 'Skyscanner',
    color: '#00B2A9',
    logo: '🔍',
    getUrl: ({ origin, destination, departureDate, returnDate, passengers, tripType }) => {
      const dep = departureDate ? departureDate.replace(/-/g, '') : '';
      const ret = returnDate ? returnDate.replace(/-/g, '') : '';
      const originSlug = (origin || 'tlv').toLowerCase().replace(/\s+/g, '-');
      const destSlug = (destination || '').toLowerCase().replace(/\s+/g, '-');
      const retPart = tripType === 'roundtrip' && ret ? `/${ret}` : '';
      return `https://www.skyscanner.co.il/transport/flights/${originSlug}/${destSlug}/${dep}${retPart}/?adults=${passengers}&currency=ILS`;
    }
  },
  {
    name: 'Kayak',
    color: '#FF690F',
    logo: '🚣',
    getUrl: ({ origin, destination, departureDate, returnDate, passengers, tripType }) => {
      const dep = departureDate ? departureDate.replace(/-/g, '') : '';
      const ret = returnDate ? returnDate.replace(/-/g, '') : '';
      const retPart = tripType === 'roundtrip' && ret ? `/${ret}` : '';
      return `https://www.kayak.com/flights/${origin || 'TLV'}-${destination || ''}/${dep}${retPart}/${passengers}adults?currency=ILS`;
    }
  },
];

const FlightSearch = () => {
  const [tripType, setTripType] = useState('roundtrip');
  const [origin, setOrigin] = useState('תל אביב');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [searched, setSearched] = useState(false);

  const params = { origin, destination, departureDate, returnDate, passengers, tripType };

  const handleSearch = () => {
    if (!destination) return;
    setSearched(true);
  };

  const openSite = (site) => {
    window.open(site.getUrl(params), '_blank', 'noopener,noreferrer');
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FlightIcon />
          חיפוש טיסות
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          מחירי הטיסות מוצגים ישירות דרך אתרי ההזמנה — תמיד עדכניים ואמיתיים
        </Alert>

        <Box sx={{ mb: 2 }}>
          <ToggleButtonGroup
            value={tripType}
            exclusive
            onChange={(e, v) => v && setTripType(v)}
            size="small"
          >
            <ToggleButton value="roundtrip">הלוך ושוב</ToggleButton>
            <ToggleButton value="oneway">כיוון אחד</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth label="מוצא"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="תל אביב"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth label="יעד"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="פריז, לוס אנג'לס..."
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth label="תאריך יציאה" type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          {tripType === 'roundtrip' && (
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth label="תאריך חזרה" type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          )}
          <Grid item xs={6} md={1}>
            <TextField
              fullWidth label="נוסעים" type="number"
              value={passengers}
              onChange={(e) => setPassengers(Math.max(1, parseInt(e.target.value) || 1))}
              inputProps={{ min: 1, max: 9 }}
            />
          </Grid>
          <Grid item xs={6} md={tripType === 'roundtrip' ? 1 : 3}>
            <Button
              fullWidth variant="contained" size="large"
              onClick={handleSearch}
              disabled={!destination}
              sx={{ height: '56px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              חפש
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* תוצאות — קישורים לאתרי הזמנה אמיתיים */}
      {searched && destination && (
        <Box>
          <Typography variant="h6" gutterBottom>
            בחר אתר להשוואת מחירים:
          </Typography>
          <Grid container spacing={2}>
            {BOOKING_SITES.map((site) => (
              <Grid item xs={12} md={4} key={site.name}>
                <Paper
                  sx={{
                    p: 3, borderRadius: 3, cursor: 'pointer', textAlign: 'center',
                    border: '2px solid transparent',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: site.color, transform: 'translateY(-2px)', boxShadow: 4 }
                  }}
                  onClick={() => openSite(site)}
                >
                  <Typography variant="h3" sx={{ mb: 1 }}>{site.logo}</Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ color: site.color }}>
                    {site.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {origin} → {destination}
                    {departureDate && ` · ${new Date(departureDate).toLocaleDateString('he-IL')}`}
                    {tripType === 'roundtrip' && returnDate && ` ↩ ${new Date(returnDate).toLocaleDateString('he-IL')}`}
                    {` · ${passengers} נוסע${passengers > 1 ? 'ים' : ''}`}
                  </Typography>
                  <Button
                    variant="contained"
                    endIcon={<OpenInNewIcon />}
                    sx={{ background: site.color }}
                    onClick={(e) => { e.stopPropagation(); openSite(site); }}
                  >
                    חפש ב-{site.name}
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" color="text.secondary">
            * המחירים מוצגים ישירות על ידי אתרי ההזמנה ומשקפים את המחירים בזמן אמת
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default FlightSearch;
