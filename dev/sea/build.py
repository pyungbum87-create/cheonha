#!/usr/bin/env python3
"""심해 신전 수비대 빌드: src/*.js 를 game.js 한 장으로 묶고 site/ 를 만든다.  python3 build.py"""
import os, shutil, json, time, math
from PIL import Image, ImageDraw, ImageFilter
ROOT = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(ROOT, 'src'); OUT = os.path.join(ROOT, 'site')
BUILD = time.strftime('%m%d-%H%M', time.gmtime(time.time() + 9 * 3600))
js = '\n'.join(open(os.path.join(SRC, f), encoding='utf-8').read() for f in ('data.js', 'core.js', 'plat.js', 'art.js', 'ui.js'))
ARTDIR = os.path.join(ROOT, 'art'); arts = sorted(os.path.splitext(a)[0] for a in os.listdir(ARTDIR) if a.lower().endswith(('.png', '.webp'))) if os.path.isdir(ARTDIR) else []
arts += [a + '_p' for a in arts if a.startswith('en_')]
js = '(()=>{"use strict";\n' + js.replace('@@BUILD@@', BUILD).replace('@@ART@@', json.dumps(arts)) + '\n})();\n'
if os.path.exists(OUT): shutil.rmtree(OUT)
os.makedirs(os.path.join(OUT, 'art'))
for a in sorted(os.listdir(ARTDIR)) if os.path.isdir(ARTDIR) else []:
    if not a.lower().endswith(('.png', '.webp')): continue
    im = Image.open(os.path.join(ARTDIR, a)).convert('RGBA'); n = os.path.splitext(a)[0]
    lim = 1080 if n.startswith('bg_') else 360
    if max(im.size) > lim: im.thumbnail((lim, lim), Image.LANCZOS)
    im.save(os.path.join(OUT, 'art', n + '.webp'), 'WEBP', quality=88, method=6)
    if n.startswith('en_'):   # 정화된 모습: 보랏빛을 맑은 청록빛으로(외곽선은 그대로)
        import numpy as np
        hsv = np.array(im.convert('RGB').convert('HSV')).astype(int); hsv[..., 0] = (hsv[..., 0] - 84) % 256; hsv[..., 1] = np.clip(hsv[..., 1] * .85, 0, 255); hsv[..., 2] = np.clip(hsv[..., 2] * 1.25 + 14 * (hsv[..., 2] > 60), 0, 255)
        pu = Image.fromarray(hsv.astype('uint8'), 'HSV').convert('RGB').convert('RGBA'); pu.putalpha(im.getchannel('A')); pu.save(os.path.join(OUT, 'art', n + '_p.webp'), 'WEBP', quality=88, method=6)
open(os.path.join(OUT, 'game.js'), 'w', encoding='utf-8').write(js)
TITLE = '심해 신전 수비대'; BG = '#0d3a48'
html = f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"/><meta http-equiv="Cache-Control" content="no-cache"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"/><title>{TITLE}</title>
<link rel="manifest" href="manifest.webmanifest"/><link rel="apple-touch-icon" href="apple-touch-icon.png"/><link rel="icon" type="image/png" href="icon-192.png"/>
<meta name="apple-mobile-web-app-capable" content="yes"/><meta name="mobile-web-app-capable" content="yes"/><meta name="apple-mobile-web-app-title" content="{TITLE}"/><meta name="theme-color" content="{BG}"/>
<style>@font-face{{font-family:DS;src:url(ds-black.otf);font-weight:800 900;font-display:swap}}@font-face{{font-family:DS;src:url(ds-bold.otf);font-weight:100 700;font-display:swap}}*{{box-sizing:border-box}}html,body{{margin:0;width:100%;height:100%;overflow:hidden;background:{BG};touch-action:none;overscroll-behavior:none}}
body{{display:flex;justify-content:center;align-items:center;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}}
canvas{{height:min(100dvh,177.8667vw);width:min(100vw,56.22dvh);display:block;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}}</style></head>
<body><canvas id="game" width="750" height="1334"></canvas><script src="game.js?v={BUILD}"></script>
<script>if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{{}}));</script></body></html>
'''
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
# 글꼴: Noto Sans CJK(OFL) 에서 게임에 쓰는 글자만 뽑아 넣는다(굵은 글씨가 화면 인상을 좌우함)
from fontTools.ttLib import TTCollection
from fontTools import subset
chars = ''.join(sorted(set(c for c in js + TITLE if ord(c) > 31)))
for src, dst in (('NotoSansCJK-Black.ttc', 'ds-black.otf'), ('NotoSansCJK-Bold.ttc', 'ds-bold.otf')):
    col = TTCollection('/usr/share/fonts/opentype/noto/' + src); f = next(t for t in col.fonts if 'CJK KR' in t['name'].getDebugName(1))
    opt = subset.Options(); opt.layout_features = []; opt.name_IDs = [1, 2]; opt.notdef_outline = True; opt.desubroutinize = True
    sub = subset.Subsetter(opt); sub.populate(text=chars); sub.subset(f); f.save(os.path.join(OUT, dst))
# 아이콘: 가드 그림 + 바다빛 바탕
def icon(size):
    S = size; im = Image.new('RGBA', (S, S)); d = ImageDraw.Draw(im)
    for y in range(S):
        t = y / S; d.line([(0, y), (S, y)], fill=(int(24 - 10 * t), int(150 - 90 * t), int(170 - 80 * t), 255))
    gl = Image.new('RGBA', (S, S)); ImageDraw.Draw(gl).ellipse([S*.12, S*.15, S*.88, S*.95], fill=(120, 255, 235, 120)); im.alpha_composite(gl.filter(ImageFilter.GaussianBlur(S*.1)))
    h = Image.open(os.path.join(ARTDIR, 'hero_guard.webp')).convert('RGBA'); k = S * .86 / max(h.size); h = h.resize((int(h.width * k), int(h.height * k)), Image.LANCZOS)
    im.alpha_composite(h, ((S - h.width) // 2, (S - h.height) // 2 + int(S * .02)))
    return im.convert('RGB')
icon(180).save(os.path.join(OUT, 'apple-touch-icon.png')); icon(192).save(os.path.join(OUT, 'icon-192.png')); icon(512).save(os.path.join(OUT, 'icon-512.png'))
json.dump({"name": TITLE, "short_name": TITLE, "lang": "ko", "start_url": "./", "scope": "./", "display": "standalone", "orientation": "portrait", "background_color": BG, "theme_color": BG,
           "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png"}, {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable"}]},
          open(os.path.join(OUT, 'manifest.webmanifest'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
files = ['./', 'index.html', 'game.js', 'manifest.webmanifest', 'icon-192.png', 'ds-black.otf', 'ds-bold.otf'] + ['art/' + a + '.webp' for a in arts]
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
