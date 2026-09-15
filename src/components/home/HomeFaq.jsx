import React from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Box, Container, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTranslation } from 'react-i18next';

// ── שאלות נפוצות: כל תשובה היא עובדה שנמדדה, לא הבטחה ──
// נוסף 14.09.2026 (STATUS סעיף 22, בעקבות MyTravel). כל תשובה כאן מקבילה
// לקוד שקיים ונבדק באותו יום: העלאת PDF וצילום (18), בדיקת טיסה בלי הרשמה
// (21), ניתוק Gmail אצל Google (6), והתראות עיכוב. תשובה שמתארת יכולת
// שאינה קיימת היא בדיוק "ערך מומצא בשדה מלא" — ולכן כששינוי מסיר או משנה
// יכולת, התשובה כאן מתעדכנת באותו commit. ההתראות באייפון מוסייגות במפורש:
// Web Push פועל שם רק מאפליקציה שנוספה למסך הבית (WebKit, iOS 16.4).
const KEYS = ['import', 'documents', 'stored', 'edit', 'delay', 'noSignup', 'trips', 'mobile', 'delete'];

const HomeFaq = () => {
  const { t } = useTranslation();
  return (
    <Container maxWidth="md" component="section" aria-labelledby="home-faq-title" sx={{ mt: { xs: 4, md: 6 }, px: { xs: 2, md: 3 } }}>
      <Typography id="home-faq-title" variant="h5" component="h2" sx={{ fontWeight: 800, mb: 0.5, textAlign: 'center' }}>
        {t('homeFaq.title')}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2.5, textAlign: 'center' }}>
        {t('homeFaq.subtitle')}
      </Typography>
      <Box>
        {KEYS.map((k) => (
          <Accordion key={k} disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', '&:not(:last-of-type)': { borderBottom: 0 }, '&::before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`faq-${k}`} id={`faq-${k}-q`}>
              <Typography sx={{ fontWeight: 600 }}>{t(`homeFaq.q.${k}`)}</Typography>
            </AccordionSummary>
            <AccordionDetails id={`faq-${k}`}>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{t(`homeFaq.a.${k}`)}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Container>
  );
};

export default HomeFaq;
