import React, { useEffect, useState } from 'react';
import { Alert, Box } from '@mui/material';

/**
 * חיווי ניתוק רשת.
 *
 * בלי חיווי, מסך שמציג נתונים ישנים או ריקים נראה כמו תקלה באפליקציה,
 * והמשתמש מרענן שוב ושוב במקום להבין שאין קליטה. זה בדיוק המצב בשדה
 * תעופה בחו״ל בלי סים מקומי — הרגע שבו הנתונים דרושים ביותר.
 *
 * ההודעה אומרת מה כן עובד ולא רק מה לא: המסלול, ההזמנות והמסמכים נקראים
 * מהמכשיר. מה שלא יעבוד הוא יצירת מסלול חדש וסריקת מייל, שדורשות רשת.
 */
const OfflineBanner = () => {
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <Box sx={{ mb: 1 }}>
      <Alert severity="warning" variant="filled" sx={{ fontWeight: 600 }}>
        אין חיבור לאינטרנט — המסלול, ההזמנות והמסמכים מוצגים מהמכשיר.
        יצירת מסלול חדש וסריקת מייל ידרשו חיבור.
      </Alert>
    </Box>
  );
};

export default OfflineBanner;
