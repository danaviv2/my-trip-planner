// services/a11yPrefsService.js
//
// העדפות נגישות תצוגה: גודל טקסט, ניגודיות גבוהה, הדגשת קישורים, הפחתת תנועה.
//
// ── למה במכשיר ולא בחשבון ──
// אלה העדפות של המסך שמולך, לא של האדם: טקסט 130% בטלפון אינו מה שרוצים
// במחשב. והן חייבות לפעול **לפני התחברות** — מי שמתקשה לקרוא צריך אותן כבר
// בטופס הכניסה. לכן localStorage, עם ברירת מחדל תקינה כשהאחסון חסום.
//
// ── איך הן חלות ──
// גודל טקסט: `font-size` על `<html>`. הטיפוגרפיה של MUI וכמעט כל ה-sx כתובים
// ב-rem, ולכן מתכווננים יחד. ערכי px בודדים לא — מגבלה ידועה, נאמרת במפורש.
// ניגודיות: דרך ה-theme (ThemeWrapper), ולא `filter: contrast()` על הדף —
// filter יוצר containing block, והסרגל העליון הקבוע היה נגלל עם התוכן.
// קישורים ותנועה: מחלקות על `<html>`, והכללים ב-`a11y.css`.
//
// הרעיון נלקח מ-MyTravel (14.09.2026). זו תוספת נוחות, **לא** תחליף לעמידה
// בת"י 5568 — ראה הצהרת הנגישות.

const KEY = 'a11yPrefs';
const EVENT = 'a11y-prefs-change';

export const TEXT_SCALES = [100, 115, 130, 150];
export const DEFAULT_PREFS = { textScale: 100, highContrast: false, highlightLinks: false, reduceMotion: false };

export const readA11yPrefs = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!raw || typeof raw !== 'object') return { ...DEFAULT_PREFS };
    return {
      textScale: TEXT_SCALES.includes(raw.textScale) ? raw.textScale : 100,
      highContrast: !!raw.highContrast,
      highlightLinks: !!raw.highlightLinks,
      reduceMotion: !!raw.reduceMotion,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
};

export const applyA11yPrefs = (prefs = readA11yPrefs()) => {
  const root = document.documentElement;
  root.style.fontSize = prefs.textScale === 100 ? '' : `${prefs.textScale}%`;
  root.classList.toggle('a11y-links', prefs.highlightLinks);
  root.classList.toggle('a11y-reduce-motion', prefs.reduceMotion);
  root.classList.toggle('a11y-contrast', prefs.highContrast);
  root.classList.toggle('a11y-large-text', prefs.textScale > 100);
};

export const writeA11yPrefs = (patch) => {
  const next = { ...readA11yPrefs(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* חסום — חל לשיחה בלבד */ }
  applyA11yPrefs(next);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
  return next;
};

export const resetA11yPrefs = () => {
  try { localStorage.removeItem(KEY); } catch { /* חסום */ }
  applyA11yPrefs(DEFAULT_PREFS);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { ...DEFAULT_PREFS } }));
  return { ...DEFAULT_PREFS };
};

export const onA11yPrefsChange = (fn) => {
  const handler = (e) => fn(e.detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
};
