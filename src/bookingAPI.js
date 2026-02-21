// bookingAPI.js - כל הפונקציות והלוגיקה לתקשורת עם ה-API של Booking.com

/**
 * פונקציה ראשית להבאת מידע על יעד - מתקשרת ל-Booking.com API
 * @param {string} location - שם המיקום לחיפוש
 * @param {string} apiKey - מפתח ה-API של RapidAPI
 * @returns {object} - מידע מעובד על היעד ומלונות
 */
const fetchDestinationInfo = async (location, apiKey) => {
    console.log(`מביא מידע עבור: ${location} עם מפתח API: ${apiKey}`);
    
    try {
      // 1. קריאה לAPI של Booking.com לקבלת מידע על היעד
      const destinationData = await fetchBookingDestination(location, apiKey);
      
      if (!destinationData || !destinationData.data || destinationData.data.length === 0) {
        throw new Error('לא נמצא מידע על היעד המבוקש');
      }
      
      // 2. נהמר את המידע למבנה שהקומפוננטה שלנו מצפה לו
      const mainDestination = destinationData.data[0]; // ניקח את התוצאה הראשונה (הכי רלוונטית)
      
      // 3. קריאה נוספת לAPI כדי לקבל מלונות לפי היעד
      const hotelsData = await fetchHotelsForDestination(mainDestination.dest_id, apiKey);
      
      // 4. מחזירים את כל המידע במבנה שהקומפוננטה מצפה לו
      return {
        name: mainDestination.name,
        localName: mainDestination.name,
        country: mainDestination.country || '',
        continent: 'לא זמין מה-API', // ה-API לא מספק מידע על יבשת
        population: 'לא זמין מה-API', // ה-API לא מספק מידע על אוכלוסייה
        language: mainDestination.lc || '',
        currency: 'לא זמין מה-API', // נדרשת קריאה נוספת לAPI נפרד
        coordinates: { 
          lat: parseFloat(mainDestination.latitude), 
          lng: parseFloat(mainDestination.longitude) 
        },
        timezoneOffset: 'לא זמין מה-API',
        callingCode: 'לא זמין מה-API',
        description: `${mainDestination.name} ממוקמת ב${mainDestination.region || mainDestination.country}. יש בה ${mainDestination.nr_hotels || 0} מלונות זמינים להזמנה.`,
        
        // נמיר את מידע המלונות למבנה שהקומפוננטה מצפה לו
        hotels: hotelsData.map(hotel => ({
          name: hotel.hotel_name,
          stars: hotel.stars || 0,
          area: hotel.district || hotel.city_name || '',
          priceRange: getPriceRangeFromHotel(hotel),
          description: hotel.hotel_description || 'אין תיאור זמין'
        })),
        
        // שדות נוספים שהקומפוננטה מצפה להם - אפשר להוסיף לוגיקה נוספת כדי למלא אותם
        attractions: [],
        food: [],
        transportation: [],
        weatherInfo: {
          bestTimeToVisit: 'אביב וסתיו',
          seasons: [
            { name: 'אביב (מרץ-מאי)', description: 'מזג אוויר נעים', activities: 'טיולים בעיר' },
            { name: 'קיץ (יוני-אוגוסט)', description: 'חם', activities: 'פעילויות בחוץ' },
            { name: 'סתיו (ספטמבר-נובמבר)', description: 'מזג אוויר נעים', activities: 'סיורים באתרים' },
            { name: 'חורף (דצמבר-פברואר)', description: 'קר', activities: 'מוזיאונים ואטרקציות מקורות' },
          ]
        },
        practicalInfo: [
          { title: 'שפה', icon: null, info: `השפה המקומית היא ${mainDestination.lc === 'en' ? 'אנגלית' : mainDestination.lc}` },
        ],
        travelTips: [
          'מומלץ להזמין מלונות מראש, במיוחד בעונת התיירות',
        ],
        covidInfo: {
          lastUpdated: new Date().toISOString().split('T')[0],
          restrictions: 'אנא בדקו את ההנחיות העדכניות לפני הנסיעה',
          masks: 'עקבו אחר ההוראות המקומיות',
          vaccination: 'בדקו דרישות חיסונים עדכניות',
          moreInfo: 'https://www.who.int/emergencies/diseases/novel-coronavirus-2019/travel-advice'
        }
      };
    } catch (error) {
      console.error('שגיאה בהבאת מידע מה-API:', error);
      throw error;
    }
  };
  
  /**
   * פונקציה לקבלת מידע על יעד מה-API של Booking.com
   * @param {string} query - שם המיקום לחיפוש
   * @param {string} apiKey - מפתח ה-API של RapidAPI
   * @returns {object} - תשובת API מעובדת
   */
  const fetchBookingDestination = async (query, apiKey) => {
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey, // שימוש במפתח שהועבר כפרמטר
        'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
      }
    };
    
    try {
      console.log(`שולח בקשה ל-API עבור יעד: ${query}`);
      
      const response = await fetch(`https://booking-com.p.rapidapi.com/v1/hotels/locations?locale=he&name=${encodeURIComponent(query)}`, options);
      
      // בדיקה אם התגובה תקינה
      if (!response.ok) {
        throw new Error(`שגיאת API: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`התקבלו ${data.length} תוצאות עבור יעד: ${query}`);
      
      return { data };
    } catch (error) {
      console.error('שגיאה בקריאה ל-API עבור חיפוש יעד:', error);
      throw error;
    }
  };
  
  /**
   * פונקציה לקבלת מידע על מלונות לפי מזהה יעד
   * @param {string} destId - מזהה היעד מ-Booking.com
   * @param {string} apiKey - מפתח ה-API של RapidAPI
   * @returns {Array} - רשימת מלונות מעובדת
   */
  const fetchHotelsForDestination = async (destId, apiKey) => {
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey, // שימוש במפתח שהועבר כפרמטר
        'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
      }
    };
    
    // בניית פרמטרים לחיפוש מלונות
    const params = new URLSearchParams({
      dest_id: destId,
      order_by: 'popularity',
      filter_by_currency: 'USD',
      locale: 'he',
      adults_number: '2',
      room_number: '1',
      checkout_date: getDateAfterDays(3), // 3 ימים מהיום
      checkin_date: getDateAfterDays(0),  // היום
      units: 'metric',
      page_number: '0',
      include_adjacency: 'true'
    });
    
    try {
      console.log(`שולח בקשה ל-API עבור מלונות ביעד: ${destId}`);
      
      const response = await fetch(`https://booking-com.p.rapidapi.com/v1/hotels/search?${params.toString()}`, options);
      
      // בדיקה אם התגובה תקינה
      if (!response.ok) {
        console.warn(`שגיאת API בחיפוש מלונות: ${response.status} ${response.statusText}`);
        return [];
      }
      
      const data = await response.json();
      console.log(`התקבלו ${data.result ? data.result.length : 0} מלונות ביעד: ${destId}`);
      
      return data.result || [];
    } catch (error) {
      console.error('שגיאה בקריאה ל-API עבור חיפוש מלונות:', error);
      return [];
    }
  };
  
  /**
   * פונקציית עזר לקבלת תאריך עתידי במבנה YYYY-MM-DD
   * @param {number} days - מספר ימים מהיום
   * @returns {string} - תאריך בפורמט YYYY-MM-DD
   */
  const getDateAfterDays = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };
  
  /**
   * פונקציית עזר להמרת מידע המחיר של מלון למבנה של טווח מחירים
   * @param {object} hotel - אובייקט המלון מה-API
   * @returns {string} - מחרוזת המייצגת את טווח המחירים
   */
  const getPriceRangeFromHotel = (hotel) => {
    if (!hotel.price_breakdown) return '€';
    
    const price = hotel.price_breakdown.gross_price;
    if (price < 100) return '€';
    if (price < 200) return '€€';
    if (price < 300) return '€€€';
    return '€€€€';
  };
  
  export { fetchDestinationInfo, fetchBookingDestination, fetchHotelsForDestination };