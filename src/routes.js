import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TravelServicesBooking from './components/booking/TravelServicesBooking';
import TripPlannerMapView from './components/maps/TripPlannerMapView';
// ייבוא הדפים השונים
import HomePage from './pages/HomePage';
import TravelInfoPage from './pages/TravelInfoPage';
import AdvancedSearchPage from './pages/AdvancedSearchPage';
import MapPage from './pages/MapPage';
import TripPlannerPage from './pages/TripPlannerPage';
import DestinationInfoPage from './pages/DestinationInfoPage';
import SmartTripPage from './pages/SmartTripPage';
import RouteMapPage from './pages/RouteMapPage';
import StatisticsPage from './pages/StatisticsPage';

/**
 * רכיב ניתוב ראשי של האפליקציה
 * מגדיר את כל הנתיבים הזמינים באפליקציה
 */
const AppRoutes = () => {
  return (
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
  );
};

export default AppRoutes;
