/**
 * יצירת קישורי הזמנה לשירותי נסיעה
 */

export const bookingLinks = {
  
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
    return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(location)}&checkin=${checkInDate}&checkout=${checkOutDate}&group_adults=${guests}`;
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
