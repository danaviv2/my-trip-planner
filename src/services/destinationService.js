// This file contains mock API services for destinations
// In a real application, these would call actual API endpoints

// Mock data for destinations
const mockDestinations = [
    {
      id: '1',
      name: 'Paris',
      country: 'France',
      description: 'Known as the City of Light, Paris is famous for its iconic Eiffel Tower, world-class museums like the Louvre, and charming boulevards lined with cafes. The city offers unparalleled architecture, fashion, cuisine, and a romantic atmosphere that has captivated visitors for centuries.',
      images: [
        { 
          url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
          caption: 'Eiffel Tower at sunset'
        },
        { 
          url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a',
          caption: 'Arc de Triomphe'
        },
        { 
          url: 'https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94',
          caption: 'Seine River and Notre-Dame'
        },
        { 
          url: 'https://images.unsplash.com/photo-1460904041914-f2b315f93560',
          caption: 'Louvre Museum'
        },
        { 
          url: 'https://images.unsplash.com/photo-1546783972-f80bdb352fea',
          caption: 'Montmartre streets'
        },
        { 
          url: 'https://images.unsplash.com/photo-1550340499-a6c60cc328fd',
          caption: 'Parisian cafe culture'
        }
      ],
      rating: 4.7,
      languages: ['French', 'English'],
      currency: 'Euro (€)',
      timeZone: 'GMT+1',
      averagePrice: 4,
      climate: 'Temperate, with mild summers and cool winters',
      emergencyContact: '112',
      bestTimeToVisit: 'Spring (April to June) and Fall (September to October) offer pleasant weather and fewer crowds. Summer is peak tourist season.',
      activities: [
        {
          id: 'p1',
          name: 'Eiffel Tower Skip-the-Line Tour',
          type: 'tour',
          description: "Skip the lines and enjoy priority access to the Eiffel Tower with an expert guide explaining the monument's fascinating history.",
          duration: '2-3 hours',
          price: 65,
          rating: 4.8,
          reviewCount: 2418,
          image: 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e'
        },
        {
          id: 'p2',
          name: 'Seine River Dinner Cruise',
          type: 'boat',
          description: "Enjoy a luxurious dinner while cruising along the Seine River, taking in illuminated views of Paris's most famous landmarks.",
          duration: '2 hours',
          price: 85,
          rating: 4.6,
          reviewCount: 1876,
          image: 'https://images.unsplash.com/photo-1503917988258-f87a78e3c995'
        },
        {
          id: 'p3',
          name: 'Louvre Museum Guided Tour',
          type: 'museum',
          description: "Discover masterpieces like the Mona Lisa with an art historian guiding you through the world's most visited museum.",
          duration: '3 hours',
          price: 59,
          rating: 4.9,
          reviewCount: 3240,
          image: 'https://images.unsplash.com/photo-1525803246243-ea719ea7da78'
        },
        {
          id: 'p4',
          name: 'Montmartre Walking Tour',
          type: 'tour',
          description: 'Explore the charming historic district of Montmartre, famous for its artists, Sacré-Cœur Basilica, and spectacular city views.',
          duration: '2.5 hours',
          price: 35,
          rating: 4.7,
          reviewCount: 2105,
          image: 'https://images.unsplash.com/photo-1550340499-a6c60cc328fd'
        }
      ]
    },
    {
      id: '2',
      name: 'Tokyo',
      country: 'Japan',
      description: 'Tokyo is a city of fascinating contrasts, where ancient traditions blend seamlessly with cutting-edge technology and innovation. From serene temples to bustling neon-lit districts, Tokyo offers visitors an unforgettable journey through Japanese culture, cuisine, and hospitality.',
      images: [
        { 
          url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf',
          caption: 'Tokyo skyline with Mt. Fuji'
        },
        { 
          url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26',
          caption: 'Shibuya Crossing'
        },
        { 
          url: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65',
          caption: 'Sensoji Temple'
        },
        { 
          url: 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d',
          caption: 'Akihabara Electric Town'
        },
        { 
          url: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186',
          caption: 'Traditional Japanese garden'
        }
      ],
      rating: 4.8,
      languages: ['Japanese', 'Limited English'],
      currency: 'Japanese Yen (¥)',
      timeZone: 'GMT+9',
      averagePrice: 4,
      climate: 'Four distinct seasons with hot, humid summers and relatively mild winters',
      emergencyContact: '119',
      bestTimeToVisit: 'Spring (March to May) for cherry blossoms and Fall (September to November) for autumn colors. Avoid the rainy season in June.',
      activities: [
        {
          id: 't1',
          name: 'Tsukiji Fish Market Tour',
          type: 'tour',
          description: 'Explore the world-famous seafood market with a local guide and sample some of the freshest sushi for breakfast.',
          duration: '3 hours',
          price: 75,
          rating: 4.8,
          reviewCount: 1530,
          image: 'https://images.unsplash.com/photo-1580377968103-84cadc052fab'
        },
        {
          id: 't2',
          name: 'Tokyo Skytree Observation Deck',
          type: 'tour',
          description: "Experience breathtaking panoramic views of Tokyo from one of the world's tallest towers.",
          duration: '1-2 hours',
          price: 25,
          rating: 4.5,
          reviewCount: 3102,
          image: 'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3'
        },
        {
          id: 't3',
          name: 'Traditional Tea Ceremony',
          type: 'tour',
          description: 'Participate in an authentic Japanese tea ceremony and learn about this important cultural tradition.',
          duration: '1.5 hours',
          price: 60,
          rating: 4.9,
          reviewCount: 875,
          image: 'https://images.unsplash.com/photo-1455621481073-d5bc1c40e3cb'
        },
        {
          id: 't4',
          name: 'Robot Restaurant Show',
          type: 'nightlife',
          description: 'Experience the most outrageous show in Tokyo with giant robots, dancers, and a sensory overload of lights and sounds.',
          duration: '1.5 hours',
          price: 80,
          rating: 4.3,
          reviewCount: 2290,
          image: 'https://images.unsplash.com/photo-1523207911345-32501502db22'
        }
      ]
    }
  ];
  
  // Get all destinations
  export const fetchDestinations = async (filters = {}) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Return filtered results in a real implementation
    return mockDestinations;
  };
  
  // Get a single destination by ID
  export const fetchDestinationInfo = async (id) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const destination = mockDestinations.find(dest => dest.id === id);
    
    if (!destination) {
      throw new Error('Destination not found');
    }
    
    return destination;
  };
  
  // Search destinations
  export const searchDestinations = async (query) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    if (!query) return [];
    
    const lowerQuery = query.toLowerCase();
    
    return mockDestinations.filter(dest => 
      dest.name.toLowerCase().includes(lowerQuery) || 
      dest.country.toLowerCase().includes(lowerQuery)
    );
  };
  
  // Get featured or recommended destinations
  export const fetchFeaturedDestinations = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In a real app, this would return destinations based on some criteria
    return mockDestinations;
  };
  // הוסף את זה לקובץ ה-API הקיים שלך

// מידע נוסף על היעדים עבור פונקציית getDestinationInfo
const destinationDetails = {
  'Paris': {
    name: 'Paris',
    country: 'France',
    language: 'French',
    currency: 'Euro (€)',
    bestTime: 'April-June, September-October',
    localTips: 'Consider buying a Paris Museum Pass to save money and time',
    photos: [
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200',
      'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200',
    ],
    attractions: [
      'Eiffel Tower',
      'Louvre Museum',
      'Notre-Dame Cathedral',
      'Champs-Élysées',
      'Montmartre',
    ],
    breakfasts: [
      'Café de Flore',
      'Les Deux Magots',
      'Angelina Paris',
      'Le Petit Voltaire',
    ],
    lunch: [
      'Bistrot Paul Bert',
      'Le Comptoir du Relais',
      'L\'As du Fallafel',
      'Chez L\'Ami Jean',
    ],
    dinner: [
      'Le Jules Verne',
      'Guy Savoy',
      'L\'Atelier de Joël Robuchon',
      'Septime',
    ],
    accommodations: [
      'The Ritz Paris',
      'Hôtel de Crillon',
      'Le Bristol Paris',
      'Park Hyatt Paris-Vendôme',
      'Hotel Lutetia',
    ],
    festivals: [
      {
        name: 'Bastille Day',
        date: 'July 14',
        description: 'French National Day celebrations with parades, fireworks and events throughout the city.',
      },
      {
        name: 'Nuit Blanche',
        date: 'First Saturday in October',
        description: 'All-night arts festival when museums, galleries and cultural institutions stay open all night.',
      },
      {
        name: 'Paris Fashion Week',
        date: 'January/February and September/October',
        description: 'International fashion event showcasing new collections from top designers.',
      },
    ],
  },
  
  'Tokyo': {
    name: 'Tokyo',
    country: 'Japan',
    language: 'Japanese',
    currency: 'Japanese Yen (¥)',
    bestTime: 'March-May, September-November',
    localTips: 'Get a Suica or Pasmo card for easy access to public transportation',
    photos: [
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200',
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200',
    ],
    attractions: [
      'Tokyo Skytree',
      'Meiji Shrine',
      'Senso-ji Temple',
      'Shibuya Crossing',
      'Tokyo Disneyland',
    ],
    breakfasts: [
      'Tsukiji Outer Market',
      'Omotesando Koffee',
      'Egg & Things',
      'Café Central',
    ],
    lunch: [
      'Ichiran Ramen',
      'Gonpachi',
      'Sushi Dai',
      'Afuri Ramen',
    ],
    dinner: [
      'Sukiyabashi Jiro',
      'Narisawa',
      'Den',
      'Tempura Kondo',
    ],
    accommodations: [
      'Hoshinoya Tokyo',
      'Aman Tokyo',
      'Park Hyatt Tokyo',
      'The Ritz-Carlton Tokyo',
      'Mandarin Oriental Tokyo',
    ],
    festivals: [
      {
        name: 'Cherry Blossom Festival',
        date: 'Late March to Early April',
        description: 'Celebration of cherry blossoms with picnics and special events in parks.',
      },
      {
        name: 'Sumida River Fireworks',
        date: 'Late July',
        description: 'One of Tokyo\'s most famous fireworks displays with over 20,000 fireworks.',
      },
    ],
  },
  
  // הוסף כאן יעדים נוספים אם רצוי...
};

/**
 * פונקציה לקבלת מידע על יעד לפי שם
 * @param {string} destination - שם היעד (יכול להיות שם עיר או "עיר, מדינה")
 * @returns {Promise<object>} - מידע מפורט על היעד
 */
export const getDestinationInfo = async (destination) => {
  // הדמיית השהיית API
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // הפרדת שם העיר מהמדינה אם יש
  let cityName = destination;
  if (destination.includes(',')) {
    cityName = destination.split(',')[0].trim();
  }
  
  // בדיקה בשמות באנגלית
  if (destinationDetails[cityName]) {
    return destinationDetails[cityName];
  }
  
  // בדיקה בדטה של mockDestinations
  const mockDest = mockDestinations.find(
    dest => dest.name.toLowerCase() === cityName.toLowerCase() || 
           cityName.toLowerCase().includes(dest.name.toLowerCase())
  );
  
  if (mockDest) {
    // יצירת אובייקט שתואם את הפורמט הנדרש ב-DestinationInfo
    return {
      name: mockDest.name,
      country: mockDest.country,
      language: mockDest.languages[0],
      currency: mockDest.currency,
      bestTime: mockDest.bestTimeToVisit,
      localTips: "Check local events and festivals before your trip",
      photos: mockDest.images.map(img => img.url),
      attractions: mockDest.activities.map(act => act.name),
      breakfasts: ["Local Café 1", "Local Café 2", "Local Café 3", "Local Café 4"],
      lunch: ["Local Restaurant 1", "Local Restaurant 2", "Local Restaurant 3", "Local Restaurant 4"],
      dinner: ["Fine Dining 1", "Fine Dining 2", "Fine Dining 3", "Fine Dining 4"],
      accommodations: ["Luxury Hotel 1", "Luxury Hotel 2", "Luxury Hotel 3", "Luxury Hotel 4", "Luxury Hotel 5"],
      festivals: [
        {
          name: "Local Festival",
          date: "Varies by year",
          description: "A major cultural festival. Check dates for your visit."
        },
        {
          name: "Music Event",
          date: "Summer months",
          description: "Popular music festival in the city."
        }
      ]
    };
  }
  
  // אם היעד לא נמצא, יצירת נתונים כלליים
  return createGenericInfo(destination);
};

/**
 * יצירת מידע כללי ליעד שאינו נמצא במאגר
 * @param {string} destination - שם היעד
 * @returns {Object} - מידע כללי על היעד
 */
const createGenericInfo = (destination) => {
  // ניסיון לחלץ שם מדינה אם יש
  let country = '';
  let city = destination;
  
  if (destination.includes(',')) {
    const parts = destination.split(',');
    city = parts[0].trim();
    country = parts[1].trim();
  }
  
  console.log(`יוצר מידע כללי עבור: ${city}, ${country}`);
  
  return {
    name: city,
    country: country || 'Unknown',
    language: 'Local language',
    currency: 'Local currency',
    bestTime: 'Spring and Fall generally offer pleasant weather',
    localTips: 'Research local customs and etiquette before your trip',
    photos: [
      `https://source.unsplash.com/1200x800/?${encodeURIComponent(city)}`,
      `https://source.unsplash.com/1200x800/?${encodeURIComponent(city + ' travel')}`,
    ],
    attractions: [
      'Major Attraction 1',
      'Major Attraction 2',
      'Major Attraction 3',
      'Major Attraction 4',
      'Major Attraction 5',
    ],
    breakfasts: [
      'Local Café 1',
      'Local Café 2',
      'Local Café 3',
      'Local Café 4',
    ],
    lunch: [
      'Local Restaurant 1',
      'Local Restaurant 2',
      'Local Restaurant 3',
      'Local Restaurant 4',
    ],
    dinner: [
      'Fine Dining 1',
      'Fine Dining 2',
      'Fine Dining 3',
      'Fine Dining 4',
    ],
    accommodations: [
      'Luxury Hotel 1',
      'Boutique Hotel 1',
      'Mid-range Hotel 1',
      'Budget Hotel 1',
      'Hostel 1',
    ],
    festivals: [
      {
        name: 'Local Festival',
        date: 'Varies by year',
        description: 'A major cultural festival. Check for exact dates during your visit.',
      },
      {
        name: 'Cultural Event',
        date: 'Varies by year',
        description: 'An important cultural event. Check local calendar for details.',
      },
    ],
  };
};