import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, TextField, Button, Paper, Grid,
  Card, CardContent, Chip, Stack, Avatar, IconButton, Divider,
  LinearProgress, Alert, Snackbar, List, ListItem, ListItemText,
  ListItemAvatar, Tooltip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupIcon from '@mui/icons-material/Group';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import {
  createRoom, joinRoom, submitVote, subscribeRoom,
  tallyVotes, participantsOf,
} from '../services/groupTripService';

const DESTINATION_OPTIONS = [
  { name: 'Paris', emoji: '🗼', country: 'France' },
  { name: 'Barcelona', emoji: '🏖️', country: 'Spain' },
  { name: 'Rome', emoji: '🏛️', country: 'Italy' },
  { name: 'London', emoji: '🎡', country: 'England' },
  { name: 'Amsterdam', emoji: '🚲', country: 'Netherlands' },
  { name: 'Bangkok', emoji: '🛕', country: 'Thailand' },
  { name: 'Bali', emoji: '🌺', country: 'Indonesia' },
  { name: 'New York', emoji: '🗽', country: 'USA' },
  { name: 'Tokyo', emoji: '🗼', country: 'Japan' },
  { name: 'Dubai', emoji: '🌆', country: 'UAE' },
  { name: 'Santorini', emoji: '🌅', country: 'Greece' },
  { name: 'Marrakech', emoji: '🕌', country: 'Morocco' },
  { name: 'Lisbon', emoji: '🌉', country: 'Portugal' },
  { name: 'Iceland - Reykjavik', emoji: '🌋', country: 'Iceland' },
  { name: 'Kyoto', emoji: '⛩️', country: 'Japan' },
];

// הקוד של החדר האחרון בלבד. תוכן החדר מגיע מהשרת, שכן חדר שנשמר
// מקומית אינו נגיש לחברים שמצטרפים ממכשיר אחר — וזה היה שורש התקלה.
const LAST_ROOM_KEY = 'groupTrip_lastRoom';

export default function GroupTripPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [session, setSession] = useState(null);
  const [selectedVotes, setSelectedVotes] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const notify = (msg) => { setSnackMsg(msg); setSnackOpen(true); };

  // קוד מהקישור המשותף. עד כה הפרמטר נוצר בשיתוף אך לא נקרא בשום מקום,
  // ולכן חבר שפתח את הקישור לא הגיע לחדר.
  useEffect(() => {
    const fromLink = searchParams.get('room');
    if (fromLink) setJoinCode(fromLink.toUpperCase());
    else {
      try {
        const last = localStorage.getItem(LAST_ROOM_KEY);
        if (last) setJoinCode(last);
      } catch {}
    }
  }, [searchParams]);

  // מנוי חי: הצבעה של חבר מופיעה מיד, בלי רענון
  useEffect(() => {
    if (!session?.code) return;
    const stop = subscribeRoom(
      session.code,
      (room) => { if (room) setSession(room); },
      () => notify('החיבור לחדר נותק. רענן כדי לנסות שוב.')
    );
    return stop;
  }, [session?.code]);

  const handleCreateSession = async () => {
    if (!name.trim()) return notify(t('groupTrip.err_name'));
    if (!user) return notify('יש להתחבר כדי לפתוח חדר משותף.');

    setBusy(true);
    try {
      const room = await createRoom(user.uid, name.trim());
      try { localStorage.setItem(LAST_ROOM_KEY, room.code); } catch {}
      setSession(room);
      setStep(2);
    } catch {
      notify('לא הצלחנו ליצור את החדר. בדוק את החיבור ונסה שוב.');
    } finally {
      setBusy(false);
    }
  };

  const handleJoinOrLoad = async () => {
    if (!name.trim()) return notify(t('groupTrip.err_name'));
    if (!joinCode.trim()) return notify('הזן את קוד החדר שקיבלת.');
    if (!user) return notify('יש להתחבר כדי להצטרף לחדר.');

    setBusy(true);
    try {
      // ההצטרפות נעשית לפי הקוד שהוקלד. הגרסה הקודמת קראה מפתח קבוע
      // ב-localStorage והתעלמה מהקוד לחלוטין.
      const room = await joinRoom(joinCode.trim().toUpperCase(), user.uid, name.trim());
      if (!room) return notify(t('groupTrip.err_no_room'));

      try { localStorage.setItem(LAST_ROOM_KEY, room.code); } catch {}
      const mine = room.votes?.[user.uid]?.choices || [];
      if (mine.length) { setHasVoted(true); setSelectedVotes(mine); }
      setSession(room);
      setStep(2);
    } catch {
      notify('לא הצלחנו להצטרף לחדר. ודא שהקוד נכון ונסה שוב.');
    } finally {
      setBusy(false);
    }
  };

  const toggleVote = (destName) => {
    if (hasVoted) return;
    setSelectedVotes(prev => {
      if (prev.includes(destName)) return prev.filter(v => v !== destName);
      if (prev.length >= 3) return prev;
      return [...prev, destName];
    });
  };

  const handleSubmitVotes = async () => {
    if (selectedVotes.length === 0) return notify(t('groupTrip.err_select'));
    if (!user || !session?.code) return;

    setBusy(true);
    try {
      // נכתבת רשומת ההצבעה של המשתמש בלבד. אין מונה מצטבר שאפשר לנפח:
      // הספירה נגזרת מההצבעות עצמן.
      await submitVote(session.code, user.uid, name.trim() || 'משתתף', selectedVotes);
      setHasVoted(true);
      notify(t('groupTrip.vote_saved'));
    } catch {
      // בלי זה המשתמש היה רואה "ההצבעה נשמרה" גם כשלא נשמרה דבר
      notify('ההצבעה לא נשמרה. בדוק את החיבור ונסה שוב.');
    } finally {
      setBusy(false);
    }
  };

  const handleShowResults = () => {
    setStep(3);
  };

  const handleReset = () => {
    try { localStorage.removeItem(LAST_ROOM_KEY); } catch {}
    setSession(null);
    setStep(1);
    setName('');
    setSelectedVotes([]);
    setHasVoted(false);
  };

  const copyLink = async () => {
    // הקישור נבנה מהמקור והנתיב בלבד. הגרסה הקודמת שרשרה ?room אל
    // window.location.href, וייצרה כתובת שבורה כשכבר היה בה פרמטר.
    const url = `${window.location.origin}/group-trip?room=${session?.code}`;
    try {
      await navigator.clipboard.writeText(url);
      notify(t('groupTrip.link_copied'));
    } catch {
      notify('ההעתקה נחסמה על ידי הדפדפן. הקוד הוא ' + session?.code);
    }
  };

  const sortedResults = tallyVotes(session);
  const participants = participantsOf(session);
  const maxVotes = sortedResults.length > 0 ? sortedResults[0][1] : 1;
  const winner = sortedResults.length > 0 ? sortedResults[0] : null;

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f8f9ff 0%, #fff5f8 100%)',
      pt: '80px',
      pb: 8
    }}>
      <Container maxWidth="md">
        <Box textAlign="center" mb={5}>
          <Typography variant="h3" fontWeight={800} sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: { xs: '1.8rem', md: '3rem' }
          }}>
            {t('groupTrip.page_title')}
          </Typography>
          <Typography variant="h6" color="text.secondary" mt={1}>
            {t('groupTrip.page_subtitle')}
          </Typography>
        </Box>

        {/* Step 1: Setup */}
        {step === 1 && (
          <Paper elevation={4} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Avatar sx={{ bgcolor: '#667eea', width: 48, height: 48 }}>
                <GroupIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">{t('groupTrip.step1_title')}</Typography>
                <Typography variant="body2" color="text.secondary">{t('groupTrip.step1_subtitle')}</Typography>
              </Box>
            </Box>

            <TextField
              fullWidth
              label={t('groupTrip.name_label')}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('groupTrip.name_placeholder')}
              sx={{ mb: 3 }}
              onKeyDown={e => e.key === 'Enter' && handleCreateSession()}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<AddIcon />}
                onClick={handleCreateSession}
                disabled={busy}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 700
                }}
              >
                {t('groupTrip.create_room')}
              </Button>
              {/* בלי שדה זה אי אפשר היה להצטרף לחדר של מישהו אחר:
                  הקוד נשלח בקישור אך מעולם לא נקלט חזרה. */}
              <TextField
                fullWidth
                label="קוד חדר (להצטרפות לחדר קיים)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                inputProps={{ maxLength: 12, style: { letterSpacing: '0.15em', textAlign: 'center' } }}
                placeholder="למשל ABCD234XYZ"
              />
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={handleJoinOrLoad}
                disabled={busy || !joinCode.trim()}
                sx={{ py: 1.5, borderRadius: 3, fontWeight: 700 }}
              >
                {t('groupTrip.join_room')}
              </Button>
            </Stack>

            <Box mt={3} p={2} bgcolor="#f8f9ff" borderRadius={2}>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                החדר נשמר בענן — כל מי שמקבל את הקוד יכול להצביע מהמכשיר שלו,
                וההצבעות מתעדכנות אצל כולם מיד.
              </Typography>
            </Box>
          </Paper>
        )}

        {/* Step 2: Voting */}
        {step === 2 && session && (
          <>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    🎯 {t('groupTrip.room_code')}: <Chip label={session.code} sx={{ fontWeight: 700, fontSize: '1rem', bgcolor: '#667eea22', color: '#667eea' }} />
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.5}>
                    {t('groupTrip.participants_count', { count: participants.length })}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<ContentCopyIcon />}
                    onClick={copyLink}
                    size="small"
                    sx={{ borderRadius: 2 }}
                  >
                    {t('groupTrip.copy_link')}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<EmojiEventsIcon />}
                    onClick={handleShowResults}
                    size="small"
                    sx={{ background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)', borderRadius: 2 }}
                  >
                    {t('groupTrip.show_results')}
                  </Button>
                </Stack>
              </Box>

              {participants.length > 0 && (
                <Box mt={2}>
                  <Typography variant="body2" color="text.secondary" mb={1}>{t('groupTrip.participants_label')}</Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {participants.map((p, i) => (
                      <Chip
                        key={i}
                        label={p.name}
                        size="small"
                        icon={p.votes.length > 0 ? <CheckCircleIcon /> : undefined}
                        color={p.votes.length > 0 ? 'success' : 'default'}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Paper>

            <Typography variant="h6" fontWeight="bold" mb={2} textAlign="center">
              {hasVoted ? t('groupTrip.voted_waiting') : t('groupTrip.select_up_to', { count: selectedVotes.length })}
            </Typography>

            <Grid container spacing={2} mb={3}>
              {DESTINATION_OPTIONS.map(dest => {
                const isSelected = selectedVotes.includes(dest.name);
                const isDisabled = hasVoted || (!isSelected && selectedVotes.length >= 3);
                return (
                  <Grid item xs={6} sm={4} key={dest.name}>
                    <Card
                      onClick={() => !isDisabled && toggleVote(dest.name)}
                      sx={{
                        cursor: isDisabled ? (hasVoted ? 'default' : 'not-allowed') : 'pointer',
                        textAlign: 'center',
                        borderRadius: 3,
                        border: isSelected ? '3px solid #667eea' : '2px solid transparent',
                        background: isSelected ? 'linear-gradient(135deg, #667eea22 0%, #764ba222 100%)' : 'white',
                        opacity: (!hasVoted && isDisabled) ? 0.4 : 1,
                        transition: 'all 0.2s ease',
                        '&:hover': (!isDisabled && !hasVoted) ? { transform: 'translateY(-4px)', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' } : {}
                      }}
                    >
                      <CardContent sx={{ py: 1.5, px: 1.5 }}>
                        <Typography sx={{ fontSize: '2rem', lineHeight: 1, mb: 0.5 }}>{dest.emoji}</Typography>
                        <Typography variant="body2" fontWeight={isSelected ? 700 : 500} color={isSelected ? '#667eea' : 'text.primary'}>
                          {dest.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{dest.country}</Typography>
                        {isSelected && (
                          <Box><CheckCircleIcon sx={{ color: '#667eea', fontSize: 16 }} /></Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {!hasVoted && (
              <Box textAlign="center">
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<HowToVoteIcon />}
                  onClick={handleSubmitVotes}
                  disabled={busy || selectedVotes.length === 0}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    px: 6,
                    py: 1.8,
                    borderRadius: 3,
                    fontWeight: 700,
                    fontSize: '1.1rem'
                  }}
                >
                  {t('groupTrip.vote_btn')}
                </Button>
              </Box>
            )}
          </>
        )}

        {/* Step 3: Results */}
        {step === 3 && session && (
          <Paper elevation={4} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
            <Typography variant="h4" fontWeight={800} textAlign="center" mb={1}>
              {t('groupTrip.results_title')}
            </Typography>

            {winner && (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 3,
                  px: 2,
                  my: 3,
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                  borderRadius: 4,
                  boxShadow: '0 8px 30px rgba(255,165,0,0.4)'
                }}
              >
                <EmojiEventsIcon sx={{ fontSize: 50, color: 'white', mb: 1 }} />
                <Typography variant="h4" fontWeight={800} color="white">
                  {DESTINATION_OPTIONS.find(d => d.name === winner[0])?.emoji || '🌍'} {winner[0]}
                </Typography>
                <Typography variant="h6" color="white" sx={{ opacity: 0.9, mt: 0.5 }}>
                  {t('groupTrip.winner_votes', { count: winner[1] })}
                </Typography>
                <Button
                  variant="contained"
                  sx={{
                    mt: 2,
                    bgcolor: 'white',
                    color: '#FF8C00',
                    fontWeight: 700,
                    borderRadius: 3,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                  }}
                  onClick={() => navigate(`/trip-planner?destination=${encodeURIComponent(winner[0])}`)}
                >
                  {t('groupTrip.plan_winner', { dest: winner[0] })}
                </Button>
              </Box>
            )}

            {sortedResults.length === 0 && (
              <Typography textAlign="center" color="text.secondary">
                {t('groupTrip.no_votes')}
              </Typography>
            )}

            <Typography variant="h6" fontWeight="bold" mb={2}>{t('groupTrip.all_results')}</Typography>
            {sortedResults.map(([dest, votes], i) => {
              const destObj = DESTINATION_OPTIONS.find(d => d.name === dest);
              const pct = Math.round((votes / maxVotes) * 100);
              return (
                <Box key={dest} mb={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</Typography>
                      <Typography fontWeight={600}>{destObj?.emoji} {dest}</Typography>
                    </Box>
                    <Typography fontWeight={700} color="#667eea">{t('groupTrip.votes_count', { count: votes })}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      bgcolor: '#f0f0f0',
                      '& .MuiLinearProgress-bar': {
                        background: i === 0
                          ? 'linear-gradient(90deg, #FFD700, #FFA500)'
                          : 'linear-gradient(90deg, #667eea, #764ba2)',
                        borderRadius: 6
                      }
                    }}
                  />
                </Box>
              );
            })}

            <Divider sx={{ my: 3 }} />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setStep(2)}
                sx={{ borderRadius: 2 }}
              >
                {t('groupTrip.back_to_voting')}
              </Button>
              <Button
                variant="contained"
                color="error"
                fullWidth
                onClick={handleReset}
                sx={{ borderRadius: 2 }}
              >
                {t('groupTrip.reset')}
              </Button>
            </Stack>
          </Paper>
        )}
      </Container>

      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSnackOpen(false)} sx={{ borderRadius: 2 }}>
          {snackMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
