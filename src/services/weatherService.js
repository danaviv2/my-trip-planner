import { API_KEYS } from './apiManager';

/**
 * שירות תחזית מזג אוויר מתקדם
 * משתמש ב-OpenWeatherMap API
 */

class WeatherService {
  constructor() {
    this.apiKey = API_KEYS.weather;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  /**
   * קבלת מזג אוויר נוכחי
   */
  async getCurrentWeather(location) {
    try {
      const url = `${this.baseUrl}/weather?q=${encodeURIComponent(location)}&appid=${this.apiKey}&units=metric&lang=he`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Weather API Error: ${response.status}`);
      }

      const data = await response.json();
      return this.formatCurrentWeather(data);
    } catch (error) {
      console.error('❌ שגיאה בקבלת מזג אוויר נוכחי:', error);
      throw error;
    }
  }

  /**
   * תחזית ל-5 ימים
   */
  async getForecast(location, days = 5) {
    try {
      const url = `${this.baseUrl}/forecast?q=${encodeURIComponent(location)}&appid=${this.apiKey}&units=metric&lang=he&cnt=${days * 8}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Weather API Error: ${response.status}`);
      }

      const data = await response.json();
      return this.formatForecast(data);
    } catch (error) {
      console.error('❌ שגיאה בקבלת תחזית:', error);
      throw error;
    }
  }

  /**
   * תחזית לפי קואורדינטות
   */
  async getWeatherByCoordinates(lat, lng) {
    try {
      const currentUrl = `${this.baseUrl}/weather?lat=${lat}&lon=${lng}&appid=${this.apiKey}&units=metric&lang=he`;
      const forecastUrl = `${this.baseUrl}/forecast?lat=${lat}&lon=${lng}&appid=${this.apiKey}&units=metric&lang=he`;
      
      const [currentResponse, forecastResponse] = await Promise.all([
        fetch(currentUrl),
        fetch(forecastUrl)
      ]);

      if (!currentResponse.ok || !forecastResponse.ok) {
        throw new Error('Weather API Error');
      }

      const current = await currentResponse.json();
      const forecast = await forecastResponse.json();

      return {
        current: this.formatCurrentWeather(current),
        forecast: this.formatForecast(forecast)
      };
    } catch (error) {
      console.error('❌ שגיאה בקבלת מזג אוויר:', error);
      throw error;
    }
  }

  /**
   * עיצוב מזג אוויר נוכחי
   */
  formatCurrentWeather(data) {
    return {
      location: data.name,
      country: data.sys.country,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      iconUrl: `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      pressure: data.main.pressure,
      visibility: data.visibility / 1000, // המרה לק"מ
      clouds: data.clouds.all,
      sunrise: new Date(data.sys.sunrise * 1000),
      sunset: new Date(data.sys.sunset * 1000),
      coordinates: {
        lat: data.coord.lat,
        lng: data.coord.lon
      }
    };
  }

  /**
   * עיצוב תחזית
   */
  formatForecast(data) {
    const dailyForecasts = {};

    data.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toLocaleDateString('he-IL');

      if (!dailyForecasts[dateKey]) {
        dailyForecasts[dateKey] = {
          date: dateKey,
          fullDate: date,
          temps: [],
          conditions: [],
          icons: [],
          humidity: [],
          rain: []
        };
      }

      dailyForecasts[dateKey].temps.push(item.main.temp);
      dailyForecasts[dateKey].conditions.push(item.weather[0].description);
      dailyForecasts[dateKey].icons.push(item.weather[0].icon);
      dailyForecasts[dateKey].humidity.push(item.main.humidity);
      
      if (item.rain) {
        dailyForecasts[dateKey].rain.push(item.rain['3h'] || 0);
      }
    });

    return Object.values(dailyForecasts).map(day => ({
      date: day.date,
      fullDate: day.fullDate,
      dayName: day.fullDate.toLocaleDateString('he-IL', { weekday: 'long' }),
      minTemp: Math.round(Math.min(...day.temps)),
      maxTemp: Math.round(Math.max(...day.temps)),
      avgTemp: Math.round(day.temps.reduce((a, b) => a + b, 0) / day.temps.length),
      condition: this.getMostFrequent(day.conditions),
      icon: this.getMostFrequent(day.icons),
      iconUrl: `https://openweathermap.org/img/wn/${this.getMostFrequent(day.icons)}@2x.png`,
      humidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
      rainProbability: day.rain.length > 0 ? (day.rain.length / day.conditions.length) * 100 : 0
    }));
  }

  /**
   * מציאת הערך השכיח ביותר במערך
   */
  getMostFrequent(arr) {
    const frequency = {};
    arr.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });
    return Object.keys(frequency).reduce((a, b) => 
      frequency[a] > frequency[b] ? a : b
    );
  }

  /**
   * המלצות לפי מזג אוויר
   */
  getWeatherRecommendations(weather) {
    const recommendations = [];

    // טמפרטורה
    if (weather.temperature > 30) {
      recommendations.push({
        type: 'warning',
        icon: '🌡️',
        text: 'חום כבד! קח הרבה מים והישאר בצל'
      });
    } else if (weather.temperature < 10) {
      recommendations.push({
        type: 'info',
        icon: '🧥',
        text: 'קר בחוץ! הקפד להתלבש בשכבות'
      });
    }

    // גשם
    if (weather.description.includes('גשם') || weather.description.includes('rain')) {
      recommendations.push({
        type: 'warning',
        icon: '☔',
        text: 'גשם צפוי! קח מטריה'
      });
    }

    // רוח
    if (weather.windSpeed > WeatherService.THRESHOLDS.windStrong) {
      recommendations.push({
        type: 'info',
        icon: '💨',
        text: 'רוח חזקה - שים לב לפעילויות חוץ'
      });
    }

    // לחות
    if (weather.humidity > 80) {
      recommendations.push({
        type: 'info',
        icon: '💧',
        text: 'לחות גבוהה - ייתכן תחושת חנק'
      });
    }

    // מזג אוויר מעולה
    if (weather.temperature >= 20 && weather.temperature <= 28 && 
        !weather.description.includes('גשם') && weather.clouds < 50) {
      recommendations.push({
        type: 'success',
        icon: '☀️',
        text: 'מזג אוויר מושלם לטיול!'
      });
    }

    return recommendations;
  }

  /**
   * קבלת אייקון אמוג'י לפי תנאי מזג אוויר
   */
  getWeatherEmoji(icon) {
    const emojiMap = {
      '01d': '☀️',  // שמש
      '01n': '🌙',  // לילה בהיר
      '02d': '⛅',  // חלקית מעונן יום
      '02n': '☁️',  // חלקית מעונן לילה
      '03d': '☁️',  // מעונן
      '03n': '☁️',
      '04d': '☁️',  // מעונן מאוד
      '04n': '☁️',
      '09d': '🌧️', // גשם
      '09n': '🌧️',
      '10d': '🌦️', // גשם עם שמש
      '10n': '🌧️',
      '11d': '⛈️', // סופת רעמים
      '11n': '⛈️',
      '13d': '❄️',  // שלג
      '13n': '❄️',
      '50d': '🌫️', // ערפל
      '50n': '🌫️'
    };
    return emojiMap[icon] || '🌤️';
  }

  /**
   * ספי מזג האוויר — הגדרה אחת לשני הצרכנים.
   *
   * ── מה שהיה כאן ──
   * ההמלצה הזהירה מרוח מעל 10 מ"ש, והציון הוריד נקודות רק מעל 15. בליסבון
   * נמדדו 10.29, ולכן המסך הציג "ציון 100/100 · מעולה" ומיד מתחתיו "רוח
   * חזקה — שים לב לפעילויות חוץ". אותה עובדה, שני ספים, שתי תשובות
   * סותרות — וציון מושלם לצד אזהרה אינו אומר דבר.
   *
   * זה בדיוק הדפוס שכבר עלה כאן ביוקר: ערך שנגזר בשני מקומות נפרד מעצמו.
   */
  static THRESHOLDS = {
    windStrong: 10,
    tempIdealMin: 15,
    tempIdealMax: 30,
    tempExtremeMin: 5,
    tempExtremeMax: 35,
    cloudsHeavy: 80,
    humidityHigh: 80,
  };

  /**
   * המלצה האם מזג האוויר מתאים לטיול
   */
  isSuitableForTrip(weather) {
    const score = {
      value: 100,
      factors: []
    };

    // טמפרטורה
    const T = WeatherService.THRESHOLDS;
    if (weather.temperature < T.tempExtremeMin || weather.temperature > T.tempExtremeMax) {
      score.value -= 30;
      score.factors.push('טמפרטורה קיצונית');
    } else if (weather.temperature < T.tempIdealMin || weather.temperature > T.tempIdealMax) {
      score.value -= 15;
      score.factors.push('טמפרטורה לא אידיאלית');
    }

    // גשם
    if (weather.description.includes('גשם') || weather.description.includes('rain')) {
      score.value -= 25;
      score.factors.push('גשם צפוי');
    }

    // רוח
    if (weather.windSpeed > T.windStrong) {
      score.value -= 20;
      score.factors.push('רוח חזקה');
    }

    // עננות
    if (weather.clouds > T.cloudsHeavy) {
      score.value -= 10;
      score.factors.push('מעונן מאוד');
    }

    // "מעולה" רק כשאין ולו הסתייגות אחת. בבורדו הוצג "85/100 · מעולה"
    // לצד הגורם "טמפרטורה לא אידיאלית" — תווית שסותרת את מה שכתוב לידה
    // מלמדת שאין טעם לקרוא אף אחת מהן.
    let suitability = score.factors.length ? 'טוב' : 'מעולה';
    if (score.value < 50) suitability = 'לא מומלץ';
    else if (score.value < 70) suitability = 'בינוני';
    else if (score.value < 85) suitability = 'טוב';

    return {
      score: Math.max(0, score.value),
      suitability: suitability,
      factors: score.factors
    };
  }
}

const weatherService = new WeatherService();
export default weatherService;
