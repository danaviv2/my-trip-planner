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
  Hotel as HotelIcon,
  Museum as MuseumIcon,
  ShoppingCart as ShoppingIcon,
  Nightlife as NightlifeIcon,
  Attractions as AttractionsIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Place as PlaceIcon
} from '@mui/icons-material';
import googlePlacesService from '../../services/googlePlacesService';

const AttractionsPanel = ({ center, onPlaceSelect }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [places, setPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPlace, setExpandedPlace] = useState(null);

  const categories = [
    { label: t('attractionsPanel.catAttractions'), icon: <AttractionsIcon />, type: 'tourist_attraction' },
    { label: t('attractionsPanel.catRestaurants'), icon: <RestaurantIcon />, type: 'restaurant' },
    { label: t('attractionsPanel.catHotels'), icon: <HotelIcon />, type: 'lodging' },
    { label: t('attractionsPanel.catMuseums'), icon: <MuseumIcon />, type: 'museum' },
    { label: t('attractionsPanel.catShopping'), icon: <ShoppingIcon />, type: 'shopping_mall' },
    { label: t('attractionsPanel.catNightlife'), icon: <NightlifeIcon />, type: 'night_club' }
  ];

  /**
   * חיפוש מקומות לפי קטגוריה
   */
  const searchByCategory = async (categoryIndex) => {
    if (!center) return;

    setIsLoading(true);
    const category = categories[categoryIndex];

    try {
      const results = await googlePlacesService.searchNearbyPlaces(
        center,
        5000,
        category.type
      );
      setPlaces(results);
      console.log(`✅ נמצאו ${results.length} ${category.label}`);
    } catch (error) {
      console.error('שגיאה בחיפוש:', error);
      setPlaces([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * חיפוש חופשי
   */
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);

    try {
      const results = await googlePlacesService.textSearch(searchQuery, center);
      setPlaces(results);
      console.log(`✅ נמצאו ${results.length} תוצאות`);
    } catch (error) {
      console.error('שגיאה בחיפוש:', error);
      setPlaces([]);
    } finally {
      setIsLoading(false);
    }
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
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : places.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
            {t('attractionsPanel.noResults')}
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
                      src={place.photos[0]?.url}
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
                    secondary={
                      <Box>
                        <Rating value={place.rating} precision={0.1} size="small" readOnly />
                        <Typography variant="caption" display="block">
                          {t('attractionsPanel.reviews', { count: place.userRatingsTotal })}
                        </Typography>
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
                        📞 {place.details.phone}
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
