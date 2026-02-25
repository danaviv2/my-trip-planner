import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, IconButton,
  Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Box, Divider, useMediaQuery, useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Map as MapIcon,
  Assessment as StatsIcon,
  Search as SearchIcon,
  Flight as FlightIcon,
  Explore as ExploreIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import NotificationCenter from '../notifications/NotificationCenter';

const navLinks = [
  { label: 'דף הבית', path: '/', icon: <HomeIcon /> },
  { label: 'פרטי נסיעה', path: '/travel-info', icon: <FlightIcon /> },
  { label: 'מידע על יעד', path: '/destination-info', icon: <ExploreIcon /> },
  { label: 'חיפוש', path: '/advanced-search', icon: <SearchIcon /> },
  { label: 'מפה', path: '/map', icon: <MapIcon /> },
  { label: 'מפת מסלולים', path: '/route-map', icon: <MapIcon /> },
  { label: '📊 דוחות', path: '/statistics', icon: <StatsIcon /> },
];

const Header = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: 1100 }}>
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
              <NotificationCenter />
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
              <NotificationCenter />
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
      </Drawer>
    </>
  );
};

export default Header;
