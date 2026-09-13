// components/profile/ProfileSettings.jsx
//
// פרופיל, העדפות וחיבורים. עמודה אחת במובייל ושתיים בדסקטופ,
// וכרטיס "אזור מסוכן" שיושב לבדו בתחתית ברוחב מלא.
//
// ── אין כאן אף צבע קשיח ──
// כל גוון עובר דרך `theme.palette`, ולכן מצב כהה אינו תרחיש נפרד אלא
// אותו קוד עם ערכים אחרים. הכלל שנשרף עליו הפרויקט: רקע קשיח מחייב
// טקסט קשיח, והשחרור חייב להיות בשני הכיוונים.
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Grid, Card, CardContent, Typography, TextField, Button, MenuItem,
  Alert, Divider, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Chip,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import { useTripSave } from '../../contexts/TripSaveContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { deleteAccountAndData } from '../../services/accountService';

const TRIP_STYLES = ['balanced', 'culinary', 'adventure', 'culture', 'relax'];
const CURRENCIES = ['ILS', 'USD', 'EUR', 'GBP'];
const UNITS = ['metric', 'imperial'];

// ── 44px הוא יעד המגע המינימלי ──
// נמדד על המסך: "חבר את Gmail" יצא 31px, "התנתקות" ו"מחק את החשבון"
// 37px. ברירת המחדל של MUI ל-size="small" נמוכה מהסף, והכפתורים
// האלה הם בדיוק אלה שלחיצה שגויה בהם יקרה.
const TOUCH = { minHeight: 44 };

/** כרטיס אחיד. הגבול נגזר מהערכה ולא מקובע. */
const SettingsCard = ({ title, subtitle, children, danger = false }) => (
  <Card
    variant="outlined"
    sx={{
      borderRadius: 3,
      height: '100%',
      borderColor: danger ? 'error.main' : 'divider',
      bgcolor: 'background.paper',
    }}
  >
    <CardContent sx={{ p: { xs: 2, md: 3 } }}>
      {/* ── הכותרת אינה אדומה, והגבול כן ──
          נמדד: `error.main` ב-16px bold הגיע ל-3.68. סף "טקסט גדול"
          הוא 18.66px bold, ולכן הסף כאן הוא 4.5 והכותרת נפלה.
          האדום נשאר במקומות שבהם הוא עובר את הסף ממילא — הגבול של
          הכרטיס וכפתור המחיקה — והכותרת חוזרת ל-text.primary. */}
      <Typography variant="h6" fontWeight={800} color="text.primary">
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
        {subtitle || ''}
      </Typography>
      {children}
    </CardContent>
  </Card>
);

export default function ProfileSettings() {
  const { t } = useTranslation();
  const { user, gmailToken, connectGmail, disconnectGmail, logout } = useAuth();
  const { userPreferences, updatePreferences } = useUserPreferences();
  const { savedTrips } = useTripSave();
  const { language, changeLanguage, LANGUAGES } = useLanguage();

  const [draft, setDraft] = useState({
    displayName: user?.displayName || '',
    travelStyle: userPreferences.travelStyle || 'balanced',
    currency: userPreferences.currency || 'ILS',
    unitSystem: userPreferences.unitSystem || 'metric',
  });
  const [status, setStatus] = useState(null); // {severity, text, detail}
  const [busy, setBusy] = useState(false);

  const [delOpen, setDelOpen] = useState(false);
  const [delWord, setDelWord] = useState('');
  const [delBusy, setDelBusy] = useState(false);
  const [delError, setDelError] = useState(null);

  // ── המספר בדיאלוג מגיע מהנתונים, ולא מהעיצוב ──
  // "כל 63 הנסיעות" הוא מספר שנשמע משכנע ואינו נכון לאיש. מספר
  // מומצא בהודעת מחיקה גרוע פי כמה מאשר בשדה רגיל: הוא מה שהמשתמש
  // שוקל לפיו אם ללחוץ.
  const tripCount = savedTrips?.length || 0;

  const dirty = useMemo(
    () =>
      draft.displayName !== (user?.displayName || '') ||
      draft.travelStyle !== (userPreferences.travelStyle || 'balanced') ||
      draft.currency !== (userPreferences.currency || 'ILS') ||
      draft.unitSystem !== (userPreferences.unitSystem || 'metric'),
    [draft, user, userPreferences]
  );

  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));

  const handleSave = async () => {
    if (!dirty) { setStatus({ severity: 'info', text: t('settings.nothingToSave') }); return; }
    setBusy(true);
    setStatus({ severity: 'info', text: t('settings.saving') });
    try {
      await updatePreferences({
        travelStyle: draft.travelStyle,
        currency: draft.currency,
        unitSystem: draft.unitSystem,
      });
      // השם נשמר רק כשיש משתמש מחובר. אורח עורך ורואה, ואין לאן לשמור.
      if (user && draft.displayName !== user.displayName) {
        const { updateProfile } = await import('firebase/auth');
        await updateProfile(user, { displayName: draft.displayName.trim() });
      }
      setStatus({ severity: 'success', text: t('settings.saved') });
    } catch (err) {
      // הטקסט הטכני יורד לשורה משנית ואינו נשפך לגוף ההודעה —
      // אותו כלל שהוחל על EmailImportModal.
      setStatus({ severity: 'error', text: t('settings.saveFailed'), detail: String(err?.message || err) });
    } finally {
      setBusy(false);
    }
  };

  const confirmWord = t('settings.danger.confirmWord');
  const canDelete = delWord.trim().toLowerCase() === confirmWord.toLowerCase() && !delBusy;

  const handleDelete = async () => {
    setDelBusy(true);
    setDelError(null);
    const res = await deleteAccountAndData(user);
    setDelBusy(false);
    if (res.ok) { window.location.href = '/'; return; }
    setDelError(
      res.reason === 'recent-login'
        ? t('settings.danger.needsRecentLogin')
        : t('settings.danger.failed')
    );
  };

  const scopeText = tripCount > 0
    ? t('settings.danger.scope', { count: tripCount })
    : t('settings.danger.nothing');

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 1, md: 2 }, pb: 6 }}>
      <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>
        {t('settings.title')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {t('settings.subtitle')}
      </Typography>

      {status && (
        <Alert
          severity={status.severity}
          onClose={() => setStatus(null)}
          sx={{ mb: 2, borderRadius: 2 }}
          icon={busy ? <CircularProgress size={18} /> : undefined}
        >
          {status.text}
          {status.detail && (
            <Typography component="span" variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.75 }}>
              {status.detail}
            </Typography>
          )}
        </Alert>
      )}

      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* ── פרופיל אישי ── */}
        <Grid item xs={12} md={6}>
          <SettingsCard title={t('settings.profile.title')}>
            <Stack spacing={2}>
              <TextField
                label={t('settings.profile.name')}
                placeholder={t('settings.profile.namePlaceholder')}
                value={draft.displayName}
                onChange={set('displayName')}
                fullWidth
                inputProps={{ maxLength: 40 }}
              />
              <TextField
                label={t('settings.profile.email')}
                value={user?.email || ''}
                fullWidth
                disabled
              />
              {/* ההסבר יושב מחוץ לשדה ולא ב-helperText שלו.
                  נמדד: כ-helperText של שדה מושבת הוא ירש את האפרוריות
                  והגיע ל-2.68 — והוא בדיוק הטקסט שמסביר *למה* אי אפשר
                  לערוך. פקד מושבת פטור מדרישת הניגודיות, ההסבר עליו לא. */}
              <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5 }}>
                {t('settings.profile.emailLocked')}
              </Typography>
              {!user && <Alert severity="info" sx={{ borderRadius: 2 }}>{t('settings.profile.guest')}</Alert>}
            </Stack>
          </SettingsCard>
        </Grid>

        {/* ── העדפות Vibe ── */}
        <Grid item xs={12} md={6}>
          <SettingsCard title={t('settings.vibe.title')} subtitle={t('settings.vibe.sub')}>
            <Stack spacing={2}>
              <TextField
                select
                label={t('settings.vibe.languageLabel')}
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                fullWidth
              >
                {LANGUAGES.map((l) => (
                  <MenuItem key={l.code} value={l.code}>{l.flag} {l.label}</MenuItem>
                ))}
              </TextField>
              <TextField select label={t('settings.vibe.styleLabel')} value={draft.travelStyle} onChange={set('travelStyle')} fullWidth>
                {TRIP_STYLES.map((s) => (
                  <MenuItem key={s} value={s}>{t(`settings.vibe.style.${s}`)}</MenuItem>
                ))}
              </TextField>
              <TextField select label={t('settings.vibe.currencyLabel')} value={draft.currency} onChange={set('currency')} fullWidth>
                {CURRENCIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
              <TextField select label={t('settings.vibe.unitsLabel')} value={draft.unitSystem} onChange={set('unitSystem')} fullWidth>
                {UNITS.map((u) => (
                  <MenuItem key={u} value={u}>{t(`settings.vibe.units.${u}`)}</MenuItem>
                ))}
              </TextField>
            </Stack>
          </SettingsCard>
        </Grid>

        {/* ── אבטחה וחיבורים ── */}
        <Grid item xs={12} md={6}>
          <SettingsCard title={t('settings.security.title')}>
            <Stack spacing={2}>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight={700}>{t('settings.security.gmail')}</Typography>
                  <Chip size="small" color={gmailToken ? 'success' : 'default'} label={gmailToken ? '●' : '○'} sx={{ minWidth: 28 }} />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {gmailToken ? t('settings.security.gmailOn') : t('settings.security.gmailOff')}
                </Typography>
                <Button
                  variant={gmailToken ? 'outlined' : 'contained'}
                  size="small"
                  sx={{ mt: 1.5, ...TOUCH }}
                  onClick={() => (gmailToken ? disconnectGmail() : connectGmail())}
                >
                  {gmailToken ? t('settings.security.disconnect') : t('settings.security.connect')}
                </Button>
              </Box>
              {user && (
                <>
                  <Divider />
                  <Button variant="outlined" onClick={logout} sx={{ alignSelf: 'flex-start', ...TOUCH }}>
                    {t('settings.security.logout')}
                  </Button>
                </>
              )}
            </Stack>
          </SettingsCard>
        </Grid>

        {/* ── שמירה ── */}
        <Grid item xs={12} md={6}>
          <SettingsCard title={t('settings.save')}>
            <Button
              variant="contained"
              size="large"
              onClick={handleSave}
              disabled={busy || !dirty}
              fullWidth
              sx={{ py: 1.25, fontWeight: 700 }}
            >
              {busy ? <CircularProgress size={22} /> : t('settings.save')}
            </Button>
          </SettingsCard>
        </Grid>

        {/* ── אזור מסוכן ── */}
        {user && (
          <Grid item xs={12}>
            <SettingsCard title={t('settings.danger.title')} danger>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {scopeText}
              </Typography>
              <Button color="error" variant="outlined" sx={TOUCH} onClick={() => { setDelOpen(true); setDelWord(''); setDelError(null); }}>
                {t('settings.danger.deleteBtn')}
              </Button>
            </SettingsCard>
          </Grid>
        )}
      </Grid>

      {/* ── דיאלוג המחיקה ──
          הכפתור ההרסני מושבת עד שמוקלדת מילת אישור. לחיצה אחת על
          "אישור" בדיאלוג שנפתח בטעות מוחקת הכול, ואין ממנה חזרה. */}
      <Dialog open={delOpen} onClose={() => !delBusy && setDelOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: 'error.main', fontWeight: 800 }}>
          {t('settings.danger.dialogTitle')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1.5 }}>{scopeText}</Typography>
          <Typography variant="body2" color="error.main" fontWeight={700} sx={{ mb: 2 }}>
            {t('settings.danger.irreversible')}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            size="small"
            value={delWord}
            onChange={(e) => setDelWord(e.target.value)}
            label={confirmWord}
            disabled={delBusy}
          />
          {delError && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{delError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDelOpen(false)} disabled={delBusy} sx={TOUCH}>
            {t('settings.danger.cancel')}
          </Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={!canDelete} sx={TOUCH}>
            {delBusy ? t('settings.danger.deleting') : t('settings.danger.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
