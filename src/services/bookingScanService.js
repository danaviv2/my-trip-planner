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

/** שם הקובץ מסגיר את תוכנו: פוליסה וכרטיס לפני קבלה ודף הסבר כללי. */
const rank = (pdf) => {
  const n = String(pdf.filename || '').toLowerCase();
  if (/policy|פוליסה|ticket|כרטיס|voucher|שובר/.test(n)) return 2;
  if (/information|מידע|terms|תנאים/.test(n)) return 0;
  return 1;
};

/** ממיר תוצאת פענוח לרשומות הזמנה שהמאגר מכיר. */
const toBookings = (result) => [
  ...result.flights.map((f) => ({ ...f, type: 'flight', direction: f.type })),
  ...(result.carRental
    ? [{ ...result.carRental, type: result.carRental.category === 'transfer' ? 'transfer' : 'car_rental' }]
    : []),
  ...(result.hotel ? [{ ...result.hotel, type: 'hotel' }] : []),
  ...(result.insurance ? [{ ...result.insurance, type: 'insurance' }] : []),
  ...(result.activities || []).map((a) => ({ ...a, type: 'activity' })),
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
  { maxResults = 60, monthsBack = 12, maxPdfsPerEmail = 3, onProgress = () => {} } = {}
) => {
  onProgress('מחפש אישורי הזמנה בתיבה...', 0, 0);
  const emails = await fetchBookingEmails(token, { maxResults, monthsBack });

  const bookings = [];
  // ביטולים אינם הזמנות ואסור שייכנסו למאגר. הם נאספים בנפרד כדי לשמש
  // להסרת ההזמנה המקורית שכן נמצאת שם.
  const cancellations = [];
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
          if (result.cancelled) {
            // ביטול ללא פרטים מיוצג במספר האישור בלבד — זו כל האחיזה
            // שיש כדי לאתר את ההזמנה המקורית במאגר.
            cancellations.push(
              ...toBookings(result),
              ...(result.cancelledReferences || []).map((ref) => ({ confirmationNumber: ref }))
            );
          } else {
            bookings.push(...toBookings(result));
          }
          gotSomething = true;
        }
      }
    } catch {
      // מייל בודד שנכשל אינו מפיל את הסריקה כולה
    }

    // ספקים רבים שמים את הפרטים רק בקובץ המצורף. ניגשים אליו כשגוף
    // המייל לא הניב דבר, כדי לא לשלם על פענוח כפול.
    if (!gotSomething && email.pdfs?.length) {
      // מייל אחד נושא לעיתים קבלה, דף מידע והפוליסה עצמה. כשהמכסה
      // חתכה את הרשימה לפי סדר ההגעה, דווקא הפוליסה — הקובץ היחיד שיש
      // בו תוכן — נותרה מחוץ לסריקה. לכן הקבצים ממוינים לפי שמם.
      const byRelevance = [...email.pdfs].sort((x, y) => rank(y) - rank(x));
      for (const pdf of byRelevance.slice(0, maxPdfsPerEmail)) {
        try {
          onProgress(`קורא קובץ מצורף (${i + 1}/${emails.length})...`, i + 1, emails.length);
          const base64 = await fetchAttachment(token, email.id, pdf.attachmentId);
          if (!base64) continue;
          const result = await parseTravelDocumentFromPdf(base64);
          if (result.isBooking) {
            if (result.cancelled) {
              cancellations.push(
                ...toBookings(result),
                ...(result.cancelledReferences || []).map((ref) => ({ confirmationNumber: ref }))
              );
            } else {
              bookings.push(...toBookings(result));
            }
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
    cancellations,
    parsed,
    fromPdf,
    matched: emails.matched ?? emails.length,
    unrecognized: [
      ...(emails.skipped || []),
      ...unrecognized.map((e) => ({ subject: e.subject, from: e.from, reason: 'נסרק אך לא זוהו פרטי הזמנה' })),
    ],
  };
};
