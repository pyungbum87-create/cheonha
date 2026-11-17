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

/* 손님마다 그 생물다운 특기가 하나씩 있다. from = 몇 번째 장(0부터)부터 특기를 쓰는가 (첫 장은 특기 없이 배운다) */
const ENEMIES={
  crab:  {hp:30,  sp:34,r:13,gold:5, cost:1},
  jelly: {hp:13,  sp:40,r:11,gold:3, cost:.5, fade:4.5,from:2},              // 투명해져서 한 명씩 노리는 가게가 못 봄 (범위 간식은 닿음)
  fish:  {hp:22,  sp:76,r:11,gold:4, cost:.9, leap:3.5,from:1},              // 물 위로 뛰어올라 땅 간식을 넘어감 (느려지면 못 뜀)
  puffer:{hp:85,  sp:26,r:13,gold:13,cost:2.6,armor:.3,puff:3,from:1},       // 놀라면 부풀어 3초 동안 편식이 심해짐
  hermit:{hp:150, sp:20,r:14,gold:20,cost:4,  armor:.5,hide:5,from:2},       // 껍데기에 숨음 (팝콘·만두 냄새에 깜짝 놀라 튀어나옴)
  octo:  {hp:105, sp:28,r:14,gold:16,cost:3.2,ink:6},                        // 가게에 먹물
  gull:  {hp:42,  sp:58,r:12,gold:9, cost:1.7,air:true,leak:2},              // 길을 무시하고 날아와 간식 2개를 낚아챔
  turtle:{hp:240, sp:19,r:14,gold:26,cost:5.2,armor:.4,rush:1.9},            // 반쯤 배가 차면 신나서 달림
  shrimp:{hp:16,  sp:60,r:10,gold:3, cost:.7, dart:1},                       // 처음 간식에 맞으면 깜짝 놀라 앞으로 톡 튐
  elite: {hp:430, sp:22,r:19,gold:50,cost:11, armor:.3,leak:3,shield:6,from:3}, // 양동이 투구가 간식 6개를 튕겨 냄
  boss:  {hp:2400,sp:13,r:30,gold:120,cost:0, armor:.2,leak:20},
};
const START_LIVES=20,WAVE_GAP=6,BONUS_PER_SEC=3,REVIVE_LIVES=10;
const SKILL={tide:{cd:38,push:95,dmg:28},bomb:{cd:24,r:62,dmg:110}};

/* 장: 길(바다 → 마을 대문)과 파도 수. spots 는 길 모양에서 자동으로 고른다 */
const STAGES=[
  {waves:8, hp:1.1, budget:10,gold:230,spots:8, kinds:['crab','jelly','fish'],boss:'kingcrab',bossHp:1500,rec:1,theme:0,
   paths:[[[225,66],[225,150],[110,215],[110,335],[340,395],[340,515],[150,575],[150,655],[225,GATE_Y]]]},
  {waves:9, hp:1.6, budget:13,gold:250,spots:9, kinds:['crab','fish','puffer','jelly'],boss:'kingcrab',bossHp:3200,rec:2,theme:1,
   paths:[[[90,66],[90,200],[360,265],[360,400],[90,465],[90,600],[225,650],[225,GATE_Y]]]},
  {waves:10,hp:1.85,budget:15,gold:280,spots:10,kinds:['crab','jelly','hermit','fish','gull'],boss:'octoboss',bossHp:5200,rec:4,theme:2,
   paths:[[[110,66],[110,215],[225,325],[225,430],[100,500],[100,615],[225,665],[225,GATE_Y]],[[340,66],[340,215],[225,325],[225,430],[100,500],[100,615],[225,665],[225,GATE_Y]]]},
  {waves:10,hp:1.6, budget:15,gold:320,spots:10,kinds:['crab','puffer','octo','gull','fish','hermit'],boss:'octoboss',bossHp:7000,rec:6,theme:3,
   paths:[[[225,66],[70,135],[70,300],[385,300],[385,470],[160,470],[160,600],[330,640],[225,GATE_Y]]]},
  {waves:11,hp:1.8, budget:16,gold:370,spots:11,kinds:['fish','octo','hermit','gull','puffer','jelly','crab'],boss:'whale',bossHp:8500,rec:8,theme:4,
   paths:[[[80,66],[80,250],[370,350],[370,560],[225,640],[225,GATE_Y]],[[370,66],[370,200],[80,400],[80,580],[225,640],[225,GATE_Y]]]},
  {waves:11,hp:2.9, budget:18,gold:380,spots:11,kinds:['crab','turtle','shrimp','puffer','gull','fish','jelly'],boss:'whale',bossHp:12500,rec:10,theme:0,
   paths:[[[360,66],[360,180],[90,180],[90,330],[360,330],[360,480],[90,480],[90,620],[225,660],[225,GATE_Y]]]},
  {waves:12,hp:2.15,budget:17,gold:440,spots:11,kinds:['fish','turtle','octo','hermit','gull','crab'],boss:'pirate',bossHp:12000,rec:12,theme:1,
   paths:[[[60,66],[60,300],[200,380],[200,520],[225,620],[225,GATE_Y]],[[390,66],[390,300],[250,380],[250,520],[225,620],[225,GATE_Y]]]},
  {waves:12,hp:2.9, budget:18,gold:440,spots:12,kinds:['puffer','shrimp','gull','turtle','octo','fish','hermit','jelly'],boss:'pirate',bossHp:15000,rec:14,theme:2,
   paths:[[[100,66],[100,170],[380,170],[380,290],[70,290],[70,410],[380,410],[380,540],[150,560],[150,650],[225,GATE_Y]]]},
  {waves:12,hp:2.9, budget:17,gold:480,spots:12,kinds:['turtle','fish','octo','gull','hermit','puffer','crab'],boss:'octoboss',bossHp:17000,rec:16,theme:3,
   paths:[[[70,66],[70,260],[225,360],[225,470],[110,540],[110,640],[225,675],[225,GATE_Y]],[[225,66],[225,360],[225,470],[110,540],[110,640],[225,675],[225,GATE_Y]],[[380,66],[380,260],[225,360],[225,470],[110,540],[110,640],[225,675],[225,GATE_Y]]]},
  {waves:13,hp:2.3, budget:17,gold:560,spots:12,kinds:['octo','turtle','shrimp','gull','hermit','fish','puffer','jelly','crab'],boss:'whale',bossHp:21000,rec:18,theme:4,
   paths:[[[90,66],[90,180],[360,260],[360,380],[90,460],[90,580],[225,650],[225,GATE_Y]],[[360,66],[360,180],[90,260],[90,380],[360,460],[360,580],[225,650],[225,GATE_Y]]]},
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
const REWARD={base:90,stage:.45,star:[0,.7,.85,1],first:[100,150,220,300,400,500,600,700,850,1000],lose:.25};
