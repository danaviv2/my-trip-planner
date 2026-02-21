// src/components/travel-info/TravelInfoComponent.js
import React, { useState, useContext } from 'react';
import { 
  Box, Paper, Typography, Button, IconButton 
} from '@mui/material';
import FlightInfo from './FlightInfo';
import CarRentalInfo from './CarRentalInfo';
import EmailImportModal from './EmailImportModal';

/**
 * TravelInfoComponent - רכיב לניהול פרטי נסיעה
 * מציג ומנהל מידע על טיסות והשכרת רכב
 */
const TravelInfoComponent = () => {
  // מצבים לניהול פרטי הטיסות
  const [flights, setFlights] = useState([
    { id: 1, type: 'departure', flightNumber: '', airline: '', date: '', departureTime: '', departureAirport: '', arrivalTime: '', arrivalAirport: '', terminal: '' }
  ]);
  
  // מצבים לניהול פרטי הרכב
  const [carRental, setCarRental] = useState({
    company: '',
    pickupDate: '',
    pickupTime: '',
    pickupLocation: '',
    returnDate: '',
    returnTime: '',
    returnLocation: '',
    carType: '',
    confirmationNumber: ''
  });
  
  // מצב פתיחת חלונית מידע
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [emailImportModalOpen, setEmailImportModalOpen] = useState(false);
  
  // מצבים לניהול תצוגה
  const [showFlights, setShowFlights] = useState(true);
  const [showCarRental, setShowCarRental] = useState(true);
  
  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: '10px', mb: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
        <i className="material-icons" style={{ marginRight: '8px', color: '#2196F3' }}>flight</i>
        פרטי נסיעה
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<i className="material-icons">email</i>}
          onClick={() => setEmailImportModalOpen(true)}
        >
          ייבא פרטים ממייל
        </Button>
        
        <Button 
          variant="outlined"
          startIcon={<i className="material-icons">print</i>}
          onClick={() => window.print()}
        >
          הדפס פרטי נסיעה
        </Button>
      </Box>
      
      {/* אזור טיסות */}
      <FlightInfo 
        flights={flights} 
        setFlights={setFlights} 
        showFlights={showFlights}
        setShowFlights={setShowFlights}
      />
      
      {/* אזור השכרת רכב */}
      <CarRentalInfo 
        carRental={carRental}
        setCarRental={setCarRental}
        showCarRental={showCarRental}
        setShowCarRental={setShowCarRental}
      />
      
      {/* חלונית ייבוא מאימייל */}
      <EmailImportModal 
        open={emailImportModalOpen}
        onClose={() => setEmailImportModalOpen(false)}
        setFlights={setFlights}
        setCarRental={setCarRental}
      />
    </Paper>
  );
};

export default TravelInfoComponent;