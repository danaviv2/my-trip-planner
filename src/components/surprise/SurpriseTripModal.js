import React, { useState, useEffect } from 'react';
import {
  Modal, Box, Typography, Button, Chip, Stack, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CasinoIcon from '@mui/icons-material/Casino';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AIDestinationInsights from '../ai/AIDestinationInsights';

const DESTINATIONS = [
  {
    name: 'Bali', emoji: '🏖️', description: 'Tropical paradise with white beaches, ancient temples and amazing food',
    itinerary: ['Day 1: Ubud city tour and monkey forest', 'Day 2: Seminyak beach and sunset', 'Day 3: Tanah Lot temple and sea temples'],
    dailyBudget: 80, season: 'April–October', pack: ['Swimwear', 'Sunscreen', 'Temple cover-up']
  },
  {
    name: 'Kyoto', emoji: '⛩️', description: 'City of temples, Zen gardens and geishas of Japan',
    itinerary: ['Day 1: Fushimi Inari shrine', 'Day 2: Arashiyama bamboo forest', 'Day 3: Nishiki Market and Gion district'],
    dailyBudget: 120, season: 'March–May, October–November', pack: ['Comfortable shoes', 'Umbrella', 'Camera']
  },
  {
    name: 'Santorini', emoji: '🌅', description: 'The romantic Greek island with white architecture and breathtaking sunsets',
    itinerary: ['Day 1: Walk to Oia for sunset', 'Day 2: Tour of Fira and volcano sailing', 'Day 3: Red beach and wine tasting'],
    dailyBudget: 150, season: 'May–September', pack: ['Light clothes', 'Heels', 'Camera']
  },
  {
    name: 'Iceland', emoji: '🌋', description: 'Land of fire and ice with northern lights and geysers',
    itinerary: ['Day 1: Golden Circle - geyser and waterfalls', 'Day 2: Black sand beach and glacier lagoon', 'Day 3: Northern lights at night'],
    dailyBudget: 200, season: 'Sep–Mar for lights, Jun–Aug for daylight', pack: ['Warm clothes', 'Rain jacket', 'Hiking boots']
  },
  {
    name: 'Marrakech', emoji: '🕌', description: 'Vibrant souks, colorful streets and the spirit of the desert',
    itinerary: ['Day 1: Jemaa el-Fna square and medina', 'Day 2: Sahara desert tour', 'Day 3: Atlas mountains and Berber villages'],
    dailyBudget: 60, season: 'October–April', pack: ['Modest clothing', 'Long sleeves', 'UPF protection']
  },
  {
    name: 'Patagonia', emoji: '🏔️', description: 'The end of the world - glaciers, Torres del Paine and condors',
    itinerary: ['Day 1: Torres del Paine trek', 'Day 2: Perito Moreno glacier', 'Day 3: Sailing between glaciers'],
    dailyBudget: 110, season: 'November–March', pack: ['Hiking gear', 'Warm layers', 'Rain gear']
  },
  {
    name: 'Tokyo', emoji: '🗼', description: 'The city of the future - technology, anime, sushi and now',
    itinerary: ['Day 1: Shibuya and Shinjuku', 'Day 2: Asakusa and Senso-ji temple', 'Day 3: Akihabara and Teamlab'],
    dailyBudget: 130, season: 'March–April, October–November', pack: ['Walking shoes', 'Cash', 'Layered clothing']
  },
  {
    name: 'Dubai', emoji: '🌆', description: 'The future city in the desert - skyscrapers, desert and wonder',
    itinerary: ['Day 1: Burj Khalifa and gold souk', 'Day 2: Desert safari with BBQ', 'Day 3: Palm Jumeirah and beach'],
    dailyBudget: 180, season: 'November–April', pack: ['Light clothes', 'Swimwear', 'Sunglasses']
  },
  {
    name: 'Rio de Janeiro', emoji: '🌴', description: 'Carnival, beaches, jungle and samba',
    itinerary: ['Day 1: Christ the Redeemer and city', 'Day 2: Copacabana and Ipanema beach', 'Day 3: Tijuca jungle'],
    dailyBudget: 100, season: 'September–March', pack: ['Swimwear', 'Flip flops', 'Dance clothes']
  },
  {
    name: 'Nepal - Kathmandu', emoji: '🏔️', description: 'Gateway to Everest, Hindu temples and amazing people',
    itinerary: ['Day 1: Boudhanath and Bhaktapur', 'Day 2: Trip to Pokhara', 'Day 3: Temple tour and Sherpa culture'],
    dailyBudget: 50, season: 'March–May, October–November', pack: ['Layered clothes', 'Hiking boots', 'Medications']
  },
  {
    name: 'New Zealand', emoji: '🐑', description: 'Lord of the Rings - fjords, Hobbiton and adventure sports',
    itinerary: ['Day 1: Milford Sound', 'Day 2: Hobbiton and Rotorua', 'Day 3: Queenstown - bungee jumping'],
    dailyBudget: 160, season: 'November–March', pack: ['Hiking gear', 'Action camera', 'Layers']
  },
  {
    name: 'Lisbon', emoji: '🌉', description: 'City of seven hills with fado music, pasteis de nata and trams',
    itinerary: ['Day 1: Alfama and Feira da Ladra', 'Day 2: Sintra and Pena Palace', 'Day 3: Belem and azulejos'],
    dailyBudget: 90, season: 'March–November', pack: ['Comfortable shoes', 'Light layer', 'Sunscreen']
  },
  {
    name: 'Colombia - Cartagena', emoji: '🌺', description: 'Colonial walled city, quality coffee and passionate people',
    itinerary: ['Day 1: The walled city and street art', 'Day 2: Rosario Islands', 'Day 3: Coffee market and plaza'],
    dailyBudget: 70, season: 'December–April', pack: ['Light clothes', 'Swimwear', 'Sunscreen']
  },
];

export default function SurpriseTripModal({ open, onClose }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 12, right: 12, color: 'white' }}
        >
          <CloseIcon />
        </IconButton>

        <Typography variant="h5" fontWeight="bold" mb={1}>
          {t('surprise.title')}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.85, mb: 3 }}>
          {t('surprise.subtitle')}
        </Typography>

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

          <Box sx={{ textAlign: 'left', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" mb={1}>{t('surprise.days_plan')}</Typography>
            {current.itinerary.map((day, i) => (
              <Typography key={i} variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                {day}
              </Typography>
            ))}
          </Box>

          <AIDestinationInsights destinationName={current.name} visible={open} />

          <Stack direction="row" flexWrap="wrap" gap={1} justifyContent="center" mt={2}>
            <Chip
              label={t('surprise.per_day', { amount: current.dailyBudget })}
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
                {t('surprise.must_pack')} {current.pack.join(' • ')}
              </Typography>
            </Box>
          )}
        </Box>

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
            {t('surprise.roll_again')}
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
            {t('surprise.start_planning')}
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
}
