// WeatherForecast.js - קוד מתוקן להפחתת בקשות חוזרות ושיפור ביצועים
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { 
  Box, Typography, Paper, Grid, CircularProgress, 
  Tooltip, useTheme, Alert
} from '@mui/material';
import { 
  WiDaySunny, WiCloudy, WiRain, WiSnow, 
  WiThunderstorm, WiFog, WiDayCloudy, WiNightClear, 
  WiNightCloudy, WiNightRain, WiWindy 
} from 'react-icons/wi';
import { debounce } from 'lodash';

// מפת מיפוי יעדים - לנוחות ולשימוש מקומי כאשר ה-API נכשל
const LOCATION_MAPPING = {
  'תל אביב': { lat: 32.0853, lon: 34.7818, country: 'IL' },
  'ירושלים': { lat: 31.7683, lon: 35.2137, country: 'IL' },
  'חיפה': { lat: 32.7940, lon: 34.9896, country: 'IL' },
  'אילת': { lat: 29.5577, lon: 34.9519, country: 'IL' },
  'פריז': { lat: 48.8566, lon: 2.3522, country: 'FR' },
  'לונדון': { lat: 51.5074, lon: -0.1278, country: 'GB' },
  'רומא': { lat: 41.9028, lon: 12.4964, country: 'IT' },
  'ברלין': { lat: 52.5200, lon: 13.4050, country: 'DE' },
  'מדריד': { lat: 40.4168, lon: -3.7038, country: 'ES' },
  'ברצלונה': { lat: 41.3851, lon: 2.1734, country: 'ES' },
  'אמסטרדם': { lat: 52.3676, lon: 4.9041, country: 'NL' },
  'בודפשט': { lat: 47.4979, lon: 19.0402, country: 'HU' },
  'וינה': { lat: 48.2082, lon: 16.3738, country: 'AT' },
  'פראג': { lat: 50.0755, lon: 14.4378, country: 'CZ' },
  'אתונה': { lat: 37.9838, lon: 23.7275, country: 'GR' },
  'איסטנבול': { lat: 41.0082, lon: 28.9784, country: 'TR' },
  'ניו יורק': { lat: 40.7128, lon: -74.0060, country: 'US' },
  'טוקיו': { lat: 35.6762, lon: 139.6503, country: 'JP' },
  'בנגקוק': { lat: 13.7563, lon: 100.5018, country: 'TH' },
  'סידני': { lat: -33.8688, lon: 151.2093, country: 'AU' },
  'ציריך': { lat: 47.3769, lon: 8.5417, country: 'CH' },
  'בורדו': { lat: 44.8378, lon: -0.5792, country: 'FR' },
  'ליון': { lat: 45.7640, lon: 4.8357, country: 'FR' },
  'מרסיי': { lat: 43.2965, lon: 5.3698, country: 'FR' },
  'ניס': { lat: 43.7102, lon: 7.2620, country: 'FR' },
};

// מיפוי נוסף עבור יעדים מורכבים
const LOCATION_ALIASES = {
  'תל אביב יפו': 'תל אביב',
  'תל-אביב': 'תל אביב',
  'ת״א': 'תל אביב',
  'ת"א': 'תל אביב',
  'יפו': 'תל אביב',
  'telaviv': 'תל אביב',
  'tel aviv': 'תל אביב',
  'new york': 'ניו יורק',
  'nyc': 'ניו יורק',
  'paris': 'פריז',
  'rome': 'רומא',
  'london': 'לונדון',
  'jerusalem': 'ירושלים',
  'athens': 'אתונה',
  'barcelona': 'ברצלונה',
  'madrid': 'מדריד',
  'berlin': 'ברלין',
  'amsterdam': 'אמסטרדם',
  'prague': 'פראג',
  'vienna': 'וינה',
  'budapest': 'בודפשט',
  'bordeaux': 'בורדו',
  'lyon': 'ליון',
  'marseille': 'מרסיי',
  'nice': 'ניס',
};

// מטמון לתוצאות מזג אוויר - יפחית בקשות חוזרות לאותו יעד
const weatherCache = new Map();

const WeatherForecast = ({ destination, showExtended = false }) => {
  const theme = useTheme();
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [effectiveDestination, setEffectiveDestination] = useState('');
  const [lastRequestTime, setLastRequestTime] = useState(0); // מונה זמן לבקשות אחרונות
  const [cacheHit, setCacheHit] = useState(false); // האם נמצא במטמון?
  
  // API Key למזג אוויר - כדאי להעביר לקובץ .env
  const API_KEY = process.env.REACT_APP_OPENWEATHERMAP_API_KEY;
  
  // פונקציה למיפוי קוד מזג אוויר לאייקון
  const getWeatherIcon = (code, isNight = false) => {
    // מיפוי על פי קודי מזג אוויר של OpenWeatherMap
    const iconSize = 36;
    
    // קבוצות עיקריות של קודי מזג אוויר
    if (code >= 200 && code < 300) {
      return <WiThunderstorm size={iconSize} />; // סופת ברקים
    } else if (code >= 300 && code < 400) {
      return isNight ? <WiNightRain size={iconSize} /> : <WiRain size={iconSize} />; // גשם קל
    } else if (code >= 500 && code < 600) {
      return isNight ? <WiNightRain size={iconSize} /> : <WiRain size={iconSize} />; // גשם
    } else if (code >= 600 && code < 700) {
      return <WiSnow size={iconSize} />; // שלג
    } else if (code >= 700 && code < 800) {
      return <WiFog size={iconSize} />; // ערפל
    } else if (code === 800) {
      return isNight ? <WiNightClear size={iconSize} /> : <WiDaySunny size={iconSize} />; // שמיים בהירים
    } else if (code === 801) {
      return isNight ? <WiNightCloudy size={iconSize} /> : <WiDayCloudy size={iconSize} />; // מעט עננים
    } else if (code > 801 && code < 805) {
      return <WiCloudy size={iconSize} />; // עננים
    } else {
      return <WiWindy size={iconSize} />; // ברירת מחדל
    }
  };
  
  // המר טמפרטורה מקלווין לצלזיוס
  const kelvinToCelsius = (kelvin) => {
    return Math.round(kelvin - 273.15);
  };
  
  // פורמט תאריך
  const formatDate = (dt) => {
    const date = new Date(dt * 1000);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('he-IL', options);
  };
  
  // מיפוי יעד ליעד שקיים במערכת (לנרמול)
  const mapDestination = useCallback((dest) => {
    if (!dest) return '';
    
    // נקה רווחים מיותרים ואחד מבנה
    const cleanDest = dest.trim().toLowerCase();
    
    // בדוק אם יש מיפוי ישיר
    for (const [alias, mappedDest] of Object.entries(LOCATION_ALIASES)) {
      if (cleanDest === alias.toLowerCase()) {
        console.log(`שימוש ביעד: ${dest} -> מופה ל: ${mappedDest}`);
        return mappedDest;
      }
    }
    
    // בדוק אם יש התאמה חלקית
    for (const [alias, mappedDest] of Object.entries(LOCATION_ALIASES)) {
      if (cleanDest.includes(alias.toLowerCase()) || alias.toLowerCase().includes(cleanDest)) {
        console.log(`שימוש ביעד: ${dest} -> מופה ל: ${mappedDest} (התאמה חלקית)`);
        return mappedDest;
      }
    }
    
    // בדוק אם יש במיפוי ישיר של מיקומים
    for (const location of Object.keys(LOCATION_MAPPING)) {
      if (cleanDest === location.toLowerCase() || location.toLowerCase().includes(cleanDest)) {
        console.log(`שימוש ביעד: ${dest} -> מופה ל: ${location}`);
        return location;
      }
    }
    
    // אם לא נמצא, השאר כמו שהוא
    console.log(`שימוש ביעד: ${dest} -> מופה ל: ${dest}`);
    return dest;
  }, []);
  
  // קבל מידע גיאוגרפי עבור יעד
  const getGeoInfo = useCallback((dest) => {
    // נסה למצוא במיפוי המדוייק
    const mappedDest = mapDestination(dest);
    
    // בדוק אם קיים מיפוי ישיר
    if (LOCATION_MAPPING[mappedDest]) {
      const geoInfo = LOCATION_MAPPING[mappedDest];
      console.log('נמצא מידע גיאוגרפי:', geoInfo);
      return geoInfo;
    }
    
    // בדוק אם יש התאמה חלקית
    for (const [loc, geoInfo] of Object.entries(LOCATION_MAPPING)) {
      if (mappedDest.includes(loc) || loc.includes(mappedDest)) {
        console.log('נמצא מידע גיאוגרפי חלקי:', geoInfo);
        return geoInfo;
      }
    }
    
    // אם לא נמצא, החזר null
    return null;
  }, [mapDestination]);
  
  // יצירת מפתח מטמון ייחודי ליעד
  const createCacheKey = useCallback((destination) => {
    const mappedDest = mapDestination(destination);
    return `weather_${mappedDest}`;
  }, [mapDestination]);
  
  // בדוק אם יש מידע במטמון ועדיין רלוונטי (פחות מ-30 דקות)
  const getFromCache = useCallback((destination) => {
    const cacheKey = createCacheKey(destination);
    
    if (weatherCache.has(cacheKey)) {
      const cachedData = weatherCache.get(cacheKey);
      const cacheAge = Date.now() - cachedData.timestamp;
      
      // אם המטמון צעיר מ-30 דקות, השתמש בו
      if (cacheAge < 30 * 60 * 1000) {
        console.log(`משתמש במידע מהמטמון עבור ${destination} (גיל: ${Math.round(cacheAge/1000/60)} דקות)`);
        return cachedData.data;
      } else {
        console.log(`מידע במטמון ישן מדי עבור ${destination}, מבקש חדש`);
      }
    }
    
    return null;
  }, [createCacheKey]);
  
  // שמירה במטמון
  const saveToCache = useCallback((destination, data) => {
    const cacheKey = createCacheKey(destination);
    weatherCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    console.log(`שמירת מידע במטמון עבור ${destination}`);
  }, [createCacheKey]);
  
  // פונקציה לאיחזור של מזג אוויר אמיתי מ-API
  const fetchRealWeather = useCallback(async (dest) => {
    if (!dest) return;
    
    console.log('יעד שנשלח ל-fetchRealWeather:', dest);
    
    // בדוק אם API Key קיים
    if (!API_KEY) {
      console.error('API_KEY חסר');
      setError('לא ניתן לקבל נתוני מזג אוויר - מפתח API חסר');
      return;
    }
    
    console.log('API_KEY קיים:', !!API_KEY);
    
    try {
      // בדוק במטמון קודם
      const cachedData = getFromCache(dest);
      if (cachedData) {
        setWeather(cachedData.current);
        setForecast(cachedData.forecast);
        setCacheHit(true);
        return;
      }
      
      setCacheHit(false);
      const mappedDest = mapDestination(dest);
      
      // קבל מידע גיאוגרפי
      const geoInfo = getGeoInfo(mappedDest);
      
      if (!geoInfo) {
        throw new Error(`לא נמצא מידע גיאוגרפי עבור: ${mappedDest}`);
      }
      
      // הגבל קצב הבקשות (לא יותר מבקשה אחת כל 10 שניות לאותו יעד)
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      
      if (timeSinceLastRequest < 10000) {
        console.log(`ממתין ${10 - Math.round(timeSinceLastRequest/1000)} שניות לפני בקשה חדשה...`);
        await new Promise(resolve => setTimeout(resolve, 10000 - timeSinceLastRequest));
      }
      
      setLastRequestTime(Date.now());
      
      // קבל מזג אוויר נוכחי
      const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${geoInfo.lat}&lon=${geoInfo.lon}&appid=${API_KEY}&lang=he`;
      
      const currentResponse = await axios.get(currentWeatherUrl);
      
      // קבל תחזית לימים הבאים
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${geoInfo.lat}&lon=${geoInfo.lon}&appid=${API_KEY}&lang=he`;
      
      const forecastResponse = await axios.get(forecastUrl);
      
      // עיבוד תחזית יומית (כרגע תחזית כל 3 שעות)
      const dailyForecast = processDailyForecast(forecastResponse.data.list);
      
      // אחסן את התוצאות במשתני המצב
      setWeather(currentResponse.data);
      setForecast(dailyForecast);
      
      // שמור במטמון
      saveToCache(dest, {
        current: currentResponse.data,
        forecast: dailyForecast
      });
      
      setError(null);
    } catch (error) {
      console.error('שגיאה בקבלת נתוני מזג אוויר:', error);
      
      // נסה להשתמש במידע מקומי אם יש
      generateMockWeather(dest);
      
      // הגדר את ההודעה רק אם אין מידע מקומי
      if (!weather) {
        setError(`לא ניתן לקבל נתוני מזג אוויר: ${error.message}`);
      }
    }
  }, [API_KEY, getFromCache, getGeoInfo, lastRequestTime, mapDestination, saveToCache, weather]);
  
  // עיבוד תחזית יומית מהתחזית לכל 3 שעות
  const processDailyForecast = (hourlyList) => {
    const dailyMap = new Map();
    
    hourlyList.forEach(item => {
      const date = new Date(item.dt * 1000);
      const day = date.toISOString().split('T')[0];
      
      // שמור רק מידע מהצהריים (12:00) או הקרוב ביותר
      if (!dailyMap.has(day)) {
        dailyMap.set(day, item);
      } else {
        const existingItem = dailyMap.get(day);
        const existingHour = new Date(existingItem.dt * 1000).getHours();
        const newHour = date.getHours();
        
        // אם השעה החדשה קרובה יותר ל-12:00, החלף
        if (Math.abs(12 - newHour) < Math.abs(12 - existingHour)) {
          dailyMap.set(day, item);
        }
      }
    });
    
    // המר את המפה למערך ומיין לפי תאריך
    return Array.from(dailyMap.values())
      .sort((a, b) => a.dt - b.dt)
      .slice(0, 5); // קח רק 5 ימים
  };
  
  // צור מידע מזג אוויר מדומה כאשר ה-API נכשל
  const generateMockWeather = useCallback((dest) => {
    console.log('יוצר מידע מזג אוויר מדומה עבור:', dest);
    
    const mappedDest = mapDestination(dest);
    const geoInfo = getGeoInfo(mappedDest);
    
    if (!geoInfo) {
      console.error('לא ניתן ליצור מידע מדומה - אין מידע גיאוגרפי');
      return;
    }
    
    // טמפרטורה ממוצעת בהתאם למיקום
    let baseTemp = 20; // ברירת מחדל
    
    // התאם טמפרטורה לפי מדינה
    if (geoInfo.country === 'IL') baseTemp = 26;
    else if (geoInfo.country === 'FR') baseTemp = 18;
    else if (geoInfo.country === 'GB') baseTemp = 15;
    else if (geoInfo.country === 'IT') baseTemp = 22;
    else if (geoInfo.country === 'ES') baseTemp = 24;
    
    // צור מזג אוויר נוכחי מדומה
    const mockCurrent = {
      main: {
        temp: baseTemp + 273.15, // המר לקלווין
        feels_like: (baseTemp + 2) + 273.15,
        humidity: 50 + Math.floor(Math.random() * 30),
        pressure: 1010 + Math.floor(Math.random() * 20)
      },
      weather: [{
        id: 800,
        main: 'Clear',
        description: 'שמיים בהירים',
        icon: '01d'
      }],
      wind: {
        speed: 2 + Math.floor(Math.random() * 4),
        deg: Math.floor(Math.random() * 360)
      },
      clouds: {
        all: Math.floor(Math.random() * 30)
      },
      dt: Math.floor(Date.now() / 1000),
      sys: {
        country: geoInfo.country,
        sunrise: Math.floor(Date.now() / 1000) - 3600 * 6,
        sunset: Math.floor(Date.now() / 1000) + 3600 * 6
      },
      name: mappedDest,
      coord: {
        lat: geoInfo.lat,
        lon: geoInfo.lon
      }
    };
    
    // צור תחזית מדומה ל-5 ימים
    const mockForecast = [];
    for (let i = 0; i < 5; i++) {
      // שנה מעט את הטמפרטורה והתנאים בכל יום
      const tempVariation = Math.floor(Math.random() * 6) - 3;
      const weatherCodes = [800, 801, 802, 500, 501, 600];
      const weatherIdx = Math.floor(Math.random() * weatherCodes.length);
      
      mockForecast.push({
        dt: Math.floor(Date.now() / 1000) + 86400 * (i + 1),
        main: {
          temp: (baseTemp + tempVariation) + 273.15,
          feels_like: (baseTemp + tempVariation + 2) + 273.15,
          humidity: 50 + Math.floor(Math.random() * 30),
          pressure: 1010 + Math.floor(Math.random() * 20)
        },
        weather: [{
          id: weatherCodes[weatherIdx],
          main: ['Clear', 'Clouds', 'Clouds', 'Rain', 'Rain', 'Snow'][weatherIdx],
          description: ['שמיים בהירים', 'מעט עננים', 'מעונן', 'גשם קל', 'גשם', 'שלג'][weatherIdx],
          icon: ['01d', '02d', '03d', '10d', '09d', '13d'][weatherIdx]
        }],
        wind: {
          speed: 2 + Math.floor(Math.random() * 4),
          deg: Math.floor(Math.random() * 360)
        },
        clouds: {
          all: Math.floor(Math.random() * 100)
        }
      });
    }
    
    setWeather(mockCurrent);
    setForecast(mockForecast);
  }, [getGeoInfo, mapDestination]);
  
  // האטת חיפוש מזג אוויר באמצעות debounce
  const debouncedFetchWeather = useMemo(() => 
    debounce((dest) => {
      if (dest) {
        setLoading(true);
        fetchRealWeather(dest).finally(() => setLoading(false));
      }
    }, 500),
  [fetchRealWeather]);
  
  // אפקט לטעינת מזג האוויר בעת שינוי היעד
  useEffect(() => {
    if (destination && destination !== effectiveDestination) {
      setEffectiveDestination(destination);
      debouncedFetchWeather(destination);
    }
    
    return () => {
      debouncedFetchWeather.cancel();
    };
  }, [destination, debouncedFetchWeather, effectiveDestination]);
  
  // תצוגת טעינה אם אין נתונים
  if (loading && !weather) {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <CircularProgress size={30} />
        <Typography variant="body2" sx={{ mt: 1 }}>טוען נתוני מזג אוויר...</Typography>
      </Box>
    );
  }
  
  // הצג הודעת שגיאה אם אין נתונים ויש שגיאה
  if (!weather && error) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }
  
  // אין מה להציג אם אין נתונים ואין שגיאה
  if (!weather) {
    return null;
  }
  
  return (
    <Paper sx={{ 
      p: 2, 
      borderRadius: '10px', 
      background: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(5px)'
    }}>
      {/* כותרת עם מקור המידע (מטמון או API) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" component="h2">
          מזג האוויר ב{weather.name}
        </Typography>
        {cacheHit && (
          <Tooltip title="נתונים מהמטמון המקומי">
            <Box 
              sx={{ 
                fontSize: '0.7rem', 
                p: 0.5, 
                borderRadius: '4px', 
                bgcolor: 'primary.main', 
                color: 'white',
                opacity: 0.7
              }}
            >
              מטמון
            </Box>
          </Tooltip>
        )}
      </Box>
      
      {/* מזג אוויר נוכחי */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ mr: 2, fontSize: '2rem' }}>
          {getWeatherIcon(weather.weather[0].id)}
        </Box>
        <Box>
          <Typography variant="h5" component="p" sx={{ fontWeight: 'bold' }}>
            {kelvinToCelsius(weather.main.temp)}°C
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            {weather.weather[0].description}
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto' }}>
          <Typography variant="body2">
            לחות: {weather.main.humidity}%
          </Typography>
          <Typography variant="body2">
            רוח: {weather.wind.speed} מ/ש
          </Typography>
        </Box>
      </Box>
      
      {/* תחזית ל-5 ימים, מוצגת רק אם showExtended=true */}
      {showExtended && forecast.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>תחזית 5 ימים</Typography>
          <Grid container spacing={1}>
            {forecast.map((day, index) => (
              <Grid item xs={12} sm={2} key={index}>
                <Box sx={{ 
                  p: 1, 
                  textAlign: 'center',
                  borderRadius: '8px',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(40, 40, 40, 0.6)' : 'rgba(245, 245, 245, 0.6)'
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {formatDate(day.dt)}
                  </Typography>
                  {getWeatherIcon(day.weather[0].id)}
                  <Typography variant="body2">
                    {kelvinToCelsius(day.main.temp)}°C
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', fontSize: '0.7rem' }}>
                    {day.weather[0].description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Paper>
  );
};

export default WeatherForecast;