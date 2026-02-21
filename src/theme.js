import { createTheme } from '@mui/material/styles';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#fff',
    },
    secondary: {
      main: '#00bcd4',
      light: '#4dd0e1',
      dark: '#0097a7',
      contrastText: '#fff',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    error: {
      main: '#f44336',
      light: '#ef5350',
      dark: '#d32f2f',
    },
    text: {
      primary: '#212121',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "Helvetica Neue", -apple-system, BlinkMacSystemFont, "Roboto"',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-1px',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
    },
    button: {
      textTransform: 'uppercase',
      fontWeight: 600,
      letterSpacing: '0.5px',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '0.95rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
          },
        },
        contained: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 12px 24px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            transition: 'all 0.3s',
            '&:hover fieldset': {
              borderColor: '#1976d2',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 0.2s',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#42a5f5',
      light: '#64b5f6',
      dark: '#1976d2',
      contrastText: '#000',
    },
    secondary: {
      main: '#4dd0e1',
      light: '#80deea',
      dark: '#00bcd4',
      contrastText: '#000',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    success: {
      main: '#66bb6a',
    },
    warning: {
      main: '#ffb74d',
    },
    error: {
      main: '#ef5350',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0bec5',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "Helvetica Neue", -apple-system, BlinkMacSystemFont, "Roboto"',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-1px',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    button: {
      textTransform: 'uppercase',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 20px rgba(66, 165, 245, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s',
        },
      },
    },
  },
});
