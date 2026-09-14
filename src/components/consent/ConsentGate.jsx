import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Alert, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, Link, Typography,
} from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import {
  cachedConsent, getConsent, hasCurrentTerms, recordConsent,
} from '../../services/consentService';

// ── הסכמה שניתנה בטופס ההרשמה, לפני שיש uid ──
// החשבון נוצר ורק אז יש למי לרשום. בלי הדגל הזה החלון היה קופץ מיד אחרי
// הרשמה, ושואל שוב את מי שסימן את התיבה שנייה קודם. הדגל תקף לדקותיים,
// כדי שהרשמה שנכשלה לא תשאיר הסכמה תלויה לחשבון אחר שיתחבר אחר כך.
const SIGNUP_FLAG = 'consent_signup_terms';
const SIGNUP_TTL_MS = 2 * 60 * 1000;

export const markSignupConsent = () => {
  try { sessionStorage.setItem(SIGNUP_FLAG, String(Date.now())); } catch { /* חסום */ }
};
export const clearSignupConsent = () => {
  try { sessionStorage.removeItem(SIGNUP_FLAG); } catch { /* חסום */ }
};
const takeSignupConsent = () => {
  try {
    const at = Number(sessionStorage.getItem(SIGNUP_FLAG) || 0);
    sessionStorage.removeItem(SIGNUP_FLAG);
    return at > 0 && Date.now() - at < SIGNUP_TTL_MS;
  } catch { return false; }
};

// המסמכים עצמם חייבים להיות קריאים בזמן שהחלון פתוח.
const LEGAL_PATHS = ['/privacy', '/terms', '/accessibility'];

/**
 * חלון הסכמה לתנאים ולמדיניות, לכל משתמש מחובר שלא הסכים לנוסח הנוכחי.
 *
 * ── למה שער אחרי התחברות, ולא רק תיבה בטופס ההרשמה ──
 * "המשך עם Google" יוצר חשבון בלי לעבור בטופס, ואי אפשר לדעת לפני החלון
 * של Google אם המשתמש חדש. תיבה בטופס בלבד הייתה משאירה את רוב הנרשמים
 * בלי הסכמה. השער תופס את כולם — כולל משתמשים קיימים, כשהנוסח משתנה.
 *
 * כשקריאת ההסכמה מהענן נכשלת (אין רשת), החלון **אינו** מוצג: חסימת
 * האפליקציה כולה במצב לא מקוון בגלל כשל קריאה אינה הגנה, היא תקלה.
 */
const ConsentGate = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [needed, setNeeded] = useState(false);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setNeeded(false);
    if (!user) return undefined;

    (async () => {
      if (takeSignupConsent()) {
        try { await recordConsent(user.uid, 'terms'); return; } catch { /* ייפול לחלון */ }
      }
      if (hasCurrentTerms(cachedConsent(user.uid))) {
        // המטמון אומר "הסכים"; מוודאים מול הענן ברקע.
        try {
          const c = await getConsent(user.uid);
          if (alive && !hasCurrentTerms(c)) setNeeded(true);
        } catch { /* לא מקוון — המטמון מספיק */ }
        return;
      }
      try {
        const c = await getConsent(user.uid);
        if (alive) setNeeded(!hasCurrentTerms(c));
      } catch { /* לא ידוע — לא חוסמים */ }
    })();

    return () => { alive = false; };
  }, [user]);

  // סימון למדריך האינטראקטיבי: בועה מעל חלון חוסם היא שני דברים שמבקשים
  // תשומת לב באותו רגע, והמשתמש לא יכול לענות לאף אחד מהם.
  useEffect(() => {
    const root = document.documentElement;
    if (needed) root.dataset.consentPending = '1';
    else delete root.dataset.consentPending;
    return () => { delete root.dataset.consentPending; };
  }, [needed]);

  if (!user || !needed || LEGAL_PATHS.includes(pathname)) return null;

  const accept = async () => {
    setBusy(true);
    setError(false);
    try {
      await recordConsent(user.uid, 'terms');
      setNeeded(false);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const legalLink = (to) => <Link href={to} target="_blank" rel="noopener" />;

  return (
    <Dialog open disableEscapeKeyDown maxWidth="xs" fullWidth aria-labelledby="consent-title">
      <DialogTitle id="consent-title" sx={{ fontWeight: 800 }}>{t('consent.title')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>{t('consent.body')}</Typography>
        <FormControlLabel
          sx={{ alignItems: 'flex-start' }}
          control={<Checkbox checked={checked} onChange={(e) => setChecked(e.target.checked)} sx={{ pt: 0.25 }} />}
          label={
            <Typography variant="body2">
              <Trans i18nKey="consent.checkbox" components={{ terms: legalLink('/terms'), privacy: legalLink('/privacy') }} />
            </Typography>
          }
        />
        {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{t('consent.saveFailed')}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <LogoutButton />
        <Button variant="contained" onClick={accept} disabled={!checked || busy}>
          {t('consent.accept')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const LogoutButton = () => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  return <Button onClick={logout}>{t('nav.logout')}</Button>;
};

export default ConsentGate;
