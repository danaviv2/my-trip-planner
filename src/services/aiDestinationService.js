const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY || '';

export const fetchDestinationFromAI = async (destinationName) => {
  if (!OPENAI_API_KEY) {
    throw new Error('NO_API_KEY');
  }

  const seed = destinationName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  const prompt = `אתה מדריך טיולים מקצועי המתמחה בטיולים לישראלים. ספק מידע מקיף ומועיל על "${destinationName}" בפורמט JSON בלבד (ללא טקסט נוסף):

{
  "country": "שם המדינה בעברית",
  "tags": ["תג1", "תג2", "תג3", "תג4"],
  "description": "תיאור עשיר 3-4 משפטים בעברית שמרגש את התייר",
  "language": "שפה רשמית",
  "currency": "מטבע (סמל)",
  "timezone": "GMT+X",
  "airport": "שם שדה התעופה הראשי (קוד IATA)",
  "bestTimeToVisit": "חודשים מומלצים עם הסבר קצר",
  "seasons": {
    "summer": "תיאור קיץ עם טמפרטורות",
    "winter": "תיאור חורף עם טמפרטורות"
  },
  "events": [
    { "name": "שם אירוע", "date": "תאריך/עונה", "description": "תיאור מרתק של האירוע" },
    { "name": "שם אירוע 2", "date": "תאריך/עונה", "description": "תיאור" }
  ],
  "attractions": [
    { "name": "שם האטרקציה", "rating": 4.7, "description": "תיאור מפורט ומרתק", "recommendedDuration": "X שעות", "price": "מחיר כניסה", "tips": "טיפ מועיל לביקור" },
    { "name": "אטרקציה 2", "rating": 4.5, "description": "תיאור", "recommendedDuration": "X שעות", "price": "מחיר", "tips": "טיפ" },
    { "name": "אטרקציה 3", "rating": 4.4, "description": "תיאור", "recommendedDuration": "X שעות", "price": "מחיר", "tips": "טיפ" }
  ],
  "food": {
    "intro": "תיאור עשיר של המטבח המקומי",
    "dishes": [
      { "name": "שם המנה", "description": "תיאור מפורד של המנה ומה מיוחד בה" },
      { "name": "מנה 2", "description": "תיאור" },
      { "name": "מנה 3", "description": "תיאור" }
    ],
    "restaurants": [
      { "name": "שם מסעדה", "rating": 4.5, "description": "מה מיוחד במסעדה", "cuisine": "סוג מטבח", "priceRange": "$$", "area": "שכונה/אזור", "website": "" },
      { "name": "מסעדה 2", "rating": 4.3, "description": "תיאור", "cuisine": "סוג", "priceRange": "$$$", "area": "אזור", "website": "" }
    ],
    "markets": [
      { "name": "שם שוק", "description": "מה אפשר למצוא בשוק", "hours": "שעות פתיחה" }
    ]
  },
  "transportation": {
    "overview": "תיאור כללי של מערכת התחבורה",
    "options": [
      { "name": "סוג תחבורה", "icon": "subway", "iconColor": "#1976D2", "description": "תיאור מפורט", "cost": "עלות", "hours": "שעות פעילות", "website": "" },
      { "name": "סוג 2", "icon": "directions_bus", "iconColor": "#388E3C", "description": "תיאור", "cost": "עלות", "hours": "שעות", "website": "" }
    ],
    "tips": [
      { "title": "כותרת טיפ", "description": "תיאור מפורט של הטיפ" },
      { "title": "כותרת 2", "description": "תיאור" }
    ],
    "fromAirport": "איך להגיע מהשדה לעיר - אפשרויות ומחירים"
  },
  "tips": {
    "beforeTravel": [
      { "icon": "language", "title": "כותרת", "description": "טיפ חשוב לפני הנסיעה" },
      { "icon": "euro", "title": "כותרת", "description": "טיפ" },
      { "icon": "health_and_safety", "title": "כותרת", "description": "טיפ" }
    ],
    "hours": {
      "shopping": "שעות קניות מקובלות",
      "restaurants": "שעות ארוחות מקובלות",
      "attractions": "שעות אטרקציות ומוזיאונים"
    },
    "local": [
      { "title": "מנהג מקומי", "description": "הסבר על מנהג חשוב" },
      { "title": "מנהג 2", "description": "הסבר" }
    ]
  },
  "nearbyDestinations": [
    { "name": "יעד קרוב", "distance": "XX" },
    { "name": "יעד קרוב 2", "distance": "XX" }
  ],
  "itinerary": {
    "3days": [
      {
        "day": 1,
        "title": "כותרת יום 1",
        "morning": "פעילות בוקר מפורטת - לאן ללכת ומה לעשות",
        "afternoon": "פעילות צהריים מפורטת",
        "evening": "פעילות ערב מפורטת",
        "food": "המלצת אוכל ליום זה",
        "tip": "טיפ מיוחד ליום זה"
      },
      {
        "day": 2,
        "title": "כותרת יום 2",
        "morning": "פעילות בוקר",
        "afternoon": "פעילות צהריים",
        "evening": "פעילות ערב",
        "food": "המלצת אוכל",
        "tip": "טיפ"
      },
      {
        "day": 3,
        "title": "כותרת יום 3",
        "morning": "פעילות בוקר",
        "afternoon": "פעילות צהריים",
        "evening": "פעילות ערב",
        "food": "המלצת אוכל",
        "tip": "טיפ"
      }
    ],
    "5days": [
      { "day": 1, "title": "כותרת", "morning": "פעילות", "afternoon": "פעילות", "evening": "פעילות", "food": "המלצה", "tip": "טיפ" },
      { "day": 2, "title": "כותרת", "morning": "פעילות", "afternoon": "פעילות", "evening": "פעילות", "food": "המלצה", "tip": "טיפ" },
      { "day": 3, "title": "כותרת", "morning": "פעילות", "afternoon": "פעילות", "evening": "פעילות", "food": "המלצה", "tip": "טיפ" },
      { "day": 4, "title": "כותרת", "morning": "פעילות", "afternoon": "פעילות", "evening": "פעילות", "food": "המלצה", "tip": "טיפ" },
      { "day": 5, "title": "כותרת", "morning": "פעילות", "afternoon": "פעילות", "evening": "פעילות", "food": "המלצה", "tip": "טיפ" }
    ]
  },
  "budget": {
    "currency": "סמל המטבע",
    "note": "הערה כללית על יוקר המחיה",
    "budget": {
      "label": "תקציבאי",
      "accommodation": 30,
      "food": 20,
      "transport": 10,
      "activities": 10,
      "total": 70,
      "notes": "הסבר איפה לחסוך - הוסטלים, אוכל רחוב וכו'"
    },
    "mid": {
      "label": "ממוצע",
      "accommodation": 100,
      "food": 50,
      "transport": 20,
      "activities": 30,
      "total": 200,
      "notes": "מלון 3 כוכבים, מסעדות ממוצעות"
    },
    "luxury": {
      "label": "יוקרה",
      "accommodation": 300,
      "food": 150,
      "transport": 50,
      "activities": 100,
      "total": 600,
      "notes": "מלון 5 כוכבים, חוויות פרימיום"
    },
    "tips": [
      "טיפ לחיסכון 1",
      "טיפ לחיסכון 2",
      "מה שווה לשלם עליו יותר"
    ]
  },
  "practical": {
    "visa": "מידע מדויק על ויזה לאזרחי ישראל - האם נדרשת, איך מגישים, עלות",
    "plugType": "סוג השקע (Type A/B/C/G/etc) + האם נדרש מתאם לישראלים",
    "voltage": "220V/110V",
    "simCard": "איפה וכיצד לרכוש כרטיס SIM - עלות ואיכות הכיסוי",
    "currencyTips": "טיפים על המרת מטבע - היכן עדיף להמיר, האם כרטיס אשראי עדיף",
    "health": "חיסונים מומלצים, האם יש תרופות שכדאי לקחת, מים - האם ניתן לשתות מהברז",
    "emergencyNumbers": {
      "police": "מספר משטרה",
      "ambulance": "מספר אמבולנס",
      "touristPolice": "מספר משטרת תיירים (אם קיים)"
    },
    "safety": {
      "level": "בטוח / זהירות בסיסית / נדרשת זהירות",
      "color": "green",
      "overview": "תיאור כללי של רמת הבטיחות",
      "tips": ["טיפ בטיחות 1", "טיפ בטיחות 2"],
      "avoidAreas": ["אזורים להימנע - אם רלוונטי"]
    },
    "neighborhoods": [
      { "name": "שם שכונה", "description": "מה מיוחד בשכונה", "bestFor": "מתאים ל...", "priceRange": "$$" },
      { "name": "שכונה 2", "description": "תיאור", "bestFor": "מתאים ל...", "priceRange": "$$$" }
    ],
    "shopping": {
      "intro": "תיאור כללי של הקניות ביעד",
      "items": ["פריט שכדאי לקנות 1", "פריט 2", "מזכרת מומלצת"],
      "areas": [
        { "name": "אזור קניות", "description": "מה ניתן למצוא שם" }
      ]
    },
    "nightlife": {
      "intro": "תיאור כללי של חיי הלילה",
      "areas": [
        { "name": "שכונה/רחוב", "description": "מה מציעה בלילה", "type": "בארים/מועדונים/מסעדות" }
      ]
    }
  }
}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    console.log(`🌍 מחפש מידע AI מקיף על: ${destinationName}`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 4000
      })
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI error:', response.status, errText);
      throw new Error(`API_ERROR_${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    console.log('✅ תגובת AI מקיפה התקבלה');

    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // תמונות דינמיות לפי seed של שם היעד
    const coverImage = `https://picsum.photos/seed/${seed}/1200/600`;
    const attractions = (parsed.attractions || []).map((a, i) => ({
      ...a,
      image: `https://picsum.photos/seed/${seed + i + 10}/500/400`
    }));
    const food = {
      ...parsed.food,
      dishes: (parsed.food?.dishes || []).map((d, i) => ({
        ...d,
        image: `https://picsum.photos/seed/${seed + i + 20}/150/150`
      })),
      markets: (parsed.food?.markets || []).map((m, i) => ({
        ...m,
        image: `https://picsum.photos/seed/${seed + i + 30}/300/200`
      }))
    };
    const nearbyDestinations = (parsed.nearbyDestinations || []).map((n, i) => ({
      ...n,
      image: `https://picsum.photos/seed/${seed + i + 40}/300/200`
    }));

    return {
      name: destinationName,
      ...parsed,
      coverImage,
      attractions,
      food,
      nearbyDestinations,
      isAIGenerated: true,
      generalInfo: {
        language: parsed.language,
        currency: parsed.currency,
        timezone: parsed.timezone,
        airport: parsed.airport,
        bestTimeToVisit: parsed.bestTimeToVisit,
        seasons: parsed.seasons
      },
      currentWeather: {
        temperature: 22, feelsLike: 24, description: 'בהיר',
        icon: 'https://openweathermap.org/img/wn/01d@2x.png',
        humidity: 70, windSpeed: 3
      }
    };

  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('TIMEOUT');
    throw err;
  }
};
