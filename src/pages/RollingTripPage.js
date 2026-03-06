import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, TextField, Button, Paper, Stepper, Step, StepLabel,
  Chip, IconButton, Card, CardContent, LinearProgress, Divider, Tooltip,
  Alert, Collapse, Select, MenuItem, FormControl, InputLabel,
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
import { getStopWeatherSummary } from '../services/openMeteoService';
import { analyzeItinerary, summarizeAnalysis, autoOptimize } from '../services/dayOptimizerService';

// ─── קבועים ────────────────────────────────────────────────────

const PACE_OPTIONS = [
  { value: 'slow',   label: 'איטי',   desc: 'פחות עצירות, יותר עומק', emoji: '🐢' },
  { value: 'medium', label: 'בינוני', desc: 'איזון בין כמות לאיכות',   emoji: '🚶' },
  { value: 'fast',   label: 'מהיר',   desc: 'הרבה עצירות, כיסוי נרחב', emoji: '🏃' },
];

const INTEREST_OPTIONS = [
  { value: 'nature',      label: 'טבע',        emoji: '🌿' },
  { value: 'culture',     label: 'תרבות',       emoji: '🏛️' },
  { value: 'food',        label: 'אוכל',        emoji: '🍽️' },
  { value: 'adventure',   label: 'הרפתקאות',    emoji: '🧗' },
  { value: 'history',     label: 'היסטוריה',    emoji: '🏰' },
  { value: 'beach',       label: 'חופים',       emoji: '🏖️' },
  { value: 'wine',        label: 'יין ויקבים',  emoji: '🍷' },
  { value: 'castles',     label: 'ארמונות',     emoji: '🏯' },
];

const ACT_TYPES = [
  { type: 'attraction', emoji: '🏛️', label: 'אטרקציה' },
  { type: 'food',       emoji: '🍽️', label: 'אוכל'     },
  { type: 'nature',     emoji: '🌿', label: 'טבע'      },
  { type: 'museum',     emoji: '🖼️', label: 'מוזיאון'  },
  { type: 'winery',     emoji: '🍷', label: 'יקב'      },
  { type: 'castle',     emoji: '🏰', label: 'ארמון'    },
  { type: 'beach',      emoji: '🏖️', label: 'חוף'      },
  { type: 'shopping',   emoji: '🛍️', label: 'קניות'   },
  { type: 'nightlife',  emoji: '🌙', label: 'בילוי'    },
  { type: 'rest',       emoji: '☕', label: 'מנוחה'    },
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

const TYPE_LABELS = {
  city: 'עיר', nature: 'טבע', viewpoint: 'נוף',
  historic: 'היסטורי', beach: 'חוף', adventure: 'הרפתקה', food: 'קולינריה',
};

const STEPS = ['הגדר מסלול', 'AI מגלה עצירות', 'התאם עצירות', 'מסלול מלא'];

// ─── קומפוננטה ראשית ────────────────────────────────────────────

export default function RollingTripPage() {
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
        const url = await getPlacePhoto(stop.name, stop.country);
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
    if (!startPoint.trim() || !endPoint.trim()) { setError('יש למלא נקודת מוצא ויעד סופי'); return; }
    setError('');
    setLoading(true);
    setStopPhotos({});
    setStopWeather({});
    photoFetched.current = {};
    weatherFetched.current = {};
    setActiveStep(1);

    const msgs = [
      'AI סורק את המסלול...', 'מגלה ערים מעניינות לאורך הדרך...',
      'בודק אטרקציות ייחודיות...', 'מסדר עצירות גיאוגרפית...',
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
        err.message === 'NO_API_KEY'  ? 'מפתח Gemini API חסר' :
        err.message === 'RATE_LIMIT'  ? 'חרגת ממכסת בקשות AI. נסה שוב בעוד דקה.' :
        err.message === 'TIMEOUT'     ? 'הבקשה פגה — נסה שוב' :
        'שגיאה בחיבור ל-AI. בדוק אינטרנט ונסה שוב.'
      );
      setActiveStep(0);
    } finally {
      setLoading(false);
    }
  };

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
    for (let idx = 0; idx < stopsWithDays.length; idx++) {
      const { stop, days } = stopsWithDays[idx];
      try {
        const itinerary = await generateItinerary({
          destination: `${stop.name}, ${stop.country}`,
          days, interests, budget: 'medium',
        });
        results.push({ stop, days, itinerary });
      } catch {
        results.push({ stop, days, itinerary: null });
      }
      setBuildProgress(Math.round(((idx + 1) / stopsWithDays.length) * 100));
    }

    setFullItinerary(results);
    setBuildingItinerary(false);
    setActiveStep(3);
    setExpandedStop(0); // פתח את הראשון אוטומטית
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
    const typeInfo = ACT_TYPES.find(t => t.type === newActData.type) || ACT_TYPES[0];
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
        🗺️ הגדר את מסלול הטיול
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        הזן נקודת מוצא ויעד, ו-AI יגלה את העצירות המושלמות לאורך הדרך
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        <TextField
          label="נקודת מוצא" placeholder="למשל: Paris, France"
          value={startPoint} onChange={e => setStartPoint(e.target.value)}
          fullWidth onKeyDown={e => e.key === 'Enter' && handleDiscover()}
          InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>🚀</Typography> }}
        />

        {waypoints.map((wp, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              label={`עצירת ביניים ${i + 1}`} placeholder="למשל: Lyon, France"
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
            הוסף עצירת ביניים
          </Button>
        )}

        <TextField
          label="יעד סופי" placeholder="למשל: Rome, Italy"
          value={endPoint} onChange={e => setEndPoint(e.target.value)}
          fullWidth onKeyDown={e => e.key === 'Enter' && handleDiscover()}
          InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>🏁</Typography> }}
        />

        {/* תאריך יציאה — לתחזית מזג אוויר */}
        <TextField
          label="תאריך יציאה (אופציונלי — לתחזית מזג אוויר)"
          type="date" value={startDate}
          onChange={e => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: new Date().toISOString().split('T')[0] }}
          helperText="אם הטיול בשבועיים הקרובים — נציג תחזית מזג אוויר לכל עצירה"
          fullWidth
          InputProps={{ startAdornment: <WeatherIcon sx={{ mr: 1, color: '#667eea', fontSize: 20 }} /> }}
        />
      </Box>

      {/* קצב */}
      <Typography variant="subtitle2" fontWeight={600} mb={1}>קצב הטיול</Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        {PACE_OPTIONS.map(opt => (
          <Paper key={opt.value} onClick={() => setPace(opt.value)} sx={{
            p: 1.5, cursor: 'pointer', flex: 1, minWidth: 100, textAlign: 'center',
            border: pace === opt.value ? '2px solid #667eea' : '2px solid transparent',
            background: pace === opt.value ? 'linear-gradient(135deg, #667eea22, #764ba222)' : undefined,
            transition: 'all 0.2s', '&:hover': { borderColor: '#667eea88' },
          }}>
            <Typography fontSize={24}>{opt.emoji}</Typography>
            <Typography variant="body2" fontWeight={600}>{opt.label}</Typography>
            <Typography variant="caption" color="text.secondary">{opt.desc}</Typography>
          </Paper>
        ))}
      </Box>

      {/* תחומי עניין */}
      <Typography variant="subtitle2" fontWeight={600} mb={1}>תחומי עניין</Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        {INTEREST_OPTIONS.map(opt => (
          <Chip key={opt.value} label={`${opt.emoji} ${opt.label}`}
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
        גלה את המסלול שלי 🔍
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
      <Typography variant="h5" fontWeight={700} mb={1}>AI סורק את המסלול שלך</Typography>
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
        <Typography variant="h5" fontWeight={700} sx={{ color: '#667eea' }}>🛣️ עצירות שהתגלו</Typography>
        <Chip label={`סה"כ ${totalDays} ימים · ${activeStops.length} עצירות`}
          sx={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontWeight: 700 }} />
      </Box>

      {/* מפה */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', mb: 3, height: 220 }}>
        <iframe title="מפת מסלול" src={getMapUrl()} width="100%" height="220"
          style={{ border: 'none' }} referrerPolicy="no-referrer-when-downgrade" loading="lazy" />
      </Paper>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        {stops.map((stop, idx) => {
          const days    = daysPerStop[idx] ?? stop.recommendedDays ?? 1;
          const removed = days === 0;
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
                  <Box sx={{ position: 'absolute', bottom: 8, right: 10, display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography sx={{ color: 'white', fontWeight: 800, fontSize: 18, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                      {stop.emoji} {stop.name}
                    </Typography>
                    <Chip label={TYPE_LABELS[stop.type] || stop.type} size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: 'white', fontWeight: 700, fontSize: '0.65rem' }} />
                  </Box>
                  {/* מזג אוויר */}
                  {weather && (
                    <Box sx={{
                      position: 'absolute', top: 8, left: 10,
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
                    <Chip label={TYPE_LABELS[stop.type] || stop.type} size="small"
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
                      {days === 0 ? 'מוסר' : `${days} ${days === 1 ? 'יום' : 'ימים'}`}
                    </Typography>
                    <IconButton size="small" onClick={() => adjustDays(idx, 1)} disabled={days === 10}><AddIcon fontSize="small" /></IconButton>
                  </Box>
                  <Tooltip title="הסר עצירה">
                    <IconButton size="small" onClick={() => removeStop(idx)} color="error"><CloseIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </Box>

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
          התחל מחדש
        </Button>
        <Button variant="contained" startIcon={<AIIcon />}
          onClick={buildFullItinerary}
          disabled={activeStops.length === 0 || totalDays === 0}
          sx={{ flex: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', fontWeight: 700 }}>
          בנה מסלול מפורט ✨
        </Button>
      </Box>
    </Box>
  );

  // ══════════════════════════════════════════════════════════════
  // בנייה — progress
  // ══════════════════════════════════════════════════════════════
  const renderBuilding = () => (
    <Box sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight={700} mb={1} textAlign="center">✨ בונה מסלול מפורט...</Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
        AI מייצר תכנית יומית לכל עצירה עם מלונות, יקבים וארמונות
      </Typography>
      <LinearProgress variant="determinate" value={buildProgress} sx={{
        height: 10, borderRadius: 5, mb: 1,
        '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #667eea, #764ba2)' },
      }} />
      <Typography variant="caption" color="text.secondary" textAlign="center" display="block">{buildProgress}% הושלם</Typography>
    </Box>
  );

  // ══════════════════════════════════════════════════════════════
  // STEP 4 — מסלול מלא + עריכה
  // ══════════════════════════════════════════════════════════════
  const renderStep4 = () => {
    let globalDay = 0;
    return (
      <Box>
        <Typography variant="h5" fontWeight={700} mb={1} sx={{ color: '#667eea' }}>🗓️ המסלול המלא שלך</Typography>
        <Typography variant="body2" color="text.secondary" mb={0.5}>
          {totalDays} ימים · {activeStops.length} עצירות · {startPoint} → {endPoint}
        </Typography>
        <Typography variant="caption" color="text.secondary" mb={2} display="block">
          💡 לחץ על עצירה לפתיחה · לחץ 🗑️ למחיקת פעילות · לחץ ✏️ לעריכה · הוסף פעילויות ידנית
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
                {optimizeSummary.green  > 0 && <Chip size="small" label={`🟢 ${optimizeSummary.green} מאוזן`}  sx={{ fontSize: '0.65rem', bgcolor: '#43e97b22', color: '#1a7a40' }} />}
                {optimizeSummary.yellow > 0 && <Chip size="small" label={`🟡 ${optimizeSummary.yellow} עמוס`}  sx={{ fontSize: '0.65rem', bgcolor: '#f5af1922', color: '#a06000' }} />}
                {optimizeSummary.red    > 0 && <Chip size="small" label={`🔴 ${optimizeSummary.red} עמוס מדי`} sx={{ fontSize: '0.65rem', bgcolor: '#f5576c22', color: '#c0001a' }} />}
              </Box>
              <Button size="small" variant="contained" startIcon={<AIIcon />}
                onClick={() => {
                  const { newItinerary, movedCount, details } = autoOptimize(fullItinerary);
                  setFullItinerary(newItinerary);
                  setOptimizeMsg(movedCount > 0
                    ? `✅ הוזזו ${movedCount} פעילויות לאיזון המסלול`
                    : 'המסלול כבר מאוזן — אין צורך בשינויים'
                  );
                  setTimeout(() => setOptimizeMsg(''), 5000);
                }}
                sx={{ ml: 'auto', background: 'linear-gradient(135deg, #667eea, #764ba2)', fontSize: '0.72rem', py: 0.4 }}>
                אפטם אוטומטית
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
                  color: 'white', p: 2, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 1, minHeight: 72,
                }}
              >
                <Typography fontSize={28}>{stop.emoji}</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={700}>{stop.name}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    ימים {startDay}–{startDay + days - 1} · {stop.country}
                  </Typography>
                </Box>
                {/* badge עומס כולל לעצירה */}
                {(() => {
                  const analyses = itineraryAnalysis[si]?.dayAnalyses || [];
                  const worst = analyses.find(a => a.score === 'red') || analyses.find(a => a.score === 'yellow');
                  return worst ? (
                    <Chip size="small" label={`${worst.emoji} ${worst.label}`}
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
                          <Tooltip title={dayAnalysis.warning || `${dayAnalysis.hours} שעות · ${dayAnalysis.label}`}>
                            <Chip
                              size="small"
                              label={`${dayAnalysis.emoji} ${dayAnalysis.hours}שע'`}
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
                          🔴 {dayAnalysis.warning}
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
                                  <TextField size="small" label="שעה" value={act.time}
                                    onChange={e => updateActivity(si, di, ai, 'time', e.target.value)}
                                    sx={{ width: 80 }} />
                                  <TextField size="small" label="שם" value={act.name}
                                    onChange={e => updateActivity(si, di, ai, 'name', e.target.value)}
                                    sx={{ flex: 1, minWidth: 140 }} />
                                  <FormControl size="small" sx={{ width: 110 }}>
                                    <InputLabel>סוג</InputLabel>
                                    <Select value={act.type} label="סוג"
                                      onChange={e => {
                                        const t = ACT_TYPES.find(x => x.type === e.target.value);
                                        updateActivity(si, di, ai, 'type', e.target.value);
                                        if (t) updateActivity(si, di, ai, 'emoji', t.emoji);
                                      }}>
                                      {ACT_TYPES.map(t => <MenuItem key={t.type} value={t.type}>{t.emoji} {t.label}</MenuItem>)}
                                    </Select>
                                  </FormControl>
                                </Box>
                                <TextField size="small" label="תיאור" value={act.description}
                                  onChange={e => updateActivity(si, di, ai, 'description', e.target.value)}
                                  fullWidth multiline rows={1} sx={{ mb: 1 }} />
                                <TextField size="small" label="מחיר" value={act.price || ''}
                                  onChange={e => updateActivity(si, di, ai, 'price', e.target.value)}
                                  sx={{ width: 120, mr: 1 }} />
                                <Button size="small" variant="contained" startIcon={<CheckIcon />}
                                  onClick={() => setEditingAct(null)}
                                  sx={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', mt: 0.5 }}>
                                  שמור
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
                                  <Tooltip title="ערוך">
                                    <IconButton size="small" onClick={() => setEditingAct({ si, di, ai })}>
                                      <EditIcon sx={{ fontSize: 15 }} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="מחק פעילות">
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
                            <TextField size="small" label="שעה" value={newActData.time}
                              onChange={e => setNewActData(p => ({ ...p, time: e.target.value }))}
                              sx={{ width: 80 }} />
                            <TextField size="small" label="שם הפעילות" value={newActData.name}
                              onChange={e => setNewActData(p => ({ ...p, name: e.target.value }))}
                              sx={{ flex: 1, minWidth: 150 }} autoFocus />
                            <FormControl size="small" sx={{ width: 120 }}>
                              <InputLabel>סוג</InputLabel>
                              <Select value={newActData.type} label="סוג"
                                onChange={e => setNewActData(p => ({ ...p, type: e.target.value }))}>
                                {ACT_TYPES.map(t => <MenuItem key={t.type} value={t.type}>{t.emoji} {t.label}</MenuItem>)}
                              </Select>
                            </FormControl>
                          </Box>
                          <TextField size="small" label="תיאור קצר (אופציונלי)" value={newActData.description}
                            onChange={e => setNewActData(p => ({ ...p, description: e.target.value }))}
                            fullWidth sx={{ mb: 1 }} />
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button size="small" variant="contained" startIcon={<CheckIcon />}
                              onClick={() => commitAddActivity(si, di)}
                              sx={{ background: 'linear-gradient(135deg, #43e97b, #38f9d7)', color: '#000' }}>
                              הוסף
                            </Button>
                            <Button size="small" variant="outlined" onClick={() => setNewActForm(null)}>ביטול</Button>
                          </Box>
                        </Paper>
                      ) : (
                        <Button size="small" startIcon={<AddIcon />} variant="text"
                          onClick={() => { setNewActForm({ si, di }); setEditingAct(null); }}
                          sx={{ mt: 0.5, color: '#667eea', fontSize: '0.75rem' }}>
                          + הוסף פעילות ליום {startDay + di}
                        </Button>
                      )}

                      {/* מלון */}
                      {day.hotel && (
                        <Paper sx={{ mt: 1.5, p: 1.5, borderRadius: 2,
                          background: 'linear-gradient(135deg, #667eea11, #764ba211)',
                          border: '1px solid #667eea33' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <HotelIcon sx={{ color: '#667eea', fontSize: 18 }} />
                            <Typography variant="body2" fontWeight={700} color="primary">🌙 לינה מומלצת</Typography>
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
                            href={`https://www.booking.com/search.html?ss=${encodeURIComponent(day.hotel.name + ' ' + stop.name)}`}
                            target="_blank" rel="noopener noreferrer"
                            sx={{ mt: 0.5, fontSize: '0.7rem', p: '2px 8px', color: '#667eea' }}>
                            חפש ב-Booking.com
                          </Button>
                        </Paper>
                      )}

                      {di < itinerary.length - 1 && <Divider sx={{ my: 2 }} />}
                    </Box>
                  );}) : (
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>לא הצלחנו לייצר מסלול לעצירה זו</Alert>
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
            התחל מחדש
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
                  stops: fullItinerary.map(({ stop, days }) => ({ name: stop.name, country: stop.country, days })),
                });
                navigate(`/trip-planner?tripId=${trip.id}`);
              } catch {
                navigate(`/trip-planner?destination=${encodeURIComponent(endPoint)}`);
              } finally {
                setSaving(false);
              }
            }}
            sx={{ flex: 1, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', fontWeight: 700 }}>
            {saving ? 'שומר...' : 'שמור ופתח בתכנון'}
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
            🛣️ טיול מתגלגל
          </Typography>
          <Typography variant="h6" color="text.secondary">
            הגדר מסלול — AI יגלה את העצירות המושלמות
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }} alternativeLabel>
          {STEPS.map((label, i) => <Step key={i}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>

        <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 4, boxShadow: '0 8px 40px rgba(102,126,234,0.15)' }}>
          {activeStep === 0 && renderStep1()}
          {activeStep === 1 && renderStep2()}
          {activeStep === 2 && !buildingItinerary && renderStep3()}
          {buildingItinerary && renderBuilding()}
          {activeStep === 3 && !buildingItinerary && renderStep4()}
        </Paper>
      </Container>
    </Box>
  );
}
