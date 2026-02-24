import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Map as MapIcon, Assessment as StatsIcon } from '@mui/icons-material';
import NotificationCenter from '../notifications/NotificationCenter';

const Header = () => {
  return (
    <AppBar position="fixed" sx={{ zIndex: 1100 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          My Trip Planner
        </Typography>
        <NotificationCenter />
        <Button color="inherit" component={Link} to="/">דף הבית</Button>
        <Button color="inherit" component={Link} to="/travel-info">פרטי נסיעה</Button>
        <Button color="inherit" component={Link} to="/advanced-search">חיפוש</Button>
        <Button color="inherit" component={Link} to="/map">מפה</Button>
        <Button 
          color="inherit" 
          component={Link} 
          to="/route-map"
          startIcon={<MapIcon />}
          sx={{ 
            background: 'rgba(255,255,255,0.1)',
            '&:hover': { background: 'rgba(255,255,255,0.2)' }
          }}
        >
          מפת מסלולים
        </Button>
        <Button 
          color="inherit" 
          component={Link} 
          to="/statistics"
          startIcon={<StatsIcon />}
          sx={{ 
            background: 'rgba(255,255,255,0.1)',
            '&:hover': { background: 'rgba(255,255,255,0.2)' }
          }}
        >
          📊 דוחות
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
