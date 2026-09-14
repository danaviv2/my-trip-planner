import React, { useEffect } from 'react';
import { Alert, Box, Container, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { privacy } from '../legal/privacy';
import { terms } from '../legal/terms';
import { accessibility } from '../legal/accessibility';

const DOCS = { privacy, terms, accessibility };

// ── מסמכים משפטיים: טיוטה גלויה, לא טיוטה שמתחזה לסופית ──
// הטקסט ממתין לבדיקת עו"ד, ובכל זאת יש לו כתובת כבר עכשיו: טופס ההרשמה
// צריך לקשר אליו, ו-Google דורשת קישור למדיניות הפרטיות כבר בהגשת האימות.
// לכן הסימון "טיוטה" מוצג בראש כל מסמך, ו-`noindex` מונע ממנוע חיפוש לשמור
// גרסה שעוד תשתנה. שני אלה יוסרו יחד, כשהנוסח יאושר.
//
// הנוסח בעברית בלבד בשלב זה. תרגום מסמך משפטי לפני שהמקור אושר מכפיל כל
// תיקון של עו"ד בחמש, ולכן בשפות אחרות מוצגת הודעה שהמסמך בעברית.
// התוכן תמיד עברי, ולכן `dir="rtl"` כתכונת HTML — היא אינה עוברת דרך
// stylis ואינה נהפכת.
export default function LegalPage({ doc }) {
  const { t, i18n } = useTranslation();
  const d = DOCS[doc];

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    const prevTitle = document.title;
    document.title = d.title;
    return () => { meta.remove(); document.title = prevTitle; };
  }, [d]);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
        {t('legal.draft')}
      </Alert>
      {!String(i18n.language || '').startsWith('he') && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          {t('legal.hebrewOnly')}
        </Alert>
      )}
      <Box dir="rtl" lang="he" sx={{ textAlign: 'start' }}>
        <Typography variant="h4" component="h1" fontWeight={800} gutterBottom>
          {d.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          עדכון אחרון: {d.updated}
        </Typography>
        {d.sections.map((s) => (
          <Box component="section" key={s.h} sx={{ mb: 3.5 }}>
            <Typography variant="h6" component="h2" fontWeight={700} sx={{ mb: 1 }}>
              {s.h}
            </Typography>
            {s.p.map((line) => (
              <Typography
                key={line}
                sx={{
                  mb: 1.25, lineHeight: 1.8,
                  // פרט שחסר ורק הבעלים או עו"ד ימלאו — בולט, כדי שלא יתפרסם בטעות.
                  ...(line.includes('[') && { bgcolor: 'warning.light', color: 'warning.contrastText', px: 0.75, borderRadius: 1 }),
                }}
              >
                {line}
              </Typography>
            ))}
          </Box>
        ))}
      </Box>
    </Container>
  );
}
