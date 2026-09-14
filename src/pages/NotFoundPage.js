import React, { useEffect } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LottieArt from '../components/common/LottieArt';

// ── דף "לא נמצא" במקום דף הבית ──
// עד 14.09.2026 הנתיב `*` הציג את דף הבית. קישור שבור נראה כאילו עבד, והמשתמש
// לא הבין למה אינו רואה את מה שביקש. זה גם "soft 404" במונחי Google: כל כתובת
// שגויה מחזירה תוכן זהה לדף הבית, ומנוע החיפוש סופר עמודים כפולים.
//
// Vercel מחזיר 200 לכל נתיב (ה-rewrite ב-vercel.json מפנה ל-index.html), ולכן
// אי אפשר להחזיר סטטוס 404 אמיתי מאפליקציית צד-לקוח. `noindex` הוא מה
// ש-Google מתעד לאפליקציות כאלה.
export default function NotFoundPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  return (
    <Box sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center', px: 2, py: 8 }}>
      <Box sx={{ textAlign: 'center', maxWidth: 480 }}>
        <LottieArt name="map-line" height={150} sx={{ mb: 1 }} />
        <Typography variant="h4" component="h1" fontWeight={800} gutterBottom>
          {t('notFound.title')}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 1 }}>
          {t('notFound.body')}
        </Typography>
        {/* הכתובת מוצגת כדי שמי שהקליד אותה יראה את השגיאה בעצמו */}
        <Typography component="code" dir="ltr" sx={{ display: 'inline-block', fontFamily: 'monospace', fontSize: '0.85rem', bgcolor: 'action.hover', px: 1, borderRadius: 1, mb: 3, wordBreak: 'break-all' }}>
          {pathname}
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
          <Button variant="contained" size="large" onClick={() => navigate('/')}>
            {t('notFound.home')}
          </Button>
          <Button variant="outlined" size="large" onClick={() => navigate('/my-trips')}>
            {t('notFound.trips')}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
