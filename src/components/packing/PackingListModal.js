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
    label: '📄 מסמכים',
    always: ['דרכון', 'תעודת זהות', 'ביטוח נסיעות', 'כרטיסי טיסה (הדפסה/PDF)', 'אישורי מלון'],
    conditional: {
      long: ['ויזה (אם נדרשת)', 'כרטיסי אשראי נוספים', 'צילומי מסמכים לגיבוי'],
      international: ['טופס כניסה למדינה', 'הצהרת מטבע'],
    }
  },
  clothes: {
    label: '👗 ביגוד',
    always: ['תחתונים (לפי מספר ימים)', 'גרביים (לפי מספר ימים)', 'פיג׳מה'],
    conditional: {
      beach: ['בגד ים (x2)', 'חולצות קלות', 'מכנסיים קצרים', 'שמלת חוף/כיסוי ים'],
      mountains: ['מכנסי הליכה', 'חולצות שכבות', 'כובע חם', 'כפפות', 'מעיל חם'],
      hot: ['חולצות קלות (x5)', 'מכנסיים קצרים/שמלות', 'כובע שמש', 'ביגוד נושם'],
      formal: ['חליפה/שמלת ערב', 'נעלי עניבה/עקבים', 'עניבה'],
      winter: ['מעיל חורף', 'סוודר עבה', 'כפפות', 'כובע צמר', 'צעיף'],
      summer: ['חולצות קלות נוספות', 'מכנסיים קצרים', 'כובע קיץ'],
      spring: ['שכבות קלות', 'מעיל דק', 'מטריה קטנה'],
      autumn: ['מעיל בינוני', 'שכבות ביניים', 'מטריה'],
    }
  },
  shoes: {
    label: '👟 נעליים',
    always: ['נעלי יומיום נוחות'],
    conditional: {
      beach: ['כפכפים', 'נעלי מים'],
      mountains: ['נעלי טיולים/טרקים'],
      formal: ['נעלי ערב/עקבים'],
      winter: ['מגפיים אטומים למים'],
      hot: ['נעלי קיץ פתוחות'],
    }
  },
  toiletries: {
    label: '🪥 טואלטיקה',
    always: ['שמפו ומרכך', 'סבון', 'מברשת שיניים + משחת שיניים', 'סכין גילוח', 'דאודורנט', 'פצירה/מספריים'],
    conditional: {
      beach: ['קרם הגנה SPF 50+', 'קרם אחרי שמש', 'משקפי שמש'],
      hot: ['קרם הגנה SPF 50+', 'ספריי לחות לגוף', 'משקפי שמש'],
      winter: ['קרם לחות לפנים ולגוף', 'שפתון מגן', 'קרם ידיים'],
      long: ['תרופות קבועות', 'איבופרופן', 'קרם נגד חרקים'],
      tropical: ['קרם נגד חרקים חזק (DEET)', 'קרם הגנה גבוה'],
    }
  },
  electronics: {
    label: '💻 אלקטרוניקה',
    always: ['טלפון + מטען', 'אוזניות', 'סוללת גיבוי (Power Bank)'],
    conditional: {
      long: ['לפטופ/טאבלט', 'מתאם חשמל בינלאומי', 'מצלמה + כרטיס זיכרון'],
      international: ['מתאם חשמל בינלאומי'],
      adventure: ['מצלמת אקשן (GoPro)', 'רחפן קטן', 'GPS נייד'],
    }
  },
  health: {
    label: '💊 בריאות',
    always: ['תרופות קבועות', 'איבופרופן/אקמול', 'פלסטרים ותחבושות', 'ג׳ל חיטוי ידיים'],
    conditional: {
      tropical: ['כדורי מלריה', 'חיסונים רלוונטיים', 'קרם חרקים DEET חזק'],
      adventure: ['ערכת עזרה ראשונה', 'קרם חרקים', 'מגן ברכיים/קרסוליים'],
      long: ['ויטמינים', 'תרופה לשלשול', 'תרופה להקאות'],
      winter: ['תרסיס לגרון', 'מדחום', 'ויטמין C'],
    }
  },
  misc: {
    label: '🎒 שונות',
    always: ['ארנק', 'מטבע מקומי', 'ספר/קינדל', 'מסיכת עיניים לטיסה'],
    conditional: {
      long: ['כרית צוואר לטיסה', 'אטמי אוזניים', 'שמיכה קטנה לטיסה'],
      adventure: ['מנעול מזוודה', 'רצועת אבטחה לתיק', 'כובע טיולים'],
      beach: ['תיק חוף', 'מגבת חוף', 'ספריי לשיער ים'],
      winter: ['תרמוס לשתייה חמה', 'חימם ידיים חד-פעמי'],
      spring: ['מטריה מתקפלת'],
      autumn: ['מטריה מתקפלת'],
    }
  }
};

function getCurrentSeason() {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return 'spring';
  if (m >= 5 && m <= 7) return 'summer';
  if (m >= 8 && m <= 10) return 'autumn';
  return 'winter';
}

const SEASON_LABELS = { spring: '🌸 אביב', summer: '☀️ קיץ', autumn: '🍂 סתיו', winter: '❄️ חורף' };

function getConditions({ destination = '', tripType = 'general', days = 7, season }) {
  const conditions = new Set();
  if (days >= 7) conditions.add('long');

  const dest = destination.toLowerCase();
  const isInternational = !['תל אביב', 'ירושלים', 'חיפה', 'אילת', 'ים המלח', 'tel aviv', 'jerusalem', 'haifa', 'eilat'].some(c => dest.includes(c.toLowerCase()));
  if (isInternational) conditions.add('international');

  const tropicalKeys = ['thailand', 'bali', 'maldives', 'cape town', 'rio', 'caribbean', 'singapore', 'vietnam', 'cambodia', 'indonesia', 'תאילנד', 'באלי', 'מלדיביים', 'קמבודיה', 'וייטנאם'];
  if (tropicalKeys.some(k => dest.includes(k))) conditions.add('tropical');

  const beachKeys = ['santorini', 'mykonos', 'barcelona', 'riviera', 'miami', 'hawaii', 'cancun', 'ibiza', 'סנטוריני', 'מיקונוס', 'ברצלונה', 'מיאמי', 'קנקון', 'חוף'];
  if (beachKeys.some(k => dest.includes(k)) || tripType === 'beach') conditions.add('beach');

  const mountainKeys = ['alps', 'nepal', 'kilimanjaro', 'patagonia', 'iceland', 'new zealand', 'swiss', 'norway', 'אלפים', 'נפאל', 'איסלנד', 'נורווגיה', 'הרים'];
  if (mountainKeys.some(k => dest.includes(k)) || tripType === 'mountains') conditions.add('mountains');

  const formalKeys = ['paris', 'france', 'italy', 'spain', 'london', 'פריז', 'צרפת', 'איטליה', 'ספרד', 'לונדון'];
  if (formalKeys.some(k => dest.includes(k)) || tripType === 'formal') conditions.add('formal');

  if (tripType === 'adventure') conditions.add('adventure');

  // Season
  const effectiveSeason = season || getCurrentSeason();
  conditions.add(effectiveSeason);
  if (effectiveSeason === 'summer' || (conditions.has('tropical') && effectiveSeason !== 'winter')) conditions.add('hot');

  return conditions;
}

const STORAGE_KEY = 'packingList_checked';

export default function PackingListModal({ open, onClose, initialDestination = '', initialDays = 7 }) {
  const { t } = useTranslation();
  const [destination, setDestination] = useState(initialDestination);
  const [days, setDays] = useState(initialDays);
  const [tripType, setTripType] = useState('general');
  const [season, setSeason] = useState(getCurrentSeason);
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

  const conditions = useMemo(() => getConditions({ destination, tripType, days, season }), [destination, tripType, days, season]);

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

        <Paper sx={{ p: 2, borderRadius: 3, bgcolor: '#f8f9ff', mb: 2 }}>
          <Stack spacing={2}>
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
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>{t('packing.trip_type')}</InputLabel>
                <Select value={tripType} label={t('packing.trip_type')} onChange={e => setTripType(e.target.value)}>
                  <MenuItem value="general">{t('packing.type_general')}</MenuItem>
                  <MenuItem value="beach">{t('packing.type_beach')}</MenuItem>
                  <MenuItem value="mountains">{t('packing.type_mountains')}</MenuItem>
                  <MenuItem value="adventure">{t('packing.type_adventure')}</MenuItem>
                  <MenuItem value="formal">{t('packing.type_formal')}</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>עונה</InputLabel>
                <Select value={season} label="עונה" onChange={e => setSeason(e.target.value)}>
                  {Object.entries(SEASON_LABELS).map(([val, label]) => (
                    <MenuItem key={val} value={val}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
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
