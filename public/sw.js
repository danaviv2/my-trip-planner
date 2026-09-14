// v5 — ניקוי חובה: v4 הכיל תשובות `/api/` (מצב טיסה קפוא). v4 — v3 הכיל
// רשומות מורעלות שבהן index.html נשמר תחת כתובת של קובץ JS. העלאת השם
// היא מה שמוחק אותן אצל משתמשים קיימים, כי `activate` מוחק כל מטמון אחר.
const CACHE_NAME = 'trip-planner-v5';
const FONTS_CACHE = 'trip-planner-fonts-v1';

/**
 * ── אריחי מפה אינם נשמרים כאן יותר (14.09.2026) ──
 * עד היום אריחי openstreetmap.org נשמרו ב-cache-first והוגשו גם בלי רשת.
 * מדיניות האריחים של OSM, שנקראה באותו יום, אומרת במפורש:
 * "Offline use is not permitted on tile.openstreetmap.org". האריחים הם
 * שרת תרומות, והשימוש הלא-מקוון הוא בדיוק מה שהם אוסרים.
 *
 * מה שנשאר מותר, ומתרחש בלי קוד: מטמון ה-HTTP של הדפדפן, שמכבד את
 * כותרות המטמון של השרת. מפה לא-מקוונת תחזור רק עם ספק אריחים שהרישיון
 * שלו מתיר זאת — ואז כאן, עם שם ספק מפורש ולא ביטוי כללי.
 *
 * המטמון הישן נמחק ב-`activate`, כי שמו כבר אינו ברשימת השמורים.
 */

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  '/favicon.png',
  '/favicon.ico',
];

// התקנה — שמור נכסים בסיסיים
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// הפעלה — מחק קאשים ישנים
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== FONTS_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => {
      self.clients.claim();
      // הודע לכל הטאבים הפתוחים שיש גרסה חדשה
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'SW_UPDATED' }));
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Google Fonts — Stale While Revalidate
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(
      caches.open(FONTS_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const fetchPromise = fetch(request).then((response) => {
            cache.put(request, response.clone());
            return response;
          });
          return cached || fetchPromise;
        })
      )
    );
    return;
  }


  // דלג על בקשות חיצוניות אחרות (API, Firebase וכו')
  if (url.origin !== self.location.origin) return;

  // ── תשובות שרת אינן נכסים ──
  // עד 14.09.2026 כל GET מאותו מקור עבר ל-Cache First למטה, כולל `/api/`.
  // נמדד באתר החי: `/api/flight-status` של LY 315 נשמר במטמון עם
  // "EnRoute", ומאותו רגע המכשיר היה מקבל "בדרך" גם אחרי הנחיתה — לנצח.
  // תשובת API היא מצב, לא קובץ. המטמון שלה נקבע בשרת (`s-maxage`), לא כאן.
  if (url.pathname.startsWith('/api/')) return;

  // בדיקת הגרסה חייבת להגיע מהרשת. הגשתה מהמטמון הייתה משווה את הגרסה
  // הישנה לעצמה ומדווחת תמיד שהכול מעודכן — בדיקה שתמיד עוברת ולעולם
  // אינה מגלה דבר.
  if (url.pathname === '/version.json') return;

  // ניווט — Network First עם fallback ל-index.html (תמיכה ב-React Router)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // ── התשובה היא HTML, אבל ביקשנו קוד ──
  //
  // זה קרה באתר החי ב-05.09.2026 והפיל אותו לגמרי:
  //   Uncaught SyntaxError: Unexpected token '<'   main.5b8c4300.js:1
  //
  // המנגנון: בזמן פריסה ה-SW הישן מבקש צ'אנק מהבנייה הקודמת. Vercel כבר
  // החליף בנייה, הנתיב אינו קיים — ומכיוון שזה SPA, השרת מחזיר את
  // `index.html` עם **סטטוס 200**. השומר היחיד שהיה כאן הוא
  // `if (response.ok)`, ו-200 עובר אותו בלי בעיה. ה-HTML נשמר במטמון
  // תחת כתובת ה-JS, ומאותו רגע Cache First מגיש אותו לנצח — גם אחרי
  // שהפריסה הסתיימה והקובץ האמיתי שוב זמין.
  //
  // כלומר כישלון שהוצג כהצלחה, דפוס הכשל מס' 3 שהפרויקט מתעד. הסטטוס
  // אינו מספיק; צריך לשאול אם **הסוג** שחזר הוא הסוג שביקשנו.
  const wantsCode = request.destination === 'script' || request.destination === 'style';
  const looksLikeHtml = (res) =>
    (res.headers.get('content-type') || '').includes('text/html');

  event.respondWith(
    caches.match(request).then((cached) => {
      // גם רשומה שכבר במטמון נבדקת: מטמון מורעל מלפני התיקון עדיין
      // יושב אצל משתמשים, ומחיקת המטמון לבדה אינה מגיעה למי שלא
      // הפעיל מחדש את ה-SW.
      if (cached && !(wantsCode && looksLikeHtml(cached))) return cached;

      return fetch(request).then((response) => {
        // HTML בתשובה לבקשת קוד הוא כשל, לא תוכן. לא נשמר ולא מוגש —
        // שגיאת רשת גלויה עדיפה על דף שנשבר בלי הסבר.
        if (wantsCode && looksLikeHtml(response)) {
          return new Response('', { status: 504, statusText: 'Stale asset' });
        }
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        // אם זו בקשת ניווט שנכשלה — החזר index.html
        if (request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// ─── התראות דחיפה ────────────────────────────────────────────────

/**
 * הצגת התראה שנשלחה מהשרת.
 *
 * זה החלק שעובד כשהאפליקציה סגורה: ה-service worker מתעורר גם כשאין
 * לשונית פתוחה. באייפון זה מותנה בכך שהאפליקציה הותקנה במסך הבית —
 * בלשונית Safari רגילה PushManager אינו קיים כלל.
 */
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'עדכון על הטיסה', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'עדכון על הטיסה';
  const options = {
    body: data.body || '',
    icon: '/logo192.png',
    badge: '/logo192.png',
    dir: 'rtl',
    lang: 'he',
    // תג זהה מחליף התראה קודמת על אותה טיסה במקום לערום עוד אחת
    tag: data.tag || 'flight-update',
    renotify: true,
    requireInteraction: false,
    data: { url: data.url || '/travel-info' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/**
 * פתיחת המסך הנכון בלחיצה.
 *
 * אם האפליקציה כבר פתוחה, מתמקדים בה ומנווטים במקום לפתוח חלון נוסף —
 * שני מופעים של אותה אפליקציה מבלבלים ומאבדים מצב.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/travel-info';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
