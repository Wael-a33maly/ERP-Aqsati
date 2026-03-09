// Service Worker for Aqsati ERP - v2.3.0
// Plain JavaScript - No TypeScript
// DISABLED FOR DEVELOPMENT - Network Only Strategy

const CACHE_NAME = 'aqsati-v2.3.0'
const OFFLINE_CACHE = 'aqsati-offline-v2.3.0'

// الملفات الأساسية للتخزين المؤقت
const STATIC_ASSETS = [
  '/manifest.json'
]

// تثبيت Service Worker
self.addEventListener('install', function(event) {
  console.log('[SW] Installing Service Worker v2.3.0 - DEVELOPMENT MODE')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[SW] Caching minimal assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(function() {
        console.log('[SW] Service Worker installed - forcing immediate activation')
        return self.skipWaiting()
      })
      .catch(function(error) {
        console.error('[SW] Failed to cache:', error)
      })
  )
})

// تنشيط Service Worker
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating Service Worker v2.3.0...')
  
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
        console.log('[SW] Service Worker activated - claiming all clients')
        return self.clients.claim()
      })
  )
})

// Network Only - Always fetch from network (Development Mode)
function networkOnly(request) {
  return fetch(request)
    .then(function(networkResponse) {
      return networkResponse
    })
    .catch(function(error) {
      console.log('[SW] Network failed for:', request.url)
      // Try cache as fallback for offline
      return caches.match(request)
        .then(function(cachedResponse) {
          if (cachedResponse) {
            return cachedResponse
          }
          throw error
        })
    })
}

// معالجة طلبات Fetch - Network Only for Development
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
  
  // تجاهل طلبات _next (Turbopack HMR)
  if (url.pathname.startsWith('/_next/')) {
    return
  }
  
  // Network Only لجميع الطلبات - بدون تخزين مؤقت
  event.respondWith(networkOnly(request))
})

// معالجة الرسائل من التطبيق
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  // مسح كل الكاش
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(name) {
            console.log('[SW] Clearing cache:', name)
            return caches.delete(name)
          })
        )
      })
      .then(function() {
        console.log('[SW] All caches cleared')
      })
  }
})

console.log('[SW] Service Worker loaded - v2.3.0 DEVELOPMENT MODE (No Caching)')
