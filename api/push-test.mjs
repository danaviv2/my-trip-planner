/**
 * שליחת התראת בדיקה למכשירי המשתמש.
 *
 * החוליה היחידה שלא נבדקה בשום שלב היא הדחיפה עצמה: שרת → שירות הדחיפה →
 * המכשיר. ההרשמה נשמרה, התצורה אומתה, והקרון רץ בהצלחה — אך דבר לא נשלח
 * בפועל. כישלון שם יתגלה בפעם הראשונה שתהיה טיסה מתעכבת, כלומר ברגע היחיד
 * שבו זה משנה.
 *
 * ── מדוע אימות ולא סוד משותף ──
 * הקרון מוגן בסוד כי אין לו משתמש. כאן יש: הבקשה נושאת אסימון זהות של
 * Firebase, והשרת מאמת אותו ושולח אך ורק למכשירים של אותו משתמש. בלי זה
 * הייתה כאן דרך פתוחה להציף התראות של אחרים.
 */

import webpush from 'web-push';
import { getDb } from './_lib/adminApp.mjs';

const VAPID_PUBLIC = 'BLk3XREbVbR3a_I6IB4oJtMhC5mMIM8X6qX-FBG6r9b9jyHKD6-qpCW_yPUfsSO2LfRT_sZEjt16DWU8Ibnucj8';

/**
 * פונקציה שקורסת מחזירה דף שגיאה של הפלטפורמה — טקסט, לא JSON — והלקוח
 * נכשל בפענוח עם הודעה שאינה מסבירה דבר ("The string did not match the
 * expected pattern"). לכן כל הגוף עטוף, וכל תקלה חוזרת כ-JSON שאומר מה קרה.
 */
export default async function handler(req, res) {
  try {
    return await run(req, res);
  } catch (err) {
    return res.status(500).json({
      error: `הפונקציה נכשלה: ${err?.message || err}`,
      where: String(err?.stack || '').split('\n')[1]?.trim() || '',
    });
  }
}

async function run(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) {
    return res.status(503).json({ error: 'מפתחות VAPID אינם מוגדרים בשרת.' });
  }

  const conn = getDb();
  if (!conn.ok) return res.status(503).json({ error: conn.error });

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'חסר אסימון זהות.' });

  // ייבוא דינמי: כשל בטעינת תת-המודול הזה בסביבת הריצה היה מפיל את
  // הפונקציה כולה עוד לפני שהיא מתחילה, ואז אין מי שידווח מה קרה.
  let uid;
  try {
    const { getAuth } = await import('firebase-admin/auth');
    uid = (await getAuth().verifyIdToken(token)).uid;
  } catch (err) {
    const msg = String(err?.message || err);
    // הבחנה חשובה: אסימון פסול היא תקלת משתמש, כשל בטעינת המודול היא
    // תקלת שרת. הודעה אחת לשתיהן הייתה שולחת אותנו לכיוון הלא נכון.
    const isTokenProblem = /token|expired|argument|decode|aud|iss/i.test(msg);
    return res.status(isTokenProblem ? 401 : 500).json({
      error: isTokenProblem
        ? 'אסימון הזהות אינו תקף. התחבר מחדש ונסה שוב.'
        : `אימות הזהות נכשל בשרת: ${msg}`,
    });
  }

  webpush.setVapidDetails(process.env.VAPID_SUBJECT, VAPID_PUBLIC, process.env.VAPID_PRIVATE_KEY);

  const subs = await conn.db.collection('users').doc(uid).collection('pushSubscriptions').get();
  if (subs.empty) {
    return res.status(404).json({
      error: 'לא נמצאה הרשמה להתראות. הפעל אותן במסך ונסה שוב.',
    });
  }

  const payload = JSON.stringify({
    title: '✅ ההתראות עובדות',
    body: 'זו התראת בדיקה. כשתהיה טיסה מתעכבת, ההודעה תגיע בדיוק כך — גם כשהאפליקציה סגורה.',
    tag: 'push-test',
    url: '/travel-info',
  });

  let sent = 0;
  let expired = 0;
  const errors = [];

  for (const sub of subs.docs) {
    const data = sub.data();
    try {
      await webpush.sendNotification({ endpoint: data.endpoint, keys: data.keys }, payload);
      sent++;
    } catch (err) {
      // הרשמה שפגה נמחקת, אחרת היא תכשיל כל בדיקה עתידית
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await sub.ref.delete().catch(() => {});
        expired++;
      } else {
        errors.push(`${err?.statusCode || ''} ${err?.body || err?.message || 'failed'}`.trim());
      }
    }
  }

  // הצלחה מדווחת לפי מה שנשלח בפועל ולא לפי כך שהקוד רץ עד סופו.
  if (!sent) {
    return res.status(502).json({
      sent, expired, errors,
      error: expired
        ? 'ההרשמה במכשיר פגה והוסרה. הפעל את ההתראות מחדש.'
        : 'השליחה נכשלה. ראה errors.',
    });
  }

  return res.status(200).json({ sent, expired, errors, devices: subs.size });
}
