/**
 * הרשמה להתראות דחיפה.
 *
 * המפתח הציבורי מיועד לחשיפה — הוא מזהה את השרת ששולח מול הדפדפן, ואינו
 * מאפשר לשלוח דבר. המפתח הפרטי יושב ב-Vercel בלבד.
 *
 * ── מגבלת iOS שחייבים לומר למשתמש ──
 * באייפון, PushManager קיים אך ורק כשהאתר הותקן במסך הבית
 * (שיתוף → הוסף למסך הבית). בלשונית Safari רגילה ההרשמה נכשלת, ולכן
 * חשוב לזהות את המצב ולהסביר אותו — במקום להציג כפתור שלא יעבוד.
 */

const VAPID_PUBLIC_KEY =
  'BLk3XREbVbR3a_I6IB4oJtMhC5mMIM8X6qX-FBG6r9b9jyHKD6-qpCW_yPUfsSO2LfRT_sZEjt16DWU8Ibnucj8';

/** ממיר את המפתח מ-base64url ל-Uint8Array, כפי ש-PushManager דורש. */
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

/** האם הדפדפן מותקן כאפליקציה (שורת התנאי של iOS). */
export const isInstalledApp = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/**
 * מצב התמיכה, עם הסבר מדויק כשאין.
 * @returns {{supported:boolean, reason:string}}
 */
export const pushSupport = () => {
  if (!('serviceWorker' in navigator)) {
    return { supported: false, reason: 'הדפדפן אינו תומך ב-Service Worker.' };
  }
  if (!('PushManager' in window)) {
    if (isIOS() && !isInstalledApp()) {
      return {
        supported: false,
        reason: 'באייפון התראות עובדות רק כשהאפליקציה מותקנת במסך הבית: שיתוף → הוסף למסך הבית.',
      };
    }
    return { supported: false, reason: 'הדפדפן אינו תומך בהתראות דחיפה.' };
  }
  if (!('Notification' in window)) {
    return { supported: false, reason: 'הדפדפן אינו תומך בהתראות.' };
  }
  return { supported: true, reason: '' };
};

/** ההרשמה הקיימת, אם המשתמש כבר אישר במכשיר הזה. */
export const currentSubscription = async () => {
  if (!pushSupport().supported) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
};

/**
 * מבקש רשות ונרשם.
 *
 * @returns {Promise<{ok:boolean, subscription?:object, error?:string}>}
 */
export const subscribeToPush = async () => {
  const support = pushSupport();
  if (!support.supported) return { ok: false, error: support.reason };

  // הבקשה חייבת לנבוע ממחווה של המשתמש. דפדפנים דוחים בקשה שנשלחת
  // מעצמה, ולכן הפונקציה נקראת מלחיצה על כפתור ולא בטעינה.
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return {
      ok: false,
      error: permission === 'denied'
        ? 'ההתראות נחסמו בהגדרות. יש לאשר אותן ידנית בהגדרות המכשיר.'
        : 'לא ניתנה רשות להתראות.',
    };
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const subscription = existing || await reg.pushManager.subscribe({
      // חובה: התראה שאינה מוצגת למשתמש נחסמת על ידי הדפדפן
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    return { ok: true, subscription: subscription.toJSON() };
  } catch (err) {
    return { ok: false, error: `ההרשמה נכשלה: ${err?.message || err}` };
  }
};

export const unsubscribeFromPush = async () => {
  const sub = await currentSubscription();
  if (!sub) return { ok: true };
  try {
    await sub.unsubscribe();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
};
