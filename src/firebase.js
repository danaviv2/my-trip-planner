import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: window.env?.REACT_APP_FIREBASE_API_KEY,
  authDomain: window.env?.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: window.env?.REACT_APP_FIREBASE_PROJECT_ID,
  appId: window.env?.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
