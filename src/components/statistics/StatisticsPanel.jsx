import React, { useState, useEffect } from 'react';
import { useTripSave } from '../../contexts/TripSaveContext';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert
} from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  AttachMoney as MoneyIcon,
  DirectionsCar as DistanceIcon,
  CalendarToday as DaysIcon,
  TrendingDown as SaveIcon
} from '@mui/icons-material';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const StatisticsPanel = () => {
  const { savedTrips } = useTripSave();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('📊 טוען סטטיסטיקות...');
    loadStatistics();
  }, [savedTrips]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadStatistics = () => {
    setLoading(true);

    try {
      // עד כה הוצגו כאן שישה טיולים קבועים בקוד (פריז, ברצלונה, רומא...)
      // שהמשתמש מעולם לא ביצע, יחד עם "תובנות" שחושבו מהם. עכשיו נטענים
      // הטיולים השמורים האמיתיים בלבד.
      const trips = (savedTrips || [])
        .map((t) => ({
          name: t.endPoint || t.destination || t.location || 'טיול ללא שם',
          days: Number(t.days || t.duration || t.userPreferences?.days || t.dailyItinerary?.length) || 0,
          cost: Number(t.cost || t.budget || t.userPreferences?.budget) || 0,
          type: t.type || 'פנאי',
          savedAt: t.savedAt || null,
        }))
        .filter((t) => t.days > 0 || t.cost > 0);

      if (!trips.length) {
        setStats(null);
        setLoading(false);
        return;
      }

      const totalTrips = trips.length;
      const totalCost = trips.reduce((sum, t) => sum + t.cost, 0);
      const totalDays = trips.reduce((sum, t) => sum + t.days, 0);
      const avgDuration = totalDays ? Math.round(totalDays / totalTrips) : 0;
      const avgCostPerDay = totalDays ? Math.round(totalCost / totalDays) : 0;
      const avgCostPerTrip = Math.round(totalCost / totalTrips);

      // פילוח לפי חודש — מחושב מתאריכי השמירה בפועל
      const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
        'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
      const perMonth = new Array(12).fill(0);
      trips.forEach((t) => {
        if (!t.savedAt) return;
        const d = new Date(t.savedAt);
        if (!Number.isNaN(d.getTime())) perMonth[d.getMonth()] += 1;
      });
      const activeMonths = MONTHS.map((m, i) => ({ m, n: perMonth[i] })).filter((x) => x.n > 0);

      const types = [...new Set(trips.map((t) => t.type))];

      setStats({
        totalTrips,
        totalCost,
        totalDays,
        avgDuration,
        avgCostPerDay,
        avgCostPerTrip,
        trips,
        hasCosts: totalCost > 0,
        monthlyTrips: {
          labels: activeMonths.map((x) => x.m),
          data: activeMonths.map((x) => x.n),
        },
        tripsByType: {
          labels: types,
          data: types.map((ty) => trips.filter((t) => t.type === ty).length),
        },
        costTrend: {
          labels: trips.map((t) => t.name),
          data: trips.map((t) => t.cost),
        },
        costPerDayByTrip: {
          labels: trips.map((t) => t.name),
          data: trips.map((t) => (t.days ? Math.round(t.cost / t.days) : 0)),
        },
      });
    } catch (error) {
      console.error('שגיאה בטעינת סטטיסטיקות:', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>טוען סטטיסטיקות...</Typography>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          אין עדיין נתונים להצגה
        </Typography>
        <Typography variant="body2" color="text.secondary">
          הסטטיסטיקה מחושבת מהטיולים השמורים שלך. שמור טיול ראשון והוא יופיע כאן.
        </Typography>
      </Box>
    );
  }

  const costTrendChart = {
    labels: stats.costTrend.labels,
    datasets: [{
      label: 'עלות לטיול (₪)',
      data: stats.costTrend.data,
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.4,
      fill: false
    }]
  };

  const tripTypeChart = {
    labels: stats.tripsByType.labels,
    datasets: [{
      data: stats.tripsByType.data,
      backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)'
      ],
      borderWidth: 2
    }]
  };


  const costPerDayChart = {
    labels: stats.costPerDayByTrip.labels,
    datasets: [{
      label: 'עלות ליום (₪)',
      data: stats.costPerDayByTrip.data,
      backgroundColor: 'rgba(153, 102, 255, 0.6)',
      borderColor: 'rgb(153, 102, 255)',
      borderWidth: 2
    }]
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        📊 ניתוח טיולים ותובנות פיננסיות
      </Typography>

      {/* סיכום מבוסס נתונים בפועל. קודם הוצגה כאן "תובנה" על חיסכון אפשרי
          שחושבה כ-15% מסך העלות — מספר שרירותי שהוצג כניתוח. */}
      <Alert severity="info" icon={<SaveIcon />} sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {stats.hasCosts
            ? `סיכום: ${stats.totalTrips} טיולים, ${stats.totalDays} ימים, עלות ממוצעת ₪${stats.avgCostPerDay.toLocaleString()} ליום`
            : `סיכום: ${stats.totalTrips} טיולים, ${stats.totalDays} ימים. הוסף תקציב לטיולים כדי לראות ניתוח עלויות.`}
        </Typography>
      </Alert>

      {/* כרטיסי סיכום */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingIcon sx={{ fontSize: 50 }} />
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    {stats.totalTrips}
                  </Typography>
                  <Typography variant="body1">סה״כ טיולים</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.main', color: 'white', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* קודם הוצג כאן סך ק״מ, אבל טיול שמור אינו מכיל נתוני מרחק
                    ולכן המספר היה מומצא. מוצג במקומו נתון שקיים בפועל. */}
                <DaysIcon sx={{ fontSize: 50 }} />
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    {stats.totalDays.toLocaleString()}
                  </Typography>
                  <Typography variant="body1">ימי טיול</Typography>
                  <Typography variant="caption">
                    {stats.avgDuration} ימים בממוצע לטיול
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.main', color: 'white', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <MoneyIcon sx={{ fontSize: 50 }} />
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    ₪{stats.totalCost.toLocaleString()}
                  </Typography>
                  <Typography variant="body1">עלות כוללת</Typography>
                  <Typography variant="caption">
                    ₪{stats.avgCostPerDay} ליום בממוצע
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.main', color: 'white', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DaysIcon sx={{ fontSize: 50 }} />
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    {stats.avgDuration}
                  </Typography>
                  <Typography variant="body1">ימים בממוצע</Typography>
                  <Typography variant="caption">
                    ₪{stats.avgCostPerTrip.toLocaleString()} לטיול
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* טבלת טיולים */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          📋 פירוט טיולים
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>יעד</strong></TableCell>
                <TableCell><strong>ימים</strong></TableCell>
                <TableCell><strong>עלות</strong></TableCell>
                <TableCell><strong>עלות/יום</strong></TableCell>
                <TableCell><strong>סוג</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.trips.map((trip, index) => (
                <TableRow key={index}>
                  <TableCell>{trip.name}</TableCell>
                  <TableCell>{trip.days}</TableCell>
                  <TableCell>₪{trip.cost.toLocaleString()}</TableCell>
                  <TableCell>₪{Math.round(trip.cost / trip.days)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={trip.type} 
                      color={trip.type === 'עבודה' ? 'primary' : trip.type === 'פנאי' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* גרפים */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              📈 מגמת עלויות לפי טיול
            </Typography>
            <Box sx={{ height: 300 }}>
              <Line 
                data={costTrendChart} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false
                }} 
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              💰 עלות ליום לפי יעד
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar 
                data={costPerDayChart} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false
                }} 
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              🎯 חלוקת טיולים לפי סוג
            </Typography>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              <Doughnut 
                data={tripTypeChart} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }} 
              />
            </Box>
          </Paper>
        </Grid>

      </Grid>

      {/* תובנות */}
      <Paper sx={{ p: 3, mt: 3, bgcolor: 'info.light' }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          💡 תובנות והמלצות
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              • <strong>היעד החסכוני ביותר:</strong> {stats.trips.reduce((min, t) => t.cost < min.cost ? t : min).name} 
              (₪{stats.trips.reduce((min, t) => t.cost < min.cost ? t : min).cost.toLocaleString()})
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              • <strong>היעד היקר ביותר:</strong> {stats.trips.reduce((max, t) => t.cost > max.cost ? t : max).name}
              (₪{stats.trips.reduce((max, t) => t.cost > max.cost ? t : max).cost.toLocaleString()})
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              • <strong>הטיול הארוך ביותר:</strong> {stats.trips.reduce((max, t) => t.days > max.days ? t : max).name} 
              ({stats.trips.reduce((max, t) => t.days > max.days ? t : max).days} ימים)
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default StatisticsPanel;
