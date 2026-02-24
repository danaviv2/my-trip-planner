const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY || '';

export const fetchDestinationFromAI = async (destinationName) => {
  if (!OPENAI_API_KEY) {
    throw new Error('NO_API_KEY');
  }

    // מפתחות חיפוש לתמונות לפי יעד
  const citySlug = encodeURIComponent(destinationName.toLowerCase().replace(/\s+/g, '-'));
  const seed = destinationName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  const prompt = `אתה מדריך טיולים מקצועי. ספק מידע על "${destinationName}" בפורמט JSON בדיוק כך (ללא טקסט נוסף, רק JSON):
{
  "country": "שם המדינה בעברית",
  "tags": ["תג1", "תג2", "תג3"],
  "description": "תיאור קצר 2-3 משפטים בעברית",
  "language": "שפה רשמית",
  "currency": "מטבע (סמל)",
  "timezone": "GMT+X",
  "airport": "שם שדה תעופה (קוד)",
  "bestTimeToVisit": "חודשים מומלצים",
  "seasons": { "summer": "תיאור קיץ עם טמפרטורות", "winter": "תיאור חורף עם טמפרטורות" },
  "events": [
    { "name": "שם אירוע", "date": "עונה/חודש", "description": "תיאור קצר" }
  ],
  "attractions": [
    { "name": "שם אטרקציה", "rating": 4.5, "description": "תיאור", "recommendedDuration": "X שעות", "price": "מחיר" }
  ],
  "food": {
    "intro": "תיאור המטבח המקומי",
    "dishes": [{ "name": "שם מנה", "description": "תיאור" }],
    "restaurants": [{ "name": "שם", "rating": 4.4, "description": "תיאור", "cuisine": "סוג", "priceRange": "$$", "area": "שכונה", "website": "" }],
    "markets": [{ "name": "שם שוק", "description": "תיאור", "hours": "שעות" }]
  },
  "transportation": {
    "overview": "תיאור תחבורה",
    "options": [{ "name": "סוג", "icon": "subway", "iconColor": "#1976D2", "description": "תיאור", "cost": "עלות", "hours": "שעות", "website": "" }],
    "tips": [{ "title": "כותרת", "description": "תיאור" }]
  },
  "tips": {
    "beforeTravel": [{ "icon": "language", "title": "כותרת", "description": "תיאור" }],
    "hours": { "shopping": "שעות קניות", "restaurants": "שעות מסעדות", "attractions": "שעות אטרקציות" },
    "local": [{ "title": "כותרת", "description": "תיאור" }]
  },
  "nearbyDestinations": [{ "name": "יעד קרוב", "distance": "100" }]
}

חשוב: אל תכלול שדות "image" או "coverImage" בתשובה - רק JSON ללא תמונות.`;

  // timeout של 20 שניות
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    console.log(`🌍 מחפש מידע AI על: ${destinationName}`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 2000
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
    console.log('✅ תגובת AI התקבלה');

    // נקה markdown אם יש
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // הוסף תמונות דינמיות לפי שם היעד (picsum - עקבי לפי seed)
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
    if (err.name === 'AbortError') {
      throw new Error('TIMEOUT');
    }
    throw err;
  }
};
