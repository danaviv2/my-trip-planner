import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Paper, Button, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Rating,
  Tabs, Tab, Select, MenuItem, FormControl, InputLabel,
  Avatar, Divider, Tooltip, Snackbar, Alert, Fade,
  CircularProgress, Stack, LinearProgress,
} from '@mui/material';
import {
  BookOutlined as JournalIcon,
  AddAPhoto as PhotoIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Star as StarIcon,
  Today as TodayIcon,
  AutoStories as StoryIcon,
  Close as CloseIcon,
  FlightTakeoff as TripIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  SkipNext as NextIcon,
  SkipPrevious as PrevIcon,
  Videocam as ReelIcon,
  AttachMoney as MoneyIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useTripSave } from '../contexts/TripSaveContext';
import { useAuth } from '../contexts/AuthContext';
import ShareTripDialog from '../components/shared/ShareTripDialog';
import {
  loadEntriesLocal, saveEntriesLocal,
  saveEntry, loadEntries, deleteEntryFirestore,
} from '../services/journalService';

// ─── Resize photo via canvas ──────────────────────────────────────────────────

async function resizeBase64(file, maxPx = 400) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ─── Activity emoji fallback ──────────────────────────────────────────────────

const TYPE_EMOJI = {
  attraction: '🏛️', food: '🍽️', nature: '🌿', shopping: '🛍️',
  nightlife: '🌃', culture: '🎭', sport: '⚽', transport: '🚌',
  museum: '🖼️', beach: '🏖️', winery: '🍷', castle: '🏰',
  hotel: '🏨', rest: '😴', adventure: '🧗',
};

function actEmoji(act) {
  return act.emoji || TYPE_EMOJI[act.type] || '📍';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}

function tripDays(trip) {
  // Rolling trips saved from RollingTripPage: { dailyItinerary: [{day, stop, activities}], stops, rollingTrip:true }
  // Regular trips from TripPlannerPage: { dailyItinerary: [{day, activities}] }
  // Older format: { itinerary: [...] }
  // In-memory RollingTripPage state (fullItinerary): [{ stop, days, itinerary:[{activities}] }]

  if (trip.fullItinerary) {
    const days = [];
    let globalDay = 1;
    trip.fullItinerary.forEach((stopObj) => {
      (stopObj.itinerary || []).forEach((day) => {
        days.push({
          label: `יום ${globalDay} — ${stopObj.stop?.name || stopObj.stop || ''}`,
          activities: day.activities || [],
        });
        globalDay++;
      });
    });
    return days;
  }

  const rawDays = trip.dailyItinerary || trip.itinerary;
  if (Array.isArray(rawDays) && rawDays.length > 0) {
    return rawDays.map((day, i) => ({
      label: day.stop
        ? `יום ${day.day || i + 1} — ${day.stop}`
        : `יום ${day.day || i + 1}`,
      activities: day.activities || [],
    }));
  }
  return [];
}

// ─── Main component ───────────────────────────────────────────────────────────

const TravelJournalPage = () => {
  const { savedTrips } = useTripSave();
  const { user } = useAuth();

  // ── state ──
  const [activeTab, setActiveTab] = useState(0);        // 0=Today, 1=Story
  const [selectedTripId, setSelectedTripId] = useState('');
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  // check-in dialog
  const [checkinAct, setCheckinAct] = useState(null);   // activity being checked-in
  const [checkinRating, setCheckinRating] = useState(4);
  const [checkinNote, setCheckinNote] = useState('');
  const [checkinPhoto, setCheckinPhoto] = useState(null); // base64
  const [saving, setSaving] = useState(false);

  // share dialog
  const [shareOpen, setShareOpen] = useState(false);
  const [shareEntry, setShareEntry] = useState(null);

  // reel
  const [reelIdx, setReelIdx] = useState(0);
  const [reelPlaying, setReelPlaying] = useState(false);
  const reelTimer = useRef(null);

  // expenses
  const [expenses, setExpenses] = useState([]);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [newExp, setNewExp] = useState({ amount: '', category: 'food', note: '' });
  const [aiSummary, setAiSummary] = useState('');
  const [loadingAiSummary, setLoadingAiSummary] = useState(false);

  // trip report card
  const [reportCard, setReportCard] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);

  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const showSnack = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  // ── derived ──
  const selectedTrip = savedTrips.find(t => String(t.id) === String(selectedTripId)) || null;
  const days = selectedTrip ? tripDays(selectedTrip) : [];
  const today = days[selectedDayIdx] || null;
  const tripEntries = entries.filter(e => String(e.tripId) === String(selectedTripId));
  const checkedInIds = new Set(tripEntries.filter(e => e.dayIdx === selectedDayIdx).map(e => e.activityKey));

  // ── load entries ──
  const loadAllEntries = useCallback(async () => {
    setLoadingEntries(true);
    try {
      if (user) {
        const remote = await loadEntries(user.uid);
        const local = loadEntriesLocal();
        const remoteIds = new Set(remote.map(e => String(e.id)));
        const merged = [...remote, ...local.filter(e => !remoteIds.has(String(e.id)))];
        setEntries(merged);
        saveEntriesLocal(merged);
      } else {
        setEntries(loadEntriesLocal());
      }
    } catch {
      setEntries(loadEntriesLocal());
    } finally {
      setLoadingEntries(false);
    }
  }, [user]);

  useEffect(() => { loadAllEntries(); }, [loadAllEntries]);

  // auto-select first trip
  useEffect(() => {
    if (!selectedTripId && savedTrips.length > 0) {
      setSelectedTripId(String(savedTrips[0].id));
    }
  }, [savedTrips, selectedTripId]);

  // load expenses for selected trip
  useEffect(() => {
    if (!selectedTripId) return;
    try {
      const raw = localStorage.getItem(`trip_expenses_${selectedTripId}`);
      setExpenses(raw ? JSON.parse(raw) : []);
    } catch { setExpenses([]); }
  }, [selectedTripId]);

  // reel autoplay
  useEffect(() => {
    if (!reelPlaying) { clearInterval(reelTimer.current); return; }
    reelTimer.current = setInterval(() => {
      setReelIdx(i => i + 1); // will be clamped in render
    }, 4000);
    return () => clearInterval(reelTimer.current);
  }, [reelPlaying]);

  // ── check-in ──
  const openCheckin = (act, key) => {
    setCheckinAct({ ...act, _key: key });
    setCheckinRating(4);
    setCheckinNote('');
    setCheckinPhoto(null);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await resizeBase64(file);
    setCheckinPhoto(b64);
  };

  const handleSaveCheckin = async () => {
    if (!checkinAct || !selectedTripId) return;
    setSaving(true);
    const entry = {
      id: Date.now(),
      tripId: String(selectedTripId),
      tripName: selectedTrip?.destination || selectedTrip?.name || 'טיול',
      dayIdx: selectedDayIdx,
      dayLabel: today?.label || `יום ${selectedDayIdx + 1}`,
      activityKey: checkinAct._key,
      activityName: checkinAct.name,
      activityEmoji: actEmoji(checkinAct),
      rating: checkinRating,
      note: checkinNote.trim(),
      photoBase64: checkinPhoto,
      timestamp: new Date().toISOString(),
    };
    const updated = [...entries, entry];
    setEntries(updated);
    saveEntriesLocal(updated);
    // Firestore sync in background — don't block UI
    if (user) {
      saveEntry(user.uid, entry).catch(() => {});
    }
    setSaving(false);
    setCheckinAct(null);
    showSnack('✅ צ׳ק-אין נשמר בהצלחה!');
  };

  // ── delete entry ──
  const handleDelete = async (entryId) => {
    const updated = entries.filter(e => e.id !== entryId);
    setEntries(updated);
    saveEntriesLocal(updated);
    if (user) {
      try { await deleteEntryFirestore(user.uid, entryId); } catch {}
    }
    showSnack('נמחק', 'info');
  };

  // ── share ──
  const handleShare = (entry) => {
    setShareEntry(entry);
    setShareOpen(true);
  };

  const shareLabel = shareEntry
    ? `${shareEntry.activityEmoji} ${shareEntry.activityName} ${'⭐'.repeat(shareEntry.rating)}${shareEntry.note ? ` — "${shareEntry.note}"` : ''}`
    : `✈️ ${selectedTrip?.destination || 'הטיול שלי'} (${tripEntries.length} רגעים)`;

  // ── expenses helpers ──
  const EXPENSE_CATS = [
    { id: 'food',       label: 'אוכל',      emoji: '🍽️', color: '#f5576c' },
    { id: 'lodging',    label: 'לינה',      emoji: '🏨', color: '#764ba2' },
    { id: 'transport',  label: 'תחבורה',    emoji: '🚌', color: '#667eea' },
    { id: 'activities', label: 'פעילויות',  emoji: '🎭', color: '#f7971e' },
    { id: 'shopping',   label: 'קניות',     emoji: '🛍️', color: '#43e97b' },
    { id: 'coffee',     label: 'קפה/בר',   emoji: '☕', color: '#a18cd1' },
    { id: 'health',     label: 'בריאות',    emoji: '💊', color: '#f093fb' },
    { id: 'other',      label: 'שונות',     emoji: '🎁', color: '#aaa'    },
  ];

  const saveExpenses = (updated) => {
    setExpenses(updated);
    try { localStorage.setItem(`trip_expenses_${selectedTripId}`, JSON.stringify(updated)); } catch {}
  };

  const addExpense = () => {
    const amt = parseFloat(newExp.amount);
    if (!amt || amt <= 0) return;
    const exp = { id: Date.now(), tripId: selectedTripId, amount: amt, category: newExp.category, note: newExp.note.trim(), date: new Date().toISOString() };
    saveExpenses([...expenses, exp]);
    setNewExp({ amount: '', category: 'food', note: '' });
    setExpenseOpen(false);
    showSnack(`💸 הוצאה נוספה: ₪${amt}`);
  };

  const deleteExpense = (id) => saveExpenses(expenses.filter(e => e.id !== id));

  // ─── render helpers ──────────────────────────────────────────────────────────

  const renderTripsEmpty = () => (
    <Box textAlign="center" py={8}>
      <TripIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
      <Typography variant="h6" color="text.secondary">אין טיולים שמורים</Typography>
      <Typography variant="body2" color="text.secondary" mt={1}>
        צור טיול ושמור אותו כדי לנהל יומן מסע
      </Typography>
      <Button variant="contained" href="/rolling-trip" sx={{ mt: 3, background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
        🛣️ צור טיול מתגלגל
      </Button>
    </Box>
  );

  const renderActivityCard = (act, key, di) => {
    const checked = checkedInIds.has(key);
    const entryForAct = tripEntries.find(e => e.dayIdx === selectedDayIdx && e.activityKey === key);
    return (
      <Paper
        key={key}
        elevation={checked ? 2 : 1}
        sx={{
          p: 2, mb: 1.5, borderRadius: 2,
          border: checked ? '2px solid #43e97b' : '1px solid transparent',
          background: checked ? 'rgba(67,233,123,0.06)' : undefined,
          transition: 'all 0.2s',
        }}
      >
        <Box display="flex" alignItems="flex-start" gap={1.5}>
          <Avatar sx={{ bgcolor: checked ? '#43e97b' : '#667eea', width: 40, height: 40, fontSize: 18 }}>
            {checked ? '✓' : actEmoji(act)}
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Typography fontWeight={700} noWrap>{act.name}</Typography>
            {act.time && <Typography variant="caption" color="text.secondary">{act.time}</Typography>}
            {act.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.8rem' }}>
                {act.description.slice(0, 90)}{act.description.length > 90 ? '...' : ''}
              </Typography>
            )}
            {entryForAct && (
              <Box mt={1}>
                <Rating value={entryForAct.rating} readOnly size="small" />
                {entryForAct.note && (
                  <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', mt: 0.3 }}>
                    "{entryForAct.note}"
                  </Typography>
                )}
                {entryForAct.photoBase64 && (
                  <Box
                    component="img"
                    src={entryForAct.photoBase64}
                    alt="תמונה"
                    sx={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 1, mt: 0.5 }}
                  />
                )}
              </Box>
            )}
          </Box>
          <Box display="flex" flexDirection="column" alignItems="flex-end" gap={0.5} flexShrink={0}>
            {!checked ? (
              <Button
                size="small"
                variant="contained"
                onClick={() => openCheckin(act, key)}
                sx={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
              >
                📝 צ׳ק-אין
              </Button>
            ) : (
              <Chip label="✓ בוצע" size="small" sx={{ bgcolor: '#43e97b22', color: '#2d8a52', fontWeight: 700 }} />
            )}
            {entryForAct && (
              <Box>
                <Tooltip title="שתף">
                  <IconButton size="small" onClick={() => handleShare(entryForAct)}>
                    <ShareIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="מחק">
                  <IconButton size="small" onClick={() => handleDelete(entryForAct.id)} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    );
  };

  const renderTodayTab = () => {
    if (!selectedTrip) return renderTripsEmpty();
    if (days.length === 0) {
      return (
        <Box textAlign="center" py={6}>
          <Typography color="text.secondary">לטיול זה אין מסלול יומי שמור</Typography>
        </Box>
      );
    }
    const activities = today?.activities || [];
    return (
      <Box>
        {/* Day selector */}
        <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'rgba(102,126,234,0.06)', borderRadius: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>בחר יום</InputLabel>
            <Select
              value={selectedDayIdx}
              label="בחר יום"
              onChange={(e) => setSelectedDayIdx(Number(e.target.value))}
            >
              {days.map((d, i) => (
                <MenuItem key={i} value={i}>{d.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {checkedInIds.size}/{activities.length} פעילויות בוצעו היום
          </Typography>
        </Paper>

        {activities.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography color="text.secondary">אין פעילויות ביום זה</Typography>
          </Box>
        ) : (
          activities.map((act, i) => renderActivityCard(act, `${selectedDayIdx}-${i}-${act.name}`, i))
        )}
      </Box>
    );
  };

  const renderStoryTab = () => {
    if (!selectedTrip) return renderTripsEmpty();
    if (tripEntries.length === 0) {
      return (
        <Box textAlign="center" py={8}>
          <StoryIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">הסיפור שלך ריק עדיין</Typography>
          <Typography variant="body2" color="text.secondary" mt={1} mb={2}>
            עבור לטאב <strong>"היום"</strong>, בחר יום ולחץ <strong>"צ׳ק-אין"</strong> על פעילות
          </Typography>
          <Button
            variant="contained"
            onClick={() => setActiveTab(0)}
            sx={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}
          >
            📅 עבור לטאב היום
          </Button>
        </Box>
      );
    }

    // Group entries by dayLabel
    const grouped = {};
    tripEntries.forEach(e => {
      const key = e.dayLabel || `יום ${e.dayIdx + 1}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(e);
    });

    return (
      <Box>
        {/* Action buttons */}
        <Box display="flex" gap={1} mb={2}>
          <Button flex={1} fullWidth variant="outlined" startIcon={<ShareIcon />}
            onClick={() => { setShareEntry(null); setShareOpen(true); }}
            sx={{ borderColor: '#667eea', color: '#667eea' }}>
            שתף את כל הסיפור
          </Button>
          <Button fullWidth variant="contained" startIcon={loadingReport ? <CircularProgress size={14} color="inherit" /> : null}
            onClick={generateReportCard} disabled={loadingReport}
            sx={{ background: 'linear-gradient(135deg,#f7971e,#e74c3c)', whiteSpace: 'nowrap' }}>
            📊 דוח טיול AI
          </Button>
        </Box>

        {Object.entries(grouped).map(([dayLabel, dayEntries]) => (
          <Box key={dayLabel} mb={3}>
            <Typography variant="overline" fontWeight={700} color="#667eea">{dayLabel}</Typography>
            <Divider sx={{ mb: 1.5 }} />
            {dayEntries
              .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
              .map((entry) => (
                <Fade in key={entry.id}>
                  <Paper elevation={2} sx={{ p: 2, mb: 2, borderRadius: 2, position: 'relative' }}>
                    <Box display="flex" gap={1.5} alignItems="flex-start">
                      <Avatar sx={{ bgcolor: '#667eea', width: 42, height: 42, fontSize: 20, flexShrink: 0 }}>
                        {entry.activityEmoji}
                      </Avatar>
                      <Box flex={1} minWidth={0}>
                        <Typography fontWeight={700}>{entry.activityName}</Typography>
                        <Typography variant="caption" color="text.secondary">{formatDate(entry.timestamp)}</Typography>
                        <Box mt={0.5}><Rating value={entry.rating} readOnly size="small" /></Box>
                        {entry.note && (
                          <Typography
                            variant="body2"
                            sx={{ mt: 0.5, fontStyle: 'italic', color: 'text.secondary', lineHeight: 1.5 }}
                          >
                            "{entry.note}"
                          </Typography>
                        )}
                        {entry.photoBase64 && (
                          <Box
                            component="img"
                            src={entry.photoBase64}
                            alt="תמונה"
                            sx={{ mt: 1, width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 2 }}
                          />
                        )}
                      </Box>
                      <Box display="flex" gap={0.5} flexShrink={0}>
                        <Tooltip title="שתף">
                          <IconButton size="small" onClick={() => handleShare(entry)}>
                            <ShareIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="מחק">
                          <IconButton size="small" onClick={() => handleDelete(entry.id)} color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Paper>
                </Fade>
              ))}
          </Box>
        ))}
      </Box>
    );
  };

  // ─── Achievements logic ───────────────────────────────────────────────────────
  const ALL_BADGES = [
    { id: 'first_checkin',  emoji: '🎯', label: 'הצעד הראשון',    desc: 'צ׳ק-אין ראשון',                  check: (e) => e.length >= 1 },
    { id: 'foodie',         emoji: '🍽️', label: 'גורמה',           desc: '5 פעילויות אוכל',                 check: (e) => e.filter(x => x.activityKey?.includes('food') || x.activityEmoji === '🍽️').length >= 5 },
    { id: 'photographer',   emoji: '📸', label: 'צלם מסע',         desc: '5 תמונות הועלו',                  check: (e) => e.filter(x => x.photoBase64).length >= 5 },
    { id: 'five_stars',     emoji: '⭐', label: 'כוכב חמש',        desc: '3 פעילויות בדירוג 5',            check: (e) => e.filter(x => x.rating === 5).length >= 3 },
    { id: 'explorer',       emoji: '🗺️', label: 'חוקר',            desc: '3 ימים שונים בוצעו',             check: (e) => new Set(e.map(x => x.dayIdx)).size >= 3 },
    { id: 'active',         emoji: '🏃', label: 'תייר פעיל',       desc: '10 צ׳ק-אינים',                   check: (e) => e.length >= 10 },
    { id: 'storyteller',    emoji: '✍️', label: 'סיפורן',           desc: '5 הערות נכתבו',                  check: (e) => e.filter(x => x.note?.length > 10).length >= 5 },
    { id: 'perfectday',     emoji: '🏅', label: 'יום מושלם',       desc: '5 צ׳ק-אינים ביום אחד',          check: (e) => { const d = {}; e.forEach(x => { d[x.dayIdx] = (d[x.dayIdx]||0)+1; }); return Object.values(d).some(v => v >= 5); } },
    { id: 'globetrotter',   emoji: '🌍', label: 'מטייל עולם',      desc: '20 צ׳ק-אינים',                   check: (e) => e.length >= 20 },
    { id: 'memorylane',     emoji: '🎬', label: 'יוצר תוכן',       desc: '10 תמונות הועלו',                 check: (e) => e.filter(x => x.photoBase64).length >= 10 },
  ];

  const computeBadges = (tripEntriesList) =>
    ALL_BADGES.map(b => ({ ...b, earned: b.check(tripEntriesList) }));

  // ─── AI Report Card ───────────────────────────────────────────────────────────
  const generateReportCard = async () => {
    const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || window.env?.REACT_APP_GEMINI_API_KEY;
    const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    if (!GEMINI_API_KEY) { showSnack('מפתח Gemini API חסר', 'error'); return; }
    setLoadingReport(true);
    setReportOpen(true);
    setReportCard(null);

    const tripName = selectedTrip?.destination || 'הטיול';
    const summary = tripEntries.map(e =>
      `${e.activityEmoji} ${e.activityName} (${e.dayLabel}): ${e.rating} כוכבים${e.note ? `, הערה: "${e.note}"` : ''}`
    ).join('\n');

    const prompt = `אתה מדריך טיולים מצחיק ואוהב. תן ציונים לטיול הבא בהתבסס על היומן.

טיול: ${tripName}
יומן:
${summary}

החזר JSON בלבד (ללא markdown):
{
  "overall": "A+",
  "overallComment": "משפט מצחיק/מחמיא על הטיול",
  "grades": [
    { "category": "אוכל", "emoji": "🍽️", "grade": "A", "comment": "קצר ומצחיק" },
    { "category": "פעילויות", "emoji": "🎭", "grade": "B+", "comment": "קצר ומצחיק" },
    { "category": "חוויה", "emoji": "✨", "grade": "A-", "comment": "קצר ומצחיק" },
    { "category": "זיכרונות", "emoji": "📸", "grade": "A+", "comment": "קצר ומצחיק" }
  ],
  "highlight": "הרגע הכי טוב שציינת",
  "recommendation": "המלצה לטיול הבא"
}`;

    try {
      const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      const data = await res.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setReportCard(JSON.parse(text));
    } catch {
      showSnack('שגיאה בייצור הדוח', 'error');
      setReportOpen(false);
    } finally {
      setLoadingReport(false);
    }
  };

  const gradeColor = (g = '') => {
    if (g.startsWith('A')) return '#43e97b';
    if (g.startsWith('B')) return '#f5af19';
    if (g.startsWith('C')) return '#f5576c';
    return '#aaa';
  };

  // ─── Reel tab ────────────────────────────────────────────────────────────────
  const renderReelTab = () => {
    if (!selectedTrip) return renderTripsEmpty();
    const reelEntries = [...tripEntries].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    if (reelEntries.length === 0) {
      return (
        <Box textAlign="center" py={8}>
          <ReelIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">אין עדיין זיכרונות</Typography>
          <Typography variant="body2" color="text.secondary" mt={1} mb={2}>עשה צ׳ק-אין לפעילויות כדי לבנות את הרילס שלך</Typography>
          <Button variant="contained" onClick={() => setActiveTab(0)} sx={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
            📅 עבור לטאב היום
          </Button>
        </Box>
      );
    }
    const idx = Math.min(reelIdx, reelEntries.length - 1);
    const entry = reelEntries[idx];
    const GRAD_BKGS = [
      'linear-gradient(135deg,#667eea,#764ba2)',
      'linear-gradient(135deg,#f7971e,#e74c3c)',
      'linear-gradient(135deg,#43e97b,#38f9d7)',
      'linear-gradient(135deg,#f093fb,#f5576c)',
      'linear-gradient(135deg,#4facfe,#00f2fe)',
      'linear-gradient(135deg,#a18cd1,#fbc2eb)',
    ];

    return (
      <Box>
        {/* Main card */}
        <Box
          key={entry.id}
          sx={{
            position: 'relative',
            borderRadius: 3,
            overflow: 'hidden',
            height: 460,
            background: entry.photoBase64 ? 'transparent' : GRAD_BKGS[idx % GRAD_BKGS.length],
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            animation: 'reelFadeIn 0.5s ease',
            '@keyframes reelFadeIn': { from: { opacity: 0, transform: 'scale(0.97)' }, to: { opacity: 1, transform: 'scale(1)' } },
          }}
        >
          {entry.photoBase64 && (
            <Box component="img" src={entry.photoBase64} alt=""
              sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          {/* Gradient overlay */}
          <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />

          {/* Content */}
          <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 3, color: 'white' }}>
            <Typography fontSize="2.5rem" lineHeight={1}>{entry.activityEmoji}</Typography>
            <Typography variant="h5" fontWeight={800} sx={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)', mt: 0.5 }}>
              {entry.activityName}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>{entry.dayLabel}</Typography>
            <Box mt={0.5}>
              {'⭐'.repeat(entry.rating)}
            </Box>
            {entry.note && (
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', opacity: 0.9, lineHeight: 1.4 }}>
                "{entry.note}"
              </Typography>
            )}
          </Box>

          {/* Counter chip */}
          <Chip
            label={`${idx + 1} / ${reelEntries.length}`}
            size="small"
            sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', fontWeight: 700 }}
          />
        </Box>

        {/* Progress dots */}
        <Box display="flex" justifyContent="center" gap={0.5} mt={1.5} flexWrap="wrap">
          {reelEntries.map((_, i) => (
            <Box key={i} onClick={() => { setReelIdx(i); setReelPlaying(false); }}
              sx={{ width: i === idx ? 20 : 8, height: 8, borderRadius: 4, bgcolor: i === idx ? '#667eea' : '#ddd', cursor: 'pointer', transition: 'all 0.3s' }} />
          ))}
        </Box>

        {/* Controls */}
        <Box display="flex" justifyContent="center" alignItems="center" gap={1} mt={2}>
          <IconButton onClick={() => { setReelIdx(Math.max(0, idx - 1)); setReelPlaying(false); }} disabled={idx === 0}>
            <PrevIcon />
          </IconButton>
          <IconButton
            onClick={() => setReelPlaying(p => !p)}
            sx={{ bgcolor: '#667eea', color: 'white', width: 52, height: 52, '&:hover': { bgcolor: '#764ba2' } }}
          >
            {reelPlaying ? <PauseIcon /> : <PlayIcon />}
          </IconButton>
          <IconButton onClick={() => { setReelIdx(Math.min(reelEntries.length - 1, idx + 1)); setReelPlaying(false); }} disabled={idx === reelEntries.length - 1}>
            <NextIcon />
          </IconButton>
          <Tooltip title="שתף את הרילס">
            <IconButton onClick={() => { setShareEntry(null); setShareOpen(true); }} sx={{ color: '#667eea' }}>
              <ShareIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    );
  };

  // ── AI expense summary ──
  const generateExpenseSummary = async (tripExpenses) => {
    const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || window.env?.REACT_APP_GEMINI_API_KEY;
    const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    if (!GEMINI_API_KEY) { showSnack('מפתח Gemini API חסר', 'error'); return; }

    setLoadingAiSummary(true);
    setAiSummary('');
    const total = tripExpenses.reduce((s, e) => s + e.amount, 0);
    const byCategory = {};
    tripExpenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
    const tripName = selectedTrip?.destination || 'הטיול';
    const days = selectedTrip?.days || 1;
    const catLines = Object.entries(byCategory)
      .map(([cat, amt]) => {
        const c = EXPENSE_CATS.find(x => x.id === cat);
        return `${c?.label || cat}: ₪${amt.toFixed(0)}`;
      }).join(', ');

    const prompt = `אתה יועץ פיננסי לטיולים. סכם את ההוצאות הבאות של טיול לישראל בעברית קצרה, ידידותית ועם אמוג'י רלוונטיים. ציין: מה ההוצאה הגדולה, מה הממוצע ליום, האם הוציא הרבה/מעט, טיפ חיסכון אחד.

טיול: ${tripName} (${days} ימים)
סה"כ: ₪${total.toFixed(0)}
פירוט: ${catLines || 'אין נתונים'}
מספר הוצאות: ${tripExpenses.length}

כתוב סיכום בעברית של 3-4 משפטים בלבד. ידידותי ומעניין.`;

    try {
      const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      setAiSummary(text);
    } catch {
      showSnack('שגיאה בייצור סיכום AI', 'error');
    } finally {
      setLoadingAiSummary(false);
    }
  };

  // ─── Budget tab ───────────────────────────────────────────────────────────────
  const renderBudgetTab = () => {
    if (!selectedTrip) return renderTripsEmpty();
    const tripExpenses = expenses.filter(e => String(e.tripId) === String(selectedTripId));
    const total = tripExpenses.reduce((s, e) => s + e.amount, 0);
    const budget = selectedTrip.budget || 0;

    // per-category totals
    const byCategory = {};
    tripExpenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
    const maxCat = Math.max(1, ...Object.values(byCategory));

    const days = selectedTrip?.days || 1;
    const avgPerDay = total / days;
    const topCat = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
    const topCatInfo = topCat ? EXPENSE_CATS.find(c => c.id === topCat[0]) : null;

    return (
      <Box>
        {/* Summary card */}
        <Paper elevation={2} sx={{ p: 2.5, borderRadius: 2, mb: 2, background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white' }}>
          <Typography variant="overline" sx={{ opacity: 0.8 }}>סה"כ הוצאות</Typography>
          <Typography variant="h3" fontWeight={800}>₪{total.toFixed(0)}</Typography>

          {/* Quick stats */}
          <Box display="flex" gap={2} mt={1.5} flexWrap="wrap">
            <Box>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>ממוצע ליום</Typography>
              <Typography variant="body1" fontWeight={700}>₪{avgPerDay.toFixed(0)}</Typography>
            </Box>
            {topCatInfo && (
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>הוצאה מובילה</Typography>
                <Typography variant="body1" fontWeight={700}>{topCatInfo.emoji} {topCatInfo.label}</Typography>
              </Box>
            )}
            <Box>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>מספר עסקאות</Typography>
              <Typography variant="body1" fontWeight={700}>{tripExpenses.length}</Typography>
            </Box>
          </Box>

          {budget > 0 && (
            <Box mt={1.5}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption">נוצל מהתקציב</Typography>
                <Typography variant="caption" fontWeight={700}>{Math.round((total / budget) * 100)}% מ-₪{budget}</Typography>
              </Box>
              <LinearProgress variant="determinate" value={Math.min(100, (total / budget) * 100)}
                sx={{ mt: 0.5, height: 8, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': { bgcolor: total > budget ? '#f5576c' : '#43e97b' } }} />
            </Box>
          )}
        </Paper>

        {/* AI Summary */}
        {tripExpenses.length > 0 && (
          <Paper elevation={1} sx={{ p: 2, borderRadius: 2, mb: 2, border: '1px solid #667eea33' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={aiSummary ? 1.5 : 0}>
              <Typography fontWeight={700}>🤖 סיכום AI</Typography>
              <Box display="flex" gap={1}>
                {aiSummary && (
                  <Tooltip title="שתף סיכום">
                    <IconButton size="small" onClick={() => {
                      setShareEntry({ activityEmoji: '💰', activityName: `סיכום הוצאות — ${selectedTrip?.destination || 'הטיול'}`, rating: 5, note: aiSummary });
                      setShareOpen(true);
                    }}>
                      <ShareIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Button size="small" variant="outlined" onClick={() => generateExpenseSummary(tripExpenses)}
                  disabled={loadingAiSummary}
                  startIcon={loadingAiSummary ? <CircularProgress size={14} /> : null}
                  sx={{ borderColor: '#667eea', color: '#667eea', fontSize: '0.75rem' }}>
                  {loadingAiSummary ? 'מנתח...' : aiSummary ? 'עדכן' : 'סכם הוצאות'}
                </Button>
              </Box>
            </Box>
            {aiSummary && (
              <Typography variant="body2" sx={{ lineHeight: 1.7, color: 'text.secondary', whiteSpace: 'pre-line' }}>
                {aiSummary}
              </Typography>
            )}
          </Paper>
        )}

        {/* Category breakdown */}
        {Object.keys(byCategory).length > 0 && (
          <Paper elevation={1} sx={{ p: 2, borderRadius: 2, mb: 2 }}>
            <Typography fontWeight={700} mb={1.5}>פירוט לפי קטגוריה</Typography>
            {EXPENSE_CATS.filter(c => byCategory[c.id]).map(cat => (
              <Box key={cat.id} mb={1.5}>
                <Box display="flex" justifyContent="space-between" mb={0.3}>
                  <Typography variant="body2">{cat.emoji} {cat.label}</Typography>
                  <Typography variant="body2" fontWeight={700}>₪{byCategory[cat.id].toFixed(0)}</Typography>
                </Box>
                <Box sx={{ height: 6, borderRadius: 3, bgcolor: '#eee', overflow: 'hidden' }}>
                  <Box sx={{ height: '100%', width: `${(byCategory[cat.id] / maxCat) * 100}%`, bgcolor: cat.color, borderRadius: 3, transition: 'width 0.6s ease' }} />
                </Box>
              </Box>
            ))}
          </Paper>
        )}

        {/* Expense list */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Typography fontWeight={700}>רשימת הוצאות ({tripExpenses.length})</Typography>
          <Button size="small" variant="contained" startIcon={<AddIcon />}
            onClick={() => setExpenseOpen(true)}
            sx={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', borderRadius: 2 }}>
            הוסף הוצאה
          </Button>
        </Box>

        {tripExpenses.length === 0 ? (
          <Box textAlign="center" py={5}>
            <MoneyIcon sx={{ fontSize: 52, color: '#ccc', mb: 1 }} />
            <Typography color="text.secondary">עדיין אין הוצאות רשומות</Typography>
          </Box>
        ) : (
          [...tripExpenses].reverse().map(exp => {
            const cat = EXPENSE_CATS.find(c => c.id === exp.category) || EXPENSE_CATS[EXPENSE_CATS.length - 1];
            return (
              <Paper key={exp.id} elevation={1} sx={{ p: 1.5, mb: 1, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: cat.color + '22', width: 38, height: 38, fontSize: 18 }}>{cat.emoji}</Avatar>
                <Box flex={1}>
                  <Typography fontWeight={700} variant="body2">{cat.label}{exp.note ? ` — ${exp.note}` : ''}</Typography>
                  <Typography variant="caption" color="text.secondary">{new Date(exp.date).toLocaleDateString('he-IL')}</Typography>
                </Box>
                <Typography fontWeight={800} color={cat.color} sx={{ flexShrink: 0 }}>₪{exp.amount.toFixed(0)}</Typography>
                <IconButton size="small" color="error" onClick={() => deleteExpense(exp.id)}><DeleteIcon fontSize="small" /></IconButton>
              </Paper>
            );
          })
        )}
      </Box>
    );
  };

  // ─── Achievements tab ─────────────────────────────────────────────────────────
  const renderAchievementsTab = () => {
    if (!selectedTrip) return renderTripsEmpty();
    const badges = computeBadges(tripEntries);
    const earned = badges.filter(b => b.earned);
    const pct = Math.round((earned.length / badges.length) * 100);

    return (
      <Box>
        {/* Progress */}
        <Paper elevation={2} sx={{ p: 2.5, mb: 2, borderRadius: 2, background: 'linear-gradient(135deg,#f7971e,#e74c3c)', color: 'white' }}>
          <Typography variant="overline" sx={{ opacity: 0.8 }}>הישגים שנצברו</Typography>
          <Typography variant="h3" fontWeight={800}>{earned.length}/{badges.length}</Typography>
          <LinearProgress variant="determinate" value={pct}
            sx={{ mt: 1, height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.3)',
              '& .MuiLinearProgress-bar': { bgcolor: 'white' } }} />
          <Typography variant="caption" sx={{ opacity: 0.9, mt: 0.5, display: 'block' }}>
            {pct}% הושלמו {pct === 100 ? '🎉 מושלם!' : '— המשך לצבור!'}
          </Typography>
        </Paper>

        {/* Earned */}
        {earned.length > 0 && (
          <Box mb={2}>
            <Typography fontWeight={700} mb={1}>🏆 הושגו</Typography>
            <Box display="flex" flexWrap="wrap" gap={1.5}>
              {earned.map(b => (
                <Paper key={b.id} elevation={2} sx={{
                  p: 1.5, borderRadius: 2, textAlign: 'center', minWidth: 90,
                  background: 'linear-gradient(135deg,#43e97b22,#38f9d722)',
                  border: '2px solid #43e97b',
                  animation: 'badgePop 0.4s ease',
                  '@keyframes badgePop': { from: { transform: 'scale(0.8)', opacity: 0 }, to: { transform: 'scale(1)', opacity: 1 } },
                }}>
                  <Typography fontSize="2rem">{b.emoji}</Typography>
                  <Typography variant="caption" fontWeight={700} display="block">{b.label}</Typography>
                  <Typography variant="caption" color="text.secondary" fontSize="0.65rem">{b.desc}</Typography>
                </Paper>
              ))}
            </Box>
          </Box>
        )}

        {/* Locked */}
        <Typography fontWeight={700} mb={1} color="text.secondary">🔒 עדיין נעולים</Typography>
        <Box display="flex" flexWrap="wrap" gap={1.5}>
          {badges.filter(b => !b.earned).map(b => (
            <Paper key={b.id} elevation={0} sx={{
              p: 1.5, borderRadius: 2, textAlign: 'center', minWidth: 90,
              bgcolor: '#f5f5f5', border: '2px dashed #ddd', opacity: 0.7,
            }}>
              <Typography fontSize="2rem" sx={{ filter: 'grayscale(1)' }}>{b.emoji}</Typography>
              <Typography variant="caption" fontWeight={700} display="block" color="text.secondary">{b.label}</Typography>
              <Typography variant="caption" color="text.disabled" fontSize="0.65rem">{b.desc}</Typography>
            </Paper>
          ))}
        </Box>
      </Box>
    );
  };

  // ─── main render ─────────────────────────────────────────────────────────────

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea11 0%, #764ba211 100%)', pb: 10 }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          pt: { xs: 10, md: 4 },
          pb: 3,
          px: 2,
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" fontWeight={800} gutterBottom>
          📓 יומן מסע
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          תעד את הרגעים, דרג את הפעילויות, שמור זיכרונות
        </Typography>
      </Box>

      <Box sx={{ maxWidth: 680, mx: 'auto', px: 2, mt: 3 }}>
        {/* Trip selector */}
        {savedTrips.length > 0 && (
          <Paper elevation={2} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>בחר טיול</InputLabel>
              <Select
                value={selectedTripId}
                label="בחר טיול"
                onChange={(e) => { setSelectedTripId(e.target.value); setSelectedDayIdx(0); }}
              >
                {savedTrips.map((t) => (
                  <MenuItem key={t.id} value={String(t.id)}>
                    {t.destination || t.name || `טיול ${t.id}`}
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      · {t.days || '?'} ימים
                    </Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
        )}

        {/* Tabs */}
        <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden', mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => { setActiveTab(v); setReelPlaying(false); }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ '& .MuiTab-root': { fontWeight: 700, minWidth: 80 }, '& .Mui-selected': { color: '#667eea' }, '& .MuiTabs-indicator': { bgcolor: '#667eea' } }}
          >
            <Tab icon={<TodayIcon />} label="היום" iconPosition="start" />
            <Tab icon={<StoryIcon />} label="סיפור" iconPosition="start" />
            <Tab icon={<ReelIcon />} label="רילס" iconPosition="start" />
            <Tab icon={<MoneyIcon />} label="הוצאות" iconPosition="start" />
            <Tab icon={<span style={{fontSize:'1.1rem'}}>🏆</span>} label="הישגים" iconPosition="start" />
          </Tabs>
        </Paper>

        {loadingEntries ? (
          <Box textAlign="center" py={6}><CircularProgress /></Box>
        ) : (
          <>
            {activeTab === 0 && renderTodayTab()}
            {activeTab === 1 && renderStoryTab()}
            {activeTab === 2 && renderReelTab()}
            {activeTab === 3 && renderBudgetTab()}
            {activeTab === 4 && renderAchievementsTab()}
          </>
        )}
      </Box>

      {/* Check-in Dialog */}
      <Dialog open={!!checkinAct} onClose={() => setCheckinAct(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <JournalIcon />
          צ׳ק-אין: {checkinAct?.name}
          <IconButton onClick={() => setCheckinAct(null)} sx={{ ml: 'auto', color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography fontWeight={600} mb={0.5}>דירוג</Typography>
              <Rating
                value={checkinRating}
                onChange={(_, v) => setCheckinRating(v || 1)}
                size="large"
                icon={<StarIcon fontSize="large" />}
              />
            </Box>
            <TextField
              label="הערות (אופציונלי)"
              multiline
              rows={3}
              value={checkinNote}
              onChange={(e) => setCheckinNote(e.target.value)}
              placeholder="מה חשבת? מה היה מיוחד?"
              fullWidth
            />
            <Box>
              <Typography fontWeight={600} mb={1}>תמונה (אופציונלי)</Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoIcon />}
                sx={{ borderColor: '#667eea', color: '#667eea' }}
              >
                העלה תמונה
                <input type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
              </Button>
              {checkinPhoto && (
                <Box
                  component="img"
                  src={checkinPhoto}
                  alt="preview"
                  sx={{ display: 'block', mt: 1.5, maxHeight: 180, borderRadius: 2, objectFit: 'cover', maxWidth: '100%' }}
                />
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setCheckinAct(null)} variant="outlined">ביטול</Button>
          <Button
            onClick={handleSaveCheckin}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : <CheckIcon />}
            sx={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}
          >
            שמור צ׳ק-אין
          </Button>
        </DialogActions>
      </Dialog>

      {/* Trip Report Card Dialog */}
      <Dialog open={reportOpen} onClose={() => setReportOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ background: 'linear-gradient(135deg,#f7971e,#e74c3c)', color: 'white', pb: 1 }}>
          📊 דוח טיול — {selectedTrip?.destination || 'הטיול שלי'}
          <IconButton onClick={() => setReportOpen(false)} sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {loadingReport ? (
            <Box textAlign="center" py={5}>
              <CircularProgress sx={{ color: '#f7971e' }} />
              <Typography mt={2} color="text.secondary">AI מנתח את הטיול שלך...</Typography>
            </Box>
          ) : reportCard ? (
            <Box>
              {/* Overall grade */}
              <Box textAlign="center" mb={3}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 90, height: 90, borderRadius: '50%', border: `4px solid ${gradeColor(reportCard.overall)}`,
                  bgcolor: gradeColor(reportCard.overall) + '22', mb: 1 }}>
                  <Typography variant="h3" fontWeight={900} sx={{ color: gradeColor(reportCard.overall) }}>
                    {reportCard.overall}
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight={600} color="text.secondary">
                  {reportCard.overallComment}
                </Typography>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Per-category grades */}
              <Box display="flex" flexDirection="column" gap={1.5} mb={2}>
                {(reportCard.grades || []).map((g, i) => (
                  <Box key={i} display="flex" alignItems="center" gap={1.5}>
                    <Typography fontSize="1.4rem">{g.emoji}</Typography>
                    <Box flex={1}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" fontWeight={700}>{g.category}</Typography>
                        <Chip label={g.grade} size="small"
                          sx={{ bgcolor: gradeColor(g.grade), color: 'white', fontWeight: 800, height: 22 }} />
                      </Box>
                      <Typography variant="caption" color="text.secondary">{g.comment}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>

              <Divider sx={{ mb: 2 }} />

              {reportCard.highlight && (
                <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#fff8e1', borderRadius: 2, mb: 1.5 }}>
                  <Typography variant="body2">⭐ <strong>הרגע הכי טוב:</strong> {reportCard.highlight}</Typography>
                </Paper>
              )}
              {reportCard.recommendation && (
                <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#e8f5e9', borderRadius: 2 }}>
                  <Typography variant="body2">✈️ <strong>לטיול הבא:</strong> {reportCard.recommendation}</Typography>
                </Paper>
              )}
            </Box>
          ) : null}
        </DialogContent>
        {reportCard && (
          <DialogActions sx={{ p: 2 }}>
            <Button variant="contained" startIcon={<ShareIcon />}
              onClick={() => {
                const text = `📊 דוח טיול ${selectedTrip?.destination || ''}\nציון כללי: ${reportCard.overall}\n${(reportCard.grades||[]).map(g=>`${g.emoji} ${g.category}: ${g.grade}`).join('\n')}`;
                setShareEntry({ activityEmoji: '📊', activityName: `דוח טיול — ${selectedTrip?.destination}`, rating: 5, note: text });
                setReportOpen(false); setShareOpen(true);
              }}
              sx={{ background: 'linear-gradient(135deg,#f7971e,#e74c3c)' }}>
              שתף את הדוח
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Add Expense Dialog */}
      <Dialog open={expenseOpen} onClose={() => setExpenseOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white' }}>
          💸 הוסף הוצאה
          <IconButton onClick={() => setExpenseOpen(false)} sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2}>
            <TextField
              label="סכום (₪)" type="number" fullWidth
              value={newExp.amount} onChange={e => setNewExp(p => ({ ...p, amount: e.target.value }))}
              inputProps={{ min: 0 }} autoFocus
            />
            <FormControl fullWidth>
              <InputLabel>קטגוריה</InputLabel>
              <Select value={newExp.category} label="קטגוריה" onChange={e => setNewExp(p => ({ ...p, category: e.target.value }))}>
                {EXPENSE_CATS.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.emoji} {c.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="הערה (אופציונלי)" fullWidth
              value={newExp.note} onChange={e => setNewExp(p => ({ ...p, note: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setExpenseOpen(false)} variant="outlined">ביטול</Button>
          <Button onClick={addExpense} variant="contained" disabled={!newExp.amount}
            sx={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
            הוסף
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog — all platforms */}
      <ShareTripDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        label={shareLabel}
        shareUrl={`${window.location.origin}/journal`}
      />

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TravelJournalPage;
