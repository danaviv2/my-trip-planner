import React, { useState } from 'react';
import {
  Box, Paper, Typography, Chip, TextField, Button, Alert, AlertTitle, Divider,
} from '@mui/material';
import {
  flightRightsProfile, rightsFor, formatAmount, claimLetter,
} from '../../services/passengerRightsService';
import { fetchFlightStatus, formatClock } from '../../services/flightStatusService';

/**
 * מה מגיע לך אם הטיסה תתעכב.
 *
 * חברות התעופה האירופיות מחזיקות מיליארדים בפיצויים שלא נתבעו, ורק
 * כ-42% מהנוסעים יודעים שקיימת להם זכות בכלל. הסיבה אינה עצלות אלא
 * מורכבות: הזכאות תלויה בשדה המוצא, בזהות המוביל, במרחק ובמשך העיכוב,
 * מול שני חוקים בעלי ספים שונים לחלוטין.
 *
 * כל הנתונים האלה כבר נקלטו אצלנו מאישור ההזמנה. הרכיב הזה רק מצליב
 * אותם — וזה ההבדל בין אפליקציה שמארגנת מידע לכזו שעושה בו שימוש.
 */
const FlightRights = ({ flight, passengers = 1 }) => {
  const [delay, setDelay] = useState('');
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState(null);

  /**
   * שולף את האיחור בפועל במקום לבקש מהמשתמש לזכור אותו.
   *
   * זה ההבדל המעשי היחיד שנותר: אדם שלא יודע כמה בדיוק התעכבה הטיסה
   * לא יתבע, גם כשמגיע לו.
   */
  const checkActual = async () => {
    setChecking(true);
    setStatus(null);
    const r = await fetchFlightStatus(flight.flightNumber, flight.date);
    setStatus(r);
    if (r.found && r.delayHours != null) setDelay(String(r.delayHours));
    setChecking(false);
  };

  const profile = flightRightsProfile(flight, passengers);
  if (!profile) return null;

  const hours = Number(delay);
  const checked = delay !== '' && Number.isFinite(hours) && hours > 0;
  const result = checked ? rightsFor(flight, hours, passengers) : null;
  const eligible = result?.entitlements?.filter((e) => e.eligible) || [];

  const copyLetter = async (ent) => {
    try {
      await navigator.clipboard.writeText(claimLetter(flight, ent, hours, passengers));
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 1, borderRadius: '8px' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
        ⚖️ מה מגיע לך · {flight.flightNumber || 'טיסה'}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
        {profile.from.city} → {profile.to.city} · {profile.km.toLocaleString()} ק״מ
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
        {profile.options.map((o) => (
          <Chip
            key={o.label}
            size="small"
            variant="outlined"
            color={o.thresholdHours === profile.lowestThreshold.thresholdHours ? 'primary' : 'default'}
            label={`${o.label} · מעל ${o.thresholdHours}ש׳ → ${formatAmount(o.amount, o.currency)} לנוסע`}
          />
        ))}
      </Box>

      {/* הסף הנמוך הוא זה שנכנס לתוקף ראשון, וזו הידיעה השימושית ביותר:
          בטיסה שממריאה מאירופה די בשלוש שעות, בעוד באותה טיסה בכיוון
          ההפוך נדרשות שמונה. ההבדל אינו אינטואיטיבי ושווה מאות אירו. */}
      {profile.options.length > 1 && (
        <Alert severity="info" sx={{ mb: 1.5, py: 0.5 }}>
          שני חוקים חלים על הטיסה הזו. הסף שנכנס לתוקף ראשון הוא{' '}
          <strong>{profile.lowestThreshold.thresholdHours} שעות</strong> — לפי{' '}
          {profile.lowestThreshold.label}.
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size="small"
          type="number"
          label="כמה שעות התעכבה?"
          value={delay}
          onChange={(e) => setDelay(e.target.value)}
          inputProps={{ min: 0, max: 48, step: 0.5 }}
          sx={{ width: 190 }}
        />
        <Button size="small" variant="contained" onClick={checkActual} disabled={checking || !flight.date}>
          {checking ? 'בודק...' : 'בדוק את האיחור בפועל'}
        </Button>
        {checked && !eligible.length && (
          <Typography variant="caption" color="text.secondary">
            בעיכוב כזה לא קמה זכות לפיצוי כספי.
          </Typography>
        )}
      </Box>

      {status && !status.found && (
        <Alert severity="info" sx={{ mt: 1, py: 0.5 }}>
          {status.reason} אפשר להזין את מספר השעות ידנית.
        </Alert>
      )}

      {status?.found && (
        <Alert severity={status.delayHours > 0 ? 'warning' : 'success'} sx={{ mt: 1, py: 0.5 }}>
          <AlertTitle sx={{ fontWeight: 700, mb: 0.25 }}>
            {status.delayHours > 0
              ? `הטיסה הגיעה באיחור של ${status.delayHours} שעות`
              : 'הטיסה הגיעה בזמן'}
          </AlertTitle>
          מתוכנן {formatClock(status.scheduled)} · בפועל {formatClock(status.actual)}
          {/* התקנה מודדת את רגע פתיחת הדלת. כשהנתון הוא זמן נחיתה בלבד
              הוא מוקדם ממנו, והאיחור האמיתי גדול מהמוצג — הבחנה שמכריעה
              במקרי גבול. */}
          {!status.atGate && ' · הנתון הוא זמן נחיתה ולא הגעה לעמדה, ולכן האיחור בפועל עשוי להיות ארוך יותר'}
        </Alert>
      )}

      {checked && result?.entitlements?.map((e, i) => (
        <Box key={i} sx={{ mt: 1.5 }}>
          <Alert severity={e.eligible ? 'success' : 'info'} sx={{ py: 0.5 }}>
            <AlertTitle sx={{ fontWeight: 700, mb: 0.25 }}>
              {e.regime}
              {e.eligible && ` — ${formatAmount(e.total, e.currency)}`}
            </AlertTitle>
            {e.note}
            {e.eligible && passengers > 1 && (
              <> ({formatAmount(e.amountPerPassenger, e.currency)} × {passengers} נוסעים)</>
            )}
          </Alert>
          {e.eligible && (
            <Button size="small" variant="outlined" sx={{ mt: 0.75 }} onClick={() => copyLetter(e)}>
              העתק מכתב דרישה מוכן
            </Button>
          )}
        </Box>
      ))}

      {copied && (
        <Alert severity="success" sx={{ mt: 1, py: 0.25 }}>
          המכתב הועתק. הדבק אותו בפנייה לחברת התעופה.
        </Alert>
      )}

      <Divider sx={{ my: 1.5 }} />
      <Typography variant="caption" color="text.secondary">
        חברת התעופה פטורה מפיצוי בנסיבות מיוחדות שאינן בשליטתה — מזג אוויר קיצוני,
        שביתה כללית או הוראת ביטחון. אין באמור ייעוץ משפטי.
      </Typography>
    </Paper>
  );
};

export default FlightRights;
