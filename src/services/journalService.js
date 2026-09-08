import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { markDeleted, loadDeletedIds } from './firestoreService';

const LS_KEY = 'journal_entries';

// ─── localStorage ──────────────────────────────────────────────

export function loadEntriesLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch { return []; }
}

/**
 * שמירה מקומית שמדווחת מה קרה.
 *
 * ── למה זה לא `catch {}` ──
 * כאן ישב `try { ... } catch {}` ריק. רשומת יומן נושאת עד חמש תמונות
 * base64, וכשמכסת ה-5MB של `localStorage` נגמרת `setItem` זורק
 * `QuotaExceededError`. ה-catch בלע, הסנכרון לענן בלע גם הוא, והמסך
 * הכריז "✅ צ׳ק-אין נשמר בהצלחה". אורח שאינו מחובר איבד את הרשומה
 * ברענון הבא בלי שדבר רמז על כך. דפוס 3 ב-CLAUDE.md: כישלון שדווח
 * כהצלחה.
 *
 * מוחזר אובייקט ולא בוליאני, כי לקורא יש שתי החלטות שונות לקבל:
 * האם להזהיר, ומה לומר. `quota` מפריד בין "אין מקום" — שלמשתמש יש
 * דרך לתקן אותו — לבין כשל אחר, שאין לו.
 *
 * @returns {{ok: boolean, quota: boolean, error?: string}}
 */
export function saveEntriesLocal(entries) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(entries));
    return { ok: true, quota: false };
  } catch (err) {
    // הדפדפנים אינם מסכימים על השם: Chrome/Firefox זורקים
    // `QuotaExceededError`, ספארי הישן `QUOTA_EXCEEDED_ERR`, ופיירפוקס
    // משתמש בקוד 1014. בדיקת שם אחד בלבד הייתה מסווגת חריגת מכסה
    // בספארי ככשל "לא ידוע" ומציגה הודעה שאינה עוזרת.
    const quota = err && (
      err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err.code === 22 || err.code === 1014
    );
    return { ok: false, quota: !!quota, error: err?.message || String(err) };
  }
}

// ─── Firestore ─────────────────────────────────────────────────

export async function saveEntry(uid, entry) {
  const ref = doc(db, 'users', uid, 'journal', String(entry.id));
  await setDoc(ref, entry);
}

export async function loadEntries(uid) {
  const snapshot = await getDocs(collection(db, 'users', uid, 'journal'));
  return snapshot.docs.map(d => d.data());
}

export async function deleteEntryFirestore(uid, entryId) {
  const ref = doc(db, 'users', uid, 'journal', String(entryId));
  await deleteDoc(ref);
  // בלי סימון, רשומה שנמחקה כאן תיראה במכשיר אחר כרשומה מקומית שטרם
  // סונכרנה, ותוצג שוב בכניסה הבאה.
  await markDeleted(uid, 'deletedJournal', entryId);
}

/** מזהי רשומות היומן שנמחקו. */
export const loadDeletedEntryIds = (uid) => loadDeletedIds(uid, 'deletedJournal');
