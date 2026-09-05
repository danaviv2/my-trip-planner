import React, { useMemo } from 'react';
import { Box, Card, Chip, Typography, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { buildTimeline } from '../../services/tripTimelineService';

/**
 * הנסיעה הקרובה, בראש דף הבית.
 *
 * ── הבעיה שזה פותר ──
 * דף הבית לא ידע דבר על המשתמש. הפריט "אפס הפניות לנתוני המשתמש" נסגר
 * בכך ש-`NextUpCard` נוסף — אבל הוא מחזיר `null` אלא אם האירוע הבא בתוך
 * 48 שעות. נמדד ב-05.09.2026: נזרעה טיסה בעוד 35 ימים, מלון ומסעדה,
 * והדף לא השתנה בבית אחד. כלומר 99% מהזמן דף הבית של מי שיש לו נסיעה
 * זהה לדף של מי שאין לו.
 *
 * `NextUpCard` נשאר כשהוא — "הבא בתור" **צריך** להיות על משהו מיידי.
 * זה רכיב אחר, עם אופק אחר: כל עוד יש נסיעה שלא נגמרה.
 *
 * ── מה מוצג, ומה במכוון לא ──
 * כל מספר כאן נגזר מההזמנות ואינו מוערך. הפיתוי היה להוסיף "חסרה טיסת
 * חזור" או "לא מומלץ בלי ביטוח", ושניהם נדחו: נסיעה בכיוון אחד היא
 * בחירה לגיטימית, וביטוח נרכש לעיתים מחוץ לאפליקציה. אזהרה שגויה אחת
 * מלמדת להתעלם מכולן, וזו החלטה שכבר כתובה בפרויקט.
 *
 * מה שכן ודאי ולכן מוצג: כמה ימים בנסיעה אין בהם ולו פריט אחד. זו
 * עובדה על הנתונים, והיא גם הדבר היחיד כאן שמוביל לפעולה.
 */

/** מספר הימים הקלנדריים בין שני מפתחות `YYYY-MM-DD`. */
const daysBetweenKeys = (aKey, bKey) => {
  const [y1, m1, d1] = String(aKey).split('-').map(Number);
  const [y2, m2, d2] = String(bKey).split('-').map(Number);
  if (!y1 || !y2) return null;
  // Date.UTC ולא בנייה מקומית: מעבר שעון קיץ הופך יממה ל-23 או 25 שעות,
  // וחישוב על חותמות זמן החזיר 1 עבור 33 שעות. זו בדיוק הטעות שתוקנה
  // ב-`TripTimeline` באותו יום.
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
};

const todayKey = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};

/**
 * הנסיעה שרלוונטית עכשיו: זו שבעיצומה, ואם אין — הקרובה שטרם התחילה.
 * נסיעה שהסתיימה אינה מועמדת, וכך גם קבוצה בלי תאריכים.
 */
export const pickTrip = (trips = []) => {
  const today = todayKey();
  const dated = trips.filter((t) => t && t.startDate && t.endDate && !t.undated);

  const live = dated.filter((t) => t.startDate <= today && t.endDate >= today);
  if (live.length) return live.sort((a, b) => a.startDate.localeCompare(b.startDate))[0];

  const future = dated.filter((t) => t.startDate > today);
  return future.sort((a, b) => a.startDate.localeCompare(b.startDate))[0] || null;
};

/** ניסוח הספירה לאחור בשפה שאדם משתמש בה, ולא "בעוד 1 ימים". */
const countdownOf = (days, dayOfTrip, totalDays) => {
  if (dayOfTrip) return { big: `${dayOfTrip}`, small: `מתוך ${totalDays}`, label: 'יום' };
  if (days === 0) return { big: 'היום', small: '', label: '' };
  if (days === 1) return { big: 'מחר', small: '', label: '' };
  return { big: `${days}`, small: 'ימים', label: 'בעוד' };
};

const UpcomingTripCard = ({ trips = [] }) => {
  const navigate = useNavigate();

  const data = useMemo(() => {
    const trip = pickTrip(trips);
    if (!trip) return null;

    const today = todayKey();
    const inProgress = trip.startDate <= today;
    const daysAway = inProgress ? 0 : daysBetweenKeys(today, trip.startDate);
    const totalDays = (daysBetweenKeys(trip.startDate, trip.endDate) || 0) + 1;
    const dayOfTrip = inProgress ? (daysBetweenKeys(trip.startDate, today) || 0) + 1 : 0;

    // ── ימים בלי תוכנית ──
    // נגזר מאותו ציר שמזין את מסך פרטי הנסיעה, ולא מספירה מקבילה: שני
    // מקומות שמחשבים אותה עובדה נפרדים בשינוי הבא, וזה כבר קרה כאן.
    const daysWithSomething = new Set(buildTimeline(trip.bookings || []).map((d) => d.dayKey));
    const emptyDays = Math.max(0, totalDays - daysWithSomething.size);

    // יחיד ורבים בנפרד: "1 טיסות" הוא בדיוק סוג הפרט שגורם לממשק
    // להיראות מתורגם־אוטומטית, ואין סיבה לשלם אותו בשביל שורת קוד.
    const s = trip.summary || {};
    const chips = [
      [s.flights, 'טיסה', 'טיסות', '✈️'],
      [s.hotels, 'מלון', 'מלונות', '🏨'],
      [s.cars, 'רכב', 'רכבים', '🚗'],
      [s.transfers, 'הסעה', 'הסעות', '🚕'],
      [s.activities, 'אטרקציה', 'אטרקציות', '🎟️'],
      [s.restaurants, 'מסעדה', 'מסעדות', '🍽️'],
    ].filter(([n]) => n > 0)
     .map(([n, one, many, icon]) => `${icon} ${n === 1 ? one : `${n} ${many}`}`);

    return { trip, daysAway, totalDays, dayOfTrip, inProgress, emptyDays, chips };
  }, [trips]);

  if (!data) return null;

  const { trip, daysAway, totalDays, dayOfTrip, inProgress, emptyDays, chips } = data;
  const cd = countdownOf(daysAway, dayOfTrip, totalDays);

  return (
    <Card
      elevation={0}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        // הרקע נשען על צבעי הערכה ולא על ערכים קשיחים, כדי שהכרטיס
        // ישרוד מעבר למצב כהה — הבאג שכבר עלה כאן בארבעה מקומות בעמוד אחד.
        background: (t) =>
          `linear-gradient(135deg, ${t.palette.primary.main}0D 0%, ${t.palette.secondary.main}14 100%)`,
      }}
    >
      {/* פס מבטא בקצה, במקום כותרת נוספת שתגזול גובה */}
      <Box sx={{ position: 'absolute', insetInlineStart: 0, top: 0, bottom: 0, width: 4,
        background: (t) => `linear-gradient(180deg, ${t.palette.primary.main}, ${t.palette.secondary.main})` }} />

      <Box sx={{ p: { xs: 2.25, md: 3 }, display: 'flex', gap: { xs: 2, md: 3 }, alignItems: 'center', flexWrap: 'wrap' }}>

        {/* ── הספירה לאחור ── */}
        <Box sx={{ textAlign: 'center', minWidth: 92 }}>
          {cd.label && (
            <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', lineHeight: 1 }}>{cd.label}</Typography>
          )}
          <Typography sx={{ fontSize: cd.big.length > 2 ? '1.75rem' : '2.75rem', fontWeight: 800, lineHeight: 1.05,
            color: 'primary.main' }}>
            {cd.big}
          </Typography>
          {cd.small && (
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{cd.small}</Typography>
          )}
        </Box>

        {/* ── לאן, מתי, ומה כבר סגור ── */}
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {trip.destination}
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 1 }}>
            {trip.startDate} — {trip.endDate}
            {trip.nights ? ` · ${trip.nights} לילות` : ''}
            {inProgress ? ' · בעיצומה' : ''}
          </Typography>

          <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
            {chips.map((c) => (
              <Chip key={c} label={c} size="small" sx={{ fontSize: '0.75rem' }} />
            ))}
          </Stack>

          {/* העובדה היחידה כאן שמובילה לפעולה, ולכן היחידה שמודגשת */}
          {emptyDays > 0 && (
            <Typography sx={{ mt: 1, fontSize: '0.8rem', color: 'text.secondary' }}>
              {emptyDays === 1 ? 'יום אחד עדיין בלי תוכנית' : `${emptyDays} ימים עדיין בלי תוכנית`}
            </Typography>
          )}
        </Box>

        {/* ── פעולה אחת, לא שלוש ── */}
        <Button
          variant="contained"
          onClick={() => navigate('/travel-info')}
          sx={{ borderRadius: 2.5, px: 3, minHeight: 44, whiteSpace: 'nowrap' }}
        >
          {emptyDays > 0 ? 'המשך לתכנן' : 'לפרטי הנסיעה'}
        </Button>
      </Box>
    </Card>
  );
};

export default UpcomingTripCard;
