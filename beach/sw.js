// 오프라인: 인터넷이 되면 새 파일, 안 되면 저장해 둔 파일. 이 게임 전용 캐시(ttbeach-)만 만지므로 같은 사이트의 다른 게임과 섞이지 않는다.
const CACHE='ttbeach-1117-1116',PRE=["./", "index.html", "game.js", "manifest.webmanifest", "icon-192.png", "art/didi.webp", "art/didi_sick.webp", "art/dundun.webp", "art/gift.webp", "art/pengpeng.webp", "art/shanshan.webp", "art/shell.webp", "art/tt_cheer.webp", "art/tuantuan.webp", "art/zhuozhuo.webp"];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>Promise.all(PRE.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('ttbeach-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||!r.url.startsWith(self.registration.scope))return;
  e.respondWith(fetch(r,{cache:'no-cache'}).then(res=>{if(res&&res.status===200){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));}return res;})
   .catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('./index.html'))));});
