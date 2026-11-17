(()=>{"use strict";
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

/* ============================== 게임 규칙: 화면·소리·저장을 전혀 모른다 ==============================
   고정 틱(1/60초)이라 60Hz·120Hz 폰에서 속도가 같고, 봇이 Node에서 사람 없이 돌릴 수 있다.
   화면에 알릴 일은 s.fx 목록에 쌓고, 화면 쪽이 읽어 가며 비운다. */
function makeRng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

/* ---------- 길: 꺾이는 점들을 부드러운 곡선으로 바꿔 4px 간격으로 잘라 둔다 ---------- */
const PATH_STEP=4;
function buildPath(pts){
  const P=[pts[0]].concat(pts,[pts[pts.length-1]]),raw=[];
  for(let i=1;i<P.length-2;i++){const a=P[i-1],b=P[i],c=P[i+1],d=P[i+2];for(let k=0;k<24;k++){const t=k/24,t2=t*t,t3=t2*t;
    raw.push([.5*((2*b[0])+(-a[0]+c[0])*t+(2*a[0]-5*b[0]+4*c[0]-d[0])*t2+(-a[0]+3*b[0]-3*c[0]+d[0])*t3),.5*((2*b[1])+(-a[1]+c[1])*t+(2*a[1]-5*b[1]+4*c[1]-d[1])*t2+(-a[1]+3*b[1]-3*c[1]+d[1])*t3)]);}}
  raw.push(pts[pts.length-1]);
  const out=[{x:raw[0][0],y:raw[0][1]}];let carry=0;
  for(let i=1;i<raw.length;i++){let ax=raw[i-1][0],ay=raw[i-1][1];const bx=raw[i][0],by=raw[i][1];let seg=Math.hypot(bx-ax,by-ay);if(seg<1e-6)continue;const ux=(bx-ax)/seg,uy=(by-ay)/seg;
    while(carry+seg>=PATH_STEP){const m=PATH_STEP-carry;ax+=ux*m;ay+=uy*m;seg-=m;carry=0;out.push({x:ax,y:ay});}carry+=seg;}
  return {s:out,len:(out.length-1)*PATH_STEP};
}
function pathPos(p,d){const f=Math.max(0,Math.min(p.len,d))/PATH_STEP,i=Math.min(p.s.length-2,Math.floor(f)),t=f-i,a=p.s[i],b=p.s[i+1];return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};}
/* 타워 자리: 길에서 적당히 떨어져 있고 길을 가장 많이 덮는 곳부터 고른다 */
function pickSpots(paths,n){
  const all=[];for(const p of paths)for(let i=0;i<p.s.length;i+=2)all.push(p.s[i]);const cand=[];
  for(let y=128;y<=672;y+=14)for(let x=40;x<=410;x+=14){let md=1e9,cov=0;for(const q of all){const d=(q.x-x)**2+(q.y-y)**2;if(d<md)md=d;if(d<92*92)cov++;}if(md<41*41||md>60*60)continue;cand.push({x,y,cov});}
  cand.sort((a,b)=>b.cov-a.cov||a.y-b.y||a.x-b.x);const out=[];
  for(const c of cand){if(out.length>=n)break;if(out.every(o=>(o.x-c.x)**2+(o.y-c.y)**2>=74*74))out.push({x:c.x,y:c.y,cov:c.cov});}
  return out.sort((a,b)=>a.y-b.y||a.x-b.x);
}
const STAGE_GEO=[];
function stageGeo(si){if(!STAGE_GEO[si]){const paths=STAGES[si].paths.map(buildPath);STAGE_GEO[si]={paths,spots:pickSpots(paths,STAGES[si].spots)};}return STAGE_GEO[si];}

function newGame(si,opt){
  opt=opt||{};const S=STAGES[si],G=stageGeo(si);
  return {si,S,paths:G.paths,spots:G.spots.map(p=>({x:p.x,y:p.y,tw:null})),rand:makeRng(opt.seed||si*977+13),lv:opt.lv||{},owned:opt.owned||TOWER_IDS.slice(0,3),
    t:0,acc:0,phase:'run',gold:S.gold+(opt.gold||0),lives:START_LIVES,wave:0,ws:'prep',gapT:0,queue:[],en:[],pr:[],zones:[],fx:[],uid:1,
    cd:{tide:0,bomb:0},revives:1,revived:false,kills:0,built:0,ups:0,casts:0,leaked:0,boss:null,bossT:0,surge:0,ended:false,won:false,stars:0,reward:0,next:waveDef(si,1)};
}

/* ---------- 타워 ---------- */
function towerStat(s,tw){const b=TOWERS[tw.id],L=tw.lv-1,m=heroMul(s.lv[tw.id]||1),br=tw.br;
  const o={dmg:b.dmg*LV_DMG[L]*m,range:b.range*LV_RANGE[L],cd:b.cd,aoe:b.aoe||0,slow:b.slow||0,slowT:b.slowT||0,shots:1,gold:b.gold||0};
  if(br==='king'){o.aoe*=1.55;o.stun=.6;}else if(br==='twin')o.shots=2;
  else if(br==='ice'){o.slow=.65;o.slowT=2;}else if(br==='jet'){o.pierce=true;o.dmg*=1.25;}
  else if(br==='dragon')o.burn=o.dmg*.35;else if(br==='star')o.cluster=3;
  else if(br==='rainbow')o.chain=2;else if(br==='moon'){o.shred=.35;o.dmg*=1.2;}
  else if(br==='smash')o.big=3;else if(br==='double')o.shots=2;
  else if(br==='express')o.gold=3;else if(br==='parcel'){o.dmg*=5;o.aoe*=1.25;}
  return o;}
function towerCost(id){return TOWERS[id].cost;}
function upCost(tw){return tw.lv>=4?0:Math.round(TOWERS[tw.id].cost*UP_COST[tw.lv-1]/5)*5;}
function build(s,i,id){const sp=s.spots[i],c=towerCost(id);if(!sp||sp.tw||s.phase!=='run'||s.gold<c||!s.owned.includes(id))return false;s.gold-=c;sp.tw={id,lv:1,br:'',spent:c,cd:.3,ink:0,tgt:0,ramp:0,anim:0};s.built++;s.fx.push({e:'build',i,id});return true;}
function upgrade(s,i,br){const sp=s.spots[i],tw=sp&&sp.tw;if(!tw||tw.lv>=4||s.phase!=='run')return false;const c=upCost(tw);if(s.gold<c)return false;
  if(tw.lv===3){if(BRANCH[tw.id].indexOf(br)<0)return false;tw.br=br;}s.gold-=c;tw.spent+=c;tw.lv++;s.ups++;s.fx.push({e:'up',i,id:tw.id,lv:tw.lv,br:tw.br});return true;}
function sell(s,i){const sp=s.spots[i];if(!sp||!sp.tw||s.phase!=='run')return false;const g=Math.round(sp.tw.spent*SELL);s.gold+=g;sp.tw=null;s.fx.push({e:'sell',i,g});return true;}
function cleanInk(s,i){const tw=s.spots[i]&&s.spots[i].tw;if(!tw||tw.ink<=0)return false;tw.ink=0;s.fx.push({e:'inkClear',i});return true;}

/* ---------- 파도 ---------- */
function callWave(s){
  if(s.phase!=='run'||s.wave>=s.S.waves||(s.ws!=='prep'&&s.ws!=='gap'))return false;
  if(s.ws==='gap'&&s.gapT>0){const b=Math.round(s.gapT/TICK*BONUS_PER_SEC);if(b>0){s.gold+=b;s.fx.push({e:'bonus',g:b});}}
  s.wave++;s.ws='fight';const d=waveDef(s.si,s.wave);s.cur=d;s.next=s.wave<s.S.waves?waveDef(s.si,s.wave+1):null;
  for(const gr of d.groups)for(let k=0;k<gr.n;k++)s.queue.push({at:s.t+Math.round((gr.delay+k*gr.gap)*TICK),k:gr.k,path:gr.path});
  s.queue.sort((a,b)=>a.at-b.at);s.fx.push({e:'wave',w:s.wave,boss:s.wave===s.S.waves});return true;
}
function spawn(s,k,pi,d0){
  const b=ENEMIES[k],hp=k==='boss'?s.S.bossHp:b.hp*s.cur.hp,p=s.paths[pi%s.paths.length];
  const e={id:s.uid++,k,bk:k==='boss'?s.S.boss:'',pi:pi%s.paths.length,d:d0||0,x:0,y:0,hp,max:hp,sp:b.sp,r:b.r,armor:b.armor||0,air:!!b.air,gold:b.gold,leak:b.leak||1,
    slow:0,slowT:0,stun:0,shred:0,hit:0,inkT:(b.ink||0)*TICK*.5,ph:s.rand()*6.28,ox:k==='boss'?0:(s.rand()-.5)*15,oy:k==='boss'?0:(s.rand()-.5)*9,dead:false,len:p.len};
  if(e.air){const a=p.s[0],z=p.s[p.s.length-1];e.ax=a.x+(s.rand()-.5)*120;e.ay=a.y;e.zx=z.x;e.zy=z.y;e.len=Math.hypot(e.zx-e.ax,e.zy-e.ay);}
  place(s,e);s.en.push(e);if(k==='boss'){s.boss=e;s.bossT=0;s.fx.push({e:'boss',bk:e.bk});}return e;
}
function place(s,e){if(e.air){const q=Math.min(1,e.d/e.len);e.x=e.ax+(e.zx-e.ax)*q;e.y=e.ay+(e.zy-e.ay)*q;}else{const p=pathPos(s.paths[e.pi],e.d);e.x=p.x+e.ox;e.y=p.y+e.oy;}}

function hurt(s,e,d,cls){
  if(e.dead)return;
  if(cls==='exp')d*=e.k==='hermit'?1.5:1-e.armor;else if(cls==='phy')d*=1-e.armor;
  if(e.shred>0)d*=1.35;
  e.hp-=d;e.hit=6;s.fx.push({e:'hit',x:e.x,y:e.y,v:d,k:e.k,weak:cls==='exp'&&e.k==='hermit',res:cls!=='mag'&&e.armor>=.5&&!(cls==='exp'&&e.k==='hermit')});
  if(e.hp<=0){e.dead=true;s.kills++;let g=e.gold;
    for(const sp of s.spots){const tw=sp.tw;if(tw&&tw.id==='zhuo'&&tw.ink<=0){const st=towerStat(s,tw);if((sp.x-e.x)**2+(sp.y-e.y)**2<st.range*st.range){g+=st.gold;break;}}}
    s.gold+=g;s.fx.push({e:'die',x:e.x,y:e.y,k:e.k,bk:e.bk,g,air:e.air});}
}
function blast(s,x,y,r,d,cls,kind,eff,air){
  for(const e of s.en){if(e.dead||(e.air&&!air))continue;const q=r+e.r;if((e.x-x)**2+(e.y-y)**2<q*q){hurt(s,e,d,cls);if(eff&&!e.dead){if(eff.slow&&e.k!=='boss'){e.slow=Math.max(e.slow,eff.slow);e.slowT=Math.max(e.slowT,eff.slowT*TICK);}if(eff.stun&&e.k!=='boss')e.stun=Math.max(e.stun,eff.stun*TICK);}}}
  s.fx.push({e:'blast',x,y,r,kind});
}
const progress=e=>e.d/e.len;
function pickTarget(s,sp,st,b,skip,strong){
  let best=null,bv=-1;const r2=st.range*st.range;
  for(const e of s.en){if(e.dead||(e.air&&!b.air)||(skip&&skip.indexOf(e.id)>=0))continue;if((e.x-sp.x)**2+(e.y-sp.y)**2>r2)continue;const v=strong?e.hp:progress(e);if(v>bv){bv=v;best=e;}}
  return best;
}
function stepTowers(s){
  for(let i=0;i<s.spots.length;i++){const sp=s.spots[i],tw=sp.tw;if(!tw)continue;if(tw.anim>0)tw.anim--;
    if(tw.ink>0){tw.ink--;tw.tgt=0;continue;}
    tw.cd-=1/TICK;if(tw.cd>0)continue;const b=TOWERS[tw.id],st=towerStat(s,tw);
    if(b.beam){ // 등롱 빛줄기: 한 적을 계속 비출수록 세진다
      let t=null;if(tw.tgt)for(const e of s.en)if(e.id===tw.tgt&&!e.dead&&(e.x-sp.x)**2+(e.y-sp.y)**2<=st.range*st.range){t=e;break;}
      if(!t){t=pickTarget(s,sp,st,b);tw.ramp=0;}
      if(!t){tw.tgt=0;tw.cd=.1;continue;}
      tw.tgt=t.id;tw.ramp=Math.min(12,tw.ramp+1);tw.cd=st.cd;tw.anim=4;const d=st.dmg*(1+tw.ramp*.08);if(st.shred)t.shred=TICK;hurt(s,t,d,'mag');
      const links=[t.id];if(st.chain){let from=t;for(let c=0;c<st.chain;c++){let n=null,bd=70*70;for(const e of s.en){if(e.dead||links.indexOf(e.id)>=0)continue;const q=(e.x-from.x)**2+(e.y-from.y)**2;if(q<bd){bd=q;n=e;}}if(!n)break;links.push(n.id);hurt(s,n,d*.6,'mag');from=n;}}
      tw.links=links;if(s.t%12===0)s.fx.push({e:'shoot',i,id:tw.id});continue;}
    const skip=[];let fired=false;
    for(let n=0;n<st.shots;n++){const t=pickTarget(s,sp,st,b,skip,tw.id==='dun');if(!t)break;skip.push(t.id);fired=true;
      const p={k:b.proj,i,x:sp.x,y:sp.y-22,tid:t.id,tx:t.x,ty:t.y,sp:b.speed/TICK,dmg:st.dmg,cls:b.cls,st,air:b.air,t:0,seen:[]};
      if(b.proj==='bun'||b.proj==='fw'||b.proj==='mail'){const T=Math.max(14,Math.hypot(t.x-p.x,t.y-p.y)/p.sp),lead=t.stun>0||t.air?0:t.sp*(1-t.slow)*T/TICK,q=t.air?t:pathPos(s.paths[t.pi],t.d+lead);p.sx=p.x;p.sy=p.y;p.tx=q.x;p.ty=q.y;p.T=T;p.lob=true;}
      else if(st.pierce){const dd=Math.hypot(t.x-p.x,t.y-p.y)||1;p.vx=(t.x-p.x)/dd*p.sp;p.vy=(t.y-p.y)/dd*p.sp;p.life=st.range*1.25/p.sp;p.line=true;}
      s.pr.push(p);}
    if(fired){tw.cd=st.cd;tw.anim=10;s.fx.push({e:'shoot',i,id:tw.id});}else tw.cd=.1;
  }
}
function land(s,p){
  const st=p.st;
  if(p.k==='bun'){blast(s,p.x,p.y,st.aoe,p.dmg,'exp','bun',st.stun?{stun:st.stun}:null,false);}
  else if(p.k==='fw'){blast(s,p.x,p.y,st.aoe,p.dmg,'exp','fw',null,true);
    if(st.cluster)for(let c=0;c<st.cluster;c++){const a=c*2.09+p.x;blast(s,p.x+Math.cos(a)*34,p.y+Math.sin(a)*34,st.aoe*.8,p.dmg*.45,'exp','fw',null,true);}
    if(st.burn)s.zones.push({x:p.x,y:p.y,r:st.aoe*1.3,dps:st.burn,t:3*TICK});}
  else if(p.k==='mail'){blast(s,p.x,p.y,st.aoe,p.dmg,'mag','mail',{slow:st.slow,slowT:st.slowT},false);}
}
function stepProjectiles(s){
  for(const p of s.pr){p.t++;
    if(p.lob){const q=p.t/p.T;p.x=p.sx+(p.tx-p.sx)*q;p.y=p.sy+(p.ty-p.sy)*q;if(q>=1){land(s,p);p.done=true;}continue;}
    if(p.line){p.x+=p.vx;p.y+=p.vy;for(const e of s.en){if(e.dead||p.seen.indexOf(e.id)>=0)continue;if((e.x-p.x)**2+(e.y-p.y)**2<(e.r+5)**2){p.seen.push(e.id);hurt(s,e,p.dmg,p.cls);if(!e.dead&&p.st.slow&&e.k!=='boss'){e.slow=Math.max(e.slow,p.st.slow);e.slowT=Math.max(e.slowT,p.st.slowT*TICK);}s.fx.push({e:'splash',x:e.x,y:e.y});}}if(p.t>=p.life)p.done=true;continue;}
    let t=null;for(const e of s.en)if(e.id===p.tid&&!e.dead){t=e;break;}
    if(t){p.tx=t.x;p.ty=t.y;}
    const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy);
    if(d<=p.sp+4){p.x=p.tx;p.y=p.ty;p.done=true;if(t){let dm=p.dmg;if(p.st.big&&(t.k==='boss'||t.k==='elite'))dm*=p.st.big;hurt(s,t,dm,p.cls);if(!t.dead&&p.st.slow&&t.k!=='boss'){t.slow=Math.max(t.slow,p.st.slow);t.slowT=Math.max(t.slowT,p.st.slowT*TICK);}}s.fx.push({e:p.k==='ball'?'pingpong':'splash',x:p.x,y:p.y});}
    else{p.x+=dx/d*p.sp;p.y+=dy/d*p.sp;}
  }
  s.pr=s.pr.filter(p=>!p.done);
  if(s.zones.length){for(const z of s.zones){z.t--;if(z.t%15===0)for(const e of s.en)if(!e.dead&&(e.x-z.x)**2+(e.y-z.y)**2<(z.r+e.r)**2)hurt(s,e,z.dps*.25,'exp');}s.zones=s.zones.filter(z=>z.t>0);}
}
function inkTower(s,x,y,n){const c=s.spots.map((sp,i)=>({i,sp,d:(sp.x-x)**2+(sp.y-y)**2})).filter(o=>o.sp.tw&&o.sp.tw.ink<=0&&o.d<150*150).sort((a,b)=>a.d-b.d);for(let k=0;k<n&&k<c.length;k++){c[k].sp.tw.ink=5*TICK;s.fx.push({e:'ink',i:c[k].i,x,y});}return c.length>0;}
function stepEnemies(s){
  const surge=s.surge>0;if(surge)s.surge--;
  for(const e of s.en){if(e.dead)continue;if(e.hit>0)e.hit--;if(e.shred>0)e.shred--;if(e.slowT>0){if(--e.slowT<=0)e.slow=0;}
    if(e.stun>0){e.stun--;continue;}
    e.d+=e.sp/TICK*(1-e.slow)*(surge&&e.k!=='boss'?1.7:1);place(s,e);
    if(e.k==='octo'&&--e.inkT<=0){e.inkT=ENEMIES.octo.ink*TICK;if(inkTower(s,e.x,e.y,1))s.fx.push({e:'spit',x:e.x,y:e.y});}
    if(e.d>=e.len){e.dead=true;s.lives=Math.max(0,s.lives-e.leak);s.leaked+=e.leak;s.fx.push({e:'leak',x:e.x,y:e.y,n:e.leak,k:e.k});
      if(s.lives<=0&&s.phase==='run'){if(s.revives>0)s.phase='revive';else finish(s,false);s.fx.push({e:'down'});}}
  }
  if(s.boss&&!s.boss.dead&&s.boss.stun<=0&&++s.bossT>=8*TICK){s.bossT=0;const b=s.boss;
    if(b.bk==='kingcrab'){for(let i=0;i<3;i++){const m=spawn(s,'crab',b.pi,Math.max(0,b.d-12-i*14));m.hp=m.max=m.max*.7;}}
    else if(b.bk==='octoboss'){inkTower(s,b.x,b.y,3);for(let i=0;i<4;i++)spawn(s,'jelly',b.pi,Math.max(0,b.d-10-i*10));}
    else{s.surge=3*TICK;for(let i=0;i<3;i++)spawn(s,'fish',i,0);}
    s.fx.push({e:'summon',x:b.x,y:b.y,bk:b.bk});}
  s.en=s.en.filter(e=>!e.dead);
}
function stepWave(s){
  if(s.ws==='prep')return;
  if(s.ws==='gap'){if(--s.gapT<=0)callWave(s);return;}
  while(s.queue.length&&s.queue[0].at<=s.t){const q=s.queue.shift();spawn(s,q.k,q.path);}
  if(s.queue.length||s.en.length)return;
  if(s.wave>=s.S.waves){finish(s,true);return;}
  s.gold+=s.cur.bonus;s.fx.push({e:'waveClear',g:s.cur.bonus,w:s.wave});s.ws='gap';s.gapT=WAVE_GAP*TICK;
}
function finish(s,won){
  if(s.ended)return;s.ended=true;s.won=won;s.phase=won?'win':'lose';
  s.stars=won?(s.revived?Math.min(2,s.lives>=10?2:1):s.lives>=18?3:s.lives>=10?2:1):0;
  const base=REWARD.base*(1+REWARD.stage*s.si);s.reward=Math.round(won?base*REWARD.star[s.stars]:base*REWARD.lose*Math.max(0,s.wave-1)/s.S.waves+5);
  s.fx.push({e:won?'win':'lose'});
}
function step(s){
  if(s.ended||s.phase!=='run')return;s.t++;
  if(s.cd.tide>0)s.cd.tide--;if(s.cd.bomb>0)s.cd.bomb--;
  stepWave(s);if(s.phase!=='run')return;stepTowers(s);stepProjectiles(s);stepEnemies(s);
}
/* 프레임 시간을 틱으로 바꾼다 */
function advance(s,dt){s.acc+=Math.min(dt,.25);let n=0;while(s.acc>=1/TICK-1e-9&&n<16){s.acc-=1/TICK;step(s);n++;}return n;}

/* ---------- 직접 쓰는 스킬 ---------- */
const skillMul=s=>1+.5*s.si;
function castTide(s){if(s.phase!=='run'||s.cd.tide>0||s.ws==='prep')return false;s.cd.tide=SKILL.tide.cd*TICK;s.casts++;
  for(const e of s.en){if(e.dead||e.air)continue;hurt(s,e,SKILL.tide.dmg*skillMul(s),'mag');if(!e.dead){e.d=Math.max(0,e.d-(e.k==='boss'?SKILL.tide.push*.3:SKILL.tide.push));e.stun=Math.max(e.stun,.5*TICK);place(s,e);}}
  s.fx.push({e:'tide'});return true;}
function castBomb(s,x,y){if(s.phase!=='run'||s.cd.bomb>0||s.ws==='prep')return false;s.cd.bomb=SKILL.bomb.cd*TICK;s.casts++;blast(s,x,y,SKILL.bomb.r,SKILL.bomb.dmg*skillMul(s),'exp','bomb',{stun:.8},true);return true;}
function revive(s){if(s.phase!=='revive'||s.revives<=0)return false;s.revives--;s.revived=true;s.lives=REVIVE_LIVES;s.phase='run';for(const e of s.en)if(!e.air&&e.k!=='boss'){e.d=Math.max(0,e.d-200);place(s,e);}s.fx.push({e:'revive'});return true;}
function giveUp(s){if(!s.ended)finish(s,false);}

if(typeof module!=='undefined')module.exports={newGame,step,advance,build,upgrade,sell,callWave,castTide,castBomb,cleanInk,revive,giveUp,towerStat,upCost,towerCost,stageGeo,waveDef,STAGES,TOWERS,TOWER_IDS,BRANCH,UNLOCK};

/* ============================== 플랫폼 층: 화면·터치·저장·소리·광고·통계는 여기에만 둔다 ==============================
   위챗(wx)·더우인(tt)으로 옮길 때 이 파일만 손보면 된다. */
const BUILD='1117-1002';
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
const SAVE_KEY='ttbeach_v2';
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

/* ---------- 소리: 효과음도 음악도 전부 코드로 합성한다 (음원 파일 없음 = 용량 0, 저작권 걱정 없음) ---------- */
const AU={c:null,m:null,sfxG:null,bgmG:null,nb:null,last:{},combo:0,comboT:0};
function auInit(){try{if(AU.c){if(AU.c.state!=='running'&&AU.c.resume)AU.c.resume();return;}
  const AC=API?null:(window.AudioContext||window.webkitAudioContext);AU.c=AC?new AC():(API&&API.createWebAudioContext?API.createWebAudioContext():null);if(!AU.c)return;
  let out=AU.c.destination;if(AU.c.createDynamicsCompressor){const cp=AU.c.createDynamicsCompressor();cp.threshold.value=-16;cp.ratio.value=5;cp.attack.value=.004;cp.release.value=.18;cp.connect(out);out=cp;}
  AU.m=AU.c.createGain();AU.m.gain.value=.95;AU.m.connect(out);
  AU.sfxG=AU.c.createGain();AU.sfxG.connect(AU.m);AU.bgmG=AU.c.createGain();AU.bgmG.gain.value=.0001;AU.bgmG.connect(AU.m);
  const len=Math.floor(AU.c.sampleRate),b=AU.c.createBuffer(1,len,AU.c.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;AU.nb=b;
  musicSync();}catch(e){AU.c=null;}}
const mtof=m=>440*Math.pow(2,(m-69)/12);
function env(gn,t,a,peak,dec){gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(Math.max(.0002,peak),t+a);gn.gain.exponentialRampToValueAtTime(.0001,t+a+dec);}
/* 음 하나: 종류·높이·길이·크기, glide 는 끝 높이, dest 는 효과음/음악 줄 */
function tone(type,f,t,dur,peak,glide,dest,att){const c=AU.c,o=c.createOscillator(),gn=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(glide)o.frequency.exponentialRampToValueAtTime(glide,t+dur*.85);env(gn,t,att||.004,peak,dur);o.connect(gn);gn.connect(dest||AU.sfxG);o.start(t);o.stop(t+dur+(att||0)+.06);}
function nz(t,dur,peak,f,type,q,dest,f2){const c=AU.c,s=c.createBufferSource(),fl=c.createBiquadFilter(),gn=c.createGain();s.buffer=AU.nb;s.loop=true;fl.type=type||'highpass';fl.frequency.setValueAtTime(f||6000,t);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t+dur);if(q)fl.Q.value=q;env(gn,t,.003,peak,dur);s.connect(fl);fl.connect(gn);gn.connect(dest||AU.sfxG);s.start(t,Math.random()*.5);s.stop(t+dur+.06);}
function bell(m,t,v,dur,dest){const f=mtof(m);tone('sine',f,t,dur||.5,v,0,dest);tone('sine',f*2,t,(dur||.5)*.45,v*.32,0,dest);tone('sine',f*3.01,t,(dur||.5)*.2,v*.12,0,dest);}
function crackle(t,n,span,v){for(let i=0;i<n;i++)nz(t+Math.random()*span,.03,v*(.5+Math.random()*.5),5000+Math.random()*3000,'highpass');}
function horn(t,m,dur,v,dest){const c=AU.c,fl=c.createBiquadFilter(),gn=c.createGain();fl.type='lowpass';fl.frequency.setValueAtTime(500,t);fl.frequency.linearRampToValueAtTime(1300,t+dur*.4);gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(v,t+.07);gn.gain.setValueAtTime(v,t+dur*.7);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);
  for(const dt of [0,.07,7.02]){const o=c.createOscillator();o.type='sawtooth';o.frequency.value=mtof(m+dt);o.connect(fl);o.start(t);o.stop(t+dur+.05);}fl.connect(gn);gn.connect(dest||AU.sfxG);}
const SFX_GAP={s_tt:.06,s_didi:.05,s_peng:.08,s_shan:.14,s_dun:.06,s_zhuo:.08,hit:.045,kill:.04,ex_bun:.07,ex_fw:.08,splash:.07,gold:.06,leak:.12};
const COMBO=[0,2,4,7,9,12,14,16,19,21,24];
function sfx(n,arg){if(!AU.c||!S.opt.sfx||APP.hidden)return;try{const now=AU.c.currentTime;if(now-(AU.last[n]||-9)<(SFX_GAP[n]||.02))return;AU.last[n]=now;const t=now+.004,r=.94+Math.random()*.12;switch(n){
  case 'btn':tone('sine',560,t,.05,.11,760);nz(t,.02,.03,3000,'bandpass',1);break;
  case 'nope':tone('triangle',250,t,.1,.09,180);break;
  case 's_tt':tone('sine',190*r,t,.13,.17,85);nz(t,.07,.07,900,'lowpass');break;
  case 's_didi':tone('sine',950*r,t,.05,.045,1600*r);break;
  case 's_peng':tone('sine',650*r,t,.26,.04,1900*r);nz(t,.2,.02,4000,'bandpass',2,null,7000);break;
  case 's_shan':tone('triangle',1320*r,t,.14,.022);tone('sine',1980*r,t,.1,.014);break;
  case 's_dun':tone('sine',1150*r,t,.035,.13,720);nz(t,.025,.06,2600,'bandpass',1.5);break;
  case 's_zhuo':nz(t,.1,.05,2200,'bandpass',.8,null,5200);break;
  case 'hit':nz(t,.035,.035,1700*r,'bandpass',1.2);tone('sine',230*r,t,.04,.05,150);break;
  case 'kill':{if(now-AU.comboT>.7)AU.combo=0;AU.comboT=now;const k=Math.min(COMBO.length-1,AU.combo++);tone('sine',430,t,.07,.09,900);bell(79+COMBO[k],t+.02,.055,.28);break;}   // 연달아 잡으면 음이 한 계단씩 올라간다
  case 'gold':bell(91,t,.045,.22);break;
  case 'ex_bun':tone('sine',155*r,t,.22,.2,52);nz(t,.18,.1,1300,'lowpass');nz(t,.25,.03,2500,'bandpass',.6);break;
  case 'ex_fw':tone('sine',115*r,t,.2,.15,48);nz(t,.24,.09,3200,'bandpass',.7);crackle(t+.05,5,.3,.05);break;
  case 'ex_bomb':tone('sine',92,t,.55,.34,34);tone('triangle',60,t,.4,.18,30);nz(t,.5,.22,1000,'lowpass',0,null,200);crackle(t+.08,8,.45,.06);break;
  case 'splash':nz(t,.08,.04,1500*r,'bandpass',.9);tone('sine',620*r,t,.06,.03,300);break;
  case 'leak':tone('triangle',210,t,.26,.17,105);nz(t,.2,.09,420,'lowpass');tone('sine',392,t+.05,.2,.06,262);break;
  case 'build':tone('sine',320,t,.1,.16,140);nz(t,.08,.06,700,'lowpass');bell(79,t+.07,.08,.3);break;
  case 'up':[72,76,79].forEach((m,i)=>bell(m,t+i*.055,.1,.4));nz(t,.2,.02,6000,'highpass');break;
  case 'evolve':[72,76,79,84,88,91].forEach((m,i)=>bell(m,t+i*.06,.12,.8));nz(t,.6,.035,7000,'highpass');tone('sine',130,t,.3,.14,65);break;
  case 'sell':bell(88,t,.07,.2);bell(84,t+.07,.07,.25);break;
  case 'tide':nz(t,1,.2,300,'lowpass',0,null,2200);nz(t+.1,.9,.07,3000,'bandpass',.5);tone('sine',72,t,.9,.14,48);break;
  case 'horn':horn(t,57,.6,.055);break;
  case 'boss':[0,.26,.52].forEach(d=>{tone('sine',105,t+d,.3,.32,40);nz(t+d,.12,.08,500,'lowpass');});horn(t+.1,45,.9,.07);break;
  case 'ink':tone('sine',310,t,.2,.1,115);nz(t,.15,.05,600,'lowpass');break;
  case 'clear':tone('sine',520,t,.1,.08,1150);nz(t,.06,.03,6000,'highpass');break;
  case 'bonus':bell(84,t,.07,.25);bell(91,t+.06,.07,.3);break;
  case 'wclear':[76,79,84].forEach((m,i)=>bell(m,t+i*.07,.1,.5));break;
  case 'reward':[84,88,91,96].forEach((m,i)=>bell(m,t+i*.09,.12,.7));break;
  case 'win':[72,76,79,84].forEach((m,i)=>{bell(m,t+i*.11,.14,.9);});[84,88,91].forEach(m=>bell(m,t+.5,.11,1.4));horn(t+.5,60,1,.04);break;
  case 'over':[67,64,62,55].forEach((m,i)=>tone('triangle',mtof(m),t+i*.16,.3,.12,mtof(m)*.96));break;
}}catch(e){AU.err=(AU.err||0)+1;AU.lastErr=n+' '+e;}}

/* 음악: 5음계 가락을 16칸짜리 악보로 적어 두고 그때그때 연주한다. 메뉴(느긋) · 전투(경쾌) · 보스(긴박) */
const P5=[0,2,4,7,9],M5=[0,3,5,7,10],_=-1;
const SONGS={
  menu:{bpm:88,root:60,sc:P5,ch:[[0,4,7],[9,12,16],[5,9,12],[7,11,14]],arp:[0,2,4,6,8,10,12,14],bass:[0,8],kick:[0],rim:[],shk:[4,12],lead:.085,
    mel:[[4,_,_,3,_,_,2,_,3,_,_,_,_,_,_,_],[2,_,_,3,_,_,4,_,5,_,_,_,4,_,_,_],[5,_,_,4,_,_,3,_,2,_,_,_,3,_,_,_],[1,_,2,_,3,_,_,_,2,_,_,_,_,_,_,_],
         [4,_,_,5,_,_,7,_,6,_,_,_,5,_,_,_],[5,_,_,4,_,_,5,_,7,_,_,_,_,_,6,_],[5,_,4,_,3,_,_,_,4,_,3,_,2,_,_,_],[3,_,_,2,_,_,1,_,0,_,_,_,_,_,_,_]]},
  play:{bpm:122,root:62,sc:P5,ch:[[2,6,9],[11,14,18],[7,11,14],[9,13,16]],arp:[2,6,10,14],bass:[0,3,6,8,11,14],kick:[0,8,11],rim:[4,12],shk:[0,2,4,6,8,10,12,14],lead:.1,
    mel:[[0,_,1,2,_,2,_,4,_,4,3,_,2,_,_,_],[2,_,3,4,_,4,_,5,_,5,4,_,3,_,_,_],[4,_,5,4,_,3,_,2,_,2,3,_,4,_,_,_],[3,_,2,1,_,2,_,3,_,_,2,_,1,_,_,_],
         [5,_,_,5,_,4,_,5,_,7,_,_,5,_,_,_],[4,_,_,4,_,3,_,4,_,5,_,_,4,_,_,_],[3,_,4,5,_,4,_,3,_,2,_,3,4,_,_,_],[2,_,1,2,_,_,0,_,_,_,_,_,_,_,_,_],
         [0,_,1,2,_,2,_,4,_,4,3,_,2,_,_,_],[2,_,3,4,_,4,_,5,_,5,7,_,5,_,_,_],[7,_,_,5,_,4,_,5,_,4,_,3,2,_,_,_],[3,_,2,1,_,_,0,_,_,_,_,_,_,_,_,_],
         [_,_,_,_,5,_,5,_,_,_,7,_,5,_,_,_],[_,_,_,_,4,_,4,_,_,_,5,_,4,_,_,_],[3,_,_,3,_,4,_,5,_,_,7,_,8,_,_,_],[7,_,5,_,4,_,2,_,0,_,_,_,_,_,_,_]]},
  boss:{bpm:140,root:62,sc:M5,ch:[[2,5,9],[10,14,17],[0,4,7],[9,12,16]],arp:[],bass:[0,2,4,6,8,10,12,14],kick:[0,4,8,12],rim:[4,12],shk:[2,6,10,14],lead:.1,pad:1,
    mel:[[0,_,0,_,2,_,0,_,3,_,2,_,0,_,_,_],[4,_,4,_,3,_,2,_,3,_,_,_,2,_,_,_],[2,_,2,_,3,_,4,_,5,_,4,_,3,_,_,_],[4,_,3,_,2,_,_,0,_,_,_,_,_,_,_,_],
         [5,_,5,_,4,_,5,_,7,_,5,_,4,_,_,_],[4,_,4,_,3,_,4,_,5,_,_,_,4,_,_,_],[2,_,3,_,4,_,5,_,7,_,8,_,7,_,_,_],[5,_,4,_,2,_,_,0,_,_,_,_,_,_,_,_]]},
};
const MUS={want:'menu',cur:null,timer:null,step:0,nextT:0};
function musStep(sg,step,t,spb){
  const D=AU.bgmG,bar=Math.floor(step/16),s=step%16,ch=sg.ch[bar%4],deg=sg.mel[bar%sg.mel.length][s];
  if(deg>=0){const m=sg.root+sg.sc[deg%5]+12*Math.floor(deg/5),f=mtof(m);tone('sine',f,t,.42,sg.lead,0,D,.006);tone('sine',f*2,t,.2,sg.lead*.38,0,D,.004);tone('sine',f*3.01,t,.1,sg.lead*.13,0,D);}   // 스틸팬 느낌의 가락
  if(sg.arp.indexOf(s)>=0){const f=mtof(60+ch[(s>>1)%3]);tone('sine',f,t,.2,.05,0,D);tone('sine',f*4,t,.05,.014,0,D);}                                                              // 마림바 화음
  if(sg.bass.indexOf(s)>=0){const f=mtof(36+ch[0]%12+(s===6||s===14?12:0));tone('triangle',f,t,.2,.17,0,D,.006);tone('sine',f,t,.24,.1,0,D);}
  if(sg.pad&&s===0)for(const k of ch){const c=AU.c,o=c.createOscillator(),fl=c.createBiquadFilter(),gn=c.createGain();o.type='sawtooth';o.frequency.value=mtof(48+k);fl.type='lowpass';fl.frequency.value=700;gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(.022,t+.1);gn.gain.linearRampToValueAtTime(.0001,t+spb*16);o.connect(fl);fl.connect(gn);gn.connect(D);o.start(t);o.stop(t+spb*16+.05);}
  if(sg.kick.indexOf(s)>=0)tone('sine',125,t,.15,.3,44,D);
  if(sg.rim.indexOf(s)>=0)nz(t,.05,.07,1900,'bandpass',1.2,D);
  if(sg.shk.indexOf(s)>=0)nz(t,.035,s%4===2?.05:.028,6500,'highpass',0,D);
}
function musTick(){if(!AU.c||!MUS.cur)return;const sg=SONGS[MUS.cur],spb=60/sg.bpm/4,now=AU.c.currentTime;if(MUS.nextT<now-.3)MUS.nextT=now+.05;
  try{while(MUS.nextT<now+.28){musStep(sg,MUS.step,MUS.nextT,spb);MUS.step++;MUS.nextT+=spb;}}catch(e){MUS.err=(MUS.err||0)+1;MUS.last=String(e);}}
function musicStop(){if(MUS.timer){clearInterval(MUS.timer);MUS.timer=null;}MUS.cur=null;if(AU.c)try{AU.bgmG.gain.cancelScheduledValues(AU.c.currentTime);AU.bgmG.gain.setTargetAtTime(.0001,AU.c.currentTime,.12);}catch(e){}}
function musicSync(){if(!AU.c)return;if(!S.opt.bgm||APP.hidden){musicStop();return;}if(MUS.cur===MUS.want&&MUS.timer)return;
  MUS.cur=MUS.want;MUS.step=0;MUS.nextT=AU.c.currentTime+.12;try{AU.bgmG.gain.cancelScheduledValues(AU.c.currentTime);AU.bgmG.gain.setTargetAtTime(.55,AU.c.currentTime,.25);}catch(e){}
  if(!MUS.timer)MUS.timer=setInterval(musTick,50);musTick();}
function wantMusic(n){n=SONGS[n]?n:'menu';if(MUS.want!==n){MUS.want=n;musicSync();}}
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
  gull:x=>{shape(x,'#eef3f8',()=>{x.moveTo(-14,-6);x.quadraticCurveTo(-44,-34,-62,-8);x.quadraticCurveTo(-40,-10,-16,12);});shape(x,'#eef3f8',()=>{x.moveTo(14,-6);x.quadraticCurveTo(44,-34,62,-8);x.quadraticCurveTo(40,-10,16,12);});
    shape(x,'#ffffff',()=>{x.ellipse(0,2,24,30,0,0,6.2832);});shape(x,'#ffb347',()=>{x.moveTo(-7,14);x.lineTo(0,30);x.lineTo(7,14);},4);x.fillStyle='#8fa3b8';x.beginPath();x.ellipse(0,-24,12,6,0,0,6.2832);x.fill();face(x,0,0,10,4.5,'brow');},
  octoboss:x=>drawOcto(x,'#b58bea',{crown:1,mood:'grr'}),
  whale:x=>{shape(x,'#5f9be0',()=>{x.moveTo(-50,-20);x.lineTo(-66,10);x.lineTo(-40,6);});shape(x,'#5f9be0',()=>{x.moveTo(50,-20);x.lineTo(66,10);x.lineTo(40,6);});
    shape(x,'#6fa8e8',()=>{x.ellipse(0,0,54,46,0,0,6.2832);});x.fillStyle='#eaf5ff';x.beginPath();x.ellipse(0,22,36,20,0,0,6.2832);x.fill();
    x.fillStyle='rgba(255,255,255,.75)';for(const p of [[-20,-26],[6,-30],[24,-18],[-6,-16]]){x.beginPath();x.arc(p[0],p[1],4,0,6.2832);x.fill();}
    x.strokeStyle='#bfe6ff';x.lineWidth=5;x.beginPath();x.moveTo(0,-46);x.quadraticCurveTo(-14,-62,-20,-52);x.moveTo(0,-46);x.quadraticCurveTo(14,-62,20,-52);x.stroke();face(x,0,2,24,5.5,'grr');},
};
function mkSprites(){for(const k in DRAW_EN){const big=k==='kingcrab'||k==='octoboss'||k==='whale',sz=big?300:170,c=mkCanvas(sz,sz),x=c.getContext('2d');safeCtx(x);x.translate(sz/2,sz*.53);x.scale(sz/160,sz/160);x.lineJoin='round';x.lineCap='round';DRAW_EN[k](x);SPR[k]=c;SPRW[k]=tint(c,'#fff');}}
function sprKey(e){return e.k==='boss'?(e.bk||'kingcrab'):e.k;}
function drawSpr(k,x,y,size,o){const c=(o&&o.white?SPRW:SPR)[k];if(!c)return;o=o||{};g.save();g.translate(x,y);if(o.rot)g.rotate(o.rot);g.scale(o.sx||1,o.sy||1);if(o.a!==undefined)g.globalAlpha*=o.a;g.drawImage(c,-size/2,-size*.53,size,size);g.restore();}

/* ---------- 전투 지도: 위는 바다, 아래는 마을 대문. 길과 꾸밈은 장마다 코드로 그린다 (그림이 오면 바꿀 자리) ---------- */
const THEMES=[
  {sea:['#2f9ad6','#86d8f0'],sand:['#fdeec8','#f6dba6'],path:'#ecd09a',edge:'#c9a468',deco:['palm','parasol','star','shell','rock','grass']},
  {sea:['#3b8fc4','#8fd2e8'],sand:['#f3e8cf','#e6d6b2'],path:'#dcc8a0',edge:'#b39a70',deco:['rock','rock','star','grass','shell','rock']},
  {sea:['#17a9bd','#9aece2'],sand:['#ffecd2','#f8d9b4'],path:'#f3cfa8',edge:'#d2a47a',deco:['coral','shell','star','palm','coral','rock']},
  {sea:['#4f74cf','#f4b890'],sand:['#f9d8a8','#edc088'],path:'#e2b67c',edge:'#b98850',deco:['palm','barrel','rock','barrel','shell','grass']},
  {sea:['#2c4fa8','#84bcec'],sand:['#eee4d2','#ddd0b8'],path:'#d3c5a8',edge:'#a8987a',deco:['lantern','coral','rock','shell','lantern','grass']},
];
function shoreY(x){return 112+Math.sin(x*.035)*7+Math.sin(x*.011+1)*5;}
const DECO={
  palm:(x,r)=>{x.fillStyle='rgba(60,40,20,.16)';x.beginPath();x.ellipse(8,10,20,8,0,0,6.2832);x.fill();x.strokeStyle='#8a5a34';x.lineWidth=5;x.lineCap='round';x.beginPath();x.moveTo(0,8);x.quadraticCurveTo(5,-6,1,-18);x.stroke();
    for(let i=0;i<6;i++){x.save();x.translate(1,-18);x.rotate(i*1.047+r);x.fillStyle=i%2?'#4fae6a':'#63c07c';x.strokeStyle='#2f7a48';x.lineWidth=1.2;x.beginPath();x.ellipse(11,0,13,4.5,0,0,6.2832);x.fill();x.stroke();x.restore();}x.fillStyle='#7a4a2a';x.beginPath();x.arc(1,-18,3,0,6.2832);x.fill();},
  parasol:(x,r)=>{x.fillStyle=r>3?'#8fd0f0':'#ffd9a0';x.strokeStyle='rgba(90,54,32,.5)';x.lineWidth=1;x.save();x.rotate(.3);x.fillRect(12,-4,22,11);x.strokeRect(12,-4,22,11);x.restore();x.fillStyle='rgba(60,40,20,.16)';x.beginPath();x.ellipse(4,6,17,9,0,0,6.2832);x.fill();
    for(let i=0;i<8;i++){x.fillStyle=i%2?'#fff':'#f0604a';x.beginPath();x.moveTo(0,0);x.arc(0,0,15,i*.7854+r,(i+1)*.7854+r);x.closePath();x.fill();}x.strokeStyle='#5a3620';x.lineWidth=1.6;x.beginPath();x.arc(0,0,15,0,6.2832);x.stroke();x.fillStyle='#5a3620';x.beginPath();x.arc(0,0,2,0,6.2832);x.fill();},
  star:(x,r)=>{x.rotate(r);x.fillStyle='#ff9a5c';x.strokeStyle='#c9632c';x.lineWidth=1.2;x.beginPath();for(let i=0;i<10;i++){const a=i*.6283,q=i%2?3:7.5;x.lineTo(Math.cos(a)*q,Math.sin(a)*q);}x.closePath();x.fill();x.stroke();},
  shell:(x,r)=>{x.rotate(r);x.fillStyle='#ffc9d6';x.strokeStyle='#d98aa0';x.lineWidth=1.2;x.beginPath();x.moveTo(0,5);x.arc(0,0,6.5,2.6,.54);x.closePath();x.fill();x.stroke();},
  rock:(x,r)=>{x.fillStyle='rgba(60,40,20,.16)';x.beginPath();x.ellipse(3,6,15,6,0,0,6.2832);x.fill();x.fillStyle='#a8adb4';x.strokeStyle='#6c7178';x.lineWidth=1.6;x.beginPath();x.ellipse(0,0,13+r,9,0,0,6.2832);x.fill();x.stroke();x.beginPath();x.ellipse(9,3,7,5,0,0,6.2832);x.fill();x.stroke();x.fillStyle='rgba(255,255,255,.4)';x.beginPath();x.ellipse(-4,-3,5,2.5,-.4,0,6.2832);x.fill();},
  grass:(x,r)=>{x.strokeStyle='#5fae62';x.lineWidth=2.4;x.lineCap='round';for(let i=-1;i<2;i++){x.beginPath();x.moveTo(i*3,4);x.quadraticCurveTo(i*5,-4,i*8+r,-9);x.stroke();}},
  coral:(x,r)=>{for(let i=0;i<5;i++){x.fillStyle=i%2?'#ff9db0':'#ffb88a';x.strokeStyle='#d9728a';x.lineWidth=1.2;x.beginPath();x.arc(Math.cos(i*1.26+r)*7,Math.sin(i*1.26+r)*5,5.5,0,6.2832);x.fill();x.stroke();}},
  barrel:(x)=>{x.fillStyle='rgba(60,40,20,.16)';x.beginPath();x.ellipse(3,7,12,5,0,0,6.2832);x.fill();x.fillStyle='#b07a44';x.strokeStyle='#5a3620';x.lineWidth=1.6;x.beginPath();x.arc(0,0,10,0,6.2832);x.fill();x.stroke();x.strokeStyle='#7a4a2a';x.beginPath();x.arc(0,0,6,0,6.2832);x.stroke();},
  lantern:(x)=>{x.fillStyle='rgba(255,200,90,.28)';x.beginPath();x.arc(0,-12,16,0,6.2832);x.fill();x.strokeStyle='#5a3620';x.lineWidth=2;x.beginPath();x.moveTo(0,8);x.lineTo(0,-6);x.stroke();x.fillStyle='#f0604a';x.lineWidth=1.4;x.beginPath();x.ellipse(0,-13,7,8,0,0,6.2832);x.fill();x.stroke();x.fillStyle='#ffd93d';x.fillRect(-4,-22,8,2.5);x.fillRect(-4,-6,8,2.5);},
};
function mkMap(si){
  const TH=THEMES[STAGES[si].theme%THEMES.length],G=stageGeo(si),c=mkCanvas(VW,VH),x=c.getContext('2d');safeCtx(x);x.scale(K,K);let seed=si*131+7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  let gr=x.createLinearGradient(0,90,0,H);gr.addColorStop(0,TH.sand[0]);gr.addColorStop(1,TH.sand[1]);x.fillStyle=gr;x.fillRect(0,0,W,H);
  for(let i=0;i<260;i++){x.fillStyle=i%3?'rgba(170,120,60,.16)':'rgba(255,255,255,.35)';x.beginPath();x.arc(rnd()*W,120+rnd()*600,.8+rnd()*1.6,0,6.2832);x.fill();}
  for(let i=0;i<14;i++){x.strokeStyle='rgba(170,120,60,.14)';x.lineWidth=1.6;const px=rnd()*W,py=150+rnd()*520;x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+14,py-4,px+28,py);x.stroke();}
  // 젖은 모래
  x.fillStyle='rgba(150,110,60,.22)';x.beginPath();x.moveTo(0,0);x.lineTo(W,0);for(let px=W;px>=0;px-=10)x.lineTo(px,shoreY(px)+15+Math.sin(px*.09)*3);x.closePath();x.fill();
  // 길
  x.lineJoin='round';x.lineCap='round';const stroke=(col,w,dy)=>{x.strokeStyle=col;x.lineWidth=w;for(const p of G.paths){x.beginPath();p.s.forEach((q,i)=>{if(i)x.lineTo(q.x,q.y+(dy||0));else x.moveTo(q.x,q.y-30);});x.stroke();}};
  stroke('rgba(90,54,32,.2)',50,3);stroke(TH.edge,46);stroke(TH.path,39);stroke('rgba(255,255,255,.2)',20);
  for(const p of G.paths)for(let i=8;i<p.s.length-6;i+=7){const q=p.s[i],n=p.s[i+1],dx=n.x-q.x,dy=n.y-q.y,l=Math.hypot(dx,dy)||1,sd=(i/7%2?1:-1)*9;x.fillStyle='rgba(120,80,40,.2)';x.beginPath();x.ellipse(q.x-dy/l*sd,q.y+dx/l*sd,3.2,2,Math.atan2(dy,dx),0,6.2832);x.fill();}
  // 바다
  gr=x.createLinearGradient(0,0,0,125);gr.addColorStop(0,TH.sea[0]);gr.addColorStop(1,TH.sea[1]);x.fillStyle=gr;x.beginPath();x.moveTo(0,0);x.lineTo(W,0);for(let px=W;px>=0;px-=10)x.lineTo(px,shoreY(px));x.closePath();x.fill();
  x.strokeStyle='rgba(255,255,255,.85)';x.lineWidth=3.5;x.beginPath();for(let px=0;px<=W;px+=10){if(px)x.lineTo(px,shoreY(px));else x.moveTo(px,shoreY(px));}x.stroke();
  x.strokeStyle='rgba(255,255,255,.28)';x.lineWidth=2;for(let i=0;i<12;i++){const px=rnd()*W,py=64+rnd()*36;x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+10,py-4,px+20,py);x.stroke();}
  // 마을 쪽 나무 데크와 대문
  x.fillStyle='#d9b07a';x.fillRect(0,GATE_Y+20,W,H);x.strokeStyle='rgba(120,80,40,.4)';x.lineWidth=1.4;for(let py=GATE_Y+20;py<H;py+=13){x.beginPath();x.moveTo(0,py);x.lineTo(W,py);x.stroke();}
  x.fillStyle='#b98a52';x.fillRect(0,GATE_Y+17,W,5);x.strokeStyle=INK;x.lineWidth=1.6;x.strokeRect(-2,GATE_Y+17,W+4,5);
  for(let px=18;px<W;px+=46){if(Math.abs(px-225)<48)continue;x.fillStyle='#f1d08c';x.strokeStyle=INK;x.lineWidth=1.6;x.beginPath();x.moveTo(px-10,GATE_Y+17);x.lineTo(px-10,GATE_Y+5);x.lineTo(px+10,GATE_Y+5);x.lineTo(px+10,GATE_Y+17);x.closePath();x.fill();x.stroke();}
  const gx=225,gy=GATE_Y;x.fillStyle='rgba(60,40,20,.2)';x.beginPath();x.ellipse(gx,gy+20,52,9,0,0,6.2832);x.fill();
  for(const sgn of [-1,1]){x.fillStyle='#f3c97a';x.strokeStyle=INK;x.lineWidth=2.2;rr(gx+sgn*34-12,gy-30,24,50,3,x);x.fill();x.stroke();x.fillStyle='#e8b65e';for(let k=-1;k<2;k++){rr(gx+sgn*34+k*8-3,gy-37,6,8,1.5,x);x.fill();x.stroke();}
    x.beginPath();x.moveTo(gx+sgn*34,gy-37);x.lineTo(gx+sgn*34,gy-58);x.stroke();x.fillStyle=RED;x.beginPath();x.moveTo(gx+sgn*34,gy-58);x.lineTo(gx+sgn*34+13,gy-53);x.lineTo(gx+sgn*34,gy-48);x.closePath();x.fill();x.stroke();}
  x.fillStyle='#f3c97a';x.strokeStyle=INK;rr(gx-24,gy-18,48,38,3,x);x.fill();x.stroke();x.fillStyle='#7a4a2a';x.beginPath();x.moveTo(gx-13,gy+20);x.lineTo(gx-13,gy);x.arc(gx,gy,13,3.1416,0);x.lineTo(gx+13,gy+20);x.closePath();x.fill();x.stroke();
  // 꾸밈: 길과 타워 자리를 피해서
  const all=[];for(const p of G.paths)for(let i=0;i<p.s.length;i+=3)all.push(p.s[i]);const placed=[];
  for(let n=0,tries=0;n<30&&tries<600;tries++){const px=14+rnd()*422,py=shoreY(px)+22+rnd()*(GATE_Y-shoreY(px)-40),kind=TH.deco[Math.floor(rnd()*TH.deco.length)],big=kind==='palm'||kind==='parasol',need=big?46:32;
    if(all.some(q=>(q.x-px)**2+(q.y-py)**2<need*need)||G.spots.some(q=>(q.x-px)**2+(q.y-py)**2<(need+6)**2)||placed.some(q=>(q.x-px)**2+(q.y-py)**2<(big||q.big?40:22)**2))continue;
    placed.push({x:px,y:py,big});x.save();x.translate(px,py);DECO[kind](x,rnd()*6.28);x.restore();n++;}
  return c;
}
let BG=null;function mkBg(){BG=mkMap(0);}

/* ============================== 전투 화면 (타워 디펜스): 규칙(core.js)이 알려 준 일을 그림·소리·진동으로 바꾼다 ============================== */
const HN={tt:['퇀퇀','团团'],didi:['방울이','滴滴'],peng:['펑펑','砰砰'],shan:['반짝','闪闪'],dun:['둥둥','墩墩'],zhuo:['쫑쫑','啄啄']};
const HCOL={tt:'#ffb199',didi:'#9fd8ff',peng:'#ffcf7a',shan:'#ffe08a',dun:'#bfe6c8',zhuo:'#e6c8a8'};
const TROLE={tt:['만두 대포 · 범위 폭발 (땅의 적만)','包子炮 · 范围爆炸（仅地面）'],didi:['물총 · 빠른 연사와 둔화','水枪 · 连射并减速'],peng:['불꽃 · 먼 거리 폭발, 껍데기에 강함','烟花 · 远程爆炸，克制硬壳'],
  shan:['빛줄기 · 갑옷 무시, 비출수록 강해짐','光束 · 无视护甲，越照越强'],dun:['탁구 저격 · 가장 튼튼한 적을 강타','乒乓狙击 · 重击最结实的敌人'],zhuo:['편지 · 범위 둔화, 근처 처치 골드 +1','信件 · 范围减速，附近击杀金币+1']};
const BR={king:['왕만두','大包子','폭발 범위 +55%, 잠깐 기절','范围+55%，短暂眩晕'],twin:['쌍둥이 찜통','双层蒸笼','한 번에 2발 발사','一次发射 2 发'],ice:['얼음물','冰水','둔화 65%, 2초 지속','减速65%，持续2秒'],jet:['물대포','水炮','줄에 선 적을 모두 관통','穿透一线上的敌人'],
  dragon:['용 불꽃','龙焰','터진 자리에 3초 불길','落点燃烧 3 秒'],star:['별 폭죽','星花','작은 폭발 3개 추가','追加 3 次小爆炸'],rainbow:['무지개','彩虹','옆의 적 2마리에게 번짐','连锁到旁边 2 个敌人'],moon:['달빛','月光','비춘 적이 받는 피해 +35%','被照敌人受伤+35%'],
  smash:['스매시','扣杀','정예·보스에게 3배 피해','对精英和BOSS伤害3倍'],double:['더블 서브','双发球','2마리를 동시에 공격','同时攻击 2 个敌人'],express:['특급 배달','特快专递','근처 처치 골드 +3','附近击杀金币+3'],parcel:['소포 폭탄','包裹炸弹','피해 5배, 범위 +25%','伤害5倍，范围+25%']};
const rnd=(a,b)=>a+Math.random()*(b-a);
let run=null,B=null,paused=false,speed=1;

function startBattle(si,bonusGold){
  S.sel=si;const owned=TOWER_IDS.filter(id=>S.lv[id]);
  run=newGame(si,{seed:(Date.now()%100000)|0,lv:S.lv,owned,gold:bonusGold||0});
  B={parts:[],nums:[],rings:[],fly:[],flashes:[],decals:[],coins:[],pillars:[],pop:{},stop:0,wet:0,goldBump:0,lifeBump:0,shake:0,banner:null,sel:-1,pick:'',aim:'',endT:-1,tip:null,time:0,tide:0,leakFlash:0,adGold:!!bonusGold,map:mkMap(si),hint:0};
  paused=false;speed=S.opt.fast?2:1;scr='battle';wantMusic('play');S.stat.runs++;mission('run',1);track('stage_start',{stage:si+1});
  tip('start',L('빈 모래 자리를 눌러 타워를 짓고, 준비되면 시작을 눌러요','点空沙堆建塔，准备好就点开始'),8);persist();
}
function tip(key,text,sec){if(S.tips[key]||!B)return;S.tips[key]=1;B.tip={text,t:sec||6};}
function banner(text,big,col){B.banner={text,t:0,big:!!big,col:col||'#fff'};}
function shake(n){B.shake=Math.max(B.shake,n);}
/* ---------- 이펙트 도구: 번쩍임(빛 번짐) · 불똥 · 연기 · 별가루 · 자국 · 날아가는 동전 ---------- */
const ECOL={crab:'#ff8a65',jelly:'#c8e6ff',fish:'#6fb8ff',puffer:'#ffd76a',hermit:'#e9bd7e',octo:'#c9a2f2',gull:'#ffffff',elite:'#e2685c',boss:'#ff7a5c'};
const TCOL={tt:'#fff1d6',didi:'#8fd4ff',peng:'#ffb347',shan:'#ffe9a0',dun:'#ffffff',zhuo:'#ffc9d6'};
const GLOW={};
function glow(x,y,r,col,a){let c=GLOW[col];if(!c){c=GLOW[col]=mkCanvas(64,64);const q=c.getContext('2d'),gr=q.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.3,'rgba(255,255,255,.75)');gr.addColorStop(1,'rgba(255,255,255,0)');q.fillStyle=gr;q.fillRect(0,0,64,64);q.globalCompositeOperation='source-in';q.fillStyle=col;q.fillRect(0,0,64,64);}
  if(r<=0||a<=0)return;g.globalAlpha=Math.min(1,a);g.drawImage(c,x-r,y-r,r*2,r*2);g.globalAlpha=1;}
function P(kind,x,y,vx,vy,life,r,col,gr,drag){if(B.parts.length<420)B.parts.push({kind,x,y,vx,vy,life,t:0,r,col,gr:gr||0,drag:drag||1});}
function pick(c,i){return Array.isArray(c)?c[i%c.length]:c;}
function burst(x,y,n,col,sp,r){for(let i=0;i<n;i++){const a=Math.random()*6.283,v=rnd(.5,1)*(sp||2.2);P('dot',x,y,Math.cos(a)*v,Math.sin(a)*v-.8,rnd(16,30),rnd(.6,1)*(r||2.6),pick(col,i),.07);}}
function sparks(x,y,n,col,sp){for(let i=0;i<n;i++){const a=Math.random()*6.283,v=rnd(.5,1)*(sp||4);P('spark',x,y,Math.cos(a)*v,Math.sin(a)*v,rnd(7,13),rnd(1.2,2),pick(col,i),.04,.9);}}
function smoke(x,y,n,r){for(let i=0;i<n;i++)P('smoke',x+rnd(-r,r)*.5,y+rnd(-r,r)*.4,rnd(-.3,.3),rnd(-.7,-.2),rnd(28,44),rnd(.5,.9)*r,'#fff');}
function stars(x,y,n,col,sp){for(let i=0;i<n;i++){const a=Math.random()*6.283,v=rnd(.4,1)*(sp||3);P('star',x,y,Math.cos(a)*v,Math.sin(a)*v-1,rnd(24,42),rnd(2.6,4.4),pick(col,i),.06,.96);}}
function flash(x,y,r,col,life){B.flashes.push({x,y,r,col,t:0,life:life||6});}
function ring(x,y,r,col,w,life){B.rings.push({x,y,r,col,w:w||3,t:0,life:life||16});}
function decal(x,y,r,life){if(B.decals.length>14)B.decals.shift();B.decals.push({x,y,r,t:0,life:life||170});}
function coins(x,y,n){for(let i=0;i<n&&B.coins.length<40;i++)B.coins.push({sx:x,sy:y,cx:x+rnd(-40,40),cy:y-rnd(30,70),t:-i*3,T:rnd(24,32)});}
function floatTxt(x,y,s,col,sz){if(B.nums.length<46)B.nums.push({x,y,s,col,sz:sz||11,t:0});}
function hitStop(sec){B.stop=Math.max(B.stop,sec);}
const FW_COL=['#ff6b6b','#ffd93d','#6bcbff','#ff9ff3','#8ce99a'];
function boom(x,y,r,kind){
  if(kind==='fw'){flash(x,y,r*1.9,'#ffd27a',7);ring(x,y,r,'#ffe9a0',3,14);stars(x,y,12,FW_COL,3.6);sparks(x,y,6,'#fff',5);sfx('ex_fw');}
  else if(kind==='bun'){flash(x,y,r*1.7,'#ffffff',6);ring(x,y,r,'#ffffff',3.5,14);smoke(x,y,4,r*.55);sparks(x,y,5,['#fff','#ffe0b0'],4);decal(x,y,r*.6,110);sfx('ex_bun');}
  else if(kind==='bomb'){flash(x,y,r*2.6,'#ffd27a',10);ring(x,y,r,'#fff3c0',6,18);ring(x,y,r*1.5,'#ffb347',2.5,22);smoke(x,y,7,r*.6);sparks(x,y,16,['#fff','#ffd93d','#ff9f43'],7);burst(x,y,10,['#8a5a34','#5a3620'],4,3);decal(x,y,r*.75,260);shake(11);vib(50);hitStop(.07);sfx('ex_bomb');}
  else{flash(x,y,r*1.3,'#ffd0dc',5);ring(x,y,r,'#ffc9d6',2.5,14);for(let i=0;i<6;i++)P('paper',x,y,rnd(-2.4,2.4),rnd(-3,-.6),rnd(26,40),rnd(2.4,3.6),i%2?'#fff':'#ffc9d6',.1,.97);sfx('splash');}
}
function consumeFx(){
  for(const f of run.fx){switch(f.e){
    case 'hit':{const big=f.v>=30;if(big||f.weak)floatTxt(f.x+rnd(-7,7),f.y-12,Math.round(f.v),f.weak?'#ffb347':f.v>=120?'#ffd93d':'#fff',f.v>=120?15:f.v>=60?12:10);else if(f.res&&Math.random()<.3)floatTxt(f.x,f.y-12,L('단단!','硬！'),'#c8d6e4',9);
      if(B.flashes.length<26){flash(f.x,f.y,big?13:8,f.res?'#c8d6e4':'#ffffff',4);if(big||Math.random()<.4)sparks(f.x,f.y,big?3:2,f.res?'#c8d6e4':'#fff7d6',3);}sfx('hit');break;}
    case 'die':{const boss=f.k==='boss',el=f.k==='elite',col=ECOL[f.k]||'#fff';B.fly.push({k:boss?f.bk:f.k,x:f.x,y:f.y,t:0,r:ENEMIES[f.k].r});
      ring(f.x,f.y,ENEMIES[f.k].r*1.5,'#ffffff',3,12);burst(f.x,f.y,boss?26:el?12:6,[col,'#fff'],boss?5:2.8,boss?4:2.8);flash(f.x,f.y,ENEMIES[f.k].r*(boss?4:2.2),'#ffffff',boss?10:5);
      coins(f.x,f.y,boss?12:el?5:f.g>=12?2:1);floatTxt(f.x,f.y-18,'+'+f.g,'#ffd93d',boss?17:el?13:10);sfx('kill');
      if(boss){shake(12);vib(70);hitStop(.12);stars(f.x,f.y,24,FW_COL,6);smoke(f.x,f.y,6,22);}else if(el){shake(5);hitStop(.04);}break;}
    case 'blast':boom(f.x,f.y,f.r,f.kind);break;
    case 'splash':ring(f.x,f.y,9,'#bfe8ff',2,10);for(let i=0;i<3;i++)P('dot',f.x,f.y,rnd(-1.6,1.6),rnd(-2.6,-1),rnd(12,18),rnd(1.6,2.4),'#bfe8ff',.2);sfx('splash');break;
    case 'pingpong':flash(f.x,f.y,16,'#ffffff',5);sparks(f.x,f.y,5,['#fff','#ffb347'],5);ring(f.x,f.y,10,'#ffffff',2.5,9);break;
    case 'shoot':{const sp=run.spots[f.i];if(f.id!=='shan')flash(sp.x,sp.y-34,f.id==='tt'||f.id==='peng'?15:10,TCOL[f.id],4);if(f.id==='tt')smoke(sp.x,sp.y-36,1,7);sfx('s_'+f.id);break;}
    case 'build':{const sp=run.spots[f.i];B.pop[f.i]=B.time;ring(sp.x,sp.y+2,30,'#f3d596',4,16);smoke(sp.x,sp.y+4,5,12);sfx('build');mission('build',1);S.tips.t_build=1;break;}
    case 'up':{const sp=run.spots[f.i],ev=f.lv===4;B.pop[f.i]=B.time-.2;B.pillars.push({x:sp.x,y:sp.y,t:0,big:ev});stars(sp.x,sp.y-20,ev?22:9,['#ffd93d','#fff'],ev?5:3);ring(sp.x,sp.y,ev?46:30,'#ffe9a0',ev?5:3,ev?22:14);
      if(ev){banner(LL(BR[f.br]),0,'#ffd93d');vib(40);hitStop(.06);flash(sp.x,sp.y-20,70,'#ffe9a0',10);sfx('evolve');}else sfx('up');S.tips.t_up=1;break;}
    case 'sell':{const sp=run.spots[f.i];coins(sp.x,sp.y-10,4);smoke(sp.x,sp.y,4,12);floatTxt(sp.x,sp.y-24,'+'+f.g,'#ffd93d',13);sfx('sell');break;}
    case 'wave':if(f.boss){banner(L('보스 등장!','BOSS 来了！'),1,'#ffd93d');sfx('boss');wantMusic('boss');shake(6);}else{banner(L('파도 ','第 ')+f.w+L('',' 波'));sfx('horn');}S.tips.t_start=1;
      if(f.w===2)tip('up',L('타워를 누르면 강화할 수 있어요. 3단계 다음엔 두 갈래 중 하나!','点一下塔可以升级，3 级之后二选一进阶！'),7);if(f.w===3)tip('skill',L('아래 큰 파도·야자 폭탄은 급할 때 직접 써요','下方的大浪和椰子炸弹，紧急时自己放'),7);break;
    case 'waveClear':floatTxt(225,400,L('파도 막음! +','守住了！+')+f.g,'#ffd93d',17);coins(225,390,5);sfx('wclear');if(f.w===1)tip('early',L('다음 파도를 미리 부르면 남은 시간만큼 골드를 더 받아요','提前叫下一波，可按剩余时间多拿金币'),7);break;
    case 'bonus':floatTxt(330,700,'+'+f.g,'#ffd93d',15);coins(330,700,3);sfx('bonus');break;
    case 'leak':B.leakFlash=20;B.lifeBump=1;shake(6);vib(40);hitStop(.03);burst(f.x,GATE_Y-6,10,['#ff5a4a','#fff'],4,3);ring(f.x,GATE_Y,34,'#ff5a4a',4,16);floatTxt(f.x,f.y-26,'-'+f.n,'#ff5a4a',16);sfx('leak');break;
    case 'ink':{const sp=run.spots[f.i];burst(sp.x,sp.y-26,10,'#4a3a6a',3,3.4);sfx('ink');tip('ink',L('먹물에 맞은 타워는 멈춰요. 눌러서 닦아 줘요!','被墨汁喷到的塔会停工，点一下擦干净！'),7);break;}
    case 'inkClear':{const sp=run.spots[f.i];sfx('clear');burst(sp.x,sp.y-24,8,'#4a3a6a',3,3);stars(sp.x,sp.y-26,6,'#fff',3);break;}
    case 'summon':ring(f.x,f.y,40,'#ffffff',4,18);burst(f.x,f.y,10,'#fff',3);if(f.bk==='whale'){banner(L('고래 파도! 적이 빨라져요','鲸浪！敌人加速'),0,'#bfe8ff');sfx('tide');}break;
    case 'tide':B.tide=52;sfx('tide');shake(7);vib(40);break;
    case 'down':sfx('over');break;
    case 'revive':sfx('reward');stars(225,GATE_Y-10,30,['#ffd93d','#fff'],6);ring(225,GATE_Y,80,'#ffe9a0',6,24);break;
    case 'win':sfx('win');wantMusic('menu');B.endT=2.2;B.sel=-1;for(let i=0;i<60;i++)P('paper',rnd(0,450),rnd(-220,0),rnd(-1,1),rnd(2,5),120,rnd(3,5),FW_COL[i%5],0,1);break;
    case 'lose':B.endT=1.3;B.sel=-1;break;
  }}
  run.fx.length=0;
  if(run.en.some(e=>e.air))tip('air',L('갈매기는 길을 무시하고 날아와요. 퇀퇀·쫑쫑은 하늘을 못 맞혀요','海鸥会直接飞过来，团团和啄啄打不到空中'),7);
  if(run.en.some(e=>e.armor>=.5))tip('armor',L('단단한 적은 방울이·반짝의 마법, 소라게는 폭발에 약해요','硬壳敌人怕滴滴和闪闪的魔法，寄居蟹怕爆炸'),7);
}
function projPos(p){if(p.lob){const q=p.t/p.T;return [p.x,p.y-Math.sin(q*3.1416)*(p.k==='fw'?70:42)];}return [p.x,p.y];}
function battleTick(dt){
  B.time+=dt;if(B.tip&&(B.tip.t-=dt)<=0)B.tip=null;if(B.banner&&(B.banner.t+=dt)>1.6)B.banner=null;
  if(paused||adOv)return;
  if(B.stop>0)B.stop-=dt;else{const before=run.gold;advance(run,dt*speed);consumeFx();if(run.gold<before-1)B.goldBump=-1;}   // 큰 타격 때 아주 잠깐 멈춘다
  const f=Math.min(3,dt*60);B.shake*=Math.pow(.84,f);if(B.tide>0)B.tide-=f;if(B.wet>0)B.wet-=f;if(B.leakFlash>0)B.leakFlash-=f;B.goldBump*=Math.pow(.86,f);B.lifeBump*=Math.pow(.88,f);
  for(const p of run.pr){const q=projPos(p);(p.tr||(p.tr=[])).push(q[0],q[1]);if(p.tr.length>12)p.tr.splice(0,2);}
  if(Math.floor(B.time*20)!==Math.floor((B.time-dt)*20)){for(const z of run.zones)P('flame',z.x+rnd(-z.r,z.r)*.7,z.y+rnd(-z.r,z.r)*.5,rnd(-.2,.2),rnd(-1.2,-.6),rnd(14,22),rnd(3,5),'#ffb347');
    for(const sp of run.spots){const tw=sp.tw;if(tw&&tw.id==='shan'&&tw.tgt&&tw.ink<=0){const e=run.en.find(q=>q.id===tw.tgt);if(e)P('star',e.x+rnd(-6,6),e.y+rnd(-6,6),rnd(-.6,.6),rnd(-1.4,-.4),rnd(12,18),rnd(2,3),'#fff7c8',0,.95);}}}
  for(const p of B.parts){p.t+=f;p.x+=p.vx*f;p.y+=p.vy*f;p.vy+=p.gr*f;if(p.drag<1){const d=Math.pow(p.drag,f);p.vx*=d;p.vy*=d;}}B.parts=B.parts.filter(p=>p.t<p.life);
  for(const n of B.nums)n.t+=f;B.nums=B.nums.filter(n=>n.t<44);
  for(const r of B.rings)r.t+=f;B.rings=B.rings.filter(r=>r.t<r.life);
  for(const r of B.flashes)r.t+=f;B.flashes=B.flashes.filter(r=>r.t<r.life);
  for(const r of B.decals)r.t+=f;B.decals=B.decals.filter(r=>r.t<r.life);
  for(const r of B.pillars)r.t+=f;B.pillars=B.pillars.filter(r=>r.t<26);
  for(const o of B.fly)o.t+=f;B.fly=B.fly.filter(o=>o.t<9);
  for(const c of B.coins){c.t+=f;}{const n=B.coins.length;B.coins=B.coins.filter(c=>c.t<c.T);if(B.coins.length<n){B.goldBump=1;sfx('gold');}}
  if(run.ended&&B.endT>=0&&(B.endT-=dt)<0){B.endT=-1;endBattle();}
}
/* ---------- 타워와 자리 ---------- */
function drawBase(x,y,lv,br,ink){
  const hgt=[0,10,15,20,24][lv],w=25+lv*1.5,gold=lv>=4;
  g.fillStyle='rgba(60,40,20,.2)';g.beginPath();g.ellipse(x+3,y+7,w+4,10,0,0,6.2832);g.fill();
  g.lineWidth=2;g.strokeStyle=INK;g.lineJoin='round';
  g.fillStyle=gold?'#f0b860':'#e8bd72';g.beginPath();g.ellipse(x,y,w,9,0,0,3.1416);g.lineTo(x-w,y-hgt);g.ellipse(x,y-hgt,w,9,0,3.1416,0,true);g.closePath();g.fill();g.stroke();
  g.fillStyle=gold?'#ffd98a':'#f8d795';g.beginPath();g.ellipse(x,y-hgt,w,9,0,0,6.2832);g.fill();g.stroke();
  if(lv>=2){g.fillStyle=gold?'#f0b860':'#e8bd72';for(let i=0;i<5;i++){const a=3.1416+i*.7854,cx=x+Math.cos(a)*(w-2),cy=y-hgt-Math.sin(a)*-7;rr(cx-4,cy-9,8,8,2);g.fill();g.stroke();}}
  g.strokeStyle='rgba(150,100,50,.5)';g.lineWidth=1.4;g.beginPath();g.arc(x,y-hgt*.3,5,3.1416,0);g.stroke();
  if(lv>=3){g.strokeStyle=INK;g.lineWidth=2;g.beginPath();g.moveTo(x+w-3,y-hgt-2);g.lineTo(x+w-3,y-hgt-24);g.stroke();g.fillStyle=gold?'#ffd93d':RED;g.beginPath();g.moveTo(x+w-3,y-hgt-24);g.lineTo(x+w+11+Math.sin(B.time*5)*1.5,y-hgt-19);g.lineTo(x+w-3,y-hgt-14);g.closePath();g.fill();g.stroke();}
  return hgt;
}
function drawSpots(){
  const t=B.time,minC=Math.min.apply(null,run.owned.map(towerCost));
  run.spots.forEach((sp,i)=>{const tw=sp.tw,sel=B.sel===i;
    if(!tw){const can=run.gold>=minC,pu=can?Math.sin(t*4+i)*.5+.5:0;
      g.fillStyle='rgba(60,40,20,.16)';g.beginPath();g.ellipse(sp.x+2,sp.y+5,26,10,0,0,6.2832);g.fill();
      g.fillStyle=sel?'#fff1c4':'#f3d596';g.strokeStyle=sel?'#ff9f43':'rgba(120,80,40,.75)';g.lineWidth=sel?3:2;g.setLineDash(sel?[]:[5,4]);g.beginPath();g.ellipse(sp.x,sp.y,24,11,0,0,6.2832);g.fill();g.stroke();g.setLineDash([]);
      g.fillStyle=can?'rgba(255,255,255,'+(.7+pu*.3)+')':'rgba(255,255,255,.45)';g.strokeStyle=can?'#3a9478':'rgba(120,80,40,.5)';g.lineWidth=2;circ(sp.x,sp.y-3-pu*2,9);g.fill();g.stroke();
      g.strokeStyle=can?'#3a9478':'rgba(120,80,40,.6)';g.lineWidth=3;g.lineCap='round';g.beginPath();g.moveTo(sp.x-4.5,sp.y-3-pu*2);g.lineTo(sp.x+4.5,sp.y-3-pu*2);g.moveTo(sp.x,sp.y-7.5-pu*2);g.lineTo(sp.x,sp.y+1.5-pu*2);g.stroke();
      if(sel&&TOWERS[B.pick]){g.fillStyle='rgba(255,255,255,.16)';g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=2;g.setLineDash([7,5]);circ(sp.x,sp.y,TOWERS[B.pick].range);g.fill();g.stroke();g.setLineDash([]);}return;}
    if(sel){const st=towerStat(run,tw);g.fillStyle='rgba(255,255,255,.16)';g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=2;g.setLineDash([7,5]);circ(sp.x,sp.y,st.range);g.fill();g.stroke();g.setLineDash([]);}
  });
}
function drawTowers(){
  const t=B.time,order=run.spots.map((sp,i)=>i).filter(i=>run.spots[i].tw).sort((a,b)=>run.spots[a].y-run.spots[b].y);
  for(const i of order){const age=B.time-(B.pop[i]===undefined?-9:B.pop[i]);g.save();if(age<.42){const q=age/.42,dy=q<.5?-(1-q*2)*(1-q*2)*28:0,sq=q<.5?-.06:Math.sin((q-.5)*2*3.1416)*.18;g.translate(run.spots[i].x,run.spots[i].y+dy);g.scale(1+sq,1-sq);g.translate(-run.spots[i].x,-run.spots[i].y);}
    const sp=run.spots[i],tw=sp.tw,hgt=drawBase(sp.x,sp.y,tw.lv,tw.br),st=tw.anim>0?tw.anim/10:0,br=Math.sin(t*3+i)*.02;
    if(tw.lv>=4){g.fillStyle='rgba(255,217,61,'+(.22+Math.sin(t*4)*.06)+')';g.beginPath();g.ellipse(sp.x,sp.y-hgt-22,30,32,0,0,6.2832);g.fill();}
    drawImg(HERO_IMG[tw.id],sp.x,sp.y-hgt+4-st*4,46+tw.lv*2,{sx:1+br-st*.07,sy:1-br+st*.1,a:tw.ink>0?.75:1});
    for(let k=0;k<Math.min(3,tw.lv);k++){g.fillStyle=tw.lv>=4?'#ffd93d':'#fff';g.strokeStyle=INK;g.lineWidth=1.2;circ(sp.x-8+k*8,sp.y+13,3);g.fill();g.stroke();}
    if(tw.ink>0){g.fillStyle='rgba(50,38,80,.88)';circ(sp.x-5,sp.y-hgt-26,17);g.fill();circ(sp.x+11,sp.y-hgt-14,12);g.fill();circ(sp.x-12,sp.y-hgt-10,9);g.fill();icoHand(sp.x+16,sp.y-hgt+8,t,.42);}
    else if(tw.lv<4&&run.gold>=upCost(tw)&&B.sel!==i){const bo=Math.abs(Math.sin(t*4+i))*3;g.fillStyle='#5cc4a4';g.strokeStyle=INK;g.lineWidth=1.6;g.beginPath();g.moveTo(sp.x+20,sp.y-hgt-44-bo);g.lineTo(sp.x+28,sp.y-hgt-34-bo);g.lineTo(sp.x+23,sp.y-hgt-34-bo);g.lineTo(sp.x+23,sp.y-hgt-27-bo);g.lineTo(sp.x+17,sp.y-hgt-27-bo);g.lineTo(sp.x+17,sp.y-hgt-34-bo);g.lineTo(sp.x+12,sp.y-hgt-34-bo);g.closePath();g.fill();g.stroke();}
  g.restore();}
  // 등롱 빛줄기
  for(const sp of run.spots){const tw=sp.tw;if(!tw||tw.id!=='shan'||!tw.tgt||tw.ink>0||!tw.links)continue;let px=sp.x,py=sp.y-[0,10,15,20,24][tw.lv]-26;
    for(const id of tw.links){const e=run.en.find(q=>q.id===id);if(!e)break;const w=2+tw.ramp*.28;g.lineCap='round';g.strokeStyle='rgba(255,224,138,.45)';g.lineWidth=w+6+Math.sin(t*30)*1.5;g.beginPath();g.moveTo(px,py);g.lineTo(e.x,e.y);g.stroke();glow(e.x,e.y,9+tw.ramp*.8,'#ffe9a0',.8);glow(px,py,8,'#ffe9a0',.6);g.strokeStyle=tw.br==='rainbow'?'hsl('+((t*240)%360)+',90%,80%)':'#fffbe0';g.lineWidth=w;g.stroke();px=e.x;py=e.y;}}
}
function drawDecals(){
  for(const d of B.decals){const a=Math.min(1,(d.life-d.t)/50)*.28;g.fillStyle='rgba(70,45,25,'+a+')';g.beginPath();g.ellipse(d.x,d.y+2,d.r,d.r*.55,0,0,6.2832);g.fill();}
  if(B.wet>0){g.fillStyle='rgba(110,190,225,'+(B.wet/70*.16)+')';g.fillRect(0,100,W,GATE_Y-90);}
}
function drawEnemies(){
  const es=run.en.slice().sort((a,b)=>(a.air?1e4:0)+a.y-((b.air?1e4:0)+b.y)),t=run.t;
  for(const o of B.fly){const q=o.t/9,s=o.r*3.4*(1+q*.45);drawSpr(o.k,o.x,o.y,s,{a:1-q,sx:1+q*.2,sy:1-q*.25});drawSpr(o.k,o.x,o.y,s,{white:1,a:(1-q)*.85,sx:1+q*.2,sy:1-q*.25});}
  for(const e of es){const k=sprKey(e),size=e.r*3.4,bob=1+Math.sin(t*.2+e.ph)*.05,h=e.hit/6;let y=e.y+e.r*.25;
    if(e.air){g.fillStyle='rgba(60,40,20,.14)';g.beginPath();g.ellipse(e.x,e.y+26,e.r*.8,e.r*.3,0,0,6.2832);g.fill();y-=6+Math.sin(t*.15+e.ph)*3;}
    else{g.fillStyle='rgba(60,40,20,.18)';g.beginPath();g.ellipse(e.x,e.y+e.r*.8,e.r*.9,e.r*.32,0,0,6.2832);g.fill();if(e.k==='fish')y-=Math.abs(Math.sin(t*.16+e.ph))*8;}
    if(e.slow>0){g.fillStyle='rgba(150,215,255,.5)';g.beginPath();g.ellipse(e.x,e.y+e.r*.8,e.r*1.25,e.r*.48,0,0,6.2832);g.fill();g.strokeStyle='rgba(255,255,255,.8)';g.lineWidth=1;g.stroke();}
    if(e.shred>0)glow(e.x,y-e.r*.3,e.r*2.2,'#ffe9a0',.35);
    const o={sx:bob*(1+h*.2),sy:(2-bob)*(1-h*.16)};drawSpr(k,e.x,y-h*2,size,o);if(h>0)drawSpr(k,e.x,y-h*2,size,{sx:o.sx,sy:o.sy,white:1,a:h*.85});
    if(e.stun>0)for(let i=0;i<2;i++){const a=B.time*7+i*3.14;txt('★',e.x+Math.cos(a)*e.r*.8,e.y-e.r-8+Math.sin(a)*3,8,'#ffd93d','center',INK,2);}
    if(e.hp<e.max*.999||e.k==='elite'||e.k==='boss'){const w=Math.max(18,e.r*1.9),yy=y-size*.5-3;g.fillStyle='rgba(60,36,20,.75)';rr(e.x-w/2-1,yy-1,w+2,5.5,2.5);g.fill();g.fillStyle=e.armor>=.5?'#9fb8d0':e.k==='boss'?'#ff5a4a':e.hp<e.max*.35?'#ffb347':'#7ddc6a';rr(e.x-w/2,yy,w*Math.max(0,e.hp/e.max),3.5,1.7);g.fill();}
  }
}
const TRAIL={fw:'255,190,90',bun:'255,255,255',drop:'150,215,255',ball:'255,255,255',mail:'255,200,215'};
function drawProj(){
  for(const z of run.zones){glow(z.x,z.y,z.r*1.5,'#ff9f43',.3+Math.sin(B.time*9)*.08);}
  for(const p of run.pr){const q=projPos(p),x=q[0],y=q[1],tr=p.tr;
    if(tr&&tr.length>=4){g.lineCap='round';for(let i=2;i<tr.length;i+=2){const a=i/tr.length;g.strokeStyle='rgba('+TRAIL[p.k]+','+(a*.75)+')';g.lineWidth=(p.k==='ball'?4:p.k==='fw'?4.5:3.2)*a;g.beginPath();g.moveTo(tr[i-2],tr[i-1]);g.lineTo(tr[i],tr[i+1]);g.stroke();}}
    if(p.k==='fw'){glow(x,y,11,'#ffb347',.9);g.fillStyle='#fff7d6';circ(x,y,2.8);g.fill();if(Math.random()<.5)P('dot',x,y,rnd(-.4,.4),rnd(.2,1),rnd(8,14),rnd(1,1.8),'#ffd27a');}
    else if(p.k==='bun'){const s=1+Math.sin(p.t*.5)*.08;g.fillStyle='#fff';g.strokeStyle=INK;g.lineWidth=1.6;g.beginPath();g.ellipse(x,y,5.8*s,5.8/s,0,0,6.2832);g.fill();g.stroke();g.beginPath();g.arc(x,y-1,2.4,3.6,5.8);g.stroke();}
    else if(p.k==='drop'){glow(x,y,p.line?11:8,'#8fd4ff',.7);g.fillStyle='#c9ecff';g.strokeStyle='#3d8fd0';g.lineWidth=1.2;circ(x,y,p.line?5:3.6);g.fill();g.stroke();}
    else if(p.k==='ball'){glow(x,y,9,'#ffffff',.8);g.fillStyle='#fff';g.strokeStyle='#ff9f43';g.lineWidth=1.6;circ(x,y,3.8);g.fill();g.stroke();}
    else{g.save();g.translate(x,y);g.rotate(p.t*.25);g.fillStyle='#fff';g.strokeStyle=INK;g.lineWidth=1.4;rr(-7,-5,14,10,2);g.fill();g.stroke();g.fillStyle=RED;circ(0,0,2);g.fill();g.restore();}}
}
function drawFx(){
  for(const p of B.pillars){const q=p.t/26,w=(p.big?34:22)*(1-q*.5),gr=g.createLinearGradient(0,p.y-150,0,p.y);gr.addColorStop(0,'rgba(255,233,160,0)');gr.addColorStop(1,'rgba(255,240,190,'+(.8*(1-q))+')');g.fillStyle=gr;g.fillRect(p.x-w,p.y-150,w*2,154);}
  for(const r of B.rings){const q=r.t/r.life,e=1-Math.pow(1-q,3);g.globalAlpha=1-q;g.strokeStyle=r.col;g.lineWidth=Math.max(.5,r.w*(1-q));circ(r.x,r.y,r.r*(.3+.7*e));g.stroke();}g.globalAlpha=1;
  g.globalCompositeOperation='lighter';for(const r of B.flashes){const q=r.t/r.life;glow(r.x,r.y,r.r*(.6+q*.6),r.col,(1-q)*.9);}g.globalCompositeOperation='source-over';
  if(B.tide>0){const q=1-B.tide/52,y=40+q*720,a=1-q*.5;
    const gr=g.createLinearGradient(0,y-150,0,y);gr.addColorStop(0,'rgba(90,190,230,0)');gr.addColorStop(.75,'rgba(90,190,230,'+(.6*a)+')');gr.addColorStop(1,'rgba(190,235,250,'+(.85*a)+')');g.fillStyle=gr;
    g.beginPath();g.moveTo(0,y-150);g.lineTo(W,y-150);for(let x=W;x>=0;x-=15)g.lineTo(x,y+Math.sin(x*.05+B.time*9)*9+Math.sin(x*.13)*4);g.closePath();g.fill();
    for(let k=0;k<3;k++){g.strokeStyle='rgba(255,255,255,'+((.95-k*.28)*a)+')';g.lineWidth=5-k*1.4;g.lineCap='round';g.beginPath();for(let x=0;x<=W;x+=15){const yy=y-k*16+Math.sin(x*.05+B.time*9+k)*9+Math.sin(x*.13)*4;if(x)g.lineTo(x,yy);else g.moveTo(x,yy);}g.stroke();}
    g.fillStyle='rgba(255,255,255,'+(.9*a)+')';for(let i=0;i<14;i++){const x=(i*37+B.time*60)%W;circ(x,y+6+Math.sin(i*2.3+B.time*8)*8,2+(i%3));g.fill();}if(B.tide<3)B.wet=70;}
  for(const p of B.parts){const q=p.t/p.life,a=Math.min(1,(p.life-p.t)/8);
    if(p.kind==='spark'){g.strokeStyle=p.col;g.globalAlpha=a;g.lineWidth=p.r;g.lineCap='round';g.beginPath();g.moveTo(p.x,p.y);g.lineTo(p.x-p.vx*2.2,p.y-p.vy*2.2);g.stroke();}
    else if(p.kind==='smoke'){g.globalAlpha=.42*(1-q);g.fillStyle=p.col;circ(p.x,p.y,p.r*(.6+q*1.3));g.fill();}
    else if(p.kind==='star'){const s=p.r*(1-q*.5)*(.7+Math.sin(p.t*.9)*.3);g.globalAlpha=a;g.fillStyle=p.col;g.beginPath();g.moveTo(p.x,p.y-s);g.lineTo(p.x+s*.28,p.y-s*.28);g.lineTo(p.x+s,p.y);g.lineTo(p.x+s*.28,p.y+s*.28);g.lineTo(p.x,p.y+s);g.lineTo(p.x-s*.28,p.y+s*.28);g.lineTo(p.x-s,p.y);g.lineTo(p.x-s*.28,p.y-s*.28);g.closePath();g.fill();}
    else if(p.kind==='paper'){g.globalAlpha=a;g.fillStyle=p.col;g.save();g.translate(p.x,p.y);g.rotate(p.t*.2+p.r);g.fillRect(-p.r,-p.r*.6*Math.cos(p.t*.3),p.r*2,p.r*1.2*Math.cos(p.t*.3));g.restore();}
    else if(p.kind==='flame'){g.globalAlpha=1;glow(p.x,p.y,p.r*2.4*(1-q*.5),q<.4?'#ffe08a':'#ff8a3d',(1-q)*.8);}
    else{g.globalAlpha=a;g.fillStyle=p.col;circ(p.x,p.y,p.r*(1-q*.4));g.fill();}}
  g.globalAlpha=1;
  for(const c of B.coins){if(c.t<0)continue;const q=c.t/c.T,e=q*q,u=1-e,x=u*u*c.sx+2*u*e*c.cx+e*e*180,y=u*u*c.sy+2*u*e*c.cy+e*e*31;icoCoin(x,y,4.6*(1-q*.25));}
  for(const n of B.nums){const a=Math.min(1,(44-n.t)/12),pop=1+Math.max(0,(7-n.t)/7)*.8;g.globalAlpha=a;txt(n.s,n.x,n.y-Math.min(n.t,30)*.6,n.sz*pop,n.col,'center',INK,Math.max(2.4,n.sz*.24));}g.globalAlpha=1;
  if(B.aim==='bomb'){const x=PTR.down?PTR.x/K:225,y=PTR.down?PTR.y/K:400;g.fillStyle='rgba(255,90,74,.16)';g.strokeStyle='rgba(255,90,74,.95)';g.lineWidth=2.4;g.setLineDash([7,5]);g.lineDashOffset=-B.time*30;circ(x,y,SKILL.bomb.r);g.fill();g.stroke();g.setLineDash([]);g.lineDashOffset=0;}
  if(B.leakFlash>0){const a=B.leakFlash/20;const gr=g.createLinearGradient(0,GATE_Y-140,0,H);gr.addColorStop(0,'rgba(255,60,50,0)');gr.addColorStop(1,'rgba(255,60,50,'+(a*.45)+')');g.fillStyle=gr;g.fillRect(0,GATE_Y-140,W,H);}
  // 다음 파도 미리 보기: 길 입구에 말풍선
  if((run.ws==='prep'||run.ws==='gap')&&run.next){const d=run.next;run.paths.forEach((p,pi)=>{const gs=d.groups.filter(q=>q.path%run.paths.length===pi);if(!gs.length)return;const x=Math.max(70,Math.min(380,p.s[0].x)),y=96+Math.sin(B.time*3)*2,w=gs.length*44+10;
      g.fillStyle='rgba(255,253,243,.95)';g.strokeStyle=INK;g.lineWidth=1.8;rr(x-w/2,y-17,w,34,12);g.fill();g.stroke();g.beginPath();g.moveTo(x-6,y+17);g.lineTo(x,y+25);g.lineTo(x+6,y+17);g.fill();
      gs.forEach((q,k)=>{const xx=x-w/2+24+k*44,key=q.k==='boss'?run.S.boss:q.k;drawSpr(key,xx-7,y+1,26);txt('×'+q.n,xx+15,y+3,10,INK);});});}
}

/* ---------- 메뉴: 자리를 누르면 둘레에 고를 것이 뜬다. 한 번 누르면 설명, 한 번 더 누르면 실행 ---------- */
function menuCenter(sp){return {x:Math.max(168,Math.min(VW-168,sp.x*K)),y:Math.max(330,Math.min(1010,sp.y*K-20))};}
function roundBtn(x,y,r,on,off,fn,drawIn){g.fillStyle='rgba(60,36,20,.3)';circ(x,y+6,r);g.fill();g.fillStyle=off?'#d8d0c2':on?'#8ee0bf':CREAM;circ(x,y,r);g.fill();g.lineWidth=5;g.strokeStyle=on?'#2f8f6f':INK;g.stroke();drawIn();zone(x-r,y-r,r*2,r*2,fn);}
function costTag(x,y,c,ok){font(24);const w=g.measureText(String(c)).width+46;g.fillStyle=ok?'#fff6d6':'#e6ded0';rr(x-w/2,y-17,w,34,17);g.fill();g.lineWidth=3.5;g.strokeStyle=INK;g.stroke();icoCoin(x-w/2+18,y,11);txt(c,x+10,y+1,24,ok?INK:'#b0482f');}
function drawMenu(){
  if(B.sel<0||run.phase!=='run')return;const sp=run.spots[B.sel],tw=sp.tw,c=menuCenter(sp),R=146;let info=null;
  if(!tw){const ids=run.owned,n=ids.length;
    ids.forEach((id,k)=>{const a=-1.5708+(k-(n-1)/2)*(n>4?1.02:1.15),x=c.x+Math.cos(a)*R*(n>4?1.08:1),y=c.y+Math.sin(a)*R*(n>4?1.08:1)+ (n>4&&(k===0||k===n-1)?-10:0),cost=towerCost(id),ok=run.gold>=cost,on=B.pick===id;
      roundBtn(x,y,56,on,!ok,()=>{if(on){if(build(run,B.sel,id)){B.sel=-1;B.pick='';}else{sfx('nope');toast(L('골드가 모자라요','金币不够'));}}else{B.pick=id;sfx('btn');}},()=>{if(on){drawImg(HERO_IMG[id],x,y+40,74,{a:.35});txt('✓',x,y,60,'#1f7a5a','center','#fff',10);}else drawImg(HERO_IMG[id],x,y+44,84,{a:ok?1:.5});});
      costTag(x,y+62,cost,ok);});
    if(B.pick){const b=TOWERS[B.pick];info={t:LL(HN[B.pick])+'  ·  '+L('한 번 더 누르면 지어요','再点一次建造'),d:LL(TROLE[B.pick]),r:b.range*heroMul(1)};}
    else info={t:L('어떤 타워를 지을까요?','要建哪种塔？'),d:L('타워를 누르면 설명이 나와요','点一下塔可以看说明')};
  }else{const st=towerStat(run,tw),cost=upCost(tw),ok=run.gold>=cost;
    if(tw.lv<3){const on=B.pick==='up';roundBtn(c.x,c.y-R,60,on,!ok,()=>{if(on){if(upgrade(run,B.sel)){B.pick='';}else{sfx('nope');toast(L('골드가 모자라요','金币不够'));}}else{B.pick='up';sfx('btn');}},()=>{if(on)txt('✓',c.x,c.y-R,64,'#1f7a5a','center','#fff',10);else{g.fillStyle=ok?MINT:GREY_D;g.strokeStyle=INK;g.lineWidth=4;g.lineJoin='round';g.beginPath();g.moveTo(c.x,c.y-R-30);g.lineTo(c.x+28,c.y-R);g.lineTo(c.x+12,c.y-R);g.lineTo(c.x+12,c.y-R+26);g.lineTo(c.x-12,c.y-R+26);g.lineTo(c.x-12,c.y-R);g.lineTo(c.x-28,c.y-R);g.closePath();g.fill();g.stroke();}});costTag(c.x,c.y-R+66,cost,ok);}
    else if(tw.lv===3){BRANCH[tw.id].forEach((br,k)=>{const x=c.x+(k?1:-1)*104,y=c.y-R+26,on=B.pick===br;
        roundBtn(x,y,62,on,!ok,()=>{if(on){if(upgrade(run,B.sel,br)){B.pick='';}else{sfx('nope');toast(L('골드가 모자라요','金币不够'));}}else{B.pick=br;sfx('btn');}},()=>{if(on)txt('✓',x,y,64,'#1f7a5a','center','#fff',10);else{icoStar(x,y-12,26,1);txtFit(LL(BR[br]),x,y+30,20,104,INK);}});costTag(x,y+68,cost,ok);});}
    const on=B.pick==='sell',refund=Math.round(tw.spent*SELL);roundBtn(c.x,c.y+R,50,on,false,()=>{if(on){sell(run,B.sel);B.sel=-1;B.pick='';}else{B.pick='sell';sfx('btn');}},()=>{if(on)txt('✓',c.x,c.y+R,54,'#b0482f','center','#fff',9);else{icoCoin(c.x,c.y+R-8,17);txt(L('팔기','出售'),c.x,c.y+R+24,19,INK);}});costTag(c.x,c.y+R+58,'+'+refund,true);
    const name=LL(HN[tw.id])+(tw.br?' · '+LL(BR[tw.br]):'')+'  Lv.'+tw.lv+(tw.lv>=4?' MAX':'');
    if(B.pick==='sell')info={t:name,d:L('한 번 더 누르면 팔아요 (쓴 골드의 70% 돌려받음)','再点一次出售（返还 70% 金币）')};
    else if(BR[B.pick])info={t:LL(BR[B.pick])+'  ·  '+L('한 번 더 누르면 진화','再点一次进阶'),d:BR[B.pick][LANG==='zh'?3:2]};
    else if(B.pick==='up')info={t:name+'  →  Lv.'+(tw.lv+1),d:L('위력 ','威力 ')+Math.round(st.dmg/LV_DMG[tw.lv-1]*LV_DMG[tw.lv]*10)/10+L(' · 사거리 조금 늘어남 · 한 번 더 누르면 강화',' · 射程略增 · 再点一次升级')};
    else info={t:name,d:(tw.br?BR[tw.br][LANG==='zh'?3:2]:LL(TROLE[tw.id]))+'  ·  '+L('위력 ','威力 ')+Math.round(st.dmg*10)/10};
  }
  if(info){const y=sp.y*K>860?150:1086;panel(24,y,702,116,'#fffdf3',26,4);txtFit(info.t,375,y+38,28,660,INK);txtFit(info.d,375,y+82,22,660,'#8a6a4a');}
}
function skillBtn(x,key,label,ready,cdLeft,cdMax,fn,drawIco,active){
  const y=1238,w=124,h=84;btn(x,y,w,h,'',fn,{col:active?'#ffd93d':ready?'#7ad0ff':'#b9c6d0',dk:active?YEL_D:ready?'#3d8fd0':'#8b98a3',icon:(cx,cy)=>{drawIco(cx-34,cy);const cdn=cdLeft>0;txtFit(label,cx+22,cy-(cdn?12:0),19,64,INK);if(cdn)txt(Math.ceil(cdLeft/60),cx+22,cy+16,24,'#5a3620');}});
  if(!ready){g.fillStyle='rgba(40,24,12,.28)';rr(x,y,w*Math.min(1,cdLeft/cdMax),h,26);g.fill();}
}
function drawHud(){
  btn(14,16,76,72,'',()=>{paused=true;sfx('btn');},{col:CREAM,dk:'#d9c8a8',icon:(x,y)=>{g.fillStyle=INK;rr(x-14,y-15,10,30,4);g.fill();rr(x+4,y-15,10,30,4);g.fill();}});
  panel(104,18,150,66,CREAM,22);g.fillStyle='#ff5a4a';g.strokeStyle=INK;g.lineWidth=3.5;g.beginPath();g.moveTo(138,68);g.bezierCurveTo(108,46,122,26,138,40);g.bezierCurveTo(154,26,168,46,138,68);g.fill();g.stroke();txt(run.lives,200,53,32*(1+B.lifeBump*.5),run.lives<=5||B.lifeBump>.2?RED:INK);
  panel(268,18,180,66,CREAM,22);icoCoin(300,51,18);txtFit(Math.floor(run.gold),372,53,32*(1+Math.abs(B.goldBump)*.22),120,B.goldBump<-.2?'#b0482f':INK);
  panel(462,18,170,66,CREAM,22);txt(L('파도','波次'),500,53,19,'#a07a55');txt(Math.max(run.wave,0)+' / '+run.S.waves,576,53,29,INK);
  btn(646,16,90,72,speed>1?'x2':'x1',()=>{speed=speed>1?1:2;S.opt.fast=speed>1?1:0;sfx('btn');},{col:speed>1?YEL:CREAM,dk:speed>1?YEL_D:'#d9c8a8',tc:INK,sz:30});
  if(run.boss&&!run.boss.dead){bar(150,100,450,30,run.boss.hp/run.boss.max,'#ff6b6b');txt('BOSS',375,115,18,'#fff','center',INK,4);}
  // 아래: 스킬 둘 + 다음 파도
  const live=run.ws!=='prep';
  skillBtn(14,'tide',L('큰 파도','大浪'),live&&run.cd.tide<=0,live?run.cd.tide:0,SKILL.tide.cd*60,()=>{if(castTide(run)){mission('skill',1);}else sfx('nope');},(x,y)=>{g.strokeStyle='#fff';g.lineWidth=6;g.lineCap='round';g.beginPath();g.moveTo(x-18,y+8);g.quadraticCurveTo(x-6,y-22,x+8,y-2);g.quadraticCurveTo(x+14,y+8,x+20,y+2);g.stroke();},false);
  skillBtn(150,'bomb',L('야자 폭탄','椰子炸弹'),live&&run.cd.bomb<=0,live?run.cd.bomb:0,SKILL.bomb.cd*60,()=>{if(!live||run.cd.bomb>0){sfx('nope');return;}B.aim=B.aim==='bomb'?'':'bomb';B.sel=-1;sfx('btn');},(x,y)=>{g.fillStyle='#8a5a34';g.strokeStyle=INK;g.lineWidth=3.5;circ(x,y+3,17);g.fill();g.stroke();g.fillStyle='#5a3620';circ(x-6,y-1,2.6);g.fill();circ(x+5,y-1,2.6);g.fill();circ(x,y+8,2.6);g.fill();},B.aim==='bomb');
  const canCall=run.phase==='run'&&run.wave<run.S.waves&&(run.ws==='prep'||run.ws==='gap');
  if(run.ws==='prep'){const pu=1+Math.sin(B.time*5)*.02,need=!run.spots.some(sp=>sp.tw);g.save();g.translate(520,1280);g.scale(pu,pu);g.translate(-520,-1280);btn(300,1234,436,90,L('▶ 시작!','▶ 开始！'),()=>{if(need){sfx('nope');toast(L('먼저 타워를 하나 지어요','先建一座塔吧'));return;}sfx('btn');callWave(run);},{sz:42,off:false,col:need?GREY:RED,dk:need?GREY_D:RED_D});g.restore();
    if(!B.adGold&&run.si>0)btn(300,1150,436,64,L('▶ 광고 보고 시작 골드 +150','▶ 看广告开局金币 +150'),()=>showAd('gold',o=>{if(o){run.gold+=150;B.adGold=true;sfx('reward');}}),{col:YEL,dk:YEL_D,tc:INK,sz:24});}
  else if(canCall){const sec=Math.ceil(run.gapT/60),bonus=Math.round(run.gapT/60*BONUS_PER_SEC);btn(300,1234,436,90,'',()=>{sfx('btn');callWave(run);},{col:MINT,dk:MINT_D,icon:(x,y)=>{txt(L('다음 파도 부르기','提前叫下一波'),x,y-17,27,'#fff','center',INK);icoCoin(x-70,y+22,12);txt('+'+bonus+L('  ·  ','  ·  ')+sec+L('초 뒤 자동','秒后自动'),x+16,y+23,21,'#fff','center',INK,5);}});}
  else{panel(300,1238,436,84,'rgba(255,246,228,.85)',26,4);const left=run.en.length+run.queue.length;txt(run.wave>=run.S.waves?L('마지막 파도! 남은 적 ','最后一波！剩余 ')+left:L('남은 적 ','剩余敌人 ')+left,518,1281,26,INK);}
  if(B.aim==='bomb')txt(L('터뜨릴 곳을 눌러요','点一下要炸的地方'),375,1196,28,'#fff','center',INK,7);
  if(B.banner){const b=B.banner,q=Math.min(1,b.t*5),o=b.t>1.3?(1.6-b.t)/.3:1;g.globalAlpha=Math.max(0,o);const bh=b.big?120:90;g.fillStyle='rgba(60,36,20,.55)';g.fillRect(0,250-bh/2,VW*q,bh);g.fillStyle=b.big?'#ffd93d':'#fff';g.fillRect(0,250-bh/2-6,VW*q,5);g.fillRect(0,250+bh/2+1,VW*q,5);txt(b.text,375+(1-q)*120,250,b.big?70:50,b.col,'center',INK,b.big?16:12);g.globalAlpha=1;}
  if(B.tip&&B.sel<0){panel(24,1086,702,116,'#fffdf3',30);drawImg('tuantuan',84,1194,104);wrap(B.tip.text,150,B.tip.text.length>22?1126:1144,25,550,34,INK,'left',2);}
  // 첫 판 손가락
  if(run.si===0&&run.ws==='prep'&&B.sel<0&&!adOv){if(!run.spots.some(sp=>sp.tw)&&!S.tips.t_build){const sp=run.spots.slice().sort((a,b)=>Math.abs(a.y-300)-Math.abs(b.y-300))[0];icoHand(sp.x*K+26,sp.y*K+40,B.time);}else if(run.spots.some(sp=>sp.tw)&&!S.tips.t_start)icoHand(560,1330,B.time);}
}
function drawRevive(){
  g.fillStyle='rgba(40,24,12,.6)';g.fillRect(0,0,VW,VH);BT.length=0;panel(75,420,600,470,CREAM,36);
  drawImg('didi_sick',375,590,130);txt(L('마을 대문이 뚫렸어요!','镇门被攻破了！'),375,640,44,INK);txt(L('목숨 10으로 다시 버텨 볼까요? (한 판에 1번)','恢复 10 点生命再坚持一下？（每局 1 次）'),375,694,23,'#a07a55');
  btn(125,738,500,96,L('▶ 광고 보고 이어 하기','▶ 看广告继续'),()=>showAd('revive',o=>{if(o)revive(run);}),{col:YEL,dk:YEL_D,tc:INK,sz:32});
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
  g.drawImage(B.map,0,0);g.save();g.scale(K,K);drawSea();drawDecals();drawSpots();drawEnemies();drawTowers();drawProj();drawFx();g.restore();g.restore();
  drawHud();drawMenu();
  if(run.phase==='revive')drawRevive();else if(paused)drawPause();
}
function drawSea(){ // 물결 반짝임과 파도선(배경 위에 살짝)
  const t=B.time;g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=2.5;g.lineCap='round';g.beginPath();for(let x=0;x<=W;x+=18){const y=shoreY(x)+2+Math.sin(x*.07+t*2)*2.5;if(x)g.lineTo(x,y);else g.moveTo(x,y);}g.stroke();
  g.strokeStyle='rgba(255,255,255,.3)';g.lineWidth=2;for(let i=0;i<5;i++){const x=40+i*92+Math.sin(t*.7+i)*14,y=74+(i%2)*22+Math.sin(t*1.3+i*2)*3;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+12,y-5,x+24,y);g.stroke();}
}

/* ---------- 조작 (누르기만) ---------- */
function battleDown(){}
function battleUp(x,y){
  if(paused||adOv||run.phase!=='run')return false;const lx=x/K,ly=y/K;
  if(B.aim==='bomb'){if(ly>60&&ly<735){if(castBomb(run,lx,ly)){B.aim='';mission('skill',1);}}return true;}
  let best=-1,bd=34*34;run.spots.forEach((sp,i)=>{const d=(sp.x-lx)**2+(sp.y-12-ly)**2;if(d<bd){bd=d;best=i;}});
  if(best>=0){const tw=run.spots[best].tw;if(tw&&tw.ink>0){cleanInk(run,best);return true;}B.sel=B.sel===best?-1:best;B.pick='';sfx('btn');return true;}
  if(B.sel>=0){B.sel=-1;B.pick='';return true;}return false;
}

/* ============================== 판 밖 화면: 홈 · 영웅 · 보상 · 설정 · 결과, 그리고 전체 진행 ============================== */
const APP={hidden:false,t:0,toast:null,errs:0,lastErr:'',playSec:0,loadT:0,bot:false,resetArm:0};
let scr='load',RES=null;
const SN=[['모래사장','沙滩'],['갯바위','礁石滩'],['산호초','珊瑚礁'],['해적섬','海盗岛'],['용궁 입구','龙宫门口']];
function toast(s){APP.toast={s,t:2.2};}
function today(){const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}

/* ---------- 매일 보상 ---------- */
const MIS={run:[2,60,['출전 2번','出战 2 次']],kill:[120,80,['괴물 120마리 돌려보내기','赶走 120 只海怪']],skill:[5,60,['큰 파도·야자 폭탄 5번 쓰기','使用大浪或椰子炸弹 5 次']],build:[12,60,['타워 12개 짓기','建造 12 座塔']],
  win:[1,100,['한 판 클리어','通关 1 次']],up:[1,60,['타워 숙련 1번 올리기','提升 1 次塔熟练度']]};
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
const avgLv=()=>{const ids=TOWER_IDS.filter(id=>S.lv[id]);let s=0;for(const id of ids)s+=S.lv[id];return Math.round(s/ids.length);};

function goHome(){scr='home';run=null;B=null;paused=false;wantMusic('menu');dailyInit();S.sel=Math.max(0,Math.min(S.sel,S.cleared,STAGES.length-1));persist();}
function endBattle(){
  const won=run.won,si=run.si,unlock=[];let first=0;
  if(won){S.stat.wins++;mission('win',1);if(S.stars[si]===0)first=REWARD.first[si];S.stars[si]=Math.max(S.stars[si],run.stars);if(S.cleared<si+1)S.cleared=si+1;
    for(const id in UNLOCK)if(S.cleared>=UNLOCK[id]&&!S.lv[id]){S.lv[id]=1;unlock.push(id);}}
  mission('kill',run.kills);S.stat.kills+=run.kills;S.coins+=run.reward+first;
  RES={won,si,stars:run.stars,reward:run.reward,first,unlock,doubled:false,t:0,wave:run.wave,waves:run.S.waves};
  track(won?'stage_clear':'stage_fail',{stage:si+1,wave:run.wave,stars:run.stars,sec:Math.round(run.t/60)});scr='result';wantMusic('menu');persist();
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
  backdrop(.42);const t=APP.t,si=S.sel,st=STAGES[si],own=TOWER_IDS.filter(id=>S.lv[id]);
  panel(20,30,210,70,CREAM,22);icoCoin(54,65,19);txtFit(S.coins,132,66,30,130,INK);
  btn(646,26,84,78,'',()=>{sfx('btn');scr='settings';},{col:CREAM,dk:'#d9c8a8',icon:(x,y)=>{g.fillStyle=INK;for(let i=-1;i<2;i++){rr(x-20,y+i*15-4,40,8,4);g.fill();}}});
  txt(L('퇀퇀 해변 수비대','团团守海滩'),375,196,LANG==='zh'?92:74,'#fff','center',INK,20);
  txt(L('타워를 세워 바다 괴물로부터 해변 마을을 지켜요','建造防御塔，赶走小海怪，守护海滩小镇'),375,268,25,INK,'center','#fff',6);
  own.forEach((id,i)=>{const n=own.length,x=375+(i-(n-1)/2)*(n>4?112:128),b=Math.sin(t*3+i)*.03;drawImg(id==='tt'?'tt_cheer':HERO_IMG[id],x,520,id==='tt'?180:150,{sx:1+b,sy:1-b});});
  panel(60,560,630,330,CREAM,36);
  txt(L('제 ','第 ')+(si+1)+L(' 장 · ',' 关 · ')+LL(SN[si]),375,612,40,INK);
  for(let i=0;i<3;i++)icoStar(315+i*60,672,24,i<S.stars[si]);
  const ks=st.kinds.concat([st.boss]);ks.forEach((k,i)=>{const x=375+(i-(ks.length-1)/2)*Math.min(92,560/ks.length),boss=i===ks.length-1;drawSpr(k,x,762,boss?108:Math.min(78,480/ks.length));});
  const low=avgLv()<st.rec;txt(L('권장 타워 숙련 Lv.','推荐熟练度 Lv.')+st.rec+L('  ·  내 평균 Lv.','  ·  我的平均 Lv.')+avgLv(),375,826,24,low?RED:'#3a9478');
  txt(L('파도 ','共 ')+st.waves+L('번  ·  길 ',' 波  ·  路线 ')+st.paths.length+L('갈래  ·  타워 자리 ',' 条  ·  塔位 ')+st.spots,375,860,21,'#a07a55');
  if(si>0)btn(20,690,70,90,'‹',()=>{sfx('btn');S.sel--;},{col:CREAM,dk:'#d9c8a8',tc:INK,sz:56});
  if(si<Math.min(S.cleared,STAGES.length-1))btn(660,690,70,90,'›',()=>{sfx('btn');S.sel++;},{col:CREAM,dk:'#d9c8a8',tc:INK,sz:56});
  const pu=1+Math.sin(t*4)*.015;g.save();g.translate(375,975);g.scale(pu,pu);g.translate(-375,-975);btn(165,918,420,116,L('출전!','出发！'),()=>{sfx('btn');startBattle(S.sel);},{sz:56});g.restore();
  btn(50,1082,310,104,L('타워','防御塔'),()=>{sfx('btn');scr='heroes';tipOnce('heroes',L('동전으로 타워 숙련을 올리면 모든 판에서 더 강해져요','用金币提升熟练度，每一关都会更强'));},{col:MINT,dk:MINT_D,sz:40,dot:TOWER_IDS.some(id=>S.lv[id]&&S.lv[id]<MAX_LV&&S.coins>=lvCost(S.lv[id]))});
  btn(390,1082,310,104,L('보상','奖励'),()=>{sfx('btn');scr='reward';},{col:YEL,dk:YEL_D,tc:INK,sz:40,dot:rewardBadge()});
  if(APP.playSec>1800){panel(150,300,450,74,'#fffdf3',30);txt(L('오래 했어요. 잠깐 쉬어 가요!','玩了很久啦，休息一下吧！'),375,338,26,INK);}
  if(LANG==='zh'){txt('抵制不良游戏，拒绝盗版游戏。注意自我保护，谨防受骗上当。',375,1232,17,'#7a5a3c');txt('适度游戏益脑，沉迷游戏伤身。合理安排时间，享受健康生活。',375,1258,17,'#7a5a3c');}
  txt('v'+BUILD+(Object.keys(IMG_FAIL).length?L(' · 그림 일부 실패: 새로고침',' · 部分图片失败：请刷新'):''),375,1306,17,'#a07a55');
}
function tipOnce(key,s){if(!S.tips[key]){S.tips[key]=1;toast(s);APP.toast.t=4;persist();}}

function drawHeroScr(){
  backdrop(.62);topBar(L('타워','防御塔'),1);
  TOWER_IDS.forEach((id,i)=>{const y=128+i*172,own=!!S.lv[id],lv=S.lv[id]||0,b=TOWERS[id];
    panel(24,y,702,156,own?CREAM:'#e9e2d6',28);g.fillStyle=own?HCOL[id]:'#d6cec0';rr(36,y+12,132,132,22);g.fill();drawImg(HERO_IMG[id],102,y+140,118,{a:own?1:.45});
    txt(LL(HN[id]),186,y+38,34,own?INK:'#8f8475','left');
    if(own){font(34);txt('Lv.'+lv,200+g.measureText(LL(HN[id])).width,y+40,26,RED_D,'left');}
    txtFit(LL(TROLE[id]),186,y+80,21,own?326:500,'#8a6a4a','left');
    if(!own){txt(L('제 ','通关第 ')+UNLOCK[id]+L(' 장을 깨면 합류',' 关后加入'),186,y+122,22,'#8f8475','left');return;}
    txt(L('위력 ','威力 ')+Math.round(heroMul(lv)*100)+'%  ·  '+L('짓는 값 ','造价 ')+b.cost,186,y+122,21,'#3a9478','left');
    if(lv>=MAX_LV)txt('MAX',620,y+78,30,'#d99a1e');
    else{const c=lvCost(lv);btn(524,y+30,186,96,'',()=>{if(S.coins<c){sfx('nope');toast(L('동전이 모자라요','金币不够'));return;}S.coins-=c;S.lv[id]=lv+1;mission('up',1);sfx('up');track('hero_up',{id,lv:lv+1});persist();},{col:S.coins>=c?RED:GREY,dk:S.coins>=c?RED_D:GREY_D,icon:(x,yy)=>{txt(L('숙련 올리기','提升熟练'),x,yy-18,24,'#fff','center',INK);icoCoin(x-36,yy+20,13);txt(c,x+12,yy+21,24,'#fff','center',INK,5);}});}
  });
  txt(L('숙련은 모든 판에서 그 타워의 위력을 올려요 (단계마다 +7%)','熟练度会提升该塔在每一关的威力（每级 +7%）'),375,1190,22,INK);
  txt(L('판 안의 강화(1~3단계·진화)는 그 판의 골드로 해요','关卡内的升级与进阶使用当局金币'),375,1226,21,'#7a5a3c');
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
  if(r.won&&r.stars<3)txt(L('목숨 18 이상으로 막으면 별 3개','剩余生命 18 以上就是 3 星'),375,672,21,'#a07a55');
  if(!r.won)txt(L('타워 숙련을 올리거나, 길이 꺾이는 곳에 지어 봐요','试试提升熟练度，或把塔建在拐弯处'),375,672,23,'#a07a55');
  icoCoin(270,740,30);txt('+'+(r.reward*(r.doubled?2:1)+r.first),400,742,54,INK);
  if(r.first)txt(L('첫 클리어 보너스 +','首次通关奖励 +')+r.first,375,796,22,'#3a9478');
  let y=822;
  if(r.unlock.length){const id=r.unlock[0];g.fillStyle=HCOL[id];rr(110,y,530,84,24);g.fill();g.lineWidth=4;g.strokeStyle=INK;g.stroke();drawImg(HERO_IMG[id],170,y+82,84);txt(L('새 친구 ','新伙伴 ')+r.unlock.map(q=>LL(HN[q])).join('·')+L(' 합류!',' 加入啦！'),400,y+43,30,INK);y+=98;}
  if(!r.doubled&&r.reward>0)btn(150,y,450,76,L('▶ 광고 보고 동전 2배','▶ 看广告金币翻倍'),()=>showAd('double',o=>{if(o){r.doubled=true;S.coins+=r.reward;sfx('reward');persist();}}),{col:YEL,dk:YEL_D,tc:INK,sz:30});
  if(r.won){btn(100,1012,270,76,L('한 번 더','再来一次'),()=>{sfx('btn');startBattle(r.si);},{col:MINT,dk:MINT_D,sz:28});
    btn(390,1012,260,76,r.si<STAGES.length-1?L('다음 장으로','下一关'):L('홈으로','回主页'),()=>{sfx('btn');if(r.si<STAGES.length-1)S.sel=r.si+1;goHome();},{sz:28});
    if(API||(typeof navigator!=='undefined'&&navigator.share))btn(610,226,64,60,'',()=>shareGame(),{col:CREAM,dk:'#d9c8a8',icon:(x,yy)=>{g.strokeStyle=INK;g.lineWidth=5;g.lineCap='round';g.beginPath();g.moveTo(x,yy+12);g.lineTo(x,yy-12);g.moveTo(x-10,yy-3);g.lineTo(x,yy-13);g.lineTo(x+10,yy-3);g.stroke();}});}
  else{btn(100,1012,270,76,L('타워 숙련 올리기','提升熟练度'),()=>{sfx('btn');goHome();scr='heroes';},{col:MINT,dk:MINT_D,sz:28});btn(390,1012,260,76,L('다시 도전','再挑战'),()=>{sfx('btn');startBattle(r.si);},{sz:28});}
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
function botStep(){if(!run||scr!=='battle'||paused||run.phase==='revive'&&!revive(run))return;if(run.phase!=='run'||Math.random()>.2)return;
  const empty=run.spots.map((sp,i)=>i).filter(i=>!run.spots[i].tw),ids=run.owned;
  if(empty.length&&run.spots.length-empty.length<3+run.wave)build(run,empty[Math.floor(Math.random()*empty.length)],ids[Math.floor(Math.random()*ids.length)]);
  else{const up=run.spots.map((sp,i)=>i).filter(i=>run.spots[i].tw&&run.spots[i].tw.lv<4);if(up.length){const i=up[Math.floor(Math.random()*up.length)];upgrade(run,i,BRANCH[run.spots[i].tw.id][Math.floor(Math.random()*2)]);}}
  run.spots.forEach((sp,i)=>{if(sp.tw&&sp.tw.ink>0)cleanInk(run,i);});if(run.ws==='prep'&&run.spots.some(sp=>sp.tw))callWave(run);
  if(run.en.length>6){castTide(run);const e=run.en[0];castBomb(run,e.x,e.y);}}
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
  give:n=>{S.coins+=n;},unlockAll:()=>{TOWER_IDS.forEach(id=>{if(!S.lv[id])S.lv[id]=1;});S.cleared=5;},win:()=>{if(run)finish(run,true);},lose:()=>{if(run){run.lives=0;finish(run,false);}},
  au:()=>({state:AU.c&&AU.c.state,cur:MUS.cur,step:MUS.step,merr:MUS.err||0,mlast:MUS.last||'',serr:AU.err||0,slast:AU.lastErr||''}),sfx,wantMusic,
  scr:()=>scr,ad:()=>adOv,lang:l=>{LANG=l;},draw,core:{step,build,upgrade,sell,callWave,castTide,castBomb,cleanInk,inkTower,spawn,revive}};
requestAnimationFrame(frame);

})();
