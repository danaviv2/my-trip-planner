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
import { useNavigate } from 'react-router-dom';

const DESTINATION_OPTIONS = [
  { name: 'פריז', emoji: '🗼', country: 'צרפת' },
  { name: 'ברצלונה', emoji: '🏖️', country: 'ספרד' },
  { name: 'רומא', emoji: '🏛️', country: 'איטליה' },
  { name: 'לונדון', emoji: '🎡', country: 'אנגליה' },
  { name: 'אמסטרדם', emoji: '🚲', country: 'הולנד' },
  { name: 'בנגקוק', emoji: '🛕', country: 'תאילנד' },
  { name: 'בלי', emoji: '🌺', country: 'אינדונזיה' },
  { name: 'ניו יורק', emoji: '🗽', country: 'ארה"ב' },
  { name: 'טוקיו', emoji: '🗼', country: 'יפן' },
  { name: 'דובאי', emoji: '🌆', country: 'איחוד האמירויות' },
  { name: 'סנטוריני', emoji: '🌅', country: 'יוון' },
  { name: 'מרקש', emoji: '🕌', country: 'מרוקו' },
  { name: 'ליסבון', emoji: '🌉', country: 'פורטוגל' },
  { name: 'איסלנד - רייקיאביק', emoji: '🌋', country: 'איסלנד' },
  { name: 'קיוטו', emoji: '⛩️', country: 'יפן' },
];

const STORAGE_KEY = 'groupTrip_v1';

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch { return null; }
}

function saveSession(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function GroupTripPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: הגדרה, 2: הצבעה, 3: תוצאות
  const [name, setName] = useState('');
  const [session, setSession] = useState(null);
  const [selectedVotes, setSelectedVotes] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');

  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      setSession(saved);
      setStep(2);
    }
  }, []);

  const handleCreateSession = () => {
    if (!name.trim()) {
      setSnackMsg('אנא הזן שם');
      setSnackOpen(true);
      return;
    }
    const newSession = {
      code: generateRoomCode(),
      creator: name.trim(),
      participants: [{ name: name.trim(), votes: [] }],
      votes: {},
      createdAt: Date.now()
    };
    saveSession(newSession);
    setSession(newSession);
    setStep(2);
  };

  const handleJoinOrLoad = () => {
    if (!name.trim()) {
      setSnackMsg('אנא הזן שם');
      setSnackOpen(true);
      return;
    }
    const existing = loadSession();
    if (!existing) {
      setSnackMsg('לא נמצא חדר. צור חדר חדש.');
      setSnackOpen(true);
      return;
    }
    const alreadyIn = existing.participants.find(p => p.name === name.trim());
    if (!alreadyIn) {
      existing.participants.push({ name: name.trim(), votes: [] });
    } else {
      // check if already voted
      if (alreadyIn.votes.length > 0) {
        setHasVoted(true);
        setSelectedVotes(alreadyIn.votes);
      }
    }
    saveSession(existing);
    setSession(existing);
    setStep(2);
  };

  const toggleVote = (destName) => {
    if (hasVoted) return;
    setSelectedVotes(prev => {
      if (prev.includes(destName)) return prev.filter(v => v !== destName);
      if (prev.length >= 3) return prev; // מקסימום 3
      return [...prev, destName];
    });
  };

  const handleSubmitVotes = () => {
    if (selectedVotes.length === 0) {
      setSnackMsg('אנא בחר לפחות יעד אחד');
      setSnackOpen(true);
      return;
    }
    const updated = { ...session };
    // עדכן votes map
    selectedVotes.forEach(dest => {
      updated.votes[dest] = (updated.votes[dest] || 0) + 1;
    });
    // עדכן participant
    const participant = updated.participants.find(p => p.name === name);
    if (participant) participant.votes = selectedVotes;
    else updated.participants.push({ name, votes: selectedVotes });

    saveSession(updated);
    setSession(updated);
    setHasVoted(true);
    setSnackMsg('הצבעתך נשמרה! 🎉');
    setSnackOpen(true);
  };

  const handleShowResults = () => {
    setStep(3);
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setStep(1);
    setName('');
    setSelectedVotes([]);
    setHasVoted(false);
  };

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url + `?room=${session?.code}`);
    setSnackMsg('הלינק הועתק! שתף עם החברים 🔗');
    setSnackOpen(true);
  };

  // תוצאות מיון
  const sortedResults = session
    ? Object.entries(session.votes || {})
        .sort(([, a], [, b]) => b - a)
    : [];
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
        {/* כותרת */}
        <Box textAlign="center" mb={5}>
          <Typography variant="h3" fontWeight={800} sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: { xs: '1.8rem', md: '3rem' }
          }}>
            🗳️ טיול קבוצתי
          </Typography>
          <Typography variant="h6" color="text.secondary" mt={1}>
            הצביעו יחד ובחרו את היעד המנצח
          </Typography>
        </Box>

        {/* שלב 1: הגדרה */}
        {step === 1 && (
          <Paper elevation={4} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Avatar sx={{ bgcolor: '#667eea', width: 48, height: 48 }}>
                <GroupIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">צור חדר הצבעה</Typography>
                <Typography variant="body2" color="text.secondary">הזמן חברים ובחרו יחד</Typography>
              </Box>
            </Box>

            <TextField
              fullWidth
              label="השם שלך"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="הזן שם..."
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
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 700
                }}
              >
                צור חדר חדש
              </Button>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={handleJoinOrLoad}
                sx={{ py: 1.5, borderRadius: 3, fontWeight: 700 }}
              >
                הצטרף לחדר קיים
              </Button>
            </Stack>

            <Box mt={3} p={2} bgcolor="#f8f9ff" borderRadius={2}>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                💡 הנתונים נשמרים מקומית בדפדפן. שתף את הלינק עם החברים שלך כדי לאפשר הצבעה משותפת.
              </Typography>
            </Box>
          </Paper>
        )}

        {/* שלב 2: הצבעה */}
        {step === 2 && session && (
          <>
            {/* כרטיס מידע */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    🎯 קוד חדר: <Chip label={session.code} sx={{ fontWeight: 700, fontSize: '1rem', bgcolor: '#667eea22', color: '#667eea' }} />
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.5}>
                    {session.participants.length} משתתפים רשומים
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
                    העתק לינק
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<EmojiEventsIcon />}
                    onClick={handleShowResults}
                    size="small"
                    sx={{ background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)', borderRadius: 2 }}
                  >
                    הצג תוצאות
                  </Button>
                </Stack>
              </Box>

              {/* משתתפים */}
              {session.participants.length > 0 && (
                <Box mt={2}>
                  <Typography variant="body2" color="text.secondary" mb={1}>משתתפים:</Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {session.participants.map((p, i) => (
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
              {hasVoted ? '✅ הצבעת! ממתין לשאר...' : `בחר עד 3 יעדים מועדפים (נבחרו: ${selectedVotes.length}/3)`}
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
                  disabled={selectedVotes.length === 0}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    px: 6,
                    py: 1.8,
                    borderRadius: 3,
                    fontWeight: 700,
                    fontSize: '1.1rem'
                  }}
                >
                  הצבע! 🗳️
                </Button>
              </Box>
            )}
          </>
        )}

        {/* שלב 3: תוצאות */}
        {step === 3 && session && (
          <Paper elevation={4} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
            <Typography variant="h4" fontWeight={800} textAlign="center" mb={1}>
              🏆 תוצאות ההצבעה
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
                  {winner[1]} קולות · המנצח!
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
                  תכנן את הטיול ל{winner[0]} ←
                </Button>
              </Box>
            )}

            {sortedResults.length === 0 && (
              <Typography textAlign="center" color="text.secondary">
                עדיין אין הצבעות. הזמן חברים!
              </Typography>
            )}

            <Typography variant="h6" fontWeight="bold" mb={2}>כל התוצאות:</Typography>
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
                    <Typography fontWeight={700} color="#667eea">{votes} קולות</Typography>
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
                חזור להצבעה
              </Button>
              <Button
                variant="contained"
                color="error"
                fullWidth
                onClick={handleReset}
                sx={{ borderRadius: 2 }}
              >
                אפס והתחל מחדש
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
