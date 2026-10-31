// offline: network first, cache as fallback. Only touches its own caches (other games share this site).
const CACHE='tttower-v2-e3857bca',PRE=["./", "index.html", "manifest.webmanifest", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "art/charsiu.webp", "art/eggtart.webp", "art/hargow.webp", "art/sesame.webp", "art/siumai.webp", "art/steamer.webp", "art/steamer_gold.webp", "art/steamer_jade.webp", "art/steamer_night.webp", "art/steamer_red.webp", "art/steamer_sakura.webp", "art/tuantuan.webp", "art/xiaolong.webp", "music/bgm-menu.mp4", "music/bgm-play.mp4"];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>Promise.all(PRE.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>(k.startsWith('tttower-')||k.startsWith('tuantuan-tower-'))&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||!r.url.startsWith(self.registration.scope))return;
  e.respondWith(fetch(r,{cache:'no-cache'}).then(res=>{if(res&&res.ok&&res.status===200){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));}return res;})
   .catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('./index.html'))));});
