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
print(len(keys),'art; missing:',miss)
