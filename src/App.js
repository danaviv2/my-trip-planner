/**
 * שורש האפליקציה: ספקי הקשר, כותרת, נתיבים ובדיקת גרסה. זה הכל.
 *
 * עד 01.09.2026 ישב כאן מתחת לדף הבית עותק שני של האפליקציה — 402 שורות
 * JSX ועוד כאלף שורות שירתו אותו: מתכנן מסלול, 17 מסנני קטגוריות, טופס
 * העדפות, מזג אוויר ושיתוף. **הוא היה מת מלכתחילה**: `onMapLoad` היה
 * הדבר היחיד שהציב `mapRef.current` ו-`isMapsLoaded`, וכשהמפה כאן הוחלפה
 * ב-`iframe` ב-25.2.2026 איש לא קרא לו יותר. מאז כל שומר בקוד הזה יצא
 * מוקדם, ו-17 הכפתורים החליפו מצב שאיש לא קרא. זו הייתה הסיבה.
 *
 * כל אחד מהרכיבים חי במסך משלו — /trip-planner, /map, /journal,
 * /my-trips, /route-map — והסינון עצמו ב-`AttractionsPanel` מעל
 * `placeCategories.js`, שם 17 הקטגוריות יושבות פעם אחת במקום שלוש.
 */
import React, { useEffect } from 'react';
import useAppUpdate from './hooks/useAppUpdate';
import { Box, Button, Snackbar, Alert } from '@mui/material';
import ErrorBoundary from './ErrorBoundary';
import './style.css';
import './assets/css/theme.css';
import AppRoutes from './routes';

// ספקי ההקשר והמעטפת. זה כל מה ש-`App` עושה מאז שהבלוק הישן ירד:
// הוא מרכיב את הספקים, את הכותרת ואת הנתיבים — והתוכן חי במסכים עצמם.
import Header from './components/layout/Header';
import ThemeWrapper from './components/layout/ThemeWrapper';
import OfflineBanner from './components/shared/OfflineBanner';
import UpdateBanner from './components/UpdateBanner';
import TripChatWidget from './components/chat/TripChatWidget';
import { TripProvider } from './contexts/TripContext';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';
import { TripSaveProvider } from './contexts/TripSaveContext';
import { BookingsProvider } from './contexts/BookingsContext';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AIChatProvider } from './contexts/AIChatContext';



function App() {
  const { updateAvailable, applyUpdate } = useAppUpdate();

// טיפול מתון בשגיאות חיבור WebSocket
useEffect(() => {
  // מוסיף מאזין אירועים גלובלי לטיפול בשגיאות WebSocket
  window.addEventListener('error', (e) => {
    if (e.target instanceof WebSocket) {
      console.log('שגיאת חיבור WebSocket טופלה');
      e.preventDefault();
    }
  });

  return () => {
    window.removeEventListener('error', () => {});
  };
}, []);




  // חשוב מאוד - זהו ה-return הראשי של הרכיב App
  return (
    <ErrorBoundary>
      <AuthProvider>
        <TripSaveProvider>
        <BookingsProvider>
        <UserPreferencesProvider>
        <LanguageProvider>
          <ThemeWrapper>
          {/* מוצב מעל הכול: גרסה ישנה שרצה במכשיר משפיעה על כל מסך,
              ולא רק על זה שבו במקרה הבחינו בה. */}
          <UpdateBanner />
          <TripProvider>
          <AIChatProvider>
          <Box className="app" sx={{ p: { xs: '8px 8px calc(70px + env(safe-area-inset-bottom)) 8px', md: '20px' } }} role="main" aria-label="אפליקציית תכנון טיולים">
            {/* רכיב Header שמכיל את הניווט לדפים השונים */}
            <Header />
            {/* spacer — גובה AppBar + safe-area-inset-top (notch / Dynamic Island) */}
            <Box sx={{ height: { xs: 'calc(56px + env(safe-area-inset-top))', md: '64px' } }} />

            {/* חיווי ניתוק. מוצג מעל התוכן כדי שלא יתפרש כתקלה. */}
            <OfflineBanner />

            {/* רכיב הנתיבים החדש שיטפל בניתוב לדפים השונים */}
            <AppRoutes />

            {/* AI Trip Chat Widget - צ'אט חכם עם ידע על הטיולים */}
            <TripChatWidget />

            {/* באנר עדכון גרסה */}
            <Snackbar
              open={updateAvailable}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              sx={{ mb: { xs: 8, md: 2 } }}
            >
              <Alert
                severity="info"
                variant="filled"
                action={
                  <Button color="inherit" size="small" fontWeight={700} onClick={applyUpdate}>
                    רענן עכשיו
                  </Button>
                }
                sx={{ width: '100%', bgcolor: '#667eea', alignItems: 'center' }}
              >
                ✨ גרסה חדשה זמינה!
              </Alert>
            </Snackbar>
          </Box>
          </AIChatProvider>
        </TripProvider>
          </ThemeWrapper>
        </LanguageProvider>
      </UserPreferencesProvider>
        </BookingsProvider>
        </TripSaveProvider>
      </AuthProvider>
  </ErrorBoundary>
  );
}

export default App;