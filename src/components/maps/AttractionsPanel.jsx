import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Rating,
  Chip,
  IconButton,
  Collapse,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  Museum as MuseumIcon,
  ShoppingCart as ShoppingIcon,
  Nightlife as NightlifeIcon,
  Attractions as AttractionsIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Place as PlaceIcon
} from '@mui/icons-material';
import googlePlacesService, { PLACES_ERRORS } from '../../services/googlePlacesService';

const AttractionsPanel = ({ center, onPlaceSelect }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [places, setPlaces] = useState([]);
  // `status` מפריד בין "טוען", "לא הצלחנו לבדוק" ו"אין כאן מקומות".
  // קודם שלושתם נראו זהים על המסך — "לא נמצאו תוצאות" — וכשל נקרא כתשובה.
  const [status, setStatus] = useState('loading');
  const [failure, setFailure] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPlace, setExpandedPlace] = useState(null);
  const isLoading = status === 'loading';

  // חמש ולא שש: לשונית המלונות הוסרה לבקשת המשתמש, שאינו מחפש לינה כאן.
  // הלינה מגיעה ממילא מההזמנות שבמייל, ולא מחיפוש סביב נקודה.
  const categories = [
    { label: t('attractionsPanel.catAttractions'), icon: <AttractionsIcon />, type: 'tourist_attraction' },
    { label: t('attractionsPanel.catRestaurants'), icon: <RestaurantIcon />, type: 'restaurant' },
    { label: t('attractionsPanel.catMuseums'), icon: <MuseumIcon />, type: 'museum' },
    { label: t('attractionsPanel.catShopping'), icon: <ShoppingIcon />, type: 'shopping_mall' },
    { label: t('attractionsPanel.catNightlife'), icon: <NightlifeIcon />, type: 'night_club' }
  ];

  /**
   * נתיב אחד לכל חיפוש — לפי קטגוריה או חופשי — כדי ששני המסכים לא
   * ידווחו על אותו כשל בשתי דרכים שונות.
   */
  const runSearch = async (fetcher) => {
    setStatus('loading');
    setFailure(null);

    try {
      const results = await fetcher();
      setPlaces(results);
      setStatus(results.length ? 'ready' : 'empty');
    } catch (error) {
      // רשימה ריקה כאן הייתה אומרת למשתמש "אין כאן מקומות", וזו טענה
      // שלא נבדקה. הכשל נשמר בשמו, והמסך אומר שלא בדקנו.
      setPlaces([]);
      setFailure({ kind: error?.kind || PLACES_ERRORS.REQUEST_FAILED, detail: error?.detail || null });
      setStatus('error');
      console.error('חיפוש מקומות נכשל:', error);
    }
  };

  const searchByCategory = (categoryIndex) => {
    if (!center) return;
    const category = categories[categoryIndex];
    return runSearch(() => googlePlacesService.searchNearbyPlaces(center, 5000, category.type));
  };

  /**
   * חיפוש חופשי
   */
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    return runSearch(() => googlePlacesService.textSearch(searchQuery, center));
  };

  const retry = () => {
    if (searchQuery.trim()) handleSearch();
    else searchByCategory(activeTab);
  };

  const failureMessage = () => {
    if (!failure) return null;
    if (failure.kind === PLACES_ERRORS.MAPS_UNAVAILABLE) return t('attractionsPanel.errorMaps');
    if (failure.kind === PLACES_ERRORS.TIMEOUT) return t('attractionsPanel.errorTimeout');
    return t('attractionsPanel.errorFailed', { status: failure.detail || 'ERROR' });
  };

  /**
   * טעינה אוטומטית בשינוי קטגוריה
   */
  useEffect(() => {
    if (center) {
      searchByCategory(activeTab);
    }
  }, [activeTab, center]);

  /**
   * טעינת פרטים מלאים על מקום
   */
  const handleExpandPlace = async (placeId) => {
    if (expandedPlace === placeId) {
      setExpandedPlace(null);
      return;
    }

    setExpandedPlace(placeId);
    
    const details = await googlePlacesService.getPlaceDetails(placeId);
    if (details) {
      // עדכון המקום ברשימה עם הפרטים המלאים
      setPlaces(prev => prev.map(p => 
        p.id === placeId ? { ...p, details } : p
      ));
    }
  };

  const getPriceLevelText = (level) => {
    if (!level) return t('attractionsPanel.priceNotAvailable');
    return '₪'.repeat(level);
  };

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* כותרת */}
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <PlaceIcon /> {t('attractionsPanel.title')}
        </Typography>
      </Box>

      {/* חיפוש חופשי */}
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={t('attractionsPanel.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            endAdornment: (
              <IconButton size="small" onClick={handleSearch}>
                <SearchIcon />
              </IconButton>
            )
          }}
        />
      </Box>

      {/* טאבים של קטגוריות */}
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        {categories.map((cat, index) => (
          <Tab
            key={index}
            icon={cat.icon}
            label={cat.label}
            sx={{ minWidth: 80 }}
          />
        ))}
      </Tabs>

      {/* רשימת מקומות */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, p: 3 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              {t('attractionsPanel.loading')}
            </Typography>
          </Box>
        ) : status === 'error' ? (
          /* כשל אינו "אין כאן". המסך אומר שלא בדקנו, ומציע לבדוק שוב. */
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="error" sx={{ mb: 1.5 }}>
              {failureMessage()}
            </Typography>
            <Button variant="outlined" size="small" onClick={retry}>
              {t('attractionsPanel.retry')}
            </Button>
          </Box>
        ) : places.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
            {t('attractionsPanel.noPlaces')}
          </Typography>
        ) : (
          <List>
            {places.map((place) => (
              <Paper key={place.id} sx={{ mb: 2, overflow: 'hidden' }}>
                <ListItem
                  button
                  onClick={() => {
                    onPlaceSelect && onPlaceSelect(place);
                    handleExpandPlace(place.id);
                  }}
                  sx={{
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={place.photos?.[0]?.url}
                      alt={place.name}
                      sx={{ width: 56, height: 56 }}
                    >
                      {categories[activeTab].icon}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {place.name}
                        </Typography>
                        <IconButton size="small">
                          {expandedPlace === place.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Box>
                    }
                    /* בלי זה MUI מקנן <div> בתוך <p> וזורק validateDOMNesting */
                    secondaryTypographyProps={{ component: 'div' }}
                    secondary={
                      <Box>
                        {/* נמדד: בקניות בפירנצה ל-8 מ-20 המקומות אין דירוג כלל.
                            כוכבים ריקים נראים כמו דירוג אפס — טענה שגויה. */}
                        {place.rating > 0 ? (
                          <>
                            <Rating value={place.rating} precision={0.5} size="small" readOnly />
                            <Typography variant="caption" display="block">
                              {t('attractionsPanel.reviews', { count: place.userRatingsTotal })}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {t('attractionsPanel.noRating')}
                          </Typography>
                        )}
                        {place.priceLevel > 0 && (
                          <Chip
                            label={getPriceLevelText(place.priceLevel)}
                            size="small"
                            color="success"
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>

                {/* פרטים מורחבים */}
                <Collapse in={expandedPlace === place.id}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      📍 {place.address}
                    </Typography>
                    
                    {place.details?.phone && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {/* נמדד: "06 6493 7106" הוצג כ-"649371 06". bdi מבודד
                            את המספר מכיוון הפסקה ומחזיר את סדר הספרות. */}
                        📞 <bdi dir="ltr">{place.details.phone}</bdi>
                      </Typography>
                    )}
                    
                    {place.details?.openingHours && (
                      <Chip
                        label={place.details.openingHours.openNow ? t('attractionsPanel.openNow') : t('attractionsPanel.closed')}
                        size="small"
                        color={place.details.openingHours.openNow ? 'success' : 'error'}
                        sx={{ mb: 1 }}
                      />
                    )}

                    {place.details?.website && (
                      <Button
                        size="small"
                        href={place.details.website}
                        target="_blank"
                        sx={{ mt: 1 }}
                      >
                        🌐 {t('attractionsPanel.website')}
                      </Button>
                    )}
                  </Box>
                </Collapse>
              </Paper>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
};

export default AttractionsPanel;
