// Service Worker para PWA
const CACHE_NAME = 'twittetec-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/icon.svg',
  '/manifest.json'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Error al cachear archivos:', error);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estrategia: Network First, fallback a Cache
self.addEventListener('fetch', (event) => {
  // Solo cachear GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // No cachear requests a la API
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, clonarla y guardarla en caché
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Si el fetch falla, intentar obtener del caché
        return caches.match(event.request);
      })
  );
});

// Push Notification - Recibir notificación
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  let notificationData = {
    title: 'Nueva notificación',
    body: 'Tienes una nueva notificación',
    icon: '/icon.svg',
    badge: '/badge-72.png',
    data: {},
    tag: 'notification',
    requireInteraction: false
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        data: payload.data || {},
        tag: payload.tag || notificationData.tag,
        requireInteraction: payload.requireInteraction || false,
        vibrate: [200, 100, 200],
        actions: [
          { action: 'open', title: 'Ver' },
          { action: 'close', title: 'Cerrar' }
        ]
      };
    } catch (error) {
      console.error('Error parsing push notification:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      vibrate: notificationData.vibrate,
      actions: notificationData.actions
    })
  );
});

// Push Notification - Click en la notificación
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  const notificationData = event.notification.data;
  const action = event.action;

  // Si presionó "cerrar", solo cerrar
  if (action === 'close') {
    return;
  }

  // Determinar URL a abrir
  let urlToOpen = '/';
  
  if (notificationData) {
    // Si es una notificación de mensaje, ir al chat
    if (notificationData.type === 'Message' && notificationData.actorId) {
      urlToOpen = `/messages/${notificationData.actorId}`;
    }
    // Si es de status (like, reply, repost, quote), ir al status
    else if (notificationData.statusId) {
      urlToOpen = `/status/${notificationData.statusId}`;
    }
    // Si es follow, ir al perfil
    else if (notificationData.type === 'Follow' && notificationData.actorUsername) {
      urlToOpen = `/profile/${notificationData.actorUsername}`;
    }
  }

  // Abrir o enfocar la ventana de la app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Buscar si ya hay una ventana abierta
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Si ya está abierta, navegarla a la URL y enfocarla
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              url: urlToOpen,
              data: notificationData
            });
            return client.focus();
          }
        }
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Manejo de mensajes desde el cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
