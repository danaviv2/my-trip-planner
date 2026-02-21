// src/components/layout/MainTabs.js
import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import FlightIcon from '@mui/icons-material/Flight';
import LocationCityIcon from '@mui/icons-material/LocationCity';

/**
 * MainTabs - קומפוננט ללשוניות הראשיות של האפליקציה
 * משמש לניווט בין המסכים הראשיים
 */
const MainTabs = ({ activeTab, onTabChange }) => {
  // טיפול בשינוי לשונית
  const handleChange = (event, newValue) => {
    onTabChange(newValue);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Tabs 
        value={activeTab} 
        onChange={handleChange}
        variant="fullWidth"
        sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          '& .MuiTab-root': {
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          },
          '& .Mui-selected': {
            color: '#2196F3'
          }
        }}
      >
        <Tab 
          value="plan" 
          label="תכנון מסלול" 
          icon={<MapIcon />} 
          iconPosition="start"
          sx={{ 
            fontSize: '1rem', 
            '&:hover': { 
              backgroundColor: '#f0f7ff' 
            } 
          }}
        />
        <Tab 
          value="services" 
          label="שירותי נסיעות" 
          icon={<FlightIcon />} 
          iconPosition="start"
          sx={{ 
            fontSize: '1rem', 
            '&:hover': { 
              backgroundColor: '#f0f7ff' 
            } 
          }}
        />
        <Tab 
          value="destination" 
          label="מידע על היעד" 
          icon={<LocationCityIcon />} 
          iconPosition="start"
          sx={{ 
            fontSize: '1rem', 
            '&:hover': { 
              backgroundColor: '#f0f7ff' 
            } 
          }}
        />
      </Tabs>
    </Box>
  );
};

export default MainTabs;