import React, { useMemo, useState } from 'react';
import { Box, Button, Card, Chip, Collapse, Typography, Fade } from '@mui/material';
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
  const [open, setOpen] = useState(false);

  // הציר נבנה פעם אחת, ודרך אותה פונקציה שמזינה את המסך האמיתי.
  const days = useMemo(() => buildTimeline(SAMPLE_BOOKINGS), []);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4, border: '1px solid', borderColor: 'divider',
        background: (t) => `linear-gradient(135deg, ${t.palette.primary.main}08, ${t.palette.secondary.main}10)`,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ p: { xs: 2, md: 2.5 }, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.3 }}>
            ארבעה מיילים נכנסו. מסלול אחד יצא.
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mt: 0.25 }}>
            בלי להקליד תאריך אחד — האפליקציה קוראת את אישורי ההזמנה ובונה את היום.
          </Typography>
        </Box>
        <Button
          variant={open ? 'text' : 'contained'}
          onClick={() => setOpen((v) => !v)}
          sx={{ borderRadius: 2.5, px: 3, minHeight: 44, whiteSpace: 'nowrap' }}
        >
          {open ? 'סגור' : 'תראה לי איך זה עובד'}
        </Button>
      </Box>

      <Collapse in={open} timeout={400} unmountOnExit>
        <Box sx={{ px: { xs: 2, md: 2.5 }, pb: { xs: 2, md: 2.5 } }}>
          <Box sx={{ display: 'flex', gap: { xs: 2, md: 3 }, flexWrap: 'wrap', alignItems: 'stretch' }}>

            {/* ── מה שהגיע ── */}
            <Box sx={{ flex: '1 1 240px', minWidth: 240 }}>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', mb: 1 }}>
                מה שהגיע לתיבה
              </Typography>
              {SAMPLE_EMAILS.map((m, i) => (
                <Fade in={open} timeout={300} style={{ transitionDelay: `${i * 90}ms` }} key={m.subject}>
                  <Box sx={{
                    display: 'flex', gap: 1.25, alignItems: 'center', mb: 0.75,
                    p: 1.25, borderRadius: 2, bgcolor: 'background.paper',
                    border: '1px solid', borderColor: 'divider',
                  }}>
                    <Box sx={{ fontSize: '1.1rem' }}>{m.icon}</Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.2 }}>
                        {m.subject}
                      </Typography>
                      <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                        {m.line}
                      </Typography>
                    </Box>
                  </Box>
                </Fade>
              ))}
            </Box>

            {/* ── ומה שיצא ── */}
            <Box sx={{ flex: '2 1 320px', minWidth: 280 }}>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', mb: 1 }}>
                המסלול שנבנה מהם
              </Typography>

              {days.map((day) => (
                <Box key={day.dayKey} sx={{ mb: 1.5 }}>
                  <Chip
                    label={new Date(day.date).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'numeric' })}
                    size="small"
                    sx={{ mb: 0.75, fontSize: '0.7rem', fontWeight: 600 }}
                  />
                  {day.events.map((ev, i) => (
                    <Fade in={open} timeout={350} style={{ transitionDelay: `${420 + i * 110}ms` }} key={`${ev.kind}-${i}`}>
                      <Box>
                        {/* הפער מגיע מ-`humanGap` ולא מחישוב מקומי: הוא כבר
                            יודע שהוא נמדד מהנחיתה ולא מההמראה. */}
                        {ev.gapBefore != null && ev.gapBefore >= 30 && (
                          <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', textAlign: 'center', my: 0.25 }}>
                            ↓ {humanGap(ev.gapBefore)}
                          </Typography>
                        )}
                        <Box sx={{
                          display: 'flex', gap: 1.25, alignItems: 'flex-start',
                          p: 1.25, borderRadius: 2, bgcolor: 'background.paper',
                          border: '1px solid', borderColor: 'divider', mb: 0.5,
                        }}>
                          <Box sx={{ width: 46, flexShrink: 0, fontSize: '0.78rem', fontWeight: 700, color: 'text.secondary', pt: 0.25 }}>
                            {ev.allDay ? '' : `${String(ev.at.getHours()).padStart(2, '0')}:${String(ev.at.getMinutes()).padStart(2, '0')}`}
                          </Box>
                          <Box sx={{ fontSize: '1rem' }}>{ev.icon}</Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.25 }}>
                              {ev.title}
                            </Typography>
                            {ev.detail && (
                              <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                                {ev.detail}
                              </Typography>
                            )}
                            {ev.extra && (
                              <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>
                                {ev.extra}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Fade>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>

          {/* ── האמירה שאסור להשמיט ──
              הנתונים כאן מומצאים. זה נאמר בגוף ההדגמה ולא בהערת שוליים,
              כי דוגמה שאינה מסומנת היא בדיוק הדבר שהפרויקט אוסר. */}
          <Typography sx={{ mt: 1, fontSize: '0.72rem', color: 'text.disabled', textAlign: 'center' }}>
            נסיעה לדוגמה · הנתונים אינם אמיתיים ואינם נשמרים · הציר עצמו מחושב במנוע האמיתי
          </Typography>
        </Box>
      </Collapse>
    </Card>
  );
};

export default DemoItinerary;
