/**
 * שירות סטטיסטיקות וניתוח נתונים
 * מנהל היסטוריית טיולים, ניתוח הוצאות ומגמות
 */

class StatisticsService {
  constructor() {
    this.storageKey = 'tripHistory';
  }

  /**
   * שמירת טיול בהיסטוריה
   */
  saveTripToHistory(tripData) {
    try {
      const history = this.getTripHistory();
      
      const trip = {
        id: Date.now(),
        ...tripData,
        savedAt: new Date().toISOString(),
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
      };

      history.push(trip);
      localStorage.setItem(this.storageKey, JSON.stringify(history));
      
      console.log('✅ טיול נשמר בהיסטוריה:', trip);
      return trip;
    } catch (error) {
      console.error('❌ שגיאה בשמירת טיול:', error);
      throw error;
    }
  }

  /**
   * קבלת כל היסטוריית הטיולים
   */
  getTripHistory() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ שגיאה בטעינת היסטוריה:', error);
      return [];
    }
  }

  /**
   * מחיקת טיול מההיסטוריה
   */
  deleteTripFromHistory(tripId) {
    try {
      let history = this.getTripHistory();
      history = history.filter(trip => trip.id !== tripId);
      localStorage.setItem(this.storageKey, JSON.stringify(history));
      console.log('✅ טיול נמחק:', tripId);
    } catch (error) {
      console.error('❌ שגיאה במחיקת טיול:', error);
      throw error;
    }
  }

  /**
   * סטטיסטיקות כלליות
   */
  getGeneralStatistics() {
    const history = this.getTripHistory();
    
    if (history.length === 0) {
      return this.getEmptyStatistics();
    }

    const totalTrips = history.length;
    const totalCost = history.reduce((sum, trip) => sum + (trip.totalCost || 0), 0);
    const avgCost = totalCost / totalTrips;

    // יעדים פופולריים
    const destinations = {};
    history.forEach(trip => {
      const dest = trip.destination || 'לא ידוע';
      destinations[dest] = (destinations[dest] || 0) + 1;
    });

    const topDestinations = Object.entries(destinations)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([dest, count]) => ({ destination: dest, trips: count }));

    // חודשים פופולריים
    const months = {};
    history.forEach(trip => {
      if (trip.month) {
        months[trip.month] = (months[trip.month] || 0) + 1;
      }
    });

    return {
      totalTrips,
      totalCost: totalCost.toFixed(2),
      avgCost: avgCost.toFixed(2),
      topDestinations,
      monthlyDistribution: months,
      lastTripDate: history[history.length - 1].savedAt,
      currency: 'ILS'
    };
  }

  /**
   * סטטיסטיקות חודשיות
   */
  getMonthlyStatistics(year = new Date().getFullYear()) {
    const history = this.getTripHistory();
    const yearTrips = history.filter(trip => trip.year === year);

    const monthlyData = Array(12).fill(0).map((_, idx) => ({
      month: idx + 1,
      monthName: this.getMonthName(idx + 1),
      trips: 0,
      cost: 0
    }));

    yearTrips.forEach(trip => {
      const monthIdx = trip.month - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        monthlyData[monthIdx].trips += 1;
        monthlyData[monthIdx].cost += trip.totalCost || 0;
      }
    });

    return monthlyData;
  }

  /**
   * ניתוח הוצאות לפי קטגוריות
   */
  getCostBreakdown() {
    const history = this.getTripHistory();
    
    if (history.length === 0) {
      return {
        flights: 0,
        hotels: 0,
        restaurants: 0,
        attractions: 0,
        transportation: 0,
        other: 0
      };
    }

    const breakdown = {
      flights: 0,
      hotels: 0,
      restaurants: 0,
      attractions: 0,
      transportation: 0,
      other: 0
    };

    history.forEach(trip => {
      if (trip.costBreakdown) {
        Object.keys(breakdown).forEach(key => {
          breakdown[key] += trip.costBreakdown[key] || 0;
        });
      } else {
        // הערכה אם אין פירוט
        const total = trip.totalCost || 0;
        breakdown.flights += total * 0.35;
        breakdown.hotels += total * 0.30;
        breakdown.restaurants += total * 0.15;
        breakdown.attractions += total * 0.10;
        breakdown.transportation += total * 0.10;
      }
    });

    return breakdown;
  }

  /**
   * השוואת עלויות - ממוצע vs. ספציפי
   */
  compareTripCosts(tripCost) {
    const stats = this.getGeneralStatistics();
    const avgCost = parseFloat(stats.avgCost);
    
    const difference = tripCost - avgCost;
    const percentDiff = avgCost > 0 ? ((difference / avgCost) * 100).toFixed(1) : 0;

    return {
      tripCost,
      avgCost,
      difference: difference.toFixed(2),
      percentDiff,
      comparison: difference > 0 ? 'יותר יקר' : difference < 0 ? 'יותר זול' : 'זהה',
      emoji: difference > 0 ? '📈' : difference < 0 ? '📉' : '➡️'
    };
  }

  /**
   * מגמות שנתיות
   */
  getYearlyTrends() {
    const history = this.getTripHistory();
    const years = {};

    history.forEach(trip => {
      const year = trip.year || new Date(trip.savedAt).getFullYear();
      if (!years[year]) {
        years[year] = {
          year,
          trips: 0,
          totalCost: 0,
          destinations: new Set()
        };
      }
      years[year].trips += 1;
      years[year].totalCost += trip.totalCost || 0;
      if (trip.destination) {
        years[year].destinations.add(trip.destination);
      }
    });

    return Object.values(years).map(yearData => ({
      year: yearData.year,
      trips: yearData.trips,
      totalCost: yearData.totalCost.toFixed(2),
      avgCost: (yearData.totalCost / yearData.trips).toFixed(2),
      destinations: yearData.destinations.size
    })).sort((a, b) => b.year - a.year);
  }

  /**
   * המלצות על סמך היסטוריה
   */
  getRecommendations() {
    const history = this.getTripHistory();
    const recommendations = [];

    if (history.length === 0) {
      return [{
        type: 'info',
        icon: '💡',
        text: 'התחל לתכנן טיולים כדי לקבל המלצות מותאמות אישית!'
      }];
    }

    const stats = this.getGeneralStatistics();
    
    // המלצה על תקציב
    if (parseFloat(stats.avgCost) > 0) {
      recommendations.push({
        type: 'budget',
        icon: '💰',
        text: `הממוצע שלך לטיול הוא ₪${stats.avgCost}. נסה לתכנן טיולים בתקציב דומה.`
      });
    }

    // המלצה על יעד
    if (stats.topDestinations.length > 0) {
      const topDest = stats.topDestinations[0];
      recommendations.push({
        type: 'destination',
        icon: '📍',
        text: `היעד האהוב עליך הוא ${topDest.destination} - אולי כדאי לחקור יעדים דומים?`
      });
    }

    // המלצה על תדירות
    if (history.length < 3) {
      recommendations.push({
        type: 'motivation',
        icon: '🌟',
        text: 'העולם מחכה לך! תכנן עוד טיולים ותרחיב את האופקים.'
      });
    } else {
      recommendations.push({
        type: 'achievement',
        icon: '🎉',
        text: `יש לך כבר ${history.length} טיולים! אתה תייר מנוסה!`
      });
    }

    return recommendations;
  }

  /**
   * פונקציות עזר
   */
  getMonthName(month) {
    const months = [
      'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
      'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ];
    return months[month - 1] || '';
  }

  getEmptyStatistics() {
    return {
      totalTrips: 0,
      totalCost: '0',
      avgCost: '0',
      topDestinations: [],
      monthlyDistribution: {},
      lastTripDate: null,
      currency: 'ILS'
    };
  }

  /**
   * ייצוא נתונים לקובץ
   */
  exportData() {
    const history = this.getTripHistory();
    const stats = this.getGeneralStatistics();
    
    const exportData = {
      trips: history,
      statistics: stats,
      exportDate: new Date().toISOString()
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * ייבוא נתונים מקובץ
   */
  importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.trips && Array.isArray(data.trips)) {
        localStorage.setItem(this.storageKey, JSON.stringify(data.trips));
        console.log('✅ נתונים יובאו בהצלחה!');
        return true;
      }
      
      throw new Error('Invalid data format');
    } catch (error) {
      console.error('❌ שגיאה בייבוא נתונים:', error);
      throw error;
    }
  }

  /**
   * ניקוי כל הנתונים
   */
  clearAllData() {
    localStorage.removeItem(this.storageKey);
    console.log('✅ כל הנתונים נוקו!');
  }
}

const statisticsService = new StatisticsService();
export default statisticsService;
