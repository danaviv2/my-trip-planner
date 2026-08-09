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
import {
  requestGmailToken,
  setGmailConsent,
  getClientId,
  GMAIL_SCOPE,
} from '../services/googleTokenClient';

const AuthContext = createContext();

export { GMAIL_SCOPE };

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
   * הטוקן תקף לכשעה, ולכן הוא נשמר ב-sessionStorage בלבד — נמחק בסגירת
   * הכרטיסייה ואינו נשאר על הדיסק.
   *
   * ההנפקה עוברת דרך Google Identity Services ולא דרך חלון ההתחברות של
   * Firebase. הסיבה מעשית: GIS זוכר את האישור, ולכן אחרי הפעם הראשונה
   * אפשר לקבל טוקן חדש בשקט וסריקה יכולה לרוץ מעצמה. חלון Firebase
   * דורש לחיצה בכל פעם מחדש, ואיתו הייבוא לעולם לא יהיה אוטומטי.
   */
  const connectGmail = async () => {
    let token;

    if (getClientId()) {
      token = await requestGmailToken({ silent: false, loginHint: user?.email || '' });
    } else {
      // עוד לא הוגדר Client ID לסריקה האוטומטית. נופלים חזרה לחלון של
      // Firebase כדי שהייבוא הידני ימשיך לעבוד — פחות נוח, אך תקין.
      const provider = new GoogleAuthProvider();
      provider.addScope(GMAIL_SCOPE);
      provider.setCustomParameters({ prompt: 'consent' });
      const result = await signInWithPopup(auth, provider);
      token = GoogleAuthProvider.credentialFromResult(result)?.accessToken || null;
    }

    if (!token) throw new Error('NO_GMAIL_TOKEN');

    setGmailToken(token);
    try {
      sessionStorage.setItem('gmailAccessToken', token);
    } catch {}
    return token;
  };

  const disconnectGmail = () => {
    setGmailToken(null);
    setGmailConsent(false);
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
