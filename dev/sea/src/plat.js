const BUILD='@@BUILD@@';
/* ---------- 플랫폼: 웹 · 위챗(wx) · 더우인(tt) 자동 감지 ---------- */
const API=typeof wx!=='undefined'?wx:typeof tt!=='undefined'?tt:null,PLAT=typeof wx!=='undefined'?'wx':typeof tt!=='undefined'?'tt':'web';
/* 통계: 관리자 화면에 같은 이름으로 등록(README 목록) */
const TRACKS=[];
function track(name,data){const d=Object.assign({},data||{});TRACKS.push([name,d]);if(TRACKS.length>200)TRACKS.shift();
  try{if(PLAT==='wx'&&API.reportEvent)API.reportEvent(name,d);else if(PLAT==='tt'&&API.reportAnalytics)API.reportAnalytics(name,d);}catch(e){}}
/* 보상형 광고: 단위 ID가 없으면 2초 테스트 광고. 끝까지 봐야 보상. 강제 광고 없음 */
const AD_UNIT={wx:'',tt:''};
let AD=null;   // {reason,t,cb,state:'play'|'fail'}
let rvAd=null;
function showAd(reason,cb){if(AD)return;track('ad_open',{reason});const unit=AD_UNIT[PLAT];
  if(API&&unit&&API.createRewardedVideoAd){try{if(!rvAd)rvAd=API.createRewardedVideoAd({adUnitId:unit});rvAd.offClose&&rvAd.offClose();
      rvAd.onClose(r=>{const ok=!r||r.isEnded;if(ok){track('ad_reward',{reason});cb();}else{AD={reason,t:0,cb:null,state:'fail'};}});
      rvAd.show().catch(()=>rvAd.load().then(()=>rvAd.show()).catch(()=>{AD={reason,t:0,cb:null,state:'fail'};}));return;}catch(e){}}
  AD={reason,t:0,cb,state:'play',test:true};}
function shareGame(){track('share',{});const title=L('심연에 물든 바다를 함께 정화해요!','一起净化被深渊污染的大海！');
  try{if(API&&API.shareAppMessage){API.shareAppMessage({title});return true;}if(navigator.share){navigator.share({title:LL(['심해 신전 수비대','深海神殿守卫']),text:title,url:location.href}).catch(()=>{});return true;}
    if(navigator.clipboard){navigator.clipboard.writeText(location.href);return 'copy';}}catch(e){}return false;}
try{if(API&&API.showShareMenu)API.showShareMenu({withShareTicket:true});if(API&&API.onShareAppMessage)API.onShareAppMessage(()=>({title:L('심연에 물든 바다를 함께 정화해요!','一起净化被深渊污染的大海！')}));
  if(API&&API.getUpdateManager){const um=API.getUpdateManager();um.onUpdateReady&&um.onUpdateReady(()=>{um.applyUpdate&&um.applyUpdate();});}}catch(e){}

/* ============================== 플랫폼 층: 화면·터치·저장·언어·소리 (위챗·더우인 이식 때 이 파일만 손본다) ============================== */

const VW=750,VH=1334,K=VW/W;
const cv=document.getElementById('game');const g=cv.getContext('2d');cv.width=VW;cv.height=VH;
function mkCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function safeCtx(x){const a=x.arc.bind(x);x.arc=(p,q,r,s,e,c)=>a(p,q,r>0?r:0,s,e,c);const el=x.ellipse.bind(x);x.ellipse=(p,q,rx,ry,ro,s,e,c)=>el(p,q,rx>0?rx:0,ry>0?ry:0,ro,s,e,c);return x;}
safeCtx(g);
const QS=new URLSearchParams(location.search),DEBUG=QS.get('debug')==='1';
/* ---------- 저장 ---------- */
const SAVE_KEY='deepsea_v2';   // 대원·정화 구조로 바뀌며 저장을 새로 시작(2026-11-17)
const DEF={stars:Array(STAGE_N).fill(0),coins:0,lv:{coral:1,bubble:1,jelly:1,conch:1,rune:1,hero:1,cora:1,bogle:1,lumi:1,sora:1,arin:1},opt:{bgm:1,sfx:1,fast:0,shake:1,vib:1},lang:'',seen:{},sel:0,day:'',mis:[],login:{n:0,last:''}};
function loadSave(){let o=null;try{o=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}catch(e){}const s=JSON.parse(JSON.stringify(DEF));
  if(o&&typeof o==='object'){if(Array.isArray(o.stars))o.stars.forEach((v,i)=>{if(i<s.stars.length)s.stars[i]=Math.max(0,Math.min(3,+v||0));});if(o.opt)Object.assign(s.opt,o.opt);if(o.seen&&typeof o.seen==='object')s.seen=o.seen;if(typeof o.lang==='string')s.lang=o.lang;s.sel=+o.sel||0;
    s.coins=Math.max(0,+o.coins||0);if(o.lv)for(const k in s.lv)s.lv[k]=Math.max(1,Math.min(MAX_LV,+o.lv[k]||1));if(typeof o.day==='string')s.day=o.day;if(Array.isArray(o.mis))s.mis=o.mis.filter(m=>m&&MIS[m.id]);if(o.login){s.login.n=+o.login.n||0;s.login.last=''+(o.login.last||'');}if(o.box&&typeof o.box==='object')s.box={day:''+o.box.day,n:+o.box.n||0};}
  return s;}
let SV=loadSave();
function resetSave(){try{localStorage.removeItem(SAVE_KEY);localStorage.removeItem('deepsea_v1');}catch(e){}SV=loadSave();}
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(SV));}catch(e){}}
const cleared=()=>{let n=0;while(n<SV.stars.length&&SV.stars[n]>0)n++;return n;};
/* ---------- 언어: 한국어 기기면 한국어, 그 밖은 중국어 ---------- */
let LANG=(()=>{const q=QS.get('lang');if(q==='zh'||q==='ko')return q;if(SV.lang==='zh'||SV.lang==='ko')return SV.lang;
  const l=navigator.language||'';return /^ko/i.test(l)?'ko':'zh';})();
const LL=a=>a[LANG==='zh'?1:0],L=(ko,zh)=>LANG==='zh'?zh:ko;
const FONT='"DS","PingFang SC","Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic","Microsoft YaHei",sans-serif';
/* ---------- 터치 ---------- */
const INPUT={down:null,taps:[]};
function toLogic(ev){const r=cv.getBoundingClientRect();return {x:(ev.clientX-r.left)/r.width*W,y:(ev.clientY-r.top)/r.height*H};}
cv.addEventListener('pointerdown',ev=>{ev.preventDefault();unlockAudio();const p=toLogic(ev);INPUT.down={x:p.x,y:p.y,t:performance.now()};});
cv.addEventListener('pointerup',ev=>{ev.preventDefault();const p=toLogic(ev),d=INPUT.down;INPUT.down=null;if(d&&Math.hypot(p.x-d.x,p.y-d.y)<26)INPUT.taps.push(p);});
cv.addEventListener('contextmenu',e=>e.preventDefault());
/* ---------- 소리: 전부 코드로 합성 (음원 파일 없음) ---------- */
let AC=null,MG=null,BG=null;
function unlockAudio(){if(AC){if(AC.state==='suspended')AC.resume();return;}try{AC=new (window.AudioContext||window.webkitAudioContext)();MG=AC.createGain();MG.gain.value=.55;MG.connect(AC.destination);
  BG=AC.createGain();BG.gain.value=SV.opt.bgm?.22:0;BG.connect(MG);startMusic();}catch(e){AC=null;}}
function tone(f,dur,type,vol,slide,delay){if(!AC||!SV.opt.sfx)return;const t0=AC.currentTime+(delay||0),o=AC.createOscillator(),gn=AC.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t0);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),t0+dur);gn.gain.setValueAtTime(0,t0);gn.gain.linearRampToValueAtTime(vol||.2,t0+.008);gn.gain.exponentialRampToValueAtTime(.001,t0+dur);
  o.connect(gn);gn.connect(MG);o.start(t0);o.stop(t0+dur+.02);}
function noise(dur,vol,fc){if(!AC||!SV.opt.sfx)return;const n=Math.floor(AC.sampleRate*dur),b=AC.createBuffer(1,n,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
  const s=AC.createBufferSource(),f=AC.createBiquadFilter(),gn=AC.createGain();s.buffer=b;f.type='lowpass';f.frequency.value=fc||900;gn.gain.value=vol||.2;s.connect(f);f.connect(gn);gn.connect(MG);s.start();}
const sfxGate={};
/* 연속 처치: 이어질수록 한 음씩 올라간다(5음계) */
const PENTA=[0,2,4,7,9];
function sfxKill(c){if(!AC||!SV.opt.sfx)return;const now=performance.now();if(sfxGate.k&&now-sfxGate.k<40)return;sfxGate.k=now;const n=Math.min(c,19),f=440*Math.pow(2,(PENTA[n%5]+12*Math.floor(n/5))/12);tone(f,.1,'triangle',.07,1.5);tone(f*2,.06,'sine',.03,1.2);}
function sfx(n){if(!AC||!SV.opt.sfx)return;const now=performance.now();if(sfxGate[n]&&now-sfxGate[n]<45)return;sfxGate[n]=now;
  switch(n){
    case'spine':tone(900,.06,'triangle',.06,1.6);break;
    case'bub':tone(420,.12,'sine',.08,2.2);break;
    case'zap':noise(.09,.07,4000);tone(1400,.07,'square',.03,.5);break;
    case'shell':tone(160,.2,'triangle',.12,.5);break;
    case'boom':noise(.25,.18,700);tone(90,.25,'sine',.18,.5);break;
    case'beam':tone(1200,.04,'sine',.02,1.1);break;
    case'kill':break;
    case'hit':noise(.03,.035,3200);break;
    case'coin':tone(1500,.05,'sine',.03,1.3);break;
    case'clear':[659,784,1046].forEach((f,i)=>tone(f,.22,'triangle',.1,1,i*.08));break;
    case'build':tone(330,.1,'triangle',.12,1.5);tone(495,.14,'triangle',.1,1.5,.07);break;
    case'up':[392,523,659].forEach((f,i)=>tone(f,.15,'triangle',.1,1.2,i*.06));break;
    case'sell':tone(500,.12,'triangle',.1,.6);break;
    case'leak':tone(200,.3,'sawtooth',.08,.5);break;
    case'wave':tone(220,.5,'sawtooth',.06,1.5);tone(330,.5,'sine',.08,1.5,.1);break;
    case'card':[523,659,784,1046].forEach((f,i)=>tone(f,.25,'sine',.08,1,i*.07));break;
    case'mut':tone(110,.6,'sawtooth',.08,.7);tone(116,.6,'sawtooth',.06,.7);break;
    case'gate':tone(260,.12,'square',.05,2);tone(390,.15,'triangle',.08,1.5,.08);break;
    case'slam':noise(.35,.25,500);tone(70,.35,'sine',.25,.4);break;
    case'vent':tone(300,.2,'sine',.05,3);break;
    case'trap':tone(700,.18,'sine',.07,.6);break;
    case'storm':noise(.2,.12,5000);tone(1800,.15,'square',.04,.3);break;
    case'win':[523,659,784,1046,1318].forEach((f,i)=>tone(f,.3,'triangle',.12,1,i*.1));break;
    case'lose':[392,330,262,196].forEach((f,i)=>tone(f,.35,'triangle',.1,1,i*.14));break;
    case'tap':tone(700,.04,'sine',.06);break;
    case'clean':noise(.12,.08,2500);break;
    case'roar':tone(70,.8,'sawtooth',.12,.6);noise(.6,.1,400);break;
  }}
/* 음악: 느린 심해 분위기(5음계 단조 아르페지오 + 낮은 패드). 전투 중엔 조금 빨라진다 */
let musicMode='calm',mStep=0,mNext=0;
const SCALE=[0,3,5,7,10,12,15,17],ROOT=110;
function startMusic(){setInterval(()=>{if(!AC||!BG)return;BG.gain.value=SV.opt.bgm?.22:0;if(!SV.opt.bgm)return;const ahead=AC.currentTime+.3;if(mNext<AC.currentTime)mNext=AC.currentTime+.05;
  const stepT=musicMode==='battle'?.24:musicMode==='boss'?.2:.36;
  while(mNext<ahead){const i=mStep%32,bar=Math.floor(mStep/8)%4,chord=[0,-4,-2,-5][bar];
    if(i%8===0)pad(ROOT*Math.pow(2,chord/12)/2,stepT*8);
    const pat=[0,2,4,2,5,4,2,1],n=SCALE[(pat[i%8]+(bar%2))%SCALE.length]+chord+(musicMode==='boss'?-12:0);
    if(i%2===0||musicMode!=='calm')pluck(ROOT*2*Math.pow(2,n/12),mNext,musicMode==='calm'?.05:.045);
    mNext+=stepT;mStep++;}},100);}
function pluck(f,t0,v){const o=AC.createOscillator(),gn=AC.createGain();o.type='triangle';o.frequency.value=f;gn.gain.setValueAtTime(0,t0);gn.gain.linearRampToValueAtTime(v,t0+.01);gn.gain.exponentialRampToValueAtTime(.001,t0+.9);o.connect(gn);gn.connect(BG);o.start(t0);o.stop(t0+1);}
function pad(f,dur){const t0=mNext;[1,1.5,2.01].forEach(m=>{const o=AC.createOscillator(),gn=AC.createGain();o.type='sine';o.frequency.value=f*m;gn.gain.setValueAtTime(0,t0);gn.gain.linearRampToValueAtTime(.05,t0+dur*.4);gn.gain.linearRampToValueAtTime(0,t0+dur);o.connect(gn);gn.connect(BG);o.start(t0);o.stop(t0+dur+.05);});}
let vibT=0;function vib(ms){if(!SV.opt.vib)return;const n=performance.now();if(n-vibT<60)return;vibT=n;try{if(API){(ms>=60&&API.vibrateLong?API.vibrateLong:API.vibrateShort).call(API,{type:ms>=40?'heavy':'light'});}else if(navigator.vibrate)navigator.vibrate(ms);}catch(e){}}

try{if(document.fonts){document.fonts.load('900 16px DS');document.fonts.load('700 16px DS');}}catch(e){}
