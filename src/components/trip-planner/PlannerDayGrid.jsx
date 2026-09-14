import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { buildTimeline, dayGrid } from '../../services/tripTimelineService';

const localDate = (key) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ''));
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};

/**
 * לוח ימי המסלול בתכנון טיול: כל יום — כמה פעילויות מתוכננות, ומה כבר סגור בו.
 *
 * ── למה שני מקורות, ואף אחד לא מועתק ──
 * הפעילויות שייכות לתוכנית; הטיסה, המלון והרכב שייכים להזמנות (פרטי נסיעה).
 * אייקוני ההזמנות נגזרים מאותו `dayGrid` שמזין את לוח הימים בפרטי נסיעה,
 * ולכן שני הלוחות לא יכולים לחלוק על היום של אותה הזמנה — אותה הבטחה של
 * DayAnchors ("ההזמנה נשארת הבעלים היחיד").
 *
 * הלחיצה בוחרת יום, ומחליפה את שורת הלשוניות: בנייד לשוניות גלולות הסתירו
 * את רוב הימים, ולא נראה מהן באיזה יום כבר יש טיסה.
 */
const PlannerDayGrid = ({ days = [], bookings = [], selectedIndex = 0, onSelect }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'he';

  const byKey = useMemo(() => {
    const map = new Map();
    dayGrid(buildTimeline(bookings)).forEach((c) => { if (!c.gap) map.set(c.dayKey, c); });
    return map;
  }, [bookings]);

  if (!days.length) return null;

  return (
    <Box
      role="group"
      aria-label={t('plannerGrid.label')}
      sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 0.75, mb: 2 }}
    >
      {days.map((day, i) => {
        const date = localDate(day.date);
        const booked = byKey.get(day.date);
        const icons = booked ? `${booked.icons.join('')}${booked.staying ? '🛏️' : ''}` : '';
        const count = (day.activities || []).length;
        const selected = i === selectedIndex;
        const what = [
          t('plannerGrid.activities', { count }),
          ...(booked ? booked.labels : []),
          ...(booked?.staying ? [t('dayGrid.staying')] : []),
        ];
        return (
          <Box
            key={day.date || i}
            component="button"
            type="button"
            onClick={() => onSelect?.(i)}
            aria-pressed={selected}
            aria-label={`${t('plannerGrid.day', { n: day.day || i + 1 })}${date ? `, ${date.toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' })}` : ''} — ${what.join(', ')}`}
            sx={{
              all: 'unset', boxSizing: 'border-box', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', minHeight: 76, p: 0.75, borderRadius: 2,
              border: selected ? '2px solid' : '1px solid',
              borderColor: selected ? 'primary.main' : 'divider',
              bgcolor: selected ? 'action.selected' : 'background.paper',
              '&:hover': { borderColor: 'primary.main' },
              '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: 1 },
            }}
          >
            <Typography component="span" sx={{ fontSize: '0.78rem', fontWeight: 800, lineHeight: 1.2 }}>
              {t('plannerGrid.day', { n: day.day || i + 1 })}
            </Typography>
            {date && (
              <Typography component="span" sx={{ fontSize: '0.68rem', color: 'text.secondary', lineHeight: 1.2 }}>
                {date.toLocaleDateString(lang, { weekday: 'short' })} · {date.getDate()}.{date.getMonth() + 1}
              </Typography>
            )}
            <Box aria-hidden="true" sx={{ mt: 'auto', pt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', fontSize: '0.85rem', lineHeight: 1.2 }}>
              {icons && <span>{icons}</span>}
              {count > 0 && (
                <Box component="span" sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'primary.main' }}>📍{count}</Box>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default PlannerDayGrid;
