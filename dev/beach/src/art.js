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
  octoboss:x=>drawOcto(x,'#b58bea',{crown:1,mood:'grr'}),
  whale:x=>{shape(x,'#5f9be0',()=>{x.moveTo(-50,-20);x.lineTo(-66,10);x.lineTo(-40,6);});shape(x,'#5f9be0',()=>{x.moveTo(50,-20);x.lineTo(66,10);x.lineTo(40,6);});
    shape(x,'#6fa8e8',()=>{x.ellipse(0,0,54,46,0,0,6.2832);});x.fillStyle='#eaf5ff';x.beginPath();x.ellipse(0,22,36,20,0,0,6.2832);x.fill();
    x.fillStyle='rgba(255,255,255,.75)';for(const p of [[-20,-26],[6,-30],[24,-18],[-6,-16]]){x.beginPath();x.arc(p[0],p[1],4,0,6.2832);x.fill();}
    x.strokeStyle='#bfe6ff';x.lineWidth=5;x.beginPath();x.moveTo(0,-46);x.quadraticCurveTo(-14,-62,-20,-52);x.moveTo(0,-46);x.quadraticCurveTo(14,-62,20,-52);x.stroke();face(x,0,2,24,5.5,'grr');},
};
function mkSprites(){for(const k in DRAW_EN){const big=k==='kingcrab'||k==='octoboss'||k==='whale',sz=big?300:170,c=mkCanvas(sz,sz),x=c.getContext('2d');safeCtx(x);x.translate(sz/2,sz*.53);x.scale(sz/160,sz/160);x.lineJoin='round';x.lineCap='round';DRAW_EN[k](x);SPR[k]=c;SPRW[k]=tint(c,'#fff');}}
function sprKey(e){return e.k==='boss'?(e.bk||'kingcrab'):e.k;}
function drawSpr(k,x,y,size,o){const c=(o&&o.white?SPRW:SPR)[k];if(!c)return;o=o||{};g.save();g.translate(x,y);if(o.rot)g.rotate(o.rot);g.scale(o.sx||1,o.sy||1);if(o.a!==undefined)g.globalAlpha*=o.a;g.drawImage(c,-size/2,-size*.53,size,size);g.restore();}

/* ---------- 전투 배경: 위는 바다, 아래는 모래사장 (세로 750×1334 한 장) ---------- */
let BG=null;
function mkBg(){const c=mkCanvas(VW,VH),x=c.getContext('2d');safeCtx(x);let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  let gr=x.createLinearGradient(0,0,0,730);gr.addColorStop(0,'#3fa9df');gr.addColorStop(.55,'#6fcbea');gr.addColorStop(1,'#b5ecf0');x.fillStyle=gr;x.fillRect(0,0,VW,740);
  x.strokeStyle='rgba(255,255,255,.35)';x.lineWidth=5;x.lineCap='round';for(let i=0;i<26;i++){const px=rnd()*VW,py=30+rnd()*640,w=30+rnd()*60;x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+w/2,py-8,px+w,py);x.stroke();}
  gr=x.createLinearGradient(0,700,0,VH);gr.addColorStop(0,'#f6dfa8');gr.addColorStop(.25,'#fde9bd');gr.addColorStop(1,'#f7dba4');x.fillStyle=gr;
  x.beginPath();x.moveTo(0,730);for(let i=0;i<=10;i++)x.quadraticCurveTo(i*75-37,716+(i%2)*26,i*75,730);x.lineTo(VW,VH);x.lineTo(0,VH);x.closePath();x.fill();
  x.fillStyle='rgba(200,150,80,.25)';for(let i=0;i<160;i++){x.beginPath();x.arc(rnd()*VW,760+rnd()*560,1.5+rnd()*2.5,0,6.2832);x.fill();}
  // 마을 쪽: 나무 데크
  x.fillStyle='#e8c98e';x.fillRect(0,1040,VW,VH-1040);x.strokeStyle='rgba(150,100,50,.35)';x.lineWidth=3;for(let py=1040;py<VH;py+=58){x.beginPath();x.moveTo(0,py);x.lineTo(VW,py);x.stroke();}
  for(let i=0;i<9;i++){const px=40+i*88+rnd()*20;x.beginPath();x.moveTo(px,1040);x.lineTo(px,VH);x.stroke();}
  BG=c;}
