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
const BUILD='1116-1930';
// 안전장치: 음수 반지름이면 그리기 전체가 멈추므로 보정
(function(){const P=Object.getPrototypeOf(g);if(!P||P.__safe)return;P.__safe=true;const oa=P.arc,oe=P.ellipse;
 if(oa)P.arc=function(x,y,r,a0,a1,ccw){return oa.call(this,x,y,r>0&&isFinite(r)?r:0,a0,a1,ccw)};
 if(oe)P.ellipse=function(x,y,rx,ry,rot,a0,a1,ccw){return oe.call(this,x,y,rx>0&&isFinite(rx)?rx:0,ry>0&&isFinite(ry)?ry:0,rot,a0,a1,ccw)}})();
// 그림 자원: G1은 도형만 사용. 그림을 넣을 때 IMG_LIST·MUST에 추가하면 로딩 화면이 자동으로 기다린다
const imgs={},imgFail={};const IMG_LIST=['hero','inf_walker','inf_runner','icons'],MUST=IMG_LIST.slice();
const ART={"cell":164,"hero":{"idle":{"row":0,"n":8},"walk":{"row":1,"n":8},"run":{"row":2,"n":8},"attack":{"row":3,"n":4},"gather":{"row":4,"n":4},"craft":{"row":5,"n":4}},"inf_walker":{"walk":{"row":0,"n":8}},"inf_runner":{"walk":{"row":0,"n":8}},"icons":{"cell":112,"cols":6,"idx":{"plank":0,"plastic":1,"cloth":2,"scrap":3,"rope":4,"water":5,"can":6,"fish":7,"med":8,"herbs":9,"rain":10,"fire":11,"still":12,"bed":13,"radio":14,"sail":15,"crate":16,"rack":17}}};// 그림 배치표 (res/*.png 아틀라스)
function loadImg(name,tries=0){const im=API?(API.createImage?API.createImage():c.createImage()):new Image();im.onload=()=>{imgs[name]=im};im.onerror=()=>{if(tries<8)setTimeout(()=>loadImg(name,tries+1),600+tries*900);else imgFail[name]=1};im.src='res/'+name+'.png?v='+BUILD}
IMG_LIST.forEach(n=>loadImg(n));
const GLOW_COL={o:[255,150,60],y:[255,220,120],w:[255,250,235],b:[120,190,255]};const glow={};
(function(){for(const k in GLOW_COL){const cv=mkCanvas(64,64),x=cv.getContext('2d'),[r,gg,b]=GLOW_COL[k],gr=x.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,`rgba(${r},${gg},${b},1)`);gr.addColorStop(.3,`rgba(${r},${gg},${b},.6)`);gr.addColorStop(1,`rgba(${r},${gg},${b},0)`);x.fillStyle=gr;x.fillRect(0,0,64,64);glow[k]=cv}})();

// 순화 모드용 어두운 감염체: 불러온 뒤 한 번 만들어 둔다
const imgMild={};function mildOf(name){if(imgMild[name]!==undefined)return imgMild[name];const im=imgs[name];if(!im)return null;try{const cv=mkCanvas(im.width,im.height),x=cv.getContext('2d');x.drawImage(im,0,0);x.globalCompositeOperation='source-atop';x.fillStyle='rgba(16,18,26,.72)';x.fillRect(0,0,im.width,im.height);imgMild[name]=cv}catch(e){imgMild[name]=null}return imgMild[name]}
// 스프라이트: 아틀라스 칸은 왼쪽을 보는 그림. face>0이면 좌우 뒤집기. y는 발 위치
function sprite(name,anim,t,x,y,h,face,fps,alpha){const im=(save.mild&&name!=='hero')?(mildOf(name)||imgs[name]):imgs[name];const A2=ART[name];if(!im||!A2||!A2[anim])return false;const a=A2[anim],C=ART.cell;const f=Math.floor(t*(fps||10))%a.n;
 const s=h/C;g.save();if(alpha!==undefined)g.globalAlpha=alpha;g.translate(x,y);if(face>0)g.scale(-1,1);g.drawImage(im,f*C,a.row*C,C,C,-C*s/2,-C*s+4*s,C*s,C*s);g.restore();return true}
function icon(k,x,y,size){const im=imgs.icons,I=ART.icons;if(!im||I.idx[k]===undefined)return false;const i=I.idx[k],C=I.cell;g.drawImage(im,(i%I.cols)*C,Math.floor(i/I.cols)*C,C,C,x-size/2,y-size/2,size,size);return true}
const ICON_OF={plank:'plank',plastic:'plastic',cloth:'cloth',scrap:'scrap',rope:'rope',water:'water',can:'can',fish:'fish',cooked:'fish',med:'med',berry:'herbs',crate:'crate',supply:'crate',
 rain:'rain',fire:'fire',still:'still',bed:'bed',radio:'radio',sail:'sail',bag_water:'water',bag_can:'can',bag_med:'med',bag_rope:'rope',bag_tarp:'cloth',bag_radio:'radio'};
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
function persist(){save.lang=LANG;save.qualityLow=qualityLow;save.qualityManual=qualityManual;save.shake=!shakeReduced;try{const v=JSON.stringify(save);if(API&&API.setStorageSync)API.setStorageSync(SAVE_KEY,v);else if(typeof localStorage!=='undefined')localStorage.setItem(SAVE_KEY,v)}catch(e){}}
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
function startAct1(){const items=[['water',150,2180],['can',600,2080],['med',120,1900],['knife',640,1760],['lighter',330,1640],['rope',110,1460],['filter',620,1350],['line',200,1180],['tarp',560,1060],['radio',90,880],['flash',660,760],['tools',380,560],['water',540,1500],['can',240,980]];
 items.push(['med',600,2300],['rope',420,1300]);
 A={p:{x:375,y:ACT1_H-120,tx:375,ty:ACT1_H-120,hp:100,hit:0},bag:[],items:items.map(([k,x,y])=>({k,x,y:AY(y),got:false})),zs:[],front:ACT1_H+120,t:0,board:0,target:null,pick:0};
 const zp=[[300,2100,0],[520,1950,0],[200,1800,1],[450,1650,0],[600,1500,0],[300,1420,0],[160,1300,1],[520,1150,0],[420,1000,0],[620,800,1],[250,820,0],[500,560,0],[180,560,0],[600,380,1]];
 A.zs=zp.map(([x,y,run],i)=>({x,y:AY(y),hx:x,hy:AY(y),run,a:0,hit:0,w:i*1.7}));
 sc='act1';camY=ACT1_H-H;tutStep=0;track('act1_start',{});
 tip('act1',[['화면을 누른 채 끌면 그 방향으로 달려요. 탭하면 그곳으로 걸어가요.','按住屏幕拖动即可朝该方向奔跑，点击则走到该处。'],['반짝이는 물건을 탭해 가방에 담고, 위쪽 비행기까지 달리세요.','点击发光的物品放进背包，然后跑向上方的飞机。'],['가방은 8칸뿐이에요. 무엇을 챙길지가 바다에서의 첫 3일을 정해요.','背包只有8格，带什么决定了海上的头三天。']])}
function act1Tick(dt){const p=A.p;A.t+=dt;
 A.front-=15*dt;if(p.y>A.front-30){p.hp-=22*dt;if(frame%0.5<dt)message(L('불길이 다가온다! 위로 달려!','火势逼近！快往上跑！'),.8)}
 if(A.board>0){A.board+=dt;if(A.board>2.6){track('act1_clear',{bag:A.bag.length,t:Math.round(A.t)});sc='zone';zoneT=0}return}
 moveTo(p,dt,185);
 if(A.target){const it=A.target;if(!it.got&&Math.hypot(p.x-it.x,p.y-it.y)<46){A.pick+=dt;if(A.pick>.35){A.pick=0;A.target=null;if(A.bag.length>=8){message(L('가방이 가득 찼어요. 아래 가방 칸을 탭하면 버릴 수 있어요','背包满了，点下方的背包格可以丢弃'),2.2)}else{it.got=true;A.bag.push(it.k);AudioFx.cue('pick');vib('light');fxText(it.x,it.y-30,LL(BAG[it.k].n),'#fff3c0')}}}}
 for(const z of A.zs){const d=Math.hypot(p.x-z.x,p.y-z.y),sp=z.run?150:105;if(d<240&&p.y<A.front){z.a=1}else if(d>420)z.a=0;
  if(z.a){const k=sp*dt/Math.max(1,d);z.x+=(p.x-z.x)*k;z.y+=(p.y-z.y)*k}else{z.w+=dt;z.x=z.hx+Math.sin(z.w*.8)*40;z.y=z.hy+Math.cos(z.w*.6)*20}
  z.hit-=dt;if(d<38&&z.hit<=0){z.hit=1;p.hp-=16;AudioFx.cue('hurt');vib('medium');shake(10,.25);const k=50/Math.max(1,d);p.x+=(p.x-z.x)*k;p.y+=(p.y-z.y)*k;p.tx=p.x;p.ty=p.y}}
 p.x=Math.max(30,Math.min(W-30,p.x));p.y=Math.max(120,Math.min(ACT1_H-40,p.y));
 if(p.y<300&&Math.hypot(p.x-375,p.y-210)<130){A.board=.01;AudioFx.cue('win');vib('long')}
 if(p.hp<=0){p.hp=0;fail('act1')}
 camY+=((p.y-H*.62)-camY)*Math.min(1,dt*5);camY=Math.max(0,Math.min(ACT1_H-H+180,camY))}
function moveTo(p,dt,sp){const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy);if(d>2){const k=Math.min(1,sp*dt/d);p.x+=dx*k;p.y+=dy*k}}
function act1Tap(x,y){const wx=x,wy=y+camY;
 if(y>1150){for(let i=0;i<8;i++){const bx=24+i*89;if(x>bx&&x<bx+82&&A.bag[i]){const k=A.bag.splice(i,1)[0];A.items.push({k,x:A.p.x+(Math.random()*60-30),y:A.p.y+50,got:false});AudioFx.cue('ui');message(L('내려놓았어요: ','放下了：')+LL(BAG[k].n),1);return}}return}
 let best=null,bd=70;for(const it of A.items)if(!it.got){const d=Math.hypot(wx-it.x,wy-it.y);if(d<bd){bd=d;best=it}}
 if(best){A.target=best;A.p.tx=best.x;A.p.ty=best.y+8}else{A.target=null;A.p.tx=wx;A.p.ty=wy}tutStep=1}
function drawAct1(){const p=A.p;g.fillStyle='#1b1d22';g.fillRect(0,0,W,H);g.save();g.translate(0,-camY);
 // 도로와 건물 (회색 상자)
 g.fillStyle='#2a2d33';g.fillRect(170,0,410,ACT1_H);g.strokeStyle='#4a4d55';g.lineWidth=4;g.setLineDash([30,30]);g.beginPath();g.moveTo(375,300);g.lineTo(375,ACT1_H);g.stroke();g.setLineDash([]);
 for(let i=0;i<21;i++){const y=320+i*150;rr(10,y,140,120,6,'#30333b','#45484f',2);rr(600,y+40,140,120,6,'#30333b','#45484f',2)}
 // 활주로와 비행기
 rr(120,40,510,300,10,'#25282e','#5a5e66',3);txt(L('사설 비행장','私人机场'),375,70,22,'#9aa0aa','center',false);
 g.save();g.translate(375,210);g.fillStyle='#d8dde4';g.beginPath();g.ellipse(0,0,30,95,0,0,TAU);g.fill();g.fillRect(-120,-10,240,26);g.fillRect(-50,70,100,16);g.restore();drawGlow(375,210,150,'y',.25+.1*Math.sin(frame*3));
 if(A.board>0)txt(L('탑승!','登机！'),375,330,34,'#ffe7a0','center');
 // 물건
 for(const it of A.items)if(!it.got){const B=BAG[it.k];drawGlow(it.x,it.y,40,'y',.35+.15*Math.sin(frame*4+it.x));if(!icon(ICON_OF['bag_'+it.k],it.x,it.y,52))rr(it.x-18,it.y-18,36,36,8,B.col,'#fff',2);txt(LL(B.n),it.x,it.y-34,15,'#fff3c0','center')}
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
 for(let i=0;i<8;i++){const bx=24+i*89,k=A.bag[i];rr(bx,1190,82,82,10,k?'#232a36':'#181c24',k?BAG[k].col:'#333a46',2);if(k){if(!icon(ICON_OF['bag_'+k],bx+41,1222,48))rr(bx+23,1203,36,36,6,BAG[k].col);txt(LL(BAG[k].n),bx+41,1256,13,'#e6ecf2','center',false)}}
 if(tutStep===0&&!guideTip){const it=A.items[0];drawFinger(it.x,it.y-camY+20)}}
let heroBusy=0;
function drawHero(p,force,h){const dx=p.x-(p.lx===undefined?p.x:p.lx),dy=p.y-(p.ly===undefined?p.y:p.ly);const mv=Math.hypot(dx,dy)>.4;if(Math.abs(dx)>.3)p.face=dx>0?1:-1;p.lx=p.x;p.ly=p.y;
 if(mv)p.mt=(p.mt||0)+1/60;const anim=force||(mv?(sc==='act1'?'run':'walk'):'idle');const fps=anim==='run'?14:anim==='walk'?11:anim==='idle'?6:8;
 g.save();g.globalAlpha=.35;g.fillStyle='#000';g.beginPath();g.ellipse(p.x,p.y+2,h*.22,h*.07,0,0,TAU);g.fill();g.restore();
 if(!sprite('hero',anim,anim==='idle'?frame:(force?frame:p.mt),p.x,p.y+4,h,p.face||-1,fps))drawPlayer(p.x,p.y-16)}
function drawInfected(z){const dx=z.x-(z.lx===undefined?z.x:z.lx);if(Math.abs(dx)>.2)z.face=dx>0?1:-1;z.lx=z.x;z.wt=(z.wt||0)+1/60*(z.a?1.6:.8);
 g.save();g.globalAlpha=.3;g.fillStyle='#000';g.beginPath();g.ellipse(z.x,z.y+20,22,7,0,0,TAU);g.fill();g.restore();
 if(!sprite(z.run?'inf_runner':'inf_walker','walk',z.wt,z.x,z.y+22,z.run?92:100,z.face||-1,9)){circ(z.x,z.y,z.run?17:20,'#0b0c0f',z.a?'#7a5a5a':'#3a3c42',3);circ(z.x-6,z.y-5,2.5,'#c8b070');circ(z.x+6,z.y-5,2.5,'#c8b070')}
 if(z.a){txt('!',z.x,z.y-80,22,'#ffb08a','center')}}
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
function enterSea(){sc='sea';debris=[];fx=[];buildPick=null;sleeping=false;act=null;fishing=null;const pp=tilePos(R.p.gx,R.p.gy);seaP={x:pp.x,y:pp.y,tx:pp.x,ty:pp.y};gulls=[];for(let i=0;i<5;i++)gulls.push({x:Math.random()*W,y:150+Math.random()*250,v:30+Math.random()*30});spawnT=1;morningEvents(true)}
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
 R.rainAt=Math.random()<.55*Z().rain?40+Math.random()*60:-1;R.today={debris:0,built:0,fish:0,lost:0};
 if(stormDay())message(L('기압계 바늘이 떨어진다… 오늘 오후 폭풍이 온다!','气压计在下降……今天下午有风暴！'),3);
 else if(R.day+1===Z().storm||(R.day+1>Z().storm&&(R.day+1-Z().storm)%4===0))message(L('무전: "내일 오후 폭풍 예보." 밧줄로 배를 묶어 두자','电台："明天下午有风暴。"用绳子加固船吧'),3)}
function seaTick(dt){const Zn=Z(),v=R.vit,spd=sleeping?4:1;const dtt=dt*spd;R.t+=dtt;
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
 if(night&&!fireLit()){R.shadowT+=dtt;if(R.shadowT>(R.items.flash?22:12)){R.shadowT=0;shadowBump()}}else R.shadowT=Math.max(0,R.shadowT-dtt);
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
function spawnDebris(){const r=Math.random()*100;let k;if(r<34)k='plank';else if(r<58)k='plastic';else if(r<72)k='cloth';else if(r<88)k='crate';else if(r<97)k='scrap';else k='supply';
 debris.push({k,x:60+Math.random()*(W-120),y:-30,v:34+Math.random()*16,ph:Math.random()*6})}
function collect(o){const r=R.res;let got={};if(o.k==='plank')got={plank:1};else if(o.k==='plastic')got={plastic:1};else if(o.k==='cloth')got={cloth:1};else if(o.k==='scrap')got={scrap:1};
 else if(o.k==='crate'){const q=Math.random();got=q<.35?{can:1}:q<.6?{rope:1}:q<.8?{scrap:2}:{plank:2}}else got={can:1,rope:1,plastic:2,cloth:1};
 for(const k in got)r[k]=(r[k]||0)+got[k];R.today.debris++;save.stats.debris++;mission('debris');AudioFx.cue('pick');vib('light');
 fxText(seaP.x,seaP.y-50,Object.keys(got).map(k=>LL(RES_N[k])+'+'+got[k]).join(' '),'#fff3c0');track('debris',{k:o.k})}
function shadowBump(){const ks=['plank','plastic','cloth','can','fish','rope'].filter(k=>R.res[k]>0);shake(14,.4);vib('heavy');AudioFx.cue('hit');
 if(ks.length){const k=ks[Math.floor(Math.random()*ks.length)];R.res[k]--;R.today.lost++;message(L('어둠 속의 무언가가 배를 들이받았다! ','黑暗中有东西撞了船！')+LL(RES_N[k])+' -1. '+L('불을 켜 두자','把火点着吧'),2.2)}
 else message(L('어둠 속의 무언가가 배 밑을 스쳐 갔다…','黑暗里有东西从船底滑过……'),2)}
function stormDamage(){if(R.lashed>0&&Math.random()<.5)return;const cand=R.deck.filter(d=>!(R.p.gx===d.x&&R.p.gy===d.y));if(!cand.length)return;const d=cand[Math.floor(Math.random()*cand.length)];d.hp--;shake(12,.4);vib('medium');AudioFx.cue('hit');
 if(d.hp<=0&&R.deck.length>2){R.deck.splice(R.deck.indexOf(d),1);R.today.lost++;message(L('파도가 갑판 한 칸을 부숴 버렸다!','海浪打碎了一格甲板！')+(d.m?' ('+LL(MODS[d.m.k].n)+')':''),2.2)}else{d.hp=Math.max(1,d.hp);message(L('갑판이 삐걱거린다. 금 간 칸을 탭해 판자로 고치자','甲板吱嘎作响。点裂开的格子用木板修补'),2)}}
function endDay(){sleeping=false;fishing=null;act=null;if(R.res.fish>0){R.today.lost+=R.res.fish;R.today.spoil=R.res.fish;R.res.fish=0}if(inStorm()===false&&R.lashed>0&&stormDay())R.lashed--;
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
 if(m.k==='rain'||m.k==='still'){if((m.w||0)>0){if(v.thirst<92){m.w--;v.thirst=Math.min(100,v.thirst+35);mission('drink');AudioFx.cue('splash');fxText(seaP.x,seaP.y-40,L('꿀꺽! 갈증 +35','咕嘟！口渴 +35'),'#9fd8ff')}else{m.w--;r.water++;fxText(seaP.x,seaP.y-40,L('물을 병에 담았다 +1','装进水瓶 +1'),'#9fd8ff')}}else message(m.k==='rain'?L('아직 비어 있어요. 비가 오면 차요','还是空的，下雨时会蓄满'):L('물이 만들어지는 중이에요','正在制造淡水'),1.4);return}
 if(m.k==='fire'){if(r.fish>0&&m.fuel>=6){r.fish--;r.cooked++;m.fuel-=6;mission('cook');AudioFx.cue('fire');fxText(seaP.x,seaP.y-40,L('생선을 구웠다','烤好了鱼'),'#ffc080');return}
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
function built(k){heroBusy=1.2;AudioFx.cue('build');vib('medium');R.today.built++;mission('build');track('build',{k,day:R.day});if(k==='radio'){R.radioBuilt=true;setTimeout(radioUse,600)}persist()}
function chooseBuild(k){if(!canPay(k)){message(MODS[k].need==='radio'&&!R.radioPart?L('무전기 부품이 필요해요 (1막 가방 또는 섬의 오두막)','需要电台零件（第一幕背包或岛上小屋）'):L('재료가 모자라요','材料不够'),1.4);return}
 if(k==='lash'){pay(k);R.lashed=1;built(k);message(L('배를 단단히 묶었다. 다음 폭풍 피해 절반','船绑牢了，下次风暴伤害减半'),1.8);sc='sea';return}
 if(k==='sail'){if(R.sail){message(L('이미 돛이 있어요','已经有船帆了'),1.2);return}}
 if(k!=='deck'&&!R.deck.some(d=>!d.m)){message(L('빈 칸이 없어요. 먼저 갑판을 넓히세요','没有空格，先扩建甲板'),1.6);return}
 if(k==='sail'){pay(k);R.sail=true;const t=R.deck.find(d=>!d.m);t.m={k:'sail'};built(k);sc='sea';return}
 buildPick=k;sc='sea';tip('build',[['빛나는 칸을 탭해 놓을 곳을 정해요.','点击发光的格子选择位置。'],['모닥불 가까이는 따뜻해요. 자주 쓰는 것은 서로 가까이 두세요.','篝火旁边很暖和，常用的东西放近一些。']])}
// --- 바다 그리기
function drawSea(){const night=isNight(),storm=inStorm(),dusk=R.t>DUSK&&!night;
 const top=storm?'#1a2a30':night?'#06101a':dusk?'#2a4450':'#1f6a74',bot=storm?'#0e1a1e':night?'#030a12':'#124a56';
 const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,top);gr.addColorStop(1,bot);g.fillStyle=gr;g.fillRect(0,0,W,H);
 g.strokeStyle='rgba(180,220,230,.07)';g.lineWidth=2;for(let i=0;i<26;i++){const y=(i*57+frame*18)%H;g.beginPath();for(let x=0;x<=W;x+=30)g.lineTo(x,y+Math.sin(x*.02+frame+i)*5);g.stroke()}
 // 섬 (상륙 가능할 때)
 if(R.day>=Z().island&&R.t<125){const op=islandOpen();g.save();g.globalAlpha=op?1:.4;g.fillStyle='#3e4a36';g.beginPath();g.ellipse(620,170,120,50,0,0,TAU);g.fill();g.fillStyle='#2f3a2a';for(let i=0;i<5;i++)circ(560+i*28,150-Math.sin(i)*10,16,'#2c3826');g.restore()}
 // 갈매기 (폭풍 전에 사라짐 = 예고 신호)
 if(!(stormDay()&&R.t>40&&R.t<100)&&!night)for(const s of gulls){g.strokeStyle='#dfe6ee';g.lineWidth=2;g.beginPath();g.moveTo(s.x-8,s.y);g.lineTo(s.x,s.y+4);g.lineTo(s.x+8,s.y);g.stroke()}
 // 떠내려오는 물건
 for(const o of debris){const col={plank:'#c79a5b',plastic:'#7fc6e8',cloth:'#c9c2e0',crate:'#a07850',scrap:'#9aa3ad',supply:'#ffd060'}[o.k];g.save();g.translate(o.x,o.y);g.rotate(Math.sin(frame+o.ph)*.2);g.fillStyle='rgba(220,240,240,.18)';g.beginPath();g.ellipse(0,14,30,8,0,0,TAU);g.fill();if(o.k==='supply')drawGlow(0,0,48,'y',.6);
  if(icon(ICON_OF[o.k],0,0,o.k==='supply'?60:50)){}else if(o.k==='plank')rr(-26,-8,52,16,4,col,'#2a1e14',2);else if(o.k==='plastic')rr(-14,-18,28,36,10,col,'#1e3a48',2);else if(o.k==='cloth')rr(-20,-12,40,24,10,col,'#3a3550',2);else if(o.k==='crate'){rr(-18,-18,36,36,4,col,'#3a2414',3);g.strokeStyle='#3a2414';g.beginPath();g.moveTo(-18,-18);g.lineTo(18,18);g.stroke()}else if(o.k==='scrap')rr(-16,-10,32,20,2,col,'#333',2);else{drawGlow(0,0,40,'y',.6);rr(-20,-20,40,40,6,col,'#5a4010',3)}
  g.restore();if(o.pull){g.strokeStyle='#e8e0c8';g.lineWidth=2;g.beginPath();g.moveTo(seaP.x,seaP.y);g.lineTo(o.x,o.y);g.stroke()}}
 // 배
 for(const d of R.deck){const p=tilePos(d.x,d.y);rr(p.x-T/2+2,p.y-T/2+2,T-4,T-4,8,'#7a5c3e','#3a2a1c',3);g.strokeStyle='rgba(40,28,18,.6)';g.lineWidth=2;for(let i=1;i<4;i++){g.beginPath();g.moveTo(p.x-T/2+6,p.y-T/2+i*T/4);g.lineTo(p.x+T/2-6,p.y-T/2+i*T/4);g.stroke()}
  if(d.hp<3){g.strokeStyle='#1a0f08';g.lineWidth=3;g.beginPath();g.moveTo(p.x-20,p.y-22);g.lineTo(p.x+4,p.y);g.lineTo(p.x-6,p.y+18);g.stroke();if(d.hp<2)txt('!',p.x+26,p.y-26,22,'#ff9a7a','center')}
  if(d.m)drawModule(d,p)}
 if(buildPick){for(let gy=-3;gy<=4;gy++)for(let gx=-3;gx<=3;gx++){const p=tilePos(gx,gy),t=tileAt(gx,gy);const ok=buildPick==='deck'?(!t&&adjacentEmpty(gx,gy)):(t&&!t.m);if(ok){g.globalAlpha=.5+.3*Math.sin(frame*6);rr(p.x-T/2+6,p.y-T/2+6,T-12,T-12,10,'rgba(255,220,120,.25)','#ffd070',3);g.globalAlpha=1}}}
 drawHero(seaP,fishing?'idle':heroBusy>0?'craft':null,88);if(fishing){g.strokeStyle='#cfe';g.lineWidth=2;g.beginPath();g.moveTo(seaP.x,seaP.y);g.lineTo(seaP.x+70,seaP.y+90);g.stroke();circ(seaP.x+70,seaP.y+90,5,'#ff6060')}
 drawFx();
 // 밤과 폭풍
 if(night||dusk||storm){const a=night?.6:storm?.4:(R.t-DUSK)/(NIGHT-DUSK)*.45;g.fillStyle=`rgba(2,6,14,${a})`;g.fillRect(0,0,W,H);const ft=fireTile();if(ft&&fireLit()){const p=tilePos(ft.x,ft.y);g.save();g.globalCompositeOperation='lighter';drawGlow(p.x,p.y,230+Math.sin(frame*9)*8,'o',.55);g.restore()}
  if(night&&!fireLit()){const ang=frame*.6;const sx=RAFT_X+Math.cos(ang)*260,sy=RAFT_Y+Math.sin(ang)*200;g.fillStyle='rgba(0,0,0,.6)';g.beginPath();g.ellipse(sx,sy,60,22,ang+1.57,0,TAU);g.fill()}}
 if(storm||(R.rainAt>0&&R.t>=R.rainAt&&R.t<R.rainAt+25)){g.strokeStyle='rgba(200,220,240,.35)';g.lineWidth=2;for(let i=0;i<(storm?90:40);i++){const x=(i*97+frame*400)%W,y=(i*131+frame*900)%H;g.beginPath();g.moveTo(x,y);g.lineTo(x-8,y+22);g.stroke()}if(storm&&Math.random()<.004){g.fillStyle='rgba(255,255,255,.5)';g.fillRect(0,0,W,H)}}
 if(sleeping){g.fillStyle='rgba(0,0,0,.4)';g.fillRect(0,0,W,H);txt('Z z z',375,500,48,'#c8c0ff','center')}
 seaHud()}
function drawModule(d,p){const m=d.m,M=MODS[m.k];if(!icon(ICON_OF[m.k],p.x,p.y-6,70))rr(p.x-28,p.y-30,56,52,10,M.col,'#111',3);txt(LL(M.n),p.x,p.y+32,13,'#fff','center');
 if(m.k==='rain'||m.k==='still'){const cap=m.k==='rain'?6:3;for(let i=0;i<cap;i++)rr(p.x-24+i*(48/cap),p.y+8,48/cap-3,8,2,i<(m.w||0)?'#5fb4ff':'#1d2a36')}
 if(m.k==='fire'){if(m.fuel>0){drawGlow(p.x,p.y-8,40+Math.sin(frame*12)*4,'o',.9);txt(Math.ceil(m.fuel)+'s',p.x,p.y-42,15,'#ffd0a0','center')}else txt(L('꺼짐','熄灭'),p.x,p.y-42,14,'#aab','center')}
 if(m.k==='sail'&&!imgs.icons){g.fillStyle='#efe8d8';g.beginPath();g.moveTo(p.x,p.y-60);g.lineTo(p.x+30,p.y+10);g.lineTo(p.x,p.y+10);g.fill()}}
function vitIcon(k){return {thirst:['갈증','口渴'],hunger:['허기','饥饿'],temp:['체온','体温'],hp:['체력','体力']}[k]}
function seaHud(){const v=R.vit,r=R.res;rr(0,0,W,150,0,'#0b0f16e8');
 txt(L(R.day+'일째','第'+R.day+'天'),24,34,28,'#ffe2a0','left',false);const ph=inStorm()?L('폭풍','风暴'):isNight()?L('밤','夜晚'):R.t>DUSK?L('해질녘','黄昏'):L('낮','白天');txt(ph,150,34,22,inStorm()?'#ff9a7a':isNight()?'#9fb0ff':'#dfe6ee','left',false);
 rr(230,24,380,16,8,'#1a2230');rr(230,24,380*Math.min(1,R.t/DAY),16,8,isNight()?'#6070c0':'#e0b060');rr(230+380*NIGHT/DAY-1,20,3,24,1,'#9fb0ff');
 button(646,14,82,56,'II','dark',24,()=>{paused=true});
 const keys=['thirst','hunger','temp','hp'],cols={thirst:'#5fb4ff',hunger:'#e0a860',temp:'#ff9a5a',hp:'#7fe0a0'};
 keys.forEach((k,i)=>{const x=20+i*180,y=62;rr(x,y,168,70,12,'#151b26','#2c3646',2);txt(LL(vitIcon(k)),x+12,y+22,17,'#dfe6ee','left',false);txt(Math.round(v[k])+'',x+156,y+22,18,v[k]<25?'#ff8a7a':'#fff','right',false);rr(x+12,y+42,144,14,7,'#0c1018');rr(x+12,y+42,144*v[k]/100,14,7,v[k]<25?'#ff6a5a':cols[k]);
  hotspot(x,y,168,70,()=>useVital(k),'vit_'+k)});
 // 다음 목표
 txt('▶ '+nextGoal(),24,172,18,'#ffe7a0','left');
 // 자원 줄
 rr(0,1060,W,274,0,'#0b0f16ee');const show=['plank','plastic','cloth','scrap','rope','water','can','fish','cooked','berry','med'];
 show.forEach((k,i)=>{const x=16+(i%6)*121,y=1076+Math.floor(i/6)*44;rr(x,y,113,38,9,'#161d28');if(!icon(ICON_OF[k],x+17,y+19,32))circ(x+16,y+19,7,RES_C[k]);if(k==='cooked')circ(x+27,y+8,5,'#ff9a40');txt(LL(RES_N[k]),x+28,y+19,13,'#b6c0cc','left',false);txt(''+(r[k]||0),x+106,y+19,16,(r[k]||0)>0?'#fff':'#5a6472','right',false)});
 const by=1180;button(16,by,226,84,L('짓기','建造'),'gold',28,()=>{sc='build';AudioFx.cue('ui')},{id:'btn_build'});
 const op=islandOpen();button(254,by,240,84,op?L('섬에 상륙','登岛'):L('섬 없음','附近无岛'),op?'green':'gray',26,()=>{if(islandOpen())startLand();else message(R.day<Z().island?L('아직 섬이 보이지 않아요','还看不到岛'):R.landed>=R.day?L('오늘은 이미 다녀왔어요','今天已经去过了'):L('해가 지기 전엔 돌아올 수 없어요','天黑前回不来'),1.4)},{id:'btn_land'});
 button(506,by,228,84,L('보급·일지','补给·日志'),'blue',24,()=>{sc='reward';guideRet='sea'},{id:'btn_reward'});if(rewardBadge())circ(722,by+8,10,'#ff4a4a');
 txt('v'+BUILD,726,1316,12,'#3a4452','right',false);
 if(tutStep===0&&debris.length&&!guideTip&&!buildPick){const o=debris.find(o2=>o2.y>200&&o2.y<900);if(o)drawFinger(o.x,o.y+20)}}
function useVital(k){const r=R.res,v=R.vit;
 if(k==='thirst'){if(r.water>0&&v.thirst<95){r.water--;v.thirst=Math.min(100,v.thirst+35);mission('drink');AudioFx.cue('splash');return}message(r.water?L('목마르지 않아요','不渴'):L('마실 물이 없어요. 빗물 통·증류기를 탭하세요','没有水。点雨水桶或蒸馏器'),1.6);return}
 if(k==='hunger'){if(v.hunger>=95){message(L('배부르다','很饱'),1);return}const order=[['cooked',30,0],['can',35,0],['berry',15,0],['fish',12,8]];for(const [key,add,hurt] of order)if(r[key]>0){r[key]--;v.hunger=Math.min(100,v.hunger+add);if(hurt){v.hp-=hurt;message(L('날생선은 배탈이 날 수 있어요. 모닥불에 구워 먹자','生鱼会坏肚子，用篝火烤一下吧'),1.8)}AudioFx.cue('pick');return}
  message(L('먹을 것이 없어요. 낚시를 하거나 섬에 가 보세요','没有吃的，去钓鱼或者登岛'),1.6);return}
 if(k==='hp'){if(r.med>0&&v.hp<90){r.med--;v.hp=Math.min(100,v.hp+40);AudioFx.cue('win');return}message(L('치료약이 없거나 아직 괜찮아요','没有药或者还不需要'),1.4);return}
 if(k==='temp'){message(L('모닥불 가까이 서 있으면 몸이 녹아요','站在篝火旁就能暖和起来'),1.6)}}
function costTxt(k){const c2=costOf(k);return ' ('+Object.keys(c2).filter(r=>c2[r]>0).map(r=>LL(RES_N[r])+' '+c2[r]).join(LANG==='zh'?'·':'·')+')'}
function nextGoal(){const has=k=>R.deck.some(d=>d.m&&d.m.k===k);
 if(!has('rain')&&!has('still'))return L('빗물 통을 지어 물을 모으자','造雨水桶收集淡水')+costTxt('rain');
 if(!has('fire'))return L('모닥불을 지어 밤을 버티자','造篝火熬过夜晚')+costTxt('fire');
 if(!has('rod'))return L('낚싯대로 먹을 것을 구하자','造钓竿找吃的')+costTxt('rod');
 if(islandOpen())return L('섬에 상륙해 나무와 물자를 구하자','登岛找木材和物资');
 if(stormDay()&&R.t<60&&!R.lashed)return L('폭풍 전에 밧줄로 배를 묶자','风暴来前用绳子加固船')+costTxt('lash');
 if(R.radioPart&&!R.radioBuilt)return L('무전기를 만들어 신호를 찾자','造电台寻找信号');
 if(!R.radioPart)return L('섬 오두막에서 무전기 부품을 찾아보자','去岛上小屋找电台零件');
 return L('배를 넓히고 다음 폭풍에 대비하자','扩建甲板，准备迎接下一场风暴')}
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
 if(T2.spoil)lines.push(L('상해서 버린 날생선 ','变质丢弃的生鱼 ')+T2.spoil);lines.forEach((s,i)=>txt('· '+s,110,310+i*48,23,'#3a2e1e','left',false));
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
function startLand(){R.landed=R.day;track('land_start',{day:R.day});mission('land');save.stats.lands++;let s=R.day*977+R.zone*131;const rnd=()=>{s=(s*16807)%2147483647;return (s%10000)/10000};
 const objs=[];for(let i=0;i<9;i++)objs.push({k:'tree',x:80+rnd()*590,y:420+rnd()*1050,hp:3});for(let i=0;i<5;i++)objs.push({k:'bush',x:80+rnd()*590,y:500+rnd()*1000,n:1});for(let i=0;i<4;i++)objs.push({k:'rock',x:80+rnd()*590,y:350+rnd()*900,n:2});
 const hx=180+rnd()*390,hy=520+rnd()*300;objs.push({k:'hut',x:hx,y:hy});for(let i=0;i<3;i++)objs.push({k:'crate',x:hx-60+i*60,y:hy+90,n:1,first:i===0});objs.push({k:'stream',x:375,y:250,n:3});
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
 for(const z of Ld.zs){if(z.hp<=0)continue;const d=Math.hypot(p.x-z.x,p.y-z.y),sp=night?150:100;if(Ld.noise>55||d<190||night)z.a=1;else if(d>500)z.a=0;
  if(z.a){const k=sp*dt/Math.max(1,d);z.x+=(p.x-z.x)*k;z.y+=(p.y-z.y)*k}else{z.w+=dt;z.x=z.hx+Math.sin(z.w*.7)*50;z.y=z.hy+Math.cos(z.w*.5)*30}
  z.hit-=dt;if(d<38&&z.hit<=0){z.hit=1;v.hp-=12;AudioFx.cue('hurt');vib('medium');shake(10,.25)}}
 Ld.zs=Ld.zs.filter(z=>z.hp>0||Math.random()>.01);
 if(v.hp<=0){fail('land');return}
 if(Math.hypot(p.x-375,p.y-1830)<70&&Ld.goBoat)backToSea(true);
 camY+=((p.y-H*.58)-camY)*Math.min(1,dt*5);camY=Math.max(0,Math.min(LAND_H-H+200,camY))}
function landAct(o){const Ld=Land;const add=(k,n)=>{n=Math.min(n,Ld.cap-Ld.n);if(n<=0){message(L('짐이 가득 찼어요. 배로 돌아가세요','装满了，回船上去吧'),1.6);Ld.target=null;return false}Ld.carry[k]=(Ld.carry[k]||0)+n;Ld.n+=n;fxText(o.x,o.y-40,LL(RES_N[k])+' +'+n,'#fff3c0');AudioFx.cue('pick');return true};
 if(o.k==='tree'){o.hp--;Ld.noise+=16;AudioFx.cue('chop');shake(4,.1);mission('chop');if(o.hp<=0){o.gone=1;add('plank',2);Ld.target=null}}
 else if(o.k==='bush'){if(add('berry',2)){o.gone=1}Ld.target=null}
 else if(o.k==='rock'){Ld.noise+=22;AudioFx.cue('chop');if(add('scrap',1)){o.n--;if(o.n<=0)o.gone=1}Ld.target=null}
 else if(o.k==='stream'){if(add('water',3)){o.n--;if(o.n<=0)o.gone=1}R.vit.thirst=Math.min(100,R.vit.thirst+20);Ld.target=null}
 else if(o.k==='crate'){let got;if(o.first&&!R.radioPart){R.radioPart=true;message(L('오두막에서 무전기 부품을 찾았다!','在小屋里找到了电台零件！'),2.2);got=null}else{const q=Math.random();got=q<.3?['cloth',2]:q<.55?['rope',2]:q<.75?['can',1]:q<.9?['med',1]:['plastic',2]}if(got)add(got[0],got[1]);o.gone=1;Ld.target=null}
 else Ld.target=null}
function landTap(x,y){const Ld=Land,wx=x,wy=y+camY;
 if(Math.hypot(wx-375,wy-1830)<110){Ld.goBoat=true;Ld.target=null;Ld.p.tx=375;Ld.p.ty=1830;return}
 for(const z of Ld.zs)if(z.hp>0&&Math.hypot(wx-z.x,wy-z.y)<50){Ld.target={z};Ld.goBoat=false;return}
 let best=null,bd=70;for(const o of Ld.objs)if(!o.gone&&o.k!=='hut'){const d=Math.hypot(wx-o.x,wy-o.y);if(d<bd){bd=d;best=o}}
 Ld.goBoat=false;if(best){Ld.target={o:best};Ld.work=0;Ld.p.tx=best.x;Ld.p.ty=best.y+40}else{Ld.target=null;Ld.p.tx=wx;Ld.p.ty=Math.max(160,wy)}}
function backToSea(ok){const Ld=Land;if(ok){for(const k in Ld.carry)R.res[k]=(R.res[k]||0)+Ld.carry[k];track('land_back',{n:Ld.n,t:Math.round(R.t)});message(L('배로 돌아왔다. 짐 ','回到船上。带回 ')+Ld.n+L('개를 실었다',' 件物资'),1.8)}Land=null;if(sc==='land'){enterSea()}}
function drawLand(){const Ld=Land,p=Ld.p,night=isNight();g.fillStyle='#24301f';g.fillRect(0,0,W,H);g.save();g.translate(0,-camY);
 g.fillStyle='#1e3a44';g.fillRect(0,LAND_H-120,W,300);g.fillStyle='#8a7a5a';g.fillRect(0,LAND_H-200,W,90);
 rr(330,1800,90,60,12,'#7a5c3e','#2a1e14',3);txt(L('배','船'),375,1830,18,'#fff','center');if(R.t>DUSK)drawGlow(375,1830,90,'y',.5+.2*Math.sin(frame*5));
 for(const o of Ld.objs)if(!o.gone){if(o.k==='tree'){circ(o.x,o.y+16,22,'#3a2a1a');circ(o.x,o.y-10,34,'#2e4a2a','#1a2a18',3);if(o.hp<3)txt(o.hp+'',o.x,o.y-10,18,'#fff','center')}
  else if(o.k==='bush'){circ(o.x,o.y,22,'#3a5a30');circ(o.x-6,o.y-4,4,'#e0607a');circ(o.x+7,o.y+3,4,'#e0607a')}
  else if(o.k==='rock')circ(o.x,o.y,26,'#6a6e74','#3a3c40',3);
  else if(o.k==='hut'){rr(o.x-90,o.y-60,180,120,8,'#4a3a2a','#2a2016',3);txt(L('오두막','小屋'),o.x,o.y,18,'#d8c8a8','center')}
  else if(o.k==='crate'){rr(o.x-18,o.y-18,36,36,4,'#a07850','#3a2414',3);drawGlow(o.x,o.y,30,'y',.3)}
  else if(o.k==='stream'){g.fillStyle='#3a7aa0';g.fillRect(0,o.y-30,W,60);txt(L('개울 (물 뜨기)','小溪（打水）'),o.x,o.y,18,'#e8f4ff','center')}}
 for(const z of Ld.zs)if(z.hp>0)drawInfected(z)
 drawHero(p,Ld.target&&Ld.work>0?(Ld.target.o&&Ld.target.o.k==='tree'||Ld.target.o&&Ld.target.o.k==='rock'?'attack':'gather'):Ld.target&&Ld.target.z&&Ld.atk>.3?'attack':null,96);drawFx(0);g.restore();
 if(night||R.t>DUSK){g.fillStyle=`rgba(2,6,14,${night?.6:(R.t-DUSK)/(NIGHT-DUSK)*.45})`;g.fillRect(0,0,W,H)}
 // HUD
 rr(0,0,W,128,0,'#0b0f16e8');txt(L(R.day+'일째 · 섬','第'+R.day+'天 · 岛'),24,32,24,'#ffe2a0','left',false);rr(240,24,370,16,8,'#1a2230');rr(240,24,370*Math.min(1,R.t/DAY),16,8,R.t>DUSK?'#c06040':'#e0b060');rr(240+370*DUSK/DAY-1,20,3,24,1,'#ff9a7a');
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
function title(){g.fillStyle='#071016';g.fillRect(0,0,W,H);g.strokeStyle='rgba(120,180,200,.08)';g.lineWidth=2;for(let i=0;i<24;i++){const y=600+i*30;g.beginPath();for(let x=0;x<=W;x+=30)g.lineTo(x,y+Math.sin(x*.02+frame+i)*4);g.stroke()}
 g.fillStyle='#14181c';g.fillRect(0,520,W,40);for(let i=0;i<12;i++)rr(20+i*62,450-((i*37)%60),48,80+((i*37)%60),2,'#101418');// 불 꺼진 해안 도시
 drawGlow(560,700,60,'o',.6+.1*Math.sin(frame*6));rr(530,690,60,26,6,'#5a4030');// 배의 불빛
 txt('RECLAIM',375,220,96,'#ffcf6a','center');txt(L('돌아온 땅','重归之地'),375,300,40,'#fff','center');txt(L('탈출하고, 버티고, 돌아가 되찾아라','逃离，坚持，然后夺回'),375,350,21,'#c9d2de','center',false);
 const cont=!!save.run;button(150,820,450,96,cont?L('이어서 버티기 ('+save.run.day+'일째)','继续（第'+save.run.day+'天）'):L('탈출 시작','开始逃离'),'gold',30,()=>{AudioFx.init();if(save.run){R=save.run;enterSea()}else startAct1()},{id:'btn_start'});
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
 rr(50,y0,650,h,18,'#141a28f6','#ffcf6a',3);txt('💡 '+L('안내','提示'),90,y0+46,26,'#ffe2a0');let y=y0+96;wr.forEach(w=>{w.forEach(l=>{txt(l,90,y,21,'#e6ecf2','left',false);y+=34});y+=14});
 txt(L('화면을 탭하면 닫혀요','点击屏幕关闭'),375,y0+h-26,16,'#8a94a4','center',false)}
function tip(id,lines){if(save.tips[id])return false;save.tips[id]=1;persist();guideTip={lines,t:0};return true}
function pauseOverlay(){g.fillStyle='rgba(4,6,12,.85)';g.fillRect(0,0,W,H);txt(L('일시정지','暂停'),375,330,44,'#ffe2a0','center');
 button(150,420,450,90,L('계속하기','继续'),'gold',28,()=>{paused=false},{id:'btn_resume'});button(150,530,450,80,L('안내서','指南'),'blue',24,()=>{paused=false;guideRet=sc==='sea'?'sea':'title';if(sc==='sea'){sc='guide';guidePage=0}else{message(L('안내서는 바다 또는 타이틀에서 볼 수 있어요','在海上或标题画面查看指南'),1.6)}});
 button(150,630,450,80,L('설정','设置'),'blue',24,()=>{paused=false;if(sc==='sea'){guideRet='sea';sc='settings'}else message(L('설정은 바다 또는 타이틀에서 열 수 있어요','在海上或标题画面打开设置'),1.6)});
 button(150,730,450,80,L('타이틀로 (저장됨)','回到标题（已保存）'),'gray',22,()=>{paused=false;if(sc==='land'){backToSea(true)}persist();sc='title'})}

// ================================================================ 입력
function touch(x,y){AudioFx.init();Music.kick();
 if(adShow)return;if(guideTip){if(guideTip.t>.3)guideTip=null;return}
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
 else if(sc==='land')drawLand();else if(sc==='dayend')dayendScreen();else if(sc==='g1done')g1Screen();else if(sc==='fail')failScreen();else if(sc==='settings')settingsScreen();else if(sc==='privacy')privacyScreen();else if(sc==='guide')guideScreen();else if(sc==='reward')rewardScreen();
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
  if(islandOpen()&&R.t<70){startLand();return}
  const rod=R.deck.find(d=>d.m&&d.m.k==='rod');if(rod&&v.hunger<80&&!isNight()&&Math.random()<.5){walkTo(rod,()=>useTile(rod));return}
  const bed=R.deck.find(d=>d.m&&d.m.k==='bed');if(bed&&isNight()&&!sleeping&&(!ft||ft.m.fuel>40)){walkTo(bed,()=>useTile(bed));return}
  const o=debris.filter(o2=>!o2.pull&&o2.y>150&&o2.y<1000).sort((a,b)=>Math.hypot(a.x-seaP.x,a.y-seaP.y)-Math.hypot(b.x-seaP.x,b.y-seaP.y))[0];if(o)seaTap(o.x,o.y);return}
 if(sc==='land'){const Ld=Land,p=Ld.p;if(Ld.goBoat)return;if(Ld.n>=Ld.cap||R.t>100||R.vit.hp<35){Ld.goBoat=true;Ld.p.tx=375;Ld.p.ty=1830;Ld.target=null;return}
  const z=Ld.zs.find(z2=>z2.hp>0&&Math.hypot(z2.x-p.x,z2.y-p.y)<120);if(z){Ld.target={z};return}if(Ld.target)return;
  if(Ld.noise>45)return;const o=Ld.objs.filter(o2=>!o2.gone&&o2.k!=='hut').sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(o){Ld.target={o};Ld.work=0;p.tx=o.x;p.ty=o.y+40}}}
let botT=0,botZone=0,botBuilt=null;
function botCell(k){if(k==='deck'){for(let r=1;r<5;r++)for(let gy=-r;gy<=r;gy++)for(let gx=-r;gx<=r;gx++)if(!tileAt(gx,gy)&&adjacentEmpty(gx,gy)&&gx>=-3&&gx<=3&&gy>=-3&&gy<=4)return {x:gx,y:gy};return null}const t=R.deck.find(d=>!d.m);return t?{x:t.x,y:t.y}:null}
if(!API&&typeof location!=='undefined'&&location.search.indexOf('debug=1')>=0){globalThis.__bepaDebug={get sc(){return sc},set sc(v){sc=v},get R(){return R},get A(){return A},get Land(){return Land},save,persist,touch,startAct1,startSea,startLand,enterSea,nextDay,fail,revive,showAd,
 get btns(){return btns},set bot(v){autoBot=v},set botZone(v){botZone=v},set freeze(v){dbgFreeze=v},spawnDebris,stormDamage,shadowBump,
 setT(t){if(R)R.t=t},setRes(o){Object.assign(R.res,o)},setVit(o){Object.assign(R.vit,o)},get guideTip(){return guideTip},set guideTip(v){guideTip=v},set guidePage(v){guidePage=v},get paused(){return paused},set paused(v){paused=v},
 step(n,dt=1/60){dbgFreeze=false;for(let i=0;i<n;i++){guideTip=null;btnsNext=[];tick(dt)}dbgFreeze=true},drawNow(){draw(0)},get drawErr(){return drawErr},get stats(){return STAT_LOG},forceStorm(){if(R){R.zone=0;R.day=Z().storm;R.t=61}},joyStart,joyMove,joyEnd,get joy(){return joy},get seaP(){return seaP}}}
let drawErr=0;function loop(now){let dt=last?(now-last)/1000:0;last=now;perf(Math.min(dt,.25));try{draw(Math.min(dt,.1))}catch(e){drawErr++;try{g.restore();g.restore();g.restore()}catch(e2){}if(drawErr<5&&typeof console!=='undefined')console.error('draw error',e);if(drawErr===1)track('draw_error',{m:String(e&&e.message||e).slice(0,80),sc})}
 if(API){if(typeof requestAnimationFrame==='function')requestAnimationFrame(loop);else if(c.requestAnimationFrame)c.requestAnimationFrame(loop)}else requestAnimationFrame(loop)}
if(API){if(typeof requestAnimationFrame==='function')requestAnimationFrame(loop);else if(c.requestAnimationFrame)c.requestAnimationFrame(loop)}else requestAnimationFrame(loop);
})();
