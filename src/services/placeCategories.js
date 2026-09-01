/**
 * 17 קטגוריות המקומות — מקור אמת אחד.
 *
 * ── מאין הן ──
 * הרשימה נלקחה מהבלוק הישן ב-`App.js`, שם היא הופיעה **שלוש פעמים**:
 * במצב ההתחלתי, ברשימת ה-`themes` ובמיפוי ה-`switch` לסוגי Places.
 * ערך שנגזר בשלושה מקומות נפרד זה מזה בשינוי הבא — וזו בדיוק המלכודת
 * שרשומה ב-`STATUS.md`. כאן הוא יושב פעם אחת.
 *
 * ── למה קבוצות ולא 17 כפתורים ──
 * שורה של 17 כפתורים היא מה שהייתה, ואיש לא לחץ עליה. החלוקה לארבע
 * היא זו שהמשתמש עצמו עשה כשנשאל אילו הוא צריך.
 *
 * ── `nightlife` הוא ה-18 ──
 * הוא לא היה בין ה-17 של דף הבית אלא בפאנל, והמשתמש אישר את שניהם.
 * `localMarket` בולע את "קניות" שהיה לשונית נפרדת: שתי לשוניות
 * שמחפשות `shopping_mall` הן אותה עובדה בשני מקומות.
 *
 * ── `types[0]` הוא זה שנשלח ──
 * `nearbySearch` מקבל סוג אחד. השאר מתועדים כדי שיהיה ברור מה הקטגוריה
 * מכסה בפועל ומה לא — ולא כדי ליצור רושם שכולם נשאלים.
 */

export const PLACE_GROUPS = [
  {
    key: 'outdoors',
    categories: [
      { key: 'nature', types: ['park', 'natural_feature'], color: '#2E7D32' },
      { key: 'beach', types: ['natural_feature'], color: '#00BCD4' },
      { key: 'nationalPark', types: ['park'], color: '#1B5E20' },
      { key: 'amusementPark', types: ['amusement_park'], color: '#F9A825' }
    ]
  },
  {
    key: 'foodDrink',
    categories: [
      { key: 'restaurant', types: ['restaurant'], color: '#E64A19' },
      { key: 'cafe', types: ['cafe'], color: '#795548' },
      { key: 'winery', types: ['liquor_store', 'bar'], color: '#7B1FA2' },
      { key: 'nightlife', types: ['night_club', 'bar'], color: '#C2185B' }
    ]
  },
  {
    key: 'culture',
    categories: [
      { key: 'touristAttraction', types: ['tourist_attraction'], color: '#5E35B1' },
      { key: 'museum', types: ['museum'], color: '#F9A825' },
      { key: 'historicalSite', types: ['church'], color: '#8BC34A' },
      { key: 'festival', types: ['point_of_interest'], color: '#D81B60' },
      { key: 'localMarket', types: ['shopping_mall', 'grocery_or_supermarket'], color: '#00897B' }
    ]
  },
  {
    key: 'services',
    categories: [
      { key: 'hotel', types: ['lodging'], color: '#3F51B5' },
      { key: 'hospital', types: ['hospital'], color: '#F44336' },
      { key: 'pharmacy', types: ['pharmacy'], color: '#2196F3' },
      { key: 'spa', types: ['spa'], color: '#AB47BC' }
    ]
  }
];

/** כל הקטגוריות בשורה אחת, לחיפוש לפי מפתח. */
export const ALL_CATEGORIES = PLACE_GROUPS.flatMap((g) =>
  g.categories.map((c) => ({ ...c, group: g.key }))
);

export const categoryByKey = (key) => ALL_CATEGORIES.find((c) => c.key === key) || null;

/**
 * הצבע שבו הסמן מצויר על המפה.
 *
 * `InteractiveMap` מסנן החוצה סמן שקטגוריתו אינה ברשימה שלו, והיא מכירה
 * חמש בלבד. לכן הסמן נמסר לה **בלי** קטגוריה ועם אייקון מפורש — סמן
 * שנבלע בשקט הוא בדיוק מה שקרה לנקודת מסלול לפני `203e6cd`.
 */
const PIN = {
  '#2E7D32': 'green', '#1B5E20': 'green', '#00BCD4': 'ltblue', '#F9A825': 'yellow',
  '#E64A19': 'orange', '#795548': 'orange', '#7B1FA2': 'purple', '#C2185B': 'pink',
  '#5E35B1': 'purple', '#8BC34A': 'green', '#D81B60': 'pink', '#00897B': 'green',
  '#3F51B5': 'blue', '#F44336': 'red', '#2196F3': 'blue', '#AB47BC': 'purple'
};

export const markerIconFor = (categoryKey) => {
  const cat = categoryByKey(categoryKey);
  const name = cat && PIN[cat.color];
  // מקום ללא קטגוריה — תוצאה של חיפוש חופשי — מקבל סיכה ולא נקודה.
  // ברירת מחדל אדומה הייתה זהה לבתי חולים, כלומר סמן שאומר משהו שאינו
  // ידוע. צורה שונה אומרת "לא סווג" במקום לטעון סיווג שגוי.
  return name
    ? `https://maps.google.com/mapfiles/ms/icons/${name}-dot.png`
    : 'https://maps.google.com/mapfiles/ms/icons/red-pushpin.png';
};
