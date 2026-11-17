#!/usr/bin/env python3
"""ChatGPT 가 준 시트(흰 바탕)를 잘라 배경을 지우고 art/ 에 webp 로 넣는다.
   python3 tools/cut.py 시트.png 높이 이름1 이름2 ...  [--holes]   (왼쪽 위부터 줄 순서. --holes = 가게처럼 안쪽에 갇힌 흰 바탕도 지움)"""
import sys, os, numpy as np
from PIL import Image
from scipy import ndimage as ni
args=[a for a in sys.argv[1:] if not a.startswith('--')]; holes='--holes' in sys.argv
src,H,names=args[0],int(args[1]),args[2:]
im=np.array(Image.open(src).convert('RGB')).astype(np.int16); mn=im.min(2)
white=mn>=238
lab,n=ni.label(white); edge=np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])); bg=np.isin(lab,edge[edge>0])
if holes:   # 갇힌 순백 영역(가게 기둥 사이 등): 아주 희고 고른 큰 덩어리만
    pure=(mn>=250)&~bg; l2,n2=ni.label(pure); area=ni.sum(pure,l2,range(1,n2+1))
    for i,a in enumerate(area,1):
        if a>im.shape[0]*im.shape[1]*0.0012:
            m=l2==i; m=ni.binary_dilation(m,iterations=2)&(mn>=238); bg|=m
fg=~bg
# 덩어리 찾기: 큰 덩어리 N개가 씨앗, 떨어진 작은 조각(등롱·침방울)은 가장 가까운 씨앗에 붙인다
l0,n0=ni.label(ni.binary_dilation(fg,iterations=1)); sl=ni.find_objects(l0); area=ni.sum(fg,l0,range(1,n0+1)); order=list(np.argsort(-area)); seeds=order[:len(names)]
bb={i:[sl[i][0].start,sl[i][1].start,sl[i][0].stop,sl[i][1].stop] for i in seeds}; mp=np.zeros(n0+1,int)
for k,i in enumerate(seeds): mp[i+1]=k+1
for i in order[len(names):]:
    if area[i]<12: continue
    cy=(sl[i][0].start+sl[i][0].stop)/2; cx=(sl[i][1].start+sl[i][1].stop)/2; best=None
    for k,j in enumerate(seeds):
        y0,x0,y1,x1=bb[j]; d=max(y0-cy,0,cy-y1)+max(x0-cx,0,cx-x1)
        if best is None or d<best[0]: best=(d,k)
    if best[0]<60: mp[i+1]=best[1]+1
l3=mp[l0]; sl3=ni.find_objects(l3)
boxes=[(q[0].start,q[1].start,q[0].stop,q[1].stop,k+1) for k,q in enumerate(sl3)]
rowh=np.median([b[2]-b[0] for b in boxes]); boxes.sort(key=lambda b:(b[0]+b[2])/2); rows=[]
for b in boxes:
    if rows and abs((b[0]+b[2])/2-np.mean([(q[0]+q[2])/2 for q in rows[-1]]))<rowh*.5: rows[-1].append(b)
    else: rows.append([b])
boxes=[b for r in rows for b in sorted(r,key=lambda b:b[1])]
# 가장자리 흰 번짐 지우기: 배경에 닿은 2픽셀 띠는 밝을수록 투명하게
dist=ni.distance_transform_edt(fg); alpha=np.where(fg,255,0).astype(np.float32)
band=fg&(dist<=2.5); alpha[band]=np.clip((255-mn[band])/150.0,0,1)*255
out=os.path.join(os.path.dirname(__file__),'..','art')
for name,(y0,x0,y1,x1,li) in zip(names,boxes):
    y0=max(0,y0-2);x0=max(0,x0-2);m=(l3[y0:y1,x0:x1]==li)
    rgba=np.dstack([im[y0:y1,x0:x1],np.where(m,alpha[y0:y1,x0:x1],0)]).astype(np.uint8); p=Image.fromarray(rgba,'RGBA'); p=p.crop(p.getbbox())
    p=p.resize((max(1,round(p.width*H/p.height)),H),Image.LANCZOS); p.save(os.path.join(out,name+'.webp'),quality=88,method=6); print(name,p.size)
