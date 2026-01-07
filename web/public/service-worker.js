// 这个文件是service-worker.js的源码，它是PWA的核心文件，用来实现离线缓存、消息推送等功能。

self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  // // 可缓存文件
  // event.waitUntil(
  //   caches.open('my-cache').then(cache => {
  //     return cache.addAll([
  //       '/',
  //       '/index.html',
  //       '/static/css/index.css',
  //       '/static/js/index.js'
  //     ]);
  //   })
  // );
});

// self.addEventListener('fetch', event => {
//   event.respondWith(
//     caches.match(event.request).then(response => {
//       return response || fetch(event.request);
//     })
//   );
// });
