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

const PACKING_DATA = {
  documents: {
    label: '📄 מסמכים',
    always: ['דרכון', 'תעודת זהות', 'ביטוח נסיעות', 'כרטיסי טיסה (הדפסה/PDF)', 'הזמנות מלון'],
    conditional: {
      long: ['ויזה (אם נדרש)', 'כרטיסי אשראי נוספים', 'העתקי מסמכים'],
      international: ['טופס כניסה', 'הצהרת מטבע'],
    }
  },
  clothes: {
    label: '👗 בגדים',
    always: ['תחתונים (x ימים)', 'גרביים (x ימים)', 'פיג\'מה'],
    conditional: {
      beach: ['בגדי ים (x2)', 'חולצות קלות', 'מכנסיים קצרים', 'שמלה/כיסוי חוף'],
      mountains: ['מכנסי הרים', 'חולצות שכבות', 'כובע חם', 'כפפות', 'ג\'קט חם'],
      cold: ['מעיל שחף', 'סוודר', 'מכנסיים ארוכים (x3)', 'חולצות תרמיות'],
      hot: ['חולצות קלות', 'מכנסיים קצרים/שמלות', 'כובע שמש', 'לבוש נושם'],
      formal: ['חליפה/שמלה פורמלית', 'נעלי עקב/נעלי עסקים', 'עניבה'],
    }
  },
  shoes: {
    label: '👟 נעליים',
    always: ['נעליים נוחות ליום-יום'],
    conditional: {
      beach: ['כפכפים', 'נעלי ים'],
      mountains: ['נעלי הרים/טרקינג'],
      formal: ['נעלי עסקים/עקב'],
      cold: ['מגפיים חמים'],
    }
  },
  toiletries: {
    label: '🪥 טואלטיקה',
    always: ['שמפו ומרכך', 'סבון', 'מברשת שיניים + משחה', 'גילוח', 'דאודורנט', 'לק/מגבת'],
    conditional: {
      beach: ['קרם הגנה SPF 50+', 'לאחר שמש', 'גוגלס שמש'],
      long: ['תרופות קבועות', 'אדפיל/משכך כאבים', 'תרסיס לחרקים'],
    }
  },
  electronics: {
    label: '💻 אלקטרוניקה',
    always: ['טלפון + מטען', 'אוזניות', 'בנק כוח'],
    conditional: {
      long: ['מחשב נייד/טאבלט', 'מתאם חשמל', 'מצלמה + כרטיס זיכרון'],
      adventure: ['מצלמת אקשן (GoPro)', 'רחפן קטן', 'מכשיר GPS'],
    }
  },
  health: {
    label: '💊 בריאות',
    always: ['תרופות קבועות', 'אדפיל', 'בנדאז\' (גבס)', 'גל ידיים'],
    conditional: {
      tropical: ['כדורי מניעת מלריה', 'חיסונים מתאימים', 'תרסיס נגד יתושים DEET'],
      adventure: ['ערכת עזרה ראשונה', 'תרסיס נגד קרציות', 'מגן ברכיים'],
      long: ['ויטמינים', 'תרופה נגד שלשול'],
    }
  },
  misc: {
    label: '🎒 שונות',
    always: ['ארנק', 'מטבע מקומי קצת', 'ספר/קינדל', 'מסכת עיניים לטיסה'],
    conditional: {
      long: ['כרית צוואר לטיסה', 'אטמי אוזניים', 'שמיכה קטנה'],
      adventure: ['מנעול מזוודה', 'שרשרת ביטחון לתיק', 'כובע הרים'],
      beach: ['שק חול קטן', 'מגבת חוף'],
    }
  }
};

// קביעת תנאים לפי קלט
function getConditions({ destination = '', tripType = 'general', days = 7 }) {
  const conditions = new Set();
  if (days >= 7) conditions.add('long');
  if (days < 7) conditions.add('short');

  const dest = destination.toLowerCase();
  const isInternational = !['תל אביב', 'ירושלים', 'חיפה', 'אילת', 'ים המלח'].some(c => destination.includes(c));
  if (isInternational) conditions.add('international');

  // זיהוי אקלים
  if (['תאילנד', 'בלי', 'מלדיביים', 'קייפטאון', 'ריו', 'קרייביאן', 'ח\'ינון', 'סינגפור', 'הנוי'].some(k => destination.includes(k)))
    conditions.add('tropical');
  if (['חוף', 'קו', 'ביץ', 'סנטוריני', 'ברצלונה', 'ריביירה', 'מיקונוס'].some(k => destination.includes(k) || tripType === 'beach'))
    conditions.add('beach');
  if (['הרים', 'נפאל', 'אלפים', 'קילימנג\'רו', 'פטגוניה', 'איסלנד', 'ניו זילנד'].some(k => destination.includes(k) || tripType === 'mountains'))
    conditions.add('mountains');
  if (['צרפת', 'איטליה', 'ספרד', 'תיאטרון', 'אופרה', 'גאלה'].some(k => destination.includes(k) || tripType === 'formal'))
    conditions.add('formal');
  if (tripType === 'adventure') conditions.add('adventure');

  return conditions;
}

const STORAGE_KEY = 'packingList_checked';

export default function PackingListModal({ open, onClose, initialDestination = '', initialDays = 7 }) {
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

  const countChecked = () => {
    return Object.values(checked).filter(Boolean).length;
  };

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

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const text = `רשימת ארוז לטיול ל${destination} (${days} ימים)`;
    if (navigator.share) {
      await navigator.share({ title: 'רשימת ארוז', text });
    } else {
      await navigator.clipboard.writeText(text);
      alert('הטקסט הועתק ללוח');
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
        {/* כותרת */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <LuggageIcon sx={{ color: '#667eea', fontSize: 28 }} />
            <Typography variant="h5" fontWeight="bold">מה לארוז? 🧳</Typography>
          </Box>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>

        {/* טופס קלט */}
        <Paper sx={{ p: 2, borderRadius: 3, bgcolor: '#f8f9ff', mb: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="יעד"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              fullWidth
              size="small"
              placeholder="לדוגמה: בלי, פריז..."
            />
            <TextField
              label="מספר ימים"
              type="number"
              value={days}
              onChange={e => setDays(Math.max(1, parseInt(e.target.value) || 1))}
              size="small"
              sx={{ minWidth: 100 }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>סוג טיול</InputLabel>
              <Select value={tripType} label="סוג טיול" onChange={e => setTripType(e.target.value)}>
                <MenuItem value="general">כללי</MenuItem>
                <MenuItem value="beach">חוף</MenuItem>
                <MenuItem value="mountains">הרים</MenuItem>
                <MenuItem value="adventure">הרפתקה</MenuItem>
                <MenuItem value="formal">עסקי/פורמלי</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        {/* התקדמות */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="body2" color="text.secondary">
            סומן: {countChecked()} / {totalItems} פריטים
          </Typography>
          <Button size="small" color="error" onClick={resetList}>
            אפס הכל
          </Button>
        </Box>

        {/* רשימות לפי קטגוריה */}
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

        {/* כפתורי פעולה */}
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            fullWidth
            sx={{ borderRadius: 2 }}
          >
            הדפס
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
            שתף
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
}
