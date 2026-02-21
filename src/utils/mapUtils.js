// src/utils/mapUtils.js

/**
 * יצירת אייקון SVG מותאם אישית לסמן במפה
 * @param {string} iconName - שם האייקון במערכת Material Icons
 * @param {string} backgroundColor - צבע רקע לאייקון
 * @returns {string} URL של תמונת SVG
 */
export const createCustomMarkerIcon = (iconName, backgroundColor) => {
    try {
      // יצירת צבע רקע עם שקיפות קלה
      const bgColor = backgroundColor + "B3"; // 70% אטימות
      
      // יצירת SVG עם האייקון המבוקש
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40">
          <circle cx="12" cy="12" r="12" fill="${bgColor}"/>
          <text x="12" y="16" font-family="Material Icons" font-size="16" fill="white" text-anchor="middle">${iconName}</text>
        </svg>
      `;
      
      // המרת SVG לdata URL
      const svgBase64 = btoa(unescape(encodeURIComponent(svg)));
      return `data:image/svg+xml;base64,${svgBase64}`;
    } catch (error) {
      console.error('שגיאה ביצירת אייקון:', error);
      // החזר אייקון ברירת מחדל במקרה של שגיאה
      return 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
    }
  };
  
  /**
   * חישוב מרחק בין שתי נקודות גיאוגרפיות בקילומטרים
   * @param {number} lat1 - קו רוחב של נקודה 1
   * @param {number} lon1 - קו אורך של נקודה 1
   * @param {number} lat2 - קו רוחב של נקודה 2
   * @param {number} lon2 - קו אורך של נקודה 2
   * @returns {number} מרחק בקילומטרים
   */
  export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // רדיוס כדור הארץ בקילומטרים
    const dLat = degToRad(lat2 - lat1);
    const dLon = degToRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(degToRad(lat1)) * Math.cos(degToRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  /**
   * המרת מעלות לרדיאנים
   * @param {number} deg - מעלות
   * @returns {number} רדיאנים
   */
  const degToRad = (deg) => {
    return deg * (Math.PI/180);
  };
  
  /**
   * המרת מרחק במטרים לפורמט מתאים
   * @param {number} meters - מרחק במטרים
   * @returns {string} מרחק מפורמט
   */
  export const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${meters.toFixed(0)} מ'`;
    } else {
      const km = meters / 1000;
      return `${km.toFixed(1)} ק"מ`;
    }
  };
  
  /**
   * המרת זמן בשניות לפורמט מתאים
   * @param {number} seconds - זמן בשניות
   * @returns {string} זמן מפורמט
   */
  export const formatDuration = (seconds) => {
    if (seconds < 60) {
      return `${seconds} שניות`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)} דקות`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours} שעות ${minutes} דקות`;
    }
  };
  
  /**
   * פונקציה לצביעת מסלול לפי תחנות
   * @param {object} directionsResult - תוצאות המסלול מ-Google Maps
   * @param {array} daysPerStop - מערך של מספר ימים בכל תחנה
   * @param {object} mapRef - הפניה לאובייקט המפה
   */
  export const colorRouteByDays = (directionsResult, daysPerStop, mapRef) => {
    if (!directionsResult || !directionsResult.routes || directionsResult.routes.length === 0 || !mapRef.current) {
      console.warn('אין אפשרות לצבוע מסלול - חסרים נתוני מסלול');
      return;
    }
    
    // ניקוי סמנים קודמים
    if (window.currentRouteRenderers) {
      window.currentRouteRenderers.forEach(renderer => renderer.setMap(null));
    }
    
    window.currentRouteRenderers = [];
    
    // מערך צבעים לסגמנטים
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000'];
    
    // המסלול והרגליים שלו
    const route = directionsResult.routes[0];
    const legs = route.legs;
    
    // הצג כל קטע מסלול בנפרד בצבע אחר
    legs.forEach((leg, index) => {
      const color = colors[index % colors.length];
      const renderer = new window.google.maps.DirectionsRenderer({
        map: mapRef.current,
        directions: directionsResult,
        routeIndex: 0,
        legIndex: index,
        polylineOptions: {
          strokeColor: color,
          strokeWeight: 5,
          strokeOpacity: 0.7
        },
        suppressMarkers: true,
        preserveViewport: true
      });
      
      // שמירת ה-renderer לניקוי עתידי
      window.currentRouteRenderers.push(renderer);
    });
  };