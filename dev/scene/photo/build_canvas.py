#!/usr/bin/env python3
"""Canvas build. Run build.py first (it prepares the pictures in site/). Makes:
   canvas/web  - the page for phones' browsers
   canvas/wx   - WeChat mini-game project folder
   canvas/tt   - Douyin mini-game project folder"""
import json,os,re,shutil,subprocess
R=os.path.dirname(os.path.abspath(__file__));S=R+'/site';O=R+'/canvas';shutil.rmtree(O,ignore_errors=True)
data=subprocess.check_output(['node','-e',"process.stdout.write(JSON.stringify(require('./src/stages.js')))"],cwd=R).decode()
BUILD=re.search(r"const BUILD='([^']+)'",open(S+'/photo.html',encoding='utf-8').read()).group(1)
js=open(R+'/src/game.js',encoding='utf-8').read().replace('/*@@STAGES@@*/[]',data).replace("'DEVBUILD'","'"+BUILD+"'")
def pics(dst):
    os.makedirs(dst+'/art');os.makedirs(dst+'/story');os.makedirs(dst+'/audio')
    for f in os.listdir(S+'/art'):shutil.copy(S+'/art/'+f,dst+('/story/' if f.startswith('end_') else '/art/')+f)
    shutil.copytree(S+'/thumb',dst+'/thumb');shutil.copytree(R+'/sfx',dst+'/sfx')
    for f in os.listdir(S+'/music'):shutil.copy(S+'/music/'+f,dst+'/audio/'+f)
# ---- web
W=O+'/web';pics(W);open(W+'/game.js','w',encoding='utf-8').write(js)
# the older page at this address registered an offline helper; this one removes it and its saved copies
open(W+'/sw.js','w').write("self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('tttown-')).map(k=>caches.delete(k)))).then(()=>self.registration.unregister())));\n")
for f in ('icon-192.png','icon-512.png','apple-touch-icon.png','manifest.webmanifest'):shutil.copy(S+'/'+f,W+'/'+f)
open(W+'/index.html','w',encoding='utf-8').write(f'''<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="동네소동">
<meta name="theme-color" content="#fbefdc">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="icon" href="icon-192.png">
<title>团团小镇闹哄哄</title>
<style>html,body{{margin:0;height:100%;background:#fbefdc;overflow:hidden;overscroll-behavior:none}}#cv{{display:block;position:fixed;left:0;top:0;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}}#probe{{position:fixed;padding-top:env(safe-area-inset-top,0px);visibility:hidden}}</style>
</head>
<body><div id="probe"></div><canvas id="cv"></canvas>
<script src="game.js?v={BUILD}"></script>
</body>
</html>
''')
# ---- WeChat / Douyin: main package = code + pictures for play; story pictures and music are separate packs loaded when needed
for name in ('wx','tt'):
    D=O+'/'+name;pics(D);open(D+'/game.js','w',encoding='utf-8').write(js)
    for sp in ('story','audio'):open(D+'/'+sp+'/game.js','w').write('// pack: '+sp+'\n')
    json.dump({'deviceOrientation':'portrait','showStatusBar':False,'networkTimeout':{'request':10000,'downloadFile':10000},'subpackages':[{'name':'story','root':'story/'},{'name':'audio','root':'audio/'}]},open(D+'/game.json','w'),indent=1)
    json.dump({'description':'团团小镇闹哄哄','appid':'<填写你的AppID>','projectname':'tuantuan-town','compileType':'game','setting':{'es6':True,'minified':True,'urlCheck':True}},open(D+'/project.config.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
def size(p,skip=()):
    t=0
    for d,_,fs in os.walk(p):
        if any(d.startswith(p+'/'+s) for s in skip):continue
        t+=sum(os.path.getsize(d+'/'+f) for f in fs)
    return t
print('build',BUILD,'| web %.2fMB | wx main %.2fMB, story %.2fMB, audio %.2fMB'%(size(W)/1e6,size(O+'/wx',('story','audio'))/1e6,size(O+'/wx/story')/1e6,size(O+'/wx/audio')/1e6))
