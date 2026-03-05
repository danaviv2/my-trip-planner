import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, Chip, Button } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const TYPE_COLORS = {
  attraction: '#3F51B5',
  museum:     '#3F51B5',
  food:       '#FF5722',
  transport:  '#78909C',
  rest:       '#795548',
  shopping:   '#E91E63',
  nightlife:  '#673AB7',
  nature:     '#43A047',
  beach:      '#00ACC1',
};

const TYPE_LABELS = {
  attraction: 'אטרקציה',
  museum:     'מוזיאון',
  food:       'אוכל',
  transport:  'תחבורה',
  rest:       'מנוחה',
  shopping:   'קניות',
  nightlife:  'בילוי לילי',
  nature:     'טבע',
  beach:      'חוף',
};

const createNumberedPin = (number, type) => {
  const color = TYPE_COLORS[type] || '#667eea';
  return L.divIcon({
    className: '',
    html: `
      <div style="
        position: relative;
        width: 34px;
        height: 40px;
      ">
        <div style="
          background: ${color};
          width: 34px;
          height: 34px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 3px 12px rgba(0,0,0,0.4);
          position: absolute;
          top: 0; left: 0;
        "></div>
        <span style="
          position: absolute;
          top: 6px;
          left: 0;
          width: 34px;
          text-align: center;
          color: white;
          font-weight: 800;
          font-size: 13px;
          font-family: Arial, sans-serif;
          line-height: 1;
          pointer-events: none;
        ">${number}</span>
      </div>`,
    iconSize: [34, 40],
    iconAnchor: [17, 40],
    popupAnchor: [0, -42],
  });
};

// כפתורי הזמנה לפי סוג פעילות
const getBookingButtons = (activity, destination) => {
  const name = encodeURIComponent(activity.name);
  const dest = encodeURIComponent(destination || '');
  const buttons = [];

  // Google Maps — תמיד
  buttons.push({
    label: '📍 פתח במפות',
    url: `https://maps.google.com/maps?q=${name}+${dest}`,
    color: '#4285F4',
  });

  if (activity.type === 'food') {
    buttons.push({
      label: '🍽️ הזמן שולחן',
      url: `https://www.opentable.com/s/?term=${name}&metroId=0`,
      color: '#DA3743',
    });
    buttons.push({
      label: '⭐ ביקורות',
      url: `https://www.tripadvisor.com/Search?q=${name}+${dest}`,
      color: '#00AA6C',
    });
  } else if (activity.type === 'attraction' || activity.type === 'museum') {
    buttons.push({
      label: '🎫 הזמן כרטיסים',
      url: `https://www.getyourguide.com/s/?q=${name}+${dest}`,
      color: '#FF8000',
    });
    buttons.push({
      label: '🗺️ סיורים',
      url: `https://www.viator.com/search?q=${name}+${dest}`,
      color: '#182F5D',
    });
  } else if (activity.type === 'nightlife') {
    buttons.push({
      label: '🎟️ כרטיסים',
      url: `https://www.eventbrite.com/d/${dest}/${name}/`,
      color: '#F05537',
    });
  } else if (activity.type === 'shopping') {
    buttons.push({
      label: '🛍️ חפש שעות',
      url: `https://maps.google.com/maps?q=${name}+${dest}+opening+hours`,
      color: '#E91E63',
    });
  } else {
    buttons.push({
      label: '🔍 מידע נוסף',
      url: `https://www.google.com/search?q=${name}+${dest}`,
      color: '#667eea',
    });
  }

  return buttons;
};

const FitBounds = ({ positions, dayIndex }) => {
  const map = useMap();
  const prevDay = useRef(-1);

  useEffect(() => {
    if (positions.length === 0 || prevDay.current === dayIndex) return;
    prevDay.current = dayIndex;

    if (positions.length === 1) {
      map.setView(positions[0], 15);
    } else {
      map.fitBounds(L.latLngBounds(positions), { padding: [60, 60] });
    }
  }, [positions, dayIndex]); // eslint-disable-line

  return null;
};

const isValidCoord = (a) => {
  const lat = Number(a.lat);
  const lng = Number(a.lng);
  return (
    a.lat != null && a.lng != null &&
    a.lat !== '' && a.lng !== '' &&
    !isNaN(lat) && !isNaN(lng) &&
    Math.abs(lat) <= 90 && Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)  // 0,0 = אוקיינוס אטלנטי — לא תקין
  );
};

const TripMap = ({ tripPlan, selectedDayIndex }) => {
  const day = tripPlan?.dailyItinerary?.[selectedDayIndex];
  const rawActivities = day?.activities || [];

  // fallback: פעילויות ללא קואורדינטות מקבלות ממוצע של הפעילויות התקינות ביום
  const validInDay = rawActivities.filter(isValidCoord);
  const fallbackLat = validInDay.length > 0 ? validInDay.reduce((s, a) => s + Number(a.lat), 0) / validInDay.length : null;
  const fallbackLng = validInDay.length > 0 ? validInDay.reduce((s, a) => s + Number(a.lng), 0) / validInDay.length : null;

  const activities = rawActivities.map(a =>
    isValidCoord(a) || fallbackLat == null ? a : { ...a, lat: fallbackLat, lng: fallbackLng }
  );

  const markers = activities.filter(isValidCoord);

  const positions = markers.map(a => [a.lat, a.lng]);

  const center = markers.length > 0
    ? [
        markers.reduce((s, a) => s + a.lat, 0) / markers.length,
        markers.reduce((s, a) => s + a.lng, 0) / markers.length,
      ]
    : [32.0853, 34.7818];

  return (
    <Box sx={{ position: 'relative', height: { xs: '400px', md: '520px' } }}>

      {/* כותרת יום */}
      {day && (
        <Box sx={{
          position: 'absolute', top: 10, right: 10, zIndex: 1000,
          bgcolor: 'rgba(255,255,255,0.95)', px: 2, py: 1,
          borderRadius: 3, boxShadow: 3, maxWidth: '60%',
        }}>
          <Typography variant="caption" fontWeight={800} display="block" sx={{ color: '#667eea' }}>
            יום {selectedDayIndex + 1}
          </Typography>
          <Typography variant="caption" fontWeight={600} display="block" sx={{ color: '#333', lineHeight: 1.3 }}>
            {day.title}
          </Typography>
          {markers.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              {markers.length} עצירות
            </Typography>
          )}
        </Box>
      )}

      {/* אגדת סוגים */}
      {markers.length > 0 && (
        <Box sx={{
          position: 'absolute', bottom: 24, left: 8, zIndex: 1000,
          bgcolor: 'rgba(255,255,255,0.95)', p: 1, borderRadius: 2, boxShadow: 2,
          display: 'flex', flexDirection: 'column', gap: 0.4,
        }}>
          {[...new Set(markers.map(a => a.type))].map(type => (
            <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Box sx={{
                width: 12, height: 12,
                borderRadius: '50% 50% 50% 0',
                transform: 'rotate(-45deg)',
                bgcolor: TYPE_COLORS[type] || '#667eea',
                border: '2px solid white',
                flexShrink: 0,
              }} />
              <Typography variant="caption">{TYPE_LABELS[type] || type}</Typography>
            </Box>
          ))}
        </Box>
      )}

      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}

      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds positions={positions} dayIndex={selectedDayIndex} />

        {/* קו מסלול בין הפעילויות */}
        {positions.length >= 2 && (
          <Polyline
            positions={positions}
            color="#667eea"
            weight={3}
            opacity={0.7}
            dashArray="8, 6"
          />
        )}

        {/* סיכות ממוספרות */}
        {markers.map((activity, idx) => {
          const prevActivity = idx > 0 ? markers[idx - 1] : null;
          const navOrigin = prevActivity ? encodeURIComponent(prevActivity.address || prevActivity.name) : null;
          const navDest = encodeURIComponent(activity.address || activity.name);
          return (
          <Marker
            key={idx}
            position={[activity.lat, activity.lng]}
            icon={createNumberedPin(idx + 1, activity.type)}
          >
            <Popup maxWidth={270} minWidth={230}>
              <Box>
                {/* כותרת */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  <Typography variant="caption" sx={{
                    bgcolor: TYPE_COLORS[activity.type] || '#667eea',
                    color: 'white', px: 0.8, py: 0.2, borderRadius: 1,
                    fontWeight: 700, fontSize: '0.65rem',
                  }}>
                    {idx + 1}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{activity.time}</Typography>
                </Box>

                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.3 }}>
                  {activity.emoji} {activity.name}
                </Typography>

                <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>
                  {activity.description}
                </Typography>

                {/* משך ומחיר */}
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 0.5 }}>
                  {activity.duration && (
                    <Chip label={`⏱ ${activity.duration}`} size="small" sx={{ fontSize: '0.6rem', height: 18 }} />
                  )}
                  {activity.price && (
                    <Chip label={activity.price} size="small" sx={{ fontSize: '0.6rem', height: 18 }} />
                  )}
                </Box>

                {/* טיפ */}
                {activity.tips && (
                  <Typography variant="caption" display="block" sx={{
                    bgcolor: '#fff8e1', p: 0.5, borderRadius: 1,
                    borderLeft: '3px solid #FFC107', color: '#555', mb: 1,
                  }}>
                    💡 {activity.tips}
                  </Typography>
                )}

                {/* אתר רשמי */}
                {activity.website && activity.website.startsWith('http') && (
                  <Button
                    fullWidth size="small" variant="outlined"
                    endIcon={<OpenInNewIcon sx={{ fontSize: '0.75rem' }} />}
                    onClick={() => window.open(activity.website, '_blank', 'noopener,noreferrer')}
                    sx={{ mb: 0.5, fontSize: '0.7rem', py: 0.3, borderColor: '#333', color: '#333' }}
                  >
                    🌐 אתר רשמי
                  </Button>
                )}

                {/* כפתורי ניווט מהנקודה הקודמת */}
                {prevActivity && navOrigin && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.4, fontWeight: 600 }}>
                      🧭 נווט מ-{prevActivity.name}:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {[
                        { label: '🚶', title: 'הליכה',   mode: 'w', color: '#43A047' },
                        { label: '🚌', title: 'תחבורה',  mode: 'r', color: '#1976D2' },
                        { label: '🚗', title: 'רכב',     mode: 'd', color: '#E65100' },
                      ].map(({ label, title, mode, color }) => (
                        <Button
                          key={mode}
                          size="small" variant="outlined" fullWidth
                          onClick={() => window.open(
                            `https://maps.google.com/maps?saddr=${navOrigin}&daddr=${navDest}&dirflg=${mode}`,
                            '_blank', 'noopener,noreferrer'
                          )}
                          sx={{ fontSize: '0.65rem', py: 0.3, borderColor: color, color, fontWeight: 700,
                            '&:hover': { bgcolor: `${color}11`, borderColor: color } }}
                        >
                          {label} {title}
                        </Button>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* כפתורי הזמנה */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {getBookingButtons(activity, tripPlan?.destination || '').map((btn, i) => (
                    <Button
                      key={i}
                      fullWidth size="small" variant="contained"
                      endIcon={<OpenInNewIcon sx={{ fontSize: '0.75rem' }} />}
                      onClick={() => window.open(btn.url, '_blank', 'noopener,noreferrer')}
                      sx={{
                        fontSize: '0.7rem', py: 0.4,
                        background: btn.color,
                        '&:hover': { background: btn.color, filter: 'brightness(0.9)' },
                      }}
                    >
                      {btn.label}
                    </Button>
                  ))}
                </Box>
              </Box>
            </Popup>
          </Marker>
          );
        })}
      </MapContainer>
    </Box>
  );
};

export default TripMap;
