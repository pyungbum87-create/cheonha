#!/usr/bin/env python3
"""Build the photo mode into site/: one HTML page plus only the art it uses."""
import json,os,re,shutil,subprocess
R=os.path.dirname(os.path.abspath(__file__));O=os.path.join(R,'site');shutil.rmtree(O,ignore_errors=True);os.makedirs(O+'/art')
data=subprocess.check_output(['node','-e',"process.stdout.write(JSON.stringify(require('./src/stages.js')))"],cwd=R).decode()
import datetime
BUILD=(datetime.datetime.utcnow()+datetime.timedelta(hours=8)).strftime('%m%d-%H%M')
html=open(R+'/src/engine.html',encoding='utf-8').read().replace('/*@@STAGES@@*/[]',data).replace("'DEVBUILD'","'"+BUILD+"'")
open(O+'/photo.html','w',encoding='utf-8').write(html)
keys={'logo_zh','logo_ko','lili_basic','lili_shock','lili_joy','lili_worry','paw','tt_cheer','flashlight','clock','fu','hanky','dundun','zhuozhuo','tuantuan','cat_dry','cam_clear'}
for st in json.loads(data):
    keys.add(st['bg'])
    if st.get('hid'):keys.add(st['hid'])
    if st.get('endArt'):keys.add(st['endArt'])
    for o in st['objs']:
        if o.get('img'):keys.add(o['img'])
        for a in o.get('alt',[]):
            if a.get('img'):keys.add(a['img'])
    for t in st['tools']:keys.add(t['img'])
    for r in st['rules']:
        for d in r['do']:
            if d[0]=='tmp' and d[2].get('img'):keys.add(d[2]['img'])
            if d[0]=='fly':keys.add(d[1])
# copy only what is used, re-encoded small: scenes 900px, story art 640px, objects 300px
from PIL import Image
os.makedirs(O+'/thumb');miss=[];bgs={st['bg'] for st in json.loads(data)}
def opt(src,dst,k):
    im=Image.open(src);big=k in bgs;story=k.startswith('end_')
    cap,q=(900,76) if big else (640,74) if story else (800,86) if k.startswith('logo') else (300,82)
    if max(im.size)>cap:im.thumbnail((cap,cap),Image.LANCZOS)
    im.save(dst,'WEBP',quality=q,method=6)
    if os.path.getsize(dst)>os.path.getsize(src):shutil.copy(src,dst)
    if big:t=Image.open(src).convert('RGB');t.thumbnail((240,240),Image.LANCZOS);t.save(O+'/thumb/'+k+'.webp','WEBP',quality=60,method=6)
for k in sorted(keys):
    for base in (R+'/art/',R+'/../art/'):
        if os.path.exists(base+k+'.webp'):opt(base+k+'.webp',O+'/art/'+k+'.webp',k);break
    else:miss.append(k)
shutil.copytree(R+'/music',O+'/music');shutil.copytree(R+'/sfx',O+'/sfx')
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
<meta name="apple-mobile-web-app-title" content="동네소동">
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
ico=Image.open(R+'/art_src/app_icon.png').convert('RGB')
for size in (180,192,512):
    ico.resize((size,size),Image.LANCZOS).quantize(128).save(O+'/'+('apple-touch-icon.png' if size==180 else f'icon-{size}.png'),optimize=True)
json.dump({'name':'동네소동','short_name':'동네소동','lang':'zh-CN','start_url':'./','scope':'./','display':'standalone','orientation':'portrait','background_color':'#fbefdc','theme_color':'#fbefdc','icons':[{'src':'icon-192.png','sizes':'192x192','type':'image/png'},{'src':'icon-512.png','sizes':'512x512','type':'image/png','purpose':'any maskable'}]},open(O+'/manifest.webmanifest','w',encoding='utf-8'),ensure_ascii=False,indent=1)
CORE=['lili_basic','lili_shock','lili_joy','lili_worry','paw','tt_cheer','flashlight','clock','fu']
files=['./','manifest.webmanifest','icon-192.png']+['art/%s.webp?v=%s'%(k,BUILD) for k in CORE]+['thumb/'+t+'?v='+BUILD for t in sorted(os.listdir(O+'/thumb'))]
CACHE='tttown-'+BUILD
sw=f'''// Only touches its own caches (other games share this site).
// The page: network first. Pictures and music carry ?v=build, so they are cached on first use and reused.
const CACHE='{CACHE}',PRE={json.dumps(files)};
self.addEventListener('install',e=>{{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>Promise.all(PRE.map(u=>c.add(u).catch(()=>{{}})))));}});
self.addEventListener('activate',e=>{{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('tttown-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));}});
self.addEventListener('fetch',e=>{{const r=e.request;if(r.method!=='GET'||!r.url.startsWith(self.registration.scope))return;const u=new URL(r.url);
 if(r.headers.has('range')){{e.respondWith(caches.match(r.url).then(async m=>{{if(!m)return fetch(r);const b=await m.arrayBuffer(),q=/bytes=(\\d+)-(\\d*)/.exec(r.headers.get('range')),a=+q[1],z=q[2]?+q[2]:b.byteLength-1;return new Response(b.slice(a,z+1),{{status:206,headers:{{'Content-Type':'audio/mpeg','Content-Range':`bytes ${{a}}-${{z}}/${{b.byteLength}}`,'Content-Length':String(z-a+1),'Accept-Ranges':'bytes'}}}});}}));
  if(/[.]mp3$/.test(u.pathname))e.waitUntil(caches.open(CACHE).then(c=>c.match(r.url).then(m=>m||fetch(r.url).then(x=>x.ok&&c.put(r.url,x)))).catch(()=>{{}}));return;}}
 if(u.searchParams.has('v')){{e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{{if(res&&res.ok){{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));}}return res;}})));return;}}
 e.respondWith(fetch(r,{{cache:'no-cache'}}).then(res=>{{if(res&&res.ok&&res.status===200){{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));}}return res;}}).catch(()=>caches.match(r,{{ignoreSearch:true}}).then(m=>m||caches.match('./'))));}});
'''
open(O+'/sw.js','w').write(sw)
print(len(keys),'art; missing:',miss,'build',BUILD)
