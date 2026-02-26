import React from 'react';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { lightTheme, darkTheme } from '../../theme';

const ThemeWrapper = ({ children }) => {
  const { userPreferences } = useUserPreferences();
  const { currentLang } = useLanguage();

  const baseTheme = userPreferences.darkMode ? darkTheme : lightTheme;

  // שכפול ה-theme עם כיוון נכון
  const theme = createTheme({
    ...baseTheme,
    direction: currentLang.dir,
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default ThemeWrapper;
