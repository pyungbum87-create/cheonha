#!/usr/bin/env python3
"""퇀퇀 해변 수비대 빌드: src/*.js 를 game.js 한 장으로 묶고 site/ 를 만든다.  python3 build.py"""
import os, shutil, json, time
from PIL import Image
ROOT = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(ROOT, 'src'); OUT = os.path.join(ROOT, 'site')
BUILD = time.strftime('%m%d-%H%M', time.gmtime(time.time() + 9 * 3600))
js = '\n'.join(open(os.path.join(SRC, f), encoding='utf-8').read() for f in ('data.js', 'core.js', 'plat.js', 'art.js', 'battle.js', 'ui.js'))
js = '(()=>{"use strict";\n' + js.replace('@@BUILD@@', BUILD) + '\n})();\n'
if os.path.exists(OUT): shutil.rmtree(OUT)
os.makedirs(os.path.join(OUT, 'art')); os.makedirs(os.path.join(OUT, 'music'))
open(os.path.join(OUT, 'game.js'), 'w', encoding='utf-8').write(js)
arts = sorted(os.listdir(os.path.join(ROOT, 'art')))
for a in arts: shutil.copy(os.path.join(ROOT, 'art', a), os.path.join(OUT, 'art', a))
for m in ('bgm-menu.mp4', 'bgm-play.mp4'): shutil.copy(os.path.join(ROOT, 'music', m), os.path.join(OUT, 'music', m))
TITLE = '团团守海滩'
html = f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"/><meta http-equiv="Cache-Control" content="no-cache"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"/><title>{TITLE}</title>
<link rel="manifest" href="manifest.webmanifest"/><link rel="apple-touch-icon" href="apple-touch-icon.png"/><link rel="icon" type="image/png" href="icon-192.png"/>
<meta name="apple-mobile-web-app-capable" content="yes"/><meta name="mobile-web-app-capable" content="yes"/><meta name="apple-mobile-web-app-title" content="{TITLE}"/><meta name="theme-color" content="#bfe9f5"/>
<style>*{{box-sizing:border-box}}html,body{{margin:0;width:100%;height:100%;overflow:hidden;background:#bfe9f5;touch-action:none;overscroll-behavior:none}}
body{{display:flex;justify-content:center;align-items:center;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}}
canvas{{height:min(100dvh,177.8667vw);width:min(100vw,56.22dvh);display:block;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}}</style></head>
<body><canvas id="game" width="750" height="1334"></canvas><script src="game.js?v={BUILD}"></script>
<script>if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{{}}));</script></body></html>
'''
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
tt = Image.open(os.path.join(ROOT, 'art', 'tt_cheer.webp')).convert('RGBA')
for size in (180, 192, 512):
    bg = Image.new('RGBA', (size, size), (143, 214, 240, 255)); sand = Image.new('RGBA', (size, int(size * .3)), (253, 233, 189, 255)); bg.alpha_composite(sand, (0, size - sand.height))
    im = tt.copy(); im.thumbnail((int(size * .84), int(size * .84)), Image.LANCZOS); bg.alpha_composite(im, ((size - im.width) // 2, size - im.height - int(size * .05)))
    bg.convert('RGB').save(os.path.join(OUT, 'apple-touch-icon.png' if size == 180 else f'icon-{size}.png'))
json.dump({"name": TITLE, "short_name": TITLE, "lang": "zh-CN", "start_url": "./", "scope": "./", "display": "standalone", "orientation": "portrait", "background_color": "#bfe9f5", "theme_color": "#bfe9f5",
           "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png"}, {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable"}]},
          open(os.path.join(OUT, 'manifest.webmanifest'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
files = ['./', 'index.html', 'game.js', 'manifest.webmanifest', 'icon-192.png'] + ['art/' + a for a in arts] + ['music/bgm-menu.mp4', 'music/bgm-play.mp4']
sw = f'''// 오프라인: 인터넷이 되면 새 파일, 안 되면 저장해 둔 파일. 이 게임 전용 캐시(ttbeach-)만 만지므로 같은 사이트의 다른 게임과 섞이지 않는다.
const CACHE='ttbeach-{BUILD}',PRE={json.dumps(files)};
self.addEventListener('install',e=>{{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>Promise.all(PRE.map(u=>c.add(new Request(u,{{cache:'reload'}})).catch(()=>{{}})))));}});
self.addEventListener('activate',e=>{{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('ttbeach-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));}});
self.addEventListener('fetch',e=>{{const r=e.request;if(r.method!=='GET'||!r.url.startsWith(self.registration.scope))return;
  e.respondWith(fetch(r,{{cache:'no-cache'}}).then(res=>{{if(res&&res.status===200){{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));}}return res;}})
   .catch(()=>caches.match(r,{{ignoreSearch:true}}).then(m=>m||caches.match('./index.html'))));}});
'''
open(os.path.join(OUT, 'sw.js'), 'w', encoding='utf-8').write(sw)
print('BUILD', BUILD, 'game.js', len(js) // 1024, 'KB', 'site', sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(OUT) for f in fs) // 1024, 'KB')
