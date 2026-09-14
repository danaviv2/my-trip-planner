import React, { useEffect, useState } from 'react';
import { readA11yPrefs, onA11yPrefsChange } from '../../services/a11yPrefsService';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { lightTheme, darkTheme } from '../../theme';

// ── `direction` בערכה לבדו אינו הופך את הצדדים ──
// עד 13.09.2026 הערכה קיבלה `direction: 'rtl'`, אבל ה-CSS של הרכיבים
// נשאר פיזי: `left: 0` בתווית של שדה, `margin-right` באייקון של כפתור.
// נמדד בכל 15 השדות בחמישה מסכים: התווית 14px מהקצה **השמאלי**, סמל
// העין חופף את "סיסמה" ב-22px, והאות G חופפת את "המשך". התיעוד של MUI 5
// דורש, מלבד `direction`, מטמון Emotion עם `stylis-plugin-rtl` שהופך
// left/right בזמן יצירת ה-CSS.
//
// שני מטמונים ולא אחד: בשפה משמאל לימין אסור להפוך דבר. המפתח שונה כדי
// שהכללים של שני הכיוונים לא יתנגשו בדף אחד כשמחליפים שפה.
const rtlCache = createCache({ key: 'muirtl', stylisPlugins: [prefixer, rtlPlugin] });
const ltrCache = createCache({ key: 'muiltr', stylisPlugins: [prefixer] });

const ThemeWrapper = ({ children }) => {
  const { userPreferences } = useUserPreferences();
  const { currentLang } = useLanguage();

  const baseTheme = userPreferences.darkMode ? darkTheme : lightTheme;
  const isRtl = currentLang.dir === 'rtl';
  const [highContrast, setHighContrast] = useState(() => readA11yPrefs().highContrast);
  useEffect(() => onA11yPrefsChange((p) => setHighContrast(p.highContrast)), []);

  // ── ניגודיות גבוהה דרך ה-theme ──
  // הטקסט המשני (#666 על #f5f7fa) נמדד 5.4:1 — עובר AA, אבל חלש למי שביקש
  // ניגודיות. כאן הוא מתקרב לטקסט הראשי, והקווים המפרידים מתכהים. לא
  // `filter: contrast()` על הדף: הוא שובר את הסרגל העליון הקבוע.
  const contrastPalette = highContrast
    ? (userPreferences.darkMode
      ? { text: { primary: '#ffffff', secondary: '#e0e0e0' }, divider: 'rgba(255,255,255,0.5)', background: { ...baseTheme.palette.background, default: '#000000', paper: '#111111' } }
      : { text: { primary: '#000000', secondary: '#1f1f1f' }, divider: 'rgba(0,0,0,0.55)', background: { ...baseTheme.palette.background, default: '#ffffff', paper: '#ffffff' } })
    : {};

  // שכפול ה-theme עם כיוון נכון
  const theme = createTheme({
    ...baseTheme,
    palette: { ...baseTheme.palette, ...contrastPalette },
    direction: currentLang.dir,
  });

  return (
    <CacheProvider value={isRtl ? rtlCache : ltrCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
};

export default ThemeWrapper;
