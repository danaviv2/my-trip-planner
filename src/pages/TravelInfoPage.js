import React from 'react';
import { Typography, Paper, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import TravelInfoComponent from '../components/travel-info/TravelInfoComponent';

const TravelInfoPage = () => {
  const { t } = useTranslation();
  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto', p: { xs: 1, sm: 3 } }}>
      {/* ── הוסרו `bgcolor: '#ffffff'` ו-`color` קשיחים, 08.09.2026 ──
          השלושה היו עקביים ביניהם ולכן סורק הניגודיות לא סימן אותם:
          רקע לבן עם טקסט כהה קריא בשתי הערכות. אבל התוצאה הייתה כרטיס
          לבן בוהק בתוך אפליקציה כהה, ובתוכו `Paper` פנימי שכן הלך
          אחרי הערכה — כלומר כרטיס כהה בתוך כרטיס לבן.
          עטיפת דף אינה אי-ניגוד מכוון כמו `DemoItinerary`; היא השלד,
          והשלד הולך אחרי הערכה. */}
      <Paper elevation={3} sx={{ p: { xs: 1.5, sm: 3 }, mb: 4, borderRadius: '16px' }}>
        <Typography variant="h4" align="center" gutterBottom sx={{
          color: 'text.primary',
          fontWeight: 'bold',
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <i className="material-icons" style={{ marginRight: '8px', fontSize: '36px' }}>flight_takeoff</i>
          {t('travelInfo.title')}
        </Typography>

        <Typography variant="subtitle1" align="center" sx={{ mb: 4, color: 'text.secondary' }}>
          {t('travelInfo.subtitle')}
        </Typography>

        <TravelInfoComponent />
      </Paper>
    </Box>
  );
};

export default TravelInfoPage;
