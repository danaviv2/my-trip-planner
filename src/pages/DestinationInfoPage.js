import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  Tabs, 
  Tab, 
  Button, 
  Chip, 
  Divider, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Rating,
  useTheme,
  useMediaQuery,
  Avatar,
  IconButton,
  Skeleton
} from '@mui/material';

import { 
  Language as LanguageIcon,
  CurrencyExchange as CurrencyIcon,
  Schedule as ScheduleIcon,
  Flight as FlightIcon,
  WbSunny as SunnyIcon,
  Thermostat as ThermostatIcon,
  Restaurant as RestaurantIcon,
  Attractions as AttractionsIcon,
  DirectionsBus as TransportIcon,
  Lightbulb as TipsIcon,
  Hotel as HotelIcon,
  ArrowForward as ArrowForwardIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  Place as PlaceIcon,
  Star as StarIcon,
  AccessTime as TimeIcon,
  Euro as EuroIcon,
  PlayArrow as PlayArrowIcon,
  Image as ImageIcon
} from '@mui/icons-material';

import { useParams, useNavigate } from 'react-router-dom';
import { useTripContext } from '../contexts/TripContext';

const DestinationInfoPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { destination } = useParams();
  const { tripData, updateDestination } = useTripContext();
  const [activeTab, setActiveTab] = useState(0);
  const [destinationData, setDestinationData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  
  useEffect(() => {
    if (destination) {
      fetchDestinationData(destination);
    }
  }, [destination]);
  
  const fetchDestinationData = async (dest) => {
    setIsLoading(true);
    setError('');
    
    try {
      // כאן תבוא קריאה לפונקציית fetchDestinationData שלך
      
      // לצורך הדוגמה, נשתמש בנתונים סטטיים
      setTimeout(() => {
        const mockData = getMockDestinationData(dest);
        setDestinationData(mockData);
        setIsLoading(false);
      }, 1000); // סימולציה של API call
      
    } catch (error) {
      console.error('שגיאה בטעינת מידע על היעד:', error);
      setError('שגיאה בטעינת מידע על היעד: ' + error.message);
      setIsLoading(false);
    }
  };
  
  const getMockDestinationData = (dest) => {
    const destinationsData = {
      'פריז': {
        country: 'צרפת',
        coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200',
        tags: ['רומנטיקה', 'אמנות', 'אוכל', 'היסטוריה'],
        description: 'פריז, בירת צרפת, היא אחת הערים הרומנטיות והיפות בעולם. ידועה בזכות מגדל אייפל המפורסם, מוזיאון הלובר, קתדרלת נוטרדאם ושדרות השאנז אליזה. העיר מציעה תרבות עשירה, אמנות מרהיבה, אופנה ייחודית וחוויה קולינרית בלתי נשכחת.',
        language: 'צרפתית',
        currency: 'אירו (€)',
        airport: 'שארל דה גול (CDG), אורלי (ORY)'
      },
      'רומא': {
        country: 'איטליה',
        coverImage: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200',
        tags: ['היסטוריה', 'אמנות', 'אוכל', 'תרבות'],
        description: 'רומא, בירת איטליה, היא עיר נצח עם היסטוריה של אלפי שנים. הקולוסיאום, הוותיקן, מזרקת טרווי והפנתיאון הם רק חלק קטן מהאטרקציות המדהימות.',
        language: 'איטלקית',
        currency: 'אירו (€)',
        airport: 'פיומיצ׳ינו (FCO)'
      },
      'ברצלונה': {
        country: 'ספרד',
        coverImage: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200',
        tags: ['חופים', 'אדריכלות', 'אוכל', 'חיי לילה'],
        description: 'ברצלונה, עיר התרבות והאמנות של ספרד. סגרדה פמיליה, פארק גואל, לה רמבלה והחופים המדהימים.',
        language: 'קטלאנית וספרדית',
        currency: 'אירו (€)',
        airport: 'אל פראט (BCN)'
      },
      'לונדון': {
        country: 'בריטניה',
        coverImage: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200',
        tags: ['תרבות', 'היסטוריה', 'קניות', 'תיאטרון'],
        description: 'לונדון, בירת בריטניה, משלבת היסטוריה עתיקה עם מודרניות. ביג בן, ארמון בקינגהאם, גלגל הענק והתיאטרונים.',
        language: 'אנגלית',
        currency: 'פאונד (£)',
        airport: 'היתרו (LHR), גטוויק (LGW)'
      },
      'אמסטרדם': {
        country: 'הולנד',
        coverImage: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200',
        tags: ['תעלות', 'אופניים', 'מוזיאונים', 'פרחים'],
        description: 'אמסטרדם, עיר התעלות והאופניים. בית אנה פרנק, מוזיאון ואן גוך, שדות הטוליפים והאווירה הליברלית.',
        language: 'הולנדית',
        currency: 'אירו (€)',
        airport: 'סכיפהול (AMS)'
      },
      'דובאי': {
        country: 'איחוד האמירויות',
        coverImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200',
        tags: ['מודרניות', 'קניות', 'יוקרה', 'מדבר'],
        description: 'דובאי, עיר העתיד והפלאות. בורג׳ ח׳ליפה, דובאי מול, מלון בורג׳ אל ערב והחופים המדהימים.',
        language: 'ערבית',
        currency: 'דירהם (AED)',
        airport: 'דובאי הבינלאומי (DXB)'
      }
    };

    const defaultData = destinationsData['פריז'];
    const destData = destinationsData[dest] || defaultData;

    return {
      name: dest,
      country: destData.country,
      coverImage: destData.coverImage,
      tags: destData.tags,
      description: destData.description,
      generalInfo: {
        language: destData.language,
        currency: destData.currency,
        timezone: 'GMT+1 (GMT+2 בקיץ)',
        airport: destData.airport,
        bestTimeToVisit: 'אפריל-יוני, ספטמבר-אוקטובר',
        seasons: {
          summer: 'חם ונעים, 18°C-25°C, תקופת תיירות עמוסה',
          winter: 'קר וגשום, 2°C-8°C, פחות תיירים'
        }
      },
      currentWeather: {
        temperature: 22,
        feelsLike: 24,
        description: 'בהיר',
        icon: `https://openweathermap.org/img/wn/01d@2x.png`,
        humidity: 75,
        windSpeed: 3.5,
      },
      events: [
        {
          name: 'יום הבסטיליה',
          date: '14 ביולי',
          description: 'חגיגות יום העצמאות הצרפתי עם מצעדים, זיקוקים ואירועים ברחבי העיר.'
        },
        {
          name: 'פריז פאשן וויק',
          date: 'פברואר/מרץ וספטמבר/אוקטובר',
          description: 'שבוע האופנה המפורסם בעולם, מציג את הקולקציות החדשות של מעצבי העל.'
        }
      ],
      attractions: [
        {
          name: 'מגדל אייפל',
          image: 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=500',
          rating: 4.7,
          description: 'סמלה המפורסם של פריז, המגדל מציע נוף פנורמי מרהיב של העיר.',
          recommendedDuration: '2-3 שעות',
          price: '€18-28'
        },
        {
          name: 'מוזיאון הלובר',
          image: 'https://images.unsplash.com/photo-1527410-90b930c0a42b?w=500',
          rating: 4.8,
          description: 'אחד המוזיאונים המפורסמים בעולם, בו מוצגות יצירות אמנות כמו המונה ליזה.',
          recommendedDuration: '3-4 שעות',
          price: '€17'
        },
        {
          name: 'קתדרלת נוטרדאם',
          image: 'https://images.unsplash.com/photo-1584707824245-087f3505cfe4?w=500',
          rating: 4.7,
          description: 'קתדרלה גותית מפורסמת הממוקמת בלב פריז, בעלת היסטוריה עשירה.',
          recommendedDuration: '1-2 שעות',
          price: 'חינם (תשלום לעלייה למגדל)'
        }
      ],
      food: {
        intro: 'פריז היא גן עדן למאכלים איכותיים, מבתי קפה קסומים ועד מסעדות יוקרה כוכבי מישלן.',
        dishes: [
          {
            name: 'קרואסון',
            image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=150',
            description: 'מאפה צרפתי קלאסי, פריך ושכבתי, מושלם לארוחת בוקר עם קפה.'
          },
          {
            name: 'בף בורגיניון',
            image: 'https://images.unsplash.com/photo-1600891963935-0a566be546ec?w=150',
            description: 'תבשיל בשר מסורתי המבושל ביין אדום עם ירקות שורש ותבלינים.'
          }
        ],
        restaurants: [
          {
            name: 'Le Jules Verne',
            rating: 4.5,
            description: 'מסעדה יוקרתית במגדל אייפל עם נוף פנורמי של העיר.',
            cuisine: 'צרפתית עילית',
            priceRange: '€€€€',
            area: 'מגדל אייפל',
            website: 'https://www.restaurants-toureiffel.com/en/jules-verne-restaurant.html'
          },
          {
            name: 'Café de Flore',
            rating: 4.3,
            description: 'בית קפה היסטורי שהיה מקום מפגש לאמנים ואינטלקטואלים.',
            cuisine: 'בית קפה צרפתי',
            priceRange: '€€€',
            area: 'סן ז\'רמן',
            website: 'https://cafedeflore.fr/'
          }
        ],
        markets: [
          {
            name: 'Marché d\'Aligre',
            image: 'https://images.unsplash.com/photo-1513030230908-42087708be3c?w=300',
            description: 'שוק מקומי תוסס עם דוכני פירות, ירקות, גבינות ומאכלים טריים.',
            hours: 'שלישי-ראשון 8:00-13:00'
          }
        ]
      },
      transportation: {
        overview: 'פריז מציעה מערכת תחבורה ציבורית מצוינת, הכוללת רכבת תחתית (מטרו), אוטובוסים, רכבת מהירה (RER) ואפשרויות להשכרת אופניים.',
        options: [
          {
            name: 'מטרו',
            icon: 'subway',
            iconColor: '#1976D2',
            description: 'הדרך הטובה ביותר להתנייד בפריז, עם 16 קווים המכסים את כל העיר.',
            cost: 'כרטיס בודד €1.90, כרטיס יומי (Paris Visite) €12',
            hours: '5:30-1:15 (עד 2:15 בסופי שבוע)',
            website: 'https://www.ratp.fr/en'
          },
          {
            name: 'Vélib\'',
            icon: 'pedal_bike',
            iconColor: '#388E3C',
            description: 'מערכת השכרת אופניים עירונית, עם אלפי אופניים רגילים וחשמליים.',
            cost: '€5 ליום, €15 לשבוע',
            hours: '24/7',
            website: 'https://www.velib-metropole.fr/en_GB'
          }
        ],
        tips: [
          {
            title: 'כרטיס Paris Visite',
            description: 'שקלו לרכוש כרטיס Paris Visite המאפשר נסיעות בלתי מוגבלות בתחבורה הציבורית והנחות לאטרקציות.'
          },
          {
            title: 'אפליקציית ניווט',
            description: 'הורידו את אפליקציית RATP או Citymapper לניווט קל במערכת התחבורה הציבורית.'
          }
        ]
      },
      tips: {
        beforeTravel: [
          {
            icon: 'language',
            title: 'כמה מילים בצרפתית',
            description: 'למדו כמה מילים בסיסיות בצרפתית כמו "בוז\'ור" (שלום), "מרסי" (תודה). הצרפתים מעריכים את המאמץ.'
          },
          {
            icon: 'euro',
            title: 'כרטיס מוזיאונים',
            description: 'אם מתכננים לבקר במספר מוזיאונים, שקלו לרכוש Paris Museum Pass לחיסכון והימנעות מתורים.'
          }
        ],
        hours: {
          shopping: 'חנויות פתוחות בד״כ 10:00-19:00, סגורות בימי ראשון. חנויות גדולות פתוחות מאוחר יותר בימי חמישי.',
          restaurants: 'ארוחת צהריים 12:00-14:00, ארוחת ערב 19:30-22:00. רבות מהמסעדות סגורות בימי ראשון או שני.',
          attractions: 'רוב המוזיאונים סגורים בימי שני או שלישי, בדקו לפני ביקור.'
        },
        local: [
          {
            title: 'שפת גוף',
            description: 'הצרפתים נוטים להיות מאופקים יותר בשפת הגוף והדיבור הקולני במקומות ציבוריים נחשב לא מנומס.'
          },
          {
            title: 'טיפים במסעדות',
            description: 'שירות כלול בחשבון, אך מקובל להשאיר טיפ קטן (€1-3) אם השירות היה טוב.'
          }
        ]
      },
      nearbyDestinations: [
        {
          name: 'ורסאי',
          image: 'https://images.unsplash.com/photo-1551487499-58d68f794511?w=300',
          distance: '20'
        },
        {
          name: 'דיסנילנד פריז',
          image: 'https://images.unsplash.com/photo-1596443286276-129cb297978d?w=300',
          distance: '40'
        },
        {
          name: 'שאטו דה פונטנבלו',
          image: 'https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?w=300',
          distance: '60'
        }
      ]
    };
  };

  // חלק תחתון של כרטיס האטרקציה
  const AttractionCardFooter = ({ attraction }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, pt: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <TimeIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
        <Typography variant="caption" color="text.secondary">
          {attraction.recommendedDuration}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <EuroIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
        <Typography variant="caption" color="text.secondary">
          {attraction.price}
        </Typography>
      </Box>
    </Box>
  );

  // חלק כרטיס מסעדה
  const RestaurantCard = ({ restaurant }) => (
    <Card sx={{ 
      height: '100%', 
      borderRadius: '16px', 
      overflow: 'hidden',
      boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
      transition: 'transform 0.3s, box-shadow 0.3s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 25px rgba(0,0,0,0.1)'
      }
    }}>
      <CardContent sx={{ textAlign: 'right', direction: 'rtl' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="h3" fontWeight="600">
            {restaurant.name}
          </Typography>
          <Chip 
            label={restaurant.priceRange} 
            size="small" 
            sx={{ 
              backgroundColor: theme.palette.background.default, 
              fontWeight: 'bold'
            }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 0.5 }}>
          <Rating value={restaurant.rating} precision={0.1} size="small" readOnly />
          <Typography variant="body2" color="text.secondary">
            {restaurant.rating}
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          <strong>מטבח:</strong> {restaurant.cuisine}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          <strong>אזור:</strong> {restaurant.area}
        </Typography>
        
        <Typography variant="body2" paragraph>
          {restaurant.description}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PlaceIcon />}
            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${restaurant.name} ${destinationData.name}`)}`)}
            sx={{ 
              borderRadius: '8px', 
              flex: 1,
              textTransform: 'none',
            }}
          >
            מפה
          </Button>
          
          {restaurant.website && (
            <Button
              variant="contained"
              size="small"
              disableElevation
              onClick={() => window.open(restaurant.website)}
              sx={{ 
                borderRadius: '8px', 
                flex: 1,
                textTransform: 'none',
              }}
            >
              אתר
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // טעינה
  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 6 }}>
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: '0 0 24px 24px' }} />
          <Box sx={{ mt: -4, mx: { xs: 2, md: 'auto' }, maxWidth: '1100px' }}>
            <Skeleton variant="rectangular" height={100} sx={{ borderRadius: '16px' }} />
          </Box>
        </Box>
        <Skeleton variant="text" height={60} />
        <Skeleton variant="text" height={20} width="80%" />
        <Skeleton variant="text" height={20} width="90%" />
        <Skeleton variant="text" height={20} width="85%" />
        
        <Box sx={{ my: 4 }}>
          <Skeleton variant="rectangular" height={50} sx={{ borderRadius: '8px', mb: 2 }} />
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map((_, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Skeleton variant="rectangular" height={200} sx={{ borderRadius: '16px' }} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    );
  }
  
  // שגיאה
  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>
        <Typography variant="h6">{error}</Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          sx={{ mt: 2 }}
          onClick={() => fetchDestinationData(destination)}
        >
          נסה שוב
        </Button>
      </Box>
    );
  }
  
  // אם אין נתונים
  if (!destinationData) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">אין מידע זמין עבור יעד זה</Typography>
      </Box>
    );
  }
  
  return (
    <Box>
      {/* כותרת ותמונת רקע */}
      <Box sx={{ position: 'relative', mb: 6 }}>
        {/* תמונת רקע גדולה */}
        <Box
          sx={{
            height: { xs: '400px', md: '500px' },
            width: '100%',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: { xs: '0 0 24px 24px', md: '0 0 48px 48px' },
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backgroundImage: `url(${destinationData.coverImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'brightness(0.7)',
              transition: 'transform 10s ease',
              '&:hover': {
                transform: 'scale(1.05)'
              }
            }}
          />
          
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              p: { xs: 3, md: 6 },
              background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0))',
              color: 'white',
              textAlign: 'right',
              direction: 'rtl'
            }}
          >
            <Container maxWidth="lg">
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: 1, opacity: 0.9 }}>
                    {destinationData.country}
                  </Typography>
                  <Typography variant="h2" fontWeight="bold" sx={{ mb: 1 }}>
                    {destinationData.name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {destinationData.tags?.map((tag, index) => (
                      <Chip 
                        key={index} 
                        label={tag} 
                        size="small"
                        sx={{ 
                          bgcolor: 'rgba(255, 255, 255, 0.2)', 
                          color: 'white'
                        }} 
                      />
                    ))}
                  </Box>
                </Box>
                
                <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                  <IconButton 
                    onClick={() => setIsFavorite(!isFavorite)}
                    sx={{ 
                      bgcolor: 'rgba(255, 255, 255, 0.2)', 
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' }
                    }}
                  >
                    {isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                  </IconButton>
                  
                  <IconButton 
                    sx={{ 
                      bgcolor: 'rgba(255, 255, 255, 0.2)', 
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' }
                    }}
                  >
                    <ShareIcon />
                  </IconButton>
                </Box>
              </Box>
            </Container>
          </Box>
        </Box>
        
        {/* כרטיס מידע מהיר שמופיע מעל התמונה בתחתית */}
        <Container maxWidth="lg">
          <Paper
            elevation={0}
            sx={{
              position: 'relative',
              mt: { xs: -4, md: -6 },
              mx: { xs: 2, md: 'auto' },
              p: 3,
              maxWidth: '1100px',
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: { xs: 2, md: 3 },
              justifyContent: 'space-around',
              direction: 'rtl'
            }}
          >
            {/* מזג אוויר נוכחי */}
            {destinationData.currentWeather && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: { xs: '45%', md: 'auto' } }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    backgroundColor: theme.palette.primary.light,
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <img 
                    src={destinationData.currentWeather.icon} 
                    alt="מזג אוויר" 
                    style={{ width: 32, height: 32 }}
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">מזג אוויר</Typography>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {destinationData.currentWeather.temperature}°C, {destinationData.currentWeather.description}
                  </Typography>
                </Box>
              </Box>
            )}
            
            {/* שפה */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: { xs: '45%', md: 'auto' } }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  backgroundColor: theme.palette.secondary.light,
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <LanguageIcon sx={{ color: theme.palette.secondary.main }} />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">שפה</Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  {destinationData.generalInfo?.language || 'לא זמין'}
                </Typography>
              </Box>
            </Box>
            
            {/* מטבע */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: { xs: '45%', md: 'auto' } }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  backgroundColor: '#FFF8E1',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <CurrencyIcon sx={{ color: '#FFC107' }} />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">מטבע</Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  {destinationData.generalInfo?.currency || 'לא זמין'}
                </Typography>
              </Box>
            </Box>
            
            {/* עונה מומלצת */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: { xs: '45%', md: 'auto' } }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  backgroundColor: '#E8F5E9',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <ScheduleIcon sx={{ color: '#4CAF50' }} />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">זמן מומלץ לביקור</Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  {destinationData.generalInfo?.bestTimeToVisit || 'לא זמין'}
                </Typography>
              </Box>
            </Box>
            
            {/* לחצן תכנון */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: { xs: '100%', md: 'auto' }
              }}
            >
              <Button
                variant="contained"
                size="large"
                disableElevation
                startIcon={<FlightIcon />}
                onClick={() => navigate(`/trip-planner?destination=${destinationData.name}`)}
                sx={{
                  borderRadius: '12px',
                  px: 3,
                  py: 1.5,
                  fontWeight: 'bold',
                  textTransform: 'none'
                }}
              >
                תכנן טיול ל{destinationData.name}
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
      
      <Container maxWidth="lg" sx={{ mb: 6 }}>
        {/* טאבים למידע */}
        <Paper elevation={0} sx={{ mb: 4, borderRadius: '16px', overflow: 'hidden' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{ 
              px: 2, 
              borderBottom: 1, 
              borderColor: 'divider',
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                minHeight: '60px',
                fontSize: '1rem'
              }
            }}
          >
            <Tab 
              label="מידע כללי" 
              icon={<LanguageIcon />} 
              iconPosition="start" 
              sx={{ direction: 'rtl' }}
            />
            <Tab 
              label="אטרקציות" 
              icon={<AttractionsIcon />} 
              iconPosition="start" 
              sx={{ direction: 'rtl' }}
            />
            <Tab 
              label="אוכל ומסעדות" 
              icon={<RestaurantIcon />} 
              iconPosition="start" 
              sx={{ direction: 'rtl' }}
            />
            <Tab 
              label="תחבורה" 
              icon={<TransportIcon />} 
              iconPosition="start" 
              sx={{ direction: 'rtl' }}
            />
            <Tab 
              label="טיפים" 
              icon={<TipsIcon />} 
              iconPosition="start" 
              sx={{ direction: 'rtl' }}
            />
          </Tabs>
          
          <Box sx={{ p: 3 }}>
            {/* תוכן לשונית מידע כללי */}
            {activeTab === 0 && (
              <Box sx={{ direction: 'rtl' }}>
                <Box 
                  sx={{ 
                    mb: 4, 
                    display: 'flex', 
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 3
                  }}
                >
                  <Box sx={{ flex: 2 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      אודות {destinationData.name}
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {destinationData.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<HotelIcon />}
                        sx={{ borderRadius: '8px', textTransform: 'none' }}
                      >
                        מלונות מומלצים
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<ImageIcon />}
                        sx={{ borderRadius: '8px', textTransform: 'none' }}
                      >
                        גלריית תמונות
                      </Button>
                    </Box>
                  </Box>
                  
                  <Box 
                    sx={{ 
                      flex: 1, 
                      minWidth: { xs: '100%', md: '250px' },
                      maxWidth: { xs: '100%', md: '300px' },
                    }}
                  >
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        borderRadius: '12px', 
                        backgroundColor: 'rgba(0, 0, 0, 0.02)' 
                      }}
                    >
                      <Typography variant="h6" gutterBottom>
                        מידע שימושי
                      </Typography>
                      <List dense disablePadding>
                        <ListItem disableGutters>
                          <ListItemIcon sx={{ minWidth: '36px' }}>
                            <LanguageIcon fontSize="small" color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="שפה" 
                            secondary={destinationData.generalInfo?.language || 'לא זמין'} 
                          />
                        </ListItem>
                        <ListItem disableGutters>
                          <ListItemIcon sx={{ minWidth: '36px' }}>
                            <CurrencyIcon fontSize="small" color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="מטבע" 
                            secondary={destinationData.generalInfo?.currency || 'לא זמין'} 
                          />
                        </ListItem>
                        <ListItem disableGutters>
                          <ListItemIcon sx={{ minWidth: '36px' }}>
                            <ScheduleIcon fontSize="small" color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="אזור זמן" 
                            secondary={destinationData.generalInfo?.timezone || 'לא זמין'} 
                          />
                        </ListItem>
                        <ListItem disableGutters>
                          <ListItemIcon sx={{ minWidth: '36px' }}>
                            <FlightIcon fontSize="small" color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="נמל תעופה" 
                            secondary={destinationData.generalInfo?.airport || 'לא זמין'} 
                          />
                        </ListItem>
                      </List>
                    </Paper>
                    
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        borderRadius: '12px', 
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        mt: 2
                      }}
                    >
                      <Typography variant="h6" gutterBottom>
                        מזג אוויר ועונות
                      </Typography>
                      <List dense disablePadding>
                        <ListItem disableGutters>
                          <ListItemIcon sx={{ minWidth: '36px' }}>
                            <SunnyIcon fontSize="small" color="warning" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="קיץ" 
                            secondary={destinationData.generalInfo?.seasons?.summer || 'לא זמין'} 
                          />
                        </ListItem>
                        <ListItem disableGutters>
                          <ListItemIcon sx={{ minWidth: '36px' }}>
                            <ThermostatIcon fontSize="small" color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="חורף" 
                            secondary={destinationData.generalInfo?.seasons?.winter || 'לא זמין'} 
                          />
                        </ListItem>
                        <ListItem disableGutters>
                          <ListItemIcon sx={{ minWidth: '36px' }}>
                            <ScheduleIcon fontSize="small" color="success" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="עונה מומלצת לביקור" 
                            secondary={destinationData.generalInfo?.bestTimeToVisit || 'לא זמין'} 
                          />
                        </ListItem>
                      </List>
                    </Paper>
                  </Box>
                </Box>
                
                {/* אירועים ופסטיבלים */}
                {destinationData.events && destinationData.events.length > 0 && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      אירועים ופסטיבלים עיקריים
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      {destinationData.events.map((event, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Paper 
                            elevation={0}
                            sx={{ 
                              p: 2, 
                              height: '100%', 
                              borderRadius: '12px',
                              border: '1px solid rgba(0, 0, 0, 0.06)',
                              transition: 'all 0.2s',
                              '&:hover': {
                                boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
                                borderColor: 'transparent'
                              }
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {event.name}
                              </Typography>
                              <Chip 
                                label={event.date} 
                                size="small" 
                                sx={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                              />
                            </Box>
                            <Typography variant="body2">
                              {event.description}
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Box>
            )}
            
            {/* תוכן לשונית אטרקציות */}
            {activeTab === 1 && (
              <Box sx={{ direction: 'rtl' }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  אטרקציות מומלצות ב{destinationData.name}
                </Typography>
                <Typography variant="body1" paragraph>
                  המקומות החשובים ביותר שכדאי לבקר בהם בעת ביקור ב{destinationData.name}.
                </Typography>
                
                {destinationData.attractions && destinationData.attractions.length > 0 ? (
                  <Grid container spacing={3}>
                    {destinationData.attractions.map((attraction, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card 
                          sx={{ 
                            height: '100%', 
                            display: 'flex', 
                            flexDirection: 'column',
                            overflow: 'hidden',
                            borderRadius: '16px',
                            boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
                            transition: 'transform 0.3s, box-shadow 0.3s',
                            '&:hover': {
                              transform: 'translateY(-8px)',
                              boxShadow: '0 12px 25px rgba(0,0,0,0.1)'
                            }
                          }}
                        >
                          <Box sx={{ position: 'relative' }}>
                            <CardMedia
                              component="img"
                              height="180"
                              image={attraction.image}
                              alt={attraction.name}
                              sx={{ objectFit: 'cover' }}
                            />
                            <Box 
                              sx={{ 
                                position: 'absolute', 
                                top: 10, 
                                right: 10, 
                                backgroundColor: 'rgba(0,0,0,0.7)', 
                                borderRadius: '12px',
                                px: 1,
                                py: 0.5,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5
                              }}
                            >
                              <StarIcon sx={{ color: '#FFC107', fontSize: 16 }} />
                              <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
                                {attraction.rating}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="h6" component="h3" fontWeight="600" gutterBottom>
                              {attraction.name}
                            </Typography>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                              {attraction.description}
                            </Typography>
                            
                            <AttractionCardFooter attraction={attraction} />
                          </CardContent>
                          
                          <Box sx={{ p: 2, pt: 0, borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}>
                            <Button 
                              fullWidth
                              variant="contained"
                              disableElevation
                              size="small"
                              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${attraction.name} ${destinationData.name}`)}`)}
                              sx={{
                                borderRadius: '8px',
                                textTransform: 'none',
                                fontSize: '0.9rem'
                              }}
                            >
                              הצג במפה
                            </Button>
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body2">אין מידע זמין על אטרקציות ביעד זה.</Typography>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Button
                    variant="outlined"
                    endIcon={<ArrowForwardIcon />}
                    sx={{ borderRadius: '8px', textTransform: 'none' }}
                  >
                    הצג עוד אטרקציות ב{destinationData.name}
                  </Button>
                </Box>
              </Box>
            )}
            
            {/* תוכן לשונית אוכל ומסעדות */}
            {activeTab === 2 && (
              <Box sx={{ direction: 'rtl' }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  אוכל ומסעדות ב{destinationData.name}
                </Typography>
                <Typography variant="body1" paragraph>
                  {destinationData.food?.intro || `מידע על אוכל ומסעדות ב-${destinationData.name} יתווסף בקרוב.`}
                </Typography>
                
                {/* מאכלים מקומיים */}
                {destinationData.food?.dishes && destinationData.food.dishes.length > 0 && (
                  <Box sx={{ mb: 5 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                      מאכלים מקומיים שאסור להחמיץ
                    </Typography>
                    <Grid container spacing={2}>
                      {destinationData.food.dishes.map((dish, idx) => (
                        <Grid item xs={12} sm={6} md={4} key={idx}>
                          <Paper
                            elevation={0}
                            sx={{
                              display: 'flex',
                              gap: 2,
                              p: 2,
                              borderRadius: '16px',
                              border: '1px solid rgba(0, 0, 0, 0.06)',
                              transition: 'all 0.2s',
                              '&:hover': {
                                boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
                                borderColor: 'transparent'
                              }
                            }}
                          >
                            <Avatar
                              variant="rounded"
                              src={dish.image}
                              alt={dish.name}
                              sx={{ width: 70, height: 70, borderRadius: '12px' }}
                            />
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {dish.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {dish.description}
                              </Typography>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
                
                {/* מסעדות מומלצות */}
                {destinationData.food?.restaurants && destinationData.food.restaurants.length > 0 && (
                  <Box sx={{ mb: 5 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                      מסעדות מומלצות
                    </Typography>
                    <Grid container spacing={3}>
                      {destinationData.food.restaurants.map((restaurant, idx) => (
                        <Grid item xs={12} sm={6} md={4} key={idx}>
                          <RestaurantCard restaurant={restaurant} />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
                
                {/* שווקי אוכל */}
                {destinationData.food?.markets && destinationData.food.markets.length > 0 && (
                  <Box>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                      שווקי אוכל ואזורי קולינריה
                    </Typography>
                    <Grid container spacing={3}>
                      {destinationData.food.markets.map((market, idx) => (
                        <Grid item xs={12} sm={6} md={4} key={idx}>
                          <Card
                            sx={{
                              height: '100%',
                              borderRadius: '16px',
                              overflow: 'hidden',
                              boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
                              transition: 'transform 0.3s, box-shadow 0.3s',
                              '&:hover': {
                                transform: 'translateY(-5px)',
                                boxShadow: '0 12px 25px rgba(0,0,0,0.1)'
                              }
                            }}
                          >
                            <CardMedia
                              component="img"
                              height="140"
                              image={market.image}
                              alt={market.name}
                            />
                            <CardContent>
                              <Typography variant="h6" component="h3" fontWeight="600" gutterBottom>
                                {market.name}
                              </Typography>
                              <Typography variant="body2" paragraph>
                                {market.description}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <ScheduleIcon fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                  {market.hours || 'שעות פעילות לא זמינות'}
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
                
                {(!destinationData.food?.dishes || destinationData.food.dishes.length === 0) && 
                 (!destinationData.food?.restaurants || destinationData.food.restaurants.length === 0) && 
                 (!destinationData.food?.markets || destinationData.food.markets.length === 0) && (
                  <Box sx={{ textAlign: 'center', py: 5 }}>
                    <Typography variant="body1">אין מידע זמין על אוכל ומסעדות ביעד זה.</Typography>
                  </Box>
                )}
              </Box>
            )}
            
            {/* תוכן לשונית תחבורה */}
            {activeTab === 3 && (
              <Box sx={{ direction: 'rtl' }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  תחבורה והתניידות ב{destinationData.name}
                </Typography>
                <Typography variant="body1" paragraph>
                  {destinationData.transportation?.overview || `מידע על תחבורה ב-${destinationData.name} יתווסף בקרוב.`}
                </Typography>
                
                {destinationData.transportation?.options && destinationData.transportation.options.length > 0 ? (
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    {destinationData.transportation.options.map((option, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Paper
                          elevation={0}
                          sx={{ 
                            p: 3, 
                            height: '100%',
                            borderRadius: '16px',
                            border: '1px solid rgba(0, 0, 0, 0.06)',
                            transition: 'all 0.2s',
                            '&:hover': {
                              boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
                              borderColor: 'transparent'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Box
                              sx={{
                                mr: 2,
                                width: 40,
                                height: 40,
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: option.iconColor || theme.palette.primary.main,
                                color: 'white'
                              }}
                            >
                              <i className="material-icons">{option.icon || 'directions'}</i>
                            </Box>
                            <Typography variant="h6" fontWeight="bold">
                              {option.name}
                            </Typography>
                          </Box>
                          
                          <Typography variant="body2" paragraph>
                            {option.description}
                          </Typography>
                          
                          <Box sx={{ mt: 2 }}>
                            {option.cost && (
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <CurrencyIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                                <Typography variant="body2">
                                  <strong>עלות:</strong> {option.cost}
                                </Typography>
                              </Box>
                            )}
                            
                            {option.hours && (
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <ScheduleIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                                <Typography variant="body2">
                                  <strong>שעות פעילות:</strong> {option.hours}
                                </Typography>
                              </Box>
                            )}
                            
                            {option.website && (
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => window.open(option.website)}
                                sx={{ 
                                  mt: 2, 
                                  borderRadius: '8px',
                                  textTransform: 'none'
                                }}
                              >
                                למידע נוסף
                              </Button>
                            )}
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="body2">אין מידע זמין על אפשרויות תחבורה ביעד זה.</Typography>
                  </Box>
                )}
                
                {/* טיפים לתחבורה */}
                {destinationData.transportation?.tips && destinationData.transportation.tips.length > 0 && (
                  <Box>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                      טיפים להתניידות
                    </Typography>
                    <Grid container spacing={2}>
                      {destinationData.transportation.tips.map((tip, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                          <Paper
                            elevation={0}
                            sx={{ 
                              p: 2,
                              borderRadius: '12px',
                              backgroundColor: 'rgba(0, 0, 0, 0.02)'
                            }}
                          >
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                              {tip.title}
                            </Typography>
                            <Typography variant="body2">
                              {tip.description}
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Box>
            )}
            
            {/* תוכן לשונית טיפים */}
            {activeTab === 4 && (
              <Box sx={{ direction: 'rtl' }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  טיפים למטייל ב{destinationData.name}
                </Typography>
                
                {/* טיפים לפני הנסיעה */}
                {destinationData.tips?.beforeTravel && destinationData.tips.beforeTravel.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                      לפני הנסיעה
                    </Typography>
                    <Grid container spacing={2}>
                      {destinationData.tips.beforeTravel.map((tip, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Paper
                            elevation={0}
                            sx={{ 
                              p: 3,
                              height: '100%',
                              borderRadius: '16px',
                              border: '1px solid rgba(0, 0, 0, 0.06)',
                              transition: 'all 0.2s',
                              '&:hover': {
                                boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
                                borderColor: 'transparent'
                              }
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Box
                                sx={{
                                  mr: 2,
                                  width: 40,
                                  height: 40,
                                  borderRadius: '10px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: theme.palette.primary.main,
                                  color: 'white'
                                }}
                              >
                                <i className="material-icons">{tip.icon || 'info'}</i>
                              </Box>
                              <Typography variant="h6" fontWeight="bold">
                                {tip.title}
                              </Typography>
                            </Box>
                            <Typography variant="body2">
                              {tip.description}
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
                
                {/* שעות פעילות */}
                {destinationData.tips?.hours && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                      שעות פעילות
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Paper
                          elevation={0}
                          sx={{ 
                            p: 2,
                            height: '100%',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(0, 0, 0, 0.02)'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <i className="material-icons" style={{ color: theme.palette.primary.main }}>shopping_bag</i>
                            <Typography variant="subtitle1" fontWeight="bold">
                              חנויות
                            </Typography>
                          </Box>
                          <Typography variant="body2">
                            {destinationData.tips.hours.shopping || 'מידע לא זמין'}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Paper
                          elevation={0}
                          sx={{ 
                            p: 2,
                            height: '100%',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(0, 0, 0, 0.02)'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <i className="material-icons" style={{ color: theme.palette.primary.main }}>restaurant</i>
                            <Typography variant="subtitle1" fontWeight="bold">
                              מסעדות
                            </Typography>
                          </Box>
                          <Typography variant="body2">
                            {destinationData.tips.hours.restaurants || 'מידע לא זמין'}
                            </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Paper
                          elevation={0}
                          sx={{ 
                            p: 2,
                            height: '100%',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(0, 0, 0, 0.02)'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <i className="material-icons" style={{ color: theme.palette.primary.main }}>attractions</i>
                            <Typography variant="subtitle1" fontWeight="bold">
                              אטרקציות
                            </Typography>
                          </Box>
                          <Typography variant="body2">
                            {destinationData.tips.hours.attractions || 'מידע לא זמין'}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                )}
                
                {/* טיפים מקומיים */}
                {destinationData.tips?.local && destinationData.tips.local.length > 0 && (
                  <Box>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                      טיפים מקומיים
                    </Typography>
                    <Grid container spacing={2}>
                      {destinationData.tips.local.map((tip, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                          <Paper
                            elevation={0}
                            sx={{ 
                              p: 3,
                              borderRadius: '16px',
                              border: '1px solid rgba(0, 0, 0, 0.06)',
                              transition: 'all 0.2s',
                              '&:hover': {
                                boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
                                borderColor: 'transparent'
                              }
                            }}
                          >
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                              {tip.title}
                            </Typography>
                            <Typography variant="body2">
                              {tip.description}
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Paper>
        
        {/* יעדים קרובים */}
        {destinationData.nearbyDestinations && destinationData.nearbyDestinations.length > 0 && (
          <Box sx={{ mb: 6 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, direction: 'rtl' }}>
              <Typography variant="h5" fontWeight="bold">
                יעדים נוספים באזור
              </Typography>
              <Button 
                variant="text" 
                endIcon={<ArrowForwardIcon />}
                sx={{ textTransform: 'none' }}
              >
                הצג הכל
              </Button>
            </Box>
            <Grid container spacing={3}>
              {destinationData.nearbyDestinations.map((destination, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card 
                    sx={{ 
                      position: 'relative',
                      height: '200px',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      '&:hover': {
                        '& .MuiCardMedia-root': {
                          transform: 'scale(1.05)',
                          filter: 'brightness(0.7)'
                        },
                        '& .destination-card-content': {
                          backgroundColor: 'rgba(0, 0, 0, 0.7)'
                        },
                        '& .destination-distance': {
                          backgroundColor: theme.palette.primary.main
                        }
                      }
                    }}
                    onClick={() => navigate(`/destination-info/${destination.name}`)}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={destination.image}
                      alt={destination.name}
                      sx={{ 
                        transition: 'all 0.3s ease',
                        filter: 'brightness(0.8)'
                      }}
                    />
                    <Box
                      className="destination-card-content"
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        p: 2,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.3), transparent)',
                        transition: 'all 0.3s ease',
                        color: 'white',
                        textAlign: 'right',
                        direction: 'rtl'
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold">
                        {destination.name}
                      </Typography>
                      <Box
                        className="destination-distance"
                        sx={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          px: 1,
                          py: 0.5,
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          borderRadius: '8px',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <Typography variant="caption" fontWeight="bold">
                          {destination.distance} ק"מ
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
        
        {/* כרטיס תכנון טיול */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            textAlign: 'center',
            direction: 'rtl'
          }}
        >
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            מוכנים לתכנן את הטיול שלכם ל{destinationData.name}?
          </Typography>
          <Typography variant="body1" sx={{ maxWidth: '700px', margin: '0 auto', mb: 3 }}>
            צרו את המסלול המושלם עם אטרקציות, מסעדות ומלונות מותאמים אישית. תוכלו לשמור ולשתף את הטיול שלכם עם החברים.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrowIcon />}
              onClick={() => navigate(`/trip-planner?destination=${destinationData.name}`)}
              sx={{
                backgroundColor: 'white',
                color: theme.palette.primary.main,
                borderRadius: '12px',
                px: 4,
                py: 1.5,
                fontWeight: 'bold',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)'
                }
              }}
            >
              תכנן טיול עכשיו
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                borderColor: 'white',
                color: 'white',
                borderRadius: '12px',
                px: 4,
                py: 1.5,
                fontWeight: 'bold',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderColor: 'white'
                }
              }}
            >
              ייעוץ מסלול מותאם אישית
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default DestinationInfoPage;