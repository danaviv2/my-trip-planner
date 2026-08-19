import React from 'react';
import { Box, Typography, IconButton, Chip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { buildTimeline, humanGap } from '../../services/tripTimelineService';
import DayMiniMap, { groundPoints } from './DayMiniMap';

/**
 * הנסיעה כרצף אירועים לפי זמן.
 *
 * המסך הקודם הציג את ההזמנות מקובצות לפי סוג, וכדי לענות על "נחתתי
 * ב-17:15, איך אני מגיע למלון" היה צריך לפתוח כל כרטיס ולסדר תאריכים
 * בראש. כאן הסדר הוא המידע.
 *
 * שתי החלטות שנובעות מכך:
 *
 * • הפער בין אירועים מוצג כשורה משלו. שלוש שעות בין נחיתה להסעה קופצות
 *   לעין, במקום להידרש להתראה נפרדת שתסביר אותן.
 *
 * • יום בלי הזמנות אינו נעלם ואינו תופס מקום: רצף כזה מקופל לשורה אחת,
 *   כדי שהמרחק בין שני קצוות הנסיעה יישאר מורגש.
 */

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

const dayLabel = (d) => `${DAY_NAMES[d.getDay()]} · ${d.getDate()}.${d.getMonth() + 1}`;

/** תווית העמודה הימנית: שעה אמיתית, או תפקיד האירוע ביום. */
const stamp = (ev) => {
  if (!ev.allDay) {
    return `${String(ev.at.getHours()).padStart(2, '0')}:${String(ev.at.getMinutes()).padStart(2, '0')}`;
  }
  if (ev.kind === 'hotel-in') return 'כניסה';
  if (ev.kind === 'hotel-out') return 'יציאה';
  return '';
};

const DAY_MS = 86400000;

/** כמה ימים חלפו בין שני ימי ציר. */
const daysBetween = (a, b) => Math.round((b - a) / DAY_MS);

const EventRow = ({ ev, onDelete, mapNumber }) => (
  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', mb: 0.5 }}>
    <Box
      sx={{
        width: 46, pt: 1.5, textAlign: 'left', flexShrink: 0,
        fontSize: ev.allDay ? '0.8rem' : '0.875rem',
        fontWeight: ev.allDay ? 500 : 600,
        color: ev.allDay ? 'text.disabled' : 'text.primary',
        letterSpacing: '-0.2px',
      }}
    >
      {stamp(ev)}
    </Box>

    <Box sx={{ width: 32, display: 'flex', justifyContent: 'center', pt: 1.25, flexShrink: 0 }}>
      <Box
        sx={{
          position: 'relative',
          width: 32, height: 32, borderRadius: '50%',
          bgcolor: `${ev.color}1a`, color: ev.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.95rem',
          // הטבעת בצבע הרקע מנתקת את העיגול מהקו שמאחוריו
          boxShadow: '0 0 0 4px #f5f7fa',
        }}
      >
        {ev.icon}
        {/* אותו מספר שעל המפה. בלעדיו המפה היא ציור נפרד שצריך לפענח
            מחדש; איתו היא מקרא של הרשימה שמתחתיה. */}
        {mapNumber != null && (
          <Box
            sx={{
              position: 'absolute', top: -3, left: -3,
              width: 15, height: 15, borderRadius: '50%',
              bgcolor: ev.color, color: '#fff',
              fontSize: '0.6rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 2px #f5f7fa',
            }}
          >
            {mapNumber}
          </Box>
        )}
      </Box>
    </Box>

    <Box
      sx={{
        flex: 1, minWidth: 0, bgcolor: '#fff', borderRadius: 3, px: 1.75, py: 1.5,
        boxShadow: '0 1px 3px rgba(16,24,40,.06)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Typography sx={{ flex: 1, fontSize: '0.95rem', fontWeight: 600, letterSpacing: '-0.2px', wordBreak: 'break-word' }}>
          {ev.title}
        </Typography>
        {ev.booking?.direction === 'return' && ev.kind === 'flight' && (
          <Chip size="small" label="חזור" sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#eef0fc', color: '#5568d3' }} />
        )}
        {onDelete && (
          <IconButton size="small" onClick={() => onDelete(ev.booking.id)} sx={{ mt: -0.5, mr: -0.5 }}>
            <DeleteIcon sx={{ fontSize: '1rem' }} />
          </IconButton>
        )}
      </Box>

      {ev.detail && (
        <Typography sx={{ mt: 0.5, fontSize: '0.85rem', color: '#444', wordBreak: 'break-word' }}>
          {ev.detail}
        </Typography>
      )}
      {ev.extra && (
        <Typography sx={{ mt: 0.75, fontSize: '0.75rem', color: 'text.disabled', wordBreak: 'break-word' }}>
          {ev.extra}
        </Typography>
      )}

      {/* סימון אמינות המיקום נשמר: מקום שלא אומת נראה על המפה בדיוק
          כמו מקום שאומת, ולכן ההבחנה חייבת להיאמר. */}
      {ev.booking?.unverified && (
        <Typography sx={{ mt: 0.75, fontSize: '0.72rem', color: 'warning.dark', fontWeight: 600 }}>
          ⚠️ המקום לא נמצא במאגר המפות
        </Typography>
      )}
    </Box>
  </Box>
);

const GapRow = ({ minutes }) => (
  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', my: 0.25 }}>
    <Box sx={{ width: 46, flexShrink: 0 }} />
    <Box sx={{ width: 32, display: 'flex', justifyContent: 'center', flexShrink: 0, color: '#c9cdda' }}>
      <svg width="10" height="14" viewBox="0 0 10 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M5 1v11M1.5 8.5 5 12l3.5-3.5" />
      </svg>
    </Box>
    <Typography sx={{ fontSize: '0.72rem', color: '#a0a4b5' }}>{humanGap(minutes)}</Typography>
  </Box>
);

const TripTimeline = ({ bookings = [], onDelete }) => {
  const days = buildTimeline(bookings);
  if (!days.length) return null;

  return (
    <Box>
      {days.map((day, i) => {
        const skipped = i === 0 ? 0 : daysBetween(days[i - 1].date, day.date) - 1;

        // המספור נבנה מהרשימה שהמפה עצמה מציירת, ולא מסינון מקביל:
        // המפה פוסלת גם קואורדינטה פגומה, ומספור נפרד היה מעניק מספר
        // לשורה שאין לה נקודה על המפה.
        const numbers = new Map();
        const mapped = groundPoints(day.events);
        if (mapped.length >= 2) mapped.forEach((p, n) => numbers.set(p.ev, n + 1));

        return (
          <React.Fragment key={day.dayKey}>
            {skipped > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, my: 2 }}>
                <Box sx={{ flex: 1, height: '1px', bgcolor: '#e6e8f0' }} />
                <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>
                  {skipped === 1 ? 'יום אחד ללא הזמנות' : skipped === 2 ? 'יומיים ללא הזמנות' : `${skipped} ימים ללא הזמנות`}
                </Typography>
                <Box sx={{ flex: 1, height: '1px', bgcolor: '#e6e8f0' }} />
              </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mt: i === 0 ? 1 : 3, mb: 1.5, px: 0.25 }}>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: 'primary.dark', letterSpacing: '0.2px' }}>
                {dayLabel(day.date)}
              </Typography>
              <Box sx={{ flex: 1, height: '1px', bgcolor: '#e6e8f0' }} />
            </Box>

            <DayMiniMap events={day.events} />

            {/* הקו האנכי נמתח על כל היום ויושב מאחורי העיגולים */}
            <Box sx={{ position: 'relative' }}>
              <Box
                sx={{
                  position: 'absolute', top: 14, bottom: 14, right: 62,
                  width: '2px', bgcolor: '#e6e8f0',
                }}
              />
              {day.events.map((ev, j) => (
                <React.Fragment key={`${ev.kind}-${ev.booking?.id || j}`}>
                  {ev.gapBefore != null && ev.gapBefore >= 30 && <GapRow minutes={ev.gapBefore} />}
                  <EventRow ev={ev} onDelete={onDelete} mapNumber={numbers.get(ev)} />
                </React.Fragment>
              ))}
            </Box>
          </React.Fragment>
        );
      })}
    </Box>
  );
};

export default TripTimeline;
