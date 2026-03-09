// Service Worker for Aqsati ERP - v2.2.1
// Plain JavaScript - No TypeScript

const CACHE_NAME = 'aqsati-v2.2.1'
const OFFLINE_CACHE = 'aqsati-offline-v2.2.1'

// الملفات الأساسية للتخزين المؤقت
const STATIC_ASSETS = [
  '/',
  '/manifest.json'
]

// صفحة الخطأ أوفلاين
const OFFLINE_FALLBACK = '/offline.html'

// تثبيت Service Worker
self.addEventListener('install', function(event) {
  console.log('[SW] Installing Service Worker v2.2.0...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(function() {
        console.log('[SW] Service Worker installed successfully - forcing update')
        return self.skipWaiting()
      })
      .catch(function(error) {
        console.error('[SW] Failed to cache:', error)
      })
  )
})

// تنشيط Service Worker
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating Service Worker...')
  
  event.waitUntil(
    caches.keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames
            .filter(function(name) { 
              return name !== CACHE_NAME && name !== OFFLINE_CACHE 
            })
            .map(function(name) {
              console.log('[SW] Deleting old cache:', name)
              return caches.delete(name)
            })
        )
      })
      .then(function() {
        console.log('[SW] Service Worker activated successfully')
        return self.clients.claim()
      })
  )
})

// استراتيجية Cache First
function cacheFirst(request) {
  return caches.match(request)
    .then(function(cachedResponse) {
      if (cachedResponse) {
        return cachedResponse
      }
      
      return fetch(request)
        .then(function(networkResponse) {
          if (networkResponse.ok) {
            var responseClone = networkResponse.clone()
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(request, responseClone)
              })
          }
          return networkResponse
        })
        .catch(function(error) {
          console.error('[SW] Cache first failed:', error)
          throw error
        })
    })
}

// استراتيجية Network First
function networkFirst(request) {
  return fetch(request)
    .then(function(networkResponse) {
      if (networkResponse.ok) {
        var responseClone = networkResponse.clone()
        caches.open(CACHE_NAME)
          .then(function(cache) {
            cache.put(request, responseClone)
          })
      }
      return networkResponse
    })
    .catch(function(error) {
      console.log('[SW] Network failed, trying cache...')
      return caches.match(request)
        .then(function(cachedResponse) {
          if (cachedResponse) {
            return cachedResponse
          }
          throw error
        })
    })
}

// معالجة طلبات Fetch
self.addEventListener('fetch', function(event) {
  var request = event.request
  var url = new URL(request.url)
  
  // تجاهل طلبات Chrome Extension وطلبات non-GET
  if (url.protocol === 'chrome-extension:' || request.method !== 'GET') {
    return
  }
  
  // تجاهل طلبات API الخارجية
  if (url.origin !== self.location.origin) {
    return
  }
  
  // استراتيجية مختلفة حسب نوع الطلب
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request))
  } else if (url.pathname.startsWith('/api/')) {
    // API requests - Network First
    event.respondWith(networkFirst(request))
  } else if (request.destination === 'document') {
    // صفحات HTML - Network First مع fallback
    event.respondWith(
      networkFirst(request)
        .catch(function() {
          return caches.match(OFFLINE_FALLBACK)
            .then(function(response) {
              return response || new Response('غير متصل', {
                status: 503,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
              })
            })
        })
    )
  } else {
    // باقي الطلبات - Cache First
    event.respondWith(cacheFirst(request))
  }
})

// معالجة الرسائل من التطبيق
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    var urls = event.data.urls
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urls)
      })
      .then(function() {
        console.log('[SW] Cached URLs:', urls)
      })
  }
})

// إشعارات Push
self.addEventListener('push', function(event) {
  if (!event.data) return
  
  var data = {}
  try {
    data = event.data.json()
  } catch (e) {
    data = { title: 'أقساطي', body: 'إشعار جديد' }
  }
  
  var options = {
    body: data.body || 'إشعار جديد من نظام أقساطي',
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-192x192.svg',
    vibrate: [100, 50, 100],
    dir: 'rtl',
    lang: 'ar',
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'فتح' },
      { action: 'close', title: 'إغلاق' }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'أقساطي', options)
  )
})

// النقر على الإشعارات
self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  
  if (event.action === 'close') return
  
  var urlToOpen = event.notification.data?.url || '/'
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // إذا كان هناك نافذة مفتوحة، ركز عليها
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i]
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus()
          }
        }
        // وإلا افتح نافذة جديدة
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen)
        }
      })
  )
})

// Background Sync (إذا كان مدعوماً)
if ('sync' in self) {
  self.addEventListener('sync', function(event) {
    if (event.tag === 'sync-data') {
      event.waitUntil(
        console.log('[SW] Syncing data in background...')
      )
    }
  })
}

console.log('[SW] Service Worker loaded - v2.2.0')
