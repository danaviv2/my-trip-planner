import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button, Divider,
  CircularProgress, Alert, IconButton, InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword } = useAuth();
  const { t } = useTranslation();
  const { currentLang } = useLanguage();

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from || '/';

  const translateError = (code) => {
    const key = code?.replace('auth/', '');
    return t(`login.errors.${key}`, { defaultValue: t('login.errors.default') });
  };

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
        setInfo(t('login.resetSent'));
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
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      p: 2,
    }}>
      <Paper elevation={8} sx={{
        p: { xs: 3, sm: 4 },
        maxWidth: 420,
        width: '100%',
        borderRadius: 3,
        direction: currentLang.dir,
      }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>✈️ My Trip Planner</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {mode === 'login' && t('login.subtitle_login')}
            {mode === 'register' && t('login.subtitle_register')}
            {mode === 'reset' && t('login.subtitle_reset')}
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {info && <Alert severity="success" sx={{ mb: 2 }}>{info}</Alert>}

        {mode !== 'reset' && (
          <>
            <Button
              fullWidth variant="outlined" onClick={handleGoogle} disabled={loading}
              sx={{
                mb: 2, py: 1.2, borderColor: '#ddd', color: '#444', fontWeight: 600,
                '&:hover': { borderColor: '#bbb', background: '#f8f8f8' },
              }}
              startIcon={
                <Box component="img"
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google" sx={{ width: 20, height: 20 }}
                />
              }
            >
              {t('login.continueGoogle')}
            </Button>
            <Divider sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">{t('login.or')}</Typography>
            </Divider>
          </>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <TextField fullWidth label={t('login.fullName')} value={displayName}
              onChange={(e) => setDisplayName(e.target.value)} required sx={{ mb: 2 }} />
          )}
          <TextField fullWidth label={t('login.email')} type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} required sx={{ mb: 2 }} />
          {mode !== 'reset' && (
            <TextField
              fullWidth label={t('login.password')}
              type={showPassword ? 'text' : 'password'}
              value={password} onChange={(e) => setPassword(e.target.value)}
              required sx={{ mb: 2 }}
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
          <Button fullWidth type="submit" variant="contained" disabled={loading}
            sx={{ py: 1.2, fontWeight: 700, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', mb: 1.5 }}>
            {loading ? <CircularProgress size={22} color="inherit" /> : (
              mode === 'login' ? t('login.btn_login') :
              mode === 'register' ? t('login.btn_register') :
              t('login.btn_reset')
            )}
          </Button>
        </Box>

        <Box sx={{ textAlign: 'center', mt: 1 }}>
          {mode === 'login' && (
            <>
              <Button size="small" onClick={() => { setMode('reset'); setError(''); setInfo(''); }}>
                {t('login.forgotPassword')}
              </Button>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" component="span">{t('login.noAccount')} </Typography>
                <Button size="small" onClick={() => { setMode('register'); setError(''); setInfo(''); }}>
                  {t('login.register')}
                </Button>
              </Box>
            </>
          )}
          {mode === 'register' && (
            <Box>
              <Typography variant="body2" component="span">{t('login.hasAccount')} </Typography>
              <Button size="small" onClick={() => { setMode('login'); setError(''); setInfo(''); }}>
                {t('login.btn_login')}
              </Button>
            </Box>
          )}
          {mode === 'reset' && (
            <Button size="small" onClick={() => { setMode('login'); setError(''); setInfo(''); }}>
              {t('login.backToLogin')}
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage;
