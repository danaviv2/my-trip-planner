import React from 'react';
import { Box, Typography } from '@mui/material';
import { distanceKmExact } from '../../services/routeGeometryService';

/**
 * מפת היום, מצוירת מקואורדינטות ולא מאריחים.
 *
 * אריחי מפה הם הדבר היחיד באפליקציה שנשבר בלי קליטה, והם גם מאטים את
 * המסך הראשון — בדיוק בשדה התעופה, שם הוא נפתח. הנקודות כבר בידינו,
 * ולכן ציור ישיר נותן תמונה מיידית שעובדת גם בלי רשת.
 *
 * ── למה מספרים ולא שמות על המפה ──
 * נקודות אנונימיות אינן מובנות: מי שלא מזהה שזו מפה רואה כמה עיגולים.
 * אבל שמות מלאים על רוחב של מסך טלפון מתנגשים זה בזה כבר בשלוש עצירות,
 * ובעברית גם נשברים לכיוון ההפוך. לכן כל נקודה נושאת מספר, אותו מספר
 * חוזר על האירוע בציר שמתחת, ורשימת השמות יושבת מתחת למפה כטקסט רגיל
 * שמסתדר לבד. המספר הוא הקישור; המפה מראה מרחק וכיוון, הציר מראה מה.
 *
 * ── מה לא נכנס למפה ──
 * טיסות. ביום נחיתה הטיסה משתרעת על אלפי קילומטרים, והייתה מוחצת את
 * המעבר מהשדה למלון לנקודה אחת חסרת ערך. המפה מתארת את התנועה על הקרקע.
 *
 * הצפון למעלה גם במסך עברי: מפה נקראת גיאוגרפית, והיפוך היה מבלבל.
 */

const W = 366;
const H = 104;
const PAD = 22;

const hasCoord = (p) =>
  p && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)) &&
  !(Number(p.lat) === 0 && Number(p.lng) === 0);

/**
 * נקודות הקרקע של היום, לפי סדר האירועים.
 *
 * המיקום נלקח מההזמנה עצמה. לא כל סוג נושא קואורדינטות, ומה שאין לו
 * פשוט אינו מופיע — נקודה משוערת על מפה נראית מדויקת בדיוק כמו נקודה
 * אמיתית, וזו בדיוק הטעות שאסור לחזור עליה.
 *
 * מיוצא כדי שהציר ימספר את אותם אירועים בדיוק: שני חישובים נפרדים היו
 * נפרדים גם כשהם טועים, והמספרים על המפה היו מצביעים על שורה אחרת.
 */
export const groundPoints = (events = []) =>
  events
    .filter((e) => e.kind !== 'flight' && e.coords)
    .map((e) => ({
      ev: e,
      lat: e.coords.lat,
      lng: e.coords.lng,
      label: e.title,
      color: e.color,
      kind: e.kind,
      unverified: !!e.coords.unverified,
    }))
    .filter(hasCoord);

/** קילומטרים בין שתי נקודות, מעוגל לקריאה. */
const legText = (km) => (km < 1 ? `${Math.round(km * 1000)} מ׳` : `${km < 10 ? km.toFixed(1) : Math.round(km)} ק״מ`);

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

  // הפונקציה מקבלת שתי נקודות, לא ארבעה מספרים. הקריאה השגויה החזירה
  // null בכל קטע, והסכום הצטבר לאפס — המפה הציגה "0 מ׳" בין ערים.
  const legs = placed.slice(1).map((p, i) => ({
    from: placed[i],
    to: p,
    km: distanceKmExact(placed[i], p) || 0,
  }));
  const totalKm = legs.reduce((sum, l) => sum + l.km, 0);

  // מרחק לכל קטע מוצג רק כשיש מקום: בארבעה קטעים ומעלה התוויות
  // מתחילות לדרוך זו על זו, ואז נשאר הסיכום בלבד.
  const showLegs = legs.length <= 3;

  return (
    <Box
      sx={{
        bgcolor: '#fff', borderRadius: 3, px: 1.5, pt: 1.25, pb: 1, mb: 1.5,
        boxShadow: '0 1px 3px rgba(16,24,40,.06)',
      }}
    >
      {/* כותרת: בלעדיה העיגולים והקו הם ציור מופשט ולא מפה */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5, color: 'text.disabled' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 3 3 5.5v15L9 18l6 3 6-2.5v-15L15 6 9 3z" />
          <path d="M9 3v15M15 6v15" />
        </svg>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.2px' }}>
          מסלול היום
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Typography sx={{ fontSize: '0.7rem' }}>
          {points.length} עצירות{totalKm >= 0.5 ? ` · ${legText(totalKm)}` : ''}
        </Typography>
      </Box>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {legs.map((l, i) => (
          <line
            key={`l${i}`}
            x1={l.from.x} y1={l.from.y} x2={l.to.x} y2={l.to.y}
            stroke="#c9cdda" strokeWidth="1.6" strokeDasharray="4 4"
          />
        ))}

        {showLegs && legs.map((l, i) => (
          <text
            key={`t${i}`}
            x={(l.from.x + l.to.x) / 2}
            y={(l.from.y + l.to.y) / 2 - 5}
            textAnchor="middle"
            style={{ fontSize: '9px', fill: '#a0a4b5', fontWeight: 500 }}
          >
            {legText(l.km)}
          </text>
        ))}

        {placed.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={9} fill={p.color} />
            <text
              x={p.x} y={p.y}
              textAnchor="middle" dominantBaseline="central"
              style={{ fontSize: '10px', fill: '#fff', fontWeight: 700 }}
            >
              {i + 1}
            </text>
          </g>
        ))}
      </svg>

      {/* השמות כטקסט רגיל ולא על הציור: כאן הם נשברים לשורות לבד,
          נקראים נכון מימין לשמאל, ואינם מתנגשים זה בזה. */}
      <Box sx={{ mt: 0.75, display: 'flex', flexWrap: 'wrap', gap: '4px 8px', alignItems: 'center' }}>
        {placed.map((p, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, maxWidth: '100%' }}>
            <Box
              sx={{
                width: 15, height: 15, borderRadius: '50%', bgcolor: p.color, color: '#fff',
                fontSize: '0.6rem', fontWeight: 700, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {i + 1}
            </Box>
            <Typography
              sx={{
                fontSize: '0.7rem', color: 'text.secondary',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150,
              }}
            >
              {p.label}
              {p.unverified ? ' ⚠️' : ''}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default DayMiniMap;
