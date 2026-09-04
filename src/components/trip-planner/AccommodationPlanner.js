// src/components/trip-planner/AccommodationPlanner.js
import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import HotelModal from './HotelModal';

/**
 * תכנון לינה לאורך המסלול.
 *
 * ── הבאג שהיה כאן עד 04.09.2026 ──
 * הכפתור "הוסף מלון למסלול" קרא ל-`setHotelModalOpen(true)`, והדגל הזה
 * לא נקרא מאף מקום: `HotelModal` — 165 שורות של מימוש שלם — לא היה
 * מיובא בשום קובץ. כלומר הכפתור עבד, פשוט לא היה מי שיגיב לו. מבחוץ
 * זה נראה כ"הכפתור מת", ולכן חיפוש הבאג בכפתור עצמו לא היה מוצא דבר.
 *
 * ── ולמה יש כאן `return` אחד ──
 * קודם היו שניים, לרשימה ריקה ולרשימה מלאה, ושניהם הכילו את אותו כפתור.
 * מבנה כזה הוא בדיוק דפוס הכשל שחוזר בפרויקט: תיקון נכנס לענף אחד ולא
 * לאחיו. עם `return` יחיד, המודאל מרונדר פעם אחת ואי אפשר לשכוח ענף.
 */
const AccommodationPlanner = ({
  accommodations = [],
  setAccommodations,
  hotelModalOpen,
  setHotelModalOpen,
  defaultLocation = '',
}) => {
  const addHotel = (hotel) => {
    // פונקציית עדכון ולא ערך: שתי הוספות מהירות ברצף היו דורסות זו את זו
    setAccommodations((prev) => [...(prev || []), hotel]);
  };

  const removeHotel = (index) => {
    setAccommodations((prev) => (prev || []).filter((_, i) => i !== index));
  };

  return (
    <Box sx={{ mt: 3, mb: 2 }}>
      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
        <i className="material-icons" style={{ marginRight: '8px' }}>hotel</i>
        תכנון לינה לאורך המסלול
      </Typography>

      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {accommodations.map((hotel, index) => (
          <Paper key={`${hotel.name}-${hotel.checkIn}-${index}`} sx={{ p: 2, borderRadius: '8px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1">{hotel.name}</Typography>
                <Typography variant="body2">{hotel.address}</Typography>
                {/* התאריכים מוצגים רק כששניהם קיימים: "עד" בלי תאריך
                    נראה כמו נתון חסר ולא כמו שדה שלא מולא */}
                {hotel.checkIn && hotel.checkOut && (
                  <Typography variant="body2">
                    <strong>תאריכים:</strong> {hotel.checkIn} עד {hotel.checkOut}
                  </Typography>
                )}
                {hotel.notes && (
                  <Typography variant="body2" color="text.secondary">{hotel.notes}</Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<i className="material-icons">directions</i>}
                  onClick={() => window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(hotel.address)}`,
                    '_blank'
                  )}
                >
                  נווט
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="primary"
                  startIcon={<i className="material-icons">bookmark</i>}
                  onClick={() => window.open(
                    `https://www.booking.com/search.he.html?ss=${encodeURIComponent(hotel.address)}`,
                    '_blank'
                  )}
                >
                  הזמן
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  onClick={() => removeHotel(index)}
                  aria-label={`הסר את ${hotel.name}`}
                >
                  <i className="material-icons">delete</i>
                </Button>
              </Box>
            </Box>
          </Paper>
        ))}

        <Button
          variant="outlined"
          startIcon={<i className="material-icons">add_circle</i>}
          onClick={() => setHotelModalOpen(true)}
          sx={{ alignSelf: 'flex-start' }}
        >
          הוסף מלון למסלול
        </Button>
      </Box>

      <HotelModal
        open={!!hotelModalOpen}
        onClose={() => setHotelModalOpen(false)}
        onSave={addHotel}
        defaultLocation={defaultLocation}
      />
    </Box>
  );
};

export default AccommodationPlanner;
