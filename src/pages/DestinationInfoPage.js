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
  TextField,
  InputAdornment,
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
  Image as ImageIcon,
  Search as SearchIcon,
  CalendarMonth as ItineraryIcon,
  AccountBalanceWallet as BudgetIcon,
  Build as PracticalIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

import { useParams, useNavigate } from 'react-router-dom';
import { fetchDestinationFromAI } from '../services/aiDestinationService';
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
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    const trimmed = searchQuery.trim();
    if (trimmed) navigate(`/destination-info/${trimmed}`);
  };

  useEffect(() => {
    if (destination) {
      fetchDestinationData(destination);
    }
  }, [destination]);
  
  const fetchDestinationData = async (dest) => {
    setIsLoading(true);
    setError('');
    setDestinationData(null);

    try {
      // קודם בדוק במאגר הסטטי
      const staticData = getMockDestinationData(dest);
      if (staticData) {
        setDestinationData(staticData);
        setIsLoading(false);
        return;
      }

      // אם לא נמצא - שאל את ה-AI
      const aiData = await fetchDestinationFromAI(dest);
      setDestinationData(aiData);

    } catch (err) {
      console.error('שגיאה בטעינת יעד:', err.message);
      if (err.message === 'NO_API_KEY') {
        setError('no_api_key');
      } else if (err.message === 'TIMEOUT') {
        setError('הבקשה לקחה יותר מדי זמן. נסה שוב.');
      } else if (err.message === 'INVALID_RESPONSE') {
        setError('התקבלה תגובה לא תקינה מהשרת. נסה שוב.');
      } else {
        setError('שגיאה בטעינת מידע על היעד. נסה שוב.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const getMockDestinationData = (dest) => {
    const destinationsData = {
      'פריז': {
        country: 'צרפת',
        coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200',
        tags: ['רומנטיקה', 'אמנות', 'אוכל', 'היסטוריה'],
        description: 'פריז, בירת צרפת, היא אחת הערים הרומנטיות והיפות בעולם. ידועה בזכות מגדל אייפל, מוזיאון הלובר, קתדרלת נוטרדאם ושדרות השאנז אליזה.',
        language: 'צרפתית', currency: 'אירו (€)', timezone: 'GMT+1', airport: 'שארל דה גול (CDG), אורלי (ORY)',
        bestTimeToVisit: 'אפריל-יוני, ספטמבר-אוקטובר',
        seasons: { summer: 'חם ונעים 18-25°C, עמוס תיירים', winter: 'קר וגשום 2-8°C, פחות תיירים' },
        events: [
          { name: 'יום הבסטיליה', date: '14 ביולי', description: 'חגיגות יום העצמאות הצרפתי עם מצעדים וזיקוקים.' },
          { name: 'פריז פאשן וויק', date: 'פברואר ו-ספטמבר', description: 'שבוע האופנה המפורסם בעולם.' }
        ],
        attractions: [
          { name: 'מגדל אייפל', image: 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=500', rating: 4.7, description: 'סמל פריז, נוף פנורמי מרהיב.', recommendedDuration: '2-3 שעות', price: '€18-28' },
          { name: 'מוזיאון הלובר', image: 'https://images.unsplash.com/photo-1527410-90b930c0a42b?w=500', rating: 4.8, description: 'המוזיאון הגדול בעולם, בית המונה ליזה.', recommendedDuration: '3-4 שעות', price: '€17' },
          { name: 'קתדרלת נוטרדאם', image: 'https://images.unsplash.com/photo-1584707824245-087f3505cfe4?w=500', rating: 4.7, description: 'קתדרלה גותית אייקונית בלב פריז.', recommendedDuration: '1-2 שעות', price: 'חינם' }
        ],
        food: {
          intro: 'פריז היא גן עדן קולינרי - מבתי קפה קסומים ועד מסעדות כוכבי מישלן.',
          dishes: [
            { name: 'קרואסון', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=150', description: 'מאפה צרפתי קלאסי, פריך ושכבתי.' },
            { name: 'בף בורגיניון', image: 'https://images.unsplash.com/photo-1600891963935-0a566be546ec?w=150', description: 'תבשיל בשר מסורתי ביין אדום.' }
          ],
          restaurants: [
            { name: 'Le Jules Verne', rating: 4.5, description: 'מסעדה יוקרתית במגדל אייפל.', cuisine: 'צרפתית עילית', priceRange: '€€€€', area: 'מגדל אייפל', website: 'https://www.restaurants-toureiffel.com' },
            { name: 'Café de Flore', rating: 4.3, description: 'בית קפה היסטורי של אמנים ואינטלקטואלים.', cuisine: 'בית קפה', priceRange: '€€€', area: 'סן ז\'רמן', website: 'https://cafedeflore.fr' }
          ],
          markets: [{ name: 'Marché d\'Aligre', image: 'https://images.unsplash.com/photo-1513030230908-42087708be3c?w=300', description: 'שוק מקומי עם פירות, ירקות וגבינות.', hours: 'שלישי-ראשון 8:00-13:00' }]
        },
        transportation: {
          overview: 'מטרו מצוין עם 16 קווים, אוטובוסים, RER ואופניים.',
          options: [
            { name: 'מטרו', icon: 'subway', iconColor: '#1976D2', description: '16 קווים המכסים את כל העיר.', cost: 'כרטיס בודד €1.90', hours: '5:30-1:15', website: 'https://www.ratp.fr/en' },
            { name: 'Vélib\'', icon: 'pedal_bike', iconColor: '#388E3C', description: 'השכרת אופניים עירונית.', cost: '€5 ליום', hours: '24/7', website: 'https://www.velib-metropole.fr' }
          ],
          tips: [{ title: 'Paris Visite', description: 'כרטיס לנסיעות בלתי מוגבלות עם הנחות לאטרקציות.' }]
        },
        tips: {
          beforeTravel: [
            { icon: 'language', title: 'כמה מילים בצרפתית', description: '"בונז\'ור" ו"מרסי" - הצרפתים מעריכים את המאמץ.' },
            { icon: 'euro', title: 'Paris Museum Pass', description: 'חוסך כסף ומונע תורים ארוכים.' }
          ],
          hours: { shopping: '10:00-19:00, סגור ראשון', restaurants: 'צהריים 12-14, ערב 19:30-22', attractions: 'מוזיאונים סגורים שני/שלישי' },
          local: [
            { title: 'שפת גוף', description: 'הצרפתים מאופקים - דיבור קולני נחשב לא מנומס.' },
            { title: 'טיפים', description: 'שירות כלול, אך €1-3 טיפ מקובל.' }
          ]
        },
        nearbyDestinations: [
          { name: 'ורסאי', image: 'https://images.unsplash.com/photo-1551487499-58d68f794511?w=300', distance: '20' },
          { name: 'דיסנילנד פריז', image: 'https://images.unsplash.com/photo-1596443286276-129cb297978d?w=300', distance: '40' }
        ]
      },
      'רומא': {
        country: 'איטליה',
        coverImage: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200',
        tags: ['היסטוריה', 'אמנות', 'אוכל', 'תרבות'],
        description: 'רומא, עיר הנצח, מציעה אלפי שנות היסטוריה. הקולוסיאום, הוותיקן, מזרקת טרווי והפנתיאון הם רק חלק מהפלאות.',
        language: 'איטלקית', currency: 'אירו (€)', timezone: 'GMT+1', airport: 'פיומיצ׳ינו (FCO)',
        bestTimeToVisit: 'מרץ-מאי, ספטמבר-נובמבר',
        seasons: { summer: 'חם מאוד 25-35°C, עמוס תיירים', winter: 'מתון 5-15°C, פחות עמוס' },
        events: [
          { name: 'פסחא ברומא', date: 'אפריל', description: 'חגיגות קתוליות עצומות בכיכר פטרוס הקדוש.' },
          { name: 'Roma Estate', date: 'יוני-ספטמבר', description: 'פסטיבל קיץ עם קולנוע, מוזיקה ואמנות.' }
        ],
        attractions: [
          { name: 'הקולוסיאום', image: 'https://images.unsplash.com/photo-1555992336-03a23c7b20ee?w=500', rating: 4.8, description: 'האמפיתיאטר האייקוני מהמאה הראשונה.', recommendedDuration: '2-3 שעות', price: '€16' },
          { name: 'הוותיקן ומוזיאוניו', image: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=500', rating: 4.9, description: 'בית הפאפה, כולל קפלה הסיסטינית ומוזיאונים עשירים.', recommendedDuration: '4-5 שעות', price: '€17' },
          { name: 'מזרקת טרווי', image: 'https://images.unsplash.com/photo-1529154166925-574a0236a4f4?w=500', rating: 4.6, description: 'המזרקה הבארוקית המפורסמת - זרוק מטבע ותחזור!', recommendedDuration: '30 דקות', price: 'חינם' }
        ],
        food: {
          intro: 'רומא היא מקדש הפסטה, הפיצה הג\'לטו. כל שכונה מסתירה מסעדות משפחתיות נסתרות.',
          dishes: [
            { name: 'קרבונרה', image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=150', description: 'פסטה רומאית קלאסית עם ביצה, גואנצ\'לה ופקורינו.' },
            { name: 'ג\'לטו', image: 'https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=150', description: 'גלידה איטלקית קרמית - מנה חובה בכל פינה.' }
          ],
          restaurants: [
            { name: 'Da Enzo al 29', rating: 4.7, description: 'טראטוריה משפחתית אותנטית בטראסטווירה.', cuisine: 'רומאית מסורתית', priceRange: '€€', area: 'טראסטווירה', website: 'https://www.daenzoal29.com' },
            { name: 'Roscioli', rating: 4.6, description: 'מפורסמת בפסטות וגבינות מעולות.', cuisine: 'איטלקית', priceRange: '€€€', area: 'Campo de\' Fiori', website: 'https://www.salumeriaroscioli.com' }
          ],
          markets: [{ name: 'Campo de\' Fiori', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300', description: 'שוק פתוח עם פירות, ירקות ופרחים.', hours: 'שני-שבת 7:00-14:00' }]
        },
        transportation: {
          overview: 'מטרו עם 3 קווים, אוטובוסים ותרמים. המרכז ההיסטורי נוח ברגל.',
          options: [
            { name: 'מטרו', icon: 'subway', iconColor: '#E53935', description: '3 קווים, מכסה נקודות עיקריות.', cost: 'כרטיס בודד €1.50', hours: '5:30-23:30', website: 'https://www.atac.roma.it' },
            { name: 'רגלים', icon: 'directions_walk', iconColor: '#7B1FA2', description: 'המרכז ההיסטורי קטן וניתן ללכת בין רוב האתרים.', cost: 'חינם', hours: '24/7', website: '' }
          ],
          tips: [{ title: 'Roma Pass', description: 'כרטיס 48/72 שעות לתחבורה ציבורית + הנחות לאטרקציות.' }]
        },
        tips: {
          beforeTravel: [
            { icon: 'language', title: 'מילים בסיסיות', description: '"גראציה" (תודה), "בונז\'ורנו" (בוקר טוב).' },
            { icon: 'camera', title: 'הזמינו מראש', description: 'הוותיקן והקולוסיאום - חובה להזמין כרטיסים מראש.' }
          ],
          hours: { shopping: '10:00-20:00, סגור ראשון', restaurants: 'צהריים 13-15, ערב 20:00-23:00', attractions: 'מוזיאוני וותיקן סגורים ראשון' },
          local: [
            { title: 'לבוש בכנסיות', description: 'כתפיים וברכיים מכוסות נדרשות לכניסה לכנסיות.' },
            { title: 'מים', description: 'מזרקות המים ברחבי העיר מספקות מים ראויים לשתייה - חינם!' }
          ]
        },
        nearbyDestinations: [
          { name: 'פלורנס', image: 'https://images.unsplash.com/photo-1543429776-2782fc8e3f4e?w=300', distance: '280' },
          { name: 'נאפולי', image: 'https://images.unsplash.com/photo-1534308143481-c55f00dc5b31?w=300', distance: '225' }
        ]
      },
      'טוקיו': {
        country: 'יפן',
        coverImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200',
        tags: ['טכנולוגיה', 'תרבות', 'אוכל', 'אנימה'],
        description: 'טוקיו, הבירה הצפופה ביותר בעולם, מאחדת מסורת ועתיד. מקדשים עתיקים לצד בניינים עתידניים, אוכל מדהים ותרבות ייחודית.',
        language: 'יפנית', currency: 'ין (¥)', timezone: 'GMT+9', airport: 'נאריטה (NRT), הנדה (HND)',
        bestTimeToVisit: 'מרץ-מאי (דובדבן), ספטמבר-נובמבר',
        seasons: { summer: 'חם ולח 25-35°C, עונת גשמים ביוני', winter: 'קר וצלול 2-10°C, שלג לעיתים' },
        events: [
          { name: 'פריחת הדובדבן', date: 'מרץ-אפריל', description: 'חגיגת הסאקורה - פיקניקים מתחת לעצי הדובדבן הפורחים.' },
          { name: 'מסמת גיון', date: 'יולי', description: 'אחד הפסטיבלים הוותיקים ביפן עם מצעדים מסורתיים.' }
        ],
        attractions: [
          { name: 'מקדש סנסו-ג\'י', image: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=500', rating: 4.7, description: 'המקדש הבודהיסטי הוותיק ביותר בטוקיו, בשכונת אסאקוסה.', recommendedDuration: '1-2 שעות', price: 'חינם' },
          { name: 'מגדל טוקיו', image: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=500', rating: 4.5, description: 'מגדל תקשורת אייקוני עם נוף 360° של העיר.', recommendedDuration: '1-2 שעות', price: '¥1200' },
          { name: 'שיבויה קרוסינג', image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=500', rating: 4.6, description: 'מעבר החצייה הצפוף ביותר בעולם - חוויה בלתי נשכחת.', recommendedDuration: '30 דקות', price: 'חינם' }
        ],
        food: {
          intro: 'טוקיו היא גן עדן קולינרי עם יותר כוכבי מישלן מכל עיר אחרת בעולם.',
          dishes: [
            { name: 'ראמן', image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=150', description: 'מרק נודלס עשיר - כל מסעדה עם מתכון סודי משלה.' },
            { name: 'סושי', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=150', description: 'סושי אמיתי ישירות מהדייגים - לא כמו בחו״ל.' }
          ],
          restaurants: [
            { name: 'Ichiran Ramen', rating: 4.6, description: 'מסעדת ראמן מפורסמת עם תאים אישיים לחוויה מלאה.', cuisine: 'ראמן', priceRange: '¥', area: 'שיבויה', website: 'https://en.ichiran.com' },
            { name: 'Tsukiji Outer Market', rating: 4.7, description: 'שוק הדגים החיצוני - סושי בוקר טרי להפליא.', cuisine: 'פירות ים', priceRange: '¥¥', area: 'צוקיג\'י', website: '' }
          ],
          markets: [{ name: 'שוק צוקיג\'י', image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=300', description: 'שוק הדגים הגדול בעולם, פעיל מאוד בבוקר.', hours: 'שני-שבת 5:00-14:00' }]
        },
        transportation: {
          overview: 'המערכת הטובה בעולם - רכבות, מטרו ואוטובוסים מדויקים לשנייה.',
          options: [
            { name: 'JR Pass', icon: 'train', iconColor: '#F57F17', description: 'כרטיס לכל רכבות JR כולל שינקנסן - חובה לתיירים.', cost: '¥50,000 לשבוע', hours: '5:00-24:00', website: 'https://www.jrpass.com' },
            { name: 'מטרו טוקיו', icon: 'subway', iconColor: '#0097A7', description: '13 קווים המכסים את כל טוקיו.', cost: '¥170-320 לנסיעה', hours: '5:00-24:00', website: 'https://www.tokyometro.jp/en' }
          ],
          tips: [{ title: 'IC Card (Suica)', description: 'כרטיס נסיעה נטען שעובד בכל הרכבות, האוטובוסים ואפילו בנוחות-צו.' }]
        },
        tips: {
          beforeTravel: [
            { icon: 'language', title: 'אפליקציית תרגום', description: 'הורד Google Translate עם יפנית offline - הצילה מסטואציות רבות.' },
            { icon: 'wifi', title: 'Pocket WiFi', description: 'השכר Pocket WiFi בנמל התעופה - הכרחי לניווט.' }
          ],
          hours: { shopping: '10:00-21:00, פתוח 7 ימים', restaurants: 'ראמן 24 שעות, מסעדות עד 23:00', attractions: 'רוב האתרים פתוחים מ-9:00' },
          local: [
            { title: 'כיבוד קשישים', description: 'פנה מקום לקשישים ברכבת - נורמה חברתית מוקפדת.' },
            { title: 'מזומן', description: 'יפן עדיין מבוססת מזומן - משוך ין בנמל התעופה.' }
          ]
        },
        nearbyDestinations: [
          { name: 'קיוטו', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=300', distance: '450' },
          { name: 'הר פוג\'י', image: 'https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=300', distance: '100' }
        ]
      },
      'ניו יורק': {
        country: 'ארה״ב',
        coverImage: 'https://images.unsplash.com/photo-1538970272646-f61fabb3a8a2?w=1200',
        tags: ['עיר גדולה', 'תרבות', 'קניות', 'מוזיקה'],
        description: 'ניו יורק, העיר שלא ישנה, היא לב התרבות והכלכלה העולמית. מנהטן, סנטרל פארק, פסל החירות ורחוב ברודוויי.',
        language: 'אנגלית', currency: 'דולר ($)', timezone: 'GMT-5', airport: 'JFK, LaGuardia (LGA), Newark (EWR)',
        bestTimeToVisit: 'אפריל-יוני, ספטמבר-נובמבר',
        seasons: { summer: 'חם ולח 25-35°C, אירועים רבים', winter: 'קר מאוד -5-5°C, שלג' },
        events: [
          { name: 'ראש השנה האזרחי', date: '31 דצמבר', description: 'ספירת לאחור אגדית ב-Times Square עם מיליון איש.' },
          { name: 'מצעד Pride', date: 'יוני', description: 'אחד מצעדי הגאווה הגדולים בעולם.' }
        ],
        attractions: [
          { name: 'פסל החירות', image: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=500', rating: 4.7, description: 'סמל האמריקה, נגישה בספינה מהנמל.', recommendedDuration: '3-4 שעות', price: '$24' },
          { name: 'סנטרל פארק', image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=500', rating: 4.8, description: 'גן הירוק עצום בלב מנהטן - לריצה, פיקניק ושלווה.', recommendedDuration: '2-4 שעות', price: 'חינם' },
          { name: 'Empire State Building', image: 'https://images.unsplash.com/photo-1555109307-f7d9da25c244?w=500', rating: 4.6, description: 'נוף מדהים של מנהטן מהגג האייקוני.', recommendedDuration: '1-2 שעות', price: '$44' }
        ],
        food: {
          intro: 'ניו יורק היא מלטינג פוט קולינרי - מכל תרבות בעולם ניתן למצוא אוכל אמיתי.',
          dishes: [
            { name: 'NY Pizza', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=150', description: 'פיצה דקה ורחבה לפי פרוסה - חובה לאכול ברחוב.' },
            { name: 'NY Bagel', image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=150', description: 'בייגל עם קרם גבינה ולוקס - ארוחת בוקר ניו יורקית קלאסית.' }
          ],
          restaurants: [
            { name: 'Katz\'s Delicatessen', rating: 4.5, description: 'דלי יהודי אגדי מ-1888 - פסטרמי הכי טוב בעולם.', cuisine: 'דלי יהודי', priceRange: '$$', area: 'Lower East Side', website: 'https://katzsdelicatessen.com' },
            { name: 'Shake Shack Madison', rating: 4.4, description: 'המקום המקורי של רשת ההמבורגרים המפורסמת.', cuisine: 'המבורגרים', priceRange: '$$', area: 'Madison Square Park', website: 'https://www.shakeshack.com' }
          ],
          markets: [{ name: 'Chelsea Market', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300', description: 'שוק מקורה מפורסם עם מסעדות ודוכנים מכל העולם.', hours: 'יום-שישי 7:00-21:00' }]
        },
        transportation: {
          overview: 'מטרו עובד 24/7, מוניות צהובות ו-Uber זמינים בכל מקום.',
          options: [
            { name: 'מטרו NYC', icon: 'subway', iconColor: '#E53935', description: '24 קווים, פועל 24/7 - הדרך הכי זולה לנסוע.', cost: '$2.90 לנסיעה', hours: '24/7', website: 'https://new.mta.info' },
            { name: 'מונית צהובה', icon: 'local_taxi', iconColor: '#FDD835', description: 'אייקונית ניו יורקית, זמינה בכל מקום במנהטן.', cost: '$3 + מד', hours: '24/7', website: '' }
          ],
          tips: [{ title: 'MetroCard', description: 'קנה MetroCard בכניסה לתחנה - חוסך זמן ומזומן.' }]
        },
        tips: {
          beforeTravel: [
            { icon: 'security', title: 'ESTA', description: 'ישראלים זקוקים לאישור ESTA לפני הטיסה - הגש 72 שעות מראש.' },
            { icon: 'hotel', title: 'הזמן מוקדם', description: 'מלונות בניו יורק יקרים - הזמן כמה שיותר מוקדם.' }
          ],
          hours: { shopping: '10:00-21:00, פתוח 7 ימים', restaurants: 'סגנון אמריקאי - ארוחת ערב מ-18:00', attractions: 'רוב האתרים פתוחים 9:00-17:00' },
          local: [
            { title: 'טיפים', description: 'בניו יורק נהוג לתת 18-20% טיפ במסעדות - זה חלק מהשכר.' },
            { title: 'הליכה', description: 'ניו יורקים הולכים מהר - אל תעצור באמצע המדרכה לצלם.' }
          ]
        },
        nearbyDestinations: [
          { name: 'וושינגטון DC', image: 'https://images.unsplash.com/photo-1501466044931-62695aada8e9?w=300', distance: '360' },
          { name: 'בוסטון', image: 'https://images.unsplash.com/photo-1501979376754-f8b8fd3e4f4f?w=300', distance: '350' }
        ]
      },
      'בנגקוק': {
        country: 'תאילנד',
        coverImage: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200',
        tags: ['מקדשים', 'אוכל', 'קניות', 'חיי לילה'],
        description: 'בנגקוק, עיר הכסא, היא שילוב מרתק של מקדשים עתיקים, שווקים צפופים, אוכל רחוב מדהים ומודרניות בועטת.',
        language: 'תאית', currency: 'בהט (THB)', timezone: 'GMT+7', airport: 'סוברנאבהומי (BKK)',
        bestTimeToVisit: 'נובמבר-פברואר',
        seasons: { summer: 'עונת גשמים מאי-אוקטובר, חם ולח', winter: 'יבש ונעים 20-30°C' },
        events: [
          { name: 'סונגקראן', date: 'אפריל', description: 'ראש השנה התאי - מלחמת המים הגדולה בעולם!' },
          { name: 'לוי קרתונג', date: 'נובמבר', description: 'פסטיבל השקת סירות נרות על הנהר.' }
        ],
        attractions: [
          { name: 'ואט פרא קאו', image: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=500', rating: 4.8, description: 'מקדש בודה אמרלד - הקדוש ביותר בתאילנד.', recommendedDuration: '2 שעות', price: '500 בהט' },
          { name: 'שוק צף', image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=500', rating: 4.5, description: 'סירות עמוסות פירות וירקות על תעלות עתיקות.', recommendedDuration: '2-3 שעות', price: 'חינם (כניסה)' },
          { name: 'Chatuchak Weekend Market', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500', rating: 4.6, description: 'השוק הגדול בעולם - 15,000 דוכנים!', recommendedDuration: '3-4 שעות', price: 'חינם' }
        ],
        food: {
          intro: 'בנגקוק היא גן עדן של אוכל רחוב - כל פינה מגלה ריחות ומתכונים חדשים.',
          dishes: [
            { name: 'פאד תאי', image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=150', description: 'נודלס מוקפצים עם שרימפס, בוטנים ולימון - המנה הלאומית.' },
            { name: 'ירק גרין קארי', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=150', description: 'קארי קוקוס ירוק מפוצץ טעמים - חריף וארומטי.' }
          ],
          restaurants: [
            { name: 'Jay Fai', rating: 4.8, description: 'מסעדת רחוב עם כוכב מישלן - תור של שעות!', cuisine: 'תאית מסורתית', priceRange: '฿฿฿', area: 'בנגלמפו', website: '' },
            { name: 'Nahm', rating: 4.5, description: 'מסעדת Fine Dining תאית מפורסמת עולמית.', cuisine: 'תאית מודרנית', priceRange: '฿฿฿฿', area: 'סילום', website: 'https://www.comohotels.com/metropolitanbangkok/dining/nahm' }
          ],
          markets: [{ name: 'Or Tor Kor Market', image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=300', description: 'שוק הפירות הטרופיים הטובים ביותר בבנגקוק.', hours: 'יומי 6:00-18:00' }]
        },
        transportation: {
          overview: 'BTS Skytrain נוח מאוד, Grab (אובר תאילנדי) זול, וסונגתיאו (טנדר משותף) לשכונות.',
          options: [
            { name: 'BTS Skytrain', icon: 'train', iconColor: '#00897B', description: 'רכבת על גובה - מהיר ומזוגן, מכסה מרכז העיר.', cost: '17-59 בהט', hours: '6:00-24:00', website: 'https://www.bts.co.th/eng' },
            { name: 'Grab', icon: 'local_taxi', iconColor: '#1B5E20', description: 'Uber תאילנדי - זול, בטוח ועם GPS.', cost: 'החל מ-50 בהט', hours: '24/7', website: 'https://www.grab.com' }
          ],
          tips: [{ title: 'הימנע מטוק-טוק', description: 'טוק-טוקים מקומיים לעיתים מוציאים תיירים לחנויות - השתמש ב-Grab.' }]
        },
        tips: {
          beforeTravel: [
            { icon: 'health_and_safety', title: 'חיסונים', description: 'בדוק עם רופא לגבי חיסוני הפטיטיס A, טיפוס ויפנסי.' },
            { icon: 'wb_sunny', title: 'קרם הגנה', description: 'השמש חזקה מאוד - SPF 50 חובה.' }
          ],
          hours: { shopping: '10:00-22:00, פתוח 7 ימים', restaurants: 'אוכל רחוב 24/7, מסעדות עד 23:00', attractions: 'מקדשים 8:00-17:00' },
          local: [
            { title: 'כבוד למלך', description: 'ביקורת על המשפחה המלכותית היא עבירה פלילית בתאילנד.' },
            { title: 'לבוש במקדשים', description: 'כיסוי כתפיים וברכיים - מוכרים כיסויים בכניסה.' }
          ]
        },
        nearbyDestinations: [
          { name: 'פוקט', image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=300', distance: '860' },
          { name: 'צ\'יאנג מאי', image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=300', distance: '700' }
        ]
      },
      'ברצלונה': {
        country: 'ספרד',
        coverImage: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200',
        tags: ['חופים', 'אדריכלות', 'אוכל', 'חיי לילה'],
        description: 'ברצלונה, עיר התרבות והאמנות של ספרד. סגרדה פמיליה, פארק גואל, לה רמבלה והחופים המדהימים.',
        language: 'קטלאנית וספרדית', currency: 'אירו (€)', timezone: 'GMT+1', airport: 'אל פראט (BCN)',
        bestTimeToVisit: 'מאי-יוני, ספטמבר',
        seasons: { summer: 'חם ויבש 25-30°C, מלא תיירים', winter: 'מתון 10-15°C, נעים' },
        events: [
          { name: 'La Mercè', date: 'ספטמבר', description: 'פסטיבל העיר עם קסטלרס, זיקוקים ומוזיקה חינמית.' },
          { name: 'Sónar Festival', date: 'יוני', description: 'פסטיבל מוזיקה אלקטרונית ואמנות דיגיטלית עולמי.' }
        ],
        attractions: [
          { name: 'סגרדה פמיליה', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=500', rating: 4.9, description: 'מופת אדריכלי של גאודי - הכנסייה הייחודית בעולם.', recommendedDuration: '2-3 שעות', price: '€26' },
          { name: 'פארק גואל', image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=500', rating: 4.6, description: 'גן פנטסטי של גאודי עם נוף עצום על הים.', recommendedDuration: '1-2 שעות', price: '€10' },
          { name: 'לה רמבלה', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500', rating: 4.3, description: 'הרחוב המפורסם של ברצלונה - שוק, מסעדות ואמנים.', recommendedDuration: '1 שעה', price: 'חינם' }
        ],
        food: {
          intro: 'ברצלונה היא בירת הטאפאס - אוכל חברתי שמבלים עליו שעות.',
          dishes: [
            { name: 'פאן קון טומאטה', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=150', description: 'לחם עם עגבנייה ושמן זית - פשוט ומושלם.' },
            { name: 'פאייה', image: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=150', description: 'אורז עם פירות ים - המנה הקטלאנית האייקונית.' }
          ],
          restaurants: [
            { name: 'El Xampanyet', rating: 4.5, description: 'בר קאווה ישן עם טאפאס מסורתיים ב-El Born.', cuisine: 'טאפאס קטלאנית', priceRange: '€€', area: 'El Born', website: '' },
            { name: 'Tickets', rating: 4.7, description: 'מסעדת המולקולרי של אלברט אדריא - חוויה מדהימה.', cuisine: 'מודרנית', priceRange: '€€€€', area: 'Eixample', website: 'https://www.ticketsbar.es' }
          ],
          markets: [{ name: 'La Boqueria', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300', description: 'שוק הפירות והמזון המפורסם של ברצלונה.', hours: 'שני-שבת 8:00-20:30' }]
        },
        transportation: {
          overview: 'מטרו מצוין, אוטובוסים, ואפשרות נעימה ללכת ברגל לאורך הים.',
          options: [
            { name: 'מטרו', icon: 'subway', iconColor: '#D32F2F', description: '12 קווים, מכסה את כל ברצלונה.', cost: 'כרטיס T-Casual €11.35 ל-10 נסיעות', hours: '5:00-24:00 (כל הלילה שישי)', website: 'https://www.tmb.cat/en' },
            { name: 'אופניים', icon: 'pedal_bike', iconColor: '#388E3C', description: 'Bicing - השכרת אופניים לתושבים, DONKEY לתיירים.', cost: '€5-10 ליום', hours: '24/7', website: '' }
          ],
          tips: [{ title: 'T-Casual', description: '10 נסיעות ב-€11 - הרבה יותר זול מכרטיסים בודדים.' }]
        },
        tips: {
          beforeTravel: [
            { icon: 'warning', title: 'שמור על חפציך', description: 'הרמבלה ידועה בכיסי. שמור על הארנק והטלפון.' },
            { icon: 'camera', title: 'הזמן לסגרדה פמיליה', description: 'חובה להזמין מראש - תורים ארוכים מאוד בלעדי זה.' }
          ],
          hours: { shopping: '10:00-21:00, סגור ראשון', restaurants: 'ארוחת ערב 21:00-23:30 - אל תגיע לפני 21!', attractions: 'מוזיאונים 10:00-18:00' },
          local: [
            { title: 'קטלאנית', description: 'דבר ספרדית לא קטלאנית - חלק מהמקומיים עלולים להתרעם.' },
            { title: 'שנת צהריים', description: 'חנויות ומסעדות רבות סגורות 14:00-17:00.' }
          ]
        },
        nearbyDestinations: [
          { name: 'מדריד', image: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=300', distance: '620' },
          { name: 'ואלנסיה', image: 'https://images.unsplash.com/photo-1562183241-b937e9102f47?w=300', distance: '350' }
        ]
      },
      'לונדון': {
        country: 'בריטניה',
        coverImage: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200',
        tags: ['תרבות', 'היסטוריה', 'קניות', 'תיאטרון'],
        description: 'לונדון, בירת בריטניה, משלבת היסטוריה עתיקה עם מודרניות. ביג בן, ארמון בקינגהאם, גלגל הענק והתיאטרונים.',
        language: 'אנגלית', currency: 'פאונד (£)', timezone: 'GMT', airport: 'היתרו (LHR), גטוויק (LGW)',
        bestTimeToVisit: 'מאי-ספטמבר',
        seasons: { summer: 'נעים 18-25°C, אורך יום', winter: 'קר וגשום 2-8°C' },
        events: [
          { name: 'Notting Hill Carnival', date: 'אוגוסט', description: 'קרנבל הקריבי הגדול באירופה - מוזיקה, ריקוד ואוכל.' },
          { name: 'Guy Fawkes Night', date: '5 נובמבר', description: 'זיקוקים ומדורות ברחבי העיר.' }
        ],
        attractions: [
          { name: 'המוזיאון הבריטי', image: 'https://images.unsplash.com/photo-1526139334526-f591a54b477c?w=500', rating: 4.8, description: 'אחד המוזיאונים הגדולים בעולם - אוצרות מכל התרבויות.', recommendedDuration: '3-4 שעות', price: 'חינם' },
          { name: 'ביג בן ופרלמנט', image: 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=500', rating: 4.6, description: 'סמל לונדון - שעון הכינוי הגדול לצד הטמזה.', recommendedDuration: '1 שעה', price: 'חינם (חיצוני)' },
          { name: 'מוזיאון הלאומי', image: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=500', rating: 4.7, description: 'עצמות דינוזאורים, אמנות ומדע - חינם!', recommendedDuration: '2-3 שעות', price: 'חינם' }
        ],
        food: {
          intro: 'לונדון מציעה מגוון קולינרי עצום - מ-fish & chips מסורתי ועד מסעדות כוכבי מישלן.',
          dishes: [
            { name: 'Fish & Chips', image: 'https://images.unsplash.com/photo-1571091655789-405eb7a3a3a8?w=150', description: 'הארוחה הבריטית הקלאסית - דג מטוגן עם צ\'יפס.' },
            { name: 'Full English Breakfast', image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=150', description: 'ביצים, בייקון, שעועית, עגבנייה וסלאמי - ארוחת בוקר אנגלית.' }
          ],
          restaurants: [
            { name: 'The Ledbury', rating: 4.8, description: 'מסעדת 2 כוכבי מישלן בנוטינג היל.', cuisine: 'בריטית מודרנית', priceRange: '££££', area: 'Notting Hill', website: 'https://www.theledbury.com' },
            { name: 'Borough Market', rating: 4.7, description: 'שוק אוכל היסטורי עם מיטב המוצרים הבריטיים.', cuisine: 'מגוון', priceRange: '££', area: 'Southwark', website: 'https://boroughmarket.org.uk' }
          ],
          markets: [{ name: 'Borough Market', image: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=300', description: 'שוק אוכל היסטורי מ-1276 עם מוצרים מכל העולם.', hours: 'שני-שבת 10:00-17:00' }]
        },
        transportation: {
          overview: 'The Tube (מטרו לונדוני) הוא הוותיק בעולם, אוטובוסים קומותיים אדומים ותחבורת נהר.',
          options: [
            { name: 'The Tube', icon: 'subway', iconColor: '#C62828', description: 'מטרו לונדון - 11 קווים, ותיק בעולם.', cost: 'חל 2 Zones £2.80', hours: '5:00-1:00', website: 'https://tfl.gov.uk' },
            { name: 'אוטובוס אדום', icon: 'directions_bus', iconColor: '#B71C1C', description: 'אייקון לונדוני - מכסה גם מה שהמטרו לא.', cost: '£1.75 לנסיעה', hours: '24/7', website: 'https://tfl.gov.uk' }
          ],
          tips: [{ title: 'Oyster Card', description: 'כרטיס נסיעה נטען - הרבה יותר זול מכרטיס בודד.' }]
        },
        tips: {
          beforeTravel: [
            { icon: 'language', title: 'אנגלית', description: 'לונדון מרתק אנגלי - תוכל להסתדר בלי בעיות.' },
            { icon: 'wb_cloudy', title: 'מטרייה', description: 'גשם בכל עת - קח מטרייה קומפקטית תמיד.' }
          ],
          hours: { shopping: '9:00-20:00, ראשון 11:00-17:00', restaurants: 'ארוחת ערב 18:00-22:00', attractions: 'מוזיאונים לאומיים פתוחים 10:00-17:30, חינם' },
          local: [
            { title: 'תור', description: 'הבריטים מקפידים מאוד על תורים - לא לנסות לקפוץ.' },
            { title: 'ברכישה משמאל', description: 'בסקלטורים - עמוד ימין, הלוך שמאל.' }
          ]
        },
        nearbyDestinations: [
          { name: 'אוקספורד', image: 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=300', distance: '90' },
          { name: 'קיימברידג\'', image: 'https://images.unsplash.com/photo-1562619371033-5de84c0d64e0?w=300', distance: '100' }
        ]
      },
      'אמסטרדם': {
        country: 'הולנד',
        coverImage: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200',
        tags: ['תעלות', 'אופניים', 'מוזיאונים', 'פרחים'],
        description: 'אמסטרדם, עיר התעלות והאופניים. בית אנה פרנק, מוזיאון ואן גוך, שדות הטוליפים והאווירה הליברלית.',
        language: 'הולנדית', currency: 'אירו (€)', timezone: 'GMT+1', airport: 'סכיפהול (AMS)',
        bestTimeToVisit: 'אפריל-מאי (טוליפים), יוני-אוגוסט',
        seasons: { summer: 'נעים 18-22°C, ארוך ובהיר', winter: 'קר וגשום 0-6°C' },
        events: [
          { name: 'קינגס דיי', date: '27 אפריל', description: 'יום הולדת המלך - כל העיר כתומה, מסיבות ושווקים.' },
          { name: 'Amsterdam Light Festival', date: 'דצמבר-ינואר', description: 'יצירות אור לאורך התעלות.' }
        ],
        attractions: [
          { name: 'בית אנה פרנק', image: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=500', rating: 4.7, description: 'המחבוא ההיסטורי של משפחת פרנק - מרגש ביותר.', recommendedDuration: '1-2 שעות', price: '€14' },
          { name: 'מוזיאון ואן גוך', image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=500', rating: 4.8, description: 'אוסף ציורי ואן גוך הגדול בעולם.', recommendedDuration: '2-3 שעות', price: '€22' },
          { name: 'שדות טוליפים', image: 'https://images.unsplash.com/photo-1490750967868-88df5691cc93?w=500', rating: 4.9, description: 'שטיחי פרחים צבעוניים - חובה באפריל-מאי.', recommendedDuration: 'חצי יום', price: '€20 (כולר)' }
        ],
        food: {
          intro: 'אמסטרדם מציעה אוכל בינלאומי מגוון ומסורות מקומיות ייחודיות.',
          dishes: [
            { name: 'הרינג', image: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=150', description: 'דג הרינג טרי עם בצל - המנה ההולנדית הקלאסית.' },
            { name: 'ספייקולאס', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=150', description: 'עוגיות תבלינים הולנדיות - מושלמות עם קפה.' }
          ],
          restaurants: [
            { name: 'Rijks Restaurant', rating: 4.6, description: 'מסעדת כוכב מישלן בתוך מוזיאון ריקס.', cuisine: 'הולנדית מודרנית', priceRange: '€€€€', area: 'מוזיאון', website: 'https://rijksrestaurant.nl' },
            { name: 'Foodhallen', rating: 4.4, description: 'מרחב אוכל ענק עם 21 מטבחים שונים.', cuisine: 'מגוון', priceRange: '€€', area: 'De Hallen', website: 'https://foodhallen.nl' }
          ],
          markets: [{ name: 'Albert Cuyp Market', image: 'https://images.unsplash.com/photo-1513030230908-42087708be3c?w=300', description: 'השוק הגדול בהולנד - אוכל, בגדים וסחורות.', hours: 'שני-שבת 9:00-17:00' }]
        },
        transportation: {
          overview: 'אופניים הן המלכה! תחבורה ציבורית מצוינת עם טראם, אוטובוס ומטרו.',
          options: [
            { name: 'אופניים', icon: 'pedal_bike', iconColor: '#E65100', description: 'השכר אופניים - כולם רוכבים, יש נתיבים בכל מקום.', cost: '€10-15 ליום', hours: '24/7', website: '' },
            { name: 'טראם', icon: 'tram', iconColor: '#1565C0', description: '17 קווי טראם המכסים את המרכז.', cost: 'כרטיס יומי €8', hours: '6:00-24:00', website: 'https://www.gvb.nl/en' }
          ],
          tips: [{ title: 'I Amsterdam Card', description: 'כרטיס תיירות הכולל תחבורה ציבורית + כניסה למוזיאונים.' }]
        },
        tips: {
          beforeTravel: [
            { icon: 'pedal_bike', title: 'נסיעה באופניים', description: 'שים לב לנתיבי אופניים - תיירים לעיתים נפגעים.' },
            { icon: 'confirmation_number', title: 'הזמן מראש', description: 'בית אנה פרנק ומוזיאון ואן גוך - הזמן שבועות מראש.' }
          ],
          hours: { shopping: '10:00-18:00, ראשון 12:00-18:00', restaurants: 'ארוחת ערב 18:00-22:00', attractions: 'מוזיאונים 9:00-17:00' },
          local: [
            { title: 'אופניים ראשונה', description: 'באמסטרדם אופניים הם תחבורה רצינית - לא לגנוב מקום בנתיב.' },
            { title: 'אנגלית', description: 'ההולנדים מדברים אנגלית מצוינת - אין בעיה לתקשר.' }
          ]
        },
        nearbyDestinations: [
          { name: 'כולר (שדות טוליפים)', image: 'https://images.unsplash.com/photo-1490750967868-88df5691cc93?w=300', distance: '35' },
          { name: 'האג', image: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=300', distance: '55' }
        ]
      },
      'דובאי': {
        country: 'איחוד האמירויות',
        coverImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200',
        tags: ['מודרניות', 'קניות', 'יוקרה', 'מדבר'],
        description: 'דובאי, עיר העתיד והפלאות. בורג׳ ח׳ליפה, דובאי מול, מלון בורג׳ אל ערב וחוויות מדבר.',
        language: 'ערבית', currency: 'דירהם (AED)', timezone: 'GMT+4', airport: 'דובאי הבינלאומי (DXB)',
        bestTimeToVisit: 'נובמבר-מרץ',
        seasons: { summer: 'לוהט מאוד 40-45°C, לח', winter: 'מושלם 20-28°C, מעט גשם' },
        events: [
          { name: 'DSF - דובאי שופינג פסטיבל', date: 'ינואר-פברואר', description: 'פסטיבל הקניות הגדול בעולם עם הנחות ואטרקציות.' },
          { name: 'חג ריצות אבו דאבי', date: 'מרץ', description: 'תחרות גמלים וסוסים - תרבות מקומית עשירה.' }
        ],
        attractions: [
          { name: 'בורג׳ ח׳ליפה', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=500', rating: 4.7, description: 'הבניין הגבוה בעולם - 828 מטר, נוף בלתי נשכח.', recommendedDuration: '2 שעות', price: 'AED 169' },
          { name: 'דובאי מול', image: 'https://images.unsplash.com/photo-1567529684892-09290a1b2d05?w=500', rating: 4.5, description: 'הקניון הגדול בעולם - 1,200 חנויות, מלחייה ומגלשת קרח.', recommendedDuration: '3-5 שעות', price: 'חינם (כניסה)' },
          { name: 'ספארי מדבר', image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=500', rating: 4.8, description: 'נסיעה בדיונות, רכיבת גמל וארוחת ערב בדרביה.', recommendedDuration: 'חצי יום', price: 'AED 200-400' }
        ],
        food: {
          intro: 'דובאי היא גסטרונומיה עולמית - מאוכל אמירתי מסורתי ועד כל מסעדה בעולם.',
          dishes: [
            { name: 'שאוורמה', image: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=150', description: 'שאוורמה ערבית אותנטית - עטוף עם חומוס ופיקלס.' },
            { name: 'ח׳בז ומוחמרה', image: 'https://images.unsplash.com/photo-1542345812-d98b5cd6cf98?w=150', description: 'לחם ערבי עם ממרח גמבה אדום - ארוחת בוקר מקומית.' }
          ],
          restaurants: [
            { name: 'Nobu Dubai', rating: 4.6, description: 'מסעדת יוקרה יפנית-פרואנית של שף נובו.', cuisine: 'יפנית-יוקרה', priceRange: 'AED AED AED', area: 'Atlantis', website: 'https://www.atlantis.com/dubai/dining/nobu' },
            { name: 'Al Ustad Special Kebab', rating: 4.7, description: 'קבב איראני אמיתי - פשוט ומדהים מאז 1978.', cuisine: 'מסורתית', priceRange: 'AED', area: 'Deira', website: '' }
          ],
          markets: [{ name: 'Gold Souk', image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=300', description: 'שוק הזהב - 400 חנויות זהב ותכשיטים.', hours: 'ראשון-חמישי 10:00-22:00' }]
        },
        transportation: {
          overview: 'מטרו מודרני, אוטובוסים וטקסי זמינים. אובר וכרים זמינים ותיסים.',
          options: [
            { name: 'מטרו דובאי', icon: 'subway', iconColor: '#C62828', description: '2 קווים אוטומטיים - ניקיון ומיזוג מושלם.', cost: 'AED 1.8-7.5', hours: '5:30-24:00 (שישי עד 1:00)', website: 'https://www.rta.ae' },
            { name: 'Careem', icon: 'local_taxi', iconColor: '#5D4037', description: 'אובר מקומי - נוח, זול ובטוח.', cost: 'החל מ-AED 10', hours: '24/7', website: 'https://www.careem.com' }
          ],
          tips: [{ title: 'NOL Card', description: 'כרטיס תחבורה לכל האמצעים - מטרו, אוטובוס, טראם.' }]
        },
        tips: {
          beforeTravel: [
            { icon: 'gavel', title: 'חוקים קפדניים', description: 'שתיית אלכוהול ברחוב, נשיקות בפומבי - אסור חוקית.' },
            { icon: 'wb_sunny', title: 'חום קיצוני', description: 'בקיץ - הישאר בפנים עם מיזוג בין 11:00-16:00.' }
          ],
          hours: { shopping: 'קניונים 10:00-22:00, שווקים 9:00-23:00', restaurants: 'עד 24:00 ברוב המקומות', attractions: 'גג בורג׳ ח׳ליפה - הזמן מראש!' },
          local: [
            { title: 'לבוש צנוע', description: 'בקניונים ואתרים ציבוריים - כיסוי כתפיים וברכיים.' },
            { title: 'רמדאן', description: 'אסור לאכול או לשתות ברחוב ביום בתקופת הרמדאן.' }
          ]
        },
        nearbyDestinations: [
          { name: 'אבו דאבי', image: 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=300', distance: '140' },
          { name: 'מסאפי', image: 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=300', distance: '120' }
        ]
      },
      'פראג': {
        country: 'צ\'כיה',
        coverImage: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=1200',
        tags: ['ארכיטקטורה', 'בירה', 'היסטוריה', 'רומנטיקה'],
        description: 'פראג, עיר מאה הצריחים, היא אחת הערים היפות באירופה. טירת פראג, גשר קרלוב, שכונת יהודי פראג - כמו בסיפור אגדה.',
        language: 'צ\'כית', currency: 'קורונה (CZK)', timezone: 'GMT+1', airport: 'ואצלב האוול (PRG)',
        bestTimeToVisit: 'מאי-יוני, ספטמבר',
        seasons: { summer: 'נעים 22-28°C, עמוס תיירים', winter: 'קר -2-5°C, שלג, שוק חג המולד' },
        events: [
          { name: 'פסטיבל קיץ בפראג', date: 'יוני-ספטמבר', description: 'קונצרטים קלאסיים בבניינים היסטוריים.' },
          { name: 'שוק חג המולד', date: 'נובמבר-דצמבר', description: 'כיכר ליל עם דוכנים, פונץ\' ועוגיות.' }
        ],
        attractions: [
          { name: 'טירת פראג', image: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=500', rating: 4.7, description: 'הטירה הגדולה בעולם - קומפלקס עצום מעל העיר.', recommendedDuration: '3-4 שעות', price: 'CZK 250' },
          { name: 'גשר קרלוב', image: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=500', rating: 4.8, description: 'גשר גותי עם 30 פסלי קדושים מהמאה ה-14.', recommendedDuration: '30-60 דקות', price: 'חינם' },
          { name: 'כיכר העיר העתיקה', image: 'https://images.unsplash.com/photo-1580828343064-fde4fc206bc6?w=500', rating: 4.7, description: 'לב פראג עם שעון האסטרולוגיה מהמאה ה-15.', recommendedDuration: '1-2 שעות', price: 'חינם' }
        ],
        food: {
          intro: 'מטבח צ\'כי עשיר ומשביע - בשרים, כרוב ובירה מהטובות בעולם.',
          dishes: [
            { name: ' סבי?קובה', image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=150', description: 'גולאש צ\'כי עם כנדליקי (כיסנים) - מנה לאומית.' },
            { name: 'טריידלניק', image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=150', description: 'מאפה מגולגל סלילי עם סוכר - מנה רחוב פופולרית.' }
          ],
          restaurants: [
            { name: 'Lokál', rating: 4.6, description: 'ביר-הול צ\'כי אותנטי עם בירת פילסנר בוהמי.', cuisine: 'מסורתית צ\'כית', priceRange: 'CZK CZK', area: 'מרכז', website: 'https://lokal-dlouha.ambi.cz' },
            { name: 'Field Restaurant', rating: 4.7, description: 'כוכב מישלן עם מטבח צ\'כי מודרני מרשים.', cuisine: 'צ\'כית מודרנית', priceRange: 'CZK CZK CZK CZK', area: 'עיר עתיקה', website: 'https://www.fieldrestaurant.cz' }
          ],
          markets: [{ name: 'שוק האיכרים נאפלבסקה', image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=300', description: 'שוק אורגני ב-Náměstí Míru עם מוצרים מקומיים.', hours: 'שישי 8:00-14:00' }]
        },
        transportation: {
          overview: 'תחבורה ציבורית מצוינת - מטרו, טראם ואוטובוס. המרכז ניתן ללכת ברגל.',
          options: [
            { name: 'מטרו', icon: 'subway', iconColor: '#C62828', description: '3 קווים A/B/C מכסים את פראג.', cost: 'כרטיס 90 דקות CZK 30', hours: '5:00-24:00', website: 'https://www.dpp.cz/en' },
            { name: 'טראם', icon: 'tram', iconColor: '#E65100', description: 'טראם אדום אייקוני - נוף מדהים תוך כדי נסיעה.', cost: 'כלול בכרטיס התחבורה', hours: '24/7 (קו לילה)', website: 'https://www.dpp.cz/en' }
          ],
          tips: [{ title: 'Prague Card', description: 'כרטיס 2/3/4 יום עם כניסה לאטרקציות ותחבורה חינמית.' }]
        },
        tips: {
          beforeTravel: [
            { icon: 'euro', title: 'קורונה צ\'כית', description: 'שלם בקורונה מקומית - שער ההמרה טוב יותר ממחיר באירו.' },
            { icon: 'warning', title: 'שחלות', description: 'ב-Wenceslas Square - היזהר מסוכרייה יקרה ומרמאים.' }
          ],
          hours: { shopping: '10:00-20:00, ראשון 12:00-18:00', restaurants: 'ארוחת ערב 18:00-23:00, מחירים נמוכים!', attractions: 'טירת פראג 6:00-22:00' },
          local: [
            { title: 'אנגלית', description: 'רוב הצ\'כים הצעירים מדברים אנגלית טובה.' },
            { title: 'בירה זולה', description: 'בירה בפראג זולה יותר ממים מינרלים - תרבות ייחודית.' }
          ]
        },
        nearbyDestinations: [
          { name: 'וינה', image: 'https://images.unsplash.com/photo-1516550893885-985c836c5e05?w=300', distance: '330' },
          { name: 'בודפשט', image: 'https://images.unsplash.com/photo-1551867633-194f125bddfa?w=300', distance: '525' }
        ]
      },
      'סינגפור': {
        country: 'סינגפור',
        coverImage: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200',
        tags: ['מודרניות', 'אוכל', 'גינות', 'קניות'],
        description: 'סינגפור, עיר-מדינה עתידנית, מפגישה תרבויות אסיה. Gardens by the Bay, Marina Bay Sands, ושפע קולינרי ייחודי.',
        language: 'אנגלית, מנדרינית, מאלאית, טמילית', currency: 'דולר סינגפורי (SGD)', timezone: 'GMT+8', airport: 'צ\'אנגי (SIN)',
        bestTimeToVisit: 'פברואר-אפריל, יולי-אוגוסט',
        seasons: { summer: 'חם ולח כל השנה 26-32°C, עונות גשם', winter: 'אין עונות - חם לאורך כל השנה' },
        events: [
          { name: 'Singapore Food Festival', date: 'יולי', description: 'חגיגת המטבח הסינגפורי הייחודי עם שפים מכל העולם.' },
          { name: 'Deepavali (חג האורות)', date: 'אוקטובר-נובמבר', description: 'חג ההינדי עם קישוטי אור מרהיבים ב-Little India.' }
        ],
        attractions: [
          { name: 'Gardens by the Bay', image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=500', rating: 4.8, description: 'גנים עתידניים עם עצי-על ענקיים - מרהיב בלילה.', recommendedDuration: '2-3 שעות', price: 'SGD 28 (כיפות)' },
          { name: 'Marina Bay Sands', image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=500', rating: 4.7, description: 'מלון אייקוני עם בריכה ב-200 מטר גובה ונוף עוצר נשימה.', recommendedDuration: '2 שעות', price: 'SGD 23 (SkyPark)' },
          { name: 'Hawker Centers', image: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=500', rating: 4.9, description: 'מרכזי אוכל רחוב עם מנות כוכבי מישלן ב-SGD 3.', recommendedDuration: '1-2 שעות', price: 'החל מ-SGD 3' }
        ],
        food: {
          intro: 'סינגפור היא גן עדן קולינרי - מטבחים סיניים, מאליים, הודים ואירופאים יחד.',
          dishes: [
            { name: 'Chicken Rice', image: 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=150', description: 'עוף על אורז עם ציר מרוכז - המנה הלאומית.' },
            { name: 'Laksa', image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=150', description: 'מרק נודלס קוקוס ושרימפס - שילוב סיני-מאלאי.' }
          ],
          restaurants: [
            { name: 'Hawker Chan', rating: 4.5, description: 'הוקר בעל כוכב מישלן - עוף ואורז ב-SGD 3.', cuisine: 'קנטונזית', priceRange: 'SGD', area: 'Chinatown', website: '' },
            { name: 'Odette', rating: 4.9, description: 'אחת ממסעדות ה-50 הטובות בעולם, 3 כוכבי מישלן.', cuisine: 'צרפתית-אסייתית', priceRange: 'SGD SGD SGD SGD', area: 'National Gallery', website: 'https://www.odetterestaurant.com' }
          ],
          markets: [{ name: 'Newton Food Centre', image: 'https://images.unsplash.com/photo-1557499305-0af888c3d8ec?w=300', description: 'הוקר סנטר פופולרי עם מגוון מנות סינגפוריות.', hours: 'יומי 12:00-2:00' }]
        },
        transportation: {
          overview: 'MRT - אחת ממערכות הרכבות הנקיות והמדויקות בעולם. גם אוטובוסים ומוניות.',
          options: [
            { name: 'MRT', icon: 'subway', iconColor: '#D32F2F', description: 'רכבת עירונית מהירה ומזוגנת - מכסה כל הנקודות.', cost: 'SGD 1.0-2.5', hours: '5:30-24:00', website: 'https://www.smrt.com.sg' },
            { name: 'Grab', icon: 'local_taxi', iconColor: '#1B5E20', description: 'אובר מקומי - זול, בטוח, עם מיזוג.', cost: 'החל מ-SGD 5', hours: '24/7', website: 'https://www.grab.com' }
          ],
          tips: [{ title: 'EZ-Link Card', description: 'כרטיס נסיעה נטען לMRT + אוטובוסים - נוח מאוד.' }]
        },
        tips: {
          beforeTravel: [
            { icon: 'gavel', title: 'חוקים נוקשים', description: 'אין ללעוס מסטיק ברחוב, להשליך זבל - קנסות כבדים.' },
            { icon: 'restaurant', title: 'אוכל Halal', description: 'הרבה אפשרויות Halal - בדוק שלטים לרווחת כלל המטיילים.' }
          ],
          hours: { shopping: 'קניונים 10:00-22:00', restaurants: 'הוקר סנטרס 24/7, מסעדות עד 23:00', attractions: 'Gardens by the Bay עד 21:00' },
          local: [
            { title: 'Singlish', description: 'הסינגפורים מדברים Singlish - אנגלית עם סיומות "lah" ו-"lor".' },
            { title: 'רב-תרבותי', description: 'Chinatown, Little India, Arab Street - כל תרבות בשכונה שלה.' }
          ]
        },
        nearbyDestinations: [
          { name: 'באלי', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=300', distance: '1500' },
          { name: 'קואלה לומפור', image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=300', distance: '350' }
        ]
      }
    };

    if (!destinationsData[dest]) {
      return null;
    }

    const d = destinationsData[dest];
    return {
      name: dest,
      country: d.country,
      coverImage: d.coverImage,
      tags: d.tags,
      description: d.description,
      generalInfo: {
        language: d.language,
        currency: d.currency,
        timezone: d.timezone,
        airport: d.airport,
        bestTimeToVisit: d.bestTimeToVisit,
        seasons: d.seasons
      },
      currentWeather: { temperature: 22, feelsLike: 24, description: 'בהיר', icon: 'https://openweathermap.org/img/wn/01d@2x.png', humidity: 75, windSpeed: 3.5 },
      events: d.events,
      attractions: d.attractions,
      food: d.food,
      transportation: d.transportation,
      tips: d.tips,
      nearbyDestinations: d.nearbyDestinations
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
    const isAISearch = !['פריז','רומא','טוקיו','ניו יורק','בנגקוק','ברצלונה','לונדון','אמסטרדם','דובאי','פראג','סינגפור'].includes(destination);
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {isAISearch && (
          <Box sx={{
            textAlign: 'center', py: 4, mb: 3,
            background: 'linear-gradient(135deg, #667eea22 0%, #764ba222 100%)',
            borderRadius: 3, border: '1px solid #667eea33'
          }}>
            <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>🤖</Typography>
            <Typography variant="h6" fontWeight="bold" color="primary">
              מחפש מידע על "{destination}"...
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              ה-AI מייצר מידע מפורט - לוקח כמה שניות
            </Typography>
          </Box>
        )}
        <Box sx={{ mb: 6 }}>
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: '0 0 24px 24px' }} />
          <Box sx={{ mt: -4, mx: { xs: 2, md: 'auto' }, maxWidth: '1100px' }}>
            <Skeleton variant="rectangular" height={100} sx={{ borderRadius: '16px' }} />
          </Box>
        </Box>
        <Skeleton variant="text" height={60} />
        <Skeleton variant="text" height={20} width="80%" />
        <Skeleton variant="text" height={20} width="90%" />
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
  if (error && error !== 'no_api_key') {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', p: 4 }}>
        <Box>
          <Typography sx={{ fontSize: '4rem', mb: 2 }}>⚠️</Typography>
          <Typography variant="h5" fontWeight="bold" mb={1}>{error}</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>בדוק את חיבור האינטרנט ונסה שוב</Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="contained" onClick={() => fetchDestinationData(destination)}
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2 }}>
              נסה שוב
            </Button>
            <Button variant="outlined" onClick={() => navigate('/destination-info')} sx={{ borderRadius: 2 }}>
              חזור לבחירת יעד
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }
  
  // אם יעד נבחר אך לא נמצא / שגיאה
  if (destination && !destinationData && !isLoading) {
    const isNoKey = error === 'no_api_key';
    return (
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8f9ff 0%, #fff5f8 100%)', pt: '80px', pb: 8, textAlign: 'center' }}>
        <Container maxWidth="sm">
          <Typography sx={{ fontSize: '5rem', mb: 2 }}>{isNoKey ? '🔑' : '🔍'}</Typography>
          <Typography variant="h4" fontWeight="bold" mb={2}>
            {isNoKey ? 'נדרש מפתח AI' : `לא נמצא מידע עבור "${destination}"`}
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={4}>
            {isNoKey
              ? 'כדי לחפש כל יעד בעולם, הוסף מפתח OpenAI ל-.env: REACT_APP_OPENAI_API_KEY'
              : 'לא הצלחנו לטעון מידע על יעד זה. נסה שוב או בחר מהיעדים הפופולריים.'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={() => navigate('/destination-info')}
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, px: 4 }}
            >
              חזור לבחירת יעד
            </Button>
            <Button variant="outlined" onClick={() => navigate(-1)} sx={{ borderRadius: 2, px: 4 }}>
              חזור אחורה
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  // אם אין יעד נבחר - הצג בורר יעדים
  if (!destination || !destinationData) {
    const popularDestinations = [
      { name: 'פריז', emoji: '🗼', color: '#667eea' },
      { name: 'רומא', emoji: '🏛️', color: '#f5576c' },
      { name: 'טוקיו', emoji: '🗾', color: '#e91e8c' },
      { name: 'ניו יורק', emoji: '🗽', color: '#ff6b35' },
      { name: 'בנגקוק', emoji: '🛕', color: '#f5a623' },
      { name: 'ברצלונה', emoji: '🏖️', color: '#4facfe' },
      { name: 'לונדון', emoji: '🎡', color: '#43e97b' },
      { name: 'אמסטרדם', emoji: '🚲', color: '#f093fb' },
      { name: 'דובאי', emoji: '🏙️', color: '#fa709a' },
      { name: 'פראג', emoji: '🏰', color: '#764ba2' },
      { name: 'סינגפור', emoji: '🌴', color: '#00b09b' },
    ];
    return (
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8f9ff 0%, #fff5f8 100%)', pt: '80px', pb: 8 }}>
        <Container maxWidth="md">
          <Box textAlign="center" mb={6}>
            <Typography variant="h3" fontWeight="bold" mb={2}>
              🌍 לאן תרצה לטייל?
            </Typography>
            <Typography variant="h6" color="text.secondary" mb={4}>
              בחר יעד לקבלת מידע מפורט - מזג אוויר, אטרקציות, טיפים ועוד
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, maxWidth: 480, mx: 'auto' }}>
              <TextField
                fullWidth
                placeholder="חפש כל יעד בעולם..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  )
                }}
                sx={{ bgcolor: 'white', borderRadius: 2 }}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                sx={{
                  px: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  whiteSpace: 'nowrap',
                  borderRadius: 2
                }}
              >
                חפש
              </Button>
            </Box>
          </Box>
          <Grid container spacing={3} justifyContent="center">
            {popularDestinations.map((dest) => (
              <Grid item xs={6} sm={4} key={dest.name}>
                <Paper
                  elevation={3}
                  onClick={() => navigate(`/destination-info/${dest.name}`)}
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    borderRadius: 4,
                    cursor: 'pointer',
                    background: `linear-gradient(135deg, ${dest.color}22 0%, ${dest.color}44 100%)`,
                    border: `2px solid ${dest.color}55`,
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: `0 12px 30px ${dest.color}55`,
                      background: `linear-gradient(135deg, ${dest.color}33 0%, ${dest.color}66 100%)`,
                    }
                  }}
                >
                  <Typography sx={{ fontSize: '3rem', mb: 1 }}>{dest.emoji}</Typography>
                  <Typography variant="h6" fontWeight="bold">{dest.name}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
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
            <Tab
              label="לו״ז מומלץ"
              icon={<ItineraryIcon />}
              iconPosition="start"
              sx={{ direction: 'rtl' }}
            />
            <Tab
              label="תקציב"
              icon={<BudgetIcon />}
              iconPosition="start"
              sx={{ direction: 'rtl' }}
            />
            <Tab
              label="מידע מעשי"
              icon={<PracticalIcon />}
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
                    onClick={() => window.open(`https://www.google.com/search?q=אטרקציות+תיירות+${encodeURIComponent(destinationData.name)}`, '_blank')}
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

            {/* טאב 5 - לו"ז מומלץ */}
            {activeTab === 5 && (
              <Box sx={{ p: 3 }}>
                {!destinationData.itinerary ? (
                  <Box textAlign="center" py={6}>
                    <Typography sx={{ fontSize: '3rem', mb: 2 }}>🤖</Typography>
                    <Typography variant="h6" color="text.secondary">מידע זה זמין עבור יעדים שנטענו דרך חיפוש AI</Typography>
                  </Box>
                ) : (
                  <>
                    <Typography variant="h5" fontWeight="bold" mb={3}>📅 לוח זמנים מומלץ</Typography>
                    {['3days', '5days'].map((plan) => {
                      const days = destinationData.itinerary[plan];
                      if (!days) return null;
                      return (
                        <Box key={plan} mb={5}>
                          <Typography variant="h6" fontWeight="bold" mb={2}
                            sx={{ color: plan === '3days' ? '#667eea' : '#f5576c' }}>
                            {plan === '3days' ? '🗓️ תכנית 3 ימים' : '🗓️ תכנית 5 ימים'}
                          </Typography>
                          {days.map((day) => (
                            <Paper key={day.day} elevation={2} sx={{ mb: 2, borderRadius: 3, overflow: 'hidden' }}>
                              <Box sx={{ background: plan === '3days'
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                : 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                                color: 'white', px: 3, py: 1.5 }}>
                                <Typography fontWeight="bold">יום {day.day} — {day.title}</Typography>
                              </Box>
                              <Box sx={{ p: 3 }}>
                                <Grid container spacing={2}>
                                  {[
                                    { icon: '🌅', label: 'בוקר', value: day.morning },
                                    { icon: '☀️', label: 'צהריים', value: day.afternoon },
                                    { icon: '🌙', label: 'ערב', value: day.evening },
                                  ].map(({ icon, label, value }) => (
                                    <Grid item xs={12} sm={4} key={label}>
                                      <Box sx={{ p: 1.5, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
                                        <Typography variant="subtitle2" fontWeight="bold" mb={0.5}>
                                          {icon} {label}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">{value}</Typography>
                                      </Box>
                                    </Grid>
                                  ))}
                                </Grid>
                                {day.food && (
                                  <Box sx={{ mt: 2, p: 1.5, bgcolor: '#fff8e1', borderRadius: 2 }}>
                                    <Typography variant="body2"><strong>🍽️ אוכל:</strong> {day.food}</Typography>
                                  </Box>
                                )}
                                {day.tip && (
                                  <Box sx={{ mt: 1, p: 1.5, bgcolor: '#e8f5e9', borderRadius: 2 }}>
                                    <Typography variant="body2"><strong>💡 טיפ:</strong> {day.tip}</Typography>
                                  </Box>
                                )}
                              </Box>
                            </Paper>
                          ))}
                        </Box>
                      );
                    })}
                  </>
                )}
              </Box>
            )}

            {/* טאב 6 - תקציב */}
            {activeTab === 6 && (
              <Box sx={{ p: 3 }}>
                {!destinationData.budget ? (
                  <Box textAlign="center" py={6}>
                    <Typography sx={{ fontSize: '3rem', mb: 2 }}>🤖</Typography>
                    <Typography variant="h6" color="text.secondary">מידע זה זמין עבור יעדים שנטענו דרך חיפוש AI</Typography>
                  </Box>
                ) : (
                  <>
                    <Typography variant="h5" fontWeight="bold" mb={1}>💰 תקציב יומי משוער</Typography>
                    {destinationData.budget.note && (
                      <Typography variant="body2" color="text.secondary" mb={3}>{destinationData.budget.note}</Typography>
                    )}
                    <Grid container spacing={3} mb={4}>
                      {[
                        { key: 'budget', label: 'תקציבאי 🎒', color: '#43e97b', bg: '#e8f5e9' },
                        { key: 'mid', label: 'ממוצע 🏨', color: '#4facfe', bg: '#e3f2fd' },
                        { key: 'luxury', label: 'יוקרה ✨', color: '#f5576c', bg: '#fce4ec' },
                      ].map(({ key, label, color, bg }) => {
                        const tier = destinationData.budget[key];
                        if (!tier) return null;
                        const cur = destinationData.budget.currency || '$';
                        return (
                          <Grid item xs={12} sm={4} key={key}>
                            <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden', height: '100%' }}>
                              <Box sx={{ bgcolor: color, color: 'white', p: 2, textAlign: 'center' }}>
                                <Typography variant="h6" fontWeight="bold">{label}</Typography>
                                <Typography variant="h4" fontWeight="bold">{cur}{tier.total}</Typography>
                                <Typography variant="caption">לאדם ליום</Typography>
                              </Box>
                              <Box sx={{ p: 2, bgcolor: bg }}>
                                {[
                                  { label: '🏠 לינה', val: tier.accommodation },
                                  { label: '🍽️ אוכל', val: tier.food },
                                  { label: '🚌 תחבורה', val: tier.transport },
                                  { label: '🎭 פעילויות', val: tier.activities },
                                ].map(({ label: l, val }) => (
                                  <Box key={l} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="body2">{l}</Typography>
                                    <Typography variant="body2" fontWeight="bold">{cur}{val}</Typography>
                                  </Box>
                                ))}
                                {tier.notes && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                    {tier.notes}
                                  </Typography>
                                )}
                              </Box>
                            </Paper>
                          </Grid>
                        );
                      })}
                    </Grid>
                    {destinationData.budget.tips?.length > 0 && (
                      <Box>
                        <Typography variant="h6" fontWeight="bold" mb={2}>💡 טיפים לחיסכון</Typography>
                        {destinationData.budget.tips.map((tip, i) => (
                          <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1.5, p: 2, bgcolor: '#fff8e1', borderRadius: 2 }}>
                            <CheckIcon sx={{ color: '#f9a825', fontSize: 20, mt: 0.2 }} />
                            <Typography variant="body2">{tip}</Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </>
                )}
              </Box>
            )}

            {/* טאב 7 - מידע מעשי */}
            {activeTab === 7 && (
              <Box sx={{ p: 3 }}>
                {!destinationData.practical ? (
                  <Box textAlign="center" py={6}>
                    <Typography sx={{ fontSize: '3rem', mb: 2 }}>🤖</Typography>
                    <Typography variant="h6" color="text.secondary">מידע זה זמין עבור יעדים שנטענו דרך חיפוש AI</Typography>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {/* ויזה + בטיחות */}
                    <Grid item xs={12} md={6}>
                      <Paper elevation={2} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                        <Typography variant="h6" fontWeight="bold" mb={2}>✈️ ויזה לישראלים</Typography>
                        <Typography variant="body2" color="text.secondary">{destinationData.practical.visa}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      {destinationData.practical.safety && (
                        <Paper elevation={2} sx={{ p: 3, borderRadius: 3, height: '100%',
                          border: `2px solid ${destinationData.practical.safety.color === 'green' ? '#43e97b' : destinationData.practical.safety.color === 'yellow' ? '#fdd835' : '#f5576c'}` }}>
                          <Typography variant="h6" fontWeight="bold" mb={1}>
                            🛡️ בטיחות — {destinationData.practical.safety.level}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" mb={2}>{destinationData.practical.safety.overview}</Typography>
                          {destinationData.practical.safety.tips?.map((t, i) => (
                            <Box key={i} sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                              <CheckIcon sx={{ fontSize: 18, color: '#43e97b' }} />
                              <Typography variant="body2">{t}</Typography>
                            </Box>
                          ))}
                          {destinationData.practical.safety.avoidAreas?.length > 0 && destinationData.practical.safety.avoidAreas[0] && (
                            <Box sx={{ mt: 1 }}>
                              {destinationData.practical.safety.avoidAreas.map((a, i) => (
                                <Box key={i} sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                                  <WarningIcon sx={{ fontSize: 18, color: '#f5576c' }} />
                                  <Typography variant="body2">{a}</Typography>
                                </Box>
                              ))}
                            </Box>
                          )}
                        </Paper>
                      )}
                    </Grid>

                    {/* מידע מעשי - חשמל, SIM, מטבע, בריאות */}
                    <Grid item xs={12}>
                      <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" fontWeight="bold" mb={2}>🔧 פרטים מעשיים</Typography>
                        <Grid container spacing={2}>
                          {[
                            { icon: '🔌', label: 'שקע חשמל', val: `${destinationData.practical.plugType} | ${destinationData.practical.voltage}` },
                            { icon: '📱', label: 'כרטיס SIM', val: destinationData.practical.simCard },
                            { icon: '💱', label: 'המרת מטבע', val: destinationData.practical.currencyTips },
                            { icon: '🏥', label: 'בריאות', val: destinationData.practical.health },
                          ].map(({ icon, label, val }) => val && (
                            <Grid item xs={12} sm={6} key={label}>
                              <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
                                <Typography variant="subtitle2" fontWeight="bold" mb={0.5}>{icon} {label}</Typography>
                                <Typography variant="body2" color="text.secondary">{val}</Typography>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                        {destinationData.practical.emergencyNumbers && (
                          <Box sx={{ mt: 2, p: 2, bgcolor: '#fce4ec', borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight="bold" mb={1}>🆘 מספרי חירום</Typography>
                            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                              {Object.entries(destinationData.practical.emergencyNumbers).map(([k, v]) => (
                                <Typography key={k} variant="body2">
                                  <strong>{k === 'police' ? '👮 משטרה' : k === 'ambulance' ? '🚑 אמבולנס' : '📞 תיירים'}:</strong> {v}
                                </Typography>
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Paper>
                    </Grid>

                    {/* שכונות */}
                    {destinationData.practical.neighborhoods?.length > 0 && (
                      <Grid item xs={12}>
                        <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
                          <Typography variant="h6" fontWeight="bold" mb={2}>🏘️ שכונות מומלצות ללינה</Typography>
                          <Grid container spacing={2}>
                            {destinationData.practical.neighborhoods.map((n, i) => (
                              <Grid item xs={12} sm={6} md={4} key={i}>
                                <Box sx={{ p: 2, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 2 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography fontWeight="bold">{n.name}</Typography>
                                    <Chip label={n.priceRange} size="small" />
                                  </Box>
                                  <Typography variant="body2" color="text.secondary" mb={1}>{n.description}</Typography>
                                  {n.bestFor && <Chip label={n.bestFor} size="small" color="primary" variant="outlined" />}
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        </Paper>
                      </Grid>
                    )}

                    {/* קניות + חיי לילה */}
                    {destinationData.practical.shopping && (
                      <Grid item xs={12} md={6}>
                        <Paper elevation={2} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                          <Typography variant="h6" fontWeight="bold" mb={2}>🛍️ קניות</Typography>
                          <Typography variant="body2" color="text.secondary" mb={2}>{destinationData.practical.shopping.intro}</Typography>
                          {destinationData.practical.shopping.items?.length > 0 && (
                            <Box mb={2}>
                              <Typography variant="subtitle2" fontWeight="bold" mb={1}>מה לקנות:</Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {destinationData.practical.shopping.items.map((item, i) => (
                                  <Chip key={i} label={item} size="small" sx={{ bgcolor: '#e3f2fd' }} />
                                ))}
                              </Box>
                            </Box>
                          )}
                          {destinationData.practical.shopping.areas?.map((a, i) => (
                            <Box key={i} sx={{ p: 1.5, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2, mb: 1 }}>
                              <Typography variant="subtitle2" fontWeight="bold">{a.name}</Typography>
                              <Typography variant="body2" color="text.secondary">{a.description}</Typography>
                            </Box>
                          ))}
                        </Paper>
                      </Grid>
                    )}
                    {destinationData.practical.nightlife && (
                      <Grid item xs={12} md={6}>
                        <Paper elevation={2} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                          <Typography variant="h6" fontWeight="bold" mb={2}>🌙 חיי לילה</Typography>
                          <Typography variant="body2" color="text.secondary" mb={2}>{destinationData.practical.nightlife.intro}</Typography>
                          {destinationData.practical.nightlife.areas?.map((a, i) => (
                            <Box key={i} sx={{ p: 1.5, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2, mb: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="subtitle2" fontWeight="bold">{a.name}</Typography>
                                {a.type && <Chip label={a.type} size="small" />}
                              </Box>
                              <Typography variant="body2" color="text.secondary">{a.description}</Typography>
                            </Box>
                          ))}
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
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
                onClick={() => window.open(`https://www.google.com/search?q=יעדים+קרובים+ל${encodeURIComponent(destinationData.name)}`, '_blank')}
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