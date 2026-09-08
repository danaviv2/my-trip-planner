import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, Chip, Button } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const TYPE_COLORS = {
  attraction: '#3F51B5',
  museum:     '#3F51B5',
  food:       '#FF5722',
  transport:  '#78909C',
  rest:       '#795548',
  shopping:   '#E91E63',
  nightlife:  '#673AB7',
  nature:     '#43A047',
  beach:      '#00ACC1',
};

const TYPE_LABELS = {
  attraction: 'אטרקציה',
  museum:     'מוזיאון',
  food:       'אוכל',
  transport:  'תחבורה',
  rest:       'מנוחה',
  shopping:   'קניות',
  nightlife:  'בילוי לילי',
  nature:     'טבע',
  beach:      'חוף',
};

/**
 * נרמול סוג הפעילות לאוצר המילים של המפה.
 *
 * ── למה לא פשוט לשנות את המפתח ──
 * ב-08.09.2026 נמדדה במקרא התווית `transportation` באנגלית גולמית,
 * בתוך ממשק עברי. הפיתוי היה לשנות ב-`TYPE_LABELS` את `transport`
 * ל-`transportation`. זה היה **שובר את מה שעובד**: `transport` הוא
 * אוצר המילים של האפליקציה עצמה — `EditAttractionModal`,
 * `ActivityEditorDialog` ו-`aiItineraryService` כולם מייצרים אותו,
 * ואף אחד מהם אינו מייצר `transportation`.
 *
 * המקור הוא Gemini: `activity.type` מגיע ממנו כפי שהוא, והפרומפט
 * מדגים `"type":"attraction"` בלי להגביל את אוצר המילים. כלומר
 * `transportation` הוא וריאנט אחד מני רבים, ורשימת המפתחות לעולם
 * לא תדביק מודל חופשי.
 *
 * לכן נרמול ולא שינוי שם: הנרדפות הידועות ממופות לסוג הקנוני, ושני
 * הצדדים — הצבע והתווית — נגזרים מאותה פונקציה, כדי ששלט לא יקבל
 * צבע אחד ותווית אחרת.
 *
 * סוג שאינו מוכר מוצג כפי שהוא ובכוונה: תווית גנרית הייתה מאחדת שני
 * סוגים שונים לשורה אחת במקרא, ומסתירה שיש כאן ערך שלא זוהה.
 */
const TYPE_ALIASES = {
  transportation: 'transport', transit: 'transport', travel: 'transport',
  restaurant: 'food', meal: 'food', dining: 'food', cafe: 'food',
  sightseeing: 'attraction', landmark: 'attraction', monument: 'attraction',
  gallery: 'museum',
  break: 'rest', hotel: 'rest', accommodation: 'rest',
  bar: 'nightlife', club: 'nightlife',
  park: 'nature', hiking: 'nature', outdoor: 'nature',
  market: 'shopping', mall: 'shopping',
};

const normalizeType = (type) => {
  const k = String(type || '').trim().toLowerCase();
  return TYPE_ALIASES[k] || k;
};

const createNumberedPin = (number, type) => {
  const color = TYPE_COLORS[normalizeType(type)] || '#667eea';
  return L.divIcon({
    className: '',
    html: `
      <div style="
        position: relative;
        width: 34px;
        height: 40px;
      ">
        <div style="
          background: ${color};
          width: 34px;
          height: 34px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 3px 12px rgba(0,0,0,0.4);
          position: absolute;
          top: 0; left: 0;
        "></div>
        <span style="
          position: absolute;
          top: 6px;
          left: 0;
          width: 34px;
          text-align: center;
          color: white;
          font-weight: 800;
          font-size: 13px;
          font-family: Arial, sans-serif;
          line-height: 1;
          pointer-events: none;
        ">${number}</span>
      </div>`,
    iconSize: [34, 40],
    iconAnchor: [17, 40],
    popupAnchor: [0, -42],
  });
};

// כפתורי הזמנה לפי סוג פעילות
const getBookingButtons = (activity, destination) => {
  const name = encodeURIComponent(activity.name);
  const dest = encodeURIComponent(destination || '');
  const buttons = [];

  // Google Maps — תמיד
  buttons.push({
    label: '📍 פתח במפות',
    url: `https://maps.google.com/maps?q=${name}+${dest}`,
    color: '#4285F4',
  });

  if (activity.type === 'food') {
    // לא OpenTable. שתי בעיות נמצאו בבדיקה מול האתר עצמו:
    // היעד לא נשלח כלל (metroId=0 אינו מיקום), ולכן החיפוש הוסט למדינת
    // הגולש — "You searched for les cocottes in Israel"; וגם כשהמסעדה
    // נמצאה, התשובה הייתה שהיא אינה ברשת ההזמנות שלהם, שכמעט אינה פעילה
    // בצרפת ובאיטליה.
    //
    // חיפוש מחזיר את כרטיס המקום: טלפון, שעות, האתר הרשמי וקישור ההזמנה
    // בפלטפורמה שבה המסעדה באמת נמצאת — TheFork באירופה. זה עובד בכל
    // יעד, ואינו מבטיח רשת מסוימת שאולי אינה מכסה את המקום.
    buttons.push({
      label: '🍽️ הזמנת שולחן',
      url: `https://www.google.com/search?q=${name}+${dest}+reservation`,
      color: '#DA3743',
    });
    buttons.push({
      label: '⭐ ביקורות',
      url: `https://www.tripadvisor.com/Search?q=${name}+${dest}`,
      color: '#00AA6C',
    });
  } else if (activity.type === 'attraction' || activity.type === 'museum') {
    buttons.push({
      label: '🎫 הזמן כרטיסים',
      url: `https://www.getyourguide.com/s/?q=${name}+${dest}`,
      color: '#FF8000',
    });
    buttons.push({
      label: '🗺️ סיורים',
      url: `https://www.viator.com/search?q=${name}+${dest}`,
      color: '#182F5D',
    });
  } else if (activity.type === 'nightlife') {
    buttons.push({
      label: '🎟️ כרטיסים',
      url: `https://www.eventbrite.com/d/${dest}/${name}/`,
      color: '#F05537',
    });
  } else if (activity.type === 'shopping') {
    buttons.push({
      label: '🛍️ חפש שעות',
      url: `https://maps.google.com/maps?q=${name}+${dest}+opening+hours`,
      color: '#E91E63',
    });
  } else {
    buttons.push({
      label: '🔍 מידע נוסף',
      url: `https://www.google.com/search?q=${name}+${dest}`,
      color: '#667eea',
    });
  }

  return buttons;
};

/**
 * ממרכז את המפה על הנקודות — אבל רק כשיש לה גודל.
 *
 * ── מה שנמדד, אחרי ששתי השערות נפלו ──
 * מרגע שהמפה יושבת בפריסת flex לצד פאנל, `fitBounds` רץ לפני
 * שהדפדפן נתן למכולה רוחב. דיאגנוסטיקה ב-07.09.2026 החזירה:
 *
 *   { dayIndex: 'all', n: 6, size: [0, 400], zBefore: 13, zAfter: 18 }
 *
 * **רוחב אפס.** Leaflet מתאים גבולות למסך בגודל אפס ומחזיר את הזום
 * המרבי, ולכן מבט על צרפת כולה נפתח על שדה ריק בזום 18.
 *
 * `invalidateSize` בתוך ה-effect לא הציל: באותו רגע האלמנט באמת היה
 * ברוחב 0, ולא היה מה למדוד מחדש. הניחוש "מתי הפריסה מוכנה" הוא
 * בדיוק מה שנכשל כאן פעמיים — לכן `ResizeObserver` מדווח מתי היא
 * מוכנה במקום שננחש.
 *
 * ההתאמה האוטומטית מהצופה קורית **רק** במעבר מרוחב אפס לרוחב אמיתי.
 * אחריה שינוי גודל מרענן את המפה בלבד: הזזה או זום של המשתמש הם
 * כוונה, ואיפוסם בכל שינוי חלון הוא באג בפני עצמו.
 */
/**
 * ממרכז את המפה על הנקודות — פעם אחת לכל יום, ברגע שיש לה גודל.
 *
 * ── שתי גרסאות נכשלו כאן, ושתיהן על תזמון ──
 * מרגע שהמפה יושבת בפריסת flex לצד פאנל, היא נוצרת לפני שהדפדפן
 * נותן למכולה רוחב. דיאגנוסטיקה ב-07.09.2026 החזירה:
 *
 *   { dayIndex: 'all', n: 6, size: [0, 400], zBefore: 13, zAfter: 18 }
 *
 * **רוחב אפס.** Leaflet מתאים גבולות למסך בגודל אפס ומחזיר את הזום
 * המרבי — מבט על צרפת כולה נפתח על שדה ריק בזום 18.
 *
 * `invalidateSize` בתוך ה-effect לא הציל: באותו רגע האלמנט באמת היה
 * ברוחב 0. ואז `ResizeObserver` שבודק "האם הרוחב היה אפס כשנרשמתי"
 * נכשל גם הוא — כשהרוחב כבר הספיק להתמלא בין שני ה-effects, התנאי
 * לא התקיים לעולם והמפה נשארה בזום ההתחלתי. הבדיקה החזירה 6/6 בריצה
 * אחת ו-0/6 בריצה הבאה, על אותו קוד.
 *
 * לכן התנאי כאן אינו תזמון אלא **עובדה**: "האם כבר התאמתי ליום
 * הזה". מי שמגיע ראשון עם גודל אמיתי — ה-effect או הצופה — מבצע,
 * והשני מוצא שאין מה לעשות. אין מרוץ כי אין תלות בסדר.
 */
const FitBounds = ({ positions, dayIndex }) => {
  const map = useMap();
  const posRef = useRef(positions);
  const dayRef = useRef(dayIndex);
  const fittedFor = useRef(NOT_FITTED);
  posRef.current = positions;
  dayRef.current = dayIndex;

  const tryFit = useCallback(() => {
    const key = dayRef.current;
    if (fittedFor.current === key) return;
    const p = posRef.current;
    if (!p || p.length === 0) return;
    const size = map.getSize();
    if (size.x === 0 || size.y === 0) return;
    if (p.length === 1) map.setView(p[0], 15);
    else map.fitBounds(L.latLngBounds(p), { padding: [60, 60] });
    fittedFor.current = key;
  }, [map]);

  useEffect(() => { tryFit(); }, [dayIndex, positions, tryFit]);

  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
      // התאמה מחדש רק ליום שטרם הותאם. אחרי שהותאם, הזזה וזום של
      // המשתמש הם כוונה, ואיפוסם בכל שינוי חלון הוא באג בפני עצמו.
      tryFit();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [map, tryFit]);

  return null;
};

const TILES = {
  map: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics',
  },
};

/** מרכוז המפה על נקודה שנבחרה מהפאנל. */
const FlyTo = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, Math.max(map.getZoom(), 15), { duration: 0.8 });
  }, [target]); // eslint-disable-line
  return null;
};

const isValidCoord = (a) => {
  const lat = Number(a.lat);
  const lng = Number(a.lng);
  return (
    a.lat != null && a.lng != null &&
    a.lat !== '' && a.lng !== '' &&
    !isNaN(lat) && !isNaN(lng) &&
    Math.abs(lat) <= 90 && Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)  // 0,0 = אוקיינוס אטלנטי — לא תקין
  );
};

// צבע לכל יום במבט המלא. הצבע לפי **יום** ולא לפי סוג הפעילות: במבט
// על נסיעה שלמה השאלה היא "מתי אני כאן", לא "מה זה". סוג הפעילות
// ממשיך לצבוע את הסיכות במבט היומי, שם הוא כן השאלה.
// ערך התחלתי שלא יכול להיות שווה לשום `dayIndex` אמיתי
const NOT_FITTED = Symbol('not-fitted');

const DAY_COLORS = [
  '#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA',
  '#00ACC1', '#F4511E', '#3949AB', '#7CB342', '#D81B60',
  '#00897B', '#5E35B1',
];
const dayColor = (i) => DAY_COLORS[i % DAY_COLORS.length];

/**
 * הפעילויות של יום שיש להן מקום על המפה.
 *
 * פונקציה אחת לשני המצבים — היומי והמלא. שני מקומות שמחשבים את אותה
 * עובדה סוטים זה מזה בשינוי הבא, וזה דפוס שהפרויקט כבר שילם עליו.
 *
 * פעילות בלי קואורדינטות מקבלת את ממוצע היום ולא נעלמת: היא באמת
 * קרתה, והשמטתה משאירה חור בקו המסלול.
 */
const dayMarkers = (day) => {
  const raw = day?.activities || [];
  const valid = raw.filter(isValidCoord);
  if (valid.length === 0) return [];
  const avgLat = valid.reduce((s, a) => s + Number(a.lat), 0) / valid.length;
  const avgLng = valid.reduce((s, a) => s + Number(a.lng), 0) / valid.length;
  return raw
    .map((a) => (isValidCoord(a) ? a : { ...a, lat: avgLat, lng: avgLng }))
    .filter(isValidCoord);
};

const centroid = (ms) => [
  ms.reduce((s, a) => s + Number(a.lat), 0) / ms.length,
  ms.reduce((s, a) => s + Number(a.lng), 0) / ms.length,
];

/** סיכת יום במבט המלא — מספר היום, בצבע היום. */
const createDayPin = (dayNumber, color) => L.divIcon({
  className: '',
  html: `<div style="
      width:30px;height:30px;border-radius:50%;
      background:${color};border:3px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,.4);
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-weight:800;font-size:13px;font-family:system-ui,sans-serif;
    ">${dayNumber}</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

/**
 * @param {number|null} selectedDayIndex  אינדקס היום, או `null` למבט על
 *   כל הנסיעה. המבט המלא נבנה כי נסיעה אינה בהכרח בעיר אחת: מסלול
 *   שיוצא לבורדו הוא מסע בין נקודות, ובמבט יומי בלבד הקשר ביניהן
 *   פשוט לא קיים על המסך.
 * @param {Function} onSelectDay  לחיצה על יום במבט המלא קופצת אליו.
 */
const TripMap = ({ tripPlan, selectedDayIndex, onSelectDay }) => {
  const whole = selectedDayIndex == null;
  const allDays = tripPlan?.dailyItinerary || [];

  // ── המבט המלא: יום = נקודה אחת, לא חמש ──
  // חמישים סיכות פרושות על מסלול הן ענן ולא מסלול. כל יום מקבל סיכה
  // אחת במרכז הכובד שלו, והפעילויות עצמן מצוירות כנקודות קטנות — כך
  // רואים גם את הרצף בין הימים וגם את הצפיפות לאורכו.
  const groups = whole
    ? allDays
        .map((d, i) => ({ i, day: d, ms: dayMarkers(d) }))
        .filter((g) => g.ms.length > 0)
    : [];

  const day = whole ? null : allDays[selectedDayIndex];
  const markers = whole ? [] : dayMarkers(day);

  const positions = whole
    ? groups.map((g) => centroid(g.ms))
    : markers.map((a) => [Number(a.lat), Number(a.lng)]);

  const [layer, setLayer] = useState('map');
  const [focus, setFocus] = useState(null);

  // ── ההפניות מתאפסות בפירוק, לא ב-effect ──
  // הניסיון הראשון ניקה אותן ב-`useEffect` על היום הנבחר, וזה **הרס
  // את ההפניות החדשות**: React קושר ref בשלב ה-commit, לפני שה-effect
  // רץ. כלומר הסיכות של היום החדש נרשמו ואז נמחקו, והלחיצה בפאנל
  // פנתה לכלום. הפתרון הוא שה-callback עצמו יכתוב גם `null` בפירוק —
  // אותה נקודת אמת, בלי סנכרון ידני שאפשר לטעות בסדר שלו.
  const pinRefs = useRef({});
  useEffect(() => { setFocus(null); }, [selectedDayIndex]);

  const center = positions.length > 0
    ? [
        positions.reduce((s, p) => s + p[0], 0) / positions.length,
        positions.reduce((s, p) => s + p[1], 0) / positions.length,
      ]
    : [32.0853, 34.7818];

  const panelRows = whole
    ? groups.map((g) => ({ key: `d${g.i}`, color: dayColor(g.i), badge: g.i + 1,
        title: g.day.title, sub: `${g.ms.length} עצירות`, onClick: () => onSelectDay && onSelectDay(g.i) }))
    : markers.map((a, i) => ({ key: `a${i}`, color: TYPE_COLORS[a.type] || '#667eea', badge: i + 1,
        title: `${a.emoji || ''} ${a.name}`.trim(), sub: [a.time, a.duration].filter(Boolean).join(' · '),
        onClick: () => {
          setFocus([Number(a.lat), Number(a.lng)]);
          const m = pinRefs.current[i];
          if (m) setTimeout(() => m.openPopup(), 850);
        } }));

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, height: { xs: 'auto', md: '520px' } }}>
    <Box sx={{ position: 'relative', flex: { md: 2 }, minWidth: 0, height: { xs: '400px', md: '100%' } }}>

      {/* ── מפה או לוויין ──
          הרעיון הגיע מ-`/trip-map`, מסך מוקאפ שנמחק: שם "לוויין" היה
          כפתור שלא עשה דבר מעל תצלום סטוק. כאן זו שכבת אריחים אמיתית. */}
      <Box sx={{
        position: 'absolute', top: 10, left: 10, zIndex: 1000,
        bgcolor: 'rgba(255,255,255,0.95)', borderRadius: 2, boxShadow: 2,
        display: 'flex', overflow: 'hidden',
      }}>
        {[['map', '🗺️ מפה'], ['satellite', '🛰️ לוויין']].map(([k, label]) => (
          <Box
            key={k}
            component="button"
            onClick={() => setLayer(k)}
            sx={{
              border: 0, cursor: 'pointer', px: 1.2, py: 0.6,
              fontSize: '0.7rem', fontWeight: 700, fontFamily: 'inherit',
              bgcolor: layer === k ? '#667eea' : 'transparent',
              color: layer === k ? '#fff' : '#555',
            }}
          >
            {label}
          </Box>
        ))}
      </Box>

      {/* כותרת המבט המלא */}
      {whole && groups.length > 0 && (
        <Box sx={{
          position: 'absolute', top: 10, right: 10, zIndex: 1000,
          // אותו תיקון כמו במקרא שמתחת: רקע קשיח בהיר מתחת ל-
          // `text.secondary`. נמדד 1.91 במצב כהה.
          bgcolor: (t) => (t.palette.mode === 'dark'
            ? 'rgba(30,30,30,0.95)'
            : 'rgba(255,255,255,0.95)'),
          px: 2, py: 1,
          borderRadius: 3, boxShadow: 3, maxWidth: '60%',
        }}>
          <Typography variant="caption" fontWeight={800} display="block" sx={{ color: (t) => (t.palette.mode === 'dark' ? '#8fa4f0' : '#667eea') }}>
            כל הנסיעה
          </Typography>
          {tripPlan?.destination && (
            <Typography variant="caption" fontWeight={600} display="block" sx={{ color: 'text.primary', lineHeight: 1.3 }}>
              {tripPlan.destination}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            {groups.length} ימים · {groups.reduce((n, g) => n + g.ms.length, 0)} עצירות
          </Typography>
        </Box>
      )}

      {/* כותרת יום */}
      {day && (
        <Box sx={{
          position: 'absolute', top: 10, right: 10, zIndex: 1000,
          // אותו תיקון כמו במקרא שמתחת: רקע קשיח בהיר מתחת ל-
          // `text.secondary`. נמדד 1.91 במצב כהה.
          bgcolor: (t) => (t.palette.mode === 'dark'
            ? 'rgba(30,30,30,0.95)'
            : 'rgba(255,255,255,0.95)'),
          px: 2, py: 1,
          borderRadius: 3, boxShadow: 3, maxWidth: '60%',
        }}>
          <Typography variant="caption" fontWeight={800} display="block" sx={{ color: (t) => (t.palette.mode === 'dark' ? '#8fa4f0' : '#667eea') }}>
            יום {selectedDayIndex + 1}
          </Typography>
          <Typography variant="caption" fontWeight={600} display="block" sx={{ color: 'text.primary', lineHeight: 1.3 }}>
            {day.title}
          </Typography>
          {markers.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              {markers.length} עצירות
            </Typography>
          )}
        </Box>
      )}

      {/* אגדת סוגים — רק במבט היומי. במבט המלא הצבע מסמן יום, ואגדה
          של שנים־עשר ימים תופסת יותר מסך מהמפה עצמה; מספר היום יושב
          על הסיכה וזו האגדה. */}
      {!whole && markers.length > 0 && (
        <Box sx={{
          position: 'absolute', bottom: 24, left: 8, zIndex: 1000,
          // ── רקע המקרא הולך אחרי הערכה ──
          // היה `rgba(255,255,255,0.95)` קשיח, בזמן שה-`Typography`
          // שבתוכו אינו מגדיר `color` ולכן יורש `text.primary`.
          // נמדד 08.09.2026 על האתר החי ב-/trip-planner: ארבע תוויות
          // ביחס 1.0 — `אטרקציה`, `אוכל`, `קניות` ו-`transportation`.
          // (האחרונה באנגלית משום ש-`TYPE_LABELS` מכיל `transport`
          //  ולא `transportation`, ולכן נופלת ל-`|| type`. באג נפרד.)
          bgcolor: (t) => (t.palette.mode === 'dark'
            ? 'rgba(30,30,30,0.95)'
            : 'rgba(255,255,255,0.95)'),
          p: 1, borderRadius: 2, boxShadow: 2,
          display: 'flex', flexDirection: 'column', gap: 0.4,
        }}>
          {[...new Set(markers.map(a => normalizeType(a.type)))].map(type => (
            <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Box sx={{
                width: 12, height: 12,
                borderRadius: '50% 50% 50% 0',
                transform: 'rotate(-45deg)',
                bgcolor: TYPE_COLORS[normalizeType(type)] || '#667eea',
                border: (t) => `2px solid ${t.palette.background.paper}`,
                flexShrink: 0,
              }} />
              <Typography variant="caption">{TYPE_LABELS[normalizeType(type)] || type}</Typography>
            </Box>
          ))}
        </Box>
      )}

      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}

      >
        <TileLayer key={layer} attribution={TILES[layer].attribution} url={TILES[layer].url} />

        <FlyTo target={focus} />
        <FitBounds positions={positions} dayIndex={whole ? 'all' : selectedDayIndex} />

        {/* קו מסלול.
            במבט היומי — בין הפעילויות. במבט המלא — בין הימים, וכל קטע
            נצבע בצבע היום שאליו הוא מוביל, כך שכיוון המסע נקרא מהצבע
            ולא רק מהמספרים. */}
        {!whole && positions.length >= 2 && (
          <Polyline positions={positions} color="#667eea" weight={3} opacity={0.7} dashArray="8, 6" />
        )}
        {whole && positions.slice(0, -1).map((from, i) => (
          <Polyline
            key={`leg-${i}`}
            positions={[from, positions[i + 1]]}
            color={dayColor(groups[i + 1].i)}
            weight={4}
            opacity={0.75}
          />
        ))}

        {/* המבט המלא: נקודה קטנה לכל פעילות, וסיכה אחת לכל יום */}
        {whole && groups.map((g) => (
          <React.Fragment key={`day-${g.i}`}>
            {g.ms.map((a, k) => (
              <CircleMarker
                key={`dot-${g.i}-${k}`}
                center={[Number(a.lat), Number(a.lng)]}
                radius={4}
                pathOptions={{ color: '#fff', weight: 1.5, fillColor: dayColor(g.i), fillOpacity: 0.9 }}
              >
                <Popup>
                  <Typography variant="caption" fontWeight={700} display="block">
                    {a.emoji} {a.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    יום {g.i + 1}{a.time ? ` · ${a.time}` : ''}
                  </Typography>
                </Popup>
              </CircleMarker>
            ))}
            <Marker position={centroid(g.ms)} icon={createDayPin(g.i + 1, dayColor(g.i))}>
              <Popup minWidth={190}>
                <Typography variant="caption" fontWeight={800} display="block" sx={{ color: dayColor(g.i) }}>
                  יום {g.i + 1}
                </Typography>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.3 }}>
                  {g.day.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.8 }}>
                  {g.ms.length} עצירות
                </Typography>
                {onSelectDay && (
                  <Button
                    fullWidth size="small" variant="contained"
                    onClick={() => onSelectDay(g.i)}
                    sx={{ fontSize: '0.7rem', py: 0.3, background: dayColor(g.i),
                      '&:hover': { background: dayColor(g.i), filter: 'brightness(0.9)' } }}
                  >
                    פתח את יום {g.i + 1}
                  </Button>
                )}
              </Popup>
            </Marker>
          </React.Fragment>
        ))}

        {/* סיכות ממוספרות — המבט היומי */}
        {!whole && markers.map((activity, idx) => {
          const prevActivity = idx > 0 ? markers[idx - 1] : null;
          const navOrigin = prevActivity ? encodeURIComponent(prevActivity.address || prevActivity.name) : null;
          const navDest = encodeURIComponent(activity.address || activity.name);
          return (
          <Marker
            key={idx}
            ref={(m) => { pinRefs.current[idx] = m; }}
            position={[Number(activity.lat), Number(activity.lng)]}
            icon={createNumberedPin(idx + 1, activity.type)}
          >
            <Popup maxWidth={270} minWidth={230}>
              <Box>
                {/* כותרת */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  <Typography variant="caption" sx={{
                    bgcolor: TYPE_COLORS[activity.type] || '#667eea',
                    color: 'white', px: 0.8, py: 0.2, borderRadius: 1,
                    fontWeight: 700, fontSize: '0.65rem',
                  }}>
                    {idx + 1}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{activity.time}</Typography>
                </Box>

                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.3 }}>
                  {activity.emoji} {activity.name}
                </Typography>

                <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>
                  {activity.description}
                </Typography>

                {/* משך ומחיר */}
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 0.5 }}>
                  {activity.duration && (
                    <Chip label={`⏱ ${activity.duration}`} size="small" sx={{ fontSize: '0.6rem', height: 18 }} />
                  )}
                  {activity.price && (
                    <Chip label={activity.price} size="small" sx={{ fontSize: '0.6rem', height: 18 }} />
                  )}
                </Box>

                {/* טיפ */}
                {activity.tips && (
                  <Typography variant="caption" display="block" sx={{
                    bgcolor: '#fff8e1', p: 0.5, borderRadius: 1,
                    borderLeft: '3px solid #FFC107', color: '#555', mb: 1,
                  }}>
                    💡 {activity.tips}
                  </Typography>
                )}

                {/* האתר הרשמי.
                    כתובת שהמודל מחזיר אינה מאומתת: השדה website אינו קיים
                    כלל בסכימת המסלול, ולכן כל ערך שהגיע בו הומצא — כתובת
                    סבירה למראה שמובילה לדף שאינו קיים. חיפוש מחזיר את
                    האתר האמיתי (lescocottes.paris, ולא ניחוש), ולכן
                    הכפתור מחפש במקום לפתוח כתובת שלא נבדקה. */}
                {activity.name && (
                  <Button
                    fullWidth size="small" variant="outlined"
                    endIcon={<OpenInNewIcon sx={{ fontSize: '0.75rem' }} />}
                    onClick={() =>
                      window.open(
                        `https://www.google.com/search?q=${encodeURIComponent(activity.name)}+${encodeURIComponent(tripPlan?.destination || '')}+official+site`,
                        '_blank',
                        'noopener,noreferrer'
                      )
                    }
                    sx={{ mb: 0.5, fontSize: '0.7rem', py: 0.3, borderColor: '#333', color: '#333' }}
                  >
                    🌐 האתר הרשמי
                  </Button>
                )}

                {/* כפתורי ניווט מהנקודה הקודמת */}
                {prevActivity && navOrigin && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.4, fontWeight: 600 }}>
                      🧭 נווט מ-{prevActivity.name}:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {[
                        { label: '🚶', title: 'הליכה',   mode: 'w', color: '#43A047' },
                        { label: '🚌', title: 'תחבורה',  mode: 'r', color: '#1976D2' },
                        { label: '🚗', title: 'רכב',     mode: 'd', color: '#E65100' },
                      ].map(({ label, title, mode, color }) => (
                        <Button
                          key={mode}
                          size="small" variant="outlined" fullWidth
                          onClick={() => window.open(
                            `https://maps.google.com/maps?saddr=${navOrigin}&daddr=${navDest}&dirflg=${mode}`,
                            '_blank', 'noopener,noreferrer'
                          )}
                          sx={{ fontSize: '0.65rem', py: 0.3, borderColor: color, color, fontWeight: 700,
                            '&:hover': { bgcolor: `${color}11`, borderColor: color } }}
                        >
                          {label} {title}
                        </Button>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* כפתורי הזמנה */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {getBookingButtons(activity, tripPlan?.destination || '').map((btn, i) => (
                    <Button
                      key={i}
                      fullWidth size="small" variant="contained"
                      endIcon={<OpenInNewIcon sx={{ fontSize: '0.75rem' }} />}
                      onClick={() => window.open(btn.url, '_blank', 'noopener,noreferrer')}
                      sx={{
                        fontSize: '0.7rem', py: 0.4,
                        background: btn.color,
                        '&:hover': { background: btn.color, filter: 'brightness(0.9)' },
                      }}
                    >
                      {btn.label}
                    </Button>
                  ))}
                </Box>
              </Box>
            </Popup>
          </Marker>
          );
        })}
      </MapContainer>
    </Box>

    {/* ── פאנל העצירות ──
        הרעיון השני שנלקח מ-`/trip-map`. במבט המלא הוא מונה ימים
        ולחיצה פותחת יום; במבט היומי הוא מונה עצירות ולחיצה מרכזת
        עליהן ופותחת את הכרטיס. הרשימה נגזרת מאותם `groups`/`markers`
        שמציירים את המפה — לא מחישוב מקביל שיסטה מהם. */}
    {panelRows.length > 0 && (
      <Box sx={{
        flex: { md: 1 }, minWidth: { md: 250 }, maxWidth: { md: 320 },
        height: { xs: 240, md: '100%' }, overflowY: 'auto',
        borderInlineStart: { md: '1px solid' },
        borderBlockStart: { xs: '1px solid', md: 'none' },
        borderColor: 'divider',
        // ── הגוון הכחלחל נשמר, בשתי הערכות ──
        // `#fafbff` היה קשיח, בזמן שכותרת כל שורה אינה מגדירה `color`
        // (יורשת `text.primary`) והכותרת המשנית היא `text.secondary`.
        // במצב כהה נמדדו כאן 12 כשלים: 6 ביחס 1.0 — לבן על לבן ממש —
        // ו-6 ביחס 1.84. הפאנל הוא כרום ולא אי-ניגוד מכוון, ולכן הוא
        // הולך אחרי הערכה.
        bgcolor: (t) => (t.palette.mode === 'dark' ? '#191b22' : '#fafbff'),
      }}>
        {panelRows.map((r) => (
          <Box
            key={r.key}
            onClick={r.onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && r.onClick()}
            sx={{
              display: 'flex', alignItems: 'flex-start', gap: 1.2,
              px: 1.5, py: 1.1, cursor: 'pointer',
              borderBottom: '1px solid',
              borderColor: 'divider',
              transition: 'background .15s ease',
              '&:hover': { bgcolor: 'rgba(102,126,234,0.08)' },
              '&:focus-visible': { outline: '2px solid #667eea', outlineOffset: -2 },
              '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
            }}
          >
            <Box sx={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0, mt: 0.2,
              bgcolor: r.color, color: '#fff', display: 'grid', placeItems: 'center',
              fontSize: '0.7rem', fontWeight: 800,
            }}>
              {r.badge}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.25 }}>
                {r.title}
              </Typography>
              {r.sub && (
                <Typography variant="caption" color="text.secondary">{r.sub}</Typography>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    )}
    </Box>
  );
};

export default TripMap;
