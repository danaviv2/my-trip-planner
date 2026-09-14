import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { getImageCredit } from '../../services/imageCreditService';

/**
 * שורת קרדיט קטנה בפינת תמונה: "© יוצר · CC BY-SA 4.0", קישור לדף הקובץ.
 *
 * הקישור לדף הקובץ הוא חלק מהקרדיט ולא קישוט: שם מופיעים היוצר המלא ותנאי
 * הרישיון, וזה מה שוויקישיתוף מגדיר כציון "סביר לאמצעי" כשאין מקום לפרטים.
 * כשאין שם יוצר (נמדד בקובץ מוויקיפדיה העברית) מוצג "ויקיפדיה" והרישיון.
 *
 * `onNonFree` נקרא כשהקובץ אינו חופשי, כדי שהקורא יסתיר את התמונה.
 */
const ImageCredit = ({ src, onNonFree, sx }) => {
  const [credit, setCredit] = useState(null);

  useEffect(() => {
    let alive = true;
    setCredit(null);
    if (!src) return undefined;
    getImageCredit(src).then((c) => {
      if (!alive) return;
      if (c?.nonFree) onNonFree?.();
      setCredit(c);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  if (!credit || credit.nonFree) return null;
  const who = credit.artist || 'Wikipedia';
  const text = credit.license ? `© ${who} · ${credit.license}` : `© ${who}`;

  return (
    <Box
      component="a"
      href={credit.page}
      target="_blank"
      rel="noopener noreferrer"
      title={text}
      onClick={(e) => e.stopPropagation()}
      dir="ltr"
      sx={{
        position: 'absolute', bottom: 2, insetInlineStart: 2, maxWidth: 'calc(100% - 4px)', boxSizing: 'border-box',
        fontSize: '0.6rem', lineHeight: 1.4, px: 0.6, borderRadius: 0.75,
        bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', textDecoration: 'none',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', zIndex: 2,
        '&:hover, &:focus-visible': { textDecoration: 'underline', bgcolor: 'rgba(0,0,0,0.75)' },
        ...sx,
      }}
    >
      {text}
    </Box>
  );
};

export default ImageCredit;
