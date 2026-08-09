import { fetchBookingEmails, fetchAttachment } from './gmailService';
import { parseTravelDocument, parseTravelDocumentFromPdf } from './bookingParserService';

/**
 * סריקת תיבת הדואר ופענוח האישורים שנמצאו.
 *
 * מוגדר כשירות ולא בתוך המסך, כי אותו מהלך רץ בשני הקשרים: סריקה יזומה
 * מהחלונית, וסריקה שקטה שמתרחשת מעצמה בפתיחת האפליקציה. שכפול הלוגיקה
 * היה מוביל לכך שתיקון בפענוח חל רק על אחד מהם.
 *
 * ההרשאה היא קריאה בלבד, ותוכן המיילים אינו נשמר — רק פרטי ההזמנה.
 */

/** ממיר תוצאת פענוח לרשומות הזמנה שהמאגר מכיר. */
const toBookings = (result) => [
  ...result.flights.map((f) => ({ ...f, type: 'flight', direction: f.type })),
  ...(result.carRental ? [{ ...result.carRental, type: 'car_rental' }] : []),
  ...(result.hotel ? [{ ...result.hotel, type: 'hotel' }] : []),
];

/**
 * @param {string} token טוקן גישה ל-Gmail
 * @param {object} opts
 * @param {number} opts.maxResults מספר מיילים מרבי
 * @param {number} opts.monthsBack כמה חודשים אחורה לסרוק
 * @param {number} opts.maxPdfsPerEmail כמה קבצים מצורפים לנסות לכל מייל
 * @param {(msg:string, i:number, total:number)=>void} opts.onProgress
 * @returns {Promise<{emails:Array, bookings:Array, parsed:number, fromPdf:number}>}
 */
export const scanMailbox = async (
  token,
  { maxResults = 60, monthsBack = 12, maxPdfsPerEmail = 2, onProgress = () => {} } = {}
) => {
  onProgress('מחפש אישורי הזמנה בתיבה...', 0, 0);
  const emails = await fetchBookingEmails(token, { maxResults, monthsBack });

  const bookings = [];
  const unrecognized = [];
  let parsed = 0;
  let fromPdf = 0;

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    onProgress(`מפענח ${i + 1} מתוך ${emails.length}...`, i + 1, emails.length);

    let gotSomething = false;

    // קודם גוף המייל — זול ומהיר יותר
    try {
      if (email.text) {
        const result = await parseTravelDocument(email.text);
        if (result.isBooking) {
          bookings.push(...toBookings(result));
          gotSomething = true;
        }
      }
    } catch {
      // מייל בודד שנכשל אינו מפיל את הסריקה כולה
    }

    // ספקים רבים שמים את הפרטים רק בקובץ המצורף. ניגשים אליו כשגוף
    // המייל לא הניב דבר, כדי לא לשלם על פענוח כפול.
    if (!gotSomething && email.pdfs?.length) {
      for (const pdf of email.pdfs.slice(0, maxPdfsPerEmail)) {
        try {
          onProgress(`קורא קובץ מצורף (${i + 1}/${emails.length})...`, i + 1, emails.length);
          const base64 = await fetchAttachment(token, email.id, pdf.attachmentId);
          if (!base64) continue;
          const result = await parseTravelDocumentFromPdf(base64);
          if (result.isBooking) {
            bookings.push(...toBookings(result));
            gotSomething = true;
            fromPdf++;
            break;
          }
        } catch {
          // קובץ פגום או חסום אינו מפיל את הסריקה
        }
      }
    }

    if (gotSomething) parsed++;
    else unrecognized.push(email);
  }

  // מיילים שגוגל החזירה ולא הניבו הזמנה — בין אם סוננו לפני הפענוח ובין
  // אם הפענוח לא זיהה בהם דבר. זו הרשימה שמסבירה אישור חסר.
  return {
    emails,
    bookings,
    parsed,
    fromPdf,
    matched: emails.matched ?? emails.length,
    unrecognized: [
      ...(emails.skipped || []),
      ...unrecognized.map((e) => ({ subject: e.subject, from: e.from, reason: 'נסרק אך לא זוהו פרטי הזמנה' })),
    ],
  };
};
