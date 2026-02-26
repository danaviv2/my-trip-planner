import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import {
  Home as HomeIcon,
  AltRoute as RouteIcon,
  Search as SearchIcon,
  BookmarkBorder as MyTripsIcon,
  FlightTakeoff as FlightTakeoffIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMediaQuery, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';

const BottomNav = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const navItems = [
    { labelKey: 'bottomNav.home', path: '/', icon: <HomeIcon /> },
    { labelKey: 'bottomNav.routes', path: '/route-map', icon: <RouteIcon /> },
    { labelKey: 'bottomNav.search', path: '/advanced-search', icon: <SearchIcon /> },
    { labelKey: 'bottomNav.myTrips', path: '/my-trips', icon: <MyTripsIcon /> },
    { labelKey: 'bottomNav.plan', path: '/trip-planner', icon: <FlightTakeoffIcon /> },
  ];

  if (!isMobile) return null;

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1099,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <BottomNavigation
        value={location.pathname}
        onChange={(_, newPath) => navigate(newPath)}
        showLabels
      >
        {navItems.map((item) => (
          <BottomNavigationAction
            key={item.path}
            label={t(item.labelKey)}
            value={item.path}
            icon={item.icon}
            sx={{
              '&.Mui-selected': { color: '#667eea' },
              '& .MuiBottomNavigationAction-label': { fontSize: '0.65rem' },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;
