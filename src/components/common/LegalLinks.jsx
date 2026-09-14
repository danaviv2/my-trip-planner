import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Link, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { openAccessibilitySettings } from './AccessibilitySettings';

// שלושת המסמכים המשפטיים בשורה אחת. Google דורשת קישור למדיניות הפרטיות
// מדף הבית ומתוך האפליקציה, ותקנה 35 דורשת את הצהרת הנגישות "במקום בולט".
// רכיב אחד, כדי שכל המקומות יקשרו לאותן כתובות.
const LegalLinks = ({ sx }) => {
  const { t } = useTranslation();
  return (
    <Stack
      component="nav"
      aria-label={t('legal.privacy') + ' · ' + t('legal.terms')}
      direction="row"
      spacing={2}
      justifyContent="center"
      flexWrap="wrap"
      useFlexGap
      sx={{ py: 2, fontSize: '0.85rem', ...sx }}
    >
      {['privacy', 'terms', 'accessibility'].map((k) => (
        <Link key={k} component={RouterLink} to={`/${k}`} color="text.secondary" underline="hover">
          {t(`legal.${k}`)}
        </Link>
      ))}
      <Link component="button" type="button" onClick={openAccessibilitySettings} color="text.secondary" underline="hover" sx={{ fontSize: 'inherit', fontFamily: 'inherit' }}>
        {t('a11y.title')}
      </Link>
    </Stack>
  );
};

export default LegalLinks;
