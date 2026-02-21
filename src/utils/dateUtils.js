// src/utils/dateUtils.js

/**
 * המרת אינדקס יום בשבוע לשם היום בעברית
 * @param {number} dayIndex - מספר היום (0-6)
 * @returns {string} שם היום בעברית
 */
export const getDayName = (dayIndex) => {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return days[dayIndex % 7];
  };
  
  /**
   * המרת תאריך לפורמט מקומי בעברית
   * @param {string|Date} date - תאריך לפורמט
   * @returns {string} תאריך מפורמט
   */
  export const formatDate = (date) => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  /**
   * חישוב הפרש בימים בין שני תאריכים
   * @param {string|Date} startDate - תאריך התחלה
   * @param {string|Date} endDate - תאריך סיום
   * @returns {number} מספר הימים בין התאריכים
   */
  export const daysBetween = (startDate, endDate) => {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    // הסרת שעות, דקות, שניות ומילישניות
    const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    
    // חישוב ההפרש בימים
    return Math.floor((endUtc - startUtc) / (1000 * 60 * 60 * 24));
  };
  
  /**
   * מוסיף ימים לתאריך
   * @param {string|Date} date - תאריך התחלתי
   * @param {number} days - מספר ימים להוסיף
   * @returns {Date} תאריך חדש
   */
  export const addDays = (date, days) => {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
    dateObj.setDate(dateObj.getDate() + days);
    return dateObj;
  };
  
  /**
   * מחזיר תאריך בפורמט ISO לשימוש בשדות input
   * @param {string|Date} date - תאריך
   * @returns {string} תאריך בפורמט ISO (YYYY-MM-DD)
   */
  export const formatDateForInput = (date) => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString().split('T')[0];
  };
  
  /**
   * בדיקה האם תאריך הוא חג או שבת בישראל
   * הפונקציה הזו היא פשוטה ובודקת רק שבתות
   * @param {string|Date} date - תאריך לבדיקה
   * @returns {boolean} האם התאריך הוא חג או שבת
   */
  export const isHolidayOrShabbat = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // בדיקה האם זה יום שבת (קוד 6)
    return dateObj.getDay() === 6;
    
    // הערה: בגרסה מלאה, צריך להוסיף בדיקה של חגים יהודיים
  };