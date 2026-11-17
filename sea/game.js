(()=>{"use strict";
/* ============================== 심해 신전 수비대 · 밸런스 표 (숫자는 여기서만 고친다) ==============================
   좌표는 논리 화면 450×800. 적은 위쪽 심연 동굴에서 나와 해구(길)를 따라 맨 아래 신전 문으로 온다. */
const W=450,H=800,TICK=60,TEMPLE={x:225,y:704};
const TOWER_IDS=['coral','bubble','jelly','conch','rune'];
/* cls: phy 물리(갑옷에 약함) · mag 마력(갑옷 무시) · exp 폭발(갑옷 절반) */
const TOWERS={
  coral: {cost:60, range:104,cd:.55,dmg:7.5, cls:'phy',proj:'spine',speed:620},
  bubble:{cost:70, range:100,cd:1.1,dmg:5,  cls:'mag',proj:'bub',  speed:300,slow:.38,slowT:1.6},
  jelly: {cost:100,range:108,cd:1.3,dmg:15, cls:'mag',chain:3,fall:.72,reveal:true},
  conch: {cost:110,range:150,cd:2.4,dmg:28, cls:'exp',proj:'shell',speed:330,aoe:42},
  rune:  {cost:90, range:92, cd:.22,dmg:2.6,cls:'mag',beam:true,aura:.15,reveal:true},
};
const LV_DMG=[1,1.75,2.7,4.1],LV_RANGE=[1,1.08,1.16,1.24],UP_COST=[.85,1.35,2.4],SELL=.7,MAX_TLV=4;   // 4단계 = 각성
const UNLOCK={coral:0,bubble:0,jelly:0,conch:2,rune:5};      // 몇 번째 판(0부터)부터 쓸 수 있는가
/* 타워 고유 스킬: 판이 지날수록 단계가 오른다(sTier = 1 + 판/3 → 1~4). 판 안의 축복 카드로 더 오른다 */
const sTierOf=i=>1+Math.floor(i/3);
const TSKILL={
  coral: t=>({every:Math.max(3,7-t),mul:2.2+.4*t,len:170}),          // 관통 가시: N발마다 일직선 관통
  bubble:t=>({cd:Math.max(4,8.5-t),dur:.9+.35*t}),                    // 거품 감옥: 가장 센 적을 가둠(받는 피해 +30%)
  jelly: t=>({cd:Math.max(6,11.5-t),dmg:16*t,stun:.35+.1*t}),         // 과충전: 범위 안 전부 감전·기절
  conch: t=>({cd:Math.max(5,10.5-t),r:40+4*t,dur:1.8+.5*t,dps:5*t,slow:.4}),   // 소용돌이: 떨어진 자리에 피해·둔화 소용돌이
  rune:  t=>({cd:Math.max(7,13.5-t),dur:1.8+.6*t,haste:.4}),          // 공명: 주변 수호탑 공격 속도 +40%
};
/* 영웅: 기갑 수호자 '가드'. 눌러서 옮기고, 아래 버튼으로 '닻 내려찍기' */
const HERO={sp:95,range:96,cd:.6,dmg:10,cls:'phy',skillCd:22,skillR:72,skillDmg:85,stun:.9,lvXp:[0,12,30,60,100]};
const heroStageMul=i=>1+.11*i;

/* 적: 심연에 물든 심해 생물. from = 몇 번째 판(0부터)부터 특기를 쓰는가 */
const ENEMIES={
  minnow:   {hp:12, sp:66,r:8, gold:2, cost:.45},                        // 그림자 치어: 떼로 빠르게
  crab:     {hp:58, sp:30,r:12,gold:6, cost:1.3,armor:.45},              // 철갑게: 물리에 강함
  eel:      {hp:36, sp:50,r:10,gold:5, cost:1,  dash:2.2,from:1},        // 전기뱀장어: 반쯤 다치면 돌진
  ray:      {hp:44, sp:46,r:13,gold:6, cost:1.25,phase:[4,2.5],from:2},  // 그림자가오리: 주기적으로 투명(해파리·룬·영웅 근처에서만 보임)
  angler:   {hp:92, sp:28,r:13,gold:11,cost:2.4,heal:[4,.08,72],from:3}, // 등불아귀: 주변 동료 회복
  squid:    {hp:72, sp:38,r:12,gold:9, cost:2,  ink:[7,100,4],from:5},   // 먹물오징어: 수호탑 시야를 가림(눌러서 닦기)
  horseshoe:{hp:125,sp:26,r:14,gold:12,cost:2.8,armor:.3,split:3,from:6},// 투구게: 쓰러지면 치어 3마리
  turtle:   {hp:300,sp:18,r:17,gold:25,cost:6,  armor:.3,shell:.3,from:7}, // 바위거북: 3초 안 맞으면 보호막 재생
  elite:    {hp:520,sp:23,r:18,gold:45,cost:11, armor:.3,leak:3},        // 심연 해마 기사
  boss:     {hp:6000,sp:12,r:30,gold:150,cost:0,armor:.2,leak:12},       // 심연 아귀왕
};
const KIND_AT={minnow:0,crab:0,eel:1,ray:2,angler:3,squid:5,horseshoe:6,turtle:7};

/* ---------- 지도: 굽은 해구. segs = 곡선 제어점, next = 다음 구간(문자) 또는 수문{g,to:[왼,오]} ----------
   cur = [구간,시작t,끝t,속도배수] 해류 띠 · vent = [구간,t] 거품 기둥 */
const LAYOUTS=[
  {name:['굽이 해구','蜿蜒海沟'],segs:{a:[[225,58],[225,128],[110,190],[95,290],[230,340],[350,400],[345,500],[200,545],[105,610],[175,670],[225,704]]},start:['a'],next:{}},
  {name:['해류 협곡','洋流峡谷'],segs:{a:[[120,58],[120,150],[300,200],[365,285],[250,350],[100,400],[88,500],[230,560],[345,620],[265,680],[225,704]]},start:['a'],next:{},cur:[['a',.2,.36,1.55],['a',.58,.72,1.55]]},
  {name:['갈림 수문','分流水闸'],segs:{a:[[225,58],[225,120],[222,196]],b:[[222,196],[110,236],[68,340],[105,440],[215,482]],c:[[222,196],[305,262],[300,402],[215,482]],
    d:[[215,482],[305,540],[315,620],[235,672],[225,704]]},start:['a'],next:{a:{g:'g1',to:['b','c']},b:'d',c:'d'}},
  {name:['쌍둥이 동굴','双子洞窟'],segs:{a:[[80,58],[82,160],[160,240],[225,300]],b:[[370,58],[378,168],[298,240],[225,300]],
    c:[[225,300],[228,360],[100,430],[118,540],[300,585],[330,652],[225,704]]},start:['a','b'],next:{a:'c',b:'c'},vent:[['c',.22],['c',.62]]},
  {name:['소용돌이 해역','漩涡海域'],segs:{a:[[225,58],[370,112],[410,250],[362,400],[232,452],[108,402],[88,272],[168,190],[292,218],[312,318],[232,362],[212,432],[198,520],[118,592],[198,662],[225,704]]},start:['a'],next:{},vent:[['a',.55]]},
  {name:['급류 갈림길','急流岔路'],segs:{a:[[225,58],[225,142]],b:[[225,142],[118,182],[66,282],[88,402],[158,462],[225,502]],c:[[225,142],[332,202],[342,332],[282,432],[225,502]],
    d:[[225,502],[148,562],[168,642],[225,704]]},start:['a'],next:{a:{g:'g1',to:['b','c']},b:'d',c:'d'},cur:[['c',.08,.92,1.6]],vent:[['d',.3]]},
  {name:['아귀왕의 둥지','鮟鱇王巢穴'],segs:{a:[[96,58],[108,150],[225,232]],b:[[354,58],[342,150],[225,232]],
    c:[[225,232],[92,300],[80,420],[225,500]],d:[[225,232],[358,300],[370,420],[225,500]],e:[[225,500],[305,572],[252,650],[225,704]]},
    start:['a','b'],next:{a:{g:'g1',to:['c','d']},b:{g:'g1',to:['c','d']},c:'e',d:'e'},vent:[['e',.35]],cur:[['c',.15,.5,1.45],['d',.5,.85,1.45]]},
];
/* 판 10개(1구역 '빛 잃은 산호 숲'). 판이 지날수록: 적 체력↑ · 시작 심연 변이↑ · 수호탑 스킬 단계↑ */
const STAGE_DEF=[
  {lay:0,mir:0,spots:9, waves:8},
  {lay:1,mir:0,spots:9, waves:8},
  {lay:2,mir:0,spots:10,waves:9},
  {lay:3,mir:0,spots:10,waves:9},
  {lay:5,mir:0,spots:10,waves:10,mid:1},
  {lay:0,mir:1,spots:10,waves:10,cur:[['a',.3,.46,1.5]],vent:[['a',.66]]},
  {lay:4,mir:0,spots:11,waves:11},
  {lay:2,mir:1,spots:11,waves:10,diff:.85,cur:[['c',.3,.7,1.35]],vent:[['d',.4],['b',.5]]},
  {lay:5,mir:1,spots:11,waves:12},
  {lay:6,mir:0,spots:12,waves:12,boss:1},
];
const AREA_NAME=['빛 잃은 산호 숲','失光珊瑚林'];
const START_LIVES=20,WAVE_GAP=9,EARLY_BONUS=3,CARD_EVERY=3;
const KEYS={start:1,every:2,max:3};      // 수문 열쇠: 처음 1개, 2웨이브마다 +1, 최대 3
const VENT={lift:1.1,cd:3.5,amp:.3};

/* 판 i 의 적 종류·숫자 */
function stageInfo(i){
  const D=STAGE_DEF[i],U=Object.keys(KIND_AT).filter(k=>KIND_AT[k]<=i&&k!=='minnow'),kinds=['minnow',...U.slice(-5)].sort((a,b)=>ENEMIES[a].cost-ENEMIES[b].cost);
  const fr=Object.keys(KIND_AT).find(k=>KIND_AT[k]===i&&i>0);if(fr){kinds.splice(kinds.indexOf(fr),1);kinds.splice(Math.min(2,kinds.length),0,fr);}
  return {i,lay:D.lay,mir:D.mir,spots:D.spots,waves:D.waves,mid:!!D.mid,boss:!!D.boss,kinds,fresh:fr||'',
    hp:(1.1+.19*i)*(D.diff||1),budget:11+i*.85,gold:200+i*12,sTier:sTierOf(i),twMul:1+.08*i,goldMul:1,startMut:Math.floor(i/3),heroMul:heroStageMul(i)};
}
function waveDef(si,w){
  const S=stageInfo(si),last=w===S.waves,budget=S.budget*(1+.33*(w-1)),ks=S.kinds.slice(0,Math.min(S.kinds.length,1+Math.ceil(w*.7))),groups=[];
  const order=ks;
  const n=w<3?1:w<6?2:3,nStart=LAYOUTS[S.lay].start.length;
  for(let j=0;j<n;j++){const k=order[(w*2+j*3+si)%order.length],E=ENEMIES[k],cnt=Math.max(1,Math.round(budget/n/E.cost));
    groups.push({k,n:cnt,gap:k==='minnow'?.32:E.cost>2.5?1.5:.75,delay:j*3.4,start:(w+j)%nStart});}
  if(S.fresh&&w===2)groups.push({k:S.fresh,n:Math.max(1,Math.round(2.6/ENEMIES[S.fresh].cost)),gap:1.4,delay:1,start:0});
  if(w%4===0&&!last&&si>=3)groups.push({k:'elite',n:1,gap:3,delay:2,start:w%nStart});
  if(last&&S.boss)groups.push({k:'boss',n:1,gap:1,delay:4,start:0});
  else if(last)groups.push({k:'elite',n:S.mid?3:1+Math.floor(si/5),gap:2.6,delay:3,start:0});
  return {w,groups,hp:S.hp*(1+.11*(w-1)),bonus:20+4*w};
}

/* ---------- 카드: 3웨이브마다 축복 1장을 고르고, 심연도 변이 1개를 얻는다 ---------- */
const BLESS={
  allDmg:  {ic:'⚔',n:['모든 수호탑 공격력 +18%','全体守护塔攻击 +18%']},
  coral:   {ic:'🪸',n:['산호 궁수 연사 +35%','珊瑚弓手射速 +35%'],need:'coral'},
  bubble:  {ic:'🫧',n:['거품 둔화 +15%, 감옥 +0.5초','泡泡减速 +15%，牢笼 +0.5秒'],need:'bubble'},
  jelly:   {ic:'⚡',n:['해파리 번개 연쇄 +2','水母闪电连锁 +2'],need:'jelly'},
  conch:   {ic:'🐚',n:['소라 대포 폭발 범위 +35%','海螺炮爆炸范围 +35%'],need:'conch'},
  rune:    {ic:'🔮',n:['룬 등불 증폭 +12%','符文灯增幅 +12%'],need:'rune'},
  skill:   {ic:'✦',n:['모든 수호탑 스킬 +1단계','全体守护塔技能 +1级']},
  gold:    {ic:'💎',n:['진주 수확: 즉시 +120, 웨이브마다 +15','珍珠收获：立即 +120，每波 +15']},
  lives:   {ic:'💗',n:['신전 수복: 생명 +5','神殿修复：生命 +5']},
  hero:    {ic:'🤖',n:['가드 강화: 공격 +50%, 스킬 쿨 -25%','卫士强化：攻击 +50%，技能冷却 -25%']},
  discount:{ic:'🏷',n:['건설·강화 비용 -15%','建造/升级费用 -15%']},
  reverse: {ic:'🌀',n:['역류: 빠른 해류가 느린 해류로','逆流：急流变缓流'],needCur:1},
  key:     {ic:'🔑',n:['수문 열쇠 +2, 최대 +1','水闸钥匙 +2，上限 +1'],needGate:1},
  vent:    {ic:'⛲',n:['거품 기둥 강화: 더 자주, 더 오래','泡泡柱强化：更频繁更持久'],needVent:1},
};
const MUTS={
  armor: {ic:'🛡',n:['단단한 껍질: 갑옷 +12%','坚硬外壳：护甲 +12%']},
  speed: {ic:'💨',n:['거센 물살: 이동 속도 +12%','汹涌水流：移速 +12%']},
  regen: {ic:'💚',n:['재생: 초당 체력 1.2% 회복','再生：每秒回复 1.2% 生命']},
  shield:{ic:'🔰',n:['심연 보호막: 체력 15% 보호막','深渊护盾：15% 生命护盾']},
  spawn: {ic:'🥚',n:['포자: 쓰러지면 30% 확률로 치어','孢子：倒下时 30% 几率生出小鱼']},
  shadow:{ic:'👁',n:['그림자 물듦: 일부가 주기적으로 투명','暗影侵染：部分敌人周期性隐身']},
  hp:    {ic:'❤',n:['비대화: 체력 +15%','巨大化：生命 +15%']},
};
const MUT_ORDER=['hp','armor','speed','shield','regen','spawn','shadow'];
/* 정해진 씨앗으로 고른다(무작위지만 같은 판은 항상 같은 순서) */
function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}

/* ============================== 게임 규칙: 화면·소리를 모르고 1/60초 고정 틱으로 돈다 (봇이 Node 에서 그대로 실행) ============================== */
const DT=1/TICK;
const dist=(a,b,c,d)=>Math.hypot(a-c,b-d);
/* ---------- 곡선 길 ---------- */
function catmull(pts){
  const out=[],P=[pts[0],...pts,pts[pts.length-1]];
  for(let i=1;i<P.length-2;i++){const p0=P[i-1],p1=P[i],p2=P[i+1],p3=P[i+2],n=Math.max(2,Math.ceil(dist(p1[0],p1[1],p2[0],p2[1])/4));
    for(let j=0;j<n;j++){const t=j/n,t2=t*t,t3=t2*t,f=k=>.5*(2*p1[k]+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3);out.push([f(0),f(1)]);}}
  out.push(pts[pts.length-1].slice());return out;
}
function mkSeg(id,pts){const p=catmull(pts),cum=[0];for(let i=1;i<p.length;i++)cum.push(cum[i-1]+dist(p[i-1][0],p[i-1][1],p[i][0],p[i][1]));return {id,p,cum,len:cum[cum.length-1]};}
function segPos(S,d){
  const c=S.cum;if(d<=0)return {x:S.p[0][0],y:S.p[0][1],a:Math.atan2(S.p[1][1]-S.p[0][1],S.p[1][0]-S.p[0][0])};
  if(d>=S.len){const n=S.p.length;return {x:S.p[n-1][0],y:S.p[n-1][1],a:Math.atan2(S.p[n-1][1]-S.p[n-2][1],S.p[n-1][0]-S.p[n-2][0])};}
  let lo=0,hi=c.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(c[m]<=d)lo=m;else hi=m;}
  const a=S.p[lo],b=S.p[hi],f=(d-c[lo])/((c[hi]-c[lo])||1);return {x:a[0]+(b[0]-a[0])*f,y:a[1]+(b[1]-a[1])*f,a:Math.atan2(b[1]-a[1],b[0]-a[0])};
}
const MAPS={};
function buildMap(si){
  if(MAPS[si])return MAPS[si];
  const S=stageInfo(si),Ldef=LAYOUTS[S.lay],D=STAGE_DEF[si],mx=x=>S.mir?W-x:x,segs={};
  for(const id in Ldef.segs)segs[id]=mkSeg(id,Ldef.segs[id].map(q=>[mx(q[0]),q[1]]));
  const gates={};
  for(const id in Ldef.next){const n=Ldef.next[id];if(typeof n==='object'){const e=segs[id].p[segs[id].p.length-1];
    if(!gates[n.g])gates[n.g]={g:n.g,x:e[0],y:e[1],to:n.to.slice(),st:0};}}
  const cur=[...(Ldef.cur||[]),...(D.cur||[])].map(c=>({seg:c[0],d0:c[1]*segs[c[0]].len,d1:c[2]*segs[c[0]].len,mul:c[3]}));
  const vents=[...(Ldef.vent||[]),...(D.vent||[])].map(v=>{const P=segPos(segs[v[0]],v[1]*segs[v[0]].len);return {seg:v[0],d:v[1]*segs[v[0]].len,x:P.x,y:P.y,cd:0};});
  /* 수호탑 자리: 길에서 적당히 떨어진 바위 위, 길을 많이 덮는 곳부터 고른다 */
  const pts=[];for(const id in segs){const s=segs[id];for(let i=0;i<s.p.length;i+=2)pts.push(s.p[i]);}
  const cov=pts.filter((_,i)=>i%2===0),cnt=new Array(cov.length).fill(0),spots=[],caves=Ldef.start.map(id=>segs[id].p[0]);
  const cands=[];
  for(let y=84;y<=680;y+=6)for(let x=26;x<=424;x+=6){
    let md=1e9;for(const p of pts){const d=(p[0]-x)*(p[0]-x)+(p[1]-y)*(p[1]-y);if(d<md)md=d;}md=Math.sqrt(md);
    if(md<38||md>60||dist(x,y,TEMPLE.x,TEMPLE.y)<100||(Math.abs(x-TEMPLE.x)<92&&y>TEMPLE.y-118)||caves.some(c=>dist(x,y,c[0],c[1])<50)||Object.values(gates).some(g=>dist(x,y,g.x,g.y)<34))continue;
    const near=[];cov.forEach((p,i)=>{if(dist(x,y,p[0],p[1])<105)near.push(i);});cands.push({x,y,near});
  }
  for(let k=0;k<S.spots;k++){
    let best=null,bs=-1;
    for(const c of cands){if(spots.some(s=>dist(s.x,s.y,c.x,c.y)<58))continue;let sc=0;for(const i of c.near)sc+=1/(1+cnt[i]*1.6);if(sc>bs){bs=sc;best=c;}}
    if(!best)break;spots.push({x:best.x,y:best.y});for(const i of best.near)cnt[i]++;
  }
  return MAPS[si]={si,name:Ldef.name,segs,start:Ldef.start,next:Ldef.next,gates,cur,vents,spots,caves};
}

/* ---------- 한 판 ---------- */
class Game{
  constructor(si){
    const S=this.S=stageInfo(si);this.si=si;this.M=buildMap(si);
    for(const g in this.M.gates)this.M.gates[g].st=0;for(const v of this.M.vents)v.cd=0;
    this.t=0;this.gold=S.gold;this.lives=START_LIVES;this.lost=0;this.wave=0;this.nextT=0;this.spawning=false;this.spawnQ=[];
    this.towers=[];this.enemies=[];this.projs=[];this.zones=[];this.ev=[];this.uid=1;this.kills=0;
    this.rnd=rng(9001+si*7919);this.state='prep';this.cardedAt=0;this.cards=null;this.pendMut=null;
    this.mut={hp:0,armor:0,speed:0,shield:0,regen:0,spawn:0,shadow:0};this.mutList=[];
    this.B={dmg:0,coral:0,bubSlow:0,trap:0,chain:0,conchR:0,aura:0,tier:0,waveGold:0,hero:0,heroCd:1,disc:0,rev:false,ventCd:1,ventLift:0};this.blessList=[];
    this.hasGate=Object.keys(this.M.gates).length>0;this.hasCur=this.M.cur.length>0;this.hasVent=this.M.vents.length>0;
    this.keys=this.hasGate?KEYS.start:0;this.keyMax=KEYS.max;
    for(let i=0;i<S.startMut;i++)this.addMut(this.pickMut());
    this.hero={x:TEMPLE.x,y:TEMPLE.y-104,tx:null,ty:null,lv:1,xp:0,cd:0,sc:0,face:1,atk:0,moving:false};
  }
  /* ---- 계산 ---- */
  tier(){return this.S.sTier+this.B.tier;}
  cost(k){return Math.round(TOWERS[k].cost*(1-this.B.disc));}
  upCost(t){return t.lv>=MAX_TLV?0:Math.round(TOWERS[t.k].cost*UP_COST[t.lv-1]*(1-this.B.disc));}
  sellVal(t){return Math.round(t.spent*SELL);}
  unlocked(k){return UNLOCK[k]<=this.si;}
  range(t){return TOWERS[t.k].range*LV_RANGE[t.lv-1]*(t.ink>0?.6:1);}
  dmg(t){return TOWERS[t.k].dmg*LV_DMG[t.lv-1]*this.S.twMul*(1+this.B.dmg)*(1+t.aura);}
  rate(t){return TOWERS[t.k].cd/(1+t.haste+(t.k==='coral'?this.B.coral:0))*(t.ink>0?1.5:1);}
  heroDmg(){return HERO.dmg*this.S.heroMul*(1+.22*(this.hero.lv-1))*(1+this.B.hero);}
  visible(e){return !e.inv||e.rev;}
  /* ---- 조작 ---- */
  build(spot,k){const c=this.cost(k);if(this.gold<c||!this.unlocked(k)||this.towers.some(t=>t.spot===spot))return false;
    const s=this.M.spots[spot],t={id:this.uid++,k,lv:1,x:s.x,y:s.y,spot,cd:.2,sc:0,shots:0,ink:0,haste:0,hasteT:0,aura:0,kick:0,ang:-Math.PI/2,spent:c,whirl:false,beam:0};
    t.sc=this.skillCdOf(t)*.5;this.gold-=c;this.towers.push(t);this.ev.push({t:'build',x:s.x,y:s.y,k});return true;}
  upgrade(t){const c=this.upCost(t);if(!c||this.gold<c)return false;this.gold-=c;t.spent+=c;t.lv++;this.ev.push({t:'up',x:t.x,y:t.y,k:t.k});return true;}
  sell(t){this.gold+=this.sellVal(t);this.towers=this.towers.filter(x=>x!==t);this.ev.push({t:'sell',x:t.x,y:t.y});}
  clean(t){if(t.ink>0){t.ink=0;this.ev.push({t:'clean',x:t.x,y:t.y});return true;}return false;}
  flipGate(g){const G=this.M.gates[g];if(!G||this.keys<=0)return false;this.keys--;G.st^=1;G.flash=1;this.ev.push({t:'gate',x:G.x,y:G.y});return true;}
  moveHero(x,y){const h=this.hero;h.tx=Math.max(20,Math.min(W-20,x));h.ty=Math.max(70,Math.min(700,y));}
  heroSkill(){const h=this.hero;if(h.sc>0||this.state!=='run')return false;
    const dm=HERO.skillDmg*this.S.heroMul*(1+.22*(h.lv-1))*(1+this.B.hero);
    for(const e of this.enemies)if(!e.dead&&dist(e.x,e.y,h.x,h.y)<HERO.skillR+e.r){this.hurt(e,dm,'exp');e.stun=Math.max(e.stun,e.k==='boss'?.3:HERO.stun);}
    h.sc=HERO.skillCd*this.B.heroCd;this.ev.push({t:'slam',x:h.x,y:h.y,r:HERO.skillR});return true;}
  callWave(){if(this.state==='prep'){this.requestWave();return true;}
    if(this.state!=='run'||this.spawning||this.wave>=this.S.waves)return false;
    if(this.nextT>0)this.gold+=Math.ceil(this.nextT)*EARLY_BONUS;this.requestWave();return true;}
  requestWave(){
    if(this.wave>0&&this.wave%CARD_EVERY===0&&this.cardedAt!==this.wave){this.cardedAt=this.wave;this.cards=this.genCards();this.pendMut=this.pickMut();this.state='card';this.ev.push({t:'cards'});return;}
    this.startWave();
  }
  pickCard(i){if(this.state!=='card')return;const k=this.cards[i];this.applyBless(k);this.addMut(this.pendMut);this.cards=null;this.state='run';this.startWave();}
  /* ---- 카드 ---- */
  pickMut(){const cand=MUT_ORDER.filter(k=>!((k==='shadow'||k==='spawn')&&this.mut[k]>=2));return cand[Math.floor(this.rnd()*cand.length)];}
  addMut(k){this.mut[k]++;this.mutList.push(k);this.ev.push({t:'mut',k});}
  genCards(){
    const ok=Object.keys(BLESS).filter(k=>{const b=BLESS[k];if(b.need&&!this.unlocked(b.need))return false;if(b.needCur&&(!this.hasCur||this.B.rev))return false;
      if(b.needGate&&!this.hasGate)return false;if(b.needVent&&!this.hasVent)return false;if(k==='discount'&&this.B.disc>=.44)return false;return true;});
    const out=[];while(out.length<3&&ok.length){const j=Math.floor(this.rnd()*ok.length);out.push(ok.splice(j,1)[0]);}return out;
  }
  applyBless(k){const B=this.B;this.blessList.push(k);
    switch(k){case'allDmg':B.dmg+=.18;break;case'coral':B.coral+=.35;break;case'bubble':B.bubSlow+=.15;B.trap+=.5;break;case'jelly':B.chain+=2;break;
      case'conch':B.conchR+=.35;break;case'rune':B.aura+=.12;break;case'skill':B.tier++;break;case'gold':this.gold+=120;B.waveGold+=15;break;
      case'lives':this.lives+=5;break;case'hero':B.hero+=.5;B.heroCd*=.75;break;case'discount':B.disc+=.15;break;case'reverse':B.rev=true;break;
      case'key':this.keyMax++;this.keys=Math.min(this.keyMax,this.keys+2);break;case'vent':B.ventCd*=.6;B.ventLift+=.5;break;}}
  /* ---- 파도 ---- */
  startWave(){
    this.wave++;const W_=waveDef(this.si,this.wave);this.state='run';this.spawning=true;this.nextT=0;
    if(this.wave>1)this.gold+=W_.bonus+this.B.waveGold;
    if(this.hasGate&&this.wave>1&&this.wave%KEYS.every===0)this.keys=Math.min(this.keyMax,this.keys+1);
    let gi=0,changed=false;for(const g in this.M.gates){const G=this.M.gates[g],st=Math.floor((this.wave-1)/2+gi)%2;if(st!==G.st){G.st=st;G.flash=1;changed=true;}gi++;}
    for(const gr of W_.groups)for(let j=0;j<gr.n;j++)this.spawnQ.push({k:gr.k,at:this.t+gr.delay+gr.gap*j,start:gr.start,hp:W_.hp});
    this.spawnQ.sort((a,b)=>a.at-b.at);this.ev.push({t:'wave',w:this.wave,boss:W_.groups.some(g=>g.k==='boss'),cur:changed});
  }
  spawn(k,start,hpm,at){
    const E=ENEMIES[k],M=this.M,boss=k==='boss',elite=k==='elite';
    let mhp=E.hp*(boss?this.S.hp:hpm)*(1+.15*this.mut.hp);
    const e={id:this.uid++,k,mhp,hp:mhp,sp:E.sp*(1+.12*this.mut.speed),r:E.r,armor:Math.min(.75,(E.armor||0)+.12*this.mut.armor),seg:at?at.seg:M.start[start],d:at?at.d:0,prog:at?at.prog:0,
      x:0,y:0,a:0,slow:0,slowT:0,stun:0,trap:0,lift:0,dashT:0,dashed:false,inv:false,rev:false,phT:0,phase:null,hT:2,iT:3,lastHit:9,shield:0,shellMax:0,spawnT:at?.2:.7,leak:E.leak||(E.cost>=5?2:1),dead:false,hitT:0,bossPh:0};
    e.shield=mhp*.15*this.mut.shield*(boss?.5:1);
    if(E.phase)e.phase=E.phase;else if(this.mut.shadow&&!boss&&!elite&&this.rnd()<.12+.13*this.mut.shadow)e.phase=[4.5,2.2];
    if(e.phase)e.phT=e.phase[0]*this.rnd();
    if(E.shell){e.shellMax=mhp*E.shell;e.shield+=e.shellMax;}
    if(at){e.d+=(this.rnd()-.5)*20;}
    const P=segPos(M.segs[e.seg],e.d);e.x=P.x;e.y=P.y;e.a=P.a;this.enemies.push(e);return e;
  }
  /* ---- 피해 ---- */
  hurt(e,d,cls){
    if(e.dead)return;const eff=cls==='phy'?e.armor:cls==='exp'?e.armor*.5:0;d*=(1-eff);if(e.trap>0||e.lift>0)d*=1+VENT.amp;
    e.lastHit=0;e.hitT=.12;if(e.shield>0){const a=Math.min(e.shield,d);e.shield-=a;d-=a;}
    e.hp-=d;if(e.hp<=0)this.kill(e);
  }
  kill(e){
    e.dead=true;const E=ENEMIES[e.k],gg=Math.round(E.gold*this.S.goldMul);this.gold+=gg;this.kills++;this.ev.push({t:'kill',x:e.x,y:e.y,k:e.k,g:gg});
    const h=this.hero;h.xp+=E.cost||8;while(h.lv<HERO.lvXp.length&&h.xp>=HERO.lvXp[h.lv]){h.lv++;this.ev.push({t:'hlv',x:h.x,y:h.y});}
    const at={seg:e.seg,d:e.d,prog:e.prog};
    if(E.split)for(let i=0;i<E.split;i++)this.spawn('minnow',0,e.mhp/E.hp*.9,at);
    else if(this.mut.spawn&&e.k!=='minnow'&&this.rnd()<.15+.15*this.mut.spawn)this.spawn('minnow',0,e.mhp/E.hp*.9,at);
  }
  /* ---- 한 틱 ---- */
  tick(){
    if(this.state!=='run')return;const dt=DT;this.t+=dt;const M=this.M,B=this.B;
    while(this.spawnQ.length&&this.spawnQ[0].at<=this.t){const q=this.spawnQ.shift();this.spawn(q.k,q.start,q.hp);}
    if(this.spawning&&!this.spawnQ.length){this.spawning=false;if(this.wave<this.S.waves)this.nextT=WAVE_GAP;}
    if(!this.spawning&&this.nextT>0){this.nextT-=dt;if(this.nextT<=0){this.nextT=0;this.requestWave();if(this.state!=='run')return;}}
    for(const v of M.vents)if(v.cd>0)v.cd-=dt;
    for(const g in M.gates)if(M.gates[g].flash>0)M.gates[g].flash-=dt;
    /* 적 */
    for(const e of this.enemies){
      if(e.dead)continue;const E=ENEMIES[e.k];
      if(e.spawnT>0)e.spawnT-=dt;if(e.hitT>0)e.hitT-=dt;e.lastHit+=dt;
      if(e.slowT>0){e.slowT-=dt;if(e.slowT<=0)e.slow=0;}
      if(e.stun>0)e.stun-=dt;if(e.trap>0)e.trap-=dt;if(e.lift>0)e.lift-=dt;if(e.dashT>0)e.dashT-=dt;
      if(this.mut.regen&&e.hp<e.mhp)e.hp=Math.min(e.mhp,e.hp+e.mhp*.012*this.mut.regen*dt);
      if(e.shellMax&&e.lastHit>3&&e.shield<e.shellMax){e.shield=e.shellMax;this.ev.push({t:'shell',x:e.x,y:e.y});}
      if(e.phase){e.phT+=dt;const cyc=e.phase[0]+e.phase[1],m=e.phT%cyc;const inv=m>e.phase[0];if(inv!==e.inv){e.inv=inv;}}
      if(E.dash&&!e.dashed&&e.hp<e.mhp*.55){e.dashed=true;e.dashT=1.4;this.ev.push({t:'dash',x:e.x,y:e.y});}
      if(E.heal&&this.si>=(E.from||0)){e.hT-=dt;if(e.hT<=0){e.hT=E.heal[0];let n=0;for(const o of this.enemies)if(!o.dead&&o!==e&&o.k!=='boss'&&dist(o.x,o.y,e.x,e.y)<E.heal[2]&&o.hp<o.mhp){o.hp=Math.min(o.mhp,o.hp+o.mhp*E.heal[1]);n++;}if(n)this.ev.push({t:'heal',x:e.x,y:e.y,r:E.heal[2]});}}
      if(E.ink){e.iT-=dt;if(e.iT<=0){let bt=null,bd=E.ink[1];for(const t of this.towers){const d=dist(t.x,t.y,e.x,e.y);if(d<bd&&t.ink<=0){bd=d;bt=t;}}
        if(bt){bt.ink=E.ink[2];e.iT=E.ink[0];this.ev.push({t:'ink',x:e.x,y:e.y,tx:bt.x,ty:bt.y});}else e.iT=1;}}
      if(e.k==='boss'){const f=e.hp/e.mhp;
        if(e.bossPh===0&&f<.7){e.bossPh=1;for(let i=0;i<7;i++)this.spawn('minnow',0,this.S.hp*1.3,{seg:e.seg,d:e.d+10,prog:e.prog});this.ev.push({t:'roar',x:e.x,y:e.y});}
        else if(e.bossPh===1&&f<.45){e.bossPh=2;for(const t of this.towers)t.ink=3.5;this.ev.push({t:'dark',x:e.x,y:e.y});}
        else if(e.bossPh===2&&f<.22){e.bossPh=3;for(let i=0;i<2;i++)this.spawn('elite',0,this.S.hp*.6,{seg:e.seg,d:e.d+16,prog:e.prog});this.ev.push({t:'roar',x:e.x,y:e.y});}}
      if(e.stun>0||e.trap>0||e.lift>0)continue;
      let v=e.sp*(1-e.slow)*(e.dashT>0?E.dash:1);
      for(const c of M.cur)if(c.seg===e.seg&&e.d>=c.d0&&e.d<=c.d1){v*=(B.rev&&c.mul>1)?.62:c.mul;break;}
      if(e.spawnT>0)v*=.5;
      const d0=e.d;e.d+=v*dt;e.prog+=v*dt;
      if(e.k!=='boss')for(const vt of M.vents)if(vt.seg===e.seg&&d0<vt.d&&e.d>=vt.d&&vt.cd<=0){e.lift=(VENT.lift+B.ventLift)*(e.k==='elite'?.5:1);vt.cd=VENT.cd*B.ventCd;this.ev.push({t:'vent',x:vt.x,y:vt.y});}
      let S=M.segs[e.seg];
      while(e.d>=S.len){const nx=M.next[e.seg];
        if(!nx){this.leak(e);break;}
        const ns=typeof nx==='string'?nx:nx.to[M.gates[nx.g].st];e.d-=S.len;e.seg=ns;S=M.segs[ns];}
      if(e.dead)continue;const P=segPos(S,e.d);e.x=P.x;e.y=P.y;e.a=P.a;
    }
    /* 드러내기: 해파리·룬·영웅 근처의 투명한 적은 보인다 */
    for(const e of this.enemies){if(!e.inv){e.rev=false;continue;}e.rev=dist(e.x,e.y,this.hero.x,this.hero.y)<HERO.range;
      if(!e.rev)for(const t of this.towers)if(TOWERS[t.k].reveal&&dist(t.x,t.y,e.x,e.y)<this.range(t)){e.rev=true;break;}}
    /* 수호탑 */
    for(const t of this.towers){t.aura=0;}
    for(const r of this.towers)if(r.k==='rune'){const a=TOWERS.rune.aura+.05*(r.lv-1)+B.aura,rr=this.range(r);for(const t of this.towers)if(t!==r&&dist(t.x,t.y,r.x,r.y)<rr)t.aura=Math.max(t.aura,a);}
    for(const t of this.towers)this.towerTick(t,dt);
    /* 투사체 */
    for(const p of this.projs){const tg=p.tid?this.enemies.find(e=>e.id===p.tid&&!e.dead):null;if(tg){p.tx=tg.x;p.ty=tg.y;}
      const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy),st=p.sp*dt;
      if(d<=st+3){p.dead=true;this.impact(p,tg);}else{p.x+=dx/d*st;p.y+=dy/d*st;p.a=Math.atan2(dy,dx);}}
    this.projs=this.projs.filter(p=>!p.dead);
    /* 소용돌이 */
    for(const z of this.zones){z.t-=dt;for(const e of this.enemies)if(!e.dead&&dist(e.x,e.y,z.x,z.y)<z.r+e.r){this.hurt(e,z.dps*dt,'mag');if(e.k!=='boss'){e.slow=Math.max(e.slow,z.slow);e.slowT=Math.max(e.slowT,.2);}}}
    this.zones=this.zones.filter(z=>z.t>0);
    /* 영웅 */
    this.heroTick(dt);
    this.enemies=this.enemies.filter(e=>!e.dead);
    if(this.lives<=0){this.lives=0;this.state='lose';this.ev.push({t:'lose'});return;}
    if(this.wave>=this.S.waves&&!this.spawning&&!this.spawnQ.length&&!this.enemies.length){this.state='win';this.ev.push({t:'win'});}
  }
  leak(e){e.dead=true;this.lives-=e.leak;this.lost+=e.leak;this.ev.push({t:'leak',x:e.x,y:e.y,n:e.leak});}
  stars(){return this.state!=='win'?0:this.lost===0?3:this.lost<=5?2:1;}
  skillCdOf(t){const T=this.tier(),f=TSKILL[t.k](T);return f.cd||5;}
  target(t,r){let best=null,bp=-1;for(const e of this.enemies){if(e.dead||!this.visible(e)||e.spawnT>.45)continue;if(dist(e.x,e.y,t.x,t.y)<r+e.r*.5&&e.prog>bp){bp=e.prog;best=e;}}return best;}
  towerTick(t,dt){
    const T=TOWERS[t.k],tier=this.tier(),SK=TSKILL[t.k](tier),r=this.range(t);
    if(t.ink>0)t.ink-=dt;if(t.kick>0)t.kick-=dt*4;if(t.hasteT>0){t.hasteT-=dt;if(t.hasteT<=0)t.haste=0;}if(t.beam>0)t.beam-=dt;
    t.cd-=dt;if(SK.cd)t.sc-=dt;
    const tg=this.target(t,r);if(tg)t.ang=Math.atan2(tg.y-t.y,tg.x-t.x);
    /* 스킬 */
    if(SK.cd&&t.sc<=0){
      if(t.k==='bubble'){let b=null;for(const e of this.enemies)if(!e.dead&&e.k!=='boss'&&e.trap<=0&&dist(e.x,e.y,t.x,t.y)<r&&(!b||e.hp>b.hp))b=e;
        if(b){b.trap=(SK.dur+this.B.trap)*(b.k==='elite'?.5:1);t.sc=SK.cd;this.ev.push({t:'trap',x:b.x,y:b.y,id:b.id});}}
      else if(t.k==='jelly'){const hit=this.enemies.filter(e=>!e.dead&&dist(e.x,e.y,t.x,t.y)<r+e.r);
        if(hit.length>=2||hit.some(e=>e.k==='elite'||e.k==='boss')){const dm=SK.dmg*LV_DMG[t.lv-1]*this.S.twMul*(1+this.B.dmg);for(const e of hit){this.hurt(e,dm,'mag');if(!e.dead)e.stun=Math.max(e.stun,e.k==='boss'?.1:SK.stun);}
          t.sc=SK.cd;this.ev.push({t:'storm',x:t.x,y:t.y,r});}}
      else if(t.k==='conch'){if(!t.whirl&&tg){t.whirl=true;t.sc=SK.cd;}}
      else if(t.k==='rune'){if(tg){for(const o of this.towers)if(dist(o.x,o.y,t.x,t.y)<r+8){o.haste=SK.haste;o.hasteT=SK.dur;}t.sc=SK.cd;this.ev.push({t:'reso',x:t.x,y:t.y,r});}}
    }
    if(!tg||t.cd>0)return;
    t.cd=this.rate(t);t.kick=1;const dm=this.dmg(t);
    if(t.k==='jelly'){const pts=[[t.x,t.y-14]],hit=new Set();let cur=tg,dd=dm,n=T.chain+this.B.chain;
      while(cur&&n>0){hit.add(cur.id);pts.push([cur.x,cur.y]);this.hurt(cur,dd,'mag');dd*=T.fall;n--;
        let nx=null,nd=72;for(const e of this.enemies)if(!e.dead&&!hit.has(e.id)&&this.visible(e)){const d=dist(e.x,e.y,cur.x,cur.y);if(d<nd){nd=d;nx=e;}}cur=nx;}
      this.ev.push({t:'zap',pts});return;}
    if(t.k==='rune'){this.hurt(tg,dm,'mag');t.beam=.12;t.beamX=tg.x;t.beamY=tg.y;return;}
    if(t.k==='coral'){t.shots++;if(t.shots%SK.every===0){const a=t.ang,x2=t.x+Math.cos(a)*SK.len,y2=t.y+Math.sin(a)*SK.len;
      for(const e of this.enemies){if(e.dead)continue;const px=e.x-t.x,py=e.y-t.y,u=Math.max(0,Math.min(SK.len,px*Math.cos(a)+py*Math.sin(a))),qx=t.x+Math.cos(a)*u,qy=t.y+Math.sin(a)*u;
        if(dist(e.x,e.y,qx,qy)<e.r+8)this.hurt(e,dm*SK.mul,'phy');}
      this.ev.push({t:'pierce',x:t.x,y:t.y,x2,y2});return;}}
    this.projs.push({kind:T.proj,x:t.x,y:t.y-16,tx:tg.x,ty:tg.y,tid:tg.id,sp:T.speed,dmg:dm,cls:T.cls,from:t.k,lv:t.lv,a:t.ang,whirl:t.k==='conch'&&t.whirl});
    if(t.k==='conch')t.whirl=false;
  }
  impact(p,tg){
    if(p.kind==='shell'){const R=TOWERS.conch.aoe*(1+this.B.conchR);for(const e of this.enemies)if(!e.dead&&dist(e.x,e.y,p.tx,p.ty)<R+e.r)this.hurt(e,dist(e.x,e.y,p.tx,p.ty)<R*.5?p.dmg:p.dmg*.7,'exp');
      this.ev.push({t:'boom',x:p.tx,y:p.ty,r:R});
      if(p.whirl){const SK=TSKILL.conch(this.tier());this.zones.push({x:p.tx,y:p.ty,r:SK.r,t:SK.dur,T:SK.dur,dps:SK.dps*LV_DMG[p.lv-1]*this.S.twMul*(1+this.B.dmg),slow:SK.slow});this.ev.push({t:'whirl',x:p.tx,y:p.ty});}
      return;}
    if(!tg)return;
    if(p.kind==='bub'){this.hurt(tg,p.dmg,'mag');if(!tg.dead&&tg.k!=='boss'){tg.slow=Math.max(tg.slow,TOWERS.bubble.slow+this.B.bubSlow);tg.slowT=TOWERS.bubble.slowT;}this.ev.push({t:'pop',x:tg.x,y:tg.y});return;}
    this.hurt(tg,p.dmg,p.cls);this.ev.push({t:'hit',x:tg.x,y:tg.y,k:p.kind});
  }
  heroTick(dt){
    const h=this.hero;if(h.sc>0)h.sc-=dt;if(h.atk>0)h.atk-=dt*4;h.moving=false;
    if(h.tx!==null){const dx=h.tx-h.x,dy=h.ty-h.y,d=Math.hypot(dx,dy),st=HERO.sp*dt;if(d<=st){h.x=h.tx;h.y=h.ty;h.tx=null;}else{h.x+=dx/d*st;h.y+=dy/d*st;h.face=dx>=0?1:-1;h.moving=true;}}
    h.cd-=dt;if(h.cd>0)return;
    let best=null,bd=HERO.range;for(const e of this.enemies){if(e.dead||e.spawnT>.45)continue;const d=dist(e.x,e.y,h.x,h.y);if(d<bd+e.r*.5&&(!best||e.prog>best.prog)){best=e;}}
    if(!best)return;h.cd=HERO.cd;h.atk=1;h.face=best.x>=h.x?1:-1;
    this.projs.push({kind:'bolt',x:h.x+h.face*10,y:h.y-12,tx:best.x,ty:best.y,tid:best.id,sp:700,dmg:this.heroDmg(),cls:'phy',from:'hero',lv:1,a:0});
  }
}

/* ============================== 플랫폼 층: 화면·터치·저장·언어·소리 (위챗·더우인 이식 때 이 파일만 손본다) ============================== */
const BUILD='1117-1558';
const VW=750,VH=1334,K=VW/W;
const cv=document.getElementById('game');const g=cv.getContext('2d');cv.width=VW;cv.height=VH;
function mkCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function safeCtx(x){const a=x.arc.bind(x);x.arc=(p,q,r,s,e,c)=>a(p,q,r>0?r:0,s,e,c);const el=x.ellipse.bind(x);x.ellipse=(p,q,rx,ry,ro,s,e,c)=>el(p,q,rx>0?rx:0,ry>0?ry:0,ro,s,e,c);return x;}
safeCtx(g);
const QS=new URLSearchParams(location.search),DEBUG=QS.get('debug')==='1';
/* ---------- 저장 ---------- */
const SAVE_KEY='deepsea_v1';
const DEF={stars:STAGE_DEF.map(()=>0),opt:{bgm:1,sfx:1,fast:0},lang:'',seen:{},sel:0};
function loadSave(){let o=null;try{o=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}catch(e){}const s=JSON.parse(JSON.stringify(DEF));
  if(o&&typeof o==='object'){if(Array.isArray(o.stars))o.stars.forEach((v,i)=>{if(i<s.stars.length)s.stars[i]=+v||0;});if(o.opt)Object.assign(s.opt,o.opt);if(o.seen)s.seen=o.seen;if(typeof o.lang==='string')s.lang=o.lang;s.sel=+o.sel||0;}
  return s;}
let SV=loadSave();
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(SV));}catch(e){}}
const cleared=()=>{let n=0;while(n<SV.stars.length&&SV.stars[n]>0)n++;return n;};
/* ---------- 언어: 한국어 기기면 한국어, 그 밖은 중국어 ---------- */
let LANG=(()=>{const q=QS.get('lang');if(q==='zh'||q==='ko')return q;if(SV.lang==='zh'||SV.lang==='ko')return SV.lang;
  const l=navigator.language||'';return /^ko/i.test(l)?'ko':'zh';})();
const LL=a=>a[LANG==='zh'?1:0],L=(ko,zh)=>LANG==='zh'?zh:ko;
const FONT='"PingFang SC","Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic","Microsoft YaHei",sans-serif';
/* ---------- 터치 ---------- */
const INPUT={down:null,taps:[]};
function toLogic(ev){const r=cv.getBoundingClientRect();return {x:(ev.clientX-r.left)/r.width*W,y:(ev.clientY-r.top)/r.height*H};}
cv.addEventListener('pointerdown',ev=>{ev.preventDefault();unlockAudio();const p=toLogic(ev);INPUT.down={x:p.x,y:p.y,t:performance.now()};});
cv.addEventListener('pointerup',ev=>{ev.preventDefault();const p=toLogic(ev),d=INPUT.down;INPUT.down=null;if(d&&Math.hypot(p.x-d.x,p.y-d.y)<26)INPUT.taps.push(p);});
cv.addEventListener('contextmenu',e=>e.preventDefault());
/* ---------- 소리: 전부 코드로 합성 (음원 파일 없음) ---------- */
let AC=null,MG=null,BG=null;
function unlockAudio(){if(AC){if(AC.state==='suspended')AC.resume();return;}try{AC=new (window.AudioContext||window.webkitAudioContext)();MG=AC.createGain();MG.gain.value=.55;MG.connect(AC.destination);
  BG=AC.createGain();BG.gain.value=SV.opt.bgm?.22:0;BG.connect(MG);startMusic();}catch(e){AC=null;}}
function tone(f,dur,type,vol,slide,delay){if(!AC||!SV.opt.sfx)return;const t0=AC.currentTime+(delay||0),o=AC.createOscillator(),gn=AC.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t0);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),t0+dur);gn.gain.setValueAtTime(0,t0);gn.gain.linearRampToValueAtTime(vol||.2,t0+.008);gn.gain.exponentialRampToValueAtTime(.001,t0+dur);
  o.connect(gn);gn.connect(MG);o.start(t0);o.stop(t0+dur+.02);}
function noise(dur,vol,fc){if(!AC||!SV.opt.sfx)return;const n=Math.floor(AC.sampleRate*dur),b=AC.createBuffer(1,n,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
  const s=AC.createBufferSource(),f=AC.createBiquadFilter(),gn=AC.createGain();s.buffer=b;f.type='lowpass';f.frequency.value=fc||900;gn.gain.value=vol||.2;s.connect(f);f.connect(gn);gn.connect(MG);s.start();}
const sfxGate={};
function sfx(n){if(!AC||!SV.opt.sfx)return;const now=performance.now();if(sfxGate[n]&&now-sfxGate[n]<45)return;sfxGate[n]=now;
  switch(n){
    case'spine':tone(900,.06,'triangle',.06,1.6);break;
    case'bub':tone(420,.12,'sine',.08,2.2);break;
    case'zap':noise(.09,.07,4000);tone(1400,.07,'square',.03,.5);break;
    case'shell':tone(160,.2,'triangle',.12,.5);break;
    case'boom':noise(.25,.18,700);tone(90,.25,'sine',.18,.5);break;
    case'beam':tone(1200,.04,'sine',.02,1.1);break;
    case'kill':tone(620+Math.random()*200,.09,'sine',.07,1.8);break;
    case'build':tone(330,.1,'triangle',.12,1.5);tone(495,.14,'triangle',.1,1.5,.07);break;
    case'up':[392,523,659].forEach((f,i)=>tone(f,.15,'triangle',.1,1.2,i*.06));break;
    case'sell':tone(500,.12,'triangle',.1,.6);break;
    case'leak':tone(200,.3,'sawtooth',.08,.5);break;
    case'wave':tone(220,.5,'sawtooth',.06,1.5);tone(330,.5,'sine',.08,1.5,.1);break;
    case'card':[523,659,784,1046].forEach((f,i)=>tone(f,.25,'sine',.08,1,i*.07));break;
    case'mut':tone(110,.6,'sawtooth',.08,.7);tone(116,.6,'sawtooth',.06,.7);break;
    case'gate':tone(260,.12,'square',.05,2);tone(390,.15,'triangle',.08,1.5,.08);break;
    case'slam':noise(.35,.25,500);tone(70,.35,'sine',.25,.4);break;
    case'vent':tone(300,.2,'sine',.05,3);break;
    case'trap':tone(700,.18,'sine',.07,.6);break;
    case'storm':noise(.2,.12,5000);tone(1800,.15,'square',.04,.3);break;
    case'win':[523,659,784,1046,1318].forEach((f,i)=>tone(f,.3,'triangle',.12,1,i*.1));break;
    case'lose':[392,330,262,196].forEach((f,i)=>tone(f,.35,'triangle',.1,1,i*.14));break;
    case'tap':tone(700,.04,'sine',.06);break;
    case'clean':noise(.12,.08,2500);break;
    case'roar':tone(70,.8,'sawtooth',.12,.6);noise(.6,.1,400);break;
  }}
/* 음악: 느린 심해 분위기(5음계 단조 아르페지오 + 낮은 패드). 전투 중엔 조금 빨라진다 */
let musicMode='calm',mStep=0,mNext=0;
const SCALE=[0,3,5,7,10,12,15,17],ROOT=110;
function startMusic(){setInterval(()=>{if(!AC||!BG)return;BG.gain.value=SV.opt.bgm?.22:0;if(!SV.opt.bgm)return;const ahead=AC.currentTime+.3;if(mNext<AC.currentTime)mNext=AC.currentTime+.05;
  const stepT=musicMode==='battle'?.24:musicMode==='boss'?.2:.36;
  while(mNext<ahead){const i=mStep%32,bar=Math.floor(mStep/8)%4,chord=[0,-4,-2,-5][bar];
    if(i%8===0)pad(ROOT*Math.pow(2,chord/12)/2,stepT*8);
    const pat=[0,2,4,2,5,4,2,1],n=SCALE[(pat[i%8]+(bar%2))%SCALE.length]+chord+(musicMode==='boss'?-12:0);
    if(i%2===0||musicMode!=='calm')pluck(ROOT*2*Math.pow(2,n/12),mNext,musicMode==='calm'?.05:.045);
    mNext+=stepT;mStep++;}},100);}
function pluck(f,t0,v){const o=AC.createOscillator(),gn=AC.createGain();o.type='triangle';o.frequency.value=f;gn.gain.setValueAtTime(0,t0);gn.gain.linearRampToValueAtTime(v,t0+.01);gn.gain.exponentialRampToValueAtTime(.001,t0+.9);o.connect(gn);gn.connect(BG);o.start(t0);o.stop(t0+1);}
function pad(f,dur){const t0=mNext;[1,1.5,2.01].forEach(m=>{const o=AC.createOscillator(),gn=AC.createGain();o.type='sine';o.frequency.value=f*m;gn.gain.setValueAtTime(0,t0);gn.gain.linearRampToValueAtTime(.05,t0+dur*.4);gn.gain.linearRampToValueAtTime(0,t0+dur);o.connect(gn);gn.connect(BG);o.start(t0);o.stop(t0+dur+.05);});}
function vib(ms){try{if(navigator.vibrate)navigator.vibrate(ms);}catch(e){}}

/* ============================== 그림: 전부 코드로 그린 심해 발광 그림체 (그림 파일이 오면 바꿔 끼운다) ============================== */
/* 받은 그림(art/): 이름만 맞으면 코드 그림 대신 쓴다. 목록은 빌드가 채움 */
const ART=["abyss_rift", "bg_area1", "en_angler", "en_boss", "en_crab", "en_eel", "en_elite", "en_horseshoe", "en_minnow", "en_ray", "en_squid", "en_turtle", "hero_guard", "islet", "temple_gate", "tw_bubble_1", "tw_bubble_3", "tw_conch_1", "tw_coral_1", "tw_coral_2", "tw_jelly_1", "tw_jelly_4", "tw_rune_1"],IMG={};let artVer=0;
for(const n of ART){const im=new Image();im.onload=()=>{IMG[n]=im;artVer++;};im.src='art/'+n+'.webp?v='+BUILD;}
/* 그림 속 생물이 보는 방향(1=오른쪽)과 화면 폭(논리 px) */
const EFACE={};   // 받은 그림은 모두 오른쪽을 봄(왼쪽을 보는 그림이면 -1)
const EW={minnow:24,crab:38,eel:46,ray:46,angler:40,squid:42,horseshoe:40,turtle:50,elite:34,boss:110};
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
  for(const s of M.spots){const r2=rng(s.x*7+s.y*13);if(IMG.islet){x.fillStyle='rgba(0,15,25,.28)';x.beginPath();x.ellipse(s.x+6,s.y+36,24,8,0,0,7);x.fill();const w=68,h=w*IMG.islet.height/IMG.islet.width;x.drawImage(IMG.islet,s.x-w/2,s.y-h*.36,w,h);continue;}
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
  const X=t.x,Y=t.y,c=TCOL[t.k],lv=t.lv,s=1+(lv-1)*(IMG['tw_'+t.k+'_1']?.05:.09),kick=Math.max(0,t.kick||0);
  if(lv>=2)glow(x,X,Y,30,hexA(c,.35),.8);
  let tim=null;for(let l=lv;l>=1&&!tim;l--)tim=IMG['tw_'+t.k+'_'+l];
  if(tim){x.fillStyle='rgba(0,0,0,.3)';x.beginPath();x.ellipse(X,Y+10,22*s,8*s,0,0,7);x.fill();
    const sq=1+kick*.06;x.save();x.translate(X,Y+14);x.scale(s/sq,s*sq);drawImg(x,tim,0,0,52);x.restore();}
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
  if(lv>=3){x.fillStyle='#ffd76a';x.beginPath();const cy=Y-48+Math.sin(time*3)*1.5;x.moveTo(X-6,cy+4);x.lineTo(X-6,cy-2);x.lineTo(X-3,cy+1);x.lineTo(X,cy-4);x.lineTo(X+3,cy+1);x.lineTo(X+6,cy-2);x.lineTo(X+6,cy+4);x.closePath();x.fill();}
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
  let alpha=e.inv?(e.rev?.55:.13):1;x.save();x.translate(e.x,e.y-(e.lift>0?10+Math.sin(time*8)*2:0));
  if(sp<1){x.scale(sp,sp);alpha*=sp;}
  x.globalAlpha=alpha;glow(x,0,0,r*1.9,'rgba(140,60,220,.35)');
  const eim=IMG['en_'+e.k];
  if(eim){const sw=Math.sin(time*7+e.id),f2=face*(EFACE[e.k]||1);x.scale(f2*(1+sw*.03),1-sw*.03);const w=EW[e.k],h=w*eim.height/eim.width;x.drawImage(eim,-w/2,-h/2+Math.sin(time*5+e.id)*1.2,w,h);}
  else{x.scale(face*1.18,1.18);}const bob=Math.sin(time*6+e.id)*1.2;
  if(!eim)switch(e.k){
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
  if(e.hitT>0)glow(x,0,0,r*1.3,'rgba(255,255,255,.5)');x.restore();x.save();x.translate(e.x,e.y);x.globalAlpha=alpha;
  if(e.shield>0){x.strokeStyle='rgba(120,200,255,.7)';x.lineWidth=2;x.beginPath();x.arc(0,0,r+4,0,7);x.stroke();}
  if(e.trap>0){const gr=x.createRadialGradient(-4,-6,2,0,-2,r+8);gr.addColorStop(0,'rgba(255,255,255,.5)');gr.addColorStop(1,'rgba(110,231,255,.25)');x.fillStyle=gr;x.beginPath();x.arc(0,-2,r+8,0,7);x.fill();x.strokeStyle='rgba(200,250,255,.9)';x.lineWidth=1.5;x.stroke();}
  if(e.slow>0&&e.slowT>0){x.fillStyle='rgba(150,230,255,.7)';for(let i=0;i<3;i++){const an=time*3+i*2.1;x.beginPath();x.arc(Math.cos(an)*r,Math.sin(an)*r*.5-2,1.8,0,7);x.fill();}}
  if(e.stun>0){x.fillStyle='#fff27a';for(let i=0;i<3;i++){const an=time*8+i*2.1;txt(x,'✦',Math.cos(an)*9,-r-8+Math.sin(an)*3,8,'#fff27a');}}
  if(e.hp<e.mhp||e.shield>0){const bw=e.k==='boss'?60:Math.max(18,r*2),by=-r-(e.k==='boss'?16:8);x.fillStyle='rgba(0,0,0,.6)';x.fillRect(-bw/2-1,by-1,bw+2,5);
    x.fillStyle=e.k==='boss'?'#ff4f8a':'#7dff9a';x.fillRect(-bw/2,by,bw*Math.max(0,e.hp/e.mhp),3);if(e.shield>0){x.fillStyle='#7cc8ff';x.fillRect(-bw/2,by-3,bw*Math.min(1,e.shield/e.mhp),2);}}
  x.restore();
}
/* ---------- 영웅: 기갑 수호자 가드 ---------- */
function drawHero(x,h,time,sel){
  const X=h.x,Y=h.y+(h.moving?Math.sin(time*12)*1.5:Math.sin(time*2.5)*1.2);
  x.fillStyle='rgba(0,0,0,.35)';x.beginPath();x.ellipse(h.x,h.y+14,14,5,0,0,7);x.fill();
  if(sel){x.strokeStyle=`rgba(120,255,220,${.6+.3*Math.sin(time*8)})`;x.lineWidth=2;x.beginPath();x.ellipse(h.x,h.y+14,20,8,0,0,7);x.stroke();x.strokeStyle='rgba(120,255,220,.25)';x.beginPath();x.arc(h.x,h.y,HERO.range,0,7);x.stroke();}
  glow(x,X+h.face*-8,Y+6,10,'rgba(120,220,255,.7)',.6);
  if(IMG.hero_guard){x.save();x.translate(X,Y+14);x.scale(h.face,1);if(h.atk>0)x.rotate(-.12*h.atk);drawImg(x,IMG.hero_guard,0,0,54);x.restore();
    x.fillStyle='#e8c45a';x.beginPath();x.arc(X-14,Y-30,6,0,7);x.fill();txt(x,''+h.lv,X-14,Y-30,8,'#3a2a00');return;}
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
      case'flash':x.fillStyle=f.col;x.fillRect(0,0,W,H);break;
    }}
  x.globalAlpha=1;for(let i=FX.length-1;i>=0;i--)if(FX[i].t>=FX[i].life)FX.splice(i,1);
}

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
  if(ui.artVer!==artVer){ui.artVer=artVer;bgC=renderBg(G.M);}
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

})();
