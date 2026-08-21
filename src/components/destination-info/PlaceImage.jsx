import React, { useEffect, useState } from 'react';
import { Box, Skeleton } from '@mui/material';
import { getPlacePhotoFast } from '../../services/placeMediaService';

/**
 * תמונה של מקום — או כותרת נקייה כשאין תמונה אמיתית.
 *
 * ── מה זה מחליף ──
 * תצלום אקראי מ-picsum.photos, ומזהי Unsplash שנבחרו ידנית ו-15 מהם
 * מחזירים 404. תחת "קתדרלת סנטה מריה דל פיורה" הופיע גשר במקום אחר
 * בעולם.
 *
 * ── למה לא ממלא מקום שנראה כמו תצלום ──
 * כל תמונה שאינה של המקום היא אותה שקר, גם אם היא יפה. כשאין תצלום
 * אמיתי מוצג שדה צבע עם אייקון — ברור מיד שזהו עיטור ולא תיעוד, ולכן
 * אינו מסוגל להטעות.
 *
 * ── למה לא לחכות לכולם ──
 * שירות המפות מגביל לבקשה בשנייה, ובדף עם שש-עשרה מקומות המתנה לתשובה
 * אחרונה הייתה משאירה מסך ריק לרבע דקה. כל כרטיס מביא את שלו ומתמלא
 * לבד; מה שכבר במטמון מופיע מיד.
 */

/** צבע יציב לפי השם, כדי שאותו מקום ייראה זהה בכל טעינה. */
const tintOf = (text) => {
  const tints = ['#e8eaf6', '#e0f2f1', '#fff3e0', '#fce4ec', '#e3f2fd', '#f1f8e9'];
  let sum = 0;
  for (let i = 0; i < String(text).length; i += 1) sum += String(text).charCodeAt(i);
  return tints[sum % tints.length];
};

/**
 * @param {string} name   השם המוצג, בעברית. זהו גם החיפוש הראשון:
 *   מדידה הראתה שתשעה מתוך עשרה מקומות ומאכלים נמצאים בוויקיפדיה
 *   העברית לפי שמם — כולל מגדל אייפל, פונטה וקיו וקרואסון.
 * @param {string} lookup השם המקומי, לגיבוי כשאין ערך עברי.
 */
const PlaceImage = ({ name, lookup = '', height = 180, icon = '📍' }) => {
  const query = String(name || '').trim();
  const alt = String(lookup || '').trim();
  const [state, setState] = useState({ loading: true, photo: null });

  useEffect(() => {
    let alive = true;
    if (!query) { setState({ loading: false, photo: null }); return undefined; }

    setState({ loading: true, photo: null });
    getPlacePhotoFast(query, alt).then((photo) => {
      if (alive) setState({ loading: false, photo });
    });

    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, alt]);

  if (state.loading) {
    return <Skeleton variant="rectangular" height={height} animation="wave" />;
  }

  if (state.photo) {
    return (
      <Box
        component="img"
        src={state.photo}
        alt={name}
        loading="lazy"
        // גם תמונה אמיתית עלולה להיעלם מהמקור. במקרה כזה עוברים לשדה
        // הצבע, ולא משאירים אייקון של תמונה שבורה.
        onError={() => setState({ loading: false, photo: null })}
        sx={{ width: '100%', height, objectFit: 'cover', display: 'block' }}
      />
    );
  }

  return (
    <Box
      sx={{
        height,
        bgcolor: tintOf(name || ''),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 0.5, px: 2,
      }}
    >
      <Box sx={{ fontSize: height > 150 ? '2rem' : '1.5rem', opacity: 0.55 }}>{icon}</Box>
      <Box
        sx={{
          fontSize: '0.7rem', color: 'rgba(0,0,0,.42)', textAlign: 'center',
          overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}
      >
        {name}
      </Box>
    </Box>
  );
};

export default PlaceImage;
