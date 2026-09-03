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

/**
 * תיאור מבני של הערך שהודבק, בלי לחשוף אותו.
 *
 * "התקלה סביב תו 6" אינו מספיק כדי לדעת מה קרה, והמשתמש רואה קובץ שנראה
 * תקין. במקום עוד סבב ניחוש — כמה עובדות על צורת הערך: אורך, תו ראשון
 * ואחרון, אילו שדות מזוהים, ואילו תווים בעייתיים נוכחים.
 *
 * שום קטע מהמפתח אינו מוחזר. גם התו הראשון והאחרון הם סימני מבנה בלבד
 * ('{' ו-'}'), ומספרים אינם מגלים תוכן.
 */
const fingerprint = (raw) => {
  if (!raw) return null;
  const curly = /[\u201C\u201D\u2018\u2019]/.test(raw);
  return {
    length: raw.length,
    firstChar: raw.trim().charAt(0) || '',
    lastChar: raw.trim().slice(-1) || '',
    hasTypeField: raw.includes('"type"'),
    hasPrivateKeyField: raw.includes('"private_key"'),
    hasClientEmailField: raw.includes('"client_email"'),
    quoteCount: (raw.match(/"/g) || []).length,
    hasCurlyQuotes: curly,
    hasEscapedNewline: raw.includes('\\n'),
    hasRawNewline: /\r|\n/.test(raw),
    startsWithBom: raw.charCodeAt(0) === 0xfeff,
  };
};

export default async function handler(req, res) {
  // עד 04.09.2026 לא היה כאן שום שומר — אפילו לא בדיקת method — והבדיקה
  // רצה בהרשאות אדמין בכל פנייה. נמדד חי: בקשה אנונימית החזירה את מזהה
  // הפרויקט ואת מספרי המשתמשים, ההרשמות והטיסות. זהו כלי אבחון של בעל
  // האתר ולא משטח ציבורי, ולכן הסוד שכבר משמש את הקרון מתאים גם כאן.
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return res.status(503).json({ error: 'CRON_SECRET אינו מוגדר בשרת.' });
  }
  const provided =
    (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || req.query?.token || '';
  if (provided !== secret) {
    return res.status(401).json({ error: 'unauthorized' });
  }

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
    report.valueShape = fingerprint(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    report.serviceAccount = true;
    report.projectId = conn.projectId;
    // איזה תיקון נדרש כדי לקרוא את המפתח. 'as-is' פירושו שהודבק תקין.
    report.repaired = conn.repaired;

    // קריאה אמיתית ולא בדיקת קיום מפתח: מפתח תקין שאין לו הרשאות ייכשל
    // רק כאן, וזו בדיוק התקלה שקשה לאבחן אחר כך.
    //
    // listDocuments ולא get: מסמך שיש לו רק תת-אוספים ואין לו שדות אינו
    // מופיע בשאילתת אוסף. האפליקציה כותבת users/{uid}/bookings/... ולא את
    // המסמך users/{uid} עצמו, ולכן get החזיר אפס משתמשים — והבדיקה דיווחה
    // תצורה תקינה בעוד השרת לא רואה שום נתון.
    try {
      const refs = await conn.db.collection('users').listDocuments();
      report.firestoreRead = true;
      report.users = refs.length;

      let subs = 0;
      let flights = 0;
      for (const ref of refs.slice(0, 10)) {
        const s = await ref.collection('pushSubscriptions').count().get();
        subs += s.data().count;
        const f = await ref.collection('bookings').where('type', '==', 'flight').count().get();
        flights += f.data().count;
      }
      report.subscriptions = subs;
      report.flights = flights;
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
