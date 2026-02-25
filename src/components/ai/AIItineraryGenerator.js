import React, { useState } from 'react';
import {
  Box, Typography, Button, Paper, Skeleton, Alert,
  Accordion, AccordionSummary, AccordionDetails,
  Chip, Stack, Tooltip, Divider, LinearProgress
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import { callOpenAI, getErrorMessage } from '../../services/openaiService';

const BUDGET_LABELS = { low: 'תקציבי', medium: 'בינוני', high: 'פרמיום' };
const PACE_LABELS = { slow: 'איטי', medium: 'בינוני', fast: 'מהיר' };
const STYLE_LABELS = {
  cultural: 'תרבותי', adventure: 'הרפתקני', relaxation: 'מנוחה',
  culinary: 'קולינרי', nature: 'טבע', urban: 'עירוני', mixed: 'מעורב'
};

function buildPrompt(destination, preferences) {
  const { days = 7, budget = 'medium', startDate, advancedPreferences = {} } = preferences;
  const { travelPace = 'medium', travelStyle = 'mixed', hasChildren = false, foodPreferences = '' } = advancedPreferences;

  return `תכנן מסלול טיול מפורט ל-${destination}.

פרטי הטיול:
- ימים: ${days}
- תקציב: ${BUDGET_LABELS[budget] || budget}
- קצב: ${PACE_LABELS[travelPace] || travelPace}
- סגנון: ${STYLE_LABELS[travelStyle] || travelStyle}
- ילדים: ${hasChildren ? 'כן' : 'לא'}
${foodPreferences ? `- העדפות אוכל: ${foodPreferences}` : ''}
${startDate ? `- תאריך התחלה: ${startDate}` : ''}

החזר JSON בלבד (ללא markdown) עם המבנה הבא:
{
  "summary": "תיאור קצר של הטיול",
  "days": [
    {
      "day": 1,
      "title": "כותרת היום",
      "theme": "אמוג'י + נושא",
      "morning": "פעילות בוקר",
      "afternoon": "פעילות אחה\"צ",
      "evening": "פעילות ערב",
      "food": "המלצת מסעדה/אוכל",
      "tip": "טיפ שימושי",
      "cost": "$XX-XX"
    }
  ],
  "totalBudget": "$XXX-XXX",
  "mustSee": ["אטרקציה 1", "אטרקציה 2", "אטרקציה 3"],
  "avoid": "דבר אחד להימנע ממנו"
}`;
}

function DaySkeleton() {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Skeleton variant="rounded" height={56} sx={{ borderRadius: 2 }} />
    </Box>
  );
}

function DayCard({ day, defaultExpanded }) {
  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      sx={{
        mb: 1,
        borderRadius: '12px !important',
        border: '1px solid rgba(102,126,234,0.15)',
        '&:before': { display: 'none' },
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{ borderRadius: 3 }}
      >
        <Box display="flex" alignItems="center" gap={1.5} width="100%">
          <Typography
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.85rem',
              flexShrink: 0
            }}
          >
            {day.day}
          </Typography>
          <Box flex={1}>
            <Typography fontWeight={700} sx={{ fontSize: '0.95rem' }}>
              {day.theme} {day.title}
            </Typography>
          </Box>
          {day.cost && (
            <Chip label={day.cost} size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 600, fontSize: '0.75rem' }} />
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0, pb: 2 }}>
        <Stack spacing={1.5}>
          {[
            { time: '☀️ בוקר', content: day.morning },
            { time: '🌤️ אחה"צ', content: day.afternoon },
            { time: '🌙 ערב', content: day.evening },
          ].map(({ time, content }) => (
            <Box key={time} display="flex" gap={1.5} alignItems="flex-start">
              <Typography variant="body2" sx={{ minWidth: 70, fontWeight: 600, color: '#667eea', flexShrink: 0 }}>
                {time}
              </Typography>
              <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                {content}
              </Typography>
            </Box>
          ))}
          {day.food && (
            <Box display="flex" gap={1.5} alignItems="flex-start">
              <Typography variant="body2" sx={{ minWidth: 70, fontWeight: 600, color: '#f5576c', flexShrink: 0 }}>
                🍽️ אוכל
              </Typography>
              <Typography variant="body2" color="text.secondary">{day.food}</Typography>
            </Box>
          )}
          {day.tip && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: '#fff3cd',
                border: '1px solid #ffd54f'
              }}
            >
              <Typography variant="body2" sx={{ color: '#856404' }}>
                💡 <strong>טיפ:</strong> {day.tip}
              </Typography>
            </Box>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

export default function AIItineraryGenerator({ destination, preferences }) {
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const generate = async () => {
    if (!destination) return;
    setLoading(true);
    setError('');
    setItinerary(null);
    setProgress(0);

    // Fake progress animation
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 8, 85));
    }, 400);

    try {
      const prompt = buildPrompt(destination, preferences);
      const raw = await callOpenAI(
        [
          { role: 'system', content: 'אתה מתכנן טיולים מקצועי. החזר JSON תקין בלבד, ללא markdown, ללא ```json.' },
          { role: 'user', content: prompt }
        ],
        { maxTokens: 2000, temperature: 0.7 }
      );

      clearInterval(progressInterval);
      setProgress(100);

      // Parse JSON
      let parsed;
      try {
        // נסה לחלץ JSON גם אם יש תוכן נוסף
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
      } catch {
        throw new Error('JSON_PARSE');
      }

      setItinerary(parsed);

      // שמור ב-localStorage
      const saved = JSON.parse(localStorage.getItem('aiItineraries') || '[]');
      saved.unshift({ destination, date: new Date().toLocaleDateString('he-IL'), itinerary: parsed });
      localStorage.setItem('aiItineraries', JSON.stringify(saved.slice(0, 5)));

    } catch (err) {
      clearInterval(progressInterval);
      if (err.message === 'JSON_PARSE') {
        setError('קיבלנו תגובה לא תקנית — נסה שוב');
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  const isDisabled = !destination;

  return (
    <Paper
      elevation={3}
      sx={{
        mb: 2,
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid rgba(102,126,234,0.2)'
      }}
    >
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        px: 3,
        py: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'white'
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <AutoAwesomeIcon />
          <Typography fontWeight={700} fontSize="1rem">מסלול חכם עם AI ✨</Typography>
        </Box>
        {itinerary && (
          <Chip
            label={itinerary.totalBudget}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
          />
        )}
      </Box>

      <Box sx={{ p: 2.5 }}>
        {/* Generate Button */}
        {!itinerary && !loading && (
          <>
            <Typography variant="body2" color="text.secondary" mb={2} textAlign="center">
              {isDisabled
                ? '🗺️ הזן יעד כדי ליצור מסלול AI מותאם אישית'
                : `🌍 ניצור מסלול ל-${preferences?.days || 7} ימים ב-${destination}`}
            </Typography>
            <Tooltip title={isDisabled ? 'הזן יעד תחילה' : ''} placement="top">
              <span style={{ display: 'block' }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<AutoAwesomeIcon />}
                  onClick={generate}
                  disabled={isDisabled}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    py: 1.5,
                    borderRadius: 3,
                    fontWeight: 700,
                    fontSize: '1rem',
                    '&:hover': { transform: 'scale(1.02)' }
                  }}
                >
                  צור מסלול עם AI 🤖
                </Button>
              </span>
            </Tooltip>
          </>
        )}

        {/* Loading */}
        {loading && (
          <Box>
            <Typography variant="body2" color="text.secondary" textAlign="center" mb={2}>
              🤖 AI בונה לך מסלול מושלם ל-{destination}...
            </Typography>
            {progress > 0 && (
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  mb: 2,
                  height: 6,
                  borderRadius: 3,
                  bgcolor: '#f0f0f0',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #667eea, #764ba2)',
                    borderRadius: 3
                  }
                }}
              />
            )}
            {[1, 2, 3].map((i) => <DaySkeleton key={i} />)}
          </Box>
        )}

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} action={
            <Button size="small" onClick={generate} startIcon={<RefreshIcon />}>נסה שוב</Button>
          }>
            {error}
          </Alert>
        )}

        {/* Results */}
        {itinerary && (
          <Box>
            {itinerary.summary && (
              <Typography variant="body2" color="text.secondary" mb={2} textAlign="center" sx={{ fontStyle: 'italic' }}>
                {itinerary.summary}
              </Typography>
            )}

            {itinerary.days?.map((day, i) => (
              <DayCard key={day.day} day={day} defaultExpanded={i === 0} />
            ))}

            {itinerary.mustSee?.length > 0 && (
              <Box mt={2}>
                <Typography variant="body2" fontWeight={700} mb={1}>🌟 חובה לראות:</Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.8}>
                  {itinerary.mustSee.map((item) => (
                    <Chip key={item} label={item} size="small" sx={{ bgcolor: '#667eea22', color: '#667eea', fontWeight: 600 }} />
                  ))}
                </Stack>
              </Box>
            )}

            {itinerary.avoid && (
              <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                ⚠️ <strong>כדאי להימנע:</strong> {itinerary.avoid}
              </Alert>
            )}

            <Divider sx={{ my: 2 }} />

            <Button
              variant="outlined"
              fullWidth
              startIcon={<RefreshIcon />}
              onClick={generate}
              sx={{ borderRadius: 2, borderColor: '#667eea', color: '#667eea' }}
            >
              תכנן מחדש
            </Button>
          </Box>
        )}
      </Box>
    </Paper>
  );
}
