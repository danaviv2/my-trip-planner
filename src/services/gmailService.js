/**
 * קריאת אישורי הזמנה מתיבת ה-Gmail של המשתמש.
 *
 * הרשאה: gmail.readonly בלבד — קריאה, בלי אפשרות לשלוח, לסמן או למחוק.
 * שום תוכן מייל אינו נשמר; רק פרטי ההזמנה שחולצו ממנו.
 */

const API = 'https://gmail.googleapis.com/gmail/v1/users/me';

/**
 * שאילתת חיפוש ממוקדת. רחבה מספיק כדי לתפוס ספקים שונים, צרה מספיק
 * כדי לא לשלוף את כל התיבה ולבזבז קריאות ל-AI.
 */
const buildQuery = (monthsBack = 12) => {
  const senders = [
    'elal.co.il', 'israir.co.il', 'arkia.co.il',
    'booking.com', 'expedia.com', 'hotels.com', 'agoda.com', 'airbnb.com',
    'avis.com', 'hertz.com', 'sixt.com', 'europcar.com', 'budget.com',
    'ryanair.com', 'easyjet.com', 'wizzair.com', 'lufthansa.com',
    'britishairways.com', 'turkishairlines.com', 'aegeanair.com',
  ];
  const subjects = [
    'confirmation', 'booking', 'reservation', 'itinerary', 'e-ticket', 'eticket',
    'אישור הזמנה', 'אישור טיסה', 'כרטיס טיסה', 'אישור הזמנת',
  ];

  const from = senders.map((s) => `from:${s}`).join(' OR ');
  const subj = subjects.map((s) => `subject:"${s}"`).join(' OR ');

  return `((${from}) OR (${subj})) newer_than:${monthsBack}m -in:spam -in:trash`;
};

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const request = async (url, token) => {
  const res = await fetch(url, { headers: authHeaders(token) });
  if (res.status === 401) throw new Error('GMAIL_TOKEN_EXPIRED');
  if (res.status === 403) throw new Error('GMAIL_FORBIDDEN');
  if (!res.ok) throw new Error(`GMAIL_ERROR_${res.status}`);
  return res.json();
};

/** Gmail מקודד ב-base64url; מפענח גם תווים עבריים כראוי. */
const decodeBody = (data) => {
  if (!data) return '';
  try {
    const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return '';
  }
};

/** עובר על עץ ה-MIME ומחלץ את גוף הטקסט. מעדיף text/plain על HTML. */
const extractText = (payload) => {
  if (!payload) return '';

  const collect = (part, acc) => {
    if (!part) return;
    const mime = part.mimeType || '';
    if (mime === 'text/plain' && part.body?.data) {
      acc.plain.push(decodeBody(part.body.data));
    } else if (mime === 'text/html' && part.body?.data) {
      acc.html.push(decodeBody(part.body.data));
    }
    (part.parts || []).forEach((p) => collect(p, acc));
  };

  const acc = { plain: [], html: [] };
  collect(payload, acc);

  if (acc.plain.length) return acc.plain.join('\n');

  // נפילה ל-HTML: מפשיטים תגיות כדי שה-parser יקבל טקסט נקי
  return acc.html
    .join('\n')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const headerValue = (headers, name) =>
  (headers || []).find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

/**
 * מאתר אישורי הזמנה ומחזיר את תוכנם כטקסט, מוכן לפענוח.
 *
 * @param {string} token טוקן גישה מ-connectGmail
 * @param {object} opts
 * @param {number} opts.maxResults מספר מיילים מרבי (ברירת מחדל 25)
 * @param {number} opts.monthsBack כמה חודשים אחורה (ברירת מחדל 12)
 * @returns {Promise<Array<{id,subject,from,date,text}>>}
 */
export const fetchBookingEmails = async (token, { maxResults = 25, monthsBack = 12 } = {}) => {
  if (!token) throw new Error('NO_GMAIL_TOKEN');

  const q = encodeURIComponent(buildQuery(monthsBack));
  const list = await request(`${API}/messages?q=${q}&maxResults=${maxResults}`, token);

  const ids = (list.messages || []).map((m) => m.id);
  if (!ids.length) return [];

  // שליפה מקבילה אך מוגבלת, כדי לא להיחסם על קצב בקשות
  const results = [];
  const BATCH = 5;
  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = ids.slice(i, i + BATCH);
    const msgs = await Promise.all(
      batch.map((id) =>
        request(`${API}/messages/${id}?format=full`, token).catch(() => null)
      )
    );
    msgs.filter(Boolean).forEach((msg) => {
      const headers = msg.payload?.headers;
      const text = extractText(msg.payload);
      if (!text) return;
      results.push({
        id: msg.id,
        subject: headerValue(headers, 'Subject'),
        from: headerValue(headers, 'From'),
        date: headerValue(headers, 'Date'),
        // חיתוך: הפרסר ממילא קורא רק את ההתחלה, ומייל שיווקי ארוך מבזבז טוקנים
        text: text.slice(0, 6000),
      });
    });
  }

  return results;
};

/** בדיקה מהירה שהטוקן עדיין תקף, בלי לשלוף מיילים. */
export const verifyGmailToken = async (token) => {
  try {
    await request(`${API}/profile`, token);
    return true;
  } catch {
    return false;
  }
};
