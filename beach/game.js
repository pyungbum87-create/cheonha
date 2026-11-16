(()=>{"use strict";
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

/* ============================== 게임 규칙: 화면·소리·저장을 전혀 모른다 ==============================
   고정 틱(1/60초)이라 60Hz·120Hz 폰에서 속도가 같고, 봇이 Node에서 사람 없이 돌릴 수 있다.
   화면에 알릴 일은 s.fx 목록에 쌓고, 화면 쪽이 읽어 가며 비운다. */
function makeRng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

function newHero(id,slot,lv){const b=HEROES[id];return {id,slot,lv:lv||1,cd:.3+slot*.2,ult:.35,pips:0,awake:false,dmgMul:heroMul(lv||1),cdMul:1,aoeMul:1,
  bounce:b.bounce||0,shots:1,slow:0,big:b.big||1,slowT:b.slowT||0,rain:0,ink:0,dealt:0,kills:0};}

function newRun(seed,team,opt){
  opt=opt||{};const si=opt.stage||0;
  const s={seed,si,S:STAGES[si],rand:makeRng(seed),t:0,acc:0,phase:'run',wave:0,ws:'gap',gapT:WAVE.gap*TICK+60,waveT:0,lastSpawn:0,next:waveDef(si,1),queue:[],
    heroes:[null,null,null,null,null],en:[],pr:[],delay:[],loot:[],uid:1,wall:WALL_HP,wallMax:WALL_HP,xp:0,lv:1,need:xpNeed(1),pending:0,
    offer:null,rerolls:FREE_REROLLS,revives:REVIVES,revived:false,taken:{},crit:.08,ultMul:1,coinMul:1,coins:0,kills:0,ults:0,picks:0,shells:0,surge:0,ebb:0,buff:0,freeze:0,freezeHero:-1,stop:0,fx:[],
    bossT:0,bossSurged:false,boss:null,stars:0,ended:false,bonds:[]};
  team.slice(0,5).forEach((id,i)=>{const sl=SLOT_ORDER[i];s.heroes[sl]=newHero(id,sl,opt.lv&&opt.lv[id]);});
  for(const b of BONDS)if(team.includes(b.a)&&team.includes(b.b)){s.bonds.push(b.k);if(b.k==='wall'){s.wallMax+=20;s.wall+=20;}else if(b.k==='ult')s.ultMul*=1.15;else s.coinMul*=1.2;}
  return s;
}

function startWave(s){
  s.wave++;s.ws='fight';s.waveT=0;const d=waveDef(s.si,s.wave);s.cur=d;s.next=s.wave<s.S.waves?waveDef(s.si,s.wave+1):null;
  const fx=FOCUS_X[d.focus],spread=d.focus==='A'?205:88,dur=(d.surge?2:d.dur)*TICK;
  let ki=0;for(const k in d.list){const n=d.list[k],from=ki?dur*.1:0,to=ki?dur*.9:dur;ki++;
    for(let i=0;i<n;i++)s.queue.push({at:Math.round(from+(to-from)*(n>1?i/(n-1):.5)+s.rand()*12),k,x:fx+(s.rand()*2-1)*spread});}
  if(d.elite)s.queue.push({at:30,k:'elite',x:fx});
  if(d.boss)s.queue.push({at:60,k:'boss',x:225});
  s.queue.sort((a,b)=>a.at-b.at);
  if(d.surge)beginSurge(s);
  s.fx.push({e:'wave',w:s.wave,boss:!!d.boss,surge:!!d.surge});
}
function beginSurge(s){s.surge=2.5*TICK;s.fx.push({e:'surge'});}
function endSurge(s){s.ebb=2*TICK;for(let i=0;i<5;i++)dropLoot(s,'shell',50+s.rand()*350,478+s.rand()*85,6);s.fx.push({e:'ebb'});}
function dropLoot(s,k,x,y,sec){s.loot.push({id:s.uid++,k,x,y,life:sec*TICK,born:s.t});}

function spawn(s,k,x,y){
  const b=ENEMIES[k],c=s.cur||waveDef(s.si,1);x=Math.max(26,Math.min(W-26,x));const hp=k==='boss'?s.S.bossHp:b.hp*c.hp;
  const e={id:s.uid++,k,bk:k==='boss'?s.S.boss:'',x,y:y===undefined?-34:y,hp,max:hp,sp:b.sp,r:b.r,dmg:b.dmg,xp:b.xp,coin:b.coin,ph:s.rand()*6.28,st:'walk',slow:0,stun:0,hit:0,chew:0,push:0,puff:0,puffed:false,inked:false,dead:false};
  s.en.push(e);if(k==='boss'){s.boss=e;s.bossT=0;s.fx.push({e:'boss',bk:e.bk});}return e;
}

function nearest(s,x,y,range,skip){let best=null,bd=range*range;for(const e of s.en){if(e.dead||e.y<-20||(skip&&skip.has(e.id)))continue;const dx=e.x-x,dy=e.y-y,d=dx*dx+dy*dy;if(d<bd){bd=d;best=e;}}return best;}

/* fl: 1 치명타 없음, 2 폭발 피해 */
function hurt(s,e,d,h,fl){
  if(e.dead)return;const crit=!(fl&1)&&s.rand()<s.crit;if(crit)d*=2;
  if(e.k==='hermit')d*=(fl&2)?1.5:.4;
  if(e.k==='puffer'){if(!e.puffed){e.puffed=true;e.puff=2.5*TICK;s.fx.push({e:'puff',x:e.x,y:e.y});}else if(e.puff>0)d*=.4;}
  if(h&&!SMALL(e.k)&&h.big>1)d*=h.big;
  e.hp-=d;e.hit=8;if(h)h.dealt+=d;
  s.fx.push({e:'hit',x:e.x,y:e.y-e.r*.6,v:Math.round(d),crit,k:e.k,weak:e.k==='hermit'&&!!(fl&2)});
  if(e.k==='boss'&&crit)s.stop=2;
  if(e.hp<=0)kill(s,e,h);
  else if(e===s.boss&&!s.bossSurged&&e.hp<e.max*.5){s.bossSurged=true;beginSurge(s);}
}
function kill(s,e,h){
  e.dead=true;s.kills++;if(h)h.kills++;s.coins+=e.coin;s.fx.push({e:'die',x:e.x,y:e.y,k:e.k,bk:e.bk,id:e.id});
  if(e.k==='elite')dropLoot(s,'box',e.x,Math.min(560,Math.max(120,e.y)),1e7);
  if(e.xp){s.xp+=e.xp;while(s.xp>=s.need){s.xp-=s.need;s.lv++;s.need=xpNeed(s.lv);s.pending++;s.fx.push({e:'lv',lv:s.lv});}}
}
function blast(s,x,y,aoe,d,h,kind,eff){
  for(const e of s.en){if(e.dead)continue;const dx=e.x-x,dy=e.y-y,r=aoe+e.r;if(dx*dx+dy*dy<r*r){hurt(s,e,d,h,2);if(eff&&!e.dead){if(eff.slow)e.slow=Math.max(e.slow,eff.slow);if(eff.stun&&e.k!=='boss')e.stun=Math.max(e.stun,eff.stun);}}}
  s.fx.push({e:'blast',x,y,r:aoe,kind});
}

function shoot(s,h){
  const b=HEROES[h.id],x=SLOTS[h.slot],y=HERO_Y-34,dmg=b.dmg*h.dmgMul,skip=new Set();let fired=false;
  for(let n=0;n<h.shots;n++){
    const t=nearest(s,x,y,b.range,skip);if(!t)break;skip.add(t.id);fired=true;
    if(h.id==='peng'){
      const T=b.lob*TICK,lead=t.stun>0?0:t.sp*b.lob*(t.slow>0?.6:1),ty=Math.min(WALL_Y-10,t.y+lead);
      s.pr.push({k:'fw',h:h.slot,x,y,sx:x,sy:y,tx:t.x,ty,t:0,T,dmg,aoe:b.aoe*h.aoeMul});
    }else if(h.id==='shan'){
      const xs=h.awake?[t.x,t.x-58,t.x+58]:[t.x],w=b.beamW*h.aoeMul;
      for(const bx of xs){for(const e of s.en){if(!e.dead&&e.y>-20&&e.y<WALL_Y+10&&Math.abs(e.x-bx)<w+e.r*.6)hurt(s,e,bx===t.x?dmg:dmg*.55,h,0);}s.fx.push({e:'beam',x:bx,w});}
    }else s.pr.push({k:b.proj,h:h.slot,x,y,tid:t.id,tx:t.x,ty:t.y,sp:b.speed/TICK,dmg,aoe:(b.aoe||0)*h.aoeMul,left:h.bounce,bn:0,seen:new Set(),t:0});
  }
  if(fired)s.fx.push({e:'shoot',slot:h.slot,id:h.id});
  return fired;
}

function prLand(s,p,tgt){
  const h=s.heroes[p.h];
  if(p.k==='bun'){blast(s,p.x,p.y,p.aoe,p.dmg,h,'bun',h&&h.slow>0?{slow:1.6*TICK}:null);
    if(h&&h.awake)for(let i=0;i<3;i++){const a=-1.57+(i-1)*.9;s.delay.push({at:s.t+8,x:p.x+Math.cos(a)*58,y:p.y+Math.sin(a)*58,aoe:p.aoe*.6,dmg:p.dmg*.5,h:p.h,kind:'bun'});}
  }else if(p.k==='fw'){blast(s,p.x,p.y,p.aoe,p.dmg,h,'fw');
    if(h&&h.awake)for(let i=0;i<4;i++){const a=.8+i*1.57;s.delay.push({at:s.t+10+i*3,x:p.x+Math.cos(a)*62,y:p.y+Math.sin(a)*62,aoe:p.aoe*.55,dmg:p.dmg*.4,h:p.h,kind:'fw'});}
  }else if(p.k==='mail'){blast(s,p.x,p.y,p.aoe,p.dmg,h,'mail',{slow:(h?h.slowT:2.4)*TICK,stun:h&&h.awake?.9*TICK:0});
  }else{ // 물방울·탁구공: 한 마리를 맞히고 튄다
    if(tgt){hurt(s,tgt,p.bn&&p.k==='ball'?p.dmg*.7:p.dmg,h,0);p.seen.add(tgt.id);}
    s.fx.push({e:p.k==='ball'?'pingpong':'splash',x:p.x,y:p.y});
    const lim=p.k==='ball'?(h&&h.awake?2:0):p.left*(h&&h.awake?2:1);
    if(lim>p.bn){const n=nearest(s,p.x,p.y,p.k==='ball'?220:HEROES.didi.bounceR,p.seen);if(n){p.bn++;p.tid=n.id;p.tx=n.x;p.ty=n.y;return false;}}
  }
  return true;
}

function stepProjectiles(s){
  for(const p of s.pr){
    p.t++;
    if(p.k==='fw'){const q=p.t/p.T;p.x=p.sx+(p.tx-p.sx)*q;p.y=p.sy+(p.ty-p.sy)*q;if(q>=1)p.done=prLand(s,p);continue;}
    let tgt=null;for(const e of s.en)if(e.id===p.tid&&!e.dead){tgt=e;break;}
    if(tgt){p.tx=tgt.x;p.ty=tgt.y-4;}
    const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy);
    if(d<=p.sp+6){p.x=p.tx;p.y=p.ty;p.done=prLand(s,p,tgt);}else{p.x+=dx/d*p.sp;p.y+=dy/d*p.sp;}
  }
  s.pr=s.pr.filter(p=>!p.done);
  if(s.delay.length){for(const d of s.delay)if(s.t>=d.at){blast(s,d.x,d.y,d.aoe,d.dmg,s.heroes[d.h],d.kind);d.done=1;}s.delay=s.delay.filter(d=>!d.done);}
}

function inkHero(s,n){const hs=s.heroes.filter(h=>h&&h.ink<=0);for(let i=0;i<n&&hs.length;i++){const h=hs.splice(Math.floor(s.rand()*hs.length),1)[0];h.ink=4*TICK;s.fx.push({e:'ink',slot:h.slot});}}

function stepEnemies(s){
  const surge=s.surge>0,ebb=s.ebb>0;
  for(const e of s.en){
    if(e.dead)continue;if(e.hit>0)e.hit--;if(e.slow>0)e.slow--;if(e.puff>0)e.puff--;
    if(e.stun>0){e.stun--;continue;}
    if(e.st==='walk'){
      let v=e.sp/TICK;if(e.slow>0)v*=.55;if(surge&&e.y<430&&e.k!=='boss')v*=2.6;if(ebb)v*=.7;if(e.puff>0)v*=.7;
      if(e.push>0){e.y-=e.push;e.push*=.86;if(e.push<.2)e.push=0;}else e.y+=v;
      if(e.k==='crab')e.x+=Math.cos(s.t*.05+e.ph)*.55;
      else if(e.k==='jelly')e.y+=Math.sin(s.t*.09+e.ph)*.25;
      else if(e.k==='fish')e.x+=Math.cos(s.t*.11+e.ph)*.9;
      else if(e.k==='elite')e.x+=Math.cos(s.t*.03+e.ph)*.4;
      else if(e.k==='octo'&&!e.inked&&e.y>250){e.inked=true;inkHero(s,1);s.fx.push({e:'spit',x:e.x,y:e.y});}
      e.x=Math.max(22,Math.min(W-22,e.x));
      const stop=WALL_Y-(e.k==='boss'?34:e.k==='elite'?14:2);
      if(e.y>=stop){e.y=stop;
        if(SMALL(e.k)){e.dead=true;damageWall(s,e.dmg,e);s.fx.push({e:'pong',x:e.x,y:e.y,k:e.k,id:e.id});}
        else{e.st='chew';e.chew=TICK*.6;}}
    }else{ // 정예·보스는 모래성을 야금야금 깎는다
      if(e.push>0){e.st='walk';continue;}
      e.chew--;if(e.chew<=0){e.chew=ENEMIES[e.k].chew*TICK;damageWall(s,e.dmg,e);s.fx.push({e:'chew',x:e.x,y:e.y+e.r*.6,k:e.k});}
    }
  }
  s.en=s.en.filter(e=>!e.dead);
}
function damageWall(s,d,e){if(s.phase!=='run')return;s.wall=Math.max(0,s.wall-d);s.fx.push({e:'wall',d,x:e.x,left:s.wall});if(s.wall<=0){s.phase=s.revives>0?'revive':'lose';if(s.phase==='lose')finish(s,false);s.fx.push({e:'down'});}}

function stepHeroes(s){
  const haste=s.buff>0?1.5:1;if(s.buff>0)s.buff--;
  for(const h of s.heroes){if(!h)continue;const b=HEROES[h.id];
    if(h.ult<1){h.ult=Math.min(1,h.ult+s.ultMul/(b.ultSec*TICK));if(h.ult>=1)s.fx.push({e:'ultReady',slot:h.slot});}
    if(h.ink>0){h.ink--;continue;}
    h.cd-=haste/TICK;if(h.cd<=0&&shoot(s,h))h.cd=b.cd*h.cdMul;
    if(h.rain>0){h.rain--;if(h.rain%5===0){const live=s.en.filter(e=>!e.dead&&e.y>-20);if(live.length){const e=live[Math.floor(s.rand()*live.length)];hurt(s,e,b.dmg*h.dmgMul*1.25,h,1);s.fx.push({e:'rain',x:e.x,y:e.y});}}}
  }
}

function bossAct(s){
  const b=s.boss,k=b.bk;s.bossT=0;
  if(k==='kingcrab'){for(let i=0;i<3;i++)spawn(s,'crab',b.x+(i-1)*70,Math.max(-34,b.y-20));}
  else if(k==='octoboss'){inkHero(s,2);for(let i=0;i<3;i++)spawn(s,'jelly',b.x+(i-1)*80,Math.max(-34,b.y-30));}
  else{beginSurge(s);for(let i=0;i<3;i++)spawn(s,'fish',70+i*150,-34);}
  s.fx.push({e:'summon',x:b.x,y:b.y,bk:k});
}
function stepWave(s){
  if(s.ws==='gap'){if(--s.gapT<=0)startWave(s);return;}
  s.waveT++;
  while(s.queue.length&&s.queue[0].at<=s.waveT){const q=s.queue.shift();spawn(s,q.k,q.x);s.lastSpawn=s.t;}
  if(s.boss&&!s.boss.dead&&s.boss.stun<=0&&++s.bossT>=WAVE.bossEvery*TICK)bossAct(s);
  if(s.queue.length)return;
  if(s.wave>=s.S.waves){if(s.boss&&s.boss.dead)finish(s,true);return;}
  if(s.en.length===0||s.t-s.lastSpawn>=WAVE.waitMax*TICK){s.ws='gap';s.gapT=WAVE.gap*TICK;s.fx.push({e:'gap',focus:s.next?s.next.focus:'C'});}
}

function finish(s,won){
  if(s.ended)return;s.ended=true;s.won=won;s.phase=won?'win':'lose';
  const pct=s.wall/s.wallMax;s.stars=won?(pct>=.999?3:pct>=.5?2:1):0;
  const boxes=s.loot.filter(l=>l.k==='box').length;
  s.reward=Math.round((s.coins+(won?REWARD.win:0)+Math.max(0,s.wave-1)*REWARD.perWave+boxes*REWARD.boxLeft)*(1+REWARD.stage*s.si)*s.coinMul);
  s.en.forEach(e=>{if(!e.dead)s.fx.push({e:'die',x:e.x,y:e.y,k:e.k,bk:e.bk,id:e.id});});if(won)s.en=[];
  s.fx.push({e:won?'win':'lose'});
}

/* 1틱 진행 */
function step(s){
  if(s.ended)return;
  if(s.phase==='run'&&s.pending>0){openOffer(s);return;}
  if(s.phase!=='run')return;
  if(s.freeze>0){s.freeze--;if(s.freeze===0)fireUlt(s,s.freezeHero);return;} // 필살기 컷인
  if(s.stop>0){s.stop--;return;}                                            // 보스 타격의 아주 짧은 멈춤
  s.t++;
  if(s.surge>0&&--s.surge===0)endSurge(s);
  if(s.ebb>0)s.ebb--;
  stepWave(s);if(s.phase!=='run')return;
  stepHeroes(s);stepProjectiles(s);stepEnemies(s);
  if(s.loot.length){for(const l of s.loot)if(--l.life<=0){l.gone=true;s.fx.push({e:'lootGone',id:l.id});}s.loot=s.loot.filter(l=>!l.gone);}
}
/* 프레임 시간을 틱으로 바꾼다. 느린 폰에서 한 프레임에 너무 몰리지 않게 상한을 둔다 */
function advance(s,dt){s.acc+=Math.min(dt,.2);let n=0;while(s.acc>=1/TICK-1e-9&&n<14){s.acc-=1/TICK;step(s);n++;}return n;}

/* ---------- 카드 ---------- */
function cardPool(s){return CARDS.filter(c=>(s.taken[c.id]||0)<c.max&&(!c.hero||s.heroes.some(h=>h&&h.id===c.hero))&&!(c.id==='all_wall'&&s.wall>=s.wallMax));}
function openOffer(s){s.phase='card';s.offer=rollOffer(s);s.fx.push({e:'card'});}
function rollOffer(s){
  const pool=cardPool(s).map(c=>{const h=c.hero&&s.heroes.find(x=>x&&x.id===c.hero);return {c,w:(h?1+h.pips*.8:.8)+(c.id==='all_wall'&&s.wall<s.wallMax*.5?3:0)};});
  const out=[];while(out.length<3&&pool.length){let sum=0;for(const p of pool)sum+=p.w;let r=s.rand()*sum,i=0;for(;i<pool.length-1;i++){r-=pool[i].w;if(r<=0)break;}out.push(pool[i].c);pool.splice(i,1);}
  return out;
}
function pickCard(s,i){
  if(s.phase!=='card'||!s.offer||!s.offer[i])return null;const c=s.offer[i],h=c.hero?s.heroes.find(x=>x&&x.id===c.hero):null;
  s.taken[c.id]=(s.taken[c.id]||0)+1;CARD_FN[c.t](h,s);s.picks++;
  if(h){h.pips++;if(h.pips===AWAKEN_AT&&!h.awake){h.awake=true;h.dmgMul*=AWAKEN_MUL;s.fx.push({e:'awake',slot:h.slot,id:h.id});}}
  s.offer=null;s.pending--;s.phase='run';s.fx.push({e:'picked',card:c.id});return c;
}
/* free=false 는 무료 횟수를 쓰고, true 는 광고를 본 뒤 화면 쪽에서 부른다 */
function reroll(s,free){if(s.phase!=='card')return false;if(!free){if(s.rerolls<=0)return false;s.rerolls--;}s.offer=rollOffer(s);s.fx.push({e:'reroll'});return true;}

/* ---------- 플레이어 조작 ---------- */
function tapHero(s,slot){const h=s.heroes[slot];if(!h||s.phase!=='run')return false;if(h.ink>0){h.ink=0;s.fx.push({e:'inkClear',slot});return true;}return tryUlt(s,slot);}
function tryUlt(s,slot){const h=s.heroes[slot];if(!h||h.ult<1||h.ink>0||s.phase!=='run'||s.freeze>0)return false;h.ult=0;s.ults++;s.freeze=Math.round(.42*TICK);s.freezeHero=slot;s.fx.push({e:'cut',slot,id:h.id});return true;}
function fireUlt(s,slot){
  const h=s.heroes[slot];if(!h)return;const b=HEROES[h.id],m=h.dmgMul,d=b.dmg*m;
  if(b.ult==='steam'){for(const e of s.en){if(e.dead||e.y<260)continue;if(e.k!=='boss')e.push=e.k==='elite'?7:12;hurt(s,e,d*2.4,h,3);}s.fx.push({e:'steam'});}
  else if(b.ult==='rain'){h.rain=5*TICK;s.fx.push({e:'rainStart'});}
  else if(b.ult==='fest'){for(let i=0;i<12;i++){const live=s.en.filter(e=>!e.dead&&e.y>-10),e=live.length?live[Math.floor(s.rand()*live.length)]:null;s.delay.push({at:s.t+6+i*6,x:e?e.x:60+s.rand()*330,y:e?e.y:120+s.rand()*350,aoe:66,dmg:d*1.3,h:slot,kind:'fw'});}}
  else if(b.ult==='moon'){for(const e of s.en)if(!e.dead)e.stun=Math.max(e.stun,(e.k==='boss'?1.2:2.5)*TICK);s.buff=6*TICK;s.fx.push({e:'moon'});}
  else if(b.ult==='smash'){let t=null;for(const e of s.en)if(!e.dead&&e.y>-20&&(!t||e.hp>t.hp))t=e;if(t){const x=t.x,y=t.y;hurt(s,t,d*9,h,1);blast(s,x,y,74,d*1.5,h,'smash');}else s.fx.push({e:'blast',x:225,y:300,r:74,kind:'smash'});}
  else{for(const e of s.en)if(!e.dead){hurt(s,e,d*4,h,1);if(!e.dead)e.slow=Math.max(e.slow,3*TICK);}for(let i=0;i<6;i++)dropLoot(s,'shell',50+s.rand()*350,440+s.rand()*120,7);s.fx.push({e:'post'});}
}
function swapSlots(s,a,b){if(a===b||s.phase!=='run'||a<0||b<0||a>4||b>4)return false;const x=s.heroes[a],y=s.heroes[b];if(!x&&!y)return false;s.heroes[a]=y;s.heroes[b]=x;if(y)y.slot=a;if(x)x.slot=b;for(const p of s.pr){if(p.h===a)p.h=b;else if(p.h===b)p.h=a;}for(const d of s.delay){if(d.h===a)d.h=b;else if(d.h===b)d.h=a;}if(s.freezeHero===a)s.freezeHero=b;else if(s.freezeHero===b)s.freezeHero=a;s.fx.push({e:'swap',a,b});return true;}
function tapField(s,x,y){
  if(s.phase!=='run')return false;let best=null,bd=50*50;for(const l of s.loot){const d=(l.x-x)**2+(l.y-y)**2;if(d<bd){bd=d;best=l;}}if(!best)return false;
  s.loot=s.loot.filter(l=>l!==best);if(best.k==='shell'){s.coins+=REWARD.shell;s.shells++;s.fx.push({e:'shell',x:best.x,y:best.y,id:best.id});}else{s.pending++;s.fx.push({e:'box',x:best.x,y:best.y,id:best.id});}return true;
}
function revive(s){if(s.phase!=='revive'||s.revives<=0)return false;s.revives--;s.revived=true;s.wall=Math.round(s.wallMax*REVIVE_HP);for(const e of s.en){if(e.y>360&&e.k!=='boss'){e.push=14;e.st='walk';}}s.phase='run';s.fx.push({e:'revive'});return true;}
function giveUp(s){if(s.phase==='revive'||s.phase==='run'||s.phase==='card')finish(s,false);}

if(typeof module!=='undefined')module.exports={newRun,step,advance,pickCard,reroll,tryUlt,tapHero,swapSlots,tapField,revive,giveUp,cardPool,STAGES,HEROES};

/* ============================== 플랫폼 층: 화면·터치·저장·소리·광고·통계는 여기에만 둔다 ==============================
   위챗(wx)·더우인(tt)으로 옮길 때 이 파일만 손보면 된다. */
const BUILD='1117-0009';
const PLAT=typeof wx!=='undefined'?'wx':typeof tt!=='undefined'?'tt':'web';
const API=PLAT==='wx'?wx:PLAT==='tt'?tt:null;
const VW=750,VH=1334,K=VW/W;
const cv=API?API.createCanvas():document.getElementById('game');
const g=cv.getContext('2d');
let view={s:1,ox:0,oy:0,pr:1};
if(API){const si=API.getSystemInfoSync?API.getSystemInfoSync():{windowWidth:375,windowHeight:667,pixelRatio:2},pr=Math.min(2,si.pixelRatio||1);
  cv.width=Math.max(1,Math.round((si.windowWidth||375)*pr));cv.height=Math.max(1,Math.round((si.windowHeight||667)*pr));
  const sc=Math.min(cv.width/VW,cv.height/VH);view={s:sc,ox:(cv.width-VW*sc)/2,oy:(cv.height-VH*sc)/2,pr};
}else{cv.width=VW;cv.height=VH;}
function mkCanvas(w,h){const c=API?API.createCanvas():document.createElement('canvas');c.width=w;c.height=h;return c;}
const QS=PLAT==='web'?new URLSearchParams(location.search):{get:()=>null};
const DEBUG=QS.get('debug')==='1';
// 반지름이 음수면 그리기 전체가 멈추므로 미리 막는다
function safeCtx(x){const a=x.arc.bind(x);x.arc=(p,q,r,s,e,c)=>a(p,q,r>0?r:0,s,e,c);if(x.ellipse){const el=x.ellipse.bind(x);x.ellipse=(p,q,rx,ry,ro,s,e,c)=>el(p,q,rx>0?rx:0,ry>0?ry:0,ro,s,e,c);}return x;}
safeCtx(g);

/* ---------- 저장 ---------- */
const SAVE_KEY='ttbeach_v1';
const DEF={v:1,coins:0,lv:{tt:1,didi:1,peng:1},team:['tt','didi','peng'],stars:[0,0,0,0,0],cleared:0,sel:0,opt:{bgm:1,sfx:1,vib:1,shake:1,fast:0},lang:'',tips:{},
  day:'',mis:[],login:{n:0,last:''},idleAt:0,chest:0,box:{day:'',n:0},stat:{runs:0,wins:0,kills:0}};
function lsGet(k){try{return API?API.getStorageSync(k):localStorage.getItem(k);}catch(e){return null;}}
function lsSet(k,v){try{if(API)API.setStorageSync(k,v);else localStorage.setItem(k,v);}catch(e){}}
function loadSave(){let o=null;try{o=JSON.parse(lsGet(SAVE_KEY)||'null');}catch(e){}const s=JSON.parse(JSON.stringify(DEF));
  if(o&&typeof o==='object')for(const k in s){const v=o[k];if(v===undefined||v===null||typeof v!==typeof s[k]||Array.isArray(v)!==Array.isArray(s[k]))continue;if(typeof v==='object'&&!Array.isArray(v))Object.assign(s[k],v);else s[k]=v;}
  if(!s.idleAt)s.idleAt=Date.now();s.team=s.team.filter(id=>s.lv[id]).slice(0,5);if(!s.team.length)s.team=['tt'];while(s.stars.length<STAGES.length)s.stars.push(0);return s;}
let S=loadSave();
function persist(){lsSet(SAVE_KEY,JSON.stringify(S));}

/* ---------- 언어 ---------- */
let LANG=(()=>{const q=QS.get('lang');if(q==='zh'||q==='ko')return q;if(S.lang==='zh'||S.lang==='ko')return S.lang;
  if(API){let l='zh';try{l=API.getSystemInfoSync().language||'zh';}catch(e){}return /^ko/i.test(l)?'ko':'zh';}
  const l=navigator.language||'';let tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch(e){}
  if(/^zh/i.test(l)||/Shanghai|Chongqing|Urumqi|Harbin|Hong_Kong|Macau|Taipei/.test(tz))return 'zh';return /^ko/i.test(l)?'ko':'zh';})();
const L=(ko,zh)=>LANG==='zh'?zh:ko;
const LL=a=>a[LANG==='zh'?1:0];

/* ---------- 통계: 관리자 화면에 같은 이름으로 등록 (README 목록) ---------- */
const TRK=[];
function track(ev,d){try{if(PLAT==='wx'&&API.reportEvent)API.reportEvent(ev,d||{});else if(PLAT==='tt'&&API.reportAnalytics)API.reportAnalytics(ev,d||{});}catch(e){}if(DEBUG){TRK.push(ev);if(TRK.length>300)TRK.shift();}}

/* ---------- 그림 ---------- */
const IMG={},IMG_FAIL={};
const MUST=['tuantuan','tt_cheer','didi','pengpeng','shell','gift'],LATER=['shanshan','dundun','zhuozhuo'];
const HERO_IMG={tt:'tuantuan',didi:'didi',peng:'pengpeng',shan:'shanshan',dun:'dundun',zhuo:'zhuozhuo'};
function loadImg(n,tries){tries=tries||0;const im=API?API.createImage():new Image();
  im.onload=()=>{IMG[n]=im;delete IMG_FAIL[n];};
  im.onerror=()=>{if(tries<8)setTimeout(()=>loadImg(n,tries+1),500+tries*400);else IMG_FAIL[n]=1;};
  im.src='art/'+n+'.webp?v='+BUILD+(tries?'&r='+tries:'');}

/* ---------- 소리: 효과음은 합성, 음악은 퇀퇀 브랜드 원곡 ---------- */
const AU={c:null,m:null,sfxG:null,bgmG:null,nb:null,last:{}};
function auInit(){try{if(AU.c){if(AU.c.state!=='running'&&AU.c.resume)AU.c.resume();return;}
  const AC=API?null:(window.AudioContext||window.webkitAudioContext);AU.c=AC?new AC():(API&&API.createWebAudioContext?API.createWebAudioContext():null);if(!AU.c)return;
  AU.m=AU.c.createGain();AU.m.gain.value=.9;AU.m.connect(AU.c.destination);
  AU.sfxG=AU.c.createGain();AU.sfxG.connect(AU.m);AU.bgmG=AU.c.createGain();AU.bgmG.gain.value=.6;AU.bgmG.connect(AU.m);
  const len=Math.floor(AU.c.sampleRate*.5),b=AU.c.createBuffer(1,len,AU.c.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;AU.nb=b;
  musicSync();}catch(e){AU.c=null;}}
const mtof=m=>440*Math.pow(2,(m-69)/12);
function env(gn,t,a,peak,dec){gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(peak,t+a);gn.gain.exponentialRampToValueAtTime(.0001,t+a+dec);}
function osc(type,f,t,dur,peak,glide){const c=AU.c,o=c.createOscillator(),gn=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(glide)o.frequency.exponentialRampToValueAtTime(glide,t+dur*.7);env(gn,t,.004,peak,dur);o.connect(gn);gn.connect(AU.sfxG);o.start(t);o.stop(t+dur+.05);}
function nz(t,dur,peak,f,type,q){const c=AU.c,s=c.createBufferSource(),fl=c.createBiquadFilter(),gn=c.createGain();s.buffer=AU.nb;fl.type=type||'highpass';fl.frequency.value=f||6000;if(q)fl.Q.value=q;env(gn,t,.003,peak,dur);s.connect(fl);fl.connect(gn);gn.connect(AU.sfxG);s.start(t);s.stop(t+dur+.05);}
function bell(m,t,v,dur){const f=mtof(m);osc('sine',f,t,dur||.6,v);osc('sine',f*2,t,(dur||.6)*.5,v*.3);}
const SFX_GAP={shoot:.07,hit:.05,pop:.05,boom:.09,coin:.05,splash:.08,beam:.12,wall:.15};
function sfx(n,arg){if(!AU.c||!S.opt.sfx)return;try{const now=AU.c.currentTime;if(now-(AU.last[n]||-9)<(SFX_GAP[n]||.02))return;AU.last[n]=now;const t=now+.004;switch(n){
  case 'btn':osc('sine',660,t,.06,.12,880);break;
  case 'shoot':osc('sine',420+(arg||0)*60,t,.05,.035,640+(arg||0)*60);break;
  case 'hit':nz(t,.04,.03,3000,'bandpass',1.2);break;
  case 'pop':osc('sine',520,t,.09,.07,900);break;
  case 'boom':osc('sine',120,t,.22,.14,60);nz(t,.2,.06,2200,'lowpass');break;
  case 'splash':nz(t,.12,.04,1800,'bandpass',.8);break;
  case 'beam':osc('triangle',880,t,.16,.05,1320);break;
  case 'coin':bell(88,t,.06,.25);break;
  case 'wall':osc('triangle',220,t,.14,.12,150);break;
  case 'card':[76,79,84].forEach((m,i)=>bell(m,t+i*.06,.1,.5));break;
  case 'pick':[79,84,88].forEach((m,i)=>bell(m,t+i*.05,.11,.5));break;
  case 'awake':[72,76,79,84,88,91].forEach((m,i)=>bell(m,t+i*.06,.12,.8));break;
  case 'ult':osc('sine',220,t,.35,.14,880);nz(t,.35,.07,1500,'bandpass',.7);break;
  case 'ready':bell(84,t,.09,.4);bell(91,t+.08,.09,.4);break;
  case 'wave':nz(t,.5,.07,900,'bandpass',.6);break;
  case 'surge':nz(t,1.2,.13,700,'lowpass');osc('sine',90,t,.9,.1,140);break;
  case 'ink':osc('sine',300,t,.2,.1,120);break;
  case 'clear':osc('sine',500,t,.1,.09,1000);break;
  case 'boss':[55,58,55,58].forEach((m,i)=>osc('triangle',mtof(m),t+i*.16,.2,.13));break;
  case 'win':[72,76,79,84,88,91,96].forEach((m,i)=>bell(m,t+i*.08,.14,1));break;
  case 'over':[67,64,62,55].forEach((m,i)=>osc('triangle',mtof(m),t+i*.15,.28,.12,mtof(m)*.97));break;
  case 'reward':[84,88,91,96].forEach((m,i)=>bell(m,t+i*.09,.13,.7));break;
  case 'nope':osc('triangle',280,t,.1,.09,200);break;
}}catch(e){}}
// 음악: 한 번 받아서 끊김 없이 반복. 못 받으면 잠시 뒤 다시 시도(간격을 늘려 가며)
const MUSIC={buf:{},loading:{},err:{},src:null,gn:null,cur:null,want:'bgm-menu'};
function loadTrack(n){if(API||MUSIC.buf[n]||MUSIC.loading[n]||!AU.c)return;MUSIC.loading[n]=1;
  fetch('music/'+n+'.mp4?v='+BUILD).then(r=>{if(!r.ok)throw 0;return r.arrayBuffer();})
   .then(ab=>new Promise((res,rej)=>{const p=AU.c.decodeAudioData(ab,res,rej);if(p&&p.catch)p.catch(rej);}))
   .then(b=>{MUSIC.buf[n]=b;MUSIC.loading[n]=0;if(MUSIC.want===n)musicSync();})
   .catch(()=>{const k=MUSIC.err[n]=(MUSIC.err[n]||0)+1;MUSIC.loading[n]=0;if(k<6)setTimeout(()=>loadTrack(n),Math.min(30,Math.pow(2,k))*1000);});}
function musicStop(){if(MUSIC.src){const s=MUSIC.src,gn=MUSIC.gn;try{gn.gain.setTargetAtTime(.0001,AU.c.currentTime,.15);s.stop(AU.c.currentTime+.8);}catch(e){}MUSIC.src=null;MUSIC.gn=null;}MUSIC.cur=null;}
function musicSync(){if(!AU.c)return;const want=MUSIC.want;
  if(!S.opt.bgm||APP.hidden){musicStop();return;}
  if(MUSIC.cur===want&&MUSIC.src)return;
  const b=MUSIC.buf[want];if(!b){loadTrack(want);return;}
  musicStop();const s=AU.c.createBufferSource(),gn=AU.c.createGain();s.buffer=b;s.loop=true;gn.gain.setValueAtTime(.0001,AU.c.currentTime);gn.gain.setTargetAtTime(.8,AU.c.currentTime,.3);
  s.connect(gn);gn.connect(AU.bgmG);s.start();MUSIC.src=s;MUSIC.gn=gn;MUSIC.cur=want;}
function wantMusic(n){if(MUSIC.want!==n){MUSIC.want=n;musicSync();}}
let vibAt=0;
function vib(ms){if(!S.opt.vib)return;const n=Date.now();if(n-vibAt<80)return;vibAt=n;try{if(API){if(ms>30&&API.vibrateLong)API.vibrateLong({});else if(API.vibrateShort)API.vibrateShort({type:'light'});}else if(navigator.vibrate)navigator.vibrate(ms);}catch(e){}}

/* ---------- 보상형 광고: 고를 때만, 끝까지 봐야 보상. 광고 ID가 없으면 2초 테스트 광고 ---------- */
const AD_UNIT={wx:'',tt:''};   // 출시 때 광고 단위 ID를 여기에 넣는다
let adOv=null,adInst=null;
function showAd(place,cb){track('ad_open',{place});const id=API?AD_UNIT[PLAT]:'';
  if(API&&id&&API.createRewardedVideoAd){try{if(!adInst){adInst=API.createRewardedVideoAd({adUnitId:id});adInst.onError(()=>{});}
      const done=r=>{adInst.offClose(done);const ok=!r||r.isEnded;if(ok)track('ad_reward',{place});else toast(L('끝까지 봐야 보상을 받아요','看完才能领取奖励'));cb(!!ok);};
      adInst.onClose(done);adInst.show().catch(()=>adInst.load().then(()=>adInst.show()).catch(()=>{adInst.offClose(done);toast(L('광고를 불러오지 못했어요','广告加载失败'));cb(false);}));return;}catch(e){}}
  adOv={t:2,place,cb};}
function adTick(dt){if(!adOv)return;adOv.t-=dt;if(adOv.t<=0){const a=adOv;adOv=null;track('ad_reward',{place:a.place});a.cb(true);}}
function shareGame(){track('share');const title=L('퇀퇀 해변 수비대: 같이 해변을 지켜요!','团团守海滩：一起守护沙滩吧！');
  try{if(API&&API.shareAppMessage)API.shareAppMessage({title});else if(navigator.share)navigator.share({title,url:location.href.split('?')[0]}).catch(()=>{});else toast(L('주소를 복사해 친구에게 보내 주세요','复制网址发给朋友吧'));}catch(e){}}
if(API){try{API.showShareMenu&&API.showShareMenu({});API.onShareAppMessage&&API.onShareAppMessage(()=>({title:L('퇀퇀 해변 수비대','团团守海滩')}));}catch(e){}}

/* ---------- 터치 ---------- */
const PTR={x:0,y:0,sx:0,sy:0,down:false,moved:false};
function toV(cx,cy){if(API)return {x:(cx*view.pr-view.ox)/view.s,y:(cy*view.pr-view.oy)/view.s};const r=cv.getBoundingClientRect();return {x:(cx-r.left)/r.width*VW,y:(cy-r.top)/r.height*VH};}
function pDown(cx,cy){const p=toV(cx,cy);PTR.x=PTR.sx=p.x;PTR.y=PTR.sy=p.y;PTR.down=true;PTR.moved=false;auInit();onDown(p.x,p.y);}
function pMove(cx,cy){if(!PTR.down)return;const p=toV(cx,cy);PTR.x=p.x;PTR.y=p.y;if(Math.abs(p.x-PTR.sx)+Math.abs(p.y-PTR.sy)>24)PTR.moved=true;}
function pUp(){if(!PTR.down)return;PTR.down=false;onUp(PTR.x,PTR.y);}
if(API){API.onTouchStart(e=>{const t=e.touches[0];if(t)pDown(t.clientX,t.clientY);});API.onTouchMove(e=>{const t=e.touches[0];if(t)pMove(t.clientX,t.clientY);});API.onTouchEnd(()=>pUp());API.onTouchCancel&&API.onTouchCancel(()=>pUp());}
else{cv.addEventListener('pointerdown',e=>{e.preventDefault();pDown(e.clientX,e.clientY);});window.addEventListener('pointermove',e=>pMove(e.clientX,e.clientY));window.addEventListener('pointerup',()=>pUp());window.addEventListener('pointercancel',()=>pUp());
  document.addEventListener('contextmenu',e=>e.preventDefault());}

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

/* ============================== 판 밖 화면: 홈 · 영웅 · 보상 · 설정 · 결과, 그리고 전체 진행 ============================== */
const APP={hidden:false,t:0,toast:null,errs:0,lastErr:'',playSec:0,loadT:0,bot:false,resetArm:0};
let scr='load',RES=null;
const SN=[['모래사장','沙滩'],['갯바위','礁石滩'],['산호초','珊瑚礁'],['해적섬','海盗岛'],['용궁 입구','龙宫门口']];
const HROLE={tt:['만두 폭발 · 가까운 적 담당','包子爆破 · 负责近处'],didi:['물방울 연사 · 적 사이를 튐','水珠连射 · 在敌人间弹跳'],peng:['불꽃 광역 · 소라게에 강함','烟花范围 · 克制寄居蟹'],
  shan:['빛줄기 관통 · 한 줄을 모두 맞힘','光束穿透 · 一整列都命中'],dun:['강타 · 정예와 보스 사냥','重击 · 专打精英和 BOSS'],zhuo:['편지로 느리게 · 동전 보너스','信件减速 · 金币加成']};
function toast(s){APP.toast={s,t:2.2};}
function today(){const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}

/* ---------- 매일 보상 ---------- */
const MIS={run:[2,60,['출전 2번','出战 2 次']],kill:[150,80,['괴물 150마리 돌려보내기','赶走 150 只海怪']],ult:[6,60,['필살기 6번 쓰기','释放必杀 6 次']],card:[12,60,['카드 12장 고르기','选择 12 张卡牌']],
  shell:[8,60,['조개 8개 줍기','捡 8 个贝壳']],win:[1,100,['한 판 클리어','通关 1 次']],up:[1,60,['영웅 1번 키우기','升级伙伴 1 次']]};
const CHEST=[[3,150],[6,250],[9,400],[12,600],[15,1000]],LOGIN=[50,80,120,160,200,260,500],BOX_MAX=3;
function dailyInit(){const t=today();if(S.day===t&&S.mis.length===3)return;S.day=t;let seed=0;for(const ch of t)seed=(seed*31+ch.charCodeAt(0))>>>0;
  const r=makeRng(seed),ids=Object.keys(MIS),pick=[];while(pick.length<3)pick.push({id:ids.splice(Math.floor(r()*ids.length),1)[0],p:0,got:0});S.mis=pick;S.box={day:t,n:0};persist();}
function mission(id,n){for(const m of S.mis)if(m.id===id&&!m.got)m.p=Math.min(MIS[id][0],m.p+n);}
const idleRate=()=>40+30*S.cleared;
function idleAmt(){const h=Math.min(8,Math.max(0,(Date.now()-S.idleAt)/3600000));return Math.floor(h*idleRate());}
const starSum=()=>S.stars.reduce((a,b)=>a+b,0);
const loginReady=()=>S.login.last!==today();
const chestReady=()=>S.chest<CHEST.length&&starSum()>=CHEST[S.chest][0];
function rewardBadge(){return loginReady()||chestReady()||idleAmt()>=idleRate()||S.mis.some(m=>!m.got&&m.p>=MIS[m.id][0]);}
function gain(n,why){S.coins+=n;sfx('reward');toast('+'+n+L(' 동전',' 金币'));track('reward',{why,n});persist();}
const avgLv=()=>{let s=0;for(const id of S.team)s+=S.lv[id]||1;return Math.round(s/S.team.length);};

function goHome(){scr='home';run=null;B=null;paused=false;wantMusic('bgm-menu');dailyInit();S.sel=Math.max(0,Math.min(S.sel,S.cleared,STAGES.length-1));persist();}
function endBattle(){
  const won=run.won,si=run.si,unlock=[];let first=0;
  if(won){S.stat.wins++;mission('win',1);if(S.stars[si]===0)first=REWARD.first[si];S.stars[si]=Math.max(S.stars[si],run.stars);if(S.cleared<si+1)S.cleared=si+1;
    for(const id in UNLOCK)if(S.cleared>=UNLOCK[id]&&!S.lv[id]){S.lv[id]=1;unlock.push(id);if(S.team.length<5)S.team.push(id);}}
  mission('kill',run.kills);S.stat.kills+=run.kills;S.coins+=run.reward+first;
  RES={won,si,stars:run.stars,reward:run.reward,first,unlock,doubled:false,t:0,wave:run.wave,waves:run.S.waves};
  track(won?'stage_clear':'stage_fail',{stage:si+1,wave:run.wave,stars:run.stars,sec:Math.round(run.t/60)});scr='result';wantMusic('bgm-menu');persist();
}

/* ---------- 공통 조각 ---------- */
function topBar(title,back){
  if(back)btn(20,26,96,78,'',()=>{sfx('btn');goHome();},{col:CREAM,dk:'#d9c8a8',icon:(x,y)=>{g.strokeStyle=INK;g.lineWidth=8;g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(x+10,y-18);g.lineTo(x-12,y);g.lineTo(x+10,y+18);g.stroke();}});
  if(title)txt(title,375,66,44,'#fff','center',INK,12);
  panel(540,30,190,70,CREAM,22);icoCoin(574,65,19);txtFit(S.coins,646,66,30,110,INK);
}
function backdrop(dim){g.drawImage(BG,0,0);g.fillStyle='rgba(255,246,228,'+(dim||.5)+')';g.fillRect(0,0,VW,VH);}

function drawLoad(){
  g.fillStyle='#bfe9f5';g.fillRect(0,0,VW,VH);const n=MUST.filter(k=>IMG[k]).length,p=n/MUST.length;
  txt(L('퇀퇀 해변 수비대','团团守海滩'),375,520,64,'#fff','center',INK,16);bar(175,640,400,40,p,MINT);
  txt(APP.loadT>6?L('인터넷이 느려 시간이 걸리고 있어요','网络较慢，请稍等一下'):L('해변으로 가는 중…','正在前往海滩…'),375,720,26,INK);
  if(p>=1||APP.loadT>25){if(p<1)toast(L('그림을 다 받지 못했어요. 새로고침해 주세요','部分图片未加载，请刷新重试'));track('load_done',{sec:Math.round(APP.loadT),ok:p>=1?1:0});goHome();}
}

function drawHome(){
  backdrop(.3);const t=APP.t,si=S.sel,st=STAGES[si];
  panel(20,30,210,70,CREAM,22);icoCoin(54,65,19);txtFit(S.coins,132,66,30,130,INK);
  btn(646,26,84,78,'',()=>{sfx('btn');scr='settings';},{col:CREAM,dk:'#d9c8a8',icon:(x,y)=>{g.fillStyle=INK;for(let i=-1;i<2;i++){rr(x-20,y+i*15-4,40,8,4);g.fill();}}});
  txt(L('퇀퇀 해변 수비대','团团守海滩'),375,196,LANG==='zh'?92:74,'#fff','center',INK,20);
  txt(L('장난꾸러기 바다 괴물로부터 해변 마을을 지켜요','赶走捣蛋的小海怪，守护海滩小镇'),375,268,25,INK,'center','#fff',6);
  S.team.forEach((id,i)=>{const n=S.team.length,x=375+(i-(n-1)/2)*128,b=Math.sin(t*3+i)*.03;drawImg(id==='tt'?'tt_cheer':HERO_IMG[id],x,520,id==='tt'?190:160,{sx:1+b,sy:1-b});});
  // 장 고르기
  panel(60,560,630,330,CREAM,36);
  txt(L('제 ','第 ')+(si+1)+L(' 장 · ',' 关 · ')+LL(SN[si]),375,612,40,INK);
  for(let i=0;i<3;i++)icoStar(315+i*60,672,24,i<S.stars[si]);
  const ks=['crab'].concat(Object.keys(st.mix)).concat([st.boss]);ks.forEach((k,i)=>{const x=375+(i-(ks.length-1)/2)*92,boss=i===ks.length-1;drawSpr(k,x,762,boss?112:80);});
  const low=avgLv()<st.rec;txt(L('권장 영웅 Lv.','推荐伙伴 Lv.')+st.rec+L('  ·  내 평균 Lv.','  ·  我的平均 Lv.')+avgLv(),375,826,24,low?RED:'#3a9478');
  txt(L('추천: ','推荐：')+st.tip.map(id=>LL(HN[id])).join(' · ')+L('  |  파도 ','  |  共 ')+st.waves+L('번',' 波'),375,860,21,'#a07a55');
  if(si>0)btn(20,690,70,90,'‹',()=>{sfx('btn');S.sel--;},{col:CREAM,dk:'#d9c8a8',tc:INK,sz:56});
  if(si<Math.min(S.cleared,STAGES.length-1))btn(660,690,70,90,'›',()=>{sfx('btn');S.sel++;},{col:CREAM,dk:'#d9c8a8',tc:INK,sz:56});
  const pu=1+Math.sin(t*4)*.015;g.save();g.translate(375,975);g.scale(pu,pu);g.translate(-375,-975);btn(165,918,420,116,L('출전!','出发！'),()=>{sfx('btn');startBattle(S.sel);},{sz:56});g.restore();
  btn(50,1082,310,104,L('영웅','伙伴'),()=>{sfx('btn');scr='heroes';tipOnce('heroes',L('동전으로 영웅을 키우면 더 어려운 장도 깰 수 있어요','用金币升级伙伴，就能挑战更难的关卡'));},{col:MINT,dk:MINT_D,sz:40,dot:HERO_IDS.some(id=>S.lv[id]&&S.lv[id]<MAX_LV&&S.coins>=lvCost(S.lv[id]))});
  btn(390,1082,310,104,L('보상','奖励'),()=>{sfx('btn');scr='reward';},{col:YEL,dk:YEL_D,tc:INK,sz:40,dot:rewardBadge()});
  if(APP.playSec>1800){panel(150,300,450,74,'#fffdf3',30);txt(L('오래 했어요. 잠깐 쉬어 가요!','玩了很久啦，休息一下吧！'),375,338,26,INK);}
  if(LANG==='zh'){txt('抵制不良游戏，拒绝盗版游戏。注意自我保护，谨防受骗上当。',375,1232,17,'#7a5a3c');txt('适度游戏益脑，沉迷游戏伤身。合理安排时间，享受健康生活。',375,1258,17,'#7a5a3c');}
  txt('v'+BUILD+(IMG_FAIL&&Object.keys(IMG_FAIL).length?L(' · 그림 일부 실패: 새로고침',' · 部分图片失败：请刷新'):''),375,1306,17,'#a07a55');
}
function tipOnce(key,s){if(!S.tips[key]){S.tips[key]=1;toast(s);APP.toast.t=4;persist();}}

function drawHeroScr(){
  backdrop(.6);topBar(L('영웅','伙伴'),1);
  HERO_IDS.forEach((id,i)=>{const y=128+i*172,own=!!S.lv[id],lv=S.lv[id]||0,inTeam=S.team.includes(id);
    panel(24,y,702,156,own?CREAM:'#e9e2d6',28);g.fillStyle=own?HCOL[id]:'#d6cec0';rr(36,y+12,132,132,22);g.fill();drawImg(HERO_IMG[id],102,y+140,118,{a:own?1:.45});
    txt(LL(HN[id]),186,y+40,34,own?INK:'#8f8475','left');
    if(own){font(34);txt('Lv.'+lv,200+g.measureText(LL(HN[id])).width,y+42,26,RED_D,'left');}
    txtFit(LL(HROLE[id]),186,y+80,21,own?326:500,'#8a6a4a','left');
    if(!own){txt(L('제 ','通关第 ')+UNLOCK[id]+L(' 장을 깨면 합류',' 关后加入'),186,y+122,22,'#8f8475','left');return;}
    txt(L('위력 ','威力 ')+Math.round(heroMul(lv)*100)+'%',186,y+122,21,'#3a9478','left');
    btn(404,y+98,104,46,inTeam?L('출전 중','出战中'):L('쉬는 중','休息'),()=>{sfx('btn');if(inTeam){if(S.team.length>1)S.team=S.team.filter(q=>q!==id);else toast(L('한 명은 꼭 있어야 해요','至少要有一位伙伴'));}else if(S.team.length<5)S.team.push(id);else toast(L('5명까지 데려갈 수 있어요','最多带 5 位伙伴'));persist();},{col:inTeam?MINT:GREY,dk:inTeam?MINT_D:GREY_D,sz:20,r:18});
    if(lv>=MAX_LV)txt('MAX',620,y+78,30,'#d99a1e');
    else{const c=lvCost(lv);btn(524,y+34,186,96,'',()=>{if(S.coins<c){sfx('nope');toast(L('동전이 모자라요','金币不够'));return;}S.coins-=c;S.lv[id]=lv+1;mission('up',1);sfx('pick');track('hero_up',{id,lv:lv+1});persist();},{col:S.coins>=c?RED:GREY,dk:S.coins>=c?RED_D:GREY_D,icon:(x,yy)=>{txt(L('키우기','升级'),x,yy-18,26,'#fff','center',INK);icoCoin(x-36,yy+20,13);txt(c,x+12,yy+21,24,'#fff','center',INK,5);}});}
  });
  txt(L('인연 보너스: 함께 데려가면 붙어요','羁绊加成：一起出战就生效'),375,1180,24,INK);
  txt(L('퇀퇀+둥둥 방파제 +20','团团+墩墩 沙堡 +20')+'   ·   '+L('방울이+반짝 필살기 +15%','滴滴+闪闪 必杀 +15%'),375,1218,21,'#7a5a3c');
  txt(L('펑펑+쫑쫑 동전 +20%','砰砰+啄啄 金币 +20%')+'   ·   '+L('출전 ','出战 ')+S.team.length+' / 5',375,1250,21,'#7a5a3c');
}

function drawReward(){
  backdrop(.6);topBar(L('보상','奖励'),1);const A={col:YEL,dk:YEL_D,tc:INK,sz:24};
  // 찜통 수익
  let y=128;panel(24,y,702,200,CREAM,28);const amt=idleAmt();txt(L('찜통 수익','蒸笼收益'),50,y+38,30,INK,'left');txt(L('꺼 둔 동안에도 모여요 · 1시간에 ','离线也会累积 · 每小时 ')+idleRate()+L(' · 최대 8시간',' · 最多 8 小时'),50,y+76,19,'#8a6a4a','left');
  icoCoin(70,y+140,24);txt(amt,106,y+142,40,INK,'left');
  btn(300,y+104,190,76,L('받기','领取'),()=>{S.idleAt=Date.now();gain(amt,'idle');},{off:amt<1,sz:30});
  btn(506,y+104,204,76,L('▶ 2시간치 더','▶ 再领 2 小时'),()=>showAd('idle',o=>{if(o)gain(idleRate()*2,'idle_ad');}),A);
  // 7일 출석
  y=348;panel(24,y,702,196,CREAM,28);txt(L('7일 출석','7 日签到'),50,y+38,30,INK,'left');const day=S.login.n%7,rdy=loginReady();
  LOGIN.forEach((v,i)=>{const x=44+i*74,done=i<day||(i===day&&!rdy&&S.login.n>0&&false);g.fillStyle=i<day?'#cfeedd':i===day&&rdy?'#ffe9a8':'#f1e7d3';rr(x,y+66,66,84,14);g.fill();g.lineWidth=3;g.strokeStyle=INK;g.stroke();txt(i+1,x+33,y+86,18,'#8a6a4a');icoCoin(x+33,y+112,11);txt(i<day?'✓':v,x+33,y+136,17,INK);});
  btn(572,y+72,138,76,rdy?L('받기','签到'):L('내일 또','明天见'),()=>{const v=LOGIN[S.login.n%7];S.login.n++;S.login.last=today();gain(v,'login');},{off:!rdy,sz:26});
  // 오늘의 임무
  y=564;panel(24,y,702,320,CREAM,28);txt(L('오늘의 임무','今日任务'),50,y+38,30,INK,'left');
  S.mis.forEach((m,i)=>{const d=MIS[m.id],yy=y+70+i*82,done=m.p>=d[0];txtFit(LL(d[2]),50,yy+22,25,360,INK,'left');bar(50,yy+44,330,22,m.p/d[0],MINT);txt(m.p+' / '+d[0],215,yy+55,15,'#fff','center',INK,3);
    icoCoin(420,yy+36,13);txt(d[1],458,yy+37,22,INK);
    if(m.got)txt(L('완료','已领取'),620,yy+36,24,'#3a9478');else btn(540,yy+4,170,66,L('받기','领取'),()=>{m.got=1;gain(d[1],'mission');},{off:!done,sz:26});});
  // 별 상자
  y=904;panel(24,y,702,150,CREAM,28);txt(L('별 상자','星星宝箱'),50,y+38,30,INK,'left');const ss=starSum();
  if(S.chest>=CHEST.length)txt(L('모두 받았어요!','全部领完啦！'),375,y+96,26,'#3a9478');
  else{const c=CHEST[S.chest];icoStar(64,y+98,18,1);bar(92,y+82,300,32,ss/c[0],YEL);txt(ss+' / '+c[0],242,y+98,18,'#fff','center',INK,4);icoCoin(424,y+98,14);txt(c[1],470,y+99,24,INK);
    btn(540,y+62,170,70,L('열기','打开'),()=>{S.chest++;gain(c[1],'chest');},{off:ss<c[0],sz:26});}
  // 무료 상자
  y=1074;panel(24,y,702,130,CREAM,28);const left=BOX_MAX-(S.box.day===today()?S.box.n:0),bv=100+60*S.cleared;drawImg('gift',76,y+110,84);
  txt(L('무료 선물 상자','免费礼盒'),130,y+44,28,INK,'left');txt(L('오늘 ','今天还剩 ')+left+' / '+BOX_MAX+L(' 남음 · 동전 ',' 次 · 金币 ')+bv,130,y+86,21,'#8a6a4a','left');
  btn(480,y+30,230,74,L('▶ 광고 보고 열기','▶ 看广告打开'),()=>showAd('box',o=>{if(o){if(S.box.day!==today())S.box={day:today(),n:0};S.box.n++;gain(bv,'box');}}),Object.assign({off:left<=0},A));
  txt(L('광고는 모두 보고 싶을 때만 봐요','所有广告都是自愿观看'),375,1256,20,'#8a6a4a');
}

function drawSettings(){
  backdrop(.6);topBar(L('설정','设置'),1);const C={col:CREAM,dk:'#d9c8a8',tc:INK,sz:30};
  const row=(i,label,on,fn)=>{const y=150+i*110;panel(60,y,630,92,CREAM,26);txt(label,96,y+47,30,INK,'left');btn(500,y+12,170,64,on?'ON':'OFF',()=>{sfx('btn');fn();persist();},{col:on?MINT:GREY,dk:on?MINT_D:GREY_D,sz:28});};
  row(0,L('음악','音乐'),S.opt.bgm,()=>{S.opt.bgm^=1;musicSync();});row(1,L('효과음','音效'),S.opt.sfx,()=>{S.opt.sfx^=1;});
  row(2,L('진동','振动'),S.opt.vib,()=>{S.opt.vib^=1;});row(3,L('화면 흔들림','画面震动'),S.opt.shake,()=>{S.opt.shake^=1;});
  btn(60,610,630,88,LANG==='zh'?'语言：中文  →  한국어':'언어: 한국어  →  中文',()=>{sfx('btn');LANG=LANG==='zh'?'ko':'zh';S.lang=LANG;persist();},C);
  btn(60,718,630,88,L('친구에게 알리기','分享给朋友'),()=>{sfx('btn');shareGame();},C);
  btn(60,826,630,88,L('개인정보 처리방침','隐私政策'),()=>{sfx('btn');scr='privacy';},C);
  const arm=APP.resetArm>0;btn(60,934,630,88,arm?L('한 번 더 누르면 모두 지워져요','再点一次将清空全部进度'):L('진행 초기화','重置进度'),()=>{if(arm){lsSet(SAVE_KEY,'');S=loadSave();APP.resetArm=0;toast(L('처음부터 다시 시작해요','已重置'));goHome();}else{APP.resetArm=3;sfx('nope');}},{col:arm?RED:GREY,dk:arm?RED_D:GREY_D,sz:28});
  txt(L('출전 ','出战 ')+S.stat.runs+L('번 · 클리어 ',' 次 · 通关 ')+S.stat.wins+L('번 · 돌려보낸 괴물 ',' 次 · 赶走海怪 ')+S.stat.kills,375,1090,22,'#7a5a3c');
  txt('v'+BUILD+' · '+PLAT,375,1130,20,'#a07a55');
}
function drawPrivacy(){
  backdrop(.75);topBar(L('개인정보 처리방침','隐私政策'),1);panel(40,140,670,900,CREAM,30);
  const s=L('이 게임은 이름·사진·전화번호·위치를 묻거나 모으지 않아요.\n\n게임 진행(동전, 영웅 레벨, 별, 설정)은 이 기기 안에만 저장돼요. 진행 초기화를 누르면 모두 지워져요.\n\n광고는 플랫폼(위챗·더우인)의 광고 기능으로 보여 주며, 어린이에게 맞는 광고 설정을 사용해요. 광고는 모두 직접 고를 때만 나와요.\n\n미성년자 이용 시간과 실명 확인은 플랫폼의 보호 기능을 그대로 따라요.\n\n문의: 게임 소개 화면의 연락처',
    '本游戏不会询问或收集姓名、照片、电话、位置等个人信息。\n\n游戏进度（金币、伙伴等级、星星、设置）仅保存在本设备内，点击“重置进度”即可全部清除。\n\n广告由平台（微信、抖音）的广告功能提供，并启用适合儿童的广告设置。所有广告都只在玩家主动选择时出现。\n\n未成年人游戏时长与实名认证，遵循平台的防沉迷功能。\n\n联系方式：见游戏简介页面');
  g.textAlign='left';wrap(s,76,196,24,600,38,INK,'left');
}

function drawResult(){
  backdrop(.55);const r=RES;r.t+=1/60;BT.length=0;panel(60,210,630,900,CREAM,40);
  drawImg(r.won?'tt_cheer':'didi_sick',375,400,r.won?230:150);
  txt(r.won?L('해변을 지켰어요!','守住海滩啦！'):L('아쉬워요!','差一点点！'),375,470,56,r.won?RED:INK);
  txt(L('제 ','第 ')+(r.si+1)+L(' 장 · ',' 关 · ')+LL(SN[r.si])+(r.won?'':'  ·  '+L('파도 ','到第 ')+r.wave+' / '+r.waves+L('',' 波')),375,528,26,'#8a6a4a');
  for(let i=0;i<3;i++){const on=i<r.stars,pop=on?Math.min(1,Math.max(0,(r.t-.3-i*.25)*5)):1;icoStar(275+i*100,608,(i===1?46:40)*(on?(.6+.4*pop):1),on&&pop>0);}
  if(r.won&&r.stars<3)txt(L('방파제를 한 번도 안 맞으면 별 3개','沙堡一次都不被碰到就是 3 星'),375,672,21,'#a07a55');
  if(!r.won)txt(L('영웅을 키우거나 추천 영웅을 데려가 봐요','试试升级伙伴，或带上推荐伙伴'),375,672,23,'#a07a55');
  icoCoin(270,740,30);txt('+'+(r.reward*(r.doubled?2:1)+r.first),400,742,54,INK);
  if(r.first)txt(L('첫 클리어 보너스 +','首次通关奖励 +')+r.first,375,796,22,'#3a9478');
  let y=822;
  if(r.unlock.length){const id=r.unlock[0];g.fillStyle=HCOL[id];rr(110,y,530,84,24);g.fill();g.lineWidth=4;g.strokeStyle=INK;g.stroke();drawImg(HERO_IMG[id],170,y+82,84);txt(L('새 친구 ','新伙伴 ')+r.unlock.map(q=>LL(HN[q])).join('·')+L(' 합류!',' 加入啦！'),400,y+43,30,INK);y+=98;}
  if(!r.doubled&&r.reward>0)btn(150,y,450,76,L('▶ 광고 보고 동전 2배','▶ 看广告金币翻倍'),()=>showAd('double',o=>{if(o){r.doubled=true;S.coins+=r.reward;sfx('reward');persist();}}),{col:YEL,dk:YEL_D,tc:INK,sz:30});
  if(r.won){btn(100,1012,270,76,L('한 번 더','再来一次'),()=>{sfx('btn');startBattle(r.si);},{col:MINT,dk:MINT_D,sz:28});
    btn(390,1012,260,76,r.si<STAGES.length-1?L('다음 장으로','下一关'):L('홈으로','回主页'),()=>{sfx('btn');if(r.si<STAGES.length-1)S.sel=r.si+1;goHome();},{sz:28});
    if(API||(typeof navigator!=='undefined'&&navigator.share))btn(610,226,64,60,'',()=>shareGame(),{col:CREAM,dk:'#d9c8a8',icon:(x,yy)=>{g.strokeStyle=INK;g.lineWidth=5;g.lineCap='round';g.beginPath();g.moveTo(x,yy+12);g.lineTo(x,yy-12);g.moveTo(x-10,yy-3);g.lineTo(x,yy-13);g.lineTo(x+10,yy-3);g.stroke();}});}
  else{btn(100,1012,270,76,L('영웅 키우기','升级伙伴'),()=>{sfx('btn');goHome();scr='heroes';},{col:MINT,dk:MINT_D,sz:28});btn(390,1012,260,76,L('다시 도전','再挑战'),()=>{sfx('btn');startBattle(r.si);},{sz:28});}
}

/* ---------- 한 프레임 ---------- */
function draw(){
  if(API)g.setTransform(1,0,0,1,0,0),g.fillStyle='#bfe9f5',g.fillRect(0,0,cv.width,cv.height),g.setTransform(view.s,0,0,view.s,view.ox,view.oy);else g.setTransform(1,0,0,1,0,0);
  g.globalAlpha=1;BT=[];
  if(scr==='load')drawLoad();else if(scr==='home')drawHome();else if(scr==='battle')drawBattle();else if(scr==='result')drawResult();else if(scr==='heroes')drawHeroScr();else if(scr==='reward')drawReward();else if(scr==='settings')drawSettings();else drawPrivacy();
  if(adOv){BT.length=0;g.fillStyle='rgba(20,14,10,.88)';g.fillRect(0,0,VW,VH);txt(L('테스트 광고','测试广告'),375,600,54,'#fff');txt(L('출시 때 진짜 광고로 바뀌어요','上线后会换成正式广告'),375,670,26,'#d8c8b0');txt(Math.ceil(adOv.t),375,770,80,'#ffd93d');}
  if(APP.toast){const o=Math.min(1,APP.toast.t*3);g.globalAlpha=o;font(28);const w=Math.min(700,g.measureText(APP.toast.s).width+70);g.fillStyle='rgba(60,36,20,.9)';rr(375-w/2,1120,w,70,35);g.fill();txtFit(APP.toast.s,375,1156,28,w-40,'#fff');g.globalAlpha=1;}
}
function onDown(x,y){if(scr==='battle'&&B)battleDown(x,y);}
function onUp(x,y){
  if(adOv)return;
  if(scr==='battle'&&B&&B.drag&&PTR.moved){battleUp(x,y);return;}
  if(!PTR.moved){const s={x:PTR.sx,y:PTR.sy};for(let i=BT.length-1;i>=0;i--){const b=BT[i];if(hitR(PTR,b.x,b.y,b.w,b.h)&&hitR(s,b.x,b.y,b.w,b.h)){if(B)B.drag=null;b.fn();return;}}}
  if(scr==='battle'&&B)battleUp(x,y);
}
function botStep(){if(!run||scr!=='battle'||paused)return;
  if(run.phase==='card'){if(B.cardT>.4)pickCard(run,Math.floor(Math.random()*run.offer.length));}else if(run.phase==='revive')revive(run);
  else if(run.phase==='run'&&Math.random()<.1){for(const l of run.loot.slice())tapField(run,l.x,l.y);for(const h of run.heroes)if(h)tapHero(run,h.slot);}}
let lastTs=0;
function frame(ts){
  const dt=Math.min(.1,Math.max(0,(ts-lastTs)/1000||0));lastTs=ts;APP.t+=dt;if(scr==='load')APP.loadT+=dt;if(APP.toast&&(APP.toast.t-=dt)<=0)APP.toast=null;if(APP.resetArm>0)APP.resetArm-=dt;
  try{adTick(dt);if(scr==='battle'&&B){APP.playSec+=dt;if(APP.bot)botStep();battleTick(dt);}draw();}
  catch(e){APP.errs++;APP.lastErr=String(e&&e.stack||e);if(APP.errs<4)track('draw_error',{m:String(e&&e.message||e).slice(0,80)});}
  requestAnimationFrame(frame);
}
function onAppHide(){APP.hidden=true;if(scr==='battle'&&run&&!run.ended)paused=true;if(AU.c)musicStop();persist();track('app_hide',{scr});}
function onAppShow(){APP.hidden=false;musicSync();}
if(API){API.onHide&&API.onHide(onAppHide);API.onShow&&API.onShow(onAppShow);
  try{const um=API.getUpdateManager&&API.getUpdateManager();if(um)um.onUpdateReady(()=>um.applyUpdate());}catch(e){}}
else document.addEventListener('visibilitychange',()=>document.hidden?onAppHide():onAppShow());

mkSprites();mkBg();MUST.forEach(n=>loadImg(n));LATER.forEach(n=>loadImg(n));dailyInit();track('app_open',{lang:LANG});
if(DEBUG)window.__bepaDebug={get S(){return S;},get run(){return run;},get B(){return B;},APP,TRK,go:s=>{if(s==='home')goHome();else scr=s;},start:i=>startBattle(i||0),bot:b=>{APP.bot=!!b;},speed:n=>{speed=n;},
  give:n=>{S.coins+=n;},unlockAll:()=>{HERO_IDS.forEach(id=>{if(!S.lv[id])S.lv[id]=1;});S.cleared=5;S.team=HERO_IDS.slice(0,5);},win:()=>{if(run)finish(run,true);},lose:()=>{if(run){run.wall=0;finish(run,false);}},
  scr:()=>scr,ad:()=>adOv,lang:l=>{LANG=l;},draw,core:{step,tapHero,pickCard,spawn,beginSurge,inkHero,fireUlt,revive}};
requestAnimationFrame(frame);

})();
