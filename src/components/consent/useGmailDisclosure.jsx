import React, { useCallback, useRef, useState } from 'react';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Link, Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import {
  cachedConsent, getConsent, hasCurrentGmailDisclosure, recordConsent,
} from '../../services/consentService';

// ── גילוי נאות לפני Gmail, לפני החלון של Google ──
// מסך ההרשאה של Google אומר רק "לקרוא את המיילים שלך". הוא לא אומר
// שתוכן המיילים נשלח למודל בינה מלאכותית, מה נשמר, ומה לא. מדיניות
// Google API Services דורשת גילוי "timely and shown in context", ותיקון 13
// דורש הסכמה מדעת — ומדעת פירושו לפני, לא בעמוד שאיש לא פתח.
//
// שימוש: `const { ensureGmailDisclosure, gmailDisclosureDialog } = useGmailDisclosure();`
// ובמטפל: `if (!(await ensureGmailDisclosure())) return;` — ולרנדר את הדיאלוג.
export const useGmailDisclosure = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const resolver = useRef(null);

  const ensureGmailDisclosure = useCallback(async () => {
    if (!user) return false;
    if (hasCurrentGmailDisclosure(cachedConsent(user.uid))) return true;
    try {
      if (hasCurrentGmailDisclosure(await getConsent(user.uid))) return true;
    } catch { /* לא ידוע ⟵ מציגים. כאן, בניגוד לשער הכללי, אין נזק בשאלה */ }
    setError(false);
    setOpen(true);
    return new Promise((resolve) => { resolver.current = resolve; });
  }, [user]);

  const finish = (value) => {
    setOpen(false);
    resolver.current?.(value);
    resolver.current = null;
  };

  const accept = async () => {
    setBusy(true);
    setError(false);
    try {
      await recordConsent(user.uid, 'gmail');
      finish(true);
    } catch {
      // הסכמה שלא נרשמה אינה הסכמה — לא ממשיכים לחלון של Google.
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const points = t('gmailDisclosure.points', { returnObjects: true });

  const gmailDisclosureDialog = (
    <Dialog open={open} onClose={() => finish(false)} maxWidth="sm" fullWidth aria-labelledby="gmail-disclosure-title">
      <DialogTitle id="gmail-disclosure-title" sx={{ fontWeight: 800 }}>{t('gmailDisclosure.title')}</DialogTitle>
      <DialogContent>
        <Box component="ul" sx={{ m: 0, ps: 2.5, '& li': { mb: 1 } }}>
          {Array.isArray(points) && points.map((p) => (
            <Typography component="li" variant="body2" key={p}>{p}</Typography>
          ))}
        </Box>
        <Typography variant="body2" sx={{ mt: 1.5 }}>
          <Link href="/privacy" target="_blank" rel="noopener">{t('legal.privacy')}</Link>
        </Typography>
        {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{t('consent.saveFailed')}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => finish(false)} disabled={busy}>{t('gmailDisclosure.cancel')}</Button>
        <Button variant="contained" onClick={accept} disabled={busy}>{t('gmailDisclosure.accept')}</Button>
      </DialogActions>
    </Dialog>
  );

  return { ensureGmailDisclosure, gmailDisclosureDialog };
};

export default useGmailDisclosure;
