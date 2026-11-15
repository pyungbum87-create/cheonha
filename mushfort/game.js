/* 버섯 요새 · 蘑菇堡垒 (MUSHROOM FORT) — BEPA
 * 층층이 방을 쌓아 버섯 감염체를 막는 세로형 타워 디펜스 · 방 카드 드래프트 · 융합 · 4챕터 24스테이지 + 무한 포위전
 * Canvas2D · 외부 CDN 없음 · 강제 광고 없음 · 한국어 / 简体中文
 */
(()=>{'use strict';
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
function mkCanvas(w,h){const cv=API?(API.createOffscreenCanvas?API.createOffscreenCanvas({type:'2d',width:w,height:h}):API.createCanvas()):document.createElement('canvas');cv.width=w;cv.height=h;return cv}
const BUILD='1115-1723';
// 안전장치: 반지름 음수면 그리기 전체가 멈추므로 보정
(function(){const P=Object.getPrototypeOf(g);if(!P||P.__safe)return;P.__safe=true;const oa=P.arc,oe=P.ellipse;
 if(oa)P.arc=function(x,y,r,a0,a1,ccw){return oa.call(this,x,y,r>0&&isFinite(r)?r:0,a0,a1,ccw)};
 if(oe)P.ellipse=function(x,y,rx,ry,rot,a0,a1,ccw){return oe.call(this,x,y,rx>0&&isFinite(rx)?rx:0,ry>0&&isFinite(ry)?ry:0,rot,a0,a1,ccw)}})();
const RES=["bg1.jpg", "bg2.jpg", "bg3.jpg", "bg4.jpg", "card0.png", "card1.png", "card2.png", "fu_01.png", "fu_02.png", "fu_03.png", "fu_04.png", "fu_05.png", "fu_06.png", "fu_07.png", "fu_08.png", "fu_09.png", "fu_10.png", "fu_11.png", "fu_12.png", "fw0.png", "fw3.png", "fx10.png", "fx11.png", "fx2.png", "fx3.png", "fx4.png", "fx5.png", "fx6.png", "fx7.png", "fx9.png", "fz0.png", "fz3.png", "fz5.png", "fz6.png", "fz7.png", "icc0.png", "icc1.png", "icc10.png", "icc11.png", "icc2.png", "icc3.png", "icc4.png", "icc5.png", "icc6.png", "icc7.png", "icc8.png", "icc9.png", "icm0.png", "icm1.png", "icm10.png", "icm11.png", "icm2.png", "icm3.png", "icm4.png", "icm5.png", "icm6.png", "icm7.png", "icm8.png", "icm9.png", "icr0.png", "icr1.png", "icr2.png", "icr3.png", "icr4.png", "icr5.png", "icw0.png", "icw1.png", "icw10.png", "icw11.png", "icw12.png", "icw13.png", "icw14.png", "icw15.png", "icw2.png", "icw3.png", "icw4.png", "icw5.png", "icw6.png", "icw7.png", "icw8.png", "icw9.png", "ka0.png", "ka1.png", "ka2.png", "kb0.png", "kb2.png", "kb4.png", "kit1.png", "kit3.png", "kit5.png", "logo.png", "op_engineer.png", "op_flamer.png", "op_gunner.png", "op_medic.png", "op_scout.png", "op_sniper.png", "pr0.png", "pr1.png", "pr10.png", "pr2.png", "pr3.png", "pr4.png", "pr5.png", "pr6.png", "pr7.png", "pr8.png", "rm_barrel.png", "rm_crossbow.png", "rm_drain.png", "rm_drones.png", "rm_empty.png", "rm_flamer.png", "rm_frostfan.png", "rm_frostnade.png", "rm_minelift.png", "rm_mortar.png", "rm_netgun.png", "rm_radio.png", "rm_roof.png", "rm_siren.png", "rm_sniper.png", "rm_turret.png", "z_bloater_farm.png", "z_bloater_head.png", "z_bloater_sac.png", "z_bloater_shin.png", "z_bloater_shinD.png", "z_bloater_thigh.png", "z_bloater_thighD.png", "z_bloater_torso.png", "z_bloater_uarm.png", "z_bulwark_extra.png", "z_bulwark_farm.png", "z_bulwark_head.png", "z_bulwark_sac.png", "z_bulwark_shin.png", "z_bulwark_shinD.png", "z_bulwark_thigh.png", "z_bulwark_thighD.png", "z_bulwark_torso.png", "z_bulwark_uarm.png", "z_burrower_farm.png", "z_burrower_head.png", "z_burrower_sac.png", "z_burrower_shin.png", "z_burrower_shinD.png", "z_burrower_thigh.png", "z_burrower_thighD.png", "z_burrower_torso.png", "z_burrower_uarm.png", "z_climber_farm.png", "z_climber_head.png", "z_climber_sac.png", "z_climber_shin.png", "z_climber_shinD.png", "z_climber_thigh.png", "z_climber_thighD.png", "z_climber_torso.png", "z_climber_uarm.png", "z_conductor_extra.png", "z_conductor_farm.png", "z_conductor_head.png", "z_conductor_sac.png", "z_conductor_shin.png", "z_conductor_shinD.png", "z_conductor_thigh.png", "z_conductor_thighD.png", "z_conductor_torso.png", "z_conductor_uarm.png", "z_echo_farm.png", "z_echo_head.png", "z_echo_sac.png", "z_echo_shin.png", "z_echo_shinD.png", "z_echo_thigh.png", "z_echo_thighD.png", "z_echo_torso.png", "z_echo_uarm.png", "z_faker_farm.png", "z_faker_head.png", "z_faker_sac.png", "z_faker_shin.png", "z_faker_shinD.png", "z_faker_thigh.png", "z_faker_thighD.png", "z_faker_torso.png", "z_faker_uarm.png", "z_howler_farm.png", "z_howler_head.png", "z_howler_sac.png", "z_howler_shin.png", "z_howler_shinD.png", "z_howler_thigh.png", "z_howler_thighD.png", "z_howler_torso.png", "z_howler_uarm.png", "z_scout_farm.png", "z_scout_head.png", "z_scout_sac.png", "z_scout_shin.png", "z_scout_shinD.png", "z_scout_thigh.png", "z_scout_thighD.png", "z_scout_torso.png", "z_scout_uarm.png", "z_stacker_farm.png", "z_stacker_head.png", "z_stacker_sac.png", "z_stacker_shin.png", "z_stacker_shinD.png", "z_stacker_thigh.png", "z_stacker_thighD.png", "z_stacker_torso.png", "z_stacker_uarm.png", "zp_bloater.png", "zp_bulwark.png", "zp_burrower.png", "zp_climber.png", "zp_conductor.png", "zp_echo.png", "zp_faker.png", "zp_howler.png", "zp_scout.png", "zp_stacker.png"];
const ZRIG={"S":0.18,"piv":{"torso":{"hip":[0.24,0.8],"neck":[0.88,0.32],"sho":[0.66,0.72],"sac":[0.42,0.55],"hip2":[0.36,0.78]},"head":{"p":[0.09,0.88]},"uarm":{"p":[0.09,0.72],"e":[0.92,0.7]},"farm":{"p":[0.04,0.55]},"thigh":{"p":[0.48,0.18],"k":[0.13,0.86]},"shin":{"p":[0.16,0.08]},"sac":{"p":[0.25,0.08]},"extra":{"p":[0.5,0.5]}},"sizes":{"bloater":{"torso":[120,101],"head":[101,88],"uarm":[64,45],"farm":[98,54],"thigh":[63,99],"shin":[71,91],"sac":[95,94]},"bulwark":{"torso":[119,112],"head":[101,87],"uarm":[62,44],"farm":[104,54],"thigh":[70,105],"shin":[75,95],"sac":[43,55],"extra":[57,80]},"burrower":{"torso":[119,98],"head":[101,90],"uarm":[64,48],"farm":[102,62],"thigh":[69,98],"shin":[82,86],"sac":[57,62]},"climber":{"torso":[98,98],"head":[86,86],"uarm":[50,45],"farm":[106,66],"thigh":[65,89],"shin":[92,94],"sac":[55,59]},"conductor":{"torso":[104,134],"head":[83,75],"uarm":[44,52],"farm":[78,52],"thigh":[49,97],"shin":[50,88],"sac":[27,39],"extra":[64,116]},"echo":{"torso":[120,105],"head":[99,90],"uarm":[66,49],"farm":[100,61],"thigh":[68,103],"shin":[79,94],"sac":[57,69]},"faker":{"torso":[117,111],"head":[98,88],"uarm":[64,53],"farm":[106,59],"thigh":[69,100],"shin":[76,94],"sac":[57,63]},"howler":{"torso":[117,105],"head":[102,97],"uarm":[64,46],"farm":[103,64],"thigh":[68,104],"shin":[77,93],"sac":[44,55]},"scout":{"torso":[88,80],"head":[82,92],"uarm":[49,37],"farm":[89,35],"thigh":[61,79],"shin":[67,80],"sac":[44,52]},"stacker":{"torso":[120,102],"head":[99,86],"uarm":[66,48],"farm":[102,65],"thigh":[72,101],"shin":[78,81],"sac":[56,63]}}};
// ---------------------------------------------------------------- assets
const imgs={},imgFail={};
// 핵심 그림: 이것만 오면 시작 가능 (나머지는 계속 받음)
const MUST=['bg1','logo','rm_turret','rm_empty','rm_roof','z_faker_torso','z_scout_torso','card0','kit1'];
function loadImg(file,tries=0){const name=file.replace(/\.(png|jpg)$/,'');const im=API?(API.createImage?API.createImage():c.createImage()):new Image();
 im.onload=()=>{imgs[name]=im};im.onerror=()=>{if(tries<8)setTimeout(()=>loadImg(file,tries+1),600+tries*900);else imgFail[name]=1};
 im.src='res/'+file+(API?'':'?v='+BUILD+(tries?'r'+tries:''))}
// 핵심 그림 먼저, 나머지 뒤에
RES.slice().sort((a,b)=>(MUST.indexOf(b.replace(/\.\w+$/,''))>=0)-(MUST.indexOf(a.replace(/\.\w+$/,''))>=0)).forEach(f=>loadImg(f));
const GLOW_COL={w:[255,248,220],y:[255,214,110],o:[255,138,46],r:[255,68,36],b:[80,180,255],c:[150,240,255],g:[150,240,100],p:[255,120,200],t:[90,255,220]};
const glow={};
(function(){for(const k in GLOW_COL){const cv=mkCanvas(64,64),x=cv.getContext('2d'),[r,gg,b]=GLOW_COL[k],gr=x.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,`rgba(${r},${gg},${b},1)`);gr.addColorStop(.25,`rgba(${r},${gg},${b},.75)`);gr.addColorStop(.6,`rgba(${r},${gg},${b},.22)`);gr.addColorStop(1,`rgba(${r},${gg},${b},0)`);x.fillStyle=gr;x.fillRect(0,0,64,64);glow[k]=cv}})();
function drawGlow(x,y,r,k,a=1){const s=glow[k];if(!s||r<=0)return;g.globalAlpha=Math.max(0,Math.min(1,a));g.drawImage(s,x-r,y-r,r*2,r*2);g.globalAlpha=1}

// ---------------------------------------------------------------- audio
const SFX=['gun','bow','boom','flame','water','zap','freeze','siren','hit','hurt','coin','ui','build','fuse','roar','splat','card','net','drone','power'];
// 배경음악·효과음: 자체 합성(저작권 문제 없음). res/bgm_*.mp3 · res/sfx_*.wav 교체 가능
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
 toggle(){this.on=!this.on;if(!this.on)this.stop();else{const k=this.cur;this.cur='';this.play(k||'menu')}},
 kick(){if(this.on&&this.cur&&!this.src&&!(this.el&&!this.el.paused)&&!this.nat){const k=this.cur;this.cur='';this.play(k)}}};
const AudioFx={ctx:null,enabled:true,buf:{},last:{},native:{},
 init(){if(!this.enabled||this.ctx||API)return;try{const A=typeof AudioContext!=='undefined'?AudioContext:typeof webkitAudioContext!=='undefined'?webkitAudioContext:null;if(A){this.ctx=new A();this.master=this.ctx.createGain();this.master.gain.value=.7;this.master.connect(this.ctx.destination);this.load()}}catch(e){}},
 load(){if(typeof fetch!=='function'||typeof location==='undefined'||location.protocol==='file:')return;for(const k of SFX){fetch('res/sfx_'+k+'.mp3?v='+BUILD).then(r=>r.arrayBuffer()).then(b=>this.ctx.decodeAudioData(b,d=>{this.buf[k]=d},()=>{})).catch(()=>{})}},
 beep(freq=440,duration=.07,kind='square',vol=.025,fall=0){if(!this.ctx)return;try{const t=this.ctx.currentTime,o=this.ctx.createOscillator(),v=this.ctx.createGain();o.type=kind;o.frequency.setValueAtTime(freq,t);if(fall)o.frequency.exponentialRampToValueAtTime(Math.max(40,freq*fall),t+duration);v.gain.setValueAtTime(vol,t);v.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(v);v.connect(this.master);o.start(t);o.stop(t+duration+.01)}catch(e){}},
 cue(key,vol=1,gap=.06){if(!this.enabled)return;const now=Date.now()/1000;if(this.last[key]&&now-this.last[key]<gap)return;this.last[key]=now;
  if(API&&typeof API.createInnerAudioContext==='function'){try{let pool=this.native[key];if(!pool){pool={i:0,a:[0,1].map(()=>{const a=API.createInnerAudioContext();a.autoplay=false;a.src='res/sfx_'+key+'.mp3';return a})};this.native[key]=pool}const a=pool.a[pool.i++%2];a.volume=Math.min(1,vol);a.stop();a.play()}catch(e){}return}
  if(!this.ctx)return;const b=this.buf[key];
  if(b){try{const s=this.ctx.createBufferSource(),v=this.ctx.createGain();s.buffer=b;s.playbackRate.value=.94+Math.random()*.12;v.gain.value=vol;s.connect(v);v.connect(this.master);s.start()}catch(e){}return}
  this.beep(key==='boom'?90:key==='ui'?520:300,.08,'triangle',.02,.5)}};

// ---------------------------------------------------------------- 언어
let LANG='ko';
// 첫 실행 언어: 위챗·더우인은 중국어 기본(기기 언어가 한국어일 때만 한국어). 웹은 기기 언어 zh 또는 중국권 시간대면 중국어
try{if(API){const sl=((API.getSystemInfoSync&&API.getSystemInfoSync().language)||'').toLowerCase();LANG=sl.indexOf('ko')===0?'ko':'zh'}
 else{const langs=(typeof navigator!=='undefined'?(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||'']):[]).map(x=>(x||'').toLowerCase());
  let tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){}
  const zhTZ=/^Asia\/(Shanghai|Chongqing|Chungking|Harbin|Urumqi|Kashgar|Hong_Kong|Macau|Taipei)$/.test(tz)||tz==='PRC';
  if(langs[0]&&langs[0].indexOf('zh')===0)LANG='zh';else if(zhTZ&&!(langs[0]&&langs[0].indexOf('ko')===0))LANG='zh'}}catch(e){}
let LANG_FORCED=null;try{if(!API&&typeof location!=='undefined'){const m=location.search.match(/[?&]lang=(ko|zh)/);if(m)LANG_FORCED=m[1]}}catch(e){}if(LANG_FORCED)LANG=LANG_FORCED;
const L=(ko,zh)=>LANG==='zh'?zh:ko;
const LL=p=>Array.isArray(p)?(LANG==='zh'?p[1]:p[0]):(p||'');

// ---------------------------------------------------------------- 저장
const SAVE_KEY='bepa_mushfort_v1';
const save={tips:{},daily:null,att:{last:'',streak:0},chest:[],stars:[],cleared:0,cry:0,lab:{},ops:{eng:1},op:'eng',seenFuse:{},seenZ:{},endlessBest:0,lang:null,qualityLow:false,qualityManual:false,shake:true,vib:true,music:true,sfx:true,mild:null,firstPlay:true,stats:{kills:0,fuse:0},adBox:null,statc:{}};
let qualityLow=false,qualityManual=false;
try{const raw=API&&API.getStorageSync?API.getStorageSync(SAVE_KEY):typeof localStorage!=='undefined'?localStorage.getItem(SAVE_KEY):null;const v=raw?(typeof raw==='string'?JSON.parse(raw):raw):null;
 if(v){for(const k in save)if(v[k]!==undefined&&v[k]!==null)save[k]=v[k];for(const k of['lab','ops','seenFuse','seenZ','stats','tips','statc'])if(!save[k]||typeof save[k]!=='object')save[k]={};if(!Array.isArray(save.stars))save.stars=[];if(!Array.isArray(save.chest))save.chest=[];if(!save.ops.eng)save.ops.eng=1}}catch(e){}
if(!LANG_FORCED&&(save.lang==='ko'||save.lang==='zh'))LANG=save.lang;
if(save.mild===null||save.mild===undefined)save.mild=LANG==='zh'||!!API;
AudioFx.enabled=save.sfx!==false;Music.on=save.music!==false;qualityLow=!!save.qualityLow;qualityManual=!!save.qualityManual;
function persist(){save.lang=LANG;save.qualityLow=qualityLow;save.qualityManual=qualityManual;save.music=Music.on;save.sfx=AudioFx.enabled;try{const v=JSON.stringify(save);if(API&&API.setStorageSync)API.setStorageSync(SAVE_KEY,v);else if(typeof localStorage!=='undefined')localStorage.setItem(SAVE_KEY,v)}catch(e){}}
function todayKey(){const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()}

// ---------------------------------------------------------------- 진동 · 통계
let vibT=0;function vib(kind){if(save.vib===false)return;const now=Date.now();if(kind==='light'&&now-vibT<250)return;if(now-vibT<60)return;vibT=now;try{if(API&&kind==='long'&&API.vibrateLong)API.vibrateLong();else if(API&&API.vibrateShort)API.vibrateShort({type:kind==='heavy'?'heavy':kind==='medium'?'medium':'light'});else if(typeof navigator!=='undefined'&&navigator.vibrate)navigator.vibrate(kind==='long'?200:kind==='heavy'?60:kind==='medium'?35:15)}catch(e){}}
// 통계: 위챗 reportEvent / 더우인 reportAnalytics (관리자 화면에 같은 이벤트 이름 등록 필요). 웹은 기기 안에 횟수만 저장
const STAT_LOG=[];function track(ev,data){data=data||{};try{STAT_LOG.push([ev,data]);if(STAT_LOG.length>300)STAT_LOG.shift();
 if(API&&PLATFORM==='wx'&&API.reportEvent)API.reportEvent(ev,data);else if(API&&PLATFORM==='tt'&&API.reportAnalytics)API.reportAnalytics(ev,data);
 save.statc[ev]=(save.statc[ev]||0)+1}catch(e){}}

// ---------------------------------------------------------------- 보상형 광고 · 공유 (강제 광고 없음)
const AD_UNIT={wx:'adunit-xxxxxxxxxxxxxxxx',tt:'xxxxxxxxxxxxxxxxxx'};// ← 플랫폼 광고 단위 ID로 교체
let adShow=null,adObj=null,adCb=null;
function showAd(place,cb0){if(adShow||adCb)return;track('ad_open',{place});const cb=()=>{track('ad_reward',{place});cb0()};
 if(API&&API.createRewardedVideoAd&&AD_UNIT[PLATFORM]&&AD_UNIT[PLATFORM].indexOf('xxxx')<0){try{if(!adObj){adObj=API.createRewardedVideoAd({adUnitId:AD_UNIT[PLATFORM]});adObj.onClose(r=>{const ok=!r||r.isEnded!==false;const f=adCb;adCb=null;Music.kick();if(ok&&f)f();else message(L('끝까지 시청해야 보상을 받아요','需完整观看才能获得奖励'),1.6)});adObj.onError(()=>{adCb=null;message(L('광고를 불러오지 못했어요','广告加载失败'),1.4)})}
  adCb=cb;Music.stop();adObj.show().catch(()=>adObj.load().then(()=>adObj.show()).catch(()=>{adCb=null;message(L('광고를 불러오지 못했어요','广告加载失败'),1.4)}))}catch(e){adCb=null;cb()}return}
 adShow={t:0,cb,place}}// ID가 없으면 2초 테스트 광고
function drawAd(){adShow.t+=1/60;g.fillStyle='rgba(0,0,0,.9)';g.fillRect(0,0,W,H);icon('icm7',315,520,120);txt(L('광고 재생 중 (테스트)','广告播放中（测试）'),375,680,30,'#fff','center');rr(175,720,400,16,8,'#222',null);rr(177,722,396*Math.min(1,adShow.t/2),12,6,'#ffcf6a',null);
 txt(L('정식판에서는 위챗·더우인 보상형 광고가 재생됩니다','正式版将播放微信/抖音激励视频广告'),375,780,17,'#9fb0c4','center',false);if(adShow.t>=2){const f=adShow.cb;adShow=null;f()}}
function shareGame(){track('share',{});const title=L('버섯 감염체가 몰려온다! 방을 쌓고 융합해서 요새를 지켜라 — 나는 ','蘑菇感染体来袭！堆叠房间、融合武器守住堡垒——我已通关 ')+save.cleared+L('스테이지 돌파!',' 关！');
 if(API&&API.shareAppMessage){try{API.shareAppMessage({title,imageUrl:'res/share_icon.png'})}catch(e){}}else message(L('공유는 위챗·더우인에서 동작해요','分享功能在微信/抖音中可用'),1.4)}
if(API){try{API.showShareMenu&&API.showShareMenu({withShareTicket:true,menus:['shareAppMessage','shareTimeline']});API.onShareAppMessage&&API.onShareAppMessage(()=>({title:L('버섯 요새 — 층층이 쌓아 막아라!','蘑菇堡垒——层层堆叠，守住堡垒！'),imageUrl:'res/share_icon.png'}))}catch(e){}}
// 새 버전 알림
if(API&&API.getUpdateManager){try{const um=API.getUpdateManager();um.onUpdateReady(()=>{API.showModal?API.showModal({title:L('새 버전','新版本'),content:L('새 버전이 준비됐어요. 다시 시작할까요?','新版本已准备好，是否重启？'),success:r=>{if(r.confirm)um.applyUpdate()}}):um.applyUpdate()})}catch(e){}}

// ---------------------------------------------------------------- 그리기 도구
let banner='',bannerT=0,bannerSc='';function message(t,d=2){banner=t;bannerT=d;bannerSc=sc}
function pathRect(x,y,w,h,r=12){r=Math.max(0,Math.min(r,w/2,h/2));g.beginPath();g.moveTo(x+r,y);g.lineTo(x+w-r,y);g.quadraticCurveTo(x+w,y,x+w,y+r);g.lineTo(x+w,y+h-r);g.quadraticCurveTo(x+w,y+h,x+w-r,y+h);g.lineTo(x+r,y+h);g.quadraticCurveTo(x,y+h,x,y+h-r);g.lineTo(x,y+r);g.quadraticCurveTo(x,y,x+r,y);g.closePath()}
function rr(x,y,w,h,r,fill,stroke,lw=2){if(w<=0||h<=0)return;if(fill){g.fillStyle=fill;pathRect(x,y,w,h,r);g.fill()}if(stroke){pathRect(x,y,w,h,r);g.strokeStyle=stroke;g.lineWidth=lw;g.stroke()}}
function panel(x,y,w,h,fill='#1a1410ee',stroke='#c08a4a',r=16){rr(x+3,y+5,w,h,r,'#00000066',null);rr(x,y,w,h,r,fill,stroke,3);g.strokeStyle='#ffffff14';g.lineWidth=2;pathRect(x+5,y+5,w-10,h-10,r-4);g.stroke()}
const FONT='system-ui,-apple-system,"PingFang SC","Microsoft YaHei","Noto Sans KR",sans-serif';
function txt(s,x,y,n=24,color='#fff',align='left',stroke=true,wgt=900){g.font=`${wgt} ${n}px ${FONT}`;g.textAlign=align;g.textBaseline='middle';if(stroke){g.lineWidth=Math.max(3,n*.2);g.strokeStyle='#1b120c';g.lineJoin='round';g.strokeText(s,x,y)}g.fillStyle=color;g.fillText(s,x,y)}
function fitTxt(s,x,y,n,maxW,color,align='center',stroke=true){g.font=`900 ${n}px ${FONT}`;let w=g.measureText(s).width;while(w>maxW&&n>10){n-=1;g.font=`900 ${n}px ${FONT}`;w=g.measureText(s).width}txt(s,x,y,n,color,align,stroke)}
function wrapLines(value,size,maxW){g.font=`700 ${size}px ${FONT}`;const out=[];for(const raw of String(value).split('\n')){let cur='';const words=LANG==='zh'?raw.split(''):raw.split(/(\s+)/);for(const w2 of words){if(g.measureText(cur+w2).width>maxW&&cur.trim()){out.push(cur.trim());cur=w2.trim()?w2:''}else cur+=w2}out.push(cur.trim())}return out}
function paragraphs(value,x,y,size,color,maxW=630,lineH=null,align='left'){lineH=lineH||Math.round(size*1.5);const ls=wrapLines(value,size,maxW);ls.forEach((l,i)=>txt(l,x,y+i*lineH,size,color,align,false,700));return ls.length}
function img(name,x,y,w,h,alpha=1){const im=imgs[name];if(!im)return false;if(alpha<1){g.globalAlpha=alpha;g.drawImage(im,x,y,w,h);g.globalAlpha=1}else g.drawImage(im,x,y,w,h);return true}
function imgC(name,x,y,w,alpha=1){const im=imgs[name];if(!im)return 0;const h=w*im.height/im.width;img(name,x-w/2,y-h/2,w,h,alpha);return h}
function icon(name,x,y,s,alpha=1){const im=imgs[name];if(!im){rr(x,y,s,s,s*.2,'#2a2018','#7a5a3a');return}img(name,x,y,s,s*im.height/im.width,alpha)}
function grad(x,y,x2,y2,stops){const z=g.createLinearGradient(x,y,x2,y2);for(const [p,cc] of stops)z.addColorStop(p,cc);return z}
const hit_=(x,y,bx,by,bw,bh)=>x>=bx&&x<=bx+bw&&y>=by&&y<=by+bh;
// 버튼: 주황(gold)·청록(teal)·회색(gray) 그림 버튼 + 빨강·초록은 그림 위 색 덧칠
function button(x,y,w,h,label,style='gold',size){const key=style==='teal'||style==='green'?'kit3':style==='gray'?'kit5':'kit1';
 g.save();g.globalAlpha=.45;g.fillStyle='#000';pathRect(x+3,y+6,w,h,16);g.fill();g.restore();
 if(!img(key,x,y,w,h))rr(x,y,w,h,14,style==='gray'?'#555':style==='teal'?'#1a9a9a':'#e08a20','#2a1a10',3);
 if(style==='red'){g.save();g.globalAlpha=.55;g.fillStyle='#c0303a';pathRect(x+6,y+6,w-12,h-12,12);g.fill();g.restore()}
 if(style==='green'){g.save();g.globalAlpha=.45;g.fillStyle='#2fb050';pathRect(x+6,y+6,w-12,h-12,12);g.fill();g.restore()}
 fitTxt(label,x+w/2,y+h/2+1,size||Math.min(30,h*.4),w-24,style==='gray'?'#e8eef4':'#fffaf0','center')}
function adButton(x,y,w,h,label,size){button(x,y,w,h,'',  'teal');icon('icm7',x+12,y+(h-44)/2,44);fitTxt(label,x+w/2+22,y+h/2+1,size||Math.min(26,h*.38),w-80,'#fffaf0','center')}
function noise(seed){const x=Math.sin(seed*4327.9)*43758.5453;return x-Math.floor(x)}
function bar(x,y,w,h,p,col,bg='#1b120c'){rr(x,y,w,h,h/2,bg,'#00000088',2);if(p>0)rr(x+2,y+2,Math.max(h-4,(w-4)*Math.min(1,p)),h-4,(h-4)/2,col,null)}
function crystal(x,y,s=30){icon('icm1',x-s/2,y-s/2,s)}
function scrapIco(x,y,s=30){icon('icm0',x-s/2,y-s/2,s)}
function starIco(x,y,s,on=true){if(on)icon('icm4',x-s/2,y-s/2,s);else{g.save();g.globalAlpha=.3;icon('icm4',x-s/2,y-s/2,s);g.restore()}}
function onoff(v){return v?L('켬','开'):L('끔','关')}
// ---------------------------------------------------------------- 상태
let sc='loading',frame=0,last=0,paused=false,speed=1,shake=0,flash=0,flashCol='255,255,255',hitStop=0;
// ---------------------------------------------------------------- 게임 데이터
const GY=1000,TX=375,RW=264,RH=128,FH=112,MAXF=6;
// 방(층) 종류. ground:true = 땅 위 적만 공격(날아다니는 포자 머리는 못 맞힘)
// kind: shot(단일) pierce(관통) arc(곡사 범위) cone(근거리 화염) aura(주변 효과) line(땅 따라 물줄기) mine(지뢰) roll(굴러가는 통) drone(드론) net(그물) pulse(음파) eco(경제)
const ROOMS={
 turret:{n:['기관총실','机枪室'],ic:'icw15',kind:'shot',dmg:9,cd:.24,rng:310,col:'y',d:['빠른 연사로 하나씩 처치','高速连射，逐个击破']},
 crossbow:{n:['석궁실','弩炮室'],ic:'icw12',kind:'pierce',dmg:34,cd:1.1,rng:380,col:'w',d:['일렬로 꿰뚫는 화살','穿透一整排的弩箭']},
 mortar:{n:['박격포실','迫击炮室'],ic:'icw8',kind:'arc',dmg:44,cd:2.3,rng:560,aoe:72,ground:true,col:'o',d:['멀리 떨어지는 범위 폭발 · 땅 위만','远程范围爆炸 · 仅地面']},
 flamer:{n:['화염실','火焰室'],ic:'icw2',kind:'cone',dmg:34,cd:.12,rng:200,burn:9,col:'o',d:['가까운 적을 모두 태움','灼烧近处所有敌人']},
 frostfan:{n:['냉풍실','冷风室'],ic:'icw7',kind:'aura',dmg:6,cd:.25,rng:250,slow:.45,col:'c',d:['주변 적 이동 속도 45% 감소','周围敌人减速45%']},
 netgun:{n:['그물총실','网枪室'],ic:'icc9',kind:'net',dmg:14,cd:2.1,rng:350,stun:2.2,col:'w',d:['그물로 묶어 2초 정지','用网束缚2秒']},
 drain:{n:['물대포실','水炮室'],ic:'icw4',kind:'line',dmg:16,cd:1.5,rng:330,push:42,ground:true,col:'b',d:['땅 위 한 줄을 밀어냄','冲退地面一整排']},
 siren:{n:['사이렌실','警笛室'],ic:'icw10',kind:'pulse',dmg:12,cd:4.6,rng:250,push:70,stun:.6,col:'y',d:['음파로 밀치고 기절','声波击退并眩晕']},
 sniper:{n:['저격실','狙击室'],ic:'icw13',kind:'snipe',dmg:150,cd:2.6,rng:2000,col:'w',d:['가장 강한 적을 한 방','一枪命中最强敌人']},
 minelift:{n:['지뢰실','地雷室'],ic:'icw9',kind:'mine',dmg:70,cd:2.8,rng:260,aoe:62,ground:true,col:'o',d:['탑 앞에 지뢰를 깜','在塔前布设地雷']},
 drones:{n:['드론실','无人机室'],ic:'icw14',kind:'drone',dmg:11,cd:.7,rng:2000,n2:2,col:'c',d:['드론 2대가 어디든 추격','2架无人机全场追击']},
 frostnade:{n:['냉동탄실','冷冻弹室'],ic:'icw6',kind:'arc',dmg:18,cd:3.4,rng:400,aoe:82,freeze:1.4,col:'c',d:['범위 빙결 1.4초','范围冰冻1.4秒']},
 barrel:{n:['폭탄통실','炸药桶室'],ic:'icw3',kind:'roll',dmg:92,cd:4,rng:420,aoe:84,ground:true,col:'r',d:['굴러가 터지는 드럼통','滚动爆炸的油桶']},
 radio:{n:['무전실','无线电室'],ic:'icm5',kind:'eco',dmg:60,cd:24,rng:2000,aoe:90,col:'y',d:['부품 +30% · 주기적 폭격 지원','零件+30% · 定期空袭支援']}};
const ROOM_KEYS=Object.keys(ROOMS);
// 방 해금 순서 (클리어 수 기준)
const ROOM_UNLOCK={turret:0,crossbow:0,mortar:0,flamer:0,frostfan:0,netgun:1,drain:2,siren:3,sniper:4,minelift:6,drones:7,frostnade:8,barrel:9,radio:10};
// 융합 12종: 위아래로 붙은 두 방(둘 다 Lv2 이상)
const FUSE=[
 {id:1,a:'drain',b:'radio',n:['감전 물대포','感电水炮'],kind:'line',dmg:42,cd:1.3,rng:400,push:50,chain:3,ground:true,col:'c'},
 {id:2,a:'siren',b:'flamer',n:['음파 화염포','声波火焰炮'],kind:'cone',dmg:72,cd:.12,rng:270,burn:16,pulse:3,col:'o'},
 {id:3,a:'frostnade',b:'mortar',n:['빙결 박격포','冰封迫击炮'],kind:'arc',dmg:96,cd:2.2,rng:620,aoe:104,freeze:1.5,ground:true,col:'c'},
 {id:4,a:'sniper',b:'drones',n:['독수리 저격대','猎鹰狙击台'],kind:'snipe',dmg:340,cd:1.7,rng:2000,n2:1,col:'w'},
 {id:5,a:'siren',b:'minelift',n:['음파 지뢰 공장','声波地雷工厂'],kind:'mine',dmg:96,cd:1.1,rng:300,aoe:70,stun:.6,ground:true,col:'y'},
 {id:6,a:'frostfan',b:'drain',n:['빙하 폭포','冰川瀑布'],kind:'wave',dmg:38,cd:2.4,rng:420,push:80,slow:.5,ground:true,col:'b'},
 {id:7,a:'radio',b:'mortar',n:['전격 캐논','电击加农炮'],kind:'arc',dmg:130,cd:2.1,rng:640,aoe:112,chain:3,col:'c'},
 {id:8,a:'frostnade',b:'crossbow',n:['빙결 석궁','冰封弩炮'],kind:'pierce',dmg:84,cd:.85,rng:440,freeze:.8,col:'c'},
 {id:9,a:'flamer',b:'turret',n:['화염 개틀링','火焰加特林'],kind:'shot',dmg:12,cd:.1,rng:320,burn:6,col:'o'},
 {id:10,a:'frostfan',b:'turret',n:['냉기 대포','寒气机炮'],kind:'shot',dmg:15,cd:.13,rng:350,slow:.4,col:'c'},
 {id:11,a:'drones',b:'netgun',n:['드론 그물 편대','无人机网队'],kind:'drone',dmg:17,cd:.55,rng:2000,n2:4,stun:.9,col:'c'},
 {id:12,a:'barrel',b:'flamer',n:['화염 드럼 발사기','火焰油桶发射器'],kind:'roll',dmg:125,cd:1.8,rng:460,aoe:100,fire:3,ground:true,col:'r'}];
function fuseOf(a,b){return FUSE.find(f=>(f.a===a&&f.b===b)||(f.a===b&&f.b===a))}
// 적: hp/spd/dps(요새 공격)/scrap(부품)/s(크기)
const ZT={
 scout:{n:['정찰형','侦察型'],hp:34,spd:64,dps:6,scrap:3,s:0.50,d:['빠르지만 약하다','速度快但很脆弱']},
 faker:{n:['일반 감염체','普通感染体'],hp:62,spd:38,dps:8,scrap:4,s:0.56,d:['가장 흔한 감염체','最常见的感染体']},
 climber:{n:['등반형','攀爬型'],hp:82,spd:46,dps:11,scrap:5,s:0.51,climb:1,d:['탑 벽을 타고 위층을 공격','沿塔墙攀爬攻击高层']},
 flyer:{n:['포자 머리','孢子头'],hp:30,spd:56,dps:6,scrap:3,s:0.34,fly:1,d:['날아다님 · 땅 전용 무기로는 못 맞힘','会飞 · 地面武器打不到']},
 bulwark:{n:['방패형','盾牌型'],hp:150,shield:150,spd:30,dps:10,scrap:7,s:0.62,d:['문짝 방패가 먼저 피해를 막는다','门板盾牌先吸收伤害']},
 howler:{n:['울부짖는 형','嚎叫型'],hp:110,spd:34,dps:8,scrap:6,s:0.58,howl:1,d:['울음소리로 주변을 빠르게 만든다','嚎叫让周围同伴加速']},
 crawler:{n:['기는 형','爬行型'],hp:48,spd:74,dps:7,scrap:4,s:0.40,d:['낮게 빠르게 기어 온다','贴地快速爬行']},
 burrower:{n:['굴착형','掘地型'],hp:120,spd:44,dps:12,scrap:7,s:0.56,burrow:1,d:['땅속으로 숨어 탑 앞에서 튀어나온다','钻入地下，在塔前钻出']},
 echo:{n:['메아리형','回声型'],hp:130,spd:36,dps:9,scrap:7,s:0.58,split:1,d:['쓰러지면 포자 머리 2마리가 나온다','倒下时分裂出2个孢子头']},
 bloater:{n:['팽창형','膨胀型'],hp:260,spd:22,dps:0,scrap:10,s:0.69,bloat:1,d:['탑에 닿으면 터져 큰 피해 · 미리 잡으면 주변 적에게 폭발','碰到塔会自爆 · 提前击杀会炸伤周围敌人']},
 stacker:{n:['적층형','堆叠型'],hp:320,spd:25,dps:14,scrap:12,s:0.74,d:['단단하고 아프게 때린다','皮糙肉厚，攻击很痛']},
 conductor:{n:['지휘자 (보스)','指挥者（首领）'],hp:2400,spd:16,dps:40,scrap:120,s:1.24,boss:1,d:['정찰형을 부르고 주변을 강화한다','召唤侦察型并强化周围']}};
const CH=[
 {n:['1장 · 버섯 초원','第1章 · 蘑菇草原'],col:'#9fe07a',pool:['faker','scout','climber','flyer'],intro:[0,0,2,3]},
 {n:['2장 · 녹슨 항구','第2章 · 锈蚀港口'],col:'#8fd0ff',pool:['faker','scout','climber','flyer','bulwark','howler','crawler'],intro:[0,0,0,0,0,1,2]},
 {n:['3장 · 눈 덮인 고개','第3章 · 雪岭'],col:'#cfe6ff',pool:['faker','scout','climber','flyer','bulwark','howler','crawler','burrower','echo'],intro:[0,0,0,0,0,0,0,0,1]},
 {n:['4장 · 버려진 광산','第4章 · 废弃矿山'],col:'#ffc07a',pool:['faker','scout','climber','flyer','bulwark','howler','crawler','burrower','echo','bloater','stacker'],intro:[0,0,0,0,0,0,0,0,0,0,1]}];
const SPC=6,STAGE_N=CH.length*SPC;
function stageInfo(s){const ch=Math.floor(s/SPC),k=s%SPC;return {ch,k,boss:k===SPC-1,waves:Math.min(9,5+Math.floor(s/5)+(k===SPC-1?1:0)),label:(ch+1)+'-'+(k+1)}}
function hpK(s){return 1+.2*s+.008*s*s}
// 운영자(동료) 6명: 전투 중 스킬 1개
const OPS={
 eng:{n:['공병 강토','工兵阿刚'],face:'op_engineer',sk:['긴급 수리','紧急修理'],d:['요새 내구도 30% 회복','恢复30%堡垒耐久'],cd:42,unlock:0,cost:0},
 gun:{n:['사수 윤호','枪手阿浩'],face:'op_gunner',sk:['일제 사격','齐射'],d:['7초간 모든 방 공격 속도 2배','7秒内所有房间攻速翻倍'],cd:44,unlock:2,cost:120},
 fla:{n:['화염병 마루','火焰兵阿玛'],face:'op_flamer',sk:['화염 장벽','火焰墙'],d:['탑 양쪽에 6초간 불의 벽','塔两侧燃起6秒火墙'],cd:40,unlock:5,cost:180},
 sco:{n:['정찰병 하늘','侦察兵小天'],face:'op_scout',sk:['약점 표시','弱点标记'],d:['8초간 모든 적이 받는 피해 +60%','8秒内所有敌人受伤+60%'],cd:40,unlock:8,cost:240},
 med:{n:['의무병 소이','医疗兵小怡'],face:'op_medic',sk:['방호막','防护罩'],d:['6초 무적 + 내구도 12% 회복','6秒无敌并恢复12%耐久'],cd:50,unlock:11,cost:300},
 sni:{n:['저격수 세린','狙击手赛琳'],face:'op_sniper',sk:['정밀 저격','精准狙击'],d:['가장 강한 적 5명에게 큰 피해','对最强的5名敌人造成重创'],cd:34,unlock:14,cost:360}};
const OP_KEYS=Object.keys(OPS);
// 연구소 (결정으로 영구 강화)
const LAB=[
 {k:'hp',ic:'icr5',n:['요새 장갑','堡垒装甲'],d:['최대 내구도 +12%','最大耐久+12%'],max:10},
 {k:'dmg',ic:'icc6',n:['화력 증폭','火力增幅'],d:['모든 방 피해 +8%','所有房间伤害+8%'],max:10},
 {k:'scrap',ic:'icm0',n:['시작 부품','初始零件'],d:['시작 부품 +35','初始零件+35'],max:6},
 {k:'floor',ic:'icm9',n:['기초 공사','基础工程'],d:['시작 층 +1 (빈 방)','初始楼层+1（空房间）'],max:2},
 {k:'luck',ic:'icm4',n:['보급 행운','补给好运'],d:['카드 선택지 +1 (3단계)','3级时卡片选项+1'],max:3},
 {k:'fuse',ic:'icc0',n:['융합 연구','融合研究'],d:['융합 방 피해 +12%','融合房间伤害+12%'],max:6},
 {k:'repair',ic:'icr2',n:['정비반','维修班'],d:['웨이브마다 내구도 3% 회복','每波恢复3%耐久'],max:5},
 {k:'loot',ic:'icm1',n:['결정 채굴','晶体开采'],d:['결정 획득 +10%','晶体获得+10%'],max:8}];
function labLv(k){return save.lab[k]||0}
function labCost(it){const lv=labLv(it.k);return Math.round(40*Math.pow(lv+1,1.45)*(it.k==='floor'?3:it.k==='luck'?2.2:1))}
// 이번 판 강화 카드(유물)
const PERKS=[
 {k:'ammo',ic:'icc6',n:['강화 탄약','强化弹药'],d:['모든 피해 +15%','所有伤害+15%']},
 {k:'rate',ic:'icc10',n:['고속 장전','高速装填'],d:['공격 속도 +12%','攻击速度+12%']},
 {k:'armor',ic:'icr5',n:['장갑판','装甲板'],d:['최대 내구도 +20% · 20% 회복','最大耐久+20% · 恢复20%']},
 {k:'magnet',ic:'icm0',n:['부품 자석','零件磁铁'],d:['부품 획득 +25%','零件获得+25%']},
 {k:'cold',ic:'icc5',n:['냉기 코팅','冷气涂层'],d:['모든 공격이 1초간 15% 감속','所有攻击减速15%持续1秒']},
 {k:'chain',ic:'icc11',n:['연쇄 반응','连锁反应'],d:['처치 시 15% 확률로 폭발','击杀时15%几率爆炸']},
 {k:'scope',ic:'icc3',n:['쌍안경','望远镜'],d:['사거리 +15%','射程+15%']},
 {k:'kit',ic:'icm9',n:['정비 키트','维修工具'],d:['방 강화 비용 -20%','房间强化费用-20%']},
 {k:'cry',ic:'icm1',n:['결정 탐지기','晶体探测器'],d:['이번 판 결정 +30%','本局晶体+30%']}];
// 일일 미션
const MISSIONS=[
 {k:'kill',goal:200,n:['감염체 200마리 처치','击杀200个感染体'],r:30},{k:'clear',goal:2,n:['스테이지 2회 클리어','通关2次'],r:35},{k:'fuse',goal:1,n:['융합 1회 성공','完成1次融合'],r:30},
 {k:'upgrade',goal:12,n:['방 강화 12회','强化房间12次'],r:25},{k:'skill',goal:4,n:['동료 스킬 4회 사용','使用伙伴技能4次'],r:25},{k:'flyer',goal:30,n:['포자 머리 30마리 처치','击杀30个孢子头'],r:25},
 {k:'stars3',goal:1,n:['별 3개로 클리어','三星通关'],r:40},{k:'crate',goal:2,n:['보급 상자 2개 열기','打开2个补给箱'],r:25}];
const ATT=[30,40,50,60,80,100,180];
// ---------------------------------------------------------------- 전투
let B=null,autoBot=false,dbgFreeze=false;
function floorY(i){return GY-6-RH/2-i*FH}
function rnd(a,b){return a+Math.random()*(b-a)}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function clamp(v,a,b){return v<a?a:v>b?b:v}
function unlockedRooms(){return ROOM_KEYS.filter(k=>save.cleared>=ROOM_UNLOCK[k]||(B&&B.endless))}
function defOf(f){return f.fu?FUSE[f.fu-1]:ROOMS[f.type]}
function startStage(s,endless=false){
 const st=endless?{ch:Math.min(3,Math.floor(save.cleared/SPC)),k:0,boss:false,waves:999,label:'∞'}:stageInfo(s);
 const nF=3+labLv('floor');
 B={s,endless,st,ch:st.ch,wave:0,waves:st.waves,maxHP:Math.round(1000*(1+.12*labLv('hp'))),hp:0,scrap:60+35*labLv('scrap')+(endless?0:s*5),
  floors:[],zs:[],projs:[],parts:[],mines:[],barrels:[],drones:[],pools:[],crates:[],nums:[],chips:[],spawnQ:[],spawnT:0,phase:'draft',draft:null,perks:{},
  buff:{rapid:0,mark:0,shield:0,fire:0},skillCD:8,kills:0,flyKills:0,revived:false,rerolled:false,t:0,gapT:0,airT:0,crateT:rnd(25,40),fused:0,ups:0,skills:0,crates2:0,done:false,result:null,tut:save.firstPlay&&!endless&&s===0,tutStep:0,dmgTaken:0,bossOn:false};
 B.hp=B.maxHP;
 for(let i=0;i<nF;i++)B.floors.push({type:null,fu:0,lv:0,cd:rnd(0,.3),face:1,t:0,flash:0,aim:0,dr:[]});
 B.floors[0].type='turret';B.floors[0].lv=endless?2:1+Math.floor(s/8);B.initPicks=endless?3:1+Math.floor(s/6);B.initTot=B.initPicks;B.startLv=endless?2:1+Math.floor(s/8);
 sc='battle';paused=false;speed=1;openDraft(true);
 track('stage_start',{stage:endless?'endless':st.label});if(B.tut)track('tutorial',{step:'start'});
}
// ---------- 카드(보급) 뽑기
function openDraft(first){const n=3+(labLv('luck')>=3?1:0);B.draft={opts:makeCards(first,n),t:0,first};B.phase='draft';AudioFx.cue('card')}
function emptyIdx(){return B.floors.findIndex(f=>!f.type&&!f.fu)}
function makeCards(first,n){const out=[],rooms=unlockedRooms(),has=emptyIdx()>=0;
 // 융합 짝이 맞는 방을 우선
 const partner=[];B.floors.forEach(f=>{if(f.type&&!f.fu)FUSE.forEach(F=>{if(F.a===f.type&&rooms.includes(F.b))partner.push(F.b);if(F.b===f.type&&rooms.includes(F.a))partner.push(F.a)})});
 const used=new Set();const add=c=>{const key=c.k+':'+(c.room||c.perk||c.fl);if(used.has(key))return false;used.add(key);out.push(c);return true};
 if(first){let tries=0;const pref=['crossbow','mortar','flamer','frostfan','turret'];const firstEver=B.initPicks===B.initTot&&!B.endless;while(out.length<n&&tries++<50)add({k:'room',room:firstEver&&tries<4?pref[tries-1]:(partner.length&&Math.random()<.5?pick(partner):pick(rooms))});return out}
 let tries=0;
 while(out.length<n&&tries++<80){const r=Math.random();
  if(has&&r<.42){const rm=partner.length&&Math.random()<.55?pick(partner):pick(rooms);add({k:'room',room:rm})}
  else if(!has&&B.floors.length<MAXF&&r<.3)add({k:'floor'});
  else if(r<.72){const ups=B.floors.map((f,i)=>i).filter(i=>(B.floors[i].type||B.floors[i].fu)&&B.floors[i].lv<5);if(ups.length)add({k:'up',fl:pick(ups)})}
  else if(B.hp<B.maxHP*.7&&Math.random()<.5)add({k:'heal'});
  else add({k:'perk',perk:pick(PERKS).k})}
 return out}
function cardTitle(c){if(c.k==='room')return LL(ROOMS[c.room].n);if(c.k==='up'){const f=B.floors[c.fl];return LL(defOf(f).n)+' Lv'+(f.lv+1)}if(c.k==='perk')return LL(PERKS.find(p=>p.k===c.perk).n);if(c.k==='floor')return L('증축','扩建');return L('긴급 보수','紧急维修')}
function cardDesc(c){if(c.k==='room'){let d=LL(ROOMS[c.room].d);const fl=bestFloorFor(c.room);const F=fl.fuse;if(F)d+='\n'+L('★ 융합 가능: ','★ 可融合：')+LL(F.n);return d}
 if(c.k==='up'){const f=B.floors[c.fl];return L('피해·속도 상승 (','伤害·速度提升（')+(c.fl+1)+L('층)','层）')}
 if(c.k==='perk')return LL(PERKS.find(p=>p.k===c.perk).d);if(c.k==='floor')return L('빈 층을 하나 더 올립니다','再加盖一层空房间');return L('내구도 35% 회복','恢复35%耐久')}
function cardIcon(c){if(c.k==='room')return ROOMS[c.room].ic;if(c.k==='up'){const f=B.floors[c.fl];return f.fu?'icc0':ROOMS[f.type].ic}if(c.k==='perk')return PERKS.find(p=>p.k===c.perk).ic;if(c.k==='floor')return 'icm9';return 'icr5'}
function cardFrame(c){return c.k==='room'?'card2':c.k==='up'||c.k==='floor'?'card1':'card0'}
// 빈 층 중 융합 짝 옆자리를 우선
function bestFloorFor(type){let best=-1,F=null;for(let i=0;i<B.floors.length;i++){const f=B.floors[i];if(f.type||f.fu)continue;if(best<0)best=i;for(const j of[i-1,i+1]){const o=B.floors[j];if(o&&o.type&&!o.fu){const ff=fuseOf(type,o.type);if(ff&&!F){F=ff;best=i}}}}return {i:best,fuse:F}}
function applyCard(c){const d=B.draft;if(!d)return;
 if(c.k==='room'){let i=bestFloorFor(c.room).i;if(i<0){if(B.floors.length<MAXF){B.floors.push(newFloor());i=B.floors.length-1}else return}const f=B.floors[i];f.type=c.room;f.lv=d.first?B.startLv:1;f.flash=1;spawnBuildFx(i)}
 else if(c.k==='up'){const f=B.floors[c.fl];if(f){f.lv=Math.min(5,f.lv+1);f.flash=1;spawnBuildFx(c.fl)}}
 else if(c.k==='perk'){B.perks[c.perk]=(B.perks[c.perk]||0)+1;if(c.perk==='armor'){B.maxHP=Math.round(B.maxHP*1.2);B.hp=Math.min(B.maxHP,B.hp+B.maxHP*.2)}}
 else if(c.k==='floor'){B.floors.push(newFloor());spawnBuildFx(B.floors.length-1)}
 else if(c.k==='heal'){B.hp=Math.min(B.maxHP,B.hp+B.maxHP*.35)}
 AudioFx.cue('build');vib('light');const wasFirst=d.first;B.draft=null;
 if(B.tut&&B.tutStep===0){B.tutStep=1;track('tutorial',{step:'card'})}
 if(wasFirst&&B.initPicks>1&&emptyIdx()>=0){B.initPicks--;openDraft(true);return}
 startWave()}
function newFloor(){return {type:null,fu:0,lv:0,cd:0,face:1,t:0,flash:1,aim:0,dr:[]}}
function spawnBuildFx(i){const y=floorY(i);for(let k=0;k<14;k++)addP({img:pick(['pr6','pr7','pr8']),x:TX+rnd(-110,110),y:y+rnd(-30,30),vx:rnd(-160,160),vy:rnd(-300,-80),g:900,life:.9,s:rnd(18,30),rot:rnd(0,6),vr:rnd(-8,8)});addP({glow:'y',x:TX,y,life:.4,s:140,add:1,a:.4})}
// ---------- 웨이브
function waveCount(s,w){return Math.round((6+s*.95+w*2.3+(B.endless?w*.6:0))*(w===0?.55:1))}
function startWave(){B.wave++;B.phase='wave';B.waveT=0;const s=B.endless?Math.min(30,4+B.wave*.9):B.s,w=B.wave-1;
 const C=CH[B.ch],pool=[];const k=B.endless?99:B.st.k;
 C.pool.forEach((t,i)=>{if(C.intro[i]<=k){const wt=t==='faker'?5:t==='scout'?3:t==='flyer'?(k>=3?2.2:1.4):ZT[t].hp>200?1.1:1.8;pool.push([t,wt])}});
 // 새로 등장하는 적은 첫 판에 확실히 보이게
 const n=waveCount(s,w);const tot=pool.reduce((a,b)=>a+b[1],0);B.spawnQ=[];
 for(let i=0;i<n;i++){let r=Math.random()*tot,t='faker';for(const [tt,wt] of pool){r-=wt;if(r<=0){t=tt;break}}B.spawnQ.push(t)}
 C.intro.forEach((iv,i)=>{if(!B.endless&&iv===k&&k>0&&w===0){const t=C.pool[i];if(ZT[t].hp>=250)B.spawnQ.splice(Math.floor(B.spawnQ.length/2),0,t);else B.spawnQ.splice(2,0,t,t)}});
 const last=!B.endless&&B.wave===B.waves;if((last&&B.st.boss)||(B.endless&&B.wave%5===0)){B.spawnQ.splice(Math.min(4,B.spawnQ.length),0,'conductor');B.bossOn=true}
 B.spawnGap=Math.max(.3,1.4-s*.035-w*.05)*(w===0?1.7:1);B.spawnT=.6;
 if(B.wave===1)message(L('감염체가 몰려온다!','感染体来袭！'),1.6);else message(L('웨이브 ','第 ')+B.wave+(B.endless?'':' / '+B.waves)+L('',' 波'),1.2);
 if(B.wave>1&&labLv('repair'))B.hp=Math.min(B.maxHP,B.hp+B.maxHP*.03*labLv('repair'))}
function spawnZ(type,side){const T=ZT[type];const s=B.endless?Math.min(30,4+B.wave*.9):B.s;const dir=side<0?1:-1;
 const z={type,x:side<0?-70:W+70,y:GY+rnd(-4,10),dir,hp:T.hp*hpK(s)*waveK(),shield:(T.shield||0)*hpK(s)*waveK()*.7,spd:T.spd*rnd(.92,1.08),dps:T.dps*(1+s*.045),s:T.s*rnd(.96,1.04),t:rnd(0,9),state:'walk',slowT:0,slowA:0,stunT:0,frzT:0,burnT:0,burnD:0,hitT:0,buffT:0,markT:0,howlT:rnd(2,5),sumT:6,alt:0,climbTo:0,id:Math.random()};
 if(T.boss){z.hp*=(1+B.ch*.12)*.85;z.s=T.s;z.x=side<0?-120:W+120}
 z.max=z.hp;z.smax=z.shield;
 if(T.fly){const top=floorY(B.floors.length-1)-30;z.alt=rnd(Math.max(260,top),GY-170);z.y=z.alt;z.var=Math.floor(Math.random()*3);z.state='fly'}
 if(!save.seenZ[type]){save.seenZ[type]=1;if(!B.endless&&B.wave>0&&type!=='faker'){B.newZ=type;B.newZT=3}}
 B.zs.push(z);return z}
function waveK(){if(B.endless)return .6+.08*B.wave+.002*B.wave*B.wave;return .55+.6*Math.max(0,B.wave-1)/Math.max(1,B.waves-1)}
function edgeX(z){return TX-z.dir*(RW/2-4+(z.type==='conductor'?70:44*z.s))}
// ---------- 데미지
function dmgMul(){let m=(1+.08*labLv('dmg'))*(1+.15*(B.perks.ammo||0));return m}
function hurt(z,d,o){if(z.dead||z.state==='under')return;if(B.buff.mark>0)d*=1.6;if(o&&o.cold||B.perks.cold){z.slowT=Math.max(z.slowT,1);z.slowA=Math.max(z.slowA,.15)}
 if(z.shield>0){const a=Math.min(z.shield,d*.85);z.shield-=a;d-=a;if(z.shield<=0){z.shield=0;addP({img:'kb0',x:z.x,y:z.y-50*z.s,vx:-z.dir*120,vy:-260,g:900,life:1.1,s:46*z.s*1.6,rot:0,vr:-z.dir*6});AudioFx.cue('hit',.8)}}
 z.hp-=d;z.hitT=.09;if(d>=70)B.nums.push({x:z.x+rnd(-10,10),y:z.y-120*z.s,v:Math.round(d),t:0,big:d>=200});
 if(z.hp<=0)kill(z)}
function kill(z){if(z.dead)return;z.dead=true;const T=ZT[z.type];
 const mult=(1+.25*(B.perks.magnet||0))*(1+radioBonus());B.scrap+=Math.round(T.scrap*mult);B.kills++;save.stats.kills=(save.stats.kills||0)+1;mission('kill');if(T.fly){B.flyKills++;mission('flyer')}
 const by=z.state==='fly'?z.y:z.y-50*z.s;
 addP({img:save.mild?'fx10':pick(['fz0','fx9']),x:z.x,y:by,life:.55,s:120*z.s+40,rot:rnd(0,6),add:save.mild?1:0,fade:1,grow:.6});
 for(let k=0;k<6;k++)addP({glow:save.mild?'t':'p',x:z.x+rnd(-20,20),y:by+rnd(-20,20),vx:rnd(-120,120),vy:rnd(-200,-40),g:400,life:.6,s:rnd(10,22),add:1});
 AudioFx.cue('splat',.6,.04);
 if(T.split)for(let k=0;k<2;k++){const f=spawnZ('flyer',z.dir>0?-1:1);f.x=z.x+rnd(-20,20);f.alt=f.y=clamp(z.y-80-k*50,260,GY-150)}
 if(T.bloat){blast(z.x,z.y-40,110,60*hpK(B.s)*.5,'fz0',true);}
 if(B.perks.chain&&Math.random()<.15*B.perks.chain)blast(z.x,by,75,40*dmgMul(),'fx4',false);
 if(T.boss){B.bossOn=B.zs.some(o=>!o.dead&&o!==z&&ZT[o.type].boss);shake=14;flash=.5;AudioFx.cue('boom');vib('long');for(let k=0;k<8;k++)addP({img:'fx4',x:z.x+rnd(-80,80),y:z.y-rnd(40,200),life:.7,s:rnd(120,200),add:1,fade:1,grow:.4,delay:k*.08})}}
function blast(x,y,r,d,fx,zonly){addP({img:fx||'fx4',x,y,life:.5,s:r*2.2,add:1,fade:1,grow:.5});addP({glow:'o',x,y,life:.3,s:r*2,add:1});
 for(const z of B.zs)if(!z.dead&&Math.hypot(z.x-x,(z.state==='fly'?z.y:z.y-40*z.s)-y)<r+20*z.s)hurt(z,d);shake=Math.max(shake,5);AudioFx.cue('boom',.7,.08)}
function radioBonus(){let b=0;for(const f of B.floors)if(f.type==='radio')b+=.3+.1*(f.lv-1);else if(f.fu===1||f.fu===7)b+=.3;return b}
// ---------- 방 공격
function roomStat(f){const D=defOf(f),lv=f.lv;let dmg=D.dmg*(1+.42*(lv-1))*dmgMul()*(f.fu?1+.12*labLv('fuse'):1);
 let rate=(1+.09*(lv-1))*(1+.12*(B.perks.rate||0))*(B.buff.rapid>0?2:1);const rng=D.rng*(1+.04*(lv-1))*(1+.15*(B.perks.scope||0));return {D,dmg,cd:D.cd/rate,rng}}
function bodyY(z){return z.state==='fly'?z.y:z.state==='climb'||z.state==='hang'?z.y-50*z.s:z.y-55*z.s}
function inRange(z,x,y,r,ground){if(z.dead||z.state==='under')return false;if(ground&&z.state==='fly')return false;if(ground&&(z.state==='climb'||z.state==='hang')&&z.y<GY-40)return false;return Math.hypot(z.x-x,bodyY(z)-y)<=r}
function targets(i,r,ground){const y=floorY(i);return B.zs.filter(z=>inRange(z,TX,y,r,ground))}
function nearest(list){let b=null,bd=1e9;for(const z of list){const d=Math.abs(z.x-TX)+(ZT[z.type].boss?-40:0);if(d<bd){bd=d;b=z}}return b}
function muzzle(i,side){return {x:TX+side*RW*.44,y:floorY(i)+8}}
function roomTick(i,dt){const f=B.floors[i];if(!f.type&&!f.fu)return;f.t+=dt;if(f.flash>0)f.flash-=dt*2;const S=roomStat(f),D=S.D;f.cd-=dt;
 // 드론은 항상 날아다님
 if(D.kind==='drone'){const n=(D.n2||2)+(f.lv>=4?1:0);while(f.dr.length<n)f.dr.push({x:TX,y:floorY(i),cd:rnd(0,.5),tg:null,ph:rnd(0,6)});for(const d of f.dr)droneTick(d,i,S,dt);return}
 if(D.kind==='snipe'&&D.n2){const d=f.dr[0]||(f.dr[0]={x:TX,y:floorY(i),cd:0,tg:null,ph:0});droneTick(d,i,{D:{dmg:30},dmg:S.dmg*.12,cd:.5,rng:2000},dt)}
 if(D.kind==='eco'){if(f.cd<=0){f.cd=Math.max(10,S.cd-2*(f.lv-1));airstrike(S.dmg*hpK(B.s)*.6)}return}
 if(f.cd>0)return;
 const list=targets(i,S.rng,D.ground);if(!list.length){if(D.kind==='aura'||D.kind==='cone')f.cd=.15;return}
 let tg=D.kind==='snipe'?list.reduce((a,b)=>b.hp>a.hp?b:a):nearest(list);const side=tg.x<TX?-1:1;f.face=side;f.aim=.2;const m=muzzle(i,side);f.cd=S.cd;
 switch(D.kind){
  case 'shot':B.projs.push({k:'bul',x:m.x,y:m.y,tg,sp:1500,dmg:S.dmg,o:D,col:D.col});AudioFx.cue('gun',.35,.07);addP({img:'fx11',x:m.x+side*14,y:m.y,life:.07,s:52,add:1,flip:side<0});break;
  case 'pierce':{const a=Math.atan2(bodyY(tg)-m.y,tg.x-m.x);B.projs.push({k:'arrow',x:m.x,y:m.y,vx:Math.cos(a)*900,vy:Math.sin(a)*900,a,left:S.rng+60,dmg:S.dmg,o:D,hit:new Set()});AudioFx.cue('bow',.5);break}
  case 'arc':{const tx=tg.x+(tg.state==='walk'?tg.dir*tg.spd*.5:0),ty=D.ground?tg.y:bodyY(tg);B.projs.push({k:'shell',x:m.x,y:m.y-10,sx:m.x,sy:m.y-10,tx,ty,t:0,T:.75,dmg:S.dmg,o:D,img:D.freeze?'pr4':'pr1'});AudioFx.cue('bow',.3);break}
  case 'cone':{const hitL=list.filter(z=>Math.sign(z.x-TX)===side);for(const z of hitL){hurt(z,S.dmg*S.cd,D);z.burnT=2.5;z.burnD=D.burn*dmgMul()}
   for(let k=0;k<2;k++)addP({img:'fx3',x:m.x+side*rnd(10,40),y:m.y+rnd(-6,6),vx:side*rnd(380,520),vy:rnd(-40,40),life:S.rng/450,s:rnd(50,80),add:1,flip:side<0,grow:1.2,fade:1});AudioFx.cue('flame',.35,.25);
   if(D.pulse){f.pt=(f.pt||0)+S.cd;if(f.pt>=D.pulse){f.pt=0;pulse(i,S,{push:60,stun:.4,dmg:S.dmg*.5})}}break}
  case 'aura':for(const z of list){z.slowT=.5;z.slowA=Math.max(z.slowA,D.slow);hurt(z,S.dmg*S.cd,D)}if(Math.random()<.5)addP({img:'fx6',x:m.x+side*rnd(20,120),y:m.y+rnd(-30,30),vx:side*200,vy:rnd(-30,30),life:.6,s:rnd(30,50),add:1,fade:1});f.cd=.25;break;
  case 'net':B.projs.push({k:'net',x:m.x,y:m.y,tg,sp:700,dmg:S.dmg,o:D,stun:D.stun});AudioFx.cue('net',.6);break;
  case 'line':waterLine(i,side,S,D);break;
  case 'wave':waterLine(i,-1,S,D);waterLine(i,1,S,D);break;
  case 'pulse':pulse(i,S,D);break;
  case 'snipe':{hurt(tg,S.dmg,D);B.projs.push({k:'tracer',x:m.x,y:m.y,x2:tg.x,y2:bodyY(tg),t:.12});addP({img:'fx11',x:m.x+side*16,y:m.y,life:.1,s:70,add:1,flip:side<0});AudioFx.cue('gun',.9);shake=Math.max(shake,2);break}
  case 'mine':{const n=B.mines.length;if(n<14){const sd=Math.random()<.5?-1:1,mx=TX+sd*(RW/2+rnd(40,S.rng));B.projs.push({k:'mineDrop',x:m.x,y:m.y,sx:muzzle(i,sd).x,sy:m.y,tx:mx,ty:GY+4,t:0,T:.55,dmg:S.dmg,o:D})}break}
  case 'roll':B.barrels.push({x:TX+side*(RW/2-10),y:GY,dir:side,dist:0,max:S.rng,dmg:S.dmg,o:D,rot:0,drop:floorY(i)+30,vy:0});AudioFx.cue('ui',.4);break}
}
function droneTick(d,i,S,dt){d.ph+=dt*3;d.cd-=dt;if(!d.tg||d.tg.dead||d.tg.state==='under'){const list=B.zs.filter(z=>!z.dead&&z.state!=='under');d.tg=list.length?list[Math.floor(Math.random()*list.length)]:null}
 let tx,ty;if(d.tg){tx=d.tg.x-d.tg.dir*-60+Math.cos(d.ph)*40;ty=bodyY(d.tg)-80+Math.sin(d.ph*1.3)*20}else{tx=TX+Math.cos(d.ph)*(RW*.6);ty=floorY(i)-60+Math.sin(d.ph)*20}
 ty=Math.max(140,ty);d.x+=(tx-d.x)*Math.min(1,dt*3);d.y+=(ty-d.y)*Math.min(1,dt*3);
 if(d.tg&&d.cd<=0&&Math.hypot(d.tg.x-d.x,bodyY(d.tg)-d.y)<220){d.cd=S.cd;hurt(d.tg,S.dmg,S.D);if(S.D.stun&&Math.random()<.35)d.tg.stunT=Math.max(d.tg.stunT,S.D.stun);B.projs.push({k:'tracer',x:d.x,y:d.y+6,x2:d.tg.x,y2:bodyY(d.tg),t:.07,col:'#9ff0ff'});AudioFx.cue('drone',.25,.15)}}
function waterLine(i,side,S,D){const x0=TX+side*RW/2;for(const z of B.zs){if(z.dead||z.state==='fly'||z.state==='under')continue;if((z.state==='climb'||z.state==='hang')&&z.y<GY-40)continue;const dx=(z.x-x0)*side;if(dx>=-30&&dx<=S.rng){hurt(z,S.dmg,D);if(!ZT[z.type].boss)push(z,D.push);if(D.slow){z.slowT=2;z.slowA=Math.max(z.slowA,D.slow)}}}
 if(D.chain)chain(x0+side*S.rng*.4,GY-40,D.chain,S.dmg*.6);
 addP({img:D.kind==='wave'?'fw3':'fw0',x:x0+side*S.rng/2,y:GY-26,life:.45,w:S.rng,h:60,add:1,fade:1,flip:side<0});addP({img:'fw3',x:x0+side*S.rng,y:GY-40,life:.4,s:120,add:1,fade:1});AudioFx.cue('water',.6)}
function pulse(i,S,D){const y=floorY(i);for(const z of B.zs)if(inRange(z,TX,y,S.rng,false)){hurt(z,D.dmg||S.dmg,D);if(!ZT[z.type].boss){push(z,D.push||60);z.stunT=Math.max(z.stunT,D.stun||.5)}}
 for(const sd of[-1,1])addP({img:'fx7',x:TX+sd*(RW/2+30),y,vx:sd*260,vy:0,life:.6,s:110,add:1,fade:1,flip:sd<0,grow:.8});AudioFx.cue('siren',.5,.3)}
function push(z,d){if(z.state==='climb'||z.state==='hang'){z.state='walk';z.y=GY+rnd(-4,8);}z.x-=z.dir*d;z.x=z.dir>0?Math.max(-80,z.x):Math.min(W+80,z.x);if(z.state==='attack')z.state='walk'}
function chain(x,y,n,d){let px=x,py=y;const hit=new Set();for(let k=0;k<n;k++){let b=null,bd=200;for(const z of B.zs){if(z.dead||hit.has(z)||z.state==='under')continue;const dd=Math.hypot(z.x-px,bodyY(z)-py);if(dd<bd){bd=dd;b=z}}if(!b)break;hit.add(b);hurt(b,d);B.projs.push({k:'bolt',x:px,y:py,x2:b.x,y2:bodyY(b),t:.18});px=b.x;py=bodyY(b)}if(hit.size)AudioFx.cue('zap',.5)}
function airstrike(d){const g2=B.zs.filter(z=>!z.dead&&z.state!=='fly'&&z.state!=='under');if(!g2.length)return;const tg=pick(g2);B.projs.push({k:'bomb',x:tg.x+rnd(-20,20),y:-40,ty:GY-10,vy:0,dmg:d})}
// ---------- 동료 스킬
function useSkill(){if(B.skillCD>0||B.phase==='draft'||paused)return;const k=save.op,O=OPS[k],lv=save.ops[k]||1,pw=1+.1*(lv-1);
 B.skillCD=O.cd*(1-.04*(lv-1));B.skills++;mission('skill');track('skill',{op:k});AudioFx.cue('power');vib('medium');flash=.25;flashCol='255,240,200';
 if(k==='eng'){B.hp=Math.min(B.maxHP,B.hp+B.maxHP*.3*pw);for(let i=0;i<B.floors.length;i++)spawnBuildFx(i)}
 else if(k==='gun')B.buff.rapid=7*pw;
 else if(k==='fla'){B.buff.fire=6*pw;B.fireD=60*dmgMul()*pw*hpK(B.s)*.5}
 else if(k==='sco'){B.buff.mark=8*pw;addP({img:'fz7',x:TX,y:500,life:1,s:260,add:1,fade:1,grow:.3})}
 else if(k==='med'){B.buff.shield=6*pw;B.hp=Math.min(B.maxHP,B.hp+B.maxHP*.12*pw)}
 else if(k==='sni'){const l=B.zs.filter(z=>!z.dead&&z.state!=='under').sort((a,b)=>b.hp-a.hp).slice(0,5);l.forEach((z,n)=>{setTimeoutB(n*.15,()=>{if(z.dead)return;hurt(z,420*dmgMul()*pw*(1+B.s*.08));B.projs.push({k:'tracer',x:TX,y:floorY(B.floors.length-1)-60,x2:z.x,y2:bodyY(z),t:.15});AudioFx.cue('gun');shake=4})})}
 if(B.tut&&B.tutStep===3){B.tutStep=4}}
const timers=[];function setTimeoutB(t,f){timers.push({t,f})}
// ---------- 융합 · 강화 · 증축
function fuseChips(){const out=[];for(let i=0;i+1<B.floors.length;i++){const a=B.floors[i],b=B.floors[i+1];if(a.type&&b.type&&!a.fu&&!b.fu){const F=fuseOf(a.type,b.type);if(F)out.push({i,F,ready:a.lv>=2&&b.lv>=2})}}return out}
function doFuse(ch){const a=B.floors[ch.i],b=B.floors[ch.i+1];if(!ch.ready){message(L('두 방 모두 Lv2 이상이어야 융합돼요','两个房间都需要Lv2以上才能融合'),1.6);return}
 const lv=Math.max(1,Math.floor((a.lv+b.lv)/2)-1);a.fu=ch.F.id;a.type=null;a.lv=lv;a.flash=1.5;a.dr=[];a.cd=.5;b.type=null;b.fu=0;b.lv=0;b.dr=[];b.flash=1;
 B.fused++;save.stats.fuse=(save.stats.fuse||0)+1;mission('fuse');const first=!save.seenFuse[ch.F.id];save.seenFuse[ch.F.id]=1;persist();track('fuse',{id:ch.F.id});
 AudioFx.cue('fuse');vib('heavy');flash=.6;flashCol='160,255,240';shake=8;const y=(floorY(ch.i)+floorY(ch.i+1))/2;
 addP({img:'fx2',x:TX,y,life:.6,s:300,add:1,fade:1,grow:.3});for(let k=0;k<24;k++)addP({glow:pick(['t','c','y']),x:TX+rnd(-120,120),y:y+rnd(-80,80),vx:rnd(-300,300),vy:rnd(-300,300),life:.8,s:rnd(14,30),add:1});
 B.fuseShow={F:ch.F,t:0,first};if(B.tut&&B.tutStep<9){B.tutStep=9}}
function upCost(f){return Math.round((24+20*f.lv)*(1-.2*(B.perks.kit?1:0))*(f.fu?1.5:1))}
function tryUpgrade(i){const f=B.floors[i];if(!f||(!f.type&&!f.fu))return false;if(f.lv>=5){message(L('최대 레벨이에요','已达最高等级'),1);return true}const c=upCost(f);if(B.scrap<c){message(L('부품이 부족해요 ','零件不足 ')+B.scrap+'/'+c,1.2);AudioFx.cue('ui');return true}
 B.scrap-=c;f.lv++;f.flash=1;B.ups++;mission('upgrade');spawnBuildFx(i);AudioFx.cue('build');vib('light');if(B.tut&&B.tutStep===2){B.tutStep=3;track('tutorial',{step:'upgrade'})}return true}
function floorCost(){return 80+70*Math.max(0,B.floors.length-3)}
function tryExpand(){if(B.floors.length>=MAXF){message(L('최대 6층까지 올릴 수 있어요','最多可建6层'),1.2);return}const c=floorCost();if(B.scrap<c){message(L('부품이 부족해요 ','零件不足 ')+B.scrap+'/'+c,1.2);return}B.scrap-=c;B.floors.push(newFloor());spawnBuildFx(B.floors.length-1);AudioFx.cue('build');message(L('빈 층 완성! 다음 보급에서 방을 받으세요','空楼层建好了！下次补给可获得房间'),1.8)}
function openCrate(cr){cr.open=true;B.crates2++;mission('crate');const r=Math.random();if(r<.5){const n=40+B.s*4;B.scrap+=n;message(L('부품 +','零件 +')+n,1.2)}else if(r<.8){B.skillCD=0;message(L('동료 스킬 즉시 충전!','伙伴技能立即充能！'),1.2)}else{B.hp=Math.min(B.maxHP,B.hp+B.maxHP*.15);message(L('내구도 +15%','耐久 +15%'),1.2)}AudioFx.cue('coin');vib('light');for(let k=0;k<10;k++)addP({glow:'y',x:cr.x,y:cr.y,vx:rnd(-200,200),vy:rnd(-300,-50),g:500,life:.7,s:16,add:1})}
// ---------- 파티클
function addP(p){if(B.parts.length>(qualityLow?160:320))B.parts.shift();p.t=0;p.max=p.life;B.parts.push(p)}
// ---------- 한 프레임 진행
function tick(dt){if(!B)return;if(paused||B.result||adShow)return;if(dbgFreeze&&!B.__step)return;
 if(hitStop>0){hitStop-=dt;return}
 const dd=dt*speed;B.t+=dd;frame+=dd;
 for(let k=timers.length-1;k>=0;k--){timers[k].t-=dd;if(timers[k].t<=0){const f=timers[k].f;timers.splice(k,1);f()}}
 if(B.draft){B.draft.t+=dt;if(autoBot&&B.draft.t>.4)botCard();partsTick(dd);return}
 if(B.fuseShow){B.fuseShow.t+=dt;if(B.fuseShow.t>2.2)B.fuseShow=null}
 for(const k in B.buff)if(B.buff[k]>0)B.buff[k]-=dd;if(B.skillCD>0)B.skillCD-=dd;if(B.newZT>0)B.newZT-=dt;
 // 스폰
 if(B.phase==='wave'){B.waveT+=dd;if(B.spawnQ.length){B.spawnT-=dd;if(B.spawnT<=0){const t=B.spawnQ.shift();const side=Math.random()<.5?-1:1;spawnZ(t,side);if(Math.random()<.25&&B.spawnQ.length&&B.wave>1)spawnZ(B.spawnQ.shift(),-side);B.spawnT=B.spawnGap*rnd(.6,1.3)}}
  else if(!B.zs.some(z=>!z.dead)){B.phase='gap';B.gapT=1.2;const bonus=Math.round((18+5*B.wave)*(1+radioBonus()));B.scrap+=bonus;message(L('웨이브 정리! 부품 +','本波清理！零件 +')+bonus,1.4);AudioFx.cue('coin')}}
 if(B.phase==='gap'){B.gapT-=dd;if(B.gapT<=0){if(!B.endless&&B.wave>=B.waves){stageWin();return}openDraft(false);if(B.tut&&B.tutStep===1&&B.wave>=1)B.tutStep=2}}
 // 보급 상자
 B.crateT-=dd;if(B.crateT<=0&&B.phase==='wave'){B.crateT=rnd(30,48);B.crates.push({x:rnd(80,W-80),y:-60,open:false,t:0,landed:false})}
 for(const cr of B.crates){cr.t+=dd;if(!cr.landed){cr.y+=dd*90;if(cr.y>=GY-20){cr.y=GY-20;cr.landed=true}}if(cr.landed&&cr.t>30)cr.open=true}
 B.crates=B.crates.filter(c=>!c.open);
 // 방
 for(let i=0;i<B.floors.length;i++)roomTick(i,dd);
 // 불의 벽
 if(B.buff.fire>0){for(const z of B.zs)if(!z.dead&&z.state!=='fly'&&Math.abs(Math.abs(z.x-TX)-(RW/2+70))<60)hurt(z,B.fireD*dd);if(Math.random()<.6)for(const sd of[-1,1])addP({img:'fx3',x:TX+sd*(RW/2+70)+rnd(-40,40),y:GY-rnd(10,40),vx:0,vy:-rnd(80,160),life:.5,s:rnd(50,80),add:1,rot:-PI/2,fade:1})}
 zTick(dd);projTick(dd);partsTick(dd);
 if(shake>0)shake=Math.max(0,shake-dd*30);if(flash>0)flash-=dd*2;
 if(B.hp<=0&&!B.result){B.hp=0;stageFail()}
 if(B.tut)tutTick()}
function zTick(dt){for(const z of B.zs){if(z.dead)continue;const T=ZT[z.type];z.t+=dt;if(z.hitT>0)z.hitT-=dt;if(z.buffT>0)z.buffT-=dt;
  if(z.burnT>0){z.burnT-=dt;hurt(z,z.burnD*dt);if(Math.random()<dt*8)addP({img:'fx3',x:z.x+rnd(-10,10),y:bodyY(z)+rnd(-20,10),vx:0,vy:-80,life:.35,s:30,add:1,rot:-PI/2,fade:1});if(z.dead)continue}
  if(z.stunT>0){z.stunT-=dt;continue}if(z.frzT>0){z.frzT-=dt;continue}
  if(z.slowT>0){z.slowT-=dt;if(z.slowT<=0)z.slowA=0}
  const sp=z.spd*(1-z.slowA)*(z.buffT>0?1.4:1)*(B.buff.fire>0&&Math.abs(Math.abs(z.x-TX)-(RW/2+70))<60?.5:1);
  if(T.howl){z.howlT-=dt;if(z.howlT<=0&&z.x>-20&&z.x<W+20){z.howlT=5.5;for(const o of B.zs)if(!o.dead&&Math.hypot(o.x-z.x,o.y-z.y)<220)o.buffT=3;addP({img:'fz3',x:z.x,y:z.y-60*z.s,life:.7,s:160,add:1,fade:1,grow:1});AudioFx.cue('roar',.4,.5)}}
  if(T.boss){z.sumT-=dt;if(z.sumT<=0&&z.x>0&&z.x<W){z.sumT=8;for(let k=0;k<3;k++){const n=spawnZ('scout',z.dir>0?-1:1);n.x=z.x-z.dir*rnd(20,80)}AudioFx.cue('roar');shake=6}}
  const ex=edgeX(z);
  if(z.state==='walk'){z.x+=z.dir*sp*dt;if(T.burrow&&(ex-z.x)*z.dir<260&&(ex-z.x)*z.dir>20){z.state='under';addP({img:'fz5',x:z.x,y:GY-20,life:.5,s:110,fade:1})}
   if((z.x-ex)*z.dir>=0){z.x=ex;if(T.bloat){B.hp-=(B.buff.shield>0?0:60+B.s*4);B.dmgBy=B.dmgBy||{};B.dmgBy.bloatBoom=(B.dmgBy.bloatBoom||0)+60+B.s*4;B.dmgTaken++;blast(z.x,z.y-50,90,0,'fz0');z.dead=true;shake=12;vib('heavy');AudioFx.cue('hurt');continue}
    if(T.climb){z.state='climb';const top=B.floors.length;z.climbTo=floorY(Math.floor(rnd(1,top)))+RH/2-4}else z.state='attack'}}
  else if(z.state==='under'){z.x+=z.dir*sp*1.3*dt;if(Math.random()<dt*10)addP({img:'fz6',x:z.x,y:GY-6,vx:rnd(-40,40),vy:rnd(-160,-60),g:600,life:.5,s:rnd(10,18)});if((z.x-ex)*z.dir>=0){z.x=ex;z.state='attack';addP({img:'fz5',x:z.x,y:GY-30,life:.6,s:140,fade:1});AudioFx.cue('hit');shake=4}}
  else if(z.state==='climb'){z.y-=40*(1-z.slowA)*dt;if(z.y<=z.climbTo){z.y=z.climbTo;z.state='hang'}}
  else if(z.state==='fly'){const top=floorY(B.floors.length-1)-20;const ty=clamp(z.alt,top,GY-150);z.y+=(ty-z.y)*Math.min(1,dt*1.5)+Math.sin(z.t*3)*.6;z.x+=z.dir*sp*dt;if((z.x-ex)*z.dir>=0){z.x=ex;z.state='flyatk'}}
  if(z.state==='attack'||z.state==='hang'||z.state==='flyatk'){if(B.buff.shield<=0){B.hp-=z.dps*dt;B.dmgTaken+=z.dps*dt;B.dmgBy=B.dmgBy||{};const kk=z.type+':'+z.state;B.dmgBy[kk]=(B.dmgBy[kk]||0)+z.dps*dt;if(Math.random()<dt*1.2){vib('light');AudioFx.cue('hurt',.35,.4)}}
   if(z.state==='flyatk'){z.y+=Math.sin(z.t*5)*.8;z.atkT=(z.atkT||0)+dt;if(z.atkT>3&&z.y<GY-150)z.y+=14*dt}}}
 B.zs=B.zs.filter(z=>!z.dead)}
function projTick(dt){for(const p of B.projs){
  if(p.k==='bul'||p.k==='net'){if(p.tg.dead){p.gone=1;continue}const tx=p.tg.x,ty=bodyY(p.tg),dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy),st=p.sp*dt;if(d<=st+6){if(p.k==='net'){hurt(p.tg,p.dmg,p.o);if(!ZT[p.tg.type].boss)p.tg.stunT=Math.max(p.tg.stunT,p.stun);addP({img:'kb2',x:tx,y:ty,life:p.stun,s:60*p.tg.s+20,fade:1,a:.8})}else{hurt(p.tg,p.dmg,p.o);if(p.o.burn){p.tg.burnT=2;p.tg.burnD=p.o.burn*dmgMul()}if(p.o.slow){p.tg.slowT=1.2;p.tg.slowA=Math.max(p.tg.slowA,p.o.slow)}addP({glow:p.col||'y',x:tx,y:ty,life:.12,s:26,add:1})}p.gone=1}else{p.px=p.x;p.py=p.y;p.x+=dx/d*st;p.y+=dy/d*st}}
  else if(p.k==='arrow'){p.x+=p.vx*dt;p.y+=p.vy*dt;p.left-=Math.hypot(p.vx,p.vy)*dt;for(const z of B.zs){if(z.dead||p.hit.has(z)||z.state==='under')continue;if(Math.abs(z.x-p.x)<26*z.s+10&&Math.abs(bodyY(z)-p.y)<60*z.s){p.hit.add(z);hurt(z,p.dmg,p.o);if(p.o.freeze&&!ZT[z.type].boss)z.frzT=Math.max(z.frzT,p.o.freeze);addP({glow:p.o.freeze?'c':'w',x:p.x,y:p.y,life:.15,s:30,add:1})}}if(p.left<=0||p.y>GY+20)p.gone=1}
  else if(p.k==='shell'||p.k==='mineDrop'){p.t+=dt;const u=Math.min(1,p.t/p.T);p.x=p.sx+(p.tx-p.sx)*u;p.y=p.sy+(p.ty-p.sy)*u-Math.sin(u*PI)*(p.k==='shell'?160:80);if(u>=1){p.gone=1;if(p.k==='mineDrop')B.mines.push({x:p.tx,y:GY,dmg:p.dmg,o:p.o,t:0});else{const o=p.o;addP({img:o.freeze?'fx5':'fx4',x:p.tx,y:p.ty-20,life:.5,s:o.aoe*2.4,add:1,fade:1,grow:.4});for(const z of B.zs)if(!z.dead&&z.state!=='under'&&Math.hypot(z.x-p.tx,bodyY(z)-p.ty+(o.ground?40*z.s:0))<o.aoe+20*z.s){if(o.ground&&z.state==='fly')continue;hurt(z,p.dmg,o);if(o.freeze&&!ZT[z.type].boss)z.frzT=Math.max(z.frzT,o.freeze)}
     if(o.chain)chain(p.tx,p.ty-30,o.chain,p.dmg*.4);shake=Math.max(shake,o.freeze?2:4);AudioFx.cue(o.freeze?'freeze':'boom',.6,.1)}}}
  else if(p.k==='bomb'){p.vy+=900*dt;p.y+=p.vy*dt;if(p.y>=p.ty){p.gone=1;blast(p.x,p.ty-20,95,p.dmg,'fx4')}}
  else if(p.k==='tracer'||p.k==='bolt'){p.t-=dt;if(p.t<=0)p.gone=1}}
 B.projs=B.projs.filter(p=>!p.gone);
 for(const m of B.mines){m.t+=dt;for(const z of B.zs){if(z.dead||z.state==='fly'||z.state==='under'||z.state==='hang')continue;if(Math.abs(z.x-m.x)<28){m.gone=1;addP({img:'fx4',x:m.x,y:GY-30,life:.5,s:m.o.aoe*2.4,add:1,fade:1,grow:.4});for(const o of B.zs)if(!o.dead&&o.state!=='fly'&&Math.abs(o.x-m.x)<m.o.aoe){hurt(o,m.dmg,m.o);if(m.o.stun&&!ZT[o.type].boss)o.stunT=m.o.stun}AudioFx.cue('boom',.6,.08);shake=Math.max(shake,4);break}}}
 B.mines=B.mines.filter(m=>!m.gone);
 for(const b of B.barrels){if(b.drop<GY){b.vy+=1400*dt;b.drop+=b.vy*dt;if(b.drop>=GY)b.drop=GY;continue}b.x+=b.dir*300*dt;b.dist+=300*dt;b.rot+=b.dir*dt*8;let boom=b.dist>=b.max||b.x<-40||b.x>W+40;for(const z of B.zs)if(!z.dead&&z.state!=='fly'&&z.state!=='under'&&Math.abs(z.x-b.x)<30*z.s+16&&z.y>GY-50){boom=true;break}
  if(boom){b.gone=1;blast(b.x,GY-30,b.o.aoe,b.dmg,'fx4');if(b.o.fire)B.pools.push({x:b.x,t:b.o.fire,d:b.dmg*.25})}}
 B.barrels=B.barrels.filter(b=>!b.gone);
 for(const p of B.pools){p.t-=dt;for(const z of B.zs)if(!z.dead&&z.state!=='fly'&&Math.abs(z.x-p.x)<60)hurt(z,p.d*dt);if(Math.random()<dt*10)addP({img:'fx3',x:p.x+rnd(-50,50),y:GY-rnd(5,20),vy:-100,vx:0,life:.4,s:40,add:1,rot:-PI/2,fade:1})}
 B.pools=B.pools.filter(p=>p.t>0);
 for(const n of B.nums)n.t+=dt;B.nums=B.nums.filter(n=>n.t<.8)}
function partsTick(dt){for(const p of B.parts){if(p.delay>0){p.delay-=dt;continue}p.t+=dt;if(p.vx)p.x+=p.vx*dt;if(p.vy)p.y+=p.vy*dt;if(p.g)p.vy+=p.g*dt;if(p.vr)p.rot+=p.vr*dt}B.parts=B.parts.filter(p=>p.t<p.max)}
// ---------- 승리 · 실패
function starsOf(){const r=B.hp/B.maxHP;return r>=.7?3:r>=.4?2:1}
function stageWin(){const s=B.s,st=starsOf();B.result={win:true,stars:st,t:0,adDone:false};
 const first=s>=save.cleared;let cry=Math.round((22+s*7)*(1+.25*(st-1))*(first?1.5:1)*(1+.1*labLv('loot'))*(B.perks.cry?1.3:1));B.result.cry=cry;save.cry+=cry;
 if(first)save.cleared=s+1;save.stars[s]=Math.max(save.stars[s]||0,st);mission('clear');if(st===3)mission('stars3');save.firstPlay=false;
 const nu=ROOM_KEYS.filter(k=>ROOM_UNLOCK[k]===save.cleared&&first);B.result.unlock=nu;const no=OP_KEYS.filter(k=>OPS[k].unlock===save.cleared&&first&&!save.ops[k]);B.result.opUnlock=no;
 persist();track('stage_clear',{stage:B.st.label,stars:st,hp:Math.round(B.hp/B.maxHP*100),kills:B.kills});Music.play('win');AudioFx.cue('power');vib('medium');sc='clear'}
function stageFail(){if(!B.revived){B.result={revive:true,t:0};return}endFail()}
function endFail(){const prog=B.endless?B.wave:B.wave/B.waves;let cry=B.endless?Math.round(B.wave*6*(1+.1*labLv('loot'))):Math.round((22+B.s*7)*.35*prog*(1+.1*labLv('loot')));cry=Math.max(cry,5);save.cry+=cry;
 if(B.endless&&B.wave-1>save.endlessBest)save.endlessBest=B.wave-1;B.result={win:false,cry,t:0,adDone:false};persist();track(B.endless?'endless_end':'stage_fail',{stage:B.st.label,wave:B.wave});Music.play('lose');vib('long');sc='fail'}
function revive(){B.revived=true;B.result=null;B.hp=B.maxHP*.5;B.buff.shield=3;for(const z of B.zs){if(ZT[z.type].boss)continue;if(Math.abs(z.x-TX)<RW/2+160){hurt(z,9999)}}flash=.8;flashCol='200,255,255';shake=10;AudioFx.cue('fuse');track('revive',{})}
// ---------- 자동 플레이 봇(테스트용)
function botCard(){const d=B.draft;if(!d)return;let best=d.opts[0],bs=-1;for(const c of d.opts){let s=Math.random();if(c.k==='room')s+=bestFloorFor(c.room).fuse?3:2;if(c.k==='up')s+=1.5;if(c.k==='heal'&&B.hp<B.maxHP*.5)s+=4;if(c.k==='floor')s+=1.8;if(s>bs){bs=s;best=c}}applyCard(best)}
function botStep(){if(!B||B.draft||B.result)return;for(const ch of fuseChips())if(ch.ready){doFuse(ch);return}if(B.skillCD<=0&&B.zs.length>4)useSkill();
 for(const cr of B.crates)if(cr.landed&&!cr.open){openCrate(cr);break}
 if(B.floors.length<MAXF&&emptyIdx()<0&&B.scrap>=floorCost()+30){tryExpand();return}
 let bi=-1,bc=1e9;B.floors.forEach((f,i)=>{if((f.type||f.fu)&&f.lv<5){const c=upCost(f);if(c<bc){bc=c;bi=i}}});if(bi>=0&&B.scrap>=bc)tryUpgrade(bi)}
// ---------- 튜토리얼
function tutTick(){}
// ---------------------------------------------------------------- 감염체 뼈대 그리기 (부품 시트 조립)
const ZA={};
function zArt(type){if(ZA[type])return ZA[type];const sz=ZRIG.sizes[type];if(!sz)return null;const P=ZRIG.piv;const A={sz,P};
 const T=sz.torso,th=sz.thigh,sh=sz.shin;const hip=[T[0]*P.torso.hip[0],T[1]*P.torso.hip[1]];
 const knee=[hip[0]+th[0]*(P.thigh.k[0]-P.thigh.p[0]),hip[1]+th[1]*(P.thigh.k[1]-P.thigh.p[1])];
 A.footY=knee[1]+sh[1]*(.96-P.shin.p[1]);A.cx=T[0]*.5;ZA[type]=A;return A}
function part(name,img2,w,h,px,py,ax,ay,ang){const im=imgs[img2];if(!im)return;g.save();g.translate(ax,ay);if(ang)g.rotate(ang);g.drawImage(im,-px,-py,w,h);g.restore()}
function rot(px,py,ang,dx,dy){const c2=Math.cos(ang),s2=Math.sin(ang);return [px+dx*c2-dy*s2,py+dx*s2+dy*c2]}
const DEG=PI/180;
function drawRig(type,legA,legB,arm,headA,bob){const A=zArt(type);if(!A)return;const P=A.P,S=A.sz,T=S.torso,n=k=>'z_'+type+'_'+k;
 const tp=k=>[T[0]*P.torso[k][0],T[1]*P.torso[k][1]+bob];
 const leg=(hip,ang,dk)=>{const th=S.thigh,sh=S.shin,a=ang*DEG;const kn=rot(hip[0],hip[1],a,th[0]*(P.thigh.k[0]-P.thigh.p[0]),th[1]*(P.thigh.k[1]-P.thigh.p[1]));
  part(0,n('shin'+dk),sh[0],sh[1],sh[0]*P.shin.p[0],sh[1]*P.shin.p[1],kn[0],kn[1],ang*.5*DEG);part(0,n('thigh'+dk),th[0],th[1],th[0]*P.thigh.p[0],th[1]*P.thigh.p[1],hip[0],hip[1],a)};
 leg(tp('hip2'),legB,'D');
 if(S.sac){const s=S.sac,p=tp('sac');part(0,n('sac'),s[0],s[1],s[0]*P.sac.p[0],s[1]*P.sac.p[1],p[0],p[1],-20*DEG)}
 leg(tp('hip'),legA,'');
 const ti=imgs[n('torso')];if(ti)g.drawImage(ti,0,bob,T[0],T[1]);
 {const h=S.head,p=tp('neck');part(0,n('head'),h[0],h[1],h[0]*P.head.p[0],h[1]*P.head.p[1],p[0],p[1],headA*DEG)}
 const ua=S.uarm,fa=S.farm,sp=tp('sho'),a=arm*DEG;const e=rot(sp[0],sp[1],a,ua[0]*(P.uarm.e[0]-P.uarm.p[0]),ua[1]*(P.uarm.e[1]-P.uarm.p[1]));
 part(0,n('farm'),fa[0],fa[1],fa[0]*P.farm.p[0],fa[1]*P.farm.p[1],e[0],e[1],(arm+15)*DEG);
 part(0,n('uarm'),ua[0],ua[1],ua[0]*P.uarm.p[0],ua[1]*P.uarm.p[1],sp[0],sp[1],a);
 if(S.extra){const x=S.extra;if(type==='bulwark'){part(0,n('extra'),x[0]*1.3,x[1]*1.3,x[0]*.65,x[1]*.65,e[0]+fa[0]*.45,e[1]+6,0)}else part(0,n('extra'),x[0],x[1],x[0]*.5,x[1]*.9,tp('neck')[0]-10,tp('neck')[1]+4,(-20+headA)*DEG)}}
function drawZ(z){const T=ZT[z.type];const moving=z.state==='walk'&&z.stunT<=0&&z.frzT<=0,atk=z.state==='attack'||z.state==='hang'||z.state==='flyatk';
 const sp=(z.slowA?1-z.slowA:1)*(z.buffT>0?1.4:1),ph=z.t*(6+z.spd*.06)*sp;
 g.save();
 // 그림자
 if(z.state!=='fly'&&z.state!=='flyatk'&&z.state!=='climb'&&z.state!=='hang'){g.globalAlpha=.35;g.fillStyle='#000';g.beginPath();g.ellipse(z.x,GY+4,46*z.s,10*z.s,0,0,TAU);g.fill();g.globalAlpha=1}
 if(z.state==='under'){g.restore();return}
 if(z.type==='flyer'){const k=['ka0','ka1','ka2'][z.var||0],im=imgs[k];if(im){const w=150*z.s,h=w*im.height/im.width;g.translate(z.x,z.y+Math.sin(z.t*4)*6);g.scale(-z.dir,1);g.rotate(Math.sin(z.t*3)*.12+(atk?Math.sin(z.t*14)*.2:0));g.drawImage(im,-w/2,-h/2,w,h)}}
 else if(z.type==='crawler'){const im=imgs.kb4;if(im){const w=200*z.s,h=w*im.height/im.width;g.translate(z.x,z.y);g.scale(-z.dir,1);g.rotate(Math.sin(ph)*.06);g.drawImage(im,-w/2,-h+Math.abs(Math.sin(ph))*-4,w,h)}}
 else{const A=zArt(z.type);if(A){const s=z.s;
   let legA=0,legB=0,arm=0,head=0,bob=0;
   if(moving){legA=Math.sin(ph)*24;legB=-legA;arm=Math.sin(ph+1)*12;head=Math.sin(ph*.5)*5;bob=Math.abs(Math.sin(ph))*-5}
   else if(atk){const q=Math.sin(z.t*7);arm=-35+q*30;head=q*8;legA=-8;legB=10}
   else{arm=Math.sin(z.t*2)*4;head=Math.sin(z.t*1.5)*3}
   g.translate(z.x,z.y);if(z.state==='climb'||z.state==='hang'){g.rotate(z.dir*-.25)}
   g.scale(z.dir*s,s);g.translate(-A.cx,-A.footY);drawRig(z.type,legA,legB,arm,head,bob)}}
 g.restore();
 // 상태 표시
 const by=bodyY(z);
 if(z.frzT>0){g.save();g.globalCompositeOperation='lighter';drawGlow(z.x,by,70*z.s+20,'c',.7);g.restore();imgC('fx6',z.x,by,70*z.s+20,.7)}
 if(z.stunT>0){for(let k=0;k<3;k++){const a=z.t*5+k*2.1;g.fillStyle='#ffe28a';g.beginPath();g.arc(z.x+Math.cos(a)*22,by-70*z.s+Math.sin(a)*6,4,0,TAU);g.fill()}}
 if(z.hitT>0){g.save();g.globalCompositeOperation='lighter';drawGlow(z.x,by,60*z.s+16,'w',.55);g.restore()}
 if(B.buff.mark>0){g.save();g.globalCompositeOperation='lighter';drawGlow(z.x,by-10,30,'r',.4+.2*Math.sin(frame*8));g.restore()}
 // 체력바
 if(z.hp<z.max||z.shield>0){const w=T.boss?150:Math.max(46,70*z.s),y=by-(z.state==='fly'||z.state==='flyatk'?60:100)*z.s-(T.boss?60:10);rr(z.x-w/2,y,w,T.boss?12:7,4,'#1b120c',null);rr(z.x-w/2+1,y+1,(w-2)*Math.max(0,z.hp/z.max),(T.boss?12:7)-2,3,T.boss?'#ff5a7a':'#ff8a5a',null);if(z.shield>0)rr(z.x-w/2+1,y-5,(w-2)*z.shield/z.smax,4,2,'#c8d4e0',null)}}
// ---------------------------------------------------------------- 탑(방) 그리기
function drawRoom(i){const f=B.floors[i],y=floorY(i),x=TX-RW/2,yy=y-RH/2;
 const key=f.fu?'rm_empty':f.type?'rm_'+f.type:'rm_empty';img(key,x,yy,RW,RH);
 if(!f.type&&!f.fu){g.save();g.globalAlpha=.55+.2*Math.sin(frame*3);txt(L('빈 층','空楼层'),TX,y+6,22,'#ffe2a0','center');g.restore()}
 if(f.fu){const F=FUSE[f.fu-1],im=imgs['fu_'+String(f.fu).padStart(2,'0')];if(im){const h=RH*.82,w=h*im.width/im.height;g.save();g.translate(TX+(f.face<0?-6:6),y+RH*.06);g.scale(f.face<0?-1:1,1);const k=1+(f.aim>0?.04:0);g.drawImage(im,-w/2*k,-h/2*k,w*k,h*k);g.restore()}
  g.save();g.globalCompositeOperation='lighter';drawGlow(TX,y,90,'t',.12+.08*Math.sin(frame*4+i));g.restore()}
 if(f.aim>0)f.aim-=1/60;
 if(f.flash>0){g.save();g.globalCompositeOperation='lighter';g.globalAlpha=Math.min(1,f.flash)*.3;g.fillStyle='#fff6d0';g.fillRect(x+8,yy+8,RW-16,RH-16);g.restore()}
 // 레벨 표시
 if(f.type||f.fu){rr(x+10,yy+10,f.fu?96:62,26,10,f.fu?'#0f4a48e8':'#2a1a10e0',f.fu?'#5fffe0':'#c08a4a',2);txt((f.fu?'✦ ':'')+'Lv'+f.lv,x+(f.fu?58:41),yy+24,16,f.fu?'#bffff4':'#ffe2a0','center',false)}}
function drawTower(){const n=B.floors.length;
 // 지붕
 const ry=floorY(n)+RH/2-4,im=imgs.rm_roof;if(im){const h=RW*im.height/im.width;img('rm_roof',TX-RW/2,ry-h+6,RW,h)}
 for(let i=n-1;i>=0;i--)drawRoom(i);
 if(B.buff.shield>0){g.save();g.globalAlpha=.25+.1*Math.sin(frame*10);g.fillStyle='#9ff0ff';pathRect(TX-RW/2-12,floorY(n-1)-RH/2-30,RW+24,GY-(floorY(n-1)-RH/2-30)+4,30);g.fill();g.restore();imgC('icw1',TX,floorY(n-1)-RH/2-40,60)}}
// 강화 비용 · 증축 · 융합 표시
function drawTowerUI(){const n=B.floors.length;
 for(let i=0;i<n;i++){const f=B.floors[i];if(!(f.type||f.fu)||f.lv>=5)continue;const c=upCost(f),ok=B.scrap>=c,y=floorY(i);const x=TX+RW/2-80;
  rr(x,y-RH/2+10,70,26,10,ok?'#1f5a30ee':'#2a1a10cc',ok?'#7fffa0':'#7a5a3a',2);scrapIco(x+14,y-RH/2+23,20);txt(''+c,x+44,y-RH/2+24,15,ok?'#d8ffe0':'#c9b090','center',false);if(ok){txt('▲',x+60,y-RH/2+4,14,'#7fffa0','center')}}
 if(n<MAXF){const c=floorCost(),ok=B.scrap>=c,y=floorY(n)+RH/2-60;rr(TX-70,y-22,140,40,14,ok?'#1f5a30ee':'#2a1a10cc',ok?'#7fffa0':'#7a5a3a',2);txt(L('+ 증축 ','+ 扩建 '),TX-16,y-2,16,ok?'#d8ffe0':'#c9b090','center',false);scrapIco(TX+30,y-2,18);txt(''+c,TX+52,y-1,14,ok?'#d8ffe0':'#c9b090','center',false)}
 B.chips=fuseChips();for(const ch of B.chips){const y=(floorY(ch.i)+floorY(ch.i+1))/2,x=TX-RW/2-6,pul=.5+.5*Math.sin(frame*6);
  g.save();if(ch.ready){g.globalCompositeOperation='lighter';drawGlow(x,y,60+pul*10,'t',.7);g.globalCompositeOperation='source-over'}
  rr(x-58,y-26,116,52,16,ch.ready?'#0f4a48f0':'#2a2a2acc',ch.ready?'#5fffe0':'#888',3);txt(ch.ready?L('융합!','融合！'):L('융합 Lv2↑','融合需Lv2'),x,y,ch.ready?20:14,ch.ready?'#bffff4':'#ccc','center');g.restore()}}
// ---------------------------------------------------------------- 효과
function drawParts(){for(const p of B.parts){if(p.delay>0)continue;const u=p.t/p.max;const a=(p.fade?1-u:u>.7?(1-u)/.3:1)*(p.a||1);if(a<=0)continue;
  if(p.add)g.globalCompositeOperation='lighter';
  if(p.glow){drawGlow(p.x,p.y,p.s*(1+(p.grow||0)*u),p.glow,a)}
  else{const im=imgs[p.img];if(im){const sc2=1+(p.grow||0)*u;let w=(p.w||p.s)*sc2,h=p.h?p.h*sc2:w*im.height/im.width;g.save();g.globalAlpha=Math.max(0,Math.min(1,a));g.translate(p.x,p.y);if(p.rot)g.rotate(p.rot);if(p.flip)g.scale(-1,1);g.drawImage(im,-w/2,-h/2,w,h);g.restore()}}
  g.globalCompositeOperation='source-over';g.globalAlpha=1}}
function drawProjs(){for(const p of B.projs){
 if(p.k==='bul'){g.strokeStyle='#ffe88a';g.lineWidth=3;g.beginPath();g.moveTo(p.px||p.x,p.py||p.y);g.lineTo(p.x,p.y);g.stroke();g.save();g.globalCompositeOperation='lighter';drawGlow(p.x,p.y,10,p.col||'y',.8);g.restore()}
 else if(p.k==='net'){g.save();g.translate(p.x,p.y);g.rotate(frame*8);g.strokeStyle='#e8e0c0';g.lineWidth=2;for(let k=0;k<4;k++){g.rotate(PI/4);g.beginPath();g.moveTo(-14,0);g.lineTo(14,0);g.stroke()}g.restore()}
 else if(p.k==='arrow'){const im=imgs.pr2;if(im){g.save();g.translate(p.x,p.y);g.rotate(p.a);g.drawImage(im,-34,-14,68,28);g.restore()}if(p.o.freeze){g.save();g.globalCompositeOperation='lighter';drawGlow(p.x,p.y,24,'c',.7);g.restore()}}
 else if(p.k==='shell'||p.k==='mineDrop'||p.k==='bomb'){const k=p.k==='mineDrop'?'pr5':p.k==='bomb'?'pr1':p.img;const im=imgs[k];if(im){const w=p.k==='mineDrop'?34:40,h=w*im.height/im.width;g.save();g.translate(p.x,p.y);g.rotate(p.k==='bomb'?PI/2+.3:frame*6);g.drawImage(im,-w/2,-h/2,w,h);g.restore()}}
 else if(p.k==='tracer'){g.save();g.globalAlpha=Math.min(1,p.t*8);g.strokeStyle=p.col||'#fff6c0';g.lineWidth=3;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(p.x2,p.y2);g.stroke();g.restore()}
 else if(p.k==='bolt'){g.save();g.globalCompositeOperation='lighter';g.strokeStyle='#9ff0ff';g.lineWidth=3;g.beginPath();g.moveTo(p.x,p.y);const n=6;for(let k=1;k<n;k++){const u=k/n;g.lineTo(p.x+(p.x2-p.x)*u+rnd(-12,12),p.y+(p.y2-p.y)*u+rnd(-12,12))}g.lineTo(p.x2,p.y2);g.stroke();drawGlow(p.x2,p.y2,30,'c',.8);g.restore()}}
 for(const m of B.mines){imgC('pr5',m.x,GY-6,36);if(Math.sin(m.t*8)>0){g.save();g.globalCompositeOperation='lighter';drawGlow(m.x,GY-12,10,'r',.9);g.restore()}}
 for(const b of B.barrels){const im=imgs.pr3;if(im){g.save();g.translate(b.x,b.drop-26);g.rotate(b.rot);g.drawImage(im,-20,-28,40,56);g.restore()}}
 for(const f of B.floors)for(const d of f.dr){const im=imgs.pr0;if(im){g.save();g.translate(d.x,d.y+Math.sin(frame*9+d.ph)*3);g.drawImage(im,-28,-17,56,34);g.restore()}}}
// ---------------------------------------------------------------- 전투 화면
function drawBattle(){const ox=shake?rnd(-shake,shake):0,oy=shake?rnd(-shake,shake):0;g.save();g.translate(ox,oy);
 if(!img('bg'+(B.ch+1),0,0,W,H)){g.fillStyle='#4a7ab0';g.fillRect(0,0,W,H)}
 for(const p of B.pools){g.save();g.globalCompositeOperation='lighter';drawGlow(p.x,GY-10,70,'o',.5);g.restore()}
 drawTower();
 // 감염체: 등반·공중 → 지상 순 (y 정렬)
 const zs=B.zs.slice().sort((a,b)=>a.y-b.y);for(const z of zs)drawZ(z);
 for(const cr of B.crates){const k=cr.landed?'pr10':'pr10';const im=imgs[k];if(im){const w=86,h=w*im.height/im.width;const bob=cr.landed?Math.sin(frame*5)*3:Math.sin(cr.t*2)*8;g.save();g.translate(cr.x,cr.y-h/2+20);g.rotate(cr.landed?0:Math.sin(cr.t*2)*.15);g.drawImage(im,-w/2,-h/2+bob,w,h);g.restore();if(cr.landed){g.save();g.globalCompositeOperation='lighter';drawGlow(cr.x,cr.y-20,60,'y',.35+.2*Math.sin(frame*6));g.restore()}}}
 drawProjs();drawParts();
 for(const n of B.nums){g.globalAlpha=1-n.t/.8;txt(''+n.v,n.x,n.y-n.t*60,n.big?30:22,n.big?'#ffd04a':'#fff','center');g.globalAlpha=1}
 g.restore();
 if(flash>0){g.fillStyle=`rgba(${flashCol},${Math.min(.6,flash)})`;g.fillRect(0,0,W,H)}
 if(B.hp<B.maxHP*.3&&!B.result){g.save();g.globalAlpha=.18+.12*Math.sin(frame*6);g.fillStyle=grad(0,0,0,H,[[0,'#ff2020'],[.15,'#ff202000'],[.85,'#ff202000'],[1,'#ff2020']]);g.fillRect(0,0,W,H);g.restore()}
 drawTowerUI();drawHUD();
 if(B.fuseShow)drawFuseShow();
 if(B.newZT>0&&B.newZ)drawNewZ();
 if(B.draft)drawDraft();
 if(B.tut)drawTut();
 if(paused&&!B.result)drawPause();
 if(B.result&&B.result.revive)drawRevive()}
function drawHUD(){
 // 상단
 g.fillStyle=grad(0,0,0,150,[[0,'#120c08e0'],[1,'#120c0800']]);g.fillRect(0,0,W,150);
 rr(18,18,72,72,18,'#2a1a10e8','#c08a4a',3);g.fillStyle='#ffe2a0';g.fillRect(40,38,9,32);g.fillRect(59,38,9,32);
 txt(B.endless?L('무한 포위전','无尽围攻'):B.st.label+'  '+LL(CH[B.ch].n).split('·')[1].trim(),375,36,24,'#ffe2a0','center');
 txt(L('웨이브 ','第 ')+Math.max(1,B.wave)+(B.endless?'':' / '+B.waves)+L('',' 波'),375,68,20,'#fff','center');
 // 내구도
 icon('icr5',112,92,40);bar(150,100,440,26,B.hp/B.maxHP,B.hp/B.maxHP>.4?'#4fd36a':'#ff5a4a');txt(Math.ceil(B.hp)+' / '+B.maxHP,370,113,16,'#fff','center');
 if(B.buff.shield>0)txt('🛡',600,113,22,'#9ff0ff','center',false);
 // 부품
 rr(606,20,128,52,16,'#2a1a10e8','#c08a4a',2);scrapIco(634,46,36);txt(''+B.scrap,690,47,24,'#ffe2a0','center');
 // 하단: 동료 스킬
 const O=OPS[save.op],cdMax=O.cd*(1-.04*((save.ops[save.op]||1)-1)),ready=B.skillCD<=0;const bx=28,by=1150,bs=140;
 rr(bx-6,by-6,bs+12,bs+12,30,'#1b120ce8',ready?'#ffe28a':'#7a5a3a',4);
 if(ready){g.save();g.globalCompositeOperation='lighter';drawGlow(bx+bs/2,by+bs/2,110,'y',.35+.2*Math.sin(frame*5));g.restore()}
 img(O.face,bx+8,by+4,bs-16,(bs-16)*.92);
 if(!ready){g.save();g.fillStyle='rgba(0,0,0,.55)';g.beginPath();g.moveTo(bx+bs/2,by+bs/2);g.arc(bx+bs/2,by+bs/2,bs/2+4,-PI/2,-PI/2+TAU*(B.skillCD/cdMax));g.closePath();g.fill();g.restore();txt(''+Math.ceil(B.skillCD),bx+bs/2,by+bs/2,40,'#fff','center')}
 rr(bx-4,by+bs-26,bs+8,34,10,'#2a1a10f0',null);fitTxt(LL(O.sk),bx+bs/2,by+bs-9,18,bs,'#ffe2a0','center');
 // 속도
 button(588,1170,138,74,speed===2?'▶▶ x2':'▶ x1',speed===2?'teal':'gray',26);
 // 진행 안내
 let msg='';if(B.phase==='wave'&&B.spawnQ.length===0&&B.zs.length)msg=L('남은 감염체 ','剩余感染体 ')+B.zs.length;
 if(msg)txt(msg,375,1300,18,'#ffe2a0','center');
 if(B.buff.rapid>0)txt(L('일제 사격! ','齐射！')+Math.ceil(B.buff.rapid),375,160,22,'#ffd06a','center');if(B.buff.mark>0)txt(L('약점 표시 ','弱点标记 ')+Math.ceil(B.buff.mark),375,190,20,'#ff9a8a','center');
 if(bannerT>0&&bannerSc==='battle'){g.save();g.globalAlpha=Math.min(1,bannerT*2);rr(115,214,520,60,18,'#1b120ce8','#ffcf6a',2);fitTxt(banner,375,244,22,490,'#fff','center');g.restore();bannerT-=1/60}}
function drawDraft(){const d=B.draft,a=Math.min(1,d.t*4);g.fillStyle=`rgba(10,6,4,${.72*a})`;g.fillRect(0,0,W,H);
 txt(d.first?L('시작 방을 고르세요','选择初始房间')+(B.initTot>1?' ('+(B.initTot-B.initPicks+1)+'/'+B.initTot+')':''):L('보급 도착! 하나를 고르세요','补给到了！选择一项'),375,330,34,'#ffe2a0','center');
 txt(d.first?L('방은 탑의 빈 층에 자동으로 지어져요','房间会自动建在塔的空楼层'):L('위아래로 붙은 두 방이 짝이 맞으면 융합할 수 있어요','上下相邻的两个房间配对即可融合'),375,372,18,'#d8c8b0','center',false);
 const n=d.opts.length,cw=n>3?168:218,gap=n>3?10:16,x0=375-(n*cw+(n-1)*gap)/2;
 d.opts.forEach((cd,k)=>{const x=x0+k*(cw+gap),y=410+(1-a)*80,h=cw*1.36;const fr=imgs[cardFrame(cd)];if(fr)g.drawImage(fr,x,y,cw,h);else rr(x,y,cw,h,16,'#2a1a10','#c08a4a',3);
  icon(cardIcon(cd),x+cw/2-cw*.24,y+cw*.2,cw*.48);fitTxt(cardTitle(cd),x+cw/2,y+cw*.92,n>3?19:23,cw-40,'#ffe2a0','center');
  rr(x+4,y+h+8,cw-8,104,14,'#1b120cf2','#7a5a3a',2);const ls=wrapLines(cardDesc(cd),n>3?14:16,cw-28).slice(0,4);ls.forEach((l,j)=>{const fus=l.indexOf('★')===0;fitTxt(l,x+cw/2,y+h+30+j*22,n>3?14:16,cw-24,fus?'#7fffe0':'#f0e8dc','center',false)});
  const tag=cd.k==='room'?L('새 방','新房间'):cd.k==='up'?L('강화','强化'):cd.k==='perk'?L('보급품','补给'):cd.k==='floor'?L('증축','扩建'):L('수리','维修');rr(x+cw/2-46,y-16,92,30,12,'#1b120c','#c08a4a',2);txt(tag,x+cw/2,y-1,15,'#ffcf6a','center',false)});
 if(!d.first&&!B.rerolled)adButton(205,980,340,78,L('광고 보고 다시 뽑기','看广告重新抽取'),22);
 if(save.firstPlay&&d.first)drawFinger(375,410+218*.6)}
function drawFuseShow(){const f=B.fuseShow,u=Math.min(1,f.t*3),a=f.t>1.8?(2.2-f.t)/.4:1;g.save();g.globalAlpha=Math.max(0,a);rr(95,420,560,250,24,'#0f2a2af0','#5fffe0',3);imgC('fu_'+String(f.F.id).padStart(2,'0'),230,545,200*u);
 txt(f.first?L('새 융합 발견!','发现新融合！'):L('융합 완료!','融合完成！'),470,480,30,'#bffff4','center');txt(LL(f.F.n),470,530,26,'#fff','center');txt(LL(ROOMS[f.F.a].n)+' + '+LL(ROOMS[f.F.b].n),470,572,17,'#9fd8d0','center',false);txt(L('도감에 기록됨','已记录到图鉴'),470,612,15,'#7fbfb8','center',false);g.restore()}
function drawNewZ(){const z=B.newZ,a=Math.min(1,B.newZT);g.save();g.globalAlpha=a;rr(150,286,450,96,18,'#2a1010e8','#ff8a6a',2);img('zp_'+(z==='flyer'?'echo':z==='crawler'?'scout':z),162,292,84,84);if(z==='flyer')imgC('ka2',204,334,70);if(z==='crawler')imgC('kb4',204,334,84);
 txt(L('새 감염체: ','新感染体：')+LL(ZT[z].n),260,316,20,'#ffb0a0','left');paragraphs(LL(ZT[z].d),260,350,15,'#f0e0d8',330,20);g.restore()}
function drawPause(){g.fillStyle='rgba(8,5,3,.78)';g.fillRect(0,0,W,H);panel(125,380,500,560);txt(L('일시정지','暂停'),375,450,40,'#ffe2a0','center');
 button(175,510,400,90,L('계속하기','继续'),'gold',30);button(175,620,400,80,L('작전 안내서','作战指南'),'gray',24);button(175,720,400,80,L('설정','设置'),'gray',24);button(175,820,400,80,L('포기하고 나가기','放弃并退出'),'red',24)}
function drawRevive(){g.fillStyle='rgba(20,4,4,.8)';g.fillRect(0,0,W,H);panel(95,400,560,480,'#2a1010f0','#ff8a6a');txt(L('요새가 무너진다!','堡垒快要倒塌了！'),375,470,36,'#ffb0a0','center');
 paragraphs(L('광고를 보면 내구도 50%로 다시 일어나고, 탑 근처 감염체를 날려버립니다. (한 판에 한 번)','观看广告可恢复50%耐久并清除塔附近的感染体。（每局一次）'),375,530,19,'#f0e0d8',480,null,'center');
 adButton(155,620,440,96,L('광고 보고 부활','看广告复活'),28);button(195,750,360,80,L('포기하기','放弃'),'gray',24)}
// ---------------------------------------------------------------- 튜토리얼 손가락
function drawFinger(x,y){const b=Math.sin(frame*6)*10;g.save();g.globalAlpha=.9;g.translate(x+20,y+30+b);g.fillStyle='#fff';g.strokeStyle='#1b120c';g.lineWidth=4;g.beginPath();g.moveTo(0,0);g.lineTo(-14,30);g.lineTo(-6,30);g.lineTo(-10,58);g.lineTo(14,58);g.lineTo(18,26);g.lineTo(8,24);g.closePath();g.fill();g.stroke();g.restore();g.save();g.globalCompositeOperation='lighter';drawGlow(x,y,40+b,'y',.5);g.restore()}
function drawTut(){if(B.draft||B.result)return;const s=B.tutStep;
 if(s===2){let bi=-1;B.floors.forEach((f,i)=>{if((f.type||f.fu)&&B.scrap>=upCost(f)&&bi<0)bi=i});if(bi>=0){const y=floorY(bi);drawFinger(TX+RW/2-40,y-RH/2+24);rr(115,y-RH/2-80,520,52,14,'#1b120ce8','#ffcf6a',2);txt(L('부품이 모이면 방을 눌러 강화!','零件够了就点击房间强化！'),375,y-RH/2-54,20,'#fff','center')}}
 if(s===3&&B.skillCD<=0){drawFinger(98,1200);rr(190,1100,400,52,14,'#1b120ce8','#ffcf6a',2);txt(L('동료 스킬을 눌러 보세요!','试试点击伙伴技能！'),390,1126,20,'#fff','center')}
 const ch=B.chips&&B.chips.find(c=>c.ready);if(ch&&B.tutStep<9){const y=(floorY(ch.i)+floorY(ch.i+1))/2;drawFinger(TX-RW/2-6,y)}}
// ---------------------------------------------------------------- 일일 보상
function dailyInit(){const t=todayKey();if(save.daily&&save.daily.day===t)return;let h=0;for(const ch of t)h=(h*31+ch.charCodeAt(0))|0;const pool=MISSIONS.map((m,i)=>i).filter(i=>MISSIONS[i].k!=='fuse'||save.cleared>=2);const pk=[];
 while(pk.length<3&&pool.length){h=(h*1103515245+12345)|0;pk.push(pool.splice(Math.abs(h)%pool.length,1)[0])}save.daily={day:t,m:pk.map(i=>({i,p:0,c:false}))};persist()}
function mission(k,n=1){if(!save.daily||save.daily.day!==todayKey())dailyInit();for(const m of save.daily.m){const M=MISSIONS[m.i];if(M.k===k&&!m.c&&m.p<M.goal){m.p=Math.min(M.goal,m.p+n);if(m.p>=M.goal)message(L('일일 미션 완료! ','每日任务完成！')+LL(M.n),1.8)}}}
function attCan(){return save.att.last!==todayKey()}
function chStars(c){let n=0;for(let k=0;k<SPC;k++)n+=save.stars[c*SPC+k]||0;return n}
function adBoxLeft(){const t=todayKey();if(!save.adBox||save.adBox.day!==t)save.adBox={day:t,n:0};return 3-save.adBox.n}
function rewardBadge(){dailyInit();if(attCan())return true;if(save.daily.m.some(m=>!m.c&&m.p>=MISSIONS[m.i].goal))return true;for(let c2=0;c2<CH.length;c2++)for(let t=0;t<2;t++)if(!save.chest.includes(c2*2+t)&&chStars(c2)>=(t?18:9))return true;return adBoxLeft()>0&&save.cleared>=1}
function giveCry(n,why){save.cry+=n;persist();AudioFx.cue('coin');message((why?why+' ':'')+L('결정 +','晶体 +')+n,1.6)}
// ---------------------------------------------------------------- 안내 팁 (화면마다 처음 1회)
let guideTip=null,guidePage=0,guideRet='map',resetArm=0;
function tip(id,lines){if(save.tips[id])return false;save.tips[id]=1;persist();guideTip={lines,t:0};track('guide_open',{tip:id});return true}
function drawGuideTip(){guideTip.t+=1/60;const ls=guideTip.lines.map(l=>wrapLines(LL(l),21,560));const tot=ls.reduce((a,b)=>a+b.length,0);g.fillStyle='rgba(8,5,3,.74)';g.fillRect(0,0,W,H);const h=130+tot*32+(ls.length-1)*14,y0=600-h/2;panel(50,y0,650,h,'#1e140ef6','#ffcf6a');icon('icm4',78,y0+22,44);txt(L('안내','提示'),132,y0+46,28,'#ffe2a0');
 let yy=y0+100;ls.forEach(l=>{txt('•',82,yy,22,'#ffcf6a','left',false);l.forEach((s,i)=>txt(s,104,yy+i*32,21,'#f6efe4','left',false,700));yy+=l.length*32+14});if(Math.sin(frame*6)>-.3)txt('▼ '+L('터치해서 닫기','点击关闭'),672,y0+h-24,16,'#ffcf7a','right',false)}
function nextGoal(){if(save.cleared>=STAGE_N)return [L('모든 지역 해방! 무한 포위전 최고 기록에 도전','全部解放！挑战无尽围攻最高纪录'),'#9fffbf'];
 const lab=LAB.find(it=>labLv(it.k)<it.max&&save.cry>=labCost(it));if(lab&&save.cleared>=2)return [L('▲ 연구소에서 ','▲ 可在研究所升级 ')+LL(lab.n)+L(' 강화 가능!',''),'#9fffbf'];
 const op=OP_KEYS.find(k=>!save.ops[k]&&save.cleared>=OPS[k].unlock&&save.cry>=OPS[k].cost);if(op)return [L('▲ 새 동료 영입 가능: ','▲ 可招募新伙伴：')+LL(OPS[op].n),'#9fffbf'];
 const s=save.cleared;const st=stageInfo(s);return [L('다음 작전: ','下一行动：')+st.label+(st.boss?L(' (보스)',' （首领）'):''),'#ffe2a0']}
// ---------------------------------------------------------------- 로딩 · 타이틀
let loadT=0;
function loadingScreen(){loadT+=1/60;frame+=1/60;g.fillStyle='#1a120c';g.fillRect(0,0,W,H);const done=RES.filter(n=>imgs[n.replace(/\.\w+$/,'')]).length,tot=RES.length,mustOk=MUST.every(n=>imgs[n]||imgFail[n]);
 if(imgs.logo){imgC('logo',375,520,560);titleText(560,.93)}else txt(L('버섯 요새','蘑菇堡垒'),375,520,70,'#ffcf6a','center');
 bar(165,740,420,22,done/tot,'#ffb84a');txt(L('불러오는 중… ','加载中… ')+Math.round(done/tot*100)+'%',375,800,22,'#e8d8c0','center',false);
 if(loadT>6&&!mustOk)txt(L('인터넷이 느려 시간이 걸리고 있어요','网络较慢，请稍候'),375,846,19,'#ffcf7a','center',false);
 if((mustOk&&(done>=tot||loadT>3))||loadT>25){sc='title';tip0()}}
function tip0(){}
function titleText(y,s=1){g.save();g.translate(375,y);g.scale(s,s);fitTxt(L('버섯 요새','蘑菇堡垒'),0,0,66,330,'#ffd45a','center');g.restore()}
function title(){if(!img('bg1',0,0,W,H)){g.fillStyle='#4a7ab0';g.fillRect(0,0,W,H)}g.fillStyle=grad(0,0,0,H,[[0,'#00000040'],[.45,'#00000010'],[.75,'#1a120cc0'],[1,'#1a120cf0']]);g.fillRect(0,0,W,H);
 // 장식 탑
 const fl=['rm_turret','rm_frostfan','rm_crossbow','rm_mortar'];for(let i=0;i<4;i++)img(fl[i],TX-110,GY-6-RH*.83-i*FH*.83+Math.sin(frame*2)*0,RW*.83,RH*.83);img('rm_roof',TX-110,GY-6-4*FH*.83-RH*.83+18,RW*.83,RW*.83*.42);
 if(imgs.logo){const s=1+.02*Math.sin(frame*2);imgC('logo',375,250,600*s);titleText(250+42*s,s)}else titleText(260,1.2)
 txt(L('층층이 쌓고, 융합하고, 막아내라!','层层堆叠，融合武器，守住堡垒！'),375,450,24,'#fff6e0','center');
 const cont=save.cleared>0;button(150,1040,450,100,cont?L('작전 이어하기','继续作战'):L('작전 시작','开始作战'),'gold',36);
 button(150,1160,218,74,L('작전 안내서','作战指南'),'gray',22);button(382,1160,218,74,L('설정','设置'),'gray',22);
 rr(560,22,170,56,14,'#1b120cd8','#c08a4a',2);txt(LANG==='zh'?'🌐 한국어':'🌐 中文',645,50,21,'#fff','center');
 if(LANG==='zh'){const hl=['抵制不良游戏，拒绝盗版游戏。','注意自我保护，谨防受骗上当。','适度游戏益脑，沉迷游戏伤身。','合理安排时间，享受健康生活。'];rr(95,1244,560,64,10,'#00000088',null);txt(hl[0]+hl[1],375,1262,14,'#d8d0c4','center',false,500);txt(hl[2]+hl[3],375,1288,14,'#d8d0c4','center',false,500)}
 if(Object.keys(imgFail).length)txt(L('일부 그림을 받지 못했어요 · 새로고침 해 주세요','部分图片加载失败 · 请刷新'),375,1004,17,'#ff9a8a','center',false);
 txt('v1.0 · '+BUILD+' · '+L('진행 ','进度 ')+save.cleared+' / '+STAGE_N,375,LANG==='zh'?1236:1318,14,'#c9b8a0','center',false)}
// ---------------------------------------------------------------- 작전 지도
let mapCh=-1;const NODE=[[190,440],[520,540],[230,660],[540,780],[220,900],[470,1010]];
function curCh(){if(mapCh<0)mapCh=Math.min(CH.length-1,Math.floor(Math.min(save.cleared,STAGE_N-1)/SPC));return mapCh}
function topBar(title2){g.fillStyle='#1a120ce8';g.fillRect(0,0,W,96);g.fillStyle='#c08a4a';g.fillRect(0,96,W,3);txt(title2,30,50,30,'#ffe2a0');rr(520,22,210,52,16,'#2a1a10',null);crystal(552,48,38);txt(''+save.cry,640,49,24,'#bff4ff','center')}
function tabs(cur){const T2=[['map',L('출격','出击'),'icw15'],['lab',L('연구소','研究所'),'icc0'],['ops',L('동료','伙伴'),'op'],['codex',L('도감','图鉴'),'icm8'],['reward',L('보상','奖励'),'icm4']];
 g.fillStyle='#1a120cf2';g.fillRect(0,1190,W,144);g.fillStyle='#c08a4a';g.fillRect(0,1188,W,3);
 T2.forEach((t,k)=>{const x=k*150,on=t[0]===cur;if(on)rr(x+6,1196,138,132,18,'#3a2614',null);if(t[2]==='op')img(OPS[save.op].face,x+45,1206,60,56);else icon(t[2],x+45,1204,60);txt(t[1],x+75,1294,20,on?'#ffe2a0':'#c9b8a0','center');
  const dot=(t[0]==='reward'&&rewardBadge())||(t[0]==='lab'&&LAB.some(it=>labLv(it.k)<it.max&&save.cry>=labCost(it))&&save.cleared>=2)||(t[0]==='ops'&&OP_KEYS.some(k=>!save.ops[k]&&save.cleared>=OPS[k].unlock&&save.cry>=OPS[k].cost));if(dot){g.fillStyle='#ff3a3a';g.beginPath();g.arc(x+118,1210,10,0,TAU);g.fill()}})}
function mapScreen(){const c2=curCh();if(!img('bg'+(c2+1),0,0,W,H)){g.fillStyle='#3a5a80';g.fillRect(0,0,W,H)}g.fillStyle='rgba(20,12,6,.35)';g.fillRect(0,0,W,H);
 topBar(L('작전 지도','作战地图'));
 rr(90,116,570,64,18,'#1b120ce8','#c08a4a',2);txt(LL(CH[c2].n),375,148,26,CH[c2].col,'center');if(c2>0)button(16,114,66,66,'◀','gray',26);if(c2<CH.length-1)button(668,114,66,66,'▶','gray',26);
 txt('★ '+chStars(c2)+' / '+SPC*3,375,200,18,'#ffe2a0','center');
 // 길
 g.strokeStyle='#ffe2a0aa';g.lineWidth=6;g.setLineDash([14,12]);g.beginPath();NODE.forEach((p,k)=>{k?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])});g.stroke();g.setLineDash([]);
 for(let k=0;k<SPC;k++){const s=c2*SPC+k,[x,y]=NODE[k],open=s<=save.cleared,cur=s===save.cleared,boss=k===SPC-1;const r=boss?70:58;
  if(cur){g.save();g.globalCompositeOperation='lighter';drawGlow(x,y,r+40+8*Math.sin(frame*4),'y',.6);g.restore()}
  rr(x-r,y-r,r*2,r*2,r*.4,open?(boss?'#5a1a1af0':'#2a1a10f0'):'#2a2a2acc',cur?'#ffe28a':open?'#c08a4a':'#666',4);
  if(boss&&open)img('zp_conductor',x-r*.8,y-r*.95,r*1.6,r*1.6);else if(open)icon(['icw15','icw12','icw8','icw2','icw7','icw13'][k],x-r*.55,y-r*.75,r*1.1);else icon('icm6',x-r*.5,y-r*.6,r);
  txt((c2+1)+'-'+(k+1),x,y+r*.55,22,open?'#fff':'#999','center');for(let j=0;j<3;j++)starIco(x-30+j*30,y+r+16,26,(save.stars[s]||0)>j)}
 const [gt,gc]=nextGoal();rr(40,1100,670,70,16,'#1b120ce8','#c08a4a',2);fitTxt(gt,375,1135,20,640,gc,'center');
 if(save.cleared>=SPC){button(530,212,200,62,L('무한 포위전','无尽围攻'),'teal',20);txt(L('최고 ','最高 ')+save.endlessBest+L('웨이브','波'),630,288,14,'#bff4ff','center')}
 tabs('map')}
// ---------------------------------------------------------------- 연구소
function labScreen(){img('rm_radio',-200,90,1150,560,.35);g.fillStyle='#1a120c';g.fillRect(0,560,W,H);g.fillStyle=grad(0,90,0,560,[[0,'#1a120c80'],[1,'#1a120c']]);g.fillRect(0,90,W,470);topBar(L('연구소','研究所'));
 txt(L('결정으로 영구 강화 · 모든 판에 적용','用晶体永久强化 · 每局生效'),375,130,19,'#d8c8b0','center',false);
 LAB.forEach((it,k)=>{const y=160+k*126,lv=labLv(it.k),mx=lv>=it.max,cost=labCost(it),ok=!mx&&save.cry>=cost;rr(24,y,702,112,18,'#2a1a10f0',ok?'#7fffa0':'#5a4030',2);icon(it.ic,40,y+14,84);
  txt(LL(it.n),142,y+32,24,'#ffe2a0');paragraphs(LL(it.d),142,y+66,17,'#e8dccc',330);for(let j=0;j<it.max;j++)rr(142+j*(it.max>8?22:30),y+90,it.max>8?18:24,10,4,j<lv?'#ffc84a':'#4a3a2a',null);
  if(mx)txt(L('최대','已满'),640,y+56,22,'#9fffbf','center');else{button(556,y+24,158,66,'',ok?'gold':'gray');crystal(590,y+57,30);txt(''+cost,650,y+58,22,ok?'#fff':'#ccc','center')}});
 tabs('lab')}
// ---------------------------------------------------------------- 동료
function opLvCost(k){const lv=save.ops[k]||1;return Math.round(70*Math.pow(lv,1.5))}
function opsScreen(){g.fillStyle='#1a120c';g.fillRect(0,0,W,H);img('rm_empty',-150,100,1050,510,.3);topBar(L('동료','伙伴'));txt(L('출격할 동료 1명을 고르세요 · 전투 중 스킬 사용','选择1名出战伙伴 · 战斗中使用技能'),375,130,19,'#d8c8b0','center',false);
 OP_KEYS.forEach((k,i)=>{const O=OPS[k],x=24+(i%2)*357,y=160+Math.floor(i/2)*336,own=!!save.ops[k],sel=save.op===k,open=save.cleared>=O.unlock,lv=save.ops[k]||0;
  rr(x,y,345,322,20,sel?'#3a2a14f4':'#2a1a10f0',sel?'#ffe28a':'#5a4030',sel?4:2);
  g.save();if(!own)g.globalAlpha=.4;img(O.face,x+16,y+16,120,110);g.restore();txt(LL(O.n),x+150,y+40,22,'#ffe2a0');if(own){txt('Lv'+lv,x+150,y+76,20,'#fff');for(let j=0;j<5;j++)rr(x+210+j*24,y+68,18,12,4,j<lv?'#ffc84a':'#4a3a2a',null)}
  txt(LL(O.sk),x+18,y+152,20,'#ffcf6a');paragraphs(LL(O.d),x+18,y+184,16,'#e8dccc',310);txt(L('대기 ','冷却 ')+Math.round(O.cd*(1-.04*(Math.max(1,lv)-1)))+L('초','秒'),x+18,y+238,15,'#b8a890','left',false);
  if(own){if(sel)txt(L('✔ 출격 중','✔ 出战中'),x+90,y+284,20,'#9fffbf','center');else button(x+16,y+258,150,52,L('출격','出战'),'teal',20);
   if(lv<5){const c3=opLvCost(k),ok=save.cry>=c3;button(x+176,y+258,154,52,'',ok?'gold':'gray');crystal(x+202,y+284,24);txt('Lv↑ '+c3,x+266,y+285,17,ok?'#fff':'#ccc','center')}}
  else if(open){const ok=save.cry>=O.cost;button(x+40,y+258,265,52,'',ok?'gold':'gray');crystal(x+80,y+284,26);txt(L('영입 ','招募 ')+O.cost,x+186,y+285,20,ok?'#fff':'#ccc','center')}
  else txt(stageInfo(O.unlock-1).label+L(' 클리어 후 영입',' 通关后可招募'),x+172,y+284,17,'#b8a890','center')});
 tabs('ops')}
// ---------------------------------------------------------------- 도감
let codexTab=0;
function codexScreen(){g.fillStyle='#1a120c';g.fillRect(0,0,W,H);topBar(L('도감','图鉴'));const T3=[L('방','房间'),L('융합','融合'),L('감염체','感染体')];
 T3.forEach((t,k)=>{const x=24+k*236;rr(x,112,224,60,16,k===codexTab?'#3a2614':'#2a1a10',k===codexTab?'#ffcf6a':'#5a4030',2);txt(t,x+112,142,22,k===codexTab?'#ffe2a0':'#c9b8a0','center')});
 if(codexTab===0){ROOM_KEYS.forEach((k,i)=>{const R2=ROOMS[k],x=24+(i%2)*357,y=190+Math.floor(i/2)*136,open=save.cleared>=ROOM_UNLOCK[k];rr(x,y,345,124,16,'#2a1a10f0','#5a4030',2);g.save();if(!open)g.globalAlpha=.35;icon(R2.ic,x+12,y+14,74);g.restore();
  txt(open?LL(R2.n):'???',x+100,y+32,21,'#ffe2a0');if(open)paragraphs(LL(R2.d),x+100,y+64,15,'#e8dccc',230,21);else txt(stageInfo(Math.max(0,ROOM_UNLOCK[k]-1)).label+L(' 클리어 시 해금',' 通关后解锁'),x+100,y+66,15,'#b8a890','left',false);if(open&&R2.ground)txt(L('땅 전용','仅地面'),x+300,y+32,13,'#ffb080','center',false)})}
 else if(codexTab===1){const n=Object.keys(save.seenFuse).length;txt(L('발견 ','已发现 ')+n+' / 12',375,196,20,'#bff4ff','center');FUSE.forEach((F,i)=>{const x=24+(i%3)*238,y=220+Math.floor(i/3)*240,seen=save.seenFuse[F.id];rr(x,y,226,226,18,seen?'#0f2a2af0':'#2a1a10f0',seen?'#5fffe0':'#5a4030',2);
  g.save();if(!seen){g.globalAlpha=.18}imgC('fu_'+String(F.id).padStart(2,'0'),x+113,y+92,140);g.restore();if(!seen)txt('?',x+113,y+92,70,'#c9b8a0','center');
  fitTxt(seen?LL(F.n):'???',x+113,y+176,20,210,seen?'#bffff4':'#c9b8a0','center');const hint=seen||(save.cleared>=ROOM_UNLOCK[F.a]&&save.cleared>=ROOM_UNLOCK[F.b])?LL(ROOMS[F.a].n)+' + '+LL(ROOMS[F.b].n):(save.cleared>=ROOM_UNLOCK[F.a]?LL(ROOMS[F.a].n)+' + ?':'? + ?');fitTxt(hint,x+113,y+206,15,214,'#d8c8b0','center',false)})}
 else{Object.keys(ZT).forEach((k,i)=>{const Z=ZT[k],x=24+(i%2)*357,y=190+Math.floor(i/2)*164,seen=save.seenZ[k]||k==='faker';rr(x,y,345,152,16,'#2a1a10f0','#5a4030',2);
  g.save();if(!seen)g.globalAlpha=.15;if(k==='flyer')imgC('ka0',x+66,y+76,96);else if(k==='crawler')imgC('kb4',x+66,y+80,118);else img('zp_'+k,x+8,y+12,118,118);g.restore();
  txt(seen?LL(Z.n):'???',x+136,y+34,20,'#ffb0a0');if(seen)paragraphs(LL(Z.d),x+136,y+66,15,'#e8dccc',196,21)})}
 tabs('codex')}
// ---------------------------------------------------------------- 보상
function rewardScreen(){dailyInit();g.fillStyle='#1a120c';g.fillRect(0,0,W,H);topBar(L('보상','奖励'));
 rr(24,112,702,206,18,'#2a1a10f0','#c08a4a',2);txt(L('7일 출석','7日签到'),44,140,22,'#ffe2a0');const can=attCan(),day=save.att.streak%7;
 ATT.forEach((r,k)=>{const x=38+k*97,y=164,cur=k===day&&can;rr(x,y,88,102,12,cur?'#2f5a3a':k<day?'#1d2a22':'#1b120c',cur?'#9fffbf':'#5a4030',2);txt((k+1)+L('일','天'),x+44,y+18,14,'#d8c8b0','center',false);crystal(x+44,y+52,34);txt(''+r,x+44,y+84,17,'#bff4ff','center');if(k<day)txt('✔',x+74,y+16,18,'#9fffbf','center')});
 button(490,268,220,44,can?L('출석 받기','领取签到'):L('내일 다시','明天再来'),can?'green':'gray',18);
 rr(24,332,702,322,18,'#2a1a10f0','#5a4030',2);txt(L('일일 미션','每日任务'),44,360,22,'#ffe2a0');txt(L('매일 자정 갱신','每日零点刷新'),704,360,14,'#b8a890','right',false);
 save.daily.m.forEach((m,k)=>{const M=MISSIONS[m.i],y=384+k*88,done=m.p>=M.goal;rr(40,y,670,78,12,'#1b120c','#4a3020',1);txt(LL(M.n),60,y+24,19,'#f6efe4','left',false);bar(60,y+46,330,16,m.p/M.goal,done?'#4fd38c':'#d08a20');txt(m.p+' / '+M.goal,404,y+54,14,'#d8c8b0','left',false);
  crystal(500,y+40,28);txt(''+M.r,532,y+41,18,'#bff4ff','left',false);if(m.c)txt(L('완료','已领'),650,y+40,18,'#8a7a68','center');else button(580,y+14,120,50,L('받기','领取'),done?'green':'gray',18)});
 rr(24,668,702,300,18,'#2a1a10f0','#5a4030',2);txt(L('챕터 별 상자','章节星星宝箱'),44,696,22,'#ffe2a0');txt(L('챕터마다 별 9개 · 18개','每章9星·18星'),704,696,14,'#b8a890','right',false);
 for(let c2=0;c2<CH.length;c2++){const y=716+c2*60,st=chStars(c2);txt(LL(CH[c2].n),44,y+26,17,save.cleared>=c2*SPC?CH[c2].col:'#6a5a4a','left',false);starIco(340,y+26,24);txt(st+'/18',360,y+27,16,'#ffe2a0','left',false);
  for(let t=0;t<2;t++){const need=t?18:9,ok=st>=need,got=save.chest.includes(c2*2+t),x=440+t*136;button(x,y+4,126,46,got?L('받음','已领'):need+'★',got?'gray':ok?'green':'gray',16)}}
 rr(24,984,702,190,18,'#0f2a2af0','#5fffe0',2);icon('pr10',44,1000,120);txt(L('무료 보급 상자','免费补给箱'),180,1030,24,'#bffff4');txt(L('광고를 보면 결정 ','看广告获得晶体 ')+(40+save.cleared*4)+L(' · 오늘 ',' · 今日剩余 ')+adBoxLeft()+L('회 남음',' 次'),180,1068,17,'#d8f0ec','left',false);
 if(adBoxLeft()>0)adButton(180,1096,330,66,L('광고 보고 열기','看广告打开'),20);else txt(L('내일 다시 열 수 있어요','明天可再次打开'),340,1128,18,'#9fd8d0','center',false);
 tabs('reward')}
// ---------------------------------------------------------------- 결과
function clearScreen(){const R=B.result;R.t+=1/60;drawBattleBg();g.fillStyle='rgba(16,10,6,.82)';g.fillRect(0,0,W,H);
 if(imgs.rm_roof){}panel(60,190,630,900,'#2a1a10f4','#ffcf6a');txt(L('방어 성공!','防守成功！'),375,268,46,'#ffe2a0','center');txt(B.st.label+'  '+LL(CH[B.ch].n),375,322,20,'#d8c8b0','center',false);
 for(let j=0;j<3;j++){const on=R.stars>j,u=Math.min(1,Math.max(0,R.t*2-j*.4)),s=on?100*(1+.3*Math.max(0,1-u*2))*Math.min(1,u*3):80;if(u>0||!on)starIco(255+j*120,410,on?s:80,on)}
 txt(L('남은 내구도 ','剩余耐久 ')+Math.round(B.hp/B.maxHP*100)+'%  ·  '+L('처치 ','击杀 ')+B.kills,375,490,20,'#f6efe4','center',false);
 crystal(300,560,56);txt('+'+R.cry*(R.adDone?2:1),400,562,40,'#bff4ff','center');
 let y=620;if(R.unlock&&R.unlock.length){rr(110,y,530,90,14,'#1b120c','#ffcf6a',2);icon(ROOMS[R.unlock[0]].ic,124,y+10,70);txt(L('새 방 해금! ','新房间解锁！')+LL(ROOMS[R.unlock[0]].n),210,y+45,22,'#ffe2a0');y+=104}
 if(R.opUnlock&&R.opUnlock.length){rr(110,y,530,90,14,'#1b120c','#9fffbf',2);img(OPS[R.opUnlock[0]].face,124,y+8,74,70);txt(L('새 동료 영입 가능: ','可招募新伙伴：')+LL(OPS[R.opUnlock[0]].n),210,y+45,20,'#9fffbf');y+=104}
 if(y<=620){const [gt,gc]=nextGoal();rr(110,y+10,530,80,14,'#1b120c','#5a4030',2);fitTxt(gt,375,y+50,19,500,gc,'center')}
 if(!R.adDone)adButton(140,850,470,90,L('광고 보고 결정 2배','看广告晶体翻倍'),26);
 const hasNext=B.s+1<STAGE_N;button(90,960,280,96,L('작전 지도','作战地图'),'gray',26);button(380,960,280,96,hasNext?L('다음 작전 ▶','下一关 ▶'):L('완료','完成'),'gold',28);
 button(560,200,110,56,L('공유','分享'),'teal',18)}
function failScreen(){const R=B.result;R.t+=1/60;drawBattleBg();g.fillStyle='rgba(30,8,6,.84)';g.fillRect(0,0,W,H);panel(60,240,630,780,'#2a1210f4','#ff8a6a');
 txt(B.endless?L('포위전 종료','围攻结束'):L('요새 함락…','堡垒失守…'),375,320,44,'#ffb0a0','center');txt(B.endless?L('버틴 웨이브 ','坚持波数 ')+(B.wave-1)+L('  ·  최고 ','  ·  最高 ')+save.endlessBest:B.st.label+'  '+L('웨이브 ','第 ')+B.wave+' / '+B.waves+L('','波'),375,374,21,'#f0d8d0','center',false);
 crystal(300,450,52);txt('+'+R.cry*(R.adDone?2:1),400,452,36,'#bff4ff','center');
 const tipT=L('실패해도 결정은 챙겨요! 연구소에서 요새를 강화하고 다시 도전하세요.\n같은 짝의 방을 위아래로 붙여 Lv2로 키우면 강력한 융합 방이 됩니다.','失败也能获得晶体！去研究所强化堡垒再来挑战。\n把配对的两个房间上下相邻并升到Lv2，就能融合成强力房间。');paragraphs(tipT,100,520,19,'#f6efe4',550);
 if(!R.adDone)adButton(140,700,470,86,L('광고 보고 결정 2배','看广告晶体翻倍'),24);
 button(90,820,280,96,L('연구소 가기','去研究所'),'teal',24);button(380,820,280,96,L('다시 도전','再次挑战'),'gold',28);button(235,930,280,70,L('작전 지도','作战地图'),'gray',22)}
function drawBattleBg(){if(B&&!img('bg'+(B.ch+1),0,0,W,H)){g.fillStyle='#333';g.fillRect(0,0,W,H)}if(B){drawTower()}}
// ---------------------------------------------------------------- 설정 · 개인정보 · 안내서
function settingsScreen(){g.fillStyle='#1a120c';g.fillRect(0,0,W,H);topBar(L('설정','设置'));
 button(130,140,490,76,L('화질: ','画质：')+(qualityLow?L('절약','省电'):L('높음','高')),'gray',24);txt(qualityManual?L('수동 설정됨','已手动设置'):L('기기 성능에 따라 자동 전환','根据设备性能自动切换'),375,234,16,'#b8a890','center',false);
 button(130,262,240,76,L('배경음악: ','音乐：')+onoff(Music.on),'gray',22);button(380,262,240,76,L('효과음: ','音效：')+onoff(AudioFx.enabled),'gray',22);
 button(130,358,240,76,L('흔들림: ','屏幕晃动：')+onoff(save.shake!==false),'gray',22);button(380,358,240,76,L('진동: ','振动：')+onoff(save.vib!==false),'gray',22);
 button(130,454,490,76,'🌐 '+(LANG==='zh'?'语言：简体中文':'언어: 한국어'),'gray',24);
 button(130,550,490,76,L('순화 연출: ','温和画面：')+onoff(save.mild),'gray',22);txt(L('쓰러질 때 분홍 포자 대신 옅은 빛으로 표시','倒下时以柔和光效代替粉色孢子'),375,644,15,'#b8a890','center',false);
 button(130,672,490,76,L('개인정보 처리방침','隐私政策'),'teal',22);
 button(130,790,490,76,L('진행 초기화','重置进度'),'red',22);if(resetArm>0)txt(L('한 번 더 누르면 모든 진행이 지워집니다','再按一次将清除所有进度'),375,890,17,'#ff9a8a','center',false);
 txt(L('버섯 요새 v1.0 · 빌드 ','蘑菇堡垒 v1.0 · 版本 ')+BUILD,375,1150,15,'#8a7a68','center',false);
 button(150,1200,450,80,L('◀ 돌아가기','◀ 返回'),'gold',26)}
function privacyScreen(){g.fillStyle='#1a120c';g.fillRect(0,0,W,H);topBar(L('개인정보 처리방침','隐私政策'));rr(40,120,670,1040,16,'#2a1a10','#5a4030',2);
 const T2=L('1. 이 게임은 회원가입이 없으며, 개발자는 이름·전화번호·위치 같은 개인정보를 수집하지 않습니다.\n\n2. 게임 진행 기록(스테이지, 결정, 설정)은 이 기기 안에만 저장됩니다. 게임을 삭제하거나 저장 공간을 지우면 함께 지워집니다.\n\n3. 보상형 광고는 위챗·더우인 플랫폼이 제공합니다. 광고를 보여 주기 위해 플랫폼이 기기 정보를 처리할 수 있으며, 이는 각 플랫폼의 개인정보 정책을 따릅니다.\n\n4. 게임 개선을 위해 스테이지 시작·클리어·실패, 광고 시청 같은 익명 통계를 플랫폼 통계 기능으로 집계합니다. 개인을 식별하는 정보는 포함하지 않습니다.\n\n5. 공유 기능은 사용자가 직접 누를 때만 작동합니다.\n\n6. 문의: 게임 정보 페이지의 개발자 연락처로 보내 주세요.',
 '1. 本游戏无需注册，开发者不收集姓名、手机号、位置等个人信息。\n\n2. 游戏进度（关卡、晶体、设置）仅保存在本设备中，删除游戏或清除缓存后将一并删除。\n\n3. 激励视频广告由微信/抖音平台提供。为展示广告，平台可能处理设备信息，相关处理遵循各平台的隐私政策。\n\n4. 为改进游戏，我们通过平台统计功能汇总关卡开始/通关/失败、广告观看等匿名数据，不包含可识别个人身份的信息。\n\n5. 分享功能仅在用户主动点击时使用。\n\n6. 联系方式：请通过游戏资料页中的开发者联系方式与我们联系。');
 paragraphs(T2,70,170,19,'#e8dccc',610,30);button(150,1200,450,80,L('◀ 돌아가기','◀ 返回'),'gold',26)}
const GUIDE=[{t:['게임 흐름','游戏流程']},{t:['전투 조작','战斗操作']},{t:['융합','融合']},{t:['성장','成长']}];
function guideScreen(){g.fillStyle='#1a120c';g.fillRect(0,0,W,H);topBar(L('작전 안내서','作战指南'));
 GUIDE.forEach((q,k)=>{const x=24+k*177;rr(x,112,165,56,14,k===guidePage?'#3a2614':'#2a1a10',k===guidePage?'#ffcf6a':'#5a4030',2);txt(LL(q.t),x+82,140,19,k===guidePage?'#ffe2a0':'#c9b8a0','center')});
 const box=(y,h,ic,t,d)=>{rr(30,y,690,h,16,'#2a1a10f0','#5a4030',2);if(ic)icon(ic,48,y+18,84);txt(LL(t),150,y+40,23,'#ffe2a0');paragraphs(LL(d),150,y+78,17,'#e8dccc',548,26)};
 if(guidePage===0){const steps=[['icm4',['보급 카드 고르기','选择补给卡'],['웨이브 전마다 3장 중 1장: 새 방 · 강화 · 보급품','每波前三选一：新房间·强化·补给']],['icw15',['감염체 막기','抵挡感染体'],['방은 자동으로 공격해요. 부품으로 강화!','房间自动攻击。用零件强化！']],['icc0',['융합','融合'],['짝이 맞는 두 방을 위아래로 붙여 Lv2 → 융합','配对的两个房间上下相邻升到Lv2 → 融合']],['icm1',['결정 모으기','收集晶体'],['클리어하면 결정 → 연구소 · 동료 강화','通关获得晶体 → 研究所·伙伴强化']]];
  steps.forEach((s,k)=>{const y=196+k*230;rr(80,y,590,180,20,'#2a1a10f0','#c08a4a',2);icon(s[0],104,y+44,92);txt(LL(s[1]),220,y+60,26,'#ffe2a0');paragraphs(LL(s[2]),220,y+102,18,'#e8dccc',430,26);if(k<3){g.fillStyle='#ffcf6a';g.beginPath();g.moveTo(355,y+190);g.lineTo(395,y+190);g.lineTo(375,y+222);g.closePath();g.fill()}})}
 else if(guidePage===1){box(196,200,'icm0',['방을 눌러 강화','点击房间强化'],['감염체를 처치하면 부품이 쌓여요. 방 오른쪽 위 초록 ▲가 뜨면 눌러서 바로 강화! 지붕 위 "+ 증축"으로 층을 올릴 수 있어요(최대 6층).','击杀感染体获得零件。房间右上出现绿色▲时点击即可强化！点屋顶的“+扩建”可加盖楼层（最多6层）。']);
  box(412,200,'op_engineer',['동료 스킬','伙伴技能'],['왼쪽 아래 동료 얼굴이 빛나면 눌러서 스킬 사용. 동료 탭에서 출격할 동료를 바꿀 수 있어요.','左下角伙伴头像发光时点击使用技能。可在伙伴页面更换出战伙伴。']);
  box(628,200,'pr10',['보급 상자','补给箱'],['낙하산 상자가 떨어지면 눌러서 열기: 부품 · 스킬 충전 · 수리 중 하나!','降落伞箱子落地后点击打开：零件·技能充能·维修三选一！']);
  box(844,200,'ka0',['날아다니는 적','飞行敌人'],['포자 머리는 하늘을 날아요. 박격포·물대포·지뢰·폭탄통은 땅 전용이라 못 맞혀요. 기관총·석궁·저격·드론을 섞으세요.','孢子头在空中飞行。迫击炮/水炮/地雷/炸药桶仅打地面，请搭配机枪/弩炮/狙击/无人机。'])}
 else if(guidePage===2){paragraphs(L('융합 방법: 짝이 맞는 두 방이 위아래로 붙어 있고 둘 다 Lv2 이상이면 사이에 "융합!" 버튼이 떠요. 누르면 두 방이 하나의 강력한 기계로 합쳐지고, 위층은 비어 새 방을 받을 수 있어요.','融合方法：配对的两个房间上下相邻且都达到Lv2时，中间会出现“融合！”按钮。点击后两个房间合成一台强力机器，上层会空出来可以放新房间。'),50,200,19,'#f6efe4',650,30);
  FUSE.forEach((F,i)=>{const x=30+(i%3)*232,y=340+Math.floor(i/3)*210,seen=save.seenFuse[F.id];rr(x,y,222,198,14,'#2a1a10f0',seen?'#5fffe0':'#5a4030',2);g.save();if(!seen)g.globalAlpha=.25;imgC('fu_'+String(F.id).padStart(2,'0'),x+111,y+76,120);g.restore();fitTxt(seen?LL(F.n):'???',x+111,y+152,18,206,seen?'#bffff4':'#c9b8a0','center');fitTxt(seen||save.cleared>=ROOM_UNLOCK[F.a]?LL(ROOMS[F.a].n)+' + '+(seen?LL(ROOMS[F.b].n):'?'):'? + ?',x+111,y+180,14,206,'#d8c8b0','center',false)})}
 else{box(196,200,'icc0',['연구소','研究所'],['결정으로 요새 장갑 · 화력 · 시작 부품 등을 영구 강화해요. 막히면 여기부터!','用晶体永久强化装甲·火力·初始零件等。卡关先来这里！']);
  box(412,200,'op_gunner',['동료 영입','招募伙伴'],['스테이지를 진행하면 새 동료가 합류할 수 있어요. 스킬 레벨을 올리면 더 강해져요.','推进关卡可招募新伙伴。提升技能等级会更强。']);
  box(628,200,'icm4',['별 · 보상','星星·奖励'],['내구도 70% 이상으로 클리어하면 별 3개. 별을 모아 챕터 상자를 열어요. 매일 출석 · 미션 · 무료 보급 상자도 챙기세요.','耐久70%以上通关得3星。收集星星打开章节宝箱。每日签到·任务·免费补给箱别忘了。']);
  box(844,200,'icr0',['무한 포위전','无尽围攻'],['1장을 깨면 열려요. 끝없이 몰려오는 감염체를 상대로 최고 기록에 도전!','通关第1章后开放。挑战无尽感染体，刷新最高纪录！'])}
 button(30,1210,200,80,'◀','gray',30);button(520,1210,200,80,'▶','gray',30);button(250,1210,250,80,L('닫기','关闭'),'gold',26);txt((guidePage+1)+' / '+GUIDE.length,375,1180,16,'#b8a890','center',false)}
// ---------------------------------------------------------------- 음악 선택
function wantMusic(){if(sc==='loading')return;let k='menu';if(sc==='battle'){k=B&&B.bossOn?'boss':'battle';if(B&&B.result&&B.result.revive)k='battle'}else if(sc==='clear')k='win';else if(sc==='fail')k='lose';Music.play(k)}
// ---------------------------------------------------------------- 생명주기
function onAppHide(){if(sc==='battle'&&B&&!B.result&&!B.draft)paused=true;Music.stop();Music.hidden=true;persist();track('app_hide',{sc})}
function onAppShow(){Music.hidden=false;const k=Music.cur;Music.cur='';if(Music.on)Music.play(k||'menu');else Music.cur=k;last=0}
if(API){try{API.onHide&&API.onHide(onAppHide);API.onShow&&API.onShow(onAppShow)}catch(e){}}
else if(typeof document!=='undefined'){document.addEventListener('visibilitychange',()=>{if(document.hidden)onAppHide();else onAppShow()})}
// ---------------------------------------------------------------- 화면 전환 + 첫 방문 팁
let settingsRet='title';
function go(s){sc=s;AudioFx.cue('ui');
 if(s==='map'){tip('map',[['스테이지를 눌러 출격! 별은 남은 내구도로 정해져요.','点击关卡出击！星级由剩余耐久决定。'],['아래 탭: 연구소(영구 강화) · 동료(스킬) · 도감 · 보상','下方：研究所（永久强化）·伙伴（技能）·图鉴·奖励']])}
 else if(s==='lab')tip('lab',[['결정으로 영구 강화해요. 막히면 요새 장갑과 화력부터!','用晶体永久强化。卡关先升级装甲和火力！']]);
 else if(s==='ops')tip('ops',[['출격할 동료 1명을 고르면 전투 중 왼쪽 아래 스킬 버튼이 그 동료로 바뀌어요.','选择1名出战伙伴，战斗中左下技能按钮会变成该伙伴。']]);
 else if(s==='codex')tip('codex',[['융합 탭에서 아직 못 찾은 조합의 힌트를 볼 수 있어요.','在融合页可查看未发现组合的提示。']]);
 else if(s==='reward')tip('reward',[['매일 출석 · 미션 · 무료 보급 상자를 챙기세요. 별을 모으면 챕터 상자가 열려요.','每天领取签到·任务·免费补给箱。收集星星可开启章节宝箱。']])}
// ---------------------------------------------------------------- 입력
function toggleLang(){LANG=LANG==='zh'?'ko':'zh';if(LANG==='zh'&&save.mild===false){}persist();AudioFx.cue('ui')}
function touch(x,y){AudioFx.init();Music.kick();if(sc==='loading')return;if(adShow||adCb)return;if(guideTip){if(guideTip.t>.3)guideTip=null;return}
 if(sc==='title'){if(hit_(x,y,560,22,170,56)){toggleLang();return}if(hit_(x,y,150,1040,450,100)){if(save.cleared===0&&save.firstPlay)startStage(0);else go('map');return}
  if(hit_(x,y,150,1160,218,74)){guideRet='title';guidePage=0;go('guide');track('guide_open',{from:'title'});return}if(hit_(x,y,382,1160,218,74)){settingsRet='title';go('settings');return}return}
 if(['map','lab','ops','codex','reward'].includes(sc)&&y>1190){const k=Math.floor(x/150);const t=['map','lab','ops','codex','reward'][Math.max(0,Math.min(4,k))];if(t!==sc)go(t);return}
 if(sc==='map'){const c2=curCh();if(c2>0&&hit_(x,y,16,114,66,66)){mapCh--;AudioFx.cue('ui');return}if(c2<CH.length-1&&hit_(x,y,668,114,66,66)){mapCh++;AudioFx.cue('ui');return}
  if(save.cleared>=SPC&&hit_(x,y,530,212,200,62)){startStage(save.cleared,true);return}
  for(let k=0;k<SPC;k++){const s=c2*SPC+k,[nx,ny]=NODE[k];if(Math.hypot(x-nx,y-ny)<75){if(s<=save.cleared&&s<STAGE_N)startStage(s);else message(L('앞 스테이지를 먼저 클리어하세요','请先通关前面的关卡'),1.4);return}}return}
 if(sc==='lab'){LAB.forEach((it,k)=>{const yy=160+k*126;if(hit_(x,y,556,yy+24,158,66)){const lv=labLv(it.k),c3=labCost(it);if(lv>=it.max)return;if(save.cry<c3){message(L('결정이 부족해요','晶体不足'),1.2);return}save.cry-=c3;save.lab[it.k]=lv+1;persist();AudioFx.cue('build');vib('light');track('lab_up',{k:it.k,lv:lv+1})}});return}
 if(sc==='ops'){OP_KEYS.forEach((k,i)=>{const O=OPS[k],xx=24+(i%2)*357,yy=160+Math.floor(i/2)*336,own=!!save.ops[k];
   if(own){if(save.op!==k&&hit_(x,y,xx+16,yy+258,150,52)){save.op=k;persist();AudioFx.cue('ui')}else if(hit_(x,y,xx+176,yy+258,154,52)&&(save.ops[k]||1)<5){const c3=opLvCost(k);if(save.cry>=c3){save.cry-=c3;save.ops[k]++;persist();AudioFx.cue('build')}else message(L('결정이 부족해요','晶体不足'),1.2)}}
   else if(save.cleared>=O.unlock&&hit_(x,y,xx+40,yy+258,265,52)){if(save.cry>=O.cost){save.cry-=O.cost;save.ops[k]=1;save.op=k;persist();AudioFx.cue('power');message(LL(O.n)+L(' 합류!',' 加入！'),1.6);track('op_recruit',{k})}else message(L('결정이 부족해요','晶体不足'),1.2)}});return}
 if(sc==='codex'){for(let k=0;k<3;k++)if(hit_(x,y,24+k*236,112,224,60)){codexTab=k;AudioFx.cue('ui')}return}
 if(sc==='reward'){dailyInit();
  if(hit_(x,y,490,268,220,44)&&attCan()){const r=ATT[save.att.streak%7];save.att.streak++;save.att.last=todayKey();giveCry(r,L('출석','签到'));return}
  save.daily.m.forEach((m,k)=>{const M=MISSIONS[m.i];if(hit_(x,y,580,384+k*88+14,120,50)&&!m.c&&m.p>=M.goal){m.c=true;giveCry(M.r,LL(M.n))}});
  for(let c2=0;c2<CH.length;c2++)for(let t=0;t<2;t++)if(hit_(x,y,440+t*136,716+c2*60+4,126,46)){const id=c2*2+t;if(!save.chest.includes(id)&&chStars(c2)>=(t?18:9)){save.chest.push(id);giveCry(t?200+c2*80:80+c2*40,L('챕터 상자','章节宝箱'))}}
  if(adBoxLeft()>0&&hit_(x,y,180,1096,330,66))showAd('free_box',()=>{save.adBox.n++;giveCry(40+save.cleared*4,L('보급 상자','补给箱'))});return}
 if(sc==='settings'){
  if(hit_(x,y,130,140,490,76)){qualityLow=!qualityLow;qualityManual=true;persist();return}
  if(hit_(x,y,130,262,240,76)){Music.toggle();persist();return}if(hit_(x,y,380,262,240,76)){AudioFx.enabled=!AudioFx.enabled;persist();return}
  if(hit_(x,y,130,358,240,76)){save.shake=save.shake===false;persist();return}if(hit_(x,y,380,358,240,76)){save.vib=save.vib===false;persist();if(save.vib)vib('medium');return}
  if(hit_(x,y,130,454,490,76)){toggleLang();return}if(hit_(x,y,130,550,490,76)){save.mild=!save.mild;persist();return}
  if(hit_(x,y,130,672,490,76)){go('privacy');return}
  if(hit_(x,y,130,790,490,76)){if(resetArm>0){try{if(API&&API.removeStorageSync)API.removeStorageSync(SAVE_KEY);else localStorage.removeItem(SAVE_KEY)}catch(e){}const keep=LANG;for(const k in save)delete save[k];Object.assign(save,{tips:{},daily:null,att:{last:'',streak:0},chest:[],stars:[],cleared:0,cry:0,lab:{},ops:{eng:1},op:'eng',seenFuse:{},seenZ:{},endlessBest:0,lang:keep,shake:true,vib:true,music:true,sfx:true,mild:LANG==='zh'||!!API,firstPlay:true,stats:{kills:0,fuse:0},adBox:null,statc:{}});persist();resetArm=0;message(L('초기화했어요','已重置'),1.4);sc='title'}else{resetArm=3}return}
  if(hit_(x,y,150,1200,450,80)){if(settingsRet==='battle'){sc='battle'}else go(settingsRet)}return}
 if(sc==='privacy'){if(hit_(x,y,150,1200,450,80))go('settings');return}
 if(sc==='guide'){for(let k=0;k<GUIDE.length;k++)if(hit_(x,y,24+k*177,112,165,56)){guidePage=k;return}if(hit_(x,y,30,1210,200,80)){guidePage=(guidePage+GUIDE.length-1)%GUIDE.length;return}if(hit_(x,y,520,1210,200,80)){guidePage=(guidePage+1)%GUIDE.length;return}if(hit_(x,y,250,1210,250,80)){sc=guideRet;AudioFx.cue('ui')}return}
 if(sc==='clear'){const R=B.result;if(hit_(x,y,560,200,110,56)){shareGame();return}if(!R.adDone&&hit_(x,y,140,850,470,90)){showAd('double_clear',()=>{R.adDone=true;save.cry+=R.cry;persist();AudioFx.cue('coin')});return}
  if(hit_(x,y,90,960,280,96)){mapCh=-1;go('map');return}if(hit_(x,y,380,960,280,96)){if(B.s+1<STAGE_N)startStage(B.s+1);else{mapCh=-1;go('map')}}return}
 if(sc==='fail'){const R=B.result;if(!R.adDone&&hit_(x,y,140,700,470,86)){showAd('double_fail',()=>{R.adDone=true;save.cry+=R.cry;persist();AudioFx.cue('coin')});return}
  if(hit_(x,y,90,820,280,96)){go('lab');return}if(hit_(x,y,380,820,280,96)){startStage(B.s,B.endless);return}if(hit_(x,y,235,930,280,70)){mapCh=-1;go('map')}return}
 if(sc==='battle'&&B)battleTouch(x,y)}
function battleTouch(x,y){
 if(B.result&&B.result.revive){if(hit_(x,y,155,620,440,96)){showAd('revive',revive);return}if(hit_(x,y,195,750,360,80)){B.revived=true;endFail()}return}
 if(paused){if(hit_(x,y,175,510,400,90)){paused=false;return}if(hit_(x,y,175,620,400,80)){guideRet='battle';guidePage=1;sc='guide';return}if(hit_(x,y,175,720,400,80)){settingsRet='battle';sc='settings';return}if(hit_(x,y,175,820,400,80)){track('stage_quit',{stage:B.st.label,wave:B.wave});paused=false;if(B.endless){endFail()}else{mapCh=-1;go('map')}}return}
 if(B.draft){const d=B.draft;if(d.t<.35)return;const n=d.opts.length,cw=n>3?168:218,gap=n>3?10:16,x0=375-(n*cw+(n-1)*gap)/2;
  for(let k=0;k<n;k++)if(hit_(x,y,x0+k*(cw+gap),390,cw,cw*1.36+130)){applyCard(d.opts[k]);return}
  if(!d.first&&!B.rerolled&&hit_(x,y,205,980,340,78))showAd('reroll',()=>{B.rerolled=true;if(B.draft)B.draft.opts=makeCards(false,n)});return}
 if(hit_(x,y,12,12,84,84)){paused=true;AudioFx.cue('ui');return}
 if(hit_(x,y,16,1138,164,164)){useSkill();return}
 if(hit_(x,y,588,1170,138,74)){speed=speed===1?2:1;AudioFx.cue('ui');return}
 for(const cr of B.crates)if(cr.landed&&!cr.open&&Math.hypot(x-cr.x,y-(cr.y-30))<70){openCrate(cr);return}
 for(const ch of fuseChips()){const yy=(floorY(ch.i)+floorY(ch.i+1))/2,xx=TX-RW/2-6;if(hit_(x,y,xx-64,yy-32,128,64)){doFuse(ch);return}}
 const n=B.floors.length;if(n<MAXF){const yy=floorY(n)+RH/2-60;if(hit_(x,y,TX-80,yy-30,160,56)){tryExpand();return}}
 if(x>TX-RW/2&&x<TX+RW/2)for(let i=0;i<n;i++){const fy=floorY(i);if(y>fy-FH/2&&y<=fy+FH/2){if(!tryUpgrade(i)&&!B.floors[i].type&&!B.floors[i].fu)message(L('빈 층 · 다음 보급에서 방을 받을 수 있어요','空楼层 · 下次补给可获得房间'),1.4);return}}}
function coords(px,py){if(API){const k=c.width/(info.windowWidth||375);return [(px*k-view.ox)/view.s,(py*k-view.oy)/view.s]}const r=c.getBoundingClientRect();return [(px-r.left)/r.width*W,(py-r.top)/r.height*H]}
if(API){API.onTouchEnd&&API.onTouchEnd(e=>{const p=(e.changedTouches||e.touches||[])[0];if(!p)return;const [x,y]=coords(p.clientX,p.clientY);touch(x,y)})}
else c.addEventListener('pointerup',e=>{const [x,y]=coords(e.clientX,e.clientY);touch(x,y)});
// ---------------------------------------------------------------- 저사양 자동 전환
let perfAcc=0,perfFrames=0,perfBad=0;
function perf(dt){if(qualityManual||sc!=='battle'||paused)return;perfAcc+=dt;perfFrames++;if(perfAcc>=2){const fps=perfFrames/perfAcc;perfAcc=0;perfFrames=0;if(fps<42){perfBad++;if(perfBad>=2&&!qualityLow){qualityLow=true;message(L('저사양 모드 자동 적용','已自动切换省电模式'),1.2)}}else perfBad=0}}
function drawBanner(){if(bannerT>0&&sc!=='battle'&&bannerSc===sc){g.save();g.globalAlpha=Math.min(1,bannerT*2);rr(100,1100,550,64,16,'#2a1a10f0','#ffcf6a',2);fitTxt(banner,375,1132,21,520,'#fff','center');g.restore();bannerT-=1/60}}
function draw(dt){if(API){g.setTransform(1,0,0,1,0,0);g.fillStyle='#000';g.fillRect(0,0,c.width,c.height);g.setTransform(view.s,0,0,view.s,view.ox,view.oy)}else g.setTransform(1,0,0,1,0,0);
 if(save.shake===false)shake=0;if(resetArm>0)resetArm-=dt;
 if(sc!=='battle')frame+=Math.min(dt,.05);
 if(sc==='loading')loadingScreen();else if(sc==='title')title();else if(sc==='map')mapScreen();else if(sc==='lab')labScreen();else if(sc==='ops')opsScreen();else if(sc==='codex')codexScreen();else if(sc==='reward')rewardScreen();
 else if(sc==='settings')settingsScreen();else if(sc==='privacy')privacyScreen();else if(sc==='guide')guideScreen();
 else if(sc==='battle'){if(!guideTip)tick(dt);if(B)drawBattle()}else if(sc==='clear')clearScreen();else if(sc==='fail')failScreen();
 if(sc==='battle'&&B&&!B.draft&&!B.result&&!save.tips.fuse&&B.chips&&B.chips.some(ch=>ch.ready))tip('fuse',[['짝이 맞는 두 방이 위아래로 붙고 둘 다 Lv2가 되면 "융합!" 버튼이 떠요.','配对的两个房间上下相邻并都达到Lv2时，会出现“融合！”按钮。'],['누르면 강력한 융합 기계가 되고 위층은 비어요.','点击后变成强力融合机器，上层空出来。']]);
 if(sc==='battle'&&B&&B.wave===1&&B.phase==='wave'&&B.zs.some(z=>z.type==='flyer')&&!save.tips.fly)tip('fly',[['포자 머리는 날아다녀요! 박격포·물대포·지뢰·폭탄통은 땅 전용이라 못 맞혀요.','孢子头会飞！迫击炮/水炮/地雷/炸药桶只能打地面。']]);
 if(guideTip)drawGuideTip();if(adShow)drawAd();drawBanner();wantMusic()}
// ---------------------------------------------------------------- 디버그 (?debug=1 에서만)
if(!API&&typeof location!=='undefined'&&location.search.indexOf('debug=1')>=0){globalThis.__bepaDebug={
 get B(){return B},get sc(){return sc},set sc(v){sc=v},save,persist,startStage,spawnZ,useSkill,doFuse,fuseChips,applyCard,openDraft,tryUpgrade,tryExpand,openCrate,revive,endFail,stageWin,showAd,mission,touch,drawBattle,tick,ZT,ROOMS,FUSE,STAGE_N,
 set bot(v){autoBot=v},get bot(){return autoBot},setQuality(v){qualityLow=v},set guideTip(v){guideTip=v},get guideTip(){return guideTip},set guidePage(v){guidePage=v},set codexTab(v){codexTab=v},set mapCh(v){mapCh=v},
 setFloors(arr){B.floors=arr.map(a=>Object.assign(newFloor(),a))},
 step(n,dt=1/60,drawEvery=0){let err=0;for(let i=0;i<n;i++){guideTip=null;if(autoBot)botStep();if(B&&B.result&&B.result.revive&&autoBot){B.revived=true;endFail();}tick(dt);if(drawEvery&&i%drawEvery===0&&sc==='battle'&&B){try{drawBattle()}catch(e){err++;if(err<3)console.error(e)}}if(sc!=='battle')break}return err},
 get state(){return B?{sc,wave:B.wave,waves:B.waves,hp:Math.round(B.hp),maxHP:B.maxHP,scrap:B.scrap,zs:B.zs.length,q:B.spawnQ.length,phase:B.phase,draft:!!B.draft,floors:B.floors.map(f=>(f.fu?'F'+f.fu:f.type||'-')+':'+f.lv).join(','),kills:B.kills,result:B.result&&{win:B.result.win,stars:B.result.stars,revive:B.result.revive}}:{sc}}};}
let drawErr=0;function loop(now){let dt=last?(now-last)/1000:0;last=now;perf(Math.min(dt,.25));try{draw(Math.min(dt,.1))}catch(e){drawErr++;try{g.restore();g.restore();g.restore()}catch(e2){}g.globalAlpha=1;g.globalCompositeOperation='source-over';if(drawErr<5&&typeof console!=='undefined')console.error('draw error',e);if(drawErr===1)track('draw_error',{m:String(e&&e.message||e).slice(0,80),sc})}
 if(API){if(typeof requestAnimationFrame==='function')requestAnimationFrame(loop);else if(c.requestAnimationFrame)c.requestAnimationFrame(loop)}else requestAnimationFrame(loop)}
if(API){if(typeof requestAnimationFrame==='function')requestAnimationFrame(loop);else if(c.requestAnimationFrame)c.requestAnimationFrame(loop)}else requestAnimationFrame(loop);
})();
