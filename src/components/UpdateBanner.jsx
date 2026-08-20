import React, { useEffect, useState } from 'react';
import { Snackbar, Button, Alert } from '@mui/material';
import { watchForUpdates, applyUpdate } from '../services/appUpdateService';

/**
 * "יש גרסה חדשה".
 *
 * ── למה זה קיים ──
 * האפליקציה מותקנת במסך הבית, ופתיחתה שם משחזרת מצב שמור במקום לטעון
 * מחדש. פעמיים כבר קרה שתכונה נפרסה ואומתה על השרת בעוד המכשיר מריץ קוד
 * מלפני ימים — ואיש מהצדדים לא ידע שזה מה שקורה. הזמן שהלך על כך היה
 * גדול מכל באג שתוקן באותו יום.
 *
 * ── למה זו הודעה ולא רענון אוטומטי ──
 * רענון באמצע צפייה מאבד גלילה וטפסים פתוחים, ובאמצע נסיעה זה גרוע
 * במיוחד. ההודעה נשארת עד שנוגעים בה, ואינה חוסמת דבר.
 */

const UpdateBanner = () => {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => watchForUpdates(() => setReady(true)), []);

  if (!ready) return null;

  return (
    <Snackbar
      open
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ mb: { xs: 8, sm: 2 } }}
    >
      <Alert
        severity="info"
        variant="filled"
        sx={{ alignItems: 'center', borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,.2)' }}
        action={
          <Button
            size="small"
            color="inherit"
            disabled={busy}
            onClick={() => { setBusy(true); applyUpdate(); }}
            sx={{ fontWeight: 700 }}
          >
            {busy ? 'טוען…' : 'רענן'}
          </Button>
        }
      >
        יש גרסה חדשה של האפליקציה
      </Alert>
    </Snackbar>
  );
};

export default UpdateBanner;
