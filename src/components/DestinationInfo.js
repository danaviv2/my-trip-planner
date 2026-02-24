// DestinationInfo.js
import React, { useState, useEffect } from 'react';
import { 
  Box, Paper, Typography, Tabs, Tab, Grid, Card, CardMedia, 
  CardContent, Chip, List, Accordion, AccordionSummary, AccordionDetails,
  MenuItem, FormControl, InputLabel, Select, Alert, CircularProgress,
  Rating
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AttractionsIcon from '@mui/icons-material/Attractions';
import HotelIcon from '@mui/icons-material/Hotel';
import EventIcon from '@mui/icons-material/Event';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import TranslateIcon from '@mui/icons-material/Translate';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import LocationOnIcon from '@mui/icons-material/LocationOn';

// פונקציה לקבלת מידע על יעד (במקום import חיצוני)
const getDestinationInfo = (destination) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // נתונים סטטיים לדוגמה
      const mockData = {
        photos: [`https://source.unsplash.com/800x300/?${encodeURIComponent(destination)}`],
        bestTime: 'אביב וסתיו',
        language: 'מקומית',
        currency: 'מקומי',
        localTips: 'מומלץ להגיע מוקדם לאטרקציות פופולריות',
        accommodations: [
          'מלון המרכז',
          'מלון הנוף',
          'אכסניה ידידותית',
          'בית הארחה המשפחתי'
        ],
        attractions: [
          'מוזיאון העיר',
          'הגן הבוטני',
          'השוק הישן',
          'הטיילת',
          'המבצר ההיסטורי'
        ],
        breakfasts: [
          'קפה הבוקר',
          'לחם ומאפה',
          'ארוחת בוקר ישראלית',
          'בית הקפה המקומי'
        ],
        lunch: [
          'מסעדת הצהריים',
          'אוכל רחוב מקומי',
          'הפיצרייה',
          'סושי בר'
        ],
        dinner: [
          'מסעדת השף',
          'אוכל מסורתי',
          'הגריל הטוב',
          'מסעדה איטלקית'
        ],
        festivals: [
          {
            name: 'פסטיבל האביב',
            date: 'מרץ-אפריל',
            description: 'פסטיבל תרבות שנתי עם מוזיקה ואמנות'
          },
          {
            name: 'פסטיבל האוכל',
            date: 'יוני',
            description: 'חגיגת אוכל מקומי ובינלאומי'
          },
          {
            name: 'שבוע התרבות',
            date: 'ספטמבר',
            description: 'אירועי תרבות ואמנות ברחבי העיר'
          }
        ]
      };
      resolve(mockData);
    }, 500);
  });
};

const DestinationInfo = ({ origin, destination, waypoints }) => {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [availableLocations, setAvailableLocations] = useState([]);
  const [destinationData, setDestinationData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // עדכון רשימת המיקומים הזמינים (מוצא, יעד ונקודות ביניים)
  useEffect(() => {
    const locations = [];
    
    if (origin) locations.push({ value: origin, label: `מוצא: ${origin}` });
    if (destination) locations.push({ value: destination, label: `יעד: ${destination}` });
    
    if (waypoints && Array.isArray(waypoints)) {
      waypoints.forEach((waypoint, index) => {
        if (waypoint) {
          locations.push({ value: waypoint, label: `נקודת ביניים ${index + 1}: ${waypoint}` });
        }
      });
    }
    
    setAvailableLocations(locations);
    
    // אם יש יעד אך אין מיקום נבחר, בחר את היעד כברירת מחדל
    if (locations.length > 0 && !selectedLocation) {
      // אם יש יעד, בחר בו
      if (destination) {
        setSelectedLocation(destination);
      } else {
        // אחרת בחר במיקום הראשון
        setSelectedLocation(locations[0].value);
      }
    }
  }, [origin, destination, waypoints, selectedLocation]);
  
  // עדכון המידע על המיקום הנבחר
  useEffect(() => {
    if (selectedLocation) {
      setLoading(true);
      setError(null);
      
      // קבל את המידע על המיקום הנבחר
      getDestinationInfo(selectedLocation)
        .then(data => {
          console.log('מידע התקבל עבור:', selectedLocation, data);
          setDestinationData(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('שגיאה בטעינת מידע על היעד:', err);
          setError(`שגיאה בטעינת מידע על ${selectedLocation}: ${err.message}`);
          setLoading(false);
        });
    }
  }, [selectedLocation]);
  
  // טיפול בשינוי המיקום הנבחר
  const handleLocationChange = (event) => {
    setSelectedLocation(event.target.value);
  };
  
  // אם אין מיקומים זמינים, הצג הודעה
  if (availableLocations.length === 0) {
    return (
      <Paper sx={{ p: 3, mt: 3, textAlign: 'center' }}>
        <Typography variant="h6">
          בחר יעד או נקודות במסלול כדי לראות מידע מפורט
        </Typography>
      </Paper>
    );
  }
  
  // הטאב של מלונות
  const renderHotelsTab = () => {
    return (
      <Grid container spacing={2}>
        {destinationData.accommodations.map((hotel, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Card sx={{ 
              display: 'flex', 
              height: '100%',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
              }
            }}>
              <CardMedia
                component="img"
                sx={{ width: 150 }}
                image={`https://source.unsplash.com/300x200/?${encodeURIComponent(hotel + ' hotel')}`}
                alt={hotel}
              />
              <CardContent sx={{ flex: '1 0 auto' }}>
                <Typography variant="h6">{hotel}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Rating 
                    value={4} 
                    readOnly 
                    precision={0.5} 
                  />
                  <Chip 
                    label="₪₪₪" 
                    size="small" 
                    sx={{ ml: 1 }} 
                    color="primary"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  מלון מומלץ ב{selectedLocation} עם שירות מעולה.
                </Typography>
                <Chip label="מומלץ" color="success" size="small" />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };
  
  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3, borderRadius: '12px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
        <Typography variant="h5" sx={{ 
          display: 'flex', 
          alignItems: 'center',
          fontWeight: 'bold',
          color: '#2c3e50',
          marginRight: 2
        }}>
          <LocationOnIcon sx={{ mr: 1 }} />
          מידע על מיקומים במסלול
        </Typography>
        
        <FormControl variant="outlined" sx={{ minWidth: 240, flexGrow: 1 }}>
          <InputLabel>בחר מיקום</InputLabel>
          <Select
            value={selectedLocation}
            onChange={handleLocationChange}
            label="בחר מיקום"
          >
            {availableLocations.map((location, index) => (
              <MenuItem key={index} value={location.value}>
                {location.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : destinationData ? (
        <>
          <Box sx={{ mb: 3 }}>
            <img 
              src={destinationData.photos[0] || `https://source.unsplash.com/800x300/?${encodeURIComponent(selectedLocation)}`}
              alt={selectedLocation}
              style={{ width: '100%', borderRadius: '8px', maxHeight: '300px', objectFit: 'cover' }}
            />
          </Box>
          
          <Typography variant="h5" gutterBottom sx={{ 
            color: '#2c3e50',
            borderBottom: '2px solid #3498db',
            paddingBottom: '8px',
            marginBottom: '16px'
          }}>
            {selectedLocation}
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6} lg={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', mb: 1, color: '#2c3e50' }}>
                    <WbSunnyIcon sx={{ mr: 1, color: '#f39c12' }} />
                    עונה מומלצת
                  </Typography>
                  <Typography variant="body2">
                    {destinationData.bestTime || 'כל השנה'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', mb: 1, color: '#2c3e50' }}>
                    <TranslateIcon sx={{ mr: 1, color: '#3498db' }} />
                    שפה
                  </Typography>
                  <Typography variant="body2">
                    {destinationData.language || 'לא צוין'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', mb: 1, color: '#2c3e50' }}>
                    <CurrencyExchangeIcon sx={{ mr: 1, color: '#2ecc71' }} />
                    מטבע
                  </Typography>
                  <Typography variant="body2">
                    {destinationData.currency || 'לא צוין'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', mb: 1, color: '#2c3e50' }}>
                    <TipsAndUpdatesIcon sx={{ mr: 1, color: '#e74c3c' }} />
                    טיפים מקומיים
                  </Typography>
                  <Typography variant="body2">
                    {destinationData.localTips || 'אין טיפים זמינים'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              mb: 3, 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTab-root': {
                fontWeight: 'bold'
              },
              '& .Mui-selected': {
                color: '#3498db'
              }
            }}
          >
            <Tab label="מלונות" icon={<HotelIcon />} iconPosition="start" />
            <Tab label="אטרקציות" icon={<AttractionsIcon />} iconPosition="start" />
            <Tab label="מסעדות" icon={<RestaurantIcon />} iconPosition="start" />
            <Tab label="פסטיבלים ואירועים" icon={<EventIcon />} iconPosition="start" />
          </Tabs>
          
          {/* תוכן לשוניות */}
          <Box sx={{ minHeight: '400px' }}>
            {/* מלונות */}
            {activeTab === 0 && renderHotelsTab()}
            
            {/* אטרקציות */}
            {activeTab === 1 && (
              <Grid container spacing={2}>
                {destinationData.attractions.map((attraction, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card sx={{ 
                      height: '100%',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                      }
                    }}>
                      <CardMedia
                        component="img"
                        height="140"
                        image={`https://source.unsplash.com/300x200/?${encodeURIComponent(attraction + ' ' + selectedLocation)}`}
                        alt={attraction}
                      />
                      <CardContent>
                        <Typography variant="h6" gutterBottom>{attraction}</Typography>
                        <Chip 
                          label="אטרקציה מומלצת" 
                          color="primary" 
                          size="small" 
                          sx={{ mb: 1 }} 
                        />
                        <Typography variant="body2" color="text.secondary">
                          אטרקציה פופולרית ב{selectedLocation}. מומלץ לבקר!
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
            
            {/* מסעדות */}
            {activeTab === 2 && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>ארוחות בוקר</Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {destinationData.breakfasts.map((place, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                      <Card sx={{ 
                        height: '100%',
                        transition: 'transform 0.3s, box-shadow 0.3s',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                        }
                      }}>
                        <CardMedia
                          component="img"
                          height="120"
                          image={`https://source.unsplash.com/300x200/?${encodeURIComponent(place + ' breakfast')}`}
                          alt={place}
                        />
                        <CardContent>
                          <Typography variant="subtitle1">{place}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            מקום מצוין לארוחת בוקר
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                
                <Typography variant="subtitle1" gutterBottom>ארוחות צהריים</Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {destinationData.lunch.map((place, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                      <Card sx={{ 
                        height: '100%',
                        transition: 'transform 0.3s, box-shadow 0.3s',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                        }
                      }}>
                        <CardMedia
                          component="img"
                          height="120"
                          image={`https://source.unsplash.com/300x200/?${encodeURIComponent(place + ' lunch')}`}
                          alt={place}
                        />
                        <CardContent>
                          <Typography variant="subtitle1">{place}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            מקום מצוין לארוחת צהריים
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                
                <Typography variant="subtitle1" gutterBottom>ארוחות ערב</Typography>
                <Grid container spacing={2}>
                  {destinationData.dinner.map((place, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                      <Card sx={{ 
                        height: '100%',
                        transition: 'transform 0.3s, box-shadow 0.3s',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                        }
                      }}>
                        <CardMedia
                          component="img"
                          height="120"
                          image={`https://source.unsplash.com/300x200/?${encodeURIComponent(place + ' dinner')}`}
                          alt={place}
                        />
                        <CardContent>
                          <Typography variant="subtitle1">{place}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            מקום מצוין לארוחת ערב
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
            
            {/* פסטיבלים ואירועים */}
            {activeTab === 3 && (
              <Box>
                {destinationData.festivals ? (
                  <List>
                    {destinationData.festivals.map((festival, index) => (
                      <Accordion key={index} sx={{ 
                        mb: 1,
                        '&:before': {
                          display: 'none',
                        },
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                        '&:hover': {
                          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                        }
                      }}>
                        <AccordionSummary 
                          expandIcon={<ExpandMoreIcon />}
                          sx={{
                            '&.Mui-expanded': {
                              backgroundColor: '#f8fafc',
                            }
                          }}
                        >
                          <Typography sx={{ fontWeight: 'bold' }}>{festival.name}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="body2" paragraph>
                            <strong>מועד:</strong> {festival.date}
                          </Typography>
                          <Typography variant="body2">
                            {festival.description || 'אירוע תרבותי מרכזי ב' + selectedLocation + '. מומלץ לבדוק מראש את המועדים המדויקים.'}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </List>
                ) : (
                  <Typography>אין מידע זמין על פסטיבלים ואירועים.</Typography>
                )}
              </Box>
            )}
          </Box>
        </>
      ) : (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="h6" color="text.secondary">
            בחר מיקום כדי לראות מידע מפורט
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default DestinationInfo;