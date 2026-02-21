import { API_KEYS } from './apiManager';

class PriceComparisonService {
  
  /**
   * חיפוש טיסות (נתוני דוגמה)
   */
  async searchFlights(origin, destination, departureDate, returnDate) {
    console.log(`✈️ מחפש טיסות: ${origin} → ${destination}`);
    
    // נתוני דוגמה (כי Skyscanner לא זמין יותר)
    return this.generateMockFlights(origin, destination, departureDate);
  }

  /**
   * חיפוש מלונות באמצעות Booking.com API
   */
  async searchHotels(location, checkIn, checkOut) {
    console.log(`🏨 מחפש מלונות ב-${location}`);
    
    try {
      const url = 'https://booking-com.p.rapidapi.com/v1/hotels/search';
      const options = {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': API_KEYS.rapidapi,
          'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
        },
        params: {
          query: location,
          checkin_date: checkIn,
          checkout_date: checkOut,
          adults_number: 2
        }
      };

      const response = await fetch(`${url}?${new URLSearchParams(options.params)}`, {
        method: options.method,
        headers: options.headers
      });

      if (!response.ok) {
        throw new Error(`Hotel API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ נתוני מלונות התקבלו:', data);
      
      return this.parseHotels(data);
    } catch (error) {
      console.error('❌ שגיאה בחיפוש מלונות:', error);
      return this.generateMockHotels(location);
    }
  }

  /**
   * חיפוש השכרת רכב (נתוני דוגמה)
   */
  async searchCarRentals(location, pickupDate, returnDate) {
    console.log(`🚗 מחפש השכרת רכב ב-${location}`);
    return this.generateMockCars(location, pickupDate, returnDate);
  }

  /**
   * השוואת כל המחירים
   */
  async compareAllPrices(origin, destination, departureDate, returnDate) {
    console.log('💰 מבצע השוואת מחירים מלאה...');

    try {
      const [flights, hotels, cars] = await Promise.all([
        this.searchFlights(origin, destination, departureDate, returnDate),
        this.searchHotels(destination, departureDate, returnDate),
        this.searchCarRentals(destination, departureDate, returnDate)
      ]);

      return {
        flights: flights || [],
        hotels: hotels || [],
        cars: cars || [],
        summary: this.calculateSummary(flights, hotels, cars)
      };
    } catch (error) {
      console.error('❌ שגיאה בהשוואת מחירים:', error);
      return {
        flights: this.generateMockFlights(origin, destination, departureDate),
        hotels: this.generateMockHotels(destination),
        cars: this.generateMockCars(destination, departureDate, returnDate),
        summary: {}
      };
    }
  }

  /**
   * פענוח נתוני מלונות
   */
  parseHotels(data) {
    if (!data || !data.result) return this.generateMockHotels('Unknown');
    
    return data.result.slice(0, 5).map(hotel => ({
      name: hotel.hotel_name,
      price: Math.round(hotel.min_total_price || Math.random() * 500 + 200),
      rating: hotel.review_score || 8.5,
      location: hotel.address,
      amenities: ['WiFi', 'חניה', 'ארוחת בוקר'],
      image: hotel.main_photo_url
    }));
  }

  /**
   * חישוב סיכום
   */
  calculateSummary(flights, hotels, cars) {
    const flightPrice = flights.length > 0 ? Math.min(...flights.map(f => f.price)) : 0;
    const hotelPrice = hotels.length > 0 ? Math.min(...hotels.map(h => h.price)) : 0;
    const carPrice = cars.length > 0 ? Math.min(...cars.map(c => c.price)) : 0;

    return {
      totalMin: flightPrice + hotelPrice + carPrice,
      bestFlight: flights[0],
      bestHotel: hotels[0],
      bestCar: cars[0]
    };
  }

  /**
   * יצירת טיסות לדוגמה
   */
  generateMockFlights(origin, destination, date) {
    return [
      {
        airline: 'El Al',
        price: Math.round(Math.random() * 500 + 800),
        departure: '08:00',
        arrival: '14:30',
        duration: '6h 30m',
        stops: 0
      },
      {
        airline: 'Lufthansa',
        price: Math.round(Math.random() * 400 + 700),
        departure: '11:00',
        arrival: '18:00',
        duration: '7h',
        stops: 1
      },
      {
        airline: 'Air France',
        price: Math.round(Math.random() * 450 + 750),
        departure: '15:30',
        arrival: '22:00',
        duration: '6h 30m',
        stops: 0
      }
    ];
  }

  /**
   * יצירת מלונות לדוגמה
   */
  generateMockHotels(location) {
    return [
      {
        name: `Hotel Central ${location}`,
        price: Math.round(Math.random() * 200 + 300),
        rating: 8.5,
        location: 'מרכז העיר',
        amenities: ['WiFi', 'חניה', 'בריכה', 'ארוחת בוקר']
      },
      {
        name: `${location} Plaza`,
        price: Math.round(Math.random() * 150 + 250),
        rating: 8.0,
        location: 'ליד תחנת הרכבת',
        amenities: ['WiFi', 'חניה', 'ארוחת בוקר']
      },
      {
        name: `Boutique ${location}`,
        price: Math.round(Math.random() * 250 + 400),
        rating: 9.0,
        location: 'רובע היסטורי',
        amenities: ['WiFi', 'ספא', 'מסעדה', 'בריכה']
      }
    ];
  }

  /**
   * יצירת רכבים לדוגמה
   */
  generateMockCars(location, pickupDate, returnDate) {
    return [
      {
        company: 'Hertz',
        model: 'Toyota Corolla',
        price: Math.round(Math.random() * 100 + 150),
        type: 'כלכלי',
        transmission: 'אוטומט'
      },
      {
        company: 'Avis',
        model: 'Ford Focus',
        price: Math.round(Math.random() * 120 + 180),
        type: 'קומפקטי',
        transmission: 'אוטומט'
      },
      {
        company: 'Sixt',
        model: 'BMW 3 Series',
        price: Math.round(Math.random() * 200 + 300),
        type: 'יוקרה',
        transmission: 'אוטומט'
      }
    ];
  }
}

export default new PriceComparisonService();
