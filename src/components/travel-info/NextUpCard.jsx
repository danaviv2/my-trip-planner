import React, { useEffect, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { buildTimeline, nextEvent, humanGap } from '../../services/tripTimelineService';

/**
 * הדבר הבא בתור.
 *
 * כשאתה בדרך, רשימה של אחת-עשרה הזמנות אינה עוזרת — מעניין דבר אחד: מה
 * קורה עכשיו, ואיך מגיעים לשם. הכרטיס הזה עונה על שתי השאלות בלי גלילה.
 *
 * ── מתי הוא מופיע ──
 * רק כשהאירוע הבא בתוך 48 שעות. אירוע בעוד חודשיים אינו "הבא בתור" אלא
 * רעש, וכרטיס שמופיע תמיד מאבד את המשמעות שלו בדיוק ביום שבו הוא נחוץ.
 */

const HORIZON_MS = 48 * 3600 * 1000;

/**
 * האירוע הקרוב מכל הנסיעות הקרובות.
 *
 * ההזמנות מאוחדות לציר אחד במקום להשוות בין צירים: הסדר בתוך יום נקבע
 * גם לפי משמעות האירוע ולא רק לפי שעה, והשוואה בין רשימות נפרדות הייתה
 * מאבדת אותו.
 */
const findNext = (trips, now) => {
  const all = trips.flatMap((t) => t.bookings || []);
  return nextEvent(buildTimeline(all), now);
};

/**
 * ניסוח הזמן שנותר.
 *
 * אירוע בלי שעה מדויקת אינו מקבל ספירה לאחור: "בעוד 14 שעות" לכניסה
 * למלון שאין לה שעה הוא מספר מדויק שנשען על ניחוש.
 */
const whenText = (ev, now) => {
  if (ev.allDay) {
    const days = Math.round((ev.at - now) / 86400000);
    if (days <= 0) return 'היום';
    return days === 1 ? 'מחר' : `בעוד ${humanGap(days * 24 * 60)}`;
  }
  const mins = Math.round((ev.at - now) / 60000);
  if (mins <= 0) return 'עכשיו';
  if (mins < 60) return `בעוד ${humanGap(mins)}`;
  return `בעוד ${humanGap(mins)}`;
};

const NextUpCard = ({ trips = [] }) => {
  // הכרטיס מדבר בזמן, ולכן הוא חייב להתעדכן בלי רענון.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const ev = findNext(trips, now);
  if (!ev || ev.at - now > HORIZON_MS) return null;

  const target = ev.place || ev.detail || ev.title;
  const mapsUrl = ev.coords
    ? `https://maps.google.com/maps?daddr=${ev.coords.lat},${ev.coords.lng}`
    : target
    ? `https://maps.google.com/maps?daddr=${encodeURIComponent(target)}`
    : null;

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #5568d3 0%, #764ba2 100%)',
        borderRadius: 4, p: 2.25, mb: 2, color: '#fff',
        boxShadow: '0 6px 20px rgba(102,126,234,.28)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9, fontSize: '0.75rem', opacity: 0.82, fontWeight: 500 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
        הבא בתור · {whenText(ev, now)}
      </Box>

      <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'flex-start', gap: 1.6 }}>
        <Box
          sx={{
            width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
            bgcolor: 'rgba(255,255,255,.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
          }}
        >
          {ev.icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.3px', lineHeight: 1.25, wordBreak: 'break-word' }}>
            {ev.title}
          </Typography>
          <Typography sx={{ mt: 0.75, fontSize: '0.875rem', opacity: 0.9, wordBreak: 'break-word' }}>
            {!ev.allDay && `${String(ev.at.getHours()).padStart(2, '0')}:${String(ev.at.getMinutes()).padStart(2, '0')}`}
            {!ev.allDay && ev.detail ? ' · ' : ''}
            {ev.detail}
          </Typography>
          {ev.extra && (
            <Typography sx={{ mt: 0.5, fontSize: '0.78rem', opacity: 0.75 }}>{ev.extra}</Typography>
          )}
        </Box>
      </Box>

      {mapsUrl && (
        <Button
          fullWidth
          onClick={() => window.open(mapsUrl, '_blank', 'noopener,noreferrer')}
          sx={{
            mt: 2, py: 1.1, color: '#fff', fontWeight: 600, fontSize: '0.85rem',
            bgcolor: 'rgba(255,255,255,.16)', borderRadius: 2.5,
            '&:hover': { bgcolor: 'rgba(255,255,255,.26)' },
          }}
          startIcon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11 22 2l-9 19-2-8-8-2z" />
            </svg>
          }
        >
          נווט לשם
        </Button>
      )}

      {/* מיקום שלא אומת מסומן גם כאן: ניווט לנקודה שגויה בדרך לשדה
          התעופה גרוע במידה ניכרת מהיעדר כפתור ניווט. */}
      {ev.coords?.unverified && (
        <Typography sx={{ mt: 1, fontSize: '0.72rem', opacity: 0.8 }}>
          הכתובת אותרה לפי הרחוב ולא לפי שם המקום — ודא לפני שתצא.
        </Typography>
      )}
    </Box>
  );
};

export default NextUpCard;
