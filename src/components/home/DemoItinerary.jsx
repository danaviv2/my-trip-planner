import React, { useMemo, useState } from 'react';
import { Box, Button, Chip, Typography, Grow, Fade } from '@mui/material';
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
 * ── ולמה בכל זאת יש כפתור ──
 * הגרסה השנייה הציגה הכל פתוח, והמשתמש העיר נכון: **הרגע שבו המסלול
 * נבנה מרשים יותר מהמסלול המוגמר.** לכן המיילים גלויים תמיד — הם
 * ה"לפני", והם מסקרנים בפני עצמם — והלחיצה בונה את ה"אחרי" מולך.
 * ההבדל מהגרסה הראשונה: שם הכל היה מוסתר ומתחת לקיפול, וכאן הצד
 * השמאלי הוא הזמנה גלויה לפעולה, בתוך ה-Hero.
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
  const [built, setBuilt] = useState(false);

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
    <Box sx={{
      mt: { xs: 2, md: 2.5 }, mb: { xs: 1.5, md: 2 },
      p: { xs: 1.5, md: 2 },
      borderRadius: 4,
      // מסגרת זכוכית: מפרידה את ההדגמה מהגרדיאנט בלי להוסיף עוד צבע,
      // ונותנת לכרטיסים הלבנים משטח לשבת עליו במקום לרחף.
      bgcolor: 'rgba(255,255,255,0.10)',
      border: '1px solid rgba(255,255,255,0.28)',
      backdropFilter: 'blur(8px)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
    }}>
      <Box sx={{
        display: 'flex', gap: { xs: 1.25, md: 2.5 },
        alignItems: 'stretch', justifyContent: 'center', flexWrap: 'nowrap',
      }}>

        {/* ── מה שהגיע לתיבה: גלוי תמיד, זה ה"לפני" ── */}
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

        {/* ── החץ: פועם רק כל עוד לא לחצו, ואז נרגע ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <Box sx={{
            fontSize: { xs: '1.4rem', md: '2rem' }, fontWeight: 300, lineHeight: 1,
            // תנועה מושכת עין; תנועה שממשיכה אחרי שהיא כבר עשתה את שלה
            // מעייפת. לכן היא נעצרת ברגע שהמסלול נבנה.
            animation: built ? 'none' : 'demoFlow 2.2s ease-in-out infinite',
            opacity: built ? 0.85 : 1,
            '@keyframes demoFlow': {
              '0%, 100%': { transform: 'translateX(0)', opacity: 0.5 },
              '50%': { transform: 'translateX(-7px)', opacity: 1 },
            },
          }}>
            ←
          </Box>
        </Box>

        {/* ── ומה שנבנה מהם ── */}
        <Box sx={{ flex: '1 1 340px', minWidth: 0, maxWidth: 460, display: 'flex', flexDirection: 'column' }}>
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, opacity: 0.85, mb: 0.75, textAlign: 'start' }}>
            {built ? 'המסלול שנבנה מהם — לבד' : 'ומה שהאפליקציה עושה מזה'}
          </Typography>

          {/* ── הכפתור: ההזמנה לראות את זה קורה ──
              יושב במקום שבו המסלול יופיע, ולכן הלחיצה נראית כמו הפעולה
              שבנתה אותו ולא כמו פתיחת מגירה. */}
          {!built && (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: { xs: 150, md: 190 } }}>
              <Button
                onClick={() => setBuilt(true)}
                sx={{
                  px: { xs: 3, md: 4 }, py: 1.4, minHeight: 48, borderRadius: 3,
                  fontSize: { xs: '0.9rem', md: '1rem' }, fontWeight: 800,
                  color: 'white', border: '2px solid rgba(255,255,255,0.9)',
                  bgcolor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
                  whiteSpace: 'nowrap',
                  animation: 'demoPulse 2.4s ease-in-out infinite',
                  '@keyframes demoPulse': {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,255,255,0.45)' },
                    '70%': { boxShadow: '0 0 0 14px rgba(255,255,255,0)' },
                  },
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                }}
              >
                ✨ תראה לי איך זה עובד
              </Button>
            </Box>
          )}

          {built && days.slice(0, 1).map((day) => (
            <Box key={day.dayKey}>
              <Fade in timeout={400}>
                <Chip
                  label={new Date(day.date).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'numeric' })}
                  size="small"
                  sx={{ mb: 0.75, fontSize: '0.65rem', fontWeight: 700,
                    bgcolor: 'rgba(255,255,255,0.25)', color: 'white', backdropFilter: 'blur(6px)' }}
                />
              </Fade>
              {day.events.map((ev, i) => (
                <Grow in timeout={600} style={{ transitionDelay: `${180 + i * 190}ms` }} key={`${ev.kind}-${i}`}>
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
          מוצגת רק אחרי הבנייה: לפניה אין עדיין נתונים על המסך, ואזהרה
          על מה שלא קיים היא רעש. */}
      {built && (
        <Fade in timeout={600} style={{ transitionDelay: '900ms' }}>
          <Typography sx={{ mt: 1, fontSize: '0.65rem', opacity: 0.75, textAlign: 'center' }}>
            נסיעה לדוגמה · הנתונים אינם אמיתיים ואינם נשמרים · הציר מחושב במנוע האמיתי
          </Typography>
        </Fade>
      )}
    </Box>
  );
};

export default DemoItinerary;
