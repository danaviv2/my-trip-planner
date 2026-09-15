// src/components/trip-planner/RecommendedHotelCard.jsx
import React from 'react';
import { Box, Typography, Paper, Chip, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import HotelIcon from '@mui/icons-material/Hotel';
import StarIcon from '@mui/icons-material/Star';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import bookingLinks from '../../utils/bookingLinks';

/**
 * לינה מומלצת ליום — אותו כרטיס בטיול המתגלגל ובמסך התכנון.
 *
 * עד 15.09.2026 הכרטיס היה קיים רק בטיול המתגלגל, והמלון נשמר עם הטיול
 * אבל לא הוצג בתכנון בכלל. רכיב אחד לשני המסכים: שני עותקים של אותו
 * כרטיס הם בדיוק הדרך שבה תיקון נכנס לאחד ונשכח בשני.
 *
 * @param {object}  hotel         day.hotel מהמסלול
 * @param {string}  city          שם העיר לחיפוש (באנגלית כשיש)
 * @param {object}  stay          { checkIn, checkOut } או null כשאין תאריכים
 * @param {boolean} planned       כבר בתכנון הלינה — נגזר מהרשימה, לא נשמר בכפתור
 * @param {Function} onAdd        פותח את חלון ההוספה, ממולא מראש
 */
const RecommendedHotelCard = ({ hotel, city, stay, planned, onAdd }) => {
  const { t } = useTranslation();
  if (!hotel?.name) return null;

  const query = `${hotel.name} ${city || ''}`.trim();
  const href = stay
    ? bookingLinks.hotel(query, stay.checkIn, stay.checkOut)
    : bookingLinks.hotelSearch(query);
  const short = (iso) => {
    const [, m, d] = String(iso).split('-');
    return `${Number(d)}.${Number(m)}`;
  };

  return (
    <Paper sx={{ mt: 1.5, p: 1.5, borderRadius: 2,
      background: 'linear-gradient(135deg, #667eea11, #764ba211)',
      border: '1px solid #667eea33' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <HotelIcon sx={{ color: '#667eea', fontSize: 18 }} />
        <Typography variant="body2" fontWeight={700} color="primary">🌙 {t('rolling.full.lodging')}</Typography>
        <Box sx={{ display: 'flex' }}>
          {Array.from({ length: hotel.stars || 3 }).map((_, i) => (
            <StarIcon key={i} sx={{ fontSize: 11, color: '#f5af19' }} />
          ))}
        </Box>
        <Chip label={hotel.priceRange || '€€'} size="small"
          sx={{ ml: 'auto', fontSize: '0.63rem', bgcolor: '#667eea22', color: '#667eea', fontWeight: 700 }} />
      </Box>
      <Typography variant="body2" fontWeight={600}>{hotel.name}</Typography>
      {stay && (
        <Typography variant="caption" color="text.secondary" display="block">
          {t('rolling.full.stay', { from: short(stay.checkIn), to: short(stay.checkOut) })}
        </Typography>
      )}
      {hotel.description && (
        <Typography variant="caption" color="text.secondary" display="block">{hotel.description}</Typography>
      )}
      {hotel.bookingTip && (
        <Typography variant="caption" sx={{ color: '#764ba2', display: 'block', mt: 0.3 }}>
          💡 {hotel.bookingTip}
        </Typography>
      )}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
        <Button size="small" endIcon={<OpenInNewIcon fontSize="small" />}
          href={href} target="_blank" rel="noopener noreferrer"
          sx={{ fontSize: '0.7rem', p: '2px 8px', color: '#667eea' }}>
          {t('rolling.full.searchBooking')}
        </Button>
        {onAdd && (planned ? (
          <Chip size="small" icon={<CheckIcon />} label={t('rolling.full.inPlan')}
            sx={{ fontSize: '0.7rem', bgcolor: '#43e97b22', color: '#1a7a40' }} />
        ) : (
          <Button size="small" variant="outlined" startIcon={<AddIcon fontSize="small" />}
            onClick={onAdd}
            sx={{ fontSize: '0.7rem', p: '2px 8px' }}>
            {t('rolling.full.addToPlan')}
          </Button>
        ))}
      </Box>
    </Paper>
  );
};

export default RecommendedHotelCard;
