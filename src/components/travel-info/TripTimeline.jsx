import React, { useState, useRef } from 'react';
import { Box, Typography, IconButton, Chip, Button, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/EditOutlined';
import AddIcon from '@mui/icons-material/Add';
import DragIcon from '@mui/icons-material/DragIndicator';
import { buildTimeline, humanGap, timeBetween } from '../../services/tripTimelineService';
import DayMiniMap, { groundPoints } from './DayMiniMap';
import EventEditDialog from './EventEditDialog';
import AddPlanItemDialog from './AddPlanItemDialog';

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

const EventRow = ({ ev, onDelete, onEdit, mapNumber, draggable, dragging, dropBefore, onGrab, rowRef }) => (
  <Box
    ref={rowRef}
    sx={{
      display: 'flex', gap: 1.5, alignItems: 'flex-start', mb: 0.5,
      opacity: dragging ? 0.35 : 1,
      // קו שמראה לאן הפריט ייפול. בלעדיו הגרירה בטלפון היא ניחוש:
      // האצבע מכסה את השורה, ואין שום סימן מה יקרה כשתשוחרר.
      borderTop: dropBefore ? '2px solid' : '2px solid transparent',
      borderColor: dropBefore ? 'primary.main' : 'transparent',
      borderRadius: dropBefore ? '2px' : 0,
      transition: 'border-color .12s',
    }}
  >
    <Box
      sx={{
        width: 46, pt: 1.5, textAlign: 'left', flexShrink: 0,
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
        flex: 1, minWidth: 0, bgcolor: '#fff', borderRadius: 3, px: 1.75, py: 1.5,
        boxShadow: '0 1px 3px rgba(16,24,40,.06)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        {/* הידית היא היחידה שנגררת, ולא הכרטיס כולו: גרירה בטעות תוך
            כדי גלילה בטלפון הייתה משנה שעות בלי שהמשתמש התכוון. */}
        {draggable && (
          <Box
            onPointerDown={onGrab}
            sx={{
              color: dragging ? 'primary.main' : '#b9bdcc',
              cursor: 'grab', mt: -0.5, ml: -0.75, p: 0.5,
              // בלי זה מגע בידית גולל את הדף במקום לגרור
              touchAction: 'none', userSelect: 'none',
            }}
          >
            <DragIcon sx={{ fontSize: '1.2rem' }} />
          </Box>
        )}
        <Typography sx={{ flex: 1, fontSize: '0.95rem', fontWeight: 600, letterSpacing: '-0.2px', wordBreak: 'break-word' }}>
          {ev.title}
        </Typography>
        {ev.booking?.direction === 'return' && ev.kind === 'flight' && (
          <Chip size="small" label="חזור" sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#eef0fc', color: '#5568d3' }} />
        )}
        {onEdit && (
          <IconButton size="small" onClick={() => onEdit(ev)} sx={{ mt: -0.5 }}>
            <EditIcon sx={{ fontSize: '0.95rem' }} />
          </IconButton>
        )}
        {onDelete && (
          <IconButton size="small" onClick={() => onDelete(ev.booking.id)} sx={{ mt: -0.5, mr: -0.5 }}>
            <DeleteIcon sx={{ fontSize: '1rem' }} />
          </IconButton>
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

const TripTimeline = ({ bookings = [], onDelete, onEditEvent, onResetEvent, onAddItem }) => {
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(null);
  const [drag, setDrag] = useState(null);

  // מיקומי השורות על המסך. נדרשים כדי לדעת מעל איזו שורה האצבע נמצאת:
  // אירועי מצביע מדווחים נקודה, לא יעד.
  const rows = useRef({});

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
  const applyDrop = async (day, from, to) => {
    if (from === to || to == null) return;

    // הרשימה בלי הפריט הנגרר היא זו שקובעת מי יהיו שכניו החדשים.
    const rest = day.events.filter((_, i) => i !== from);
    const at = from < to ? to - 1 : to;
    const time = timeBetween(rest[at - 1] || null, rest[at] || null);
    if (!time) return;

    await onEditEvent(day.events[from], { time });
  };

  /**
   * גרירה באירועי מצביע ולא בגרירת HTML.
   *
   * הגרסה הראשונה השתמשה ב-draggable, שאינו מגיב למגע כלל: על הטלפון —
   * המכשיר היחיד שהמסך הזה נועד לו — הידית פשוט לא עשתה דבר. אירועי
   * מצביע מכסים עכבר ומגע באותו קוד.
   */
  const startDrag = (day, index) => (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ dayKey: day.dayKey, index, over: index });
  };

  const onDragMove = (day) => (e) => {
    if (!drag || drag.dayKey !== day.dayKey) return;
    const y = e.clientY;

    // היעד הוא השורה הראשונה שמרכזה מתחת לאצבע. שורה שהוסרה מה-DOM
    // מדולגת במקום להפיל את החישוב.
    let over = day.events.length;
    for (let i = 0; i < day.events.length; i += 1) {
      const el = rows.current[`${day.dayKey}:${i}`];
      if (!el) continue;
      const box = el.getBoundingClientRect();
      if (y < box.top + box.height / 2) { over = i; break; }
    }
    if (over !== drag.over) setDrag((d) => ({ ...d, over }));
  };

  const endDrag = (day) => async () => {
    if (!drag || drag.dayKey !== day.dayKey) return;
    const { index, over } = drag;
    setDrag(null);
    await applyDrop(day, index, over);
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
            <Box
              sx={{ position: 'relative' }}
              onPointerMove={onDragMove(day)}
              onPointerUp={endDrag(day)}
              onPointerCancel={() => setDrag(null)}
            >
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
                    rowRef={(el) => { rows.current[`${day.dayKey}:${j}`] = el; }}
                    // גרירה נדרשת שני אירועים לפחות, ולפחות אחד מהם עם
                    // שעה — אחרת אין ממה לגזור שעה חדשה.
                    draggable={editable && day.events.length > 1 && day.events.some((x) => !x.allDay)}
                    dragging={!!drag && drag.dayKey === day.dayKey && drag.index === j}
                    dropBefore={!!drag && drag.dayKey === day.dayKey && drag.over === j && drag.index !== j}
                    onGrab={startDrag(day, j)}
                  />
                </React.Fragment>
              ))}

              {onAddItem && (
                <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5 }}>
                  <Box sx={{ width: 46, flexShrink: 0 }} />
                  <Box sx={{ width: 32, flexShrink: 0 }} />
                  <Button
                    size="small"
                    startIcon={<AddIcon sx={{ fontSize: '1rem' }} />}
                    onClick={() => setAdding(day.dayKey)}
                    sx={{
                      color: 'text.disabled', fontSize: '0.78rem', fontWeight: 500,
                      justifyContent: 'flex-start', px: 1,
                      '&:hover': { color: 'primary.main', bgcolor: 'transparent' },
                    }}
                  >
                    הוסף לתוכנית היום
                  </Button>
                </Box>
              )}
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

      <AddPlanItemDialog
        open={!!adding}
        dayKey={adding}
        onClose={() => setAdding(null)}
        onAdd={onAddItem}
      />
    </Box>
  );
};

export default TripTimeline;
