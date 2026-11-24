/* RECLAIM: 돌아온 땅 — 출시 후보판 (A트랙 미니게임판: 웹·토스·위챗·더우인)
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
const BUILD='1125-0130';
// 안전장치: 음수 반지름이면 그리기 전체가 멈추므로 보정
(function(){const P=Object.getPrototypeOf(g);if(!P||P.__safe)return;P.__safe=true;const oa=P.arc,oe=P.ellipse;
 if(oa)P.arc=function(x,y,r,a0,a1,ccw){return oa.call(this,x,y,r>0&&isFinite(r)?r:0,a0,a1,ccw)};
 if(oe)P.ellipse=function(x,y,rx,ry,rot,a0,a1,ccw){return oe.call(this,x,y,rx>0&&isFinite(rx)?rx:0,ry>0&&isFinite(ry)?ry:0,rot,a0,a1,ccw)}})();
// 그림 자원: IMG_LIST·MUST에 넣으면 로딩 화면이 다 받을 때까지 기다린다
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
function drawMug(x,y,s){const u=s/60;g.save();g.translate(x,y);g.scale(u,u);g.lineWidth=4;g.strokeStyle='#1c1410';g.beginPath();g.arc(17,2,10,-1.3,1.3);g.stroke();rr(-20,-14,36,34,7,'#e8e0d0','#1c1410',4);rr(-15,-10,26,8,3,'#3a2416');g.strokeStyle='rgba(255,255,255,.75)';g.lineWidth=3;for(let i=0;i<2;i++){const ox=-9+i*13,w=Math.sin(frame*3+i*2)*3;g.beginPath();g.moveTo(ox,-18);g.quadraticCurveTo(ox+5+w,-25,ox,-31);g.stroke()}g.restore()}
function icon(k,x,y,size){if(k==='coffee'){drawMug(x,y,size*.9);return true}const im=imgs.icons,I=ART.icons;if(!im||I.idx[k]===undefined)return false;const i=I.idx[k],C=I.cell;g.drawImage(im,(i%I.cols)*C,Math.floor(i/I.cols)*C,C,C,x-size/2,y-size/2,size,size);return true}
function wsp(k,x,y,w,anchor){const im=imgs.world,r=ART.world[k];if(!im||!r)return false;const h=w*r[3]/r[2];g.drawImage(im,r[0],r[1],r[2],r[3],x-w/2,anchor==='bottom'?y-h:y-h/2,w,h);return true}
function wspPart(k,sx,sy,sw,sh,dx,dy,dw,dh){const im=imgs.world,r=ART.world[k];if(!im||!r)return false;g.drawImage(im,r[0]+sx*r[2],r[1]+sy*r[3],sw*r[2],sh*r[3],dx,dy,dw,dh);return true}
const ICON_OF={coffee:'coffee',deck:'deck',rod:'rod',lash:'lash',flint:'flint',plank:'plank',plastic:'plastic',cloth:'cloth',scrap:'scrap',rope:'rope',water:'water',can:'can',fish:'fish',cooked:'cooked',med:'med',berry:'berry',crate:'crate',supply:'crate',
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
const save={docs:[],prolog:0,tips:{},daily:null,att:{last:'',streak:0},adBox:null,bank:{},run:null,stats:{days:0,debris:0,lands:0,best:0,runs:0},lang:null,qualityLow:false,qualityManual:false,shake:true,vib:true,music:true,sfx:true,g1fb:null,statc:{}};
let qualityLow=false,qualityManual=false,shakeReduced=false;
function applySave(raw){try{const v=raw?JSON.parse(raw):null;if(v&&typeof v==='object'){for(const k in save)if(v[k]!==undefined)save[k]=v[k];for(const k of ['ch1','ch2','ch3','ch4','cleared','toss'])if(v[k]!==undefined)save[k]=v[k];save.stats=Object.assign({days:0,debris:0,lands:0,best:0,runs:0},v.stats||{});return true}}catch(e){}return false}
// 토스(앱인토스)는 SDK 저장소를 쓴다: 브리지가 읽어 둔 값을 로딩 화면에서 받아 적용
const TOSS=!API&&typeof globalThis!=='undefined'&&!!globalThis.__TOSS_EXPECT;let tossApplied=false;
try{applySave(API&&API.getStorageSync?API.getStorageSync(SAVE_KEY):typeof localStorage!=='undefined'?localStorage.getItem(SAVE_KEY):null)}catch(e){}
if(!LANG_FORCED&&(save.lang==='ko'||save.lang==='zh'))LANG=save.lang;if(save.mild===undefined)save.mild=LANG==='zh'||!!API;if(save.sfx===false)AudioFx.enabled=false;if(save.music===false)Music.on=false;qualityLow=!!save.qualityLow;qualityManual=!!save.qualityManual;shakeReduced=!save.shake;
function persist(){if(R)R.pend=Land?{c:Land.carry,lit:!!Land.lit,rc:Land.clear?Land.di:-1,reg:Land.reg||'hb'}:null;save.lang=LANG;save.qualityLow=qualityLow;save.qualityManual=qualityManual;save.shake=!shakeReduced;try{const v=JSON.stringify(save);if(API&&API.setStorageSync)API.setStorageSync(SAVE_KEY,v);else if(typeof localStorage!=='undefined')localStorage.setItem(SAVE_KEY,v);if(TOSS&&globalThis.__tossStore)globalThis.__tossStore.set(SAVE_KEY,v)}catch(e){}}
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
 if(!API&&typeof globalThis!=='undefined'&&typeof globalThis.__tossAd==='function'){try{globalThis.__tossAd(place,cb,why=>message(why==='loading'?L('광고를 준비하고 있어요. 잠시 후 다시 눌러 주세요','广告准备中，请稍后再试'):L('광고를 불러오지 못했어요. 잠시 후 다시 시도해 주세요','广告加载失败，请稍后再试'),1.8))}catch(e){message(L('광고를 불러오지 못했어요','广告加载失败'),1.4)}return}
 if(TOSS){message(L('이 토스 버전에서는 광고를 볼 수 없어요. 토스 앱을 업데이트해 주세요','当前版本无法观看广告'),2);return}
 if(API&&API.createRewardedVideoAd&&AD_UNIT[PLATFORM]&&AD_UNIT[PLATFORM].indexOf('xxxx')<0){try{if(!adObj){adObj=API.createRewardedVideoAd({adUnitId:AD_UNIT[PLATFORM]});adObj.onClose(r=>{const ok=!r||r.isEnded!==false;const f=adCb;adCb=null;Music.kick();if(ok&&f)f();else message(L('끝까지 봐야 보상을 받아요','需完整观看才能获得奖励'),1.4)});adObj.onError(()=>{adCb=null;message(L('광고를 불러오지 못했어요','广告加载失败'),1.4)})}
  adCb=cb;adObj.show().catch(()=>adObj.load().then(()=>adObj.show()).catch(()=>{adCb=null;message(L('광고를 불러오지 못했어요','广告加载失败'),1.4)}))}catch(e){cb()}return}
 adShow={t:0,cb,place}}
function drawAd(){adShow.t+=1/60;g.fillStyle='rgba(0,0,0,.9)';g.fillRect(0,0,W,H);txt(L('광고 재생 중 (테스트)','广告播放中（测试）'),375,620,30,'#fff','center');rr(175,680,400,16,8,'#222');rr(177,682,396*Math.min(1,adShow.t/2),12,6,'#ffcf6a');
 txt(L('출시판에서는 토스·위챗·더우인 보상형 광고가 나와요','正式版将播放激励视频广告'),375,740,17,'#9fb0c4','center',false);if(adShow.t>=2){const f=adShow.cb;adShow=null;f()}}
function shareGame(){track('share',{});const d=R?R.day:save.stats.best;const title=L('좀비가 닿지 못하는 바다에서 '+d+'일째 버티는 중. 너는 며칠 버틸 수 있어?','在丧尸到不了的海上坚持了第'+d+'天，你能撑几天？');
 if(API&&API.shareAppMessage){try{API.shareAppMessage({title})}catch(e){}}else message(L('공유는 토스·위챗·더우인에서 동작해요','分享功能在小游戏平台中可用'),1.6)}
function onAppHide(){if(isPlay())paused=true;Music.stop();Music.hidden=true;persist();track('app_hide',{sc})}
function onAppShow(){Music.hidden=false;const k=Music.cur;Music.cur='';if(Music.on)Music.play(k||'menu');else Music.cur=k;last=0}
if(typeof globalThis!=='undefined')globalThis.__gameAudio=on=>{if(on)onAppShow();else{Music.stop();Music.hidden=true}};
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
const RES_N={plank:['판자','木板'],plastic:['플라스틱','塑料'],cloth:['천','布'],scrap:['고철','废铁'],rope:['밧줄','绳子'],water:['물','水'],can:['통조림','罐头'],fish:['날생선','生鱼'],cooked:['구운 생선','烤鱼'],berry:['열매','野果'],med:['치료약','药品'],coffee:['커피','咖啡'],bomb:['정화탄','净化弹']};
const RES_C={plank:'#c79a5b',plastic:'#7fc6e8',cloth:'#c9c2e0',scrap:'#9aa3ad',rope:'#d8b878',water:'#5fb4ff',can:'#e0a860',fish:'#b8d0d8',cooked:'#f0a050',berry:'#e0607a',med:'#ff8a8a',coffee:'#8a5a3a',bomb:'#7fe0d0'};
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
 radio:{n:['무전기','电台'],cost:{scrap:4,rope:2},need:'radio',col:'#d0a0ff',d:['멀리서 오는 신호를 찾는다','搜寻远方的信号']},
 coffee:{n:['커피 드리퍼','咖啡滤杯'],cost:{scrap:2,cloth:1,plastic:1},col:'#8a5a3a',d:['열매 2 + 물 1 → 커피. 세상은 망해도 카페인은 필요하다','野果2 + 水1 → 咖啡。世界完了，咖啡因不能断']}};
const BUILD_LIST=['rain','fire','rod','deck','still','bed','lash','sail','radio','coffee'];
const T=84,RAFT_X=375,RAFT_Y=600;// 갑판 한 칸 크기와 배 중심
const MISSIONS=[{k:'debris',goal:15,name:['떠내려온 물건 15개 건지기','打捞15个漂流物'],r:{plank:3,plastic:2}},{k:'cook',goal:3,name:['생선 3마리 굽기','烤3条鱼'],r:{can:1,rope:1}},
 {k:'land',goal:1,name:['섬에 1번 상륙하기','登岛1次'],r:{rope:2}},{k:'build',goal:2,name:['배에 2번 짓기','在船上建造2次'],r:{plank:4}},{k:'drink',goal:4,name:['물 4번 마시기','喝水4次'],r:{plastic:2}},{k:'chop',goal:6,name:['섬에서 나무 6번 베기','在岛上砍树6次'],r:{cloth:2}}];
const ATT=[{plank:3},{plastic:2},{rope:2},{can:1,plank:2},{cloth:3},{scrap:3},{med:1,can:2,plank:4}];

// ================================================================ 1장 이야기 · 목표 · 동료
const SURV=[{n:['도하','道河'],job:['어부','渔夫'],tint:'rgba(50,110,230,.38)',d:['낚싯대로 물고기를 잡고, 불이 있으면 구워 둔다','用钓竿钓鱼，有火就烤好']},
 {n:['유나','柔娜'],job:['정비공','机修工'],tint:'rgba(60,180,90,.38)',d:['물건을 건지고, 불을 지키고, 갑판을 고친다','打捞物资、看火、修甲板']},
 {n:['마루','玛鲁'],job:['등대지기','守塔人'],tint:'rgba(170,90,220,.36)',d:['밤새 망을 봐서, 불이 꺼져도 어둠 속의 그것이 물건을 훔치지 못한다','整夜放哨，就算火灭了，黑暗中的东西也偷不走物资']},
 {n:['한수','韩洙'],job:['목수','木匠'],tint:'rgba(200,140,50,.36)',d:['유나의 아버지. 짓는 데 드는 판자가 1개 줄어든다','柔娜的父亲。建造所需木板减少1块']},
 {n:['서린','书林'],job:['의사','医生'],tint:'rgba(235,235,245,.42)',d:['매일 아침 모두의 체력을 20 회복시킨다','每天早上为大家恢复20点体力']}];
const RADIO=[['…치직… 여기는 동쪽 항구 등대. 내 이름은 마루. 사흘 전 바다에 떨어진 비행기… 거기 누가 살아 있습니까?','……滋滋……这里是东港灯塔。我叫玛鲁。有人在听吗？'],
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
const HB=[{n:['부두','码头'],nests:3,z:5,prod:{plank:2,rope:1}},{n:['시장','集市'],nests:3,z:6,prod:{can:1,cloth:1}},{n:['발전소','发电站'],nests:4,z:7,prod:{scrap:2,water:2}},{n:['중앙 광장','中央广场'],nests:1,boss:true,z:8,prod:{can:1,plank:2}}];
const BAR_COST={plank:5,scrap:2,rope:2};
const RADIO2=[['항구 무전: 등대 불빛을 보고 배 세 척이 더 들어왔습니다. 부두만 되찾으면 댈 곳이 생겨요.','港口电台：又有三艘船循着灯塔的光进来了。只要夺回码头，就有地方停靠。'],
 ['항구 무전: 회색 이끼는 둥지에서 퍼집니다. 둥지를 태우면 그 구역의 그것들도 힘을 잃어요.','港口电台：灰色的苔藓从巢穴蔓延。烧掉巢穴，那一带的它们也会变弱。'],
 ['항구 무전: 되찾은 땅은 며칠마다 회색이 되밀려옵니다. 방벽 없이는 못 지켜요.','港口电台：夺回的土地每隔几天就会被灰色反扑。没有路障守不住。'],
 ['항구 무전: 발전소가 돌면 정수 펌프도 돕니다. 물 걱정이 줄 거예요.','港口电台：发电站一转，净水泵也能转。喝水就不用愁了。'],
 ['항구 무전: 광장 한가운데에 심장처럼 뛰는 큰 둥지가 있습니다. 그게 이 항구의 뿌리예요.','港口电台：广场中央有个像心脏一样跳动的大巢。那就是这座港口的病根。']];
const CH2=[{t:['부두의 감염 둥지를 태워 되찾기','烧掉码头的感染巢，夺回码头'],p:()=>[R.hb.d[0].s?1:0,1],r:{plank:4,rope:2},s:['부두에 배를 댔다. 발밑이 흔들리지 않는 게 낯설다.','船靠上了码头。脚下不再摇晃，反而有些陌生。']},
 {t:['되찾은 구역에 방벽 세우기','在夺回的区域建起路障'],p:()=>[R.hb.d.some(d=>d.bar)?1:0,1],r:{can:2},s:['되찾는 것보다 지키는 게 어렵다. 그래도 벽 안쪽은 이제 우리 땅이다.','守比夺更难。但墙内的地方，现在是我们的了。']},
 {t:['시장 되찾기','夺回集市'],p:()=>[R.hb.d[1].s?1:0,1],r:{can:3,cloth:2},s:['텅 빈 좌판 사이로 사람들이 걸어 들어왔다. 누군가 가게 셔터를 올렸다.','人们走进空荡荡的摊位之间。有人拉起了店铺的卷帘门。']},
 {t:['밤 습격을 막아내기','击退一次夜袭'],p:()=>[R.cnt.held,1],r:{scrap:3,rope:2},s:['밤새 벽 너머에서 긁는 소리가 났다. 아침에 벽은 그대로 서 있었다.','整夜墙外都是抓挠声。到了早上，墙依然立着。']},
 {t:['발전소 되찾기','夺回发电站'],p:()=>[R.hb.d[2].s?1:0,1],r:{water:3,med:1},s:['터빈이 돌자 항구의 가로등이 하나씩 켜졌다. 누군가 소리 내어 울었다.','涡轮一转，港口的路灯一盏盏亮起。有人哭出了声。']},
 {t:['갑판을 14칸으로 넓히기','把甲板扩建到14格'],b:'deck',p:()=>[R.deck.length,14],r:{can:2,rope:2},s:['이 배는 이제 항구의 병원이자 창고다. 사람들은 「첫 배」라고 부른다.','这艘船现在是港口的医院和仓库。人们叫它"第一艘船"。']},
 {t:['중앙 광장의 회색 심장 태우기','烧掉中央广场的灰色心脏'],p:()=>[R.hb.d[3].s?1:0,1],r:{},s:['심장이 멎자 회색 이끼가 재처럼 부서졌다. 항구 전체에 색이 돌아왔다.','心脏停跳，灰色的苔藓像灰烬一样碎裂。整座港口恢复了颜色。']}];
// ---- 바다 사건: 상어 · 표류 보트 · 떠돌이 상인 · 물고기 떼
let evCard=null,shark=null,school=null;
const SEA_TR=[{g:{cooked:2},r:{rope:2}},{g:{plank:4},r:{scrap:2}},{g:{plastic:3},r:{water:2}},{g:{fish:3},r:{med:1}},{g:{cloth:3},r:{can:2}},{g:{scrap:2},r:{cloth:3}}];
function seaEvent(){const opts=['shark','boat','trader','school'].filter(k=>k!==R.lastEv&&!(k==='shark'&&R.day<3)&&!(sc!=='sea'&&(k==='shark'||k==='school')));const k=opts[Math.floor(Math.random()*opts.length)];R.lastEv=k;R.ff=false;track('sea_event',{k,day:R.day});AudioFx.cue('warn');vib('medium');
 if(k==='shark'){const edge=R.deck.filter(d=>!tileAt(d.x-1,d.y)||!tileAt(d.x+1,d.y)||!tileAt(d.x,d.y+1));const t=edge[Math.floor(Math.random()*edge.length)]||R.deck[0];shark={t:0,ang:Math.random()*6,hp:3,hit:0,tile:t,x:RAFT_X-300,y:RAFT_Y};message(L('상어다! 지느러미를 세 번 탭해서 쫓아내요!','鲨鱼！点它的背鳍三下把它赶走！'),2.6);return}
 if(k==='school'){school={t:12,sp:[],n:0,nt:0};message(L('물고기 떼다! 반짝이는 물결을 탭하면 잡혀요!','鱼群来了！点闪光的水面就能抓到！'),2.4);return}
 if(k==='boat'){evCard={head:L('표류 보트','漂流小艇'),lines:[L('주인 없는 작은 보트가 떠내려왔다. 방수포 밑에 뭔가 불룩하다.','一艘没人的小艇漂了过来。防水布下面鼓鼓囊囊的。'),L('뒤지면 물건이 나올 수도 있지만, 무언가 숨어 있을지도 모른다.','翻一翻可能有东西，但也可能藏着别的。')],opts:[{l:L('뒤져 보기','翻找'),c:'red',fn:()=>{evCard=null;if(Math.random()<.7){giveR({rope:2,can:1,cloth:2});popTip({head:L('표류 보트','漂流小艇'),lines:[[L('밧줄과 통조림, 천이 나왔다.','翻出了绳子、罐头和布。'),L('밧줄과 통조림, 천이 나왔다.','翻出了绳子、罐头和布。')]],t:0})}else{R.vit.hp=Math.max(5,R.vit.hp-12);shake(14,.4);vib('heavy');AudioFx.cue('hurt');giveR({rope:1});popTip({head:L('표류 보트','漂流小艇'),lines:[[L('방수포 밑에 감염체가 웅크리고 있었다! 밀쳐 냈지만 다쳤다. (체력 -12, 밧줄 +1)','防水布下蜷着一只丧尸！推开了它，但受了伤。（体力-12，绳子+1）'),L('방수포 밑에 감염체가 웅크리고 있었다! 밀쳐 냈지만 다쳤다. (체력 -12, 밧줄 +1)','防水布下蜷着一只丧尸！推开了它，但受了伤。（体力-12，绳子+1）')]],t:0})}track('ev_boat',{})}},{l:L('그냥 보내기','让它漂走'),c:'dark',fn:()=>{evCard=null}}]};return}
 const a=SEA_TR[Math.floor(Math.random()*SEA_TR.length)];let b=SEA_TR[Math.floor(Math.random()*SEA_TR.length)];if(b===a)b=SEA_TR[(SEA_TR.indexOf(a)+1)%SEA_TR.length];
 const tr=(t)=>({l:costStr(t.g)+' → '+costStr(t.r),c:canPayC(t.g)?'blue':'gray',fn:()=>{if(!canPayC(t.g)){message(L('내줄 물건이 모자라요','要给的东西不够'),1.4);return}payC(t.g);giveR(t.r);evCard=null;AudioFx.cue('pick');message(L('교환했다: ','换到了：')+costStr(t.r,1),1.6);track('ev_trade',{})}});
 evCard={head:L('떠돌이 상인 배','流浪商船'),lines:[L('돛에 냄비를 매단 작은 배가 다가왔다. "물건 바꿀 텐가? 한 번만이야."','一艘帆上挂着锅的小船靠了过来。“换点东西吗？只换一次。”')],opts:[tr(a),tr(b),{l:L('지나가기','不用了'),c:'dark',fn:()=>{evCard=null}}]}}
function giveR(o){for(const k in o)R.res[k]=(R.res[k]||0)+o[k]}
function evTick(dt){if(shark){const sk=shark,tp=tilePos(sk.tile.x,sk.tile.y);sk.t+=dt;sk.hit=Math.max(0,sk.hit-dt);if(sk.t<7){sk.ang+=dt*.9;sk.x+=(RAFT_X+Math.cos(sk.ang)*270-sk.x)*Math.min(1,dt*2);sk.y+=(RAFT_Y+Math.sin(sk.ang)*210-sk.y)*Math.min(1,dt*2)}else{const dx=tp.x-sk.x,dy=tp.y-sk.y,d=Math.hypot(dx,dy);if(d<46){const k=['fish','cooked','plank'].find(k2=>R.res[k2]>0);if(k)R.res[k]--;sk.tile.hp=Math.max(1,sk.tile.hp-1);shake(16,.5);vib('heavy');AudioFx.cue('hit');message(L('상어가 갑판을 물어뜯었다! ','鲨鱼咬坏了甲板！')+(k?LL(RES_N[k])+' -1':''),2.2);track('shark_bite',{});shark=null}else{const v=(sk.hit>0?-60:95)*dt;sk.x+=dx/d*v;sk.y+=dy/d*v}}}
 if(school){const sc2=school;sc2.t-=dt;sc2.nt-=dt;if(sc2.nt<=0&&sc2.t>1.5){sc2.nt=.7;for(let k=0;k<12;k++){const x=90+Math.random()*570,y=260+Math.random()*700,c=cellAt(x,y);if(!(c&&tileAt(c.x,c.y))){sc2.sp.push({x,y,t:2.4});break}}}sc2.sp.forEach(p=>p.t-=dt);sc2.sp=sc2.sp.filter(p=>p.t>0);if(sc2.t<=0){message(L('물고기 떼가 지나갔다. 잡은 물고기 ','鱼群游走了。抓到 ')+sc2.n+L('마리','条'),1.8);track('ev_school',{n:sc2.n});school=null}}}
function evTap(x,y){if(shark&&Math.hypot(x-shark.x,y-shark.y)<80){shark.hp--;shark.hit=.6;shake(8,.2);vib('medium');AudioFx.cue('splash');for(let i=0;i<6;i++)fx.push({x:shark.x+(Math.random()-.5)*60,y:shark.y+(Math.random()-.5)*30,s:'•',col:'#e8fbff',t:Math.random()*.2});if(shark.hp<=0){giveR({fish:2});fxText(shark.x,shark.y-40,L('상어가 도망쳤다! 놀란 물고기 +2','鲨鱼逃走了！受惊的鱼 +2'),'#b8f0ff');track('shark_win',{});shark=null}return true}
 if(school){for(const p of school.sp)if(Math.hypot(x-p.x,y-p.y)<62){p.t=0;school.n++;R.res.fish++;R.today.fish++;AudioFx.cue('splash');vib('light');fxText(p.x,p.y-30,L('물고기 +1','鱼 +1'),'#b8f0ff');return true}}return false}
function drawEvSea(){if(school)for(const p of school.sp){const a=Math.min(1,p.t)*(.6+.4*Math.sin(frame*12+p.x));g.save();g.globalAlpha=a;drawGlow(p.x,p.y,48,'w',.7);g.strokeStyle='#e8fbff';g.lineWidth=3;g.beginPath();g.ellipse(p.x,p.y,26+Math.sin(frame*8)*4,10,0,0,TAU);g.stroke();g.fillStyle='#1a5a70';g.beginPath();g.ellipse(p.x+Math.sin(frame*5)*8,p.y,12,5,0,0,TAU);g.fill();g.restore()}
 if(shark){const sk=shark,dir=sk.t<7?Math.cos(sk.ang+1.57):Math.sign(tilePos(sk.tile.x,sk.tile.y).x-sk.x)||1;g.save();g.globalAlpha=.35;g.fillStyle='#04202a';g.beginPath();g.ellipse(sk.x,sk.y+18,70,20,0,0,TAU);g.fill();g.restore();g.strokeStyle='rgba(235,252,252,.5)';g.lineWidth=3;g.beginPath();g.moveTo(sk.x-dir*20,sk.y+4);g.quadraticCurveTo(sk.x-dir*50,sk.y+12,sk.x-dir*80,sk.y+4);g.stroke();
  g.fillStyle=sk.hit>0?'#ffd0d0':'#4a5862';g.strokeStyle='#1a2228';g.lineWidth=3;g.beginPath();g.moveTo(sk.x-dir*22,sk.y+6);g.quadraticCurveTo(sk.x-dir*4,sk.y-34,sk.x+dir*16,sk.y-46);g.quadraticCurveTo(sk.x+dir*8,sk.y-18,sk.x+dir*20,sk.y+6);g.closePath();g.fill();g.stroke();for(let i=0;i<3;i++)circ(sk.x-14+i*14,sk.y-62,5,i<sk.hp?'#ff7a6a':'#3a4450','#111',2)}}
function drawEvCard(){const e=evCard;g.fillStyle='rgba(4,6,12,.72)';g.fillRect(0,0,W,H);hotspot(0,0,W,H,()=>{},'ev_block');let tot=0;const wr=e.lines.map(l=>{const w=wrap(l,21,560);tot+=w.length;return w});const h=170+tot*34+e.opts.length*96,y0=620-h/2;
 rr(50,y0,650,h,18,'#141a28f6','#ffcf6a',3);txt('⚓ '+e.head,90,y0+46,26,'#ffe2a0');let y=y0+96;wr.forEach(w=>{w.forEach(l=>{txt(l,90,y,21,'#e6ecf2','left',false);y+=34});y+=8});
 e.opts.forEach((o,i)=>button(90,y+10+i*96,570,80,o.l,o.c,21,o.fn,{id:'ev'+i}))}
// ---- 정착지(항구 마을) · 이어진 지도 · 선단
const TZ=[[30,744,690,136],[30,452,330,276],[390,452,330,276],[150,196,450,240]];
const TDECO=[[['building3',150,878,170]],[['building',115,722,165],['building2',275,714,150]],[['building3',475,722,170],['building',640,714,140]],[['building2',255,430,170],['building',500,430,170]]];
const TB={dock:{z:0,x:470,y:830,n:['선착장','码头栈桥'],cost:{plank:6,rope:2},d:['도하의 어선이 30초마다 바다에서 물건을 건져 와요. 이제 직접 줍지 않아도 돼요.','道河的渔船每30秒从海上捞回物资，不用再亲手打捞了。']},
 farm:{z:1,x:205,y:560,n:['텃밭','菜园'],cost:{plank:4,cloth:2},d:['매일 아침 열매 3개를 거둬요.','每天早上收获3个野果。']},
 clinic:{z:3,x:375,y:300,n:['진료소','诊所'],cost:{plank:5,cloth:3,scrap:2},d:['매일 아침 치료약 1개를 만들어요.','每天早上制作1份药品。']}};
const TPOS=[[470,872],[250,860],[86,812],[300,640],[420,360]];
const WN={hb:[[175,1000],[300,915],[525,950],[392,842]],rv:[[300,725],[440,640],[318,540],[455,445]],ct:[[215,330],[420,292],[612,238],[382,188]]};
let townSel=-1,worldSel=null;
function home(){return R&&ch2On()?'town':'sea'}
function goHome(){sc=home()}
function fleetN(){return (R.tb&&R.tb.dock?1:0)+(R.rv&&R.rv.d[1].s?1:0)+(R.ct&&R.ct.d[2].s?1:0)}
function townPos(i){let p=TPOS[i]||TPOS[1];const zi=[0,0,0,1,3][i];if(zi&&!R.hb.d[zi].s)p=[200+i*60,868];const wob=Math.sin(frame*.35+i*1.7);return {x:p[0]+wob*26,y:p[1],mv:Math.abs(Math.cos(frame*.35+i*1.7))>.3}}
function regOpen(rg,i){if(rg==='hb')return ch2On()&&i<=R.hb.max+1;if(rg==='rv')return ch3On()&&i<=R.rv.max+1;return ch4On()&&i<=R.ct.max+1}
function regGo(){return R.t<112&&canLand()&&!inStorm()}
function regWhy(){message(!canLand()?L('오늘 원정은 두 번까지예요. 내일 다시 가요','今天最多远征两次，明天再去'):inStorm()?L('폭풍 속에선 배를 띄울 수 없어요','风暴中无法出船'):L('해가 지기 전엔 돌아올 수 없어요','天黑前回不来'),1.6)}
function drawFleet(){const xs=R.deck.map(d=>d.x),ys=R.deck.map(d=>d.y),mx=(Math.min(...xs)+Math.max(...xs))/2,my=(Math.min(...ys)+Math.max(...ys))/2,s=.3,cx=230,cy=972+Math.sin(frame*1.4)*3;
 for(const d of R.deck){const x=cx+(d.x-mx)*T*s,y=cy+(d.y-my)*T*s;rr(x-T*s/2,y-T*s/2,T*s-2,T*s-2,4,'#8a6a46','#3a2a1c',2);if(d.m)circ(x,y,6,MODS[d.m.k].col,'#111',1.5)}
 const ft=fireTile();if(ft&&fireLit())drawGlow(cx+(ft.x-mx)*T*s,cy+(ft.y-my)*T*s,40,'o',.7);
 for(let i=0;i<fleetN();i++){const x=430+i*105,y=1000+Math.sin(frame*1.2+i)*3;if(!wsp('boat',x,y,118))rr(x-50,y-16,100,32,14,'#7a5a3e','#2a1e14',3)}
 txt(L('선단 ','船队 ')+(1+fleetN())+L('척','艘'),640,1040,15,'#cfe8ee','center',false)}
function drawTown(){const night=isNight(),dusk=R.t>DUSK&&!night,hb=R.hb;
 g.fillStyle='#262a26';g.fillRect(0,150,W,910);for(let i=0;i<60;i++){g.fillStyle='rgba(255,255,255,.025)';g.fillRect((i*137)%W,160+(i*89)%880,30,4)}
 rr(345,160,60,600,0,'#363634');rr(30,732,690,12,0,'#363634');
 const sg=g.createLinearGradient(0,884,0,1060);sg.addColorStop(0,'#1d6f7c');sg.addColorStop(1,'#0f4450');g.fillStyle=sg;g.fillRect(0,884,W,176);
 g.strokeStyle='rgba(225,250,250,.16)';g.lineWidth=3;for(let i=0;i<9;i++){const x=(i*97+frame*16)%W,y=900+(i*37)%140;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+20,y-5,x+40,y);g.stroke()}
 TZ.forEach((z,i)=>{const [x,y,w,h]=z,d=hb.d[i],ok=d.s,open=!ok&&regOpen('hb',i);
  rr(x,y,w,h,18,ok?'#4c4a3e':'#30353a',ok?'#8a7a4a':'#1c2024',3);
  if(ok)for(let k=0;k<10;k++){const fx2=x+20+(k*71)%(w-40),fy=y+16+(k*43)%(h-60);circ(fx2,fy,3,['#e8c070','#c8e08a','#e89a9a'][k%3])}
  TDECO[i].forEach(([k,bx,by,bw])=>{if(!wsp(k,bx,by,bw,'bottom'))rr(bx-bw/2,by-bw*.8,bw,bw*.8,6,'#5a5a5a','#222',3);if(ok&&(night||dusk)){g.save();g.globalCompositeOperation='lighter';drawGlow(bx,by-bw*.35,46,'y',.45);g.restore()}});
  if(!ok){g.save();g.globalAlpha=.78;rr(x,y,w,h,18,'#3c463f');g.restore();for(let k=0;k<7;k++){g.save();g.globalAlpha=.32;circ(x+30+(k*97)%(w-60),y+24+(k*61)%(h-48),16+(k%3)*9,'#7a8a70');g.restore()}
   const nn=Math.min(3,HB[i].boss?1:Math.max(1,d.left));for(let k=0;k<nn;k++)drawNest({x:x+w*(k+1)/(nn+1),y:y+h*.5,n:2,big:!!HB[i].boss,town:1});
   for(let k=0;k<2;k++){const zx=x+50+((frame*14+k*170+i*90)%(w-100)),zy=y+h-30-k*44;sprite('inf_walker','walk',frame*.8+k,zx,zy,66,1,6)}}
  else if(d.bar){if(!wsp('barricade',x+w/2,y+18,140))rr(x+w/2-60,y+6,120,22,4,'#6a5038','#2a1e14',3)}
  const lb=(ok?'● ':open?'◐ ':'○ ')+LL(HB[i].n)+(ok?(d.bar?L(' · 방벽',' · 路障'):''):open?L(' · 감염 · 원정 가능',' · 感染 · 可远征'):L(' · 감염',' · 感染'));g.font='bold 15px sans-serif';const tw=g.measureText(lb).width+18;rr(x+10,y+10,tw,26,12,ok?'rgba(14,34,22,.86)':'rgba(30,18,10,.86)',ok?'#7fe0a0':open?'#ffcf6a':'#4a5462',2);txt(lb,x+19,y+23,15,ok?'#dfffe8':open?'#ffe7a0':'#9aa4b2','left',false);
  if(R.anim&&R.anim.rg==='hb'&&R.anim.i===i){const a=Math.max(0,1-R.anim.t/2.5);g.save();g.globalAlpha=a;rr(x,y,w,h,18,'rgba(255,240,180,.45)');g.restore();for(let k=0;k<6;k++)txt('✦',x+((k*131+frame*60)%w),y+((k*77)%h),22,'#fff3c0','center',false)}
  hotspot(x,y,w,h,()=>{townSel=i;AudioFx.cue('ui')},'tz'+i)});
 for(const k in TB)if(R.tb&&R.tb[k]){const b=TB[k];if(k==='dock'){g.fillStyle='#6a5038';g.fillRect(b.x-20,b.y,40,90);for(let j=0;j<5;j++)g.fillRect(b.x-34,b.y+j*18,68,6)}else if(!wsp('hut',b.x,b.y+30,120,'bottom'))rr(b.x-50,b.y-40,100,70,8,'#7a5a3e','#2a1e14',3);
  g.font='bold 13px sans-serif';const lb=LL(b.n),tw=g.measureText(lb).width+14;rr(b.x-tw/2,b.y+36,tw,21,10,'rgba(8,12,18,.82)');txt(lb,b.x,b.y+47,13,'#fff','center',false)}
 // 등대
 rr(56,744,40,70,6,'#d8d0c0','#3a3430',3);rr(62,724,28,24,4,R.lit?'#ffe27a':'#5a5a5a','#3a3430',3);if(R.lit&&(night||dusk)){g.save();g.globalCompositeOperation='lighter';const ang=frame*.8;g.fillStyle='rgba(255,235,160,.16)';g.beginPath();g.moveTo(76,736);g.arc(76,736,520,ang-.18,ang+.18);g.closePath();g.fill();drawGlow(76,736,60,'y',.8);g.restore()}
 R.hb.d.forEach((d,i)=>{if(d.s&&R.tw&&R.tw[i])drawTower(i)});
 drawFleet();drawSurv();for(const s2 of R.surv){const ps=survPos(s2.id);hotspot(ps.x-30,ps.y-80,60,90,()=>{const J=JOB[s2.id],S=SURV[s2.id];popTip({head:LL(S.n)+' · '+LL(S.job),lines:[s2.fed?[J.e+' '+J.d[0],J.e+' '+J.d[1]]:['😩 배가 고파서 쉬고 있어요.','😩 饿着肚子在休息。'],S.d],t:0})},'ts'+s2.id)}
 drawFx();
 if(night||dusk||inStorm()){const a=raid?.3:night?.55:inStorm()?.35:(R.t-DUSK)/(NIGHT-DUSK)*.4;g.fillStyle=`rgba(2,6,14,${a})`;g.fillRect(0,150,W,910)}
 if(raid){g.save();g.globalCompositeOperation='lighter';for(const k in raid.zhp){const e=zEntry(+k);drawGlow(e.x,e.y,120,'o',.55+.1*Math.sin(frame*9+ +k))}R.hb.d.forEach((d,i)=>{if(d.s&&R.tw&&R.tw[i]){const p=towerPos(i);drawGlow(p.x,p.y-90,90,'o',.6)}});g.restore()}
 if(raid)drawRaid();else if(R.raid){const today=R.raid===R.day,lb='🌙 '+(today?L('오늘 밤 습격!','今晚袭击！'):L('다음 습격 ','下次袭击 ')+raidDays()+L('일 뒤','天后'))+'  ⓘ';rr(450,196,280,40,12,today?'rgba(80,12,10,.92)':'rgba(20,24,34,.88)',today?'#ff7a6a':'#8a94a4',2);txt(lb,590,216,17,today?'#ffd8d0':'#dfe6ee','center',false);hotspot(450,190,280,52,()=>{rgFrom='town';sc='raidguide'},'raid_badge')}
 drawGuideFinger();
 if(R.anim){R.anim.t+=1/60;if(R.anim.t>2.6)R.anim=null}
 seaHud();if(townSel>=0&&!raid)zoneSheet();if(evCard)drawEvCard();if(R.rgAsk&&!R.rgSeen&&!guideTip&&!raid&&townSel<0){R.rgAsk=0;rgFrom='town';sc='raidguide'}}
function sheetBase(h){g.fillStyle='rgba(4,6,12,.55)';g.fillRect(0,0,W,H);hotspot(0,0,W,H,()=>{townSel=-1;worldSel=null},'sh_block');const y0=1060-h;rr(16,y0,718,h+250,24,'#141a28f8','#ffcf6a',3);return y0}
function zoneSheet(){const i=townSel,d=R.hb.d[i],h=HB[i],open=!d.s&&regOpen('hb',i);const tbs=Object.keys(TB).filter(k=>TB[k].z===i);const y0=sheetBase(380+tbs.length*96);
 txt(LL(h.n),50,y0+44,30,'#ffe2a0','left');txt(d.s?L('되찾은 땅','已夺回'):open?(h.boss?L('감염됨 · 회색 심장이 뛰고 있다','感染中 · 灰色心脏在跳动'):L('감염됨 · 남은 둥지 ','感染中 · 剩余巢穴 ')+d.left):L('앞 구역을 먼저 되찾아야 해요','需先夺回前一个区域'),50,y0+88,19,'#c9d2de','left',false);
 txt(L('매일 아침: ','每天早上：')+costStr(h.prod,1),50,y0+122,17,'#9fb0c4','left',false);let y=y0+150;
 if(open){button(50,y,650,84,L('원정 떠나기','出发远征')+' ('+L('선단 짐 +','船队载货 +')+fleetN()*2+')',regGo()?'red':'gray',24,()=>{if(regGo()){townSel=-1;startHarborD(i)}else regWhy()},{id:'tz_go'});y+=96}
 else if(d.s&&!d.bar){button(50,y,650,84,L('방벽 세우기 · ','建路障 · ')+costStr(BAR_COST),canPayC(BAR_COST)?'gold':'gray',22,()=>{if(!canPayC(BAR_COST)){message(L('재료가 모자라요: ','材料不够：')+costStr(BAR_COST),1.6);return}payC(BAR_COST);d.bar=1;track('barricade',{i,day:R.day});AudioFx.cue('build');vib('medium');persist()},{id:'tz_bar'});y+=96}
 else if(d.s){txt(L('방벽이 습격하는 감염체를 붙잡아 둬요','路障能拖住来袭的丧尸'),50,y+30,18,'#7fe0a0','left',false);y+=60}
 if(d.s&&!(R.tw&&R.tw[i])){button(50,y,650,84,L('망루 세우기 · ','建瞭望塔 · ')+costStr(TWR_COST),canPayC(TWR_COST)?'gold':'gray',22,()=>{if(!canPayC(TWR_COST)){message(L('재료가 모자라요: ','材料不够：')+costStr(TWR_COST),1.6);return}payC(TWR_COST);R.tw=R.tw||{};R.tw[i]=1;track('tower',{i,day:R.day});AudioFx.cue('build');vib('medium');persist()},{id:'tz_tw'});y+=96}
 else if(d.s){txt(L('망루: 습격 때 다가오는 감염체를 쏴요','瞭望塔：袭击时射击靠近的丧尸'),50,y+30,18,'#ffe27a','left',false);y+=60}
 tbs.forEach(k=>{const b=TB[k],has=R.tb&&R.tb[k];if(has){rr(50,y,650,84,14,'#12261c','#7fe0a0',2);txt('✓ '+LL(b.n),74,y+28,20,'#dfffe8','left',false);txt(LL(b.d),74,y+60,15,'#a8c8b0','left',false)}
  else button(50,y,650,84,L('짓기: ','建造：')+LL(b.n)+' · '+costStr(b.cost),d.s&&canPayC(b.cost)?'green':'gray',21,()=>{if(!d.s){message(L('먼저 이 구역을 되찾아야 해요','需先夺回这个区域'),1.6);return}if(!canPayC(b.cost)){message(L('재료가 모자라요: ','材料不够：')+costStr(b.cost),1.6);return}payC(b.cost);R.tb=R.tb||{};R.tb[k]=1;track('town_build',{k,day:R.day});AudioFx.cue('build');vib('medium');popTip({head:LL(b.n),lines:[b.d],t:0});persist()},{id:'tb_'+k});y+=96});
 button(50,y,318,70,L('습격이란?','什么是夜袭？'),'blue',20,()=>{townSel=-1;rgFrom='town';sc='raidguide'},{id:'tz_rg'});button(382,y,318,70,L('닫기','关闭'),'dark',22,()=>{townSel=-1},{id:'tz_close'})}
function drawWorld(){g.fillStyle='#1e2620';g.fillRect(0,0,W,H);for(let i=0;i<80;i++){g.fillStyle='rgba(120,140,100,.06)';circ((i*137)%W,(i*89)%H,10+(i%5)*6,'rgba(120,140,100,.06)')}
 const sg=g.createLinearGradient(0,1040,0,H);sg.addColorStop(0,'#1d6f7c');sg.addColorStop(1,'#0c3440');g.fillStyle=sg;g.beginPath();g.moveTo(0,1080);for(let x=0;x<=W;x+=50)g.lineTo(x,1050+Math.sin(x*.02)*22);g.lineTo(W,H);g.lineTo(0,H);g.fill();
 const rvp=[[392,842]].concat(WN.rv).concat([[470,380],[430,250]]);g.strokeStyle='#2a6a7a';g.lineWidth=34;g.lineCap='round';g.lineJoin='round';g.beginPath();rvp.forEach((p,k)=>k?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.stroke();g.strokeStyle=R.rv.d[3].s?'#4ab0c4':'#5a6a66';g.lineWidth=18;g.stroke();
 for(let k=0;k<14;k++){rr(120+(k*53)%520,150+(k*29)%160,40,30+(k%3)*14,4,'rgba(80,84,90,.55)')}
 txt(L('한빛 일대','韩光一带'),375,58,34,'#ffe2a0','center');const all=['hb','rv','ct'].reduce((a,k)=>a+R[k].d.filter(d=>d.s).length,0);txt(L('되찾은 땅 ','已夺回 ')+all+'/12 · '+L('선단 ','船队 ')+(1+fleetN())+L('척','艘')+' · '+L('동행: ','同行：')+(compId()>=0?LL(SURV[compId()].n):L('혼자','独自')),375,100,18,'#c9d2de','center',false);
 const H2={hb:HB,rv:RV,ct:CT};
 ['hb','rv','ct'].forEach(rg=>{const pts=WN[rg];for(let i=1;i<pts.length;i++){g.save();g.setLineDash([8,10]);g.strokeStyle='rgba(255,220,150,.35)';g.lineWidth=3;g.beginPath();g.moveTo(pts[i-1][0],pts[i-1][1]);g.lineTo(pts[i][0],pts[i][1]);g.stroke();g.restore()}});
 ['hb','rv','ct'].forEach(rg=>WN[rg].forEach((p,i)=>{const d=R[rg].d[i],h=H2[rg][i],un=(rg==='hb'&&!ch2On())||(rg==='rv'&&!ch3On())||(rg==='ct'&&!ch4On()),open=!d.s&&!un&&regOpen(rg,i),[x,y]=p;
  if(un){g.save();g.globalAlpha=.85;circ(x,y,70,'#0c0f0e');g.restore();txt('?',x,y,30,'#4a5462','center');return}
  if(d.s){drawGlow(x,y,90,'w',.35);circ(x,y,30,'#2e6a40','#7fe0a0',3);txt(h.toll?'⛵':'⌂',x,y,24,'#dfffe8','center',false)}
  else{g.save();g.globalAlpha=.7;for(let k=0;k<5;k++)circ(x+Math.cos(k*1.3)*30,y+Math.sin(k*1.3)*20,40,'#5a645c');g.restore();circ(x,y,28,open?'#3a2e1a':'#2a2e30',open?'#ffcf6a':'#4a5462',3);txt(h.toll?'⚓':h.boss||h.heart?'☠':'✕',x,y,22,open?'#ffcf6a':'#7a8494','center',false);if(open){g.save();g.globalAlpha=.5+.5*Math.sin(frame*5);circ(x,y,40,null,'#ffcf6a',3);g.restore()}}
  if(R.anim&&R.anim.rg===rg&&R.anim.i===i){const a=Math.min(1,R.anim.t/2.5);g.save();g.globalAlpha=1-a;for(let k=0;k<8;k++)circ(x+Math.cos(k*.8)*(30+a*80),y+Math.sin(k*.8)*(20+a*60),36*(1-a)+4,'#5a645c');g.restore();for(let k=0;k<6;k++)txt('✦',x+Math.cos(k+frame*2)*60*a,y+Math.sin(k+frame*2)*50*a,20,'#fff3c0','center',false)}
  g.font='bold 14px sans-serif';const lb=LL(h.n),tw=g.measureText(lb).width+14;rr(x-tw/2,y+34,tw,22,10,'rgba(8,12,18,.82)');txt(lb,x,y+45,14,d.s?'#bfffd0':open?'#ffe7a0':'#9aa4b2','center',false);
  hotspot(x-60,y-50,120,110,()=>{worldSel={rg,i};AudioFx.cue('ui')},'wn_'+rg+i)}));
 if(R.raid&&ch2On()){const today=R.raid===R.day;rr(24,1076,330,36,12,today?'rgba(80,12,10,.92)':'rgba(14,18,28,.88)',today?'#ff7a6a':'#8a94a4',2);txt('🌙 '+L('항구 ','港口 ')+(today?L('오늘 밤 습격','今晚袭击'):L('다음 습격 ','下次袭击 ')+raidDays()+L('일 뒤','天后')),189,1094,16,today?'#ffd8d0':'#dfe6ee','center',false)}
 if(R.anim){R.anim.t+=1/60;if(R.anim.t>2.6)R.anim=null}
 const opts=[-1].concat(R.surv.filter(s2=>s2.id<3).map(s2=>s2.id));if(ch3On()&&opts.length>1)button(30,1200,330,84,L('동행 바꾸기','更换同行'),'blue',22,()=>{const c=opts.indexOf(R.comp===undefined?-1:R.comp);R.comp=opts[(c+1)%opts.length];persist()},{id:'w_comp'});
 button(ch3On()?390:150,1200,ch3On()?330:450,84,L('◀ 마을로','◀ 回村子'),'gold',24,()=>{sc='town'},{id:'w_close'});
 if(worldSel)worldSheet();if(guideTip)return}
function worldSheet(){const {rg,i}=worldSel,d=R[rg].d[i],h=({hb:HB,rv:RV,ct:CT})[rg][i],un=(rg==='rv'&&!ch3On())||(rg==='ct'&&!ch4On()),open=!d.s&&!un&&regOpen(rg,i);const y0=sheetBase(rg==='ct'?400:330);
 txt(LL(h.n),50,y0+44,30,'#ffe2a0','left');
 let st=un?L('아직 이야기가 닿지 않은 곳','故事尚未抵达之处'):d.s?(h.toll?L('통과 · 다리 사람들과 이웃','已通过 · 与桥下的人成了邻居'):L('되찾은 땅','已夺回')):!open?L('앞 구역을 먼저 되찾아야 해요','需先夺回前一个区域'):h.toll?L('다리 밑 사람들이 강을 막고 있다','桥下的人拦住了河'):h.heart?L('근원 심장 · 껍질 ','源心 · 外壳 ')+(d.sh===undefined?HEART_SHELL:d.sh):h.boss?L('감염됨 · 큰 둥지','感染中 · 巨巢'):L('감염됨 · 남은 둥지 ','感染中 · 剩余巢穴 ')+d.left;
 txt(st,50,y0+88,19,'#c9d2de','left',false);if(h.prod&&Object.keys(h.prod).length)txt(L('되찾으면 매일 아침: ','夺回后每天早上：')+costStr(h.prod,1),50,y0+122,17,'#9fb0c4','left',false);let y=y0+150;
 if(open&&h.toll){button(50,y,650,84,L('다리로 가서 협상하기','去桥边交涉'),'gold',24,()=>{worldSel=null;tollMsg=null;sc='toll'},{id:'ws_toll'});y+=96}
 else if(open){button(50,y,650,84,L('원정 떠나기','出发远征')+' ('+L('선단 짐 +','船队载货 +')+fleetN()*2+')',regGo()?'red':'gray',24,()=>{if(!regGo()){regWhy();return}worldSel=null;if(rg==='hb')startHarborD(i);else if(rg==='rv')startRiverD(i);else startCityD(i)},{id:'ws_go'});y+=96}
 if(rg==='rv'&&R.rv.d[1].s&&i===1){button(50,y,650,84,L('떠돌이 선단과 교환하기','与流浪船队交换'),'blue',22,()=>{worldSel=null;sc='rmap'},{id:'ws_trade'});y+=96}
 if(rg==='ct'&&!un){button(50,y,650,84,L('정화탄 만들기 (보유 ','制作净化弹（持有 ')+(R.res.bomb||0)+') · '+costStr(BOMB_COST),canPayC(BOMB_COST)?'green':'gray',20,bombMake,{id:'ws_bomb'});y+=96}
 if(rg==='hb'){button(50,y,650,70,L('마을에서 보기','在村子里查看'),'blue',20,()=>{worldSel=null;townSel=i;sc='town'},{id:'ws_town'});y+=82}
 button(50,y,650,70,L('닫기','关闭'),'dark',22,()=>{worldSel=null},{id:'ws_close'})}
// ---- 밤 습격 방어전: 방벽이 붙잡고, 망루·동료가 쏘고, 나는 탭해서 돕는다
let raid=null;
const TWR_COST={plank:4,scrap:3},BAR_MAX=30,ZONE_MAX=20;
function zEntry(i){const [x,y,w]=TZ[i];return {x:x+w/2,y:y+20}}
function zCenter(i){const [x,y,w,h]=TZ[i];return {x:x+w/2,y:y+h*.62}}
function towerPos(i){const [x,y,w,h]=TZ[i];return {x:x+w-48,y:y+h-26}}
function josa(w,a,b){const c=w.charCodeAt(w.length-1);return w+((c>=0xAC00&&c<=0xD7A3&&(c-0xAC00)%28)?a:b)}
function raidTargets(){return R.hb.d.map((d,i)=>i).filter(i=>R.hb.d[i].s)}
function raidDays(){return R.raid?Math.max(0,R.raid-R.day):-1}
function raidMorning(){if(!ch2On()||!raidTargets().length)return;if(!R.raid){R.raid=R.day+2;R.rgAsk=1;return}if(R.raid<R.day)R.raid=R.day;
 if(R.day===R.raid)popTip({head:'🌙 '+L('오늘 밤 습격','今晚袭击'),lines:[['해가 지면 회색 무리가 마을로 몰려온다. 습격은 밤이 되면 시작돼요.','天一黑，灰色尸群就会涌向村子。入夜后袭击开始。'],['방벽은 감염체를 붙잡아 두고, 망루와 동료는 다가오는 감염체를 쏴요. 구역을 탭해서 미리 지어 두세요.','路障能拖住丧尸，瞭望塔和伙伴会射击靠近的丧尸。点区域提前建好。'],['습격 중에는 감염체를 탭해서 쓰러뜨리고, 부서지는 방벽은 탭해서 판자로 고칠 수 있어요.','袭击时点丧尸可以击倒它们，点快坏的路障可以用木板修补。']],t:0});
 else if(R.day===R.raid-1)radioShow={l:['마루: 내일 밤 회색 무리가 움직일 것 같아요. 방벽과 망루를 점검해 두세요.','玛鲁：明晚灰色尸群可能会有动静。检查一下路障和瞭望塔。'],t:9}}
function raidStart(){const tg=raidTargets();if(!tg.length){R.raid=R.day+2;return}
 const n=Math.min(26,4+tg.length*3+Math.floor(R.day/6));raid={t:0,n,spawned:0,zs:[],zhp:{},lost:[],killed:0,shots:[]};tg.forEach(i=>{raid.zhp[i]=ZONE_MAX;const d=R.hb.d[i];if(d.bar&&!(d.bhp>0))d.bhp=BAR_MAX});
 R.ff=false;sleeping=false;sc='town';townSel=-1;worldSel=null;evCard=null;raid.tut=!R.raidTut;raid.taps=0;AudioFx.cue('thunder');vib('long');shake(10,.5);track('raid_start',{day:R.day,n,tg:tg.length});
 message(L('습격이다! 감염체를 탭해서 쓰러뜨려요!','袭击来了！点丧尸击倒它们！'),2.6)}
function raidSpawnPt(){const inf=R.hb.d.map((d,i)=>i).filter(i=>!R.hb.d[i].s);if(inf.length&&Math.random()<.45){const c=zCenter(inf[Math.floor(Math.random()*inf.length)]);return {x:c.x+(Math.random()-.5)*140,y:c.y-20}}
 const s=Math.random();if(s<.6)return {x:70+Math.random()*610,y:168};return {x:s<.8?-24:W+24,y:300+Math.random()*380}}
function raidShoot(px,py,range,dmg,col){const r=raid;let best=null,bd=range;for(const z of r.zs){if(z.hp<=0)continue;const d=Math.hypot(z.x-px,z.y-py);if(d<bd){bd=d;best=z}}
 if(!best)return false;best.hp-=dmg;best.hit=.25;r.shots.push({x1:px,y1:py,x2:best.x,y2:best.y-30,t:.16,col});if(best.hp<=0){r.killed++;fx.push({x:best.x,y:best.y-30,s:'✕',col:'#ffcf6a',t:0})}return true}
function raidTick(dt){const r=raid;r.t+=dt;
 if(r.spawned<r.n&&r.t>r.spawned*.85+1.2){const live=Object.keys(r.zhp).map(Number).filter(i=>!r.lost.includes(i));if(live.length){const p=raidSpawnPt(),ti=live[Math.floor(Math.random()*live.length)],run=Math.random()<Math.min(.4,R.day/60);r.zs.push({x:p.x,y:p.y,ti,hp:run?2:3,mx:run?2:3,sp:run?80:46,run,hit:0,st:'go',ph:Math.random()*6,face:1})}r.spawned++}
 for(const z of r.zs){if(z.hp<=0)continue;z.hit=Math.max(0,z.hit-dt);z.atk=false;if(r.lost.includes(z.ti)){const live=Object.keys(r.zhp).map(Number).filter(i=>!r.lost.includes(i));if(live.length){z.ti=live[0];z.st='go'}}
  const d=R.hb.d[z.ti],bar=d.bar&&d.bhp>0,tgt=z.st==='go'?zEntry(z.ti):zCenter(z.ti),dx=tgt.x-z.x,dy=tgt.y-z.y,dd=Math.hypot(dx,dy);
  if(dd>10){const k=(z.hit>0?-.5:1)*z.sp*dt/dd;z.x+=dx*k;z.y+=dy*k;if(Math.abs(dx)>4)z.face=dx>0?1:-1}
  else if(z.st==='go'){if(bar){z.atk=true;d.bhp=Math.max(0,d.bhp-1.1*dt);if(d.bhp<=0){message(L(HB[z.ti].n[0]+' 방벽이 무너졌다!',HB[z.ti].n[1]+'的路障被攻破了！'),1.8);shake(8,.3);vib('heavy');AudioFx.cue('hit')}}else z.st='in'}
  else{z.atk=true;r.zhp[z.ti]=Math.max(0,r.zhp[z.ti]-1.4*dt);if(r.zhp[z.ti]<=0&&!r.lost.includes(z.ti)){r.lost.push(z.ti);message(L(josa('「'+HB[z.ti].n[0]+'」','이','가')+' 회색에 덮였다!','「'+HB[z.ti].n[1]+'」被灰色吞没了！'),2.4);shake(14,.5);vib('heavy');AudioFx.cue('thunder')}}}
 R.hb.d.forEach((d,i)=>{if(R.tw&&R.tw[i]&&d.s&&!r.lost.includes(i)){d.twc=(d.twc||0)-dt;if(d.twc<=0){const p=towerPos(i);d.twc=raidShoot(p.x,p.y-70,300,1,'#ffe27a')?.75:.15}}});
 for(const s2 of R.surv){if(!s2.fed)continue;s2.rc=(s2.rc||0)-dt;if(s2.rc<=0){const p=survPos(s2.id);s2.rc=raidShoot(p.x,p.y-40,220,1,'#bfe8ff')?1.7:.2}}
 r.shots.forEach(s=>s.t-=dt);r.shots=r.shots.filter(s=>s.t>0);r.zs=r.zs.filter(z=>z.hp>0);
 const alive=Object.keys(r.zhp).filter(k=>!r.lost.includes(+k)).length;if((r.spawned>=r.n&&!r.zs.length)||!alive||r.t>r.n*.85+50){if(r.zs.length&&alive)message(L('동이 트자 감염체들이 물러났다','天亮了，丧尸退去了'),2);raidEnd()}}
function raidEnd(){const r=raid;raid=null;R.raid=R.day+3+(R.day%2);const lost=r.lost;
 lost.forEach(i=>{const d=R.hb.d[i];d.s=0;d.left=HB[i].boss?1:2;d.bar=0;d.bhp=0;if(HB[i].boss)d.bn=3;track('raid_lost',{i})});R.hb.d.forEach(d=>{if(d.bar)d.bhp=BAR_MAX});
 if(!lost.length){R.cnt.held++;R.raidWins=(R.raidWins||0)+1;giveR({scrap:2,plank:2});track('raid_win',{day:R.day,killed:r.killed});AudioFx.cue('win');vib('long');
  popTip({head:L('습격을 막아냈다!','击退了袭击！'),lines:[['감염체 '+r.killed+'마리를 쓰러뜨렸다. 마을은 무사하다.','击倒了'+r.killed+'只丧尸。村子安然无恙。'],['전리품: 고철 +2 · 판자 +2. 다음 습격은 '+(R.raid-R.day)+'일 뒤 밤.','战利品：废铁+2 · 木板+2。下次袭击在'+(R.raid-R.day)+'天后的夜里。']],t:0})}
 else popTip({head:L('구역을 잃었다','失去了区域'),lines:[[josa(lost.map(i=>'「'+HB[i].n[0]+'」').join(', '),'이','가')+' 다시 회색이 됐다. 원정을 가서 되찾아야 해요.',lost.map(i=>'「'+HB[i].n[1]+'」').join('、')+'又变灰了，需要远征夺回。'],['방벽은 감염체를 붙잡고, 망루는 쏴서 쓰러뜨려요. 둘 다 있으면 훨씬 쉬워요.','路障拖住丧尸，瞭望塔负责射杀。两样都有会轻松很多。']],t:0});
 persist()}
function raidTap(x,y){const r=raid;if(!r)return false;let best=null,bd=60;for(const z of r.zs){const d=Math.hypot(x-z.x,y-(z.y-30));if(d<bd){bd=d;best=z}}
 if(best){r.taps=(r.taps||0)+1;if(r.tut&&r.taps>=3){r.tut=false;R.raidTut=1}best.hp--;best.hit=.35;r.shots.push({x1:x,y1:y-6,x2:best.x,y2:best.y-30,t:.1,col:'#ffffff'});AudioFx.cue('hit');vib('light');shake(3,.08);if(best.hp<=0){r.killed++;fx.push({x:best.x,y:best.y-30,s:'✕',col:'#ffcf6a',t:0})}return true}
 for(const k in r.zhp){const i=+k,d=R.hb.d[i],e=zEntry(i);if(d.bar&&d.bhp<BAR_MAX&&Math.hypot(x-e.x,y-e.y)<74){if(R.res.plank>0){R.res.plank--;d.bhp=Math.min(BAR_MAX,d.bhp+10);fxText(e.x,e.y-34,L('수리 +10 (판자 -1)','修补 +10（木板-1）'),'#c8ffc8');AudioFx.cue('build')}else message(L('판자가 없어요','没有木板了'),1.2);return true}}
 return false}
function drawTower(i){const p=towerPos(i);g.fillStyle='#5a4028';g.fillRect(p.x-22,p.y-70,6,70);g.fillRect(p.x+16,p.y-70,6,70);g.strokeStyle='#3a2a18';g.lineWidth=3;g.beginPath();g.moveTo(p.x-19,p.y-10);g.lineTo(p.x+19,p.y-50);g.moveTo(p.x+19,p.y-10);g.lineTo(p.x-19,p.y-50);g.stroke();rr(p.x-30,p.y-84,60,16,4,'#7a5a3a','#2a1e14',2);g.fillStyle='#c84a3a';g.beginPath();g.moveTo(p.x,p.y-84);g.lineTo(p.x,p.y-112);g.lineTo(p.x+18,p.y-104);g.lineTo(p.x,p.y-98);g.fill();g.strokeStyle='#2a1e14';g.lineWidth=2;g.beginPath();g.moveTo(p.x,p.y-84);g.lineTo(p.x,p.y-112);g.stroke();if(isNight())drawGlow(p.x,p.y-92,40,'o',.6)}
function drawRaid(){const r=raid;for(const k in r.zhp){const i=+k,d=R.hb.d[i],e=zEntry(i),c=zCenter(i),lost=r.lost.includes(i);
  if(d.bar){const f=d.bhp/BAR_MAX;rr(e.x-54,e.y-40,108,11,5,'#1a1010','#000',1);rr(e.x-54,e.y-40,108*f,11,5,f>.5?'#7fe0a0':f>.25?'#ffcf6a':'#ff6a5a');if(f<1&&f>0&&Math.sin(frame*8)>0)txt('🔨',e.x+66,e.y-36,18,'#fff','center',false);if(f<=0)txt(L('무너짐','已攻破'),e.x,e.y-58,15,'#ff8a7a','center',false)}
  if(lost){g.save();g.globalAlpha=.45;const [x,y,w,h]=TZ[i];rr(x,y,w,h,18,'#3c463f');g.restore()}else{const f=r.zhp[i]/ZONE_MAX;if(f<1){rr(c.x-40,c.y-70,80,8,4,'#1a1010');rr(c.x-40,c.y-70,80*f,8,4,'#ff8a6a')}}}
 for(const z of r.zs.slice().sort((a,b)=>a.y-b.y)){g.save();if(z.hit>0)g.globalAlpha=.6+.4*Math.sin(frame*40);if(!sprite(z.run?'inf_runner':'inf_walker',z.atk?'attack':'walk',frame+z.ph,z.x,z.y,74,z.face,z.run?10:6))circ(z.x,z.y-30,18,'#6a7a6a','#111',3);g.restore();for(let k=0;k<z.mx;k++)circ(z.x-(z.mx-1)*6+k*12,z.y-82,4,k<z.hp?'#ff7a6a':'#3a4450','#111',1.5)}
 for(const s of r.shots){g.save();g.globalAlpha=Math.min(1,s.t/.12);g.strokeStyle=s.col;g.lineWidth=3;g.beginPath();g.moveTo(s.x1,s.y1);g.lineTo(s.x2,s.y2);g.stroke();g.restore()}
 rr(170,198,410,48,14,'rgba(70,10,8,.9)','#ff7a6a',2);txt('🌙 '+L('습격! 남은 감염체 ','袭击！剩余丧尸 ')+Math.max(0,r.n-r.killed),375,222,21,'#ffe0d8','center');
 if(r.tut&&r.zs.length){const z=r.zs.slice().sort((a,b)=>b.y-a.y)[0];g.font='bold 17px sans-serif';const cap=L('감염체를 탭해서 쓰러뜨려요!','点丧尸把它击倒！'),tw=g.measureText(cap).width+28;rr(z.x-tw/2,z.y-150,tw,40,14,'rgba(255,214,110,.95)','#5a3a10',2);txt(cap,z.x,z.y-130,17,'#2a1a06','center',false);drawFinger(z.x,z.y-40)}}
// ---- 마을 길잡이 · 습격 안내서
let rgFrom='town';
function guideTarget(){if(!ch2On())return null;const hb=R.hb;
 if(R.q2<CH2.length){const q=R.q2,zi={0:0,2:1,4:2,6:3}[q];
  if(zi!==undefined&&!hb.d[zi].s){const [x,y,w,h]=TZ[zi];return {x:x+w/2,y:y+h*.55,t:L('여기를 탭 → [원정 떠나기]','点这里 → [出发远征]')}}
  if(q===1){const i=hb.d.findIndex(d=>d.s&&!d.bar);if(i>=0){const [x,y,w,h]=TZ[i];return {x:x+w/2,y:y+h*.55,t:L('되찾은 구역을 탭 → [방벽 세우기]','点已夺回的区域 → [建路障]')}}}
  if(q===3){const i=hb.d.findIndex((d,k)=>d.s&&!(R.tw&&R.tw[k]));if(i>=0){const [x,y,w,h]=TZ[i];return {x:x+w/2,y:y+h*.55,t:L('탭 → [망루 세우기] · 밤 습격 대비','点击 → [建瞭望塔] · 防备夜袭')}}return null}
  if(q===5)return {x:129,y:1180,t:L('뗏목으로 가서 갑판 넓히기','去木筏上扩建甲板'),up:1}
  return null}
 if(ch3On()&&!ch4On()&&R.q3<2&&!R.rv.d[0].s)return {x:374,y:1180,t:L('[지도]에서 강으로 올라가요','在[地图]里沿河而上'),up:1};
 if(ch4On()&&R.q4<1)return {x:374,y:1180,t:L('[지도]에서 도시로 가요','在[地图]里前往城市'),up:1};return null}
function drawGuideFinger(){if(townSel>=0||raid||guideTip||evCard)return;const t=guideTarget();if(!t)return;
 g.font='bold 17px sans-serif';const tw=g.measureText(t.t).width+28,by=t.up?t.y-96:t.y-112;rr(t.x-tw/2,by,tw,40,14,'rgba(255,214,110,.95)','#5a3a10',2);txt(t.t,t.x,by+20,17,'#2a1a06','center',false);drawFinger(t.x,t.up?t.y-28:t.y-30)}
function drawTowerAt(px,py,s){g.save();g.translate(px,py);g.scale(s,s);g.fillStyle='#5a4028';g.fillRect(-22,-70,6,70);g.fillRect(16,-70,6,70);g.strokeStyle='#3a2a18';g.lineWidth=3;g.beginPath();g.moveTo(-19,-10);g.lineTo(19,-50);g.moveTo(19,-10);g.lineTo(-19,-50);g.stroke();rr(-30,-84,60,16,4,'#7a5a3a','#2a1e14',2);g.fillStyle='#c84a3a';g.beginPath();g.moveTo(0,-84);g.lineTo(0,-112);g.lineTo(18,-104);g.lineTo(0,-98);g.fill();g.restore()}
function raidGuideScreen(){bannerT=0;g.fillStyle='rgba(6,8,14,.96)';g.fillRect(0,0,W,H);txt('🌙 '+L('밤 습격이란?','什么是夜袭？'),375,66,32,'#ffe2a0','center');
 para(L('되찾은 땅은 며칠마다 밤에 회색 무리의 습격을 받아요. 다음 습격 날짜는 마을 화면 위에 표시돼요.','夺回的土地每隔几天就会在夜里遭到灰色尸群袭击。下次袭击日期显示在村子画面上方。'),375,120,18,'#c9d2de',660,28,'center');
 const P=[[L('① 방벽이 입구에서 붙잡아요','① 路障在入口拖住丧尸'),L('방벽이 버티는 동안 감염체는 안으로 못 들어와요. 무너지면 구역 안으로 쏟아져요.','路障撑住时丧尸进不来，一旦攻破就会涌入区域。')],
  [L('② 망루와 동료가 자동으로 쏴요','② 瞭望塔和伙伴会自动射击'),L('구역마다 망루를 하나씩 세울 수 있어요. 배부른 동료도 함께 싸워요.','每个区域可建一座瞭望塔。吃饱的伙伴也会一起战斗。')],
  [L('③ 나는 탭해서 도와요','③ 我点击来帮忙'),L('감염체를 탭하면 공격, 금 간 방벽을 탭하면 판자 1개로 수리해요.','点丧尸就能攻击，点快坏的路障用1块木板修补。')]];
 P.forEach((p,k)=>{const y=180+k*300;rr(30,y,690,280,18,'#141a28','#3a4458',2);txt(p[0],56,y+34,22,'#ffe7a0','left');para(p[1],56,y+232,16,'#b8c4d4',640,24,'left');
  const cy=y+150,t=frame;
  if(k===0){if(!wsp('barricade',375,cy+20,170))rr(300,cy,150,26,4,'#6a5038');rr(325,cy-46,100,10,5,'#1a1010');rr(325,cy-46,100*(.55+.2*Math.sin(t)),10,5,'#7fe0a0');for(let j=0;j<3;j++){const zx=250+j*120,zy=cy-10+Math.sin(t*3+j)*3;sprite('inf_walker','attack',t+j,zx,zy,62,zx<375?1:-1,6)}}
  if(k===1){drawTowerAt(150,cy+60,.9);for(let j=0;j<3;j++){const zx=430+j*90,zy=cy+30;sprite('inf_walker','walk',t+j,zx,zy,60,-1,6);if(Math.sin(t*6+j*2)>.3){g.strokeStyle='#ffe27a';g.lineWidth=3;g.beginPath();g.moveTo(150,cy-20);g.lineTo(zx,zy-28);g.stroke()}}sprite('surv0','idle',t,260,cy+60,70,1,6)}
  if(k===2){sprite('inf_walker','walk',t,300,cy+40,70,1,6);drawFinger(300,cy-10);if(!wsp('barricade',530,cy+40,130))rr(470,cy+20,120,22,4,'#6a5038');rr(480,cy-30,100,10,5,'#1a1010');rr(480,cy-30,100*(.3+.6*((t*.5)%1)),10,5,'#ffcf6a');txt('🔨',600,cy-20,26,'#fff','center',false)}});
 para(L('방어가 무너진 구역은 다시 회색이 되어 원정을 가야 해요. 막아내면 고철·판자를 얻어요.','防线失守的区域会重新变灰，需要再去远征。守住就能获得废铁和木板。'),375,1110,18,'#ffd0c0',660,28,'center');
 button(150,1190,450,84,L('알겠어요','明白了'),'gold',26,()=>{R.rgSeen=1;persist();sc=rgFrom},{id:'rg_ok'})}
// ---- 3장 「강을 거슬러」
const RV=[{n:['갈대 어촌','芦苇渔村'],nests:3,z:6,prod:{cooked:1,rope:1}},{n:['무너진 다리','断桥'],toll:true,prod:{}},{n:['강변 제재소','河边锯木厂'],nests:4,z:8,prod:{plank:3}},{n:['상류 정수장','上游净水厂'],nests:1,boss:true,z:7,prod:{water:3,med:1}}];
const TOLL={cooked:3,rope:2},TOLL_CF={coffee:2};
const TRADES=[{g:{cooked:3},r:{scrap:2}},{g:{plank:4},r:{rope:2}},{g:{cloth:3},r:{med:1}},{g:{coffee:1},r:{scrap:3}}];
const RADIO3=[['강 무전: …거기 정말 사람이 삽니까? 여기는 상류 제재소. 톱밥과 빗물로 버티는 중입니다.','河上电台：……那边真的有人活着吗？这里是上游锯木厂，靠锯末和雨水撑着。'],
 ['강 무전: 강 하구 갈대 어촌에 둥지가 있습니다. 거길 지나야 올라올 수 있어요.','河上电台：河口的芦苇渔村有巢穴，得先过那里才能上来。'],
 ['강 무전: 무너진 다리 밑에 배를 묶고 통행료를 받는 사람들이 있어요. 나쁜 사람들은 아닙니다. 배가 고플 뿐.','河上电台：断桥下面有人拦船收过路费。他们不是坏人，只是饿。'],
 ['강 무전: 혹시 유나라는 정비공을 보셨습니까. 제 딸입니다.','河上电台：您见过一个叫柔娜的机修工吗？那是我女儿。'],
 ['강 무전: 회색 물은 정수장에서 내려옵니다. 뿌리가 거기 있어요.','河上电台：灰色的水是从净水厂流下来的。病根就在那里。']];
const CH3=[{t:['갈대 어촌의 둥지를 태워 되찾기','烧掉芦苇渔村的巢穴，夺回渔村'],p:()=>[R.rv.d[0].s?1:0,1],r:{cooked:2,rope:2},s:['갈대밭 사이로 강이 보인다. 바다와 달리 강에는 양쪽에 땅이 있다. 그게 무섭다.','芦苇丛间能看见河。和海不同，河的两岸都是陆地。这让人害怕。']},
 {t:['커피 드리퍼 짓기','建造咖啡滤杯'],b:'coffee',p:()=>[hasM('coffee')?1:0,1],r:{berry:4,water:2},s:['유나: "세상이 망했는데 이걸 왜 만들어요?" 도하: "망했으니까 만들죠."','柔娜："世界都完了，做这个干嘛？" 道河："就是因为完了才做。"']},
 {t:['커피 한 잔 내려 마시기','冲一杯咖啡喝掉'],p:()=>[R.cnt.coffee,1],r:{scrap:2},s:['쓰고, 탄내가 나고, 정체를 알 수 없다. 그런데 모두가 한 모금씩 달라고 했다.','又苦又焦，来历不明。可每个人都想尝一口。']},
 {t:['무너진 다리 지나가기','通过断桥'],p:()=>[R.rv.d[1].s?1:0,1],r:{can:2},s:['다리 밑 사람들이 손을 흔들었다. 적이 아니라 이웃이 하나 생긴 셈이다.','桥下的人挥了挥手。不是敌人，算是多了个邻居。']},
 {t:['떠돌이 선단과 2번 교환하기','和流浪船队交换2次'],p:()=>[R.rv.trades,2],r:{rope:2,cloth:2},s:['물건이 오가자 말이 오갔다. 말이 오가자 소문이 퍼졌다. "하구에 불 켜진 항구가 있다."','货物往来，话也往来。话一往来，消息就传开了："河口有座亮着灯的港口。"']},
 {t:['강변 제재소 되찾기','夺回河边锯木厂'],p:()=>[R.rv.d[2].s?1:0,1],r:{plank:6},s:['한수가 유나를 한참 안고 있었다. 아무도 재촉하지 않았다.','韩洙抱着柔娜抱了很久。没有人催。']},
 {t:['상류 정수장의 회색 뿌리 태우기','烧掉上游净水厂的灰色根'],p:()=>[R.rv.d[3].s?1:0,1],r:{},s:['뿌리가 타자 강물 색이 바뀌었다. 하류의 항구까지 맑은 물이 내려갔다.','根烧掉后，河水变了颜色。清水一直流到下游的港口。']}];
const COFFEE_L=[['쓰다. 그런데 이게 문명이다.','苦。但这就是文明。'],['세상은 망했지만 카페인은 남았다.','世界完了，咖啡因还在。'],['손이 떨린다. 일은 빨라졌다.','手在抖。干活倒是快了。'],['탄 열매 국물이라는 의견이 있었으나 기각되었다.','有人说这是烧焦的果子汤，意见被驳回。'],['눈이 번쩍 뜨인다. 좀비도 이 맛은 모를 거다.','眼睛一下子亮了。丧尸可不懂这个味道。']];
let tollMsg=null;
function ch3On(){return ch2On()&&R.q2>=CH2.length}
function buffOn(){return (R.buff||0)>0}
function compId(){const c2=R.comp;return ch3On()&&c2>=0&&R.surv.some(s2=>s2.id===c2&&s2.fed)?c2:-1}
function drinkCoffee(){const r=R.res,v=R.vit;if(!(r.coffee>0)){message(L('커피가 없어요. 커피 드리퍼를 탭해 내리세요 (열매 2 · 물 1)','没有咖啡。点咖啡滤杯冲一杯（野果2 · 水1）'),1.8);return}
 r.coffee--;R.buff=90;R.cnt.coffee++;R.today.cf=(R.today.cf||0)+1;v.temp=Math.min(100,v.temp+8);v.thirst=Math.min(100,v.thirst+5);sleeping=false;heroDo('drink');AudioFx.cue('win');vib('light');track('coffee',{day:R.day,n:R.cnt.coffee});
 if(R.today.cf>=3){v.hp=Math.max(5,v.hp-4);message(L('오늘 세 잔째. 심장이 감염체보다 빨리 뛴다. (체력 -4)','今天第三杯了。心跳得比丧尸还快。（体力-4）'),2.6)}
 else message(LL(COFFEE_L[(R.cnt.coffee-1)%COFFEE_L.length])+L(' (90초 동안 빨라져요)','（90秒内动作变快）'),2.6)}
function reclaimR(di){const d=R.rv.d[di],h=RV[di];R.anim={rg:'rv',i:di,t:0};if(sc==='town'||sc==='sea'){sc='world';setTimeout(()=>{if(sc==='world'&&!worldSel)sc='town'},2800)}d.s=2;d.left=0;R.rv.max=Math.max(R.rv.max,di);track('reclaim_river',{di,day:R.day});setTimeout(()=>gotDoc(5+di),600);AudioFx.cue('win');vib('long');
 const ls=h.toll?[['다리 밑 사람들이 길을 터 주었다. 이제 상류로 올라갈 수 있어요.','桥下的人让开了水路。现在可以往上游去了。'],['[지도]의 강 화면에서 떠돌이 선단과 물건을 바꿀 수 있어요. (하루 3번)','在[地图]的河流页面可以和流浪船队交换物资。（每天3次）']]:[[josa('「'+h.n[0]+'」','을','를')+' 되찾았다! 강물이 조금 맑아졌다.','「'+h.n[1]+'」夺回来了！河水清了一些。'],['매일 아침 보급: '+costStr(h.prod,1),'每天早上补给：'+costStr(h.prod,1)]];
 popTip({head:h.toll?L('다리 통과','通过断桥'):L('구역 수복','夺回区域'),lines:ls,t:0});if(di===2)addSurvivor(3);persist()}
function startRiverD(di){const h=RV[di],d=R.rv.d[di];markLand();R.cnt.lands++;save.stats.lands++;mission('land');track('land_start',{day:R.day,river:true,di,comp:compId()});let s=R.day*419+di*89+11;const rnd=()=>{s=(s*16807)%2147483647;return (s%10000)/10000};
 const objs=[];if(h.boss)objs.push({k:'nest',big:true,root:true,x:375,y:520,n:d.bn||8});else for(let j=0;j<d.left;j++)objs.push({k:'nest',x:j%2?520:230,y:470+j*Math.floor(900/Math.max(1,d.left)),n:2});
 for(let i=0;i<6;i++)objs.push({k:'tree',x:70+rnd()*610,y:380+rnd()*1100,hp:3});for(let i=0;i<4;i++)objs.push({k:'bush',x:90+rnd()*570,y:500+rnd()*1000,n:1});for(let i=0;i<4;i++)objs.push({k:'crate',x:160+rnd()*430,y:620+i*230+rnd()*60,n:1});
 const zs=[];for(let i=0;i<h.z;i++){const x=120+rnd()*510,y=400+i*Math.floor(1050/h.z);zs.push({x,y,hx:x,hy:y,hp:3,a:0,hit:0,w:rnd()*6,run:i%3===1})}
 Land={type:'river',reg:'rv',di,p:{x:375,y:1760,tx:375,ty:1760,hit:0},objs,zs,carry:{},n:0,cap:(R.sail?16:12)+fleetN()*2,noise:0,target:null,work:0,atk:0,nightSpawn:false,lit:false,clear:false};sc='land';camY=LAND_H-H;
 tip('river',[['강가는 섬처럼 나무와 열매가 있지만, 둥지도 함께 있어요. 태운 만큼은 물러났다 다시 와도 그대로예요.','河岸像小岛一样有树和野果，但也有巢穴。烧掉的部分，撤退后再来也不会恢复。'],['[지도]에서 동행을 고르면 동료 한 명이 따라와 도와줘요.','在[地图]里选择同行，会有一名伙伴跟着帮忙。']])}
function tollPay(mode){const rv=R.rv,v=R.vit;if(rv.d[1].s)return;
 if(mode===0){if(!canPayC(TOLL)){message(L('재료가 모자라요: ','材料不够：')+costStr(TOLL),2);return}payC(TOLL);tollMsg=['두목: "구운 생선이라. 오랜만에 사람 먹는 걸 먹네. 지나가라."','头目："烤鱼啊。好久没吃人吃的东西了。过去吧。"']}
 else if(mode===1){if(!canPayC(TOLL_CF)){message(L('커피 2잔이 필요해요. 커피 드리퍼에서 내리세요','需要2杯咖啡。用咖啡滤杯冲'),2);return}payC(TOLL_CF);R.res.scrap=(R.res.scrap||0)+3;tollMsg=['두목: "이게… 커피냐? 3년 만이다." 한참 말이 없더니 고철 3개를 얹어 주었다. "자주 와라."','头目："这是……咖啡？三年没喝了。"他沉默了很久，又塞给你3块废铁。"常来。"']}
 else{if(R.t<DUSK){message(L('몰래 지나가려면 해질녘까지 기다려야 해요','想偷偷过去，得等到黄昏'),2);return}if(rv.sneak===R.day){message(L('오늘은 이미 들켰어요. 내일 다시','今天已经被发现了，明天再试'),2);return}
  if(Math.random()<.5){tollMsg=['어둠을 틈타 다리 밑을 빠져나왔다. 뒤에서 누군가 웃었다. "다음엔 그냥 말로 해라."','趁着夜色从桥下溜了过去。身后有人笑了："下次直接开口说。"']}
  else{rv.sneak=R.day;v.hp=Math.max(5,v.hp-20);R.res.plank=Math.max(0,(R.res.plank||0)-3);shake(12,.4);vib('heavy');AudioFx.cue('hurt');track('toll_fail',{});message(L('들켰다! 갈고리에 배가 긁혔다 (체력 -20 · 판자 -3)','被发现了！船被钩子刮坏（体力-20 · 木板-3）'),2.6);return}}
 track('toll',{mode,day:R.day});reclaimR(1)}
function tradeLeft(){const rv=R.rv;if(!rv.td||rv.td.day!==R.day)rv.td={day:R.day,n:0};return 3-rv.td.n}
function tradeDo(i){const t=TRADES[i];if(!R.rv.d[1].s)return false;if(tradeLeft()<=0){message(L('오늘 교환은 끝났어요 (하루 3번)','今天的交换次数用完了（每天3次）'),1.6);return false}if(!canPayC(t.g)){message(L('내줄 물건이 모자라요: ','要给的东西不够：')+costStr(t.g),1.6);return false}
 payC(t.g);for(const k in t.r)R.res[k]=(R.res[k]||0)+t.r[k];R.rv.td.n++;R.rv.trades++;AudioFx.cue('pick');vib('light');track('trade',{i,day:R.day});persist();return true}
function mapTabs(cur){if(!ch3On())return;const t=[['hmap',L('항구','港口'),'tab_h'],['rmap',L('강','河流'),'tab_r']];if(ch4On())t.push(['cmap',L('도시','城市'),'tab_c']);const w=t.length>2?180:220,x0=375-(t.length*w+(t.length-1)*10)/2;t.forEach((b,i)=>button(x0+i*(w+10),1104,w,76,b[1],cur===b[0]?'gold':'dark',24,()=>{sc=b[0];AudioFx.cue('ui')},{id:b[2]}))}
function rmapScreen(){g.fillStyle='rgba(5,8,14,.95)';g.fillRect(0,0,W,H);txt(L('잿빛 강','灰河'),375,60,38,'#ffe2a0','center');const rv=R.rv,rec=rv.d.filter(d=>d.s).length,cp=compId();
 txt(L('상류로 ','溯河 ')+rec+'/4'+L('  ·  동행: ','  ·  同行：')+(cp>=0?LL(SURV[cp].n):L('혼자','独自')),375,104,20,'#c9d2de','center',false);
 const go=R.t<112&&canLand()&&!inStorm(),why=()=>message(!canLand()?L('오늘 원정은 두 번까지예요. 내일 다시 가요','今天最多远征两次，明天再去'):L('해가 지기 전엔 돌아올 수 없어요','天黑前回不来'),1.6);
 RV.forEach((h,i)=>{const d=rv.d[i],y=130+i*146,open=i<=rv.max+1,col=d.s?'#7fe0a0':open?'#ffcf6a':'#4a5462';rr(30,y,690,134,16,d.s?'#12261c':open?'#221c12':'#14181e',col,3);
  txt((d.s?'● ':open?'◐ ':'○ ')+LL(h.n),56,y+34,27,d.s?'#dfffe8':open?'#fff':'#7a8494','left',false);
  txt(d.s?(h.toll?L('통과 · 떠돌이 선단과 교환 가능','已通过 · 可与流浪船队交换'):L('되찾음','已夺回')):open?(h.toll?L('다리 밑 사람들이 길을 막고 있다','桥下的人拦着水路'):h.boss?L('감염됨 · 회색 뿌리','感染中 · 灰色根'):L('감염됨 · 남은 둥지 ','感染中 · 剩余巢穴 ')+d.left):L('아래쪽을 먼저 지나야 해요','需先通过下游'),56,y+74,18,'#c9d2de','left',false);
  if(!h.toll)txt(L('매일 아침: ','每天早上：')+costStr(h.prod,1),56,y+108,16,'#9fb0c4','left',false);
  if(!d.s&&open){if(h.toll)button(520,y+26,180,82,L('협상','交涉'),'gold',26,()=>{tollMsg=null;sc='toll';AudioFx.cue('ui')},{id:'rv_toll'});else button(520,y+26,180,82,L('원정','远征'),go?'red':'gray',26,()=>{if(go)startRiverD(i);else why()},{id:'rv_go'+i})}});
 compPicker(722);let y=856;if(rv.d[1].s){txt(L('떠돌이 선단 교환 · 오늘 ','流浪船队交换 · 今天还剩 ')+tradeLeft()+L('번 남음','次'),40,y+12,18,'#ffe7a0','left',false);
  TRADES.forEach((t,i)=>{const x=30+(i%2)*350,yy=y+32+Math.floor(i/2)*84,ok=canPayC(t.g)&&tradeLeft()>0;button(x,yy,340,74,costStr(t.g)+' → '+costStr(t.r),ok?'blue':'gray',19,()=>{if(tradeDo(i))message(L('교환했다: ','换到了：')+costStr(t.r,1),1.4)},{id:'trade'+i})})}
 else{rr(30,y+10,690,150,14,'#14181e','#2a3240',2);para(L('다리를 지나면 떠돌이 선단과 물건을 바꿀 수 있어요.','通过断桥后，可以和流浪船队交换物资。'),375,y+84,19,'#7a8494',600,30,'center')}
 mapTabs('rmap');button(150,1200,450,84,L('◀ 닫기','◀ 关闭'),'gold',26,()=>{sc='world'},{id:'rv_close'})}
function tollScreen(){g.fillStyle='rgba(5,8,14,.95)';g.fillRect(0,0,W,H);txt(L('무너진 다리','断桥'),375,120,40,'#ffe2a0','center');
 g.strokeStyle='#5a5650';g.lineWidth=18;g.beginPath();g.moveTo(40,300);g.lineTo(300,300);g.lineTo(350,340);g.moveTo(710,300);g.lineTo(470,300);g.lineTo(430,350);g.stroke();g.fillStyle='#3a3834';g.fillRect(120,300,22,90);g.fillRect(600,300,22,90);g.fillStyle='#15616e';g.fillRect(40,390,670,26);for(let i=0;i<3;i++){rr(250+i*90,366,70,26,8,'#7a5c3e','#2a1e14',3);drawGlow(285+i*90,356,26,'o',.8)}
 para(tollMsg?LL(tollMsg):L('다리 밑에 배 세 척이 밧줄로 강을 막고 있다.\n두목: "여긴 우리 강이다. 지나가려면 뭘 좀 내놔. 먹을 거면 더 좋고."','桥下三艘船用绳子拦住了河。\n头目："这是我们的河。想过去就留点东西。吃的更好。"'),375,480,23,'#f0eee4',600,38,'center');
 if(R.rv.d[1].s){button(150,1040,450,90,L('강을 올라가자','继续溯河'),'gold',28,()=>{sc='rmap'},{id:'toll_ok'});return}
 const o=[[L('통행료 내기 · ','交过路费 · ')+costStr(TOLL),canPayC(TOLL)?'gold':'gray'],[L('커피 대접하기 · ','请喝咖啡 · ')+costStr(TOLL_CF),canPayC(TOLL_CF)?'green':'gray'],[L('해질녘에 몰래 지나가기 (절반은 들켜요)','黄昏时偷偷过去（一半几率被发现）'),R.t>=DUSK?'red':'gray']];
 o.forEach((b,i)=>button(75,700+i*110,600,92,b[0],b[1],22,()=>tollPay(i),{id:'toll'+i}));
 button(150,1200,450,84,L('◀ 돌아가기','◀ 返回'),'dark',26,()=>{sc='rmap'},{id:'toll_back'})}
// ---- 4장 「회색 심장」
const CT=[{n:['외곽 고속도로','城郊高速'],nests:3,z:8,prod:{scrap:3}},{n:['시립 병원','市立医院'],nests:4,z:9,prod:{med:1,cloth:2}},{n:['공항 활주로','机场跑道'],nests:4,z:10,prod:{plastic:3,rope:1}},{n:['도심','市中心'],heart:true,z:9,prod:{can:2,plank:2}}];
const BOMB_COST={plastic:2,water:3,scrap:2},HEART_SHELL=3,HEART_CORE=8;
const RADIO4=[['도시 무전: …여기는 시립 병원 지하. 의사 서린입니다. 아직 숨 쉬는 사람이 열둘이에요.','城市电台：……这里是市立医院地下。我是医生书林。还有十二个人在喘气。'],
 ['도시 무전: 회색 껍질은 불로는 안 탑니다. 바닷물을 졸인 소금으로 정화탄을 만들어 던지면 녹아요.','城市电台：灰色的外壳烧不掉。把海水熬成盐做成净化弹扔过去，就能融化。'],
 ['도시 무전: 고속도로는 차가 막혀서 감염체가 갇혀 있어요. 소리만 조심하면 됩니다.','城市电台：高速公路被车堵死了，丧尸被困在里面。小心别弄出声音就行。'],
 ['도시 무전: 공항에 작은 비행기 한 대가 남아 있어요. 당신이 타고 떠났던 그 비행기요.','城市电台：机场还剩一架小飞机。就是你当初坐着逃走的那架。'],
 ['도시 무전: 근원 심장은 도심 한가운데, 당신이 처음 도망쳤던 그 거리에 있습니다.','城市电台：源心在市中心，就在你当初逃离的那条街上。']];
const CH4=[{t:['외곽 고속도로 되찾기','夺回城郊高速'],p:()=>[R.ct.d[0].s?1:0,1],r:{scrap:3,plastic:2},s:['멈춰 선 차들 사이로 바람이 지나갔다. 도시가 가까워질수록 모두 말이 없어졌다.','风从停滞的车流间穿过。离城市越近，大家越沉默。']},
 {t:['정화탄 3개 만들기','制作3枚净化弹'],p:()=>[R.cnt.bomb,3],r:{water:3},s:['유나: "소금으로 만든 폭탄이라니." 도하: "어부한텐 제일 익숙한 무기지."','柔娜："用盐做的炸弹。" 道河："对渔夫来说，这是最顺手的武器。"']},
 {t:['시립 병원 되찾기','夺回市立医院'],p:()=>[R.ct.d[1].s?1:0,1],r:{med:2,can:2},s:['지하에서 열두 명이 올라왔다. 맨 앞의 의사가 햇빛에 눈을 찡그렸다.','十二个人从地下走了上来。走在最前面的医生在阳光下眯起了眼。']},
 {t:['공항 활주로 되찾기','夺回机场跑道'],p:()=>[R.ct.d[2].s?1:0,1],r:{rope:3,plank:4},s:['그 비행기가 그대로 있었다. 조종석에는 출발 전에 두고 간 물병이 아직 있었다.','那架飞机还在原地。驾驶座上，出发前留下的水瓶还在。']},
 {t:['도심의 근원 심장 태우기','烧掉市中心的源心'],p:()=>[R.ct.d[3].s?1:0,1],r:{},s:['','']}];
let endFx=0;
function ch4On(){return ch3On()&&R.q3>=CH3.length}
function reclaimC(di){const d=R.ct.d[di],h=CT[di];R.anim={rg:'ct',i:di,t:0};if(sc==='town'||sc==='sea'){sc='world';setTimeout(()=>{if(sc==='world'&&!worldSel)sc='town'},2800)}d.s=2;d.left=0;R.ct.max=Math.max(R.ct.max,di);track('reclaim_city',{di,day:R.day});setTimeout(()=>gotDoc(9+di),600);AudioFx.cue('win');vib('long');
 popTip({head:L('구역 수복','夺回区域'),lines:[[josa('「'+h.n[0]+'」','을','를')+' 되찾았다! 도시에 색이 하나 돌아왔다.','「'+h.n[1]+'」夺回来了！城市恢复了一抹颜色。'],['매일 아침 보급: '+costStr(h.prod,1),'每天早上补给：'+costStr(h.prod,1)]],t:0});if(di===1)addSurvivor(4);persist()}
function cityMorning(){if(!ch4On())return;const v=R.vit;if(R.surv.some(s2=>s2.id===4&&s2.fed)&&v.hp<100){v.hp=Math.min(100,v.hp+20);fxText(RAFT_X,RAFT_Y-60,L('서린: 체력 +20','书林：体力 +20'),'#c8ffc8')}
 if(R.ended&&R.day>=(R.regrow||0)){R.regrow=R.day+6;const cand=[];['rv','ct'].forEach(rg=>R[rg].d.forEach((d,i)=>{const h=(rg==='rv'?RV:CT)[i];if(d.s&&!h.toll&&!h.boss&&!h.heart)cand.push([rg,i])}));if(cand.length&&R.day>(R.endDay||0)+2){const [rg,i]=cand[(R.day*7)%cand.length],d=R[rg].d[i];d.s=0;d.left=1;track('regrow',{rg,i});AudioFx.cue('thunder');popTip({head:L('회색 잔당','灰色残党'),lines:[['심장은 멎었지만, 「'+(rg==='rv'?RV:CT)[i].n[0]+'」에 작은 둥지가 다시 돋았다.','源心停跳了，但「'+(rg==='rv'?RV:CT)[i].n[1]+'」又冒出了一个小巢。'],['[지도]에서 원정을 가 태우세요. 되찾은 땅은 지켜야 남아요.','去[地图]出发烧掉它。夺回的土地要守住才算数。']],t:0})}}}
function bombMake(){if(!canPayC(BOMB_COST)){message(L('재료가 모자라요: ','材料不够：')+costStr(BOMB_COST),1.8);return}payC(BOMB_COST);R.res.bomb=(R.res.bomb||0)+1;R.cnt.bomb++;AudioFx.cue('build');vib('medium');track('bomb_craft',{n:R.cnt.bomb});persist()}
function startCityD(di){const h=CT[di],d=R.ct.d[di];markLand();R.cnt.lands++;save.stats.lands++;mission('land');track('land_start',{day:R.day,city:true,di,comp:compId()});let s=R.day*523+di*97+13;const rnd=()=>{s=(s*16807)%2147483647;return (s%10000)/10000};
 const objs=[];if(h.heart)objs.push({k:'nest',big:true,heart:true,x:375,y:560,n:d.bn===undefined?HEART_CORE:d.bn,shell:d.sh===undefined?HEART_SHELL:d.sh});else for(let j=0;j<d.left;j++)objs.push({k:'nest',x:j%2?500:250,y:480+j*Math.floor(900/Math.max(1,d.left)),n:2});
 for(let i=0;i<5;i++)objs.push({k:'crate',x:230+rnd()*290,y:660+i*200+rnd()*60,n:1});
 const zs=[];for(let i=0;i<h.z;i++){const x=200+rnd()*350,y=420+i*Math.floor(1050/h.z);zs.push({x,y,hx:x,hy:y,hp:3,a:0,hit:0,w:rnd()*6,run:i%3===2})}
 Land={type:'city',reg:'ct',di,allin:!!h.heart,p:{x:375,y:1760,tx:375,ty:1760,hit:0},objs,zs,carry:{},n:0,cap:(R.sail?16:12)+fleetN()*2,noise:0,target:null,work:0,atk:0,nightSpawn:false,lit:false,clear:false};sc='land';camY=LAND_H-H;
 if(h.heart)popTip({head:L('근원 심장','源心'),lines:[['회색 껍질 '+(d.sh===undefined?HEART_SHELL:d.sh)+'겹은 불에 타지 않아요. 심장을 탭하면 정화탄을 하나씩 던져 껍질을 녹여요.',''+(d.sh===undefined?HEART_SHELL:d.sh)+'层灰色外壳烧不掉。点击源心，会一枚一枚扔出净化弹融化外壳。'],['껍질이 다 녹으면 핵을 태울 수 있어요. 태운 만큼은 물러났다 와도 그대로예요.','外壳全部融化后就能烧核心。烧掉的部分，撤退后再来也不会恢复。'],['이번엔 동료 모두가 함께 싸워요. 받는 피해 -30%.','这次全体伙伴一起作战。受到伤害-30%。']],t:0});
 else tip('city',[['도시는 섬보다 감염체가 많아요. 상자를 열고 둥지를 태운 뒤 바로 배로 돌아오세요.','城市里的丧尸比小岛多。开箱子、烧巢穴，然后立刻回船。'],['[지도]의 도시 화면에서 정화탄을 만들 수 있어요.','可以在[地图]的城市页面制作净化弹。']])}
function compPicker(y){const cp=compId();txt(L('원정 동행 (한 명)','远征同行（一人）'),40,y+14,18,'#ffe7a0','left',false);const opts=[-1].concat(R.surv.filter(s2=>s2.id<3).map(s2=>s2.id)),bw=Math.min(170,Math.floor(680/opts.length)-8);
 opts.forEach((id,j)=>{const on=(R.comp===undefined?-1:R.comp)===id;button(34+j*(bw+8),y+32,bw,60,id<0?L('혼자','独自'):LL(SURV[id].n),on?'green':'dark',20,()=>{R.comp=id;AudioFx.cue('ui');persist()},{id:'comp'+id})});
 const cd=[['도하: 받는 피해 -40%','道河：受到伤害-40%'],['유나: 베고 태우는 속도 2배','柔娜：砍伐、焚烧速度翻倍'],['마루: 소음이 빨리 가라앉는다','玛鲁：噪音消退更快']];txt(cp>=0?LL(cd[cp]):L('동행이 없으면 혼자 싸워요','没有同行就独自作战'),40,y+112,16,'#9fb0c4','left',false)}
function cmapScreen(){g.fillStyle='rgba(5,8,14,.95)';g.fillRect(0,0,W,H);txt(L('떠나온 도시','离开的城市'),375,60,38,'#ffe2a0','center');const ct=R.ct,rec=ct.d.filter(d=>d.s).length,cp=compId();
 txt(L('수복 ','已夺回 ')+rec+'/4'+L('  ·  정화탄 ','  ·  净化弹 ')+(R.res.bomb||0)+L('  ·  동행: ','  ·  同行：')+(cp>=0?LL(SURV[cp].n):L('혼자','独自')),375,104,20,'#c9d2de','center',false);
 const go=R.t<112&&canLand()&&!inStorm(),why=()=>message(!canLand()?L('오늘 원정은 두 번까지예요. 내일 다시 가요','今天最多远征两次，明天再去'):L('해가 지기 전엔 돌아올 수 없어요','天黑前回不来'),1.6);
 CT.forEach((h,i)=>{const d=ct.d[i],y=130+i*146,open=i<=ct.max+1,col=d.s?'#7fe0a0':open?'#ffcf6a':'#4a5462';rr(30,y,690,134,16,d.s?'#12261c':open?'#221c12':'#14181e',col,3);
  txt((d.s?'● ':open?'◐ ':'○ ')+LL(h.n),56,y+34,27,d.s?'#dfffe8':open?'#fff':'#7a8494','left',false);
  const sh=d.sh===undefined?HEART_SHELL:d.sh,bn=d.bn===undefined?HEART_CORE:d.bn;
  txt(d.s?L('되찾음','已夺回'):open?(h.heart?L('근원 심장 · 껍질 ','源心 · 外壳 ')+sh+L(' · 핵 ',' · 核心 ')+bn:L('감염됨 · 남은 둥지 ','感染中 · 剩余巢穴 ')+d.left):L('앞 구역을 먼저 되찾아야 해요','需先夺回前一个区域'),56,y+74,18,'#c9d2de','left',false);
  txt(L('매일 아침: ','每天早上：')+costStr(h.prod,1),56,y+108,16,'#9fb0c4','left',false);
  if(!d.s&&open)button(520,y+26,180,82,L('원정','远征'),go?'red':'gray',26,()=>{if(go)startCityD(i);else why()},{id:'ct_go'+i})});
 compPicker(722);
 const y=856;rr(30,y,690,150,14,'#10202a','#5ad0c0',2);if(!icon('bomb',80,y+56,56)){circ(80,y+56,22,'#7fe0d0','#123',3);circ(80,y+56,8,'#e8fffa')}txt(L('정화탄','净化弹')+' '+(R.res.bomb||0),126,y+40,24,'#e8fffa','left',false);txt(L('바닷소금으로 근원 심장의 회색 껍질을 녹인다','用海盐融化源心的灰色外壳'),126,y+78,16,'#9fd8d0','left',false);txt(costStr(BOMB_COST),126,y+112,16,'#ffe2a0','left',false);
 button(470,y+34,230,84,L('만들기','制作'),canPayC(BOMB_COST)?'green':'gray',26,bombMake,{id:'bomb_make'});
 mapTabs('cmap');button(150,1200,450,84,L('◀ 닫기','◀ 关闭'),'gold',26,()=>{sc='world'},{id:'ct_close'})}
function endingScreen(){endFx+=1/60;g.fillStyle='#071016';g.fillRect(0,0,W,H);if(imgs.title){g.drawImage(imgs.title,0,0,W,H);g.fillStyle='rgba(4,8,14,'+Math.max(.66,.95-endFx*.05)+')';g.fillRect(0,0,W,H)}drawGlow(375,300,240+Math.sin(frame*2)*16,'y',.55);
 if(endPage===0){txt(L('엔딩','结局'),375,150,28,'#c9d2de','center');txt(L('돌아온 땅','重归之地'),375,226,70,'#ffcf6a','center');
  para(L('근원 심장이 멎던 날, 도시의 회색이 한꺼번에 무너져 내렸다.\n바다에서 버틴 날들과 강을 거슬러 오른 날들이\n한 줄로 이어졌다.\n\n처음 도망쳤던 그 거리에서,\n이번에는 아무도 도망치지 않았다.','源心停跳的那天，城市的灰色一下子全部崩塌。\n在海上撑过的日子、溯河而上的日子，\n连成了一条线。\n\n在当初逃离的那条街上，\n这一次，没有人再逃。'),375,380,23,'#f0eee4',620,38,'center');
  button(200,990,350,90,L('그 후 ▶','后来 ▶'),'gold',26,()=>{endPage=1;endFx=0;AudioFx.cue('ui')},{id:'btn_ch1'});return}
 txt(L('그 후','后来'),375,150,40,'#ffcf6a','center');EPILOGUE.forEach((e,k)=>{if(endFx>k*.5){g.save();g.globalAlpha=Math.min(1,(endFx-k*.5)*2);para(LL(e),375,236+k*92,20,'#f0eee4',620,30,'center');g.restore()}});
 const rec=['hb','rv','ct'].reduce((a,k)=>a+R[k].d.filter(d=>d.s).length,0);
 rr(110,800,530,120,16,'rgba(10,16,24,.8)','#8a7a4a',2);txt(L('생존 '+R.day+'일 · 동료 '+R.surv.length+'명','生存'+R.day+'天 · 伙伴'+R.surv.length+'人'),375,842,23,'#ffe7a0','center');txt(L('되찾은 땅 '+rec+'/12 · 기록 '+(save.docs||[]).length+'/'+DOCS.length+' · 커피 '+R.cnt.coffee+'잔','夺回土地 '+rec+'/12 · 档案'+(save.docs||[]).length+'/'+DOCS.length+' · 咖啡'+R.cnt.coffee+'杯'),375,886,18,'#dfe6ee','center',false);
 txt(L('이야기는 끝났지만 삶은 계속돼요. 땅을 지키며 계속 플레이할 수 있어요.','故事结束了，生活还在继续。可以守护土地继续游玩。'),375,958,17,'#9fb0c4','center',false);
 button(110,1000,250,90,L('공유','分享'),'blue',26,shareGame,{id:'end_share'});button(390,1000,250,90,L('계속 살아가기','继续生活'),'gold',24,()=>{sc='sea';setTimeout(()=>gotDoc(14),400)},{id:'btn_end2'});
 txt(L('RECLAIM · 플레이해 주셔서 고맙습니다','RECLAIM · 感谢游玩'),375,1150,16,'#6a7484','center',false)}
// ---- 이야기: 프롤로그 · 동료 대화 · 기록 보관함 · 후일담
const PROLOGUE=[
 ['한빛시. 강이 바다로 흘러드는 도시.','청명바이오는 강을 깨끗하게 만들겠다고 약속했다. 물속의 더러운 것을 먹어 치우는 균, G-7.','韩光市。一座河流汇入大海的城市。','清明生物许诺要让河水变干净。一种会吃掉水中污物的菌——G-7。'],
 ['석 달 뒤, 사람들 피부에 회색 반점이 피기 시작했다.','반점은 이끼가 되었고, 이끼는 사람을 걷게 했다. 감염된 사람들은 떼를 지어 물가로 걸어갔다.','三个月后，人们的皮肤上开始长出灰色斑点。','斑点变成了苔藓，苔藓让人行走。被感染的人成群结队地走向水边。'],
 ['나는 청명바이오 회장 전용기의 부기장이었다.','그날 밤 명령은 하나였다. “회장님이 오실 때까지 대기.”','我是清明生物会长专机的副驾驶。','那天夜里的命令只有一条：“原地待命，等会长到达。”'],
 ['회장은 오지 않았다. 활주로 너머로 회색이 밀려왔다.','그리고 나는 배웠다. 그것들은 물을 건너지 못한다는 걸.','会长没有来。灰色从跑道那头涌了过来。','然后我学到了一件事——它们过不了水。']];
const ME=-1;
const TALKS=[
 {id:'d1',who:0,need:()=>true,t:['구명보트','救生艇'],l:[[0,'구명보트에서 사흘. 갈매기를 잡아먹을까 진지하게 고민했지.','在救生艇上漂了三天。我认真考虑过要不要抓海鸥吃。'],[ME,'어쩌다 바다에 나왔어요?','你怎么会漂到海上？'],[0,'북쪽 항구가 무너지던 날, 아들놈을 먼저 큰 배에 태웠어. 나는 다음 배를 타기로 했는데… 다음 배는 없더군.','北港沦陷那天，我先把儿子送上了大船。我说我坐下一班……可再也没有下一班了。'],[0,'도윤이. 스무 살. 나보다 그물을 잘 던져.','道允。二十岁。撒网比我还准。']]},
 {id:'d2',who:0,need:()=>ch2On()&&R.q2>=1,t:['돛대만 한 키','比桅杆还高'],l:[[0,'항구에 배가 들어올 때마다 혹시 그 배인가 자꾸 보게 돼.','每次有船进港，我都忍不住看是不是那艘。'],[ME,'찾으면 바로 알려 줄게요.','找到了我马上告诉你。'],[0,'알려 줄 필요 없어. 그 녀석이면 멀리서도 알아봐. 키가 돛대만 하거든.','不用告诉我。那小子我隔老远就认得出来，个子跟桅杆一样高。']]},
 {id:'d3',who:0,need:()=>ch3On()&&R.rv.trades>=2,t:['북쪽 소식','北边的消息'],l:[[0,'선단 사람들한테 들었어. 북쪽 섬에 그물 잘 던지는 키 큰 청년이 있대.','听船队的人说，北边的岛上有个撒网很准的高个子年轻人。'],[0,'이름은 모른다더군. …몰라도 돼.','名字他们不知道。……不知道也没关系。'],[ME,'가 봐야죠.','那得去一趟。'],[0,'땅을 다 되찾고 나서. 그 녀석한테 돌아올 땅이 있다고 말해 주고 싶어.','等把地都夺回来再说。我想告诉那小子，他有地方可以回来了。']]},
 {id:'y1',who:1,need:()=>true,t:['빈 오두막','空小屋'],l:[[1,'섬 오두막엔 아빠를 찾으러 갔었어요. 병에 쪽지가 떠 왔거든요. “딸에게. 아빠는 섬에 있다.”','我去岛上小屋是为了找爸爸。有个漂流瓶里写着：“女儿，爸爸在岛上。”'],[1,'근데 도착해 보니 빈집이었어요. 벽에 톱 자국만 잔뜩.','可到了才发现是空屋子，墙上只有一道道锯痕。'],[ME,'살아 계실 거예요.','他一定还活着。'],[1,'알아요. 그 사람, 톱만 있으면 어디서든 살아요.','我知道。那个人只要有把锯子，在哪都能活。']]},
 {id:'y2',who:1,need:()=>ch3On(),t:['톱밥','锯末'],l:[[1,'…방금 강 무전 들었죠? 제재소. 톱밥.','……刚才的河上电台你听到了吧？锯木厂。锯末。'],[1,'그거 아빠예요. 확실해요.','那是我爸。肯定是。'],[ME,'그럼 강을 올라가죠.','那我们就溯河而上。'],[1,'커피부터 끓일게요. 손이 떨려서 아무것도 못 고치겠어요.','我先去煮杯咖啡。手抖得什么都修不了。']]},
 {id:'y3',who:1,need:()=>R.surv.some(s2=>s2.id===3),t:['이음새','接缝'],l:[[1,'아빠가 저한테 처음 한 말이 뭔지 알아요? “갑판 이음새가 왜 이 모양이냐.”','你知道我爸见到我说的第一句话是什么吗？“甲板的接缝怎么弄成这样？”'],[3,'사실이잖아.','本来就是。'],[1,'…네, 사실이에요.','……嗯，确实是。'],[1,'고마워요. 바다에서 건져 줘서. 우리 둘 다.','谢谢你。把我们俩都从海里捞了起来。']]},
 {id:'m1',who:2,need:()=>true,t:['불빛 하나','一点火光'],l:[[2,'그날 밤, 서쪽 바다로 작은 비행기가 떨어지는 걸 봤어요.','那天夜里，我看到一架小飞机掉进了西边的海里。'],[2,'다들 끝났다고 했지만, 바다에 불빛 하나가 떠 있었죠. 당신 모닥불이었어요.','大家都说完了，可海面上漂着一点火光。那是你的篝火。'],[2,'그래서 매일 밤 무전을 켰어요. 대답할 때까지.','所以我每天夜里都打开电台，直到你回应。'],[ME,'덕분에 살았어요.','多亏了你，我才活下来。'],[2,'아뇨. 당신이 대답해서 내가 산 거예요.','不。是你回应了，我才活下来的。']]},
 {id:'m2',who:2,need:()=>ch2On()&&R.q2>=4,t:['등대 일지','灯塔日志'],l:[[2,'등대 일지에 지나간 배를 전부 적어 뒀어요. 그날 이후 서른일곱 척.','灯塔日志里记下了每一艘经过的船。那天以后，一共三十七艘。'],[2,'돌아온 건 아직 여섯 척. 나머지 서른한 척의 이름을 매일 밤 읽어요.','回来的只有六艘。剩下三十一艘的名字，我每天夜里都念一遍。'],[ME,'왜요?','为什么？'],[2,'누군가 기억하고 있다는 걸, 배가 알았으면 해서요.','我希望那些船知道，还有人记得它们。']]},
 {id:'m3',who:2,need:()=>ch4On(),t:['두고 온 사람들','留下的人'],l:[[2,'도시로 간다니… 거기엔 우리가 두고 온 사람들이 있겠죠.','要回城里了啊……那里有我们当初丢下的人。'],[ME,'이번엔 아무도 두고 오지 않아요.','这次谁也不丢下。'],[2,'그 말, 일지에 적어 둘게요.','这句话，我记进日志里。']]},
 {id:'h1',who:3,need:()=>true,t:['톱밥 끓인 물','锯末水'],l:[[3,'제재소에서 석 달. 톱밥 끓인 물이 얼마나 맛없는지 아나?','在锯木厂待了三个月。你知道锯末煮的水有多难喝吗？'],[ME,'커피보다요?','比咖啡还难喝？'],[3,'…그 검은 물 말인가. 그건 판단을 보류하지.','……你说那个黑水？那个我暂不评价。'],[3,'유나를 데려와 줘서 고맙네. 빚은 판자로 갚지.','谢谢你把柔娜带来。这份情，我用木板还。']]},
 {id:'h2',who:3,need:()=>ch3On()&&R.q3>=7,t:['G-7 탱크','G-7罐'],l:[[3,'정수장 증축 공사, 내가 했네. 청명바이오 일이었지.','净水厂的扩建工程是我做的。清明生物的活儿。'],[3,'지하에 커다란 탱크들이 있었어. “G-7”이라고 쓰여 있었고, 냄새가… 비 온 뒤 숲 냄새 같았지.','地下有好几个大罐子，上面写着“G-7”。气味……像雨后的树林。'],[3,'그땐 좋은 거라고 생각했어. 강을 깨끗하게 한다니까.','那时候我以为是好东西。说是能让河水变干净。'],[ME,'아무도 몰랐어요.','谁都不知道。'],[3,'아니. 누군가는 알았을 거야.','不。总有人是知道的。']]},
 {id:'h3',who:3,need:()=>ch4On()&&R.q4>=2,t:['자네 배','你的船'],l:[[3,'끝나면 뭘 할 건가?','结束以后你打算做什么？'],[ME,'모르겠어요. 비행기는 이제 안 탈래요.','不知道。飞机是不想再坐了。'],[3,'그럼 배를 만들지. 자네 배. 이름은 자네가 짓게.','那我给你造条船。你的船。名字你来起。']]},
 {id:'s1',who:4,need:()=>true,t:['환자 0번','零号病人'],l:[[4,'첫 환자는 정수장 직원이었어요. 피부에 회색 반점. 체온이 떨어지고, 자꾸 물가로 가려고 했죠.','第一个病人是净水厂的员工。皮肤上有灰色斑点，体温下降，总想往水边走。'],[4,'보고서를 세 번 올렸어요. 세 번 다 “검토 중”이 돌아왔고요.','我交了三次报告。三次都回复“审核中”。'],[ME,'그 보고서, 이제 누가 읽어요.','那份报告，现在还有谁看。'],[4,'당신이 읽었잖아요. 그걸로 충분해요.','你看了啊。这就够了。']]},
 {id:'s2',who:4,need:()=>ch4On()&&R.q4>=3,t:['소금','盐'],l:[[4,'식염수로 씻은 자리만 반점이 사라졌어요. 바닷물에 닿은 시료는 30분 만에 죽었고요.','只有用盐水洗过的地方，斑点才会消失。碰到海水的样本，三十分钟就死了。'],[4,'그래서 감염체가 바다를 못 건너는 거예요. 무서워서가 아니라, 바다가 그걸 죽이니까.','所以丧尸过不了海。不是因为害怕，是因为海会杀死它。'],[ME,'바다가 우릴 지켜 준 거네요.','原来是大海一直在保护我们。'],[4,'그리고 이제 바다를 들고 도시로 가는 거죠. 정화탄은 결국 소금이니까.','现在，轮到我们把大海带进城里了。净化弹说到底就是盐。']]},
 {id:'s3',who:4,need:()=>!!R.ended,t:['첫 수업','第一堂课'],l:[[4,'항구에 학교를 열 거예요. 첫 수업은 소금 만들기.','我要在港口开一所学校。第一堂课：制盐。'],[4,'두 번째는 불 피우기. 세 번째는… 커피 내리기?','第二堂课：生火。第三堂课……冲咖啡？'],[ME,'그건 필수 과목으로 하죠.','那必须是必修课。'],[4,'반대하는 사람은 한 명도 없을 거예요.','我想不会有一个人反对。']]}];
const DOCS=[
 {t:['탑승 대기 지시서','待机指令'],b:['청명바이오 항공팀. 부기장은 회장님 도착 시까지 엔진 예열 상태로 대기. 화물칸의 냉장 상자 4개는 어떤 경우에도 열지 말 것.','清明生物航空组。副驾驶保持引擎预热，待会长到达。货舱里的四个冷藏箱，任何情况下都不得打开。']},
 {t:['항구 검역소 공문','港口检疫所公文'],b:['G-7 노출 의심 선박 입항 금지. 참고: 바닷물에 닿은 시료는 30분 안에 활성을 잃음. 원인 조사 중.','禁止疑似接触G-7的船只入港。备注：接触海水的样本在三十分钟内失去活性，原因调查中。']},
 {t:['시장 상인의 장부','集市商贩的账本'],b:['외상 갚을 사람들이 다 사라졌다. 그래도 장부는 덮지 않는다. 돌아오면 받을 거다. 돌아오기만 하면.','欠账的人都不见了。但账本我不合上。回来了再收。只要能回来。']},
 {t:['발전소 교대 일지','发电站交接日志'],b:['정수장 쪽 송전 요청이 세 배로 늘었다. 청명바이오가 배양조 온도를 올리고 있다고 한다. 밤마다 강에서 비 온 뒤 숲 냄새가 난다.','净水厂方向的供电申请涨了三倍。听说清明生物在调高培养罐的温度。每天夜里，河边都飘着雨后树林的气味。']},
 {t:['광장의 전단지','广场的传单'],b:['“물이 살아납니다 — 청명바이오 G-7 한빛강 시범사업.” 그 위에 누군가 매직으로 적었다. “살아난 건 물이 아니었다.”','“让河水重获新生——清明生物G-7韩光河试点工程。”上面有人用马克笔写着：“活过来的不是水。”']},
 {t:['어촌 아이의 그림일기','渔村孩子的绘画日记'],b:['아빠가 강에 들어가지 말래. 강물이 회색이래. 바다는 괜찮대. 짜니까. (그림: 바다에 떠 있는 집)','爸爸说别进河里。河水是灰色的。他说海没事，因为是咸的。（画：漂在海上的房子）']},
 {t:['다리 밑 사람들의 규칙','桥下人的规矩'],b:['하나, 강물은 끓여 마신다. 둘, 소금은 금보다 귀하다. 셋, 지나가는 배에게 먹을 것은 받되 목숨은 받지 않는다.','一、河水煮开再喝。二、盐比金子金贵。三、向过往的船收吃的，不收命。']},
 {t:['제재소 벽의 낙서','锯木厂墙上的字'],b:['유나야, 아빠는 강 위로 간다. 섬은 둥지가 가까워 오래 못 있겠더라. 이 글을 보면 톱밥 냄새를 따라와라.','柔娜，爸爸往上游去了。岛上离巢太近，待不久。看到这行字，就顺着锯末的味道来找我。']},
 {t:['정수장 배양조 점검표','净水厂培养罐检查表'],b:['G-7 3호조: 생체 조직 흡착 반응 발생. 대표 지시로 보고 보류. 본사 지하 원조(元槽)는 계속 가동할 것. — 서명 윤태석','G-7三号罐：出现生物组织吸附反应。按会长指示暂缓上报。总部地下原罐继续运转。——签名 尹泰锡']},
 {t:['고속도로 위의 쪽지','高速公路上的纸条'],b:['차 유리에 붙은 쪽지: “우린 바다로 간다. 바다는 안전하대. 엄마, 아빠, 지호.”','贴在车窗上的纸条：“我们去海边了。听说海上安全。爸爸、妈妈、智浩。”']},
 {t:['서린의 진료 기록','书林的诊疗记录'],b:['환자 0번. 정수장 직원. 피부 회색 반점, 체온 저하, 물가로 향하는 행동. 생리식염수로 세척한 부위만 반점 소실. → 소금. 세 번째 보고서 제출.','零号病人。净水厂员工。皮肤灰斑，体温下降，有走向水边的行为。仅用生理盐水清洗的部位斑点消失。→盐。提交第三份报告。']},
 {t:['항공팀 화물 목록','航空组货物清单'],b:['냉장 상자 4개: G-7 원조 배양체. 목적지: 해외 연구소. 승인: 윤태석. — 그 상자들은 비행기와 함께 바다에 가라앉았다. 소금물 속에서.','冷藏箱四个：G-7原罐培养体。目的地：海外研究所。批准：尹泰锡。——那些箱子随飞机沉入了海里。沉在盐水里。']},
 {t:['윤태석 회장의 녹음','尹泰锡会长的录音'],b:['“부기장. 이걸 듣는다면 자네는 살아 있겠지. 상자를 싣게 한 건 나야. 하지만 나는 타지 않았네. 원조를 내 손으로 끄려고 남았어. 소금이야. 처음부터 바다가 답이었어. …미안하네.”','“副驾驶。如果你听到这段录音，说明你还活着。是我让人装上那些箱子的。但我没有上飞机。我留下来，想亲手关掉原罐。是盐。从一开始，答案就是大海。……对不起。”']},
 {t:['등대 일지','灯塔日志'],b:['23일 밤. 서쪽 바다로 작은 비행기 한 대가 떨어짐. 새벽에 보니 불빛 하나가 떠 있다. 누군가 살아 있다. 발전기를 고쳐야 한다. — 마루','第23夜。一架小飞机坠入西边的海里。天亮时看见海上漂着一点火光。有人还活着。得修好发电机。——玛鲁']},
 {t:['항구 학교 첫 공지','港口学校第一份通知'],b:['오늘 배울 것: 소금 만드는 법, 불 피우는 법, 그리고 글자. 준비물: 없음. 커피는 선생님이 준비함. — 교사 서린','今日课程：制盐、生火，还有识字。需要准备：无。咖啡由老师准备。——教师 书林']}];
const EPILOGUE=[['도하는 배를 고쳐 북쪽으로 떠났다. 키가 돛대만 한 아들을 데리러.','道河修好船去了北方，去接那个比桅杆还高的儿子。'],['유나와 한수는 제재소에서 배를 만든다. 이음새 문제로 매일 싸운다.','柔娜和韩洙在锯木厂造船，每天都为接缝吵架。'],['마루는 등대를 다시 켰다. 이제 그 불은 경고가 아니라 초대다.','玛鲁重新点亮了灯塔。如今那束光不再是警告，而是邀请。'],['서린은 항구에 학교를 열었다. 첫 수업은 소금 만들기.','书林在港口开了学校，第一堂课是制盐。'],['다리 밑 사람들은 나룻배를 몬다. 통행료는 이제 커피 한 잔.','桥下的人撑起了渡船。过路费如今是一杯咖啡。'],['그리고 당신은, 처음으로 비행기가 아닌 배의 키를 잡았다.','而你，第一次握住的不是飞机的操纵杆，是船舵。']];
let talk=null,pro=null,endPage=0;
function gotDoc(i){save.docs=save.docs||[];if(save.docs.indexOf(i)>=0)return;save.docs.push(i);track('doc',{i});persist();const D=DOCS[i];popTip({head:L('기록 발견 · ','发现档案 · ')+LL(D.t),lines:[D.b,[L('[보급·일지] → [기록 보관함]에서 다시 볼 수 있어요','可在[补给·日志]→[档案馆]中重温'),L('[보급·일지] → [기록 보관함]에서 다시 볼 수 있어요','可在[补给·日志]→[档案馆]中重温')]],t:0})}
function talkNext(){if(!R||!R.surv)return null;R.talks=R.talks||{};for(const k of TALKS){if(R.talks[k.id])continue;if(!R.surv.some(s2=>s2.id===k.who))continue;try{if(k.need())return k}catch(e){}}return null}
function talkScreen(){const k=talk.k,ln=k.l[talk.i],sp=ln[0];g.fillStyle='rgba(4,6,12,.82)';g.fillRect(0,0,W,H);drawGlow(375,760,260,'o',.25+.05*Math.sin(frame*5));
 txt(L('모닥불 이야기','篝火夜话'),375,80,20,'#c9a87a','center',false);txt(LL(k.t),375,128,34,'#ffe2a0','center');
 const lx=190,rx=560,me=sp===ME;g.save();g.globalAlpha=me?.45:1;if(!sprite('surv'+k.who,'idle',frame,lx,900,300,-1,6))circ(lx,760,60,'#6c6','#111',4);g.restore();
 g.save();g.globalAlpha=me?1:.45;if(!sprite('hero','idle',frame,rx,900,300,1,6))circ(rx,760,60,'#e9e2d2','#111',4);g.restore();
 rr(30,930,690,290,18,'#141a28f4','#c9a87a',3);txt(me?L('나','我'):LL(SURV[sp].n),60,972,24,me?'#bfe0ff':'#ffe2a0','left');
 para(LANG==='zh'?ln[2]:ln[1],60,1022,22,'#f0eee4',630,36,'left');
 txt((talk.i+1)+' / '+k.l.length+'   '+L('탭해서 계속','点击继续'),690,1196,15,'#8a94a4','right',false);
 hotspot(0,160,W,H-160,()=>{talk.i++;AudioFx.cue('ui');if(talk.i>=k.l.length){R.talks[k.id]=1;track('talk',{id:k.id,day:R.day});persist();talk=null;sc='sea'}},'talk_next');
 button(560,28,170,62,L('건너뛰기','跳过'),'dark',18,()=>{R.talks[k.id]=1;track('talk_skip',{id:k.id});persist();talk=null;sc='sea'},{id:'talk_skip'})}
function prologueScreen(){pro.t+=1/60;const i=pro.i,c=PROLOGUE[i];g.fillStyle='#03060a';g.fillRect(0,0,W,H);if(imgs.title){g.save();g.globalAlpha=.08+.03*i;g.drawImage(imgs.title,0,0,W,H);g.restore()}
 const a=Math.min(1,pro.t*1.5);g.save();g.globalAlpha=a;txt((i+1)+' / '+PROLOGUE.length,375,380,18,'#6a7484','center',false);
 para(LANG==='zh'?c[2]:c[0],375,520,30,'#ffe2a0',620,48,'center');para(LANG==='zh'?c[3]:c[1],375,680,24,'#e6ecf2',600,42,'center');g.restore();
 if(pro.t>.6)txt(i<PROLOGUE.length-1?L('탭해서 계속','点击继续'):L('탭해서 탈출 시작','点击开始逃离'),375,1060,20,'#ffcf6a','center',false);
 const done=()=>{save.prolog=1;persist();pro=null;track('prologue_done',{});startAct1()};
 hotspot(0,0,W,1150,()=>{if(pro.t<.4)return;pro.i++;pro.t=0;AudioFx.cue('ui');if(pro.i>=PROLOGUE.length)done()},'pro_next');
 button(560,1220,170,64,L('건너뛰기','跳过'),'dark',18,done,{id:'pro_skip'})}
let docSel=-1;
function docsScreen(){g.fillStyle='#0d111b';g.fillRect(0,0,W,H);save.docs=save.docs||[];txt(L('기록 보관함','档案馆'),375,70,36,'#ffe2a0','center');txt(L('모은 기록 ','已收集 ')+save.docs.length+' / '+DOCS.length,375,114,19,'#c9d2de','center',false);
 DOCS.forEach((D,i)=>{const got=save.docs.indexOf(i)>=0,y=144+i*66;rr(30,y,690,58,12,got?'#161d28':'#11151d',got?'#5a6a7a':'#232a36',2);txt((i+1<10?'0':'')+(i+1),56,y+30,18,got?'#ffcf6a':'#4a5462','left',false);txt(got?LL(D.t):'? ? ?',110,y+30,20,got?'#f0eff7':'#4a5462','left',false);
  if(got)hotspot(30,y,690,58,()=>{AudioFx.cue('ui');popTip({head:LL(D.t),lines:[D.b],t:0})},'doc'+i)});
 button(150,1180,450,80,L('◀ 돌아가기','◀ 返回'),'gold',26,()=>{sc='reward'},{id:'docs_back'})}
let questCd=0,radioShow=null,endCh=1;
function canPayC(c2){for(const r in c2)if((R.res[r]||0)<c2[r])return false;return true}
function payC(c2){for(const r in c2)R.res[r]-=c2[r]}
function costStr(o,plus){return Object.keys(o).map(k=>LL(RES_N[k])+' '+(plus?'+':'')+o[k]).join(' · ')}
function ch2On(){return R.ch>=CH.length}
function reclaim(di){const d=R.hb.d[di],h=HB[di];R.anim={rg:'hb',i:di,t:0};if(sc==='sea')sc='town';d.s=2;d.left=0;R.hb.max=Math.max(R.hb.max,di);if(!R.hb.flow)R.hb.flow=R.day+4;track('reclaim',{di,day:R.day});setTimeout(()=>gotDoc(1+di),600);AudioFx.cue('win');vib('long');
 popTip({head:L('구역 수복','夺回区域'),lines:[['「'+h.n[0]+'」 구역을 되찾았다! 회색이 걷히고 색이 돌아왔다.','「'+h.n[1]+'」夺回来了！灰色褪去，颜色回来了。'],['매일 아침 보급: '+costStr(h.prod,1),'每天早上补给：'+costStr(h.prod,1)],['며칠마다 감염이 되밀려와요. [항구 지도]에서 방벽을 세우면 지킬 수 있어요.','每隔几天感染会反扑。在[港口地图]建起路障就能守住。']],t:0});if(di===0)addSurvivor(2);persist()}
function harborMorning(){if(!ch2On())return;const hb=R.hb,sum={};hb.d.forEach((d,i)=>{if(d.s)for(const k in HB[i].prod)sum[k]=(sum[k]||0)+HB[i].prod[k]});R.rv.d.forEach((d,i)=>{if(d.s)for(const k in RV[i].prod)sum[k]=(sum[k]||0)+RV[i].prod[k]});if(R.ct)R.ct.d.forEach((d,i)=>{if(d.s)for(const k in CT[i].prod)sum[k]=(sum[k]||0)+CT[i].prod[k]});
 {const add=(o)=>{for(const k in o)sum[k]=(sum[k]||0)+o[k]};add({plank:2,plastic:1,cloth:1});if(R.tb&&R.tb.farm)add({berry:3});if(R.tb&&R.tb.clinic)add({med:1})}
 if(Object.keys(sum).length){for(const k in sum)R.res[k]=(R.res[k]||0)+sum[k];message((ch4On()?L('땅의 보급: ','土地补给：'):ch3On()?L('항구·강 보급: ','港口·河流补给：'):L('항구 보급: ','港口补给：'))+costStr(sum,1),2.6)}
 if(false&&hb.flow&&R.day===hb.flow-1)radioShow={l:['항구 무전: 내일 새벽 감염 역류가 옵니다. 방벽 없는 구역은 다시 회색이 돼요!','港口电台：明天凌晨会有感染回流。没有路障的区域会再次变灰！'],t:10};
 raidMorning();
 if(false&&hb.flow&&R.day>=hb.flow){hb.flow=R.day+6;const rec=hb.d.map((d,i)=>i).filter(i=>hb.d[i].s);if(!rec.length)return;if(rec.some(i=>hb.d[i].bar))R.cnt.held++;const un=rec.filter(i=>!hb.d[i].bar);
  if(un.length){const i=un[un.length-1],d=hb.d[i];d.s=0;d.left=HB[i].boss?1:2;if(HB[i].boss)d.bn=3;track('flow_lost',{i});AudioFx.cue('thunder');popTip({head:L('감염 역류','感染回流'),lines:[['밤사이 회색이 되밀려와 「'+HB[i].n[0]+'」 구역을 다시 덮었다.','夜里灰色反扑，「'+HB[i].n[1]+'」再次被吞没。'],['둥지 '+d.left+'개를 다시 태워야 해요. 되찾은 뒤에는 방벽을 세우세요.','需要再烧掉'+d.left+'个巢穴。夺回后记得建路障。']],t:0})}
  else{track('flow_held',{});message(L('방벽이 감염 역류를 막아냈다!','路障挡住了感染回流！'),3)}}}
function startHarborD(di){const h=HB[di],d=R.hb.d[di];markLand();R.cnt.lands++;save.stats.lands++;track('land_start',{day:R.day,harbor:true,di});let s=R.day*313+di*71+7;const rnd=()=>{s=(s*16807)%2147483647;return (s%10000)/10000};
 const objs=[{k:'light',x:375,y:330,n:0,lit:true}];if(h.boss)objs.push({k:'nest',big:true,x:375,y:620,n:d.bn||6});else for(let j=0;j<d.left;j++)objs.push({k:'nest',x:j%2?480:270,y:560+j*Math.floor(900/Math.max(1,d.left)),n:2});
 for(let i=0;i<5;i++)objs.push({k:'crate',x:230+rnd()*290,y:700+i*190+rnd()*60,n:1});
 const zs=[];for(let i=0;i<h.z;i++){const x=220+rnd()*310,y=450+i*Math.floor(1050/h.z);zs.push({x,y,hx:x,hy:y,hp:3,a:0,hit:0,w:rnd()*6,run:i%3===2})}
 Land={type:'harbor',di,p:{x:375,y:1760,tx:375,ty:1760,hit:0},objs,zs,carry:{},n:0,cap:(R.sail?16:12)+fleetN()*2,noise:0,target:null,work:0,atk:0,nightSpawn:false,lit:false,clear:false};sc='land';camY=LAND_H-H;
 tip('nest',[['회색으로 부푼 덩어리가 감염 둥지예요. 탭해서 다가가 태우세요.','鼓起的灰色团块就是感染巢。点击靠近并烧掉它。'],['둥지를 모두 태우고 배로 돌아오면 그 구역을 되찾아요. 중간에 물러나도 태운 둥지와 큰 둥지에 입힌 피해는 그대로예요.','烧光巢穴并回到船上，就能夺回该区域。中途撤退，已烧掉的巢穴和对大巢造成的伤害都不会恢复。'],['태우는 소리에 감염체가 몰려와요. 체력이 낮으면 욕심내지 말고 돌아가세요.','燃烧声会引来丧尸。体力低时别贪心，先撤。']])}
function drawNest(o){const r=o.town?(o.big?44:24):o.big?70:40,pu=1+.06*Math.sin(frame*(o.big?5:3)+o.x);drawGlow(o.x,o.y,r*2.2,'w',.12);g.save();g.translate(o.x,o.y);g.scale(pu,pu);circ(0,6,r,'#2c322c','#12140f',4);circ(-r*.35,-r*.2,r*.55,'#48524a','#12140f',3);circ(r*.3,-r*.05,r*.45,'#3c463e','#12140f',3);circ(0,-r*.45,r*.3,'#5a665c','#12140f',3);
 for(let i=0;i<6;i++){const a=i*1.05+frame*.6;circ(Math.cos(a)*r*1.15,Math.sin(a)*r*.9,3,'rgba(190,200,180,.7)')}g.restore();
 if(o.heart&&o.shell>0){for(let k=0;k<o.shell;k++){g.strokeStyle='rgba(170,180,170,.85)';g.lineWidth=6;g.beginPath();g.arc(o.x,o.y+6,r*1.05+k*12+2*Math.sin(frame*3+k),0,TAU);g.stroke()}}
 if(o.town)return;txt(o.heart?(o.shell>0?L('근원 심장 · 껍질 ','源心 · 外壳 ')+o.shell:L('근원 심장 · 핵 ','源心 · 核心 ')+o.n):o.root?L('회색 뿌리 ','灰色根 ')+o.n:o.big?L('회색 심장 ','灰色心脏 ')+o.n:L('감염 둥지 ','感染巢 ')+o.n,o.x,o.y+r+26,17,'#e6ecdc','center')}
function drawCoast(){const hb=R.hb,night=isNight();g.fillStyle=night?'#04070a':'#1a262c';g.fillRect(0,196,W,14);for(let i=0;i<18;i++){const x=i*42+4,h=14+((i*37)%26);g.fillRect(x,196-h,34,h)}
 g.fillStyle=night?'#04070a':'#22323a';g.fillRect(712,150,12,46);if(R.lit)drawGlow(718,152,50+Math.sin(frame*3)*6,'y',.9);
 hb.d.forEach((d,i)=>{if(!d.s)return;for(let j=0;j<5;j++){const x=30+i*172+j*30,y=188-((j*13+i*7)%16);drawGlow(x,y,night?20:13,'o',night?.95:.6);circ(x,y,2.2,'#ffe9a0')}})}
function hmapScreen(){g.fillStyle='rgba(5,8,14,.94)';g.fillRect(0,0,W,H);txt(L('동쪽 항구','东港'),375,64,38,'#ffe2a0','center');const hb=R.hb,rec=hb.d.filter(d=>d.s).length;
 txt(L('수복 ','已夺回 ')+rec+'/4'+(R.raid?L('  ·  다음 습격까지 ','  ·  距下次袭击 ')+raidDays()+L('일','天'):''),375,112,20,'#c9d2de','center',false);
 const go=R.t<112&&canLand()&&!inStorm(),why=()=>message(!canLand()?L('오늘 원정은 두 번까지예요. 내일 다시 가요','今天最多远征两次，明天再去'):L('해가 지기 전엔 돌아올 수 없어요','天黑前回不来'),1.6);
 HB.forEach((h,i)=>{const d=hb.d[i],y=150+i*178,open=i<=hb.max+1,col=d.s?'#7fe0a0':open?'#ffcf6a':'#4a5462';rr(30,y,690,164,16,d.s?'#12261c':open?'#221c12':'#14181e',col,3);
  txt((d.s?'● ':open?'◐ ':'○ ')+LL(h.n),56,y+38,28,d.s?'#dfffe8':open?'#fff':'#7a8494','left',false);
  txt(d.s?(d.bar?L('되찾음 · 방벽 있음','已夺回 · 有路障'):L('되찾음 · 방벽 없음 (습격에 약해요)','已夺回 · 无路障（容易被袭击攻破）')):open?(h.boss?L('감염됨 · 회색 심장','感染中 · 灰色心脏'):L('감염됨 · 남은 둥지 ','感染中 · 剩余巢穴 ')+d.left):L('앞 구역을 먼저 되찾아야 해요','需先夺回前一个区域'),56,y+84,18,d.s&&!d.bar?'#ffb0a0':'#c9d2de','left',false);
  txt(L('매일 아침: ','每天早上：')+costStr(h.prod,1),56,y+126,17,'#9fb0c4','left',false);
  if(!d.s&&open)button(520,y+40,180,84,L('원정','远征'),go?'red':'gray',26,()=>{if(go)startHarborD(i);else why()},{id:'hb_go'+i});
  else if(d.s&&!d.bar)button(490,y+40,210,84,L('방벽 세우기','建路障'),canPayC(BAR_COST)?'gold':'gray',22,()=>{if(canPayC(BAR_COST)){payC(BAR_COST);d.bar=1;AudioFx.cue('build');vib('medium');track('barricade',{i});persist()}else message(L('재료가 모자라요: ','材料不够：')+costStr(BAR_COST),2)},{id:'hb_bar'+i})});
 const y=150+4*178;rr(30,y,690,110,16,'#14202a','#5a8ab0',2);txt(L('섬','小岛'),56,y+36,26,'#fff','left',false);txt(L('나무 · 열매 · 물 · 고철','木材 · 野果 · 淡水 · 废铁'),56,y+78,17,'#9fb0c4','left',false);button(520,y+14,180,82,L('상륙','登岛'),go?'green':'gray',26,()=>{if(go)startLand();else why()},{id:'hb_isl'});
 txt(L('방벽 재료: ','路障材料：')+costStr(BAR_COST),375,1010,18,'#c9d2de','center',false);mapTabs('hmap');
 button(150,1200,450,84,L('◀ 닫기','◀ 关闭'),'gold',26,()=>{sc=(sc==='build'?'sea':'world')})}
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
 if((r.coffee||0)>0&&tip('coffee',[['커피를 내렸어요. 화면 아래 자원 줄의 [커피] 칸을 탭하면 마셔요.','咖啡冲好了。点击屏幕下方物资栏的[咖啡]格就能喝。'],['마시면 90초 동안 걷기와 일이 빨라져요. 대신 잠이 오지 않아요.','喝了以后90秒内走路、干活都变快，不过会睡不着。']]))return;
 if(sc==='town'&&tip('town',[['뗏목이 항구에 닻을 내렸다. 이제 이 항구 마을이 우리 집이다.','木筏在港口抛了锚。从今天起，这座港口小镇就是我们的家。'],['잿빛 구역을 탭해 원정을 떠나고, 되찾은 구역엔 방벽과 건물을 지어요. 부두에 [선착장]을 지으면 바다 물건을 어선이 대신 건져 와요.','点灰色区域出发远征；夺回的区域可以建路障和建筑。在码头建[码头栈桥]，渔船会替你打捞海上物资。'],['[🗺 지도]에서는 강과 도시까지 이어진 전체 땅을 볼 수 있어요.','在[🗺 地图]里可以看到连着河流和城市的整片土地。']]))return;
 if(R.surv.length&&tip('surv',[['구한 동료는 배 위에서 각자 일을 해요. 이름 옆 그림이 지금 하는 일이에요.','救下的伙伴会在船上各自干活。名字旁的图标就是他们正在做的事。'],['동료를 탭하면 무슨 일을 하는지 볼 수 있어요. 배가 고프면 일을 쉬어요.','点伙伴可以查看他在做什么。饿了就会停工。']]))return;
 if(R.ch>=4&&tip('ff',[['오른쪽 위 [▶ x1] 버튼을 누르면 시간이 3배 빨리 흘러요.','点右上角[▶ x1]按钮，时间流逝加快3倍。'],['바다에서 할 일이 없을 때 쓰세요. 사건이 생기면 저절로 보통 속도로 돌아와요.','海上没事做时用它。发生事件时会自动恢复正常速度。']]))return;
 if(ch4On()&&tip('ch4',[['마지막 4장 「회색 심장」이에요. [지도]에서 [도시]를 눌러 떠나온 도시로 돌아가요.','最终章第四章「灰色心脏」。在[地图]里点[城市]，回到当初离开的城市。'],['도심의 근원 심장은 회색 껍질에 싸여 있어요. 강에서 얻는 물로 정화탄을 만들어 두세요.','市中心的源心被灰色外壳包着。用河里得到的水提前做好净化弹。']]))return;
 if(ch3On()&&!ch4On()&&tip('ch3',[['3장 「강을 거슬러」가 시작됐어요. 아래 [지도]에서 [강]을 눌러 상류로 올라가요.','第三章「溯河而上」开始了。在下方[地图]里点[河流]，向上游进发。'],['원정에 동료 한 명을 데려갈 수 있고, 다리를 지나면 물건을 교환할 수 있어요.','远征可以带一名伙伴；通过断桥后还能交换物资。']]))return;
 if(ch2On())tip('ch2',[['2장 「항구 수복」이 시작됐어요. 마을의 잿빛 구역을 탭해 원정을 떠나요.','第二章「夺回港口」开始了。点村子里的灰色区域出发远征。'],['둥지를 모두 태우면 그 땅을 되찾고 매일 아침 보급을 받아요. 되찾은 땅은 며칠마다 밤 습격을 받으니 방벽과 망루로 지켜요.','烧光巢穴就能夺回那片土地，每天早上获得补给。夺回的土地每隔几天会遭到夜袭，用路障和瞭望塔守住它。']])}
function vitCan(k){const r=R.res,v=R.vit;return k==='thirst'?r.water>0&&v.thirst<95:k==='hunger'?(r.cooked+r.can+r.berry+r.fish)>0&&v.hunger<95:k==='hp'?r.med>0&&v.hp<90:false}
function migrate(){R.cnt=Object.assign({debris:0,cooked:0,lands:0,held:0,coffee:0},R.cnt||{});R.rv=R.rv||{d:RV.map(h=>({s:0,left:h.boss?1:(h.nests||0)})),max:-1,trades:0};R.q3=R.q3||0;R.ct=R.ct||{d:CT.map(h=>({s:0,left:h.heart?1:h.nests})),max:-1};R.q4=R.q4||0;R.talks=R.talks||{};R.tb=R.tb||{};R.tw=R.tw||{};if(ch2On()&&!R.raid&&R.hb.d.some(d=>d.s))R.raid=R.day+2;R.cnt.bomb=R.cnt.bomb||0;if(R.comp===undefined)R.comp=-1;R.buff=R.buff||0;R.hb=R.hb||{d:HB.map(h=>({s:0,left:h.boss?1:h.nests,bar:0})),flow:0,max:-1};R.q2=R.q2||0;R.surv=R.surv||[];if(R.ch===undefined)R.ch=0;R.radioIdx=R.radioIdx||0;R.bottleIdx=R.bottleIdx||0;if(R.pend){for(const k in R.pend.c)R.res[k]=(R.res[k]||0)+R.pend.c[k];if(R.pend.lit)R.lit=true;if(R.pend.rc>=0){const rc=R.pend.rc,rg=R.pend.reg||(R.pend.rv?'rv':'hb');R.pend=null;if(!R[rg].d[rc].s)(rg==='rv'?reclaimR:rg==='ct'?reclaimC:reclaim)(rc)}R.pend=null}}
function questTick(dt){questCd-=dt;if(questCd>0||(sc!=='sea'&&sc!=='town'))return;const c4=ch4On(),c3=ch3On()&&!c4,c2=ch2On(),list=c4?CH4:c3?CH3:c2?CH2:CH,i=c4?R.q4:c3?R.q3:c2?R.q2:R.ch;if(i>=list.length)return;const q=list[i],pr=q.p();if(pr[0]<pr[1])return;questCd=1.5;for(const k in q.r)R.res[k]=(R.res[k]||0)+q.r[k];if(c4)R.q4++;else if(c3)R.q3++;else if(c2)R.q2++;else R.ch++;track('quest',{c:c4?4:c3?3:c2?2:1,i:i+1,day:R.day});AudioFx.cue('win');vib('medium');persist();
 if(!c2&&R.ch>=CH.length){save.ch1=true;persist();track('ch1_clear',{day:R.day});bannerT=0;endCh=1;sc='ch1end';return}
 if(c4&&R.q4>=CH4.length){save.ch4=true;save.cleared=(save.cleared||0)+1;R.ended=true;R.endDay=R.day;R.regrow=R.day+6;persist();track('ch4_clear',{day:R.day});track('game_clear',{day:R.day,surv:R.surv.length,coffee:R.cnt.coffee});if(TOSS&&globalThis.__tossScore)try{globalThis.__tossScore(R.day)}catch(e){}bannerT=0;endCh=4;endFx=0;endPage=0;sc='ch1end';return}
 if(c3&&R.q3>=CH3.length){save.ch3=true;persist();track('ch3_clear',{day:R.day});bannerT=0;endCh=3;sc='ch1end';return}
 if(!c3&&!c4&&c2&&R.q2>=CH2.length){save.ch2=true;persist();track('ch2_clear',{day:R.day});bannerT=0;endCh=2;sc='ch1end';return}
 const rw=Object.keys(q.r).map(k=>LL(RES_N[k])+' +'+q.r[k]).join('  ');popTip({head:(c4?L('4장 ','第四章 '):c3?L('3장 ','第三章 '):c2?L('2장 ','第二章 '):'')+L('목표 달성 ','目标达成 ')+(i+1)+'/'+list.length,lines:[[LL(q.t),LL(q.t)],q.s].concat(rw?[[L('보상: ','奖励：')+rw,L('보상: ','奖励：')+rw]]:[]),t:0})}
function addSurvivor(i){if(R.surv.some(s2=>s2.id===i))return;R.surv.push({id:i,fed:true,ct:0});track('rescue',{i,day:R.day});AudioFx.cue('win');vib('long');const S=SURV[i];popTip({head:L('새 동료','新伙伴'),lines:[[S.n[0]+' ('+S.job[0]+')'+'가 배에 올랐다.',S.n[1]+'（'+S.job[1]+'）上了船。'],S.d,['동료는 하루에 음식 1개를 먹어요. 굶으면 다음 날 일을 쉬어요.','伙伴每天吃1份食物，饿着第二天就不干活。']],t:0});persist()}
const JOB={0:{p:25,e:'🎣',n:['낚시','钓鱼'],a:'fish',d:['낚싯대 옆에서 25초마다 물고기를 낚고, 모닥불이 타고 있으면 구워 둬요.','守在鱼竿旁，每25秒钓一条鱼；篝火燃着时会顺手烤好。']},1:{p:6,e:'🔧',n:['건지기·수리','打捞·修理'],a:'gather',d:['떠내려오는 물건을 건지고, 금 간 갑판을 고치고, 해질녘엔 모닥불을 살려요.','打捞漂来的东西、修补裂开的甲板，黄昏时给篝火添柴。']},2:{p:55,e:'🔭',n:['바다 살피기','瞭望'],a:'idle',d:['낮에는 바다를 살펴 보급 드럼을 찾아내고, 밤에는 망을 봐서 어둠 속의 그것을 막아요.','白天瞭望海面找补给桶，夜里守夜，挡住黑暗中的东西。']},3:{p:40,e:'🪚',n:['판자 다듬기','刨木板'],a:'craft',d:['40초마다 판자를 하나씩 다듬고, 지을 때 판자를 하나 아껴 줘요.','每40秒刨出一块木板，建造时还能省一块木板。']},4:{p:20,e:'🩺',n:['치료','治疗'],a:'craft',d:['20초마다 당신의 체력을 5씩 치료하고, 아침마다 20을 회복시켜요.','每20秒为你恢复5点体力，每天早上再恢复20点。']}};
function survPos(i){if(sc==='town'&&R.hb){const t=townPos(i);return {x:t.x,y:t.y}}const em=R.deck.filter(d=>!d.m&&!(d.x===R.p.gx&&d.y===R.p.gy)),pick=(k)=>{const t=R.deck.find(d=>d.m&&d.m.k===k);return t?tilePos(t.x,t.y):null};
 if(i===0){const p=pick('rod');if(p)return {x:p.x-24,y:p.y+14}}
 if(i===2){const p=pick('sail')||pick('radio');if(p)return {x:p.x+26,y:p.y+12}}
 if(i===4){const p=pick('bed');if(p)return {x:p.x+26,y:p.y+12}}
 if(i===3){const p=pick('still')||pick('rain');if(p)return {x:p.x-26,y:p.y+12}}
 const t=em[(i*2)%Math.max(1,em.length)]||R.deck[R.deck.length-1],p=tilePos(t.x,t.y);return {x:p.x+(i%2?18:-16),y:p.y-6}}
function survTick(dtt){const r=R.res;for(const s2 of R.surv){if(!s2.fed){s2.ct=0;continue}s2.ct+=dtt;s2.fx=Math.max(0,(s2.fx||0)-dtt);const ps=survPos(s2.id),J=JOB[s2.id];if(!J||s2.ct<J.p)continue;s2.ct=0;
  if(s2.id===0){if(hasM('rod')&&!inStorm()){r.fish++;R.today.fish++;s2.fx=1.5;fxText(ps.x,ps.y-50,L('도하: 물고기 +1','道河：鱼 +1'),'#b8d8ff')}const ft=fireTile();if(ft&&ft.m.fuel>=6&&r.fish>0){r.fish--;r.cooked++;ft.m.fuel-=6;R.cnt.cooked++;fxText(ps.x,ps.y-74,L('구워 둠','烤好了'),'#ffd0a0')}}
  if(s2.id===1){const o=debris.find(o2=>!o2.pull&&o2.k!=='survivor'&&o2.y>160&&o2.y<1000);if(o&&!sleeping){o.pull=true;s2.fx=1}
   const ft=fireTile();if(ft&&R.t>DUSK-10&&ft.m.fuel<20&&r.plank>1&&(ft.m.fuel>0||R.items.lighter||R.flint)){r.plank--;ft.m.fuel+=60;fxText(ps.x,ps.y-50,L('유나: 불을 살렸다','柔娜：添了火'),'#c8ffc8')}
   const dm=R.deck.find(d=>d.hp<3);if(dm&&r.plank>2){r.plank--;dm.hp=3;s2.fx=1;fxText(ps.x,ps.y-50,L('유나: 갑판 수리','柔娜：修好甲板'),'#c8ffc8')}}
  if(s2.id===2&&!isNight()&&!inStorm()){debris.push({k:'supply',x:120+Math.random()*510,y:-30,v:40,ph:0});s2.fx=2;fxText(ps.x,ps.y-50,L('마루: 저기 보급 드럼이 떠 온다!','玛鲁：那边漂来一个补给桶！'),'#ffe27a')}
  if(s2.id===3){r.plank=(r.plank||0)+1;s2.fx=1.2;fxText(ps.x,ps.y-50,L('한수: 판자 +1','韩洙：木板 +1'),'#ffe0b0')}
  if(s2.id===4&&R.vit.hp<95){R.vit.hp=Math.min(100,R.vit.hp+5);s2.fx=1.2;fxText(ps.x,ps.y-50,L('서린: 체력 +5','书林：体力 +5'),'#c8ffc8')}}}
function survEat(){let fed=0;for(const s2 of R.surv){const k=['cooked','can','berry'].find(k2=>R.res[k2]>0);if(k){R.res[k]--;s2.fed=true;fed++}else s2.fed=false}R.today.fedN=fed;R.today.hungryN=R.surv.length-fed}
function drawSurv(){for(const s2 of R.surv){const ps=survPos(s2.id),S=SURV[s2.id];g.save();g.globalAlpha=.3;g.fillStyle='#000';g.beginPath();g.ellipse(ps.x,ps.y+2,16,5,0,0,TAU);g.fill();g.restore();
  const J=JOB[s2.id],an=!s2.fed?'idle':s2.id===0?(hasM('rod')?'fish':'idle'):(s2.fx||0)>0?J.a:'idle';if(!sprite('surv'+s2.id,an,frame+s2.id,ps.x,ps.y+4,78,s2.id===0?-1:1,an==='fish'?3:6))circ(ps.x,ps.y-14,14,s2.id?'#6c6':'#69f','#111',3);
  {const nm=(s2.fed?J.e+' ':'😩 ')+LL(S.n);g.font='bold 12px sans-serif';const tw=g.measureText(nm).width+12;rr(ps.x-tw/2,ps.y-86,tw,20,9,s2.fed?'rgba(8,12,18,.78)':'rgba(60,14,10,.85)');txt(nm,ps.x,ps.y-76,12,s2.fed?'#fff':'#ffb0a0','center',false);if(s2.fed&&J.p>8){rr(ps.x-22,ps.y-63,44,5,3,'#0c1018');rr(ps.x-22,ps.y-63,44*Math.min(1,s2.ct/J.p),5,3,'#7fe0a0')}}{const tk=talkNext();if(tk&&tk.who===s2.id){const b=Math.sin(frame*5)*4;rr(ps.x-22,ps.y-134+b,44,32,10,'#fff3d6','#5a3a1e',2);txt('…',ps.x,ps.y-119+b,20,'#5a3a1e','center',false)}}}}
function bottle(){const b=BOTTLES[R.bottleIdx%BOTTLES.length];R.bottleIdx++;R.res.rope=(R.res.rope||0)+1;track('bottle',{i:R.bottleIdx});AudioFx.cue('pick');popTip({head:L('병 속의 쪽지','漂流瓶'),lines:[b,[L('(병을 묶은 밧줄 +1)','（绑瓶子的绳子 +1）'),L('(병을 묶은 밧줄 +1)','（绑瓶子的绳子 +1）')]],t:0})}
function radioMorning(){if(!R.radioBuilt)return;const i2=R.radioIdx-RADIO.length;if(R.radioIdx<RADIO.length){radioShow={l:RADIO[R.radioIdx],t:9};R.radioIdx++;AudioFx.cue('warn')}else if(ch2On()&&i2<RADIO2.length){radioShow={l:RADIO2[i2],t:9};R.radioIdx++;AudioFx.cue('warn')}else if(ch3On()&&i2-RADIO2.length<RADIO3.length){radioShow={l:RADIO3[i2-RADIO2.length],t:9};R.radioIdx++;AudioFx.cue('warn')}else if(ch4On()&&i2-RADIO2.length-RADIO3.length<RADIO4.length){radioShow={l:RADIO4[i2-RADIO2.length-RADIO3.length],t:9};R.radioIdx++;AudioFx.cue('warn')}}
function ch3End(){g.fillStyle='#071016';g.fillRect(0,0,W,H);if(imgs.title){g.drawImage(imgs.title,0,0,W,H);g.fillStyle='rgba(4,8,14,.8)';g.fillRect(0,0,W,H)}drawGlow(375,330,220+Math.sin(frame*2)*14,'b',.5);
 txt(L('3장 완료','第三章 完'),375,170,30,'#c9d2de','center');txt(L('맑은 물','清水'),375,240,64,'#9fd8ff','center');
 para(L('뿌리가 타자, 강은 사흘 만에 제 색을 찾았다.\n제재소의 톱이 돌고, 다리 밑 사람들은 나룻배를 몬다.\n\n한수가 지도 한 장을 펼쳤다.\n“회색은 여기서 시작됐네. 우리가 떠나온 그 도시.”','根被烧掉后，河水三天就恢复了本色。\n锯木厂的锯子转了起来，桥下的人撑起了渡船。\n\n韩洙摊开一张地图。\n“灰色是从这里开始的。就是我们逃出来的那座城。”'),375,470,23,'#f0eee4',600,38,'center');
 txt(L(R.day+'일째 · 동료 '+R.surv.length+'명 · 커피 '+R.cnt.coffee+'잔','第'+R.day+'天 · 伙伴'+R.surv.length+'人 · 咖啡'+R.cnt.coffee+'杯'),375,800,21,'#ffe7a0','center');
 txt(L('마지막 4장 「회색 심장」으로 이어집니다','接下来是最终章第四章「灰色心脏」'),375,850,18,'#9fb0c4','center',false);
 button(110,930,250,90,L('공유','分享'),'blue',26,shareGame);button(390,930,250,90,L('4장 시작','开始第四章'),'gold',24,()=>{goHome()},{id:'btn_ch1'})}
function ch1Screen(){if(endCh===4){endingScreen();return}if(endCh===3){ch3End();return}const two=endCh===2;g.fillStyle='#071016';g.fillRect(0,0,W,H);if(imgs.title){g.drawImage(imgs.title,0,0,W,H);g.fillStyle='rgba(4,8,14,.78)';g.fillRect(0,0,W,H)}drawGlow(375,330,220+Math.sin(frame*2)*14,'y',.5);
 txt(two?L('2장 완료','第二章 完'):L('1장 완료','第一章 完'),375,170,30,'#c9d2de','center');txt(two?L('돌아온 항구','归来的港口'):L('등대의 불','灯塔之光'),375,240,64,'#ffcf6a','center');
 para(two?L('회색 심장이 멎자, 항구 전체에 색이 돌아왔다.\n부두에는 배가, 시장에는 사람이, 거리에는 불빛이 있다.\n\n그날 밤 강 상류에서 무전이 왔다.\n"거기… 정말 사람이 삽니까?"','灰色心脏停跳，整座港口恢复了颜色。\n码头有船，集市有人，街上有灯。\n\n那天夜里，河的上游传来了电台声。\n"那边……真的有人活着吗？"'):L('등대에 불이 켜지자, 수평선 여기저기서 작은 불빛들이 대답했다.\n살아남은 배들이 동쪽 항구로 모여들고 있다.\n\n이제 바다에서 버티는 이야기는 끝났다.\n땅을 되찾을 차례다.','灯塔亮起，地平线上星星点点的灯火作出了回应。\n幸存的船只正向东港聚集。\n\n在海上求生的故事结束了。\n现在，轮到夺回陆地。'),375,470,23,'#f0eee4',600,38,'center');
 txt(L(R.day+'일째 · 동료 '+R.surv.length+'명 · 갑판 '+R.deck.length+'칸','第'+R.day+'天 · 伙伴'+R.surv.length+'人 · 甲板'+R.deck.length+'格'),375,800,21,'#ffe7a0','center');
 txt(two?L('3장 「강을 거슬러」로 이어집니다','接下来是第三章「溯河而上」'):L('2장 「항구 수복」으로 이어집니다','接下来是第二章「夺回港口」'),375,850,18,'#9fb0c4','center',false);
 button(110,930,250,90,L('공유','分享'),'blue',26,shareGame);button(390,930,250,90,two?L('3장 시작','开始第三章'):L('2장 시작','开始第二章'),'gold',24,()=>{goHome()},{id:'btn_ch1'})}
// ================================================================ 상태
let sc='loading',frame=0,last=0,loadT=0,paused=false,tutStep=0;
let R=save.run;// 진행 중인 해상 생존 기록(저장됨)
let A=null;// 1막 탈출 상태(저장 안 함)
let Land=null;// 상륙 상태
let buildPick=null,sleeping=false,act=null,fx=[],debris=[],gulls=[],spawnT=0,fishing=null;
let guideTip=null,guidePage=0,guideRet='title',resetArm=0,failInfo=null,zoneT=0,dayendT=0,g1T=0,camY=0;
function isPlay(){return sc==='act1'||sc==='sea'||sc==='land'||sc==='town'}

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
 if(A.board>0){A.board+=dt;if(A.board>2.6){gotDoc(0);track('act1_clear',{bag:A.bag.length,t:Math.round(A.t)});sc='zone';zoneT=0}return}
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
function enterSea(){migrate();sc=home();evCard=null;raid=null;shark=null;school=null;debris=[];fx=[];buildPick=null;sleeping=false;act=null;fishing=null;const pp=tilePos(R.p.gx,R.p.gy);seaP={x:pp.x,y:pp.y,tx:pp.x,ty:pp.y};gulls=[];for(let i=0;i<3;i++)gulls.push({x:Math.random()*W,y:230+Math.random()*260,v:34+Math.random()*26,ph:Math.random()*6,sz:.8+Math.random()*.45});spawnT=1;morningEvents(true)}
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
function markLand(){if(R.landed!==R.day){R.landed=R.day;R.landN=1}else R.landN=(R.landN||1)+1}
function canLand(){return R.landed!==R.day||(R.landN||1)<2}
function islandOpen(){return R.day>=Z().island&&R.t<112&&canLand()&&!inStorm()}
function morningEvents(resume){if(resume)return;
 for(const d of R.deck)if(d.m&&d.m.k==='rain')d.m.w=Math.min(6,(d.m.w||0)+1);// 새벽 이슬
 R.rainAt=Math.random()<.55*Z().rain?40+Math.random()*60:-1;R.today={debris:0,built:0,fish:0,lost:0};radioMorning();harborMorning();cityMorning();
 if(stormDay())message(L('기압계 바늘이 떨어진다… 오늘 오후 폭풍이 온다!','气压计在下降……今天下午有风暴！'),3);
 else if(R.day+1===Z().storm||(R.day+1>Z().storm&&(R.day+1-Z().storm)%4===0))message(L('무전: "내일 오후 폭풍 예보." 밧줄로 배를 묶어 두자','电台："明天下午有风暴。"用绳子加固船吧'),3)}
function seaTick(dt){if(raid){raidTick(dt);return}const Zn=Z(),v=R.vit,spd=sleeping?4:1;const dtt=dt*spd;R.t+=dtt;if(R.raid===R.day&&R.t>=NIGHT&&ch2On()){raidStart();return}questTick(dt);survTick(dtt);teach();if(R.buff>0)R.buff=Math.max(0,R.buff-dtt);if(radioShow){radioShow.t-=dt;if(radioShow.t<=0)radioShow=null}
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
 if(R.tb&&R.tb.dock&&!inStorm()){R.dockT=(R.dockT||0)+dtt;if(R.dockT>=30){R.dockT=0;const ks=['plank','plank','plastic','cloth','scrap','rope'],k=ks[Math.floor(Math.random()*ks.length)],n=k==='plank'?2:1;R.res[k]=(R.res[k]||0)+n;R.cnt.debris++;if(sc==='town')fxText(TB.dock.x,TB.dock.y-20,L('어선: ','渔船：')+LL(RES_N[k])+' +'+n,'#fff3c0')}}
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
 for(const o of debris){if(o.pull){const dx=seaP.x-o.x,dy=seaP.y-o.y,d=Math.hypot(dx,dy);const k=Math.min(1,700*dt/Math.max(1,d));o.x+=dx*k;o.y+=dy*k;if(d<30){o.gone=1;collect(o)}}else{let push=0;for(const d of R.deck){const p=tilePos(d.x,d.y);if(Math.abs(o.x-p.x)<T*.95&&Math.abs(o.y+30-p.y)<T*.95){push=o.x>=RAFT_X?1:-1;break}}if(push){o.x+=push*150*dt;o.y+=o.v*dt*.25}else{o.y+=o.v*dt*(storm?2:1);o.x+=Math.sin(frame*1.3+o.ph)*12*dt}}}
 debris=debris.filter(o=>!o.gone&&o.y<H+60);
 if(R.ch>=4&&!storm&&!night&&!sleeping&&!shark&&!school&&!evCard){R.evT=(R.evT===undefined?40:R.evT)-dtt;if(R.evT<=0){R.evT=55+Math.random()*35;seaEvent()}}if(shark||school)evTick(dt);if(R.vit.hp<30)R.ff=false;
 for(const s of gulls){s.x+=s.v*dt;if(s.x>W+40)s.x=-40}heroBusy=Math.max(0,heroBusy-dt);
 // 걷기와 행동
 moveTo(seaP,dt,buffOn()?320:240);if(seaP.path&&seaP.path.length&&Math.hypot(seaP.x-seaP.tx,seaP.y-seaP.ty)<4){const n=seaP.path.shift();seaP.tx=n.x;seaP.ty=n.y}
 if(act&&!(seaP.path&&seaP.path.length)&&Math.hypot(seaP.x-seaP.tx,seaP.y-seaP.ty)<4){const a=act;act=null;a()}
 if(fishing){fishing.t+=dtt;if(fishing.t>=7){const ok=Math.random()<.45*Zn.fish;fishing=null;if(ok){R.res.fish++;R.today.fish++;fxText(seaP.x,seaP.y-40,L('물고기! +1','钓到鱼！+1'),'#b8f0ff');AudioFx.cue('splash');vib('light')}else fxText(seaP.x,seaP.y-40,L('놓쳤다…','跑了……'),'#aab')}}
 if(sleeping&&!night)sleeping=false}
function spawnDebris(){if(ch2On()&&Math.random()<.75)return;if(R.ch===8&&R.radioBuilt&&!R.surv.length&&!debris.some(o=>o.k==='survivor')&&Math.random()<.3){debris.push({k:'survivor',x:140+Math.random()*(W-280),y:-30,v:26,ph:0});return}
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
function endDay(){if(TOSS&&globalThis.__tossScore)try{globalThis.__tossScore(R.day)}catch(e){}sleeping=false;fishing=null;act=null;survEat();if(R.res.fish>0){R.today.lost+=R.res.fish;R.today.spoil=R.res.fish;R.res.fish=0}if(inStorm()===false&&R.lashed>0&&stormDay())R.lashed--;
 save.stats.days++;save.stats.best=Math.max(save.stats.best,R.day);track('day_end',{day:R.day,hp:Math.round(R.vit.hp),deck:R.deck.length,mods:R.deck.filter(d=>d.m).length});
 if(fireLit()||R.today.lost===0)mission('night');sc='dayend';dayendT=0;persist()}
function nextDay(){if(stormDay()&&R.lashed>0)R.lashed=0;R.day++;R.t=0;R.shadowT=0;R.stormHit=0;persist();
 if(R.day===4&&!save.g1fb){sc='g1done';g1T=0;return}sc='sea';morningEvents(false)}
// --- 탭 처리 (바다)
function seaTap(x,y){if(sleeping){sleeping=false;message(L('잠에서 깼다','醒了'),1);return}if(evTap(x,y))return;
 for(const s2 of R.surv){const ps=survPos(s2.id);if(Math.hypot(x-ps.x,y-(ps.y-30))<38){const J=JOB[s2.id],S=SURV[s2.id];AudioFx.cue('ui');track('surv_tap',{id:s2.id});popTip({head:LL(S.n)+' · '+LL(S.job),lines:[s2.fed?[J.e+' '+J.d[0],J.e+' '+J.d[1]]:['😩 배가 고파서 쉬고 있어요. 하루가 끝날 때 음식(구운 생선·통조림·열매)이 있어야 다음 날 일해요.','😩 饿着肚子在休息。一天结束时要有食物（烤鱼、罐头、野果），第二天才会干活。'],S.d],t:0});return}}
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
function deckPath(a,b){if(!a)return [b];const key=(c)=>c.x+','+c.y,prev={},q=[a];prev[key(a)]=null;while(q.length){const c=q.shift();if(c.x===b.x&&c.y===b.y)break;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const n={x:c.x+dx,y:c.y+dy};if(prev[key(n)]!==undefined||!tileAt(n.x,n.y))continue;prev[key(n)]=c;q.push(n)}}
 if(prev[key(b)]===undefined)return [b];const out=[];let c=b;while(c){out.unshift(c);c=prev[key(c)]}return out.slice(1)}
function walkTo(t,fn){const p=tilePos(t.x,t.y);let ox=0;if(t.m)ox=seaP.x<p.x?-T*.32:T*.32;const here=cellAt(seaP.x,seaP.y)||{x:R.p.gx,y:R.p.gy};const path=deckPath(tileAt(here.x,here.y)?here:null,{x:t.x,y:t.y});seaP.path=path.slice(0,-1).map(c=>tilePos(c.x,c.y));const fin={x:p.x+ox,y:p.y+(t.m?T*.18:0)};seaP.path.push(fin);const n=seaP.path.shift();seaP.tx=n.x;seaP.ty=n.y;R.p.gx=t.x;R.p.gy=t.y;act=fn;fishing=null}
function useTile(t){if(t.hp<3){if(R.res.plank>0){R.res.plank--;t.hp=3;AudioFx.cue('build');fxText(seaP.x,seaP.y-40,L('수리!','修好了！'),'#ffe7a0');return}message(L('고치려면 판자가 필요해요','修补需要木板'),1.2);return}
 if(!t.m)return;const m=t.m,r=R.res,v=R.vit;heroBusy=.8;
 if(m.k==='rain'||m.k==='still'){if((m.w||0)>0){if(v.thirst<92){m.w--;v.thirst=Math.min(100,v.thirst+35);mission('drink');heroDo('drink');AudioFx.cue('splash');fxText(seaP.x,seaP.y-40,L('꿀꺽! 갈증 +35','咕嘟！口渴 +35'),'#9fd8ff')}else{m.w--;r.water++;fxText(seaP.x,seaP.y-40,L('물을 병에 담았다 +1','装进水瓶 +1'),'#9fd8ff')}}else message(m.k==='rain'?L('아직 비어 있어요. 비가 오면 차요','还是空的，下雨时会蓄满'):L('물이 만들어지는 중이에요','正在制造淡水'),1.4);return}
 if(m.k==='fire'){if(r.fish>0&&m.fuel>=6){r.fish--;r.cooked++;m.fuel-=6;R.cnt.cooked++;mission('cook');AudioFx.cue('fire');fxText(seaP.x,seaP.y-40,L('생선을 구웠다','烤好了鱼'),'#ffc080');return}
  if(r.plank>0){if(!m.fuel&&!R.items.lighter&&!R.flint){if(r.scrap>=2){r.scrap-=2;R.flint=true;message(L('고철로 부싯돌을 만들어 불을 붙였다 (고철 -2)','用废铁做了打火石点火（废铁-2）'),2)}else{message(L('불을 붙일 도구가 없어요. 고철 2개로 부싯돌을 만들 수 있어요','没有点火工具。2个废铁可以做打火石'),2);return}}
   r.plank--;m.fuel=(m.fuel||0)+60;AudioFx.cue('fire');fxText(seaP.x,seaP.y-40,L('불길 +60초','火焰 +60秒'),'#ffb070');return}
  message(L('넣을 판자가 없어요','没有可以添的木板'),1.2);return}
 if(m.k==='rod'){fishing={t:0};fxText(seaP.x,seaP.y-40,L('낚시 중…','钓鱼中……'),'#cfe');return}
 if(m.k==='coffee'){if(r.berry>=2&&r.water>=1){r.berry-=2;r.water--;r.coffee=(r.coffee||0)+1;heroDo('craft');AudioFx.cue('fire');fxText(seaP.x,seaP.y-40,L('수상한 검은 물 +1 (커피)','可疑的黑水 +1（咖啡）'),'#e8c8a0')}else message(L('열매 2개와 물 1병이 필요해요. 열매는 섬과 강가 덤불에 있어요','需要2个野果和1瓶水。野果在小岛和河岸的灌木丛里'),2.2);return}
 if(m.k==='bed'){if(buffOn()){message(L('눈이 말똥말똥하다. 커피 기운이 빠질 때까지 잠이 안 온다','眼睛瞪得溜圆。咖啡劲儿没过，睡不着'),2);return}if(isNight()){sleeping=true;message(L('잠을 청한다… (화면을 탭하면 깨요)','睡下了……（点屏幕醒来）'),2)}else message(L('잠은 밤에 자요','晚上才能睡'),1.2);return}
 if(m.k==='radio'){radioUse();return}
 if(m.k==='sail'||m.k==='lash'){message(LL(MODS[m.k].d),1.4)}}
function radioUse(){AudioFx.cue('warn');message(L('…치직… "여기는 동쪽 항구… 살아 있는 사람… 등대에 불을…" 신호가 끊겼다. (3막 예고)','……滋滋……"这里是东港……有活人吗……点亮灯塔……"信号断了。（第三幕预告）'),4);track('radio_signal',{day:R.day})}
function cellAt(x,y){const gx=Math.round((x-RAFT_X)/T),gy=Math.round((y-RAFT_Y)/T);if(Math.abs(x-(RAFT_X+gx*T))>T/2||Math.abs(y-(RAFT_Y+gy*T))>T/2)return null;if(gx<-3||gx>3||gy<-3||gy>4)return null;return {x:gx,y:gy}}
function adjacentEmpty(x,y){return !!(tileAt(x+1,y)||tileAt(x-1,y)||tileAt(x,y+1)||tileAt(x,y-1))}
function costOf(k){const cst=Object.assign({},MODS[k].cost);if(R.items.tools&&cst.plank)cst.plank=Math.max(0,cst.plank-1);if(cst.plank>1&&R.surv.some(s2=>s2.id===3&&s2.fed))cst.plank--;if(k==='rod'&&R.deck.every(d=>!d.m||d.m.k!=='rod')&&R.freeRod)cst.plank=0;return cst}
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
 if(!(stormDay()&&R.t>40&&R.t<100)&&!night)for(const s of gulls)drawGull(s)
 // 떠내려오는 물건
 for(const o of debris){const col={plank:'#c79a5b',plastic:'#7fc6e8',cloth:'#c9c2e0',crate:'#a07850',scrap:'#9aa3ad',supply:'#ffd060'}[o.k];g.save();g.translate(o.x,o.y);g.rotate(Math.sin(frame+o.ph)*.2);if(o.k==='supply')drawGlow(0,0,52,'y',.5);else drawGlow(0,4,46,'w',.28+.08*Math.sin(frame*3+o.ph));
  if(o.k==='survivor'){drawGlow(0,0,80,'y',.45);wsp('boat',0,6,124);sprite('surv0','idle',frame,0,8,62,-1,6);txt('!',0,-58,28,'#ffe27a','center')}else if(o.k==='bottle'){drawGlow(0,0,44,'b',.6);icon('water',0,0,46)}else if(wsp('debris_'+o.k,0,0,o.k==='supply'?92:80)){}else if(icon(ICON_OF[o.k],0,0,o.k==='supply'?60:50)){}else if(o.k==='plank')rr(-26,-8,52,16,4,col,'#2a1e14',2);else if(o.k==='plastic')rr(-14,-18,28,36,10,col,'#1e3a48',2);else if(o.k==='cloth')rr(-20,-12,40,24,10,col,'#3a3550',2);else if(o.k==='crate'){rr(-18,-18,36,36,4,col,'#3a2414',3);g.strokeStyle='#3a2414';g.beginPath();g.moveTo(-18,-18);g.lineTo(18,18);g.stroke()}else if(o.k==='scrap')rr(-16,-10,32,20,2,col,'#333',2);else{drawGlow(0,0,40,'y',.6);rr(-20,-20,40,40,6,col,'#5a4010',3)}
  g.restore();if(o.pull){g.strokeStyle='#e8e0c8';g.lineWidth=2;g.beginPath();g.moveTo(seaP.x,seaP.y);g.lineTo(o.x,o.y);g.stroke()}}
 drawEvSea();
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
 seaHud();if(evCard)drawEvCard()}
function drawGull(s){const k=s.sz||1,f=Math.sin(frame*7+(s.ph||0)),glide=Math.sin(frame*.7+(s.ph||0))>.3,w=glide?.15:f;g.save();g.globalAlpha=.16;g.fillStyle='#002030';g.beginPath();g.ellipse(s.x+26*k,s.y+70*k,16*k,4*k,0,0,TAU);g.fill();g.restore();
 g.save();g.translate(s.x,s.y);g.scale(k,k);g.lineCap='round';g.lineJoin='round';
 const wing=(dir)=>{g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(dir*10,-10-w*10,dir*22,-4-w*14);g.quadraticCurveTo(dir*12,-2-w*4,0,2);g.closePath();g.fillStyle='#f4f6f8';g.fill();g.strokeStyle='#3a4450';g.lineWidth=1.6;g.stroke();g.beginPath();g.moveTo(dir*16,-3-w*12);g.lineTo(dir*22,-4-w*14);g.strokeStyle='#2a3038';g.lineWidth=2.4;g.stroke()};
 wing(-1);wing(1);g.fillStyle='#fbfcfd';g.beginPath();g.ellipse(0,1,9,4,0,0,TAU);g.fill();g.strokeStyle='#3a4450';g.lineWidth=1.4;g.stroke();g.fillStyle='#f0b030';g.beginPath();g.moveTo(9,0);g.lineTo(14,1);g.lineTo(9,2.5);g.fill();g.restore()}
function drawModule(d,p){const m=d.m,M=MODS[m.k];g.save();g.fillStyle='rgba(12,16,22,.42)';g.beginPath();g.ellipse(p.x,p.y+2,36,32,0,0,TAU);g.fill();g.strokeStyle=M.col;g.globalAlpha=.75;g.lineWidth=3;g.stroke();g.restore();if(!icon(ICON_OF[m.k],p.x,p.y-6,74))rr(p.x-28,p.y-30,56,52,10,M.col,'#111',3);{const lb=LL(M.n);g.font='bold 13px sans-serif';const tw=Math.max(44,g.measureText(lb).width+14);rr(p.x-tw/2,p.y+22,tw,21,10,'rgba(8,12,18,.82)');txt(lb,p.x,p.y+33,13,'#fff','center',false)}
 if(m.k==='rain'||m.k==='still'){const cap=m.k==='rain'?6:3;for(let i=0;i<cap;i++)rr(p.x-24+i*(48/cap),p.y+8,48/cap-3,8,2,i<(m.w||0)?'#5fb4ff':'#1d2a36')}
 if(m.k==='fire'){if(m.fuel>0){drawGlow(p.x,p.y-8,40+Math.sin(frame*12)*4,'o',.9);txt(Math.ceil(m.fuel)+'s',p.x,p.y-42,15,'#ffd0a0','center')}else txt(L('꺼짐','熄灭'),p.x,p.y-42,14,'#aab','center')}
 if(m.k==='sail'&&!imgs.icons){g.fillStyle='#efe8d8';g.beginPath();g.moveTo(p.x,p.y-60);g.lineTo(p.x+30,p.y+10);g.lineTo(p.x,p.y+10);g.fill()}}
function vitIcon(k){return {thirst:['갈증','口渴'],hunger:['허기','饥饿'],temp:['체온','体温'],hp:['체력','体力']}[k]}
function seaHud(){const v=R.vit,r=R.res;if(sc==='sea'&&ch2On()&&(isNight()||R.t>DUSK))drawCoast();rr(0,0,W,150,0,'#0b0f16e8');
 txt(L(R.day+'일째','第'+R.day+'天'),24,34,28,'#ffe2a0','left',false);const ph=inStorm()?L('폭풍','风暴'):isNight()?L('밤','夜晚'):R.t>DUSK?L('해질녘','黄昏'):L('낮','白天');txt(ph,150,34,22,inStorm()?'#ff9a7a':isNight()?'#9fb0ff':'#dfe6ee','left',false);
 rr(230,24,300,16,8,'#1a2230');rr(230,24,300*Math.min(1,R.t/DAY),16,8,isNight()?'#6070c0':'#e0b060');rr(230+300*NIGHT/DAY-1,20,3,24,1,'#9fb0ff');
 button(546,14,92,56,R.ff?'▶▶ x3':'▶ x1',R.ff?'gold':'dark',20,()=>{R.ff=!R.ff;track('ff',{on:R.ff?1:0})},{id:'btn_ff'});button(646,14,82,56,'II','dark',24,()=>{paused=true});
 const keys=['thirst','hunger','temp','hp'],cols={thirst:'#5fb4ff',hunger:'#e0a860',temp:'#ff9a5a',hp:'#7fe0a0'};
 keys.forEach((k,i)=>{const x=20+i*180,y=62;const can=vitCan(k);rr(x,y,168,70,12,'#151b26',can?'#8a7a4a':'#2c3646',2);if(can&&v[k]<45){g.save();g.globalAlpha=.45+.45*Math.sin(frame*6);rr(x,y,168,70,12,null,'#ffe27a',4);g.restore()}txt(LL(vitIcon(k))+(can?(k==='thirst'?L(' ▸마시기',' ▸喝'):k==='hunger'?L(' ▸먹기',' ▸吃'):L(' ▸치료',' ▸治疗')):''),x+12,y+22,can?15:17,can?'#ffe27a':'#dfe6ee','left',false);txt(Math.round(v[k])+'',x+156,y+22,18,v[k]<25?'#ff8a7a':'#fff','right',false);rr(x+12,y+42,144,14,7,'#0c1018');rr(x+12,y+42,144*v[k]/100,14,7,v[k]<25?'#ff6a5a':cols[k]);
  hotspot(x,y,168,70,()=>useVital(k),'vit_'+k)});
 // 다음 목표
 txt('▶ '+nextGoal(),24,172,18,'#ffe7a0','left');{const tk=!inStorm()&&!buildPick&&talkNext();if(tk)button(16,994,400,56,'💬 '+LL(SURV[tk.who].n)+' · '+LL(tk.t),'blue',19,()=>{talk={k:tk,i:0};sc='talk';AudioFx.cue('ui')},{id:'btn_talk'})}if(buffOn()){rr(600,958,134,40,12,'#2a1c12e8','#c89a6a',2);drawMug(626,979,34);txt(Math.ceil(R.buff)+L('초','秒'),690,979,18,'#ffe2c0','center',false)}
 if(radioShow){const ls=wrap(LL(radioShow.l),18,640);g.save();g.globalAlpha=Math.min(1,radioShow.t);rr(20,194,710,22+ls.length*26,12,'#1a1430e8','#b08aff',2);ls.forEach((l,i)=>txt((i?'':'📻 ')+l,36,216+i*26,18,'#e8dcff','left',false));g.restore()}
 // 자원 줄
 rr(0,1060,W,274,0,'#0b0f16ee');const show=['plank','plastic','cloth','scrap','rope','water','can','fish','cooked','berry','med','coffee'];
 show.forEach((k,i)=>{const x=16+(i%6)*121,y=1076+Math.floor(i/6)*44;const cf=k==='coffee';rr(x,y,113,38,9,'#161d28',cf&&(r.coffee||0)>0?'#ffe27a':null,2);if(cf)hotspot(x,y-4,113,46,drinkCoffee,'res_coffee');if(!icon(ICON_OF[k],x+17,y+19,32))circ(x+16,y+19,7,RES_C[k]);txt(LL(RES_N[k]),x+28,y+19,13,'#b6c0cc','left',false);txt(''+(r[k]||0),x+106,y+19,16,(r[k]||0)>0?'#fff':'#5a6472','right',false)});
 const by=1180;if(sc==='town'&&raid){rr(16,by,718,84,16,'rgba(70,10,8,.85)','#ff7a6a',2);txt(L('마을을 지키는 중… 감염체를 탭하고, 방벽을 탭해 고쳐요','守卫村子中……点丧尸，点路障修补'),375,by+42,19,'#ffe0d8','center',false)}else if(sc==='town'){button(16,by,226,84,L('⛵ 뗏목','⛵ 木筏'),'gold',26,()=>{sc='sea';AudioFx.cue('ui')},{id:'btn_raft'});button(254,by,240,84,L('🗺 지도','🗺 地图'),'green',26,()=>{sc='world';AudioFx.cue('ui')},{id:'btn_map'})}else{button(16,by,226,84,L('짓기','建造'),'gold',28,()=>{sc='build';AudioFx.cue('ui')},{id:'btn_build'});
 const op=islandOpen();if(ch2On())button(254,by,240,84,L('🏘 마을로','🏘 回村子'),'green',26,()=>{sc='town';AudioFx.cue('ui')},{id:'btn_town'});else button(254,by,240,84,op?(R.ch===11?L('항구 원정','港口远征'):L('섬에 상륙','登岛')):L('섬 없음','附近无岛'),op?(R.ch===11?'red':'green'):'gray',26,()=>{if(islandOpen())startLand();else message(R.day<Z().island?L('아직 섬이 보이지 않아요','还看不到岛'):!canLand()?L('오늘 원정은 두 번까지예요','今天最多远征两次'):L('해가 지기 전엔 돌아올 수 없어요','天黑前回不来'),1.4)},{id:'btn_land'});
 }if(!raid)button(506,by,228,84,L('보급·일지','补给·日志'),'blue',24,()=>{guideRet=sc;sc='reward'},{id:'btn_reward'});if(rewardBadge())circ(722,by+8,10,'#ff4a4a');
 txt('v'+BUILD,726,1316,12,'#3a4452','right',false);
 if(sc==='sea'&&tutStep===0&&debris.length&&!guideTip&&!buildPick){const o=debris.find(o2=>o2.y>200&&o2.y<900);if(o)drawFinger(o.x,o.y+20)}}
function useVital(k){const r=R.res,v=R.vit;
 if(k==='thirst'){if(r.water>0&&v.thirst<95){r.water--;v.thirst=Math.min(100,v.thirst+35);mission('drink');heroDo('drink');AudioFx.cue('splash');return}message(r.water?L('목마르지 않아요','不渴'):L('마실 물이 없어요. 빗물 통·증류기를 탭하세요','没有水。点雨水桶或蒸馏器'),1.6);return}
 if(k==='hunger'){if(v.hunger>=95){message(L('배부르다','很饱'),1);return}const order=[['cooked',30,0],['can',35,0],['berry',15,0],['fish',12,8]];for(const [key,add,hurt] of order)if(r[key]>0){r[key]--;v.hunger=Math.min(100,v.hunger+add);heroDo('eat');if(hurt){v.hp-=hurt;message(L('날생선은 배탈이 날 수 있어요. 모닥불에 구워 먹자','生鱼会坏肚子，用篝火烤一下吧'),1.8)}AudioFx.cue('pick');return}
  message(L('먹을 것이 없어요. 낚시를 하거나 섬에 가 보세요','没有吃的，去钓鱼或者登岛'),1.6);return}
 if(k==='hp'){if(r.med>0&&v.hp<90){r.med--;v.hp=Math.min(100,v.hp+40);AudioFx.cue('win');return}message(L('치료약이 없거나 아직 괜찮아요','没有药或者还不需要'),1.4);return}
 if(k==='temp'){message(L('모닥불 가까이 서 있으면 몸이 녹아요','站在篝火旁就能暖和起来'),1.6)}}
function costTxt(k){const c2=costOf(k);return ' ('+Object.keys(c2).filter(r=>c2[r]>0).map(r=>LL(RES_N[r])+' '+c2[r]).join(LANG==='zh'?'·':'·')+')'}
function nextGoal(){if(stormDay()&&R.t<60&&!R.lashed&&R.ch>3)return L('폭풍 전에 밧줄로 배를 묶자','风暴来前用绳子加固船')+costTxt('lash');
 if(ch4On()){const q=CH4[R.q4];if(!q)return R.ended?L('엔딩 이후 · 땅을 지키며 살아가기 (생존 ','结局之后 · 守护土地继续生活（生存 ')+R.day+L('일)','天）'):'';const pr=q.p();let t2=L('4장 ','第四章 ')+(R.q4+1)+'/'+CH4.length+' · '+LL(q.t)+(pr[1]>1?' ('+Math.min(pr[0],pr[1])+'/'+pr[1]+')':'');if(R.q4===1)t2+=L(' — [지도] → 도시 → 만들기',' — [地图]→城市→制作');else t2+=L(' — [지도] → [도시]',' — [地图]→[城市]');return t2}
 if(ch3On()){const q=CH3[R.q3];if(!q)return L('강과 항구를 지키며 4장을 기다리자','守住河流与港口，等待第四章');const pr=q.p();let t2=L('3장 ','第三章 ')+(R.q3+1)+'/'+CH3.length+' · '+LL(q.t)+(pr[1]>1?' ('+Math.min(pr[0],pr[1])+'/'+pr[1]+')':'');if(q.b)t2+=costTxt(q.b);if(R.q3===2)t2+=L(' — 드리퍼 탭 → 아래 [커피] 탭',' — 点滤杯 → 点下方[咖啡]');if(R.q3===3||R.q3===4)t2+=L(' — [지도] → [강]',' — [地图] → [河流]');return t2}
 if(ch2On()){const q=CH2[R.q2];if(!q)return L('항구를 지키며 3장을 기다리자','守住港口，等待第三章');const pr=q.p();let t2=L('2장 ','第二章 ')+(R.q2+1)+'/'+CH2.length+' · '+LL(q.t)+(pr[1]>1?' ('+Math.min(pr[0],pr[1])+'/'+pr[1]+')':'');if(q.b)t2+=costTxt(q.b);if(R.q2===3&&R.raid)t2+=raidDays()===0?L(' — 오늘 밤!',' — 就在今晚！'):L(' — 습격까지 ',' — 距袭击 ')+raidDays()+L('일','天');else if([0,2,4,6].includes(R.q2))t2+=L(' — 마을에서 그 구역을 탭',' — 在村子里点那个区域');else if(R.q2===1)t2+=L(' — 되찾은 구역을 탭',' — 点已夺回的区域');return t2}
 const q=CH[R.ch],pr=q.p();let t2=L('목표 ','目标 ')+(R.ch+1)+'/'+CH.length+' · '+LL(q.t)+(pr[1]>1?' ('+Math.min(pr[0],pr[1])+'/'+pr[1]+')':'');
 if(q.b==='radio'&&!R.radioPart)return t2+L(' — 섬 오두막 상자에서 부품 찾기',' — 去岛上小屋的箱子里找零件');if(q.b)t2+=costTxt(q.b);
 if(R.ch===8)t2+=L(' — 구명보트가 떠내려오면 탭',' — 救生艇漂来时点击');if(R.ch===10)t2+=L(' — 섬에 상륙',' — 登岛');if(R.ch===11)t2+=L(' — [항구 원정]',' — [港口远征]');return t2}
function buildScreen(){g.fillStyle='rgba(5,8,14,.94)';g.fillRect(0,0,W,H);txt(L('짓기','建造'),375,70,38,'#ffe2a0','center');
 const show=['plank','plastic','cloth','scrap','rope'];show.forEach((k,i)=>{txt(LL(RES_N[k])+' '+(R.res[k]||0),75+i*150,120,17,RES_C[k],'center',false)});
 BUILD_LIST.forEach((k,i)=>{const M=MODS[k],y=150+i*104,ok=canPay(k);rr(30,y,690,94,14,ok?'#16202c':'#12161d',ok?M.col:'#2a3240',2);if(!icon(ICON_OF[k],74,y+46,70))rr(46,y+18,56,56,10,M.col,'#111',2);
  txt(LL(M.n),120,y+30,24,ok?'#fff':'#7a8494','left',false);txt(LL(M.d),120,y+66,16,'#9fb0c4','left',false);
  const c2=costOf(k);txt(Object.keys(c2).map(r=>LL(RES_N[r])+' '+c2[r]).join(' · ')+(M.need?' + '+L('부품','零件'):''),704,y+30,16,ok?'#ffe2a0':'#7a6a5a','right',false);
  hotspot(30,y,690,94,()=>chooseBuild(k),'build_'+k)});
 button(150,1200,450,84,L('◀ 닫기','◀ 关闭'),'gold',26,()=>{sc=(sc==='build'?'sea':'world')})}
function dayendScreen(){dayendT+=1/60;g.fillStyle='#0a0e16';g.fillRect(0,0,W,H);rr(50,120,650,900,20,'#f2ead8','#8a7a5a',4);
 txt(L('생존 일지','生存日志'),375,180,36,'#3a2e1e','center',false);txt(L(R.day+'일째 밤이 지나갔다','第'+R.day+'天的夜晚过去了'),375,240,24,'#5a4a32','center',false);
 const T2=R.today,lines=[L('건져 올린 물건 ','打捞的物品 ')+T2.debris,L('지은 것 ','建造 ')+T2.built,L('낚은 물고기 ','钓到的鱼 ')+T2.fish,L('잃은 것 ','损失 ')+T2.lost,L('갑판 ','甲板 ')+R.deck.length+L('칸','格')];
 if(R.surv.length)lines.push(L('동료 식사 ','伙伴吃饭 ')+(T2.fedN||0)+'/'+R.surv.length+((T2.hungryN||0)?L(' — 굶은 동료는 내일 쉬어요',' — 饿着的伙伴明天休息'):''));if(T2.spoil)lines.push(L('상해서 버린 날생선 ','变质丢弃的生鱼 ')+T2.spoil);lines.forEach((s,i)=>txt('· '+s,110,310+i*48,23,'#3a2e1e','left',false));
 const nd=R.day+1;const st=nd===Z().storm||(nd>Z().storm&&(nd-Z().storm)%4===0);txt(L('내일: ','明天：')+(st?L('오후 폭풍 예보','下午有风暴'):L('맑음','晴')),110,620,24,st?'#a03020':'#2a5a3a','left',false);
 para(L('"','"')+diaryLine()+L('"','"'),110,700,21,'#5a4a32',530);
 button(110,880,250,86,L('공유','分享'),'blue',24,shareGame);button(390,880,250,86,L('다음 날 ▶','下一天 ▶'),'gold',28,nextDay,{id:'btn_next'})}
function diaryLine(){const v=R.vit;if(v.hp<40)return L('몸이 버티지 못하고 있다. 내일은 먹고 마시는 것부터.','身体快撑不住了。明天先解决吃喝。');if(R.today.lost>1)return L('밤바다는 생각보다 가까이 있다. 불을 꺼뜨리면 안 된다.','夜里的海比想象的更近。火绝不能灭。');
 if(R.radioBuilt)return L('무전기 너머에서 사람 목소리를 들었다. 저 항구로 돌아가야 한다.','从电台里听到了人声。必须回到那个港口。');if(R.deck.length>=10)return L('배가 제법 커졌다. 이제는 집이라 불러도 될 것 같다.','船已经不小了，可以叫它家了。');return L('오늘도 살아남았다. 저 멀리 육지의 불 꺼진 도시가 보인다.','今天也活下来了。远处陆地上的城市一片漆黑。')}
function g1Screen(){g1T+=1/60;g.fillStyle='#0a0e16';g.fillRect(0,0,W,H);txt(L('사흘을 버텼다!','撑过了三天！'),375,260,56,'#ffcf6a','center');para(L('바다에서의 첫 사흘을 버텼어요. 진짜 이야기는 지금부터예요.\n지금까지 어땠는지 하나만 골라 주세요. (게임에는 영향 없어요)','你在海上撑过了最初的三天。真正的故事现在才开始。\n请选一个最接近你感受的选项。（不影响游戏）'),375,360,22,'#dfe6ee',600,36,'center');
 const ops=[['more',L('재밌어요','很好玩'),'green'],['unsure',L('그저 그래요','一般'),'blue'],['hard',L('너무 어려워요','太难了'),'red']];
 ops.forEach(([k,lab,st],i)=>button(150,560+i*120,450,92,lab,st,28,()=>{save.g1fb=k;track('feel_d3',{v:k,zone:Z().k});persist();sc='sea';morningEvents(false);message(L('고마워요! 바다는 계속돼요','谢谢！大海还在继续'),2)}))}

// ================================================================ 섬 상륙
const LAND_H=1900;
function startLand(){const harbor=R.ch===11;markLand();R.cnt.lands++;track('land_start',{day:R.day,harbor});mission('land');save.stats.lands++;if(harbor){startHarbor();return}let s=R.day*977+R.zone*131;const rnd=()=>{s=(s*16807)%2147483647;return (s%10000)/10000};
 const objs=[];for(let i=0;i<9;i++)objs.push({k:'tree',x:80+rnd()*590,y:420+rnd()*1050,hp:3});for(let i=0;i<5;i++)objs.push({k:'bush',x:80+rnd()*590,y:500+rnd()*1000,n:1});for(let i=0;i<4;i++)objs.push({k:'rock',x:80+rnd()*590,y:350+rnd()*900,n:2});
 const hx=180+rnd()*390,hy=520+rnd()*300;objs.push({k:'hut',x:hx,y:hy});if(R.ch===10&&R.surv.length===1)objs.push({k:'npc',x:hx+120,y:hy+70});for(let i=0;i<3;i++)objs.push({k:'crate',x:hx-60+i*60,y:hy+90,n:1,first:i===0});objs.push({k:'stream',x:375,y:250,n:3});
 const zs=[];for(let i=0;i<3;i++)zs.push({x:100+rnd()*550,y:300+rnd()*600,hp:3,a:0,hit:0,w:rnd()*6,hx:0,hy:0});zs.forEach(z=>{z.hx=z.x;z.hy=z.y});
 Land={p:{x:375,y:1760,tx:375,ty:1760,hit:0},objs,zs,carry:{},n:0,cap:(R.sail?16:12)+fleetN()*2,noise:0,target:null,work:0,atk:0,nightSpawn:false};sc='land';camY=LAND_H-H;
 tip('land',[['물건을 탭하면 가서 베고 줍고 열어요.','点击物体，走过去砍、捡、开。'],['소리를 내면(나무·바위) 감염체가 몰려와요. 소음 막대를 보세요.','砍树、敲石头会发出声音，丧尸会被吸引。注意噪音条。'],['해가 지기 전에 아래쪽 배를 탭해 돌아가요. 짐은 '+(R.sail?16:12)+'칸까지 실을 수 있어요.','天黑前点击下方的船返回。最多可带'+(R.sail?16:12)+'格。']])}
function landTick(dt){const Ld=Land,p=Ld.p,v=R.vit;R.t+=dt;const night=isNight();
 if(R.t>=DUSK&&R.t-dt<DUSK){message(L('해가 진다! 배로 돌아가자','太阳快落山了！回船上去'),2.2);AudioFx.cue('warn')}
 if(R.t>=DAY){backToSea(false);endDay();return}
 v.thirst-=.30*dt;v.hunger-=.22*dt;if(night)v.temp-=.3*Z().cold*dt;else if(v.temp<70)v.temp+=.1*dt;
 let bad=0;for(const k of ['thirst','hunger','temp'])if(v[k]<=0){v[k]=0;bad++}if(bad)v.hp-=.55*bad*dt;for(const k in v)v[k]=Math.max(0,Math.min(100,v[k]));
 if(night&&!Ld.nightSpawn){Ld.nightSpawn=true;for(let i=0;i<3;i++)Ld.zs.push({x:100+Math.random()*550,y:200+Math.random()*400,hp:3,a:1,hit:0,w:0,hx:375,hy:400})}
 const cmp=compId();Ld.noise=Math.max(0,Ld.noise-(cmp===2?16:6)*dt);moveTo(p,dt,buffOn()?290:230);Ld.atk-=dt;if(R.buff>0)R.buff=Math.max(0,R.buff-dt);
 const T2=Ld.target;
 if(T2){if(T2.z){if(T2.z.hp<=0)Ld.target=null;else{p.tx=T2.z.x;p.ty=T2.z.y+30;if(Math.hypot(p.x-T2.z.x,p.y-T2.z.y)<70&&Ld.atk<=0){Ld.atk=.55;T2.z.hp-=R.items.knife?2:1;AudioFx.cue('hit');vib('light');shake(5,.15);const d=Math.hypot(T2.z.x-p.x,T2.z.y-p.y)||1;T2.z.x+=(T2.z.x-p.x)/d*40;T2.z.y+=(T2.z.y-p.y)/d*40;if(T2.z.hp<=0){Ld.target=null;fxText(T2.z.x,T2.z.y-30,L('쓰러뜨렸다','击倒'),'#ddd')}}}}
  else{const o=T2.o;if(Math.hypot(p.x-o.x,p.y-o.y)<62){Ld.work+=dt;if(Ld.work>=(o.k==='tree'?(R.items.knife?.35:.6):.5)*(cmp===1?.5:1)*(buffOn()?.8:1)){Ld.work=0;landAct(o)}}}}
 for(const z of Ld.zs){if(z.hp<=0)continue;const d=Math.hypot(p.x-z.x,p.y-z.y),sp=(night?150:100)*(z.run?1.4:1);if(Ld.noise>55||d<190||night)z.a=1;else if(d>500)z.a=0;
  if(z.a){const k=sp*dt/Math.max(1,d);z.x+=(p.x-z.x)*k;z.y+=(p.y-z.y)*k}else{z.w+=dt;z.x=z.hx+Math.sin(z.w*.7)*50;z.y=z.hy+Math.cos(z.w*.5)*30}
  z.hit-=dt;z.atkT=Math.max(0,(z.atkT||0)-dt);if(d<38&&z.hit<=0){z.hit=1;z.atkT=.5;v.hp-=12*Math.max(.4,1-.25*R.surv.filter(s2=>s2.fed).length)*(cmp===0?.6:1)*(Ld.allin?.7:1);AudioFx.cue('hurt');vib('medium');shake(10,.25)}}
 for(const z of Ld.zs)if(z.hp<=0)z.dead=(z.dead||0)+dt;Ld.zs=Ld.zs.filter(z=>z.hp>0||z.dead<1.6);
 if(v.hp<=0){fail('land');return}
 if(Math.hypot(p.x-375,p.y-1830)<70&&Ld.goBoat)backToSea(true);
 camY+=((p.y-H*.58)-camY)*Math.min(1,dt*5);camY=Math.max(0,Math.min(LAND_H-H+200,camY))}
function startHarbor(){let s=R.day*313+7;const rnd=()=>{s=(s*16807)%2147483647;return (s%10000)/10000};const objs=[{k:'light',x:375,y:330,n:3}];
 for(let i=0;i<7;i++)objs.push({k:'crate',x:230+rnd()*290,y:520+i*150+rnd()*60,n:1});
 const zs=[];for(let i=0;i<8;i++){const x=220+rnd()*310,y=420+i*130;zs.push({x,y,hx:x,hy:y,hp:3,a:0,hit:0,w:rnd()*6,run:i%3===2})}
 Land={type:'harbor',p:{x:375,y:1760,tx:375,ty:1760,hit:0},objs,zs,carry:{},n:0,cap:(R.sail?16:12)+fleetN()*2,noise:0,target:null,work:0,atk:0,nightSpawn:false,lit:false};sc='land';camY=LAND_H-H;
 popTip({head:L('동쪽 항구','东港'),lines:[['거리 끝, 가장 위쪽에 등대가 있어요. 발전기를 3번 돌려 불을 켜세요.','街道尽头、最上方就是灯塔。转动发电机3次点亮它。'],['발전기 소리는 아주 커요. 감염체가 몰려오니 불을 켜면 곧장 배로 돌아가세요.','发电机声音很大，会引来丧尸。点亮后立刻回船。'],['동료가 있으면 받는 피해가 줄어요.','有伙伴同行，受到的伤害会减少。']],t:0})}
function drawLight(o){const x=o.x,y=o.y,lit=o.lit;if(lit){g.save();g.globalCompositeOperation='lighter';drawGlow(x,y-150,260+Math.sin(frame*4)*20,'y',.8);g.translate(x,y-150);g.rotate(frame*.9);g.fillStyle='rgba(255,236,170,.22)';g.beginPath();g.moveTo(0,0);g.lineTo(520,-70);g.lineTo(520,70);g.fill();g.restore()}
 rr(x-62,y-10,124,44,8,'#6a6660','#2a2622',3);g.fillStyle='#ece6da';g.beginPath();g.moveTo(x-40,y-10);g.lineTo(x-26,y-130);g.lineTo(x+26,y-130);g.lineTo(x+40,y-10);g.closePath();g.fill();g.strokeStyle='#2a2622';g.lineWidth=3;g.stroke();
 g.fillStyle='#c0442e';g.fillRect(x-36,y-56,72,22);g.fillRect(x-30,y-108,60,20);rr(x-34,y-142,68,14,4,'#3a3632','#1a1816',2);rr(x-22,y-176,44,36,6,lit?'#ffe9a0':'#4a5058','#1a1816',3);g.fillStyle='#c0442e';g.beginPath();g.moveTo(x-28,y-176);g.lineTo(x,y-204);g.lineTo(x+28,y-176);g.fill();
 txt(lit?L('등대 (켜짐)','灯塔（已点亮）'):L('등대 발전기 ','灯塔发电机 ')+(3-o.n)+'/3',x,y+56,18,lit?'#ffe9a0':'#fff','center')}
function drawNpc(o){drawGlow(o.x,o.y-20,60,'y',.4);if(!sprite('surv1','idle',frame,o.x,o.y+6,84,-1,6))circ(o.x,o.y-14,16,'#6c6','#111',3);txt('!',o.x,o.y-86,26,'#ffe27a','center');txt(LL(SURV[1].n),o.x,o.y+26,15,'#fff','center')}
function landAct(o){if(o.k==='nest'&&o.heart&&o.shell>0){const Ld=Land,d=R.ct.d[Ld.di];if((R.res.bomb||0)<=0){Ld.target=null;message(L('껍질이 불에 타지 않아요. 정화탄이 필요해요 ([지도] → 도시에서 만들기)','外壳烧不掉，需要净化弹（[地图]→城市里制作）'),2.6);return}
  R.res.bomb--;o.shell--;d.sh=o.shell;Ld.noise=100;shake(14,.5);vib('heavy');AudioFx.cue('thunder');for(let i=0;i<14;i++)fx.push({x:o.x+(Math.random()-.5)*160,y:o.y+(Math.random()-.5)*120,s:'✦',col:'#9ff0e0',t:Math.random()*.3});fxText(o.x,o.y-90,o.shell>0?L('껍질이 녹았다! 남은 껍질 ','外壳融化了！剩余外壳 ')+o.shell:L('껍질이 모두 녹았다! 이제 핵을 태우자','外壳全部融化！现在烧核心'),'#9ff0e0');for(const z of Ld.zs)z.a=1;for(let i=0;i<2;i++)Ld.zs.push({x:220+i*310,y:o.y-200,hx:375,hy:500,hp:3,a:1,hit:0,w:0,run:true});persist();return}
 if(o.k==='nest'){const Ld=Land;o.n--;if(o.big)R[Ld.reg||'hb'].d[Ld.di].bn=o.n;Ld.noise=Math.min(100,Ld.noise+45);AudioFx.cue('fire');shake(6,.2);vib('light');for(const z of Ld.zs)if(Math.hypot(z.x-o.x,z.y-o.y)<520)z.a=1;
  if(o.big&&o.n>0&&(o.root?o.n===4:o.heart?o.n%3===0:o.n%2===0))for(let i=0;i<2;i++)Ld.zs.push({x:260+i*230,y:300,hx:375,hy:400,hp:3,a:1,hit:0,w:0,run:true});
  if(o.n<=0){o.gone=1;Ld.target=null;const d=R[Ld.reg||'hb'].d[Ld.di];d.left=Math.max(0,d.left-1);fxText(o.x,o.y-50,L('둥지를 태웠다!','巢穴烧掉了！'),'#ffd9a0');AudioFx.cue('win');if(d.left<=0){Ld.clear=true;message(L('이 구역의 둥지를 모두 태웠다! 배로 돌아가자!','这一带的巢穴全烧光了！快回船上！'),3)}}return}
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
 if(Math.abs(wx-375)<85&&Math.abs(wy-1822)<60){Ld.goBoat=true;Ld.target=null;Ld.p.tx=375;Ld.p.ty=1830;return}
 for(const z of Ld.zs)if(z.hp>0&&Math.hypot(wx-z.x,wy-z.y)<50){Ld.target={z};Ld.goBoat=false;return}
 let best=null,bd=70;for(const o of Ld.objs)if(!o.gone&&o.k!=='hut'&&!o.lit){const d=Math.hypot(wx-o.x,wy-(o.k==='light'?o.y-60:o.y));if(d<(o.k==='light'?130:bd)){bd=Math.min(bd,d);best=o}}
 Ld.goBoat=false;if(best){Ld.target={o:best};Ld.work=0;Ld.p.tx=best.x;Ld.p.ty=best.y+40}else{Ld.target=null;Ld.p.tx=wx;Ld.p.ty=Math.max(160,wy)}}
function artLand(o){if(o.k==='tree'){wsp(o.hp<3?'tree_chop':'tree',o.x,o.y+30,150,'bottom');if(o.hp<3)txt(o.hp+'',o.x+44,o.y-80,18,'#fff','center');return true}
 if(o.k==='bush')return wsp('bush',o.x,o.y+20,100,'bottom');if(o.k==='rock')return wsp('rock',o.x,o.y+24,110,'bottom');
 if(o.k==='hut'){wsp('hut',o.x,o.y+70,280,'bottom');return true}if(o.k==='crate'){drawGlow(o.x,o.y,34,'y',.35);return icon('crate',o.x,o.y,50)}
 if(o.k==='stream'){for(let x=0;x<W;x+=148)wspPart('stream',0,0,1,1,x,o.y-74,150,150);txt(L('개울 (물 뜨기)','小溪（打水）'),o.x,o.y,18,'#e8f4ff','center');return true}return false}
function backToSea(ok){const Ld=Land;const rc=ok&&Ld.clear?Ld.di:-1;const rg=Ld.reg||'hb';if(rc>=0)setTimeout(()=>{if(!R)return;if(!R[rg].d[rc].s)(rg==='rv'?reclaimR:rg==='ct'?reclaimC:reclaim)(rc)},300);R.pend=null;if(ok&&Ld.lit){R.lit=true;setTimeout(()=>gotDoc(13),900)}const npc=ok&&Ld.npcGot;if(npc)setTimeout(()=>{if(R)addSurvivor(1)},400);if(ok){for(const k in Ld.carry)R.res[k]=(R.res[k]||0)+Ld.carry[k];track('land_back',{n:Ld.n,t:Math.round(R.t)});message(L('배로 돌아왔다. 짐 ','回到船上。带回 ')+Ld.n+L('개를 실었다',' 件物资'),1.8)}Land=null;if(sc==='land'){enterSea()}}
function drawLand(){const Ld=Land,p=Ld.p,night=isNight();g.fillStyle='#24301f';g.fillRect(0,0,W,H);g.save();g.translate(0,-camY);
 g.fillStyle='#1e6a78';g.fillRect(0,LAND_H-120,W,300);g.fillStyle='#8a7a5a';g.fillRect(0,LAND_H-200,W,90);
 if(Ld.type==='harbor'||Ld.type==='city'){g.fillStyle=Ld.type==='city'?'#33302c':'#3a3a3a';g.fillRect(0,0,W,LAND_H-200);if(imgs.world){const y0=Math.max(0,Math.floor(camY/158)*158),y1=Math.min(LAND_H-200,camY+H);for(let y=y0;y<y1;y+=158){wspPart('asphalt',0,0,1,1,215,y,160,160);wspPart('asphalt',0,0,1,1,375,y,160,160)}
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
 if(Ld.allin){R.surv.filter(s2=>s2.fed).forEach((s2,j)=>{const ang=j*1.26+frame*.2,qx=p.x+Math.cos(ang)*70,qy=p.y+30+Math.sin(ang)*26;if(!sprite('surv'+s2.id,'idle',frame+j,qx,qy+4,80,qx<p.x?1:-1,6))circ(qx,qy-14,14,'#6c6','#111',3)})}
 {const ci=Ld.allin?-1:compId();if(ci>=0){const q=Ld.cp||(Ld.cp={x:p.x-40,y:p.y+30}),tx=p.x-(p.face>0?46:-46),ty=p.y+26,dd=Math.hypot(tx-q.x,ty-q.y),mv=dd>6;if(dd>420){q.x=tx;q.y=ty}else if(mv){const k=Math.min(1,260/60/dd);q.x+=(tx-q.x)*k;q.y+=(ty-q.y)*k;q.f=tx>q.x?1:-1}g.save();g.globalAlpha=.3;g.fillStyle='#000';g.beginPath();g.ellipse(q.x,q.y+2,18,6,0,0,TAU);g.fill();g.restore();if(!sprite('surv'+ci,mv?'walk':'idle',frame,q.x,q.y+4,88,q.f||-1,mv?11:6))circ(q.x,q.y-14,15,'#6c6','#111',3);txt(LL(SURV[ci].n),q.x,q.y-86,14,'#fff','center')}}
 drawHero(p,Ld.target&&Ld.work>0?(Ld.target.o&&Ld.target.o.k==='tree'||Ld.target.o&&Ld.target.o.k==='rock'?'attack':'gather'):Ld.target&&Ld.target.z&&Ld.atk>.3?'attack':null,96);drawFx(0);g.restore();
 if(night||R.t>DUSK){g.fillStyle=`rgba(2,6,14,${night?.6:(R.t-DUSK)/(NIGHT-DUSK)*.45})`;g.fillRect(0,0,W,H)}
 // HUD
 rr(0,0,W,128,0,'#0b0f16e8');if(Ld.type==='city')txt(L('정화탄 ','净化弹 ')+(R.res.bomb||0),420,110,15,'#9ff0e0','left',false);txt(Ld.type==='city'?L(R.day+'일째 · 도시','第'+R.day+'天 · 城市'):Ld.type==='river'?L(R.day+'일째 · 강가','第'+R.day+'天 · 河岸'):Ld.type==='harbor'?L(R.day+'일째 · 항구','第'+R.day+'天 · 港口'):L(R.day+'일째 · 섬','第'+R.day+'天 · 岛'),24,32,24,'#ffe2a0','left',false);rr(240,24,370,16,8,'#1a2230');rr(240,24,370*Math.min(1,R.t/DAY),16,8,R.t>DUSK?'#c06040':'#e0b060');rr(240+370*DUSK/DAY-1,20,3,24,1,'#ff9a7a');
 button(646,12,82,56,'II','dark',24,()=>{paused=true});const v=R.vit;['thirst','hunger','temp','hp'].forEach((k,i)=>{const x=20+i*150;txt(LL(vitIcon(k))+' '+Math.round(v[k]),x,80,17,v[k]<25?'#ff8a7a':'#dfe6ee','left',false)});
 txt(L('짐 ','负重 ')+Ld.n+'/'+Ld.cap,620,80,18,'#ffe7a0','left',false);rr(20,104,300,12,6,'#1a2230');rr(20,104,300*Math.min(1,Ld.noise/100),12,6,Ld.noise>55?'#ff6a5a':'#8a94a4');txt(L('소음','噪音'),330,110,14,'#9fb0c4','left',false);
 {const ask=Ld.boatAsk&&Date.now()-Ld.boatAsk<2500;button(430,1220,300,86,ask?L('한 번 더 누르면 출발','再点一次就出发'):L('배로 돌아가기','回船上'),ask?'red':R.t>DUSK?'gold':'dark',ask?20:24,()=>{if(!ask&&!autoBot){Ld.boatAsk=Date.now();return}Ld.boatAsk=0;Ld.goBoat=true;Ld.target=null;Ld.p.tx=375;Ld.p.ty=1830},{id:'btn_boat'})}}

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
 if(TOSS&&!tossApplied){const ready=!!globalThis.__tossReady;if(ready||loadT>4){tossApplied=true;if(ready&&globalThis.__tossSaveRaw&&applySave(globalThis.__tossSaveRaw)){R=save.run;if(!LANG_FORCED&&(save.lang==='ko'||save.lang==='zh'))LANG=save.lang;Music.on=save.music!==false;AudioFx.enabled=save.sfx!==false;qualityLow=!!save.qualityLow;shakeReduced=!save.shake}track('toss_ready',{ok:ready?1:0})}else return}
 if((mustOk&&loadT>.6)||loadT>25){sc='title';if(MUST.some(n=>imgFail[n]))message(L('일부 그림을 못 불러왔어요. 새로고침해 주세요','部分图片加载失败，请刷新'),4)}}
function title(){g.fillStyle='#071016';g.fillRect(0,0,W,H);if(imgs.title){g.drawImage(imgs.title,0,0,W,H);const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'rgba(4,10,18,.78)');gr.addColorStop(.32,'rgba(4,10,18,.15)');gr.addColorStop(.58,'rgba(4,10,18,.1)');gr.addColorStop(1,'rgba(4,10,18,.88)');g.fillStyle=gr;g.fillRect(0,0,W,H)}else{g.strokeStyle='rgba(120,180,200,.08)';g.lineWidth=2;for(let i=0;i<24;i++){const y=600+i*30;g.beginPath();for(let x=0;x<=W;x+=30)g.lineTo(x,y+Math.sin(x*.02+frame+i)*4);g.stroke()}
 g.fillStyle='#14181c';g.fillRect(0,520,W,40);for(let i=0;i<12;i++)rr(20+i*62,450-((i*37)%60),48,80+((i*37)%60),2,'#101418');// 불 꺼진 해안 도시
 drawGlow(560,700,60,'o',.6+.1*Math.sin(frame*6));rr(530,690,60,26,6,'#5a4030')}// 배의 불빛
 txt('RECLAIM',375,120,92,'#ffcf6a','center');txt(L('돌아온 땅','重归之地'),375,196,38,'#fff','center');txt(L('탈출하고, 버티고, 돌아가 되찾아라','逃离，坚持，然后夺回'),375,242,21,'#e6ecf2','center');
 const cont=!!save.run;button(150,820,450,96,cont?L('이어서 버티기 ('+save.run.day+'일째)','继续（第'+save.run.day+'天）'):L('탈출 시작','开始逃离'),'gold',30,()=>{AudioFx.init();if(save.run){R=save.run;Land=null;enterSea()}else if(!save.prolog){pro={i:0,t:0};sc='prologue'}else startAct1()},{id:'btn_start'});
 if(cont)button(150,930,450,70,L('새로 시작 (1막부터)','重新开始（从第一幕）'),'gray',20,()=>{if(resetArm>0){save.run=null;R=null;persist();resetArm=0;startAct1()}else{resetArm=2.5;message(L('한 번 더 누르면 지금 배를 버리고 새로 시작해요','再按一次将放弃当前的船重新开始'),2)}});
 button(150,1020,140,70,L('설정','设置'),'dark',20,()=>{sc='settings';guideRet='title'});button(305,1020,140,70,L('안내서','指南'),'dark',20,()=>{sc='guide';guidePage=0;guideRet='title'});button(460,1020,140,70,L('보상','奖励'),'dark',20,()=>{sc='reward';guideRet='title'});if(rewardBadge())circ(596,1024,10,'#ff4a4a');
 if(LANG==='zh'){const hl=['抵制不良游戏，拒绝盗版游戏。','注意自我保护，谨防受骗上当。','适度游戏益脑，沉迷游戏伤身。','合理安排时间，享受健康生活。'];txt('健康游戏忠告',375,1150,18,'#c9d2de','center',false);hl.forEach((s,i)=>txt(s,375,1180+i*26,16,'#8a94a4','center',false))}
 if(TOSS&&globalThis.__tossBoard)button(150,1110,450,64,L('토스 랭킹 보기 (생존 일수)','排行榜'),'blue',20,()=>{try{globalThis.__tossBoard()}catch(e){}},{id:'btn_board'});
 txt('v'+BUILD,375,1314,14,'#4a5462','center',false)}
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
  para(L('규칙은 하나: 감염체는 물을 건너지 못한다. 바다는 안전하고, 육지는 되찾을 땅이에요. 이야기는 1~4장, 엔딩 뒤에도 계속 살아갈 수 있어요.','规则只有一条：丧尸过不了水。海上安全，陆地需要夺回。故事共四章，结局之后也能继续生活。'),375,980,21,'#ffe7a0',600,34,'center')}},
 {t:['몸 상태','身体状态'],lines:[['갈증: 빗물 통·증류기를 탭하거나, 위쪽 갈증 칸을 탭해 물을 마셔요.','口渴：点雨水桶、蒸馏器，或点上方口渴栏喝水。'],['허기: 낚시한 생선을 모닥불에 구워 먹어요. 날생선은 배탈이 나고, 밤이 지나면 상해요.','饥饿：把钓到的鱼放在篝火上烤着吃。生鱼会坏肚子，过夜就会变质。'],['체온: 밤과 폭풍에 떨어져요. 불 옆에 서 있으면 올라가요.','体温：夜晚和风暴时下降，站在火旁会回升。'],['하나라도 0이 되면 체력이 줄어요.','任何一项降到0，体力就会下降。']]},
 {t:['배 짓기','造船'],lines:[['떠내려오는 물건을 탭하면 갈고리로 끌어와요. 멀면 배 가장자리로 가세요.','点击漂来的物品用钩子拉回来。太远就走到船边。'],['[짓기]에서 고르고, 빛나는 칸을 탭해 놓아요.','在[建造]里选择，再点发光的格子放置。'],['순서 추천: 빗물 통 → 모닥불 → 낚싯대 → 갑판 넓히기.','推荐顺序：雨水桶→篝火→钓竿→扩建甲板。']]},
 {t:['밤과 폭풍','夜晚与风暴'],lines:[['밤에 불이 꺼져 있으면 어둠 속의 무언가가 배를 들이받아 물건을 빼앗아 가요.','夜里没有火光，黑暗中的东西会撞船抢走物资。'],['폭풍 전날 무전으로 예보가 와요. 갈매기가 사라지면 곧 와요.','风暴前一天电台会预报。海鸥消失就快来了。'],['밧줄로 배를 묶으면 피해가 절반. 금 간 칸은 탭해서 판자로 고쳐요.','用绳子加固伤害减半。裂开的格子点一下用木板修补。']]}];
function guideScreen(){g.fillStyle='#0d111b';g.fillRect(0,0,W,H);const P=GUIDE[guidePage];txt(L('안내서','指南')+' '+(guidePage+1)+'/'+GUIDE.length,375,90,24,'#9fb0c4','center',false);txt(LL(P.t),375,160,40,'#ffe2a0','center');
 if(P.draw)P.draw();else{let y=270;for(const l of P.lines){const n=para('· '+LL(l),70,y,23,'#e6ecf2',610,38);y+=n*38+34}}
 button(40,1180,200,80,'◀','gray',30,()=>{guidePage=(guidePage+GUIDE.length-1)%GUIDE.length});button(510,1180,200,80,'▶','gray',30,()=>{guidePage=(guidePage+1)%GUIDE.length});
 button(260,1180,230,80,L('닫기','关闭'),'gold',26,()=>{sc=(guideRet==='sea'||guideRet==='town')&&R?guideRet:'title'});track('guide_open',{p:guidePage})}
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
 rr(24,888,702,250,16,'#161c2a','#2e3646',2);txt(L('통계','统计'),44,916,22,'#ffe2a0');button(436,896,270,50,'📜 '+L('기록 보관함 ','档案馆 ')+(save.docs||[]).length+'/'+DOCS.length,'blue',18,()=>{sc='docs';AudioFx.cue('ui')},{id:'btn_docs'});const s=save.stats;[[L('가장 오래 버틴 날','最长坚持'),s.best+L('일','天')],[L('누적 생존 일수','累计天数'),s.days],[L('건진 물건','打捞物品'),s.debris],[L('섬 상륙','登岛次数'),s.lands]].forEach(([a,b],i)=>{txt(a,60,960+i*40,19,'#c9d2de','left',false);txt(''+b,690,960+i*40,19,'#fff','right',false)});
 button(150,1180,450,80,L('◀ 돌아가기','◀ 返回'),'gold',26,()=>{sc=(guideRet==='sea'||guideRet==='town')&&R?guideRet:'title'})}
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
 if(raid&&sc==='town'&&!paused&&raidTap(x,y))return;
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
 else if(sc==='land'){const p=Land.p;Land.target=null;Land.goBoat=false;p.tx=p.x+ux*60*mag;p.ty=Math.max(160,p.y+uy*60*mag);}
 else if(sc==='sea'){act=null;fishing=null;seaP.path=null;const sp=240*mag*dt;const tryMove=(nx,ny)=>{const cl=cellAt(nx,ny);if(cl&&tileAt(cl.x,cl.y)){seaP.x=nx;seaP.y=ny;R.p.gx=cl.x;R.p.gy=cl.y;return true}return false};
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
function wantMusic(){if(sc==='loading')return;let k='menu';if(sc==='act1')k='escape';else if(sc==='sea'||sc==='build'||sc==='dayend'||sc==='hmap'||sc==='rmap'||sc==='cmap'||sc==='toll'||sc==='talk'||sc==='town'||sc==='world')k=R&&isNight()?'night':R&&inStorm()?'storm':'sea';else if(sc==='land')k='land';Music.play(k)}
let dbgFreeze=false,autoBot=false;
function tick(dt){if(paused||guideTip||adShow||dbgFreeze)return;if(evCard&&(sc==='sea'||sc==='town')){if(autoBot)evCard.opts[evCard.opts.length-1].fn();return}if(autoBot)botStep(dt);joyTick(dt);if(sc==='act1')act1Tick(dt);else if(sc==='sea'||sc==='town'){const n=R.ff&&!sleeping?3:1;for(let i=0;i<n&&(sc==='sea'||sc==='town')&&!evCard;i++)seaTick(dt)}else if(sc==='land')landTick(dt)}
function draw(dt){if(API){g.setTransform(1,0,0,1,0,0);g.fillStyle='#03060a';g.fillRect(0,0,c.width,c.height);g.setTransform(view.s,0,0,view.s,view.ox,view.oy)}else g.setTransform(1,0,0,1,0,0);
 btnsNext=[];frame+=dt;tick(dt);if(resetArm>0)resetArm-=dt;
 let sx=0,sy=0;if(shakeT>0){shakeT-=dt;sx=(Math.random()-.5)*shakeA;sy=(Math.random()-.5)*shakeA;if(shakeT<=0)shakeA=0}
 g.save();g.translate(sx,sy);
 if(sc==='loading')loadingScreen();else if(sc==='title')title();else if(sc==='act1')drawAct1();else if(sc==='zone')zoneScreen();else if(sc==='sea')drawSea();else if(sc==='build'){drawSea();btnsNext=[];buildScreen()}
 else if(sc==='land')drawLand();else if(sc==='dayend')dayendScreen();else if(sc==='g1done')g1Screen();else if(sc==='ch1end')ch1Screen();else if(sc==='hmap'){drawSea();btnsNext=[];hmapScreen()}else if(sc==='rmap'){drawSea();btnsNext=[];rmapScreen()}else if(sc==='cmap'){drawSea();btnsNext=[];cmapScreen()}else if(sc==='town')drawTown();else if(sc==='raidguide'){if(R.hb)drawTown();btnsNext=[];raidGuideScreen()}else if(sc==='world')drawWorld();else if(sc==='talk'){drawSea();btnsNext=[];talkScreen()}else if(sc==='prologue')prologueScreen();else if(sc==='docs')docsScreen();else if(sc==='toll'){drawSea();btnsNext=[];tollScreen()}else if(sc==='fail')failScreen();else if(sc==='settings')settingsScreen();else if(sc==='privacy')privacyScreen();else if(sc==='guide')guideScreen();else if(sc==='reward')rewardScreen();
 g.restore();
 if(paused&&isPlay()){btnsNext=[];pauseOverlay()}
 drawJoy();if(guideTip)drawGuideTip();if(adShow)drawAd();drawBanner();btns=btnsNext;wantMusic()}
// 디버그: ?debug=1 일 때만
function botStep(dt){botT-=dt;if(botT>0)return;botT=.25;if(sc==='raidguide'){R.rgSeen=1;sc='town';return}if(raid){const z=raid.zs[0];if(z)raidTap(z.x,z.y-30);return}if(sc==='town'||sc==='world'){townSel=-1;worldSel=null;sc='sea';return}
 if(sc==='title'){if(save.run){R=save.run;enterSea()}else startAct1();return}
 if(sc==='act1'){const p=A.p;const near=A.zs.find(z=>Math.hypot(z.x-p.x,z.y-p.y)<150);if(near){p.tx=p.x+(p.x<375?90:-90);p.ty=p.y-120;A.target=null;return}
  if(A.bag.length<8){const it=A.items.filter(i=>!i.got&&i.y<p.y+60&&i.y>p.y-700).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(it&&!A.zs.some(z=>Math.hypot(z.x-it.x,z.y-it.y)<110)){A.target=it;p.tx=it.x;p.ty=it.y+8;return}}
  A.target=null;p.tx=375;p.ty=210;return}
 if(sc==='zone'){startSea(botZone);return}
 if(sc==='prologue'){save.prolog=1;startAct1();return}if(sc==='talk'){R.talks[talk.k.id]=1;talk=null;sc='sea';return}if(sc==='ch1end'||sc==='cmap'||sc==='rmap'||sc==='toll'||sc==='hmap'){sc='sea';return}
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
  const order=['rain','fire','rod','deck','still','deck','bed','sail','radio','deck','still'].concat(ch3On()?['coffee']:[]);const have=k=>R.deck.filter(d=>d.m&&d.m.k===k).length;
  if(stormDay()&&R.t<60&&!R.lashed&&canPay('lash')){chooseBuild('lash');return}
  {const q=ch3On()?CH3[R.q3]:ch2On()?CH2[R.q2]:CH[R.ch],qb=q&&q.b;if(qb&&qb!=='radio'&&canPay(qb)&&(qb==='deck'||!hasM(qb))&&(qb==='deck'||R.deck.some(d=>!d.m))){chooseBuild(qb);if(buildPick){const cell=botCell(qb);if(cell)seaTap(tilePos(cell.x,cell.y).x,tilePos(cell.x,cell.y).y);else buildPick=null}return}}
  if(!botBuilt)botBuilt={};for(const k of order){const need=k==='deck'?(R.deck.filter(d=>!d.m).length<1):have(k)<(k==='still'?2:1);if(need&&canPay(k)&&(k==='deck'||R.deck.some(d=>!d.m))&&!(k==='sail'&&R.sail)){chooseBuild(k);if(buildPick){const cell=botCell(k);if(cell){seaTap(tilePos(cell.x,cell.y).x,tilePos(cell.x,cell.y).y);botBuilt[k+R.deck.length]=1}else buildPick=null}return}}
  if(ch4On()&&!R.ended){const ct=R.ct;if(R.comp<0)R.comp=0;if(canPayC(BOMB_COST)&&(R.res.bomb||0)<3&&r.water>=5)bombMake();
   const di=ct.d.findIndex((d,i)=>!d.s&&i<=ct.max+1);const need=di===3?((ct.d[3].sh===undefined?HEART_SHELL:ct.d[3].sh)<=(R.res.bomb||0)):true;if(di>=0&&need&&islandOpen()&&R.t<60&&R.vit.hp>(di===3?85:65)){startCityD(di);return}}
  if(ch3On()&&R.q3<CH3.length){const rv=R.rv;if(R.comp<0)R.comp=0;if(rv.max>=0&&!rv.d[1].s){if(canPayC(TOLL_CF))tollPay(1);else if(canPayC(TOLL))tollPay(0);else if(R.t>=DUSK&&R.day%2===0)tollPay(2)}
   const cf=R.deck.find(d=>d.m&&d.m.k==='coffee');if(cf&&(r.coffee||0)<1&&r.berry>=2&&r.water>=2&&!isNight()){walkTo(cf,()=>useTile(cf));return}if((r.coffee||0)>0&&!buffOn()&&!isNight()&&(R.cnt.coffee<1||rv.d[1].s)){drinkCoffee();return}
   if(rv.d[1].s&&rv.trades<2){for(let i=0;i<TRADES.length;i++)if(canPayC(TRADES[i].g)&&tradeLeft()>0&&tradeDo(i))break}
   const di=rv.d.findIndex((d,i)=>!d.s&&i!==1&&i<=rv.max+1);if(di>=0&&islandOpen()&&R.t<60&&R.vit.hp>(RV[di].boss?80:60)&&(R.day%3||r.berry>=2)){startRiverD(di);return}}
  if(ch2On()){const hb=R.hb,bi=hb.d.findIndex(d=>d.s&&!d.bar);if(bi>=0&&canPayC(BAR_COST)){payC(BAR_COST);hb.d[bi].bar=1}const di=hb.d.findIndex((d,i)=>!d.s&&i<=hb.max+1);if(di>=0&&islandOpen()&&R.t<60&&R.vit.hp>(R.landed===R.day?80:55)){startHarborD(di);return}}
  if(islandOpen()&&R.t<70&&v.hp>(R.landed===R.day?75:45)&&!(ch2On()&&v.hp<75)){startLand();return}
  const rod=R.deck.find(d=>d.m&&d.m.k==='rod');if(rod&&v.hunger<80&&!isNight()&&Math.random()<.5){walkTo(rod,()=>useTile(rod));return}
  const bed=R.deck.find(d=>d.m&&d.m.k==='bed');if(bed&&isNight()&&!sleeping&&(!ft||ft.m.fuel>40)){walkTo(bed,()=>useTile(bed));return}
  const o=debris.filter(o2=>!o2.pull&&o2.y>150&&o2.y<1000).sort((a,b)=>Math.hypot(a.x-seaP.x,a.y-seaP.y)-Math.hypot(b.x-seaP.x,b.y-seaP.y))[0];if(o)seaTap(o.x,o.y);return}
 if(sc==='land'){const Ld=Land,p=Ld.p;if(Ld.goBoat)return;if(Ld.lit||Ld.clear||Ld.npcGot&&Ld.n>=6||Ld.n>=Ld.cap||R.t>100||R.vit.hp<35){Ld.goBoat=true;Ld.p.tx=375;Ld.p.ty=1830;Ld.target=null;return}
  const z=Ld.zs.find(z2=>z2.hp>0&&Math.hypot(z2.x-p.x,z2.y-p.y)<120);if(z){Ld.target={z};return}if(Ld.target)return;
  if(Ld.noise>45&&Ld.type!=='harbor'&&Ld.type!=='river'&&Ld.type!=='city')return;const o=Ld.objs.filter(o2=>!o2.gone&&o2.k!=='hut'&&!o2.lit&&!((Ld.type==='harbor'||Ld.type==='river'||Ld.type==='city')&&o2.k!=='light'&&o2.k!=='nest'&&o2.k!=='bush'&&Ld.n>=4)).sort((a,b)=>((a.k==='npc'?-1:0)-(b.k==='npc'?-1:0))||(Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)))[0];if(o){Ld.target={o};Ld.work=0;p.tx=o.x;p.ty=o.y+40}}}
let botT=0,botZone=0,botBuilt=null;
function botCell(k){if(k==='deck'){for(let r=1;r<5;r++)for(let gy=-r;gy<=r;gy++)for(let gx=-r;gx<=r;gx++)if(!tileAt(gx,gy)&&adjacentEmpty(gx,gy)&&gx>=-3&&gx<=3&&gy>=-3&&gy<=4)return {x:gx,y:gy};return null}const t=R.deck.find(d=>!d.m);return t?{x:t.x,y:t.y}:null}
if(!API&&typeof location!=='undefined'&&location.search.indexOf('debug=1')>=0){globalThis.__bepaDebug={get sc(){return sc},set sc(v){sc=v},get R(){return R},get A(){return A},get Land(){return Land},save,persist,touch,startAct1,startSea,startLand,enterSea,nextDay,fail,revive,showAd,
 get btns(){return btns},get debrisList(){return debris},startHarborD,reclaim,harborMorning,startRiverD,reclaimR,startCityD,reclaimC,bombMake,get raid(){return raid},guideTarget,raidStart,raidEnd,raidTap,get townSel(){return townSel},set townSel(v){townSel=v},get worldSel(){return worldSel},set worldSel(v){worldSel=v},fleetN,seaEvent,tilePos,cellAt,tileAt,get seaP(){return seaP},backToSea,get evCard(){return evCard},get shark(){return shark},get school(){return school},canLand,gotDoc,talkNext,get talk(){return talk},set talk(v){talk=v},tollPay,tradeDo,drinkCoffee,useTile,chooseBuild,get Music(){return Music},toCh(n){R.ch=CH.length;R.lit=true;migrate();if(n>=4){R.q3=CH3.length;R.rv.d.forEach(d=>{d.s=2;d.left=0});R.rv.max=3;if(!R.surv.some(s2=>s2.id===3))R.surv.push({id:3,fed:true,ct:0})}if(n>=3){R.q2=CH2.length;R.hb.d.forEach(d=>{d.s=2;d.bar=1;d.left=0});R.hb.max=3;[0,1,2].forEach(i=>{if(!R.surv.some(s2=>s2.id===i))R.surv.push({id:i,fed:true,ct:0})})}},set bot(v){autoBot=v},set botZone(v){botZone=v},set freeze(v){dbgFreeze=v},spawnDebris,stormDamage,shadowBump,
 setT(t){if(R)R.t=t},setRes(o){Object.assign(R.res,o)},setVit(o){Object.assign(R.vit,o)},get guideTip(){return guideTip},set guideTip(v){guideTip=v},set guidePage(v){guidePage=v},get paused(){return paused},set paused(v){paused=v},
 step(n,dt=1/60){dbgFreeze=false;for(let i=0;i<n;i++){guideTip=null;tipQ.length=0;btnsNext=[];tick(dt)}dbgFreeze=true},drawNow(){draw(0)},get drawErr(){return drawErr},get stats(){return STAT_LOG},forceStorm(){if(R){R.zone=0;R.day=Z().storm;R.t=61}},joyStart,joyMove,joyEnd,get joy(){return joy},get seaP(){return seaP}}}
let drawErr=0;function loop(now){let dt=last?(now-last)/1000:0;last=now;perf(Math.min(dt,.25));try{draw(Math.min(dt,.1))}catch(e){drawErr++;try{g.restore();g.restore();g.restore()}catch(e2){}if(drawErr<5&&typeof console!=='undefined')console.error('draw error',e);if(drawErr===1)track('draw_error',{m:String(e&&e.message||e).slice(0,80),sc})}
 if(API){if(typeof requestAnimationFrame==='function')requestAnimationFrame(loop);else if(c.requestAnimationFrame)c.requestAnimationFrame(loop)}else requestAnimationFrame(loop)}
if(API){if(typeof requestAnimationFrame==='function')requestAnimationFrame(loop);else if(c.requestAnimationFrame)c.requestAnimationFrame(loop)}else requestAnimationFrame(loop);
})();
