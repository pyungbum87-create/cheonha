/* LAST LANTERN — 라스트 랜턴 · 最后的灯塔 (BEPA)
 * 세로형 로그라이트 디펜스 · 빛줄기 조작 · 20웨이브 · 끝없는 밤 · 오늘의 밤 · 마을 복원
 * Canvas2D · 외부 CDN 없음 · 강제 광고 없음 · 한국어 / 简体中文
 * 모듈 구조는 DEAD RUSH V12(cheonha/deadrush/game.js)의 검증된 코드를 옮겨 씀
 */
(()=>{'use strict';
// ================================================================ 플랫폼 계층
const W=750,H=1334,TAU=Math.PI*2,PI=Math.PI;
const PLATFORM=typeof wx!=='undefined'?'wx':typeof tt!=='undefined'?'tt':'web';
const API=PLATFORM==='wx'?wx:PLATFORM==='tt'?tt:null;
const c=API?API.createCanvas():document.getElementById('game');
let g=c.getContext('2d');
const info=API?(API.getSystemInfoSync?API.getSystemInfoSync():{windowWidth:375,windowHeight:667,pixelRatio:1}):null;
let dpr=1,view={s:1,ox:0,oy:0};
if(API){dpr=Math.min(2,info.pixelRatio||1);c.width=Math.max(1,Math.round((info.windowWidth||375)*dpr));c.height=Math.max(1,Math.round((info.windowHeight||667)*dpr));
 const s=Math.min(c.width/W,c.height/H);view={s,ox:(c.width-W*s)/2,oy:(c.height-H*s)/2};}
else{c.width=W;c.height=H;}
function mkCanvas(w,h){const cv=API?API.createCanvas():document.createElement('canvas');cv.width=w;cv.height=h;return cv}
const BUILD='1116-2259';
// 안전장치: 반지름 음수·NaN이면 그리기 전체가 멈추는 문제 방지
(function(){const P=Object.getPrototypeOf(g);if(!P||P.__safe)return;P.__safe=true;const oa=P.arc,oe=P.ellipse;
 if(oa)P.arc=function(x,y,r,a0,a1,ccw){return oa.call(this,x,y,r>0&&isFinite(r)?r:0,a0,a1,ccw)};
 if(oe)P.ellipse=function(x,y,rx,ry,rot,a0,a1,ccw){return oe.call(this,x,y,rx>0&&isFinite(rx)?rx:0,ry>0&&isFinite(ry)?ry:0,rot,a0,a1,ccw)}})();

// ================================================================ 그림 불러오기
const UNIT_IDS=['harpooner','lampmage','netcaster','bellringer','saltpriest','windscout','gulltamer','blacksmith'];
const ENEMY_IDS=['crawler','wingshade','shellcrab','fogwraith','splitblob','lampthief','shadekeeper'];
const BOSS_IDS=['deep_one','moon_eater'];
const IMG_LIST=['bg_sky','bg_pier','lighthouse','relic_prism'].concat(UNIT_IDS.map(n=>'unit_'+n),ENEMY_IDS.map(n=>'enemy_'+n),BOSS_IDS.map(n=>'boss_'+n));
const MUST=['bg_sky','bg_pier','lighthouse','unit_harpooner','enemy_crawler'];
const imgs={},imgFail={},darkImg={},warmImg={};
function tintOf(im,col,a){const cv=mkCanvas(im.width,im.height),x=cv.getContext('2d');x.drawImage(im,0,0);x.globalCompositeOperation='source-atop';x.globalAlpha=a;x.fillStyle=col;x.fillRect(0,0,im.width,im.height);return cv}
function loadImg(name,tries=0){const im=API?(API.createImage?API.createImage():c.createImage()):new Image();
 im.onload=()=>{imgs[name]=im;if(name.indexOf('enemy_')===0||name.indexOf('boss_')===0){try{darkImg[name]=tintOf(im,'#0b1124',.42);warmImg[name]=tintOf(im,'#ffcf7a',.16)}catch(e){}}};
 im.onerror=()=>{if(tries<8)setTimeout(()=>loadImg(name,tries+1),600+tries*900);else imgFail[name]=1};
 im.src='res/'+name+(name==='bg_sky'?'.jpg':'.png')+(API?'':'?v='+BUILD+(tries?'r'+tries:''))}
IMG_LIST.forEach(n=>loadImg(n));
// 부드러운 빛 스프라이트 (한 번만 만들어 재사용)
const GLOW_COL={a:[255,190,90],w:[255,240,210],c:[150,250,235],p:[190,120,255],r:[255,90,60],y:[255,220,120]};
const glow={};
function makeSprites(){for(const k in GLOW_COL){const cv=mkCanvas(64,64),x=cv.getContext('2d'),[r,gg,b]=GLOW_COL[k],gr=x.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,`rgba(${r},${gg},${b},1)`);gr.addColorStop(.3,`rgba(${r},${gg},${b},.6)`);gr.addColorStop(.7,`rgba(${r},${gg},${b},.15)`);gr.addColorStop(1,`rgba(${r},${gg},${b},0)`);x.fillStyle=gr;x.fillRect(0,0,64,64);glow[k]=cv}}
try{makeSprites()}catch(e){}
const darkCv=mkCanvas(W,1112),dg=darkCv.getContext('2d');

// ================================================================ 음악·효과음 (DEAD RUSH Music/AudioFx 이식)
const SFX=['beam','hit','ting','place','merge','card','bell','boom','hurt','ui','warn','win','wave'];
const SFX_EXT={bell:'mp3',boom:'mp3',warn:'mp3',win:'mp3',wave:'mp3'},sfxFile=k=>'res/sfx_'+k+'.'+(SFX_EXT[k]||'wav');
const Music={el:null,cur:'',on:true,vol:.5,src:null,gain:null,bufs:{},nat:null,
 play(key){if(this.cur===key)return;this.cur=key;if(!this.on||this.hidden)return;this._start(key)},
 _start(key){const loop=key!=='win'&&key!=='lose';
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
 init(){if(!this.enabled||this.ctx||API)return;try{const A=typeof AudioContext!=='undefined'?AudioContext:typeof webkitAudioContext!=='undefined'?webkitAudioContext:null;if(A){this.ctx=new A();this.master=this.ctx.createGain();this.master.gain.value=.8;this.master.connect(this.ctx.destination);this.load()}}catch(e){}},
 load(){if(typeof fetch!=='function'||typeof location==='undefined'||location.protocol==='file:')return;for(const k of SFX){fetch(sfxFile(k)+'?v='+BUILD).then(r=>r.arrayBuffer()).then(b=>this.ctx.decodeAudioData(b,d=>{this.buf[k]=d},()=>{})).catch(()=>{})}},
 beep(freq=440,duration=.07,kind='square',vol=.025,fall=0){if(!this.ctx)return;try{const t=this.ctx.currentTime,o=this.ctx.createOscillator(),v=this.ctx.createGain();o.type=kind;o.frequency.setValueAtTime(freq,t);if(fall)o.frequency.exponentialRampToValueAtTime(Math.max(40,freq*fall),t+duration);v.gain.setValueAtTime(vol,t);v.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(v);v.connect(this.master);o.start(t);o.stop(t+duration+.01)}catch(e){}},
 cue(key,vol=1,gap=.05,rate=1){if(!this.enabled)return;const now=Date.now()/1000;if(this.last[key]&&now-this.last[key]<gap)return;this.last[key]=now;
  if(API&&typeof API.createInnerAudioContext==='function'){try{let pool=this.native[key];if(!pool){pool={i:0,a:[0,1].map(()=>{const a=API.createInnerAudioContext();a.autoplay=false;a.src=sfxFile(key);return a})};this.native[key]=pool}const a=pool.a[pool.i++%2];a.volume=Math.min(1,vol);a.stop();a.play()}catch(e){}return}
  if(!this.ctx)return;const b=this.buf[key];
  if(b){try{const s=this.ctx.createBufferSource(),v=this.ctx.createGain();s.buffer=b;s.playbackRate.value=rate*(.95+Math.random()*.1);v.gain.value=vol;s.connect(v);v.connect(this.master);s.start()}catch(e){}return}
  switch(key){case 'hit':this.beep(900,.05,'triangle',.015,.5);break;case 'ting':this.beep(1568*rate,.15,'sine',.02,1);break;case 'boom':this.beep(90,.3,'sawtooth',.05,.3);break;case 'bell':this.beep(392,.6,'sine',.04,1);break;case 'hurt':this.beep(140,.17,'square',.03,.4);break;case 'warn':this.beep(660,.3,'triangle',.03,1);break;case 'win':this.beep(620,.3,'triangle',.035,1.4);break;default:this.beep(520,.06,'sine',.02,1.1)}}};

// ================================================================ 언어 (DEAD RUSH LANG 이식)
let LANG='ko';
try{if(API){const sl=((API.getSystemInfoSync&&API.getSystemInfoSync().language)||'').toLowerCase();LANG=sl.indexOf('ko')===0?'ko':'zh'}
 else{const langs=(typeof navigator!=='undefined'?(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||'']):[]).map(x=>(x||'').toLowerCase());
  let tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){}
  const zhTZ=/^Asia\/(Shanghai|Chongqing|Chungking|Harbin|Urumqi|Kashgar|Hong_Kong|Macau|Taipei)$/.test(tz)||tz==='PRC';
  if(langs[0]&&langs[0].indexOf('zh')===0)LANG='zh';else if(zhTZ&&!(langs[0]&&langs[0].indexOf('ko')===0))LANG='zh'}}catch(e){}
let LANG_FORCED=null;try{if(!API&&typeof location!=='undefined'){const m=location.search.match(/[?&]lang=(ko|zh)/);if(m)LANG_FORCED=m[1]}}catch(e){}
const L=(ko,zh)=>LANG==='zh'?zh:ko;
const LL=p=>Array.isArray(p)?(LANG==='zh'?p[1]:p[0]):(p||'');

// ================================================================ 저장
const SAVE_KEY='bepa_lantern_v1';
const save={v:1,shards:0,bld:[0,0,0,0,0,0],best:0,bestEndless:0,clears:0,depth:0,maxDepth:0,firstDone:false,tips:{},daily:null,att:{last:'',streak:0},chestDay:'',chestN:0,dailyDay:'',
 seen:{u:{},e:{},r:{}},mast:{},stats:{kills:0,runs:0,merges:0,bosses:0},lang:null,music:true,sfx:true,shake:true,vib:true,mild:null,qualityLow:false,qualityManual:false,statc:{}};
try{let raw=null;if(API&&API.getStorageSync)raw=API.getStorageSync(SAVE_KEY);else if(typeof localStorage!=='undefined')raw=localStorage.getItem(SAVE_KEY);
 if(raw){const o=JSON.parse(raw);for(const k in o)if(o[k]!==undefined&&o[k]!==null)save[k]=o[k];}}catch(e){}
for(const k of['u','e','r'])if(!save.seen[k])save.seen[k]={};if(!save.mast||typeof save.mast!=='object')save.mast={};
if(!Array.isArray(save.bld)||save.bld.length<6)save.bld=[0,0,0,0,0,0].map((v,i)=>(save.bld&&save.bld[i])||0);
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
 if(!save.statc)save.statc={};save.statc[ev]=(save.statc[ev]||0)+1}catch(e){}}
let vibT=0;function vib(kind){if(save.vib===false)return;const now=Date.now();if(kind==='light'&&now-vibT<250)return;vibT=now;try{if(API&&API.vibrateShort)API.vibrateShort({type:kind==='heavy'?'heavy':kind==='medium'?'medium':'light'});else if(API&&API.vibrateLong&&kind==='long')API.vibrateLong();else if(typeof navigator!=='undefined'&&navigator.vibrate)navigator.vibrate(kind==='heavy'?60:kind==='medium'?35:kind==='long'?200:15)}catch(e){}}
const AD_UNIT={wx:'adunit-xxxxxxxxxxxxxxxx',tt:'xxxxxxxxxxxxxxxxxx'};// ← 플랫폼 광고 단위 ID로 교체
let adShow=null,adObj=null,adCb=null;
function showAd(place,cb0){if(adShow)return;track('ad_open',{place});const cb=()=>{track('ad_reward',{place});cb0()};
 if(API&&API.createRewardedVideoAd&&AD_UNIT[PLATFORM]&&AD_UNIT[PLATFORM].indexOf('xxxx')<0){try{if(!adObj){adObj=API.createRewardedVideoAd({adUnitId:AD_UNIT[PLATFORM]});adObj.onClose(r=>{const ok=!r||r.isEnded!==false;const f=adCb;adCb=null;Music.kick();if(ok&&f)f();else message(L('끝까지 시청해야 보상을 받습니다','需完整观看才能获得奖励'),1.4)});adObj.onError(()=>{adCb=null;message(L('광고를 불러오지 못했습니다','广告加载失败'),1.2)})}
  adCb=cb;adObj.show().catch(()=>adObj.load().then(()=>adObj.show()).catch(()=>{adCb=null;message(L('광고를 불러오지 못했습니다','广告加载失败'),1.2)}))}catch(e){cb()}return}
 adShow={t:0,cb,place}}// 테스트 환경: 2초 가짜 광고
function shareGame(){track('share',{});const title=L('밤이 내려온다. 등대 불빛으로 새벽까지 버텨라! 나의 최고 기록 ','黑夜降临，用灯塔之光守到黎明！我的最高纪录 ')+save.best+L('웨이브',' 波');
 if(API&&API.shareAppMessage){try{API.shareAppMessage({title,imageUrl:'res/share.jpg'})}catch(e){}}else message(L('공유는 위챗·더우인에서 동작합니다','分享功能在微信/抖音中可用'),1.4)}
function onAppHide(){if(sc==='battle'&&run&&!run.over&&!run.pick)paused=true;Music.stop();Music.hidden=true;persist();track('app_hide',{sc})}
function onAppShow(){Music.hidden=false;const k=Music.cur;Music.cur='';if(Music.on)Music.play(k||'menu');else Music.cur=k;last=0}
if(API){try{API.onHide&&API.onHide(onAppHide);API.onShow&&API.onShow(onAppShow)}catch(e){}}
else if(typeof document!=='undefined'){document.addEventListener('visibilitychange',()=>{if(document.hidden)onAppHide();else onAppShow()})}
if(API&&API.getUpdateManager){try{const um=API.getUpdateManager();um.onUpdateReady(()=>{API.showModal?API.showModal({title:L('새 버전','新版本'),content:L('새 버전이 준비됐습니다. 다시 시작할까요?','新版本已准备好，是否重启？'),success:r=>{if(r.confirm)um.applyUpdate()}}):um.applyUpdate()})}catch(e){}}
if(API){try{API.showShareMenu&&API.showShareMenu({withShareTicket:true});API.onShareAppMessage&&API.onShareAppMessage(()=>({title:L('라스트 랜턴 — 등대 불빛으로 새벽까지 버텨라','最后的灯塔——用灯光守到黎明'),imageUrl:'res/share.jpg'}))}catch(e){}}

// ================================================================ 난수 (같은 씨앗 = 같은 판)
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let R=mulberry(Date.now()&0xffffff);
const rnd=(a,b)=>a+R()*(b-a),pickR=a=>a[Math.floor(R()*a.length)];
const rand=(a,b)=>a+Math.random()*(b-a),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function hashStr(s){let h=2166136261;for(const ch of s){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}

// ================================================================ 게임 데이터
const TAGS={tide:{n:['조수','潮汐'],col:'#5fc4d0'},flame:{n:['불꽃','火焰'],col:'#ff8a3a'},bell:{n:['종','钟'],col:'#e8c46a'},wind:{n:['바람','风'],col:'#b8f3e8'}};
const SYN={tide:[['2: 모든 공격이 적을 15% 느리게','2：所有攻击减速15%'],['4: 조수 공격력 +25%','4：潮汐攻击+25%']],flame:[['2: 화상 피해 +50%','2：灼烧伤害+50%'],['4: 불탄 적이 쓰러질 때 폭발','4：灼烧敌人死亡时爆炸']],bell:[['2: 기절 +0.5초','2：眩晕+0.5秒'],['4: 저주 표식 효과 +20%','4：诅咒效果+20%']],wind:[['2: 바람 공격 속도 +20%','2：风系攻速+20%'],['4: 빛 회전 속도 +50%','4：光束转速+50%']]};
const UNITS={
 harpooner:{tag:'tide',n:['작살잡이','鱼叉手'],cd:1.05,dmg:30,range:950,d:['가장 앞의 적에게 작살을 던져요','向最前方的敌人投掷鱼叉'],lit:['빛줄기 방향으로 모든 적을 꿰뚫어요','沿光束方向贯穿所有敌人']},
 lampmage:{tag:'flame',n:['등잔 술사','灯盏术士'],cd:1.4,dmg:18,range:760,d:['불덩이로 주변까지 태워요','火球灼烧周围敌人'],lit:['빛줄기 안의 적 모두에게 불이 번져요','光束内的敌人全部着火']},
 netcaster:{tag:'tide',n:['그물꾼','撒网手'],cd:1.5,dmg:12,range:700,d:['그물로 적을 느리게 해요','用渔网减速敌人'],lit:['그물이 넓게 펼쳐져 여럿을 묶어요','渔网张开，束缚多个敌人']},
 bellringer:{tag:'bell',n:['종지기','敲钟人'],cd:7,dmg:22,range:430,d:['7초마다 주변 적을 기절시켜요','每7秒眩晕附近敌人'],lit:['빛줄기 안의 적까지 모두 기절','光束内的敌人也全部眩晕']},
 saltpriest:{tag:'bell',n:['소금 사제','盐祭司'],cd:1.0,dmg:14,range:820,d:['껍질을 벗기고 숨은 적을 드러내요','剥除外壳、让隐藏的敌人现形'],lit:['빛 안의 적에게 저주 표식 (받는 피해 +35%)','给光束内敌人打上诅咒（受到伤害+35%）']},
 windscout:{tag:'wind',n:['바람 정찰병','风之斥候'],cd:.75,dmg:20,range:1000,d:['날아다니는 적을 먼저 노려요','优先攻击飞行敌人'],lit:['안개를 걷어내고 사거리가 늘어요','驱散迷雾，射程提升']},
 gulltamer:{tag:'wind',n:['갈매기 조련사','海鸥驯养员'],cd:.95,dmg:14,range:900,d:['갈매기 두 마리가 적을 쫓아가요','两只海鸥追击敌人'],lit:['갈매기가 빛줄기 끝으로 돌격해요','海鸥冲向光束尽头']},
 blacksmith:{tag:'flame',n:['대장장이','铁匠'],cd:1.6,dmg:10,range:600,d:['양옆·위아래 수호자 공격력 +25%','上下左右的守护者攻击+25%'],lit:['대각선까지 강화 범위가 넓어져요','强化范围扩大到对角']}};
const ENEMIES={
 crawler:{hp:30,spd:44,dmg:5,r:34,sp:1,n:['기어오는 것','爬行者'],d:['평범한 그림자. 떼로 몰려와요','普通的影子，成群而来']},
 wingshade:{hp:22,spd:86,dmg:3,r:36,sp:1,fly:1,n:['날개 그림자','影翼'],d:['빠르게 날아와요. 빛에 닿으면 잠깐 멈춰요','飞得很快，被光照到会短暂停住']},
 shellcrab:{hp:72,spd:25,dmg:8,r:42,sp:3,shell:1,n:['껍질게','壳蟹'],d:['단단해요. 빛을 2초 비추면 껍질이 열려요','很坚硬，照射2秒后外壳打开']},
 fogwraith:{hp:26,spd:40,dmg:4,r:30,sp:2,ghost:1,n:['안개 망령','雾灵'],d:['빛 안에서만 보이고 맞아요','只有在光中才能看见和击中']},
 splitblob:{hp:46,spd:32,dmg:5,r:40,sp:2,split:1,n:['분열 덩어리','分裂团'],d:['빛 밖에서 쓰러지면 둘로 나뉘어요','在光外倒下会分裂成两个']},
 lampthief:{hp:34,spd:60,dmg:3,r:34,sp:2,thief:1,n:['등불 도둑','偷灯贼'],d:['빛줄기에 닿아 있으면 빛이 좁아져요','接触光束时会让光变窄']},
 shadekeeper:{hp:84,spd:30,dmg:9,r:40,sp:4,keeper:1,n:['등대지기 그림자','守灯人之影'],d:['빛을 비추면 오히려 빨라져요!','被光照到反而会加速！']},
 deep_one:{hp:2400,spd:9,dmg:30,r:120,sp:60,boss:1,n:['깊은 것','深渊之物'],d:['촉수로 수호자를 내리쳐요. 본체에 빛을 비추면 막을 수 있어요','用触手砸击守护者，用光照射本体可以阻止']},
 moon_eater:{hp:4800,spd:8,dmg:40,r:130,sp:100,boss:1,n:['달을 삼킨 것','吞月者'],d:['주기적으로 월식을 일으켜 빛을 꺼요','周期性引发月食，熄灭光束']},
 mini:{hp:14,spd:52,dmg:2,r:24,sp:0,img:'enemy_splitblob',n:['작은 덩어리','小团块'],d:['','']}};
const RELICS=[
 {k:'prism',n:['프리즘','棱镜'],d:['빛줄기가 두 갈래로 나뉘어요 (각각 폭 절반)','光束分成两道（各自宽度减半）'],s:0,col:'#a9c4cf'},
 {k:'lens',n:['깨진 렌즈','破碎透镜'],d:['빛 폭 2배, 등대 내구도 -30%','光束宽度×2，灯塔耐久-30%'],s:1,col:'#cfe3ea'},
 {k:'log',n:['등대지기의 일지','守灯人日志'],d:['손패 카드 +1장, 카드 값 +20%','手牌+1张，卡牌价格+20%'],s:2,col:'#d9b77a'},
 {k:'invert',n:['거꾸로 된 등','倒置的灯'],d:['빛이 없는 적이 느려지고, 빛 안의 적은 그대로','光外的敌人减速，光内不减速'],s:3,col:'#7a6ab0'},
 {k:'tide',n:['조수 부적','潮汐护符'],d:['조수 수호자 공격력 +30%','潮汐守护者攻击+30%'],s:0,col:'#5fc4d0'},
 {k:'ember',n:['불씨 항아리','火种罐'],d:['불꽃 수호자 공격력 +30%','火焰守护者攻击+30%'],s:4,col:'#ff8a3a'},
 {k:'clapper',n:['청동 추','青铜钟锤'],d:['종 수호자 재사용 시간 -25%','钟系守护者冷却-25%'],s:5,col:'#e8c46a'},
 {k:'kite',n:['연줄','风筝线'],d:['바람 수호자 공격 속도 +25%','风系守护者攻速+25%'],s:3,col:'#b8f3e8'},
 {k:'oil',n:['등잔 기름','灯油'],d:['빛을 받은 수호자 강화 +40%','受光守护者的强化+40%'],s:4,col:'#f2a541'},
 {k:'wick',n:['긴 심지','长灯芯'],d:['빛 길이·회전 속도 +30%','光束长度和转速+30%'],s:2,col:'#ffe8c2'},
 {k:'salt',n:['소금 통','盐桶'],d:['모든 공격 10% 확률로 저주 표식','所有攻击10%概率附加诅咒'],s:1,col:'#e7f1fb'},
 {k:'drift',n:['유목 방벽','浮木壁垒'],d:['등대 최대 내구도 +40%, 즉시 모두 회복','灯塔最大耐久+40%，立即回满'],s:5,col:'#a07850'},
 {k:'feather',n:['갈매기 깃털','海鸥羽毛'],d:['나는 적에게 주는 피해 +40%','对飞行敌人伤害+40%'],s:3,col:'#ffffff'},
 {k:'shell',n:['행운 조개','幸运贝壳'],d:['적을 쓰러뜨릴 때 불씨 +1','击败敌人时火种+1'],s:0,col:'#ffb0a0'},
 {k:'map',n:['낡은 해도','旧海图'],d:['강화 선택지가 4개로 늘어요','强化选项增加到4个'],s:2,col:'#d9c08a'},
 {k:'sand',n:['별 모래','星砂'],d:['합칠 때 20% 확률로 별이 2개 올라요','合成时20%概率升2星'],s:4,col:'#fff3a0'},
 {k:'watch',n:['밤 당번','夜班'],d:['뒷줄 수호자 공격력 +25%','后排守护者攻击+25%'],s:1,col:'#3e6b73'},
 {k:'glass',n:['폭풍 유리','风暴玻璃'],d:['위기 예고가 길어지고 폭풍에도 적이 빨라지지 않아요','危机预警更长，风暴不再加速敌人'],s:2,col:'#9fc4ff'},
 {k:'pearl',n:['달 진주','月之珍珠'],d:['월식 시간이 절반으로 줄어요','月食时间减半'],s:3,col:'#f3f0ff'},
 {k:'horn',n:['안개 나팔','雾号'],d:['안개 효과 절반, 안개 망령이 늘 희미하게 보여요','迷雾效果减半，雾灵始终隐约可见'],s:5,col:'#c0d0d8'},
 {k:'heart',n:['불씨 심장','火种之心'],d:['등대 내구도 30% 이하일 때 모든 공격력 +50%','灯塔耐久低于30%时全体攻击+50%'],s:4,col:'#e4572e'},
 {k:'clock',n:['물때 시계','潮汐钟'],d:['3웨이브마다 등대 내구도 20% 회복','每3波恢复灯塔20%耐久'],s:0,col:'#5fa0b0'},
 {k:'hook',n:['뼈 갈고리','骨钩'],d:['작살이 항상 3명을 꿰뚫어요','鱼叉总是贯穿3个敌人'],s:1,col:'#e8e0d0'},
 {k:'seed',n:['새벽 씨앗','黎明种子'],d:['보스를 쓰러뜨리면 불씨 +100, 내구도 25% 회복','击败首领后火种+100，恢复25%耐久'],s:5,col:'#ffcf7a'}];
const RELIC_BY={};RELICS.forEach(r=>RELIC_BY[r.k]=r);
const BLD=[
 {k:'oil',n:['기름 창고','油料仓库'],cost:[30,90,200],e:lv=>L('시작 불씨 +','初始火种 +')+lv*20},
 {k:'wall',n:['방파제','防波堤'],cost:[40,110,240],e:lv=>L('등대 내구도 +','灯塔耐久 +')+lv*20+'%'},
 {k:'forge',n:['대장간','铁匠铺'],cost:[50,140,300],e:lv=>L('모든 수호자 공격력 +','全体攻击 +')+lv*15+'%'},
 {k:'lens',n:['렌즈 공방','透镜工坊'],cost:[50,140,300],e:lv=>L('빛 폭 +','光束宽度 +')+lv*12+'%'},
 {k:'crew',n:['선원 숙소','水手宿舍'],cost:[35,100,220],e:lv=>lv===0?L('새 수호자 없음','暂无新守护者'):L('새 수호자 ','新守护者 ')+[0,1,3,4][lv]+L('명 합류','名加入')},
 {k:'tower',n:['전망대','瞭望台'],cost:[60,160,320],e:lv=>L('강화 다시 뽑기 +','强化重抽 +')+lv+L('회 · 위기 예고 +','次 · 危机预警 +')+lv+L('초','秒')}];
const BASE_UNITS=['harpooner','lampmage','netcaster','bellringer'];
function mastLv(id){return save.mast[id]||0}
function mastCost(id){return 40+mastLv(id)*30}
function unlockedUnits(){const lv=save.bld[4],u=BASE_UNITS.slice();if(lv>=1)u.push('saltpriest');if(lv>=2)u.push('windscout','gulltamer');if(lv>=3)u.push('blacksmith');return u}
const MISSIONS=[{k:'kill',goal:150,n:['적 150마리 쓰러뜨리기','击败150个敌人'],r:25},{k:'wave',goal:15,n:['웨이브 15번 버티기','坚守15波'],r:20},{k:'merge',goal:5,n:['수호자 5번 합치기','合成守护者5次'],r:20},{k:'boss',goal:1,n:['보스 1마리 쓰러뜨리기','击败1个首领'],r:30},{k:'run',goal:2,n:['출정 2번 하기','出征2次'],r:15},{k:'relic',goal:3,n:['유물 3개 얻기','获得3个遗物'],r:20},{k:'place',goal:12,n:['수호자 12명 배치하기','部署12名守护者'],r:15}];
const ATT=[20,30,40,50,60,80,150];
function dailyInit(){const t=todayKey();if(save.daily&&save.daily.day===t)return;let h=hashStr(t);const pool=MISSIONS.map((m,i)=>i),pick=[];while(pick.length<3){h=(Math.imul(h,1103515245)+12345)>>>0;const i=pool.splice(h%pool.length,1)[0];pick.push(i)}save.daily={day:t,m:pick.map(i=>({i,p:0,c:false}))};persist()}
function mission(k,n=1){if(!save.daily||save.daily.day!==todayKey())dailyInit();for(const m of save.daily.m){const M=MISSIONS[m.i];if(M.k===k&&!m.c&&m.p<M.goal){m.p=Math.min(M.goal,m.p+n);if(m.p>=M.goal)message(L('일일 미션 완료! ','每日任务完成！')+LL(M.n),1.6)}}}
function attCan(){return save.att.last!==todayKey()}
function chestLeft(){return save.chestDay===todayKey()?Math.max(0,3-save.chestN):3}
function rewardBadge(){if(!save.daily||save.daily.day!==todayKey())dailyInit();if(attCan())return true;if(save.daily.m.some(m=>!m.c&&m.p>=MISSIONS[m.i].goal))return true;return chestLeft()>0}
function giveShards(n,why){save.shards+=n;persist();AudioFx.cue('win',.6);message(L('등불 조각 +','灯火碎片 +')+n+(why?' · '+why:''),1.4)}

// ================================================================ 레이아웃
const LAMP={x:375,y:948},WALL=735,PANEL_Y=1112;
const SLOTS=[{x:95,y:888},{x:235,y:888},{x:375,y:868},{x:515,y:888},{x:655,y:888},{x:95,y:1004},{x:235,y:1012},{x:515,y:1012},{x:655,y:1004}];
const BACK_ROW=[5,6,7,8],MIRROR_SLOTS=[2,6,7];
const BAL={g:1.18,dh:.13,bh:1.3,dm:2,n0:6,n1:1.4,win:11};
const CRISIS={8:'fog',12:'fog',17:'fog',10:'eclipse',16:'eclipse',11:'storm',18:'storm'};

// ================================================================ 그리기 도구
const OUT='#0E1424';
function pathRect(x,y,w,h,r=12){r=Math.max(0,Math.min(r,w/2,h/2));g.beginPath();g.moveTo(x+r,y);g.lineTo(x+w-r,y);g.quadraticCurveTo(x+w,y,x+w,y+r);g.lineTo(x+w,y+h-r);g.quadraticCurveTo(x+w,y+h,x+w-r,y+h);g.lineTo(x+r,y+h);g.quadraticCurveTo(x,y+h,x,y+h-r);g.lineTo(x,y+r);g.quadraticCurveTo(x,y,x+r,y);g.closePath()}
function rr(x,y,w,h,r,fill,stroke,lw=2){pathRect(x,y,w,h,r);if(fill){g.fillStyle=fill;g.fill()}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke()}}
function panel(x,y,w,h,r=16){rr(x,y,w,h,r,'rgba(28,43,69,.94)','#F2A541',2)}
function font(n,w=800){g.font=`${w} ${n}px system-ui,-apple-system,"PingFang SC","Noto Sans KR",sans-serif`}
function txt(s,x,y,n=24,color='#FFE8C2',align='left',stroke=true,w=800){s=String(s);font(n,w);g.textAlign=align;g.textBaseline='middle';if(stroke){g.lineWidth=Math.max(3,n*.2);g.strokeStyle=OUT;g.lineJoin='round';g.strokeText(s,x,y)}g.fillStyle=color;g.fillText(s,x,y)}
function wrap(s,n,maxW){font(n,600);const out=[];for(const raw of String(s).split('\n')){let cur='';const words=LANG==='zh'?raw.split(''):raw.split(/(\s+)/);for(const wd of words){if(g.measureText(cur+wd).width>maxW&&cur.trim()){out.push(cur.trimEnd());cur=wd.trimStart()}else cur+=wd}out.push(cur)}return out}
function para(s,x,y,n,color,maxW,lh,align='left'){const ls=wrap(s,n,maxW);ls.forEach((l,i)=>txt(l,x,y+i*lh,n,color,align,false,600));return ls.length}
function drawGlow(x,y,r,k,a=1){const s=glow[k];if(!s||r<=0)return;g.globalAlpha=a;g.drawImage(s,x-r,y-r,r*2,r*2);g.globalAlpha=1}
function img(name,x,y,w,h,alpha=1){const im=imgs[name];if(!im)return false;if(alpha!==1)g.globalAlpha=alpha;g.drawImage(im,x,y,w,h);g.globalAlpha=1;return true}
let HITS=[];function hit(x,y,w,h,fn){HITS.push({x,y,w,h,fn})}
const BTN={gold:['#7a4a26','#F2A541','#FFE8C2'],blue:['#1C2B45','#A9C4CF','#e7f1fb'],green:['#1f4a3a','#7fe0b0','#eafff4'],gray:['#1a2234','#4a5a74','#c0ccdc'],red:['#5a2226','#ff8a7a','#fff0f0'],dark:['#111827','#3E6B73','#A9C4CF']};
function button(x,y,w,h,label,style,size,fn,dis){const C=BTN[style||'gold'];g.save();if(dis)g.globalAlpha=.45;rr(x,y+4,w,h,h*.3,'rgba(0,0,0,.35)');rr(x,y,w,h,h*.3,C[0],C[1],3);g.fillStyle='rgba(255,255,255,.07)';pathRect(x+4,y+4,w-8,h*.45,h*.25);g.fill();txt(label,x+w/2,y+h/2+1,size||Math.min(28,h*.38),C[2],'center',true);g.restore();if(fn&&!dis)hit(x,y,w,h,fn)}
function redDot(x,y){g.fillStyle='#ff4a3a';g.beginPath();g.arc(x,y,10,0,TAU);g.fill();g.strokeStyle=OUT;g.lineWidth=2;g.stroke()}
function shard(x,y,r){g.save();g.translate(x,y);g.beginPath();g.moveTo(0,-r);g.lineTo(r*.62,0);g.lineTo(0,r);g.lineTo(-r*.62,0);g.closePath();g.fillStyle='#F2A541';g.fill();g.strokeStyle=OUT;g.lineWidth=Math.max(1.5,r*.18);g.stroke();g.fillStyle='#FFE8C2';g.beginPath();g.moveTo(0,-r*.6);g.lineTo(r*.25,0);g.lineTo(0,r*.1);g.closePath();g.fill();g.restore()}
function spark(x,y,r){drawGlow(x,y,r*1.8,'a',.8);g.fillStyle='#FFE8C2';g.beginPath();g.arc(x,y,r*.45,0,TAU);g.fill()}
function relicIcon(k,x,y,s){const R0=RELIC_BY[k];if(!R0)return;if(k==='prism'&&imgs.relic_prism){g.drawImage(imgs.relic_prism,x-s/2,y-s/2,s,s);return}
 g.save();g.translate(x,y);const r=s*.42;g.beginPath();g.arc(0,0,r,0,TAU);g.fillStyle='#7a5a2e';g.fill();g.lineWidth=Math.max(2,s*.06);g.strokeStyle=OUT;g.stroke();g.beginPath();g.arc(0,0,r*.8,0,TAU);g.fillStyle='#1C2B45';g.fill();g.fillStyle=R0.col;g.strokeStyle=OUT;g.lineWidth=Math.max(1.5,s*.04);g.beginPath();const q=r*.5;
 switch(R0.s){case 0:g.moveTo(0,-q);g.lineTo(q,q*.8);g.lineTo(-q,q*.8);g.closePath();break;case 1:g.moveTo(0,-q);g.lineTo(q,0);g.lineTo(0,q);g.lineTo(-q,0);g.closePath();break;case 2:g.rect(-q*.8,-q,q*1.6,q*2);break;case 3:g.arc(0,0,q,PI*.25,PI*1.75);g.arc(q*.45,0,q*.7,PI*1.6,PI*.4,true);g.closePath();break;case 4:for(let i=0;i<10;i++){const a=-PI/2+i*PI/5,rr2=i%2?q*.45:q;g.lineTo(Math.cos(a)*rr2,Math.sin(a)*rr2)}g.closePath();break;default:g.arc(0,0,q*.8,0,TAU)}
 g.fill();g.stroke();g.restore()}
function unitImg(id,x,y,s,alpha=1){return img('unit_'+id,x-s/2,y-s/2,s,s,alpha)}
function stars(n,x,y,s=11){for(let i=0;i<n;i++){const cx=x+(i-(n-1)/2)*s*1.6;g.save();g.translate(cx,y);g.beginPath();for(let k=0;k<10;k++){const a=-PI/2+k*PI/5,r2=k%2?s*.45:s;g.lineTo(Math.cos(a)*r2,Math.sin(a)*r2)}g.closePath();g.fillStyle='#ffd25a';g.fill();g.strokeStyle=OUT;g.lineWidth=2;g.stroke();g.restore()}}
function drawFinger(x,y,label){const b=Math.sin(frame*7)*10;g.save();g.translate(x,y+b);g.globalAlpha=.95;g.beginPath();g.arc(0,-6,28+Math.sin(frame*7)*5,0,TAU);g.strokeStyle='rgba(255,232,194,.8)';g.lineWidth=4;g.stroke();
 g.fillStyle='#FFE8C2';g.strokeStyle=OUT;g.lineWidth=3;pathRect(-11,-4,22,48,10);g.fill();g.stroke();g.beginPath();g.arc(0,-2,11,PI,0);g.fill();g.stroke();g.restore();if(label){const w=Math.min(520,label.length*(LANG==='zh'?24:16)+60);rr(x-w/2,y+62,w,48,14,'rgba(14,20,36,.92)','#F2A541',2);txt(label,x,y+87,21,'#FFE8C2','center',false)}}

// ================================================================ 상태
let frame=0,last=0,sc='loading',paused=false,speed=1,shakeT=0,flashT=0,flashCol='255,255,255';
let run=null,ens=[],projs=[],fx=[],floaters=[],rings=[];
let banner='',bannerT=0,bannerSc='',bigMsg=null;
let guideTip=null,guidePage=0,guideRet='title',codexTab=0,resetArm=0,unitInfo=-1,confirmQuit=false,autoBot=false,dbgFreeze=false;
let ptr=null,tut=null;
function message(t,d=2){banner=t;bannerT=d;bannerSc=sc}
function announce(t,sub,col){bigMsg={t,sub:sub||'',col:col||'#FFE8C2',life:2.4}}
function floater(x,y,s,col,size=22){if(floaters.length>40)floaters.shift();floaters.push({x,y,s,col,size,life:.9})}
function addFx(o){if(fx.length>(qualityLow?120:320))return;fx.push(o)}
function burst(x,y,col,n,sp=220){for(let i=0;i<(qualityLow?Math.ceil(n/2):n);i++){const a=rand(0,TAU),v=rand(sp*.3,sp);addFx({t:'p',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rand(.25,.6),max:.6,col,r:rand(2,5)})}}
function shake(n){if(save.shake!==false)shakeT=Math.max(shakeT,n)}

// ================================================================ 판 시작
function relic(k){return run&&run.relics.indexOf(k)>=0}
function bLv(k){return save.bld[BLD.findIndex(b=>b.k===k)]||0}
function newRun(mode){
 const depth=mode==='camp'?save.depth:0;let seed=Date.now()&0xffffff;if(mode==='daily')seed=hashStr('daily'+todayKey());R=mulberry(seed);
 const maxHP=Math.round(100*(1+.2*bLv('wall')));
 run={mode,depth,seed,wave:0,waves:mode==='tut'?6:mode==='endless'?9999:20,hp:maxHP,maxHP,sparks:30+20*bLv('oil')+(mode==='tut'?0:0),units:SLOTS.map(()=>null),hand:[],buys:0,upg:{},
  beam:{a:-PI/2,ta:-PI/2,w:.218,len:1000,rot:PI,litB:.6,mirror:false},relics:[],kills:0,bosses:0,phase:0,crisis:null,eclipseT:0,breakT:2.2,spawnQ:[],spawnT:0,spawnI:1,
  pick:null,pact:null,revived:false,doubled:false,over:false,win:false,dawnT:-1,rerolls:bLv('tower'),pickReroll:false,time:0,thiefOn:false,boss:null,merges:0,placed:0,hitStop:0,shards:0,dailyFirst:false,tentacle:null,litBoss:0};
 if(mode==='daily'){run.dailyFirst=save.dailyDay!==todayKey();const rk=RELICS[Math.floor(R()*RELICS.length)].k;run.relics.push(rk);applyRelic(rk,true)}
 ens=[];projs=[];fx=[];floaters=[];rings=[];paused=false;speed=1;unitInfo=-1;confirmQuit=false;
 const hs=relic('log')?4:3;for(let i=0;i<hs;i++)run.hand.push(drawCard());
 if(mode==='tut'){run.units[2]={id:'harpooner',star:1,cd:.5,inv:10,stun:0};run.sparks=20;tut={step:0,t:0,moved:0}}else tut=null;
 sc='battle';save.stats.runs++;mission('run');track('run_start',{mode,depth});persist();
 if(mode!=='tut')tip('battle',[['화면을 끌면 등대 빛줄기가 손가락 쪽으로 돌아가요. 빛이 닿은 적은 느려지고, 빛이 닿은 수호자는 더 빨리 싸워요.','拖动屏幕，灯塔光束会转向手指方向。被照到的敌人会减速，被照到的守护者攻击更快。'],['아래 카드를 누르면 수호자가 빈자리에 서요. 같은 수호자 위에 끌어다 놓으면 별이 올라요.','点击下方卡牌，守护者会站到空位。拖到相同守护者上可以升星。'],['3웨이브마다 강화를 하나 고를 수 있어요.','每3波可以选择一个强化。']])}
function drawCard(){const d=unlockedUnits();return d[Math.floor(R()*d.length)]}
function cardCost(){return Math.round((10+3*run.buys)*(relic('log')?1.2:1))}
function phaseOf(w){return w<=6?0:w<=14?1:w<=20?2:3}
const PHASE=[['황혼','黄昏'],['한밤','深夜'],['새벽 직전','黎明前'],['끝없는 밤','无尽之夜']];

// ================================================================ 웨이브
function startWave(){if(run.wave>=run.waves)return;
 const w=++run.wave;(run.wlog=run.wlog||[]).push([w,Math.round(run.time),Math.round(run.hp)]);run.phase=phaseOf(w);run.spawnQ=[];run.boss=null;run.waveT=0;
 const camp=run.mode!=='tut';let n=Math.round(BAL.n0+w*BAL.n1);if(run.mode==='tut')n=Math.round(4+w*1.2);
 const pool=[['crawler',10]];
 if(w>=3)pool.push(['fogwraith',w===3?6:3]);if(w>=4)pool.push(['wingshade',4]);if(w>=6&&camp)pool.push(['shellcrab',3]);if(w>=7&&camp)pool.push(['splitblob',3]);
 if(w>=10&&camp)pool.push(['lampthief',2]);if(w>=12&&camp)pool.push(['shadekeeper',2]);
 const tot=pool.reduce((a,p)=>a+p[1],0);for(let i=0;i<n;i++){let x=R()*tot;for(const p of pool){x-=p[1];if(x<=0){run.spawnQ.push(p[0]);break}}}
 if(w===3&&run.spawnQ.indexOf('fogwraith')<0)run.spawnQ[1]='fogwraith';
 let boss=null;if(camp&&run.mode!=='endless'){if(w===14)boss='deep_one';if(w===20)boss='moon_eater'}
 if(run.mode==='endless'&&w>20&&w%10===0)boss=(w/10)%2?'deep_one':'moon_eater';
 if(run.mode==='endless'&&w===14)boss='deep_one';if(run.mode==='endless'&&w===20)boss='moon_eater';
 if(boss){run.spawnQ.splice(Math.floor(run.spawnQ.length*.25),0,'BOSS:'+boss);run.spawnQ=run.spawnQ.slice(0,Math.max(6,Math.round(n*.6)))}
 run.spawnI=clamp(BAL.win/run.spawnQ.length,.35,1.4);run.spawnT=.6;
 let cr=camp?CRISIS[w]:null;if(run.mode==='endless'&&w>20&&R()<.35)cr=pickR(['fog','eclipse','storm']);if(run.mode==='daily'&&w>4&&!cr&&R()<.12)cr=pickR(['fog','storm']);
 run.crisis=cr?{type:cr,warn:5+(relic('glass')?3:0)+bLv('tower'),on:false,t:0}:null;
 if(cr){AudioFx.cue('warn');announce(L('웨이브 ','第')+w+(LANG==='zh'?'波':''),crisisName(cr)+L(' 다가온다',' 即将来临'),'#ff9a7a');tip('crisis_'+cr,[crisisTip(cr)])}
 else announce(L('웨이브 ','第')+w+(LANG==='zh'?'波':''),LL(PHASE[run.phase]),'#FFE8C2');
 if(boss)tip('boss_'+boss,[[ENEMIES[boss].n[0]+' 등장! '+ENEMIES[boss].d[0],ENEMIES[boss].n[1]+'出现！'+ENEMIES[boss].d[1]]]);
 AudioFx.cue('wave',.7);track('wave_start',{w,mode:run.mode})}
function crisisName(k){return {fog:L('안개','迷雾'),eclipse:L('월식','月食'),storm:L('폭풍','风暴')}[k]}
function crisisTip(k){return {fog:['안개: 빛줄기가 짧아져요. 바람 정찰병에게 빛을 비추면 안개가 걷혀요.','迷雾：光束变短。照亮风之斥候可以驱散迷雾。'],eclipse:['월식: 10초 동안 빛이 꺼져요. 빛 없이도 강한 종·불꽃 수호자로 버티세요.','月食：光束熄灭10秒。依靠无需光照也很强的钟、火焰守护者坚持。'],storm:['폭풍: 적이 흔들리며 더 빨리 내려와요. 넓게 맞히는 공격이 좋아요.','风暴：敌人摇晃着更快逼近。范围攻击更有效。']}[k]}
function spawnEnemy(type,x,y,o){const D=ENEMIES[type];const hpMul=type in{deep_one:1,moon_eater:1}?BAL.bh*(1+BAL.dh*run.depth)*(run.mode==='endless'&&run.wave>20?Math.pow(1.6,(run.wave-20)/10):1):Math.pow(BAL.g,run.wave-1)*(1+BAL.dh*run.depth)*(run.pact&&run.pact.left>0?1.35:1)*(run.mode==='tut'?.75:1);
 const e={type,x,y,hp:D.hp*hpMul,max:D.hp*hpMul,spd:D.spd*(1+.03*run.depth),r:D.r,dmg:D.dmg*BAL.dm,lit:false,litT:0,shell:!!D.shell,revealT:0,slowT:0,slowA:0,stunT:0,stopT:0,stopCd:0,burnT:0,burnD:0,curseT:0,hitT:0,ph:rand(0,TAU),bornX:x,boss:!!D.boss,atkT:0,dead:false};
 if(o)Object.assign(e,o);ens.push(e);if(!save.seen.e[type]&&type!=='mini'){save.seen.e[type]=1}return e}
function spawnNext(){const t=run.spawnQ.shift();if(!t)return;if(t.indexOf('BOSS:')===0){const k=t.slice(5);const b=spawnEnemy(k,375,-140);run.boss=b;b.atkT=k==='deep_one'?6:12;AudioFx.cue('boom');shake(.6);vib('heavy');announce(LL(ENEMIES[k].n),L('보스 등장','首领出现'),'#ff7a6a');return}
 spawnEnemy(t,rnd(70,680),-50)}

// ================================================================ 빛
function beamDirs(){const b=run.beam;if(relic('prism'))return[b.a-.3,b.a+.3];return[b.a]}
function beamOn(){return run.eclipseT<=0&&!(run.crisis&&run.crisis.type==='eclipse'&&run.crisis.on)}
function windLit(){for(let i=0;i<9;i++){const u=run.units[i];if(u&&u.id==='windscout'&&u.lit)return true}return false}
function beamW(){let w=run.beam.w*(1+.12*bLv('lens'));if(relic('lens'))w*=2;if(relic('prism'))w*=.5;if(run.thiefOn)w*=.6;return w}
function beamLen(){let l=run.beam.len*(relic('wick')?1.3:1);if(run.crisis&&run.crisis.type==='fog'&&run.crisis.on&&!windLit())l*=relic('horn')?.8:.6;return l}
function angDiff(a,b){let d=a-b;while(d>PI)d-=TAU;while(d<-PI)d+=TAU;return Math.abs(d)}
function isLit(x,y,r){if(!beamOn())return false;const dx=x-LAMP.x,dy=y-LAMP.y,d=Math.hypot(dx,dy),len=beamLen();if(d>len+r)return false;const a=Math.atan2(dy,dx),w=beamW(),pad=Math.atan2(r,Math.max(d,1));for(const b of beamDirs())if(angDiff(a,b)<w+pad)return true;return false}
function aimBeam(x,y){let a=Math.atan2(y-LAMP.y,x-LAMP.x);if(a>0)a=a>PI/2?-PI:0;run.beam.ta=clamp(a,-PI,0)}

// ================================================================ 수호자
function synCount(){const s={tide:0,flame:0,bell:0,wind:0};for(const u of run.units)if(u)s[UNITS[u.id].tag]++;return s}
function neighbors(i,wide){const a=SLOTS[i],out=[];for(let j=0;j<9;j++){if(j===i)continue;const b=SLOTS[j],d=Math.hypot(a.x-b.x,a.y-b.y);if(d<=(wide?215:150))out.push(j)}return out}
function smithBuff(i){let b=0;for(let j=0;j<9;j++){const u=run.units[j];if(u&&u.id==='blacksmith'&&!u.stun&&neighbors(j,u.lit).indexOf(i)>=0)b+=.25*u.star}return b}
function unitDmg(i){const u=run.units[i],D=UNITS[u.id],syn=synCount();let m=[1,2.3,5][u.star-1]*(1+.35*(run.upg[u.id]||0))*(1+.15*bLv('forge'))*(1+.08*mastLv(u.id))*(1+smithBuff(i));
 if(D.tag==='tide'&&syn.tide>=4)m*=1.25;if(D.tag==='tide'&&relic('tide'))m*=1.3;if(D.tag==='flame'&&relic('ember'))m*=1.3;if(relic('watch')&&BACK_ROW.indexOf(i)>=0)m*=1.25;if(relic('heart')&&run.hp<run.maxHP*.3)m*=1.5;return D.dmg*m}
function unitRate(i){const u=run.units[i],D=UNITS[u.id],syn=synCount();let r=1;if(u.lit)r*=1+run.beam.litB*(relic('oil')?1.4:1);if(D.tag==='wind'&&syn.wind>=2)r*=1.2;if(D.tag==='wind'&&relic('kite'))r*=1.25;if(D.tag==='bell'&&relic('clapper'))r*=1.33;return r}
function unitPos(i){return{x:SLOTS[i].x,y:SLOTS[i].y-58}}
function visible(e){return !EN(e).ghost||e.lit||e.revealT>0}
function EN(e){return ENEMIES[e.type]}
function pickTarget(i,range,pref){const p=unitPos(i);let best=null,bs=-1e9;for(const e of ens){if(e.dead||e.y<-30||!visible(e))continue;const d=Math.hypot(e.x-p.x,e.y-p.y);if(d>range)continue;let s=e.y;if(pref==='fly'&&EN(e).fly)s+=600;if(e.boss)s+=80;if(s>bs){bs=s;best=e}}return best}
function updateUnits(dt){const syn=synCount();for(let i=0;i<9;i++){const u=run.units[i];if(!u)continue;const p=unitPos(i);u.lit=isLit(p.x,p.y,40)||(run.beam.mirror&&beamOn()&&MIRROR_SLOTS.indexOf(i)>=0);u.anim=(u.anim||0)+dt;if(u.flash>0)u.flash-=dt;
 if(u.stun>0){u.stun-=dt;continue}u.cd-=dt*unitRate(i);if(u.cd>0)continue;const D=UNITS[u.id];const ok=fireUnit(i,u,D,syn);if(ok){u.cd=D.cd;u.flash=.12}else u.cd=.15}}
function proj(o){if(projs.length>220)return;projs.push(Object.assign({life:2.5,hits:[],pierce:1,r:16},o))}
function fireUnit(i,u,D,syn){const p=unitPos(i),dmg=unitDmg(i),range=D.range*(u.id==='windscout'&&u.lit?1.3:1);
 switch(u.id){
 case 'harpooner':{if(u.lit){const a=pickBeamDir(p);proj({k:'harpoon',x:p.x,y:p.y,vx:Math.cos(a)*1300,vy:Math.sin(a)*1300,dmg,pierce:99,col:'#e8e0d0'});AudioFx.cue('hit',.4,.08,.7);return true}
  const t=pickTarget(i,range);if(!t)return false;const a=Math.atan2(t.y-p.y,t.x-p.x);proj({k:'harpoon',x:p.x,y:p.y,vx:Math.cos(a)*1150,vy:Math.sin(a)*1150,dmg,pierce:relic('hook')?3:1,col:'#e8e0d0'});return true}
 case 'lampmage':{const t=pickTarget(i,range);if(u.lit&&beamOn()){let n=0;for(const e of ens)if(e.lit&&!e.dead){burn(e,dmg*.35,syn);n++}if(n)addFx({t:'flare',x:LAMP.x,y:LAMP.y,life:.35,max:.35})}if(!t)return u.lit;proj({k:'fire',x:p.x,y:p.y,tx:t.x,ty:t.y,tgt:t,spd:620,dmg,aoe:75,col:'#ff8a3a'});return true}
 case 'netcaster':{const t=pickTarget(i,range);if(!t)return false;proj({k:'net',x:p.x,y:p.y,tx:t.x,ty:t.y,tgt:t,spd:560,dmg,aoe:u.lit?110:28,slow:.45,col:'#d9b77a'});return true}
 case 'bellringer':{let n=0;const st=1.2+(syn.bell>=2?.5:0);for(const e of ens){if(e.dead||!visible(e))continue;if(Math.hypot(e.x-p.x,e.y-p.y)<range||(u.lit&&e.lit)){stun(e,e.boss?st*.25:st);hurt(e,dmg,{src:'bell'});n++}}if(!n&&!u.lit)return false;rings.push({x:p.x,y:p.y,r:20,max:range,life:.6,col:'232,196,106'});if(u.lit)addFx({t:'flare',x:LAMP.x,y:LAMP.y,life:.4,max:.4});AudioFx.cue('bell',.55,.3);return true}
 case 'saltpriest':{if(u.lit)for(const e of ens)if(e.lit&&!e.dead)e.curseT=Math.max(e.curseT,3);const t=pickTarget(i,range);if(!t)return u.lit;proj({k:'salt',x:p.x,y:p.y,tx:t.x,ty:t.y,tgt:t,spd:900,dmg,col:'#e7f1fb'});return true}
 case 'windscout':{const t=pickTarget(i,range,'fly');if(!t)return false;proj({k:'wind',x:p.x,y:p.y,tx:t.x,ty:t.y,tgt:t,spd:1300,dmg,col:'#b8f3e8'});return true}
 case 'gulltamer':{if(u.lit&&beamOn()){let far=null;for(const e of ens)if(e.lit&&!e.dead&&(!far||e.y<far.y))far=e;if(far){for(let k=0;k<2;k++)proj({k:'gull',x:p.x+(k?20:-20),y:p.y,tx:far.x,ty:far.y,tgt:far,spd:700,dmg:dmg*1.2,aoe:80,col:'#ffffff'});return true}}
  const t=pickTarget(i,range);if(!t)return false;for(let k=0;k<2;k++)proj({k:'gull',x:p.x+(k?20:-20),y:p.y,tx:t.x,ty:t.y,tgt:t,spd:620+k*60,dmg,col:'#ffffff'});return true}
 case 'blacksmith':{const t=pickTarget(i,range);if(!t)return false;proj({k:'hammer',x:p.x,y:p.y,tx:t.x,ty:t.y,tgt:t,spd:700,dmg,col:'#ff8a3a'});return true}}
 return false}
function pickBeamDir(p){const ds=beamDirs();let best=ds[0],bd=9;const a=Math.atan2(-1,0);for(const d of ds){const dd=angDiff(d,a);if(dd<bd){bd=dd;best=d}}return best}
function burn(e,dps,syn){e.burnT=3;e.burnD=Math.max(e.burnD,dps*((syn||synCount()).flame>=2?1.5:1))}
function stun(e,t){e.stunT=Math.max(e.stunT,t)}
function hurt(e,dmg,o){if(e.dead)return;o=o||{};let m=1;if(e.shell)m*=.25;if(e.curseT>0)m*=1.35*(synCount().bell>=4?1.2:1);if(EN(e).fly&&relic('feather'))m*=1.4;
 const v=dmg*m;e.hp-=v;e.hitT=.1;if(relic('salt')&&R()<.1)e.curseT=Math.max(e.curseT,3);
 if(v>=40||e.boss)floater(e.x+rand(-14,14),e.y-e.r,Math.round(v),e.curseT>0?'#d9a6ff':e.shell?'#9fb0c4':'#FFE8C2',e.boss?24:20);
 if(e.hp<=0)kill(e)}
function kill(e){if(e.dead)return;e.dead=true;const D=EN(e);run.kills++;save.stats.kills++;mission('kill');
 const sp=D.sp+(relic('shell')?1:0);run.sparks+=sp;if(sp>0)addFx({t:'spk',x:e.x,y:e.y,life:.7,max:.7});
 burst(e.x,e.y,save.mild?'#B8F3E8':'#9a6ad0',e.boss?40:10,e.boss?420:220);if(e.burnT>0&&synCount().flame>=4){rings.push({x:e.x,y:e.y,r:10,max:80,life:.35,col:'255,138,58'});for(const o of ens)if(!o.dead&&o!==e&&Math.hypot(o.x-e.x,o.y-e.y)<80)hurt(o,30*Math.pow(1.1,run.wave/2))}
 if(D.split&&!e.lit&&e.revealT<=0){for(let k=0;k<2;k++)spawnEnemy('mini',e.x+(k?24:-24),e.y,{})}
 if(e.boss){run.bosses++;save.stats.bosses++;mission('boss');shake(1.2);vib('long');AudioFx.cue('boom');flashT=.5;flashCol='255,220,150';run.hitStop=.4;if(run.boss===e)run.boss=null;run.tentacle=null;
  if(relic('seed')){run.sparks+=100;run.hp=Math.min(run.maxHP,run.hp+run.maxHP*.25)}announce(L('보스 격파!','击败首领！'),LL(D.n),'#FFE8C2')}
 else AudioFx.cue('ting',.35,.03,1+Math.min(1,run.kills%8*.08))}

// ================================================================ 진행
function tick(dt){if(!run||dbgFreeze&&!stepping)return;if(paused||run.pick||adShow||guideTip||confirmQuit||unitInfo>=0)return;
 if(run.dawnT>=0){run.dawnT+=dt;if(run.dawnT>3.2)finishRun(true);return}
 if(run.over){run.overT=(run.overT||0)+dt;if(run.overT>1.2&&!run.win)finishRun(false);return}
 if(run.invT>0)run.invT-=dt;
 if(run.hitStop>0){run.hitStop-=dt;return}
 dt*=speed;run.time+=dt;if(tut)tutTick(dt);if(autoBot)botTick(dt);
 // 빛 회전
 const b=run.beam,rot=b.rot*(relic('wick')?1.3:1)*(synCount().wind>=4?1.5:1);const d=b.ta-b.a;b.a+=clamp(d,-rot*dt,rot*dt);
 // 위기
 const cr=run.crisis;if(cr){cr.t+=dt;if(!cr.on&&cr.t>=cr.warn){cr.on=true;cr.t=0;AudioFx.cue(cr.type==='storm'?'wave':'warn');if(cr.type==='storm'){shake(.5);vib('medium')}}
  if(cr.on&&cr.type==='eclipse'&&cr.t>=(relic('pearl')?5:10)){run.crisis=null}}
 if(run.eclipseT>0)run.eclipseT-=dt;
 // 보스 패턴
 const B=run.boss;if(B&&!B.dead){B.atkT-=dt;if(B.type==='deep_one'){if(run.tentacle){const T=run.tentacle;T.t+=dt;if(B.lit)T.c+=dt;if(T.c>=1.5){floater(SLOTS[T.slot].x,SLOTS[T.slot].y-150,L('막아냄!','挡住了！'),'#FFE8C2',28);AudioFx.cue('ting',.7);run.tentacle=null;B.atkT=7}else if(T.t>=2.6){const u=run.units[T.slot];if(u){u.stun=5;floater(SLOTS[T.slot].x,SLOTS[T.slot].y-150,L('기절!','眩晕！'),'#ff8a7a',26)}shake(.7);vib('heavy');AudioFx.cue('boom',.8);run.tentacle=null;B.atkT=7}}
   else if(B.atkT<=0&&B.y>40){const occ=[];run.units.forEach((u,i)=>{if(u&&!u.stun)occ.push(i)});if(occ.length){run.tentacle={slot:pickR(occ),t:0,c:0};AudioFx.cue('warn',.6)}else B.atkT=3}}
  else if(B.type==='moon_eater'&&B.atkT<=0&&B.y>40){if(!B.warn){B.warn=3;AudioFx.cue('warn');message(L('달을 삼킨 것이 달을 가린다!','吞月者遮住了月亮！'),2)}}
  if(B.warn>0){B.warn-=dt;if(B.warn<=0){B.warn=0;run.eclipseT=relic('pearl')?3:6;B.atkT=15}}}
 // 생성
 if(run.wave>0)run.waveT+=dt;
 if(run.breakT>0){run.breakT-=dt;if(run.breakT<=0)startWave()}
 else{if(run.spawnQ.length){run.spawnT-=dt;if(run.spawnT<=0){spawnNext();run.spawnT=run.spawnI*rnd(.7,1.3)}}
  else if(run.wave>0){const alive=ens.some(e=>!e.dead),bossAlive=run.boss&&!run.boss.dead;if(!alive||(!bossAlive&&run.waveT>BAL.win+7&&run.wave<run.waves))waveCleared(alive)}}
 // 적
 run.thiefOn=false;const storm=run.crisis&&run.crisis.type==='storm'&&run.crisis.on;const inv=relic('invert');
 for(const e of ens){if(e.dead)continue;const D=EN(e);e.lit=isLit(e.x,e.y,e.r*.6);if(e.lit){e.litT+=dt;if(D.ghost)e.revealT=1.5}else if(e.revealT>0)e.revealT-=dt;
  if(e.shell&&e.litT>=2){e.shell=false;burst(e.x,e.y,'#e7f1fb',12);floater(e.x,e.y-e.r,L('껍질 열림','外壳打开'),'#e7f1fb',18)}
  if(D.fly&&e.lit&&e.stopCd<=0){e.stopT=.4;e.stopCd=1.5}if(e.stopCd>0)e.stopCd-=dt;if(D.thief&&e.lit)run.thiefOn=true;
  if(e.burnT>0){e.burnT-=dt;hurt(e,e.burnD*dt);if(e.dead)continue}if(e.curseT>0)e.curseT-=dt;if(e.hitT>0)e.hitT-=dt;
  let v=e.spd;if(storm&&!relic('glass'))v*=1.25;if(D.keeper&&e.lit)v*=1.8;else if(!e.boss&&(inv?!e.lit:e.lit))v*=.7;if(e.slowT>0){e.slowT-=dt;v*=1-e.slowA}if(e.stunT>0){e.stunT-=dt;v=0}if(e.stopT>0){e.stopT-=dt;v=0}
  e.ph+=dt*(D.fly?4:2);if(D.fly)e.x=clamp(e.bornX+Math.sin(e.ph)*40,40,710);if(storm&&!e.boss)e.x=clamp(e.x+Math.sin(e.ph*1.3)*90*dt,40,710);
  if(e.boss){if(e.y<230)e.y+=40*dt;else e.y+=v*dt}else e.y+=v*dt;
  if(e.y>=WALL-(e.boss?e.r*.6:0)){if(e.boss){e.y=WALL-e.r*.6;e.atkT2=(e.atkT2||0)-dt;if(e.atkT2<=0){e.atkT2=1;damageHP(D.dmg*.5)}}else{damageHP(e.dmg);e.dead=true;burst(e.x,WALL,'#7a6ab0',8)}}}
 ens=ens.filter(e=>!e.dead);
 updateUnits(dt);updateProjs(dt);
 for(const f of fx){f.life-=dt;if(f.t==='p'){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.92;f.vy*=.92}else if(f.t==='spk'){f.y-=60*dt}}fx=fx.filter(f=>f.life>0);
 for(const r of rings){r.life-=dt;r.r+=(r.max-r.r)*Math.min(1,dt*8)}rings=rings.filter(r=>r.life>0);
 for(const f of floaters){f.life-=dt;f.y-=50*dt}floaters=floaters.filter(f=>f.life>0)}
function damageHP(n){if(run.over||run.invT>0)return;run.hp-=n;shake(.25);flashT=.15;flashCol='255,80,60';AudioFx.cue('hurt',.6,.1);vib('light');if(run.hp<=0){run.hp=0;loseRun()}}
function updateProjs(dt){for(const p of projs){p.life-=dt;if(p.tgt&&!p.tgt.dead){p.tx=p.tgt.x;p.ty=p.tgt.y}
 if(p.k==='harpoon'){p.x+=p.vx*dt;p.y+=p.vy*dt;for(const e of ens){if(e.dead||p.hits.indexOf(e)>=0||!visible(e))continue;if(Math.hypot(e.x-p.x,e.y-p.y)<e.r*.7+p.r){hurt(e,p.dmg,{});p.hits.push(e);AudioFx.cue('hit',.35,.04);if(synCount().tide>=2){e.slowT=Math.max(e.slowT,1);e.slowA=Math.max(e.slowA,.15)}if(p.hits.length>=p.pierce){p.life=0;break}}}if(p.y<-80||p.x<-80||p.x>830)p.life=0;continue}
 const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy),st=p.spd*dt;if(d<=st+6){impact(p);p.life=0;continue}p.x+=dx/d*st;p.y+=dy/d*st}
 projs=projs.filter(p=>p.life>0)}
function impact(p){const syn=synCount();const tgt=p.tgt&&!p.tgt.dead?p.tgt:null;
 if(p.aoe){for(const e of ens){if(e.dead||!visible(e))continue;if(Math.hypot(e.x-p.tx,e.y-p.ty)<p.aoe+e.r*.4){hurt(e,p.dmg*(e===tgt?1:.6),{});if(p.k==='fire')burn(e,p.dmg*.25,syn);if(p.slow){e.slowT=2.2;e.slowA=Math.max(e.slowA,p.slow)}}}
  rings.push({x:p.tx,y:p.ty,r:10,max:p.aoe,life:.3,col:p.k==='fire'?'255,138,58':p.k==='net'?'217,183,122':'255,255,255'});if(p.k==='fire')AudioFx.cue('boom',.25,.1)}
 else if(tgt){hurt(tgt,p.dmg,{});if(p.k==='salt'){if(tgt.shell){tgt.shell=false;burst(tgt.x,tgt.y,'#e7f1fb',10)}tgt.revealT=Math.max(tgt.revealT,2)}if(syn.tide>=2&&(p.k==='net'))tgt.slowA=Math.max(tgt.slowA,.15)}
 if(syn.tide>=2&&tgt&&!tgt.dead){tgt.slowT=Math.max(tgt.slowT,1);tgt.slowA=Math.max(tgt.slowA,.15)}
 burst(p.tx,p.ty,p.col,4,120)}
function waveCleared(alive){if(run.over)return;mission('wave');run.crisis=null;if(run.pact&&run.pact.left>0)run.pact.left--;if(run.wave>=run.waves){winRun();return}
 if(relic('clock')&&run.wave%3===0)run.hp=Math.min(run.maxHP,run.hp+run.maxHP*.2);
 if(run.pact&&run.pact.left===0&&!run.pact.paid){run.pact.paid=true;run.sparks+=60;const rk=randomRelic();if(rk)gainRelic(rk);message(L('어둠 서약 완수! 불씨 +60, 유물 획득','黑暗誓约完成！火种+60，获得遗物'),2)}
 if(run.wave%3===0)openPick();else run.breakT=alive?.8:2.5}
function winRun(){run.win=true;run.dawnT=0;AudioFx.cue('win');vib('long');track('run_clear',{mode:run.mode,depth:run.depth,w:run.wave})}
function loseRun(){run.over=true;run.win=false;AudioFx.cue('boom');vib('long');shake(1);track('run_fail',{mode:run.mode,depth:run.depth,w:run.wave})}
function calcShards(won){const cleared=won?run.wave:run.wave-1;let s=cleared*4+run.bosses*25+(won?80:0);if(run.mode==='endless')s=cleared*5+run.bosses*25;if(run.mode==='tut')s=won?60:30;s=Math.round(s*(1+.15*run.depth));if(run.mode==='daily'&&run.dailyFirst)s*=2;return Math.max(5,s)}
function finishRun(won){if(sc==='result')return;run.over=true;run.win=won;run.shards=calcShards(won);save.shards+=run.shards;
 const cleared=won?run.wave:run.wave-1;if(run.mode==='endless')save.bestEndless=Math.max(save.bestEndless,cleared);else if(run.mode!=='tut')save.best=Math.max(save.best,cleared);
 if(run.mode==='tut')save.firstDone=true;if(run.mode==='daily'&&run.dailyFirst)save.dailyDay=todayKey();
 if(won&&run.mode==='camp'){save.clears++;if(run.depth===save.maxDepth&&save.maxDepth<20){save.maxDepth++;if(save.depth===run.depth)save.depth=save.maxDepth}}
 persist();sc='result';paused=false;Music.cur='';}
function revive(){run.over=false;run.win=false;run.revived=true;run.hp=Math.round(run.maxHP*.5);run.invT=2;for(const e of ens)if(!e.boss&&e.y>WALL-260)e.dead=true;ens=ens.filter(e=>!e.dead);save.shards-=run.shards;run.shards=0;sc='battle';persist();announce(L('불빛이 다시 켜졌다!','灯光重新亮起！'),'','#FFE8C2')}

// ================================================================ 강화 선택
function randomRelic(){const pool=RELICS.filter(r=>run.relics.indexOf(r.k)<0);return pool.length?pickR(pool).k:null}
function gainRelic(k){run.relics.push(k);applyRelic(k);save.seen.r[k]=1;mission('relic');persist()}
function applyRelic(k,init){if(k==='lens'){run.maxHP=Math.round(run.maxHP*.7);run.hp=Math.min(run.hp,run.maxHP)}if(k==='drift'){run.maxHP=Math.round(run.maxHP*1.4);run.hp=run.maxHP}if(k==='log'&&!init){run.hand.push(drawCard())}}
function makeOpts(){const n=relic('map')?4:3,cand=[],onBoard=[...new Set(run.units.filter(Boolean).map(u=>u.id))];
 for(const id of onBoard)cand.push({k:'up',id,w:3});cand.push({k:'bw',w:1.2},{k:'bl',w:.8},{k:'br',w:.7},{k:'bp',w:1});if(!run.beam.mirror)cand.push({k:'mirror',w:.9});cand.push({k:'heal',w:run.hp<run.maxHP*.6?2.2:.6},{k:'sparks',w:1});
 const rels=RELICS.filter(r=>run.relics.indexOf(r.k)<0);const out=[];if(rels.length){const rk=pickR(rels).k;out.push({k:'relic',r:rk})}
 if(run.mode!=='tut'&&!run.pact&&run.wave<=15&&R()<.25)out.push({k:'pact'});
 while(out.length<n&&cand.length){let tot=cand.reduce((a,c2)=>a+c2.w,0),x=R()*tot;for(let j=0;j<cand.length;j++){x-=cand[j].w;if(x<=0){out.push(cand.splice(j,1)[0]);break}}}
 if(out.length<n&&rels.length>1){const r2=rels.filter(r=>!out.some(o=>o.r===r.k));if(r2.length)out.push({k:'relic',r:pickR(r2).k})}
 return out.slice(0,n).sort(()=>R()-.5)}
function optInfo(o){switch(o.k){
 case 'up':return[LL(UNITS[o.id].n)+L(' 단련',' 修炼'),L('공격력 +35% (현재 ','攻击 +35%（当前 +')+(run.upg[o.id]||0)*35+L('%)','%）'),'unit'];
 case 'bw':return[L('넓은 반사판','宽反射板'),L('빛줄기 폭 +20%','光束宽度 +20%'),'beam'];
 case 'bl':return[L('맑은 유리','透亮玻璃'),L('빛줄기 길이 +20%','光束长度 +20%'),'beam'];
 case 'br':return[L('회전 톱니','旋转齿轮'),L('빛 회전 속도 +40%','光束转速 +40%'),'beam'];
 case 'bp':return[L('굵은 심지','粗灯芯'),L('빛을 받은 수호자 강화 +25%','受光守护者强化 +25%'),'beam'];
 case 'mirror':return[L('등대 반사경','灯塔反射镜'),L('등대 바로 옆 세 자리는 언제나 빛을 받아요','灯塔旁的三个位置始终受光'),'beam'];
 case 'heal':return[L('등대 수리','修理灯塔'),L('내구도 35% 회복, 최대 내구도 +10%','恢复35%耐久，最大耐久+10%'),'heal'];
 case 'sparks':return[L('불씨 꾸러미','火种包'),L('불씨 +40','火种 +40'),'spark'];
 case 'relic':return[LL(RELIC_BY[o.r].n),LL(RELIC_BY[o.r].d),'relic'];
 case 'pact':return[L('어둠 서약','黑暗誓约'),L('다음 3웨이브 적 체력 +35%. 버텨 내면 불씨 +60과 유물','接下来3波敌人生命+35%。坚持住即可获得火种+60和遗物'),'pact']}}
function openPick(){run.pick={opts:makeOpts(),t:0};tip('pick',[['강화를 하나 고르세요. 유물은 판의 규칙을 바꾸는 특별한 강화예요.','选择一个强化。遗物是会改变规则的特殊强化。']])}
function applyPick(o){const alive=ens.some(e=>!e.dead);const b=run.beam;switch(o.k){case 'up':run.upg[o.id]=(run.upg[o.id]||0)+1;break;case 'bw':b.w*=1.2;break;case 'bl':b.len*=1.2;break;case 'br':b.rot*=1.4;break;case 'bp':b.litB*=1.25;break;case 'mirror':b.mirror=true;break;
 case 'heal':run.maxHP=Math.round(run.maxHP*1.1);run.hp=Math.min(run.maxHP,run.hp+run.maxHP*.35);break;case 'sparks':run.sparks+=40;break;case 'relic':gainRelic(o.r);break;case 'pact':run.pact={left:3,paid:false};break}
 run.pick=null;run.breakT=alive?.8:2.2;AudioFx.cue('merge',.7);track('pick',{k:o.k,r:o.r||o.id||''})}

// ================================================================ 배치·합치기
function slotAt(x,y){for(let i=0;i<9;i++){const s=SLOTS[i];if(x>s.x-66&&x<s.x+66&&y>s.y-125&&y<s.y+28)return i}return -1}
function findAuto(id){let best=-1;for(let s=3;s>=1;s--)for(let i=0;i<9;i++){const u=run.units[i];if(u&&u.id===id&&u.star===s&&s<3&&best<0)return i}
 for(const i of[2,1,3,6,7,0,4,5,8])if(!run.units[i])return i;return -1}
function placeCard(k,slot){const cost=cardCost();if(run.sparks<cost){message(L('불씨가 부족해요','火种不足'),1.2);AudioFx.cue('hurt',.3);return false}
 const id=run.hand[k];if(slot<0)slot=findAuto(id);if(slot<0){message(L('자리가 없어요 — 같은 수호자를 겹쳐 합쳐 보세요','没有空位——把相同守护者叠在一起合成吧'),1.8);return false}
 const u=run.units[slot];if(u){if(u.id!==id||u.star>=3){message(u.star>=3?L('이미 별 3개예요','已经3星了'):L('같은 수호자만 겹칠 수 있어요','只能叠加相同的守护者'),1.2);return false}mergeInto(slot,cost)}
 else{run.units[slot]={id,star:1,cd:.3,inv:cost,stun:0};AudioFx.cue('place');burst(SLOTS[slot].x,SLOTS[slot].y-40,'#F2A541',10)}
 run.sparks-=cost;run.buys++;run.placed++;mission('place');run.hand[k]=drawCard();save.seen.u[id]=1;return true}
function mergeInto(slot,cost){const u=run.units[slot];u.star=Math.min(3,u.star+(relic('sand')&&R()<.2?2:1));u.inv+=cost;u.flash=.4;run.merges++;save.stats.merges++;mission('merge');AudioFx.cue('merge');vib('medium');burst(SLOTS[slot].x,SLOTS[slot].y-60,'#ffd25a',22,300);rings.push({x:SLOTS[slot].x,y:SLOTS[slot].y-60,r:10,max:90,life:.4,col:'255,210,90'})}
function moveUnit(i,j){if(i===j)return;const a=run.units[i],b=run.units[j];if(!b){run.units[j]=a;run.units[i]=null;AudioFx.cue('place');return}
 if(b.id===a.id&&b.star===a.star&&b.star<3){run.units[i]=null;mergeInto(j,a.inv);return}run.units[i]=b;run.units[j]=a;AudioFx.cue('place')}
function sellUnit(i){const u=run.units[i];if(!u)return;const v=Math.floor(u.inv*.5);run.sparks+=v;run.units[i]=null;unitInfo=-1;floater(SLOTS[i].x,SLOTS[i].y-80,'+'+v,'#F2A541',24);AudioFx.cue('card')}
function rerollHand(){if(run.sparks<4){message(L('불씨가 부족해요','火种不足'),1.2);return}run.sparks-=4;run.hand=run.hand.map(()=>drawCard());AudioFx.cue('card')}

// ================================================================ 튜토리얼 · 자동 플레이 봇
function tutTick(dt){tut.t+=dt;if(tut.step===0&&tut.moved>.6){tut.step=1;tut.t=0}if(tut.step===1&&run.placed>=1){tut.step=2;tut.t=0}if(tut.step===2&&tut.t>8)tut.step=3}
function botTick(dt){const B=run.boss;let tgt=null;if(B&&!B.dead&&(run.tentacle||B.y>100))tgt=B;else{let by=-1e9;for(const e of ens){if(e.dead)continue;const s=e.y+(EN(e).ghost?120:0)+(e.shell?80:0)-(EN(e).keeper?400:0);if(s>by){by=s;tgt=e}}}
 if(tgt)aimBeam(tgt.x,tgt.y);
 if(run.sparks>=cardCost()){for(let k=0;k<run.hand.length;k++){const id=run.hand[k],s=findAuto(id);if(s>=0&&(!run.units[s]||run.units[s].id===id)){placeCard(k,s);break}}}
 const empty=run.units.every(Boolean);if(empty&&run.sparks>=cardCost()+8&&!run.hand.some(id=>run.units.some(u=>u&&u.id===id&&u.star<3)))rerollHand()}
function botPick(){if(!run.pick)return;const o=run.pick.opts;let best=o[0],bs=-1;for(const x of o){const s={relic:5,up:4,heal:run.hp<run.maxHP*.5?6:1,bp:3,bw:3,mirror:3,bl:2,br:1,sparks:2,pact:0}[x.k]||0;if(s>bs){bs=s;best=x}}applyPick(best)}

// ================================================================ 전투 그리기
function drawBattle(){const sh=shakeT>0?shakeT*12:0;if(shakeT>0)shakeT-=1/60;g.save();if(sh)g.translate(rand(-sh,sh),rand(-sh,sh));
 if(!img('bg_sky',0,0,W,1112)){g.fillStyle='#1C2B45';g.fillRect(0,0,W,1112)}
 // 시간대 색감
 const ph=run.phase;g.fillStyle=['rgba(120,60,40,.10)','rgba(8,12,30,.18)','rgba(30,10,50,.22)','rgba(40,10,40,.25)'][ph];g.fillRect(0,0,W,1112);
 img('bg_pier',0,428,W,676);g.fillStyle='#0E1424';g.fillRect(0,1104,W,230);
 // 위험 표식
 if(run.tentacle){const s=SLOTS[run.tentacle.slot],k=run.tentacle.t/2.6;g.save();g.globalAlpha=.35+.35*Math.sin(frame*16);g.fillStyle='#e4572e';g.beginPath();g.ellipse(s.x,s.y-40,70,90,0,0,TAU);g.fill();g.restore();g.strokeStyle='#FFE8C2';g.lineWidth=6;g.beginPath();g.arc(s.x,s.y-60,50,-PI/2,-PI/2+TAU*Math.min(1,run.tentacle.c/1.5));g.stroke()}
 // 자리·수호자
 for(let i=0;i<9;i++){const s=SLOTS[i],u=run.units[i];g.fillStyle=u?'rgba(14,20,36,.45)':'rgba(242,165,65,.10)';g.beginPath();g.ellipse(s.x,s.y,56,17,0,0,TAU);g.fill();g.strokeStyle=u?'rgba(14,20,36,.6)':'rgba(242,165,65,.45)';g.lineWidth=2;g.setLineDash(u?[]:[8,6]);g.stroke();g.setLineDash([])}
 const lh=imgs.lighthouse;if(lh)g.drawImage(lh,LAMP.x-62,LAMP.y-38,124,186);
 for(let i=0;i<9;i++){const u=run.units[i];if(!u||(ptr&&ptr.mode==='unit'&&ptr.slot===i&&ptr.moved))continue;drawUnit(i,u)}
 // 적 (어둠 아래 그림)
 drawDarkness();
 for(const e of ens)drawEnemy(e);
 drawBeamGlow();
 for(const p of projs)drawProj(p);
 for(const r of rings){g.strokeStyle=`rgba(${r.col},${clamp(r.life*2,0,.8)})`;g.lineWidth=5;g.beginPath();g.arc(r.x,r.y,r.r,0,TAU);g.stroke()}
 for(const f of fx){const a=clamp(f.life/f.max,0,1);if(f.t==='p'){g.globalAlpha=a;g.fillStyle=f.col;g.beginPath();g.arc(f.x,f.y,f.r,0,TAU);g.fill();g.globalAlpha=1}else if(f.t==='spk'){g.globalAlpha=a;spark(f.x,f.y,10);g.globalAlpha=1}else if(f.t==='flare'){drawGlow(f.x,f.y,160*a,'a',a)}}
 for(const f of floaters){g.globalAlpha=clamp(f.life*2,0,1);txt(f.s,f.x,f.y,f.size,f.col,'center');g.globalAlpha=1}
 g.restore();
 if(flashT>0){g.fillStyle=`rgba(${flashCol},${flashT*.6})`;g.fillRect(0,0,W,H);flashT-=1/60}
 drawHUD();drawHand();
 if(ptr&&ptr.mode==='card'&&ptr.moved){const id=run.hand[ptr.k];unitImg(id,ptr.x,ptr.y-50,120,.85);const s=slotAt(ptr.x,ptr.y);if(s>=0){g.strokeStyle='#FFE8C2';g.lineWidth=3;g.beginPath();g.ellipse(SLOTS[s].x,SLOTS[s].y,60,20,0,0,TAU);g.stroke()}}
 if(ptr&&ptr.mode==='unit'&&ptr.moved){const u=run.units[ptr.slot];if(u)unitImg(u.id,ptr.x,ptr.y-50,120,.85);const s=slotAt(ptr.x,ptr.y);if(s>=0){g.strokeStyle='#FFE8C2';g.lineWidth=3;g.beginPath();g.ellipse(SLOTS[s].x,SLOTS[s].y,60,20,0,0,TAU);g.stroke()}}
 if(bigMsg&&(run.pick||paused||unitInfo>=0))bigMsg=null;
 if(bigMsg){bigMsg.life-=1/60;const a=clamp(Math.min(bigMsg.life,2.4-bigMsg.life)*3,0,1);g.globalAlpha=a;rr(95,330,560,130,22,'rgba(14,20,36,.82)','#F2A541',2);txt(bigMsg.t,375,375,46,bigMsg.col,'center');txt(bigMsg.sub,375,428,26,'#A9C4CF','center');g.globalAlpha=1;if(bigMsg.life<=0)bigMsg=null}
 if(tut)drawTut();
 if(unitInfo>=0&&run.units[unitInfo])drawUnitInfo();
 if(run.pick)drawPick();
 if(run.dawnT>=0){const k=clamp(run.dawnT/2.5,0,1);const gr=g.createLinearGradient(0,H,0,0);gr.addColorStop(0,`rgba(255,207,122,${.85*k})`);gr.addColorStop(.6,`rgba(255,150,90,${.5*k})`);gr.addColorStop(1,`rgba(255,232,194,${.25*k})`);g.fillStyle=gr;g.fillRect(0,0,W,H);g.globalAlpha=k;txt(L('새벽이 밝았다!','黎明到来了！'),375,560,58,'#FFE8C2','center');g.globalAlpha=1}
 if(paused&&!run.over)drawPause();if(confirmQuit)drawConfirmQuit()}
function drawUnit(i,u){const s=SLOTS[i],bob=Math.sin(u.anim*3+i)*2,sz=u.star===3?132:u.star===2?126:120;
 if(u.lit){drawGlow(s.x,s.y-50,95,'a',.55)}
 g.save();if(u.stun>0)g.globalAlpha=.45;const sq=u.flash>0?1+u.flash*.4:1;g.translate(s.x,s.y+6);g.scale(1/sq*1.0+(sq-1)*.2,sq);
 if(!unitImg(u.id,0,-sz/2+bob,sz)){g.fillStyle=TAGS[UNITS[u.id].tag].col;g.beginPath();g.arc(0,-50,40,0,TAU);g.fill();txt(LL(UNITS[u.id].n).slice(0,2),0,-50,20,OUT,'center',false)}
 g.restore();stars(u.star,s.x,s.y+14,9);if(u.stun>0)txt('✕',s.x,s.y-120,28,'#ff8a7a','center');
 g.fillStyle=TAGS[UNITS[u.id].tag].col;g.beginPath();g.arc(s.x+44,s.y-104,7,0,TAU);g.fill();g.strokeStyle=OUT;g.lineWidth=2;g.stroke()}
function drawDarkness(){const ph=run.phase,on=beamOn();let a=[.38,.52,.58,.62][ph];if(!on)a=.74;
 dg.globalCompositeOperation='source-over';dg.clearRect(0,0,W,1112);dg.fillStyle=`rgba(4,7,18,${a})`;dg.fillRect(0,0,W,1112);
 if(on){dg.globalCompositeOperation='destination-out';const len=beamLen(),w=beamW();for(const b of beamDirs()){for(const [ww,al] of [[w*1.35,.45],[w,.95]]){dg.globalAlpha=al;dg.beginPath();dg.moveTo(LAMP.x,LAMP.y);dg.arc(LAMP.x,LAMP.y,len,b-ww,b+ww);dg.closePath();dg.fill()}}dg.globalAlpha=1;
  dg.beginPath();dg.arc(LAMP.x,LAMP.y,110,0,TAU);dg.globalAlpha=.6;dg.fill();dg.globalAlpha=1}
 g.drawImage(darkCv,0,0);
 if(run.crisis&&run.crisis.type==='fog'){const k=run.crisis.on?(windLit()?.15:.45):(run.crisis.warn>0?Math.min(.3,run.crisis.t/run.crisis.warn*.3):.3);const gr=g.createLinearGradient(0,0,0,700);gr.addColorStop(0,`rgba(220,230,240,${k})`);gr.addColorStop(1,'rgba(220,230,240,0)');g.fillStyle=gr;g.fillRect(0,0,W,700)}}
function drawBeamGlow(){if(!beamOn())return;const len=beamLen(),w=beamW();g.save();g.globalCompositeOperation='lighter';for(const b of beamDirs()){const gr=g.createRadialGradient(LAMP.x,LAMP.y,10,LAMP.x,LAMP.y,len);gr.addColorStop(0,'rgba(255,200,110,.32)');gr.addColorStop(.5,'rgba(242,165,65,.12)');gr.addColorStop(1,'rgba(242,165,65,0)');g.fillStyle=gr;g.beginPath();g.moveTo(LAMP.x,LAMP.y);g.arc(LAMP.x,LAMP.y,len,b-w,b+w);g.closePath();g.fill()}g.restore();drawGlow(LAMP.x,LAMP.y,70+Math.sin(frame*5)*6,'a',.9)}
function drawEnemy(e){const D=EN(e),key=D.img||(e.boss?'boss_':'enemy_')+e.type,s=e.r*2.5*(e.type==='mini'?1:1),im=imgs[key];const vis=visible(e)||relic('horn');
 let alpha=1;if(D.ghost&&!e.lit&&e.revealT<=0)alpha=relic('horn')?.35:.1;
 g.save();g.globalAlpha=alpha;const bob=Math.sin(e.ph)*3;if(e.lit)drawGlow(e.x,e.y,s*.55,'a',.35*alpha);else drawGlow(e.x,e.y,s*.45,'c',.12*alpha);
 const src=e.hitT>0&&im?warmImg[key]||im:e.lit?im:(darkImg[key]||im);g.globalAlpha=alpha;
 if(im)g.drawImage(src,e.x-s/2,e.y-s/2+bob,s,s);else{g.fillStyle='#4B2E5C';g.beginPath();g.arc(e.x,e.y,e.r,0,TAU);g.fill()}
 if(e.shell){g.strokeStyle='rgba(231,241,251,.7)';g.lineWidth=3;g.beginPath();g.arc(e.x,e.y,e.r*.9,PI*1.1,PI*1.9);g.stroke()}
 if(e.curseT>0){g.fillStyle='#b080ff';g.beginPath();g.arc(e.x,e.y-e.r-8,6,0,TAU);g.fill()}
 if(e.stunT>0)txt('✦',e.x,e.y-e.r-10,20,'#e8c46a','center');if(e.burnT>0)drawGlow(e.x,e.y+e.r*.3,e.r*.6,'r',.4);
 g.globalAlpha=1;if(!e.boss&&e.hp<e.max&&vis){rr(e.x-26,e.y+e.r*.9,52,7,3,'rgba(14,20,36,.8)');rr(e.x-25,e.y+e.r*.9+1,50*clamp(e.hp/e.max,0,1),5,2,'#e4572e')}
 g.restore()}
function drawProj(p){if(p.k==='harpoon'){const a=Math.atan2(p.vy,p.vx);g.save();g.translate(p.x,p.y);g.rotate(a);g.strokeStyle=OUT;g.lineWidth=6;g.beginPath();g.moveTo(-34,0);g.lineTo(10,0);g.stroke();g.strokeStyle='#e8e0d0';g.lineWidth=3;g.stroke();g.fillStyle='#A9C4CF';g.beginPath();g.moveTo(18,0);g.lineTo(6,-7);g.lineTo(6,7);g.closePath();g.fill();g.restore();return}
 const col={fire:'r',net:'y',salt:'w',wind:'c',gull:'w',hammer:'a'}[p.k]||'w';drawGlow(p.x,p.y,p.k==='fire'?26:16,col,.9);
 if(p.k==='gull'){g.strokeStyle='#ffffff';g.lineWidth=3;g.beginPath();g.moveTo(p.x-10,p.y);g.quadraticCurveTo(p.x-4,p.y-7,p.x,p.y);g.quadraticCurveTo(p.x+4,p.y-7,p.x+10,p.y);g.stroke()}
 else if(p.k==='net'){g.strokeStyle='#d9b77a';g.lineWidth=2;g.beginPath();g.arc(p.x,p.y,10,0,TAU);g.moveTo(p.x-10,p.y);g.lineTo(p.x+10,p.y);g.moveTo(p.x,p.y-10);g.lineTo(p.x,p.y+10);g.stroke()}
 else{g.fillStyle=p.col;g.beginPath();g.arc(p.x,p.y,p.k==='fire'?9:5,0,TAU);g.fill()}}
function drawHUD(){// 상단
 rr(16,16,718,104,20,'rgba(14,20,36,.78)','rgba(242,165,65,.6)',2);
 const wl=run.wave===0?L('준비','准备'):run.mode==='endless'?L('웨이브 ','第')+run.wave+(LANG==='zh'?'波':''):L('웨이브 ','第')+run.wave+(LANG==='zh'?'波':'')+' / '+run.waves;txt(wl,38,46,26,'#FFE8C2');txt(LL(PHASE[run.phase])+(run.mode==='daily'?L(' · 오늘의 밤',' · 今夜挑战'):run.mode==='camp'&&run.depth?L(' · 깊이 ',' · 深度 ')+run.depth:''),38,82,18,'#A9C4CF','left',false);
 // 등대 내구도
 const hx=250,hw=300;txt(L('등대','灯塔'),hx,46,18,'#A9C4CF','left',false);rr(hx,62,hw,22,11,'#0b1020','#3E6B73',2);const k=clamp(run.hp/run.maxHP,0,1);rr(hx+2,64,(hw-4)*k,18,9,k>.3?'#F2A541':'#e4572e');txt(Math.ceil(run.hp)+' / '+run.maxHP,hx+hw/2,74,15,'#FFE8C2','center');
 if(run.crisis&&!run.crisis.on){txt('⚠ '+crisisName(run.crisis.type)+' '+Math.ceil(run.crisis.warn-run.crisis.t),hx+hw,46,18,'#ff9a7a','right',false)}
 else if(run.crisis&&run.crisis.on)txt(crisisName(run.crisis.type),hx+hw,46,18,'#ff9a7a','right',false);
 if(run.boss&&run.boss.warn>0)txt('☾ '+Math.ceil(run.boss.warn),hx+hw,46,20,'#ff9a7a','right',false);
 if(!beamOn())txt(L('빛이 꺼졌다','光熄灭了'),375,150,28,'#ff9a7a','center');
 // 일시정지·속도
 button(660,30,60,60,'II','dark',24,()=>{paused=true});button(590,30,60,60,speed===1?'×1':'×2','dark',22,()=>{speed=speed===1?2:1});
 // 보스 체력
 const B=run.boss;if(B&&!B.dead){rr(95,134,560,26,13,'#0b1020','#e4572e',2);rr(97,136,556*clamp(B.hp/B.max,0,1),22,11,'#9a3ad0');txt(LL(ENEMIES[B.type].n),375,147,16,'#FFE8C2','center')}
 // 유물
 run.relics.slice(-8).forEach((k2,i)=>relicIcon(k2,40+i*42,B&&!B.dead?190:150,36));
 if(run.pact&&run.pact.left>0)txt(L('어둠 서약 ','黑暗誓约 ')+run.pact.left,710,150,18,'#c890ff','right',false)}
function drawHand(){const y0=1122;rr(0,y0-10,W,H-y0+10,0,'#0E1424');
 // 불씨
 spark(52,y0+42,18);txt(Math.floor(run.sparks),78,y0+42,30,'#FFE8C2');txt(L('불씨','火种'),78,y0+76,16,'#A9C4CF','left',false);
 const n=run.hand.length,cw=n>3?128:150,gap=10,x0=170,cost=cardCost();
 for(let k=0;k<n;k++){const id=run.hand[k],x=x0+k*(cw+gap),U=UNITS[id],can=run.sparks>=cost;if(ptr&&ptr.mode==='card'&&ptr.k===k&&ptr.moved)continue;
  rr(x,y0,cw,186,18,can?'#1C2B45':'#141c2c',can?TAGS[U.tag].col:'#2a3448',3);unitImg(id,x+cw/2,y0+70,cw>140?118:104,can?1:.5);
  txt(LL(U.n),x+cw/2,y0+132,cw>140?20:17,'#FFE8C2','center');spark(x+cw/2-24,y0+164,11);txt(cost,x+cw/2-8,y0+164,20,can?'#F2A541':'#7a6a5a','left');
  rr(x+8,y0+8,cw*.42,22,11,TAGS[U.tag].col);txt(LL(TAGS[U.tag].n),x+8+cw*.21,y0+19,13,OUT,'center',false)}
 button(x0+n*(cw+gap),y0+30,W-(x0+n*(cw+gap))-12,62,L('새 카드','换牌'),'dark',17,rerollHand);txt('4',x0+n*(cw+gap)+(W-(x0+n*(cw+gap))-12)/2,y0+112,16,'#A9C4CF','center',false);spark(x0+n*(cw+gap)+(W-(x0+n*(cw+gap))-12)/2-18,y0+112,8)}
function drawTut(){if(run.pick||paused)return;const step=tut.step;if(step===0){const a=Math.sin(frame*1.6)*.6;drawFinger(LAMP.x+Math.cos(-PI/2+a)*360,LAMP.y+Math.sin(-PI/2+a)*360,L('화면을 끌어 빛을 돌려 보세요','拖动屏幕转动光束'))}
 else if(step===1&&run.sparks>=cardCost())drawFinger(170+75,1170,L('카드를 눌러 수호자를 배치','点击卡牌部署守护者'));
 else if(step===2&&tut.t<6){rr(95,500,560,90,18,'rgba(14,20,36,.88)','#F2A541',2);para(L('빛이 닿은 수호자는 더 빨리 싸우고, 빛이 닿은 적은 느려져요','被光照到的守护者攻击更快，被照到的敌人会减速'),375,530,21,'#FFE8C2',520,30,'center')}}
function drawUnitInfo(){const i=unitInfo,u=run.units[i],U=UNITS[u.id];HITS.length=0;hit(0,0,W,H,()=>{unitInfo=-1});
 panel(60,330,630,520,22);unitImg(u.id,190,470,180);txt(LL(U.n),310,400,34,'#FFE8C2');stars(u.star,330,445,12);rr(310,470,110,30,15,TAGS[U.tag].col);txt(LL(TAGS[U.tag].n),365,485,17,OUT,'center',false);
 txt(L('공격력 ','攻击 ')+Math.round(unitDmg(i)),440,485,20,'#A9C4CF','left',false);
 txt(L('평소','平时'),100,590,20,'#A9C4CF','left',false);para(LL(U.d),180,590,21,'#FFE8C2',470,30);
 txt(L('빛','光照'),100,670,20,'#F2A541','left',false);para(LL(U.lit),180,670,21,'#FFE8C2',470,30);
 const syn=synCount(),c2=syn[U.tag];txt(LL(TAGS[U.tag].n)+' '+c2+L('명: ','名：')+(c2>=4?LL(SYN[U.tag][1]):c2>=2?LL(SYN[U.tag][0]):L('2명부터 효과','2名起生效')),100,740,18,TAGS[U.tag].col,'left',false);
 button(100,770,250,64,L('내보내기 ','遣散 ')+'+'+Math.floor(u.inv*.5),'red',22,()=>sellUnit(i));button(400,770,250,64,L('닫기','关闭'),'gold',24,()=>{unitInfo=-1})}
function drawPick(){HITS.length=0;g.fillStyle='rgba(4,7,18,.82)';g.fillRect(0,0,W,H);run.pick.t+=1/60;txt(L('강화 선택','选择强化'),375,200,44,'#FFE8C2','center');txt(L('웨이브 ','第')+run.wave+(LANG==='zh'?'波 ':' ')+L('버텨 냈다!','坚守成功！'),375,252,22,'#A9C4CF','center',false);
 const o=run.pick.opts,h=o.length>3?190:220,gap=22,y0=300;
 o.forEach((op,k)=>{const y=y0+k*(h+gap),[t,d,kind]=optInfo(op),slide=clamp((run.pick.t-k*.08)*5,0,1);g.save();g.globalAlpha=slide;g.translate((1-slide)*80,0);
  const col=kind==='relic'?'#c890ff':kind==='pact'?'#9a3ad0':kind==='unit'?'#F2A541':kind==='heal'?'#7fe0b0':'#A9C4CF';rr(70,y,610,h,22,'rgba(28,43,69,.96)',col,3);
  if(kind==='relic')relicIcon(op.r,160,y+h/2,96);else if(kind==='unit')unitImg(op.id,160,y+h/2,140);else if(kind==='pact'){drawGlow(160,y+h/2,60,'p',.9);txt('☾',160,y+h/2,64,'#c890ff','center')}else if(kind==='heal'){img('lighthouse',125,y+h/2-60,80,120)}else if(kind==='spark')spark(160,y+h/2,34);else{drawGlow(160,y+h/2,70,'a',.8);txt('✦',160,y+h/2,54,'#FFE8C2','center')}
  if(kind==='relic')txt(L('유물','遗物'),250,y+38,17,'#c890ff','left',false);txt(t,250,y+(kind==='relic'?72:56),28,'#FFE8C2');para(d,250,y+(kind==='relic'?114:100),20,'#c0ccdc',400,28);g.restore();hit(70,y,610,h,()=>applyPick(op))});
 const yb=y0+o.length*(h+gap)+10;if(!run.pickReroll)button(170,yb,410,72,L('📺 광고 보고 다시 뽑기','📺 看广告重抽'),'blue',22,()=>showAd('pick_reroll',()=>{run.pickReroll=true;run.pick.opts=makeOpts();run.pick.t=0}));
 if(run.rerolls>0)button(170,yb+86,410,64,L('다시 뽑기 (전망대 ','重抽（瞭望台 ')+run.rerolls+')','dark',20,()=>{run.rerolls--;run.pick.opts=makeOpts();run.pick.t=0})}
function drawPause(){HITS.length=0;g.fillStyle='rgba(4,7,18,.8)';g.fillRect(0,0,W,H);txt(L('잠시 멈춤','暂停'),375,330,48,'#FFE8C2','center');
 button(175,420,400,86,L('계속하기','继续'),'gold',30,()=>{paused=false});button(175,526,400,76,L('안내서','指南'),'blue',24,()=>{guideRet='battle';guidePage=0;sc='guide'});button(175,622,400,76,L('설정','设置'),'blue',24,()=>{guideRet='battle';sc='settings'});
 button(175,718,400,76,L('출정 포기','放弃出征'),'red',24,()=>{confirmQuit=true});
 txt(L('유물','遗物')+' '+run.relics.length,375,850,20,'#A9C4CF','center',false);run.relics.forEach((k,i)=>{const x=95+(i%8)*80,y=900+Math.floor(i/8)*80;relicIcon(k,x,y,60)})}
function drawConfirmQuit(){HITS.length=0;g.fillStyle='rgba(4,7,18,.85)';g.fillRect(0,0,W,H);panel(95,480,560,300,22);para(L('출정을 포기할까요?\n지금까지 버틴 만큼 등불 조각을 받아요.','要放弃出征吗？\n将按目前坚守的波数获得灯火碎片。'),375,550,24,'#FFE8C2',480,38,'center');
 button(130,670,230,76,L('포기','放弃'),'red',26,()=>{confirmQuit=false;paused=false;finishRun(false)});button(390,670,230,76,L('계속','继续'),'gold',26,()=>{confirmQuit=false})}

// ================================================================ 화면들
const MUSIC_FOR={title:'menu',village:'menu',codex:'menu',reward:'menu',guide:'menu',settings:'menu',privacy:'menu',result:'',loading:''};
function wantMusic(){if(sc==='loading')return;let k='menu';if(sc==='battle')k=run&&run.boss&&!run.boss.dead?'boss':run&&run.dawnT>=0?'win':'battle';else if(sc==='result')k=run&&run.win?'win':'lose';else if((sc==='settings'||sc==='guide')&&guideRet==='battle')k=Music.cur||'battle';Music.play(k)}
let loadT=0;
function loadingScreen(){loadT+=1/60;g.fillStyle='#0E1424';g.fillRect(0,0,W,H);const done=IMG_LIST.filter(n=>imgs[n]).length,tot=IMG_LIST.length,mustOk=MUST.every(n=>imgs[n]||imgFail[n]);
 drawGlow(375,520,160+Math.sin(loadT*3)*10,'a',.7);txt('LAST LANTERN',375,600,64,'#F2A541','center');txt(L('라스트 랜턴','最后的灯塔'),375,670,34,'#FFE8C2','center');
 rr(165,760,420,18,9,'#1a2234','#3E6B73',2);rr(167,762,416*done/tot,14,7,'#F2A541');
 if(loadT>6)txt(L('인터넷이 느려 시간이 걸리고 있어요','网络较慢，正在努力加载'),375,820,20,'#A9C4CF','center',false);
 if((mustOk&&done/tot>.85&&loadT>.6)||loadT>25||(mustOk&&loadT>8)){const bad=MUST.some(n=>imgFail[n]||!imgs[n]);
  dailyInit();if(!save.firstDone)newRun('tut');else sc='title';if(bad)message(L('일부 그림을 못 받았어요. 새로고침해 주세요','部分图片加载失败，请刷新'),5);track('load_done',{t:Math.round(loadT),bad:bad?1:0})}}
function title(){HITS.length=0;img('bg_sky',0,0,W,H)||(g.fillStyle='#1C2B45',g.fillRect(0,0,W,H));g.fillStyle='rgba(4,7,18,.35)';g.fillRect(0,0,W,H);
 drawGlow(375,270,170+Math.sin(frame*2)*8,'a',.5);txt('LAST LANTERN',375,250,70,'#F2A541','center');txt(L('라스트 랜턴','最后的灯塔'),375,320,36,'#FFE8C2','center');
 shard(560,410,14);txt(save.shards,582,410,26,'#FFE8C2');txt(L('최고 ','最高 ')+save.best+L('웨이브',' 波'),190,410,20,'#A9C4CF','center',false);
 const [goal,gcol]=nextGoal();rr(70,450,610,54,16,'rgba(14,20,36,.75)');txt(goal,375,477,19,gcol,'center',false);
 button(140,540,470,104,save.clears?L('출정','出征'):L('출정 · 새벽까지 20웨이브','出征 · 坚守20波到黎明'),'gold',save.clears?40:28,()=>newRun('camp'));
 if(save.maxDepth>0){button(140,656,72,64,'◀','dark',24,()=>{save.depth=Math.max(0,save.depth-1);persist()});button(538,656,72,64,'▶','dark',24,()=>{save.depth=Math.min(save.maxDepth,save.depth+1);persist()});txt(L('밤의 깊이 ','黑夜深度 ')+save.depth+' / '+save.maxDepth,375,680,24,'#FFE8C2','center');txt(save.depth?L('적 체력 +','敌人生命 +')+save.depth*13+L('% · 보상 +','% · 奖励 +')+save.depth*15+'%':L('기본 난이도','基础难度'),375,708,15,'#A9C4CF','center',false)}
 const y2=save.maxDepth>0?740:670;
 button(140,y2,230,84,L('끝없는 밤','无尽之夜'),'blue',24,()=>{if(save.clears)newRun('endless');else message(L('첫 새벽을 맞이하면 열려요','迎来第一次黎明后开放'),1.6)},false);if(!save.clears)txt('🔒',345,y2+18,20,'#fff','center',false);
 button(380,y2,230,84,L('오늘의 밤','今夜挑战'),'blue',24,()=>newRun('daily'));if(save.dailyDay!==todayKey())txt(L('×2 보상','×2奖励'),590,y2+12,15,'#7fe0b0','right');
 const y3=y2+100;button(140,y3,150,84,L('마을','村庄'),'green',24,()=>{sc='village'});if(canBuild())redDot(282,y3+8);
 button(300,y3,150,84,L('도감','图鉴'),'dark',24,()=>{sc='codex'});if(save.clears&&unlockedUnits().some(id=>mastLv(id)<10&&save.shards>=mastCost(id)))redDot(442,y3+8);button(460,y3,150,84,L('보상','奖励'),'dark',24,()=>{sc='reward'});if(rewardBadge())redDot(602,y3+8);
 button(140,y3+100,230,70,L('안내서','指南'),'dark',22,()=>{guidePage=0;guideRet='title';sc='guide'});button(380,y3+100,230,70,L('설정','设置'),'dark',22,()=>{guideRet='title';sc='settings'});
 if(LANG==='zh'){const hn=['抵制不良游戏，拒绝盗版游戏。','注意自我保护，谨防受骗上当。','适度游戏益脑，沉迷游戏伤身。','合理安排时间，享受健康生活。'];txt('健康游戏忠告',375,1176,17,'#A9C4CF','center',false);hn.forEach((l,i)=>txt(l,375,1204+i*24,15,'#8a9ab0','center',false))}
 txt('v'+BUILD,740,1320,13,'#5a6a80','right',false)}
function canBuild(){return BLD.some((b,i)=>save.bld[i]<3&&save.shards>=b.cost[save.bld[i]])}
function nextGoal(){if(!save.clears)return[L('목표: 20웨이브 버티고 새벽 맞이하기','目标：坚守20波，迎来黎明'),'#FFE8C2'];
 for(let i=0;i<BLD.length;i++){const b=BLD[i];if(save.bld[i]<3&&save.shards>=b.cost[save.bld[i]])return[L('▲ 지금 마을에서 ','▲ 现在可在村庄修复 ')+LL(b.n)+L(' 복원 가능!',''),'#7fe0b0']}
 let mi=-1,mc=1e9;BLD.forEach((b,i)=>{if(save.bld[i]<3&&b.cost[save.bld[i]]<mc){mc=b.cost[save.bld[i]];mi=i}});if(mi>=0)return[L('다음 목표: 등불 조각 ','下一目标：灯火碎片 ')+save.shards+'/'+mc+' → '+LL(BLD[mi].n),'#ffd8a8'];
 const cm=unlockedUnits().find(id=>mastLv(id)<10&&save.shards>=mastCost(id));if(cm)return[L('▲ 도감에서 ','▲ 可在图鉴提升 ')+LL(UNITS[cm].n)+L(' 숙련 가능!',' 熟练度！'),'#7fe0b0'];
 return[L('다음 목표: 밤의 깊이 ','下一目标：黑夜深度 ')+(save.maxDepth+1)+L(' 열기',' 解锁'),'#d8e0ea']}
function village(){HITS.length=0;img('bg_sky',0,0,W,H);g.fillStyle='rgba(4,7,18,.55)';g.fillRect(0,0,W,H);txt(L('등대 아래 마을','灯塔下的村庄'),375,90,40,'#FFE8C2','center');shard(560,150,13);txt(save.shards,580,150,24,'#FFE8C2');
 const built=save.bld.reduce((a,b)=>a+b,0);txt(L('불 켜진 집 ','亮灯的房子 ')+built+' / 18',190,150,20,'#A9C4CF','center',false);
 BLD.forEach((b,i)=>{const lv=save.bld[i],x=40+(i%2)*345,y=200+Math.floor(i/2)*300;rr(x,y,325,280,20,'rgba(28,43,69,.94)',lv?'#F2A541':'#3E6B73',2);
  drawHouse(x+162,y+95,lv);txt(LL(b.n),x+162,y+160,24,'#FFE8C2','center');stars(lv,x+162,y+190,10);if(lv===0)txt(L('불 꺼짐','未亮灯'),x+162,y+190,15,'#6a7a90','center',false);
  txt(lv<3?b.e(lv+1):b.e(lv),x+162,y+216,15,'#A9C4CF','center',false);
  if(lv<3){const cost=b.cost[lv],can=save.shards>=cost;button(x+40,y+232,245,40,(lv?L('키우기 ','升级 '):L('복원 ','修复 '))+cost,can?'gold':'gray',18,()=>{if(save.shards<cost){message(L('등불 조각이 부족해요','灯火碎片不足'),1.2);return}save.shards-=cost;save.bld[i]++;persist();AudioFx.cue('win');vib('medium');track('build',{b:b.k,lv:save.bld[i]});message(LL(b.n)+L(' 불이 켜졌다!',' 亮起来了！'),1.6)},false)}
  else txt(L('완성','已完成'),x+162,y+252,20,'#7fe0b0','center')});
 button(175,1150,400,80,L('◀ 돌아가기','◀ 返回'),'gold',26,()=>{sc='title'});
 tip('village',[['출정에서 얻은 등불 조각으로 마을 건물에 불을 켜면 영구히 강해져요.','用出征获得的灯火碎片点亮村庄建筑，可以永久变强。'],['선원 숙소를 키우면 새 수호자가 합류해요.','升级水手宿舍，新的守护者会加入。']])}
function drawHouse(x,y,lv){g.save();g.translate(x,y);g.fillStyle=lv?'#3a2a3a':'#1a2030';g.strokeStyle=OUT;g.lineWidth=3;g.beginPath();g.moveTo(-60,10);g.lineTo(0,-45);g.lineTo(60,10);g.closePath();g.fillStyle=lv?'#7a3a2e':'#2a2f40';g.fill();g.stroke();g.fillStyle=lv?'#d9c08a':'#2a3040';g.fillRect(-46,10,92,50);g.strokeRect(-46,10,92,50);
 for(let k=0;k<3;k++){const on=lv>k;g.fillStyle=on?'#F2A541':'#141a28';g.fillRect(-36+k*26,22,18,20);g.strokeRect(-36+k*26,22,18,20);if(on)drawGlow(-27+k*26,32,28,'a',.6)}g.restore()}
function codex(){HITS.length=0;g.fillStyle='#0E1424';g.fillRect(0,0,W,H);txt(L('도감','图鉴'),375,80,40,'#FFE8C2','center');shard(600,80,12);txt(save.shards,620,80,22,'#FFE8C2');
 tip('codex',[['수호자 탭에서 등불 조각으로 숙련을 올리면 그 수호자가 영구히 강해져요 (단계마다 공격력 +8%).','在守护者页用灯火碎片提升熟练度，该守护者会永久变强（每级攻击+8%）。']]);
 [L('수호자','守护者'),L('적','敌人'),L('유물','遗物')].forEach((t,k)=>button(60+k*215,120,200,62,t,codexTab===k?'gold':'dark',22,()=>{codexTab=k}));
 if(codexTab===0){UNIT_IDS.forEach((id,i)=>{const U=UNITS[id],y=205+i*112,un=unlockedUnits().indexOf(id)>=0;rr(40,y,670,102,16,'rgba(28,43,69,.94)',TAGS[U.tag].col,2);
  if(un){unitImg(id,100,y+50,96);txt(LL(U.n),160,y+26,22,'#FFE8C2');const ml=mastLv(id);txt(L('숙련 ','熟练 ')+ml+'/10',600,y+24,16,'#A9C4CF','center',false);if(ml<10){const mc=mastCost(id);button(540,y+40,120,48,'+'+mc,save.shards>=mc?'gold':'gray',17,()=>{if(save.shards<mc){message(L('등불 조각이 부족해요','灯火碎片不足'),1.2);return}save.shards-=mc;save.mast[id]=ml+1;persist();AudioFx.cue('merge');vib('medium');track('mastery',{id,lv:ml+1})})}else txt(L('최고','满级'),600,y+64,18,'#7fe0b0','center');rr(160+LL(U.n).length*(LANG==='zh'?24:20)+10,y+14,64,24,12,TAGS[U.tag].col);txt(LL(TAGS[U.tag].n),160+LL(U.n).length*(LANG==='zh'?24:20)+42,y+26,13,OUT,'center',false);txt(LL(U.d),160,y+56,15,'#c0ccdc','left',false);txt('☀ '+LL(U.lit),160,y+82,15,'#F2A541','left',false)}
  else{unitImg(id,100,y+50,96,.15);txt('???',160,y+36,24,'#6a7a90');txt(L('마을의 선원 숙소를 키우면 합류해요','升级村庄的水手宿舍后加入'),160,y+70,16,'#6a7a90','left',false)}})}
 else if(codexTab===1){const list=ENEMY_IDS.concat(BOSS_IDS);list.forEach((id,i)=>{const E=ENEMIES[id],y=205+i*100,seen=save.seen.e[id];rr(40,y,670,90,16,'rgba(28,43,69,.94)',E.boss?'#e4572e':'#4B2E5C',2);
  const key=(E.boss?'boss_':'enemy_')+id;if(seen){img(key,60,y+5,80,80);txt(LL(E.n),160,y+28,22,'#FFE8C2');para(LL(E.d),160,y+58,16,'#c0ccdc',530,22)}else{img(key,60,y+5,80,80,.12);txt('???',160,y+44,24,'#6a7a90')}})}
 else{RELICS.forEach((r,i)=>{const x=40+(i%4)*170,y=205+Math.floor(i/4)*150,seen=save.seen.r[r.k];rr(x,y,160,140,16,'rgba(28,43,69,.94)',seen?'#c890ff':'#2a3448',2);if(seen){relicIcon(r.k,x+80,y+50,70);para(LL(r.n),x+80,y+110,15,'#FFE8C2',150,20,'center')}else txt('?',x+80,y+60,40,'#3a4a60','center')});
  txt(L('유물을 눌러 보진 못해도, 얻으면 여기에 남아요','获得的遗物会记录在这里'),375,1120,16,'#6a7a90','center',false)}
 button(175,1200,400,80,L('◀ 돌아가기','◀ 返回'),'gold',26,()=>{sc='title'})}
function rewardScreen(){HITS.length=0;dailyInit();g.fillStyle='#0E1424';g.fillRect(0,0,W,H);txt(L('보상','奖励'),375,80,40,'#FFE8C2','center');shard(560,135,12);txt(save.shards,580,135,22,'#FFE8C2');
 txt(L('출석 보상','签到奖励'),60,180,26,'#FFE8C2');const st=save.att.streak%7;
 for(let d=0;d<7;d++){const x=40+d*97,y=210,got=d<st||(d===st&&!attCan()&&false);rr(x,y,88,120,14,d<st?'#1f4a3a':'rgba(28,43,69,.94)',d===st&&attCan()?'#F2A541':'#3E6B73',2);txt(L('','第')+(d+1)+L('일','天'),x+44,y+24,17,'#A9C4CF','center',false);shard(x+44,y+62,12);txt(ATT[d],x+44,y+96,18,'#FFE8C2','center');if(d<st)txt('✓',x+70,y+20,20,'#7fe0b0','center')}
 button(175,345,400,70,attCan()?L('출석하기','签到'):L('내일 또 만나요','明天再来'),attCan()?'gold':'gray',24,()=>{if(!attCan())return;const d=save.att.streak%7;save.att.last=todayKey();save.att.streak++;giveShards(ATT[d]);track('attend',{d})},!attCan());if(attCan())redDot(568,352);
 txt(L('오늘의 미션','今日任务'),60,460,26,'#FFE8C2');
 save.daily.m.forEach((m,k)=>{const M=MISSIONS[m.i],y=490+k*120,done=m.p>=M.goal;rr(40,y,670,104,16,'rgba(28,43,69,.94)',done&&!m.c?'#F2A541':'#3E6B73',2);txt(LL(M.n),66,y+32,21,'#FFE8C2','left',false);rr(66,y+60,360,16,8,'#0b1020');rr(67,y+61,358*m.p/M.goal,14,7,'#F2A541');txt(m.p+'/'+M.goal,440,y+68,16,'#A9C4CF','left',false);
  if(m.c)txt(L('받음','已领取'),620,y+52,20,'#7fe0b0','center');else button(540,y+22,150,60,'+'+M.r,done?'gold':'gray',22,()=>{if(!done)return;m.c=true;giveShards(M.r)},!done);if(done&&!m.c)redDot(684,y+26)});
 txt(L('등대 보급품','灯塔补给'),60,890,26,'#FFE8C2');txt(L('광고를 보면 등불 조각 25개 (하루 3번)','看广告获得25个灯火碎片（每天3次）'),60,930,17,'#A9C4CF','left',false);
 const left=chestLeft();button(175,960,400,80,left?L('📺 받기 (','📺 领取（')+left+L('번 남음)','次）'):L('내일 다시 열려요','明天再来'),left?'blue':'gray',22,()=>{if(!chestLeft())return;showAd('chest',()=>{if(save.chestDay!==todayKey()){save.chestDay=todayKey();save.chestN=0}save.chestN++;giveShards(25)})},!left);
 button(175,1200,400,80,L('◀ 돌아가기','◀ 返回'),'gold',26,()=>{sc='title'});tip('reward',[['출석·미션·보급품으로 매일 등불 조각을 받을 수 있어요.','通过签到、任务和补给，每天都能获得灯火碎片。']])}
const GUIDE=[
 {t:['게임 흐름','游戏流程'],flow:true},
 {t:['조작','操作'],items:[['화면 끌기','拖动屏幕','등대 빛줄기가 손가락 쪽으로 돌아가요. 손을 떼도 그 방향을 유지해요.','灯塔光束会转向手指方向，松手后保持方向。'],['카드 누르기','点击卡牌','불씨를 내고 수호자를 빈자리에 세워요. 끌어서 원하는 자리에 놓을 수도 있어요.','花费火种把守护者放到空位，也可以拖到想要的位置。'],['수호자 끌기','拖动守护者','다른 자리로 옮기거나, 같은 수호자 위에 놓으면 합쳐져 별이 올라요 (최대 3개).','可移到其他位置；放到相同守护者上会合成升星（最多3星）。'],['수호자 누르기','点击守护者','능력을 보고, 필요 없으면 내보내 불씨 절반을 돌려받아요.','查看能力，不需要时可遣散并返还一半火种。']]},
 {t:['빛의 규칙','光的规则'],items:[['빛이 닿은 적','被照到的敌人','30% 느려지고, 숨은 적이 드러나요. 껍질게는 2초 비추면 껍질이 열려요.','减速30%，隐藏的敌人现形。壳蟹照射2秒后外壳打开。'],['빛이 닿은 수호자','被照到的守护者','공격 속도 +60%, 그리고 수호자마다 다른 빛 반응이 켜져요.','攻速+60%，并触发各自不同的光反应。'],['빛줄기는 하나','只有一道光','적을 늦출지, 아군을 강하게 할지 매 순간 골라야 해요.','每时每刻都要选择：减速敌人，还是强化友军。'],['주의','注意','등대지기 그림자는 빛을 받으면 오히려 빨라져요!','守灯人之影被照到反而会加速！']]},
 {t:['수호자 조합','守护者组合'],items:['tide','flame','bell','wind'].map(k=>[TAGS[k].n[0]+' (같은 계열 2명·4명)',TAGS[k].n[1]+'（同系2名·4名）',SYN[k][0][0]+'\n'+SYN[k][1][0],SYN[k][0][1]+'\n'+SYN[k][1][1]])},
 {t:['위기와 보스','危机与首领'],items:[['안개','迷雾','빛줄기가 짧아져요. 바람 정찰병에게 빛을 비추면 걷혀요.','光束变短。照亮风之斥候可以驱散。'],['월식','月食','10초 동안 빛이 꺼져요. 화면 위 숫자가 예고예요.','光束熄灭10秒，屏幕上方的数字是预警。'],['폭풍','风暴','적이 흔들리며 빨리 내려와요.','敌人摇晃着加速逼近。'],['보스','首领','깊은 것의 촉수는 본체에 빛을 1.5초 비추면 막아요. 달을 삼킨 것은 월식을 부려요.','深渊之物的触手，用光照射本体1.5秒即可阻止。吞月者会引发月食。']]},
 {t:['성장','成长'],items:[['등불 조각','灯火碎片','출정이 끝나면 버틴 웨이브만큼 받아요. 져도 받아요.','出征结束后按坚守波数获得，失败也有。'],['마을','村庄','조각으로 건물에 불을 켜면 영구히 강해지고 새 수호자가 합류해요.','用碎片点亮建筑可永久变强，新守护者也会加入。'],['밤의 깊이','黑夜深度','새벽을 맞이할 때마다 더 깊은 밤이 열려요. 어렵지만 보상이 커요.','每次迎来黎明都会解锁更深的黑夜，更难但奖励更多。'],['끝없는 밤 · 오늘의 밤','无尽之夜 · 今夜挑战','끝없는 밤은 기록 도전, 오늘의 밤은 매일 같은 판으로 첫 판 보상 2배.','无尽之夜挑战纪录；今夜挑战每天固定关卡，首次奖励×2。']]}];
function guideScreen(){HITS.length=0;g.fillStyle='#0E1424';g.fillRect(0,0,W,H);const P=GUIDE[guidePage];txt(L('안내서','指南')+' '+(guidePage+1)+'/'+GUIDE.length,375,70,22,'#A9C4CF','center',false);txt(LL(P.t),375,120,40,'#FFE8C2','center');
 if(P.flow){const steps=[[L('출정','出征'),L('20웨이브','20波')],[L('빛 조준 · 수호자 배치','瞄准光束 · 部署守护者'),L('불씨로 카드 구매','用火种买卡')],[L('3웨이브마다 강화 선택','每3波选择强化'),L('유물은 규칙을 바꿈','遗物会改变规则')],[L('새벽 맞이 / 등대 꺼짐','迎来黎明 / 灯塔熄灭'),L('등불 조각 획득','获得灯火碎片')],[L('마을 복원','修复村庄'),L('영구 강화 · 새 수호자','永久强化 · 新守护者')]];
  steps.forEach((s2,i)=>{const y=190+i*170;rr(130,y,490,118,20,'rgba(28,43,69,.94)','#F2A541',2);txt(s2[0],375,y+42,26,'#FFE8C2','center');txt(s2[1],375,y+82,18,'#A9C4CF','center',false);if(i<steps.length-1){g.fillStyle='#F2A541';g.beginPath();g.moveTo(355,y+128);g.lineTo(395,y+128);g.lineTo(375,y+158);g.closePath();g.fill()}});
  g.strokeStyle='#F2A541';g.lineWidth=4;g.setLineDash([10,8]);g.beginPath();g.moveTo(620,940);g.lineTo(690,940);g.lineTo(690,250);g.lineTo(620,250);g.stroke();g.setLineDash([]);txt(L('반복','循环'),700,600,18,'#F2A541','center',false)}
 else{let y=200;for(const it of P.items){txt(LANG==='zh'?it[1]:it[0],60,y+20,24,'#F2A541');const n=para(LANG==='zh'?it[3]:it[2],60,y+62,20,'#e0e6ee',630,30);y+=70+n*30+26}}
 button(40,1200,200,80,'◀','dark',30,()=>{guidePage=(guidePage+GUIDE.length-1)%GUIDE.length});button(510,1200,200,80,'▶','dark',30,()=>{guidePage=(guidePage+1)%GUIDE.length});button(255,1200,240,80,L('닫기','关闭'),'gold',26,()=>{sc=guideRet==='battle'?'battle':'title';track('guide_open',{p:guidePage})})}
function onoff(v){return v?L('켜짐','开'):L('꺼짐','关')}
function settingsScreen(){HITS.length=0;g.fillStyle='#0E1424';g.fillRect(0,0,W,H);txt(L('설정','设置'),375,150,40,'#FFE8C2','center');
 button(130,220,490,76,L('화질: ','画质：')+(qualityLow?L('절약','省电'):L('높음','高')),'gray',24,()=>{qualityLow=!qualityLow;qualityManual=true;persist()});txt(qualityManual?L('수동 설정됨','已手动设置'):L('기기 성능에 따라 자동 전환','根据设备性能自动切换'),375,314,16,'#A9C4CF','center',false);
 button(130,340,240,76,L('음악: ','音乐：')+onoff(Music.on),'gray',22,()=>Music.toggle());button(380,340,240,76,L('효과음: ','音效：')+onoff(AudioFx.enabled),'gray',22,()=>{AudioFx.enabled=!AudioFx.enabled;save.sfx=AudioFx.enabled;persist()});
 button(130,436,240,76,L('흔들림: ','屏幕晃动：')+onoff(save.shake!==false),'gray',22,()=>{save.shake=save.shake===false;persist()});button(380,436,240,76,L('진동: ','振动：')+onoff(save.vib!==false),'gray',22,()=>{save.vib=save.vib===false;persist();vib('medium')});
 button(130,532,490,76,'🌐 '+(LANG==='zh'?'语言：简体中文':'언어: 한국어'),'gray',24,()=>{LANG=LANG==='zh'?'ko':'zh';persist()});
 button(130,628,490,76,L('순화 연출: ','温和画面：')+onoff(save.mild),'gray',22,()=>{save.mild=!save.mild;persist()});txt(L('쓰러진 적의 흩어지는 연출을 부드럽게 바꿔요','让敌人倒下时的效果更柔和'),375,722,15,'#A9C4CF','center',false);
 button(130,748,490,76,L('개인정보 처리방침','隐私政策'),'blue',22,()=>{sc='privacy'});
 button(130,864,490,76,L('진행 초기화','重置进度'),'red',22,()=>{if(resetArm>0){try{if(API&&API.removeStorageSync)API.removeStorageSync(SAVE_KEY);else localStorage.removeItem(SAVE_KEY)}catch(e){}const keep={lang:LANG};Object.assign(save,{shards:0,bld:[0,0,0,0,0,0],best:0,bestEndless:0,clears:0,depth:0,maxDepth:0,firstDone:false,tips:{},daily:null,att:{last:'',streak:0},chestDay:'',chestN:0,dailyDay:'',seen:{u:{},e:{},r:{}},stats:{kills:0,runs:0,merges:0,bosses:0}},keep);persist();resetArm=0;message(L('초기화했어요','已重置'),1.4);sc='title'}else{resetArm=3}});
 if(resetArm>0){resetArm-=1/60;txt(L('한 번 더 누르면 모든 진행이 지워집니다','再按一次将清除所有进度'),375,964,17,'#ff9a8a','center',false)}
 button(150,1180,450,80,L('◀ 돌아가기','◀ 返回'),'gold',26,()=>{sc=guideRet==='battle'?'battle':'title'})}
function privacyScreen(){HITS.length=0;g.fillStyle='#0E1424';g.fillRect(0,0,W,H);txt(L('개인정보 처리방침','隐私政策'),375,110,34,'#FFE8C2','center');rr(40,160,670,980,16,'#141a28','#2e3646',2);
 para(L('1. 이 게임은 회원가입이 없으며, 개발자는 이름·전화번호·위치 같은 개인정보를 수집하지 않습니다.\n\n2. 게임 진행 기록(등불 조각, 마을, 설정)은 이 기기 안에만 저장됩니다. 게임을 삭제하거나 저장 공간을 지우면 함께 지워집니다.\n\n3. 보상형 광고는 위챗·더우인 플랫폼이 제공합니다. 광고를 보여 주기 위해 플랫폼이 기기 정보를 처리할 수 있으며, 이는 각 플랫폼의 개인정보 정책을 따릅니다.\n\n4. 게임 개선을 위해 출정 시작·완료·실패, 광고 시청 같은 익명 통계를 플랫폼 통계 기능으로 집계합니다. 개인을 식별하는 정보는 포함하지 않습니다.\n\n5. 공유 기능은 사용자가 직접 누를 때만 작동합니다.\n\n6. 문의: 게임 정보 페이지의 개발자 연락처로 보내 주세요.',
 '1. 本游戏无需注册，开发者不收集姓名、手机号、位置等个人信息。\n\n2. 游戏进度（灯火碎片、村庄、设置）仅保存在本设备中，删除游戏或清除缓存后将一并删除。\n\n3. 激励视频广告由微信/抖音平台提供。为展示广告，平台可能处理设备信息，相关处理遵循各平台的隐私政策。\n\n4. 为改进游戏，我们通过平台统计功能汇总出征开始/完成/失败、广告观看等匿名数据，不包含可识别个人身份的信息。\n\n5. 分享功能仅在用户主动点击时使用。\n\n6. 联系方式：请通过游戏资料页中的开发者联系方式与我们联系。'),70,210,19,'#d8e0ea',610,32);
 button(150,1180,450,80,L('◀ 돌아가기','◀ 返回'),'gold',26,()=>{sc='settings'})}
function resultScreen(){HITS.length=0;img('bg_sky',0,0,W,H);const won=run.win;g.fillStyle=won?'rgba(60,30,10,.45)':'rgba(4,7,18,.75)';g.fillRect(0,0,W,H);if(won){const gr=g.createLinearGradient(0,H,0,0);gr.addColorStop(0,'rgba(255,207,122,.55)');gr.addColorStop(1,'rgba(255,207,122,0)');g.fillStyle=gr;g.fillRect(0,0,W,H)}
 txt(won?L('새벽이 밝았다!','黎明到来了！'):run.mode==='endless'?L('긴 밤이 끝났다','漫长的夜晚结束了'):L('등대가 꺼졌다','灯塔熄灭了'),375,230,52,won?'#FFE8C2':'#ff9a7a','center');
 const cleared=won?run.wave:run.wave-1;txt(run.mode==='endless'?L('버틴 웨이브 ','坚守波数 ')+cleared+L(' · 최고 ',' · 最高 ')+save.bestEndless:L('버틴 웨이브 ','坚守波数 ')+cleared+' / '+run.waves,375,300,26,'#A9C4CF','center');
 panel(95,350,560,330,22);const rows=[[L('쓰러뜨린 적','击败敌人'),run.kills],[L('보스','首领'),run.bosses],[L('합치기','合成'),run.merges],[L('유물','遗物'),run.relics.length]];rows.forEach((r2,i)=>{txt(r2[0],140,400+i*50,22,'#c0ccdc','left',false);txt(r2[1],610,400+i*50,24,'#FFE8C2','right')});
 shard(250,625,18);txt(L('등불 조각 +','灯火碎片 +')+run.shards+(run.doubled?' ×2':''),280,625,30,'#F2A541');if(run.mode==='daily'&&run.dailyFirst)txt(L('오늘의 밤 첫 보상 ×2','今夜挑战首次奖励×2'),375,665,15,'#7fe0b0','center',false);
 let y=720;if(!won&&!run.revived&&run.mode!=='tut'){button(140,y,470,86,L('📺 광고 보고 다시 불 켜기','📺 看广告重新点灯'),'blue',24,()=>showAd('revive',()=>revive()));y+=104}
 if(!run.doubled){button(140,y,470,80,L('📺 광고 보고 조각 2배','📺 看广告碎片翻倍'),'blue',22,()=>showAd('double',()=>{run.doubled=true;save.shards+=run.shards;persist();AudioFx.cue('win')}));y+=96}
 if(won)button(140,y,230,76,L('자랑하기','分享'),'dark',22,shareGame);button(won?380:140,y,won?230:470,76,run.mode==='tut'?L('마을로','前往村庄'):L('계속','继续'),'gold',26,()=>{const tutDone=run.mode==='tut';run=null;sc=tutDone?'village':'title'});
 if(run&&run.mode==='tut'&&won)para(L('첫 새벽을 맞이했어요! 이제 등불 조각으로 마을에 불을 켜 보세요.','迎来了第一个黎明！现在用灯火碎片点亮村庄吧。'),375,y+120,20,'#FFE8C2',560,30,'center')}

// ================================================================ 안내 팁
function tip(id,lines){if(save.tips[id])return false;save.tips[id]=1;persist();guideTip={lines,t:0};return true}
function drawGuideTip(){HITS.length=0;hit(0,0,W,H,()=>{if(guideTip.t>.4)guideTip=null});guideTip.t+=1/60;g.fillStyle='rgba(4,7,18,.72)';g.fillRect(0,0,W,H);
 const ls=guideTip.lines.map(l=>LL(l)),cnt=ls.map(l=>wrap(l,21,560).length),tot=cnt.reduce((a,b)=>a+b,0),h=130+tot*31+(ls.length-1)*16,y0=600-h/2;
 panel(50,y0,650,h,20);txt('💡 '+L('안내','提示'),90,y0+44,28,'#FFE8C2');let yy=y0+96;ls.forEach((l,i)=>{txt('•',80,yy,21,'#F2A541','left',false);para(l,104,yy,21,'#f0eff7',560,31);yy+=cnt[i]*31+16});
 if(Math.sin(frame*6)>-.3)txt('▼ '+L('터치해서 닫기','点击关闭'),672,y0+h-22,15,'#F2A541','right',false)}
function drawAd(){HITS.length=0;hit(0,0,W,H,()=>{});adShow.t+=1/60;g.fillStyle='rgba(0,0,0,.9)';g.fillRect(0,0,W,H);txt(L('광고 재생 중 (테스트)','广告播放中（测试）'),375,620,30,'#fff','center');rr(175,680,400,16,8,'#222');rr(177,682,396*Math.min(1,adShow.t/2),12,6,'#F2A541');
 txt(L('실제 출시판에서는 위챗·더우인 보상형 광고가 재생됩니다','正式版将播放微信/抖音激励视频广告'),375,740,16,'#9fb0c4','center',false);if(adShow.t>=2){const f=adShow.cb;adShow=null;f()}}
function drawBanner(){if(bannerT>0&&bannerSc!==sc)bannerT=0;if(bannerT>0){const by=sc==='battle'?640:1110;g.save();g.globalAlpha=Math.min(1,bannerT*2);rr(95,by,560,60,14,'rgba(58,24,32,.95)','#ff8a8a',2);txt(banner,375,by+30,20,'#fff','center',false);g.restore();bannerT-=1/60}}

// ================================================================ 입력 (끌기: 빛·카드·수호자 / 떼기: 버튼)
function coords(px,py){if(API){const k=c.width/(info.windowWidth||375);return[(px*k-view.ox)/view.s,(py*k-view.oy)/view.s]}const r=c.getBoundingClientRect();return[(px-r.left)/r.width*W,(py-r.top)/r.height*H]}
function overlay(){return adShow||guideTip||sc!=='battle'||!run||paused||run.pick||run.over||run.dawnT>=0||unitInfo>=0||confirmQuit}
function pDown(x,y){AudioFx.init();Music.kick();ptr={x,y,sx:x,sy:y,mode:'tap',moved:false};if(overlay())return;
 if(y>=1122){const n=run.hand.length,cw=n>3?128:150;for(let k=0;k<n;k++){const cx=170+k*(cw+10);if(x>=cx&&x<=cx+cw){ptr.mode='card';ptr.k=k;return}}return}
 if(y<120&&x>570)return;const s=slotAt(x,y);if(s>=0&&run.units[s]){ptr.mode='unit';ptr.slot=s;return}
 if(y<1112){ptr.mode='beam';aimBeam(x,y);AudioFx.cue('beam',.35,.4)}}
function pMove(x,y){if(!ptr)return;const dx=x-ptr.x,dy=y-ptr.y;ptr.x=x;ptr.y=y;if(Math.hypot(x-ptr.sx,y-ptr.sy)>18)ptr.moved=true;
 if(ptr.mode==='beam'&&run){aimBeam(x,y);if(tut)tut.moved+=Math.hypot(dx,dy)/400}}
function pUp(x,y){if(!ptr)return;const m=ptr;ptr=null;
 if(m.mode==='beam'){if(tut)tut.moved+=.2;return}
 if(m.mode==='card'){const s=m.moved?slotAt(x,y):-1;if(m.moved&&s<0)return;placeCard(m.k,s);return}
 if(m.mode==='unit'){if(m.moved){const s=slotAt(x,y);if(s>=0)moveUnit(m.slot,s)}else unitInfo=m.slot;return}
 tap(x,y)}
function tap(x,y){for(let i=HITS.length-1;i>=0;i--){const h=HITS[i];if(x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h){AudioFx.cue('ui',.6);vib('light');h.fn();return}}}
if(API){const f=e=>{const p=(e.changedTouches||e.touches||[])[0];return p?coords(p.clientX,p.clientY):null};
 API.onTouchStart&&API.onTouchStart(e=>{const p=f(e);if(p)pDown(p[0],p[1])});API.onTouchMove&&API.onTouchMove(e=>{const p=f(e);if(p)pMove(p[0],p[1])});API.onTouchEnd&&API.onTouchEnd(e=>{const p=f(e);if(p)pUp(p[0],p[1])})}
else{c.addEventListener('pointerdown',e=>{try{c.setPointerCapture(e.pointerId)}catch(er){}const [x,y]=coords(e.clientX,e.clientY);pDown(x,y)});c.addEventListener('pointermove',e=>{if(!ptr)return;const [x,y]=coords(e.clientX,e.clientY);pMove(x,y)});c.addEventListener('pointerup',e=>{const [x,y]=coords(e.clientX,e.clientY);pUp(x,y)});c.addEventListener('pointercancel',()=>{ptr=null})}

// ================================================================ 성능·그리기 루프
let perfAcc=0,perfFrames=0,perfBad=0;
function perf(dt){if(qualityManual||sc!=='battle'||paused)return;perfAcc+=dt;perfFrames++;if(perfAcc>=2){const fps=perfFrames/perfAcc;perfAcc=0;perfFrames=0;if(fps<45){perfBad++;if(perfBad>=2&&!qualityLow){qualityLow=true;message(L('저사양 모드 자동 적용','已自动切换省电模式'),1.2)}}else perfBad=0}}
let stepping=false;
function draw(dt){if(API){g.setTransform(1,0,0,1,0,0);g.fillStyle='#05070c';g.fillRect(0,0,c.width,c.height);g.setTransform(view.s,0,0,view.s,view.ox,view.oy)}else g.setTransform(1,0,0,1,0,0);
 g.save();g.beginPath();g.rect(0,0,W,H);g.clip();try{drawInner(dt)}finally{g.restore()}}
function drawInner(dt){
 g.clearRect(0,0,W,H);frame+=Math.min(dt,.05);HITS=[];
 if(sc==='loading')loadingScreen();else if(sc==='title')title();else if(sc==='village')village();else if(sc==='codex')codex();else if(sc==='reward')rewardScreen();else if(sc==='guide')guideScreen();else if(sc==='settings')settingsScreen();else if(sc==='privacy')privacyScreen();
 else if(sc==='battle'&&run){tick(dt);if(run&&run.pick&&autoBot)botPick();if(sc==='battle')drawBattle()}else if(sc==='result'&&run)resultScreen();else sc='title';
 if(guideTip)drawGuideTip();if(adShow)drawAd();drawBanner();wantMusic()}
if(!API&&typeof location!=='undefined'&&location.search.indexOf('debug=1')>=0){globalThis.__bepaDebug={BAL,UNITS,ENEMIES,RELICS,BLD,save,persist,newRun,startWave,spawnEnemy,placeCard,applyPick,gainRelic,openPick,botPick,tap,pDown,pMove,pUp,showAd,mission,revive,finishRun,makeOpts,drawBattle,
 get run(){return run},get ens(){return ens},get sc(){return sc},set sc(v){sc=v},set bot(v){autoBot=v},set freeze(v){dbgFreeze=v},get guideTip(){return guideTip},set guideTip(v){guideTip=v},set guidePage(v){guidePage=v},set codexTab(v){codexTab=v},set unitInfo(v){unitInfo=v},set paused(v){paused=v},set lang(v){LANG=v},get lang(){return LANG},get hits(){return HITS},get drawErr(){return drawErr},
 forceCrisis(t){run.crisis={type:t,warn:0,on:false,t:0}},setRes(o){Object.assign(run,o)},
 step(n,dt=1/60){const was=dbgFreeze;stepping=true;for(let i=0;i<n;i++){guideTip=null;if(adShow){const f=adShow.cb;adShow=null;f()}if(run&&run.pick&&autoBot)botPick();if(sc!=='battle'||!run)break;tick(dt)}stepping=false;dbgFreeze=was},
 drawOnce(){draw(0)},get state(){return run?{sc,mode:run.mode,wave:run.wave,hp:run.hp,maxHP:run.maxHP,sparks:run.sparks,kills:run.kills,ens:ens.length,units:run.units.map(u=>u?u.id+u.star:null),relics:run.relics.slice(),over:run.over,win:run.win,time:run.time,pick:!!run.pick,dawn:run.dawnT}:{sc}}}}
let drawErr=0;function loop(now){let dt=last?(now-last)/1000:0;last=now;perf(Math.min(dt,.25));try{draw(Math.min(dt,.1))}catch(e){drawErr++;try{g.restore();g.restore();g.restore()}catch(e2){}if(drawErr<5&&typeof console!=='undefined')console.error('draw error',e);if(drawErr===1)track('draw_error',{m:String(e&&e.message||e).slice(0,80),sc})}
 if(API){if(typeof requestAnimationFrame==='function')requestAnimationFrame(loop);else if(c.requestAnimationFrame)c.requestAnimationFrame(loop)}else requestAnimationFrame(loop)}
if(API){if(typeof requestAnimationFrame==='function')requestAnimationFrame(loop);else if(c.requestAnimationFrame)c.requestAnimationFrame(loop)}else requestAnimationFrame(loop);
})();
