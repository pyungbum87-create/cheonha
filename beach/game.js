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
const UNLOCK={shan:2,dun:5,zhuo:9};                // 몇 장을 깨면 합류하는가
const MAX_LV=40;
const heroMul=lv=>1+.07*(lv-1);                    // 판 밖에서 동전으로 올리는 타워 숙련
const lvCost=lv=>30*lv;                           // 6종을 권장 숙련까지 올리는 값 ≈ 첫 클리어 수입의 1.0배(10판)~1.6배(50판). 모자란 만큼은 방치 수익·미션·광고 2배·다시 깨기로 채운다

/* 손님마다 그 생물다운 특기가 하나씩 있다. from = 몇 번째 장(0부터)부터 특기를 쓰는가 (첫 장은 특기 없이 배운다) */
const ENEMIES={
  crab:  {hp:30,  sp:34,r:13,gold:5, cost:1},
  jelly: {hp:13,  sp:40,r:11,gold:3, cost:.5, fade:4.5,from:4},              // 투명해져서 한 명씩 노리는 가게가 못 봄 (범위 간식은 닿음)
  fish:  {hp:22,  sp:76,r:11,gold:4, cost:.9, leap:3.5,from:2},              // 물 위로 뛰어올라 땅 간식을 넘어감 (느려지면 못 뜀)
  puffer:{hp:85,  sp:26,r:13,gold:13,cost:2.6,armor:.3,puff:3,from:3},       // 놀라면 부풀어 3초 동안 편식이 심해짐
  hermit:{hp:150, sp:20,r:14,gold:20,cost:4,  armor:.5,hide:5,from:6},       // 껍데기에 숨음 (팝콘·만두 냄새에 깜짝 놀라 튀어나옴)
  octo:  {hp:105, sp:28,r:14,gold:16,cost:3.2,ink:6},                        // 가게에 먹물
  gull:  {hp:42,  sp:58,r:12,gold:12,cost:2.4,air:true,leak:2},              // 길을 무시하고 날아와 간식 2개를 낚아챔
  turtle:{hp:240, sp:19,r:14,gold:26,cost:5.2,armor:.4,rush:1.9},            // 반쯤 배가 차면 신나서 달림
  shrimp:{hp:16,  sp:60,r:10,gold:3, cost:.7, dart:1},                       // 처음 간식에 맞으면 깜짝 놀라 앞으로 톡 튐
  elite: {hp:430, sp:22,r:19,gold:50,cost:11, armor:.3,leak:3,shield:6,from:7}, // 양동이 투구가 간식 6개를 튕겨 냄
  boss:  {hp:2400,sp:13,r:30,gold:120,cost:0, armor:.2,leak:20},
};
const START_LIVES=20,WAVE_GAP=6,BONUS_PER_SEC=3,REVIVE_LIVES=10;
/* 비법 양념: 손님을 배불릴수록(손님 값만큼) 차고, 가게에 뿌리면 그 가게의 특식이 터진다. 최대 2통. need = 통마다 필요한 양 */
const SAUCE={max:2,first:8,need:16,grow:5,cap:46,od:5,odCd:.4};
/* 오늘의 특선: 파도 2·5·8·11 을 넘기면 카드 3장 중 하나. only = 그 가게를 가지고 있을 때만 나온다. 같은 카드는 겹쳐서 세진다 */
const CARDS={bun2:{only:'tt'},frost:{only:'didi'},pop:{only:'peng'},tea:{only:'shan'},skew:{only:'dun'},sticky:{only:'zhuo'},taste:{},reach:{},tip:{},coin:{},life:{},sauce:{},sale:{}};
const CARD_AT=w=>w%3===2;
/* 매운맛: 구역 보스를 배불리면 그 구역을 다시 도는 어려운 판이 열린다. 손님이 양념 특식에 대응한다(구역마다 하나씩 늘어남)
   1구역 양동이 꽃게가 특식을 한 번 막음 · 2구역 문어가 꽉 찬 양념통에 먹물 · 3구역 갈매기가 솟아올라 피함 · 4구역 거북·소라게도 막음 · 5구역 보스도 막음
   매운맛 보스를 배불리면 새 양념: 1구역 굵은소금(길에 뿌려 손님을 세움), 2구역 먹물 간장(눈을 가려 6초 동안 특기·대응 봉인) */
const HARD={hp:1.45,lv:4,reward:1.6,jamAfter:7,jam:8,dodge:1.6,seal:6,salt:3.2,saltR:52};
const SAUCE_AT={salt:0,soy:1};

/* ---------- 스테이지: 5개 구역 × 10판 = 50판을 규칙으로 만든다. 판을 더 늘리려면 AREAS 에 구역을 더하거나 PER_AREA 를 올리면 된다 ----------
   길 모양 10종(LAYOUTS)을 좌우로 뒤집어 20종으로 쓰고, 손님은 판이 갈수록 한 종씩 늘어난다. 5번째 판은 양동이 꽃게 떼, 10번째 판은 구역 보스 */
const LAYOUTS=[
  [[[225,66],[225,150],[110,215],[110,335],[340,395],[340,515],[150,575],[150,655],[225,GATE_Y]]],
  [[[90,66],[90,200],[360,265],[360,400],[90,465],[90,600],[225,650],[225,GATE_Y]]],
  [[[110,66],[110,215],[225,325],[225,430],[100,500],[100,615],[225,665],[225,GATE_Y]],[[340,66],[340,215],[225,325],[225,430],[100,500],[100,615],[225,665],[225,GATE_Y]]],
  [[[225,66],[70,135],[70,300],[385,300],[385,470],[160,470],[160,600],[330,640],[225,GATE_Y]]],
  [[[80,66],[80,250],[370,350],[370,560],[225,640],[225,GATE_Y]],[[370,66],[370,200],[80,400],[80,580],[225,640],[225,GATE_Y]]],
  [[[360,66],[360,180],[90,180],[90,330],[360,330],[360,480],[90,480],[90,620],[225,660],[225,GATE_Y]]],
  [[[60,66],[60,300],[200,380],[200,520],[225,620],[225,GATE_Y]],[[390,66],[390,300],[250,380],[250,520],[225,620],[225,GATE_Y]]],
  [[[100,66],[100,170],[380,170],[380,290],[70,290],[70,410],[380,410],[380,540],[150,560],[150,650],[225,GATE_Y]]],
  [[[70,66],[70,260],[225,360],[225,470],[110,540],[110,640],[225,675],[225,GATE_Y]],[[225,66],[225,360],[225,470],[110,540],[110,640],[225,675],[225,GATE_Y]],[[380,66],[380,260],[225,360],[225,470],[110,540],[110,640],[225,675],[225,GATE_Y]]],
  [[[90,66],[90,180],[360,260],[360,380],[90,460],[90,580],[225,650],[225,GATE_Y]],[[360,66],[360,180],[90,260],[90,380],[360,460],[360,580],[225,650],[225,GATE_Y]]]
];
const AREAS=[{boss:'kingcrab'},{boss:'octoboss'},{boss:'whale'},{boss:'pirate'},{boss:'dragon'}],PER_AREA=10;
const KIND_AT={crab:0,jelly:0,fish:1,puffer:3,hermit:6,gull:9,octo:12,turtle:17,shrimp:22};      // 몇 번째 판(0부터)에 처음 나오는가
const recLv=i=>1+Math.round(i*.75);
function genStage(i){
  const a=Math.floor(i/PER_AREA),n=i%PER_AREA,L=LAYOUTS[(i*3+a)%LAYOUTS.length],mir=i%2===1,rec=recLv(i);
  const paths=L.map(p=>p.map(q=>[mir?W-q[0]:q[0],q[1]]));
  const U=Object.keys(KIND_AT).filter(k=>KIND_AT[k]<=i),pick=U.slice(-6).sort((x,y)=>(x==='gull'?9:ENEMIES[x].cost)-(y==='gull'?9:ENEMIES[y].cost)),fresh=pick.find(k=>KIND_AT[k]===i&&i>0);
  if(fresh){pick.splice(pick.indexOf(fresh),1);pick.splice(2,0,fresh);}   // 새 손님은 2번째 파도부터 얼굴을 비춘다
  const hp=1.2*heroMul(rec)*(paths.length>1?.86:1)*(1+n*.012)*(1+a*.09);
  return {i,area:a,n,theme:a%5,paths,kinds:pick,waves:8+Math.min(5,Math.floor(n/2)+Math.min(2,a)),hp,budget:10+Math.min(8,i*.42),gold:230+Math.min(340,i*12),spots:8+Math.min(4,Math.floor(n/3)+Math.min(2,a)),
    rec,boss:n===PER_AREA-1?AREAS[a].boss:'',bossHp:Math.round(3000*hp*(1+a*.35)),mid:n===4};
}
const STAGES=[];for(let i=0;i<AREAS.length*PER_AREA;i++)STAGES.push(genStage(i));
/* 파도 내용: 장마다 정해진 규칙으로 만든다(무작위 아님). 뒤로 갈수록 예산이 늘고 새 적이 섞인다 */
function waveDef(si,w){
  const S=STAGES[si],last=w===S.waves,budget=S.budget*(1+.34*(w-1)),ks=S.kinds.slice(0,Math.min(S.kinds.length,1+Math.ceil(w*.7))),groups=[];
  const n=w<3?1:w<6?2:3;
  for(let i=0;i<n;i++){const k=ks[(w*2+i*3+si)%ks.length],E=ENEMIES[k],cnt=Math.max(1,Math.round(budget/n/E.cost));
    groups.push({k,n:cnt,gap:k==='jelly'?.35:k==='fish'?.55:E.cost>2.5?1.6:.8,delay:i*3.2,path:(w+i)%S.paths.length});}
  if(w%4===0&&!last&&S.i>=3)groups.push({k:'elite',n:1+Math.floor(w/8),gap:3,delay:2,path:w%S.paths.length});
  if(last&&S.boss)groups.push({k:'boss',n:1,gap:1,delay:4,path:0});
  if(last&&!S.boss)groups.push({k:'elite',n:S.mid?3:1,gap:2.5,delay:3,path:0});
  return {w,groups,hp:S.hp*(1+.15*(w-1)),bonus:18+3*w};
}
const firstBonus=i=>100+i*25+(i%PER_AREA===PER_AREA-1?300:0);
const REWARD={base:120,stage:.25,star:[0,.7,.85,1],lose:.25};

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

/* ============================== 플랫폼 층: 화면·터치·저장·소리·광고·통계는 여기에만 둔다 ==============================
   위챗(wx)·더우인(tt)으로 옮길 때 이 파일만 손보면 된다. */
const BUILD='1117-1752';
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
const DEF={v:1,coins:0,lv:{tt:1,didi:1,peng:1},team:['tt','didi','peng'],stars:[0,0,0,0,0],hstars:[0],sauces:{},cleared:0,sel:0,opt:{bgm:1,sfx:1,vib:1,shake:1,fast:0},lang:'',tips:{},
  day:'',mis:[],login:{n:0,last:''},idleAt:0,chest:0,box:{day:'',n:0},stat:{runs:0,wins:0,kills:0}};
function lsGet(k){try{return API?API.getStorageSync(k):localStorage.getItem(k);}catch(e){return null;}}
function lsSet(k,v){try{if(API)API.setStorageSync(k,v);else localStorage.setItem(k,v);}catch(e){}}
function loadSave(){let o=null;try{o=JSON.parse(lsGet(SAVE_KEY)||'null');}catch(e){}const s=JSON.parse(JSON.stringify(DEF));
  if(o&&typeof o==='object')for(const k in s){const v=o[k];if(v===undefined||v===null||typeof v!==typeof s[k]||Array.isArray(v)!==Array.isArray(s[k]))continue;if(typeof v==='object'&&!Array.isArray(v))Object.assign(s[k],v);else s[k]=v;}
  if(!s.idleAt)s.idleAt=Date.now();s.team=s.team.filter(id=>s.lv[id]).slice(0,5);if(!s.team.length)s.team=['tt'];while(s.stars.length<STAGES.length)s.stars.push(0);while(s.hstars.length<STAGES.length)s.hstars.push(0);return s;}
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
const MUST=['tuantuan','tt_cheer','didi','pengpeng','gift','bg_1','ic_spot','ic_gate','ic_bun','ic_coin','ic_star','tw_tt_1','tw_didi_1','tw_peng_1','en_crab','en_jelly','en_elite'],LATER=['shanshan','dundun','zhuozhuo','didi_sick'];
const ART=["bg_1", "bg_2", "bg_3", "bg_4", "bg_5", "boss_dragon", "boss_kingcrab", "boss_octoboss", "boss_pirate", "boss_whale", "didi", "didi_sick", "dundun", "en_crab", "en_crab_full", "en_elite", "en_elite_full", "en_fish", "en_fish_full", "en_gull", "en_gull_full", "en_hermit", "en_hermit_full", "en_jelly", "en_jelly_full", "en_octo", "en_octo_full", "en_puffer", "en_puffer_full", "en_shrimp", "en_shrimp_full", "en_turtle", "en_turtle_full", "gift", "ic_bun", "ic_coin", "ic_gate", "ic_sauce", "ic_spot", "ic_star", "pengpeng", "shanshan", "tt_cheer", "tuantuan", "tw_didi_1", "tw_didi_2", "tw_didi_3", "tw_didi_ice", "tw_didi_jet", "tw_dun_1", "tw_dun_2", "tw_dun_3", "tw_dun_double", "tw_dun_smash", "tw_peng_1", "tw_peng_2", "tw_peng_3", "tw_peng_dragon", "tw_peng_star", "tw_shan_1", "tw_shan_2", "tw_shan_3", "tw_shan_moon", "tw_shan_rainbow", "tw_tt_1", "tw_tt_2", "tw_tt_3", "tw_tt_king", "tw_tt_twin", "tw_zhuo_1", "tw_zhuo_2", "tw_zhuo_3", "tw_zhuo_express", "tw_zhuo_parcel", "zhuozhuo"];   // art/ 에 넣어 둔 그림 목록(빌드가 채움). 받은 그림은 이름만 맞추면 코드 그림 대신 쓰인다
/* 나머지 그림은 급한 순서로 4장씩 줄 세워 받는다: 아이콘 → 1단계 가게 → 손님 → 키운 가게 → 보스·배부른 모습 → 다른 구역 배경 */
const artRank=n=>/^ic_/.test(n)?0:/^tw_.*_1$/.test(n)?1:/^en_(?!.*_full)/.test(n)?2:/^tw_.*_[23]$/.test(n)?3:/^tw_/.test(n)?4:/^boss_/.test(n)?5:/^en_/.test(n)?6:7;
const OPT=ART.filter(n=>/^(tw|en|boss|bg|ic|st)_/.test(n)&&MUST.indexOf(n)<0).sort((a,b)=>artRank(a)-artRank(b));
const REQ={};let optQ=[],optBusy=0;
function optPump(){while(optBusy<4&&optQ.length){const n=optQ.shift();if(REQ[n])continue;optBusy++;loadImg(n,0,()=>{optBusy--;optPump();});}}
function needImg(n){if(!REQ[n]&&ART.indexOf(n)>=0)loadImg(n);}   // 지금 당장 필요한 그림(들어가는 구역의 배경 등)은 줄을 건너뛴다
const HERO_IMG={tt:'tuantuan',didi:'didi',peng:'pengpeng',shan:'shanshan',dun:'dundun',zhuo:'zhuozhuo'};
function loadImg(n,tries,done){tries=tries||0;REQ[n]=1;const im=API?API.createImage():new Image();
  im.onload=()=>{IMG[n]=im;delete IMG_FAIL[n];onImg(n);done&&done();};
  im.onerror=()=>{if(tries<8)setTimeout(()=>loadImg(n,tries+1,done),500+tries*400);else{IMG_FAIL[n]=1;done&&done();}};
  im.src='art/'+n+'.webp'+(API?'':'?v='+BUILD+(tries?'&r='+tries:''));}

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
const SFX_GAP={block:.07,fade:.3,leap:.12,hide:.2,puff:.2,s_tt:.06,s_didi:.05,s_peng:.08,s_shan:.14,s_dun:.06,s_zhuo:.08,hit:.045,kill:.04,ex_bun:.07,ex_fw:.08,splash:.07,gold:.06,leak:.12};
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
  case 'puff':tone('sine',220,t,.22,.1,560);nz(t,.18,.03,1800,'bandpass',.8);break;
  case 'hide':tone('sine',420,t,.06,.1,260);nz(t,.03,.04,1500,'bandpass',1.5);break;
  case 'fade':tone('triangle',1500*r,t,.3,.03,2400);tone('sine',2000,t+.05,.25,.02,3000);break;
  case 'leap':nz(t,.1,.05,1200,'bandpass',.8,null,3200);tone('sine',500,t,.1,.04,1000);break;
  case 'block':tone('triangle',1250*r,t,.07,.08,820);nz(t,.03,.05,5000,'highpass');break;
  case 'break':tone('triangle',900,t,.12,.12,420);nz(t,.1,.07,3000,'bandpass',.8);bell(84,t+.05,.07,.3);break;
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
function shareGame(){track('share');const title=L('퇀퇀 해변 야시장: 배고픈 바다 손님을 배불려 돌려보내요!','团团海滩夜市：把馋嘴小海怪喂饱送回家！');
  try{if(API&&API.shareAppMessage)API.shareAppMessage({title});else if(navigator.share)navigator.share({title,url:location.href.split('?')[0]}).catch(()=>{});else toast(L('주소를 복사해 친구에게 보내 주세요','复制网址发给朋友吧'));}catch(e){}}
if(API){try{API.showShareMenu&&API.showShareMenu({});API.onShareAppMessage&&API.onShareAppMessage(()=>({title:L('퇀퇀 해변 야시장','团团海滩夜市')}));}catch(e){}}

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
function icoImg(n,x,y,r){const im=IMG[n];if(!im)return false;const h=r*2.3,w=h*im.width/im.height;g.drawImage(im,x-w/2,y-h/2,w,h);return true;}
function icoCoin(x,y,r){if(icoImg('ic_coin',x,y,r))return;g.fillStyle='#e8a520';circ(x,y+r*.12,r);g.fill();g.fillStyle=YEL;circ(x,y,r);g.fill();g.lineWidth=Math.max(2,r*.16);g.strokeStyle=INK;g.stroke();g.strokeStyle='#fff3c4';g.lineWidth=Math.max(2,r*.14);g.beginPath();g.arc(x,y,r*.55,3.6,5.2);g.stroke();}
function icoStar(x,y,r,on){if(on&&icoImg('ic_star',x,y,r*1.05))return;g.beginPath();for(let i=0;i<10;i++){const a=-1.5708+i*.6283,q=i%2?r*.48:r;g.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q);}g.closePath();g.fillStyle=on?YEL:'#e4d8c4';g.fill();g.lineWidth=Math.max(3,r*.16);g.lineJoin='round';g.strokeStyle=INK;g.stroke();}
function icoCastle(x,y,s){g.fillStyle='#f3c97a';g.strokeStyle=INK;g.lineWidth=4;g.lineJoin='round';g.beginPath();g.moveTo(x-s,y+s);g.lineTo(x-s,y-s*.3);g.lineTo(x-s*.55,y-s*.3);g.lineTo(x-s*.55,y-s*.8);g.lineTo(x-s*.2,y-s*.8);g.lineTo(x-s*.2,y-s*.3);g.lineTo(x+s*.2,y-s*.3);g.lineTo(x+s*.2,y-s*.8);g.lineTo(x+s*.55,y-s*.8);g.lineTo(x+s*.55,y-s*.3);g.lineTo(x+s,y-s*.3);g.lineTo(x+s,y+s);g.closePath();g.fill();g.stroke();}
function icoHand(x,y,t,sc){const b=Math.sin(t*6)*8*(sc||1);g.save();g.translate(x,y+b);g.scale(sc||1,sc||1);g.rotate(-.35);g.fillStyle='#fff';g.strokeStyle=INK;g.lineWidth=5;rr(-13,-50,26,58,13);g.fill();g.stroke();rr(-28,-6,56,52,22);g.fill();g.stroke();g.restore();}

function icoBun(x,y,r){if(icoImg('ic_bun',x,y+r*.05,r*1.05))return;g.fillStyle='#fff';g.strokeStyle=INK;g.lineWidth=Math.max(2.5,r*.17);g.lineJoin='round';g.beginPath();g.ellipse(x,y+r*.1,r,r*.86,0,0,6.2832);g.fill();g.stroke();g.lineWidth=Math.max(2,r*.12);g.lineCap='round';for(const d of [-.5,0,.5]){g.beginPath();g.moveTo(x+d*r,y-r*.25);g.quadraticCurveTo(x+d*r*.5,y-r*.6,x,y-r*.72);g.stroke();}}
/* ---------- 간식 가게: 그림(tw_*.webp)이 오기 전까지 쓰는 코드 그림. 발 디딘 곳이 (0,0), 위로 46 ---------- */
function awning(c1){g.strokeStyle=INK;g.lineWidth=1.6;g.beginPath();g.moveTo(-19,0);g.lineTo(-19,-36);g.moveTo(19,0);g.lineTo(19,-36);g.stroke();
  for(let i=0;i<6;i++){g.fillStyle=i%2?'#fff':c1;g.beginPath();g.moveTo(-24+i*8,-47);g.lineTo(-16+i*8,-47);g.lineTo(-16+i*8,-37);g.quadraticCurveTo(-20+i*8,-32,-24+i*8,-37);g.closePath();g.fill();g.stroke();}}
function counter(col){g.fillStyle=col||'#c98f52';g.strokeStyle=INK;g.lineWidth=1.8;rr(-18,-15,36,15,3);g.fill();g.stroke();g.strokeStyle='rgba(90,54,32,.35)';g.lineWidth=1;g.beginPath();g.moveTo(-17,-7.5);g.lineTo(17,-7.5);g.stroke();}
const STALL={
  tt:(t,a)=>{awning('#f0604a');g.strokeStyle=INK;g.lineWidth=1.8;for(const yy of [0,-11]){g.fillStyle='#e9c07a';rr(-15,yy-12,30,12,4);g.fill();g.stroke();g.strokeStyle='#b98346';g.lineWidth=1.2;g.beginPath();g.moveTo(-15,yy-6);g.lineTo(15,yy-6);g.stroke();g.strokeStyle=INK;g.lineWidth=1.8;}
    g.fillStyle='#fff';for(const dx of [-7,0,7]){circ(dx,-25,4.6);g.fill();g.stroke();}g.fillStyle='#d9a85c';g.beginPath();g.ellipse(a*6,-29-a*8,15,4.5,-a*.5,0,6.2832);g.fill();g.stroke();
    g.fillStyle='rgba(255,255,255,.75)';for(let i=0;i<2;i++){const q=(t*.8+i*.5)%1;circ(-5+i*9+Math.sin(t*3+i)*2,-34-q*12,2.8*(1-q*.5));g.fill();}},
  didi:(t,a)=>{awning('#5cb8ff');counter('#bfe3f5');g.strokeStyle=INK;g.lineWidth=1.8;g.fillStyle='#f4fbff';g.beginPath();g.arc(0,-15,13+a,3.1416,0);g.closePath();g.fill();g.stroke();g.fillStyle='#ff7a9a';g.beginPath();g.arc(0,-21,7.5,3.1416,0);g.quadraticCurveTo(4,-17,0,-19);g.quadraticCurveTo(-4,-17,-7.5,-21);g.fill();g.stroke();g.fillStyle='#e8362e';circ(1,-29,2.8);g.fill();g.stroke();},
  peng:(t,a)=>{awning('#ffc94d');g.strokeStyle=INK;g.lineWidth=1.8;g.fillStyle='#5a3620';circ(-10,-2,4);g.fill();circ(10,-2,4);g.fill();g.fillStyle='#f0604a';rr(-16,-20,32,16,3);g.fill();g.stroke();g.fillStyle='#fff';for(const dx of [-9,-1,7]){g.fillRect(dx,-19,4,14);}
    g.fillStyle='rgba(255,255,255,.75)';rr(-13,-33,26,13,4);g.fill();g.stroke();for(let i=0;i<6;i++){g.fillStyle=i%2?'#fff6d0':'#ffd24d';circ(-8+i*3.4,-25-(i%3)*2.4-a*Math.abs(Math.sin(i*2.1+t*14))*5,2.6);g.fill();}},
  shan:(t,a)=>{awning('#5cc4a4');counter();g.strokeStyle=INK;g.lineWidth=1.8;g.fillStyle='#d98a4a';circ(-6,-22,7.5);g.fill();g.stroke();g.beginPath();g.moveTo(-13,-23);g.lineTo(-19,-27);g.stroke();g.beginPath();g.arc(-6,-27,6,3.5,5.9);g.stroke();
    glow(10,-28,13+a*5,'#ffd27a',.55);g.beginPath();g.moveTo(10,-37);g.lineTo(10,-34);g.stroke();g.fillStyle='#f0604a';g.beginPath();g.ellipse(10,-28,5.2,6.4,0,0,6.2832);g.fill();g.stroke();g.fillStyle='#ffd93d';g.fillRect(7,-35,6,2);g.fillRect(7,-23,6,2);},
  dun:(t,a)=>{awning('#ff8fa8');counter();g.strokeStyle=INK;g.lineWidth=1.6;g.fillStyle='#e3c26e';rr(-3.5,-33,7,19,2);g.fill();g.stroke();for(const an of [-.9,0,.9]){g.save();g.translate(0,-28);g.rotate(an+a*.25);g.strokeStyle='#c9a15f';g.lineWidth=1.4;g.beginPath();g.moveTo(0,0);g.lineTo(0,-17);g.stroke();g.strokeStyle='#8a1f1a';g.lineWidth=.9;for(let i=0;i<3;i++){g.fillStyle='#e8362e';circ(0,-6-i*4.6,2.7);g.fill();g.stroke();}g.restore();}},
  zhuo:(t,a)=>{awning('#8fd6a0');counter();g.strokeStyle=INK;g.lineWidth=1.8;g.fillStyle='#a8713c';g.beginPath();g.moveTo(-10,-27);g.lineTo(10,-27);g.lineTo(7.5,-15);g.lineTo(-7.5,-15);g.closePath();g.fill();g.stroke();g.fillStyle='#fffdf6';g.beginPath();g.ellipse(0,-28,8,4.6+a*1.5,0,0,6.2832);g.fill();g.stroke();circ(-13,-18,3.6);g.fill();g.stroke();circ(13,-18,3.6);g.fill();g.stroke();
    g.save();g.translate(11,-33);g.rotate(-.5+a*.9);g.strokeStyle='#8a5a34';g.lineWidth=2;g.beginPath();g.moveTo(0,0);g.lineTo(0,-10);g.stroke();g.fillStyle='#c98f52';g.strokeStyle=INK;g.lineWidth=1.4;rr(-5,-15,10,6,2);g.fill();g.stroke();g.restore();},
};
function drawShadow(x,y){g.fillStyle='rgba(60,40,20,.2)';g.beginPath();g.ellipse(x+2,y+8,30,10,0,0,6.2832);g.fill();}
const BRCOL={king:'#ff8a65',twin:'#ffd24d',ice:'#b0703a',jet:'#5cb8ff',dragon:'#e8362e',star:'#d9962b',rainbow:'#ff9ac2',moon:'#8a5a34',smash:'#e8362e',double:'#ff8fa8',express:'#ffd24d',parcel:'#ffffff'};
/* 가게는 클수록 달라진다: 2단계 등불 줄, 3단계 금테와 간판, 새 메뉴(4단계)는 금빛 차양에 메뉴 색 간판 */
function drawStall(id,x,y,sx,sy,t,a,alpha,lv,br){g.save();g.translate(x,y);g.scale(sx,sy);if(alpha!==undefined)g.globalAlpha*=alpha;g.lineJoin='round';g.lineCap='round';STALL[id](t||0,a||0);lv=lv||1;
  if(lv>=2){for(let i=0;i<5;i++){g.fillStyle=i%2?'#ffd24d':'#f0604a';g.strokeStyle=INK;g.lineWidth=.9;circ(-16+i*8,-30+Math.sin(i*1.3+(t||0)*2)*.8+(i===2?1.5:i%2?1:0),2.1);g.fill();g.stroke();}}
  if(lv>=3){g.strokeStyle='#e8a520';g.lineWidth=2.2;g.beginPath();g.moveTo(-24,-48.5);g.lineTo(24,-48.5);g.stroke();}
  if(lv>=4){g.fillStyle='rgba(255,217,61,.35)';g.fillRect(-24,-47,48,10);g.fillStyle=BRCOL[br]||'#ffd24d';g.strokeStyle=INK;g.lineWidth=1.6;circ(0,-55,7.5);g.fill();g.stroke();g.fillStyle='#fff';g.beginPath();for(let i=0;i<10;i++){const an=-1.5708+i*.6283,q=i%2?1.7:4;g.lineTo(Math.cos(an)*q,-55+Math.sin(an)*q);}g.closePath();g.fill();}
  g.restore();}
function twImg(id,lv,br){const c=lv>=4&&br?['tw_'+id+'_'+br,'tw_'+id+'_3','tw_'+id]:['tw_'+id+'_'+Math.min(3,lv||1),'tw_'+id];for(const k of c)if(IMG[k])return k;return '';}
function stallIcon(id,x,y,alpha){const k=twImg(id,1,'');if(k)drawImg(k,x,y+8,84,{a:alpha});else drawStall(id,x,y,1.75,1.75,0,0,alpha,1,'');}
function drawTurtle(x,opt){
  for(const p of [[-30,-18,.6],[30,-18,-.6],[-28,20,-.5],[28,20,.5]])shape(x,'#8fd68a',()=>{x.ellipse(p[0],p[1],13,8,p[2],0,6.2832);});
  shape(x,opt.col||'#4fa35e',()=>{x.arc(0,-4,34,0,6.2832);});x.strokeStyle='rgba(30,80,45,.55)';x.lineWidth=3;x.beginPath();x.arc(0,-4,17,0,6.2832);for(let i=0;i<6;i++){const a=i*1.047;x.moveTo(Math.cos(a)*17,-4+Math.sin(a)*17);x.lineTo(Math.cos(a)*33,-4+Math.sin(a)*33);}x.stroke();
  x.fillStyle='rgba(255,255,255,.25)';x.beginPath();x.ellipse(-12,-20,12,6,-.4,0,6.2832);x.fill();
  shape(x,'#a5e09c',()=>{x.arc(0,32,16,0,6.2832);});face(x,0,31,7,3.6,opt.mood);
  if(opt.hat){shape(x,'#3a3a48',()=>{x.moveTo(-24,22);x.quadraticCurveTo(0,-2,24,22);x.quadraticCurveTo(0,14,-24,22);});x.fillStyle='#fff';x.beginPath();x.arc(0,13,3.4,0,6.2832);x.fill();}
  else shape(x,'#e8362e',()=>{x.moveTo(-15,24);x.quadraticCurveTo(0,14,15,24);x.lineTo(15,28);x.quadraticCurveTo(0,19,-15,28);},3);
}
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
  turtle:x=>drawTurtle(x,{}),
  shrimp:x=>{x.strokeStyle='#e8718a';x.lineWidth=4;x.lineCap='round';for(const s of [-1,1]){x.beginPath();x.moveTo(s*8,-30);x.quadraticCurveTo(s*30,-56,s*44,-34);x.stroke();}
    shape(x,'#ff9db0',()=>{x.moveTo(-10,-40);x.lineTo(0,-58);x.lineTo(10,-40);});shape(x,'#ffb3c1',()=>{x.ellipse(0,0,26,40,0,0,6.2832);});x.strokeStyle='rgba(200,80,110,.55)';x.lineWidth=3;for(const yy of [-22,-9,4]){x.beginPath();x.moveTo(-22,yy);x.quadraticCurveTo(0,yy+8,22,yy);x.stroke();}
    for(const s of [-1,1])for(let i=0;i<2;i++){x.strokeStyle=INK;x.lineWidth=4;x.beginPath();x.moveTo(s*22,6+i*12);x.lineTo(s*34,14+i*13);x.stroke();}face(x,0,16,10,4.6);},
  pirate:x=>drawTurtle(x,{hat:1,mood:'grr',col:'#3f8f6a'}),
  dragon:x=>{for(const s of [-1,1]){shape(x,'#ffd24d',()=>{x.moveTo(s*14,-36);x.quadraticCurveTo(s*30,-64,s*22,-70);x.quadraticCurveTo(s*24,-50,s*6,-40);});x.strokeStyle='#2f8f80';x.lineWidth=4;x.beginPath();x.moveTo(s*30,18);x.quadraticCurveTo(s*58,10,s*60,30);x.stroke();}
    shape(x,'#4fc3b0',()=>{x.arc(0,0,44,0,6.2832);});x.fillStyle='#fff6d8';x.beginPath();x.ellipse(0,20,26,18,0,0,6.2832);x.fill();x.fillStyle='rgba(255,255,255,.3)';x.beginPath();x.ellipse(-16,-22,14,8,-.4,0,6.2832);x.fill();
    for(const s of [-1,1]){x.fillStyle='#2f8f80';x.beginPath();x.arc(s*8,10,2.6,0,6.2832);x.fill();}face(x,0,-4,17,6.5,'o');crown(x,0,-40,15);},
  gull:x=>{shape(x,'#eef3f8',()=>{x.moveTo(-14,-6);x.quadraticCurveTo(-44,-34,-62,-8);x.quadraticCurveTo(-40,-10,-16,12);});shape(x,'#eef3f8',()=>{x.moveTo(14,-6);x.quadraticCurveTo(44,-34,62,-8);x.quadraticCurveTo(40,-10,16,12);});
    shape(x,'#ffffff',()=>{x.ellipse(0,2,24,30,0,0,6.2832);});shape(x,'#ffb347',()=>{x.moveTo(-7,14);x.lineTo(0,30);x.lineTo(7,14);},4);x.fillStyle='#8fa3b8';x.beginPath();x.ellipse(0,-24,12,6,0,0,6.2832);x.fill();face(x,0,0,10,4.5,'brow');},
  octoboss:x=>drawOcto(x,'#b58bea',{crown:1,mood:'grr'}),
  whale:x=>{shape(x,'#5f9be0',()=>{x.moveTo(-50,-20);x.lineTo(-66,10);x.lineTo(-40,6);});shape(x,'#5f9be0',()=>{x.moveTo(50,-20);x.lineTo(66,10);x.lineTo(40,6);});
    shape(x,'#6fa8e8',()=>{x.ellipse(0,0,54,46,0,0,6.2832);});x.fillStyle='#eaf5ff';x.beginPath();x.ellipse(0,22,36,20,0,0,6.2832);x.fill();
    x.fillStyle='rgba(255,255,255,.75)';for(const p of [[-20,-26],[6,-30],[24,-18],[-6,-16]]){x.beginPath();x.arc(p[0],p[1],4,0,6.2832);x.fill();}
    x.strokeStyle='#bfe6ff';x.lineWidth=5;x.beginPath();x.moveTo(0,-46);x.quadraticCurveTo(-14,-62,-20,-52);x.moveTo(0,-46);x.quadraticCurveTo(14,-62,20,-52);x.stroke();face(x,0,2,24,5.5,'grr');},
};
function mkSprites(){for(const k in DRAW_EN){const big=k==='kingcrab'||k==='octoboss'||k==='whale'||k==='pirate'||k==='dragon',sz=big?300:170,c=mkCanvas(sz,sz),x=c.getContext('2d');safeCtx(x);x.translate(sz/2,sz*.53);x.scale(sz/160,sz/160);x.lineJoin='round';x.lineCap='round';DRAW_EN[k](x);SPR[k]=c;SPRW[k]=tint(c,'#fff');}}
function onImg(n){try{const m=/^(en|boss)_(.+)$/.exec(n);if(m){const im=IMG[n],c=mkCanvas(256,256),x=c.getContext('2d'),s=Math.min(240/im.width,240/im.height);x.drawImage(im,128-im.width*s/2,136-im.height*s/2,im.width*s,im.height*s);SPR[m[2]]=c;SPRW[m[2]]=tint(c,'#fff');}
  else{if(n==='bg_1'||n==='ic_gate')mkBg();if(/^(bg_|ic_gate)/.test(n)&&run&&B&&B.map)B.map=mkMap(run.si);}}catch(e){}}
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
  const bg=IMG['bg_'+(STAGES[si].theme+1)];let gr;if(bg)x.drawImage(bg,0,0,W,H);else{
  gr=x.createLinearGradient(0,90,0,H);gr.addColorStop(0,TH.sand[0]);gr.addColorStop(1,TH.sand[1]);x.fillStyle=gr;x.fillRect(0,0,W,H);
  for(let i=0;i<260;i++){x.fillStyle=i%3?'rgba(170,120,60,.16)':'rgba(255,255,255,.35)';x.beginPath();x.arc(rnd()*W,120+rnd()*600,.8+rnd()*1.6,0,6.2832);x.fill();}
  for(let i=0;i<14;i++){x.strokeStyle='rgba(170,120,60,.14)';x.lineWidth=1.6;const px=rnd()*W,py=150+rnd()*520;x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+14,py-4,px+28,py);x.stroke();}
  // 젖은 모래
  x.fillStyle='rgba(150,110,60,.22)';x.beginPath();x.moveTo(0,0);x.lineTo(W,0);for(let px=W;px>=0;px-=10)x.lineTo(px,shoreY(px)+15+Math.sin(px*.09)*3);x.closePath();x.fill();
  }
  // 길
  x.lineJoin='round';x.lineCap='round';const stroke=(col,w,dy)=>{x.strokeStyle=col;x.lineWidth=w;for(const p of G.paths){x.beginPath();p.s.forEach((q,i)=>{if(i)x.lineTo(q.x,q.y+(dy||0));else x.moveTo(q.x,q.y-30);});x.stroke();}};
  stroke('rgba(90,54,32,.2)',50,3);stroke(TH.edge,46);stroke(TH.path,39);stroke('rgba(255,255,255,.2)',20);
  for(const p of G.paths)for(let i=8;i<p.s.length-6;i+=7){const q=p.s[i],n=p.s[i+1],dx=n.x-q.x,dy=n.y-q.y,l=Math.hypot(dx,dy)||1,sd=(i/7%2?1:-1)*9;x.fillStyle='rgba(120,80,40,.2)';x.beginPath();x.ellipse(q.x-dy/l*sd,q.y+dx/l*sd,3.2,2,Math.atan2(dy,dx),0,6.2832);x.fill();}
  if(!bg){ // 바다
  gr=x.createLinearGradient(0,0,0,125);gr.addColorStop(0,TH.sea[0]);gr.addColorStop(1,TH.sea[1]);x.fillStyle=gr;x.beginPath();x.moveTo(0,0);x.lineTo(W,0);for(let px=W;px>=0;px-=10)x.lineTo(px,shoreY(px));x.closePath();x.fill();
  x.strokeStyle='rgba(255,255,255,.85)';x.lineWidth=3.5;x.beginPath();for(let px=0;px<=W;px+=10){if(px)x.lineTo(px,shoreY(px));else x.moveTo(px,shoreY(px));}x.stroke();
  x.strokeStyle='rgba(255,255,255,.28)';x.lineWidth=2;for(let i=0;i<12;i++){const px=rnd()*W,py=64+rnd()*36;x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+10,py-4,px+20,py);x.stroke();}
  // 마을 쪽 나무 데크와 대문
  x.fillStyle='#d9b07a';x.fillRect(0,GATE_Y+20,W,H);x.strokeStyle='rgba(120,80,40,.4)';x.lineWidth=1.4;for(let py=GATE_Y+20;py<H;py+=13){x.beginPath();x.moveTo(0,py);x.lineTo(W,py);x.stroke();}
  x.fillStyle='#b98a52';x.fillRect(0,GATE_Y+17,W,5);x.strokeStyle=INK;x.lineWidth=1.6;x.strokeRect(-2,GATE_Y+17,W+4,5);
  for(let px=18;px<W;px+=46){if(Math.abs(px-225)<48)continue;x.fillStyle='#f1d08c';x.strokeStyle=INK;x.lineWidth=1.6;x.beginPath();x.moveTo(px-10,GATE_Y+17);x.lineTo(px-10,GATE_Y+5);x.lineTo(px+10,GATE_Y+5);x.lineTo(px+10,GATE_Y+17);x.closePath();x.fill();x.stroke();}
  }
  const gx=225,gy=GATE_Y;x.fillStyle='rgba(60,40,20,.2)';x.beginPath();x.ellipse(gx,gy+20,52,9,0,0,6.2832);x.fill();
  const gi=IMG.ic_gate;if(gi){const gh=84,gw=gh*gi.width/gi.height;x.drawImage(gi,gx-gw/2,gy+24-gh,gw,gh);}else{
  for(const sgn of [-1,1]){x.fillStyle='#f3c97a';x.strokeStyle=INK;x.lineWidth=2.2;rr(gx+sgn*34-12,gy-30,24,50,3,x);x.fill();x.stroke();x.fillStyle='#e8b65e';for(let k=-1;k<2;k++){rr(gx+sgn*34+k*8-3,gy-37,6,8,1.5,x);x.fill();x.stroke();}
    x.beginPath();x.moveTo(gx+sgn*34,gy-37);x.lineTo(gx+sgn*34,gy-58);x.stroke();x.fillStyle=RED;x.beginPath();x.moveTo(gx+sgn*34,gy-58);x.lineTo(gx+sgn*34+13,gy-53);x.lineTo(gx+sgn*34,gy-48);x.closePath();x.fill();x.stroke();}
  x.fillStyle='#f3c97a';x.strokeStyle=INK;rr(gx-24,gy-18,48,38,3,x);x.fill();x.stroke();x.fillStyle='#7a4a2a';x.beginPath();x.moveTo(gx-13,gy+20);x.lineTo(gx-13,gy);x.arc(gx,gy,13,3.1416,0);x.lineTo(gx+13,gy+20);x.closePath();x.fill();x.stroke();}
  if(!bg){ // 꾸밈: 길과 타워 자리를 피해서
  const all=[];for(const p of G.paths)for(let i=0;i<p.s.length;i+=3)all.push(p.s[i]);const placed=[];
  for(let n=0,tries=0;n<30&&tries<600;tries++){const px=14+rnd()*422,py=shoreY(px)+22+rnd()*(GATE_Y-shoreY(px)-40),kind=TH.deco[Math.floor(rnd()*TH.deco.length)],big=kind==='palm'||kind==='parasol',need=big?46:32;
    if(all.some(q=>(q.x-px)**2+(q.y-py)**2<need*need)||G.spots.some(q=>(q.x-px)**2+(q.y-py)**2<(need+6)**2)||placed.some(q=>(q.x-px)**2+(q.y-py)**2<(big||q.big?40:22)**2))continue;
    placed.push({x:px,y:py,big});x.save();x.translate(px,py);DECO[kind](x,rnd()*6.28);x.restore();n++;}}
  return c;
}
let BG=null;function mkBg(){BG=mkMap(0);}

/* ============================== 전투 화면 (타워 디펜스 · 간식으로 배불려 돌려보내기): 규칙(core.js)이 알려 준 일을 그림·소리·진동으로 바꾼다 ============================== */
const HN={tt:['만두 찜통','包子蒸笼'],didi:['빙수 가게','刨冰摊'],peng:['팝콘 수레','爆米花车'],shan:['등롱 찻집','灯笼茶摊'],dun:['탕후루 가게','糖葫芦摊'],zhuo:['찹쌀떡 가게','年糕摊']};
const OWNER={tt:['퇀퇀','团团'],didi:['방울이','滴滴'],peng:['펑펑','砰砰'],shan:['반짝','闪闪'],dun:['둥둥','墩墩'],zhuo:['쫑쫑','啄啄']};
const HCOL={tt:'#ffb199',didi:'#9fd8ff',peng:'#ffcf7a',shan:'#bfe6c8',dun:'#ffc2cf',zhuo:'#e6dcc0'};
const TROLE={tt:['만두를 던져 여럿을 한꺼번에 먹여요 (땅의 손님만)','扔包子，一次喂饱一片（仅地面）'],didi:['빙수를 빠르게 뿌려요 · 먹으면 느려짐','快速撒刨冰 · 吃了会变慢'],peng:['팝콘이 멀리 날아가 펑! · 껍데기 손님이 좋아함','爆米花飞得远，砰！· 硬壳客最爱'],
  shan:['차 향기 · 편식쟁이도 잘 먹고, 오래 맡을수록 잘 먹음','茶香 · 挑食的也爱吃，闻得越久吃得越多'],dun:['탕후루 꼬치 · 가장 배고픈 큰 손님에게 한 방','糖葫芦串 · 专喂最饿的大块头'],zhuo:['끈적한 찹쌀떡 · 여럿을 느리게, 근처 팁 +1','黏黏年糕 · 减速一片，附近小费+1']};
const BR={king:['왕만두','大肉包','범위 +55%, 먹느라 잠깐 멈춤','范围+55%，吃得停一下'],twin:['쌍찜통','双层蒸笼','한 번에 만두 2개','一次扔 2 个包子'],ice:['팥빙수','红豆冰','65% 느려짐, 2초','减速65%，持续2秒'],jet:['슬러시 물줄기','冰沙喷泉','한 줄로 선 손님을 모두 먹임','喂到一整排客人'],
  dragon:['매운 팝콘','麻辣爆米花','떨어진 자리에 3초 동안 매운 향','落点留下 3 秒麻辣香'],star:['캐러멜 팝콘','焦糖爆米花','작은 팝콘이 3번 더 터짐','再爆 3 次小爆米花'],rainbow:['꽃차','花茶','옆의 손님 2명에게도 향이 번짐','茶香飘到旁边 2 位客人'],moon:['진한 보이차','浓普洱','향을 맡은 손님이 35% 더 잘 먹음','闻到的客人多吃 35%'],
  smash:['왕꼬치','巨无霸糖葫芦','정예·보스에게 3배','喂精英和BOSS 3 倍'],double:['쌍꼬치','双串','2명을 동시에 먹임','同时喂 2 位'],express:['소문난 맛집','网红摊','근처 팁 +3','附近小费+3'],parcel:['왕찹쌀떡','大年糕','5배로 먹이고 범위 +25%','喂 5 倍，范围+25%']};
const rnd=(a,b)=>a+Math.random()*(b-a);
let run=null,B=null,paused=false,speed=1;

function startBattle(si,bonusGold,hard){
  needImg('bg_'+(STAGES[si].theme+1));if(STAGES[si].boss)needImg('boss_'+STAGES[si].boss);
  S.sel=si;const owned=TOWER_IDS.filter(id=>S.lv[id]);
  run=newGame(si,{seed:(Date.now()%100000)|0,lv:S.lv,owned,gold:bonusGold||0,hard:!!hard,sauces:S.sauces});
  B={tv:{},parts:[],nums:[],rings:[],fly:[],flashes:[],decals:[],coins:[],pillars:[],pop:{},stop:0,wet:0,goldBump:0,lifeBump:0,shake:0,banner:null,sel:-1,pick:'',aim:'',kind:'',endT:-1,tip:null,time:0,tide:0,leakFlash:0,adGold:!!bonusGold,map:mkMap(si),hint:0};
  paused=false;speed=S.opt.fast?2:1;scr='battle';wantMusic('play');S.stat.runs++;mission('run',1);track('stage_start',{stage:si+1,hard:hard?1:0});if(hard)tip('hard'+run.area,LL(HT[run.area]),10);
  tip('start',L('빈 모래 자리를 눌러 간식 가게를 차리고, 준비되면 시작을 눌러요','点空沙堆摆小吃摊，准备好就点开始'),8);persist();
}
function tip(key,text,sec){if(S.tips[key]||!B)return;S.tips[key]=1;B.tip={text,t:sec||6};}
function banner(text,big,col){B.banner={text,t:0,big:!!big,col:col||'#fff'};}
function shake(n){B.shake=Math.max(B.shake,n);}
/* ---------- 이펙트 도구: 번쩍임(빛 번짐) · 불똥 · 연기 · 별가루 · 자국 · 날아가는 동전 ---------- */
const ECOL={crab:'#ff8a65',jelly:'#c8e6ff',fish:'#6fb8ff',puffer:'#ffd76a',hermit:'#e9bd7e',octo:'#c9a2f2',gull:'#ffffff',turtle:'#4fa35e',shrimp:'#ff9db0',elite:'#e2685c',boss:'#ff7a5c'};
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
  if(kind==='fw'){flash(x,y,r*1.5,'#fff3c0',6);ring(x,y,r,'#fff3c0',3,14);for(let i=0;i<11;i++){const a=Math.random()*6.283,v=rnd(1.4,3.6);P('pop',x,y,Math.cos(a)*v,Math.sin(a)*v-1.6,rnd(22,34),rnd(2.6,3.8),i%3?'#fff6d0':'#ffd24d',.16,.97);}sfx('ex_fw');}
  else if(kind==='bun'){flash(x,y,r*1.6,'#ffffff',6);ring(x,y,r,'#ffffff',3.5,14);smoke(x,y,5,r*.55);burst(x,y,4,['#fff','#ffe9c8'],2.2,2.4);sfx('ex_bun');}
  else if(kind==='bomb'){flash(x,y,r*2.4,'#ff8a8a',9);ring(x,y,r,'#ff6b6b',6,18);ring(x,y,r*1.4,'#5cc46a',3,22);burst(x,y,16,['#ff5a5a','#ff8a8a','#3fa650'],6,4);burst(x,y,8,'#3a2a20',4,1.6);decal(x,y,r*.75,240);shake(11);vib(50);hitStop(.07);sfx('ex_bomb');}
  else{flash(x,y,r*1.2,'#ffffff',5);ring(x,y,r,'#fffdf6',4,16);for(let i=0;i<6;i++)P('pop',x,y,rnd(-2,2),rnd(-2.4,-.6),rnd(22,32),rnd(2.6,3.6),'#fffdf6',.14,.96);sfx('splash');}
}
function consumeFx(){
  for(const f of run.fx){switch(f.e){
    case 'hit':{const big=f.v>=30;if(big||f.weak)floatTxt(f.x+rnd(-7,7),f.y-12,Math.round(f.v),f.weak?'#ffb347':f.v>=120?'#ffd93d':'#fff',f.v>=120?15:f.v>=60?12:10);else if(f.res&&Math.random()<.3)floatTxt(f.x,f.y-12,L('편식!','挑食！'),'#c8d6e4',9);
      if(B.flashes.length<26){flash(f.x,f.y,big?13:8,f.res?'#c8d6e4':'#ffffff',4);if(big||Math.random()<.4)burst(f.x,f.y,big?3:2,['#fff3d6','#f0d9a8'],1.8,1.6);}sfx('hit');break;}
    case 'die':{const boss=f.k==='boss',el=f.k==='elite',col=ECOL[f.k]||'#fff';if(B.fly.length<40)B.fly.push({k:boss?f.bk:f.k,x:f.x,y:f.y,t:0,r:ENEMIES[f.k].r,air:f.air,dir:f.x<225?-1:1,pi:f.pi,d:f.d,ox:f.ox,oy:f.oy});
      ring(f.x,f.y,ENEMIES[f.k].r*1.5,'#ffd0dc',3,12);for(let i=0;i<(boss?10:el?5:2);i++)P('heart',f.x+rnd(-8,8),f.y-6,rnd(-.8,.8),rnd(-1.8,-.9),rnd(26,38),rnd(3,4.4),'#ff7a9a',0,.98);flash(f.x,f.y,ENEMIES[f.k].r*(boss?4:1.8),'#fff3d6',boss?10:5);if(boss||el||Math.random()<.22)floatTxt(f.x,f.y-30,boss?L('배 터지겠다!','撑死啦！'):L('배불러!','吃饱啦！'),'#fff',boss?15:10);
      coins(f.x,f.y,boss?12:el?5:f.g>=12?2:1);floatTxt(f.x,f.y-18,'+'+f.g,'#ffd93d',boss?17:el?13:10);sfx('kill');
      if(boss){shake(12);vib(70);hitStop(.12);stars(f.x,f.y,24,FW_COL,6);smoke(f.x,f.y,6,22);}else if(el){shake(5);hitStop(.04);}break;}
    case 'blast':boom(f.x,f.y,f.r,f.kind);break;
    case 'trait':switch(f.t){
      case 'puff':ring(f.x,f.y,22,'#ffe9a0',3,14);sfx('puff');tip('tr_puff',L('복어가 놀라 부풀었어요! 3초 동안 편식이 심해져요. 빙수와 차는 그대로 먹어요','河豚吓得鼓起来了！3 秒内更挑食，但刨冰和茶照吃不误'),7);break;
      case 'hide':ring(f.x,f.y,16,'#e9bd7e',2.5,12);sfx('hide');tip('tr_hide',L('소라게가 껍데기에 숨었어요. 만두·팝콘을 던지면 깜짝 놀라 튀어나와요','寄居蟹躲进壳里了，扔包子或爆米花能把它吓出来'),7);break;
      case 'pop':flash(f.x,f.y,22,'#fff3c0',6);stars(f.x,f.y-6,6,['#ffd93d','#fff'],3);floatTxt(f.x,f.y-22,L('깜짝!','吓一跳！'),'#ffd93d',11);sfx('break');break;
      case 'fade':ring(f.x,f.y,18,'#d9f2ff',2,16);sfx('fade');tip('tr_fade',L('해파리가 투명해졌어요! 한 명씩 노리는 가게는 못 봐요. 만두·팝콘·찹쌀떡은 닿아요','水母变透明了！单体小吃摊看不见它，包子、爆米花和年糕照样能喂到'),7);break;
      case 'leap':ring(f.x,f.y,14,'#ffffff',3,12);for(let i=0;i<4;i++)P('dot',f.x,f.y,rnd(-1.8,1.8),rnd(-3,-1.4),rnd(12,18),rnd(1.6,2.4),'#d9f2ff',.2);sfx('leap');tip('tr_leap',L('날치가 뛰어올랐어요! 만두와 찹쌀떡은 넘어가요. 느려진 날치는 못 뛰어요','飞鱼跳起来了！包子和年糕会被它跳过去，被减速的飞鱼跳不起来'),7);break;
      case 'dart':P('smoke',f.x,f.y+6,0,-.2,14,6,'#f6e2b8');sfx('leap');tip('tr_dart',L('새우는 처음 간식에 맞으면 깜짝 놀라 앞으로 톡 튀어요','小虾第一次被喂到会吓得往前一蹿'),6);break;
      case 'block':flash(f.x,f.y-8,12,'#dfe7ee',4);sparks(f.x,f.y-8,3,'#dfe7ee',4);if(Math.random()<.4)floatTxt(f.x,f.y-22,L('깡!','当！'),'#dfe7ee',10);sfx('block');tip('tr_block',L('양동이 투구가 간식을 6번 튕겨 내요. 빠르게 던지는 빙수가 잘 벗겨요','水桶头盔能挡 6 次投喂，出手快的刨冰最容易打掉它'),7);break;
      case 'break':burst(f.x,f.y-10,8,['#c9d3dc','#8fa3b8'],4,3);ring(f.x,f.y-6,20,'#dfe7ee',3,14);floatTxt(f.x,f.y-24,L('양동이 벗겨짐!','水桶掉啦！'),'#fff',11);sfx('break');shake(3);break;
      case 'guard':flash(f.x,f.y-6,20,'#ffe9a0',6);ring(f.x,f.y-4,22,'#ffd93d',4,14);sparks(f.x,f.y-6,6,['#ffd93d','#fff'],5);floatTxt(f.x,f.y-26,L('막았다!','挡住了！'),'#ffd93d',12);sfx('block');break;
      case 'dodge':ring(f.x,f.y,18,'#fff',3,14);for(let i=0;i<5;i++)P('dot',f.x,f.y,rnd(-1,1),rnd(-4,-2),rnd(12,18),2,'#fff',.1);floatTxt(f.x,f.y-24,L('휙!','嗖！'),'#fff',12);sfx('leap');break;
      case 'rush':floatTxt(f.x,f.y-22,L('신난다!','冲呀！'),'#8ce99a',11);sfx('leap');tip('tr_rush',L('거북은 배가 반쯤 차면 신나서 달려요. 미리 느리게 해 두세요','海龟吃到半饱会兴奋冲刺，记得提前减速'),7);break;}break;
    case 'splash':ring(f.x,f.y,9,'#bfe8ff',2,10);for(let i=0;i<3;i++)P('dot',f.x,f.y,rnd(-1.6,1.6),rnd(-2.6,-1),rnd(12,18),rnd(1.6,2.4),'#bfe8ff',.2);sfx('splash');break;
    case 'pingpong':flash(f.x,f.y,16,'#ffffff',5);sparks(f.x,f.y,5,['#fff','#ffb347'],5);ring(f.x,f.y,10,'#ffffff',2.5,9);break;
    case 'shoot':{const sp=run.spots[f.i],tv=B.tv[f.i]||(B.tv[f.i]={sq:0,sv:0,lean:0,lt:0});let tx=sp.x;for(let k=run.pr.length-1;k>=0;k--)if(run.pr[k].i===f.i){tx=run.pr[k].tx;break;}if(f.id==='shan'){const e=run.en.find(q=>q.id===sp.tw.tgt);if(e)tx=e.x;}tv.lt=Math.max(-1,Math.min(1,(tx-sp.x)/70))*.15;tv.sv+=f.id==='shan'?.02:f.id==='didi'?.035:.07;if(f.id!=='shan')flash(sp.x,sp.y-34,f.id==='tt'||f.id==='peng'?15:10,TCOL[f.id],4);if(f.id==='tt')smoke(sp.x,sp.y-36,1,7);sfx('s_'+f.id);break;}
    case 'build':{const sp=run.spots[f.i];B.pop[f.i]=B.time;ring(sp.x,sp.y+2,30,'#f3d596',4,16);smoke(sp.x,sp.y+4,5,12);sfx('build');mission('build',1);S.tips.t_build=1;break;}
    case 'up':{const sp=run.spots[f.i],ev=f.lv===4;B.pop[f.i]=B.time-.2;B.pillars.push({x:sp.x,y:sp.y,t:0,big:ev});stars(sp.x,sp.y-20,ev?22:9,['#ffd93d','#fff'],ev?5:3);ring(sp.x,sp.y,ev?46:30,'#ffe9a0',ev?5:3,ev?22:14);
      if(ev){banner(LL(BR[f.br]),0,'#ffd93d');vib(40);hitStop(.06);flash(sp.x,sp.y-20,70,'#ffe9a0',10);sfx('evolve');}else sfx('up');S.tips.t_up=1;break;}
    case 'sell':{const sp=run.spots[f.i];coins(sp.x,sp.y-10,4);smoke(sp.x,sp.y,4,12);floatTxt(sp.x,sp.y-24,'+'+f.g,'#ffd93d',13);sfx('sell');break;}
    case 'wave':if(f.boss){banner(L('보스 등장!','BOSS 来了！'),1,'#ffd93d');sfx('boss');wantMusic('boss');shake(6);}else{banner(L('파도 ','第 ')+f.w+L('',' 波'));sfx('horn');}S.tips.t_start=1;
      if(f.w===2)tip('up',L('가게를 누르면 키울 수 있어요. 3단계 다음엔 두 가지 새 메뉴 중 하나!','点一下小吃摊可以升级，3 级之后新菜单二选一！'),7);if(f.w===3)tip('skill2',L('손님을 배불리면 양념이 차요. 양념을 누르고 가게를 누르면 그 가게의 특식이 터져요!','喂饱客人攒酱料。点酱料再点小吃摊，放出招牌大招！'),8);break;
    case 'waveClear':floatTxt(225,400,L('모두 배불렀어요! +','都吃饱啦！+')+f.g,'#ffd93d',17);coins(225,390,5);sfx('wclear');if(f.w===1)tip('early',L('다음 파도를 미리 부르면 남은 시간만큼 골드를 더 받아요','提前叫下一波，可按剩余时间多拿金币'),7);break;
    case 'sauce':{const sp=run.spots[f.i];B.pop[f.i]=B.time-.2;banner(LL(SPN[f.id]),1,'#ffd93d');flash(sp.x,sp.y-20,f.r*.9,'#ffe9a0',10);ring(sp.x,sp.y,f.r,'#ffd93d',5,26);ring(sp.x,sp.y,f.r*.6,'#fff',3,18);stars(sp.x,sp.y-24,22,['#ffd93d','#fff','#ff9f43'],5);if(f.soy){ring(sp.x,sp.y,f.r*1.3,'#4a3a6a',7,30);burst(sp.x,sp.y-20,20,['#4a3a6a','#7a68a8'],6,3.4);floatTxt(sp.x,sp.y-60,L('눈 가리기!','蒙眼！'),'#c9b3ff',13);}B.pillars.push({x:sp.x,y:sp.y,t:0,big:true});shake(8);vib(45);hitStop(.08);sfx('evolve');sfx('s_'+f.id);break;}
    case 'freeze':ring(f.x,f.y,f.r,'#bfe8ff',6,30);flash(f.x,f.y,f.r,'#dff4ff',12);burst(f.x,f.y,26,['#fff','#bfe8ff','#8fd0ff'],6,3);sfx('fade');break;
    case 'goo':ring(f.x,f.y,f.r,'#fff8e6',7,30);burst(f.x,f.y,22,['#fff','#f3e6c8'],5,4);sfx('splash');break;
    case 'aroma':for(const e of run.en)if(!e.dead){stars(e.x,e.y-10,2,['#bfe6c8','#fff'],2);}flash(225,400,420,'#d8f5dc',16);sfx('clear');break;
    case 'skewer':{const sp=run.spots[f.i];B.rings.push({x:f.x,y:f.y,r:26,col:'#ff5a7a',w:5,t:0,life:18});sparks(f.x,f.y,10,['#ff5a7a','#ffd93d'],6);flash(f.x,f.y,34,'#ffc2cf',8);for(let k=1;k<7;k++)P('spark',sp.x+(f.x-sp.x)*k/7,sp.y-22+(f.y-sp.y+22)*k/7,0,0,10+k,2.4,'#ff8aa0',0,1);break;}
    case 'salt':ring(f.x,f.y,f.r,'#fff',5,22);burst(f.x,f.y,24,['#fff','#e8f4ff'],5,2.6);flash(f.x,f.y,f.r,'#fff',8);banner(L('굵은소금','粗盐'),0,'#fff');sfx('splash');sfx('s_zhuo');shake(4);break;
    case 'jamWarn':B.jamWarn=3;sfx('ink');floatTxt(90,668,L('문어가 양념통을 노려요!','章鱼盯上酱料罐了！'),'#c9b3ff',12);break;
    case 'jam':banner(L('양념통에 먹물!','酱料罐被喷墨了！'),0,'#c9b3ff');sfx('ink');shake(5);vib(40);break;
    case 'jamWipe':sfx('clear');break;
    case 'sauceUp':B.sauceBump=1;sfx('bonus');floatTxt(70,690,L('양념 완성!','酱料满了！'),'#ff9f43',13);break;
    case 'pick':sfx('wclear');break;
    case 'card':if(f.g){coins(225,400,6);floatTxt(225,380,'+'+f.g,'#ffd93d',16);}banner(LL(CARDT[f.c]),0,'#ffd93d');break;
    case 'bonus':floatTxt(330,700,'+'+f.g,'#ffd93d',15);coins(330,700,3);sfx('bonus');break;
    case 'leak':B.leakFlash=20;B.lifeBump=1;shake(6);vib(40);hitStop(.03);burst(f.x,GATE_Y-6,10,['#fff','#ffe0b0'],4,3);tip('leak',L('놓친 손님은 마을 간식을 훔쳐 가요. 간식이 0이 되면 끝!','没喂饱的客人会偷走小镇的点心，点心为 0 就结束！'),7);ring(f.x,GATE_Y,34,'#ff5a4a',4,16);floatTxt(f.x,f.y-26,'-'+f.n,'#ff5a4a',16);sfx('leak');break;
    case 'ink':{const sp=run.spots[f.i];burst(sp.x,sp.y-26,10,'#4a3a6a',3,3.4);sfx('ink');tip('ink',L('먹물 장난! 먹물 묻은 가게는 멈춰요. 눌러서 닦아 줘요','墨汁恶作剧！被喷到的小吃摊会停工，点一下擦干净'),7);break;}
    case 'inkClear':{const sp=run.spots[f.i];sfx('clear');burst(sp.x,sp.y-24,8,'#4a3a6a',3,3);stars(sp.x,sp.y-26,6,'#fff',3);break;}
    case 'summon':ring(f.x,f.y,40,'#ffffff',4,18);burst(f.x,f.y,10,'#fff',3);if(f.bk==='whale'){banner(L('고래 파도! 적이 빨라져요','鲸浪！敌人加速'),0,'#bfe8ff');sfx('tide');}break;
    case 'tide':B.tide=52;sfx('tide');shake(7);vib(40);break;
    case 'down':sfx('over');break;
    case 'revive':sfx('reward');stars(225,GATE_Y-10,30,['#ffd93d','#fff'],6);ring(225,GATE_Y,80,'#ffe9a0',6,24);break;
    case 'win':sfx('win');wantMusic('menu');B.endT=2.2;B.sel=-1;for(let i=0;i<60;i++)P('paper',rnd(0,450),rnd(-220,0),rnd(-1,1),rnd(2,5),120,rnd(3,5),FW_COL[i%5],0,1);break;
    case 'lose':B.endT=1.3;B.sel=-1;break;
  }}
  run.fx.length=0;
  if(run.en.some(e=>e.air))tip('air',L('갈매기는 길을 무시하고 날아와요. 만두와 찹쌀떡은 하늘까지 못 던져요','海鸥会直接飞过来，包子和年糕扔不到天上'),7);
  if(run.en.some(e=>e.armor>=.5))tip('armor',L('편식쟁이(파란 막대)는 빙수와 차를 잘 먹어요. 소라게는 만두와 팝콘을 좋아해요','挑食的客人（蓝条）爱吃刨冰和茶，寄居蟹最爱包子和爆米花'),7);
}
function animStalls(f){for(const i in B.tv){const v=B.tv[i];for(let k=0,m=Math.max(1,Math.round(f));k<m;k++){v.sv+=(-.16*v.sq-.24*v.sv)*(f/m);v.sq+=v.sv*(f/m);}v.lean+=(v.lt-v.lean)*Math.min(1,.3*f);v.lt*=Math.pow(.9,f);}}
function projPos(p){if(p.lob){const q=p.t/p.T;return [p.x,p.y-Math.sin(q*3.1416)*(p.k==='fw'?70:42)];}return [p.x,p.y];}
function battleTick(dt){
  B.time+=dt;if(B.tip&&(B.tip.t-=dt)<=0)B.tip=null;if(B.banner&&(B.banner.t+=dt)>1.6)B.banner=null;
  if(paused||adOv)return;
  let nt=0;if(B.stop>0)B.stop-=dt;else{const before=run.gold;nt=advance(run,dt*speed);consumeFx();if(run.gold<before-1)B.goldBump=-1;}   // 큰 타격 때 아주 잠깐 멈춘다
  const f=Math.min(3,dt*60);B.shake*=Math.pow(.84,f);if(B.tide>0)B.tide-=f;if(B.wet>0)B.wet-=f;if(B.leakFlash>0)B.leakFlash-=f;B.goldBump*=Math.pow(.86,f);B.lifeBump*=Math.pow(.88,f);
  animEnemies(f,nt);animStalls(f);
  for(const p of run.pr){const q=projPos(p);(p.tr||(p.tr=[])).push(q[0],q[1]);if(p.tr.length>12)p.tr.splice(0,2);}
  if(Math.floor(B.time*20)!==Math.floor((B.time-dt)*20)){for(const z of run.zones)P('flame',z.x+rnd(-z.r,z.r)*.7,z.y+rnd(-z.r,z.r)*.5,rnd(-.2,.2),rnd(-1.2,-.6),rnd(14,22),rnd(3,5),'#ffb347');
    for(const sp of run.spots){const tw=sp.tw;if(tw&&tw.id==='shan'&&tw.tgt&&tw.ink<=0){const e=run.en.find(q=>q.id===tw.tgt);if(e)P('star',e.x+rnd(-6,6),e.y+rnd(-6,6),rnd(-.6,.6),rnd(-1.4,-.4),rnd(12,18),rnd(2,3),'#fff7c8',0,.95);}}}
  for(const p of B.parts){p.t+=f;p.x+=p.vx*f;p.y+=p.vy*f;p.vy+=p.gr*f;if(p.drag<1){const d=Math.pow(p.drag,f);p.vx*=d;p.vy*=d;}}B.parts=B.parts.filter(p=>p.t<p.life);
  for(const n of B.nums)n.t+=f;B.nums=B.nums.filter(n=>n.t<44);
  for(const r of B.rings)r.t+=f;B.rings=B.rings.filter(r=>r.t<r.life);
  for(const r of B.flashes)r.t+=f;B.flashes=B.flashes.filter(r=>r.t<r.life);
  for(const r of B.decals)r.t+=f;B.decals=B.decals.filter(r=>r.t<r.life);
  for(const r of B.pillars)r.t+=f;B.pillars=B.pillars.filter(r=>r.t<26);
  for(const o of B.fly){o.t+=f;if(o.t>12&&!o.air)o.d-=2.7*f;}B.fly=B.fly.filter(o=>{if(o.t<58&&(o.air||o.d>2))return true;if(!o.air&&o.d<=2){const p=run.paths[o.pi].s[0];ring(p.x+o.ox,p.y+20,14,'#ffffff',3,12);}return false;});
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
      const si=IMG.ic_spot;if(si){const sw=sel?64:58,sh=sw*si.height/si.width;if(sel){g.fillStyle='rgba(255,200,80,.45)';g.beginPath();g.ellipse(sp.x,sp.y+2,34,17,0,0,6.2832);g.fill();}g.drawImage(si,sp.x-sw/2,sp.y+14-sh*.78,sw,sh);}else{
      g.fillStyle=sel?'#fff1c4':'#f3d596';g.strokeStyle=sel?'#ff9f43':'rgba(120,80,40,.75)';g.lineWidth=sel?3:2;g.setLineDash(sel?[]:[5,4]);g.beginPath();g.ellipse(sp.x,sp.y,24,11,0,0,6.2832);g.fill();g.stroke();g.setLineDash([]);}
      g.fillStyle=can?'rgba(255,255,255,'+(.7+pu*.3)+')':'rgba(255,255,255,.45)';g.strokeStyle=can?'#3a9478':'rgba(120,80,40,.5)';g.lineWidth=2;circ(sp.x,sp.y-3-pu*2,9);g.fill();g.stroke();
      g.strokeStyle=can?'#3a9478':'rgba(120,80,40,.6)';g.lineWidth=3;g.lineCap='round';g.beginPath();g.moveTo(sp.x-4.5,sp.y-3-pu*2);g.lineTo(sp.x+4.5,sp.y-3-pu*2);g.moveTo(sp.x,sp.y-7.5-pu*2);g.lineTo(sp.x,sp.y+1.5-pu*2);g.stroke();
      if(sel&&TOWERS[B.pick]){g.fillStyle='rgba(255,255,255,.16)';g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=2;g.setLineDash([7,5]);circ(sp.x,sp.y,TOWERS[B.pick].range);g.fill();g.stroke();g.setLineDash([]);}return;}
    if(sel){const st=towerStat(run,tw);g.fillStyle='rgba(255,255,255,.16)';g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=2;g.setLineDash([7,5]);circ(sp.x,sp.y,st.range);g.fill();g.stroke();g.setLineDash([]);}
  });
}
function drawTowers(){
  const t=B.time,order=run.spots.map((sp,i)=>i).filter(i=>run.spots[i].tw).sort((a,b)=>run.spots[a].y-run.spots[b].y);
  for(const i of order){const age=B.time-(B.pop[i]===undefined?-9:B.pop[i]);g.save();if(age<.42){const q=age/.42,dy=q<.5?-(1-q*2)*(1-q*2)*28:0,sq=q<.5?-.06:Math.sin((q-.5)*2*3.1416)*.18;g.translate(run.spots[i].x,run.spots[i].y+dy);g.scale(1+sq,1-sq);g.translate(-run.spots[i].x,-run.spots[i].y);}
    const sp=run.spots[i],tw=sp.tw,ti=twImg(tw.id,tw.lv,tw.br),hgt=ti?(drawShadow(sp.x,sp.y),14):drawBase(sp.x,sp.y,tw.lv,tw.br),st=tw.anim>0?tw.anim/10:0,br=Math.sin(t*3+i)*.02;
    if(tw.od>0){const q=tw.od/(SAUCE.od*60);g.fillStyle='rgba(255,140,60,'+(.3+Math.sin(t*14)*.1)*Math.min(1,q*4)+')';g.beginPath();g.ellipse(sp.x,sp.y-hgt-20,40,42,0,0,6.2832);g.fill();if(Math.random()<.35)P('star',sp.x+rnd(-22,22),sp.y-hgt-rnd(0,50),0,-1.2,22,3,'#ffd93d',0,1);}
    if(tw.lv>=4){g.fillStyle='rgba(255,217,61,'+(.22+Math.sin(t*4)*.06)+')';g.beginPath();g.ellipse(sp.x,sp.y-hgt-22,30,32,0,0,6.2832);g.fill();}
    const tv=B.tv[i]||{sq:0,lean:0},wob=tw.ink>0?Math.sin(t*9)*.03:0,ssx=1+br-tv.sq*.55,ssy=1-br+tv.sq;g.save();g.translate(sp.x,sp.y-hgt+3);g.rotate(tv.lean+wob);g.translate(-sp.x,-(sp.y-hgt+3));
    if(ti)drawImg(ti,sp.x,sp.y+12,66+tw.lv*3,{sx:ssx,sy:ssy,a:tw.ink>0?.75:1});else drawStall(tw.id,sp.x,sp.y-hgt+3,(.9+tw.lv*.045)*ssx,(.9+tw.lv*.045)*ssy,t,st,tw.ink>0?.75:1,tw.lv,tw.br);g.restore();
    for(let k=0;k<Math.min(3,tw.lv);k++){g.fillStyle=tw.lv>=4?'#ffd93d':'#fff';g.strokeStyle=INK;g.lineWidth=1.2;circ(sp.x-8+k*8,sp.y+13,3);g.fill();g.stroke();}
    if(tw.ink>0){g.fillStyle='rgba(50,38,80,.88)';circ(sp.x-5,sp.y-hgt-26,17);g.fill();circ(sp.x+11,sp.y-hgt-14,12);g.fill();circ(sp.x-12,sp.y-hgt-10,9);g.fill();icoHand(sp.x+16,sp.y-hgt+8,t,.42);}
    else if(tw.lv<4&&run.gold>=upCost(tw,run)&&B.sel!==i&&B.aim!=='sauce'){const bo=Math.abs(Math.sin(t*4+i))*3;g.fillStyle='#5cc4a4';g.strokeStyle=INK;g.lineWidth=1.6;g.beginPath();g.moveTo(sp.x+20,sp.y-hgt-44-bo);g.lineTo(sp.x+28,sp.y-hgt-34-bo);g.lineTo(sp.x+23,sp.y-hgt-34-bo);g.lineTo(sp.x+23,sp.y-hgt-27-bo);g.lineTo(sp.x+17,sp.y-hgt-27-bo);g.lineTo(sp.x+17,sp.y-hgt-34-bo);g.lineTo(sp.x+12,sp.y-hgt-34-bo);g.closePath();g.fill();g.stroke();}
  g.restore();}
  // 등롱 빛줄기
  for(const sp of run.spots){const tw=sp.tw;if(!tw||tw.id!=='shan'||!tw.tgt||tw.ink>0||!tw.links)continue;let px=sp.x,py=sp.y-[0,10,15,20,24][tw.lv]-26;
    for(const id of tw.links){const e=run.en.find(q=>q.id===id);if(!e)break;const w=2+tw.ramp*.28;g.lineCap='round';g.strokeStyle='rgba(255,255,255,.4)';g.lineWidth=w+6+Math.sin(t*30)*1.5;g.beginPath();g.moveTo(px,py);g.lineTo(e.x,e.y);g.stroke();glow(e.x,e.y,9+tw.ramp*.8,'#ffe9a0',.8);glow(px,py,8,'#ffe9a0',.6);g.strokeStyle=tw.br==='rainbow'?'#ffc2d6':tw.br==='moon'?'#e9c9a0':'#fffaf0';g.lineWidth=w;g.stroke();px=e.x;py=e.y;}}
}
function drawSalt(){for(const z of run.zones){if(!z.salt)continue;const a=Math.min(1,z.t/30);g.fillStyle='rgba(255,255,255,'+(.5*a)+')';g.beginPath();g.ellipse(z.x,z.y,z.r,z.r*.62,0,0,6.2832);g.fill();g.fillStyle='rgba(255,255,255,'+(.95*a)+')';for(let i=0;i<22;i++){const q=i*2.399,rr2=z.r*.9*Math.sqrt((i+.5)/22);circ(z.x+Math.cos(q)*rr2,z.y+Math.sin(q)*rr2*.62,1.6+(i%3)*.5);g.fill();}}}
function drawMarks(){for(const e of run.en){if(e.dead)continue;
    if(e.seal>0){g.fillStyle='rgba(50,38,80,.9)';rr(e.x-e.r*.85,e.y-e.r*.55,e.r*1.7,e.r*.5,e.r*.2);g.fill();}                                   // 먹물 간장으로 눈이 가려짐
    else if(e.guard>0){const pu=.6+Math.sin(B.time*6+e.id)*.25;g.strokeStyle='rgba(255,217,61,'+pu+')';g.lineWidth=2.2;g.beginPath();g.arc(e.x,e.y-e.r*.2,e.r+5,3.5,5.9);g.stroke();}   // 특식을 한 번 막을 준비
    if(e.dodge>0){g.strokeStyle='rgba(255,255,255,.8)';g.lineWidth=1.6;g.setLineDash([3,3]);circ(e.x,e.y,e.r+7);g.stroke();g.setLineDash([]);}}}
function drawDecals(){
  for(const d of B.decals){const a=Math.min(1,(d.life-d.t)/50)*.28;g.fillStyle='rgba(70,45,25,'+a+')';g.beginPath();g.ellipse(d.x,d.y+2,d.r,d.r*.55,0,0,6.2832);g.fill();}
  if(B.wet>0){g.fillStyle='rgba(110,190,225,'+(B.wet/70*.16)+')';g.fillRect(0,100,W,GATE_Y-90);}
}
/* ---------- 움직임 설계: 그림이 한 장이어도 살아 있게 ----------
   · 걸음은 "간 거리"에 맞춰 돈다 → 느려지면 걸음도 느려지고, 멈추면 걸음도 멈춘다(미끄러지지 않음)
   · 종마다 걸음새가 다르다(게는 종종걸음, 해파리는 오므렸다 펴기, 날치는 통통 튀기 …)
   · 먹으면 용수철처럼 움찔하고, 배가 찰수록 통통해진다
   · 화면 주사율이 높아도 끊기지 않게 틱 사이를 이어 그린다 */
const GAIT={crab:{step:9,hop:0,sway:.11,sq:.03,slide:1.6},jelly:{step:24,hop:3.5,sway:.03,sq:.14,pulse:1},fish:{step:27,hop:10,sway:.22,sq:.1,arc:1},puffer:{step:14,hop:1.6,sway:.13,sq:.05},
  hermit:{step:12,hop:.8,sway:.05,sq:.06,slide:.8},octo:{step:17,hop:4,sway:.05,sq:.13},gull:{step:20,hop:0,sway:.04,sq:0,flap:1},turtle:{step:13,hop:1.4,sway:.07,sq:.04},shrimp:{step:9,hop:1.2,sway:.1,sq:.05,slide:1},
  elite:{step:16,hop:2.4,sway:.08,sq:.06,stomp:1},boss:{step:22,hop:3,sway:.05,sq:.05,stomp:2}};
function animEnemies(f,n){
  for(const e of run.en){let v=e._v;
    if(!v){v=e._v={lx:e.x,ly:e.y,vx:0,vy:0,face:1,lean:0,sq:0,sv:0,hitPrev:0,born:B.time,gd:0,stepN:0,spin:0};if(!e.air&&e.d<30){ring(e.x,e.y,16,'#ffffff',3,14);for(let i=0;i<4;i++)P('dot',e.x,e.y,rnd(-1.6,1.6),rnd(-2.8,-1.2),rnd(12,18),rnd(1.6,2.4),'#d9f2ff',.2);}}
    if(n>0){const dx=(e.x-v.lx)/n,dy=(e.y-v.ly)/n;v.vx=Math.max(-3,Math.min(3,dx));v.vy=Math.max(-3,Math.min(3,dy));v.lx=e.x;v.ly=e.y;if(!(e.kb>0))v.gd+=Math.hypot(dx,dy)*n;}
    const kb=e.kb>0;
    if(!kb&&Math.abs(v.vx)>.1)v.face+=((v.vx>0?1:-1)-v.face)*Math.min(1,.2*f);
    v.lean+=((kb?0:Math.max(-1,Math.min(1,v.vx*60/e.sp))*.1)-v.lean)*Math.min(1,.15*f);
    if(kb)v.spin+=.32*f;else if(v.spin){v.spin=0;v.sv+=.06;}
    if(e.hit>v.hitPrev)v.sv+=e.k==='boss'?.025:e.k==='elite'?.035:.055;v.hitPrev=e.hit;     // 냠! 용수철처럼 움찔
    for(let i=0,m=Math.max(1,Math.round(f));i<m;i++){v.sv+=(-.13*v.sq-.2*v.sv)*(f/m);v.sq+=v.sv*(f/m);}
    const G=GAIT[e.k],sn=Math.floor(v.gd/G.step);
    if(sn!==v.stepN){v.stepN=sn;if(G.stomp){for(let i=0;i<2;i++)P('smoke',e.x+rnd(-8,8),e.y+e.r*.8,rnd(-.4,.4),rnd(-.4,-.1),rnd(14,20),e.r*.35,'#f6e2b8');if(G.stomp>1)shake(1.6);}else if(e.rush)P('smoke',e.x,e.y+e.r*.7,rnd(-.3,.3),-.2,14,5,'#f6e2b8');}
  }
}
function drawEnemies(){
  const es=run.en.slice().sort((a,b)=>(a.air?1e4:0)+a.y-((b.air?1e4:0)+b.y)),al=paused||B.stop>0?0:Math.min(1,run.acc*TICK),T=B.time;
  // 배불러서 돌아가는 손님: 폴짝 뛰고, 왔던 길로 통통거리며 돌아간다
  for(const o of B.fly){const key=SPR[o.k+'_full']?o.k+'_full':o.k,s=o.r*3.4;let x=o.x,y=o.y,sx=1.16,sy=1,rot=0,a=1;
    if(o.t<12){const q=Math.sin(o.t/12*3.1416);y-=q*14;sy=1+q*.2;sx=1.16-q*.12;}
    else if(o.air){const q=(o.t-12)/46;x+=o.dir*q*q*240;y-=q*q*150;rot=o.dir*.25;a=1-q;}
    else{const p=pathPos(run.paths[o.pi],o.d),w=(o.t-12)*.36;x=p.x+o.ox;y=p.y+o.oy-Math.abs(Math.sin(w))*7;rot=Math.sin(w)*.1;const land=1-Math.abs(Math.sin(w));sy=1-land*land*.1;sx=1.16+land*land*.08;a=Math.min(1,(58-o.t)/16,o.d/30);}
    g.fillStyle='rgba(60,40,20,'+(.16*a)+')';g.beginPath();g.ellipse(x,(o.t<12||o.air?o.y:y)+o.r*.8,o.r*.9,o.r*.3,0,0,6.2832);g.fill();drawSpr(key,x,y+o.r*.25,s,{a,sx,sy,rot});}
  for(const e of es){const v=e._v||{vx:0,vy:0,face:1,lean:0,sq:0,gd:0,born:-9,spin:0},G=GAIT[e.k],k=sprKey(e),size=e.r*3.4,ph=v.gd/G.step*3.1416+e.ph,s=Math.sin(ph),c=Math.cos(ph),land=1-Math.abs(s),stun=e.stun>0&&!(e.kb>0);
    let x=e.x+v.vx*al,y=e.y+v.vy*al,hop=G.hop*Math.abs(s),rot=G.sway*s+v.lean,sx=1+G.sq*land*land*.8,sy=1-G.sq*land*land;
    if(G.pulse){sy=1+G.sq*s;sx=1-G.sq*s*.7;hop=G.hop*(1+s);rot=v.lean;}
    if(G.arc){rot=-G.sway*c*(v.face<0?-1:1)*.6+v.lean;}
    if(G.slide)x+=G.slide*c;
    if(G.flap){sx=1+.1*Math.sin(T*16+e.ph);hop=7+Math.sin(T*3+e.ph)*3;rot=v.lean*2.2;}
    if(stun){rot=Math.sin(T*11+e.ph)*.09;hop=0;}
    if(e.kb>0){rot=v.spin;hop=6;}
    // 특기는 전부 같은 그림 한 장을 늘이고·줄이고·흐리게 해서 보여 준다 (그림체가 바뀌어도 어긋나지 않음)
    let fa=1;
    if(e.puffT>0){const w=1.3*Math.min(1,(ENEMIES.puffer.puff*60-e.puffT)/8+.75)+Math.sin(T*10)*.03;sx*=w;sy*=w;hop+=3;}
    if(e.hideT>0){const q=Math.min(1,(96-e.hideT)/6,e.hideT/6);sy*=1-.42*q;sx*=1+.14*q;hop=0;rot=Math.sin(T*22)*.02*q;}
    if(e.fadeT>0){const q=Math.min(1,(78-e.fadeT)/10,e.fadeT/10);fa=1-.7*q;}
    if(e.leapT>0){const q=1-e.leapT/26;hop+=Math.sin(q*3.1416)*26;rot=-.35*Math.cos(q*3.1416)*(v.face<0?-1:1);}
    if(e.dartT>0){sy*=1.22;sx*=.84;}
    const full=Math.max(0,Math.min(1,1-e.hp/e.max)),age=T-v.born,grow=age<.35?.5+.5*Math.sin(age/.35*1.5708):1,a=age<.25?age/.25:1;
    sx=(sx+v.sq*.9)*(1+full*.16)*grow;sy=(sy-v.sq)*(1+full*.04)*grow;
    // 그림자: 뛰어오르면 작아진다
    const gy=e.y+v.vy*al+(e.air?26:e.r*.8),sh=Math.max(.45,1-hop/26);g.fillStyle='rgba(60,40,20,'+((e.air?.13:.19)*a)+')';g.beginPath();g.ellipse(x,gy,e.r*.92*sh*(1+full*.12),e.r*.32*sh,0,0,6.2832);g.fill();
    if(e.slow>0){g.fillStyle='rgba(150,215,255,.5)';g.beginPath();g.ellipse(x,gy,e.r*1.25,e.r*.48,0,0,6.2832);g.fill();g.strokeStyle='rgba(255,255,255,.8)';g.lineWidth=1;g.stroke();}
    const yy=y+e.r*.25-hop;if(e.shred>0)glow(x,yy-e.r*.3,e.r*2.2,'#ffe9a0',.35);
    const o={sx:sx*(v.face<0?-1:1)*Math.max(.25,Math.abs(v.face)),sy,rot,a:a*fa};if(e.fadeT>0){g.strokeStyle='rgba(255,255,255,'+(.5*(1-fa))+')';g.lineWidth=1.2;circ(x,yy,e.r*(1.1+Math.sin(T*6)*.1));g.stroke();}drawSpr(k,x,yy,size,o);if(e.hit>0)drawSpr(k,x,yy,size,{sx:o.sx,sy,rot,white:1,a:e.hit/6*.6});
    if(e.slow>0){g.fillStyle='rgba(215,240,255,.9)';for(let i=0;i<2;i++){const an=T*2+i*3.14+e.ph;circ(x+Math.cos(an)*e.r*.9,yy-e.r*.5+Math.sin(an*1.3)*4,1.6);g.fill();}}
    if(e.shield>0)for(let i=0;i<e.shield;i++){g.fillStyle='#c9d3dc';g.strokeStyle=INK;g.lineWidth=.9;circ(x-(e.shield-1)*2.6+i*5.2,yy-size*.5-11,2.1);g.fill();g.stroke();}
    if(stun)for(let i=0;i<2;i++){const an=T*7+i*3.14;txt('★',x+Math.cos(an)*e.r*.8,yy-e.r-6+Math.sin(an)*3,8,'#ffd93d','center',INK,2);}
    if(e.hp<e.max*.999||e.k==='elite'||e.k==='boss'){const w=Math.max(18,e.r*1.9),by=yy-size*.5-3;g.fillStyle=e.armor>=.5?'rgba(40,70,110,.8)':'rgba(60,36,20,.75)';rr(x-w/2-1,by-1,w+2,5.5,2.5);g.fill();g.fillStyle=full>.7?'#7ddc6a':full>.35?'#ffd24d':'#ffb347';rr(x-w/2,by,Math.max(1.5,w*full),3.5,1.7);g.fill();}
  }
}
const TRAIL={fw:'255,236,170',bun:'255,255,255',drop:'190,232,255',ball:'255,150,150',mail:'255,255,255'};
function drawProj(){
  for(const z of run.zones){glow(z.x,z.y,z.r*1.5,'#ff6b4a',.26+Math.sin(B.time*9)*.07);}
  for(const p of run.pr){const q=projPos(p),x=q[0],y=q[1],tr=p.tr;
    if(tr&&tr.length>=4){g.lineCap='round';for(let i=2;i<tr.length;i+=2){const a=i/tr.length;g.strokeStyle='rgba('+TRAIL[p.k]+','+(a*.7)+')';g.lineWidth=(p.k==='fw'?4.5:3.2)*a;g.beginPath();g.moveTo(tr[i-2],tr[i-1]);g.lineTo(tr[i],tr[i+1]);g.stroke();}}
    if(p.lob){const hq=Math.sin(Math.min(1,p.t/p.T)*3.1416);g.fillStyle='rgba(60,40,20,'+(.2-hq*.1)+')';g.beginPath();g.ellipse(p.x,p.y+3,5.5*(1-hq*.4),2.4*(1-hq*.4),0,0,6.2832);g.fill();}
    const ptw=run.spots[p.i]&&run.spots[p.i].tw,plv=ptw?ptw.lv:1,pbr=ptw?ptw.br:'',psc=1+(plv-1)*.12+(pbr==='king'||pbr==='parcel'||pbr==='smash'?.45:0);g.save();g.translate(x,y);g.scale(psc,psc);g.translate(-x,-y);
    g.strokeStyle=INK;g.lineWidth=1.3;
    if(p.k==='fw'){g.fillStyle=pbr==='dragon'?'#ffb09a':pbr==='star'?'#f2c56e':'#fff6d0';for(const d of [[-2.6,-1],[2.6,-.6],[0,2.4],[0,-3]]){circ(x+d[0],y+d[1],2.9);g.fill();g.stroke();}g.fillStyle=pbr==='dragon'?'#e8362e':pbr==='star'?'#b5651d':'#ffd24d';circ(x,y,2.2);g.fill();}                       // 팝콘
    else if(p.k==='bun'){const s=1+Math.sin(p.t*.5)*.08;g.fillStyle='#fff';g.lineWidth=1.6;g.beginPath();g.ellipse(x,y,5.8*s,5.8/s,0,0,6.2832);g.fill();g.stroke();g.beginPath();g.arc(x,y-1,2.4,3.6,5.8);g.stroke();}   // 만두
    else if(p.k==='drop'){g.save();g.translate(x,y);g.rotate(p.t*.3);g.fillStyle='#eaf8ff';g.strokeStyle='#5aa8dc';rr(-(p.line?5:3.6),-(p.line?5:3.6),p.line?10:7.2,p.line?10:7.2,2);g.fill();g.stroke();g.fillStyle=pbr==='ice'?'#8a4a2a':'#ff9ab0';circ(0,0,1.4);g.fill();g.restore();}  // 빙수 얼음
    else if(p.k==='ball'){const a=Math.atan2(p.ty-y,p.tx-x);g.save();g.translate(x,y);g.rotate(a);g.strokeStyle='#c9a15f';g.lineWidth=1.6;g.beginPath();g.moveTo(-9,0);g.lineTo(9,0);g.stroke();g.strokeStyle='#8a1f1a';g.lineWidth=1;for(let i=0;i<3;i++){g.fillStyle='#e8362e';circ(-4+i*5.2,0,2.9);g.fill();g.stroke();}g.restore();}  // 탕후루
    else{const s=1+Math.sin(p.t*.6)*.12;g.fillStyle='#fffdf6';g.lineWidth=1.4;g.beginPath();g.ellipse(x,y,6.4*s,5.2/s,0,0,6.2832);g.fill();g.stroke();}
    g.restore();}                                                              // 찹쌀떡
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
    else if(p.kind==='pop'){g.globalAlpha=a;g.fillStyle=p.col;g.strokeStyle='rgba(90,54,32,.55)';g.lineWidth=.9;circ(p.x,p.y,p.r);g.fill();g.stroke();}
    else if(p.kind==='heart'){const s=p.r*(1+Math.sin(p.t*.5)*.12);g.globalAlpha=a;g.fillStyle=p.col;g.beginPath();g.moveTo(p.x,p.y+s);g.bezierCurveTo(p.x-s*1.7,p.y-s*.2,p.x-s*.7,p.y-s*1.4,p.x,p.y-s*.45);g.bezierCurveTo(p.x+s*.7,p.y-s*1.4,p.x+s*1.7,p.y-s*.2,p.x,p.y+s);g.fill();}
    else if(p.kind==='paper'){g.globalAlpha=a;g.fillStyle=p.col;g.save();g.translate(p.x,p.y);g.rotate(p.t*.2+p.r);g.fillRect(-p.r,-p.r*.6*Math.cos(p.t*.3),p.r*2,p.r*1.2*Math.cos(p.t*.3));g.restore();}
    else if(p.kind==='flame'){g.globalAlpha=1;glow(p.x,p.y,p.r*2.4*(1-q*.5),q<.4?'#ffe08a':'#ff8a3d',(1-q)*.8);}
    else{g.globalAlpha=a;g.fillStyle=p.col;circ(p.x,p.y,p.r*(1-q*.4));g.fill();}}
  g.globalAlpha=1;
  for(const c of B.coins){if(c.t<0)continue;const q=c.t/c.T,e=q*q,u=1-e,x=u*u*c.sx+2*u*e*c.cx+e*e*180,y=u*u*c.sy+2*u*e*c.cy+e*e*31;icoCoin(x,y,4.6*(1-q*.25));}
  for(const n of B.nums){const a=Math.min(1,(44-n.t)/12),pop=1+Math.max(0,(7-n.t)/7)*.8;g.globalAlpha=a;txt(n.s,n.x,n.y-Math.min(n.t,30)*.6,n.sz*pop,n.col,'center',INK,Math.max(2.4,n.sz*.24));}g.globalAlpha=1;
  if(B.aim==='sauce'&&B.kind!=='salt'){run.spots.forEach((sp,k)=>{if(!sp.tw)return;const pu=Math.sin(B.time*7+k)*3;g.strokeStyle='rgba(255,140,60,.95)';g.lineWidth=3;g.setLineDash([8,5]);g.lineDashOffset=-B.time*30;g.beginPath();g.ellipse(sp.x,sp.y-14,34+pu,38+pu,0,0,6.2832);g.stroke();g.setLineDash([]);g.lineDashOffset=0;});}
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
      roundBtn(x,y,56,on,!ok,()=>{if(on){if(build(run,B.sel,id)){B.sel=-1;B.pick='';}else{sfx('nope');toast(L('골드가 모자라요','金币不够'));}}else{B.pick=id;sfx('btn');}},()=>{if(on){stallIcon(id,x,y+34,.35);txt('✓',x,y,60,'#1f7a5a','center','#fff',10);}else stallIcon(id,x,y+36,ok?1:.5);});
      costTag(x,y+62,cost,ok);});
    if(B.pick){const b=TOWERS[B.pick];info={t:LL(HN[B.pick])+'  ·  '+L('한 번 더 누르면 차려요','再点一次开张'),d:LL(TROLE[B.pick]),r:b.range*heroMul(1)};}
    else info={t:L('어떤 가게를 차릴까요?','要摆哪种小吃摊？'),d:L('가게를 누르면 설명이 나와요','点一下可以看说明')};
  }else{const st=towerStat(run,tw),cost=upCost(tw,run),ok=run.gold>=cost;
    if(tw.lv<3){const on=B.pick==='up';roundBtn(c.x,c.y-R,60,on,!ok,()=>{if(on){if(upgrade(run,B.sel)){B.pick='';}else{sfx('nope');toast(L('골드가 모자라요','金币不够'));}}else{B.pick='up';sfx('btn');}},()=>{if(on)txt('✓',c.x,c.y-R,64,'#1f7a5a','center','#fff',10);else{g.fillStyle=ok?MINT:GREY_D;g.strokeStyle=INK;g.lineWidth=4;g.lineJoin='round';g.beginPath();g.moveTo(c.x,c.y-R-30);g.lineTo(c.x+28,c.y-R);g.lineTo(c.x+12,c.y-R);g.lineTo(c.x+12,c.y-R+26);g.lineTo(c.x-12,c.y-R+26);g.lineTo(c.x-12,c.y-R);g.lineTo(c.x-28,c.y-R);g.closePath();g.fill();g.stroke();}});costTag(c.x,c.y-R+66,cost,ok);}
    else if(tw.lv===3){BRANCH[tw.id].forEach((br,k)=>{const x=c.x+(k?1:-1)*104,y=c.y-R+26,on=B.pick===br;
        roundBtn(x,y,62,on,!ok,()=>{if(on){if(upgrade(run,B.sel,br)){B.pick='';}else{sfx('nope');toast(L('골드가 모자라요','金币不够'));}}else{B.pick=br;sfx('btn');}},()=>{if(on)txt('✓',x,y,64,'#1f7a5a','center','#fff',10);else{icoStar(x,y-12,26,1);txtFit(LL(BR[br]),x,y+30,20,104,INK);}});costTag(x,y+68,cost,ok);});}
    const on=B.pick==='sell',refund=Math.round(tw.spent*SELL);roundBtn(c.x,c.y+R,50,on,false,()=>{if(on){sell(run,B.sel);B.sel=-1;B.pick='';}else{B.pick='sell';sfx('btn');}},()=>{if(on)txt('✓',c.x,c.y+R,54,'#b0482f','center','#fff',9);else{icoCoin(c.x,c.y+R-8,17);txt(L('팔기','出售'),c.x,c.y+R+24,19,INK);}});costTag(c.x,c.y+R+58,'+'+refund,true);
    const name=LL(HN[tw.id])+(tw.br?' · '+LL(BR[tw.br]):'')+'  Lv.'+tw.lv+(tw.lv>=4?' MAX':'');
    if(B.pick==='sell')info={t:name,d:L('한 번 더 누르면 팔아요 (쓴 골드의 70% 돌려받음)','再点一次出售（返还 70% 金币）')};
    else if(BR[B.pick])info={t:LL(BR[B.pick])+'  ·  '+L('한 번 더 누르면 새 메뉴','再点一次上新菜'),d:BR[B.pick][LANG==='zh'?3:2]};
    else if(B.pick==='up')info={t:name+'  →  Lv.'+(tw.lv+1),d:L('맛 ','美味 ')+Math.round(st.dmg/LV_DMG[tw.lv-1]*LV_DMG[tw.lv]*10)/10+L(' · 닿는 거리 조금 늘어남 · 한 번 더 누르면 키움',' · 范围略增 · 再点一次升级')};
    else info={t:name,d:(tw.br?BR[tw.br][LANG==='zh'?3:2]:LL(TROLE[tw.id]))+'  ·  '+L('맛 ','美味 ')+Math.round(st.dmg*10)/10,e:L('양념 특식 · ','酱料大招 · ')+LL(SPN[tw.id])+': '+LL(SPD[tw.id])};
  }
  if(info){const hh=info.e?150:116,y=sp.y*K>860?150:1236-hh;panel(24,y,702,hh,'#fffdf3',26,4);txtFit(info.t,375,y+38,28,660,INK);txtFit(info.d,375,y+82,22,660,'#8a6a4a');if(info.e)txtFit(info.e,375,y+120,21,660,'#d9772a');}
}
function icoSauce(x,y,r){if(icoImg('ic_sauce',x,y,r))return;g.lineJoin='round';g.strokeStyle=INK;g.lineWidth=Math.max(2.5,r*.14);g.fillStyle='#e8442e';rr(x-r*.62,y-r*.35,r*1.24,r*1.3,r*.3);g.fill();g.stroke();
  g.fillStyle='#fff3d6';rr(x-r*.42,y+r*.05,r*.84,r*.5,r*.12);g.fill();g.stroke();g.fillStyle='#ffd93d';rr(x-r*.4,y-r*.78,r*.8,r*.46,r*.14);g.fill();g.stroke();g.fillStyle='#e8442e';g.beginPath();g.arc(x,y+r*.3,r*.13,0,6.2832);g.fill();}
const SPN={tt:['만두 비','包子雨'],didi:['눈보라','暴风雪'],peng:['팝콘 불꽃놀이','爆米花烟花'],shan:['차 향기','满场茶香'],dun:['왕꼬치','巨串出击'],zhuo:['찹쌀떡 잔치','年糕派对']};
const SPD={tt:['앞선 손님 6명 머리 위로 만두가 쏟아져요','包子砸向最前面的 6 位客人'],didi:['둘레 손님이 꽁꽁 얼어요','周围的客人都被冻住'],peng:['하늘 손님까지 6번 펑펑','连天上的客人也炸到，共 6 发'],shan:['6초 동안 모든 손님이 뭐든 잘 먹고, 숨은 손님도 드러나요','6 秒内所有客人不挑食，隐身的也现形'],dun:['어디에 있든 가장 배고픈 3명에게','不管在哪，喂给最饿的 3 位'],zhuo:['둘레 손님이 끈적끈적 느려지고 팁을 줘요','周围客人黏住变慢，还给小费']};
const SKN={'':['기본','原味'],salt:['굵은소금','粗盐'],soy:['먹물 간장','墨鱼酱油']};
const SKD={salt:['길 위에 뿌려요. 그 자리 손님이 목말라 3초 멈춰요. 막거나 피하지 못해요','撒在路上，路过的客人口渴停 3 秒，挡不住也躲不开'],soy:['특식과 함께 눈을 가려요. 6초 동안 손님이 특기도 못 쓰고 특식을 막거나 피하지도 못해요','放大招的同时蒙住眼睛，6 秒内客人用不了绝活，也挡不住、躲不开']};
const HT=[['매운맛! 양동이 꽃게가 양념 특식을 한 번 막아요. 금빛 테두리가 보이면 다른 손님부터 노려요','麻辣模式！水桶蟹会挡下一次酱料大招。看到金色光圈，就先喂别的客人'],['매운맛! 문어가 꽉 찬 양념통을 노려요. 양념을 아끼지 말고 써요. 먹물이 묻으면 눌러서 닦아요','麻辣模式！章鱼盯着装满的酱料罐。别攒着，赶紧用。被喷墨就点击擦掉'],['매운맛! 갈매기는 특식이 터지면 솟아올라 피해요. 먹물 간장으로 눈을 가리면 못 피해요','麻辣模式！海鸥看到大招会飞高躲开。用墨鱼酱油蒙住眼睛就躲不了'],['매운맛! 거북과 소라게도 등껍질로 특식을 한 번 막아요. 굵은소금은 막지 못해요','麻辣模式！海龟和寄居蟹也会用壳挡一次大招，但粗盐挡不住'],['매운맛! 꼬마 용왕도 특식을 막아요. 먹물 간장으로 눈을 가린 뒤에 특식을 써요','麻辣模式！小龙王也会挡大招。先用墨鱼酱油蒙眼再放大招']];
function useSauce(i){if(castSauce(run,i,B.kind==='soy'?'soy':undefined)){B.aim='';B.sel=-1;B.pick='';mission('skill',1);track('sauce',{id:run.spots[i].tw.id});}else sfx('nope');}
const CARDT={bun2:['만두 하나 더','再来一个包子','만두 찜통이 한 번에 1개 더 던져요','包子蒸笼每次多扔 1 个'],frost:['얼음 듬뿍','多加冰','빙수의 느려짐 +15%, 1초 더 오래','刨冰减速 +15%，多持续 1 秒'],pop:['대왕 팝콘','超大爆米花','팝콘이 터지는 범위 +30%','爆米花爆开范围 +30%'],
  tea:['진한 향','浓浓茶香','찻집 닿는 거리 +15%, 맛 +25%','茶摊范围 +15%，美味 +25%'],skew:['빠른 손','快手','탕후루를 25% 더 빨리 꽂아요','糖葫芦出手快 25%'],sticky:['더 끈적하게','更黏一点','찹쌀떡 범위 +25%, 1초 더 느리게','年糕范围 +25%，多减速 1 秒'],
  taste:['손맛','好手艺','모든 가게의 맛 +15%','所有小吃摊美味 +15%'],reach:['소문난 냄새','香飘十里','모든 가게의 닿는 거리 +8%','所有小吃摊范围 +8%'],tip:['후한 손님','大方的客人','손님이 돌아갈 때 골드 +2','每位客人多给 2 金币'],
  coin:['오늘의 매상','今日营业额','지금 바로 골드를 받아요','马上获得一笔金币'],life:['간식 채우기','补货','간식 +3','点心 +3'],sauce:['양념 한 통','一罐酱料','양념 1통을 바로 받고, 이 판 내내 25% 빨리 차요','立刻获得 1 罐，本局攒得快 25%'],sale:['단골 할인','老主顾折扣','가게 키우는 값 -15%','升级费用 -15%']};
function cardIcon(c,x,y){const o=CARDS[c].only;if(o){stallIcon(o,x,y+34);return;}g.fillStyle={taste:'#ffe1a8',reach:'#cfeedd',tip:'#fff0b8',coin:'#fff0b8',life:'#ffe0d6',sauce:'#ffd6c8',sale:'#d8ecff'}[c];circ(x,y,44);g.fill();g.lineWidth=4;g.strokeStyle=INK;g.stroke();
  if(c==='taste')icoStar(x,y,26,1);else if(c==='life')icoBun(x,y,26);else if(c==='sauce')icoSauce(x,y,28);else if(c==='reach'){g.strokeStyle='#3a9478';g.lineWidth=5;g.setLineDash([9,7]);circ(x,y,26);g.stroke();g.setLineDash([]);g.fillStyle='#3a9478';circ(x,y,7);g.fill();}
  else{icoCoin(x,y,c==='sale'?20:24);if(c==='sale')txt('%',x+22,y+18,26,RED_D,'center','#fff',6);if(c==='tip')txt('+2',x+24,y+20,22,RED_D,'center','#fff',6);}}
function drawPick(){
  g.fillStyle='rgba(40,24,12,.62)';g.fillRect(0,0,VW,VH);BT.length=0;const ps=run.picks||[];
  txt(L('오늘의 특선','今日特选'),375,250,58,'#ffd93d','center',INK,14);txt(L('하나를 골라요 · 이 판 동안 계속돼요','选一张 · 本局一直有效'),375,312,26,'#fff','center',INK,6);
  ps.forEach((c,k)=>{const y=370+k*210,T=CARDT[c],n=run.buf[c]||0;btn(60,y,630,180,'',()=>{sfx('reward');track('card',{c,stage:run.si+1,wave:run.wave});pickCard(run,k);},{col:CREAM,dk:'#d9c8a8',r:30,icon:(cx,cy)=>{cardIcon(c,cx-230,cy);
    txtFit(T[LANG==='zh'?1:0]+(n?'  +'+n:''),cx-160,cy-34,36,430,RED_D,'left');wrap(T[LANG==='zh'?3:2]+(c==='coin'?' (+'+(120+25*run.wave)+')':''),cx-160,cy+8,24,420,32,INK,'left',2);}});});
  if(!run.rerolled)btn(175,1020,400,76,L('▶ 광고 보고 다시 뽑기','▶ 看广告换一批'),()=>showAd('reroll',o=>{if(o){rerollCards(run);sfx('reward');}}),{col:YEL,dk:YEL_D,tc:INK,sz:26});
}
function drawHud(){
  btn(14,16,76,72,'',()=>{paused=true;sfx('btn');},{col:CREAM,dk:'#d9c8a8',icon:(x,y)=>{g.fillStyle=INK;rr(x-14,y-15,10,30,4);g.fill();rr(x+4,y-15,10,30,4);g.fill();}});
  panel(104,18,150,66,CREAM,22);icoBun(138,52,21);txt(run.lives,200,53,32*(1+B.lifeBump*.5),run.lives<=5||B.lifeBump>.2?RED:INK);
  panel(268,18,180,66,CREAM,22);icoCoin(300,51,18);txtFit(Math.floor(run.gold),372,53,32*(1+Math.abs(B.goldBump)*.22),120,B.goldBump<-.2?'#b0482f':INK);
  panel(462,18,170,66,CREAM,22);txt(L('파도','波次'),500,53,19,'#a07a55');txt(Math.max(run.wave,0)+' / '+run.S.waves,576,53,29,INK);
  btn(646,16,90,72,speed>1?'x2':'x1',()=>{speed=speed>1?1:2;S.opt.fast=speed>1?1:0;sfx('btn');},{col:speed>1?YEL:CREAM,dk:speed>1?YEL_D:'#d9c8a8',tc:INK,sz:30});
  if(run.boss&&!run.boss.dead){bar(150,100,450,30,1-run.boss.hp/run.boss.max,'#ffb347');txt('BOSS · '+L('배부름','饱腹'),375,115,18,'#fff','center',INK,4);}
  // 아래: 스킬 둘 + 다음 파도
  const live=run.ws!=='prep';
  {const ns=run.sauce,rdy=ns>0&&live,q=ns>=SAUCE.max?1:run.sp/sauceNeed(run),on=B.aim==='sauce',pu=rdy&&!on?1+Math.sin(B.time*6)*.025:1;if(B.sauceBump>0)B.sauceBump-=.04;
    g.save();g.translate(150,1280);g.scale(pu,pu);g.translate(-150,-1280);
    btn(14,1238,272,84,'',()=>{if(run.lock>0){wipeJar(run);return;}if(!rdy){sfx('nope');toast(ns>0?L('파도가 시작되면 쓸 수 있어요','开始后才能用'):L('손님을 배불리면 양념이 차요','喂饱客人就能攒酱料'));return;}if(B.kind!=='salt'&&B.sel>=0&&run.spots[B.sel].tw)useSauce(B.sel);else{B.aim=on?'':'sauce';B.sel=-1;B.pick='';sfx('btn');}},
      {col:run.lock>0?'#6a5a96':on?'#ffd93d':rdy?'#ff9f43':'#cfc6b6',dk:run.lock>0?'#4a3a6a':on?YEL_D:rdy?'#d9772a':'#a39a8c',icon:(cx,cy)=>{if(run.lock>0){icoSauce(cx-96,cy-2,26);g.fillStyle='rgba(50,38,80,.85)';circ(cx-100,cy-6,20);g.fill();circ(cx-84,cy+10,13);g.fill();txt(L('먹물! 눌러서 닦기','被喷墨！点击擦掉'),cx+26,cy-14,20,'#fff');txt(Math.ceil(run.lock/60),cx+26,cy+18,26,'#ffd93d');return;}icoSauce(cx-96,cy-2,(26+Math.max(0,B.sauceBump||0)*10));txt(L('비법 양념','秘制酱料'),cx-58,cy-17,22,INK,'left');bar(cx-60,cy+4,118,24,q,'#ff5a4a');
        for(let k=0;k<SAUCE.max;k++){g.fillStyle=k<ns?'#ff5a4a':'rgba(90,54,32,.3)';g.strokeStyle=INK;g.lineWidth=3;circ(cx+80+k*30,cy,11);g.fill();g.stroke();}}});g.restore();
}
  const canCall=run.phase==='run'&&run.wave<run.S.waves&&(run.ws==='prep'||run.ws==='gap');
  if(run.ws==='prep'){const pu=1+Math.sin(B.time*5)*.02,need=!run.spots.some(sp=>sp.tw);g.save();g.translate(520,1280);g.scale(pu,pu);g.translate(-520,-1280);btn(300,1234,436,90,L('▶ 시작!','▶ 开始！'),()=>{if(need){sfx('nope');toast(L('먼저 가게를 하나 차려요','先摆一个小吃摊吧'));return;}sfx('btn');callWave(run);},{sz:42,off:false,col:need?GREY:RED,dk:need?GREY_D:RED_D});g.restore();
    if(!B.adGold&&run.si>0)btn(300,1150,436,64,L('▶ 광고 보고 시작 골드 +150','▶ 看广告开局金币 +150'),()=>showAd('gold',o=>{if(o){run.gold+=150;B.adGold=true;sfx('reward');}}),{col:YEL,dk:YEL_D,tc:INK,sz:24});}
  else if(canCall){const sec=Math.ceil(run.gapT/60),bonus=Math.round(run.gapT/60*BONUS_PER_SEC);btn(300,1234,436,90,'',()=>{sfx('btn');callWave(run);},{col:MINT,dk:MINT_D,icon:(x,y)=>{txt(L('다음 파도 부르기','提前叫下一波'),x,y-17,27,'#fff','center',INK);icoCoin(x-70,y+22,12);txt('+'+bonus+L('  ·  ','  ·  ')+sec+L('초 뒤 자동','秒后自动'),x+16,y+23,21,'#fff','center',INK,5);}});}
  else{panel(300,1238,436,84,'rgba(255,246,228,.85)',26,4);const left=run.en.length+run.queue.length;txt(run.wave>=run.S.waves?L('마지막 파도! 남은 손님 ','最后一波！剩余 ')+left:L('남은 손님 ','剩余客人 ')+left,518,1281,26,INK);}
  if(B.aim==='sauce')txt(B.kind==='salt'?L('소금을 뿌릴 길을 눌러요','点一下要撒盐的路面'):L('양념을 뿌릴 가게를 눌러요','点一下要加酱料的小吃摊'),375,B.tip?1056:1150,30,'#fff','center',INK,8);
  if(run.hard)txt(L('매운맛','麻辣'),52,108,20,'#ff5a4a','center','#fff',5);
  if(B.banner){const b=B.banner,q=Math.min(1,b.t*5),o=b.t>1.3?(1.6-b.t)/.3:1;g.globalAlpha=Math.max(0,o);const bh=b.big?120:90;g.fillStyle='rgba(60,36,20,.55)';g.fillRect(0,250-bh/2,VW*q,bh);g.fillStyle=b.big?'#ffd93d':'#fff';g.fillRect(0,250-bh/2-6,VW*q,5);g.fillRect(0,250+bh/2+1,VW*q,5);txt(b.text,375+(1-q)*120,250,b.big?70:50,b.col,'center',INK,b.big?16:12);g.globalAlpha=1;}
  if(B.tip&&B.sel<0){panel(24,1086,702,116,'#fffdf3',30);drawImg('tuantuan',84,1194,104);wrap(B.tip.text,150,B.tip.text.length>22?1126:1144,25,550,34,INK,'left',2);}
  {const ks=[''].concat(['salt','soy'].filter(k=>run.kinds[k]));if(ks.length>1&&B.sel<0){if(ks.indexOf(B.kind)<0)B.kind='';ks.forEach((k,j)=>{const w=272/ks.length-6,x=14+j*(w+6),sel=B.kind===k;btn(x,1178,w,50,LL(SKN[k]),()=>{B.kind=k;sfx('btn');if(run.sauce>0&&live&&run.lock<=0){B.aim='sauce';B.sel=-1;}},{col:sel?'#ffd93d':CREAM,dk:sel?YEL_D:'#d9c8a8',tc:INK,sz:20,r:18});});}}
  // 첫 판 손가락
  if(run.si===0&&run.ws==='prep'&&B.sel<0&&!adOv){if(!run.spots.some(sp=>sp.tw)&&!S.tips.t_build){const sp=run.spots.slice().sort((a,b)=>Math.abs(a.y-300)-Math.abs(b.y-300))[0];icoHand(sp.x*K+26,sp.y*K+40,B.time);}else if(run.spots.some(sp=>sp.tw)&&!S.tips.t_start)icoHand(560,1330,B.time);}
}
function drawRevive(){
  g.fillStyle='rgba(40,24,12,.6)';g.fillRect(0,0,VW,VH);BT.length=0;panel(75,420,600,470,CREAM,36);
  drawImg('didi_sick',375,590,130);txt(L('간식을 다 뺏겼어요!','点心全被偷走了！'),375,640,44,INK);txt(L('간식 10개를 다시 채워 볼까요? (한 판에 1번)','补充 10 份点心再坚持一下？（每局 1 次）'),375,694,23,'#a07a55');
  btn(125,738,500,96,L('▶ 광고 보고 이어 하기','▶ 看广告继续'),()=>showAd('revive',o=>{if(o)revive(run);}),{col:YEL,dk:YEL_D,tc:INK,sz:32});
  btn(255,920,240,70,L('그만하기','不用了'),()=>{sfx('btn');giveUp(run);},{col:GREY,dk:GREY_D,sz:26});
}
function drawPause(){
  g.fillStyle='rgba(40,24,12,.6)';g.fillRect(0,0,VW,VH);BT.length=0;panel(115,380,520,560,CREAM,36);txt(L('잠깐 쉬는 중','暂停中'),375,450,46,INK);
  btn(175,510,400,96,L('계속하기','继续'),()=>{paused=false;sfx('btn');},{sz:36});
  btn(175,636,400,84,L('처음부터 다시','重新开始'),()=>{sfx('btn');track('stage_quit',{stage:run.si+1,wave:run.wave});startBattle(run.si,0,run.hard);},{col:MINT,dk:MINT_D,sz:30});
  btn(175,746,400,84,L('나가기','退出'),()=>{sfx('btn');track('stage_quit',{stage:run.si+1,wave:run.wave});goHome();},{col:GREY,dk:GREY_D,sz:30});
  btn(175,856,190,64,L('음악 ','音乐 ')+(S.opt.bgm?'ON':'OFF'),()=>{S.opt.bgm^=1;musicSync();persist();},{col:CREAM,dk:'#d9c8a8',tc:INK,sz:22});
  btn(385,856,190,64,L('효과음 ','音效 ')+(S.opt.sfx?'ON':'OFF'),()=>{S.opt.sfx^=1;persist();},{col:CREAM,dk:'#d9c8a8',tc:INK,sz:22});
}
function drawBattle(){
  const sh=S.opt.shake?B.shake:0;g.save();if(sh>.4)g.translate(rnd(-sh,sh),rnd(-sh,sh));
  g.drawImage(B.map,0,0);g.save();g.scale(K,K);drawSea();drawDecals();drawSalt();drawSpots();drawEnemies();drawMarks();drawTowers();drawProj();drawFx();g.restore();g.restore();
  drawHud();drawMenu();
  if(run.phase==='revive')drawRevive();else if(paused)drawPause();else if(run.phase==='pick')drawPick();
}
function drawSea(){ // 물결 반짝임과 파도선(배경 위에 살짝)
  if(IMG['bg_'+(run.S.theme+1)])return;
  const t=B.time;g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=2.5;g.lineCap='round';g.beginPath();for(let x=0;x<=W;x+=18){const y=shoreY(x)+2+Math.sin(x*.07+t*2)*2.5;if(x)g.lineTo(x,y);else g.moveTo(x,y);}g.stroke();
  g.strokeStyle='rgba(255,255,255,.3)';g.lineWidth=2;for(let i=0;i<5;i++){const x=40+i*92+Math.sin(t*.7+i)*14,y=74+(i%2)*22+Math.sin(t*1.3+i*2)*3;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+12,y-5,x+24,y);g.stroke();}
}

/* ---------- 조작 (누르기만) ---------- */
function battleDown(){}
function battleUp(x,y){
  if(paused||adOv||run.phase!=='run')return false;const lx=x/K,ly=y/K;
  if(B.aim==='sauce'&&B.kind==='salt'){if(ly>60&&ly<735){if(castSalt(run,lx,ly)){B.aim='';mission('skill',1);track('sauce',{id:'salt'});}else sfx('nope');}else{B.aim='';}return true;}
  if(B.aim==='sauce'){let bi=-1,bd=44*44;run.spots.forEach((sp,i)=>{if(!sp.tw)return;const d=(sp.x-lx)**2+(sp.y-16-ly)**2;if(d<bd){bd=d;bi=i;}});if(bi>=0)useSauce(bi);else{B.aim='';sfx('btn');}return true;}
  let best=-1,bd=34*34;run.spots.forEach((sp,i)=>{const d=(sp.x-lx)**2+(sp.y-12-ly)**2;if(d<bd){bd=d;best=i;}});
  if(best>=0){const tw=run.spots[best].tw;if(tw&&tw.ink>0){cleanInk(run,best);return true;}B.sel=B.sel===best?-1:best;B.pick='';sfx('btn');return true;}
  if(B.sel>=0){B.sel=-1;B.pick='';return true;}return false;
}

/* ============================== 판 밖 화면: 홈 · 영웅 · 보상 · 설정 · 결과, 그리고 전체 진행 ============================== */
const APP={hidden:false,t:0,toast:null,errs:0,lastErr:'',playSec:0,loadT:0,bot:false,resetArm:0};
let scr='load',RES=null;
const AN=[['금빛 모래사장','金色沙滩'],['갯바위 골목','礁石小巷'],['산호초 정원','珊瑚花园'],['해적섬 부두','海盗岛码头'],['용궁 문턱','龙宫门前']];
const stageLabel=si=>(Math.floor(si/PER_AREA)+1)+'-'+(si%PER_AREA+1);
const stageName=si=>stageLabel(si)+'  '+LL(AN[Math.floor(si/PER_AREA)%AN.length]);
/* 이야기: 구역마다 들어갈 때 한 번, 보스를 배불리면 한 번 */
const STORY=[
  {t:['해변 야시장 축제 첫날이에요. 만두 찌는 냄새가 바다까지 퍼지자 배고픈 바다 친구들이 몰려왔어요. 퇀퇀은 쫓아내는 대신, 배불리 먹여서 돌려보내기로 했어요.','海滩夜市开张的第一天。蒸包子的香味飘到了海里，饿坏了的小海怪们全都跑来了。团团决定不赶它们走，而是让它们吃饱了再回家。'],
   e:['왕꽃게가 배를 두드리며 말했어요. "고마워… 사실 용궁 식당이 문을 닫아서 다들 굶고 있었어."','大螃蟹拍着肚子说："谢谢……其实龙宫食堂关门了，大家都饿着呢。"']},
  {t:['소문이 갯바위 골목까지 퍼졌어요. 입맛 까다로운 편식쟁이들과 장난꾸러기 문어 떼가 골목을 가득 메웠어요.','消息传到了礁石小巷。挑食的客人和爱恶作剧的章鱼把小巷挤得满满的。'],
   e:['문어 대장이 먹물로 지도를 그려 줬어요. 용궁으로 가는 길이래요.','章鱼老大用墨汁画了一张地图，说那是去龙宫的路。']},
  {t:['산호초 정원은 용궁으로 가는 길목이에요. 하늘에서는 갈매기가, 바다에서는 대식가들이 간식을 노려요.','珊瑚花园是去龙宫的必经之路。天上有海鸥，海里有大胃王，都盯着小吃呢。'],
   e:['고래상어가 귀띔했어요. "용궁 요리사가 사라졌대. 해적 거북이 뭔가 안다던데?"','鲸鲨悄悄说："听说龙宫的厨师不见了，海盗龟好像知道些什么。"']},
  {t:['해적섬 부두예요. 해적 거북은 간식을 통째로 훔쳐 용궁에 가져가려 해요. 훔치지 않아도 배부를 수 있다는 걸 보여 줘요!','这里是海盗岛码头。海盗龟想把小吃整车偷去龙宫。让它知道，不用偷也能吃饱！'],
   e:['배부른 해적 거북이 털어놨어요. "꼬마 용왕님이 배고파서 우셔. 요리사가 긴 휴가를 떠났거든."','吃饱的海盗龟说了实话："小龙王饿得直哭，因为厨师休长假去了。"']},
  {t:['드디어 용궁 문턱이에요. 배고픈 꼬마 용왕이 마지막 손님이에요. 야시장의 모든 간식으로 대접해요!','终于到了龙宫门前。饿肚子的小龙王是最后一位客人，用夜市所有的小吃招待它吧！'],
   e:['꼬마 용왕이 활짝 웃었어요. 용궁 앞에 퇀퇀 야시장 2호점이 문을 열었답니다. 이제 손님들은 줄을 서서 차례를 기다려요.','小龙王开心地笑了。龙宫门口开了团团夜市二号店，从此客人们都乖乖排队啦。']},
];
function tryStart(si){const a=Math.floor(si/PER_AREA);if(!S.tips['story'+a]){S.tips['story'+a]=1;APP.story={a,si};scr='story';persist();}else startBattle(si);}
function toast(s){APP.toast={s,t:2.2};}
function today(){const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}

/* ---------- 매일 보상 ---------- */
const MIS={run:[2,60,['출전 2번','出战 2 次']],kill:[120,80,['손님 120명 배불리기','喂饱 120 位客人']],skill:[5,60,['비법 양념 5번 쓰기','使用秘制酱料 5 次']],build:[12,60,['가게 12개 차리기','摆 12 个小吃摊']],
  win:[1,100,['한 판 클리어','通关 1 次']],up:[1,60,['가게 숙련 1번 올리기','提升 1 次摊位熟练度']]};
const CHEST=[],LOGIN=[50,80,120,160,200,260,500],BOX_MAX=3;for(let s=3;s<=STAGES.length*6;s+=3)CHEST.push([s,100+s*12]);
function dailyInit(){const t=today();if(S.day===t&&S.mis.length===3)return;S.day=t;let seed=0;for(const ch of t)seed=(seed*31+ch.charCodeAt(0))>>>0;
  const r=makeRng(seed),ids=Object.keys(MIS),pick=[];while(pick.length<3)pick.push({id:ids.splice(Math.floor(r()*ids.length),1)[0],p:0,got:0});S.mis=pick;S.box={day:t,n:0};persist();}
function mission(id,n){for(const m of S.mis)if(m.id===id&&!m.got)m.p=Math.min(MIS[id][0],m.p+n);}
const idleRate=()=>40+12*S.cleared;
function idleAmt(){const h=Math.min(8,Math.max(0,(Date.now()-S.idleAt)/3600000));return Math.floor(h*idleRate());}
const starSum=()=>S.stars.reduce((a,b)=>a+b,0)+S.hstars.reduce((a,b)=>a+b,0);
const hardOpen=si=>S.cleared>=(Math.floor(si/PER_AREA)+1)*PER_AREA&&(si%PER_AREA===0||S.hstars[si-1]>0);
const loginReady=()=>S.login.last!==today();
const chestReady=()=>S.chest<CHEST.length&&starSum()>=CHEST[S.chest][0];
function rewardBadge(){return loginReady()||chestReady()||idleAmt()>=idleRate()||S.mis.some(m=>!m.got&&m.p>=MIS[m.id][0]);}
function gain(n,why){S.coins+=n;sfx('reward');toast('+'+n+L(' 동전',' 金币'));track('reward',{why,n});persist();}
const avgLv=()=>{const ids=TOWER_IDS.filter(id=>S.lv[id]);let s=0;for(const id of ids)s+=S.lv[id];return Math.round(s/ids.length);};

function goHome(){scr='home';run=null;B=null;paused=false;wantMusic('menu');dailyInit();S.sel=Math.max(0,Math.min(S.sel,S.cleared,STAGES.length-1));persist();}
function endBattle(){
  const won=run.won,si=run.si,unlock=[],hard=run.hard;let first=0,sauce='';
  if(won&&hard){S.stat.wins++;mission('win',1);if(S.hstars[si]===0)first=firstBonus(si)*2;S.hstars[si]=Math.max(S.hstars[si],run.stars);if(STAGES[si].boss)for(const k in SAUCE_AT)if(SAUCE_AT[k]===STAGES[si].area&&!S.sauces[k]){S.sauces[k]=1;sauce=k;}}
  else if(won){S.stat.wins++;mission('win',1);if(S.stars[si]===0){first=firstBonus(si);if(STAGES[si].boss)toast(L('매운맛이 열렸어요! 지도에서 도전해요','麻辣模式开启！去地图挑战吧'));}S.stars[si]=Math.max(S.stars[si],run.stars);if(S.cleared<si+1)S.cleared=si+1;
    for(const id in UNLOCK)if(S.cleared>=UNLOCK[id]&&!S.lv[id]){S.lv[id]=1;unlock.push(id);}}
  mission('kill',run.kills);S.stat.kills+=run.kills;S.coins+=run.reward+first;
  RES={won,si,hard,sauce,stars:run.stars,reward:run.reward,first,unlock,doubled:false,t:0,wave:run.wave,waves:run.S.waves};
  track(won?'stage_clear':'stage_fail',{stage:si+1,hard:hard?1:0,wave:run.wave,stars:run.stars,sec:Math.round(run.t/60)});scr='result';wantMusic('menu');persist();
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
  txt(L('퇀퇀 해변 야시장','团团海滩夜市'),375,520,64,'#fff','center',INK,16);bar(175,640,400,40,p,MINT);
  txt(APP.loadT>6?L('인터넷이 느려 시간이 걸리고 있어요','网络较慢，请稍等一下'):L('해변으로 가는 중…','正在前往海滩…'),375,720,26,INK);
  if(p>=1||APP.loadT>25){if(p<1)toast(L('그림을 다 받지 못했어요. 새로고침해 주세요','部分图片未加载，请刷新重试'));track('load_done',{sec:Math.round(APP.loadT),ok:p>=1?1:0});optPump();goHome();}
}

function drawHome(){
  backdrop(.42);const t=APP.t,si=S.sel,st=STAGES[si],own=TOWER_IDS.filter(id=>S.lv[id]);
  panel(20,30,210,70,CREAM,22);icoCoin(54,65,19);txtFit(S.coins,132,66,30,130,INK);
  btn(646,26,84,78,'',()=>{sfx('btn');scr='settings';},{col:CREAM,dk:'#d9c8a8',icon:(x,y)=>{g.fillStyle=INK;for(let i=-1;i<2;i++){rr(x-20,y+i*15-4,40,8,4);g.fill();}}});
  btn(552,26,84,78,'?',()=>{sfx('btn');APP.page=0;scr='guide';track('guide_open');},{col:CREAM,dk:'#d9c8a8',tc:INK,sz:44});
  txt(L('퇀퇀 해변 야시장','团团海滩夜市'),375,196,LANG==='zh'?92:74,'#fff','center',INK,20);
  txt(L('간식 가게를 차려 배고픈 바다 손님을 배불려 돌려보내요','摆好小吃摊，把馋嘴的小海怪喂饱送回家'),375,268,25,INK,'center','#fff',6);
  own.forEach((id,i)=>{const n=own.length,x=375+(i-(n-1)/2)*(n>4?112:128),b=Math.sin(t*3+i)*.03;drawImg(id==='tt'?'tt_cheer':HERO_IMG[id],x,520,id==='tt'?180:150,{sx:1+b,sy:1-b});});
  panel(60,560,630,330,CREAM,36);
  txt(stageName(si),375,612,40,INK);btn(574,576,104,56,L('지도','地图'),()=>{sfx('btn');APP.area=Math.floor(S.sel/PER_AREA);scr='map';},{col:MINT,dk:MINT_D,sz:24,r:18});
  for(let i=0;i<3;i++)icoStar(315+i*60,672,24,i<S.stars[si]);
  const ks=st.kinds.concat([st.boss||'elite']);ks.forEach((k,i)=>{const x=375+(i-(ks.length-1)/2)*Math.min(92,560/ks.length),boss=i===ks.length-1;drawSpr(k,x,762,boss?108:Math.min(78,480/ks.length));});
  const low=avgLv()<st.rec;txt(L('권장 가게 숙련 Lv.','推荐熟练度 Lv.')+st.rec+L('  ·  내 평균 Lv.','  ·  我的平均 Lv.')+avgLv(),375,826,24,low?RED:'#3a9478');
  txt(L('파도 ','共 ')+st.waves+L('번  ·  길 ',' 波  ·  路线 ')+st.paths.length+L('갈래  ·  가게 자리 ',' 条  ·  摊位 ')+st.spots,375,860,21,'#a07a55');
  if(si>0)btn(20,690,70,90,'‹',()=>{sfx('btn');S.sel--;},{col:CREAM,dk:'#d9c8a8',tc:INK,sz:56});
  if(si<Math.min(S.cleared,STAGES.length-1))btn(660,690,70,90,'›',()=>{sfx('btn');S.sel++;},{col:CREAM,dk:'#d9c8a8',tc:INK,sz:56});
  const pu=1+Math.sin(t*4)*.015;g.save();g.translate(375,975);g.scale(pu,pu);g.translate(-375,-975);btn(165,918,420,116,L('출전!','出发！'),()=>{sfx('btn');tryStart(S.sel);},{sz:56});g.restore();
  btn(50,1082,310,104,L('가게','小吃摊'),()=>{sfx('btn');scr='heroes';tipOnce('heroes',L('동전으로 가게 숙련을 올리면 모든 판에서 더 맛있어져요','用金币提升熟练度，每一关都更美味'));},{col:MINT,dk:MINT_D,sz:40,dot:TOWER_IDS.some(id=>S.lv[id]&&S.lv[id]<MAX_LV&&S.coins>=lvCost(S.lv[id]))});
  btn(390,1082,310,104,L('보상','奖励'),()=>{sfx('btn');scr='reward';},{col:YEL,dk:YEL_D,tc:INK,sz:40,dot:rewardBadge()});
  if(APP.playSec>1800){panel(150,300,450,74,'#fffdf3',30);txt(L('오래 했어요. 잠깐 쉬어 가요!','玩了很久啦，休息一下吧！'),375,338,26,INK);}
  if(LANG==='zh'){txt('抵制不良游戏，拒绝盗版游戏。注意自我保护，谨防受骗上当。',375,1232,17,'#7a5a3c');txt('适度游戏益脑，沉迷游戏伤身。合理安排时间，享受健康生活。',375,1258,17,'#7a5a3c');}
  txt('v'+BUILD+(Object.keys(IMG_FAIL).length?L(' · 그림 일부 실패: 새로고침',' · 部分图片失败：请刷新'):''),375,1306,17,'#a07a55');
}
function tipOnce(key,s){if(!S.tips[key]){S.tips[key]=1;toast(s);APP.toast.t=4;persist();}}

function drawHeroScr(){
  backdrop(.62);topBar(L('가게','小吃摊'),1);
  TOWER_IDS.forEach((id,i)=>{const y=128+i*172,own=!!S.lv[id],lv=S.lv[id]||0,b=TOWERS[id];
    panel(24,y,702,156,own?CREAM:'#e9e2d6',28);g.fillStyle=own?HCOL[id]:'#d6cec0';rr(36,y+12,132,132,22);g.fill();drawImg(HERO_IMG[id],102,y+140,118,{a:own?1:.45});
    txt(LL(HN[id]),186,y+38,34,own?INK:'#8f8475','left');
    if(own){font(34);txt('Lv.'+lv,200+g.measureText(LL(HN[id])).width,y+40,26,RED_D,'left');}
    txtFit(LL(TROLE[id]),186,y+80,21,own?326:500,'#8a6a4a','left');
    if(!own){txt(L('','通关 ')+stageLabel(UNLOCK[id]-1)+L(' 을 깨면 개업',' 后开张'),186,y+122,22,'#8f8475','left');return;}
    txtFit(L('맛 ','美味 ')+Math.round(heroMul(lv)*100)+'%  ·  '+L('값 ','开摊 ')+b.cost+'  ·  '+L('주인 ','摊主 ')+LL(OWNER[id]),186,y+122,21,326,'#3a9478','left');
    if(lv>=MAX_LV)txt('MAX',620,y+78,30,'#d99a1e');
    else{const c=lvCost(lv);btn(524,y+30,186,96,'',()=>{if(S.coins<c){sfx('nope');toast(L('동전이 모자라요','金币不够'));return;}S.coins-=c;S.lv[id]=lv+1;mission('up',1);sfx('up');track('hero_up',{id,lv:lv+1});persist();},{col:S.coins>=c?RED:GREY,dk:S.coins>=c?RED_D:GREY_D,icon:(x,yy)=>{txt(L('숙련 올리기','提升熟练'),x,yy-18,24,'#fff','center',INK);icoCoin(x-36,yy+20,13);txt(c,x+12,yy+21,24,'#fff','center',INK,5);}});}
  });
  txt(L('숙련은 모든 판에서 그 가게의 맛을 올려요 (단계마다 +7%)','熟练度会提升该摊位在每一关的美味（每级 +7%）'),375,1190,22,INK);
  txt(L('판 안에서 가게 키우기(1~3단계·새 메뉴)는 그 판의 골드로 해요','关卡内的升级与新菜单使用当局金币'),375,1226,21,'#7a5a3c');
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
  y=1074;panel(24,y,702,130,CREAM,28);const left=BOX_MAX-(S.box.day===today()?S.box.n:0),bv=100+20*S.cleared;drawImg('gift',76,y+110,84);
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
  txt(L('출전 ','出战 ')+S.stat.runs+L('번 · 클리어 ',' 次 · 通关 ')+S.stat.wins+L('번 · 배불린 손님 ',' 次 · 喂饱客人 ')+S.stat.kills,375,1090,22,'#7a5a3c');
  txt('v'+BUILD+' · '+PLAT,375,1130,20,'#a07a55');
}
const GUIDE=[
  [['이야기','故事'],['해변 야시장 축제 날, 만두 찌는 냄새가 바다까지 퍼졌어요.\n\n냄새에 이끌린 배고픈 바다 친구들이 마을 간식을 노리고 몰려와요.\n\n퇀퇀과 친구들은 쫓아내는 대신 간식 가게를 차려 배불리 먹여 돌려보내기로 했어요.\n\n그런데 바다 친구들은 왜 이렇게 배가 고플까요? 다섯 구역을 지나 용궁 문턱까지 가면 알 수 있어요.\n\n이 게임에는 싸움이 없어요. 모두 배부르고 기분 좋게 집에 돌아가요.','海滩夜市开张那天，蒸包子的香味一直飘到了海里。\n\n闻到香味的小海怪们饿着肚子，盯上了小镇的点心。\n\n团团和伙伴们决定不赶走它们，而是摆好小吃摊，让它们吃饱了再回家。\n\n可是，小海怪们为什么这么饿呢？穿过五个区域，走到龙宫门前就知道啦。\n\n这个游戏里没有打斗，大家都吃得饱饱的，开开心心回家。']],
  [['이렇게 해요','怎么玩'],['① 빈 모래 자리를 눌러 간식 가게를 차려요.\n\n② 배고픈 바다 손님이 바다에서 길을 따라 마을로 와요.\n\n③ 가게가 간식을 던져 줘요. 머리 위 막대가 다 차면 배불러서 바다로 돌아가요.\n\n④ 놓친 손님은 마을 간식을 훔쳐 가요. 간식이 0이 되면 끝!\n\n⑤ 파도를 모두 넘기면 클리어. 간식을 18개 이상 지키면 별 3개예요.','① 点空沙堆摆小吃摊。\n\n② 馋嘴的小海怪会从海里沿着路走向小镇。\n\n③ 小吃摊会自动投喂。头顶的条满了，它就吃饱回海里。\n\n④ 没喂饱的客人会偷走小镇的点心，点心为 0 就结束！\n\n⑤ 撑过所有波次就通关，守住 18 份以上点心是 3 星。']],
  [['가게 6종','6 种小吃摊'],null],
  [['매운맛','麻辣模式'],['구역 보스를 배불리면 그 구역의 매운맛이 지도에서 열려요.\n\n매운맛 손님은 눈치가 빨라서 양념 특식에 대응해요.\n\n· 1구역: 양동이 꽃게가 특식을 한 번 막아요\n· 2구역: 문어가 꽉 찬 양념통에 먹물을 뿌려요\n· 3구역: 갈매기가 솟아올라 특식을 피해요\n· 4구역: 거북·소라게도 등껍질로 막아요\n· 5구역: 꼬마 용왕도 막아요\n\n매운맛 보스를 배불리면 새 양념을 받아요.\n\n· 굵은소금 (1구역): 길에 뿌려 손님을 세워요\n· 먹물 간장 (2구역): 눈을 가려 6초 동안 대응을 못 하게 해요','喂饱区域BOSS后，地图里会开启该区的麻辣模式。\n\n麻辣客人很机灵，会应对酱料大招。\n\n· 1区：水桶蟹挡一次大招\n· 2区：章鱼往装满的酱料罐喷墨\n· 3区：海鸥飞高躲开大招\n· 4区：海龟和寄居蟹也用壳来挡\n· 5区：小龙王也会挡\n\n喂饱麻辣BOSS可以得到新酱料。\n\n· 粗盐（1区）：撒在路上让客人停下\n· 墨鱼酱油（2区）：蒙住眼睛，6 秒内无法应对']],
  [['손님마다 특기가 있어요','每位客人都有绝活'],['해파리: 가끔 투명해져요 → 만두·팝콘·찹쌀떡(범위)으로\n\n날치: 뛰어올라 땅 간식을 넘어가요 → 빙수로 느리게 하면 못 뛰어요\n\n복어: 놀라면 부풀어 편식이 심해져요 → 빙수와 차는 그대로 먹어요\n\n소라게: 껍데기에 숨어요 → 만두·팝콘에 깜짝 놀라 튀어나와요\n\n문어: 가게에 먹물을 뿌려요 → 가게를 눌러 닦아요\n\n갈매기: 길을 무시하고 날아와 간식 2개를 낚아채요 → 만두·찹쌀떡은 하늘에 못 닿아요\n\n거북: 배가 반쯤 차면 달려요 → 미리 느리게\n\n새우: 처음 맞으면 앞으로 톡 튀어요\n\n양동이 꽃게: 투구가 6번 튕겨 내요 → 빠른 빙수로 벗겨요','水母：偶尔变透明 → 用包子、爆米花、年糕（范围）\n\n飞鱼：跳起来越过地面投喂 → 用刨冰减速就跳不起来\n\n河豚：受惊会鼓起来更挑食 → 刨冰和茶照吃\n\n寄居蟹：会躲进壳里 → 包子、爆米花能把它吓出来\n\n章鱼：朝小吃摊喷墨汁 → 点一下摊位擦干净\n\n海鸥：不走路直接飞来，抢走 2 份点心 → 包子和年糕够不着天上\n\n海龟：吃到半饱会冲刺 → 提前减速\n\n小虾：第一次被喂到会往前一蹿\n\n水桶螃蟹：头盔能挡 6 次 → 用出手快的刨冰打掉']],
  [['잘하는 요령','小窍门'],['· 길이 꺾이는 안쪽에 차리면 더 오래 먹일 수 있어요.\n\n· 가게를 누르면 키울 수 있어요. 3단계 다음엔 새 메뉴 두 가지 중 하나를 골라요.\n\n· 다음 파도를 미리 부르면 남은 시간만큼 골드를 더 받아요.\n\n· 손님을 배불리면 비법 양념이 차요. 가게에 뿌리면 그 가게만의 특식이 터져요 (만두 비, 눈보라, 팝콘 불꽃놀이…).\n\n· 파도 2·5·8·11번을 넘기면 「오늘의 특선」 카드 3장 중 하나를 골라요. 같은 카드는 겹칠수록 세져요.\n\n· 막히면 가게 화면에서 동전으로 숙련을 올려요. 모든 판에서 더 맛있어져요.\n\n· 가게를 팔면 쓴 골드의 70%를 돌려받아요.','· 把摊位摆在拐弯内侧，能喂得更久。\n\n· 点一下摊位可以升级，3 级之后从两种新菜单里选一个。\n\n· 提前叫下一波，可按剩余时间多拿金币。\n\n· 喂饱客人能攒秘制酱料，加到小吃摊上会放出招牌大招（包子雨、暴风雪、爆米花烟花…）。\n\n· 过了第 2·5·8·11 波，可以从 3 张“今日特选”里挑一张，同一张越叠越强。\n\n· 卡关时去小吃摊界面用金币提升熟练度，每一关都更美味。\n\n· 出售摊位可返还 70% 金币。']],
];
function drawGuide(){
  backdrop(.75);topBar(L('안내서','玩法指南'),1);const n=GUIDE.length,pg=Math.max(0,Math.min(n-1,APP.page||0)),G=GUIDE[pg];panel(40,140,670,960,CREAM,30);
  txt(LL(G[0]),375,196,36,RED_D);
  if(G[1])wrap(LL(G[1]),80,258,LL(G[1]).length>230?21:24,590,LL(G[1]).length>230?30:36,INK,'left');
  else TOWER_IDS.forEach((id,i)=>{const y=240+i*140;g.fillStyle=HCOL[id];rr(70,y,110,120,20);g.fill();g.lineWidth=3;g.strokeStyle=INK;g.stroke();stallIcon(id,125,y+96,1);txt(LL(HN[id]),200,y+30,28,INK,'left');wrap(LL(TROLE[id]),200,y+68,21,480,30,'#8a6a4a','left',2);});
  for(let i=0;i<n;i++){g.fillStyle=i===pg?RED:'#d9c8a8';circ(375+(i-(n-1)/2)*34,1070,9);g.fill();}
  btn(60,1124,300,88,L('‹ 앞으로','‹ 上一页'),()=>{sfx('btn');APP.page=pg-1;},{col:CREAM,dk:'#d9c8a8',tc:INK,sz:30,off:pg===0});
  btn(390,1124,300,88,pg===n-1?L('알겠어요!','知道啦！'):L('다음 ›','下一页 ›'),()=>{sfx('btn');if(pg===n-1)goHome();else APP.page=pg+1;},{sz:30});
}
function drawMap(){
  const a=Math.max(0,Math.min(AREAS.length-1,APP.area||0));backdrop(.7);topBar(L('지도','地图'),1);panel(40,130,670,250,CREAM,30);
  const H=!!APP.hard&&S.cleared>=PER_AREA,SS=H?S.hstars:S.stars;
  txt(L('제 ','第 ')+(a+1)+L(' 구역 · ',' 区 · ')+LL(AN[a])+(H?L(' · 매운맛',' · 麻辣'):''),375,176,36,RED_D);wrap(H?LL(HT[a])+L('\n권장 숙련 +4 · 보상 1.6배 · 첫 클리어 보너스 2배','\n推荐熟练度 +4 · 奖励 1.6 倍 · 首通奖励 2 倍'):LL(STORY[a].t),76,224,21,598,29,'#7a5a3c','left',5);
  for(let n=0;n<PER_AREA;n++){const si=a*PER_AREA+n,x=52+(n%5)*132,y=410+Math.floor(n/5)*236,open=H?hardOpen(si):si<=S.cleared,st=STAGES[si],cur=!H&&si===S.sel;
    btn(x,y,118,206,'',()=>{sfx('btn');if(H){startBattle(si,0,true);return;}S.sel=si;persist();goHome();},{off:!open,col:H?'#ffd9cc':cur?'#ffe9a8':CREAM,dk:'#d9c8a8',r:24,offFn:()=>{sfx('nope');toast(H&&S.cleared<(a+1)*PER_AREA?L('이 구역의 보스를 먼저 배불려요','请先喂饱本区的BOSS'):L('앞의 판을 먼저 깨요','请先通过前一关'));},icon:(cx,cy)=>{
      txt(stageLabel(si),cx,cy-70,26,open?INK:'#a39a8c');if(st.boss)drawSpr(st.boss,cx,cy-2,96,{a:open?1:.4});else if(st.mid)drawSpr('elite',cx,cy-4,70,{a:open?1:.4});else drawSpr(st.kinds[Math.min(2,st.kinds.length-1)],cx,cy-4,58,{a:open?1:.4});
      for(let k=0;k<3;k++)icoStar(cx-30+k*30,cy+66,12,k<SS[si]);}});}
  if(S.cleared>=PER_AREA)btn(225,1070,300,76,H?L('보통맛으로','回到普通'):L('매운맛 도전','挑战麻辣'),()=>{sfx('btn');APP.hard=!H;},{col:H?MINT:RED,dk:H?MINT_D:RED_D,sz:28});
  const ss=SS.slice(a*PER_AREA,(a+1)*PER_AREA).reduce((p,q)=>p+q,0);txt(L('이 구역의 별 ','本区星星 ')+ss+' / '+PER_AREA*3,375,912,24,INK);
  btn(60,960,300,88,L('‹ 앞 구역','‹ 上一区'),()=>{sfx('btn');APP.area=a-1;},{col:CREAM,dk:'#d9c8a8',tc:INK,sz:28,off:a===0});
  const nextOpen=a<AREAS.length-1&&S.cleared>=(a+1)*PER_AREA;btn(390,960,300,88,L('다음 구역 ›','下一区 ›'),()=>{sfx('btn');APP.area=a+1;},{col:CREAM,dk:'#d9c8a8',tc:INK,sz:28,off:!nextOpen,offFn:()=>{sfx('nope');toast(a<AREAS.length-1?L('이 구역의 보스를 먼저 배불려요','请先喂饱本区的BOSS'):L('다음 구역은 준비 중이에요','下一区正在准备中'));}});
}
function drawStory(){
  const s=APP.story,a=s.a;g.drawImage(BG,0,0);g.fillStyle='rgba(40,24,12,.55)';g.fillRect(0,0,VW,VH);BT.length=0;panel(60,300,630,640,CREAM,40);
  if(IMG['st_'+(a+1)])drawImg('st_'+(a+1),375,300,330);else drawImg('tt_cheer',375,470,220);txt(L('제 ','第 ')+(a+1)+L(' 구역','区'),375,512,26,'#a07a55');txt(LL(AN[a]),375,560,46,RED_D);
  wrap(LL(STORY[a].t),110,630,25,530,37,INK,'left',6);
  btn(175,836,400,84,L('출발!','出发！'),()=>{sfx('btn');track('story',{area:a+1});startBattle(s.si);},{sz:36});
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
  txt(r.won?L('모두 배불렀어요!','全都喂饱啦！'):L('아쉬워요!','差一点点！'),375,470,56,r.won?RED:INK);
  txt(stageName(r.si)+(r.hard?L('  ·  매운맛','  ·  麻辣'):'')+(r.won?'':'  ·  '+L('파도 ','到第 ')+r.wave+' / '+r.waves+L('',' 波')),375,528,26,'#8a6a4a');
  for(let i=0;i<3;i++){const on=i<r.stars,pop=on?Math.min(1,Math.max(0,(r.t-.3-i*.25)*5)):1;icoStar(275+i*100,608,(i===1?46:40)*(on?(.6+.4*pop):1),on&&pop>0);}
  if(r.won&&STAGES[r.si].boss&&!r.hard){wrap(LL(STORY[STAGES[r.si].area].e),375,660,19,560,25,'#8a6a4a','center',2);}
  else if(r.won&&r.stars<3)txt(L('간식을 18개 이상 지키면 별 3개','守住 18 份以上点心就是 3 星'),375,672,21,'#a07a55');
  if(!r.won)txt(L('가게 숙련을 올리거나, 길이 꺾이는 곳에 차려 봐요','试试提升熟练度，或把摊位摆在拐弯处'),375,672,23,'#a07a55');
  icoCoin(270,740,30);txt('+'+(r.reward*(r.doubled?2:1)+r.first),400,742,54,INK);
  if(r.first)txt(L('첫 클리어 보너스 +','首次通关奖励 +')+r.first,375,796,22,'#3a9478');
  let y=822;
  if(r.sauce){g.fillStyle='#ffe0d6';rr(110,y,530,96,24);g.fill();g.lineWidth=4;g.strokeStyle=INK;g.stroke();icoSauce(166,y+48,30);txt(L('새 양념 · ','新酱料 · ')+LL(SKN[r.sauce])+'!',400,y+30,30,RED_D);txtFit(LL(SKD[r.sauce]),400,y+68,19,440,'#8a6a4a');y+=110;}
  if(r.unlock.length){const id=r.unlock[0];g.fillStyle=HCOL[id];rr(110,y,530,84,24);g.fill();g.lineWidth=4;g.strokeStyle=INK;g.stroke();drawImg(HERO_IMG[id],170,y+82,84);txt(L('새 가게 ','新摊位 ')+r.unlock.map(q=>LL(HN[q])).join('·')+L(' 개업!',' 开张啦！'),400,y+43,30,INK);y+=98;}
  if(!r.doubled&&r.reward>0)btn(150,y,450,76,L('▶ 광고 보고 동전 2배','▶ 看广告金币翻倍'),()=>showAd('double',o=>{if(o){r.doubled=true;S.coins+=r.reward;sfx('reward');persist();}}),{col:YEL,dk:YEL_D,tc:INK,sz:30});
  if(r.won){btn(100,1012,270,76,L('한 번 더','再来一次'),()=>{sfx('btn');startBattle(r.si,0,r.hard);},{col:MINT,dk:MINT_D,sz:28});
    if(r.hard)btn(390,1012,260,76,L('지도로','回地图'),()=>{sfx('btn');goHome();APP.area=STAGES[r.si].area;APP.hard=true;scr='map';},{sz:28});else
    btn(390,1012,260,76,r.si<STAGES.length-1?L('다음 판으로','下一关'):L('홈으로','回主页'),()=>{sfx('btn');if(r.si<STAGES.length-1)S.sel=r.si+1;goHome();},{sz:28});
    if(API||(typeof navigator!=='undefined'&&navigator.share))btn(610,226,64,60,'',()=>shareGame(),{col:CREAM,dk:'#d9c8a8',icon:(x,yy)=>{g.strokeStyle=INK;g.lineWidth=5;g.lineCap='round';g.beginPath();g.moveTo(x,yy+12);g.lineTo(x,yy-12);g.moveTo(x-10,yy-3);g.lineTo(x,yy-13);g.lineTo(x+10,yy-3);g.stroke();}});}
  else{btn(100,1012,270,76,L('가게 숙련 올리기','提升熟练度'),()=>{sfx('btn');goHome();scr='heroes';},{col:MINT,dk:MINT_D,sz:28});btn(390,1012,260,76,L('다시 도전','再挑战'),()=>{sfx('btn');startBattle(r.si,0,r.hard);},{sz:28});}
}

/* ---------- 한 프레임 ---------- */
function draw(){
  if(API)g.setTransform(1,0,0,1,0,0),g.fillStyle='#bfe9f5',g.fillRect(0,0,cv.width,cv.height),g.setTransform(view.s,0,0,view.s,view.ox,view.oy);else g.setTransform(1,0,0,1,0,0);
  g.globalAlpha=1;BT=[];
  if(scr==='load')drawLoad();else if(scr==='home')drawHome();else if(scr==='battle')drawBattle();else if(scr==='result')drawResult();else if(scr==='heroes')drawHeroScr();else if(scr==='reward')drawReward();else if(scr==='settings')drawSettings();else if(scr==='guide')drawGuide();else if(scr==='map')drawMap();else if(scr==='story')drawStory();else drawPrivacy();
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
function botStep(){if(!run||scr!=='battle'||paused||run.phase==='revive'&&!revive(run))return;if(run.phase==='pick'){if(Math.random()<.05)pickCard(run,Math.floor(Math.random()*run.picks.length));return;}if(run.phase!=='run'||Math.random()>.2)return;
  const empty=run.spots.map((sp,i)=>i).filter(i=>!run.spots[i].tw),ids=run.owned;
  if(empty.length&&run.spots.length-empty.length<3+run.wave)build(run,empty[Math.floor(Math.random()*empty.length)],ids[Math.floor(Math.random()*ids.length)]);
  else{const up=run.spots.map((sp,i)=>i).filter(i=>run.spots[i].tw&&run.spots[i].tw.lv<4);if(up.length){const i=up[Math.floor(Math.random()*up.length)];upgrade(run,i,BRANCH[run.spots[i].tw.id][Math.floor(Math.random()*2)]);}}
  run.spots.forEach((sp,i)=>{if(sp.tw&&sp.tw.ink>0)cleanInk(run,i);});if(run.ws==='prep'&&run.spots.some(sp=>sp.tw))callWave(run);
  if(run.en.length>6&&run.sauce>0){const t=run.spots.map((sp,i)=>i).filter(i=>run.spots[i].tw);if(t.length)castSauce(run,t[Math.floor(Math.random()*t.length)]);}}
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

mkSprites();mkBg();MUST.forEach(n=>loadImg(n));LATER.forEach(n=>loadImg(n));optQ=OPT.slice();dailyInit();track('app_open',{lang:LANG});
if(DEBUG)window.__bepaDebug={get S(){return S;},get run(){return run;},get B(){return B;},APP,TRK,go:s=>{if(s==='home')goHome();else scr=s;},start:(i,h)=>startBattle(i||0,0,h),bot:b=>{APP.bot=!!b;},speed:n=>{speed=n;},
  give:n=>{S.coins+=n;},unlockAll:()=>{TOWER_IDS.forEach(id=>{if(!S.lv[id])S.lv[id]=1;});S.cleared=STAGES.length;},win:()=>{if(run)finish(run,true);},lose:()=>{if(run){run.lives=0;finish(run,false);}},
  au:()=>({state:AU.c&&AU.c.state,cur:MUS.cur,step:MUS.step,merr:MUS.err||0,mlast:MUS.last||'',serr:AU.err||0,slast:AU.lastErr||''}),sfx,wantMusic,
  scr:()=>scr,ad:()=>adOv,lang:l=>{LANG=l;},draw,core:{step,build,upgrade,sell,callWave,castSauce,castSalt,wipeJar,pickCard,rerollCards,gainSauce,cleanInk,inkTower,spawn,revive}};
requestAnimationFrame(frame);

})();
