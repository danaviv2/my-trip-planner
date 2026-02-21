import React, { useState } from 'react';

// פונקציה שמחזירה אייקון לפי קטגוריה
const getCategoryIcon = (categoryId) => {
  const icons = {
    all: '🗺️',
    historical: '🏛️',
    museums: '🖼️',
    shopping: '🛍️',
    culture: '🎭',
    food: '🍽️',
    restaurant: '🍽️',
    cafe: '☕',
    bar: '🍺',
    museum: '🏛️',
    park: '🌳',
    hotel: '🏨',
    attraction: '🎭',
    beach: '🏖️',
    nightlife: '🌃',
    default: '📍'
  };
  
  return icons[categoryId] || icons.default;
};

const TripPlannerMapView = () => {
  // מצבים לניהול הממשק
  const [activeDay, setActiveDay] = useState(1);
  const [mapView, setMapView] = useState('route'); // 'route', 'attractions', 'satellite'
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [showBookingPanel, setShowBookingPanel] = useState(false);
  const [bookingType, setBookingType] = useState(null);
  
  // נתוני סימולציה למסלול
  const tripData = {
    title: "טיול קלאסי באיטליה",
    days: [
      {
        day: 1,
        title: "מילאנו",
        attractions: [
          { id: 1, name: "הדואומו של מילאנו", type: "אטרקציה", time: "10:00", duration: "שעתיים", category: "אתרים היסטוריים" },
          { id: 2, name: "גלריית ויטוריו עמנואלה", type: "קניות", time: "13:00", duration: "שעה", category: "קניות" },
          { id: 3, name: "טיאטרו לה סקאלה", type: "תרבות", time: "16:00", duration: "שעתיים", category: "תרבות" }
        ]
      },
      {
        day: 2,
        title: "פירנצה",
        attractions: [
          { id: 1, name: "גלריית האופיצי", type: "מוזיאון", time: "09:00", duration: "3 שעות", category: "מוזיאונים" },
          { id: 2, name: "דואומו של פירנצה", type: "אטרקציה", time: "13:00", duration: "שעה", category: "אתרים היסטוריים" },
          { id: 3, name: "גשר פונטה וקיו", type: "אטרקציה", time: "16:00", duration: "שעה", category: "אתרים היסטוריים" }
        ]
      },
      {
        day: 3,
        title: "רומא",
        attractions: [
          { id: 1, name: "הקולוסיאום", type: "אטרקציה", time: "10:00", duration: "3 שעות", category: "אתרים היסטוריים" },
          { id: 2, name: "מזרקת טרווי", type: "אטרקציה", time: "14:00", duration: "שעה", category: "אתרים היסטוריים" },
          { id: 3, name: "הפנתיאון", type: "אטרקציה", time: "16:00", duration: "שעה", category: "אתרים היסטוריים" }
        ]
      }
    ],
    hotels: [
      { id: 1, city: "מילאנו", name: "מלון פלאצו פארצי", stars: 4, price: "€180 ללילה" },
      { id: 2, city: "פירנצה", name: "מלון ריבר פאלאס", stars: 4, price: "€165 ללילה" },
      { id: 3, city: "רומא", name: "מלון נבונה", stars: 5, price: "€210 ללילה" }
    ],
    flights: [
      { id: 1, from: "תל אביב", to: "מילאנו", date: "12.04.2025", time: "08:15", duration: "4 שעות", price: "€320" },
      { id: 2, from: "רומא", to: "תל אביב", date: "19.04.2025", time: "22:30", duration: "4 שעות", price: "€340" }
    ],
    transportation: [
      { id: 1, type: "רכבת", from: "מילאנו", to: "פירנצה", date: "13.04.2025", time: "09:30", duration: "1:45 שעות", price: "€45" },
      { id: 2, type: "רכבת", from: "פירנצה", to: "רומא", date: "15.04.2025", time: "10:15", duration: "1:30 שעות", price: "€39" }
    ]
  };

  // החלפת יום פעיל
  const handleDayChange = (day) => {
    setActiveDay(day);
  };

  // שינוי תצוגת המפה
  const handleViewChange = (view) => {
    setMapView(view);
  };

  // בחירת אטרקציה
  const handleAttractionSelect = (attraction) => {
    setSelectedAttraction(attraction);
  };

  // פתיחת חלונית הזמנה
  const handleOpenBookingPanel = (type) => {
    setBookingType(type);
    setShowBookingPanel(true);
  };

  // סגירת חלונית הזמנה
  const handleCloseBookingPanel = () => {
    setShowBookingPanel(false);
    setBookingType(null);
  };

  // הנתונים של היום הנבחר
  const currentDay = tripData.days.find(day => day.day === activeDay) || tripData.days[0];
  
  // רשימת קטגוריות האטרקציות לסינון
  const attractionCategories = [
    { id: 'all', name: 'הכל', icon: '🗺️' },
    { id: 'historical', name: 'אתרים היסטוריים', icon: '🏛️' },
    { id: 'museums', name: 'מוזיאונים', icon: '🖼️' },
    { id: 'shopping', name: 'קניות', icon: '🛍️' },
    { id: 'culture', name: 'תרבות', icon: '🎭' },
    { id: 'food', name: 'אוכל', icon: '🍽️' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* כותרת המסלול */}
      <div className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{tripData.title}</h1>
            <p className="text-sm opacity-80">7 ימים • 3 ערים • 9 אטרקציות</p>
          </div>
          <div className="flex gap-3">
            <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50">
              שמור מסלול
            </button>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-400">
              שתף מסלול
            </button>
          </div>
        </div>
      </div>
      
      {/* תפריט ימים */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-2 overflow-x-auto">
          <div className="flex space-x-2 rtl:space-x-reverse">
            {tripData.days.map(day => (
              <button
                key={day.day}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeDay === day.day 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
                onClick={() => handleDayChange(day.day)}
              >
                יום {day.day}: {day.title}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* תצוגת המפה והמסלול */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* המפה */}
        <div className="w-full md:w-2/3 relative">
          {/* כפתורי בקרת מפה */}
          <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-md p-1">
            <div className="flex">
              <button 
                className={`p-2 ${mapView === 'route' ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
                onClick={() => handleViewChange('route')}
              >
                מסלול
              </button>
              <button 
                className={`p-2 ${mapView === 'attractions' ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
                onClick={() => handleViewChange('attractions')}
              >
                אטרקציות
              </button>
              <button 
                className={`p-2 ${mapView === 'satellite' ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
                onClick={() => handleViewChange('satellite')}
              >
                לווין
              </button>
            </div>
          </div>
          
          {/* כפתורי תחבורה ולינה */}
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <button 
              className="bg-white px-3 py-2 rounded-lg shadow-md font-medium text-sm flex items-center hover:bg-blue-50"
              onClick={() => handleOpenBookingPanel('flight')}
            >
              <span className="ml-1">✈️</span>
              טיסות
            </button>
            <button 
              className="bg-white px-3 py-2 rounded-lg shadow-md font-medium text-sm flex items-center hover:bg-blue-50"
              onClick={() => handleOpenBookingPanel('hotel')}
            >
              <span className="ml-1">🏨</span>
              מלונות
            </button>
            <button 
              className="bg-white px-3 py-2 rounded-lg shadow-md font-medium text-sm flex items-center hover:bg-blue-50"
              onClick={() => handleOpenBookingPanel('car')}
            >
              <span className="ml-1">🚗</span>
              רכב
            </button>
          </div>
          
          {/* קטגוריות אטרקציות */}
          <div className="absolute bottom-4 right-4 left-4 z-10">
            <div className="flex gap-2 overflow-x-auto bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-md">
              {attractionCategories.map(category => (
                <button
                  key={category.id}
                  className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700 font-medium text-sm flex items-center flex-shrink-0"
                >
                  <span className="ml-1">{getCategoryIcon(category.id)}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* תצוגת דמה של מפה */}
          <div className="w-full h-full bg-blue-50 flex items-center justify-center">
            <div className="relative w-full h-full overflow-hidden">
              {/* רקע דמה של מפה */}
              <img 
                src="https://images.unsplash.com/photo-1585146999712-7ca421b2ce11?w=1200&q=80" 
                alt="מפת איטליה"
                className="w-full h-full object-cover opacity-50"
              />
              
              {/* מסלול דמה על המפה */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative flex justify-between w-3/4 max-w-3xl">
                  {/* נקודה 1 */}
                  <div className="absolute top-24 right-10">
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold border-4 border-white shadow-xl">
                      1
                    </div>
                    <div className="absolute top-full mt-2 right-1/2 transform translate-x-1/2 bg-white px-3 py-1 rounded-lg shadow-md whitespace-nowrap">
                      <span className="font-bold">מילאנו</span>
                    </div>
                  </div>
                  
                  {/* נקודה 2 */}
                  <div className="absolute bottom-20 right-1/2 transform translate-x-1/2">
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold border-4 border-white shadow-xl">
                      2
                    </div>
                    <div className="absolute top-full mt-2 right-1/2 transform translate-x-1/2 bg-white px-3 py-1 rounded-lg shadow-md whitespace-nowrap">
                      <span className="font-bold">פירנצה</span>
                    </div>
                  </div>
                  
                  {/* נקודה 3 */}
                  <div className="absolute bottom-0 left-20">
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold border-4 border-white shadow-xl">
                      3
                    </div>
                    <div className="absolute top-full mt-2 right-1/2 transform translate-x-1/2 bg-white px-3 py-1 rounded-lg shadow-md whitespace-nowrap">
                      <span className="font-bold">רומא</span>
                    </div>
                  </div>
                  
                  {/* קווי מסלול */}
                  <svg className="absolute inset-0 w-full h-full" style={{zIndex: -1}}>
                    <path
                      d="M180,100 L400,300 L580,350"
                      stroke="#4285F4"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray="12,8"
                      fill="none"
                    />
                  </svg>
                </div>
              </div>
              
              {/* אטרקציות דמה על המפה */}
              {mapView === 'attractions' && (
                <>
                  <div className="absolute top-48 right-1/4 cursor-pointer" onClick={() => handleAttractionSelect(currentDay.attractions[0])}>
                    <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-sm border-2 border-white shadow-md">
                      A
                    </div>
                  </div>
                  <div className="absolute top-56 right-1/3 cursor-pointer" onClick={() => handleAttractionSelect(currentDay.attractions[1])}>
                    <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm border-2 border-white shadow-md">
                      B
                    </div>
                  </div>
                  <div className="absolute top-64 right-1/2 cursor-pointer" onClick={() => handleAttractionSelect(currentDay.attractions[2])}>
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm border-2 border-white shadow-md">
                      C
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* סרגל צד - רשימת אטרקציות */}
        <div className="w-full md:w-1/3 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold mb-1">יום {currentDay.day}: {currentDay.title}</h2>
            <p className="text-sm text-gray-600">
              {currentDay.attractions.length} אטרקציות מתוכננות
            </p>
          </div>
          
          {/* רשימת אטרקציות */}
          <div className="divide-y divide-gray-100">
            {currentDay.attractions.map((attraction, index) => (
              <div 
                key={attraction.id} 
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                  selectedAttraction && selectedAttraction.id === attraction.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleAttractionSelect(attraction)}
              >
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm text-white ml-3 ${
                    index === 0 ? 'bg-red-500' : index === 1 ? 'bg-orange-500' : 'bg-green-500'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{attraction.name}</h3>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs ml-2">{attraction.category}</span>
                      <span className="flex items-center ml-3">
                        <span className="ml-1">🕒</span>
                        {attraction.time}
                      </span>
                      <span className="flex items-center">
                        <span className="ml-1">⏱️</span>
                        {attraction.duration}
                      </span>
                    </div>
                  </div>
                  <button className="p-1 text-gray-400 hover:text-blue-500">
                    <span className="text-lg">⋮</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* כרטיסיית מלון */}
          <div className="p-4 border-t border-gray-200">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center mb-2">
                <span className="text-xl ml-2">🏨</span>
                <h3 className="font-bold">{tripData.hotels.find(hotel => hotel.city === currentDay.title)?.name}</h3>
              </div>
              <div className="flex items-center text-sm text-gray-600 mb-3">
                <span className="flex items-center ml-3">
                  <span className="text-yellow-500 ml-1">⭐</span>
                  {tripData.hotels.find(hotel => hotel.city === currentDay.title)?.stars} כוכבים
                </span>
                <span>
                  {tripData.hotels.find(hotel => hotel.city === currentDay.title)?.price}
                </span>
              </div>
              <button 
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 text-sm"
                onClick={() => handleOpenBookingPanel('hotel')}
              >
                הזמן מלון
              </button>
            </div>
          </div>
          
          {/* רשימת טיסות ותחבורה */}
          <div className="p-4 border-t border-gray-200">
            <h3 className="font-bold mb-3">תחבורה</h3>
            
            {/* טיסות */}
            {tripData.flights.map(flight => (
              <div key={flight.id} className="mb-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="flex items-center mb-1">
                  <span className="text-lg ml-2">✈️</span>
                  <span className="font-medium">{flight.from} - {flight.to}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="flex items-center ml-3">
                    <span className="ml-1">📅</span>
                    {flight.date}
                  </span>
                  <span className="flex items-center ml-3">
                    <span className="ml-1">🕒</span>
                    {flight.time}
                  </span>
                  <span>{flight.price}</span>
                </div>
              </div>
            ))}
            
            {/* תחבורה פנימית */}
            {tripData.transportation.map(transport => (
              <div key={transport.id} className="mb-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="flex items-center mb-1">
                  <span className="text-lg ml-2">{transport.type === 'רכבת' ? '🚄' : '🚌'}</span>
                  <span className="font-medium">{transport.from} - {transport.to}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="flex items-center ml-3">
                    <span className="ml-1">📅</span>
                    {transport.date}
                  </span>
                  <span className="flex items-center ml-3">
                    <span className="ml-1">🕒</span>
                    {transport.time}
                  </span>
                  <span>{transport.price}</span>
                </div>
              </div>
            ))}
            
            <button 
              className="w-full border border-blue-600 text-blue-600 py-2 rounded-lg font-medium hover:bg-blue-50 text-sm mt-2"
              onClick={() => handleOpenBookingPanel('transport')}
            >
              הוסף תחבורה
            </button>
          </div>
        </div>
      </div>
      
      {/* חלונית הזמנה */}
      {showBookingPanel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-20 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center">
                <span className="ml-2">
                  {bookingType === 'flight' ? '✈️' : bookingType === 'hotel' ? '🏨' : '🚗'}
                </span>
                {bookingType === 'flight' ? 'הזמנת טיסות' : bookingType === 'hotel' ? 'הזמנת מלון' : 'השכרת רכב'}
              </h2>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={handleCloseBookingPanel}
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              {/* תוכן דמה לטופס הזמנה */}
              <div className="space-y-6">
                {bookingType === 'flight' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 mb-2 font-medium">מוצא</label>
                        <input 
                          type="text"
                          defaultValue="תל אביב (TLV)"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2 font-medium">יעד</label>
                        <input 
                          type="text"
                          defaultValue="מילאנו (MXP)"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 mb-2 font-medium">תאריך יציאה</label>
                        <input 
                          type="date"
                          defaultValue="2025-04-12"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2 font-medium">תאריך חזרה</label>
                        <input 
                          type="date"
                          defaultValue="2025-04-19"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </>
                )}
                
                {bookingType === 'hotel' && (
                  <>
                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">יעד</label>
                      <input 
                        type="text"
                        defaultValue={currentDay.title}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 mb-2 font-medium">תאריך הגעה</label>
                        <input 
                          type="date"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2 font-medium">תאריך עזיבה</label>
                        <input 
                          type="date"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </>
                )}
                
                {bookingType === 'car' && (
                  <>
                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">מיקום קבלת הרכב</label>
                      <input 
                        type="text"
                        defaultValue="שדה תעופה מילאנו (MXP)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 mb-2 font-medium">תאריך קבלה</label>
                        <input 
                          type="date"
                          defaultValue="2025-04-12"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2 font-medium">תאריך החזרה</label>
                        <input 
                          type="date"
                          defaultValue="2025-04-19"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </>
                )}
                
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700">
                  חפש אפשרויות
                </button>
              </div>
              
              {/* הדגמת תוצאות חיפוש */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="font-bold mb-4">תוצאות מומלצות</h3>
                
                <div className="space-y-4">
                  {/* תוצאה לדוגמה 1 */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 cursor-pointer">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-bold">
                          {bookingType === 'flight' ? 'אל על - טיסה ישירה' : 
                           bookingType === 'hotel' ? 'מלון פלאצו פארצי' : 
                           'רנו קליאו או דומה'}
                        </h4>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          {bookingType === 'flight' ? (
                            <>
                              <span className="ml-3">08:15 - 12:15</span>
                              <span className="ml-3">ישיר, 4 שעות</span>
                              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">כולל כבודה</span>
                            </>
                          ) : bookingType === 'hotel' ? (
                            <>
                              <span className="text-yellow-500 ml-1">⭐⭐⭐⭐</span>
                              <span className="ml-3">מרכז העיר</span>
                              <span className="ml-3">ארוחת בוקר כלולה</span>
                            </>
                          ) : (
                            <>
                              <span className="ml-3">אוטומטי</span>
                              <span className="ml-3">אסוף בשדה התעופה</span>
                              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">ביטוח מלא</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-lg text-blue-600">
                          {bookingType === 'flight' ? '€320' : bookingType === 'hotel' ? '€180/לילה' : '€35/יום'}
                        </span>
                        <span className="text-xs text-gray-500">כולל מיסים</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* תוצאה לדוגמה 2 */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 cursor-pointer">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-bold">
                          {bookingType === 'flight' ? 'אליטליה - טיסה ישירה' : 
                           bookingType === 'hotel' ? 'מלון גרנד מילאנו' : 
                           'פיאט 500 או דומה'}
                        </h4>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          {bookingType === 'flight' ? (
                            <>
                              <span className="ml-3">10:30 - 14:30</span>
                              <span className="ml-3">ישיר, 4 שעות</span>
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">מחיר מוזל</span>
                            </>
                          ) : bookingType === 'hotel' ? (
                            <>
                              <span className="text-yellow-500 ml-1">⭐⭐⭐⭐⭐</span>
                              <span className="ml-3">ליד תחנת הרכבת</span>
                              <span className="ml-3">בריכה וספא</span>
                            </>
                          ) : (
                            <>
                              <span className="ml-3">ידני</span>
                              <span className="ml-3">אסוף במרכז העיר</span>
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">מחיר מוזל</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-lg text-blue-600">
                          {bookingType === 'flight' ? '€290' : bookingType === 'hotel' ? '€210/לילה' : '€28/יום'}
                        </span>
                        <span className="text-xs text-gray-500">כולל מיסים</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button className="w-full py-3 text-blue-600 font-medium mt-4">
                  הצג עוד אפשרויות
                </button>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button 
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg ml-2"
                onClick={handleCloseBookingPanel}
              >
                סגור
              </button>
              <button className="px-6 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg">
                בחר והוסף למסלול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripPlannerMapView;