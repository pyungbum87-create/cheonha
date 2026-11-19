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
const BUILD='1119-1701';
const QS=(!API&&typeof location!=='undefined')?location.search:'';
// 안전장치: 반지름 음수·NaN이면 그리기 전체가 멈추는 문제 방지
(function(){const P=Object.getPrototypeOf(g);if(!P||P.__safe)return;P.__safe=true;const oa=P.arc,oe=P.ellipse;
 if(oa)P.arc=function(x,y,r,a0,a1,ccw){return oa.call(this,x,y,r>0&&isFinite(r)?r:0,a0,a1,ccw)};
 if(oe)P.ellipse=function(x,y,rx,ry,rot,a0,a1,ccw){return oe.call(this,x,y,rx>0&&isFinite(rx)?rx:0,ry>0&&isFinite(ry)?ry:0,rot,a0,a1,ccw)}})();
const clamp=(v,a,b)=>v<a?a:v>b?b:v, rand=(a,b)=>a+Math.random()*(b-a), hyp=Math.hypot;
function hashStr(s){let h=2166136261;for(const ch of s){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}

// ================================================================ 그림 불러오기
const IMG_LIST=['map1','map2','map3','map4','map5','title','c_jay','c_walk','c_run','c_pred','c_cmd','c_blk','c_boss','fx_boom','fx_fire','fx_shot','fx_dust','props'];
const MUST=['map1','c_jay','c_walk','props'];
const imgs={},imgFail={};
function loadImg(name,tries=0){const im=API?(API.createImage?API.createImage():c.createImage()):new Image();
 im.onload=()=>{imgs[name]=im;onImg(name,im)};
 im.onerror=()=>{if(tries<8)setTimeout(()=>loadImg(name,tries+1),600+tries*900);else imgFail[name]=1};
 im.src='res/'+name+(name.indexOf('map')===0||name==='title'?'.jpg':'.png')+(API?'':'?v='+BUILD+(tries?'r'+tries:''))}
const ZWHITE={},ZRIM={};let ZRED=null;
function tintOf(im,col,a){const cv=mkCanvas(im.width,im.height),x=cv.getContext('2d');x.drawImage(im,0,0);x.globalCompositeOperation='source-atop';x.globalAlpha=a;x.fillStyle=col;x.fillRect(0,0,im.width,im.height);return cv}
function onImg(name,im){if(name!=='c_jay')return;try{[[2,1,0],[1,0,2]].forEach((sw,k)=>{const cv=mkCanvas(im.width,im.height),x=cv.getContext('2d');x.drawImage(im,0,0);const d=x.getImageData(0,0,cv.width,cv.height),a=d.data;
 for(let i=0;i<a.length;i+=4){const r=a[i],gg=a[i+1],b=a[i+2],t=r>60&&b<r*.6?Math.max(0,Math.min(1,((r-gg)/r-.33)/.12)):0;if(t>0){const c=[r,gg,b];a[i]=r*(1-t)+c[sw[0]]*t;a[i+1]=gg*(1-t)+c[sw[1]]*t;a[i+2]=b*(1-t)+c[sw[2]]*t}}x.putImageData(d,0,0);imgs['c_ally'+k]=cv})}catch(e){}}
IMG_LIST.forEach(n=>loadImg(n));

// ================================================================ 캐릭터 · 감염체 그림 (잘라 붙인 부품을 코드로 움직임)
// 캐릭터 그림: 방향별 줄(f 앞·s 옆·b 뒤·d 쓰러짐) = [y, 칸너비, 칸높이, 장수, 발X, 발Y]
const CM={"jay":{"r":{"f":[0,64,145,8,32,142],"s":[145,92,147,8,46,144],"b":[292,72,156,8,36,153]},"h":66,"d":2.0},"walk":{"r":{"f":[0,76,143,8,38,140],"s":[143,100,140,8,50,137],"b":[283,70,137,8,35,134],"d":[420,102,131,6,51,128]},"h":62,"d":2.0},"run":{"r":{"f":[0,80,143,8,40,140],"s":[143,148,149,8,74,146],"b":[292,70,137,8,35,134],"d":[429,100,129,6,50,126]},"h":60,"d":2.0},"pred":{"r":{"f":[0,90,109,8,45,106],"s":[109,174,115,8,87,112],"b":[224,76,107,8,38,104],"d":[331,86,106,6,43,103]},"h":46,"d":2.0},"cmd":{"r":{"f":[0,86,152,8,43,149],"s":[152,148,156,8,74,153],"b":[308,90,154,8,45,151],"d":[462,124,142,6,62,139]},"h":68,"d":2.0},"blk":{"r":{"f":[0,130,205,8,65,202],"s":[205,178,198,8,89,195],"b":[403,128,203,8,64,200],"d":[606,156,184,6,78,181]},"h":88,"d":2.0},"boss":{"r":{"f":[0,164,248,8,82,245],"s":[248,210,243,8,105,240],"b":[491,156,245,8,78,242],"d":[736,186,228,6,93,225]},"h":150,"d":1.45}},FXM={"boom":[164,8],"fire":[102,8],"shot":[80,8],"dust":[146,8]};
function drawChar(cx,name,row,fr,x,y,flip,sc,al){const M=CM[name]||(name.indexOf('ally')===0?CM.jay:null),im=imgs['c_'+name];if(!M||!im)return false;const r=M.r[row]||M.r.f,s=(sc||1)/M.d,n=r[3],f=((fr%n)+n)%n;
 cx.save();cx.translate(x,y);if(flip)cx.scale(-1,1);if(al!=null)cx.globalAlpha=al;cx.drawImage(im,f*r[1],r[0],r[1],r[2],-r[4]*s,-r[5]*s,r[1]*s,r[2]*s);cx.restore();return true}
// 방향 고르기(경계에서 깜빡이지 않게 여유를 둠)
function pickDir(o,ang){const c=Math.cos(ang),sn=Math.sin(ang),ac=Math.abs(c);let d=o.dr||'f';if(d==='s'){if(ac<.55)d=sn>0?'f':'b'}else if(ac>.8)d='s';else d=sn>0?'f':'b';o.dr=d;if(d==='s')o.fx=c<0;return d}
const PD={};
function drawRunner(cx,x,y,ang,phase,mag,sz){const M=CM.jay,m=Math.min(1,mag);if(m>.15)pickDir(PD,ang);const d=PD.dr||'f',H=M.h,fp=phase/TAU*8,fr=m<.15?0:Math.floor(fp),fq=fp-Math.floor(fp);
 cx.fillStyle='rgba(0,0,0,.45)';cx.beginPath();cx.ellipse(x,y+H*.4,H*.24,H*.08,0,0,TAU);cx.fill();cx.strokeStyle=PD.who?'rgba(127,224,176,.5)':'rgba(120,225,255,.75)';cx.lineWidth=2;cx.beginPath();cx.ellipse(x,y+H*.4,H*.32,H*.11,0,0,TAU);cx.stroke();if(!drawChar(cx,PD.who||'jay',d,fr,x,y+H*.42,d==='s'&&PD.fx)){cx.fillStyle='#e8622e';cx.beginPath();cx.arc(x,y,12,0,TAU);cx.fill()}else if(m>.15&&fq>.2&&!qualityLow)drawChar(cx,PD.who||'jay',d,fr+1,x,y+H*.42,d==='s'&&PD.fx,1,(fq-.2)*.7)}
function fxSpr(cx,k,fr,x,y,size,rot,al){const im=imgs['fx_'+k],F=FXM[k];if(!im||!F)return false;const C=F[0],f=Math.max(0,Math.min(F[1]-1,fr|0));cx.save();cx.translate(x,y);if(rot)cx.rotate(rot);if(al!=null)cx.globalAlpha=al;cx.drawImage(im,f*C,0,C,C,-size/2,-size/2,size,size);cx.restore();return true}
let zfReady=false;
function buildSprites(){if(zfReady)return true;for(const k of['walk','run','pred','blk','cmd','boss'])if(!imgs['c_'+k]&&!imgFail['c_'+k])return false;zfReady=true;return true}
// 불·연기용 뭉게 그림(코드로 한 번만 만들어 색별로 재사용)
const PUFF=[],PUFFC={};
function puff(col,v){const k=col+v;let cv=PUFFC[k];if(!cv){if(!PUFF.length)for(let n=0;n<4;n++){const c2=mkCanvas(64,64),x=c2.getContext('2d');let sd=n*97+13;const rn=()=>{sd=(sd*1103515245+12345)&0x7fffffff;return sd/0x7fffffff};for(let i=0;i<9;i++){const a=rn()*TAU,r=rn()*13,px=32+Math.cos(a)*r,py=32+Math.sin(a)*r,r2=9+rn()*9,gr=x.createRadialGradient(px,py,0,px,py,r2);gr.addColorStop(0,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,64,64)}PUFF.push(c2)}cv=PUFFC[k]=tintOf(PUFF[v],col,1)}return cv}
const FPAL=[['#fff3c0','#ffa032','#e0401a'],['#f0fcff','#8fdcff','#3f8fff']];
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
 stats:{kills:0,runs:0,clears:0,evo:0,ult:0,rescued:0},surv:0,story:{},quest:0,endBest:0,startW:'gun',stage:1,lang:null,music:true,sfx:true,shake:true,vib:true,mild:null,qualityLow:false,qualityManual:false,statc:{}};
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
const ZT={walk:{hp:12,spd:54,dmg:10,xp:1,r:10},run:{hp:9,spd:96,dmg:8,xp:1,r:10},pred:{hp:42,spd:52,dmg:14,xp:4,r:11},blk:{hp:230,spd:30,dmg:18,xp:14,r:17},cmd:{hp:130,spd:36,dmg:10,xp:12,r:15},boss:{hp:9000,spd:36,dmg:28,xp:80,r:32},spit:{hp:30,spd:42,dmg:8,xp:5,r:11,spr:'cmd',sc:.9},bomb:{hp:20,spd:62,dmg:6,xp:3,r:12,spr:'walk',sc:1.15}};
const ZN={walk:['감염자','感染者'],run:['추적자','追踪者'],pred:['덮치기형','扑击者'],cmd:['지휘형','指挥者'],blk:['거구','巨躯'],boss:['문지기','守门者'],spit:['침 뱉는 놈','喷吐者'],bomb:['폭탄 좀비','爆弹僵尸']};
// 무기 8종 + 보조 5종. ev = 진화에 필요한 보조, en = 진화 이름
const WP={
 gun:{n:['펄스 권총','脉冲手枪'],c:'#9fe8ff',m:5,ev:'pow',en:['레일건','轨道炮'],
  d:l=>[['가까운 놈에게 자동 사격','自动射击最近的敌人'],['관통 +1','穿透 +1'],['총알 2발','子弹 2发'],['연사 빨라짐 · 관통 +1','射速提升 · 穿透 +1'],['총알 3발','子弹 3发']][l-1],ed:['한 줄로 꿰뚫는 4연발 광선','一次贯穿一排的4连光束']},
 saw:{n:['산탄총','霰弹枪'],c:'#e0b070',m:5,ev:'arm',en:['소이 산탄','燃烧霰弹'],d:l=>l===1?['가까운 적에게 부채꼴로 5발 · 밀쳐내기','向近处敌人扇形发射5发 · 击退']:['탄 '+(4+l)+'발 · 피해 증가','弹丸 '+(4+l)+'发 · 伤害提升'],ed:['불붙는 탄 9발 · 관통','燃烧弹9发 · 穿透']},
 molo:{n:['화염병','燃烧瓶'],c:'#ff8a3d',m:5,ev:'cd',en:['네이팜','凝固汽油'],d:l=>l===1?['무리에 던져 불바다를 만들어요','扔向尸群形成火海']:['불길이 넓어지고 더 자주 던져요','火焰更大，投掷更频繁'],ed:['한 번에 두 병, 더 크고 오래 타요','一次两瓶，火更大更久']},
 pulse:{n:['충격 스피커','冲击音箱'],c:'#b78cff',m:5,ev:'spd',en:['지진 스피커','震荡音箱'],d:l=>l===1?['주기적으로 주변을 밀어내요','周期性震退周围敌人']:['충격파가 넓어지고 세져요','冲击波范围和威力提升'],ed:['거대한 충격파, 맞은 놈은 잠시 멈춰요','巨型冲击波，被击中的敌人短暂停住']},
 bolt:{n:['전기 사슬','电链'],c:'#7fe3ff',m:5,ev:'mag',en:['뇌운','雷云'],d:l=>l===1?['번개가 놈들 사이를 타고 번져요','闪电在敌人之间跳跃']:['더 많은 놈에게 번져요 ('+(2+l)+'마리)','跳跃更多敌人（'+(2+l)+'只）'],ed:['번개가 12마리까지 번지고 하늘에서도 떨어져요','闪电跳跃12只，还会从天而降']},
 frost:{n:['냉동 수류탄','冰冻手雷'],c:'#a8ecff',m:5,ev:'cd',en:['절대영도','绝对零度'],d:l=>l===1?['터지면 놈들이 얼어 느려져요','爆炸后冻住敌人减速']:['더 넓게, 더 오래 얼려요','冻结范围更大、更久'],ed:['넓은 범위를 거의 멈출 만큼 얼려요','大范围冻结，几乎停止']},
 drone:{n:['공격 드론','攻击无人机'],c:'#ff6ad5',m:5,ev:'spd',en:['드론 편대','无人机编队'],d:l=>l===1?['머리 위 드론이 유도 로켓을 쏴요','头顶无人机发射追踪火箭']:['로켓이 세지고 더 자주 쏴요','火箭更强、发射更频繁'],ed:['드론 3대가 동시에 로켓을 쏴요','3架无人机同时发射火箭']},
 turret:{n:['자동 포탑','自动炮塔'],c:'#ffd166',m:5,ev:'pow',en:['포대 진지','炮台阵地'],d:l=>l===1?['발밑에 포탑을 설치해요','在脚下设置炮塔']:['포탑이 세지고 더 자주 설치돼요','炮塔更强，设置更频繁'],ed:['포탑 4대, 두 배로 빠르게 쏴요','4座炮塔，射速翻倍']},
 flame:{n:['화염방사기','火焰喷射器'],c:'#ff7a2a',m:5,ev:'arm',en:['지옥불','地狱火'],d:l=>l===1?['가까운 적을 향해 불길을 뿜어요','向近处敌人喷射火焰']:['불길이 길어지고 세져요','火焰更长更猛'],ed:['넓고 긴 불길, 맞은 놈은 불타요','又宽又长的火焰，被击中的会燃烧']},
 mine:{n:['지뢰','地雷'],c:'#c8b080',m:5,ev:'mag',en:['지뢰밭','雷区'],d:l=>l===1?['지나간 자리에 지뢰를 깔아요','在走过的地方埋地雷']:['지뢰가 많아지고 세져요 (최대 '+(3+l)+'개)','地雷更多更强（最多'+(3+l)+'个）'],ed:['빠르게 깔리고 크게 터져요','埋得更快，炸得更大']},
 snipe:{n:['저격총','狙击枪'],c:'#e8e2c8',m:5,ev:'pow',en:['대물 저격총','反器材狙击枪'],d:l=>l===1?['가장 강한 적을 꿰뚫어 쏴요','射穿最强的敌人']:['더 세고 더 많이 꿰뚫어요','更强，穿透更多'],ed:['일직선의 모든 적을 꿰뚫어요','穿透直线上所有敌人']},
 spd:{n:['운동화','跑鞋'],c:'#5dff9a',m:5,p:1,d:l=>['이동 속도 +'+8*l+'%','移动速度 +'+8*l+'%']},
 mag:{n:['자석 장갑','磁力手套'],c:'#5dff9a',m:5,p:1,d:l=>['초록 빛을 더 멀리서 끌어와요','从更远处吸取绿光']},
 arm:{n:['방탄 조끼','防弹背心'],c:'#5dff9a',m:5,p:1,d:l=>['최대 체력 +20, 바로 회복','生命上限 +20，立即回复']},
 pow:{n:['강화 탄약','强化弹药'],c:'#5dff9a',m:5,p:1,d:l=>['모든 피해 +'+12*l+'%','所有伤害 +'+12*l+'%']},
 cd:{n:['빠른 손','快手'],c:'#5dff9a',m:5,p:1,d:l=>['모든 무기가 '+8*l+'% 빨라져요','所有武器加快 '+8*l+'%']}};
const WEAPONS=['gun','saw','molo','pulse','mine','bolt','flame','turret','snipe','frost','drone'];
const UNLOCK={gun:0,saw:0,molo:0,pulse:0,bolt:1,mine:1,turret:2,flame:2,frost:3,snipe:3,drone:4};   // n번 구역을 깨면 열림
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
 {k:'crate',goal:4,n:['보급 상자 4개 열기','打开4个补给箱'],r:50},{k:'lv',goal:20,n:['한 판에 레벨 20 달성','单局达到20级'],r:60},{k:'ult',goal:5,n:['공습 5번 요청','呼叫空袭5次'],r:60},{k:'evo',goal:1,n:['무기 1번 진화','进化武器1次'],r:90},{k:'time',goal:300,n:['합계 5분 버티기','累计坚持5分钟'],r:50}];
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
 RECTS=[];for(const [x0,y0,x1,y1] of STAGE_RECTS[st+1]){if((x1-x0)*(y1-y0)<4700||Math.min(x1-x0,y1-y0)<36)continue;RECTS.push([x0,y0,x1,y1],[WW-x1,y0,WW-x0,y1],[x0,WH-y1,x1,WH-y0],[WW-x1,WH-y1,WW-x0,WH-y0])}
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

// ================================================================ 이야기
// [말하는 사람(0 제이,1 무전 하나,2 해설), 한국어, 중국어]
const SPK=[['제이','杰伊','#ffb070'],['무전 · 하나','无线电 · 小娜','#7fe0b0'],['','','#c8d2de']];
const STORY={
 pro:{st:0,t:['프롤로그','序章'],l:[[2,'도시가 무너진 지 사흘째. 거리는 감염체로 가득하다.','城市沦陷的第三天，街道上挤满了感染者。'],[1,'…들리는 사람 있어요? 여기는 방송탑. 살아 있다면 방송탑으로 오세요.','……有人听得到吗？这里是广播塔。如果你还活着，请来广播塔。'],[0,'사람 목소리다… 아직 살아 있는 사람이 있어.','是人的声音……还有人活着。'],[1,'사흘 뒤 마지막 구조 헬기가 와요. 그 전에 도착해야 해요.','三天后最后一架救援直升机会来，你必须在那之前赶到。'],[0,'방송탑까지 다섯 구역. 길을 막은 문지기들을 쓰러뜨리며 간다.','到广播塔要穿过五个区域。我要击倒挡路的守门者，一路杀过去。']]},
 b0:{st:0,t:['1장 · 주거 지구','第一章 · 住宅区'],l:[[1,'주거 지구엔 아직 숨어 있는 사람들이 있어요. 보이면 꼭 데려와 주세요.','住宅区还有人躲着。看到的话请一定带上他们。'],[0,'혼자보단 둘이 낫지. 문지기를 쓰러뜨리고 길을 연다.','两个人总比一个人强。击倒守门者，打开通道。']]},
 c0:{st:0,t:['1장 · 탈출','第一章 · 撤离'],l:[[0,'첫 문지기를 쓰러뜨렸다. 손이 아직도 떨린다.','击倒了第一个守门者，手还在发抖。'],[1,'잘했어요! 다음은 상업 지구예요. 그쪽에 약품 창고가 있어요.','干得好！下一站是商业区，那里有药品仓库。']]},
 b1:{st:1,t:['2장 · 상업 지구','第二章 · 商业区'],l:[[1,'상가 약품 창고 입구를 거대한 문지기가 막고 있대요.','听说一个巨大的守门者挡在商场药品仓库入口。'],[0,'약품이 있으면 더 많은 사람을 살릴 수 있어. 간다.','有了药品就能救更多人。出发。']]},
 c1:{st:1,t:['2장 · 탈출','第二章 · 撤离'],l:[[0,'약품을 챙겼다. 무전 소리가 조금 더 또렷해졌다.','拿到了药品。无线电的声音更清晰了。'],[1,'공장 지대를 지나야 해요. 감염이 거기서 시작됐다는 소문이 있어요.','你得穿过工厂区。有传言说感染就是从那里开始的。']]},
 b2:{st:2,t:['3장 · 공장 지대','第三章 · 工厂区'],l:[[2,'녹슨 굴뚝 사이로 붉은 불빛이 깜빡인다.','生锈的烟囱间闪烁着红光。'],[1,'조심하세요. 거기 감염체들은 더 빠르고 사나워요.','小心，那里的感染者更快更凶。']]},
 c2:{st:2,t:['3장 · 탈출','第三章 · 撤离'],l:[[0,'문지기 목에 걸린 출입증… 연구소 것이다.','守门者脖子上挂着通行证……是研究所的。'],[0,'감염은 사고가 아니었어. 누군가 만든 거야.','感染不是意外，是有人制造的。'],[1,'연구소에 백신 자료가 있을지도 몰라요!','研究所里也许有疫苗资料！']]},
 b3:{st:3,t:['4장 · 연구소','第四章 · 研究所'],l:[[1,'백신 자료를 가져오면 모두를 살릴 수 있어요. 헬기까지 하루 남았어요.','拿到疫苗资料就能救所有人。离直升机只剩一天了。'],[0,'여기서 멈출 수는 없지.','不能在这里停下。']]},
 c3:{st:3,t:['4장 · 탈출','第四章 · 撤离'],l:[[0,'백신 자료를 챙겼다. 이제 방송탑만 남았다.','拿到了疫苗资料。只剩广播塔了。'],[1,'헬기 소리가 들려요! 서둘러요!','听到直升机的声音了！快！']]},
 b4:{st:4,t:['5장 · 방송탑','第五章 · 广播塔'],l:[[1,'마지막 문지기가 방송탑 앞을 지키고 있어요. 저 녀석만 넘으면 돼요.','最后一个守门者守在广播塔前，只要越过它就行。'],[0,'다섯 번째. 끝내러 간다.','第五个。去做个了结。']]},
 c4:{st:4,t:['에필로그','尾声'],l:[[2,'헬기가 떠오른다. 백신 자료는 무사하다.','直升机升空，疫苗资料完好无损。'],[1,'고마워요, 제이. 당신 덕분에 살았어요.','谢谢你，杰伊。多亏了你。'],[0,'…아래를 봐. 아직 불이 켜진 창문들이 있어.','……往下看，还有亮着灯的窗户。'],[0,'밤이 끝날 때까지, 남은 사람들을 구하러 돌아간다.','直到长夜结束，我要回去救剩下的人。'],[2,'「끝없는 밤」이 열렸습니다.','「无尽长夜」已开放。']]}};
// ================================================================ 순서대로 주어지는 임무(퀘스트)
const upSum=()=>Object.keys(save.up||{}).reduce((s,k)=>s+(save.up[k]|0),0);
const QUEST=[
 {n:['주거 지구에서 문지기 쓰러뜨리기','在住宅区击倒守门者'],h:['출동 → 1구역','出动 → 第1区'],go:'prep',r:80,c:()=>!!save.clr[1]},
 {n:['대피소에서 아무거나 1번 강화','在避难所进行1次强化'],h:['대피소에서 강화 버튼','避难所强化按钮'],go:'shelter',r:60,c:()=>upSum()>=1},
 {n:['공습 1번 요청하기','呼叫1次空袭'],h:['전투 중 오른쪽 아래 버튼','战斗中右下角按钮'],go:'prep',r:80,c:()=>(save.stats.ult|0)>=1},
 {n:['생존자 1명 구하기','救出1名幸存者'],h:['초록 화살표를 따라가요','跟着绿色箭头走'],go:'prep',r:100,c:()=>(save.stats.rescued|0)>=1},
 {n:['상업 지구 탈출','撤离商业区'],h:['출동 → 2구역','出动 → 第2区'],go:'prep',r:120,c:()=>!!save.clr[2]},
 {n:['무기 1번 진화시키기','进化1次武器'],h:['무기 Lv5 + 짝 보조 → 보급 상자','武器Lv5+配对辅助 → 补给箱'],go:'guide',r:120,c:()=>(save.stats.evo|0)>=1},
 {n:['업적 보상 1번 받기','领取1次成就奖励'],h:['처음 화면 → 업적','主界面 → 成就'],go:'ach',r:60,c:()=>Object.keys(save.ach||{}).length>=1},
 {n:['강화 합계 6단계','强化合计6级'],h:['대피소','避难所'],go:'shelter',r:150,c:()=>upSum()>=6},
 {n:['공장 지대 탈출','撤离工厂区'],h:['출동 → 3구역','出动 → 第3区'],go:'prep',r:180,c:()=>!!save.clr[3]},
 {n:['생존자 누적 5명 구하기','累计救出5名幸存者'],h:['구할수록 공격력이 올라요','救得越多攻击力越高'],go:'prep',r:200,c:()=>(save.surv|0)>=5},
 {n:['별 6개 모으기','收集6颗星'],h:['체력 절반 이상으로 탈출하면 별','血量过半撤离可得星'],go:'prep',r:200,c:()=>totalStars()>=6},
 {n:['연구소 탈출','撤离研究所'],h:['출동 → 4구역','出动 → 第4区'],go:'prep',r:250,c:()=>!!save.clr[4]},
 {n:['강화 합계 15단계','强化合计15级'],h:['대피소','避难所'],go:'shelter',r:300,c:()=>upSum()>=15},
 {n:['방송탑 탈출 · 이야기 완결','撤离广播塔 · 故事完结'],h:['출동 → 5구역','出动 → 第5区'],go:'prep',r:400,c:()=>!!save.clr[5]},
 {n:['끝없는 밤 5분 버티기','无尽长夜坚持5分钟'],h:['출동 → 끝없는 밤','出动 → 无尽长夜'],go:'prep',r:400,c:()=>(save.endBest|0)>=300},
 {n:['생존자 누적 20명 구하기','累计救出20名幸存者'],h:['끝없는 밤에서도 나타나요','无尽长夜中也会出现'],go:'prep',r:500,c:()=>(save.surv|0)>=20},
 {n:['별 15개 모으기','收集15颗星'],h:['난이도를 올려 다시 도전','提高难度再次挑战'],go:'prep',r:600,c:()=>totalStars()>=15},
 {n:['끝없는 밤 10분 버티기','无尽长夜坚持10分钟'],h:['동료와 함께 버텨요','和同伴一起坚持'],go:'prep',r:800,c:()=>(save.endBest|0)>=600}];
const questNow=()=>QUEST[save.quest|0];
const questReady=()=>{const q=questNow();return !!(q&&q.c())};

// ================================================================ 상태
let frame=0,last=0,sc='loading',paused=false,shakeT=0,flashT=0;
let S=null,P=null;
let banner='',bannerT=0,bannerSc='',bigMsg=null,guideTip=null,guidePage=0,guideRet='title',resetArm=0,confirmQuit=false,autoBot=false,dbgFreeze=false,stepping=false;
let ptr=null,joy={on:false,ox:0,oy:0,x:0,y:0};
function message(t,d=2){banner=t;bannerT=d;bannerSc=sc}
function announce(t,sub,col){bigMsg={t,sub:sub||'',col:col||'#FFE8C2',life:2.2}}
function shake(n){if(save.shake!==false)shakeT=Math.max(shakeT,n)}
const VW=380,ZS=W/VW,VH=H/ZS;   // 화면에 보이는 세계 크기
const lv=k=>S.w[k]||0, EV=k=>!!S.evo[k];

// ================================================================ 판 시작
function newRun(st,diff,tut,boost){st=st|0;diff=Math.max(1,diff|0);if(!buildWorld(st)){message(L('지도를 불러오는 중이에요','地图加载中'),1.2);return}
 let px=WW/2,py=WH/2,bs=-1;for(let y=200;y<WH-200;y+=40)for(let x=200;x<WW-200;x+=40){if(solid(x,y,16))continue;let o=0;for(let a=0;a<TAU;a+=.4)for(let r=40;r<=200;r+=40)if(!solid(x+Math.cos(a)*r,y+Math.sin(a)*r,10))o++;o-=hyp(x-WW/2,y-WH/2)*.02;if(o>bs){bs=o;px=x;py=y}}
 const maxHp=100+12*upLv('hp');
 P={x:px,y:py,hp:maxHp,maxHp,ang:-PI/2,phase:0,inv:1,mv:0};
 const D=STAGES[st];
 S={st,diff,tut:!!tut,t:0,kills:0,lv:1,xp:0,need:3,w:{},evo:{},zs:[],bul:[],gems:[],pk:[],pools:[],tur:[],bolts:[],fx:[],num:[],pt:[],dec:[],drs:[{a:0},{a:2.1},{a:4.2}],
  spawn:0,wave:20,air:[],fp:[],ultN:0,dead:[],sfx:[],cam:{x:0,y:0},cd:{gun:.3,molo:1,pulse:2,bolt:1,turret:.5,frost:1.5,drone:1},sawA:0,bossOut:false,boss:null,win:false,winT:-1,over:false,
  hm:D.mul*(1+.4*(diff-1)),rate:D.rate*(1+.06*(diff-1)),sp:D.sp,drops:[60,120],pick:null,chest:null,rerolls:upLv('reroll'),adReroll:false,kit:upLv('revive')>0,kitUsed:false,revived:false,
  dmgM:(1+.06*upLv('pow'))*(1+.01*Math.min(30,save.surv||0)),spdM:1+.03*upLv('spd'),cdM:1-.03*upLv('cd'),magM:1+.12*upLv('mag'),xpM:1+.06*upLv('xp'),crates:0,evoN:0,dmg:{},crit:.08,od:0,odG:0,odN:0,eb:[],elT:35,elN:0,wn:0,boost:!!boost,sv:[],svT:tut?[]:[45,105],allyN:0,endless:false,nbT:BOSS_T,groanT:2,flowT:0,moved:0,tipT:0,doubled:false,reward:0};
 const sw=weaponOpen(save.startW)?save.startW:'gun';S.w[sw]=boost?3:1;if(boost)S.rerolls++;
 flowUpdate();S.cam.x=clamp(P.x-VW/2,0,WW-VW);S.cam.y=clamp(P.y-VH/2,0,WH-VH);for(let i=0;i<9;i++)spawnRing('walk',rand(150,230));
 sc='battle';paused=false;confirmQuit=false;save.stats.runs++;mission('run');persist();track('run_start',{st:st+1,diff,w:sw,tut:tut?1:0,boost:boost?1:0});
 if(!tut)announce(LL(D.n),L('2분 30초 버티면 문지기가 나타나요','坚持2分30秒，守门者就会出现'))}
function clearBig(){bigMsg=null}
const DM=()=>S.dmgM*(1+.12*lv('pow')), CDM=()=>S.cdM*(1-.08*lv('cd'))*(S.od>0?.6:1);
let DSRC='etc';const odNeed=()=>Math.min(320,70+50*S.odN)*(HR('flare')?.7:1);
const ultReady=()=>S.odG>=odNeed()&&S.od<=0;
function useUlt(){if(!S||!ultReady()||S.win||S.over)return;save.stats.ult=(save.stats.ult||0)+1;S.od=7;S.odG=0;S.odN++;S.ultN++;mission('ult');for(const gm of S.gems)gm.pull=true;const c=[];near(P.x,P.y,300,z=>c.push(z));if(S.boss&&!S.boss.dead)c.push(S.boss,S.boss);
 for(let i=0,nb=HR('cluster')?16:10;i<nb;i++){const z=c.length?c[(Math.random()*c.length)|0]:null,a=Math.random()*TAU,r=rand(40,170),T=.3+i*.13;S.air.push({x:z?z.x+rand(-14,14):P.x+Math.cos(a)*r,y:z?z.y+rand(-14,14):P.y+Math.sin(a)*r,t:T,T})}
 S.fx.push({k:'wave',x:P.x,y:P.y,t:0,life:.5,R:170,c:'#ffd166'});message(L('공습 요청! 폭격이 쏟아진다','呼叫空袭！轰炸来了'),1.6);AudioFx.cue('siren',.55);vib('medium');track('ult',{t:Math.round(S.t),n:S.ultN})}
function startOD(){S.odG=odNeed();S.od=0;useUlt()}
function fpush(k,x,y,vx,vy,life,s0,s1,pal){if(S.fp.length>(qualityLow?140:460))return;S.fp.push({k,x,y,vx,vy,t:0,life,s0,s1,r:Math.random()*TAU,vr:rand(-2.5,2.5),v:(Math.random()*4)|0,pal:pal||0})}
function flame(x,y,R,pal){const a=Math.random()*TAU,r=Math.sqrt(Math.random())*R*.8,fx=x+Math.cos(a)*r,fy=y+Math.sin(a)*r*.75;fpush('f',fx,fy,rand(-8,8),rand(-52,-20),rand(.4,.75),R*rand(.34,.52),R*.1,pal);if(Math.random()<.13)fpush('s',fx,fy-8,rand(-6,6),rand(-32,-16),rand(.8,1.3),R*.22,R*.55,0);if(Math.random()<.22)fpush('e',fx,fy,rand(-22,22),rand(-95,-40),rand(.4,.9),1.7,.5,pal)}
function dustRing(x,y,R,col){const n=qualityLow?8:16;for(let i=0;i<n;i++){const a=i/n*TAU+rand(-.2,.2),r=R*.25;fpush('s',x+Math.cos(a)*r,y+Math.sin(a)*r*.85,Math.cos(a)*R*2.2,Math.sin(a)*R*1.9,rand(.5,.8),R*.13,R*.3,0);S.fp[S.fp.length-1]&&(S.fp[S.fp.length-1].col=col)}}
function spawnSurvivor(){for(let k=0;k<40;k++){const a=Math.random()*TAU,r=rand(200,300),x=P.x+Math.cos(a)*r,y=P.y+Math.sin(a)*r;if(x<60||y<60||x>WW-60||y>WH-60||solid(x,y,16))continue;
  S.sv.push({x,y,st:0,t:0,prog:0,kind:S.sv.length%2,ph:0,ang:PI/2,cd:.5});message(L('생존자 발견! 초록 화살표로 가서 구해요','发现幸存者！跟着绿色箭头去营救'),2);AudioFx.cue('ding',.6);
  tip('surv',[['생존자가 구조를 기다려요. 옆에 잠시 서 있으면 구할 수 있어요.','有幸存者在等待救援。站在旁边片刻即可救出。'],['구한 생존자는 함께 싸우고, 대피소에 남아 공격력을 올려 줘요.','救出的幸存者会并肩作战，并留在避难所提升攻击力。']]);return}}
function svTick(dt){const p=P;if(S.svT.length&&S.t>=S.svT[0]&&!S.win){S.svT.shift();if(S.sv.filter(v=>v.st===1).length<2||(S.node&&S.node.t==='rescue'))spawnSurvivor()}
 if(S.endless&&S.t>=(S.svE||70)){S.svE=S.t+(HR('radio')?55:100);if(S.sv.filter(v=>v.st===1).length<2)spawnSurvivor()}
 let ai=0;for(const v of S.sv){v.t+=dt;if(v.st===0){const d=hyp(v.x-p.x,v.y-p.y);if(d<58)v.prog+=dt;else v.prog=Math.max(0,v.prog-dt*.5);
   if(v.prog>=1.2){S.nodeRes=(S.nodeRes||0)+1;if(S.sv.filter(o=>o.st===1).length>=2){v.gone=1;save.surv=(save.surv|0)+1;save.stats.rescued=(save.stats.rescued|0)+1;persist();message(L('동료가 꽉 찼어요. 대피소로 보냈어요','同伴已满，送往避难所'),1.6);AudioFx.cue('win',.5);continue}v.st=1;S.allyN++;save.stats.rescued=(save.stats.rescued||0)+1;save.surv=(save.surv||0)+1;persist();announce(L('생존자 합류!','幸存者加入！'),L('이제 함께 싸워요','现在并肩作战'),'#7fe0b0');AudioFx.cue('win',.6);vib('medium');track('rescue',{t:Math.round(S.t)})}
   else if(v.t>45){v.gone=1;message(L('생존자를 놓쳤어요…','错过了幸存者…'),1.6)}}
  else{const side=ai++?1:-1,tx=p.x+Math.cos(p.ang+PI+side*.9)*48,ty=p.y+Math.sin(p.ang+PI+side*.9)*48,dx=tx-v.x,dy=ty-v.y,d=hyp(dx,dy);
   if(d>4){const sp=Math.min(d*4,170)*dt;moveE(v,dx/d*sp,dy/d*sp,11);v.ang=Math.atan2(dy,dx);v.ph+=sp*TAU/80}if(d>260){v.x=p.x;v.y=p.y}
   v.cd-=dt;if(v.cd<=0){const tg=nearest(v.x,v.y,230);if(tg){const a=Math.atan2(tg.y-v.y,tg.x-v.x);S.bul.push({x:v.x,y:v.y-6,vx:Math.cos(a)*480,vy:Math.sin(a)*480,d:(9+S.lv*.9)*(HR('radio')?1.5:1),pr:1,t:0,hit:[],col:'#cfe9ff',life:.55,al:1});sfx('shot',v.x+Math.cos(a)*20,v.y-18+Math.sin(a)*20,24,.08,{f0:0,nf:3,rot:a});v.cd=.55}else v.cd=.2}}}
 S.sv=S.sv.filter(v=>!v.gone)}
function sfx(k,x,y,s,life,o){if(S.sfx.length>(qualityLow?20:50))S.sfx.shift();const e=Object.assign({k,x,y,s,life,t:0,f0:0,nf:8,rot:0},o||{});S.sfx.push(e);return e}
function burst(x,y,R,pal){for(let i=0;i<(qualityLow?6:14);i++){const a=Math.random()*TAU,v=R*rand(.5,2.3);fpush('f',x,y,Math.cos(a)*v,Math.sin(a)*v*.85,rand(.3,.62),R*rand(.34,.55),R*.12,pal)}for(let i=0;i<(qualityLow?2:5);i++){const a=Math.random()*TAU,v=R*rand(.2,.7);fpush('s',x,y,Math.cos(a)*v,Math.sin(a)*v-14,rand(.8,1.5),R*.34,R*.8,0)}for(let i=0;i<(qualityLow?4:10);i++){const a=Math.random()*TAU,v=R*rand(2,4.6);fpush('e',x,y,Math.cos(a)*v,Math.sin(a)*v,rand(.3,.7),2,.5,pal)}}
function spawnElite(t,mid){const z=spawnRing(t)||spawnRing(t,240);if(!z)return null;z.el=mid?2:1;z.hp=z.mhp=(mid?1500:300+S.t*9)*S.hm;z.r=ZT[t].r*(mid?1.7:1.35);return z}

// ================================================================ 감염체
function spawn(t,x,y){const T=ZT[t],hs=1+S.t/70+(S.t>100?(S.t-100)/40:0),hp=t==='boss'?9000*S.hm:T.hp*(1+(S.hm-1)*Math.min(1,S.t/75))*hs;
 const z={t,x,y,hp,mhp:hp,r:T.r,ph:Math.random()*6,ang:0,fl:0,kx:0,ky:0,hitT:0,sawT:0,st:0,stT:rand(1.5,3.5),slowT:0,frz:0};S.zs.push(z);return z}
function spawnRing(t,R0){for(let i=0;i<10;i++){let x,y;if(R0){const a=Math.random()*TAU;x=P.x+Math.cos(a)*R0;y=P.y+Math.sin(a)*R0}
  else{const hw=VW/2+26,hh=VH/2+26,e=Math.random()*(hw+hh)*2;if(e<hw*2){x=S.cam.x+VW/2-hw+e;y=S.cam.y+VH/2+(Math.random()<.5?-hh:hh)}else{y=S.cam.y+VH/2-hh+(e-hw*2);x=S.cam.x+VW/2+(Math.random()<.5?-hw:hw)}}
  if(!solid(x,y,14)&&FD[((y/FC)|0)*FWc+((x/FC)|0)]>=0)return spawn(t,x,y)}return null}
function pickType(){const t=S.t,r=Math.random(),sp=S.sp,q=Math.random(),dp=S.st+(S.node?S.node.l*.5:0)+(S.endless?S.t/120:0);if(!S.tut&&t>15){if(q<.035+.006*dp)return 'bomb';if(dp>=1&&q<.07+.008*dp)return 'spit'}if(t>sp.blk&&r<.035)return 'blk';if(t>sp.cmd&&r<.06)return 'cmd';if(t>sp.pred&&r<.16)return 'pred';if(t>sp.run&&r<.16+Math.min(.25,(t-sp.run)/400))return 'run';return 'walk'}
function spark(x,y,n,col,spd,life,size,grav){if(!S)return;const cap=qualityLow?160:480;if(S.pt.length>cap)return;if(qualityLow)n=Math.ceil(n/2);for(let i=0;i<n;i++){const a=Math.random()*TAU,v=spd*(.35+Math.random()*.65);S.pt.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:0,life:life*(.6+Math.random()*.6),s:size,c:col,g:grav||0})}}
const ZCOL=t=>t==='cmd'?'#d9cba8':t==='pred'?'#ffd166':save.mild?'#9fb4c8':'#3ef2d0';
function hurt(z,d,kx,ky,k){if(z.dead)return;d*=DM();if(S.rel){if(HR('adren')&&P.hp<P.maxHp*.35)d*=1.4;if(HR('ice')&&z.slowT>0)d*=1.3;if(HR('fuel')&&z.burn>0)d*=2;if(HR('det')&&(DSRC==='mine'||DSRC==='molo'||DSRC==='bomb'))d*=2}let cr=0;if(Math.random()<S.crit+(S.od>0?.12:0)+(HR('coin')?.1:0)){d*=2;cr=1}S.dmg[DSRC]=(S.dmg[DSRC]||0)+Math.min(d,z.hp);z.hp-=d;z.fl=.07;if(k){const l=hyp(kx,ky)||1,m=z.t==='boss'?.1:(z.t==='blk'||z.el)?.3:1;z.kx+=kx/l*k*m;z.ky+=ky/l*k*m}
 if(S.num.length<(qualityLow?14:40))S.num.push({x:z.x+rand(-6,6),y:z.y-14,s:Math.round(d),t:0,big:d>=30,cr});
 if(z.hp<=0)killZ(z)}
function killZ(z){if(z.dead)return;z.dead=true;if(z.t==='bomb')bombBoom(z);if(z.el&&S.node){S.eK=(S.eK||0)+1;S.scrap=(S.scrap||0)+4}if(HR('band')){S.bandN=(S.bandN||0)+1;if(S.bandN>=30){S.bandN=0;P.hp=Math.min(P.maxHp,P.hp+4*(HR('bag')?1.5:1))}}{const nm=ZT[z.t].spr||z.t;if(CM[nm]){if(S.dead.length>(qualityLow?24:60))S.dead.shift();S.dead.push({t:nm,x:z.x,y:z.y,t2:0,flip:z.x<P.x,sc:(z.el===2?1.8:z.el?1.4:1)*(ZT[z.t].sc||1)})}}S.kills++;save.stats.kills++;mission('kill');if(S.od<=0&&!S.win&&S.odG<odNeed()){S.odG+=(z.t==='walk'||z.t==='run')?1:3;if(S.odG>=odNeed()){S.odG=odNeed();AudioFx.cue('ding',.7);vib('medium');if(!save.tips.ult)tip('ult',[['공습 게이지가 가득 찼어요! 오른쪽 아래 버튼을 누르면 폭격이 쏟아져요.','空袭能量已满！点击右下角按钮呼叫轰炸。'],['폭격 뒤 7초 동안은 공격도 빨라져요. 떼에 둘러싸였을 때 쓰세요.','轰炸后7秒内攻速加快，被包围时使用。']])}}
 if(z.el){save.stats.elite=(save.stats.elite||0)+1;shake(.3);vib('medium');for(let i=0;i<8;i++)S.gems.push({x:z.x+rand(-24,24),y:z.y+rand(-24,24),v:4,t:0});if(z.el===2)S.pk.push({k:'medkit',x:z.x+22,y:z.y})}
 if(S.kills%100===0){message(S.kills+L(' 처치!',' 击倒！'),1.2);AudioFx.cue('near',.6)}
 const col=ZCOL(z.t),big=!(z.t==='walk'||z.t==='run');spark(z.x,z.y,big?14:5,col,big?170:110,.4,big?4:3);if(S.fx.length<70)S.fx.push({k:'pop',x:z.x,y:z.y,t:0,life:.16,R:z.r*2.8,c:col});
 if(big){shake(.12);if(!save.mild&&!qualityLow)S.dec.push({k:'splat',x:z.x,y:z.y,t:0,life:6,R:z.r*1.6,a:Math.random()*6})}
 S.gems.push({x:z.x,y:z.y,v:ZT[z.t].xp,t:0});
 if(S.fx.length<40)S.fx.push({k:'gib',x:z.x,y:z.y,t:0,life:.4,a:Math.random()*6,c:col,n:big?10:5});
 AudioFx.cue('zdie',.45,.09);
 const r=Math.random();if(z.el||((z.t==='blk'||z.t==='cmd')&&Math.random()<.06))S.pk.push({k:'crate',x:z.x,y:z.y});else if(r<.012)S.pk.push({k:'medkit',x:z.x,y:z.y});else if(r<.019)S.pk.push({k:'battery',x:z.x,y:z.y});
 if(z.t==='boss'&&S.endless){S.eb=[];S.bossOut=false;S.boss=null;S.nbT=S.t+150;S.hm*=1.3;S.pk.push({k:'crate',x:z.x,y:z.y});giveSupRun(60+Math.round(S.t/3));announce(L('문지기 격파!','击倒守门者！'),L('밤은 아직 끝나지 않았다','长夜尚未结束'),'#ffd166');shake(.5)}
 else if(z.t==='boss'){S.eb=[];S.win=true;S.winT=1.6;shake(.7);vib('long');AudioFx.cue('win');for(const o of S.zs)if(!o.dead&&o!==z)killZ(o);announce(L('문지기를 쓰러뜨렸다!','击倒了守门者！'),L('탈출로가 열렸다','撤离通道打开了'),'#7fe0b0')}}

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
 if(S.winT>=0){S.winT-=dt;dt*=.3;if(S.winT<0){if(S.node&&S.node.t!=='boss'){nodeClear();return}finishRun(true);return}}
 const p=P;S.t+=dt;svTick(dt);nodeTick(dt);acidTick(dt);if(S.helmT>0)S.helmT-=dt;DSRC='etc';if(S.od>0)S.od-=dt;flashT=Math.max(0,flashT-dt);shakeT=Math.max(0,shakeT-dt);
 // 이동
 const v=input(),m=hyp(v.x,v.y),sp=118*S.spdM*(1+.08*lv('spd'))*(S.od>0?1.12:1);if(m>.1){const ox=p.x,oy=p.y;moveE(p,v.x*sp*dt,v.y*sp*dt,7);S.moved+=hyp(p.x-ox,p.y-oy);{const ta=Math.atan2(v.y,v.x);let da=ta-p.ang;while(da>PI)da-=TAU;while(da<-PI)da+=TAU;p.ang+=da*Math.min(1,dt*14)}p.phase+=dt*9*m}p.mv=m;p.inv=Math.max(0,p.inv-dt);
 // 등장
 if(!S.win){const cap=(qualityLow?150:210)+(S.endless?Math.min(90,S.t/6):0),rate=(2.6+(S.node?Math.min(S.t,80):S.t)*.13)*S.rate*(S.tut&&S.t<20?.6:1);S.spawn+=rate*dt;while(S.spawn>=1){S.spawn--;if(S.zs.length<cap)spawnRing(pickType())}
  if(S.t>=S.wave){S.wave+=25;AudioFx.cue('surge',.8);const wk=S.tut?0:S.wn++%3;
   if(wk===1){message(L('포위당했다! 뚫고 나가요','被包围了！冲出去'),1.8);const n=20+((S.t/12)|0);for(let i=0;i<n;i++){const a=i/n*TAU,x=p.x+Math.cos(a)*235,y=p.y+Math.sin(a)*235;if(!solid(x,y,12)&&S.zs.length<280)spawn('walk',x,y)}}
   else if(wk===2){message(L('질주 떼가 달려온다!','狂奔尸群冲来了！'),1.8);const a=Math.random()*TAU,n=10+((S.t/15)|0);for(let i=0;i<n;i++){const o=(i-n/2)*16,x=p.x+Math.cos(a)*270-Math.sin(a)*o,y=p.y+Math.sin(a)*270+Math.cos(a)*o;if(!solid(x,y,12)&&S.zs.length<280)spawn('run',x,y)}}
   else{message(L('떼가 몰려온다!','尸潮来袭！'),1.6);for(let i=0;i<18+S.t*.22&&S.zs.length<260;i++)spawnRing(Math.random()<.3&&S.t>30?'run':'walk')}}
  if(S.t>=S.elT&&(S.endless||S.t<BOSS_T-5)){S.elT+=35;const mid=S.elN===1,z=spawnElite(mid?'blk':['blk','cmd','pred'][S.elN%3],mid);S.elN++;if(z){message(mid?L('거대 감염체 등장!','巨型感染者出现！'):L('정예 등장 · 쓰러뜨리면 보급 상자','精英出现 · 击倒掉落补给箱'),1.8);AudioFx.cue('scream',.45)}}
  if(!S.endless&&S.boss&&!S.boss.dead&&S.t>BOSS_T+75&&!S.rage){S.rage=1;message(L('문지기가 날뛴다!','守门者暴走了！'),1.6)}
  if(S.endless&&S.t>=(S.hmT||60)){S.hmT=S.t+60;S.hm*=S.t>290?1.7:1.32;S.rate*=1.1}
  if(!S.bossOut&&S.t>=(S.endless?S.nbT:S.node?S.bT:BOSS_T)){S.bossOut=true;S.boss=spawnRing('boss')||spawnRing('boss',300)||spawnRing('boss',220)||spawnRing('boss',150)||spawn('boss',p.x,p.y);announce(L('문지기 등장','守门者出现'),L('쓰러뜨리면 탈출!','击倒它就能撤离！'),'#ff9a7a');AudioFx.cue('scream');vib('heavy')}
  if(S.drops.length&&S.t>=S.drops[0]){S.drops.shift();let x=p.x,y=p.y;for(let i=0;i<20;i++){const a=Math.random()*TAU,r=rand(110,170),tx=p.x+Math.cos(a)*r,ty=p.y+Math.sin(a)*r;if(!solid(tx,ty,16)){x=tx;y=ty;break}}S.pk.push({k:'crate',x,y,drop:1});message(L('보급 상자 투하!','补给箱空投！'),1.6);AudioFx.cue('ding',.6)}}
 if(autoBot&&ultReady())useUlt();
 for(const a of S.air){a.t-=dt;if(a.t<=0){a.done=1;DSRC='air';S.fx.push({k:'boom',x:a.x,y:a.y,t:0,life:.5,R:78,c:'#ff8a3d'});S.dec.push({k:'crack',x:a.x,y:a.y,t:0,life:5,R:30,a:Math.random()*6});shake(.3);AudioFx.cue('slam',.5,.07);const d=70+S.t*1.5;near(a.x,a.y,82,z=>hurt(z,z.t==='boss'?d*.6:d,0,0,0))}}S.air=S.air.filter(a=>!a.done);DSRC='etc';
 S.flowT-=dt;if(S.flowT<=0){S.flowT=.3;flowUpdate()}
 grid.clear();for(const z of S.zs){const k=gk(z.x,z.y);let a=grid.get(k);if(!a)grid.set(k,a=[]);a.push(z)}
 // 감염체
 const cmds=S.zs.filter(z=>z.t==='cmd');
 for(const z of S.zs){const T=ZT[z.t];const dx=p.x-z.x,dy=p.y-z.y,d=hyp(dx,dy)||1;z.fl=Math.max(0,z.fl-dt);if(z.burn>0){z.burn-=dt;z.bT=(z.bT||0)-dt;if(z.bT<=0){z.bT=.4;DSRC='saw';hurt(z,6+lv('saw')*2,0,0,0)}}z.hitT-=dt;z.sawT-=dt;
  let s=T.spd*(z.t==='boss'&&S.rage?1.7:1)*(S.endless?Math.min(1.6,1+S.t/700):1);if(z.slowT>0){z.slowT-=dt;s*=z.frz?.12:.42;if(z.slowT<=0)z.frz=0}for(const cm of cmds)if(cm!==z&&hyp(cm.x-z.x,cm.y-z.y)<130){s*=1.45;break}
  if(z.t==='boss'&&!S.tut&&bossExtra(z,dt,d,dx,dy)){continue}
  if(z.t==='pred'||z.t==='boss'){z.stT-=dt;if(z.st===0&&z.stT<=0&&d<(z.t==='boss'?150:190)){z.st=1;z.stT=z.t==='boss'?.9:.5;z.tx=p.x;z.ty=p.y}
   else if(z.st===1){s=0;if(z.stT<=0){if(z.t==='boss'){z.st=0;z.stT=4;shake(.45);AudioFx.cue('slam');S.fx.push({k:'wave',x:z.x,y:z.y,t:0,life:.45,R:95,c:'#ff8a3d'});S.dec.push({k:'crack',x:z.x,y:z.y,t:0,life:3,R:95,a:Math.random()*6});spark(z.x,z.y,22,'#c9b39a',200,.6,3.5);if(d<95+9)hitP(T.dmg*(1+.15*S.st))}
    else{z.st=2;z.stT=.34;const l=hyp(z.tx-z.x,z.ty-z.y)||1;z.lx=(z.tx-z.x)/l;z.ly=(z.ty-z.y)/l}}}
   else if(z.st===2){moveE(z,z.lx*330*dt,z.ly*330*dt,z.r*.6);if(z.stT<=0){z.st=0;z.stT=rand(2.2,3.6)}s=0}}
  if(z.t==='spit'){if(d<180){moveE(z,-dx/d*T.spd*.7*dt,-dy/d*T.spd*.7*dt,z.r*.6);s=0}z.shT=(z.shT==null?rand(1,2.5):z.shT)-dt;if(z.shT<=0&&d<320){z.shT=2.8;S.eb.push({x:z.x,y:z.y-10,vx:dx/d*150,vy:dy/d*150,t:0,ac:1});AudioFx.cue('throw',.3,.15)}}
  if(z.t==='bomb'){if(z.fz>0){z.fz-=dt;s=0;if(z.fz<=0){z.hp=0;killZ(z);continue}}else if(d<42){z.fz=.7;AudioFx.cue('beep',.5,.1)}}
  if(z.stun>0){z.stun-=dt;s=0}
  if(s>0){let ux=dx/d,uy=dy/d;if(flowDir(z,FO)){ux=FO.x*.85+ux*.15;uy=FO.y*.85+uy*.15;z.blk=0;z.slT=0}
   else if(z.blk){if(!(z.slT>0)){z.slT=.9;if(z.blk===1){z.sx=0;z.sy=Math.abs(dy)>24?Math.sign(dy):(Math.random()<.5?-1:1)}else{z.sy=0;z.sx=Math.abs(dx)>24?Math.sign(dx):(Math.random()<.5?-1:1)}}z.blk=0}
   if(z.slT>0){z.slT-=dt;ux=ux*.25+z.sx;uy=uy*.25+z.sy}
   moveE(z,ux*s*dt,uy*s*dt,Math.min(10,z.r*.55));const ta=Math.atan2(uy,ux);let da=ta-z.ang;while(da>PI)da-=TAU;while(da<-PI)da+=TAU;z.ang+=da*Math.min(1,dt*9);z.ph+=dt*(s/(z.t==='run'||z.t==='pred'?9:12))}
  if(z.kx||z.ky){moveE(z,z.kx*dt,z.ky*dt,Math.min(10,z.r*.55));z.kx*=Math.pow(.002,dt);z.ky*=Math.pow(.002,dt);if(Math.abs(z.kx)+Math.abs(z.ky)<4)z.kx=z.ky=0}
  if(d<z.r+9&&z.hitT<=0&&!(z.stun>0)){z.hitT=.7;hitP(T.dmg*(1+.15*S.st))}
  if(z.t==='boss'&&z.hp<z.mhp*.65){z.shT=(z.shT==null?2:z.shT)-dt;if(z.shT<=0){z.shT=z.hp<z.mhp*.3?3.2:4.6;const n=12,o=Math.random();for(let i=0;i<n;i++){const a=(i+o)/n*TAU;S.eb.push({x:z.x,y:z.y,vx:Math.cos(a)*105,vy:Math.sin(a)*105,t:0})}AudioFx.cue('shock',.5);S.fx.push({k:'wave',x:z.x,y:z.y,t:0,life:.3,R:50,c:'#ff8a3d'})}}
  if(z.t==='boss'){z.chk=(z.chk||0)+dt;if(z.chk>3){if(hyp(z.x-(z.cx||0),z.y-(z.cy||0))<20&&d>220){const q=spawnRing('walk',260);if(q){z.x=q.x;z.y=q.y;q.dead=true}}z.chk=0;z.cx=z.x;z.cy=z.y}}
  if(d>hyp(VW,VH)*.95&&z.t!=='boss'){z.dead=true;z.gone=true}}
 for(const a of grid.values())for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++){const A=a[i],B=a[j],dx=B.x-A.x,dy=B.y-A.y,d=hyp(dx,dy)||.01,mn=(A.r+B.r)*.85;if(d<mn){const o=(mn-d)*.5,ux=dx/d,uy=dy/d;A.x-=ux*o*.5;A.y-=uy*o*.5;B.x+=ux*o*.5;B.y+=uy*o*.5}}
 weapons(dt);
 // 탄 · 불 · 번개
 for(const b of S.bul){b.t+=dt;DSRC=b.mol===2?'frost':b.mol?'molo':b.rk?'drone':b.tc?'turret':b.sg?'saw':b.al?'ally':'gun';
  if(b.mol){if(Math.random()<.7){const t=b.t/b.life;spark(b.x0+(b.x-b.x0)*t,b.y0+(b.y-b.y0)*t-Math.sin(t*PI)*40,1,b.mol===2?'#ffe2a8':'#ffb347',18,.3,2.4)}
   if(b.t>=b.life){b.dead=true;if(b.mol===2){const ev=EV('frost'),R=(62+7*b.L)*(ev?1.5:1);near(b.x,b.y,R,z=>{hurt(z,(8+4*b.L)*(ev?2:1),0,0,0);z.slowT=(2.4+.35*b.L)*(ev?1.4:1);if(ev)z.frz=1});S.fx.push({k:'boom',x:b.x,y:b.y,t:0,life:.4,R,c:'#cfe6f2'});S.dec.push({k:'frost',x:b.x,y:b.y,t:0,life:2.4+.35*b.L,R});spark(b.x,b.y,18,'#e6eef2',190,.5,3);AudioFx.cue('glass',.6,.08)}
    else{const ev=EV('molo'),R=(36+7*b.L)*(ev?1.5:1);S.pools.push({x:b.x,y:b.y,R,t:0,life:(2.4+.3*b.L)*(ev?1.5:1),tick:0,L:b.L});AudioFx.cue('glass',.6,.08);S.fx.push({k:'boom',x:b.x,y:b.y,t:0,life:.35,R:R*1.3,c:'#ff8a3d'});spark(b.x,b.y,16,'#ffb347',200,.45,3);shake(.1)}}continue}
  if(b.rk){let tg=b.tg;if(!tg||tg.dead)tg=b.tg=nearest(b.x,b.y,220);if(tg){const ta=Math.atan2(tg.y-b.y,tg.x-b.x);let da=ta-b.a;while(da>PI)da-=TAU;while(da<-PI)da+=TAU;b.a+=clamp(da,-7*dt,7*dt)}
   const vv=180+b.t*260;b.x+=Math.cos(b.a)*vv*dt;b.y+=Math.sin(b.a)*vv*dt;if(Math.random()<.8)spark(b.x,b.y,1,'#ffb347',12,.25,2.2);
   if((tg&&hyp(tg.x-b.x,tg.y-b.y)<12)||b.t>2.2){b.dead=true;const R=40+5*b.L;near(b.x,b.y,R,z=>hurt(z,b.d,z.x-b.x,z.y-b.y,120));S.fx.push({k:'boom',x:b.x,y:b.y,t:0,life:.3,R:R*1.2,c:'#ff8a3d'});spark(b.x,b.y,10,'#ffd166',170,.35,2.6);shake(.07);AudioFx.cue('shock',.3,.08)}continue}
  b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.t>(b.life||.6)){b.dead=true;continue}
  near(b.x,b.y,b.rad||5,z=>{if(b.dead||b.hit.indexOf(z)>=0)return;b.hit.push(z);hurt(z,b.d,b.vx,b.vy,b.sg?150:60);if(b.fire&&!z.dead)z.burn=Math.max(z.burn||0,2);sfx('shot',b.x,b.y-6,26,.16,{f0:4,nf:4,rot:Math.random()*6});if(b.pr--<=0)b.dead=true})}
 S.bul=S.bul.filter(b=>!b.dead);
 DSRC='molo';for(const o of S.pools){o.t+=dt;o.em=(o.em||0)+dt*(qualityLow?3:8);while(o.em>=1){o.em--;if(o.life-o.t>.25)flame(o.x,o.y,o.R)}o.tick-=dt;if(Math.random()<dt*12)spark(o.x+rand(-.6,.6)*o.R,o.y+rand(-.5,.5)*o.R,1,'#ffb347',12,.8,2.4,-60);if(o.tick<=0){o.tick=.35;near(o.x,o.y,o.R,z=>hurt(z,6+3*o.L,0,0,0))}}S.pools=S.pools.filter(o=>o.t<o.life);
 DSRC='etc';for(const e of S.eb){e.t+=dt;e.x+=e.vx*dt;e.y+=e.vy*dt;if(hyp(e.x-p.x,e.y-p.y)<11){e.t=9;hitP(12*(1+.15*S.st))}}S.eb=S.eb.filter(e=>e.t<4.5);
 for(const b of S.bolts)b.t+=dt;S.bolts=S.bolts.filter(b=>b.t<.14);
 // 초록 빛 · 줍기
 const mr=62*S.magM*(1+.35*lv('mag'));let got=0;
 for(const gm of S.gems){gm.t+=dt;const dx=p.x-gm.x,dy=p.y-gm.y,d=hyp(dx,dy)||1;if(d<mr||gm.pull){gm.pull=true;const s2=Math.min(d,(300+gm.t*200)*dt);gm.x+=dx/d*s2;gm.y+=dy/d*s2}if(d<13){gm.got=true;S.xp+=gm.v*S.xpM;got++}}
 if(got)AudioFx.cue('gem',.35,.04,1+Math.min(1,S.xp/S.need));
 S.gems=S.gems.filter(gm=>!gm.got);if(S.gems.length>220){const ex=S.gems.splice(0,S.gems.length-220);let vsum=0;for(const e of ex)vsum+=e.v;S.gems[0].v+=vsum}
 for(const k of S.pk){if(k.drop>0){k.drop-=dt*1.5;continue}if(hyp(k.x-p.x,k.y-p.y)<24){k.got=true;
  if(k.k==='medkit'){p.hp=Math.min(p.maxHp,p.hp+30);AudioFx.cue('heal');floatTxt(p.x,p.y-30,L('체력 +30','生命 +30'),'#7fe0b0')}
  else if(k.k==='battery'){for(const gm of S.gems)gm.pull=true;AudioFx.cue('ding');floatTxt(p.x,p.y-30,L('전부 끌어오기!','全部吸取！'),'#cfe6f2')}
  else openChest()}}
 S.pk=S.pk.filter(k=>!k.got);S.zs=S.zs.filter(z=>!z.dead);
 if(S.boss&&S.boss.dead)S.boss=null;
 for(const q of S.pt){q.t+=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=Math.pow(.02,dt);q.vy=q.vy*Math.pow(.02,dt)+q.g*dt}S.pt=S.pt.filter(q=>q.t<q.life);
 for(const q of S.fp){q.t+=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.r+=q.vr*dt;const k=Math.pow(.12,dt);q.vx*=k;q.vy*=k}S.fp=S.fp.filter(q=>q.t<q.life);
 for(const c of S.dead)c.t2+=dt;S.dead=S.dead.filter(c=>c.t2<3.2);for(const e of S.sfx)e.t+=dt;S.sfx=S.sfx.filter(e=>e.t<e.life);
 for(const d of S.dec)d.t+=dt;S.dec=S.dec.filter(d=>d.t<d.life);for(const f of S.fx)f.t+=dt;S.fx=S.fx.filter(f=>f.t<f.life);for(const n of S.num)n.t+=dt;S.num=S.num.filter(n=>n.t<.5);
 // 소리: 가까운 놈의 신음
 S.groanT-=dt;if(S.groanT<=0){S.groanT=rand(1.1,2.4);const z=nearest(p.x,p.y,260);if(z)AudioFx.cue('groan'+(1+((Math.random()*4)|0)),.25+.35*(1-hyp(z.x-p.x,z.y-p.y)/260),.5)}
 if(p.hp>0&&p.hp<p.maxHp*.25){S.hbT=(S.hbT||0)-dt;if(S.hbT<=0){S.hbT=.95;AudioFx.cue('heart',.6)}}
 // 안내
 if(S.tut){S.tipT+=dt;}
 if(S.xp>=S.need&&!S.win&&!S.pick){S.xp-=S.need;levelUp()}}
function floatTxt(x,y,s,col){if(S.num.length<44)S.num.push({x,y,s,t:-.4,big:true,col})}
function hitP(d){if(P.inv>0||S.win||S.over)return;if(HR('helm')&&!(S.helmT>0)){S.helmT=8;P.inv=.5;message(L('헬멧이 막았다!','头盔挡住了！'),.8);AudioFx.cue('ding',.5);return}if(HR('thorn')){const os=DSRC;DSRC='etc';near(P.x,P.y,95,z=>hurt(z,35+S.lv*2,z.x-P.x,z.y-P.y,160));DSRC=os;S.fx.push({k:'wave',x:P.x,y:P.y,t:0,life:.3,R:95,c:'#d9cba8'})}if(S.endless)d*=1+S.t/150;P.hp-=d;P.inv=.4;flashT=.25;shake(.18);AudioFx.cue('hurt',.7,.1);vib('heavy');
 if(P.hp<=0){P.hp=0;if(S.kit&&!S.kitUsed){S.kitUsed=true;reviveP(.4);announce(L('응급 키트!','急救包！'),L('다시 일어났다','重新站了起来'),'#7fe0b0');return}finishRun(false)}}
function reviveP(f){P.hp=Math.round(P.maxHp*f);P.inv=2.5;S.fx.push({k:'wave',x:P.x,y:P.y,t:0,life:.6,R:200,c:'#7fe0b0'});for(const z of S.zs)if(z.t!=='boss'&&hyp(z.x-P.x,z.y-P.y)<200){z.kx+=(z.x-P.x)*4;z.ky+=(z.y-P.y)*4}AudioFx.cue('heal')}

// ================================================================ 무기
function weapons(dt){const p=P,cd=S.cd,cdm=CDM();newWeapons(dt,cdm);
 if(lv('gun')){cd.gun-=dt;if(cd.gun<=0){const tg=(S.boss&&!S.boss.dead&&hyp(S.boss.x-p.x,S.boss.y-p.y)<220)?S.boss:nearest(p.x,p.y,240);if(tg){const L0=lv('gun'),ev=EV('gun'),n=ev?4:L0>=5?3:L0>=3?2:1,base=Math.atan2(tg.y-p.y,tg.x-p.x);cd.gun=(ev?.22:L0>=4?.3:.4)*cdm;
   for(let i=0;i<n;i++){const a=ev?base:base+(i-(n-1)/2)*.16,dl=ev?i*.05:0;S.bul.push({x:p.x-Math.cos(a)*dl*600,y:p.y-6-Math.sin(a)*dl*600,vx:Math.cos(a)*(ev?620:440),vy:Math.sin(a)*(ev?620:440),d:(12+3*L0)*(ev?1.6:1),pr:ev?6:L0>=4?2:L0>=2?1:0,t:0,hit:[],col:ev?'#ffffff':'#ffe2a8',big:ev,life:ev?.55:.6})}
   sfx('shot',p.x+Math.cos(base)*22,p.y-18+Math.sin(base)*22,30,.09,{f0:0,nf:3,rot:base});AudioFx.cue('shot',.3,.11)}else cd.gun=.12}}
 if(lv('saw')){cd.saw=(cd.saw==null?.6:cd.saw)-dt;if(cd.saw<=0){const tg=nearest(p.x,p.y,200);if(tg){const L0=lv('saw'),ev=EV('saw'),n=ev?9:4+L0,base=Math.atan2(tg.y-p.y,tg.x-p.x),sp=ev?.7:.55;
   for(let i=0;i<n;i++){const a=base+(i/(n-1)-.5)*sp+rand(-.04,.04),v=rand(480,560);S.bul.push({x:p.x,y:p.y-6,vx:Math.cos(a)*v,vy:Math.sin(a)*v,d:(8+3*L0)*(ev?1.5:1),pr:ev?2:0,t:0,hit:[],col:ev?'#ffb070':'#ffe2a8',life:.32,sg:1,fire:ev})}
   cd.saw=(1.15-.07*L0)*cdm*(ev?.8:1);sfx('shot',p.x+Math.cos(base)*24,p.y-18+Math.sin(base)*24,44,.12,{f0:0,nf:4,rot:base});AudioFx.cue('shot',.55,.08);shake(.04)}else cd.saw=.15}}
 if(lv('molo')){cd.molo-=dt;if(cd.molo<=0){const L0=lv('molo'),ev=EV('molo');let any=false;for(let i=0;i<(ev?2:1);i++){const tg=randomNear(p.x,p.y,210);if(tg){any=true;S.bul.push({mol:1,x0:p.x,y0:p.y,x:tg.x,y:tg.y,t:0,life:.45,L:L0})}}
   if(any){cd.molo=Math.max(1.1,3.1-.38*L0)*cdm;AudioFx.cue('throw',.5)}else cd.molo=.3}}
 if(lv('pulse')){DSRC='pulse';cd.pulse-=dt;if(cd.pulse<=0){const L0=lv('pulse'),ev=EV('pulse'),R=(85+18*L0)*(ev?1.4:1);cd.pulse=Math.max(1.5,3.8-.42*L0)*cdm;
   S.fx.push({k:'wave',x:p.x,y:p.y,t:0,life:.4,R,c:'#d9cba8'});for(let i=0;i<(qualityLow?8:18);i++){const a=i/18*TAU;S.pt.push({x:p.x+Math.cos(a)*14,y:p.y+Math.sin(a)*14,vx:Math.cos(a)*R*2.4,vy:Math.sin(a)*R*2.4,t:0,life:.38,s:3,c:'#bfae90',g:0})}
   AudioFx.cue('shock',.45);shake(.1);near(p.x,p.y,R,z=>{hurt(z,(10+5*L0)*(ev?1.6:1),z.x-p.x,z.y-p.y,170);if(ev&&z.t!=='boss')z.stun=1})}}
 if(lv('bolt')){DSRC='bolt';cd.bolt-=dt;if(cd.bolt<=0){const L0=lv('bolt'),ev=EV('bolt');let cur=nearest(p.x,p.y,200);if(cur){cd.bolt=(ev?.7:Math.max(.8,2.3-.3*L0))*cdm;const pts=[[p.x,p.y-8]],seen=new Set();
   for(let i=0;i<(ev?12:2+L0)&&cur;i++){seen.add(cur);pts.push([cur.x,cur.y]);hurt(cur,15+5*L0,0,0,0);let nx=null,nd=95;near(cur.x,cur.y,95,(z,d)=>{if(!seen.has(z)&&d<nd){nd=d;nx=z}});cur=nx}
   S.bolts.push({pts,t:0});for(let i=1;i<pts.length;i++)spark(pts[i][0],pts[i][1],4,'#ffe2a8',120,.25,2.4);
   if(ev)for(let i=0;i<2;i++){const z=randomNear(p.x,p.y,230);if(z){S.bolts.push({pts:[[z.x+rand(-20,20),z.y-260],[z.x,z.y]],t:0});near(z.x,z.y,40,o=>hurt(o,30,0,0,0));S.fx.push({k:'boom',x:z.x,y:z.y,t:0,life:.25,R:40,c:'#cfe6f2'})}}
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
function calcReward(won){const b=S.kills*.12+((S.tt||0)+S.t)*.35+(won?60:0);return Math.round(b*(1+.3*S.st)*(1+.3*(S.diff-1))*(1+.08*upLv('sup')))}
function giveSupRun(n){S.bonus=(S.bonus||0)+n;message(L('물자 +','物资 +')+n,1.4)}
function finishRun(won){if(S.over)return;S.over=true;S.won=won;if(S.endless){S.newBest=S.t>(save.endBest||0);save.endBest=Math.max(save.endBest||0,Math.round(S.t))}const rw=calcReward(won)+(S.bonus||0);S.reward=rw;save.sup+=rw;mission('time',Math.round(S.t-(S.tc||0)));S.tc=S.t;
 if(won){const k=S.st;save.stats.clears++;mission('clear');const first=!save.clr[k+1];save.clr[k+1]=1;save.diff[k]=Math.max(save.diff[k]||1,S.diff+1);
  const st=1+(S.revived||S.kitUsed?0:1)+(P.hp>=P.maxHp*.5?1:0);S.stars=st;save.stars[k]=Math.max(save.stars[k]||0,st);S.first=first;
  if(first&&k<4){const nw=WEAPONS.find(w=>UNLOCK[w]===k+1);S.unlockMsg=L((k+2)+'구역 열림','第'+(k+2)+'区已开放')+(nw?' · '+L('새 무기 ','新武器 ')+LL(WP[nw].n):'')}}
 if(!S.endless)save.best[S.st]=Math.max(save.best[S.st]||0,Math.round(S.t));if(!save.firstDone){save.firstDone=true}
 persist();track(S.endless?'endless_end':won?'run_clear':'run_fail',{st:S.endless?0:S.st+1,diff:S.diff,t:Math.round(S.t),k:S.kills,lv:S.lv,evo:S.evoN,rev:S.revived?1:0});
 AudioFx.cue(won?'win':'lose');vib('long');sc='result'}
function newEndless(boost){const st=(Math.random()*5)|0;newRun(st,1,false,boost);if(!S)return;S.endless=true;S.hm=1;S.rate=1;S.sp=STAGES[2].sp;S.drops=[60,120,200,280,360,440,520,600];announce(L('끝없는 밤','无尽长夜'),L('얼마나 버틸 수 있을까?','你能坚持多久？'),'#b9a6ff')}
function revive(){S.over=false;S.revived=true;sc='battle';save.sup=Math.max(0,save.sup-S.reward);S.reward=0;persist();reviveP(.6);track('revive',{st:S.st+1,t:Math.round(S.t)})}
// ================================================================ 길 고르기(챕터 경로) · 상점 · 사건 · 휴식
// 노드 종류: 전투형(fight 버티기, elite 정예 사냥, defend 발전기 지키기, collect 연료 모으기, rescue 생존자 구출, boss) / 쉼터형(shop, event, rest)
const NT={
 fight:{i:'⚔',c:'#c8d2de',n:['버티기','坚守'],d:['75초 동안 버티면 길이 열려요','坚持75秒即可通过'],b:1},
 elite:{i:'☠',c:'#ffd166',n:['정예 사냥','精英狩猎'],d:['금빛 정예 3마리를 쓰러뜨려요 · 부품 많이','击倒3个金色精英 · 零件更多'],b:1},
 defend:{i:'⚡',c:'#7fd0ff',n:['발전기 지키기','守护发电机'],d:['60초 동안 발전기를 지켜요 · 놈들이 발전기를 부숴요','守护发电机60秒 · 敌人会破坏它'],b:1},
 collect:{i:'⛽',c:'#ff9a5a',n:['연료 모으기','收集燃料'],d:['흩어진 연료통 5개를 모아요','收集散落的5个燃料桶'],b:1},
 rescue:{i:'🆘',c:'#7fe0b0',n:['생존자 구출','营救幸存者'],d:['생존자 2명을 구해요 · 동료가 될 수 있어요','营救2名幸存者 · 可成为同伴'],b:1},
 shop:{i:'🛒',c:'#ffe2a0',n:['떠돌이 상인','流浪商人'],d:['부품으로 회복·강화·동료를 사요','用零件购买回复、强化、同伴']},
 event:{i:'❓',c:'#b9a6ff',n:['사건','事件'],d:['무슨 일이 생길지 몰라요 · 선택에 따라 달라져요','不知道会发生什么 · 结果取决于选择']},
 rest:{i:'🔥',c:'#ff8a3d',n:['모닥불','篝火'],d:['쉬어서 회복하거나 무기를 손봐요','休息回复或保养武器']},
 boss:{i:'👹',c:'#ff6a5a',n:['문지기','守门者'],d:['이 구역의 문지기를 쓰러뜨리고 탈출해요','击倒本区守门者并撤离'],b:1}};
const ROUTE_POOL=[['fight','collect','rescue'],['event','shop','elite','defend'],['fight','defend','collect','event','rescue'],['fight','collect','defend','event'],['rest','shop','elite','event'],['fight','defend','elite','rescue','collect']];
function genRoute(st){const L=[[{t:'fight'}]];for(let l=0;l<ROUTE_POOL.length;l++){const pool=ROUTE_POOL[l].slice(),n=2+(Math.random()<.55?1:0),row=[];while(row.length<n&&pool.length){const k=pool.splice((Math.random()*pool.length)|0,1)[0];row.push({t:k})}L.push(row)}L.push([{t:'boss'}]);
 L.forEach((row,l)=>row.forEach((n,i)=>{n.l=l;n.i=i;n.nx=[];n.x=row.length===1?375:150+i*(450/(row.length-1));n.y=1075-l*124}));
 for(let l=0;l<L.length-1;l++){const a=L[l],b=L[l+1];a.forEach((n,i)=>{const c=a.length===1?(b.length-1)/2:i*(b.length-1)/(a.length-1);n.nx.push(Math.round(c));if(b.length>1&&Math.random()<.6){const o=Math.round(c)+(c%1<.5?1:-1);if(o>=0&&o<b.length&&n.nx.indexOf(o)<0)n.nx.push(o)}});
  b.forEach((m,j)=>{if(!a.some(n=>n.nx.indexOf(j)>=0)){let bi=0,bd=99;a.forEach((n,i)=>{const d=Math.abs(n.x-m.x);if(d<bd){bd=d;bi=i}});a[bi].nx.push(j)}})}
 return{st,L,cur:null,sel:null}}
function startChapter(st,diff,boost){newRun(st,diff,false,boost);if(!S)return;S.route=genRoute(st);S.hm0=S.hm;S.rate0=S.rate;S.scrap=0;S.tt=0;clearBig();sc='route';track('chapter_start',{st:st+1,diff})}
function findOpen(){let best=null,bs=-1;for(let k=0;k<60;k++){const x=rand(180,WW-180),y=rand(180,WH-180);if(solid(x,y,18))continue;let o=0;for(let a=0;a<TAU;a+=.5)for(let r=40;r<=160;r+=40)if(!solid(x+Math.cos(a)*r,y+Math.sin(a)*r,10))o++;if(o>bs){bs=o;best={x,y}}}return best||{x:P.x,y:P.y}}
function nodeReachable(n){const R=S.route;if(!R.cur)return n.l===0;return n.l===R.cur.l+1&&R.cur.nx.indexOf(n.i)>=0}
function enterNode(n){const R=S.route;R.cur=n;R.sel=null;track('node',{t:n.t,l:n.l});if(!NT[n.t].b){if(n.t==='shop')openShop();else if(n.t==='event')openEvent();else{sc='rest'}return}
 // 전투 칸 준비: 판 상태는 이어지고(레벨·무기·체력·동료), 맵 위의 것만 새로
 for(const k of['zs','bul','gems','pk','pools','tur','bolts','fx','num','pt','dec','eb','air','fp','dead','sfx','mines','rays'])S[k]=[];
 const o=findOpen();P.x=o.x;P.y=o.y;P.inv=1.5;S.sv=(S.sv||[]).filter(v=>v.st===1);S.sv.forEach((v,i)=>{v.x=P.x+(i?30:-30);v.y=P.y+20});
 Object.assign(S,{t:0,spawn:0,wave:22,elT:30,elN:0,drops:n.t==='fight'?[38]:[],bossOut:n.t!=='boss',bT:14,boss:null,win:false,winT:-1,svT:n.t==='rescue'?[2,16]:(Math.random()<.35?[25]:[]),node:n,eK:0,nodeRes:0,cans:null,gen:null,eNext:4,od:0,rage:0,tc:0});
 S.hm=S.hm0*(1+.22*n.l);S.rate=S.rate0*(1+.07*n.l);
 if(n.t==='defend')S.gen={x:P.x+46,y:P.y,hp:100,mhp:100};
 if(n.t==='collect'){S.cans=[];for(let k=0;k<200&&S.cans.length<5;k++){const a=Math.random()*TAU,r=rand(180,400),x=P.x+Math.cos(a)*r,y=P.y+Math.sin(a)*r;if(x<80||y<80||x>WW-80||y>WH-80||solid(x,y,18))continue;if(S.cans.some(c=>hyp(c.x-x,c.y-y)<150))continue;S.cans.push({x,y})}}
 flowUpdate();sc='battle';announce(LL(NT[n.t].n),LL(NT[n.t].d),NT[n.t].c);AudioFx.cue('surge',.6)}
function nodeTick(dt){const n=S.node;if(!n||S.win)return;const p=P;let done=false;
 if(n.t==='fight')done=S.t>=75;
 else if(n.t==='elite'){if(S.t>=S.eNext&&S.zs.filter(z=>z.el&&!z.dead).length<2){S.eNext=S.t+11;spawnElite(['cmd','pred','blk'][(Math.random()*3)|0],false)}done=S.eK>=3}
 else if(n.t==='defend'){const G=S.gen;near(G.x,G.y,34,z=>{G.hp-=ZT[z.t].dmg*dt*.35});if(G.hp<=0){S.win=true;S.winT=1;S.nodeFail=1;message(L('발전기가 부서졌어요! 체력을 잃고 물러나요','发电机被毁！损失生命并撤退'),2);AudioFx.cue('lose',.6);return}done=S.t>=60}
 else if(n.t==='collect'){S.cans=S.cans.filter(c=>{if(hyp(c.x-p.x,c.y-p.y)<34){AudioFx.cue('pick',.7);vib('light');S.cansGot=(S.cansGot||0)+1;P.hp=Math.min(P.maxHp,P.hp+P.maxHp*.04);return false}return true});done=!S.cans.length}
 else if(n.t==='rescue')done=S.nodeRes>=2||(S.t>20&&!S.svT.length&&!S.sv.some(v=>v.st===0));
 if(done){S.win=true;S.winT=1.6;for(const gm of S.gems)gm.pull=true;for(const z of S.zs)if(!z.dead&&z.t!=='boss')killZ(z);announce(L('구역 확보!','区域已控制！'),L('다음 길을 고르세요','选择下一条路'),'#7fe0b0');AudioFx.cue('win',.6)}}
function nodeClear(){const n=S.node,R=S.route;S.tt+=S.t;mission('time',Math.round(S.t-(S.tc||0)));S.tc=0;let g2=0;
 if(S.nodeFail){P.hp=Math.max(1,P.hp-P.maxHp*.25)}else{g2=Math.round((22+9*n.l+(n.t==='elite'?20:0)+(S.cansGot||0)*2)*(HR('scrap')?1.5:1)*(HR('doll')?1.4:1));S.scrap+=g2;P.hp=Math.min(P.maxHp,P.hp+P.maxHp*(HR('bag')?.15:.08));if(n.t==='elite'||(n.l===1&&!(S.rel&&S.rel.length)))offerRelic('node')}
 S.nodeFail=0;S.cansGot=0;n.done=1;S.acid=[];S.node=null;S.win=false;S.winT=-1;S.zs=[];sc='route';if(g2)message(L('부품 +','零件 +')+g2,1.6)}
// ---- 그리기: 칸 목표(HUD) · 발전기 · 연료통
function drawObj(){const n=S.node;if(!n)return;let s='';if(n.t==='fight')s=L('버티기 ','坚守 ')+Math.max(0,Math.ceil(75-S.t))+L('초','秒');else if(n.t==='elite')s=L('정예 ','精英 ')+S.eK+'/3';else if(n.t==='defend')s=L('발전기 ','发电机 ')+Math.max(0,Math.round(S.gen.hp))+'% · '+Math.max(0,Math.ceil(60-S.t))+L('초','秒');else if(n.t==='collect')s=L('연료 ','燃料 ')+(5-S.cans.length)+'/5';else if(n.t==='rescue')s=L('생존자 ','幸存者 ')+S.nodeRes+'/2';else if(n.t==='boss')s=S.bossOut?L('문지기를 쓰러뜨려요','击倒守门者'):L('문지기가 다가와요 ','守门者逼近 ')+Math.max(0,Math.ceil(S.bT-S.t));
 rr(195,108,360,40,14,'rgba(0,0,0,.55)',NT[n.t].c,2);txt(NT[n.t].i+' '+s,375,128,20,'#fff','center',false,800)}
function drawNodeWorld(){if(!S.node)return;if(S.gen){const G=S.gen;glow(G.x,G.y,46,'#7fd0ff',.35+.15*Math.sin(S.t*4));rr(G.x-20,G.y-26,40,40,6,'#2a3442','#7fd0ff',2);g.fillStyle='#ffd166';g.fillRect(G.x-6,G.y-18,12,8);g.fillStyle='rgba(0,0,0,.6)';g.fillRect(G.x-26,G.y+20,52,7);g.fillStyle=G.hp>40?'#7fd0ff':'#ff6a5a';g.fillRect(G.x-26,G.y+20,52*Math.max(0,G.hp)/100,7)}
 if(S.cans)for(const c of S.cans){glow(c.x,c.y,30,'#ff9a5a',.4+.2*Math.sin(S.t*5+c.x));rr(c.x-9,c.y-14,18,24,4,'#c8402a','#2a0a04',2);g.fillStyle='#ffd166';g.fillRect(c.x-4,c.y-18,8,5)}}
function drawObjArrows(){if(S.cans)for(const c of S.cans)edgeArrow(c.x,c.y,'#ff9a5a');if(S.gen)edgeArrow(S.gen.x,S.gen.y,'#7fd0ff')}
// ---- 경로 화면
function routeScreen(){const R=S.route;bgMap(R.st,.7);const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'rgba(5,7,12,.7)');gr.addColorStop(1,'rgba(5,7,12,.9)');g.fillStyle=gr;g.fillRect(0,0,W,H);
 txt(LL(STAGES[R.st].n)+L(' · 길 고르기',' · 选择路线'),375,60,32,'#fff','center');txt(L('밝게 빛나는 칸 중 하나를 골라 가요','从发光的格子中选择一个前往'),375,100,17,'#a9b6c8','center',false,700);
 for(const row of R.L)for(const n of row)for(const j of n.nx){const m=R.L[n.l+1][j],on=(R.cur===n||(!R.cur&&n.l===0&&false));g.strokeStyle=n.done&&(m.done||nodeReachable(m))?'rgba(255,209,102,.8)':'rgba(140,160,190,.3)';g.lineWidth=n.done?4:2;g.setLineDash(n.done?[]:[8,8]);g.beginPath();g.moveTo(n.x,n.y);g.lineTo(m.x,m.y);g.stroke()}g.setLineDash([]);
 for(const row of R.L)for(const n of row){const T=NT[n.t],ok=nodeReachable(n),sel=R.sel===n,cur=R.cur===n,rad=n.t==='boss'?52:40;
  if(ok)glow(n.x,n.y,rad*1.9,T.c,.35+.2*Math.sin(frame*.1));g.beginPath();g.arc(n.x,n.y,rad,0,TAU);g.fillStyle=n.done?'rgba(40,46,56,.95)':ok?'rgba(30,22,14,.95)':'rgba(16,20,28,.9)';g.fill();g.lineWidth=sel?6:cur?5:3;g.strokeStyle=sel?'#fff':cur?'#ffd166':ok?T.c:'rgba(120,135,160,.5)';g.stroke();
  txt(T.i,n.x,n.y+1,n.t==='boss'?42:32,'#fff','center',false);txt(LL(T.n),n.x,n.y+rad+18,15,ok||cur?'#fff':'#7f8a9a','center',false,700);if(n.done)txt('✓',n.x+rad*.7,n.y-rad*.7,22,'#7fe0b0','center');
  hit(n.x-rad-10,n.y-rad-10,rad*2+20,rad*2+30,()=>{if(ok){R.sel=n;AudioFx.cue('ui',.5)}else message(n.done?L('이미 지난 길이에요','这条路已经走过了'):L('이어진 칸으로만 갈 수 있어요','只能前往相连的格子'),1.2)})}
 // 아래 상태 칸
 panel(30,1150,690,170,20,'#3a4a60');const hp=clamp(P.hp/P.maxHp,0,1);txt(L('체력','生命'),56,1182,17,'#a9b6c8','left',false,700);g.fillStyle='#0b1020';g.fillRect(110,1174,200,14);g.fillStyle=hp>.4?'#5dff9a':'#ff6a5a';g.fillRect(110,1174,200*hp,14);txt(Math.ceil(P.hp)+'/'+P.maxHp,320,1182,15,'#fff','left',false);
 txt('Lv '+S.lv,440,1182,20,'#8dffb9','left');txt(L('부품 ','零件 ')+S.scrap,700,1182,20,'#ffe2a0','right');ownedW().forEach((k,i)=>iconBox(k,62+i*50,1224,40,null,EV(k)));relicBar(400,1204,40);
 const s2=R.sel;if(s2){txt(LL(NT[s2.t].d),56,1270,16,'#dfe6ee','left',false,700);button(520,1250,180,58,L('이 길로 ▶','走这条路 ▶'),'gold',22,()=>enterNode(s2))}else txt(L('칸을 눌러 보세요','点击格子查看'),56,1280,16,'#8b97a8','left',false,700);
 button(30,20,120,54,L('◀ 포기','◀ 放弃'),'dark',17,()=>{confirmBox(L('이번 출동을 그만둘까요? 지금까지 물자는 받아요','要放弃本次出动吗？已获得的物资会保留'),()=>{S.quit=true;finishRun(false)})});
 tip('route',[['구역마다 여러 갈래 길이 있어요. 빛나는 칸을 골라 나아가요.','每个区域都有多条岔路。选择发光的格子前进。'],['전투 칸은 목표가 달라요. 상인·모닥불·사건 칸에서 숨을 돌리고 판을 바꿔요.','战斗格的目标各不相同。在商人、篝火、事件格喘口气并调整策略。'],['레벨·무기·체력은 이어져요. 마지막 문지기를 쓰러뜨리면 탈출!','等级、武器、生命都会延续。击倒最后的守门者即可撤离！']]);
 if(S.relPick)drawRelicPick();else if(S.pick){HITS=[];drawPick()}else if(S.chest){HITS=[];drawChest()}}
let confirmFn=null,confirmMsg='';function confirmBox(m,f){confirmMsg=m;confirmFn=f}
function drawConfirmBox(){if(!confirmFn)return;HITS=[];hit(0,0,W,H,()=>{});g.fillStyle='rgba(3,5,10,.8)';g.fillRect(0,0,W,H);panel(95,520,560,300,22,'#ff8a3d');para(confirmMsg,135,590,24,'#fff',480,36);
 button(130,710,230,80,L('아니요','取消'),'dark',24,()=>{confirmFn=null});button(390,710,230,80,L('네','确定'),'gold',24,()=>{const f=confirmFn;confirmFn=null;f()})}
// ---- 상점
const SHOP=[
 {k:'heal',n:['응급 처치','急救'],d:['체력 40% 회복','回复40%生命'],c:30,ok:()=>P.hp<P.maxHp,f:()=>{P.hp=Math.min(P.maxHp,P.hp+P.maxHp*.4*(HR('bag')?1.5:1))}},
 {k:'relic',n:['수상한 유물','可疑的遗物'],d:['유물 3개 중 1개 고르기','从3个遗物中选1个'],c:75,ok:()=>Object.keys(RELIC).length>(S.rel||[]).length,f:()=>offerRelic('shop')},
 {k:'card',n:['무기 훈련','武器训练'],d:['레벨 업 카드 1장 고르기','选择1张升级卡'],c:45,ok:()=>makeOpts().length>0,f:()=>{S.pick={opts:makeOpts(),t:0};AudioFx.cue('card')}},
 {k:'evo',n:['진화 키트','进化套件'],d:['진화할 무기가 있으면 진화','有可进化的武器就进化'],c:80,ok:()=>evolvable().length>0,f:()=>openChest()},
 {k:'ally',n:['용병 고용','雇佣兵'],d:['동료 1명 합류 (최대 2명)','1名同伴加入（最多2名）'],c:65,ok:()=>S.sv.filter(v=>v.st===1).length<2,f:()=>{S.sv.push({x:P.x,y:P.y,st:1,t:0,prog:1.2,kind:S.sv.length%2,ph:0,ang:PI/2,cd:.5})}},
 {k:'armor',n:['방탄판','防弹板'],d:['최대 체력 +25','生命上限 +25'],c:50,ok:()=>true,f:()=>{P.maxHp+=25;P.hp+=25}},
 {k:'ammo',n:['탄약 개량','弹药改良'],d:['이번 출동 동안 피해 +10%','本次出动伤害 +10%'],c:55,ok:()=>true,f:()=>{S.dmgM*=1.1}},
 {k:'ult',n:['공습 좌표','空袭坐标'],d:['다음 전투를 공습 가득 찬 채로 시작','下一场战斗空袭能量满格开始'],c:40,ok:()=>S.odG<odNeed(),f:()=>{S.odG=odNeed()}}];
function shopCost(it){return Math.round(it.c*(HR('key')?.75:1))}
function openShop(){const pool=SHOP.filter(s=>s.ok());const o=[];while(o.length<3&&pool.length)o.push(pool.splice((Math.random()*pool.length)|0,1)[0]);S.shop={o,bought:{}};sc='shop'}
function shopScreen(){const R=S.route;bgMap(R.st,.85);txt(L('떠돌이 상인','流浪商人'),375,90,40,'#ffe2a0','center');txt(L('"부품만 있으면 뭐든 구해 주지."','"只要有零件，什么都能弄到。"'),375,140,18,'#a9b6c8','center',false,700);txt(L('부품 ','零件 ')+S.scrap,375,196,30,'#ffd166','center');
 S.shop.o.forEach((it,i)=>{const y=250+i*190,got=S.shop.bought[i],can=!got&&S.scrap>=shopCost(it)&&it.ok();panel(50,y,650,170,20,can?'#ffd166':'#3a4a60');txt(LL(it.n),86,y+46,28,got?'#7f8a9a':'#fff');txt(LL(it.d),86,y+92,19,'#c8d2de','left',false,700);
  button(470,y+96,200,58,got?L('구매함','已购买'):shopCost(it)+L(' 부품',' 零件'),can?'gold':'gray',20,()=>{if(!can)return;S.scrap-=shopCost(it);S.shop.bought[i]=1;it.f();AudioFx.cue('win',.5);track('shop',{k:it.k})},!can)});
 button(50,850,300,80,L('다시 보기 · 10','刷新 · 10'),S.scrap>=10?'blue':'gray',22,()=>{if(S.scrap<10)return;S.scrap-=10;openShop()});button(400,850,300,80,L('떠나기 ▶','离开 ▶'),'green',24,()=>{S.route.cur.done=1;S.shop=null;sc='route'});
 if(S.relPick)drawRelicPick();else if(S.pick){HITS=[];drawPick()}else if(S.chest){HITS=[];drawChest()}}
// ---- 휴식
function restScreen(){const R=S.route;bgMap(R.st,.85);glow(375,420,180,'#ff8a3d',.35+.08*Math.sin(frame*.12));txt('🔥',375,420,110,'#fff','center',false);txt(L('모닥불','篝火'),375,580,40,'#fff','center');txt(L('잠깐 숨을 돌릴 수 있어요. 하나만 골라요.','可以稍作休息。只能选一个。'),375,630,19,'#a9b6c8','center',false,700);
 const fin=()=>{R.cur.done=1;sc='route'};
 button(80,700,590,110,L('쉬기 · 체력 50% 회복','休息 · 回复50%生命'),'green',26,()=>{P.hp=Math.min(P.maxHp,P.hp+P.maxHp*.5*(HR('bag')?1.5:1));AudioFx.cue('heal');fin()});
 button(80,830,590,110,L('무기 손질 · 레벨 업 카드 1장','保养武器 · 1张升级卡'),'blue',26,()=>{const o=makeOpts();if(o.length){S.pick={opts:o,t:0};AudioFx.cue('card')}fin()},!makeOpts().length)}
// ---- 사건(이야기 + 선택)
const LORE=[['무전 기록: "…3구역 격리선이 뚫렸다. 반복한다, 격리선이…" 잡음과 함께 끊긴다.','无线电记录："……3区隔离线被突破。重复，隔离线……"随着杂音中断。'],['무전 기록: "상가 지하에 물자를 숨겨 뒀어. 혹시 이걸 듣는 사람이 있다면…"','无线电记录："我把物资藏在商场地下了。如果有人听到这个……"'],['무전 기록: "공장 배출구에서 이상한 안개가 나와. 그게 시작이었어."','无线电记录："工厂排气口冒出奇怪的雾气。那就是开端。"'],['무전 기록: "실험체 6호 탈출. 연구소를 봉쇄한다." 목소리가 떨린다.','无线电记录："6号实验体逃脱。封锁研究所。"声音在颤抖。'],['무전 기록: 하나의 목소리. "제이, 거의 다 왔어요. 포기하지 마요."','无线电记录：小娜的声音。"杰伊，快到了。别放弃。"']];
const EVENTS=[
 {n:['무너진 약국','倒塌的药店'],t:['셔터가 반쯤 열린 약국. 안쪽 선반에 아직 약이 남아 있다.','卷帘门半开的药店，里面的货架上还剩些药。'],
  a:[{n:['안을 뒤진다','进去搜'],r:()=>{P.hp=Math.min(P.maxHp,P.hp+P.maxHp*.35);return L('붕대와 진통제를 찾았다. 체력 35% 회복','找到了绷带和止痛药。回复35%生命')}},{n:['약을 챙겨 판다','拿药去卖'],r:()=>{S.scrap+=40;return L('상인에게 팔 약품을 챙겼다. 부품 +40','拿了能卖给商人的药品。零件 +40')}}]},
 {n:['버려진 군용 트럭','废弃的军用卡车'],t:['짐칸이 잠긴 군용 트럭. 주변이 너무 조용하다.','货舱上锁的军用卡车。周围安静得可怕。'],
  a:[{n:['문을 부순다 (위험)','砸开门（危险）'],r:()=>{if(Math.random()<.6){const o=makeOpts();if(o.length)S.pick={opts:o,t:0};return L('무기 상자다! 레벨 업 카드 1장','是武器箱！1张升级卡')}P.hp=Math.max(1,P.hp-P.maxHp*.2);return L('매복이었다! 체력 20% 잃음','是埋伏！损失20%生命')}},{n:['조용히 지나간다','悄悄走过'],r:()=>L('아무 일도 없었다.','什么也没发生。')}]},
 {n:['낯선 생존자','陌生的幸存者'],t:['다친 남자가 손을 흔든다. "제발… 같이 가 주세요."','一个受伤的男人在挥手。"求你了……带上我。"'],
  a:[{n:['데려간다','带上他'],r:()=>{save.surv=(save.surv|0)+1;save.stats.rescued=(save.stats.rescued|0)+1;if(S.sv.filter(v=>v.st===1).length<2){S.sv.push({x:P.x,y:P.y,st:1,t:0,prog:1.2,kind:S.sv.length%2,ph:0,ang:PI/2,cd:.5});return L('동료가 되었다! 함께 싸운다','成为了同伴！并肩作战')}return L('대피소로 보냈다. 생존자 +1','送往避难所。幸存者 +1')}},{n:['물자만 나눠 준다','只分给他物资'],r:()=>{S.scrap=Math.max(0,S.scrap-15);save.surv=(save.surv|0)+1;return L('그는 대피소로 향했다. 부품 -15, 생존자 +1','他前往避难所。零件 -15，幸存者 +1')}}]},
 {n:['멈춰 선 무전기','停摆的无线电'],t:[null,null],lore:1,
  a:[{n:['끝까지 듣는다','听到最后'],r:()=>{S.odG=odNeed();return L('정신이 번쩍 든다. 다음 전투는 공습 가득 찬 채로 시작','精神一振。下一场战斗空袭满格开始')}},{n:['부품으로 뜯어 간다','拆成零件'],r:()=>{S.scrap+=30;return L('부품 +30','零件 +30')}}]},
 {n:['무기고','军械库'],t:['경찰서 무기고. 무거운 금고와 탄약 상자가 보인다.','警察局军械库。看到沉重的保险柜和弹药箱。'],
  a:[{n:['금고를 연다 (체력 -10%)','打开保险柜（生命 -10%）'],r:()=>{P.hp=Math.max(1,P.hp-P.maxHp*.1);if(evolvable().length){openChest();return L('진화 부품이다!','是进化零件！')}const o=makeOpts();if(o.length)S.pick={opts:o,t:0};return L('무기 부품이다! 카드 1장','是武器零件！1张卡')}},{n:['탄약만 챙긴다','只拿弹药'],r:()=>{S.dmgM*=1.06;return L('이번 출동 동안 피해 +6%','本次出动伤害 +6%')}}]},
 {n:['수상한 주사기','可疑的注射器'],t:['연구소 표식이 찍힌 주사기. "강화제 시제품"이라고 적혀 있다.','带有研究所标志的注射器，上面写着"强化剂试制品"。'],
  a:[{n:['맞는다','注射'],r:()=>{P.maxHp=Math.max(60,P.maxHp-15);P.hp=Math.min(P.hp,P.maxHp);S.dmgM*=1.15;return L('몸이 뜨겁다. 최대 체력 -15, 피해 +15%','身体发烫。生命上限 -15，伤害 +15%')}},{n:['버린다','扔掉'],r:()=>{S.scrap+=15;return L('찜찜하다. 용기만 팔자. 부품 +15','心里发毛，只卖容器吧。零件 +15')}}]},
 {n:['멈춘 스쿨버스','停下的校车'],t:['버스 안에서 작은 목소리들이 들린다. 아이들이 숨어 있다.','校车里传来细小的声音。孩子们躲在里面。'],
  a:[{n:['직접 구한다 (체력 -15%)','亲自营救（生命 -15%）'],r:()=>{P.hp=Math.max(1,P.hp-P.maxHp*.15);save.surv=(save.surv|0)+2;save.stats.rescued=(save.stats.rescued|0)+2;return L('아이들을 대피소로 보냈다. 생존자 +2','把孩子们送到了避难所。幸存者 +2')}},{n:['무전으로 위치를 알린다','用无线电报告位置'],r:()=>{save.surv=(save.surv|0)+1;return L('구조대가 갈 것이다. 생존자 +1','救援队会去的。幸存者 +1')}}]},
 {n:['버려진 배낭','被遗弃的背包'],t:['쓰러진 생존자 곁에 묵직한 배낭이 있다.','倒下的幸存者身边有个沉甸甸的背包。'],
  a:[{n:['배낭을 연다','打开背包'],r:()=>{offerRelic('event');return L('쓸 만한 물건이 들어 있다!','里面有好东西！')}},{n:['명복을 빌고 지나간다','默哀后离开'],r:()=>{P.hp=Math.min(P.maxHp,P.hp+P.maxHp*.15);return L('마음이 조금 가벼워졌다. 체력 15% 회복','心情轻松了些。回复15%生命')}}]},
 {n:['자판기','自动售货机'],t:['깨지지 않은 자판기. 부수면 시끄러울 것이다.','完好的自动售货机。砸开会很吵。'],
  a:[{n:['부순다','砸开'],r:()=>{S.scrap+=30;if(Math.random()<.5){P.hp=Math.max(1,P.hp-P.maxHp*.1);return L('부품 +30. 소리에 놈들이 몰려와 체력 10% 잃음','零件 +30。声音引来敌人，损失10%生命')}return L('부품 +30','零件 +30')}},{n:['그냥 간다','直接走'],r:()=>L('지금은 조용히 가는 게 낫다.','现在还是安静地走为好。')}]}];
function openEvent(){const E=EVENTS[(Math.random()*EVENTS.length)|0];S.ev={E,res:null,t:0};sc='event'}
function eventScreen(){const R=S.route,ev=S.ev,E=ev.E;ev.t+=1/60;bgMap(R.st,.8);txt('❓',375,170,70,'#b9a6ff','center',false);txt(LL(E.n),375,270,38,'#fff','center');
 const body=E.lore?LL(LORE[R.st]):LL(E.t);panel(50,320,650,260,20,'#b9a6ff');para(body,86,380,24,'#e6e9f0',580,38);
 if(!ev.res){E.a.forEach((a,i)=>button(70,620+i*130,610,110,LL(a.n),i?'dark':'blue',24,()=>{ev.res=a.r();track('event',{i})}))}
 else{panel(50,620,650,150,20,'#7fe0b0');para(ev.res,86,676,22,'#ffffff',580,34);button(200,810,350,90,L('계속 ▶','继续 ▶'),'gold',26,()=>{R.cur.done=1;S.ev=null;sc='route'})}
 if(S.relPick)drawRelicPick();else if(S.pick){HITS=[];drawPick()}else if(S.chest){HITS=[];drawChest()}}
// ================================================================ 새 무기: 화염방사기 · 지뢰 · 저격총
function newWeapons(dt,cdm){const p=P,cd=S.cd;if(!S.mines)S.mines=[];if(!S.rays)S.rays=[];
 if(lv('flame')){const L0=lv('flame'),ev=EV('flame');cd.flame=(cd.flame==null?0:cd.flame)-dt;const tg=nearest(p.x,p.y,150);S.flT=tg?.25:Math.max(0,(S.flT||0)-dt);if(tg){const ta=Math.atan2(tg.y-p.y,tg.x-p.x);let da=ta-(S.flA||0);while(da>PI)da-=TAU;while(da<-PI)da+=TAU;S.flA=(S.flA||0)+da*Math.min(1,dt*10)}
  if(tg&&cd.flame<=0){cd.flame=.14*cdm;DSRC='flame';const R=(115+10*L0)*(ev?1.3:1),wd=ev?.62:.45;near(p.x,p.y,R,(z,d)=>{let a=Math.atan2(z.y-p.y,z.x-p.x)-S.flA;while(a>PI)a-=TAU;while(a<-PI)a+=TAU;if(Math.abs(a)<wd){hurt(z,(3.2+1.3*L0)*(ev?1.5:1),z.x-p.x,z.y-p.y,20);if(ev)z.burn=Math.max(z.burn||0,1.6)}});if(Math.random()<.4)AudioFx.cue('whoosh',.25,.2)}}else S.flT=0;
 if(lv('mine')){const L0=lv('mine'),ev=EV('mine');cd.mine=(cd.mine==null?1:cd.mine)-dt;if(cd.mine<=0){cd.mine=(2.4-.2*L0)*cdm*(ev?.6:1);if(S.mines.length<3+L0+(ev?4:0)){S.mines.push({x:p.x,y:p.y+8,arm:.5,t:0});AudioFx.cue('beep',.3,.1)}}
  for(const m of S.mines){m.t+=dt;if(m.t<m.arm)continue;let hitz=false;near(m.x,m.y,18,()=>{hitz=true});if(hitz){m.dead=1;DSRC='mine';const R=(62+8*L0)*(ev?1.35:1);near(m.x,m.y,R,z=>hurt(z,(38+16*L0)*(ev?1.4:1),z.x-m.x,z.y-m.y,140));S.fx.push({k:'boom',x:m.x,y:m.y,t:0,life:.45,R,c:'#ff8a3d'});S.dec.push({k:'crack',x:m.x,y:m.y,t:0,life:4,R:R*.4,a:Math.random()*6});shake(.12);AudioFx.cue('slam',.45,.06)}}S.mines=S.mines.filter(m=>!m.dead)}
 if(lv('snipe')){const L0=lv('snipe'),ev=EV('snipe');cd.snipe=(cd.snipe==null?1:cd.snipe)-dt;if(cd.snipe<=0){let tg=null,bv=-1;near(p.x,p.y,420,(z,d)=>{const v=(z.t==='boss'?1e6:0)+(z.el?1e5:0)+z.hp;if(v>bv){bv=v;tg=z}});
  if(tg){cd.snipe=(2-.16*L0)*cdm*(ev?.7:1);const a=Math.atan2(tg.y-p.y,tg.x-p.x),x1=p.x+Math.cos(a)*520,y1=p.y+Math.sin(a)*520;DSRC='snipe';const dmg=(60+24*L0)*(ev?1.8:1);let n2=0;
   for(const z of S.zs){if(z.dead)continue;const t=((z.x-p.x)*Math.cos(a)+(z.y-p.y)*Math.sin(a));if(t<0||t>520)continue;const px=p.x+Math.cos(a)*t,py=p.y+Math.sin(a)*t;if(hyp(z.x-px,z.y-py)<z.r+6&&n2<(ev?99:2+L0)){n2++;hurt(z,dmg,Math.cos(a),Math.sin(a),160)}}
   S.rays.push({x0:p.x,y0:p.y-10,x1,y1,t:0});sfx('shot',p.x+Math.cos(a)*26,p.y-18+Math.sin(a)*26,48,.12,{f0:0,nf:3,rot:a});AudioFx.cue('shot',.7,.1);shake(.05)}else cd.snipe=.2}
  for(const r of S.rays)r.t+=dt;S.rays=S.rays.filter(r=>r.t<.18)}
 DSRC='etc'}
function drawNewGround(){if(S.mines)for(const m of S.mines){g.fillStyle='#2a2e34';g.beginPath();g.arc(m.x,m.y,7,0,TAU);g.fill();g.strokeStyle='#6a7078';g.lineWidth=2;g.stroke();if(m.t>=m.arm&&((S.t*3)|0)%2)glow(m.x,m.y,8,'#ff3a2a',.9)}}
function drawNewAir(){if(S.flT>0&&lv('flame')){const R=(115+10*lv('flame'))*(EV('flame')?1.3:1);for(let i=0;i<5;i++){const d=R*(.2+i*.18),sz=R*(.28+i*.13);fxSpr(g,'fire',Math.floor(S.t*16+i*2)%8,P.x+Math.cos(S.flA)*d,P.y-8+Math.sin(S.flA)*d-sz*.2,sz,0,.9*Math.min(1,S.flT*4))}}
 if(S.rays)for(const r of S.rays){const k=1-r.t/.18;g.strokeStyle='rgba(255,236,190,'+k+')';g.lineWidth=3*k+1;g.beginPath();g.moveTo(r.x0,r.y0);g.lineTo(r.x1,r.y1);g.stroke();g.strokeStyle='rgba(255,170,80,'+k*.5+')';g.lineWidth=8*k;g.stroke()}}
// ================================================================ 새 적: 침 뱉는 놈 · 폭탄 좀비
function bombBoom(z){if(z.boomed)return;z.boomed=1;const R=72;S.fx.push({k:'boom',x:z.x,y:z.y,t:0,life:.45,R,c:'#ff8a3d'});AudioFx.cue('slam',.5,.05);shake(.15);if(hyp(P.x-z.x,P.y-z.y)<R)hitP(20*(1+.15*S.st));const os=DSRC;DSRC='bomb';near(z.x,z.y,R,o=>{if(o!==z)hurt(o,45,o.x-z.x,o.y-z.y,120)});DSRC=os}
// ================================================================ 유물: 한 번 출동 동안 유지되는 특수 효과
const RELIC={
 band:{i:'🩹',n:['낡은 붕대','旧绷带'],d:['30마리 쓰러뜨릴 때마다 체력 +4','每击倒30个回复4生命']},
 coin:{i:'🪙',n:['행운의 동전','幸运硬币'],d:['치명타 확률 +10%','暴击率 +10%']},
 key:{i:'🗝',n:['녹슨 열쇠','生锈钥匙'],d:['상인 가격 -25%','商人价格 -25%']},
 scrap:{i:'🧲',n:['고철 자석','废铁磁铁'],d:['칸을 깰 때 부품 +50%','通过格子时零件 +50%']},
 adren:{i:'💉',n:['아드레날린','肾上腺素'],d:['체력 35% 이하면 피해 +40%','生命低于35%时伤害 +40%']},
 thorn:{i:'🦺',n:['가시 조끼','尖刺背心'],d:['맞으면 주변 적에게 큰 피해','受伤时对周围敌人造成大量伤害']},
 flare:{i:'🎆',n:['신호탄','信号弹'],d:['공습 게이지가 30% 빨리 차요','空袭能量积攒快30%']},
 cluster:{i:'💣',n:['집속탄','集束弹'],d:['공습 폭격 10발 → 16발','空袭轰炸10发 → 16发']},
 radio:{i:'📻',n:['군용 무전기','军用无线电'],d:['생존자가 더 자주 나오고 동료 피해 +50%','幸存者更常出现，同伴伤害 +50%']},
 bag:{i:'🎒',n:['침낭','睡袋'],d:['모든 회복 +50% · 칸을 깨면 체력 15% 회복','所有回复 +50% · 通过格子回复15%生命']},
 det:{i:'🧨',n:['기폭 장치','起爆器'],d:['폭발 피해 2배 (지뢰·폭탄 좀비·화염병)','爆炸伤害翻倍（地雷·爆弹僵尸·燃烧瓶）']},
 ice:{i:'🧊',n:['드라이아이스','干冰'],d:['느려진 적이 받는 피해 +30%','减速的敌人受到伤害 +30%']},
 fuel:{i:'⛽',n:['휘발유 통','汽油桶'],d:['불타는 적이 받는 피해 2배','燃烧的敌人受到伤害翻倍']},
 shoe:{i:'👟',n:['러닝화 깔창','跑鞋鞋垫'],d:['이동 속도 +15%','移动速度 +15%']},
 glass:{i:'🔪',n:['유리 대포','玻璃大炮'],d:['피해 +35% · 최대 체력 -30%','伤害 +35% · 生命上限 -30%']},
 field:{i:'🌀',n:['자기장 발생기','磁场发生器'],d:['초록 빛을 2배 멀리서 끌어와요','从2倍远处吸取绿光']},
 book:{i:'📘',n:['낡은 교본','旧教本'],d:['경험치 +25%','经验 +25%']},
 helm:{i:'⛑',n:['방탄 헬멧','防弹头盔'],d:['8초마다 공격 1번을 막아요','每8秒格挡1次攻击']},
 dice:{i:'🎲',n:['주사위','骰子'],d:['레벨 업 다시 뽑기 +2','升级重抽 +2']},
 doll:{i:'🧸',n:['저주받은 인형','诅咒人偶'],d:['놈들이 25% 더 몰려오지만 부품·경험치 +40%','敌人多25%，但零件和经验 +40%']}};
const HR=k=>!!(S&&S.rel&&S.rel.indexOf(k)>=0);
function offerRelic(src){if(!S.rel)S.rel=[];const pool=Object.keys(RELIC).filter(k=>S.rel.indexOf(k)<0);if(!pool.length)return;const o=[];while(o.length<3&&pool.length)o.push(pool.splice((Math.random()*pool.length)|0,1)[0]);S.relPick={o,t:0,src};AudioFx.cue('card')}
function takeRelic(k){if(!S.rel)S.rel=[];S.rel.push(k);S.relPick=null;track('relic',{k});AudioFx.cue('win',.6);vib('medium');
 if(k==='glass'){S.dmgM*=1.35;P.maxHp=Math.round(P.maxHp*.7);P.hp=Math.min(P.hp,P.maxHp)}if(k==='shoe')S.spdM*=1.15;if(k==='field')S.magM*=2;if(k==='book')S.xpM*=1.25;if(k==='dice')S.rerolls+=2;if(k==='doll'){S.xpM*=1.4;S.rate0=(S.rate0||S.rate)*1.25;S.rate*=1.25}}
function drawRelicPick(){const R0=S.relPick;R0.t+=1/60;HITS=[];hit(0,0,W,H,()=>{});g.fillStyle='rgba(3,5,10,.82)';g.fillRect(0,0,W,H);txt(L('유물 발견!','发现遗物！'),375,300,26,'#ffd166','center');txt(L('하나를 골라요 · 이번 출동 내내 유지','选一个 · 本次出动全程有效'),375,350,22,'#fff','center',false,700);
 R0.o.forEach((k,i)=>{const y=400+i*170,Q=RELIC[k],a=Math.min(1,R0.t*4-i*.4);if(a<=0)return;g.save();g.globalAlpha=a;panel(60,y,630,150,20,'#ffd166');txt(Q.i,130,y+75,56,'#fff','center',false);txt(LL(Q.n),200,y+52,28,'#fff');para(LL(Q.d),200,y+96,19,'#c8d2de',460,28);g.restore();hit(60,y,630,150,()=>{if(R0.t>.5)takeRelic(k)})})}
function relicBar(x,y,sz){(S.rel||[]).forEach((k,i)=>{const cx=x+i*(sz+6);rr(cx,y,sz,sz,8,'rgba(0,0,0,.45)','#8a7a50',1);txt(RELIC[k].i,cx+sz/2,y+sz/2+1,sz*.62,'#fff','center',false);hit(cx,y,sz,sz,()=>message(LL(RELIC[k].n)+' · '+LL(RELIC[k].d),2.2))})}
// ---- 보스: 구역마다 다른 공격
function bossExtra(z,dt,d,dx,dy){const st=S.endless?(((S.t/150)|0)%5):S.st,p=P;if(z.st!==0)return;
 if(st===1||st===4){z.chT=(z.chT==null?4:z.chT)-dt;if(z.ch===1){z.chW-=dt;if(z.chW<=0){z.ch=2;z.chW=.55;const l=hyp(z.cx-z.x,z.cy-z.y)||1;z.cvx=(z.cx-z.x)/l;z.cvy=(z.cy-z.y)/l;AudioFx.cue('whoosh',.7)}return 1}
  if(z.ch===2){z.chW-=dt;moveE(z,z.cvx*430*dt,z.cvy*430*dt,10);if(hyp(p.x-z.x,p.y-z.y)<z.r+14)hitP(ZT.boss.dmg*.8*(1+.15*S.st));spark(z.x,z.y,2,'#c9b39a',120,.3,3);if(z.chW<=0){z.ch=0;z.chT=st===4?7:5.5;shake(.2)}return 1}
  if(z.chT<=0&&d<360){z.ch=1;z.chW=.8;z.cx=p.x;z.cy=p.y;message(L('문지기가 돌진한다!','守门者冲过来了！'),1.1);return 1}}
 if(st===2||st===4){z.smT=(z.smT==null?5:z.smT)-dt;if(z.smT<=0){z.smT=st===4?12:8;const n=8;for(let i=0;i<n;i++){const a=i/n*TAU,x=z.x+Math.cos(a)*70,y=z.y+Math.sin(a)*70;if(!solid(x,y,12))spawn(i%3?'walk':'run',x,y)}S.fx.push({k:'wave',x:z.x,y:z.y,t:0,life:.5,R:90,c:'#9dff6a'});AudioFx.cue('scream',.6);message(L('문지기가 졸개를 부른다!','守门者召唤了手下！'),1.1)}}
 if(st===3||st===4){z.acT=(z.acT==null?3:z.acT)-dt;if(z.acT<=0){z.acT=st===4?7:5;if(!S.acid)S.acid=[];for(let i=0;i<3;i++){const a=Math.random()*TAU,r=i?rand(40,110):0;S.acid.push({x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r,t:0,life:5.5,R:44,w:.9})}AudioFx.cue('throw',.6)}}
 return 0}
function acidTick(dt){if(!S.acid)return;for(const a of S.acid){a.t+=dt;if(a.t>a.w&&hyp(P.x-a.x,P.y-a.y)<a.R)hitP(9*(1+.12*S.st))}S.acid=S.acid.filter(a=>a.t<a.life)}
function drawAcid(){if(!S.acid)return;for(const a of S.acid){const k=a.t<a.w?a.t/a.w:1,fade=Math.min(1,(a.life-a.t)*2);if(a.t<a.w){g.strokeStyle='rgba(157,255,106,.8)';g.lineWidth=2;g.beginPath();g.ellipse(a.x,a.y,a.R,a.R*.8,0,0,TAU);g.stroke()}g.fillStyle='rgba(60,120,30,'+(.45*k*fade)+')';g.beginPath();g.ellipse(a.x,a.y,a.R*k,a.R*.8*k,0,0,TAU);g.fill();glow(a.x,a.y,a.R*1.2*k,'#9dff6a',.3*k*fade)}}

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
 else if(k==='flame'){g.beginPath();g.moveTo(0,r);g.bezierCurveTo(-r*.9,r*.4,-r*.5,-r*.2,0,-r);g.bezierCurveTo(r*.1,-r*.3,r*.9,0,r*.6,r*.5);g.closePath();g.fill();g.fillStyle=OUT;g.beginPath();g.arc(0,r*.45,r*.28,0,TAU);g.fill()}
 else if(k==='mine'){g.beginPath();g.ellipse(0,r*.15,r*.85,r*.5,0,0,TAU);g.fill();g.fillRect(-r*.18,-r*.6,r*.36,r*.5);g.fillStyle=OUT;g.beginPath();g.arc(0,-r*.6,r*.14,0,TAU);g.fill()}
 else if(k==='snipe'){g.beginPath();g.arc(0,0,r*.75,0,TAU);g.stroke();g.beginPath();g.moveTo(-r,0);g.lineTo(-r*.3,0);g.moveTo(r*.3,0);g.lineTo(r,0);g.moveTo(0,-r);g.lineTo(0,-r*.3);g.moveTo(0,r*.3);g.lineTo(0,r);g.stroke();g.beginPath();g.arc(0,0,r*.12,0,TAU);g.fill()}
 else if(k==='saw'){g.rotate(-.5);g.fillRect(-r*.95,-r*.16,r*1.5,r*.2);g.fillRect(-r*.95,r*.06,r*1.5,r*.12);g.beginPath();g.moveTo(r*.5,-r*.2);g.lineTo(r*.95,-r*.1);g.lineTo(r*.95,r*.42);g.lineTo(r*.62,r*.42);g.lineTo(r*.45,r*.2);g.closePath();g.fill();g.fillRect(-r*.2,r*.14,r*.34,r*.22)}
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
function drawEnemy(z){if(z.ch===1){g.save();g.strokeStyle='rgba(255,70,50,'+(.5+.4*Math.sin(S.t*30))+')';g.lineWidth=z.r*1.4;g.setLineDash([18,12]);g.beginPath();g.moveTo(z.x,z.y);g.lineTo(z.cx,z.cy);g.stroke();g.restore()}if(z.t==='spit')glow(z.x,z.y-6,z.r*2.4,'#9dff6a',.45);if(z.t==='bomb')glow(z.x,z.y-8,z.r*(z.fz>0?3.4:2.4),'#ff7a2a',z.fz>0?.6+.4*Math.sin(S.t*40):.4+.15*Math.sin(S.t*6));if(z.el)glow(z.x,z.y,z.r*2.8,'#ffd166',.4+.15*Math.sin(S.t*6));if(z.st===1)glow(z.x,z.y,z.r*2.6,'#ff7a2a',.5+.3*Math.sin(S.t*20));if(z.burn>0&&!qualityLow)fxSpr(g,'fire',Math.floor(S.t*14+z.x)%8,z.x,z.y-z.r*1.2,z.r*3,0,.85);
 const nm=ZT[z.t].spr||z.t,M=CM[nm];const sc=(z.el===2?1.8:z.el?1.4:1)*(ZT[z.t].sc||1),H=(M?M.h:40)*sc;if(z.sa==null)z.sa=z.ang;{let da=z.ang-z.sa;while(da>PI)da-=TAU;while(da<-PI)da+=TAU;z.sa+=da*.12}
 const d=pickDir(z,z.sa),fr=Math.floor(z.ph*8/TAU),fy=z.y+H*.42;g.fillStyle='rgba(0,0,0,.42)';g.beginPath();g.ellipse(z.x,fy-2,H*.26,H*.08,0,0,TAU);g.fill();
 const fp=z.ph*8/TAU,fq=fp-Math.floor(fp);if(!drawChar(g,nm,d,fr,z.x,fy,d==='s'&&z.fx,sc)){g.fillStyle='#55605a';g.beginPath();g.arc(z.x,z.y,z.r,0,TAU);g.fill()}
 if(!qualityLow&&fq>.2)drawChar(g,nm,d,fr+1,z.x,fy,d==='s'&&z.fx,sc,(fq-.2)*.7);if(z.fl>0){g.globalCompositeOperation='lighter';drawChar(g,nm,d,fr,z.x,fy,d==='s'&&z.fx,sc,.6);g.globalCompositeOperation='source-over'}
 if(z.st===1){g.strokeStyle='rgba(255,138,61,.9)';g.lineWidth=2;g.beginPath();if(z.t==='boss')g.arc(z.x,z.y,95,0,TAU);else{g.moveTo(z.x,z.y);g.lineTo(z.tx,z.ty)}g.stroke()}
 if(z.t==='blk'||z.el){const w=z.el?46:30;g.fillStyle='rgba(0,0,0,.6)';g.fillRect(z.x-w/2,z.y-z.r-14,w,4);g.fillStyle='#ff4d5e';g.fillRect(z.x-w/2,z.y-z.r-14,w*clamp(z.hp/z.mhp,0,1),4)}}
function drawWorld(){const p=P;let cx=clamp(p.x-VW/2,0,WW-VW),cy=clamp(p.y-VH/2,0,WH-VH);if(shakeT>0){cx+=rand(-1,1)*shakeT*14;cy+=rand(-1,1)*shakeT*14}S.cam.x=cx;S.cam.y=cy;
 g.save();g.scale(ZS,ZS);g.translate(-cx,-cy);g.drawImage(lvl,Math.max(0,cx),Math.max(0,cy),VW,VH,Math.max(0,cx),Math.max(0,cy),VW,VH);
 for(const d of S.dec){const a=Math.min(1,d.life-d.t);if(d.k==='splat'){g.fillStyle='rgba(20,60,55,'+.4*a+')';for(let i=0;i<5;i++){const b=d.a+i*1.4;g.beginPath();g.ellipse(d.x+Math.cos(b)*d.R*.5,d.y+Math.sin(b)*d.R*.35,d.R*(.3+.12*(i%3)),d.R*(.2+.08*(i%2)),b,0,TAU);g.fill()}}
  else if(d.k==='crack'){const gr=g.createRadialGradient(d.x,d.y,0,d.x,d.y,d.R*1.1);gr.addColorStop(0,'rgba(8,6,5,'+.62*a+')');gr.addColorStop(.6,'rgba(14,10,8,'+.35*a+')');gr.addColorStop(1,'rgba(14,10,8,0)');g.fillStyle=gr;g.beginPath();g.ellipse(d.x,d.y,d.R*1.1,d.R*.9,d.a,0,TAU);g.fill();
   g.strokeStyle='rgba(6,6,8,'+.4*a+')';g.lineWidth=1;for(let i=0;i<5;i++){const b=d.a+i*1.26;g.beginPath();g.moveTo(d.x+Math.cos(b)*d.R*.3,d.y+Math.sin(b)*d.R*.25);g.lineTo(d.x+Math.cos(b+.15)*d.R*.75,d.y+Math.sin(b+.15)*d.R*.6);g.stroke()}}
  else{g.fillStyle='rgba(170,230,255,'+.2*a+')';g.beginPath();g.ellipse(d.x,d.y,d.R,d.R*.8,0,0,TAU);g.fill();g.strokeStyle='rgba(220,245,255,'+.5*a+')';g.lineWidth=1.5;g.stroke()}}
 for(const o of S.pools){const a=Math.min(1,(o.life-o.t)*2);g.fillStyle='rgba(10,6,4,'+.28*a+')';g.beginPath();g.ellipse(o.x,o.y,o.R*.95,o.R*.76,0,0,TAU);g.fill()}
 const inV=(x,y,m)=>x>cx-m&&x<cx+VW+m&&y>cy-m&&y<cy+VH+m;
 for(const gm of S.gems){if(!inV(gm.x,gm.y,10))continue;const r=gm.v>=10?4.5:gm.v>=4?3.4:2.4;g.fillStyle=gm.v>=10?'#ffd166':gm.v>=4?'#cfe6f2':'#8dffb9';g.beginPath();g.moveTo(gm.x,gm.y-r*1.3);g.lineTo(gm.x+r,gm.y);g.lineTo(gm.x,gm.y+r*1.3);g.lineTo(gm.x-r,gm.y);g.fill()}
 for(const k of S.pk){const dy=k.drop>0?-k.drop*180:0;if(k.drop>0){g.fillStyle='rgba(0,0,0,.4)';g.beginPath();g.ellipse(k.x,k.y,14*(1-k.drop*.6),6,0,0,TAU);g.fill()}else{g.strokeStyle='#ffd166';g.lineWidth=1.5;g.beginPath();g.arc(k.x,k.y,13+Math.sin(S.t*5)*1.5,0,TAU);g.stroke()}prop(k.k,k.x,k.y+dy,k.k==='crate'?22:18)}
 for(const t of S.tur){g.globalAlpha=Math.min(1,(t.life-t.t)*2);prop('turret',t.x,t.y,26);g.globalAlpha=1}
 drawNodeWorld();drawNewGround();drawAcid();for(const c of S.dead){if(!inV(c.x,c.y,80))continue;const M=CM[c.t];if(!M)continue;const H=M.h*c.sc,fr=Math.min(5,Math.floor(c.t2/.09)),al=c.t2>1.4?Math.max(0,.85-(c.t2-1.4)/1.8*.85):.85;drawChar(g,c.t,'d',fr,c.x,c.y+H*.42,c.flip,c.sc,al)}
 for(const o of S.pools){const a=Math.min(1,(o.life-o.t)*2)*Math.min(1,o.t*6);for(let i=0;i<3;i++){const ox=[0,-.45,.45][i]*o.R,oy=[-.05,.25,.2][i]*o.R,sz=o.R*(i?1.3:1.7);fxSpr(g,'fire',Math.floor(S.t*14+i*3+o.x)%8,o.x+ox,o.y+oy-sz*.25,sz,0,a)}}
 {const vis=[];for(const z of S.zs)if(inV(z.x,z.y,60))vis.push(z);for(const v of S.sv)vis.push(v);vis.push(p);vis.sort((a,b)=>a.y-b.y);for(const z of vis){if(z.prog!=null){drawSurv(z);continue}if(z===p){if(p.inv>0&&((S.t*20)|0)%2)g.globalAlpha=.5;drawRunner(g,p.x,p.y,p.ang,p.phase,p.mv,58);g.globalAlpha=1}else drawEnemy(z)}}
 g.lineCap='round';for(const b of S.bul){if(b.mol){const t=b.t/b.life,x=b.x0+(b.x-b.x0)*t,y=b.y0+(b.y-b.y0)*t-Math.sin(t*PI)*40;prop(b.mol===2?'battery':'firebottle',x,y,b.mol===2?13:9,t*9);continue}
  if(b.rk){g.strokeStyle='#e6edf6';g.lineWidth=3;g.beginPath();g.moveTo(b.x,b.y);g.lineTo(b.x-Math.cos(b.a)*8,b.y-Math.sin(b.a)*8);g.stroke();continue}
  g.strokeStyle=b.col||'#ffe2a8';g.lineWidth=b.big?2.6:1.5;g.beginPath();g.moveTo(b.x,b.y);g.lineTo(b.x-b.vx*(b.big?.05:.028),b.y-b.vy*(b.big?.05:.028));g.stroke()}
 for(const f of S.fx){const t=f.t/f.life;if(f.k==='gib'){g.globalAlpha=1-t;g.fillStyle=f.c;for(let i=0;i<f.n;i++){const a=f.a+i*1.3,r=(10+i%3*8)*(1-(1-t)*(1-t))*1.7;g.beginPath();g.arc(f.x+Math.cos(a)*r,f.y+Math.sin(a)*r*.8,2.4-(i%2),0,TAU);g.fill()}g.globalAlpha=1}}
 if(lv('drone'))for(let i=0;i<(EV('drone')?3:1);i++){const D=S.drs[i];if(!D.x)continue;g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(D.x,D.y+38,9,4,0,0,TAU);g.fill();g.fillStyle='#1b2230';g.beginPath();g.ellipse(D.x,D.y,9,5.5,0,0,TAU);g.fill();g.strokeStyle='#3a4454';g.lineWidth=2;g.beginPath();g.moveTo(D.x-12,D.y-3);g.lineTo(D.x+12,D.y-3);g.stroke()}
 for(const q of S.fp){if(q.k!=='s')continue;const t=q.t/q.life,sz=q.s0+(q.s1-q.s0)*t;g.globalAlpha=(q.col?.55:.42)*(1-t)*Math.min(1,t*5);g.save();g.translate(q.x,q.y);g.rotate(q.r);g.drawImage(puff(q.col||'#191512',q.v),-sz,-sz,sz*2,sz*2);g.restore()}g.globalAlpha=1;
 for(const a of S.air){const k=clamp(a.t/a.T,0,1);g.strokeStyle='rgba(255,70,50,'+(.9-.5*k)+')';g.lineWidth=2;g.beginPath();g.arc(a.x,a.y,14+60*k,0,TAU);g.stroke();g.beginPath();g.moveTo(a.x-8,a.y);g.lineTo(a.x+8,a.y);g.moveTo(a.x,a.y-8);g.lineTo(a.x,a.y+8);g.stroke()}
 drawNewAir();for(const e of S.sfx){const t=e.t/e.life;fxSpr(g,e.k,e.f0+t*e.nf,e.x,e.y,e.s*(e.gr?(.6+.6*t):1),e.rot,e.k==='dust'?.85*(1-t*.5):1)}
 // ---- 빛 더하기 ----
 g.globalCompositeOperation='lighter';
 if(!qualityLow)for(const gm of S.gems){if(!inV(gm.x,gm.y,10))continue;glow(gm.x,gm.y,gm.v>=4?9:6.5,gm.v>=10?'#ffd166':gm.v>=4?'#cfe6f2':'#9fd8a8',.22+.2*Math.sin(S.t*6+gm.x))}
 for(const k of S.pk){glow(k.x,k.y,26,'#ffd166',.35+.15*Math.sin(S.t*5));g.globalAlpha=.25;g.fillStyle='#ffd166';g.fillRect(k.x-2,k.y-60,4,60)}
 if(!qualityLow)for(const z of S.zs){if(z.slowT>0&&inV(z.x,z.y,30))glow(z.x,z.y,z.r*2,'#cfe6f2',z.frz?.7:.4)}
 for(const o of S.pools){const a=Math.min(1,(o.life-o.t)*2)*Math.min(1,o.t*6);glow(o.x,o.y,o.R*1.3,'#ff5a14',(.42+.1*Math.sin(S.t*17+o.x))*a);glow(o.x,o.y,o.R*.85,'#ffb040',.5*a)}
 for(const b of S.bul){if(b.mol)continue;if(b.rk){glow(b.x-Math.cos(b.a)*8,b.y-Math.sin(b.a)*8,9,'#ff8a3d',.9);continue}glow(b.x,b.y,b.big?9:6,b.tc?'#ffc060':'#ffb24a',.5);if(b.t<.05)glow(b.x,b.y,16,'#ffcf7a',.7)}
 if(lv('drone'))for(let i=0;i<(EV('drone')?3:1);i++){const D=S.drs[i];if(D.x){glow(D.x-9,D.y-3,6,'#ff4a3a',.9);glow(D.x+9,D.y-3,6,'#ff4a3a',.9)}}
 for(const t of S.tur)glow(t.x,t.y-4,20,'#ffd166',.18+.08*Math.sin(S.t*8));
 for(const e of S.eb){glow(e.x,e.y,14,e.ac?'#9dff6a':'#ff5a3a',.95);glow(e.x,e.y,6,'#ffffff',.95)}
 for(const b of S.bolts){const al=1-b.t/.14,P2=[b.pts[0]];for(let i=1;i<b.pts.length;i++){const o=b.pts[i-1],q=b.pts[i];P2.push([o[0]+(q[0]-o[0])*.33+rand(-9,9),o[1]+(q[1]-o[1])*.33+rand(-9,9)],[o[0]+(q[0]-o[0])*.66+rand(-9,9),o[1]+(q[1]-o[1])*.66+rand(-9,9)],q)}
  for(const [w,a2,c2] of [[10,.25,'#5f86d8'],[4.5,.7,'#ffe2a8'],[1.8,1,'#ffffff']]){g.globalAlpha=a2*al;g.strokeStyle=c2;g.lineWidth=w;g.lineJoin='round';g.beginPath();g.moveTo(P2[0][0],P2[0][1]);for(let i=1;i<P2.length;i++)g.lineTo(P2[i][0],P2[i][1]);g.stroke()}for(let i=1;i<b.pts.length;i++)glow(b.pts[i][0],b.pts[i][1],18,'#cfe6f2',.8*al)}
 for(const f of S.fx){const t=f.t/f.life;if(f.k==='pop'){glow(f.x,f.y,f.R*(.6+.6*t),f.c,(1-t)*.9);glow(f.x,f.y,f.R*.4,'#ffffff',(1-t)*.8)}
  else if(f.k==='boom'){if(!f.em){f.em=1;if(f.c==='#cfe6f2')burst(f.x,f.y,f.R*.5,1);else{sfx('boom',f.x,f.y-f.R*.2,f.R*2.8,.6);burst(f.x,f.y,f.R*.3,0)}}glow(f.x,f.y,f.R*(.5+.9*t),f.c,(1-t)*.6);glow(f.x,f.y,f.R*(.3+.3*t),'#fff3c4',(1-t)*(1-t));g.globalAlpha=(1-t)*.8;g.strokeStyle=f.c;g.lineWidth=4*(1-t)+1;g.beginPath();g.arc(f.x,f.y,f.R*(.3+.9*t),0,TAU);g.stroke()}
  else if(f.k==='wave'){if(!f.em&&(f.c==='#d9cba8'||f.c==='#ff8a3d')){f.em=1;sfx('dust',f.x,f.y,f.R*2.3,.65)}const dz=f.c==='#d9cba8'||f.c==='#ff8a3d';glow(f.x,f.y,f.R*(.3+.9*t),f.c,(1-t)*(dz?.05:.18));g.strokeStyle=f.c;for(const [o,w] of [[0,7],[.12,3]]){const tt=Math.max(0,t-o);g.globalAlpha=(1-t)*(dz?.22:.9);g.lineWidth=w*(1-t)+1;g.beginPath();g.ellipse(f.x,f.y,f.R*(.2+.8*tt),f.R*(.2+.8*tt)*.85,0,0,TAU);g.stroke()}}
  else if(f.k==='pillar'){const gr=g.createLinearGradient(0,f.y-170,0,f.y+10);gr.addColorStop(0,f.c+'00');gr.addColorStop(1,f.c+'cc');g.globalAlpha=(1-t)*.8;g.fillStyle=gr;const w=30*(1-t*.5);g.fillRect(f.x-w/2,f.y-170,w,180);glow(f.x,f.y,40,f.c,(1-t)*.8)}}
 for(const a of S.air){if(a.t<.3){const k=a.t/.3,x=a.x+k*70,y=a.y-k*420;g.globalAlpha=1;g.strokeStyle='#ffe9b0';g.lineWidth=4;g.beginPath();g.moveTo(x,y);g.lineTo(x+14,y-84);g.stroke();glow(x,y,12,'#ffb040',1)}}
 for(const q of S.fp){const t=q.t/q.life;if(q.k==='f'){const sz=q.s0+(q.s1-q.s0)*t,P3=FPAL[q.pal];g.globalAlpha=.9*(1-t)*Math.min(1,t*9);g.save();g.translate(q.x,q.y);g.rotate(q.r);g.drawImage(puff(P3[t<.22?0:t<.58?1:2],q.v),-sz,-sz,sz*2,sz*2);g.restore()}else if(q.k==='e')glow(q.x,q.y,(q.s0+(q.s1-q.s0)*t)*2.4,FPAL[q.pal][1],1-t)}g.globalAlpha=1;
 for(const q of S.pt){const t=q.t/q.life;glow(q.x,q.y,q.s*(2.2-1.2*t),q.c,1-t)}
 g.globalAlpha=1;g.globalCompositeOperation='source-over';
 g.textAlign='center';g.textBaseline='middle';for(const n of S.num){if(n.t<0)continue;const k=Math.min(1,n.t*10);g.globalAlpha=Math.max(0,1-n.t*2);font(((n.cr?19:n.big?15:10)*(1.5-.5*k))|0,900);g.lineWidth=2.5;g.strokeStyle='rgba(0,0,0,.7)';g.strokeText(n.s,n.x,n.y-n.t*26);g.fillStyle=n.col||(n.cr?'#ff7a3d':n.big?'#ffd166':'#fff');g.fillText(n.s,n.x,n.y-n.t*26)}g.globalAlpha=1;
 g.fillStyle='rgba(0,0,0,.6)';g.fillRect(p.x-18,p.y+30,36,4);g.fillStyle=p.hp/p.maxHp>.35?'#5dff9a':'#ff4d5e';g.fillRect(p.x-18,p.y+30,36*p.hp/p.maxHp,4);
 g.restore()}
function drawBattle(){drawWorld();
 if(P.hp<P.maxHp*.25){const gr=g.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,H*.8);gr.addColorStop(0,'rgba(120,0,0,0)');gr.addColorStop(1,'rgba(150,0,10,'+(.25+.15*Math.sin(frame*6))+')');g.fillStyle=gr;g.fillRect(0,0,W,H)}
 if(S.od>0){const gr=g.createRadialGradient(W/2,H/2,H*.32,W/2,H/2,H*.78);gr.addColorStop(0,'rgba(255,190,80,0)');gr.addColorStop(1,'rgba(255,170,60,'+(.22+.08*Math.sin(frame*12))+')');g.fillStyle=gr;g.fillRect(0,0,W,H)}
 if(flashT>0){g.fillStyle='rgba(255,30,40,'+flashT*(save.mild?.6:1.2)+')';g.fillRect(0,0,W,H)}
 drawHUD();
 if(joy.on){g.strokeStyle='rgba(255,255,255,.25)';g.lineWidth=3;g.beginPath();g.arc(joy.ox,joy.oy,84,0,TAU);g.stroke();g.fillStyle='rgba(255,255,255,.3)';g.beginPath();g.arc(joy.ox+joy.x*84,joy.oy+joy.y*84,32,0,TAU);g.fill()}
 if(S.tut&&S.moved<220&&!S.pick)drawFinger(375+Math.sin(frame*1.5)*120,980,L('화면을 끌어서 이동 · 공격은 자동','拖动屏幕移动 · 自动攻击'));
 const ov=S.pick||S.chest||paused;
 if(bigMsg&&!ov){bigMsg.life-=1/60;const a=Math.min(1,bigMsg.life*2,(2.2-bigMsg.life)*4);g.save();g.globalAlpha=Math.max(0,a);rr(40,430,670,150,24,'rgba(6,10,18,.78)');txt(bigMsg.t,375,482,46,bigMsg.col,'center');if(bigMsg.sub)txt(bigMsg.sub,375,540,22,'#d8e0ea','center',false,700);g.restore();if(bigMsg.life<=0)bigMsg=null}
 if(S.relPick)drawRelicPick();else if(S.pick)drawPick();else if(S.chest)drawChest();else if(paused)drawPause();
 if(confirmQuit)drawConfirm()}
const mmss=t=>((t/60)|0)+':'+String((t%60)|0).padStart(2,'0');
function drawHUD(){g.fillStyle='rgba(0,0,0,.6)';g.fillRect(0,0,W,16);const xf=clamp(S.xp/S.need,0,1),gr=g.createLinearGradient(0,0,W,0);gr.addColorStop(0,'#3ef2d0');gr.addColorStop(1,'#8dffb9');g.fillStyle=gr;g.fillRect(0,0,W*xf,16);
 txt('Lv '+S.lv,24,48,30,'#8dffb9');const left=BOSS_T-S.t;txt(mmss(S.t),375,48,42,S.bossOut&&!S.node?'#ff9a7a':'#ffffff','center');drawObj();txt('☠ '+S.kills,375,88,22,'#d8e0ea','center',true,700);
 if(!S.bossOut&&left<20&&left>0)txt(L('문지기까지 ','守门者 ')+Math.ceil(left)+L('초',' 秒'),375,122,20,'#ff9a7a','center');
 rr(676,24,54,54,12,'rgba(10,14,22,.85)','#3a4a60',2);g.fillStyle='#eef2f7';g.fillRect(693,38,7,26);g.fillRect(706,38,7,26);hit(670,18,66,66,()=>{if(!overlayOn())paused=true});
 const ws=Object.keys(S.w);let i=0;for(const k of ws){if(WP[k].p)continue;iconBox(k,40+i*58,150,50,S.w[k],EV(k));i++}i=0;for(const k of ws){if(!WP[k].p)continue;iconBox(k,32+i*44,204,38,S.w[k],false);i++}
 if(S.boss&&!S.boss.dead){const b=S.boss;panel(120,252,510,40,12,'#ff6a6a');rr(126,258,498*clamp(b.hp/b.mhp,0,1),28,8,'#d93a4a');txt(LL(ZN.boss),375,272,20,'#fff','center')}
 for(const k of S.pk)if(k.k==='crate')edgeArrow(k.x,k.y,'#ffd166');for(const v of S.sv)if(v.st===0)edgeArrow(v.x,v.y,'#7fe0b0');drawObjArrows();for(const z of S.zs)if(z.el||z.t==='boss')edgeArrow(z.x,z.y,'#ff5a4a');
 // 공습 버튼(쓰러뜨려 모은 게이지로 발동)
 {const sx=652,sy=1210,rdy=ultReady(),od=S.od>0,f=od?S.od/7:clamp(S.odG/odNeed(),0,1),pu=rdy?Math.sin(frame*9)*4:0;g.save();if(rdy){g.shadowColor='rgba(255,170,60,.95)';g.shadowBlur=30}g.beginPath();g.arc(sx,sy,66+pu,0,TAU);g.fillStyle=rdy?'#e8622e':'rgba(24,16,10,.88)';g.fill();g.restore();
  g.lineWidth=7;g.strokeStyle='rgba(255,255,255,.14)';g.beginPath();g.arc(sx,sy,66,0,TAU);g.stroke();if(f>0){g.strokeStyle=od?'#ffd166':rdy?'#fff':'#ff8a3d';g.beginPath();g.arc(sx,sy,66+pu,-PI/2,-PI/2+TAU*f);g.stroke()}
  txt(od?L('과열!','狂热！'):L('공습','空袭'),sx,sy-10,28,rdy||od?'#fff':'#c8a890','center');txt(od?Math.ceil(S.od)+L('초','秒'):rdy?L('누르세요!','点击！'):Math.floor(f*100)+'%',sx,sy+24,18,rdy||od?'#fff':'#ffb48a','center',false);
  hit(sx-74,sy-74,148,148,()=>{if(overlayOn())return;if(ultReady())useUlt();else if(S.od<=0)message(L('감염체를 쓰러뜨리면 게이지가 차요','击倒感染者积攒能量'),1.2)})}}
function drawBlade(x,y,hot){const r=11;g.save();g.translate(x,y);g.globalAlpha=.22;g.strokeStyle='#b9c0c8';g.lineWidth=5;g.beginPath();g.arc(0,0,r-2,S.t*18,S.t*18+2.2);g.stroke();g.globalAlpha=1;g.rotate(S.t*18);
 const gr=g.createRadialGradient(-3,-3,1,0,0,r);gr.addColorStop(0,'#eef1f4');gr.addColorStop(.55,'#8d96a0');gr.addColorStop(1,'#3d434b');g.fillStyle=gr;g.beginPath();for(let k=0;k<24;k++){const rr2=k%2?r:r*.82,b=k*TAU/24;g.lineTo(Math.cos(b)*rr2,Math.sin(b)*rr2)}g.closePath();g.fill();
 g.strokeStyle=hot?'#ff8a3d':'rgba(20,22,26,.8)';g.lineWidth=hot?1.6:1;g.stroke();g.fillStyle='#2a2e34';g.beginPath();g.arc(0,0,3.2,0,TAU);g.fill();g.fillStyle='#c9ced4';g.fillRect(-.8,-2.5,1.6,5);g.restore()}
function drawSurv(v){const H=CM.jay.h,nm='ally'+v.kind;if(v.st===0){glow(v.x,v.y,52,'#7fe0b0',.35+.15*Math.sin(S.t*5));g.fillStyle='rgba(0,0,0,.45)';g.beginPath();g.ellipse(v.x,v.y+H*.4,H*.24,H*.08,0,0,TAU);g.fill();drawChar(g,nm,'f',0,v.x,v.y+H*.42+Math.sin(S.t*6)*1.5,false);
  g.strokeStyle='rgba(0,0,0,.6)';g.lineWidth=6;g.beginPath();g.arc(v.x,v.y-H*.75,13,0,TAU);g.stroke();g.strokeStyle='#7fe0b0';g.lineWidth=4;g.beginPath();g.arc(v.x,v.y-H*.75,13,-PI/2,-PI/2+TAU*v.prog/1.2);g.stroke();font(18,900);g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';g.fillText(v.prog>0?'':'!',v.x,v.y-H*.75)}
 else{const save2={dr:PD.dr,fx:PD.fx,who:PD.who};Object.assign(PD,{dr:v.dr,fx:v.fx,who:nm});drawRunner(g,v.x,v.y,v.ang,v.ph,1,40);v.dr=PD.dr;v.fx=PD.fx;Object.assign(PD,save2)}}
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
function wantMusic(){if(sc==='loading')return;let k='menu';if((sc==='battle'||sc==='route'||sc==='shop'||sc==='event'||sc==='rest')&&S)k=S.boss&&!S.boss.dead?'boss':'battle';else if(sc==='result'&&S)k=S.won?'win':'menu';else if((sc==='settings'||sc==='guide'||sc==='privacy')&&guideRet==='battle')k=Music.cur||'battle';Music.play(k)}
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
 questPanel(770);
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
let story=null;
function playStory(id,then){const S0=STORY[id];if(!S0||(save.story||{})[id]){then&&then();return}save.story=save.story||{};save.story[id]=1;persist();story={id,l:S0.l,st:S0.st,t0:S0.t,i:0,t:0,then};sc='story';track('story',{id})}
function storyScreen(){const s=story;if(!s){sc='title';return}s.t+=1/60;bgMap(s.st,.45);const gr=g.createLinearGradient(0,H*.4,0,H);gr.addColorStop(0,'rgba(4,6,10,0)');gr.addColorStop(1,'rgba(4,6,10,.95)');g.fillStyle=gr;g.fillRect(0,0,W,H);
 txt(LL(s.t0),375,170,40,'#ffffff','center');g.fillStyle='#ff8a3d';g.fillRect(315,205,120,3);
 const ln=s.l[s.i],sp=SPK[ln[0]],full=LL([ln[1],ln[2]]),n=Math.min(full.length,Math.floor(s.t*38));panel(40,880,670,300,22,sp[2]);
 if(sp[0])txt(LL([sp[0],sp[1]]),76,926,24,sp[2]);if(ln[0]===1&&Math.sin(s.t*8)>0)glow(690,924,10,'#7fe0b0',.9);
 para(full.slice(0,n),76,ln[0]===2?950:980,26,ln[0]===2?'#c8d2de':'#ffffff',600,40);
 txt((s.i+1)+' / '+s.l.length,676,1150,16,'#7f8a9a','right',false);if(n>=full.length&&Math.sin(s.t*6)>-.2)txt('▼',375,1150,20,'#ffd166','center',false);
 hit(0,0,W,H,()=>{if(Math.floor(s.t*38)<full.length){s.t=99;return}s.i++;s.t=0;if(s.i>=s.l.length){story=null;sc='title';s.then&&s.then()}});
 button(560,40,170,58,L('건너뛰기 ▶','跳过 ▶'),'dark',18,()=>{story=null;sc='title';s.then&&s.then()})}
function questPanel(y){const q=questNow();if(!q){rr(60,y,630,64,16,'rgba(10,14,22,.85)','#3a4a60',2);txt(L('모든 임무 완료! 끝없는 밤 기록에 도전하세요','所有任务完成！挑战无尽长夜纪录'),375,y+32,18,'#ffd166','center',false,700);return}
 const ok=q.c();rr(60,y,630,64,16,ok?'rgba(60,40,10,.92)':'rgba(10,14,22,.88)',ok?'#ffd166':'#ff8a3d',2);txt(L('임무 ','任务 ')+((save.quest|0)+1)+'/'+QUEST.length,80,y+20,15,'#ff8a3d','left',false,800);
 txt(LL(q.n),80,y+44,20,'#fff','left',false,800);if(ok){button(540,y+8,140,48,L('받기 +','领取 +')+q.r,'gold',18,()=>{save.quest=(save.quest|0)+1;giveSup(q.r);persist();AudioFx.cue('win',.6);track('quest',{i:save.quest})});redDot(684,y+4)}
 else{txt(LL(q.h),676,y+20,13,'#8b97a8','right',false,600);txt(L('바로가기 ▶','前往 ▶'),676,y+46,17,'#ffd166','right',false,800);hit(60,y,470,64,()=>{if(q.go==='guide'){guidePage=4;guideRet='title'}sc=q.go})}}

function achScreen(){bgMap(4,.88);if(!save.ach)save.ach={};txt(L('업적','成就'),375,70,40,'#fff','center');supIcon(560,120,12);txt(save.sup,582,120,24,'#ffe2a0');
 ACH.forEach((a,i)=>{const y=150+i*102,v=Math.min(a.g,achVal(a)),done=v>=a.g,got=save.ach[i];panel(40,y,670,92,16,done&&!got?'#ff8a3d':'#3a4a60');txt(LL(a.n),64,y+30,21,got?'#7f8a9a':'#fff','left',false,700);g.fillStyle='#0b1020';g.fillRect(64,y+56,360,14);g.fillStyle=got?'#4a6a5a':'#ffd166';g.fillRect(64,y+56,360*v/a.g,14);txt(v+'/'+a.g,440,y+63,15,'#a9b6c8','left',false);
  if(got)txt(L('받음','已领取'),615,y+46,20,'#7fe0b0','center');else{button(540,y+16,150,60,'+'+a.r,done?'gold':'gray',22,()=>{if(!done)return;save.ach[i]=1;giveSup(a.r);track('ach',{i})},!done);if(done)redDot(684,y+20)}});
 button(175,1200,400,80,L('◀ 돌아가기','◀ 返回'),'gold',26,()=>{sc='title'})}
let prepSt=null;
function prep(){bgMap(prepSt==null?save.stage-1:Math.min(4,prepSt),.78);if(prepSt==null)prepSt=clamp((save.stage|0)-1,0,4);if(prepSt<5&&!stageOpen(prepSt))prepSt=0;
 txt(L('출동 준비','出动准备'),375,70,40,'#fff','center');supIcon(560,120,12);txt(save.sup,582,120,24,'#ffe2a0');
 for(let i=0;i<5;i++){const y=146+i*130,open=stageOpen(i),sel=i===prepSt,D=STAGES[i];rr(40,y,670,118,18,sel?'rgba(60,30,12,.95)':'rgba(14,20,32,.92)',sel?'#ff8a3d':'#3a4a60',sel?4:2);
  const im=imgs['map'+(i+1)];g.save();pathRect(52,y+10,170,98,12);g.clip();if(im)g.drawImage(im,0,300,724,440,52,y+10,170,98);if(!open){g.fillStyle='rgba(0,0,0,.7)';g.fillRect(52,y+10,170,98)}g.restore();
  txt((i+1)+'. '+LL(D.n),244,y+40,28,open?'#fff':'#6a7688');txt(open?LL(D.d):L('앞 구역을 탈출하면 열려요','撤离上一区后开放'),244,y+80,18,open?'#a9b6c8':'#5a6676','left',false,600);
  if(open){for(let s=0;s<3;s++)star(612+s*30,y+40,12,(save.stars[i]||0)>s);if(save.best[i])txt(L('최고 ','最佳 ')+mmss(save.best[i]),680,y+84,16,'#8b97a8','right',false)}else txt('🔒',660,y+64,30,'#fff','center',false);
  hit(40,y,670,118,()=>{if(open){prepSt=i;save.stage=i+1;persist()}else message(L('앞 구역을 먼저 탈출하세요','请先撤离上一区'),1.2)})}
 {const y=796,op=!!save.clr[5],sel=prepSt===5;rr(40,y,670,62,16,sel?'rgba(40,24,70,.95)':'rgba(14,20,32,.92)',sel?'#b9a6ff':'#3a4a60',sel?4:2);txt(L('🌙 끝없는 밤','🌙 无尽长夜'),64,y+31,24,op?'#e6deff':'#6a7688');txt(op?L('최고 ','最佳 ')+mmss(save.endBest||0)+L(' · 생존자 계속 등장',' · 幸存者持续出现'):L('방송탑을 탈출하면 열려요','撤离广播塔后开放'),686,y+31,16,op?'#b9a6ff':'#5a6676','right',false,700);hit(40,y,670,62,()=>{if(op)prepSt=5;else message(L('5구역 방송탑을 탈출하면 열려요','撤离第5区广播塔后开放'),1.4)})}
 if(prepSt===5){if(!save.clr[5])prepSt=0}
 const md=prepSt===5?1:(save.diff[prepSt]||1);if(!save.dsel)save.dsel={};let dsel=prepSt===5?1:clamp(save.dsel[prepSt]||1,1,md);
 if(md>1){panel(40,868,670,80,16);button(56,878,70,60,'◀','dark',26,()=>{save.dsel[prepSt]=Math.max(1,dsel-1);persist()});button(624,878,70,60,'▶','dark',26,()=>{save.dsel[prepSt]=Math.min(md,dsel+1);persist()});
  txt(L('난이도 ','难度 ')+dsel+' / '+md,375,896,26,'#fff','center');txt(dsel>1?L('적 체력 +','敌人生命 +')+(40*(dsel-1))+L('% · 물자 +','% · 物资 +')+(30*(dsel-1))+'%':L('기본 난이도','基础难度'),375,926,16,'#a9b6c8','center',false)}
 txt(L('시작 무기','初始武器'),56,972,22,'#ffd166');button(410,946,300,50,prepBoost?L('✓ 강화 출발 준비됨','✓ 强化出发已就绪'):L('📺 강화 출발 · Lv3 시작','📺 强化出发 · Lv3开局'),prepBoost?'green':'blue',18,()=>{if(!prepBoost)showAd('boost',()=>{prepBoost=true})});
 WEAPONS.forEach((k,i)=>{const x=80+(i%6)*118,y=1020+((i/6)|0)*70,op=weaponOpen(k),sel=save.startW===k;if(sel){g.globalCompositeOperation='lighter';glow(x,y,56,WP[k].c,.5);g.globalCompositeOperation='source-over'}
  g.save();if(!op)g.globalAlpha=.35;iconBox(k,x,y,sel?62:54,null,false);g.restore();if(!op)txt('🔒',x,y,22,'#fff','center',false);
  hit(x-34,y-34,68,68,()=>{if(op){save.startW=k;persist()}else message(LL(STAGES[UNLOCK[k]-1].n)+L('을 탈출하면 열려요',' 撤离后开放'),1.4)})});
 txt(LL(WP[save.startW].n)+' · '+LL(WP[save.startW].d(1)),375,1132,18,'#c8d2de','center',false,600);
 button(40,1170,200,96,'◀','dark',32,()=>{sc='title'});button(260,1160,450,110,L('출동!','出动！'),'gold',42,()=>{const b=prepBoost;prepBoost=false;if(prepSt===5){newEndless(b);return}const st=prepSt;playStory('b'+st,()=>startChapter(st,dsel,b))});
 tip('prep',[['구역을 고르고 시작 무기를 정한 뒤 출동해요.','选择区域和初始武器后出动。'],['구역을 탈출할 때마다 다음 구역과 새 무기가 열려요.','每撤离一个区域，就会开放下一区和新武器。']])}
function upIcon(k,x,y,s){if(k==='sup'){supIcon(x,y,s*.32);return}if(k==='revive'){prop('medkit',x,y,s*.8);return}if(k==='reroll'){g.save();g.translate(x,y);g.strokeStyle='#59c8ff';g.lineWidth=s*.1;g.beginPath();g.arc(0,0,s*.3,.3,5.6);g.stroke();g.fillStyle='#59c8ff';g.beginPath();g.moveTo(s*.32,-s*.2);g.lineTo(s*.42,s*.05);g.lineTo(s*.16,0);g.fill();g.restore();return}
 if(k==='xp'){g.fillStyle='#8dffb9';g.beginPath();g.moveTo(x,y-s*.38);g.lineTo(x+s*.28,y);g.lineTo(x,y+s*.38);g.lineTo(x-s*.28,y);g.fill();return}if(k==='hp'){g.fillStyle='#ff6a7a';g.beginPath();g.moveTo(x,y+s*.32);g.bezierCurveTo(x-s*.5,y-s*.05,x-s*.2,y-s*.45,x,y-s*.15);g.bezierCurveTo(x+s*.2,y-s*.45,x+s*.5,y-s*.05,x,y+s*.32);g.fill();return}
 icon(k,x,y,s,'#5dff9a')}
function shelter(){bgMap(1,.82);txt(L('대피소','避难所'),375,70,40,'#fff','center');supIcon(330,124,13);txt(save.sup,354,124,28,'#ffe2a0');txt(L('구한 생존자 ','救出幸存者 ')+(save.surv|0)+L('명 · 공격력 +','人 · 攻击力 +')+Math.min(30,save.surv|0)+'%',375,166,18,'#7fe0b0','center',false,700);
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
 {t:['조작','操作'],items:[['화면 끌기','拖动屏幕','손가락을 댄 자리에 조이스틱이 생겨요. 끄는 방향으로 달려요.','手指按下的地方会出现摇杆，往拖动方向奔跑。'],['공격은 자동','自动攻击','가진 무기가 모두 알아서 공격해요. 피하고, 줍고, 고르는 데만 집중하세요.','所有武器都会自动攻击。专注于闪避、拾取和选择。'],['공습','空袭','쓰러뜨릴수록 오른쪽 아래 게이지가 차요. 가득 차면 눌러서 폭격을 부르고, 7초 동안 공격도 빨라져요.','击倒敌人会积攒右下角能量。满后点击呼叫轰炸，并在7秒内加快攻速。'],['초록 빛','绿光','쓰러진 놈이 떨어뜨려요. 모으면 레벨이 올라 능력을 골라요.','击倒敌人会掉落，收集后升级并选择能力。']]},
 {t:['무기 진화','武器进化'],evo:true},
 {t:['감염체','感染者'],items:[['감염자 · 추적자','感染者 · 追踪者','가장 흔한 놈. 붉은 추적자는 빠르지만 약해요.','最常见的敌人。红色追踪者速度快但很脆弱。'],['덮치기형','扑击者','주황 선이 보이면 그 방향으로 덮쳐요. 옆으로 피하세요.','出现橙色线时会朝那个方向扑来，往侧面躲。'],['지휘형 · 거구','指挥者 · 巨躯','지휘형은 주변 놈들을 빠르게 만들고, 거구는 단단해요. 지휘형부터 쓰러뜨리세요.','指挥者让周围敌人加速，巨躯很坚硬。优先击倒指挥者。'],['정예 (금빛)','精英（金色）','35초마다 금빛으로 나타나요. 쓰러뜨리면 보급 상자를 줘요. 화살표가 위치를 알려 줘요.','每35秒以金色出现，击倒后掉落补给箱。箭头会指示位置。'],['침 뱉는 놈 · 폭탄 좀비','喷吐者 · 爆弹僵尸','초록 침은 멀리서 날아와요. 폭탄 좀비는 가까이 오면 터지니 멀리서 먼저 쏘세요. 터지면 주변 놈들도 다쳐요.','绿色酸液从远处飞来。爆弹僵尸靠近会爆炸，要先远距离击倒，爆炸也会伤到周围敌人。'],['문지기','守门者','길 끝에서 기다려요. 주황 원이 보이면 원 밖으로! 체력이 줄면 붉은 탄을 사방으로 쏴요.','在路线尽头等待。看到橙色圈就离开！血量降低后会向四周发射红色弹幕。']]},
 {t:['성장','成长'],items:[['물자','物资','출동이 끝나면 버틴 시간과 쓰러뜨린 수만큼 받아요. 져도 받아요.','出动结束后按坚持时间和击倒数获得，失败也有。'],['대피소','避难所','물자로 체력·공격력 등을 영구 강화해요.','用物资永久强化生命、攻击力等。'],['길 고르기','选择路线','구역마다 갈림길이 있어요. 버티기·정예·발전기·연료·구출 칸은 목표가 다르고, 상인·모닥불·사건 칸에선 부품을 쓰거나 선택을 해요.','每个区域都有岔路。坚守、精英、发电机、燃料、营救格目标不同；在商人、篝火、事件格可以花零件或做选择。'],['구역 · 무기','区域 · 武器','구역을 탈출하면 다음 구역과 새 시작 무기가 열려요.','撤离区域后开放下一区和新的初始武器。'],['난이도 · 별','难度 · 星','탈출하면 더 높은 난이도가 열려요. 부활 없이, 체력 절반 이상으로 탈출하면 별 3개.','撤离后开放更高难度。不复活且生命过半撤离可得3星。']]}];
function guideScreen(){bgMap(3,.88);const P0=GUIDE[guidePage];txt(L('안내서','指南')+' '+(guidePage+1)+'/'+GUIDE.length,375,60,22,'#a9b6c8','center',false);txt(LL(P0.t),375,110,42,'#fff','center');
 if(P0.flow){const steps=[[L('출동','出动'),L('구역과 시작 무기 선택','选择区域和初始武器')],[L('끌어서 이동 · 자동 공격','拖动移动 · 自动攻击'),L('초록 빛을 모아 레벨 업','收集绿光升级')],[L('능력 고르기 · 진화','选择能力 · 进化'),L('보급 상자에서 무기 진화','在补给箱中进化武器')],[L('길 고르기 · 마지막 문지기','选择路线 · 最终守门者'),L('전투·상인·사건 칸을 지나 탈출!','经过战斗、商人、事件格后撤离！')],[L('물자로 대피소 강화','用物资强化避难所'),L('더 강해져서 다시 출동','变得更强再次出动')]];
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
 if(S.endless){txt(S.newBest?L('새 기록!','新纪录！'):L('밤이 삼켰다','被长夜吞噬'),375,190,56,S.newBest?'#ffd166':'#b9a6ff','center');txt(L('끝없는 밤 · 최고 ','无尽长夜 · 最佳 ')+mmss(save.endBest||0),375,252,22,'#c8d2de','center',false,700)}else{txt(won?L('탈출 성공!','撤离成功！'):S.quit?L('철수했다','已撤退'):L('쓰러졌다','倒下了'),375,190,56,won?'#ffe2c4':'#ff9a7a','center');txt(LL(STAGES[S.st].n)+(S.diff>1?' · '+L('난이도 ','难度 ')+S.diff:''),375,252,22,'#c8d2de','center',false,700)}
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
 const tutDone=S.tut,cs=won&&S.first?'c'+S.st:null,en=S.endless;const after=f=>{if(tutDone)playStory('pro',f);else if(cs)playStory(cs,f);else f()};
 button(140,y,230,84,L('대피소로','回避难所'),'green',24,()=>{S=null;after(()=>{sc=tutDone?'shelter':'title'})});button(380,y,230,84,L('다시 출동','再次出动'),'gold',26,()=>{const st=S.st,d=S.diff,b=false;S=null;after(()=>{if(en)newEndless(b);else startChapter(st,d,false)})})}

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
 let gx=0,gy=0,gd=1e9;for(const k of S.pk){const d=hyp(k.x-P.x,k.y-P.y)*.5;if(d<gd){gd=d;gx=k.x-P.x;gy=k.y-P.y}}for(const gm of S.gems){const d=hyp(gm.x-P.x,gm.y-P.y);if(d<gd){gd=d;gx=gm.x-P.x;gy=gm.y-P.y}}const obj=[];if(S.cans)for(const c of S.cans)obj.push(c);for(const v of S.sv||[])if(v.st===0)obj.push(v);if(S.gen&&hyp(S.gen.x-P.x,S.gen.y-P.y)>90)obj.push(S.gen);for(const o of obj){const d=hyp(o.x-P.x,o.y-P.y)*.3;if(d<gd){gd=d;gx=o.x-P.x;gy=o.y-P.y}}
 const gl=hyp(gx,gy)||1,al=hyp(ax,ay)||1;let x=(th?ax/al*1.2:0)+gx/gl*(th>3?.4:1)+Math.cos(S.t*.5)*.15,y=(th?ay/al*1.2:0)+gy/gl*(th>3?.4:1)+Math.sin(S.t*.5)*.15;
 let bx=0,by=0;for(let a=0;a<TAU;a+=TAU/12){let o=0;for(let r=30;r<=150;r+=30)if(!solid(P.x+Math.cos(a)*r,P.y+Math.sin(a)*r,10))o++;else break;bx+=Math.cos(a)*o;by+=Math.sin(a)*o}const bl=hyp(bx,by)||1;x+=bx/bl*.7;y+=by/bl*.7;const l=hyp(x,y)||1;joy.x=x/l;joy.y=y/l}

// ================================================================ 성능·그리기 루프
let perfAcc=0,perfFrames=0,perfBad=0;
function perf(dt){if(qualityManual||sc!=='battle'||paused)return;perfAcc+=dt;perfFrames++;if(perfAcc>=2){const fps=perfFrames/perfAcc;perfAcc=0;perfFrames=0;if(fps<45){perfBad++;if(perfBad>=2&&!qualityLow){qualityLow=true;persist();message(L('저사양 모드 자동 적용','已自动切换省电模式'),1.2);track('lowq',{fps:Math.round(fps)})}}else perfBad=0}}
function draw(dt){if(API){g.setTransform(1,0,0,1,0,0);g.fillStyle='#05070c';g.fillRect(0,0,c.width,c.height);g.setTransform(view.s,0,0,view.s,view.ox,view.oy)}else g.setTransform(1,0,0,1,0,0);
 g.save();g.beginPath();g.rect(0,0,W,H);g.clip();try{drawInner(dt)}finally{g.restore()}}
function drawInner(dt){g.clearRect(0,0,W,H);frame+=Math.min(dt,.05);HITS=[];
 if(sc==='loading')loadingScreen();else if(sc==='title')title();else if(sc==='prep')prep();else if(sc==='shelter')shelter();else if(sc==='reward')rewardScreen();else if(sc==='ach')achScreen();else if(sc==='story')storyScreen();else if(sc==='route')routeScreen();else if(sc==='shop')shopScreen();else if(sc==='event')eventScreen();else if(sc==='rest')restScreen();else if(sc==='guide')guideScreen();else if(sc==='settings')settingsScreen();else if(sc==='privacy')privacyScreen();
 else if(sc==='battle'&&S){if(autoBot)botTick();tick(Math.min(dt,.05));if(sc==='battle')drawBattle();else if(sc==='result')resultScreen()}else if(sc==='result'&&S)resultScreen();else sc='title';
 drawConfirmBox();if(guideTip)drawGuideTip();if(adShow)drawAd();drawBanner();wantMusic()}
let drawErr=0;
if(QS.indexOf('debug=1')>=0){globalThis.__bepaDebug={STAGES,WP,UPG,ZT,save,persist,newRun,finishRun,revive,tap,pDown,pMove,pUp,showAd,mission,levelUp,applyPick,openChest,takeChest,killZ,spawn,spawnRing,drawBattle,tick,
 get S(){return S},get P(){return P},get sc(){return sc},set sc(v){sc=v},set bot(v){autoBot=v},set freeze(v){dbgFreeze=v},get guideTip(){return guideTip},set guideTip(v){guideTip=v},set guidePage(v){guidePage=v},set paused(v){paused=v},get paused(){return paused},set lang(v){LANG=v},get lang(){return LANG},get hits(){return HITS},get drawErr(){return drawErr},set confirmQuit(v){confirmQuit=v},set patrolPop(v){patrolPop=v},spawnElite,startOD,useUlt,offerRelic,takeRelic,startChapter,enterNode,genRoute,nodeReachable,openShop,openEvent,spawnSurvivor,newEndless,playStory,get story(){return story},set quality(v){qualityLow=v},
 step(n,dt=1/60){stepping=true;for(let i=0;i<n;i++){guideTip=null;if(adShow){const f=adShow.cb;adShow=null;f()}if(autoBot)botTick();if(sc!=='battle'||!S)break;tick(dt)}stepping=false},
 drawOnce(){draw(0)},get state(){return S?{sc,st:S.st,t:+S.t.toFixed(1),hp:Math.round(P.hp),maxHp:P.maxHp,lv:S.lv,kills:S.kills,zs:S.zs.length,w:Object.assign({},S.w),evo:Object.keys(S.evo),won:!!S.won,over:S.over,pick:!!S.pick,chest:!!S.chest,boss:S.boss?Math.round(S.boss.hp):null,reward:S.reward,sup:save.sup}:{sc,sup:save.sup}}}}
function loop(now){let dt=last?(now-last)/1000:0;last=now;perf(Math.min(dt,.25));try{draw(Math.min(dt,.1))}catch(e){drawErr++;try{g.restore();g.restore();g.restore()}catch(e2){}if(drawErr<5&&typeof console!=='undefined')console.error('draw error',e);if(drawErr===1)track('draw_error',{m:String(e&&e.message||e).slice(0,80),sc})}
 if(API){if(typeof requestAnimationFrame==='function')requestAnimationFrame(loop);else if(c.requestAnimationFrame)c.requestAnimationFrame(loop)}else requestAnimationFrame(loop)}
if(API){if(typeof requestAnimationFrame==='function')requestAnimationFrame(loop);else if(c.requestAnimationFrame)c.requestAnimationFrame(loop)}else requestAnimationFrame(loop);
})();
