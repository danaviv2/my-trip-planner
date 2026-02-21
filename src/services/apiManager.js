// API Keys from environment variables
export const API_KEYS = {
  googleMaps: process.env.REACT_APP_GOOGLE_API_KEY,
  weather: process.env.REACT_APP_WEATHER_API_KEY,
  openai: process.env.REACT_APP_OPENAI_API_KEY,
  rapidapi: process.env.REACT_APP_RAPIDAPI_KEY
};

// Validate API Keys
export const validateApiKeys = () => {
  const missing = [];
  
  if (!API_KEYS.googleMaps) missing.push('Google Maps');
  if (!API_KEYS.weather) missing.push('Weather');
  if (!API_KEYS.openai) missing.push('OpenAI');
  if (!API_KEYS.rapidapi) missing.push('RapidAPI');
  
  if (missing.length > 0) {
    console.warn('Missing API keys: ' + missing.join(', '));
    return false;
  }
  
  console.log('All API keys validated');
  return true;
};

// API Endpoints
export const API_ENDPOINTS = {
  googleMaps: 'https://maps.googleapis.com/maps/api',
  googlePlaces: 'https://maps.googleapis.com/maps/api/place',
  googleDirections: 'https://maps.googleapis.com/maps/api/directions',
  weather: 'https://api.openweathermap.org/data/2.5',
  flights: 'https://booking-com.p.rapidapi.com/v1/flights',
  hotels: 'https://booking-com.p.rapidapi.com/v1/hotels',
  carRental: 'https://booking-com.p.rapidapi.com/v1/car-rentals',
  attractions: 'https://travel-advisor.p.rapidapi.com'
};

// API Call function
export const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      throw new Error('HTTP error! status: ' + response.status);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Fetch with retry
export const fetchWithRetry = async (url, options = {}, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await apiCall(url, options);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

export default API_KEYS;
