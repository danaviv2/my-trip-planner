// Mock data for the travel application
// הערה: יש להניח את השורות הבאות בתחילת הקובץ לאחר כל הגדרת הנתונים


  
  // Popular destinations for the homepage
  export const popularDestinations = [
    {
      id: 1,
      name: 'פריז, צרפת',
      description: 'עיר האורות, ידועה במגדל אייפל ואוכל ברמה עולמית.',
      image: '/images/paris.jpg',
      rating: 4.8,
      reviews: 320,
      tags: ['רומנטי', 'תרבות', 'אוכל'],
      popularSeason: 'אביב',
      averagePrice: 1200
    },
    {
      id: 2,
      name: 'טוקיו, יפן',
      description: 'שילוב של תרבות מסורתית וטכנולוגיה חדשנית.',
      image: '/images/tokyo.jpg',
      rating: 4.7,
      reviews: 280,
      tags: ['תרבות', 'טכנולוגיה', 'אוכל'],
      popularSeason: 'אביב',
      averagePrice: 1500
    },
    {
      id: 3,
      name: 'רומא, איטליה',
      description: 'העיר הנצחית עם שרידים עתיקים ואוכל איטלקי משובח.',
      image: '/images/rome.jpg',
      rating: 4.6,
      reviews: 240,
      tags: ['היסטוריה', 'אוכל', 'אמנות'],
      popularSeason: 'סתיו',
      averagePrice: 1100
    },
    {
      id: 4,
      name: 'ניו יורק, ארה"ב',
      description: 'התפוח הגדול, עם גורדי שחקים אייקוניים ושכונות מגוונות.',
      image: '/images/newyork.jpg',
      rating: 4.5,
      reviews: 300,
      tags: ['קניות', 'אורבני', 'אמנות'],
      popularSeason: 'סתיו',
      averagePrice: 1300
    },
    {
      id: 5,
      name: 'ברצלונה, ספרד',
      description: 'ידועה באדריכלות מדהימה, חופים ותרבות תוססת.',
      image: '/images/barcelona.jpg',
      rating: 4.6,
      reviews: 260,
      tags: ['חופים', 'תרבות', 'אוכל'],
      popularSeason: 'קיץ',
      averagePrice: 950
    },
    {
      id: 6,
      name: 'אמסטרדם, הולנד',
      description: 'עיר התעלות עם אווירה ליברלית ותרבות עשירה.',
      image: '/images/amsterdam.jpg',
      rating: 4.5,
      reviews: 220,
      tags: ['תרבות', 'מוזיאונים', 'אופניים'],
      popularSeason: 'אביב',
      averagePrice: 900
    },
    {
      id: 7,
      name: 'לונדון, אנגליה',
      description: 'עיר קוסמופוליטית עם היסטוריה עשירה ותרבות חיה.',
      image: '/images/london.jpg',
      rating: 4.6,
      reviews: 290,
      tags: ['היסטוריה', 'קניות', 'מוזיאונים'],
      popularSeason: 'קיץ',
      averagePrice: 1200
    },
    {
      id: 8,
      name: 'בנגקוק, תאילנד',
      description: 'עיר תוססת עם מקדשים מרהיבים ואוכל רחוב מצוין.',
      image: '/images/bangkok.jpg',
      rating: 4.4,
      reviews: 240,
      tags: ['תרבות', 'אוכל', 'קניות'],
      popularSeason: 'חורף',
      averagePrice: 800
    },
    {
      id: 9,
      name: 'סידני, אוסטרליה',
      description: 'עיר נמל יפהפייה עם חופים מדהימים ואיכות חיים גבוהה.',
      image: '/images/sydney.jpg',
      rating: 4.7,
      reviews: 210,
      tags: ['חופים', 'טבע', 'אורבני'],
      popularSeason: 'קיץ',
      averagePrice: 1400
    },
    {
      id: 10,
      name: 'ריו דה ז\'נרו, ברזיל',
      description: 'עיר מרהיבה עם נופים דרמטיים, חופים וקרנבל מפורסם.',
      image: '/images/rio.jpg',
      rating: 4.5,
      reviews: 200,
      tags: ['חופים', 'טבע', 'פסטיבלים'],
      popularSeason: 'חורף',
      averagePrice: 1100
    }
  ];
  // Featured trips for the homepage slider
export const featuredTrips = [
    {
      id: 1,
      title: 'חופשה רומנטית בפריז',
      description: 'גלו את עיר האורות עם סיור מיוחד וארוחות גורמה',
      image: '/images/paris-trip.jpg',
      days: 5,
      price: 1499,
      highlights: ['מגדל אייפל', 'מוזיאון הלובר', 'ארמון ורסאי', 'מונמארטר'],
      rating: 4.8,
      reviews: 120,
      date: '2025-06-15'
    },
    {
      id: 2,
      title: 'הרפתקה ביפן',
      description: 'מסע מרתק דרך טוקיו, קיוטו והאלפים היפניים',
      image: '/images/japan-trip.jpg',
      days: 10,
      price: 2899,
      highlights: ['מקדש מייג׳י', 'הר פוג׳י', 'קיוטו העתיקה', 'גני הארמון הקיסרי'],
      rating: 4.9,
      reviews: 85,
      date: '2025-04-10'
    },
    {
      id: 3,
      title: 'אביב ברומא',
      description: 'גלו את אוצרות התרבות, האמנות והקולינריה של רומא',
      image: '/images/rome-trip.jpg',
      days: 7,
      price: 1299,
      highlights: ['הקולוסיאום', 'הוותיקן', 'מזרקת טרווי', 'פנתיאון'],
      rating: 4.7,
      reviews: 110,
      date: '2025-05-05'
    },
    {
      id: 4,
      title: 'טיול משפחתי בברצלונה',
      description: 'חופשה מושלמת למשפחות עם אטרקציות לכל הגילאים',
      image: '/images/barcelona-trip.jpg',
      days: 6,
      price: 1599,
      highlights: ['סגרדה פמיליה', 'פארק גואל', 'לה רמבלה', 'חוף ברצלונטה'],
      rating: 4.6,
      reviews: 95,
      date: '2025-07-20'
    }
  ];
  
  // Regular destinations list
  export const destinations = [
    {
      id: 1,
      name: 'Paris',
      country: 'France',
      description: 'The City of Light, known for the Eiffel Tower and world-class cuisine.',
      longDescription: 'פריז, בירת צרפת, היא אחת הערים המתוירות ביותר בעולם. מכונה "עיר האורות", פריז ידועה בארכיטקטורה המרהיבה שלה, מוזיאונים עולמיים, אופנה ואוכל משובח. האטרקציות המפורסמות ביותר כוללות את מגדל אייפל, מוזיאון הלובר, קתדרלת נוטרדאם, ושדרות השאנז אליזה. העיר חולקת ל-20 רבעים (arrondissements) המסודרים בצורת ספירלה.',
      image: '/images/paris.jpg',
      gallery: [
        '/images/paris-eiffel.jpg',
        '/images/paris-louvre.jpg',
        '/images/paris-montmartre.jpg',
        '/images/paris-notredame.jpg'
      ],
      rating: 4.8,
      popularSeason: 'Spring',
      bestMonthsToVisit: ['April', 'May', 'June', 'September', 'October'],
      averagePrice: 1200,
      currency: 'EUR',
      language: 'French',
      timezone: 'Central European Time',
      coordinates: {
        latitude: 48.8566,
        longitude: 2.3522
      },
      transportOptions: ['Metro', 'Bus', 'Taxi', 'Walking', 'Bicycle (Vélib)'],
      tags: ['Romantic', 'Culture', 'Food', 'Architecture', 'Museums']
    },
    {
      id: 2,
      name: 'Tokyo',
      country: 'Japan',
      description: 'A fusion of traditional culture and cutting-edge technology.',
      longDescription: 'טוקיו, בירת יפן, היא אחת המטרופולינים הגדולות והמפותחות ביותר בעולם. העיר מציעה מיזוג ייחודי של מסורת יפנית עתיקה וטכנולוגיה מתקדמת. טוקיו ידועה במקדשים ומרכזי קניות עצומים, גורדי שחקים מרשימים, ותרבות אוכל עשירה הכוללת את הסושי הטוב בעולם. האטרקציות כוללות את מקדש מייג׳י, ארמון הקיסר, ורובע שיבויה התוסס.',
      image: '/images/tokyo.jpg',
      gallery: [
        '/images/tokyo-temple.jpg',
        '/images/tokyo-skyline.jpg',
        '/images/tokyo-sakura.jpg',
        '/images/tokyo-shibuya.jpg'
      ],
      rating: 4.7,
      popularSeason: 'Spring',
      bestMonthsToVisit: ['March', 'April', 'October', 'November'],
      averagePrice: 1500,
      currency: 'JPY',
      language: 'Japanese',
      timezone: 'Japan Standard Time',
      coordinates: {
        latitude: 35.6762,
        longitude: 139.6503
      },
      transportOptions: ['Metro', 'JR Trains', 'Bus', 'Taxi'],
      tags: ['Technology', 'Culture', 'Food', 'Shopping', 'Tradition']
    },
    {
      id: 3,
      name: 'Rome',
      country: 'Italy',
      description: 'The Eternal City with ancient ruins and delicious Italian food.',
      longDescription: 'רומא, בירת איטליה, היא עיר עתיקה עם יותר מ-3,000 שנות היסטוריה. מכונה "העיר הנצחית", רומא ידועה בשרידים ארכיאולוגיים מרשימים, כולל הקולוסיאום, הפורום הרומי והפנתיאון. רומא היא גם מקום הולדתה של האימפריה הרומית ומקלה את מדינת הוותיקן, המדינה העצמאית הקטנה ביותר בעולם. האוכל האיטלקי המקומי, הפיאצות (כיכרות) הציוריות והמזרקות המפורסמות הופכים אותה ליעד תיירותי פופולרי.',
      image: '/images/rome.jpg',
      gallery: [
        '/images/rome-colosseum.jpg',
        '/images/rome-vatican.jpg',
        '/images/rome-trevi.jpg',
        '/images/rome-forum.jpg'
      ],
      rating: 4.6,
      popularSeason: 'Fall',
      bestMonthsToVisit: ['April', 'May', 'September', 'October'],
      averagePrice: 1100,
      currency: 'EUR',
      language: 'Italian',
      timezone: 'Central European Time',
      coordinates: {
        latitude: 41.9028,
        longitude: 12.4964
      },
      transportOptions: ['Metro', 'Bus', 'Taxi', 'Walking'],
      tags: ['History', 'Food', 'Art', 'Architecture', 'Religion']
    },
    {
      id: 4,
      name: 'New York',
      country: 'United States',
      description: 'The Big Apple, featuring iconic skyscrapers and diverse neighborhoods.',
      longDescription: 'ניו יורק, הידועה גם כ"תפוח הגדול", היא העיר הגדולה ביותר בארצות הברית ואחד ממרכזי התרבות, האמנות, האופנה והפיננסים המובילים בעולם. ניו יורק מורכבת מחמישה רובעים: מנהטן, ברוקלין, קווינס, ברונקס וסטייטן איילנד. האטרקציות המפורסמות כוללות את פסל החירות, סנטרל פארק, טיימס סקוור, אמפייר סטייט בילדינג ומוזיאונים עולמיים. העיר ידועה גם בתיאטרון ברודווי, באוכל המגוון ובאווירה הקוסמופוליטית.',
      image: '/images/newyork.jpg',
      gallery: [
        '/images/nyc-times-square.jpg',
        '/images/nyc-central-park.jpg',
        '/images/nyc-brooklyn-bridge.jpg',
        '/images/nyc-statue-liberty.jpg'
      ],
      rating: 4.5,
      popularSeason: 'Fall',
      bestMonthsToVisit: ['May', 'June', 'September', 'October', 'December'],
      averagePrice: 1300,
      currency: 'USD',
      language: 'English',
      timezone: 'Eastern Time',
      coordinates: {
        latitude: 40.7128,
        longitude: -74.0060
      },
      transportOptions: ['Subway', 'Bus', 'Taxi', 'Ferry', 'Walking'],
      tags: ['Urban', 'Shopping', 'Art', 'Food', 'Entertainment']
    },
    {
      id: 5,
      name: 'Barcelona',
      country: 'Spain',
      description: 'Known for stunning architecture, beaches, and vibrant culture.',
      longDescription: 'ברצלונה, בירת קטלוניה, היא עיר חוף תוססת בספרד. העיר ידועה באדריכלות הייחודית של אנטוני גאודי, כולל הסגרדה פמיליה, פארק גואל ובתים מדהימים. ברצלונה מציעה שילוב מושלם של חופי ים תיכון, קולינריה ספרדית מעולה, חיי לילה תוססים ותרבות קטלאנית עשירה. הלה רמבלס, שדרת הקניות והבידור המפורסמת, והרובע הגותי העתיק מושכים מיליוני מבקרים בכל שנה.',
      image: '/images/barcelona.jpg',
      gallery: [
        '/images/barcelona-sagrada.jpg',
        '/images/barcelona-beach.jpg',
        '/images/barcelona-park-guell.jpg',
        '/images/barcelona-rambla.jpg'
      ],
      rating: 4.6,
      popularSeason: 'Summer',
      bestMonthsToVisit: ['May', 'June', 'September', 'October'],
      averagePrice: 950,
      currency: 'EUR',
      language: 'Spanish, Catalan',
      timezone: 'Central European Time',
      coordinates: {
        latitude: 41.3851,
        longitude: 2.1734
      },
      transportOptions: ['Metro', 'Bus', 'Taxi', 'Walking', 'Bicycle'],
      tags: ['Beaches', 'Architecture', 'Food', 'Nightlife', 'Art']
    },
    {
      id: 6,
      name: 'Amsterdam',
      country: 'Netherlands',
      description: 'Canal city with a liberal atmosphere and rich culture.',
      longDescription: 'אמסטרדם, בירת הולנד, היא עיר התעלות המפורסמת בעולם. העיר ידועה בנופים ציוריים, בתים היסטוריים, מוזיאונים עולמיים ואווירה ליברלית. האטרקציות כוללות את מוזיאון ואן גוך, בית אנה פרנק, ארמון המלוכה ושוק הפרחים הצף. אמסטרדם היא גם אחת הערים הידידותיות ביותר לאופניים בעולם, עם יותר אופניים מתושבים. התרבות ההולנדית, האמנות, והמסורת בשילוב עם גישה פתוחה הופכים את העיר לייחודית.',
      image: '/images/amsterdam.jpg',
      gallery: [
        '/images/amsterdam-canals.jpg',
        '/images/amsterdam-bikes.jpg',
        '/images/amsterdam-museum.jpg',
        '/images/amsterdam-tulips.jpg'
      ],
      rating: 4.5,
      popularSeason: 'Spring',
      bestMonthsToVisit: ['April', 'May', 'September'],
      averagePrice: 900,
      currency: 'EUR',
      language: 'Dutch',
      timezone: 'Central European Time',
      coordinates: {
        latitude: 52.3676,
        longitude: 4.9041
      },
      transportOptions: ['Tram', 'Metro', 'Bus', 'Bicycle', 'Boat'],
      tags: ['Canals', 'Museums', 'Cycling', 'Culture', 'Liberal']
    },
    {
      id: 7,
      name: 'London',
      country: 'England',
      description: 'Cosmopolitan city with rich history and vibrant culture.',
      longDescription: 'לונדון, בירת אנגליה והממלכה המאוחדת, היא אחת הערים ההיסטוריות והקוסמופוליטיות ביותר בעולם. העיר שוכנת על נהר התמזה ומציעה שילוב מרתק של היסטוריה עתיקה ומודרניות. אטרקציות מפורסמות כוללות את ארמון בקינגהאם, ביג בן, מגדל לונדון, הפרלמנט הבריטי והלונדון איי. העיר מפורסמת גם במוזיאונים בעלי שם עולמי, תיאטרון ווסט אנד, חנויות כלבו מפוארות, ומסעדות מכל רחבי העולם.',
      image: '/images/london.jpg',
      gallery: [
        '/images/london-bigben.jpg',
        '/images/london-palace.jpg',
        '/images/london-eye.jpg',
        '/images/london-tower.jpg'
      ],
      rating: 4.6,
      popularSeason: 'Summer',
      bestMonthsToVisit: ['May', 'June', 'July', 'August', 'December'],
      averagePrice: 1200,
      currency: 'GBP',
      language: 'English',
      timezone: 'Greenwich Mean Time',
      coordinates: {
        latitude: 51.5074,
        longitude: -0.1278
      },
      transportOptions: ['Tube', 'Bus', 'Taxi', 'Walking', 'River Bus'],
      tags: ['History', 'Culture', 'Shopping', 'Museums', 'Theatre']
    },
    {
      id: 8,
      name: 'Bangkok',
      country: 'Thailand',
      description: 'Bustling city with stunning temples and excellent street food.',
      longDescription: 'בנגקוק, בירת תאילנד, היא עיר תוססת ומרתקת המשלבת מסורת ומודרניות. העיר ידועה במקדשים מרהיבים כמו הארמון המלכותי, ואט פו ומקדש האמרלד בודהה. בנגקוק ידועה גם באוכל הרחוב המעולה שלה, בשווקים הצבעוניים (כמו שוק הצף) ובחיי הלילה התוססים. המטרופולין הגדול הזה מציע שילוב ייחודי של תרבות מזרח-אסיה, היסטוריה עשירה, קניות מצוינות ואירוח תאילנדי מסורתי.',
      image: '/images/bangkok.jpg',
      gallery: [
        '/images/bangkok-temple.jpg',
        '/images/bangkok-market.jpg',
        '/images/bangkok-river.jpg',
        '/images/bangkok-skyline.jpg'
      ],
      rating: 4.4,
      popularSeason: 'Winter',
      bestMonthsToVisit: ['November', 'December', 'January', 'February'],
      averagePrice: 800,
      currency: 'THB',
      language: 'Thai',
      timezone: 'Indochina Time',
      coordinates: {
        latitude: 13.7563,
        longitude: 100.5018
      },
      transportOptions: ['BTS Skytrain', 'MRT Subway', 'Taxi', 'Tuk-tuk', 'Boat'],
      tags: ['Temples', 'Food', 'Shopping', 'Nightlife', 'Culture']
    }
  ];
  // Attractions for various destinations
export const attractions = {
    'Paris': [
      {
        id: 1,
        name: 'Eiffel Tower',
        category: 'landmarks',
        location: 'Champ de Mars',
        rating: 4.7,
        price: '€25',
        duration: 120,
        description: 'Iconic iron tower offering city views from observation decks.',
        image: '/images/paris-eiffel.jpg',
        openingHours: '9:00-23:30',
        website: 'https://www.toureiffel.paris/en',
        coordinates: {
          latitude: 48.8584,
          longitude: 2.2945
        },
        tips: 'Visit during sunset for spectacular views of the city. Book tickets online to avoid long queues.'
      },
      {
        id: 2,
        name: 'Louvre Museum',
        category: 'museums',
        location: 'Rue de Rivoli',
        rating: 4.8,
        price: '€15',
        duration: 180,
        description: 'World-famous art museum home to the Mona Lisa and Venus de Milo.',
        image: '/images/paris-louvre.jpg',
        openingHours: '9:00-18:00, Closed on Tuesdays',
        website: 'https://www.louvre.fr/en',
        coordinates: {
          latitude: 48.8606,
          longitude: 2.3376
        },
        tips: 'Come early in the morning to avoid crowds. Focus on specific sections as the museum is huge and impossible to see in one day.'
      },
      {
        id: 3,
        name: 'Notre-Dame Cathedral',
        category: 'landmarks',
        location: 'Île de la Cité',
        rating: 4.6,
        price: 'Free',
        duration: 90,
        description: 'Medieval Catholic cathedral known for its Gothic architecture.',
        image: '/images/paris-notredame.jpg',
        openingHours: '8:00-18:45',
        website: 'https://www.notredamedeparis.fr/en/',
        coordinates: {
          latitude: 48.8530,
          longitude: 2.3499
        },
        tips: 'Currently under restoration after the 2019 fire. You can still admire it from outside.'
      },
      {
        id: 4,
        name: 'Montmartre',
        category: 'neighborhoods',
        location: 'Northern Paris',
        rating: 4.5,
        price: 'Free',
        duration: 150,
        description: 'Artistic hillside neighborhood topped by the Sacré-Cœur Basilica.',
        image: '/images/paris-montmartre.jpg',
        openingHours: 'Always open',
        website: 'https://en.parisinfo.com/discovering-paris/walks-in-paris/montmartre',
        coordinates: {
          latitude: 48.8867,
          longitude: 2.3431
        },
        tips: 'Take the funicular to save energy on the uphill climb. Visit Place du Tertre to see artists at work.'
      },
      {
        id: 5,
        name: 'Seine River Cruise',
        category: 'activities',
        location: 'Various departure points',
        rating: 4.4,
        price: '€15',
        duration: 60,
        description: 'Scenic boat tour along the Seine River offering views of Paris landmarks.',
        image: '/images/paris-seine.jpg',
        openingHours: '10:00-22:00',
        website: 'https://www.bateauxparisiens.com/en.html',
        coordinates: {
          latitude: 48.8599,
          longitude: 2.3377
        },
        tips: 'Evening cruises are particularly beautiful when the city is illuminated. Dinner cruises are romantic but more expensive.'
      }
    ],
    'Tokyo': [
      {
        id: 1,
        name: 'Tokyo Skytree',
        category: 'landmarks',
        location: 'Sumida',
        rating: 4.5,
        price: '¥2000',
        duration: 90,
        description: 'Tall broadcasting tower with observation decks and shops.',
        image: '/images/tokyo-skytree.jpg',
        openingHours: '10:00-21:00',
        website: 'http://www.tokyo-skytree.jp/en/',
        coordinates: {
          latitude: 35.7101,
          longitude: 139.8107
        },
        tips: 'Visit on a clear day for views of Mount Fuji. Go during sunset for spectacular views.'
      },
      {
        id: 2,
        name: 'Senso-ji Temple',
        category: 'landmarks',
        location: 'Asakusa',
        rating: 4.7,
        price: 'Free',
        duration: 60,
        description: 'Ancient Buddhist temple with a huge lantern and souvenir shops.',
        image: '/images/tokyo-sensoji.jpg',
        openingHours: '6:00-17:00',
        website: 'https://www.senso-ji.jp/english/',
        coordinates: {
          latitude: 35.7147,
          longitude: 139.7967
        },
        tips: 'Visit early morning to avoid crowds. Explore the Nakamise Shopping Street leading to the temple.'
      },
      {
        id: 3,
        name: 'Tsukiji Outer Market',
        category: 'food',
        location: 'Chuo',
        rating: 4.6,
        price: 'Varies',
        duration: 120,
        description: 'Vibrant market area with fresh seafood and various food stalls.',
        image: '/images/tokyo-tsukiji.jpg',
        openingHours: '5:00-14:00, some shops closed on Sundays',
        website: 'https://www.tsukiji.or.jp/english/',
        coordinates: {
          latitude: 35.6654,
          longitude: 139.7707
        },
        tips: 'Come early for the freshest seafood. Some restaurants close once they sell out of the day\'s catch.'
      },
      {
        id: 4,
        name: 'Shibuya Crossing',
        category: 'landmarks',
        location: 'Shibuya',
        rating: 4.5,
        price: 'Free',
        duration: 30,
        description: 'Famous busy intersection known for its scramble crossing.',
        image: '/images/tokyo-shibuya.jpg',
        openingHours: 'Always open',
        website: 'https://www.japan-guide.com/e/e3007.html',
        coordinates: {
          latitude: 35.6595,
          longitude: 139.7004
        },
        tips: 'View from the Starbucks in the Tsutaya building for a great vantage point. Busiest during evening rush hour.'
      }
    ],
    'Rome': [
      {
        id: 1,
        name: 'Colosseum',
        category: 'landmarks',
        location: 'Historic Center',
        rating: 4.8,
        price: '€16',
        duration: 120,
        description: 'Iconic ancient Roman amphitheater where gladiators once battled.',
        image: '/images/rome-colosseum.jpg',
        openingHours: '8:30-19:00',
        website: 'https://www.coopculture.it/en/colosseo-e-parco-archeologico/',
        coordinates: {
          latitude: 41.8902,
          longitude: 12.4922
        },
        tips: 'Buy combined tickets with the Roman Forum and Palatine Hill. Book in advance to skip the line.'
      },
      {
        id: 2,
        name: 'Vatican Museums',
        category: 'museums',
        location: 'Vatican City',
        rating: 4.7,
        price: '€17',
        duration: 180,
        description: 'Art and sculpture museums featuring the Sistine Chapel.',
        image: '/images/rome-vatican.jpg',
        openingHours: '9:00-18:00, Closed on Sundays',
        website: 'https://www.museivaticani.va/content/museivaticani/en.html',
        coordinates: {
          latitude: 41.9064,
          longitude: 12.4534
        },
        tips: 'Book tickets online to avoid extremely long lines. Visit the Sistine Chapel towards the end of your visit.'
      },
      {
        id: 3,
        name: 'Trevi Fountain',
        category: 'landmarks',
        location: 'Centro Storico',
        rating: 4.7,
        price: 'Free',
        duration: 30,
        description: 'Iconic Baroque fountain known for coin-tossing tradition.',
        image: '/images/rome-trevi.jpg',
        openingHours: 'Always open',
        website: 'https://www.rome.net/trevi-fountain',
        coordinates: {
          latitude: 41.9009,
          longitude: 12.4833
        },
        tips: 'Visit early morning or late evening to avoid the biggest crowds. Legend says throwing a coin ensures a return to Rome.'
      }
    ]
  };
  
  // Hotel options
  export const hotels = [
    {
      id: 1,
      name: 'Grand Luxury Hotel Paris',
      destination: 'Paris',
      rating: 5,
      price: 350,
      priceCategory: 'luxury',
      address: '15 Avenue des Champs-Élysées, 75008 Paris, France',
      description: 'Elegant 5-star hotel in the heart of Paris with stunning Eiffel Tower views.',
      amenities: ['Free Wi-Fi', 'Spa', 'Pool', 'Restaurant', 'Fitness Center', 'Room Service', 'Concierge', 'Airport Shuttle'],
      image: '/images/hotel-paris-luxury.jpg',
      gallery: [
        '/images/paris-hotel-luxury-1.jpg',
        '/images/paris-hotel-luxury-2.jpg',
        '/images/paris-hotel-luxury-3.jpg'
      ],
      coordinates: {
        latitude: 48.8698,
        longitude: 2.3075
      },
      reviews: [
        {
          user: 'ElegantTraveler',
          rating: 5,
          date: '2023-09-15',
          comment: 'Absolutely magnificent hotel with impeccable service. The view from our room was breathtaking.'
        },
        {
          user: 'BusinessExec123',
          rating: 4,
          date: '2023-08-22',
          comment: 'Excellent location and service. The concierge was particularly helpful with restaurant recommendations.'
        }
      ]
    },
    {
      id: 2,
      name: 'City Center Inn Paris',
      destination: 'Paris',
      rating: 3.5,
      price: 120,
      priceCategory: 'budget',
      address: '42 Rue de Rivoli, 75004 Paris, France',
      description: 'Affordable hotel in a central location, perfect for exploring Paris on a budget.',
      amenities: ['Free Wi-Fi', 'Breakfast', 'Air Conditioning', '24-hour Reception'],
      image: '/images/hotel-paris-budget.jpg',
      gallery: [
        '/images/paris-hotel-budget-1.jpg',
        '/images/paris-hotel-budget-2.jpg'
      ],
      coordinates: {
        latitude: 48.8561,
        longitude: 2.3522
      },
      reviews: [
        {
          user: 'BackpackerJane',
          rating: 4,
          date: '2023-07-10',
          comment: 'Great value for the location. Room was small but clean and comfortable.'
        },
        {
          user: 'FrugalTraveler28',
          rating: 3,
          date: '2023-06-05',
          comment: 'Decent place for the price. Breakfast was basic but adequate.'
        }
      ]
    },
    {
      id: 3,
      name: 'Tokyo Plaza Hotel',
      destination: 'Tokyo',
      rating: 4.5,
      price: 280,
      priceCategory: 'midrange',
      address: '3-7-1 Nishi-Shinjuku, Shinjuku-ku, Tokyo 160-0023, Japan',
      description: 'Modern hotel in the heart of Tokyo\'s business district with excellent transportation links.',
      amenities: ['Free Wi-Fi', 'Restaurant', 'Business Center', 'Laundry', 'Fitness Center', 'Convenience Store'],
      image: '/images/hotel-tokyo-plaza.jpg',
      gallery: [
        '/images/tokyo-hotel-plaza-1.jpg',
        '/images/tokyo-hotel-plaza-2.jpg',
        '/images/tokyo-hotel-plaza-3.jpg'
      ],
      coordinates: {
        latitude: 35.6911,
        longitude: 139.6937
      },
      reviews: [
        {
          user: 'TechTraveler',
          rating: 5,
          date: '2023-08-30',
          comment: 'Fantastic hotel with all modern amenities. The location next to Shinjuku station is perfect for exploring Tokyo.'
        },
        {
          user: 'JapanExplorer44',
          rating: 4,
          date: '2023-07-15',
          comment: 'Clean, efficient and comfortable. Staff were extremely helpful and spoke good English.'
        }
      ]
    },
    {
      id: 4,
      name: 'Roman Retreat',
      destination: 'Rome',
      rating: 4,
      price: 190,
      priceCategory: 'midrange',
      address: 'Via del Corso 123, 00186 Roma RM, Italy',
      description: 'Charming hotel in a historic building with a rooftop terrace overlooking the city.',
      amenities: ['Free Wi-Fi', 'Breakfast', 'Rooftop Terrace', 'Airport Shuttle', 'Air Conditioning', 'Bar'],
      image: '/images/hotel-rome-retreat.jpg',
      gallery: [
        '/images/rome-hotel-retreat-1.jpg',
        '/images/rome-hotel-retreat-2.jpg'
      ],
      coordinates: {
        latitude: 41.9028,
        longitude: 12.4964
      },
      reviews: [
        {
          user: 'ItalyLover88',
          rating: 4,
          date: '2023-09-05',
          comment: 'Beautiful historic hotel in the heart of Rome. The rooftop views are amazing!'
        },
        {
          user: 'EuropeTraveler',
          rating: 4,
          date: '2023-06-22',
          comment: 'Great location, easy walking distance to most major attractions. The breakfast was excellent.'
        }
      ]
    }
  ];
  
  // Reviews for destinations
  export const reviews = {
    'Paris': [
      {
        id: 1,
        user: 'TravelLover22',
        userAvatar: '/images/avatars/user1.jpg',
        rating: 5,
        date: '2023-06-15',
        title: 'A Magical Experience',
        comment: 'Paris was absolutely magical! The Eiffel Tower at night is a must-see. We spent a week exploring the city and barely scratched the surface. The food was incredible, especially the pastries from small local bakeries.',
        helpful: 42,
        images: [
          '/images/reviews/paris-review1-1.jpg',
          '/images/reviews/paris-review1-2.jpg'
        ],
        tripType: 'Couple',
        visitDate: 'May 2023'
      },
      {
        id: 2,
        user: 'WorldExplorer',
        userAvatar: '/images/avatars/user2.jpg',
        rating: 4,
        date: '2023-05-28',
        title: 'Beautiful but Crowded',
        comment: 'Great city, but a bit crowded in summer. Still worth the visit! The museums were fantastic, particularly the Musée d\'Orsay. Consider getting the Paris Museum Pass if you plan to visit multiple attractions.',
        helpful: 31,
        images: [
          '/images/reviews/paris-review2-1.jpg'
        ],
        tripType: 'Solo',
        visitDate: 'July 2023'
      },
      {
        id: 3,
        user: 'FamilyTraveler123',
        userAvatar: '/images/avatars/user3.jpg',
        rating: 5,
        date: '2023-04-12',
        title: 'Perfect Family Holiday',
        comment: 'We took our children (ages 8 and 10) to Paris and they loved it! Luxembourg Gardens was perfect for them to play while we relaxed. We also enjoyed a day trip to Disneyland Paris which was only a short train ride away.',
        helpful: 28,
        images: [
          '/images/reviews/paris-review3-1.jpg',
          '/images/reviews/paris-review3-2.jpg'
        ],
        tripType: 'Family',
        visitDate: 'April 2023'
      }
    ],
    'Tokyo': [
      {
        id: 1,
        user: 'FoodieGlobeTrotter',
        userAvatar: '/images/avatars/user4.jpg',
        rating: 5,
        date: '2023-04-10',
        title: 'Food Paradise',
        comment: 'The food scene in Tokyo is incredible! Try the ramen shops in Shinjuku and sushi at Tsukiji Outer Market. We also enjoyed exploring the different neighborhoods, each with its own unique character. The Tokyo subway system was very efficient once we figured it out.',
        helpful: 36,
        images: [
          '/images/reviews/tokyo-review1-1.jpg',
          '/images/reviews/tokyo-review1-2.jpg'
        ],
        tripType: 'Friends',
        visitDate: 'March 2023'
      },
      {
        id: 2,
        user: 'CultureSeeker',
        userAvatar: '/images/avatars/user5.jpg',
        rating: 5,
        date: '2023-03-22',
        title: 'Perfect Blend of Old and New',
        comment: 'Perfect blend of tradition and modernity. The temples were breathtaking. Don\'t miss the teamLab Borderless digital art museum - it was the highlight of our trip! The cherry blossoms in spring were also absolutely stunning.',
        helpful: 24,
        images: [
          '/images/reviews/tokyo-review2-1.jpg'
        ],
        tripType: 'Couple',
        visitDate: 'March 2023'
      }
    ],
    'Rome': [
      {
        id: 1,
        user: 'HistoryBuff',
        userAvatar: '/images/avatars/user6.jpg',
        rating: 5,
        date: '2023-05-18',
        title: 'Walking Through History',
        comment: 'Rome is like an open-air museum! The Colosseum and Roman Forum were incredible, but also check out less-visited sites like the Baths of Caracalla. Get a good pair of walking shoes as you\'ll be doing a lot of walking on cobblestone streets.',
        helpful: 41,
        images: [
          '/images/reviews/rome-review1-1.jpg',
          '/images/reviews/rome-review1-2.jpg'
        ],
        tripType: 'Solo',
        visitDate: 'April 2023'
      },
      {
        id: 2,
        user: 'ItalianFoodie',
        userAvatar: '/images/avatars/user7.jpg',
        rating: 4,
        date: '2023-06-02',
        title: 'Gelato and Ancient Ruins',
        comment: 'The food in Rome was amazing - pasta, pizza, and gelato every day! Trastevere area had great restaurants with authentic food at reasonable prices. The ancient ruins were fascinating, but summer heat was intense. Consider visiting in spring or fall.',
        helpful: 32,
        images: [
          '/images/reviews/rome-review2-1.jpg'
        ],
        tripType: 'Couple',
        visitDate: 'May 2023'
      }
    ]
  };
  // Popular travel packages
export const packages = [
    {
      id: 1,
      name: 'Romantic Paris Getaway',
      destination: 'Paris',
      duration: 5,
      price: 1499,
      pricePerPerson: true,
      currency: 'EUR',
      inclusions: ['Hotel', 'Breakfast', 'Seine Cruise', 'Eiffel Tower Skip-the-Line', 'Airport Transfers'],
      exclusions: ['Flights', 'Lunch and Dinner', 'Optional Tours', 'Travel Insurance'],
      image: '/images/package-paris.jpg',
      gallery: [
        '/images/package-paris-1.jpg',
        '/images/package-paris-2.jpg',
        '/images/package-paris-3.jpg'
      ],
      featured: true,
      description: 'Experience the romance of Paris with this 5-day package. Stay in a boutique hotel in the heart of the city, enjoy a romantic Seine River dinner cruise, skip the line at the Eiffel Tower, and explore the charming neighborhoods of Montmartre and Le Marais.',
      itinerary: [
        {
          day: 1,
          title: 'Arrival in Paris',
          description: 'Arrive at Charles de Gaulle Airport. Private transfer to your hotel. Evening free to explore nearby attractions.'
        },
        {
          day: 2,
          title: 'Eiffel Tower and Seine Cruise',
          description: 'Morning visit to the Eiffel Tower with skip-the-line tickets. Afternoon at leisure. Evening Seine River dinner cruise.'
        },
        {
          day: 3,
          title: 'Louvre and Tuileries',
          description: 'Morning visit to the Louvre Museum. Afternoon stroll through Tuileries Garden and Place de la Concorde.'
        },
        {
          day: 4,
          title: 'Montmartre and Le Marais',
          description: 'Morning walking tour of artistic Montmartre. Afternoon exploring the trendy Le Marais district.'
        },
        {
          day: 5,
          title: 'Departure',
          description: 'Breakfast at hotel. Private transfer to airport for departure.'
        }
      ],
      accommodation: {
        name: 'Boutique Hôtel Paris',
        rating: 4,
        type: 'Boutique Hotel',
        roomType: 'Deluxe Double Room'
      },
      reviews: [
        {
          user: 'HoneymoonerCouple',
          rating: 5,
          date: '2023-05-15',
          comment: 'Perfect romantic getaway! The hotel was charming and centrally located.'
        },
        {
          user: 'AnniversaryTrip',
          rating: 4,
          date: '2023-06-22',
          comment: 'Lovely package. The Seine dinner cruise was the highlight of our trip.'
        }
      ],
      bookings: 48,
      discount: 10,
      specialOffer: true,
      tags: ['Romantic', 'Culture', 'City Break']
    },
    {
      id: 2,
      name: 'Tokyo Adventure',
      destination: 'Tokyo',
      duration: 7,
      price: 2199,
      pricePerPerson: true,
      currency: 'USD',
      inclusions: ['Hotel', 'Airport Transfer', 'Mount Fuji Day Trip', 'Sushi Making Class', 'Tokyo Metro Pass'],
      exclusions: ['Flights', 'Most Meals', 'Optional Activities', 'Travel Insurance'],
      image: '/images/package-tokyo.jpg',
      gallery: [
        '/images/package-tokyo-1.jpg',
        '/images/package-tokyo-2.jpg',
        '/images/package-tokyo-3.jpg'
      ],
      featured: true,
      description: 'Discover the wonders of Tokyo with this 7-day adventure package. Experience the perfect blend of traditional Japanese culture and futuristic technology. Visit ancient temples, explore bustling markets, learn to make sushi, and take a day trip to majestic Mount Fuji.',
      itinerary: [
        {
          day: 1,
          title: 'Arrival in Tokyo',
          description: 'Arrive at Narita or Haneda Airport. Shared transfer to your hotel in Shinjuku. Welcome dinner at local izakaya.'
        },
        {
          day: 2,
          title: 'Tokyo City Tour',
          description: 'Visit Meiji Shrine, Harajuku, Shibuya Crossing, and Tokyo Skytree.'
        },
        {
          day: 3,
          title: 'Traditional Tokyo',
          description: 'Explore Asakusa, Senso-ji Temple, and take a river cruise on the Sumida River.'
        },
        {
          day: 4,
          title: 'Mount Fuji Day Trip',
          description: 'Full-day excursion to Mount Fuji and Hakone including a lake cruise and cable car ride.'
        },
        {
          day: 5,
          title: 'Sushi and Tsukiji',
          description: 'Morning visit to Tsukiji Outer Market followed by a sushi-making class.'
        },
        {
          day: 6,
          title: 'Free Day in Tokyo',
          description: 'Free day to explore Tokyo at your own pace or take optional tours.'
        },
        {
          day: 7,
          title: 'Departure',
          description: 'Breakfast at hotel. Shared transfer to airport for departure.'
        }
      ],
      accommodation: {
        name: 'Tokyo Modern Hotel',
        rating: 4,
        type: 'Modern Hotel',
        roomType: 'Superior Room'
      },
      reviews: [
        {
          user: 'JapanEnthusiast',
          rating: 5,
          date: '2023-04-10',
          comment: 'Amazing experience! The Mount Fuji day trip was breathtaking.'
        },
        {
          user: 'FirstTimeAsia',
          rating: 4,
          date: '2023-03-18',
          comment: 'Great introduction to Tokyo. The sushi class was fun and delicious!'
        }
      ],
      bookings: 35,
      discount: 0,
      specialOffer: false,
      tags: ['Adventure', 'Culture', 'Food']
    },
    {
      id: 3,
      name: 'Historical Rome Experience',
      destination: 'Rome',
      duration: 6,
      price: 1699,
      pricePerPerson: true,
      currency: 'EUR',
      inclusions: ['Hotel', 'Breakfast', 'Colosseum Tour', 'Vatican Visit', 'Roman Food Tour'],
      exclusions: ['Flights', 'Lunch and Dinner (except food tour)', 'Optional Tours', 'City Tax'],
      image: '/images/package-rome.jpg',
      gallery: [
        '/images/package-rome-1.jpg',
        '/images/package-rome-2.jpg',
        '/images/package-rome-3.jpg'
      ],
      featured: false,
      description: 'Step back in time with this 6-day historical journey through Rome. Explore ancient ruins, visit the Vatican Museums, enjoy authentic Italian cuisine, and discover the eternal city\'s hidden gems with expert local guides.',
      itinerary: [
        {
          day: 1,
          title: 'Arrival in Rome',
          description: 'Arrive at Rome Fiumicino Airport. Private transfer to your centrally located hotel. Evening orientation walk.'
        },
        {
          day: 2,
          title: 'Ancient Rome',
          description: 'Morning guided tour of the Colosseum, Roman Forum, and Palatine Hill with skip-the-line access.'
        },
        {
          day: 3,
          title: 'Vatican and St. Peter\'s',
          description: 'Full-day tour of Vatican Museums, Sistine Chapel, and St. Peter\'s Basilica with expert guide.'
        },
        {
          day: 4,
          title: 'Roman Food Experience',
          description: 'Evening food tour through Trastevere district sampling authentic Roman cuisine and wine.'
        },
        {
          day: 5,
          title: 'Rome\'s Fountains and Piazzas',
          description: 'Walking tour of Rome\'s famous piazzas and fountains including Trevi Fountain and Spanish Steps.'
        },
        {
          day: 6,
          title: 'Departure',
          description: 'Breakfast at hotel. Private transfer to airport for departure.'
        }
      ],
      accommodation: {
        name: 'Hotel Roma Centrale',
        rating: 4,
        type: 'Boutique Hotel',
        roomType: 'Classic Room'
      },
      reviews: [
        {
          user: 'HistoryFan',
          rating: 5,
          date: '2023-05-20',
          comment: 'Excellent historical tours with knowledgeable guides. Perfect for history lovers!'
        },
        {
          user: 'ItalianFoodie',
          rating: 5,
          date: '2023-04-15',
          comment: 'The food tour was the highlight! Amazing pasta and wine in Trastevere.'
        }
      ],
      bookings: 29,
      discount: 15,
      specialOffer: true,
      tags: ['History', 'Culture', 'Food']
    }
  ];
  
  // Weather data for different cities
export const weatherData = {
    'Paris': [
      { month: 'Jan', avgTemp: 5, precipitation: 18, condition: 'Cloudy' },
      { month: 'Feb', avgTemp: 6, precipitation: 16, condition: 'Cloudy' },
      { month: 'Mar', avgTemp: 9, precipitation: 15, condition: 'Partly Cloudy' },
      { month: 'Apr', avgTemp: 12, precipitation: 17, condition: 'Partly Cloudy' },
      { month: 'May', avgTemp: 16, precipitation: 20, condition: 'Partly Cloudy' },
      { month: 'Jun', avgTemp: 19, precipitation: 22, condition: 'Sunny' },
      { month: 'Jul', avgTemp: 21, precipitation: 21, condition: 'Sunny' },
      { month: 'Aug', avgTemp: 21, precipitation: 20, condition: 'Sunny' },
      { month: 'Sep', avgTemp: 18, precipitation: 17, condition: 'Partly Cloudy' },
      { month: 'Oct', avgTemp: 14, precipitation: 19, condition: 'Partly Cloudy' },
      { month: 'Nov', avgTemp: 9, precipitation: 21, condition: 'Cloudy' },
      { month: 'Dec', avgTemp: 6, precipitation: 20, condition: 'Cloudy' }
    ],
    'Tokyo': [
      { month: 'Jan', avgTemp: 6, precipitation: 48, condition: 'Cloudy' },
      { month: 'Feb', avgTemp: 6, precipitation: 60, condition: 'Cloudy' },
      { month: 'Mar', avgTemp: 9, precipitation: 100, condition: 'Rainy' },
      { month: 'Apr', avgTemp: 14, precipitation: 130, condition: 'Partly Cloudy' },
      { month: 'May', avgTemp: 19, precipitation: 138, condition: 'Partly Cloudy' },
      { month: 'Jun', avgTemp: 22, precipitation: 186, condition: 'Rainy' },
      { month: 'Jul', avgTemp: 26, precipitation: 128, condition: 'Sunny' },
      { month: 'Aug', avgTemp: 27, precipitation: 147, condition: 'Sunny' },
      { month: 'Sep', avgTemp: 24, precipitation: 181, condition: 'Rainy' },
      { month: 'Oct', avgTemp: 18, precipitation: 163, condition: 'Partly Cloudy' },
      { month: 'Nov', avgTemp: 13, precipitation: 93, condition: 'Partly Cloudy' },
      { month: 'Dec', avgTemp: 8, precipitation: 48, condition: 'Cloudy' }
    ],
    'Rome': [
      { month: 'Jan', avgTemp: 8, precipitation: 83, condition: 'Cloudy' },
      { month: 'Feb', avgTemp: 9, precipitation: 75, condition: 'Cloudy' },
      { month: 'Mar', avgTemp: 11, precipitation: 65, condition: 'Partly Cloudy' },
      { month: 'Apr', avgTemp: 14, precipitation: 62, condition: 'Partly Cloudy' },
      { month: 'May', avgTemp: 18, precipitation: 48, condition: 'Sunny' },
      { month: 'Jun', avgTemp: 22, precipitation: 34, condition: 'Sunny' },
      { month: 'Jul', avgTemp: 25, precipitation: 19, condition: 'Sunny' },
      { month: 'Aug', avgTemp: 25, precipitation: 22, condition: 'Sunny' },
      { month: 'Sep', avgTemp: 22, precipitation: 68, condition: 'Partly Cloudy' },
      { month: 'Oct', avgTemp: 17, precipitation: 94, condition: 'Partly Cloudy' },
      { month: 'Nov', avgTemp: 12, precipitation: 115, condition: 'Rainy' },
      { month: 'Dec', avgTemp: 9, precipitation: 97, condition: 'Cloudy' }
    ],
    'New York': [
      { month: 'Jan', avgTemp: 0, precipitation: 92, condition: 'Snowy' },
      { month: 'Feb', avgTemp: 1, precipitation: 78, condition: 'Snowy' },
      { month: 'Mar', avgTemp: 5, precipitation: 109, condition: 'Rainy' },
      { month: 'Apr', avgTemp: 11, precipitation: 106, condition: 'Rainy' },
      { month: 'May', avgTemp: 17, precipitation: 106, condition: 'Partly Cloudy' },
      { month: 'Jun', avgTemp: 22, precipitation: 112, condition: 'Partly Cloudy' },
      { month: 'Jul', avgTemp: 25, precipitation: 116, condition: 'Sunny' },
      { month: 'Aug', avgTemp: 24, precipitation: 112, condition: 'Sunny' },
      { month: 'Sep', avgTemp: 20, precipitation: 108, condition: 'Partly Cloudy' },
      { month: 'Oct', avgTemp: 14, precipitation: 111, condition: 'Partly Cloudy' },
      { month: 'Nov', avgTemp: 9, precipitation: 101, condition: 'Cloudy' },
      { month: 'Dec', avgTemp: 3, precipitation: 105, condition: 'Snowy' }
    ],
    'Barcelona': [
      { month: 'Jan', avgTemp: 9, precipitation: 41, condition: 'Partly Cloudy' },
      { month: 'Feb', avgTemp: 10, precipitation: 36, condition: 'Partly Cloudy' },
      { month: 'Mar', avgTemp: 12, precipitation: 42, condition: 'Partly Cloudy' },
      { month: 'Apr', avgTemp: 14, precipitation: 51, condition: 'Partly Cloudy' },
      { month: 'May', avgTemp: 17, precipitation: 59, condition: 'Sunny' },
      { month: 'Jun', avgTemp: 21, precipitation: 41, condition: 'Sunny' },
      { month: 'Jul', avgTemp: 24, precipitation: 27, condition: 'Sunny' },
      { month: 'Aug', avgTemp: 24, precipitation: 52, condition: 'Sunny' },
      { month: 'Sep', avgTemp: 21, precipitation: 76, condition: 'Partly Cloudy' },
      { month: 'Oct', avgTemp: 17, precipitation: 91, condition: 'Partly Cloudy' },
      { month: 'Nov', avgTemp: 13, precipitation: 59, condition: 'Partly Cloudy' },
      { month: 'Dec', avgTemp: 10, precipitation: 49, condition: 'Partly Cloudy' }
    ]
  };
  // Flight options
export const flights = [
    {
      id: 1,
      from: 'New York',
      to: 'Paris',
      airline: 'Air France',
      flightNumber: 'AF123',
      departureTime: '08:30',
      arrivalTime: '20:45',
      duration: '7h 15m',
      price: 750,
      currency: 'USD',
      cabin: 'Economy',
      stops: 0,
      departureAirport: {
        code: 'JFK',
        name: 'John F. Kennedy International Airport'
      },
      arrivalAirport: {
        code: 'CDG',
        name: 'Charles de Gaulle Airport'
      },
      aircraft: 'Boeing 777-300ER',
      amenities: ['In-flight Entertainment', 'Wi-Fi', 'Meal Service'],
      availableSeats: 23,
      baggage: {
        carry: '1 piece, 10 kg',
        checked: '1 piece, 23 kg'
      }
    },
    {
      id: 2,
      from: 'London',
      to: 'Tokyo',
      airline: 'Japan Airlines',
      flightNumber: 'JL44',
      departureTime: '11:20',
      arrivalTime: '09:45',
      duration: '12h 25m',
      price: 1200,
      currency: 'USD',
      cabin: 'Economy',
      stops: 1,
      stopDetails: [
        {
          airport: 'Helsinki Airport',
          code: 'HEL',
          duration: '2h 15m'
        }
      ],
      departureAirport: {
        code: 'LHR',
        name: 'Heathrow Airport'
      },
      arrivalAirport: {
        code: 'NRT',
        name: 'Narita International Airport'
      },
      aircraft: 'Boeing 787 Dreamliner',
      amenities: ['In-flight Entertainment', 'Wi-Fi', 'Premium Meal Service'],
      availableSeats: 15,
      baggage: {
        carry: '1 piece, 10 kg',
        checked: '2 pieces, 23 kg each'
      }
    },
    {
      id: 3,
      from: 'Los Angeles',
      to: 'Rome',
      airline: 'Alitalia',
      flightNumber: 'AZ631',
      departureTime: '15:40',
      arrivalTime: '12:30',
      duration: '12h 50m',
      price: 900,
      currency: 'USD',
      cabin: 'Economy',
      stops: 1,
      stopDetails: [
        {
          airport: 'John F. Kennedy International Airport',
          code: 'JFK',
          duration: '1h 45m'
        }
      ],
      departureAirport: {
        code: 'LAX',
        name: 'Los Angeles International Airport'
      },
      arrivalAirport: {
        code: 'FCO',
        name: 'Leonardo da Vinci International Airport'
      },
      aircraft: 'Airbus A330-200',
      amenities: ['In-flight Entertainment', 'Wi-Fi', 'Meal Service'],
      availableSeats: 18,
      baggage: {
        carry: '1 piece, 8 kg',
        checked: '1 piece, 23 kg'
      }
    },
    {
      id: 4,
      from: 'Paris',
      to: 'New York',
      airline: 'Delta Airlines',
      flightNumber: 'DL213',
      departureTime: '10:15',
      arrivalTime: '13:05',
      duration: '8h 50m',
      price: 780,
      currency: 'USD',
      cabin: 'Economy',
      stops: 0,
      departureAirport: {
        code: 'CDG',
        name: 'Charles de Gaulle Airport'
      },
      arrivalAirport: {
        code: 'JFK',
        name: 'John F. Kennedy International Airport'
      },
      aircraft: 'Boeing 777-200LR',
      amenities: ['In-flight Entertainment', 'Wi-Fi', 'Meal Service'],
      availableSeats: 28,
      baggage: {
        carry: '1 piece, 10 kg',
        checked: '1 piece, 23 kg'
      }
    },
    {
      id: 5,
      from: 'Tokyo',
      to: 'London',
      airline: 'British Airways',
      flightNumber: 'BA6',
      departureTime: '12:50',
      arrivalTime: '17:20',
      duration: '12h 30m',
      price: 1150,
      currency: 'USD',
      cabin: 'Economy',
      stops: 0,
      departureAirport: {
        code: 'HND',
        name: 'Haneda Airport'
      },
      arrivalAirport: {
        code: 'LHR',
        name: 'Heathrow Airport'
      },
      aircraft: 'Boeing 777-300ER',
      amenities: ['In-flight Entertainment', 'Wi-Fi', 'Meal Service', 'Power Outlets'],
      availableSeats: 12,
      baggage: {
        carry: '1 piece, 10 kg',
        checked: '1 piece, 23 kg'
      }
    }
  ];
  
  // Transportation options
  export const transportOptions = {
    'Paris': {
      public: [
        {
          type: 'Metro',
          description: 'Extensive underground metro system with 16 lines covering most of Paris.',
          price: '€1.90 per ticket, €14.90 for 10 tickets',
          hours: '5:30am - 1:15am (2:15am on weekends)',
          website: 'https://www.ratp.fr/en',
          tips: 'Consider buying a Paris Visite pass for unlimited travel.',
          image: '/images/paris-metro.jpg'
        },
        {
          type: 'Bus',
          description: 'Comprehensive bus network with scenic routes through the city.',
          price: '€1.90 per ticket, €14.90 for 10 tickets',
          hours: '5:30am - 12:30am',
          website: 'https://www.ratp.fr/en',
          tips: 'Buses are a great way to see the city while traveling.',
          image: '/images/paris-bus.jpg'
        },
        {
          type: 'RER (Regional Train)',
          description: 'Fast train connecting Paris to suburbs and Charles de Gaulle Airport.',
          price: '€1.90 to €12.10 depending on zones',
          hours: '5:30am - 12:40am',
          website: 'https://www.ratp.fr/en',
          tips: 'Take RER B for airport transfers.',
          image: '/images/paris-rer.jpg'
        }
      ],
      rental: [
        {
          type: 'Vélib (Bike Sharing)',
          description: 'Public bicycle sharing system with stations throughout Paris.',
          price: '€5 for day pass, first 30 minutes free then €1-2 per additional 30 minutes',
          hours: '24/7',
          website: 'https://www.velib-metropole.fr/en',
          tips: 'Paris has many dedicated bike lanes. Download the Vélib app for availability.',
          image: '/images/paris-velib.jpg'
        },
        {
          type: 'Car Rental',
          description: 'Various car rental companies available, though driving in Paris can be challenging.',
          price: 'From €40 per day',
          hours: 'Varies by company',
          website: 'https://www.europcar.com, https://www.avis.com',
          tips: 'Parking is expensive and difficult to find. Not recommended for city center travel.',
          image: '/images/paris-car-rental.jpg'
        }
      ],
      taxi: [
        {
          type: 'Taxi',
          description: 'Official Paris taxis are usually white or black with a "Taxi Parisien" sign.',
          price: '€1.30 per km plus base fare of €2.60',
          hours: '24/7',
          website: 'https://www.taxis-paris.fr/',
          tips: 'Look for blue lights on top of taxis to indicate availability.',
          image: '/images/paris-taxi.jpg'
        },
        {
          type: 'Uber',
          description: 'Ridesharing service operating throughout Paris.',
          price: 'Varies by distance and demand',
          hours: '24/7',
          website: 'https://www.uber.com',
          tips: 'Often cheaper than traditional taxis, especially for longer distances.',
          image: '/images/paris-uber.jpg'
        }
      ]
    },
    'Tokyo': {
      public: [
        {
          type: 'Metro',
          description: 'Efficient subway system run by Tokyo Metro and Toei Subway.',
          price: '¥170-280 per trip depending on distance',
          hours: '5:00am - 1:00am',
          website: 'https://www.tokyometro.jp/en/',
          tips: 'Consider getting a Suica or Pasmo card for convenience.',
          image: '/images/tokyo-metro.jpg'
        },
        {
          type: 'JR Trains',
          description: 'Japan Railways network, including the convenient Yamanote Line that circles central Tokyo.',
          price: '¥140-190 per trip depending on distance',
          hours: '5:00am - 1:00am',
          website: 'https://www.jreast.co.jp/e/',
          tips: 'JR Pass for tourists can provide excellent value.',
          image: '/images/tokyo-jr.jpg'
        },
        {
          type: 'Bus',
          description: 'Extensive bus network covering areas not serviced by trains.',
          price: '¥210 flat fare within most of Tokyo',
          hours: '5:00am - 1:00am',
          website: 'https://www.kotsu.metro.tokyo.jp/eng/',
          tips: 'Buses can be difficult to navigate for non-Japanese speakers.',
          image: '/images/tokyo-bus.jpg'
        }
      ],
      rental: [
        {
          type: 'Bicycle Rental',
          description: 'Various bicycle rental shops around the city.',
          price: 'From ¥1000 per day',
          hours: 'Typically 9:00am - 6:00pm',
          website: 'https://docomo-cycle.jp/tokyo-project/ (bike sharing)',
          tips: 'Tokyo is quite bicycle-friendly, with many designated bike parking areas.',
          image: '/images/tokyo-bike.jpg'
        }
      ],
      taxi: [
        {
          type: 'Taxi',
          description: 'Clean, efficient, and plentiful taxis throughout Tokyo.',
          price: '¥410-730 base fare plus ¥80-90 per 280-288m',
          hours: '24/7',
          website: 'https://www.japantaxi.jp/en/',
          tips: 'Taxis are expensive but very reliable. Many drivers don\'t speak English.',
          image: '/images/tokyo-taxi.jpg'
        }
      ]
    }
  };
  
  // Additional country information
  export const countryInfo = {
    'France': {
      capital: 'Paris',
      language: 'French',
      currency: 'Euro (EUR, €)',
      population: 67.4,
      area: 551695,
      timezone: 'Central European Time (CET), UTC+1',
      electricity: '230V, 50Hz, Type E plug',
      phoneCode: '+33',
      drivingSide: 'right',
      visa: 'Schengen visa rules apply for non-EU citizens',
      bestTimeToVisit: 'April to June, September to October',
      majorCities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice'],
      regionalFoods: ['Baguette', 'Croissant', 'Coq au Vin', 'Bouillabaisse', 'Ratatouille'],
      flag: '/images/flags/france.png',
      map: '/images/maps/france.jpg',
      emergencyNumbers: {
        general: '112',
        police: '17',
        ambulance: '15',
        fire: '18'
      },
      travelTips: [
        'Basic French phrases are appreciated even if not fluent',
        'Tipping is not required but rounding up the bill is common',
        'Many shops close on Sundays',
        'Wine is cheaper than water in many restaurants',
        'Museum passes can save money if visiting multiple attractions'
      ]
    },
    'Japan': {
      capital: 'Tokyo',
      language: 'Japanese',
      currency: 'Japanese Yen (JPY, ¥)',
      population: 126.5,
      area: 377975,
      timezone: 'Japan Standard Time (JST), UTC+9',
      electricity: '100V, 50/60Hz, Type A and B plugs',
      phoneCode: '+81',
      drivingSide: 'left',
      visa: 'Visa-free for many Western countries for up to 90 days',
      bestTimeToVisit: 'March to May, September to November',
      majorCities: ['Tokyo', 'Osaka', 'Kyoto', 'Sapporo', 'Fukuoka'],
      regionalFoods: ['Sushi', 'Ramen', 'Tempura', 'Udon', 'Wagashi'],
      flag: '/images/flags/japan.png',
      map: '/images/maps/japan.jpg',
      emergencyNumbers: {
        general: '110',
        police: '110',
        ambulance: '119',
        fire: '119'
      },
      travelTips: [
        'Bow slightly when greeting people',
        'Tipping is not customary and can be considered rude',
        'Remove shoes when entering homes and some restaurants',
        'Avoid eating while walking (except at food stalls)',
        'Public transportation is extremely punctual'
      ]
    },
    'Italy': {
      capital: 'Rome',
      language: 'Italian',
      currency: 'Euro (EUR, €)',
      population: 60.4,
      area: 301340,
      timezone: 'Central European Time (CET), UTC+1',
      electricity: '230V, 50Hz, Type F and L plugs',
      phoneCode: '+39',
      drivingSide: 'right',
      visa: 'Schengen visa rules apply for non-EU citizens',
      bestTimeToVisit: 'April to June, September to October',
      majorCities: ['Rome', 'Milan', 'Naples', 'Turin', 'Florence'],
      regionalFoods: ['Pasta', 'Pizza', 'Risotto', 'Gelato', 'Tiramisu'],
      flag: '/images/flags/italy.png',
      map: '/images/maps/italy.jpg',
      emergencyNumbers: {
        general: '112',
        police: '113',
        ambulance: '118',
        fire: '115'
      },
      travelTips: [
        'Dress modestly when visiting churches',
        'Expect a cover charge (coperto) at restaurants',
        'Coffee culture has specific etiquette (espresso at bar)',
        'Learn basic Italian phrases',
        'Validate train tickets before boarding'
      ]
    }
  };
  // Popular activities and experiences
export const activities = {
    'Paris': [
      {
        id: 1,
        name: 'Skip-the-Line Eiffel Tower Tour',
        category: 'Tours',
        duration: 2,
        price: 65,
        currency: 'EUR',
        rating: 4.6,
        reviews: 2458,
        description: 'Skip the long lines and enjoy priority access to the Eiffel Tower with an expert guide.',
        image: '/images/activities/paris-eiffel-tour.jpg',
        availability: 'Daily, 9:00 AM and 2:00 PM',
        included: ['Priority access', 'Professional guide', 'Access to 2nd floor'],
        bookings: 156,
        popular: true
      },
      {
        id: 2,
        name: 'Louvre Museum Guided Tour',
        category: 'Museums',
        duration: 2.5,
        price: 59,
        currency: 'EUR',
        rating: 4.7,
        reviews: 1892,
        description: "Guided tour of the Louvre's masterpieces including the Mona Lisa and Venus de Milo.",        image: '/images/activities/paris-louvre-tour.jpg',
        availability: 'Tuesday to Sunday, multiple times',
        included: ['Skip-the-line entrance', 'Expert art historian guide', 'Small group (max 8)'],
        bookings: 134,
        popular: true
      },
      {
        id: 3,
        name: 'Seine River Dinner Cruise',
        category: 'Food & Drink',
        duration: 2,
        price: 89,
        currency: 'EUR',
        rating: 4.5,
        reviews: 1456,
        description: 'Romantic dinner cruise along the Seine River with views of illuminated monuments.',
        image: '/images/activities/paris-seine-dinner.jpg',
        availability: 'Daily, 8:30 PM',
        included: ['3-course gourmet dinner', 'Wine and champagne', 'Live music'],
        bookings: 98,
        popular: true
      }
    ],
    'Tokyo': [
      {
        id: 4,
        name: 'Mount Fuji Day Trip',
        category: 'Day Trips',
        duration: 10,
        price: 140,
        currency: 'USD',
        rating: 4.8,
        reviews: 1254,
        description: 'Full-day excursion to Mount Fuji and Hakone including a lake cruise and cable car.',
        image: '/images/activities/tokyo-mtfuji.jpg',
        availability: 'Monday, Wednesday, Friday, 7:30 AM',
        included: ['Transportation', 'English-speaking guide', 'Lunch', 'Lake Ashi cruise'],
        bookings: 87,
        popular: true
      },
      {
        id: 5,
        name: 'Traditional Japanese Cooking Class',
        category: 'Classes',
        duration: 3,
        price: 75,
        currency: 'USD',
        rating: 4.9,
        reviews: 876,
        description: 'Learn to make sushi, tempura, and other Japanese dishes with a professional chef.',
        image: '/images/activities/tokyo-cooking.jpg',
        availability: 'Daily, 11:00 AM and 5:00 PM',
        included: ['All ingredients', 'Cooking equipment', 'Recipe booklet', 'Meal with sake'],
        bookings: 63,
        popular: true
      }
    ],
    'Rome': [
      {
        id: 6,
        name: 'Skip-the-Line Colosseum and Ancient Rome Tour',
        category: 'Tours',
        duration: 3,
        price: 58,
        currency: 'EUR',
        rating: 4.7,
        reviews: 3254,
        description: 'Expert-guided tour of the Colosseum, Roman Forum, and Palatine Hill with priority access.',
        image: '/images/activities/rome-colosseum-tour.jpg',
        availability: 'Daily, multiple times',
        included: ['Skip-the-line tickets', 'Professional archaeologist guide', 'Headsets'],
        bookings: 178,
        popular: true
      },
      {
        id: 7,
        name: 'Vatican Museums and Sistine Chapel Fast-Track Entry',
        category: 'Museums',
        duration: 3,
        price: 54,
        currency: 'EUR',
        rating: 4.6,
        reviews: 2890,
        description: "Skip the long lines and explore the Vatican Museums, Sistine Chapel, and St. Peter's Basilica.",
        image: '/images/activities/rome-vatican-tour.jpg',
        availability: 'Monday to Saturday, multiple times',
        included: ['Fast-track entry', 'Expert guide', 'Headsets'],
        bookings: 145,
        popular: true
      }
    ]
  };
  
  // FAQ for each destination
  export const faq = {
    'Paris': [
      {
        question: 'What is the best time to visit Paris?',
        answer: 'The best time to visit Paris is from April to June and October to early November when the weather is mild and crowds are smaller. Summer (July-August) is peak tourist season with longer days but more crowds and higher prices.'
      },
      {
        question: 'How many days do I need in Paris?',
        answer: 'A minimum of 3-4 days is recommended to explore the main attractions of Paris. If you want to include day trips to Versailles or other nearby destinations, consider staying for 5-7 days.'
      },
      {
        question: 'Is Paris expensive?',
        answer: 'Paris can be expensive, but there are ways to visit on a budget. Many museums offer free admission on the first Sunday of each month, and the city has numerous affordable bistros and bakeries. Public transportation is efficient and more economical than taxis.'
      },
      {
        question: 'Is it necessary to speak French in Paris?',
        answer: 'While many Parisians in tourist areas speak English, learning a few basic French phrases is greatly appreciated and can enhance your experience. Simple greetings like "Bonjour" (hello) and "Merci" (thank you) go a long way.'
      },
      {
        question: 'What are the must-see attractions in Paris?',
        answer: "Must-see attractions include the Eiffel Tower, Louvre Museum, Notre-Dame Cathedral (exterior during renovation), Montmartre and Sacré-Cœur, Musée d'Orsay, Arc de Triomphe, and a Seine River cruise."
      }
    ],
    'Tokyo': [
      {
        question: 'What is the best time to visit Tokyo?',
        answer: 'The best times to visit Tokyo are spring (March to May) for cherry blossoms and fall (September to November) for pleasant weather and autumn colors. Avoid the rainy season (June) and the hot, humid summer (July-August) if possible.'
      },
      {
        question: 'Is Tokyo expensive?',
        answer: "Tokyo can be expensive, but it's possible to visit on a budget. Affordable options include staying in business hotels or hostels, eating at ramen shops and conveyor belt sushi restaurants, and using public transportation instead of taxis."
      },
      {
        question: 'How do I get around Tokyo?',
        answer: 'Tokyo has an extensive and efficient public transportation system. The JR Yamanote Line loops around central Tokyo, connecting major areas. The subway system is comprehensive but can be confusing. Consider getting a Suica or Pasmo card for convenient travel on all lines.'
      },
      {
        question: 'Do people speak English in Tokyo?',
        answer: "English is not widely spoken in Tokyo, though you'll find more English speakers in tourist areas, hotels, and major attractions. Learning a few basic Japanese phrases is helpful. Many signs and announcements in stations and trains are in English."
      },
      {
        question: 'What are the must-see attractions in Tokyo?',
        answer: 'Must-see attractions include Senso-ji Temple in Asakusa, the Meiji Shrine, Tokyo Skytree, Shibuya Crossing, Shinjuku Gyoen National Garden, teamLab Borderless digital art museum, and the Imperial Palace grounds.'
      }
    ],
    'Rome': [
      {
        question: 'What is the best time to visit Rome?',
        answer: 'The best times to visit Rome are from April to May and from September to October when temperatures are comfortable and crowds are smaller. Summer (June-August) is hot and crowded, while winter offers fewer tourists but cooler temperatures.'
      },
      {
        question: 'How many days should I spend in Rome?',
        answer: "At least 3 full days are recommended to see Rome's main attractions. Add more days if you want to explore at a leisurely pace or take day trips to places like Pompeii, Florence, or the Amalfi Coast."
      },
      {
        question: 'Is Rome walkable?',
        answer: "Rome's historic center is quite walkable, and exploring on foot is one of the best ways to discover hidden gems. However, distances between some major attractions can be significant, so consider using public transportation or taxis occasionally."
      },
      {
        question: 'What should I wear when visiting churches in Rome?',
        answer: "When visiting churches in Rome, including St. Peter's Basilica, dress modestly. Shoulders, knees, and midriffs should be covered for both men and women. In summer, bring a light scarf to cover shoulders if needed."
      },
      {
        question: 'Is the Roma Pass worth it?',
        answer: 'The Roma Pass can be worth it if you plan to visit multiple museums and use public transportation frequently. The 72-hour pass includes free entry to 2 museums and all public transport, plus discounts at other sites.'
      }
    ]
  };
  
  // Seasonal events and festivals
  export const events = {
    'Paris': [
      {
        name: 'Paris Fashion Week',
        months: ['January', 'March', 'June', 'September'],
        description: "One of the world's most important fashion events, showcasing upcoming collections from top designers.",
        image: '/images/events/paris-fashion-week.jpg'
      },
      {
        name: 'Bastille Day',
        months: ['July'],
        description: "France's National Day on July 14th, featuring military parades, fireworks, and public celebrations.",
        image: '/images/events/paris-bastille-day.jpg'
      },
      {
        name: 'Nuit Blanche',
        months: ['October'],
        description: 'An all-night arts festival when museums, galleries, and public spaces stay open late with special installations.',
        image: '/images/events/paris-nuit-blanche.jpg'
      },
      {
        name: 'Christmas Markets',
        months: ['November', 'December'],
        description: 'Festive markets throughout the city selling crafts, food, and mulled wine.',
        image: '/images/events/paris-christmas-markets.jpg'
      }
    ],
    'Tokyo': [
      {
        name: 'Cherry Blossom (Sakura) Season',
        months: ['March', 'April'],
        description: 'When cherry trees bloom throughout the city, and locals celebrate with hanami (flower viewing) parties.',
        image: '/images/events/tokyo-sakura.jpg'
      },
      {
        name: 'Sanja Matsuri',
        months: ['May'],
        description: "One of Tokyo's three major Shinto festivals, centered around Asakusa Shrine.",
        image: '/images/events/tokyo-sanja-matsuri.jpg'
      },
      {
        name: 'Sumida River Fireworks Festival',
        months: ['July'],
        description: 'Spectacular fireworks display over the Sumida River, a tradition since the 18th century.',
        image: '/images/events/tokyo-fireworks.jpg'
      },
      {
        name: 'Tokyo International Film Festival',
        months: ['October', 'November'],
        description: "Asia's largest film festival showcasing Japanese and international cinema.",
        image: '/images/events/tokyo-film-festival.jpg'
      }
    ],
    'Rome': [
      {
        name: 'Festa della Repubblica',
        months: ['June'],
        description: "Italy's Republic Day on June 2nd, celebrated with military parades and events.",
        image: '/images/events/rome-repubblica.jpg'
      },
      {
        name: 'Estate Romana',
        months: ['June', 'July', 'August', 'September'],
        description: 'Summer festival with concerts, film screenings, and cultural events throughout the city.',
        image: '/images/events/rome-estate-romana.jpg'
      },
      {
        name: 'Roma Europa Festival',
        months: ['September', 'October', 'November'],
        description: 'Contemporary performing arts festival featuring theater, dance, music, and digital arts.',
        image: '/images/events/rome-europa-festival.jpg'
      },
      {
        name: 'Christmas and Epiphany Celebrations',
        months: ['December', 'January'],
        description: 'Religious processions, Christmas markets, and the arrival of La Befana for Epiphany on January 6th.',
        image: '/images/events/rome-christmas.jpg'
      }
    ]
  };
  
  // Language phrases for travelers
  export const languagePhrases = {
    'French': [
      { phrase: 'Hello', translation: 'Bonjour', pronunciation: 'bohn-ZHOOR' },
      { phrase: 'Goodbye', translation: 'Au revoir', pronunciation: 'oh ruh-VWAHR' },
      { phrase: 'Please', translation: 'S\'il vous plaît', pronunciation: 'seel voo PLEH' },
      { phrase: 'Thank you', translation: 'Merci', pronunciation: 'mehr-SEE' },
      { phrase: 'Yes', translation: 'Oui', pronunciation: 'WEE' },
      { phrase: 'No', translation: 'Non', pronunciation: 'NON' },
      { phrase: 'Excuse me', translation: 'Excusez-moi', pronunciation: 'ex-koo-zay MWAH' },
      { phrase: 'Do you speak English?', translation: 'Parlez-vous anglais?', pronunciation: 'par-lay VOO on-GLAY' },
      { phrase: 'I don\'t understand', translation: 'Je ne comprends pas', pronunciation: 'zhuh nuh kom-PRON pah' },
      { phrase: 'Where is...?', translation: 'Où est...?', pronunciation: 'oo EH' },
      { phrase: 'How much?', translation: 'Combien?', pronunciation: 'kom-BYEN' },
      { phrase: 'The bill, please', translation: 'L\'addition, s\'il vous plaît', pronunciation: 'lah-dee-see-YON seel voo PLEH' }
    ],
    'Japanese': [
      { phrase: 'Hello', translation: 'Konnichiwa', pronunciation: 'kohn-nee-chee-wah' },
      { phrase: 'Goodbye', translation: 'Sayonara', pronunciation: 'sah-yoh-nah-rah' },
      { phrase: 'Please', translation: 'Onegaishimasu', pronunciation: 'oh-neh-gai-shee-mahs' },
      { phrase: 'Thank you', translation: 'Arigatō', pronunciation: 'ah-ree-gah-toh' },
      { phrase: 'Yes', translation: 'Hai', pronunciation: 'hai' },
      { phrase: 'No', translation: 'Iie', pronunciation: 'ee-eh' },
      { phrase: 'Excuse me', translation: 'Sumimasen', pronunciation: 'soo-mee-mah-sen' },
      { phrase: 'Do you speak English?', translation: 'Eigo o hanasemasu ka?', pronunciation: 'ay-go oh hah-nah-say-mahs kah' },
      { phrase: 'I don\'t understand', translation: 'Wakarimasen', pronunciation: 'wah-kah-ree-mah-sen' },
      { phrase: 'Where is...?', translation: '... wa doko desu ka?', pronunciation: 'wah doh-koh dehs kah' },
      { phrase: 'How much?', translation: 'Ikura desu ka?', pronunciation: 'ee-koo-rah dehs kah' },
      { phrase: 'The bill, please', translation: 'Okaikei onegaishimasu', pronunciation: 'oh-kai-kay oh-neh-gai-shee-mahs' }
    ],
    'Italian': [
      { phrase: 'Hello', translation: 'Ciao', pronunciation: 'chow' },
      { phrase: 'Goodbye', translation: 'Arrivederci', pronunciation: 'ah-ree-veh-DEHR-chee' },
      { phrase: 'Please', translation: 'Per favore', pronunciation: 'pehr fah-VOH-reh' },
      { phrase: 'Thank you', translation: 'Grazie', pronunciation: 'GRAH-tsee-eh' },
      { phrase: 'Yes', translation: 'Sì', pronunciation: 'see' },
      { phrase: 'No', translation: 'No', pronunciation: 'noh' },
      { phrase: 'Excuse me', translation: 'Scusi', pronunciation: 'SKOO-zee' },
      { phrase: 'Do you speak English?', translation: 'Parla inglese?', pronunciation: 'PAR-lah een-GLAY-zay' },
      { phrase: 'I don\'t understand', translation: 'Non capisco', pronunciation: 'nohn kah-PEE-skoh' },
      { phrase: 'Where is...?', translation: 'Dov\'è...?', pronunciation: 'doh-VEH' },
      { phrase: 'How much?', translation: 'Quanto costa?', pronunciation: 'KWAHN-toh KOHS-tah' },
      { phrase: 'The bill, please', translation: 'Il conto, per favore', pronunciation: 'eel KOHN-toh, pehr fah-VOH-reh' }
    ]
  };

// Travel tips by category
export const travelTips = {
    'Packing': [
      {
        title: 'Pack Light',
        description: 'Try to pack only what you need and leave room for souvenirs. Rolling clothes saves space and prevents wrinkles.',
        category: 'Packing',
        icon: 'luggage'
      },
      {
        title: 'Essential Documents',
        description: 'Keep a digital and physical copy of your passport, travel insurance, and hotel reservations.',
        category: 'Packing',
        icon: 'document'
      },
      {
        title: 'Adapters and Chargers',
        description: 'Research the plug type at your destination and pack appropriate adapters for your electronics.',
        category: 'Packing',
        icon: 'power'
      }
    ],
    'Budget': [
      {
        title: 'Currency Exchange',
        description: 'Avoid airport currency exchanges; use ATMs at your destination for better rates.',
        category: 'Budget',
        icon: 'money'
      },
      {
        title: 'Track Expenses',
        description: 'Use a travel budgeting app to keep track of expenses in real-time during your trip.',
        category: 'Budget',
        icon: 'calculator'
      },
      {
        title: 'Free Attractions',
        description: 'Research free museum days, walking tours, and public parks to save on entertainment costs.',
        category: 'Budget',
        icon: 'museum'
      }
    ],
    'Safety': [
      {
        title: 'Emergency Numbers',
        description: 'Save local emergency numbers on your phone and know your country\'s embassy location.',
        category: 'Safety',
        icon: 'emergency'
      },
      {
        title: 'Secure Valuables',
        description: 'Use hotel safes, anti-theft bags, and be extra vigilant in crowded tourist areas.',
        category: 'Safety',
        icon: 'lock'
      },
      {
        title: 'Travel Insurance',
        description: 'Always get comprehensive travel insurance that covers medical emergencies and trip cancellations.',
        category: 'Safety',
        icon: 'insurance'
      }
    ],
    'Food': [
      {
        title: 'Local Cuisine',
        description: 'Try local specialties and eat where locals eat for authentic culinary experiences.',
        category: 'Food',
        icon: 'restaurant'
      },
      {
        title: 'Food Allergies',
        description: 'Learn how to communicate your food allergies in the local language or bring allergy translation cards.',
        category: 'Food',
        icon: 'allergen'
      },
      {
        title: 'Water Safety',
        description: 'Research if tap water is safe to drink at your destination or stick to bottled water if uncertain.',
        category: 'Food',
        icon: 'water'
      }
    ],
    'Technology': [
      {
        title: 'Offline Maps',
        description: 'Download offline maps and city guides to save data and have information accessible without internet.',
        category: 'Technology',
        icon: 'map'
      },
      {
        title: 'Communication Apps',
        description: 'Install WhatsApp, Skype, or other VoIP apps for free calls over Wi-Fi.',
        category: 'Technology',
        icon: 'phone'
      },
      {
        title: 'Battery Life',
        description: 'Bring a portable power bank to keep your devices charged during long days of sightseeing.',
        category: 'Technology',
        icon: 'battery'
      }
    ]
  };
  
  // Packing lists by trip type
  export const packingLists = {
    'Beach Vacation': [
      { item: 'Swimwear', category: 'Clothing', essential: true },
      { item: 'Beach towel', category: 'Accessories', essential: true },
      { item: 'Sunscreen', category: 'Toiletries', essential: true },
      { item: 'Sunglasses', category: 'Accessories', essential: true },
      { item: 'Hat or sun visor', category: 'Accessories', essential: true },
      { item: 'Flip-flops or sandals', category: 'Footwear', essential: true },
      { item: 'Light, breathable clothing', category: 'Clothing', essential: true },
      { item: 'Beach bag', category: 'Accessories', essential: false },
      { item: 'Aloe vera gel', category: 'Toiletries', essential: false },
      { item: 'Insect repellent', category: 'Toiletries', essential: true },
      { item: 'Water shoes', category: 'Footwear', essential: false },
      { item: 'Snorkeling gear', category: 'Activities', essential: false },
      { item: 'Waterproof phone case', category: 'Electronics', essential: false },
      { item: 'E-reader or books', category: 'Entertainment', essential: false },
      { item: 'Waterproof bluetooth speaker', category: 'Electronics', essential: false }
    ],
    'City Break': [
      { item: 'Comfortable walking shoes', category: 'Footwear', essential: true },
      { item: 'Weather-appropriate clothing', category: 'Clothing', essential: true },
      { item: 'Day bag or small backpack', category: 'Accessories', essential: true },
      { item: 'City map or guidebook', category: 'Navigation', essential: false },
      { item: 'Camera', category: 'Electronics', essential: false },
      { item: 'Phone charger', category: 'Electronics', essential: true },
      { item: 'Travel adapter', category: 'Electronics', essential: true },
      { item: 'Portable power bank', category: 'Electronics', essential: false },
      { item: 'Water bottle', category: 'Accessories', essential: true },
      { item: 'Light jacket or sweater', category: 'Clothing', essential: false },
      { item: 'Umbrella', category: 'Accessories', essential: false },
      { item: 'Travel pillow (for transport)', category: 'Accessories', essential: false },
      { item: 'Medication', category: 'Health', essential: true },
      { item: 'Passport and ID', category: 'Documents', essential: true },
      { item: 'Credit cards and cash', category: 'Money', essential: true }
    ],
    'Winter Sports': [
      { item: 'Ski/snowboard gear', category: 'Equipment', essential: true },
      { item: 'Thermal base layers', category: 'Clothing', essential: true },
      { item: 'Ski jacket and pants', category: 'Clothing', essential: true },
      { item: 'Warm mid-layers', category: 'Clothing', essential: true },
      { item: 'Waterproof gloves', category: 'Accessories', essential: true },
      { item: 'Warm hat', category: 'Accessories', essential: true },
      { item: 'Thermal socks', category: 'Clothing', essential: true },
      { item: 'Snow boots', category: 'Footwear', essential: true },
      { item: 'Ski goggles', category: 'Accessories', essential: true },
      { item: 'Sunscreen', category: 'Toiletries', essential: true },
      { item: 'Lip balm with SPF', category: 'Toiletries', essential: true },
      { item: 'Neck gaiter or scarf', category: 'Accessories', essential: false },
      { item: 'Hand and toe warmers', category: 'Accessories', essential: false },
      { item: 'Helmet', category: 'Safety', essential: true },
      { item: 'First aid kit', category: 'Health', essential: true }
    ],
    'Backpacking': [
      { item: 'Backpack (40-60L)', category: 'Equipment', essential: true },
      { item: 'Lightweight, quick-dry clothing', category: 'Clothing', essential: true },
      { item: 'Hiking boots', category: 'Footwear', essential: true },
      { item: 'Travel towel', category: 'Toiletries', essential: true },
      { item: 'Universal sink plug', category: 'Toiletries', essential: false },
      { item: 'Travel detergent', category: 'Toiletries', essential: false },
      { item: 'Sleeping bag or liner', category: 'Equipment', essential: false },
      { item: 'Travel security belt', category: 'Accessories', essential: false },
      { item: 'Padlock', category: 'Security', essential: true },
      { item: 'Travel adapter', category: 'Electronics', essential: true },
      { item: 'Headlamp or flashlight', category: 'Equipment', essential: false },
      { item: 'Water purification tablets', category: 'Health', essential: false },
      { item: 'First aid kit', category: 'Health', essential: true },
      { item: 'Multi-tool', category: 'Tools', essential: false },
      { item: 'Duct tape', category: 'Tools', essential: false }
    ]
  };
  // יבוא מהיר למי שצריך את כל הנתונים
const mockData = {
    destinations,
    popularDestinations,
    featuredTrips,
    attractions,
    hotels,
    reviews,
    packages,
    weatherData,
    flights,
    transportOptions,
    countryInfo,
    activities,
    faq,
    events,
    languagePhrases,
    travelTips,
    packingLists
  };
  
  export default mockData;