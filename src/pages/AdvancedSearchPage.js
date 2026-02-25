import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container, Box, Typography, TextField, Button, Grid, Card, CardContent,
  CardMedia, Chip, Paper, InputAdornment, Slider, FormControl, InputLabel,
  Select, MenuItem, Rating, IconButton, Divider,
  ToggleButton, ToggleButtonGroup, Collapse, Fab, CircularProgress
} from '@mui/material';
import { fetchDestinationFromAI } from '../services/aiDestinationService';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Place as PlaceIcon,
  Restaurant as RestaurantIcon,
  Hotel as HotelIcon,
  Museum as MuseumIcon,
  BeachAccess as BeachIcon,
  Nature as NatureIcon,
  Close as CloseIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  KeyboardArrowUp as ArrowUpIcon
} from '@mui/icons-material';

// ממיר מחיר טקסטואלי למספר
const parsePrice = (priceStr) => {
  if (!priceStr) return 0;
  const s = String(priceStr);
  if (/חינם|free|0/i.test(s)) return 0;
  const match = s.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
};

// ממיר נתוני AI לפורמט כרטיסיות
const transformDestinationData = (data, destName) => {
  const results = [];
  const loc = `${destName}, ${data.country || ''}`;
  const imgBase = `https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=500`;

  (data.attractions || []).forEach((item, i) => {
    results.push({
      id: `a_${i}`, name: item.name, category: 'attractions',
      location: loc,
      image: `https://source.unsplash.com/500x300/?${encodeURIComponent(item.name + ' ' + destName)}`,
      rating: item.rating || 4.2, price: parsePrice(item.price),
      description: item.description || '',
      tags: ['תרבות', 'אטרקציה'], reviews: 1000 + i * 347,
      duration: item.recommendedDuration, tips: item.tips
    });
  });

  (data.food?.restaurants || []).forEach((item, i) => {
    const priceMap = { '$': 10, '$$': 30, '$$$': 65, '$$$$': 120 };
    results.push({
      id: `r_${i}`, name: item.name, category: 'restaurants',
      location: item.area ? `${item.area}, ${loc}` : loc,
      image: `https://source.unsplash.com/500x300/?restaurant,${encodeURIComponent(destName)}`,
      rating: item.rating || 4.0, price: priceMap[item.priceRange] || 30,
      description: `${item.description || ''} • ${item.cuisine || ''}`,
      tags: ['אוכל', 'מסעדה'], reviews: 500 + i * 123,
      website: item.website
    });
  });

  (data.food?.markets || []).forEach((item, i) => {
    results.push({
      id: `m_${i}`, name: item.name, category: 'attractions',
      location: loc,
      image: item.image || `https://source.unsplash.com/500x300/?market,${encodeURIComponent(destName)}`,
      rating: 4.3, price: 0,
      description: item.description || '',
      tags: ['שוק', 'קניות', 'אוכל'], reviews: 300 + i * 89
    });
  });

  return results;
};

const AdvancedSearchPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const urlQuery = new URLSearchParams(location.search).get('q') || '';
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [minRating, setMinRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('relevance');
  const [favorites, setFavorites] = useState([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchedDestination, setSearchedDestination] = useState('');
  const [searchError, setSearchError] = useState('');

  // קטגוריות
  const categories = [
    { value: 'all', label: 'הכל', icon: <SearchIcon />, color: '#667eea' },
    { value: 'attractions', label: 'אטרקציות', icon: <MuseumIcon />, color: '#f093fb' },
    { value: 'restaurants', label: 'מסעדות', icon: <RestaurantIcon />, color: '#4facfe' },
    { value: 'hotels', label: 'מלונות', icon: <HotelIcon />, color: '#43e97b' },
    { value: 'nature', label: 'טבע', icon: <NatureIcon />, color: '#fa709a' },
    { value: 'beach', label: 'חופים', icon: <BeachIcon />, color: '#30cfd0' }
  ];

  // תגיות
  const availableTags = [
    'משפחות', 'זוגות', 'חברים', 'סולו', 'יוקרה', 'תקציב', 'הרפתקאות',
    'רומנטי', 'תרבות', 'אוכל', 'היסטוריה', 'אמנות', 'ספורט', 'קניות'
  ];

  const [results, setResults] = useState([]);

  const handleDestinationSearch = async () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    setIsSearching(true);
    setSearchError('');
    setSearchedDestination(trimmed);
    setSearchQuery('');
    setSelectedCategory('all');
    try {
      const aiData = await fetchDestinationFromAI(trimmed);
      setResults(transformDestinationData(aiData, trimmed));
    } catch (err) {
      setSearchError(err.message === 'NO_API_KEY' ? 'no_api_key' : 'error');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // פילטור תוצאות
  const [filteredResults, setFilteredResults] = useState([]);

  useEffect(() => {
    let filtered = [...results];

    // סינון לפי חיפוש
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // סינון לפי קטגוריה
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // סינון לפי מחיר
    filtered = filtered.filter(item => item.price >= priceRange[0] && item.price <= priceRange[1]);

    // סינון לפי דירוג
    filtered = filtered.filter(item => item.rating >= minRating);

    // סינון לפי תגיות
    if (selectedTags.length > 0) {
      filtered = filtered.filter(item =>
        selectedTags.some(tag => item.tags.includes(tag))
      );
    }

    // מיון
    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'reviews':
        filtered.sort((a, b) => b.reviews - a.reviews);
        break;
      default:
        // relevance - לא משנה סדר
        break;
    }

    setFilteredResults(filtered);
  }, [searchQuery, selectedCategory, priceRange, minRating, selectedTags, sortBy, results]);

  // Scroll to top
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFavorite = (id) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]
    );
  };

  const getCategoryColor = (category) => {
    return categories.find(cat => cat.value === category)?.color || '#667eea';
  };

  return (
    <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', pb: 8 }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 6,
          mb: 4
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            🔍 חיפוש מתקדם
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.95 }}>
            מצא בדיוק מה שאתה מחפש - אטרקציות, מסעדות, מלונות ועוד
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Search Bar */}
        <Paper
          elevation={3}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 4,
            background: 'white'
          }}
        >
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              fullWidth
              placeholder="חפש יעד, עיר או מדינה..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  handleDestinationSearch();
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                sx: { borderRadius: 3 }
              }}
              sx={{ flex: 1, minWidth: '300px' }}
            />
            <Button
              variant="contained"
              startIcon={isSearching ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
              onClick={handleDestinationSearch}
              disabled={isSearching || !searchQuery.trim()}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                px: 3, py: 1.5, borderRadius: 3,
                '&:hover': { background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)' }
              }}
            >
              חפש יעד
            </Button>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{
                bgcolor: showFilters ? '#667eea' : '#e0e0e0',
                color: showFilters ? 'white' : '#666',
                px: 4,
                py: 1.5,
                borderRadius: 3,
                '&:hover': {
                  bgcolor: showFilters ? '#5568d3' : '#d0d0d0'
                }
              }}
            >
              {showFilters ? 'הסתר פילטרים' : 'הצג פילטרים'}
            </Button>
          </Box>

          {/* Categories */}
          <Box sx={{ mt: 3 }}>
            <ToggleButtonGroup
              value={selectedCategory}
              exclusive
              onChange={(e, newCategory) => newCategory && setSelectedCategory(newCategory)}
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                '& .MuiToggleButton-root': {
                  border: 'none',
                  borderRadius: '12px !important',
                  px: 3,
                  py: 1,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600
                }
              }}
            >
              {categories.map((cat) => (
                <ToggleButton
                  key={cat.value}
                  value={cat.value}
                  sx={{
                    bgcolor: selectedCategory === cat.value ? cat.color : '#f5f5f5',
                    color: selectedCategory === cat.value ? 'white' : '#666',
                    '&:hover': {
                      bgcolor: selectedCategory === cat.value ? cat.color : '#e8e8e8'
                    }
                  }}
                >
                  {cat.icon}
                  <Box component="span" sx={{ ml: 1 }}>{cat.label}</Box>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        </Paper>

        {/* Filters Panel */}
        <Collapse in={showFilters}>
          <Paper
            elevation={2}
            sx={{
              p: 4,
              mb: 4,
              borderRadius: 4,
              background: 'white'
            }}
          >
            <Grid container spacing={4}>
              {/* Price Range */}
              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  💰 טווח מחירים (€)
                </Typography>
                <Slider
                  value={priceRange}
                  onChange={(e, newValue) => setPriceRange(newValue)}
                  valueLabelDisplay="auto"
                  min={0}
                  max={100}
                  sx={{
                    color: '#667eea',
                    '& .MuiSlider-thumb': {
                      width: 20,
                      height: 20
                    }
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Chip label={`€${priceRange[0]}`} size="small" />
                  <Chip label={`€${priceRange[1]}`} size="small" />
                </Box>
              </Grid>

              {/* Rating */}
              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  ⭐ דירוג מינימלי
                </Typography>
                <Rating
                  value={minRating}
                  onChange={(e, newValue) => setMinRating(newValue || 0)}
                  size="large"
                  sx={{ mt: 2 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {minRating > 0 ? `${minRating} כוכבים ומעלה` : 'ללא סינון'}
                </Typography>
              </Grid>

              {/* Sort */}
              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  🔄 מיון לפי
                </Typography>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="relevance">רלוונטיות</MenuItem>
                    <MenuItem value="rating">דירוג גבוה</MenuItem>
                    <MenuItem value="price-low">מחיר נמוך</MenuItem>
                    <MenuItem value="price-high">מחיר גבוה</MenuItem>
                    <MenuItem value="reviews">מספר ביקורות</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Tags */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  🏷️ תגיות
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                  {availableTags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onClick={() => {
                        setSelectedTags(prev =>
                          prev.includes(tag)
                            ? prev.filter(t => t !== tag)
                            : [...prev, tag]
                        );
                      }}
                      color={selectedTags.includes(tag) ? 'primary' : 'default'}
                      sx={{
                        fontSize: '1rem',
                        py: 2.5,
                        bgcolor: selectedTags.includes(tag) ? '#667eea' : '#f5f5f5',
                        color: selectedTags.includes(tag) ? 'white' : '#666',
                        '&:hover': {
                          bgcolor: selectedTags.includes(tag) ? '#5568d3' : '#e8e8e8'
                        }
                      }}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>

            {/* Clear Filters */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<CloseIcon />}
                onClick={() => {
                  setPriceRange([0, 100]);
                  setMinRating(0);
                  setSelectedTags([]);
                  setSelectedCategory('all');
                  setSortBy('relevance');
                }}
                sx={{
                  borderRadius: 3,
                  px: 4,
                  textTransform: 'none'
                }}
              >
                נקה את כל הפילטרים
              </Button>
            </Box>
          </Paper>
        </Collapse>

        {/* Empty state - no search yet */}
        {!searchedDestination && !isSearching && (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography sx={{ fontSize: '4rem', mb: 2 }}>🔍</Typography>
            <Typography variant="h5" fontWeight="bold" mb={1}>
              חפש יעד לקבלת תוצאות
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              רשום שם עיר או מדינה בשדה למעלה ולחץ על "חפש יעד"
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/destination-info')}
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 3, px: 4 }}
            >
              עיין ביעדים פופולריים
            </Button>
          </Box>
        )}

        {/* Loading state */}
        {isSearching && (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <CircularProgress size={60} sx={{ color: '#667eea', mb: 3 }} />
            <Typography variant="h6" color="text.secondary">
              מחפש מידע על {searchedDestination}...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              AI אוסף עבורך את הנתונים הטובים ביותר
            </Typography>
          </Box>
        )}

        {/* Error state */}
        {searchError && !isSearching && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ fontSize: '3rem', mb: 2 }}>
              {searchError === 'no_api_key' ? '🔑' : '⚠️'}
            </Typography>
            <Typography variant="h6" fontWeight="bold" mb={1}>
              {searchError === 'no_api_key'
                ? 'נדרש מפתח API'
                : 'שגיאה בטעינת נתונים'}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {searchError === 'no_api_key'
                ? 'הגדר REACT_APP_OPENAI_API_KEY כדי להפעיל חיפוש AI'
                : 'לא הצלחנו לאסוף מידע על היעד. נסה שוב.'}
            </Typography>
            <Button
              variant="outlined"
              onClick={() => navigate(`/destination-info/${encodeURIComponent(searchedDestination)}`)}
              sx={{ borderRadius: 3, px: 4 }}
            >
              עבור לדף {searchedDestination}
            </Button>
          </Box>
        )}

        {/* Results Header */}
        {searchedDestination && !isSearching && !searchError && (
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h5" fontWeight="bold">
            🗺️ {searchedDestination} — {filteredResults.length} תוצאות
          </Typography>
          {selectedTags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">סינון פעיל:</Typography>
              {selectedTags.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  onDelete={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                />
              ))}
            </Box>
          )}
        </Box>
        )}

        {/* Results Grid */}
        {searchedDestination && !isSearching && !searchError && (filteredResults.length > 0 ? (
          <Grid container spacing={3}>
            {filteredResults.map((result) => (
              <Grid item xs={12} sm={6} md={4} key={result.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 4,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
                    }
                  }}
                  onClick={() => navigate(`/destination-info/${result.location.split(',')[0]}`)}
                >
                  {/* Image */}
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={result.image}
                      alt={result.name}
                      sx={{ objectFit: 'cover' }}
                    />
                    
                    {/* Category Badge */}
                    <Chip
                      label={categories.find(c => c.value === result.category)?.label}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        bgcolor: getCategoryColor(result.category),
                        color: 'white',
                        fontWeight: 600
                      }}
                    />

                    {/* Favorite Button */}
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(result.id);
                      }}
                      sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        bgcolor: 'rgba(255,255,255,0.9)',
                        '&:hover': { bgcolor: 'white' }
                      }}
                    >
                      {favorites.includes(result.id) ? (
                        <FavoriteIcon color="error" />
                      ) : (
                        <FavoriteBorderIcon />
                      )}
                    </IconButton>

                    {/* Price Badge */}
                    {result.price > 0 && (
                      <Chip
                        label={`€${result.price}`}
                        size="small"
                        sx={{
                          position: 'absolute',
                          bottom: 10,
                          right: 10,
                          bgcolor: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          fontWeight: 700
                        }}
                      />
                    )}
                    {result.price === 0 && (
                      <Chip
                        label="חינם"
                        size="small"
                        sx={{
                          position: 'absolute',
                          bottom: 10,
                          right: 10,
                          bgcolor: '#43e97b',
                          color: 'white',
                          fontWeight: 700
                        }}
                      />
                    )}
                  </Box>

                  {/* Content */}
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {result.name}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PlaceIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {result.location}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Rating value={result.rating} precision={0.1} size="small" readOnly />
                      <Typography variant="body2" color="text.secondary">
                        {result.rating} ({result.reviews.toLocaleString()} ביקורות)
                      </Typography>
                    </Box>

                    <Typography variant="body2" paragraph sx={{ flexGrow: 1 }}>
                      {result.description}
                    </Typography>

                    {/* Tags */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {result.tags.slice(0, 3).map((tag, idx) => (
                        <Chip
                          key={idx}
                          label={tag}
                          size="small"
                          sx={{
                            bgcolor: '#f5f5f5',
                            fontSize: '0.75rem'
                          }}
                        />
                      ))}
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        sx={{
                          bgcolor: getCategoryColor(result.category),
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          '&:hover': {
                            bgcolor: getCategoryColor(result.category),
                            filter: 'brightness(0.9)'
                          }
                        }}
                      >
                        פרטים נוספים
                      </Button>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          // Share functionality
                        }}
                        sx={{
                          border: '1px solid #e0e0e0',
                          borderRadius: 2
                        }}
                      >
                        <ShareIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: 8,
              textAlign: 'center',
              borderRadius: 4,
              bgcolor: 'white'
            }}
          >
            <SearchIcon sx={{ fontSize: 80, color: '#e0e0e0', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              לא נמצאו תוצאות
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              נסה לשנות את הפילטרים או את מילות החיפוש
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                setSearchQuery('');
                setSearchedDestination('');
                setSearchError('');
                setResults([]);
                setPriceRange([0, 100]);
                setMinRating(0);
                setSelectedTags([]);
                setSelectedCategory('all');
              }}
              sx={{
                mt: 2,
                bgcolor: '#667eea',
                borderRadius: 3,
                px: 4,
                textTransform: 'none'
              }}
            >
              נקה חיפוש
            </Button>
          </Paper>
        ))}
      </Container>

      {/* Scroll to Top Button */}
      <Collapse in={showScrollTop}>
        <Fab
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            bgcolor: '#667eea',
            color: 'white',
            '&:hover': {
              bgcolor: '#5568d3'
            }
          }}
        >
          <ArrowUpIcon />
        </Fab>
      </Collapse>
    </Box>
  );
};

export default AdvancedSearchPage;