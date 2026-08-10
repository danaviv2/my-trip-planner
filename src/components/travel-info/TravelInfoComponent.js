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
import { findDrivingRestrictions } from '../../services/drivingRestrictionsService';
import { useBookings } from '../../contexts/BookingsContext';
import BookingDetails from './BookingDetails';
import FlightRights from './FlightRights';
import { tripCost, formatTotals } from '../../services/tripCostService';

/**
 * מריץ את בדיקת ההתנגשויות על ההזמנות של נסיעה שיובאה.
 *
 * ההזמנות שמורות עם type='flight' והכיוון בשדה direction, בעוד
 * findConflicts מצפה ל-type='departure'/'return' — לכן הממיר כאן.
 * נסיעה יכולה לכלול יותר מרכב אחד (למשל איסוף בנאפולי והחזרה ברומא),
 * ולכן הבדיקה רצה לכל רכב בנפרד והתוצאות מאוחדות ללא כפילויות.
 */
const tripConflicts = (trip) => {
  const bookings = trip?.bookings || [];
  const flights = bookings
    .filter((b) => b.type === 'flight')
    .map((b) => ({ ...b, type: b.direction === 'return' ? 'return' : 'departure' }));
  // הסעות נבדקות בנפרד מהשכרות: הכללים שונים לחלוטין
  const cars = bookings.filter((b) => b.type === 'car_rental' || b.type === 'transfer');
  const hotels = bookings.filter((b) => b.type === 'hotel');

  if (!flights.length && !cars.length && !hotels.length) return [];

  const all = [
    ...(cars.length
      ? cars.flatMap((car) => findConflicts(flights, car, hotels))
      : findConflicts(flights, null, hotels)),
    // מגבלות נהיגה נגזרות מהנסיעה כולה ולא מהזמנה בודדת: הן תלויות
    // בשילוב של רכב שכור והמקומות שבהם הוא ייסע.
    ...findDrivingRestrictions(bookings),
  ];

  const seen = new Set();
  return all.filter((c) => {
    const k = `${c.severity}|${c.title}|${c.detail}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

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
  const { trips, autoScanning, autoScanResult, cloudError, removeBooking } = useBookings();

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
      
      {cloudError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle sx={{ fontWeight: 700, mb: 0.25 }}>הנסיעות שמורות במכשיר הזה בלבד</AlertTitle>
          הגיבוי לענן אינו זמין כרגע. הנתונים לא ילכו לאיבוד, אך ניקוי היסטוריית
          הדפדפן ימחק אותם ולא תראה אותם ממכשיר אחר.
        </Alert>
      )}

      {/* הסריקה השקטה רצה בלי שהמשתמש ביקש. בלי חיווי, נסיעה חדשה
          שמופיעה לבדה נראית כמו תקלה ולא כמו שירות. */}
      {autoScanning && (
        <Alert severity="info" icon={<i className="material-icons">sync</i>} sx={{ mb: 2 }}>
          מחפש אישורי הזמנה חדשים בתיבת המייל שלך...
        </Alert>
      )}
      {!autoScanning && autoScanResult?.added > 0 && (
        <Alert severity="success" sx={{ mb: 2 }}>
          נמצאו {autoScanResult.added} הזמנות חדשות במייל ושויכו לנסיעות אוטומטית.
        </Alert>
      )}

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
                  {/* עלות מתוך המחירים שנקלטו באישורים. כשחלק מההזמנות
                      ללא מחיר נאמר זאת במפורש — סכום חלקי שמוצג כעלות
                      הנסיעה מטעה יותר מאשר לא להציג דבר. */}
                  {(() => {
                    const c = tripCost(trip.bookings || []);
                    if (!c.hasCost) return null;
                    return (
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 700 }}>
                        {formatTotals(c.byCurrency)}
                        {!c.complete && (
                          <Typography component="span" variant="caption" sx={{ fontWeight: 400, color: 'text.secondary' }}>
                            {' '}· מתוך {c.withPrice} מ-{c.total} הזמנות שכללו מחיר
                          </Typography>
                        )}
                      </Typography>
                    );
                  })()}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {trip.summary.flights > 0 && <Chip size="small" label={`✈️ ${trip.summary.flights} טיסות`} />}
                    {trip.summary.hotels > 0 && <Chip size="small" label={`🏨 ${trip.summary.hotels} מלונות`} />}
                    {trip.summary.cars > 0 && <Chip size="small" label={`🚗 ${trip.summary.cars} רכב`} />}
                    {trip.summary.transfers > 0 && <Chip size="small" label={`🚕 ${trip.summary.transfers} הסעות`} />}
                    {trip.summary.activities > 0 && <Chip size="small" label={`🎟️ ${trip.summary.activities} אטרקציות`} />}
                    {trip.summary.insurance > 0 && <Chip size="small" color="success" label="🛡️ מבוטח" />}
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                {/* ההתנגשויות נבדקות על ההזמנות של הנסיעה עצמה. קודם הן
                    חושבו על הטופס בלבד, ולכן פער של אפס דקות בין נחיתה
                    לאיסוף רכב שיובאו מהמייל לא נתפס. */}
                {tripConflicts(trip).map((c, i) => (
                  <Alert key={i} severity={c.severity} sx={{ mb: 1 }}>
                    <AlertTitle sx={{ mb: 0.25, fontWeight: 700 }}>{c.title}</AlertTitle>
                    {c.detail}
                  </Alert>
                ))}
                {(trip.bookings || []).map((b, i) => (
                  <BookingDetails key={b.id || i} booking={b} onDelete={removeBooking} />
                ))}

                {/* זכויות הנוסע לכל טיסה. מוצג גם כשהכול תקין — הידיעה
                    שווה דווקא מראש, שכן הסף האירופי נמוך בהרבה מהישראלי
                    ורוב הנוסעים אינם מודעים לכך. */}
                {(trip.bookings || [])
                  .filter((b) => b.type === 'flight')
                  .map((b, i) => (
                    <FlightRights key={`r${b.id || i}`} flight={b} passengers={2} />
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