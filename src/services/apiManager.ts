import type { APIKeys, APIEndpoints, ApiResponse, APIError } from '../types/index';

// API Keys from environment variables
export const API_KEYS: APIKeys = {
  googleMaps: process.env.REACT_APP_GOOGLE_API_KEY || '',
  weather: process.env.REACT_APP_WEATHER_API_KEY || '',
  openai: process.env.REACT_APP_OPENAI_API_KEY || '',
  rapidapi: process.env.REACT_APP_RAPIDAPI_KEY || ''
};

/**
 * Validate all API keys are properly configured
 */
export const validateApiKeys = (): boolean => {
  const missing: string[] = [];
  
  if (!API_KEYS.googleMaps) missing.push('Google Maps');
  if (!API_KEYS.weather) missing.push('Weather');
  if (!API_KEYS.openai) missing.push('OpenAI');
  if (!API_KEYS.rapidapi) missing.push('RapidAPI');
  
  if (missing.length > 0) {
    console.warn(`⚠️ Missing API keys: ${missing.join(', ')}`);
    return false;
  }
  
  console.log('✅ All API keys validated');
  return true;
};

// API Endpoints configuration
export const API_ENDPOINTS: APIEndpoints = {
  googleMaps: 'https://maps.googleapis.com/maps/api',
  googlePlaces: 'https://maps.googleapis.com/maps/api/place',
  googleDirections: 'https://maps.googleapis.com/maps/api/directions',
  weather: 'https://api.openweathermap.org/data/2.5',
  flights: 'https://booking-com.p.rapidapi.com/v1/flights',
  hotels: 'https://booking-com.p.rapidapi.com/v1/hotels',
  carRental: 'https://booking-com.p.rapidapi.com/v1/car-rentals',
  attractions: 'https://travel-advisor.p.rapidapi.com'
};

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * Generic API call function with proper error handling
 */
export const apiCall = async <T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      const error: APIError = {
        message: `HTTP error! status: ${response.status}`,
        status: response.status
      };
      return { success: false, error };
    }
    
    const data: T = await response.json();
    return { success: true, data };
  } catch (error) {
    const apiError: APIError = {
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      code: 'API_CALL_ERROR'
    };
    console.error('❌ API call failed:', error);
    return { success: false, error: apiError };
  }
};

/**
 * Fetch with automatic retry logic
 */
export const fetchWithRetry = async <T = unknown>(
  url: string,
  options: FetchOptions = {},
  retries: number = 3
): Promise<ApiResponse<T>> => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await apiCall<T>(url, options);
      if (result.success) {
        return result;
      }
      
      if (i === retries - 1) {
        return result;
      }
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, 1000 * Math.pow(2, i))
      );
    } catch (error) {
      if (i === retries - 1) {
        return {
          success: false,
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            code: 'RETRY_EXHAUSTED'
          }
        };
      }
    }
  }
  
  return {
    success: false,
    error: { message: 'Max retries exceeded', code: 'MAX_RETRIES' }
  };
};

export default API_KEYS;
