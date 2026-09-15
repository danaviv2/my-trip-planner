import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Typography,
  Button,
  Paper,
  Box,
  Tabs,
  Tab,
  Grid,
  Chip,
  Divider,
  Alert,
  AlertTitle,
} from '@mui/material';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { useTripSave } from '../contexts/TripSaveContext';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TripPlanner from '../components/trip-planner/TripPlanner';
import AccommodationPlanner from '../components/trip-planner/AccommodationPlanner';
import ShareTripDialog from '../components/shared/ShareTripDialog';
import ShareIcon from '@mui/icons-material/Share';
import FlightIcon from '@mui/icons-material/Flight';
import HotelIcon from '@mui/icons-material/Hotel';
import DriveEtaIcon from '@mui/icons-material/DriveEta';
import FlightSearch from '../components/travel-services/FlightSearch';
import HotelSearch from '../components/travel-services/HotelSearch';
import CarRentalSearch from '../components/travel-services/CarRentalSearch';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useTripContext } from '../contexts/TripContext';
import HotelMap from '../components/map/HotelMap';
import TripMap from '../components/map/TripMap';
import BookingSync from '../components/bookings/BookingSync';
import { useAuth } from '../contexts/AuthContext';
import { saveBooking, loadBookings, deleteBooking } from '../services/firestoreService';
import { bookingEmoji, bookingColor, bookingLabel } from '../services/bookingParserService';
import { groupBookingsIntoTrips } from '../services/tripGroupingService';
import { findDrivingRestrictions } from '../services/drivingRestrictionsService';
import { findTicketConflicts } from '../services/ticketConflictService';
import DeleteIcon from '@mui/icons-material/Delete';

import { noflip } from '../utils/noflip';
const TripPlannerPage = () => {
  const { userPreferences, updateLocation, updateDays, updateBudget, updateStartDate } = useUserPreferences();
  const { saveTripToList, savedTrips } = useTripSave();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { tripPlan, selectedDayIndex, setSelectedDayIndex, updateTripPlan } = useTripContext();
  const [saved, setSaved] = useState(false);
  const [lastSavedTripId, setLastSavedTripId] = useState(searchParams.get('tripId') || null);
  const [shareOpen, setShareOpen] = useState(false);
  const [mainTab, setMainTab] = useState('plan');
  const [servicesTab, setServicesTab] = useState(0);
  // ── הלינה שייכת לטיול ──
  // עד 15.09.2026 זו הייתה רשימה אחת ב-localStorage (`accommodations`) לכל
  // הטיולים: מלון שנוסף בתכנון סאן פרנסיסקו הופיע גם בניו יורק, ולא נשמר
  // בחשבון. עכשיו היא חלק מהטיוטה (tripPlan), כמו הימים, ונשמרת עם הטיול.
  // פונקציית עדכון, כדי ששתי הוספות ברצף לא ידרסו זו את זו.
  const accommodations = tripPlan?.accommodations || [];
  const setAccommodations = (updater) => updateTripPlan((prev) => {
    const current = prev?.accommodations || [];
    const next = typeof updater === 'function' ? updater(current) : updater;
    return { ...(prev || {}), accommodations: next };
  });

  // ── העברה חד-פעמית מהרשימה הישנה ──
  // מלון בלי תאריכים אינו מלמד לאיזה טיול הוא שייך, ולכן לא מנחשים: הרשימה
  // כולה עוברת לטיול שפתוח עכשיו, כפי שהמשתמש ראה אותה עד היום. המפתח
  // נמחק רק אחרי שיש טיול לקבל אותה — אחרת היא הייתה נעלמת בשקט.
  useEffect(() => {
    if (!tripPlan?.dailyItinerary?.length) return;
    let legacy = [];
    try { legacy = JSON.parse(localStorage.getItem('accommodations') || '[]'); } catch {}
    if (!Array.isArray(legacy)) legacy = [];
    if (legacy.length) {
      setAccommodations((current) => [
        ...current,
        ...legacy.filter((h) => h && !current.some((c) => c.name === h.name && c.checkIn === h.checkIn)),
      ]);
    }
    try { localStorage.removeItem('accommodations'); } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripPlan?.dailyItinerary?.length]);
  const [hotelModalOpen, setHotelModalOpen] = useState(false);
  const [mapFocus, setMapFocus] = useState(null);

  // ── מצב המפה: יום נבחר או כל הנסיעה ──
  // state מקומי בכוונה. `selectedDayIndex` משותף עם הציר ועם
  // `TripPlanner`, ומעבר למבט המלא אינו אמור להזיז את היום שהמשתמש
  // עומד עליו — הוא חוזר אליו כשהוא מכבה את המתג.
  const [wholeTripMap, setWholeTripMap] = useState(false);
  const [hotelRecommendations, setHotelRecommendations] = useState([]);
  const [syncedBookings, setSyncedBookings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('syncedBookings') || '[]'); } catch { return []; }
  });

  const plannerDestination = tripPlan?.destination || userPreferences.location || '';

  /**
   * ההזמנות ששייכות לטיול הפתוח בלבד.
   *
   * הפאנל הציג את כל ההזמנות של המשתמש בכל טיול שנפתח, ולכן מלונות
   * מנאפולי הופיעו בתוך תכנון לניו יורק. הוא נראה תקין רק משום שהיה
   * ריק: הטעינה מ-Firestore נכשלה בשקט כל עוד לא היה מסד נתונים.
   *
   * השיוך נעשה באותו קיבוץ שמשמש את מסך פרטי הנסיעה, ולפי שם היעד.
   * כשאין התאמה מוצג "אין הזמנות ליעד הזה" ולא הכול.
   */
  const tripBookings = useMemo(() => {
    const dest = plannerDestination.trim().toLowerCase();
    if (!dest || !syncedBookings.length) return [];
    const match = groupBookingsIntoTrips(syncedBookings).find((t) => {
      const d = String(t.destination || '').toLowerCase();
      return d && (d.includes(dest) || dest.includes(d));
    });
    return match ? match.bookings : [];
  }, [syncedBookings, plannerDestination]);

  /**
   * מגבלות נהיגה ליעד שהוקלד, עוד לפני שהוזמן דבר.
   *
   * זה העיתוי שבו האזהרה שווה ביותר: מדבקת Crit'Air מגיעה בדואר תוך
   * שבועות, ורישום רכב זר בבלגיה או בברצלונה נעשה מראש. אפליקציית ניווט
   * מתריעה כשמגיעים לשער — ואז כבר אי אפשר להסדיר דבר.
   */
  const drivingAlerts = useMemo(
    () => findDrivingRestrictions(tripBookings, plannerDestination),
    [tripBookings, plannerDestination]
  );

  /**
   * כרטיסים מתוזמנים מול התכנון היומי.
   *
   * כרטיס לשעה מסוימת הוא אילוץ ולא מסמך: אם המתכנן שיבץ באותה שעה משהו
   * אחר, אחד מהם ייפול — והכרטיס לרוב אינו מוחזר בעוד התכנון ניתן לשינוי.
   */
  const ticketAlerts = useMemo(
    () => findTicketConflicts(tripBookings, tripPlan?.dailyItinerary || [], userPreferences.startDate),
    [tripBookings, tripPlan, userPreferences.startDate]
  );

  /**
   * כותרת קריאה להזמנה, לפי סוגה.
   *
   * הפאנל הציג `b.name` בלבד — שדה שקיים במלונות בלבד — ולכן טיסות
   * והשכרות רכב צוירו כשורות ריקות לחלוטין.
   */
  const bookingHeadline = (b) => {
    if (b.type === 'flight') {
      return [b.airline, b.flightNumber].filter(Boolean).join(' · ') || 'טיסה';
    }
    if (b.type === 'car_rental') return b.company || 'השכרת רכב';
    if (b.type === 'transfer') return `הסעה${b.company ? ` · ${b.company}` : ''}`;
    return b.name || 'הזמנה';
  };

  /** שורת המשנה: תאריכים ומסלול, לפי סוג ההזמנה. */
  const bookingSubline = (b) => {
    if (b.type === 'flight') {
      const route = [b.departureAirport, b.arrivalAirport].filter(Boolean).join(' → ');
      return [b.date, route, [b.departureTime, b.arrivalTime].filter(Boolean).join('–')]
        .filter(Boolean).join(' · ');
    }
    if (b.type === 'car_rental' || b.type === 'transfer') {
      const span = [b.pickupDate, b.returnDate].filter(Boolean).join(' → ');
      return [span, b.pickupTime].filter(Boolean).join(' · ');
    }
    const span = [b.checkIn, b.checkOut].filter(Boolean).join(' → ');
    return [span, b.price].filter(Boolean).join(' · ');
  };
  const restoredRef = useRef(false);


  // ── טעינה מ-Firestore: פעם אחת לכל משתמש ──
  // שלושה דברים היו שבורים כאן, וכולם באותו כיוון — קריאות מיותרות
  // למסד שמחויב לפי קריאת מסמך:
  //
  // 1. התלות הייתה `[user]`, כלומר אובייקט. `onAuthStateChanged` יורה
  //    גם ברענון טוקן ומוסר אובייקט חדש, וכל רענון כזה היה מריץ שליפה
  //    מלאה מחדש. `user?.uid` הוא מחרוזת ומשתנה רק כשהמשתמש באמת מתחלף.
  // 2. `syncedBookings` נקרא מתוך סגירה מיושנת ש-eslint-disable הסתיר.
  //    עדכון פונקציונלי קורא את הערך העדכני ואינו זקוק לתלות.
  // 3. `setSyncedBookings` קיבל מערך חדש תמיד, גם כשדבר לא השתנה —
  //    ולכן כל שליפה גררה רינדור מחדש של העמוד ושל כל צרכני `useAuth`.
  //    עכשיו הזהות נשמרת כשהתוכן זהה, והשרשרת נעצרת.
  const uid = user?.uid;
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;

    loadBookings(uid)
      .then((fb) => {
        if (cancelled) return;
        setSyncedBookings((prev) => {
          const fbIds = new Set(fb.map((b) => String(b.id)));
          const merged = [...fb, ...prev.filter((b) => !fbIds.has(String(b.id)))];
          // אותו אורך ואותם מזהים באותו סדר — אין מה לעדכן.
          const same =
            merged.length === prev.length &&
            merged.every((b, i) => String(b.id) === String(prev[i].id));
          if (same) return prev;
          try {
            localStorage.setItem('syncedBookings', JSON.stringify(merged));
          } catch {
            // מכסת אחסון מלאה: הרשימה עדיין עובדת בזיכרון
          }
          return merged;
        });
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [uid]);

  const handleBookingAdded = async (booking) => {
    const updated = [...syncedBookings.filter(b => b.id !== booking.id), booking];
    setSyncedBookings(updated);
    localStorage.setItem('syncedBookings', JSON.stringify(updated));
    if (user) {
      try { await saveBooking(user.uid, booking); } catch {}
    }
  };

  const handleBookingDeleted = async (bookingId) => {
    const updated = syncedBookings.filter(b => b.id !== bookingId);
    setSyncedBookings(updated);
    localStorage.setItem('syncedBookings', JSON.stringify(updated));
    if (user) {
      try { await deleteBooking(user.uid, bookingId); } catch {}
    }
  };

  useEffect(() => {
    const tripId = searchParams.get('tripId');
    const dest = searchParams.get('destination');

    if (!tripId) {
      if (dest) updateLocation(dest);
      return;
    }

    if (restoredRef.current) return;

    // קרא מ-localStorage ישירות — לא לחכות ל-savedTrips שיטען מ-Firestore
    let allTrips = [];
    try {
      allTrips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
    } catch {}

    // אם localStorage ריק — נסה מ-savedTrips מהקונטקסט
    if (allTrips.length === 0) allTrips = savedTrips;

    const trip = allTrips.find(t => String(t.id) === String(tripId));
    console.log('🔍 restoring trip:', tripId, '| found:', !!trip, '| itinerary days:', trip?.dailyItinerary?.length || 0);
    if (!trip) return; // עדיין לא טעון — המתן לרנדר הבא

    restoredRef.current = true;
    const dest2 = trip.destination || trip.endPoint || trip.location;
    if (dest2) updateLocation(dest2);
    if (trip.days) updateDays(trip.days);
    const budgetVal = ['low', 'medium', 'high'].includes(trip.budget) ? trip.budget : 'medium';
    updateBudget(budgetVal);
    if (trip.startDate) updateStartDate(trip.startDate);
    if (trip.dailyItinerary?.length > 0) {
      // התאריך נכנס לטיוטה עצמה: לוח הימים נגזר ממנה, לא מההעדפות.
      updateTripPlan({
        destination: dest2,
        dailyItinerary: trip.dailyItinerary,
        ...(trip.startDate ? { startDate: trip.startDate } : {}),
        // העצירות קובעות את טווח הלינה של כל מלון מומלץ (hotelStayRange).
        ...(trip.stops?.length ? { stops: trip.stops } : {}),
        accommodations: trip.accommodations || [],
      });
    }
  }, [searchParams, savedTrips]);

  // איפוס מיקוד המפה ורשימת המלונות בעת החלפת לשונית
  useEffect(() => {
    setMapFocus(null);
    if (servicesTab !== 1) setHotelRecommendations([]);
  }, [mainTab, servicesTab]);

  const handleSaveTrip = async () => {
    const dest = tripPlan?.destination || userPreferences.location;
    const tripData = {
      destination: dest,
      days: userPreferences.days,
      budget: userPreferences.budget,
      startDate: userPreferences.startDate,
      dailyItinerary: tripPlan?.dailyItinerary || [],
      accommodations: tripPlan?.accommodations || [],
    };
    const trip = await saveTripToList(tripData, lastSavedTripId || null);
    if (trip?.id) setLastSavedTripId(String(trip.id));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // --- חישוב src המפה לפי הקשר ---
  const buildMapSrc = () => {
    const dest = userPreferences.location || 'ישראל';

    // לשונית שירותים
    if (mainTab === 'services') {
      if (servicesTab === 0) {
        // טיסות — שדה תעופה ביעד
        return {
          src: `https://maps.google.com/maps?q=airport+in+${encodeURIComponent(dest)}&output=embed&hl=en`,
          label: `✈️ שדה תעופה ב-${dest}`,
        };
      }
      if (servicesTab === 1) {
        // מלון ספציפי שנלחץ "הצג על המפה"
        if (mapFocus) {
          return {
            src: `https://maps.google.com/maps?q=${encodeURIComponent(mapFocus + ' ' + dest)}&output=embed&hl=en`,
            label: `🏨 ${mapFocus}`,
          };
        }
        // הצג חיפוש מלונות ביעד — מציג סיכות מלונות רבות על המפה
        return {
          src: `https://maps.google.com/maps?q=hotels+in+${encodeURIComponent(dest)}&output=embed&hl=en`,
          label: hotelRecommendations.length > 0
            ? `🏨 מלונות ב-${dest} — לחץ על כרטיסייה להתמקד במלון ספציפי`
            : `🏨 מלונות ב-${dest}`,
        };
      }
      if (servicesTab === 2) {
        // רכב — סוכנויות השכרה ביעד
        if (mapFocus) {
          return {
            src: `https://maps.google.com/maps?q=${encodeURIComponent(mapFocus + ' car rental ' + dest)}&output=embed&hl=en`,
            label: `🚗 ${mapFocus} ב-${dest}`,
          };
        }
        return {
          src: `https://maps.google.com/maps?q=car+rental+in+${encodeURIComponent(dest)}&output=embed&hl=en`,
          label: `🚗 השכרת רכב ב-${dest}`,
        };
      }
    }

    // לשונית מידע על יעד
    if (mainTab === 'destination') {
      return {
        src: `https://maps.google.com/maps?q=tourist+attractions+in+${encodeURIComponent(dest)}&output=embed&hl=en`,
        label: `📍 אטרקציות ב-${dest}`,
      };
    }

    // לשונית תכנון — לפי יום נבחר
    const currentDayActivities = tripPlan?.dailyItinerary?.[selectedDayIndex]?.activities || [];
    const dayAddresses = currentDayActivities.filter(a => a.address).map(a => a.address);

    if (dayAddresses.length >= 2) {
      const saddr = encodeURIComponent(dayAddresses[0]);
      const daddrParts = [encodeURIComponent(dayAddresses[1])];
      for (let i = 2; i < dayAddresses.length; i++) daddrParts.push(`to:${encodeURIComponent(dayAddresses[i])}`);
      return {
        src: `https://maps.google.com/maps?saddr=${saddr}&daddr=${daddrParts.join('+')}&dirflg=d&output=embed&hl=en`,
        label: `🗺️ מסלול יום ${selectedDayIndex + 1}: ${dayAddresses.slice(0, 3).join(' → ')}${dayAddresses.length > 3 ? ' ...' : ''}`,
      };
    }
    if (dayAddresses.length === 1) {
      return {
        src: `https://maps.google.com/maps?q=${encodeURIComponent(dayAddresses[0])}&output=embed&hl=en`,
        label: `📍 ${dayAddresses[0]}`,
      };
    }
    return {
      src: `https://maps.google.com/maps?q=tourist+attractions+in+${encodeURIComponent(dest)}&output=embed&hl=en`,
      label: dest ? `📍 אטרקציות ב-${dest}` : null,
    };
  };

  const { src: mapSrc, label: mapLabel } = buildMapSrc();

  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* ── הוסר `bgcolor: '#ffffff'`, 08.09.2026 ──
          ה-Paper הזה עוטף את כל המתכנן (נמדד: 2,316 פיקסל גובה), והוא
          היה לבן קשיח בזמן שכל הטקסט שבתוכו נגזר מהערכה. במצב כהה נמדדו
          על האתר החי **70 כשלי ניגודיות**, מהם שמונה ביחס 1.0 — כולל
          כותרת ה-h1 של הטיול, שהייתה לבן על לבן.
          מקור אחד, כמו ב-`TravelInfoPage` וב-`DestinationMatchmakerPage`.
          עטיפת דף היא שלד, והשלד הולך אחרי הערכה. */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: '16px' }}>
        <Typography variant="h4" align="center" gutterBottom sx={{
          // ── היה `#2c3e50` קשיח ──
          // הוא היה קריא כל עוד ה-`Paper` שמעליו היה לבן קשיח. משהסרתי
          // את הלבן (08.09.2026), הכותרת נמדדה 1.52 על `#1e1e1e` — כלומר
          // התיקון עצמו יצר את הנסיגה. זה בדיוק הכלל: רקע קשיח מחייב
          // טקסט קשיח, ומי שמשחרר את האחד חייב לשחרר גם את השני.
          color: 'text.primary',
          fontWeight: 'bold',
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <i className="material-icons" style={{ marginRight: '8px', fontSize: '36px' }}>explore</i>
          {(tripPlan?.destination || userPreferences.location)
            ? t('tripPlanner.title', { location: tripPlan?.destination || userPreferences.location })
            : t('tripPlanner.titleDefault')}
        </Typography>

        {/* לשוניות ראשיות */}
        <Box sx={{ mb: 3 }}>
          <Tabs
            value={mainTab}
            onChange={(e, newValue) => setMainTab(newValue)}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab value="plan" label={t('tripPlanner.tabPlan')} icon={<i className="material-icons">map</i>} iconPosition="start" />
            <Tab value="services" label={t('tripPlanner.tabServices')} icon={<i className="material-icons">flight</i>} iconPosition="start" />
            <Tab value="destination" label={t('tripPlanner.tabDestination')} icon={<i className="material-icons">location_city</i>} iconPosition="start" />
          </Tabs>
        </Box>

        {/* לשונית תכנון מסלול */}
        {mainTab === 'plan' && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={saved ? <CheckCircleIcon /> : <SaveIcon />}
                onClick={handleSaveTrip}
                disabled={!userPreferences.location}
                sx={{
                  background: saved
                    ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  px: 3,
                  fontWeight: 700,
                  transition: 'all 0.3s',
                }}
              >
                {saved ? t('tripPlanner.saved') : t('tripPlanner.save')}
              </Button>
            </Box>

            <TripPlanner />

            <AccommodationPlanner
              accommodations={accommodations}
              setAccommodations={setAccommodations}
              hotelModalOpen={hotelModalOpen}
              setHotelModalOpen={setHotelModalOpen}
              defaultLocation={plannerDestination}
            />

            {/* כרטיסים שכבר שולמו מול התכנון. מוצג ראשון: זו ההתנגשות
                היחידה כאן שכבר עלתה כסף. */}
            {ticketAlerts.length > 0 && (
              <Box mt={3}>
                <Typography variant="h6" sx={{ mb: 1.5 }}>🎟️ כרטיסים מול המסלול</Typography>
                {ticketAlerts.map((a, i) => (
                  <Alert key={i} severity={a.severity} sx={{ mb: 1 }}>
                    <AlertTitle sx={{ fontWeight: 700, mb: 0.25 }}>{a.title}</AlertTitle>
                    {a.detail}
                  </Alert>
                ))}
              </Box>
            )}

            {/* מגבלות נהיגה ביעד. מוצג גם בלי הזמנות — התכנון הוא הרגע
                שבו עוד אפשר להסדיר מדבקה או לוותר על הרכב. */}
            {drivingAlerts.length > 0 && (
              <Box mt={3}>
                <Typography variant="h6" sx={{ mb: 1.5 }}>🚗 לפני שנוהגים ביעד</Typography>
                {drivingAlerts.map((a, i) => (
                  <Alert key={i} severity={a.severity} sx={{ mb: 1 }}>
                    <AlertTitle sx={{ fontWeight: 700, mb: 0.25 }}>{a.title}</AlertTitle>
                    {a.detail}
                  </Alert>
                ))}
              </Box>
            )}

            {/* פאנל הזמנות מסונכרנות */}
            <Box mt={3} mb={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="h6">
                  ✈️ הזמנות מסונכרנות
                  {syncedBookings.length > 0 && (
                    <Chip label={syncedBookings.length} size="small" color="primary" sx={{ ml: 1 }} />
                  )}
                </Typography>
                <BookingSync onBookingsAdded={handleBookingAdded} />
              </Box>

              {tripBookings.length === 0 ? (
                <Box sx={{
                  // רקע קשיח בהיר מתחת ל-`text.secondary` שנגזר מהערכה.
                  // נמדד 08.09.2026 על האתר החי: יחס 1.81 במצב כהה.
                  bgcolor: (t) => (t.palette.mode === 'dark' ? '#1c1d1f' : '#f8f9fa'),
                  borderRadius: 2, p: 2, textAlign: 'center',
                }}>
                  <Typography variant="body2" color="text.secondary">
                    {/* שני מצבים שונים: אין הזמנות כלל, או שיש ואף אחת אינה ליעד
                        הזה. הראשון מזמין לסנכרן; השני לא — סנכרון נוסף לא ישייך
                        הזמנה ליעד אחר. */}
                    {syncedBookings.length > 0
                      ? (plannerDestination
                        ? t('tripPlanner.bookings_unmatched', { count: syncedBookings.length, dest: plannerDestination })
                        : t('tripPlanner.bookings_unmatched_nodest', { count: syncedBookings.length }))
                      : t('tripPlanner.bookings_none')}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {tripBookings.map((b, bi) => (
                    <Paper key={b.id ?? bi} elevation={1} sx={{
                      p: 1.5, borderRadius: 2,
                      borderLeft: `4px solid ${bookingColor(b.type)}`,
                      display: 'flex', alignItems: 'center', gap: 1.5,
                    }}>
                      <Typography fontSize="1.3rem">{bookingEmoji(b.type)}</Typography>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.2 }}>
                          <Chip label={bookingLabel(b.type)} size="small"
                            sx={{ bgcolor: bookingColor(b.type), color: 'white', fontSize: '0.6rem', height: 18 }} />
                          {b.status === 'confirmed' && <Chip label="מאושר ✓" size="small" color="success" sx={{ fontSize: '0.6rem', height: 18 }} />}
                        </Box>
                        <Typography variant="body2" fontWeight={700} noWrap>{bookingHeadline(b)}</Typography>
                        {/* dir="ltr" נדרש: טווח תאריכים לטיני בתוך פסקה בעברית
                            סודר מימין לשמאל, והוצג כאילו היציאה קודמת לכניסה. */}
                        <Typography variant="caption" color="text.secondary" component="div" dir="ltr" sx={{ textAlign: noflip('right') }}>
                          {bookingSubline(b)}
                        </Typography>
                      </Box>
                      <DeleteIcon
                        fontSize="small"
                        sx={{ color: '#ccc', cursor: 'pointer', '&:hover': { color: '#f44336' } }}
                        onClick={() => handleBookingDeleted(b.id)}
                      />
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Box mt={3} mb={3}>
              <Typography variant="h6" sx={{ mb: 2 }}>{t('tripPlanner.shareAndSave')}</Typography>
              <Grid container spacing={2}>
                <Grid item>
                  <Button
                    variant="contained"
                    startIcon={<ShareIcon />}
                    onClick={() => setShareOpen(true)}
                    sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                  >
                    {t('tripPlanner.shareTrip')}
                  </Button>
                </Grid>
                <Grid item>
                  {/* ── שמירה אחת, לא שתיים ──
                      עד 13.09.2026 הכפתור הזה כתב ל-`tripLogs`, רשימה נפרדת
                      בדפדפן בלבד, בעוד "שמור" למעלה כתב ל-`savedTrips` ולענן.
                      טיול שנשמר כאן לא הגיע לענן, לא הופיע ביומן המסע ונעלם
                      בסגירת חלון גלישה בסתר. עכשיו שני הכפתורים הם אותה פעולה;
                      מה שכבר נכתב עובר ב-`tripLogMigrationService`. */}
                  <Button variant="contained" color="primary" onClick={handleSaveTrip} disabled={!userPreferences.location} startIcon={<i className="material-icons">save</i>}>
                    {t('tripPlanner.saveRoute')}
                  </Button>
                </Grid>
              </Grid>
            </Box>

            <ShareTripDialog
              open={shareOpen}
              onClose={() => setShareOpen(false)}
              trip={{ destination: userPreferences.location }}
              shareUrl={
                lastSavedTripId
                  ? `${window.location.origin}/trip-planner?tripId=${lastSavedTripId}`
                  : undefined
              }
            />

            {/* הסעיף "יומני טיול" הוסר בהחלטת המשתמש (13.09.2026): אחרי איחוד
                השמירה הוא הציג את אותם טיולים כמו "הטיולים שלי", ושמו התבלבל
                עם "יומן המסע" — שאינו קורא ממנו. */}
          </>
        )}

        {/* לשונית שירותי נסיעות */}
        {mainTab === 'services' && (
          <>
            <Typography variant="h5" align="center" gutterBottom sx={{ mb: 3 }}>
              {t('tripPlanner.servicesTitle')}
            </Typography>

            <Tabs
              value={servicesTab}
              onChange={(e, newValue) => setServicesTab(newValue)}
              variant="fullWidth"
              sx={{ mb: 3 }}
            >
              <Tab label={t('tripPlanner.flights')} icon={<FlightIcon />} />
              <Tab label={t('tripPlanner.hotels')} icon={<HotelIcon />} />
              <Tab label={t('tripPlanner.carRental')} icon={<DriveEtaIcon />} />
            </Tabs>

            {servicesTab === 0 && (
              <FlightSearch
                origin="תל אביב"
                destination={userPreferences.location}
              />
            )}
            {servicesTab === 1 && (
              <HotelSearch
                destination={userPreferences.location}
                onHotelsLoaded={(hotels) => { setHotelRecommendations(hotels); setMapFocus(null); }}
                onShowOnMap={(hotelName) => setMapFocus(hotelName)}
              />
            )}
            {servicesTab === 2 && (
              <CarRentalSearch
                location={userPreferences.location}
                onShowOnMap={(name) => setMapFocus(name)}
              />
            )}
          </>
        )}

        {/* לשונית מידע על היעד */}
        {mainTab === 'destination' && (
          <>
            <Typography variant="h5" align="center" gutterBottom sx={{ mb: 3 }}>
              {t('tripPlanner.destinationInfo', { location: userPreferences.location })}
            </Typography>
            <Box sx={{ textAlign: 'center', p: 5, color: '#666' }}>
              <i className="material-icons" style={{ fontSize: '64px', color: '#ccc' }}>info</i>
              <Typography variant="body1">{t('tripPlanner.destinationInfoPlaceholder')}</Typography>
            </Box>
          </>
        )}
      </Paper>

      {/* מפה חכמה */}
      <Paper elevation={3} sx={{ p: 0, mb: 4, borderRadius: '16px', overflow: 'hidden' }}>
        {/* כותרת */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {mapLabel && (
            <Typography variant="body2" color="text.secondary">{mapLabel}</Typography>
          )}
          {mapFocus && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => setMapFocus(null)}
              sx={{ fontSize: '0.7rem', py: 0.3, px: 1 }}
            >
              ← חזור לכל המלונות
            </Button>
          )}
        </Box>

        {/* מפת המסלול — כשיש תכנון AI ואנחנו בלשונית תכנון */}
        {mainTab === 'plan' && tripPlan && (
          <>
            {/* ── המתג שמחבר בין התכנון למפה ──
                עד 06.09.2026 המפה הראתה יום אחד בלבד, ולכן נסיעה שהיא
                מסלול בין ערים — נניח פריז ⟵ בורדו — לא נראתה כמסלול
                בשום מסך: כל יום הופיע לחוד ואת הקשר ביניהם המשתמש היה
                צריך להרכיב בראש. */}
            {(tripPlan.dailyItinerary?.length || 0) > 1 && (
              <Box sx={{ px: 2, pb: 1.5, display: 'flex', justifyContent: 'center', gap: 1 }}>
                <Button
                  size="small"
                  variant={wholeTripMap ? 'contained' : 'outlined'}
                  onClick={() => setWholeTripMap(true)}
                  sx={{ fontSize: '0.75rem', py: 0.4, borderRadius: 2 }}
                >
                  🗺️ כל הנסיעה
                </Button>
                <Button
                  size="small"
                  variant={!wholeTripMap ? 'contained' : 'outlined'}
                  onClick={() => setWholeTripMap(false)}
                  sx={{ fontSize: '0.75rem', py: 0.4, borderRadius: 2 }}
                >
                  📍 יום {selectedDayIndex + 1}
                </Button>
              </Box>
            )}
            <TripMap
              tripPlan={tripPlan}
              selectedDayIndex={wholeTripMap ? null : selectedDayIndex}
              onSelectDay={(i) => { setSelectedDayIndex(i); setWholeTripMap(false); }}
            />
          </>
        )}

        {/* מפת מלונות Leaflet — נשארת מותקנת (display:none שומר על הסיכות) */}
        {mainTab === 'services' && servicesTab === 1 && hotelRecommendations.length > 0 && (
          <Box sx={{ display: mapFocus ? 'none' : 'block' }}>
            <HotelMap
              hotels={hotelRecommendations}
              destination={userPreferences.location}
            />
          </Box>
        )}

        {/* iframe — לכל שאר המצבים */}
        {!(mainTab === 'plan' && tripPlan) &&
         !(mainTab === 'services' && servicesTab === 1 && hotelRecommendations.length > 0 && !mapFocus) && (
          <Box sx={{ height: { xs: '400px', md: '520px' }, width: '100%' }}>
            <iframe
              key={mapSrc}
              src={mapSrc}
              width="100%"
              height="100%"
              style={{ border: 0, display: 'block' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="מפה"
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default TripPlannerPage;
