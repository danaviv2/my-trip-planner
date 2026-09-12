// components/onboarding/tourHand.js
//
// היד המצביעה שמרחפת מעל האלמנט המפוקס במדריך.
// האנימציה נמשכה מ-LottieFiles דרך ה-MCP (searchPublicAnimations,
// "tap animation", 5.5KB) ונבדקה לפני שנכנסה: שכבות צורה בלבד, אפס
// ביטויים, אפס תלויות חיצוניות — ולכן ה-build הקל של lottie-web מספיק.
//
// מועמד אחר, "hand TAP", נראה קטן ב-2,398 בייט לפי השדה שהשרת מחזיר,
// אבל ה-JSON עצמו הוא 140KB ותלוי בתמונה מרוחקת. שם קובץ וגודל מוצהר
// אינם ראיה לתוכן.

const HOST_ID = 'tour-hand';
let anim = null;
let host = null;
let track = null;

const place = (el) => {
  if (!host || !el) return;
  const r = el.getBoundingClientRect();
  if (r.height <= 0) { host.style.display = 'none'; return; }
  host.style.display = 'block';
  // יושבת על הפינה התחתונה של היעד, בצד שממנו מתחילה הקריאה —
  // כלומר מתהפכת יחד עם כיוון המסמך ולא נשארת שמאלה תמיד.
  const rtl = (document.documentElement.dir || 'rtl') === 'rtl';
  const x = rtl ? r.left - 18 : r.right - 38;
  host.style.transform = `translate(${Math.round(x)}px, ${Math.round(r.bottom - 18)}px)`;
};

// ── ההדגשה מסומנת במחלקה משלנו, לא ב-.driver-active-element ──
// נמדד על מסך: אחרי מעבר לתחנה 2 נשאו **שני** אלמנטים את המחלקה של
// driver.js בו-זמנית, ושניהם פעמו. ה-hook `onHighlighted` לא ניקה את
// זה, ולכן הפעימה נשענת על `tour-target` שמנוהל כאן — בפונקציה שכבר
// מוכח שרצה בכל תחנה, כי האודיו מתחלף איתה.
const TARGET_CLASS = 'tour-target';
const markTarget = (el) => {
  document.querySelectorAll('.' + TARGET_CLASS).forEach((n) => {
    if (n !== el) n.classList.remove(TARGET_CLASS);
  });
  if (el) el.classList.add(TARGET_CLASS);
};

/** מציג את היד מעל האלמנט המפוקס. בטוח לקריאה חוזרת. */
export const showHand = async (selector) => {
  const el = document.querySelector(selector);
  markTarget(el);
  if (!el) return;

  if (!host) {
    host = document.createElement('div');
    host.id = HOST_ID;
    // pointer-events: none — היד מרחפת מעל הכפתור ואסור שתחסום לחיצה
    host.style.cssText =
      'position:fixed;top:0;left:0;width:56px;height:56px;z-index:10001;' +
      'pointer-events:none;will-change:transform;';
    document.body.appendChild(host);
  }

  if (!anim) {
    try {
      // טעינה עצלה: הנגן יושב בצ'אנק נפרד ואינו נכנס לחבילה הראשית,
      // שכן המדריך רץ פעם אחת בחיי המשתמש.
      const [{ default: lottie }, { default: data }] = await Promise.all([
        import('lottie-web/build/player/lottie_light'),
        import('../../assets/animations/tap-hand.json'),
      ]);
      if (!host) return; // נסגר בזמן הטעינה
      anim = lottie.loadAnimation({
        container: host, renderer: 'svg', loop: true, autoplay: true, animationData: data,
      });
    } catch {
      // הנגן לא נטען — המדריך ממשיך בלי היד. פעימת ה-CSS על
      // .driver-active-element עדיין מסמנת את היעד.
      return;
    }
  }

  place(el);
  if (track) {
    window.removeEventListener('scroll', track, true);
    window.removeEventListener('resize', track);
  }
  track = () => place(document.querySelector(selector));
  window.addEventListener('scroll', track, true);
  window.addEventListener('resize', track);
};

/** מסיר את היד, את ההדגשה ואת המאזינים. */
export const hideHand = () => {
  markTarget(null);
  if (track) {
    window.removeEventListener('scroll', track, true);
    window.removeEventListener('resize', track);
    track = null;
  }
  if (anim) { anim.destroy(); anim = null; }
  if (host) { host.remove(); host = null; }
};
