import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const navigate = useNavigate();
  
  // אנימציית גלילה
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <div className="text-right w-full overflow-hidden">
      {/* Hero Section עם אפקט Parallax */}
      <div className="relative w-full h-[70vh] min-h-[500px] max-h-[700px] flex items-center overflow-hidden">
        {/* תמונת רקע עם Parallax */}
        <div 
          className="absolute inset-0 w-full h-full transition-transform duration-100"
          style={{ transform: `translateY(${scrollY * 0.5}px)` }}
        >
          <img 
            src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=80" 
            alt="יעד נופש יפהפה"
            className="w-full h-full object-cover scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/50 via-purple-900/40 to-pink-900/50"></div>
          {/* אפקט נוסף של נקודות */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        {/* תוכן */}
        <div className="relative z-10 w-full px-4">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl mr-auto">
              {/* כותרת עם אנימציה */}
              <h1 className="text-white text-5xl md:text-6xl font-bold mb-6 drop-shadow-2xl animate-fade-in-up">
                <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                  המדריך האישי שלך
                </span>
                <br />
                <span className="text-4xl md:text-5xl">✈️ לטיולים מושלמים</span>
              </h1>
              
              <p className="text-white text-xl md:text-2xl mb-10 opacity-95 drop-shadow-lg leading-relaxed">
                תכנן את הטיול הבא שלך בקלות עם 
                <span className="font-bold text-yellow-300"> מסלולים מותאמים אישית </span>
                וטיפים מקומיים
              </p>
              
              {/* תיבת חיפוש משופרת עם Glass Morphism */}
              <div className="backdrop-blur-xl bg-white/20 p-8 rounded-3xl shadow-2xl border border-white/30">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                  <h2 className="text-gray-800 text-2xl font-bold mb-6 flex items-center">
                    <span className="text-3xl ml-3">🌍</span>
                    לאן תרצו לטייל?
                  </h2>
                  
                  <div className="relative group">
                    <input 
                      type="text" 
                      placeholder="חפשו יעד, עיר או מדינה..." 
                      className="w-full p-5 pr-14 rounded-2xl border-2 border-gray-200 text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all shadow-sm"
                    />
                    <span className="absolute right-5 top-5 text-2xl group-hover:scale-110 transition-transform">🔍</span>
                  </div>
                  
                  <div className="mt-6 flex flex-wrap gap-3 items-center">
                    <span className="text-gray-700 font-semibold ml-2">🔥 יעדים פופולריים:</span>
                    {['פריז 🗼', 'רומא 🏛️', 'ברצלונה 🏖️', 'לונדון 🎡'].map((dest, idx) => (
                      <span 
                        key={idx}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:scale-110 hover:shadow-lg cursor-pointer transition-all duration-300"
                      >
                        {dest}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mt-8 flex justify-center">
                    <button 
                      onClick={() => navigate('/advanced-search')}
                      className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold text-lg py-4 px-10 rounded-2xl flex items-center gap-3 shadow-2xl hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300 group"
                    >
                      <span className="text-2xl group-hover:rotate-12 transition-transform">✈️</span>
                      <span>חפש טיולים מדהימים</span>
                      <span className="text-xl group-hover:translate-x-1 transition-transform">←</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* גלים בתחתית */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-20">
            <path d="M0,0 C150,100 350,0 600,50 C850,100 1050,0 1200,50 L1200,120 L0,120 Z" fill="#f9fafb" opacity="0.8"></path>
          </svg>
        </div>
      </div>
      
      {/* תוכן ראשי */}
      <div className="w-full bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          
          {/* המשך תכנון - משופר */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold mb-8 flex items-center">
              <span className="text-4xl ml-3 animate-pulse">🕒</span>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                המשך לתכנן את הטיול שלך
              </span>
            </h2>
            
            <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 flex flex-col md:flex-row hover:shadow-2xl transition-all duration-300 group">
              <div className="relative w-full md:w-64 h-64 md:h-auto overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80"
                  alt="טיול ללונדון"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                  ⭐ מומלץ
                </div>
              </div>
              
              <div className="p-8 flex-1">
                <h3 className="text-2xl font-bold mb-2 text-gray-800">טיול ללונדון 🇬🇧</h3>
                <p className="text-gray-600 mb-4 text-lg">5 ימים בבירת אנגליה • חוויה בלתי נשכחת</p>
                
                <div className="flex items-center gap-4 mb-4 flex-wrap">
                  <div className="flex items-center bg-blue-50 px-3 py-1 rounded-lg">
                    <span className="text-blue-600 ml-2">📅</span>
                    <span className="text-gray-700 font-semibold">5 ימים</span>
                  </div>
                  <div className="flex items-center bg-green-50 px-3 py-1 rounded-lg">
                    <span className="text-green-600 ml-2">💰</span>
                    <span className="text-gray-700 font-semibold">תקציב בינוני</span>
                  </div>
                  <span className="text-gray-400 text-sm mr-auto">עודכן לפני יומיים</span>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">התקדמות התכנון</span>
                    <span className="text-sm font-bold text-blue-600">70%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
                      style={{ width: '70%' }}
                    ></div>
                  </div>
                </div>
                
                <button 
                  onClick={() => navigate('/trip-planner')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-8 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2"
                >
                  <span>המשך תכנון</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* תכונות מרכזיות - משופרות */}
          <div className="mb-20">
            <h2 className="text-4xl font-bold mb-4 text-center">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                תכנן את הטיול המושלם
              </span>
            </h2>
            <p className="text-center text-gray-600 text-lg mb-12">כל מה שאתה צריך במקום אחד</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { 
                  icon: '✈️', 
                  title: 'תכנון טיול חכם', 
                  desc: 'צור תוכנית טיול מותאמת אישית עם מערכת ה-AI שלנו',
                  color: 'green',
                  gradient: 'from-green-400 to-emerald-500',
                  route: '/smart-trip'
                },
                { 
                  icon: '🔍', 
                  title: 'חיפוש מתקדם', 
                  desc: 'חפש אטרקציות, מסעדות ומלונות לפי קטגוריות וסינון מתקדם',
                  color: 'blue',
                  gradient: 'from-blue-400 to-cyan-500',
                  route: '/advanced-search'
                },
                { 
                  icon: '🗺️', 
                  title: 'מפת מסלולים', 
                  desc: 'צפה במסלולים וקבל ניווט מדויק לכל נקודה במסלול שלך',
                  color: 'orange',
                  gradient: 'from-orange-400 to-red-500',
                  route: '/map'
                },
                { 
                  icon: '🏙️', 
                  title: 'מידע על היעד', 
                  desc: 'קבל מידע מפורט על היעד, כולל אטרקציות, טיפים ומזג אוויר',
                  color: 'purple',
                  gradient: 'from-purple-400 to-pink-500',
                  route: '/destination-info'
                }
              ].map((feature, idx) => (
                <div 
                  key={idx}
                  className="group relative"
                >
                  {/* כרטיס עם אפקט הרמה */}
                  <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 relative">
                    {/* פס עליון צבעוני */}
                    <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${feature.gradient}`}></div>
                    
                    {/* תוכן */}
                    <div className="p-8">
                      {/* אייקון עם אפקט */}
                      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-gradient-to-br ${feature.gradient} shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                        <span className="text-4xl filter drop-shadow-lg">{feature.icon}</span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-center mb-3 text-gray-800 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:${feature.gradient} transition-all">
                        {feature.title}
                      </h3>
                      
                      <p className="text-gray-600 text-center leading-relaxed mb-6">
                        {feature.desc}
                      </p>
                    </div>
                    
                    {/* כפתור */}
                    <div className="px-8 pb-8 flex justify-center">
                      <button 
                        onClick={() => navigate(feature.route)}
                        className={`bg-gradient-to-r ${feature.gradient} text-white font-bold px-6 py-3 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2 group`}
                      >
                        <span>למידע נוסף</span>
                        <span className="group-hover:translate-x-1 transition-transform">⟵</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* תצוגת מפה - משופרת */}
          <div className="mb-20">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl h-[400px] group">
              <img 
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1400&q=80" 
                alt="מפת מסלול"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-10">
                <h3 className="text-3xl font-bold mb-3 text-white drop-shadow-lg">
                  🗺️ גלה מסלולי טיולים מותאמים אישית
                </h3>
                <p className="text-xl text-white/90 mb-6 max-w-2xl">
                  צפה במפה אינטראקטיבית עם מסלולים מומלצים, נקודות עניין ואטרקציות
                </p>
                <div>
                  <button 
                    onClick={() => navigate('/map')}
                    className="bg-white text-blue-700 font-bold text-lg py-4 px-8 rounded-2xl hover:bg-blue-50 hover:scale-105 hover:shadow-xl transition-all duration-300 inline-flex items-center gap-3 group"
                  >
                    <span>חקור את המפה</span>
                    <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* מזג אוויר - משופר */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold mb-8 flex items-center justify-center">
              <span className="text-4xl ml-3">☀️</span>
              <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                מזג אוויר ביעדים פופולריים
              </span>
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { city: 'רומא', temp: '24°', icon: '☀️', color: 'from-orange-400 to-red-500' },
                { city: 'פריז', temp: '18°', icon: '⛅', color: 'from-yellow-400 to-orange-500' },
                { city: 'לונדון', temp: '12°', icon: '🌧️', color: 'from-blue-400 to-cyan-500' },
                { city: 'ברצלונה', temp: '22°', icon: '☀️', color: 'from-orange-400 to-pink-500' }
              ].map((weather, idx) => (
                <div 
                  key={idx}
                  className="relative group cursor-pointer"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${weather.color} rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity`}></div>
                  <div className="relative bg-white border border-gray-100 rounded-3xl p-6 text-center hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
                    <span className="text-5xl block mb-3 group-hover:scale-125 transition-transform duration-300">
                      {weather.icon}
                    </span>
                    <span className={`text-3xl font-bold bg-gradient-to-r ${weather.color} bg-clip-text text-transparent block mb-2`}>
                      {weather.temp}
                    </span>
                    <p className="text-gray-700 font-semibold">{weather.city}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* קריאה לפעולה - משופרת */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <div className="absolute inset-0">
              <img 
                src="https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1400&q=80" 
                alt="נוף טיול"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 via-purple-900/80 to-pink-900/90"></div>
            </div>
            
            <div className="relative py-20 px-8 text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white drop-shadow-2xl">
                מוכנים לתכנן את הטיול הבא שלכם? ✨
              </h2>
              <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto text-white/95 leading-relaxed">
                צרו תוכנית טיול מותאמת אישית בקלות, עם המלצות מקומיות וכל מה שאתם צריכים לחוויה מושלמת
              </p>
              
              <button 
                onClick={() => navigate('/smart-trip')}
                className="bg-white text-purple-900 font-bold text-xl py-5 px-12 rounded-2xl shadow-2xl hover:shadow-white/30 hover:scale-110 transition-all duration-300 inline-flex items-center gap-3 group"
              >
                <span className="text-3xl group-hover:rotate-12 transition-transform">✈️</span>
                <span>התחל לתכנן עכשיו</span>
                <span className="text-2xl group-hover:translate-x-2 transition-transform">→</span>
              </button>
            </div>
          </div>
          
        </div>
      </div>
      
      {/* CSS מותאם אישית לאנימציות */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
