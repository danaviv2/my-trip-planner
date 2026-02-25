import React, { useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Chip, Button, Paper, Collapse
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const VIBES = [
  { id: 'beach', emoji: '🏖️', label: 'חוף', color: '#00BCD4' },
  { id: 'mountains', emoji: '🏔️', label: 'הרים', color: '#607D8B' },
  { id: 'culture', emoji: '🎨', label: 'תרבות', color: '#9C27B0' },
  { id: 'food', emoji: '🍕', label: 'אוכל', color: '#FF5722' },
  { id: 'party', emoji: '🎉', label: 'מסיבה', color: '#E91E63' },
  { id: 'relax', emoji: '🧘', label: 'שקט', color: '#4CAF50' },
  { id: 'romantic', emoji: '💑', label: 'רומנטי', color: '#F06292' },
  { id: 'adventure', emoji: '🧗', label: 'הרפתקה', color: '#FF9800' },
];

const DESTINATIONS_BY_VIBE = {
  beach: ['תאילנד - קו סמוי', 'מלדיביים', 'בלי, אינדונזיה', 'ברצלונה', 'סנטוריני', 'ריו דה ז\'ניירו'],
  mountains: ['נפאל - היימלאיה', 'פטגוניה', 'הרי האלפים - שוויץ', 'ניו זילנד', 'גרנד קניון', 'דולומיטים - איטליה'],
  culture: ['קיוטו, יפן', 'רומא, איטליה', 'אתונה, יוון', 'מצרים - קהיר', 'קמבודיה - אנגקור וואט', 'פרו - מאצ\'ו פיצ\'ו'],
  food: ['טוקיו, יפן', 'ספרד - סן סבסטיאן', 'איטליה - בולוניה', 'תאילנד - בנגקוק', 'הודו - מומבאי', 'צרפת - ליון'],
  party: ['איביזה, ספרד', 'ברצלונה', 'לאס וגאס', 'ריו - קרניבל', 'מיקונוס, יוון', 'בנגקוק'],
  relax: ['מלדיביים', 'קוסמוי, תאילנד', 'אורנג\'ה, דרום צרפת', 'קיוטו - גני זן', 'ניו זילנד', 'בלי - אובוד'],
  romantic: ['סנטוריני, יוון', 'פריז, צרפת', 'ונציה, איטליה', 'פראג', 'קיוטו - פריחת הדובדבן', 'ורונה, איטליה'],
  adventure: ['פטגוניה', 'ניו זילנד - קווינסטאון', 'איסלנד', 'קוסטה ריקה', 'מזימביק - גלישה', 'עמאן, ירדן'],
};

export default function VibeMatcher() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const toggleVibe = (id) => {
    setShowResults(false);
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(v => v !== id);
      if (prev.length >= 3) return prev; // מקסימום 3
      return [...prev, id];
    });
  };

  const getMatches = () => {
    if (selected.length === 0) return [];
    const counts = {};
    selected.forEach(vibe => {
      (DESTINATIONS_BY_VIBE[vibe] || []).forEach(dest => {
        counts[dest] = (counts[dest] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name]) => name);
  };

  const matches = showResults ? getMatches() : [];

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" textAlign="center" mb={1}>
        🎯 Match the Vibe
      </Typography>
      <Typography variant="body1" color="text.secondary" textAlign="center" mb={3}>
        בחר עד 3 ווייבים ונמצא לך יעדים מושלמים
      </Typography>

      <Grid container spacing={1.5} mb={3} justifyContent="center">
        {VIBES.map(vibe => {
          const isSelected = selected.includes(vibe.id);
          const isDisabled = !isSelected && selected.length >= 3;
          return (
            <Grid item xs={6} sm={3} key={vibe.id}>
              <Card
                onClick={() => !isDisabled && toggleVibe(vibe.id)}
                sx={{
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  textAlign: 'center',
                  borderRadius: 3,
                  border: isSelected ? `3px solid ${vibe.color}` : '3px solid transparent',
                  background: isSelected
                    ? `linear-gradient(135deg, ${vibe.color}22 0%, ${vibe.color}44 100%)`
                    : 'white',
                  opacity: isDisabled ? 0.45 : 1,
                  boxShadow: isSelected ? `0 4px 20px ${vibe.color}55` : '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s ease',
                  '&:hover': !isDisabled ? {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 25px ${vibe.color}44`
                  } : {}
                }}
              >
                <CardContent sx={{ py: 2, px: 1 }}>
                  <Typography sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, lineHeight: 1, mb: 0.5 }}>
                    {vibe.emoji}
                  </Typography>
                  <Typography variant="body2" fontWeight={isSelected ? 700 : 500} color={isSelected ? vibe.color : 'text.primary'}>
                    {vibe.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {selected.length > 0 && (
        <Box textAlign="center" mb={2}>
          <Box mb={1.5}>
            {selected.map(id => {
              const v = VIBES.find(x => x.id === id);
              return (
                <Chip
                  key={id}
                  label={`${v.emoji} ${v.label}`}
                  onDelete={() => toggleVibe(id)}
                  sx={{ m: 0.5, bgcolor: `${v.color}22`, color: v.color, fontWeight: 600 }}
                />
              );
            })}
          </Box>
          <Button
            variant="contained"
            size="large"
            onClick={() => setShowResults(true)}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              px: 5,
              py: 1.5,
              borderRadius: 3,
              fontWeight: 700,
              fontSize: '1rem',
              '&:hover': { transform: 'scale(1.05)' }
            }}
          >
            מצא יעדים מושלמים 🎯
          </Button>
        </Box>
      )}

      <Collapse in={showResults && matches.length > 0}>
        <Box mt={2}>
          <Typography variant="h6" fontWeight="bold" textAlign="center" mb={2}>
            ✨ יעדים מומלצים עבורך
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            {matches.map((dest, i) => (
              <Grid item xs={12} sm={4} key={dest}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    textAlign: 'center',
                    background: [
                      'linear-gradient(135deg, #667eea22 0%, #764ba222 100%)',
                      'linear-gradient(135deg, #f09322 0%, #f5576c22 100%)',
                      'linear-gradient(135deg, #43e97b22 0%, #38f9d722 100%)'
                    ][i],
                    border: '1px solid rgba(102,126,234,0.15)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 12px 30px rgba(0,0,0,0.12)' }
                  }}
                  onClick={() => navigate(`/destination-info/${encodeURIComponent(dest.split(',')[0]?.trim() || dest)}`)}
                >
                  <Typography sx={{ fontSize: '2rem', mb: 1 }}>
                    {['🥇', '🥈', '🥉'][i]}
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" mb={1.5} sx={{ fontSize: '1rem' }}>
                    {dest}
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/trip-planner?destination=${encodeURIComponent(dest)}`);
                    }}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: '0.8rem'
                    }}
                  >
                    תכנן טיול →
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Collapse>
    </Box>
  );
}
