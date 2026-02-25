import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Grid, Card, CardContent,
  Paper, Chip, Stack, TextField
} from '@mui/material';
import {
  Flight as FlightIcon,
  Explore as ExploreIcon,
  Search as SearchIcon,
  Map as MapIcon,
  Star as StarIcon,
  TrendingUp as TrendingIcon,
  LocationOn as LocationIcon,
  Casino as CasinoIcon,
  Luggage as LuggageIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import SurpriseTripModal from '../components/surprise/SurpriseTripModal';
import VibeMatcher from '../components/vibe/VibeMatcher';
import PackingListModal from '../components/packing/PackingListModal';

const HomePage = () => {
  const navigate = useNavigate();
  const [surpriseOpen, setSurpriseOpen] = useState(false);
  const [packingOpen, setPackingOpen] = useState(false);

  const mainFeatures = [
    {
      title: 'המשך תכנון',
      description: 'המשך לתכנן את הטיול המושלם שלך',
      icon: <FlightIcon sx={{ fontSize: 60 }} />,
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      path: '/trip-planner',
      emoji: '✈️',
      delay: '0s'
    },
    {
      title: 'מידע על היעד',
      description: 'קבל מידע מפורט על היעד, כולל אטרקציות, טיפים ומזג אוויר',
      icon: <ExploreIcon sx={{ fontSize: 60 }} />,
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      path: '/destination-info/פריז',
      emoji: '🏙️',
      delay: '0.2s'
    },
    {
      title: 'חיפוש מתקדם',
      description: 'חפש אטרקציות, מסעדות ומלונות לפי קטגוריות וסינון מתקדם',
      icon: <SearchIcon sx={{ fontSize: 60 }} />,
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      path: '/advanced-search',
      emoji: '🔍',
      delay: '0.4s'
    },
    {
      title: 'מפת מסלולים',
      description: 'צפה במפה אינטראקטיבית וקבל ניווט מדויק לכל מקום במסלול שלך',
      icon: <MapIcon sx={{ fontSize: 60 }} />,
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      path: '/map',
      emoji: '🗺️',
      delay: '0.6s'
    }
  ];

  const popularDestinations = [
    { name: 'פריז', emoji: '🗼', color: '#667eea' },
    { name: 'רומא', emoji: '🏛️', color: '#f5576c' },
    { name: 'ברצלונה', emoji: '🏖️', color: '#4facfe' },
    { name: 'לונדון', emoji: '🎡', color: '#43e97b' },
    { name: 'אמסטרדם', emoji: '🚲', color: '#f093fb' },
    { name: 'דובאי', emoji: '🏙️', color: '#fa709a' }
  ];

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #ffffff 0%, #f8f9ff 50%, #fff5f8 100%)',
      pb: { xs: 4, md: 8 },
      pt: 'calc(64px + env(safe-area-inset-top))' // פיצוי על AppBar + iOS status bar
    }}>
      {/* Hero Section */}
      <Box sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        color: 'white',
        py: { xs: 4, md: 8 },
        px: { xs: 2, md: 3 },
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* אפקט נקודות */}
        <Box sx={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          opacity: 0.5
        }} />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3.5rem' },
              mb: 2,
              textShadow: '0 4px 20px rgba(0,0,0,0.2)',
              lineHeight: 1.3
            }}
          >
            ✈️ תכנן את הטיול המושלם שלך
          </Typography>
          <Typography
            variant="h5"
            sx={{
              mb: 4,
              opacity: 0.95,
              fontSize: { xs: '1rem', sm: '1.2rem', md: '1.5rem' },
              fontWeight: 500
            }}
          >
            מסלולים מותאמים אישית • טיפים מקומיים • מידע מקיף
          </Typography>

          <Stack
            direction="row"
            justifyContent="center"
            flexWrap="wrap"
            sx={{ gap: 2 }}
          >
            {[
              { icon: <StarIcon />, label: 'מעל 10,000 יעדים' },
              { icon: <TrendingIcon />, label: 'מסלולים מותאמים' },
              { icon: <LocationIcon />, label: 'ניווט חכם' },
            ].map((chip) => (
              <Chip
                key={chip.label}
                icon={chip.icon}
                label={chip.label}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 600,
                  backdropFilter: 'blur(10px)',
                  fontSize: '1rem',
                  py: 2.5,
                  px: 1
                }}
              />
            ))}
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: { xs: -2, md: -4 }, position: 'relative', zIndex: 2, px: { xs: 2, md: 3 } }}>

        {/* תיבת חיפוש מרחפת */}
        <Paper
          elevation={8}
          sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 4, background: 'white', mb: { xs: 3, md: 6 } }}
        >
          <Typography variant="h5" fontWeight="bold" mb={2} textAlign="center" sx={{ fontSize: { xs: '1.1rem', md: '1.5rem' } }}>
            🌍 לאן תרצה לטייל?
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
            <TextField
              fullWidth
              placeholder="חפש יעד, עיר או מדינה..."
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '1.1rem',
                  borderRadius: 2,
                  '&:hover fieldset': { borderColor: '#667eea' },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                    boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
                  }
                }
              }}
            />
            <Button
              variant="contained"
              size="large"
              startIcon={<SearchIcon />}
              onClick={() => navigate('/advanced-search')}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                px: 4,
                py: 2,
                borderRadius: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)'
                }
              }}
            >
              חפש
            </Button>
          </Box>
        </Paper>

        {/* 4 כרטיסיות ניווט */}
        <Grid container spacing={{ xs: 2, md: 4 }} mb={{ xs: 3, md: 8 }}>
          {mainFeatures.map((feature, index) => (
            <Grid item xs={12} sm={6} md={6} key={index}>
              <Card
                onClick={() => navigate(feature.path)}
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  borderRadius: 4,
                  background: feature.color,
                  color: 'white',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-10px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                  }
                }}
              >
                <CardContent sx={{ p: { xs: 2.5, md: 4 }, textAlign: 'center' }}>
                  <Box sx={{
                    fontSize: { xs: '2rem', md: '3rem' },
                    mb: 1,
                    display: 'inline-block',
                    animation: 'bounce 2.5s ease-in-out infinite',
                    animationDelay: feature.delay
                  }}>
                    {feature.emoji}
                  </Box>

                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    mb={0.5}
                    sx={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)', fontSize: { xs: '1.1rem', md: '1.5rem' } }}
                  >
                    {feature.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ opacity: 0.95, fontSize: { xs: '0.85rem', md: '1rem' }, display: { xs: 'none', sm: 'block' } }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* ======= SURPRISE ME SECTION ======= */}
        <Box
          sx={{
            mb: { xs: 4, md: 6 },
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            textAlign: 'center',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant="h5" fontWeight="bold" mb={1} sx={{ fontSize: { xs: '1.2rem', md: '1.8rem' } }}>
              לא יודע לאן לטוס? 🌍
            </Typography>
            <Typography variant="body1" mb={3} sx={{ opacity: 0.9 }}>
              תן לנו לבחור בשבילך יעד מפתיע!
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<CasinoIcon />}
              onClick={() => setSurpriseOpen(true)}
              sx={{
                background: 'white',
                color: '#764ba2',
                fontWeight: 800,
                fontSize: { xs: '1rem', md: '1.3rem' },
                px: { xs: 4, md: 6 },
                py: { xs: 1.5, md: 2 },
                borderRadius: 3,
                boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                animation: 'pulse 2s ease-in-out infinite',
                '&:hover': {
                  background: 'rgba(255,255,255,0.95)',
                  transform: 'scale(1.08)',
                  boxShadow: '0 15px 40px rgba(0,0,0,0.3)'
                }
              }}
            >
              הפתיע אותי 🎲
            </Button>
          </Box>
        </Box>

        {/* ======= VIBE MATCHER SECTION ======= */}
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2.5, md: 5 },
            borderRadius: 4,
            background: 'white',
            mb: { xs: 4, md: 6 }
          }}
        >
          <VibeMatcher />
        </Paper>

        {/* ======= QUICK ACTIONS ======= */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={{ xs: 4, md: 6 }} justifyContent="center">
          <Button
            variant="outlined"
            size="large"
            startIcon={<LuggageIcon />}
            onClick={() => setPackingOpen(true)}
            sx={{
              borderRadius: 3,
              py: 1.5,
              px: 3,
              fontWeight: 700,
              borderColor: '#667eea',
              color: '#667eea',
              '&:hover': { bgcolor: '#667eea11' }
            }}
          >
            מה לארוז? 🧳
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<GroupIcon />}
            onClick={() => navigate('/group-trip')}
            sx={{
              borderRadius: 3,
              py: 1.5,
              px: 3,
              fontWeight: 700,
              borderColor: '#f5576c',
              color: '#f5576c',
              '&:hover': { bgcolor: '#f5576c11' }
            }}
          >
            טיול קבוצתי 🗳️
          </Button>
        </Stack>

        {/* יעדים פופולריים */}
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2.5, md: 5 },
            borderRadius: 4,
            background: 'linear-gradient(135deg, #f8f9ff 0%, #fff5f8 100%)'
          }}
        >
          <Typography
            variant="h5"
            fontWeight="bold"
            textAlign="center"
            mb={3}
            sx={{ color: '#333', fontSize: { xs: '1.2rem', md: '1.5rem' } }}
          >
            🔥 יעדים פופולריים
          </Typography>

          <Grid container spacing={{ xs: 1.5, md: 3 }}>
            {popularDestinations.map((dest, index) => (
              <Grid item xs={6} sm={4} md={2} key={index}>
                <Button
                  fullWidth
                  onClick={() => navigate(`/destination-info/${dest.name}`)}
                  sx={{
                    background: `linear-gradient(135deg, ${dest.color} 0%, ${dest.color}cc 100%)`,
                    color: 'white',
                    py: { xs: 2, md: 3 },
                    px: { xs: 1, md: 2 },
                    borderRadius: '50%',
                    aspectRatio: '1',
                    minWidth: 0,
                    fontSize: { xs: '0.75rem', md: '1rem' },
                    fontWeight: 700,
                    flexDirection: 'column',
                    gap: 0.5,
                    boxShadow: `0 4px 15px ${dest.color}55`,
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      transform: 'translateY(-4px) scale(1.08)',
                      boxShadow: `0 10px 30px ${dest.color}77`
                    }
                  }}
                >
                  <Box sx={{ fontSize: { xs: '1.8rem', md: '3rem' } }}>{dest.emoji}</Box>
                  {dest.name}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* סטטיסטיקות */}
        <Grid container spacing={{ xs: 2, md: 4 }} mt={{ xs: 3, md: 6 }}>
          {[
            { icon: '🗺️', title: 'תכנון חכם', desc: 'בנה מסלול מותאם אישית עם מפות אינטראקטיביות וניווט מדויק', path: '/trip-planner' },
            { icon: '🔍', title: 'חיפוש מתקדם', desc: 'מצא אטרקציות, מסעדות ומלונות לפי קטגוריה, מיקום ומחיר', path: '/advanced-search' },
            { icon: '⛅', title: 'מידע בזמן אמת', desc: 'מזג אוויר עדכני, השוואת מחירים והמלצות לפי עונה', path: '/destination-info' }
          ].map((feature, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <Paper
                elevation={2}
                onClick={() => navigate(feature.path)}
                sx={{
                  p: { xs: 2.5, md: 4 },
                  textAlign: 'center',
                  borderRadius: 3,
                  background: 'white',
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 12px 35px rgba(0,0,0,0.12)'
                  }
                }}
              >
                <Typography sx={{ fontSize: { xs: '2rem', md: '3rem' }, mb: 1 }}>
                  {feature.icon}
                </Typography>
                <Typography variant="h6" fontWeight="bold" mb={1}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
                  {feature.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* CTA סופי */}
        <Box
          sx={{
            mt: { xs: 4, md: 8 },
            p: { xs: 3, md: 6 },
            borderRadius: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f5576c 100%)',
            textAlign: 'center',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* אפקט נקודות */}
          <Box sx={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant="h3" fontWeight="bold" mb={1.5} sx={{ fontSize: { xs: '1.4rem', md: '3rem' } }}>
              מוכן להתחיל את ההרפתקה? 🚀
            </Typography>
            <Typography variant="h6" mb={3} sx={{ opacity: 0.9, fontSize: { xs: '0.9rem', md: '1.25rem' } }}>
              צור את הטיול המושלם שלך תוך דקות ספורות
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/trip-planner')}
              sx={{
                bgcolor: 'white',
                color: '#667eea',
                px: { xs: 4, md: 6 },
                py: { xs: 1.5, md: 2 },
                fontSize: { xs: '1rem', md: '1.3rem' },
                fontWeight: 700,
                borderRadius: 3,
                transition: 'all 0.25s ease',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.92)',
                  transform: 'scale(1.08)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.2)'
                }
              }}
            >
              התחל עכשיו ←
            </Button>
          </Box>
        </Box>
      </Container>

      {/* Modals */}
      <SurpriseTripModal open={surpriseOpen} onClose={() => setSurpriseOpen(false)} />
      <PackingListModal open={packingOpen} onClose={() => setPackingOpen(false)} />

      <style>
        {`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          @keyframes pulse {
            0%, 100% { box-shadow: 0 8px 30px rgba(255,255,255,0.3); }
            50% { box-shadow: 0 8px 50px rgba(255,255,255,0.6); transform: scale(1.03); }
          }
        `}
      </style>
    </Box>
  );
};

export default HomePage;
