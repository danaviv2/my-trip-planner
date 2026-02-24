import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Use lazy-loading for heavy pages to reduce bundle size and avoid loading
// browser-only libs during SSR/test/build phases.
const TravelServicesBooking = React.lazy(() => import('./components/booking/TravelServicesBooking'));
const TripPlannerMapView = React.lazy(() => import('./components/maps/TripPlannerMapView'));
// ייבוא הדפים השונים (lazy)
const HomePage = React.lazy(() => import('./pages/HomePage'));
const TravelInfoPage = React.lazy(() => import('./pages/TravelInfoPage'));
const AdvancedSearchPage = React.lazy(() => import('./pages/AdvancedSearchPage'));
const MapPage = React.lazy(() => import('./pages/MapPage'));
const TripPlannerPage = React.lazy(() => import('./pages/TripPlannerPage'));
const DestinationInfoPage = React.lazy(() => import('./pages/DestinationInfoPage'));
const SmartTripPage = React.lazy(() => import('./pages/SmartTripPage'));
const RouteMapPage = React.lazy(() => import('./pages/RouteMapPage'));
const StatisticsPage = React.lazy(() => import('./pages/StatisticsPage'));

/**
 * רכיב ניתוב ראשי של האפליקציה
 * מגדיר את כל הנתיבים הזמינים באפליקציה
 */
const AppRoutes = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
      {/* דף הבית */}
      <Route path="/" element={<HomePage />} />
      
      {/* תכנון טיול חכם */}
      <Route path="/smart-trip" element={<SmartTripPage />} />
      
      {/* חיפוש מתקדם */}
      <Route path="/advanced-search" element={<AdvancedSearchPage />} />
      
      {/* מפה אינטראקטיבית */}
      <Route path="/map" element={<MapPage />} />
      
      {/* מפת מסלולים - הדף החדש שלנו! 🗺️ */}
      <Route path="/route-map" element={<RouteMapPage />} />
      
      {/* דוחות וסטטיסטיקות 📊 */}
      <Route path="/statistics" element={<StatisticsPage />} />
      
      {/* מידע על יעד */}
      <Route path="/destination-info" element={<DestinationInfoPage />} />
      <Route path="/destination-info/:destination" element={<DestinationInfoPage />} />
      
      {/* תכנון טיול */}
      <Route path="/trip-planner" element={<TripPlannerPage />} />
      
      {/* מידע על נסיעה */}
      <Route path="/travel-info" element={<TravelInfoPage />} />
      
      {/* הזמנות */}
      <Route path="/booking" element={<TravelServicesBooking />} />
      
      {/* מפת תכנון טיול */}
      <Route path="/trip-map" element={<TripPlannerMapView />} />
      
      {/* נתיב ברירת מחדל - מפנה לדף הבית */}
      <Route path="*" element={<HomePage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
