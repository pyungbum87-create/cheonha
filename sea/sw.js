// 오프라인: 인터넷이 되면 새 파일, 안 되면 저장해 둔 파일. 이 게임 전용 캐시(deepsea-)만 만진다.
const CACHE='deepsea-1117-1433',PRE=["./", "index.html", "game.js", "manifest.webmanifest", "icon-192.png"];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>Promise.all(PRE.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('deepsea-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||!r.url.startsWith(self.registration.scope))return;
  e.respondWith(fetch(r,{cache:'no-cache'}).then(res=>{if(res&&res.status===200){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));}return res;})
   .catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('./index.html'))));});
