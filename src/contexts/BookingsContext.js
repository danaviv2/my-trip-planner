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

/** מזהה יציב לפי תוכן ההזמנה, כדי שייבוא כפול של אותו מייל לא ייצור כפילות. */
const bookingKey = (b) => {
  const parts = [
    b.type || '',
    b.confirmationNumber || '',
    b.flightNumber || '',
    b.date || b.pickupDate || b.checkIn || '',
    b.name || b.company || b.airline || '',
  ];
  return parts.join('|').toLowerCase();
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
          if (!cancelled) setBookings([...remote, ...toUpload]);
        } catch {
          if (!cancelled) setBookings(readLocal());
        }
      } else if (!cancelled) {
        setBookings(readLocal());
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
