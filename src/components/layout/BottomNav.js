import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import {
  Home as HomeIcon,
  AltRoute as RouteIcon,
  Search as SearchIcon,
  Explore as ExploreIcon,
  FlightTakeoff as FlightTakeoffIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMediaQuery, useTheme } from '@mui/material';

const navItems = [
  { label: 'בית', path: '/', icon: <HomeIcon /> },
  { label: 'מסלולים', path: '/route-map', icon: <RouteIcon /> },
  { label: 'חיפוש', path: '/advanced-search', icon: <SearchIcon /> },
  { label: 'יעד', path: '/destination-info', icon: <ExploreIcon /> },
  { label: 'תכנון', path: '/trip-planner', icon: <FlightTakeoffIcon /> },
];

const BottomNav = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();

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
            label={item.label}
            value={item.path}
            icon={item.icon}
            sx={{
              '&.Mui-selected': {
                color: '#667eea',
              },
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.65rem',
              },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;
