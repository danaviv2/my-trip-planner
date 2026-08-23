import { fetchBookingEmails, fetchAttachment } from './gmailService';
import { parseTravelDocument, parseTravelDocumentFromPdf } from './bookingParserService';
import { processedIds, markProcessed } from './scanLedgerService';
import { senderHint, isEntitlementSender, identifySender } from './senderIdentityService';

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

/**
 * האם ברשומה די מידע כדי לוותר על הקובץ המצורף.
 *
 * שם ספק לבדו אינו הזמנה: בלי תאריך, מספר או שעה אי אפשר להשתמש בה
 * לכלום. הסף נמוך בכוונה — די בשדה משמעותי אחד.
 */
const isSubstantial = (b) =>
  ['confirmationNumber', 'policyNumber', 'flightNumber', 'date', 'checkIn',
   'pickupDate', 'startDate', 'endDate', 'time', 'emergencyPhone']
    .some((k) => String(b[k] || '').trim());

/**
 * ממיר תוצאת פענוח לרשומות הזמנה שהמאגר מכיר.
 *
 * כל רשומה נושאת את מקורה. בלי זה, רשומה חלקית על המסך אינה ניתנת
 * לאבחון: אי אפשר לדעת אם המייל לא נסרק, אם נסרק ולא הניב את השדה, או
 * אם הקובץ המצורף לא נקרא — וכל תיקון הוא ניחוש.
 */
const toBookings = (result, source = {}) => [
  ...result.flights.map((f) => ({ ...f, type: 'flight', direction: f.type })),
  ...(result.carRental
    ? [{ ...result.carRental, type: result.carRental.category === 'transfer' ? 'transfer' : 'car_rental' }]
    : []),
  ...(result.hotel ? [{ ...result.hotel, type: 'hotel' }] : []),
  ...(result.insurance ? [{ ...result.insurance, type: 'insurance' }] : []),
  ...(result.activities || []).map((a) => ({ ...a, type: 'activity' })),
].map((b) => ({ ...b, ...source }));

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

  // מיילים שכבר פוענחו בגרסת הפענוח הנוכחית אינם נשלפים ואינם נשלחים
  // למודל. זה מה שהופך סריקה חוזרת מפעולה יקרה לפעולה זולה.
  const known = processedIds();
  const emails = await fetchBookingEmails(token, { maxResults, monthsBack, skipIds: known });

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

    // ── זכאות אינה הזמנה ──
    // שובר כניסה לטרקלין נכנס למאגר כאטרקציה ובנה נסיעה בשם "יעד לא
    // ידוע". אין בו מועד, מקום או טווח — רק תוקף. הכתובת מכריעה כאן
    // לבדה רק כשכל תוצרתו של הספק היא זכאויות; חברת ביטוח ששולחת גם
    // שובר טרקלין אינה נחסמת כאן, שם ההכרעה נשארת בקריאת המסמך.
    if (isEntitlementSender(email.from)) {
      unrecognized.push({
        subject: email.subject,
        from: email.from,
        reason: `${identifySender(email.from).vendor} — זכאות ולא הזמנה`,
      });
      markProcessed(email.id);
      continue;
    }

    // כתובת השולח היא הסימן הדטרמיניסטי היחיד בצינור: היא נשלפת ממילא
    // ב-gmailService ונזרקה כאן, בדיוק כפי שקרה ל-messageId. המבנה של
    // מספר האסמכתה אינו יכול להחליף אותה — אצל המשתמש שובר הטרקלין
    // ומספר הזמנת מלון אמיתית היו שניהם שש-עשרה ספרות רצופות.
    const hint = senderHint(email.from);
    const header = [hint, email.subject ? `נושא: ${email.subject}` : ''].filter(Boolean).join('\n');

    // קודם גוף המייל — זול ומהיר יותר
    try {
      if (email.text) {
        // שורת הנושא נושאת לעיתים את הזהות היחידה של ההזמנה — "סיכום
        // פרטי פוליסה מס׳ 310558317". היא שימשה לסינון ונזרקה לפני
        // הפענוח, כך שדווקא המזהה לא הגיע למודל.
        const result = await parseTravelDocument(
          header ? `${header}\n\n${email.text}` : email.text
        );
        if (result.isBooking) {
          if (result.cancelled) {
            // ביטול ללא פרטים מיוצג במספר האישור בלבד — זו כל האחיזה
            // שיש כדי לאתר את ההזמנה המקורית במאגר.
            cancellations.push(
              ...toBookings(result),
              ...(result.cancelledReferences || []).map((ref) => ({ confirmationNumber: ref }))
            );
          } else {
            // מזהה המייל נשמר על ההזמנה. הוא נשלף ממילא בזמן הסריקה — שימש
            // למשיכת הקובץ המצורף ונזרק — ובלעדיו "לא לרוץ לחפש במייל" אינו
            // מתקיים: יש פרטים, אין מסמך. בשדה התעופה מבקשים את האישור.
            bookings.push(...toBookings(result, {
              sourceSubject: email.subject,
              sourceKind: 'body',
              sourceMessageId: email.id,
              sourceFrom: email.from || '',
            }));
          }
          // "משהו" אינו "מספיק". מייל שגופו מכתב לוואי מניב רשומה שכל
          // תוכנה שם הספק, וזו חסמה את הקובץ המצורף שבו הפוליסה כולה —
          // התאריכים וטלפון החירום. רשומה דלה אינה סיבה לוותר על הקובץ.
          gotSomething = toBookings(result).some(isSubstantial);
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
              bookings.push(
                ...toBookings(result, {
                  sourceSubject: email.subject,
                  sourceKind: pdf.filename || 'קובץ מצורף',
                  sourceMessageId: email.id,
                  sourceFrom: email.from || '',
                })
              );
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

  // הסימון נעשה בסוף ורק על מיילים שהמעבר עליהם הושלם. סימון מוקדם היה
  // גורם לדילוג בפעם הבאה על מייל שהפענוח שלו נכשל באמצע.
  markProcessed(emails.map((e) => e.id));

  // מיילים שגוגל החזירה ולא הניבו הזמנה — בין אם סוננו לפני הפענוח ובין
  // אם הפענוח לא זיהה בהם דבר. זו הרשימה שמסבירה אישור חסר.
  return {
    emails,
    alreadyKnown: emails.alreadyKnown || 0,
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
