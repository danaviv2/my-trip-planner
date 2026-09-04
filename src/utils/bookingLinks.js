/**
 * יצירת קישורי הזמנה לשירותי נסיעה
 */

/**
 * הבסיס לחיפוש ב-Booking. **הנתיב היחיד שעובד.**
 *
 * ב-04.09.2026 דיווח משתמש ש-Booking מציג "העמוד לא נמצא" מכל מקום
 * באפליקציה. נמדד מול השרת עצמו:
 *
 *   searchresults.html      202  ✅
 *   searchresults.he.html   202  ✅  (וגם ממשק בעברית)
 *   search.he.html          404  ❌
 *   search.html             404  ❌
 *
 * שתי הצורות השבורות הופיעו בשמונה מקומות, בעוד הנכונה כבר הייתה כתובה
 * כאן וב-`providerLinks`. אותה עובדה חושבה בעשרה מקומות ונפרדה לשלוש
 * גרסאות — ולכן היא יושבת מעכשיו כאן בלבד.
 */
const BOOKING_SEARCH = 'https://www.booking.com/searchresults.he.html';

export const bookingLinks = {

  /**
   * חיפוש חופשי ב-Booking לפי שם או כתובת.
   *
   * ה-`trim` אינו קוסמטי: הקוראים בונים את הביטוי כ-`${name} ${address}`,
   * ושדה ריק הותיר רווח מוביל שהגיע ל-URL כ-`%20` ופגע בתוצאות.
   */
  hotelSearch: (query) => {
    const q = String(query || '').trim().replace(/\s+/g, ' ');
    return `${BOOKING_SEARCH}?ss=${encodeURIComponent(q)}`;
  },

  /**
   * קישור להזמנת טיסה ב-Booking.com
   */
  flight: (origin, destination, date) => {
    const formattedDate = date ? new Date(date).toISOString().split('T')[0] : '';
    return `https://www.booking.com/flights/index.html?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}&depart=${formattedDate}`;
  },

  /**
   * קישור להזמנת מלון ב-Booking.com
   */
  hotel: (location, checkIn, checkOut, guests = 2) => {
    const checkInDate = checkIn ? new Date(checkIn).toISOString().split('T')[0] : '';
    const checkOutDate = checkOut ? new Date(checkOut).toISOString().split('T')[0] : '';
    return `${BOOKING_SEARCH}?ss=${encodeURIComponent(String(location || '').trim())}`
      + `&checkin=${checkInDate}&checkout=${checkOutDate}&group_adults=${guests}`;
  },

  /**
   * קישור להשכרת רכב ב-Rentalcars.com
   */
  car: (location, pickupDate, returnDate) => {
    const pickup = pickupDate ? new Date(pickupDate).toISOString().split('T')[0] : '';
    const returnD = returnDate ? new Date(returnDate).toISOString().split('T')[0] : '';
    return `https://www.rentalcars.com/SearchResults.do?driversAge=30&dropCity=${encodeURIComponent(location)}&pickupDate=${pickup}&returnDate=${returnD}`;
  },

  /**
   * קישור למסעדה (Google Maps / TripAdvisor)
   */
  restaurant: (name, location) => {
    return `https://www.google.com/maps/search/${encodeURIComponent(name + ' ' + location)}`;
  },

  /**
   * קישור לאטרקציה (GetYourGuide)
   */
  attraction: (name, location) => {
    return `https://www.getyourguide.com/s/?q=${encodeURIComponent(name + ' ' + location)}`;
  }
};

export default bookingLinks;
