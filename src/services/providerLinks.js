/**
 * קישורים לספקי הזמנות אמיתיים.
 *
 * המסך הקודם הציג טופס תשלום מלא, אסף מספר כרטיס אשראי ו-CVV, ובסיום
 * הודיע "ההזמנה שלך התקבלה בהצלחה" — בעוד שלא נשלחה שום בקשה לשום מקום.
 * משתמש היה יכול להגיע לשדה התעופה בלי כרטיס.
 *
 * במקום להעמיד פנים, כאן נבנית ההפניה לספק שבאמת מבצע את ההזמנה. פרטי
 * התשלום נמסרים לו ישירות ואינם עוברים דרכנו כלל — מה שגם נכון מבחינת
 * המשתמש וגם מסיר מאיתנו אחריות לנתוני אשראי.
 */

const fmt = (d) => {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

const enc = encodeURIComponent;

/**
 * @param {object} q
 * @param {string} q.destination יעד
 * @param {string} q.origin מוצא (לטיסות)
 * @param {Date|string} q.startDate
 * @param {Date|string} q.endDate
 * @param {number} q.adults
 * @param {number} q.children
 * @returns {Array<{id,name,note,url}>}
 */
export const providerLinks = (type, q = {}) => {
  const dest = (q.destination || '').trim();
  const origin = (q.origin || 'TLV').trim();
  const from = fmt(q.startDate);
  const to = fmt(q.endDate);
  const adults = Number(q.adults) || 1;
  const children = Number(q.children) || 0;

  if (!dest) return [];

  if (type === 'flight') {
    // Google Flights מקבל שאילתה בשפה חופשית ומתרגם אותה למסלול
    const parts = [`Flights to ${dest} from ${origin}`];
    if (from) parts.push(`on ${from}`);
    if (to) parts.push(`through ${to}`);
    return [
      {
        id: 'google-flights',
        name: 'Google Flights',
        note: 'משווה בין חברות התעופה ומראה את טווח המחירים לאורך החודש',
        url: `https://www.google.com/travel/flights?q=${enc(parts.join(' '))}`,
      },
      {
        id: 'skyscanner',
        name: 'Skyscanner',
        note: 'שימושי כשהתאריכים גמישים',
        url: `https://www.skyscanner.co.il/transport/flights/${enc(origin.toLowerCase())}/${enc(dest.toLowerCase())}/${from.replace(/-/g, '').slice(2)}/${to.replace(/-/g, '').slice(2)}/`,
      },
    ];
  }

  if (type === 'hotel') {
    const bk = new URLSearchParams({ ss: dest, group_adults: String(adults), group_children: String(children) });
    if (from) bk.set('checkin', from);
    if (to) bk.set('checkout', to);
    return [
      {
        id: 'booking',
        name: 'Booking.com',
        note: 'הזמנות רבות ניתנות לביטול חינם עד יום לפני',
        url: `https://www.booking.com/searchresults.html?${bk.toString()}`,
      },
      {
        id: 'airbnb',
        name: 'Airbnb',
        note: 'דירות שלמות, לרוב משתלם יותר לשהייה ארוכה',
        url: `https://www.airbnb.com/s/${enc(dest)}/homes?checkin=${from}&checkout=${to}&adults=${adults}&children=${children}`,
      },
    ];
  }

  if (type === 'car') {
    return [
      {
        id: 'kayak-cars',
        name: 'Kayak',
        note: 'משווה בין חברות ההשכרה במקום אחד',
        url: `https://www.kayak.com/cars/${enc(dest)}/${from}/${to}`,
      },
      {
        id: 'discover-cars',
        name: 'Discover Cars',
        note: 'מציג את תנאי הביטוח והפיקדון לפני ההזמנה',
        url: `https://www.discovercars.com/search?country=&pickup=${enc(dest)}&date_from=${from}&date_to=${to}`,
      },
    ];
  }

  // סיורים ואטרקציות
  return [
    {
      id: 'getyourguide',
      name: 'GetYourGuide',
      note: 'ביטול חינם עד 24 שעות ברוב הפעילויות',
      url: `https://www.getyourguide.com/s/?q=${enc(dest)}${from ? `&date_from=${from}` : ''}`,
    },
    {
      id: 'viator',
      name: 'Viator',
      note: 'מגוון רחב של סיורים מודרכים בעברית ובאנגלית',
      url: `https://www.viator.com/searchResults/all?text=${enc(dest)}`,
    },
  ];
};
