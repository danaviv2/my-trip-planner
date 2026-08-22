import React, { useState } from 'react';
import { Box, Typography, IconButton, Chip, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import MailIcon from '@mui/icons-material/MailOutline';
import EditIcon from '@mui/icons-material/EditOutlined';
import UpIcon from '@mui/icons-material/ArrowUpward';
import DownIcon from '@mui/icons-material/ArrowDownward';
import { buildTimeline, humanGap, timeBetween } from '../../services/tripTimelineService';
import DayMiniMap, { groundPoints } from './DayMiniMap';
import EventEditDialog from './EventEditDialog';

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

const EventRow = ({ ev, onDelete, onEdit, onMove, canUp, canDown, mapNumber }) => (
  <Box sx={{ display: 'flex', gap: { xs: 0.75, sm: 1.5 }, alignItems: 'flex-start', mb: 0.5 }}>
    <Box
      sx={{
        width: { xs: 38, sm: 46 }, pt: 1.5, textAlign: 'left', flexShrink: 0,
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
        flex: 1, minWidth: 0, bgcolor: '#fff', borderRadius: 3,
        px: { xs: 1.25, sm: 1.75 }, py: 1.5,
        boxShadow: '0 1px 3px rgba(16,24,40,.06)',
      }}
    >
      {/* הפקדים אינם מתכווצים, ולכן חייבים להיות צרים: בטלפון הם
          מתחרים על אותו רוחב עם הכותרת עצמה. */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.25 }}>
        {/* הידית היא היחידה שנגררת, ולא הכרטיס כולו: גרירה בטעות תוך
            כדי גלילה בטלפון הייתה משנה שעות בלי שהמשתמש התכוון. */}
        <Typography
          sx={{
            // בלי minWidth הכותרת אינה מוותרת על רוחב המילה הארוכה בה,
            // ובמסך צר היא דוחקת את עצמה לעמודה של אות אחת.
            flex: 1, minWidth: 0,
            fontSize: '0.95rem', fontWeight: 600, letterSpacing: '-0.2px',
            overflowWrap: 'anywhere',
          }}
        >
          {ev.title}
        </Typography>
        {ev.booking?.direction === 'return' && ev.kind === 'flight' && (
          <Chip size="small" label="חזור" sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#eef0fc', color: '#5568d3', flexShrink: 0 }} />
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

      {/* הפקדים בשורה משלהם ולא לצד הכותרת.
          מדידה על מסך של 375 פיקסל הראתה שהכרטיס מקבל 135 והפקדים
          בולעים 80 מהם — הכותרת נדחקה ל-15 פיקסל והתרנדרה אות בשורה.
          שורה נפרדת מבטיחה לכותרת את מלוא רוחב הכרטיס תמיד, בלי תלות
          בכמה פקדים יתווספו בעתיד. */}
      {/* ── האישור המקורי ──
          עד כה היו כאן הפרטים בלבד. בדלפק הצ'ק-אין מבקשים את המסמך,
          ופרטים אינם מסמך. מזהה המייל נשלף ממילא בזמן הסריקה — הוא
          שימש למשיכת הקובץ המצורף ונזרק — ולכן הקישור לא עלה דבר.
          מוצג רק כשהמזהה קיים: הזמנות שנוספו ידנית ורשומות ישנות אינן
          מקבלות כפתור שיוביל לשום מקום. */}
      {ev.booking?.sourceMessageId && (
        <Box
          component="a"
          href={`https://mail.google.com/mail/u/0/#all/${ev.booking.sourceMessageId}`}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 0.75,
            fontSize: '0.72rem', color: 'primary.main', textDecoration: 'none',
            fontWeight: 600,
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          <MailIcon sx={{ fontSize: '0.9rem' }} />
          פתח את האישור המקורי
        </Box>
      )}

      {(onEdit || onDelete) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mt: 0.5, mb: -0.75, mr: -0.75 }}>
          {/* אותם פקדים ובאותו סדר כמו במסך תכנון הטיול. שני מסכים
              שמציגים יום ומתפעלים אותו אחרת שולחים את המשתמש לחפש
              במקום הלא נכון — וזה קרה בפועל. */}
          {onMove && (
            <>
              <IconButton size="small" disabled={!canUp} onClick={() => onMove(-1)} sx={{ p: 0.6 }}>
                <UpIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
              <IconButton size="small" disabled={!canDown} onClick={() => onMove(1)} sx={{ p: 0.6 }}>
                <DownIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            </>
          )}
          {onEdit && (
            <IconButton size="small" onClick={() => onEdit(ev)} sx={{ p: 0.6 }}>
              <EditIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          )}
          {onDelete && (
            <IconButton size="small" onClick={() => onDelete(ev.booking.id)} sx={{ p: 0.6 }}>
              <DeleteIcon sx={{ fontSize: '1.05rem' }} />
            </IconButton>
          )}
        </Box>
      )}

      {/* שורה שתוקנה ידנית מסומנת: אחרת המסך סותר את האישור שביד בלי
          שדבר יסביר למה. */}
      {ev.edited && ev.booking?.type !== 'custom' && (
        <Tooltip title="הערך באישור שונה. התיקון שלך נשמר בנפרד ולא יימחק בסריקה הבאה.">
          <Typography sx={{ mt: 0.75, fontSize: '0.7rem', color: 'text.disabled' }}>
            ✎ תוקן ידנית
          </Typography>
        </Tooltip>
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

const TripTimeline = ({ bookings = [], onDelete, onEditEvent, onResetEvent }) => {
  const [editing, setEditing] = useState(null);

  const days = buildTimeline(bookings);
  if (!days.length) return null;

  const editable = !!onEditEvent;

  /**
   * גרירה בתוך היום.
   *
   * הפריט מקבל שעה בין שכניו החדשים. זו אינה בחירה עיצובית אלא הכרח:
   * הציר ממוין לפי זמן, ו"סדר מועדף" שסותר את השעות היה מציג פריט של
   * 09:00 מתחת לפריט של 14:00 — מסך שסותר את עצמו במסך שכל תפקידו לענות
   * "מה עכשיו".
   */
  /**
   * הזזת אירוע ביום, בחץ.
   *
   * הציר ממוין לפי זמן, ולכן "מעלה" אינו סדר מועדף אלא שעה חדשה: הפריט
   * מקבל שעה בין שכניו החדשים. סדר ידני שסותר את השעות היה מציג פריט של
   * 09:00 מתחת לפריט של 14:00, במסך שכל תפקידו לענות "מה עכשיו".
   */
  const moveEvent = async (day, from, to) => {
    if (from === to || to == null || to < 0 || to >= day.events.length) return;

    // הרשימה בלי הפריט הנגרר היא זו שקובעת מי יהיו שכניו החדשים.
    const rest = day.events.filter((_, i) => i !== from);
    // ברשימה שבלי הפריט הנגרר, המיקום החדש הוא to עצמו: כשהוא יורד
    // למטה כל מי שמעליו כבר הוסט באחד בעקבות הסרתו.
    const time = timeBetween(rest[to - 1] || null, rest[to] || null);
    if (!time) return;

    await onEditEvent(day.events[from], { time });
  };

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
                  <EventRow
                    ev={ev}
                    onDelete={onDelete}
                    onEdit={editable ? setEditing : null}
                    mapNumber={numbers.get(ev)}
                    // הזזה דורשת שני אירועים לפחות ולפחות אחד עם שעה,
                    // אחרת אין ממה לגזור שעה חדשה.
                    onMove={
                      editable && day.events.length > 1 && day.events.some((x) => !x.allDay)
                        ? (dir) => moveEvent(day, j, j + dir)
                        : null
                    }
                    canUp={j > 0}
                    canDown={j < day.events.length - 1}
                  />
                </React.Fragment>
              ))}

            </Box>
          </React.Fragment>
        );
      })}

      <EventEditDialog
        open={!!editing}
        event={editing}
        onClose={() => setEditing(null)}
        onSave={(patch) => onEditEvent(editing, patch)}
        onReset={() => onResetEvent(editing)}
      />

    </Box>
  );
};

export default TripTimeline;
