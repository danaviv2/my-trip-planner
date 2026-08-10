/**
 * הנפקת טוקן Gmail ללא התערבות המשתמש.
 *
 * ההתחברות דרך Firebase מחזירה טוקן שתקף לשעה וללא refresh token, ולכן
 * לא ניתן לרענן אותו — כל סריקה חייבת חלון קופץ ולחיצה. Google Identity
 * Services פותר זאת: לאחר שהמשתמש אישר את ההרשאה פעם אחת, אפשר לבקש
 * טוקן חדש בשקט (prompt ריק) והדפדפן מנפיק אותו ללא כל תצוגה.
 *
 * היתרון על פני refresh token בצד שרת: אין client secret, ואין צורך
 * לאחסן אצלנו אישור גישה קבוע לתיבת הדואר של המשתמש.
 *
 * המגבלה: הדפדפן חייב להיות מחובר לחשבון Google. אם החשבון נותק או
 * ההרשאה בוטלה, בקשה שקטה נכשלת — ואז חוזרים לאישור מפורש פעם אחת.
 */

const GIS_SRC = 'https://accounts.google.com/gsi/client';
export const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

/** סימון מקומי שהמשתמש כבר אישר. בלעדיו לא מנסים בקשה שקטה. */
const GRANTED_KEY = 'gmailConsentGranted';

export const hasGmailConsent = () => {
  try {
    return localStorage.getItem(GRANTED_KEY) === '1';
  } catch {
    return false;
  }
};

export const setGmailConsent = (granted) => {
  try {
    if (granted) localStorage.setItem(GRANTED_KEY, '1');
    else localStorage.removeItem(GRANTED_KEY);
  } catch {}
};

export const getClientId = () => process.env.REACT_APP_GOOGLE_OAUTH_CLIENT_ID || '';

let scriptPromise = null;

/** טוען את ספריית GIS פעם אחת בלבד. */
const loadGis = () => {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('GIS_LOAD_FAILED')));
      return;
    }
    const el = document.createElement('script');
    el.src = GIS_SRC;
    el.async = true;
    el.defer = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error('GIS_LOAD_FAILED'));
    document.head.appendChild(el);
  });

  return scriptPromise;
};

/**
 * מבקש טוקן גישה ל-Gmail.
 *
 * @param {object} opts
 * @param {boolean} opts.silent ללא כל תצוגה. נכשל אם ההרשאה לא ניתנה עדיין.
 * @param {boolean} opts.chooseAccount לאלץ מסך בחירת חשבון ואישור מחדש.
 *                                      נחוץ רק כשרוצים לסרוק תיבה אחרת.
 * @param {string}  opts.loginHint כתובת המייל של המשתמש המחובר, כדי שלא
 *                                 יידרש לבחור חשבון כשיש כמה בדפדפן.
 * @returns {Promise<string>} access token
 */
export const requestGmailToken = async ({ silent = false, loginHint = '', chooseAccount = false } = {}) => {
  const clientId = getClientId();
  if (!clientId) throw new Error('NO_CLIENT_ID');

  await loadGis();

  return new Promise((resolve, reject) => {
    let settled = false;

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GMAIL_SCOPE,
      // מחרוזת ריקה = אל תציג דבר אם ההרשאה כבר קיימת. גם בבקשה שאינה
      // שקטה אין טעם לאלץ אישור מחדש: גוגל תציג מסך רק אם באמת צריך.
      // אילוץ 'consent' בכל פעם הכריח בחירת חשבון גם כשהכול כבר אושר.
      prompt: chooseAccount ? 'consent' : '',
      login_hint: loginHint || undefined,
      callback: (res) => {
        if (settled) return;
        settled = true;
        if (res?.access_token) {
          setGmailConsent(true);
          resolve(res.access_token);
        } else {
          reject(new Error(res?.error || 'NO_TOKEN'));
        }
      },
      error_callback: (err) => {
        if (settled) return;
        settled = true;
        // ההרשאה בוטלה או שאין חשבון מחובר — בקשה שקטה לא תעבוד יותר.
        // חשוב: פקיעת טוקן אינה מגיעה לכאן. טוקן פג אחרי שעה מעצם תכנונו,
        // וזו אינה עדות לכך שההרשאה נשללה.
        if (silent) setGmailConsent(false);
        reject(new Error(err?.type || 'TOKEN_REQUEST_FAILED'));
      },
    });

    // בקשה שקטה עלולה להישאר ללא תשובה כשחסימת עוגיות צד-שלישי פעילה.
    // בלי תקציב זמן ה-Promise לא ייושב לעולם והסריקה תיתקע.
    if (silent) {
      setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error('SILENT_TIMEOUT'));
      }, 8000);
    }

    client.requestAccessToken();
  });
};
