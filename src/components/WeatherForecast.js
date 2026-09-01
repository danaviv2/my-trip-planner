import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import { getCurrentWeather } from '../services/openMeteoService';

const WeatherForecast = ({ destination }) => {
  const { t } = useTranslation();
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // עד 01.09.2026 המקור כאן היה `weatherAPI.js` — סימולציה מוצהרת
  // שהחזירה 22° ו"שמיים בהירים" לכל יעד, אחרי `setTimeout(500)` שגרם
  // לזה להיראות כמו קריאת רשת. עכשיו Open-Meteo, בלי מפתח.
  useEffect(() => {
    if (!destination) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    getCurrentWeather(destination).then((data) => {
      if (cancelled) return;
      setLoading(false);
      // `null` הוא "לא הצלחנו לבדוק", ולא "אין מזג אוויר". אין נפילה
      // חזרה למספר קבוע: ערך שהומצא זוכה לאמון, ושדה ריק מתוקן.
      if (!data) { setError(t('weather.unavailable')); return; }
      setWeatherData(data);
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }

  if (!weatherData) {
    return null;
  }

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <WbSunnyIcon sx={{ mr: 1 }} />
        {t('weather.title', { location: destination })}
      </Typography>
      
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {t('weather.temperature')}
              </Typography>
              <Typography variant="h4">
                {weatherData.temperature}°C
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('weather.feelsLike', { temp: weatherData.feelsLike })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {t('weather.description')}
              </Typography>
              <Typography variant="h6">
                {weatherData.emoji} {t(`weather.conditions.${weatherData.conditionKey}`)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {t('weather.humidity')}
              </Typography>
              <Typography variant="h4">
                {weatherData.humidity}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {t('weather.windSpeed')}
              </Typography>
              <Typography variant="h4">
                {weatherData.windSpeed} m/s
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default WeatherForecast;
