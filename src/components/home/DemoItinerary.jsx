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
      mt: { xs: 1.5, md: 2 }, mb: { xs: 1, md: 1.25 },
      p: { xs: 1.25, md: 1.25 },
      // ── רוחב, לא גובה ──
      // המלבן נמדד ב-1,138px על מסך 1280 — 89% מהרוחב — בעוד שדה
      // החיפוש שמתחתיו הוא 459px. הוא נראה כמו באנר שחוצה את הדף ולא
      // כמו כרטיס, ופי 2.5 מהאלמנט הבא אחריו. התקרה כאן מספיקה לשתי
      // העמודות (200 + חץ + 340) ומשאירה אותו ממורכז ומכוון.
      maxWidth: 720, mx: 'auto',
      borderRadius: 4,
      // מסגרת זכוכית: מפרידה את ההדגמה מהגרדיאנט בלי להוסיף עוד צבע,
      // ונותנת לכרטיסים הלבנים משטח לשבת עליו במקום לרחף.
      bgcolor: 'rgba(255,255,255,0.10)',
      border: '1px solid rgba(255,255,255,0.28)',
      backdropFilter: 'blur(8px)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
    }}>
      {/* ── שתי עמודות בדסקטופ, טור בנייד ──
          `nowrap` בשתי עמודות על מסך 375px כיווץ כל כרטיס מייל ל-50px:
          "אישור טי…", "הזמנת …". נמדד במכשיר מדומה ולא הוערך. בנייד
          המיילים נעשים שורה אחת של ארבע גלולות, והחץ מצביע מטה. */}
      <Box sx={{
        display: 'flex', gap: { xs: 1, md: 2.5 },
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: 'stretch' },
        justifyContent: 'center', flexWrap: 'nowrap',
      }}>

        {/* ── מה שהגיע לתיבה: גלוי תמיד, זה ה"לפני" ── */}
        <Box sx={{ flex: { xs: '0 0 auto', md: '0 1 200px' }, minWidth: 0 }}>
          {/* התוויות נושאות את כל הנרטיב — "מה נכנס" מול "מה יצא" — והיו
              ב-0.68rem, קטנות מהטקסט בתוך הכרטיסים שהן מכותרות. */}
          <Typography sx={{
            fontSize: { xs: '0.78rem', md: '0.88rem' }, fontWeight: 800, mb: 1,
            textAlign: 'start', letterSpacing: '0.01em',
            textShadow: '0 1px 6px rgba(0,0,0,0.25)',
          }}>
            מה שהגיע לתיבה
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, gap: { xs: 0.6, md: 0 } }}>
          {SAMPLE_EMAILS.map((m, i) => (
            <Grow in timeout={500} style={{ transitionDelay: `${150 + i * 110}ms` }} key={m.subject}>
              {/* ── שורה אחת, לא שתיים ──
                  הכרטיס היה 47px ואַרבעה מהם קבעו למלבן רצפה של 188px.
                  הנושא והפרט יושבים עכשיו באותה שורה, והכרטיס ירד לכ-32px
                  בלי לוותר על מידע. בנייד הפרט יורד ממילא — ברוחב 87px
                  הוא נחתך, וקידומת חתוכה גרועה משורה שאינה קיימת. */}
              <Box sx={{
                ...paper, mb: { xs: 0, md: 0.5 }, flex: { xs: 1, md: 'none' }, minWidth: 0,
                px: { xs: 0.7, md: 1 }, py: { xs: 0.7, md: 0.55 },
                display: 'flex', gap: { xs: 0.4, md: 0.85 },
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: 'center', textAlign: { xs: 'center', md: 'start' },
              }}>
                <Box sx={{ fontSize: { xs: '1rem', md: '0.95rem' }, lineHeight: 1 }}>{m.icon}</Box>
                <Typography noWrap sx={{ fontSize: { xs: '0.6rem', md: '0.74rem' }, fontWeight: 700, lineHeight: 1.25, minWidth: 0 }}>
                  {m.subject}
                </Typography>
                <Typography noWrap sx={{
                  fontSize: '0.66rem', color: 'text.secondary', minWidth: 0,
                  display: { xs: 'none', md: 'block' },
                }}>
                  · {m.line}
                </Typography>
              </Box>
            </Grow>
          ))}
          </Box>
        </Box>

        {/* ── החץ: פועם רק כל עוד לא לחצו, ואז נרגע ── */}
        {/* הסיבוב יושב על העוטף והאנימציה על הפנימי, ולא שניהם על אותו
            אלמנט: `transform` הוא מאפיין אחד, וה-keyframes שמזיזים את
            החץ דרסו את ה-`rotate` בשקט. נמדד — `matrix(1,0,0,1,-1.1,0)`,
            הזזה בלי סיבוב — ולא נראה בעין. */}
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          // ‎-90° ולא 90°: החץ ‎←‎ פונה מערבה, וסיבוב עם כיוון השעון היה
          // מפנה אותו צפונה. נמדד על המסך אחרי שהסיבוב כבר חל.
          transform: { xs: 'rotate(-90deg)', md: 'none' },
        }}>
          <Box sx={{
            fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 300, lineHeight: 1,
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
        {/* ── `flex-basis` בטור הוא גובה, לא רוחב ──
            `1 1 340px` בפריסת נייד (flexDirection: column) קבע לטור גובה
            של 340px, ומכאן מלבן זכוכית ריק מתחת לכפתור. בדסקטופ, שבו
            הכיוון row, אותו ערך הוא הרוחב הרצוי. */}
        <Box sx={{
          flex: { xs: '0 0 auto', md: '1 1 340px' },
          minWidth: 0, maxWidth: { xs: '100%', md: 460 },
          display: 'flex', flexDirection: 'column',
        }}>
          <Typography sx={{
            fontSize: { xs: '0.78rem', md: '0.88rem' }, fontWeight: 800, mb: 1,
            textAlign: 'start', letterSpacing: '0.01em',
            textShadow: '0 1px 6px rgba(0,0,0,0.25)',
          }}>
            {built ? 'המסלול שנבנה מהם — לבד' : 'ומה שהאפליקציה עושה מזה'}
          </Typography>

          {/* ── הכפתור: ההזמנה לראות את זה קורה ──
              יושב במקום שבו המסלול יופיע, ולכן הלחיצה נראית כמו הפעולה
              שבנתה אותו ולא כמו פתיחת מגירה. */}
          {!built && (
            <Box sx={{
              // `flex: 1` מותח את העוטף לגובה הטור בנייד — נמדד 313px
              // לכפתור בן 48. בדסקטופ הוא נחוץ כדי למרכז אותו בשטח
              // ששמור למסלול.
              flex: { xs: 'none', md: 1 },
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              // הגובה שמור רק בדסקטופ, כדי שהמעבר לכפתור⟵מסלול לא יקפיץ
              // את הדף. בנייד הוא יצר חלל ריק של 140px מתחת לתווית.
              minHeight: { xs: 0, md: 132 }, py: { xs: 1.5, md: 0 },
            }}>
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
                    <Box sx={{ ...paper, px: { xs: 0.85, md: 1 }, py: { xs: 0.7, md: 0.55 }, mb: 0.5, display: 'flex', gap: 0.85, alignItems: 'center', textAlign: 'start' }}>
                      <Box sx={{ width: 40, flexShrink: 0, fontSize: { xs: '0.68rem', md: '0.75rem' }, fontWeight: 800, color: 'text.secondary', pt: 0.2 }}>
                        {ev.allDay ? '' : `${String(ev.at.getHours()).padStart(2, '0')}:${String(ev.at.getMinutes()).padStart(2, '0')}`}
                      </Box>
                      <Box sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>{ev.icon}</Box>
                      <Box sx={{ minWidth: 0, display: 'flex', gap: 0.7, alignItems: 'baseline' }}>
                        <Typography noWrap sx={{ fontSize: { xs: '0.74rem', md: '0.78rem' }, fontWeight: 700, lineHeight: 1.3 }}>
                          {ev.title}
                        </Typography>
                        {ev.detail && (
                          <Typography noWrap sx={{ fontSize: { xs: '0.63rem', md: '0.68rem' }, color: 'text.secondary', minWidth: 0 }}>
                            · {ev.detail}
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
