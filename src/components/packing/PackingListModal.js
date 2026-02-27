import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal, Box, Typography, IconButton, Checkbox, FormControlLabel,
  Divider, Button, TextField, MenuItem, Select, InputLabel,
  FormControl, Chip, Stack, Paper, Accordion, AccordionSummary,
  AccordionDetails
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import ShareIcon from '@mui/icons-material/Share';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LuggageIcon from '@mui/icons-material/Luggage';
import { useTranslation } from 'react-i18next';

const PACKING_DATA = {
  documents: {
    label: '📄 Documents',
    always: ['Passport', 'ID card', 'Travel insurance', 'Flight tickets (print/PDF)', 'Hotel bookings'],
    conditional: {
      long: ['Visa (if required)', 'Extra credit cards', 'Document copies'],
      international: ['Entry form', 'Currency declaration'],
    }
  },
  clothes: {
    label: '👗 Clothes',
    always: ['Underwear (x days)', 'Socks (x days)', 'Pajamas'],
    conditional: {
      beach: ['Swimwear (x2)', 'Light shirts', 'Shorts', 'Dress/beach cover-up'],
      mountains: ['Hiking pants', 'Layered shirts', 'Warm hat', 'Gloves', 'Warm jacket'],
      cold: ['Winter coat', 'Sweater', 'Long pants (x3)', 'Thermal shirts'],
      hot: ['Light shirts', 'Shorts/dresses', 'Sun hat', 'Breathable clothing'],
      formal: ['Suit/formal dress', 'Heels/dress shoes', 'Tie'],
    }
  },
  shoes: {
    label: '👟 Shoes',
    always: ['Comfortable everyday shoes'],
    conditional: {
      beach: ['Flip flops', 'Water shoes'],
      mountains: ['Hiking/trekking boots'],
      formal: ['Dress shoes/heels'],
      cold: ['Warm boots'],
    }
  },
  toiletries: {
    label: '🪥 Toiletries',
    always: ['Shampoo & conditioner', 'Soap', 'Toothbrush + toothpaste', 'Razor', 'Deodorant', 'Nail file/towel'],
    conditional: {
      beach: ['SPF 50+ sunscreen', 'After-sun lotion', 'Sunglasses'],
      long: ['Regular medications', 'Ibuprofen/painkiller', 'Insect repellent'],
    }
  },
  electronics: {
    label: '💻 Electronics',
    always: ['Phone + charger', 'Earphones', 'Power bank'],
    conditional: {
      long: ['Laptop/tablet', 'Power adapter', 'Camera + memory card'],
      adventure: ['Action camera (GoPro)', 'Small drone', 'GPS device'],
    }
  },
  health: {
    label: '💊 Health',
    always: ['Regular medications', 'Ibuprofen', 'Bandages', 'Hand sanitizer'],
    conditional: {
      tropical: ['Malaria pills', 'Relevant vaccines', 'DEET insect repellent'],
      adventure: ['First aid kit', 'Tick repellent', 'Knee guards'],
      long: ['Vitamins', 'Anti-diarrhea medication'],
    }
  },
  misc: {
    label: '🎒 Miscellaneous',
    always: ['Wallet', 'Some local currency', 'Book/Kindle', 'Eye mask for flight'],
    conditional: {
      long: ['Neck pillow for flight', 'Ear plugs', 'Small blanket'],
      adventure: ['Luggage lock', 'Bag security strap', 'Hiking hat'],
      beach: ['Small sand bag', 'Beach towel'],
    }
  }
};

function getConditions({ destination = '', tripType = 'general', days = 7 }) {
  const conditions = new Set();
  if (days >= 7) conditions.add('long');
  if (days < 7) conditions.add('short');

  const isInternational = !['Tel Aviv', 'Jerusalem', 'Haifa', 'Eilat', 'Dead Sea', 'תל אביב', 'ירושלים', 'חיפה', 'אילת', 'ים המלח'].some(c => destination.includes(c));
  if (isInternational) conditions.add('international');

  if (['Thailand', 'Bali', 'Maldives', 'Cape Town', 'Rio', 'Caribbean', 'Singapore', 'Hanoi', 'תאילנד', 'בלי', 'מלדיביים'].some(k => destination.toLowerCase().includes(k.toLowerCase())))
    conditions.add('tropical');
  if (['beach', 'coast', 'Santorini', 'Barcelona', 'Riviera', 'Mykonos', 'חוף', 'סנטוריני', 'ברצלונה'].some(k => destination.toLowerCase().includes(k.toLowerCase()) || tripType === 'beach'))
    conditions.add('beach');
  if (['mountains', 'Nepal', 'Alps', 'Kilimanjaro', 'Patagonia', 'Iceland', 'New Zealand', 'הרים', 'נפאל', 'אלפים', 'איסלנד'].some(k => destination.toLowerCase().includes(k.toLowerCase()) || tripType === 'mountains'))
    conditions.add('mountains');
  if (['France', 'Italy', 'Spain', 'theater', 'opera', 'gala', 'צרפת', 'איטליה', 'ספרד'].some(k => destination.toLowerCase().includes(k.toLowerCase()) || tripType === 'formal'))
    conditions.add('formal');
  if (tripType === 'adventure') conditions.add('adventure');

  return conditions;
}

const STORAGE_KEY = 'packingList_checked';

export default function PackingListModal({ open, onClose, initialDestination = '', initialDays = 7 }) {
  const { t } = useTranslation();
  const [destination, setDestination] = useState(initialDestination);
  const [days, setDays] = useState(initialDays);
  const [tripType, setTripType] = useState('general');
  const [checked, setChecked] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
  });

  useEffect(() => {
    setDestination(initialDestination);
    setDays(initialDays);
  }, [initialDestination, initialDays]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
  }, [checked]);

  const conditions = useMemo(() => getConditions({ destination, tripType, days }), [destination, tripType, days]);

  const toggleCheck = (item) => {
    setChecked(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const resetList = () => {
    setChecked({});
    localStorage.removeItem(STORAGE_KEY);
  };

  const countChecked = () => Object.values(checked).filter(Boolean).length;

  const totalItems = useMemo(() => {
    let count = 0;
    Object.values(PACKING_DATA).forEach(cat => {
      count += cat.always.length;
      Object.entries(cat.conditional).forEach(([cond, items]) => {
        if (conditions.has(cond)) count += items.length;
      });
    });
    return count;
  }, [conditions]);

  const handlePrint = () => window.print();

  const handleShare = async () => {
    const text = `${t('packing.title')} ${destination} (${days} days)`;
    if (navigator.share) {
      await navigator.share({ title: t('packing.title'), text });
    } else {
      await navigator.clipboard.writeText(text);
      alert(t('packing.copied'));
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '95vw', sm: 620 },
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: 4,
        bgcolor: 'white',
        p: { xs: 2.5, md: 4 },
        boxShadow: '0 30px 80px rgba(0,0,0,0.2)',
        outline: 'none'
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <LuggageIcon sx={{ color: '#667eea', fontSize: 28 }} />
            <Typography variant="h5" fontWeight="bold">{t('packing.title')}</Typography>
          </Box>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>

        <Paper sx={{ p: 2, borderRadius: 3, bgcolor: '#f8f9ff', mb: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label={t('packing.destination')}
              value={destination}
              onChange={e => setDestination(e.target.value)}
              fullWidth
              size="small"
              placeholder={t('packing.dest_placeholder')}
            />
            <TextField
              label={t('packing.days_label')}
              type="number"
              value={days}
              onChange={e => setDays(Math.max(1, parseInt(e.target.value) || 1))}
              size="small"
              sx={{ minWidth: 100 }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>{t('packing.trip_type')}</InputLabel>
              <Select value={tripType} label={t('packing.trip_type')} onChange={e => setTripType(e.target.value)}>
                <MenuItem value="general">{t('packing.type_general')}</MenuItem>
                <MenuItem value="beach">{t('packing.type_beach')}</MenuItem>
                <MenuItem value="mountains">{t('packing.type_mountains')}</MenuItem>
                <MenuItem value="adventure">{t('packing.type_adventure')}</MenuItem>
                <MenuItem value="formal">{t('packing.type_formal')}</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="body2" color="text.secondary">
            {t('packing.checked_count', { checked: countChecked(), total: totalItems })}
          </Typography>
          <Button size="small" color="error" onClick={resetList}>
            {t('packing.reset')}
          </Button>
        </Box>

        {Object.entries(PACKING_DATA).map(([catKey, cat]) => {
          const conditionalItems = Object.entries(cat.conditional)
            .filter(([cond]) => conditions.has(cond))
            .flatMap(([, items]) => items);
          const allItems = [...cat.always, ...conditionalItems];

          return (
            <Accordion key={catKey} defaultExpanded sx={{ mb: 1, borderRadius: '12px !important', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ borderRadius: 3 }}>
                <Box display="flex" justifyContent="space-between" width="100%" pr={1}>
                  <Typography fontWeight={600}>{cat.label}</Typography>
                  <Chip
                    size="small"
                    label={`${allItems.filter(item => checked[item]).length}/${allItems.length}`}
                    color={allItems.every(item => checked[item]) ? 'success' : 'default'}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                {allItems.map(item => (
                  <FormControlLabel
                    key={item}
                    control={
                      <Checkbox
                        checked={!!checked[item]}
                        onChange={() => toggleCheck(item)}
                        size="small"
                      />
                    }
                    label={
                      <Typography
                        variant="body2"
                        sx={{ textDecoration: checked[item] ? 'line-through' : 'none', color: checked[item] ? 'text.disabled' : 'text.primary' }}
                      >
                        {item}
                      </Typography>
                    }
                    sx={{ display: 'flex', mb: 0.5 }}
                  />
                ))}
              </AccordionDetails>
            </Accordion>
          );
        })}

        <Divider sx={{ my: 2 }} />

        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            fullWidth
            sx={{ borderRadius: 2 }}
          >
            {t('packing.print')}
          </Button>
          <Button
            variant="contained"
            startIcon={<ShareIcon />}
            onClick={handleShare}
            fullWidth
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 2
            }}
          >
            {t('packing.share')}
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
}
