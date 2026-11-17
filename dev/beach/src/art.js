/* ============================== 그리기 도구와 코드로 그린 그림(적·배경·아이콘) ==============================
   적과 배경은 1차 그림이 오기 전까지 쓰는 임시 그림이다. 그림이 오면 drawSpr 와 mkBg 를 그림 쪽으로 바꾼다. */
const INK='#5a3620',CREAM='#fff6e4',RED='#f0604a',RED_D='#b8402f',MINT='#5cc4a4',MINT_D='#3a9478',YEL='#ffc94d',YEL_D='#d99a1e',SKY='#6cc3ee',GREY='#cfc6b8',GREY_D='#a39a8c';
const FONT='"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
function font(sz,x){(x||g).font='900 '+Math.round(sz)+'px '+FONT;}
function txt(s,x,y,sz,col,al,ol,olw){s=String(s);font(sz);g.textAlign=al||'center';g.textBaseline='middle';if(ol){g.lineJoin='round';g.lineWidth=olw||Math.max(5,sz*.24);g.strokeStyle=ol;g.strokeText(s,x,y);}g.fillStyle=col||INK;g.fillText(s,x,y);}
function txtFit(s,x,y,sz,maxW,col,al,ol){s=String(s);font(sz);const w=g.measureText(s).width;if(w>maxW)sz=Math.max(12,sz*maxW/w);txt(s,x,y,sz,col,al,ol);}
function wrap(s,x,y,sz,maxW,lh,col,al,maxLines){font(sz);const lines=[];let cur='';for(const ch of String(s)){if(ch==='\n'){lines.push(cur);cur='';continue;}if(g.measureText(cur+ch).width>maxW&&cur){lines.push(cur);cur=ch===' '?'':ch;}else cur+=ch;}if(cur)lines.push(cur);
  const n=maxLines?Math.min(maxLines,lines.length):lines.length;for(let i=0;i<n;i++)txt(lines[i],x,y+i*lh,sz,col,al);return n;}
function rr(x,y,w,h,r,c){c=c||g;r=Math.max(0,Math.min(r,w/2,h/2));c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function circ(x,y,r,c){c=c||g;c.beginPath();c.arc(x,y,Math.max(0,r),0,6.2832);}
function panel(x,y,w,h,fill,r,lw){r=r===undefined?28:r;g.fillStyle='rgba(90,54,32,.22)';rr(x,y+8,w,h,r);g.fill();g.fillStyle=fill||CREAM;rr(x,y,w,h,r);g.fill();g.lineWidth=lw||5;g.strokeStyle=INK;g.stroke();}
function bar(x,y,w,h,p,col,bg){g.fillStyle=bg||'rgba(90,54,32,.35)';rr(x,y,w,h,h/2);g.fill();p=Math.max(0,Math.min(1,p));if(p>0){g.fillStyle=col;rr(x+3,y+3,Math.max(h-6,(w-6)*p),h-6,(h-6)/2);g.fill();}g.lineWidth=4;g.strokeStyle=INK;rr(x,y,w,h,h/2);g.stroke();}

/* 버튼: 그리면서 누를 자리를 등록한다. 화면을 다시 그릴 때마다 새로 등록된다 */
let BT=[];
const hitR=(p,x,y,w,h)=>p.x>=x&&p.x<=x+w&&p.y>=y&&p.y<=y+h;
function btn(x,y,w,h,label,fn,o){o=o||{};const off=!!o.off,dn=!off&&PTR.down&&!PTR.moved&&hitR(PTR,x,y,w,h)&&hitR({x:PTR.sx,y:PTR.sy},x,y,w,h),r=o.r===undefined?Math.min(30,h/2):o.r;
  const col=off?GREY:o.col||RED,dk=off?GREY_D:o.dk||RED_D,d=dn?6:0;
  g.fillStyle=dk;rr(x,y+8,w,h,r);g.fill();g.lineWidth=5;g.strokeStyle=INK;g.stroke();
  g.fillStyle=col;rr(x,y+d,w,h,r);g.fill();g.stroke();
  if(label)txtFit(label,x+w/2,y+h/2+d+1,o.sz||Math.min(38,h*.42),w-24,o.tc||'#fff',null,o.tc?null:INK);
  if(o.icon)o.icon(x+w/2,y+h/2+d);
  if(o.dot){g.fillStyle='#ff3b30';circ(x+w-10,y+8,13);g.fill();g.lineWidth=4;g.strokeStyle='#fff';g.stroke();}
  BT.push({x,y,w,h,fn:off?(o.offFn||(()=>sfx('nope'))):fn});}
function zone(x,y,w,h,fn){BT.push({x,y,w,h,fn,quiet:1});}

function drawImg(n,x,y,h,o){const im=IMG[n];if(!im){g.fillStyle='#ffe6c8';circ(x,y-h/2,h*.4);g.fill();g.lineWidth=4;g.strokeStyle=INK;g.stroke();return;}
  o=o||{};const w=h*im.width/im.height,sx=o.sx||1,sy=o.sy||1;g.save();g.translate(x,y);if(o.rot)g.rotate(o.rot);g.scale(sx*(o.flip?-1:1),sy);if(o.a!==undefined)g.globalAlpha*=o.a;g.drawImage(im,-w/2,-h,w,h);g.restore();}

/* ---------- 아이콘 ---------- */
function icoCoin(x,y,r){g.fillStyle='#e8a520';circ(x,y+r*.12,r);g.fill();g.fillStyle=YEL;circ(x,y,r);g.fill();g.lineWidth=Math.max(2,r*.16);g.strokeStyle=INK;g.stroke();g.strokeStyle='#fff3c4';g.lineWidth=Math.max(2,r*.14);g.beginPath();g.arc(x,y,r*.55,3.6,5.2);g.stroke();}
function icoStar(x,y,r,on){g.beginPath();for(let i=0;i<10;i++){const a=-1.5708+i*.6283,q=i%2?r*.48:r;g.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q);}g.closePath();g.fillStyle=on?YEL:'#e4d8c4';g.fill();g.lineWidth=Math.max(3,r*.16);g.lineJoin='round';g.strokeStyle=INK;g.stroke();}
function icoCastle(x,y,s){g.fillStyle='#f3c97a';g.strokeStyle=INK;g.lineWidth=4;g.lineJoin='round';g.beginPath();g.moveTo(x-s,y+s);g.lineTo(x-s,y-s*.3);g.lineTo(x-s*.55,y-s*.3);g.lineTo(x-s*.55,y-s*.8);g.lineTo(x-s*.2,y-s*.8);g.lineTo(x-s*.2,y-s*.3);g.lineTo(x+s*.2,y-s*.3);g.lineTo(x+s*.2,y-s*.8);g.lineTo(x+s*.55,y-s*.8);g.lineTo(x+s*.55,y-s*.3);g.lineTo(x+s,y-s*.3);g.lineTo(x+s,y+s);g.closePath();g.fill();g.stroke();}
function icoHand(x,y,t,sc){const b=Math.sin(t*6)*8*(sc||1);g.save();g.translate(x,y+b);g.scale(sc||1,sc||1);g.rotate(-.35);g.fillStyle='#fff';g.strokeStyle=INK;g.lineWidth=5;rr(-13,-50,26,58,13);g.fill();g.stroke();rr(-28,-6,56,52,22);g.fill();g.stroke();g.restore();}

function icoBun(x,y,r){g.fillStyle='#fff';g.strokeStyle=INK;g.lineWidth=Math.max(2.5,r*.17);g.lineJoin='round';g.beginPath();g.ellipse(x,y+r*.1,r,r*.86,0,0,6.2832);g.fill();g.stroke();g.lineWidth=Math.max(2,r*.12);g.lineCap='round';for(const d of [-.5,0,.5]){g.beginPath();g.moveTo(x+d*r,y-r*.25);g.quadraticCurveTo(x+d*r*.5,y-r*.6,x,y-r*.72);g.stroke();}}
/* ---------- 간식 가게: 그림(tw_*.webp)이 오기 전까지 쓰는 코드 그림. 발 디딘 곳이 (0,0), 위로 46 ---------- */
function awning(c1){g.strokeStyle=INK;g.lineWidth=1.6;g.beginPath();g.moveTo(-19,0);g.lineTo(-19,-36);g.moveTo(19,0);g.lineTo(19,-36);g.stroke();
  for(let i=0;i<6;i++){g.fillStyle=i%2?'#fff':c1;g.beginPath();g.moveTo(-24+i*8,-47);g.lineTo(-16+i*8,-47);g.lineTo(-16+i*8,-37);g.quadraticCurveTo(-20+i*8,-32,-24+i*8,-37);g.closePath();g.fill();g.stroke();}}
function counter(col){g.fillStyle=col||'#c98f52';g.strokeStyle=INK;g.lineWidth=1.8;rr(-18,-15,36,15,3);g.fill();g.stroke();g.strokeStyle='rgba(90,54,32,.35)';g.lineWidth=1;g.beginPath();g.moveTo(-17,-7.5);g.lineTo(17,-7.5);g.stroke();}
const STALL={
  tt:(t,a)=>{awning('#f0604a');g.strokeStyle=INK;g.lineWidth=1.8;for(const yy of [0,-11]){g.fillStyle='#e9c07a';rr(-15,yy-12,30,12,4);g.fill();g.stroke();g.strokeStyle='#b98346';g.lineWidth=1.2;g.beginPath();g.moveTo(-15,yy-6);g.lineTo(15,yy-6);g.stroke();g.strokeStyle=INK;g.lineWidth=1.8;}
    g.fillStyle='#fff';for(const dx of [-7,0,7]){circ(dx,-25,4.6);g.fill();g.stroke();}g.fillStyle='#d9a85c';g.beginPath();g.ellipse(a*6,-29-a*8,15,4.5,-a*.5,0,6.2832);g.fill();g.stroke();
    g.fillStyle='rgba(255,255,255,.75)';for(let i=0;i<2;i++){const q=(t*.8+i*.5)%1;circ(-5+i*9+Math.sin(t*3+i)*2,-34-q*12,2.8*(1-q*.5));g.fill();}},
  didi:(t,a)=>{awning('#5cb8ff');counter('#bfe3f5');g.strokeStyle=INK;g.lineWidth=1.8;g.fillStyle='#f4fbff';g.beginPath();g.arc(0,-15,13+a,3.1416,0);g.closePath();g.fill();g.stroke();g.fillStyle='#ff7a9a';g.beginPath();g.arc(0,-21,7.5,3.1416,0);g.quadraticCurveTo(4,-17,0,-19);g.quadraticCurveTo(-4,-17,-7.5,-21);g.fill();g.stroke();g.fillStyle='#e8362e';circ(1,-29,2.8);g.fill();g.stroke();},
  peng:(t,a)=>{awning('#ffc94d');g.strokeStyle=INK;g.lineWidth=1.8;g.fillStyle='#5a3620';circ(-10,-2,4);g.fill();circ(10,-2,4);g.fill();g.fillStyle='#f0604a';rr(-16,-20,32,16,3);g.fill();g.stroke();g.fillStyle='#fff';for(const dx of [-9,-1,7]){g.fillRect(dx,-19,4,14);}
    g.fillStyle='rgba(255,255,255,.75)';rr(-13,-33,26,13,4);g.fill();g.stroke();for(let i=0;i<6;i++){g.fillStyle=i%2?'#fff6d0':'#ffd24d';circ(-8+i*3.4,-25-(i%3)*2.4-a*Math.abs(Math.sin(i*2.1+t*14))*5,2.6);g.fill();}},
  shan:(t,a)=>{awning('#5cc4a4');counter();g.strokeStyle=INK;g.lineWidth=1.8;g.fillStyle='#d98a4a';circ(-6,-22,7.5);g.fill();g.stroke();g.beginPath();g.moveTo(-13,-23);g.lineTo(-19,-27);g.stroke();g.beginPath();g.arc(-6,-27,6,3.5,5.9);g.stroke();
    glow(10,-28,13+a*5,'#ffd27a',.55);g.beginPath();g.moveTo(10,-37);g.lineTo(10,-34);g.stroke();g.fillStyle='#f0604a';g.beginPath();g.ellipse(10,-28,5.2,6.4,0,0,6.2832);g.fill();g.stroke();g.fillStyle='#ffd93d';g.fillRect(7,-35,6,2);g.fillRect(7,-23,6,2);},
  dun:(t,a)=>{awning('#ff8fa8');counter();g.strokeStyle=INK;g.lineWidth=1.6;g.fillStyle='#e3c26e';rr(-3.5,-33,7,19,2);g.fill();g.stroke();for(const an of [-.9,0,.9]){g.save();g.translate(0,-28);g.rotate(an+a*.25);g.strokeStyle='#c9a15f';g.lineWidth=1.4;g.beginPath();g.moveTo(0,0);g.lineTo(0,-17);g.stroke();g.strokeStyle='#8a1f1a';g.lineWidth=.9;for(let i=0;i<3;i++){g.fillStyle='#e8362e';circ(0,-6-i*4.6,2.7);g.fill();g.stroke();}g.restore();}},
  zhuo:(t,a)=>{awning('#8fd6a0');counter();g.strokeStyle=INK;g.lineWidth=1.8;g.fillStyle='#a8713c';g.beginPath();g.moveTo(-10,-27);g.lineTo(10,-27);g.lineTo(7.5,-15);g.lineTo(-7.5,-15);g.closePath();g.fill();g.stroke();g.fillStyle='#fffdf6';g.beginPath();g.ellipse(0,-28,8,4.6+a*1.5,0,0,6.2832);g.fill();g.stroke();circ(-13,-18,3.6);g.fill();g.stroke();circ(13,-18,3.6);g.fill();g.stroke();
    g.save();g.translate(11,-33);g.rotate(-.5+a*.9);g.strokeStyle='#8a5a34';g.lineWidth=2;g.beginPath();g.moveTo(0,0);g.lineTo(0,-10);g.stroke();g.fillStyle='#c98f52';g.strokeStyle=INK;g.lineWidth=1.4;rr(-5,-15,10,6,2);g.fill();g.stroke();g.restore();},
};
function drawShadow(x,y){g.fillStyle='rgba(60,40,20,.2)';g.beginPath();g.ellipse(x+2,y+8,30,10,0,0,6.2832);g.fill();}
function drawStall(id,x,y,sx,sy,t,a,alpha){g.save();g.translate(x,y);g.scale(sx,sy);if(alpha!==undefined)g.globalAlpha*=alpha;g.lineJoin='round';g.lineCap='round';STALL[id](t||0,a||0);g.restore();}
function stallIcon(id,x,y,alpha){if(IMG['tw_'+id])drawImg('tw_'+id,x,y+8,84,{a:alpha});else drawStall(id,x,y,1.75,1.75,0,0,alpha);}
function drawTurtle(x,opt){
  for(const p of [[-30,-18,.6],[30,-18,-.6],[-28,20,-.5],[28,20,.5]])shape(x,'#8fd68a',()=>{x.ellipse(p[0],p[1],13,8,p[2],0,6.2832);});
  shape(x,opt.col||'#4fa35e',()=>{x.arc(0,-4,34,0,6.2832);});x.strokeStyle='rgba(30,80,45,.55)';x.lineWidth=3;x.beginPath();x.arc(0,-4,17,0,6.2832);for(let i=0;i<6;i++){const a=i*1.047;x.moveTo(Math.cos(a)*17,-4+Math.sin(a)*17);x.lineTo(Math.cos(a)*33,-4+Math.sin(a)*33);}x.stroke();
  x.fillStyle='rgba(255,255,255,.25)';x.beginPath();x.ellipse(-12,-20,12,6,-.4,0,6.2832);x.fill();
  shape(x,'#a5e09c',()=>{x.arc(0,32,16,0,6.2832);});face(x,0,31,7,3.6,opt.mood);
  if(opt.hat){shape(x,'#3a3a48',()=>{x.moveTo(-24,22);x.quadraticCurveTo(0,-2,24,22);x.quadraticCurveTo(0,14,-24,22);});x.fillStyle='#fff';x.beginPath();x.arc(0,13,3.4,0,6.2832);x.fill();}
  else shape(x,'#e8362e',()=>{x.moveTo(-15,24);x.quadraticCurveTo(0,14,15,24);x.lineTo(15,28);x.quadraticCurveTo(0,19,-15,28);},3);
}
/* ---------- 적: 둥글고 볼이 발그레한 장난꾸러기 ---------- */
const SPR={},SPRW={};
function tint(c,col){const o=mkCanvas(c.width,c.height),x=o.getContext('2d');x.drawImage(c,0,0);x.globalCompositeOperation='source-atop';x.fillStyle=col;x.fillRect(0,0,c.width,c.height);return o;}
function shape(x,fill,fn,lw){x.fillStyle=fill;x.strokeStyle=INK;x.lineWidth=lw||5;x.beginPath();fn();x.closePath();x.fill();x.stroke();}
function face(x,cx,cy,gap,r,mood){
  x.fillStyle='rgba(255,120,130,.55)';x.beginPath();x.ellipse(cx-gap*1.75,cy+r*1.7,r*1.3,r*.8,0,0,6.2832);x.fill();x.beginPath();x.ellipse(cx+gap*1.75,cy+r*1.7,r*1.3,r*.8,0,0,6.2832);x.fill();
  for(const sgn of [-1,1]){x.fillStyle='#2a1a12';x.beginPath();x.arc(cx+sgn*gap,cy,r,0,6.2832);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(cx+sgn*gap-r*.3,cy-r*.35,r*.38,0,6.2832);x.fill();}
  x.strokeStyle='#2a1a12';x.lineWidth=3.5;x.lineCap='round';x.beginPath();
  if(mood==='o'){x.arc(cx,cy+r*1.7,r*.6,0,6.2832);}else if(mood==='grr'){x.moveTo(cx-r*1.1,cy+r*2.1);x.lineTo(cx-r*.4,cy+r*1.6);x.lineTo(cx+r*.4,cy+r*2.1);x.lineTo(cx+r*1.1,cy+r*1.6);}else{x.arc(cx,cy+r*1.2,r*.9,.25,2.9);}
  x.stroke();
  if(mood==='grr'||mood==='brow'){x.lineWidth=4.5;x.beginPath();x.moveTo(cx-gap-r*1.3,cy-r*2);x.lineTo(cx-gap+r*.9,cy-r*1.3);x.moveTo(cx+gap+r*1.3,cy-r*2);x.lineTo(cx+gap-r*.9,cy-r*1.3);x.stroke();}
}
function crown(x,cx,cy,s){shape(x,YEL,()=>{x.moveTo(cx-s,cy);x.lineTo(cx-s,cy-s*.9);x.lineTo(cx-s*.45,cy-s*.4);x.lineTo(cx,cy-s*1.15);x.lineTo(cx+s*.45,cy-s*.4);x.lineTo(cx+s,cy-s*.9);x.lineTo(cx+s,cy);},4);x.fillStyle=RED;x.beginPath();x.arc(cx,cy-s*.3,s*.16,0,6.2832);x.fill();}
function drawCrab(x,col,opt){
  x.strokeStyle=INK;x.lineWidth=6;x.lineCap='round';
  for(const s of [-1,1]){for(let i=0;i<3;i++){x.beginPath();x.moveTo(s*34,12+i*9);x.lineTo(s*56,22+i*12);x.stroke();}x.beginPath();x.moveTo(s*34,-4);x.lineTo(s*50,-20);x.stroke();
    const cr=opt.big?21:16;shape(x,col,()=>{x.arc(s*52,-28,cr,0,6.2832);});x.beginPath();x.moveTo(s*52,-28);x.lineTo(s*(52+cr*.3),-28-cr);x.stroke();}
  shape(x,col,()=>{x.ellipse(0,8,42,32,0,0,6.2832);});
  x.fillStyle='rgba(255,255,255,.28)';x.beginPath();x.ellipse(-12,-6,18,9,-.3,0,6.2832);x.fill();
  face(x,0,4,14,5.5,opt.mood);
  if(opt.helmet){shape(x,'#b9c4d0',()=>{x.arc(0,-14,30,3.1416,0);});x.fillStyle=RED;x.beginPath();x.arc(0,-44,6,0,6.2832);x.fill();x.stroke();}
  if(opt.crown)crown(x,0,-22,20);
}
function drawOcto(x,col,opt){
  for(let i=0;i<4;i++)shape(x,col,()=>{x.arc(-33+i*22,30+(i%2)*4,12,0,6.2832);});
  shape(x,col,()=>{x.arc(0,-6,38,0,6.2832);});
  x.fillStyle='rgba(255,255,255,.3)';x.beginPath();x.ellipse(-14,-24,14,8,-.4,0,6.2832);x.fill();
  face(x,0,-4,14,5.5,opt.mood||'o');if(opt.crown)crown(x,0,-40,20);
}
const DRAW_EN={
  crab:x=>drawCrab(x,'#ff8a65',{}),
  elite:x=>drawCrab(x,'#e2685c',{helmet:1,mood:'brow',big:1}),
  kingcrab:x=>drawCrab(x,'#ff7a5c',{crown:1,mood:'grr',big:1}),
  jelly:x=>{x.strokeStyle='#7fb6ea';x.lineWidth=7;x.lineCap='round';for(let i=0;i<4;i++){const px=-24+i*16;x.beginPath();x.moveTo(px,8);x.quadraticCurveTo(px-8,26,px,38);x.quadraticCurveTo(px+8,48,px,56);x.stroke();}
    shape(x,'#c8e6ff',()=>{x.moveTo(-40,10);x.arc(0,6,40,3.1416,0);x.quadraticCurveTo(30,22,20,10);x.quadraticCurveTo(10,22,0,10);x.quadraticCurveTo(-10,22,-20,10);x.quadraticCurveTo(-30,22,-40,10);});
    x.fillStyle='rgba(255,255,255,.55)';x.beginPath();x.ellipse(-14,-18,14,8,-.4,0,6.2832);x.fill();face(x,0,-6,12,5);},
  puffer:x=>{for(let i=0;i<12;i++){const a=i*.5236;shape(x,'#ffe9a8',()=>{x.moveTo(Math.cos(a-.16)*34,Math.sin(a-.16)*34);x.lineTo(Math.cos(a)*50,Math.sin(a)*50);x.lineTo(Math.cos(a+.16)*34,Math.sin(a+.16)*34);},4);}
    shape(x,'#ffd76a',()=>{x.arc(0,0,37,0,6.2832);});x.fillStyle='#fff6d8';x.beginPath();x.ellipse(0,16,24,14,0,0,6.2832);x.fill();face(x,0,-6,14,5.5,'o');},
  fish:x=>{shape(x,'#c9ecff',()=>{x.moveTo(-18,-6);x.lineTo(-52,-22);x.lineTo(-40,12);});shape(x,'#c9ecff',()=>{x.moveTo(18,-6);x.lineTo(52,-22);x.lineTo(40,12);});
    shape(x,'#6fb8ff',()=>{x.moveTo(-14,-34);x.lineTo(0,-56);x.lineTo(14,-34);});shape(x,'#6fb8ff',()=>{x.ellipse(0,0,25,40,0,0,6.2832);});
    x.fillStyle='#e8f6ff';x.beginPath();x.ellipse(0,20,14,14,0,0,6.2832);x.fill();face(x,0,6,10,4.5);},
  hermit:x=>{shape(x,'#ff9a7a',()=>{x.ellipse(0,26,30,20,0,0,6.2832);});for(const s of [-1,1])shape(x,'#ff9a7a',()=>{x.arc(s*34,36,10,0,6.2832);});
    shape(x,'#e9bd7e',()=>{x.arc(0,-12,38,0,6.2832);});x.strokeStyle='#b98346';x.lineWidth=5;x.beginPath();x.arc(2,-12,24,.4,5.2);x.stroke();x.beginPath();x.arc(4,-12,11,.8,5.6);x.stroke();face(x,0,24,11,4.5);},
  octo:x=>drawOcto(x,'#c9a2f2',{}),
  turtle:x=>drawTurtle(x,{}),
  pirate:x=>drawTurtle(x,{hat:1,mood:'grr',col:'#3f8f6a'}),
  gull:x=>{shape(x,'#eef3f8',()=>{x.moveTo(-14,-6);x.quadraticCurveTo(-44,-34,-62,-8);x.quadraticCurveTo(-40,-10,-16,12);});shape(x,'#eef3f8',()=>{x.moveTo(14,-6);x.quadraticCurveTo(44,-34,62,-8);x.quadraticCurveTo(40,-10,16,12);});
    shape(x,'#ffffff',()=>{x.ellipse(0,2,24,30,0,0,6.2832);});shape(x,'#ffb347',()=>{x.moveTo(-7,14);x.lineTo(0,30);x.lineTo(7,14);},4);x.fillStyle='#8fa3b8';x.beginPath();x.ellipse(0,-24,12,6,0,0,6.2832);x.fill();face(x,0,0,10,4.5,'brow');},
  octoboss:x=>drawOcto(x,'#b58bea',{crown:1,mood:'grr'}),
  whale:x=>{shape(x,'#5f9be0',()=>{x.moveTo(-50,-20);x.lineTo(-66,10);x.lineTo(-40,6);});shape(x,'#5f9be0',()=>{x.moveTo(50,-20);x.lineTo(66,10);x.lineTo(40,6);});
    shape(x,'#6fa8e8',()=>{x.ellipse(0,0,54,46,0,0,6.2832);});x.fillStyle='#eaf5ff';x.beginPath();x.ellipse(0,22,36,20,0,0,6.2832);x.fill();
    x.fillStyle='rgba(255,255,255,.75)';for(const p of [[-20,-26],[6,-30],[24,-18],[-6,-16]]){x.beginPath();x.arc(p[0],p[1],4,0,6.2832);x.fill();}
    x.strokeStyle='#bfe6ff';x.lineWidth=5;x.beginPath();x.moveTo(0,-46);x.quadraticCurveTo(-14,-62,-20,-52);x.moveTo(0,-46);x.quadraticCurveTo(14,-62,20,-52);x.stroke();face(x,0,2,24,5.5,'grr');},
};
function mkSprites(){for(const k in DRAW_EN){const big=k==='kingcrab'||k==='octoboss'||k==='whale'||k==='pirate',sz=big?300:170,c=mkCanvas(sz,sz),x=c.getContext('2d');safeCtx(x);x.translate(sz/2,sz*.53);x.scale(sz/160,sz/160);x.lineJoin='round';x.lineCap='round';DRAW_EN[k](x);SPR[k]=c;SPRW[k]=tint(c,'#fff');}}
function onImg(n){try{const m=/^(en|boss)_(.+)$/.exec(n);if(m){const im=IMG[n],c=mkCanvas(256,256),x=c.getContext('2d'),s=Math.min(240/im.width,240/im.height);x.drawImage(im,128-im.width*s/2,136-im.height*s/2,im.width*s,im.height*s);SPR[m[2]]=c;SPRW[m[2]]=tint(c,'#fff');}
  else if(n==='bg_1')mkBg();}catch(e){}}
function sprKey(e){return e.k==='boss'?(e.bk||'kingcrab'):e.k;}
function drawSpr(k,x,y,size,o){const c=(o&&o.white?SPRW:SPR)[k];if(!c)return;o=o||{};g.save();g.translate(x,y);if(o.rot)g.rotate(o.rot);g.scale(o.sx||1,o.sy||1);if(o.a!==undefined)g.globalAlpha*=o.a;g.drawImage(c,-size/2,-size*.53,size,size);g.restore();}

/* ---------- 전투 지도: 위는 바다, 아래는 마을 대문. 길과 꾸밈은 장마다 코드로 그린다 (그림이 오면 바꿀 자리) ---------- */
const THEMES=[
  {sea:['#2f9ad6','#86d8f0'],sand:['#fdeec8','#f6dba6'],path:'#ecd09a',edge:'#c9a468',deco:['palm','parasol','star','shell','rock','grass']},
  {sea:['#3b8fc4','#8fd2e8'],sand:['#f3e8cf','#e6d6b2'],path:'#dcc8a0',edge:'#b39a70',deco:['rock','rock','star','grass','shell','rock']},
  {sea:['#17a9bd','#9aece2'],sand:['#ffecd2','#f8d9b4'],path:'#f3cfa8',edge:'#d2a47a',deco:['coral','shell','star','palm','coral','rock']},
  {sea:['#4f74cf','#f4b890'],sand:['#f9d8a8','#edc088'],path:'#e2b67c',edge:'#b98850',deco:['palm','barrel','rock','barrel','shell','grass']},
  {sea:['#2c4fa8','#84bcec'],sand:['#eee4d2','#ddd0b8'],path:'#d3c5a8',edge:'#a8987a',deco:['lantern','coral','rock','shell','lantern','grass']},
];
function shoreY(x){return 112+Math.sin(x*.035)*7+Math.sin(x*.011+1)*5;}
const DECO={
  palm:(x,r)=>{x.fillStyle='rgba(60,40,20,.16)';x.beginPath();x.ellipse(8,10,20,8,0,0,6.2832);x.fill();x.strokeStyle='#8a5a34';x.lineWidth=5;x.lineCap='round';x.beginPath();x.moveTo(0,8);x.quadraticCurveTo(5,-6,1,-18);x.stroke();
    for(let i=0;i<6;i++){x.save();x.translate(1,-18);x.rotate(i*1.047+r);x.fillStyle=i%2?'#4fae6a':'#63c07c';x.strokeStyle='#2f7a48';x.lineWidth=1.2;x.beginPath();x.ellipse(11,0,13,4.5,0,0,6.2832);x.fill();x.stroke();x.restore();}x.fillStyle='#7a4a2a';x.beginPath();x.arc(1,-18,3,0,6.2832);x.fill();},
  parasol:(x,r)=>{x.fillStyle=r>3?'#8fd0f0':'#ffd9a0';x.strokeStyle='rgba(90,54,32,.5)';x.lineWidth=1;x.save();x.rotate(.3);x.fillRect(12,-4,22,11);x.strokeRect(12,-4,22,11);x.restore();x.fillStyle='rgba(60,40,20,.16)';x.beginPath();x.ellipse(4,6,17,9,0,0,6.2832);x.fill();
    for(let i=0;i<8;i++){x.fillStyle=i%2?'#fff':'#f0604a';x.beginPath();x.moveTo(0,0);x.arc(0,0,15,i*.7854+r,(i+1)*.7854+r);x.closePath();x.fill();}x.strokeStyle='#5a3620';x.lineWidth=1.6;x.beginPath();x.arc(0,0,15,0,6.2832);x.stroke();x.fillStyle='#5a3620';x.beginPath();x.arc(0,0,2,0,6.2832);x.fill();},
  star:(x,r)=>{x.rotate(r);x.fillStyle='#ff9a5c';x.strokeStyle='#c9632c';x.lineWidth=1.2;x.beginPath();for(let i=0;i<10;i++){const a=i*.6283,q=i%2?3:7.5;x.lineTo(Math.cos(a)*q,Math.sin(a)*q);}x.closePath();x.fill();x.stroke();},
  shell:(x,r)=>{x.rotate(r);x.fillStyle='#ffc9d6';x.strokeStyle='#d98aa0';x.lineWidth=1.2;x.beginPath();x.moveTo(0,5);x.arc(0,0,6.5,2.6,.54);x.closePath();x.fill();x.stroke();},
  rock:(x,r)=>{x.fillStyle='rgba(60,40,20,.16)';x.beginPath();x.ellipse(3,6,15,6,0,0,6.2832);x.fill();x.fillStyle='#a8adb4';x.strokeStyle='#6c7178';x.lineWidth=1.6;x.beginPath();x.ellipse(0,0,13+r,9,0,0,6.2832);x.fill();x.stroke();x.beginPath();x.ellipse(9,3,7,5,0,0,6.2832);x.fill();x.stroke();x.fillStyle='rgba(255,255,255,.4)';x.beginPath();x.ellipse(-4,-3,5,2.5,-.4,0,6.2832);x.fill();},
  grass:(x,r)=>{x.strokeStyle='#5fae62';x.lineWidth=2.4;x.lineCap='round';for(let i=-1;i<2;i++){x.beginPath();x.moveTo(i*3,4);x.quadraticCurveTo(i*5,-4,i*8+r,-9);x.stroke();}},
  coral:(x,r)=>{for(let i=0;i<5;i++){x.fillStyle=i%2?'#ff9db0':'#ffb88a';x.strokeStyle='#d9728a';x.lineWidth=1.2;x.beginPath();x.arc(Math.cos(i*1.26+r)*7,Math.sin(i*1.26+r)*5,5.5,0,6.2832);x.fill();x.stroke();}},
  barrel:(x)=>{x.fillStyle='rgba(60,40,20,.16)';x.beginPath();x.ellipse(3,7,12,5,0,0,6.2832);x.fill();x.fillStyle='#b07a44';x.strokeStyle='#5a3620';x.lineWidth=1.6;x.beginPath();x.arc(0,0,10,0,6.2832);x.fill();x.stroke();x.strokeStyle='#7a4a2a';x.beginPath();x.arc(0,0,6,0,6.2832);x.stroke();},
  lantern:(x)=>{x.fillStyle='rgba(255,200,90,.28)';x.beginPath();x.arc(0,-12,16,0,6.2832);x.fill();x.strokeStyle='#5a3620';x.lineWidth=2;x.beginPath();x.moveTo(0,8);x.lineTo(0,-6);x.stroke();x.fillStyle='#f0604a';x.lineWidth=1.4;x.beginPath();x.ellipse(0,-13,7,8,0,0,6.2832);x.fill();x.stroke();x.fillStyle='#ffd93d';x.fillRect(-4,-22,8,2.5);x.fillRect(-4,-6,8,2.5);},
};
function mkMap(si){
  const TH=THEMES[STAGES[si].theme%THEMES.length],G=stageGeo(si),c=mkCanvas(VW,VH),x=c.getContext('2d');safeCtx(x);x.scale(K,K);let seed=si*131+7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const bg=IMG['bg_'+(STAGES[si].theme+1)];let gr;if(bg)x.drawImage(bg,0,0,W,H);else{
  gr=x.createLinearGradient(0,90,0,H);gr.addColorStop(0,TH.sand[0]);gr.addColorStop(1,TH.sand[1]);x.fillStyle=gr;x.fillRect(0,0,W,H);
  for(let i=0;i<260;i++){x.fillStyle=i%3?'rgba(170,120,60,.16)':'rgba(255,255,255,.35)';x.beginPath();x.arc(rnd()*W,120+rnd()*600,.8+rnd()*1.6,0,6.2832);x.fill();}
  for(let i=0;i<14;i++){x.strokeStyle='rgba(170,120,60,.14)';x.lineWidth=1.6;const px=rnd()*W,py=150+rnd()*520;x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+14,py-4,px+28,py);x.stroke();}
  // 젖은 모래
  x.fillStyle='rgba(150,110,60,.22)';x.beginPath();x.moveTo(0,0);x.lineTo(W,0);for(let px=W;px>=0;px-=10)x.lineTo(px,shoreY(px)+15+Math.sin(px*.09)*3);x.closePath();x.fill();
  }
  // 길
  x.lineJoin='round';x.lineCap='round';const stroke=(col,w,dy)=>{x.strokeStyle=col;x.lineWidth=w;for(const p of G.paths){x.beginPath();p.s.forEach((q,i)=>{if(i)x.lineTo(q.x,q.y+(dy||0));else x.moveTo(q.x,q.y-30);});x.stroke();}};
  stroke('rgba(90,54,32,.2)',50,3);stroke(TH.edge,46);stroke(TH.path,39);stroke('rgba(255,255,255,.2)',20);
  for(const p of G.paths)for(let i=8;i<p.s.length-6;i+=7){const q=p.s[i],n=p.s[i+1],dx=n.x-q.x,dy=n.y-q.y,l=Math.hypot(dx,dy)||1,sd=(i/7%2?1:-1)*9;x.fillStyle='rgba(120,80,40,.2)';x.beginPath();x.ellipse(q.x-dy/l*sd,q.y+dx/l*sd,3.2,2,Math.atan2(dy,dx),0,6.2832);x.fill();}
  if(!bg){ // 바다
  gr=x.createLinearGradient(0,0,0,125);gr.addColorStop(0,TH.sea[0]);gr.addColorStop(1,TH.sea[1]);x.fillStyle=gr;x.beginPath();x.moveTo(0,0);x.lineTo(W,0);for(let px=W;px>=0;px-=10)x.lineTo(px,shoreY(px));x.closePath();x.fill();
  x.strokeStyle='rgba(255,255,255,.85)';x.lineWidth=3.5;x.beginPath();for(let px=0;px<=W;px+=10){if(px)x.lineTo(px,shoreY(px));else x.moveTo(px,shoreY(px));}x.stroke();
  x.strokeStyle='rgba(255,255,255,.28)';x.lineWidth=2;for(let i=0;i<12;i++){const px=rnd()*W,py=64+rnd()*36;x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+10,py-4,px+20,py);x.stroke();}
  // 마을 쪽 나무 데크와 대문
  x.fillStyle='#d9b07a';x.fillRect(0,GATE_Y+20,W,H);x.strokeStyle='rgba(120,80,40,.4)';x.lineWidth=1.4;for(let py=GATE_Y+20;py<H;py+=13){x.beginPath();x.moveTo(0,py);x.lineTo(W,py);x.stroke();}
  x.fillStyle='#b98a52';x.fillRect(0,GATE_Y+17,W,5);x.strokeStyle=INK;x.lineWidth=1.6;x.strokeRect(-2,GATE_Y+17,W+4,5);
  for(let px=18;px<W;px+=46){if(Math.abs(px-225)<48)continue;x.fillStyle='#f1d08c';x.strokeStyle=INK;x.lineWidth=1.6;x.beginPath();x.moveTo(px-10,GATE_Y+17);x.lineTo(px-10,GATE_Y+5);x.lineTo(px+10,GATE_Y+5);x.lineTo(px+10,GATE_Y+17);x.closePath();x.fill();x.stroke();}
  }
  const gx=225,gy=GATE_Y;x.fillStyle='rgba(60,40,20,.2)';x.beginPath();x.ellipse(gx,gy+20,52,9,0,0,6.2832);x.fill();
  for(const sgn of [-1,1]){x.fillStyle='#f3c97a';x.strokeStyle=INK;x.lineWidth=2.2;rr(gx+sgn*34-12,gy-30,24,50,3,x);x.fill();x.stroke();x.fillStyle='#e8b65e';for(let k=-1;k<2;k++){rr(gx+sgn*34+k*8-3,gy-37,6,8,1.5,x);x.fill();x.stroke();}
    x.beginPath();x.moveTo(gx+sgn*34,gy-37);x.lineTo(gx+sgn*34,gy-58);x.stroke();x.fillStyle=RED;x.beginPath();x.moveTo(gx+sgn*34,gy-58);x.lineTo(gx+sgn*34+13,gy-53);x.lineTo(gx+sgn*34,gy-48);x.closePath();x.fill();x.stroke();}
  x.fillStyle='#f3c97a';x.strokeStyle=INK;rr(gx-24,gy-18,48,38,3,x);x.fill();x.stroke();x.fillStyle='#7a4a2a';x.beginPath();x.moveTo(gx-13,gy+20);x.lineTo(gx-13,gy);x.arc(gx,gy,13,3.1416,0);x.lineTo(gx+13,gy+20);x.closePath();x.fill();x.stroke();
  if(!bg){ // 꾸밈: 길과 타워 자리를 피해서
  const all=[];for(const p of G.paths)for(let i=0;i<p.s.length;i+=3)all.push(p.s[i]);const placed=[];
  for(let n=0,tries=0;n<30&&tries<600;tries++){const px=14+rnd()*422,py=shoreY(px)+22+rnd()*(GATE_Y-shoreY(px)-40),kind=TH.deco[Math.floor(rnd()*TH.deco.length)],big=kind==='palm'||kind==='parasol',need=big?46:32;
    if(all.some(q=>(q.x-px)**2+(q.y-py)**2<need*need)||G.spots.some(q=>(q.x-px)**2+(q.y-py)**2<(need+6)**2)||placed.some(q=>(q.x-px)**2+(q.y-py)**2<(big||q.big?40:22)**2))continue;
    placed.push({x:px,y:py,big});x.save();x.translate(px,py);DECO[kind](x,rnd()*6.28);x.restore();n++;}}
  return c;
}
let BG=null;function mkBg(){BG=mkMap(0);}
