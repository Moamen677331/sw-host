// Service Worker - العمل بدون إنترنت لمدونة بلوجر
const CACHE_NAME = 'blogger-pwa-v1';

// الأصول الأساسية المراد تخزينها مؤقتاً
const ASSETS_TO_CACHE = [
  '/',
  '/?m=1'
];

// 1. تثبيت Service Worker وتخزين الأصول الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[PWA] Caching core assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. تنشيط Service Worker وتنظيف التخزين القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[PWA] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. استراتيجية شبكة أولاً مع الرجوع للتخزين المؤقت عند انقطاع النت (Network First with Cache Fallback)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // إذا كان الاتصال بالإنترنت ناجحاً، قم بتحديث التخزين المؤقت
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // في حالة عدم وجود إنترنت، اجلب النسخة المحفوظة
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // إذا لم يجد الصفحة المطلوبة، يعود للصفحة الرئيسية المحفوظة
          return caches.match('/');
        });
      })
  );
});
