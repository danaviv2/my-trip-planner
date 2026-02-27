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
import { useTranslation } from 'react-i18next';

const parsePrice = (priceStr) => {
  if (!priceStr) return 0;
  const s = String(priceStr);
  if (/free|0/i.test(s)) return 0;
  const match = s.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
};

const transformDestinationData = (data, destName) => {
  const results = [];
  const loc = `${destName}, ${data.country || ''}`;

  (data.attractions || []).forEach((item, i) => {
    results.push({
      id: `a_${i}`, name: item.name, category: 'attractions',
      location: loc,
      image: `https://source.unsplash.com/500x300/?${encodeURIComponent(item.name + ' ' + destName)}`,
      rating: item.rating || 4.2, price: parsePrice(item.price),
      description: item.description || '',
      tags: ['culture', 'attraction'], reviews: 1000 + i * 347,
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
      tags: ['food', 'restaurant'], reviews: 500 + i * 123,
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
      tags: ['market', 'shopping', 'food'], reviews: 300 + i * 89
    });
  });

  return results;
};

const AdvancedSearchPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
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
  const [results, setResults] = useState([]);

  const categories = [
    { value: 'all', label: t('advancedSearch.cat_all'), icon: <SearchIcon />, color: '#667eea' },
    { value: 'attractions', label: t('advancedSearch.cat_attractions'), icon: <MuseumIcon />, color: '#f093fb' },
    { value: 'restaurants', label: t('advancedSearch.cat_restaurants'), icon: <RestaurantIcon />, color: '#4facfe' },
    { value: 'hotels', label: t('advancedSearch.cat_hotels'), icon: <HotelIcon />, color: '#43e97b' },
    { value: 'nature', label: t('advancedSearch.cat_nature'), icon: <NatureIcon />, color: '#fa709a' },
    { value: 'beach', label: t('advancedSearch.cat_beach'), icon: <BeachIcon />, color: '#30cfd0' }
  ];

  const availableTags = [
    t('advancedSearch.tag_families'),
    t('advancedSearch.tag_couples'),
    t('advancedSearch.tag_friends'),
    t('advancedSearch.tag_solo'),
    t('advancedSearch.tag_luxury'),
    t('advancedSearch.tag_budget'),
    t('advancedSearch.tag_adventure'),
    t('advancedSearch.tag_romantic'),
    t('advancedSearch.tag_culture'),
    t('advancedSearch.tag_food'),
    t('advancedSearch.tag_history'),
    t('advancedSearch.tag_art'),
    t('advancedSearch.tag_sports'),
    t('advancedSearch.tag_shopping'),
  ];

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

  const [filteredResults, setFilteredResults] = useState([]);

  useEffect(() => {
    let filtered = [...results];

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    filtered = filtered.filter(item => item.price >= priceRange[0] && item.price <= priceRange[1]);
    filtered = filtered.filter(item => item.rating >= minRating);

    if (selectedTags.length > 0) {
      filtered = filtered.filter(item =>
        selectedTags.some(tag => item.tags.includes(tag))
      );
    }

    switch (sortBy) {
      case 'rating': filtered.sort((a, b) => b.rating - a.rating); break;
      case 'price-low': filtered.sort((a, b) => a.price - b.price); break;
      case 'price-high': filtered.sort((a, b) => b.price - a.price); break;
      case 'reviews': filtered.sort((a, b) => b.reviews - a.reviews); break;
      default: break;
    }

    setFilteredResults(filtered);
  }, [searchQuery, selectedCategory, priceRange, minRating, selectedTags, sortBy, results]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const toggleFavorite = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]);
  };

  const getCategoryColor = (category) => categories.find(cat => cat.value === category)?.color || '#667eea';

  return (
    <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', pb: 8 }}>
      <Box sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        py: 6,
        mb: 4
      }}>
        <Container maxWidth="lg">
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            {t('advancedSearch.title')}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.95 }}>
            {t('advancedSearch.subtitle')}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Search Bar */}
        <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 4, background: 'white' }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              fullWidth
              placeholder={t('advancedSearch.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) handleDestinationSearch();
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><SearchIcon /></InputAdornment>
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
              {t('advancedSearch.search_btn')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{
                bgcolor: showFilters ? '#667eea' : '#e0e0e0',
                color: showFilters ? 'white' : '#666',
                px: 4, py: 1.5, borderRadius: 3,
                '&:hover': { bgcolor: showFilters ? '#5568d3' : '#d0d0d0' }
              }}
            >
              {showFilters ? t('advancedSearch.hide_filters') : t('advancedSearch.show_filters')}
            </Button>
          </Box>

          {/* Categories */}
          <Box sx={{ mt: 3 }}>
            <ToggleButtonGroup
              value={selectedCategory}
              exclusive
              onChange={(e, newCategory) => newCategory && setSelectedCategory(newCategory)}
              sx={{
                display: 'flex', flexWrap: 'wrap', gap: 1,
                '& .MuiToggleButton-root': {
                  border: 'none', borderRadius: '12px !important',
                  px: 3, py: 1, textTransform: 'none', fontSize: '1rem', fontWeight: 600
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
                    '&:hover': { bgcolor: selectedCategory === cat.value ? cat.color : '#e8e8e8' }
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
          <Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 4, background: 'white' }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  {t('advancedSearch.price_range')}
                </Typography>
                <Slider
                  value={priceRange}
                  onChange={(e, newValue) => setPriceRange(newValue)}
                  valueLabelDisplay="auto"
                  min={0} max={100}
                  sx={{ color: '#667eea', '& .MuiSlider-thumb': { width: 20, height: 20 } }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Chip label={`€${priceRange[0]}`} size="small" />
                  <Chip label={`€${priceRange[1]}`} size="small" />
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  {t('advancedSearch.min_rating')}
                </Typography>
                <Rating
                  value={minRating}
                  onChange={(e, newValue) => setMinRating(newValue || 0)}
                  size="large"
                  sx={{ mt: 2 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {minRating > 0 ? t('advancedSearch.stars_up', { count: minRating }) : t('advancedSearch.no_filter')}
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  {t('advancedSearch.sort_by')}
                </Typography>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} sx={{ borderRadius: 2 }}>
                    <MenuItem value="relevance">{t('advancedSearch.sort_relevance')}</MenuItem>
                    <MenuItem value="rating">{t('advancedSearch.sort_rating')}</MenuItem>
                    <MenuItem value="price-low">{t('advancedSearch.sort_price_low')}</MenuItem>
                    <MenuItem value="price-high">{t('advancedSearch.sort_price_high')}</MenuItem>
                    <MenuItem value="reviews">{t('advancedSearch.sort_reviews')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  {t('advancedSearch.tags_label')}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                  {availableTags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onClick={() => {
                        setSelectedTags(prev =>
                          prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                        );
                      }}
                      color={selectedTags.includes(tag) ? 'primary' : 'default'}
                      sx={{
                        fontSize: '1rem', py: 2.5,
                        bgcolor: selectedTags.includes(tag) ? '#667eea' : '#f5f5f5',
                        color: selectedTags.includes(tag) ? 'white' : '#666',
                        '&:hover': { bgcolor: selectedTags.includes(tag) ? '#5568d3' : '#e8e8e8' }
                      }}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>

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
                sx={{ borderRadius: 3, px: 4, textTransform: 'none' }}
              >
                {t('advancedSearch.clear_filters')}
              </Button>
            </Box>
          </Paper>
        </Collapse>

        {/* Empty state */}
        {!searchedDestination && !isSearching && (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography sx={{ fontSize: '4rem', mb: 2 }}>🔍</Typography>
            <Typography variant="h5" fontWeight="bold" mb={1}>
              {t('advancedSearch.empty_title')}
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              {t('advancedSearch.empty_body')}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/destination-info')}
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 3, px: 4 }}
            >
              {t('advancedSearch.browse_popular')}
            </Button>
          </Box>
        )}

        {/* Loading state */}
        {isSearching && (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <CircularProgress size={60} sx={{ color: '#667eea', mb: 3 }} />
            <Typography variant="h6" color="text.secondary">
              {t('advancedSearch.loading', { dest: searchedDestination })}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('advancedSearch.loading_sub')}
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
                ? t('advancedSearch.err_no_key_title')
                : t('advancedSearch.err_load_title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {searchError === 'no_api_key'
                ? t('advancedSearch.err_no_key_body')
                : t('advancedSearch.err_load_body')}
            </Typography>
            <Button
              variant="outlined"
              onClick={() => navigate(`/destination-info/${encodeURIComponent(searchedDestination)}`)}
              sx={{ borderRadius: 3, px: 4 }}
            >
              {t('advancedSearch.go_to_dest', { dest: searchedDestination })}
            </Button>
          </Box>
        )}

        {/* Results Header */}
        {searchedDestination && !isSearching && !searchError && (
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h5" fontWeight="bold">
              {t('advancedSearch.results_header', { dest: searchedDestination, count: filteredResults.length })}
            </Typography>
            {selectedTags.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">{t('advancedSearch.active_filter')}</Typography>
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
                    height: '100%', display: 'flex', flexDirection: 'column',
                    borderRadius: 4, overflow: 'hidden', transition: 'all 0.3s ease', cursor: 'pointer',
                    '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 12px 24px rgba(0,0,0,0.15)' }
                  }}
                  onClick={() => navigate(`/destination-info/${result.location.split(',')[0]}`)}
                >
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia component="img" height="200" image={result.image} alt={result.name} sx={{ objectFit: 'cover' }} />

                    <Chip
                      label={categories.find(c => c.value === result.category)?.label}
                      size="small"
                      sx={{ position: 'absolute', top: 10, left: 10, bgcolor: getCategoryColor(result.category), color: 'white', fontWeight: 600 }}
                    />

                    <IconButton
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(result.id); }}
                      sx={{ position: 'absolute', top: 10, right: 10, bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'white' } }}
                    >
                      {favorites.includes(result.id) ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                    </IconButton>

                    {result.price > 0 && (
                      <Chip label={`€${result.price}`} size="small" sx={{ position: 'absolute', bottom: 10, right: 10, bgcolor: 'rgba(0,0,0,0.7)', color: 'white', fontWeight: 700 }} />
                    )}
                    {result.price === 0 && (
                      <Chip label={t('advancedSearch.free')} size="small" sx={{ position: 'absolute', bottom: 10, right: 10, bgcolor: '#43e97b', color: 'white', fontWeight: 700 }} />
                    )}
                  </Box>

                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>{result.name}</Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PlaceIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">{result.location}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Rating value={result.rating} precision={0.1} size="small" readOnly />
                      <Typography variant="body2" color="text.secondary">
                        {result.rating} ({result.reviews.toLocaleString()} {t('advancedSearch.reviews')})
                      </Typography>
                    </Box>

                    <Typography variant="body2" paragraph sx={{ flexGrow: 1 }}>{result.description}</Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {result.tags.slice(0, 3).map((tag, idx) => (
                        <Chip key={idx} label={tag} size="small" sx={{ bgcolor: '#f5f5f5', fontSize: '0.75rem' }} />
                      ))}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        sx={{
                          bgcolor: getCategoryColor(result.category), borderRadius: 2,
                          textTransform: 'none', fontWeight: 600,
                          '&:hover': { bgcolor: getCategoryColor(result.category), filter: 'brightness(0.9)' }
                        }}
                      >
                        {t('advancedSearch.details')}
                      </Button>
                      <IconButton
                        onClick={(e) => e.stopPropagation()}
                        sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}
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
          <Paper elevation={0} sx={{ p: 8, textAlign: 'center', borderRadius: 4, bgcolor: 'white' }}>
            <SearchIcon sx={{ fontSize: 80, color: '#e0e0e0', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              {t('advancedSearch.no_results_title')}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {t('advancedSearch.no_results_body')}
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
              sx={{ mt: 2, bgcolor: '#667eea', borderRadius: 3, px: 4, textTransform: 'none' }}
            >
              {t('advancedSearch.clear_search')}
            </Button>
          </Paper>
        ))}
      </Container>

      <Collapse in={showScrollTop}>
        <Fab
          onClick={scrollToTop}
          sx={{ position: 'fixed', bottom: 24, right: 24, bgcolor: '#667eea', color: 'white', '&:hover': { bgcolor: '#5568d3' } }}
        >
          <ArrowUpIcon />
        </Fab>
      </Collapse>
    </Box>
  );
};

export default AdvancedSearchPage;
