// 옛 v30 주소의 오프라인 캐시를 스스로 지우는 파일. 정식판은 /cheonha/ 루트에 있다.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const k of await caches.keys()){if(k.startsWith('cheonhav30sd-'))await caches.delete(k);}await self.registration.unregister();for(const c of await self.clients.matchAll({type:'window'}))c.navigate(c.url);})());});
