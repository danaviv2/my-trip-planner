import React from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';
import { projectStops, routeTotals, analyzeRoute } from '../../services/routeGeometryService';

/**
 * צורת המסלול — שרטוט קל של התחנות לפי מיקומן.
 *
 * אין כאן מפת רקע ואין קריאת רשת. השאלה שהמסך הזה צריך לענות עליה היא
 * "האם התחנה הזו בדרך", והיא נענית מצורת הקו בלבד. מפה מוטמעת הייתה
 * מוסיפה משקל, תלות ונקודת כשל — בלי להוסיף לתשובה.
 *
 * הקואורדינטות מגיעות מהמודל יחד עם התחנות, ולכן השרטוט אינו עולה דבר.
 */
const RouteShapeMap = ({ stops = [] }) => {
  const W = 640;
  const H = 200;

  const points = projectStops(stops, W, H);
  const totals = routeTotals(stops);
  if (!points || points.length < 2) return null;

  const analysis = analyzeRoute(stops);
  const line = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          🗺️ צורת המסלול
        </Typography>
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
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', minWidth: 320 }} role="img"
             aria-label="שרטוט מסלול הנסיעה לפי מיקומי התחנות">
          <polyline
            points={line}
            fill="none"
            stroke="#667eea"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeDasharray="6 4"
          />
          {points.map((p, i) => {
            const info = analysis[i] || {};
            const endpoint = i === 0 || i === points.length - 1;
            const color = info.notable ? '#ed6c02' : endpoint ? '#2e7d32' : '#667eea';
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={endpoint ? 7 : 5.5} fill={color} stroke="#fff" strokeWidth="2" />
                <text
                  x={p.x}
                  y={p.y - 11}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={endpoint ? 700 : 500}
                  fill="#37474f"
                >
                  {p.stop.name}
                </text>
                {info.notable && (
                  <text x={p.x} y={p.y + 18} textAnchor="middle" fontSize="10" fill="#ed6c02" fontWeight={700}>
                    +{info.detour} ק״מ
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        מרחקים בקו אווירי, להתמצאות בלבד — מרחק הכביש בפועל ארוך יותר.
      </Typography>
    </Paper>
  );
};

export default RouteShapeMap;
