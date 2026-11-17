/* ============================== 화면: 홈 · 지도 · 전투 · 카드 · 결과 ============================== */
const TITLE=['심해 신전 수비대','深海神殿守卫'];
const TW_TXT={
  coral: [['산호 궁수','珊瑚弓手'],['빠른 가시 연사 (물리)','快速连射尖刺（物理）'],['관통 가시','穿透尖刺'],t=>[`${TSKILL.coral(t).every}발마다 일직선의 적을 모두 꿰뚫어요`,`每${TSKILL.coral(t).every}发贯穿一整条直线的敌人`]],
  bubble:[['거품 구슬','泡泡宝珠'],['맞은 적을 느리게 (마력)','命中减速（魔力）'],['거품 감옥','泡泡牢笼'],t=>[`${TSKILL.bubble(t).cd.toFixed(1)}초마다 가장 센 적을 ${TSKILL.bubble(t).dur.toFixed(1)}초 가둬요 (받는 피해 +30%)`,`每${TSKILL.bubble(t).cd.toFixed(1)}秒困住最强敌人${TSKILL.bubble(t).dur.toFixed(1)}秒（受伤+30%）`]],
  jelly: [['해파리 등대','水母灯塔'],['번개가 여러 적에게 튀어요 · 투명한 적을 드러내요','闪电连锁多个敌人 · 显形隐身敌人'],['과충전','过载'],t=>[`범위 안 적 전부 감전 ${TSKILL.jelly(t).dmg} + 기절`,`范围内全部敌人电击 ${TSKILL.jelly(t).dmg} 并眩晕`]],
  conch: [['소라 대포','海螺炮'],['멀리 쏘는 범위 폭발','远程范围爆炸'],['소용돌이','漩涡'],t=>[`${TSKILL.conch(t).cd.toFixed(1)}초마다 떨어진 자리에 ${TSKILL.conch(t).dur.toFixed(1)}초 소용돌이`,`每${TSKILL.conch(t).cd.toFixed(1)}秒在落点生成${TSKILL.conch(t).dur.toFixed(1)}秒漩涡`]],
  rune:  [['룬 등불','符文灯'],['주변 수호탑 공격력 증폭 + 광선 · 투명한 적을 드러내요','增幅周围塔攻击 + 光束 · 显形隐身敌人'],['공명','共鸣'],t=>[`주변 수호탑 공격 속도 +40% (${TSKILL.rune(t).dur.toFixed(1)}초)`,`周围守护塔攻速 +40%（${TSKILL.rune(t).dur.toFixed(1)}秒）`]],
};
const EN_TXT={minnow:[['그림자 치어','暗影小鱼'],['떼로 몰려와요','成群结队地涌来']],crab:[['철갑게','铁甲蟹'],['껍질이 단단해 물리(산호)에 강해요. 해파리·룬·거품이 잘 들어요','外壳坚硬，抗物理。用水母/符文/泡泡']],
  eel:[['전기뱀장어','电鳗'],['반쯤 다치면 번쩍 돌진해요. 거품으로 늦추세요','受伤过半会猛冲，用泡泡减速']],ray:[['그림자가오리','暗影鳐鱼'],['주기적으로 투명해져요. 해파리 등대·룬 등불·가드 근처에서만 보여요','周期性隐身，只在水母灯塔/符文灯/卫士附近现形']],
  angler:[['등불아귀','灯笼鮟鱇'],['주변 동료를 치료해요. 먼저 노리세요','会治疗周围同伴，优先击破']],squid:[['먹물오징어','墨汁乌贼'],['수호탑에 먹물을 뿌려요. 그 탑을 눌러 닦으세요','向守护塔喷墨，点击该塔擦掉']],
  horseshoe:[['투구게','鲎'],['쓰러지면 치어 3마리가 나와요. 소라 대포로 한꺼번에','倒下会生出3条小鱼，用海螺炮一网打尽']],turtle:[['바위거북','岩石龟'],['3초 안 맞으면 보호막이 다시 생겨요. 쉬지 말고 공격','3秒不挨打就恢复护盾，要持续攻击']],
  elite:[['심연 해마 기사','深渊海马骑士'],['단단한 정예. 지나가면 생명 -3','坚固的精英，漏过扣3生命']],boss:[['심연 아귀왕','深渊鮟鱇王'],['부하를 부르고, 빛을 꺼뜨리고, 정예를 불러요','召唤手下、熄灭光芒、呼叫精英']]};
const MECH_TIP={
  gate:['수문: 갈림길에서 적이 갈 길이 정해져요. 해류가 2웨이브마다 바뀌고, 🔑 열쇠로 수문을 눌러 직접 바꿀 수 있어요','水闸：决定敌人在岔路走哪边。洋流每2波改变一次，也可用🔑钥匙点击水闸手动切换'],
  cur:['해류 띠: 화살표 구간에서는 적이 빨라져요','洋流带：箭头区段敌人会加速'],
  vent:['거품 기둥: 지나가는 적을 띄워 잠깐 멈추고, 뜬 적은 피해 +30%','泡泡柱：把经过的敌人托起片刻，悬空时受伤+30%'],
  hero:['가드를 누른 뒤 원하는 곳을 누르면 옮겨요. 아래 ⚓ 버튼은 내려찍기','点击卫士再点任意位置即可移动。下方⚓按钮是重击'],
};
const SKILL_NAME=['닻 내려찍기','铁锚重击'];
let scr='home',G=null,bgC=null,time=0,last=performance.now(),acc=0;
let ui={};
const AMB=[];for(let i=0;i<5;i++)AMB.push({x:Math.random()*W,y:120+Math.random()*560,v:(Math.random()<.5?-1:1)*(6+Math.random()*8),k:i<2?'shark':'fish',s:.8+Math.random()*.6});
const depthOf=i=>120+i*95;

function enterBattle(si){
  G=new Game(si);bgC=renderBg(G.M);FX.length=0;acc=0;
  ui={sel:null,opt:null,overlay:'intro',speed:SV.opt.fast?2:1,shake:0,hurtT:0,tip:null,resultShown:false,newMech:[]};
  for(const m of['gate','cur','vent'])if((m==='gate'&&G.hasGate)||(m==='cur'&&G.hasCur)||(m==='vent'&&G.hasVent))if(!SV.seen[m])ui.newMech.push(m);
  if(si===0&&!SV.seen.hero)ui.newMech.push('hero');
  SV.sel=si;persist();scr='battle';musicMode='battle';
}
function showTip(s,dur){ui.tip={s,t:dur||4};}
/* ---------- 이벤트 → 효과·소리 ---------- */
function drain(){
  for(const e of G.ev){switch(e.t){
    case'kill':burst(e.x,e.y,e.k==='boss'?'#ff8ad8':'#c9a6ff',e.k==='boss'?40:8,60,2.5,.5);fx({k:'txt',s:'+'+e.g,x:e.x,y:e.y-10,col:'#7ff',size:10,life:.7});sfx('kill');if(e.k==='boss'){ui.shake=.6;vib(80);}break;
    case'leak':ui.hurtT=.5;ui.shake=.25;fx({k:'txt',s:'-'+e.n,x:TEMPLE.x,y:TEMPLE.y-60,col:'#ff6b8a',size:16,life:.9});sfx('leak');vib(30);break;
    case'build':burst(e.x,e.y,TCOL[e.k],14,70,2.5,.5);fx({k:'ring',x:e.x,y:e.y,r0:6,r:34,col:hexA(TCOL[e.k],.8),life:.4});sfx('build');break;
    case'up':burst(e.x,e.y-12,'#ffe27a',18,80,2.5,.6);fx({k:'ring',x:e.x,y:e.y,r0:8,r:40,col:'rgba(255,226,122,.8)',life:.5});sfx('up');break;
    case'sell':burst(e.x,e.y,'#7ff',10,50,2,.4);sfx('sell');break;
    case'clean':burst(e.x,e.y-14,'#bdf',10,50,2,.4);sfx('clean');break;
    case'gate':fx({k:'ring',x:e.x,y:e.y,r0:6,r:36,col:'rgba(255,215,106,.9)',life:.5});sfx('gate');break;
    case'slam':fx({k:'ring',x:e.x,y:e.y,r0:10,r:e.r,col:'rgba(140,240,255,.9)',w:6,life:.45});burst(e.x,e.y,'#bff',24,140,3,.5);ui.shake=.35;sfx('slam');vib(40);break;
    case'wave':sfx('wave');ui.pathT=2.5;fx({k:'txt',s:(e.boss?L('⚠ 보스 등장! ','⚠ 首领来袭！'):'')+L(`웨이브 ${e.w}`,`第 ${e.w} 波`),x:W/2,y:150,col:e.boss?'#ff8ad8':'#bff',size:20,life:1.6});
      if(e.cur)fx({k:'txt',s:L('🌊 해류가 바뀌었어요','🌊 洋流改变了'),x:W/2,y:178,col:'#9ef',size:12,life:1.6});musicMode=e.boss?'boss':'battle';break;
    case'cards':sfx('mut');break;
    case'mut':break;
    case'vent':for(let i=0;i<8;i++)fx({k:'bub',x:e.x+(Math.random()-.5)*18,y:e.y,v:40+Math.random()*50,s:1.5+Math.random()*2.5,ph:Math.random()*6,life:.9});sfx('vent');break;
    case'trap':fx({k:'ring',x:e.x,y:e.y,r0:24,r:12,col:'rgba(160,240,255,.9)',life:.3});sfx('trap');break;
    case'storm':fx({k:'ring',x:e.x,y:e.y,r0:10,r:e.r,col:'rgba(255,240,140,.85)',w:4,life:.4});sfx('storm');break;
    case'reso':fx({k:'ring',x:e.x,y:e.y,r0:10,r:e.r,col:'rgba(210,150,255,.7)',w:3,life:.6});break;
    case'zap':fx({k:'zap',pts:e.pts,life:.16});sfx('zap');break;
    case'pierce':fx({k:'line',x:e.x,y:e.y-18,x2:e.x2,y2:e.y2,col:'rgba(255,200,150,.95)',w:5,life:.25});sfx('spine');break;
    case'boom':fx({k:'ring',x:e.x,y:e.y,r0:4,r:e.r,col:'rgba(255,210,170,.85)',w:4,life:.35});burst(e.x,e.y,'#ffd2aa',10,80,2.5,.4);sfx('boom');break;
    case'whirl':break;
    case'pop':burst(e.x,e.y,'#bff',4,40,1.6,.3);sfx('bub');break;
    case'hit':if(Math.random()<.5)burst(e.x,e.y,'#fff',2,40,1.4,.2);break;
    case'heal':fx({k:'ring',x:e.x,y:e.y,r0:8,r:e.r,col:'rgba(140,255,140,.6)',life:.5});break;
    case'ink':fx({k:'ink',x:e.x,y:e.y,tx:e.tx,ty:e.ty,life:.5});break;
    case'shell':fx({k:'ring',x:e.x,y:e.y,r0:6,r:22,col:'rgba(120,200,255,.8)',life:.4});break;
    case'dash':burst(e.x,e.y,'#fff27a',8,60,2,.3);break;
    case'hlv':fx({k:'txt',s:'LEVEL UP!',x:e.x,y:e.y-34,col:'#ffd76a',size:12,life:1});sfx('up');break;
    case'roar':ui.shake=.6;sfx('roar');fx({k:'flash',col:'rgba(160,40,200,.25)',life:.4});break;
    case'dark':ui.shake=.4;sfx('roar');fx({k:'flash',col:'rgba(0,0,0,.5)',life:.8});showTip(L('아귀왕이 빛을 꺼뜨렸어요! 수호탑을 눌러 먹물을 닦으세요','鮟鱇王熄灭了光芒！点击守护塔擦掉墨汁'),3);break;
    case'win':sfx('win');break;case'lose':sfx('lose');break;
  }}
  G.ev.length=0;
}
/* ---------- 전투 갱신 ---------- */
function updateBattle(dt){
  if(ui.tip){ui.tip.t-=dt;if(ui.tip.t<=0)ui.tip=null;}
  if(ui.shake>0)ui.shake-=dt;if(ui.pathT>0)ui.pathT-=dt;if(ui.hurtT>0)ui.hurtT-=dt;
  if(!ui.overlay&&G.state==='run'){acc+=dt*ui.speed;let n=0;while(acc>=DT&&n<8){G.tick();acc-=DT;n++;if(G.state!=='run')break;}if(n>=8)acc=0;}
  drain();
  if(G.state==='card'&&!ui.overlay){ui.overlay='cards';ui.sel=null;}
  if((G.state==='win'||G.state==='lose')&&!ui.resultShown){ui.resultShown=true;ui.overlay='result';ui.sel=null;musicMode='calm';
    if(G.state==='win'){SV.stars[G.si]=Math.max(SV.stars[G.si],G.stars());persist();}}
  if(G.si===0&&G.wave>=2&&!SV.seen.hero2){SV.seen.hero2=1;persist();showTip(LL(MECH_TIP.hero),5);}
}
/* ---------- 버튼 배치 ---------- */
function buildBtns(s){const out=[];TOWER_IDS.forEach((k,i)=>{const a=-Math.PI/2+i*Math.PI*2/5;let x=s.x+Math.cos(a)*56,y=s.y+Math.sin(a)*52;x=Math.max(24,Math.min(W-24,x));y=Math.max(72,Math.min(728,y));out.push({k,x,y});});return out;}
function towerBtns(t){return [{k:'up',x:Math.max(30,Math.min(W-30,t.x-36)),y:Math.max(76,t.y-56)},{k:'sell',x:Math.max(30,Math.min(W-30,t.x+36)),y:Math.max(76,t.y-56)}];}
const BAR={skill:{x:42,y:772,r:24},hero:{x:98,y:772,r:19},key:{x:156,y:772,r:19},wave:{x:228,y:752,w:150,h:40},speed:{x:412,y:772,r:20},pause:{x:424,y:23,r:16}};
const hitC=(p,b,pad)=>Math.hypot(p.x-b.x,p.y-b.y)<b.r+(pad||4);
const hitR=(p,b)=>p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h;
/* ---------- 전투 터치 ---------- */
function tapBattle(p){
  if(ui.overlay)return tapOverlay(p);
  if(hitC(p,BAR.pause,8)){ui.overlay='pause';sfx('tap');return;}
  if(p.y>740){
    if(hitC(p,BAR.skill)){if(G.heroSkill())ui.sel=null;else sfx('tap');return;}
    if(hitC(p,BAR.hero)){ui.sel={type:'hero'};sfx('tap');return;}
    if(hitR(p,BAR.wave)){if(G.callWave())ui.sel=null;return;}
    if(hitC(p,BAR.speed)){ui.speed=ui.speed===1?2:1;SV.opt.fast=ui.speed===2?1:0;persist();sfx('tap');return;}
    return;
  }
  const sel=ui.sel;
  if(sel&&sel.type==='spot'){for(const b of buildBtns(G.M.spots[sel.i]))if(hitC(p,{x:b.x,y:b.y,r:21})){
      if(!G.unlocked(b.k)){showTip(L(`${UNLOCK[b.k]}판을 깨면 열려요`,`通关第${UNLOCK[b.k]}关后解锁`),2);return;}
      if(ui.opt===b.k){if(G.build(sel.i,b.k)){ui.sel=null;ui.opt=null;}else{showTip(L('진주가 부족해요','珍珠不足'),1.5);sfx('tap');}}else{ui.opt=b.k;sfx('tap');}return;}}
  if(sel&&sel.type==='tower'){for(const b of towerBtns(sel.t))if(hitC(p,{x:b.x,y:b.y,r:22})){
      if(b.k==='up'){if(G.upgrade(sel.t)){}else if(sel.t.lv<MAX_TLV){showTip(L('진주가 부족해요','珍珠不足'),1.5);sfx('tap');}}else{G.sell(sel.t);ui.sel=null;}return;}}
  if(sel&&sel.type==='hero'){const h=G.hero;if(Math.hypot(p.x-h.x,p.y-h.y)>20){G.moveHero(p.x,p.y);fx({k:'ring',x:p.x,y:p.y,r0:14,r:4,col:'rgba(120,255,220,.9)',life:.35});ui.sel=null;sfx('tap');SV.seen.hero=1;persist();return;}}
  ui.opt=null;
  if(Math.hypot(p.x-G.hero.x,p.y-G.hero.y+6)<22){ui.sel={type:'hero'};sfx('tap');return;}
  for(const t of G.towers)if(Math.hypot(p.x-t.x,p.y-t.y+10)<24){if(G.clean(t))return;ui.sel={type:'tower',t};sfx('tap');return;}
  for(const k in G.M.gates){const gt=G.M.gates[k];if(Math.hypot(p.x-gt.x,p.y-gt.y)<24){if(!G.flipGate(k))showTip(L('🔑 수문 열쇠가 없어요 (2웨이브마다 1개)','🔑 没有水闸钥匙（每2波获得1把）'),2);ui.sel=null;return;}}
  for(let i=0;i<G.M.spots.length;i++){const s=G.M.spots[i];if(Math.hypot(p.x-s.x,p.y-s.y)<26&&!G.towers.some(t=>t.spot===i)){ui.sel={type:'spot',i};ui.opt=null;sfx('tap');return;}}
  ui.sel=null;
}
function overlayBtns(){
  const o=ui.overlay;
  if(o==='intro')return [{id:'go',x:W/2-90,y:640,w:180,h:48}];
  if(o==='cards')return G.cards.map((c,i)=>({id:'card'+i,x:40,y:330+i*112,w:370,h:96}));
  if(o==='pause')return [{id:'resume',x:W/2-110,y:250,w:220,h:46},{id:'retry',x:W/2-110,y:306,w:220,h:46},{id:'map',x:W/2-110,y:362,w:220,h:46},
    {id:'sfx',x:W/2-110,y:430,w:106,h:40},{id:'bgm',x:W/2+4,y:430,w:106,h:40},{id:'lang',x:W/2-110,y:478,w:220,h:40}];
  if(o==='result'){const b=[{id:'retry',x:W/2-150,y:520,w:140,h:48},{id:'map',x:W/2+10,y:520,w:140,h:48}];if(G.state==='win'&&G.si<STAGE_DEF.length-1)b.push({id:'next',x:W/2-110,y:580,w:220,h:52});return b;}
  return [];
}
function tapOverlay(p){
  for(const b of overlayBtns())if(hitR(p,b)){sfx('tap');const id=b.id;
    if(id==='go'){ui.overlay=null;for(const m of ui.newMech)SV.seen[m]=1;persist();}
    else if(id.startsWith('card')){G.pickCard(+id.slice(4));ui.overlay=null;sfx('card');}
    else if(id==='resume')ui.overlay=null;
    else if(id==='retry')enterBattle(G.si);
    else if(id==='next')enterBattle(G.si+1);
    else if(id==='map'){scr='map';musicMode='calm';}
    else if(id==='sfx'){SV.opt.sfx^=1;persist();}else if(id==='bgm'){SV.opt.bgm^=1;persist();}
    else if(id==='lang'){LANG=LANG==='ko'?'zh':'ko';SV.lang=LANG;persist();}
    return;}
}
/* ---------- 전투 그리기 ---------- */
function activeSegs(){const M=G.M,on=new Set(),st=[...M.start];while(st.length){const id=st.pop();if(on.has(id))continue;on.add(id);const n=M.next[id];if(!n)continue;st.push(typeof n==='string'?n:n.to[M.gates[n.g].st]);}return on;}
function drawAmbient(x,dt,alpha){
  for(const a of AMB){a.x+=a.v*dt;if(a.x<-80)a.x=W+80;if(a.x>W+80)a.x=-80;x.save();x.translate(a.x,a.y+Math.sin(time*.6+a.s*9)*6);x.scale(a.v<0?-a.s:a.s,a.s);x.globalAlpha=alpha;x.fillStyle='#061820';
    if(a.k==='shark'){x.beginPath();x.moveTo(36,0);x.quadraticCurveTo(10,-12,-26,-3);x.lineTo(-40,-12);x.lineTo(-36,0);x.lineTo(-40,12);x.lineTo(-26,3);x.quadraticCurveTo(10,12,36,0);x.fill();x.beginPath();x.moveTo(0,-8);x.lineTo(-8,-20);x.lineTo(-12,-6);x.fill();}
    else{for(let i=0;i<5;i++){x.beginPath();x.ellipse(i*9-18,(i%2)*7,5,2.5,0,0,7);x.fill();}}
    x.restore();}x.globalAlpha=1;
}
function drawRays(x,a){x.save();x.globalCompositeOperation='lighter';for(let i=0;i<4;i++){const cx=60+i*110+Math.sin(time*.3+i)*30;const gr=x.createLinearGradient(0,0,0,H*.8);gr.addColorStop(0,`rgba(150,240,255,${.07*a})`);gr.addColorStop(1,'rgba(150,240,255,0)');
  x.fillStyle=gr;x.beginPath();x.moveTo(cx-14,0);x.lineTo(cx+20,0);x.lineTo(cx+90+Math.sin(time*.4+i)*20,H*.8);x.lineTo(cx-10,H*.8);x.closePath();x.fill();}x.restore();}
function drawBattle(dt){
  const x=g,M=G.M;x.setTransform(K,0,0,K,0,0);
  if(ui.shake>0&&SV.opt.shake!==0)x.translate((Math.random()-.5)*8*ui.shake,(Math.random()-.5)*8*ui.shake);
  x.drawImage(bgC,0,0,W,H);
  drawAmbient(x,dt,.35);
  /* 물길: 그려진 길 대신 흐르는 플랑크톤 빛 알갱이. 준비 중·웨이브 시작·자리 고를 때만 잠깐 또렷하게 */
  const on=activeSegs(),hl=Math.max(G.state==='prep'?1:0,Math.min(1,ui.pathT||0),ui.sel&&ui.sel.type!=='hero'?.6:0);x.lineCap=x.lineJoin='round';
  for(const id in M.segs){const s=M.segs[id],act=on.has(id);
    if(hl>0&&act){segPath(x,s);x.strokeStyle=`rgba(200,170,255,${.35*hl})`;x.lineWidth=2;x.setLineDash([3,12]);x.lineDashOffset=-time*30;x.stroke();x.setLineDash([]);}
    const n=Math.floor(s.len/20);for(let i=0;i<n;i++){const d=(i*20+time*(act?26:8)+(i%3)*7)%s.len,P=segPos(s,d),o=Math.sin(i*1.7+time*1.3)*12;
      const a2=act?.4+.25*Math.sin(time*3+i):.08;x.globalAlpha=a2;x.fillStyle=i%4?'#bff6ff':'#e6c8ff';x.beginPath();x.arc(P.x-Math.sin(P.a)*o,P.y+Math.cos(P.a)*o,i%4?1.7:2.4,0,7);x.fill();}
    x.globalAlpha=1;}
  /* 해류 띠 */
  for(const c of M.cur){const s=M.segs[c.seg],len=c.d1-c.d0,fast=!(G.B.rev&&c.mul>1);for(let k=0;k<len;k+=20){const d=c.d0+((k+time*(fast?70:25))%len),P=segPos(s,d);
    x.save();x.translate(P.x,P.y);x.rotate(P.a);x.strokeStyle=fast?'rgba(150,240,255,.45)':'rgba(140,170,255,.35)';x.lineWidth=2;x.beginPath();x.moveTo(-5,-7);x.lineTo(3,0);x.lineTo(-5,7);x.stroke();x.restore();}}
  /* 거품 기둥 */
  for(const v of M.vents){x.fillStyle='#08242c';x.beginPath();x.ellipse(v.x,v.y,13,7,0,0,7);x.fill();x.strokeStyle=v.cd<=0?'rgba(160,250,255,.9)':'rgba(100,160,180,.5)';x.lineWidth=2;x.stroke();
    if(v.cd<=0)glow(x,v.x,v.y,22,'rgba(140,240,255,.5)',.6+.3*Math.sin(time*5));if(Math.random()<.15)fx({k:'bub',x:v.x+(Math.random()-.5)*10,y:v.y,v:25+Math.random()*20,s:1+Math.random()*2,ph:Math.random()*6,life:1.2});}
  /* 빈 자리 룬 */
  const cheap=Math.min(...TOWER_IDS.filter(k=>G.unlocked(k)).map(k=>G.cost(k)));
  M.spots.forEach((s,i)=>{if(G.towers.some(t=>t.spot===i))return;const can=G.gold>=cheap,p=.5+.5*Math.sin(time*3+i);
    x.beginPath();for(let j=0;j<6;j++){const a=j*Math.PI/3;x.lineTo(s.x+Math.cos(a)*13,s.y+Math.sin(a)*8);}x.closePath();x.fillStyle='rgba(10,40,50,.85)';x.fill();
    x.strokeStyle=can?`rgba(120,255,230,${.55+.4*p})`:'rgba(120,180,180,.35)';x.lineWidth=1.8;x.stroke();if(can)glow(x,s.x,s.y,18,'rgba(100,255,220,.35)',p);
    x.fillStyle=can?'#9ff':'#577';x.beginPath();x.moveTo(s.x,s.y-4);x.lineTo(s.x+3,s.y);x.lineTo(s.x,s.y+4);x.lineTo(s.x-3,s.y);x.closePath();x.fill();
    if(ui.sel&&ui.sel.type==='spot'&&ui.sel.i===i){x.strokeStyle='#fff';x.lineWidth=2;x.beginPath();x.ellipse(s.x,s.y,22,14,0,0,7);x.stroke();}});
  /* 수문 */
  for(const k in M.gates){const gt=M.gates[k],to=M.segs[gt.to[gt.st]],P=segPos(to,26),a=Math.atan2(P.y-gt.y,P.x-gt.x),fl=gt.flash>0?gt.flash:0;
    if(G.keys>0&&G.state!=='win')glow(x,gt.x,gt.y,28,'rgba(255,215,106,.5)',.4+.3*Math.sin(time*5));
    x.fillStyle='#1c2a30';x.beginPath();x.arc(gt.x,gt.y,15+fl*4,0,7);x.fill();x.strokeStyle='#e8c45a';x.lineWidth=2.5;x.stroke();
    x.save();x.translate(gt.x,gt.y);x.rotate(a);x.fillStyle='#ffe9a8';x.beginPath();x.moveTo(10,0);x.lineTo(-4,-7);x.lineTo(-1,0);x.lineTo(-4,7);x.closePath();x.fill();x.restore();
    if(G.keys>0)txt(x,'🔑',gt.x+14,gt.y-14,10,'#fff');}
  /* 사거리 */
  const sel=ui.sel;
  if(sel&&sel.type==='tower'){x.fillStyle=hexA(TCOL[sel.t.k],.1);x.strokeStyle=hexA(TCOL[sel.t.k],.6);x.lineWidth=1.5;x.beginPath();x.arc(sel.t.x,sel.t.y,G.range(sel.t),0,7);x.fill();x.stroke();}
  if(sel&&sel.type==='spot'&&ui.opt){const s=M.spots[sel.i],r=TOWERS[ui.opt].range;x.fillStyle=hexA(TCOL[ui.opt],.1);x.strokeStyle=hexA(TCOL[ui.opt],.6);x.lineWidth=1.5;x.beginPath();x.arc(s.x,s.y,r,0,7);x.fill();x.stroke();}
  /* 소용돌이 */
  for(const z of G.zones){x.save();x.translate(z.x,z.y);x.globalAlpha=Math.min(1,z.t*2);for(let i=0;i<3;i++){x.rotate(time*4);x.strokeStyle=`rgba(150,220,255,${.5-i*.12})`;x.lineWidth=3;x.beginPath();x.arc(0,0,z.r*(1-i*.28),0,4.2);x.stroke();}x.restore();}
  drawTemple(x,time,ui.hurtT);
  /* 탑·적·영웅을 아래쪽이 앞에 오게 */
  const ents=[...G.towers.map(t=>({y:t.y,f:()=>drawTower(x,t,time,sel&&sel.t===t)})),...G.enemies.map(e=>({y:e.y,f:()=>drawEnemy(x,e,time)})),{y:G.hero.y+2,f:()=>drawHero(x,G.hero,time,sel&&sel.type==='hero')}];
  ents.sort((a,b)=>a.y-b.y);for(const e of ents)e.f();
  /* 룬 광선 */
  for(const t of G.towers)if(t.k==='rune'&&t.beam>0){x.strokeStyle='rgba(220,170,255,.85)';x.lineWidth=2.5;x.beginPath();x.moveTo(t.x,t.y-40);x.lineTo(t.beamX,t.beamY);x.stroke();x.strokeStyle='rgba(199,125,255,.3)';x.lineWidth=6;x.stroke();}
  /* 투사체 */
  for(const p of G.projs){x.save();x.translate(p.x,p.y);
    if(p.kind==='spine'){x.rotate(p.a||0);x.fillStyle='#ffd2a8';x.beginPath();x.moveTo(7,0);x.lineTo(-5,-2);x.lineTo(-5,2);x.closePath();x.fill();}
    else if(p.kind==='bub'){x.strokeStyle='rgba(200,250,255,.95)';x.fillStyle='rgba(110,231,255,.35)';x.lineWidth=1.2;x.beginPath();x.arc(0,0,4.5,0,7);x.fill();x.stroke();}
    else if(p.kind==='shell'){x.rotate(time*12);x.fillStyle=p.whirl?'#9ef':'#ffc9a8';x.beginPath();x.ellipse(0,0,6,4,0,0,7);x.fill();x.strokeStyle='#a0583a';x.lineWidth=1;x.stroke();if(p.whirl)glow(x,0,0,12,'rgba(150,230,255,.6)');}
    else if(p.kind==='bolt'){glow(x,0,0,8,'rgba(120,240,255,.9)');x.fillStyle='#fff';x.beginPath();x.arc(0,0,2.4,0,7);x.fill();}
    x.restore();}
  drawFx(x,dt);
  if(ui.hurtT>0){const gr=x.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.7);gr.addColorStop(0,'rgba(255,0,60,0)');gr.addColorStop(1,`rgba(255,0,60,${ui.hurtT*.5})`);x.fillStyle=gr;x.fillRect(0,0,W,H);}
  drawRays(x,1);
  x.setTransform(K,0,0,K,0,0);
  drawHud(x);
  if(sel&&sel.type==='spot')drawBuildMenu(x,sel.i);
  if(sel&&sel.type==='tower')drawTowerMenu(x,sel.t);
  drawHints(x);
  if(ui.tip){x.globalAlpha=Math.min(1,ui.tip.t*2);rr(x,24,92,W-48,46,12);x.fillStyle='rgba(8,24,36,.88)';x.fill();x.strokeStyle='rgba(120,240,255,.5)';x.lineWidth=1.5;x.stroke();wrap(x,ui.tip.s,W/2,108,W-70,12,'#e8fbff',16);x.globalAlpha=1;}
  if(ui.overlay)drawOverlay(x);
}
function chip(x,X,Y,ic,col){x.fillStyle=col;x.beginPath();x.arc(X,Y,10,0,7);x.fill();txt(x,ic,X,Y+1,11,'#fff');}
function drawHud(x){
  let gr=x.createLinearGradient(0,0,0,48);gr.addColorStop(0,'rgba(4,16,26,.92)');gr.addColorStop(1,'rgba(4,16,26,.55)');x.fillStyle=gr;x.fillRect(0,0,W,46);
  glow(x,22,23,14,'rgba(255,120,170,.6)');txt(x,'♥',22,23,18,'#ff7aa8');txt(x,''+G.lives,48,23,16,'#fff','left','rgba(0,0,0,.6)');
  x.fillStyle='#7ff';x.beginPath();x.moveTo(98,15);x.lineTo(105,23);x.lineTo(98,31);x.lineTo(91,23);x.closePath();x.fill();txt(x,''+G.gold,112,23,16,'#e6ffff','left','rgba(0,0,0,.6)');
  txt(x,L(`웨이브 ${G.wave}/${G.S.waves}`,`第 ${G.wave}/${G.S.waves} 波`),262,17,13,'#fff');txt(x,`${G.si+1}. ${LL(G.M.name)}`,262,33,10,'#9fd');
  x.fillStyle='rgba(255,255,255,.15)';x.beginPath();x.arc(BAR.pause.x,BAR.pause.y,BAR.pause.r,0,7);x.fill();x.fillStyle='#fff';x.fillRect(418,16,4,14);x.fillRect(426,16,4,14);
  let cx=16;for(const m of G.mutList){chip(x,cx,58,MUTS[m].ic,'rgba(110,40,150,.85)');cx+=22;}
  if(G.mutList.length)cx+=6;for(const b of G.blessList){chip(x,cx,58,BLESS[b].ic,'rgba(150,110,20,.85)');cx+=22;}
  /* 아래 막대 */
  gr=x.createLinearGradient(0,740,0,H);gr.addColorStop(0,'rgba(4,16,26,.6)');gr.addColorStop(1,'rgba(4,16,26,.95)');x.fillStyle=gr;x.fillRect(0,740,W,60);
  const h=G.hero,B=BAR.skill,cdF=h.sc>0?h.sc/(HERO.skillCd*G.B.heroCd):0;
  x.fillStyle=cdF>0?'#24343e':'#1d5a6a';x.beginPath();x.arc(B.x,B.y,B.r,0,7);x.fill();x.strokeStyle=cdF>0?'#567':'#8ff';x.lineWidth=2.5;x.stroke();
  if(cdF>0){x.fillStyle='rgba(0,0,0,.55)';x.beginPath();x.moveTo(B.x,B.y);x.arc(B.x,B.y,B.r,-Math.PI/2,-Math.PI/2+cdF*Math.PI*2);x.closePath();x.fill();}
  txt(x,'⚓',B.x,B.y-2,18,'#fff');txt(x,cdF>0?Math.ceil(h.sc)+'s':LL(SKILL_NAME).slice(0,LANG==='zh'?4:5),B.x,B.y+16,8,'#cff','center','rgba(0,0,0,.8)');
  const HB=BAR.hero;x.fillStyle=ui.sel&&ui.sel.type==='hero'?'#2a7a8a':'#22404a';x.beginPath();x.arc(HB.x,HB.y,HB.r,0,7);x.fill();x.strokeStyle='#e8c45a';x.lineWidth=2;x.stroke();
  x.save();x.beginPath();x.arc(HB.x,HB.y,HB.r-2,0,7);x.clip();drawHero(x,{x:HB.x,y:HB.y+8,face:1,lv:h.lv,atk:0,moving:false},0,false);x.restore();txt(x,L('가드','卫士'),HB.x,HB.y+24,8,'#cff');
  if(G.hasGate){const KB=BAR.key;x.fillStyle='#2c2a1a';x.beginPath();x.arc(KB.x,KB.y,KB.r,0,7);x.fill();x.strokeStyle='#e8c45a';x.lineWidth=2;x.stroke();txt(x,'🔑',KB.x,KB.y-3,13,'#fff');txt(x,`${G.keys}/${G.keyMax}`,KB.x,KB.y+11,9,'#ffe9a8');}
  const WB=BAR.wave;let lab,act=false;
  if(G.state==='prep'){lab=L('▶ 첫 웨이브','▶ 开始第一波');act=true;}
  else if(G.wave>=G.S.waves)lab=L('마지막 웨이브','最后一波');
  else if(G.spawning)lab=L('몰려오는 중…','敌人来袭中…');
  else{lab=L(`▶ 다음 +${Math.ceil(G.nextT)*EARLY_BONUS}`,`▶ 下一波 +${Math.ceil(G.nextT)*EARLY_BONUS}`);act=true;}
  const pl=act?.5+.5*Math.sin(time*5):0;rr(x,WB.x,WB.y,WB.w,WB.h,14);gr=x.createLinearGradient(0,WB.y,0,WB.y+WB.h);gr.addColorStop(0,act?'#3fd0c0':'#2a3a44');gr.addColorStop(1,act?'#1a7a8a':'#1a262e');x.fillStyle=gr;x.fill();
  x.strokeStyle=act?`rgba(200,255,250,${.5+.5*pl})`:'#456';x.lineWidth=2;x.stroke();txt(x,lab,WB.x+WB.w/2,WB.y+WB.h/2+1,13,'#fff','center','rgba(0,0,0,.4)');
  if(act&&G.state!=='prep'&&G.nextT>0){x.fillStyle='rgba(255,255,255,.35)';x.fillRect(WB.x+10,WB.y+WB.h-5,(WB.w-20)*(G.nextT/WAVE_GAP),2);}
  const SB=BAR.speed;x.fillStyle=ui.speed===2?'#a06a10':'#22404a';x.beginPath();x.arc(SB.x,SB.y,SB.r,0,7);x.fill();x.strokeStyle='#e8c45a';x.lineWidth=2;x.stroke();txt(x,ui.speed===2?'▶▶':'▶',SB.x,SB.y,ui.speed===2?11:13,'#fff');
}
function infoPanel(x,lines,anchorY){const h=18+lines.length*17,y=anchorY>520?60:H-66-h;rr(x,16,y,W-32,h,12);x.fillStyle='rgba(6,20,30,.93)';x.fill();x.strokeStyle='rgba(120,240,255,.45)';x.lineWidth=1.5;x.stroke();
  lines.forEach((l,i)=>txt(x,l[0],28,y+17+i*17,l[2]||11,l[1]||'#e8fbff','left',null,i===0?900:700));}
function drawBuildMenu(x,i){
  const s=G.M.spots[i];
  for(const b of buildBtns(s)){const lock=!G.unlocked(b.k),c=G.cost(b.k),can=!lock&&G.gold>=c,on=ui.opt===b.k;
    x.fillStyle=on?'rgba(30,70,80,.98)':'rgba(10,24,32,.92)';x.beginPath();x.arc(b.x,b.y,on?24:21,0,7);x.fill();x.strokeStyle=lock?'#455':on?'#fff':TCOL[b.k];x.lineWidth=on?3:2;x.stroke();
    if(lock){txt(x,'🔒',b.x,b.y-2,14,'#fff');txt(x,L(`${UNLOCK[b.k]}판`,`第${UNLOCK[b.k]}关`),b.x,b.y+14,8,'#9ab');continue;}
    x.save();x.beginPath();x.arc(b.x,b.y,20,0,7);x.clip();towerIcon(x,b.k,b.x,b.y+4,.62);x.restore();
    rr(x,b.x-17,b.y+13,34,13,6);x.fillStyle='rgba(0,0,0,.75)';x.fill();txt(x,''+c,b.x,b.y+20,9,can?'#7ff':'#ff7a8a');
    if(on){x.strokeStyle=`rgba(255,255,255,${.5+.5*Math.sin(time*8)})`;x.lineWidth=2;x.beginPath();x.arc(b.x,b.y,28,0,7);x.stroke();}}
  if(ui.opt){const T=TW_TXT[ui.opt],tier=G.tier();infoPanel(x,[[LL(T[0])+L('   — 한 번 더 누르면 건설','   — 再点一次建造'),TCOL[ui.opt],14],[LL(T[1])],[`✦ ${LL(T[2])} Lv${tier}: ${LL(T[3](tier))}`,'#ffe9a8']],s.y);}
}
function drawTowerMenu(x,t){
  for(const b of towerBtns(t)){x.fillStyle='rgba(10,24,32,.94)';x.beginPath();x.arc(b.x,b.y,22,0,7);x.fill();
    if(b.k==='up'){const c=G.upCost(t),max=t.lv>=MAX_TLV,can=!max&&G.gold>=c;x.strokeStyle=max?'#e8c45a':can?'#7f7':'#a55';x.lineWidth=2.5;x.stroke();txt(x,max?'MAX':t.lv===MAX_TLV-1?L('각성','觉醒'):'⬆',b.x,b.y-4,max||t.lv===MAX_TLV-1?11:16,max||t.lv===MAX_TLV-1?'#ffd76a':'#fff');if(!max)txt(x,''+c,b.x,b.y+11,9,can?'#7ff':'#ff7a8a');}
    else{x.strokeStyle='#e8c45a';x.lineWidth=2;x.stroke();txt(x,'💎',b.x,b.y-4,12,'#fff');txt(x,'+'+G.sellVal(t),b.x,b.y+11,9,'#ffe9a8');}}
  const T=TW_TXT[t.k],tier=G.tier(),dm=G.dmg(t);
  infoPanel(x,[[`${LL(T[0])}  Lv${t.lv}`,TCOL[t.k],14],[L(`공격 ${dm.toFixed(1)} · 사거리 ${Math.round(G.range(t))} · 간격 ${G.rate(t).toFixed(2)}초`,`攻击 ${dm.toFixed(1)} · 射程 ${Math.round(G.range(t))} · 间隔 ${G.rate(t).toFixed(2)}秒`)],
    [`✦ ${LL(T[2])} Lv${tier}: ${LL(T[3](tier))}`,'#ffe9a8'],t.aura>0?[L(`룬 증폭 +${Math.round(t.aura*100)}%`,`符文增幅 +${Math.round(t.aura*100)}%`),'#d6b0ff']:[LL(T[1]),'#9cc']],t.y);
}
function arrowHint(x,X,Y,s){const b=Math.sin(time*6)*5;x.fillStyle='#ffe27a';x.beginPath();x.moveTo(X,Y-6+b);x.lineTo(X-9,Y-20+b);x.lineTo(X+9,Y-20+b);x.closePath();x.fill();txt(x,s,X,Y-32+b,12,'#fff','center','rgba(0,0,0,.85)');}
function drawHints(x){
  if(ui.overlay||G.si!==0)return;
  if(!G.towers.length&&!(ui.sel&&ui.sel.type==='spot')){const s=G.M.spots[0];arrowHint(x,s.x,s.y-12,L('룬 자리를 눌러 수호탑 세우기','点击符文位建造守护塔'));}
  else if(G.state==='prep'&&G.towers.length&&!ui.sel)arrowHint(x,BAR.wave.x+BAR.wave.w/2,BAR.wave.y-2,L('준비되면 시작!','准备好就开始！'));
}
/* ---------- 겹쳐 뜨는 창 ---------- */
function panel(x,X,Y,w,h){rr(x,X,Y,w,h,18);const gr=x.createLinearGradient(0,Y,0,Y+h);gr.addColorStop(0,'rgba(14,44,60,.97)');gr.addColorStop(1,'rgba(6,20,30,.97)');x.fillStyle=gr;x.fill();x.strokeStyle='rgba(120,240,255,.55)';x.lineWidth=2;x.stroke();}
function btn(x,b,label,col,size){rr(x,b.x,b.y,b.w,b.h,14);const gr=x.createLinearGradient(0,b.y,0,b.y+b.h);gr.addColorStop(0,col||'#3fd0c0');gr.addColorStop(1,'#14606e');x.fillStyle=gr;x.fill();x.strokeStyle='rgba(255,255,255,.5)';x.lineWidth=1.5;x.stroke();txt(x,label,b.x+b.w/2,b.y+b.h/2+1,size||15,'#fff','center','rgba(0,0,0,.35)');}
function drawOverlay(x){
  x.fillStyle='rgba(0,8,16,.6)';x.fillRect(0,0,W,H);const o=ui.overlay,B=overlayBtns();
  if(o==='intro'){const S=G.S;panel(x,24,90,W-48,610);
    txt(x,`${LL(AREA_NAME)} · ${G.si+1}`,W/2,120,12,'#9fd');txt(x,LL(G.M.name),W/2,148,24,'#fff','center','rgba(0,0,0,.5)');txt(x,L(`수심 ${depthOf(G.si)}m · 웨이브 ${S.waves}`,`水深 ${depthOf(G.si)}米 · ${S.waves} 波`),W/2,176,12,'#bfe');
    let y=206;
    const sec=(t,c)=>{x.fillStyle='rgba(255,255,255,.08)';x.fillRect(44,y,W-88,1);y+=16;txt(x,t,46,y,13,c,'left');y+=20;};
    sec(L('⚔ 이번 판의 양쪽 힘','⚔ 本关双方实力'),'#ffe9a8');
    txt(x,L(`수호탑 스킬 Lv${S.sTier}`,`守护塔技能 Lv${S.sTier}`)+(S.sTier>1?L('  (판이 지나며 강해졌어요)','（随关卡提升）'):''),56,y,12,'#bff','left');y+=18;
    txt(x,L(`수호탑 공격력 ×${S.twMul.toFixed(2)} · 가드 ×${S.heroMul.toFixed(2)}`,`守护塔攻击 ×${S.twMul.toFixed(2)} · 卫士 ×${S.heroMul.toFixed(2)}`),56,y,12,'#bff','left');y+=18;
    txt(x,L(`심연 적 체력 ×${S.hp.toFixed(2)}`,`深渊敌人生命 ×${S.hp.toFixed(2)}`),56,y,12,'#f9c','left');y+=18;
    if(G.mutList.length){for(const m of G.mutList){txt(x,MUTS[m].ic+' '+LL(MUTS[m].n),56,y,11,'#e0b0ff','left');y+=16;}}
    else{txt(x,L('심연 변이 없음 (3웨이브마다 하나씩 생겨요)','暂无深渊变异（每3波出现一个）'),56,y,11,'#a8c','left');y+=16;}
    if(S.fresh){sec(L('🆕 새로운 적','🆕 新敌人'),'#ffe9a8');const e={k:S.fresh,x:72,y:y+14,a:0,r:ENEMIES[S.fresh].r,hp:1,mhp:1,shield:0,id:1,spawnT:0,inv:false,slow:0,slowT:0,stun:0,trap:0,lift:0,hitT:0};
      drawEnemy(x,e,time);txt(x,LL(EN_TXT[S.fresh][0]),100,y+4,13,'#fff','left');y=wrap(x,LL(EN_TXT[S.fresh][1]),100,y+22,W-150,11,'#cde',15,'left');y+=6;}
    const nt=TOWER_IDS.find(k=>UNLOCK[k]===G.si&&G.si>0);
    if(nt){sec(L('🆕 새 수호탑','🆕 新守护塔'),'#ffe9a8');towerIcon(x,nt,72,y+10,.8);txt(x,LL(TW_TXT[nt][0]),100,y,13,TCOL[nt],'left');y=wrap(x,LL(TW_TXT[nt][1]),100,y+18,W-150,11,'#cde',15,'left');y+=6;}
    if(ui.newMech.length){sec(L('💡 이 지도의 장치','💡 本地图机关'),'#ffe9a8');for(const m of ui.newMech){y=wrap(x,LL(MECH_TIP[m]),48,y,W-96,11,'#dff',15,'left');y+=4;}}
    else if(G.si>0){sec(L('💡 요령','💡 提示'),'#ffe9a8');y=wrap(x,L('3웨이브마다 축복 카드를 고르고, 그때 심연도 변이해요. 변이에 맞춰 카드를 고르세요','每3波可选一张祝福卡，同时深渊也会变异。根据变异来选卡吧'),48,y,W-96,11,'#dff',15,'left');}
    btn(x,B[0],L('출격 준비','准备出击'));return;}
  if(o==='cards'){panel(x,24,120,W-48,600);txt(x,L('심연이 꿈틀거려요…','深渊在蠢动……'),W/2,150,18,'#e0b0ff','center','rgba(0,0,0,.5)');
    const m=MUTS[G.pendMut];rr(x,44,172,W-88,58,12);x.fillStyle='rgba(90,30,130,.6)';x.fill();x.strokeStyle='#b070ff';x.lineWidth=1.5;x.stroke();
    txt(x,L('이번 변이','本次变异'),62,190,10,'#d8b0ff','left');txt(x,m.ic+' '+LL(m.n),62,212,13,'#fff','left');
    txt(x,L('맞설 축복을 하나 고르세요','选择一张祝福来应对'),W/2,284,15,'#ffe9a8','center','rgba(0,0,0,.5)');txt(x,L(`수호탑 스킬 Lv${G.tier()}`,`守护塔技能 Lv${G.tier()}`),W/2,306,10,'#9fd');
    G.cards.forEach((c,i)=>{const b=B[i],p=.5+.5*Math.sin(time*3+i);rr(x,b.x,b.y,b.w,b.h,14);const gr=x.createLinearGradient(b.x,0,b.x+b.w,0);gr.addColorStop(0,'rgba(80,60,10,.95)');gr.addColorStop(1,'rgba(30,24,8,.95)');x.fillStyle=gr;x.fill();
      x.strokeStyle=`rgba(255,215,106,${.6+.4*p})`;x.lineWidth=2;x.stroke();x.fillStyle='rgba(255,215,106,.15)';x.beginPath();x.arc(b.x+48,b.y+b.h/2,30,0,7);x.fill();txt(x,BLESS[c].ic,b.x+48,b.y+b.h/2+1,28,'#fff');
      wrap(x,LL(BLESS[c].n),b.x+92,b.y+b.h/2-(LL(BLESS[c].n).length>22?8:0),b.w-108,14,'#fff6dc',18,'left');});return;}
  if(o==='pause'){panel(x,40,180,W-80,420);txt(x,L('일시정지','暂停'),W/2,214,20,'#fff');
    btn(x,B[0],L('계속하기','继续'));btn(x,B[1],L('다시 하기','重新开始'),'#6a8a9a');btn(x,B[2],L('지도로','返回地图'),'#6a8a9a');
    btn(x,B[3],L('효과음 ','音效 ')+(SV.opt.sfx?'ON':'OFF'),SV.opt.sfx?'#3fd0c0':'#555',12);btn(x,B[4],L('음악 ','音乐 ')+(SV.opt.bgm?'ON':'OFF'),SV.opt.bgm?'#3fd0c0':'#555',12);btn(x,B[5],L('언어: 한국어 → 中文','语言：中文 → 한국어'),'#6a8a9a',12);
    let y=540;const all=[...G.mutList.map(m=>[MUTS[m],'#e0b0ff']),...G.blessList.map(b=>[BLESS[b],'#ffe9a8'])];if(all.length){txt(x,L('변이·축복','变异·祝福'),W/2,y,11,'#9fd');y+=16;for(const [o2,c] of all.slice(-3)){txt(x,o2.ic+' '+LL(o2.n),W/2,y,10,c);y+=14;}}
    return;}
  if(o==='result'){const win=G.state==='win';panel(x,40,220,W-80,win&&G.si<STAGE_DEF.length-1?430:370);
    txt(x,win?L('신전을 지켰어요!','守住神殿了！'):L('신전이 함락됐어요','神殿失守了'),W/2,262,24,win?'#bfffe8':'#ffb0c8','center','rgba(0,0,0,.5)');
    if(win){const st=G.stars();for(let i=0;i<3;i++){const on=i<st;txt(x,'★',W/2-56+i*56,320,44,on?'#ffd76a':'#345','center',on?'#a06a10':null);}
      txt(x,L(`잃은 생명 ${G.lost} · 처치 ${G.kills}`,`损失生命 ${G.lost} · 击退 ${G.kills}`),W/2,368,12,'#cde');
      if(G.si===STAGE_DEF.length-1)txt(x,L('1구역 완료! 다음 구역은 준비 중이에요','第1区域完成！下一区域准备中'),W/2,396,12,'#ffe9a8');
      else txt(x,L(`다음: 수심 ${depthOf(G.si+1)}m`,`下一关：水深 ${depthOf(G.si+1)}米`),W/2,396,12,'#9fd');}
    else{txt(x,L(`웨이브 ${G.wave}/${G.S.waves}에서 무너졌어요`,`在第 ${G.wave}/${G.S.waves} 波失守`),W/2,320,13,'#cde');
      wrap(x,L('팁: 갈림길은 수문으로 긴 쪽으로 돌리고, 투명한 가오리는 해파리 등대로 드러내요','提示：用水闸把敌人引到长路，用水母灯塔显形隐身鳐鱼'),W/2,360,W-120,12,'#ffe9a8',17);}
    btn(x,B[0],L('다시','重来'),'#6a8a9a');btn(x,B[1],L('지도','地图'),'#6a8a9a');if(B[2])btn(x,B[2],L('다음 판 ▶','下一关 ▶'),'#3fd0c0',17);}
}
/* ---------- 지도(판 고르기) ---------- */
const NODE=[[118,170],[300,222],[196,282],[338,338],[124,396],[262,452],[364,510],[210,566],[96,622],[250,690]];
function drawMap(dt){
  const x=g;x.setTransform(K,0,0,K,0,0);let gr=x.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#1d6a78');gr.addColorStop(.5,'#0d3a48');gr.addColorStop(1,'#03121c');x.fillStyle=gr;x.fillRect(0,0,W,H);
  drawAmbient(x,dt,.4);drawRays(x,1.2);
  x.strokeStyle='rgba(180,140,255,.35)';x.lineWidth=3;x.setLineDash([6,8]);x.lineDashOffset=-time*20;x.beginPath();NODE.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.stroke();x.setLineDash([]);
  const cl=cleared();
  NODE.forEach((p,i)=>{const open=i<=cl,boss=i===NODE.length-1,cur=i===Math.min(cl,NODE.length-1),r=boss?30:24;
    if(cur)glow(x,p[0],p[1],r*2,'rgba(255,215,106,.5)',.6+.4*Math.sin(time*4));
    x.fillStyle=open?(boss?'#4a1f5e':'#14505e'):'#1a2a32';x.beginPath();x.arc(p[0],p[1],r,0,7);x.fill();x.strokeStyle=cur?'#ffd76a':open?'#7ff':'#3a4a52';x.lineWidth=3;x.stroke();
    txt(x,open?(boss?'👑':''+(i+1)):'🔒',p[0],p[1]+1,boss?20:16,'#fff');
    if(SV.stars[i])txt(x,'★'.repeat(SV.stars[i])+'☆'.repeat(3-SV.stars[i]),p[0],p[1]+r+10,11,'#ffd76a');
    txt(x,depthOf(i)+'m',p[0]+(p[0]<W/2?r+22:-r-22),p[1],10,'rgba(200,240,255,.6)');});
  gr=x.createLinearGradient(0,0,0,110);gr.addColorStop(0,'rgba(2,14,22,.95)');gr.addColorStop(1,'rgba(2,14,22,0)');x.fillStyle=gr;x.fillRect(0,0,W,110);
  txt(x,L('1구역','第1区域'),W/2,34,12,'#9fd');txt(x,LL(AREA_NAME),W/2,58,20,'#fff','center','rgba(0,0,0,.5)');
  const tot=SV.stars.reduce((a,b)=>a+b,0);txt(x,`★ ${tot}/30`,W/2,84,12,'#ffd76a');
  x.fillStyle='rgba(255,255,255,.15)';x.beginPath();x.arc(30,36,18,0,7);x.fill();txt(x,'‹',30,34,26,'#fff');
  txt(x,L('2구역 · 열수 분출구 — 준비 중','第2区域 · 热泉喷口 —— 准备中'),W/2,760,11,'rgba(200,180,255,.6)');
}
function tapMap(p){if(Math.hypot(p.x-30,p.y-36)<24){scr='home';sfx('tap');return;}
  const cl=cleared();NODE.forEach((q,i)=>{if(Math.hypot(p.x-q[0],p.y-q[1])<30&&i<=cl){sfx('tap');enterBattle(i);}});}
/* ---------- 홈 ---------- */
const HOME_BTN={start:{x:W/2-100,y:560,w:200,h:56},sfx:{x:W/2-150,y:650,w:94,h:38},bgm:{x:W/2-47,y:650,w:94,h:38},lang:{x:W/2+56,y:650,w:94,h:38}};
function drawHome(dt){
  const x=g;x.setTransform(K,0,0,K,0,0);let gr=x.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#2a8a98');gr.addColorStop(.4,'#0f4656');gr.addColorStop(1,'#03121c');x.fillStyle=gr;x.fillRect(0,0,W,H);
  drawRays(x,1.6);drawAmbient(x,dt,.45);
  if(Math.random()<.2)fx({k:'bub',x:Math.random()*W,y:H,v:30+Math.random()*40,s:1+Math.random()*3,ph:Math.random()*6,life:8});
  x.fillStyle='#0a2830';x.beginPath();x.moveTo(0,H);x.lineTo(0,470);x.quadraticCurveTo(80,430,120,500);x.quadraticCurveTo(150,540,225,520);x.quadraticCurveTo(300,500,330,520);x.quadraticCurveTo(380,440,W,460);x.lineTo(W,H);x.closePath();x.fill();
  x.save();x.translate(W/2,500);x.scale(2.1,2.1);x.translate(-TEMPLE.x,-TEMPLE.y);drawTemple(x,time,0);x.restore();
  drawFx(x,dt);
  glow(x,W/2,220,160,'rgba(120,255,220,.18)');
  txt(x,LL(TITLE),W/2,200,LANG==='zh'?40:36,'#eaffff','center','rgba(20,60,90,.9)',900);
  txt(x,LANG==='zh'?'深渊正在苏醒':'심연이 깨어나고 있어요',W/2,246,14,'#bfe9ff');
  const b=HOME_BTN.start;btn(x,b,L('시작하기','开始游戏'),'#3fd0c0',20);
  btn(x,HOME_BTN.sfx,L('효과음 ','音效 ')+(SV.opt.sfx?'ON':'OFF'),SV.opt.sfx?'#3a8a9a':'#555',11);btn(x,HOME_BTN.bgm,L('음악 ','音乐 ')+(SV.opt.bgm?'ON':'OFF'),SV.opt.bgm?'#3a8a9a':'#555',11);btn(x,HOME_BTN.lang,LANG==='ko'?'中文':'한국어','#3a8a9a',11);
  txt(x,'v'+BUILD,W-8,H-10,9,'rgba(255,255,255,.35)','right');
}
function tapHome(p){if(hitR(p,HOME_BTN.start)){sfx('tap');scr='map';return;}
  if(hitR(p,HOME_BTN.sfx)){SV.opt.sfx^=1;persist();}if(hitR(p,HOME_BTN.bgm)){SV.opt.bgm^=1;persist();}if(hitR(p,HOME_BTN.lang)){LANG=LANG==='ko'?'zh':'ko';SV.lang=LANG;persist();}}
/* ---------- 돌리기 ---------- */
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;time+=dt;
  for(const p of INPUT.taps.splice(0)){try{if(scr==='home')tapHome(p);else if(scr==='map')tapMap(p);else tapBattle(p);}catch(err){console.error(err);}}
  try{if(scr==='battle'){updateBattle(dt);drawBattle(dt);}else if(scr==='map'){FX.length=0;drawMap(dt);}else drawHome(dt);}catch(err){console.error(err);if(DEBUG)throw err;}
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&scr==='battle'&&G&&!ui.overlay&&G.state==='run')ui.overlay='pause';if(AC){document.hidden?AC.suspend():AC.resume();}});
window.__dbg={enter:enterBattle,get G(){return G;},get ui(){return ui;},set scr(v){scr=v;},tap:(x,y)=>INPUT.taps.push({x,y}),SV:()=>SV};
