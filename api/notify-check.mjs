/**
 * בדיקת תצורה להתראות.
 *
 * הוגדרו כאן שלושה משתני סביבה, וטעות באחד מהם מתגלה בדרך כלל רק כשהתראה
 * אינה מגיעה — כלומר במקרה שבו היא באמת נחוצה. הבדיקה הזו הופכת את זה
 * לשאלה של שנייה.
 *
 * התשובה כוללת מצב בלבד ולא ערכים: מפתח פרטי או כתובת חשבון שירות לא
 * יוצאים מכאן בשום מצב.
 */

import { getDb } from './_lib/adminApp.mjs';

export default async function handler(req, res) {
  const report = {
    vapidPrivateKey: !!process.env.VAPID_PRIVATE_KEY,
    vapidSubject: !!process.env.VAPID_SUBJECT,
    serviceAccount: false,
    firestoreRead: false,
    subscriptions: 0,
    errors: [],
  };

  if (process.env.VAPID_SUBJECT && !/^mailto:.+@.+/.test(process.env.VAPID_SUBJECT)) {
    report.errors.push('VAPID_SUBJECT חייב להיות בצורת mailto:כתובת@דומיין');
  }

  const conn = getDb();
  if (!conn.ok) {
    report.errors.push(conn.error);
  } else {
    report.serviceAccount = true;
    report.projectId = conn.projectId;

    // קריאה אמיתית ולא בדיקת קיום מפתח: מפתח תקין שאין לו הרשאות ייכשל
    // רק כאן, וזו בדיוק התקלה שקשה לאבחן אחר כך.
    try {
      const users = await conn.db.collection('users').limit(5).get();
      report.firestoreRead = true;
      report.users = users.size;

      let subs = 0;
      for (const u of users.docs) {
        const s = await u.ref.collection('pushSubscriptions').count().get();
        subs += s.data().count;
      }
      report.subscriptions = subs;
    } catch (err) {
      report.errors.push(`קריאה מ-Firestore נכשלה: ${err?.message || err}`);
    }
  }

  const ready = report.vapidPrivateKey && report.vapidSubject && report.firestoreRead;

  return res.status(ready ? 200 : 503).json({
    ready,
    summary: ready
      ? report.subscriptions > 0
        ? 'התצורה תקינה ויש מכשירים רשומים.'
        : 'התצורה תקינה. עדיין לא נרשם מכשיר — הפעל התראות באפליקציה.'
      : 'התצורה אינה שלמה. ראה errors.',
    ...report,
  });
}
