// offline: network first, cache as fallback. Only touches its own caches (other games share this site).
const CACHE='ttscene-v1-5208cbd3',PRE=["./", "index.html", "manifest.webmanifest", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "art/broom.webp", "art/clock.webp", "art/hat.webp", "art/knob.webp", "art/l1_bg.webp", "art/shutter.webp", "art/sign.webp", "art/tuantuan.webp", "music/bgm-menu.mp4", "music/bgm-play.mp4"];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>Promise.all(PRE.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>(k.startsWith('ttscene-')||k.startsWith('ttscene-x-'))&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||!r.url.startsWith(self.registration.scope))return;
  e.respondWith(fetch(r,{cache:'no-cache'}).then(res=>{if(res&&res.ok&&res.status===200){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));}return res;})
   .catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('./index.html'))));});
