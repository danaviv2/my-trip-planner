import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, IconButton,
  Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Box, Divider, useMediaQuery, useTheme, Tooltip,
  Avatar, Menu, MenuItem
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Map as MapIcon,
  Assessment as StatsIcon,
  Search as SearchIcon,
  Flight as FlightIcon,
  Explore as ExploreIcon,
  Close as CloseIcon,
  Group as GroupIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  BookmarkBorder as TripsIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import NotificationCenter from '../notifications/NotificationCenter';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import BottomNav from './BottomNav';

const Header = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [langAnchorEl, setLangAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { userPreferences, toggleDarkMode } = useUserPreferences();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const { language, currentLang, changeLanguage, LANGUAGES } = useLanguage();

  const navLinks = [
    { label: t('nav.home'), path: '/', icon: <HomeIcon /> },
    { label: t('nav.travelInfo'), path: '/travel-info', icon: <FlightIcon /> },
    { label: t('nav.destination'), path: '/destination-info', icon: <ExploreIcon /> },
    { label: t('nav.search'), path: '/advanced-search', icon: <SearchIcon /> },
    { label: t('nav.map'), path: '/map', icon: <MapIcon /> },
    { label: t('nav.routeMap'), path: '/route-map', icon: <MapIcon /> },
    { label: `📊 ${t('nav.statistics')}`, path: '/statistics', icon: <StatsIcon /> },
    { label: `🗳️ ${t('nav.groupTrip')}`, path: '/group-trip', icon: <GroupIcon /> },
    { label: `✈️ ${t('nav.myTrips')}`, path: '/my-trips', icon: <TripsIcon /> },
  ];

  const handleAvatarClick = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/');
  };

  const LanguageSwitcher = () => (
    <>
      <Tooltip title="Language / שפה">
        <IconButton
          color="inherit"
          size="small"
          onClick={(e) => setLangAnchorEl(e.currentTarget)}
          sx={{ gap: 0.5 }}
        >
          <LanguageIcon fontSize="small" />
          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
            {currentLang.flag}
          </Typography>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={langAnchorEl}
        open={Boolean(langAnchorEl)}
        onClose={() => setLangAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { mt: 1 } }}
      >
        {LANGUAGES.map((lang) => (
          <MenuItem
            key={lang.code}
            selected={language === lang.code}
            onClick={() => { changeLanguage(lang.code); setLangAnchorEl(null); }}
            sx={{ gap: 1, fontWeight: language === lang.code ? 700 : 400 }}
          >
            {lang.flag} {lang.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: 1100, paddingTop: 'env(safe-area-inset-top)' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* לוגו */}
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              textDecoration: 'none',
              color: 'white',
              fontWeight: 700,
              fontSize: { xs: '1rem', md: '1.25rem' }
            }}
          >
            ✈️ My Trip Planner
          </Typography>

          {/* דסקטופ */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LanguageSwitcher />
              <Tooltip title={userPreferences.darkMode ? t('nav.lightMode') : t('nav.darkMode')}>
                <IconButton color="inherit" onClick={toggleDarkMode} size="small">
                  {userPreferences.darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>
              </Tooltip>
              <NotificationCenter />

              {user ? (
                <>
                  <Tooltip title={user.displayName || user.email}>
                    <IconButton onClick={handleAvatarClick} size="small" sx={{ ml: 0.5 }}>
                      <Avatar
                        src={user.photoURL}
                        sx={{ width: 32, height: 32, bgcolor: '#764ba2', fontSize: 14 }}
                      >
                        {!user.photoURL && (user.displayName?.[0] || user.email?.[0] || '?').toUpperCase()}
                      </Avatar>
                    </IconButton>
                  </Tooltip>
                  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                    <MenuItem onClick={() => { handleMenuClose(); navigate('/my-trips'); }}>
                      <TripsIcon sx={{ mr: 1 }} fontSize="small" /> {t('nav.myTrips')}
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                      <LogoutIcon sx={{ mr: 1 }} fontSize="small" /> {t('nav.logout')}
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Button
                  color="inherit"
                  variant="outlined"
                  component={Link}
                  to="/login"
                  startIcon={<LoginIcon />}
                  sx={{ mr: 1, borderColor: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', flexShrink: 0 }}
                >
                  {t('nav.login')}
                </Button>
              )}

              {navLinks.map((link) => (
                <Button
                  key={link.path}
                  color="inherit"
                  component={Link}
                  to={link.path}
                  sx={{
                    fontSize: '0.85rem',
                    background: location.pathname === link.path ? 'rgba(255,255,255,0.2)' : 'transparent',
                    '&:hover': { background: 'rgba(255,255,255,0.15)' }
                  }}
                >
                  {link.label}
                </Button>
              ))}
            </Box>
          )}

          {/* מובייל */}
          {isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LanguageSwitcher />
              <Tooltip title={userPreferences.darkMode ? t('nav.lightMode') : t('nav.darkMode')}>
                <IconButton color="inherit" onClick={toggleDarkMode} size="small">
                  {userPreferences.darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>
              </Tooltip>
              <NotificationCenter />
              {user ? (
                <>
                  <IconButton onClick={handleAvatarClick} size="small" sx={{ ml: 0.5 }}>
                    <Avatar
                      src={user.photoURL}
                      sx={{ width: 28, height: 28, bgcolor: '#764ba2', fontSize: 12 }}
                    >
                      {!user.photoURL && (user.displayName?.[0] || user.email?.[0] || '?').toUpperCase()}
                    </Avatar>
                  </IconButton>
                  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                    <MenuItem onClick={() => { handleMenuClose(); navigate('/my-trips'); }}>
                      <TripsIcon sx={{ mr: 1 }} fontSize="small" /> {t('nav.myTrips')}
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                      <LogoutIcon sx={{ mr: 1 }} fontSize="small" /> {t('nav.logout')}
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <IconButton color="inherit" component={Link} to="/login" size="small" sx={{ ml: 0.5 }}>
                  <LoginIcon />
                </IconButton>
              )}
              <IconButton color="inherit" onClick={() => setDrawerOpen(true)} sx={{ ml: 1 }}>
                <MenuIcon />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Drawer למובייל */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 260 } }}
      >
        <Box sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6" fontWeight="bold">✈️ {t('nav.menu')}</Typography>
          <IconButton color="inherit" onClick={() => setDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        <List sx={{ pt: 1 }}>
          {navLinks.map((link) => (
            <ListItem key={link.path} disablePadding>
              <ListItemButton
                component={Link}
                to={link.path}
                onClick={() => setDrawerOpen(false)}
                selected={location.pathname === link.path}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    background: 'linear-gradient(135deg, #667eea22 0%, #764ba222 100%)',
                    color: '#667eea',
                    '& .MuiListItemIcon-root': { color: '#667eea' }
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{link.icon}</ListItemIcon>
                <ListItemText
                  primary={link.label}
                  primaryTypographyProps={{ fontWeight: location.pathname === link.path ? 700 : 400 }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider />

        {/* אזור משתמש + שפה בתחתית */}
        <Box sx={{ p: 2 }}>
          {/* בורר שפה */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            {LANGUAGES.map((lang) => (
              <Button
                key={lang.code}
                size="small"
                variant={language === lang.code ? 'contained' : 'outlined'}
                onClick={() => { changeLanguage(lang.code); setDrawerOpen(false); }}
                sx={{
                  fontSize: '0.75rem',
                  minWidth: 0,
                  px: 1.5,
                  ...(language === lang.code && {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }),
                }}
              >
                {lang.flag} {lang.label}
              </Button>
            ))}
          </Box>

          {user ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Avatar src={user.photoURL} sx={{ width: 36, height: 36, bgcolor: '#764ba2', fontSize: 14 }}>
                  {!user.photoURL && (user.displayName?.[0] || user.email?.[0] || '?').toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={600}>{user.displayName || 'משתמש'}</Typography>
                  <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                </Box>
              </Box>
              <Button
                fullWidth variant="outlined" color="error" size="small"
                startIcon={<LogoutIcon />}
                onClick={() => { setDrawerOpen(false); handleLogout(); }}
              >
                {t('nav.logout')}
              </Button>
            </>
          ) : (
            <Button
              fullWidth variant="contained" size="small"
              startIcon={<LoginIcon />}
              component={Link}
              to="/login"
              onClick={() => setDrawerOpen(false)}
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              {t('nav.login')}
            </Button>
          )}
        </Box>
      </Drawer>

      <BottomNav />
    </>
  );
};

export default Header;
