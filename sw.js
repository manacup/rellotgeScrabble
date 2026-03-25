const CACHE = 'rellotgeScrabble-1.4.4';

const FILES = [
  './',
  './index.html',
  './css/style.css',
  './js/script.js',
  './js/nosleep.min.js',
  './wdtjs/jquery.js',
  './wdtjs/general.js',
  './wdtjs/bits.js',
  './dicc/disc.js',
  './fonts/FiraMono-Regular.woff2',
  './audio/460133__eschwabe3__robot-affirmative.wav',
  './audio/561660__mattruthsound.wav',
  './audio/beep-07a.wav',
  './audio/silenci.mp3',
  './rellotge.webmanifest',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request))
  );
});
