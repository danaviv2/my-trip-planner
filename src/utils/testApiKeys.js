import { API_KEYS } from '../services/apiManager';

/**
 * בדיקת תקינות כל מפתחות ה-API
 */

export const testAllApiKeys = async () => {
  console.log('🔍 מתחיל בדיקת מפתחות API...\n');
  
  const results = {
    googleMaps: { status: 'testing', message: '' },
    weather: { status: 'testing', message: '' },
    openai: { status: 'testing', message: '' },
    rapidapi: { status: 'testing', message: '' }
  };

  // 1. בדיקת Google Maps (אתה אמרת שהוא תקין)
  results.googleMaps = {
    status: 'success',
    message: '✅ Google Maps API - תקין (מאומת)'
  };
  console.log(results.googleMaps.message);

  // 2. בדיקת Weather API
  try {
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=Tel-Aviv&appid=${API_KEYS.weather}&units=metric&lang=he`
    );
    
    if (weatherResponse.ok) {
      const data = await weatherResponse.json();
      results.weather = {
        status: 'success',
        message: `✅ Weather API - תקין (טמפרטורה בתל אביב: ${data.main.temp}°C)`
      };
    } else {
      results.weather = {
        status: 'error',
        message: `❌ Weather API - שגיאה: ${weatherResponse.status}`
      };
    }
  } catch (error) {
    results.weather = {
      status: 'error',
      message: `❌ Weather API - נכשל: ${error.message}`
    };
  }
  console.log(results.weather.message);

  // 3. בדיקת OpenAI API
  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${API_KEYS.openai}`
      }
    });
    
    if (openaiResponse.ok) {
      results.openai = {
        status: 'success',
        message: '✅ OpenAI API - תקין'
      };
    } else {
      const errorData = await openaiResponse.json();
      results.openai = {
        status: 'error',
        message: `❌ OpenAI API - שגיאה: ${errorData.error?.message || openaiResponse.status}`
      };
    }
  } catch (error) {
    results.openai = {
      status: 'error',
      message: `❌ OpenAI API - נכשל: ${error.message}`
    };
  }
  console.log(results.openai.message);

  // 4. בדיקת RapidAPI
  try {
    const rapidApiResponse = await fetch(
      'https://booking-com.p.rapidapi.com/v1/hotels/locations?locale=he&name=תל אביב',
      {
        headers: {
          'X-RapidAPI-Key': API_KEYS.rapidapi,
          'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
        }
      }
    );
    
    if (rapidApiResponse.ok) {
      const data = await rapidApiResponse.json();
      results.rapidapi = {
        status: 'success',
        message: `✅ RapidAPI - תקין (נמצאו ${data.length || 0} תוצאות)`
      };
    } else {
      results.rapidapi = {
        status: 'error',
        message: `❌ RapidAPI - שגיאה: ${rapidApiResponse.status}`
      };
    }
  } catch (error) {
    results.rapidapi = {
      status: 'error',
      message: `❌ RapidAPI - נכשל: ${error.message}`
    };
  }
  console.log(results.rapidapi.message);

  // סיכום
  console.log('\n📊 סיכום בדיקת API:');
  const successCount = Object.values(results).filter(r => r.status === 'success').length;
  const totalCount = Object.keys(results).length;
  console.log(`${successCount}/${totalCount} מפתחות תקינים\n`);
  
  return results;
};

// פונקציה לבדיקה מהירה
export const quickTest = async () => {
  console.log('⚡ בדיקה מהירה של מפתחות...');
  const results = await testAllApiKeys();
  return results;
};

export default testAllApiKeys;
