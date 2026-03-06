import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

const LS_KEY = 'journal_entries';

// ─── localStorage ──────────────────────────────────────────────

export function loadEntriesLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch { return []; }
}

export function saveEntriesLocal(entries) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(entries)); } catch {}
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
}
