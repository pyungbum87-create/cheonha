/* ============================== 밸런스 표: 숫자는 전부 여기서만 고친다 (정통 타워 디펜스) ============================== */
const W=450,H=800,TICK=60,GATE_Y=704;
const TOWER_IDS=['tt','didi','peng','shan','dun','zhuo'];
/* cls: exp 폭발(껍데기에 강함) · phy 물리(갑옷에 약함) · mag 마법(갑옷 무시).  air: 하늘의 적을 맞힐 수 있는가 */
const TOWERS={
  tt:  {cost:70, range:100,cd:1.5,dmg:15, aoe:36,cls:'exp',air:false,proj:'bun',speed:300},
  didi:{cost:60, range:112,cd:.5, dmg:5,         cls:'mag',air:true, proj:'drop',speed:520,slow:.3,slowT:1},
  peng:{cost:110,range:160,cd:2.2,dmg:24, aoe:30,cls:'exp',air:true, proj:'fw',speed:380},
  shan:{cost:100,range:108,cd:.25,dmg:3.4,       cls:'mag',air:true, beam:true},
  dun: {cost:120,range:185,cd:2,  dmg:52,        cls:'phy',air:true, proj:'ball',speed:820},
  zhuo:{cost:80, range:98, cd:1.6,dmg:6,  aoe:40,cls:'mag',air:false,proj:'mail',speed:360,slow:.5,slowT:2,gold:1},
};
const LV_DMG=[1,1.6,2.5,4],LV_RANGE=[1,1.07,1.14,1.2],UP_COST=[.9,1.4,2.2],SELL=.7;   // 1→2→3단계, 4단계는 두 갈래 중 하나
const BRANCH={tt:['king','twin'],didi:['ice','jet'],peng:['dragon','star'],shan:['rainbow','moon'],dun:['smash','double'],zhuo:['express','parcel']};
const UNLOCK={shan:1,dun:2,zhuo:3};                // 몇 장을 깨면 합류하는가
const MAX_LV=20;
const heroMul=lv=>1+.07*(lv-1);                    // 판 밖에서 동전으로 올리는 타워 숙련
const lvCost=lv=>Math.round(60*Math.pow(lv,1.5));

const ENEMIES={
  crab:  {hp:30,  sp:34,r:13,gold:5, cost:1},
  jelly: {hp:13,  sp:40,r:11,gold:3, cost:.5},
  fish:  {hp:22,  sp:76,r:11,gold:4, cost:.9},
  puffer:{hp:85,  sp:26,r:13,gold:13, cost:2.6,armor:.5},
  hermit:{hp:150, sp:20,r:14,gold:20,cost:4,  armor:.7},
  octo:  {hp:105, sp:28,r:14,gold:16,cost:3.2,ink:6},
  gull:  {hp:42,  sp:58,r:12,gold:9, cost:1.7,air:true},
  elite: {hp:430, sp:22,r:19,gold:50,cost:11, armor:.3,leak:3},
  boss:  {hp:2400,sp:13,r:30,gold:120,cost:0, armor:.2,leak:20},
};
const START_LIVES=20,WAVE_GAP=7,BONUS_PER_SEC=3,REVIVE_LIVES=10;
const SKILL={tide:{cd:38,push:95,dmg:28},bomb:{cd:24,r:62,dmg:110}};

/* 장: 길(바다 → 마을 대문)과 파도 수. spots 는 길 모양에서 자동으로 고른다 */
const STAGES=[
  {waves:8, hp:1.1, budget:10, gold:230,spots:8, kinds:['crab','jelly','fish'],boss:'kingcrab',bossHp:1500,rec:1,theme:0,
   paths:[[[225,66],[225,150],[110,215],[110,335],[340,395],[340,515],[150,575],[150,655],[225,GATE_Y]]]},
  {waves:10,hp:1.55,budget:12,gold:250,spots:9, kinds:['crab','fish','puffer','jelly'],boss:'kingcrab',bossHp:3200,rec:2,theme:1,
   paths:[[[90,66],[90,200],[360,265],[360,400],[90,465],[90,600],[225,650],[225,GATE_Y]]]},
  {waves:12,hp:1.75,budget:13,gold:280,spots:10,kinds:['crab','jelly','hermit','fish','gull'],boss:'octoboss',bossHp:5200,rec:4,theme:2,
   paths:[[[110,66],[110,215],[225,325],[225,430],[100,500],[100,615],[225,665],[225,GATE_Y]],[[340,66],[340,215],[225,325],[225,430],[100,500],[100,615],[225,665],[225,GATE_Y]]]},
  {waves:12,hp:1.85,budget:14,gold:300,spots:10,kinds:['crab','puffer','octo','gull','fish','hermit'],boss:'octoboss',bossHp:7000,rec:6,theme:3,
   paths:[[[225,66],[70,135],[70,300],[385,300],[385,470],[160,470],[160,600],[330,640],[225,GATE_Y]]]},
  {waves:14,hp:2.25,budget:15,gold:330,spots:11,kinds:['fish','octo','hermit','gull','puffer','jelly','crab'],boss:'whale',bossHp:10000,rec:8,theme:4,
   paths:[[[80,66],[80,250],[370,350],[370,560],[225,640],[225,GATE_Y]],[[370,66],[370,200],[80,400],[80,580],[225,640],[225,GATE_Y]]]},
];
/* 파도 내용: 장마다 정해진 규칙으로 만든다(무작위 아님). 뒤로 갈수록 예산이 늘고 새 적이 섞인다 */
function waveDef(si,w){
  const S=STAGES[si],last=w===S.waves,budget=S.budget*(1+.34*(w-1)),ks=S.kinds.slice(0,Math.min(S.kinds.length,1+Math.ceil(w*.7))),groups=[];
  const n=w<3?1:w<6?2:3;
  for(let i=0;i<n;i++){const k=ks[(w*2+i*3+si)%ks.length],E=ENEMIES[k],cnt=Math.max(1,Math.round(budget/n/E.cost));
    groups.push({k,n:cnt,gap:k==='jelly'?.35:k==='fish'?.55:E.cost>2.5?1.6:.8,delay:i*3.2,path:(w+i)%S.paths.length});}
  if(w%4===0&&!last)groups.push({k:'elite',n:1+Math.floor(w/8),gap:3,delay:2,path:w%S.paths.length});
  if(last)groups.push({k:'boss',n:1,gap:1,delay:4,path:0});
  return {w,groups,hp:S.hp*(1+.13*(w-1)),bonus:18+3*w};
}
const REWARD={base:90,stage:.45,star:[0,.7,.85,1],first:[100,150,220,300,400],lose:.25};
