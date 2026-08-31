import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Alert, Chip, Stack } from '@mui/material';
import InteractiveMap from './InteractiveMap';
import { geocode, routeThroughNames } from '../../services/roadRouteService';

/**
 * מסלול אמיתי על מפה אמיתית.
 *
 * עד כה המסלול הוצג רק כ-iframe של גוגל, שאינו יכול לשאת סמנים משלנו.
 * כאן הצורה מגיעה מ-OSRM (`path`) ונמסרת ל-`InteractiveMap` כ-Polyline,
 * ולכן אפשר להניח עליה נקודות — וזה מה שיאפשר בהמשך להחזיר את המסננים
 * שמתו כשהמפה הוחלפה ב-iframe ב-25.2.2026.
 *
 * @param {string[]} stops שמות המקומות לפי סדר: התחלה, ביניים, יעד
 * @param {string} height גובה המפה
 */
const RouteOnMap = ({ stops = [], height = '480px' }) => {
  const [state, setState] = useState({ status: 'idle' });

  useEffect(() => {
    const names = stops.map((s) => String(s || '').trim()).filter(Boolean);
    if (names.length < 2) {
      setState({ status: 'idle' });
      return;
    }

    let cancelled = false;
    setState({ status: 'loading' });

    (async () => {
      // הנקודות מקודדות בנפרד מהמסלול משום ש-`routeThroughNames` אינו
      // מחזיר אותן, והסמנים צריכים אותן. אותו מטמון משרת את שתי הקריאות,
      // ולכן זה לא עולה פנייה נוספת.
      const points = [];
      for (const name of names) {
        const p = await geocode(name);
        if (cancelled) return;
        // מקום אחד שלא זוהה מבטל הכל: מסלול שמדלג על תחנה ומוצג כמלא
        // הוא ערך שגוי, לא ערך חסר.
        if (!p) { setState({ status: 'error', name }); return; }
        points.push({ ...p, name });
      }

      const route = await routeThroughNames(names);
      if (cancelled) return;
      if (!route || !route.path || !route.path.length) {
        setState({ status: 'error', name: null });
        return;
      }
      setState({ status: 'ready', route, points });
    })();

    return () => { cancelled = true; };
  }, [stops.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  if (state.status === 'idle') return null;

  if (state.status === 'loading') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 3, justifyContent: 'center' }}>
        <CircularProgress size={22} />
        <Typography variant="body2">מחשב את המסלול…</Typography>
      </Box>
    );
  }

  if (state.status === 'error') {
    return (
      <Alert severity="warning" sx={{ my: 2 }}>
        {state.name ? `לא הצלחנו לאתר את "${state.name}"` : 'לא הצלחנו לחשב את המסלול'}
      </Alert>
    );
  }

  const { route, points } = state;
  const mid = route.path[Math.floor(route.path.length / 2)];

  const markers = points.map((p, i) => ({
    id: `stop-${i}`,
    lat: p.lat,
    lng: p.lng,
    title: p.name,
    description: i === 0 ? 'נקודת התחלה' : i === points.length - 1 ? 'יעד' : `תחנה ${i}`,
  }));

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <Chip label={route.distance} color="primary" size="small" />
        <Chip label={route.duration} size="small" />
        <Chip label={`${points.length} נקודות`} size="small" variant="outlined" />
      </Stack>

      <InteractiveMap
        initialCenter={mid}
        initialZoom={7}
        markers={markers}
        routes={[{ id: 'main', path: route.path, color: '#1976d2' }]}
        height={height}
        showFilters={false}
      />
    </Box>
  );
};

export default RouteOnMap;
