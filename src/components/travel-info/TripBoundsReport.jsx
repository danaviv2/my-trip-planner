import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { normalizeBooking } from '../../services/tripGroupingService';
import { identifyReference, referenceConflict } from '../../services/referenceIdentityService';
import { contradictions, crossContradictions } from '../../services/bookingConsistencyService';

/**
 * למה נסיעה מתחילה ונגמרת מתי שהיא נגמרת.
 *
 * ── למה זה קיים ──
 * פריט שנוסף ל-26.8 נשאר בתוך נסיעה שהסתיימה ב-5.7. שוחזרה השערה
 * (פוליסת ביטוח עם תוקף רחב), תוקנה, ונפרסה — והמסך לא השתנה. כלומר
 * ההשערה הייתה שגויה, ולא היה שום נתון שיצביע על הנכונה.
 *
 * הדפוס הזה חזר כאן פעמים רבות: ניחוש מצילום מסך נכשל, וכלי מדידה מצא
 * את הסיבה בדקות. הדוח מציג בדיוק את מה שחסר — איזה פריט קובע כל גבול
 * של כל נסיעה, ומה טווח התאריכים של כל פריט.
 *
 * מוסתר עד לחיצה, כדי שלא יהיה רעש במסך רגיל.
 */

const fmt = (d) =>
  d instanceof Date && !isNaN(d)
    ? `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`
    : '—';

const TripBoundsReport = ({ trips = [] }) => {
  const [open, setOpen] = useState(false);

  if (!trips.length) return null;

  const lines = [];
  trips.forEach((trip) => {
    const raw = trip.bookings || [];
    const items = raw.map(normalizeBooking);
    const dated = items.filter((x) => x.start);

    const first = dated.reduce((min, x) => (!min || x.start < min.start ? x : min), null);
    const last = dated.reduce((max, x) => {
      const e = x.end || x.start;
      const me = max ? max.end || max.start : null;
      return !max || e > me ? x : max;
    }, null);

    lines.push(`■ ${trip.destination || '—'}  ${trip.startDate || '—'} → ${trip.endDate || '—'}${trip.undated ? '  [ללא תאריכים]' : ''}`);
    lines.push(`   פותח:  ${first ? `${first.type} · ${fmt(first.start)} · ${String(first.title).slice(0, 24)}` : '—'}`);
    lines.push(`   סוגר:  ${last ? `${last.type} · ${fmt(last.end || last.start)} · ${String(last.title).slice(0, 24)}` : '—'}`);
    items.forEach((x, i) => {
      lines.push(`     · ${String(x.type).padEnd(11)} ${fmt(x.start)}–${fmt(x.end || x.start)}  ${String(x.title).slice(0, 26)}`);

      // מה שהאסמכתה מסגירה על עצמה, וסתירה בינה לבין הסוג שנשמר.
      // רוב האסמכתאות אינן ניתנות לזיהוי — לרוב הספקים אין תבנית
      // ייחודית — ושתיקה כאן היא התשובה הנכונה, לא פער.
      const src = raw[i];
      const id = identifyReference(src && src.confirmationNumber);
      if (id) lines.push(`         ↳ אסמכתה: ${id.vendor} · ${id.why}`);
      const clash = referenceConflict(src);
      if (clash) lines.push(`         ⚠ ${clash}`);
      // סתירה פנימית — השדות אינם מסכימים זה עם זה. זו המחלקה שנעדרה
      // מכל הבדיקות הקודמות, שכולן שאלו רק "האם השדה קיים".
      contradictions(src).forEach((c) => lines.push(`         ⚠ ${c}`));
      if (src && src.contradiction) lines.push(`         ⚠ ${src.contradiction}`);
    });
    crossContradictions(raw).forEach((c) => lines.push(`   ⚠ ${c}`));
    lines.push('');
  });

  const text = lines.join('\n');

  return (
    <Box sx={{ mt: 2 }}>
      <Button size="small" onClick={() => setOpen((v) => !v)} sx={{ color: 'text.disabled', fontSize: '0.72rem' }}>
        {open ? 'הסתר אבחון' : 'אבחון: למה נסיעה מכילה את מה שהיא מכילה'}
      </Button>

      {open && (
        <Box
          component="pre"
          sx={{
            mt: 1, p: 1.25, bgcolor: '#f5f7fa', borderRadius: 2,
            fontSize: '0.62rem', lineHeight: 1.55, direction: 'ltr', textAlign: 'left',
            overflowX: 'auto', whiteSpace: 'pre', userSelect: 'text',
          }}
        >
          {text}
        </Box>
      )}

      {open && (
        <Typography sx={{ mt: 0.5, fontSize: '0.66rem', color: 'text.disabled' }}>
          "פותח" ו"סוגר" הם הפריטים שקובעים את גבולות הנסיעה. אם פריט שאינו שייך
          מופיע שם — זו הסיבה שדברים אחרים נבלעים פנימה.
        </Typography>
      )}
    </Box>
  );
};

export default TripBoundsReport;
