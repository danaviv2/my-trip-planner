// src/components/travel-info/TravelInfoComponent.js
import React, { useState, useContext, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, IconButton, Alert, AlertTitle, Chip,
  Accordion, AccordionSummary, AccordionDetails,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import EmailImportModal from './EmailImportModal';
import { findConflicts } from '../../services/itineraryConflictService';
import { findDrivingRestrictions } from '../../services/drivingRestrictionsService';
import { useBookings } from '../../contexts/BookingsContext';
import TripTimeline from './TripTimeline';
import NextUpCard from './NextUpCard';
import AddPlanItemDialog from './AddPlanItemDialog';
import TripBoundsReport from './TripBoundsReport';
import { geocodeBookings } from '../../services/bookingGeocodeService';
import FlightAlertsCard from './FlightAlertsCard';
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
  // מצב פתיחת חלונית מידע
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [emailImportModalOpen, setEmailImportModalOpen] = useState(false);
  
  // מצבים לניהול תצוגה
  const [showPast, setShowPast] = useState(false);
  const navigate = useNavigate();
  const {
    trips, autoScanning, autoScanResult, cloudError,
    removeBooking, resetAllBookings, addBookings, editEvent, clearEventEdits,
  } = useBookings();
  const [resetOpen, setResetOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [resetDone, setResetDone] = useState(null);

  // ── הגבול הוא היום שבו הנסיעה נגמרה ──
  // קודם נשארה נסיעה שהסתיימה למעלה תשעים יום, מתוך מחשבה שהגבול הוא
  // "פתוח מול סגור" ולא "עבר מול עתיד": אחרי החזרה עוד מגישים החזרים
  // ובודקים חיובים. הכוונה נכונה, המימוש טשטש: נסיעה שהסתיימה לפני
  // חודש וחצי הופיעה תחת "הנסיעות שלך", כותרת שנקראת כ"הקרובות".
  //
  // לכן ההפרדה חדה — הסתיימה, ירדה למטה — ומה שהיה חשוב באמת נשמר
  // בדרך אחרת: נסיעה שהסתיימה לאחרונה מסומנת ככזו ברשימת הקודמות,
  // וכך אינה נבלעת בהיסטוריה.
  /**
   * נסיעה שהסתיימה בחודשיים האחרונים.
   *
   * בטווח הזה עוד מגישים החזרים, בודקים חיובים ולעיתים תביעת פיצוי.
   * היא בארכיון, אך אינה קפואה.
   */
  const isRecent = (trip) => {
    if (!trip?.endDate) return false;
    const [y, m, d] = String(trip.endDate).split('-').map(Number);
    if (!y || !m || !d) return false;
    return Date.now() - new Date(y, m - 1, d).getTime() < 60 * 86400000;
  };

  const { upcoming, past } = useMemo(() => {
    // מרכיבי הזמן המקומיים ולא toISOString: חצות בישראל היא אתמול
    // בשעון UTC, ונסיעה שנגמרת היום הייתה יורדת לארכיון יום מוקדם מדי.
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const ended = (t) => !t.undated && t.endDate && t.endDate < today;

    return {
      // הקבוצה הלא-משויכת אינה ארכיון: היא דורשת טיפול, ולכן נשארת למעלה.
      upcoming: trips.filter((t) => !ended(t)),
      // החדשה ביותר ראשונה — אחרי החזרה מסתכלים על מה שזה עתה נגמר.
      past: trips.filter(ended).sort((a, b) => String(b.endDate).localeCompare(String(a.endDate))),
    };
  }, [trips]);


  /**
   * הנסיעה הראשונה נפתחת מעצמה.
   *
   * הציר הוא תוכן המסך, והוא היה מוסתר מאחורי לחיצה: מי שנכנס ראה את
   * אותם כרטיסי סיכום כמו קודם והסיק שדבר לא השתנה. נסיעה שאינה הראשונה
   * נשארת מקופלת, כדי שמסך עם כמה נסיעות לא ייפתח כרשימה אינסופית.
   */
  /**
   * השלמת מיקומים ברקע, לנסיעות הקרובות בלבד.
   *
   * שירות המיקומים מגביל לבקשה בשנייה, ולכן זה אינו רץ בזמן הסריקה — שם
   * המשתמש מחכה. כאן המסך כבר מוצג. כל כתובת מאותרת פעם אחת: גם כישלון
   * נרשם, אחרת אותה כתובת שלא נמצאה הייתה נבדקת שוב בכל טעינה.
   */
  const geocodedRef = useRef(false);
  useEffect(() => {
    if (geocodedRef.current || !upcoming.length) return;
    geocodedRef.current = true;

    let alive = true;
    (async () => {
      for (const trip of upcoming) {
        if (!alive) return;
        const updated = await geocodeBookings(trip.bookings || [], trip.destination || '');
        if (alive && updated.length) await addBookings(updated);
      }
    })();

    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upcoming.length]);

  /**
   * שמירת תיקון על אירוע.
   *
   * התאריך נשלח רק כשהוא באמת השתנה: שליחתו תמיד הייתה מסמנת כל שורה
   * שנגעו בה כ"נערכה", גם כשהמשתמש רק פתח וסגר את החלון.
   */
  const handleEditEvent = useCallback(
    async (ev, patch) => {
      if (!ev || !ev.booking) return;
      const d = ev.at;
      const currentDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const clean = { ...patch };
      if (clean.date === currentDate) delete clean.date;
      await editEvent(ev.booking.id, ev.kind, clean);
    },
    [editEvent]
  );

  const handleResetEvent = useCallback(
    async (ev) => {
      if (!ev || !ev.booking) return;
      await clearEventEdits(ev.booking.id, ev.kind);
    },
    [clearEventEdits]
  );

  /**
   * קישור לתכנון הנסיעה, או null כשאין מה לתכנן.
   *
   * ── מה נגזר ומה לא ──
   * יעד, יום ראשון ומספר ימים. פעילויות אינן נוצרות כאן: המסגרת מגיעה
   * מההזמנות, והתוכן נשאר של המשתמש.
   *
   * נסיעה שהסתיימה או שאין לה תאריכים אינה מקבלת כפתור. בורר התאריכים
   * בתכנון חוסם ממילא תאריכי עבר, וכפתור שמוביל למסך שידחה אותך גרוע
   * מהיעדרו.
   */
  const planLink = (trip) => {
    if (!trip || trip.undated || !trip.startDate || !trip.endDate) return null;

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (trip.endDate < todayKey) return null;

    // נסיעה שכבר התחילה מתוכננת מהיום ולא מתחילתה
    const start = trip.startDate < todayKey ? todayKey : trip.startDate;

    const dayOf = (k) => {
      const [y, m, d] = k.split('-').map(Number);
      return new Date(y, m - 1, d);
    };
    const days = Math.round((dayOf(trip.endDate) - dayOf(start)) / 86400000) + 1;
    if (!Number.isFinite(days) || days < 1) return null;

    const q = new URLSearchParams({
      destination: trip.destination || '',
      start,
      days: String(Math.min(days, 30)),
    });
    return `/trip-planner?${q.toString()}`;
  };

  const renderTrip = (trip, index = 0) => (
            <Accordion
              key={trip.id}
              defaultExpanded={index === 0 && !trip.undated}
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
              <AccordionDetails sx={{ pt: 0, px: { xs: 0.75, sm: 2 } }}>
                {/* הגשר לתכנון. בלעדיו התכנון נפתח בתאריך של היום, ועל
                    המשתמש היה ליישר ידנית בין המסכים — מקור טעות קבוע:
                    יום שאינו תואם לתאריך של הזמנה אינו מציג שום עוגן,
                    בלי שדבר יסביר למה.
                    מוצג רק על נסיעה שטרם הסתיימה, כי אין מה לתכנן
                    ליום שחלף. */}
                {planLink(trip) && (
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => navigate(planLink(trip))}
                    startIcon={<i className="material-icons" style={{ fontSize: '1.1rem' }}>event_note</i>}
                    sx={{ mb: 1.5, fontWeight: 600, borderRadius: 2.5 }}
                  >
                    תכנן את הנסיעה הזאת
                  </Button>
                )}

                {/* ההתנגשויות נבדקות על ההזמנות של הנסיעה עצמה. קודם הן
                    חושבו על הטופס בלבד, ולכן פער של אפס דקות בין נחיתה
                    לאיסוף רכב שיובאו מהמייל לא נתפס. */}
                {tripConflicts(trip).map((c, i) => (
                  <Alert key={i} severity={c.severity} sx={{ mb: 1 }}>
                    <AlertTitle sx={{ mb: 0.25, fontWeight: 700 }}>{c.title}</AlertTitle>
                    {c.detail}
                  </Alert>
                ))}
                {/* הנסיעה כרצף ולא כרשימה מקובצת לפי סוג */}
                <TripTimeline
                  bookings={trip.bookings || []}
                  onDelete={removeBooking}
                  onEditEvent={handleEditEvent}
                  onResetEvent={handleResetEvent}
                />

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
  
  // ריפוד מקונן נמדד: שלוש שכבות של 24 פיקסל, בתוך עמוד שגם הוא מרופד,
  // בלעו 220 מתוך 375 פיקסל במסך טלפון — יותר ממחצית הרוחב. הציר קיבל
  // 181, הכרטיס 79, והכותרת 14: אות אחת בשורה. במסך רחב אין בעיה, ולכן
  // הצמצום חל רק היכן שהוא נחוץ.
  return (
    <Paper elevation={3} sx={{ p: { xs: 1.25, sm: 3 }, borderRadius: '10px', mb: 3 }}>
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
      {/* גילוי שקט אינו שווה הרבה: אם הזמנה נוספה מעצמה והמשתמש לא ידע,
          הוא לא יבטח במסך ויחפש את האישור במייל בכל מקרה. */}
      {!autoScanning && autoScanResult?.added > 0 && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <AlertTitle sx={{ fontWeight: 700, mb: 0.25 }}>
            נוספו {autoScanResult.added} הזמנות חדשות מהמייל
          </AlertTitle>
          הן שויכו לנסיעה המתאימה אוטומטית ומופיעות ברשימה למטה.
        </Alert>
      )}

      {/* טיולים שנגזרו מההזמנות שיובאו. אישורים שהגיעו בנפרד —
          טיסה, מלון ורכב — מתאחדים כאן לנסיעה אחת. */}
      {/* ── נקודת הכניסה היחידה להוספה ──
          קודם היו שתיים: זו, ועוד כפתור בתוך כל יום בכל נסיעה. השנייה
          הייתה תת-קבוצה של הראשונה — חסכה בחירת תאריך אחת ובתמורה
          שכפלה את הפעולה עשר פעמים במסך, ויצרה את המסלול שבו פריט נוצר
          ליום אחד ואז נערך לאחר.
          מכיוון שזו נשארה לבדה, היא נראית כמו פעולה ולא כמו הערת
          שוליים. */}
      <Box
        onClick={() => setAddOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setAddOpen(true); }}
        sx={{
          display: 'flex', alignItems: 'center', gap: 1.25, mb: 2,
          px: 1.75, py: 1.25, borderRadius: 3, cursor: 'pointer',
          border: '1px dashed', borderColor: '#c9cdda', color: 'text.secondary',
          transition: 'all .15s',
          '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: '#f7f8fd' },
        }}
      >
        <Box
          sx={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            bgcolor: '#eef0fc', color: '#5568d3',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem',
            lineHeight: 1,
          }}
        >
          +
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.3 }}>
            הוסף פריט לתוכנית
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', lineHeight: 1.3 }}>
            מסעדה, פגישה או תזכורת — לכל תאריך
          </Typography>
        </Box>
      </Box>

      <AddPlanItemDialog
        open={addOpen}
        pickDate
        onClose={() => setAddOpen(false)}
        onAdd={addBookings}
      />

      {/* הדבר הבא בתור. מופיע רק כשהוא קרוב, ולכן הוא בראש המסך: כשאתה
          בדרך זו השאלה היחידה, וגלילה אליה מבטלת את התועלת. */}
      <NextUpCard trips={upcoming} />

      {/* התראות על עיכוב. מוצג רק כשיש טיסות — אחרת זו הצעה חסרת הקשר. */}
      <FlightAlertsCard
        hasFlights={upcoming.some((t) => (t.bookings || []).some((b) => b.type === 'flight'))}
      />

      {/* טיולים שנגזרו מההזמנות שיובאו. אישורים שהגיעו בנפרד —
          טיסה, מלון ורכב — מתאחדים כאן לנסיעה אחת. */}
      {upcoming.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <i className="material-icons" style={{ marginRight: '8px' }}>luggage</i>
            הנסיעות שלך ({upcoming.length})
          </Typography>
          {upcoming.map((trip, i) => renderTrip(trip, i))}
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
      {/* כלי מדידה, לא תכונה: הוא עונה על "למה נסיעה מכילה את מה שהיא
          מכילה" — שאלה שניחוש עליה כבר נכשל פעם אחת. מחוץ לאלמנט הטקסט
          שמתחתיו, כי הוא מכיל כפתור ובלוק. */}
      <TripBoundsReport trips={[...upcoming, ...past]} />

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
          {/* נסיעה שזה עתה נגמרה נפתחת מעצמה. זה מה שנשמר מהכוונה
              המקורית: בשבועות שאחרי החזרה עוד מגישים החזרים ובודקים
              חיובים, ואין סיבה שתידרש חפירה בארכיון כדי להגיע אליה. */}
          {showPast && (
            <Box sx={{ mt: 1 }}>
              {past.map((trip, i) => renderTrip(trip, i === 0 && isRecent(trip) ? 0 : -1))}
            </Box>
          )}
        </Box>
      )}

      {/* כאן ישבו שני טפסים ידניים ריקים לטיסה ולרכב.
          הם היו מודל נתונים מקביל שאיש לא הזין: בדיקת ההתנגשויות שמתחתם
          רצה עליהם, כלומר על טופס ריק, והמסך נראה לא גמור והזמין למלא
          משהו שלא השפיע על דבר. ההזמנות מגיעות מהמייל ונערכות בציר. */}

      {/* חלונית ייבוא מאימייל */}
      <EmailImportModal
        open={emailImportModalOpen}
        onClose={() => setEmailImportModalOpen(false)}
      />
    </Paper>
  );
};

export default TravelInfoComponent;