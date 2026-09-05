import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Paper, Typography, TextField, Button, List, ListItem, ListItemText,
  ListItemAvatar, Avatar, Rating, Chip, IconButton, Collapse, CircularProgress,
  Tabs, Tab, Stack
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  Hotel as HotelIcon,
  Museum as MuseumIcon,
  ShoppingCart as ShoppingIcon,
  Nightlife as NightlifeIcon,
  Attractions as AttractionsIcon,
  Nature as NatureIcon,
  BeachAccess as BeachIcon,
  Park as ParkIcon,
  LocalCafe as CafeIcon,
  WineBar as WineIcon,
  AccountBalance as HistoricIcon,
  Festival as FestivalIcon,
  LocalHospital as HospitalIcon,
  LocalPharmacy as PharmacyIcon,
  Spa as SpaIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Place as PlaceIcon
} from '@mui/icons-material';
import googlePlacesService, { PLACES_ERRORS } from '../../services/googlePlacesService';
import { PLACE_GROUPS } from '../../services/placeCategories';

// אייקון לכל קטגוריה. יושב כאן ולא ב-`placeCategories` משום ששם אין
// תלות ב-MUI, וקובץ נתונים שגורר ספריית רכיבים אינו נתון.
const CATEGORY_ICON = {
  nature: NatureIcon, beach: BeachIcon, nationalPark: ParkIcon, amusementPark: AttractionsIcon,
  restaurant: RestaurantIcon, cafe: CafeIcon, winery: WineIcon, nightlife: NightlifeIcon,
  touristAttraction: AttractionsIcon, museum: MuseumIcon, historicalSite: HistoricIcon,
  festival: FestivalIcon, localMarket: ShoppingIcon,
  hotel: HotelIcon, hospital: HospitalIcon, pharmacy: PharmacyIcon, spa: SpaIcon
};
const GROUP_ICON = { outdoors: NatureIcon, foodDrink: RestaurantIcon, culture: MuseumIcon, services: HospitalIcon };

const iconFor = (key, Map_ = CATEGORY_ICON) => {
  const Icon = Map_[key] || PlaceIcon;
  return <Icon />;
};

const AttractionsPanel = ({ center, onPlaceSelect }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [places, setPlaces] = useState([]);
  // `status` מפריד בין "טוען", "לא הצלחנו לבדוק" ו"אין כאן מקומות".
  // קודם שלושתם נראו זהים על המסך — "לא נמצאו תוצאות" — וכשל נקרא כתשובה.
  const [status, setStatus] = useState('loading');
  const [failure, setFailure] = useState(null);
  const [partial, setPartial] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPlace, setExpandedPlace] = useState(null);
  const isLoading = status === 'loading';
  const requestRef = useRef(0);

  const group = PLACE_GROUPS[activeTab];

  // אילו קטגוריות דלוקות בכל קבוצה. ברירת המחדל היא הכול — כיבוי הוא
  // פעולה שהמשתמש בוחר, ולא מצב שהוא מוצא בו את המסך.
  const [enabled, setEnabled] = useState(() =>
    Object.fromEntries(PLACE_GROUPS.map((g) => [g.key, g.categories.map((c) => c.key)]))
  );
  const activeKeys = enabled[group.key];
  // מפתח יציב לרשימת הקטגוריות. מערך חדש בכל רינדור היה מפעיל את
  // ה-`useEffect` שוב ושוב — לולאת חיפושים בתשלום.
  const activeKeysId = activeKeys.join(',');

  const toggleCategory = (key) => {
    setEnabled((prev) => {
      const list = prev[group.key];
      return {
        ...prev,
        [group.key]: list.includes(key) ? list.filter((k) => k !== key) : [...list, key]
      };
    });
  };

  /**
   * נתיב אחד לכל חיפוש — לפי קטגוריה או חופשי — כדי ששני המסכים לא
   * ידווחו על אותו כשל בשתי דרכים שונות.
   */
  const runSearch = async (fetcher) => {
    // תשובה של חיפוש שכבר אינו רלוונטי נזרקת.
    //
    // חיפוש קבוצה שולח עד חמש בקשות ולוקח שניות. בלי המונה הזה, החלפת
    // לשונית או יעד בזמן שהקודם באוויר הייתה מציגה את תוצאות רומא תחת
    // הכותרת "פריז" — שדה מלא בערך שגוי, שאף בדיקת נוכחות אינה תופסת.
    const ticket = ++requestRef.current;
    const stale = () => ticket !== requestRef.current;

    setStatus('loading');
    setFailure(null);
    setPartial(false);

    try {
      const { results, failed, total } = await fetcher();
      if (stale()) return;
      setPlaces(results);
      // כשל חלקי אינו כשל וגם אינו הצלחה. הצגת התוצאות שכן חזרו בלי
      // לומר שחלק לא נבדק הייתה מציגה רשימה חסרה כאילו היא מלאה.
      setPartial(failed > 0 && failed < total);
      setStatus(results.length ? 'ready' : 'empty');
    } catch (error) {
      if (stale()) return;
      // רשימה ריקה כאן הייתה אומרת למשתמש "אין כאן מקומות", וזו טענה
      // שלא נבדקה. הכשל נשמר בשמו, והמסך אומר שלא בדקנו.
      setPlaces([]);
      setFailure({ kind: error?.kind || PLACES_ERRORS.REQUEST_FAILED, detail: error?.detail || null });
      setStatus('error');
      console.error('חיפוש מקומות נכשל:', error);
    }
  };

  /**
   * קטגוריה אחת = בקשה אחת. הן נשלחות במקביל ומאוחדות לפי מזהה המקום,
   * משום שאותו מקום חוזר ביותר מקטגוריה אחת — מוזיאון שהוא גם אתר
   * היסטורי היה מופיע פעמיים.
   */
  const searchActiveCategories = () => {
    if (!center) return;
    const cats = group.categories.filter((c) => activeKeys.includes(c.key));
    if (!cats.length) {
      requestRef.current += 1; // מבטל תשובה של חיפוש שעדיין באוויר
      setPlaces([]);
      setStatus('empty');
      setFailure(null);
      return;
    }

    return runSearch(async () => {
      const settled = await Promise.allSettled(
        cats.map((c) => googlePlacesService.searchNearbyPlaces(center, 5000, c.types[0]))
      );

      const byId = new Map();
      let failed = 0;
      settled.forEach((res, i) => {
        if (res.status === 'rejected') { failed += 1; return; }
        res.value.forEach((place) => {
          if (!byId.has(place.id)) byId.set(place.id, { ...place, categoryKey: cats[i].key });
        });
      });

      // כל הבקשות נפלו — זה כשל מלא, לא רשימה ריקה
      if (failed === cats.length) {
        const first = settled.find((r) => r.status === 'rejected');
        throw first.reason;
      }

      return { results: [...byId.values()], failed, total: cats.length };
    });
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    return runSearch(async () => {
      const results = await googlePlacesService.textSearch(searchQuery, center);
      return { results, failed: 0, total: 1 };
    });
  };

  useEffect(() => {
    if (center) searchActiveCategories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, center, activeKeysId]);

  const retry = () => {
    if (searchQuery.trim()) handleSearch();
    else searchActiveCategories();
  };

  const failureMessage = () => {
    if (!failure) return null;
    if (failure.kind === PLACES_ERRORS.MAPS_UNAVAILABLE) return t('attractionsPanel.errorMaps');
    if (failure.kind === PLACES_ERRORS.TIMEOUT) return t('attractionsPanel.errorTimeout');
    return t('attractionsPanel.errorFailed', { status: failure.detail || 'ERROR' });
  };

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
      setPlaces((prev) => prev.map((p) => (p.id === placeId ? { ...p, details } : p)));
    }
  };

  const getPriceLevelText = (level) => {
    if (!level) return t('attractionsPanel.priceNotAvailable');
    return '₪'.repeat(level);
  };

  const emptyMessage = useMemo(
    () => (activeKeys.length ? t('attractionsPanel.noPlaces') : t('attractionsPanel.noCategorySelected')),
    [activeKeys.length, t]
  );

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <PlaceIcon /> {t('attractionsPanel.title')}
        </Typography>
      </Box>

      <Box sx={{ p: 2, pb: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={t('attractionsPanel.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            endAdornment: (
              <IconButton size="small" onClick={handleSearch}>
                <SearchIcon />
              </IconButton>
            )
          }}
        />
      </Box>

      {/* ארבע קבוצות — החלוקה שהמשתמש עצמו עשה ל-17 הקטגוריות */}
      <Tabs
        value={activeTab}
        onChange={(e, v) => setActiveTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        {PLACE_GROUPS.map((g) => (
          <Tab key={g.key} icon={iconFor(g.key, GROUP_ICON)} label={t(`attractionsPanel.group.${g.key}`)} sx={{ minWidth: 88 }} />
        ))}
      </Tabs>

      {/* הקטגוריות עצמן — אלה שלא עשו דבר מ-25.2.2026 */}
      <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ px: 2, py: 1.5 }}>
        {group.categories.map((c) => {
          const on = activeKeys.includes(c.key);
          return (
            <Chip
              key={c.key}
              label={t(`attractionsPanel.cat.${c.key}`)}
              size="small"
              clickable
              onClick={() => toggleCategory(c.key)}
              variant={on ? 'filled' : 'outlined'}
              sx={{
                bgcolor: on ? c.color : 'transparent',
                color: on ? '#fff' : c.color,
                borderColor: c.color,
                '&:hover': { bgcolor: on ? c.color : `${c.color}22` }
              }}
            />
          );
        })}
      </Stack>

      <Box sx={{ flex: 1, overflowY: 'auto', px: 2, pb: 2 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, p: 3 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">{t('attractionsPanel.loading')}</Typography>
          </Box>
        ) : status === 'error' ? (
          /* כשל אינו "אין כאן". המסך אומר שלא בדקנו, ומציע לבדוק שוב. */
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="error" sx={{ mb: 1.5 }}>{failureMessage()}</Typography>
            <Button variant="outlined" size="small" onClick={retry}>{t('attractionsPanel.retry')}</Button>
          </Box>
        ) : places.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
            {emptyMessage}
          </Typography>
        ) : (
          <>
            {partial && (
              <Typography variant="caption" color="warning.main" display="block" align="center" sx={{ mb: 1 }}>
                {t('attractionsPanel.partial')}
              </Typography>
            )}
            <List>
              {places.map((place) => (
                <Paper key={place.id} sx={{ mb: 2, overflow: 'hidden' }}>
                  <ListItem
                    button
                    onClick={() => {
                      onPlaceSelect && onPlaceSelect(place);
                      handleExpandPlace(place.id);
                    }}
                    sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <ListItemAvatar>
                      {/* ── בלי תמונה, ובכוונה ──
                          כל אווטאר כאן היה בקשת Places Photo מחויבת: ארבע
                          קטגוריות × ~20 שורות = כ-80 בקשות בכל פתיחה, מחדש
                          בכל רענון ולכל משתמש. נמדד ₪45 בארבעה ימים, ותחזית
                          ₪254 לחודש — כל החיוב של הפרויקט הגיע מכאן.
                          אייקון הקטגוריה כבר היה כאן כגיבוי, והוא מספיק. */}
                      <Avatar alt={place.name} sx={{ width: 56, height: 56 }}>
                        {iconFor(place.categoryKey)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      /* בלי זה MUI מקנן <div> בתוך <p> וזורק validateDOMNesting */
                      secondaryTypographyProps={{ component: 'div' }}
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{place.name}</Typography>
                          <IconButton size="small">
                            {expandedPlace === place.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Box>
                      }
                      secondary={
                        <Box>
                          {place.categoryKey && (
                            <Chip
                              label={t(`attractionsPanel.cat.${place.categoryKey}`)}
                              size="small"
                              sx={{ mb: 0.5, height: 20, fontSize: '0.7rem' }}
                            />
                          )}
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
                            <Chip label={getPriceLevelText(place.priceLevel)} size="small" color="success" sx={{ mt: 0.5 }} />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>

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
                        <Button size="small" href={place.details.website} target="_blank" sx={{ mt: 1 }}>
                          🌐 {t('attractionsPanel.website')}
                        </Button>
                      )}
                    </Box>
                  </Collapse>
                </Paper>
              ))}
            </List>
          </>
        )}
      </Box>
    </Paper>
  );
};

export default AttractionsPanel;
