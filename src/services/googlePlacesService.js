import { API_KEYS } from './apiManager';

/**
 * שירות Google Places - חיפוש אטרקציות, מסעדות, מלונות ועוד
 */

// שלושת הכשלים שנמדדו כשהפאנל הורץ על מסך לראשונה, וכולם נגמרו כאן
// ברשימה ריקה שאין דרך להבדיל בינה לבין "אין מקומות כאן":
//
// 1. סקריפט Maps נטען אחרי שהפאנל כבר שאל. `window.google` עדיין לא קיים,
//    התשובה הייתה `[]`, ואיש לא שאל שוב לעולם.
// 2. סטטוס שגיאה מהשירות דווח כ-`[]` — ואז נכתב "✅ נמצאו 0".
// 3. כשהמפתח נכשל באימות (`RefererNotAllowedMapError`) הקולבק של
//    `nearbySearch` פשוט אינו נקרא. בלי תקציב זמן, הספינר מסתובב לנצח.
//
// לכן: המתנה במקום הנחה, שגיאה מסוּוגת במקום רשימה ריקה, ותקרת זמן על
// כל קריאה. `ZERO_RESULTS` הוא היחיד שנשאר רשימה ריקה — הוא באמת אומר
// "אין כאן", וזו תשובה ולא כשל.
export const PLACES_ERRORS = {
  MAPS_UNAVAILABLE: 'MAPS_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  REQUEST_FAILED: 'REQUEST_FAILED'
};

const MAPS_WAIT_MS = 15000;
const REQUEST_TIMEOUT_MS = 12000;

class PlacesError extends Error {
  constructor(kind, detail) {
    super(detail ? `${kind}: ${detail}` : kind);
    this.name = 'PlacesError';
    this.kind = kind;
    this.detail = detail || null;
  }
}

class GooglePlacesService {
  constructor() {
    this.apiKey = API_KEYS.googleMaps;
  }

  /**
   * ממתין לסקריפט של Maps במקום להניח שהוא כבר כאן.
   * מחזיר `true` כשהוא זמין, ו-`false` אם לא הגיע בזמן.
   */
  waitForMaps(timeoutMs = MAPS_WAIT_MS) {
    if (window.google?.maps?.places) return Promise.resolve(true);

    return new Promise((resolve) => {
      const startedAt = Date.now();
      const timer = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(timer);
          resolve(true);
        } else if (Date.now() - startedAt > timeoutMs) {
          clearInterval(timer);
          resolve(false);
        }
      }, 200);
    });
  }

  /**
   * עוטף קריאה לשירות בתקציב זמן. בלי זה, קולבק שלא נקרא הוא ספינר נצחי.
   */
  withTimeout(executor, timeoutMs = REQUEST_TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new PlacesError(PLACES_ERRORS.TIMEOUT));
      }, timeoutMs);

      executor(
        (value) => { if (!settled) { settled = true; clearTimeout(timer); resolve(value); } },
        (error) => { if (!settled) { settled = true; clearTimeout(timer); reject(error); } }
      );
    });
  }

  /**
   * חיפוש אטרקציות ומקומות מעניינים
   */
  async searchNearbyPlaces(location, radius = 5000, type = 'tourist_attraction') {
    const ready = await this.waitForMaps();
    if (!ready) throw new PlacesError(PLACES_ERRORS.MAPS_UNAVAILABLE);

    return this.withTimeout((resolve, reject) => {
      const service = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );

      const request = {
        location: new window.google.maps.LatLng(location.lat, location.lng),
        radius: radius,
        type: type
      };

      service.nearbySearch(request, (results, status) => {
        const statuses = window.google.maps.places.PlacesServiceStatus;
        if (status === statuses.OK) {
          resolve(this.formatPlaces(results));
        } else if (status === statuses.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(new PlacesError(PLACES_ERRORS.REQUEST_FAILED, status));
        }
      });
    });
  }

  /**
   * חיפוש מסעדות
   */
  async searchRestaurants(location, radius = 3000, minRating = 3.5) {
    const places = await this.searchNearbyPlaces(location, radius, 'restaurant');
    return places.filter(place => place.rating >= minRating);
  }

  /**
   * חיפוש מלונות
   */
  async searchHotels(location, radius = 5000) {
    return await this.searchNearbyPlaces(location, radius, 'lodging');
  }

  /**
   * חיפוש מוזיאונים
   */
  async searchMuseums(location, radius = 10000) {
    return await this.searchNearbyPlaces(location, radius, 'museum');
  }

  /**
   * חיפוש קניונים וחנויות
   */
  async searchShopping(location, radius = 5000) {
    return await this.searchNearbyPlaces(location, radius, 'shopping_mall');
  }

  /**
   * חיפוש בידור ולילה
   */
  async searchNightlife(location, radius = 5000) {
    const bars = await this.searchNearbyPlaces(location, radius, 'night_club');
    const cafes = await this.searchNearbyPlaces(location, radius, 'bar');
    return [...bars, ...cafes];
  }

  /**
   * חיפוש טקסט חופשי
   */
  async textSearch(query, location = null) {
    const ready = await this.waitForMaps();
    if (!ready) throw new PlacesError(PLACES_ERRORS.MAPS_UNAVAILABLE);

    return this.withTimeout((resolve, reject) => {
      const service = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );

      const request = {
        query: query,
        ...(location && {
          location: new window.google.maps.LatLng(location.lat, location.lng),
          radius: 10000
        })
      };

      service.textSearch(request, (results, status) => {
        const statuses = window.google.maps.places.PlacesServiceStatus;
        if (status === statuses.OK) {
          resolve(this.formatPlaces(results));
        } else if (status === statuses.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(new PlacesError(PLACES_ERRORS.REQUEST_FAILED, status));
        }
      });
    });
  }

  /**
   * פרטים מלאים על מקום
   */
  async getPlaceDetails(placeId) {
    // כאן `null` נשאר תשובה סבירה: הפרטים המורחבים הם תוספת על שורה
    // שכבר מוצגת, ולא המסך עצמו. אין מה להחליף בהודעת שגיאה.
    const ready = await this.waitForMaps();
    if (!ready) return null;

    return new Promise((resolve, reject) => {
      const service = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );

      const request = {
        placeId: placeId,
        fields: [
          'name',
          'rating',
          'formatted_address',
          'formatted_phone_number',
          'opening_hours',
          'website',
          'photos',
          'price_level',
          'reviews',
          'geometry',
          'types',
          'url'
        ]
      };

      service.getDetails(request, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          console.log('✅ פרטי מקום התקבלו:', place.name);
          resolve(this.formatPlaceDetails(place));
        } else {
          console.error('שגיאה בקבלת פרטי מקום:', status);
          resolve(null);
        }
      });
    });
  }

  /**
   * השלמה אוטומטית של כתובות
   */
  async autocomplete(input, location = null) {
    if (!window.google || !window.google.maps) {
      console.error('Google Maps לא זמין');
      return [];
    }

    return new Promise((resolve, reject) => {
      const service = new window.google.maps.places.AutocompleteService();

      const request = {
        input: input,
        ...(location && {
          location: new window.google.maps.LatLng(location.lat, location.lng),
          radius: 50000
        })
      };

      service.getPlacePredictions(request, (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          resolve(predictions || []);
        } else {
          resolve([]);
        }
      });
    });
  }

  /**
   * עיצוב נתוני מקומות
   */
  formatPlaces(places) {
    return places.map(place => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity || place.formatted_address,
      rating: place.rating || 0,
      userRatingsTotal: place.user_ratings_total || 0,
      priceLevel: place.price_level || 0,
      types: place.types || [],
      location: {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      },
      photos: place.photos ? place.photos.map(photo => ({
        url: photo.getUrl({ maxWidth: 400, maxHeight: 400 })
      })) : [],
      openNow: place.opening_hours?.open_now,
      icon: place.icon
    }));
  }

  /**
   * עיצוב פרטי מקום מלאים
   */
  formatPlaceDetails(place) {
    return {
      id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      phone: place.formatted_phone_number,
      website: place.website,
      rating: place.rating || 0,
      userRatingsTotal: place.user_ratings_total || 0,
      priceLevel: place.price_level || 0,
      types: place.types || [],
      location: {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      },
      photos: place.photos ? place.photos.slice(0, 10).map(photo => ({
        url: photo.getUrl({ maxWidth: 800, maxHeight: 600 })
      })) : [],
      openingHours: place.opening_hours ? {
        openNow: place.opening_hours.open_now,
        weekdayText: place.opening_hours.weekday_text || []
      } : null,
      reviews: place.reviews ? place.reviews.slice(0, 5).map(review => ({
        author: review.author_name,
        rating: review.rating,
        text: review.text,
        time: review.relative_time_description
      })) : [],
      url: place.url
    };
  }

  /**
   * חישוב מרחק בין שתי נקודות
   */
  calculateDistance(origin, destination) {
    if (!window.google || !window.google.maps) {
      return null;
    }

    const service = new window.google.maps.DistanceMatrixService();

    return new Promise((resolve, reject) => {
      service.getDistanceMatrix(
        {
          origins: [origin],
          destinations: [destination],
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.METRIC
        },
        (response, status) => {
          if (status === 'OK') {
            const result = response.rows[0].elements[0];
            resolve({
              distance: result.distance.text,
              duration: result.duration.text,
              distanceValue: result.distance.value,
              durationValue: result.duration.value
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  /**
   * קבלת תמונה של מקום
   */
  getPhotoUrl(photoReference, maxWidth = 400) {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${this.apiKey}`;
  }
}

const googlePlacesService = new GooglePlacesService();
export default googlePlacesService;
