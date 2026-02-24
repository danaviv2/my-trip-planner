import { API_KEYS, API_ENDPOINTS } from './apiManager';

/**
 * שירות Google Maps - כל הפונקציות הקשורות למפות
 */

class GoogleMapsService {
  constructor() {
    this.apiKey = API_KEYS.googleMaps;
  }

  /**
   * חיפוש מסלולי תחבורה ציבורית
   */
  async getPublicTransitRoutes(origin, destination, options = {}) {
    const params = new URLSearchParams({
      origin: origin,
      destination: destination,
      mode: 'transit',
      key: this.apiKey,
      language: 'iw',
      ...options
    });

    const url = `${API_ENDPOINTS.googleDirections}/json?${params}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK') {
        return this.formatTransitRoutes(data.routes);
      } else {
        console.error('שגיאה בחיפוש מסלולים:', data.status);
        return [];
      }
    } catch (error) {
      console.error('❌ שגיאה בקריאה ל-Google Directions:', error);
      return [];
    }
  }

  /**
   * עיצוב מסלולי תחבורה ציבורית
   */
  formatTransitRoutes(routes) {
    return routes.map((route, index) => {
      const leg = route.legs[0];
      const transitDetails = leg.steps
        .filter(step => step.travel_mode === 'TRANSIT')
        .map(step => step.transit_details);

      return {
        id: index + 1,
        name: this.getRouteName(transitDetails),
        operator: this.getOperator(transitDetails),
        duration: leg.duration.text,
        price: this.estimatePrice(transitDetails),
        rating: (4 + Math.random()).toFixed(1),
        color: this.getRouteColor(index),
        coordinates: {
          lat: leg.start_location.lat,
          lng: leg.start_location.lng
        },
        description: leg.distance.text + ' - ' + leg.duration.text,
        steps: leg.steps,
        polyline: route.overview_polyline.points
      };
    });
  }

  /**
   * קבלת שם המסלול
   */
  getRouteName(transitDetails) {
    if (transitDetails.length > 0) {
      const firstTransit = transitDetails[0];
      return `קו ${firstTransit.line.short_name || firstTransit.line.name}`;
    }
    return 'מסלול ישיר';
  }

  /**
   * קבלת המפעיל
   */
  getOperator(transitDetails) {
    if (transitDetails.length > 0) {
      return transitDetails[0].line.agencies[0]?.name || 'תחבורה ציבורית';
    }
    return 'לא ידוע';
  }

  /**
   * הערכת מחיר (זמני - צריך API נוסף למחירים מדויקים)
   */
  estimatePrice(transitDetails) {
    const basePrice = 5.90;
    const transfers = transitDetails.length - 1;
    const totalPrice = basePrice + (transfers * 2.5);
    return `₪${totalPrice.toFixed(2)}`;
  }

  /**
   * צבע למסלול לפי אינדקס
   */
  getRouteColor(index) {
    const colors = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', '#00BCD4'];
    return colors[index % colors.length];
  }

  /**
   * חיפוש אטרקציות סמוכות
   */
  async getNearbyAttractions(location, radius = 5000, type = 'tourist_attraction') {
    const params = new URLSearchParams({
      location: `${location.lat},${location.lng}`,
      radius: radius,
      type: type,
      key: this.apiKey,
      language: 'iw'
    });

    const url = `${API_ENDPOINTS.googlePlaces}/nearbysearch/json?${params}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK') {
        return data.results;
      }
      return [];
    } catch (error) {
      console.error('❌ שגיאה בחיפוש אטרקציות:', error);
      return [];
    }
  }

  /**
   * פרטים מלאים על מקום
   */
  async getPlaceDetails(placeId) {
    const params = new URLSearchParams({
      place_id: placeId,
      key: this.apiKey,
      language: 'iw',
      fields: 'name,rating,formatted_address,opening_hours,website,photos,price_level,reviews'
    });

    const url = `${API_ENDPOINTS.googlePlaces}/details/json?${params}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK') {
        return data.result;
      }
      return null;
    } catch (error) {
      console.error('❌ שגיאה בקבלת פרטי מקום:', error);
      return null;
    }
  }
}

const googleMapsService = new GoogleMapsService();
export default googleMapsService;
