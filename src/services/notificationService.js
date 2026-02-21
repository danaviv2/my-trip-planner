/**
 * שירות התראות והודעות
 * מנהל תזכורות, עדכונים והתראות חכמות
 */

class NotificationService {
  constructor() {
    this.notifications = [];
    this.storageKey = 'notifications';
    this.permissionGranted = false;
  }

  /**
   * בקשת הרשאות להתראות דפדפן
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('הדפדפן לא תומך בהתראות');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permissionGranted = true;
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === 'granted';
      return this.permissionGranted;
    }

    return false;
  }

  /**
   * שליחת התראת דפדפן
   */
  async sendBrowserNotification(title, options = {}) {
    if (!this.permissionGranted) {
      await this.requestPermission();
    }

    if (this.permissionGranted) {
      new Notification(title, {
        icon: '/logo192.png',
        badge: '/logo192.png',
        ...options
      });
    }
  }

  /**
   * יצירת התראה חדשה
   */
  createNotification(notification) {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };

    this.notifications.unshift(newNotification);
    this.saveNotifications();
    
    // שליחת התראת דפדפן אם מותר
    if (notification.showBrowser) {
      this.sendBrowserNotification(notification.title, {
        body: notification.message,
        tag: notification.type
      });
    }

    return newNotification;
  }

  /**
   * קבלת כל ההתראות
   */
  getNotifications() {
    const stored = localStorage.getItem(this.storageKey);
    this.notifications = stored ? JSON.parse(stored) : [];
    return this.notifications;
  }

  /**
   * סימון התראה כנקראה
   */
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
    }
  }

  /**
   * סימון הכל כנקראו
   */
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
  }

  /**
   * מחיקת התראה
   */
  deleteNotification(notificationId) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveNotifications();
  }

  /**
   * מחיקת כל ההתראות
   */
  clearAll() {
    this.notifications = [];
    localStorage.removeItem(this.storageKey);
  }

  /**
   * שמירת התראות
   */
  saveNotifications() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.notifications));
  }

  /**
   * קבלת מספר התראות שלא נקראו
   */
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * יצירת תזכורת לפעילות
   */
  createActivityReminder(activity, tripDate) {
    const reminderTime = new Date(tripDate);
    reminderTime.setHours(reminderTime.getHours() - 1); // שעה לפני

    return this.createNotification({
      type: 'reminder',
      title: '⏰ תזכורת לפעילות',
      message: `עוד שעה: ${activity}`,
      showBrowser: true,
      data: { activity, tripDate }
    });
  }

  /**
   * עדכון מזג אוויר
   */
  createWeatherAlert(location, weather) {
    let message = '';
    let type = 'info';

    if (weather.temperature > 35) {
      message = `🌡️ חום כבד ב${location}! ${weather.temperature}°C - קח מים!`;
      type = 'warning';
    } else if (weather.temperature < 5) {
      message = `❄️ קר מאוד ב${location}! ${weather.temperature}°C - התלבש חם!`;
      type = 'warning';
    } else if (weather.description?.includes('גשם')) {
      message = `☔ גשם צפוי ב${location}! קח מטריה`;
      type = 'warning';
    } else {
      message = `🌤️ מזג אוויר נעים ב${location}: ${weather.temperature}°C`;
      type = 'info';
    }

    return this.createNotification({
      type: type,
      title: 'עדכון מזג אוויר',
      message: message,
      showBrowser: type === 'warning',
      data: { location, weather }
    });
  }

  /**
   * התראת שינוי מחיר
   */
  createPriceAlert(item, oldPrice, newPrice) {
    const change = newPrice - oldPrice;
    const percentage = ((change / oldPrice) * 100).toFixed(1);
    
    const isDecrease = change < 0;
    const emoji = isDecrease ? '📉' : '📈';
    const action = isDecrease ? 'ירד' : 'עלה';

    return this.createNotification({
      type: isDecrease ? 'success' : 'info',
      title: `${emoji} שינוי מחיר!`,
      message: `המחיר של ${item} ${action} ב-${Math.abs(percentage)}% (₪${Math.abs(change)})`,
      showBrowser: isDecrease,
      data: { item, oldPrice, newPrice }
    });
  }

  /**
   * התראת טיול קרב
   */
  createUpcomingTripAlert(trip, daysUntil) {
    let emoji = '✈️';
    let message = '';

    if (daysUntil === 0) {
      emoji = '🎉';
      message = `הטיול שלך ל${trip.destination} מתחיל היום!`;
    } else if (daysUntil === 1) {
      emoji = '⏰';
      message = `הטיול שלך ל${trip.destination} מתחיל מחר!`;
    } else if (daysUntil <= 7) {
      emoji = '📅';
      message = `הטיול שלך ל${trip.destination} בעוד ${daysUntil} ימים!`;
    }

    return this.createNotification({
      type: 'info',
      title: `${emoji} טיול קרב`,
      message: message,
      showBrowser: daysUntil <= 1,
      data: { trip, daysUntil }
    });
  }

  /**
   * התראת הצעה מיוחדת
   */
  createSpecialOfferAlert(offer) {
    return this.createNotification({
      type: 'success',
      title: '🎁 הצעה מיוחדת!',
      message: offer.message,
      showBrowser: true,
      data: { offer }
    });
  }

  /**
   * התראת טיפ מועיל
   */
  createTipNotification(tip) {
    return this.createNotification({
      type: 'info',
      title: '💡 טיפ שימושי',
      message: tip,
      showBrowser: false,
      data: { tip }
    });
  }

  /**
   * בדיקה אוטומטית של התראות (להפעיל מדי כמה דקות)
   */
  checkForAlerts(tripPlan, weather, prices) {
    // בדיקת מזג אוויר
    if (weather) {
      this.createWeatherAlert(tripPlan.destination, weather);
    }

    // בדיקת שינויי מחירים
    if (prices) {
      // לוגיקה לבדיקת שינויי מחירים
    }

    // בדיקת טיולים קרובים
    if (tripPlan?.startDate) {
      const daysUntil = Math.ceil((new Date(tripPlan.startDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntil >= 0 && daysUntil <= 7) {
        this.createUpcomingTripAlert(tripPlan, daysUntil);
      }
    }
  }
}

export default new NotificationService();
