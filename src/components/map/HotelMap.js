import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, Chip } from '@mui/material';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const CATEGORY_COLORS = {
  budget:  '#4CAF50',
  boutique: '#9C27B0',
  luxury:  '#FF8F00',
};

const CATEGORY_LABELS = {
  budget:  '💰 חסכוני',
  boutique: '✨ בוטיק',
  luxury:  '👑 יוקרה',
};

const createPinIcon = (category) => {
  const color = CATEGORY_COLORS[category] || '#667eea';
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};
      width:26px;height:26px;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid white;
      box-shadow:0 3px 10px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -30],
  });
};

const FitBounds = ({ markers }) => {
  const map = useMap();
  const prevCount = useRef(0);

  useEffect(() => {
    if (markers.length === 0 || markers.length === prevCount.current) return;
    prevCount.current = markers.length;

    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 14);
    } else {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [markers.length]); // eslint-disable-line

  return null;
};

const HotelMap = ({ hotels, destination }) => {
  // סינון מלונות שיש להם קואורדינטות תקינות מה-AI
  const markers = hotels.filter(h =>
    h.lat && h.lng &&
    !isNaN(h.lat) && !isNaN(h.lng) &&
    Math.abs(h.lat) <= 90 && Math.abs(h.lng) <= 180
  );

  // מרכז המפה = ממוצע של כל הסיכות
  const center = markers.length > 0
    ? [
        markers.reduce((s, m) => s + m.lat, 0) / markers.length,
        markers.reduce((s, m) => s + m.lng, 0) / markers.length,
      ]
    : [32.0853, 34.7818]; // תל אביב אם אין כלום

  return (
    <Box sx={{ position: 'relative', height: { xs: '400px', md: '520px' } }}>

      {/* אגדת צבעים */}
      {markers.length > 0 && (
        <Box sx={{
          position: 'absolute', bottom: 24, left: 8, zIndex: 1000,
          bgcolor: 'rgba(255,255,255,0.95)', p: 1, borderRadius: 2, boxShadow: 2,
        }}>
          <Typography variant="caption" fontWeight={700} display="block" sx={{ mb: 0.5 }}>
            🏨 {markers.length} מלונות
          </Typography>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.3 }}>
              <Box sx={{
                width: 12, height: 12,
                borderRadius: '50% 50% 50% 0',
                transform: 'rotate(-45deg)',
                bgcolor: CATEGORY_COLORS[key],
                border: '2px solid white',
                flexShrink: 0,
              }} />
              <Typography variant="caption">{label}</Typography>
            </Box>
          ))}
        </Box>
      )}

      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        key={destination}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds markers={markers} />
        {markers.map((hotel, idx) => (
          <Marker
            key={idx}
            position={[hotel.lat, hotel.lng]}
            icon={createPinIcon(hotel.category)}
          >
            <Popup maxWidth={230}>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.3 }}>
                  {hotel.emoji} {hotel.name}
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>
                  📍 {hotel.neighborhood}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 0.5 }}>
                  <Chip
                    label={CATEGORY_LABELS[hotel.category]}
                    size="small"
                    sx={{
                      fontSize: '0.65rem', height: 18,
                      bgcolor: `${CATEGORY_COLORS[hotel.category]}22`,
                      color: CATEGORY_COLORS[hotel.category],
                    }}
                  />
                  <Chip label={hotel.pricePerNight} size="small" sx={{ fontSize: '0.65rem', height: 18 }} />
                </Box>
                <Typography variant="caption" display="block" color="text.secondary">
                  {hotel.whyRecommended}
                </Typography>
              </Box>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
};

export default HotelMap;
