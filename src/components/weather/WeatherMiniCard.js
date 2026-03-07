import React, { useState, useEffect } from 'react';
import { Chip, CircularProgress } from '@mui/material';
import { getStopWeatherSummary, fetchTripWeather } from '../../services/openMeteoService';

export default function WeatherMiniCard({ cityName, lat, lng, startDate, days = 3, sx = {} }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      let result = null;
      if (lat && lng && startDate) {
        result = await getStopWeatherSummary(lat, lng, startDate, days);
      }
      if (!result && cityName) {
        const data = await fetchTripWeather(cityName, startDate, days);
        if (data.length) {
          const avgMax = Math.round(data.reduce((s, d) => s + d.maxTemp, 0) / data.length);
          const avgMin = Math.round(data.reduce((s, d) => s + d.minTemp, 0) / data.length);
          result = { avgMin, avgMax, emoji: data[0].emoji };
        }
      }
      if (!cancelled) { setWeather(result); setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [cityName, lat, lng, startDate, days]); // eslint-disable-line

  if (loading) return <CircularProgress size={12} sx={{ mx: 0.5 }} />;
  if (!weather) return null;

  return (
    <Chip
      label={`${weather.emoji} ${weather.avgMin}°–${weather.avgMax}°`}
      size="small"
      sx={{ fontSize: '0.7rem', bgcolor: '#e3f2fd', color: '#1565c0', ...sx }}
    />
  );
}
