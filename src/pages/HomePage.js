import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Grid, Card, CardContent,
  Paper, Chip, Stack, TextField, IconButton, Tooltip
} from '@mui/material';
import {
  Flight as FlightIcon,
  Explore as ExploreIcon,
  Search as SearchIcon,
  Map as MapIcon,
  TrendingUp as TrendingIcon,
  LocationOn as LocationIcon,
  Casino as CasinoIcon,
  Luggage as LuggageIcon,
  Group as GroupIcon,
  BookmarkBorder as MyTripsIcon,
  Share as ShareIcon,
  Route as RouteIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useBookings } from '../contexts/BookingsContext';
import NextUpCard from '../components/travel-info/NextUpCard';
import PlaceImage from '../components/destination-info/PlaceImage';
import SurpriseTripModal from '../components/surprise/SurpriseTripModal';
import VibeMatcher from '../components/vibe/VibeMatcher';
import PackingListModal from '../components/packing/PackingListModal';
import ShareTripDialog from '../components/shared/ShareTripDialog';

const HomePage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [surpriseOpen, setSurpriseOpen] = useState(false);
  const [packingOpen, setPackingOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [shareTarget, setShareTarget] = useState(null);
  const [shareFeature, setShareFeature] = useState(null);

  // הנסיעות של המשתמש. עד 04.09.2026 דף הבית לא קרא ולו נתון אחד עליו —
  // אפס הפניות ל-useAuth, useBookings או savedTrips — ולכן מי שיש לו
  // 63 הזמנות שיובאו מהמייל ראה בדיוק את המסך שרואה זר שנחת לראשונה.
  const { trips } = useBookings();

  // מקור אמת אחד לניווט לתכנון. קודם אותה מחרוזת הופיעה פעמיים —
  // ב-onKeyDown וב-onClick — וזו הדרך שבה שתי התנהגויות נפרדות.
  const goPlan = () => {
    const q = searchQuery.trim();
    navigate(`/trip-planner${q ? `?destination=${encodeURIComponent(q)}` : ''}`);
  };

  const mainFeatures = [
    {
      title: t('home.features.planner.title'),
      description: t('home.features.planner.desc'),
      icon: <FlightIcon sx={{ fontSize: 60 }} />,
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      path: '/trip-planner',
      primary: true,
      accent: '#5A5FC7',
      emoji: '✈️'
    },
    {
      title: t('home.features.destination.title'),
      description: t('home.features.destination.desc'),
      icon: <ExploreIcon sx={{ fontSize: 60 }} />,
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      path: '/destination-info',
      accent: '#C2557A',
      emoji: '🏙️'
    },
    {
      title: t('home.features.search.title'),
      description: t('home.features.search.desc'),
      icon: <SearchIcon sx={{ fontSize: 60 }} />,
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      path: '/advanced-search',
      accent: '#1E88A8',
      emoji: '🔍'
    },
    {
      title: t('home.features.map.title'),
      description: t('home.features.map.desc'),
      icon: <MapIcon sx={{ fontSize: 60 }} />,
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      path: '/map',
      accent: '#2E9E6B',
      emoji: '🗺️'
    },
    {
      title: t('home.features.myTrips.title'),
      description: t('home.features.myTrips.desc'),
      icon: <MyTripsIcon sx={{ fontSize: 60 }} />,
      color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      path: '/my-trips',
      primary: true,
      accent: '#C2557A',
      emoji: '📋'
    },
    {
      title: 'טיול מתגלגל',
      description: 'הגדר מסלול ו-AI יגלה את העצירות המושלמות לאורך הדרך',
      icon: <RouteIcon sx={{ fontSize: 60 }} />,
      color: 'linear-gradient(135deg, #f7971e 0%, #e74c3c 100%)',
      path: '/rolling-trip',
      accent: '#C2622A',
      emoji: '🛣️'
    },
    {
      title: "מצ'קמייקר יעדים",
      description: 'ענה על 5 שאלות ו-AI ימצא את היעד המושלם עבורך',
      icon: <CasinoIcon sx={{ fontSize: 60 }} />,
      color: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
      path: '/matchmaker',
      accent: '#7E5BB5',
      emoji: '🎯'
    }
  ];

  // `he` אינו קישוט: `PlaceImage` מחפש קודם בוויקיפדיה העברית, ושם
  // נמצאים תשעה מתוך עשרה מקומות לפי שמם העברי. `name` נשאר באנגלית
  // כי הוא הפרמטר בנתיב /destination-info/:destination.
  const popularDestinations = [
    { name: 'Paris', he: 'פריז', color: '#5A5FC7' },
    { name: 'Rome', he: 'רומא', color: '#C2557A' },
    { name: 'Barcelona', he: 'ברצלונה', color: '#1E88A8' },
    { name: 'London', he: 'לונדון', color: '#2E9E6B' },
    { name: 'Amsterdam', he: 'אמסטרדם', color: '#7E5BB5' },
    { name: 'Dubai', he: 'דובאי', color: '#C2622A' }
  ];


  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #ffffff 0%, #f8f9ff 50%, #fff5f8 100%)',
      pb: { xs: 4, md: 8 },
      pt: 'calc(64px + env(safe-area-inset-top))'
    }}>
      {/* "הבא בתור" — הדבר האמיתי היחיד בדף.
          `NextUpCard` מחזיר null כשאין אירוע בטווח, ולכן אורח או מי
          שאין לו נסיעה קרובה לא רואה כאן דבר והדף נשאר כשהיה. הרכיב
          הזה כבר מוצג ב-/travel-info; הוא **לא שוכפל** — אותה פונקציה
          מחשבת את אותה עובדה בשני המסכים, וזה מונע את הסטייה שהפרויקט
          כבר שילם עליה פעמיים. */}
      {trips?.length > 0 && (
        <Container maxWidth="lg" sx={{ px: { xs: 2, md: 3 }, pt: 2 }}>
          <NextUpCard trips={trips} />
        </Container>
      )}

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
        <Box sx={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          opacity: 0.5
        }} />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h2" sx={{
            fontWeight: 800,
            fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3.5rem' },
            mb: 2,
            textShadow: '0 4px 20px rgba(0,0,0,0.2)',
            lineHeight: 1.3
          }}>
            ✈️ {t('home.hero.title')}
          </Typography>
          <Typography variant="h5" sx={{
            mb: 4, opacity: 0.95,
            fontSize: { xs: '1rem', sm: '1.2rem', md: '1.5rem' },
            fontWeight: 500
          }}>
            {t('home.hero.subtitle')}
          </Typography>

          <Stack direction="row" justifyContent="center" flexWrap="wrap" sx={{ gap: 2 }}>
            {/* `chip1` הוסר ב-04.09.2026: הוא הכריז "מעל 10,000 יעדים",
                מחרוזת קשיחה שאין מאחוריה מקור — במאגר 69 רשומות. מספר
                מומצא במסך הראשון מטיל צל על כל מספר אמיתי באפליקציה. */}
            {[
              { icon: <TrendingIcon />, label: t('home.hero.chip2') },
              { icon: <LocationIcon />, label: t('home.hero.chip3') },
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
                  py: 2.5, px: 1
                }}
              />
            ))}
          </Stack>

          {/* שדה החיפוש עלה לכאן ב-04.09.2026. קודם הוא ישב בכרטיס CTA
              נפרד מתחת ל-hero, כלומר שני גושי גרדיאנט שהבטיחו אותו דבר
              ודחפו לאותה פעולה. נמדד: הפעולה השימושית הראשונה התחילה
              ב-938px גלילה במובייל — מסך שלם של סיסמאות לפניה. */}
          <Box sx={{
            display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' },
            maxWidth: 620, mx: 'auto', mt: { xs: 3, md: 4 }
          }}>
            <TextField
              fullWidth
              placeholder={t('home.search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && goPlan()}
              inputProps={{ 'aria-label': t('home.search.placeholder') }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  fontSize: '1.05rem',
                  color: 'white',
                  minHeight: 52,
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.55)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.85)' },
                  '&.Mui-focused fieldset': { borderColor: 'white', borderWidth: 2 },
                  '& input::placeholder': { color: 'rgba(255,255,255,0.85)', opacity: 1 },
                }
              }}
            />
            <Button
              variant="contained" size="large"
              startIcon={<FlightIcon />}
              onClick={goPlan}
              sx={{
                background: 'rgba(255,255,255,0.25)',
                backdropFilter: 'blur(8px)',
                border: '2px solid rgba(255,255,255,0.85)',
                color: 'white',
                px: { xs: 4, md: 5 }, minHeight: 52,
                fontSize: '1.05rem', fontWeight: 800, borderRadius: 2,
                whiteSpace: 'nowrap', transition: 'all 0.25s ease',
                '&:hover': { background: 'rgba(255,255,255,0.35)' },
              }}
            >
              {t('home.cta.button')}
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: { xs: 3, md: 4 }, position: 'relative', zIndex: 2, px: { xs: 2, md: 3 } }}>

        {/* כרטיס ה-CTA שישב כאן נמחק ב-04.09.2026 והתמזג ל-hero.
            הוא היה גוש גרדיאנט שני שחזר על אותה הבטחה, ובתוכו ישב שדה
            החיפוש היחיד בדף — כלומר הפעולה החשובה ביותר הוסתרה מתחת
            למסך שלם של סיסמאות. */}

        {/* ── כרטיסי הניווט ──
            עד 04.09.2026 היו כאן שבעה כרטיסים, כל אחד בגרדיאנט רווי
            אחר ועם אמוג'י שקופץ ללא הפסק. כשהכול מודגש שום דבר לא
            מודגש, ואי אפשר היה לדעת מהי הפעולה העיקרית.

            עכשיו שתי שכבות: שתי הפעולות שבאמת מתחילות משהו נשארות
            צבעוניות ומורמות, וחמש האחרות הפכו לרשימה שקטה ואחידה על
            נייר. הצבע נשאר רק כאייקון — סימון, לא רעש.

            האייקונים היו כבר מיובאים בקובץ ולא שימשו לתצוגה: `feature.icon`
            הוגדר ונזנח לטובת אמוג'י. עכשיו הוא בשימוש.

            האנימציה האינסופית הוסרה — היא גם רעש וגם התעלמה מהעדפת
            המשתמש להפחתת תנועה. */}
        <Grid container spacing={{ xs: 2, md: 3 }} mb={{ xs: 2, md: 3 }}>
          {mainFeatures.filter((f) => f.primary).map((feature) => (
            <Grid item xs={12} md={6} key={feature.path}>
              <Card
                onClick={() => navigate(feature.path)}
                sx={{
                  height: '100%', cursor: 'pointer', borderRadius: 4,
                  background: feature.color, color: 'white',
                  position: 'relative', overflow: 'hidden',
                  boxShadow: '0 10px 30px -12px rgba(76,79,160,.5)',
                  transition: 'transform .25s ease, box-shadow .25s ease',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 18px 40px -14px rgba(76,79,160,.6)' },
                  '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:hover': { transform: 'none' } },
                }}
              >
                <Tooltip title={`${t('share.title')} — ${feature.title}`}>
                  <IconButton
                    aria-label={`${t('share.title')} — ${feature.title}`}
                    onClick={(e) => { e.stopPropagation(); setShareFeature(feature); }}
                    sx={{
                      position: 'absolute', top: 6, right: 6,
                      color: 'rgba(255,255,255,.85)', width: 44, height: 44,
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
                    }}
                  >
                    <ShareIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>

                <CardContent sx={{ p: { xs: 3, md: 3.5 }, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'grid', placeItems: 'center', flexShrink: 0, opacity: .95, mt: .25 }}>
                    {React.cloneElement(feature.icon, { sx: { fontSize: 38 } })}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h5" fontWeight={800} mb={.5}
                      sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, lineHeight: 1.25 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: .92, fontSize: { xs: '.9rem', md: '1rem' } }}>
                      {feature.description}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={{ xs: 1.5, md: 2 }} mb={{ xs: 3, md: 6 }}>
          {mainFeatures.filter((f) => !f.primary).map((feature) => (
            <Grid item xs={12} sm={6} md={4} key={feature.path}>
              <Card
                onClick={() => navigate(feature.path)}
                sx={{
                  height: '100%', minHeight: 88, cursor: 'pointer', borderRadius: 3,
                  bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
                  boxShadow: 'none', position: 'relative',
                  transition: 'border-color .2s ease, box-shadow .2s ease',
                  '&:hover': { borderColor: feature.accent, boxShadow: '0 6px 18px -10px rgba(0,0,0,.35)' },
                  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                }}
              >
                <CardContent sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'center', '&:last-child': { pb: 2 } }}>
                  <Box sx={{
                    width: 40, height: 40, borderRadius: 2, flexShrink: 0,
                    display: 'grid', placeItems: 'center',
                    bgcolor: `${feature.accent}1A`, color: feature.accent,
                  }}>
                    {React.cloneElement(feature.icon, { sx: { fontSize: 22 } })}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={700} sx={{ fontSize: '1rem', lineHeight: 1.3 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary"
                      sx={{ fontSize: '.83rem', display: { xs: 'none', sm: '-webkit-box' },
                            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {feature.description}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Surprise Me */}
        <Box sx={{
          mb: { xs: 4, md: 6 }, p: { xs: 3, md: 5 }, borderRadius: 4,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          textAlign: 'center', color: 'white', position: 'relative', overflow: 'hidden'
        }}>
          <Box sx={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant="h5" fontWeight="bold" mb={1} sx={{ fontSize: { xs: '1.2rem', md: '1.8rem' } }}>
              {t('home.surprise.title')}
            </Typography>
            <Typography variant="body1" mb={3} sx={{ opacity: 0.9 }}>
              {t('home.surprise.subtitle')}
            </Typography>
            <Button
              variant="contained" size="large" startIcon={<CasinoIcon />}
              onClick={() => setSurpriseOpen(true)}
              sx={{
                background: 'white', color: '#764ba2', fontWeight: 800,
                fontSize: { xs: '1rem', md: '1.3rem' }, px: { xs: 4, md: 6 }, py: { xs: 1.5, md: 2 },
                borderRadius: 3, boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                animation: 'pulse 2s ease-in-out infinite',
                '&:hover': { background: 'rgba(255,255,255,0.95)', transform: 'scale(1.08)', boxShadow: '0 15px 40px rgba(0,0,0,0.3)' }
              }}
            >
              {t('home.surprise.button')}
            </Button>
          </Box>
        </Box>

        {/* VibeMatcher */}
        <Paper elevation={3} sx={{ p: { xs: 2.5, md: 5 }, borderRadius: 4, mb: { xs: 4, md: 6 } }}>
          <VibeMatcher />
        </Paper>

        {/* Quick Actions */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={{ xs: 4, md: 6 }} justifyContent="center">
          <Button
            variant="outlined" size="large" startIcon={<LuggageIcon />}
            onClick={() => setPackingOpen(true)}
            sx={{ borderRadius: 3, py: 1.5, px: 3, fontWeight: 700, borderColor: '#667eea', color: '#667eea', '&:hover': { bgcolor: '#667eea11' } }}
          >
            {t('home.quickActions.packing')}
          </Button>
          <Button
            variant="outlined" size="large" startIcon={<GroupIcon />}
            onClick={() => navigate('/group-trip')}
            sx={{ borderRadius: 3, py: 1.5, px: 3, fontWeight: 700, borderColor: '#f5576c', color: '#f5576c', '&:hover': { bgcolor: '#f5576c11' } }}
          >
            {t('home.quickActions.groupTrip')}
          </Button>
        </Stack>

        {/* יעדים פופולריים */}
        <Paper elevation={3} sx={{ p: { xs: 2.5, md: 5 }, borderRadius: 4, background: 'linear-gradient(135deg, #f8f9ff 0%, #fff5f8 100%)' }}>
          <Typography variant="h5" fontWeight="bold" textAlign="center" mb={3}
            sx={{ color: '#333', fontSize: { xs: '1.2rem', md: '1.5rem' } }}>
            {t('home.popular.title')}
          </Typography>

          {/* ── תמונות אמיתיות במקום אמוג'י ──
              עד 04.09.2026 היו כאן שישה עיגולי גרדיאנט עם אמוג'י. נמדד
              שבכל הדף הייתה **תמונה אחת** — באפליקציית טיולים, שבה
              אנשים בוחרים יעד בעין.

              `PlaceImage` כבר קיים ומביא תצלום מוויקיפדיה עם `city`
              כעוגן גאוגרפי. הוא גם הכתובת הנכונה מבחינת יושרה: כשאין
              תצלום אמיתי הוא מציג שדה צבע עם אייקון, ולא תמונת סטוק
              תחת שם מקום — הטעות שכבר נעשתה כאן ומתועדת. */}
          <Grid container spacing={{ xs: 1.5, md: 2.5 }}>
            {popularDestinations.map((dest) => (
              <Grid item xs={6} sm={4} md={2} key={dest.name}>
                <Box
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/destination-info/${dest.name}`)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate(`/destination-info/${dest.name}`)}
                  sx={{
                    position: 'relative', cursor: 'pointer', borderRadius: 3,
                    overflow: 'hidden', bgcolor: 'background.paper',
                    border: '1px solid', borderColor: 'divider',
                    transition: 'transform .2s ease, box-shadow .2s ease',
                    '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 24px -12px rgba(0,0,0,.45)' },
                    '&:focus-visible': { outline: '2px solid', outlineColor: dest.color, outlineOffset: 2 },
                    '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:hover': { transform: 'none' } },
                  }}
                >
                  <PlaceImage name={dest.he} lookup={dest.name} city={dest.he} height={110} icon="📍" />
                  <Box sx={{ px: 1, py: 1.1, textAlign: 'center' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: { xs: '.85rem', md: '.95rem' }, lineHeight: 1.2 }}>
                      {dest.he}
                    </Typography>
                  </Box>
                  <Tooltip title={`${t('share.title')} — ${dest.he}`}>
                    <IconButton
                      aria-label={`${t('share.title')} — ${dest.he}`}
                      onClick={(e) => { e.stopPropagation(); setShareTarget(dest.name); }}
                      sx={{
                        position: 'absolute', top: 2, right: 2,
                        width: 44, height: 44, color: 'white',
                        textShadow: '0 1px 3px rgba(0,0,0,.6)',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.25)' },
                      }}
                    >
                      <ShareIcon sx={{ fontSize: 17, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.6))' }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

      </Container>

      {/* Modals */}
      <SurpriseTripModal open={surpriseOpen} onClose={() => setSurpriseOpen(false)} />
      <PackingListModal open={packingOpen} onClose={() => setPackingOpen(false)} />
      <ShareTripDialog
        open={shareTarget !== null}
        onClose={() => setShareTarget(null)}
        trip={{ destination: shareTarget }}
      />
      <ShareTripDialog
        open={shareFeature !== null}
        onClose={() => setShareFeature(null)}
        shareUrl={shareFeature ? `${window.location.origin}${shareFeature.path}` : ''}
        label={shareFeature?.title}
      />

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 8px 30px rgba(255,255,255,0.3); }
          50% { box-shadow: 0 8px 50px rgba(255,255,255,0.6); transform: scale(1.03); }
        }
      `}</style>
    </Box>
  );
};

export default HomePage;
