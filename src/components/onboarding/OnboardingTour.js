// components/onboarding/OnboardingTour.js
//
// המדריך האינטראקטיבי למשתמש חדש. driver.js מספק את הזרקור והבועה;
// כאן יושבים התזמון, האודיו, ההתמדה והכיוון.
//
// הכלל שמכתיב את כל המבנה: **התחנה רצה רק אם היעד שלה על המסך.**
// הסינון עצמו יושב ב-onboardingTourService ונבדק שם בלי דפדפן.
import { useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './onboarding.css';
import { stepsFor, markSeen, domHasTarget } from '../../services/onboardingTourService';
import { showHand, hideHand } from './tourHand';

const MUTE_KEY = 'onboardingMuted';

const isMuted = () => {
  try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; }
};
const setMuted = (v) => {
  try { localStorage.setItem(MUTE_KEY, v ? '1' : '0'); } catch { /* אחסון חסום */ }
};

// ── הקבצים נטענים סטטית ולא ב-require דינמי ──
// `require(\`...${lang}.mp3\`)` גורם ל-webpack לארוז את כל התיקייה,
// וקובץ חסר מתפוצץ בזמן ריצה ולא בזמן בנייה. מפה מפורשת נכשלת מיד
// בקומפילציה אם שם קובץ שגוי, ומאפשרת לשפה בלי הקלטה להיות undefined.
const AUDIO = {
  he: {
    'onboarding-1': require('../../assets/audio/onboarding-1-he.mp3'),
    'onboarding-2': require('../../assets/audio/onboarding-2-he.mp3'),
    'onboarding-3': require('../../assets/audio/onboarding-3-he.mp3'),
  },
};

export default function OnboardingTour() {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const audioRef = useRef(null);
  const driverRef = useRef(null);
  // מזהי התחנות שהוצגו בפועל בריצה הזו. נשמרים רק בסיום או בדילוג.
  const shownRef = useRef([]);

  const stopAudio = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
  }, []);

  // ── האודיו הוא בונוס, לא תנאי ──
  // דפדפנים חוסמים ניגון אוטומטי לפני אינטראקציה, ו-play() מחזיר
  // Promise שנדחה. catch ריק כאן היה מייצר מדריך אילם שנראה תקין בקוד,
  // ולכן התוצאה נרשמת על ה-DOM וניתנת למדידה.
  // ── כפתור קול בתוך הבועה, כי אוטופליי באמת נחסם ──
  // נמדד על האתר החי ב-12.09.2026: `NotAllowedError`, ו-tourAudio קיבל
  // את הערך `blocked`. דפדפנים דורשים מחווה של המשתמש לפני ניגון,
  // ומשתמש שזה עתה נחת על העמוד לא נגע בו. בפיתוח זה "עבד" רק מפני
  // שכבר לחצתי על הדף קודם — בדיקה שהעידה על הבודק ולא על המוצר.
  //
  // לכן הניגון אינו מסתמך על אוטופליי: בכל תחנה מוזרק כפתור לבועה.
  // אם האוטומטי הצליח הוא מציע השתקה, ואם נחסם הוא הדרך היחידה פנימה.
  // לחיצה אחת פותחת את הדף לניגון, ומשם התחנות הבאות מתנגנות מעצמן.
  const playRef = useRef(null);

  const renderAudioButton = useCallback((popover, name, state) => {
    if (!popover) return;
    const title = popover.querySelector('.driver-popover-title');
    if (!title) return;
    popover.querySelector('.tour-audio-btn')?.remove();
    if (state === 'none') return; // אין הקלטה בשפה הזו — אין מה להציע

    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tour-audio-btn';
    const paint = (s) => {
      const on = s === 'playing';
      b.textContent = on ? '🔊' : '🔈';
      b.setAttribute('aria-label', t(on ? 'onboarding.muteOn' : 'onboarding.replay'));
      b.title = b.getAttribute('aria-label');
    };
    paint(state);
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const a = audioRef.current;
      if (a && !a.paused) { a.pause(); setMuted(true); paint('paused'); return; }
      setMuted(false);
      // המחווה הזו היא בדיוק מה שהדפדפן חיכה לו
      playRef.current?.(name, popover);
    });
    title.insertAdjacentElement('afterend', b);
  }, [t]);

  // ── האודיו הוא בונוס, לא תנאי ──
  // התוצאה נרשמת על ה-DOM וניתנת למדידה; catch ריק כאן היה מייצר
  // מדריך אילם שנראה תקין בקוד.
  const playAudio = useCallback((name, popover) => {
    stopAudio();
    const root = document.documentElement;
    const mod = AUDIO[i18n.language]?.[name];
    if (!mod) { root.dataset.tourAudio = 'none'; renderAudioButton(popover, name, 'none'); return; }
    if (isMuted()) { root.dataset.tourAudio = 'muted'; renderAudioButton(popover, name, 'muted'); return; }

    const a = new Audio(mod.default || mod);
    audioRef.current = a;
    a.play()
      .then(() => { root.dataset.tourAudio = 'playing'; renderAudioButton(popover, name, 'playing'); })
      .catch(() => { root.dataset.tourAudio = 'blocked'; renderAudioButton(popover, name, 'blocked'); });
  }, [i18n.language, stopAudio, renderAudioButton]);

  playRef.current = playAudio;

  useEffect(() => {
    // ה-DOM צריך רגע להתייצב: העמודים הם React.lazy, והיעד נולד אחרי
    // שהצ'אנק נטען. בדיקה מיידית הייתה מוצאת מסך ריק תמיד.
    const timer = setTimeout(() => {
      const steps = stepsFor(pathname, domHasTarget);
      if (!steps.length) return;
      shownRef.current = steps.map((s) => s.id);

      // ── סגירה מנוהלת כאן, ולא דרך onDestroyed ──
      // נמדד על מסך ב-12.09.2026: ב-driver.js 1.8 ה-hook `onDestroyed`
      // אינו נורה — לא בלחיצה על "יאללה, מתחילים" ולא על ה-×. הבועה
      // נסגרת, והמדריך היה נשאר "לא נצפה" לנצח, עם היד והפעימה תקועות
      // על המסך. בקוד המקור הקריאה מותנית ב-`n && r` אחרי resetState.
      // לכן שלושת מסלולי היציאה מטופלים במפורש. `d` מוצהר לפני, כי
      // הסוגרים נפתרים בזמן קריאה ולא בזמן הגדרה.
      let d;
      const finish = () => {
        stopAudio();
        hideHand();
        markSeen(shownRef.current);
        driverRef.current = null;
        d?.destroy();
      };

      d = driver({
        // בתחנה בודדת אין מונה ואין "הקודם" — נמדד על מסך: driver.js
        // מציג את שניהם כברירת מחדל, וכפתור חזרה שאין לאן לחזור ממנו
        // הוא בדיוק סוג הכפתור המת שתוקן כאן כבר פעם אחת.
        showProgress: steps.length > 1,
        showButtons: steps.length > 1 ? ['next', 'previous', 'close'] : ['next', 'close'],
        // ברירת המחדל של driver.js היא "1 of 2" באנגלית, והיא הופיעה
        // ככה גם בעברית — נתפס במדידה, לא בקריאת הקוד. ה-placeholders
        // הם של הספרייה ולא של i18next, ולכן מועברים כמחרוזות.
        progressText: t('onboarding.progress', { current: '{{current}}', total: '{{total}}' }),
        nextBtnText: t('onboarding.next'),
        prevBtnText: t('onboarding.prev'),
        doneBtnText: t('onboarding.done'),
        allowClose: true,
        // הכיוון נגזר מהמסמך, שכבר נכתב לפי השפה ב-LanguageContext.
        // קיבוע 'rtl' כאן היה שובר את הבועה בצרפתית — התקלה שתוקנה
        // כבר פעמיים בפרויקט הזה.
        popoverClass: `trip-tour trip-tour--${document.documentElement.dir || 'rtl'}`,
        steps: steps.map((s) => ({
          element: s.selector,
          popover: {
            title: t(s.titleKey),
            description: t(s.bodyKey),
            side: s.side,
            align: 'center',
            onPopoverRender: (popover) => {
              playAudio(s.audio, popover.wrapper || popover);
              showHand(s.selector);
            },
          },
        })),
        // שלושת מסלולי היציאה. הגדרתם מחליפה את הניווט המובנה, ולכן
        // המעבר בין תחנות מתבצע כאן במפורש.
        onNextClick: () => { if (d.isLastStep()) finish(); else d.moveNext(); },
        onPrevClick: () => d.movePrevious(),
        onCloseClick: finish,
        // רשת ביטחון אם הגרסה הבאה של הספרייה כן תירה אותו.
        // `markSeen` מאחד קבוצות, ולכן קריאה כפולה אינה מזיקה.
        onDestroyed: finish,
      });

      driverRef.current = d;
      d.drive();
    }, 900);

    return () => {
      clearTimeout(timer);
      stopAudio();
      hideHand();
      if (driverRef.current) {
        const d = driverRef.current;
        driverRef.current = null;
        d.destroy();
      }
    };
  }, [pathname, t, playAudio, stopAudio]);

  return null; // אין לו UI משלו; driver.js מזריק את הבועה
}

export { isMuted, setMuted };
