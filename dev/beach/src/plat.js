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
const MUST=['tuantuan','tt_cheer','didi','pengpeng','shell','gift'],LATER=['shanshan','dundun','zhuozhuo','didi_sick'];
const ART=@@ART@@,OPT=ART.filter(n=>/^(tw|en|boss|bg|ic)_/.test(n));   // art/ 에 넣어 둔 그림 목록(빌드가 채움). 받은 그림은 이름만 맞추면 코드 그림 대신 쓰인다
const HERO_IMG={tt:'tuantuan',didi:'didi',peng:'pengpeng',shan:'shanshan',dun:'dundun',zhuo:'zhuozhuo'};
function loadImg(n,tries){tries=tries||0;const im=API?API.createImage():new Image();
  im.onload=()=>{IMG[n]=im;delete IMG_FAIL[n];onImg(n);};
  im.onerror=()=>{if(tries<8)setTimeout(()=>loadImg(n,tries+1),500+tries*400);else IMG_FAIL[n]=1;};
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
function shareGame(){track('share');const title=L('퇀퇀 해변 수비대: 배고픈 바다 손님을 배불려 돌려보내요!','团团守海滩：把馋嘴小海怪喂饱送回家！');
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
