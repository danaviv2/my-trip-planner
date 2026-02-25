import React, { useState, useEffect } from 'react';
import {
  Modal, Box, Typography, Button, Chip, Stack, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CasinoIcon from '@mui/icons-material/Casino';
import { useNavigate } from 'react-router-dom';
import AIDestinationInsights from '../ai/AIDestinationInsights';

const DESTINATIONS = [
  {
    name: 'בלי', emoji: '🏖️', description: 'גן עדן טרופי עם חופים לבנים, מקדשים עתיקים ואוכל מדהים',
    itinerary: ['יום 1: טיול בעיר אובוד ויערות קופים', 'יום 2: חוף Seminyak וזריחה בסנסט', 'יום 3: טיול לטאנה לוט ומקדשי הים'],
    dailyBudget: 80, season: 'אפריל-אוקטובר', pack: ['בגדי ים', 'קרם הגנה', 'כיסוי לביקור מקדשים']
  },
  {
    name: 'קיוטו', emoji: '⛩️', description: 'עיר המקדשים, הגנים הזן והגיישות של יפן',
    itinerary: ['יום 1: נצרת במקדש פושימי אינארי', 'יום 2: גן ארשי-יאמה ויערות הבמבוק', 'יום 3: שוק נישיקי ומתחם גיון'],
    dailyBudget: 120, season: 'מרץ-מאי, אוקטובר-נובמבר', pack: ['נעליים נוחות', 'מטריה', 'קמרה']
  },
  {
    name: 'סנטוריני', emoji: '🌅', description: 'האי הרומנטי של יוון עם בנייה לבנה ושקיעות מהממות',
    itinerary: ['יום 1: הליכה לאויה לשקיעה', 'יום 2: סיור בפירה ושייט לוולקנו', 'יום 3: חוף הרד וטייסטינג יינות'],
    dailyBudget: 150, season: 'מאי-ספטמבר', pack: ['בגדים קלים', 'נעלי עקב', 'מצלמה']
  },
  {
    name: 'איסלנד', emoji: '🌋', description: 'ארץ האש והקרח עם ראליות צפוניות ובולענות',
    itinerary: ['יום 1: Golden Circle - גייזר ומפלים', 'יום 2: חוף שחור וחופי גלדאולופ', 'יום 3: ראליות צפוניות בלילה'],
    dailyBudget: 200, season: 'ספטמבר-מרץ לראליות, יוני-אוגוסט לאור', pack: ['בגדים חמים', 'מעיל גשם', 'נעלי הרים']
  },
  {
    name: 'מרוקו - מרקש', emoji: '🕌', description: 'שוקי הכאוס, הרחובות הצבועים ורוח המדבר',
    itinerary: ['יום 1: שוק ג\'מא אל-פנא ורחובות המדינה', 'יום 2: טיול למדבר הסהרה', 'יום 3: אטלס ועיירות ברברים'],
    dailyBudget: 60, season: 'אוקטובר-אפריל', pack: ['בגדים צנועים', 'שרוולים ארוכים', 'מסנן UPF']
  },
  {
    name: 'פטגוניה', emoji: '🏔️', description: 'הסוף העולם - קרחונים, הרי טורס דל פאינה ופורשים',
    itinerary: ['יום 1: טיול ל-Torres del Paine', 'יום 2: קרחון פריטו מורנו', 'יום 3: שייט בין הקרחונים'],
    dailyBudget: 110, season: 'נובמבר-מרץ', pack: ['ציוד הרים', 'שכבות חמות', 'גשמים']
  },
  {
    name: 'טוקיו', emoji: '🗼', description: 'עיר העתיד - טכנולוגיה, אנימה, סושי ועכשיו',
    itinerary: ['יום 1: שיבויה ושינג\'וקו', 'יום 2: אסאקוסה ומקדש סנסו-ג\'י', 'יום 3: אקיהאברה ו-Teamlab'],
    dailyBudget: 130, season: 'מרץ-אפריל, אוקטובר-נובמבר', pack: ['קמרת הליכה', 'כסף מזומן', 'ביגוד שכבות']
  },
  {
    name: 'קייב', emoji: '🏯', description: 'עיר היסטורית של אפריקה עם ספארי ואדריכלות קולוניאלית',
    itinerary: ['יום 1: ספארי בפארק הלאומי', 'יום 2: שוק מסאי', 'יום 3: שיט בנחל'],
    dailyBudget: 90, season: 'יוני-אוקטובר', pack: ['חולצות ארוכות', 'כובע', 'נרות']
  },
  {
    name: 'דובאי', emoji: '🌆', description: 'עיר העתיד במדבר - גורדי שחקים, מדבר ורפאות',
    itinerary: ['יום 1: בורג\' ח\'ליפה וסוק הזהב', 'יום 2: ספארי מדבר עם BBQ', 'יום 3: פאלם ג\'ומיירה ומי-ים'],
    dailyBudget: 180, season: 'נובמבר-אפריל', pack: ['בגדים קלים', 'בגדי ים', 'גוגלס לשמש']
  },
  {
    name: 'ריו דה-ז\'ניירו', emoji: '🌴', description: 'קרניבל, חופים, ג\'ונגל וסמבה',
    itinerary: ['יום 1: קריסטו רדמטור ועיר', 'יום 2: חוף קופקבנה ואיפנמה', 'יום 3: ג\'ונגל טיג\'וקה'],
    dailyBudget: 100, season: 'ספטמבר-מרץ', pack: ['בגדי ים', 'הדחות', 'בגדי ריקוד']
  },
  {
    name: 'נפאל - קטמנדו', emoji: '🏔️', description: 'שער האוורסט, מקדשים הינדים ואנשים מדהימים',
    itinerary: ['יום 1: בודאנאת ובהקטאפור', 'יום 2: טיול לפוקהרה', 'יום 3: סיור מקדשים ותרבות שרפה'],
    dailyBudget: 50, season: 'מרץ-מאי, אוקטובר-נובמבר', pack: ['בגדי שכבות', 'נעלי הרים', 'תרופות']
  },
  {
    name: 'ניו זילנד', emoji: '🐑', description: 'הלורד אוף דה רינגס - פיורדים, הוביטון וספורט אתגרי',
    itinerary: ['יום 1: מילפורד סאונד', 'יום 2: הוביטון ורוטורואה', 'יום 3: קווינסטאון - בנג\'י ג\'אמפינג'],
    dailyBudget: 160, season: 'נובמבר-מרץ', pack: ['ציוד הרים', 'מצלמת אקשן', 'שכבות']
  },
  {
    name: 'פורטוגל - ליסבון', emoji: '🌉', description: 'עיר שבעת הגבעות עם פאדו, פסטל דה נאטה ותרמיות',
    itinerary: ['יום 1: אלפמה ושוק פירה', 'יום 2: סינטרה ופאלאסיו דה פנה', 'יום 3: בלם ואז\'ולז\'וס'],
    dailyBudget: 90, season: 'מרץ-נובמבר', pack: ['נעליים נוחות', 'שכבה קלה', 'מסנן']
  },
  {
    name: 'קולומביה - קרטאחנה', emoji: '🌺', description: 'עיר מצבות קולוניאלית, קפה איכותי ואנשים נלהבים',
    itinerary: ['יום 1: עיר המצודה ואמנות רחוב', 'יום 2: איי רוסריו', 'יום 3: שוק ביאסאדה קפה'],
    dailyBudget: 70, season: 'דצמבר-אפריל', pack: ['בגדים קלים', 'בגדי ים', 'פייסות']
  },
  {
    name: 'אתיופיה - לאליבלה', emoji: '✝️', description: 'כנסיות חצובות בסלע, לאנה אחרת ובאמהרית',
    itinerary: ['יום 1: כנסיות הסלע של לאליבלה', 'יום 2: אגם טאנה ומנזרים', 'יום 3: עמק אומו ותרבויות'],
    dailyBudget: 55, season: 'אוקטובר-ינואר', pack: ['כיסוי ראש', 'נעלי הרים', 'אנטיביוטיקה']
  }
];

export default function SurpriseTripModal({ open, onClose }) {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [opacity, setOpacity] = useState(1);

  const getRandomDest = () => {
    const idx = Math.floor(Math.random() * DESTINATIONS.length);
    return DESTINATIONS[idx];
  };

  useEffect(() => {
    if (open && !current) {
      setCurrent(getRandomDest());
    }
  }, [open]);

  const handleRoll = () => {
    if (animating) return;
    setAnimating(true);
    let count = 0;
    const interval = setInterval(() => {
      setOpacity(0);
      setTimeout(() => {
        setCurrent(getRandomDest());
        setOpacity(1);
      }, 150);
      count++;
      if (count >= 3) {
        clearInterval(interval);
        setAnimating(false);
      }
    }, 350);
  };

  const handleStartPlanning = () => {
    onClose();
    navigate(`/trip-planner?destination=${encodeURIComponent(current?.name || '')}`);
  };

  if (!current) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '95vw', sm: 560 },
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: 4,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: { xs: 3, md: 5 },
        boxShadow: '0 30px 80px rgba(102,126,234,0.5)',
        outline: 'none',
        color: 'white',
        textAlign: 'center'
      }}>
        {/* כפתור סגירה */}
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 12, right: 12, color: 'white' }}
        >
          <CloseIcon />
        </IconButton>

        <Typography variant="h5" fontWeight="bold" mb={1}>
          🎲 הפתיעו אותי!
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.85, mb: 3 }}>
          נגלגל בשבילך יעד אקראי מדהים
        </Typography>

        {/* כרטיס יעד */}
        <Box sx={{
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(10px)',
          borderRadius: 4,
          p: { xs: 3, md: 4 },
          mb: 3,
          transition: 'opacity 0.15s ease',
          opacity: opacity,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }}>
          <Typography sx={{ fontSize: { xs: '4rem', md: '5rem' }, lineHeight: 1, mb: 2 }}>
            {current.emoji}
          </Typography>
          <Typography variant="h4" fontWeight="bold" mb={1.5} sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
            {current.name}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, mb: 3, lineHeight: 1.7 }}>
            {current.description}
          </Typography>

          <Box sx={{ textAlign: 'right', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" mb={1}>📅 3 ימים - מה לעשות:</Typography>
            {current.itinerary.map((day, i) => (
              <Typography key={i} variant="body2" sx={{ opacity: 0.9, mb: 0.5, textAlign: 'right' }}>
                {day}
              </Typography>
            ))}
          </Box>

          {/* AI Destination Insights */}
          <AIDestinationInsights destinationName={current.name} visible={open} />

          <Stack direction="row" flexWrap="wrap" gap={1} justifyContent="center" mt={2}>
            <Chip
              label={`💰 ~$${current.dailyBudget}/יום`}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
            />
            <Chip
              label={`📆 ${current.season}`}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
            />
          </Stack>

          {current.pack.length > 0 && (
            <Box mt={2}>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                🧳 חובה לארוז: {current.pack.join(' • ')}
              </Typography>
            </Box>
          )}
        </Box>

        {/* כפתורים */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button
            variant="contained"
            onClick={handleRoll}
            disabled={animating}
            startIcon={<CasinoIcon />}
            sx={{
              background: 'rgba(255,255,255,0.25)',
              color: 'white',
              fontWeight: 700,
              fontSize: '1rem',
              px: 3,
              py: 1.5,
              borderRadius: 3,
              border: '2px solid rgba(255,255,255,0.5)',
              '&:hover': { background: 'rgba(255,255,255,0.35)' },
              '&.Mui-disabled': { opacity: 0.5, color: 'white' }
            }}
          >
            גלגל שוב 🎲
          </Button>
          <Button
            variant="contained"
            onClick={handleStartPlanning}
            sx={{
              background: 'white',
              color: '#667eea',
              fontWeight: 700,
              fontSize: '1rem',
              px: 3,
              py: 1.5,
              borderRadius: 3,
              '&:hover': { background: 'rgba(255,255,255,0.9)', transform: 'scale(1.05)' }
            }}
          >
            התחל לתכנן ←
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
}
