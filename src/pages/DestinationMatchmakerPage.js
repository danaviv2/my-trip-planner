import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  LinearProgress,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Button,
  Fade,
  CircularProgress,
  Grid,
} from '@mui/material';

const GEMINI_API_KEY =
  process.env.REACT_APP_GEMINI_API_KEY || window.env?.REACT_APP_GEMINI_API_KEY;
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const QUESTIONS = [
  {
    text: 'מה מצב הרוח שלך לטיול הבא?',
    options: [
      { emoji: '🏔️', label: 'הרפתקה וריגוש' },
      { emoji: '🏖️', label: 'מנוחה ורגיעה' },
      { emoji: '🏛️', label: 'תרבות והיסטוריה' },
      { emoji: '🍷', label: 'אוכל ויין' },
    ],
  },
  {
    text: 'כמה זמן יש לך?',
    options: [
      { emoji: '⚡', label: 'סוף שבוע (2-3 ימים)' },
      { emoji: '🗓️', label: 'שבוע' },
      { emoji: '🌍', label: 'שבועיים' },
      { emoji: '🚀', label: 'חודש +' },
    ],
  },
  {
    text: 'עם מי אתה טס?',
    options: [
      { emoji: '🧘', label: 'לבד' },
      { emoji: '💑', label: 'זוג' },
      { emoji: '👨‍👩‍👧', label: 'משפחה עם ילדים' },
      { emoji: '🎉', label: "חבר'ה" },
    ],
  },
  {
    text: 'מה התקציב?',
    options: [
      { emoji: '🪙', label: 'חסכני' },
      { emoji: '💳', label: 'בינוני' },
      { emoji: '💎', label: 'מפנק' },
      { emoji: '♾️', label: 'שמיים הגבול' },
    ],
  },
  {
    text: 'איזו עונה?',
    options: [
      { emoji: '🌸', label: 'אביב' },
      { emoji: '☀️', label: 'קיץ' },
      { emoji: '🍂', label: 'סתיו' },
      { emoji: '❄️', label: 'חורף' },
    ],
  },
];

function OptionCard({ option, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Card
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        borderRadius: 3,
        border: '2px solid',
        borderColor: hovered ? '#f7971e' : 'rgba(247, 151, 30, 0.2)',
        transform: hovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        transition: 'all 0.22s ease',
        boxShadow: hovered
          ? '0 12px 32px rgba(247, 151, 30, 0.22)'
          : '0 2px 8px rgba(0,0,0,0.07)',
        background: hovered
          ? 'linear-gradient(135deg, rgba(247,151,30,0.08) 0%, rgba(231,76,60,0.08) 100%)'
          : '#fff',
        cursor: 'pointer',
      }}
    >
      <CardActionArea onClick={onClick} sx={{ borderRadius: 3 }}>
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            py: 3,
            px: 2,
          }}
        >
          <Typography fontSize={40} lineHeight={1}>
            {option.emoji}
          </Typography>
          <Typography
            variant="body1"
            fontWeight={600}
            textAlign="center"
            color="text.primary"
            sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}
          >
            {option.label}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function DestinationCard({ destination, rank }) {
  const isTop = rank === 0;

  return (
    <Card
      sx={{
        borderRadius: 4,
        border: isTop ? '2.5px solid #f7971e' : '1.5px solid rgba(0,0,0,0.08)',
        boxShadow: isTop
          ? '0 8px 32px rgba(247,151,30,0.18)'
          : '0 4px 16px rgba(0,0,0,0.07)',
        position: 'relative',
        overflow: 'visible',
        background: isTop
          ? 'linear-gradient(135deg, rgba(247,151,30,0.04) 0%, rgba(231,76,60,0.04) 100%)'
          : '#fff',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.13)',
        },
      }}
    >
      {isTop && (
        <Box
          sx={{
            position: 'absolute',
            top: -18,
            right: 24,
            background: 'linear-gradient(135deg, #f7971e 0%, #e74c3c 100%)',
            color: '#fff',
            borderRadius: 20,
            px: 2,
            py: 0.5,
            fontSize: '0.8rem',
            fontWeight: 700,
            boxShadow: '0 4px 12px rgba(247,151,30,0.4)',
            zIndex: 1,
          }}
        >
          #1 ההתאמה הטובה ביותר
        </Box>
      )}

      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        {/* Emoji + Name + Score row */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Typography fontSize={{ xs: 48, sm: 56 }} lineHeight={1}>
            {destination.emoji}
          </Typography>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h5" fontWeight={800} color="text.primary" gutterBottom={false}>
              {destination.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={1}>
              {destination.country}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" fontWeight={700} color="#f7971e" noWrap>
                התאמה: {destination.matchScore}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={destination.matchScore}
              sx={{
                mt: 0.5,
                height: 6,
                borderRadius: 3,
                backgroundColor: 'rgba(247,151,30,0.15)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #f7971e 0%, #e74c3c 100%)',
                  borderRadius: 3,
                },
              }}
            />
          </Box>
        </Box>

        {/* Tagline */}
        <Typography
          variant="body1"
          fontStyle="italic"
          color="text.secondary"
          sx={{ mb: 1.5, fontWeight: 500 }}
        >
          {destination.tagline}
        </Typography>

        {/* Why perfect */}
        <Typography variant="body2" color="text.primary" sx={{ mb: 2, lineHeight: 1.7 }}>
          {destination.whyPerfect}
        </Typography>

        {/* Highlights */}
        {Array.isArray(destination.highlights) && destination.highlights.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {destination.highlights.map((h, i) => (
              <Chip
                key={i}
                label={h}
                size="small"
                sx={{
                  background: 'linear-gradient(135deg, rgba(247,151,30,0.12) 0%, rgba(231,76,60,0.12) 100%)',
                  border: '1px solid rgba(247,151,30,0.3)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              />
            ))}
          </Box>
        )}

        {/* bestTime + budgetHint */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {destination.bestTime && (
            <Chip
              label={`🗓️ ${destination.bestTime}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.72rem', borderColor: 'rgba(0,0,0,0.15)' }}
            />
          )}
          {destination.budgetHint && (
            <Chip
              label={`💰 ${destination.budgetHint}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.72rem', borderColor: 'rgba(0,0,0,0.15)' }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DestinationMatchmakerPage() {
  const navigate = useNavigate();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [fadeIn, setFadeIn] = useState(true);

  const handleAnswer = async (label) => {
    const newAnswers = [...answers, label];
    setAnswers(newAnswers);

    if (currentQ < 4) {
      // Animate out → change question → animate in
      setFadeIn(false);
      setTimeout(() => {
        setCurrentQ((q) => q + 1);
        setFadeIn(true);
      }, 200);
    } else {
      // Last question — call Gemini
      setLoading(true);
      setError(null);
      try {
        const [q1, q2, q3, q4] = newAnswers;
        const q5 = label;
        const prompt = `אתה יועץ טיולים מומחה. בהתבסס על העדפות המטייל, המלץ על 3 יעדים מושלמים.

העדפות:
- מצב רוח: ${q1}
- משך: ${q2}
- עם מי: ${q3}
- תקציב: ${q4}
- עונה: ${q5}

החזר JSON בלבד ללא markdown ובלי קוד בלוק:
[
  {
    "name": "שם היעד בעברית",
    "country": "מדינה",
    "emoji": "🏔️",
    "matchScore": 98,
    "tagline": "משפט קצר ומדליק",
    "whyPerfect": "2-3 משפטים למה זה מושלם עבורך",
    "highlights": ["highlight1", "highlight2", "highlight3"],
    "bestTime": "מתי הכי טוב לבקר",
    "budgetHint": "רמת עלות כללית"
  }
]`;

        const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.9, maxOutputTokens: 1500 },
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Matchmaker Gemini response:', JSON.stringify(data).slice(0, 500));
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
          throw new Error('Empty response from Gemini');
        }

        // Extract JSON array — handles markdown fences AND extra surrounding text
        const arrayMatch = rawText.match(/\[[\s\S]*\]/);
        if (!arrayMatch) throw new Error('No JSON array found in response');

        const parsed = JSON.parse(arrayMatch[0]);
        const destinations = Array.isArray(parsed) ? parsed.slice(0, 3) : [];
        if (destinations.length === 0) throw new Error('No destinations returned');
        setResults(destinations);
      } catch (err) {
        console.error('Matchmaker Gemini error:', err);
        setError(err.message || 'שגיאה לא ידועה');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReset = () => {
    setCurrentQ(0);
    setAnswers([]);
    setResults(null);
    setError(null);
    setLoading(false);
    setFadeIn(true);
  };

  const progress = ((currentQ) / 5) * 100;

  return (
    <Box
      dir="rtl"
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #fff8f0 0%, #fff 60%, #fff5f5 100%)',
        pb: 8,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #f7971e 0%, #e74c3c 100%)',
          color: '#fff',
          py: { xs: 4, sm: 5 },
          px: 2,
          textAlign: 'center',
          boxShadow: '0 4px 24px rgba(231,76,60,0.25)',
          mb: { xs: 3, sm: 4 },
        }}
      >
        <Typography
          variant="h4"
          fontWeight={900}
          sx={{ fontSize: { xs: '1.6rem', sm: '2.1rem' }, mb: 0.5 }}
        >
          🎯 מצ'קמייקר יעדים
        </Typography>
        <Typography
          variant="body1"
          sx={{ opacity: 0.92, fontSize: { xs: '0.9rem', sm: '1rem' } }}
        >
          ענה על 5 שאלות — AI ימצא לך את היעד המושלם
        </Typography>
      </Box>

      <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
        {/* LOADING STATE */}
        {loading && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 320,
              gap: 3,
            }}
          >
            <CircularProgress
              size={64}
              thickness={4}
              sx={{
                color: '#f7971e',
              }}
            />
            <Typography
              variant="h6"
              fontWeight={700}
              textAlign="center"
              sx={{
                background: 'linear-gradient(135deg, #f7971e 0%, #e74c3c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              AI מחפש את היעד המושלם שלך... ✨
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              מנתח את ההעדפות שלך ומוצא התאמות מושלמות
            </Typography>
          </Box>
        )}

        {/* ERROR STATE */}
        {!loading && !!error && (
          <Fade in timeout={400}>
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography fontSize={64} mb={2}>😕</Typography>
              <Typography variant="h6" fontWeight={700} mb={1}>
                לא הצלחנו לקבל המלצות
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                בעיה בחיבור ל-AI. בדוק שיש חיבור לאינטרנט ונסה שוב.
              </Typography>
              <Typography variant="caption" color="error" sx={{ fontFamily: 'monospace', mb: 3, display: 'block' }}>
                {error}
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleReset}
                sx={{
                  background: 'linear-gradient(135deg, #f7971e 0%, #e74c3c 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                }}
              >
                נסה שוב 🔄
              </Button>
            </Box>
          </Fade>
        )}

        {/* RESULTS STATE */}
        {!loading && !error && results && (
          <Fade in timeout={600}>
            <Box>
              <Typography
                variant="h5"
                fontWeight={800}
                textAlign="center"
                mb={1}
                sx={{
                  background: 'linear-gradient(135deg, #f7971e 0%, #e74c3c 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '1.3rem', sm: '1.6rem' },
                }}
              >
                🎯 היעדים המושלמים שלך
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
                mb={4}
              >
                בהתבסס על ההעדפות שלך, AI בחר עבורך את ההתאמות הטובות ביותר
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
                {results.map((dest, i) => (
                  <DestinationCard key={i} destination={dest} rank={i} />
                ))}
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  mt: 2,
                }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/rolling-trip')}
                  sx={{
                    background: 'linear-gradient(135deg, #f7971e 0%, #e74c3c 100%)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1rem',
                    borderRadius: 3,
                    px: 4,
                    py: 1.5,
                    boxShadow: '0 4px 18px rgba(247,151,30,0.35)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #e08a18 0%, #c0392b 100%)',
                      boxShadow: '0 6px 24px rgba(247,151,30,0.45)',
                    },
                  }}
                >
                  תכנן טיול ✈️
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleReset}
                  sx={{
                    borderColor: '#f7971e',
                    color: '#f7971e',
                    fontWeight: 700,
                    fontSize: '1rem',
                    borderRadius: 3,
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      borderColor: '#e74c3c',
                      background: 'rgba(247,151,30,0.06)',
                    },
                  }}
                >
                  נסה שוב 🔄
                </Button>
              </Box>
            </Box>
          </Fade>
        )}

        {/* QUIZ STATE */}
        {!loading && !results && !error && currentQ < 5 && (
          <Box>
            {/* Progress */}
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1,
                }}
              >
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                  שאלה {currentQ + 1} מתוך 5
                </Typography>
                <Typography variant="body2" fontWeight={700} color="#f7971e">
                  {Math.round(progress)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(247,151,30,0.15)',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #f7971e 0%, #e74c3c 100%)',
                    borderRadius: 4,
                  },
                }}
              />
            </Box>

            {/* Question Card */}
            <Fade in={fadeIn} timeout={250}>
              <Box>
                {/* Question text */}
                <Card
                  sx={{
                    borderRadius: 4,
                    mb: 3,
                    background: 'linear-gradient(135deg, rgba(247,151,30,0.06) 0%, rgba(231,76,60,0.06) 100%)',
                    border: '1.5px solid rgba(247,151,30,0.18)',
                    boxShadow: '0 2px 12px rgba(247,151,30,0.08)',
                  }}
                >
                  <CardContent sx={{ py: 3, px: { xs: 2.5, sm: 4 }, textAlign: 'center' }}>
                    <Typography
                      variant="h5"
                      fontWeight={800}
                      color="text.primary"
                      sx={{ fontSize: { xs: '1.15rem', sm: '1.4rem' } }}
                    >
                      {QUESTIONS[currentQ].text}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Options 2x2 grid */}
                <Grid container spacing={2}>
                  {QUESTIONS[currentQ].options.map((option, idx) => (
                    <Grid item xs={12} sm={6} key={idx}>
                      <OptionCard
                        option={option}
                        onClick={() => handleAnswer(option.label)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Fade>
          </Box>
        )}
      </Container>
    </Box>
  );
}
