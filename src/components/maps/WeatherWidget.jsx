import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  WbSunny as SunIcon,
  Cloud as CloudIcon,
  Opacity as HumidityIcon,
  Air as WindIcon,
  Visibility as VisibilityIcon,
  Thermostat as TempIcon,
  WaterDrop as RainIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import weatherService from '../../services/weatherService';

const WeatherWidget = ({ location, coordinates }) => {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const isFetchingRef = useRef(false);
  const lastLocationRef = useRef(null);

  /**
   * טעינת מזג אוויר
   */
  const loadWeather = async () => {
    if (!coordinates && (!location || location.trim().length < 2)) {
      return;
    }

    const locationKey = coordinates ? `${coordinates.lat},${coordinates.lng}` : location;
    if (isFetchingRef.current || lastLocationRef.current === locationKey) return;
    isFetchingRef.current = true;
    lastLocationRef.current = locationKey;

    setIsLoading(true);
    setError(null);

    try {
      console.log('🌤️ טוען מזג אוויר...');

      let current, forecastData;

      if (coordinates) {
        const data = await weatherService.getWeatherByCoordinates(coordinates.lat, coordinates.lng);
        current = data.current;
        forecastData = data.forecast;
      } else {
        current = await weatherService.getCurrentWeather(location);
        forecastData = await weatherService.getForecast(location);
      }

      setCurrentWeather(current);
      setForecast(forecastData);

      // קבלת המלצות
      const recs = weatherService.getWeatherRecommendations(current);
      setRecommendations(recs);

      console.log('✅ מזג אוויר נטען:', current);
    } catch (err) {
      console.error('❌ שגיאה בטעינת מזג אוויר:', err);
      setError('לא הצלחנו לטעון את מזג האוויר');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    loadWeather();
  }, [location, coordinates]);

  if (isLoading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          טוען מזג אוויר...
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!currentWeather) {
    return null;
  }

  return (
    <Box>
      {/* מזג אוויר נוכחי */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 2,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              🌤️ מזג אוויר נוכחי
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              📍 {currentWeather.location}, {currentWeather.country}
            </Typography>
          </Box>
          <IconButton 
            onClick={loadWeather} 
            sx={{ color: 'white' }}
            size="small"
          >
            <RefreshIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <img 
              src={currentWeather.iconUrl} 
              alt={currentWeather.description}
              style={{ width: 100, height: 100 }}
            />
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              {currentWeather.temperature}°C
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              מרגיש כמו {currentWeather.feelsLike}°C
            </Typography>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ mb: 1, textTransform: 'capitalize' }}>
              {currentWeather.description}
            </Typography>

            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <HumidityIcon fontSize="small" />
                  <Typography variant="body2">לחות: {currentWeather.humidity}%</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <WindIcon fontSize="small" />
                  <Typography variant="body2">רוח: {currentWeather.windSpeed} מ'/ש</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CloudIcon fontSize="small" />
                  <Typography variant="body2">עננות: {currentWeather.clouds}%</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <VisibilityIcon fontSize="small" />
                  <Typography variant="body2">ראות: {currentWeather.visibility} ק"מ</Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Paper>

      {/* ── "התאמה לטיול" הוסר ──
          ציון בין 0 ל-100 שהורכב מקנסות שנבחרו שרירותית: רוח 20-, עננות
          10-. הוא לא היה ניתן לפעולה — 85 מול 100 אינו משנה דבר במה
          שעושים — ולא היה לו בסיס מדיד, אך הוא נראה כמו מדד.

          ובעיקר: הוא סתר את מה שכתוב לידו. המסך הציג "100/100 · מעולה"
          מעל האזהרה "לחות גבוהה — ייתכן תחושת חנק". מספר שסותר את
          הטקסט שמתחתיו מלמד לא לקרוא אף אחד מהם.

          מה שנשאר — טמפרטורה, לחות, רוח, עננות ותחזית — הוא מדידה. */}


      {/* המלצות */}
      {recommendations.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            💡 המלצות
          </Typography>
          <List dense>
            {recommendations.map((rec, idx) => (
              <ListItem key={idx}>
                <ListItemIcon>
                  {rec.type === 'warning' && <WarningIcon color="warning" />}
                  {rec.type === 'info' && <InfoIcon color="info" />}
                  {rec.type === 'success' && <CheckIcon color="success" />}
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1">{rec.icon}</Typography>
                      <Typography variant="body2">{rec.text}</Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* תחזית ל-5 ימים */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 'bold' }}>
            📅 תחזית ל-{forecast.length} ימים
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={1}>
            {forecast.map((day, idx) => (
              <Grid item xs={12} key={idx}>
                <Card variant="outlined">
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <img 
                          src={day.iconUrl} 
                          alt={day.condition}
                          style={{ width: 50, height: 50 }}
                        />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {day.dayName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {day.date}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            מקס
                          </Typography>
                          <Typography variant="h6" color="error">
                            {day.maxTemp}°
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            מינ
                          </Typography>
                          <Typography variant="h6" color="primary">
                            {day.minTemp}°
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ textAlign: 'right' }}>
                        <Chip 
                          icon={<HumidityIcon />}
                          label={`${day.humidity}%`}
                          size="small"
                          variant="outlined"
                        />
                        {day.rainProbability > 20 && (
                          <Chip 
                            icon={<RainIcon />}
                            label={`${Math.round(day.rainProbability)}%`}
                            size="small"
                            color="info"
                            sx={{ ml: 0.5 }}
                          />
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* זריחה ושקיעה */}
      <Paper sx={{ p: 2, mt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center' }}>
              <SunIcon sx={{ fontSize: 40, color: 'orange' }} />
              <Typography variant="body2" color="text.secondary">
                זריחה
              </Typography>
              <Typography variant="h6">
                {currentWeather.sunrise.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center' }}>
              <CloudIcon sx={{ fontSize: 40, color: 'purple' }} />
              <Typography variant="body2" color="text.secondary">
                שקיעה
              </Typography>
              <Typography variant="h6">
                {currentWeather.sunset.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default WeatherWidget;
