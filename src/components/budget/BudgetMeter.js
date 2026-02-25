import React, { useMemo } from 'react';
import {
  Box, Typography, LinearProgress, Paper, Button, Divider, Chip
} from '@mui/material';
import FlightIcon from '@mui/icons-material/Flight';
import HotelIcon from '@mui/icons-material/Hotel';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

// עלויות יומיות משוערות לפי קטגוריית יעד ($)
const CITY_COSTS = {
  // יקרות
  'לונדון': { tier: 'expensive', flights: 650, hotel: 200, food: 80, activities: 60 },
  'פריז': { tier: 'expensive', flights: 550, hotel: 180, food: 70, activities: 55 },
  'ניו יורק': { tier: 'expensive', flights: 700, hotel: 220, food: 85, activities: 70 },
  'זיריך': { tier: 'expensive', flights: 600, hotel: 250, food: 90, activities: 60 },
  'סינגפור': { tier: 'expensive', flights: 800, hotel: 190, food: 50, activities: 55 },
  'דובאי': { tier: 'expensive', flights: 450, hotel: 200, food: 60, activities: 80 },
  'טוקיו': { tier: 'expensive', flights: 850, hotel: 160, food: 50, activities: 60 },
  'סנטוריני': { tier: 'expensive', flights: 400, hotel: 230, food: 75, activities: 50 },
  'מלדיביים': { tier: 'expensive', flights: 900, hotel: 350, food: 100, activities: 80 },
  // בינוניות
  'ברצלונה': { tier: 'medium', flights: 350, hotel: 100, food: 45, activities: 40 },
  'רומא': { tier: 'medium', flights: 380, hotel: 120, food: 50, activities: 45 },
  'אמסטרדם': { tier: 'medium', flights: 420, hotel: 140, food: 55, activities: 45 },
  'פראג': { tier: 'medium', flights: 380, hotel: 90, food: 35, activities: 35 },
  'בודפשט': { tier: 'medium', flights: 350, hotel: 80, food: 30, activities: 30 },
  'אתונה': { tier: 'medium', flights: 300, hotel: 90, food: 40, activities: 35 },
  'ליסבון': { tier: 'medium', flights: 320, hotel: 95, food: 38, activities: 35 },
  'ורשה': { tier: 'medium', flights: 340, hotel: 70, food: 28, activities: 30 },
  'קרקוב': { tier: 'medium', flights: 320, hotel: 65, food: 25, activities: 28 },
  'בוקרשט': { tier: 'medium', flights: 300, hotel: 60, food: 25, activities: 25 },
  // זולות
  'בנגקוק': { tier: 'cheap', flights: 650, hotel: 40, food: 15, activities: 20 },
  'בלי': { tier: 'cheap', flights: 750, hotel: 50, food: 18, activities: 25 },
  'קייפטאון': { tier: 'cheap', flights: 700, hotel: 60, food: 22, activities: 30 },
  'מרקש': { tier: 'cheap', flights: 400, hotel: 45, food: 15, activities: 20 },
  'הנוי': { tier: 'cheap', flights: 700, hotel: 30, food: 12, activities: 18 },
  'קטמנדו': { tier: 'cheap', flights: 750, hotel: 25, food: 10, activities: 15 },
  'קולומבו': { tier: 'cheap', flights: 680, hotel: 40, food: 14, activities: 20 },
};

// עלויות ברירת מחדל לפי tier
const TIER_DEFAULTS = {
  expensive: { flights: 600, hotel: 200, food: 70, activities: 60 },
  medium: { flights: 400, hotel: 110, food: 45, activities: 38 },
  cheap: { flights: 650, hotel: 45, food: 15, activities: 22 },
};

// מקדמי תקציב
const BUDGET_MULTIPLIERS = {
  low: { hotel: 0.6, food: 0.7, activities: 0.6 },
  medium: { hotel: 1.0, food: 1.0, activities: 1.0 },
  high: { hotel: 1.6, food: 1.4, activities: 1.5 },
};

const COLORS = {
  flights: '#2196F3',
  hotel: '#4CAF50',
  food: '#FF9800',
  activities: '#9C27B0',
};

function CostBar({ icon, label, value, max, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <Box mb={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
        <Box display="flex" alignItems="center" gap={0.5}>
          {icon}
          <Typography variant="body2" fontWeight={600}>{label}</Typography>
        </Box>
        <Typography variant="body2" fontWeight={700} color={color}>
          ${value.toLocaleString()}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 10,
          borderRadius: 5,
          bgcolor: `${color}22`,
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 5 }
        }}
      />
    </Box>
  );
}

export default function BudgetMeter({ destination, days = 7, budget = 'medium' }) {
  const costs = useMemo(() => {
    if (!destination) return null;

    // חיפוש שם יעד (חלקי)
    const key = Object.keys(CITY_COSTS).find(k =>
      destination.includes(k) || k.includes(destination.split(',')[0]?.trim())
    );

    const base = key ? CITY_COSTS[key] : TIER_DEFAULTS.medium;
    const mult = BUDGET_MULTIPLIERS[budget] || BUDGET_MULTIPLIERS.medium;
    const d = days || 7;

    const hotel = Math.round(base.hotel * mult.hotel * d);
    const food = Math.round(base.food * mult.food * d);
    const activities = Math.round(base.activities * mult.activities * d);
    const flights = base.flights;

    return {
      flights,
      hotel,
      food,
      activities,
      total: flights + hotel + food + activities
    };
  }, [destination, days, budget]);

  if (!destination || !costs) {
    return (
      <Paper elevation={2} sx={{ p: 3, borderRadius: 3, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body1">💰 הזן יעד כדי לראות הערכת תקציב</Typography>
      </Paper>
    );
  }

  const max = costs.total;
  const flightsUrl = `https://www.google.com/travel/flights?q=flights+to+${encodeURIComponent(destination)}`;

  const budgetLabel = { low: 'תקציבי 💚', medium: 'בינוני 🟡', high: 'פרמיום 💎' }[budget];

  return (
    <Paper elevation={3} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, mb: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold">
          💰 מד תקציב חי
        </Typography>
        <Chip label={budgetLabel} size="small" sx={{ fontWeight: 600 }} />
      </Box>

      <Typography variant="body2" color="text.secondary" mb={2.5}>
        הערכת עלויות עבור {days} ימים ב-{destination}
      </Typography>

      <CostBar
        icon={<FlightIcon sx={{ fontSize: 18, color: COLORS.flights }} />}
        label="טיסות הלוך-חזור"
        value={costs.flights}
        max={max}
        color={COLORS.flights}
      />
      <CostBar
        icon={<HotelIcon sx={{ fontSize: 18, color: COLORS.hotel }} />}
        label={`לינה (${days} לילות)`}
        value={costs.hotel}
        max={max}
        color={COLORS.hotel}
      />
      <CostBar
        icon={<RestaurantIcon sx={{ fontSize: 18, color: COLORS.food }} />}
        label={`אוכל (${days} ימים)`}
        value={costs.food}
        max={max}
        color={COLORS.food}
      />
      <CostBar
        icon={<LocalActivityIcon sx={{ fontSize: 18, color: COLORS.activities }} />}
        label="פעילויות ואטרקציות"
        value={costs.activities}
        max={max}
        color={COLORS.activities}
      />

      <Divider sx={{ my: 2 }} />

      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body1" fontWeight={700}>סה"כ משוער</Typography>
        <Typography variant="h5" fontWeight={800} color="#667eea">
          ${costs.total.toLocaleString()}
        </Typography>
      </Box>

      <Typography variant="caption" color="text.secondary" display="block" mt={0.5} mb={2}>
        * הערכה בלבד בדולרים אמריקאים
      </Typography>

      <Button
        variant="outlined"
        fullWidth
        endIcon={<OpenInNewIcon />}
        href={flightsUrl}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ borderRadius: 2, fontWeight: 600 }}
      >
        פתח ב-Google Flights
      </Button>
    </Paper>
  );
}
