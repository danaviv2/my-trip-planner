export const useTripStorage = () => {
  const STORAGE_KEY = 'currentTrip';

  const saveTrip = (tripData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tripData));
      console.log('✅ טיול נשמר:', tripData);
    } catch (error) {
      console.error('❌ שגיאה בשמירת טיול:', error);
    }
  };

  const loadTrip = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const tripData = JSON.parse(saved);
        console.log('✅ טיול נטען:', tripData);
        return tripData;
      }
    } catch (error) {
      console.error('❌ שגיאה בטעינת טיול:', error);
    }
    return null;
  };

  const clearTrip = () => {
    localStorage.removeItem(STORAGE_KEY);
    console.log('✅ טיול נמחק');
  };

  return { saveTrip, loadTrip, clearTrip };
};
