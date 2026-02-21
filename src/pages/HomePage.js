import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Box, Typography, Button, Grid, Card, CardContent,
  Paper, Chip, Stack
} from '@mui/material';
import {
  Flight as FlightIcon,
  Explore as ExploreIcon,
  Search as SearchIcon,
  Map as MapIcon,
  Star as StarIcon,
  TrendingUp as TrendingIcon,
  LocationOn as LocationIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';

const HomePage = () => {
  const navigate = useNavigate();

  // 4 הכפתורים המרכזיים
  const mainFeatures = [
    {
      title: 'המשך תכנון',
      description: 'המשך לתכנן את הטיול המושלם שלך',
      icon: <FlightIcon sx={{ fontSize: 60 }} />,
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      path: '/trip-planner',
      emoji: '✈️'
    },
    {
      title: 'מידע על היעד',
      description: 'קבל מידע מפורט על היעד, כולל אטרקציות, טיפים ומזג אוויר',
      icon: <ExploreIcon sx={{ fontSize: 60 }} />,
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      path: '/destination-info/פריז',
      emoji: '🏙️'
    },
    {
      title: 'חיפוש מתקדם',
      description: 'חפש אטרקציות, מסעדות ומלונות לפי קטגוריות וסינון מתקדם',
      icon: <SearchIcon sx={{ fontSize: 60 }} />,
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      path: '/advanced-search',
      emoji: '🔍'
    },
    {
      title: 'מפת מסלולים',
      description: 'צפה במפה אינטראקטיבית וקבל ניווט מדויק לכל מקום במסלול שלך',
      icon: <MapIcon sx={{ fontSize: 60 }} />,
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      path: '/map',
      emoji: '🗺️'
    }
  ];

  // יעדים פופולריים
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
      pb: 8
    }}>
      {/* Hero Section - קטן ומודרני */}
      <Box sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        color: 'white',
        py: 8,
        px: 3,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* אפקט נקודות */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          opacity: 0.5
        }} />
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography 
            variant="h2" 
            sx={{ 
              fontWeight: 800,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              mb: 2,
              textShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}
          >
            ✈️ תכנן את הטיול המושלם שלך
          </Typography>
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 4,
              opacity: 0.95,
              fontSize: { xs: '1.2rem', md: '1.5rem' },
              fontWeight: 500
            }}
          >
            מסלולים מותאמים אישית • טיפים מקומיים • מידע מקיף
          </Typography>
          
          {/* Badges */}
          <Stack 
            direction="row" 
            spacing={2} 
            justifyContent="center"
            flexWrap="wrap"
            sx={{ gap: 2 }}
          >
            <Chip 
              icon={<StarIcon />} 
              label="מעל 10,000 יעדים" 
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
            <Chip 
              icon={<TrendingIcon />} 
              label="מסלולים מותאמים" 
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
            <Chip 
              icon={<LocationIcon />} 
              label="ניווט חכם" 
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
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -4, position: 'relative', zIndex: 2 }}>
        {/* תיבת חיפוש מרחפת */}
        <Paper 
          elevation={8}
          sx={{
            p: 4,
            borderRadius: 4,
            background: 'white',
            mb: 6
          }}
        >
          <Typography variant="h5" fontWeight="bold" mb={3} textAlign="center">
            🌍 לאן תרצה לטייל?
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
            <Paper
              component="input"
              placeholder="חפש יעד, עיר או מדינה..."
              sx={{
                flex: 1,
                p: 2,
                border: '2px solid #e0e0e0',
                borderRadius: 2,
                fontSize: '1.1rem',
                outline: 'none',
                '&:focus': {
                  borderColor: '#667eea',
                  boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
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

        {/* כותרת הכפתורים */}
        <Typography 
          variant="h4" 
          fontWeight="bold" 
          textAlign="center" 
          mb={5}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f5576c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          תכנן את הטיול המושלם שלך
        </Typography>

        {/* 4 הכפתורים המרכזיים - גדולים וברורים! */}
        <Grid container spacing={4} mb={8}>
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
                    transform: 'translateY(-12px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                  }
                }}
              >
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  {/* אייקון ענק */}
                  <Box sx={{ 
                    fontSize: '5rem', 
                    mb: 2,
                    animation: 'bounce 2s infinite'
                  }}>
                    {feature.emoji}
                  </Box>
                  
                  {/* כותרת */}
                  <Typography 
                    variant="h4" 
                    fontWeight="bold" 
                    mb={2}
                    sx={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}
                  >
                    {feature.title}
                  </Typography>
                  
                  {/* תיאור */}
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      opacity: 0.95,
                      fontSize: '1.1rem',
                      mb: 3
                    }}
                  >
                    {feature.description}
                  </Typography>

                  {/* כפתור */}
                  <Button
                    variant="contained"
                    size="large"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      backdropFilter: 'blur(10px)',
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      borderRadius: 3,
                      border: '2px solid rgba(255,255,255,0.3)',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.3)',
                        transform: 'scale(1.05)'
                      }
                    }}
                  >
                    למידע נוסף ←
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* יעדים פופולריים */}
        <Paper 
          elevation={3}
          sx={{
            p: 5,
            borderRadius: 4,
            background: 'linear-gradient(135deg, #f8f9ff 0%, #fff5f8 100%)'
          }}
        >
          <Typography 
            variant="h4" 
            fontWeight="bold" 
            textAlign="center" 
            mb={4}
            sx={{ color: '#333' }}
          >
            🔥 יעדים פופולריים
          </Typography>
          
          <Grid container spacing={3}>
            {popularDestinations.map((dest, index) => (
              <Grid item xs={6} sm={4} md={2} key={index}>
                <Button
                  fullWidth
                  onClick={() => navigate(`/destination-info/${dest.name}`)}
                  sx={{
                    background: `linear-gradient(135deg, ${dest.color} 0%, ${dest.color}dd 100%)`,
                    color: 'white',
                    py: 3,
                    px: 2,
                    borderRadius: 3,
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    flexDirection: 'column',
                    gap: 1,
                    '&:hover': {
                      transform: 'scale(1.1)',
                      boxShadow: `0 10px 30px ${dest.color}66`
                    }
                  }}
                >
                  <Box sx={{ fontSize: '3rem' }}>{dest.emoji}</Box>
                  {dest.name}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* סטטיסטיקות */}
        <Grid container spacing={4} mt={6}>
          {[
            { number: '10,000+', label: 'יעדים בעולם', icon: '🌍' },
            { number: '50,000+', label: 'משתמשים מרוצים', icon: '😊' },
            { number: '100,000+', label: 'מסלולים שנוצרו', icon: '🗺️' }
          ].map((stat, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <Paper
                elevation={2}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  borderRadius: 3,
                  background: 'white',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <Typography variant="h2" sx={{ fontSize: '3rem', mb: 1 }}>
                  {stat.icon}
                </Typography>
                <Typography 
                  variant="h3" 
                  fontWeight="bold" 
                  color="primary"
                  sx={{ mb: 1 }}
                >
                  {stat.number}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  {stat.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* CTA סופי */}
        <Box 
          sx={{
            mt: 8,
            p: 6,
            borderRadius: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f5576c 100%)',
            textAlign: 'center',
            color: 'white'
          }}
        >
          <Typography variant="h3" fontWeight="bold" mb={2}>
            מוכן להתחיל את ההרפתקה? 🚀
          </Typography>
          <Typography variant="h6" mb={4} sx={{ opacity: 0.95 }}>
            צור את הטיול המושלם שלך תוך דקות ספורות
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/trip-planner')}
            sx={{
              bgcolor: 'white',
              color: '#667eea',
              px: 6,
              py: 2,
              fontSize: '1.3rem',
              fontWeight: 700,
              borderRadius: 3,
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.9)',
                transform: 'scale(1.1)',
                boxShadow: '0 10px 40px rgba(255,255,255,0.3)'
              }
            }}
          >
            התחל עכשיו ←
          </Button>
        </Box>
      </Container>

      {/* אנימציות CSS */}
      <style>
        {`
          @keyframes bounce {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }
        `}
      </style>
    </Box>
  );
};

export default HomePage;