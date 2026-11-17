/* RECLAIM: 돌아온 땅 — G1 도형 프로토타입 (A트랙 미니게임판)
 * 1막 탈출 → 불시착 해역 선택 → 해상 생존(배 키우기) → 섬 상륙
 * Canvas2D · 외부 CDN 없음 · 강제 광고 없음 · 한국어 / 简体中文
 * 공통 출시 틀(플랫폼·로딩·언어·저장·소리·생명주기·광고·공유·통계·매일 보상·안내·설정·안전장치·디버그)은 DEAD RUSH V12에서 옮겨 옴
 */
(()=>{'use strict';
const W=750,H=1334,TAU=Math.PI*2;
// ================================================================ 플랫폼 계층
const PLATFORM=typeof wx!=='undefined'?'wx':typeof tt!=='undefined'?'tt':'web';
const API=PLATFORM==='wx'?wx:PLATFORM==='tt'?tt:null;
const c=API?API.createCanvas():document.getElementById('game');
let g=c.getContext('2d');
const info=API?(API.getSystemInfoSync?API.getSystemInfoSync():{windowWidth:375,windowHeight:667,pixelRatio:1}):null;
let view={s:1,ox:0,oy:0};
if(API){const dpr=Math.min(2,info.pixelRatio||1);c.width=Math.max(1,Math.round((info.windowWidth||375)*dpr));c.height=Math.max(1,Math.round((info.windowHeight||667)*dpr));
 const s=Math.min(c.width/W,c.height/H);view={s,ox:(c.width-W*s)/2,oy:(c.height-H*s)/2}}
else{c.width=W;c.height=H}
function mkCanvas(w,h){const cv=API?API.createCanvas():document.createElement('canvas');cv.width=w;cv.height=h;return cv}
const BUILD='1117-2000';
// 안전장치: 음수 반지름이면 그리기 전체가 멈추므로 보정
(function(){const P=Object.getPrototypeOf(g);if(!P||P.__safe)return;P.__safe=true;const oa=P.arc,oe=P.ellipse;
 if(oa)P.arc=function(x,y,r,a0,a1,ccw){return oa.call(this,x,y,r>0&&isFinite(r)?r:0,a0,a1,ccw)};
 if(oe)P.ellipse=function(x,y,rx,ry,rot,a0,a1,ccw){return oe.call(this,x,y,rx>0&&isFinite(rx)?rx:0,ry>0&&isFinite(ry)?ry:0,rot,a0,a1,ccw)}})();
// 그림 자원: G1은 도형만 사용. 그림을 넣을 때 IMG_LIST·MUST에 추가하면 로딩 화면이 자동으로 기다린다
const imgs={},imgFail={};const IMG_LIST=['hero','inf_walker','inf_runner','icons','world','title','tile_ocean','tile_grass'],MUST=IMG_LIST.slice();
const ART={"cell":164,"hero":{"idle":{"row":0,"n":8},"walk":{"row":1,"n":8},"run":{"row":2,"n":8},"attack":{"row":3,"n":4},"gather":{"row":4,"n":4},"craft":{"row":5,"n":4},"fish":{"row":6,"n":4},"drink":{"row":7,"n":4},"eat":{"row":8,"n":4},"sleep":{"row":9,"n":2},"collapse":{"row":10,"n":4}},"inf_walker":{"walk":{"row":0,"n":8},"attack":{"row":1,"n":4},"down":{"row":2,"n":4}},"inf_runner":{"walk":{"row":0,"n":8},"attack":{"row":1,"n":4},"down":{"row":2,"n":4}},"icons":{"cell":112,"cols":6,"idx":{"plank":0,"plastic":1,"cloth":2,"scrap":3,"rope":4,"water":5,"can":6,"fish":7,"cooked":8,"berry":9,"med":10,"flint":11,"rain":12,"fire":13,"still":14,"bed":15,"radio":16,"sail":17,"rod":18,"lash":19,"crate":20,"deck":21,"knife":22,"lighter":23,"filter":24,"flash":25,"tools":26}},"world":{"deck0":[0,0,128,128],"deck1":[130,0,128,128],"deck2":[260,0,128,128],"deck3":[390,0,128,128],"deckb0":[520,0,142,142],"debris_plank":[664,0,120,72],"debris_plastic":[786,0,110,70],"debris_cloth":[898,0,110,62],"debris_crate":[0,144,110,74],"debris_scrap":[112,144,110,71],"debris_supply":[224,144,120,119],"tree":[346,144,170,192],"tree_chop":[518,144,170,205],"stump":[690,144,120,93],"bush":[812,144,130,126],"rock":[0,351,140,129],"stream":[142,351,150,150],"hut":[294,351,300,238],"beach":[596,351,160,160],"boat":[758,351,200,110],"asphalt":[0,591,160,160],"building":[162,591,260,259],"car":[424,591,190,104],"plane":[616,591,300,277],"barricade":[0,870,210,93],"building2":[0,965,260,244],"car2":[262,965,190,129],"shadow":[454,965,360,168],"building3":[0,1211,260,244]}};// 그림 배치표 (res/*.png 아틀라스)
function loadImg(name,tries=0){const im=API?(API.createImage?API.createImage():c.createImage()):new Image();im.onload=()=>{imgs[name]=im};im.onerror=()=>{if(tries<8)setTimeout(()=>loadImg(name,tries+1),600+tries*900);else imgFail[name]=1};im.src='res/'+name+(name==='title'||name.indexOf('tile_')===0?'.jpg':'.png')+'?v='+BUILD}
IMG_LIST.forEach(n=>loadImg(n));
const GLOW_COL={o:[255,150,60],y:[255,220,120],w:[255,250,235],b:[120,190,255]};const glow={};
(function(){for(const k in GLOW_COL){const cv=mkCanvas(64,64),x=cv.getContext('2d'),[r,gg,b]=GLOW_COL[k],gr=x.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,`rgba(${r},${gg},${b},1)`);gr.addColorStop(.3,`rgba(${r},${gg},${b},.6)`);gr.addColorStop(1,`rgba(${r},${gg},${b},0)`);x.fillStyle=gr;x.fillRect(0,0,64,64);glow[k]=cv}})();

// 순화 모드용 어두운 감염체: 불러온 뒤 한 번 만들어 둔다
const imgMild={};function mildOf(name){if(imgMild[name]!==undefined)return imgMild[name];const im=imgs[name];if(!im)return null;try{const cv=mkCanvas(im.width,im.height),x=cv.getContext('2d');x.drawImage(im,0,0);x.globalCompositeOperation='source-atop';x.fillStyle='rgba(16,18,26,.72)';x.fillRect(0,0,im.width,im.height);imgMild[name]=cv}catch(e){imgMild[name]=null}return imgMild[name]}
// 스프라이트: 아틀라스 칸은 왼쪽을 보는 그림. face>0이면 좌우 뒤집기. y는 발 위치
const imgSurv={};function survImg(i){if(imgSurv[i]!==undefined)return imgSurv[i];const im=imgs.hero;if(!im)return null;try{const cv=mkCanvas(im.width,im.height),x=cv.getContext('2d');x.drawImage(im,0,0);x.globalCompositeOperation='source-atop';x.fillStyle=SURV[i].tint;x.fillRect(0,0,im.width,im.height);imgSurv[i]=cv}catch(e){imgSurv[i]=null}return imgSurv[i]}
function sprite(name,anim,t,x,y,h,face,fps,alpha){const sv=name.indexOf('surv')===0;const im=sv?(survImg(+name[4])||imgs.hero):(save.mild&&name!=='hero')?(mildOf(name)||imgs[name]):imgs[name];const A2=ART[sv?'hero':name];if(!im||!A2||!A2[anim])return false;const a=A2[anim],C=ART.cell;const f=fps<0?Math.min(a.n-1,Math.floor(t*-fps)):Math.floor(t*(fps||10))%a.n;
 const s=h/C;g.save();if(alpha!==undefined)g.globalAlpha=alpha;g.translate(x,y);if(face>0)g.scale(-1,1);g.drawImage(im,f*C,a.row*C,C,C,-C*s/2,-C*s+4*s,C*s,C*s);g.restore();return true}
function icon(k,x,y,size){const im=imgs.icons,I=ART.icons;if(!im||I.idx[k]===undefined)return false;const i=I.idx[k],C=I.cell;g.drawImage(im,(i%I.cols)*C,Math.floor(i/I.cols)*C,C,C,x-size/2,y-size/2,size,size);return true}
function wsp(k,x,y,w,anchor){const im=imgs.world,r=ART.world[k];if(!im||!r)return false;const h=w*r[3]/r[2];g.drawImage(im,r[0],r[1],r[2],r[3],x-w/2,anchor==='bottom'?y-h:y-h/2,w,h);return true}
function wspPart(k,sx,sy,sw,sh,dx,dy,dw,dh){const im=imgs.world,r=ART.world[k];if(!im||!r)return false;g.drawImage(im,r[0]+sx*r[2],r[1]+sy*r[3],sw*r[2],sh*r[3],dx,dy,dw,dh);return true}
const ICON_OF={deck:'deck',rod:'rod',lash:'lash',flint:'flint',plank:'plank',plastic:'plastic',cloth:'cloth',scrap:'scrap',rope:'rope',water:'water',can:'can',fish:'fish',cooked:'cooked',med:'med',berry:'berry',crate:'crate',supply:'crate',
 rain:'rain',fire:'fire',still:'still',bed:'bed',radio:'radio',sail:'sail',bag_line:'rod',bag_knife:'knife',bag_lighter:'lighter',bag_filter:'filter',bag_flash:'flash',bag_tools:'tools',bag_water:'water',bag_can:'can',bag_med:'med',bag_rope:'rope',bag_tarp:'cloth',bag_radio:'radio'};
// ================================================================ 소리 (음원이 없으면 합성음으로 대체)
const Music={el:null,cur:'',on:true,vol:.5,src:null,gain:null,bufs:{},nat:null,hidden:false,
 play(key){if(this.cur===key)return;this.cur=key;if(!this.on||this.hidden)return;this._start(key)},
 _start(key){const loop=true;
  if(API&&API.createInnerAudioContext){if(API.loadSubpackage&&!this.subOk){if(!this.subReq){this.subReq=true;try{API.loadSubpackage({name:'audio',success:()=>{this.subOk=true;const k=this.cur;this.cur='';this.play(k)},fail:()=>{this.subReq=false}})}catch(e){this.subOk=true}}return}
   try{if(this.nat)this.nat.stop();if(!this.natPool)this.natPool={};let a=this.natPool[key];if(!a){a=API.createInnerAudioContext();a.src=(API.loadSubpackage?'audio/':'res/')+'bgm_'+key+'.mp3';a.loop=loop;this.natPool[key]=a}a.volume=this.vol;a.seek&&a.seek(0);a.play();this.nat=a}catch(e){}return}
  const ctx=AudioFx.ctx;
  if(ctx&&typeof fetch==='function'&&typeof location!=='undefined'&&location.protocol!=='file:'){this._stopWeb();const go=b=>{if(this.cur!==key||!this.on)return;try{const s2=ctx.createBufferSource(),gn=ctx.createGain();s2.buffer=b;s2.loop=loop;gn.gain.setValueAtTime(0,ctx.currentTime);gn.gain.linearRampToValueAtTime(this.vol,ctx.currentTime+1.2);s2.connect(gn);gn.connect(ctx.destination);s2.start();this.src=s2;this.gain=gn}catch(e){}};
   if(this.bufs[key])go(this.bufs[key]);else if(!this.miss||!this.miss[key])fetch('res/bgm_'+key+'.mp3?v='+BUILD).then(r=>{if(!r.ok)throw 0;return r.arrayBuffer()}).then(ab=>ctx.decodeAudioData(ab,b=>{this.bufs[key]=b;go(b)},()=>{})).catch(()=>{this.miss=this.miss||{};this.miss[key]=1})}},
 _stopWeb(){if(this.src&&this.gain&&AudioFx.ctx){const ctx=AudioFx.ctx,s2=this.src,gn=this.gain;try{gn.gain.cancelScheduledValues(ctx.currentTime);gn.gain.setValueAtTime(gn.gain.value,ctx.currentTime);gn.gain.linearRampToValueAtTime(0,ctx.currentTime+.6);s2.stop(ctx.currentTime+.65)}catch(e){}}this.src=null;this.gain=null},
 stop(){this._stopWeb();if(this.el){try{this.el.pause()}catch(e){}}if(this.nat){try{this.nat.stop()}catch(e){}}},
 toggle(){this.on=!this.on;if(!this.on)this.stop();else{const k=this.cur;this.cur='';this.play(k||'menu')}},
 kick(){if(this.on&&this.cur&&!this.src&&!this.nat){const k=this.cur;this.cur='';this.play(k)}}};
const AudioFx={ctx:null,enabled:true,last:{},
 init(){if(!this.enabled||this.ctx||API)return;try{const A=typeof AudioContext!=='undefined'?AudioContext:typeof webkitAudioContext!=='undefined'?webkitAudioContext:null;if(A){this.ctx=new A();this.master=this.ctx.createGain();this.master.gain.value=.8;this.master.connect(this.ctx.destination)}}catch(e){}},
 beep(freq=440,dur=.07,kind='square',vol=.025,fall=0){if(!this.ctx)return;try{const t=this.ctx.currentTime,o=this.ctx.createOscillator(),v=this.ctx.createGain();o.type=kind;o.frequency.setValueAtTime(freq,t);if(fall)o.frequency.exponentialRampToValueAtTime(Math.max(40,freq*fall),t+dur);v.gain.setValueAtTime(vol,t);v.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(v);v.connect(this.master);o.start(t);o.stop(t+dur+.01)}catch(e){}},
 cue(key,gap=.05){if(!this.enabled)return;const now=Date.now()/1000;if(this.last[key]&&now-this.last[key]<gap)return;this.last[key]=now;
  switch(key){case 'ui':this.beep(480,.06,'sine',.02,1.1);break;case 'pick':this.beep(660,.09,'triangle',.03,1.5);break;case 'hook':this.beep(300,.18,'sine',.025,2.2);break;case 'chop':this.beep(150,.08,'square',.03,.6);break;
   case 'hit':this.beep(110,.12,'sawtooth',.035,.5);break;case 'hurt':this.beep(125,.18,'square',.03,.4);break;case 'splash':this.beep(220,.25,'triangle',.02,.4);break;case 'fire':this.beep(90,.3,'sawtooth',.015,.8);break;
   case 'thunder':this.beep(60,.6,'sawtooth',.05,.5);break;case 'warn':this.beep(700,.35,'sine',.02,.7);break;case 'win':this.beep(620,.3,'triangle',.035,1.5);break;case 'build':this.beep(240,.12,'square',.025,1.3);break}}};

// ================================================================ 언어
let LANG='ko';
try{if(API){const sl=((API.getSystemInfoSync&&API.getSystemInfoSync().language)||'').toLowerCase();LANG=sl.indexOf('ko')===0?'ko':'zh'}
 else{const langs=(typeof navigator!=='undefined'?(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||'']):[]).map(x=>(x||'').toLowerCase());
  let tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){}
  const zhTZ=/^Asia\/(Shanghai|Chongqing|Chungking|Harbin|Urumqi|Kashgar|Hong_Kong|Macau|Taipei)$/.test(tz)||tz==='PRC';
  if(langs[0]&&langs[0].indexOf('zh')===0)LANG='zh';else if(zhTZ)LANG='zh'}}catch(e){}
let LANG_FORCED=null;try{if(!API&&typeof location!=='undefined'){const m=location.search.match(/[?&]lang=(ko|zh)/);if(m)LANG_FORCED=m[1]}}catch(e){}if(LANG_FORCED)LANG=LANG_FORCED;
const L=(ko,zh)=>LANG==='zh'?zh:ko;
const LL=p=>Array.isArray(p)?(LANG==='zh'?p[1]:p[0]):(p||'');

// ================================================================ 저장
const SAVE_KEY='bepa_reclaim_g1';
const save={tips:{},daily:null,att:{last:'',streak:0},adBox:null,bank:{},run:null,stats:{days:0,debris:0,lands:0,best:0,runs:0},lang:null,qualityLow:false,qualityManual:false,shake:true,vib:true,music:true,sfx:true,g1fb:null,statc:{}};
let qualityLow=false,qualityManual=false,shakeReduced=false;
try{const raw=API&&API.getStorageSync?API.getStorageSync(SAVE_KEY):typeof localStorage!=='undefined'?localStorage.getItem(SAVE_KEY):null;const v=raw?JSON.parse(raw):null;if(v&&typeof v==='object'){for(const k in save)if(v[k]!==undefined)save[k]=v[k];save.stats=Object.assign({days:0,debris:0,lands:0,best:0,runs:0},v.stats||{})}}catch(e){}
if(!LANG_FORCED&&(save.lang==='ko'||save.lang==='zh'))LANG=save.lang;if(save.mild===undefined)save.mild=LANG==='zh'||!!API;if(save.sfx===false)AudioFx.enabled=false;if(save.music===false)Music.on=false;qualityLow=!!save.qualityLow;qualityManual=!!save.qualityManual;shakeReduced=!save.shake;
function persist(){if(R)R.pend=Land?{c:Land.carry,lit:!!Land.lit,rc:Land.clear?Land.di:-1}:null;save.lang=LANG;save.qualityLow=qualityLow;save.qualityManual=qualityManual;save.shake=!shakeReduced;try{const v=JSON.stringify(save);if(API&&API.setStorageSync)API.setStorageSync(SAVE_KEY,v);else if(typeof localStorage!=='undefined')localStorage.setItem(SAVE_KEY,v)}catch(e){}}
function todayKey(){const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()}

// ================================================================ 손맛 · 통계 · 광고 · 공유 · 생명주기
let vibT=0;function vib(kind){if(save.vib===false)return;const now=Date.now();if(kind==='light'&&now-vibT<250)return;vibT=now;try{if(API&&API.vibrateShort)API.vibrateShort({type:kind==='heavy'?'heavy':kind==='medium'?'medium':'light'});else if(API&&API.vibrateLong&&kind==='long')API.vibrateLong();else if(typeof navigator!=='undefined'&&navigator.vibrate)navigator.vibrate(kind==='heavy'?60:kind==='medium'?35:15)}catch(e){}}
let shakeT=0,shakeA=0;function shake(a,t){if(shakeReduced)return;shakeA=Math.max(shakeA,a);shakeT=Math.max(shakeT,t)}
// 위챗 reportEvent / 더우인 reportAnalytics — 관리자 화면에 같은 이름을 등록해야 집계됨 (README 목록 참고)
const STAT_LOG=[];function track(ev,data){data=data||{};try{STAT_LOG.push([ev,data]);if(STAT_LOG.length>300)STAT_LOG.shift();
 if(API&&PLATFORM==='wx'&&API.reportEvent)API.reportEvent(ev,data);else if(API&&PLATFORM==='tt'&&API.reportAnalytics)API.reportAnalytics(ev,data);
 save.statc[ev]=(save.statc[ev]||0)+1}catch(e){}}
// 보상형 광고만 (강제 광고 없음). 광고 단위 ID를 넣기 전에는 2초 테스트 광고
const AD_UNIT={wx:'adunit-xxxxxxxxxxxxxxxx',tt:'xxxxxxxxxxxxxxxxxx',toss:'xxxxxxxx'};// ← 플랫폼 광고 단위 ID로 교체
let adShow=null,adObj=null,adCb=null;
function showAd(place,cb0){if(adShow)return;track('ad_open',{place});const cb=()=>{track('ad_reward',{place});cb0()};
 // 토스 앱인토스: G3에서 SDK 광고 함수를 globalThis.__tossAd(place, onReward, onFail)로 연결
 if(!API&&typeof globalThis!=='undefined'&&typeof globalThis.__tossAd==='function'){try{globalThis.__tossAd(place,cb,()=>message(L('광고를 불러오지 못했어요','广告加载失败'),1.4))}catch(e){cb()}return}
 if(API&&API.createRewardedVideoAd&&AD_UNIT[PLATFORM]&&AD_UNIT[PLATFORM].indexOf('xxxx')<0){try{if(!adObj){adObj=API.createRewardedVideoAd({adUnitId:AD_UNIT[PLATFORM]});adObj.onClose(r=>{const ok=!r||r.isEnded!==false;const f=adCb;adCb=null;Music.kick();if(ok&&f)f();else message(L('끝까지 봐야 보상을 받아요','需完整观看才能获得奖励'),1.4)});adObj.onError(()=>{adCb=null;message(L('광고를 불러오지 못했어요','广告加载失败'),1.4)})}
  adCb=cb;adObj.show().catch(()=>adObj.load().then(()=>adObj.show()).catch(()=>{adCb=null;message(L('광고를 불러오지 못했어요','广告加载失败'),1.4)}))}catch(e){cb()}return}
 adShow={t:0,cb,place}}
function drawAd(){adShow.t+=1/60;g.fillStyle='rgba(0,0,0,.9)';g.fillRect(0,0,W,H);txt(L('광고 재생 중 (테스트)','广告播放中（测试）'),375,620,30,'#fff','center');rr(175,680,400,16,8,'#222');rr(177,682,396*Math.min(1,adShow.t/2),12,6,'#ffcf6a');
 txt(L('출시판에서는 토스·위챗·더우인 보상형 광고가 나와요','正式版将播放激励视频广告'),375,740,17,'#9fb0c4','center',false);if(adShow.t>=2){const f=adShow.cb;adShow=null;f()}}
function shareGame(){track('share',{});const d=R?R.day:save.stats.best;const title=L('좀비가 닿지 못하는 바다에서 '+d+'일째 버티는 중. 너는 며칠 버틸 수 있어?','在丧尸到不了的海上坚持了第'+d+'天，你能撑几天？');
 if(API&&API.shareAppMessage){try{API.shareAppMessage({title})}catch(e){}}else message(L('공유는 토스·위챗·더우인에서 동작해요','分享功能在小游戏平台中可用'),1.6)}
function onAppHide(){if(isPlay())paused=true;Music.stop();Music.hidden=true;persist();track('app_hide',{sc})}
function onAppShow(){Music.hidden=false;const k=Music.cur;Music.cur='';if(Music.on)Music.play(k||'menu');else Music.cur=k;last=0}
if(API){try{API.onHide&&API.onHide(onAppHide);API.onShow&&API.onShow(onAppShow)}catch(e){}}
else if(typeof document!=='undefined'){document.addEventListener('visibilitychange',()=>{if(document.hidden)onAppHide();else onAppShow()})}
if(API&&API.getUpdateManager){try{const um=API.getUpdateManager();um.onUpdateReady(()=>{API.showModal?API.showModal({title:L('새 버전','新版本'),content:L('새 버전이 준비됐어요. 다시 시작할까요?','新版本已准备好，是否重启？'),success:r=>{if(r.confirm)um.applyUpdate()}}):um.applyUpdate()})}catch(e){}}
if(API){try{API.showShareMenu&&API.showShareMenu({withShareTicket:true});API.onShareAppMessage&&API.onShareAppMessage(()=>({title:L('리클레임 — 바다에서 버티고, 돌아가 되찾아라','重归之地——在海上活下去，再夺回陆地')}))}catch(e){}}

// ================================================================ 그리기 도구
function txt(s,x,y,n=24,color='#fff',align='left',stroke=true){g.font=`800 ${n}px system-ui,"Apple SD Gothic Neo","Noto Sans KR","PingFang SC",sans-serif`;g.textAlign=align;g.textBaseline='middle';if(stroke){g.lineWidth=Math.max(3,n*.16);g.strokeStyle='#0a0d14';g.lineJoin='round';g.strokeText(s,x,y)}g.fillStyle=color;g.fillText(s,x,y)}
function pathRect(x,y,w,h,r=12){r=Math.max(0,Math.min(r,w/2,h/2));g.beginPath();g.moveTo(x+r,y);g.lineTo(x+w-r,y);g.quadraticCurveTo(x+w,y,x+w,y+r);g.lineTo(x+w,y+h-r);g.quadraticCurveTo(x+w,y+h,x+w-r,y+h);g.lineTo(x+r,y+h);g.quadraticCurveTo(x,y+h,x,y+h-r);g.lineTo(x,y+r);g.quadraticCurveTo(x,y,x+r,y);g.closePath()}
function rr(x,y,w,h,r,fill,stroke,lw=2){if(fill){g.fillStyle=fill;pathRect(x,y,w,h,r);g.fill()}if(stroke){pathRect(x,y,w,h,r);g.strokeStyle=stroke;g.lineWidth=lw;g.stroke()}}
function circ(x,y,r,fill,stroke,lw=2){g.beginPath();g.arc(x,y,r,0,TAU);if(fill){g.fillStyle=fill;g.fill()}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke()}}
function drawGlow(x,y,r,k,a=1){const s=glow[k];if(!s||r<=0)return;const o=g.globalAlpha;g.globalAlpha=a;g.drawImage(s,x-r,y-r,r*2,r*2);g.globalAlpha=o}
function wrap(value,size,maxW){const out=[];for(const raw of String(value).split('\n')){let cur='';for(const ch of raw){if(g.measureText){g.font=`800 ${size}px system-ui,sans-serif`;if(g.measureText(cur+ch).width>maxW&&cur){out.push(cur);cur=''}}cur+=ch}out.push(cur)}return out}
function para(value,x,y,size,color,maxW=630,lineH=size*1.55,align='left'){const ls=wrap(value,size,maxW);ls.forEach((l,i)=>txt(l,x,y+i*lineH,size,color,align,false));return ls.length}
// 즉시형 버튼: 그릴 때 등록하고, 탭하면 마지막 프레임에 등록된 버튼을 위에서부터 찾는다
let btns=[],btnsNext=[];
const BTN_C={gold:['#5a3a1e','#ffcc6a','#fff4dc'],blue:['#1c3047','#8fc4ff','#eaf4ff'],green:['#1d4430','#7fe0a0','#eafff0'],gray:['#262a33','#5d6574','#b6bfcc'],red:['#5a1f24','#ff7a7a','#fff0f0'],dark:['#141922ee','#3a4352','#dfe6ee']};
function button(x,y,w,h,label,style,size,fn,opt){const C=BTN_C[style||'gold'];rr(x,y,w,h,Math.min(18,h/2),C[0],C[1],3);if(label)txt(label,x+w/2,y+h/2+1,size||26,C[2],'center',false);if(fn)btnsNext.push({x,y,w,h,fn,id:opt&&opt.id})}
function hotspot(x,y,w,h,fn,id){btnsNext.push({x,y,w,h,fn,id})}
let banner='',bannerT=0;function message(t,d=2){banner=t;bannerT=d}
function drawBanner(){if(bannerT>0){g.save();g.globalAlpha=Math.min(1,bannerT*2);const ls=wrap(banner,21,560);const h=26+ls.length*32;rr(80,1040-h,590,h,14,'#141a26f0','#ffcf6a',2);ls.forEach((l,i)=>txt(l,375,1040-h+29+i*32,21,'#fff6e0','center',false));g.restore();bannerT-=1/60}}
function drawFinger(x,y){const b=Math.sin(frame*7)*10;g.save();g.translate(x,y+b);circ(0,-6,30+Math.sin(frame*7)*5,null,'rgba(255,230,140,.85)',4);txt('👆',4,40,52,'#fff','center',false);g.restore()}

// ================================================================ 게임 데이터
const DAY=180,NIGHT=135,DUSK=118;// 하루 3분: 낮 0~135초, 밤 135~180초
const RES_N={plank:['판자','木板'],plastic:['플라스틱','塑料'],cloth:['천','布'],scrap:['고철','废铁'],rope:['밧줄','绳子'],water:['물','水'],can:['통조림','罐头'],fish:['날생선','生鱼'],cooked:['구운 생선','烤鱼'],berry:['열매','野果'],med:['치료약','药品']};
const RES_C={plank:'#c79a5b',plastic:'#7fc6e8',cloth:'#c9c2e0',scrap:'#9aa3ad',rope:'#d8b878',water:'#5fb4ff',can:'#e0a860',fish:'#b8d0d8',cooked:'#f0a050',berry:'#e0607a',med:'#ff8a8a'};
const BAG={water:{n:['물병','水瓶'],d:['물 +2','水 +2'],col:'#5fb4ff'},can:{n:['통조림','罐头'],d:['통조림 +2','罐头 +2'],col:'#e0a860'},med:{n:['구급상자','急救包'],d:['치료약 +2','药品 +2'],col:'#ff8a8a'},
 knife:{n:['칼','小刀'],d:['베기·싸움 2배','伐木·战斗 ×2'],col:'#d6dde4'},lighter:{n:['라이터','打火机'],d:['모닥불을 바로 켠다','可直接点火'],col:'#ffb84a'},rope:{n:['밧줄','绳子'],d:['밧줄 +3','绳子 +3'],col:'#d8b878'},
 filter:{n:['정수 필터','净水滤芯'],d:['50초마다 물 +1','每50秒 水+1'],col:'#9fe8ff'},line:{n:['낚싯줄','鱼线'],d:['낚싯대 무료','免费钓竿'],col:'#a0e0a0'},tarp:{n:['방수천','防水布'],d:['천 +3','布 +3'],col:'#a8b8d8'},
 radio:{n:['무전기 부품','电台零件'],d:['무전기를 만들 수 있다','可以造电台'],col:'#e0c0ff'},flash:{n:['손전등','手电筒'],d:['밤의 그림자를 쫓는다','驱赶夜里的黑影'],col:'#fff3a0'},tools:{n:['공구함','工具箱'],d:['건설 판자 -1','建造少用1木板'],col:'#b8c0c8'}};
const ZONES=[{k:'coral',n:['산호 해역','珊瑚海域'],good:['물고기가 많다','鱼很多'],bad:['비가 적고 폭풍이 일찍 온다','雨少，风暴来得早'],fish:1.5,rain:.55,cold:1,debris:1,storm:2,island:2,col:'#2fb0a0'},
 {k:'north',n:['북쪽 한류','北方寒流'],good:['떠내려오는 물건이 많다','漂流物很多'],bad:['밤이 몹시 춥다','夜里非常冷'],fish:1,rain:1,cold:1.7,debris:1.4,storm:3,island:2,col:'#6f9fd8'},
 {k:'isles',n:['군도 해역','群岛海域'],good:['섬이 가깝다 (첫날부터 상륙)','岛屿很近（第一天就能登岛）'],bad:['떠내려오는 물건이 적다','漂流物较少'],fish:1,rain:1,cold:1,debris:.75,storm:3,island:1,col:'#c8a060'}];
const MODS={deck:{n:['갑판 넓히기','扩建甲板'],cost:{plank:3},col:'#8a6a48',d:['배에 칸을 하나 더한다','增加一格甲板']},
 rain:{n:['빗물 통','雨水桶'],cost:{plastic:3,cloth:1},col:'#5aa8e0',d:['비가 오면 물이 찬다 (최대 6)','下雨时蓄水（最多6）']},
 fire:{n:['모닥불','篝火'],cost:{plank:3,scrap:1},col:'#ff8a3a',d:['생선 굽기·몸 녹이기. 판자를 넣어 태운다','烤鱼·取暖，需要添木板']},
 rod:{n:['낚싯대','钓竿'],cost:{plank:2,rope:1},col:'#9fd08a',d:['옆에 서서 물고기를 낚는다','站在旁边钓鱼']},
 still:{n:['증류기','蒸馏器'],cost:{plastic:3,scrap:3},col:'#7fd0e8',d:['60초마다 물 +1 (최대 3)','每60秒 水+1（最多3）']},
 bed:{n:['침상','床铺'],cost:{plank:4,cloth:3},col:'#b49ad8',d:['밤에 누우면 시간이 빨리 간다','夜里躺下时间过得更快']},
 lash:{n:['밧줄 묶기','绳索加固'],cost:{rope:2},col:'#d8b878',d:['다음 폭풍 피해 절반','下一次风暴伤害减半']},
 sail:{n:['돛','船帆'],cost:{cloth:4,plank:3,rope:3},col:'#e8e0c8',d:['섬에서 짐을 4칸 더 싣는다','登岛可多带4格']},
 radio:{n:['무전기','电台'],cost:{scrap:4,rope:2},need:'radio',col:'#d0a0ff',d:['멀리서 오는 신호를 찾는다','搜寻远方的信号']}};
const BUILD_LIST=['rain','fire','rod','deck','still','bed','lash','sail','radio'];
const T=84,RAFT_X=375,RAFT_Y=600;// 갑판 한 칸 크기와 배 중심
const MISSIONS=[{k:'debris',goal:15,name:['떠내려온 물건 15개 건지기','打捞15个漂流物'],r:{plank:3,plastic:2}},{k:'cook',goal:3,name:['생선 3마리 굽기','烤3条鱼'],r:{can:1,rope:1}},
 {k:'land',goal:1,name:['섬에 1번 상륙하기','登岛1次'],r:{rope:2}},{k:'build',goal:2,name:['배에 2번 짓기','在船上建造2次'],r:{plank:4}},{k:'drink',goal:4,name:['물 4번 마시기','喝水4次'],r:{plastic:2}},{k:'chop',goal:6,name:['섬에서 나무 6번 베기','在岛上砍树6次'],r:{cloth:2}}];
const ATT=[{plank:3},{plastic:2},{rope:2},{can:1,plank:2},{cloth:3},{scrap:3},{med:1,can:2,plank:4}];

// ================================================================ 1장 이야기 · 목표 · 동료
const SURV=[{n:['도하','道河'],job:['어부','渔夫'],tint:'rgba(50,110,230,.38)',d:['낚싯대로 물고기를 잡고, 불이 있으면 구워 둔다','用钓竿钓鱼，有火就烤好']},
 {n:['유나','柔娜'],job:['정비공','机修工'],tint:'rgba(60,180,90,.38)',d:['물건을 건지고, 불을 지키고, 갑판을 고친다','打捞物资、看火、修甲板']},
 {n:['마루','玛鲁'],job:['등대지기','守塔人'],tint:'rgba(170,90,220,.36)',d:['밤새 망을 봐서, 불이 꺼져도 어둠 속의 그것이 물건을 훔치지 못한다','整夜放哨，就算火灭了，黑暗中的东西也偷不走物资']}];
const RADIO=[['…치직… 여기는 동쪽 항구 등대. 내 이름은 마루. 듣는 사람 있습니까?','……滋滋……这里是东港灯塔。我叫玛鲁。有人在听吗？'],
 ['마루: 바다에 구명보트가 떠 있는 걸 봤어요. 근처라면 건져 주세요.','玛鲁：我看到海上漂着一艘救生艇。如果在附近，请把人救上来。'],
 ['마루: 그것들은 물을 못 건너요. 그래서 난 등대에 갇혔고, 당신은 바다에서 자유롭죠.','玛鲁：它们过不了水。所以我被困在灯塔，而你在海上是自由的。'],
 ['마루: 남쪽 섬 오두막에 정비공이 숨어 있대요. 손재주가 좋다고 들었어요.','玛鲁：听说南边岛上的小屋里躲着一位机修工，手很巧。'],
 ['마루: 등대 발전기가 멈췄어요. 불만 켜면 흩어진 배들이 이 항구로 모일 겁니다.','玛鲁：灯塔的发电机停了。只要点亮它，散落的船都会聚到这个港口。'],
 ['마루: 사람이 모이면 항구를 되찾을 수 있어요. 등대에서 기다릴게요.','玛鲁：人聚起来，就能夺回港口。我在灯塔等你。']];
const BOTTLES=[['쪽지: "사흘째 표류 중. 비가 오기 전엔 갈매기가 먼저 사라진다. 이걸 읽는 당신은 살아남길."','纸条："漂流第三天。下雨前海鸥会先消失。读到这张纸条的你，要活下去。"'],
 ['쪽지: "밤에 불을 꺼뜨렸다가 식량을 전부 잃었다. 물 밑에 뭔가 있다."','纸条："夜里火灭了，粮食全没了。水下有东西。"'],
 ['쪽지: "북쪽 항구는 끝났다. 동쪽 등대에 아직 사람이 있다고 한다."','纸条："北港完了。听说东边的灯塔还有人。"'],
 ['쪽지: "딸에게. 아빠는 섬에 있다. 오두막 굴뚝에 연기를 피워 둘게."','纸条："给女儿。爸爸在岛上。我会让小屋的烟囱一直冒烟。"'],
 ['쪽지: "회색으로 변한 땅도, 태우고 석회를 뿌리면 풀이 다시 난다. 내가 봤다."','纸条："变灰的土地，烧过再撒石灰，草还会长出来。我亲眼见过。"']];
const hasM=k=>R.deck.some(d=>d.m&&d.m.k===k);
const CH=[{t:['떠내려오는 물건 5개 건지기','打捞5个漂流物'],p:()=>[R.cnt.debris,5],r:{plank:2,plastic:1},s:['바다는 도시가 흘려보낸 것들로 가득하다. 쓸 만한 건 전부 건진다.','海上漂满了城市冲出来的东西。能用的全都捞上来。']},
 {t:['빗물 통 짓기','建造雨水桶'],b:'rain',p:()=>[hasM('rain')||hasM('still')?1:0,1],r:{cloth:1,water:1},s:['사방이 물인데 마실 물은 없다. 하늘에서 받는 수밖에.','四面都是水，却没有能喝的。只能向天要水。']},
 {t:['모닥불 짓기','建造篝火'],b:'fire',p:()=>[hasM('fire')?1:0,1],r:{plank:3},s:['불이 있으면 밤이 조금 덜 무섭다. 어둠 속의 그것도 불빛은 피한다.','有了火，夜晚没那么可怕。黑暗里的东西也怕火光。']},
 {t:['첫 밤을 버티기','熬过第一个夜晚'],p:()=>[R.day>=2?1:0,1],r:{can:1,rope:1},s:['해가 떴다. 육지 쪽 하늘에는 아직 연기가 오른다. 하지만 나는 살아 있다.','太阳升起来了。陆地那边的天空还在冒烟。但我还活着。']},
 {t:['낚싯대 짓기','建造钓竿'],b:'rod',p:()=>[hasM('rod')?1:0,1],r:{plank:2},s:['통조림은 언젠가 떨어진다. 바다가 먹여 살려 줘야 한다.','罐头总会吃完。得让大海养活我。']},
 {t:['생선 한 마리 굽기','烤一条鱼'],p:()=>[R.cnt.cooked,1],r:{scrap:2},s:['따뜻한 음식. 사흘 만에 처음으로 사람처럼 먹었다.','热乎的食物。三天来第一次像人一样吃饭。']},
 {t:['섬에 상륙하기','登上小岛'],p:()=>[R.cnt.lands,1],r:{rope:2},s:['땅을 밟았다. 하지만 땅에는 그것들이 있다. 해 지기 전에 돌아가야 한다.','踩到了陆地。但陆地上有它们。必须在天黑前回去。']},
 {t:['무전기 만들기','制作电台'],b:'radio',p:()=>[R.radioBuilt?1:0,1],r:{can:2},s:['잡음 사이로 사람 목소리가 들렸다. 혼자가 아니었다.','杂音里传来了人声。我不是一个人。']},
 {t:['표류하는 생존자 구하기','救起漂流的幸存者'],p:()=>[R.surv.length,1],r:{can:2,water:2},s:['배에 한 사람이 늘었다. 먹을 입도 늘었지만, 일손도 늘었다.','船上多了一个人。多了一张嘴，也多了一双手。']},
 {t:['갑판을 10칸으로 넓히기','把甲板扩建到10格'],b:'deck',p:()=>[R.deck.length,10],r:{cloth:2,rope:2},s:['이제 뗏목이 아니라 집이다. 사람을 더 태울 수 있다.','这已经不是木筏，而是家了。还能再载些人。']},
 {t:['섬 오두막의 정비공 구하기','救出岛上小屋的机修工'],p:()=>[R.surv.length,2],r:{med:1,can:2},s:['셋이 되니 밤이 짧아졌다. 누군가는 불을 지키고, 누군가는 잔다.','三个人之后，夜晚变短了。有人看火，有人睡觉。']},
 {t:['동쪽 항구 등대에 불 켜기','点亮东港的灯塔'],p:()=>[R.lit?1:0,1],r:{},s:['등대에 불이 켜졌다. 수평선 여기저기서 작은 불빛들이 대답했다.','灯塔亮了。地平线上，星星点点的灯火作出了回应。']}];
const HB=[{n:['부두','码头'],nests:3,z:6,prod:{plank:2,rope:1}},{n:['시장','集市'],nests:3,z:8,prod:{can:1,cloth:1}},{n:['발전소','发电站'],nests:4,z:9,prod:{scrap:2,water:2}},{n:['중앙 광장','中央广场'],nests:1,boss:true,z:10,prod:{can:1,plank:2}}];
const BAR_COST={plank:6,scrap:3,rope:2};
const RADIO2=[['항구 무전: 등대 불빛을 보고 배 세 척이 더 들어왔습니다. 부두만 되찾으면 댈 곳이 생겨요.','港口电台：又有三艘船循着灯塔的光进来了。只要夺回码头，就有地方停靠。'],
 ['항구 무전: 회색 이끼는 둥지에서 퍼집니다. 둥지를 태우면 그 구역의 그것들도 힘을 잃어요.','港口电台：灰色的苔藓从巢穴蔓延。烧掉巢穴，那一带的它们也会变弱。'],
 ['항구 무전: 되찾은 땅은 며칠마다 회색이 되밀려옵니다. 방벽 없이는 못 지켜요.','港口电台：夺回的土地每隔几天就会被灰色反扑。没有路障守不住。'],
 ['항구 무전: 발전소가 돌면 정수 펌프도 돕니다. 물 걱정이 줄 거예요.','港口电台：发电站一转，净水泵也能转。喝水就不用愁了。'],
 ['항구 무전: 광장 한가운데에 심장처럼 뛰는 큰 둥지가 있습니다. 그게 이 항구의 뿌리예요.','港口电台：广场中央有个像心脏一样跳动的大巢。那就是这座港口的病根。']];
const CH2=[{t:['부두의 감염 둥지를 태워 되찾기','烧掉码头的感染巢，夺回码头'],p:()=>[R.hb.d[0].s?1:0,1],r:{plank:4,rope:2},s:['부두에 배를 댔다. 발밑이 흔들리지 않는 게 낯설다.','船靠上了码头。脚下不再摇晃，反而有些陌生。']},
 {t:['되찾은 구역에 방벽 세우기','在夺回的区域建起路障'],p:()=>[R.hb.d.some(d=>d.bar)?1:0,1],r:{can:2},s:['되찾는 것보다 지키는 게 어렵다. 그래도 벽 안쪽은 이제 우리 땅이다.','守比夺更难。但墙内的地方，现在是我们的了。']},
 {t:['시장 되찾기','夺回集市'],p:()=>[R.hb.d[1].s?1:0,1],r:{can:3,cloth:2},s:['텅 빈 좌판 사이로 사람들이 걸어 들어왔다. 누군가 가게 셔터를 올렸다.','人们走进空荡荡的摊位之间。有人拉起了店铺的卷帘门。']},
 {t:['감염 역류를 방벽으로 막아내기','用路障挡住一次感染回流'],p:()=>[R.cnt.held,1],r:{scrap:3,rope:2},s:['밤새 벽 너머에서 긁는 소리가 났다. 아침에 벽은 그대로 서 있었다.','整夜墙外都是抓挠声。到了早上，墙依然立着。']},
 {t:['발전소 되찾기','夺回发电站'],p:()=>[R.hb.d[2].s?1:0,1],r:{water:3,med:1},s:['터빈이 돌자 항구의 가로등이 하나씩 켜졌다. 누군가 소리 내어 울었다.','涡轮一转，港口的路灯一盏盏亮起。有人哭出了声。']},
 {t:['갑판을 14칸으로 넓히기','把甲板扩建到14格'],b:'deck',p:()=>[R.deck.length,14],r:{can:2,rope:2},s:['이 배는 이제 항구의 병원이자 창고다. 사람들은 「첫 배」라고 부른다.','这艘船现在是港口的医院和仓库。人们叫它"第一艘船"。']},
 {t:['중앙 광장의 회색 심장 태우기','烧掉中央广场的灰色心脏'],p:()=>[R.hb.d[3].s?1:0,1],r:{},s:['심장이 멎자 회색 이끼가 재처럼 부서졌다. 항구 전체에 색이 돌아왔다.','心脏停跳，灰色的苔藓像灰烬一样碎裂。整座港口恢复了颜色。']}];
let questCd=0,radioShow=null,endCh=1;
function canPayC(c2){for(const r in c2)if((R.res[r]||0)<c2[r])return false;return true}
function payC(c2){for(const r in c2)R.res[r]-=c2[r]}
function costStr(o,plus){return Object.keys(o).map(k=>LL(RES_N[k])+' '+(plus?'+':'')+o[k]).join(' · ')}
function ch2On(){return R.ch>=CH.length}
function reclaim(di){const d=R.hb.d[di],h=HB[di];d.s=2;d.left=0;R.hb.max=Math.max(R.hb.max,di);if(!R.hb.flow)R.hb.flow=R.day+3;track('reclaim',{di,day:R.day});AudioFx.cue('win');vib('long');
 popTip({head:L('구역 수복','夺回区域'),lines:[['「'+h.n[0]+'」 구역을 되찾았다! 회색이 걷히고 색이 돌아왔다.','「'+h.n[1]+'」夺回来了！灰色褪去，颜色回来了。'],['매일 아침 보급: '+costStr(h.prod,1),'每天早上补给：'+costStr(h.prod,1)],['며칠마다 감염이 되밀려와요. [항구 지도]에서 방벽을 세우면 지킬 수 있어요.','每隔几天感染会反扑。在[港口地图]建起路障就能守住。']],t:0});if(di===0)addSurvivor(2);persist()}
function harborMorning(){if(!ch2On())return;const hb=R.hb,sum={};hb.d.forEach((d,i)=>{if(d.s)for(const k in HB[i].prod)sum[k]=(sum[k]||0)+HB[i].prod[k]});
 if(Object.keys(sum).length){for(const k in sum)R.res[k]=(R.res[k]||0)+sum[k];fxText(RAFT_X,RAFT_Y-150,L('항구 보급: ','港口补给：')+costStr(sum,1),'#bfffd0')}
 if(hb.flow&&R.day===hb.flow-1)radioShow={l:['항구 무전: 내일 새벽 감염 역류가 옵니다. 방벽 없는 구역은 다시 회색이 돼요!','港口电台：明天凌晨会有感染回流。没有路障的区域会再次变灰！'],t:10};
 if(hb.flow&&R.day>=hb.flow){hb.flow=R.day+4;const rec=hb.d.map((d,i)=>i).filter(i=>hb.d[i].s);if(!rec.length)return;if(rec.some(i=>hb.d[i].bar))R.cnt.held++;const un=rec.filter(i=>!hb.d[i].bar);
  if(un.length){const i=un[un.length-1],d=hb.d[i];d.s=0;d.left=HB[i].boss?1:2;track('flow_lost',{i});AudioFx.cue('thunder');popTip({head:L('감염 역류','感染回流'),lines:[['밤사이 회색이 되밀려와 「'+HB[i].n[0]+'」 구역을 다시 덮었다.','夜里灰色反扑，「'+HB[i].n[1]+'」再次被吞没。'],['둥지 '+d.left+'개를 다시 태워야 해요. 되찾은 뒤에는 방벽을 세우세요.','需要再烧掉'+d.left+'个巢穴。夺回后记得建路障。']],t:0})}
  else{track('flow_held',{});message(L('방벽이 감염 역류를 막아냈다!','路障挡住了感染回流！'),3)}}}
function startHarborD(di){const h=HB[di],d=R.hb.d[di];R.landed=R.day;R.cnt.lands++;save.stats.lands++;track('land_start',{day:R.day,harbor:true,di});let s=R.day*313+di*71+7;const rnd=()=>{s=(s*16807)%2147483647;return (s%10000)/10000};
 const objs=[{k:'light',x:375,y:330,n:0,lit:true}];if(h.boss)objs.push({k:'nest',big:true,x:375,y:620,n:6});else for(let j=0;j<d.left;j++)objs.push({k:'nest',x:j%2?480:270,y:560+j*Math.floor(900/Math.max(1,d.left)),n:2});
 for(let i=0;i<5;i++)objs.push({k:'crate',x:230+rnd()*290,y:700+i*190+rnd()*60,n:1});
 const zs=[];for(let i=0;i<h.z;i++){const x=220+rnd()*310,y=450+i*Math.floor(1050/h.z);zs.push({x,y,hx:x,hy:y,hp:3,a:0,hit:0,w:rnd()*6,run:i%3===2})}
 Land={type:'harbor',di,p:{x:375,y:1760,tx:375,ty:1760,hit:0},objs,zs,carry:{},n:0,cap:R.sail?16:12,noise:0,target:null,work:0,atk:0,nightSpawn:false,lit:false,clear:false};sc='land';camY=LAND_H-H;
 tip('nest',[['회색으로 부푼 덩어리가 감염 둥지예요. 탭해서 다가가 태우세요.','鼓起的灰色团块就是感染巢。点击靠近并烧掉它。'],['둥지를 모두 태우고 배로 돌아오면 그 구역을 되찾아요. 중간에 물러나도 태운 둥지는 그대로예요.','烧光巢穴并回到船上，就能夺回该区域。中途撤退，已烧掉的也不会恢复。'],['태우는 소리에 감염체가 몰려와요. 체력이 낮으면 욕심내지 말고 돌아가세요.','燃烧声会引来丧尸。体力低时别贪心，先撤。']])}
function drawNest(o){const r=o.big?70:40,pu=1+.06*Math.sin(frame*(o.big?5:3)+o.x);drawGlow(o.x,o.y,r*2.2,'w',.12);g.save();g.translate(o.x,o.y);g.scale(pu,pu);circ(0,6,r,'#2c322c','#12140f',4);circ(-r*.35,-r*.2,r*.55,'#48524a','#12140f',3);circ(r*.3,-r*.05,r*.45,'#3c463e','#12140f',3);circ(0,-r*.45,r*.3,'#5a665c','#12140f',3);
 for(let i=0;i<6;i++){const a=i*1.05+frame*.6;circ(Math.cos(a)*r*1.15,Math.sin(a)*r*.9,3,'rgba(190,200,180,.7)')}g.restore();
 txt(o.big?L('회색 심장 ','灰色心脏 ')+o.n:L('감염 둥지 ','感染巢 ')+o.n,o.x,o.y+r+26,17,'#e6ecdc','center')}
function drawCoast(){const hb=R.hb,night=isNight();g.fillStyle=night?'#04070a':'#1a262c';g.fillRect(0,196,W,14);for(let i=0;i<18;i++){const x=i*42+4,h=14+((i*37)%26);g.fillRect(x,196-h,34,h)}
 g.fillStyle=night?'#04070a':'#22323a';g.fillRect(712,150,12,46);if(R.lit)drawGlow(718,152,50+Math.sin(frame*3)*6,'y',.9);
 hb.d.forEach((d,i)=>{if(!d.s)return;for(let j=0;j<5;j++){const x=30+i*172+j*30,y=188-((j*13+i*7)%16);drawGlow(x,y,night?20:13,'o',night?.95:.6);circ(x,y,2.2,'#ffe9a0')}})}
function hmapScreen(){g.fillStyle='rgba(5,8,14,.94)';g.fillRect(0,0,W,H);txt(L('동쪽 항구','东港'),375,64,38,'#ffe2a0','center');const hb=R.hb,rec=hb.d.filter(d=>d.s).length;
 txt(L('수복 ','已夺回 ')+rec+'/4'+(hb.flow?L('  ·  감염 역류까지 ','  ·  距感染回流 ')+Math.max(0,hb.flow-R.day)+L('일','天'):''),375,112,20,'#c9d2de','center',false);
 const go=R.t<112&&R.landed<R.day&&!inStorm(),why=()=>message(R.landed>=R.day?L('오늘은 이미 다녀왔어요. 내일 다시 가요','今天已经去过了，明天再去'):L('해가 지기 전엔 돌아올 수 없어요','天黑前回不来'),1.6);
 HB.forEach((h,i)=>{const d=hb.d[i],y=150+i*178,open=i<=hb.max+1,col=d.s?'#7fe0a0':open?'#ffcf6a':'#4a5462';rr(30,y,690,164,16,d.s?'#12261c':open?'#221c12':'#14181e',col,3);
  txt((d.s?'● ':open?'◐ ':'○ ')+LL(h.n),56,y+38,28,d.s?'#dfffe8':open?'#fff':'#7a8494','left',false);
  txt(d.s?(d.bar?L('되찾음 · 방벽 있음','已夺回 · 有路障'):L('되찾음 · 방벽 없음 (역류에 무너져요)','已夺回 · 无路障（回流时会失守）')):open?(h.boss?L('감염됨 · 회색 심장','感染中 · 灰色心脏'):L('감염됨 · 남은 둥지 ','感染中 · 剩余巢穴 ')+d.left):L('앞 구역을 먼저 되찾아야 해요','需先夺回前一个区域'),56,y+84,18,d.s&&!d.bar?'#ffb0a0':'#c9d2de','left',false);
  txt(L('매일 아침: ','每天早上：')+costStr(h.prod,1),56,y+126,17,'#9fb0c4','left',false);
  if(!d.s&&open)button(520,y+40,180,84,L('원정','远征'),go?'red':'gray',26,()=>{if(go)startHarborD(i);else why()},{id:'hb_go'+i});
  else if(d.s&&!d.bar)button(490,y+40,210,84,L('방벽 세우기','建路障'),canPayC(BAR_COST)?'gold':'gray',22,()=>{if(canPayC(BAR_COST)){payC(BAR_COST);d.bar=1;AudioFx.cue('build');vib('medium');track('barricade',{i});persist()}else message(L('재료가 모자라요: ','材料不够：')+costStr(BAR_COST),2)},{id:'hb_bar'+i})});
 const y=150+4*178;rr(30,y,690,110,16,'#14202a','#5a8ab0',2);txt(L('섬','小岛'),56,y+36,26,'#fff','left',false);txt(L('나무 · 열매 · 물 · 고철','木材 · 野果 · 淡水 · 废铁'),56,y+78,17,'#9fb0c4','left',false);button(520,y+14,180,82,L('상륙','登岛'),go?'green':'gray',26,()=>{if(go)startLand();else why()},{id:'hb_isl'});
 txt(L('방벽 재료: ','路障材料：')+costStr(BAR_COST),375,1010,18,'#c9d2de','center',false);
 button(150,1200,450,84,L('◀ 닫기','◀ 关闭'),'gold',26,()=>{sc='sea'})}
// 처음 겪는 상황마다 한 번씩 조작을 알려 준다
function teach(){if(guideTip||buildPick)return;const r=R.res,v=R.vit,ft=fireTile();
 if(ft&&!ft.m.fuel&&r.plank>0&&tip('fuel',[['모닥불을 탭하면 판자 1개를 넣어 불을 붙여요. 불은 60초씩 타요.','点击篝火，添1块木板点火。每块能烧60秒。']]))return;
 if(r.fish>0&&ft&&tip('cook',[['날생선이 생겼어요. 불이 켜진 모닥불을 탭하면 구워져요.','有生鱼了。点击燃着的篝火就能烤熟。'],['날생선은 밤이 지나면 상하니 그날 구우세요.','生鱼过夜会变质，当天烤掉。']]))return;
 if(r.cooked>0&&v.hunger<92&&tip('eat',[['구운 생선은 저절로 먹지 않아요. 화면 맨 위의 [허기] 칸을 탭하면 먹어요.','烤鱼不会自动吃。点击屏幕最上方的[饥饿]栏就能吃。'],['[갈증] 칸을 탭하면 물을, [체력] 칸을 탭하면 치료약을 써요.','点[口渴]栏喝水，点[体力]栏用药。']]))return;
 if((r.can>0||r.berry>0)&&v.hunger<60&&tip('eat2',[['배가 고파요. 화면 맨 위의 [허기] 칸을 탭하면 가진 음식을 먹어요.','饿了。点击屏幕最上方的[饥饿]栏吃掉手里的食物。']]))return;
 if(v.thirst<60&&(r.water>0||R.deck.some(d=>d.m&&(d.m.k==='rain'||d.m.k==='still')&&d.m.w>0))&&tip('drink',[['목이 말라요. 물이 찬 빗물 통을 탭하거나, 맨 위의 [갈증] 칸을 탭해 병의 물을 마셔요.','渴了。点击有水的雨水桶，或点最上方的[口渴]栏喝瓶装水。']]))return;
 if(isNight()&&v.temp<50&&tip('warm',[['몸이 식고 있어요. 불이 켜진 모닥불 옆 칸에 서 있으면 체온이 올라요.','身体在变冷。站在燃着的篝火旁边的格子里，体温会回升。']]))return;
 if(R.deck.some(d=>d.hp<3)&&tip('repair',[['갑판에 금이 갔어요. 금 간 칸을 탭하면 판자 1개로 고쳐요.','甲板裂了。点击裂开的格子，用1块木板修好。']]))return;
 if(v.hp<50&&r.med>0&&tip('heal',[['체력이 낮아요. 맨 위의 [체력] 칸을 탭하면 치료약을 써요.','体力很低。点最上方的[体力]栏使用药品。']]))return;
 if(ch2On())tip('ch2',[['2장 「항구 수복」이 시작됐어요. 아래 [항구 지도]에서 구역을 골라 원정을 떠나요.','第二章「夺回港口」开始了。在下方[港口地图]选择区域出发远征。'],['구역의 감염 둥지를 모두 태우면 그 땅을 되찾고, 매일 아침 보급을 받아요.','烧光区域里的感染巢就能夺回那片土地，每天早上获得补给。']])}
function vitCan(k){const r=R.res,v=R.vit;return k==='thirst'?r.water>0&&v.thirst<95:k==='hunger'?(r.cooked+r.can+r.berry+r.fish)>0&&v.hunger<95:k==='hp'?r.med>0&&v.hp<90:false}
function migrate(){R.cnt=Object.assign({debris:0,cooked:0,lands:0,held:0},R.cnt||{});R.hb=R.hb||{d:HB.map(h=>({s:0,left:h.boss?1:h.nests,bar:0})),flow:0,max:-1};R.q2=R.q2||0;R.surv=R.surv||[];if(R.ch===undefined)R.ch=0;R.radioIdx=R.radioIdx||0;R.bottleIdx=R.bottleIdx||0;if(R.pend){for(const k in R.pend.c)R.res[k]=(R.res[k]||0)+R.pend.c[k];if(R.pend.lit)R.lit=true;if(R.pend.rc>=0&&!R.hb.d[R.pend.rc].s){const rc=R.pend.rc;R.pend=null;reclaim(rc)}R.pend=null}}
function questTick(dt){questCd-=dt;if(questCd>0||sc!=='sea')return;const c2=ch2On(),list=c2?CH2:CH,i=c2?R.q2:R.ch;if(i>=list.length)return;const q=list[i],pr=q.p();if(pr[0]<pr[1])return;questCd=1.5;for(const k in q.r)R.res[k]=(R.res[k]||0)+q.r[k];if(c2)R.q2++;else R.ch++;track('quest',{c:c2?2:1,i:i+1,day:R.day});AudioFx.cue('win');vib('medium');persist();
 if(!c2&&R.ch>=CH.length){save.ch1=true;persist();track('ch1_clear',{day:R.day});bannerT=0;endCh=1;sc='ch1end';return}
 if(c2&&R.q2>=CH2.length){save.ch2=true;persist();track('ch2_clear',{day:R.day});bannerT=0;endCh=2;sc='ch1end';return}
 const rw=Object.keys(q.r).map(k=>LL(RES_N[k])+' +'+q.r[k]).join('  ');popTip({head:(c2?L('2장 ','第二章 '):'')+L('목표 달성 ','目标达成 ')+(i+1)+'/'+list.length,lines:[[LL(q.t),LL(q.t)],q.s].concat(rw?[[L('보상: ','奖励：')+rw,L('보상: ','奖励：')+rw]]:[]),t:0})}
function addSurvivor(i){if(R.surv.some(s2=>s2.id===i))return;R.surv.push({id:i,fed:true,ct:0});track('rescue',{i,day:R.day});AudioFx.cue('win');vib('long');const S=SURV[i];popTip({head:L('새 동료','新伙伴'),lines:[[S.n[0]+' ('+S.job[0]+')'+'가 배에 올랐다.',S.n[1]+'（'+S.job[1]+'）上了船。'],S.d,['동료는 하루에 음식 1개를 먹어요. 굶으면 다음 날 일을 쉬어요.','伙伴每天吃1份食物，饿着第二天就不干活。']],t:0});persist()}
function survPos(i){if(i===0){const t=R.deck.find(d=>d.m&&d.m.k==='rod')||R.deck[0],p=tilePos(t.x,t.y);return {x:p.x-24,y:p.y+14}}const em=R.deck.filter(d=>!d.m).reverse();const t=em[i-1]||em[0]||R.deck[R.deck.length-1],p=tilePos(t.x,t.y);return {x:p.x+(i===1?18:-16),y:p.y-6}}
function survTick(dtt){const r=R.res;for(const s2 of R.surv){if(!s2.fed)continue;s2.ct+=dtt;const ps=survPos(s2.id);
  if(s2.id===0&&s2.ct>=32){s2.ct=0;if(hasM('rod')&&!inStorm()){r.fish++;R.today.fish++;fxText(ps.x,ps.y-50,L('도하: 물고기 +1','道河：鱼 +1'),'#b8d8ff')}const ft=fireTile();if(ft&&ft.m.fuel>=6&&r.fish>0){r.fish--;r.cooked++;ft.m.fuel-=6;R.cnt.cooked++}}
  if(s2.id===1&&s2.ct>=6){s2.ct=0;const o=debris.find(o2=>!o2.pull&&o2.k!=='survivor'&&o2.y>160&&o2.y<1000);if(o&&!sleeping){o.pull=true}
   const ft=fireTile();if(ft&&R.t>DUSK-10&&ft.m.fuel<20&&r.plank>1&&(ft.m.fuel>0||R.items.lighter||R.flint)){r.plank--;ft.m.fuel+=60;fxText(ps.x,ps.y-50,L('유나: 불을 살렸다','柔娜：添了火'),'#c8ffc8')}
   const dm=R.deck.find(d=>d.hp<3);if(dm&&r.plank>2){r.plank--;dm.hp=3;fxText(ps.x,ps.y-50,L('유나: 갑판 수리','柔娜：修好甲板'),'#c8ffc8')}}}}
function survEat(){let fed=0;for(const s2 of R.surv){const k=['cooked','can','berry'].find(k2=>R.res[k2]>0);if(k){R.res[k]--;s2.fed=true;fed++}else s2.fed=false}R.today.fedN=fed;R.today.hungryN=R.surv.length-fed}
function drawSurv(){for(const s2 of R.surv){const ps=survPos(s2.id),S=SURV[s2.id];g.save();g.globalAlpha=.3;g.fillStyle='#000';g.beginPath();g.ellipse(ps.x,ps.y+2,16,5,0,0,TAU);g.fill();g.restore();
  const an=!s2.fed?'idle':s2.id===0&&hasM('rod')?'fish':s2.ct<1?'craft':'idle';if(!sprite('surv'+s2.id,an,frame+s2.id,ps.x,ps.y+4,78,s2.id===0?-1:1,an==='fish'?3:6))circ(ps.x,ps.y-14,14,s2.id?'#6c6':'#69f','#111',3);
  txt(LL(S.n)+(s2.fed?'':L(' (배고픔)','（饿）')),ps.x,ps.y-78,14,s2.fed?'#fff':'#ffb0a0','center')}}
function bottle(){const b=BOTTLES[R.bottleIdx%BOTTLES.length];R.bottleIdx++;R.res.rope=(R.res.rope||0)+1;track('bottle',{i:R.bottleIdx});AudioFx.cue('pick');popTip({head:L('병 속의 쪽지','漂流瓶'),lines:[b,[L('(병을 묶은 밧줄 +1)','（绑瓶子的绳子 +1）'),L('(병을 묶은 밧줄 +1)','（绑瓶子的绳子 +1）')]],t:0})}
function radioMorning(){if(!R.radioBuilt)return;const i2=R.radioIdx-RADIO.length;if(R.radioIdx<RADIO.length){radioShow={l:RADIO[R.radioIdx],t:9};R.radioIdx++;AudioFx.cue('warn')}else if(ch2On()&&i2<RADIO2.length){radioShow={l:RADIO2[i2],t:9};R.radioIdx++;AudioFx.cue('warn')}}
function ch1Screen(){const two=endCh===2;g.fillStyle='#071016';g.fillRect(0,0,W,H);if(imgs.title){g.drawImage(imgs.title,0,0,W,H);g.fillStyle='rgba(4,8,14,.78)';g.fillRect(0,0,W,H)}drawGlow(375,330,220+Math.sin(frame*2)*14,'y',.5);
 txt(two?L('2장 완료','第二章 完'):L('1장 완료','第一章 完'),375,170,30,'#c9d2de','center');txt(two?L('돌아온 항구','归来的港口'):L('등대의 불','灯塔之光'),375,240,64,'#ffcf6a','center');
 para(two?L('회색 심장이 멎자, 항구 전체에 색이 돌아왔다.\n부두에는 배가, 시장에는 사람이, 거리에는 불빛이 있다.\n\n그날 밤 강 상류에서 무전이 왔다.\n"거기… 정말 사람이 삽니까?"','灰色心脏停跳，整座港口恢复了颜色。\n码头有船，集市有人，街上有灯。\n\n那天夜里，河的上游传来了电台声。\n"那边……真的有人活着吗？"'):L('등대에 불이 켜지자, 수평선 여기저기서 작은 불빛들이 대답했다.\n살아남은 배들이 동쪽 항구로 모여들고 있다.\n\n이제 바다에서 버티는 이야기는 끝났다.\n땅을 되찾을 차례다.','灯塔亮起，地平线上星星点点的灯火作出了回应。\n幸存的船只正向东港聚集。\n\n在海上求生的故事结束了。\n现在，轮到夺回陆地。'),375,470,23,'#f0eee4',600,38,'center');
 txt(L(R.day+'일째 · 동료 '+R.surv.length+'명 · 갑판 '+R.deck.length+'칸','第'+R.day+'天 · 伙伴'+R.surv.length+'人 · 甲板'+R.deck.length+'格'),375,800,21,'#ffe7a0','center');
 txt(two?L('3장 「강을 거슬러」는 다음 업데이트에서 이어집니다','第三章「溯河而上」将在下次更新中继续'):L('2장 「항구 수복」으로 이어집니다','接下来是第二章「夺回港口」'),375,850,18,'#9fb0c4','center',false);
 button(110,930,250,90,L('공유','分享'),'blue',26,shareGame);button(390,930,250,90,two?L('항구에 남기','留在港口'):L('2장 시작','开始第二章'),'gold',24,()=>{sc='sea'},{id:'btn_ch1'})}
// ================================================================ 상태
let sc='loading',frame=0,last=0,loadT=0,paused=false,tutStep=0;
let R=save.run;// 진행 중인 해상 생존 기록(저장됨)
let A=null;// 1막 탈출 상태(저장 안 함)
let Land=null;// 상륙 상태
let buildPick=null,sleeping=false,act=null,fx=[],debris=[],gulls=[],spawnT=0,fishing=null;
let guideTip=null,guidePage=0,guideRet='title',resetArm=0,failInfo=null,zoneT=0,dayendT=0,g1T=0,camY=0;
function isPlay(){return sc==='act1'||sc==='sea'||sc==='land'}

// ================================================================ 매일 보상
function dailyInit(){const t=todayKey();if(save.daily&&save.daily.day===t)return;let h=0;for(const ch of t)h=(h*31+ch.charCodeAt(0))|0;const pool=MISSIONS.map((m,i)=>i),pick=[];
 while(pick.length<3&&pool.length){h=(h*1103515245+12345)|0;pick.push(pool.splice(Math.abs(h)%pool.length,1)[0])}save.daily={day:t,m:pick.map(i=>({i,p:0,c:false}))};persist()}
function mission(k,n=1){dailyInit();for(const m of save.daily.m){const M=MISSIONS[m.i];if(M.k===k&&!m.c&&m.p<M.goal){m.p=Math.min(M.goal,m.p+n);if(m.p>=M.goal)message(L('일일 미션 완료! ','每日任务完成！')+LL(M.name),1.8)}}}
function attCan(){return save.att.last!==todayKey()}
function rewardBadge(){dailyInit();return attCan()||save.daily.m.some(m=>!m.c&&m.p>=MISSIONS[m.i].goal)||adBoxLeft()>0}
function adBoxLeft(){const t=todayKey();if(!save.adBox||save.adBox.day!==t)save.adBox={day:t,n:0};return 3-save.adBox.n}
function give(r,why){for(const k in r){if(R)R.res[k]=(R.res[k]||0)+r[k];else save.bank[k]=(save.bank[k]||0)+r[k]}persist();AudioFx.cue('win');
 message((why?why+' · ':'')+Object.keys(r).map(k=>LL(RES_N[k])+' +'+r[k]).join('  ')+(R?'':L(' (다음 표류 때 받아요)',' （下次漂流时获得）')),2)}

// ================================================================ 1막: 몰락 (탈출)
const ACT1_H=3400,AY=y=>Math.round(y*1.42);
function startAct1(){const items=[['water',375,2290],['can',260,2200],['knife',490,2120],['lighter',300,1990],['med',470,1880],['rope',250,1760],['filter',500,1640],['line',300,1520],['tarp',480,1400],['water',260,1290],['radio',430,1170],['flash',280,1040],['can',500,930],['tools',380,800],['med',270,680],['rope',480,560]];
 A={p:{x:375,y:ACT1_H-120,tx:375,ty:ACT1_H-120,hp:100,hit:0},bag:[],items:items.map(([k,x,y])=>({k,x,y:AY(y),got:false})),zs:[],front:ACT1_H+160,t:0,board:0,target:null,pick:0,fullCd:0};
 const zp=[[520,1930,0],[230,1690,0],[520,1460,1],[240,1230,0],[520,1100,0],[230,880,1],[500,740,0],[250,500,0],[520,400,0]];
 A.zs=zp.map(([x,y,run],i)=>({x,y:AY(y),hx:x,hy:AY(y),run,a:0,hit:0,w:i*1.7}));
 sc='act1';camY=ACT1_H-H;tutStep=0;track('act1_start',{});
 tip('act1',[['회색병이 도시를 삼킨 지 사흘째. 구조용 전용기에 아직 연료가 남아 있다. 지금이 아니면 못 나간다.','灰病吞没城市的第三天。救援专机里还有燃油。现在不走，就走不了了。'],['화면을 누른 채 끌면 그 방향으로 달려요. 탭하면 그곳으로 걸어가요.','按住屏幕拖动即可朝该方向奔跑，点击则走到该处。'],['빛나는 물건 위를 지나가기만 하면 자동으로 주워요. 위쪽 비행기까지 달리세요.','从发光的物品上走过就会自动捡起。跑向上方的飞机。'],['가방은 8칸뿐이에요. 무엇을 챙길지가 바다에서의 첫 3일을 정해요.','背包只有8格，带什么决定了海上的头三天。']])}
function act1Tick(dt){const p=A.p;A.t+=dt;
 if(A.t>8)A.front-=13*dt;if(p.y>A.front-30){p.hp-=18*dt;if(frame%0.5<dt)message(L('불길이 다가온다! 위로 달려!','火势逼近！快往上跑！'),.8)}
 if(A.board>0){A.board+=dt;if(A.board>2.6){track('act1_clear',{bag:A.bag.length,t:Math.round(A.t)});sc='zone';zoneT=0}return}
 moveTo(p,dt,195);A.fullCd-=dt;
 // 가까이 지나가면 자동으로 줍는다 (조이스틱·탭 공통)
 for(const it of A.items){if(it.got)continue;const d=Math.hypot(p.x-it.x,p.y-it.y);if(it.wait){if(d>95)it.wait=false;continue}if(d<66){if(A.bag.length<8){it.got=true;A.bag.push(it.k);AudioFx.cue('pick');vib('light');tutStep=Math.max(tutStep,2);fxText(it.x,it.y-44,LL(BAG[it.k].n)+' · '+LL(BAG[it.k].d),'#fff3c0');track('act1_pick',{k:it.k})}else if(A.fullCd<=0){A.fullCd=3;message(L('가방이 가득 찼어요. 바꾸려면 아래 가방 칸을 탭해 내려놓으세요','背包满了。想换的话，点下方的背包格放下'),2.2)}}}
 if(0&&A.target){const it=A.target;if(!it.got&&Math.hypot(p.x-it.x,p.y-it.y)<46){A.pick+=dt;if(A.pick>.35){A.pick=0;A.target=null;if(A.bag.length>=8){message(L('가방이 가득 찼어요. 아래 가방 칸을 탭하면 버릴 수 있어요','背包满了，点下方的背包格可以丢弃'),2.2)}else{it.got=true;A.bag.push(it.k);AudioFx.cue('pick');vib('light');fxText(it.x,it.y-30,LL(BAG[it.k].n),'#fff3c0')}}}}
 for(const z of A.zs){const d=Math.hypot(p.x-z.x,p.y-z.y),sp=z.run?140:95;if(d<200&&p.y<A.front){z.a=1}else if(d>420)z.a=0;
  if(z.a){const k=sp*dt/Math.max(1,d);z.x+=(p.x-z.x)*k;z.y+=(p.y-z.y)*k}else{z.w+=dt;z.x=z.hx+Math.sin(z.w*.8)*40;z.y=z.hy+Math.cos(z.w*.6)*20}
  z.hit-=dt;z.atkT=Math.max(0,(z.atkT||0)-dt);if(d<38&&z.hit<=0){z.hit=1;z.atkT=.5;p.hp-=10;AudioFx.cue('hurt');vib('medium');shake(10,.25);const k=50/Math.max(1,d);p.x+=(p.x-z.x)*k;p.y+=(p.y-z.y)*k;p.tx=p.x;p.ty=p.y}}
 p.x=Math.max(p.y<340?140:195,Math.min(p.y<340?610:555,p.x));p.y=Math.max(120,Math.min(ACT1_H-40,p.y));
 if(p.y<300&&Math.hypot(p.x-375,p.y-210)<130){A.board=.01;AudioFx.cue('win');vib('long')}
 if(p.hp<=0){p.hp=0;fail('act1')}
 camY+=((p.y-H*.62)-camY)*Math.min(1,dt*5);camY=Math.max(0,Math.min(ACT1_H-H+180,camY))}
function moveTo(p,dt,sp){const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy);if(d>2){const k=Math.min(1,sp*dt/d);p.x+=dx*k;p.y+=dy*k}}
function act1Tap(x,y){const wx=x,wy=y+camY;
 if(y>1150){for(let i=0;i<8;i++){const bx=24+i*89;if(x>bx&&x<bx+82&&A.bag[i]){const k=A.bag.splice(i,1)[0];A.items.push({k,x:A.p.x+(Math.random()*60-30),y:A.p.y+50,got:false,wait:true});AudioFx.cue('ui');message(L('내려놓았어요: ','放下了：')+LL(BAG[k].n),1);return}}return}
 let best=null,bd=70;for(const it of A.items)if(!it.got){const d=Math.hypot(wx-it.x,wy-it.y);if(d<bd){bd=d;best=it}}
 if(best){A.target=best;A.p.tx=best.x;A.p.ty=best.y+8}else{A.target=null;A.p.tx=wx;A.p.ty=wy}tutStep=1}
function drawAct1(){const p=A.p;g.fillStyle='#1b1d22';g.fillRect(0,0,W,H);g.save();g.translate(0,-camY);
 // 도로와 건물 (회색 상자)
 if(imgs.world){g.fillStyle='#3e3d3b';g.fillRect(0,0,W,ACT1_H);const y0=Math.max(300,Math.floor(camY/158)*158-158),y1=camY+H+160;g.fillStyle='#2f2f30';g.fillRect(160,0,430,ACT1_H);for(let y=y0;y<y1;y+=158){wspPart('asphalt',0,0,1,1,215,y,160,160);wspPart('asphalt',0,0,1,1,375,y,160,160)}
  for(let i=0;i<21;i++){const y=320+i*150;if(y<camY-300||y>camY+H+300)continue;wsp(i%3===1?'building2':i%3===2?'building3':'building',i%2?95:80,y+150,170,'bottom');wsp(i%3===2?'building2':'building',i%2?670:655,y+190,170,'bottom')}
  for(let i=0;i<9;i++){const y=640+i*330;if(y<camY-200||y>camY+H+200)continue;if(i%3===1)wsp('barricade',i%2?300:450,y,180,'bottom');else wsp(i%4===0?'car2':'car',i%2?460:290,y,170,'bottom')}}
 else{g.fillStyle='#2a2d33';g.fillRect(170,0,410,ACT1_H);g.strokeStyle='#4a4d55';g.lineWidth=4;g.setLineDash([30,30]);g.beginPath();g.moveTo(375,300);g.lineTo(375,ACT1_H);g.stroke();g.setLineDash([]);
 for(let i=0;i<21;i++){const y=320+i*150;rr(10,y,140,120,6,'#30333b','#45484f',2);rr(600,y+40,140,120,6,'#30333b','#45484f',2)}}
 // 활주로와 비행기
 rr(120,40,510,300,10,'#2a2c30','#5a5e66',3);txt(L('사설 비행장','私人机场'),375,70,22,'#9aa0aa','center',false);
 if(!wsp('plane',375,210,300)){g.save();g.translate(375,210);g.fillStyle='#d8dde4';g.beginPath();g.ellipse(0,0,30,95,0,0,TAU);g.fill();g.fillRect(-120,-10,240,26);g.fillRect(-50,70,100,16);g.restore()}drawGlow(375,210,150,'y',.25+.1*Math.sin(frame*3));
 if(A.board>0)txt(L('탑승!','登机！'),375,330,34,'#ffe7a0','center');
 // 물건
 for(const it of A.items)if(!it.got){const B=BAG[it.k];drawGlow(it.x,it.y,40,'y',.35+.15*Math.sin(frame*4+it.x));g.save();g.globalAlpha=.9;circ(it.x,it.y,34,'rgba(20,24,32,.55)','rgba(255,226,150,.9)',2.5);g.restore();bagIcon(it.k,it.x,it.y+Math.sin(frame*3+it.x)*2,56);txt(LL(B.n),it.x,it.y-48,17,'#fff3c0','center');txt(LL(B.d),it.x,it.y+48,13,'#dfe6ee','center')}
 // 감염체 (어두운 실루엣)
 for(const z of A.zs)drawInfected(z)
 drawHero(p,A.board?'idle':null,96);drawFx(0);
 // 불길 (아래에서 올라옴)
 const fy=A.front;g.fillStyle='rgba(255,90,30,.35)';g.fillRect(0,fy,W,ACT1_H+200-fy);for(let i=0;i<10;i++)drawGlow(40+i*75,fy+10,70,'o',.5+.2*Math.sin(frame*5+i));
 g.restore();
 // 위쪽 안내
 hudBar(L('1막 · 몰락','第一幕 · 沦陷'),L('비행기까지 남은 거리 ','距离飞机 ')+Math.max(0,Math.round((p.y-210)/10))+'m');
 rr(24,120,300,22,11,'#20242c');rr(26,122,296*Math.max(0,p.hp)/100,18,9,p.hp>40?'#7fe0a0':'#ff7a7a');txt(L('체력','体力'),340,131,18,'#dfe6ee','left',false);
 // 가방
 rr(0,1140,W,194,0,'#11141aee');txt(L('가방 ','背包 ')+A.bag.length+'/8',24,1166,20,'#ffe2a0','left',false);txt(L('칸을 탭하면 내려놓기','点格子可以丢下'),726,1166,16,'#8a94a4','right',false);
 for(let i=0;i<8;i++){const bx=24+i*89,k=A.bag[i];rr(bx,1190,82,82,10,k?'#232a36':'#181c24',k?BAG[k].col:'#333a46',2);if(k){bagIcon(k,bx+41,1222,50);txt(LL(BAG[k].n),bx+41,1256,13,'#e6ecf2','center',false)}}
 if(tutStep===0&&!guideTip){const it=A.items[0];drawFinger(it.x,it.y-camY+30)}}
let heroBusy=0,heroAct=null;function heroDo(a,t){heroAct={a,t:t||1.1}}
function drawHero(p,force,h){const dx=p.x-(p.lx===undefined?p.x:p.lx),dy=p.y-(p.ly===undefined?p.y:p.ly);const mv=Math.hypot(dx,dy)>.4;if(Math.abs(dx)>.3)p.face=dx>0?1:-1;p.lx=p.x;p.ly=p.y;
 if(mv)p.mt=(p.mt||0)+1/60;const anim=force||(mv?(sc==='act1'?'run':'walk'):'idle');const fps=anim==='run'?14:anim==='walk'?11:anim==='idle'?6:anim==='sleep'?1.5:anim==='fish'?3:8;
 g.save();g.globalAlpha=.35;g.fillStyle='#000';g.beginPath();g.ellipse(p.x,p.y+2,h*.22,h*.07,0,0,TAU);g.fill();g.restore();
 if(!sprite('hero',anim,anim==='idle'?frame:(force?frame:p.mt),p.x,p.y+4,h,p.face||-1,fps))drawPlayer(p.x,p.y-16)}
function drawInfected(z){const dx=z.x-(z.lx===undefined?z.x:z.lx);if(Math.abs(dx)>.2)z.face=dx>0?1:-1;z.lx=z.x;z.wt=(z.wt||0)+1/60*(z.a?1.6:.8);
 g.save();g.globalAlpha=.3;g.fillStyle='#000';g.beginPath();g.ellipse(z.x,z.y+20,22,7,0,0,TAU);g.fill();g.restore();
 const nm=z.run?'inf_runner':'inf_walker',hh=z.run?92:100;let ok2;if(z.hp<=0)ok2=sprite(nm,'down',z.dead||0,z.x,z.y+22,hh,z.face||-1,-6,Math.max(0,Math.min(1,(1.6-(z.dead||0))/.5)));else if(z.atkT>0)ok2=sprite(nm,'attack',.5-z.atkT,z.x,z.y+22,hh,z.face||-1,-8);else ok2=sprite(nm,'walk',z.wt,z.x,z.y+22,hh,z.face||-1,9);if(z.hp<=0&&!ok2)return;
 if(!ok2){circ(z.x,z.y,z.run?17:20,'#0b0c0f',z.a?'#7a5a5a':'#3a3c42',3);circ(z.x-6,z.y-5,2.5,'#c8b070');circ(z.x+6,z.y-5,2.5,'#c8b070')}
 if(z.a&&z.hp>0){txt('!',z.x,z.y-80,22,'#ffb08a','center')}}
// 아직 그림이 없는 가방 물건은 같은 굵은 외곽선으로 직접 그린다
function bagIcon(k,x,y,size){if(icon(ICON_OF['bag_'+k],x,y,size))return;const u=size/52,ol='#1c1410';g.save();g.translate(x,y);g.scale(u,u);g.lineJoin='round';g.lineWidth=3.2;g.strokeStyle=ol;
 const P=(pts,fill)=>{g.beginPath();pts.forEach((q,i)=>i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]));g.closePath();g.fillStyle=fill;g.fill();g.stroke()};
 if(k==='knife'){g.rotate(-.7);P([[-2,-24],[7,-16],[7,6],[-5,6],[-5,-14]],'#d9e0e6');P([[-7,6],[9,6],[9,10],[-7,10]],'#8a6a3a');P([[-4,10],[6,10],[6,24],[-4,24]],'#7a4a26')}
 else if(k==='lighter'){P([[-10,-4],[10,-4],[10,22],[-10,22]],'#d86a2a');P([[-10,-12],[6,-12],[6,-4],[-10,-4]],'#b9c0c8');g.beginPath();g.moveTo(0,-13);g.quadraticCurveTo(-9,-22,0,-30);g.quadraticCurveTo(9,-22,0,-13);g.fillStyle='#ffc93a';g.fill();g.stroke()}
 else if(k==='filter'){P([[-10,-22],[10,-22],[10,-14],[-10,-14]],'#3a7ab8');P([[-13,-14],[13,-14],[13,16],[-13,16]],'#bfe9ff');P([[-13,-2],[13,-2],[13,6],[-13,6]],'#5fb4e8');P([[-5,16],[5,16],[3,25],[-3,25]],'#8a9098')}
 else if(k==='flash'){g.rotate(-.6);P([[-7,-4],[7,-4],[7,24],[-7,24]],'#5a626c');P([[-13,-18],[13,-18],[8,-4],[-8,-4]],'#8a929c');P([[-13,-22],[13,-22],[13,-18],[-13,-18]],'#fff3a0');g.fillStyle='#ffd24a';g.fillRect(-3,4,6,7)}
 else if(k==='tools'){g.beginPath();g.moveTo(-9,-10);g.lineTo(-9,-19);g.lineTo(9,-19);g.lineTo(9,-10);g.lineWidth=5;g.stroke();g.lineWidth=3.2;P([[-22,-10],[22,-10],[22,18],[-22,18]],'#c0452e');P([[-22,-10],[22,-10],[22,-2],[-22,-2]],'#8f2f1e');P([[-4,-5],[4,-5],[4,3],[-4,3]],'#e8c84a')}
 else{P([[-16,-16],[16,-16],[16,16],[-16,16]],BAG[k]?BAG[k].col:'#888')}g.restore()}
function drawPlayer(x,y,face){g.save();circ(x,y+18,16,'rgba(0,0,0,.35)');circ(x,y,17,'#e9e2d2','#1a1a1a',3);circ(x,y-4,6,'#3a3a3a');drawGlow(x,y-8,22,'y',.35);g.restore()}
function hudBar(a,b){rr(0,0,W,104,0,'#0d1016e6');txt(a,24,40,26,'#ffe2a0','left',false);txt(b,24,78,19,'#c9d2de','left',false);button(646,22,82,60,'II','dark',26,()=>{paused=true})}
function fxText(x,y,s,col){const n=fx.filter(f=>f.t<.6&&Math.abs(f.x-x)<120&&Math.abs(f.y-y)<80).length;fx.push({x,y:y-n*28,s,col,t:0})}
function drawFx(oy=0){for(const f of fx){f.t+=1/60;g.globalAlpha=Math.max(0,1-f.t/1.2);txt(f.s,f.x,f.y-f.t*50-oy,20,f.col,'center');g.globalAlpha=1}fx=fx.filter(f=>f.t<1.2)}

// ================================================================ 불시착 해역 선택
function zoneScreen(){zoneT+=1/60;g.fillStyle='#0a1a22';g.fillRect(0,0,W,H);for(let i=0;i<30;i++){g.fillStyle='rgba(120,180,200,.06)';g.fillRect(0,(i*53+frame*30)%H,W,2)}
 txt(L('연료가 떨어진다!','燃油快耗尽了！'),375,170,44,'#ffcf6a','center');txt(L('어느 바다로 기수를 돌릴까?','把机头转向哪片海？'),375,230,24,'#dfe6ee','center',false);
 ZONES.forEach((z,i)=>{const y=310+i*270;rr(60,y,630,240,18,'#122630',z.col,3);txt(LL(z.n),100,y+48,34,'#fff','left');txt('＋ '+LL(z.good),100,y+110,22,'#9fffbf','left',false);txt('－ '+LL(z.bad),100,y+156,22,'#ffb0a0','left',false);
  hotspot(60,y,630,240,()=>startSea(i),'zone'+i)});
 txt(L('가방에 챙긴 것: ','背包里有：')+(A?A.bag.map(k=>LL(BAG[k].n)).join(', '):''),375,1180,17,'#9fb0c4','center',false)}

// ================================================================ 2막: 해상 생존
function newRun(zone,bag){const res={plank:2,plastic:1,cloth:0,scrap:1,rope:0,water:0,can:0,fish:0,cooked:0,berry:0,med:0};const items={};let radioPart=false,rod=false;
 for(const k of bag){if(k==='water')res.water+=2;else if(k==='can')res.can+=2;else if(k==='med')res.med+=2;else if(k==='rope')res.rope+=3;else if(k==='tarp')res.cloth+=3;else if(k==='radio')radioPart=true;else if(k==='line')rod=true;else items[k]=true}
 for(const k in save.bank){res[k]=(res[k]||0)+save.bank[k]}save.bank={};
 const deck=[];for(let y=0;y<2;y++)for(let x=-1;x<=1;x++)deck.push({x,y,hp:3,m:null});
 if(rod)deck[2].m={k:'rod'};
 return {zone,day:1,t:8,res,items,radioPart,radioBuilt:false,deck,vit:{thirst:80,hunger:75,temp:70,hp:100},p:{gx:0,gy:1},lashed:0,sail:false,flint:false,landed:0,rainT:0,rainAt:-1,today:{debris:0,built:0,fish:0,lost:0},filterT:0,shadowT:0,stormHit:0}}
function startSea(zi){track('zone_pick',{zone:ZONES[zi].k});R=newRun(zi,A?A.bag:[]);save.run=R;save.stats.runs++;A=null;persist();enterSea();tutStep=0;morningEvents(false);
 tip('sea',[['좀비는 물을 건너지 못해요. 바다는 안전하지만, 물과 먹을 것과 체온이 문제예요.','丧尸过不了水。海上是安全的，但缺水、缺食物、会着凉。'],['떠내려오는 물건을 탭하면 갈고리로 끌어와요.','点击漂来的物品，用钩子拉过来。'],['재료가 모이면 아래 [짓기]로 빗물 통부터 만들어요.','材料够了，就用下方[建造]先造雨水桶。']])}
function enterSea(){migrate();sc='sea';debris=[];fx=[];buildPick=null;sleeping=false;act=null;fishing=null;const pp=tilePos(R.p.gx,R.p.gy);seaP={x:pp.x,y:pp.y,tx:pp.x,ty:pp.y};gulls=[];for(let i=0;i<5;i++)gulls.push({x:Math.random()*W,y:150+Math.random()*250,v:30+Math.random()*30});spawnT=1;morningEvents(true)}
let seaP={x:RAFT_X,y:RAFT_Y,tx:RAFT_X,ty:RAFT_Y};
function Z(){return ZONES[R.zone]}
function tilePos(gx,gy){return {x:RAFT_X+gx*T,y:RAFT_Y+gy*T}}
function tileAt(gx,gy){return R.deck.find(d=>d.x===gx&&d.y===gy)}
function stormDay(){return R.day===Z().storm||(R.day>Z().storm&&(R.day-Z().storm)%4===0)}
function inStorm(){return stormDay()&&R.t>=60&&R.t<100}
function isNight(){return R.t>=NIGHT}
function fireTile(){return R.deck.find(d=>d.m&&d.m.k==='fire')}
function fireLit(){const f=fireTile();return !!(f&&f.m.fuel>0)}
function nearTile(d,r=1.25){const p=tilePos(d.x,d.y);return Math.hypot(seaP.x-p.x,seaP.y-p.y)<=T*r+2}
function islandOpen(){return R.day>=Z().island&&R.t<112&&R.landed<R.day&&!inStorm()}
function morningEvents(resume){if(resume)return;
 for(const d of R.deck)if(d.m&&d.m.k==='rain')d.m.w=Math.min(6,(d.m.w||0)+1);// 새벽 이슬
 R.rainAt=Math.random()<.55*Z().rain?40+Math.random()*60:-1;R.today={debris:0,built:0,fish:0,lost:0};radioMorning();harborMorning();
 if(stormDay())message(L('기압계 바늘이 떨어진다… 오늘 오후 폭풍이 온다!','气压计在下降……今天下午有风暴！'),3);
 else if(R.day+1===Z().storm||(R.day+1>Z().storm&&(R.day+1-Z().storm)%4===0))message(L('무전: "내일 오후 폭풍 예보." 밧줄로 배를 묶어 두자','电台："明天下午有风暴。"用绳子加固船吧'),3)}
function seaTick(dt){const Zn=Z(),v=R.vit,spd=sleeping?4:1;const dtt=dt*spd;R.t+=dtt;questTick(dt);survTick(dtt);teach();if(radioShow){radioShow.t-=dt;if(radioShow.t<=0)radioShow=null}
 // 시간대
 if(R.t>=DUSK&&R.t-dtt<DUSK){message(L('해가 진다. 모닥불에 판자를 넣어 두자','太阳下山了，往篝火里添点木板'),2.2);AudioFx.cue('warn')}
 if(R.t>=NIGHT&&R.t-dtt<NIGHT)track('night_start',{day:R.day});
 if(R.t>=DAY){endDay();return}
 const storm=inStorm(),night=isNight();
 if(storm&&R.t-dtt<60){AudioFx.cue('thunder');shake(16,.6);vib('heavy');track('storm',{day:R.day})}
 // 비
 const raining=storm||(R.rainAt>0&&R.t>=R.rainAt&&R.t<R.rainAt+25);
 if(raining){R.rainT+=dtt;if(R.rainT>(storm?2:4)){R.rainT=0;for(const d of R.deck)if(d.m&&d.m.k==='rain'&&(d.m.w||0)<6)d.m.w=(d.m.w||0)+1}}
 // 증류기·정수 필터·모닥불 연료
 for(const d of R.deck)if(d.m){if(d.m.k==='still'){d.m.c=(d.m.c||0)+dtt;if(d.m.c>=60){d.m.c=0;if((d.m.w||0)<3)d.m.w=(d.m.w||0)+1}}if(d.m.k==='fire'&&d.m.fuel>0)d.m.fuel=Math.max(0,d.m.fuel-dtt*(storm?2:1))}
 if(R.items.filter){R.filterT+=dtt;if(R.filterT>=50){R.filterT=0;R.res.water++;fxText(seaP.x,seaP.y-40,L('정수 필터 물 +1','滤芯 水+1'),'#9fe8ff')}}
 // 몸 상태
 const ft=fireTile(),warm=fireLit()&&ft&&nearTile(ft,1.6);
 v.thirst-=.30*dtt;v.hunger-=.22*dtt;
 if(warm)v.temp+=.6*dtt;else if(night)v.temp-=.30*Zn.cold*dtt;else v.temp+=.10*dtt*(v.temp<70?1:0);
 if(storm&&!warm)v.temp-=.28*dtt;if(sleeping&&ft&&fireLit())v.temp+=.2*dtt;
 let bad=0;for(const k of ['thirst','hunger','temp'])if(v[k]<=0){v[k]=0;bad++}
 if(bad)v.hp-=.55*bad*dtt;else if(v.thirst>40&&v.hunger>40&&v.temp>40)v.hp+=.12*dtt;
 for(const k in v)v[k]=Math.max(0,Math.min(100,v[k]));
 if(v.hp<=0){fail('sea');return}
 // 밤의 그림자: 불이 꺼져 있으면 배를 들이받아 물건을 빼앗아 간다
 if(night&&!fireLit()&&!R.surv.some(s2=>s2.id===2&&s2.fed)){R.shadowT+=dtt;if(R.shadowT>(R.items.flash?22:12)){R.shadowT=0;shadowBump()}}else R.shadowT=Math.max(0,R.shadowT-dtt);
 // 폭풍 피해
 if(storm){R.stormHit+=dtt;if(R.stormHit>9){R.stormHit=0;stormDamage()}}
 // 떠내려오는 물건
 if(!storm&&!sleeping){spawnT-=dt;if(spawnT<=0){spawnT=(night?5:3.1)/Zn.debris*(R.day>Zn.storm&&R.t<40?.5:1);spawnDebris()}}
 for(const o of debris){if(o.pull){const dx=seaP.x-o.x,dy=seaP.y-o.y,d=Math.hypot(dx,dy);const k=Math.min(1,700*dt/Math.max(1,d));o.x+=dx*k;o.y+=dy*k;if(d<30){o.gone=1;collect(o)}}else{o.y+=o.v*dt*(storm?2:1);o.x+=Math.sin(frame*1.3+o.ph)*12*dt}}
 debris=debris.filter(o=>!o.gone&&o.y<H+60);
 for(const s of gulls){s.x+=s.v*dt;if(s.x>W+40)s.x=-40}heroBusy=Math.max(0,heroBusy-dt);
 // 걷기와 행동
 moveTo(seaP,dt,240);
 if(act&&Math.hypot(seaP.x-seaP.tx,seaP.y-seaP.ty)<4){const a=act;act=null;a()}
 if(fishing){fishing.t+=dtt;if(fishing.t>=7){const ok=Math.random()<.45*Zn.fish;fishing=null;if(ok){R.res.fish++;R.today.fish++;fxText(seaP.x,seaP.y-40,L('물고기! +1','钓到鱼！+1'),'#b8f0ff');AudioFx.cue('splash');vib('light')}else fxText(seaP.x,seaP.y-40,L('놓쳤다…','跑了……'),'#aab')}}
 if(sleeping&&!night)sleeping=false}
function spawnDebris(){if(R.ch===8&&R.radioBuilt&&!R.surv.length&&!debris.some(o=>o.k==='survivor')&&Math.random()<.3){debris.push({k:'survivor',x:140+Math.random()*(W-280),y:-30,v:26,ph:0});return}
 const r=Math.random()*100;let k;if(r<34)k='plank';else if(r<58)k='plastic';else if(r<72)k='cloth';else if(r<83)k='crate';else if(r<88)k='bottle';else if(r<97)k='scrap';else k='supply';
 debris.push({k,x:60+Math.random()*(W-120),y:-30,v:34+Math.random()*16,ph:Math.random()*6})}
function collect(o){if(o.k==='survivor'){addSurvivor(0);return}if(o.k==='bottle'){bottle();return}const r=R.res;let got={};R.cnt.debris++;if(o.k==='plank')got={plank:1};else if(o.k==='plastic')got={plastic:1};else if(o.k==='cloth')got={cloth:1};else if(o.k==='scrap')got={scrap:1};
 else if(o.k==='crate'){const q=Math.random();got=q<.35?{can:1}:q<.6?{rope:1}:q<.8?{scrap:2}:{plank:2}}else got={can:1,rope:1,plastic:2,cloth:1};
 for(const k in got)r[k]=(r[k]||0)+got[k];R.today.debris++;save.stats.debris++;mission('debris');AudioFx.cue('pick');vib('light');
 fxText(seaP.x,seaP.y-50,Object.keys(got).map(k=>LL(RES_N[k])+'+'+got[k]).join(' '),'#fff3c0');track('debris',{k:o.k})}
function shadowBump(){const ks=['plank','plastic','cloth','can','fish','rope'].filter(k=>R.res[k]>0);shake(14,.4);vib('heavy');AudioFx.cue('hit');
 if(ks.length){const k=ks[Math.floor(Math.random()*ks.length)];R.res[k]--;R.today.lost++;message(L('어둠 속의 무언가가 배를 들이받았다! ','黑暗中有东西撞了船！')+LL(RES_N[k])+' -1. '+L('불을 켜 두자','把火点着吧'),2.2)}
 else message(L('어둠 속의 무언가가 배 밑을 스쳐 갔다…','黑暗里有东西从船底滑过……'),2)}
function stormDamage(){if(R.lashed>0&&Math.random()<.5)return;const cand=R.deck.filter(d=>!(R.p.gx===d.x&&R.p.gy===d.y));if(!cand.length)return;const d=cand[Math.floor(Math.random()*cand.length)];d.hp--;shake(12,.4);vib('medium');AudioFx.cue('hit');
 if(d.hp<=0&&R.deck.length>2){R.deck.splice(R.deck.indexOf(d),1);R.today.lost++;message(L('파도가 갑판 한 칸을 부숴 버렸다!','海浪打碎了一格甲板！')+(d.m?' ('+LL(MODS[d.m.k].n)+')':''),2.2)}else{d.hp=Math.max(1,d.hp);message(L('갑판이 삐걱거린다. 금 간 칸을 탭해 판자로 고치자','甲板吱嘎作响。点裂开的格子用木板修补'),2)}}
function endDay(){sleeping=false;fishing=null;act=null;survEat();if(R.res.fish>0){R.today.lost+=R.res.fish;R.today.spoil=R.res.fish;R.res.fish=0}if(inStorm()===false&&R.lashed>0&&stormDay())R.lashed--;
 save.stats.days++;save.stats.best=Math.max(save.stats.best,R.day);track('day_end',{day:R.day,hp:Math.round(R.vit.hp),deck:R.deck.length,mods:R.deck.filter(d=>d.m).length});
 if(fireLit()||R.today.lost===0)mission('night');sc='dayend';dayendT=0;persist()}
function nextDay(){if(stormDay()&&R.lashed>0)R.lashed=0;R.day++;R.t=0;R.shadowT=0;R.stormHit=0;persist();
 if(R.day===4&&!save.g1fb){sc='g1done';g1T=0;return}sc='sea';morningEvents(false)}
// --- 탭 처리 (바다)
function seaTap(x,y){if(sleeping){sleeping=false;message(L('잠에서 깼다','醒了'),1);return}
 // 짓기 위치 고르기
 if(buildPick){const cell=cellAt(x,y);if(!cell){buildPick=null;return}
  if(buildPick==='deck'){if(tileAt(cell.x,cell.y)||!adjacentEmpty(cell.x,cell.y))return;pay('deck');R.deck.push({x:cell.x,y:cell.y,hp:3,m:null});built('deck');buildPick=null;return}
  const t=tileAt(cell.x,cell.y);if(!t||t.m)return;pay(buildPick);t.m={k:buildPick,w:0,fuel:0};built(buildPick);buildPick=null;return}
 // 떠내려오는 물건
 let best=null,bd=56;for(const o of debris)if(!o.pull){const d=Math.hypot(x-o.x,y-o.y);if(d<bd){bd=d;best=o}}
 if(best){const d=Math.hypot(best.x-seaP.x,best.y-seaP.y);if(d>440){message(L('너무 멀어요. 배 가장자리로 가서 던지세요','太远了，走到船边再抛钩'),1.4);return}best.pull=true;AudioFx.cue('hook');tutStep=Math.max(tutStep,1);return}
 // 갑판
 const cell=cellAt(x,y);const t=cell&&tileAt(cell.x,cell.y);if(!t)return;
 walkTo(t,()=>useTile(t))}
function walkTo(t,fn){const p=tilePos(t.x,t.y);let ox=0;if(t.m)ox=seaP.x<p.x?-T*.32:T*.32;seaP.tx=p.x+ox;seaP.ty=p.y+(t.m?T*.18:0);R.p.gx=t.x;R.p.gy=t.y;act=fn;fishing=null}
function useTile(t){if(t.hp<3){if(R.res.plank>0){R.res.plank--;t.hp=3;AudioFx.cue('build');fxText(seaP.x,seaP.y-40,L('수리!','修好了！'),'#ffe7a0');return}message(L('고치려면 판자가 필요해요','修补需要木板'),1.2);return}
 if(!t.m)return;const m=t.m,r=R.res,v=R.vit;heroBusy=.8;
 if(m.k==='rain'||m.k==='still'){if((m.w||0)>0){if(v.thirst<92){m.w--;v.thirst=Math.min(100,v.thirst+35);mission('drink');heroDo('drink');AudioFx.cue('splash');fxText(seaP.x,seaP.y-40,L('꿀꺽! 갈증 +35','咕嘟！口渴 +35'),'#9fd8ff')}else{m.w--;r.water++;fxText(seaP.x,seaP.y-40,L('물을 병에 담았다 +1','装进水瓶 +1'),'#9fd8ff')}}else message(m.k==='rain'?L('아직 비어 있어요. 비가 오면 차요','还是空的，下雨时会蓄满'):L('물이 만들어지는 중이에요','正在制造淡水'),1.4);return}
 if(m.k==='fire'){if(r.fish>0&&m.fuel>=6){r.fish--;r.cooked++;m.fuel-=6;R.cnt.cooked++;mission('cook');AudioFx.cue('fire');fxText(seaP.x,seaP.y-40,L('생선을 구웠다','烤好了鱼'),'#ffc080');return}
  if(r.plank>0){if(!m.fuel&&!R.items.lighter&&!R.flint){if(r.scrap>=2){r.scrap-=2;R.flint=true;message(L('고철로 부싯돌을 만들어 불을 붙였다 (고철 -2)','用废铁做了打火石点火（废铁-2）'),2)}else{message(L('불을 붙일 도구가 없어요. 고철 2개로 부싯돌을 만들 수 있어요','没有点火工具。2个废铁可以做打火石'),2);return}}
   r.plank--;m.fuel=(m.fuel||0)+60;AudioFx.cue('fire');fxText(seaP.x,seaP.y-40,L('불길 +60초','火焰 +60秒'),'#ffb070');return}
  message(L('넣을 판자가 없어요','没有可以添的木板'),1.2);return}
 if(m.k==='rod'){fishing={t:0};fxText(seaP.x,seaP.y-40,L('낚시 중…','钓鱼中……'),'#cfe');return}
 if(m.k==='bed'){if(isNight()){sleeping=true;message(L('잠을 청한다… (화면을 탭하면 깨요)','睡下了……（点屏幕醒来）'),2)}else message(L('잠은 밤에 자요','晚上才能睡'),1.2);return}
 if(m.k==='radio'){radioUse();return}
 if(m.k==='sail'||m.k==='lash'){message(LL(MODS[m.k].d),1.4)}}
function radioUse(){AudioFx.cue('warn');message(L('…치직… "여기는 동쪽 항구… 살아 있는 사람… 등대에 불을…" 신호가 끊겼다. (3막 예고)','……滋滋……"这里是东港……有活人吗……点亮灯塔……"信号断了。（第三幕预告）'),4);track('radio_signal',{day:R.day})}
function cellAt(x,y){const gx=Math.round((x-RAFT_X)/T),gy=Math.round((y-RAFT_Y)/T);if(Math.abs(x-(RAFT_X+gx*T))>T/2||Math.abs(y-(RAFT_Y+gy*T))>T/2)return null;if(gx<-3||gx>3||gy<-3||gy>4)return null;return {x:gx,y:gy}}
function adjacentEmpty(x,y){return !!(tileAt(x+1,y)||tileAt(x-1,y)||tileAt(x,y+1)||tileAt(x,y-1))}
function costOf(k){const cst=Object.assign({},MODS[k].cost);if(R.items.tools&&cst.plank)cst.plank=Math.max(0,cst.plank-1);if(k==='rod'&&R.deck.every(d=>!d.m||d.m.k!=='rod')&&R.freeRod)cst.plank=0;return cst}
function canPay(k){const c2=costOf(k);for(const r in c2)if((R.res[r]||0)<c2[r])return false;if(MODS[k].need==='radio'&&!R.radioPart)return false;return true}
function pay(k){const c2=costOf(k);for(const r in c2)R.res[r]-=c2[r]}
function built(k){if(k==='radio')setTimeout(()=>{if(R&&!radioShow)radioMorning()},1500);heroBusy=1.2;AudioFx.cue('build');vib('medium');R.today.built++;mission('build');track('build',{k,day:R.day});if(k==='radio'){R.radioBuilt=true;setTimeout(radioUse,600)}persist()}
function chooseBuild(k){if(!canPay(k)){message(MODS[k].need==='radio'&&!R.radioPart?L('무전기 부품이 필요해요 (1막 가방 또는 섬의 오두막)','需要电台零件（第一幕背包或岛上小屋）'):L('재료가 모자라요','材料不够'),1.4);return}
 if(k==='lash'){pay(k);R.lashed=1;built(k);message(L('배를 단단히 묶었다. 다음 폭풍 피해 절반','船绑牢了，下次风暴伤害减半'),1.8);sc='sea';return}
 if(k==='sail'){if(R.sail){message(L('이미 돛이 있어요','已经有船帆了'),1.2);return}}
 if(k!=='deck'&&!R.deck.some(d=>!d.m)){message(L('빈 칸이 없어요. 먼저 갑판을 넓히세요','没有空格，先扩建甲板'),1.6);return}
 if(k==='sail'){pay(k);R.sail=true;const t=R.deck.find(d=>!d.m);t.m={k:'sail'};built(k);sc='sea';return}
 buildPick=k;sc='sea';tip('build',[['빛나는 칸을 탭해 놓을 곳을 정해요.','点击发光的格子选择位置。'],['모닥불 가까이는 따뜻해요. 자주 쓰는 것은 서로 가까이 두세요.','篝火旁边很暖和，常用的东西放近一些。']])}
// --- 바다 그리기
function drawSea(){const night=isNight(),storm=inStorm(),dusk=R.t>DUSK&&!night;
 const top=storm?'#1a2a30':night?'#06101a':dusk?'#2a5560':'#2b93a0',bot=storm?'#0e1a1e':night?'#030a12':dusk?'#143a46':'#15616e';
 const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,top);gr.addColorStop(1,bot);g.fillStyle=gr;g.fillRect(0,0,W,H);
 if(imgs.tile_ocean){g.save();g.globalAlpha=storm?.10:night?.07:.13;const sz=640,oy=(frame*9)%sz,ox=(frame*3)%sz;for(let y=-sz+oy;y<H;y+=sz)for(let x=-ox;x<W;x+=sz)g.drawImage(imgs.tile_ocean,x,y,sz+1,sz+1);g.restore()}
 g.lineWidth=3;g.lineCap='round';for(let i=0;i<22;i++){const y=((i*67+frame*14)%(H+60))-30,x0=(i*173)%W,len=50+(i*29)%70;g.strokeStyle='rgba(225,250,250,'+(night?.05:.13)+')';g.beginPath();g.moveTo(x0,y);g.quadraticCurveTo(x0+len/2,y-6+Math.sin(frame*1.5+i)*3,x0+len,y);g.stroke()}
 if(!qualityLow){const vg=g.createRadialGradient(375,620,260,375,620,820);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,16,24,.38)');g.fillStyle=vg;g.fillRect(0,0,W,H)}
 // 섬 (상륙 가능할 때)
 if(ch2On())drawCoast();else if(R.day>=Z().island&&R.t<125){const op=islandOpen();g.save();g.globalAlpha=op?1:.4;g.fillStyle='#3e4a36';g.beginPath();g.ellipse(620,170,120,50,0,0,TAU);g.fill();g.fillStyle='#2f3a2a';for(let i=0;i<5;i++)circ(560+i*28,150-Math.sin(i)*10,16,'#2c3826');g.restore()}
 // 갈매기 (폭풍 전에 사라짐 = 예고 신호)
 if(!(stormDay()&&R.t>40&&R.t<100)&&!night)for(const s of gulls){g.strokeStyle='#dfe6ee';g.lineWidth=2;g.beginPath();g.moveTo(s.x-8,s.y);g.lineTo(s.x,s.y+4);g.lineTo(s.x+8,s.y);g.stroke()}
 // 떠내려오는 물건
 for(const o of debris){const col={plank:'#c79a5b',plastic:'#7fc6e8',cloth:'#c9c2e0',crate:'#a07850',scrap:'#9aa3ad',supply:'#ffd060'}[o.k];g.save();g.translate(o.x,o.y);g.rotate(Math.sin(frame+o.ph)*.2);if(o.k==='supply')drawGlow(0,0,52,'y',.5);else drawGlow(0,4,46,'w',.28+.08*Math.sin(frame*3+o.ph));
  if(o.k==='survivor'){drawGlow(0,0,80,'y',.45);wsp('boat',0,6,124);sprite('surv0','idle',frame,0,8,62,-1,6);txt('!',0,-58,28,'#ffe27a','center')}else if(o.k==='bottle'){drawGlow(0,0,44,'b',.6);icon('water',0,0,46)}else if(wsp('debris_'+o.k,0,0,o.k==='supply'?92:80)){}else if(icon(ICON_OF[o.k],0,0,o.k==='supply'?60:50)){}else if(o.k==='plank')rr(-26,-8,52,16,4,col,'#2a1e14',2);else if(o.k==='plastic')rr(-14,-18,28,36,10,col,'#1e3a48',2);else if(o.k==='cloth')rr(-20,-12,40,24,10,col,'#3a3550',2);else if(o.k==='crate'){rr(-18,-18,36,36,4,col,'#3a2414',3);g.strokeStyle='#3a2414';g.beginPath();g.moveTo(-18,-18);g.lineTo(18,18);g.stroke()}else if(o.k==='scrap')rr(-16,-10,32,20,2,col,'#333',2);else{drawGlow(0,0,40,'y',.6);rr(-20,-20,40,40,6,col,'#5a4010',3)}
  g.restore();if(o.pull){g.strokeStyle='#e8e0c8';g.lineWidth=2;g.beginPath();g.moveTo(seaP.x,seaP.y);g.lineTo(o.x,o.y);g.stroke()}}
 // 배
 const art=!!imgs.world;
 for(const d of R.deck){const p=tilePos(d.x,d.y),f=9+Math.sin(frame*2+d.x+d.y)*3;rr(p.x-T/2-f,p.y-T/2-f,T+f*2,T+f*2,18,'rgba(235,252,252,.13)')}// 배 둘레 물거품
 for(const d of R.deck){const p=tilePos(d.x,d.y);g.fillStyle='rgba(0,20,30,.35)';g.fillRect(p.x-T/2+4,p.y-T/2+10,T,T)}// 물 그림자
 for(const d of R.deck){const p=tilePos(d.x,d.y);const v=d.hp>=3?((d.x+d.y)&1?'deck1':'deck0'):d.hp===2?'deck2':'deck3';
  if(!(art&&wspPart(v,0,0,1,1,p.x-T/2-1,p.y-T/2-1,T+2,T+2))){rr(p.x-T/2+2,p.y-T/2+2,T-4,T-4,8,'#7a5c3e','#3a2a1c',3);if(d.hp<3){g.strokeStyle='#1a0f08';g.lineWidth=3;g.beginPath();g.moveTo(p.x-20,p.y-22);g.lineTo(p.x+4,p.y);g.lineTo(p.x-6,p.y+18);g.stroke()}}
  if(d.hp<2)txt('!',p.x+28,p.y-28,22,'#ff9a7a','center')}
 if(art)for(const d of R.deck){const p=tilePos(d.x,d.y),x0=p.x-T/2,y0=p.y-T/2,e=.18,ew=16;// 바깥쪽 면에만 통나무·밧줄·부표
  if(!tileAt(d.x,d.y-1))wspPart('deckb0',0,0,1,e,x0-6,y0-ew+4,T+12,ew+4);if(!tileAt(d.x,d.y+1))wspPart('deckb0',0,1-e,1,e,x0-6,y0+T-4,T+12,ew+4);
  if(!tileAt(d.x-1,d.y))wspPart('deckb0',0,e,e,1-2*e,x0-ew+4,y0,ew+2,T);if(!tileAt(d.x+1,d.y))wspPart('deckb0',1-e,e,e,1-2*e,x0+T-6,y0,ew+2,T)}
 for(const d of R.deck)if(d.m)drawModule(d,tilePos(d.x,d.y));
 if(buildPick){for(let gy=-3;gy<=4;gy++)for(let gx=-3;gx<=3;gx++){const p=tilePos(gx,gy),t=tileAt(gx,gy);const ok=buildPick==='deck'?(!t&&adjacentEmpty(gx,gy)):(t&&!t.m);if(ok){g.globalAlpha=.5+.3*Math.sin(frame*6);rr(p.x-T/2+6,p.y-T/2+6,T-12,T-12,10,'rgba(255,220,120,.25)','#ffd070',3);g.globalAlpha=1}}}
 drawSurv();drawHero(seaP,sleeping?'sleep':heroAct&&heroAct.t>0?heroAct.a:fishing?'fish':heroBusy>0?'craft':null,88);if(heroAct)heroAct.t-=1/60;if(fishing){g.strokeStyle='#cfe';g.lineWidth=2;g.beginPath();g.moveTo(seaP.x,seaP.y);g.lineTo(seaP.x+70,seaP.y+90);g.stroke();circ(seaP.x+70,seaP.y+90,5,'#ff6060')}
 drawFx();
 // 밤과 폭풍
 if(night||dusk||storm){const a=night?.6:storm?.4:(R.t-DUSK)/(NIGHT-DUSK)*.45;g.fillStyle=`rgba(2,6,14,${a})`;g.fillRect(0,0,W,H);const ft=fireTile();if(ft&&fireLit()){const p=tilePos(ft.x,ft.y);g.save();g.globalCompositeOperation='lighter';drawGlow(p.x,p.y,230+Math.sin(frame*9)*8,'o',.55);g.restore()}
  if(night&&!fireLit()){const ang=frame*.6;const sx=RAFT_X+Math.cos(ang)*260,sy=RAFT_Y+Math.sin(ang)*200;g.save();g.translate(sx,sy);g.rotate(ang+1.57);if(!wsp('shadow',0,0,300)){g.fillStyle='rgba(0,0,0,.6)';g.beginPath();g.ellipse(0,0,60,22,0,0,TAU);g.fill()}g.restore()}}
 if(storm||(R.rainAt>0&&R.t>=R.rainAt&&R.t<R.rainAt+25)){g.strokeStyle='rgba(200,220,240,.35)';g.lineWidth=2;for(let i=0;i<(storm?90:40);i++){const x=(i*97+frame*400)%W,y=(i*131+frame*900)%H;g.beginPath();g.moveTo(x,y);g.lineTo(x-8,y+22);g.stroke()}if(storm&&Math.random()<.004){g.fillStyle='rgba(255,255,255,.5)';g.fillRect(0,0,W,H)}}
 if(sleeping){g.fillStyle='rgba(0,0,0,.4)';g.fillRect(0,0,W,H);txt('Z z z',375,500,48,'#c8c0ff','center')}
 seaHud()}
function drawModule(d,p){const m=d.m,M=MODS[m.k];if(!icon(ICON_OF[m.k],p.x,p.y-6,70))rr(p.x-28,p.y-30,56,52,10,M.col,'#111',3);txt(LL(M.n),p.x,p.y+32,13,'#fff','center');
 if(m.k==='rain'||m.k==='still'){const cap=m.k==='rain'?6:3;for(let i=0;i<cap;i++)rr(p.x-24+i*(48/cap),p.y+8,48/cap-3,8,2,i<(m.w||0)?'#5fb4ff':'#1d2a36')}
 if(m.k==='fire'){if(m.fuel>0){drawGlow(p.x,p.y-8,40+Math.sin(frame*12)*4,'o',.9);txt(Math.ceil(m.fuel)+'s',p.x,p.y-42,15,'#ffd0a0','center')}else txt(L('꺼짐','熄灭'),p.x,p.y-42,14,'#aab','center')}
 if(m.k==='sail'&&!imgs.icons){g.fillStyle='#efe8d8';g.beginPath();g.moveTo(p.x,p.y-60);g.lineTo(p.x+30,p.y+10);g.lineTo(p.x,p.y+10);g.fill()}}
function vitIcon(k){return {thirst:['갈증','口渴'],hunger:['허기','饥饿'],temp:['체온','体温'],hp:['체력','体力']}[k]}
function seaHud(){const v=R.vit,r=R.res;if(ch2On()&&(isNight()||R.t>DUSK))drawCoast();rr(0,0,W,150,0,'#0b0f16e8');
 txt(L(R.day+'일째','第'+R.day+'天'),24,34,28,'#ffe2a0','left',false);const ph=inStorm()?L('폭풍','风暴'):isNight()?L('밤','夜晚'):R.t>DUSK?L('해질녘','黄昏'):L('낮','白天');txt(ph,150,34,22,inStorm()?'#ff9a7a':isNight()?'#9fb0ff':'#dfe6ee','left',false);
 rr(230,24,380,16,8,'#1a2230');rr(230,24,380*Math.min(1,R.t/DAY),16,8,isNight()?'#6070c0':'#e0b060');rr(230+380*NIGHT/DAY-1,20,3,24,1,'#9fb0ff');
 button(646,14,82,56,'II','dark',24,()=>{paused=true});
 const keys=['thirst','hunger','temp','hp'],cols={thirst:'#5fb4ff',hunger:'#e0a860',temp:'#ff9a5a',hp:'#7fe0a0'};
 keys.forEach((k,i)=>{const x=20+i*180,y=62;const can=vitCan(k);rr(x,y,168,70,12,'#151b26',can?'#8a7a4a':'#2c3646',2);if(can&&v[k]<45){g.save();g.globalAlpha=.45+.45*Math.sin(frame*6);rr(x,y,168,70,12,null,'#ffe27a',4);g.restore()}txt(LL(vitIcon(k))+(can?(k==='thirst'?L(' ▸마시기',' ▸喝'):k==='hunger'?L(' ▸먹기',' ▸吃'):L(' ▸치료',' ▸治疗')):''),x+12,y+22,can?15:17,can?'#ffe27a':'#dfe6ee','left',false);txt(Math.round(v[k])+'',x+156,y+22,18,v[k]<25?'#ff8a7a':'#fff','right',false);rr(x+12,y+42,144,14,7,'#0c1018');rr(x+12,y+42,144*v[k]/100,14,7,v[k]<25?'#ff6a5a':cols[k]);
  hotspot(x,y,168,70,()=>useVital(k),'vit_'+k)});
 // 다음 목표
 txt('▶ '+nextGoal(),24,172,18,'#ffe7a0','left');
 if(radioShow){const ls=wrap(LL(radioShow.l),18,640);g.save();g.globalAlpha=Math.min(1,radioShow.t);rr(20,194,710,22+ls.length*26,12,'#1a1430e8','#b08aff',2);ls.forEach((l,i)=>txt((i?'':'📻 ')+l,36,216+i*26,18,'#e8dcff','left',false));g.restore()}
 // 자원 줄
 rr(0,1060,W,274,0,'#0b0f16ee');const show=['plank','plastic','cloth','scrap','rope','water','can','fish','cooked','berry','med'];
 show.forEach((k,i)=>{const x=16+(i%6)*121,y=1076+Math.floor(i/6)*44;rr(x,y,113,38,9,'#161d28');if(!icon(ICON_OF[k],x+17,y+19,32))circ(x+16,y+19,7,RES_C[k]);txt(LL(RES_N[k]),x+28,y+19,13,'#b6c0cc','left',false);txt(''+(r[k]||0),x+106,y+19,16,(r[k]||0)>0?'#fff':'#5a6472','right',false)});
 const by=1180;button(16,by,226,84,L('짓기','建造'),'gold',28,()=>{sc='build';AudioFx.cue('ui')},{id:'btn_build'});
 const op=islandOpen();if(ch2On())button(254,by,240,84,L('항구 지도','港口地图'),'green',26,()=>{sc='hmap';AudioFx.cue('ui')},{id:'btn_map'});else button(254,by,240,84,op?(R.ch===11?L('항구 원정','港口远征'):L('섬에 상륙','登岛')):L('섬 없음','附近无岛'),op?(R.ch===11?'red':'green'):'gray',26,()=>{if(islandOpen())startLand();else message(R.day<Z().island?L('아직 섬이 보이지 않아요','还看不到岛'):R.landed>=R.day?L('오늘은 이미 다녀왔어요','今天已经去过了'):L('해가 지기 전엔 돌아올 수 없어요','天黑前回不来'),1.4)},{id:'btn_land'});
 button(506,by,228,84,L('보급·일지','补给·日志'),'blue',24,()=>{sc='reward';guideRet='sea'},{id:'btn_reward'});if(rewardBadge())circ(722,by+8,10,'#ff4a4a');
 txt('v'+BUILD,726,1316,12,'#3a4452','right',false);
 if(tutStep===0&&debris.length&&!guideTip&&!buildPick){const o=debris.find(o2=>o2.y>200&&o2.y<900);if(o)drawFinger(o.x,o.y+20)}}
function useVital(k){const r=R.res,v=R.vit;
 if(k==='thirst'){if(r.water>0&&v.thirst<95){r.water--;v.thirst=Math.min(100,v.thirst+35);mission('drink');heroDo('drink');AudioFx.cue('splash');return}message(r.water?L('목마르지 않아요','不渴'):L('마실 물이 없어요. 빗물 통·증류기를 탭하세요','没有水。点雨水桶或蒸馏器'),1.6);return}
 if(k==='hunger'){if(v.hunger>=95){message(L('배부르다','很饱'),1);return}const order=[['cooked',30,0],['can',35,0],['berry',15,0],['fish',12,8]];for(const [key,add,hurt] of order)if(r[key]>0){r[key]--;v.hunger=Math.min(100,v.hunger+add);heroDo('eat');if(hurt){v.hp-=hurt;message(L('날생선은 배탈이 날 수 있어요. 모닥불에 구워 먹자','生鱼会坏肚子，用篝火烤一下吧'),1.8)}AudioFx.cue('pick');return}
  message(L('먹을 것이 없어요. 낚시를 하거나 섬에 가 보세요','没有吃的，去钓鱼或者登岛'),1.6);return}
 if(k==='hp'){if(r.med>0&&v.hp<90){r.med--;v.hp=Math.min(100,v.hp+40);AudioFx.cue('win');return}message(L('치료약이 없거나 아직 괜찮아요','没有药或者还不需要'),1.4);return}
 if(k==='temp'){message(L('모닥불 가까이 서 있으면 몸이 녹아요','站在篝火旁就能暖和起来'),1.6)}}
function costTxt(k){const c2=costOf(k);return ' ('+Object.keys(c2).filter(r=>c2[r]>0).map(r=>LL(RES_N[r])+' '+c2[r]).join(LANG==='zh'?'·':'·')+')'}
function nextGoal(){if(stormDay()&&R.t<60&&!R.lashed&&R.ch>3)return L('폭풍 전에 밧줄로 배를 묶자','风暴来前用绳子加固船')+costTxt('lash');
 if(ch2On()){const q=CH2[R.q2];if(!q)return L('항구를 지키며 3장을 기다리자','守住港口，等待第三章');const pr=q.p();let t2=L('2장 ','第二章 ')+(R.q2+1)+'/'+CH2.length+' · '+LL(q.t)+(pr[1]>1?' ('+Math.min(pr[0],pr[1])+'/'+pr[1]+')':'');if(q.b)t2+=costTxt(q.b);if(R.q2===3&&R.hb.flow)t2+=L(' — 역류까지 ',' — 距回流 ')+Math.max(0,R.hb.flow-R.day)+L('일','天');return t2}
 const q=CH[R.ch],pr=q.p();let t2=L('목표 ','目标 ')+(R.ch+1)+'/'+CH.length+' · '+LL(q.t)+(pr[1]>1?' ('+Math.min(pr[0],pr[1])+'/'+pr[1]+')':'');
 if(q.b==='radio'&&!R.radioPart)return t2+L(' — 섬 오두막 상자에서 부품 찾기',' — 去岛上小屋的箱子里找零件');if(q.b)t2+=costTxt(q.b);
 if(R.ch===8)t2+=L(' — 구명보트가 떠내려오면 탭',' — 救生艇漂来时点击');if(R.ch===10)t2+=L(' — 섬에 상륙',' — 登岛');if(R.ch===11)t2+=L(' — [항구 원정]',' — [港口远征]');return t2}
function buildScreen(){g.fillStyle='rgba(5,8,14,.94)';g.fillRect(0,0,W,H);txt(L('짓기','建造'),375,70,38,'#ffe2a0','center');
 const show=['plank','plastic','cloth','scrap','rope'];show.forEach((k,i)=>{txt(LL(RES_N[k])+' '+(R.res[k]||0),75+i*150,120,17,RES_C[k],'center',false)});
 BUILD_LIST.forEach((k,i)=>{const M=MODS[k],y=150+i*104,ok=canPay(k);rr(30,y,690,94,14,ok?'#16202c':'#12161d',ok?M.col:'#2a3240',2);if(!icon(ICON_OF[k],74,y+46,70))rr(46,y+18,56,56,10,M.col,'#111',2);
  txt(LL(M.n),120,y+30,24,ok?'#fff':'#7a8494','left',false);txt(LL(M.d),120,y+66,16,'#9fb0c4','left',false);
  const c2=costOf(k);txt(Object.keys(c2).map(r=>LL(RES_N[r])+' '+c2[r]).join(' · ')+(M.need?' + '+L('부품','零件'):''),704,y+30,16,ok?'#ffe2a0':'#7a6a5a','right',false);
  hotspot(30,y,690,94,()=>chooseBuild(k),'build_'+k)});
 button(150,1200,450,84,L('◀ 닫기','◀ 关闭'),'gold',26,()=>{sc='sea'})}
function dayendScreen(){dayendT+=1/60;g.fillStyle='#0a0e16';g.fillRect(0,0,W,H);rr(50,120,650,900,20,'#f2ead8','#8a7a5a',4);
 txt(L('생존 일지','生存日志'),375,180,36,'#3a2e1e','center',false);txt(L(R.day+'일째 밤이 지나갔다','第'+R.day+'天的夜晚过去了'),375,240,24,'#5a4a32','center',false);
 const T2=R.today,lines=[L('건져 올린 물건 ','打捞的物品 ')+T2.debris,L('지은 것 ','建造 ')+T2.built,L('낚은 물고기 ','钓到的鱼 ')+T2.fish,L('잃은 것 ','损失 ')+T2.lost,L('갑판 ','甲板 ')+R.deck.length+L('칸','格')];
 if(R.surv.length)lines.push(L('동료 식사 ','伙伴吃饭 ')+(T2.fedN||0)+'/'+R.surv.length+((T2.hungryN||0)?L(' — 굶은 동료는 내일 쉬어요',' — 饿着的伙伴明天休息'):''));if(T2.spoil)lines.push(L('상해서 버린 날생선 ','变质丢弃的生鱼 ')+T2.spoil);lines.forEach((s,i)=>txt('· '+s,110,310+i*48,23,'#3a2e1e','left',false));
 const nd=R.day+1;const st=nd===Z().storm||(nd>Z().storm&&(nd-Z().storm)%4===0);txt(L('내일: ','明天：')+(st?L('오후 폭풍 예보','下午有风暴'):L('맑음','晴')),110,620,24,st?'#a03020':'#2a5a3a','left',false);
 para(L('"','"')+diaryLine()+L('"','"'),110,700,21,'#5a4a32',530);
 button(110,880,250,86,L('공유','分享'),'blue',24,shareGame);button(390,880,250,86,L('다음 날 ▶','下一天 ▶'),'gold',28,nextDay,{id:'btn_next'})}
function diaryLine(){const v=R.vit;if(v.hp<40)return L('몸이 버티지 못하고 있다. 내일은 먹고 마시는 것부터.','身体快撑不住了。明天先解决吃喝。');if(R.today.lost>1)return L('밤바다는 생각보다 가까이 있다. 불을 꺼뜨리면 안 된다.','夜里的海比想象的更近。火绝不能灭。');
 if(R.radioBuilt)return L('무전기 너머에서 사람 목소리를 들었다. 저 항구로 돌아가야 한다.','从电台里听到了人声。必须回到那个港口。');if(R.deck.length>=10)return L('배가 제법 커졌다. 이제는 집이라 불러도 될 것 같다.','船已经不小了，可以叫它家了。');return L('오늘도 살아남았다. 저 멀리 육지의 불 꺼진 도시가 보인다.','今天也活下来了。远处陆地上的城市一片漆黑。')}
function g1Screen(){g1T+=1/60;g.fillStyle='#0a0e16';g.fillRect(0,0,W,H);txt(L('3일 생존!','生存3天！'),375,260,56,'#ffcf6a','center');para(L('G1 프로토타입은 여기까지예요. 계속 플레이할 수 있어요.\n솔직한 느낌을 하나 골라 주세요.','G1原型到这里为止，你可以继续玩。\n请选择你真实的感受。'),375,360,22,'#dfe6ee',600,36,'center');
 const ops=[['more',L('내일 또 하고 싶다','明天还想玩'),'green'],['unsure',L('아직 잘 모르겠다','还说不好'),'blue'],['no',L('재미없다','没意思'),'red']];
 ops.forEach(([k,lab,st],i)=>button(150,560+i*120,450,92,lab,st,28,()=>{save.g1fb=k;track('g1_feedback',{v:k,zone:Z().k});persist();sc='sea';morningEvents(false);message(L('고마워요! 바다는 계속돼요','谢谢！大海还在继续'),2)}))}

// ================================================================ 섬 상륙
const LAND_H=1900;
function startLand(){const harbor=R.ch===11;R.landed=R.day;R.cnt.lands++;track('land_start',{day:R.day,harbor});mission('land');save.stats.lands++;if(harbor){startHarbor();return}let s=R.day*977+R.zone*131;const rnd=()=>{s=(s*16807)%2147483647;return (s%10000)/10000};
 const objs=[];for(let i=0;i<9;i++)objs.push({k:'tree',x:80+rnd()*590,y:420+rnd()*1050,hp:3});for(let i=0;i<5;i++)objs.push({k:'bush',x:80+rnd()*590,y:500+rnd()*1000,n:1});for(let i=0;i<4;i++)objs.push({k:'rock',x:80+rnd()*590,y:350+rnd()*900,n:2});
 const hx=180+rnd()*390,hy=520+rnd()*300;objs.push({k:'hut',x:hx,y:hy});if(R.ch===10&&R.surv.length===1)objs.push({k:'npc',x:hx+120,y:hy+70});for(let i=0;i<3;i++)objs.push({k:'crate',x:hx-60+i*60,y:hy+90,n:1,first:i===0});objs.push({k:'stream',x:375,y:250,n:3});
 const zs=[];for(let i=0;i<3;i++)zs.push({x:100+rnd()*550,y:300+rnd()*600,hp:3,a:0,hit:0,w:rnd()*6,hx:0,hy:0});zs.forEach(z=>{z.hx=z.x;z.hy=z.y});
 Land={p:{x:375,y:1760,tx:375,ty:1760,hit:0},objs,zs,carry:{},n:0,cap:R.sail?16:12,noise:0,target:null,work:0,atk:0,nightSpawn:false};sc='land';camY=LAND_H-H;
 tip('land',[['물건을 탭하면 가서 베고 줍고 열어요.','点击物体，走过去砍、捡、开。'],['소리를 내면(나무·바위) 감염체가 몰려와요. 소음 막대를 보세요.','砍树、敲石头会发出声音，丧尸会被吸引。注意噪音条。'],['해가 지기 전에 아래쪽 배를 탭해 돌아가요. 짐은 '+(R.sail?16:12)+'칸까지 실을 수 있어요.','天黑前点击下方的船返回。最多可带'+(R.sail?16:12)+'格。']])}
function landTick(dt){const Ld=Land,p=Ld.p,v=R.vit;R.t+=dt;const night=isNight();
 if(R.t>=DUSK&&R.t-dt<DUSK){message(L('해가 진다! 배로 돌아가자','太阳快落山了！回船上去'),2.2);AudioFx.cue('warn')}
 if(R.t>=DAY){backToSea(false);endDay();return}
 v.thirst-=.30*dt;v.hunger-=.22*dt;if(night)v.temp-=.3*Z().cold*dt;else if(v.temp<70)v.temp+=.1*dt;
 let bad=0;for(const k of ['thirst','hunger','temp'])if(v[k]<=0){v[k]=0;bad++}if(bad)v.hp-=.55*bad*dt;for(const k in v)v[k]=Math.max(0,Math.min(100,v[k]));
 if(night&&!Ld.nightSpawn){Ld.nightSpawn=true;for(let i=0;i<3;i++)Ld.zs.push({x:100+Math.random()*550,y:200+Math.random()*400,hp:3,a:1,hit:0,w:0,hx:375,hy:400})}
 Ld.noise=Math.max(0,Ld.noise-6*dt);moveTo(p,dt,230);Ld.atk-=dt;
 const T2=Ld.target;
 if(T2){if(T2.z){if(T2.z.hp<=0)Ld.target=null;else{p.tx=T2.z.x;p.ty=T2.z.y+30;if(Math.hypot(p.x-T2.z.x,p.y-T2.z.y)<70&&Ld.atk<=0){Ld.atk=.55;T2.z.hp-=R.items.knife?2:1;AudioFx.cue('hit');vib('light');shake(5,.15);const d=Math.hypot(T2.z.x-p.x,T2.z.y-p.y)||1;T2.z.x+=(T2.z.x-p.x)/d*40;T2.z.y+=(T2.z.y-p.y)/d*40;if(T2.z.hp<=0){Ld.target=null;fxText(T2.z.x,T2.z.y-30,L('쓰러뜨렸다','击倒'),'#ddd')}}}}
  else{const o=T2.o;if(Math.hypot(p.x-o.x,p.y-o.y)<62){Ld.work+=dt;if(Ld.work>=(o.k==='tree'?(R.items.knife?.35:.6):.5)){Ld.work=0;landAct(o)}}}}
 for(const z of Ld.zs){if(z.hp<=0)continue;const d=Math.hypot(p.x-z.x,p.y-z.y),sp=(night?150:100)*(z.run?1.4:1);if(Ld.noise>55||d<190||night)z.a=1;else if(d>500)z.a=0;
  if(z.a){const k=sp*dt/Math.max(1,d);z.x+=(p.x-z.x)*k;z.y+=(p.y-z.y)*k}else{z.w+=dt;z.x=z.hx+Math.sin(z.w*.7)*50;z.y=z.hy+Math.cos(z.w*.5)*30}
  z.hit-=dt;z.atkT=Math.max(0,(z.atkT||0)-dt);if(d<38&&z.hit<=0){z.hit=1;z.atkT=.5;v.hp-=12*(1-.25*R.surv.filter(s2=>s2.fed).length);AudioFx.cue('hurt');vib('medium');shake(10,.25)}}
 for(const z of Ld.zs)if(z.hp<=0)z.dead=(z.dead||0)+dt;Ld.zs=Ld.zs.filter(z=>z.hp>0||z.dead<1.6);
 if(v.hp<=0){fail('land');return}
 if(Math.hypot(p.x-375,p.y-1830)<70&&Ld.goBoat)backToSea(true);
 camY+=((p.y-H*.58)-camY)*Math.min(1,dt*5);camY=Math.max(0,Math.min(LAND_H-H+200,camY))}
function startHarbor(){let s=R.day*313+7;const rnd=()=>{s=(s*16807)%2147483647;return (s%10000)/10000};const objs=[{k:'light',x:375,y:330,n:3}];
 for(let i=0;i<7;i++)objs.push({k:'crate',x:230+rnd()*290,y:520+i*150+rnd()*60,n:1});
 const zs=[];for(let i=0;i<8;i++){const x=220+rnd()*310,y=420+i*130;zs.push({x,y,hx:x,hy:y,hp:3,a:0,hit:0,w:rnd()*6,run:i%3===2})}
 Land={type:'harbor',p:{x:375,y:1760,tx:375,ty:1760,hit:0},objs,zs,carry:{},n:0,cap:R.sail?16:12,noise:0,target:null,work:0,atk:0,nightSpawn:false,lit:false};sc='land';camY=LAND_H-H;
 popTip({head:L('동쪽 항구','东港'),lines:[['거리 끝, 가장 위쪽에 등대가 있어요. 발전기를 3번 돌려 불을 켜세요.','街道尽头、最上方就是灯塔。转动发电机3次点亮它。'],['발전기 소리는 아주 커요. 감염체가 몰려오니 불을 켜면 곧장 배로 돌아가세요.','发电机声音很大，会引来丧尸。点亮后立刻回船。'],['동료가 있으면 받는 피해가 줄어요.','有伙伴同行，受到的伤害会减少。']],t:0})}
function drawLight(o){const x=o.x,y=o.y,lit=o.lit;if(lit){g.save();g.globalCompositeOperation='lighter';drawGlow(x,y-150,260+Math.sin(frame*4)*20,'y',.8);g.translate(x,y-150);g.rotate(frame*.9);g.fillStyle='rgba(255,236,170,.22)';g.beginPath();g.moveTo(0,0);g.lineTo(520,-70);g.lineTo(520,70);g.fill();g.restore()}
 rr(x-62,y-10,124,44,8,'#6a6660','#2a2622',3);g.fillStyle='#ece6da';g.beginPath();g.moveTo(x-40,y-10);g.lineTo(x-26,y-130);g.lineTo(x+26,y-130);g.lineTo(x+40,y-10);g.closePath();g.fill();g.strokeStyle='#2a2622';g.lineWidth=3;g.stroke();
 g.fillStyle='#c0442e';g.fillRect(x-36,y-56,72,22);g.fillRect(x-30,y-108,60,20);rr(x-34,y-142,68,14,4,'#3a3632','#1a1816',2);rr(x-22,y-176,44,36,6,lit?'#ffe9a0':'#4a5058','#1a1816',3);g.fillStyle='#c0442e';g.beginPath();g.moveTo(x-28,y-176);g.lineTo(x,y-204);g.lineTo(x+28,y-176);g.fill();
 txt(lit?L('등대 (켜짐)','灯塔（已点亮）'):L('등대 발전기 ','灯塔发电机 ')+(3-o.n)+'/3',x,y+56,18,lit?'#ffe9a0':'#fff','center')}
function drawNpc(o){drawGlow(o.x,o.y-20,60,'y',.4);if(!sprite('surv1','idle',frame,o.x,o.y+6,84,-1,6))circ(o.x,o.y-14,16,'#6c6','#111',3);txt('!',o.x,o.y-86,26,'#ffe27a','center');txt(LL(SURV[1].n),o.x,o.y+26,15,'#fff','center')}
function landAct(o){if(o.k==='nest'){const Ld=Land;o.n--;Ld.noise=Math.min(100,Ld.noise+45);AudioFx.cue('fire');shake(6,.2);vib('light');for(const z of Ld.zs)if(Math.hypot(z.x-o.x,z.y-o.y)<520)z.a=1;
  if(o.big&&o.n>0&&o.n%2===0)for(let i=0;i<2;i++)Ld.zs.push({x:260+i*230,y:300,hx:375,hy:400,hp:3,a:1,hit:0,w:0,run:true});
  if(o.n<=0){o.gone=1;Ld.target=null;const d=R.hb.d[Ld.di];d.left=Math.max(0,d.left-1);fxText(o.x,o.y-50,L('둥지를 태웠다!','巢穴烧掉了！'),'#ffd9a0');AudioFx.cue('win');if(d.left<=0){Ld.clear=true;message(L('이 구역의 둥지를 모두 태웠다! 배로 돌아가자!','这一带的巢穴全烧光了！快回船上！'),3)}}return}
 if(o.k==='light'){const Ld=Land;o.n--;Ld.noise=100;AudioFx.cue('thunder');shake(8,.3);vib('medium');for(const z of Ld.zs)z.a=1;if(o.n<=0){o.lit=true;Ld.lit=true;Ld.target=null;AudioFx.cue('win');vib('long');message(L('등대에 불이 켜졌다! 배로 돌아가자!','灯塔亮了！快回船上！'),3)}return}
 if(o.k==='npc'){o.gone=1;Land.target=null;Land.npcGot=true;message(L('유나: "오두막에 숨은 지 나흘째였어요. 같이 가요."','柔娜："我在小屋里躲了四天。带我走吧。"'),3);AudioFx.cue('win');return}
 const Ld=Land;const add=(k,n)=>{n=Math.min(n,Ld.cap-Ld.n);if(n<=0){message(L('짐이 가득 찼어요. 배로 돌아가세요','装满了，回船上去吧'),1.6);Ld.target=null;return false}Ld.carry[k]=(Ld.carry[k]||0)+n;Ld.n+=n;fxText(o.x,o.y-40,LL(RES_N[k])+' +'+n,'#fff3c0');AudioFx.cue('pick');return true};
 if(o.k==='tree'){o.hp--;Ld.noise+=16;AudioFx.cue('chop');shake(4,.1);mission('chop');if(o.hp<=0){o.gone=1;add('plank',2);Ld.target=null}}
 else if(o.k==='bush'){if(add('berry',2)){o.gone=1}Ld.target=null}
 else if(o.k==='rock'){Ld.noise+=22;AudioFx.cue('chop');if(add('scrap',1)){o.n--;if(o.n<=0)o.gone=1}Ld.target=null}
 else if(o.k==='stream'){if(add('water',3)){o.n--;if(o.n<=0)o.gone=1}R.vit.thirst=Math.min(100,R.vit.thirst+20);Ld.target=null}
 else if(o.k==='crate'){let got;if(o.first&&!R.radioPart){R.radioPart=true;message(L('오두막에서 무전기 부품을 찾았다!','在小屋里找到了电台零件！'),2.2);got=null}else{const q=Math.random();got=q<.3?['cloth',2]:q<.55?['rope',2]:q<.75?['can',1]:q<.9?['med',1]:['plastic',2]}if(got)add(got[0],got[1]);o.gone=1;Ld.target=null}
 else Ld.target=null}
function landTap(x,y){const Ld=Land,wx=x,wy=y+camY;
 if(Math.hypot(wx-375,wy-1830)<110){Ld.goBoat=true;Ld.target=null;Ld.p.tx=375;Ld.p.ty=1830;return}
 for(const z of Ld.zs)if(z.hp>0&&Math.hypot(wx-z.x,wy-z.y)<50){Ld.target={z};Ld.goBoat=false;return}
 let best=null,bd=70;for(const o of Ld.objs)if(!o.gone&&o.k!=='hut'&&!o.lit){const d=Math.hypot(wx-o.x,wy-(o.k==='light'?o.y-60:o.y));if(d<(o.k==='light'?130:bd)){bd=Math.min(bd,d);best=o}}
 Ld.goBoat=false;if(best){Ld.target={o:best};Ld.work=0;Ld.p.tx=best.x;Ld.p.ty=best.y+40}else{Ld.target=null;Ld.p.tx=wx;Ld.p.ty=Math.max(160,wy)}}
function artLand(o){if(o.k==='tree'){wsp(o.hp<3?'tree_chop':'tree',o.x,o.y+30,150,'bottom');if(o.hp<3)txt(o.hp+'',o.x+44,o.y-80,18,'#fff','center');return true}
 if(o.k==='bush')return wsp('bush',o.x,o.y+20,100,'bottom');if(o.k==='rock')return wsp('rock',o.x,o.y+24,110,'bottom');
 if(o.k==='hut'){wsp('hut',o.x,o.y+70,280,'bottom');return true}if(o.k==='crate'){drawGlow(o.x,o.y,34,'y',.35);return icon('crate',o.x,o.y,50)}
 if(o.k==='stream'){for(let x=0;x<W;x+=148)wspPart('stream',0,0,1,1,x,o.y-74,150,150);txt(L('개울 (물 뜨기)','小溪（打水）'),o.x,o.y,18,'#e8f4ff','center');return true}return false}
function backToSea(ok){const Ld=Land;const rc=ok&&Ld.clear?Ld.di:-1;if(rc>=0)setTimeout(()=>{if(R&&!R.hb.d[rc].s)reclaim(rc)},300);R.pend=null;if(ok&&Ld.lit)R.lit=true;const npc=ok&&Ld.npcGot;if(npc)setTimeout(()=>{if(R)addSurvivor(1)},400);if(ok){for(const k in Ld.carry)R.res[k]=(R.res[k]||0)+Ld.carry[k];track('land_back',{n:Ld.n,t:Math.round(R.t)});message(L('배로 돌아왔다. 짐 ','回到船上。带回 ')+Ld.n+L('개를 실었다',' 件物资'),1.8)}Land=null;if(sc==='land'){enterSea()}}
function drawLand(){const Ld=Land,p=Ld.p,night=isNight();g.fillStyle='#24301f';g.fillRect(0,0,W,H);g.save();g.translate(0,-camY);
 g.fillStyle='#1e6a78';g.fillRect(0,LAND_H-120,W,300);g.fillStyle='#8a7a5a';g.fillRect(0,LAND_H-200,W,90);
 if(Ld.type==='harbor'){g.fillStyle='#3a3a3a';g.fillRect(0,0,W,LAND_H-200);if(imgs.world){const y0=Math.max(0,Math.floor(camY/158)*158),y1=Math.min(LAND_H-200,camY+H);for(let y=y0;y<y1;y+=158){wspPart('asphalt',0,0,1,1,215,y,160,160);wspPart('asphalt',0,0,1,1,375,y,160,160)}
   for(let i=0;i<10;i++){const y=470+i*150;if(y<camY-300||y>camY+H+300)continue;wsp(['building','building3','building2'][i%3],92,y,170,'bottom');wsp(['building2','building','building3'][i%3],660,y+50,170,'bottom')}
   for(let i=0;i<4;i++){const y=760+i*300;wsp(i%2?'car2':'car',i%2?300:455,y,160,'bottom')}for(let x=0;x<W;x+=150)wspPart('beach',0,0,1,1,x,LAND_H-260,152,200)}}
 else if(imgs.world){g.fillStyle='#4f7a2c';g.fillRect(0,0,W,LAND_H-200);if(imgs.tile_grass){const y0=Math.max(0,Math.floor(camY/256)*256),y1=Math.min(LAND_H-200,camY+H);for(let y=y0;y<y1;y+=256)for(let x=0;x<W;x+=256)g.drawImage(imgs.tile_grass,x,y,257,Math.min(257,LAND_H-200-y))}for(let x=0;x<W;x+=150)wspPart('beach',0,0,1,1,x,LAND_H-260,152,200)}
 if(!wsp('boat',375,1846,190))rr(330,1800,90,60,12,'#7a5c3e','#2a1e14',3);txt(L('배','船'),375,1800,18,'#fff','center');if(R.t>DUSK)drawGlow(375,1830,90,'y',.5+.2*Math.sin(frame*5));
 const objs2=Ld.objs.slice().sort((a,b)=>(a.k==='stream'?-1e4:a.y)-(b.k==='stream'?-1e4:b.y));for(const o of objs2){if(o.gone){if(o.k==='tree')wsp('stump',o.x,o.y+24,96,'bottom');continue}if(o.k==='light'){drawLight(o);continue}if(o.k==='nest'){drawNest(o);continue}if(o.k==='npc'){drawNpc(o);continue}if(imgs.world&&artLand(o))continue;if(o.k==='tree'){circ(o.x,o.y+16,22,'#3a2a1a');circ(o.x,o.y-10,34,'#2e4a2a','#1a2a18',3);if(o.hp<3)txt(o.hp+'',o.x,o.y-10,18,'#fff','center')}
  else if(o.k==='bush'){circ(o.x,o.y,22,'#3a5a30');circ(o.x-6,o.y-4,4,'#e0607a');circ(o.x+7,o.y+3,4,'#e0607a')}
  else if(o.k==='rock')circ(o.x,o.y,26,'#6a6e74','#3a3c40',3);
  else if(o.k==='hut'){rr(o.x-90,o.y-60,180,120,8,'#4a3a2a','#2a2016',3);txt(L('오두막','小屋'),o.x,o.y,18,'#d8c8a8','center')}
  else if(o.k==='crate'){rr(o.x-18,o.y-18,36,36,4,'#a07850','#3a2414',3);drawGlow(o.x,o.y,30,'y',.3)}
  else if(o.k==='stream'){g.fillStyle='#3a7aa0';g.fillRect(0,o.y-30,W,60);txt(L('개울 (물 뜨기)','小溪（打水）'),o.x,o.y,18,'#e8f4ff','center')}}
 for(const z of Ld.zs)drawInfected(z)
 drawHero(p,Ld.target&&Ld.work>0?(Ld.target.o&&Ld.target.o.k==='tree'||Ld.target.o&&Ld.target.o.k==='rock'?'attack':'gather'):Ld.target&&Ld.target.z&&Ld.atk>.3?'attack':null,96);drawFx(0);g.restore();
 if(night||R.t>DUSK){g.fillStyle=`rgba(2,6,14,${night?.6:(R.t-DUSK)/(NIGHT-DUSK)*.45})`;g.fillRect(0,0,W,H)}
 // HUD
 rr(0,0,W,128,0,'#0b0f16e8');txt(Ld.type==='harbor'?L(R.day+'일째 · 항구','第'+R.day+'天 · 港口'):L(R.day+'일째 · 섬','第'+R.day+'天 · 岛'),24,32,24,'#ffe2a0','left',false);rr(240,24,370,16,8,'#1a2230');rr(240,24,370*Math.min(1,R.t/DAY),16,8,R.t>DUSK?'#c06040':'#e0b060');rr(240+370*DUSK/DAY-1,20,3,24,1,'#ff9a7a');
 button(646,12,82,56,'II','dark',24,()=>{paused=true});const v=R.vit;['thirst','hunger','temp','hp'].forEach((k,i)=>{const x=20+i*150;txt(LL(vitIcon(k))+' '+Math.round(v[k]),x,80,17,v[k]<25?'#ff8a7a':'#dfe6ee','left',false)});
 txt(L('짐 ','负重 ')+Ld.n+'/'+Ld.cap,620,80,18,'#ffe7a0','left',false);rr(20,104,300,12,6,'#1a2230');rr(20,104,300*Math.min(1,Ld.noise/100),12,6,Ld.noise>55?'#ff6a5a':'#8a94a4');txt(L('소음','噪音'),330,110,14,'#9fb0c4','left',false);
 button(430,1220,300,86,L('배로 돌아가기','回船上'),R.t>DUSK?'gold':'dark',24,()=>{Ld.goBoat=true;Ld.target=null;Ld.p.tx=375;Ld.p.ty=1830},{id:'btn_boat'})}

// ================================================================ 쓰러짐 · 부활
function fail(where){failInfo={where,t:0};sc='fail';track('fail',{where,day:R?R.day:0});AudioFx.cue('hurt');vib('long')}
function failScreen(){failInfo.t+=1/60;g.fillStyle='rgba(6,8,12,.96)';g.fillRect(0,0,W,H);const w=failInfo.where;
 txt(L('쓰러졌다…','倒下了……'),375,360,52,'#ff9a8a','center');para(w==='act1'?L('도시를 빠져나가지 못했다.','没能逃出城市。'):w==='land'?L('섬에서 정신을 잃었다.','在岛上失去了意识。'):L('배 위에서 기력이 다했다.','在船上耗尽了力气。'),375,440,24,'#dfe6ee',600,36,'center');
 const hint=w==='act1'?L('불길보다 먼저, 감염체를 피해 크게 돌아가세요','比火更快，绕开丧尸'):w==='land'?L('소음 막대가 빨개지기 전에 멈추세요','噪音条变红前停下来'):lowHint();txt('💡 '+hint,375,520,19,'#ffe7a0','center',false);
 button(130,640,490,96,L('구조 신호탄 (광고) — 그 자리에서 일어나기','信号弹（广告）— 原地站起'),'green',20,()=>showAd('revive',revive),{id:'btn_revive'});
 button(130,770,490,96,w==='act1'?L('처음부터 다시 탈출','重新逃离'):L('다음 날 아침 깨어나기 (물건 일부 잃음)','第二天早上醒来（损失部分物资）'),'gray',21,giveUp,{id:'btn_giveup'})}
function lowHint(){const v=R.vit;return v.thirst<=0?L('물: 빗물 통과 증류기를 먼저 지으세요','水：先造雨水桶和蒸馏器'):v.temp<=0?L('체온: 밤에는 모닥불 옆에 서 있으세요','体温：夜里站在篝火旁'):L('허기: 낚싯대와 모닥불로 생선을 구우세요','饥饿：用钓竿和篝火烤鱼')}
function revive(){const w=failInfo.where;track('revive',{where:w});if(w==='act1'){A.p.hp=60;A.front=Math.max(A.front,A.p.y+420);sc='act1';return}
 const v=R.vit;v.hp=60;for(const k of ['thirst','hunger','temp'])v[k]=Math.max(v[k],45);sc=w==='land'?'land':'sea'}
function giveUp(){const w=failInfo.where;if(w==='act1'){startAct1();return}track('pass_out',{where:w});if(w==='land'){Land=null}
 for(const k in R.res)R.res[k]=Math.floor(R.res[k]*.7);const v=R.vit;v.hp=45;v.thirst=Math.max(v.thirst,40);v.hunger=Math.max(v.hunger,40);v.temp=Math.max(v.temp,50);endDay()}

// ================================================================ 타이틀 · 설정 · 안내 · 보상 · 개인정보
function loadingScreen(){loadT+=1/60;g.fillStyle='#071016';g.fillRect(0,0,W,H);const tot=Math.max(1,IMG_LIST.length),done=IMG_LIST.filter(n=>imgs[n]).length,mustOk=MUST.every(n=>imgs[n]||imgFail[n]);
 txt('RECLAIM',375,560,84,'#ffcf6a','center');rr(165,700,420,18,9,'#1a1e28','#3a4250',2);rr(167,702,416*(IMG_LIST.length?done/tot:Math.min(1,loadT/.6)),14,7,'#ffb84a');
 txt(L('불러오는 중…','加载中…'),375,760,20,'#c9d2de','center',false);if(loadT>6&&!mustOk)txt(L('인터넷이 느려 시간이 걸리고 있어요','网络较慢，请稍候'),375,800,17,'#ffcf7a','center',false);
 if((mustOk&&loadT>.6)||loadT>25){sc='title';if(MUST.some(n=>imgFail[n]))message(L('일부 그림을 못 불러왔어요. 새로고침해 주세요','部分图片加载失败，请刷新'),4)}}
function title(){g.fillStyle='#071016';g.fillRect(0,0,W,H);if(imgs.title){g.drawImage(imgs.title,0,0,W,H);const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'rgba(4,10,18,.78)');gr.addColorStop(.32,'rgba(4,10,18,.15)');gr.addColorStop(.58,'rgba(4,10,18,.1)');gr.addColorStop(1,'rgba(4,10,18,.88)');g.fillStyle=gr;g.fillRect(0,0,W,H)}else{g.strokeStyle='rgba(120,180,200,.08)';g.lineWidth=2;for(let i=0;i<24;i++){const y=600+i*30;g.beginPath();for(let x=0;x<=W;x+=30)g.lineTo(x,y+Math.sin(x*.02+frame+i)*4);g.stroke()}
 g.fillStyle='#14181c';g.fillRect(0,520,W,40);for(let i=0;i<12;i++)rr(20+i*62,450-((i*37)%60),48,80+((i*37)%60),2,'#101418');// 불 꺼진 해안 도시
 drawGlow(560,700,60,'o',.6+.1*Math.sin(frame*6));rr(530,690,60,26,6,'#5a4030')}// 배의 불빛
 txt('RECLAIM',375,120,92,'#ffcf6a','center');txt(L('돌아온 땅','重归之地'),375,196,38,'#fff','center');txt(L('탈출하고, 버티고, 돌아가 되찾아라','逃离，坚持，然后夺回'),375,242,21,'#e6ecf2','center');
 const cont=!!save.run;button(150,820,450,96,cont?L('이어서 버티기 ('+save.run.day+'일째)','继续（第'+save.run.day+'天）'):L('탈출 시작','开始逃离'),'gold',30,()=>{AudioFx.init();if(save.run){R=save.run;Land=null;enterSea()}else startAct1()},{id:'btn_start'});
 if(cont)button(150,930,450,70,L('새로 시작 (1막부터)','重新开始（从第一幕）'),'gray',20,()=>{if(resetArm>0){save.run=null;R=null;persist();resetArm=0;startAct1()}else{resetArm=2.5;message(L('한 번 더 누르면 지금 배를 버리고 새로 시작해요','再按一次将放弃当前的船重新开始'),2)}});
 button(150,1020,140,70,L('설정','设置'),'dark',20,()=>{sc='settings';guideRet='title'});button(305,1020,140,70,L('안내서','指南'),'dark',20,()=>{sc='guide';guidePage=0;guideRet='title'});button(460,1020,140,70,L('보상','奖励'),'dark',20,()=>{sc='reward';guideRet='title'});if(rewardBadge())circ(596,1024,10,'#ff4a4a');
 if(LANG==='zh'){const hl=['抵制不良游戏，拒绝盗版游戏。','注意自我保护，谨防受骗上当。','适度游戏益脑，沉迷游戏伤身。','合理安排时间，享受健康生活。'];txt('健康游戏忠告',375,1150,18,'#c9d2de','center',false);hl.forEach((s,i)=>txt(s,375,1180+i*26,16,'#8a94a4','center',false))}
 txt('G1 prototype · v'+BUILD,375,1314,14,'#4a5462','center',false)}
function onoff(b){return b?L('켬','开'):L('끔','关')}
function settingsScreen(){g.fillStyle='#0d111b';g.fillRect(0,0,W,H);txt(L('설정','设置'),375,140,40,'#ffe2a0','center');
 button(130,210,490,76,L('화질: ','画质：')+(qualityLow?L('절약','省电'):L('높음','高')),'gray',24,()=>{qualityLow=!qualityLow;qualityManual=true;persist()});
 button(130,306,240,76,L('배경음악: ','音乐：')+onoff(Music.on),'gray',22,()=>{Music.toggle();save.music=Music.on;persist()});button(380,306,240,76,L('효과음: ','音效：')+onoff(AudioFx.enabled),'gray',22,()=>{AudioFx.enabled=!AudioFx.enabled;save.sfx=AudioFx.enabled;persist()});
 button(130,402,240,76,L('흔들림: ','晃动：')+onoff(!shakeReduced),'gray',22,()=>{shakeReduced=!shakeReduced;persist()});button(380,402,240,76,L('진동: ','振动：')+onoff(save.vib!==false),'gray',22,()=>{save.vib=save.vib===false;persist()});
 button(130,498,490,76,LANG==='zh'?'语言：简体中文':'언어: 한국어','gray',24,toggleLang,{id:'btn_lang'});
 button(130,594,490,76,L('순화 연출: ','温和画面：')+onoff(save.mild),'gray',22,()=>{save.mild=!save.mild;persist()});
 button(130,690,490,76,L('개인정보 처리방침','隐私政策'),'blue',22,()=>{sc='privacy'});
 button(130,800,490,76,L('진행 초기화','重置进度'),'red',22,()=>{if(resetArm>0){const keep={lang:save.lang};for(const k in save)if(k!=='lang')delete save[k];Object.assign(save,{tips:{},daily:null,att:{last:'',streak:0},adBox:null,bank:{},run:null,stats:{days:0,debris:0,lands:0,best:0,runs:0},g1fb:null,statc:{},vib:true,mild:LANG==='zh'||!!API},keep);R=null;persist();resetArm=0;message(L('초기화했어요','已重置'),1.5)}else resetArm=3});
 if(resetArm>0)txt(L('한 번 더 누르면 모든 진행이 지워져요','再按一次将清除所有进度'),375,900,17,'#ff9a8a','center',false);
 button(150,1180,450,80,L('◀ 돌아가기','◀ 返回'),'gold',26,()=>{sc=guideRet==='sea'&&R?'sea':guideRet==='title'?'title':'title'})}
function privacyScreen(){g.fillStyle='#0d111b';g.fillRect(0,0,W,H);txt(L('개인정보 처리방침','隐私政策'),375,110,34,'#ffe2a0','center');rr(40,160,670,980,16,'#141a28','#2e3646',2);
 para(L('1. 이 게임은 회원가입이 없으며, 개발자는 이름·전화번호·위치 같은 개인정보를 수집하지 않아요.\n\n2. 게임 진행 기록(일차, 배, 자원, 설정)은 이 기기 안에만 저장돼요. 게임을 지우거나 저장 공간을 비우면 함께 지워져요.\n\n3. 보상형 광고는 토스·위챗·더우인 플랫폼이 제공해요. 광고를 보여 주기 위해 플랫폼이 기기 정보를 처리할 수 있으며, 이는 각 플랫폼의 개인정보 정책을 따라요.\n\n4. 게임 개선을 위해 판 시작·종료, 광고 시청 같은 익명 통계를 플랫폼 통계 기능으로 모아요. 개인을 알아볼 수 있는 정보는 포함하지 않아요.\n\n5. 공유는 사용자가 직접 누를 때만 사용돼요.\n\n6. 문의: 게임 소개 화면의 개발자 연락처로 보내 주세요.',
  '1. 本游戏无需注册，开发者不收集姓名、手机号、位置等个人信息。\n\n2. 游戏进度（天数、船、资源、设置）仅保存在本设备中，删除游戏或清除缓存后将一并删除。\n\n3. 激励视频广告由小游戏平台提供。为展示广告，平台可能处理设备信息，相关处理遵循各平台的隐私政策。\n\n4. 为改进游戏，我们通过平台统计功能汇总开始/结束、广告观看等匿名数据，不包含可识别个人身份的信息。\n\n5. 分享功能仅在用户主动点击时使用。\n\n6. 联系方式：请通过游戏资料页中的开发者联系方式与我们联系。'),70,210,19,'#d8e0ea',610,32);
 button(150,1180,450,80,L('◀ 돌아가기','◀ 返回'),'gold',26,()=>{sc='settings'})}
const GUIDE=[{t:['한눈에 보기','一图看懂'],draw:()=>{const bx=[['1막 몰락','第一幕 沦陷',['도시 탈출','逃离城市']],['2막 표류','第二幕 漂流',['배 키우기','把船养大']],['3막 귀환','第三幕 归来',['항구 되찾기','夺回港口']]];
  bx.forEach((b,i)=>{const y=260+i*230;rr(140,y,470,160,16,i===1?'#1d3a46':'#161d28',i===2?'#ffcf6a':'#4a5a6a',3);txt(LANG==='zh'?b[1]:b[0],375,y+56,30,'#fff','center');txt(LL(b[2]),375,y+108,22,'#c9d2de','center',false);if(i<2){g.strokeStyle='#8a94a4';g.lineWidth=4;g.beginPath();g.moveTo(375,y+166);g.lineTo(375,y+222);g.stroke();txt('▼',375,y+214,20,'#8a94a4','center',false)}});
  para(L('규칙은 하나: 감염체는 물을 건너지 못한다. 바다는 안전하고, 육지는 되찾을 땅이에요. (G1은 1·2막까지)','规则只有一条：丧尸过不了水。海上安全，陆地需要夺回。（G1只有第一、二幕）'),375,980,21,'#ffe7a0',600,34,'center')}},
 {t:['몸 상태','身体状态'],lines:[['갈증: 빗물 통·증류기를 탭하거나, 위쪽 갈증 칸을 탭해 물을 마셔요.','口渴：点雨水桶、蒸馏器，或点上方口渴栏喝水。'],['허기: 낚시한 생선을 모닥불에 구워 먹어요. 날생선은 배탈이 나고, 밤이 지나면 상해요.','饥饿：把钓到的鱼放在篝火上烤着吃。生鱼会坏肚子，过夜就会变质。'],['체온: 밤과 폭풍에 떨어져요. 불 옆에 서 있으면 올라가요.','体温：夜晚和风暴时下降，站在火旁会回升。'],['하나라도 0이 되면 체력이 줄어요.','任何一项降到0，体力就会下降。']]},
 {t:['배 짓기','造船'],lines:[['떠내려오는 물건을 탭하면 갈고리로 끌어와요. 멀면 배 가장자리로 가세요.','点击漂来的物品用钩子拉回来。太远就走到船边。'],['[짓기]에서 고르고, 빛나는 칸을 탭해 놓아요.','在[建造]里选择，再点发光的格子放置。'],['순서 추천: 빗물 통 → 모닥불 → 낚싯대 → 갑판 넓히기.','推荐顺序：雨水桶→篝火→钓竿→扩建甲板。']]},
 {t:['밤과 폭풍','夜晚与风暴'],lines:[['밤에 불이 꺼져 있으면 어둠 속의 무언가가 배를 들이받아 물건을 빼앗아 가요.','夜里没有火光，黑暗中的东西会撞船抢走物资。'],['폭풍 전날 무전으로 예보가 와요. 갈매기가 사라지면 곧 와요.','风暴前一天电台会预报。海鸥消失就快来了。'],['밧줄로 배를 묶으면 피해가 절반. 금 간 칸은 탭해서 판자로 고쳐요.','用绳子加固伤害减半。裂开的格子点一下用木板修补。']]}];
function guideScreen(){g.fillStyle='#0d111b';g.fillRect(0,0,W,H);const P=GUIDE[guidePage];txt(L('안내서','指南')+' '+(guidePage+1)+'/'+GUIDE.length,375,90,24,'#9fb0c4','center',false);txt(LL(P.t),375,160,40,'#ffe2a0','center');
 if(P.draw)P.draw();else{let y=270;for(const l of P.lines){const n=para('· '+LL(l),70,y,23,'#e6ecf2',610,38);y+=n*38+34}}
 button(40,1180,200,80,'◀','gray',30,()=>{guidePage=(guidePage+GUIDE.length-1)%GUIDE.length});button(510,1180,200,80,'▶','gray',30,()=>{guidePage=(guidePage+1)%GUIDE.length});
 button(260,1180,230,80,L('닫기','关闭'),'gold',26,()=>{sc=guideRet==='sea'&&R?'sea':'title'});track('guide_open',{p:guidePage})}
function rewardScreen(){dailyInit();g.fillStyle='#0d111b';g.fillRect(0,0,W,H);txt(L('보상','奖励'),40,60,34,'#ffe2a0');
 rr(24,100,702,200,16,'#161c2a','#c69a5a',2);txt(L('7일 출석','7日签到'),44,128,22,'#ffe2a0');const can=attCan(),day=save.att.streak%7;
 ATT.forEach((r,k)=>{const x=36+k*98,y=150,cur=k===day&&can;rr(x,y,88,96,10,cur?'#2f5a3a':k<day?'#1d2a22':'#1a1e28',cur?'#9fffbf':'#3a4250',2);txt((k+1)+L('일','天'),x+44,y+18,14,'#c9d2de','center',false);Object.keys(r).slice(0,2).forEach((kk,j)=>txt(LL(RES_N[kk])+' '+r[kk],x+44,y+46+j*24,13,RES_C[kk],'center',false));if(k<day)txt('✔',x+74,y+18,16,'#9fffbf','center',false)});
 button(470,254,236,38,can?L('출석 보상 받기','领取签到'):L('내일 다시','明天再来'),can?'green':'gray',16,()=>{if(!attCan())return;const r=ATT[save.att.streak%7];save.att.streak++;save.att.last=todayKey();give(r,L('출석','签到'))},{id:'btn_att'});
 rr(24,316,702,310,16,'#161c2a','#2e3646',2);txt(L('일일 미션','每日任务'),44,344,22,'#ffe2a0');
 save.daily.m.forEach((m,k)=>{const M=MISSIONS[m.i],y=368+k*84,done=m.p>=M.goal;rr(40,y,670,74,12,'#121722','#2e3646',1);txt(LL(M.name),60,y+24,18,'#f0eff7','left',false);rr(60,y+46,300,12,6,'#1a1e28');rr(60,y+46,300*m.p/M.goal,12,6,done?'#4fd38c':'#d08a20');txt(m.p+' / '+M.goal,370,y+52,14,'#c9d2de','left',false);
  txt(Object.keys(M.r).map(kk=>LL(RES_N[kk])+'+'+M.r[kk]).join(' '),470,y+52,14,'#ffe2a0','left',false);
  if(m.c)txt(L('완료','已领'),650,y+24,17,'#7a8698','center');else button(590,y+8,110,40,L('받기','领取'),done?'green':'gray',17,()=>{if(m.p>=M.goal&&!m.c){m.c=true;give(M.r,L('미션','任务'))}})});
 rr(24,642,702,230,16,'#161c2a','#2e3646',2);txt(L('보급 낙하 (하루 3번)','空投补给（每天3次）'),44,670,22,'#ffe2a0');para(L('광고를 보면 보급 상자가 떨어져요: 판자 3 · 플라스틱 2 · 통조림 1','看广告获得空投：木板3·塑料2·罐头1'),44,712,18,'#c9d2de',650);
 const left=adBoxLeft();button(44,770,662,80,left>0?L('보급 받기 (광고) · 남은 횟수 ','领取空投（广告）· 剩余 ')+left:L('오늘은 끝났어요','今天已领完'),left>0?'green':'gray',22,()=>{if(adBoxLeft()<=0)return;showAd('supply',()=>{save.adBox.n++;give({plank:3,plastic:2,can:1},L('보급 낙하','空投'))})},{id:'btn_supply'});
 rr(24,888,702,250,16,'#161c2a','#2e3646',2);txt(L('기록','记录'),44,916,22,'#ffe2a0');const s=save.stats;[[L('가장 오래 버틴 날','最长坚持'),s.best+L('일','天')],[L('누적 생존 일수','累计天数'),s.days],[L('건진 물건','打捞物品'),s.debris],[L('섬 상륙','登岛次数'),s.lands]].forEach(([a,b],i)=>{txt(a,60,960+i*40,19,'#c9d2de','left',false);txt(''+b,690,960+i*40,19,'#fff','right',false)});
 button(150,1180,450,80,L('◀ 돌아가기','◀ 返回'),'gold',26,()=>{sc=guideRet==='sea'&&R?'sea':'title'})}
function toggleLang(){LANG=LANG==='zh'?'ko':'zh';persist();AudioFx.cue('ui')}
function drawGuideTip(){guideTip.t+=1/60;const ls=guideTip.lines.map(l=>LL(l));let tot=0;const wr=ls.map(l=>{const w=wrap(l,21,560);tot+=w.length;return w});g.fillStyle='rgba(4,6,12,.72)';g.fillRect(0,0,W,H);const h=150+tot*34+(ls.length-1)*14,y0=600-h/2;
 rr(50,y0,650,h,18,'#141a28f6','#ffcf6a',3);txt(guideTip.head?'★ '+guideTip.head:'💡 '+L('안내','提示'),90,y0+46,26,'#ffe2a0');let y=y0+96;wr.forEach(w=>{w.forEach(l=>{txt(l,90,y,21,'#e6ecf2','left',false);y+=34});y+=14});
 txt(L('화면을 탭하면 닫혀요','点击屏幕关闭'),375,y0+h-26,16,'#8a94a4','center',false)}
let tipQ=[];function popTip(t){if(guideTip)tipQ.push(t);else guideTip=t}
function tip(id,lines){if(save.tips[id])return false;save.tips[id]=1;persist();popTip({lines,t:0});return true}
function pauseOverlay(){g.fillStyle='rgba(4,6,12,.85)';g.fillRect(0,0,W,H);txt(L('일시정지','暂停'),375,330,44,'#ffe2a0','center');
 button(150,420,450,90,L('계속하기','继续'),'gold',28,()=>{paused=false},{id:'btn_resume'});button(150,530,450,80,L('안내서','指南'),'blue',24,()=>{paused=false;guideRet=sc==='sea'?'sea':'title';if(sc==='sea'){sc='guide';guidePage=0}else{message(L('안내서는 바다 또는 타이틀에서 볼 수 있어요','在海上或标题画面查看指南'),1.6)}});
 button(150,630,450,80,L('설정','设置'),'blue',24,()=>{paused=false;if(sc==='sea'){guideRet='sea';sc='settings'}else message(L('설정은 바다 또는 타이틀에서 열 수 있어요','在海上或标题画面打开设置'),1.6)});
 button(150,730,450,80,L('타이틀로 (저장됨)','回到标题（已保存）'),'gray',22,()=>{paused=false;if(sc==='land'){backToSea(true)}persist();sc='title'})}

// ================================================================ 입력
function touch(x,y){AudioFx.init();Music.kick();
 if(adShow)return;if(guideTip){if(guideTip.t>.3)guideTip=tipQ.shift()||null;return}
 for(let i=btns.length-1;i>=0;i--){const b=btns[i];if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h){AudioFx.cue('ui');b.fn();return}}
 if(paused)return;
 if(sc==='act1'&&!A.board)act1Tap(x,y);else if(sc==='sea')seaTap(x,y);else if(sc==='land')landTap(x,y)}
function coords(px,py){if(API){const k=c.width/(info.windowWidth||375);return [(px*k-view.ox)/view.s,(py*k-view.oy)/view.s]}const r=c.getBoundingClientRect();return [(px-r.left)/r.width*W,(py-r.top)/r.height*H]}
// 떠다니는 조이스틱: 화면 어디서든 누른 채 끌면 그 방향으로 움직이고, 짧게 탭하면 기존처럼 탭 동작
let joy=null;
function canJoy(){if(paused||guideTip||adShow)return false;const y=joy.sy;if(y<130)return false;if(sc==='act1')return !A.board&&y<1140;if(sc==='land')return y<1210;if(sc==='sea')return !buildPick&&!sleeping&&y>180&&y<1060;return false}
function joyStart(x,y){joy={sx:x,sy:y,x,y,on:false,t:0}}
function joyMove(x,y){if(!joy)return;joy.x=x;joy.y=y;if(!joy.on&&Math.hypot(x-joy.sx,y-joy.sy)>20&&canJoy()){joy.on=true;AudioFx.init();Music.kick();track('joystick',{sc})}}
function joyEnd(x,y){const j=joy;joy=null;if(!j||!j.on)touch(x,y)}
function joyTick(dt){if(!joy||!joy.on)return;if(!canJoy()){joy.on=false;return}const dx=joy.x-joy.sx,dy=joy.y-joy.sy,d=Math.hypot(dx,dy);if(d<6)return;const ux=dx/d,uy=dy/d,mag=Math.min(1,d/70);
 if(sc==='act1'){const p=A.p;A.target=null;p.tx=p.x+ux*60*mag;p.ty=p.y+uy*60*mag;tutStep=1}
 else if(sc==='land'){const p=Land.p;Land.target=null;Land.goBoat=false;p.tx=p.x+ux*60*mag;p.ty=Math.max(160,p.y+uy*60*mag);if(Math.hypot(p.x-375,p.y-1830)<70)Land.goBoat=true}
 else if(sc==='sea'){act=null;fishing=null;const sp=240*mag*dt;const tryMove=(nx,ny)=>{const cl=cellAt(nx,ny);if(cl&&tileAt(cl.x,cl.y)){seaP.x=nx;seaP.y=ny;R.p.gx=cl.x;R.p.gy=cl.y;return true}return false};
  if(!tryMove(seaP.x+ux*sp,seaP.y+uy*sp)){tryMove(seaP.x+ux*sp,seaP.y)||tryMove(seaP.x,seaP.y+uy*sp)}seaP.tx=seaP.x;seaP.ty=seaP.y}}
function drawJoy(){if(!joy||!joy.on)return;const dx=joy.x-joy.sx,dy=joy.y-joy.sy,d=Math.hypot(dx,dy),k=d>70?70/d:1;g.save();g.globalAlpha=.55;circ(joy.sx,joy.sy,72,'rgba(10,14,20,.35)','rgba(255,230,170,.7)',3);circ(joy.sx+dx*k,joy.sy+dy*k,30,'rgba(255,214,140,.8)','#3a2a10',3);g.restore()}
if(API){const pt=e=>{const p=(e.changedTouches||e.touches||[])[0];return p?coords(p.clientX,p.clientY):null};
 API.onTouchStart&&API.onTouchStart(e=>{const q=pt(e);if(q)joyStart(q[0],q[1])});API.onTouchMove&&API.onTouchMove(e=>{const q=pt(e);if(q)joyMove(q[0],q[1])});
 API.onTouchEnd&&API.onTouchEnd(e=>{const q=pt(e);if(!q)return;if(!joy)joyStart(q[0],q[1]);joyEnd(q[0],q[1])});API.onTouchCancel&&API.onTouchCancel(()=>{joy=null})}
else{c.addEventListener('pointerdown',e=>{const [x,y]=coords(e.clientX,e.clientY);joyStart(x,y)});c.addEventListener('pointermove',e=>{if(!joy)return;const [x,y]=coords(e.clientX,e.clientY);joyMove(x,y)});
 c.addEventListener('pointerup',e=>{const [x,y]=coords(e.clientX,e.clientY);if(!joy)joyStart(x,y);joyEnd(x,y)});c.addEventListener('pointercancel',()=>{joy=null})}

// ================================================================ 화면 갱신
let perfAcc=0,perfFrames=0,perfBad=0;
function perf(dt){if(qualityManual||!isPlay()||paused)return;perfAcc+=dt;perfFrames++;if(perfAcc>=2){const fps=perfFrames/perfAcc;perfAcc=0;perfFrames=0;if(fps<45){perfBad++;if(perfBad>=2&&!qualityLow){qualityLow=true;message(L('저사양 모드로 바꿨어요','已切换省电模式'),1.4)}}else perfBad=0}}
function wantMusic(){if(sc==='loading')return;let k='menu';if(sc==='act1')k='escape';else if(sc==='sea'||sc==='build'||sc==='dayend')k=R&&isNight()?'night':R&&inStorm()?'storm':'sea';else if(sc==='land')k='land';Music.play(k)}
let dbgFreeze=false,autoBot=false;
function tick(dt){if(paused||guideTip||adShow||dbgFreeze)return;if(autoBot)botStep(dt);joyTick(dt);if(sc==='act1')act1Tick(dt);else if(sc==='sea')seaTick(dt);else if(sc==='land')landTick(dt)}
function draw(dt){if(API){g.setTransform(1,0,0,1,0,0);g.fillStyle='#03060a';g.fillRect(0,0,c.width,c.height);g.setTransform(view.s,0,0,view.s,view.ox,view.oy)}else g.setTransform(1,0,0,1,0,0);
 btnsNext=[];frame+=dt;tick(dt);if(resetArm>0)resetArm-=dt;
 let sx=0,sy=0;if(shakeT>0){shakeT-=dt;sx=(Math.random()-.5)*shakeA;sy=(Math.random()-.5)*shakeA;if(shakeT<=0)shakeA=0}
 g.save();g.translate(sx,sy);
 if(sc==='loading')loadingScreen();else if(sc==='title')title();else if(sc==='act1')drawAct1();else if(sc==='zone')zoneScreen();else if(sc==='sea')drawSea();else if(sc==='build'){drawSea();btnsNext=[];buildScreen()}
 else if(sc==='land')drawLand();else if(sc==='dayend')dayendScreen();else if(sc==='g1done')g1Screen();else if(sc==='ch1end')ch1Screen();else if(sc==='hmap'){drawSea();btnsNext=[];hmapScreen()}else if(sc==='fail')failScreen();else if(sc==='settings')settingsScreen();else if(sc==='privacy')privacyScreen();else if(sc==='guide')guideScreen();else if(sc==='reward')rewardScreen();
 g.restore();
 if(paused&&isPlay()){btnsNext=[];pauseOverlay()}
 drawJoy();if(guideTip)drawGuideTip();if(adShow)drawAd();drawBanner();btns=btnsNext;wantMusic()}
// 디버그: ?debug=1 일 때만
function botStep(dt){botT-=dt;if(botT>0)return;botT=.25;
 if(sc==='title'){if(save.run){R=save.run;enterSea()}else startAct1();return}
 if(sc==='act1'){const p=A.p;const near=A.zs.find(z=>Math.hypot(z.x-p.x,z.y-p.y)<150);if(near){p.tx=p.x+(p.x<375?90:-90);p.ty=p.y-120;A.target=null;return}
  if(A.bag.length<8){const it=A.items.filter(i=>!i.got&&i.y<p.y+60&&i.y>p.y-700).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(it&&!A.zs.some(z=>Math.hypot(z.x-it.x,z.y-it.y)<110)){A.target=it;p.tx=it.x;p.ty=it.y+8;return}}
  A.target=null;p.tx=375;p.ty=210;return}
 if(sc==='zone'){startSea(botZone);return}
 if(sc==='ch1end'){sc='sea';return}
 if(sc==='dayend'){nextDay();return}if(sc==='g1done'){save.g1fb='bot';sc='sea';morningEvents(false);return}
 if(sc==='fail'){revive();return}if(sc==='build'){sc='sea';return}
 if(sc==='sea'){const r=R.res,v=R.vit;
  if(v.thirst<55&&r.water>0){useVital('thirst');return}if(v.hunger<55&&(r.cooked+r.can+r.berry)>0){useVital('hunger');return}if(v.hp<50&&r.med>0){useVital('hp');return}
  if(act||fishing)return;
  const ft=fireTile();
  const wt=R.deck.find(d=>d.m&&(d.m.k==='rain'||d.m.k==='still')&&d.m.w>0);if(wt&&v.thirst<70){walkTo(wt,()=>useTile(wt));return}
  if(ft&&r.fish>0&&ft.m.fuel>=6){walkTo(ft,()=>useTile(ft));return}
  if(ft&&(R.t>DUSK-10||inStorm())&&ft.m.fuel<25&&r.plank>0){walkTo(ft,()=>useTile(ft));return}
  if(isNight()&&ft&&ft.m.fuel>0&&!nearTile(ft,1.5)){walkTo(ft,()=>{});return}
  const dmg=R.deck.find(d=>d.hp<3);if(dmg&&r.plank>0){walkTo(dmg,()=>useTile(dmg));return}
  const order=['rain','fire','rod','deck','still','deck','bed','sail','radio','deck','still'];const have=k=>R.deck.filter(d=>d.m&&d.m.k===k).length;
  if(stormDay()&&R.t<60&&!R.lashed&&canPay('lash')){chooseBuild('lash');return}
  if(!botBuilt)botBuilt={};for(const k of order){const need=k==='deck'?(R.deck.filter(d=>!d.m).length<1):have(k)<(k==='still'?2:1);if(need&&canPay(k)&&(k==='deck'||R.deck.some(d=>!d.m))&&!(k==='sail'&&R.sail)){chooseBuild(k);if(buildPick){const cell=botCell(k);if(cell){seaTap(tilePos(cell.x,cell.y).x,tilePos(cell.x,cell.y).y);botBuilt[k+R.deck.length]=1}else buildPick=null}return}}
  if(ch2On()){const hb=R.hb,bi=hb.d.findIndex(d=>d.s&&!d.bar);if(bi>=0&&canPayC(BAR_COST)){payC(BAR_COST);hb.d[bi].bar=1}const di=hb.d.findIndex((d,i)=>!d.s&&i<=hb.max+1);if(di>=0&&islandOpen()&&R.t<60&&R.vit.hp>60&&(R.day%2||bi<0)){startHarborD(di);return}}
  if(islandOpen()&&R.t<70){startLand();return}
  const rod=R.deck.find(d=>d.m&&d.m.k==='rod');if(rod&&v.hunger<80&&!isNight()&&Math.random()<.5){walkTo(rod,()=>useTile(rod));return}
  const bed=R.deck.find(d=>d.m&&d.m.k==='bed');if(bed&&isNight()&&!sleeping&&(!ft||ft.m.fuel>40)){walkTo(bed,()=>useTile(bed));return}
  const o=debris.filter(o2=>!o2.pull&&o2.y>150&&o2.y<1000).sort((a,b)=>Math.hypot(a.x-seaP.x,a.y-seaP.y)-Math.hypot(b.x-seaP.x,b.y-seaP.y))[0];if(o)seaTap(o.x,o.y);return}
 if(sc==='land'){const Ld=Land,p=Ld.p;if(Ld.goBoat)return;if(Ld.lit||Ld.clear||Ld.npcGot&&Ld.n>=6||Ld.n>=Ld.cap||R.t>100||R.vit.hp<35){Ld.goBoat=true;Ld.p.tx=375;Ld.p.ty=1830;Ld.target=null;return}
  const z=Ld.zs.find(z2=>z2.hp>0&&Math.hypot(z2.x-p.x,z2.y-p.y)<120);if(z){Ld.target={z};return}if(Ld.target)return;
  if(Ld.noise>45&&Ld.type!=='harbor')return;const o=Ld.objs.filter(o2=>!o2.gone&&o2.k!=='hut'&&!o2.lit&&!(Ld.type==='harbor'&&o2.k!=='light'&&o2.k!=='nest'&&Ld.n>=4)).sort((a,b)=>(a.k==='npc'?-1:0)-(b.k==='npc'?-1:0)||0).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(o){Ld.target={o};Ld.work=0;p.tx=o.x;p.ty=o.y+40}}}
let botT=0,botZone=0,botBuilt=null;
function botCell(k){if(k==='deck'){for(let r=1;r<5;r++)for(let gy=-r;gy<=r;gy++)for(let gx=-r;gx<=r;gx++)if(!tileAt(gx,gy)&&adjacentEmpty(gx,gy)&&gx>=-3&&gx<=3&&gy>=-3&&gy<=4)return {x:gx,y:gy};return null}const t=R.deck.find(d=>!d.m);return t?{x:t.x,y:t.y}:null}
if(!API&&typeof location!=='undefined'&&location.search.indexOf('debug=1')>=0){globalThis.__bepaDebug={get sc(){return sc},set sc(v){sc=v},get R(){return R},get A(){return A},get Land(){return Land},save,persist,touch,startAct1,startSea,startLand,enterSea,nextDay,fail,revive,showAd,
 get btns(){return btns},get debrisList(){return debris},startHarborD,reclaim,harborMorning,set bot(v){autoBot=v},set botZone(v){botZone=v},set freeze(v){dbgFreeze=v},spawnDebris,stormDamage,shadowBump,
 setT(t){if(R)R.t=t},setRes(o){Object.assign(R.res,o)},setVit(o){Object.assign(R.vit,o)},get guideTip(){return guideTip},set guideTip(v){guideTip=v},set guidePage(v){guidePage=v},get paused(){return paused},set paused(v){paused=v},
 step(n,dt=1/60){dbgFreeze=false;for(let i=0;i<n;i++){guideTip=null;tipQ.length=0;btnsNext=[];tick(dt)}dbgFreeze=true},drawNow(){draw(0)},get drawErr(){return drawErr},get stats(){return STAT_LOG},forceStorm(){if(R){R.zone=0;R.day=Z().storm;R.t=61}},joyStart,joyMove,joyEnd,get joy(){return joy},get seaP(){return seaP}}}
let drawErr=0;function loop(now){let dt=last?(now-last)/1000:0;last=now;perf(Math.min(dt,.25));try{draw(Math.min(dt,.1))}catch(e){drawErr++;try{g.restore();g.restore();g.restore()}catch(e2){}if(drawErr<5&&typeof console!=='undefined')console.error('draw error',e);if(drawErr===1)track('draw_error',{m:String(e&&e.message||e).slice(0,80),sc})}
 if(API){if(typeof requestAnimationFrame==='function')requestAnimationFrame(loop);else if(c.requestAnimationFrame)c.requestAnimationFrame(loop)}else requestAnimationFrame(loop)}
if(API){if(typeof requestAnimationFrame==='function')requestAnimationFrame(loop);else if(c.requestAnimationFrame)c.requestAnimationFrame(loop)}else requestAnimationFrame(loop);
})();
