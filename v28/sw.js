// Offline support: online -> newest files first, offline -> saved copy.
const CACHE='cheonhav28test-v28';
const CORE=['./','./index.html','./zh.html','./manifest.webmanifest','./manifest-zh.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./art/portraits.webp','./art/tiles_v20.webp','./art/horizon_v20.webp','./art/camp_side_v20.webp','./art/mobs.webp','./art/theme_day.webp','./art/theme_dusk.webp','./art/theme_night.webp','./art/theme_siege.webp','./art/theme_winter.webp'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('cheonhav28test-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||!e.request.url.startsWith(self.location.origin))return;
  e.respondWith(fetch(e.request,{cache:'no-cache'}).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});}return res;})
    .catch(()=>caches.match(e.request,{ignoreSearch:true}).then(hit=>hit||caches.match(e.request.url.includes('zh.html')?'./zh.html':'./index.html'))));
});
