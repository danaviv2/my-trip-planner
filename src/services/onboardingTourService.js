// services/onboardingTourService.js
//
// הגדרת תחנות המדריך, והכלל שקובע אילו מהן רצות עכשיו.
//
// ── למה זו לא רשימה פשוטה שרצה מלמעלה למטה ──
// התסריט המקורי הניח ששלוש התחנות יושבות על מסך אחד ושכולן קיימות
// ברגע שמשתמש חדש נוחת. שתי ההנחות נמדדו ב-12.09.2026 והתבררו כשגויות:
//
//   1. `emailImport` ו-`timeline` יושבים ב-/travel-info; `vibe` ב-/.
//   2. למשתמש חדש ב-/travel-info אין ציר זמן **בכלל**. המסך כולו הוא
//      כותרת, שלושה כפתורים וחותמת גרסה. הזרקור היה מאיר כלום, והקול
//      היה אומר "המיילים שלכם הפכו ללוח זמנים מדויק" למי שטרם ייבא דבר.
//
// לכן תחנה אינה רצה אלא אם היעד שלה **נמצא עכשיו ב-DOM**. תחנת ציר
// הזמן נפתחת מעצמה בביקור הראשון שבו יש ציר זמן — כלומר מיד אחרי
// הייבוא הראשון, שהוא גם הרגע היחיד שבו המשפט נכון וגם הרגע שבו הוא
// מרשים.

export const TOUR_VERSION = 1;
const KEY = 'onboardingTour';

// `data-tour` ולא סלקטור מבני: מחלקות MUI מיוצרות (css-zubzze) ומשתנות
// בכל בנייה, וסלקטור כזה שובר את המדריך בלי שדבר ייכשל בקומפילציה.
export const TOUR_STEPS = [
  {
    id: 'emailImport',
    route: '/travel-info',
    selector: '[data-tour="email-import"]',
    titleKey: 'onboarding.step1.title',
    bodyKey: 'onboarding.step1.body',
    audio: 'onboarding-1',
    side: 'bottom',
  },
  {
    id: 'timeline',
    route: '/travel-info',
    selector: '[data-tour="timeline"]',
    titleKey: 'onboarding.step2.title',
    bodyKey: 'onboarding.step2.body',
    audio: 'onboarding-2',
    side: 'top',
  },
  {
    id: 'vibe',
    route: '/',
    selector: '[data-tour="vibe"]',
    titleKey: 'onboarding.step3.title',
    bodyKey: 'onboarding.step3.body',
    audio: 'onboarding-3',
    side: 'top',
  },
];

// ── האחסון עלול לזרוק, לא רק להחזיר null ──
// חלון פרטי והגדרות שחוסמות אחסון מפילים את הגישה עצמה. מדריך שקורס
// על קריאת דגל הוא מדריך שמפיל את האפליקציה למשתמש שרק רצה להסתכל.
const FRESH = () => ({ v: TOUR_VERSION, seen: [] });

const readState = () => {
  let raw;
  // ── רק הגישה לאחסון נתפסת כאן ──
  // תפיסה אחת סביב הגישה *וגם* סביב הפענוח הייתה מתרגמת נתון פגום
  // ל"אין אחסון", והמדריך היה מושבת לצמיתות אחרי כתיבה שבורה אחת.
  // אלה שני כשלים שונים: חסימה היא סיבה לא לרוץ, פגם הוא סיבה להתחיל מחדש.
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return null; // אחסון לא זמין — המדריך פשוט לא רץ
  }
  if (!raw) return FRESH();
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== TOUR_VERSION) return FRESH();
    return { v: TOUR_VERSION, seen: Array.isArray(parsed.seen) ? parsed.seen : [] };
  } catch {
    return FRESH(); // נתון פגום — מתייחסים כאילו המדריך טרם רץ
  }
};

const writeState = (state) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
};

export const hasSeen = (id) => {
  const s = readState();
  return s ? s.seen.includes(id) : true; // בלי אחסון — נחשב כנראה, ולא חוזר
};

// ── מסומן בסיום, לא בפתיחה ──
// סימון בפתיחה נראה חסכוני ומוחק את המדריך למי שהדפדפן שלו נסגר
// באמצע המשפט הראשון. וסימון לפי תחנה, ולא דגל יחיד: תחנת ציר הזמן
// מותנית בנתונים, ודגל אחד היה קובר אותה יחד עם השתיים שכן רצו.
export const markSeen = (ids) => {
  const s = readState();
  if (!s) return false;
  const seen = [...new Set([...s.seen, ...(Array.isArray(ids) ? ids : [ids])])];
  return writeState({ v: TOUR_VERSION, seen });
};

export const resetTour = () => writeState({ v: TOUR_VERSION, seen: [] });

/**
 * התחנות שרצות עכשיו: אותו מסלול, טרם נראו, והיעד קיים על המסך ממש.
 *
 * @param {string} pathname המסלול הנוכחי
 * @param {(sel: string) => boolean} exists האם היעד קיים — מוזרק כדי
 *        שאפשר יהיה לבדוק את הפונקציה בלי דפדפן
 */
export const stepsFor = (pathname, exists) => {
  if (!readState()) return [];
  return TOUR_STEPS.filter(
    (s) => s.route === pathname && !hasSeen(s.id) && exists(s.selector)
  );
};

// היעד חייב להיות גם קיים וגם בעל גובה. אלמנט ב-DOM עם גובה אפס —
// קרוס שטרם נפתח, בלוק שהוחזר כ-null — הוא זרקור על כלום.
export const domHasTarget = (selector) => {
  const el = document.querySelector(selector);
  if (!el) return false;
  return el.getBoundingClientRect().height > 0;
};
