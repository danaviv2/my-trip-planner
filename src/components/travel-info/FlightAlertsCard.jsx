import React, { useEffect, useState } from 'react';
import { Alert, AlertTitle, Box, Button, Paper, Typography, CircularProgress } from '@mui/material';
import {
  pushSupport, subscribeToPush, unsubscribeFromPush, currentSubscription,
} from '../../services/pushService';
import { savePushSubscription, deletePushSubscription } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';

/**
 * הפעלת התראות על עיכובי טיסה.
 *
 * הערך כאן אינו בנוחות אלא בזמן: עיכוב שמתגלה בשדה התעופה כבר מאוחר
 * לתכנון מחדש, בעוד עיכוב שמתגלה שעתיים מראש מאפשר לשנות הסעה, לעדכן
 * מלון, ולעיתים לתבוע פיצוי במקום להפסיד אותו.
 *
 * הכפתור מוצג רק כשההרשמה אפשרית בפועל. כשלא — נאמר בדיוק מדוע, ובאייפון
 * גם מה לעשות. כפתור שמבטיח התראות ושותק גרוע מהיעדר כפתור.
 */
const FlightAlertsCard = ({ hasFlights }) => {
  const { user } = useAuth();
  const support = pushSupport();

  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    let alive = true;
    currentSubscription().then((sub) => {
      if (alive) setEnabled(!!sub);
    });
    return () => { alive = false; };
  }, []);

  if (!hasFlights) return null;

  const enable = async () => {
    setBusy(true);
    setError('');
    const res = await subscribeToPush();
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }
    // ההרשמה נשמרת בענן, אחרת השרת אינו יודע לאן לשלוח
    if (user) await savePushSubscription(user.uid, res.subscription).catch(() => {});
    setEnabled(true);
    setBusy(false);
  };

  /**
   * בדיקת השרשרת מקצה לקצה.
   *
   * זו החוליה היחידה שאי אפשר לאמת בעקיפין: אפשר לוודא תצורה, הרשאות
   * וקריאת נתונים, אבל לא שההודעה באמת מגיעה למכשיר. כישלון שם יתגלה
   * בפעם הראשונה שתהיה טיסה מתעכבת — ברגע היחיד שבו זה משנה.
   */
  const sendTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // אסימון הזהות של Firebase: השרת מאמת אותו ושולח אך ורק למכשירים
      // של המשתמש הזה.
      const token = await user.getIdToken();
      const res = await fetch('/api/push-test', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      // ההנחיה חיונית ואינה קוסמטית: באייפון iOS אינו מציג באנר לאפליקציה
      // שנמצאת בחזית, ולכן בדיקה שהצליחה נראית ככישלון כשהמסך פתוח.
      setTestResult(
        res.ok
          ? {
              ok: true,
              text: `נשלחה התראה ל-${data.sent} מכשירים. צא עכשיו למסך הבית — באייפון ההתראה אינה מוצגת כשהאפליקציה פתוחה בחזית. אם היא לא הופיעה, בדוק במרכז ההתראות.`,
            }
          : { ok: false, text: data.error || 'השליחה נכשלה.' }
      );
    } catch (err) {
      setTestResult({ ok: false, text: `השליחה נכשלה: ${err?.message || err}` });
    }
    setTesting(false);
  };

  const disable = async () => {
    setBusy(true);
    const sub = await currentSubscription();
    if (sub && user) await deletePushSubscription(user.uid, sub.toJSON()).catch(() => {});
    await unsubscribeFromPush();
    setEnabled(false);
    setBusy(false);
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
        🔔 התראות על עיכוב בטיסה
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        נבדוק את הטיסות שלך מול נתוני הטיסה בפועל, ונודיע כשיש עיכוב — גם כשהאפליקציה סגורה.
      </Typography>

      {!support.supported ? (
        <Alert severity="info" sx={{ fontSize: '0.85rem' }}>
          <AlertTitle sx={{ fontSize: '0.9rem', fontWeight: 700, mb: 0.25 }}>
            לא זמין במכשיר הזה
          </AlertTitle>
          {support.reason}
        </Alert>
      ) : (
        <Box>
          {error && <Alert severity="warning" sx={{ mb: 1, fontSize: '0.85rem' }}>{error}</Alert>}

          {enabled ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Alert severity="success" sx={{ flex: 1, minWidth: 200, fontSize: '0.85rem', py: 0 }}>
                ההתראות פעילות במכשיר הזה
              </Alert>
              <Button
                size="small"
                variant="outlined"
                onClick={sendTest}
                disabled={testing || !user}
                startIcon={testing ? <CircularProgress size={14} /> : null}
              >
                {testing ? 'שולח...' : 'שלח בדיקה'}
              </Button>
              <Button size="small" color="inherit" onClick={disable} disabled={busy}>
                כבה
              </Button>
            </Box>
          ) : (
            <Button
              variant="contained"
              onClick={enable}
              disabled={busy}
              startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {busy ? 'מפעיל...' : 'הפעל התראות'}
            </Button>
          )}

          {testResult && (
            <Alert
              severity={testResult.ok ? 'success' : 'warning'}
              sx={{ mt: 1, fontSize: '0.85rem' }}
              onClose={() => setTestResult(null)}
            >
              {testResult.text}
            </Alert>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default FlightAlertsCard;
