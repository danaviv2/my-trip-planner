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
  // חיפוש לפי דומיין השולח בלבד הציף את התוצאות בדיוור שיווקי: ספקי
  // נסיעות שולחים פרסומות מתת-דומיינים ייעודיים (e.avis.com,
  // ma.elalmatmid.com) ואלה דחקו את האישורים האמיתיים.
  // לכן: דורשים מילת אישור בנושא, ומסננים את קטגוריית הפרסומות של Gmail.
  // הרשימה נגזרה מאישורים אמיתיים בתיבה. ניסוח צר מדי החמיץ שלושה
  // מתוך ארבעה: "Electronic ticket receipt" (ולא e-ticket),
  // "ההזמנה שלך באתר..." ו"ההזמנה שלכם ב..." (ולא "הזמנתך").
  const subjects = [
    // אנגלית
    'confirmation', 'confirmed', 'reservation', 'itinerary',
    'e-ticket', 'eticket', 'ticket receipt', 'electronic ticket',
    'boarding pass', 'booking reference', 'booking is',
    'your booking', 'your trip', 'your flight', 'your reservation',
    'your stay', 'your car rental', 'your hotel',
    // עברית — כולל צורות רבים וגוף שני שנפוצות בפועל
    'אישור הזמנה', 'אישור הזמנת', 'אישור טיסה', 'אישור רכישה',
    'ההזמנה שלך', 'ההזמנה שלכם', 'הזמנה שלך', 'הזמנתך', 'הזמנתכם',
    'מספר אישור', 'מספר הזמנה', 'כרטיס טיסה', 'פרטי הטיסה',
    'קבלה על', 'שוברי הזמנה',
    // ביטוח נסיעות ואטרקציות לא נסרקו כלל עד כה, ולכן פוליסה או כרטיס
    // לאתר מעולם לא נקלטו — גם כשהאישור היה בתיבה.
    // הניסוחים נגזרו מהתיבה עצמה ולא מהשערה. המבטח כותב "סיכום פרטי
    // פוליסה" ו"מסמכי ביטוח" — ואף אחד מהם אינו מכיל את הצירוף "פוליסת
    // ביטוח" או "ביטוח נסיעות", ולכן אף פוליסה לא נשלפה מעולם.
    'ביטוח נסיעות', 'פוליסת ביטוח', 'אישור ביטוח', 'travel insurance',
    'insurance policy', 'policy number',
    'פרטי פוליסה', 'מסמכי ביטוח', 'פוליסה מס', 'כתב שירות',
    'פספורטכארד', 'passportcard',
    // הניסוחים כאן נגזרו מאישורים אמיתיים בתיבה ולא מהשערה. ספקי
    // כרטיסים כותבים "ההזמנה אושרה" ו"הוראות לכרטיס", לא "אישור הזמנה",
    // ופונים בגוף שני רבים — ולכן אף אחד מהם לא נתפס קודם.
    'ההזמנה אושרה', 'הזמנה אושרה', 'ההזמנה שלכם אושרה',
    'הוראות לכרטיס', 'הכרטיסים שלכם', 'הכרטיסים שלך', 'הכרטיס שלך',
    'שובר כניסה', 'אישור כניסה', 'הכרטיסים מוכנים',
    'your tickets', 'your ticket', 'admission', 'skip the line',
    'booking confirmed', 'is confirmed', 'ticket instructions',
  ];

  const subj = subjects.map((s) => `subject:"${s}"`).join(' OR ');

  return [
    `(${subj})`,
    `newer_than:${monthsBack}m`,
    '-in:spam',
    '-in:trash',
    // הסינון המשמעותי ביותר: Gmail כבר מסווג דיוור שיווקי
    '-category:promotions',
    '-subject:unsubscribe',
    '-subject:"פרסומת"',
    '-subject:newsletter',
    // תכתובת שירות לקוחות מצטטת מספר הזמנה ותאריך, ולכן עוברת את
    // הסינון המקדים ומגיעה לפענוח — ושם היא עלולה להיקלט כהזמנה חדשה.
    // "Re: Booking reference — Customer query" יצר נסיעה שלמה מפנייה.
    '-subject:"customer query"',
    '-subject:"customer service"',
    '-subject:"פנייתך"',
  ].join(' ');
};

/**
 * האם יש בטקסט תאריך כלשהו.
 *
 * אישורים בעברית כותבים את התאריך במילים — "מצפים לכם ביום ד', 24 ביוני" —
 * ובלי זיהוי שמות החודשים בעברית הם נזרקו לפני שהגיעו לפענוח כלל.
 */
const containsDate = (text) =>
  /\b\d{1,2}[/.\-]\d{1,2}[/.\-]\d{2,4}\b/.test(text) ||
  /\b\d{4}-\d{2}-\d{2}\b/.test(text) ||
  /\b\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(text) ||
  /\d{1,2}\s+ב?(ינואר|פברואר|מרץ|מרס|אפריל|מאי|יוני|יולי|אוגוסט|ספטמבר|אוקטובר|נובמבר|דצמבר)/.test(text) ||
  /(ינואר|פברואר|מרץ|מרס|אפריל|מאי|יוני|יולי|אוגוסט|ספטמבר|אוקטובר|נובמבר|דצמבר)\s+\d{4}/.test(text);

/**
 * סינון זול לפני הקריאה ל-AI. אישור הזמנה אמיתי מכיל כמעט תמיד תאריך
 * ומספר אישור או מספר טיסה. מייל שאין בו אף אחד מהם כמעט בוודאות אינו
 * אישור, ואין טעם לשלם עליו קריאה למודל.
 */
const looksLikeBooking = (text) => {
  if (!text || text.length < 120) return false;

  // אישורים בעברית כותבים את התאריך במילים — "מצפים לכם ביום ד', 24 ביוני" —
  // ובלי זיהוי שמות החודשים בעברית הם נזרקו לפני שהגיעו לפענוח כלל.
  // זו הייתה נקודה עיוורת מול כל ספק שכותב בעברית ולא רק מול אחד.
  const hasDate = containsDate(text);

  const hasReference =
    /\b[A-Z0-9]{6,}\b/.test(text) ||                      // PNR או מספר אישור ארוך
    /\b\d{6,}\b/.test(text) ||                            // מספר הזמנה מספרי
    /\b[A-Z]{2}\s?\d{2,4}\b/.test(text) ||                // מספר טיסה
    /(confirmation|confirmed|booking|reservation|reference|pnr)/i.test(text) ||
    /(אישור הזמנה|מספר הזמנה|הזמנה מספר|קוד הזמנה|מספר אישור|אישור טיסה|מספר כרטיס)/.test(text);

  return hasDate && hasReference;
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

/** מפשיט תגיות HTML כדי שה-parser יקבל טקסט קריא. */
const stripHtml = (html) =>
  html
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

/**
 * מחלץ את גוף המייל מעץ ה-MIME.
 *
 * העדפה עיוורת ל-text/plain הפילה שורה של אישורים אמיתיים: שולחים רבים
 * מצרפים חלק plain שהוא הודעה ריקה מתוכן ("אם אינך רואה מייל זה, פתח
 * בדפדפן"), וכל האישור — התאריכים ומספר ההזמנה — יושב ב-HTML. הגוף
 * שנבחר היה באורך חמישים תווים ונדחה עוד לפני הפענוח.
 *
 * לכן plain נבחר רק כשהוא באמת נושא תוכן; אחרת נלקח הגדול מבין השניים.
 */
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

  const plain = acc.plain.join('\n').trim();
  const html = acc.html.length ? stripHtml(acc.html.join('\n')) : '';

  // חלק plain שיש בו תאריך הוא כמעט תמיד האישור עצמו, והוא נקי יותר
  // מ-HTML מופשט. חלק בלי תאריך הוא כמעט תמיד הודעת "פתח בדפדפן".
  if (plain.length >= 200 && containsDate(plain)) return plain;
  return html.length > plain.length ? html : plain;
};

const headerValue = (headers, name) =>
  (headers || []).find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

// מעל זה לא שולחים למודל: אישור הזמנה שוקל עשרות קילובייטים, קובץ כבד
// יותר הוא כמעט תמיד חוברת שיווקית או קטלוג.
const MAX_PDF_BYTES = 5 * 1024 * 1024;

/** אוסף קבצי PDF מצורפים מעץ ה-MIME. */
const collectPdfAttachments = (payload) => {
  const found = [];
  const walk = (part) => {
    if (!part) return;
    const isPdf =
      part.mimeType === 'application/pdf' ||
      /\.pdf$/i.test(part.filename || '');
    if (isPdf && part.body?.attachmentId && (part.body.size || 0) <= MAX_PDF_BYTES) {
      found.push({
        filename: part.filename || 'attachment.pdf',
        attachmentId: part.body.attachmentId,
        size: part.body.size || 0,
      });
    }
    (part.parts || []).forEach(walk);
  };
  walk(payload);
  return found;
};

/**
 * שולף קובץ מצורף ומחזיר אותו כ-base64 תקני.
 * Gmail מחזיר base64url; Gemini מצפה ל-base64 רגיל.
 */
export const fetchAttachment = async (token, messageId, attachmentId) => {
  const data = await request(
    `${API}/messages/${messageId}/attachments/${attachmentId}`,
    token
  );
  if (!data?.data) return null;
  return data.data.replace(/-/g, '+').replace(/_/g, '/');
};

/**
 * מאתר אישורי הזמנה ומחזיר את תוכנם כטקסט, מוכן לפענוח.
 *
 * @param {string} token טוקן גישה מ-connectGmail
 * @param {object} opts
 * @param {number} opts.maxResults מספר מיילים מרבי (ברירת מחדל 60)
 * @param {number} opts.monthsBack כמה חודשים אחורה (ברירת מחדל 12)
 * @returns {Promise<Array<{id,subject,from,date,text}>>}
 */
export const fetchBookingEmails = async (token, { maxResults = 60, monthsBack = 12 } = {}) => {
  if (!token) throw new Error('NO_GMAIL_TOKEN');

  const q = encodeURIComponent(buildQuery(monthsBack));
  const list = await request(`${API}/messages?q=${q}&maxResults=${maxResults}`, token);

  const ids = (list.messages || []).map((m) => m.id);
  if (!ids.length) {
    const empty = [];
    empty.skipped = [];
    return empty;
  }

  // שליפה מקבילה אך מוגבלת, כדי לא להיחסם על קצב בקשות
  const results = [];
  // מיילים שגוגל החזירה ואנחנו סיננו. בלי רישום שלהם, אישור שלא נקלט
  // נראה כאילו מעולם לא הגיע, ואי אפשר להבחין בין שאילתה שהחמיצה
  // אותו לבין מסנן שדחה אותו.
  const skipped = [];
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
      const pdfs = collectPdfAttachments(msg.payload);

      // מייל שכל פרטיו בקובץ מצורף עשוי להיות דל בגוף. אם יש PDF —
      // נותנים לו לעבור גם אם הסינון על הטקסט לא השתכנע.
      const note = (reason) =>
        skipped.push({
          subject: headerValue(headers, 'Subject'),
          from: headerValue(headers, 'From'),
          reason,
        });

      if (!text && !pdfs.length) return note('אין טקסט ואין קובץ מצורף');
      if (!pdfs.length && !looksLikeBooking(text)) return note('לא זוהו תאריך ומספר אישור בגוף המייל');

      results.push({
        id: msg.id,
        subject: headerValue(headers, 'Subject'),
        from: headerValue(headers, 'From'),
        date: headerValue(headers, 'Date'),
        // חיתוך: הפרסר ממילא קורא רק את ההתחלה, ומייל שיווקי ארוך מבזבז טוקנים
        text: (text || '').slice(0, 6000),
        pdfs,
      });
    });
  }

  // מוצמד למערך ולא מוחזר כאובייקט עוטף, כדי לא לשבור קוראים קיימים
  results.skipped = skipped;
  results.matched = ids.length;
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
