/**
 * בדיקה תקופתית של עיכובים, ושליחת התראה כשיש שינוי.
 *
 * זו הנקודה שבה ההתראה באמת נוצרת. הערך אינו בנוחות אלא בזמן: עיכוב
 * שמתגלה בשדה התעופה כבר מאוחר מכדי לשנות הסעה או להודיע למלון, ועיכוב
 * שמתגלה שעתיים מראש הוא הבדל בין נסיעה מתוקנת לנסיעה הרוסה.
 *
 * ── הפעלה ──
 * ב-Hobby, Vercel Cron מוגבל לפעם ביום, מה שחסר תועלת לעיכובים. לכן
 * ההפעלה נעשית מ-GitHub Actions כל חצי שעה, עם סוד משותף.
 *
 * ── מדוע listDocuments ולא get ──
 * מסמך שיש לו רק תת-אוספים ואין לו שדות אינו מופיע בשאילתת אוסף. האפליקציה
 * כותבת users/{uid}/bookings/... ולא את המסמך users/{uid} עצמו, ולכן
 * שאילתה רגילה מחזירה אפס משתמשים — והקרון היה רץ, מדווח הצלחה, ולא עושה
 * דבר. listDocuments מחזיר גם הפניות כאלה.
 */

import webpush from 'web-push';
import { getDb } from './_lib/adminApp.mjs';
import { fetchFlight, delayFrom, flightAlertKey } from './_lib/flightStatus.mjs';

/** מהעיכוב הזה ואילך שווה להודיע: מספיק כדי לשנות הסעה. */
const NOTIFY_MINUTES = 30;

/** הרף של EU261. מעליו העיכוב שווה כסף, ולכן ההתראה שונה. */
const EU261_MINUTES = 180;

/** טווח הבדיקה: טיסה רחוקה מזו עוד תשתנה, ואין ערך בהתראה עליה. */
const HORIZON_HOURS = 36;

const dayKey = (d) => d.toISOString().slice(0, 10);

/**
 * דלי העיכוב. ההתראה נשלחת כשהדלי משתנה ולא בכל בדיקה — אחרת המשתמש היה
 * מקבל הודעה כל חצי שעה על אותו עיכוב, והיה מכבה את ההתראות.
 */
const bucketOf = (minutes) => {
  if (minutes == null || minutes < NOTIFY_MINUTES) return 'none';
  if (minutes >= EU261_MINUTES) return 'eu261';
  if (minutes >= 120) return 'over2h';
  if (minutes >= 60) return 'over1h';
  return 'over30m';
};

const messageFor = (flight, info, bucket) => {
  const num = flight.flightNumber || 'הטיסה';
  const mins = info.delay;
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  const human = hours ? `${hours} שעות${rest ? ` ו-${rest} דקות` : ''}` : `${rest} דקות`;
  const route = info.departureAirport && info.arrivalAirport
    ? ` (${info.departureAirport}→${info.arrivalAirport})`
    : '';

  if (bucket === 'eu261') {
    return {
      title: `⚠️ ${num} מתעכבת ${human}`,
      body: info.basis === 'arrival'
        ? `העיכוב בהגעה חצה 3 שעות — ייתכן שמגיע לך פיצוי של עד €600 לפי EU261. פתח כדי לבדוק.`
        : `העיכוב בהמראה חצה 3 שעות. הפיצוי נקבע לפי שעת ההגעה — פתח כדי לעקוב.`,
      tag: `delay-${num}`,
    };
  }

  return {
    title: `${num} מתעכבת ${human}`,
    body: `${info.basis === 'arrival' ? 'עיכוב בהגעה' : 'עיכוב בהמראה'}${route}. שווה לבדוק הסעות ולינה.`,
    tag: `delay-${num}`,
  };
};

export default async function handler(req, res) {
  // נקודת קצה ששולחת התראות חייבת להיות מוגנת: בלי סוד, כל אחד היה יכול
  // להפעיל אותה ולהציף את המכשירים.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return res.status(503).json({ error: 'CRON_SECRET אינו מוגדר בשרת.' });
  }
  const provided =
    (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || req.query?.token || '';
  if (provided !== secret) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const vapidPublic = 'BLk3XREbVbR3a_I6IB4oJtMhC5mMIM8X6qX-FBG6r9b9jyHKD6-qpCW_yPUfsSO2LfRT_sZEjt16DWU8Ibnucj8';
  if (!process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) {
    return res.status(503).json({ error: 'מפתחות VAPID אינם מוגדרים.' });
  }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT, vapidPublic, process.env.VAPID_PRIVATE_KEY);

  const conn = getDb();
  if (!conn.ok) return res.status(503).json({ error: conn.error });
  const db = conn.db;

  const report = { users: 0, flightsChecked: 0, delayed: 0, notified: 0, skipped: 0, errors: [] };
  const now = Date.now();
  const horizon = now + HORIZON_HOURS * 3600 * 1000;

  let userRefs = [];
  try {
    userRefs = await db.collection('users').listDocuments();
  } catch (err) {
    return res.status(500).json({ error: `קריאת המשתמשים נכשלה: ${err?.message || err}` });
  }
  report.users = userRefs.length;

  for (const userRef of userRefs) {
    try {
      const subsSnap = await userRef.collection('pushSubscriptions').get();
      if (subsSnap.empty) continue;

      const flightsSnap = await userRef.collection('bookings').where('type', '==', 'flight').get();

      for (const doc of flightsSnap.docs) {
        const flight = doc.data();
        if (!flight.flightNumber || !flight.date) continue;

        const when = Date.parse(`${flight.date}T00:00:00Z`);
        if (Number.isNaN(when) || when > horizon || when < now - 24 * 3600 * 1000) {
          report.skipped++;
          continue;
        }

        report.flightsChecked++;
        const result = await fetchFlight(flight.flightNumber, dayKey(new Date(when)));
        if (!result.ok) {
          if (result.code !== 'NOT_FOUND') report.errors.push(`${flight.flightNumber}: ${result.code}`);
          continue;
        }

        const info = delayFrom(result.leg);
        const bucket = bucketOf(info.delay);
        if (bucket === 'none') continue;
        report.delayed++;

        // מצב ההתראה ממופתח לפי זהות הטיסה ולא לפי מזהה המסמך.
        //
        // הענן עשוי להחזיק שתי רשומות לאותה טיסה — למשל כשהאיחוד נאכף
        // מקומית ומחיקת המסמך בענן לא הושלמה. מפתוח לפי מזהה מסמך היה
        // מייצר שתי רשומות התראה, ושולח שתי הודעות על אותו עיכוב.
        // זהות הטיסה יציבה גם כשהניירת כפולה.
        const stateRef = userRef
          .collection('flightAlerts')
          .doc(flightAlertKey(flight.flightNumber, flight.date));
        const prev = (await stateRef.get()).data()?.bucket || 'none';
        if (prev === bucket) continue;

        const msg = messageFor(flight, info, bucket);
        const payload = JSON.stringify({ ...msg, url: '/travel-info' });

        for (const sub of subsSnap.docs) {
          const data = sub.data();
          try {
            await webpush.sendNotification(
              { endpoint: data.endpoint, keys: data.keys },
              payload
            );
            report.notified++;
          } catch (err) {
            // 404/410 פירושם שההרשמה פגה. השארתה תגרום לכישלון בכל בדיקה
            // עתידית, ולכן היא נמחקת.
            if (err?.statusCode === 404 || err?.statusCode === 410) {
              await sub.ref.delete().catch(() => {});
            } else {
              report.errors.push(`push: ${err?.statusCode || err?.message || 'failed'}`);
            }
          }
        }

        await stateRef.set({
          bucket,
          delay: info.delay,
          basis: info.basis,
          flightNumber: flight.flightNumber,
          date: flight.date,
          notifiedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      report.errors.push(`user: ${err?.message || err}`);
    }
  }

  return res.status(200).json(report);
}
