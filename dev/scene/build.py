#!/usr/bin/env python3
"""Build 团团小镇闹哄哄 into site/: one HTML page + art + music + offline support."""
import os, re, shutil, subprocess, json, hashlib
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
OUT = os.path.join(ROOT, 'site')

game = open(os.path.join(SRC, 'game.js'), encoding='utf-8').read()
audio = open(os.path.join(SRC, 'audio.js'), encoding='utf-8').read()
shell = open(os.path.join(SRC, 'shell.html'), encoding='utf-8').read()
VER = re.search(r"const VER='(v\d+)'", game).group(1)

bgs = [n for n in ('bg1', 'bg2', 'bg3', 'bg4', 'bg5') if os.path.exists(os.path.join(ROOT, 'art', n + '.webp'))]
game = game.replace('/*@@BG@@*/[]', json.dumps(bgs))
body = shell.replace('/*@@AUDIO@@*/', audio).replace('/*@@GAME@@*/', game)
title = re.search(r'<title>(.*?)</title>', body).group(1)
body = re.sub(r'<title>.*?</title>\n?', '', body, count=1)

head = f'''<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="{title}">
<meta name="theme-color" content="#fbefdc">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="icon" href="icon-192.png">
<title>{title}</title>
</head>
<body>
'''
tail = '''
<script>
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
</script>
</body>
</html>
'''
if os.path.exists(OUT):
    shutil.rmtree(OUT)
os.makedirs(os.path.join(OUT, 'art'))
os.makedirs(os.path.join(OUT, 'music'))
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(head + body + tail)

arts = sorted(os.listdir(os.path.join(ROOT, 'art')))
for a in arts:
    shutil.copy(os.path.join(ROOT, 'art', a), os.path.join(OUT, 'art', a))

# music: original tracks of the 团团 brand, AAC in an .mp4 box (plays everywhere, the artifact host accepts it)
for name in ('bgm-menu', 'bgm-play'):
    shutil.copy(os.path.join(ROOT, 'music', name + '.mp4'), os.path.join(OUT, 'music', name + '.mp4'))

# icons: 团团 on a warm round tile
tt = Image.open(os.path.join(ROOT, 'art', 'tuantuan.webp')).convert('RGBA')
for size in (180, 192, 512):
    bg = Image.new('RGBA', (size, size), (255, 227, 194, 255))
    s = int(size * .86)
    im = tt.copy(); im.thumbnail((s, s), Image.LANCZOS)
    bg.alpha_composite(im, ((size - im.width) // 2, size - im.height - int(size * .04)))
    bg.convert('RGB').save(os.path.join(OUT, ('apple-touch-icon.png' if size == 180 else f'icon-{size}.png')))

json.dump({"name": title, "short_name": title, "lang": "zh-CN", "start_url": "./", "scope": "./", "display": "standalone",
           "orientation": "portrait", "background_color": "#fbefdc", "theme_color": "#fbefdc",
           "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png"},
                     {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable"}]},
          open(os.path.join(OUT, 'manifest.webmanifest'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

files = ['./', 'index.html', 'manifest.webmanifest', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'] + \
        ['art/' + a for a in arts] + ['music/bgm-menu.mp4', 'music/bgm-play.mp4']
h = hashlib.sha1(open(os.path.join(OUT, 'index.html'), 'rb').read()).hexdigest()[:8]
CACHE = f'ttscene-{VER}-{h}'
sw = f'''// offline: network first, cache as fallback. Only touches its own caches (other games share this site).
const CACHE='{CACHE}',PRE={json.dumps(files)};
self.addEventListener('install',e=>{{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>Promise.all(PRE.map(u=>c.add(new Request(u,{{cache:'reload'}})).catch(()=>{{}})))));}});
self.addEventListener('activate',e=>{{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>(k.startsWith('ttscene-')||k.startsWith('ttscene-x-'))&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));}});
self.addEventListener('fetch',e=>{{const r=e.request;if(r.method!=='GET'||!r.url.startsWith(self.registration.scope))return;
  e.respondWith(fetch(r,{{cache:'no-cache'}}).then(res=>{{if(res&&res.ok&&res.status===200){{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));}}return res;}})
   .catch(()=>caches.match(r,{{ignoreSearch:true}}).then(m=>m||caches.match('./index.html'))));}});
'''
open(os.path.join(OUT, 'sw.js'), 'w').write(sw)
print('built', title, VER, CACHE, sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(OUT) for f in fs) // 1024, 'KB')
