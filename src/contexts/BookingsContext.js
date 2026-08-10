import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  saveBooking, loadBookings, deleteBooking,
  markCancelledRef, loadCancelledRefs,
} from '../services/firestoreService';
import { groupBookingsIntoTrips } from '../services/tripGroupingService';
import { useAutoGmailScan } from '../hooks/useAutoGmailScan';

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
const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, '');

/** סתירה קיימת רק כששני הערכים מלאים ושונים. שדה חסר אינו סותר דבר. */
const contradicts = (a, b) => !!norm(a) && !!norm(b) && norm(a) !== norm(b);
/** הסכמה חיובית: שני הערכים מלאים וזהים. */
const agrees = (a, b) => !!norm(a) && !!norm(b) && norm(a) === norm(b);

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

const sameFlight = (a, b) => {
  if (!agrees(a.date, b.date)) return false;
  if (contradicts(a.flightNumber, b.flightNumber)) return false;

  // מספר טיסה ותאריך הם זהות מוחלטת: LY5111 ב-24.6 היא טיסה אחת בעולם.
  // כשהם מסכימים, אי-התאמה בשעות אינה מעידה על טיסה אחרת אלא על שדה
  // שנקלט שגוי — נצפה בפועל כששעת הנחיתה נכתבה בשדה ההמראה. לכן השעה
  // אינה מקבלת זכות וטו על מספר הטיסה.
  if (agrees(a.flightNumber, b.flightNumber)) return true;

  if (contradicts(a.departureTime, b.departureTime)) return false;
  if (contradicts(a.arrivalTime, b.arrivalTime)) return false;

  // שבר מידע נבלע לתוך טיסה מלאה באותו יום ובאותו מסלול. בלי זה הוא
  // אינו מוצא שום סימן להסכים עליו, נשאר בנפרד, ופותח נסיעה משלו.
  if (isFlightFragment(a) || isFlightFragment(b)) {
    return !contradicts(a.departureAirport, b.departureAirport);
  }

  return (
    agrees(a.flightNumber, b.flightNumber) ||
    agrees(a.departureTime, b.departureTime) ||
    agrees(a.arrivalTime, b.arrivalTime)
  );
};

/**
 * מזהה יציב לפי מהות ההזמנה, לא לפי הניירת שלה. גרסה קודמת כללה את מספר
 * האישור, ולכן אותה הזמנה שהגיעה גם מהספק וגם מאתר ההזמנות נספרה פעמיים.
 */
const bookingKey = (b) => {
  const type = b.type || '';
  if (type === 'car_rental') return ['car', norm(b.company), norm(b.pickupDate)].join('|');
  if (type === 'hotel') return ['hotel', norm(b.name), norm(b.checkIn)].join('|');
  // להסעה יש pickupDate ולא date, ולכן הענף הכללי הפיק לכולן מפתח זהה
  // וכל ההסעות שאין להן מספר אישור התאחדו לאחת.
  if (type === 'transfer') {
    return ['transfer', norm(b.company), norm(b.pickupDate), norm(b.pickupTime)].join('|');
  }
  if (type === 'activity') {
    return ['activity', norm(b.name), norm(b.date), norm(b.time)].join('|');
  }
  if (type === 'insurance') {
    return ['insurance', norm(b.provider), norm(b.policyNumber || b.startDate)].join('|');
  }
  return [type, norm(b.confirmationNumber), norm(b.date || b.checkIn)].join('|');
};

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
const sameBooking = (a, b) => {
  const aFlight = a.type === 'flight';
  const bFlight = b.type === 'flight';

  if (aFlight || bFlight) {
    return aFlight && bFlight ? sameFlight(a, b) : false;
  }

  if (agrees(a.confirmationNumber, b.confirmationNumber)) return true;

  if ((a.type || '') !== (b.type || '')) return false;
  return bookingKey(a) === bookingKey(b);
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
  Object.entries(b).forEach(([k, v]) => {
    if (k === 'id' || k === 'importedAt') return;
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
      const [base, extra] = filled(out[i]) >= filled(b) ? [out[i], b] : [b, out[i]];
      out[i] = mergeBookings(base, extra);
    }
  });
  return out;
};

export const BookingsProvider = ({ children }) => {
  const [bookings, setBookings] = useState([]);
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
          const [remote, remoteCancelled] = await Promise.all([
            loadBookings(user.uid),
            loadCancelledRefs(user.uid).catch(() => new Set()),
          ]);
          const cancelledRefs = new Set([...readCancelled(), ...remoteCancelled]);
          writeCancelled(cancelledRefs);
          const merged = [...remote, ...readLocal()];
          // איחוד לפי מהות ההזמנה, ולא לפי מזהה: אותה טיסה עשויה להיות
          // שמורה בענן ובדפדפן תחת מזהים שונים.
          const clean = withoutCancelled(dedupe(merged), cancelledRefs);
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

          writeLocal(clean);
          if (!cancelled) {
            setBookings(clean);
            setCloudError(false);
          }
        } catch {
          // הענן אינו זמין — ממשיכים מהעותק המקומי, אך מסמנים זאת כדי
          // שהמשתמש לא יניח שהנתונים מגובים.
          if (!cancelled) {
            const clean = withoutCancelled(dedupe(readLocal()), readCancelled());
            writeLocal(clean);
            setBookings(clean);
            setCloudError(true);
          }
        }
      } else if (!cancelled) {
        const clean = withoutCancelled(dedupe(readLocal()), readCancelled());
        writeLocal(clean);
        setBookings(clean);
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
      const before = new Map(bookings.map((b) => [String(b.id), JSON.stringify(b)]));
      const merged = withoutCancelled(dedupe([...bookings, ...stamped]), readCancelled());

      // נשמר גם מה שנוסף וגם רשומה קיימת שהתעשרה בפרטים מהאצווה
      const changed = merged.filter((b) => before.get(String(b.id)) !== JSON.stringify(b));
      const kept = new Set(merged.map((b) => String(b.id)));
      const stale = bookings.filter((b) => !kept.has(String(b.id)));

      if (!changed.length && !stale.length) return { added: 0, skipped: list.length };

      setBookings(merged);
      writeLocal(merged);

      if (user) {
        try {
          await Promise.all([
            ...changed.map((b) => saveBooking(user.uid, b)),
            ...stale.map((b) => deleteBooking(user.uid, b.id)),
          ]);
          setCloudError(false);
        } catch {
          // הייבוא הצליח והנתונים שמורים מקומית; רק הגיבוי לענן נכשל
          setCloudError(true);
        }
      }

      const added = merged.length - bookings.length;
      return { added: Math.max(added, 0), skipped: list.length - Math.max(added, 0) };
    },
    [bookings, user]
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
      const doomed = bookings.filter(
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
      const next = bookings.filter((b) => !ids.has(String(b.id)));
      setBookings(next);
      writeLocal(next);

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
      const next = bookings.filter((b) => String(b.id) !== String(id));
      setBookings(next);
      writeLocal(next);
      if (user) await deleteBooking(user.uid, id).catch(() => {});
    },
    [bookings, user]
  );

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
      autoScanning, autoScanResult, cloudError,
    }),
    [bookings, trips, loading, addBookings, removeBooking, applyCancellations,
     autoScanning, autoScanResult, cloudError]
  );

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
};

export const useBookings = () => {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error('useBookings must be used within BookingsProvider');
  return ctx;
};
