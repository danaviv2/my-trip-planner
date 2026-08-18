import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAeQ8o6IacieEB64I6aZciSBnxoOKukw3I",
  authDomain: "my-trip-planner-3a72d.firebaseapp.com",
  projectId: "my-trip-planner-3a72d",
  storageBucket: "my-trip-planner-3a72d.firebasestorage.app",
  messagingSenderId: "203669954170",
  appId: "1:203669954170:web:111dadbf58509f485865c3",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

/**
 * Firestore עם מטמון מקומי קבוע.
 *
 * בלי זה כל קריאה דורשת רשת, והאפליקציה שנפתחת בשדה תעופה בלי סים מציגה
 * מסך ריק — בדיוק ברגע שבו הנתונים דרושים. עם המטמון, הזמנות ונסיעות
 * שנקראו פעם אחת זמינות גם בלי חיבור, וכתיבות ממתינות בתור ונשלחות
 * כשהרשת חוזרת.
 *
 * persistentMultipleTabManager מאפשר כמה לשוניות פתוחות; בלעדיו רק
 * הראשונה מקבלת מטמון והשאר נכשלות בשקט.
 *
 * דפדפן שאינו תומך ב-IndexedDB (גלישה פרטית בחלק מהדפדפנים) יזרוק כאן,
 * ואז נופלים למצב זיכרון בלבד — פחות טוב, אך עדיף מאפליקציה שלא עולה.
 */
let firestore;
try {
  firestore = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
} catch {
  firestore = initializeFirestore(app, {});
}

export const db = firestore;
export const googleProvider = new GoogleAuthProvider();
