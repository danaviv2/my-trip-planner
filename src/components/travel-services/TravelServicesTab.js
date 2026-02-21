import React, { useState } from 'react';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import FlightIcon from '@mui/icons-material/Flight';
import HotelIcon from '@mui/icons-material/Hotel';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import FlightSearch from './FlightSearch';
import HotelSearch from './HotelSearch';
import CarRentalSearch from './CarRentalSearch';

const TravelServicesTab = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab icon={<FlightIcon />} label="טיסות" iconPosition="start" />
          <Tab icon={<HotelIcon />} label="מלונות" iconPosition="start" />
          <Tab icon={<DirectionsCarIcon />} label="השכרת רכב" iconPosition="start" />
        </Tabs>
      </Paper>

      <Box sx={{ mt: 3 }}>
        {activeTab === 0 && <FlightSearch />}
        {activeTab === 1 && <HotelSearch />}
        {activeTab === 2 && <CarRentalSearch />}
      </Box>
    </Box>
  );
};

export default TravelServicesTab;