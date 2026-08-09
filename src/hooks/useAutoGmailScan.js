import { useEffect, useRef, useState } from 'react';
import { requestGmailToken, hasGmailConsent, getClientId } from '../services/googleTokenClient';
import { scanMailbox } from '../services/bookingScanService';

/**
 * סריקה שקטה של תיבת הדואר בפתיחת האפליקציה.
 *
 * זה ההבדל בין כלי שצריך לזכור להפעיל לבין כלי שהמידע כבר מחכה בו: אחרי
 * אישור ההרשאה פעם אחת, אישור הזמנה שהגיע למייל מופיע כנסיעה מבלי שהמשתמש
 * עשה דבר. אין חלון קופץ ואין לחיצה — הטוקן מונפק בשקט.
 *
 * הסריקה אינה רצה בכל טעינת דף. סריקה מלאה עולה קריאות Gemini לכל מייל,
 * ולכן יש מרווח מינימלי בין סריקות, והסריקה השוטפת מוגבלת לטווח קצר
 * אחורה — אישור חדש מגיע בימים האחרונים, לא לפני חצי שנה.
 */

const LAST_SCAN_KEY = 'gmailLastAutoScan';

// מרווח מינימלי בין סריקות אוטומטיות
const MIN_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 שעות

// השהיה קצרה אחרי טעינה, כדי שהסריקה לא תתחרה על הרשת עם ציור המסך
const START_DELAY_MS = 2500;

const readLastScan = () => {
  try {
    return Number(localStorage.getItem(LAST_SCAN_KEY)) || 0;
  } catch {
    return 0;
  }
};

const writeLastScan = (ts) => {
  try {
    localStorage.setItem(LAST_SCAN_KEY, String(ts));
  } catch {}
};

/**
 * @param {object} opts
 * @param {object|null} opts.user המשתמש המחובר
 * @param {(bookings:Array)=>Promise<{added:number}>} opts.addBookings
 * @param {boolean} opts.ready האם המאגר סיים להיטען
 * @returns {{scanning:boolean, lastResult:{added:number, scanned:number}|null}}
 */
export const useAutoGmailScan = ({ user, addBookings, applyCancellations, ready }) => {
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  // מונע סריקה כפולה כשהרכיב נטען מחדש או ש-user מתעדכן
  const startedRef = useRef(false);

  useEffect(() => {
    if (!user || !ready || startedRef.current) return;
    if (!getClientId() || !hasGmailConsent()) return;

    const sinceLast = Date.now() - readLastScan();
    if (sinceLast < MIN_INTERVAL_MS) return;

    startedRef.current = true;
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const token = await requestGmailToken({ silent: true, loginHint: user.email || '' });
        if (cancelled) return;

        setScanning(true);
        // טווח קצר: הסריקה השוטפת מחפשת מה שהגיע לאחרונה, לא היסטוריה
        const { emails, bookings, cancellations } = await scanMailbox(token, {
          maxResults: 25,
          monthsBack: 2,
        });
        if (cancelled) return;

        const { added } = bookings.length ? await addBookings(bookings) : { added: 0 };
        // ביטול שהגיע בזמן שהמשתמש לא הסתכל חשוב לא פחות מהזמנה חדשה
        if (cancellations?.length) await applyCancellations(cancellations);
        writeLastScan(Date.now());
        if (!cancelled) setLastResult({ added, scanned: emails.length });
      } catch {
        // כישלון שקט הוא הכוונה: המשתמש לא ביקש דבר, ואין סיבה להטריד
        // אותו בשגיאה. הייבוא הידני נשאר זמין בכל מקרה.
      } finally {
        if (!cancelled) setScanning(false);
      }
    }, START_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [user, ready, addBookings, applyCancellations]);

  return { scanning, lastResult };
};
