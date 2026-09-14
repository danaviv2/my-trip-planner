import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { buildTimeline, dayGrid } from '../../services/tripTimelineService';

// "YYYY-MM-DD" ⟵ Date מקומי, בלי המרת UTC שמזיזה יום (ראה openMeteoService).
const localDate = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** מזהה העוגן של יום בציר. משותף ל-TripTimeline, שמציב אותו על כותרת היום. */
export const dayAnchorId = (dayKey) => `trip-day-${dayKey}`;

/**
 * לוח ימי הנסיעה: מבט אחד על כל הטיול, לפני הרשימה המפורטת.
 *
 * ── למה, ולמה לא חלונית פרטים משלו ──
 * הרעיון נלקח מ-MyTravel (14.09.2026): רשת ימים עם אייקון לכל סוג. אצלם
 * לחיצה פותחת חלונית עם פרטי היום. כאן היא גוללת ליום בציר — הפרטים,
 * העריכה, המפה והקישור למייל כבר חיים שם, ותצוגה שנייה של אותם פרטים
 * הייתה נפרדת מהם בתיקון הבא. מאותה סיבה הלוח נגזר מ-buildTimeline.
 */
const TripDayGrid = ({ bookings = [] }) => {
  const { t, i18n } = useTranslation();
  const days = buildTimeline(bookings);
  const cells = dayGrid(days);
  // לוח של יום אחד או שניים אינו מוסיף דבר על הציר שמתחתיו.
  if (cells.filter((c) => !c.gap).length < 3) return null;

  const today = todayKey();
  const lang = i18n.language || 'he';

  // יום של שהות בלבד אין לו כותרת בציר; גוללים ליום האחרון שלפניו שיש לו.
  const scrollTo = (key) => {
    const target = [...days].reverse().find((d) => d.dayKey <= key) || days[0];
    document.getElementById(dayAnchorId(target.dayKey))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Box
      component="nav"
      aria-label={t('dayGrid.label')}
      className="no-print"
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))',
        gap: 0.75,
        mb: 2,
      }}
    >
      {cells.map((c) => {
        if (c.gap) {
          return (
            <Box
              key={`gap-${c.dayKey}`}
              sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 2, border: '1px dashed', borderColor: 'divider',
                color: 'text.disabled', fontSize: '0.75rem', minHeight: 72, px: 0.5, textAlign: 'center',
              }}
            >
              {t('dayGrid.gap', { count: c.count })}
            </Box>
          );
        }
        const date = localDate(c.dayKey);
        const isToday = c.dayKey === today;
        const past = c.dayKey < today;
        const what = [...c.labels, ...(c.staying ? [t('dayGrid.staying')] : [])];
        const weekday = date.toLocaleDateString(lang, { weekday: 'short' });
        const month = date.toLocaleDateString(lang, { month: 'short' });
        return (
          <Box
            key={c.dayKey}
            component="button"
            type="button"
            onClick={() => scrollTo(c.dayKey)}
            aria-label={`${date.toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' })}${what.length ? ` — ${what.join(', ')}` : ` — ${t('dayGrid.free')}`}`}
            aria-current={isToday ? 'date' : undefined}
            sx={{
              all: 'unset', boxSizing: 'border-box', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'stretch',
              minHeight: 72, p: 0.75, borderRadius: 2,
              border: isToday ? '2px solid' : '1px solid',
              borderColor: isToday ? 'primary.main' : 'divider',
              bgcolor: c.empty ? 'transparent' : 'background.paper',
              opacity: past && !isToday ? 0.6 : 1,
              transition: 'border-color .15s',
              '&:hover': { borderColor: 'primary.main' },
              '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: 1 },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              <Typography component="span" sx={{ fontSize: '1.15rem', fontWeight: 800, lineHeight: 1 }}>
                {date.getDate()}
              </Typography>
              <Typography component="span" sx={{ fontSize: '0.68rem', color: 'text.secondary', lineHeight: 1.1 }}>
                {weekday} · {month}
              </Typography>
            </Box>
            <Box aria-hidden="true" sx={{ mt: 'auto', pt: 0.5, fontSize: '0.9rem', lineHeight: 1.2, letterSpacing: '1px', wordBreak: 'break-all' }}>
              {c.icons.join('')}{c.staying ? '🛏️' : ''}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default TripDayGrid;
