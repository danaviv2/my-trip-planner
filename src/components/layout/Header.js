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
} from '@mui/icons-material';
import NotificationCenter from '../notifications/NotificationCenter';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import { useAuth } from '../../contexts/AuthContext';
import BottomNav from './BottomNav';

const navLinks = [
  { label: 'דף הבית', path: '/', icon: <HomeIcon /> },
  { label: 'פרטי נסיעה', path: '/travel-info', icon: <FlightIcon /> },
  { label: 'מידע על יעד', path: '/destination-info', icon: <ExploreIcon /> },
  { label: 'חיפוש', path: '/advanced-search', icon: <SearchIcon /> },
  { label: 'מפה', path: '/map', icon: <MapIcon /> },
  { label: 'מפת מסלולים', path: '/route-map', icon: <MapIcon /> },
  { label: '📊 דוחות', path: '/statistics', icon: <StatsIcon /> },
  { label: '🗳️ טיול קבוצתי', path: '/group-trip', icon: <GroupIcon /> },
  { label: '✈️ הטיולים שלי', path: '/my-trips', icon: <TripsIcon /> },
];

const Header = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { userPreferences, toggleDarkMode } = useUserPreferences();
  const { user, logout } = useAuth();

  const handleAvatarClick = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/');
  };

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

          {/* דסקטופ - כפתורים */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title={userPreferences.darkMode ? 'מצב בהיר' : 'מצב כהה'}>
                <IconButton color="inherit" onClick={toggleDarkMode} size="small">
                  {userPreferences.darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>
              </Tooltip>
              <NotificationCenter />

              {/* כפתור התחברות / Avatar — תמיד גלוי, לפני הקישורים */}
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
                      <TripsIcon sx={{ mr: 1 }} fontSize="small" /> הטיולים שלי
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                      <LogoutIcon sx={{ mr: 1 }} fontSize="small" /> התנתק
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
                  התחברות
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

          {/* מובייל - פעמון + המבורגר */}
          {isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title={userPreferences.darkMode ? 'מצב בהיר' : 'מצב כהה'}>
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
                      <TripsIcon sx={{ mr: 1 }} fontSize="small" /> הטיולים שלי
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                      <LogoutIcon sx={{ mr: 1 }} fontSize="small" /> התנתק
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <IconButton color="inherit" component={Link} to="/login" size="small" sx={{ ml: 0.5 }}>
                  <LoginIcon />
                </IconButton>
              )}
              <IconButton
                color="inherit"
                onClick={() => setDrawerOpen(true)}
                sx={{ ml: 1 }}
              >
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
          <Typography variant="h6" fontWeight="bold">✈️ תפריט</Typography>
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

        {/* אזור משתמש בתחתית הדרואר */}
        <Box sx={{ p: 2 }}>
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
                התנתק
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
              התחברות
            </Button>
          )}
        </Box>
      </Drawer>

      <BottomNav />
    </>
  );
};

export default Header;
