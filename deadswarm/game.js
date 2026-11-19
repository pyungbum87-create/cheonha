/* DEAD ROUTE — 좀비 떼 생존 · 尸潮突围 (BEPA)
 * 세로형 뱀서라이크 · 끌어서 이동, 공격은 자동 · 5개 구역 · 무기 8종 + 진화 · 대피소 영구 강화
 * Canvas2D 하나로 웹 · 위챗 · 더우인 공통 · 강제 광고 없음 · 한국어 / 简体中文
 * 모듈 구조는 BEPA 출시 기본 틀(DEAD RUSH V12 · LAST LANTERN)에서 옮겨 씀
 */
(()=>{'use strict';
// ================================================================ 플랫폼 계층
const W=750,H=1334,TAU=Math.PI*2,PI=Math.PI;
const PLATFORM=typeof wx!=='undefined'?'wx':typeof tt!=='undefined'?'tt':'web';
const API=PLATFORM==='wx'?wx:PLATFORM==='tt'?tt:null;
const c=API?API.createCanvas():document.getElementById('game');
let g=c.getContext('2d');
const info=API?(API.getSystemInfoSync?API.getSystemInfoSync():{windowWidth:375,windowHeight:667,pixelRatio:1}):null;
let view={s:1,ox:0,oy:0};
if(API){const dpr=Math.min(2,info.pixelRatio||1);c.width=Math.max(1,Math.round((info.windowWidth||375)*dpr));c.height=Math.max(1,Math.round((info.windowHeight||667)*dpr));
 const s=Math.min(c.width/W,c.height/H);view={s,ox:(c.width-W*s)/2,oy:(c.height-H*s)/2};}
else{c.width=W;c.height=H;}
function mkCanvas(w,h){const cv=API?API.createCanvas():document.createElement('canvas');cv.width=w;cv.height=h;return cv}
const BUILD='1119-1300';
const QS=(!API&&typeof location!=='undefined')?location.search:'';
// 안전장치: 반지름 음수·NaN이면 그리기 전체가 멈추는 문제 방지
(function(){const P=Object.getPrototypeOf(g);if(!P||P.__safe)return;P.__safe=true;const oa=P.arc,oe=P.ellipse;
 if(oa)P.arc=function(x,y,r,a0,a1,ccw){return oa.call(this,x,y,r>0&&isFinite(r)?r:0,a0,a1,ccw)};
 if(oe)P.ellipse=function(x,y,rx,ry,rot,a0,a1,ccw){return oe.call(this,x,y,rx>0&&isFinite(rx)?rx:0,ry>0&&isFinite(ry)?ry:0,rot,a0,a1,ccw)}})();
const clamp=(v,a,b)=>v<a?a:v>b?b:v, rand=(a,b)=>a+Math.random()*(b-a), hyp=Math.hypot;
function hashStr(s){let h=2166136261;for(const ch of s){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}

// ================================================================ 그림 불러오기
const IMG_LIST=['map1','map2','map3','map4','map5','jay','title','z_walk','z_run','z_pred','z_blk','z_cmd','z_boss','props'];
const MUST=['map1','jay','z_walk','props'];
const imgs={},imgFail={};
function loadImg(name,tries=0){const im=API?(API.createImage?API.createImage():c.createImage()):new Image();
 im.onload=()=>{imgs[name]=im;onImg(name,im)};
 im.onerror=()=>{if(tries<8)setTimeout(()=>loadImg(name,tries+1),600+tries*900);else imgFail[name]=1};
 im.src='res/'+name+(name.indexOf('map')===0||name==='title'?'.jpg':'.png')+(API?'':'?v='+BUILD+(tries?'r'+tries:''))}
const ZWHITE={};let ZRED=null;
function tintOf(im,col,a){const cv=mkCanvas(im.width,im.height),x=cv.getContext('2d');x.drawImage(im,0,0);x.globalCompositeOperation='source-atop';x.globalAlpha=a;x.fillStyle=col;x.fillRect(0,0,im.width,im.height);return cv}
function onImg(name,im){if(name.indexOf('z_')===0){const k=name.slice(2);try{ZWHITE[k]=tintOf(im,'#ffffff',.75)}catch(e){}}}
IMG_LIST.forEach(n=>loadImg(n));

// ================================================================ 캐릭터 · 감염체 그림 (잘라 붙인 부품을 코드로 움직임)
const SPR={"jay":[200,59.8],"blk":[160,71.8],"pred":[128,55.0],"boss":[256,133.9],"cmd":[128,64.6],"run":[128,55.0],"walk":[128,55.0]};const NF=6;
function drawRunner(cx,x,y,ang,phase,mag,sz){const im=imgs.jay;if(!im)return;const C=SPR.jay[0],D=sz*SPR.jay[1]/34,m=Math.min(1,mag),f=m<.15?0:(((phase/TAU*NF)|0)%NF+NF)%NF;
 cx.save();cx.translate(x,y);cx.fillStyle='rgba(0,0,0,.45)';cx.beginPath();cx.ellipse(0,3,sz*.42,sz*.3,0,0,TAU);cx.fill();cx.rotate(ang-PI/2);cx.drawImage(im,f*C,0,C,C,-D/2,-D/2,D,D);cx.restore()}
// 감염체 걷기 6장을 미리 잘라 둠(그림자 포함, 흰 번쩍임·예고 색 포함)
const ZF={};let zfReady=false;
function buildSprites(){if(zfReady)return true;for(const k of['walk','run','pred','blk','cmd','boss'])if(!imgs['z_'+k]||!ZWHITE[k])return false;
 for(const t of['walk','run','pred','blk','cmd','boss']){const C=SPR[t][0],S=SPR[t][1],im=imgs['z_'+t],sh=C*.17,mk=(src,i,tint)=>{const cv=mkCanvas(C,C),x=cv.getContext('2d');if(!tint||tint==='t'){x.fillStyle='rgba(0,0,0,.42)';x.beginPath();x.ellipse(C/2,C/2+2,sh,sh*.8,0,0,TAU);x.fill()}x.drawImage(src,i*C,0,C,C,0,0,C,C);
   if(tint==='t'){x.globalCompositeOperation='source-atop';x.globalAlpha=.4;x.fillStyle='#ff7a2a';x.fillRect(0,0,C,C)}return cv};
  ZF[t]={S,f:[],white:mk(ZWHITE[t],0,'w'),tele:mk(im,1,'t')};for(let i=0;i<NF;i++)ZF[t].f.push(mk(im,i))}
 zfReady=true;return true}
const PROP_M={radio:[2,2,96,96],firebottle:[100,2,44,96],bottle:[146,2,39,96],crate:[187,2,87,96],spikes:[276,2,95,96],parcel:[373,2,96,96],turret:[471,2,96,90],sandbag:[569,2,96,32],medkit:[667,2,96,75],battery:[765,2,96,61]};
function prop(k,x,y,w,rot){const im=imgs.props;if(!im)return false;const m=PROP_M[k],h=w*m[3]/m[2];g.save();g.translate(x,y);if(rot)g.rotate(rot);g.drawImage(im,m[0],m[1],m[2],m[3],-w/2,-h/2,w,h);g.restore();return true}
// 부드러운 빛 스프라이트(색별 한 번만 만들어 재사용)
const GLOW={};
function glowSpr(col){let k=GLOW[col];if(k)return k;k=mkCanvas(64,64);const x=k.getContext('2d'),gr=x.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,col+'ff');gr.addColorStop(.3,col+'99');gr.addColorStop(1,col+'00');x.fillStyle=gr;x.fillRect(0,0,64,64);return GLOW[col]=k}
function glow(x,y,r,col,a){if(a<=0||r<=0)return;const pa=g.globalAlpha;g.globalAlpha=a>1?1:a;g.drawImage(glowSpr(col),x-r,y-r,r*2,r*2);g.globalAlpha=pa}

// ================================================================ 음악·효과음 (DEAD RUSH Music/AudioFx 이식)
// 효과음: 코드로 합성해 미리 녹음한 wav + Pixabay 녹음 mp3 (상업 무료·표기 불필요)
const SFX=['shot','hurt','pick','heal','ding','win','lose','card','ui','near','surge','scream','slam','shock','beep','throw','gem','heart','zdie','glass','whoosh','door','siren','groan1','groan2','groan3','groan4'];
const SFX_MP3={zdie:1,glass:1,whoosh:1,door:1,siren:1,groan1:1,groan2:1,groan3:1,groan4:1},sfxFile=k=>'res/sfx_'+k+'.'+(SFX_MP3[k]?'mp3':'wav');
const Music={el:null,cur:'',on:true,vol:.45,src:null,gain:null,bufs:{},nat:null,
 play(key){if(this.cur===key)return;this.cur=key;if(!this.on||this.hidden)return;this._start(key)},
 _start(key){const loop=key!=='win';
  if(API&&API.createInnerAudioContext){if(API.loadSubpackage&&!this.subOk){if(!this.subReq){this.subReq=true;try{API.loadSubpackage({name:'audio',success:()=>{this.subOk=true;const k=this.cur;this.cur='';this.play(k)},fail:()=>{this.subReq=false}})}catch(e){this.subOk=true}}return}
   try{if(this.nat)this.nat.stop();if(!this.natPool)this.natPool={};let a=this.natPool[key];if(!a){a=API.createInnerAudioContext();a.src=(API.loadSubpackage?'audio/':'res/')+'bgm_'+key+'.mp3';a.loop=loop;this.natPool[key]=a}a.volume=this.vol;a.seek&&a.seek(0);a.play();this.nat=a}catch(e){}return}
  const ctx=AudioFx.ctx;
  if(ctx&&typeof fetch==='function'&&location.protocol!=='file:'){this._stopWeb();const go=b=>{if(this.cur!==key||!this.on)return;try{const s2=ctx.createBufferSource(),gn=ctx.createGain();s2.buffer=b;s2.loop=loop;gn.gain.setValueAtTime(0,ctx.currentTime);gn.gain.linearRampToValueAtTime(this.vol,ctx.currentTime+.8);s2.connect(gn);gn.connect(ctx.destination);s2.start();this.src=s2;this.gain=gn}catch(e){}};
   if(this.bufs[key])go(this.bufs[key]);else fetch('res/bgm_'+key+'.mp3?v='+BUILD).then(r=>r.arrayBuffer()).then(ab=>ctx.decodeAudioData(ab,b=>{this.bufs[key]=b;go(b)},()=>{})).catch(()=>{});return}
  if(typeof Audio!=='undefined'){try{if(this.el)this.el.pause();this.el=new Audio('res/bgm_'+key+'.mp3');this.el.loop=loop;this.el.volume=this.vol;const pr=this.el.play();if(pr&&pr.catch)pr.catch(()=>{})}catch(e){}}},
 _stopWeb(){if(this.src&&this.gain&&AudioFx.ctx){const ctx=AudioFx.ctx,s2=this.src,gn=this.gain;try{gn.gain.cancelScheduledValues(ctx.currentTime);gn.gain.setValueAtTime(gn.gain.value,ctx.currentTime);gn.gain.linearRampToValueAtTime(0,ctx.currentTime+.6);s2.stop(ctx.currentTime+.65)}catch(e){}}this.src=null;this.gain=null},
 stop(){this._stopWeb();if(this.el){try{this.el.pause()}catch(e){}}if(this.nat){try{this.nat.stop()}catch(e){}}},
 toggle(){this.on=!this.on;save.music=this.on;persist();if(!this.on)this.stop();else{const k=this.cur;this.cur='';this.play(k||'menu')}},
 kick(){if(this.on&&this.cur&&!this.src&&!(this.el&&!this.el.paused)&&!this.nat){const k=this.cur;this.cur='';this.play(k)}}};
const AudioFx={ctx:null,enabled:true,buf:{},last:{},native:{},
 init(){if(!this.enabled||this.ctx||API)return;try{const A=typeof AudioContext!=='undefined'?AudioContext:typeof webkitAudioContext!=='undefined'?webkitAudioContext:null;if(A){this.ctx=new A();this.master=this.ctx.createGain();this.master.gain.value=.85;this.master.connect(this.ctx.destination);this.load()}}catch(e){}},
 load(){if(typeof fetch!=='function'||typeof location==='undefined'||location.protocol==='file:')return;for(const k of SFX){fetch(sfxFile(k)+'?v='+BUILD).then(r=>r.arrayBuffer()).then(b=>this.ctx.decodeAudioData(b,d=>{this.buf[k]=d},()=>{})).catch(()=>{})}},
 cue(key,vol=1,gap=.05,rate=1){if(!this.enabled)return;const now=Date.now()/1000;if(this.last[key]&&now-this.last[key]<gap)return;this.last[key]=now;
  if(API&&typeof API.createInnerAudioContext==='function'){try{let pool=this.native[key];if(!pool){pool={i:0,a:[0,1,2].map(()=>{const a=API.createInnerAudioContext();a.autoplay=false;a.src=sfxFile(key);return a})};this.native[key]=pool}const a=pool.a[pool.i++%3];a.volume=Math.min(1,vol);a.stop();a.play()}catch(e){}return}
  if(!this.ctx)return;const b=this.buf[key];if(!b)return;
  try{const s=this.ctx.createBufferSource(),v=this.ctx.createGain();s.buffer=b;s.playbackRate.value=rate*(.95+Math.random()*.1);v.gain.value=vol;s.connect(v);v.connect(this.master);s.start()}catch(e){}}};

// ================================================================ 언어 (DEAD RUSH LANG 이식)
let LANG='ko';
try{if(API){const sl=((API.getSystemInfoSync&&API.getSystemInfoSync().language)||'').toLowerCase();LANG=sl.indexOf('ko')===0?'ko':'zh'}
 else{const langs=(typeof navigator!=='undefined'?(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||'']):[]).map(x=>(x||'').toLowerCase());
  let tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){}
  const zhTZ=/^Asia\/(Shanghai|Chongqing|Chungking|Harbin|Urumqi|Kashgar|Hong_Kong|Macau|Taipei)$/.test(tz)||tz==='PRC';
  if(langs[0]&&langs[0].indexOf('zh')===0)LANG='zh';else if(zhTZ&&!(langs[0]&&langs[0].indexOf('ko')===0))LANG='zh'}}catch(e){}
let LANG_FORCED=null;{const m=QS.match(/[?&]lang=(ko|zh)/);if(m)LANG_FORCED=m[1]}
const L=(ko,zh)=>LANG==='zh'?zh:ko;
const LL=p=>Array.isArray(p)?(LANG==='zh'?p[1]:p[0]):(p||'');

// ================================================================ 저장
const SAVE_KEY='bepa_deadroute_v1';
const save={v:1,sup:0,up:{},clr:{},stars:{},diff:{},best:{},firstDone:false,tips:{},daily:null,att:{last:'',streak:0},boxDay:'',boxN:0,starBox:0,patrol:0,ach:{},
 stats:{kills:0,runs:0,clears:0,evo:0},startW:'gun',stage:1,lang:null,music:true,sfx:true,shake:true,vib:true,mild:null,qualityLow:false,qualityManual:false,statc:{}};
try{let raw=null;if(API&&API.getStorageSync)raw=API.getStorageSync(SAVE_KEY);else if(typeof localStorage!=='undefined')raw=localStorage.getItem(SAVE_KEY);
 if(raw){const o=JSON.parse(raw);for(const k in o)if(o[k]!==undefined&&o[k]!==null)save[k]=o[k];}}catch(e){}
for(const k of['up','clr','stars','diff','best','tips','statc'])if(!save[k]||typeof save[k]!=='object')save[k]={};
if(!save.stats||typeof save.stats!=='object')save.stats={kills:0,runs:0,clears:0,evo:0};
if(save.lang&&!LANG_FORCED)LANG=save.lang;if(LANG_FORCED)LANG=LANG_FORCED;
if(save.mild===null)save.mild=(LANG==='zh'||!!API);
let qualityLow=!!save.qualityLow,qualityManual=!!save.qualityManual;
Music.on=save.music!==false;AudioFx.enabled=save.sfx!==false;
function persist(){save.lang=LANG;save.qualityLow=qualityLow;save.qualityManual=qualityManual;try{const v=JSON.stringify(save);if(API&&API.setStorageSync)API.setStorageSync(SAVE_KEY,v);else if(typeof localStorage!=='undefined')localStorage.setItem(SAVE_KEY,v)}catch(e){}}
function todayKey(){const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()}

// ================================================================ 통계·진동·광고·공유·생명주기 (DEAD RUSH 이식)
// 기록: 위챗 reportEvent / 더우인 reportAnalytics (관리자 화면에 같은 이벤트 이름 등록 필요). 웹은 기기 안에 횟수만 저장
const STAT_LOG=[];function track(ev,data){data=data||{};try{STAT_LOG.push([ev,data]);if(STAT_LOG.length>200)STAT_LOG.shift();
 if(API&&PLATFORM==='wx'&&API.reportEvent)API.reportEvent(ev,data);else if(API&&PLATFORM==='tt'&&API.reportAnalytics)API.reportAnalytics(ev,data);
 save.statc[ev]=(save.statc[ev]||0)+1}catch(e){}}
let vibT=0;function vib(kind){if(save.vib===false)return;const now=Date.now();if(kind==='light'&&now-vibT<250)return;vibT=now;try{if(API&&kind==='long'&&API.vibrateLong)API.vibrateLong();else if(API&&API.vibrateShort)API.vibrateShort({type:kind==='heavy'?'heavy':kind==='medium'?'medium':'light'});else if(typeof navigator!=='undefined'&&navigator.vibrate&&navigator.userActivation&&navigator.userActivation.hasBeenActive)navigator.vibrate(kind==='heavy'?60:kind==='medium'?35:kind==='long'?200:15)}catch(e){}}
const AD_UNIT={wx:'adunit-xxxxxxxxxxxxxxxx',tt:'xxxxxxxxxxxxxxxxxx'};// ← 플랫폼 광고 단위 ID로 교체
let adShow=null,adObj=null,adCb=null;
function showAd(place,cb0){if(adShow)return;track('ad_open',{place});const cb=()=>{track('ad_reward',{place});cb0()};
 if(API&&API.createRewardedVideoAd&&AD_UNIT[PLATFORM]&&AD_UNIT[PLATFORM].indexOf('xxxx')<0){try{if(!adObj){adObj=API.createRewardedVideoAd({adUnitId:AD_UNIT[PLATFORM]});adObj.onClose(r=>{const ok=!r||r.isEnded!==false;const f=adCb;adCb=null;Music.kick();if(ok&&f)f();else message(L('끝까지 시청해야 보상을 받습니다','需完整观看才能获得奖励'),1.4)});adObj.onError(()=>{adCb=null;message(L('광고를 불러오지 못했습니다','广告加载失败'),1.2)})}
  adCb=cb;adObj.show().catch(()=>adObj.load().then(()=>adObj.show()).catch(()=>{adCb=null;message(L('광고를 불러오지 못했습니다','广告加载失败'),1.2)}))}catch(e){cb()}return}
 adShow={t:0,cb,place}}// 테스트 환경: 2초 가짜 광고
function shareGame(){track('share',{});const st=S?S.st:save.stage;const title=L('좀비 떼 속에서 살아남아라! ','在尸潮中活下去！')+(S?L(S.kills+'마리 쓰러뜨림',' 击倒'+S.kills+'只'):'');
 if(API&&API.shareAppMessage){try{API.shareAppMessage({title,imageUrl:'res/share.jpg'})}catch(e){}}
 else if(typeof navigator!=='undefined'&&navigator.share){navigator.share({text:title,url:location.href}).catch(()=>{})}
 else message(L('공유는 위챗·더우인에서 동작합니다','分享功能在微信/抖音中可用'),1.4)}
function onAppHide(){if(sc==='battle'&&S&&!S.over)paused=true;Music.stop();Music.hidden=true;persist();track('app_hide',{sc})}
function onAppShow(){Music.hidden=false;const k=Music.cur;Music.cur='';if(Music.on)Music.play(k||'menu');else Music.cur=k;last=0}
if(API){try{API.onHide&&API.onHide(onAppHide);API.onShow&&API.onShow(onAppShow)}catch(e){}}
else if(typeof document!=='undefined'){document.addEventListener('visibilitychange',()=>{if(document.hidden)onAppHide();else onAppShow()})}
if(API&&API.getUpdateManager){try{const um=API.getUpdateManager();um.onUpdateReady(()=>{API.showModal?API.showModal({title:L('새 버전','新版本'),content:L('새 버전이 준비됐습니다. 다시 시작할까요?','新版本已准备好，是否重启？'),success:r=>{if(r.confirm)um.applyUpdate()}}):um.applyUpdate()})}catch(e){}}
if(API){try{API.showShareMenu&&API.showShareMenu({withShareTicket:true});API.onShareAppMessage&&API.onShareAppMessage(()=>({title:L('DEAD ROUTE — 좀비 떼 속에서 살아남아라','尸潮突围——在尸潮中活下去'),imageUrl:'res/share.jpg'}))}catch(e){}}

// ================================================================ 게임 데이터
const STAGES=[
 {n:['주거 지구','住宅区'],d:['처음 감염이 퍼진 아파트 골목','感染最先蔓延的公寓小巷'],mul:1,rate:1,sp:{run:20,pred:45,cmd:75,blk:95}},
 {n:['상업 지구','商业区'],d:['셔터가 내려간 네온 거리','卷帘门紧闭的霓虹街'],mul:1.6,rate:1.06,sp:{run:15,pred:40,cmd:65,blk:85}},
 {n:['공장 단지','工厂区'],d:['꺼진 확성기가 우는 공장','关着的喇叭仍在鸣响的工厂'],mul:2.6,rate:1.12,sp:{run:12,pred:32,cmd:55,blk:75}},
 {n:['지하 연구소','地下研究所'],d:['모든 것이 시작된 곳','一切开始的地方'],mul:3.8,rate:1.18,sp:{run:10,pred:26,cmd:48,blk:65}},
 {n:['방송탑','广播塔'],d:['마지막 헬기가 기다리는 곳','最后的直升机在等待'],mul:4.6,rate:1.22,sp:{run:14,pred:24,cmd:45,blk:60}}];
const STAGE_RECTS={"1":[[0,0,55,193],[0,193,95,243],[296,0,514,218],[600,0,724,243],[588,88,625,128],[598,128,625,193],[0,243,97,878],[602,243,724,878],[152,350,202,438],[152,506,202,593],[152,661,202,753],[493,348,543,433],[493,505,543,593],[493,665,543,753]],"2":[[0,0,290,95],[435,0,724,95],[0,110,45,965],[685,110,724,320],[635,315,724,700],[680,700,724,965],[40,120,178,205],[215,128,515,202],[555,122,690,205],[330,195,428,290],[115,228,165,282],[590,228,645,282],[222,322,520,672],[530,355,555,385],[525,410,550,450],[580,395,615,440],[585,520,625,550],[535,560,565,590],[600,570,630,620],[100,760,150,845],[100,865,150,960],[590,760,635,845],[590,865,635,960]],"3":[[0,1,278,101],[445,1,724,101],[0,101,22,201],[22,136,172,201],[212,136,510,201],[550,136,724,201],[0,191,58,965],[58,321,80,591],[100,431,125,521],[100,546,125,611],[345,226,428,296],[215,246,300,326],[450,261,505,321],[185,341,505,669],[608,491,665,641],[665,271,724,965],[690,201,724,271],[105,736,160,921],[555,761,625,951]],"4":[[0,0,290,100],[435,0,724,100],[0,70,65,135],[660,70,724,135],[0,135,172,205],[208,135,515,205],[550,135,724,205],[0,185,92,690],[0,690,70,965],[640,185,724,390],[605,390,724,665],[640,665,724,965],[285,235,445,330],[200,365,532,690],[530,410,552,545],[205,250,250,290],[550,300,595,345],[110,770,170,835],[555,790,610,860],[110,880,145,920],[575,875,615,910]],"5":[[0,1,345,141],[425,1,724,141],[50,176,185,213],[218,176,508,213],[542,176,680,213],[680,141,724,261],[0,141,55,266],[0,266,18,521],[0,521,100,691],[0,691,180,931],[0,931,30,965],[205,346,285,451],[285,356,555,691],[610,301,724,701],[555,301,620,351],[550,691,724,965],[348,251,438,301],[270,291,310,323],[455,286,505,326]]};
const BOSS_T=150;            // 문지기 등장 시간(초)
const ZT={walk:{hp:12,spd:54,dmg:10,xp:1,r:10},run:{hp:9,spd:96,dmg:8,xp:1,r:10},pred:{hp:42,spd:52,dmg:14,xp:4,r:11},blk:{hp:230,spd:30,dmg:18,xp:14,r:17},cmd:{hp:130,spd:36,dmg:10,xp:12,r:15},boss:{hp:9000,spd:36,dmg:28,xp:80,r:32}};
const ZN={walk:['감염자','感染者'],run:['추적자','追踪者'],pred:['덮치기형','扑击者'],cmd:['지휘형','指挥者'],blk:['거구','巨躯'],boss:['문지기','守门者']};
// 무기 8종 + 보조 5종. ev = 진화에 필요한 보조, en = 진화 이름
const WP={
 gun:{n:['펄스 권총','脉冲手枪'],c:'#9fe8ff',m:5,ev:'pow',en:['레일건','轨道炮'],
  d:l=>[['가까운 놈에게 자동 사격','自动射击最近的敌人'],['관통 +1','穿透 +1'],['총알 2발','子弹 2发'],['연사 빨라짐 · 관통 +1','射速提升 · 穿透 +1'],['총알 3발','子弹 3发']][l-1],ed:['한 줄로 꿰뚫는 4연발 광선','一次贯穿一排的4连光束']},
 saw:{n:['회전 톱날','旋转锯刃'],c:'#d6dee9',m:5,ev:'arm',en:['톱날 폭풍','锯刃风暴'],d:l=>l===1?['몸 주위를 도는 톱날 2개','绕身旋转的锯刃 2片']:['톱날 '+(l+1)+'개 · 피해 증가','锯刃 '+(l+1)+'片 · 伤害提升'],ed:['커졌다 작아지는 톱날 8개','忽大忽小的锯刃 8片']},
 molo:{n:['화염병','燃烧瓶'],c:'#ff8a3d',m:5,ev:'cd',en:['네이팜','凝固汽油'],d:l=>l===1?['무리에 던져 불바다를 만들어요','扔向尸群形成火海']:['불길이 넓어지고 더 자주 던져요','火焰更大，投掷更频繁'],ed:['한 번에 두 병, 더 크고 오래 타요','一次两瓶，火更大更久']},
 pulse:{n:['충격 스피커','冲击音箱'],c:'#b78cff',m:5,ev:'spd',en:['지진 스피커','震荡音箱'],d:l=>l===1?['주기적으로 주변을 밀어내요','周期性震退周围敌人']:['충격파가 넓어지고 세져요','冲击波范围和威力提升'],ed:['거대한 충격파, 맞은 놈은 잠시 멈춰요','巨型冲击波，被击中的敌人短暂停住']},
 bolt:{n:['전기 사슬','电链'],c:'#7fe3ff',m:5,ev:'mag',en:['뇌운','雷云'],d:l=>l===1?['번개가 놈들 사이를 타고 번져요','闪电在敌人之间跳跃']:['더 많은 놈에게 번져요 ('+(2+l)+'마리)','跳跃更多敌人（'+(2+l)+'只）'],ed:['번개가 12마리까지 번지고 하늘에서도 떨어져요','闪电跳跃12只，还会从天而降']},
 frost:{n:['냉동 수류탄','冰冻手雷'],c:'#a8ecff',m:5,ev:'cd',en:['절대영도','绝对零度'],d:l=>l===1?['터지면 놈들이 얼어 느려져요','爆炸后冻住敌人减速']:['더 넓게, 더 오래 얼려요','冻结范围更大、更久'],ed:['넓은 범위를 거의 멈출 만큼 얼려요','大范围冻结，几乎停止']},
 drone:{n:['공격 드론','攻击无人机'],c:'#ff6ad5',m:5,ev:'spd',en:['드론 편대','无人机编队'],d:l=>l===1?['머리 위 드론이 유도 로켓을 쏴요','头顶无人机发射追踪火箭']:['로켓이 세지고 더 자주 쏴요','火箭更强、发射更频繁'],ed:['드론 3대가 동시에 로켓을 쏴요','3架无人机同时发射火箭']},
 turret:{n:['자동 포탑','自动炮塔'],c:'#ffd166',m:5,ev:'pow',en:['포대 진지','炮台阵地'],d:l=>l===1?['발밑에 포탑을 설치해요','在脚下设置炮塔']:['포탑이 세지고 더 자주 설치돼요','炮塔更强，设置更频繁'],ed:['포탑 4대, 두 배로 빠르게 쏴요','4座炮塔，射速翻倍']},
 spd:{n:['운동화','跑鞋'],c:'#5dff9a',m:5,p:1,d:l=>['이동 속도 +'+8*l+'%','移动速度 +'+8*l+'%']},
 mag:{n:['자석 장갑','磁力手套'],c:'#5dff9a',m:5,p:1,d:l=>['초록 빛을 더 멀리서 끌어와요','从更远处吸取绿光']},
 arm:{n:['방탄 조끼','防弹背心'],c:'#5dff9a',m:5,p:1,d:l=>['최대 체력 +20, 바로 회복','生命上限 +20，立即回复']},
 pow:{n:['강화 탄약','强化弹药'],c:'#5dff9a',m:5,p:1,d:l=>['모든 피해 +'+12*l+'%','所有伤害 +'+12*l+'%']},
 cd:{n:['빠른 손','快手'],c:'#5dff9a',m:5,p:1,d:l=>['모든 무기가 '+8*l+'% 빨라져요','所有武器加快 '+8*l+'%']}};
const WEAPONS=['gun','saw','molo','pulse','bolt','turret','frost','drone'];
const UNLOCK={gun:0,saw:0,molo:0,pulse:0,bolt:1,turret:2,frost:3,drone:4};   // n번 구역을 깨면 열림
// 대피소 영구 강화
const UPG=[
 {k:'hp',n:['체력','生命'],m:10,b:30,e:l=>['최대 체력 +'+12*l,'生命上限 +'+12*l]},
 {k:'pow',n:['공격력','攻击力'],m:10,b:40,e:l=>['모든 피해 +'+6*l+'%','所有伤害 +'+6*l+'%']},
 {k:'spd',n:['이동 속도','移动速度'],m:5,b:35,e:l=>['이동 속도 +'+3*l+'%','移动速度 +'+3*l+'%']},
 {k:'cd',n:['재사용 시간','冷却时间'],m:5,b:50,e:l=>['무기 재사용 -'+3*l+'%','武器冷却 -'+3*l+'%']},
 {k:'mag',n:['자석','拾取范围'],m:5,b:25,e:l=>['줍는 범위 +'+12*l+'%','拾取范围 +'+12*l+'%']},
 {k:'xp',n:['성장','成长'],m:5,b:45,e:l=>['경험치 +'+6*l+'%','经验 +'+6*l+'%']},
 {k:'sup',n:['수거','回收'],m:5,b:60,e:l=>['물자 +'+8*l+'%','物资 +'+8*l+'%']},
 {k:'reroll',n:['다시 뽑기','重抽'],m:3,b:80,e:l=>['한 판에 무료 다시 뽑기 '+l+'번','每局免费重抽 '+l+'次']},
 {k:'revive',n:['응급 키트','急救包'],m:1,b:400,e:l=>[l?'한 판에 한 번, 쓰러져도 체력 40%로 일어나요':'한 판에 한 번 부활','每局一次，倒下后以40%生命复活']}];
const upLv=k=>save.up[k]||0, upCost=u=>Math.round(u.b*(1+upLv(u.k))*(1+upLv(u.k)*.35));
const MISSIONS=[{k:'kill',goal:800,n:['감염체 800마리 쓰러뜨리기','击倒800个感染者'],r:60},{k:'run',goal:3,n:['출동 3번','出动3次'],r:40},{k:'clear',goal:1,n:['구역 1번 탈출','成功撤离1次'],r:80},
 {k:'crate',goal:4,n:['보급 상자 4개 열기','打开4个补给箱'],r:50},{k:'lv',goal:20,n:['한 판에 레벨 20 달성','单局达到20级'],r:60},{k:'siren',goal:40,n:['사이렌 켜고 40초 버티기','开警报坚持40秒'],r:60},{k:'evo',goal:1,n:['무기 1번 진화','进化武器1次'],r:90},{k:'time',goal:300,n:['합계 5분 버티기','累计坚持5分钟'],r:50}];
const ATT=[50,80,100,120,150,200,400];
const STAR_BOX=[[3,100],[6,200],[9,300],[12,400],[15,600]];
function dailyInit(){const t=todayKey();if(save.daily&&save.daily.day===t)return;let h=hashStr(t);const pool=MISSIONS.map((m,i)=>i),pick=[];while(pick.length<3){const i=h%pool.length;pick.push(pool.splice(i,1)[0]);h=Math.imul(h,1103515245)+12345>>>0}save.daily={day:t,m:pick.map(i=>({i,p:0,c:false}))};persist()}
function mission(k,n=1,set){if(!save.daily||save.daily.day!==todayKey())dailyInit();for(const m of save.daily.m){const M=MISSIONS[m.i];if(M.k===k&&!m.c){m.p=Math.min(M.goal,set?Math.max(m.p,n):m.p+n)}}}
function attCan(){return save.att.last!==todayKey()}
function boxLeft(){return save.boxDay===todayKey()?Math.max(0,3-save.boxN):3}
function totalStars(){let s=0;for(const k in save.stars)s+=save.stars[k]||0;return s}
function starBoxReady(){const n=save.starBox||0;return n<STAR_BOX.length&&totalStars()>=STAR_BOX[n][0]}
function rewardBadge(){dailyInit();if(attCan())return true;if(save.daily.m.some(m=>!m.c&&m.p>=MISSIONS[m.i].goal))return true;if(starBoxReady())return true;return boxLeft()>0}
function canUpgrade(){return UPG.some(u=>upLv(u.k)<u.m&&save.sup>=upCost(u))}
function giveSup(n,why){save.sup+=n;persist();AudioFx.cue('win',.6);message(L('물자 +','物资 +')+n+(why?' · '+why:''),1.6)}
function stageOpen(i){return i===0||!!save.clr[i]}         // i: 0~4
function weaponOpen(k){return UNLOCK[k]===0||!!save.clr[UNLOCK[k]]}

// ================================================================ 세계: 그림 한 장을 2×2로 뒤집어 이어 붙인 도시
const SW=724,SH=965,WW=SW*2,WH=SH*2;
let RECTS=[],lvl=null,lvlStage=-1;
function buildWorld(st){if(lvlStage===st&&lvl)return true;const im=imgs['map'+(st+1)];if(!im)return false;
 RECTS=[];for(const [x0,y0,x1,y1] of STAGE_RECTS[st+1])RECTS.push([x0,y0,x1,y1],[WW-x1,y0,WW-x0,y1],[x0,WH-y1,x1,WH-y0],[WW-x1,WH-y1,WW-x0,WH-y0]);
 if(!lvl)lvl=mkCanvas(WW,WH);const x=lvl.getContext('2d');for(const [fx,fy] of [[0,0],[1,0],[0,1],[1,1]]){x.save();x.translate(fx?WW:0,fy?WH:0);x.scale(fx?-1:1,fy?-1:1);x.drawImage(im,0,0,SW,SH);x.restore()}
 for(let j=0;j<FHc;j++)for(let i=0;i<FWc;i++)FBL[j*FWc+i]=solid(i*FC+FC/2,j*FC+FC/2,7)?1:0;lvlStage=st;return true}
function solid(x,y,r){if(x<r||y<r||x>WW-r||y>WH-r)return true;for(const q of RECTS)if(x>q[0]-r&&x<q[2]+r&&y>q[1]-r&&y<q[3]+r)return true;return false}
function moveE(e,dx,dy,r){if(!solid(e.x+dx,e.y,r))e.x+=dx;else e.blk=1;if(!solid(e.x,e.y+dy,r))e.y+=dy;else e.blk=2}
// 흐름 지도: 놈들이 건물을 물처럼 돌아 플레이어에게 몰려옴
const FC=24,FWc=Math.ceil(WW/FC),FHc=Math.ceil(WH/FC),FBL=new Uint8Array(FWc*FHc),FD=new Int16Array(FWc*FHc),FQ=new Int32Array(FWc*FHc);
function flowUpdate(){FD.fill(-1);const ci=clamp((P.x/FC)|0,0,FWc-1),cj=clamp((P.y/FC)|0,0,FHc-1);let h=0,t=0;FD[cj*FWc+ci]=0;FQ[t++]=cj*FWc+ci;
 while(h<t){const k=FQ[h++],i=k%FWc,j=(k/FWc)|0,d=FD[k]+1;if(i>0&&!FBL[k-1]&&FD[k-1]<0){FD[k-1]=d;FQ[t++]=k-1}if(i<FWc-1&&!FBL[k+1]&&FD[k+1]<0){FD[k+1]=d;FQ[t++]=k+1}if(j>0&&!FBL[k-FWc]&&FD[k-FWc]<0){FD[k-FWc]=d;FQ[t++]=k-FWc}if(j<FHc-1&&!FBL[k+FWc]&&FD[k+FWc]<0){FD[k+FWc]=d;FQ[t++]=k+FWc}}}
const FO={x:0,y:0};
function flowDir(z,o){const i=(z.x/FC)|0,j=(z.y/FC)|0,k=j*FWc+i,d0=FD[k];if(d0<0||d0<=2)return false;let bd=d0,bi=0,bj=0;
 for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const ni=i+di,nj=j+dj;if(ni<0||nj<0||ni>=FWc||nj>=FHc)continue;const n=nj*FWc+ni,d=FD[n];if(d<0)continue;if(di&&dj&&(FBL[j*FWc+ni]||FBL[nj*FWc+i]))continue;if(d<bd){bd=d;bi=di;bj=dj}}
 if(!bi&&!bj)return false;const tx=(i+bi)*FC+FC/2-z.x,ty=(j+bj)*FC+FC/2-z.y,l=hyp(tx,ty)||1;o.x=tx/l;o.y=ty/l;return true}

// ================================================================ 순찰 보상 · 업적
const PATROL_MAX=8*3600e3;function patrolRate(){return 20+12*Object.keys(save.clr).length}
function patrolAmt(){if(!save.patrol)return 0;return Math.floor(clamp(Date.now()-save.patrol,0,PATROL_MAX)/3600e3*patrolRate())}
function patrolClaim(x){const n=patrolAmt();if(n<1)return;save.patrol=Date.now();giveSup(n*x);track('patrol',{n,x})}
const ACH=[{s:'kills',g:1000,r:100,n:['감염체 1,000 처치','累计击倒1,000']},{s:'kills',g:10000,r:300,n:['감염체 10,000 처치','累计击倒10,000']},{s:'kills',g:50000,r:800,n:['감염체 50,000 처치','累计击倒50,000']},
 {s:'clears',g:1,r:100,n:['첫 탈출','首次撤离']},{s:'clears',g:10,r:300,n:['탈출 10번','撤离10次']},{s:'clears',g:30,r:800,n:['탈출 30번','撤离30次']},
 {s:'evo',g:1,r:80,n:['첫 무기 진화','首次武器进化']},{s:'evo',g:25,r:400,n:['무기 진화 25번','武器进化25次']},{s:'elite',g:20,r:300,n:['정예 20 처치','击倒20个精英']},{s:'stars',g:15,r:1000,n:['별 15개 모으기','集齐15颗星']}];
function achVal(a){return a.s==='stars'?totalStars():(save.stats[a.s]||0)}
function achReady(){if(!save.ach)save.ach={};return ACH.some((a,i)=>!save.ach[i]&&achVal(a)>=a.g)}

// ================================================================ 상태
let frame=0,last=0,sc='loading',paused=false,shakeT=0,flashT=0;
let S=null,P=null;
let banner='',bannerT=0,bannerSc='',bigMsg=null,guideTip=null,guidePage=0,guideRet='title',resetArm=0,confirmQuit=false,autoBot=false,dbgFreeze=false,stepping=false;
let ptr=null,joy={on:false,ox:0,oy:0,x:0,y:0};
function message(t,d=2){banner=t;bannerT=d;bannerSc=sc}
function announce(t,sub,col){bigMsg={t,sub:sub||'',col:col||'#FFE8C2',life:2.2}}
function shake(n){if(save.shake!==false)shakeT=Math.max(shakeT,n)}
const VW=470,ZS=W/VW,VH=H/ZS;   // 화면에 보이는 세계 크기
const lv=k=>S.w[k]||0, EV=k=>!!S.evo[k];

// ================================================================ 판 시작
function newRun(st,diff,tut,boost){st=st|0;diff=Math.max(1,diff|0);if(!buildWorld(st)){message(L('지도를 불러오는 중이에요','地图加载中'),1.2);return}
 let px=WW/2,py=WH/2,bs=-1;for(let y=200;y<WH-200;y+=40)for(let x=200;x<WW-200;x+=40){if(solid(x,y,16))continue;let o=0;for(let a=0;a<TAU;a+=.4)for(let r=40;r<=200;r+=40)if(!solid(x+Math.cos(a)*r,y+Math.sin(a)*r,10))o++;o-=hyp(x-WW/2,y-WH/2)*.02;if(o>bs){bs=o;px=x;py=y}}
 const maxHp=100+12*upLv('hp');
 P={x:px,y:py,hp:maxHp,maxHp,ang:-PI/2,phase:0,inv:1,mv:0};
 const D=STAGES[st];
 S={st,diff,tut:!!tut,t:0,kills:0,lv:1,xp:0,need:3,w:{},evo:{},zs:[],bul:[],gems:[],pk:[],pools:[],tur:[],bolts:[],fx:[],num:[],pt:[],dec:[],drs:[{a:0},{a:2.1},{a:4.2}],
  spawn:0,wave:20,siren:false,sirenT:0,cam:{x:0,y:0},cd:{gun:.3,molo:1,pulse:2,bolt:1,turret:.5,frost:1.5,drone:1},sawA:0,bossOut:false,boss:null,win:false,winT:-1,over:false,
  hm:D.mul*(1+.4*(diff-1)),rate:D.rate*(1+.06*(diff-1)),sp:D.sp,drops:[60,120],pick:null,chest:null,rerolls:upLv('reroll'),adReroll:false,kit:upLv('revive')>0,kitUsed:false,revived:false,
  dmgM:1+.06*upLv('pow'),spdM:1+.03*upLv('spd'),cdM:1-.03*upLv('cd'),magM:1+.12*upLv('mag'),xpM:1+.06*upLv('xp'),crates:0,evoN:0,dmg:{},crit:.08,od:0,odG:0,odN:0,eb:[],elT:35,elN:0,wn:0,boost:!!boost,groanT:2,flowT:0,moved:0,tipT:0,doubled:false,reward:0};
 const sw=weaponOpen(save.startW)?save.startW:'gun';S.w[sw]=boost?3:1;if(boost)S.rerolls++;
 flowUpdate();S.cam.x=clamp(P.x-VW/2,0,WW-VW);S.cam.y=clamp(P.y-VH/2,0,WH-VH);for(let i=0;i<9;i++)spawnRing('walk',rand(150,230));
 sc='battle';paused=false;confirmQuit=false;save.stats.runs++;mission('run');persist();track('run_start',{st:st+1,diff,w:sw,tut:tut?1:0,boost:boost?1:0});
 if(!tut)announce(LL(D.n),L('2분 30초 버티면 문지기가 나타나요','坚持2分30秒，守门者就会出现'))}
const DM=()=>S.dmgM*(1+.12*lv('pow')), CDM=()=>S.cdM*(1-.08*lv('cd'))*(S.od>0?.6:1);
let DSRC='etc';const odNeed=()=>Math.min(320,70+50*S.odN);
function startOD(){S.od=7;S.odG=0;S.odN++;for(const gm of S.gems)gm.pull=true;S.fx.push({k:'wave',x:P.x,y:P.y,t:0,life:.5,R:170,c:'#ffd166'});S.fx.push({k:'pillar',x:P.x,y:P.y,t:0,life:.7,c:'#ffd166'});message(L('과열! 공격 속도 폭발','狂热！攻速爆发'),1.4);AudioFx.cue('surge',.7);vib('medium');shake(.2)}
function spawnElite(t,mid){const z=spawnRing(t)||spawnRing(t,240);if(!z)return null;z.el=mid?2:1;z.hp=z.mhp=(mid?1500:300+S.t*9)*S.hm;z.r=ZT[t].r*(mid?1.7:1.35);return z}

// ================================================================ 감염체
function spawn(t,x,y){const T=ZT[t],hs=1+S.t/70+(S.t>100?(S.t-100)/40:0),hp=t==='boss'?9000*S.hm:T.hp*(1+(S.hm-1)*Math.min(1,S.t/75))*hs;
 const z={t,x,y,hp,mhp:hp,r:T.r,ph:Math.random()*6,ang:0,fl:0,kx:0,ky:0,hitT:0,sawT:0,st:0,stT:rand(1.5,3.5),slowT:0,frz:0};S.zs.push(z);return z}
function spawnRing(t,R0){for(let i=0;i<10;i++){let x,y;if(R0){const a=Math.random()*TAU;x=P.x+Math.cos(a)*R0;y=P.y+Math.sin(a)*R0}
  else{const hw=VW/2+26,hh=VH/2+26,e=Math.random()*(hw+hh)*2;if(e<hw*2){x=S.cam.x+VW/2-hw+e;y=S.cam.y+VH/2+(Math.random()<.5?-hh:hh)}else{y=S.cam.y+VH/2-hh+(e-hw*2);x=S.cam.x+VW/2+(Math.random()<.5?-hw:hw)}}
  if(!solid(x,y,14)&&FD[((y/FC)|0)*FWc+((x/FC)|0)]>=0)return spawn(t,x,y)}return null}
function pickType(){const t=S.t,r=Math.random(),sp=S.sp;if(t>sp.blk&&r<.035)return 'blk';if(t>sp.cmd&&r<.06)return 'cmd';if(t>sp.pred&&r<.16)return 'pred';if(t>sp.run&&r<.16+Math.min(.25,(t-sp.run)/400))return 'run';return 'walk'}
function spark(x,y,n,col,spd,life,size,grav){if(!S)return;const cap=qualityLow?160:480;if(S.pt.length>cap)return;if(qualityLow)n=Math.ceil(n/2);for(let i=0;i<n;i++){const a=Math.random()*TAU,v=spd*(.35+Math.random()*.65);S.pt.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:0,life:life*(.6+Math.random()*.6),s:size,c:col,g:grav||0})}}
const ZCOL=t=>t==='cmd'?'#b78cff':t==='pred'?'#ffd166':save.mild?'#9fb4c8':'#3ef2d0';
function hurt(z,d,kx,ky,k){if(z.dead)return;d*=DM();let cr=0;if(Math.random()<S.crit+(S.od>0?.12:0)){d*=2;cr=1}S.dmg[DSRC]=(S.dmg[DSRC]||0)+Math.min(d,z.hp);z.hp-=d;z.fl=.07;if(k){const l=hyp(kx,ky)||1,m=z.t==='boss'?.1:(z.t==='blk'||z.el)?.3:1;z.kx+=kx/l*k*m;z.ky+=ky/l*k*m}
 if(S.num.length<(qualityLow?14:40))S.num.push({x:z.x+rand(-6,6),y:z.y-14,s:Math.round(d),t:0,big:d>=30,cr});
 if(z.hp<=0)killZ(z)}
function killZ(z){if(z.dead)return;z.dead=true;S.kills++;save.stats.kills++;mission('kill');if(S.od<=0&&!S.win){S.odG+=(z.t==='walk'||z.t==='run')?1:3;if(S.odG>=odNeed())startOD()}
 if(z.el){save.stats.elite=(save.stats.elite||0)+1;shake(.3);vib('medium');for(let i=0;i<8;i++)S.gems.push({x:z.x+rand(-24,24),y:z.y+rand(-24,24),v:4,t:0});if(z.el===2)S.pk.push({k:'medkit',x:z.x+22,y:z.y})}
 if(S.kills%100===0){message(S.kills+L(' 처치!',' 击倒！'),1.2);AudioFx.cue('near',.6)}
 const col=ZCOL(z.t),big=!(z.t==='walk'||z.t==='run');spark(z.x,z.y,big?14:5,col,big?170:110,.4,big?4:3);if(S.fx.length<70)S.fx.push({k:'pop',x:z.x,y:z.y,t:0,life:.16,R:z.r*2.8,c:col});
 if(big){shake(.12);if(!save.mild&&!qualityLow)S.dec.push({k:'splat',x:z.x,y:z.y,t:0,life:6,R:z.r*1.6,a:Math.random()*6})}
 S.gems.push({x:z.x,y:z.y,v:ZT[z.t].xp*(S.siren?2:1),t:0});
 if(S.fx.length<40)S.fx.push({k:'gib',x:z.x,y:z.y,t:0,life:.4,a:Math.random()*6,c:col,n:big?10:5});
 AudioFx.cue('zdie',.45,.09);
 const r=Math.random();if(z.el||((z.t==='blk'||z.t==='cmd')&&Math.random()<.06))S.pk.push({k:'crate',x:z.x,y:z.y});else if(r<.012)S.pk.push({k:'medkit',x:z.x,y:z.y});else if(r<.019)S.pk.push({k:'battery',x:z.x,y:z.y});
 if(z.t==='boss'){S.eb=[];S.win=true;S.winT=1.6;shake(.7);vib('long');AudioFx.cue('win');for(const o of S.zs)if(!o.dead&&o!==z)killZ(o);announce(L('문지기를 쓰러뜨렸다!','击倒了守门者！'),L('탈출로가 열렸다','撤离通道打开了'),'#7fe0b0')}}

// ================================================================ 레벨업 · 보급 상자 · 진화
function ownedW(){return Object.keys(S.w).filter(k=>!WP[k].p)}
function makeOpts(){const ks=Object.keys(WP).filter(k=>lv(k)<WP[k].m&&(WP[k].p||weaponOpen(k))),wc=ownedW().length;
 let pool=ks.filter(k=>lv(k)>0||WP[k].p||wc<6).sort(()=>Math.random()-.5);const out=[];const nw=pool.find(k=>!WP[k].p&&!lv(k));
 if(nw&&(S.lv<=4||wc<2)){out.push(nw);pool=pool.filter(k=>k!==nw)}while(out.length<3&&pool.length)out.push(pool.shift());return out.sort(()=>Math.random()-.5)}
function levelUp(){S.lv++;S.need=Math.round(3+S.lv*3+S.lv*S.lv*.5);mission('lv',S.lv,true);const o=makeOpts();if(!o.length){P.hp=Math.min(P.maxHp,P.hp+20);return}
 S.pick={opts:o,t:0};AudioFx.cue('card');vib('medium');
 if(S.lv===2)tip('pick',[['레벨이 오를 때마다 무기나 보조 능력을 하나 골라요.','每次升级可以选择一个武器或辅助能力。'],['무기를 최대 레벨(5)로 키우고 짝이 되는 보조를 가지면, 보급 상자에서 진화해요.','武器升到满级(5)并拥有对应辅助能力，就能在补给箱中进化。']])}
function applyPick(k){if(!S.pick)return;S.w[k]=lv(k)+1;if(k==='arm'){P.maxHp+=20;P.hp=Math.min(P.maxHp,P.hp+40)}S.pick=null;P.inv=Math.max(P.inv,.8);
 S.fx.push({k:'wave',x:P.x,y:P.y,t:0,life:.5,R:120,c:WP[k].c});S.fx.push({k:'pillar',x:P.x,y:P.y,t:0,life:.7,c:WP[k].c});
 for(let i=0;i<(qualityLow?8:22);i++)S.pt.push({x:P.x+rand(-16,16),y:P.y+rand(-6,10),vx:rand(-20,20),vy:rand(-220,-80),t:0,life:rand(.4,.8),s:3,c:WP[k].c,g:0});
 for(const z of S.zs)if(hyp(z.x-P.x,z.y-P.y)<120)hurt(z,6,z.x-P.x,z.y-P.y,200);AudioFx.cue('pick');
 if(S.xp>=S.need&&!S.win){S.xp-=S.need;levelUp()}}
function reroll(){if(!S.pick)return;if(S.rerolls>0){S.rerolls--;S.pick.opts=makeOpts();AudioFx.cue('card');return}
 if(!S.adReroll)showAd('reroll',()=>{S.adReroll=true;if(S.pick)S.pick.opts=makeOpts()})}
function evolvable(){return ownedW().filter(k=>lv(k)>=5&&!EV(k)&&lv(WP[k].ev)>0)}
function openChest(){S.crates++;mission('crate');const ev=evolvable();AudioFx.cue('ding');vib('medium');
 if(ev.length){const k=ev[0];S.chest={type:'evo',k,t:0};return}
 const ks=Object.keys(S.w).filter(k=>lv(k)<WP[k].m).sort(()=>Math.random()-.5).slice(0,2);
 if(ks.length){S.chest={type:'up',ks,t:0};return}
 S.chest={type:'heal',t:0}}
function takeChest(){const C=S.chest;if(!C)return;S.chest=null;P.inv=Math.max(P.inv,1);
 if(C.type==='evo'){S.evo[C.k]=1;S.evoN++;save.stats.evo++;mission('evo');track('evolve',{k:C.k,t:Math.round(S.t)});shake(.3);vib('heavy');
  S.fx.push({k:'pillar',x:P.x,y:P.y,t:0,life:1,c:WP[C.k].c});S.fx.push({k:'wave',x:P.x,y:P.y,t:0,life:.7,R:220,c:WP[C.k].c});for(const z of S.zs)if(hyp(z.x-P.x,z.y-P.y)<220)hurt(z,40,z.x-P.x,z.y-P.y,300);
  announce(LL(WP[C.k].en)+'!',LL(WP[C.k].ed),WP[C.k].c);AudioFx.cue('win')}
 else if(C.type==='up'){for(const k of C.ks){S.w[k]++;if(k==='arm'){P.maxHp+=20;P.hp=Math.min(P.maxHp,P.hp+20)}}AudioFx.cue('pick')}
 else{P.hp=P.maxHp;AudioFx.cue('heal')}}

// ================================================================ 진행
const grid=new Map(),CELL=40,gk=(x,y)=>((x/CELL)|0)*1000+((y/CELL)|0);
function near(x,y,R,fn){const x0=((x-R)/CELL)|0,x1=((x+R)/CELL)|0,y0=((y-R)/CELL)|0,y1=((y+R)/CELL)|0;for(let i=x0;i<=x1;i++)for(let j=y0;j<=y1;j++){const a=grid.get(i*1000+j);if(a)for(const z of a)if(!z.dead){const d=hyp(z.x-x,z.y-y);if(d<R+z.r)fn(z,d)}}}
function nearest(x,y,R){let b=null,bd=R;near(x,y,R,(z,d)=>{if(d<bd){bd=d;b=z}});return b}
function randomNear(x,y,R){let tg=null,k=0;near(x,y,R,z=>{if(Math.random()<1/(++k))tg=z});return tg}
function overlayOn(){return !S||paused||S.pick||S.chest||adShow||guideTip||confirmQuit||S.over}
function tick(dt){if(!S||(dbgFreeze&&!stepping))return;if(overlayOn())return;
 if(S.winT>=0){S.winT-=dt;dt*=.3;if(S.winT<0){finishRun(true);return}}
 const p=P;S.t+=dt;DSRC='etc';if(S.od>0)S.od-=dt;flashT=Math.max(0,flashT-dt);shakeT=Math.max(0,shakeT-dt);
 // 이동
 const v=input(),m=hyp(v.x,v.y),sp=118*S.spdM*(1+.08*lv('spd'))*(S.od>0?1.12:1);if(m>.1){const ox=p.x,oy=p.y;moveE(p,v.x*sp*dt,v.y*sp*dt,9);S.moved+=hyp(p.x-ox,p.y-oy);p.ang=Math.atan2(v.y,v.x);p.phase+=dt*13*m}p.mv=m;p.inv=Math.max(0,p.inv-dt);
 // 등장
 if(!S.win){const cap=S.siren?260:(qualityLow?150:200),rate=(2.6+S.t*.13)*S.rate*(S.siren?1.9:1)*(S.tut&&S.t<20?.6:1);S.spawn+=rate*dt;while(S.spawn>=1){S.spawn--;if(S.zs.length<cap)spawnRing(pickType())}
  if(S.t>=S.wave){S.wave+=25;AudioFx.cue('surge',.8);const wk=S.tut?0:S.wn++%3;
   if(wk===1){message(L('포위당했다! 뚫고 나가요','被包围了！冲出去'),1.8);const n=20+((S.t/12)|0);for(let i=0;i<n;i++){const a=i/n*TAU,x=p.x+Math.cos(a)*235,y=p.y+Math.sin(a)*235;if(!solid(x,y,12)&&S.zs.length<280)spawn('walk',x,y)}}
   else if(wk===2){message(L('질주 떼가 달려온다!','狂奔尸群冲来了！'),1.8);const a=Math.random()*TAU,n=10+((S.t/15)|0);for(let i=0;i<n;i++){const o=(i-n/2)*16,x=p.x+Math.cos(a)*270-Math.sin(a)*o,y=p.y+Math.sin(a)*270+Math.cos(a)*o;if(!solid(x,y,12)&&S.zs.length<280)spawn('run',x,y)}}
   else{message(L('떼가 몰려온다!','尸潮来袭！'),1.6);for(let i=0;i<18+S.t*.22&&S.zs.length<260;i++)spawnRing(Math.random()<.3&&S.t>30?'run':'walk')}}
  if(S.t>=S.elT&&S.t<BOSS_T-5){S.elT+=35;const mid=S.elN===1,z=spawnElite(mid?'blk':['blk','cmd','pred'][S.elN%3],mid);S.elN++;if(z){message(mid?L('거대 감염체 등장!','巨型感染者出现！'):L('정예 등장 · 쓰러뜨리면 보급 상자','精英出现 · 击倒掉落补给箱'),1.8);AudioFx.cue('scream',.45)}}
  if(S.boss&&!S.boss.dead&&S.t>BOSS_T+75&&!S.rage){S.rage=1;message(L('문지기가 날뛴다!','守门者暴走了！'),1.6)}
  if(!S.bossOut&&S.t>=BOSS_T){S.bossOut=true;S.boss=spawnRing('boss')||spawnRing('boss',300)||spawnRing('boss',220)||spawnRing('boss',150)||spawn('boss',p.x,p.y);announce(L('문지기 등장','守门者出现'),L('쓰러뜨리면 탈출!','击倒它就能撤离！'),'#ff9a7a');AudioFx.cue('scream');vib('heavy')}
  if(S.drops.length&&S.t>=S.drops[0]){S.drops.shift();let x=p.x,y=p.y;for(let i=0;i<20;i++){const a=Math.random()*TAU,r=rand(110,170),tx=p.x+Math.cos(a)*r,ty=p.y+Math.sin(a)*r;if(!solid(tx,ty,16)){x=tx;y=ty;break}}S.pk.push({k:'crate',x,y,drop:1});message(L('보급 상자 투하!','补给箱空投！'),1.6);AudioFx.cue('ding',.6)}}
 if(S.siren){S.sirenT+=dt;if(S.sirenT>=1){mission('siren',1);S.sirenT-=1}}
 S.flowT-=dt;if(S.flowT<=0){S.flowT=.3;flowUpdate()}
 grid.clear();for(const z of S.zs){const k=gk(z.x,z.y);let a=grid.get(k);if(!a)grid.set(k,a=[]);a.push(z)}
 // 감염체
 const cmds=S.zs.filter(z=>z.t==='cmd');
 for(const z of S.zs){const T=ZT[z.t];const dx=p.x-z.x,dy=p.y-z.y,d=hyp(dx,dy)||1;z.fl=Math.max(0,z.fl-dt);z.hitT-=dt;z.sawT-=dt;
  let s=T.spd*(z.t==='boss'&&S.rage?1.7:1);if(z.slowT>0){z.slowT-=dt;s*=z.frz?.12:.42;if(z.slowT<=0)z.frz=0}for(const cm of cmds)if(cm!==z&&hyp(cm.x-z.x,cm.y-z.y)<130){s*=1.45;break}
  if(z.t==='pred'||z.t==='boss'){z.stT-=dt;if(z.st===0&&z.stT<=0&&d<(z.t==='boss'?150:190)){z.st=1;z.stT=z.t==='boss'?.9:.5;z.tx=p.x;z.ty=p.y}
   else if(z.st===1){s=0;if(z.stT<=0){if(z.t==='boss'){z.st=0;z.stT=4;shake(.45);AudioFx.cue('slam');S.fx.push({k:'wave',x:z.x,y:z.y,t:0,life:.45,R:95,c:'#ff8a3d'});S.dec.push({k:'crack',x:z.x,y:z.y,t:0,life:3,R:95,a:Math.random()*6});spark(z.x,z.y,22,'#c9b39a',200,.6,3.5);if(d<95+9)hitP(T.dmg*(1+.15*S.st))}
    else{z.st=2;z.stT=.34;const l=hyp(z.tx-z.x,z.ty-z.y)||1;z.lx=(z.tx-z.x)/l;z.ly=(z.ty-z.y)/l}}}
   else if(z.st===2){moveE(z,z.lx*330*dt,z.ly*330*dt,z.r*.6);if(z.stT<=0){z.st=0;z.stT=rand(2.2,3.6)}s=0}}
  if(z.stun>0){z.stun-=dt;s=0}
  if(s>0){let ux=dx/d,uy=dy/d;if(flowDir(z,FO)){ux=FO.x*.85+ux*.15;uy=FO.y*.85+uy*.15;z.blk=0;z.slT=0}
   else if(z.blk){if(!(z.slT>0)){z.slT=.9;if(z.blk===1){z.sx=0;z.sy=Math.abs(dy)>24?Math.sign(dy):(Math.random()<.5?-1:1)}else{z.sy=0;z.sx=Math.abs(dx)>24?Math.sign(dx):(Math.random()<.5?-1:1)}}z.blk=0}
   if(z.slT>0){z.slT-=dt;ux=ux*.25+z.sx;uy=uy*.25+z.sy}
   moveE(z,ux*s*dt,uy*s*dt,Math.min(10,z.r*.55));const ta=Math.atan2(uy,ux);let da=ta-z.ang;while(da>PI)da-=TAU;while(da<-PI)da+=TAU;z.ang+=da*Math.min(1,dt*9);z.ph+=dt*(s/8)}
  if(z.kx||z.ky){moveE(z,z.kx*dt,z.ky*dt,Math.min(10,z.r*.55));z.kx*=Math.pow(.002,dt);z.ky*=Math.pow(.002,dt);if(Math.abs(z.kx)+Math.abs(z.ky)<4)z.kx=z.ky=0}
  if(d<z.r+9&&z.hitT<=0&&!(z.stun>0)){z.hitT=.7;hitP(T.dmg*(1+.15*S.st))}
  if(z.t==='boss'&&z.hp<z.mhp*.65){z.shT=(z.shT==null?2:z.shT)-dt;if(z.shT<=0){z.shT=z.hp<z.mhp*.3?3.2:4.6;const n=12,o=Math.random();for(let i=0;i<n;i++){const a=(i+o)/n*TAU;S.eb.push({x:z.x,y:z.y,vx:Math.cos(a)*105,vy:Math.sin(a)*105,t:0})}AudioFx.cue('shock',.5);S.fx.push({k:'wave',x:z.x,y:z.y,t:0,life:.3,R:50,c:'#ff8a3d'})}}
  if(z.t==='boss'){z.chk=(z.chk||0)+dt;if(z.chk>3){if(hyp(z.x-(z.cx||0),z.y-(z.cy||0))<20&&d>220){const q=spawnRing('walk',260);if(q){z.x=q.x;z.y=q.y;q.dead=true}}z.chk=0;z.cx=z.x;z.cy=z.y}}
  if(d>hyp(VW,VH)*.95&&z.t!=='boss'){z.dead=true;z.gone=true}}
 for(const a of grid.values())for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++){const A=a[i],B=a[j],dx=B.x-A.x,dy=B.y-A.y,d=hyp(dx,dy)||.01,mn=(A.r+B.r)*.85;if(d<mn){const o=(mn-d)*.5,ux=dx/d,uy=dy/d;A.x-=ux*o*.5;A.y-=uy*o*.5;B.x+=ux*o*.5;B.y+=uy*o*.5}}
 weapons(dt);
 // 탄 · 불 · 번개
 for(const b of S.bul){b.t+=dt;DSRC=b.mol===2?'frost':b.mol?'molo':b.rk?'drone':b.tc?'turret':'gun';
  if(b.mol){if(Math.random()<.7){const t=b.t/b.life;spark(b.x0+(b.x-b.x0)*t,b.y0+(b.y-b.y0)*t-Math.sin(t*PI)*40,1,b.mol===2?'#9fe8ff':'#ffb347',18,.3,2.4)}
   if(b.t>=b.life){b.dead=true;if(b.mol===2){const ev=EV('frost'),R=(62+7*b.L)*(ev?1.5:1);near(b.x,b.y,R,z=>{hurt(z,(8+4*b.L)*(ev?2:1),0,0,0);z.slowT=(2.4+.35*b.L)*(ev?1.4:1);if(ev)z.frz=1});S.fx.push({k:'boom',x:b.x,y:b.y,t:0,life:.4,R,c:'#7fe3ff'});S.dec.push({k:'frost',x:b.x,y:b.y,t:0,life:2.4+.35*b.L,R});spark(b.x,b.y,18,'#d8f6ff',190,.5,3);AudioFx.cue('glass',.6,.08)}
    else{const ev=EV('molo'),R=(36+7*b.L)*(ev?1.5:1);S.pools.push({x:b.x,y:b.y,R,t:0,life:(2.4+.3*b.L)*(ev?1.5:1),tick:0,L:b.L});AudioFx.cue('glass',.6,.08);S.fx.push({k:'boom',x:b.x,y:b.y,t:0,life:.35,R:R*1.3,c:'#ff8a3d'});spark(b.x,b.y,16,'#ffb347',200,.45,3);shake(.1)}}continue}
  if(b.rk){let tg=b.tg;if(!tg||tg.dead)tg=b.tg=nearest(b.x,b.y,220);if(tg){const ta=Math.atan2(tg.y-b.y,tg.x-b.x);let da=ta-b.a;while(da>PI)da-=TAU;while(da<-PI)da+=TAU;b.a+=clamp(da,-7*dt,7*dt)}
   const vv=180+b.t*260;b.x+=Math.cos(b.a)*vv*dt;b.y+=Math.sin(b.a)*vv*dt;if(Math.random()<.8)spark(b.x,b.y,1,'#ffb347',12,.25,2.2);
   if((tg&&hyp(tg.x-b.x,tg.y-b.y)<12)||b.t>2.2){b.dead=true;const R=40+5*b.L;near(b.x,b.y,R,z=>hurt(z,b.d,z.x-b.x,z.y-b.y,120));S.fx.push({k:'boom',x:b.x,y:b.y,t:0,life:.3,R:R*1.2,c:'#ff8a3d'});spark(b.x,b.y,10,'#ffd166',170,.35,2.6);shake(.07);AudioFx.cue('shock',.3,.08)}continue}
  b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.t>(b.life||.6)){b.dead=true;continue}
  near(b.x,b.y,b.rad||5,z=>{if(b.dead||b.hit.indexOf(z)>=0)return;b.hit.push(z);hurt(z,b.d,b.vx,b.vy,60);spark(b.x,b.y,2,b.col||'#9fe8ff',95,.2,2);if(b.pr--<=0)b.dead=true})}
 S.bul=S.bul.filter(b=>!b.dead);
 DSRC='molo';for(const o of S.pools){o.t+=dt;o.tick-=dt;if(Math.random()<dt*12)spark(o.x+rand(-.6,.6)*o.R,o.y+rand(-.5,.5)*o.R,1,'#ffb347',12,.8,2.4,-60);if(o.tick<=0){o.tick=.35;near(o.x,o.y,o.R,z=>hurt(z,6+3*o.L,0,0,0))}}S.pools=S.pools.filter(o=>o.t<o.life);
 DSRC='etc';for(const e of S.eb){e.t+=dt;e.x+=e.vx*dt;e.y+=e.vy*dt;if(hyp(e.x-p.x,e.y-p.y)<11){e.t=9;hitP(12*(1+.15*S.st))}}S.eb=S.eb.filter(e=>e.t<4.5);
 for(const b of S.bolts)b.t+=dt;S.bolts=S.bolts.filter(b=>b.t<.14);
 // 초록 빛 · 줍기
 const mr=62*S.magM*(1+.35*lv('mag'));let got=0;
 for(const gm of S.gems){gm.t+=dt;const dx=p.x-gm.x,dy=p.y-gm.y,d=hyp(dx,dy)||1;if(d<mr||gm.pull){gm.pull=true;const s2=Math.min(d,(300+gm.t*200)*dt);gm.x+=dx/d*s2;gm.y+=dy/d*s2}if(d<13){gm.got=true;S.xp+=gm.v*S.xpM;got++}}
 if(got)AudioFx.cue('gem',.35,.04,1+Math.min(1,S.xp/S.need));
 S.gems=S.gems.filter(gm=>!gm.got);if(S.gems.length>220){const ex=S.gems.splice(0,S.gems.length-220);let vsum=0;for(const e of ex)vsum+=e.v;S.gems[0].v+=vsum}
 for(const k of S.pk){if(k.drop>0){k.drop-=dt*1.5;continue}if(hyp(k.x-p.x,k.y-p.y)<24){k.got=true;
  if(k.k==='medkit'){p.hp=Math.min(p.maxHp,p.hp+30);AudioFx.cue('heal');floatTxt(p.x,p.y-30,L('체력 +30','生命 +30'),'#7fe0b0')}
  else if(k.k==='battery'){for(const gm of S.gems)gm.pull=true;AudioFx.cue('ding');floatTxt(p.x,p.y-30,L('전부 끌어오기!','全部吸取！'),'#7fe3ff')}
  else openChest()}}
 S.pk=S.pk.filter(k=>!k.got);S.zs=S.zs.filter(z=>!z.dead);
 if(S.boss&&S.boss.dead)S.boss=null;
 for(const q of S.pt){q.t+=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=Math.pow(.02,dt);q.vy=q.vy*Math.pow(.02,dt)+q.g*dt}S.pt=S.pt.filter(q=>q.t<q.life);
 for(const d of S.dec)d.t+=dt;S.dec=S.dec.filter(d=>d.t<d.life);for(const f of S.fx)f.t+=dt;S.fx=S.fx.filter(f=>f.t<f.life);for(const n of S.num)n.t+=dt;S.num=S.num.filter(n=>n.t<.5);
 // 소리: 가까운 놈의 신음
 S.groanT-=dt;if(S.groanT<=0){S.groanT=rand(1.1,2.4);const z=nearest(p.x,p.y,260);if(z)AudioFx.cue('groan'+(1+((Math.random()*4)|0)),.25+.35*(1-hyp(z.x-p.x,z.y-p.y)/260),.5)}
 if(p.hp>0&&p.hp<p.maxHp*.25){S.hbT=(S.hbT||0)-dt;if(S.hbT<=0){S.hbT=.95;AudioFx.cue('heart',.6)}}
 // 안내
 if(S.tut){S.tipT+=dt;if(S.t>30&&!save.tips.siren)tip('siren',[['오른쪽 아래 사이렌을 켜면 떼가 두 배로 몰려오지만 경험치도 두 배예요.','打开右下角警报，尸潮翻倍，经验也翻倍。'],['자신 있을 때 켜고, 위험하면 바로 끄세요.','有把握时打开，危险时立刻关闭。']])}
 if(S.xp>=S.need&&!S.win&&!S.pick){S.xp-=S.need;levelUp()}}
function floatTxt(x,y,s,col){if(S.num.length<44)S.num.push({x,y,s,t:-.4,big:true,col})}
function hitP(d){if(P.inv>0||S.win||S.over)return;P.hp-=d;P.inv=.4;flashT=.25;shake(.18);AudioFx.cue('hurt',.7,.1);vib('heavy');
 if(P.hp<=0){P.hp=0;if(S.kit&&!S.kitUsed){S.kitUsed=true;reviveP(.4);announce(L('응급 키트!','急救包！'),L('다시 일어났다','重新站了起来'),'#7fe0b0');return}finishRun(false)}}
function reviveP(f){P.hp=Math.round(P.maxHp*f);P.inv=2.5;S.fx.push({k:'wave',x:P.x,y:P.y,t:0,life:.6,R:200,c:'#7fe0b0'});for(const z of S.zs)if(z.t!=='boss'&&hyp(z.x-P.x,z.y-P.y)<200){z.kx+=(z.x-P.x)*4;z.ky+=(z.y-P.y)*4}AudioFx.cue('heal')}

// ================================================================ 무기
function weapons(dt){const p=P,cd=S.cd,cdm=CDM();
 if(lv('gun')){cd.gun-=dt;if(cd.gun<=0){const tg=(S.boss&&!S.boss.dead&&hyp(S.boss.x-p.x,S.boss.y-p.y)<220)?S.boss:nearest(p.x,p.y,240);if(tg){const L0=lv('gun'),ev=EV('gun'),n=ev?4:L0>=5?3:L0>=3?2:1,base=Math.atan2(tg.y-p.y,tg.x-p.x);cd.gun=(ev?.22:L0>=4?.3:.4)*cdm;
   for(let i=0;i<n;i++){const a=ev?base:base+(i-(n-1)/2)*.16,dl=ev?i*.05:0;S.bul.push({x:p.x-Math.cos(a)*dl*600,y:p.y-6-Math.sin(a)*dl*600,vx:Math.cos(a)*(ev?620:440),vy:Math.sin(a)*(ev?620:440),d:(12+3*L0)*(ev?1.6:1),pr:ev?6:L0>=4?2:L0>=2?1:0,t:0,hit:[],col:ev?'#ffffff':'#9fe8ff',big:ev,life:ev?.55:.6})}
   S.fx.push({k:'pop',x:p.x+Math.cos(base)*15,y:p.y-6+Math.sin(base)*15,t:0,life:.07,R:15,c:'#9fe8ff'});AudioFx.cue('shot',.3,.11)}else cd.gun=.12}}
 if(lv('saw')){DSRC='saw';const L0=lv('saw'),ev=EV('saw'),n=ev?8:L0+1,R=ev?62+14*Math.sin(S.t*2):54;S.sawA+=dt*(ev?4.2:3.4);S.sawR=R;
  for(let i=0;i<n;i++){const a=S.sawA+i*TAU/n,sx=p.x+Math.cos(a)*R,sy=p.y+Math.sin(a)*R;near(sx,sy,13,z=>{if(z.sawT<=0){z.sawT=.32;hurt(z,(7+3*L0)*(ev?1.5:1),z.x-p.x,z.y-p.y,90);spark(sx,sy,3,'#ffd166',130,.22,2.2)}})}}
 if(lv('molo')){cd.molo-=dt;if(cd.molo<=0){const L0=lv('molo'),ev=EV('molo');let any=false;for(let i=0;i<(ev?2:1);i++){const tg=randomNear(p.x,p.y,210);if(tg){any=true;S.bul.push({mol:1,x0:p.x,y0:p.y,x:tg.x,y:tg.y,t:0,life:.45,L:L0})}}
   if(any){cd.molo=Math.max(1.1,3.1-.38*L0)*cdm;AudioFx.cue('throw',.5)}else cd.molo=.3}}
 if(lv('pulse')){DSRC='pulse';cd.pulse-=dt;if(cd.pulse<=0){const L0=lv('pulse'),ev=EV('pulse'),R=(85+18*L0)*(ev?1.4:1);cd.pulse=Math.max(1.5,3.8-.42*L0)*cdm;
   S.fx.push({k:'wave',x:p.x,y:p.y,t:0,life:.4,R,c:'#b78cff'});for(let i=0;i<(qualityLow?8:18);i++){const a=i/18*TAU;S.pt.push({x:p.x+Math.cos(a)*14,y:p.y+Math.sin(a)*14,vx:Math.cos(a)*R*2.4,vy:Math.sin(a)*R*2.4,t:0,life:.38,s:3,c:'#d4bcff',g:0})}
   AudioFx.cue('shock',.45);shake(.1);near(p.x,p.y,R,z=>{hurt(z,(10+5*L0)*(ev?1.6:1),z.x-p.x,z.y-p.y,170);if(ev&&z.t!=='boss')z.stun=1})}}
 if(lv('bolt')){DSRC='bolt';cd.bolt-=dt;if(cd.bolt<=0){const L0=lv('bolt'),ev=EV('bolt');let cur=nearest(p.x,p.y,200);if(cur){cd.bolt=(ev?.7:Math.max(.8,2.3-.3*L0))*cdm;const pts=[[p.x,p.y-8]],seen=new Set();
   for(let i=0;i<(ev?12:2+L0)&&cur;i++){seen.add(cur);pts.push([cur.x,cur.y]);hurt(cur,15+5*L0,0,0,0);let nx=null,nd=95;near(cur.x,cur.y,95,(z,d)=>{if(!seen.has(z)&&d<nd){nd=d;nx=z}});cur=nx}
   S.bolts.push({pts,t:0});for(let i=1;i<pts.length;i++)spark(pts[i][0],pts[i][1],4,'#9fe8ff',120,.25,2.4);
   if(ev)for(let i=0;i<2;i++){const z=randomNear(p.x,p.y,230);if(z){S.bolts.push({pts:[[z.x+rand(-20,20),z.y-260],[z.x,z.y]],t:0});near(z.x,z.y,40,o=>hurt(o,30,0,0,0));S.fx.push({k:'boom',x:z.x,y:z.y,t:0,life:.25,R:40,c:'#7fe3ff'})}}
   AudioFx.cue('beep',.45,.1)}else cd.bolt=.25}}
 if(lv('turret')){cd.turret-=dt;if(cd.turret<=0){const L0=lv('turret'),ev=EV('turret');cd.turret=(ev?4:9.5-L0)*cdm;S.tur.push({x:p.x,y:p.y,t:0,life:8+L0+(ev?4:0),cd:0,L:L0,a:0});S.fx.push({k:'wave',x:p.x,y:p.y,t:0,life:.3,R:40,c:'#ffd166'});spark(p.x,p.y,8,'#ffd166',90,.4,2.5);
   const mx=ev?4:1+((L0/2)|0);while(S.tur.length>mx)S.tur.shift();AudioFx.cue('door',.4)}}
 if(lv('frost')){cd.frost-=dt;if(cd.frost<=0){const L0=lv('frost'),tg=randomNear(p.x,p.y,200);if(tg){cd.frost=Math.max(2,5.2-.55*L0)*cdm;S.bul.push({mol:2,x0:p.x,y0:p.y,x:tg.x,y:tg.y,t:0,life:.5,L:L0});AudioFx.cue('throw',.5)}else cd.frost=.3}}
 if(lv('drone')){const L0=lv('drone'),ev=EV('drone'),nd=ev?3:1;cd.drone-=dt;
  for(let i=0;i<nd;i++){const D=S.drs[i];D.a+=dt*1.6;D.x=p.x+Math.cos(D.a)*58;D.y=p.y+Math.sin(D.a)*30-34}
  if(cd.drone<=0){let any=false;for(let i=0;i<nd;i++){const D=S.drs[i],tg=randomNear(p.x,p.y,250);if(tg){any=true;S.bul.push({rk:1,x:D.x,y:D.y,tg,d:18+6*L0,L:L0,t:0,a:Math.atan2(tg.y-D.y,tg.x-D.x)})}}
   if(any){cd.drone=Math.max(.6,1.7-.22*L0)*cdm;AudioFx.cue('whoosh',.35,.1)}else cd.drone=.25}}
 const tev=EV('turret');for(const t of S.tur){t.t+=dt;t.cd-=dt;if(t.cd<=0){const z=nearest(t.x,t.y,200);if(z){t.cd=tev?.13:.26;t.a=Math.atan2(z.y-t.y,z.x-t.x);S.fx.push({k:'pop',x:t.x+Math.cos(t.a)*12,y:t.y-6+Math.sin(t.a)*12,t:0,life:.06,R:13,c:'#ffd166'});S.bul.push({x:t.x,y:t.y-6,vx:Math.cos(t.a)*520,vy:Math.sin(t.a)*520,d:(7+2*t.L)*(tev?1.3:1),pr:0,t:0,hit:[],col:'#ffd166',tc:1})}else t.cd=.15}}
 S.tur=S.tur.filter(t=>t.t<t.life)}

// ================================================================ 판 끝
function calcReward(won){const b=S.kills*.12+S.t*.35+(won?60:0);return Math.round(b*(1+.3*S.st)*(1+.3*(S.diff-1))*(1+.08*upLv('sup')))}
function finishRun(won){if(S.over)return;S.over=true;S.won=won;const rw=calcReward(won);S.reward=rw;save.sup+=rw;mission('time',Math.round(S.t-(S.tc||0)));S.tc=S.t;
 if(won){const k=S.st;save.stats.clears++;mission('clear');const first=!save.clr[k+1];save.clr[k+1]=1;save.diff[k]=Math.max(save.diff[k]||1,S.diff+1);
  const st=1+(S.revived||S.kitUsed?0:1)+(P.hp>=P.maxHp*.5?1:0);S.stars=st;save.stars[k]=Math.max(save.stars[k]||0,st);S.first=first;
  if(first&&k<4){const nw=WEAPONS.find(w=>UNLOCK[w]===k+1);S.unlockMsg=L((k+2)+'구역 열림','第'+(k+2)+'区已开放')+(nw?' · '+L('새 무기 ','新武器 ')+LL(WP[nw].n):'')}}
 save.best[S.st]=Math.max(save.best[S.st]||0,Math.round(S.t));if(!save.firstDone){save.firstDone=true}
 persist();track(won?'run_clear':'run_fail',{st:S.st+1,diff:S.diff,t:Math.round(S.t),k:S.kills,lv:S.lv,evo:S.evoN,rev:S.revived?1:0});
 AudioFx.cue(won?'win':'lose');vib('long');sc='result'}
function revive(){S.over=false;S.revived=true;sc='battle';save.sup=Math.max(0,save.sup-S.reward);S.reward=0;persist();reviveP(.6);track('revive',{st:S.st+1,t:Math.round(S.t)})}

// ================================================================ 그리기 도구
const OUT='#070a12';
function pathRect(x,y,w,h,r=12){r=Math.max(0,Math.min(r,w/2,h/2));g.beginPath();g.moveTo(x+r,y);g.lineTo(x+w-r,y);g.quadraticCurveTo(x+w,y,x+w,y+r);g.lineTo(x+w,y+h-r);g.quadraticCurveTo(x+w,y+h,x+w-r,y+h);g.lineTo(x+r,y+h);g.quadraticCurveTo(x,y+h,x,y+h-r);g.lineTo(x,y+r);g.quadraticCurveTo(x,y,x+r,y);g.closePath()}
function rr(x,y,w,h,r,fill,stroke,lw=2){pathRect(x,y,w,h,r);if(fill){g.fillStyle=fill;g.fill()}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke()}}
function panel(x,y,w,h,r=18,edge){rr(x,y,w,h,r,'rgba(14,20,32,.95)',edge||'#3a4a60',2)}
function font(n,w=800){g.font=w+' '+n+'px system-ui,-apple-system,"PingFang SC","Noto Sans KR","Malgun Gothic",sans-serif'}
function txt(s,x,y,n=24,color='#eef2f7',align='left',stroke=true,w=800){s=String(s);font(n,w);g.textAlign=align;g.textBaseline='middle';if(stroke){g.lineWidth=Math.max(3,n/6);g.strokeStyle=OUT;g.lineJoin='round';g.strokeText(s,x,y)}g.fillStyle=color;g.fillText(s,x,y)}
function wrap(s,n,maxW){font(n,600);const out=[];for(const raw of String(s).split('\n')){let cur='';const words=LANG==='zh'?raw.split(''):raw.split(' ');for(const w0 of words){const tryS=cur?(LANG==='zh'?cur+w0:cur+' '+w0):w0;if(g.measureText(tryS).width>maxW&&cur){out.push(cur);cur=w0}else cur=tryS}out.push(cur)}return out}
function para(s,x,y,n,color,maxW,lh,align='left'){const ls=wrap(s,n,maxW);ls.forEach((l,i)=>txt(l,x,y+i*lh,n,color,align,false,600));return ls.length}
let HITS=[];function hit(x,y,w,h,fn){HITS.push({x,y,w,h,fn})}
const BTN={gold:['#7a3416','#ff8a3d','#fff3e6'],blue:['#12304a','#59c8ff','#e7f6ff'],green:['#16402e','#5dff9a','#eafff4'],gray:['#1a2230','#4a5668','#c0ccdc'],dark:['#121a26','#3a4a60','#dfe7f2'],red:['#4a1a1e','#ff6a6a','#ffe8e8']};
function button(x,y,w,h,label,style,size,fn,dis){const C=BTN[style||'gold'];g.save();if(dis)g.globalAlpha=.45;rr(x,y+5,w,h,h*.28,'rgba(0,0,0,.5)');rr(x,y,w,h,h*.28,C[0],C[1],3);
 const gr=g.createLinearGradient(0,y,0,y+h);gr.addColorStop(0,'rgba(255,255,255,.12)');gr.addColorStop(1,'rgba(255,255,255,0)');rr(x+3,y+3,w-6,h/2,h*.25,gr);txt(label,x+w/2,y+h/2+1,size||26,C[2],'center',true);g.restore();hit(x,y,w,h,fn)}
function redDot(x,y){g.fillStyle='#ff4a3a';g.beginPath();g.arc(x,y,11,0,TAU);g.fill();g.strokeStyle=OUT;g.lineWidth=2;g.stroke()}
function supIcon(x,y,s){g.save();g.translate(x,y);g.fillStyle='#ffd166';g.strokeStyle=OUT;g.lineWidth=2.5;pathRect(-s,-s*.75,s*2,s*1.5,s*.25);g.fill();g.stroke();g.fillStyle='#b8862f';g.fillRect(-s,-s*.15,s*2,s*.3);g.fillRect(-s*.15,-s*.75,s*.3,s*1.5);g.restore()}
function star(x,y,s,on){g.save();g.translate(x,y);g.beginPath();for(let k=0;k<10;k++){const r=k%2?s*.45:s,a=-PI/2+k*PI/5;g.lineTo(Math.cos(a)*r,Math.sin(a)*r)}g.closePath();g.fillStyle=on?'#ffd166':'#2a3446';g.fill();g.strokeStyle=OUT;g.lineWidth=2;g.stroke();g.restore()}
// 무기·보조 아이콘(그림 파일 없이 선으로 그림)
function icon(k,x,y,s,col){g.save();g.translate(x,y);g.strokeStyle=col;g.fillStyle=col;g.lineWidth=Math.max(2,s*.12);g.lineCap='round';g.lineJoin='round';const r=s*.42;
 if(k==='gun'){g.beginPath();g.moveTo(-r,-r*.2);g.lineTo(r,-r*.2);g.lineTo(r,r*.2);g.lineTo(-r*.2,r*.2);g.lineTo(-r*.4,r);g.lineTo(-r,r);g.closePath();g.fill()}
 else if(k==='saw'){g.beginPath();for(let i=0;i<16;i++){const a=i*TAU/16,rr2=i%2?r:r*.68;g.lineTo(Math.cos(a)*rr2,Math.sin(a)*rr2)}g.closePath();g.fill();g.fillStyle=OUT;g.beginPath();g.arc(0,0,r*.25,0,TAU);g.fill()}
 else if(k==='molo'){g.beginPath();g.moveTo(-r*.35,-r*.3);g.lineTo(-r*.35,r);g.lineTo(r*.35,r);g.lineTo(r*.35,-r*.3);g.lineTo(r*.15,-r*.55);g.lineTo(r*.15,-r*.8);g.lineTo(-r*.15,-r*.8);g.lineTo(-r*.15,-r*.55);g.closePath();g.fill();g.fillStyle='#ffd166';g.beginPath();g.arc(0,-r,r*.25,0,TAU);g.fill()}
 else if(k==='pulse'){for(let i=1;i<=3;i++){g.beginPath();g.arc(-r*.4,0,r*.35*i,-.8,.8);g.stroke()}g.fillRect(-r,-r*.3,r*.5,r*.6)}
 else if(k==='bolt'){g.beginPath();g.moveTo(r*.2,-r);g.lineTo(-r*.5,r*.1);g.lineTo(0,r*.1);g.lineTo(-r*.2,r);g.lineTo(r*.5,-r*.15);g.lineTo(0,-r*.15);g.closePath();g.fill()}
 else if(k==='frost'){for(let i=0;i<3;i++){g.save();g.rotate(i*PI/3);g.beginPath();g.moveTo(0,-r);g.lineTo(0,r);g.moveTo(-r*.3,-r*.7);g.lineTo(0,-r*.45);g.lineTo(r*.3,-r*.7);g.moveTo(-r*.3,r*.7);g.lineTo(0,r*.45);g.lineTo(r*.3,r*.7);g.stroke();g.restore()}}
 else if(k==='drone'){g.beginPath();g.ellipse(0,r*.15,r*.45,r*.3,0,0,TAU);g.fill();g.beginPath();g.moveTo(-r,-r*.35);g.lineTo(r,-r*.35);g.moveTo(-r*.6,-r*.35);g.lineTo(-r*.3,0);g.moveTo(r*.6,-r*.35);g.lineTo(r*.3,0);g.stroke()}
 else if(k==='turret'){g.fillRect(-r*.7,0,r*1.4,r*.8);g.beginPath();g.arc(0,0,r*.45,PI,0);g.fill();g.beginPath();g.moveTo(0,-r*.2);g.lineTo(r,-r*.8);g.stroke()}
 else if(k==='spd'){g.beginPath();g.moveTo(-r,r*.5);g.lineTo(r,r*.5);g.lineTo(r,r*.1);g.lineTo(0,-r*.1);g.lineTo(-r*.3,-r*.6);g.lineTo(-r,-r*.6);g.closePath();g.fill()}
 else if(k==='mag'){g.lineWidth=s*.2;g.beginPath();g.arc(0,0,r*.65,PI,0);g.moveTo(-r*.65,0);g.lineTo(-r*.65,r*.8);g.moveTo(r*.65,0);g.lineTo(r*.65,r*.8);g.stroke()}
 else if(k==='arm'){g.beginPath();g.moveTo(0,-r);g.lineTo(r*.8,-r*.6);g.lineTo(r*.7,r*.3);g.lineTo(0,r);g.lineTo(-r*.7,r*.3);g.lineTo(-r*.8,-r*.6);g.closePath();g.fill()}
 else if(k==='pow'){for(let i=-1;i<=1;i++){g.fillRect(i*r*.55-r*.18,-r*.4,r*.36,r*1.2);g.beginPath();g.arc(i*r*.55,-r*.4,r*.18,PI,0);g.fill()}}
 else if(k==='cd'){g.beginPath();g.arc(0,r*.1,r*.8,0,TAU);g.stroke();g.beginPath();g.moveTo(0,r*.1);g.lineTo(0,-r*.4);g.moveTo(0,r*.1);g.lineTo(r*.35,r*.3);g.stroke();g.fillRect(-r*.2,-r,r*.4,r*.2)}
 g.restore()}
function iconBox(k,x,y,s,lvN,evo){const D=WP[k];rr(x-s/2,y-s/2,s,s,s*.22,evo?'rgba(70,40,10,.92)':'rgba(10,14,22,.85)',evo?'#ffd166':D.c,2);icon(k,x,y,s*.8,evo?'#ffd166':D.c);
 if(lvN!=null&&!evo){for(let i=0;i<D.m;i++){g.fillStyle=i<lvN?D.c:'rgba(255,255,255,.18)';g.fillRect(x-s/2+4+i*((s-8)/D.m),y+s/2-6,(s-8)/D.m-2,4)}}if(evo)txt('★',x+s/2-8,y-s/2+9,13,'#ffd166','center',true)}
function drawFinger(x,y,label){const b=Math.sin(frame*7)*10;g.save();g.translate(x,y+b);g.globalAlpha=.95;g.beginPath();g.arc(0,-6,28+Math.sin(frame*7)*4,0,TAU);g.strokeStyle='rgba(255,209,102,.7)';g.lineWidth=4;g.stroke();
 g.fillStyle='#fff3e6';g.strokeStyle=OUT;g.lineWidth=3;pathRect(-11,-12,22,52,11);g.fill();g.stroke();g.restore();if(label)txt(label,x,y+82,24,'#ffd166','center')}

// ================================================================ 전투 그리기
function drawEnemy(z){const F=ZF[z.t];if(!F)return;if(z.el)glow(z.x,z.y,z.r*2.8,'#ffd166',.4+.15*Math.sin(S.t*6));const S2=F.S*(z.el===2?1.8:z.el?1.4:1),im=z.fl>0?F.white:(z.st===1?F.tele:F.f[((z.ph*NF/TAU)|0)%NF]);g.save();g.translate(z.x,z.y);g.rotate(z.ang-PI/2);g.drawImage(im,-S2/2,-S2/2,S2,S2);g.restore();
 if(z.st===1){g.strokeStyle='rgba(255,138,61,.9)';g.lineWidth=2;g.beginPath();if(z.t==='boss')g.arc(z.x,z.y,95,0,TAU);else{g.moveTo(z.x,z.y);g.lineTo(z.tx,z.ty)}g.stroke()}
 if(z.t==='blk'||z.el){const w=z.el?46:30;g.fillStyle='rgba(0,0,0,.6)';g.fillRect(z.x-w/2,z.y-z.r-14,w,4);g.fillStyle='#ff4d5e';g.fillRect(z.x-w/2,z.y-z.r-14,w*clamp(z.hp/z.mhp,0,1),4)}}
function drawWorld(){const p=P;let cx=clamp(p.x-VW/2,0,WW-VW),cy=clamp(p.y-VH/2,0,WH-VH);if(shakeT>0){cx+=rand(-1,1)*shakeT*14;cy+=rand(-1,1)*shakeT*14}S.cam.x=cx;S.cam.y=cy;
 g.save();g.scale(ZS,ZS);g.translate(-cx,-cy);g.drawImage(lvl,Math.max(0,cx),Math.max(0,cy),VW,VH,Math.max(0,cx),Math.max(0,cy),VW,VH);
 for(const d of S.dec){const a=Math.min(1,d.life-d.t);if(d.k==='splat'){g.fillStyle='rgba(20,60,55,'+.4*a+')';for(let i=0;i<5;i++){const b=d.a+i*1.4;g.beginPath();g.ellipse(d.x+Math.cos(b)*d.R*.5,d.y+Math.sin(b)*d.R*.35,d.R*(.3+.12*(i%3)),d.R*(.2+.08*(i%2)),b,0,TAU);g.fill()}}
  else if(d.k==='crack'){g.strokeStyle='rgba(8,8,10,'+.75*a+')';g.lineWidth=2.2;for(let i=0;i<8;i++){const b=d.a+i*.785;g.beginPath();g.moveTo(d.x,d.y);let r=0;for(let k=0;k<4;k++){r+=d.R/4;const bb=b+Math.sin(i*7+k*3)*.25;g.lineTo(d.x+Math.cos(bb)*r,d.y+Math.sin(bb)*r*.8)}g.stroke()}}
  else{g.fillStyle='rgba(170,230,255,'+.2*a+')';g.beginPath();g.ellipse(d.x,d.y,d.R,d.R*.8,0,0,TAU);g.fill();g.strokeStyle='rgba(220,245,255,'+.5*a+')';g.lineWidth=1.5;g.stroke()}}
 for(const o of S.pools){const a=Math.min(1,(o.life-o.t)*2);g.fillStyle='rgba(10,6,4,'+.5*a+')';g.beginPath();g.ellipse(o.x,o.y,o.R,o.R*.8,0,0,TAU);g.fill()}
 const inV=(x,y,m)=>x>cx-m&&x<cx+VW+m&&y>cy-m&&y<cy+VH+m;
 for(const gm of S.gems){if(!inV(gm.x,gm.y,10))continue;const r=gm.v>=10?4.5:gm.v>=4?3.4:2.4;g.fillStyle=gm.v>=10?'#ffd166':gm.v>=4?'#7fe3ff':'#8dffb9';g.beginPath();g.moveTo(gm.x,gm.y-r*1.3);g.lineTo(gm.x+r,gm.y);g.lineTo(gm.x,gm.y+r*1.3);g.lineTo(gm.x-r,gm.y);g.fill()}
 for(const k of S.pk){const dy=k.drop>0?-k.drop*180:0;if(k.drop>0){g.fillStyle='rgba(0,0,0,.4)';g.beginPath();g.ellipse(k.x,k.y,14*(1-k.drop*.6),6,0,0,TAU);g.fill()}else{g.strokeStyle='#ffd166';g.lineWidth=1.5;g.beginPath();g.arc(k.x,k.y,13+Math.sin(S.t*5)*1.5,0,TAU);g.stroke()}prop(k.k,k.x,k.y+dy,k.k==='crate'?22:18)}
 for(const t of S.tur){g.globalAlpha=Math.min(1,(t.life-t.t)*2);prop('turret',t.x,t.y,26);g.globalAlpha=1}
 for(const z of S.zs){if(inV(z.x,z.y,50))drawEnemy(z)}
 if(p.inv>0&&((S.t*20)|0)%2)g.globalAlpha=.5;drawRunner(g,p.x,p.y,p.ang,p.phase,p.mv,34);g.globalAlpha=1;
 if(lv('saw')){const n=EV('saw')?8:lv('saw')+1,R=S.sawR||54;for(let i=0;i<n;i++){const a=S.sawA+i*TAU/n,sx=p.x+Math.cos(a)*R,sy=p.y+Math.sin(a)*R;g.save();g.translate(sx,sy);g.rotate(S.t*18);g.fillStyle=EV('saw')?'#ffe9a8':'#cfd8e3';g.beginPath();for(let k=0;k<10;k++){const r=k%2?11:7,b=k*.628;g.lineTo(Math.cos(b)*r,Math.sin(b)*r)}g.fill();g.fillStyle='#5a6676';g.beginPath();g.arc(0,0,3,0,TAU);g.fill();g.restore()}}
 g.lineCap='round';for(const b of S.bul){if(b.mol){const t=b.t/b.life,x=b.x0+(b.x-b.x0)*t,y=b.y0+(b.y-b.y0)*t-Math.sin(t*PI)*40;prop(b.mol===2?'battery':'firebottle',x,y,b.mol===2?13:9,t*9);continue}
  if(b.rk){g.strokeStyle='#e6edf6';g.lineWidth=3;g.beginPath();g.moveTo(b.x,b.y);g.lineTo(b.x-Math.cos(b.a)*8,b.y-Math.sin(b.a)*8);g.stroke();continue}
  g.strokeStyle=b.col||'#9fe8ff';g.lineWidth=b.big?4:2.4;g.beginPath();g.moveTo(b.x,b.y);g.lineTo(b.x-b.vx*(b.big?.05:.028),b.y-b.vy*(b.big?.05:.028));g.stroke()}
 for(const f of S.fx){const t=f.t/f.life;if(f.k==='gib'){g.globalAlpha=1-t;g.fillStyle=f.c;for(let i=0;i<f.n;i++){const a=f.a+i*1.3,r=(10+i%3*8)*(1-(1-t)*(1-t))*1.7;g.beginPath();g.arc(f.x+Math.cos(a)*r,f.y+Math.sin(a)*r*.8,2.4-(i%2),0,TAU);g.fill()}g.globalAlpha=1}}
 if(lv('drone'))for(let i=0;i<(EV('drone')?3:1);i++){const D=S.drs[i];if(!D.x)continue;g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(D.x,D.y+38,9,4,0,0,TAU);g.fill();g.fillStyle='#1b2230';g.beginPath();g.ellipse(D.x,D.y,9,5.5,0,0,TAU);g.fill();g.strokeStyle='#3a4454';g.lineWidth=2;g.beginPath();g.moveTo(D.x-12,D.y-3);g.lineTo(D.x+12,D.y-3);g.stroke()}
 // ---- 빛 더하기 ----
 g.globalCompositeOperation='lighter';
 if(!qualityLow)for(const gm of S.gems){if(!inV(gm.x,gm.y,10))continue;glow(gm.x,gm.y,gm.v>=4?9:6.5,gm.v>=10?'#ffd166':gm.v>=4?'#7fe3ff':'#5dff9a',.45+.2*Math.sin(S.t*6+gm.x))}
 for(const k of S.pk){glow(k.x,k.y,26,'#ffd166',.35+.15*Math.sin(S.t*5));g.globalAlpha=.25;g.fillStyle='#ffd166';g.fillRect(k.x-2,k.y-60,4,60)}
 if(!qualityLow)for(const z of S.zs){if(z.slowT>0&&inV(z.x,z.y,30))glow(z.x,z.y,z.r*2,'#7fe3ff',z.frz?.7:.4)}
 for(const o of S.pools){const a=Math.min(1,(o.life-o.t)*2)*Math.min(1,o.t*6);glow(o.x,o.y,o.R*1.25,'#ff5a14',.4*a);const n=qualityLow?3:8;for(let i=0;i<n;i++){const b=i*.9+o.x,r2=o.R*.6*((i%3+1)/3),fx=o.x+Math.cos(b+S.t*.8)*r2,fy=o.y+Math.sin(b*1.3+S.t)*r2*.7-((S.t*34+i*11)%16),r=o.R*(.36+.12*Math.sin(S.t*9+i));glow(fx,fy,r,'#ff7a1a',.55*a);glow(fx,fy+3,r*.5,'#ffe08a',.6*a)}}
 for(const b of S.bul){if(b.mol)continue;if(b.rk){glow(b.x-Math.cos(b.a)*8,b.y-Math.sin(b.a)*8,9,'#ff8a3d',.9);continue}glow(b.x,b.y,b.big?13:b.tc?8:9,b.tc?'#ffd166':b.big?'#bdf3ff':'#59d7ff',.85)}
 if(lv('saw')&&!qualityLow){const n=EV('saw')?8:lv('saw')+1,R=S.sawR||54;for(let i=0;i<n;i++){const a=S.sawA+i*TAU/n;for(let k=0;k<3;k++){g.globalAlpha=.22-.06*k;g.strokeStyle=EV('saw')?'#ffe9a8':'#cfe6ff';g.lineWidth=9-2*k;g.beginPath();g.arc(p.x,p.y,R,a-.35-.3*k,a-.3*k);g.stroke()}}}
 if(lv('drone'))for(let i=0;i<(EV('drone')?3:1);i++){const D=S.drs[i];if(D.x){glow(D.x-9,D.y-3,6,'#ff6ad5',.9);glow(D.x+9,D.y-3,6,'#ff6ad5',.9)}}
 for(const t of S.tur)glow(t.x,t.y-4,20,'#ffd166',.18+.08*Math.sin(S.t*8));
 for(const e of S.eb){glow(e.x,e.y,14,'#ff5a3a',.95);glow(e.x,e.y,6,'#ffffff',.95)}
 for(const b of S.bolts){const al=1-b.t/.14,P2=[b.pts[0]];for(let i=1;i<b.pts.length;i++){const o=b.pts[i-1],q=b.pts[i];P2.push([o[0]+(q[0]-o[0])*.33+rand(-9,9),o[1]+(q[1]-o[1])*.33+rand(-9,9)],[o[0]+(q[0]-o[0])*.66+rand(-9,9),o[1]+(q[1]-o[1])*.66+rand(-9,9)],q)}
  for(const [w,a2,c2] of [[10,.25,'#2fb8ff'],[4.5,.7,'#9fe8ff'],[1.8,1,'#ffffff']]){g.globalAlpha=a2*al;g.strokeStyle=c2;g.lineWidth=w;g.lineJoin='round';g.beginPath();g.moveTo(P2[0][0],P2[0][1]);for(let i=1;i<P2.length;i++)g.lineTo(P2[i][0],P2[i][1]);g.stroke()}for(let i=1;i<b.pts.length;i++)glow(b.pts[i][0],b.pts[i][1],18,'#7fe3ff',.8*al)}
 for(const f of S.fx){const t=f.t/f.life;if(f.k==='pop'){glow(f.x,f.y,f.R*(.6+.6*t),f.c,(1-t)*.9);glow(f.x,f.y,f.R*.4,'#ffffff',(1-t)*.8)}
  else if(f.k==='boom'){glow(f.x,f.y,f.R*(.5+.9*t),f.c,(1-t)*.9);glow(f.x,f.y,f.R*(.3+.3*t),'#fff3c4',(1-t)*(1-t));g.globalAlpha=(1-t)*.8;g.strokeStyle=f.c;g.lineWidth=4*(1-t)+1;g.beginPath();g.arc(f.x,f.y,f.R*(.3+.9*t),0,TAU);g.stroke()}
  else if(f.k==='wave'){glow(f.x,f.y,f.R*(.3+.9*t),f.c,(1-t)*.35);g.strokeStyle=f.c;for(const [o,w] of [[0,7],[.12,3]]){const tt=Math.max(0,t-o);g.globalAlpha=(1-t)*.9;g.lineWidth=w*(1-t)+1;g.beginPath();g.ellipse(f.x,f.y,f.R*(.2+.8*tt),f.R*(.2+.8*tt)*.85,0,0,TAU);g.stroke()}}
  else if(f.k==='pillar'){const gr=g.createLinearGradient(0,f.y-170,0,f.y+10);gr.addColorStop(0,f.c+'00');gr.addColorStop(1,f.c+'cc');g.globalAlpha=(1-t)*.8;g.fillStyle=gr;const w=30*(1-t*.5);g.fillRect(f.x-w/2,f.y-170,w,180);glow(f.x,f.y,40,f.c,(1-t)*.8)}}
 for(const q of S.pt){const t=q.t/q.life;glow(q.x,q.y,q.s*(2.2-1.2*t),q.c,1-t)}
 g.globalAlpha=1;g.globalCompositeOperation='source-over';
 g.textAlign='center';g.textBaseline='middle';for(const n of S.num){if(n.t<0)continue;const k=Math.min(1,n.t*10);g.globalAlpha=Math.max(0,1-n.t*2);font(((n.cr?19:n.big?15:10)*(1.5-.5*k))|0,900);g.lineWidth=2.5;g.strokeStyle='rgba(0,0,0,.7)';g.strokeText(n.s,n.x,n.y-n.t*26);g.fillStyle=n.col||(n.cr?'#ff7a3d':n.big?'#ffd166':'#fff');g.fillText(n.s,n.x,n.y-n.t*26)}g.globalAlpha=1;
 g.fillStyle='rgba(0,0,0,.6)';g.fillRect(p.x-18,p.y+20,36,4);g.fillStyle=p.hp/p.maxHp>.35?'#5dff9a':'#ff4d5e';g.fillRect(p.x-18,p.y+20,36*p.hp/p.maxHp,4);
 g.restore()}
function drawBattle(){drawWorld();
 if(S.siren){const a=.1+.08*Math.sin(frame*8),gr=g.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.75);gr.addColorStop(0,'rgba(255,40,40,0)');gr.addColorStop(1,'rgba(255,40,40,'+a*2+')');g.fillStyle=gr;g.fillRect(0,0,W,H)}
 if(P.hp<P.maxHp*.25){const gr=g.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,H*.8);gr.addColorStop(0,'rgba(120,0,0,0)');gr.addColorStop(1,'rgba(150,0,10,'+(.25+.15*Math.sin(frame*6))+')');g.fillStyle=gr;g.fillRect(0,0,W,H)}
 if(S.od>0){const gr=g.createRadialGradient(W/2,H/2,H*.32,W/2,H/2,H*.78);gr.addColorStop(0,'rgba(255,190,80,0)');gr.addColorStop(1,'rgba(255,170,60,'+(.22+.08*Math.sin(frame*12))+')');g.fillStyle=gr;g.fillRect(0,0,W,H)}
 if(flashT>0){g.fillStyle='rgba(255,30,40,'+flashT*(save.mild?.6:1.2)+')';g.fillRect(0,0,W,H)}
 drawHUD();
 if(joy.on){g.strokeStyle='rgba(255,255,255,.25)';g.lineWidth=3;g.beginPath();g.arc(joy.ox,joy.oy,84,0,TAU);g.stroke();g.fillStyle='rgba(255,255,255,.3)';g.beginPath();g.arc(joy.ox+joy.x*84,joy.oy+joy.y*84,32,0,TAU);g.fill()}
 if(S.tut&&S.moved<220&&!S.pick)drawFinger(375+Math.sin(frame*1.5)*120,980,L('화면을 끌어서 이동 · 공격은 자동','拖动屏幕移动 · 自动攻击'));
 const ov=S.pick||S.chest||paused;
 if(bigMsg&&!ov){bigMsg.life-=1/60;const a=Math.min(1,bigMsg.life*2,(2.2-bigMsg.life)*4);g.save();g.globalAlpha=Math.max(0,a);rr(40,430,670,150,24,'rgba(6,10,18,.78)');txt(bigMsg.t,375,482,46,bigMsg.col,'center');if(bigMsg.sub)txt(bigMsg.sub,375,540,22,'#d8e0ea','center',false,700);g.restore();if(bigMsg.life<=0)bigMsg=null}
 if(S.pick)drawPick();else if(S.chest)drawChest();else if(paused)drawPause();
 if(confirmQuit)drawConfirm()}
const mmss=t=>((t/60)|0)+':'+String((t%60)|0).padStart(2,'0');
function drawHUD(){g.fillStyle='rgba(0,0,0,.6)';g.fillRect(0,0,W,16);const xf=clamp(S.xp/S.need,0,1),gr=g.createLinearGradient(0,0,W,0);gr.addColorStop(0,'#3ef2d0');gr.addColorStop(1,'#8dffb9');g.fillStyle=gr;g.fillRect(0,0,W*xf,16);
 txt('Lv '+S.lv,24,48,30,'#8dffb9');const left=BOSS_T-S.t;txt(mmss(S.t),375,48,42,S.bossOut?'#ff9a7a':'#ffffff','center');txt('☠ '+S.kills,375,88,22,'#d8e0ea','center',true,700);
 if(!S.bossOut&&left<20&&left>0)txt(L('문지기까지 ','守门者 ')+Math.ceil(left)+L('초',' 秒'),375,122,20,'#ff9a7a','center');
 rr(676,24,54,54,12,'rgba(10,14,22,.85)','#3a4a60',2);g.fillStyle='#eef2f7';g.fillRect(693,38,7,26);g.fillRect(706,38,7,26);hit(670,18,66,66,()=>{if(!overlayOn())paused=true});
 const ws=Object.keys(S.w);let i=0;for(const k of ws){if(WP[k].p)continue;iconBox(k,40+i*58,150,50,S.w[k],EV(k));i++}i=0;for(const k of ws){if(!WP[k].p)continue;iconBox(k,32+i*44,204,38,S.w[k],false);i++}
 if(S.boss&&!S.boss.dead){const b=S.boss;panel(120,252,510,40,12,'#ff6a6a');rr(126,258,498*clamp(b.hp/b.mhp,0,1),28,8,'#d93a4a');txt(LL(ZN.boss),375,272,20,'#fff','center')}
 {const od=S.od>0,f=od?S.od/7:clamp(S.odG/odNeed(),0,1);g.fillStyle='rgba(0,0,0,.6)';g.fillRect(24,80,170,12);g.fillStyle=od?'#ffd166':'#ff8a3d';g.fillRect(26,82,166*f,8);txt(od?L('과열!','狂热！'):L('과열','狂热'),204,87,15,od?'#ffd166':'#c89a78','left',false,800)}
 for(const k of S.pk)if(k.k==='crate')edgeArrow(k.x,k.y,'#ffd166');for(const z of S.zs)if(z.el||z.t==='boss')edgeArrow(z.x,z.y,'#ff5a4a');
 // 사이렌 버튼
 const sx=652,sy=1210,on=S.siren;g.save();if(on){g.shadowColor='rgba(255,70,50,.9)';g.shadowBlur=24}g.beginPath();g.arc(sx,sy,66+(on?Math.sin(frame*10)*3:0),0,TAU);g.fillStyle=on?'#e8402e':'rgba(40,14,6,.88)';g.fill();g.lineWidth=4;g.strokeStyle=on?'#fff':'#ff8a3d';g.stroke();g.restore();
 txt(L('사이렌','警报'),sx,sy-18,24,on?'#fff':'#ffd0a8','center');txt(L('떼 ×2','尸潮×2'),sx,sy+10,17,on?'#fff':'#ffb48a','center',false);txt(L('경험치 ×2','经验×2'),sx,sy+32,17,on?'#fff':'#ffb48a','center',false);
 hit(sx-70,sy-70,140,140,()=>{if(overlayOn())return;S.siren=!S.siren;AudioFx.cue(S.siren?'siren':'ui',.7);message(S.siren?L('사이렌 ON · 떼 ×2 · 경험치 ×2','警报开启 · 尸潮×2 · 经验×2'):L('사이렌 OFF','警报关闭'),1.2);track('siren',{on:S.siren?1:0,t:Math.round(S.t)})})}
function edgeArrow(wx,wy,col){const sx=(wx-S.cam.x)*ZS,sy=(wy-S.cam.y)*ZS;if(sx>0&&sx<W&&sy>0&&sy<H)return;const cx=clamp(sx,44,W-44),cy=clamp(sy,330,H-200),a=Math.atan2(sy-cy,sx-cx),s=16+Math.sin(frame*8)*3;g.save();g.translate(cx,cy);g.rotate(a);g.fillStyle=col;g.strokeStyle='rgba(0,0,0,.8)';g.lineWidth=3;g.beginPath();g.moveTo(s,0);g.lineTo(-s*.7,-s*.75);g.lineTo(-s*.3,0);g.lineTo(-s*.7,s*.75);g.closePath();g.stroke();g.fill();g.restore()}
function cardBox(x,y,w,h,k,fn){const D=WP[k],l=lv(k)+1;rr(x,y+6,w,h,22,'rgba(0,0,0,.5)');rr(x,y,w,h,22,'rgba(14,20,32,.97)',D.c,3);iconBox(k,x+70,y+h/2,92,null,false);
 txt(LL(D.n),x+136,y+44,30,'#ffffff');txt(l===1?'NEW':'Lv '+l,x+w-28,y+44,22,D.c,'right');txt(D.p?L('보조','辅助'):L('무기','武器'),x+136,y+h-26,16,'#8b97a8','left',false,700);
 para(LL(D.d(l)),x+136,y+86,21,'#c8d2de',w-170,28);if(D.p){const ow=ownedW().find(o=>WP[o].ev===k&&!EV(o));if(ow)txt(L('진화 재료 → ','进化材料 → ')+LL(WP[ow].en),x+w-28,y+h-26,16,'#ffd166','right',false,700)}
 if(!D.p)txt(L('진화 짝: ','进化需要：')+LL(WP[D.ev].n),x+w-28,y+h-26,16,'#ffd166','right',false,700);hit(x,y,w,h,fn)}
function drawPick(){const P0=S.pick;P0.t+=1/60;g.fillStyle='rgba(3,5,10,.72)';g.fillRect(0,0,W,H);txt(L('레벨 업','升级'),375,330,26,'#8dffb9','center');txt(L('하나를 골라요','选择一项'),375,380,44,'#ffffff','center');
 P0.opts.forEach((k,i)=>{const y=440+i*196,a=Math.min(1,P0.t*5-i*.5);if(a<=0)return;g.save();g.globalAlpha=a;cardBox(55,y+(1-a)*40,640,176,k,()=>{if(P0.t>.35)applyPick(k)});g.restore()});
 const fr=S.rerolls>0;if(fr||!S.adReroll)button(195,1050,360,78,fr?L('다시 뽑기 (무료 ','重抽（免费 ')+S.rerolls+')':L('📺 다시 뽑기','📺 重抽'),fr?'dark':'blue',24,reroll)}
function drawChest(){const C=S.chest;C.t+=1/60;g.fillStyle='rgba(3,5,10,.8)';g.fillRect(0,0,W,H);const a=Math.min(1,C.t*3);g.save();g.globalAlpha=a;
 g.globalCompositeOperation='lighter';glow(375,520,220+Math.sin(frame*3)*14,C.type==='evo'?WP[C.k].c:'#ffd166',.55);g.globalCompositeOperation='source-over';
 if(C.type==='evo'){txt(L('무기 진화!','武器进化！'),375,330,30,'#ffd166','center');iconBox(C.k,375,520,150,null,true);txt(LL(WP[C.k].n)+'  →',375,650,24,'#c8d2de','center',false,700);txt(LL(WP[C.k].en),375,710,52,WP[C.k].c,'center');para(LL(WP[C.k].ed),375,775,24,'#e6edf6',560,34,'center')}
 else if(C.type==='up'){txt(L('보급 상자','补给箱'),375,330,44,'#ffd166','center');C.ks.forEach((k,i)=>{const x=C.ks.length===1?375:255+i*240;iconBox(k,x,520,130,null,false);txt(LL(WP[k].n),x,620,24,'#fff','center');txt('Lv '+(lv(k)+1),x,660,22,WP[k].c,'center')});txt(L('무기 강화','武器强化'),375,740,24,'#c8d2de','center',false)}
 else{txt(L('보급 상자','补给箱'),375,330,44,'#ffd166','center');prop('medkit',375,520,120);txt(L('체력 모두 회복','生命全部回复'),375,660,30,'#7fe0b0','center')}
 g.restore();if(C.t>.5)button(195,900,360,90,L('받기','领取'),'gold',32,takeChest)}
function drawPause(){g.fillStyle='rgba(3,5,10,.8)';g.fillRect(0,0,W,H);txt(L('일시정지','暂停'),375,300,48,'#fff','center');
 panel(95,360,560,240,20);const ws=Object.keys(S.w);ws.forEach((k,i)=>{const x=150+(i%6)*90,y=420+Math.floor(i/6)*90;iconBox(k,x,y,70,S.w[k],EV(k))});
 txt(LL(STAGES[S.st].n)+(S.diff>1?' · '+L('난이도 ','难度 ')+S.diff:''),375,570,20,'#a9b6c8','center',false,700);
 button(175,650,400,90,L('계속하기','继续'),'gold',30,()=>{paused=false});button(175,760,400,80,L('설정','设置'),'dark',24,()=>{guideRet='battle';sc='settings'});
 button(175,860,400,80,L('안내서','指南'),'dark',24,()=>{guideRet='battle';guidePage=0;sc='guide'});button(175,960,400,80,L('포기하고 나가기','放弃并退出'),'red',24,()=>{confirmQuit=true})}
function drawConfirm(){HITS=[];hit(0,0,W,H,()=>{});g.fillStyle='rgba(0,0,0,.7)';g.fillRect(0,0,W,H);panel(75,480,600,330,22,'#ff6a6a');txt(L('정말 나갈까요?','确定要退出吗？'),375,550,34,'#fff','center');
 para(L('지금까지 버틴 만큼 물자는 받아요.','会按目前的表现获得物资。'),375,605,20,'#c8d2de',520,30,'center');
 button(110,690,250,86,L('취소','取消'),'dark',26,()=>{confirmQuit=false});button(390,690,250,86,L('나가기','退出'),'red',26,()=>{confirmQuit=false;paused=false;finishRun(false);S.quit=true})}

// ================================================================ 화면들
function wantMusic(){if(sc==='loading')return;let k='menu';if(sc==='battle'&&S)k=S.boss&&!S.boss.dead?'boss':'battle';else if(sc==='result'&&S)k=S.won?'win':'menu';else if((sc==='settings'||sc==='guide'||sc==='privacy')&&guideRet==='battle')k=Music.cur||'battle';Music.play(k)}
function bgMap(st,dim){const im=imgs['map'+(st+1)];if(im){const s=Math.max(W/SW,H/SH)*1.02;g.drawImage(im,(W-SW*s)/2,(H-SH*s)/2,SW*s,SH*s)}else{g.fillStyle='#0b0f18';g.fillRect(0,0,W,H)}g.fillStyle='rgba(4,6,12,'+dim+')';g.fillRect(0,0,W,H)}
let loadT=0;
function loadingScreen(){loadT+=1/60;g.fillStyle='#070a12';g.fillRect(0,0,W,H);const done=IMG_LIST.filter(n=>imgs[n]).length,tot=IMG_LIST.length,mustOk=MUST.every(n=>imgs[n]||imgFail[n]);
 g.globalCompositeOperation='lighter';glow(375,560,200+Math.sin(loadT*3)*10,'#ff8a3d',.35);g.globalCompositeOperation='source-over';
 txt('DEAD ROUTE',375,580,76,'#ffffff','center');txt(L('좀비 떼 생존','尸潮突围'),375,650,30,'#ff8a3d','center');
 rr(165,760,420,18,9,'#1a2234','#3a4a60',2);rr(167,762,Math.max(6,416*done/tot),14,7,'#ff8a3d');
 if(loadT>6)txt(L('인터넷이 느려 시간이 걸리고 있어요','网络较慢，正在努力加载'),375,820,20,'#a9b6c8','center',false);
 if((mustOk&&done>=tot&&loadT>.6&&buildSprites())||loadT>25||(mustOk&&loadT>10&&buildSprites())){const bad=MUST.some(n=>imgFail[n]||!imgs[n]);
  dailyInit();if(bad){sc='title';message(L('일부 그림을 못 받았어요. 새로고침해 주세요','部分图片加载失败，请刷新'),6)}else if(!save.firstDone){newRun(0,1,true)}else sc='title';track('load_done',{t:Math.round(loadT),bad:bad?1:0})}}
function nextGoal(){if(!save.clr[1])return[L('목표: 주거 지구에서 문지기를 쓰러뜨리고 탈출','目标：在住宅区击倒守门者并撤离'),'#ffe2c4'];
 const cu=UPG.find(u=>upLv(u.k)<u.m&&save.sup>=upCost(u));if(cu)return[L('▲ 지금 대피소에서 ','▲ 现在可在避难所强化 ')+LL(cu.n)+L(' 강화 가능!',''),'#7fe0b0'];
 for(let i=1;i<5;i++)if(!save.clr[i+1]&&save.clr[i])return[L('다음 목표: ','下一目标：')+LL(STAGES[i].n)+L(' 탈출',' 撤离'),'#ffe2c4'];
 return[L('다음 목표: 더 높은 난이도에 도전','下一目标：挑战更高难度'),'#ffe2c4']}
function title(){const ti=imgs.title;if(ti){g.fillStyle='#05070c';g.fillRect(0,0,W,H);const th=W*ti.height/ti.width;g.drawImage(ti,0,0,W,th);let gr=g.createLinearGradient(0,0,0,340);gr.addColorStop(0,'rgba(5,7,12,.8)');gr.addColorStop(1,'rgba(5,7,12,0)');g.fillStyle=gr;g.fillRect(0,0,W,340);gr=g.createLinearGradient(0,680,0,th);gr.addColorStop(0,'rgba(5,7,12,0)');gr.addColorStop(1,'rgba(5,7,12,1)');g.fillStyle=gr;g.fillRect(0,680,W,th-680)}else{bgMap(0,.6)}
 txt('DEAD ROUTE',375,190,84,'#ffffff','center');txt(L('좀비 떼 생존','尸潮突围'),375,262,34,'#ff8a3d','center');
 supIcon(540,330,14);txt(save.sup,566,330,28,'#ffe2a0');txt(L('별 ','星 ')+totalStars()+'/15',200,330,22,'#ffd166','center');
 const [goal,gc]=nextGoal();rr(60,770,630,56,16,'rgba(10,14,22,.8)');txt(goal,375,798,19,gc,'center',false,700);
 button(130,850,490,110,L('출동','出动'),'gold',44,()=>{sc='prep'});
 button(130,980,240,84,L('대피소','避难所'),'green',26,()=>{sc='shelter'});if(canUpgrade())redDot(362,986);
 button(380,980,240,84,L('보상','奖励'),'blue',26,()=>{sc='reward'});if(rewardBadge())redDot(612,986);
 button(130,1076,156,70,L('업적','成就'),'dark',21,()=>{sc='ach'});if(achReady())redDot(280,1080);button(297,1076,156,70,L('안내서','指南'),'dark',21,()=>{guidePage=0;guideRet='title';sc='guide'});button(464,1076,156,70,L('설정','设置'),'dark',21,()=>{guideRet='title';sc='settings'});
 if(!save.patrol){save.patrol=Date.now();persist()}const pa=patrolAmt();rr(60,700,630,58,16,'rgba(10,14,22,.85)',pa>0?'#ffd166':'#3a4a60',2);supIcon(96,729,11);txt(L('순찰 보상 ','巡逻收益 ')+'+'+pa,120,729,21,pa>0?'#ffe2a0':'#8b97a8','left',false,800);txt(pa>0?L('받기 ▶','领取 ▶'):L('시간당 ','每小时 ')+patrolRate(),668,729,19,pa>0?'#ffd166':'#8b97a8','right',false,800);if(pa>=patrolRate()*2)redDot(684,704);
 hit(60,700,630,58,()=>{if(patrolAmt()>0)patrolPop=true;else message(L('순찰대가 물자를 모으는 중이에요 (최대 8시간)','巡逻队正在收集物资（最多8小时）'),1.6)});
 if(LANG==='zh'){const hn=['抵制不良游戏，拒绝盗版游戏。','注意自我保护，谨防受骗上当。','适度游戏益脑，沉迷游戏伤身。','合理安排时间，享受健康生活。'];txt('健康游戏忠告',375,1180,17,'#a9b6c8','center',false);hn.forEach((l,i)=>txt(l,375,1208+i*24,15,'#8a96a8','center',false))}
 txt('v'+BUILD,740,1322,13,'#5a6676','right',false);
 if(patrolPop){HITS=[];hit(0,0,W,H,()=>{});g.fillStyle='rgba(3,5,10,.78)';g.fillRect(0,0,W,H);panel(95,430,560,420,24,'#ffd166');txt(L('순찰 보상','巡逻收益'),375,490,36,'#fff','center');txt(L('쉬는 동안 순찰대가 모아 온 물자예요','这是你休息时巡逻队带回的物资'),375,540,18,'#a9b6c8','center',false,700);supIcon(310,610,20);txt('+'+patrolAmt(),345,610,44,'#ffd166');
  button(140,670,470,84,L('📺 광고 보고 2배 받기','📺 看广告领取双倍'),'blue',24,()=>showAd('patrol',()=>{patrolClaim(2);patrolPop=false}));button(140,766,470,66,L('그냥 받기','直接领取'),'dark',22,()=>{patrolClaim(1);patrolPop=false})}}
let patrolPop=false,prepBoost=false;
function achScreen(){bgMap(4,.88);if(!save.ach)save.ach={};txt(L('업적','成就'),375,70,40,'#fff','center');supIcon(560,120,12);txt(save.sup,582,120,24,'#ffe2a0');
 ACH.forEach((a,i)=>{const y=150+i*102,v=Math.min(a.g,achVal(a)),done=v>=a.g,got=save.ach[i];panel(40,y,670,92,16,done&&!got?'#ff8a3d':'#3a4a60');txt(LL(a.n),64,y+30,21,got?'#7f8a9a':'#fff','left',false,700);g.fillStyle='#0b1020';g.fillRect(64,y+56,360,14);g.fillStyle=got?'#4a6a5a':'#ffd166';g.fillRect(64,y+56,360*v/a.g,14);txt(v+'/'+a.g,440,y+63,15,'#a9b6c8','left',false);
  if(got)txt(L('받음','已领取'),615,y+46,20,'#7fe0b0','center');else{button(540,y+16,150,60,'+'+a.r,done?'gold':'gray',22,()=>{if(!done)return;save.ach[i]=1;giveSup(a.r);track('ach',{i})},!done);if(done)redDot(684,y+20)}});
 button(175,1200,400,80,L('◀ 돌아가기','◀ 返回'),'gold',26,()=>{sc='title'})}
let prepSt=null;
function prep(){bgMap(prepSt==null?save.stage-1:prepSt,.78);if(prepSt==null)prepSt=clamp((save.stage|0)-1,0,4);if(!stageOpen(prepSt))prepSt=0;
 txt(L('출동 준비','出动准备'),375,70,40,'#fff','center');supIcon(560,120,12);txt(save.sup,582,120,24,'#ffe2a0');
 for(let i=0;i<5;i++){const y=150+i*142,open=stageOpen(i),sel=i===prepSt,D=STAGES[i];rr(40,y,670,128,18,sel?'rgba(60,30,12,.95)':'rgba(14,20,32,.92)',sel?'#ff8a3d':'#3a4a60',sel?4:2);
  const im=imgs['map'+(i+1)];g.save();pathRect(52,y+12,170,104,12);g.clip();if(im)g.drawImage(im,0,300,724,440,52,y+12,170,104);if(!open){g.fillStyle='rgba(0,0,0,.7)';g.fillRect(52,y+12,170,104)}g.restore();
  txt((i+1)+'. '+LL(D.n),244,y+40,28,open?'#fff':'#6a7688');txt(open?LL(D.d):L('앞 구역을 탈출하면 열려요','撤离上一区后开放'),244,y+80,18,open?'#a9b6c8':'#5a6676','left',false,600);
  if(open){for(let s=0;s<3;s++)star(612+s*30,y+40,12,(save.stars[i]||0)>s);if(save.best[i])txt(L('최고 ','最佳 ')+mmss(save.best[i]),680,y+84,16,'#8b97a8','right',false)}else txt('🔒',660,y+64,30,'#fff','center',false);
  hit(40,y,670,128,()=>{if(open){prepSt=i;save.stage=i+1;persist()}else message(L('앞 구역을 먼저 탈출하세요','请先撤离上一区'),1.2)})}
 const md=save.diff[prepSt]||1;if(!save.dsel)save.dsel={};let dsel=clamp(save.dsel[prepSt]||1,1,md);
 if(md>1){panel(40,868,670,80,16);button(56,878,70,60,'◀','dark',26,()=>{save.dsel[prepSt]=Math.max(1,dsel-1);persist()});button(624,878,70,60,'▶','dark',26,()=>{save.dsel[prepSt]=Math.min(md,dsel+1);persist()});
  txt(L('난이도 ','难度 ')+dsel+' / '+md,375,896,26,'#fff','center');txt(dsel>1?L('적 체력 +','敌人生命 +')+(40*(dsel-1))+L('% · 물자 +','% · 物资 +')+(30*(dsel-1))+'%':L('기본 난이도','基础难度'),375,926,16,'#a9b6c8','center',false)}
 txt(L('시작 무기','初始武器'),56,986,22,'#ffd166');button(410,958,300,54,prepBoost?L('✓ 강화 출발 준비됨','✓ 强化出发已就绪'):L('📺 강화 출발 · Lv3 시작','📺 强化出发 · Lv3开局'),prepBoost?'green':'blue',18,()=>{if(!prepBoost)showAd('boost',()=>{prepBoost=true})});
 WEAPONS.forEach((k,i)=>{const x=86+i*82,y=1046,op=weaponOpen(k),sel=save.startW===k;if(sel){g.globalCompositeOperation='lighter';glow(x,y,56,WP[k].c,.5);g.globalCompositeOperation='source-over'}
  g.save();if(!op)g.globalAlpha=.35;iconBox(k,x,y,sel?72:62,null,false);g.restore();if(!op)txt('🔒',x,y,22,'#fff','center',false);
  hit(x-38,y-38,76,76,()=>{if(op){save.startW=k;persist()}else message(LL(STAGES[UNLOCK[k]-1].n)+L('을 탈출하면 열려요',' 撤离后开放'),1.4)})});
 txt(LL(WP[save.startW].n)+' · '+LL(WP[save.startW].d(1)),375,1100,18,'#c8d2de','center',false,600);
 button(40,1170,200,96,'◀','dark',32,()=>{sc='title'});button(260,1160,450,110,L('출동!','出动！'),'gold',42,()=>{const b=prepBoost;prepBoost=false;newRun(prepSt,dsel,false,b)});
 tip('prep',[['구역을 고르고 시작 무기를 정한 뒤 출동해요.','选择区域和初始武器后出动。'],['구역을 탈출할 때마다 다음 구역과 새 무기가 열려요.','每撤离一个区域，就会开放下一区和新武器。']])}
function upIcon(k,x,y,s){if(k==='sup'){supIcon(x,y,s*.32);return}if(k==='revive'){prop('medkit',x,y,s*.8);return}if(k==='reroll'){g.save();g.translate(x,y);g.strokeStyle='#59c8ff';g.lineWidth=s*.1;g.beginPath();g.arc(0,0,s*.3,.3,5.6);g.stroke();g.fillStyle='#59c8ff';g.beginPath();g.moveTo(s*.32,-s*.2);g.lineTo(s*.42,s*.05);g.lineTo(s*.16,0);g.fill();g.restore();return}
 if(k==='xp'){g.fillStyle='#8dffb9';g.beginPath();g.moveTo(x,y-s*.38);g.lineTo(x+s*.28,y);g.lineTo(x,y+s*.38);g.lineTo(x-s*.28,y);g.fill();return}if(k==='hp'){g.fillStyle='#ff6a7a';g.beginPath();g.moveTo(x,y+s*.32);g.bezierCurveTo(x-s*.5,y-s*.05,x-s*.2,y-s*.45,x,y-s*.15);g.bezierCurveTo(x+s*.2,y-s*.45,x+s*.5,y-s*.05,x,y+s*.32);g.fill();return}
 icon(k,x,y,s,'#5dff9a')}
function shelter(){bgMap(1,.82);txt(L('대피소','避难所'),375,70,40,'#fff','center');supIcon(330,124,13);txt(save.sup,354,124,28,'#ffe2a0');txt(L('영구 강화 · 모든 출동에 적용','永久强化 · 适用于所有出动'),375,166,18,'#a9b6c8','center',false,700);
 UPG.forEach((u,i)=>{const y=200+i*104,l=upLv(u.k),max=l>=u.m,cost=upCost(u),can=!max&&save.sup>=cost;panel(40,y,670,94,16,can?'#5dff9a':'#3a4a60');rr(54,y+12,70,70,14,'rgba(0,0,0,.35)');upIcon(u.k,89,y+47,60);
  txt(LL(u.n),140,y+30,25,'#fff');txt(LL(u.e(Math.max(1,l))),140,y+66,17,l?'#8dffb9':'#8b97a8','left',false,600);
  for(let p=0;p<u.m;p++){g.fillStyle=p<l?'#5dff9a':'rgba(255,255,255,.15)';g.fillRect(340+p*(110/u.m),y+24,110/u.m-3,8)}
  if(max)txt(L('최대','已满'),620,y+47,22,'#7fe0b0','center');else{button(530,y+16,166,62,'',can?'gold':'gray',20,()=>{if(save.sup<cost){message(L('물자가 부족해요','物资不足'),1.2);return}save.sup-=cost;save.up[u.k]=l+1;persist();AudioFx.cue('win');vib('medium');track('upgrade',{k:u.k,lv:l+1});message(LL(u.n)+' Lv '+(l+1),1.2)},false);supIcon(566,y+48,10);txt(cost,588,y+48,22,can?'#fff3e6':'#9aa6b6')}});
 button(175,1166,400,86,L('◀ 돌아가기','◀ 返回'),'gold',28,()=>{sc='title'});
 tip('shelter',[['출동에서 모은 물자로 대피소를 강화해요. 모든 출동에 계속 적용돼요.','用出动获得的物资强化避难所，对之后所有出动都有效。'],['져도 버틴 만큼 물자를 받아요.','即使失败，也会按坚持的时间获得物资。']])}
function rewardScreen(){dailyInit();bgMap(2,.86);txt(L('보상','奖励'),375,70,40,'#fff','center');supIcon(560,120,12);txt(save.sup,582,120,24,'#ffe2a0');
 txt(L('출석 보상','签到奖励'),50,160,26,'#ffd166');const st=save.att.streak%7;
 for(let d=0;d<7;d++){const x=40+d*97,y=190;rr(x,y,88,118,14,d<st?'rgba(22,64,46,.95)':'rgba(14,20,32,.94)',d===st&&attCan()?'#ff8a3d':'#3a4a60',2);txt(L('','第')+(d+1)+L('일','天'),x+44,y+22,17,'#a9b6c8','center',false);supIcon(x+44,y+60,11);txt(ATT[d],x+44,y+94,19,'#fff','center');if(d<st)txt('✓',x+72,y+20,20,'#7fe0b0','center')}
 button(175,322,400,70,attCan()?L('출석하기','签到'):L('내일 또 만나요','明天再来'),attCan()?'gold':'gray',24,()=>{if(!attCan())return;const d=save.att.streak%7;save.att.last=todayKey();save.att.streak++;giveSup(ATT[d]);track('attend',{d})},!attCan());if(attCan())redDot(568,328);
 txt(L('오늘의 미션','今日任务'),50,440,26,'#ffd166');
 save.daily.m.forEach((m,k)=>{const M=MISSIONS[m.i],y=468+k*112,done=m.p>=M.goal;panel(40,y,670,98,16,done&&!m.c?'#ff8a3d':'#3a4a60');txt(LL(M.n),64,y+30,21,'#fff','left',false,700);rr(64,y+58,360,16,8,'#0b1020');rr(65,y+59,358*m.p/M.goal,14,7,'#ff8a3d');txt(m.p+'/'+M.goal,440,y+66,16,'#a9b6c8','left',false);
  if(m.c)txt(L('받음','已领取'),620,y+50,20,'#7fe0b0','center');else button(540,y+20,150,60,'+'+M.r,done?'gold':'gray',22,()=>{if(!done)return;m.c=true;giveSup(M.r);track('mission',{k:M.k})},!done);if(done&&!m.c)redDot(684,y+24)});
 const n=save.starBox||0,nx=STAR_BOX[n];txt(L('별 상자','星星宝箱'),50,830,26,'#ffd166');panel(40,858,670,96,16,starBoxReady()?'#ff8a3d':'#3a4a60');
 if(nx){star(84,906,18,true);txt(totalStars()+' / '+nx[0],112,906,24,'#fff');rr(240,898,240,16,8,'#0b1020');rr(241,899,238*Math.min(1,totalStars()/nx[0]),14,7,'#ffd166');const rd=starBoxReady();button(540,876,150,60,'+'+nx[1],rd?'gold':'gray',22,()=>{if(!starBoxReady())return;save.starBox=n+1;giveSup(nx[1]);track('starbox',{n})},!rd);if(rd)redDot(684,880)}
 else txt(L('모든 별 상자를 열었어요','已打开全部星星宝箱'),375,906,22,'#7fe0b0','center');
 txt(L('대피소 보급품','避难所补给'),50,1000,26,'#ffd166');txt(L('광고를 보면 물자 ','看广告获得物资 ')+boxAmt()+L(' (하루 3번)','（每天3次）'),50,1038,17,'#a9b6c8','left',false,600);
 const left=boxLeft();button(175,1062,400,80,left?L('📺 받기 (','📺 领取（')+left+L('번 남음)','次）'):L('내일 다시 열려요','明天再来'),left?'blue':'gray',22,()=>{if(!boxLeft())return;showAd('box',()=>{if(save.boxDay!==todayKey()){save.boxDay=todayKey();save.boxN=0}save.boxN++;giveSup(boxAmt())})},!left);
 button(175,1190,400,80,L('◀ 돌아가기','◀ 返回'),'gold',26,()=>{sc='title'});tip('reward',[['출석·미션·별 상자·보급품으로 매일 물자를 받을 수 있어요.','通过签到、任务、星星宝箱和补给，每天都能获得物资。']])}
function boxAmt(){return 60+20*Object.keys(save.clr).length}
const GUIDE=[
 {t:['게임 흐름','游戏流程'],flow:true},
 {t:['조작','操作'],items:[['화면 끌기','拖动屏幕','손가락을 댄 자리에 조이스틱이 생겨요. 끄는 방향으로 달려요.','手指按下的地方会出现摇杆，往拖动方向奔跑。'],['공격은 자동','自动攻击','가진 무기가 모두 알아서 공격해요. 피하고, 줍고, 고르는 데만 집중하세요.','所有武器都会自动攻击。专注于闪避、拾取和选择。'],['사이렌','警报','켜면 떼가 두 배로 몰려오지만 경험치도 두 배예요. 언제 켜고 끌지가 실력이에요.','开启后尸潮翻倍，经验也翻倍。何时开关就是技术。'],['과열','狂热','계속 쓰러뜨리면 게이지가 차요. 가득 차면 7초 동안 공격이 빨라지고 치명타가 늘어요.','连续击倒会积攒能量，满后7秒内攻速加快、暴击提高。'],['초록 빛','绿光','쓰러진 놈이 떨어뜨려요. 모으면 레벨이 올라 능력을 골라요.','击倒敌人会掉落，收集后升级并选择能力。']]},
 {t:['무기 진화','武器进化'],evo:true},
 {t:['감염체','感染者'],items:[['감염자 · 추적자','感染者 · 追踪者','가장 흔한 놈. 붉은 추적자는 빠르지만 약해요.','最常见的敌人。红色追踪者速度快但很脆弱。'],['덮치기형','扑击者','주황 선이 보이면 그 방향으로 덮쳐요. 옆으로 피하세요.','出现橙色线时会朝那个方向扑来，往侧面躲。'],['지휘형 · 거구','指挥者 · 巨躯','지휘형은 주변 놈들을 빠르게 만들고, 거구는 단단해요. 지휘형부터 쓰러뜨리세요.','指挥者让周围敌人加速，巨躯很坚硬。优先击倒指挥者。'],['정예 (금빛)','精英（金色）','35초마다 금빛으로 나타나요. 쓰러뜨리면 보급 상자를 줘요. 화살표가 위치를 알려 줘요.','每35秒以金色出现，击倒后掉落补给箱。箭头会指示位置。'],['문지기','守门者','2분 30초에 나타나요. 주황 원이 보이면 원 밖으로! 체력이 줄면 붉은 탄을 사방으로 쏴요.','2分30秒出现。看到橙色圈就离开！血量降低后会向四周发射红色弹幕。']]},
 {t:['성장','成长'],items:[['물자','物资','출동이 끝나면 버틴 시간과 쓰러뜨린 수만큼 받아요. 져도 받아요.','出动结束后按坚持时间和击倒数获得，失败也有。'],['대피소','避难所','물자로 체력·공격력 등을 영구 강화해요.','用物资永久强化生命、攻击力等。'],['구역 · 무기','区域 · 武器','구역을 탈출하면 다음 구역과 새 시작 무기가 열려요.','撤离区域后开放下一区和新的初始武器。'],['난이도 · 별','难度 · 星','탈출하면 더 높은 난이도가 열려요. 부활 없이, 체력 절반 이상으로 탈출하면 별 3개.','撤离后开放更高难度。不复活且生命过半撤离可得3星。']]}];
function guideScreen(){bgMap(3,.88);const P0=GUIDE[guidePage];txt(L('안내서','指南')+' '+(guidePage+1)+'/'+GUIDE.length,375,60,22,'#a9b6c8','center',false);txt(LL(P0.t),375,110,42,'#fff','center');
 if(P0.flow){const steps=[[L('출동','出动'),L('구역과 시작 무기 선택','选择区域和初始武器')],[L('끌어서 이동 · 자동 공격','拖动移动 · 自动攻击'),L('초록 빛을 모아 레벨 업','收集绿光升级')],[L('능력 고르기 · 진화','选择能力 · 进化'),L('보급 상자에서 무기 진화','在补给箱中进化武器')],[L('2분 30초 · 문지기','2分30秒 · 守门者'),L('쓰러뜨리면 탈출!','击倒即可撤离！')],[L('물자로 대피소 강화','用物资强化避难所'),L('더 강해져서 다시 출동','变得更强再次出动')]];
  steps.forEach((s2,i)=>{const y=170+i*176;panel(130,y,490,122,20,'#ff8a3d');txt(s2[0],375,y+44,27,'#fff','center');txt(s2[1],375,y+84,19,'#a9b6c8','center',false,600);if(i<steps.length-1){g.fillStyle='#ff8a3d';g.beginPath();g.moveTo(355,y+132);g.lineTo(395,y+132);g.lineTo(375,y+162);g.closePath();g.fill()}});
  g.strokeStyle='#ff8a3d';g.lineWidth=4;g.setLineDash([10,8]);g.beginPath();g.moveTo(620,935);g.lineTo(690,935);g.lineTo(690,230);g.lineTo(620,230);g.stroke();g.setLineDash([]);txt(L('반복','循环'),700,590,18,'#ff8a3d','center',false)}
 else if(P0.evo){txt(L('무기 Lv 5 + 짝 보조 → 보급 상자에서 진화','武器 Lv5 + 对应辅助 → 补给箱中进化'),375,165,20,'#ffd166','center',false,700);
  WEAPONS.forEach((k,i)=>{const y=200+i*118;panel(40,y,670,106,16);iconBox(k,92,y+53,70,null,false);txt('+',152,y+53,28,'#fff','center');iconBox(WP[k].ev,200,y+53,56,null,false);txt('→',258,y+53,28,'#ffd166','center');
   txt(LL(WP[k].en),290,y+34,24,WP[k].c);para(LL(WP[k].ed),290,y+70,17,'#c8d2de',400,24)})}
 else{let y=190;for(const it of P0.items){txt(LANG==='zh'?it[1]:it[0],60,y+20,25,'#ff8a3d');const n=para(LANG==='zh'?it[3]:it[2],60,y+62,21,'#e0e6ee',630,31);y+=70+n*31+24}}
 button(40,1200,200,80,'◀','dark',30,()=>{guidePage=(guidePage+GUIDE.length-1)%GUIDE.length});button(510,1200,200,80,'▶','dark',30,()=>{guidePage=(guidePage+1)%GUIDE.length});
 button(255,1200,240,80,L('닫기','关闭'),'gold',26,()=>{sc=guideRet==='battle'?'battle':'title';track('guide_open',{p:guidePage})})}
function onoff(v){return v?L('켜짐','开'):L('꺼짐','关')}
function settingsScreen(){g.fillStyle='#0b0f18';g.fillRect(0,0,W,H);txt(L('설정','设置'),375,140,42,'#fff','center');
 button(130,210,490,76,L('화질: ','画质：')+(qualityLow?L('절약','省电'):L('높음','高')),'gray',24,()=>{qualityLow=!qualityLow;qualityManual=true;persist()});txt(qualityManual?L('수동 설정됨','已手动设置'):L('기기 성능에 따라 자동 전환','根据设备性能自动切换'),375,304,16,'#a9b6c8','center',false);
 button(130,330,240,76,L('음악: ','音乐：')+onoff(Music.on),'gray',22,()=>Music.toggle());button(380,330,240,76,L('효과음: ','音效：')+onoff(AudioFx.enabled),'gray',22,()=>{AudioFx.enabled=!AudioFx.enabled;save.sfx=AudioFx.enabled;persist()});
 button(130,426,240,76,L('흔들림: ','屏幕晃动：')+onoff(save.shake!==false),'gray',22,()=>{save.shake=save.shake===false;persist()});button(380,426,240,76,L('진동: ','振动：')+onoff(save.vib!==false),'gray',22,()=>{save.vib=save.vib===false;persist();vib('medium')});
 button(130,522,490,76,'🌐 '+(LANG==='zh'?'语言：简体中文':'언어: 한국어'),'gray',24,()=>{LANG=LANG==='zh'?'ko':'zh';persist()});
 button(130,618,490,76,L('순화 연출: ','温和画面：')+onoff(save.mild),'gray',22,()=>{save.mild=!save.mild;persist()});txt(L('쓰러진 놈의 흔적과 붉은 화면 효과를 줄여요','减少敌人倒下的痕迹和红色画面效果'),375,712,15,'#a9b6c8','center',false);
 button(130,738,490,76,L('개인정보 처리방침','隐私政策'),'blue',22,()=>{sc='privacy'});
 if(guideRet!=='battle'){button(130,854,490,76,L('진행 초기화','重置进度'),'red',22,()=>{if(resetArm>0){try{if(API&&API.removeStorageSync)API.removeStorageSync(SAVE_KEY);else localStorage.removeItem(SAVE_KEY)}catch(e){}
   Object.assign(save,{sup:0,up:{},clr:{},stars:{},diff:{},best:{},dsel:{},firstDone:false,tips:{},daily:null,att:{last:'',streak:0},boxDay:'',boxN:0,starBox:0,stats:{kills:0,runs:0,clears:0,evo:0},startW:'gun',stage:1});persist();resetArm=0;track('reset',{});message(L('초기화했어요','已重置'),1.4);sc='title'}else resetArm=3});
  if(resetArm>0){resetArm-=1/60;txt(L('한 번 더 누르면 모든 진행이 지워집니다','再按一次将清除所有进度'),375,954,17,'#ff9a8a','center',false)}}
 button(150,1180,450,80,L('◀ 돌아가기','◀ 返回'),'gold',26,()=>{sc=guideRet==='battle'?'battle':'title'})}
function privacyScreen(){g.fillStyle='#0b0f18';g.fillRect(0,0,W,H);txt(L('개인정보 처리방침','隐私政策'),375,100,34,'#fff','center');rr(40,150,670,990,16,'#121826','#2e3646',2);
 para(L('1. 이 게임은 회원가입이 없으며, 개발자는 이름·전화번호·위치 같은 개인정보를 수집하지 않습니다.\n\n2. 게임 진행 기록(물자, 대피소 강화, 설정)은 이 기기 안에만 저장됩니다. 게임을 삭제하거나 저장 공간을 지우면 함께 지워집니다.\n\n3. 보상형 광고는 위챗·더우인 플랫폼이 제공합니다. 광고를 보여 주기 위해 플랫폼이 기기 정보를 처리할 수 있으며, 이는 각 플랫폼의 개인정보 정책을 따릅니다.\n\n4. 게임 개선을 위해 출동 시작·탈출·실패, 광고 시청 같은 익명 통계를 플랫폼 통계 기능으로 집계합니다. 개인을 식별하는 정보는 포함하지 않습니다.\n\n5. 공유 기능은 사용자가 직접 누를 때만 작동합니다.\n\n6. 문의: 게임 정보 페이지의 개발자 연락처로 보내 주세요.',
 '1. 本游戏无需注册，开发者不收集姓名、手机号、位置等个人信息。\n\n2. 游戏进度（物资、避难所强化、设置）仅保存在本设备中，删除游戏或清除缓存后将一并删除。\n\n3. 激励视频广告由微信/抖音平台提供。为展示广告，平台可能处理设备信息，相关处理遵循各平台的隐私政策。\n\n4. 为改进游戏，我们通过平台统计功能汇总出动开始/撤离/失败、广告观看等匿名数据，不包含可识别个人身份的信息。\n\n5. 分享功能仅在用户主动点击时使用。\n\n6. 联系方式：请通过游戏资料页中的开发者联系方式与我们联系。'),70,200,19,'#d8e0ea',610,32);
 button(150,1180,450,80,L('◀ 돌아가기','◀ 返回'),'gold',26,()=>{sc='settings'})}
function resultScreen(){const won=S.won;bgMap(S.st,won?.55:.78);if(won){const gr=g.createLinearGradient(0,H,0,0);gr.addColorStop(0,'rgba(255,170,90,.4)');gr.addColorStop(1,'rgba(255,170,90,0)');g.fillStyle=gr;g.fillRect(0,0,W,H)}
 txt(won?L('탈출 성공!','撤离成功！'):S.quit?L('철수했다','已撤退'):L('쓰러졌다','倒下了'),375,190,56,won?'#ffe2c4':'#ff9a7a','center');txt(LL(STAGES[S.st].n)+(S.diff>1?' · '+L('난이도 ','难度 ')+S.diff:''),375,252,22,'#c8d2de','center',false,700);
 if(won)for(let s=0;s<3;s++)star(315+s*60,312,24,(S.stars||0)>s);
 panel(95,350,560,132,22);const rows=[[L('버틴 시간','坚持时间'),mmss(S.t)],[L('쓰러뜨린 수','击倒数'),S.kills],[L('레벨','等级'),S.lv],[L('진화','进化'),S.evoN]];rows.forEach((r2,i)=>{const cx=i%2?392:126,cy=392+((i/2)|0)*52;txt(r2[0],cx,cy,19,'#c0ccdc','left',false,700);txt(r2[1],cx+232,cy,24,'#fff','right')});
 supIcon(250,524,16);txt(L('물자 +','物资 +')+S.reward+(S.doubled?' ×2':''),280,524,32,'#ffd166');
 const dm=Object.keys(S.dmg).filter(k=>WP[k]&&S.dmg[k]>0).sort((a,b)=>S.dmg[b]-S.dmg[a]).slice(0,4);let y=566;
 if(dm.length){const tot=Object.keys(S.dmg).reduce((s,k)=>s+S.dmg[k],0)||1,mx=S.dmg[dm[0]]||1;panel(95,y,560,44+dm.length*42,22);txt(L('무기별 피해','武器伤害占比'),120,y+24,17,'#8b97a8','left',false,700);
  dm.forEach((k,i)=>{const yy=y+62+i*42;iconBox(k,134,yy,34,null,EV(k));txt(LL(EV(k)?WP[k].en:WP[k].n),164,yy-9,16,'#dfe6ee','left',false,700);g.fillStyle='#0b1020';g.fillRect(164,yy+5,380,10);g.fillStyle=WP[k].c;g.fillRect(164,yy+5,380*S.dmg[k]/mx,10);txt(Math.round(S.dmg[k]/tot*100)+'%',632,yy,18,'#fff','right')});y+=44+dm.length*42+34}
if(S.unlockMsg){txt('🔓 '+S.unlockMsg,375,y,22,'#7fe0b0','center');y+=46}
 if(!won&&!S.revived&&!S.quit&&!S.tut){button(140,y,470,86,L('📺 광고 보고 다시 일어나기','📺 看广告重新站起来'),'blue',24,()=>showAd('revive',()=>revive()));y+=104}
 if(!S.doubled&&S.reward>0){button(140,y,470,80,L('📺 광고 보고 물자 2배','📺 看广告物资翻倍'),'blue',22,()=>showAd('double',()=>{S.doubled=true;save.sup+=S.reward;persist();AudioFx.cue('win')}));y+=96}
 if(won){button(140,y,470,72,L('친구에게 자랑하기','分享给好友'),'dark',22,shareGame);y+=90}
 const tutDone=S.tut;button(140,y,230,84,L('대피소로','回避难所'),'green',24,()=>{S=null;sc=tutDone?'shelter':'title'});button(380,y,230,84,L('다시 출동','再次出动'),'gold',26,()=>{const st=S.st,d=S.diff;S=null;newRun(st,d,false)})}

// ================================================================ 안내 팁 · 광고 · 알림
function tip(id,lines){if(save.tips[id])return false;save.tips[id]=1;persist();track('tut_step',{k:id});guideTip={lines,t:0};return true}
function drawGuideTip(){HITS=[];hit(0,0,W,H,()=>{if(guideTip.t>.4)guideTip=null});guideTip.t+=1/60;g.fillStyle='rgba(4,7,14,.72)';g.fillRect(0,0,W,H);
 const ls=guideTip.lines.map(l=>LL(l)),cnt=ls.map(l=>wrap(l,22,560).length),tot=cnt.reduce((a,b)=>a+b,0),h=130+tot*32+(ls.length-1)*16,y0=600-h/2;
 panel(50,y0,650,h,20,'#ff8a3d');txt('💡 '+L('안내','提示'),90,y0+44,28,'#fff');let yy=y0+96;ls.forEach((l,i)=>{txt('•',80,yy,22,'#ff8a3d','left',false);para(l,104,yy,22,'#f0f2f7',560,32);yy+=cnt[i]*32+16});
 if(Math.sin(frame*6)>-.3)txt('▼ '+L('터치해서 닫기','点击关闭'),672,y0+h-22,15,'#ff8a3d','right',false)}
function drawAd(){HITS=[];hit(0,0,W,H,()=>{});adShow.t+=1/60;g.fillStyle='rgba(0,0,0,.92)';g.fillRect(0,0,W,H);txt(L('광고 재생 중 (테스트)','广告播放中（测试）'),375,620,30,'#fff','center');rr(175,680,400,16,8,'#222');rr(177,682,396*Math.min(1,adShow.t/2),12,6,'#ff8a3d');
 txt(L('실제 출시판에서는 위챗·더우인 보상형 광고가 재생됩니다','正式版将播放微信/抖音激励视频广告'),375,740,16,'#9fb0c4','center',false);if(adShow.t>=2){const f=adShow.cb;adShow=null;f()}}
function drawBanner(){if(bannerT>0&&bannerSc!==sc)bannerT=0;if(sc==='battle'&&S&&(S.pick||S.chest||paused))return;if(bannerT>0){const by=sc==='battle'?300:sc==='title'?630:1110;g.save();g.globalAlpha=Math.min(1,bannerT*2);rr(95,by,560,60,14,'rgba(40,20,14,.94)','#ff8a3d',2);txt(banner,375,by+30,21,'#fff','center',false,700);g.restore();bannerT-=1/60}}

// ================================================================ 입력 (전투: 어디든 끌면 조이스틱 / 떼기: 버튼)
const keys={};
if(!API&&typeof addEventListener==='function'){addEventListener('keydown',e=>{keys[(e.key||'').toLowerCase()]=1});addEventListener('keyup',e=>{keys[(e.key||'').toLowerCase()]=0})}
function input(){let x=joy.x+((keys.d||keys.arrowright)?1:0)-((keys.a||keys.arrowleft)?1:0),y=joy.y+((keys.s||keys.arrowdown)?1:0)-((keys.w||keys.arrowup)?1:0);const l=hyp(x,y);if(l>1){x/=l;y/=l}return{x,y}}
function coords(px,py){if(API){const k=c.width/(info.windowWidth||375);return[(px*k-view.ox)/view.s,(py*k-view.oy)/view.s]}const r=c.getBoundingClientRect();return[(px-r.left)/r.width*W,(py-r.top)/r.height*H]}
function onHit(x,y){for(let i=HITS.length-1;i>=0;i--){const h=HITS[i];if(x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h)return h}return null}
function pDown(x,y){AudioFx.init();Music.kick();ptr={x,y,sx:x,sy:y,mode:'tap'};
 if(sc==='battle'&&S&&!overlayOn()&&!onHit(x,y)){ptr.mode='joy';joy.on=true;joy.ox=x;joy.oy=y;joy.x=joy.y=0}}
function pMove(x,y){if(!ptr)return;ptr.x=x;ptr.y=y;if(ptr.mode==='joy'){let dx=x-joy.ox,dy=y-joy.oy;const l=hyp(dx,dy),M=84;if(l>M){joy.ox+=dx*(1-M/l);joy.oy+=dy*(1-M/l);dx*=M/l;dy*=M/l}joy.x=dx/M;joy.y=dy/M}}
function pUp(x,y){if(!ptr)return;const m=ptr;ptr=null;if(m.mode==='joy'){joy.on=false;joy.x=joy.y=0;return}tap(x,y)}
function tap(x,y){const h=onHit(x,y);if(h){AudioFx.cue('ui',.6);vib('light');h.fn()}}
if(API){const f=e=>{const p=(e.changedTouches||e.touches||[])[0];return p?coords(p.clientX,p.clientY):null};
 API.onTouchStart&&API.onTouchStart(e=>{const p=f(e);if(p)pDown(p[0],p[1])});API.onTouchMove&&API.onTouchMove(e=>{const p=f(e);if(p)pMove(p[0],p[1])});API.onTouchEnd&&API.onTouchEnd(e=>{const p=f(e);if(p)pUp(p[0],p[1])});API.onTouchCancel&&API.onTouchCancel(()=>{ptr=null;joy.on=false;joy.x=joy.y=0})}
else{c.addEventListener('pointerdown',e=>{try{c.setPointerCapture(e.pointerId)}catch(er){}const [x,y]=coords(e.clientX,e.clientY);pDown(x,y)});c.addEventListener('pointermove',e=>{if(!ptr)return;const [x,y]=coords(e.clientX,e.clientY);pMove(x,y)});
 c.addEventListener('pointerup',e=>{const [x,y]=coords(e.clientX,e.clientY);pUp(x,y)});c.addEventListener('pointercancel',()=>{ptr=null;joy.on=false;joy.x=joy.y=0})}

// ================================================================ 자동 플레이 봇 (시험용)
function botTick(){if(!S)return;if(S.pick){const o=S.pick.opts;let b=o[0],bs=-1;for(const k of o){const s=(WP[k].p?1:3)+(lv(k)>0?2:0)+(k===WP[ownedW()[0]]?.ev?2:0);if(s>bs){bs=s;b=k}}S.pick.t=1;applyPick(b);return}if(S.chest){takeChest();return}
 let ax=0,ay=0,th=0;for(const z of S.zs){const dx=P.x-z.x,dy=P.y-z.y,d=hyp(dx,dy)||1,R=z.t==='boss'?(z.st===1?130:70):z.st===1?120:90;if(d<R){ax+=dx/d*(R-d);ay+=dy/d*(R-d);th++}}
 let gx=0,gy=0,gd=1e9;for(const k of S.pk){const d=hyp(k.x-P.x,k.y-P.y)*.5;if(d<gd){gd=d;gx=k.x-P.x;gy=k.y-P.y}}for(const gm of S.gems){const d=hyp(gm.x-P.x,gm.y-P.y);if(d<gd){gd=d;gx=gm.x-P.x;gy=gm.y-P.y}}
 const gl=hyp(gx,gy)||1,al=hyp(ax,ay)||1;let x=(th?ax/al*1.2:0)+gx/gl*(th>3?.4:1)+Math.cos(S.t*.5)*.15,y=(th?ay/al*1.2:0)+gy/gl*(th>3?.4:1)+Math.sin(S.t*.5)*.15;
 let bx=0,by=0;for(let a=0;a<TAU;a+=TAU/12){let o=0;for(let r=30;r<=150;r+=30)if(!solid(P.x+Math.cos(a)*r,P.y+Math.sin(a)*r,10))o++;else break;bx+=Math.cos(a)*o;by+=Math.sin(a)*o}const bl=hyp(bx,by)||1;x+=bx/bl*.7;y+=by/bl*.7;const l=hyp(x,y)||1;joy.x=x/l;joy.y=y/l}

// ================================================================ 성능·그리기 루프
let perfAcc=0,perfFrames=0,perfBad=0;
function perf(dt){if(qualityManual||sc!=='battle'||paused)return;perfAcc+=dt;perfFrames++;if(perfAcc>=2){const fps=perfFrames/perfAcc;perfAcc=0;perfFrames=0;if(fps<45){perfBad++;if(perfBad>=2&&!qualityLow){qualityLow=true;persist();message(L('저사양 모드 자동 적용','已自动切换省电模式'),1.2);track('lowq',{fps:Math.round(fps)})}}else perfBad=0}}
function draw(dt){if(API){g.setTransform(1,0,0,1,0,0);g.fillStyle='#05070c';g.fillRect(0,0,c.width,c.height);g.setTransform(view.s,0,0,view.s,view.ox,view.oy)}else g.setTransform(1,0,0,1,0,0);
 g.save();g.beginPath();g.rect(0,0,W,H);g.clip();try{drawInner(dt)}finally{g.restore()}}
function drawInner(dt){g.clearRect(0,0,W,H);frame+=Math.min(dt,.05);HITS=[];
 if(sc==='loading')loadingScreen();else if(sc==='title')title();else if(sc==='prep')prep();else if(sc==='shelter')shelter();else if(sc==='reward')rewardScreen();else if(sc==='ach')achScreen();else if(sc==='guide')guideScreen();else if(sc==='settings')settingsScreen();else if(sc==='privacy')privacyScreen();
 else if(sc==='battle'&&S){if(autoBot)botTick();tick(Math.min(dt,.05));if(sc==='battle')drawBattle();else if(sc==='result')resultScreen()}else if(sc==='result'&&S)resultScreen();else sc='title';
 if(guideTip)drawGuideTip();if(adShow)drawAd();drawBanner();wantMusic()}
let drawErr=0;
if(QS.indexOf('debug=1')>=0){globalThis.__bepaDebug={STAGES,WP,UPG,ZT,save,persist,newRun,finishRun,revive,tap,pDown,pMove,pUp,showAd,mission,levelUp,applyPick,openChest,takeChest,killZ,spawn,spawnRing,drawBattle,tick,
 get S(){return S},get P(){return P},get sc(){return sc},set sc(v){sc=v},set bot(v){autoBot=v},set freeze(v){dbgFreeze=v},get guideTip(){return guideTip},set guideTip(v){guideTip=v},set guidePage(v){guidePage=v},set paused(v){paused=v},get paused(){return paused},set lang(v){LANG=v},get lang(){return LANG},get hits(){return HITS},get drawErr(){return drawErr},set confirmQuit(v){confirmQuit=v},set patrolPop(v){patrolPop=v},spawnElite,startOD,set quality(v){qualityLow=v},
 step(n,dt=1/60){stepping=true;for(let i=0;i<n;i++){guideTip=null;if(adShow){const f=adShow.cb;adShow=null;f()}if(autoBot)botTick();if(sc!=='battle'||!S)break;tick(dt)}stepping=false},
 drawOnce(){draw(0)},get state(){return S?{sc,st:S.st,t:+S.t.toFixed(1),hp:Math.round(P.hp),maxHp:P.maxHp,lv:S.lv,kills:S.kills,zs:S.zs.length,w:Object.assign({},S.w),evo:Object.keys(S.evo),won:!!S.won,over:S.over,pick:!!S.pick,chest:!!S.chest,boss:S.boss?Math.round(S.boss.hp):null,reward:S.reward,sup:save.sup}:{sc,sup:save.sup}}}}
function loop(now){let dt=last?(now-last)/1000:0;last=now;perf(Math.min(dt,.25));try{draw(Math.min(dt,.1))}catch(e){drawErr++;try{g.restore();g.restore();g.restore()}catch(e2){}if(drawErr<5&&typeof console!=='undefined')console.error('draw error',e);if(drawErr===1)track('draw_error',{m:String(e&&e.message||e).slice(0,80),sc})}
 if(API){if(typeof requestAnimationFrame==='function')requestAnimationFrame(loop);else if(c.requestAnimationFrame)c.requestAnimationFrame(loop)}else requestAnimationFrame(loop)}
if(API){if(typeof requestAnimationFrame==='function')requestAnimationFrame(loop);else if(c.requestAnimationFrame)c.requestAnimationFrame(loop)}else requestAnimationFrame(loop);
})();
