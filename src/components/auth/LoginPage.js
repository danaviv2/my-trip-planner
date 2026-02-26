import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button, Divider,
  CircularProgress, Alert, IconButton, InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const FIREBASE_ERROR_MAP = {
  'auth/email-already-in-use': 'כתובת האימייל כבר בשימוש',
  'auth/invalid-email': 'כתובת אימייל לא תקינה',
  'auth/user-not-found': 'משתמש לא קיים',
  'auth/wrong-password': 'סיסמה שגויה',
  'auth/invalid-credential': 'אימייל או סיסמה שגויים',
  'auth/weak-password': 'הסיסמה חייבת להכיל לפחות 6 תווים',
  'auth/too-many-requests': 'יותר מדי ניסיונות, נסה שוב מאוחר יותר',
  'auth/popup-closed-by-user': 'חלון ההתחברות נסגר',
  'auth/network-request-failed': 'שגיאת רשת, בדוק את החיבור',
  'auth/operation-not-allowed': 'שיטת כניסה זו אינה מופעלת — יש להפעיל ב-Firebase Console',
  'auth/configuration-not-found': 'הגדרות Firebase חסרות — יש להפעיל Authentication ב-Console',
};

const translateError = (code) =>
  FIREBASE_ERROR_MAP[code] || 'אירעה שגיאה, נסה שוב';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from || '/';

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (e) {
      setError(translateError(e.code));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      if (mode === 'reset') {
        await resetPassword(email);
        setInfo('נשלח אימייל לאיפוס סיסמה');
      } else if (mode === 'register') {
        await registerWithEmail(email, password, displayName);
        navigate(from, { replace: true });
      } else {
        await loginWithEmail(email, password);
        navigate(from, { replace: true });
      }
    } catch (e) {
      setError(translateError(e.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: { xs: 3, sm: 4 },
          maxWidth: 420,
          width: '100%',
          borderRadius: 3,
          direction: 'rtl',
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>
            ✈️ My Trip Planner
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {mode === 'login' && 'כניסה לחשבון'}
            {mode === 'register' && 'יצירת חשבון חדש'}
            {mode === 'reset' && 'איפוס סיסמה'}
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {info && <Alert severity="success" sx={{ mb: 2 }}>{info}</Alert>}

        {/* Google */}
        {mode !== 'reset' && (
          <>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleGoogle}
              disabled={loading}
              sx={{
                mb: 2,
                py: 1.2,
                borderColor: '#ddd',
                color: '#444',
                fontWeight: 600,
                '&:hover': { borderColor: '#bbb', background: '#f8f8f8' },
              }}
              startIcon={
                <Box
                  component="img"
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  sx={{ width: 20, height: 20 }}
                />
              }
            >
              המשך עם Google
            </Button>

            <Divider sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">או</Typography>
            </Divider>
          </>
        )}

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <TextField
              fullWidth
              label="שם מלא"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              sx={{ mb: 2 }}
            />
          )}

          <TextField
            fullWidth
            label="אימייל"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ mb: 2 }}
          />

          {mode !== 'reset' && (
            <TextField
              fullWidth
              label="סיסמה"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((p) => !p)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}

          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              py: 1.2,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              mb: 1.5,
            }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : (
              mode === 'login' ? 'כניסה' :
              mode === 'register' ? 'הרשמה' :
              'שלח אימייל לאיפוס'
            )}
          </Button>
        </Box>

        {/* Footer links */}
        <Box sx={{ textAlign: 'center', mt: 1 }}>
          {mode === 'login' && (
            <>
              <Button size="small" onClick={() => { setMode('reset'); setError(''); setInfo(''); }}>
                שכחת סיסמה?
              </Button>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" component="span">אין לך חשבון? </Typography>
                <Button size="small" onClick={() => { setMode('register'); setError(''); setInfo(''); }}>
                  הרשמה
                </Button>
              </Box>
            </>
          )}
          {mode === 'register' && (
            <Box>
              <Typography variant="body2" component="span">כבר יש לך חשבון? </Typography>
              <Button size="small" onClick={() => { setMode('login'); setError(''); setInfo(''); }}>
                כניסה
              </Button>
            </Box>
          )}
          {mode === 'reset' && (
            <Button size="small" onClick={() => { setMode('login'); setError(''); setInfo(''); }}>
              חזרה לכניסה
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage;
