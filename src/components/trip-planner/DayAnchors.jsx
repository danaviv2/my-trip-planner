import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { anchorsForDay } from '../../services/tripAnchorsService';
import { distanceKmExact } from '../../services/routeGeometryService';

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

/**
 * האם אי אפשר להספיק מהפעילות הקודמת אל העוגן.
 *
 * ── למה סף שמרני ──
 * ההערכה היא 60 קמ"ש בקו אווירי ועוד עשר דקות. זו מהירות שאי אפשר
 * להשיג בפועל — כבישים מתעקלים, יש חניה, ויש רגליים — ולכן אזהרה שכן
 * מופיעה מתארת מצב בלתי אפשרי ודאי, לא צפוף. אזהרה שגויה אחת מלמדת
 * להתעלם מכולן, וזה מבטל גם את הנכונות.
 *
 * @returns {{from, km, need, gap}|null}
 */
export const tooFarFrom = (anchor, activities = []) => {
  const target = minutesOf(anchor.time);
  if (target == null || !anchor.coords) return null;

  // הפעילות האחרונה שמסתיימת לפני העוגן ויש לה מיקום
  let prev = null;
  (activities || []).forEach((act) => {
    const start = minutesOf(act.time);
    const lat = Number(act.lat);
    const lng = Number(act.lng);
    if (start == null || start >= target) return;
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return;
    if (!prev || start > minutesOf(prev.time)) prev = act;
  });
  if (!prev) return null;

  const km = distanceKmExact(anchor.coords, { lat: Number(prev.lat), lng: Number(prev.lng) });
  if (km == null || km < 1) return null;

  const len = durationMinutes(prev.duration) || 0;
  const gap = target - (minutesOf(prev.time) + len);
  const need = Math.round(km + 10);

  return gap < need ? { from: prev, km, need, gap } : null;
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
        const far = tooFarFrom(a, activities);

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

              {(clash.length > 0 || far) && (
                <Chip
                  size="small"
                  label={clash.length > 0 ? 'התנגשות' : 'זמן נסיעה'}
                  sx={{
                    height: 19, fontSize: '0.62rem', fontWeight: 700, flexShrink: 0,
                    bgcolor: clash.length > 0 ? '#fdecea' : '#fff5d6',
                    color: clash.length > 0 ? '#b3261e' : '#8a6d00',
                  }}
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

            {/* מרחק. מוצג רק כשההגעה בלתי אפשרית ודאית, ולא כשהיא צפופה. */}
            {clash.length === 0 && far && (
              <Typography sx={{ mt: 0.4, mr: 4.6, fontSize: '0.72rem', color: '#8a6d00' }}>
                מ״{far.from.name}״ {Math.round(far.km)} ק״מ · נשארו {Math.max(far.gap, 0)} דק׳,
                {' '}וצריך לפחות {far.need}
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default DayAnchors;
