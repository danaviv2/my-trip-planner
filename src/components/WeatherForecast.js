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
import { fetchWeatherForecast } from '../services/weatherAPI';

const WeatherForecast = ({ destination }) => {
  const { t } = useTranslation();
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (destination) {
      setLoading(true);
      setError(null);
      
      fetchWeatherForecast(destination)
        .then(data => {
          setWeatherData(data);
          setLoading(false);
        })
        .catch(err => {
          setError(t('weather.loadError'));
          setLoading(false);
          console.error(err);
        });
    }
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
                {weatherData.temp}°C
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('weather.feelsLike', { temp: weatherData.feels_like })}
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
                {weatherData.description}
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
