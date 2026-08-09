import { doc, getDoc, setDoc, updateDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * חדר הצבעה קבוצתי.
 *
 * עד כה החדר נשמר ב-localStorage בלבד: הקוד הועתק ונשלח לחברים, אך
 * "הצטרפות" קראה מפתח קבוע במכשיר הנוכחי והתעלמה לחלוטין מהקוד שהוקלד.
 * חבר שפתח את הקישור במכשיר שלו לא ראה דבר. התכונה הוצגה כשיתופית
 * והייתה למעשה כלי למכשיר אחד.
 *
 * ── מודל ההרשאות ──
 * חדר משותף אינו יכול לחיות תחת users/{uid}, שכן כמה אנשים ניגשים אליו.
 * לכן ההגנה נשענת על שלושה דברים, וכולם נאכפים בחוקי Firestore ולא כאן:
 *
 * 1. הקוד אינו ניתן לניחוש ואינו ניתן למניה — הרשאת list חסומה לחלוטין,
 *    כך שאי אפשר לגלות חדרים בלי לדעת את הקוד המדויק.
 * 2. הצבעה נשמרת תחת המזהה של המצביע, וחוק אוכף שמשתמש רשאי לשנות רק
 *    את המפתח של עצמו. משתתף אינו יכול למחוק הצבעה של אחר או להצביע
 *    פעמיים.
 * 3. מבנה המסמך והגדלים מאומתים בחוקים. ולידציה בצד הלקוח חסרת ערך
 *    מול מי שקורא ל-API ישירות.
 */

const COLLECTION = 'groupTrips';

/** תוקף החדר. חדר נטוש אינו נשאר לנצח. */
const LIFETIME_DAYS = 30;

// ללא תווים שמתבלבלים בהקראה בטלפון: 0/O, 1/I/L
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 10;

/**
 * קוד חדר אקראי מבוסס מקור אקראיות קריפטוגרפי.
 * Math.random אינו מתאים: הוא צפוי, ורצף קודים שהופק ממנו ניתן לחיזוי.
 */
export const generateRoomCode = () => {
  const bytes = new Uint32Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
};

const roomRef = (code) => doc(db, COLLECTION, String(code).toUpperCase());

/**
 * יוצר חדר חדש.
 * @returns {Promise<object>} מסמך החדר
 */
export const createRoom = async (uid, displayName) => {
  const code = generateRoomCode();
  const now = new Date();
  const expires = new Date(now.getTime() + LIFETIME_DAYS * 86400000);

  const room = {
    code,
    createdBy: uid,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    // ההצבעות ממופתחות לפי מזהה המצביע — זה מה שמאפשר לחוק לאכוף
    // "כל אחד נוגע רק בשלו", ומונע הצבעה כפולה מעצם המבנה.
    votes: { [uid]: { name: displayName, choices: [] } },
  };

  await setDoc(roomRef(code), room);
  return room;
};

/** שולף חדר לפי קוד. מחזיר null אם אינו קיים או שפג תוקפו. */
export const getRoom = async (code) => {
  if (!code) return null;
  const snap = await getDoc(roomRef(code));
  if (!snap.exists()) return null;

  const data = snap.data();
  if (data.expiresAt && new Date(data.expiresAt) < new Date()) return null;
  return data;
};

/**
 * מצרף משתתף לחדר, או מעדכן את שמו אם כבר בפנים.
 * @returns {Promise<object|null>} החדר, או null אם הקוד אינו קיים
 */
export const joinRoom = async (code, uid, displayName) => {
  const room = await getRoom(code);
  if (!room) return null;

  const existing = room.votes?.[uid];
  await updateDoc(roomRef(code), {
    [`votes.${uid}`]: { name: displayName, choices: existing?.choices || [] },
  });

  return getRoom(code);
};

/** שומר את בחירותיו של המשתתף. כל משתתף כותב אך ורק את הרשומה שלו. */
export const submitVote = async (code, uid, displayName, choices) => {
  await updateDoc(roomRef(code), {
    [`votes.${uid}`]: { name: displayName, choices: choices.slice(0, 3) },
  });
};

/**
 * מאזין לשינויים בחדר.
 *
 * הצבעה של חבר מופיעה מיד ללא רענון — וזה ההבדל בין "רשימה שהתעדכנה
 * מתישהו" לבין הרגשה של הצבעה משותפת.
 *
 * @returns {() => void} פונקציית ניתוק
 */
export const subscribeRoom = (code, onChange, onError) =>
  onSnapshot(
    roomRef(code),
    (snap) => onChange(snap.exists() ? snap.data() : null),
    (err) => onError?.(err)
  );

/** מוחק חדר. מותר ליוצר בלבד, ונאכף בחוקים. */
export const deleteRoom = (code) => deleteDoc(roomRef(code));

/**
 * סופר קולות מתוך מפת ההצבעות.
 * הספירה נגזרת מהנתונים ואינה נשמרת כמונה נפרד — מונה היה שדה שאפשר
 * לנפח בכתיבה ישירה, בלי קשר למי הצביע בפועל.
 */
export const tallyVotes = (room) => {
  const counts = {};
  Object.values(room?.votes || {}).forEach(({ choices }) => {
    (choices || []).forEach((c) => {
      counts[c] = (counts[c] || 0) + 1;
    });
  });
  return Object.entries(counts).sort(([, a], [, b]) => b - a);
};

/** רשימת המשתתפים לתצוגה. */
export const participantsOf = (room) =>
  Object.entries(room?.votes || {}).map(([uid, v]) => ({
    uid,
    name: v.name,
    votes: v.choices || [],
  }));
