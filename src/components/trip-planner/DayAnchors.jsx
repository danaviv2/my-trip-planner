import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { anchorsForDay } from '../../services/tripAnchorsService';

/**
 * מה שכבר סגור ליום הזה.
 *
 * ── למה זה כאן ──
 * מתכנן המסלול לא ידע שההזמנות קיימות. לא "לא הציג" — לא ידע. לכן הוא
 * יכול היה לתכנן מוזיאון ב-15:00 בצד השני של העיר כשיש כרטיס לווזוב
 * ב-15:40, כלומר לתכנן את הפספוס.
 *
 * ── למה רצועה נפרדת ולא שילוב ברשימה ──
 * שתי סיבות, ושתיהן חשובות. הראשונה מבנית: החצים והמחיקה ברשימה עובדים
 * לפי אינדקס, ושתילת פריטים ביניהם הייתה מזיזה את כולם. השנייה עקרונית:
 * הזמנה היא התחייבות ששולם עליה, ופעילות מתוכננת היא כוונה. הצגתן כשוות
 * הייתה גורמת לכוונה להיראות מחייבת — ולהיפך, וזה מסוכן יותר.
 *
 * ── מה לא קורה כאן ──
 * שום דבר לא מועתק. ההזמנה נשארת הבעלים היחיד, והרצועה קוראת אותה בזמן
 * התצוגה. ביטול הכרטיס מסיר את העוגן מעצמו, בלי סנכרון שעלול להיכשל.
 */

/** משך בדקות מהצורות שהמודל מחזיר: "2h", "1h30m", "90m". */
const durationMinutes = (raw) => {
  const s = String(raw || '').toLowerCase();
  const h = /(\d+)\s*h/.exec(s);
  const m = /(\d+)\s*m/.exec(s);
  if (!h && !m) return null;
  return (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0);
};

const minutesOf = (t) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(t || '').trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

/**
 * פעילויות מתוכננות שרצות על גבי עוגן.
 *
 * זה החלק שבאמת מונע את הפספוס: להראות את הכרטיס זה חצי, לומר שהתוכנית
 * דורסת אותו זה החצי השני. חישוב רק כששני הצדדים נושאים שעה — התנגשות
 * שנגזרת ממשך משוער היא ניחוש שנראה כמו אזהרה.
 */
export const clashesWith = (anchor, activities = []) => {
  const a = minutesOf(anchor.time);
  if (a == null) return [];

  return (activities || []).filter((act) => {
    const start = minutesOf(act.time);
    if (start == null) return false;
    const len = durationMinutes(act.duration);
    // בלי משך ידוע נבדקת חפיפה של השעה עצמה בלבד
    const end = len == null ? start : start + len;
    return a >= start && a < Math.max(end, start + 1);
  });
};

const DayAnchors = ({ bookings = [], dayKey, activities = [] }) => {
  const anchors = anchorsForDay(bookings, dayKey);
  if (!anchors.length) return null;

  return (
    <Box
      sx={{
        mb: 2, p: 1.5, borderRadius: 3,
        bgcolor: '#f4f6fb', border: '1px solid #e0e5f2',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.25 }}>
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#4b5468' }}>
          🎟️ כבר סגור ליום הזה
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled' }}>
          מפרטי הנסיעה
        </Typography>
      </Box>

      {anchors.map((a) => {
        const clash = clashesWith(a, activities);

        return (
          <Box key={`${a.bookingId}-${a.kind}`} sx={{ mb: 0.75, '&:last-of-type': { mb: 0 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  bgcolor: `${a.color}1a`, fontSize: '0.85rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {a.icon}
              </Box>

              <Typography
                sx={{
                  width: 42, flexShrink: 0, fontSize: '0.8rem', fontWeight: 700,
                  color: a.time ? 'text.primary' : 'text.disabled',
                }}
              >
                {a.time || '—'}
              </Typography>

              <Typography
                sx={{
                  flex: 1, minWidth: 0, fontSize: '0.82rem', fontWeight: 600,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
              >
                {a.title}
              </Typography>

              {clash.length > 0 && (
                <Chip
                  size="small"
                  label="התנגשות"
                  sx={{ height: 19, fontSize: '0.62rem', fontWeight: 700, bgcolor: '#fdecea', color: '#b3261e', flexShrink: 0 }}
                />
              )}
            </Box>

            {/* האזהרה נוקבת בשם הפעילות. "יש התנגשות" מחייב את המשתמש
                לחפש אותה בעצמו, וזה בדיוק מה שהוא לא יעשה. */}
            {clash.length > 0 && (
              <Typography sx={{ mt: 0.4, mr: 4.6, fontSize: '0.72rem', color: '#b3261e' }}>
                מתנגש עם {clash.map((c) => `${c.time} ${c.name}`).join(' · ')}
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default DayAnchors;
