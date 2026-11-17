/* ============================== 게임 규칙: 화면·소리를 모르고 1/60초 고정 틱으로 돈다 (봇이 Node 에서 그대로 실행) ============================== */
const DT=1/TICK;
const dist=(a,b,c,d)=>Math.hypot(a-c,b-d);
const isBoss=k=>!!ENEMIES[k].ph;
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
  const S=stageInfo(si),Ldef=LAYOUTS[S.lay],mx=x=>S.mir?W-x:x,segs={};
  for(const id in Ldef.segs)segs[id]=mkSeg(id,Ldef.segs[id].map(q=>[mx(q[0]),q[1]]));
  const gates={};
  for(const id in Ldef.next){const n=Ldef.next[id];if(typeof n==='object'){const e=segs[id].p[segs[id].p.length-1];
    if(!gates[n.g])gates[n.g]={g:n.g,x:e[0],y:e[1],to:n.to.slice(),st:0};}}
  const cur=[...(Ldef.cur||[]),...S.cur].map(c=>({seg:c[0],d0:c[1]*segs[c[0]].len,d1:c[2]*segs[c[0]].len,mul:c[3]}));
  const vents=[...(Ldef.vent||[]),...S.vent].map(v=>{const P=segPos(segs[v[0]],v[1]*segs[v[0]].len);return {seg:v[0],d:v[1]*segs[v[0]].len,x:P.x,y:P.y,cd:0};});
  /* 수호탑 자리: 길에서 적당히 떨어진 바위 위, 길을 많이 덮는 곳부터 고른다 */
  const pts=[];for(const id in segs){const s=segs[id];for(let i=0;i<s.p.length;i+=2)pts.push(s.p[i]);}
  const cov=pts.filter((_,i)=>i%2===0),cnt=new Array(cov.length).fill(0),spots=[],caves=Ldef.start.map(id=>segs[id].p[0]);
  const cands=[];
  for(let y=84;y<=680;y+=6)for(let x=26;x<=424;x+=6){
    let md=1e9;for(const p of pts){const d=(p[0]-x)*(p[0]-x)+(p[1]-y)*(p[1]-y);if(d<md)md=d;}md=Math.sqrt(md);
    if(md<45||md>66||dist(x,y,TEMPLE.x,TEMPLE.y)<100||(Math.abs(x-TEMPLE.x)<92&&y>TEMPLE.y-118)||caves.some(c=>dist(x,y,c[0],c[1])<SAFE+35)||Object.values(gates).some(g=>dist(x,y,g.x,g.y)<34))continue;
    const near=[];cov.forEach((p,i)=>{if(dist(x,y,p[0],p[1])<105)near.push(i);});cands.push({x,y,near});
  }
  for(let k=0;k<S.spots;k++){
    let best=null,bs=-1;
    for(const c of cands){if(spots.some(s=>dist(s.x,s.y,c.x,c.y)<52))continue;let sc=0;for(const i of c.near)sc+=1/(1+cnt[i]*1.6);if(sc>bs){bs=sc;best=c;}}
    if(!best)break;spots.push({x:best.x,y:best.y});for(const i of best.near)cnt[i]++;
  }
  return MAPS[si]={si,name:Ldef.name,segs,start:Ldef.start,next:Ldef.next,gates,cur,vents,spots,caves};
}

/* ---------- 한 판 ---------- */
class Game{
  constructor(si,meta){
    this.lv={};for(const k of [...TOWER_IDS,'hero'])this.lv[k]=meta&&meta.lv&&meta.lv[k]||(meta&&meta.lv?1:recLv(si));
    this.cmdCd={slam:0};this.crewCd={};this.allies=[];this.ampT=0;this.purified=0;this.hasteT=0;this.hasteMul=0;this.cmdUsed=0;this.awakened=0;this.cardsPicked=0;
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
  tw(k){return masteryMul(this.lv[k]||1);}
  cost(k){return Math.round(TOWERS[k].cost*(1-this.B.disc));}
  upCost(t){return t.lv>=MAX_TLV?0:Math.round(TOWERS[t.k].cost*UP_COST[t.lv-1]*(1-this.B.disc));}
  sellVal(t){return Math.round(t.spent*SELL);}
  unlocked(k){return UNLOCK[k]<=this.si;}
  range(t){return TOWERS[t.k].range*LV_RANGE[t.lv-1]*(t.ink>0?.6:1);}
  dmg(t){return TOWERS[t.k].dmg*LV_DMG[t.lv-1]*this.tw(t.k)*(t.br==='giant'?1.25:t.br==='purge'?1.8:1)*(1+this.B.dmg)*(1+t.aura)*(this.ampT>0?1+CREW.rune.amp:1);}
  rate(t){return TOWERS[t.k].cd/(1+t.haste+(t.k==='coral'?this.B.coral:0)+(t.br==='storm'?.5:0))*(t.ink>0?1.5:1);}
  heroDmg(){return HERO.dmg*this.tw('hero')*(1+.22*(this.hero.lv-1))*(1+this.B.hero);}
  visible(e){return !e.inv||e.rev;}
  /* ---- 조작 ---- */
  build(spot,k){const c=this.cost(k);if(this.gold<c||!this.unlocked(k)||this.towers.some(t=>t.spot===spot))return false;
    const s=this.M.spots[spot],t={id:this.uid++,k,lv:1,x:s.x,y:s.y,spot,cd:.2,sc:0,shots:0,ink:0,haste:0,hasteT:0,aura:0,kick:0,ang:-Math.PI/2,spent:c,whirl:false,beam:0};
    t.sc=this.skillCdOf(t)*.5;this.gold-=c;this.towers.push(t);this.ev.push({t:'build',x:s.x,y:s.y,k});return true;}
  upgrade(t,b){const c=this.upCost(t);if(!c||this.gold<c)return false;if(t.lv===MAX_TLV-1){if(b!==0&&b!==1)return false;t.br=BRANCH[t.k][b].id;this.awakened++;}
    this.gold-=c;t.spent+=c;t.lv++;this.ev.push({t:t.lv===MAX_TLV?'awaken':'up',x:t.x,y:t.y,k:t.k});return true;}
  sell(t){this.gold+=this.sellVal(t);this.towers=this.towers.filter(x=>x!==t);this.ev.push({t:'sell',x:t.x,y:t.y});}
  clean(t){if(t.ink>0){t.ink=0;this.ev.push({t:'clean',x:t.x,y:t.y});return true;}return false;}
  flipGate(g){const G=this.M.gates[g];if(!G||this.keys<=0)return false;this.keys--;G.st^=1;G.flash=1;this.ev.push({t:'gate',x:G.x,y:G.y});return true;}
  moveHero(x,y){const h=this.hero;h.tx=Math.max(20,Math.min(W-20,x));h.ty=Math.max(70,Math.min(700,y));}
  cmdReady(k){return this.si>=CMD[k].from&&this.cmdCd[k]<=0&&this.state==='run';}
  cmd(k,x,y){if(!this.cmdReady(k))return false;const C=CMD[k],h=this.hero,m=this.tw('hero')*(1+.22*(h.lv-1))*(1+this.B.hero);
    if(k==='slam'){for(const e of this.enemies)if(!e.dead&&dist(e.x,e.y,h.x,h.y)<C.r+e.r){this.hurt(e,C.dmg*m,'exp');e.stun=Math.max(e.stun,isBoss(e.k)?.3:C.stun);}this.ev.push({t:'slam',x:h.x,y:h.y,r:C.r});}
    else if(k==='torpedo'){for(const e of this.enemies)if(!e.dead&&dist(e.x,e.y,x,y)<C.r+e.r)this.hurt(e,C.dmg*m*(dist(e.x,e.y,x,y)<C.r*.5?1:.7),'exp');this.ev.push({t:'torp',x,y,r:C.r});}
    else{for(const e of this.enemies){if(e.dead)continue;this.hurt(e,C.dmg*m,'mag');if(e.dead||isBoss(e.k))continue;e.kb=C.push*(e.k==='elite'?.5:1);e.slow=Math.max(e.slow,C.slow);e.slowT=Math.max(e.slowT,C.slowT);}this.ev.push({t:'tide'});}
    this.cmdCd[k]=C.cd*this.B.heroCd;this.cmdUsed++;return true;}
  crewPw(k){let p=0;for(const t of this.towers)if(t.k===k)p+=LV_DMG[t.lv-1];return p;}
  crewReady(k){return CREW[k]&&CREW[k].sk&&this.state==='run'&&!(this.crewCd[k]>0)&&this.towers.some(t=>t.k===k);}
  crewSkill(k){if(!this.crewReady(k))return false;const C=CREW[k],pw=Math.min(6,this.crewPw(k)),m=this.tw(k)*(1+this.B.dmg);
    if(k==='coral'){for(const t of this.towers)if(t.k==='coral'){t.haste=Math.max(t.haste,1);t.hasteT=C.dur;}}
    else if(k==='bubble'){for(const e of this.enemies){if(e.dead)continue;this.hurt(e,C.dmg*pw*m,'mag');if(!e.dead&&!isBoss(e.k)){e.slow=Math.max(e.slow,C.slow);e.slowT=Math.max(e.slowT,C.dur);}}}
    else if(k==='jelly'){for(const e of this.enemies){if(e.dead||e.spawnT>.45)continue;this.hurt(e,C.dmg*pw*m,'mag');if(!e.dead)e.stun=Math.max(e.stun,isBoss(e.k)?.2:C.stun);}}
    else if(k==='conch'){const tg=this.enemies.filter(e=>!e.dead).sort((a,b)=>b.prog-a.prog)[0];if(!tg)return false;for(const t of this.towers)if(t.k==='conch')this.projs.push({kind:'shell',x:t.x,y:t.y-16,tx:tg.x,ty:tg.y,tid:tg.id,sp:420,dmg:this.dmg(t)*1.6,cls:'exp',from:'conch',lv:t.lv,a:0,br:t.br});}
    else if(k==='rune'){this.ampT=C.dur;}
    this.crewCd[k]=C.cd;this.cmdUsed++;this.ev.push({t:'crew',k});return true;}
  /* 정화된 생물이 잠깐 우리 편이 된다 */
  purify(e){const P=PURE[e.k];this.purified++;if(!P||(this.allies.length>40&&P.act!=='gift'))return;
    const a={id:this.uid++,k:e.k,act:P.act,x:e.x,y:e.y,a:e.a,seg:e.seg,d:e.d,prog:e.prog,r:e.r,t:P.t||1.1,T:P.t||1.1,hit:new Set(),pure:1};
    if(P.act==='gift'){this.gold+=P.gold;a.t=a.T=.9;}
    else if(P.act==='shock'){const near=this.enemies.filter(o=>!o.dead&&o!==e&&dist(o.x,o.y,e.x,e.y)<P.r).sort((p,q)=>dist(p.x,p.y,e.x,e.y)-dist(q.x,q.y,e.x,e.y)).slice(0,P.n),pts=[[e.x,e.y]];
      for(const o of near){pts.push([o.x,o.y]);this.hurt(o,P.dmg*this.S.hp,'mag');if(!o.dead&&!isBoss(o.k))o.stun=Math.max(o.stun,P.stun);}if(near.length)this.ev.push({t:'zap',pts,pure:1});a.t=a.T=1.2;}
    else if(P.act==='sweep'){a.left=P.len;a.t=a.T=P.len/P.sp+.4;}
    else if(P.act==='block'&&P.stun){for(const o of this.enemies)if(!o.dead&&o!==e&&!isBoss(o.k)&&dist(o.x,o.y,e.x,e.y)<60)o.stun=Math.max(o.stun,P.stun);}
    this.allies.push(a);this.ev.push({t:'pure',x:e.x,y:e.y,k:e.k,act:P.act});}
  allyTick(dt){for(const a of this.allies){a.t-=dt;
      if(a.act==='sweep'&&a.left>0){const P=PURE[a.k],st=Math.min(a.left,P.sp*dt,a.d);a.left=st<=0?0:a.left-st;a.d-=st;a.prog-=st;const Q=segPos(this.M.segs[a.seg],a.d);a.x=Q.x;a.y=Q.y;a.a=Q.a+Math.PI;
        for(const o of this.enemies)if(!o.dead&&!a.hit.has(o.id)&&dist(o.x,o.y,a.x,a.y)<o.r+14){a.hit.add(o.id);this.hurt(o,P.dmg*this.S.hp,'mag');if(!o.dead&&!isBoss(o.k)){o.kb=Math.max(o.kb||0,18);}this.ev.push({t:'hit',x:o.x,y:o.y,k:'bolt'});}}
      else if(a.act==='gift'){a.y-=40*dt;a.x+=Math.cos(a.a)*30*dt;}
      else if(a.act==='shock'||a.left===0){a.y-=18*dt;}}
    this.allies=this.allies.filter(a=>a.t>0);}
  callWave(){if(this.state==='prep'){this.requestWave();return true;}
    if(this.state!=='run'||this.spawning||this.wave>=this.S.waves)return false;
    if(this.nextT>0)this.gold+=Math.ceil(this.nextT)*EARLY_BONUS;this.requestWave();return true;}
  requestWave(){
    if(this.wave>0&&this.wave%CARD_EVERY===0&&this.cardedAt!==this.wave){this.cardedAt=this.wave;this.cards=this.genCards();this.pendMut=this.si<3?null:this.pickMut();this.state='card';this.ev.push({t:'cards'});return;}
    this.startWave();
  }
  pickCard(i){if(this.state!=='card')return;const k=this.cards[i];this.applyBless(k);this.cardsPicked++;if(this.pendMut)this.addMut(this.pendMut);this.cards=null;this.state='run';this.startWave();}
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
    this.spawnQ.sort((a,b)=>a.at-b.at);this.ev.push({t:'wave',w:this.wave,boss:W_.groups.some(g=>isBoss(g.k)),cur:changed});
  }
  spawn(k,start,hpm,at){
    const E=ENEMIES[k],M=this.M,boss=isBoss(k),on=this.si>=(E.from||0),elite=k==='elite';
    let mhp=E.hp*(boss?this.S.hp:hpm)*(1+.15*this.mut.hp);
    const e={id:this.uid++,k,mhp,hp:mhp,sp:E.sp*(1+.12*this.mut.speed),r:E.r,armor:Math.min(.75,(E.armor||0)+.12*this.mut.armor),seg:at?at.seg:M.start[start],d:at?at.d:0,prog:at?at.prog:0,
      x:0,y:0,a:0,slow:0,slowT:0,stun:0,trap:0,lift:0,dashT:0,dashed:false,inv:false,rev:false,phT:0,phase:null,hT:2,iT:3,lastHit:9,shield:0,shellMax:0,spawnT:at?.2:.7,leak:E.leak||(E.cost>=5?2:1),dead:false,hitT:0,bossPh:0};
    e.shield=mhp*.15*this.mut.shield*(boss?.5:1);
    if(E.phase&&on)e.phase=E.phase;else if(this.mut.shadow&&!boss&&!elite&&this.rnd()<.12+.13*this.mut.shadow)e.phase=[4.5,2.2];
    if(e.phase)e.phT=e.phase[0]*this.rnd();
    if(E.shell&&on){e.shellMax=mhp*E.shell;e.shield+=e.shellMax;}
    if(at){e.d+=(this.rnd()-.5)*20;}
    const P=segPos(M.segs[e.seg],e.d);e.x=P.x;e.y=P.y;e.a=P.a;this.enemies.push(e);return e;
  }
  /* ---- 피해 ---- */
  hurt(e,d,cls){
    if(e.dead)return;const eff=cls==='phy'?e.armor:cls==='exp'?e.armor*.5:0;d*=(1-eff);if(e.trap>0||e.lift>0)d*=1+VENT.amp;
    e.lastHit=0;e.hitT=.12;e.vd=(e.vd||0)+d;if(e.shield>0){const a=Math.min(e.shield,d);e.shield-=a;d-=a;}
    e.hp-=d;if(e.hp<=0)this.kill(e);
  }
  kill(e){
    e.dead=true;const E=ENEMIES[e.k],gg=E.gold;this.gold+=gg;this.kills++;this.ev.push({t:'kill',x:e.x,y:e.y,k:e.k,g:gg,f:Math.cos(e.a)<0?-1:1,vd:e.vd||0});
    const h=this.hero;h.xp+=E.cost||8;while(h.lv<HERO.lvXp.length&&h.xp>=HERO.lvXp[h.lv]){h.lv++;this.ev.push({t:'hlv',x:h.x,y:h.y});}
    this.purify(e);const at={seg:e.seg,d:e.d,prog:e.prog};
    if(E.split&&this.si>=(E.from||0))for(let i=0;i<E.split;i++)this.spawn('minnow',0,e.mhp/E.hp*.9,at);
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
    if(this.hasteT>0)this.hasteT-=dt;if(this.ampT>0)this.ampT-=dt;for(const k in this.crewCd)if(this.crewCd[k]>0)this.crewCd[k]-=dt;
    const blocks=this.allies.filter(a=>a.act==='block');for(const k in this.cmdCd)if(this.cmdCd[k]>0)this.cmdCd[k]-=dt;
    const cmdrs=this.enemies.filter(e=>!e.dead&&ENEMIES[e.k].command),minn=this.enemies.filter(e=>!e.dead&&e.k==='minnow');
    for(const e of this.enemies){
      if(e.dead)continue;const E=ENEMIES[e.k],on=this.si>=(E.from||0);e.ox=e.x;e.oy=e.y;
      if(e.spawnT>0)e.spawnT-=dt;if(e.hitT>0)e.hitT-=dt;e.lastHit+=dt;
      if(e.slowT>0){e.slowT-=dt;if(e.slowT<=0)e.slow=0;}
      if(e.stun>0)e.stun-=dt;if(e.trap>0)e.trap-=dt;if(e.lift>0)e.lift-=dt;if(e.dashT>0)e.dashT-=dt;
      if(e.purgeT>0)e.purgeT-=dt;if(e.cloakT>0){e.cloakT-=dt;e.inv=e.cloakT>0;}
      if(e.clampT>0){e.clampT-=dt;if(e.clampT<=0)e.armor-=E.clamp[1];}
      if(E.clamp&&on&&!e.clamped&&e.hp<e.mhp*E.clamp[0]){e.clamped=true;e.clampT=E.clamp[2];e.armor+=E.clamp[1];this.ev.push({t:'clamp',x:e.x,y:e.y});}
      if(e.poiT>0){e.poiT-=dt;this.hurt(e,e.poiD*dt,'mag');if(e.dead)continue;}
      if(this.mut.regen&&!(e.purgeT>0)&&e.hp<e.mhp)e.hp=Math.min(e.mhp,e.hp+e.mhp*.012*this.mut.regen*dt);
      if(e.shellMax&&!(e.purgeT>0)&&e.lastHit>3&&e.shield<e.shellMax){e.shield=e.shellMax;this.ev.push({t:'shell',x:e.x,y:e.y});}
      if(e.phase){e.phT+=dt;const cyc=e.phase[0]+e.phase[1],m=e.phT%cyc;const inv=m>e.phase[0];if(inv!==e.inv){e.inv=inv;}}
      if(E.dash&&on&&!e.dashed&&e.hp<e.mhp*.55){e.dashed=true;e.dashT=1.4;this.ev.push({t:'dash',x:e.x,y:e.y});}
      if(E.heal&&this.si>=(E.from||0)){e.hT-=dt;if(e.hT<=0){e.hT=E.heal[0];let n=0;for(const o of this.enemies)if(!o.dead&&o!==e&&!isBoss(o.k)&&dist(o.x,o.y,e.x,e.y)<E.heal[2]&&o.hp<o.mhp){o.hp=Math.min(o.mhp,o.hp+o.mhp*E.heal[1]);n++;}if(n)this.ev.push({t:'heal',x:e.x,y:e.y,r:E.heal[2]});}}
      if(E.ink&&on){e.iT-=dt;if(e.iT<=0){let bt=null,bd=E.ink[1];for(const t of this.towers){const d=dist(t.x,t.y,e.x,e.y);if(d<bd&&t.ink<=0){bd=d;bt=t;}}
        if(bt){bt.ink=E.ink[2];e.iT=E.ink[0];this.ev.push({t:'ink',x:e.x,y:e.y,tx:bt.x,ty:bt.y});}else e.iT=1;}}
      if(E.ph){const P=E.ph[e.bossPh];if(P&&e.hp/e.mhp<P[0]){e.bossPh++;this.bossAct(e,P);}}
      if(e.kb>0){const st=Math.min(e.kb,240*dt,e.d);e.kb=st<=0?0:e.kb-st;e.d-=st;e.prog-=st;const P=segPos(M.segs[e.seg],e.d);e.x=P.x;e.y=P.y;continue;}
      if(e.stun>0||e.trap>0||e.lift>0)continue;
      let v=e.sp*(1-e.slow)*(e.dashT>0?E.dash:1)*(this.hasteT>0?1+this.hasteMul:1);
      if(E.school&&on){let c=0;for(const o of minn)if(o!==e&&Math.abs(o.x-e.x)<40&&Math.abs(o.y-e.y)<40&&++c>=4)break;if(c>=4){v*=1+E.school;e.schooling=true;}else e.schooling=false;}
      if(cmdrs.length&&!E.command&&!E.ph)for(const c of cmdrs)if(dist(c.x,c.y,e.x,e.y)<ENEMIES[c.k].command[0]){v*=1+ENEMIES[c.k].command[1];break;}
      for(const c of M.cur)if(c.seg===e.seg&&e.d>=c.d0&&e.d<=c.d1){v*=(B.rev&&c.mul>1)?.62:c.mul;break;}
      if(e.spawnT>0)v*=.5;
      const d0=e.d;e.d+=v*dt;e.prog+=v*dt;
      for(const b of blocks)if(b.seg===e.seg&&b.d>=d0-1&&e.d>b.d-12){if(isBoss(e.k)){b.t=0;}else{const back=e.d-(b.d-12);e.d-=back;e.prog-=back;e.blocked=.2;}}
      if(!isBoss(e.k))for(const vt of M.vents)if(vt.seg===e.seg&&d0<vt.d&&e.d>=vt.d&&vt.cd<=0){e.lift=(VENT.lift+B.ventLift)*(e.k==='elite'?.5:1);vt.cd=VENT.cd*B.ventCd;this.ev.push({t:'vent',x:vt.x,y:vt.y});}
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
    for(const r of this.towers)if(r.k==='rune'){const a=TOWERS.rune.aura+.05*(r.lv-1)+B.aura+(r.br==='amp'?.2:0),rr=this.range(r);for(const t of this.towers)if(t!==r&&dist(t.x,t.y,r.x,r.y)<rr)t.aura=Math.max(t.aura,a);}
    for(const t of this.towers)this.towerTick(t,dt);
    /* 투사체 */
    for(const p of this.projs){const tg=p.tid?this.enemies.find(e=>e.id===p.tid&&!e.dead):null;if(tg){p.tx=tg.x;p.ty=tg.y;}
      const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy),st=p.sp*dt;
      if(d<=st+3){p.dead=true;this.impact(p,tg);}else{p.x+=dx/d*st;p.y+=dy/d*st;p.a=Math.atan2(dy,dx);}}
    this.projs=this.projs.filter(p=>!p.dead);
    /* 소용돌이 */
    for(const z of this.zones){z.t-=dt;for(const e of this.enemies)if(!e.dead&&dist(e.x,e.y,z.x,z.y)<z.r+e.r){this.hurt(e,z.dps*dt,'mag');if(!isBoss(e.k)){e.slow=Math.max(e.slow,z.slow);e.slowT=Math.max(e.slowT,.2);}}}
    this.zones=this.zones.filter(z=>z.t>0);
    /* 영웅 */
    this.heroTick(dt);this.allyTick(dt);
    this.enemies=this.enemies.filter(e=>!e.dead);
    if(this.lives<=0){this.lives=0;this.state='lose';this.ev.push({t:'lose'});return;}
    if(this.wave>=this.S.waves&&!this.spawning&&!this.spawnQ.length&&!this.enemies.length){this.state='win';this.ev.push({t:'win'});}
  }
  bossAct(e,P){const at={seg:e.seg,d:e.d+12,prog:e.prog},a=P[1];
    if(a==='summon'){for(let i=0;i<P[3];i++)this.spawn(P[2],0,this.S.hp*(P[2]==='minnow'?1.3:.6),at);this.ev.push({t:'roar',x:e.x,y:e.y});}
    else if(a==='ink'){for(const t of this.towers)t.ink=P[2];this.ev.push({t:'dark',x:e.x,y:e.y});}
    else if(a==='jam'){this.towers.slice().sort((p,q)=>dist(p.x,p.y,e.x,e.y)-dist(q.x,q.y,e.x,e.y)).slice(0,P[2]).forEach(t=>t.ink=P[3]);this.ev.push({t:'dark',x:e.x,y:e.y});}
    else if(a==='shield'){e.shield+=e.mhp*P[2];this.ev.push({t:'roar',x:e.x,y:e.y,m:'shield'});}
    else if(a==='haste'){this.hasteMul=P[2];this.hasteT=P[3];this.ev.push({t:'roar',x:e.x,y:e.y,m:'haste'});}
    else if(a==='cloak'){e.cloakT=P[2];this.ev.push({t:'roar',x:e.x,y:e.y,m:'cloak'});}
    else if(a==='heal'){for(const o of this.enemies)if(!o.dead)o.hp=Math.min(o.mhp,o.hp+o.mhp*P[2]);this.ev.push({t:'roar',x:e.x,y:e.y,m:'heal'});}
  }
  leak(e){e.dead=true;this.lives-=e.leak;this.lost+=e.leak;this.ev.push({t:'leak',x:e.x,y:e.y,n:e.leak});}
  stars(){return this.state!=='win'?0:this.lives>=STAR_LIVES[0]?3:this.lives>=STAR_LIVES[1]?2:1;}
  skillCdOf(t){const T=this.tier(),f=TSKILL[t.k](T);return f.cd||5;}
  target(t,r){let best=null,bp=-1;for(const e of this.enemies){if(e.dead||!this.visible(e)||e.prog<SAFE)continue;if(dist(e.x,e.y,t.x,t.y)<r+e.r*.5&&e.prog>bp){bp=e.prog;best=e;}}return best;}
  towerTick(t,dt){
    const T=TOWERS[t.k],tier=this.tier(),SK=TSKILL[t.k](tier),r=this.range(t);
    if(t.br==='tempest')SK.cd*=.6;else if(t.br==='storm')SK.every=Math.max(2,SK.every-1);else if(t.br==='frost')SK.dur*=1.6;else if(t.br==='amp')SK.dur*=1.5;
    if(t.ink>0)t.ink-=dt;if(t.kick>0)t.kick-=dt*4;if(t.hasteT>0){t.hasteT-=dt;if(t.hasteT<=0)t.haste=0;}if(t.beam>0)t.beam-=dt;
    t.cd-=dt;if(SK.cd)t.sc-=dt;
    const tg=this.target(t,r);if(tg)t.ang=Math.atan2(tg.y-t.y,tg.x-t.x);
    /* 스킬 */
    if(SK.cd&&t.sc<=0){
      if(t.k==='bubble'){let b=null;for(const e of this.enemies)if(!e.dead&&!isBoss(e.k)&&e.trap<=0&&dist(e.x,e.y,t.x,t.y)<r&&(!b||e.hp>b.hp))b=e;
        if(b){b.trap=(SK.dur+this.B.trap)*(b.k==='elite'?.5:1);t.sc=SK.cd;this.ev.push({t:'trap',x:b.x,y:b.y,id:b.id});}}
      else if(t.k==='jelly'){const hit=this.enemies.filter(e=>!e.dead&&dist(e.x,e.y,t.x,t.y)<r+e.r);
        if(hit.length>=2||hit.some(e=>e.k==='elite'||isBoss(e.k))){const dm=SK.dmg*LV_DMG[t.lv-1]*this.tw('jelly')*(1+this.B.dmg);for(const e of hit){this.hurt(e,dm,'mag');if(!e.dead)e.stun=Math.max(e.stun,isBoss(e.k)?.1:SK.stun);}
          t.sc=SK.cd;this.ev.push({t:'storm',x:t.x,y:t.y,r});}}
      else if(t.k==='conch'){if(!t.whirl&&tg){t.whirl=true;t.sc=SK.cd;}}
      else if(t.k==='rune'){if(tg){for(const o of this.towers)if(dist(o.x,o.y,t.x,t.y)<r+8){o.haste=SK.haste;o.hasteT=SK.dur;}t.sc=SK.cd;this.ev.push({t:'reso',x:t.x,y:t.y,r});}}
    }
    if(!tg||t.cd>0)return;
    t.cd=this.rate(t);t.kick=1;const dm=this.dmg(t);
    if(t.k==='jelly'){const pts=[[t.x,t.y-14]],hit=new Set();let cur=tg,dd=dm,n=T.chain+this.B.chain+(t.br==='tempest'?3:0);
      while(cur&&n>0){hit.add(cur.id);pts.push([cur.x,cur.y]);this.hurt(cur,dd,'mag');if(t.br==='paralyze'&&!cur.dead&&!isBoss(cur.k)&&this.rnd()<.25)cur.stun=Math.max(cur.stun,.5);dd*=T.fall;n--;
        let nx=null,nd=72;for(const e of this.enemies)if(!e.dead&&!hit.has(e.id)&&this.visible(e)&&e.prog>=SAFE){const d=dist(e.x,e.y,cur.x,cur.y);if(d<nd){nd=d;nx=e;}}cur=nx;}
      this.ev.push({t:'zap',pts});return;}
    if(t.k==='rune'){if(t.br==='purge'){tg.shield=Math.max(0,tg.shield-dm*2);tg.purgeT=2;}this.hurt(tg,dm,'mag');t.beam=.12;t.beamX=tg.x;t.beamY=tg.y;return;}
    if(t.k==='coral'){t.shots++;if(t.shots%SK.every===0){const a=t.ang,x2=t.x+Math.cos(a)*SK.len,y2=t.y+Math.sin(a)*SK.len;
      for(const e of this.enemies){if(e.dead)continue;const px=e.x-t.x,py=e.y-t.y,u=Math.max(0,Math.min(SK.len,px*Math.cos(a)+py*Math.sin(a))),qx=t.x+Math.cos(a)*u,qy=t.y+Math.sin(a)*u;
        if(dist(e.x,e.y,qx,qy)<e.r+8)this.hurt(e,dm*SK.mul,'phy');}
      this.ev.push({t:'pierce',x:t.x,y:t.y,x2,y2});return;}}
    if(t.br==='triple'){const c=this.enemies.filter(e=>!e.dead&&this.visible(e)&&dist(e.x,e.y,t.x,t.y)<r+e.r).sort((p,q)=>q.prog-p.prog);
      for(let i=0;i<3;i++){const g2=c[Math.min(i,c.length-1)]||tg;this.projs.push({kind:T.proj,x:t.x,y:t.y-16,tx:g2.x+(i-1)*8,ty:g2.y,tid:c.length>i?g2.id:0,sp:T.speed*(1-i*.08),dmg:dm*.55,cls:T.cls,from:t.k,lv:t.lv,a:t.ang,whirl:i===0&&t.whirl,br:t.br});}}
    else this.projs.push({kind:T.proj,x:t.x,y:t.y-16,tx:tg.x,ty:tg.y,tid:tg.id,sp:T.speed,dmg:dm,cls:T.cls,from:t.k,lv:t.lv,a:t.ang,whirl:t.k==='conch'&&t.whirl,br:t.br});
    if(t.k==='conch')t.whirl=false;
  }
  impact(p,tg){
    if(p.kind==='shell'){const R=TOWERS.conch.aoe*(1+this.B.conchR)*(p.br==='giant'?1.5:1);for(const e of this.enemies)if(!e.dead&&dist(e.x,e.y,p.tx,p.ty)<R+e.r)this.hurt(e,dist(e.x,e.y,p.tx,p.ty)<R*.5?p.dmg:p.dmg*.7,'exp');
      this.ev.push({t:'boom',x:p.tx,y:p.ty,r:R});
      if(p.whirl){const SK=TSKILL.conch(this.tier());this.zones.push({x:p.tx,y:p.ty,r:SK.r,t:SK.dur,T:SK.dur,dps:SK.dps*LV_DMG[p.lv-1]*this.tw('conch')*(1+this.B.dmg),slow:SK.slow});this.ev.push({t:'whirl',x:p.tx,y:p.ty});}
      return;}
    if(!tg)return;
    if(p.kind==='bub'){this.hurt(tg,p.dmg,'mag');if(!tg.dead&&!isBoss(tg.k)){tg.slow=Math.max(tg.slow,TOWERS.bubble.slow+this.B.bubSlow+(p.br==='frost'?.2:0));tg.slowT=TOWERS.bubble.slowT;}
      if(p.br==='blast'){for(const e of this.enemies)if(!e.dead&&e!==tg&&dist(e.x,e.y,tg.x,tg.y)<36+e.r){this.hurt(e,p.dmg*1.5,'mag');if(!e.dead&&!isBoss(e.k)){e.slow=Math.max(e.slow,.25);e.slowT=Math.max(e.slowT,1);}}this.ev.push({t:'boom',x:tg.x,y:tg.y,r:36});}this.ev.push({t:'pop',x:tg.x,y:tg.y});return;}
    this.hurt(tg,p.dmg,p.cls);if(p.br==='venom'&&!tg.dead){tg.poiT=3;tg.poiD=p.dmg*.45;if(!tg.shred){tg.shred=1;tg.armor=Math.max(0,tg.armor-.15);}}this.ev.push({t:'hit',x:tg.x,y:tg.y,k:p.kind});
  }
  heroTick(dt){
    const h=this.hero;h.ox=h.x;h.oy=h.y;if(h.atk>0)h.atk-=dt*4;h.moving=false;
    if(h.tx!==null){const dx=h.tx-h.x,dy=h.ty-h.y,d=Math.hypot(dx,dy),st=HERO.sp*dt;if(d<=st){h.x=h.tx;h.y=h.ty;h.tx=null;}else{h.x+=dx/d*st;h.y+=dy/d*st;h.face=dx>=0?1:-1;h.moving=true;}}
    h.cd-=dt;if(h.cd>0)return;
    let best=null,bd=HERO.range;for(const e of this.enemies){if(e.dead||e.prog<SAFE)continue;const d=dist(e.x,e.y,h.x,h.y);if(d<bd+e.r*.5&&(!best||e.prog>best.prog)){best=e;}}
    if(!best)return;h.cd=HERO.cd;h.atk=1;h.face=best.x>=h.x?1:-1;
    this.projs.push({kind:'bolt',x:h.x+h.face*10,y:h.y-12,tx:best.x,ty:best.y,tid:best.id,sp:700,dmg:this.heroDmg(),cls:'phy',from:'hero',lv:1,a:0});
  }
}
