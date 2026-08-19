/**
 * גישת השרת ל-Firestore.
 *
 * הדפדפן ניגש למסד עם ההתחברות של המשתמש, וחוקי האבטחה מגבילים אותו
 * למסמכים שלו. לשרת אין התחברות כזו, ולכן הוא משתמש בחשבון שירות — הדרך
 * היחידה לקרוא את הטיסות של המשתמשים כשאיש אינו מחובר, כלומר בדיוק כשצריך
 * לשלוח התראה.
 *
 * המפתח מוגדר ב-Vercel כמשתנה סביבה FIREBASE_SERVICE_ACCOUNT ואינו נמצא
 * בקוד. הוא נותן גישה מלאה למסד, ולכן אין לו מקום בשום מקום אחר.
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let cached = null;

/**
 * @returns {{ok:true, db:object} | {ok:false, error:string}}
 *   מוחזר ולא נזרק, כדי שנקודת האבחון תוכל לדווח על התקלה בשפה ברורה
 *   במקום להחזיר 500 סתמי.
 */
export const getDb = () => {
  if (cached) return cached;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    return { ok: false, error: 'FIREBASE_SERVICE_ACCOUNT אינו מוגדר בשרת.' };
  }

  let creds;
  try {
    creds = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'FIREBASE_SERVICE_ACCOUNT אינו JSON תקין — ודא שהודבק כל תוכן הקובץ.' };
  }

  // הדבקה לממשק ניהול הופכת לעיתים \n אמיתי לשני תווים, והמפתח נפסל
  // בשגיאה שאינה מסבירה זאת.
  if (typeof creds.private_key === 'string') {
    creds.private_key = creds.private_key.replace(/\\n/g, '\n');
  }

  if (!creds.project_id || !creds.client_email || !creds.private_key) {
    return { ok: false, error: 'חסרים שדות במפתח חשבון השירות (project_id / client_email / private_key).' };
  }

  try {
    const app = getApps().length
      ? getApps()[0]
      : initializeApp({ credential: cert(creds), projectId: creds.project_id });
    cached = { ok: true, db: getFirestore(app), projectId: creds.project_id };
    return cached;
  } catch (err) {
    return { ok: false, error: `אתחול Firebase נכשל: ${err?.message || err}` };
  }
};
