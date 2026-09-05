// v4 — ניקוי חובה: v3 הכיל רשומות מורעלות שבהן index.html נשמר תחת
// כתובת של קובץ JS. ראה `looksLikeHtml` למטה. העלאת השם היא מה שמוחק
// אותן אצל משתמשים קיימים, כי `activate` מוחק כל מטמון שאינו הנוכחי.
const CACHE_NAME = 'trip-planner-v4';
const FONTS_CACHE = 'trip-planner-fonts-v1';
const TILES_CACHE = 'trip-planner-tiles-v1';

/**
 * מפה שנצפתה נשארת זמינה בלי רשת.
 *
 * ── למה זה לא עבד קודם ──
 * אריחי המפה מגיעים מ-openstreetmap.org, כלומר ממקור חיצוני, וה-fetch
 * כאן דילג על כל מקור חיצוני פרט לגופנים. לכן המפה — הדבר שהכי נחוץ
 * דווקא כשאין קליטה, בנסיעה בחו"ל — הייתה ריקה במצב לא-מקוון.
 *
 * ── מדוע cache-first ──
 * אריח של רחוב אינו משתנה בפרק הזמן של נסיעה. הגשה מהמטמון גם חוסכת
 * תעבורה ברשת סלולרית יקרה, וגם מכבדת את מדיניות השימוש של OSM, שמבקשת
 * לא להוריד את אותו אריח שוב ושוב.
 *
 * ── ולמה יש תקרה ──
 * אריח שוקל 15–30KB, ומפה שגוללים בה מייצרת מאות אריחים בדקות. בלי
 * תקרה המטמון היה גדל עד שהדפדפן מוחק אותו כולו — ואז גם מה שנצפה
 * נעלם. תקרה של 500 אריחים היא כ-10MB, ומספיקה לעיר שלמה בכמה רמות
 * זום. הפינוי הוא לפי סדר ההגעה: האריחים הישנים ביותר יורדים ראשונים.
 */
const TILE_HOSTS = /(^|\.)((tile|tiles)\.openstreetmap\.org|basemaps\.cartocdn\.com|tile\.opentopomap\.org)$/;
const MAX_TILES = 500;

const trimTiles = async () => {
  const cache = await caches.open(TILES_CACHE);
  const keys = await cache.keys();
  if (keys.length <= MAX_TILES) return;
  // הישנים ביותר קודם — keys() מחזיר לפי סדר ההוספה
  await Promise.all(keys.slice(0, keys.length - MAX_TILES).map((k) => cache.delete(k)));
};

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
          .filter((k) => k !== CACHE_NAME && k !== FONTS_CACHE && k !== TILES_CACHE)
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

  // אריחי מפה — Cache First, כדי שמפה שנצפתה תעבוד בלי רשת
  if (TILE_HOSTS.test(url.hostname)) {
    event.respondWith(
      caches.open(TILES_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            // ── תשובה אטומה היא המקרה הרגיל כאן, לא החריג ──
            // אריח נטען כ-<img>, כלומר בקשת no-cors, ולכן התשובה אטומה:
            // status 0 ו-ok=false. תנאי `response.ok` בלבד נראה זהיר
            // ואינו שומר אף אריח אמיתי — נמדד בדפדפן מול אריח חי לפני
            // שהגיע למשתמש. תשובה אטומה עובדת מצוין כמקור ל-<img>,
            // ולכן היא נשמרת; המחיר הוא שאי אפשר להבחין בה בין אריח
            // לשגיאה, ועל כך עונה תקרת הפינוי.
            if (response && (response.ok || response.type === 'opaque')) {
              cache.put(request, response.clone());
              trimTiles();
            }
            return response;
          }).catch(() => cached || Response.error());
        })
      )
    );
    return;
  }

  // דלג על בקשות חיצוניות אחרות (API, Firebase וכו')
  if (url.origin !== self.location.origin) return;

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
