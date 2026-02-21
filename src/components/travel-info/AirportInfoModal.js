// components/travel-info/AirportInfoModal.js
import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Box, 
  Typography, 
  CircularProgress, 
  Divider,
  Paper,
  Grid,
  Button
} from '@mui/material';

const AirportInfoModal = ({ open, onClose, airportCode }) => {
  const [airportData, setAirportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (open && airportCode) {
      fetchAirportInfo(airportCode);
    }
  }, [open, airportCode]);
  
  const fetchAirportInfo = async (code) => {
    if (!code || code.length < 3) {
      setError('קוד שדה תעופה לא תקין');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // בפרויקט אמיתי, כאן תהיה קריאה לAPI
      // לצורך הדגמה, נחזיר נתונים סטטיים לפי הקוד
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let data;
      switch(code.toUpperCase()) {
        case 'TLV':
          data = {
            name: 'נמל התעופה בן גוריון',
            code: 'TLV',
            city: 'תל אביב',
            country: 'ישראל',
            timezone: 'UTC+3',
            terminals: ['T1', 'T3'],
            coordinates: { lat: 32.0055, lng: 34.8854 },
            info: {
              website: 'https://www.iaa.gov.il/',
              phone: '+972-3-9723333',
              facilities: ['חנויות', 'מסעדות', 'חניה', 'מטבע זר', 'רכבת'],
              transportation: ['רכבת', 'מונית', 'אוטובוס', 'השכרת רכב']
            }
          };
          break;
        case 'CDG':
          data = {
            name: 'נמל התעופה שארל דה גול',
            code: 'CDG',
            city: 'פריז',
            country: 'צרפת',
            timezone: 'UTC+2',
            terminals: ['T1', 'T2A', 'T2B', 'T2C', 'T2D', 'T2E', 'T2F', 'T3'],
            coordinates: { lat: 49.0097, lng: 2.5479 },
            info: {
              website: 'https://www.parisaeroport.fr/',
              phone: '+33-1-70363950',
              facilities: ['חנויות', 'מסעדות', 'חניה', 'מטבע זר', 'לאונג\'ים'],
              transportation: ['רכבת', 'מטרו', 'מונית', 'אוטובוס', 'השכרת רכב']
            }
          };
          break;
        default:
          data = {
            name: `נמל תעופה ${code}`,
            code: code.toUpperCase(),
            city: 'לא ידוע',
            country: 'לא ידוע',
            timezone: 'לא ידוע',
            info: {
              note: 'מידע מפורט אינו זמין עבור שדה תעופה זה'
            }
          };
      }
      
      setAirportData(data);
    } catch (error) {
      setError('שגיאה בטעינת מידע שדה התעופה: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="airport-info-modal-title"
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '600px',
        bgcolor: 'background.paper',
        borderRadius: '12px',
        boxShadow: 24,
        p: 4,
        textAlign: 'right',
        direction: 'rtl',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ p: 2 }}>
            {error}
          </Typography>
        ) : airportData ? (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography id="airport-info-modal-title" variant="h5" sx={{ fontWeight: 'bold' }}>
                {airportData.name} ({airportData.code})
              </Typography>
              <Box sx={{ 
                bgcolor: '#e0e0e0', 
                px: 2, 
                py: 1, 
                borderRadius: '16px', 
                fontWeight: 'bold',
                fontSize: '18px'
              }}>
                {airportData.code}
              </Box>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
                    מיקום
                  </Typography>
                  <Typography variant="body1">
                    {airportData.city}, {airportData.country}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
                    אזור זמן
                  </Typography>
                  <Typography variant="body1">
                    {airportData.timezone}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
            
            {airportData.terminals && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                  טרמינלים
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {airportData.terminals.map(terminal => (
                    <Box 
                      key={terminal}
                      sx={{ 
                        bgcolor: '#f5f5f5', 
                        px: 2, 
                        py: 1, 
                        borderRadius: '8px', 
                        border: '1px solid #e0e0e0'
                      }}
                    >
                      {terminal}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
            
            {airportData.info && (
              <>
                {airportData.info.facilities && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                      שירותים ומתקנים
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {airportData.info.facilities.map(facility => (
                        <Box 
                          key={facility}
                          sx={{ 
                            bgcolor: '#e8f5e9', 
                            px: 2, 
                            py: 0.5, 
                            borderRadius: '16px', 
                            fontSize: '14px'
                          }}
                        >
                          {facility}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
                
                {airportData.info.transportation && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                      אפשרויות תחבורה
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {airportData.info.transportation.map(transport => (
                        <Box 
                          key={transport}
                          sx={{ 
                            bgcolor: '#e3f2fd', 
                            px: 2, 
                            py: 0.5, 
                            borderRadius: '16px', 
                            fontSize: '14px'
                          }}
                        >
                          {transport}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
                
                {airportData.info.website && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: '#666' }}>
                      אתר רשמי
                    </Typography>
                    <Typography variant="body2" component="a" href={airportData.info.website} target="_blank" rel="noopener noreferrer" sx={{ color: '#2196F3' }}>
                      {airportData.info.website}
                    </Typography>
                  </Box>
                )}
                
                {airportData.info.phone && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ color: '#666' }}>
                      טלפון
                    </Typography>
                    <Typography variant="body2">
                      {airportData.info.phone}
                    </Typography>
                  </Box>
                )}
                
                {airportData.info.note && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: '#fff3e0', borderRadius: '8px' }}>
                    <Typography variant="body2">
                      {airportData.info.note}
                    </Typography>
                  </Box>
                )}
              </>
            )}
            
            {airportData.coordinates && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button 
                  variant="outlined"
                  startIcon={<i className="material-icons">map</i>}
                  onClick={() => window.open(`https://www.google.com/maps?q=${airportData.coordinates.lat},${airportData.coordinates.lng}`)}
                >
                  הצג במפה
                </Button>
                <Button 
                  variant="outlined"
                  startIcon={<i className="material-icons">flight</i>}
                  sx={{ mr: 2 }}
                  onClick={() => window.open(`https://www.flightradar24.com/airport/${airportData.code}`)}
                >
                  צפה בטיסות חיות
                </Button>
              </Box>
            )}
          </>
        ) : (
          <Typography sx={{ p: 2 }}>אין מידע זמין</Typography>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={onClose}>סגור</Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default AirportInfoModal;