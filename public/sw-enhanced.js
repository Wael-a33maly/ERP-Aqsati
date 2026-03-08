// Service Worker المحسن لـ ERP Aqsati
// يدعم Offline Mode الكامل مع Background Sync

const CACHE_VERSION = 'erp-aqsati-v2';
const STATIC_CACHE = 'erp-static-v2';
const DYNAMIC_CACHE = 'erp-dynamic-v2';
const API_CACHE = 'erp-api-v2';

// الملفات الأساسية للتخزين المؤقت
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
];

// API endpoints للـ offline
const CACHEABLE_APIS = [
  '/api/customers',
  '/api/products',
  '/api/invoices',
  '/api/payments',
  '/api/installments',
  '/api/dashboard/stats',
  '/api/categories',
  '/api/branches',
  '/api/users',
];

// مدة صلاحية الكاش
const CACHE_TTL = {
  static: 30 * 24 * 60 * 60 * 1000, // 30 يوم
  api: 5 * 60 * 1000, // 5 دقائق
  dynamic: 60 * 60 * 1000, // ساعة
};

// ===================== INSTALL =====================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Enhanced Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // تخزين الملفات الثابتة
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // إنشاء الكاش الديناميكي
      caches.open(DYNAMIC_CACHE),
      caches.open(API_CACHE),
    ]).then(() => {
      console.log('[SW] All caches initialized');
      return self.skipWaiting();
    })
  );
});

// ===================== ACTIVATE =====================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Enhanced Service Worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return ![STATIC_CACHE, DYNAMIC_CACHE, API_CACHE].includes(cacheName);
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('[SW] Service Worker activated');
      return self.clients.claim();
    })
  );
});

// ===================== FETCH =====================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // تجاهل طلبات غير HTTP
  if (!url.protocol.startsWith('http')) return;

  // معالجة طلبات التنقل
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // معالجة API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // معالجة الملفات الثابتة
  event.respondWith(handleStaticRequest(request));
});

// ===================== NAVIGATION HANDLER =====================
async function handleNavigation(request) {
  try {
    // محاولة الشبكة أولاً
    const networkResponse = await fetch(request);
    
    // تخزين الصفحة للـ offline
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    // محاولة الحصول من الكاش
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // صفحة الـ offline
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // صفحة offline افتراضية
    return new Response(
      `<!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>غير متصل - ERP أقساطي</title>
        <style>
          body { font-family: 'Noto Sans Arabic', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
          .container { text-align: center; padding: 2rem; }
          .icon { font-size: 4rem; margin-bottom: 1rem; }
          h1 { color: #333; margin-bottom: 0.5rem; }
          p { color: #666; margin-bottom: 1.5rem; }
          button { background: #3b82f6; color: white; border: none; padding: 0.75rem 2rem; border-radius: 0.5rem; cursor: pointer; font-size: 1rem; }
          button:hover { background: #2563eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">📡</div>
          <h1>غير متصل بالإنترنت</h1>
          <p>يبدو أنك غير متصل بالإنترنت. تحقق من اتصالك وحاول مرة أخرى.</p>
          <button onclick="location.reload()">إعادة المحاولة</button>
        </div>
      </body>
      </html>`,
      {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }
}

// ===================== API HANDLER =====================
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const method = request.method;

  // للطلبات غير GET، نحتاج معالجة خاصة
  if (method !== 'GET') {
    return handleMutationRequest(request);
  }

  // تحقق إذا كان الـ API قابل للتخزين
  const isCacheable = CACHEABLE_APIS.some(api => url.pathname.startsWith(api));

  if (isCacheable) {
    // استراتيجية Network First مع Fallback للكاش
    return networkFirstWithCache(request, API_CACHE, CACHE_TTL.api);
  }

  // للـ APIs غير القابلة للتخزين
  return fetch(request);
}

// ===================== NETWORK FIRST WITH CACHE =====================
async function networkFirstWithCache(request, cacheName, ttl) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // تخزين مع timestamp
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-timestamp', Date.now().toString());
      
      const cachedResponse = new Response(await responseToCache.blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers
      });
      
      cache.put(request, cachedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    // محاولة الحصول من الكاش
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // التحقق من صلاحية الكاش
      const cacheTimestamp = cachedResponse.headers.get('sw-cache-timestamp');
      if (cacheTimestamp && Date.now() - parseInt(cacheTimestamp) < ttl) {
        // إضافة header للإشارة لوجود البيانات من الكاش
        const headers = new Headers(cachedResponse.headers);
        headers.set('X-From-Cache', 'true');
        headers.set('X-Cache-Age', String(Math.round((Date.now() - parseInt(cacheTimestamp)) / 1000)));
        
        return new Response(await cachedResponse.blob(), {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers
        });
      }
    }
    
    // إرجاع استجابة خطأ
    return new Response(JSON.stringify({ 
      success: false,
      error: 'غير متصل بالإنترنت',
      offline: true,
      cachedData: cachedResponse ? await cachedResponse.json() : null
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ===================== MUTATION HANDLER =====================
async function handleMutationRequest(request) {
  const url = new URL(request.url);
  
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    // تخزين الطلب للمزامنة لاحقاً
    const requestData = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers),
      body: await request.clone().text(),
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    // تخزين في IndexedDB عبر main thread
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'OFFLINE_MUTATION_QUEUED',
        data: requestData
      });
    });

    return new Response(JSON.stringify({
      success: false,
      message: 'تم حفظ الطلب للمزامنة لاحقاً عند الاتصال',
      offline: true,
      queued: true,
      id: requestData.id
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ===================== STATIC HANDLER =====================
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  // Cache First للملفات الثابتة
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // تحديث في الخلفية
    fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response);
      }
    }).catch(() => {});
    
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Resource not available offline', { status: 503 });
  }
}

// ===================== BACKGROUND SYNC =====================
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  // استخدام أسماء قصيرة للـ sync tags
  if (event.tag === 'sync-data' || event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
  
  if (event.tag === 'sync-loc' || event.tag === 'sync-location') {
    event.waitUntil(syncAgentLocation());
  }
});

async function syncOfflineData() {
  const clients = await self.clients.matchAll();
  
  clients.forEach(client => {
    client.postMessage({
      type: 'START_BACKGROUND_SYNC'
    });
  });
}

async function syncAgentLocation() {
  // مزامنة موقع المندوب
  const clients = await self.clients.matchAll();
  
  clients.forEach(client => {
    client.postMessage({
      type: 'SYNC_LOCATION'
    });
  });
}

// ===================== PUSH NOTIFICATIONS =====================
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  let data = {
    title: 'ERP أقساطي',
    body: 'إشعار جديد',
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/badge.svg',
    tag: 'general',
    url: '/'
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [100, 50, 100],
    tag: data.tag,
    data: {
      url: data.url,
      timestamp: Date.now()
    },
    actions: [
      { action: 'open', title: 'فتح' },
      { action: 'close', title: 'إغلاق' }
    ],
    dir: 'rtl',
    lang: 'ar',
    requireInteraction: data.priority === 'urgent'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ===================== NOTIFICATION CLICK =====================
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // البحث عن نافذة مفتوحة
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({
              type: 'NAVIGATE',
              url: urlToOpen
            });
            return client.focus();
          }
        }
        // فتح نافذة جديدة
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// ===================== MESSAGE HANDLER =====================
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  const { type, data } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_URLS':
      event.waitUntil(
        caches.open(DYNAMIC_CACHE).then((cache) => {
          return cache.addAll(data.urls);
        })
      );
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.keys().then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        })
      );
      break;
      
    case 'GET_CACHE_STATUS':
      event.waitUntil(
        getCacheStatus().then(status => {
          event.source.postMessage({
            type: 'CACHE_STATUS',
            data: status
          });
        })
      );
      break;
  }
});

// ===================== CACHE STATUS =====================
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    status[name] = {
      count: keys.length,
      urls: keys.map(r => r.url)
    };
  }
  
  return status;
}

// ===================== PERIODIC SYNC (if supported) =====================
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    console.log('[SW] Periodic sync:', event.tag);
    
    if (event.tag === 'sync-data') {
      event.waitUntil(syncOfflineData());
    }
  });
}

console.log('[SW] Enhanced Service Worker loaded');
