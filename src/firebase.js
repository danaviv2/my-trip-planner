import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
