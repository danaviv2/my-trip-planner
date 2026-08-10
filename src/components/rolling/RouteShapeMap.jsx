import React from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';
import { projectStops, routeTotals, analyzeRoute } from '../../services/routeGeometryService';

/**
 * צורת המסלול — שרטוט קל של התחנות לפי מיקומן.
 *
 * אין כאן מפת רקע ואין קריאת רשת. השאלה שהמסך צריך לענות עליה היא "האם
 * התחנה הזו בדרך", והיא נענית מצורת הקו בלבד. מפה מוטמעת הייתה מוסיפה
 * משקל, תלות ונקודת כשל בלי להוסיף לתשובה.
 *
 * השמות אינם על השרטוט אלא ברשימה שמתחתיו. גרסה קודמת מיקמה תווית מעל
 * כל נקודה, ובמסלול צפוף — עשר תחנות בדרום צרפת — התוויות רכבו זו על זו
 * עד שאי אפשר היה לקרוא אף אחת. מספור על הנקודה נשאר קריא בכל צפיפות,
 * ואינו מחייב להזיז נקודות ממקומן האמיתי.
 */
const RouteShapeMap = ({ stops = [] }) => {
  const W = 640;
  const H = 240;

  const points = projectStops(stops, W, H, 34);
  const totals = routeTotals(stops);
  if (!points || points.length < 2) return null;

  const analysis = analyzeRoute(stops);
  const line = points.map((p) => `${p.x},${p.y}`).join(' ');

  const colorOf = (i) =>
    analysis[i]?.notable ? '#ed6c02' : i === 0 || i === points.length - 1 ? '#2e7d32' : '#667eea';

  return (
    <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>🗺️ צורת המסלול</Typography>
        {totals && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip size="small" label={`${totals.total.toLocaleString()} ק״מ בקו אווירי`} />
            {totals.extra > 50 && (
              <Chip size="small" color="warning" variant="outlined"
                label={`+${totals.extra.toLocaleString()} ק״מ מעל הקו הישיר`} />
            )}
          </Box>
        )}
      </Box>

      <Box sx={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', minWidth: 300 }}
             role="img" aria-label="שרטוט מסלול הנסיעה לפי מיקומי התחנות">
          <polyline points={line} fill="none" stroke="#667eea" strokeWidth="2.5"
                    strokeLinejoin="round" strokeDasharray="6 4" />
          {points.map((p, i) => {
            const endpoint = i === 0 || i === points.length - 1;
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={endpoint ? 11 : 9.5}
                        fill={colorOf(i)} stroke="#fff" strokeWidth="2" />
                <text x={p.x} y={p.y + 3.5} textAnchor="middle" fontSize="10.5"
                      fontWeight="700" fill="#fff">
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </Box>

      {/* המקרא. כאן השמות קריאים תמיד, בלי תלות בצפיפות הגיאוגרפית. */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
        {points.map((p, i) => {
          const info = analysis[i] || {};
          return (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <Box sx={{
                width: 18, height: 18, borderRadius: '50%', bgcolor: colorOf(i),
                color: '#fff', fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {i + 1}
              </Box>
              <Typography variant="caption" sx={{ fontWeight: info.notable ? 700 : 500 }}>
                {p.stop.name}
                {info.notable && (
                  <Typography component="span" variant="caption" sx={{ color: 'warning.dark', fontWeight: 700 }}>
                    {' '}+{info.detour} ק״מ
                  </Typography>
                )}
              </Typography>
            </Box>
          );
        })}
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        מרחקים בקו אווירי, להתמצאות בלבד. תחנות סמוכות מוזזות מעט זו מזו כדי שיישארו קריאות — מרחק הכביש בפועל ארוך יותר.
      </Typography>
    </Paper>
  );
};

export default RouteShapeMap;
