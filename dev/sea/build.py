#!/usr/bin/env python3
"""심해 신전 수비대 빌드: src/*.js 를 game.js 한 장으로 묶고 site/ 를 만든다.  python3 build.py"""
import os, shutil, json, time, math
from PIL import Image, ImageDraw, ImageFilter
ROOT = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(ROOT, 'src'); OUT = os.path.join(ROOT, 'site')
BUILD = time.strftime('%m%d-%H%M', time.gmtime(time.time() + 9 * 3600))
js = '\n'.join(open(os.path.join(SRC, f), encoding='utf-8').read() for f in ('data.js', 'core.js', 'plat.js', 'art.js', 'ui.js'))
ARTDIR = os.path.join(ROOT, 'art'); arts = sorted(os.path.splitext(a)[0] for a in os.listdir(ARTDIR) if a.lower().endswith(('.png', '.webp'))) if os.path.isdir(ARTDIR) else []
js = '(()=>{"use strict";\n' + js.replace('@@BUILD@@', BUILD).replace('@@ART@@', json.dumps(arts)) + '\n})();\n'
if os.path.exists(OUT): shutil.rmtree(OUT)
os.makedirs(os.path.join(OUT, 'art'))
for a in sorted(os.listdir(ARTDIR)) if os.path.isdir(ARTDIR) else []:
    if not a.lower().endswith(('.png', '.webp')): continue
    im = Image.open(os.path.join(ARTDIR, a)).convert('RGBA'); n = os.path.splitext(a)[0]
    lim = 1080 if n.startswith('bg_') else 360
    if max(im.size) > lim: im.thumbnail((lim, lim), Image.LANCZOS)
    im.save(os.path.join(OUT, 'art', n + '.webp'), 'WEBP', quality=88, method=6)
open(os.path.join(OUT, 'game.js'), 'w', encoding='utf-8').write(js)
TITLE = '深海神殿守卫'; BG = '#0d3a48'
html = f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"/><meta http-equiv="Cache-Control" content="no-cache"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"/><title>{TITLE}</title>
<link rel="manifest" href="manifest.webmanifest"/><link rel="apple-touch-icon" href="apple-touch-icon.png"/><link rel="icon" type="image/png" href="icon-192.png"/>
<meta name="apple-mobile-web-app-capable" content="yes"/><meta name="mobile-web-app-capable" content="yes"/><meta name="apple-mobile-web-app-title" content="{TITLE}"/><meta name="theme-color" content="{BG}"/>
<style>*{{box-sizing:border-box}}html,body{{margin:0;width:100%;height:100%;overflow:hidden;background:{BG};touch-action:none;overscroll-behavior:none}}
body{{display:flex;justify-content:center;align-items:center;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}}
canvas{{height:min(100dvh,177.8667vw);width:min(100vw,56.22dvh);display:block;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}}</style></head>
<body><canvas id="game" width="750" height="1334"></canvas><script src="game.js?v={BUILD}"></script>
<script>if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{{}}));</script></body></html>
'''
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
# 아이콘: 심해 신전 문 (코드로 그림)
def icon(size):
    S = 4 * size; im = Image.new('RGBA', (S, S)); d = ImageDraw.Draw(im)
    for y in range(S):
        t = y / S; d.line([(0, y), (S, y)], fill=(int(20 + 10 * (1 - t)), int(110 - 70 * t), int(130 - 80 * t), 255))
    gl = Image.new('RGBA', (S, S)); gd = ImageDraw.Draw(gl); gd.ellipse([S*.2, S*.25, S*.8, S*.85], fill=(120, 255, 210, 140)); gl = gl.filter(ImageFilter.GaussianBlur(S*.08)); im.alpha_composite(gl)
    st = (95, 127, 120, 255); d.rectangle([S*.24, S*.34, S*.32, S*.8], fill=st); d.rectangle([S*.68, S*.34, S*.76, S*.8], fill=st)
    d.pieslice([S*.3, S*.28, S*.7, S*.68], 180, 360, fill=(77, 106, 100, 255)); d.rectangle([S*.3, S*.48, S*.7, S*.8], fill=(77, 106, 100, 255))
    d.pieslice([S*.36, S*.36, S*.64, S*.64], 180, 360, fill=(180, 255, 225, 255)); d.rectangle([S*.36, S*.5, S*.64, S*.8], fill=(110, 230, 200, 255))
    d.polygon([(S*.5, S*.5), (S*.55, S*.6), (S*.5, S*.7), (S*.45, S*.6)], fill=(255, 255, 255, 255))
    d.polygon([(S*.44, S*.27), (S*.5, S*.18), (S*.56, S*.27)], fill=(217, 180, 90, 255))
    d.ellipse([S*.14, S*.78, S*.86, S*.92], fill=(69, 102, 99, 255)); d.rectangle([S*.24, S*.8, S*.76, S*.85], fill=(90, 123, 118, 255))
    return im.resize((size, size), Image.LANCZOS).convert('RGB')
icon(180).save(os.path.join(OUT, 'apple-touch-icon.png')); icon(192).save(os.path.join(OUT, 'icon-192.png')); icon(512).save(os.path.join(OUT, 'icon-512.png'))
json.dump({"name": TITLE, "short_name": TITLE, "lang": "zh-CN", "start_url": "./", "scope": "./", "display": "standalone", "orientation": "portrait", "background_color": BG, "theme_color": BG,
           "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png"}, {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable"}]},
          open(os.path.join(OUT, 'manifest.webmanifest'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
files = ['./', 'index.html', 'game.js', 'manifest.webmanifest', 'icon-192.png'] + ['art/' + a + '.webp' for a in arts]
sw = f'''// 오프라인: 인터넷이 되면 새 파일, 안 되면 저장해 둔 파일. 이 게임 전용 캐시(deepsea-)만 만진다.
const CACHE='deepsea-{BUILD}',PRE={json.dumps(files)};
self.addEventListener('install',e=>{{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>Promise.all(PRE.map(u=>c.add(new Request(u,{{cache:'reload'}})).catch(()=>{{}})))));}});
self.addEventListener('activate',e=>{{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('deepsea-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));}});
self.addEventListener('fetch',e=>{{const r=e.request;if(r.method!=='GET'||!r.url.startsWith(self.registration.scope))return;
  e.respondWith(fetch(r,{{cache:'no-cache'}}).then(res=>{{if(res&&res.status===200){{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));}}return res;}})
   .catch(()=>caches.match(r,{{ignoreSearch:true}}).then(m=>m||caches.match('./index.html'))));}});
'''
open(os.path.join(OUT, 'sw.js'), 'w', encoding='utf-8').write(sw)
print('BUILD', BUILD, 'game.js', len(js) // 1024, 'KB')
