import type { APIKeys, APIEndpoints, ApiResponse, APIError } from '../types/index';

// API Keys from environment variables
export const API_KEYS: APIKeys = {
  googleMaps: process.env.REACT_APP_GOOGLE_API_KEY || '',
  // מזג האוויר עבר ל-Open-Meteo, שאינו דורש מפתח. `weather` הוסר כאן
  // ב-04.09.2026 אחרי שנמדד ששרשרת הצרכנים שלו מתה עד הסוף.
  // Gemini עובר דרך /api/gemini — אין מפתח בצד הלקוח, ולכן אין כאן שדה.
  // `openai` הוסר ב-04.09.2026: הוא היה קבוע `''`, כלומר `validateApiKeys`
  // דיווח עליו כחסר תמיד. `REACT_APP_OPENAI_API_KEY` שב-.env לא נקרא
  // מאף מקום ואינו מופיע ב-bundle החי — נמדד, 0 מתוך 45 צ'אנקים.
  //
  // `rapidapi` הוסר באותו יום, והוא המסוכן מבין השלושה: RapidAPI עוברת
  // דרך `api/flight-status.mjs` השרתי כדי שהדפדפן לא יחזיק מפתח — אבל
  // השדה הזה *ניסה* לקרוא `REACT_APP_RAPIDAPI_KEY` בצד הלקוח. הוא לא
  // דלף רק משום שהמשתנה מעולם לא הוגדר ב-Vercel: בצ'אנק החי נראה
  // `rapidapi:{NODE_ENV:"production",…}`, כלומר webpack לא מצא מה
  // להחליף. ההגנה הייתה מקרית, ומי שהיה מגדיר את המשתנה היה מדליף בשקט.
};

/**
 * Validate all API keys are properly configured
 */
export const validateApiKeys = (): boolean => {
  const missing: string[] = [];
  
  if (!API_KEYS.googleMaps) missing.push('Google Maps');
  
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
  googleDirections: 'https://maps.googleapis.com/maps/api/directions'
  // ארבע כתובות RapidAPI (flights, hotels, carRental, attractions) הוסרו
  // ב-04.09.2026: `googleMapsService` הוא הצרכן היחיד של האובייקט הזה,
  // והוא קורא רק את `googleDirections` ואת `googlePlaces`.
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
