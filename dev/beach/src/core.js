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
