import React, { useMemo } from 'react';
import { Box, Chip, Typography, Grow } from '@mui/material';
import { buildTimeline, humanGap } from '../../services/tripTimelineService';

/**
 * ההדגמה שאורח רואה לפני שמבקשים ממנו משהו.
 *
 * ── למה זה כאן ──
 * דף הבית הסביר במילים תשע תכונות, ולא הראה ולו אחת. מבקר ראשון לא
 * יכול היה להבחין בין האפליקציה הזו לכל מתכנן טיולים אחר — **והדבר
 * שמייחד אותה, שהיא בונה את המסלול מהמיילים לבד, לא הופיע בדף כלל.**
 * הוא הוסתר מאחורי התחברות ל-Gmail, ואיש אינו נותן גישה לתיבה שלו
 * לאפליקציה שהוא רואה שמונה שניות.
 *
 * ── שני כללים שנשמרים כאן בקפדנות ──
 * 1. **הנתונים מסומנים כדוגמה.** הם מומצאים, וזה מותר רק כשזה נאמר
 *    במפורש ובלי אותיות קטנות. הפרויקט אוסר להציג ערך מומצא כנתון של
 *    המשתמש; דוגמה מסומנת אינה אותו דבר.
 * 2. **הם אינם נוגעים במאגר.** אין כתיבה ל-localStorage ואין
 *    `addBookings`. ההדגמה חיה בזיכרון הרכיב ומתה איתו.
 *
 * ── למה היא פתוחה, ולמה היא בתוך ה-Hero ──
 * הגרסה הראשונה הייתה מכווצת ויושבת מתחת ל-Hero, כדי לחסוך גובה. זו
 * הייתה אופטימיזציה למדד הלא נכון: המשתמש דיווח שגם למי שמכיר את
 * האפליקציה לקח כמה שניות להבחין בה. הדבר שאמור לעצור מבקר לא היה
 * על המסך כלל — הוא היה מאחורי לחיצה, בגופן 1rem, מתחת לכותרת של
 * 3.5rem על רקע סגול רווי.
 *
 * מסקנה: אין טעם להתחרות ב-Hero על תשומת לב. ההדגמה **היא** ה-Hero,
 * והכרטיסים הלבנים על הסגול הם מה שמייצר את הניגוד.
 *
 * ── ומה שאינו מומצא ──
 * הציר עצמו. `buildTimeline` ו-`humanGap` הן אותן פונקציות שמזינות את
 * מסך פרטי הנסיעה — כולל הפער שנמדד מהנחיתה ולא מההמראה, שתוקן היום.
 * כלומר מה שמוצג כאן הוא **המנוע האמיתי על קלט לדוגמה**, ולא ציור של
 * מסך. אם המנוע ישתנה, ההדגמה תשתנה איתו — וזו בדיוק הנקודה.
 */

/** ארבעה אישורים כפי שהם מגיעים לתיבה — נפרדים, בלי סדר, בלי הקשר. */
const SAMPLE_EMAILS = [
  { icon: '✈️', subject: 'אישור טיסה', line: 'TLV → NAP · 10 באוקטובר' },
  { icon: '🏨', subject: 'אישור לינה', line: '4 לילות בנאפולי' },
  { icon: '🍽️', subject: 'הזמנת שולחן', line: 'ל-4 סועדים, 20:30' },
  { icon: '🎟️', subject: 'כרטיס לאטרקציה', line: 'סיור בהר וזוב' },
];

/** מה שהמפענח מחלץ מהם. אותו מבנה בדיוק שהמאגר האמיתי מחזיק. */
const SAMPLE_BOOKINGS = [
  {
    id: 'demo-flight', type: 'flight', flightNumber: 'LY 5111', airline: 'El Al',
    date: '2026-10-10', departureTime: '15:00', arrivalTime: '17:15',
    departureAirport: 'TLV', arrivalAirport: 'NAP',
  },
  {
    id: 'demo-hotel', type: 'hotel', name: 'Caruso Place',
    checkIn: '2026-10-10', checkOut: '2026-10-14', address: 'Via Toledo, נאפולי',
  },
  {
    id: 'demo-restaurant', type: 'restaurant', name: 'Ieri, Oggi, Domani',
    date: '2026-10-10', time: '20:30', guests: 4, location: 'Via Nazionale 6, נאפולי',
  },
  {
    id: 'demo-activity', type: 'activity', name: 'סיור בהר וזוב',
    date: '2026-10-11', time: '10:00', location: 'Vesuvio', guests: 4,
  },
];

const DemoItinerary = () => {
  // הציר נבנה פעם אחת, ודרך אותה פונקציה שמזינה את המסך האמיתי.
  const days = useMemo(() => buildTimeline(SAMPLE_BOOKINGS), []);

  // כרטיס לבן על הסגול. הניגוד הוא כל הרעיון, ולכן הוא מוגדר פעם אחת.
  const paper = {
    bgcolor: 'rgba(255,255,255,0.97)',
    color: 'text.primary',
    borderRadius: 2.5,
    boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
  };

  return (
    <Box sx={{ mt: { xs: 2, md: 2.5 }, mb: { xs: 1.5, md: 2 } }}>
      <Box sx={{
        display: 'flex', gap: { xs: 1.25, md: 2.5 },
        alignItems: 'stretch', justifyContent: 'center', flexWrap: 'nowrap',
      }}>

        {/* ── מה שהגיע לתיבה ── */}
        <Box sx={{ flex: '0 1 200px', minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, opacity: 0.85, mb: 0.75, textAlign: 'start' }}>
            מה שהגיע לתיבה
          </Typography>
          {SAMPLE_EMAILS.map((m, i) => (
            <Grow in timeout={500} style={{ transitionDelay: `${150 + i * 110}ms` }} key={m.subject}>
              <Box sx={{ ...paper, p: { xs: 0.85, md: 1.15 }, mb: 0.75, display: 'flex', gap: 1, alignItems: 'center' }}>
                <Box sx={{ fontSize: { xs: '0.95rem', md: '1.05rem' } }}>{m.icon}</Box>
                <Box sx={{ minWidth: 0, textAlign: 'start' }}>
                  <Typography noWrap sx={{ fontSize: { xs: '0.7rem', md: '0.78rem' }, fontWeight: 700, lineHeight: 1.25 }}>
                    {m.subject}
                  </Typography>
                  <Typography noWrap sx={{ fontSize: { xs: '0.62rem', md: '0.68rem' }, color: 'text.secondary' }}>
                    {m.line}
                  </Typography>
                </Box>
              </Box>
            </Grow>
          ))}
        </Box>

        {/* ── החץ: הרגע שבו הדבר קורה ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <Box sx={{
            fontSize: { xs: '1.4rem', md: '2rem' }, fontWeight: 300, lineHeight: 1,
            // פעימה אחת ומתונה. תנועה מושכת עין; תנועה בלי סוף מעייפת.
            animation: 'demoFlow 2.6s ease-in-out infinite',
            '@keyframes demoFlow': {
              '0%, 100%': { transform: 'translateX(0)', opacity: 0.55 },
              '50%': { transform: 'translateX(-6px)', opacity: 1 },
            },
          }}>
            ←
          </Box>
        </Box>

        {/* ── והמסלול שיצא ── */}
        <Box sx={{ flex: '1 1 340px', minWidth: 0, maxWidth: 460 }}>
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, opacity: 0.85, mb: 0.75, textAlign: 'start' }}>
            המסלול שנבנה מהם — לבד
          </Typography>

          {days.slice(0, 1).map((day) => (
            <Box key={day.dayKey}>
              <Chip
                label={new Date(day.date).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'numeric' })}
                size="small"
                sx={{ mb: 0.75, fontSize: '0.65rem', fontWeight: 700,
                  bgcolor: 'rgba(255,255,255,0.25)', color: 'white', backdropFilter: 'blur(6px)' }}
              />
              {day.events.map((ev, i) => (
                <Grow in timeout={550} style={{ transitionDelay: `${620 + i * 160}ms` }} key={`${ev.kind}-${i}`}>
                  <Box>
                    {/* הפער מגיע מ-`humanGap` ולא מחישוב מקומי: הוא כבר יודע
                        שהוא נמדד מהנחיתה ולא מההמראה. */}
                    {ev.gapBefore != null && ev.gapBefore >= 30 && (
                      <Typography sx={{ fontSize: '0.62rem', opacity: 0.8, textAlign: 'center', my: 0.25 }}>
                        ↓ {humanGap(ev.gapBefore)}
                      </Typography>
                    )}
                    <Box sx={{ ...paper, p: { xs: 0.85, md: 1.15 }, mb: 0.6, display: 'flex', gap: 1, alignItems: 'flex-start', textAlign: 'start' }}>
                      <Box sx={{ width: 40, flexShrink: 0, fontSize: { xs: '0.68rem', md: '0.75rem' }, fontWeight: 800, color: 'text.secondary', pt: 0.2 }}>
                        {ev.allDay ? '' : `${String(ev.at.getHours()).padStart(2, '0')}:${String(ev.at.getMinutes()).padStart(2, '0')}`}
                      </Box>
                      <Box sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>{ev.icon}</Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography noWrap sx={{ fontSize: { xs: '0.74rem', md: '0.82rem' }, fontWeight: 700, lineHeight: 1.25 }}>
                          {ev.title}
                        </Typography>
                        {ev.detail && (
                          <Typography noWrap sx={{ fontSize: { xs: '0.63rem', md: '0.7rem' }, color: 'text.secondary' }}>
                            {ev.detail}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Grow>
              ))}
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── האמירה שאסור להשמיט ──
          הנתונים כאן מומצאים. זה נאמר בגוף ההדגמה ולא בהערת שוליים,
          כי דוגמה שאינה מסומנת היא בדיוק הדבר שהפרויקט אוסר. */}
      <Typography sx={{ mt: 1, fontSize: '0.65rem', opacity: 0.75, textAlign: 'center' }}>
        נסיעה לדוגמה · הנתונים אינם אמיתיים ואינם נשמרים · הציר מחושב במנוע האמיתי
      </Typography>
    </Box>
  );
};

export default DemoItinerary;
