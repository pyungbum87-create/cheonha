/* ============================== 그림: 전부 코드로 그린 심해 발광 그림체 (그림 파일이 오면 바꿔 끼운다) ============================== */
/* 받은 그림(art/): 이름만 맞으면 코드 그림 대신 쓴다. 목록은 빌드가 채움 */
const ART=@@ART@@,IMG={};let artVer=0;
for(const n of ART){const im=new Image();im.onload=()=>{IMG[n]=im;artVer++;};im.src='art/'+n+'.webp?v='+BUILD;}
/* 그림 속 생물이 보는 방향(1=오른쪽)과 화면 폭(논리 px) */
const EFACE={};   // 받은 그림은 모두 오른쪽을 봄(왼쪽을 보는 그림이면 -1)
const EW={minnow:27,crab:46,eel:62,ray:60,angler:54,squid:56,horseshoe:54,turtle:66,elite:44,boss:120};
/* 움직임: 그림은 한 장, 동작은 코드가 만든다. AL = 틱 사이 보간(0~1), FDT = 이번 장면 시간
   GAIT = [걸음새, 간 거리당 박자, 꼬리 흔들림(몸 높이 비율), 조각 수]. 박자는 '간 거리'에 맞춰 돌아서 느려지면 헤엄도 느려지고 멈추면 멈춘다 */
let AL=1,FDT=.016;
const GAIT={minnow:['swim',.9,.2,5],crab:['walk',.5],eel:['swim',.5,.17,9],ray:['swim',.24,.11,8],angler:['swim',.35,.09,7],squid:['jet',.2],horseshoe:['walk',.4],turtle:['walk',.3],elite:['bob',.3],boss:['swim',.2,.05,9]};
function drawSwim(x,im,w,h,ph,amp,n,ov){const sw=im.width/n,dw=w/n;for(let i=0;i<n;i++){const t=1-i/(n-1),off=Math.sin(ph-i*.75)*amp*t*t;x.drawImage(im,i*sw,0,sw,im.height,-w/2+i*dw-ov,-h/2+off,dw+ov*2,h);}}
const islBob=(i,time)=>Math.sin(time*1.1+i*1.9)*1.6;
const lerpPos=o=>o.ox===undefined?[o.x,o.y]:[o.ox+(o.x-o.ox)*AL,o.oy+(o.y-o.oy)*AL];
function drawImg(x,im,cx,by,w){const h=w*im.height/im.width;x.drawImage(im,cx-w/2,by-h,w,h);}
const TCOL={coral:'#ff8a5c',bubble:'#6ee7ff',jelly:'#ffe066',conch:'#ffc9a8',rune:'#c77dff'};
function rr(x,X,Y,w,h,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath();}
function txt(x,s,X,Y,size,col,align,stroke,weight){x.font=`${weight||800} ${size}px ${FONT}`;x.textAlign=align||'center';x.textBaseline='middle';
  if(stroke){x.lineWidth=Math.max(2,size/5);x.strokeStyle=stroke;x.lineJoin='round';x.strokeText(s,X,Y);}x.fillStyle=col;x.fillText(s,X,Y);}
function wrap(x,s,X,Y,maxW,size,col,lh,align){x.font=`700 ${size}px ${FONT}`;const words=LANG==='zh'?s.split(''):s.split(' ');let line='',yy=Y;const sep=LANG==='zh'?'':' ';
  for(const w of words){const test=line?line+sep+w:w;if(x.measureText(test).width>maxW&&line){txt(x,line,X,yy,size,col,align,null,700);line=w;yy+=lh;}else line=test;}if(line)txt(x,line,X,yy,size,col,align,null,700);return yy+lh;}
function oct(x,X,Y,r,fill,stroke,lw){x.beginPath();for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;x.lineTo(X+Math.cos(a)*r,Y+Math.sin(a)*r*.62);}x.closePath();x.fillStyle=fill;x.fill();if(stroke){x.lineWidth=lw||1.5;x.strokeStyle=stroke;x.stroke();}}
function glow(x,X,Y,r,col,a){const gr=x.createRadialGradient(X,Y,0,X,Y,r);gr.addColorStop(0,col);gr.addColorStop(1,'rgba(0,0,0,0)');x.globalAlpha=a==null?1:a;x.fillStyle=gr;x.beginPath();x.arc(X,Y,r,0,7);x.fill();x.globalAlpha=1;}
function hexA(c,a){const n=parseInt(c.slice(1),16);return `rgba(${n>>16},${(n>>8)&255},${n&255},${a})`;}

/* ---------- 지도 배경 (판마다 한 번 그려 둔다) ---------- */
function segPath(x,s){x.beginPath();s.p.forEach((q,i)=>i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1]));}
function minPathDist(M,X,Y){let md=1e9;for(const id in M.segs){const P=M.segs[id].p;for(let i=0;i<P.length;i+=3){const d=(P[i][0]-X)**2+(P[i][1]-Y)**2;if(d<md)md=d;}}return Math.sqrt(md);}
function renderBg(M){
  const c=mkCanvas(VW,VH),x=safeCtx(c.getContext('2d'));x.setTransform(K,0,0,K,0,0);const R=rng(77+M.si*13);
  let gr;if(IMG.bg_area1){x.drawImage(IMG.bg_area1,0,0,W,H);}else{gr=x.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#2b8fa2');gr.addColorStop(.35,'#16647a');gr.addColorStop(.75,'#0c3d55');gr.addColorStop(1,'#072a40');x.fillStyle=gr;x.fillRect(0,0,W,H);
  // 먼 바닥: 흐릿한 모래 언덕과 바위 그림자 (길과 상관없이 깔림)
  for(let i=0;i<26;i++){const px=R()*W,py=120+R()*(H-120),rw=60+R()*120;x.fillStyle=`rgba(${R()<.5?'10,40,60':'30,70,80'},${.18+R()*.15})`;x.beginPath();x.ellipse(px,py,rw,rw*.35,0,0,7);x.fill();}
  for(let i=0;i<14;i++){const px=R()*W,py=200+R()*(H-200);x.fillStyle=`rgba(5,25,40,${.25+R()*.15})`;x.beginPath();x.moveTo(px-30-R()*30,py);
    for(let j=0;j<5;j++)x.lineTo(px-30+j*15+R()*10,py-12-R()*36);x.lineTo(px+40+R()*20,py);x.closePath();x.fill();}}
  {const tn=AREAS[Math.floor(M.si/PER_AREA)].tint;if(tn){x.fillStyle=tn;x.fillRect(0,0,W,H);}}
  // 아주 옅은 물살 띠: 길을 '파지' 않고 물빛만 살짝 밝게
  const segs=Object.values(M.segs);x.lineCap=x.lineJoin='round';
  for(const s of segs){segPath(x,s);x.strokeStyle='rgba(160,235,255,.045)';x.lineWidth=60;x.stroke();}
  for(const s of segs){segPath(x,s);x.strokeStyle='rgba(190,245,255,.04)';x.lineWidth=28;x.stroke();}
  // 가까운 꾸밈(길에서 떨어진 곳만): 해초 숲, 산호, 바위, 조개
  const CC=['#ff7a59','#c86bfa','#ff5d8f','#ffb347','#5be3c6','#7ab8ff'];
  if(!IMG.bg_area1)for(let i=0;i<120;i++){const px=10+R()*(W-20),py=80+R()*(H-110);const md=minPathDist(M,px,py);if(md<34||M.spots.some(s=>dist(s.x,s.y,px,py)<34)||dist(px,py,TEMPLE.x,TEMPLE.y)<84)continue;
    const col=CC[(R()*CC.length)|0],kind=R(),fade=Math.min(1,(md-30)/40);x.globalAlpha=.35+.45*fade;
    if(kind<.3){x.strokeStyle=R()<.5?'#2f8a5a':'#3fa070';x.lineCap='round';const n=2+(R()*3|0);for(let j=0;j<n;j++){let X=px+j*4-n*2,Y=py;x.lineWidth=2.5;x.beginPath();x.moveTo(X,Y);const h=20+R()*30;for(let k=1;k<=6;k++){X+=Math.sin(k*1.3+j)*3;Y-=h/6;x.lineTo(X,Y);}x.stroke();}}
    else if(kind<.55){x.strokeStyle=col;x.lineCap='round';const br=(X,Y,a,l,w)=>{if(l<3)return;const X2=X+Math.cos(a)*l,Y2=Y+Math.sin(a)*l;x.lineWidth=w;x.beginPath();x.moveTo(X,Y);x.lineTo(X2,Y2);x.stroke();br(X2,Y2,a-.5,l*.68,w*.75);br(X2,Y2,a+.45,l*.62,w*.75);};br(px,py,-Math.PI/2+(R()-.5)*.4,9+R()*6,3);}
    else if(kind<.75){for(let j=0;j<5;j++){x.fillStyle=col;x.beginPath();x.arc(px+(R()-.5)*12,py+(R()-.5)*8,2+R()*3,0,7);x.fill();}}
    else if(kind<.9){x.fillStyle='#24485a';x.beginPath();x.ellipse(px,py,8+R()*10,5+R()*5,0,0,7);x.fill();x.fillStyle='rgba(120,200,190,.25)';x.beginPath();x.ellipse(px-2,py-2,5,2.5,0,0,7);x.fill();}
    else{x.fillStyle=col;x.beginPath();x.ellipse(px,py,7+R()*5,4+R()*3,0,Math.PI,0);x.fill();}
    x.globalAlpha=1;}
  if(!IMG.bg_area1)for(let i=0;i<50;i++){const px=R()*W,py=60+R()*(H-120);if(minPathDist(M,px,py)<30)continue;glow(x,px,py,3+R()*3,R()<.5?'rgba(120,255,230,.9)':'rgba(200,140,255,.9)',.45);}
  // 심연 균열(적이 나오는 곳)
  for(const cvp of M.caves){const X=cvp[0],Y=cvp[1];if(IMG.abyss_rift){const w=118,h=w*IMG.abyss_rift.height/IMG.abyss_rift.width;x.drawImage(IMG.abyss_rift,X-w/2,Y-h/2,w,h);continue;}gr=x.createRadialGradient(X,Y,2,X,Y,44);gr.addColorStop(0,'#05000c');gr.addColorStop(.55,'rgba(30,0,50,.85)');gr.addColorStop(1,'rgba(30,0,50,0)');
    x.fillStyle=gr;x.beginPath();x.ellipse(X,Y,46,30,0,0,7);x.fill();x.strokeStyle='rgba(199,125,255,.5)';x.lineWidth=2;for(let k=0;k<2;k++){x.beginPath();x.ellipse(X,Y,22+k*10,12+k*7,0,0,7);x.stroke();}}
  // 떠 있는 바위섬(수호탑 자리): 아래 멀리 그림자, 뾰족한 밑바닥, 이끼·산호 윗면
  for(const s of M.spots){const r2=rng(s.x*7+s.y*13);if(IMG.islet){x.fillStyle='rgba(0,15,25,.28)';x.beginPath();x.ellipse(s.x+6,s.y+36,24,8,0,0,7);x.fill();continue;}
    x.fillStyle='rgba(0,15,25,.28)';x.beginPath();x.ellipse(s.x+6,s.y+36,24,8,0,0,7);x.fill();
    x.fillStyle='#26404a';x.beginPath();x.moveTo(s.x-27,s.y+2);x.lineTo(s.x-14,s.y+16);x.lineTo(s.x-6,s.y+28+r2()*6);x.lineTo(s.x+3,s.y+18);x.lineTo(s.x+10,s.y+24+r2()*6);x.lineTo(s.x+20,s.y+12);x.lineTo(s.x+27,s.y+2);x.closePath();x.fill();
    x.fillStyle='#1a2e36';x.beginPath();x.moveTo(s.x,s.y+6);x.lineTo(s.x-6,s.y+28);x.lineTo(s.x+3,s.y+18);x.closePath();x.fill();
    gr=x.createLinearGradient(0,s.y-16,0,s.y+10);gr.addColorStop(0,'#5a9a78');gr.addColorStop(1,'#2e5c52');x.fillStyle=gr;x.beginPath();x.ellipse(s.x,s.y,28,16,0,0,7);x.fill();
    x.strokeStyle='rgba(180,240,200,.35)';x.lineWidth=1.5;x.beginPath();x.ellipse(s.x,s.y-1,26,14,0,Math.PI*1.1,Math.PI*1.9);x.stroke();
    for(let j=0;j<4;j++){const an=r2()*7,rx=s.x+Math.cos(an)*22,ry=s.y+Math.sin(an)*11;x.fillStyle=CC[(r2()*CC.length)|0];x.beginPath();x.arc(rx,ry,1.6+r2()*1.6,0,7);x.fill();}}
  // 신전 바닥
  const T=TEMPLE;if(!IMG.temple_gate){x.fillStyle='rgba(0,8,10,.45)';x.beginPath();x.ellipse(T.x,T.y+16,82,28,0,0,7);x.fill();
  for(let k=0;k<3;k++){x.fillStyle=['#33504c','#456663','#5a7b76'][k];x.beginPath();x.ellipse(T.x,T.y+10-k*6,74-k*12,24-k*4,0,0,7);x.fill();}}
  gr=x.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.75);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,10,25,.55)');x.fillStyle=gr;x.fillRect(0,0,W,H);
  return c;
}
function drawTemple(x,t,hurt){
  const T=TEMPLE,X=T.x,Y=T.y-8,p=.6+.4*Math.sin(t*2);
  glow(x,X,Y-20,70,hurt>0?'rgba(255,80,100,.55)':'rgba(120,255,200,.35)',p);
  if(IMG.temple_gate){drawImg(x,IMG.temple_gate,X,T.y+30,150);return;}
  x.fillStyle='#5f7f78';for(const dx of[-34,34]){rr(x,X+dx-6,Y-46,12,46,3);x.fill();x.fillStyle='#86a8a0';rr(x,X+dx-8,Y-50,16,6,2);x.fill();x.fillStyle='#5f7f78';}
  x.fillStyle='#4d6a64';x.beginPath();x.moveTo(X-30,Y);x.lineTo(X-30,Y-38);x.quadraticCurveTo(X,Y-66,X+30,Y-38);x.lineTo(X+30,Y);x.closePath();x.fill();
  const gr=x.createLinearGradient(0,Y-50,0,Y);gr.addColorStop(0,'rgba(180,255,220,.95)');gr.addColorStop(1,'rgba(60,200,170,.6)');x.fillStyle=gr;
  x.beginPath();x.moveTo(X-20,Y);x.lineTo(X-20,Y-32);x.quadraticCurveTo(X,Y-52,X+20,Y-32);x.lineTo(X+20,Y);x.closePath();x.fill();
  x.save();x.translate(X,Y-24+Math.sin(t*2.5)*2);x.rotate(t*.8);x.fillStyle='#fff';x.globalAlpha=.9;x.beginPath();x.moveTo(0,-9);x.lineTo(6,0);x.lineTo(0,9);x.lineTo(-6,0);x.closePath();x.fill();x.restore();x.globalAlpha=1;
  x.fillStyle='#d9b45a';x.beginPath();x.moveTo(X-10,Y-62);x.lineTo(X,Y-74);x.lineTo(X+10,Y-62);x.closePath();x.fill();
}
/* ---------- 수호탑 ---------- */
function drawTower(x,t,time,sel){
  const X=t.x,Y=t.y,c=TCOL[t.k],lv=t.lv,s=1+(lv-1)*(IMG['tw_'+t.k+'_1']?.03:.09),kick=Math.max(0,t.kick||0);
  if(lv>=2)glow(x,X,Y,30,hexA(c,.35),.8);
  let tim=null;for(let l=lv;l>=1&&!tim;l--)tim=IMG['tw_'+t.k+'_'+l];
  if(tim){const aim=t.k==='coral'||t.k==='conch',dir=aim&&Math.cos(t.ang==null?0:t.ang)<0?-1:1,bob=t.spot===undefined?0:islBob(t.spot,time);
    if(t.vF===undefined)t.vF=dir;t.vF+=(dir-t.vF)*Math.min(1,FDT*8);const vf=Math.abs(t.vF)<.2?(t.vF<0?-.2:.2):t.vF,sq=1+kick*.08,sway=t.k==='jelly'?Math.sin(time*1.6+X)*.025:0;
    x.save();x.translate(X+(aim?-dir*kick*2.5:0),Y+14+bob);x.rotate(sway);x.scale(vf*s/sq,s*sq);drawImg(x,tim,0,0,Math.min(46,52*tim.width/tim.height));x.restore();
    if(kick>.55){x.globalCompositeOperation='lighter';glow(x,X+(aim?dir*14:0),Y-22+bob,22,hexA(c,.9),(kick-.55)*2);x.globalCompositeOperation='source-over';}}
  else{
  oct(x,X,Y+2,18*s,'#26313a',lv>=2?'#e8c45a':'#5c6b74',lv>=3?2.5:1.5);
  x.strokeStyle=hexA(c,.8);x.lineWidth=1.5;x.beginPath();x.ellipse(X,Y+2,12*s,7*s,0,0,7);x.stroke();
  x.save();x.translate(X,Y);x.scale(s,s);
  const a=t.ang==null?-Math.PI/2:t.ang;
  if(t.k==='coral'){x.lineCap='round';
    const br=(X1,Y1,an,l,w,d)=>{const X2=X1+Math.cos(an)*l,Y2=Y1+Math.sin(an)*l;x.strokeStyle=d>1?'#e8603f':d>0?'#ff7f5e':'#ffa078';x.lineWidth=w;x.beginPath();x.moveTo(X1,Y1);x.lineTo(X2,Y2);x.stroke();
      if(d<2){br(X2,Y2,an-.55,l*.7,w*.72,d+1);br(X2,Y2,an+.5,l*.66,w*.72,d+1);}else{x.fillStyle='#ffd6b8';x.beginPath();x.arc(X2,Y2,1.6,0,7);x.fill();}};
    br(-3,0,-1.75,10,5,0);br(3,0,-1.35,9,4.5,1);
    x.save();x.translate(0,-14);x.rotate(a);x.translate(-kick*3,0);x.fillStyle='#7a2e22';rr(x,-4,-3,12,6,3);x.fill();x.fillStyle='#fff0dc';x.beginPath();x.moveTo(15,0);x.lineTo(5,-3.5);x.lineTo(5,3.5);x.closePath();x.fill();x.restore();
  }else if(t.k==='bubble'){x.fillStyle='#3c5560';rr(x,-5,-12,10,12,2);x.fill();x.fillStyle='#d9b45a';rr(x,-8,-14,16,4,2);x.fill();
    const by=-25-kick*1.5;glow(x,0,by,18,'rgba(110,231,255,.6)');const gr=x.createRadialGradient(-3,by-4,1,0,by,11);gr.addColorStop(0,'#e8fdff');gr.addColorStop(.5,'rgba(110,231,255,.65)');gr.addColorStop(1,'rgba(40,140,200,.8)');
    x.fillStyle=gr;x.beginPath();x.arc(0,by,11,0,7);x.fill();x.strokeStyle='rgba(255,255,255,.7)';x.lineWidth=1.2;x.beginPath();x.arc(0,by,6,time*3,time*3+3.5);x.stroke();
  }else if(t.k==='jelly'){x.fillStyle='#2f4a66';rr(x,-5,-22,10,22,2);x.fill();x.fillStyle='#d9b45a';rr(x,-7,-24,14,3,1);x.fill();
    const jy=-31+Math.sin(time*3)*1.5,sq=1+Math.sin(time*6)*.06+kick*.15;glow(x,0,jy,20,'rgba(255,224,102,.55)');
    x.fillStyle='rgba(255,236,150,.9)';x.beginPath();x.ellipse(0,jy,10*sq,8/sq,0,Math.PI,0);x.fill();x.fillStyle='rgba(150,240,255,.6)';x.beginPath();x.ellipse(0,jy,10*sq,2.5,0,0,Math.PI);x.fill();
    x.strokeStyle='rgba(255,236,150,.85)';x.lineWidth=1.2;for(let i=-2;i<=2;i++){x.beginPath();x.moveTo(i*3.5,jy+1);x.quadraticCurveTo(i*3.5+Math.sin(time*5+i)*3,jy+6,i*3+Math.sin(time*4+i)*2,jy+11);x.stroke();}
    if(kick>.3){x.strokeStyle='#fff';x.lineWidth=1.5;for(let i=0;i<3;i++){const an=time*20+i*2;x.beginPath();x.moveTo(Math.cos(an)*12,jy+Math.sin(an)*10);x.lineTo(Math.cos(an)*17,jy+Math.sin(an)*14);x.stroke();}}
  }else if(t.k==='conch'){x.fillStyle='#3a4650';rr(x,-8,-8,16,8,2);x.fill();x.save();x.translate(0,-15);x.rotate(a);x.translate(-kick*4,0);
    const gr=x.createLinearGradient(-12,0,14,0);gr.addColorStop(0,'#e8a07a');gr.addColorStop(1,'#ffe0c8');x.fillStyle=gr;x.beginPath();x.moveTo(16,-5);x.quadraticCurveTo(4,-14,-10,-8);x.quadraticCurveTo(-16,0,-10,8);x.quadraticCurveTo(4,14,16,5);x.closePath();x.fill();
    x.strokeStyle='#b0664a';x.lineWidth=1.3;x.beginPath();x.arc(-6,0,5,0,5.5);x.stroke();x.beginPath();x.arc(-6,0,2,0,5);x.stroke();x.fillStyle='#5a2a20';x.beginPath();x.ellipse(15,0,2.5,4.5,0,0,7);x.fill();x.restore();
  }else if(t.k==='rune'){x.fillStyle='#4a3d66';rr(x,-13,-26,6,26,2);x.fill();rr(x,7,-26,6,26,2);x.fill();x.beginPath();x.moveTo(-13,-24);x.quadraticCurveTo(0,-38,13,-24);x.lineTo(13,-20);x.quadraticCurveTo(0,-32,-13,-20);x.closePath();x.fill();
    const p=.6+.4*Math.sin(time*4);glow(x,0,-14,18,'rgba(199,125,255,.7)',p);x.fillStyle=`rgba(220,170,255,${.5+.3*p})`;x.beginPath();x.ellipse(0,-13,6,10,0,0,7);x.fill();
    x.save();x.translate(0,-40+Math.sin(time*2)*2);x.rotate(time);x.strokeStyle='#e6c8ff';x.lineWidth=1.5;x.beginPath();x.moveTo(0,-5);x.lineTo(5,0);x.lineTo(0,5);x.lineTo(-5,0);x.closePath();x.stroke();x.restore();}
  x.restore();}
  if(lv>=3){x.fillStyle='#ffd76a';x.beginPath();const cy=Y-(tim?40:48)+Math.sin(time*3)*1.5;x.moveTo(X-6,cy+4);x.lineTo(X-6,cy-2);x.lineTo(X-3,cy+1);x.lineTo(X,cy-4);x.lineTo(X+3,cy+1);x.lineTo(X+6,cy-2);x.lineTo(X+6,cy+4);x.closePath();x.fill();}
  if(lv>=4){x.save();x.translate(X,Y+2);x.rotate(time*.8);x.strokeStyle='rgba(255,215,106,.85)';x.lineWidth=2;x.setLineDash([5,5]);x.beginPath();x.ellipse(0,0,26,15,0,0,7);x.stroke();x.setLineDash([]);x.restore();glow(x,X,Y-20,34,hexA(c,.35),.6+.3*Math.sin(time*3));}
  if(t.hasteT>0){x.strokeStyle=`rgba(255,230,120,${.5+.3*Math.sin(time*12)})`;x.lineWidth=2;x.beginPath();x.ellipse(X,Y+2,22,12,0,0,7);x.stroke();}
  if(t.ink>0){x.fillStyle='rgba(10,5,20,.85)';for(const q of[[-8,-14,9],[6,-20,8],[2,-6,10],[-3,-26,6]]){x.beginPath();x.arc(X+q[0],Y+q[1],q[2],0,7);x.fill();}
    txt(x,'👆',X+14,Y-30+Math.sin(time*6)*2,13,'#fff');}
  for(let i=0;i<lv;i++){x.fillStyle=lv>=3?'#ffd76a':'#cfe';x.beginPath();x.arc(X-6+i*6,Y+14,2,0,7);x.fill();}
}
function towerIcon(x,k,X,Y,s){const t={k,lv:1,x:0,y:0,ang:-Math.PI/4,kick:0};x.save();x.translate(X,Y+8*s);x.scale(s,s);drawTower(x,t,performance.now()/1000,false);x.restore();}
/* ---------- 적 ---------- */
function drawEnemy(x,e,time){
  const E=ENEMIES[e.k],r=e.r,face=Math.cos(e.a)<0?-1:1,sp=e.spawnT>0?1-e.spawnT/.7:1;
  const [EX,EY]=lerpPos(e);e.vL=(e.vL||0)+((e.lift>0?12:0)-(e.vL||0))*Math.min(1,FDT*7);
  let alpha=e.inv?(e.rev?.55:.13):1;x.save();x.translate(EX,EY-e.vL-(e.lift>0?Math.sin(time*8)*1.5:0));
  if(sp<1){x.scale(sp,sp);alpha*=sp;}
  x.globalAlpha=alpha;glow(x,0,0,r*1.9,'rgba(140,60,220,.35)');
  const eim=IMG['en_'+(E.art||e.k)];if(E.tint)glow(x,0,0,r*2.4,hexA(E.tint,.55),.6+.3*Math.sin(time*3));
  if(eim){const key=E.art||e.k,GT=GAIT[key]||GAIT.angler,w=e.icon?Math.min(34,EW[key]||34):(E.ew||EW[e.k]),h=w*eim.height/eim.width,still=e.stun>0||e.trap>0;
    const ph=(e.prog||0)*GT[1]*.35+e.id*1.3+(still?0:time*1.2),hs=1+Math.max(0,e.hitT||0)*1.1,ov=alpha<1?0:.3;e.vh=h/2;
    if(e.vF===undefined){e.vF=face;e.vA=0;}e.vF+=(face-e.vF)*Math.min(1,FDT*10);const vf=Math.abs(e.vF)<.2?(e.vF<0?-.2:.2):e.vF;
    const tilt=Math.max(-.6,Math.min(.6,Math.atan2(Math.sin(e.a),Math.abs(Math.cos(e.a)))))*.75;
    let paint;
    if(GT[0]==='swim'){e.vA+=(tilt-e.vA)*Math.min(1,FDT*6);x.scale(vf*hs,hs);x.rotate(e.vA);paint=()=>drawSwim(x,eim,w,h,ph,GT[2]*h,e.icon?6:GT[3],ov);}
    else if(GT[0]==='jet'){const pu=Math.sin(ph*1.4);e.vA+=(tilt-e.vA)*Math.min(1,FDT*6);x.scale(vf*hs*(1+pu*.07),hs*(1-pu*.07));x.rotate(e.vA);paint=()=>drawSwim(x,eim,w,h,ph*1.4,.05*h,6,ov);}
    else if(GT[0]==='walk'){const st=Math.sin(ph*2);x.scale(vf*hs,hs);x.rotate(st*.05);paint=()=>x.drawImage(eim,-w/2,-h/2-Math.abs(st)*1.5,w,h);}
    else{x.scale(vf*hs,hs);x.rotate(Math.sin(ph)*.07);paint=()=>x.drawImage(eim,-w/2,-h/2+Math.sin(ph*1.3)*2,w,h);}
    paint();if(e.hitT>0&&alpha>=1){x.globalCompositeOperation='lighter';x.globalAlpha=Math.min(1,e.hitT*9);paint();x.globalCompositeOperation='source-over';x.globalAlpha=alpha;}}
  else{x.scale(face*1.18,1.18);}const bob=Math.sin(time*6+e.id)*1.2;
  if(!eim)switch(E.art||e.k){
    case'minnow':{const w=Math.sin(time*14+e.id)*3;x.fillStyle='#2b2f5a';x.beginPath();x.moveTo(r+2,0);x.quadraticCurveTo(0,-r*.8,-r,0);x.quadraticCurveTo(0,r*.8,r+2,0);x.fill();
      x.beginPath();x.moveTo(-r+1,0);x.lineTo(-r-6,-4+w);x.lineTo(-r-6,4+w);x.closePath();x.fill();x.fillStyle='#d58bff';x.beginPath();x.arc(r*.45,-1.5,1.8,0,7);x.fill();break;}
    case'crab':{x.translate(0,bob*.5);x.strokeStyle='#38506a';x.lineWidth=2;for(let i=-1;i<=1;i++)for(const sd of[-1,1]){x.beginPath();x.moveTo(sd*6,2+i*3);x.lineTo(sd*(r+2),5+i*3+Math.sin(time*12+i)*2);x.stroke();}
      const gr=x.createLinearGradient(0,-r,0,r);gr.addColorStop(0,'#7d9bb8');gr.addColorStop(1,'#34465c');x.fillStyle=gr;x.beginPath();x.ellipse(0,0,r,r*.72,0,0,7);x.fill();
      x.strokeStyle='#b8d2e8';x.lineWidth=1.2;x.beginPath();x.ellipse(0,-1,r*.7,r*.45,0,Math.PI*1.1,Math.PI*1.9);x.stroke();
      x.fillStyle='#5a7896';for(const sd of[-1,1]){x.beginPath();x.ellipse(sd*(r-1),-r*.7,5,4,sd*.5,0,7);x.fill();}
      x.fillStyle='#ff6bd6';x.beginPath();x.arc(-3,-r*.55,1.8,0,7);x.arc(3,-r*.55,1.8,0,7);x.fill();break;}
    case'eel':{x.lineCap='round';const n=7;let px=r,py=0;x.strokeStyle=e.dashT>0?'#fff27a':'#3b4a2a';x.lineWidth=7;x.beginPath();x.moveTo(px,py);
      for(let i=1;i<=n;i++){px=r-i*4;py=Math.sin(time*10+i*.9)*3*(i/n+.3);x.lineTo(px,py);}x.stroke();x.strokeStyle='#e9d24a';x.lineWidth=1.5;x.setLineDash([3,4]);x.stroke();x.setLineDash([]);
      x.fillStyle='#4a5a30';x.beginPath();x.arc(r,0,4.5,0,7);x.fill();x.fillStyle='#ffef6a';x.beginPath();x.arc(r+1.5,-1.5,1.6,0,7);x.fill();
      if(e.dashT>0||Math.sin(time*7+e.id)>.8){x.strokeStyle='#bff';x.lineWidth=1;x.beginPath();x.moveTo(0,-6);x.lineTo(3,-10);x.lineTo(-1,-12);x.stroke();}break;}
    case'ray':{const f=Math.sin(time*5+e.id)*.25;x.fillStyle='#3a2f5c';x.beginPath();x.moveTo(r,0);x.quadraticCurveTo(0,-r*1.3-f*8,-r*.6,-r*.2);x.lineTo(-r*.6,r*.2);x.quadraticCurveTo(0,r*1.3+f*8,r,0);x.fill();
      x.strokeStyle='#3a2f5c';x.lineWidth=1.5;x.beginPath();x.moveTo(-r*.6,0);x.quadraticCurveTo(-r*1.2,Math.sin(time*6)*4,-r*1.8,0);x.stroke();
      x.fillStyle='#9b7dff';x.beginPath();x.arc(r*.55,-2.5,1.5,0,7);x.arc(r*.55,2.5,1.5,0,7);x.fill();if(e.inv&&e.rev){x.strokeStyle='#d6c6ff';x.lineWidth=1;x.stroke();}break;}
    case'angler':{x.translate(0,bob);const gr=x.createRadialGradient(-2,-3,1,0,0,r);gr.addColorStop(0,'#5a4a3a');gr.addColorStop(1,'#2a2018');x.fillStyle=gr;x.beginPath();x.arc(0,0,r,0,7);x.fill();
      x.fillStyle='#e8e0c0';for(let i=0;i<5;i++){x.beginPath();x.moveTo(r*.3+i*2,3);x.lineTo(r*.3+i*2+1,7);x.lineTo(r*.3+i*2+2,3);x.fill();}
      x.strokeStyle='#4a3a2a';x.lineWidth=1.5;x.beginPath();x.moveTo(2,-r+1);x.quadraticCurveTo(r,-r-12,r+5,-r-4);x.stroke();
      glow(x,r+5,-r-4,10,'rgba(160,255,140,.9)',.6+.4*Math.sin(time*5));x.fillStyle='#d8ffb0';x.beginPath();x.arc(r+5,-r-4,2.5,0,7);x.fill();
      x.fillStyle='#ffef8a';x.beginPath();x.arc(r*.4,-r*.35,2.2,0,7);x.fill();break;}
    case'squid':{x.translate(0,bob);x.strokeStyle='#7a3a6a';x.lineWidth=2.2;x.lineCap='round';for(let i=0;i<5;i++){x.beginPath();x.moveTo(-r*.5,(i-2)*2.5);x.quadraticCurveTo(-r-4,(i-2)*4+Math.sin(time*8+i)*3,-r-10,(i-2)*5+Math.sin(time*6+i)*4);x.stroke();}
      x.fillStyle='#a04c8a';x.beginPath();x.moveTo(r+4,0);x.quadraticCurveTo(r*.5,-r*.9,-r*.5,-r*.55);x.lineTo(-r*.5,r*.55);x.quadraticCurveTo(r*.5,r*.9,r+4,0);x.fill();
      x.fillStyle='#fff';x.beginPath();x.arc(0,-3,2.6,0,7);x.arc(0,3,2.6,0,7);x.fill();x.fillStyle='#111';x.beginPath();x.arc(.8,-3,1.3,0,7);x.arc(.8,3,1.3,0,7);x.fill();break;}
    case'horseshoe':{x.strokeStyle='#4a4030';x.lineWidth=2;x.beginPath();x.moveTo(-r,0);x.lineTo(-r-9,Math.sin(time*4)*2);x.stroke();
      const gr=x.createLinearGradient(0,-r,0,r);gr.addColorStop(0,'#8a7a50');gr.addColorStop(1,'#4a3e26');x.fillStyle=gr;x.beginPath();x.moveTo(r,0);x.quadraticCurveTo(r,-r*.9,0,-r*.9);x.quadraticCurveTo(-r,-r*.8,-r,0);x.quadraticCurveTo(-r,r*.8,0,r*.9);x.quadraticCurveTo(r,r*.9,r,0);x.fill();
      x.strokeStyle='#c8b480';x.lineWidth=1;x.beginPath();x.moveTo(r*.6,0);x.lineTo(-r*.8,0);x.stroke();x.fillStyle='#ff6bd6';x.beginPath();x.arc(r*.4,-4,1.5,0,7);x.arc(r*.4,4,1.5,0,7);x.fill();break;}
    case'turtle':{x.translate(0,bob*.4);x.fillStyle='#4f6a4a';for(const q of[[r*.6,-r*.75],[r*.6,r*.75],[-r*.6,-r*.75],[-r*.6,r*.75]]){x.beginPath();x.ellipse(q[0]+Math.sin(time*4)*1.5,q[1],5,3.5,0,0,7);x.fill();}
      x.beginPath();x.arc(r+3,0,5,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(r+5,-2,1.4,0,7);x.fill();
      const gr=x.createRadialGradient(-3,-4,2,0,0,r);gr.addColorStop(0,'#8a8f84');gr.addColorStop(1,'#3e4440');x.fillStyle=gr;x.beginPath();x.arc(0,0,r,0,7);x.fill();
      x.strokeStyle='#2c302c';x.lineWidth=1.3;for(let i=0;i<6;i++){const an=i*Math.PI/3;x.beginPath();x.moveTo(Math.cos(an)*r*.4,Math.sin(an)*r*.4);x.lineTo(Math.cos(an)*r*.95,Math.sin(an)*r*.95);x.stroke();}x.beginPath();x.arc(0,0,r*.4,0,7);x.stroke();break;}
    case'elite':{x.translate(0,bob);x.fillStyle='#4b3a7a';x.beginPath();x.moveTo(4,-r);x.quadraticCurveTo(r,-r*.6,6,0);x.quadraticCurveTo(10,r*.5,0,r*.7);x.quadraticCurveTo(-8,r,-4,r*.4);x.quadraticCurveTo(-r*.6,0,4,-r);x.fill();
      x.strokeStyle='#8a72d0';x.lineWidth=2.5;x.lineCap='round';x.beginPath();x.moveTo(-4,r*.4);x.quadraticCurveTo(-r*.7,r*.9,-4,r*1.1);x.stroke();
      x.fillStyle='#c0c8d8';x.beginPath();x.moveTo(-2,-r);x.lineTo(10,-r-2);x.lineTo(14,-r+6);x.lineTo(2,-r+8);x.closePath();x.fill();
      x.strokeStyle='#d8dce8';x.lineWidth=2;x.beginPath();x.moveTo(-6,-2);x.lineTo(r+8,-10);x.stroke();x.fillStyle='#f0f4ff';x.beginPath();x.moveTo(r+8,-10);x.lineTo(r+2,-13);x.lineTo(r+3,-7);x.closePath();x.fill();
      x.fillStyle='#ff4fd8';x.beginPath();x.arc(7,-r+3,2,0,7);x.fill();break;}
    case'boss':{x.translate(0,bob*1.5);const gr=x.createRadialGradient(-6,-8,4,0,0,r);gr.addColorStop(0,'#5a3a6a');gr.addColorStop(1,'#1e1028');x.fillStyle=gr;x.beginPath();x.arc(0,0,r,0,7);x.fill();
      x.fillStyle='#120818';x.beginPath();x.moveTo(r*.95,2);x.quadraticCurveTo(r*.3,r*.55,-r*.2,r*.35);x.quadraticCurveTo(r*.3,r*.2,r*.95,2);x.fill();
      x.fillStyle='#f4ecd0';for(let i=0;i<7;i++){const px=r*.05+i*r*.13;x.beginPath();x.moveTo(px,r*.28-i*1.2);x.lineTo(px+2.5,r*.48-i*1.5);x.lineTo(px+5,r*.26-i*1.2);x.fill();}
      x.strokeStyle='#3a2048';x.lineWidth=3;x.beginPath();x.moveTo(0,-r+2);x.quadraticCurveTo(r*.8,-r-26,r+10,-r-8);x.stroke();
      glow(x,r+10,-r-8,24,'rgba(255,120,220,.9)',.6+.4*Math.sin(time*4));x.fillStyle='#ffd0f4';x.beginPath();x.arc(r+10,-r-8,5,0,7);x.fill();
      x.fillStyle='#e8c45a';x.beginPath();x.moveTo(-r*.6,-r*.75);x.lineTo(-r*.55,-r*1.15);x.lineTo(-r*.3,-r*.9);x.lineTo(-r*.1,-r*1.2);x.lineTo(r*.05,-r*.9);x.lineTo(r*.25,-r*1.1);x.lineTo(r*.2,-r*.72);x.closePath();x.fill();
      x.fillStyle='#ff3a6a';x.beginPath();x.arc(r*.42,-r*.35,4.5,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(r*.46,-r*.38,1.5,0,7);x.fill();break;}
  }
  if(e.hitT>0&&!eim)glow(x,0,0,r*1.3,'rgba(255,255,255,.5)');x.restore();x.save();x.translate(EX,EY-e.vL);x.globalAlpha=alpha;
  if(e.clampT>0){x.strokeStyle='rgba(220,225,240,.9)';x.lineWidth=3;x.beginPath();x.arc(0,0,r+2,Math.PI*1.1,Math.PI*1.9);x.stroke();}
  if(e.poiT>0){x.fillStyle='rgba(140,255,120,.8)';for(let i=0;i<2;i++){x.beginPath();x.arc(Math.sin(time*5+i*3)*r*.6,-r*.4-((time*20+i*9)%12),1.8,0,7);x.fill();}}
  if(e.schooling){x.strokeStyle='rgba(220,180,255,.6)';x.lineWidth=1;x.beginPath();x.moveTo(-r-2,-3);x.lineTo(-r-9,-3);x.moveTo(-r-2,3);x.lineTo(-r-8,3);x.stroke();}
  if(e.shield>0){x.strokeStyle='rgba(120,200,255,.7)';x.lineWidth=2;x.beginPath();x.arc(0,0,r+4,0,7);x.stroke();}
  if(e.trap>0){const gr=x.createRadialGradient(-4,-6,2,0,-2,r+8);gr.addColorStop(0,'rgba(255,255,255,.5)');gr.addColorStop(1,'rgba(110,231,255,.25)');x.fillStyle=gr;x.beginPath();x.arc(0,-2,r+8,0,7);x.fill();x.strokeStyle='rgba(200,250,255,.9)';x.lineWidth=1.5;x.stroke();}
  if(e.slow>0&&e.slowT>0){x.fillStyle='rgba(150,230,255,.7)';for(let i=0;i<3;i++){const an=time*3+i*2.1;x.beginPath();x.arc(Math.cos(an)*r,Math.sin(an)*r*.5-2,1.8,0,7);x.fill();}}
  if(e.stun>0){x.fillStyle='#fff27a';for(let i=0;i<3;i++){const an=time*8+i*2.1;txt(x,'✦',Math.cos(an)*9,-r-8+Math.sin(an)*3,8,'#fff27a');}}
  if(e.hp<e.mhp||e.shield>0){const bw=E.ph?64:Math.max(18,r*2),by=-Math.max(r,e.vh||0)-(E.ph?8:6);x.fillStyle='rgba(0,0,0,.6)';x.fillRect(-bw/2-1,by-1,bw+2,5);
    x.fillStyle=E.ph?'#ff4f8a':'#7dff9a';x.fillRect(-bw/2,by,bw*Math.max(0,e.hp/e.mhp),3);if(e.shield>0){x.fillStyle='#7cc8ff';x.fillRect(-bw/2,by-3,bw*Math.min(1,e.shield/e.mhp),2);}}
  x.restore();
}
/* ---------- 영웅: 기갑 수호자 가드 ---------- */
function drawHero(x,h,time,sel){
  const [HX,HY]=lerpPos(h);
  if(h.vF===undefined){h.vF=h.face;h.vP=0;h.lx=HX;h.ly=HY;}
  const mv=Math.hypot(HX-h.lx,HY-h.ly);h.lx=HX;h.ly=HY;h.vP+=Math.min(6,mv)*.2;h.vF+=(h.face-h.vF)*Math.min(1,FDT*12);if(h.vS>0)h.vS-=FDT*2.6;
  const vf=Math.abs(h.vF)<.2?(h.vF<0?-.2:.2):h.vF,walk=h.moving,step=walk?Math.abs(Math.sin(h.vP)):0,at=Math.max(0,h.atk||0),sw=Math.sin(at*Math.PI),sl=Math.max(0,h.vS||0);
  const X=HX,Y=HY+(walk?-step*3:Math.sin(time*2)*1.2);
  x.fillStyle='rgba(0,0,0,.35)';x.beginPath();x.ellipse(HX,HY+14,14-step*2,5-step,0,0,7);x.fill();
  if(sel){x.strokeStyle=`rgba(120,255,220,${.6+.3*Math.sin(time*8)})`;x.lineWidth=2;x.beginPath();x.ellipse(HX,HY+14,20,8,0,0,7);x.stroke();x.strokeStyle='rgba(120,255,220,.25)';x.beginPath();x.arc(HX,HY,HERO.range,0,7);x.stroke();}
  if(IMG.hero_guard){
    if(walk&&Math.random()<.3)fx({k:'bub',x:HX-h.face*10+(Math.random()-.5)*6,y:HY+4,v:22+Math.random()*20,s:1+Math.random()*1.6,ph:Math.random()*6,life:.7});
    x.save();x.translate(X+h.face*sw*5,Y+14);x.scale(vf*(1+sl*.2),(1-sl*.26)*(1+(walk?0:Math.sin(time*2)*.012)));x.rotate((walk?.07:0)+sw*.2);drawImg(x,IMG.hero_guard,0,0,50);x.restore();
    if(at>0){x.strokeStyle=`rgba(170,245,255,${at})`;x.lineWidth=3*at+1;x.lineCap='round';x.beginPath();const c0=h.face>0?0:Math.PI;x.arc(X+h.face*6,Y-4,20+(1-at)*8,c0-1.1,c0+1.1);x.stroke();}
    x.fillStyle='#e8c45a';x.beginPath();x.arc(X-13,Y-26,6,0,7);x.fill();txt(x,''+h.lv,X-13,Y-26,8,'#3a2a00');return;}
  x.save();x.translate(X,Y);x.scale(h.face,1);
  x.fillStyle='#d8e0e8';rr(x,-8,4,6,9,2);x.fill();rr(x,2,4,6,9,2);x.fill();
  const gr=x.createLinearGradient(0,-14,0,6);gr.addColorStop(0,'#f4f8fc');gr.addColorStop(1,'#9aa8b8');x.fillStyle=gr;rr(x,-11,-12,22,18,6);x.fill();
  x.fillStyle='#e8c45a';rr(x,-11,-2,22,3,1);x.fill();
  x.fillStyle='#24323e';rr(x,-6,-22,16,12,5);x.fill();x.fillStyle='#6ff0ff';rr(x,-1,-19,10,5,2);x.fill();glow(x,4,-17,8,'rgba(110,240,255,.6)');
  x.fillStyle='#ff9a3c';x.beginPath();x.moveTo(-4,-22);x.lineTo(-1,-29);x.lineTo(2,-22);x.fill();
  x.save();x.translate(10,-4);x.rotate(h.atk>0?-.8*h.atk:.2);x.fillStyle='#8a96a8';rr(x,0,-2,16,4,2);x.fill();x.strokeStyle='#e8c45a';x.lineWidth=2.5;x.beginPath();x.arc(16,4,5,Math.PI*1.1,Math.PI*1.9+1);x.stroke();x.restore();
  x.fillStyle='#b8c4d0';x.beginPath();x.arc(-11,-6,5,0,7);x.fill();
  x.restore();
  x.fillStyle='#e8c45a';x.beginPath();x.arc(X-12,Y-24,6,0,7);x.fill();txt(x,''+h.lv,X-12,Y-24,8,'#3a2a00');
}
/* ---------- 효과 ---------- */
const FX=[];
function fx(o){FX.push(Object.assign({life:.5,t:0},o));if(FX.length>420)FX.splice(0,FX.length-420);}
function burst(X,Y,col,n,sp,size,life){for(let i=0;i<n;i++){const a=Math.random()*7,v=sp*(.4+Math.random()*.6);fx({k:'p',x:X,y:Y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-10,col,s:size*(.6+Math.random()*.6),life:life*(.6+Math.random()*.5)});}}
function drawFx(x,dt){
  for(const f of FX){f.t+=dt;const k=f.t/f.life;if(k>=1)continue;x.globalAlpha=1-k;
    switch(f.k){
      case'p':f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy-=12*dt;x.fillStyle=f.col;x.beginPath();x.arc(f.x,f.y,f.s*(1-k*.5),0,7);x.fill();break;
      case'bub':f.y-=f.v*dt;f.x+=Math.sin(f.t*5+f.ph)*.3;x.strokeStyle='rgba(200,250,255,.8)';x.lineWidth=1;x.beginPath();x.arc(f.x,f.y,f.s,0,7);x.stroke();break;
      case'ring':x.strokeStyle=f.col;x.lineWidth=f.w||3;x.beginPath();x.arc(f.x,f.y,f.r0+(f.r-f.r0)*Math.sqrt(k),0,7);x.stroke();break;
      case'txt':txt(x,f.s,f.x,f.y-k*22,f.size||11,f.col,'center','rgba(0,0,0,.7)');break;
      case'zap':x.strokeStyle='#fff6b0';x.lineWidth=2.2;x.beginPath();f.pts.forEach((p,i)=>{if(!i){x.moveTo(p[0],p[1]);return;}const q=f.pts[i-1];for(let j=1;j<=3;j++){const u=j/3;x.lineTo(q[0]+(p[0]-q[0])*u+(j<3?(Math.random()-.5)*10:0),q[1]+(p[1]-q[1])*u+(j<3?(Math.random()-.5)*10:0));}});x.stroke();
        x.strokeStyle='rgba(120,240,255,.5)';x.lineWidth=5;x.stroke();break;
      case'line':x.strokeStyle=f.col;x.lineWidth=(f.w||4)*(1-k);x.beginPath();x.moveTo(f.x,f.y);x.lineTo(f.x2,f.y2);x.stroke();break;
      case'ink':x.fillStyle='#1a0f2a';x.beginPath();x.arc(f.x+(f.tx-f.x)*k,f.y+(f.ty-f.y)*k-Math.sin(k*Math.PI)*30,5,0,7);x.fill();break;
      case'die':x.save();x.translate(f.x,f.y-k*16);x.scale(f.face*(1-k*.35),1-k*.35);x.rotate(k*1.1);{const hh=f.w*f.im.height/f.im.width;x.drawImage(f.im,-f.w/2,-hh/2,f.w,hh);}x.restore();break;
      case'coin':{const u=k*k*(3-2*k),cx=f.x+(f.tx-f.x)*u+Math.sin(k*Math.PI)*f.arc,cy=f.y+(f.ty-f.y)*u-Math.sin(k*Math.PI)*26;x.globalAlpha=1;x.fillStyle='#7ff';x.beginPath();x.moveTo(cx,cy-4.5);x.lineTo(cx+3.5,cy);x.lineTo(cx,cy+4.5);x.lineTo(cx-3.5,cy);x.closePath();x.fill();x.fillStyle='#fff';x.fillRect(cx-1,cy-2,1.4,1.4);if(k>.92&&!f.done){f.done=1;if(f.on)f.on();}}break;
      case'num':{const pop=k<.15?k/.15:1,sz=f.size*(.6+.4*pop)*(k<.15?1.25:1);x.globalAlpha=k<.6?1:1-(k-.6)/.4;txt(x,f.s,f.x+f.dx*k,f.y-18*k-8*Math.sin(Math.min(1,k*2)*Math.PI/2),sz,f.col,'center','rgba(0,0,0,.75)',900);}break;
      case'disc':x.fillStyle=f.col;x.globalAlpha=(1-k)*.6;x.beginPath();x.arc(f.x,f.y,f.r*(.4+.6*Math.sqrt(k)),0,7);x.fill();break;
      case'banner':{const a=k<.15?k/.15:k>.75?(1-k)/.25:1,yy=f.y-(1-Math.min(1,k/.15))*-14;x.globalAlpha=a;x.fillStyle='rgba(4,16,26,.72)';x.fillRect(0,yy-22,W,44);x.fillStyle=f.col;x.fillRect(0,yy-22,W,2);x.fillRect(0,yy+20,W,2);txt(x,f.s,W/2,yy+(f.s2?-5:1),f.size||22,'#fff','center','rgba(0,0,0,.6)',900);if(f.s2)txt(x,f.s2,W/2,yy+13,11,f.col);}break;
      case'flash':x.fillStyle=f.col;x.fillRect(0,0,W,H);break;
    }}
  x.globalAlpha=1;for(let i=FX.length-1;i>=0;i--)if(FX[i].t>=FX[i].life)FX.splice(i,1);
}
