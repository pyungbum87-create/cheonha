// Offline support: online -> newest files first, offline -> saved copy.
const CACHE='cheonha-main-6';
// 이 캐시는 /cheonha/ 루트의 천하등용 파일만 다룬다. 다른 게임 폴더(town, wolchuk 등)는 건드리지 않는다.
const OWN=/^(?:[^/]*|(?:art|audio|sd)\/.*)$/;
const OLD=['cheonha-','cheonhav30sd-','cheonhav28test-','cheonhav20test-'];
// v31.2 용량: 설치 때는 본편(한·중) 실행에 필요한 것만 미리 받는다. 관문 돌파·약관·음악·SD 그림은 처음 쓸 때 받아서 저장한다.
const CORE=['./','./index.html','./zh.html','./v31.js','./v32.js','./v33.js','./platform.js','./sd/sdv.js','./manifest.webmanifest','./manifest-zh.webmanifest','./icon-192.png','./apple-touch-icon.png','./art/camp_side_v20.webp','./art/ground.webp','./art/horizon_v20.webp','./art/mobs.webp','./art/portraits.webp','./art/scenario_map.webp','./art/theme_day.webp','./art/theme_dusk.webp','./art/theme_night.webp','./art/theme_siege.webp','./art/theme_winter.webp','./art/tiles_v20.webp','./art/title_bg.webp'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE.map(u=>new Request(u,{cache:'no-cache'})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&OLD.some(p=>k.startsWith(p))).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||!e.request.url.startsWith(self.location.origin))return;
  const base=new URL('./',self.location).pathname,p=new URL(e.request.url).pathname;
  if(!p.startsWith(base)||!OWN.test(decodeURIComponent(p.slice(base.length))))return;
  e.respondWith(fetch(e.request,{cache:'no-cache'}).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});}return res;})
    .catch(()=>caches.match(e.request,{ignoreSearch:true}).then(hit=>hit||caches.match(e.request.url.includes('zh.html')?'./zh.html':'./index.html'))));
});
