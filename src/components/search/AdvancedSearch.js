// src/components/search/AdvancedSearch.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Paper, Typography, TextField, Button, IconButton, 
  Chip, Collapse, Grid, Slider, Checkbox, FormControlLabel,
  Autocomplete, CircularProgress, Divider, Rating, InputAdornment,
  Card, CardContent, CardMedia, CardActions, Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FilterListIcon from '@mui/icons-material/FilterList';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import HotelIcon from '@mui/icons-material/Hotel';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import AttractionsIcon from '@mui/icons-material/Attractions';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import MuseumIcon from '@mui/icons-material/Museum';
import SortIcon from '@mui/icons-material/Sort';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import LanguageIcon from '@mui/icons-material/Language';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ClearIcon from '@mui/icons-material/Clear';
import debounce from 'lodash/debounce';

/**
 * קומפוננטת חיפוש מתקדם עם סינון תוצאות
 * תומכת בחיפוש טקסט, מיקום, דירוג, מחיר וקטגוריות
 */
const AdvancedSearch = ({
  onSearch,
  onResultSelect,
  initialResults = [],
  categories = [],
  placeholder = 'חפש יעדים, מקומות, ואטרקציות...',
  enableFilters = true,
  enableMap = true,
  showFavorites = true,
  maxResults = 50
}) => {
  // משתני מצב
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(initialResults);
  const [filteredResults, setFilteredResults] = useState(initialResults);
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState(null);
  
  // משתני מצב לסינון
  const [filters, setFilters] = useState({
    priceRange: [0, 1000],
    rating: 0,
    categories: [],
    showOnlyFavorites: false,
    location: '',
    distance: 50, // במרחק של 50 ק"м
    openNow: false,
    sortBy: 'recommended'
  });
  
  // רשימת הקטגוריות הזמינות לסינון
  const [availableCategories] = useState(
    categories.length > 0 ? categories : [
      { id: 'restaurant', label: 'מסעדות', icon: <RestaurantIcon /> },
      { id: 'hotel', label: 'מלונות', icon: <HotelIcon /> },
      { id: 'cafe', label: 'בתי קפה', icon: <LocalCafeIcon /> },
      { id: 'attraction', label: 'אטרקציות', icon: <AttractionsIcon /> },
      { id: 'beach', label: 'חופים', icon: <BeachAccessIcon /> },
      { id: 'museum', label: 'מוזיאונים', icon: <MuseumIcon /> }
    ]
  );
  
  // פונקציה להחזרת אייקון לפי מזהה קטגוריה
  const getCategoryIcon = (categoryId) => {
    const category = availableCategories.find(c => c.id === categoryId);
    return category?.icon || <AttractionsIcon />;
  };
  
  // אפשרויות מיון
  const sortOptions = [
    { value: 'recommended', label: 'מומלצים' },
    { value: 'price_asc', label: 'מחיר - מהנמוך לגבוה' },
    { value: 'price_desc', label: 'מחיר - מהגבוה לנמוך' },
    { value: 'rating', label: 'דירוג' },
    { value: 'distance', label: 'מרחק' },
    { value: 'popularity', label: 'פופולריות' }
  ];
  
  // טעינה ראשונית של מועדפים משמורים
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (err) {
        console.error('שגיאה בטעינת מועדפים:', err);
      }
    }
  }, []);
  
  // שמירת מועדפים
  useEffect(() => {
    if (favorites.length > 0) {
      localStorage.setItem('favorites', JSON.stringify(favorites));
    }
  }, [favorites]);
  
  // השהיית חיפוש בעת הקלדה
  const debouncedSearch = useCallback(
    debounce((term) => {
      if (term.length < 2) {
        // אם החיפוש קצר מדי, חזור לתוצאות הראשוניות
        setFilteredResults(initialResults);
        return;
      }
      
      performSearch(term);
    }, 500),
    [initialResults]
  );
  
  // עדכון חיפוש בשינוי טקסט
  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => debouncedSearch.cancel();
  }, [searchTerm, debouncedSearch]);
  
  // סינון התוצאות בהתאם לפילטרים
  useEffect(() => {
    filterResults();
  }, [results, filters]);
  
  // ביצוע חיפוש
  const performSearch = async (term) => {
    setIsSearching(true);
    setError(null);
    
    try {
      if (onSearch) {
        // אם יש פונקציית חיפוש חיצונית, השתמש בה
        const searchResults = await onSearch(term, filters);
        setResults(searchResults || []);
      } else {
        // אחרת בצע חיפוש פשוט במידע קיים (לדוגמה)
        const simpleSearch = initialResults.filter(item => 
          item.title.includes(term) || 
          (item.description && item.description.includes(term)) ||
          (item.location && item.location.includes(term))
        );
        setResults(simpleSearch);
      }
    } catch (err) {
      console.error('שגיאה בחיפוש:', err);
      setError('אירעה שגיאה בחיפוש. נסה שוב.');
    } finally {
      setIsSearching(false);
    }
  };
  
  // סינון התוצאות
  const filterResults = () => {
    if (results.length === 0) return;
    
    let filtered = [...results];
    
    // סינון לפי מחיר
    filtered = filtered.filter(item => {
      const price = item.price || 0;
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });
    
    // סינון לפי דירוג
    if (filters.rating > 0) {
      filtered = filtered.filter(item => (item.rating || 0) >= filters.rating);
    }
    
    // סינון לפי קטגוריות
    if (filters.categories.length > 0) {
      filtered = filtered.filter(item => 
        filters.categories.includes(item.category)
      );
    }
    
    // הצג רק מועדפים
    if (filters.showOnlyFavorites) {
      filtered = filtered.filter(item => 
        favorites.includes(item.id)
      );
    }
    
    // סינון לפי פתוח כעת
    if (filters.openNow && filtered.some(item => item.openingHours)) {
      filtered = filtered.filter(item => item.isOpenNow);
    }
    
    // מיון התוצאות
    switch (filters.sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price_desc':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'distance':
        // במקרה אמיתי יהיה כאן חישוב מרחק
        break;
      case 'popularity':
        filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        break;
      case 'recommended':
      default:
        // אין צורך למיין מחדש
        break;
    }
    
    // הגבלת מספר התוצאות
    filtered = filtered.slice(0, maxResults);
    
    setFilteredResults(filtered);
  };
  
  // עדכון ערך סינון
  const updateFilter = (name, value) => {
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  // איפוס פילטרים
  const resetFilters = () => {
    setFilters({
      priceRange: [0, 1000],
      rating: 0,
      categories: [],
      showOnlyFavorites: false,
      location: '',
      distance: 50,
      openNow: false,
      sortBy: 'recommended'
    });
    
    setSearchTerm('');
  };
  
  // הוספה/הסרה של פריט למועדפים
  const toggleFavorite = (itemId) => {
    if (favorites.includes(itemId)) {
      setFavorites(favorites.filter(id => id !== itemId));
    } else {
      setFavorites([...favorites, itemId]);
    }
  };
  
  // החלפת תצוגת פילטרים
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  return (
    <Box>
      {/* שדה חיפוש */}
      <Paper
        sx={{
          p: 2,
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          borderRadius: '12px'
        }}
        elevation={3}
      >
        <TextField
          fullWidth
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="primary" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {searchTerm && (
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <ClearIcon />
                  </IconButton>
                )}
              </InputAdornment>
            )
          }}
        />
        
        {enableFilters && (
          <Button
            onClick={toggleFilters}
            startIcon={<FilterListIcon />}
            variant={showFilters ? 'contained' : 'outlined'}
            sx={{ ml: 2, whiteSpace: 'nowrap' }}
          >
            סינון
          </Button>
        )}
      </Paper>
      
      {/* הודעת שגיאה */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* אזור פילטרים */}
      <Collapse in={showFilters}>
        <Paper sx={{ p: 2, mb: 2, borderRadius: '12px' }} elevation={2}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
            סינון תוצאות
          </Typography>
          
          <Grid container spacing={3}>
            {/* טווח מחירים */}
            <Grid item xs={12} md={6}>
              <Typography variant="body2" gutterBottom>
                טווח מחירים (₪)
              </Typography>
              <Box sx={{ px: 2 }}>
                <Slider
                  value={filters.priceRange}
                  onChange={(e, newValue) => updateFilter('priceRange', newValue)}
                  valueLabelDisplay="auto"
                  min={0}
                  max={1000}
                  step={50}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption">{filters.priceRange[0]} ₪</Typography>
                  <Typography variant="caption">{filters.priceRange[1]} ₪</Typography>
                </Box>
              </Box>
            </Grid>
            
            {/* דירוג */}
            <Grid item xs={12} md={6}>
              <Typography variant="body2" gutterBottom>
                דירוג מינימלי
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Rating
                  value={filters.rating}
                  onChange={(e, newValue) => updateFilter('rating', newValue)}
                  precision={1}
                  emptyIcon={<StarBorderIcon fontSize="inherit" />}
                />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {filters.rating > 0 ? `${filters.rating} כוכבים ומעלה` : 'כל הדירוגים'}
                </Typography>
              </Box>
            </Grid>
            
            {/* קטגוריות */}
            <Grid item xs={12}>
              <Typography variant="body2" gutterBottom>
                קטגוריות
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {availableCategories.map((category) => (
                  <Chip
                    key={category.id}
                    icon={category.icon}
                    label={category.label}
                    clickable
                    color={filters.categories.includes(category.id) ? "primary" : "default"}
                    onClick={() => {
                      const currentCategories = [...filters.categories];
                      if (currentCategories.includes(category.id)) {
                        updateFilter('categories', currentCategories.filter(id => id !== category.id));
                      } else {
                        updateFilter('categories', [...currentCategories, category.id]);
                      }
                    }}
                  />
                ))}
              </Box>
            </Grid>
            
            {/* אפשרויות נוספות */}
            <Grid item xs={12} sm={6}>
              {showFavorites && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.showOnlyFavorites}
                      onChange={(e) => updateFilter('showOnlyFavorites', e.target.checked)}
                    />
                  }
                  label="הצג רק מועדפים"
                />
              )}
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.openNow}
                    onChange={(e) => updateFilter('openNow', e.target.checked)}
                  />
                }
                label="פתוח כעת"
              />
            </Grid>
            
            {/* מיון */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SortIcon />
                <Typography variant="body2">מיין לפי:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {sortOptions.map((option) => (
                    <Chip
                      key={option.value}
                      label={option.label}
                      clickable
                      color={filters.sortBy === option.value ? "primary" : "default"}
                      onClick={() => updateFilter('sortBy', option.value)}
                      variant={filters.sortBy === option.value ? "filled" : "outlined"}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            </Grid>
            
            {/* כפתורי פעולה */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
                <Button variant="outlined" onClick={resetFilters}>
                  נקה סינון
                </Button>
                <Button 
                  variant="contained" 
                  onClick={filterResults}
                  startIcon={isSearching ? <CircularProgress size={20} /> : null}
                  disabled={isSearching}
                >
                  {isSearching ? 'מסנן...' : 'החל סינון'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>
      
      {/* תגיות סינון פעילות */}
      {(filters.rating > 0 || filters.categories.length > 0 || filters.showOnlyFavorites || filters.openNow || filters.sortBy !== 'recommended') && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Typography variant="body2" sx={{ alignSelf: 'center' }}>
            סינון פעיל:
          </Typography>
          
          {filters.rating > 0 && (
            <Chip
              label={`דירוג: ${filters.rating}+`}
              onDelete={() => updateFilter('rating', 0)}
              size="small"
            />
          )}
          
          {filters.categories.map(categoryId => {
            const category = availableCategories.find(c => c.id === categoryId);
            return category ? (
              <Chip
                key={categoryId}
                icon={category.icon}
                label={category.label}
                onDelete={() => {
                  updateFilter('categories', filters.categories.filter(id => id !== categoryId));
                }}
                size="small"
              />
            ) : null;
          })}
          
          {filters.showOnlyFavorites && (
            <Chip
              icon={<FavoriteIcon />}
              label="מועדפים בלבד"
              onDelete={() => updateFilter('showOnlyFavorites', false)}
              size="small"
            />
          )}
          
          {filters.openNow && (
            <Chip
              label="פתוח כעת"
              onDelete={() => updateFilter('openNow', false)}
              size="small"
            />
          )}
          
          {filters.sortBy !== 'recommended' && (
            <Chip
              icon={<SortIcon />}
              label={sortOptions.find(opt => opt.value === filters.sortBy)?.label || ''}
              onDelete={() => updateFilter('sortBy', 'recommended')}
              size="small"
            />
          )}
        </Box>
      )}
      
      {/* תוצאות חיפוש */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          {isSearching ? 
            'מחפש...' : 
            searchTerm ? 
              `תוצאות עבור "${searchTerm}" (${filteredResults.length})` : 
              `תוצאות (${filteredResults.length})`
          }
        </Typography>
        
        {isSearching && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}
        
        {!isSearching && filteredResults.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              לא נמצאו תוצאות
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              נסה לשנות את פרמטרי החיפוש או הסינון
            </Typography>
          </Paper>
        )}
        
        <Grid container spacing={2}>
          {filteredResults.map(item => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardMedia
                  component="img"
                  height="160"
                  image={item.image || `https://source.unsplash.com/300x200/?${item.category || 'travel'}`}
                  alt={item.title}
                  sx={{ position: 'relative' }}
                />
                
                {/* כפתור מועדפים */}
                {showFavorites && (
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)'
                      }
                    }}
                    onClick={() => toggleFavorite(item.id)}
                  >
                    {favorites.includes(item.id) ? 
                      <FavoriteIcon color="error" /> : 
                      <FavoriteBorderIcon />}
                  </IconButton>
                )}
                
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="div">
                    {item.title}
                  </Typography>
                  
                  {item.category && (
                    <Chip
                      size="small"
                      label={availableCategories.find(c => c.id === item.category)?.label || item.category}
                      icon={getCategoryIcon(item.category)}
                      sx={{ mb: 1 }}
                    />
                  )}
                  
                  {item.rating && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Rating
                        value={item.rating}
                        precision={0.5}
                        size="small"
                        readOnly
                      />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        ({item.rating})
                      </Typography>
                    </Box>
                  )}
                  
                  {item.location && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                      <LocationOnIcon fontSize="small" sx={{ mt: 0.5, mr: 0.5 }} color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {item.location}
                      </Typography>
                    </Box>
                  )}
                  
                  {item.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {item.description.length > 100 ? 
                        `${item.description.substring(0, 100)}...` : 
                        item.description}
                    </Typography>
                  )}
                  
                  {item.price && (
                    <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                      {item.price} ₪
                    </Typography>
                  )}
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {item.phone && (
                      <IconButton size="small" href={`tel:${item.phone}`}>
                        <LocalPhoneIcon fontSize="small" />
                      </IconButton>
                    )}
                    
                    {item.website && (
                      <IconButton size="small" href={item.website} target="_blank">
                        <LanguageIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                  
                  <Button 
                    variant="contained" 
                    size="small"
                    onClick={() => {
                      if (onResultSelect) {
                        onResultSelect(item);
                      }
                    }}
                  >
                    פרטים נוספים
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default AdvancedSearch;