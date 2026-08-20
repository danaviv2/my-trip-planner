/**
 * זיהוי גרסה חדשה שכבר עלתה לשרת אך אינה רצה במכשיר.
 *
 * ── הבעיה שזה פותר ──
 * האפליקציה מותקנת במסך הבית. פתיחתה שם אינה טעינת דף אלא חידוש של מצב
 * שהמערכת שמרה: אין ניווט, אין בקשת רשת, והקוד שרץ הוא זה שנטען לפני
 * ימים. התוצאה נצפתה פעמיים — תכונה שנפרסה ואומתה על השרת, בעוד המסך
 * במכשיר אינו מכיר אותה, ושני הצדדים משוכנעים שהשני טועה.
 *
 * ── למה לא לרענן לבד ──
 * רענון כפוי באמצע צפייה מאבד גלילה, טפסים פתוחים וחלונות. בנסיעה זה
 * גרוע במיוחד. לכן הבדיקה רק מדווחת, וההחלטה נשארת אצל המשתמש.
 *
 * ── מה נמדד ──
 * חותמת הבנייה שהוזרקה לקוד מול זו שמוגשת עכשיו מהשרת. השוואת גרסאות
 * לפי שם קובץ הייתה נשענת על פרט פנימי של כלי הבנייה; החותמת היא ערך
 * שאנחנו כותבים במפורש, ולכן היא לא תשתנה מתחתינו.
 */

const RUNNING = process.env.REACT_APP_BUILD_TIME || '';

/**
 * החותמת שהשרת מגיש כרגע.
 *
 * `cache: 'no-store'` אינו קישוט: בלעדיו הבקשה עצמה מוגשת מהמטמון,
 * והבדיקה הייתה משווה גרסה ישנה לעצמה ומדווחת תמיד שהכול מעודכן.
 */
const fetchServerStamp = async () => {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.buildTime === 'string' ? data.buildTime : null;
  } catch {
    // בלי רשת אין מה לבדוק, וזה מצב תקין ולא שגיאה
    return null;
  }
};

/** האם קיימת גרסה חדשה יותר מזו שרצה. */
export const checkForUpdate = async () => {
  if (!RUNNING) return false;
  const server = await fetchServerStamp();
  return !!server && server !== RUNNING;
};

/**
 * מנקה את המטמון וטוען מחדש.
 *
 * מחיקת המטמון אינה מיותרת: ה-service worker מגיש קבצי קוד בגישת
 * "מהמטמון קודם", ורענון לבדו היה מחזיר בדיוק את אותם קבצים.
 */
export const applyUpdate = async () => {
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.update().catch(() => {})));
    }
  } catch {
    // גם אם הניקוי נכשל, הטעינה מחדש עדיין עשויה להביא גרסה חדשה
  }
  window.location.reload();
};

/**
 * בדיקה בכל פעם שהאפליקציה חוזרת לחזית.
 *
 * זו הנקודה שבה המשתמש פותח את האפליקציה מהמסך הבית — הרגע היחיד שבו
 * גרסה ישנה מתחילה לרוץ בלי שדבר יבדוק אותה.
 *
 * @returns {Function} ביטול המעקב
 */
export const watchForUpdates = (onFound) => {
  let stopped = false;

  const run = async () => {
    if (stopped || document.visibilityState !== 'visible') return;
    if (await checkForUpdate()) onFound();
  };

  document.addEventListener('visibilitychange', run);
  window.addEventListener('focus', run);
  run();

  return () => {
    stopped = true;
    document.removeEventListener('visibilitychange', run);
    window.removeEventListener('focus', run);
  };
};
