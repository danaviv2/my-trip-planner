import React from 'react';
import { Box, Typography, Button } from '@mui/material';

/**
 * כפתורי ניווט לנקודות המסלול (Google Maps / Waze).
 * הוצא מתוך App; startPoint, endPoint ו-waypoints עברו ל-props.
 */
// גוגל מגבילה את מספר נקודות הביניים בקישור: 3 בדפדפן נייד, 9 בכל השאר.
// חריגה מהמגבלה אינה מחזירה שגיאה — הנקודות העודפות פשוט נעלמות מהמסלול,
// ולכן העודף נאמר למשתמש במפורש במקום להישמט בשקט.
const waypointLimit = () =>
  (typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) ? 3 : 9;

const RouteNavigationButtons = ({ startPoint, endPoint, waypoints }) => {
  const stops = Array.isArray(waypoints) ? waypoints.filter(Boolean) : [];
  const limit = waypointLimit();
  const dropped = Math.max(0, stops.length - limit);

  // ניווט לנקודה בודדת: המוצא נשאר המיקום הנוכחי, וזה הנכון — זה השימוש
  // בזמן הטיול עצמו, כשעומדים במקום כלשהו ורוצים להגיע לנקודה הבאה.
  // `location` אינו פרמטר של Maps URLs API — גוגל בולעת אותו בשקט, נותרת בלי יעד,
  // ונופלת למיקום המכשיר. המשתמש ראה את אשדוד במקום את נקודת המסלול.
  const navigateToPoint = (address) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`);
  };

  // ניווט המסלול כולו: כאן המוצא הוא נקודת ההתחלה ולא המיקום הנוכחי, אחרת
  // מי שמתכנן מהבית מקבל מסלול נהיגה מאשדוד לרומא — 4,102 ק"מ דרך טורקיה.
  const navigateWholeRoute = () => {
    const params = new URLSearchParams({
      api: '1',
      origin: startPoint,
      destination: endPoint,
      travelmode: 'driving',
    });
    if (stops.length) params.set('waypoints', stops.slice(0, limit).join('|'));
    window.open(`https://www.google.com/maps/dir/?${params.toString()}`);
  };
  
  const navigateWithWaze = (address) => {
    window.open(`https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`);
  };
  
  return (
    <Box sx={{ mt: 2, p: 2, bgcolor: '#f0f8ff', borderRadius: '8px', boxShadow: 1 }}>
      <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
        <i className="material-icons" style={{ marginRight: '8px' }}>directions</i>
        ניווט למסלול
      </Typography>
      
      {startPoint && endPoint && (
        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={navigateWholeRoute}
            startIcon={<i className="material-icons">route</i>}
          >
            נווט את כל המסלול
          </Button>
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
            {`מ${startPoint} אל ${endPoint}`}
            {stops.length > 0 && ` · ${Math.min(stops.length, limit)} תחנות ביניים`}
            {dropped > 0 && ` (${dropped} מעבר למה שגוגל מציגה בקישור)`}
          </Typography>
        </Box>
      )}

      <Typography variant="body2" sx={{ mb: 1 }}>
        או נווט מהמיקום הנוכחי שלך לנקודה בודדת:
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {startPoint && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: '#e6f2ff', borderRadius: '4px' }}>
            <Typography variant="body2">
              נקודת התחלה: {startPoint}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" 
                color="primary" 
                size="small" 
                onClick={() => navigateToPoint(startPoint)}
                startIcon={<i className="material-icons">map</i>}
              >
                Google Maps
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                size="small" 
                onClick={() => navigateWithWaze(startPoint)}
                startIcon={<span style={{ fontWeight: 'bold' }}>W</span>}
              >
                Waze
              </Button>
            </Box>
          </Box>
        )}
        
        {stops.map((waypoint, index) => (
          <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: '#e6f2ff', borderRadius: '4px' }}>
            <Typography variant="body2">
              נקודת ביניים {index + 1}: {waypoint}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" 
                color="primary" 
                size="small" 
                onClick={() => navigateToPoint(waypoint)}
                startIcon={<i className="material-icons">map</i>}
              >
                Google Maps
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                size="small" 
                onClick={() => navigateWithWaze(waypoint)}
                startIcon={<span style={{ fontWeight: 'bold' }}>W</span>}
              >
                Waze
              </Button>
            </Box>
          </Box>
        ))}
        
        {endPoint && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: '#e6f2ff', borderRadius: '4px' }}>
            <Typography variant="body2">
              נקודת יעד: {endPoint}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" 
                color="primary" 
                size="small" 
                onClick={() => navigateToPoint(endPoint)}
                startIcon={<i className="material-icons">map</i>}
              >
                Google Maps
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                size="small" 
                onClick={() => navigateWithWaze(endPoint)}
                startIcon={<span style={{ fontWeight: 'bold' }}>W</span>}
              >
                Waze
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default RouteNavigationButtons;
