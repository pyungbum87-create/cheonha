import sys,numpy as np
from PIL import Image
from scipy import ndimage as nd
A='/mnt/user-data/attachments/ebb00a03-07b5-51d7-8a3d-281a8c6441fa/'
def sheet(src,names,cols=3,rows=2):
    a=np.asarray(Image.open(A+src).convert('RGB')).astype(np.int16);H,W=a.shape[:2]
    mx=a.max(2);mn=a.min(2);fg=~((mn>232)&(mx-mn<22));fg=nd.binary_closing(fg,iterations=2)
    lab,n=nd.label(fg);cm=nd.center_of_mass(fg,lab,range(1,n+1));sz=nd.sum(fg,lab,range(1,n+1))
    for k,nm in enumerate(names):
        r,c=divmod(k,cols);m=np.zeros_like(fg)
        for i,((cy,cx),s) in enumerate(zip(cm,sz)):
            if s>120 and int(cy//(H/rows))==r and int(cx//(W/cols))==c:m|=lab==i+1
        m=nd.binary_fill_holes(nd.binary_dilation(m,iterations=1));ys,xs=np.nonzero(m)
        al=(np.clip(nd.distance_transform_edt(m)/1.6,0,1)*255).astype(np.uint8)
        o=Image.fromarray(np.dstack([a.astype(np.uint8),al]),'RGBA').crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1));o.thumbnail((360,360),Image.LANCZOS);o.save(f'art/{nm}.webp','WEBP',quality=88)
def char(src,nm,w=360):
    a=np.asarray(Image.open(A+src).convert('RGB')).astype(np.int16);mx=a.max(2);mn=a.min(2);bg=(mn>228)&(mx-mn<26)
    lab,n=nd.label(~bg);sz=nd.sum(np.ones_like(lab),lab,range(1,n+1));keep=np.isin(lab,[i+1 for i,s in enumerate(sz) if s>800])
    m=nd.binary_fill_holes(nd.binary_closing(keep,iterations=2));ys,xs=np.nonzero(m);al=(np.clip(nd.distance_transform_edt(m)/1.6,0,1)*255).astype(np.uint8)
    o=Image.fromarray(np.dstack([a.astype(np.uint8),al]),'RGBA').crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1));o.thumbnail((w,w),Image.LANCZOS);o.save(f'art/{nm}.webp','WEBP',quality=88)
def bg(src,nm):Image.open(A+src).convert('RGB').resize((1200,1200),Image.LANCZOS).save(f'art/{nm}.webp','WEBP',quality=86)
sheet('a936ff0a-image.png',['web','duster','fu','lantern','paper','bin'])
sheet('085b7486-image.png',['bucket','rocket','tube','incense','fbox','muffs'])
sheet('ef36fd03-image.png',['candle','flashlight','jar','matches','plantern','lid'])
sheet('a5b64f78-image.png',['balloon_d','balloon','flags','cake','candle2','gift'])
sheet('07437242-image.png',['gull','para_c','para_o','shell','lunch','pail'])
sheet('7761ee5c-image.png',['hawthorn','sdragon','kite','drum','lion','envelope'])
char('3c9cc80a-image.png','peng_shock');char('a6ad378e-image.png','shan_scared');char('4cf8544b-image.png','dundun');char('4675bc0d-image.png','zhuozhuo')
for s,n in [('55bfd4b5','l1_bg2'),('3c56ad67','l4_bg'),('92a673c2','l5_bg'),('1a64f7bd','l6_bg'),('fb671938','l7_bg'),('591fba64','l8_bg'),('645c8775','l9_bg'),('443536e2','l10_bg')]:bg(s+'-image.png',n)
# spot-the-difference copy: 7 changes
im=Image.open('art/l9_bg.webp').convert('RGB');S=1200/1254
def box(x0,y0,x1,y1):return tuple(int(v*S) for v in (x0,y0,x1,y1))
def hue(b,shift):
    r=im.crop(b).convert('HSV');h,s,v=r.split();h=h.point(lambda x:(x+shift)%256);im.paste(Image.merge('HSV',(h,s,v)).convert('RGB'),b[:2])
def mirror(b):im.paste(im.crop(b).transpose(Image.FLIP_LEFT_RIGHT),b[:2])
b=box(735,25,830,115);im.paste(im.crop(box(615,25,710,115)),b[:2])   # moon gone
hue(box(215,95,400,330),85)        # big lantern turns green
hue(box(925,375,1254,465),-60)     # blue awning turns green
hue(box(845,630,915,700),-120)     # grapes change colour
mirror(box(990,680,1075,770))      # bunny faces the other way
hue(box(0,1000,190,1135),150)      # flower pot changes colour
mirror(box(1075,150,1254,290))     # cat faces the other way
im.save('art/l9_bg_b.webp','WEBP',quality=86)
