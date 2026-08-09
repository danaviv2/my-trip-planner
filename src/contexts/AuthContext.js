import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const AuthContext = createContext();

const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gmailToken, setGmailToken] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // שחזור טוקן Gmail מהסשן הנוכחי, כדי שרענון דף לא ידרוש אישור מחדש
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('gmailAccessToken');
      if (saved) setGmailToken(saved);
    } catch {}
  }, []);

  const loginWithGoogle = () => signInWithPopup(auth, googleProvider);

  /**
   * מבקש הרשאת קריאה לתיבת ה-Gmail ומחזיר טוקן גישה.
   *
   * מופרד מההתחברות הרגילה בכוונה: משתמש שרק רוצה להיכנס לא צריך
   * לאשר גישה למיילים. ההרשאה נדרשת רק כשהוא בוחר לסרוק אישורי הזמנה.
   *
   * הטוקן תקף לכשעה ואינו כולל refresh token, ולכן הוא נשמר ב-sessionStorage
   * בלבד — נמחק בסגירת הכרטיסייה ואינו נשאר על הדיסק.
   */
  const connectGmail = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope(GMAIL_SCOPE);
    // מאלץ מסך בחירת חשבון, כדי שאפשר יהיה לסרוק תיבה אחרת מזו שמחוברת
    provider.setCustomParameters({ prompt: 'consent' });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || null;

    if (!token) throw new Error('NO_GMAIL_TOKEN');

    setGmailToken(token);
    try {
      sessionStorage.setItem('gmailAccessToken', token);
    } catch {}
    return token;
  };

  const disconnectGmail = () => {
    setGmailToken(null);
    try {
      sessionStorage.removeItem('gmailAccessToken');
    } catch {}
  };

  const loginWithEmail = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const registerWithEmail = async (email, password, displayName) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });
    return credential;
  };

  const logout = () => signOut(auth);

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      loginWithGoogle,
      loginWithEmail,
      registerWithEmail,
      logout,
      resetPassword,
      gmailToken,
      connectGmail,
      disconnectGmail,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
