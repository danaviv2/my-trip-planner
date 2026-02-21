import React, { useState, useEffect } from 'react';
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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('📊 טוען סטטיסטיקות...');
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    setLoading(true);
    
    try {
      // נתונים ריאליסטיים לדוגמה
      const trips = [
        { name: 'פריז', days: 5, cost: 4500, distance: 3400, type: 'פנאי', date: '2024-01' },
        { name: 'ברצלונה', days: 4, cost: 3200, distance: 3100, type: 'פנאי', date: '2024-02' },
        { name: 'רומא', days: 6, cost: 5100, distance: 2800, type: 'משפחה', date: '2024-03' },
        { name: 'לונדון', days: 3, cost: 3800, distance: 3600, type: 'עבודה', date: '2024-04' },
        { name: 'אמסטרדם', days: 4, cost: 3500, distance: 3300, type: 'פנאי', date: '2024-05' },
        { name: 'פראג', days: 5, cost: 2800, distance: 3000, type: 'משפחה', date: '2024-06' }
      ];

      const totalTrips = trips.length;
      const totalCost = trips.reduce((sum, t) => sum + t.cost, 0);
      const totalDistance = trips.reduce((sum, t) => sum + t.distance, 0);
      const avgDuration = Math.round(trips.reduce((sum, t) => sum + t.days, 0) / trips.length);
      const avgCostPerDay = Math.round(totalCost / trips.reduce((sum, t) => sum + t.days, 0));
      const avgCostPerTrip = Math.round(totalCost / totalTrips);

      // ניתוח חיסכון אפשרי
      const potentialSavings = Math.round(totalCost * 0.15); // 15% חיסכון אפשרי

      const mockStats = {
        totalTrips,
        totalDistance,
        totalCost,
        avgDuration,
        avgCostPerDay,
        avgCostPerTrip,
        potentialSavings,
        trips,
        monthlyTrips: {
          labels: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני'],
          data: [1, 1, 1, 1, 1, 1]
        },
        tripsByType: {
          labels: ['עבודה', 'פנאי', 'משפחה'],
          data: [
            trips.filter(t => t.type === 'עבודה').length,
            trips.filter(t => t.type === 'פנאי').length,
            trips.filter(t => t.type === 'משפחה').length
          ]
        },
        costTrend: {
          labels: trips.map(t => t.name),
          data: trips.map(t => t.cost)
        },
        costBreakdown: {
          labels: ['טיסות', 'לינה', 'אוכל', 'אטרקציות', 'תחבורה'],
          data: [
            Math.round(totalCost * 0.35),
            Math.round(totalCost * 0.30),
            Math.round(totalCost * 0.20),
            Math.round(totalCost * 0.10),
            Math.round(totalCost * 0.05)
          ]
        },
        costPerDayByTrip: {
          labels: trips.map(t => t.name),
          data: trips.map(t => Math.round(t.cost / t.days))
        }
      };

      await new Promise(resolve => setTimeout(resolve, 500));
      
      setStats(mockStats);
      console.log('✅ סטטיסטיקות נטענו!');
    } catch (error) {
      console.error('❌ שגיאה בטעינת סטטיסטיקות:', error);
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
    return <Typography>אין נתונים להצגה</Typography>;
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

  const costBreakdownChart = {
    labels: stats.costBreakdown.labels,
    datasets: [{
      data: stats.costBreakdown.data,
      backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)'
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

      {/* תובנה ראשית */}
      <Alert severity="success" icon={<SaveIcon />} sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          💡 תובנה: ניתן לחסוך עד ₪{stats.potentialSavings.toLocaleString()} בהזמנה מוקדמת ובחירת תאריכים גמישים!
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
                <DistanceIcon sx={{ fontSize: 50 }} />
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    {stats.totalDistance.toLocaleString()}
                  </Typography>
                  <Typography variant="body1">ק״מ</Typography>
                  <Typography variant="caption">
                    {Math.round(stats.totalDistance / stats.totalTrips)} ק״מ בממוצע
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
                <TableCell><strong>מרחק</strong></TableCell>
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
                  <TableCell>{trip.distance} ק״מ</TableCell>
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

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              �� פירוט הוצאות
            </Typography>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              <Pie 
                data={costBreakdownChart} 
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
            <Typography variant="body1" sx={{ mb: 1 }}>
              • <strong>המרחק הממוצע:</strong> {Math.round(stats.totalDistance / stats.totalTrips).toLocaleString()} ק״מ
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default StatisticsPanel;
