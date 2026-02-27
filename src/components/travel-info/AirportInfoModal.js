// components/travel-info/AirportInfoModal.js
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      setError(t('airportModal.invalidCode'));
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
            name: 'Ben Gurion Airport',
            code: 'TLV',
            city: 'Tel Aviv',
            country: 'Israel',
            timezone: 'UTC+3',
            terminals: ['T1', 'T3'],
            coordinates: { lat: 32.0055, lng: 34.8854 },
            info: {
              website: 'https://www.iaa.gov.il/',
              phone: '+972-3-9723333',
              facilities: [t('airportModal.facilityShops'), t('airportModal.facilityRestaurants'), t('airportModal.facilityParking'), t('airportModal.facilityCurrency'), t('airportModal.facilityTrain')],
              transportation: [t('airportModal.transTrain'), t('airportModal.transTaxi'), t('airportModal.transBus'), t('airportModal.transCarRental')]
            }
          };
          break;
        case 'CDG':
          data = {
            name: 'Charles de Gaulle Airport',
            code: 'CDG',
            city: 'Paris',
            country: 'France',
            timezone: 'UTC+2',
            terminals: ['T1', 'T2A', 'T2B', 'T2C', 'T2D', 'T2E', 'T2F', 'T3'],
            coordinates: { lat: 49.0097, lng: 2.5479 },
            info: {
              website: 'https://www.parisaeroport.fr/',
              phone: '+33-1-70363950',
              facilities: [t('airportModal.facilityShops'), t('airportModal.facilityRestaurants'), t('airportModal.facilityParking'), t('airportModal.facilityCurrency'), t('airportModal.facilityLounges')],
              transportation: [t('airportModal.transTrain'), t('airportModal.transMetro'), t('airportModal.transTaxi'), t('airportModal.transBus'), t('airportModal.transCarRental')]
            }
          };
          break;
        default:
          data = {
            name: t('airportModal.defaultName', { code }),
            code: code.toUpperCase(),
            city: t('airportModal.unknown'),
            country: t('airportModal.unknown'),
            timezone: t('airportModal.unknown'),
            info: {
              note: t('airportModal.defaultNote')
            }
          };
      }
      
      setAirportData(data);
    } catch (error) {
      setError(t('airportModal.loadError', { msg: error.message }));
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
                    {t('airportModal.location')}
                  </Typography>
                  <Typography variant="body1">
                    {airportData.city}, {airportData.country}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
                    {t('airportModal.timezone')}
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
                  {t('airportModal.terminals')}
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
                      {t('airportModal.facilitiesTitle')}
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
                      {t('airportModal.transportationTitle')}
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
                      {t('airportModal.website')}
                    </Typography>
                    <Typography variant="body2" component="a" href={airportData.info.website} target="_blank" rel="noopener noreferrer" sx={{ color: '#2196F3' }}>
                      {airportData.info.website}
                    </Typography>
                  </Box>
                )}
                
                {airportData.info.phone && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ color: '#666' }}>
                      {t('airportModal.phone')}
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
                  {t('airportModal.showOnMap')}
                </Button>
                <Button 
                  variant="outlined"
                  startIcon={<i className="material-icons">flight</i>}
                  sx={{ mr: 2 }}
                  onClick={() => window.open(`https://www.flightradar24.com/airport/${airportData.code}`)}
                >
                  {t('airportModal.liveFlights')}
                </Button>
              </Box>
            )}
          </>
        ) : (
          <Typography sx={{ p: 2 }}>{t('airportModal.noData')}</Typography>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={onClose}>{t('airportModal.close')}</Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default AirportInfoModal;