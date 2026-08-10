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
  const connectGmail = async ({ chooseAccount = false } = {}) => {
    let token;

    if (getClientId()) {
      // קודם בשקט: אם ההרשאה כבר ניתנה, אין סיבה להציג דבר. רק אם זה
      // נכשל עוברים למסלול שמציג מסך. הגרסה הקודמת אילצה בחירת חשבון
      // ואישור מחדש בכל פעם, גם כשלא היה בכך צורך.
      if (!chooseAccount) {
        try {
          token = await requestGmailToken({ silent: true, loginHint: user?.email || '' });
        } catch {
          token = null;
        }
      }
      if (!token) {
        token = await requestGmailToken({
          silent: false,
          chooseAccount,
          loginHint: chooseAccount ? '' : user?.email || '',
        });
      }
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

  /**
   * מנפיק טוקן חדש בשקט. נדרש כשהטוקן שבזיכרון פג.
   *
   * טוקן גישה תקף לשעה מעצם תכנונו, ופקיעתו היא אירוע צפוי ולא תקלה.
   * עד כה היא טופלה כאילו ההרשאה נשללה: סימון ההסכמה נמחק, ואיתו
   * הושבתה הסריקה האוטומטית עד לאישור ידני מחדש.
   */
  const refreshGmailToken = async () => {
    const token = await requestGmailToken({ silent: true, loginHint: user?.email || '' });
    setGmailToken(token);
    try {
      sessionStorage.setItem('gmailAccessToken', token);
    } catch {}
    return token;
  };

  /** משכיח את הטוקן בלבד. ההסכמה נשמרת. */
  const clearGmailToken = () => {
    setGmailToken(null);
    try {
      sessionStorage.removeItem('gmailAccessToken');
    } catch {}
  };

  /** ניתוק יזום של המשתמש — כאן כן נכון לשכוח גם את ההסכמה. */
  const disconnectGmail = () => {
    clearGmailToken();
    setGmailConsent(false);
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
      refreshGmailToken,
      clearGmailToken,
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
