#!/usr/bin/env python3
"""Build the photo mode into site/: one HTML page plus only the art it uses."""
import json,os,re,shutil,subprocess
R=os.path.dirname(os.path.abspath(__file__));O=os.path.join(R,'site');shutil.rmtree(O,ignore_errors=True);os.makedirs(O+'/art')
data=subprocess.check_output(['node','-e',"process.stdout.write(JSON.stringify(require('./src/stages.js')))"],cwd=R).decode()
html=open(R+'/src/engine.html',encoding='utf-8').read().replace('/*@@STAGES@@*/[]',data)
open(O+'/photo.html','w',encoding='utf-8').write(html)
keys={'lili_basic','lili_shock','lili_joy','lili_worry','paw'}
for st in json.loads(data):
    keys.add(st['bg'])
    if st.get('hid'):keys.add(st['hid'])
    for o in st['objs']:
        if o.get('img'):keys.add(o['img'])
        for a in o.get('alt',[]):
            if a.get('img'):keys.add(a['img'])
    for t in st['tools']:keys.add(t['img'])
    for r in st['rules']:
        for d in r['do']:
            if d[0]=='tmp' and d[2].get('img'):keys.add(d[2]['img'])
            if d[0]=='fly':keys.add(d[1])
miss=[]
for k in sorted(keys):
    for base in (R+'/art/',R+'/../art/'):
        if os.path.exists(base+k+'.webp'):shutil.copy(base+k+'.webp',O+'/art/');break
    else:miss.append(k)
shutil.copytree(R+'/music',O+'/music')
# public page: same game plus home-screen and offline support, like the other games on this site
import hashlib
from PIL import Image
title=re.search(r'<title>(.*?)</title>',html).group(1)
body=re.sub(r'<title>.*?</title>\n?|<meta name="claude:[^>]*>\n?','',html)
body=body.replace('<link rel="stylesheet" href="https://fonts.googleapis.com','<link rel="stylesheet" media="print" onload="this.media=\'all\'" href="https://fonts.googleapis.com')
head=f'''<!doctype html>
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
<style>html{{color-scheme:light}}:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);box-sizing:border-box}}body{{margin:0;font-size:14px}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
</head>
<body>
'''
tail='''
<script>if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));</script>
</body>
</html>
'''
open(O+'/index.html','w',encoding='utf-8').write(head+body+tail)
lili=Image.open(R+'/art/lili_joy.webp').convert('RGBA')
for size in (180,192,512):
    bg=Image.new('RGBA',(size,size),(255,227,194,255));im=lili.copy();im.thumbnail((int(size*.84),int(size*.84)),Image.LANCZOS);bg.alpha_composite(im,((size-im.width)//2,(size-im.height)//2))
    bg.convert('RGB').save(O+'/'+('apple-touch-icon.png' if size==180 else f'icon-{size}.png'))
json.dump({'name':title,'short_name':title,'lang':'zh-CN','start_url':'./','scope':'./','display':'standalone','orientation':'portrait','background_color':'#fbefdc','theme_color':'#fbefdc','icons':[{'src':'icon-192.png','sizes':'192x192','type':'image/png'},{'src':'icon-512.png','sizes':'512x512','type':'image/png','purpose':'any maskable'}]},open(O+'/manifest.webmanifest','w',encoding='utf-8'),ensure_ascii=False,indent=1)
files=['./','index.html','manifest.webmanifest','apple-touch-icon.png','icon-192.png','icon-512.png']+['art/'+a for a in sorted(os.listdir(O+'/art'))]+['music/menu.mp3','music/play.mp3']
CACHE='tttown-'+hashlib.sha1((data+html).encode()).hexdigest()[:8]
sw=f'''// offline: network first, cache as fallback. Only touches its own caches (other games share this site).
const CACHE='{CACHE}',PRE={json.dumps(files)};
self.addEventListener('install',e=>{{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>Promise.all(PRE.map(u=>c.add(new Request(u,{{cache:'reload'}})).catch(()=>{{}})))));}});
self.addEventListener('activate',e=>{{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('tttown-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));}});
self.addEventListener('fetch',e=>{{const r=e.request;if(r.method!=='GET'||!r.url.startsWith(self.registration.scope))return;
 e.respondWith(fetch(r,{{cache:'no-cache'}}).then(res=>{{if(res&&res.ok&&res.status===200){{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));}}return res;}}).catch(()=>caches.match(r,{{ignoreSearch:true}}).then(m=>m||caches.match('./index.html'))));}});
'''
open(O+'/sw.js','w').write(sw)
print(len(keys),'art; missing:',miss)
