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
