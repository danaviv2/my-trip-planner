// src/components/travel-info/TravelInfoComponent.js
import React, { useState, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Paper, Typography, Button, IconButton, Alert, AlertTitle, Chip,
  Accordion, AccordionSummary, AccordionDetails,
  Dialog, DialogTitle, DialogContent, DialogActions
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
  const [showPast, setShowPast] = useState(false);
  const { trips, autoScanning, autoScanResult, cloudError, removeBooking, resetAllBookings } = useBookings();
  const [resetOpen, setResetOpen] = useState(false);
  const [resetDone, setResetDone] = useState(null);

  // נסיעה שהסתיימה אינה רעש: היא נושאת הוצאות, אישורים ולעיתים תביעת
  // פיצוי שטרם הוגשה. אבל נסיעה משנה שעברה כן מטשטשת את השאלה היחידה
  // שמעניינת במסך — מה קרוב.
  //
  // הגבול אינו "עבר מול עתיד" אלא "פתוח מול סגור": בשבועות שאחרי
  // החזרה עוד מגישים החזרים ובודקים חיובים, ולכן נסיעה טרייה נשארת
  // למעלה. אחרי כן היא היסטוריה.
  const { upcoming, past } = useMemo(() => {
    const ACTIVE_DAYS = 90;
    const cutoff = new Date(Date.now() - ACTIVE_DAYS * 86400000).toISOString().slice(0, 10);
    return {
      // הקבוצה הלא-משויכת אינה ארכיון: היא דורשת טיפול, ולכן נשארת למעלה.
      upcoming: trips.filter((t) => t.undated || !t.endDate || t.endDate >= cutoff),
      past: trips.filter((t) => !t.undated && t.endDate && t.endDate < cutoff),
    };
  }, [trips]);

  // מחושב מחדש בכל שינוי בהזמנות
  const conflicts = findConflicts(flights, carRental, []);

  const renderTrip = (trip) => (
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
                    {trip.undated
                      ? 'לא נקראו תאריכים מהאישור, או שהתאריכים אינם חלים על אף נסיעה'
                      : `${trip.startDate} — ${trip.endDate}${trip.nights ? ` · ${trip.nights} לילות` : ''}`}
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
  );
  
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
      {/* טיולים שנגזרו מההזמנות שיובאו. אישורים שהגיעו בנפרד —
          טיסה, מלון ורכב — מתאחדים כאן לנסיעה אחת. */}
      {upcoming.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <i className="material-icons" style={{ marginRight: '8px' }}>luggage</i>
            הנסיעות שלך ({upcoming.length})
          </Typography>
          {upcoming.map(renderTrip)}
        </Box>
      )}

      {/* נסיעות שהסתיימו — ארכיון. מקופל כברירת מחדל: הן אינן רלוונטיות
          לתכנון, אך נושאות הוצאות ואישורים שאולי יידרשו מול הספק. */}
      {/* איפוס. פעולה הרסנית, ולכן היא קטנה, מנוסחת במפורש ודורשת אישור.
          נדרשת לבדיקה נקייה: סימוני המחיקה שורדים מחיקת הזמנות, ולכן
          סריקה חוזרת מדלגת דווקא על מה שנמחק. */}
      {(upcoming.length > 0 || past.length > 0) && (
        <Box sx={{ mb: 2 }}>
          <Button size="small" color="error" onClick={() => setResetOpen(true)} sx={{ fontSize: '0.75rem' }}>
            נקה את כל ההזמנות והתחל מחדש
          </Button>
        </Box>
      )}

      {/* חותמת הבנייה. קטנה ולא מפריעה, אך מסיימת את השאלה "האם התיקון
          כבר אצלי" — שאלה שעלתה כאן שוב ושוב ובזבזה סבבים שלמים. */}
      <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'text.disabled', fontSize: '0.65rem' }}>
        גרסה: {process.env.REACT_APP_BUILD_TIME
          ? new Date(process.env.REACT_APP_BUILD_TIME).toLocaleString('he-IL', {
              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
            })
          : 'פיתוח'}
      </Typography>

      <Dialog open={resetOpen} onClose={() => setResetOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>לנקות את כל ההזמנות?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            יימחקו כל ההזמנות שיובאו, וגם סימוני המחיקה והביטול ששמורים עליהן.
          </Typography>
          <Alert severity="info" sx={{ mb: 1 }}>
            הסימונים נמחקים בכוונה: בלעדיהם הסריקה הבאה תדלג דווקא על ההזמנות
            שמחקת בעבר, ותקבל תמונה חלקית.
          </Alert>
          <Typography variant="caption" color="text.secondary">
            המיילים עצמם אינם נמחקים. סריקה חוזרת תייבא הכול מחדש.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetOpen(false)}>ביטול</Button>
          <Button
            color="error"
            variant="contained"
            onClick={async () => {
              const r = await resetAllBookings();
              setResetOpen(false);
              setResetDone(r.bookings);
            }}
          >
            נקה הכול
          </Button>
        </DialogActions>
      </Dialog>

      {resetDone !== null && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setResetDone(null)}>
          נוקו {resetDone} הזמנות וכל הסימונים. הרץ סריקה כדי לייבא מחדש.
        </Alert>
      )}

      {past.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Button
            size="small"
            color="inherit"
            onClick={() => setShowPast((v) => !v)}
            startIcon={<i className="material-icons">{showPast ? 'expand_less' : 'expand_more'}</i>}
            sx={{ fontWeight: 700, color: 'text.secondary' }}
          >
            נסיעות קודמות ({past.length})
          </Button>
          {showPast && <Box sx={{ mt: 1 }}>{past.map(renderTrip)}</Box>}
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