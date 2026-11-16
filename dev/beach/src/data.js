/* ============================== 밸런스 표: 숫자는 전부 여기서만 고친다 ============================== */
const W=450,H=800,WALL_Y=596,HERO_Y=652,TICK=60;   // 논리 전투 화면 450×800, 초당 60틱 고정
const SLOTS=[45,135,225,315,405];                  // 영웅 5칸
const SLOT_ORDER=[2,1,3,0,4];                      // 출전 순서대로 가운데부터 채운다
const WALL_HP=100;

const HERO_IDS=['tt','didi','peng','shan','dun','zhuo'];
const HEROES={
  tt:  {cd:1.2, dmg:15,aoe:54,range:330,speed:430,ultSec:17,ult:'steam',proj:'bun'},
  didi:{cd:.62, dmg:7, bounce:2,bounceR:120,range:400,speed:620,ultSec:19,ult:'rain',proj:'drop'},
  peng:{cd:2.1, dmg:17,aoe:58,range:560,lob:.72,ultSec:21,ult:'fest',proj:'fw'},
  shan:{cd:1.7, dmg:10,beamW:24,range:600,ultSec:24,ult:'moon'},
  dun: {cd:1.45,dmg:30,range:470,speed:760,big:1.5,ultSec:20,ult:'smash',proj:'ball'},
  zhuo:{cd:1.5, dmg:6, aoe:46,range:480,speed:520,slowT:2.4,ultSec:22,ult:'post',proj:'mail'},
};
const UNLOCK={shan:1,dun:2,zhuo:4};                // 몇 장을 깨면 합류하는가
const BONDS=[{a:'tt',b:'dun',k:'wall'},{a:'didi',b:'shan',k:'ult'},{a:'peng',b:'zhuo',k:'coin'}];
const MAX_LV=30;
const heroMul=lv=>1+.14*(lv-1);
const lvCost=lv=>Math.round(40*Math.pow(lv,1.55));

const ENEMIES={
  crab:  {hp:20, sp:40,r:18,dmg:5,xp:1,  coin:.25},
  jelly: {hp:13, sp:29,r:16,dmg:3,xp:.6, coin:.15,cost:1},
  puffer:{hp:30, sp:31,r:17,dmg:5,xp:1.2,coin:.3, cost:1.6},
  fish:  {hp:15, sp:76,r:15,dmg:4,xp:.8, coin:.2, cost:1.1},
  hermit:{hp:52, sp:23,r:19,dmg:7,xp:1.8,coin:.4, cost:2.3},
  octo:  {hp:40, sp:27,r:19,dmg:6,xp:1.6,coin:.4, cost:1.9},
  elite: {hp:230,sp:24,r:30,dmg:5,xp:8,  coin:5,  chew:1.5},
  boss:  {hp:2400,sp:15,r:58,dmg:6,xp:0, coin:40, chew:1.5},
};
const SMALL=k=>k!=='elite'&&k!=='boss';

const WAVE={grow:1.1,period:8.5,waitMax:3,gap:2,bossEvery:7};
const STAGES=[
  {waves:12,hp:1,   n:.85,mix:{jelly:1},                              boss:'kingcrab',bossHp:1100, rec:1,tip:['tt','didi']},
  {waves:15,hp:1.6, n:.95,mix:{jelly:.8,puffer:.6},                   boss:'kingcrab',bossHp:3000, rec:3,tip:['didi','shan']},
  {waves:18,hp:2.1, n:1,  mix:{jelly:.5,fish:.6,hermit:.35,puffer:.3},boss:'octoboss',bossHp:7000, rec:5,tip:['peng','shan']},
  {waves:20,hp:2.7, n:1,  mix:{jelly:.4,octo:.45,fish:.5,hermit:.35}, boss:'octoboss',bossHp:12000, rec:7,tip:['dun','peng']},
  {waves:20,hp:3.5, n:1,mix:{puffer:.4,octo:.4,fish:.6,hermit:.45,jelly:.3},boss:'whale',bossHp:19000,rec:9,tip:['zhuo','dun']},
];
// 웨이브마다 무리가 몰려오는 쪽: C 가운데, L 왼쪽, R 오른쪽, A 전체. 쉬는 틈에 미리 보여 주어 자리 바꾸기에 뜻을 준다.
const FOCUS=['C','C','L','A','R','C','R','A','L','C','L','A','R','L','C','A','R','L','A','C'];
const FOCUS_X={C:225,L:95,R:355,A:225};

function waveDef(si,w){
  const S=STAGES[si],early=si===0&&w<=2,last=w===S.waves,list={};
  list.crab=early?2+w:Math.round((3.2+.82*w)*S.n);
  const other=early?(w<2?0:2):(.4+.78*w)*S.n,ks=Object.keys(S.mix).filter((k,i)=>w>=1+i*2);let sum=0;ks.forEach(k=>sum+=S.mix[k]);
  ks.forEach(k=>{const n=Math.round(other*S.mix[k]/sum/ENEMIES[k].cost);if(n>0)list[k]=n;});
  return {w,focus:FOCUS[(w-1+si*3)%FOCUS.length],list,elite:(w%5===0&&!last)?1:0,boss:last?1:0,surge:w%4===0&&!last,hp:S.hp*Math.pow(WAVE.grow,w-1),dur:WAVE.period};
}
const xpNeed=lv=>5+2.4*lv;

const FREE_REROLLS=1,REVIVES=1,REVIVE_HP=.6,AWAKEN_AT=4,AWAKEN_MUL=1.25;
/* 카드: t = 종류(이름·설명은 화면 쪽 글자 표에서), hero 없으면 공용 */
const CARD_FN={
  dmg:h=>{h.dmgMul*=1.3},spd:h=>{h.cdMul*=.85},aoe:h=>{h.aoeMul*=1.25},two:h=>{h.shots+=1},bnc:h=>{h.bounce+=1},
  hot:h=>{h.slow+=.25},big:h=>{h.big+=.4},slw:h=>{h.slowT+=1.2},
  all_spd:(h,s)=>{for(const x of s.heroes)if(x)x.cdMul*=.92},all_crit:(h,s)=>{s.crit+=.08},all_ult:(h,s)=>{s.ultMul*=1.2},all_wall:(h,s)=>{s.wall=Math.min(s.wallMax,s.wall+25)},
};
const HERO_CARDS={tt:['dmg','spd','aoe','hot'],didi:['dmg','spd','bnc','two'],peng:['dmg','spd','aoe','two'],shan:['dmg','spd','aoe','two'],dun:['dmg','spd','big','two'],zhuo:['dmg','spd','aoe','slw']};
const CARDS=[];
for(const id of HERO_IDS)HERO_CARDS[id].forEach((t,i)=>CARDS.push({id:id+'_'+t,hero:id,t,max:i<3?3:2}));
[['all_spd',3],['all_crit',3],['all_ult',3],['all_wall',5]].forEach(c=>CARDS.push({id:c[0],t:c[0],max:c[1]}));

const REWARD={win:60,perWave:3,shell:3,boxLeft:10,stage:.5,first:[80,120,180,240,320]};
