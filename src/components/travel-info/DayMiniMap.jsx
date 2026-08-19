import React from 'react';
import { Box, Typography } from '@mui/material';
import { distanceKm } from '../../services/routeGeometryService';

/**
 * מפת היום, מצוירת מקואורדינטות ולא מאריחים.
 *
 * אריחי מפה הם הדבר היחיד באפליקציה שנשבר בלי קליטה, והם גם מאטים את
 * המסך הראשון — בדיוק בשדה התעופה, שם הוא נפתח. הנקודות כבר בידינו,
 * ולכן ציור ישיר נותן תמונה מיידית שעובדת גם בלי רשת.
 *
 * ── מה לא נכנס למפה ──
 * טיסות. ביום נחיתה הטיסה משתרעת על אלפי קילומטרים, והייתה מוחצת את
 * המעבר מהשדה למלון לנקודה אחת חסרת ערך. המפה מתארת את התנועה על הקרקע.
 *
 * הצפון למעלה גם במסך עברי: מפה נקראת גיאוגרפית, והיפוך היה מבלבל.
 */

const W = 366;
const H = 92;
const PAD = 18;

const hasCoord = (p) =>
  p && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)) &&
  !(Number(p.lat) === 0 && Number(p.lng) === 0);

/**
 * נקודות הקרקע של היום, לפי סדר האירועים.
 *
 * המיקום נלקח מההזמנה עצמה. לא כל סוג נושא קואורדינטות, ומה שאין לו
 * פשוט אינו מופיע — נקודה משוערת על מפה נראית מדויקת בדיוק כמו נקודה
 * אמיתית, וזו בדיוק הטעות שאסור לחזור עליה.
 */
const groundPoints = (events = []) =>
  events
    .filter((e) => e.kind !== 'flight')
    .map((e) => ({
      lat: Number(e.booking?.lat),
      lng: Number(e.booking?.lng),
      label: e.title,
      color: e.color,
      kind: e.kind,
    }))
    .filter(hasCoord);

const DayMiniMap = ({ events = [] }) => {
  const points = groundPoints(events);

  // נקודה אחת אינה מסלול, ואין מה ללמוד ממפה שיש בה סימן יחיד.
  if (points.length < 2) return null;

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  // טווח אפס במימד אחד קורה כששתי נקודות על אותו קו רוחב או אורך.
  // בלי המינימום הן היו נדחסות לקצה במקום להתפרש.
  const spanLat = Math.max(maxLat - minLat, 0.0005);
  const spanLng = Math.max(maxLng - minLng, 0.0005);

  const xy = (p) => ({
    x: PAD + ((p.lng - minLng) / spanLng) * (W - PAD * 2),
    y: PAD + ((maxLat - p.lat) / spanLat) * (H - PAD * 2),
  });

  const placed = points.map((p) => ({ ...p, ...xy(p) }));
  const path = placed.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  const totalKm = points.reduce(
    (sum, p, i) => (i === 0 ? 0 : sum + distanceKm(points[i - 1].lat, points[i - 1].lng, p.lat, p.lng)),
    0
  );

  return (
    <Box
      sx={{
        bgcolor: '#fff', borderRadius: 3, px: 1.5, pt: 1.25, pb: 0.75, mb: 1.5,
        boxShadow: '0 1px 3px rgba(16,24,40,.06)',
      }}
    >
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        <polyline points={path} fill="none" stroke="#c9cdda" strokeWidth="1.6" strokeDasharray="4 4" />
        {placed.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={5.5}
            fill={i === 0 ? '#fff' : p.color}
            stroke={p.color}
            strokeWidth={i === 0 ? 2.4 : 0}
          />
        ))}
      </svg>

      <Typography
        variant="caption"
        sx={{ display: 'block', textAlign: 'center', color: 'text.disabled', fontSize: '0.68rem', pb: 0.25 }}
      >
        {placed[0].label} ← {placed[placed.length - 1].label}
        {totalKm >= 1 ? ` · ${Math.round(totalKm)} ק״מ` : ''}
      </Typography>
    </Box>
  );
};

export default DayMiniMap;
