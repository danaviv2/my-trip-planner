import React, { createContext, useContext, useState, useEffect, useMemo, useCallback , useRef } from 'react';
import { useAuth } from './AuthContext';
import {
  saveBooking, loadBookings, deleteBooking,
  markCancelledRef, loadCancelledRefs,
  saveDismissed, loadDismissed, clearCollection,
} from '../services/firestoreService';
import { groupBookingsIntoTrips } from '../services/tripGroupingService';
import { clearLedger } from '../services/scanLedgerService';
import { useAutoGmailScan } from '../hooks/useAutoGmailScan';
import {
  dateKey, flightKey, sameName, sameFlightNumber, sameAirport, stripInvisible,
} from '../services/bookingIdentity';

/**
 * מאגר ההזמנות של המשתמש והטיולים שנגזרים מהן.
 *
 * עד כה אישורים שפוענחו מהמייל מילאו את הטופס ונעלמו ברענון. כאן הם
 * נשמרים, וקיבוץ לטיולים מחושב מהם — כך שאוסף אישורים בודדים הופך
 * לרשימת נסיעות. זהו הצד הקולט של הייבוא האוטומטי.
 *
 * מחובר: Firestore. לא מחובר: localStorage.
 */

const BookingsContext = createContext();

const LS_KEY = 'importedBookings';
// מספרי אישור שבוטלו. נשמרים גם מקומית, כדי שהסינון יעבוד גם בלי חיבור.
const CANCELLED_KEY = 'cancelledBookingRefs';

// מזהה הביטול חייב להיראות זהה בשלושת המקומות: בסינון, באחסון המקומי
// ובמזהה המסמך בענן — שבו לוכסן אסור.
const refKey = (s) => norm(s).replace(/\//g, '-');

// הזמנות שנמחקו ידנית. נשמר תוכן הרשומה ולא מזהה, כי המזהה משתנה בכל
// ייבוא מחדש בעוד תוכן ההזמנה נשאר.
const DISMISSED_KEY = 'dismissedBookings';

const readDismissed = () => {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]');
  } catch {
    return [];
  }
};

const writeDismissed = (list) => {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(list));
  } catch {}
};

/**
 * מסלק הזמנות שהמשתמש מחק.
 *
 * בלי זה המחיקה מחזיקה עד הסריקה הבאה בלבד: מייל האישור נשאר בתיבה
 * לנצח, וההזמנה שמחקת חוזרת. ההשוואה היא אותה השוואה שמזהה כפילויות,
 * ולכן גרסה חלקית של רשומה שנמחקה לא תחזור מהדלת האחורית.
 */
const withoutDismissed = (list, dismissed) =>
  dismissed.length ? list.filter((b) => !dismissed.some((d) => sameBooking(b, d))) : list;

const readCancelled = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(CANCELLED_KEY) || '[]'));
  } catch {
    return new Set();
  }
};

const writeCancelled = (set) => {
  try {
    localStorage.setItem(CANCELLED_KEY, JSON.stringify([...set]));
  } catch {}
};

/**
 * מסלק הזמנות שמספר האישור שלהן סומן כמבוטל.
 *
 * מייל האישור המקורי נשאר בתיבה לנצח, ולכן כל סריקה מייבאת אותו מחדש.
 * בלי הסינון הזה הביטול מחזיק עד הסריקה הבאה בלבד.
 */
/** מסלק רשומות חסרות תוכן, כולל כאלה שכבר הצטברו במאגר. */
const withoutEmptyRecords = (list) => list.filter((b) => !isEmptyRecord(b));

const withoutCancelled = (list, refs) =>
  refs.size ? list.filter((b) => !refs.has(refKey(b.confirmationNumber))) : list;

const readLocal = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
};

const writeLocal = (list) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch {}
};

/**
 * מזהה יציב לפי מהות ההזמנה, לא לפי הניירת שלה.
 *
 * גרסה קודמת כללה את מספר האישור, ולכן אותה טיסה שהגיעה גם ממייל של
 * חברת התעופה וגם ממייל של אתר ההזמנות נספרה פעמיים — כל אחד עם מספר
 * אישור אחר — ונוצרו שתי נסיעות זהות.
 *
 * טיסה מזוהה לפי מספר הטיסה והתאריך; לינה לפי שם ותאריך כניסה; רכב
 * לפי הספק ותאריך האיסוף. אלה מזהים את הדבר עצמו, ללא תלות בערוץ שדרכו
 * הגיע האישור.
 */
// סימני כיווניות ותווים בלתי נראים מוסרים כאן: הם מגיעים מ-HTML של
// מיילים בעברית, אינם נראים על המסך, והופכים שתי מחרוזות זהות לשונות.
const norm = (s) => stripInvisible(s).trim().toLowerCase().replace(/\s+/g, '');

/**
 * השוואה לפי ערך קנוני ולא לפי המחרוזת כפי שהתקבלה.
 *
 * זה היה שורש סבב הכפילויות: הכללים היו נכונים, אך פעלו על מחרוזות
 * גולמיות. אותה טיסה הופיעה כ-LY384 וכ-LY0384, אותו תאריך כ-2026-06-24
 * וכ-24/06/2026 — והשוואת מחרוזות קבעה שאלה דברים שונים.
 *
 * @param {string} kind 'date' | 'flight' | ריק לטקסט רגיל
 */
const canon = (v, kind) => {
  if (kind === 'date') return dateKey(v);
  if (kind === 'flight') return flightKey(v);
  return norm(v);
};

/** סתירה קיימת רק כששני הערכים מלאים ושונים. שדה חסר אינו סותר דבר. */
const contradicts = (a, b, kind) => {
  const x = canon(a, kind);
  const y = canon(b, kind);
  return !!x && !!y && x !== y;
};

/** הסכמה חיובית: שני הערכים מלאים וזהים לאחר קנוניזציה. */
const agrees = (a, b, kind) => {
  const x = canon(a, kind);
  const y = canon(b, kind);
  return !!x && !!y && x === y;
};

/**
 * האם שתי רשומות מתארות את אותה טיסה.
 *
 * מפתח־גיבוב לא מתאים כאן: אותו אישור מגיע במספר גרסאות חלקיות — גוף
 * המייל, ה-PDF המצורף, ולעיתים מייל נוסף מאתר ההזמנות — ולכל גרסה חסר
 * שדה אחר. גרסה עם שעת המראה בלבד וגרסה עם שעת נחיתה בלבד היו מקבלות
 * מפתחות שונים ונשארות כשתי טיסות.
 *
 * לכן ההשוואה היא לפי סימנים: אותו תאריך, אף שדה מזהה אינו סותר, ולפחות
 * אחד מהם מסכים בפועל. כך גרסאות חלקיות מתאחדות, אבל שתי טיסות אמיתיות
 * באותו יום — מספרים או שעות שונות — נשארות נפרדות.
 */
// רשומה שאין בה מספר טיסה ואף לא שעה אחת אינה מתארת טיסה מסוימת, אלא
// רק "הייתה טיסה ביום הזה". צירוף כזה נוצר כשמייל מזכיר טיסה בלי פרטים.
const isFlightFragment = (f) =>
  !norm(f.flightNumber) && !norm(f.departureTime) && !norm(f.arrivalTime);

/**
 * רשומת טיסה בלי תאריך ובלי מספר טיסה אינה מזהה דבר.
 *
 * היא נוצרת כשמייל מזכיר טיסה בלי פרטים, והיא הרסנית יותר מחסרת ערך:
 * ההשוואה בין טיסות פותחת בדרישה שהתאריכים יסכימו, ושני תאריכים ריקים
 * אינם מסכימים — ולכן שני עותקים זהים לעולם לא יתאחדו. כל סריקה הוסיפה
 * עותק נוסף, עד שהצטברו תריסר "טיסות" ריקות.
 */
/**
 * רשומה שאין בה מספר אישור, מזהה ייעודי ואף לא תאריך.
 *
 * שם ספק לבדו אינו הזמנה: אי אפשר לדעת ממנו מתי, לאן, או על סמך מה
 * לפנות. רשומות כאלה נוצרות מתזכורות וממכתבי לוואי, והן גם הרסניות —
 * אין להן שום שדה להסכים עליו, ולכן אינן מתאחדות ומצטברות בכל סריקה.
 *
 * מלון ואטרקציה אינם נכללים: שם מוכר הוא מידע שהמשתמש יודע לזהות
 * ולמחוק בעצמו, ומחיקה אוטומטית שלו מסוכנת יותר מהרעש שהיא חוסכת.
 */
const PURGEABLE = {
  flight: ['flightNumber', 'date', 'departureTime', 'arrivalTime'],
  car_rental: ['pickupDate', 'returnDate', 'date'],
  transfer: ['pickupDate', 'pickupTime', 'date'],
  insurance: ['policyNumber', 'startDate', 'endDate'],
};

const isEmptyRecord = (b) => {
  const fields = PURGEABLE[b.type || ''];
  if (!fields) return false;
  if (norm(b.confirmationNumber)) return false;
  return !fields.some((k) => norm(b[k]));
};

const sameFlight = (a, b) => {
  // רשומה בלי תאריך אינה סותרת שום תאריך. תזכורת צ׳ק-אין נושאת את מספר
  // הטיסה בלבד, ובלי הכלל הזה היא נשארה רשומה נפרדת לצד הטיסה עצמה —
  // וגם הוכפלה בכל סריקה, כי שני תאריכים ריקים אינם "מסכימים".
  if (!dateKey(a.date) || !dateKey(b.date)) return sameFlightNumber(a.flightNumber, b.flightNumber);
  if (!agrees(a.date, b.date, 'date')) return false;
  // מספר בלי קוד חברה אינו סותר מספר עם קוד — הוא פחות מפורט
  if (
    flightKey(a.flightNumber) && flightKey(b.flightNumber) &&
    !sameFlightNumber(a.flightNumber, b.flightNumber)
  ) return false;

  // מספר טיסה ותאריך הם זהות מוחלטת: LY5111 ב-24.6 היא טיסה אחת בעולם.
  // כשהם מסכימים, אי-התאמה בשעות אינה מעידה על טיסה אחרת אלא על שדה
  // שנקלט שגוי — נצפה בפועל כששעת הנחיתה נכתבה בשדה ההמראה. לכן השעה
  // אינה מקבלת זכות וטו על מספר הטיסה.
  if (sameFlightNumber(a.flightNumber, b.flightNumber)) return true;

  if (contradicts(a.departureTime, b.departureTime)) return false;
  if (contradicts(a.arrivalTime, b.arrivalTime)) return false;

  // שבר מידע נבלע לתוך טיסה מלאה באותו יום ובאותו מסלול. בלי זה הוא
  // אינו מוצא שום סימן להסכים עליו, נשאר בנפרד, ופותח נסיעה משלו.
  if (isFlightFragment(a) || isFlightFragment(b)) {
    // המסלול מושווה לפי זהות השדה ולא לפי הכתוב: אישור אחד רושם "FCO"
    // והשני "ROME FIUMICINO", והשוואת מחרוזות הכריזה עליהם כסותרים —
    // כך נשארה טיסת החזור כשתי רשומות.
    return sameAirport(a.departureAirport, b.departureAirport) &&
           sameAirport(a.arrivalAirport, b.arrivalAirport);
  }

  return (
    sameFlightNumber(a.flightNumber, b.flightNumber) ||
    agrees(a.departureTime, b.departureTime) ||
    agrees(a.arrivalTime, b.arrivalTime)
  );
};

/**
 * מזהה יציב לפי מהות ההזמנה, לא לפי הניירת שלה. גרסה קודמת כללה את מספר
 * האישור, ולכן אותה הזמנה שהגיעה גם מהספק וגם מאתר ההזמנות נספרה פעמיים.
 */
/**
 * שדות הזהות והזמן של כל סוג הזמנה.
 *
 * זהות = מה שהספק מנפיק להזמנה אחת. זמן = מתי היא מתרחשת. שתי גרסאות
 * של אותה הזמנה יסכימו על לפחות אחד מהם, ולעולם לא יסתרו זה את זה.
 */
const IDENTITY = {
  insurance: { id: ['policyNumber'], name: [], time: ['startDate', 'endDate'] },
  // שם עסק מושווה בנפרד: ספק אחד כותב "Caruso Place" והשני "Caruso Place
  // Luxury Rooms & Suites", ולכן השוואת מחרוזות הפרידה ביניהם.
  hotel: { id: [], name: ['name'], time: ['checkIn', 'checkOut'] },
  car_rental: { id: [], name: ['company'], time: ['pickupDate', 'returnDate'] },
  transfer: { id: [], name: ['company'], time: ['pickupDate', 'pickupTime'] },
  activity: { id: [], name: ['name'], time: ['date'] },
  // פריט שהמשתמש הוסיף. הושמט תחילה במכוון, מתוך מחשבה ששני פריטים
  // זהים הם בחירה מודעת — וזו הייתה טעות: לחיצה חוזרת על "הוסף", או
  // הוספה מחדש אחרי שלא היה ברור אם נשמר, ייצרו חמישה עותקים של אותה
  // ארוחה. אותו שם באותו יום ובאותה שעה הוא פריט אחד. שעה שונה עדיין
  // מפרידה, ולכן שתי ארוחות באותו יום נשארות שתיים.
  custom: { id: [], name: ['title'], time: ['date', 'time'] },
};

/** שדות הזמן של כל סוג הם תאריכים, למעט שעה — ואלה מושווים אחרת. */
const isTimeOfDay = (field) => /time$/i.test(field) && field !== 'checkIn';

/**
 * האם שתי רשומות הן אותה הזמנה.
 *
 * מספר אישור הוא זהות חזקה מן הסיווג: הספק מנפיק אותו להזמנה אחת. אותו
 * מייל של Booking.com סווג פעם כהסעה ופעם כהשכרת רכב, וההשוואה שפסלה
 * מיד סוגים שונים יצרה שלוש רשומות מאותה הזמנה.
 *
 * לטיסות זה אינו נכון: מספר אישור אחד מכסה גם הלוך וגם חזור, ואיחוד
 * לפיו היה מוחק את אחת הטיסות. לכן הן נשארות בהשוואה לפי סימנים.
 */
/**
 * שתי רשומות שהן בעצם אותו מסמך.
 *
 * זו הזהות החזקה ביותר שיש: לא הסקה משדות אלא ידיעה שהמקור זהה. היא
 * חלה רק על סוגים שמסמך אחד מפיק מהם רשומה אחת לכל היותר — טיסות
 * ואטרקציות באות בכמה עותקים מאותו אישור, ולכן אינן נכללות.
 */
const ONE_PER_DOCUMENT = ['insurance', 'hotel', 'car_rental', 'transfer'];

const sameSource = (a, b) =>
  ONE_PER_DOCUMENT.includes(a.type || '') &&
  (a.type || '') === (b.type || '') &&
  !!norm(a.sourceSubject) &&
  norm(a.sourceSubject) === norm(b.sourceSubject) &&
  norm(a.sourceKind) === norm(b.sourceKind);

const sameBooking = (a, b) => {
  const aFlight = a.type === 'flight';
  const bFlight = b.type === 'flight';

  if (aFlight || bFlight) {
    return aFlight && bFlight ? sameFlight(a, b) : false;
  }

  // קריאה חוזרת של אותו מסמך היא אותה הזמנה גם כשהשדות שונים לגמרי —
  // וזה בדיוק המצב שבו הפענוח תוקן: הקריאה הישנה נתנה ספק ותאריך
  // שגויים, החדשה נותנת מספר פוליסה נכון, ואין ביניהן שדה מוסכם.
  if (sameSource(a, b)) return true;

  if (agrees(a.confirmationNumber, b.confirmationNumber)) return true;
  if ((a.type || '') !== (b.type || '')) return false;

  // מפתח־גיבוב נבנה משדות שעשויים להיעדר, ולכן פיצל בהכרח גרסאות חלקיות
  // של אותה הזמנה: מייל אחד נושא את מספר הפוליסה, קובץ מצורף נושא את
  // התאריכים ואת טלפון החירום — ושניהם הפיקו מפתחות שונים. זה בדיוק
  // הליקוי שתוקן לטיסות בהשוואה לפי סימנים, ולא הוחל על שאר הסוגים.
  const fields = IDENTITY[a.type || ''];
  if (!fields) return false;

  if (contradicts(a.confirmationNumber, b.confirmationNumber)) return false;

  // כל סוג שדה מושווה בדרכו: מזהה כטקסט, תאריך לפי ערך קנוני, שם עסק
  // לפי הליבה המזהה שלו.
  const kindOf = (k) => (isTimeOfDay(k) ? '' : 'date');

  if (fields.id.some((k) => contradicts(a[k], b[k]))) return false;
  if (fields.time.some((k) => contradicts(a[k], b[k], kindOf(k)))) return false;
  if (fields.name.some((k) => norm(a[k]) && norm(b[k]) && !sameName(a[k], b[k]))) return false;

  // הסכמה חיובית באחד השדות היא התנאי. שתי רשומות שאין ביניהן אף שדה
  // משותף אינן "אותה הזמנה" אלא שתי הזמנות שלא ידוע עליהן די — ואיחודן
  // היה יוצר רשומה מורכבת משתי מציאויות.
  return (
    fields.id.some((k) => agrees(a[k], b[k])) ||
    fields.time.some((k) => agrees(a[k], b[k], kindOf(k))) ||
    fields.name.some((k) => sameName(a[k], b[k]))
  );
};

/**
 * מאחד שתי גרסאות של אותה הזמנה לרשומה אחת מלאה.
 *
 * לא בוחרים גרסה "מנצחת": לגרסה מה-PDF יש שעת נחיתה וטרמינל, ולגרסה
 * מהמייל שעת המראה — רק האיחוד נותן תמונה שלמה. כששתיהן מילאו שדה טקסט,
 * נשמר הערך המפורט יותר ("EL AL ISRAEL AIRLINES" ולא "LY").
 */
const mergeBookings = (a, b) => {
  const out = { ...a };

  // התיקונים של המשתמש מאוחדים משני הצדדים. כלל "המחרוזת הארוכה גוברת"
  // אינו חל על אובייקט, וההשארה השקטה של צד אחד הייתה מאבדת תיקון
  // שנרשם על העותק השני של אותה הזמנה.
  if (a.overrides || b.overrides) {
    out.overrides = { ...(b.overrides || {}), ...(a.overrides || {}) };
  }

  Object.entries(b).forEach(([k, v]) => {
    if (k === 'id' || k === 'importedAt' || k === 'overrides') return;
    const cur = out[k];
    if (cur === '' || cur == null) out[k] = v;
    else if (typeof cur === 'string' && typeof v === 'string' && v.length > cur.length) out[k] = v;
  });
  return out;
};

/**
 * מסיר כפילויות מרשימה קיימת. נדרש כי רשומות שנשמרו לפני תיקון המפתח
 * עדיין במאגר, ובלעדיו אותה נסיעה מוצגת פעמיים.
 */
/** כמה שדות בעלי ערך מולאו ברשומה. */
const filled = (b) =>
  Object.entries(b || {}).filter(
    ([k, v]) => !['id', 'importedAt', 'type', 'direction'].includes(k) && v !== '' && v != null
  ).length;

const dedupe = (list = []) => {
  const out = [];
  (list || []).forEach((b) => {
    if (!b) return;
    const i = out.findIndex((o) => sameBooking(o, b));
    if (i === -1) {
      out.push({ ...b });
    } else {
      // הרשומה עם יותר שדות מלאים משמשת בסיס. אחרת, כששתיהן מילאו את
      // אותו שדה, סדר ההגעה קובע — וגרסה חלקית עלולה לדרוס ערך נכון.
      // כשמדובר באותו מסמך, הקריאה המאוחרת גוברת במקום להתמזג. אחרת
      // ערך שגוי שכבר שמור שורד לנצח: האיחוד ממלא שדות ריקים ומעדיף
      // מחרוזת ארוכה יותר, אך אינו מסיר דבר — ותיקון בפענוח לעולם לא
      // מגיע למסך בלי שהמשתמש ימחק ידנית.
      if (sameSource(out[i], b)) {
        // התיקונים של המשתמש עוברים לגרסה המנצחת. הקריאה המאוחרת דורסת
        // את הרשומה כולה, ובלי ההעברה הזו תיקון ידני היה נמחק בשקט
        // בסריקה הבאה — בדיוק מה שהשכבה הנפרדת נועדה למנוע.
        const edits = out[i].overrides || b.overrides;
        const winner = (b.importedAt || '') >= (out[i].importedAt || '') ? { ...b } : { ...out[i] };
        if (edits) winner.overrides = { ...(b.overrides || {}), ...(out[i].overrides || {}) };
        out[i] = winner;
        return;
      }
      const [base, extra] = filled(out[i]) >= filled(b) ? [out[i], b] : [b, out[i]];
      out[i] = mergeBookings(base, extra);
    }
  });
  return out;
};

export const BookingsProvider = ({ children }) => {
  const [bookings, setBookings] = useState([]);

  /**
   * הרשימה הסמכותית, מעודכנת באופן סינכרוני.
   *
   * הסריקה השקטה בפתיחה והסריקה הידנית יכולות לרוץ במקביל. כל אחת חישבה
   * את האיחוד מול `bookings` שנתפס בסגירה שלה — ערך שהיה נכון כשהפונקציה
   * נוצרה ומיושן כשהיא רצה. שתיהן בנפרד נכונות, אך אינן רואות זו את זו,
   * ולכן אותה טיסה נכתבה פעמיים אף שהאיחוד עצמו תקין לחלוטין.
   *
   * זה הסביר את הפער שרדף אותנו: הרצת אותן רשומות במעבדה איחדה אותן, כי
   * שם הן עברו בקריאה אחת.
   *
   * ה-ref מתעדכן ברגע הכתיבה ולא בעיבוד הבא, ולכן קריאה שנייה רואה תמיד
   * את תוצאת הראשונה.
   */
  const bookingsRef = useRef([]);

  /**
   * נקודת הכתיבה היחידה — והמקום שבו נאכפת התכונה.
   *
   * חמישה סבבי תיקון חיפשו איזה קורא מתנהג לא נכון. הכלי האבחוני הוכיח
   * שההשוואה תקינה לחלוטין ושהרצה חוזרת מצמצמת — כלומר רשומה נכתבה בלי
   * לעבור באיחוד. אבל יש ארבעה מסלולי כתיבה, ריצות מקבילות, מטמון ענן
   * ו-React באמצע; תמיד יימצא עוד מסלול שלא נצפה מראש.
   *
   * לכן האיחוד אינו באחריות הקוראים אלא מוטבע כאן: מרגע זה אי אפשר
   * לשמור רשימה שיש בה כפילות, ולא משנה מי כתב אותה או מתי.
   */
  const applyBookings = useCallback((next) => {
    const clean = withoutEmptyRecords(dedupe(next || []));
    bookingsRef.current = clean;
    setBookings(clean);
    writeLocal(clean);
    return clean;
  }, []);
  const [loading, setLoading] = useState(true);
  // כשל בשמירה לענן היה נבלע בשקט, והמשתמש האמין שהנתונים מגובים בעוד
  // הם קיימים רק בדפדפן. עדיף לומר זאת מאשר להסתיר.
  const [cloudError, setCloudError] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      if (user) {
        try {
          const [remote, remoteCancelled, remoteDismissed] = await Promise.all([
            loadBookings(user.uid),
            loadCancelledRefs(user.uid).catch(() => new Set()),
            loadDismissed(user.uid).catch(() => []),
          ]);
          const dismissed = dedupe([...readDismissed(), ...remoteDismissed]);
          writeDismissed(dismissed);
          const cancelledRefs = new Set([...readCancelled(), ...remoteCancelled]);
          writeCancelled(cancelledRefs);
          const merged = [...remote, ...readLocal()];
          // איחוד לפי מהות ההזמנה, ולא לפי מזהה: אותה טיסה עשויה להיות
          // שמורה בענן ובדפדפן תחת מזהים שונים.
          const clean = withoutDismissed(withoutCancelled(withoutEmptyRecords(dedupe(merged)), cancelledRefs), dismissed);
          const remoteIds = new Set(remote.map((b) => String(b.id)));

          // מה שקיים מקומית ולא בענן מועלה; מה שנשאר בענן אחרי האיחוד
          // נמחק, אחרת הכפילויות חוזרות בכל טעינה.
          const toUpload = clean.filter((b) => !remoteIds.has(String(b.id)));
          const kept = new Set(clean.map((b) => String(b.id)));
          const stale = remote.filter((b) => !kept.has(String(b.id)));

          await Promise.all([
            ...toUpload.map((b) => saveBooking(user.uid, b)),
            ...stale.map((b) => deleteBooking(user.uid, b.id)),
          ]);

          if (!cancelled) {
            applyBookings(clean);
            setCloudError(false);
          }
        } catch {
          // הענן אינו זמין — ממשיכים מהעותק המקומי, אך מסמנים זאת כדי
          // שהמשתמש לא יניח שהנתונים מגובים.
          if (!cancelled) {
            const clean = withoutDismissed(withoutCancelled(withoutEmptyRecords(dedupe(readLocal())), readCancelled()), readDismissed());
            applyBookings(clean);
            setCloudError(true);
          }
        }
      } else if (!cancelled) {
        const clean = withoutDismissed(withoutCancelled(withoutEmptyRecords(dedupe(readLocal())), readCancelled()), readDismissed());
        applyBookings(clean);
      }
      if (!cancelled) setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  /**
   * מוסיף הזמנות שפוענחו. מדלג על כאלה שכבר קיימות.
   * @returns {{added:number, skipped:number}}
   */
  const addBookings = useCallback(
    async (incoming = []) => {
      const list = (Array.isArray(incoming) ? incoming : [incoming]).filter(Boolean);
      const stamped = list.map((b) => ({
        ...b,
        id: b.id || `bk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        importedAt: new Date().toISOString(),
      }));

      // האצווה הנכנסת עצמה מכילה כפילויות: סריקה אחת מחזירה את אותה טיסה
      // מגוף המייל, מה-PDF המצורף ולעיתים ממייל נוסף. בדיקה מול המאגר
      // בלבד לא תופסת אותן, ולכן האיחוד רץ על הכל יחד.
      // מול הרשימה הסמכותית ולא מול הסגירה: סריקה מקבילה כבר עשויה
      // להיות כתובה, וקריאה מיושנת הייתה מוסיפה את אותן הזמנות שוב.
      const current = bookingsRef.current;
      const before = new Map(current.map((b) => [String(b.id), JSON.stringify(b)]));
      const merged = withoutDismissed(withoutCancelled(withoutEmptyRecords(dedupe([...current, ...stamped])), readCancelled()), readDismissed());

      // נשמר גם מה שנוסף וגם רשומה קיימת שהתעשרה בפרטים מהאצווה
      const changed = merged.filter((b) => before.get(String(b.id)) !== JSON.stringify(b));
      const kept = new Set(merged.map((b) => String(b.id)));
      const stale = current.filter((b) => !kept.has(String(b.id)));

      if (!changed.length && !stale.length) return { added: 0, skipped: list.length };

      const saved = applyBookings(merged);

      // הרשימה שנשמרה בפועל היא זו שנאכפה בנקודת הכתיבה, ולכן הסנכרון
      // לענן נגזר ממנה ולא מהחישוב המקומי שקדם לה.
      const savedIds = new Set(saved.map((x) => String(x.id)));
      const toSave = changed.filter((x) => savedIds.has(String(x.id)));
      const toDrop = [...stale, ...merged.filter((x) => !savedIds.has(String(x.id)))];

      if (user) {
        try {
          await Promise.all([
            ...toSave.map((b) => saveBooking(user.uid, b)),
            ...toDrop.map((b) => deleteBooking(user.uid, b.id)),
          ]);
          setCloudError(false);
        } catch {
          // הייבוא הצליח והנתונים שמורים מקומית; רק הגיבוי לענן נכשל
          setCloudError(true);
        }
      }

      const added = saved.length - current.length;
      return { added: Math.max(added, 0), skipped: list.length - Math.max(added, 0) };
    },
    [user, applyBookings]
  );

  /**
   * כתיבה ישירה של רשומה אחת, בלי מיזוג.
   *
   * `addBookings` מאחד רשומות דומות ומעדיף מחרוזת ארוכה יותר — התנהגות
   * נכונה לייבוא, והרסנית לעריכה: מחיקת טקסט או קיצורו היו מתבטלות,
   * והמשתמש היה רואה את הערך הישן חוזר.
   */
  const updateBooking = useCallback(
    async (id, patch) => {
      const key = String(id);
      const current = bookingsRef.current;
      if (!current.some((x) => String(x.id) === key)) return null;

      const next = current.map((x) => (String(x.id) === key ? { ...x, ...patch } : x));
      const saved = applyBookings(next);
      const row = saved.find((x) => String(x.id) === key);

      if (user && row) {
        try {
          await saveBooking(user.uid, row);
          setCloudError(false);
        } catch {
          setCloudError(true);
        }
      }
      return row || null;
    },
    [user, applyBookings]
  );

  /**
   * תיקון של אירוע בודד בתוך הזמנה.
   *
   * נשמר בשכבה נפרדת ולא על השדה עצמו, כדי שהסריקה הבאה של אותו מייל לא
   * תחזיר את הערך שבאישור. מפתח ריק מוחק את התיקון וחוזר למקור.
   */
  const editEvent = useCallback(
    async (id, kind, patch) => {
      const current = bookingsRef.current.find((x) => String(x.id) === String(id));
      if (!current) return null;

      const merged = { ...(current.overrides || {}) };
      const next = { ...(merged[kind] || {}), ...patch };

      // ערך זהה למקור אינו תיקון. שמירתו הייתה מסמנת את השורה כ"נערכה"
      // בלי שדבר השתנה בה.
      Object.keys(next).forEach((k) => {
        if (next[k] === undefined || next[k] === null) delete next[k];
      });

      if (Object.keys(next).length) merged[kind] = next;
      else delete merged[kind];

      const write = { overrides: Object.keys(merged).length ? merged : null };

      // שינוי מקום מבטל את המיקום שאותר: הקואורדינטה הישנה שייכת לכתובת
      // הישנה, והשארתה הייתה מציבה על המפה נקודה נכונה למקום שכבר לא
      // רלוונטי — שקר שנראה בדיוק כמו אמת.
      if ('place' in patch && current.geo && current.geo[kind]) {
        const geo = { ...current.geo };
        delete geo[kind];
        write.geo = Object.keys(geo).length ? geo : null;
      }

      return updateBooking(id, write);
    },
    [updateBooking]
  );

  /** מבטל את כל התיקונים על אירוע וחוזר למה שכתוב באישור. */
  const clearEventEdits = useCallback(
    async (id, kind) => {
      const current = bookingsRef.current.find((x) => String(x.id) === String(id));
      if (!current || !current.overrides) return null;
      const merged = { ...current.overrides };
      delete merged[kind];
      return updateBooking(id, { overrides: Object.keys(merged).length ? merged : null });
    },
    [updateBooking]
  );

  /**
   * מסיר הזמנות שבוטלו, לפי אישורי ביטול שנקלטו מהמייל.
   *
   * מייל ביטול מתאר את אותה הזמנה בדיוק, ולכן ההתאמה נעשית באותם כללים
   * שמזהים כפילות. הזמנה שלא נמצאת במאגר פשוט אין מה לבטל.
   *
   * @returns {Promise<number>} כמה הזמנות הוסרו
   */
  const applyCancellations = useCallback(
    async (cancelled = []) => {
      if (!cancelled.length) return 0;

      // הודעת ביטול נושאת לרוב מספר אישור בלבד, בלי סוג הזמנה ובלי
      // תאריכים, ולכן השוואה מלאה אינה מספיקה. מספר אישור הוא מזהה
      // ייחודי אצל הספק ודי בו כדי לאתר את ההזמנה.
      const refs = new Set(
        cancelled.map((c) => refKey(c.confirmationNumber)).filter(Boolean)
      );
      const current = bookingsRef.current;
      const doomed = current.filter(
        (b) =>
          (refKey(b.confirmationNumber) && refs.has(refKey(b.confirmationNumber))) ||
          cancelled.some((c) => sameBooking(b, c))
      );

      // הסימון נשמר בנפרד מהמחיקה, אחרת הסריקה הבאה תייבא מחדש את אישור
      // ההזמנה המקורי שעדיין יושב בתיבה.
      const marked = readCancelled();
      const fresh = [...refs, ...doomed.map((b) => refKey(b.confirmationNumber))]
        .filter((r) => r && !marked.has(r));
      fresh.forEach((r) => marked.add(r));
      writeCancelled(marked);
      if (user && fresh.length) {
        await Promise.all(fresh.map((r) => markCancelledRef(user.uid, r).catch(() => {})));
      }
      if (!doomed.length) return 0;

      const ids = new Set(doomed.map((b) => String(b.id)));
      const next = current.filter((b) => !ids.has(String(b.id)));
      applyBookings(next);

      if (user) {
        try {
          await Promise.all(doomed.map((b) => deleteBooking(user.uid, b.id)));
        } catch {
          setCloudError(true);
        }
      }

      return doomed.length;
    },
    [bookings, user]
  );

  const removeBooking = useCallback(
    async (id) => {
      const gone = bookingsRef.current.find((b) => String(b.id) === String(id));
      const next = bookingsRef.current.filter((b) => String(b.id) !== String(id));
      applyBookings(next);

      // הסימון נשמר בנפרד מהמחיקה, אחרת הסריקה הבאה תייבא מחדש את אותו
      // אישור שעדיין יושב בתיבה — וההזמנה שמחקת תחזור.
      if (gone) writeDismissed([...readDismissed(), gone]);
      if (user) {
        await Promise.all([
          deleteBooking(user.uid, id).catch(() => {}),
          gone ? saveDismissed(user.uid, gone).catch(() => {}) : Promise.resolve(),
        ]);
      }
    },
    [bookings, user]
  );

  /**
   * מחיקת כל ההזמנות והסימונים, מקומית ובענן.
   *
   * מחיקת ההזמנות בלבד אינה מספיקה לבדיקה נקייה: סימוני המחיקה והביטול
   * שורדים, ולכן הסריקה הבאה מדלגת דווקא על ההזמנות שנמחקו — ומתקבלת
   * תמונה חלקית שנראית ככשל בסריקה ולא כהתנהגות מכוונת.
   */
  const resetAllBookings = useCallback(async () => {
    const count = bookingsRef.current.length;

    applyBookings([]);
    writeCancelled(new Set());
    writeDismissed([]);

    // בלי ניקוי יומן הסריקה, הסריקה שאחרי האיפוס תדלג על כל המיילים ולא
    // תייבא דבר — מסך ריק שנראה ככשל. אותה מלכודת של סימוני המחיקה.
    clearLedger();

    if (user) {
      await Promise.all(
        ['bookings', 'cancelledBookings', 'dismissedBookings'].map((name) =>
          clearCollection(user.uid, name).catch(() => {})
        )
      );
    }

    return { bookings: count };
  }, [bookings, user]);

  /**
   * כלי אבחון לכפילויות.
   *
   * חמישה סבבי תיקון נכשלו מאותה סיבה: dedupe על הרשומות השמורות מחזיר
   * את התוצאה הנכונה, ואף על פי כן היישום שומר כפילות. כלומר הרשומות לא
   * הגיעו יחד להשוואה — ואי אפשר לדעת מדוע מבלי לראות את הריצה עצמה.
   *
   * במקום להמשיך לנחש מתוך צילומי מסך, הפונקציה מריצה את ההשוואה על מה
   * ששמור בפועל ומדפיסה את ההכרעה לכל זוג. היא נחשפת על window ואינה
   * משנה דבר.
   */
  useEffect(() => {
    window.__dedupeReport = () => {
      const list = bookingsRef.current;
      const flights = list.filter((x) => x.type === 'flight');

      console.log('%c— רשומות שמורות —', 'font-weight:bold');
      console.table(
        list.map((x) => ({
          type: x.type, id: String(x.id),
          num: x.flightNumber || x.name || x.company || x.provider || '',
          date: x.date || x.checkIn || x.pickupDate || x.startDate || '',
          route: x.departureAirport ? `${x.departureAirport}→${x.arrivalAirport}` : '',
          src: (x.sourceSubject || '').slice(0, 40),
        }))
      );

      console.log('%c— הכרעה לכל זוג טיסות —', 'font-weight:bold');
      for (let i = 0; i < flights.length; i++) {
        for (let j = i + 1; j < flights.length; j++) {
          const a = flights[i];
          const b2 = flights[j];
          console.log(
            `${a.flightNumber} (${a.id}) ↔ ${b2.flightNumber} (${b2.id}) →`,
            sameBooking(a, b2) ? 'אותה טיסה' : 'שונות',
            '| מפתחות:', flightKey(a.flightNumber), 'vs', flightKey(b2.flightNumber),
            '|', dateKey(a.date), 'vs', dateKey(b2.date)
          );
        }
      }

      const after = withoutEmptyRecords(dedupe(list));
      console.log('%c— תוצאה —', 'font-weight:bold');
      console.log(`שמור: ${list.length} · אחרי איחוד מחדש: ${after.length}`);
      if (after.length !== list.length) {
        console.log('%c⚠️ האיחוד כן מצמצם — כלומר הרשומות נשמרו בלי לעבור בו יחד.', 'color:#c00');
      }
      return after.length;
    };
  }, []);

  // סריקה שקטה בפתיחת האפליקציה — אישור שהגיע למייל הופך לנסיעה בלי
  // שהמשתמש לחץ דבר. רצה רק לאחר שההרשאה אושרה פעם אחת.
  const { scanning: autoScanning, lastResult: autoScanResult } = useAutoGmailScan({
    user,
    addBookings,
    applyCancellations,
    ready: !loading,
  });

  // הטיולים נגזרים מההזמנות ומתעדכנים אוטומטית עם כל אישור חדש
  const trips = useMemo(() => groupBookingsIntoTrips(bookings), [bookings]);

  const value = useMemo(
    () => ({
      bookings, trips, loading, addBookings, removeBooking, applyCancellations,
      updateBooking, editEvent, clearEventEdits,
      resetAllBookings, autoScanning, autoScanResult, cloudError,
    }),
    [bookings, trips, loading, addBookings, removeBooking, applyCancellations,
     updateBooking, editEvent, clearEventEdits,
     resetAllBookings, autoScanning, autoScanResult, cloudError]
  );

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
};

export const useBookings = () => {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error('useBookings must be used within BookingsProvider');
  return ctx;
};
