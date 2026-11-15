// Offline support: online -> newest files first, offline -> saved copy.
const CACHE='cheonha-main-1';
// 이 캐시는 /cheonha/ 루트의 천하등용 파일만 다룬다. 다른 게임 폴더(town, wolchuk 등)는 건드리지 않는다.
const OWN=/^(?:[^/]*|(?:art|audio|sd)\/.*)$/;
const OLD=['cheonha-','cheonhav30sd-','cheonhav28test-','cheonhav20test-'];
const CORE=['./','./index.html','./zh.html','./legion.html','./legion-zh.html','./legion_core.js','./legion_ui.js','./legion_orders.js','./platform.js','./legal.html','./legal-zh.html','./manifest.webmanifest','./manifest-zh.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./art/portraits.webp','./art/legion/bg_castle.webp','./art/legion/bg_forest.webp','./art/legion/bg_gate.webp','./art/legion/bg_mountain.webp','./art/legion/bg_plain.webp','./art/legion/bg_river.webp','./art/legion/brush_stroke.webp','./art/legion/flag_0.webp','./art/legion/flag_1.webp','./art/legion/flag_2.webp','./art/legion/flag_3.webp','./art/legion/fx_eastwind.webp','./art/legion/fx_firewall.webp','./art/legion/fx_heal.webp','./art/legion/fx_qinglong.webp','./art/legion/fx_wushuang.webp','./art/legion/reserve_ally.webp','./art/legion/reserve_foe.webp','./art/legion/seal.webp','./art/legion/sol_arc_ally.webp','./art/legion/sol_arc_foe.webp','./art/legion/sol_cav_ally.webp','./art/legion/sol_cav_foe.webp','./art/legion/sol_inf_ally.webp','./art/legion/sol_inf_foe.webp','./art/legion/sol_str_ally.webp','./art/legion/sol_str_foe.webp','./art/tiles_v20.webp','./art/horizon_v20.webp','./art/camp_side_v20.webp','./art/mobs.webp','./art/theme_day.webp','./art/theme_dusk.webp','./art/theme_night.webp','./art/theme_siege.webp','./art/theme_winter.webp'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&OLD.some(p=>k.startsWith(p))).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||!e.request.url.startsWith(self.location.origin))return;
  const base=new URL('./',self.location).pathname,p=new URL(e.request.url).pathname;
  if(!p.startsWith(base)||!OWN.test(decodeURIComponent(p.slice(base.length))))return;
  e.respondWith(fetch(e.request,{cache:'no-cache'}).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});}return res;})
    .catch(()=>caches.match(e.request,{ignoreSearch:true}).then(hit=>hit||caches.match(e.request.url.includes('zh.html')?'./zh.html':'./index.html'))));
});
