// 离线缓存：没网也能打开已缓存的页面
const CACHE = 'dream-diary-v1';
const FILES = [
  '/', '/index.html',
  '/css/main.css', '/css/components.css',
  '/js/app.js', '/js/utils.js', '/js/db.js', '/js/gemini.js',
  '/js/recorder.js', '/js/tts.js', '/js/particles.js',
  '/js/diary.js', '/js/ui.js', '/js/settings.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
