// components/common/LottieArt.jsx
//
// אנימציית Lottie שמצייתת לערכת הצבעים ולהעדפת התנועה.
//
// ── למה לא וידאו ──
// האתר שהוצג כהשראה מריץ webm של 3840x2904 בלולאה. וידאו אינו ניתן
// לצביעה מחדש: במצב כהה הוא נשאר בדיוק אותו דבר, והפרויקט הזה השקיע
// סריקות שלמות בכך שכל גוון ייגזר מהערכה. Lottie וקטורי, שוקל
// קילובייטים בודדים, ואת הצבעים שלו אפשר להחליף לפני הרינדור.
//
// ── מדידה שקבעה את הבחירה ──
// שבעה מועמדים נבדקו ב-13.09.2026 לפי התוכן ולא לפי השם.
// `travel-aviation` הוצג כאנימציה ומשקלו 20,750KB — 154 שכבות תמונה,
// סדרת PNG פריים-אחר-פריים. `map-line` הוא 5.5KB, שכבות צורה בלבד,
// ושני צבעים בסך הכול.
import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// ── הצביעה היא תכונה של האנימציה, לא ברירת מחדל ──
// נמדד על המסך: `flying-plane` נצבע כולו והפך לצללית סגולה שטוחה.
// יש לו עשרים צבעים — גוף לבן, פסים כחולים, עננים אפורים — ודריסתם
// בגוון אחד מוחקת את הציור. `map-line` הוא שני צבעים בלבד, ולכן שם
// הצביעה עובדת. הדגל נגזר מהתוכן שנבדק, לא מהעדפה.
const SOURCES = {
  'map-line': { load: () => import('../../assets/animations/map-line.json'), tintable: true },
  'flying-plane': { load: () => import('../../assets/animations/flying-plane.json'), tintable: false },
};

/**
 * מחליף כל צבע באנימציה בצבע מהערכה.
 *
 * עותק עמוק ולא מוטציה: המודול נשמר במטמון של webpack, ושינוי במקום
 * היה דולף למופע הבא ומצטבר בכל החלפת ערכה.
 */
const recolor = (data, hex) => {
  const rgb = [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
  const clone = JSON.parse(JSON.stringify(data));
  const walk = (o) => {
    if (Array.isArray(o)) return o.forEach(walk);
    if (o && typeof o === 'object') {
      for (const [k, v] of Object.entries(o)) {
        if (k === 'c' && v && Array.isArray(v.k) && v.k.length === 4) {
          v.k = [...rgb, v.k[3]];
        } else walk(v);
      }
    }
    return undefined;
  };
  walk(clone);
  return clone;
};

export default function LottieArt({
  name,
  height = 240,
  loop = true,
  tint,            // ברירת מחדל: צבע ה-primary של הערכה
  sx,
}) {
  const host = useRef(null);
  const anim = useRef(null);
  const theme = useTheme();
  const [failed, setFailed] = useState(false);
  const color = tint || theme.palette.primary.main;

  useEffect(() => {
    let dead = false;
    const source = SOURCES[name];
    if (!source) { setFailed(true); return undefined; }

    // מי שביקש פחות תנועה מקבל פריים אחד ולא לולאה.
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    (async () => {
      try {
        // טעינה עצלה: הנגן יושב בצ'אנק נפרד ואינו נכנס לחבילה הראשית.
        const [{ default: lottie }, mod] = await Promise.all([
          import('lottie-web/build/player/lottie_light'),
          source.load(),
        ]);
        if (dead || !host.current) return;
        const raw = mod.default || mod;
        host.current.innerHTML = '';
        anim.current = lottie.loadAnimation({
          container: host.current,
          renderer: 'svg',
          loop: loop && !reduce,
          autoplay: !reduce,
          animationData: source.tintable ? recolor(raw, color) : raw,
        });
        if (reduce) anim.current.goToAndStop(anim.current.totalFrames * 0.6, true);
      } catch {
        // הנגן או הקובץ לא נטענו. המסך ממשיך בלי הקישוט, ולא נשבר.
        if (!dead) setFailed(true);
      }
    })();

    return () => {
      dead = true;
      if (anim.current) { anim.current.destroy(); anim.current = null; }
    };
  }, [name, loop, color]);

  if (failed) return null;

  // aria-hidden: קישוט. כל מה שיש לומר נאמר בטקסט שלצידו.
  return (
    <Box
      ref={host}
      aria-hidden="true"
      sx={{ width: '100%', height, pointerEvents: 'none', ...sx }}
    />
  );
}
