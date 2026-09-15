import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Container, Typography, TextField, Button, Paper, Stepper, Step, StepLabel,
  Chip, IconButton, Card, CardContent, LinearProgress, Divider, Tooltip,
  Alert, Collapse, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  TravelExplore as DiscoverIcon,
  AutoAwesome as AIIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Remove as RemoveIcon,
  Hotel as HotelIcon,
  Star as StarIcon,
  OpenInNew as OpenInNewIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  WbSunny as WeatherIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { discoverRouteStops } from '../services/rollingTripService';
import { generateItinerary } from '../services/aiItineraryService';
import { useTripSave } from '../contexts/TripSaveContext';
import { getPlacePhoto } from '../services/photoService';
import ImageCredit from '../components/common/ImageCredit';
import { getStopWeatherSummary } from '../services/openMeteoService';
import { analyzeItinerary, summarizeAnalysis, autoOptimize } from '../services/dayOptimizerService';
import RouteShapeMap from '../components/rolling/RouteShapeMap';
import { analyzeRoute, formatDuration } from '../services/routeGeometryService';
import { geminiEndpoint, GEMINI_MODELS } from '../services/geminiClient';
import bookingLinks from '../utils/bookingLinks';

import { noflip } from '../utils/noflip';

// תוויות העומס לפי הציון שהשירות מחזיר. הטקסט היה בשירות, בעברית קשיחה,
// והופיע כך גם כשהממשק באנגלית.
const LOAD_LABEL = { green: 'rolling.full.loadGreen', yellow: 'rolling.full.loadYellow', red: 'rolling.full.loadRed' };
const LOAD_WARNING = { yellow: 'rolling.full.warnYellow', red: 'rolling.full.warnRed' };
// ─── קבועים ────────────────────────────────────────────────────

const PACE_OPTIONS = [
  { value: 'slow',   emoji: '🐢' },
  { value: 'medium', emoji: '🚶' },
  { value: 'fast',   emoji: '🏃' },
];

const INTEREST_OPTIONS = [
  { value: 'nature',      emoji: '🌿' },
  { value: 'culture',     emoji: '🏛️' },
  { value: 'food',        emoji: '🍽️' },
  { value: 'adventure',   emoji: '🧗' },
  { value: 'history',     emoji: '🏰' },
  { value: 'beach',       emoji: '🏖️' },
  { value: 'wine',        emoji: '🍷' },
  { value: 'castles',     emoji: '🏯' },
];

const ACT_TYPES = [
  { type: 'attraction', emoji: '🏛️' },
  { type: 'food',       emoji: '🍽️' },
  { type: 'nature',     emoji: '🌿' },
  { type: 'museum',     emoji: '🖼️' },
  { type: 'winery',     emoji: '🍷' },
  { type: 'castle',     emoji: '🏰' },
  { type: 'beach',      emoji: '🏖️' },
  { type: 'shopping',   emoji: '🛍️' },
  { type: 'nightlife',  emoji: '🌙' },
  { type: 'rest',       emoji: '☕' },
];

const TYPE_COLORS = {
  city:      '#667eea',
  nature:    '#43e97b',
  viewpoint: '#f093fb',
  historic:  '#fa709a',
  beach:     '#4facfe',
  adventure: '#f5af19',
  food:      '#f5576c',
};

const STOP_TYPES = ['city', 'nature', 'viewpoint', 'historic', 'beach', 'adventure', 'food'];

const STEPS = ['define', 'discover', 'adjust', 'full'];

// ─── קומפוננטה ראשית ────────────────────────────────────────────

export default function RollingTripPage() {
  // ── הממשק מתורגם; התוכן שה-AI מייצר נשאר בעברית ──
  // עד 14.09.2026 המסך כולו היה עברית קשיחה (~90 מחרוזות, STATUS סעיף 12),
  // ובאנגלית או בצרפתית נשאר בעברית. שפת התוכן היא החלטה נפרדת שמתוזמנת
  // להשקה (זיכרון i18n-decision-pending) — הפרומפטים כאן לא שונו.
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { saveTripToList } = useTripSave();

  // ── Step 1
  const [startPoint, setStartPoint]   = useState('');
  const [endPoint,   setEndPoint]     = useState('');
  const [waypoints,  setWaypoints]    = useState(['']);
  const [pace,       setPace]         = useState('medium');
  const [interests,  setInterests]    = useState([]);
  const [startDate,  setStartDate]    = useState('');

  // ── Step 2 / 3
  const [activeStep,  setActiveStep]  = useState(0);
  const [stops,       setStops]       = useState([]);
  const [daysPerStop, setDaysPerStop] = useState({});
  const [loading,     setLoading]     = useState(false);
  const [loadingMsg,  setLoadingMsg]  = useState('');
  const [error,       setError]       = useState('');
  const [stopPhotos,  setStopPhotos]  = useState({});   // { idx: url|null }
  const [stopWeather, setStopWeather] = useState({});   // { idx: {avgMin,avgMax,emoji} }

  // ── Step 4
  const [fullItinerary,     setFullItinerary]     = useState([]);
  const [buildingItinerary, setBuildingItinerary] = useState(false);
  const [buildProgress,     setBuildProgress]     = useState(0);
  const [expandedStop,      setExpandedStop]      = useState(null);
  const [saving,            setSaving]            = useState(false);
  const [optimizeMsg,       setOptimizeMsg]       = useState('');
  // עריכת פעילויות בשלב 4
  const [editingAct,  setEditingAct]  = useState(null);  // { si, di, ai }
  const [newActForm,  setNewActForm]  = useState(null);  // { si, di } – where to add
  const [newActData,  setNewActData]  = useState({ time: '10:00', name: '', type: 'attraction', description: '' });

  // ביטויים מקומיים
  const [phrasesStop,    setPhraseStop]    = useState(null);   // { name, country }
  const [phrasesData,    setPhrasesData]   = useState([]);     // [{ phrase, translation, pronunciation }]
  const [phrasesLoading, setPhrasesLoading] = useState(false);
  const [phrasesOpen,    setPhrasesOpen]   = useState(false);

  const photoFetched = useRef({});
  const weatherFetched = useRef({});

  // ── ניתוח עומס ימים (Smart Optimizer)
  const itineraryAnalysis = useMemo(() => analyzeItinerary(fullItinerary), [fullItinerary]);
  const optimizeSummary   = useMemo(() => summarizeAnalysis(itineraryAnalysis), [itineraryAnalysis]);

  // ── נגזרות
  const totalDays   = Object.values(daysPerStop).reduce((s, d) => s + d, 0);
  const activeStops = stops.filter((_, i) => (daysPerStop[i] ?? stops[i]?.recommendedDays ?? 1) > 0);

  // ── טעינת תמונות ומזג אוויר כשעצירות נטענות
  useEffect(() => {
    if (!stops.length) return;

    let dayOffset = 0;
    stops.forEach(async (stop, idx) => {
      const days = stop.recommendedDays ?? 1;

      // תמונה
      if (!photoFetched.current[idx]) {
        photoFetched.current[idx] = true;
        const url = await getPlacePhoto(stop.nameEn || stop.name, stop.country);
        setStopPhotos(prev => ({ ...prev, [idx]: url }));
      }

      // מזג אוויר — רק אם יש תאריך התחלה ו-lat/lng
      if (startDate && stop.lat && stop.lng && !weatherFetched.current[idx]) {
        weatherFetched.current[idx] = true;
        const stopStart = new Date(startDate);
        stopStart.setDate(stopStart.getDate() + dayOffset);
        const weather = await getStopWeatherSummary(
          stop.lat, stop.lng, stopStart.toISOString().split('T')[0], days
        );
        if (weather) setStopWeather(prev => ({ ...prev, [idx]: weather }));
      }

      dayOffset += days;
    });
  }, [stops, startDate]); // eslint-disable-line

  // ── ניווט בעצירות ביניים
  const addWaypoint    = ()       => { if (waypoints.length < 3) setWaypoints([...waypoints, '']); };
  const removeWaypoint = (i)      => setWaypoints(waypoints.filter((_, idx) => idx !== i));
  const updateWaypoint = (i, val) => { const n = [...waypoints]; n[i] = val; setWaypoints(n); };
  const toggleInterest = (val)    => setInterests(prev =>
    prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]
  );

  // ── גילוי מסלול
  const handleDiscover = async () => {
    if (!startPoint.trim() || !endPoint.trim()) { setError(t('rolling.err.missingEnds')); return; }
    setError('');
    setLoading(true);
    setStopPhotos({});
    setStopWeather({});
    photoFetched.current = {};
    weatherFetched.current = {};
    setActiveStep(1);

    const msgs = [
      t('rolling.loading.scan'), t('rolling.loading.cities'),
      t('rolling.loading.attractions'), t('rolling.loading.order'),
    ];
    let mi = 0;
    setLoadingMsg(msgs[0]);
    const iv = setInterval(() => { mi = (mi + 1) % msgs.length; setLoadingMsg(msgs[mi]); }, 2500);

    try {
      const result = await discoverRouteStops(
        startPoint.trim(), endPoint.trim(), waypoints.filter(Boolean), { pace, interests }
      );
      clearInterval(iv);
      const initialDays = {};
      result.forEach((stop, i) => { initialDays[i] = stop.recommendedDays ?? 1; });
      setStops(result);
      setDaysPerStop(initialDays);
      setActiveStep(2);
    } catch (err) {
      clearInterval(iv);
      setError(
        err.message === 'NO_API_KEY'  ? t('rolling.err.noKey') :
        err.message === 'RATE_LIMIT'  ? t('rolling.err.rateLimit') :
        err.message === 'TIMEOUT'     ? t('rolling.err.timeout') :
        // "לא בדקנו" ולא "אין כאן": תשובה ריקה היא כשל של ה-AI, לא מסלול
        // בלי עצירות, ולכן הניסוח מסתיים בהזמנה לנסות שוב.
        err.message === 'EMPTY_ROUTE' ? t('rolling.err.emptyRoute', { from: startPoint.trim(), to: endPoint.trim() }) :
        t('rolling.err.generic')
      );
      setActiveStep(0);
    } finally {
      setLoading(false);
    }
  };

  const routeAnalysis = React.useMemo(() => analyzeRoute(stops), [stops]);

  const adjustDays = (idx, delta) => setDaysPerStop(prev => ({
    ...prev, [idx]: Math.max(0, Math.min(10, (prev[idx] ?? stops[idx]?.recommendedDays ?? 1) + delta)),
  }));
  const removeStop = (idx) => setDaysPerStop(prev => ({ ...prev, [idx]: 0 }));

  // ── בניית מסלול מפורט
  const buildFullItinerary = useCallback(async () => {
    setBuildingItinerary(true);
    setBuildProgress(0);
    setFullItinerary([]);
    setExpandedStop(null);

    const stopsWithDays = stops
      .map((stop, i) => ({ stop, days: daysPerStop[i] ?? stop.recommendedDays ?? 1 }))
      .filter(({ days }) => days > 0);

    const results = [];
    try {
      for (let idx = 0; idx < stopsWithDays.length; idx++) {
        const { stop, days } = stopsWithDays[idx];
        try {
          const itinerary = await generateItinerary({
            destination: `${stop.nameEn || stop.name}, ${stop.country}`,
            days, interests, budget: 'medium',
          });
          results.push({ stop, days, itinerary });
        } catch {
          results.push({ stop, days, itinerary: null });
        }
        setBuildProgress(Math.round(((idx + 1) / stopsWithDays.length) * 100));
      }
      setFullItinerary(results);
      setActiveStep(3);
      setExpandedStop(0);
    } finally {
      setBuildingItinerary(false);
    }
  }, [stops, daysPerStop, interests]);

  // ── עריכת פעילויות (שלב 4)
  const deleteActivity = (si, di, ai) => {
    setFullItinerary(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next[si].itinerary[di].activities.splice(ai, 1);
      return next;
    });
  };

  const updateActivity = (si, di, ai, field, value) => {
    setFullItinerary(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next[si].itinerary[di].activities[ai][field] = value;
      return next;
    });
  };

  const commitAddActivity = (si, di) => {
    if (!newActData.name.trim()) return;
    const typeInfo = ACT_TYPES.find(x => x.type === newActData.type) || ACT_TYPES[0];
    const act = {
      time: newActData.time,
      name: newActData.name.trim(),
      type: newActData.type,
      emoji: typeInfo.emoji,
      description: newActData.description.trim(),
      tips: '', price: '', address: '', lat: 0, lng: 0,
    };
    setFullItinerary(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next[si].itinerary[di].activities.push(act);
      return next;
    });
    setNewActForm(null);
    setNewActData({ time: '10:00', name: '', type: 'attraction', description: '' });
  };

  // ── ביטויים מקומיים ──
  const fetchLocalPhrases = async (stop) => {
    const GEMINI_URL = geminiEndpoint(GEMINI_MODELS.content);
    setPhraseStop(stop);
    setPhrasesData([]);
    setPhrasesLoading(true);
    setPhrasesOpen(true);

    const prompt = `תן לי 10 ביטויים שימושיים לתייר ישראלי ב${stop.name}, ${stop.country}.
החזר JSON בלבד (ללא markdown):
[
  { "category": "ברכות", "phrase": "Bonjour", "translation": "שלום", "pronunciation": "בון-ז'ור" },
  ...
]
קטגוריות: ברכות, הזמנת אוכל, כיוונים, קניות, חירום, תחבורה, מחמאות, בילוי. השתמש בשפה המקומית של ${stop.country}.`;

    try {
      const res = await fetch(GEMINI_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      const data = await res.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setPhrasesData(JSON.parse(text));
    } catch { setPhrasesData([]); }
    finally { setPhrasesLoading(false); }
  };

  const getMapUrl = () => {
    const pts = [startPoint, ...waypoints.filter(Boolean), endPoint]
      .map(p => encodeURIComponent(p)).join('/');
    return `https://www.google.com/maps/dir/${pts}`;
  };

  // ══════════════════════════════════════════════════════════════
  // STEP 1 — הגדרת מסלול
  // ══════════════════════════════════════════════════════════════
  const renderStep1 = () => (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: '#667eea' }}>
        🗺️ {t('rolling.define.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        {t('rolling.define.subtitle')}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        <TextField
          label={t('rolling.define.start')} placeholder={t('rolling.define.example', { place: 'Paris, France' })}
          value={startPoint} onChange={e => setStartPoint(e.target.value)}
          fullWidth onKeyDown={e => e.key === 'Enter' && handleDiscover()}
          InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>🚀</Typography> }}
        />

        {waypoints.map((wp, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              label={t('rolling.define.waypoint', { n: i + 1 })} placeholder={t('rolling.define.example', { place: 'Lyon, France' })}
              value={wp} onChange={e => updateWaypoint(i, e.target.value)}
              fullWidth
              InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>📍</Typography> }}
            />
            <IconButton onClick={() => removeWaypoint(i)} color="error" size="small"><CloseIcon /></IconButton>
          </Box>
        ))}

        {waypoints.length < 3 && (
          <Button startIcon={<AddIcon />} onClick={addWaypoint} variant="outlined" size="small"
            sx={{ alignSelf: 'flex-start', borderStyle: 'dashed' }}>
            {t('rolling.define.addWaypoint')}
          </Button>
        )}

        <TextField
          label={t('rolling.define.end')} placeholder={t('rolling.define.example', { place: 'Rome, Italy' })}
          value={endPoint} onChange={e => setEndPoint(e.target.value)}
          fullWidth onKeyDown={e => e.key === 'Enter' && handleDiscover()}
          InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>🏁</Typography> }}
        />

        {/* תאריך יציאה — לתחזית מזג אוויר */}
        <TextField
          label={t('rolling.define.date')}
          type="date" value={startDate}
          onChange={e => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: new Date().toISOString().split('T')[0] }}
          helperText={t('rolling.define.dateHelp')}
          fullWidth
          InputProps={{ startAdornment: <WeatherIcon sx={{ mr: 1, color: '#667eea', fontSize: 20 }} /> }}
        />
      </Box>

      {/* קצב */}
      <Typography variant="subtitle2" fontWeight={600} mb={1}>{t('rolling.define.pace')}</Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        {PACE_OPTIONS.map(opt => (
          <Paper key={opt.value} onClick={() => setPace(opt.value)} sx={{
            p: 1.5, cursor: 'pointer', flex: 1, minWidth: 100, textAlign: 'center',
            border: pace === opt.value ? '2px solid #667eea' : '2px solid transparent',
            background: pace === opt.value ? 'linear-gradient(135deg, #667eea22, #764ba222)' : undefined,
            transition: 'all 0.2s', '&:hover': { borderColor: '#667eea88' },
          }}>
            <Typography fontSize={24}>{opt.emoji}</Typography>
            <Typography variant="body2" fontWeight={600}>{t(`rolling.pace.${opt.value}`)}</Typography>
            <Typography variant="caption" color="text.secondary">{t(`rolling.pace.${opt.value}Desc`)}</Typography>
          </Paper>
        ))}
      </Box>

      {/* תחומי עניין */}
      <Typography variant="subtitle2" fontWeight={600} mb={1}>{t('rolling.define.interests')}</Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        {INTEREST_OPTIONS.map(opt => (
          <Chip key={opt.value} label={`${opt.emoji} ${t(`rolling.interest.${opt.value}`)}`}
            onClick={() => toggleInterest(opt.value)}
            color={interests.includes(opt.value) ? 'primary' : 'default'}
            variant={interests.includes(opt.value) ? 'filled' : 'outlined'}
            sx={{ fontWeight: interests.includes(opt.value) ? 700 : 400 }}
          />
        ))}
      </Box>

      <Collapse in={!!error}><Alert severity="error" sx={{ mb: 2 }}>{error}</Alert></Collapse>

      <Button variant="contained" size="large" fullWidth startIcon={<DiscoverIcon />}
        onClick={handleDiscover} disabled={loading}
        sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', py: 1.5, fontSize: '1.1rem', fontWeight: 700, borderRadius: 3 }}>
        {t('rolling.define.discover')} 🔍
      </Button>
    </Box>
  );

  // ══════════════════════════════════════════════════════════════
  // STEP 2 — טעינה
  // ══════════════════════════════════════════════════════════════
  const renderStep2 = () => (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <Typography fontSize={64} mb={2} sx={{
        animation: 'float 2s ease-in-out infinite',
        '@keyframes float': { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-14px)' } },
      }}>✈️</Typography>
      <Typography variant="h5" fontWeight={700} mb={1}>{t('rolling.loading.title')}</Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>{loadingMsg}</Typography>
      <LinearProgress sx={{ borderRadius: 4, height: 8, maxWidth: 400, mx: 'auto',
        '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #667eea, #764ba2)' } }} />
      <Typography variant="caption" color="text.secondary" mt={2} display="block">
        {startPoint} → {endPoint}
      </Typography>
    </Box>
  );

  // ══════════════════════════════════════════════════════════════
  // STEP 3 — התאמת עצירות
  // ══════════════════════════════════════════════════════════════
  const renderStep3 = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: '#667eea' }}>🛣️ {t('rolling.stops.title')}</Typography>
        <Chip label={t('rolling.stops.total', { days: totalDays, stops: activeStops.length })}
          sx={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontWeight: 700 }} />
      </Box>

      {/* מסלול ויזואלי */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', mb: 3, background: 'linear-gradient(135deg,#667eea11,#764ba211)', border: '1px solid #667eea33' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee' }}>
          <Typography fontWeight={700} color="#667eea">🗺️ {t('rolling.stops.route')}</Typography>
          <Button size="small" variant="outlined" href={getMapUrl()} target="_blank" rel="noopener noreferrer"
            sx={{ borderColor: '#667eea', color: '#667eea', fontSize: '0.75rem' }}>
            {t('rolling.stops.openMaps')} ↗
          </Button>
        </Box>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', flexWrap: 'nowrap' }}>
          {[startPoint, ...stops.map(s => s.name), endPoint].filter(Boolean).map((pt, i, arr) => (
            <React.Fragment key={i}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, minWidth: 70 }}>
                <Box sx={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: i === 0 || i === arr.length - 1 ? 'linear-gradient(135deg,#667eea,#764ba2)' : 'white',
                  border: '2px solid #667eea', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: i === 0 || i === arr.length - 1 ? 'white' : '#667eea',
                }}>
                  {i === 0 ? '✈' : i === arr.length - 1 ? '🏁' : stops[i - 1]?.emoji || '📍'}
                </Box>
                <Typography variant="caption" fontWeight={600} textAlign="center" sx={{ mt: 0.5, maxWidth: 64, lineHeight: 1.2, wordBreak: 'break-word' }}>
                  {pt}
                </Typography>
              </Box>
              {i < arr.length - 1 && (
                <Box sx={{ height: 2, flex: 1, minWidth: 20, background: 'linear-gradient(90deg,#667eea,#764ba2)', borderRadius: 1, mb: 2.5 }} />
              )}
            </React.Fragment>
          ))}
        </Box>
      </Paper>

      {/* צורת המסלול. תוספת בלבד — הזרימה, השמירה והמעבר לתכנון
          נותרו כשהיו. */}
      <RouteShapeMap stops={stops} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        {stops.map((stop, idx) => {
          const days    = daysPerStop[idx] ?? stop.recommendedDays ?? 1;
          const removed = days === 0;
          // כמה מוסיפה התחנה לעומת נסיעה ישירה מהקודמת לבאה. זהו הנתון
          // שחסר להחלטה אם להשאיר אותה, והוא לא הוצג עד כה כלל.
          const detour  = routeAnalysis[idx];
          const photo   = stopPhotos[idx];
          const weather = stopWeather[idx];
          const color   = TYPE_COLORS[stop.type] || '#667eea';

          return (
            <Card key={idx} sx={{
              borderRadius: 3, opacity: removed ? 0.35 : 1,
              border: removed ? '1px dashed #ccc' : `2px solid ${color}33`,
              transition: 'all 0.3s', overflow: 'hidden',
            }}>
              {/* תמונה */}
              {photo && !removed && (
                <Box sx={{
                  height: 120, overflow: 'hidden', position: 'relative',
                  background: `url(${photo}) center/cover no-repeat`,
                }}>
                  <Box sx={{
                    position: 'absolute', inset: 0,
                    background: `linear-gradient(to bottom, transparent 40%, ${color}cc 100%)`,
                  }} />
                  {/* למעלה ולא למטה: בתחתית יושבים שם העצירה והסוג */}
                  <ImageCredit src={photo} sx={{ top: 2, bottom: 'auto' }}
                    onNonFree={() => setStopPhotos((p) => ({ ...p, [idx]: null }))} />
                  <Box sx={{ position: 'absolute', bottom: 8, right: noflip('10px'), display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography sx={{ color: 'white', fontWeight: 800, fontSize: 18, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                      {stop.emoji} {stop.name}
                    </Typography>
                    <Chip label={STOP_TYPES.includes(stop.type) ? t(`rolling.stopType.${stop.type}`) : stop.type} size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: 'white', fontWeight: 700, fontSize: '0.65rem' }} />
                  </Box>
                  {/* מזג אוויר */}
                  {weather && (
                    <Box sx={{
                      position: 'absolute', top: 8, left: noflip('10px'),
                      bgcolor: 'rgba(0,0,0,0.45)', borderRadius: 2, px: 1, py: 0.3,
                      display: 'flex', alignItems: 'center', gap: 0.5,
                    }}>
                      <Typography fontSize={14}>{weather.emoji}</Typography>
                      <Typography variant="caption" sx={{ color: 'white', fontWeight: 700 }}>
                        {weather.avgMin}°–{weather.avgMax}°
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              <CardContent sx={{ pb: '12px !important' }}>
                {/* כותרת ללא תמונה */}
                {(!photo || removed) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: `linear-gradient(135deg, ${color}, #764ba2)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: 12, fontWeight: 700,
                    }}>{idx + 1}</Box>
                    <Typography fontSize={22}>{stop.emoji}</Typography>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>{stop.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{stop.country}</Typography>
                    </Box>
                    <Chip label={STOP_TYPES.includes(stop.type) ? t(`rolling.stopType.${stop.type}`) : stop.type} size="small"
                      sx={{ background: `${color}22`, color, fontWeight: 600, fontSize: '0.7rem' }} />
                    {weather && (
                      <Chip label={`${weather.emoji} ${weather.avgMin}°–${weather.avgMax}°`} size="small"
                        sx={{ fontSize: '0.65rem', bgcolor: '#e3f2fd', color: '#1565c0' }} />
                    )}
                  </Box>
                )}

                {/* בורר ימים + מחיקה */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: photo && !removed ? 0 : 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => adjustDays(idx, -1)} disabled={days === 0}><RemoveIcon fontSize="small" /></IconButton>
                    <Typography fontWeight={700} minWidth={36} textAlign="center" fontSize={13}>
                      {days === 0 ? t('rolling.stops.removed') : t('rolling.stops.days', { count: days })}
                    </Typography>
                    <IconButton size="small" onClick={() => adjustDays(idx, 1)} disabled={days === 10}><AddIcon fontSize="small" /></IconButton>
                  </Box>
                  <Tooltip title={t('rolling.stops.remove')}>
                    <IconButton size="small" onClick={() => removeStop(idx)} color="error"><CloseIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </Box>

                {!removed && detour?.notable && (
                  <Box sx={{
                    mt: 1, mb: 1, p: 1, borderRadius: 1.5,
                    bgcolor: 'warning.light', color: 'warning.contrastText',
                    border: '1px solid', borderColor: 'warning.main',
                  }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                      ⚠️ {t('rolling.stops.detourTitle')}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      {t('rolling.stops.detourBody', { km: detour.detour.toLocaleString(), time: formatDuration(detour.hours) })}
                    </Typography>
                  </Box>
                )}

                {!removed && (
                  <>
                    <Typography variant="body2" color="text.secondary" mt={0.5} mb={1}>{stop.whyVisit}</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {(stop.highlights || []).map((h, hi) => (
                        <Chip key={hi} label={h} size="small" variant="outlined" sx={{ fontSize: '0.68rem' }} />
                      ))}
                    </Box>
                    {stop.drivingFromPrev && idx > 0 && (
                      <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                        🚗 {stop.drivingFromPrev}
                      </Typography>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="outlined" startIcon={<RefreshIcon />}
          onClick={() => { setActiveStep(0); setStops([]); }} sx={{ flex: 1 }}>
          {t('rolling.restart')}
        </Button>
        <Button variant="contained" startIcon={<AIIcon />}
          onClick={buildFullItinerary}
          disabled={activeStops.length === 0 || totalDays === 0}
          sx={{ flex: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', fontWeight: 700 }}>
          {t('rolling.stops.build')} ✨
        </Button>
      </Box>
    </Box>
  );

  // ══════════════════════════════════════════════════════════════
  // בנייה — progress
  // ══════════════════════════════════════════════════════════════
  const renderBuilding = () => (
    <Box sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight={700} mb={1} textAlign="center">✨ {t('rolling.build.title')}</Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
        {t('rolling.build.subtitle')}
      </Typography>
      <LinearProgress variant="determinate" value={buildProgress} sx={{
        height: 10, borderRadius: 5, mb: 1,
        '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #667eea, #764ba2)' },
      }} />
      <Typography variant="caption" color="text.secondary" textAlign="center" display="block">{t('rolling.build.progress', { p: buildProgress })}</Typography>
    </Box>
  );

  // ══════════════════════════════════════════════════════════════
  // STEP 4 — מסלול מלא + עריכה
  // ══════════════════════════════════════════════════════════════
  const renderStep4 = () => {
    let globalDay = 0;
    return (
      <Box>
        <Typography variant="h5" fontWeight={700} mb={1} sx={{ color: '#667eea' }}>🗓️ {t('rolling.full.title')}</Typography>
        <Typography variant="body2" color="text.secondary" mb={0.5}>
          {t('rolling.full.summary', { days: totalDays, stops: activeStops.length })} · {startPoint} → {endPoint}
        </Typography>
        <Typography variant="caption" color="text.secondary" mb={2} display="block">
          💡 {t('rolling.full.hint')}
        </Typography>

        {/* ── Smart Day Optimizer Bar ── */}
        {optimizeSummary.hasIssues && (
          <Paper sx={{
            mb: 2, p: 1.5, borderRadius: 3,
            background: optimizeSummary.red > 0
              ? 'linear-gradient(135deg, #f5576c22, #f5af1922)'
              : 'linear-gradient(135deg, #f5af1922, #667eea11)',
            border: `1px solid ${optimizeSummary.red > 0 ? '#f5576c44' : '#f5af1944'}`,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" fontWeight={700} sx={{ flexShrink: 0 }}>
                🧠 Smart Optimizer
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                {optimizeSummary.green  > 0 && <Chip size="small" label={`🟢 ${t('rolling.full.balanced', { n: optimizeSummary.green })}`}  sx={{ fontSize: '0.65rem', bgcolor: '#43e97b22', color: '#1a7a40' }} />}
                {optimizeSummary.yellow > 0 && <Chip size="small" label={`🟡 ${t('rolling.full.busy', { n: optimizeSummary.yellow })}`}  sx={{ fontSize: '0.65rem', bgcolor: '#f5af1922', color: '#a06000' }} />}
                {optimizeSummary.red    > 0 && <Chip size="small" label={`🔴 ${t('rolling.full.tooBusy', { n: optimizeSummary.red })}`} sx={{ fontSize: '0.65rem', bgcolor: '#f5576c22', color: '#c0001a' }} />}
              </Box>
              <Button size="small" variant="contained" startIcon={<AIIcon />}
                onClick={() => {
                  const { newItinerary, movedCount } = autoOptimize(fullItinerary);
                  setFullItinerary(newItinerary);
                  setOptimizeMsg(movedCount > 0
                    ? `✅ ${t('rolling.full.moved', { n: movedCount })}`
                    : t('rolling.full.alreadyBalanced')
                  );
                  setTimeout(() => setOptimizeMsg(''), 5000);
                }}
                sx={{ ml: 'auto', background: 'linear-gradient(135deg, #667eea, #764ba2)', fontSize: '0.72rem', py: 0.4 }}>
                {t('rolling.full.optimize')}
              </Button>
            </Box>
            {optimizeMsg && (
              <Typography variant="caption" sx={{ color: '#667eea', display: 'block', mt: 0.5, fontWeight: 600 }}>
                {optimizeMsg}
              </Typography>
            )}
          </Paper>
        )}

        {fullItinerary.map(({ stop, days, itinerary }, si) => {
          const startDay = globalDay + 1;
          globalDay += days;
          const expanded = expandedStop === si;
          const photo = stopPhotos[stops.indexOf(stop)] ?? stopPhotos[si];

          return (
            <Paper key={si} sx={{ mb: 2, borderRadius: 3, overflow: 'hidden',
              border: `2px solid ${TYPE_COLORS[stop.type] || '#667eea'}33` }}>

              {/* כותרת עצירה */}
              <Box
                onClick={() => setExpandedStop(expanded ? null : si)}
                sx={{
                  background: photo
                    ? `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.55)), url(${photo}) center/cover`
                    : `linear-gradient(135deg, ${TYPE_COLORS[stop.type] || '#667eea'}dd, #764ba2dd)`,
                  color: 'white', p: 2, cursor: 'pointer', position: 'relative',
                  display: 'flex', alignItems: 'center', gap: 1, minHeight: 72,
                }}
              >
                {photo && <ImageCredit src={photo} sx={{ top: 2, bottom: 'auto' }} />}
                <Typography fontSize={28}>{stop.emoji}</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={700}>{stop.name}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {t('rolling.full.dayRange', { from: startDay, to: startDay + days - 1 })} · {stop.country}
                  </Typography>
                </Box>
                <Button size="small" variant="outlined"
                  onClick={(e) => { e.stopPropagation(); fetchLocalPhrases(stop); }}
                  sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.6)', fontSize: '0.7rem',
                    whiteSpace: 'nowrap', flexShrink: 0, '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
                  🌍 {t('rolling.phrases.button')}
                </Button>
                {/* badge עומס כולל לעצירה */}
                {(() => {
                  const analyses = itineraryAnalysis[si]?.dayAnalyses || [];
                  const worst = analyses.find(a => a.score === 'red') || analyses.find(a => a.score === 'yellow');
                  return worst ? (
                    <Chip size="small" label={`${worst.emoji} ${t(LOAD_LABEL[worst.score])}`}
                      sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: 'white', fontWeight: 700, fontSize: '0.65rem', flexShrink: 0 }} />
                  ) : null;
                })()}
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Box>

              <Collapse in={expanded}>
                <Box sx={{ p: 2 }}>
                  {itinerary ? itinerary.map((day, di) => {
                    const dayAnalysis = itineraryAnalysis[si]?.dayAnalyses?.[di];
                    return (
                    <Box key={di} mb={3}>
                      {/* כותרת יום + badge עומס */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Box sx={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          background: dayAnalysis
                            ? `linear-gradient(135deg, ${dayAnalysis.color}, #764ba2)`
                            : 'linear-gradient(135deg, #667eea, #764ba2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: 11, fontWeight: 700,
                        }}>
                          {startDay + di}
                        </Box>
                        <Typography variant="subtitle2" fontWeight={700} color="primary" sx={{ flex: 1 }}>
                          {day.title}
                        </Typography>
                        {dayAnalysis && (
                          <Tooltip title={LOAD_WARNING[dayAnalysis.score] ? t(LOAD_WARNING[dayAnalysis.score], { h: dayAnalysis.hours }) : `${t('rolling.full.hours', { h: dayAnalysis.hours })} · ${t(LOAD_LABEL[dayAnalysis.score])}`}>
                            <Chip
                              size="small"
                              label={`${dayAnalysis.emoji} ${t('rolling.full.hoursShort', { h: dayAnalysis.hours })}`}
                              sx={{
                                fontSize: '0.65rem', fontWeight: 700,
                                bgcolor: `${dayAnalysis.color}22`,
                                color: dayAnalysis.color,
                                border: `1px solid ${dayAnalysis.color}55`,
                                cursor: 'default',
                              }}
                            />
                          </Tooltip>
                        )}
                        {day.theme && (
                          <Chip label={day.theme} size="small" sx={{ fontSize: '0.63rem' }} />
                        )}
                      </Box>
                      {/* אזהרת עומס */}
                      {dayAnalysis?.score === 'red' && (
                        <Alert severity="warning" icon={false} sx={{ py: 0.3, px: 1.5, mb: 1, borderRadius: 2, fontSize: '0.75rem' }}>
                          🔴 {t(LOAD_WARNING.red, { h: dayAnalysis.hours })}
                        </Alert>
                      )}

                      {/* פעילויות */}
                      {(day.activities || []).map((act, ai) => {
                        const isEditing = editingAct?.si === si && editingAct?.di === di && editingAct?.ai === ai;
                        return (
                          <Box key={ai}>
                            {isEditing ? (
                              /* ── טופס עריכה inline ── */
                              <Paper sx={{ p: 1.5, mb: 1, borderRadius: 2, bgcolor: '#f8f9ff', border: '1px solid #667eea44' }}>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                  <TextField size="small" label={t('rolling.act.time')} value={act.time}
                                    onChange={e => updateActivity(si, di, ai, 'time', e.target.value)}
                                    sx={{ width: 80 }} />
                                  <TextField size="small" label={t('rolling.act.name')} value={act.name}
                                    onChange={e => updateActivity(si, di, ai, 'name', e.target.value)}
                                    sx={{ flex: 1, minWidth: 140 }} />
                                  <FormControl size="small" sx={{ width: 110 }}>
                                    <InputLabel>{t('rolling.act.type')}</InputLabel>
                                    <Select value={act.type} label={t('rolling.act.type')}
                                      onChange={e => {
                                        const picked = ACT_TYPES.find(x => x.type === e.target.value);
                                        updateActivity(si, di, ai, 'type', e.target.value);
                                        if (picked) updateActivity(si, di, ai, 'emoji', picked.emoji);
                                      }}>
                                      {ACT_TYPES.map(x => <MenuItem key={x.type} value={x.type}>{x.emoji} {t(`rolling.act.${x.type}`)}</MenuItem>)}
                                    </Select>
                                  </FormControl>
                                </Box>
                                <TextField size="small" label={t('rolling.act.description')} value={act.description}
                                  onChange={e => updateActivity(si, di, ai, 'description', e.target.value)}
                                  fullWidth multiline rows={1} sx={{ mb: 1 }} />
                                <TextField size="small" label={t('rolling.act.price')} value={act.price || ''}
                                  onChange={e => updateActivity(si, di, ai, 'price', e.target.value)}
                                  sx={{ width: 120, mr: 1 }} />
                                <Button size="small" variant="contained" startIcon={<CheckIcon />}
                                  onClick={() => setEditingAct(null)}
                                  sx={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', mt: 0.5 }}>
                                  {t('rolling.act.save')}
                                </Button>
                              </Paper>
                            ) : (
                              /* ── תצוגה רגילה ── */
                              <Box sx={{
                                display: 'flex', gap: 1.5, mb: 1, alignItems: 'flex-start',
                                p: 0.8, borderRadius: 2, transition: 'background 0.15s',
                                '&:hover': { bgcolor: 'action.hover' },
                                '&:hover .act-actions': { opacity: 1 },
                              }}>
                                <Typography sx={{ minWidth: 38, fontSize: 12, color: 'text.secondary', pt: 0.3, fontVariantNumeric: 'tabular-nums' }}>{act.time}</Typography>
                                <Typography fontSize={18} sx={{ flexShrink: 0 }}>{act.emoji || '📍'}</Typography>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="body2" fontWeight={600}>{act.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">{act.description}</Typography>
                                  {act.tips && (
                                    <Typography variant="caption" display="block" sx={{ color: '#667eea', mt: 0.2 }}>
                                      💡 {act.tips}
                                    </Typography>
                                  )}
                                </Box>
                                <Box className="act-actions" sx={{ display: 'flex', gap: 0.2, opacity: 0, transition: 'opacity 0.15s', flexShrink: 0 }}>
                                  {act.price && (
                                    <Chip label={act.price} size="small" sx={{ fontSize: '0.6rem', mr: 0.5 }} />
                                  )}
                                  <Tooltip title={t('rolling.act.edit')}>
                                    <IconButton size="small" onClick={() => setEditingAct({ si, di, ai })}>
                                      <EditIcon sx={{ fontSize: 15 }} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title={t('rolling.act.delete')}>
                                    <IconButton size="small" onClick={() => deleteActivity(si, di, ai)} color="error">
                                      <DeleteIcon sx={{ fontSize: 15 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Box>
                            )}
                          </Box>
                        );
                      })}

                      {/* הוסף פעילות */}
                      {newActForm?.si === si && newActForm?.di === di ? (
                        <Paper sx={{ p: 1.5, mt: 1, borderRadius: 2, bgcolor: '#f0fff4', border: '1px dashed #43e97b' }}>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                            <TextField size="small" label={t('rolling.act.time')} value={newActData.time}
                              onChange={e => setNewActData(p => ({ ...p, time: e.target.value }))}
                              sx={{ width: 80 }} />
                            <TextField size="small" label={t('rolling.act.activityName')} value={newActData.name}
                              onChange={e => setNewActData(p => ({ ...p, name: e.target.value }))}
                              sx={{ flex: 1, minWidth: 150 }} autoFocus />
                            <FormControl size="small" sx={{ width: 120 }}>
                              <InputLabel>{t('rolling.act.type')}</InputLabel>
                              <Select value={newActData.type} label={t('rolling.act.type')}
                                onChange={e => setNewActData(p => ({ ...p, type: e.target.value }))}>
                                {ACT_TYPES.map(x => <MenuItem key={x.type} value={x.type}>{x.emoji} {t(`rolling.act.${x.type}`)}</MenuItem>)}
                              </Select>
                            </FormControl>
                          </Box>
                          <TextField size="small" label={t('rolling.act.shortDescription')} value={newActData.description}
                            onChange={e => setNewActData(p => ({ ...p, description: e.target.value }))}
                            fullWidth sx={{ mb: 1 }} />
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button size="small" variant="contained" startIcon={<CheckIcon />}
                              onClick={() => commitAddActivity(si, di)}
                              sx={{ background: 'linear-gradient(135deg, #43e97b, #38f9d7)', color: '#000' }}>
                              {t('rolling.act.add')}
                            </Button>
                            <Button size="small" variant="outlined" onClick={() => setNewActForm(null)}>{t('rolling.act.cancel')}</Button>
                          </Box>
                        </Paper>
                      ) : (
                        <Button size="small" startIcon={<AddIcon />} variant="text"
                          onClick={() => { setNewActForm({ si, di }); setEditingAct(null); }}
                          sx={{ mt: 0.5, color: '#667eea', fontSize: '0.75rem' }}>
                          + {t('rolling.act.addToDay', { n: startDay + di })}
                        </Button>
                      )}

                      {/* מלון */}
                      {day.hotel && (
                        <Paper sx={{ mt: 1.5, p: 1.5, borderRadius: 2,
                          background: 'linear-gradient(135deg, #667eea11, #764ba211)',
                          border: '1px solid #667eea33' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <HotelIcon sx={{ color: '#667eea', fontSize: 18 }} />
                            <Typography variant="body2" fontWeight={700} color="primary">🌙 {t('rolling.full.lodging')}</Typography>
                            <Box sx={{ display: 'flex' }}>
                              {Array.from({ length: day.hotel.stars || 3 }).map((_, i) => (
                                <StarIcon key={i} sx={{ fontSize: 11, color: '#f5af19' }} />
                              ))}
                            </Box>
                            <Chip label={day.hotel.priceRange || '€€'} size="small"
                              sx={{ ml: 'auto', fontSize: '0.63rem', bgcolor: '#667eea22', color: '#667eea', fontWeight: 700 }} />
                          </Box>
                          <Typography variant="body2" fontWeight={600}>{day.hotel.name}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">{day.hotel.description}</Typography>
                          {day.hotel.bookingTip && (
                            <Typography variant="caption" sx={{ color: '#764ba2', display: 'block', mt: 0.3 }}>
                              💡 {day.hotel.bookingTip}
                            </Typography>
                          )}
                          <Button size="small" endIcon={<OpenInNewIcon fontSize="small" />}
                            href={bookingLinks.hotelSearch(`${day.hotel.name} ${stop.nameEn || stop.name}`)}
                            target="_blank" rel="noopener noreferrer"
                            sx={{ mt: 0.5, fontSize: '0.7rem', p: '2px 8px', color: '#667eea' }}>
                            {t('rolling.full.searchBooking')}
                          </Button>
                        </Paper>
                      )}

                      {di < itinerary.length - 1 && <Divider sx={{ my: 2 }} />}
                    </Box>
                  );}) : (
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>{t('rolling.full.stopFailed')}</Alert>
                  )}
                </Box>
              </Collapse>
            </Paper>
          );
        })}

        {/* כפתורי תחתית */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />}
            onClick={() => { setActiveStep(0); setStops([]); setFullItinerary([]); }}>
            {t('rolling.restart')}
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                let globalD = 0;
                const flatItinerary = fullItinerary.flatMap(({ itinerary, days }) => {
                  if (!itinerary) { globalD += days; return []; }
                  const mapped = itinerary.map((day, di) => ({ ...day, day: globalD + di + 1 }));
                  globalD += days;
                  return mapped;
                });

                const trip = await saveTripToList({
                  destination: `${startPoint} → ${endPoint}`,
                  days: totalDays,
                  dailyItinerary: flatItinerary,
                  rollingTrip: true,
                  stops: fullItinerary.map(({ stop, days }) => ({ name: stop.name, nameEn: stop.nameEn || stop.name, country: stop.country, days })),
                });
                navigate(`/trip-planner?tripId=${trip.id}`);
              } catch {
                navigate(`/trip-planner?destination=${encodeURIComponent(endPoint)}`);
              } finally {
                setSaving(false);
              }
            }}
            sx={{ flex: 1, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', fontWeight: 700 }}>
            {saving ? t('rolling.full.saving') : t('rolling.full.saveAndOpen')}
          </Button>
        </Box>
      </Box>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════
  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea11 0%, #764ba211 100%)', pt: { xs: 8, md: 10 }, pb: 6 }}>
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" fontWeight={800} sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 1,
          }}>
            🛣️ {t('nav.rollingTrip')}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {t('rolling.header.subtitle')}
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }} alternativeLabel>
          {STEPS.map((key, i) => <Step key={i}><StepLabel>{t(`rolling.steps.${key}`)}</StepLabel></Step>)}
        </Stepper>

        <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 4, boxShadow: '0 8px 40px rgba(102,126,234,0.15)' }}>
          {activeStep === 0 && renderStep1()}
          {activeStep === 1 && renderStep2()}
          {activeStep === 2 && !buildingItinerary && renderStep3()}
          {buildingItinerary && renderBuilding()}
          {activeStep === 3 && !buildingItinerary && renderStep4()}
        </Paper>
      </Container>

      {/* Local Phrases Dialog */}
      <Dialog open={phrasesOpen} onClose={() => setPhrasesOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ background: 'linear-gradient(135deg,#43e97b,#38f9d7)', color: 'white', pb: 1 }}>
          🌍 {t('rolling.phrases.title', { place: phrasesStop?.name })}
          <IconButton onClick={() => setPhrasesOpen(false)} sx={{ position: 'absolute', right: noflip('8px'), top: 8, color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {phrasesLoading ? (
            <Box textAlign="center" py={5}>
              <CircularProgress sx={{ color: '#43e97b' }} />
              <Typography mt={2} color="text.secondary">{t('rolling.phrases.loading')}</Typography>
            </Box>
          ) : phrasesData.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={3}>{t('rolling.phrases.none')}</Typography>
          ) : (
            phrasesData.map((p, i) => (
              <Paper key={i} elevation={1} sx={{ p: 1.5, mb: 1, borderRadius: 2, borderRight: '4px solid #43e97b' }}>
                <Typography variant="caption" color="#38a169" fontWeight={700} textTransform="uppercase">{p.category}</Typography>
                <Typography variant="h6" fontWeight={800} lineHeight={1.2}>{p.phrase}</Typography>
                <Typography variant="body2" color="text.secondary">{p.translation}</Typography>
                {p.pronunciation && (
                  <Typography variant="caption" sx={{ color: '#667eea', fontStyle: 'italic' }}>
                    🔊 {p.pronunciation}
                  </Typography>
                )}
              </Paper>
            ))
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPhrasesOpen(false)} variant="outlined">{t('rolling.phrases.close')}</Button>
          {phrasesData.length > 0 && (
            <Button variant="contained" onClick={() => {
              const text = `🌍 ${t('rolling.phrases.shareTitle', { place: phrasesStop?.name })}:\n\n` +
                phrasesData.map(p => `${p.phrase} — ${p.translation} (${p.pronunciation || ''})`).join('\n');
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
            }} sx={{ bgcolor: '#25d366', '&:hover': { bgcolor: '#1da851' } }}>
              📤 {t('rolling.phrases.whatsapp')}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
