/* ============================== 전투 화면: 규칙(core.js)이 알려 준 일을 그림·소리·진동으로 바꾼다 ============================== */
const HN={tt:['퇀퇀','团团'],didi:['방울이','滴滴'],peng:['펑펑','砰砰'],shan:['반짝','闪闪'],dun:['둥둥','墩墩'],zhuo:['쫑쫑','啄啄']};
const HCOL={tt:'#ffb199',didi:'#9fd8ff',peng:'#ffcf7a',shan:'#ffe08a',dun:'#bfe6c8',zhuo:'#e6c8a8'};
const ULTN={tt:['찜통 김 폭발!','蒸笼大喷气！'],didi:['소나기!','及时雨！'],peng:['불꽃 축제!','烟花庆典！'],shan:['달빛!','月光！'],dun:['스매시!','大力扣杀！'],zhuo:['특급 배달!','特快专递！']};
const CT={dmg:['위력 +30%','威力 +30%'],spd:['공격 속도 +15%','攻速 +15%'],aoe:['범위 +25%','范围 +25%'],two:['한 번에 하나 더 발사','每次多发射 1 个'],bnc:['튀는 횟수 +1','弹跳次数 +1'],
  hot:['맞은 적이 느려져요','命中的敌人减速'],big:['큰 적에게 피해 +40%','对大怪伤害 +40%'],slw:['느려지는 시간 +1.2초','减速时间 +1.2 秒'],
  all_spd:['모두 공격 속도 +8%','全员攻速 +8%'],all_crit:['모두 치명타 확률 +8%','全员暴击率 +8%'],all_ult:['필살기 충전 +20%','必杀充能 +20%'],all_wall:['방파제 수리 +25','修复沙堡 +25']};
const rnd=(a,b)=>a+Math.random()*(b-a);
let run=null,B=null,paused=false,speed=1;

function startBattle(si){
  S.sel=si;run=newRun((Date.now()%2147483000)|0,S.team,{stage:si,lv:S.lv});
  B={parts:[],nums:[],fly:[],rings:[],beams:[],anim:[0,1,2,3,4].map(()=>({shoot:0})),shake:0,tide:0,banner:null,cut:null,drag:null,endT:-1,cardT:0,tip:null,steam:0,moon:0,wallHit:0,time:0,adReroll:0,bossIn:0};
  paused=false;speed=S.opt.fast?2:1;scr='battle';wantMusic('bgm-play');S.stat.runs++;mission('run',1);track('stage_start',{stage:si+1});
  tip('start',L('영웅들이 알아서 공격해요. 모래성 방파제를 지켜요!','伙伴们会自动攻击，守住沙堡防线！'));persist();
}
function tip(key,text,sec){if(S.tips[key]||!B)return;S.tips[key]=1;B.tip={text,t:sec||5};}
function banner(text,big,col){B.banner={text,t:0,big:!!big,col:col||'#fff'};}
function shake(n){B.shake=Math.max(B.shake,n);}
function burst(x,y,n,col,sp,r){for(let i=0;i<n&&B.parts.length<320;i++){const a=Math.random()*6.283,v=rnd(.5,1)*(sp||2.5);B.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1,gr:.08,life:rnd(18,34),t:0,r:rnd(.6,1)*(r||3),col:Array.isArray(col)?col[i%col.length]:col});}}
function coinPop(x,y,n){for(let i=0;i<n&&B.parts.length<340;i++)B.parts.push({x,y,vx:rnd(-2,2),vy:rnd(-4,-2),gr:0,life:46,t:0,r:5,coin:1,delay:i*3});}
const FW_COL=['#ff6b6b','#ffd93d','#6bcbff','#ff9ff3','#8ce99a'];

function consumeFx(){
  for(const f of run.fx){switch(f.e){
    case 'hit':if(B.nums.length<36)B.nums.push({x:f.x+rnd(-8,8),y:f.y,v:f.v,crit:f.crit,weak:f.weak,t:0});sfx('hit');break;
    case 'die':{const boss=f.k==='boss';B.fly.push({k:boss?f.bk:f.k,x:f.x,y:f.y,vx:rnd(-1.6,1.6),vy:rnd(-11,-8),rot:0,vr:rnd(-.25,.25),t:0,r:ENEMIES[f.k].r});burst(f.x,f.y,boss?30:5,'#fff',boss?5:2.5);sfx('pop');
      if(f.k!=='crab'&&f.k!=='jelly'||Math.random()<.3)coinPop(f.x,f.y,boss?12:f.k==='elite'?5:1);if(boss){shake(10);vib(60);}break;}
    case 'pong':burst(f.x,f.y,7,'#f3c97a',2.5);break;
    case 'blast':B.rings.push({x:f.x,y:f.y,r:f.r,kind:f.kind,t:0});
      if(f.kind==='fw'){burst(f.x,f.y,12,FW_COL,4,3.5);sfx('boom');}else if(f.kind==='bun'){burst(f.x,f.y,7,'#fff',2.5,4);sfx('boom');}else if(f.kind==='smash'){burst(f.x,f.y,20,['#ffe066','#fff'],5,4);sfx('boom');shake(8);vib(40);}else{burst(f.x,f.y,6,['#fff','#ffb3c1'],2,3);sfx('splash');}break;
    case 'splash':burst(f.x,f.y,4,'#bfe8ff',2,2.5);sfx('splash');break;
    case 'pingpong':burst(f.x,f.y,4,'#fff',2.5,2.5);sfx('hit');break;
    case 'beam':B.beams.push({x:f.x,w:f.w,t:0});sfx('beam');break;
    case 'shoot':B.anim[f.slot].shoot=10;sfx('shoot',HERO_IDS.indexOf(f.id));break;
    case 'wave':if(f.boss){banner(L('보스 등장!','BOSS 来了！'),1,'#ffd93d');sfx('boss');wantMusic('bgm-play');}else if(f.surge){banner(L('큰 파도가 와요!','大浪来了！'),1,'#bfe8ff');}else banner(L('파도 ','第 ')+f.w+L('',' 波'));sfx('wave');break;
    case 'surge':sfx('surge');shake(5);vib(30);break;
    case 'ebb':tip('shell',L('물이 빠졌어요! 조개를 눌러 주워요','退潮啦！点一点捡贝壳'));break;
    case 'gap':if(run.wave>=2&&f.focus!=='C')tip('swap',L('빨간 화살표 쪽으로 몰려와요. 영웅을 끌어 자리를 바꿔 봐요','敌人会从红箭头那边来，拖动伙伴换位置吧'),6);break;
    case 'card':B.cardT=0;sfx('card');break;
    case 'picked':sfx('pick');mission('card',1);break;
    case 'awake':banner(LL(HN[f.id])+L(' 각성!',' 觉醒！'),1,'#ffd93d');sfx('awake');burst(SLOTS[f.slot],HERO_Y,26,['#ffd93d','#fff'],5,4);vib(50);break;
    case 'cut':B.cut={id:f.id,t:0};sfx('ult');vib(40);S.tips.ultUsed=1;mission('ult',1);break;
    case 'steam':B.steam=34;shake(7);break;
    case 'moon':B.moon=70;break;
    case 'post':for(let i=0;i<14;i++)B.parts.push({x:rnd(20,430),y:rnd(-40,0),vx:rnd(-.5,.5),vy:rnd(5,8),gr:0,life:70,t:0,r:6,mail:1});break;
    case 'rain':B.parts.push({x:f.x+10,y:f.y-60,vx:-1.6,vy:10,gr:0,life:6,t:0,r:2.5,col:'#bfe8ff',streak:1});break;
    case 'ink':sfx('ink');tip('ink',L('먹물이다! 영웅을 눌러 닦아 줘요','被墨汁喷到了！点一下伙伴擦干净'),6);break;
    case 'inkClear':sfx('clear');burst(SLOTS[f.slot],HERO_Y-10,8,'#4a3a6a',3,3);break;
    case 'summon':burst(f.x,f.y,10,'#fff',3);break;
    case 'wall':B.wallHit=12;sfx('wall');shake(3);vib(20);if(B.nums.length<40)B.nums.push({x:f.x,y:WALL_Y-8,v:-f.d,wall:1,t:0});break;
    case 'down':sfx('over');break;
    case 'revive':sfx('reward');burst(225,WALL_Y,30,['#ffd93d','#fff'],6,4);break;
    case 'win':sfx('win');B.endT=2;for(let i=0;i<50;i++)B.parts.push({x:rnd(0,450),y:rnd(-200,0),vx:rnd(-1,1),vy:rnd(2,5),gr:0,life:110,t:0,r:rnd(3,5),col:FW_COL[i%5]});break;
    case 'lose':B.endT=1.2;break;
    case 'shell':coinPop(f.x,f.y,3);sfx('coin');mission('shell',1);break;
    case 'box':sfx('reward');burst(f.x,f.y,14,['#ffd93d','#ff6b6b'],4,3.5);break;
    case 'ultReady':sfx('ready');tip('ult',L('반짝이는 영웅을 누르면 필살기!','点一下发光的伙伴，放必杀技！'),6);break;
    case 'boss':B.bossIn=90;break;
  }}
  run.fx.length=0;
}

function battleTick(dt){
  B.time+=dt;if(B.tip&&(B.tip.t-=dt)<=0)B.tip=null;
  if(B.banner&&(B.banner.t+=dt)>1.7)B.banner=null;
  if(B.cut&&(B.cut.t+=dt)>.8)B.cut=null;
  if(run.phase==='card')B.cardT+=dt;
  if(paused||adOv)return;
  advance(run,dt*speed);consumeFx();
  const f=Math.min(3,dt*60);
  B.shake*=Math.pow(.86,f);B.tide+=((run.surge>0?1:0)-B.tide)*Math.min(1,.06*f);
  if(B.steam>0)B.steam-=f;if(B.moon>0)B.moon-=f;if(B.wallHit>0)B.wallHit-=f;if(B.bossIn>0)B.bossIn-=f;
  for(const a of B.anim)if(a.shoot>0)a.shoot-=f;
  for(const p of B.parts){if(p.delay>0){p.delay-=f;continue;}p.t+=f;
    if(p.coin&&p.t>12){const dx=W-52-p.x,dy=28-p.y,d=Math.hypot(dx,dy)||1,v=Math.min(d,14*f);p.x+=dx/d*v;p.y+=dy/d*v;if(d<16)p.t=p.life;}
    else{p.x+=p.vx*f;p.y+=p.vy*f;p.vy+=p.gr*f;}}
  B.parts=B.parts.filter(p=>p.t<p.life);
  for(const n of B.nums)n.t+=f;B.nums=B.nums.filter(n=>n.t<38);
  for(const r of B.rings)r.t+=f;B.rings=B.rings.filter(r=>r.t<18);
  for(const b of B.beams)b.t+=f;B.beams=B.beams.filter(b=>b.t<14);
  for(const o of B.fly){o.t+=f;o.x+=o.vx*f;o.y+=o.vy*f;o.vy*=Math.pow(.97,f);o.rot+=o.vr*f;}
  B.fly=B.fly.filter(o=>{if(o.t<34&&o.y>-40)return true;if(o.y>-30)burst(o.x,o.y,4,'#e8f8ff',2,3);return false;});
  if(run.ended&&B.endT>=0&&(B.endT-=dt)<0){B.endT=-1;endBattle();}
}

/* ---------- 그리기 (전투 좌표 450×800 을 K배) ---------- */
function drawTide(){
  const t=B.time,shore=432+B.tide*100;
  g.fillStyle='rgba(120,208,236,.88)';g.beginPath();g.moveTo(0,400);g.lineTo(W,400);g.lineTo(W,shore);for(let x=W;x>=0;x-=30)g.lineTo(x,shore+Math.sin(x*.045+t*2.2)*5+Math.sin(x*.02-t*1.3)*4);g.closePath();g.fill();
  g.strokeStyle='rgba(255,255,255,.9)';g.lineWidth=4;g.lineCap='round';g.beginPath();for(let x=0;x<=W;x+=30){const y=shore+Math.sin(x*.045+t*2.2)*5+Math.sin(x*.02-t*1.3)*4;if(x)g.lineTo(x,y);else g.moveTo(x,y);}g.stroke();
  g.strokeStyle='rgba(255,255,255,.4)';g.lineWidth=3;for(let i=0;i<3;i++){const y=90+i*120+Math.sin(t*.9+i)*10;g.beginPath();for(let x=0;x<=W;x+=30){const yy=y+Math.sin(x*.03+t*1.5+i*2)*6;if(x)g.lineTo(x,yy);else g.moveTo(x,yy);}g.stroke();}
}
function drawWall(){
  const hp=run.wall/run.wallMax,fl=B.wallHit>0;
  g.lineJoin='round';g.lineWidth=2.6;g.strokeStyle=INK;g.fillStyle=fl?'#fff1cf':hp>.5?'#f3c97a':hp>.25?'#e9b765':'#dda253';
  g.beginPath();g.moveTo(-4,632);g.lineTo(-4,594);for(let x=0;x<W;x+=30){g.lineTo(x,594);g.lineTo(x,586);g.lineTo(x+16,586);g.lineTo(x+16,594);}g.lineTo(W+4,594);g.lineTo(W+4,632);g.closePath();g.fill();g.stroke();
  g.strokeStyle='rgba(150,100,50,.45)';g.lineWidth=1.6;for(let x=20;x<W;x+=46){g.beginPath();g.arc(x,632,12,3.1416,0);g.stroke();}
  if(hp<.6){g.strokeStyle='rgba(90,54,32,.6)';g.lineWidth=1.8;const n=hp<.3?7:4;for(let i=0;i<n;i++){const x=30+i*61;g.beginPath();g.moveTo(x,596);g.lineTo(x+6,606);g.lineTo(x-2,614);g.lineTo(x+5,626);g.stroke();}}
  for(const x of [14,W-14]){g.fillStyle=fl?'#fff1cf':'#f3c97a';g.strokeStyle=INK;g.lineWidth=2.6;rr(x-13,574,26,58,4);g.fill();g.stroke();g.beginPath();g.moveTo(x,574);g.lineTo(x,552);g.stroke();g.fillStyle=RED;g.beginPath();g.moveTo(x,552);g.lineTo(x+15+Math.sin(B.time*5)*2,558);g.lineTo(x,564);g.closePath();g.fill();g.stroke();}
}
function drawEnemies(){
  const es=run.en.slice().sort((a,b)=>a.y-b.y),t=run.t;
  for(const e of es){const k=sprKey(e),size=e.r*3.4*(e.puff>0?1.3:1),bob=1+Math.sin(t*.2+e.ph)*.05;let y=e.y+e.r*.2;
    if(e.k==='fish')y-=Math.abs(Math.sin(t*.16+e.ph))*12;const jx=e.st==='chew'?Math.sin(t*.9)*1.5:0;
    g.fillStyle='rgba(60,40,20,.16)';g.beginPath();g.ellipse(e.x,e.y+e.r*.85,e.r*.9,e.r*.3,0,0,6.2832);g.fill();
    if(e.slow>0){g.fillStyle='rgba(120,200,255,.4)';g.beginPath();g.ellipse(e.x,e.y+e.r*.85,e.r*1.15,e.r*.42,0,0,6.2832);g.fill();}
    drawSpr(k,e.x+jx,y,size,{sx:bob,sy:2-bob});
    if(e.hit>0)drawSpr(k,e.x+jx,y,size,{sx:bob,sy:2-bob,white:1,a:e.hit/8*.75});
    if(e.stun>0)txt('z',e.x+e.r*.7,e.y-e.r-4+Math.sin(t*.2)*3,13,'#fff','center',INK,3);
    if(e.k==='elite'||(e.k!=='boss'&&e.hp<e.max*.999&&e.max>60)){const w=e.r*1.7;g.fillStyle='rgba(90,54,32,.6)';rr(e.x-w/2,e.y-e.r-12,w,6,3);g.fill();g.fillStyle='#ff6b6b';rr(e.x-w/2,e.y-e.r-12,w*Math.max(0,e.hp/e.max),6,3);g.fill();}
  }
  for(const o of B.fly){const q=o.t/34;drawSpr(o.k,o.x,o.y,o.r*3.4*(1-q*.6),{rot:o.rot,a:1-q*.5});}
}
function drawLoot(){
  for(const l of run.loot){const age=(run.t-l.born)/60,pop=Math.min(1,age*4),bob=Math.sin(B.time*4+l.id)*2,blink=l.life<90&&Math.floor(l.life/8)%2;if(blink)continue;
    if(l.k==='shell')drawImg('shell',l.x,l.y+12+bob,26*pop);else{g.fillStyle='rgba(255,217,61,.35)';circ(l.x,l.y,24+Math.sin(B.time*5)*3);g.fill();drawImg('gift',l.x,l.y+18+bob,38*pop);}}
}
function drawProj(){
  for(const p of run.pr){
    if(p.k==='fw'){const q=p.t/p.T,y=p.y-Math.sin(q*3.1416)*90;g.fillStyle='#ffd93d';circ(p.x,y,4);g.fill();g.fillStyle='rgba(255,150,80,.6)';circ(p.x,y+7,3);g.fill();circ(p.x,y+13,2);g.fill();}
    else if(p.k==='bun'){g.fillStyle='#fff';g.strokeStyle=INK;g.lineWidth=2;circ(p.x,p.y,7.5);g.fill();g.stroke();g.beginPath();g.arc(p.x,p.y-1,3,3.6,5.8);g.stroke();}
    else if(p.k==='drop'){g.fillStyle='#8fd4ff';g.strokeStyle='#3d8fd0';g.lineWidth=1.6;circ(p.x,p.y,5.5);g.fill();g.stroke();g.fillStyle='#fff';circ(p.x-1.6,p.y-1.6,1.6);g.fill();}
    else if(p.k==='ball'){g.fillStyle='#fff';g.strokeStyle='#ff9f43';g.lineWidth=2;circ(p.x,p.y,5.5);g.fill();g.stroke();}
    else{g.save();g.translate(p.x,p.y);g.rotate(p.t*.2);g.fillStyle='#fff';g.strokeStyle=INK;g.lineWidth=1.8;rr(-9,-6,18,12,2);g.fill();g.stroke();g.fillStyle=RED;circ(0,0,2.6);g.fill();g.restore();}
  }
}
function drawHeroes(){
  const t=B.time;
  for(let i=0;i<5;i++){const x=SLOTS[i],h=run.heroes[i],by=HERO_Y+38;
    g.fillStyle='rgba(90,54,32,.16)';g.beginPath();g.ellipse(x,by,36,11,0,0,6.2832);g.fill();
    if(B.drag&&PTR.moved&&dragSlot()===i){g.strokeStyle='#ffd93d';g.lineWidth=4;g.beginPath();g.ellipse(x,by,40,13,0,0,6.2832);g.stroke();}
    if(!h)continue;const dragging=B.drag&&B.drag.slot===i&&PTR.moved,ready=h.ult>=1&&h.ink<=0;
    if(h.awake){g.fillStyle='rgba(255,217,61,'+(.28+Math.sin(t*4)*.08)+')';g.beginPath();g.ellipse(x,by-40,46,52,0,0,6.2832);g.fill();}
    if(ready){const pu=.5+Math.sin(t*7)*.5;g.strokeStyle='rgba(255,196,0,'+(.55+pu*.4)+')';g.lineWidth=4+pu*2;g.beginPath();g.ellipse(x,by,40+pu*4,13+pu*2,0,0,6.2832);g.stroke();}
    const a=B.anim[i],st=a.shoot>0?a.shoot/10:0,br=Math.sin(t*3+i)*.025;
    if(dragging)drawImg(HERO_IMG[h.id],PTR.x/K,PTR.y/K+40,92,{a:.85});
    drawImg(HERO_IMG[h.id],x,by-st*6,88,{sx:1+br-st*.08,sy:1-br+st*.12,a:dragging?.35:1});
    if(h.ink>0){g.fillStyle='rgba(50,38,80,.86)';circ(x-6,by-50,24);g.fill();circ(x+14,by-34,17);g.fill();circ(x-16,by-28,12);g.fill();icoHand(x+16,by-6,t,.55);}
    // 필살기 게이지와 카드 점
    const gw=62;g.fillStyle='rgba(90,54,32,.5)';rr(x-gw/2,by+12,gw,8,4);g.fill();g.fillStyle=ready?'#ffc400':'#ffe08a';rr(x-gw/2+1,by+13,(gw-2)*h.ult,6,3);g.fill();
    if(h.awake)icoStarS(x,by+30,7);else for(let p=0;p<AWAKEN_AT;p++){g.fillStyle=p<h.pips?'#ff8a3d':'rgba(90,54,32,.25)';circ(x-((AWAKEN_AT-1)*5)+p*10,by+29,3.2);g.fill();}
    if(ready){const bo=Math.abs(Math.sin(t*5))*6;g.fillStyle='#ffc400';g.strokeStyle=INK;g.lineWidth=2;rr(x-15,by-112-bo,30,22,8);g.fill();g.stroke();txt('!',x,by-100-bo,16,INK);}
  }
  if(!S.tips.ultUsed&&run.phase==='run'){const h=run.heroes.find(h=>h&&h.ult>=1&&h.ink<=0);if(h)icoHand(SLOTS[h.slot]+16,HERO_Y+10,t,.6);}
}
function icoStarS(x,y,r){g.save();g.lineWidth=1.6;g.beginPath();for(let i=0;i<10;i++){const a=-1.5708+i*.6283,q=i%2?r*.48:r;g.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q);}g.closePath();g.fillStyle=YEL;g.fill();g.strokeStyle=INK;g.stroke();g.restore();}
function drawFx(){
  for(const b of B.beams){const a=1-b.t/14,gr=g.createLinearGradient(b.x-b.w,0,b.x+b.w,0);gr.addColorStop(0,'rgba(255,224,138,0)');gr.addColorStop(.5,'rgba(255,246,200,'+(.85*a)+')');gr.addColorStop(1,'rgba(255,224,138,0)');g.fillStyle=gr;g.fillRect(b.x-b.w,0,b.w*2,HERO_Y-40);}
  for(const r of B.rings){const q=r.t/18,rad=r.r*(.45+.55*Math.min(1,q*1.6)),col=r.kind==='fw'?'255,170,80':r.kind==='smash'?'255,224,102':r.kind==='mail'?'255,190,205':'255,255,255';
    g.fillStyle='rgba('+col+','+(.38*(1-q))+')';circ(r.x,r.y,rad);g.fill();g.strokeStyle='rgba('+col+','+(.9*(1-q))+')';g.lineWidth=3;g.stroke();}
  if(B.steam>0){const q=1-B.steam/34,y=600-q*340;const gr=g.createLinearGradient(0,y-70,0,y+70);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.5,'rgba(255,255,255,'+(.8*(1-q))+')');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,y-70,W,140);}
  if(run.heroes.some(h=>h&&h.rain>0)){g.strokeStyle='rgba(190,232,255,.55)';g.lineWidth=2;g.beginPath();for(let i=0;i<26;i++){const x=Math.random()*W+30,y=Math.random()*580;g.moveTo(x,y);g.lineTo(x-6,y+26);}g.stroke();}
  if(B.moon>0||run.buff>0){const a=Math.max(B.moon/70,run.buff>0?.25:0);g.fillStyle='rgba(255,244,190,'+(.2*a)+')';g.fillRect(0,0,W,H);g.fillStyle='rgba(255,246,200,'+(.9*a)+')';circ(380,70,34);g.fill();}
  for(const p of B.parts){if(p.delay>0)continue;const a=Math.min(1,(p.life-p.t)/10);
    if(p.coin){g.globalAlpha=a;icoCoin(p.x,p.y,p.r);g.globalAlpha=1;}
    else if(p.mail){g.save();g.translate(p.x,p.y);g.rotate(p.t*.15);g.fillStyle='#fff';g.strokeStyle=INK;g.lineWidth=1.6;rr(-9,-6,18,12,2);g.fill();g.stroke();g.fillStyle=RED;circ(0,0,2.4);g.fill();g.restore();}
    else if(p.streak){g.strokeStyle=p.col;g.lineWidth=2.5;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(p.x+p.vx*2,p.y+p.vy*2);g.stroke();}
    else{g.globalAlpha=a;g.fillStyle=p.col;circ(p.x,p.y,p.r);g.fill();g.globalAlpha=1;}}
  for(const n of B.nums){const a=Math.min(1,(38-n.t)/12),y=n.y-n.t*.9;g.globalAlpha=a;
    if(n.wall)txt(n.v,n.x,y,15,'#ff5a4a','center','#fff',3);else txt(n.v,n.x,y,n.crit?19:n.weak?15:12,n.crit?'#ffd93d':n.weak?'#ff9f43':'#fff','center',INK,n.crit?4:3);g.globalAlpha=1;}
  // 다음 파도가 몰려올 쪽
  if(run.ws==='gap'&&run.next&&run.phase==='run'){const f=run.next.focus,xs=f==='A'?[95,225,355]:[FOCUS_X[f]],bo=Math.abs(Math.sin(B.time*5))*8;
    for(const x of xs){g.fillStyle='#ff5a4a';g.strokeStyle='#fff';g.lineWidth=3;g.lineJoin='round';g.beginPath();g.moveTo(x-16,150+bo);g.lineTo(x+16,150+bo);g.lineTo(x,174+bo);g.closePath();g.fill();g.stroke();}
    if(run.next.boss||run.next.elite)txt(run.next.boss?'BOSS':L('정예','精英'),225,128,15,'#ff5a4a','center','#fff',4);}
}
function dragSlot(){const lx=PTR.x/K;let b=0;for(let i=1;i<5;i++)if(Math.abs(SLOTS[i]-lx)<Math.abs(SLOTS[b]-lx))b=i;return b;}

function drawHud(){
  // 위쪽: 일시정지 · 파도 · 방파제 · 동전
  btn(18,22,82,78,'',()=>{paused=true;sfx('btn');},{col:CREAM,dk:'#d9c8a8',icon:(x,y)=>{g.fillStyle=INK;rr(x-15,y-17,11,34,4);g.fill();rr(x+4,y-17,11,34,4);g.fill();}});
  panel(114,24,150,70,CREAM,22);txt(Math.min(run.S.waves,Math.max(1,run.wave))+' / '+run.S.waves,189,50,30,INK);txt(L('파도','波次'),189,79,17,'#a07a55');
  const hp=run.wall/run.wallMax;bar(318,36,250,46,hp,hp>.5?MINT:hp>.25?YEL:RED);icoCastle(304,60,22);txt(Math.ceil(run.wall),443,60,26,'#fff','center',INK);
  panel(590,24,142,70,CREAM,22);icoCoin(620,59,18);txtFit(Math.round(run.coins*run.coinMul),682,60,28,80,INK);
  bar(18,112,VW-36,24,run.xp/run.need,'#7ad0ff');txt('Lv.'+run.lv,60,124,17,'#fff','center',INK,4);
  if(run.boss&&!run.boss.dead){bar(120,150,510,34,run.boss.hp/run.boss.max,'#ff6b6b');txt('BOSS',375,167,20,'#fff','center',INK,4);}
  btn(650,150,82,64,speed>1?'x2':'x1',()=>{speed=speed>1?1:2;S.opt.fast=speed>1?1:0;sfx('btn');},{col:speed>1?YEL:CREAM,dk:speed>1?YEL_D:'#d9c8a8',tc:INK,sz:28});
  if(B.banner){const b=B.banner,q=Math.min(1,b.t*5),o=b.t>1.4?(1.7-b.t)/.3:1;g.globalAlpha=Math.max(0,o);txt(b.text,375,330-(1-q)*30,b.big?70:50,b.col,'center',INK,b.big?16:12);g.globalAlpha=1;}
  if(B.tip){panel(24,1196,702,104,'#fffdf3',30);drawImg('tuantuan',84,1296,104);font(27);g.textAlign='left';wrap(B.tip.text,150,B.tip.text.length>24?1232:1248,27,550,34,INK,'left',2);}
  else if(run.bonds.length){const names={wall:L('먹보 두목: 방파제 +20','吃货搭档：沙堡 +20'),ult:L('무지개: 필살기 충전 +15%','彩虹：必杀充能 +15%'),coin:L('설날 편지: 동전 +20%','新年来信：金币 +20%')};txt(run.bonds.map(b=>names[b]).join('  ·  '),375,1290,20,'#a07a55');}
}
function drawCut(){
  const c=B.cut,q=Math.min(1,c.t*6),o=c.t>.6?(.8-c.t)/.2:1;g.globalAlpha=Math.max(0,o);
  g.fillStyle='rgba(40,24,12,.45)';g.fillRect(0,0,VW,VH);g.fillStyle=HCOL[c.id];g.save();g.translate(375,640);g.rotate(-.08);g.fillRect(-500,-150*q,1000,300*q);g.strokeStyle=INK;g.lineWidth=6;g.strokeRect(-500,-150*q,1000,300*q);g.restore();
  drawImg(HERO_IMG[c.id],-200+q*400,840,420);txt(LL(ULTN[c.id]),500-(1-q)*200,640,60,'#fff','center',INK,14);g.globalAlpha=1;
}
function drawCards(){
  g.fillStyle='rgba(40,24,12,.6)';g.fillRect(0,0,VW,VH);BT.length=0;
  txt(L('카드를 골라요!','选一张卡牌！'),375,290,58,'#fff','center',INK,14);txt('Lv.'+run.lv,375,348,26,'#ffd93d','center',INK,6);
  const ok=B.cardT>.35,n=run.offer.length,w=222,gap=14,x0=(VW-(n*w+(n-1)*gap))/2;
  run.offer.forEach((c,i)=>{const x=x0+i*(w+gap),y=392-Math.max(0,(.3-B.cardT+i*.06))*200,h=c.hero?run.heroes.find(q=>q&&q.id===c.hero):null;
    panel(x,y,w,430,CREAM,26);g.fillStyle=c.hero?HCOL[c.hero]:'#cfe9ff';rr(x+10,y+10,w-20,170,18);g.fill();
    if(c.hero)drawImg(HERO_IMG[c.hero],x+w/2,y+176,156);else if(c.t==='all_wall')icoCastle(x+w/2,y+100,46);else icoStar(x+w/2,y+96,52,1);
    txt(c.hero?LL(HN[c.hero]):L('모두','全员'),x+w/2,y+214,30,c.hero?RED_D:'#3d7fb8');
    font(27);wrap(LL(CT[c.t]),x+w/2,y+268,27,w-30,36,INK,'center',3);
    if(h){if(h.awake)txt(L('각성 완료','已觉醒'),x+w/2,y+392,22,'#d99a1e');else{const will=h.pips+1>=AWAKEN_AT;for(let p=0;p<AWAKEN_AT;p++){g.fillStyle=p<h.pips?'#ff8a3d':p===h.pips?'#ffd0a8':'rgba(90,54,32,.2)';circ(x+w/2-((AWAKEN_AT-1)*13)+p*26,y+366,9);g.fill();}
        txt(will?L('고르면 각성!','选它就觉醒！'):L('각성까지 ','离觉醒还差 ')+(AWAKEN_AT-h.pips)+L('장',' 张'),x+w/2,y+400,20,will?RED:'#a07a55');}}
    else txt((run.taken[c.id]||0)+' / '+c.max,x+w/2,y+392,22,'#a07a55');
    if(ok)zone(x,y,w,430,()=>{sfx('btn');pickCard(run,i);});});
  if(run.rerolls>0)btn(215,860,320,84,L('다시 뽑기 (무료 1번)','换一批（免费 1 次）'),()=>{sfx('btn');reroll(run);B.cardT=.2;},{col:MINT,dk:MINT_D,sz:28});
  else if(B.adReroll<2)btn(195,860,360,84,L('▶ 광고 보고 다시 뽑기','▶ 看广告换一批'),()=>showAd('reroll',o=>{if(o){reroll(run,true);B.adReroll++;B.cardT=.2;}}),{col:YEL,dk:YEL_D,tc:INK,sz:28});
  txt(L('같은 영웅 카드 4장이면 각성해서 공격이 바뀌어요','同一伙伴集齐 4 张卡就会觉醒，攻击方式大变'),375,990,22,'#fff','center',INK,5);
}
function drawRevive(){
  g.fillStyle='rgba(40,24,12,.6)';g.fillRect(0,0,VW,VH);BT.length=0;panel(75,420,600,470,CREAM,36);
  drawImg('didi_sick',375,590,130);txt(L('방파제가 무너졌어요!','沙堡被冲垮了！'),375,640,44,INK);txt(L('한 번 더 버텨 볼까요? (한 판에 1번)','要不要再坚持一下？（每局 1 次）'),375,694,24,'#a07a55');
  btn(125,738,500,96,L('▶ 광고 보고 복구하고 계속','▶ 看广告修好继续'),()=>showAd('revive',o=>{if(o)revive(run);}),{col:YEL,dk:YEL_D,tc:INK,sz:32});
  btn(255,920,240,70,L('그만하기','不用了'),()=>{sfx('btn');giveUp(run);},{col:GREY,dk:GREY_D,sz:26});
}
function drawPause(){
  g.fillStyle='rgba(40,24,12,.6)';g.fillRect(0,0,VW,VH);BT.length=0;panel(115,380,520,560,CREAM,36);txt(L('잠깐 쉬는 중','暂停中'),375,450,46,INK);
  btn(175,510,400,96,L('계속하기','继续'),()=>{paused=false;sfx('btn');},{sz:36});
  btn(175,636,400,84,L('처음부터 다시','重新开始'),()=>{sfx('btn');track('stage_quit',{stage:run.si+1,wave:run.wave});startBattle(run.si);},{col:MINT,dk:MINT_D,sz:30});
  btn(175,746,400,84,L('나가기','退出'),()=>{sfx('btn');track('stage_quit',{stage:run.si+1,wave:run.wave});goHome();},{col:GREY,dk:GREY_D,sz:30});
  btn(175,856,190,64,L('음악 ','音乐 ')+(S.opt.bgm?'ON':'OFF'),()=>{S.opt.bgm^=1;musicSync();persist();},{col:CREAM,dk:'#d9c8a8',tc:INK,sz:22});
  btn(385,856,190,64,L('효과음 ','音效 ')+(S.opt.sfx?'ON':'OFF'),()=>{S.opt.sfx^=1;persist();},{col:CREAM,dk:'#d9c8a8',tc:INK,sz:22});
}
function drawBattle(){
  const sh=S.opt.shake?B.shake:0;g.save();if(sh>.4)g.translate(rnd(-sh,sh),rnd(-sh,sh));
  g.drawImage(BG,0,0);g.save();g.scale(K,K);
  drawTide();drawLoot();drawWall();drawEnemies();drawProj();drawHeroes();drawFx();
  g.restore();g.restore();
  drawHud();if(B.cut)drawCut();
  if(run.phase==='card'&&run.offer)drawCards();else if(run.phase==='revive')drawRevive();else if(paused)drawPause();
}

/* ---------- 조작 ---------- */
function battleDown(x,y){if(paused||adOv||run.phase!=='run')return;const ly=y/K;if(ly>HERO_Y-70&&ly<HERO_Y+62){const sl=dragSlot();if(run.heroes[sl])B.drag={slot:sl};}}
function battleUp(x,y){
  const d=B.drag;B.drag=null;if(paused||adOv||run.phase!=='run')return false;
  if(d&&PTR.moved){const to=dragSlot();if(to!==d.slot&&y/K>HERO_Y-140){if(swapSlots(run,d.slot,to)){sfx('clear');S.tips.swap=1;}}return true;}
  if(d){if(tapHero(run,d.slot))return true;sfx('nope');return true;}
  return tapField(run,x/K,y/K);
}
