import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, IconButton, Snackbar, Alert,
  Divider, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LinkIcon from '@mui/icons-material/Link';
import FacebookIcon from '@mui/icons-material/Facebook';
import EmailIcon from '@mui/icons-material/Email';
import InstagramIcon from '@mui/icons-material/Instagram';
import XIcon from '@mui/icons-material/X';
import TelegramIcon from '@mui/icons-material/Telegram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import PinterestIcon from '@mui/icons-material/Pinterest';
import SvgIcon from '@mui/material/SvgIcon';
import { createShare, refreshShare, setShareMode, revokeShare, setEditor, watchShare } from '../../services/sharedTripService';
import { useAuth } from '../../contexts/AuthContext';

const TikTokIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
  </SvgIcon>
);

const SnapchatIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M12.001 2C8.318 2 6.02 4.808 6.02 7.758c0 .548.054 1.084.148 1.605l-.7.32c-.27.124-.46.246-.46.492 0 .31.253.56.56.56.06 0 .12-.01.178-.03-.16.59-.378 1.14-.66 1.63-.03.05-.06.1-.09.148C4.3 13.1 3 13.54 3 14.37c0 .57.46.96 1.13 1.13.55.14 1.13.2 1.72.2.16 0 .32-.01.48-.02.36.54.54 1.16.54 1.8 0 .18-.01.36-.04.54-.03.17-.04.33-.04.49 0 .74.6 1.49 1.98 1.49.64 0 1.38-.14 2.25-.42.6-.2 1.23-.3 1.98-.3.75 0 1.38.1 1.98.3.87.28 1.61.42 2.25.42 1.38 0 1.98-.75 1.98-1.49 0-.16-.01-.32-.04-.49-.03-.18-.04-.36-.04-.54 0-.64.18-1.26.54-1.8.16.01.32.02.48.02.59 0 1.17-.06 1.72-.2.67-.17 1.13-.56 1.13-1.13 0-.83-1.3-1.27-1.996-1.467-.03-.048-.06-.098-.09-.148-.282-.49-.5-1.04-.66-1.63.058.02.118.03.178.03.307 0 .56-.25.56-.56 0-.246-.19-.368-.46-.492l-.7-.32c.094-.521.148-1.057.148-1.605C17.982 4.808 15.684 2 12.001 2z"/>
  </SvgIcon>
);

const ShareButton = ({ icon, label, color, onClick }) => (
  <Button
    variant="outlined"
    onClick={onClick}
    startIcon={icon}
    sx={{
      borderColor: color,
      color: color,
      fontWeight: 600,
      borderRadius: 2,
      py: 1.2,
      '&:hover': { bgcolor: color, color: 'white', borderColor: color },
      transition: 'all 0.2s',
    }}
    fullWidth
  >
    {label}
  </Button>
);

const ShareTripDialog = ({ open, onClose, trip = {}, shareUrl: shareUrlProp, label }) => {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { t } = useTranslation();
  const { user } = useAuth();

  const destination = trip.destination || trip.endPoint || '';

  /**
   * ── מה שהיה כאן עד 04.09.2026 ──
   * הקישור היה תמיד `?destination=` ושם העיר, כלומר **שם עיר בלבד**.
   * מסלול מתוכנן לשבוע ברומא נשלח כמתכנן ריק, כי לא היה מסמך משותף
   * להפנות אליו. עכשיו יש, ולכן טיול עם מסלול מקבל קישור אמיתי.
   *
   * הנפילה חזרה ל-`?destination=` נשמרת בכוונה: שיתוף של **יעד**
   * מדף הבית אינו טיול, ושם הקישור הישן הוא הנכון — הוא נוחת במתכנן
   * עם היעד ממולא.
   */
  const [sharedUrl, setSharedUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [shareError, setShareError] = useState('');
  const createdFor = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshed, setRefreshed] = useState(false);
  const [mode, setMode] = useState('comment');
  const [modeSaving, setModeSaving] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [live, setLive] = useState(null);

  // האזנה למסמך כדי לראות בקשות הרשאה ברגע שהן מגיעות. בלי זה היית
  // צריך לסגור ולפתוח את החלון כדי לגלות שמישהו מחכה.
  useEffect(() => {
    const code = sharedUrl.split('/trip/')[1];
    if (!open || !code) return undefined;
    return watchShare(code, setLive);
  }, [open, sharedUrl]);

  const requests = Object.entries(live?.requests || {});
  const editorList = Object.entries(live?.editors || {});

  /** אישור או הסרה של שותף. */
  const decide = async (uid, name, allowed) => {
    const code = sharedUrl.split('/trip/')[1];
    if (!code) return;
    try {
      await setEditor(code, uid, name, allowed);
      showSnackbar(allowed ? `${name} יכול לערוך` : `ההרשאה של ${name} הוסרה`);
    } catch {
      showSnackbar('הפעולה נכשלה.', 'error');
    }
  };


  /** ביטול מיידי של הקישור. */
  const handleRevoke = async () => {
    const code = sharedUrl.split('/trip/')[1];
    if (!code) return;
    setRevoking(true);
    try {
      await revokeShare(code);
      // הקישור נמחק מהמסך ולא רק מהשרת: להשאיר כתובת שכבר אינה
      // עובדת זו הזמנה לשלוח אותה.
      setSharedUrl('');
      createdFor.current = null;
      showSnackbar('השיתוף בוטל. הקישור כבר לא יעבוד.');
    } catch {
      showSnackbar('הביטול נכשל. נסה שוב.', 'error');
    } finally {
      setRevoking(false);
    }
  };


  /** שינוי רמת ההרשאה של שיתוף קיים. */
  const handleModeChange = async (next) => {
    const code = sharedUrl.split('/trip/')[1];
    if (!code || next === mode) return;
    const prev = mode;
    setMode(next);           // תגובה מיידית למגע
    setModeSaving(true);
    try {
      const res = await setShareMode(code, next);
      // חזרה למצב הקודם כשהשמירה נכשלה: בורר שמראה מצב שלא נשמר
      // הוא שקר על המסך, ומכאן ועד לשיתוף עם הרשאה לא נכונה קצר.
      if (!res) { setMode(prev); showSnackbar('השיתוף כבר אינו קיים.', 'warning'); }
      else showSnackbar(next === 'view' ? 'הועבר לצפייה בלבד' : 'הערות נפתחו');
    } catch {
      setMode(prev);
      showSnackbar('שינוי ההרשאה נכשל.', 'error');
    } finally {
      setModeSaving(false);
    }
  };


  /** מרענן את תמונת המצב לקוד שכבר נוצר. */
  const handleRefresh = async () => {
    const code = sharedUrl.split('/trip/')[1];
    if (!code) return;
    setRefreshing(true);
    setRefreshed(false);
    try {
      const res = await refreshShare(code, trip);
      // ההודעה נגזרת מהתוצאה ולא מהניסיון: refreshShare מחזיר null
      // כשהשיתוף בוטל או פג, ו"עודכן ✓" במקרה כזה היה שקר.
      if (res) {
        setRefreshed(true);
        showSnackbar('השיתוף עודכן למסלול הנוכחי');
        setTimeout(() => setRefreshed(false), 3000);
      } else {
        showSnackbar('השיתוף כבר אינו קיים. שתף מחדש.', 'warning');
      }
    } catch {
      showSnackbar('העדכון נכשל. נסה שוב.', 'error');
    } finally {
      setRefreshing(false);
    }
  };


  const hasItinerary = Boolean(trip.dailyItinerary?.length || trip.stops?.length);

  useEffect(() => {
    if (!open || shareUrlProp || !hasItinerary) return undefined;
    const key = String(trip.id ?? destination);
    // מפתח לפי הטיול: פתיחה חוזרת של אותו טיול באותו מפגש לא תייצר
    // קישור שני, אחרת כל לחיצה על "שתף" הייתה מייצרת מסמך חדש.
    if (createdFor.current === key && sharedUrl) return undefined;

    let alive = true;
    setCreating(true);
    setShareError('');
    createShare(trip, user?.uid)
      .then((share) => {
        if (!alive) return;
        createdFor.current = key;
        setMode(share.mode || 'comment');
        setSharedUrl(`${window.location.origin}/trip/${share.code}`);
      })
      .catch((err) => {
        if (!alive) return;
        // כישלון מדווח ככישלון. קישור ישן שמוצג כאילו הוא חדש הוא
        // בדיוק סוג התקלה שהפרויקט הזה מתעד.
        setShareError(err?.message === 'EMPTY_TRIP'
          ? 'אין עדיין מסלול לשתף — תכנן ימים ואז שתף.'
          : 'יצירת הקישור נכשלה. נסה שוב.');
      })
      .finally(() => { if (alive) setCreating(false); });

    return () => { alive = false; };
  }, [open, shareUrlProp, hasItinerary, trip, user, destination, sharedUrl]);

  const shareUrl = shareUrlProp
    || sharedUrl
    || `${window.location.origin}/trip-planner?destination=${encodeURIComponent(destination)}`;
  const displayLabel = label || destination;
  const shareText = t('share.shareText', { label: displayLabel ? ` — ${displayLabel}` : '', url: shareUrl });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showSnackbar(t('share.copied'));
    } catch {
      showSnackbar(t('share.cannotCopy'), 'warning');
    }
  };

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(t('share.emailSubject', { destination: destination ? t('share.emailDestination', { destination }) : '' }));
    const body = encodeURIComponent(t('share.emailBody', { url: shareUrl }));
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, '_blank');
  };

  const handleTikTok = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showSnackbar(t('share.tiktokHint'), 'info');
    } catch {
      showSnackbar(t('share.cannotCopy'), 'warning');
    }
  };

  const handleSnapchat = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showSnackbar(t('share.snapchatHint'), 'info');
    } catch {
      showSnackbar(t('share.cannotCopy'), 'warning');
    }
  };

  const handlePinterest = () => {
    window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleInstagram = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showSnackbar(t('share.instagramHint'), 'info');
    } catch {
      showSnackbar(t('share.cannotCopy'), 'warning');
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pr: 6, pb: 1 }}>
          <Typography variant="h6" component="span" fontWeight={700}>
            {displayLabel ? `${t('share.title')} — ${displayLabel}` : t('share.title')}
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ position: 'absolute', top: 12, right: 12 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 2.5, pb: 1 }}>
          {/* מצב יצירת הקישור מוצג, ולא נבלע.
              בלי זה, כישלון היה מפיל את הדיאלוג בשקט חזרה לקישור הישן
              — זה שמוביל למתכנן ריק — והמשתמש היה משתף אותו בהנחה
              שהכול תקין. כישלון שנראה כהצלחה הוא דפוס הכשל שהפרויקט
              הזה מתעד יותר מכל אחר. */}
          {creating && (
            <Alert severity="info" sx={{ mb: 2 }}>מכין קישור למסלול…</Alert>
          )}
          {shareError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {shareError}
              {' '}הקישור שיישלח יפתח את המתכנן עם היעד, בלי המסלול.
            </Alert>
          )}

          {/* הקישור מוצג ולא רק מועתק.
              עד כה הוא נכנס ללוח בלי שאיש ראה אותו — ומי ששולח קישור
              רוצה לדעת מה בדיוק הוא שולח, במיוחד אחרי שהקישור הקודם
              הוביל למסך ריק. */}
          {sharedUrl && (
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  display: 'block', p: 1.2, borderRadius: 1.5,
                  bgcolor: 'action.hover', direction: 'ltr', textAlign: 'left',
                  wordBreak: 'break-all', fontFamily: 'monospace',
                }}
              >
                {sharedUrl}
              </Typography>

              {/* ── בורר ההרשאות ──
                  שתי אפשרויות שעובדות ונאכפות בחוקי האבטחה, ואחת
                  מושבתת עם הסבר.

                  **הפיתוי היה תפריט של שלוש.** אבל עריכה משותפת אינה
                  קיימת: אין מבנה נתונים שמאפשר לשני אנשים לשנות את
                  אותו מסלול, ואין הכרעה מה קורה כששניהם עורכים אותו
                  יום. אפשרות שנראית זמינה ואינה עושה דבר היא בדיוק
                  מה שהחזיר אותנו לכאן — "שתף טיול" ששלח שם עיר. */}
              <ToggleButtonGroup
                value={mode}
                exclusive
                size="small"
                onChange={(e, v) => v && handleModeChange(v)}
                sx={{ mt: 1.5, mb: .5, display: 'flex', flexWrap: 'wrap' }}
              >
                <ToggleButton value="view" disabled={modeSaving} sx={{ flex: 1, minHeight: 40 }}>
                  לצפייה בלבד
                </ToggleButton>
                <ToggleButton value="comment" disabled={modeSaving} sx={{ flex: 1, minHeight: 40 }}>
                  לצפייה ולהערות
                </ToggleButton>
                <ToggleButton value="edit" disabled={modeSaving} sx={{ flex: 1, minHeight: 40 }}>
                  לעריכה
                </ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                {mode === 'view' && 'מי שמקבל את הקישור יראה את המסלול ולא יוכל להעיר.'}
                {mode === 'comment' && 'מי שמקבל את הקישור יוכל להעיר. הצפייה אינה דורשת התחברות, הערה כן.'}
                {mode === 'edit' && 'כל מי שמחזיק בקישור ומחובר יוכל לשנות את המסלול. השינויים מופיעים אצל כולם מיד. אפשר לסגור את העריכה בכל רגע.'}
              </Typography>

              {/* אזהרה במצב עריכה.
                  לא שורה אפורה מתחת לבורר: מצב עריכה נותן לכל מי
                  שמחזיק בקישור **ומחובר** לשנות את המסלול, וקישור
                  שנשלח בוואטסאפ מועבר הלאה בקלות. ההחלטה צריכה
                  להיראות ברגע שמקבלים אותה, לא להתגלות אחר כך. */}
              {mode === 'edit' && (
                <Alert severity="warning" sx={{ mb: 1.5, py: .5 }}>
                  אף אחד לא עורך עד שתאשר אותו אישית. מי שפותח את
                  הקישור יוכל לבקש הרשאה, והבקשה תופיע כאן.
                </Alert>
              )}

              {/* ── מי מבקש, ומי כבר עורך ──
                  ההרשאה היא לאדם ולא לקישור, ולכן צריך מקום שבו
                  רואים את שניהם. בלי הרשימה הזו "אישרתי מישהו" הוא
                  זיכרון ולא מצב. */}
              {requests.length > 0 && (
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" fontWeight={700} display="block" mb={.5}>
                    ממתינים לאישור עריכה
                  </Typography>
                  {requests.map(([uid, r]) => (
                    <Box key={uid} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: .5 }}>
                      <Typography variant="body2" sx={{ flex: 1 }}>{r.name}</Typography>
                      <Button size="small" onClick={() => decide(uid, r.name, true)}>אשר</Button>
                      <Button size="small" color="error" onClick={() => decide(uid, r.name, false)}>דחה</Button>
                    </Box>
                  ))}
                </Box>
              )}

              {editorList.length > 0 && (
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" fontWeight={700} display="block" mb={.5}>
                    מורשים לערוך
                  </Typography>
                  {editorList.map(([uid, e]) => (
                    <Box key={uid} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: .5 }}>
                      <Typography variant="body2" sx={{ flex: 1 }}>{e.name}</Typography>
                      <Button size="small" color="error" onClick={() => decide(uid, e.name, false)}>הסר</Button>
                    </Box>
                  ))}
                </Box>
              )}

              {/* "עדכן את השיתוף" — הצד השני של ההחלטה על תמונת מצב.
                  הקישור אינו מראה חיה בכוונה, ולכן חייבת להיות דרך
                  מפורשת לרענן אותו. בלעדיה תמונת המצב הייתה הופכת
                  למגבלה במקום לבחירה. */}
              <Button
                size="small"
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{ mt: .5 }}
              >
                {refreshing ? 'מעדכן…' : refreshed ? 'עודכן ✓' : 'עדכן את השיתוף למסלול הנוכחי'}
              </Button>

              {/* ביטול שיתוף. `revokeShare` היה כתוב בשירות מאז שלב 1
                  ולא היה לו ממשק — כלומר לא הייתה דרך לסגור קישור
                  שיצא. תפוגה אוטומטית אינה תחליף לשליטה מיידית. */}
              <Button
                size="small" color="error"
                onClick={handleRevoke}
                disabled={revoking}
                sx={{ mt: .5, ml: 1 }}
              >
                {revoking ? 'מבטל…' : 'בטל את השיתוף'}
              </Button>
            </Box>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <ShareButton icon={<WhatsAppIcon />} label={t('share.whatsapp')} color="#25D366" onClick={handleWhatsApp} />
            <ShareButton icon={<LinkIcon />} label={t('share.copyLink')} color="#667eea" onClick={handleCopyLink} />
            <ShareButton icon={<FacebookIcon />} label={t('share.facebook')} color="#1877F2" onClick={handleFacebook} />
            <ShareButton icon={<EmailIcon />} label={t('share.email')} color="#D44638" onClick={handleEmail} />
            <ShareButton icon={<TikTokIcon />} label={t('share.tiktok')} color="#010101" onClick={handleTikTok} />
            <ShareButton icon={<SnapchatIcon />} label={t('share.snapchat')} color="#FFFC00" onClick={handleSnapchat} />
            <ShareButton icon={<PinterestIcon />} label={t('share.pinterest')} color="#E60023" onClick={handlePinterest} />
            <ShareButton icon={<LinkedInIcon />} label={t('share.linkedin')} color="#0A66C2" onClick={handleLinkedIn} />
            <ShareButton icon={<TelegramIcon />} label={t('share.telegram')} color="#26A5E4" onClick={handleTelegram} />
            <ShareButton icon={<XIcon />} label={t('share.twitter')} color="#000000" onClick={handleTwitter} />
            <ShareButton icon={<InstagramIcon />} label={t('share.instagram')} color="#C13584" onClick={handleInstagram} />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} variant="text" color="inherit">
            {t('share.close')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ShareTripDialog;
