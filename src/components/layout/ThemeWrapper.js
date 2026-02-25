import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import { lightTheme, darkTheme } from '../../theme';

const ThemeWrapper = ({ children }) => {
  const { userPreferences } = useUserPreferences();
  const theme = userPreferences.darkMode ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default ThemeWrapper;
