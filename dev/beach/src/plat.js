/* ============================== 플랫폼 층: 화면·터치·저장·소리·광고·통계는 여기에만 둔다 ==============================
   위챗(wx)·더우인(tt)으로 옮길 때 이 파일만 손보면 된다. */
const BUILD='@@BUILD@@';
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
