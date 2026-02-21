// src/components/route-planner/AttractionFilters.js
import React, { useContext } from 'react';
import { Box, Button } from '@mui/material';
import { TripContext } from '../../contexts/TripContext';

// הגדרת צבעים ואייקונים לכל קטגוריה
const CATEGORY_ICONS = {
  nature: { 
    color: '#4CAF50', 
    icon: 'park',
    label: 'טבע'
  },
  winery: { 
    color: '#D81B60', 
    icon: 'wine_bar',
    label: 'יקבים'
  },
  culinary: { 
    color: '#FF9800', 
    icon: 'restaurant',
    label: 'קולינריה'
  },
  touristAttraction: { 
    color: '#2196F3', 
    icon: 'photo_camera',
    label: 'אטרקציות'
  },
  museum: { 
    color: '#9C27B0', 
    icon: 'museum',
    label: 'מוזיאונים'
  },
  restaurant: { 
    color: '#FF5722', 
    icon: 'restaurant_menu',
    label: 'מסעדות'
  },
  hotel: { 
    color: '#3F51B5', 
    icon: 'hotel',
    label: 'מלונות'
  },
  cafe: { 
    color: '#795548', 
    icon: 'coffee',
    label: 'בתי קפה'
  },
  hospital: { 
    color: '#F44336', 
    icon: 'local_hospital',
    label: 'בתי חולים'
  },
  pharmacy: { 
    color: '#2196F3', 
    icon: 'local_pharmacy',
    label: 'בתי מרקחת'
  },
  amusementPark: { 
    color: '#FFEB3B', 
    icon: 'attractions',
    label: 'פארקי שעשועים'
  },
  beach: { 
    color: '#00BCD4', 
    icon: 'beach_access',
    label: 'חופים'
  },
  historicalSite: { 
    color: '#8BC34A', 
    icon: 'account_balance',
    label: 'אתרים היסטוריים'
  },
  nationalPark: { 
    color: '#4CAF50', 
    icon: 'terrain',
    label: 'פארקים לאומיים'
  },
  localMarket: { 
    color: '#F57F17', 
    icon: 'shopping_cart',
    label: 'שווקים מקומיים'
  },
  festival: { 
    color: '#E91E63', 
    icon: 'celebration',
    label: 'פסטיבלים'
  },
  spa: { 
    color: '#9C27B0', 
    icon: 'spa',
    label: 'מרכזי ספא'
  },
};

/**
 * AttractionFilters - סינון אטרקציות
 * מאפשר למשתמש לסנן אטרקציות לפי קטגוריות
 */
const AttractionFilters = () => {
  const { activeFilters, handleButtonFilter } = useContext(TripContext);

  return (
    <Box mt={3} display="flex" flexWrap="wrap" justifyContent="center" gap={2} role="group" aria-label="סינון אטרקציות">
      <Button 
        variant={activeFilters.includes('all') ? 'contained' : 'outlined'} 
        onClick={() => handleButtonFilter('all')}
        sx={{ 
          background: activeFilters.includes('all') ? '#2196F3' : '#fff', 
          color: activeFilters.includes('all') ? '#fff' : '#2196F3', 
          borderRadius: '8px', 
          padding: '8px 16px', 
          '&:hover': { background: activeFilters.includes('all') ? '#1976D2' : '#f5f5f5' },
        }}
        aria-label="סנן הכל"
        startIcon={<i className="material-icons">filter_list</i>}
      >
        הכל
      </Button>
      
      {Object.entries(CATEGORY_ICONS).map(([key, value]) => (
        <Button 
          key={key}
          variant={activeFilters.includes(key) ? 'contained' : 'outlined'} 
          onClick={() => handleButtonFilter(key)}
          sx={{ 
            background: activeFilters.includes(key) ? value.color : '#fff', 
            color: activeFilters.includes(key) ? '#fff' : value.color, 
            borderRadius: '8px', 
            padding: '8px 16px', 
            '&:hover': { background: activeFilters.includes(key) ? value.color + 'CC' : '#f5f5f5' },
          }}
          aria-label={`סנן ${value.label}`}
          startIcon={<i className="material-icons">{value.icon}</i>}
        >
          {value.label}
        </Button>
      ))}
    </Box>
  );
};

export default AttractionFilters;