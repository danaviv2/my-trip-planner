import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import 'leaflet/dist/leaflet.css';
import './i18n/index.js'; // אתחול i18next לפני כל שאר
import './a11y.css';
import { applyA11yPrefs } from './services/a11yPrefsService';

import App from './App';
import reportWebVitals from './reportWebVitals';

// הגדרות הנגישות חלות לפני הרינדור הראשון: אחרת מי שבחר טקסט 150% רואה
// קודם את הדף בגודל רגיל ואז קפיצה — בדיוק למי שהקפיצה הכי מפריעה לו.
applyA11yPrefs();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// הסתר splash screen אחרי שReact סיים לרנדר
if (window.__hideSplash) window.__hideSplash();

reportWebVitals();

// רישום Service Worker לתמיכת PWA — רק בפרודקשן
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
