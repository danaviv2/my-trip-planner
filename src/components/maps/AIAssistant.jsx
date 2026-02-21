import React, { useState } from 'react';
import EnhancedDayItinerary from '../itinerary/EnhancedDayItinerary';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Chip,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Psychology as AIIcon,
  ExpandMore as ExpandMoreIcon,
  Lightbulb as IdeaIcon,
  Warning as WarningIcon,
  TipsAndUpdates as TipIcon,
  AutoAwesome as MagicIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import aiRecommendations from '../../services/aiRecommendations';

const AIAssistant = ({ tripPlan, origin, destination }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [advice, setAdvice] = useState(null);
  const [itinerary, setItinerary] = useState(null);
  const [days, setDays] = useState(3);
  const [activeSection, setActiveSection] = useState('advice');

  /**
   * קבלת ייעוץ חכם
   */
  const getSmartAdvice = async () => {
    setIsLoading(true);
    try {
      console.log('🤖 מבקש ייעוץ חכם מ-AI...');
      const result = await aiRecommendations.getSmartAdvice(tripPlan);
      setAdvice(result);
      console.log('✅ ייעוץ התקבל:', result);
    } catch (error) {
      console.error('❌ שגיאה בקבלת ייעוץ:', error);
      alert('שגיאה בחיבור ל-AI. אנא בדוק את מפתח ה-API.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * יצירת תכנית מסלול אוטומטית
   */
  const generateItinerary = async () => {
    if (!origin || !destination) {
      alert('נא לבחור מוצא ויעד תחילה');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🤖 מייצר תכנית מסלול חכמה...');
      const result = await aiRecommendations.getPersonalizedItinerary(
        origin,
        destination,
        days,
        {
          budget: 'medium',
          interests: ['תרבות', 'אוכל', 'טבע'],
          travelStyle: 'balanced',
          groupType: 'couple'
        }
      );
      setItinerary(result);
      console.log('✅ תכנית התקבלה:', result);
    } catch (error) {
      console.error('❌ שגיאה ביצירת תכנית:', error);
      alert('שגיאה בחיבור ל-AI. אנא בדוק את מפתח ה-API.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      {/* כותרת */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Avatar sx={{ bgcolor: 'secondary.main' }}>
          <AIIcon />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            🤖 עוזר AI חכם
          </Typography>
          <Typography variant="body2" color="text.secondary">
            המלצות מותאמות אישית עבורך
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* כפתורי פעולה */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <MagicIcon />}
          onClick={getSmartAdvice}
          disabled={isLoading}
          fullWidth
        >
          {isLoading ? 'מייצר המלצות...' : 'קבל ייעוץ חכם'}
        </Button>

        <Box>
          <TextField
            label="מספר ימים"
            type="number"
            value={days}
            onChange={(e) => setDays(Math.max(1, Math.min(14, e.target.value)))}
            size="small"
            sx={{ mb: 1, width: '100%' }}
          />
          <Button
            variant="outlined"
            startIcon={isLoading ? <CircularProgress size={20} /> : <AIIcon />}
            onClick={generateItinerary}
            disabled={isLoading || !origin || !destination}
            fullWidth
          >
            צור תכנית מסלול אוטומטית
          </Button>
        </Box>
      </Stack>

      {/* תוצאות ייעוץ */}
      {advice && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              📊 תוצאות הניתוח
            </Typography>
            <IconButton size="small" onClick={() => setAdvice(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* הערכה כללית */}
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              💡 הערכה כללית
            </Typography>
            <Typography variant="body2">
              {advice.evaluation}
            </Typography>
          </Paper>

          {/* שיפורים מומלצים */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IdeaIcon color="success" />
                <Typography sx={{ fontWeight: 'bold' }}>
                  המלצות לשיפור ({advice.improvements?.length || 0})
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {advice.improvements?.map((improvement, idx) => (
                  <ListItem key={idx}>
                    <ListItemIcon>
                      <Chip label={idx + 1} color="success" size="small" />
                    </ListItemIcon>
                    <ListItemText primary={improvement} />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>

          {/* אזהרות */}
          {advice.warnings && advice.warnings.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon color="warning" />
                  <Typography sx={{ fontWeight: 'bold' }}>
                    שים לב! ({advice.warnings.length})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {advice.warnings.map((warning, idx) => (
                    <ListItem key={idx}>
                      <ListItemIcon>
                        <WarningIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText primary={warning} />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          )}

          {/* טיפים */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TipIcon color="primary" />
                <Typography sx={{ fontWeight: 'bold' }}>
                  טיפים שימושיים ({advice.tips?.length || 0})
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {advice.tips?.map((tip, idx) => (
                  <ListItem key={idx}>
                    <ListItemIcon>
                      <TipIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={tip} />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        </Box>
      )}

      {/* תכנית מסלול */}
      {itinerary && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              🗓️ תכנית המסלול שלך
            </Typography>
            <IconButton size="small" onClick={() => setItinerary(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* סקירה */}
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.light' }}>
            <Typography variant="body2" sx={{ color: 'primary.contrastText' }}>
              {itinerary.overview}
            </Typography>
          </Paper>

          {/* תכנית יומית */}
          {itinerary.dailyPlan?.map((day, idx) => (
            <EnhancedDayItinerary
              key={idx}
              day={day.day || idx + 1}
              activities={[
                { 
                  type: 'breakfast', 
                  name: 'ארוחת בוקר',
                  description: day.morning,
                  time: '08:00',
                  location: destination
                },
                { 
                  type: 'lunch', 
                  name: 'ארוחת צהריים',
                  description: day.lunch,
                  time: '13:00',
                  location: destination
                },
                { 
                  type: 'activity', 
                  name: 'פעילות אחר הצהריים',
                  description: day.afternoon,
                  time: '15:00',
                  location: destination
                },
                { 
                  type: 'dinner', 
                  name: 'ארוחת ערב',
                  description: day.dinner,
                  time: '19:00',
                  location: destination
                }
              ].filter(a => a.description)}
              tripInfo={{
                origin: origin,
                destination: destination,
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + (itinerary.dailyPlan?.length * 86400000)).toISOString()
              }}
            />
          ))}

          {/* עלות משוערת */}
          {itinerary.estimatedCost && (
            <Paper sx={{ p: 2, mt: 2, bgcolor: 'success.light' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'success.contrastText' }}>
                💰 עלות משוערת: {itinerary.estimatedCost}
              </Typography>
            </Paper>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default AIAssistant;
