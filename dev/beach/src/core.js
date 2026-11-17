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
    sauce:0,sp:0,sn:0,buf:{},picks:null,rerolled:false,hard:!!opt.hard,area:S.area,kinds:opt.sauces||{},lock:0,full:0,casting:false,revives:1,revived:false,kills:0,built:0,ups:0,casts:0,leaked:0,boss:null,bossT:0,surge:0,ended:false,won:false,stars:0,reward:0,next:waveDef(si,1)};
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
  const n=k=>s.buf&&s.buf[k]||0,id=tw.id;                                            // 오늘의 특선 카드
  if(id==='tt')o.shots+=n('bun2');else if(id==='didi'){if(n('frost')){o.slow=Math.min(.85,o.slow+.15*n('frost'));o.slowT+=n('frost');}}
  else if(id==='peng')o.aoe*=1+.3*n('pop');else if(id==='shan'){o.range*=1+.15*n('tea');o.dmg*=1+.25*n('tea');}
  else if(id==='dun')o.cd*=Math.pow(.75,n('skew'));else if(id==='zhuo'){o.aoe*=1+.25*n('sticky');o.slowT+=n('sticky');}
  o.dmg*=1+.15*n('taste');o.range*=1+.08*n('reach');if(tw.od>0)o.cd*=SAUCE.odCd;         // 양념을 뿌린 가게는 잠깐 손이 빨라진다
  return o;}
function towerCost(id){return TOWERS[id].cost;}
function upCost(tw,s){return tw.lv>=4?0:Math.round(TOWERS[tw.id].cost*UP_COST[tw.lv-1]*(s&&s.buf.sale?Math.pow(.85,s.buf.sale):1)/5)*5;}
function build(s,i,id){const sp=s.spots[i],c=towerCost(id);if(!sp||sp.tw||s.phase!=='run'||s.gold<c||!s.owned.includes(id))return false;s.gold-=c;sp.tw={id,lv:1,br:'',spent:c,cd:.3,ink:0,tgt:0,ramp:0,anim:0};s.built++;s.fx.push({e:'build',i,id});return true;}
function upgrade(s,i,br){const sp=s.spots[i],tw=sp&&sp.tw;if(!tw||tw.lv>=4||s.phase!=='run')return false;const c=upCost(tw,s);if(s.gold<c)return false;
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
  const b=ENEMIES[k],hp=(k==='boss'?s.S.bossHp:b.hp*s.cur.hp)*(s.hard?HARD.hp:1),p=s.paths[pi%s.paths.length];
  const e={id:s.uid++,k,bk:k==='boss'?s.S.boss:'',pi:pi%s.paths.length,d:d0||0,x:0,y:0,hp,max:hp,sp:b.sp,r:b.r,armor:b.armor||0,air:!!b.air,gold:b.gold,leak:b.leak||1,
    slow:0,slowT:0,stun:0,kb:0,shred:0,hit:0,rush:false,puffT:0,puffed:false,hideT:0,hideCd:0,fadeT:0,fadeCd:0,leapT:0,leapCd:0,dartT:0,darted:false,shield:0,inkT:(b.ink||0)*TICK*.5,ph:s.rand()*6.28,ox:k==='boss'?0:(s.rand()-.5)*15,oy:k==='boss'?0:(s.rand()-.5)*9,dead:false,len:p.len};
  if(e.air){const a=p.s[0],z=p.s[p.s.length-1];e.ax=a.x+(s.rand()-.5)*120;e.ay=a.y;e.zx=z.x;e.zy=z.y;e.len=Math.hypot(e.zx-e.ax,e.zy-e.ay);}
  if(s.si>=(b.from||0)){if(b.hide)e.hideCd=Math.round((2+s.rand()*2.5)*TICK);if(b.fade)e.fadeCd=Math.round((1.5+s.rand()*3)*TICK);if(b.leap)e.leapCd=Math.round((1.5+s.rand()*2)*TICK);if(b.shield)e.shield=b.shield;e.tr=true;}
  e.guard=s.hard&&(k==='elite'||s.area>=3&&(k==='turtle'||k==='hermit')||s.area>=4&&k==='boss')?1:0;e.dodge=0;e.seal=0;e.blk=-1;
  place(s,e);s.en.push(e);if(k==='boss'){s.boss=e;s.bossT=0;s.fx.push({e:'boss',bk:e.bk});}return e;
}
function place(s,e){if(e.air){const q=Math.min(1,e.d/e.len);e.x=e.ax+(e.zx-e.ax)*q;e.y=e.ay+(e.zy-e.ay)*q;}else{const p=pathPos(s.paths[e.pi],e.d);e.x=p.x+e.ox;e.y=p.y+e.oy;}}

function hurt(s,e,d,cls){
  if(e.dead||e.dodge>0)return;
  if(s.casting&&e.guard>0&&!(e.seal>0)){e.guard--;e.blk=s.t;e.hit=6;s.fx.push({e:'trait',t:'guard',x:e.x,y:e.y});return;}                                  // 매운맛: 특식을 한 번 막는다
  if(e.shield>0&&!(e.seal>0)){e.shield--;e.hit=6;s.fx.push({e:'trait',t:e.shield?'block':'break',x:e.x,y:e.y});return;}                 // 양동이 투구
  const arm=e.puffT>0?.8:e.armor;let res=cls!=='mag'&&arm>=.5&&!(cls==='exp'&&e.k==='hermit');
  if(e.hideT>0){if(cls==='exp'){d*=2;e.hideT=0;e.stun=Math.max(e.stun,.7*TICK);res=false;s.fx.push({e:'trait',t:'pop',x:e.x,y:e.y});}else{d*=.15;res=true;}}   // 껍데기 속
  else if(cls==='exp')d*=e.k==='hermit'?1.5:1-arm;else if(cls==='phy')d*=1-arm;
  if(e.shred>0)d*=1.35;
  e.hp-=d;e.hit=6;s.fx.push({e:'hit',x:e.x,y:e.y,v:d,k:e.k,weak:cls==='exp'&&e.k==='hermit',res});
  if(e.tr&&e.k==='puffer'&&!e.puffed&&e.hp>0&&e.hp<e.max*.75){e.puffed=true;e.puffT=ENEMIES.puffer.puff*TICK;s.fx.push({e:'trait',t:'puff',x:e.x,y:e.y});}
  if(e.k==='shrimp'&&!e.darted&&e.hp>0){e.darted=true;e.dartT=12;s.fx.push({e:'trait',t:'dart',x:e.x,y:e.y});}
  if(e.hp<=0){e.dead=true;s.kills++;let g=e.gold;
    for(const sp of s.spots){const tw=sp.tw;if(tw&&tw.id==='zhuo'&&tw.ink<=0){const st=towerStat(s,tw);if((sp.x-e.x)**2+(sp.y-e.y)**2<st.range*st.range){g+=st.gold;break;}}}
    g+=2*(s.buf.tip||0);gainSauce(s,e.k==='boss'?0:ENEMIES[e.k].cost);s.gold+=g;s.fx.push({e:'die',x:e.x,y:e.y,k:e.k,bk:e.bk,g,air:e.air,pi:e.pi,d:e.d,ox:e.ox,oy:e.oy});}
}
function blast(s,x,y,r,d,cls,kind,eff,air){
  for(const e of s.en){if(e.dead||((e.air||e.leapT>0)&&!air))continue;const q=r+e.r;if((e.x-x)**2+(e.y-y)**2<q*q){hurt(s,e,d,cls);if(eff&&!e.dead&&e.blk!==s.t){if(eff.slow&&e.k!=='boss'){e.slow=Math.max(e.slow,eff.slow);e.slowT=Math.max(e.slowT,eff.slowT*TICK);}if(eff.stun&&e.k!=='boss')e.stun=Math.max(e.stun,eff.stun*TICK);}}}
  s.fx.push({e:'blast',x,y,r,kind});
}
const progress=e=>e.d/e.len;
function pickTarget(s,sp,st,b,skip,strong){
  let best=null,bv=-1;const r2=st.range*st.range;
  for(const e of s.en){if(e.dead||e.fadeT>0||e.dodge>0||((e.air||e.leapT>0)&&!b.air)||(skip&&skip.indexOf(e.id)>=0))continue;if((e.x-sp.x)**2+(e.y-sp.y)**2>r2)continue;const v=strong?e.hp:progress(e);if(v>bv){bv=v;best=e;}}
  return best;
}
function stepTowers(s){
  for(let i=0;i<s.spots.length;i++){const sp=s.spots[i],tw=sp.tw;if(!tw)continue;if(tw.anim>0)tw.anim--;
    if(tw.od>0)tw.od--;if(tw.ink>0){tw.ink--;tw.tgt=0;continue;}
    tw.cd-=1/TICK;if(tw.cd>0)continue;const b=TOWERS[tw.id],st=towerStat(s,tw);
    if(b.beam){ // 등롱 빛줄기: 한 적을 계속 비출수록 세진다
      let t=null;if(tw.tgt)for(const e of s.en)if(e.id===tw.tgt&&!e.dead&&!(e.fadeT>0)&&(e.x-sp.x)**2+(e.y-sp.y)**2<=st.range*st.range){t=e;break;}
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
  if(s.zones.length){for(const z of s.zones){z.t--;if(z.salt){for(const e of s.en)if(!e.dead&&!e.air&&(e.x-z.x)**2+(e.y-z.y)**2<(z.r+e.r)**2){e.slow=Math.max(e.slow,e.k==='boss'?.5:.92);e.slowT=Math.max(e.slowT,8);}}
    else if(z.t%15===0)for(const e of s.en)if(!e.dead&&(e.x-z.x)**2+(e.y-z.y)**2<(z.r+e.r)**2)hurt(s,e,z.dps*.25,'exp');}s.zones=s.zones.filter(z=>z.t>0);}
}
function inkTower(s,x,y,n){const c=s.spots.map((sp,i)=>({i,sp,d:(sp.x-x)**2+(sp.y-y)**2})).filter(o=>o.sp.tw&&o.sp.tw.ink<=0&&o.d<150*150).sort((a,b)=>a.d-b.d);for(let k=0;k<n&&k<c.length;k++){c[k].sp.tw.ink=5*TICK;s.fx.push({e:'ink',i:c[k].i,x,y});}return c.length>0;}
function stepEnemies(s){
  const surge=s.surge>0;if(surge)s.surge--;
  for(const e of s.en){if(e.dead)continue;if(e.hit>0)e.hit--;if(e.shred>0)e.shred--;if(e.slowT>0){if(--e.slowT<=0)e.slow=0;}
    if(e.kb>0){const m=Math.min(e.kb,e.kb>120?9:5);e.d=Math.max(0,e.d-m);e.kb-=m;place(s,e);if(e.stun>0)e.stun--;continue;}   // 파도에 떠밀려 가는 중
    if(e.dodge>0)e.dodge--;if(e.stun>0){e.stun--;continue;}
    if(e.seal>0){e.seal--;e.hideT=0;e.fadeT=0;e.leapT=0;}const sealed=e.seal>0;
    if(e.puffT>0)e.puffT--;if(e.dartT>0)e.dartT--;
    if(e.hideT>0){e.hideT--;continue;}                                                                                   // 껍데기 속에서는 안 움직인다
    if(!sealed&&e.hideCd>0&&--e.hideCd<=0){e.hideCd=Math.round(ENEMIES.hermit.hide*TICK);e.hideT=Math.round(1.6*TICK);s.fx.push({e:'trait',t:'hide',x:e.x,y:e.y});continue;}
    if(e.fadeT>0)e.fadeT--;else if(!sealed&&e.fadeCd>0&&--e.fadeCd<=0){e.fadeCd=Math.round(ENEMIES.jelly.fade*TICK);e.fadeT=78;s.fx.push({e:'trait',t:'fade',x:e.x,y:e.y});}
    if(e.leapT>0)e.leapT--;else if(!sealed&&e.leapCd>0&&--e.leapCd<=0){e.leapCd=Math.round(ENEMIES.fish.leap*TICK);if(e.slow<=0){e.leapT=26;s.fx.push({e:'trait',t:'leap',x:e.x,y:e.y});}}
    if(e.k==='turtle'&&!e.rush&&e.hp<e.max*.5){e.rush=true;s.fx.push({e:'trait',t:'rush',x:e.x,y:e.y});}
    e.d+=e.sp/TICK*(1-e.slow)*(surge&&e.k!=='boss'?1.7:1)*(e.rush?ENEMIES.turtle.rush:1)*(e.leapT>0?2.4:1)*(e.dartT>0?3.5:1)*(e.puffT>0?.6:1);place(s,e);
    if(e.k==='octo'&&--e.inkT<=0){e.inkT=ENEMIES.octo.ink*TICK;if(inkTower(s,e.x,e.y,1))s.fx.push({e:'spit',x:e.x,y:e.y});}
    if(e.d>=e.len){e.dead=true;s.lives=Math.max(0,s.lives-e.leak);s.leaked+=e.leak;s.fx.push({e:'leak',x:e.x,y:e.y,n:e.leak,k:e.k});
      if(s.lives<=0&&s.phase==='run'){if(s.revives>0)s.phase='revive';else finish(s,false);s.fx.push({e:'down'});}}
  }
  if(s.boss&&!s.boss.dead&&s.boss.stun<=0&&++s.bossT>=8*TICK){s.bossT=0;const b=s.boss;
    if(b.bk==='kingcrab'){for(let i=0;i<3;i++){const m=spawn(s,'crab',b.pi,Math.max(0,b.d-12-i*14));m.hp=m.max=m.max*.7;}}
    else if(b.bk==='octoboss'){inkTower(s,b.x,b.y,3);for(let i=0;i<4;i++)spawn(s,'jelly',b.pi,Math.max(0,b.d-10-i*10));}
    else if(b.bk==='dragon'){s.surge=2*TICK;inkTower(s,b.x,b.y,2);for(let i=0;i<2;i++){spawn(s,'shrimp',i,0);spawn(s,'crab',b.pi,Math.max(0,b.d-14-i*14));}}
    else if(b.bk==='pirate'){for(let i=0;i<2;i++){spawn(s,'turtle',b.pi,Math.max(0,b.d-14-i*18));spawn(s,'gull',i,0);}}
    else{s.surge=3*TICK;for(let i=0;i<3;i++)spawn(s,'fish',i,0);}
    if(s.hard&&s.area>=4)b.guard=1;s.fx.push({e:'summon',x:b.x,y:b.y,bk:b.bk});}
  s.en=s.en.filter(e=>!e.dead);
}
function stepWave(s){
  if(s.ws==='prep')return;
  if(s.ws==='gap'){if(--s.gapT<=0)callWave(s);return;}
  while(s.queue.length&&s.queue[0].at<=s.t){const q=s.queue.shift();spawn(s,q.k,q.path);}
  if(s.queue.length||s.en.length)return;
  if(s.wave>=s.S.waves){finish(s,true);return;}
  s.gold+=s.cur.bonus;s.fx.push({e:'waveClear',g:s.cur.bonus,w:s.wave});s.ws='gap';s.gapT=WAVE_GAP*TICK;
  if(CARD_AT(s.wave)&&s.wave<s.S.waves){s.picks=drawCards(s);s.rerolled=false;s.phase='pick';s.fx.push({e:'pick'});}
}
function finish(s,won){
  if(s.ended)return;s.ended=true;s.won=won;s.phase=won?'win':'lose';
  s.stars=won?(s.revived?Math.min(2,s.lives>=10?2:1):s.lives>=18?3:s.lives>=10?2:1):0;
  const base=REWARD.base*(1+REWARD.stage*s.si)*(s.hard?HARD.reward:1);s.reward=Math.round(won?base*REWARD.star[s.stars]:base*REWARD.lose*Math.max(0,s.wave-1)/s.S.waves+5);
  s.fx.push({e:won?'win':'lose'});
}
function step(s){
  if(s.ended||s.phase!=='run')return;s.t++;
  if(s.lock>0)s.lock--;
  if(s.hard&&s.area>=1&&s.lock<=0){if(s.sauce>=SAUCE.max&&s.en.some(e=>e.k==='octo'||e.bk==='octoboss')){s.full++;if(s.full===Math.round((HARD.jamAfter-3)*TICK))s.fx.push({e:'jamWarn'});if(s.full>=HARD.jamAfter*TICK){s.full=0;s.lock=HARD.jam*TICK;s.fx.push({e:'jam'});}}else s.full=0;}   // 매운맛: 문어가 꽉 찬 양념통을 노린다
  stepWave(s);if(s.phase!=='run')return;stepTowers(s);stepProjectiles(s);stepEnemies(s);
}
/* 프레임 시간을 틱으로 바꾼다 */
function advance(s,dt){s.acc+=Math.min(dt,.25);let n=0;while(s.acc>=1/TICK-1e-9&&n<16){s.acc-=1/TICK;step(s);n++;}return n;}

/* ---------- 비법 양념: 가게마다 다른 특식 ---------- */
function sauceNeed(s){return s.sn===0?SAUCE.first:Math.min(SAUCE.cap,SAUCE.need+SAUCE.grow*(s.sn-1));}
function gainSauce(s,v){if(s.sauce>=SAUCE.max||v<=0)return;s.sp+=v*(1+.25*(s.buf.sauce||0));const n=sauceNeed(s);if(s.sp>=n){s.sp-=n;s.sn++;s.sauce++;if(s.sauce>=SAUCE.max)s.sp=0;s.fx.push({e:'sauceUp'});}}
function castSauce(s,i,kind){
  const sp=s.spots[i],tw=sp&&sp.tw;if(!tw||s.phase!=='run'||s.sauce<1||s.ws==='prep'||s.lock>0||(kind==='soy'&&!s.kinds.soy))return false;
  s.sauce--;s.full=0;s.casts++;tw.ink=0;tw.od=SAUCE.od*TICK;tw.cd=0;const st=towerStat(s,tw),R=st.range*1.6,id=tw.id,inR=e=>!e.dead&&(e.x-sp.x)**2+(e.y-sp.y)**2<R*R,front=(a,b)=>progress(b)-progress(a);
  s.fx.push({e:'sauce',i,id,r:R,soy:kind==='soy'});
  if(kind==='soy'){for(const e of s.en)if(!e.dead&&(e.x-sp.x)**2+(e.y-sp.y)**2<R*R*1.7)e.seal=HARD.seal*TICK;}                  // 먹물 간장: 눈을 가려 특기도 대응도 못 하게
  else if(s.hard&&s.area>=2)for(const e of s.en)if(e.k==='gull'&&!e.dead&&!(e.seal>0)&&(e.x-sp.x)**2+(e.y-sp.y)**2<R*R*1.7){e.dodge=Math.round(HARD.dodge*TICK);s.fx.push({e:'trait',t:'dodge',x:e.x,y:e.y});}   // 매운맛: 갈매기가 솟아올라 피한다
  s.casting=true;
  if(id==='tt'){for(const e of s.en.filter(e=>inR(e)&&!e.air).sort(front).slice(0,6))blast(s,e.x,e.y,st.aoe,st.dmg*2.5,'exp','bun',{stun:1},false);}            // 만두 비: 앞선 손님 6명 머리 위로
  else if(id==='didi'){for(const e of s.en.slice())if(inR(e)){hurt(s,e,st.dmg*8,'mag');if(!e.dead&&e.blk!==s.t){e.stun=Math.max(e.stun,(e.k==='boss'?1:2.5)*TICK);e.slow=Math.max(e.slow,.5);e.slowT=Math.max(e.slowT,5*TICK);}}s.fx.push({e:'freeze',x:sp.x,y:sp.y,r:R});}   // 눈보라: 둘레를 꽁꽁
  else if(id==='peng'){for(const e of s.en.filter(inR).sort(front).slice(0,6))blast(s,e.x,e.y,st.aoe,st.dmg*2,'exp','fw',null,true);}                       // 팝콘 불꽃놀이: 하늘 손님까지
  else if(id==='shan'){for(const e of s.en.slice()){if(e.dead)continue;e.shred=Math.max(e.shred,6*TICK);e.fadeT=0;if(inR(e))hurt(s,e,st.dmg*12,'mag');}s.fx.push({e:'aroma'});}   // 차 향기: 모든 손님이 6초 동안 뭐든 잘 먹고, 숨은 손님도 드러남
  else if(id==='dun'){for(const e of s.en.filter(e=>!e.dead).sort((a,b)=>b.hp-a.hp).slice(0,3)){s.fx.push({e:'skewer',i,x:e.x,y:e.y});hurt(s,e,st.dmg*5*(st.big&&(e.k==='boss'||e.k==='elite')?st.big:1),'mag');}}   // 왕꼬치: 어디에 있든 가장 배고픈 3명
  else if(id==='zhuo'){let n=0;for(const e of s.en.slice())if(inR(e)&&!e.air){hurt(s,e,st.dmg*8,'mag');n++;if(!e.dead&&e.k!=='boss'&&e.blk!==s.t){e.slow=Math.max(e.slow,.8);e.slowT=Math.max(e.slowT,4*TICK);}}if(n){s.gold+=n*3;s.fx.push({e:'bonus',g:n*3});}s.fx.push({e:'goo',x:sp.x,y:sp.y,r:R});}   // 찹쌀떡 잔치: 끈적끈적 + 팁
  s.casting=false;return true;}
/* 굵은소금: 길 위에 뿌리면 그 자리의 손님이 목말라 멈춘다. 먹이는 게 아니라서 막거나 피할 수 없다 */
function castSalt(s,x,y){if(s.phase!=='run'||s.sauce<1||s.ws==='prep'||s.lock>0||!s.kinds.salt)return false;s.sauce--;s.full=0;s.casts++;s.zones.push({salt:true,x,y,r:HARD.saltR,t:Math.round(HARD.salt*TICK)});s.fx.push({e:'salt',x,y,r:HARD.saltR});return true;}
function wipeJar(s){if(s.lock<=0)return false;s.lock=Math.max(0,s.lock-2.5*TICK);s.fx.push({e:'jamWipe'});return true;}
/* ---------- 오늘의 특선 ---------- */
function drawCards(s){const pool=Object.keys(CARDS).filter(k=>(!CARDS[k].only||s.owned.includes(CARDS[k].only))&&!(k==='sale'&&(s.buf.sale||0)>=3)),out=[];while(out.length<3&&pool.length)out.push(pool.splice(Math.floor(s.rand()*pool.length),1)[0]);return out;}
function pickCard(s,k){if(s.phase!=='pick'||!s.picks||!s.picks[k])return false;const c=s.picks[k];s.buf[c]=(s.buf[c]||0)+1;let g=0;
  if(c==='coin'){g=120+25*s.wave;s.gold+=g;}else if(c==='life')s.lives+=3;else if(c==='sauce'&&s.sauce<SAUCE.max)s.sauce++;
  s.picks=null;s.phase='run';s.fx.push({e:'card',c,g});return true;}
function rerollCards(s){if(s.phase!=='pick'||s.rerolled)return false;s.rerolled=true;s.picks=drawCards(s);return true;}
function revive(s){if(s.phase!=='revive'||s.revives<=0)return false;s.revives--;s.revived=true;s.lives=REVIVE_LIVES;s.phase='run';for(const e of s.en)if(!e.air&&e.k!=='boss')e.kb=200;s.fx.push({e:'revive'});return true;}
function giveUp(s){if(!s.ended)finish(s,false);}

if(typeof module!=='undefined')module.exports={newGame,step,advance,build,upgrade,sell,callWave,castSauce,castSalt,wipeJar,pickCard,rerollCards,SAUCE,CARDS,HARD,cleanInk,revive,giveUp,towerStat,upCost,towerCost,stageGeo,waveDef,STAGES,TOWERS,TOWER_IDS,BRANCH,UNLOCK};
