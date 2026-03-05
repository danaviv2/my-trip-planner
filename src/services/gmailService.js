import { GoogleAuthProvider, reauthenticateWithPopup, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';

const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
const GMAIL_BASE = 'https://www.googleapis.com/gmail/v1/users/me';

// שולחים מוכרים של אישורי הזמנה
const BOOKING_SENDERS = [
  'booking.com', 'airbnb.com', 'expedia.com', 'hotels.com',
  'agoda.com', 'kayak.com', 'tripadvisor.com', 'hotel.com',
  'el-al.co.il', 'elal.com', 'israir.co.il', 'arkia.co.il',
  'united.com', 'delta.com', 'aa.com', 'british-airways.com',
  'ryanair.com', 'easyjet.com', 'wizzair.com', 'vueling.com',
  'lufthansa.com', 'klm.com', 'airfrance.com', 'emirates.com',
  'avis.com', 'hertz.com', 'budget.com', 'sixt.com', 'europcar.com',
  'rentalcars.com', 'discovercars.com',
];

/** שלב 1: בקשת הרשאת Gmail מהמשתמש — מחזיר access token */
export const requestGmailAccess = async () => {
  const provider = new GoogleAuthProvider();
  provider.addScope(GMAIL_SCOPE);

  let result;
  const currentUser = auth.currentUser;
  if (currentUser) {
    result = await reauthenticateWithPopup(currentUser, provider);
  } else {
    result = await signInWithPopup(auth, provider);
  }

  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (!credential?.accessToken) throw new Error('לא התקבל access token');
  return credential.accessToken;
};

/** שלב 2: חיפוש מיילים של הזמנות ב-Gmail */
export const searchBookingEmails = async (accessToken) => {
  const senderQuery = BOOKING_SENDERS.map(s => `from:${s}`).join(' OR ');
  const query = `(${senderQuery}) subject:(confirmation OR booking OR reservation OR itinerary OR voucher OR ticket OR order)`;

  const url = `${GMAIL_BASE}/messages?q=${encodeURIComponent(query)}&maxResults=30`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 401) throw new Error('TOKEN_EXPIRED');
  if (!res.ok) throw new Error(`Gmail API error: ${res.status}`);

  const data = await res.json();
  return data.messages || [];
};

/** שלב 3: שליפת תוכן מייל ספציפי */
export const getEmailContent = async (accessToken, messageId) => {
  const url = `${GMAIL_BASE}/messages/${messageId}?format=full`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Gmail message error: ${res.status}`);
  return res.json();
};

/** חילוץ טקסט מ-payload של Gmail */
export const extractEmailText = (message) => {
  const decodeBase64 = (data) => {
    try {
      return decodeURIComponent(
        atob(data.replace(/-/g, '+').replace(/_/g, '/'))
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch {
      return atob(data.replace(/-/g, '+').replace(/_/g, '/'));
    }
  };

  const extractFromPart = (part) => {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      return decodeBase64(part.body.data);
    }
    if (part.mimeType === 'text/html' && part.body?.data) {
      const html = decodeBase64(part.body.data);
      return html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim()
        .slice(0, 4000);
    }
    if (part.parts) {
      for (const sub of part.parts) {
        const text = extractFromPart(sub);
        if (text) return text;
      }
    }
    return '';
  };

  const subject = message.payload?.headers?.find(h => h.name === 'Subject')?.value || '';
  const from = message.payload?.headers?.find(h => h.name === 'From')?.value || '';
  const date = message.payload?.headers?.find(h => h.name === 'Date')?.value || '';
  const body = extractFromPart(message.payload || {});

  return { subject, from, date, body };
};
