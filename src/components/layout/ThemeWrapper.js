import React from 'react';
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

  // שכפול ה-theme עם כיוון נכון
  const theme = createTheme({
    ...baseTheme,
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
