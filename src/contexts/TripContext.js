import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateItinerary } from '../services/aiItineraryService';

const TripContext = createContext();

// טיוטת המסלול הפעיל.
//
// המסלול נשמר עד כה בזיכרון בלבד: כל רענון — ולא רק ניתוק רשת — מחק
// מסלול של שלושה-עשר ימים שנוצר זה עתה, אלא אם המשתמש הספיק ללחוץ
// "שמור טיול". שמירה מקומית היא גם התנאי לעבודה בלי רשת: אי אפשר לשרוד
// ניתוק אם לא שורדים רענון.
const DRAFT_KEY = 'activeTripDraft';

const readDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    // מסלול בלי ימים אינו שווה שחזור, והוא גם מסתיר מסך ריק אמיתי
    return parsed?.dailyItinerary?.length ? parsed : null;
  } catch {
    return null;
  }
};

/**
 * הטיוטה שנדחקה הצידה כשהמשתמש פתח תכנון ליעד אחר.
 *
 * מגירה נפרדת ולא מחיקה: מי שעבד שעה על מסלול לבולוניה ונכנס לרגע
 * לרומא אינו אמור לאבד אותו. השחזור הוא לחיצה אחת, ולכן אין צורך
 * לשאול אותו מראש ולעצור אותו בדרך.
 */
const STASH_KEY = 'supersededTripDraft';

export const readStashedTrip = () => {
  try {
    const raw = localStorage.getItem(STASH_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.dailyItinerary?.length ? parsed : null;
  } catch {
    return null;
  }
};

const writeStash = (plan) => {
  try {
    if (plan?.dailyItinerary?.length) localStorage.setItem(STASH_KEY, JSON.stringify(plan));
    else localStorage.removeItem(STASH_KEY);
  } catch {}
};

const writeDraft = (plan) => {
  try {
    if (plan?.dailyItinerary?.length) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(plan));
    } else {
      localStorage.removeItem(DRAFT_KEY);
    }
  } catch {
    // המכסה מלאה. עדיף לאבד את הטיוטה מאשר להפיל את המסך.
  }
};

export const TripProvider = ({ children }) => {
  const [tripData, setTripData] = useState({
    destinations: [],
    accommodations: [],
    flights: [],
    activities: [],
  });

  const [startPoint, setStartPoint] = useState('Tel Aviv');
  const [tripPlan, setTripPlan] = useState(readDraft);
  const [tripLoading, setTripLoading] = useState(false);
  const [tripError, setTripError] = useState(null);

  // היום הנבחר בתצוגת הלשוניות — TripPlanner מעדכן, TripPlannerPage קורא
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const planTripWithAI = async ({ destination, days = 3, interests = [], budget = 'medium', advancedPreferences = {}, anchorsByDay = {} } = {}) => {
    if (!destination) return { success: false, error: 'NO_DESTINATION' };

    setTripLoading(true);
    setTripError(null);

    try {
      const dailyItinerary = await generateItinerary({ destination, days, interests, budget, advancedPreferences, anchorsByDay });
      setTripPlan({ destination, dailyItinerary });
      setSelectedDayIndex(0);
      return { success: true };
    } catch (err) {
      console.error('❌ planTripWithAI error:', err.message, err);
      const msg = err.message === 'RATE_LIMIT'
        ? 'יותר מדי בקשות — נסה שוב בעוד דקה'
        : err.message === 'NO_API_KEY'
        ? 'מפתח API חסר'
        : err.message?.startsWith('API_ERROR')
        ? `שגיאת API: ${err.message}`
        : 'שגיאה ביצירת המסלול';
      setTripError(msg);
      return { success: false, error: msg };
    } finally {
      setTripLoading(false);
    }
  };

  const updateTripPlan = (plan) => setTripPlan(plan);

  /**
   * פתיחת תכנון ליעד אחר מזה שבטיוטה.
   *
   * ── הבאג שזה סוגר ──
   * הגעה מדף הבית עם יעד חדש מילאה את שדה היעד בלבד. המסלול הקודם נשאר
   * טעון, ולכן שדה היעד אמר "רומא" בעוד הלשוניות הציגו את ימי בולוניה —
   * מסך שסותר את עצמו, ובחירת יעד שלא עשתה דבר.
   *
   * הטיוטה הקודמת נדחקת למגירה במקום להימחק, וניתנת לשחזור בלחיצה.
   *
   * @returns {boolean} האם הוחלף בפועל
   */
  const startFreshFor = (nextDestination) => {
    const current = tripPlan;
    const same =
      String(current?.destination || '').trim().toLowerCase() ===
      String(nextDestination || '').trim().toLowerCase();

    if (!current?.dailyItinerary?.length || same) return false;

    writeStash(current);
    setTripPlan(null);
    setSelectedDayIndex(0);
    return true;
  };

  /** מחזיר את הטיוטה שנדחקה, ומרוקן את המגירה. */
  const restoreStashedTrip = () => {
    const stashed = readStashedTrip();
    if (!stashed) return false;
    writeStash(null);
    setTripPlan(stashed);
    setSelectedDayIndex(0);
    return true;
  };

  /**
   * מוותר על הטיוטה שבמגירה.
   *
   * אינו מחובר לשום כפתור במסך, במכוון: מחיקה בלחיצה אחת ובלי אישור
   * הייתה הדרך היחידה לאבד עבודה כאן. נשאר זמין למקרה שיידרש ויתור
   * מפורש, ומופעל היום רק דרך restoreStashedTrip שמרוקן אחרי שחזור.
   */
  const discardStashedTrip = () => writeStash(null);

  // כל שינוי נשמר מיד. עריכה ידנית של פעילות היא בדיוק המקרה שבו איבוד
  // המסלול מכאיב, שכן היא אינה ניתנת לשחזור על ידי יצירה מחדש.
  useEffect(() => {
    writeDraft(tripPlan);
  }, [tripPlan]);

  const saveTrip = (planData) => {
    try {
      const saved = JSON.parse(localStorage.getItem('savedTrips') || '[]');
      saved.push({ ...planData, savedAt: new Date().toISOString() });
      localStorage.setItem('savedTrips', JSON.stringify(saved));
      return { success: true };
    } catch (e) {
      console.error('שגיאה בשמירת טיול:', e);
      return { success: false };
    }
  };

  const value = {
    tripData,
    setTripData,
    startPoint,
    setStartPoint,
    planTripWithAI,
    tripLoading,
    tripError,
    accommodations: tripData.accommodations || [],
    tripPlan,
    updateTripPlan,
    startFreshFor,
    restoreStashedTrip,
    discardStashedTrip,
    saveTrip,
    selectedDayIndex,
    setSelectedDayIndex,
  };

  return (
    <TripContext.Provider value={value}>
      {children}
    </TripContext.Provider>
  );
};

export const useTripContext = () => {
  const context = useContext(TripContext);
  if (!context) {
    console.warn('useTripContext must be used within TripProvider');
    return {
      tripData: { destinations: [], accommodations: [], flights: [], activities: [] },
      setTripData: () => {},
      startPoint: 'Tel Aviv',
      setStartPoint: () => {},
      planTripWithAI: async () => {},
      tripLoading: false,
      tripError: null,
      accommodations: [],
      tripPlan: null,
      updateTripPlan: () => {},
      startFreshFor: () => false,
      restoreStashedTrip: () => false,
      discardStashedTrip: () => {},
      saveTrip: () => {},
      selectedDayIndex: 0,
      setSelectedDayIndex: () => {},
    };
  }
  return context;
};

export default TripContext;
