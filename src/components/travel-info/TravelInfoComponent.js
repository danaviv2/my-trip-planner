// src/components/travel-info/TravelInfoComponent.js
import React, { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Paper, Typography, Button, IconButton, Alert, AlertTitle, Chip,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import FlightInfo from './FlightInfo';
import CarRentalInfo from './CarRentalInfo';
import EmailImportModal from './EmailImportModal';
import { findConflicts } from '../../services/itineraryConflictService';
import { useBookings } from '../../contexts/BookingsContext';
import BookingDetails from './BookingDetails';

/**
 * TravelInfoComponent - רכיב לניהול פרטי נסיעה
 * מציג ומנהל מידע על טיסות והשכרת רכב
 */
const TravelInfoComponent = () => {
  const { t } = useTranslation();
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
  const { trips } = useBookings();

  // מחושב מחדש בכל שינוי בהזמנות
  const conflicts = findConflicts(flights, carRental, []);
  
  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: '10px', mb: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
        <i className="material-icons" style={{ marginRight: '8px', color: '#2196F3' }}>flight</i>
        {t('travelInfoPage.title')}
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<i className="material-icons">email</i>}
          onClick={() => setEmailImportModalOpen(true)}
        >
          {t('travelInfoPage.import_email')}
        </Button>
        
        <Button 
          variant="outlined"
          startIcon={<i className="material-icons">print</i>}
          onClick={() => window.print()}
        >
          {t('travelInfoPage.print')}
        </Button>
      </Box>
      
      {/* טיולים שנגזרו מההזמנות שיובאו. אישורים שהגיעו בנפרד —
          טיסה, מלון ורכב — מתאחדים כאן לנסיעה אחת. */}
      {trips.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <i className="material-icons" style={{ marginRight: '8px' }}>luggage</i>
            הנסיעות שלך ({trips.length})
          </Typography>
          {trips.map((trip) => (
            <Accordion
              key={trip.id}
              disableGutters
              sx={{ mb: 1, borderRadius: '8px !important', '&:before': { display: 'none' } }}
              variant="outlined"
            >
              <AccordionSummary expandIcon={<i className="material-icons">expand_more</i>}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                    {trip.destination}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {trip.startDate} — {trip.endDate}
                    {trip.nights ? ` · ${trip.nights} לילות` : ''}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {trip.summary.flights > 0 && <Chip size="small" label={`✈️ ${trip.summary.flights} טיסות`} />}
                    {trip.summary.hotels > 0 && <Chip size="small" label={`🏨 ${trip.summary.hotels} מלונות`} />}
                    {trip.summary.cars > 0 && <Chip size="small" label={`🚗 ${trip.summary.cars} רכב`} />}
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                {(trip.bookings || []).map((b, i) => (
                  <BookingDetails key={b.id || i} booking={b} />
                ))}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* התנגשויות בין ההזמנות. הצלבה של פרטים שנראים תקינים בנפרד —
          למשל נחיתה ב-09:55 מול איסוף רכב ב-11:30. */}
      {conflicts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <i className="material-icons" style={{ marginRight: '8px' }}>rule</i>
            בדיקת התאמה בין ההזמנות
          </Typography>
          {conflicts.map((c, i) => (
            <Alert key={i} severity={c.severity} sx={{ mb: 1 }}>
              <AlertTitle sx={{ mb: 0.25, fontWeight: 700 }}>{c.title}</AlertTitle>
              {c.detail}
            </Alert>
          ))}
        </Box>
      )}

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