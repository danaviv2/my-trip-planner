const CACHE_NAME = 'trip-planner-v3';
const FONTS_CACHE = 'trip-planner-fonts-v1';

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

  // JS / CSS / תמונות — Cache First, ואם אין ברשת שמור לקאש
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
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
