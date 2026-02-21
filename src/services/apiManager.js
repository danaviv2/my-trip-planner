/**
 * מנהל API מרכזי לכל שירותי האפליקציה
 * מרכז את כל מפתחות ה-API והגדרות הבסיס
 */

// מפתחות API מתוך משתני סביבה
export const API_KEYS = {
  googleMaps: process.env.REACT_APP_GOOGLE_API_KEY,
  weather: process.env.REACT_APP_WEATHER_API_KEY,
  openai: process.env.REACT_APP_OPENAI_API_KEY,
  rapidapi: process.env.REACT_APP_RAPIDAPI_KEY
};

// בדיקת תקינות מפתחות
export const validateApiKeys = () => {
  const missing = [];
  
  if (!API_KEYS.googleMaps) missing.push('Google Maps');
  if (!API_KEYS.weather) missing.push('Weather');
  if (!API_KEYS.openai) missing.push('OpenAI');
  if (!API_KEYS.rapidapi) missing.push('RapidAPI');
  
  if (missing.length > 0) {
    console.warn(`⚠️ חסרים מפתחות API: ${missing.join(', ')}`);
    return false;
  }
  
  console.log('✅ כל מפתחות ה-API תקינים');
  return   return   return   return   return   return   return   return   return   return   r= {
  //  //  //  //  //  //  //  //  //  //  //  //  //  //  //  ps/api',
  googlePlaces: 'https://maps.googleapis.com/maps/api/place',
  googleDi  googleDi  googleDi  googleDi  googleDi  googleDir  googleDi  googleDiather   googleDi  googleDi  googleDi  googleDi  gorg/data/  googleDi  googleDi  googleDi  googleDi  : 'https://booking-com.p.rapidapi.com/v1/flights',
  hotels: 'https://booking-com.p.rapidapi.com/v1/hotels',
  carRental: 'https://booking-com.p.rapidapi.com/v1/car-rentals',
  attractions: 'https://travel-advis  attractions: 'https://travel-advis  attractions: 'h�ק�  attractions: 'https://travel-advis  attracurl, o  attractions: 'https://travel-advis  attrac = a  attractions: 'https://travel-advis  attractions: {         'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      throw new Er      throw new Er      throw new Er      throw new Er   
                                                                                                err                                                                 ON ע�                                                     l, options = {}, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await apiCall(url, options);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolv      await new Promise(resolve => setTimeout(resolv    YS;
