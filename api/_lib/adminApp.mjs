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
 * מעבר שורה אמיתי בתוך מחרוזת אסור ב-JSON.
 *
 * בקובץ של Firebase השדה private_key מכיל \n כשני תווים. העתקה דרך
 * עורכי טקסט או שדה טופס ממירה אותם לעיתים לשורות אמיתיות, וה-JSON נפסל
 * בשגיאה שאינה מסבירה מה קרה. התיקון מחליף מעברי שורה שנמצאים בתוך
 * מחרוזת בלבד — מעברי שורה בין שדות הם חוקיים ואין לגעת בהם.
 */
const escapeNewlinesInStrings = (text) => {
  let out = '';
  let inString = false;
  let escaped = false;

  for (const ch of text) {
    if (escaped) {
      out += ch;
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      out += ch;
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      out += ch;
      continue;
    }
    if (inString && (ch === '\n' || ch === '\r')) {
      out += ch === '\n' ? '\\n' : '\\r';
      continue;
    }
    out += ch;
  }
  return out;
};

/**
 * קריאת מפתח חשבון השירות, עם תיקונים לתקלות הדבקה שכיחות.
 *
 * כל תיקון מדווח בשמו, כדי שנדע מה בדיוק היה פגום במקום לנחש.
 */
const parseServiceAccount = (raw) => {
  const attempts = [
    ['as-is', (t) => t],
    ['trim', (t) => t.trim()],
    // ממשקי ניהול מסוימים עוטפים את הערך במרכאות
    ['unquote', (t) => t.trim().replace(/^['"]|['"]$/g, '')],
    ['escape-newlines', (t) => escapeNewlinesInStrings(t.trim())],
    ['unquote+escape', (t) => escapeNewlinesInStrings(t.trim().replace(/^['"]|['"]$/g, ''))],
  ];

  let lastPosition = null;

  for (const [name, fix] of attempts) {
    try {
      const creds = JSON.parse(fix(raw));
      // גם אחרי פענוח מוצלח, המפתח עצמו עשוי להכיל \n כשני תווים
      if (typeof creds.private_key === 'string') {
        creds.private_key = creds.private_key.replace(/\\n/g, '\n');
      }
      return { creds, repaired: name };
    } catch (err) {
      // רק המקום נשמר ולא הודעת השגיאה: היא עלולה לכלול קטע מהמפתח עצמו
      const m = /position (\d+)/.exec(String(err?.message || ''));
      if (m) lastPosition = Number(m[1]);
    }
  }

  return {
    creds: null,
    error:
      'FIREBASE_SERVICE_ACCOUNT אינו JSON תקין' +
      (lastPosition != null ? ` (התקלה סביב תו ${lastPosition})` : '') +
      '. ודא שהודבק כל תוכן הקובץ, מ-{ עד }, בלי מרכאות עוטפות.',
  };
};

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

  const { creds, repaired, error } = parseServiceAccount(raw);
  if (!creds) return { ok: false, error };

  if (!creds.project_id || !creds.client_email || !creds.private_key) {
    return { ok: false, error: 'חסרים שדות במפתח חשבון השירות (project_id / client_email / private_key).' };
  }

  try {
    const app = getApps().length
      ? getApps()[0]
      : initializeApp({ credential: cert(creds), projectId: creds.project_id });
    cached = { ok: true, db: getFirestore(app), projectId: creds.project_id, repaired };
    return cached;
  } catch (err) {
    return { ok: false, error: `אתחול Firebase נכשל: ${err?.message || err}` };
  }
};
