// services/consentService.js
//
// הסכמות המשתמש: לתנאים ולמדיניות, ולגילוי הנאות לפני סריקת Gmail.
//
// ── למה ההסכמה נשמרת בחשבון, ולא בדפדפן ──
// הסכמה היא ראיה: מי הסכים, לאיזה נוסח, ומתי. בדפדפן היא נמחקת עם
// ניקוי הנתונים, ואינה עוברת למכשיר השני — משתמש היה נשאל שוב בכל מכשיר,
// ולבעלים לא הייתה שום רשומה. `users/{uid}` מכוסה בכלל
// `users/{userId}/{document=**}`, ונמחק כבר במחיקת החשבון.
//
// ── למה גרסה ולא "הסכים / לא הסכים" ──
// Google דורשת לבקש הסכמה מחדש כשהשימוש בנתונים משתנה, ותיקון 13 לחוק
// הגנת הפרטיות דורש הסכמה מדעת לנוסח שהוצג. הסכמה לנוסח של ספטמבר אינה
// הסכמה לנוסח שעו"ד ישכתב. העלאת הגרסה כאן מציגה את החלון שוב לכולם.
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// להעלות כשמשתנה נוסח מהותי ב-src/legal/privacy.js או terms.js.
export const TERMS_VERSION = '2026-09-14';
// להעלות כשמשתנה מה נקרא מ-Gmail, לאן הוא נשלח או מה נשמר ממנו.
export const GMAIL_DISCLOSURE_VERSION = '2026-09-14';

const cacheKey = (uid) => `consent_v1_${uid}`;

const readCache = (uid) => {
  try { return JSON.parse(localStorage.getItem(cacheKey(uid)) || 'null'); } catch { return null; }
};
const writeCache = (uid, consent) => {
  try { localStorage.setItem(cacheKey(uid), JSON.stringify(consent)); } catch { /* מטמון בלבד */ }
};

/**
 * מחזיר את רשומת ההסכמות. המטמון המקומי מאפשר לא להבהב את החלון בכל
 * טעינה, אבל הוא אינו מקור אמת: הערך מהענן גובר כשהוא מגיע.
 * @returns {Promise<{terms?: {version:string}, gmail?: {version:string}}>}
 */
export const getConsent = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  const consent = (snap.exists() && snap.data().consent) || {};
  writeCache(uid, consent);
  return consent;
};

export const cachedConsent = (uid) => readCache(uid) || {};

/**
 * רושם הסכמה לנוסח הנוכחי. זורק אם הכתיבה נכשלה — הסכמה שלא נרשמה אינה
 * הסכמה, והמסך אינו רשאי להמשיך כאילו נרשמה.
 * @param {'terms'|'gmail'} kind
 */
export const recordConsent = async (uid, kind) => {
  const version = kind === 'gmail' ? GMAIL_DISCLOSURE_VERSION : TERMS_VERSION;
  await setDoc(doc(db, 'users', uid), {
    consent: { [kind]: { version, at: serverTimestamp() } },
  }, { merge: true });
  const next = { ...cachedConsent(uid), [kind]: { version } };
  writeCache(uid, next);
  return next;
};

export const hasCurrentTerms = (consent) => consent?.terms?.version === TERMS_VERSION;
export const hasCurrentGmailDisclosure = (consent) => consent?.gmail?.version === GMAIL_DISCLOSURE_VERSION;
