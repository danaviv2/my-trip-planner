import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { saveBooking, loadBookings, deleteBooking } from '../services/firestoreService';
import { groupBookingsIntoTrips } from '../services/tripGroupingService';

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
const bookingKey = (b) => {
  const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, '');
  const type = b.type || '';

  if (type === 'flight') {
    return ['flight', norm(b.flightNumber), norm(b.date), norm(b.departureAirport)].join('|');
  }
  if (type === 'car_rental') {
    return ['car', norm(b.company), norm(b.pickupDate)].join('|');
  }
  if (type === 'hotel') {
    return ['hotel', norm(b.name), norm(b.checkIn)].join('|');
  }
  return [type, norm(b.confirmationNumber), norm(b.date || b.checkIn)].join('|');
};

/**
 * מסיר כפילויות מרשימה קיימת. נדרש כי רשומות שנשמרו לפני תיקון המפתח
 * עדיין במאגר, ובלעדיו אותה נסיעה מוצגת פעמיים.
 */
const dedupe = (list = []) => {
  const seen = new Set();
  return list.filter((b) => {
    const k = bookingKey(b);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

export const BookingsProvider = ({ children }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      if (user) {
        try {
          const remote = await loadBookings(user.uid);
          const local = readLocal();
          // מיזוג: מה שנשמר מקומית לפני ההתחברות עולה לענן
          const seen = new Set(remote.map(bookingKey));
          const toUpload = local.filter((b) => !seen.has(bookingKey(b)));
          await Promise.all(toUpload.map((b) => saveBooking(user.uid, b).catch(() => {})));
          const merged = [...remote, ...toUpload];
          const clean = dedupe(merged);
          // הניקוי חייב להישמר, אחרת הכפילויות חוזרות בכל טעינה
          if (clean.length < merged.length) {
            const keep = new Set(clean.map((b) => String(b.id)));
            const stale = merged.filter((b) => !keep.has(String(b.id)));
            await Promise.all(stale.map((b) => deleteBooking(user.uid, b.id).catch(() => {})));
          }
          writeLocal(clean);
          if (!cancelled) setBookings(clean);
        } catch {
          if (!cancelled) {
            const clean = dedupe(readLocal());
            writeLocal(clean);
            setBookings(clean);
          }
        }
      } else if (!cancelled) {
        const clean = dedupe(readLocal());
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
      const list = Array.isArray(incoming) ? incoming : [incoming];
      const existing = new Set(bookings.map(bookingKey));

      const fresh = list
        .filter((b) => b && !existing.has(bookingKey(b)))
        .map((b) => ({
          ...b,
          id: b.id || `bk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          importedAt: new Date().toISOString(),
        }));

      if (!fresh.length) return { added: 0, skipped: list.length };

      const next = [...bookings, ...fresh];
      setBookings(next);
      writeLocal(next);

      if (user) {
        await Promise.all(fresh.map((b) => saveBooking(user.uid, b).catch(() => {})));
      }

      return { added: fresh.length, skipped: list.length - fresh.length };
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

  // הטיולים נגזרים מההזמנות ומתעדכנים אוטומטית עם כל אישור חדש
  const trips = useMemo(() => groupBookingsIntoTrips(bookings), [bookings]);

  const value = useMemo(
    () => ({ bookings, trips, loading, addBookings, removeBooking }),
    [bookings, trips, loading, addBookings, removeBooking]
  );

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
};

export const useBookings = () => {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error('useBookings must be used within BookingsProvider');
  return ctx;
};
