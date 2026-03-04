import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Grid,
  Card, CardContent, Chip, CircularProgress, Alert,
  Tabs, Tab, Divider, Tooltip, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MapIcon from '@mui/icons-material/Map';
import { generateCarRentalTips } from '../../services/aiCarRentalService';

const CATEGORY_LABELS = {
  economy:  { label: '💰 חסכוני',  color: '#2E7D32', bg: '#E8F5E9' },
  family:   { label: '👨‍👩‍👧 משפחתי', color: '#1565C0', bg: '#E3F2FD' },
  premium:  { label: '👑 פרמיום',  color: '#E65100', bg: '#FFF3E0' },
};

const RENTAL_SITES = [
  {
    name: 'Rentalcars',
    logo: '🚗',
    color: '#003580',
    getUrl: ({ location, pickupDate, returnDate }) =>
      `https://www.rentalcars.com/en/searchresults.do?adplat=google&cor=IL&pickup=${encodeURIComponent(location)}&puDay=${pickupDate || ''}&doDay=${returnDate || ''}`,
  },
  {
    name: 'Kayak',
    logo: '🚙',
    color: '#FF690F',
    getUrl: ({ location, pickupDate, returnDate }) => {
      const pu = pickupDate?.replace(/-/g, '/') || '';
      const ret = returnDate?.replace(/-/g, '/') || '';
      return `https://www.kayak.com/cars/${encodeURIComponent(location)}/${pu}/${ret}?sort=price_a`;
    },
  },
  {
    name: 'DiscoverCars',
    logo: '🔍',
    color: '#00897B',
    getUrl: ({ location, pickupDate, returnDate }) =>
      `https://www.discovercars.com/?a_aid=tripplanner&location=${encodeURIComponent(location)}&date_from=${pickupDate || ''}&date_to=${returnDate || ''}`,
  },
];

const CarRentalSearch = ({ location: propLocation, onShowOnMap }) => {
  const [location, setLocation] = useState(propLocation || '');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (propLocation && propLocation !== location) setLocation(propLocation);
  }, [propLocation]);

  const handleSearch = async () => {
    if (!location) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const result = await generateCarRentalTips(location);
      setData(result);
    } catch (err) {
      if (err.message === 'RATE_LIMIT') setError('יותר מדי בקשות — נסה שוב בעוד דקה');
      else if (err.message === 'NO_API_KEY') setError('מפתח API חסר');
      else setError('שגיאה בטעינת המלצות השכרת רכב');
    } finally {
      setLoading(false);
    }
  };

  const params = { location, pickupDate, returnDate };

  const filteredCars = categoryFilter === 'all'
    ? (data?.cars || [])
    : (data?.cars || []).filter(c => c.category === categoryFilter);

  return (
    <Box>
      {/* טופס חיפוש */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DirectionsCarIcon />
          השכרת רכב
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          המלצות AI על סוגי רכב מתאימים ליעד + טיפים נהיגה מקומיים
        </Alert>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth label="יעד / עיר איסוף"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="פריז, רומא, ברצלונה..."
              InputProps={{ startAdornment: <DirectionsCarIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth label="תאריך איסוף" type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth label="תאריך החזרה" type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth variant="contained" size="large"
              onClick={handleSearch}
              disabled={!location || loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}
              sx={{ height: '56px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              {loading ? 'מנתח...' : 'המלץ רכב עם AI'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* מידע מקומי + טיפים */}
      {data?.localInfo && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <Paper sx={{
              p: 2, borderRadius: 3,
              background: data.localInfo.recommendRenting
                ? 'linear-gradient(135deg, #e8f5e9, #f1f8e9)'
                : 'linear-gradient(135deg, #fff3e0, #fce4ec)',
              border: `1px solid ${data.localInfo.recommendRenting ? '#4CAF50' : '#FF8F00'}44`
            }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                {data.localInfo.recommendRenting ? '✅' : '⚠️'} כדאי לשכור רכב ב-{location}?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {data.localInfo.recommendRentingReason}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">נהיגה</Typography>
                <Chip label={data.localInfo.driveSide === 'left' ? '🇬🇧 שמאל' : '➡️ ימין'} size="small" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">כבישי אגרה</Typography>
                <Chip label={data.localInfo.tollRoads ? '⚠️ יש' : '✅ אין'} size="small" color={data.localInfo.tollRoads ? 'warning' : 'success'} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">חנייה</Typography>
                <Chip label={`🅿️ ${data.localInfo.parkingDifficulty}`} size="small" />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* המלצות רכב */}
      {filteredCars.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AutoAwesomeIcon sx={{ color: '#764ba2' }} />
            <Typography variant="h6" fontWeight={700}>
              רכבים מומלצים ל-{location}
            </Typography>
          </Box>

          <Tabs
            value={categoryFilter}
            onChange={(e, v) => setCategoryFilter(v)}
            sx={{ mb: 3, '& .MuiTabs-indicator': { background: 'linear-gradient(135deg, #667eea, #764ba2)' } }}
          >
            <Tab value="all" label="הכל" />
            <Tab value="economy" label="💰 חסכוני" />
            <Tab value="family" label="👨‍👩‍👧 משפחתי" />
            <Tab value="premium" label="👑 פרמיום" />
          </Tabs>

          <Grid container spacing={2}>
            {filteredCars.map((car, idx) => {
              const cat = CATEGORY_LABELS[car.category] || CATEGORY_LABELS.economy;
              return (
                <Grid item xs={12} md={4} key={idx}>
                  <Card sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    border: `1px solid ${cat.color}30`,
                    boxShadow: 2,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
                  }}>
                    {/* כותרת */}
                    <Box sx={{ background: `linear-gradient(135deg, ${cat.color}22, ${cat.color}44)`, p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography sx={{ fontSize: '2.5rem', lineHeight: 1 }}>{car.emoji || '🚗'}</Typography>
                        <Chip
                          label={cat.label}
                          size="small"
                          sx={{ background: cat.bg, color: cat.color, fontWeight: 700, border: `1px solid ${cat.color}` }}
                        />
                      </Box>
                      <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>{car.name}</Typography>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ color: cat.color }}>
                        {car.pricePerDay}
                      </Typography>
                    </Box>

                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {/* פרטים */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        <Chip icon={<span style={{ fontSize: '0.85rem' }}>👤</span>} label={`${car.seats} נוסעים`} size="small" variant="outlined" />
                        <Chip label={car.transmission} size="small" variant="outlined" />
                        <Chip label={car.fuel} size="small" variant="outlined" />
                      </Box>

                      {/* מתאים ל */}
                      <Box sx={{ background: '#f8f9ff', borderRadius: 2, p: 1, borderLeft: `3px solid ${cat.color}` }}>
                        <Typography variant="caption" fontWeight={700} sx={{ color: cat.color }}>מתאים ל:</Typography>
                        <Typography variant="caption" display="block" color="text.secondary">{car.idealFor}</Typography>
                      </Box>

                      {/* יתרונות */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                        {(car.pros || []).map((pro, i) => (
                          <Typography key={i} variant="caption" color="text.secondary">
                            ✓ {pro}
                          </Typography>
                        ))}
                      </Box>

                      {/* הצג על המפה */}
                      {onShowOnMap && (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<MapIcon sx={{ fontSize: '0.9rem' }} />}
                          onClick={() => onShowOnMap(car.name)}
                          sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            fontSize: '0.75rem',
                            py: 0.5,
                            mt: 'auto',
                          }}
                        >
                          מצא סוכנויות על המפה
                        </Button>
                      )}

                      {/* כפתורי השכרה */}
                      <Box sx={{ mt: 0.5, display: 'flex', gap: 1 }}>
                        {RENTAL_SITES.map(site => (
                          <Tooltip key={site.name} title={`חפש ב-${site.name}`}>
                            <Button
                              size="small"
                              variant="outlined"
                              endIcon={<OpenInNewIcon sx={{ fontSize: '0.75rem' }} />}
                              onClick={() => window.open(site.getUrl(params), '_blank', 'noopener,noreferrer')}
                              sx={{
                                flex: 1,
                                borderColor: site.color,
                                color: site.color,
                                fontSize: '0.65rem',
                                py: 0.5,
                                '&:hover': { background: `${site.color}15` }
                              }}
                            >
                              {site.logo}
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

      {/* טיפי נהיגה */}
      {data?.drivingTips?.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            🚦 טיפי נהיגה ב-{location}
          </Typography>
          {data.drivingTips.map((tip, i) => (
            <Accordion key={i} sx={{ borderRadius: '8px !important', mb: 1, boxShadow: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight={600}>{tip.emoji} {tip.tip}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">{tip.detail}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* חיפוש כללי באתרי השכרה */}
      {searched && location && !loading && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>השווה מחירים באתרי השכרה:</Typography>
          <Grid container spacing={2}>
            {RENTAL_SITES.map(site => (
              <Grid item xs={12} md={4} key={site.name}>
                <Paper
                  onClick={() => window.open(site.getUrl(params), '_blank', 'noopener,noreferrer')}
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
                    {location}
                    {pickupDate && ` · ${new Date(pickupDate).toLocaleDateString('he-IL')}`}
                    {returnDate && ` ← ${new Date(returnDate).toLocaleDateString('he-IL')}`}
                  </Typography>
                  <Button variant="contained" endIcon={<OpenInNewIcon />} sx={{ background: site.color }}>
                    חפש ב-{site.name}
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            * המחירים מוצגים ישירות על ידי אתרי ההשכרה ומשקפים מחירים בזמן אמת
          </Typography>
        </>
      )}
    </Box>
  );
};

export default CarRentalSearch;
