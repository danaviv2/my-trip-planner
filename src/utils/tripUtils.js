// src/utils/tripUtils.js

/**
 * קבלת מידע על מיקום לפי שמו
 * @param {string} location - שם המיקום
 * @returns {object} מידע על המיקום
 */
export const getLocationData = (location) => {
    // פריז
    if (location.toLowerCase().includes('paris') || 
        location.toLowerCase().includes('פריז')) {
      return {
        breakfasts: ["Café de Flore", "Du Pain et des Idées", "Ladurée", "Angelina"],
        attractions: ["מגדל אייפל", "מוזיאון הלובר", "שאנז אליזה", "נוטרדאם"],
        lunch: ["Chez Janou", "Le Comptoir du Relais", "Le Relais de l'Entrecôte", "L'As du Fallafel"],
        afternoon: ["גני לוקסמבורג", "מונמארטר", "מוזיאון אורסיי", "קרוסל דו לובר"],
        dinner: ["L'Atelier de Joël Robuchon", "Le Jules Verne", "Septime", "Frenchie"],
        accommodations: ["מלון ריץ פריז", "פארק חיות", "הוטל קוסטס", "מלון קריון"],
        photos: ["https://via.placeholder.com/300x200?text=Paris"],
        localTips: "התחבורה הציבורית בפריז מצוינת. כדאי לרכוש כרטיסיות למטרו.",
        bestTime: "אביב (אפריל-יוני) וסתיו (ספטמבר-אוקטובר)",
        language: "צרפתית, אך אנגלית מדוברת במקומות תיירותיים",
        currency: "אירו (€)",
        festivals: [
          { name: "פסטיבל הג'אז בפריז", date: "יוני-יולי" },
          { name: "יום הבסטיליה", date: "14 ביולי" },
          { name: "נשף לבן", date: "יוני" }
        ]
      };
    }
    
    // לונדון
    else if (location.toLowerCase().includes('london') || 
             location.toLowerCase().includes('לונדון')) {
      return {
        breakfasts: ["The Breakfast Club", "Dishoom", "Granger & Co.", "Duck & Waffle"],
        attractions: ["ארמון בקינגהאם", "לונדון איי", "מוזיאון הבריטי", "טאואר ברידג'"],
        lunch: ["Borough Market", "The Wolseley", "Ottolenghi", "Sketch"],
        afternoon: ["פארק הייד", "מוזיאון ויקטוריה ואלברט", "קובנט גארדן", "גריניץ'"],
        dinner: ["The Ledbury", "Gordon Ramsay", "The Ivy", "Dinner by Heston Blumenthal"],
        accommodations: ["The Savoy", "The Ritz London", "Claridge's", "Shangri-La at The Shard"],
        photos: ["https://via.placeholder.com/300x200?text=London"],
        localTips: "כרטיס האויסטר חוסך כסף בתחבורה ציבורית. זכרו שמנהגים כמו לעמוד בצד ימין במדרגות נעות נחשבים לחשובים.",
        bestTime: "מאי עד ספטמבר",
        language: "אנגלית",
        currency: "ליש״ט (£)",
        festivals: [
          { name: "קרנבל נוטינג היל", date: "סוף אוגוסט" },
          { name: "פסטיבל תמזה", date: "ספטמבר" },
          { name: "לונדון פילם פסטיבל", date: "אוקטובר" }
        ]
      };
    }
    
    // ברצלונה
    else if (location.toLowerCase().includes('barcelona') || 
             location.toLowerCase().includes('ברצלונה')) {
      return {
        breakfasts: ["La Boqueria Market", "Café de l'Òpera", "Milk Bar & Bistro", "Chök"],
        attractions: ["סגרדה פמיליה", "פארק גואל", "לה רמבלה", "קמפ נואו"],
        lunch: ["El Quim de la Boqueria", "Tickets", "La Cova Fumada", "Bar Cañete"],
        afternoon: ["חוף ברצלונטה", "מוזיאון פיקאסו", "הרובע הגותי", "מונז'ואיק"],
        dinner: ["Disfrutar", "Enigma", "ABaC", "El Celler de Can Roca"],
        accommodations: ["W Barcelona", "Hotel Arts", "Mandarin Oriental Barcelona", "Cotton House Hotel"],
        photos: ["https://via.placeholder.com/300x200?text=Barcelona"],
        localTips: "שעות האוכל בספרד שונות - ארוחת הערב מתחילה לרוב ב-21:00 ומאוחר יותר.",
        bestTime: "אפריל עד יוני, ספטמבר עד נובמבר",
        language: "ספרדית וקטלאנית",
        currency: "אירו (€)",
        festivals: [
          { name: "פסטה מאג'ור דה לה מרסה", date: "ספטמבר" },
          { name: "פסטיבל סונאר", date: "יוני" },
          { name: "פרימברה סאונד", date: "מאי-יוני" }
        ]
      };
    }
  
    // בדיקה עבור וושינגטון
    if (location.toLowerCase().includes('washington') || 
        location.toLowerCase().includes('וושינגטון')) {
      return {
        breakfasts: ["Lincoln's Waffle Shop", "Founding Farmers", "Busboys and Poets", "Ted's Bulletin"],
        attractions: ["Smithsonian National Air and Space Museum", "National Mall", "Capitol Building", "Lincoln Memorial"],
        lunch: ["Old Ebbitt Grill", "District Commons", "Ben's Chili Bowl", "The Hamilton"],
        afternoon: ["National Gallery of Art", "Washington Monument", "Tidal Basin", "Georgetown Historic District"],
        dinner: ["Rasika", "Oyamel", "Le Diplomate", "Zaytinya"],
        accommodations: ["The Hay-Adams", "Hotel Washington", "The Willard InterContinental", "Kimpton Hotel Monaco"],
        photos: ["https://via.placeholder.com/300x200?text=Washington+DC"]
      };
    } 
    // בדיקה עבור בורדו
    else if (location.toLowerCase().includes('bordeaux') || 
             location.toLowerCase().includes('בורדו')) {
      return {
        breakfasts: ["Café Français", "Karl Pâtisserie", "Plume Bakery & Coffee", "Horace"],
        attractions: ["La Cité du Vin", "Place de la Bourse", "Cathédrale Saint-André", "Grand Théâtre de Bordeaux"],
        lunch: ["Le Bistro du Musée", "La Brasserie Bordelaise", "Le Pressoir d'Argent", "Le Gabriel"],
        afternoon: ["Musée d'Aquitaine", "Jardin Public", "Rue Sainte-Catherine", "Basilique Saint-Michel"],
        dinner: ["Le Chapon Fin", "Le Pressoir d'Argent", "La Tupina", "Le Bistrot des Vignes"],
        accommodations: ["Hôtel de Sèze", "InterContinental Bordeaux", "Yndo Hôtel", "Les Sources de Caudalie"],
        photos: ["https://via.placeholder.com/300x200?text=Bordeaux"]
      };
    }
    
    // ברירת מחדל למיקום לא מוכר
    return {
      breakfasts: ["מסעדת בוקר מקומית", "בית קפה פופולרי", "קונדיטוריה מומלצת", "מאפייה מקומית"],
      attractions: ["אתר תיירות מרכזי", "מוזיאון מקומי", "אתר היסטורי", "מרכז תרבות"],
      lunch: ["מסעדה מקומית", "ביסטרו מומלץ", "מסעדת שף", "מזנון מקומי"],
      afternoon: ["פארק עירוני", "אזור קניות", "גלריה לאמנות", "אזור בילויים"],
      dinner: ["מסעדה יוקרתית", "מסעדה מקומית", "מסעדת שף", "ביסטרו ערב"],
      accommodations: ["מלון מרכזי", "מלון בוטיק", "מלון יוקרה", "אכסניה מומלצת"],
      photos: ["https://via.placeholder.com/300x200?text=" + encodeURIComponent(location)]
    };
  };
  
  /**
   * יצירת תכנית יומית ליעד מסוים
   * @param {string} location - שם המיקום
   * @param {object} locationData - נתוני המיקום
   * @param {number} days - מספר ימים
   * @param {number} startingDay - יום התחלה
   * @param {boolean} isLastStop - האם זו תחנה אחרונה
   * @param {string} nextStop - התחנה הבאה
   * @returns {array} מערך של ימי טיול
   */
  export const createItineraryForLocation = (location, locationData, days, startingDay, isLastStop, nextStop) => {
    // יצירת תכנית יומית לפי יעד
    const itinerary = [];
    
    for (let i = 0; i < days; i++) {
      const dayNumber = startingDay + i;
      const isLastDay = i === days - 1 && !isLastStop;
      
      // יצירת סיכום מותאם למיקום ביום
      let summary = '';
      if (i === 0 && startingDay === 1) {
        summary = `הגעה ל${location} והתמקמות`;
      } else if (isLastDay && nextStop) {
        summary = `יום אחרון ב${location} ונסיעה ל${nextStop}`;
      } else if (i === 0) {
        summary = `הגעה ל${location}`;
      } else {
        summary = `יום ${i+1} ב${location}`;
      }
      
      // יצירת לוח זמנים מותאם ליום
      const dailySchedule = [];
      
      // ארוחת בוקר
      dailySchedule.push({
        timeStart: "08:00",
        timeEnd: "09:30",
        type: "breakfast",
        activity: "ארוחת בוקר",
        name: locationData.breakfasts[i % locationData.breakfasts.length],
        address: `${location}, אזור מרכזי`,
        description: "ארוחת בוקר מקומית עם מאפים טריים וקפה משובח",
        reservationNeeded: false,
        priceRange: "€€",
        openingHours: "07:00-11:00",
        travelTimeToNext: "15 דקות הליכה",
        googleMapsSearchQuery: `${locationData.breakfasts[i % locationData.breakfasts.length]} ${location}`
      });
      
      // אטרקציה בוקר
      dailySchedule.push({
        timeStart: "10:00",
        timeEnd: "12:30",
        type: "attraction",
        activity: "ביקור באתר",
        name: locationData.attractions[i % locationData.attractions.length],
        address: `${location}, אזור מרכזי`,
        description: "אתר תיירות מרכזי באזור",
        entranceFee: "כניסה חופשית או כ-15€",
        openingHours: "09:00-17:00",
        recommendedDuration: "שעתיים וחצי",
        tips: "מומלץ להגיע בשעות הבוקר המוקדמות",
        travelTimeToNext: "15 דקות הליכה",
        googleMapsSearchQuery: `${locationData.attractions[i % locationData.attractions.length]} ${location}`
      });
      
      // ארוחת צהריים
      dailySchedule.push({
        timeStart: "12:45",
        timeEnd: "14:15",
        type: "lunch",
        activity: "ארוחת צהריים",
        name: locationData.lunch[i % locationData.lunch.length],
        address: `${location}, מרכז העיר`,
        description: "מסעדה מקומית עם תפריט אזורי",
        reservationNeeded: true,
        priceRange: "€€-€€€",
        openingHours: "12:00-14:30",
        travelTimeToNext: "20 דקות הליכה",
        googleMapsSearchQuery: `${locationData.lunch[i % locationData.lunch.length]} ${location}`
      });
      
      // אטרקציה אחה"צ
      dailySchedule.push({
        timeStart: "14:45",
        timeEnd: "17:00",
        type: "attraction",
        activity: "ביקור באתר",
        name: locationData.afternoon[i % locationData.afternoon.length],
        address: `${location}, אזור מרכזי`,
        description: "אתר תרבות או היסטוריה חשוב באזור",
        entranceFee: "כ-10€",
        openingHours: "10:00-18:00",
        recommendedDuration: "שעתיים",
        tips: "כדאי להשתתף בסיור מודרך",
        travelTimeToNext: "15-20 דקות נסיעה",
        googleMapsSearchQuery: `${locationData.afternoon[i % locationData.afternoon.length]} ${location}`
      });
      
      // אם זה היום האחרון במיקום והמיקום הבא קיים, נוסיף נסיעה למיקום הבא
      if (isLastDay && nextStop) {
        dailySchedule.push({
          timeStart: "17:30",
          timeEnd: "19:00",
          type: "transport",
          activity: "נסיעה ליעד הבא",
          name: `נסיעה מ${location} ל${nextStop}`,
          description: `נסיעה ליעד הבא במסלול: ${nextStop}`,
          tips: "וודא שאספת את כל החפצים מהמלון לפני העזיבה",
          googleMapsSearchQuery: `from:${location} to:${nextStop}`
        });
        
        // נוסיף ארוחת ערב ביעד החדש
        dailySchedule.push({
          timeStart: "19:30",
          timeEnd: "21:00",
          type: "dinner",
          activity: "ארוחת ערב",
          name: `מסעדה מקומית ב${nextStop}`,
          address: `${nextStop}, אזור מרכזי`,
          description: `ארוחת ערב ראשונה ב${nextStop} לאחר ההגעה`,
          reservationNeeded: true,
          priceRange: "€€€",
          openingHours: "19:00-22:30",
          travelTimeToNext: "10 דקות נסיעה",
          googleMapsSearchQuery: `restaurant ${nextStop}`
        });
        
      } else {
        // ארוחת ערב רגילה אם זה לא יום מעבר
        dailySchedule.push({
          timeStart: "19:00",
          timeEnd: "21:00",
          type: "dinner",
          activity: "ארוחת ערב",
          name: locationData.dinner[i % locationData.dinner.length],
          address: `${location}, אזור יוקרתי`,
          description: "מסעדה איכותית עם מטבח מקומי משובח",
          reservationNeeded: true,
          priceRange: "€€€",
          openingHours: "19:00-22:30",
          travelTimeToNext: "10 דקות נסיעה",
          googleMapsSearchQuery: `${locationData.dinner[i % locationData.dinner.length]} ${location}`
        });
      }
      
      // הוספת היום לתכנית
      itinerary.push({
        day: dayNumber,
        date: `יום ${getDayName(dayNumber - 1)}`,
        location: location,
        summary: summary,
        schedule: dailySchedule,
        transportation: {
          morning: "הליכה רגלית או תחבורה מקומית",
          afternoon: "תחבורה מקומית",
          evening: isLastDay && nextStop ? `נסיעה ל${nextStop}` : "מונית או תחבורה מקומית"
        },
        accommodation: {
          name: isLastDay && nextStop ? `מלון ב${nextStop}` : locationData.accommodations[i % locationData.accommodations.length],
          address: isLastDay && nextStop ? `${nextStop}, מיקום מרכזי` : `${location}, מיקום מרכזי`,
          priceRange: "€€€",
          description: isLastDay && nextStop ? `לינה ראשונה ב${nextStop}` : "מלון איכותי במיקום מרכזי",
          bookingLink: "booking.com",
          googleMapsSearchQuery: isLastDay && nextStop ? `hotel ${nextStop}` : `${locationData.accommodations[i % locationData.accommodations.length]} ${location}`
        },
        stopIndex: startingDay === 1 ? 0 : Math.floor((startingDay - 1) / days) + 1
      });
    }
    
    return itinerary;
  };
  
  /**
   * קבלת שם היום בעברית לפי אינדקס
   * @param {number} dayIndex - מספר היום (0-6)
   * @returns {string} שם היום בעברית
   */
  export const getDayName = (dayIndex) => {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return days[dayIndex % 7];
  };
  
  /**
 * קבלת הימים של כל תחנה במסלול
 * @param {number} stopIndex - אינדקס התחנה
 * @param {array} daysPerStop - מערך ימים בכל תחנה
 * @returns {string} טווח ימים של התחנה
 */
export const getStopDays = (stopIndex, daysPerStop) => {
    let startDay = 1;
    
    // חישוב יום ההתחלה לפי התחנות הקודמות
    for (let i = 0; i < stopIndex; i++) {
      startDay += daysPerStop[i];
    }
    
    const endDay = startDay + daysPerStop[stopIndex] - 1;
    return `${startDay}-${endDay}`;
  };
  
  /**
   * פיצול מסלול לימים לפי תחנות
   * @param {array} stops - נקודות עצירה במסלול
   * @param {number} totalDays - סך הימים בטיול
   * @returns {array} מערך ימים בכל תחנה
   */
  export const distributeDaysForStops = (stops, totalDays) => {
    if (!stops || stops.length === 0) return [];
    
    const stopsCount = stops.length;
    
    // חלוקת ימים בסיסית - לפחות יום אחד בכל תחנה
    let daysPerStop = new Array(stopsCount).fill(1);
    
    // חלוקת שארית הימים
    let remainingDays = totalDays - stopsCount;
    
    if (remainingDays > 0) {
      // חלוקה לא שווה - יותר ימים בנקודת ההתחלה והיעד הסופי
      const startAndEndExtra = Math.floor(remainingDays * 0.7);
      const middleExtra = remainingDays - startAndEndExtra;
      
      // הוספת ימים לנקודת התחלה ויעד
      const extraPerMainStop = Math.floor(startAndEndExtra / 2);
      daysPerStop[0] += extraPerMainStop; // נקודת התחלה
      daysPerStop[daysPerStop.length - 1] += extraPerMainStop; // יעד סופי
      
      // הוספת ימים נותרים לתחנות ביניים
      if (stopsCount > 2 && middleExtra > 0) {
        const extraPerMiddleStop = Math.floor(middleExtra / (stopsCount - 2));
        for (let i = 1; i < stopsCount - 1; i++) {
          daysPerStop[i] += extraPerMiddleStop;
        }
      }
      
      // הוסף את הימים הנותרים לתחנה האחרונה אם יש
      const finalRemainingDays = totalDays - daysPerStop.reduce((a, b) => a + b, 0);
      if (finalRemainingDays > 0) {
        daysPerStop[daysPerStop.length - 1] += finalRemainingDays;
      }
    }
    
    return daysPerStop;
  };
  
  /**
   * יצירת תכנית טיול מלאה למסלול מתגלגל
   * @param {array} stops - נקודות עצירה במסלול
   * @param {array} daysPerStop - מספר ימים בכל תחנה
   * @returns {array} מערך של ימי טיול
   */
  export const createRoadTripItinerary = (stops, daysPerStop) => {
    if (!stops || stops.length === 0) return [];
    
    let fullItinerary = [];
    let currentDay = 1;
    
    for (let stopIndex = 0; stopIndex < stops.length; stopIndex++) {
      const location = stops[stopIndex];
      const daysHere = daysPerStop[stopIndex];
      
      // יצירת תוכן ספציפי ליעד הנוכחי
      const locationData = getLocationData(location);
      
      // נקבע אם זו התחנה האחרונה
      const isLastStop = stopIndex === stops.length - 1;
      
      // התחנה הבאה, אם קיימת
      const nextStop = !isLastStop ? stops[stopIndex + 1] : null;
      
      // יצירת תכנית ליעד נוכחי
      const stopItinerary = createItineraryForLocation(
        location, 
        locationData, 
        daysHere, 
        currentDay, 
        isLastStop, 
        nextStop
      );
      
      // הוספה למסלול המלא
      fullItinerary = [...fullItinerary, ...stopItinerary];
      
      // עדכון מספר היום הבא
      currentDay += daysHere;
    }
    
    return fullItinerary;
  };