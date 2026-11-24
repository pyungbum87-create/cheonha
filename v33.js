/* ============================================================================
   천하등용 v33 — 세로 화면 (2026-11-25)
   한국어(index.html)·중국어(zh.html) 공용. v32.js 다음에 불러온다.
   - 화면 360×750. 가로판의 전장(길 + 8×3 칸)을 그대로 세워 3×8 칸으로 둠.
     길 둘레·칸과 길 사이 거리가 가로판과 같아서 밸런스는 바뀌지 않는다.
   - 위: 라운드·초·금 / 성 밖 적·성벽 (오른쪽 위 배속·멈춤은 HTML)
   - 아래(엄지 영역): 장수 정보·인연 → 강화·명성 또는 합성·히든·판매 → 등용(큰 버튼)
   ========================================================================== */
(function(){
'use strict';
const ZH=document.documentElement.lang.startsWith('zh');
const T=(ko,zh)=>ZH?zh:ko;
const FB=ZH?'"Songti SC","STSong","Noto Serif SC"':'"Song Myung"';
const FS=ZH?'"PingFang SC","Hiragino Sans GB","Noto Sans SC"':'"Gowun Dodum"';
const L={top:50,panel:566,infoY:572,rowY:642,rowH:48,row2Y:694,botY:742};   // 아래 패널 배치
window.V33L=L;

/* ---------------- 배경 ---------------- */
window.buildBG=function(){const c=document.createElement('canvas');c.width=W*K;c.height=H*K;const g=c.getContext('2d');g.scale(K,K);
  const th=activeTheme();const lin=(y0,y1,st)=>{const q=g.createLinearGradient(0,y0,0,y1);st.forEach(([t,col])=>q.addColorStop(t,col));return q;};
  g.fillStyle=lin(0,H,[[0,'#3a4a44'],[.3,'#7a6a48'],[1,'#4a3622']]);g.fillRect(0,0,W,H);
  // 시나리오 풍경: 위쪽에 높이를 맞춰 잘라 넣음
  if(hdReady(th)){const im=HDART[th],h=150,w=h*im.width/im.height;g.save();g.globalAlpha=.95;g.drawImage(im,(W-w)/2,0,w,h);g.restore();}
  g.save();if(V30G.complete&&V30G.naturalWidth)g.fillStyle=g.createPattern(V30G,'repeat');else g.fillStyle='#8a6e46';
  g.fillRect(0,70,W,L.panel-70);g.restore();
  g.fillStyle=lin(62,100,[[0,'rgba(120,96,60,0)'],[1,'rgba(120,96,60,.55)']]);g.fillRect(0,62,W,38);
  g.fillStyle='rgba(60,40,20,.18)';g.fillRect(0,100,W,L.panel-100);
  // 길
  g.save();g.lineJoin='round';g.strokeStyle='rgba(40,26,14,.55)';g.lineWidth=36;g.strokeRect(PL,PT,PR-PL,PB-PT);
  g.strokeStyle='#9a7a4e';g.lineWidth=30;g.strokeRect(PL,PT,PR-PL,PB-PT);g.strokeStyle='#b48f5c';g.lineWidth=22;g.strokeRect(PL,PT,PR-PL,PB-PT);
  g.setLineDash([10,14]);g.strokeStyle='rgba(90,64,36,.45)';g.lineWidth=2;g.strokeRect(PL-6,PT-6,PR-PL+12,PB-PT+12);g.strokeRect(PL+6,PT+6,PR-PL-12,PB-PT-12);g.setLineDash([]);g.restore();
  let sd=7;const rnd=()=>((sd=(sd*16807)%2147483647)/2147483647);
  for(let i=0;i<80;i++){const t=rnd()*PER,[x,y]=roadPos(t),side=rnd()<.5?-1:1,[nx,ny]=roadNormal(x,y);const px=x+nx*side*(17+rnd()*5),py=y+ny*side*(17+rnd()*5);
    g.fillStyle=rnd()<.5?'#6e5a40':'#857052';g.beginPath();g.ellipse(px,py,2+rnd()*3,1.5+rnd()*2,0,0,TAU);g.fill();}
  // 적이 들어오는 성문
  {const [gx,gy]=roadPos(0);g.fillStyle='#4a3626';g.fillRect(gx-16,gy-26,32,22);g.fillStyle='#2a1c12';g.beginPath();g.arc(gx,gy-8,9,Math.PI,0);g.fill();g.fillRect(gx-9,gy-8,18,6);g.fillStyle='#c23a2a';g.fillRect(gx+10,gy-40,10,7);g.strokeStyle='#3a2716';g.lineWidth=1.5;g.beginPath();g.moveTo(gx+10,gy-26);g.lineTo(gx+10,gy-40);g.stroke();}
  // 칸
  for(let i=0;i<COLS*ROWS;i++){const [x,y]=slotXY(i);if(window.SDV&&SDV.pad(g,x,y,i))continue;g.fillStyle='rgba(40,26,14,.35)';rr(g,x-24,y-24,48,48,6);g.fill();g.strokeStyle='rgba(240,200,120,.35)';g.lineWidth=1;rr(g,x-24,y-24,48,48,6);g.stroke();}
  // 위 띠 · 아래 패널
  g.fillStyle=lin(0,L.top,[[0,'rgba(18,10,6,.96)'],[1,'rgba(18,10,6,.78)']]);g.fillRect(0,0,W,L.top);g.fillStyle='#d6a94a';g.fillRect(0,L.top,W,1);
  g.fillStyle=lin(L.panel,H,[[0,'rgba(30,18,10,.95)'],[1,'rgba(14,8,5,.98)']]);g.fillRect(0,L.panel,W,H-L.panel);g.fillStyle='#d6a94a';g.fillRect(0,L.panel,W,1.2);
  const v=g.createRadialGradient(W/2,320,140,W/2,320,440);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.3)');g.fillStyle=v;g.fillRect(0,0,W,L.panel);
  return c;};

/* ---------------- 위·아래 HUD ---------------- */
function upBtn(f,x,y,w,h){const c=upCost(f),dis=G.gold<c,id='up'+f;BTN.push({id,x,y,w,h});
  ctx.fillStyle=dis?'rgba(30,20,14,.92)':'rgba(48,28,18,.96)';rr(ctx,x,y,w,h,6);ctx.fill();ctx.strokeStyle=dis?'#5a4636':FAC[f].l;ctx.lineWidth=1.3;rr(ctx,x+.5,y+.5,w-1,h-1,6);ctx.stroke();
  if(G.pressId===id&&performance.now()-G.pressAt<160){ctx.fillStyle='rgba(255,240,200,.35)';rr(ctx,x,y,w,h,6);ctx.fill();}
  ctx.fillStyle=FAC[f].c;ctx.beginPath();ctx.arc(x+12,y+12,9,0,TAU);ctx.fill();txt(FAC[f].n[0],x+12,y+16,11,'#fff','center',FB,0);
  txt('+'+G.up[f]*12+'%',x+w-5,y+16,10,G.up[f]?FAC[f].l:'#8a7a66','right',FS,0);
  txt(T('강화 ','强化 ')+c,x+w/2,y+h-9,11,dis?'#7a6a56':'#f2c14e','center',FS,0);}
function chips(list,x0,y0,x1,maxRows){ctx.save();let x=x0,y=y0,row=0;ctx.font='10.5px '+FB;
  for(const s of list){const w=ctx.measureText(s).width+14;if(x+w>x1){x=x0;y+=21;row++;if(row>=maxRows){ctx.restore();return;}}
    ctx.fillStyle='rgba(20,10,6,.75)';rr(ctx,x,y,w,17,3);ctx.fill();ctx.strokeStyle='#d6a94a';ctx.lineWidth=.8;rr(ctx,x,y,w,17,3);ctx.stroke();txt(s,x+w/2,y+12.5,10.5,'#f2c14e','center',FB,0);x+=w+5;}
  ctx.restore();}
window.drawHUD=function(){
  const r=G.round;
  // 위 1줄: 라운드 · 남은 초 · 금 (오른쪽은 배속·멈춤 버튼 자리)
  txt(G.mode==='end'?T(`${r} 라운드`,`第${r}回合`):`${r} / ${G.last} `+T('라운드','回合'),8,20,14,G.mode==='daily'?'#9be0ff':G.scn?'#f2c14e':'#fff2d8','left',FB);
  txt(`${Math.max(0,Math.ceil(G.roundT))}`+T('초','秒'),96,20,12,'#b9a582','left',FS);
  txt(T('금 ','金 ')+G.gold,130,20,G.goldPulse>0?16:14,G.goldPulse>0?'#fff2a8':'#f2c14e','left',FS);
  // 위 2줄: 성 밖 적 · 성벽
  const n=G.enemies.length,bx=8,bw=250,by=36;ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(bx,by,bw,12);const p=Math.min(1,n/80);
  ctx.fillStyle=p>.8?(Math.sin(G.t*12)>0?'#ff3a2a':'#b8322a'):p>.55?'#e08a3a':'#8fb04a';ctx.fillRect(bx,by,bw*p,12);
  ctx.strokeStyle='#d6a94a';ctx.lineWidth=.8;ctx.strokeRect(bx,by,bw,12);
  txt(T(`성 밖 적 ${n} / 80`,`城外敌军 ${n} / 80`),bx+bw/2,by+9.5,10,'#fff2d8','center',FS,2);
  for(let i=0;i<Math.max(3,G.walls0||3);i++){const x=268+i*14;if(x>330)break;ctx.fillStyle=i<G.walls?'#c9a35a':'#3a2d24';ctx.fillRect(x,by,10,12);ctx.fillStyle=i<G.walls?'#8a6a34':'#2a2018';ctx.fillRect(x,by,10,3);ctx.fillRect(x+3,by+3,4,2);}
  txt(T('성벽','城墙'),352,by+10,10,'#b9a582','right',FS);
  // 아래 1단: 장수 정보 또는 인연
  const u=G.sel>=0?G.slots[G.sel]:null,mo=u?mergeOptions(G.sel):null,ho=u?hiddenOption(G.sel):null,Y=L.infoY;
  if(u){drawToken(ctx,u,30,Y+30,20,{});
    txt(u.d.n+(u.tr?' ✦'+u.tr:''),60,Y+16,15,'#fff2d8','left',FB,0);
    txt(FAC[u.d.f].n+' · '+GR[u.d.g].n+' · '+ROLE[u.role].n+' · '+WPN[u.wp],60,Y+33,11,GR[u.d.g].ring,'left',FS,0);
    let st=T('공격 ','攻击 ')+Math.round(u.atk)+' · '+T('간격 ','间隔 ')+u.int.toFixed(2)+T('초','秒')+' · '+T('사거리 ','射程 ')+Math.round(u.range);
    if(u.d.g>=1)st+=' · '+SKILL[u.role][Math.min(3,u.d.g)-1]+' '+Math.round(u.sint)+T('초','秒');
    txt(st,60,Y+50,10.5,'#d8c8a8','left',FS,0);
  }else{const on=Object.keys(G.synOn).map(k=>{const S=SYN.find(s=>s.id===k);return S?S.n:k;});
    txt(T('인연','缘分'),8,Y+12,12,'#f2c14e','left',FB,0);
    if(on.length)chips(on,44,Y,354,3);else txt(T('없음 · 같이 두면 강해지는 장수 조합이에요','暂无 · 一起上阵会变强的武将组合'),44,Y+12,10.5,'#8a7a66','left',FS,0);
    if(on.length<=8)txt(T('장수를 누르면 정보·합성·판매 · 끌어서 자리 이동','点击武将查看信息·合成·出售 · 拖动可换位'),W/2,Y+60,10.5,'#8a7a66','center',FS,0);}
  // 아래 2·3단: 선택했으면 합성·히든·판매, 아니면 세력 강화·명성
  const x0=8,x1=252;
  if(u){button('merge',x0,L.rowY,x1-x0,L.rowH,T('합성','合成'),mo?mergeLabel(mo):T('같은 장수 2 · 같은 세력 3 · 아무나 4','同武将2·同势力3·任意4'),{dis:!mo,hot:!!mo});
    const half=(x1-x0-6)/2;
    if(ho)button('hidden',x0,L.row2Y,half,L.rowH-2,T('히든 조합','隐藏组合'),UID[ho.R.out].n,{hot:true,col:'#ff5a3a'});
    button('sell',ho?x0+half+6:x0,L.row2Y,ho?half:x1-x0,L.rowH-2,(G.sellArm===G.sel&&performance.now()-G.sellAt<2500)?T('정말 판매?','确认出售?'):T('판매 +','出售 +')+sellValue(u),'',{col:'#9a8a70'});
  }else{const fs=G.onlyF!=null?[G.onlyF]:[0,1,2,3],w=(x1-x0-(fs.length-1)*4)/fs.length;
    fs.forEach((f,k)=>upBtn(f,x0+k*(w+4),L.rowY,w,L.rowH));
    const fc=fameCost();button('fame',x0,L.row2Y,x1-x0,L.rowH-2,T('명성 ','名声 ')+G.fame+T('단계','级'),G.round<5?T('5라운드부터 · 좋은 장수가 더 잘 나와요','第5回合起 · 更容易出好武将'):fc==null?T('최고 단계','最高级'):fc+T('금','金'),{dis:G.round<5||fc==null||G.gold<fc,col:'#f2c14e'});}
  // 등용: 오른쪽 아래 큰 버튼
  button('recruit',258,L.rowY,96,L.botY-L.rowY,T('등용','招募'),T('30금','30金'),{hot:G.gold>=30,dis:G.gold<30});
};
/* 버튼 글자를 세로 화면 크기에 맞춤 (큰 버튼은 조금 크게) */
window.button=(o=>function(id,x,y,w,h,label,sub,opt){if(h<60)return o.apply(this,arguments);
  o.call(this,id,x,y,w,h,'','',opt);txt(label,x+w/2,y+h/2+2,20,opt&&opt.dis?'#9c8774':'#fff2d8','center',FB,0);if(sub)txt(sub,x+w/2,y+h/2+22,12,opt&&opt.dis?'#7a6a56':'#f2c14e','center',FS,0);})(button);

/* ---------------- 튜토리얼 위치 · 돌려 달라는 안내 ---------------- */
if(window.__v31&&__v31.TUT){const t=__v31.TUT;t[0].x=306;t[0].y=(L.rowY+L.botY)/2;t[0].r=52;t[1].x=130;t[1].y=L.rowY+L.rowH/2;t[1].r=40;}
{const r=document.getElementById('rot');if(r)r.innerHTML=`<b>${T('세로로 돌려 주세요','请竖屏游玩')}</b><span>${T('천하등용은 세로 화면에서 플레이합니다','天下登用为竖屏游戏')}</span>`;}
{const st=document.createElement('style');st.textContent='#ctl button{min-width:50px!important;height:28px!important;font-size:13px!important;padding:0 8px!important}';document.head.append(st);}
try{bgCache=null;resize();}catch(e){}
window.__v33={L};
})();
