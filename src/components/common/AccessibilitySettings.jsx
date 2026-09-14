import React, { useEffect, useState } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Switch,
  ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  TEXT_SCALES, readA11yPrefs, resetA11yPrefs, writeA11yPrefs, onA11yPrefsChange,
} from '../../services/a11yPrefsService';

const OPEN_EVENT = 'open-a11y-settings';

/** פותח את חלון הגדרות הנגישות מכל מקום באפליקציה, בלי להעביר state דרך עץ הרכיבים. */
export const openAccessibilitySettings = () => window.dispatchEvent(new Event(OPEN_EVENT));

/**
 * חלון הגדרות הנגישות. מורכב פעם אחת ב-App ונפתח באירוע.
 *
 * כל שינוי חל מיד ונשמר מיד — אין "שמור": מי שהגדיל טקסט צריך לראות את
 * התוצאה לפני שהוא מחליט, ולא אחרי לחיצה נוספת.
 */
const AccessibilitySettings = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState(readA11yPrefs);

  useEffect(() => {
    const show = () => { setPrefs(readA11yPrefs()); setOpen(true); };
    window.addEventListener(OPEN_EVENT, show);
    const off = onA11yPrefsChange(setPrefs);
    return () => { window.removeEventListener(OPEN_EVENT, show); off(); };
  }, []);

  const toggle = (key) => (e) => writeA11yPrefs({ [key]: e.target.checked });

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth aria-labelledby="a11y-title">
      <DialogTitle id="a11y-title" sx={{ fontWeight: 800 }}>{t('a11y.title')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t('a11y.subtitle')}</Typography>

        <Typography id="a11y-size" variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{t('a11y.textSize')}</Typography>
        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          value={prefs.textScale}
          onChange={(_, v) => v && writeA11yPrefs({ textScale: v })}
          aria-labelledby="a11y-size"
          sx={{ mb: 2 }}
        >
          {TEXT_SCALES.map((s) => (
            <ToggleButton key={s} value={s} sx={{ minHeight: 44 }}>{s}%</ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <FormControlLabel control={<Switch checked={prefs.highContrast} onChange={toggle('highContrast')} />} label={t('a11y.highContrast')} sx={{ minHeight: 44 }} />
          <FormControlLabel control={<Switch checked={prefs.highlightLinks} onChange={toggle('highlightLinks')} />} label={t('a11y.highlightLinks')} sx={{ minHeight: 44 }} />
          <FormControlLabel control={<Switch checked={prefs.reduceMotion} onChange={toggle('reduceMotion')} />} label={t('a11y.reduceMotion')} sx={{ minHeight: 44 }} />
        </Box>

        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 2 }}>
          {t('a11y.savedHere')}{' '}
          <Box component={RouterLink} to="/accessibility" onClick={() => setOpen(false)} sx={{ color: 'primary.main' }}>
            {t('legal.accessibility')}
          </Box>
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => setPrefs(resetA11yPrefs())}>{t('a11y.reset')}</Button>
        <Button variant="contained" onClick={() => setOpen(false)}>{t('a11y.close')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccessibilitySettings;
