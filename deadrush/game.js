/* DEAD RUSH: LAST SIGNAL — BEPA V12
 * 생존자 캠페인 · 6챕터 24스테이지 · 무한 습격 · 드롭 아이템으로 탑 건설 · 층별 무기 장착
 * Canvas2D · 외부 CDN 없음 · 강제 광고 없음 · 한국어 / 简体中文
 */
(()=>{'use strict';
const W=750,H=1334,TAU=Math.PI*2,PI=Math.PI,TOTAL_WAVES=15;
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
// ---------------------------------------------------------------- assets
const imgs={},tints={};
const WPN_ART=['gatling','tesla','mortar','flame','cryo'];
const CREW6=['hanna','junho','mio','rena','sera','doyun'];const PORTRAITS=CREW6.map(n=>'p_'+n).concat(CREW6.map(n=>'s_'+n),['bg1','bg2','bg3','bg4','bg5','bg6','bg_base','bg_map','o_barrel','o_crate','o_heli','o_bomber','z_boomer','z_queen']);
const IMG_LIST=['cover_v8','story_v8','tower_hd','z_runner','z_scout','z_helmet','z_charger','z_shield','z_shield_broken','z_spitter','z_brute','z_hound','z_boss',
 'ui_card','ui_card_sel','ui_skill','ui_hud','ui_warn'].concat(WPN_ART.map(n=>n+'_base'),WPN_ART.map(n=>n+'_barrel'),PORTRAITS);
function tintOf(im,col){const cv=mkCanvas(im.width,im.height),x=cv.getContext('2d');x.drawImage(im,0,0);x.globalCompositeOperation='source-atop';x.fillStyle=col;x.fillRect(0,0,im.width,im.height);return cv}
function loadImg(name,tries=0){const im=API?(API.createImage?API.createImage():c.createImage()):new Image();im.onload=()=>{imgs[name]=im;if(name.indexOf('z_')===0){try{tints[name]={w:tintOf(im,'#ffe9cf'),ice:tintOf(im,'#9ff0ff'),fire:tintOf(im,'#ff6a1a'),char:tintOf(im,'#211816'),zap:tintOf(im,'#9fe8ff'),purp:tintOf(im,'#c43cff')}}catch(e){}}};im.onerror=()=>{if(tries<5)setTimeout(()=>loadImg(name,tries+1),500+tries*700)};
 im.src='res/'+name+(name==='cover_v8'||name==='story_v8'||name==='city'||name.indexOf('bg')===0?'.jpg':'.png')+(API?'':'?v=12'+(tries?'r'+tries:''))}
IMG_LIST.forEach(loadImg);
// soft sprites rendered once (glow / smoke) — reused by every effect instead of shadowBlur
const GLOW_COL={w:[255,248,220],y:[255,214,110],o:[255,138,46],r:[255,68,36],b:[80,180,255],c:[150,240,255],g:[150,240,100],p:[200,150,255]};
const glow={};let smokeSpr=null,dustSpr=null;
function makeSprites(){for(const k in GLOW_COL){const cv=mkCanvas(64,64),x=cv.getContext('2d'),[r,gg,b]=GLOW_COL[k],gr=x.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,`rgba(${r},${gg},${b},1)`);gr.addColorStop(.25,`rgba(${r},${gg},${b},.75)`);gr.addColorStop(.6,`rgba(${r},${gg},${b},.22)`);gr.addColorStop(1,`rgba(${r},${gg},${b},0)`);x.fillStyle=gr;x.fillRect(0,0,64,64);glow[k]=cv}
 const mk=(a,b)=>{const cv=mkCanvas(64,64),x=cv.getContext('2d'),gr=x.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,a);gr.addColorStop(.55,a.replace(/[\d.]+\)$/,'.45)'));gr.addColorStop(1,b);x.fillStyle=gr;x.fillRect(0,0,64,64);return cv};
 smokeSpr=mk('rgba(52,48,58,.95)','rgba(52,48,58,0)');dustSpr=mk('rgba(170,146,118,.9)','rgba(170,146,118,0)')}
makeSprites();

// ---------------------------------------------------------------- audio
const SFX=['gun','zap','boom','flame','water','siren','missile','emp','freeze','clang','shatter','slam','hurt','power','ui','win'];
// 배경음악: 자체 제작(저작권 문제 없음). res/bgm_*.mp3 교체 가능
const Music={el:null,cur:'',on:true,vol:.55,src:null,gain:null,bufs:{},pend:null,nat:null,
 play(key){if(this.cur===key)return;this.cur=key;if(!this.on)return;this._start(key)},
 _start(key){const loop=key!=='win'&&key!=='lose';
  if(API&&API.createInnerAudioContext){if(API.loadSubpackage&&!this.subOk){if(!this.subReq){this.subReq=true;try{API.loadSubpackage({name:'audio',success:()=>{this.subOk=true;const k=this.cur;this.cur='';this.play(k)},fail:()=>{this.subReq=false}})}catch(e){this.subOk=true}}return}
   try{if(this.nat)this.nat.stop();if(!this.natPool)this.natPool={};let a=this.natPool[key];if(!a){a=API.createInnerAudioContext();a.src=(API.loadSubpackage?'audio/':'res/')+'bgm_'+key+'.mp3';a.loop=loop;this.natPool[key]=a}a.volume=this.vol;a.seek&&a.seek(0);a.play();this.nat=a}catch(e){}return}
  const ctx=AudioFx.ctx;
  if(ctx&&typeof fetch==='function'&&location.protocol!=='file:'){this._stopWeb();const go=b=>{if(this.cur!==key||!this.on)return;try{const s2=ctx.createBufferSource(),gn=ctx.createGain();s2.buffer=b;s2.loop=loop;gn.gain.setValueAtTime(0,ctx.currentTime);gn.gain.linearRampToValueAtTime(this.vol,ctx.currentTime+.8);s2.connect(gn);gn.connect(ctx.destination);s2.start();this.src=s2;this.gain=gn}catch(e){}};
   if(this.bufs[key])go(this.bufs[key]);else fetch('res/bgm_'+key+'.mp3').then(r=>r.arrayBuffer()).then(ab=>ctx.decodeAudioData(ab,b=>{this.bufs[key]=b;go(b)},()=>{})).catch(()=>{});return}
  if(typeof Audio!=='undefined'){try{if(this.el)this.el.pause();this.el=new Audio('res/bgm_'+key+'.mp3');this.el.loop=loop;this.el.volume=this.vol;const pr=this.el.play();if(pr&&pr.catch)pr.catch(()=>{})}catch(e){}}},
 _stopWeb(){if(this.src&&this.gain&&AudioFx.ctx){const ctx=AudioFx.ctx,s2=this.src,gn=this.gain;try{gn.gain.cancelScheduledValues(ctx.currentTime);gn.gain.setValueAtTime(gn.gain.value,ctx.currentTime);gn.gain.linearRampToValueAtTime(0,ctx.currentTime+.6);s2.stop(ctx.currentTime+.65)}catch(e){}}this.src=null;this.gain=null},
 stop(){this._stopWeb();if(this.el){try{this.el.pause()}catch(e){}}if(this.nat){try{this.nat.stop()}catch(e){}}},
 toggle(){this.on=!this.on;if(!this.on)this.stop();else{const k=this.cur;this.cur='';this.play(k||'menu')}},
 kick(){if(this.on&&this.cur&&!this.src&&!(this.el&&!this.el.paused)&&!this.nat){const k=this.cur;this.cur='';this.play(k)}}};
function wantMusic(){let k='menu';if(sc==='battle'||sc==='clear'||sc==='fail'){if(sc==='clear')k='win';else if(sc==='fail')k='lose';else k=zs.some(z=>z.type==='boss')||cine?'boss':'battle'}else if(sc==='ending')k='win';Music.play(k)}
const AudioFx={ctx:null,enabled:true,buf:{},last:{},native:{},
 init(){if(!this.enabled||this.ctx||API)return;try{const A=typeof AudioContext!=='undefined'?AudioContext:typeof webkitAudioContext!=='undefined'?webkitAudioContext:null;if(A){this.ctx=new A();this.master=this.ctx.createGain();this.master.gain.value=.8;this.master.connect(this.ctx.destination);this.load()}}catch(e){}},
 load(){if(typeof fetch!=='function'||typeof location==='undefined'||location.protocol==='file:')return;for(const k of SFX){fetch('res/sfx_'+k+'.wav').then(r=>r.arrayBuffer()).then(b=>this.ctx.decodeAudioData(b,d=>{this.buf[k]=d},()=>{})).catch(()=>{})}},
 beep(freq=440,duration=.07,kind='square',vol=.025,fall=0){if(!this.ctx)return;try{const t=this.ctx.currentTime,o=this.ctx.createOscillator(),v=this.ctx.createGain();o.type=kind;o.frequency.setValueAtTime(freq,t);if(fall)o.frequency.exponentialRampToValueAtTime(Math.max(40,freq*fall),t+duration);v.gain.setValueAtTime(vol,t);v.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(v);v.connect(this.master);o.start(t);o.stop(t+duration+.01)}catch(e){}},
 cue(key,vol=1,gap=.05){if(!this.enabled)return;const now=Date.now()/1000;if(this.last[key]&&now-this.last[key]<gap)return;this.last[key]=now;
  if(API&&typeof API.createInnerAudioContext==='function'){try{let pool=this.native[key];if(!pool){pool={i:0,a:[0,1].map(()=>{const a=API.createInnerAudioContext();a.autoplay=false;a.src='res/sfx_'+key+'.wav';return a})};this.native[key]=pool}const a=pool.a[pool.i++%2];a.volume=Math.min(1,vol);a.stop();a.play()}catch(e){}return}
  if(!this.ctx)return;const b=this.buf[key];
  if(b){try{const s=this.ctx.createBufferSource(),v=this.ctx.createGain();s.buffer=b;s.playbackRate.value=.94+Math.random()*.12;v.gain.value=vol;s.connect(v);v.connect(this.master);s.start()}catch(e){}return}
  switch(key){case 'gun':this.beep(180,.038,'sawtooth',.015,.5);break;case 'zap':this.beep(720,.13,'triangle',.022,.37);break;case 'boom':case 'slam':this.beep(95,.24,'sawtooth',.05*vol,.24);break;case 'flame':this.beep(140,.2,'sawtooth',.012,.7);break;case 'water':this.beep(300,.15,'triangle',.014,.5);break;case 'siren':this.beep(700,.5,'sine',.02,1.4);break;case 'missile':this.beep(1400,.4,'sine',.012,.3);break;case 'emp':case 'power':this.beep(420,.14,'triangle',.035,1.6);break;case 'freeze':case 'shatter':this.beep(1800,.18,'sine',.015,1.3);break;case 'clang':this.beep(900,.06,'square',.012,.8);break;case 'hurt':this.beep(125,.17,'square',.028,.4);break;case 'win':this.beep(620,.22,'triangle',.033,1.4);break;case 'ui':this.beep(480,.06,'sine',.018,1.1)}}};

// ---------------------------------------------------------------- i18n
let LANG='ko';
// 첫 실행 언어: 위챗·더우인은 중국어 기본(기기 언어가 한국어일 때만 한국어). 웹은 기기 언어 또는 중국 시간대면 중국어
try{if(API){const sl=((API.getSystemInfoSync&&API.getSystemInfoSync().language)||'').toLowerCase();LANG=sl.indexOf('ko')===0?'ko':'zh'}
 else{const langs=(typeof navigator!=='undefined'?(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||'']):[]).map(x=>(x||'').toLowerCase());
  let tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){}
  const zhTZ=/^Asia\/(Shanghai|Chongqing|Chungking|Harbin|Urumqi|Kashgar|Hong_Kong|Macau|Taipei)$/.test(tz)||tz==='PRC';
  if(langs[0]&&langs[0].indexOf('zh')===0)LANG='zh';else if(zhTZ&&!(langs[0]&&langs[0].indexOf('ko')===0))LANG='zh';else if(zhTZ)LANG='zh'}}catch(e){}
let LANG_FORCED=null;try{if(!API&&typeof location!=='undefined'){const m=location.search.match(/[?&]lang=(ko|zh)/);if(m)LANG_FORCED=m[1]}}catch(e){}if(LANG_FORCED)LANG=LANG_FORCED;
const L=(ko,zh)=>LANG==='zh'?zh:ko;
const TIER_MAX=8,SUP_MAX=8;
const LL=p=>Array.isArray(p)?(LANG==='zh'?p[1]:p[0]):(p||'');
const ZH={'방패 파괴':'盾牌破碎','저지!':'打断！',' 연속 처치! 전력 +9':' 连杀！电力 +9','재충전 ':'充能中 ','초':'秒','긴급 전력이 부족하다':'紧急电力不足','EMP 충전… 방출!':'EMP 充能… 释放！','긴급 빙결! 냉기 확산':'紧急冰冻！寒气扩散','저사양 모드 자동 적용':'已自动切换省电模式','최후의 지휘관 격퇴!':'击败指挥官！'};
function T(s){return LANG==='zh'&&ZH[s]!==undefined?ZH[s]:s}

// ---------------------------------------------------------------- save (영구 진행)
const SAVE_KEY='bepa_dr_v9_save';
const save={tips:{},daily:null,att:{last:'',streak:0},chest:[],stats:{kills:0},prep:0,endlessBest:0,cleared:0,stars:[],mat:0,parts:0,floors:0,armor:0,tier:[0,0,0,0,0],equip:[0,-1,-1,-1,-1],sup:{air:0,energy:0,medic:0,scrap:0},seenIntro:false,lang:null,qualityLow:false,qualityManual:false,shake:true,ended:false};
let qualityLow=false,qualityManual=false,shakeReduced=false;
try{const raw=API&&API.getStorageSync?API.getStorageSync(SAVE_KEY):typeof localStorage!=='undefined'?localStorage.getItem(SAVE_KEY):null;const v=raw?JSON.parse(raw):null;if(v){for(const k in save)if(v[k]!==undefined)save[k]=v[k];if(v.sup)save.sup=Object.assign({air:0,energy:0,medic:0,scrap:0},v.sup)}}catch(e){}
if(!LANG_FORCED&&(save.lang==='ko'||save.lang==='zh'))LANG=save.lang;if(save.mild===undefined)save.mild=LANG==='zh'||!!API;if(save.sfx===false)AudioFx.enabled=false;if(save.music===false)Music.on=false;qualityLow=!!save.qualityLow;qualityManual=!!save.qualityManual;shakeReduced=!save.shake;
function todayKey(){const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()}
const MISSIONS=[{k:'kill',goal:150,name:['좀비 150마리 처치','击杀150只僵尸'],r:{mat:20}},{k:'clear',goal:2,name:['스테이지 2회 클리어','通关2次'],r:{parts:12}},{k:'skill',goal:6,name:['스킬 6회 사용','使用技能6次'],r:{mat:15}},
 {k:'crate',goal:2,name:['보급 상자 2개 회수','回收2个补给箱'],r:{parts:10}},{k:'upgrade',goal:15,name:['전투 중 무기 강화 15회','战斗中强化武器15次'],r:{mat:15}},{k:'stars3',goal:1,name:['별 3개로 클리어','三星通关'],r:{parts:15}},
 {k:'elite',goal:20,name:['정예 좀비 20마리 처치','击杀20只精英僵尸'],r:{mat:20}},{k:'barrel',goal:3,name:['드럼통 3개 터뜨리기','引爆3个油桶'],r:{parts:10}}];
function dailyInit(){const t=todayKey();if(save.daily&&save.daily.day===t)return;let h=0;for(const ch of t)h=(h*31+ch.charCodeAt(0))|0;const pool=MISSIONS.map((m,i)=>i).filter(i=>MISSIONS[i].k!=='barrel'||save.cleared>=17);const pick=[];
 while(pick.length<3&&pool.length){h=(h*1103515245+12345)|0;const j=Math.abs(h)%pool.length;pick.push(pool.splice(j,1)[0])}save.daily={day:t,m:pick.map(i=>({i,p:0,c:false}))};persist()}
function mission(k,n=1){if(!save.daily)dailyInit();if(!save.daily)return;for(const m of save.daily.m){const M=MISSIONS[m.i];if(M.k===k&&!m.c&&m.p<M.goal){m.p=Math.min(M.goal,m.p+n);if(m.p>=M.goal)message(L('일일 미션 완료! ','每日任务完成！')+LL(M.name),1.6)}}}
const ATT=[{mat:20},{parts:10},{mat:35},{parts:18},{mat:50},{parts:25},{mat:80,parts:40}];
function attCan(){return save.att.last!==todayKey()}
function chestReward(c,t){return t?{mat:40+c*25,parts:20+c*12}:{mat:20+c*12,parts:8+c*6}}
function chapterStars(c){let n=0;for(let k=0;k<4;k++)n+=save.stars[c*4+k]||0;return n}
function rewardBadge(){if(!save.daily||save.daily.day!==todayKey())dailyInit();if(attCan())return true;if(save.daily.m.some(m=>!m.c&&m.p>=MISSIONS[m.i].goal))return true;for(let c=0;c<6;c++)for(let t=0;t<2;t++)if(!save.chest.includes(c*2+t)&&chapterStars(c)>=(t?12:6))return true;return false}
function give(r){if(r.mat)save.mat+=r.mat;if(r.parts)save.parts+=r.parts;persist();AudioFx.cue('power');message((r.mat?L('자재 +','建材 +')+r.mat+' ':'')+(r.parts?L('부품 +','零件 +')+r.parts:''),1.4)}
function persist(){save.lang=LANG;save.qualityLow=qualityLow;save.qualityManual=qualityManual;save.shake=!shakeReduced;try{const v=JSON.stringify(save);if(API&&API.setStorageSync)API.setStorageSync(SAVE_KEY,v);else if(typeof localStorage!=='undefined')localStorage.setItem(SAVE_KEY,v)}catch(e){}}

// ---------------------------------------------------------------- 캠페인 데이터
const SURV={
 hanna:{name:['한나','韩娜'],role:['리더 · 무전','队长 · 无线电'],img:'p_hanna',hair:'#f2c75a',coat:'#7a5a3a',from:0},
 junho:{name:['준호','俊浩'],role:['기관포 사수','机关炮射手'],img:'p_junho',hair:'#5d6b3a',coat:'#56663a',from:0},
 mio:{name:['미오','美绪'],role:['통신 · 냉각 기술자','通讯 · 冷冻技师'],img:'p_mio',hair:'#dcdce2',coat:'#55789a',from:0},
 rena:{name:['레나','蕾娜'],role:['전직 소방관','前消防员'],img:'p_rena',hair:'#d8582a',coat:'#a8402a',from:3},
 sera:{name:['세라','赛拉'],role:['전기 기술자','电气技师'],img:'p_sera',hair:'#c86a4a',coat:'#3a5a8a',from:9},
 doyun:{name:['도윤','道允'],role:['포병','炮兵'],img:'p_doyun',hair:'#8a6a3a',coat:'#5a5040',from:11},
 civ1:{name:['시민','市民'],role:['',''],img:'p_hanna',hair:'#3a2a24',coat:'#6a6a7a',from:99},civ2:{name:['시민','市民'],role:['',''],img:'p_hanna',hair:'#a07040',coat:'#7a4a4a',from:99},civ3:{name:['아이','孩子'],role:['',''],img:'p_hanna',hair:'#2a2a2a',coat:'#d0a040',from:99}};
const CREW_ORDER=['hanna','junho','mio','rena','sera','doyun'];
// 무기 인덱스: 0 기관포 1 전격포 2 박격포 3 화염포 4 냉각포 (공격 로직 인덱스와 동일)
const weapon=[
 {key:'gatling',name:['기관포','机关炮'],cost:50,shot:.24,dam:13,col:'#ffc477',range:640,unlock:0,crew:'junho',theme:0,desc:['빠른 연사 · 단일 대상','高速连射 · 单体']},
 {key:'tesla',name:['전격포','电击炮'],cost:120,shot:.9,dam:27,col:'#66d7ff',range:540,unlock:9,crew:'sera',theme:3,desc:['연쇄 번개 · 기절','连锁闪电 · 眩晕']},
 {key:'mortar',name:['박격포','迫击炮'],cost:150,shot:1.8,dam:68,col:'#ffc16c',range:760,unlock:11,crew:'doyun',theme:4,desc:['광역 폭발 · 넉백','范围爆炸 · 击退']},
 {key:'flame',name:['화염포','火焰炮'],cost:80,shot:.55,dam:17,col:'#ff7843',range:360,unlock:3,crew:'rena',theme:1,desc:['근거리 화염 · 화상','近距离火焰 · 灼烧']},
 {key:'cryo',name:['냉각포','冷冻炮'],cost:100,shot:1.2,dam:22,col:'#84e7ff',range:520,unlock:6,crew:'mio',theme:2,desc:['냉각 분사 · 둔화','冷冻喷射 · 减速']}];
const owned=i=>save.cleared>=weapon[i].unlock;
// 탑 층: 원화의 원형 거치대(원본 px), 공사 경계선(원본 y), 건설 자재, 해금 조건(클리어 스테이지 수)
const FLOORS=[
 {name:['지하 벙커','地下掩体'],ring:[240,1238],cut:1100,cost:0,gate:0},
 {name:['1층 화염실','1层 火焰室'],ring:[279,1035],cut:860,cost:30,gate:3},
 {name:['2층 냉각실','2层 冷冻室'],ring:[279,810],cut:620,cost:60,gate:6},
 {name:['3층 전격실','3层 电击室'],ring:[300,578],cut:420,cost:100,gate:9},
 {name:['옥상 포대','屋顶炮台'],ring:[308,382],cut:0,cost:150,gate:11}];
const FLOOR_AIM=[[PI,PI-.35,PI+.75],[PI-.05,PI-.6,PI+.4],[PI-.05,PI-.85,PI+.35],[PI-.1,PI-.85,PI+.3],[PI-.15,PI-.9,PI+.3]];
const SKILL_UNLOCK=[1,9,6];// 인덱스 0 공습: 2스테이지, 1 EMP: 10스테이지, 2 빙결: 7스테이지부터
const SKILL_COST=[60,50,45],SKILL_CD=[26,22,22];// 공습 · EMP · 빙결
const CH=[{name:['1장 · 지하 대피소','第1章 · 地下避难所'],theme:'night',col:'#8fb6ff'},{name:['2장 · 탑을 쌓다','第2章 · 筑塔'],theme:'dusk',col:'#ffb36a'},{name:['3장 · 폭풍의 밤','第3章 · 风暴之夜'],theme:'storm',col:'#a9c4ff'},{name:['4장 · 마지막 신호','第4章 · 最后的信号'],theme:'dawn',col:'#ff8a6a'},{name:['5장 · 착륙장 사수','第5章 · 死守停机坪'],theme:'fog',col:'#cfe3ea'},{name:['6장 · 최후의 탈출','第6章 · 最后的逃离'],theme:'inferno',col:'#ff6a9a'}];
const BOSSES=[{name:['도살자','屠夫'],hp:1300,scale:1.7},{name:['타이탄','泰坦'],hp:2600,scale:2.05},{name:['감염 군주','感染君主'],hp:4300,scale:2.35},{name:['베헤모스','巨兽'],hp:6200,scale:2.45},{name:['감염 여왕','感染女王'],hp:9500,scale:2.7}];
const D=(who,ko,zh)=>[who,[ko,zh]];
const STAGES=[
 {ch:0,name:['탈출','逃离'],waves:5,pool:'rrrrrs',ev:[{w:1,t:'escape',at:1}],
  brief:[D('hanna','다들 뛰어! 송신탑 지하 벙커까지 조금만 더!','大家快跑！再坚持一下就到信号塔的地下掩体了！'),D('junho','벙커 입구에 기관포가 있어. 내가 엄호할게!','掩体入口有挺机关炮，我来掩护！'),D('junho','놈들을 쓰러뜨리면 고철이 떨어져. 카드에 ▲가 뜨면 눌러서 강화해!','打倒僵尸会掉落废铁。卡片上出现▲时点击即可强化！')],
  clear:[D('hanna','…살았다. 오늘 밤은 이 벙커에서 버틴다.','……活下来了。今晚就在这个掩体里撑过去。'),D('mio','탑 꼭대기 송신기만 살리면 구조 요청을 보낼 수 있어요.','只要修好塔顶的发射器，就能发出求救信号。'),D('hanna','좀비가 떨어뜨린 자재와 부품을 모으자. 한 층씩 탑을 다시 쌓는 거야.','收集僵尸掉落的建材和零件。我们要一层一层把塔重新建起来。')]},
 {ch:0,name:['지하철 출구','地铁出口'],waves:5,pool:'rrrsssh',ev:[{w:3,t:'burrow',at:4}],
  brief:[D('mio','무전기를 고쳤어요! 군 잔존 부대 주파수가 잡혀요.','无线电修好了！收到了残存部队的频率。'),D('hanna','폭격 지원을 약속받았어. 위험할 때 공습 버튼을 눌러!','他们答应提供轰炸支援。危急时刻按空袭按钮！')],
  clear:[D('junho','땅 밑에서도 기어 올라와… 하수도가 다 이어져 있나 봐.','连地底下都爬出来了……下水道大概全是连通的。')]},
 {ch:0,name:['첫 번째 밤','第一夜'],waves:6,pool:'rrrsshh',ev:[{w:2,t:'rescue',who:'rena',at:3},{w:5,t:'horde',at:3}],
  brief:[D('hanna','생존자 신호다! 서쪽 골목에서 누가 달려오고 있어. 엄호해!','有幸存者信号！西边巷子里有人跑过来，掩护她！')],
  clear:[D('rena','고마워요. 전 소방관이었어요. 화염포라면 다룰 수 있어요.','谢谢你们。我以前是消防员，火焰炮我会用。'),D('hanna','자재가 모이면 기지에서 1층 화염실을 짓자. 높이 올라갈수록 안전해.','建材够了就在基地建1层火焰室。越往上越安全。')]},
 {ch:0,name:['불꽃','火焰'],waves:6,pool:'rrsshhcc',ev:[{w:3,t:'supply',at:5},{w:6,t:'horde',at:4}],
  brief:[D('rena','돌진하는 놈들이 보여요. 가까이 오면 내가 태울게요!','有冲过来的家伙。靠近了我就烧掉它们！')],
  clear:[D('mio','송신기까지는 아직 멀어요. 부품을 더 모아야 해요.','离发射器还很远，需要收集更多零件。')]},
 {ch:1,name:['보급로','补给线'],waves:6,pool:'rrshhccS',ev:[{w:2,t:'supply',at:4},{w:4,t:'burrow',at:5},{w:5,t:'supply',at:6}],
  brief:[D('hanna','군 수송기가 보급 상자를 떨어뜨려 준대. 상자가 보이면 터치해!','运输机会空投补给箱。看到箱子就点击！')],
  clear:[D('junho','방패를 든 놈들… 예전엔 진압 경찰이었겠지.','拿盾牌的家伙……以前大概是防暴警察吧。')]},
 {ch:1,name:['다리 위의 그림자','桥上的影子'],waves:7,pool:'rrshhcSp',ev:[{w:3,t:'drop',at:4},{w:6,t:'drop',at:3}],
  brief:[D('mio','고가도로 위에서 놈들이 뛰어내려요! 머리 위를 조심해요!','它们从高架桥上跳下来了！小心头顶！')],
  clear:[D('mio','냉각 장치를 조립했어요. 2층 냉각실을 지으면 놈들을 얼릴 수 있어요.','冷冻装置组装好了。建好2层冷冻室就能冻住它们。')]},
 {ch:1,name:['얼음 장벽','冰之墙'],waves:7,pool:'rshhcSpdd',ev:[{w:2,t:'supply',at:5},{w:4,t:'horde',at:3},{w:6,t:'burrow',at:4}],
  brief:[D('mio','빙결 지원도 준비됐어요. 빠른 놈들은 얼려서 막아요!','冰冻支援也准备好了。速度快的就冻住它们！')],
  clear:[D('rena','개들까지 감염됐어… 이 도시엔 정말 아무것도 안 남았네.','连狗都被感染了……这座城市真的什么都不剩了。')]},
 {ch:1,name:['도살자','屠夫'],waves:7,pool:'rshhcSpbd',ev:[{w:3,t:'drop',at:5},{w:5,t:'supply',at:5},{w:7,t:'boss',boss:0,at:4}],
  brief:[D('hanna','거대한 놈이 접근 중이야. 무리를 이끄는 우두머리야!','一个巨大的家伙正在接近，是领头的！')],
  clear:[D('junho','쓰러뜨렸다! …그런데 저 너머에 더 큰 그림자가 보여.','打倒了！……可是远处还有更大的影子。')]},
 {ch:2,name:['폭우','暴雨'],waves:8,pool:'rshcSpbd',ev:[{w:3,t:'rescue',who:'sera',at:3},{w:5,t:'drop',at:4},{w:7,t:'horde',at:4}],
  brief:[D('hanna','폭풍이 온다. 그리고… 생존자다! 엄호해!','风暴要来了。还有……有幸存者！掩护！')],
  clear:[D('sera','전 전기 기술자예요. 3층 배선만 살리면 전격포를 돌릴 수 있어요.','我是电气技师。只要修好3层的线路，就能启动电击炮。')]},
 {ch:2,name:['정전','停电'],waves:8,pool:'rshcSpbdd',ev:[{w:2,t:'blackout',at:3},{w:4,t:'supply',at:4},{w:6,t:'blackout',at:2},{w:7,t:'burrow',at:5}],
  brief:[D('sera','번개 때문에 전력이 불안정해요… 정전되면 총구 불빛만 보고 버텨요!','雷电让电力很不稳定……停电时就看着枪口的火光撑住！')],
  clear:[D('sera','EMP 장치 완성! 전기 충격으로 한꺼번에 묶어 둘 수 있어요.','EMP装置完成！可以用电击一次性控制住它们。')]},
 {ch:2,name:['포위','包围'],waves:9,pool:'rshcSSpbd',ev:[{w:2,t:'burrow',at:3},{w:4,t:'drop',at:4},{w:5,t:'rescue',who:'doyun',at:3},{w:7,t:'horde',at:3},{w:8,t:'supply',at:4}],
  brief:[D('hanna','사방에서 몰려온다. 땅, 다리, 정면… 그리고 저기 생존자!','四面八方都来了。地下、桥上、正面……那边还有幸存者！')],
  clear:[D('doyun','포병 출신이야. 옥상에 박격포만 올려 주면 멀리서부터 날려 버릴게.','我是炮兵出身。把迫击炮装到屋顶，我从远处就把它们炸飞。')]},
 {ch:2,name:['폭풍의 눈','风暴之眼'],waves:9,pool:'rshcSpbbd',ev:[{w:3,t:'blackout',at:4},{w:5,t:'drop',at:4},{w:6,t:'supply',at:3},{w:9,t:'boss',boss:1,at:3}],
  brief:[D('doyun','폭풍 속에서 거대한 놈이 온다. 이번엔 끝장내자!','风暴中来了个巨大的家伙。这次彻底解决它！')],
  clear:[D('mio','폭풍이 걷혔어요… 이제 송신기 수리만 남았어요!','风暴过去了……只剩下修理发射器了！')]},
 {ch:3,name:['옥상 포대','屋顶炮台'],waves:9,pool:'rshcSSppbd',ev:[{w:3,t:'supply',at:4},{w:5,t:'horde',at:3},{w:7,t:'burrow',at:3}],
  brief:[D('sera','송신기 부품을 모으는 중이에요. 조금만 더 버텨 줘요.','正在收集发射器零件，再撑一会儿。')],
  clear:[D('hanna','부품 확보. 이제 신호를 보낼 차례야.','零件到手了。该发信号了。')]},
 {ch:3,name:['끝없는 행렬','无尽的行列'],waves:10,pool:'rrsshcSpbdd',ev:[{w:3,t:'horde',at:2},{w:5,t:'supply',at:4},{w:6,t:'horde',at:2},{w:8,t:'drop',at:3},{w:9,t:'horde',at:2}],
  brief:[D('junho','지평선 끝까지 전부 좀비야…','一直到地平线尽头全是僵尸……')],
  clear:[D('rena','…아직 살아 있어. 우리 모두.','……我们还活着。所有人都是。')]},
 {ch:3,name:['신호 송출','发送信号'],waves:10,pool:'rshcSSpbbd',signal:true,ev:[{w:2,t:'burrow',at:3},{w:4,t:'drop',at:3},{w:5,t:'blackout',at:2},{w:7,t:'supply',at:4},{w:8,t:'horde',at:3}],
  brief:[D('mio','송신 시작! 신호가 100%가 될 때까지 탑을 지켜요!','开始发送！在信号达到100%之前守住信号塔！')],
  clear:[D('mio','구조대가 응답했어요! 그런데… 놈들의 군주가 깨어났어요.','救援队回应了！可是……它们的君主醒了。')]},
 {ch:3,name:['최후의 군주','最后的君主'],waves:10,pool:'rshcSSpbbdd',ev:[{w:3,t:'horde',at:3},{w:5,t:'blackout',at:3},{w:6,t:'supply',at:4},{w:8,t:'drop',at:3},{w:10,t:'boss',boss:2,at:3}],
  brief:[D('hanna','신호는 보냈어. 하지만 놈들의 군주가 깨어났다. 탑을 지켜!','信号发出去了。但它们的君主醒了。守住塔！')],
  clear:[D('mio','군주 격퇴! …구조대 무전이에요. 안개 때문에 헬기가 내려올 곳을 못 찾는대요.','击退君主！……救援队来电，说大雾里直升机找不到降落点。'),D('hanna','그럼 우리가 착륙장을 확보한다. 아직 끝나지 않았어.','那我们就去确保停机坪。还没结束。')]},
 {ch:4,name:['짙은 안개','浓雾'],waves:9,pool:'rshcSpbd',ev:[{w:2,t:'burrow',at:3},{w:4,t:'supply',at:4},{w:6,t:'drop',at:3},{w:8,t:'horde',at:3}],
  brief:[D('mio','안개 때문에 놈들이 바로 앞에 올 때까지 안 보여요!','雾太大了，它们走到跟前才看得见！'),D('hanna','헬기가 내릴 착륙장을 확보한다. 소리에 집중해!','确保直升机的降落点。注意听声音！')],
  clear:[D('doyun','안개 너머에서 뭔가 터졌어… 등에 폭탄을 멘 놈들이 있다.','雾那边有东西爆炸了……有背着炸药的家伙。')]},
 {ch:4,name:['폭발하는 것들','会爆炸的家伙'],waves:9,pool:'rrshcSpbxx',ev:[{w:1,t:'barrels',at:1},{w:3,t:'horde',at:3},{w:5,t:'supply',at:4},{w:6,t:'barrels',at:1},{w:8,t:'burrow',at:3}],
  brief:[D('rena','등에 드럼통을 멘 좀비예요! 탑에 닿으면 크게 터져요!','是背着油桶的僵尸！碰到塔就会大爆炸！'),D('sera','거꾸로 이용해요. 무리 한가운데서 쏘아 터뜨리면 연쇄 폭발!','反过来利用它们。在尸群中间打爆就会连锁爆炸！'),D('doyun','도로에 연료 드럼통도 깔아 뒀어. 놈들이 모이면 직접 터치해서 터뜨려!','我在路上埋了油桶。等它们聚过来就点击引爆！')],
  clear:[D('junho','하하, 이거 불꽃놀이 같은데!','哈哈，跟放烟花一样！')]},
 {ch:4,name:['호송대','护送队'],waves:10,pool:'rshcSpbxd',ev:[{w:2,t:'convoy',at:2},{w:4,t:'barrels',at:1},{w:5,t:'convoy',at:2},{w:7,t:'drop',at:3},{w:8,t:'convoy',at:2},{w:9,t:'horde',at:3}],
  brief:[D('hanna','신호를 들은 생존자들이 모여들고 있어. 한 명이라도 더 살려!','听到信号的幸存者正在赶来。能多救一个是一个！')],
  clear:[D('mio','구출한 사람들이 탑 수리를 돕고 있어요!','获救的人们正在帮忙修塔！')]},
 {ch:4,name:['안개 속의 거인','雾中巨人'],waves:10,pool:'rshcSSpbxd',ev:[{w:2,t:'barrels',at:1},{w:4,t:'horde',at:3},{w:6,t:'blackout',at:3},{w:7,t:'supply',at:4},{w:10,t:'boss',boss:3,at:3}],
  brief:[D('doyun','땅이 울려… 군주보다 더 큰 놈이야.','地面在震……比君主还大的家伙。')],
  clear:[D('hanna','착륙장 확보! 헬기가 연료를 구하러 갔어. 조금만 더!','停机坪确保了！直升机去找燃料了。再坚持一下！')]},
 {ch:5,name:['불타는 도시','燃烧的城市'],waves:10,pool:'rrshcSpbxxd',ev:[{w:2,t:'horde',at:3},{w:3,t:'barrels',at:1},{w:5,t:'drop',at:3},{w:7,t:'supply',at:4},{w:8,t:'burrow',at:3},{w:9,t:'horde',at:2}],
  brief:[D('sera','도시 전체가 불타요… 감염이 더 빨라졌어요.','整座城市都在燃烧……感染变快了。')],
  clear:[D('rena','불길 속에서도 놈들은 멈추지 않아.','即使在火海里，它们也不会停。')]},
 {ch:5,name:['연료 수송','燃料运输'],waves:10,pool:'rshcSSpbxd',signal:true,gauge:['연료 ','燃料 '],ev:[{w:2,t:'convoy',at:2},{w:3,t:'barrels',at:1},{w:5,t:'blackout',at:2},{w:6,t:'drop',at:3},{w:8,t:'supply',at:4},{w:9,t:'horde',at:3}],
  brief:[D('hanna','헬기 연료를 옥상까지 끌어올린다. 펌프가 끝날 때까지 버텨!','把直升机燃料抽到屋顶。撑到泵完成！')],
  clear:[D('mio','연료 충전 완료! 이제 헬기만 오면 돼요.','燃料加满了！就等直升机来了。')]},
 {ch:5,name:['마지막 밤','最后一夜'],waves:10,pool:'rrshcSSppbbxxdd',ev:[{w:2,t:'horde',at:2},{w:3,t:'burrow',at:3},{w:4,t:'horde',at:2},{w:5,t:'barrels',at:1},{w:6,t:'drop',at:3},{w:7,t:'horde',at:2},{w:8,t:'supply',at:3},{w:9,t:'horde',at:2}],
  brief:[D('junho','오늘 밤만 버티면 끝이야. 다들… 고마웠어.','只要撑过今晚就结束了。大家……谢谢你们。')],
  clear:[D('hanna','새벽이다! 헬기 소리가 들려!','天亮了！我听到直升机的声音了！')]},
 {ch:5,name:['감염 여왕','感染女王'],waves:10,pool:'rshcSSpbbxxd',ev:[{w:2,t:'barrels',at:1},{w:3,t:'horde',at:3},{w:5,t:'blackout',at:3},{w:6,t:'supply',at:4},{w:7,t:'drop',at:3},{w:8,t:'convoy',at:2},{w:10,t:'boss',boss:4,at:3}],
  brief:[D('mio','모든 감염의 근원… 여왕이 직접 와요!','所有感染的源头……女王亲自来了！'),D('hanna','헬기 착륙까지 1분. 가진 걸 전부 쏟아부어!','直升机降落还有1分钟。全部火力倾泻出去！')],
  clear:[D('hanna','해냈어… 우리가 해냈어!','我们做到了……我们做到了！')]}];
const LAST=STAGES.length-1;
// 스테이지 시간 단축: 웨이브 수 축소, 웨이브당 밀도 증가, 사건 웨이브 재배치
const LATE_DMG=[1,1,1,1,1,1,1,1,1,1,1,1,1.1,1.1,1.2,1.2,1.35,1.35,1.4,1.45,1.45,1.5,1.55,1.55];
const NEW_WAVES=[4,4,5,5,5,5,6,6,6,6,7,7,7,7,7,8,7,7,7,8,7,7,7,8];
STAGES.forEach((S,i)=>{const old=S.waves,nw=NEW_WAVES[i];S.cntMul=old/nw*(i<4?.68:i<12?.78:i<16?.66:.6);S.waves=nw;const used={};const out=[];
 for(const ev of S.ev.slice().sort((a,b)=>a.w-b.w)){let w=ev.t==='boss'?nw:Math.max(2,Math.min(nw,Math.round(ev.w*nw/old)));if(ev.t!=='boss'){while(used[w]&&w<nw-(S.ev.some(e=>e.t==='boss')?1:0))w++;if(used[w]){w=Math.max(2,Math.min(nw,Math.round(ev.w*nw/old)));while(used[w]&&w>2)w--;if(used[w])continue}}used[w]=1;ev.w=w;out.push(ev)}S.ev=out});

STAGES[0].brief=[[null,['D-3. 감염된 도시. 지하철역에 숨어 있던 우리는 송신탑으로 달린다.','D-3。感染的城市。躲在地铁站的我们冲向信号塔。']],STAGES[0].brief[0],STAGES[0].brief[2]];
const ENDLESS={ch:5,name:['무한 습격','无尽袭击'],waves:9999,pool:'rrshcSpbxd',ev:[],brief:[D('hanna','끝없이 몰려온다. 얼마나 버티는지 보자!','它们源源不断。看看我们能撑多久！')],clear:[]};
const STORY=[
 [['D-3 · 감염','D-3 · 感染'],['정체불명의 감염이 도시를 삼켰다.\n지하철역에 숨어든 우리는 사흘을 버텼다.','不明感染吞噬了城市。\n躲进地铁站的我们撑了三天。'],['하지만 지하에도 놈들이 내려오기 시작했다.','但它们开始涌入地下了。']],
 [['탈출','逃离'],['리더 한나의 신호와 함께\n우리는 지상으로 뛰쳐나갔다.','随着队长韩娜一声令下，\n我们冲上了地面。'],['목표는 북쪽 철길 옆, 버려진 송신탑의 지하 벙커.','目标是北边铁路旁，废弃信号塔的地下掩体。']],
 [['마지막 신호','最后的信号'],['송신탑 꼭대기의 송신기를 살리면\n구조대에 신호를 보낼 수 있다.','只要修好信号塔顶的发射器，\n就能向救援队发出信号。'],['좀비가 남긴 자재로, 한 층씩 탑을 다시 쌓아 올려야 한다.','用僵尸留下的材料，一层一层把塔重新建起来。']],
 [['작전 개시','行动开始'],['살아남은 사람은 셋.\n무기는 낡은 기관포 하나.','幸存者只有三人。\n武器只有一挺旧机关炮。'],['버텨라. 쌓아 올려라. 신호를 보내라.','撑住。建起来。把信号发出去。']]];
// 타워 원화 tower_hd(613×1460) → 화면 (447,270) 배율 TS
const TS=722/1460,TOWER={img:'tower_hd',x:447,y:270,w:613*TS,h:722};
const TP=(x,y)=>[TOWER.x+x*TS,TOWER.y+y*TS];
const ANT=(()=>{const [x,y]=TP(540,14);return {x,y}})();// 꼭대기 경광등 (EMP 충전·신호등)
// 무기 스프라이트 좌표(원본 px): piv = 포신 회전축, mz = 총구, post = 받침에서 포신 축이 얹히는 점, bh = 받침 높이
const ART={gatling:{piv:[228,62],mz:[4,52],post:[120,24]},tesla:{piv:[298,64],mz:[30,50],post:[135,25]},mortar:{piv:[172,50],mz:[10,40],post:[141,40]},flame:{piv:[235,62],mz:[6,55],post:[92,22]},cryo:{piv:[300,82],mz:[6,62],post:[110,18]}};
for(const k in ART){const a=ART[k];a.inh=Math.atan2(a.mz[1]-a.piv[1],a.mz[0]-a.piv[0]);a.len=Math.hypot(a.mz[0]-a.piv[0],a.mz[1]-a.piv[1])}
const BASE_H={gatling:155,tesla:173,mortar:142,flame:154,cryo:131};
const MOUNTS=[0,1,2,3,4].map(i=>({i,key:WPN_ART[i],art:ART[WPN_ART[i]],s:.34,fx:0,fy:0,x:0,y:0,L:0,rest:PI,min:PI-.5,max:PI+.5,floor:-1}));
function setMounts(){for(const m of MOUNTS){const f=save.equip.indexOf(m.i);m.floor=f;if(f<0)continue;const [fx,fy]=TP(FLOORS[f].ring[0],FLOORS[f].ring[1]);const a=m.art;m.fx=fx;m.fy=fy+6;m.x=fx;m.y=m.fy-(BASE_H[m.key]-a.post[1])*m.s;m.L=a.len;
 const A=m.key==='mortar'?[PI+.55,PI+.1,PI+1.05]:FLOOR_AIM[f];m.rest=A[0];m.min=A[1];m.max=A[2]}}
const RECOIL=[5,3,13,1.5,5];
const tur=MOUNTS.map(m=>({ang:m.rest,recoil:0,spin:0,spinV:0,flameT:0,flameTargets:[],fireT:9,charge:0}));
function muzzle(i,extra=0){const m=MOUNTS[i],t=tur[i],L=m.L*m.s-t.recoil+extra;return [m.x+Math.cos(t.ang)*L,m.y+Math.sin(t.ang)*L]}
const MASS={boomer:1,runner:1,scout:1,helmet:1,charger:1,shield:.8,spitter:1,brute:.5,hound:1,boss:.25};
const LIFT={boomer:1,runner:1,scout:1.1,helmet:.95,charger:1,shield:.6,spitter:1,brute:.3,hound:1.15,boss:0};
const REACT={boomer:1,runner:1,scout:1.1,helmet:.9,charger:1,shield:.6,spitter:1,brute:.4,hound:.8,boss:.18};
const ZKEY={boomer:'z_boomer',runner:'z_runner',scout:'z_scout',helmet:'z_helmet',charger:'z_charger',shield:'z_shield',spitter:'z_spitter',brute:'z_brute',hound:'z_hound',boss:'z_boss'};
const ZBASE={boomer:52,runner:58,scout:38,helmet:83,charger:77,shield:155,spitter:85,brute:155,hound:42,boss:1400};
const ZSPD={boomer:96,runner:81,scout:148,helmet:72,charger:112,shield:47,spitter:58,brute:45,hound:190,boss:34};
const ZDMG={boomer:14,runner:2,scout:1.5,helmet:3,charger:4,shield:4,spitter:2,brute:7,hound:2,boss:12};
const ZSCRAP={boomer:6,runner:4,scout:3,helmet:6,charger:6,shield:11,spitter:8,brute:14,hound:4,boss:120};
const ELITE={boomer:1,shield:1,brute:1,spitter:1,charger:1,boss:1};
const POOLMAP={r:'runner',s:'scout',h:'helmet',c:'charger',S:'shield',p:'spitter',b:'brute',d:'hound',x:'boomer'};

// ---------------------------------------------------------------- 진동 · 기록(통계)
let vibT=0;function vib(kind){if(save.vib===false)return;const now=Date.now();if(kind==='light'&&now-vibT<250)return;vibT=now;try{if(API&&API.vibrateShort)API.vibrateShort({type:kind==='heavy'?'heavy':kind==='medium'?'medium':'light'});else if(API&&API.vibrateLong&&kind==='long')API.vibrateLong();else if(typeof navigator!=='undefined'&&navigator.vibrate)navigator.vibrate(kind==='heavy'?60:kind==='medium'?35:15)}catch(e){}}
// 기록: 위챗 reportEvent / 더우인 reportAnalytics (관리자 화면에 같은 이벤트 이름을 등록해야 집계됨). 웹은 기기 안에 횟수만 저장
const STAT_LOG=[];function track(ev,data){data=data||{};try{STAT_LOG.push([ev,data]);if(STAT_LOG.length>200)STAT_LOG.shift();
 if(API&&PLATFORM==='wx'&&API.reportEvent)API.reportEvent(ev,data);else if(API&&PLATFORM==='tt'&&API.reportAnalytics)API.reportAnalytics(ev,data);
 if(!save.statc)save.statc={};save.statc[ev]=(save.statc[ev]||0)+1}catch(e){}}
// ---------------------------------------------------------------- 선택형 보상광고 · 공유 (강제 광고 없음)
const AD_UNIT={wx:'adunit-xxxxxxxxxxxxxxxx',tt:'xxxxxxxxxxxxxxxxxx'};// ← 플랫폼 광고 단위 ID로 교체
let adShow=null,adObj=null,adCb=null;
function showAd(place,cb0){if(adShow)return;track('ad_open',{place});const cb=()=>{track('ad_reward',{place});cb0()};
 if(API&&API.createRewardedVideoAd&&AD_UNIT[PLATFORM]&&AD_UNIT[PLATFORM].indexOf('xxxx')<0){try{if(!adObj){adObj=API.createRewardedVideoAd({adUnitId:AD_UNIT[PLATFORM]});adObj.onClose(r=>{const ok=!r||r.isEnded!==false;const f=adCb;adCb=null;Music.kick();if(ok&&f)f();else message(L('끝까지 시청해야 보상을 받습니다','需完整观看才能获得奖励'),1.4)});adObj.onError(()=>{adCb=null;message(L('광고를 불러오지 못했습니다','广告加载失败'),1.2)})}
  adCb=cb;adObj.show().catch(()=>adObj.load().then(()=>adObj.show()).catch(()=>{adCb=null;message(L('광고를 불러오지 못했습니다','广告加载失败'),1.2)}))}catch(e){cb()}return}
 adShow={t:0,cb,place}}// 테스트 환경: 2초 가짜 광고
function drawAd(){adShow.t+=1/60;g.fillStyle='rgba(0,0,0,.88)';g.fillRect(0,0,750,1334);txt(L('광고 재생 중 (테스트)','广告播放中（测试）'),375,620,30,'#fff','center');rr(175,680,400,16,8,'#222',null);rr(177,682,396*Math.min(1,adShow.t/2),12,6,'#ffcf6a',null);
 txt(L('실제 출시판에서는 위챗·더우인 보상형 광고가 재생됩니다','正式版将播放微信/抖音激励视频广告'),375,740,16,'#9fb0c4','center',false);if(adShow.t>=2){const f=adShow.cb;adShow=null;f()}}
function shareGame(){track('share',{});const title=L('좀비 떼를 막고 탑을 쌓아 구조 신호를 보내라! 나는 ','挡住尸潮、筑塔求救！我已通关 ')+save.cleared+L('스테이지까지 왔다',' 关');
 if(API&&API.shareAppMessage){try{API.shareAppMessage({title,imageUrl:'res/cover_v8.jpg'})}catch(e){}}else message(L('공유는 위챗·더우인에서 동작합니다','分享功能在微信/抖音中可用'),1.4)}
function onAppHide(){if(sc==='battle'&&!stageDone&&!perkPick&&!dialog)paused=true;Music.stop();Music.hidden=true;persist();track('app_hide',{sc})}
function onAppShow(){Music.hidden=false;const k=Music.cur;Music.cur='';if(Music.on)Music.play(k||'menu');else Music.cur=k;last=0}
if(API){try{API.onHide&&API.onHide(onAppHide);API.onShow&&API.onShow(onAppShow)}catch(e){}}
else if(typeof document!=='undefined'){document.addEventListener('visibilitychange',()=>{if(document.hidden)onAppHide();else onAppShow()})}
// --- 새 버전 알림
if(API&&API.getUpdateManager){try{const um=API.getUpdateManager();um.onUpdateReady(()=>{API.showModal?API.showModal({title:L('새 버전','新版本'),content:L('새 버전이 준비됐습니다. 다시 시작할까요?','新版本已准备好，是否重启？'),success:r=>{if(r.confirm)um.applyUpdate()}}):um.applyUpdate()})}catch(e){}}
if(API){try{API.showShareMenu&&API.showShareMenu({withShareTicket:true});API.onShareAppMessage&&API.onShareAppMessage(()=>({title:L('DEAD RUSH: 마지막 신호 — 탑을 쌓아 살아남아라','末日尸潮：最后的信号——筑塔求生'),imageUrl:'res/cover_v8.jpg'}))}catch(e){}}
// ---------------------------------------------------------------- battle state
let frame=0,last=0,sc='title',paused=false,speed=1,screenShake=0,hitStop=0,screenFlash=0,screenFlashCol='255,255,255';
let stageIdx=0,wave=0,wavesTotal=5,waveT=0,nextSpawn=0,toSpawn=0,pending=0,breakT=0,waveDone=false,stageDone=false;
let kills=0,coins=0,energy=0,hp=100,maxHP=100,signal=0,damageTaken=0,eliteKills=0,combo=0,comboT=0;
let zs=[],floaters=[],flash=[0,0,0,0,0],cooldown=[0,0,0,0,0],levels=[0,0,0,0,0],weaponSlot=-1;
let banner='',bannerT=0,critPulse=0,skillCD=[0,0,0],events=[],beams=[],delays=[],towerHitT=0,evSeq=0,waveCardT=0;
let runners=[],crates=[],drops=[],loot={mat:0,parts:0},floorsBuilt=0,buildAnim=null,crowd=1,crowdT=1,blackoutT=0,lightningT=8,cine=null,dialog=null;
let revived=false,doubled=false,rerolled=false,perkPick=null,runMods=null,feverG=0,feverT=0,barrels=[],endless=false,civSaved=0,barrelHint=0;
let clearInfo=null,failInfo=null,clearT=0,baseTab=0,retSc='title',endT=0,hudPulse={scrap:0,energy:0,mat:0,parts:0},mapPulse=-1,tutorialT=0,upPromptShown=false;

// ---------------------------------------------------------------- object pools
function makePool(n){const a=[];for(let i=0;i<n;i++)a.push({});return {a,n:0}}
const parts=makePool(820),projs=makePool(140),decals=makePool(30),corpses=makePool(48);
function take(p,limit){if(p.n>=Math.min(limit||p.a.length,p.a.length))return null;return p.a[p.n++]}
function drop(p,i){const t=p.a[i];p.a[i]=p.a[p.n-1];p.a[p.n-1]=t;p.n--}
function partLimit(){return qualityLow?230:820}
const OUT='#120f18';
const rand=(a,b)=>a+Math.random()*(b-a);const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function emit(type,x,y,vx,vy,life,size,col,o){const p=take(parts,partLimit());if(!p)return null;p.type=type;p.x=x;p.y=y;p.vx=vx;p.vy=vy;p.life=life;p.max=life;p.size=size;p.col=col;
 p.grow=o&&o.grow||0;p.g=o&&o.g||0;p.gy=o&&o.gy||0;p.drag=o&&o.drag||0;p.rot=o&&o.rot!==undefined?o.rot:rand(0,TAU);p.vr=o&&o.vr||0;p.ry=o&&o.ry||.42;p.a=o&&o.a!==undefined?o.a:1;return p}
const Q=n=>qualityLow?Math.max(1,Math.round(n*.45)):n;
function sparks(x,y,col,n,sp=380,dir=null,spread=PI){for(let i=0;i<Q(n);i++){const a=dir===null?rand(0,TAU):dir+rand(-spread,spread),v=rand(sp*.35,sp);emit('spark',x,y,Math.cos(a)*v,Math.sin(a)*v,rand(.12,.3),rand(1.5,3),col,{g:600,drag:3})}}
function puff(x,y,n,size=18,life=.9,dust=false,vy=-30){for(let i=0;i<Q(n);i++)emit(dust?'dust':'smoke',x+rand(-size*.5,size*.5),y+rand(-size*.3,size*.3),rand(-40,40),vy+rand(-25,10),rand(life*.6,life),rand(size*.6,size),'',{grow:size*1.1,drag:1.6})}
function glowAt(x,y,r,k,life=.12,grow=0){return emit('glow',x,y,0,0,life,r,k,{grow})}
function decal(type,x,y,size,life){let d=take(decals);if(!d){d=decals.a[0];}d.type=type;d.x=x;d.y=y;d.size=size;d.life=life;d.max=life;d.seed=Math.random()*99}
function after(t,fn){delays.push({t,fn})}

// ---------------------------------------------------------------- drawing helpers
function pathRect(x,y,w,h,r=12){r=Math.min(r,w/2,h/2);g.beginPath();g.moveTo(x+r,y);g.lineTo(x+w-r,y);g.quadraticCurveTo(x+w,y,x+w,y+r);g.lineTo(x+w,y+h-r);g.quadraticCurveTo(x+w,y+h,x+w-r,y+h);g.lineTo(x+r,y+h);g.quadraticCurveTo(x,y+h,x,y+h-r);g.lineTo(x,y+r);g.quadraticCurveTo(x,y,x+r,y);g.closePath()}
function panel(x,y,w,h,fill='#111827e8',stroke='#957b58',r=14){g.fillStyle=fill;pathRect(x,y,w,h,r);g.fill();g.strokeStyle=stroke;g.lineWidth=3;g.stroke()}
function txt(s,x,y,n=24,color='#fff',align='left',stroke=true){g.font=`900 ${n}px system-ui,sans-serif`;g.textAlign=align;g.textBaseline='middle';if(stroke){g.lineWidth=Math.max(3,n*.18);g.strokeStyle='#13111b';g.lineJoin='round';g.strokeText(s,x,y)}g.fillStyle=color;g.fillText(s,x,y)}
function paragraphs(value,x,y,size,color,maxWidth=630,lineH=42){const lines=value.split('\n');let at=0;for(const raw of lines){let current='';for(const char of raw){if((current+char).length*size*.89>maxWidth&&current){txt(current,x,y+at*lineH,size,color,'left',false);at++;current=''}current+=char}txt(current,x,y+at*lineH,size,color,'left',false);at++}return at}
function img(name,x,y,w,h,alpha=1){const im=imgs[name];if(!im)return;g.save();g.globalAlpha=alpha;g.drawImage(im,x,y,w,h);g.restore()}
function grad(x,y,x2,y2,stops){let z=g.createLinearGradient(x,y,x2,y2);for(let [p,cc] of stops)z.addColorStop(p,cc);return z}
function noise(seed){let x=Math.sin(seed*4327.9)*43758.5453;return x-Math.floor(x)}
function rr(x,y,w,h,r,fill,stroke,lw=2){g.fillStyle=fill;pathRect(x,y,w,h,r);g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke()}}
function ellipse(x,y,rx,ry,color,stroke='#171722',lw=4){g.fillStyle=color;g.beginPath();g.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);g.fill();if(stroke!=='transparent'&&lw){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke()}}
let bannerSc='';function message(t,d=2){banner=t;bannerT=d;bannerSc=sc}
function nine(key,x,y,w,h,b=22){const im=imgs[key];if(!im)return false;const iw=im.width,ih=im.height,bw=Math.min(b,w/2),bh=Math.min(b,h/2),sx=[0,b,iw-b,iw],dx=[x,x+bw,x+w-bw,x+w],sy=[0,b,ih-b,ih],dy=[y,y+bh,y+h-bh,y+h];
 for(let r=0;r<3;r++)for(let c2=0;c2<3;c2++){const sw=sx[c2+1]-sx[c2],sh=sy[r+1]-sy[r],ww=dx[c2+1]-dx[c2],hh=dy[r+1]-dy[r];if(sw>0&&sh>0&&ww>0&&hh>0)g.drawImage(im,sx[c2],sy[r],sw,sh,dx[c2],dy[r],ww,hh)}return true}
function plate(x,y,w,h,fill,stroke){const im=imgs.ui_hud;if(im)g.drawImage(im,x-6,y-4,w+12,h+8);else panel(x,y,w,h,fill,stroke)}
function inked(fill,lw=3){g.fillStyle=fill;g.fill();g.strokeStyle=OUT;g.lineWidth=lw;g.lineJoin='round';g.stroke()}
function box(x,y,w,h,r,fill,lw=3){pathRect(x,y,w,h,r);inked(fill,lw)}
function poly(pts,fill,lw=3){g.beginPath();g.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)g.lineTo(pts[i],pts[i+1]);g.closePath();inked(fill,lw)}
function vg(y0,y1,a,b,cc){return grad(0,y0,0,y1,cc?[[0,a],[.45,b],[1,cc]]:[[0,a],[1,b]])}
function drawGlow(x,y,r,k,a=1){const s=glow[k];if(!s||r<=0)return;g.globalAlpha=a;g.drawImage(s,x-r,y-r,r*2,r*2)}
function rivets(list){g.fillStyle='#c9cdd3';for(let i=0;i<list.length;i+=2){g.beginPath();g.arc(list[i],list[i+1],1.6,0,TAU);g.fill()}}
function bags(x,y,cols,rows,bw=21,bh=12){for(let r=0;r<rows;r++)for(let k=0;k<cols-(r%2);k++){const bx=x+k*bw*.92+(r%2)*bw*.46,by=y-r*bh*.78;pathRect(bx,by,bw,bh,5);inked(vg(by,by+bh,'#cdb27b','#9c8155','#6d5838'),2.4);g.strokeStyle='#5d4a30';g.lineWidth=1.2;g.beginPath();g.moveTo(bx+bw*.5,by+2);g.lineTo(bx+bw*.5,by+bh-2);g.stroke()}}
function hazard(x,y,w,h){g.save();pathRect(x,y,w,h,2);g.clip();g.fillStyle='#e6b62e';g.fillRect(x,y,w,h);g.fillStyle='#2a2522';for(let i=-h;i<w;i+=10){g.beginPath();g.moveTo(x+i,y+h);g.lineTo(x+i+5,y+h);g.lineTo(x+i+5+h,y);g.lineTo(x+i+h,y);g.fill()}g.restore();pathRect(x,y,w,h,2);g.strokeStyle=OUT;g.lineWidth=2;g.stroke()}
// ---------------------------------------------------------------- 아이콘 (자원·버튼, 벡터)
function iconNut(x,y,r){g.save();g.translate(x,y);g.beginPath();for(let k=0;k<6;k++){const a=k/6*TAU+PI/6;k?g.lineTo(Math.cos(a)*r,Math.sin(a)*r):g.moveTo(Math.cos(a)*r,Math.sin(a)*r)}g.closePath();inked(vg(-r,r,'#ffe08a','#d39a2c','#8a5a14'),Math.max(1.5,r*.18));g.beginPath();g.arc(0,0,r*.42,0,TAU);g.fillStyle='#3a2a14';g.fill();g.restore()}
function iconBeam(x,y,r){g.save();g.translate(x,y);g.rotate(-.35);box(-r*1.1,-r*.75,r*2.2,r*.4,r*.12,vg(-r,0,'#d9dee6','#8d96a3'),Math.max(1.4,r*.16));box(-r*.22,-r*.5,r*.44,r,r*.1,'#7d8692',Math.max(1.4,r*.16));box(-r*1.1,r*.35,r*2.2,r*.4,r*.12,vg(0,r,'#c3c9d2','#6f7884'),Math.max(1.4,r*.16));g.fillStyle='#e6a63a';g.fillRect(-r*.9,-r*.68,r*.5,r*.26);g.restore()}
function iconGear(x,y,r,col){g.save();g.translate(x,y);g.beginPath();const n=8;for(let k=0;k<n*2;k++){const a=k/(n*2)*TAU,rr2=k%2?r*.78:r;g.lineTo(Math.cos(a)*rr2,Math.sin(a)*rr2)}g.closePath();inked(col||vg(-r,r,'#bfe2ff','#5f8fb8','#2e4a66'),Math.max(1.4,r*.16));g.beginPath();g.arc(0,0,r*.35,0,TAU);g.fillStyle='#1a2230';g.fill();g.restore()}
function iconCell(x,y,r){g.save();g.translate(x,y);box(-r*.55,-r*.85,r*1.1,r*1.7,r*.2,vg(-r,r,'#b8ffcf','#3fcf7a','#1d7a44'),Math.max(1.4,r*.16));box(-r*.22,-r*1.05,r*.44,r*.24,r*.06,'#c9cdd3',1.2);poly([r*.1,-r*.55,-r*.25,r*.08,r*.02,r*.08,-r*.1,r*.6,r*.28,-r*.1,0,-r*.1],'#fff8c8',1);g.restore()}
function iconBolt(x,y,r){g.save();g.translate(x,y);poly([r*.25,-r,-r*.55,r*.15,-r*.05,r*.15,-r*.3,r,r*.6,-r*.25,r*.08,-r*.25],vg(-r,r,'#fffbd0','#ffd84a','#e0901a'),Math.max(1.4,r*.14));g.restore()}
function iconLock(x,y,r){g.save();g.translate(x,y);g.strokeStyle=OUT;g.lineWidth=r*.5;g.beginPath();g.arc(0,-r*.3,r*.55,PI,0);g.stroke();g.strokeStyle='#c9cdd3';g.lineWidth=r*.26;g.stroke();box(-r*.8,-r*.3,r*1.6,r*1.2,r*.2,vg(-r*.3,r,'#ffd36a','#c8901c'),Math.max(1.4,r*.14));g.fillStyle='#3a2a14';g.beginPath();g.arc(0,r*.2,r*.18,0,TAU);g.fill();g.restore()}
function iconStar(x,y,r,on){g.save();g.translate(x,y);g.beginPath();for(let k=0;k<10;k++){const a=-PI/2+k*PI/5,rr2=k%2?r*.45:r;g.lineTo(Math.cos(a)*rr2,Math.sin(a)*rr2)}g.closePath();inked(on?vg(-r,r,'#fff6b0','#ffcc33','#d08a10'):'#3a3e4a',Math.max(1.4,r*.14));g.restore()}
function iconCross(x,y,r){g.save();g.translate(x,y);box(-r,-r*.8,r*2,r*1.6,r*.25,vg(-r,r,'#ffffff','#d9dde4'),Math.max(1.4,r*.14));g.fillStyle='#e0402e';g.fillRect(-r*.2,-r*.55,r*.4,r*1.1);g.fillRect(-r*.55,-r*.2,r*1.1,r*.4);g.restore()}
function iconBomb(x,y,r){g.save();g.translate(x,y);g.rotate(.5);g.beginPath();g.ellipse(0,0,r*.5,r*.85,0,0,TAU);inked(vg(-r,r,'#7c8594','#3a3f4a'),Math.max(1.4,r*.14));poly([-r*.5,-r*.7,r*.5,-r*.7,r*.35,-r*1.1,-r*.35,-r*1.1],'#4a505c',1.4);g.fillStyle='#e6b62e';g.fillRect(-r*.5,r*.05,r,r*.18);g.restore()}
function iconFlake(x,y,r){g.save();g.translate(x,y);g.lineCap='round';for(const [col,w] of [[OUT,r*.34],['#bff4ff',r*.16]]){g.strokeStyle=col;g.lineWidth=w;for(let k=0;k<3;k++){g.save();g.rotate(k*PI/3);g.beginPath();g.moveTo(0,-r);g.lineTo(0,r);g.moveTo(-r*.3,-r*.7);g.lineTo(0,-r*.45);g.lineTo(r*.3,-r*.7);g.moveTo(-r*.3,r*.7);g.lineTo(0,r*.45);g.lineTo(r*.3,r*.7);g.stroke();g.restore()}}g.restore()}
function iconPlane(x,y,r){g.save();g.translate(x,y);g.scale(r/105,r/105);drawBomber(0,0);g.restore()}
function costTag(x,y,icon,val,col,size=15){const s=String(val);g.font=`900 ${size}px system-ui,sans-serif`;const w=g.measureText(s).width+size*1.3;const x0=x-w/2;icon(x0+size*.45,y,size*.5);txt(s,x0+size*1.05,y,size,col,'left',true)}
function iconBtn(x,y,s,kind){const st=imgs.ui_skill;if(st)g.drawImage(st,x,y,s,s);else rr(x,y,s,s,14,'#24324a','#9fb4e8',3);const cx=x+s/2,cy=y+s/2,u=s/84;
 if(kind==='pause'){box(cx-14*u,cy-15*u,10*u,30*u,3,'#f4f6ff',2.5);box(cx+4*u,cy-15*u,10*u,30*u,3,'#f4f6ff',2.5)}else if(kind==='play'){poly([cx-9*u,cy-16*u,cx+16*u,cy,cx-9*u,cy+16*u],'#f4f6ff',2.5)}}
function button(x,y,w,h,label,style,size){const C={gold:['#7a4a26','#ffcc6a','#fff4dc'],blue:['#1f3550','#8fc4ff','#eaf4ff'],green:['#1f4a32','#7fe0a0','#eafff0'],gray:['#2a2e38','#6a7280','#a9b3c2'],red:['#6a2228','#ff7a7a','#fff0f0']}[style||'gold'];
 g.save();g.fillStyle='#00000055';pathRect(x+3,y+5,w,h,14);g.fill();g.fillStyle=grad(0,y,0,y+h,[[0,C[0]],[1,'#0e1018']]);pathRect(x,y,w,h,14);g.fill();g.strokeStyle=C[1];g.lineWidth=3;g.stroke();g.strokeStyle='#ffffff22';g.lineWidth=2;g.beginPath();g.moveTo(x+14,y+5);g.lineTo(x+w-14,y+5);g.stroke();g.restore();
 txt(label,x+w/2,y+h/2+1,size||Math.min(28,h*.42),C[2],'center')}
const hit_=(x,y,bx,by,bw,bh)=>x>=bx&&x<=bx+bw&&y>=by&&y<=by+bh;
function faceImg(im,cx,cy,h){const w=h*im.width/im.height;g.drawImage(im,cx-w*.6,cy-h*.47,w,h)}
function portrait(who,x,y,s,alpha=1){const sv=SURV[who];if(!sv)return;g.save();g.globalAlpha=alpha;const fr=imgs.ui_card;if(fr)g.drawImage(fr,x-s*.06,y-s*.06,s*1.12,s*1.14);const im=imgs[sv.img];g.save();pathRect(x+s*.07,y+s*.07,s*.86,s*.86,s*.1);g.clip();g.fillStyle=grad(0,y,0,y+s,[[0,'#3a4a62'],[1,'#141a26']]);g.fillRect(x,y,s,s);if(im&&sv.img.indexOf('p_')===0&&SURV[who].from<99)faceImg(im,x+s*.5,y+s*.55,s*1.05);g.restore();g.strokeStyle='#e6c27a';g.lineWidth=2;pathRect(x+s*.07,y+s*.07,s*.86,s*.86,s*.1);g.stroke();g.restore()}
function face(who,x,y,r){const sv=SURV[who];const im=imgs[sv.img];g.save();g.beginPath();g.arc(x,y,r,0,TAU);g.clip();g.fillStyle='#2a3448';g.fillRect(x-r,y-r,r*2,r*2);if(im)faceImg(im,x,y+r*.15,r*2.9);g.restore();g.beginPath();g.arc(x,y,r,0,TAU);g.strokeStyle='#e6c27a';g.lineWidth=2.5;g.stroke()}

// ---------------------------------------------------------------- turret art: 아트팩 스프라이트(받침 고정 + 포신 회전)
function drawOperator(i){const m=MOUNTS[i];if(m.floor<0||m.floor>floorsBuilt||levels[i]<1)return;const who=weapon[i].crew;if(!crewNow().includes(who))return;const sp=imgs['s_'+who];if(!sp)return;const h=66,w=h*sp.width/sp.height;const fl=frame*2+i;g.save();g.globalAlpha=.35;g.fillStyle='#000';g.beginPath();g.ellipse(m.fx+64,m.fy+3,w*.38,5,0,0,TAU);g.fill();g.restore();g.drawImage(sp,m.fx+64-w/2,m.fy+4-h+Math.sin(fl)*1.2,w,h)}
function drawTurret(i){const m=MOUNTS[i],t=tur[i],a=m.art,bi=imgs[m.key+'_base'],br=imgs[m.key+'_barrel'];
 if(m.floor<0||m.floor>floorsBuilt)return;
 if(levels[i]<1){// 장착됐지만 미설치: 설치 안내 표식
  const p=.5+.5*Math.sin(frame*5),can=coins>=costOf(i);g.save();g.globalAlpha=.55+.45*p;g.beginPath();g.arc(m.fx,m.fy-18,15+p*3,0,TAU);g.fillStyle=can?'#2f8a4ecc':'#2a2e38cc';g.fill();g.strokeStyle=can?'#9fffbf':'#8b98a8';g.lineWidth=2.5;g.stroke();g.restore();txt('+',m.fx,m.fy-19,24,'#fff','center');return}
 if(bi)g.drawImage(bi,m.x-a.post[0]*m.s,m.y-a.post[1]*m.s,bi.width*m.s,bi.height*m.s);
 g.save();g.translate(m.x,m.y);g.rotate(t.ang-a.inh);const rc=t.recoil+(i===0&&t.fireT<.15?rand(-1,1):0);g.translate(-Math.cos(a.inh)*rc,-Math.sin(a.inh)*rc);
 if(br)g.drawImage(br,-a.piv[0]*m.s,-a.piv[1]*m.s,br.width*m.s,br.height*m.s);
 g.restore();
 const lvl=levels[i];if(lvl>1){g.fillStyle='#ffd65a';g.strokeStyle=OUT;g.lineWidth=1.2;for(let k=0;k<lvl-1;k++){g.beginPath();g.arc(m.fx-16+k*8,m.fy+4,3,0,TAU);g.fill();g.stroke()}}
 // 대기·충전 발광 (실제 총구 좌표)
 const [qx,qy]=muzzle(i);g.save();g.globalCompositeOperation='lighter';
 if(i===1)drawGlow(qx,qy,10+t.charge*16+Math.sin(frame*25)*2,'b',.45+t.charge*.5);
 if(i===3){const f=.7+Math.sin(frame*31)*.15+Math.random()*.15;drawGlow(qx,qy,7*f,'o',.95);drawGlow(qx,qy,3.5*f,'w',.9)}
 if(i===4)drawGlow(qx,qy,8+Math.sin(frame*4)*2,'c',.45);
 g.restore();
 // 총구 화염 (실제 발사 직후에만, 실제 총구 좌표)
 if(flash[i]>0){const [mx,my]=muzzle(i,4),k=flash[i]/.1;g.save();g.globalCompositeOperation='lighter';
  if(i===0){g.save();g.translate(mx,my);g.rotate(t.ang);const L=36+Math.random()*20;g.globalAlpha=Math.min(1,k);g.fillStyle='#fff3b8';g.beginPath();g.moveTo(-2,0);g.lineTo(L*.4,-9);g.lineTo(L,0);g.lineTo(L*.4,9);g.closePath();g.fill();g.fillStyle='#ffa43a';g.beginPath();g.moveTo(0,-4);g.lineTo(L*.7,-3);g.lineTo(L*.55,0);g.lineTo(L*.7,3);g.lineTo(0,4);g.fill();g.restore();drawGlow(mx,my,44,'y',k*.9);drawGlow(mx,my,16,'w',k)}
  else if(i===2){drawGlow(mx,my,46,'o',k);drawGlow(mx,my,22,'w',k)}
  else if(i===1){drawGlow(mx,my,40,'b',k);drawGlow(mx,my,16,'w',k)}
  else if(i===4){drawGlow(mx,my,22,'c',k*.8)}
  g.restore()}}

// ---------------------------------------------------------------- 스테이지 흐름
const STAGE_K=[1,1.2,1,1.3,1.25,1,1.3,1.05,1.05,1.12,1,1.24].concat([1.9,1.85,2.35,2.45,2.55,2.65,2.75,2.95,2.9,3.0,3.0,3.25].map(v=>+(v*(v>2.3?.96:1.03)).toFixed(3)));
const DIFF={hpL:.6,hpQ:.035,cntQ:.05,startS:30,hpS:.23,hpW:.06,cntB:6,cntS:1.5,cntW:2.4,gap:1,upA:.8,upB:.7,lvD:.3,lvR:.08,tier:.12,zdmg:.7,scrap:1};
function costOf(i){return levels[i]<1?weapon[i].cost:Math.round(weapon[i].cost*(DIFF.upA+DIFF.upB*levels[i]))}
function crewNow(){return CREW_ORDER.filter(k=>save.cleared>=SURV[k].from||(k==='rena'&&stageIdx>=3)||(k==='sera'&&stageIdx>=9)||(k==='doyun'&&stageIdx>=11))}
function autoEquip(){for(let f=1;f<=save.floors;f++){if(save.equip[f]>=0)continue;const wi=weapon.findIndex(w=>w.theme===f);if(wi>=0&&owned(wi)&&save.equip.indexOf(wi)<0)save.equip[f]=wi}
 if(save.equip[0]<0&&save.equip.indexOf(0)<0)save.equip[0]=0}
function SD(){return endless?ENDLESS:STAGES[stageIdx|0]}
function effS(){return endless?Math.min(30,4+wave*.8):stageIdx}
function theme(){return endless?CH[Math.floor(Math.max(0,wave-1)/5)%6].theme:CH[STAGES[stageIdx|0].ch].theme}
function skillOpen(i){return stageIdx>=SKILL_UNLOCK[i]}
function startStage(i){track('stage_start',{stage:i==='endless'?'endless':i+1});revived=false;doubled=false;rerolled=false;endless=i==='endless';stageIdx=endless?LAST:i;const S=SD();wavesTotal=S.waves;perkPick=null;runMods={dmg:[1,1,1,1,1],rate:1,skill:1,scrapMul:1,ereg:1,fever:1};feverG=0;feverT=0;barrels=[];civSaved=0;wave=0;waveT=0;toSpawn=0;nextSpawn=0;pending=0;breakT=0;waveDone=true;stageDone=false;kills=0;eliteKills=0;damageTaken=0;combo=0;
 coins=60+(endless?8:stageIdx)*DIFF.startS+save.sup.scrap*25;energy=55+save.sup.energy*10;maxHP=100+save.armor*15;hp=maxHP;signal=0;
 loot={mat:0,parts:0};zs=[];floaters=[];runners=[];crates=[];drops=[];events=[];beams=[];delays=[];parts.n=0;projs.n=0;decals.n=0;corpses.n=0;
 flash=[0,0,0,0,0];cooldown=[0,0,0,0,0];levels=[0,0,0,0,0];skillCD=[0,0,0];blackoutT=0;cine=null;crowd=1;crowdT=1;lightningT=6;
 floorsBuilt=save.floors;autoEquip();setMounts();if(save.equip[0]>=0)levels[save.equip[0]]=1;if(save.prep>0)for(let f=0;f<=save.floors;f++){const wi=save.equip[f];if(wi>=0)levels[wi]=Math.max(levels[wi],save.prep)}
 tur.forEach((t,k)=>{t.ang=MOUNTS[k].rest;t.recoil=0;t.flameT=0;t.fireT=9});
 sc='battle';paused=false;speed=1;weaponSlot=-1;bannerT=0;tutorialT=i===0?40:0;if(endless){coins+=40}
 dialog={lines:S.brief,i:0,t:0,done:()=>{waveDone=false;startWave()}}}
function startWave(){wave++;if(!endless&&stageIdx===2&&wave===2)tip('perk',[['2웨이브마다 「보급 선택」이 나와요. 카드 1장을 골라 이번 판을 강화하세요.','每2波会出现「补给选择」，选1张卡片强化本局。']]);if(!endless&&stageIdx===1&&wave===1)tip('skill',[['공습이 열렸어요! 전력(⚡)이 차면 왼쪽 아래 공습을 눌러 보세요.','空袭已解锁！电力(⚡)充满后点击左下空袭。']]);waveT=0;waveDone=false;const s=effS(),S=SD();const sC=Math.min(s,15)+Math.max(0,s-15)*.45;
 if(endless){S.ev=[];const pool=['horde','burrow','drop','supply','barrels','blackout','convoy','horde','barrels'];const n=1+(wave>5?1:0)+(wave>14?1:0);for(let k=0;k<n;k++)S.ev.push({w:wave,t:pool[Math.floor(Math.random()*pool.length)],at:2+k*3});if(wave%10===0)S.ev.push({w:wave,t:'boss',boss:Math.min(4,wave/10-1),at:3})}
 toSpawn=Math.round((DIFF.cntB+sC*DIFF.cntS+sC*sC*DIFF.cntQ+wave*DIFF.cntW+(wave===wavesTotal?5:0))*(S.cntMul||1)*(wave===1&&!endless?.8:1));nextSpawn=wave===1&&stageIdx===0&&!endless?.4:1.0;waveCardT=2.4;
 for(const ev of S.ev)if(ev.w===wave){pending++;after(ev.at||3,()=>{pending--;runEvent(ev)})}}
function laterSpawn(t,fn){pending++;after(t,()=>{pending--;if(!stageDone)fn()})}
function pickType(){const p=SD().pool;return POOLMAP[p[Math.floor(Math.random()*p.length)]]}
function bridgeY(x){return 362-(x-207)*.443}
// 탑이 높아질수록 화면 속 좀비 비율도 키움 (지하 벙커만 있을 때 0.95 → 옥상까지 1.26)
const ZFLOOR=[.95,1.05,1.13,1.2,1.26];
function spawn(type,mode,o){o=o||{};const s=effS();type=type||pickType();
 const lane=o.lane!==undefined?o.lane:Math.floor(rand(0,4));
 const scale=(lane===0?.58:lane===1?.7:lane===2?.82:.92)*ZFLOOR[Math.min(4,floorsBuilt)]*(type==='brute'?1.25:type==='boss'?2.25:type==='shield'?1.1:type==='hound'?.78:1);
 const sq=Math.min(s,15);const hm=(1+s*DIFF.hpS+sq*sq*DIFF.hpQ+Math.max(0,s-15)*DIFF.hpL+wave*DIFF.hpW)*(endless?1.35:STAGE_K[s]),sm=1+s*.012+wave*.008;const hp0=ZBASE[type]*hm,sh=type==='shield'?52*hm:0;
 const y=o.y!==undefined?o.y:631+lane*72+rand(-18,18);
 const z={x:o.x!==undefined?o.x:rand(-205,-35),lane,y,type,hp:hp0,mhp:hp0,sp:ZSPD[type]*sm*(o.spd||1),scale,phase:rand(0,7),hurt:0,slow:0,stun:0,burn:0,burnClock:0,shield:sh,shieldMax:sh,charge:rand(.3,1.2),attackT:rand(1.8,3.2),marked:0,
  kbv:0,zh:0,zv:0,tilt:0,tiltV:0,flash:0,frozen:0,hitSlow:0,wind:0,squash:0,shieldShake:0,emberT:0,slamT:5,empId:0,frostId:0,seed:Math.random()*100,emerge:0,emergeMax:1,atk:.6};
 if(mode==='emerge'){z.emerge=z.emergeMax=.85}
 if(mode==='drop'){z.zh=-(y-bridgeY(z.x));z.zv=-80}
 if(o.boss!==undefined){const B=BOSSES[o.boss];z.scale=B.scale;z.hp=z.mhp=B.hp*(1+s*.05)*(endless?1+wave*.02:1);z.bossName=B.name;z.sp=34*(1+o.boss*.08);z.bossIdx=o.boss}
 zs.push(z);return z}
function mkRunner(who,x,y){return {who,x,y,sp:98,phase:rand(0,6),hp:3,hurtT:0,done:false,safe:false,lost:false,hurt:0}}
function runEvent(ev){const s=effS();if(stageDone)return;
 switch(ev.t){
 case 'escape':{['hanna','mio'].forEach((w,k)=>runners.push(mkRunner(w,-40-k*60,905+k*36)));for(let k=0;k<5;k++)laterSpawn(.5+k*.35,()=>spawn('runner','march',{x:-170-rand(0,60),lane:3,y:895+rand(0,50),spd:1.12}));message(L('엄호하라! 동료들이 벙커로 달려온다','掩护！同伴正冲向掩体'),2.2);break}
 case 'rescue':{runners.push(mkRunner(ev.who,-40,915));const n=3+Math.floor(s/3);for(let k=0;k<n;k++)laterSpawn(.6+k*.4,()=>spawn(k%3===2?'scout':'runner','march',{x:-170-rand(0,50),lane:3,y:890+rand(0,50),spd:1.08}));message(L('생존자 발견! ','发现幸存者！')+LL(SURV[ev.who].name)+L(' 엄호!',' 掩护！'),2.2);AudioFx.cue('siren',.5,0);break}
 case 'horde':{const n=Math.min(26,Math.round(14+s*1.1));message(L('⚠ 떼 습격! 대규모 무리 접근','⚠ 尸潮来袭！大批僵尸接近'),2.4);AudioFx.cue('siren',.8,0);crowdT=3.4;after(8,()=>crowdT=1);screenShake=shakeReduced?0:4;for(let k=0;k<n;k++)laterSpawn(1.4+k*.09,()=>spawn(Math.random()<.3?'scout':'runner','march',{x:-60-rand(0,150),spd:1.18}));break}
 case 'burrow':{const n=4+Math.floor(s/3);message(L('⚠ 지진! 땅속에서 좀비가 올라온다','⚠ 地震！僵尸从地下爬出'),2.4);AudioFx.cue('slam',1,0);AudioFx.cue('siren',.5,0);const TR={kind:'tremor',t:0,dur:1.6+n*.45,spots:[],nx:0};events.push(TR);for(let k=0;k<n;k++){const x=rand(150,470),lane=Math.floor(rand(0,4)),y=631+lane*72+rand(-10,10);TR.spots.push({x,y,at:1+k*.45});after(k*.45,()=>{decal('crack',x,y,46,4);puff(x,y,2,18,.6,true)});laterSpawn(1+k*.45,()=>{spawn(null,'emerge',{x,lane,y});puff(x,y,4,26,.8,true)})}break}
 case 'drop':{const n=4+Math.floor(s/3);message(L('고가도로에서 뛰어내린다! 머리 위 주의','从高架桥上跳下来了！注意头顶'),2);for(let k=0;k<n;k++)laterSpawn(.3+k*.35,()=>spawn(null,'drop',{x:rand(60,430)}));break}
 case 'supply':{crates.push({x:rand(140,460),y:110,ty:rand(700,900),t:0,landed:false,life:14,sway:rand(0,6)});message(L('보급 상자 투하! 터치해서 회수','补给箱空投！点击回收'),2);AudioFx.cue('missile',.4,0);break}
 case 'blackout':{blackoutT=14;message(L('정전! 총구 불빛에 의지하라','停电！依靠枪口火光'),2.2);AudioFx.cue('emp',.6,0);break}
 case 'barrels':{placeBarrels(3);message(L('폭발 드럼통 배치! 놈들이 모이면 터치','已布置爆炸油桶！尸群聚集时点击'),2.2);if(barrelHint<1)barrelHint=8;break}
 case 'convoy':{const who=['civ1','civ2','civ3'];for(let k=0;k<3;k++)runners.push(mkRunner(who[k],-40-k*70,900+k*28));const n=4+Math.floor(s/3);for(let k=0;k<n;k++)laterSpawn(.8+k*.35,()=>spawn(k%3===2?'scout':k%4===3?'boomer':'runner','march',{x:-180-rand(0,60),lane:3,y:890+rand(0,50),spd:1.1}));message(L('피난민 무리 접근! 엄호하라','难民接近！掩护他们'),2.2);AudioFx.cue('siren',.5,0);break}
 case 'boss':{vib('heavy');const z=spawn('boss','march',{boss:ev.boss,lane:2,x:-140});cine={t:0,name:z.bossName};AudioFx.cue('slam',1,0);screenShake=shakeReduced?0:10;break}}}
// ---------------------------------------------------------------- 드롭 아이템 (자동 회수)
const DROP_TARGET={scrap:[455,57],energy:[612,57],mat:[58,168],parts:[178,168]};
function spawnDrop(k,v,x,y,gy){if(drops.length>70){const o=drops.find(d=>d.k==='scrap'&&d.st===0);if(o&&k==='scrap'){o.v+=v;return}}drops.push({k,v,x,y,vx:rand(-90,60),vy:rand(-330,-200),gy:gy||y+30,t:0,st:0,fx:0,fy:0,rot:rand(0,6)})}
function dropLoot(z){const [bx,by]=bodyPt(z,.5),el=ELITE[z.type],boss=z.type==='boss';
 spawnDrop('scrap',Math.max(1,Math.round(ZSCRAP[z.type]*DIFF.scrap*runMods.scrapMul*(1+effS()*.14))),bx,by,z.y);
 if(Math.random()<(boss?1:el?.13:.032))spawnDrop('mat',boss?10+z.bossIdx*5:el&&Math.random()<.4?2:1,bx,by,z.y);
 if(Math.random()<(boss?1:el?.12:.025))spawnDrop('parts',boss?8+z.bossIdx*4:1,bx,by,z.y);
 if(Math.random()<.035)spawnDrop('energy',8,bx,by,z.y)}
function collect(d){if(d.k==='scrap')coins+=d.v;else if(d.k==='energy')energy=clamp(energy+d.v,0,150);else loot[d.k==='mat'?'mat':'parts']+=d.v;hudPulse[d.k]=.25}
function drawDrop(d){const s=d.st===1?Math.max(.6,1-d.fx*.4):1;g.save();g.translate(d.x,d.y);g.scale(s,s);
 if(d.st===0){g.globalCompositeOperation='lighter';drawGlow(0,0,16,d.k==='scrap'?'y':d.k==='mat'?'o':d.k==='parts'?'b':'g',.45+.2*Math.sin(frame*8+d.rot));g.globalCompositeOperation='source-over'}
 if(d.k==='scrap')iconNut(0,0,8);else if(d.k==='mat')iconBeam(0,0,10);else if(d.k==='parts')iconGear(0,0,9);else iconCell(0,0,9);g.restore()}
function zDims(z){const key=z.bossIdx===4?'z_queen':z.type==='shield'&&z.shieldMax>0&&z.shield<=0?'z_shield_broken':ZKEY[z.type]||'z_runner',im=imgs[key];const heavy=z.type==='brute'||z.type==='boss';const bh=z.type==='hound'?92:heavy?154:z.type==='shield'?145:128;const h=bh*z.scale;return {key,im,h,w:im?h*(im.width/im.height):h*.8}}
function bodyPt(z,f=.5){const d=zDims(z);return [z.x+d.w*.06,z.y+z.zh-d.h*f]}
function number(v,x,y,col,big){if(floaters.length>=32)floaters.shift();floaters.push({x:x+rand(-8,8),y,val:v,life:.75,max:.75,col,big:!!big})}
function hit(z,dam,col,push=8,kind='bullet'){
 if(!z||z.hp<=0)return;
 const [bx,by]=bodyPt(z,.55);
 if(z.shield>0){const blocked=Math.min(z.shield,dam*.65);z.shield-=blocked;dam-=blocked;z.shieldShake=.16;
  const d=zDims(z);sparks(z.x+d.w*.28,by,'#fff2b0',kind==='bullet'?3:6,320,PI,1.1);AudioFx.cue('clang',.5,.09);
  if(z.shield<=0){// 방패 파괴
   for(let i=0;i<Q(9);i++)emit('debris',z.x+d.w*.28,by+rand(-d.h*.3,d.h*.3),rand(-60,160),rand(-320,-120),rand(.7,1.1),rand(4,8),'#8a8f96',{g:900,gy:z.y,vr:rand(-12,12)});
   sparks(z.x+d.w*.28,by,'#ffe28a',12,420);number(T('방패 파괴'),z.x,by-d.h*.45,'#d8f2ff',true);AudioFx.cue('clang',1,0)}}
 z.hp-=dam;z.hurt=.18;z.flash=.09;z.flashA=Math.min(.42,.12+dam/160);z.lastKind=kind;
 z.kbv+=push*(MASS[z.type]||1)*10;
 z.tiltV-=(push>=30?7:2.4+push*.09)*(REACT[z.type]||1);
 if(z.type==='charger')z.hitSlow=.4;
 if(z.type==='spitter'&&z.wind>0&&(dam>=15||kind==='shock'||kind==='blast')){z.wind=0;z.attackT=1.6;number(T('저지!'),z.x,by-40,'#c9ff8a',true);sparks(bx,by-20,'#b7ff6a',6,220)}
 number(Math.ceil(dam),z.x+6,z.y+z.zh-z.scale*(z.type==='boss'?150:95),col,dam>=60);
 if(kind==='bullet'){sparks(bx,by,'#ffe7a0',3,300,PI,.9);if(Math.random()<.5)emit('goo',bx,by,rand(-60,40),rand(-160,-40),.5,rand(2,3.5),'#6f8a3a',{g:700,gy:z.y})}
 else if(kind==='shock'){sparks(bx,by,'#bff6ff',5,340)}
 else if(kind==='fire'){for(let i=0;i<Q(3);i++)emit('fire',bx+rand(-10,10),by+rand(-10,10),rand(-20,20),rand(-90,-40),rand(.25,.45),rand(6,11),'',{grow:10})}
 else if(kind==='water'){for(let i=0;i<Q(8);i++)emit('drop',bx+rand(-8,8),by+rand(-12,12),rand(-160,40),rand(-260,-60),rand(.35,.6),rand(2,4),'',{g:900,gy:z.y})}
 else if(kind==='ice'){for(let i=0;i<Q(5);i++)emit('ice',bx+rand(-12,12),by+rand(-14,14),rand(-80,80),rand(-200,-60),rand(.4,.7),rand(4,8),'',{g:700,gy:z.y,vr:rand(-10,10)})}
 if(z.hp<=0)kill(z,kind)}
function kill(z,kind){mission('kill');if(ELITE[z.type])mission('elite');
 dropLoot(z);
 if(z.type==='boomer')after(.06,()=>boomBlast(bodyPt(z,.4)[0],z.y,1));
 if(feverT<=0){feverG+=(ELITE[z.type]?7:3)*runMods.fever/(1+effS()*.06);if(feverG>=100)startFever()}
 kills++;combo++;comboT=2.2;
 if(ELITE[z.type])eliteKills++;
 if(combo%12===0){energy=clamp(energy+9,0,150);message(combo+T(' 연속 처치! 전력 +9'),1.1)}
 if(z.type==='boss'){message(LL(z.bossName)+L(' 격퇴!',' 被击败！'),2.6);screenShake=shakeReduced?0:14;hitStop=.18;screenFlash=.5;screenFlashCol='255,220,160'}
 const d=zDims(z),[bx,by]=bodyPt(z,.5);
 if(z.frozen>0||(kind==='ice'&&z.slow>0)){// 빙결 사망: 얼음 파편으로 산산조각
  for(let i=0;i<Q(14);i++)emit('ice',bx+rand(-d.w*.3,d.w*.3),by+rand(-d.h*.35,d.h*.35),rand(-200,200),rand(-380,-80),rand(.5,.9),rand(4,10),'',{g:900,gy:z.y+rand(-6,6),vr:rand(-14,14)});
  AudioFx.cue('shatter',.8,.06);return}
 if(save.mild&&z.type!=='boss'){puff(z.x,z.y-30*z.scale,3,26*z.scale+10,.6,false,-50);emit('burst',z.x,z.y-40*z.scale,0,0,.3,40*z.scale,'#d8e0ea')}
 const cp=save.mild&&z.type!=='boss'?null:take(corpses);if(cp){cp.key=d.key;cp.x=z.x;cp.y=z.y;cp.zh=z.zh;cp.w=d.w;cp.h=d.h;cp.t=0;cp.dur=z.type==='boss'?1.6:.85;cp.tint=z.burn>0||kind==='fire'?'char':kind==='shock'?'zap':null;
  cp.vx=kind==='blast'?-rand(90,170)*(MASS[z.type]||1):-rand(10,40);cp.vz=kind==='blast'?-rand(220,320)*(LIFT[z.type]||0):Math.min(0,z.zv);cp.rotDir=kind==='blast'?-1.9:-1.45;cp.broken=z.type==='shield'&&z.shieldMax>0&&z.shield<=0}
 emit('goo',bx,by,rand(-80,40),rand(-200,-80),.6,rand(3,5),'#5f7d35',{g:800,gy:z.y});
 if(z.burn>0||kind==='fire')puff(bx,by,3,20,1.1)}
// ---------------------------------------------------------------- weapons
function sortedTargets(){return zs.filter(z=>z.hp>0&&z.x<600&&z.x>-90).sort((a,b)=>b.x-a.x)}
function frontTarget(){let b=null;for(const z of zs)if(z.hp>0&&z.x<600&&z.x>-90&&(!b||z.x>b.x))b=z;return b}
function shellPlan(i,tx,ty){const m=MOUNTS[i],dur=.72,arc=170;const vx=(tx-m.x)/dur,vy=(ty-m.y)/dur-arc*PI/dur;return {dur,arc,ang:clamp(Math.atan2(vy,vx)<0?Math.atan2(vy,vx)+TAU:Math.atan2(vy,vx),m.min,m.max)}}
function aimAngle(i,z){const m=MOUNTS[i];if(i===2)return shellPlan(i,z.x,z.y).ang;const [bx,by]=bodyPt(z,.5);let a=Math.atan2(by-m.y,bx-m.x);if(a<0)a+=TAU;return clamp(a,m.min,m.max)}
function attack(wi){const we=weapon[wi],lev=levels[wi];if(lev<1)return;const targets=sortedTargets();if(!targets.length)return;
 const z=targets[0];if(600-z.x>we.range)return;
 const dmg=we.dam*(1+DIFF.lvD*(lev-1))*(1+DIFF.tier*save.tier[wi])*runMods.dmg[wi]*(feverT>0?1.2:1);const t=tur[wi];
 t.ang=aimAngle(wi,z);// 발사 순간 포신을 대상에 정렬 → 총구 좌표와 탄도 일치
 const [mx,my]=muzzle(wi);flash[wi]=.1;t.fireT=0;t.recoil=RECOIL[wi];critPulse=Math.min(.2,critPulse+.025);
 if(wi===0){AudioFx.cue('gun',.55,.07);const p=take(projs);if(p){p.type='bullet';p.x=mx;p.y=my;p.target=z;const [bx,by]=bodyPt(z,.55);p.tx=bx;p.ty=by;p.speed=2600;p.dmg=dmg;p.t=0;p.dur=1}
  t.spinV=38;const ca=t.ang-PI/2;emit('casing',MOUNTS[0].x+4,MOUNTS[0].y-4,Math.cos(ca)*rand(40,90)+rand(30,80),-rand(120,200),1.1,1,'',{g:900,gy:MOUNTS[0].y+36,vr:rand(-20,20)});
  if(!qualityLow)emit('smoke',mx,my,rand(-20,0),-20,.35,6,'',{grow:16,a:.5})}
 if(wi===1){AudioFx.cue('zap',.7);const near=targets.filter(q=>Math.abs(q.x-z.x)<170).slice(0,4);const pts=[[mx,my]];
  for(const [k,q] of near.entries()){const [bx,by]=bodyPt(q,.6);pts.push([bx,by]);hit(q,dmg*(k?.58:1),'#9ff3ff',14,'shock');q.stun=Math.max(q.stun,.34);glowAt(bx,by,34,'b',.18);glowAt(bx,by,14,'w',.12)}
  beams.push({type:'bolt',pts,life:.26,max:.26,seed:0,re:0});t.charge=0;screenFlash=Math.max(screenFlash,.06);screenFlashCol='150,220,255'}
 if(wi===2){AudioFx.cue('slam',.35,.1);const plan=shellPlan(2,z.x,z.y),p=take(projs);if(p){p.type='shell';p.sx=mx;p.sy=my;p.x=mx;p.y=my;p.tx=z.x;p.ty=z.y;p.t=0;p.dur=plan.dur;p.arc=plan.arc;p.dmg=dmg;p.trail=0}
  puff(mx,my,4,16,.8);puff(MOUNTS[2].x-10,MOUNTS[2].y+16,3,14,.6,true)}
 if(wi===3){AudioFx.cue('flame',.7,.3);const list=targets.filter(q=>q.x>260).slice(0,5);t.flameT=.62;t.flameTargets=list;
  after(.13,()=>{for(const q of list){if(q.hp>0){hit(q,dmg*.55,'#ff9656',5,'fire');q.burn=Math.max(q.burn,2.5)}}})}
 if(wi===4){AudioFx.cue('water',.75);const list=targets.filter(q=>Math.abs(q.x-z.x)<95).slice(0,3);beams.push({type:'jet',wi,target:z,targets:list,life:.42,max:.42,hitAt:.09,done:false,dmg,tx:bodyPt(z,.5)[0],ty:bodyPt(z,.5)[1]})}}
function explode(x,y,s=1,hard=true){
 glowAt(x,y-30*s,130*s,'o',.3,60);glowAt(x,y-28*s,60*s,'w',.14);
 emit('burst',x,y-34*s,0,0,.34,62*s,'',{rot:rand(0,TAU)});emit('burst',x+rand(-20,20)*s,y-58*s,0,-60,.3,40*s,'',{rot:rand(0,TAU)});
 for(let i=0;i<Q(14);i++){const a=rand(PI*1.05,PI*1.95),v=rand(60,260)*s;emit('fire',x+rand(-18,18)*s,y-24*s,Math.cos(a)*v,Math.sin(a)*v*.9-40,rand(.45,.85),rand(20,36)*s,'',{grow:26*s,drag:3})}
 for(let i=0;i<Q(10);i++)emit('debris',x,y-8,rand(-260,260)*s,rand(-520,-180)*s,rand(.7,1.2),rand(3,7)*s,i%3?'#5b5048':'#7d6a58',{g:1100,gy:y+rand(-14,14),vr:rand(-16,16)});
 sparks(x,y-24*s,'#ffd27a',14,560*s,-PI/2,1.3);
 puff(x,y-34*s,8,46*s,1.6,false,-55);puff(x,y-4,6,34*s,1.1,true,-15);
 emit('ring',x,y,0,0,.42,18*s,'#ffd28a',{grow:330*s,ry:.42});
 decal('scorch',x,y,70*s,9);
 if(hard){screenShake=shakeReduced?0:Math.max(screenShake,9*s);hitStop=Math.max(hitStop,.05);critPulse=.15}}
function knockUp(z,power=1){const l=LIFT[z.type]||0;if(l>0){z.zv=Math.min(z.zv,-(250+rand(0,90))*l*power)}}

// ---------------------------------------------------------------- 재미 요소: 아드레날린 · 폭발 드럼 · 자폭 좀비 · 보급 선택
function startFever(){feverG=0;feverT=7;message(L('아드레날린! 모든 무기 과열 사격','肾上腺素！全武器过载射击'),1.8);AudioFx.cue('power',1,0);screenFlash=.3;screenFlashCol='255,210,90'}
function placeBarrels(n){for(let k=0;k<n;k++){let x=0,lane=0,ok=false;for(let t=0;t<12&&!ok;t++){x=rand(170,470);lane=Math.floor(rand(0,4));ok=barrels.every(b=>Math.abs(b.x-x)>70||b.lane!==lane)}barrels.push({x,lane,y:631+lane*72+6,t:0,drop:-260})}}
function blastAt(x,y,rx,ry,dm,push){for(const z of zs)if(z.hp>0&&!(z.emerge>0)&&Math.abs(z.x-x)<rx&&Math.abs(z.y-y)<ry){hit(z,dm,'#ffb36a',push,'blast');knockUp(z,1.1)}
 for(const b of barrels)if(!b.gone&&Math.hypot(b.x-x,(b.y-y)*1.4)<rx*1.05)after(.12,()=>popBarrel(b))}
function popBarrel(b){if(b.gone)return;b.gone=true;vib('medium');mission('barrel');const s=effS();explode(b.x,b.y,1.3,true);AudioFx.cue('boom',1,.03);decal('scorch',b.x,b.y,110,12);
 for(let i=0;i<8;i++)emit('fire',b.x+rand(-40,40),b.y-rand(10,40),rand(-30,30),-rand(40,90),rand(.6,1.1),rand(14,22),'',{grow:10});blastAt(b.x,b.y,135,90,160*(1+s*.2),40)}
function boomBlast(x,y,k){const s=effS();explode(x,y,.95*k,true);AudioFx.cue('boom',.8,.03);blastAt(x,y,105,70,62*(1+s*.18),30)}
const PERKS=[
 {k:'dmg',name:['화력 개조','火力改装'],desc:['+35% 피해','+35% 伤害']},
 {k:'rate',name:['속사 개조','速射改装'],desc:['모든 무기 연사 +15%','所有武器射速 +15%']},
 {k:'repair',name:['긴급 수리','紧急修复'],desc:['탑 내구도 40% 회복','恢复40%塔耐久']},
 {k:'scrap',name:['고철 더미','废铁堆'],desc:['고철 즉시 획득','立即获得废铁']},
 {k:'scrapMul',name:['수집 장비','收集装备'],desc:['고철 획득 +30%','废铁获取 +30%']},
 {k:'skill',name:['무전 지원','无线电支援'],desc:['스킬 재충전 -30% · 즉시 준비','技能冷却 -30% · 立即就绪']},
 {k:'energy',name:['예비 배터리','备用电池'],desc:['전력 +60 · 충전 +30%','电力 +60 · 回复 +30%']},
 {k:'armor',name:['장갑판 보강','装甲加固'],desc:['최대 내구도 +30 · 회복','最大耐久 +30 · 并回复']},
 {k:'barrels',name:['드럼통 매설','埋设油桶'],desc:['폭발 드럼통 4개 배치','布置4个爆炸油桶']},
 {k:'fever',name:['아드레날린','肾上腺素'],desc:['즉시 발동 · 게이지 +40%','立即发动 · 积累 +40%']}];
function makePerks(){const inst=[0,1,2,3,4].filter(i=>levels[i]>0);let pool=PERKS.filter(p=>(p.k!=='dmg'||inst.length)&&(p.k!=='repair'||hp<maxHP*.85)&&(p.k!=='skill'||skillOpen(0)));const out=[];
 while(out.length<3&&pool.length){const p=pool.splice(Math.floor(Math.random()*pool.length),1)[0];const o={k:p.k,name:p.name,desc:p.desc};if(p.k==='dmg'){o.w=inst[Math.floor(Math.random()*inst.length)]}if(p.k==='scrap')o.v=Math.round(50+effS()*16);out.push(o)}return {opts:out,t:0}}
function applyPerk(o){const k=o.k;if(k==='dmg')runMods.dmg[o.w]*=1.35;else if(k==='rate')runMods.rate*=1.15;else if(k==='repair')hp=Math.min(maxHP,hp+maxHP*.4);else if(k==='scrap')coins+=o.v;else if(k==='scrapMul')runMods.scrapMul*=1.3;
 else if(k==='skill'){runMods.skill*=.7;skillCD=[0,0,0]}else if(k==='energy'){energy=Math.min(150,energy+60);runMods.ereg*=1.3}else if(k==='armor'){maxHP+=30;hp+=30}else if(k==='barrels')placeBarrels(4);else if(k==='fever'){runMods.fever*=1.4;startFever()}
 perkPick=null;AudioFx.cue('power');message(LL(o.name)+(o.k==='dmg'?' · '+LL(weapon[o.w].name):''),1.4)}

// ---------------------------------------------------------------- 스킬: 0 공습(폭격기) · 1 EMP · 2 빙결
function airTargets(){const B=4+Math.floor(save.sup.air/2);const pool=zs.filter(z=>z.hp>0&&!(z.emerge>0)&&z.x>-30&&z.x<590);const pts=[],used=new Set();
 for(let k=0;k<B;k++){let best=null,bs=0;for(const z of pool){if(used.has(z))continue;let c=0;for(const q of pool)if(!used.has(q)&&Math.abs(q.x-z.x)<110&&Math.abs(q.y-z.y)<80)c+=q.type==='boss'?4:1;if(c>bs){bs=c;best=z}}
  if(!best)break;pts.push([clamp(best.x+20,40,565),best.y]);for(const q of pool)if(Math.abs(q.x-best.x)<110&&Math.abs(q.y-best.y)<80)used.add(q)}
 while(pts.length<B)pts.push([rand(120,540),631+Math.floor(rand(0,4))*72]);return pts.sort((a,b)=>b[0]-a[0]).map(p=>({x:p[0],y:p[1],dropped:false,hit:false}))}
function useSkill(i){if(sc!=='battle'||paused||dialog)return;if(!skillOpen(i)){message(L('아직 사용할 수 없다','尚未解锁'),.9);return}
 if(skillCD[i]>0){message(T('재충전 ')+Math.ceil(skillCD[i])+T('초'),.75);return}if(energy<SKILL_COST[i]){message(T('긴급 전력이 부족하다'),.9);return}
 energy-=SKILL_COST[i];skillCD[i]=SKILL_CD[i]*runMods.skill;if(i===0&&!save.tips.tut2){save.tips.tut2=1;track('tut_skill',{})}mission('skill');
 if(i===0){AudioFx.cue('siren',.6,0);events.push({kind:'bomber',t:0,dur:3.4,px:860,py:190,targets:airTargets()});message(L('폭격기 접근! 집결 지점 폭격','轰炸机接近！轰炸集结点'),1.6)}
 else if(i===1){AudioFx.cue('emp',1,0);events.push({kind:'emp',t:0,id:++evSeq,dur:1.7,released:false});message(T('EMP 충전… 방출!'),1.3)}
 else{AudioFx.cue('freeze',1,0);events.push({kind:'frost',t:0,id:++evSeq,dur:4.2});message(T('긴급 빙결! 냉기 확산'),1.3)}}
function empOrigin(){const cut=towerCut();return floorsBuilt>=4?ANT:{x:640,y:TOWER.y+cut*TS-150}}
function updateEvents(dt){for(const e of events){e.t+=dt;
 if(e.kind==='tremor'){const fade=Math.min(1,e.t/.3)*Math.min(1,(e.dur-e.t)/.5);if(!shakeReduced)screenShake=Math.max(screenShake,(3.5+2.5*Math.abs(Math.sin(e.t*9)))*fade);
  e.nx-=dt;if(e.nx<=0){e.nx=.4;AudioFx.cue('slam',.28*fade+.1,.3);towerHitT=Math.max(towerHitT,.12)}
  if(Math.random()<.5*fade)emit('debris',rand(20,730),rand(150,330),rand(-30,30),rand(40,120),1.1,rand(2,4),'#6b6058',{g:700,gy:rand(620,930),vr:rand(-8,8)});
  if(Math.random()<.35*fade)emit('dust',rand(0,750),rand(620,930),rand(-30,30),-rand(10,40),.9,rand(14,26),'',{grow:18});
  if(Math.random()<dt*5*fade)decal('crack',rand(80,520),rand(640,900),rand(26,44),3);
  for(const z of zs)if(z.hp>0&&!(z.emerge>0))z.tiltV+=Math.sin(e.t*13+z.x*.05)*dt*14*fade;continue}
 if(e.kind==='bomber'){e.px=860-e.t*600;e.py=300+Math.sin(e.t*2.2)*6;for(const tg of e.targets){if(!tg.dropped&&e.px<=tg.x+30){tg.dropped=true;const p=take(projs);if(p){p.type='bomb';p.sx=e.px+10;p.sy=e.py+22;p.x=p.sx;p.y=p.sy;p.tx=tg.x;p.ty=tg.y;p.t=0;p.dur=.62;p.tg=tg;AudioFx.cue('missile',.45,.08)}else tg.hit=true}}}
 if(e.kind==='emp'){const O=empOrigin();if(e.t<.45){if(Math.random()<(qualityLow?.4:.9)){const a=rand(0,TAU),r=rand(60,140);emit('glow',O.x+Math.cos(a)*r,O.y+Math.sin(a)*r,-Math.cos(a)*r*2.6,-Math.sin(a)*r*2.6,.36,rand(5,9),'b')}}
  else{if(!e.released){e.released=true;screenFlash=.45;screenFlashCol='120,210,255';screenShake=shakeReduced?0:6;glowAt(600,740,220,'b',.35,200)}
   const r=(e.t-.45)*1150;e.r=r;const ry=Math.min(r*.5,210);for(const z of zs){if(z.hp<=0||z.empId===e.id)continue;if(((z.x-600)/r)**2+((z.y-740)/ry)**2<=1){z.empId=e.id;z.stun=Math.max(z.stun,2.4);hit(z,30*(1+effS()*.08),'#a1f5ff',5,'shock');const [bx,by]=bodyPt(z,.6);glowAt(bx,by,30,'b',.2)}}}}
 if(e.kind==='frost'){if(e.t<.25){if(Math.random()<.8)emit('smoke',590+rand(-20,20),760+rand(-80,80),rand(-120,-40),rand(-20,20),.7,22,'',{grow:30,a:.5})}
  else{const r=(e.t-.25)*950;e.r=r;const ry=Math.min(r*.5,200);for(const z of zs){if(z.hp<=0||z.frostId===e.id)continue;if(((z.x-600)/r)**2+((z.y-742)/ry)**2<=1){z.frostId=e.id;z.slow=Math.max(z.slow,6);z.frozen=Math.max(z.frozen,1.6);hit(z,16*(1+effS()*.08),'#bcf6ff',4,'ice');decal('ice',z.x,z.y,26*z.scale+12,1.3)}}}}}
 events=events.filter(e=>e.t<e.dur||(e.kind==='bomber'&&e.targets.some(t=>!t.hit)&&e.t<6))}
function drawBomber(x,y){const bm=imgs.o_bomber;if(bm){g.save();g.translate(x,y);const w=250,h=w*bm.height/bm.width;g.drawImage(bm,-w*.42,-h*.55,w,h);g.restore();return}
 g.save();g.translate(x,y);g.scale(1.15,1.15);
 poly([12,-6,44,-38,66,-38,46,-6],vg(-38,-6,'#5d6574','#3c424e'),2.5);
 for(const [ex,ey] of [[48,-26]]){box(ex-12,ey-6,24,12,5,'#4a505c',2)}
 g.beginPath();g.moveTo(-82,0);g.quadraticCurveTo(-78,-15,-52,-16);g.lineTo(72,-11);g.lineTo(96,-30);g.lineTo(106,-30);g.lineTo(100,-6);g.lineTo(102,7);g.lineTo(62,11);g.lineTo(-52,14);g.quadraticCurveTo(-78,13,-82,0);g.closePath();inked(vg(-16,14,'#88919f','#596170','#3a3f4a'),3);
 g.beginPath();g.moveTo(-74,-4);g.quadraticCurveTo(-68,-14,-50,-15);g.lineTo(-46,-4);g.closePath();inked('#9fd8ff',2);g.fillStyle='#ffffff99';g.fillRect(-64,-12,8,3);
 hazard(-24,4,34,6);g.fillStyle='#e8ecf2';g.beginPath();g.arc(28,-1,6,0,TAU);g.fill();g.fillStyle='#c0392b';g.beginPath();g.arc(28,-1,2.6,0,TAU);g.fill();
 poly([2,6,36,46,62,46,42,6],vg(6,46,'#727a89','#464c58'),2.5);
 for(const [ex,ey] of [[34,24]]){box(ex-12,ey-6,24,12,5,'#4a505c',2)}
 g.globalAlpha=.35;g.fillStyle='#d8dee8';for(const [ex,ey] of [[34,24],[48,-26]]){g.beginPath();g.ellipse(ex-14,ey,3,15,0,0,TAU);g.fill()}g.globalAlpha=1;
 g.restore()}
function drawEvents(top){for(const e of events){
 if(e.kind==='tremor'){if(!top){for(const sp of e.spots){const left=sp.at-e.t;if(left<=0||left>sp.at)continue;const u=1-left/sp.at,p=.5+.5*Math.sin(e.t*(10+u*16));g.save();g.globalAlpha=.25+.55*u;g.fillStyle=`rgba(255,${120-u*60|0},40,${.25+.25*p})`;g.beginPath();g.ellipse(sp.x,sp.y,24+u*26,8+u*9,0,0,TAU);g.fill();g.strokeStyle='#ffb050';g.lineWidth=2+u*2;g.beginPath();
    for(let k=0;k<5;k++){const a=k*1.26+sp.x;g.moveTo(sp.x,sp.y);g.lineTo(sp.x+Math.cos(a)*(18+u*34),sp.y+Math.sin(a)*(6+u*11))}g.stroke();if(u>.35)txt('!',sp.x,sp.y-26-p*4,22,'#ffdd88','center');g.restore()}}
  else{const fade=Math.min(1,e.t/.3)*Math.min(1,(e.dur-e.t)/.5);g.save();g.globalAlpha=.16*fade*(.6+.4*Math.sin(e.t*9));g.fillStyle='#3a2410';g.fillRect(0,0,750,1334);g.restore()}continue}
 if(e.kind==='bomber'){if(!top){for(const tg of e.targets){if(tg.hit)continue;const p=.5+.5*Math.sin(e.t*16);g.save();g.globalAlpha=.75;g.strokeStyle='#ff4a3a';g.lineWidth=3;g.setLineDash([8,6]);g.beginPath();g.ellipse(tg.x,tg.y,52+p*8,20+p*3,0,0,TAU);g.stroke();g.setLineDash([]);g.globalAlpha=.25+.2*p;g.fillStyle='#ff3a2a';g.beginPath();g.ellipse(tg.x,tg.y,48,18,0,0,TAU);g.fill();g.globalAlpha=.9;g.lineWidth=2.5;g.beginPath();g.moveTo(tg.x-16,tg.y);g.lineTo(tg.x+16,tg.y);g.moveTo(tg.x,tg.y-8);g.lineTo(tg.x,tg.y+8);g.stroke();g.restore()}
   if(e.px>-260&&e.px<900){g.save();g.globalAlpha=.22;g.fillStyle='#0a0810';g.beginPath();g.ellipse(e.px+40,880,110,16,0,0,TAU);g.fill();g.restore()}}
  else if(e.px>-260&&e.px<900){drawBomber(e.px,e.py);if(e.t<.9&&Math.sin(e.t*16)>0)txt(L('⚠ 폭격 경보','⚠ 轰炸警报'),375,520,30,'#ff6a5a','center')}}
 if(e.kind==='emp'){const O=empOrigin();g.save();g.globalCompositeOperation='lighter';
  if(top&&e.t<.5){const k=Math.min(1,e.t/.45);drawGlow(O.x,O.y,40+k*90,'b',.7+k*.3);drawGlow(O.x,O.y,14+k*30,'w',k);g.globalAlpha=.35*k;g.drawImage(glow.b,440,240,340,760);
   g.strokeStyle='#bff4ff';g.lineWidth=2.5;for(let b=0;b<3;b++){let x=O.x,y=O.y;g.globalAlpha=k*.9;g.beginPath();g.moveTo(x,y);for(let s2=0;s2<5;s2++){x+=rand(-26,10);y+=rand(30,70);g.lineTo(x,y)}g.stroke()}}
  if(!top&&e.r!==undefined&&e.r<1050){const r=e.r,ry=Math.min(r*.5,210),fade=Math.max(0,1-r/1050);const seed=Math.floor(e.t*30);
   g.globalAlpha=fade*.16;g.fillStyle='#4fc6ff';g.beginPath();g.ellipse(600,740,r,ry,0,PI*.5,PI*1.5);g.fill();
   for(let pass=0;pass<(qualityLow?2:4);pass++){g.globalAlpha=fade*[.22,.5,.9,1][pass];g.strokeStyle=['#2f8fff','#4fc6ff','#a8f0ff','#ffffff'][pass];g.lineWidth=[44,20,7,2.5][pass];g.beginPath();
    for(let k=0;k<=56;k++){const a=PI*.5+k/56*PI,j=(noise(k*7+seed)-.5)*(pass>1?30:12);const x=600+Math.cos(a)*(r+j),y=740+Math.sin(a)*(ry+j*.5);k?g.lineTo(x,y):g.moveTo(x,y)}g.stroke()}
   if(!qualityLow){g.globalAlpha=fade;g.strokeStyle='#d8fbff';g.lineWidth=2;for(let k=0;k<9;k++){const a=PI*.55+noise(k*13+seed)*PI*.9;let x=600+Math.cos(a)*r,y=740+Math.sin(a)*ry;g.beginPath();g.moveTo(x,y);for(let s2=0;s2<3;s2++){x+=rand(8,26);y+=rand(-14,14);g.lineTo(x,y)}g.stroke()}}}
  g.restore()}
 if(e.kind==='frost'&&e.r!==undefined&&!top){const r=Math.min(e.r,1100),fadeOut=e.t>2.6?Math.max(0,1-(e.t-2.6)/1.6):1;g.save();
  g.globalAlpha=.22*fadeOut;g.fillStyle=grad(600-r,0,600,0,[[0,'#e8fdff'],[.25,'#8ee6ff'],[1,'#5fc9f0']]);g.beginPath();g.ellipse(600,742,r,Math.min(r*.5,200),0,PI*.5,PI*1.5);g.fill();
  if(e.r<1100){g.globalAlpha=.9*fadeOut;g.strokeStyle='#e9fdff';g.lineWidth=3;g.beginPath();for(let k=0;k<=36;k++){const a=PI*.5+k/36*PI,x=600+Math.cos(a)*r,y=742+Math.sin(a)*Math.min(r*.5,200);k?g.lineTo(x,y):g.moveTo(x,y)}g.stroke();
   g.fillStyle='#d9fbff';for(let k=0;k<(qualityLow?8:18);k++){const a=PI*.5+(k+.5)/18*PI,x=600+Math.cos(a)*r,y=742+Math.sin(a)*Math.min(r*.5,200),s=8+noise(k*3)*12;g.beginPath();g.moveTo(x-4,y);g.lineTo(x-1,y-s);g.lineTo(x+3,y);g.fill()}}
  g.restore()}
 if(e.kind==='frost'&&top){const fadeOut=e.t>2.6?Math.max(0,1-(e.t-2.6)/1.6):1;g.save();
  // 화면 가장자리 성에
  g.globalAlpha=.55*fadeOut*Math.min(1,e.t*3);g.fillStyle=grad(0,0,120,0,[[0,'#d8fbffcc'],[1,'#d8fbff00']]);g.fillRect(0,122,120,880);g.fillStyle=grad(0,122,0,230,[[0,'#d8fbffaa'],[1,'#d8fbff00']]);g.fillRect(0,122,750,108);
  g.restore()}}}
// ---------------------------------------------------------------- 생존자 러너(절차 드로잉)
function drawRunner(r){const sv=SURV[r.who],ph=r.phase,s=1.25;if(r.done&&!r.safe&&!r.lost)return;const sp=imgs['s_'+r.who];
 if(sp){g.save();g.translate(r.x,r.y);g.globalAlpha=.3;g.fillStyle='#110e1a';g.beginPath();g.ellipse(0,0,16,5,0,0,TAU);g.fill();g.globalAlpha=r.lost?Math.max(0,1-r.fade):1;if(r.lost)g.rotate(-1.3*Math.min(1,r.fade*3));
  const h=74,w=h*sp.width/sp.height,bob=Math.abs(Math.sin(ph))*5;g.translate(0,-bob);g.rotate(.1+Math.sin(ph)*.06);g.drawImage(sp,-w*.5,-h,w,h);g.restore();}
 else{g.save();g.translate(r.x,r.y);
 g.globalAlpha=.3;g.fillStyle='#110e1a';g.beginPath();g.ellipse(0,0,13*s,4*s,0,0,TAU);g.fill();g.globalAlpha=r.lost?Math.max(0,1-r.fade):1;
 if(r.lost){g.rotate(-1.3*Math.min(1,r.fade*3))}
 g.scale(s,s);const lg=Math.sin(ph)*7,ar=Math.sin(ph+PI)*7;g.lineCap='round';
 for(const [dx,col] of [[lg,'#2e3240'],[-lg,'#3a3f50']]){g.strokeStyle=OUT;g.lineWidth=5.5;g.beginPath();g.moveTo(0,-15);g.lineTo(dx,-1);g.stroke();g.strokeStyle=col;g.lineWidth=3.2;g.stroke();box(dx-3,-3,7,4,1.5,'#4a3426',1.4)}
 g.strokeStyle=OUT;g.lineWidth=5;g.beginPath();g.moveTo(1,-26);g.lineTo(ar+2,-16);g.stroke();g.strokeStyle='#f0c9a2';g.lineWidth=2.6;g.stroke();
 g.save();g.rotate(.18);box(-6,-31,12,17,4,sv.coat,2);g.restore();
 g.beginPath();g.arc(2,-37,6.2,0,TAU);inked('#f3cfaa',2);g.beginPath();g.arc(1.5,-38.5,6.4,PI*1.05,PI*2.05);g.lineTo(-4,-36);g.closePath();inked(sv.hair,1.8);
 g.strokeStyle=OUT;g.lineWidth=5;g.beginPath();g.moveTo(-1,-26);g.lineTo(-ar-2,-17);g.stroke();g.strokeStyle='#e8bf96';g.lineWidth=2.6;g.stroke();
 g.restore();}
 if(!r.done){const ty=sp?r.y-92:r.y-62;const p=.5+.5*Math.sin(frame*6);g.save();g.translate(r.x,ty);box(-34,-11,68,20,8,'#1d3a2ae8',2);txt(LL(sv.name),0,0,15,'#bfffd0','center',false);g.globalAlpha=.6+.4*p;poly([-6,10,6,10,0,18],'#bfffd0',1.5);g.restore();
  for(let k=0;k<3;k++){g.fillStyle=k<r.hp?'#ff5a5a':'#3a2a2a';g.fillRect(r.x-13+k*9,ty+16,7,4)}}}
function drawCrate(c){const ci=imgs.o_crate;if(ci){g.save();g.translate(c.x+(c.landed?0:Math.sin(c.t*2+c.sway)*10),c.y);const sc=.5,W2=ci.width*sc,H2=ci.height*sc;
  if(!c.landed){g.rotate(Math.sin(c.t*2+c.sway)*.08);g.drawImage(ci,-W2/2,-H2,W2,H2)}else{g.globalAlpha=.3;g.fillStyle='#110e1a';g.beginPath();g.ellipse(0,4,30,8,0,0,TAU);g.fill();g.globalAlpha=1;const p=.5+.5*Math.sin(frame*7);g.save();g.globalCompositeOperation='lighter';drawGlow(0,-14,44+p*10,'g',.5+.3*p);g.restore();const sy=ci.height*.69;g.drawImage(ci,0,sy,ci.width,ci.height-sy,-W2/2,-(ci.height-sy)*sc,W2,(ci.height-sy)*sc);
   const tl=c.life;g.globalAlpha=tl<3?(Math.sin(frame*12)>0?1:.4):1;box(-30,-66,60,22,10,'#1d3a2ae8',2);txt(L('터치!','点击！'),0,-55,15,'#bfffd0','center',false)}g.restore();return}
 g.save();g.translate(c.x+(c.landed?0:Math.sin(c.t*2+c.sway)*10),c.y);
 if(!c.landed){g.strokeStyle='#d8d2c4';g.lineWidth=1.5;g.beginPath();g.moveTo(-16,-10);g.lineTo(-30,-58);g.moveTo(16,-10);g.lineTo(30,-58);g.moveTo(0,-12);g.lineTo(0,-62);g.stroke();
  g.beginPath();g.moveTo(-40,-56);g.quadraticCurveTo(0,-108,40,-56);g.quadraticCurveTo(26,-64,13,-56);g.quadraticCurveTo(0,-66,-13,-56);g.quadraticCurveTo(-26,-64,-40,-56);g.closePath();inked(vg(-100,-56,'#f4f0e6','#c9c0ae'),2.5);g.strokeStyle='#e0402e';g.lineWidth=3;g.beginPath();g.moveTo(0,-104);g.lineTo(0,-62);g.stroke()}
 else{g.globalAlpha=.3;g.fillStyle='#110e1a';g.beginPath();g.ellipse(0,4,26,7,0,0,TAU);g.fill();g.globalAlpha=1;const p=.5+.5*Math.sin(frame*7);g.save();g.globalCompositeOperation='lighter';drawGlow(0,-12,40+p*10,'g',.5+.3*p);g.restore()}
 box(-20,-26,40,28,4,vg(-26,2,'#7da35a','#4f6e36','#34492a'),2.5);g.strokeStyle='#2a3a20';g.lineWidth=2;g.strokeRect(-14,-21,28,18);hazard(-20,-14,40,5);
 if(c.landed){const tl=c.life;g.globalAlpha=tl<3?(Math.sin(frame*12)>0?1:.4):1;box(-30,-58,60,22,10,'#1d3a2ae8',2);txt(L('터치!','点击！'),0,-47,15,'#bfffd0','center',false)}
 g.restore()}

// ---------------------------------------------------------------- simulation
let dbgFreeze=false,autoBot=false;
function fxTick(dt){
 for(let k=parts.n-1;k>=0;k--){const p=parts.a[k];p.life-=dt;if(p.life<=0){drop(parts,k);continue}
  if(p.drag){const f=Math.exp(-p.drag*dt);p.vx*=f;p.vy*=f}p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt;p.size+=p.grow*dt;
  if(p.gy&&p.y>p.gy&&p.vy>0){p.y=p.gy;p.vy*=-.32;p.vx*=.55;p.vr*=.5;if(Math.abs(p.vy)<40){p.vy=0;p.g=0;p.vx*=.3}}
  if(p.type==='fire'&&p.life<p.max*.3&&Math.random()<.04&&!qualityLow)emit('smoke',p.x,p.y,p.vx*.2,-40,.7,p.size*.5,'',{grow:18,a:.45})}
 for(let k=decals.n-1;k>=0;k--){const d=decals.a[k];d.life-=dt;if(d.life<=0)drop(decals,k)}
 for(const f of floaters){f.y-=65*dt;f.life-=dt}floaters=floaters.filter(f=>f.life>0);
 screenShake=Math.max(0,screenShake-dt*28);screenFlash=Math.max(0,screenFlash-dt*2.2);bannerT-=dt;
 for(const k in hudPulse)hudPulse[k]=Math.max(0,hudPulse[k]-dt)}
function tick(dt){if(sc!=='battle'||paused||dbgFreeze||dialog||stageDone||perkPick||guideTip||adShow)return;dt=Math.min(.035,dt)*speed;if(hitStop>0){hitStop-=dt;dt*=.18}
 if(cine){cine.t+=dt;if(cine.t<1.8)dt*=.3;if(cine.t>2.6)cine=null}
 frame+=dt;waveT+=dt;comboT-=dt;if(comboT<=0)combo=0;critPulse=Math.max(0,critPulse-dt);waveCardT=Math.max(0,waveCardT-dt);towerHitT=Math.max(0,towerHitT-dt);tutorialT=Math.max(0,tutorialT-dt);
 energy=clamp(energy+dt*4*(1+save.sup.energy*.15)*runMods.ereg,0,150);feverT=Math.max(0,feverT-dt);for(const b of barrels){b.t+=dt;if(b.drop<0)b.drop=Math.min(0,b.drop+dt*900)}barrels=barrels.filter(b=>!b.gone);barrelHint=Math.max(0,barrelHint-dt);crowd+=(crowdT-crowd)*Math.min(1,dt*1.5);blackoutT=Math.max(0,blackoutT-dt);
 if(theme()==='storm'){lightningT-=dt;if(lightningT<=0){lightningT=rand(6,12);screenFlash=Math.max(screenFlash,.32);screenFlashCol='225,232,255';AudioFx.cue('boom',.25,0)}}
 if(SD().signal){signal=clamp(((wave-1)+(waveDone?1:Math.min(.95,waveT/40)))/wavesTotal*100,0,100)}
 if(!waveDone&&toSpawn>0&&waveT>=nextSpawn){spawn(null,'march');toSpawn--;nextSpawn=waveT+rand(.3,.7)*Math.max(.45,1-effS()*.03)*DIFF.gap*.88}
 for(const z of zs){if(z.hp<=0)continue;
  if(z.emerge>0){z.emerge-=dt;z.hurt=Math.max(0,z.hurt-dt);z.flash=Math.max(0,z.flash-dt);if(Math.random()<.45)emit('dust',z.x+rand(-16,16),z.y,rand(-50,50),-rand(30,90),.6,14*z.scale+4,'',{grow:16});if(Math.random()<.25)emit('debris',z.x+rand(-8,8),z.y,rand(-140,140),rand(-280,-120),.8,rand(2,4),'#5b5048',{g:900,gy:z.y+4,vr:rand(-10,10)});continue}
  z.phase+=dt*(z.type==='scout'||z.type==='charger'?15:9)*(z.slow>0?.5:1)*(z.frozen>0||z.stun>0?0:1);
  z.hurt=Math.max(0,z.hurt-dt);z.stun=Math.max(0,z.stun-dt);z.slow=Math.max(0,z.slow-dt);z.flash=Math.max(0,z.flash-dt);z.frozen=Math.max(0,z.frozen-dt);z.hitSlow=Math.max(0,z.hitSlow-dt);z.squash=Math.max(0,z.squash-dt);z.shieldShake=Math.max(0,z.shieldShake-dt);
  if(z.kbv>0){z.x-=z.kbv*dt;z.kbv*=Math.exp(-10*dt);if(z.kbv<3)z.kbv=0}
  if(z.zh<0||z.zv<0){z.zv+=1500*dt;z.zh+=z.zv*dt;if(z.zh>=0){if(z.zv>260){z.squash=.14;puff(z.x,z.y,2,16*z.scale,.5,true,-10)}z.zh=0;z.zv=0}}
  z.tiltV+=(-70*z.tilt-10*z.tiltV)*dt;z.tilt+=z.tiltV*dt;
  if(z.burn>0){z.burn-=dt;z.burnClock+=dt;z.emberT-=dt;if(z.emberT<=0){z.emberT=qualityLow?.16:.07;const d=zDims(z);emit('fire',z.x+rand(-d.w*.25,d.w*.2),z.y+z.zh-rand(d.h*.2,d.h*.8),rand(-10,10),rand(-90,-50),rand(.25,.45),rand(5,10)*z.scale+3,'',{grow:8})}
   if(z.burnClock>.52){z.burnClock=0;hit(z,5*(1+wave*.04),'#ff9752',0,'burn');if(z.hp<=0)continue}}
  const free=z.stun<=0&&z.frozen<=0;
  if(z.type==='hound'&&free){z.x+=28*dt}
  if(z.type==='charger'&&free){z.charge-=dt;if(z.charge<=0&&z.x<425){z.charge=rand(2.2,3.0);const nx=z.x+Math.min(52,Math.max(0,560-z.x));for(let k=0;k<Q(5);k++)emit('dust',z.x+(nx-z.x)*k/5,z.y-4,-40,-20,.5,14*z.scale,'',{grow:20});z.x=nx;z.tilt=.18}}
  if(z.type==='spitter'&&free&&z.x>135&&z.x<500){z.attackT-=dt;z.wind=z.attackT<.7?1-z.attackT/.7:0;if(z.attackT<=0){z.attackT=rand(3.5,5.2);z.wind=0;const [bx,by]=bodyPt(z,.78);const p=take(projs);if(p){p.type='spit';p.sx=bx+10;p.sy=by;p.x=p.sx;p.y=p.sy;p.tx=rand(560,600);p.ty=rand(690,820);p.t=0;p.dur=.85;p.arc=120;p.dmg=2}z.tilt=-.12}}
  else if(z.type==='spitter')z.wind=0;
  if(z.type==='boss'&&free&&z.x>150){z.slamT-=dt;z.wind=z.slamT<.9?1-z.slamT/.9:0;if(z.slamT<=0){z.slamT=7;z.wind=0;bossSlam(z)}}
  if(free&&z.zh>=0&&z.x<585){z.x+=z.sp*dt*(z.slow>0?.47:1)*(z.hitSlow>0?.55:1)}
  if(z.x>=585&&z.type==='boomer'){const dmg=ZDMG.boomer*DIFF.zdmg*(1+effS()*.05)*(endless?1:LATE_DMG[stageIdx]||1);hp-=dmg;damageTaken+=dmg;towerHitT=.4;z.hp=0;boomBlast(590,z.y,1.1);number(Math.ceil(dmg),604,z.y-80,'#ff6a6a',true);continue}
  if(z.x>=585){z.x=585;z.atk-=dt;if(free&&z.atk<=0){z.atk=z.type==='boss'?1.6:1.15;const dmg=ZDMG[z.type]*DIFF.zdmg*(1+effS()*.05)*(endless?1:LATE_DMG[stageIdx]||1);hp-=dmg;damageTaken+=dmg;towerHitT=.25;vib('light');z.tiltV+=6;screenShake=shakeReduced?0:Math.max(screenShake,2.5);AudioFx.cue('hurt',.45,.22);sparks(590,z.y-26*z.scale,'#ff8a5a',5,260);number(Math.ceil(dmg),604,z.y-80*z.scale,'#ff6a6a')}}}
 zs=zs.filter(z=>z.hp>0);
 // 생존자 러너
 for(const r of runners){if(r.done){if(r.lost)r.fade=(r.fade||0)+dt;continue}r.phase+=dt*13;r.x+=r.sp*dt;
  for(const z of zs){if(z.hp>0&&!(z.emerge>0)&&z.zh>=0&&Math.abs(z.y-r.y)<55&&z.x>r.x-30&&z.x<r.x+10){r.hurtT-=dt;if(r.hurtT<=0){r.hurtT=.55;r.hp--;sparks(r.x,r.y-30,'#ff6a5a',5,200);AudioFx.cue('hurt',.3,.2);if(r.hp<=0){r.done=true;r.lost=true;r.fade=0;message(LL(SURV[r.who].name)+L(' 부상… 간신히 벙커로 끌려왔다',' 受伤……被勉强拖回了掩体'),2.2)}}break}}
  if(!r.done&&r.x>=545){r.done=true;r.safe=true;glowAt(r.x,r.y-30,60,'g',.4);AudioFx.cue('power');if(r.who.indexOf('civ')===0){civSaved++;coins+=15;hp=Math.min(maxHP,hp+maxHP*.04);message(L('피난민 구조! 고철 +15 · 탑 수리','救下难民！废铁 +15 · 修塔'),1.6)}else{coins+=25;energy=clamp(energy+15,0,150);message(LL(SURV[r.who].name)+L(' 합류! 고철 +25 · 전력 +15',' 加入！废铁 +25 · 电力 +15'),2)}}}
 // 보급 상자
 for(const c of crates){c.t+=dt;if(!c.landed){c.y+=90*dt;if(c.y>=c.ty){c.y=c.ty;c.landed=true;puff(c.x,c.y,4,20,.6,true)}}else{c.life-=dt}}
 if(autoBot)for(const c of crates)if(c.landed&&!c.got)openCrate(c);
 crates=crates.filter(c=>!c.got&&c.life>0);
 // 드롭 아이템: 튀어나와 바닥에 떨어진 뒤 HUD로 날아감
 for(const d of drops){d.t+=dt;if(d.st===0){d.vy+=900*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.vx*=Math.exp(-2*dt);if(d.y>d.gy&&d.vy>0){d.y=d.gy;d.vy*=-.35;d.vx*=.6}if(d.t>.7){d.st=1;d.sx=d.x;d.sy=d.y;d.ft=0}}
  else{d.ft+=dt*1.6;const T2=DROP_TARGET[d.k],u=Math.min(1,d.ft),e=u*u*(3-2*u);d.fx=u;d.x=d.sx+(T2[0]-d.sx)*e;d.y=d.sy+(T2[1]-d.sy)*e-Math.sin(PI*u)*120;if(u>=1){d.st=2;collect(d)}}}
 drops=drops.filter(d=>d.st<2);
 // turrets
 const front=frontTarget();
 for(let i=0;i<5;i++){const t=tur[i],m=MOUNTS[i];t.fireT+=dt;t.recoil+=(0-t.recoil)*Math.min(1,dt*13);t.spinV*=Math.exp(-dt*3);t.spin+=(t.spinV+.6)*dt;
  if(levels[i]<1)continue;
  const inRange=front&&600-front.x<=weapon[i].range;let want=inRange?aimAngle(i,front):m.rest+Math.sin(frame*.8+i*1.7)*.05;
  t.ang+=(want-t.ang)*Math.min(1,dt*(inRange?9:2.5));
  t.charge=clamp(1-cooldown[i]/(weapon[i].shot/(1+DIFF.lvR*(levels[i]-1))),0,1);
  cooldown[i]-=dt;if(cooldown[i]<=0){cooldown[i]=weapon[i].shot/(1+DIFF.lvR*(levels[i]-1));attack(i)}
  if(i===3&&t.flameT>0){t.flameT-=dt;const live=t.flameTargets.filter(q=>q.hp>0);const [mx,my]=muzzle(3,2);const n=qualityLow?2:5;
   for(let k=0;k<n;k++){const q=live.length?live[(Math.random()*live.length)|0]:null;let tx,ty;if(q){[tx,ty]=bodyPt(q,.5)}else{tx=mx+Math.cos(t.ang)*300;ty=my+Math.sin(t.ang)*300}
    const dur=rand(.26,.36),vx=(tx-mx)/dur+rand(-40,40),vy=(ty-my)/dur+rand(-40,40);emit('fire',mx,my,vx,vy,dur+rand(.05,.15),rand(5,8),'',{grow:46,drag:.6})}
   if(Math.random()<.3)emit('smoke',mx-20,my-10,rand(-120,-60),-40,.8,10,'',{grow:30,a:.6})}
  if(i===4&&!qualityLow&&Math.random()<dt*3){const [mx,my]=muzzle(4);emit('smoke',mx,my,rand(-10,10),-15,1,4,'',{grow:10,a:.25})}
  if(i===1&&t.charge>.7&&Math.random()<dt*8){const [mx,my]=muzzle(1);sparks(mx,my,'#bff6ff',1,120)}}
 // projectiles
 for(let k=projs.n-1;k>=0;k--){const p=projs.a[k];let done=false;
  if(p.type==='bullet'){if(p.target&&p.target.hp>0){const [bx,by]=bodyPt(p.target,.55);p.tx=bx;p.ty=by}const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy),st=p.speed*dt;
   if(d<=st){if(p.target&&p.target.hp>0)hit(p.target,p.dmg,'#ffc477',8,'bullet');else sparks(p.tx,p.ty,'#ffe7a0',3,200);done=true}else{p.vx=dx/d;p.vy=dy/d;p.x+=p.vx*st;p.y+=p.vy*st}}
  else{p.t+=dt;const u=Math.min(1,p.t/p.dur);
   if(p.type==='shell'||p.type==='spit'){p.x=p.sx+(p.tx-p.sx)*u;p.y=p.sy+(p.ty-p.sy)*u-p.arc*Math.sin(PI*u);
    if(p.type==='shell'){p.trail-=dt;if(p.trail<=0){p.trail=qualityLow?.05:.02;emit('smoke',p.x,p.y,rand(-10,10),rand(-10,10),.7,7,'',{grow:18,a:.8});emit('fire',p.x,p.y,rand(-15,15),rand(-15,15),.16,7,'',{grow:4})}}
    else if(Math.random()<.35)emit('goo',p.x,p.y,rand(-30,30),rand(0,40),.4,2.5,'#9fe05a',{g:400})}
   if(p.type==='bomb'){p.x=p.sx+(p.tx-p.sx)*u;p.y=p.sy+(p.ty-p.sy)*u*u;if(!qualityLow&&Math.random()<.5)emit('smoke',p.x,p.y-6,rand(-10,10),-20,.4,4,'',{grow:10,a:.5})}
   if(u>=1){done=true;
    if(p.type==='shell'){explode(p.tx,p.ty,1);AudioFx.cue('boom',1,.06);for(const z of zs)if(z.hp>0&&Math.abs(z.x-p.tx)<100){hit(z,p.dmg,'#ffc36c',40,'blast');knockUp(z);if(z.hp>0){const [bx,by]=bodyPt(z,.4);puff(bx,z.y,2,18,.6,true,-20)}}}
    if(p.type==='bomb'){explode(p.tx,p.ty,1.3,true);vib('medium');AudioFx.cue('boom',1,.03);screenShake=shakeReduced?0:13;decal('scorch',p.tx,p.ty,110,12);if(p.tg)p.tg.hit=true;const dm=95*(1+effS()*.1)*(1+save.sup.air*.2);for(const z of zs)if(z.hp>0&&!(z.emerge>0)&&Math.abs(z.x-p.tx)<118&&Math.abs(z.y-p.ty)<88){hit(z,dm,'#ffcf82',40,'blast');knockUp(z,1.15)}}
    if(p.type==='spit'){hp=Math.max(0,hp-p.dmg);damageTaken+=p.dmg;towerHitT=.15;for(let i=0;i<Q(10);i++)emit('goo',p.tx,p.ty,rand(-160,60),rand(-220,-40),rand(.4,.7),rand(2,4.5),i%2?'#a7e35d':'#6fb33a',{g:900,gy:p.ty+30});emit('smoke',p.tx,p.ty,0,-30,.6,10,'',{grow:20,a:.4})}}}
  if(done)drop(projs,k)}
 for(const b of beams){b.life-=dt;if(b.type==='bolt'){b.re-=dt;if(b.re<=0){b.re=.035;b.seed=Math.random()*1000}}
  if(b.type==='jet'){if(b.target&&b.target.hp>0){const [bx,by]=bodyPt(b.target,.5);b.tx=bx;b.ty=by}
   const age=b.max-b.life;if(!b.done&&age>=b.hitAt){b.done=true;for(const q of b.targets){if(q.hp<=0)continue;hit(q,b.dmg,'#a2f5ff',14,'water');q.slow=3.2;const [bx,by]=bodyPt(q,.5);emit('smoke',bx,by,-30,-20,.6,14,'',{grow:24,a:.35})}}
   if(!qualityLow||Math.random()<.5){const [mx,my]=muzzle(4);const u=Math.random();emit('drop',mx+(b.tx-mx)*u,my+(b.ty-my)*u-Math.sin(PI*u)*18,rand(-60,60),rand(-120,0),.4,rand(1.5,3),'',{g:900})}
   if(b.done&&Math.random()<.7)emit('drop',b.tx,b.ty,rand(-200,80),rand(-260,-60),.45,rand(2,3.5),'',{g:900,gy:b.ty+40})}}
 beams=beams.filter(b=>b.life>0);
 for(const d of delays)d.t-=dt;const fire=delays.filter(d=>d.t<=0);delays=delays.filter(d=>d.t>0);for(const d of fire)d.fn();
 updateEvents(dt);
 for(let k=corpses.n-1;k>=0;k--){const cp=corpses.a[k];cp.t+=dt;cp.x+=cp.vx*dt;cp.vx*=Math.exp(-4*dt);if(cp.zh<0||cp.vz<0){cp.vz+=1400*dt;cp.zh+=cp.vz*dt;if(cp.zh>0){cp.zh=0;cp.vz=0}}if(cp.t>=cp.dur)drop(corpses,k)}
 for(let i=0;i<5;i++)flash[i]=Math.max(0,flash[i]-dt);
 for(let i=0;i<3;i++)skillCD[i]=Math.max(0,skillCD[i]-dt);
 fxTick(dt);
 if(autoBot)botStep(dt);
 if(hp<=0){hp=0;stageFail();return}
 if(!waveDone&&toSpawn===0&&pending===0&&zs.length===0&&runners.every(r=>r.done)&&waveT>1.5){waveDone=true;
  if(wave>=wavesTotal&&!endless){after(1.2,()=>stageWin());message(L('모든 웨이브 방어!','所有波次防守成功！'),2)}
  else{const heal=Math.round(maxHP*(.03+save.sup.medic*.02));hp=Math.min(maxHP,hp+heal);const bonus=15+wave*3;coins+=bonus;breakT=2.6;if((stageIdx>=2||endless)&&wave%2===0)after(.9,()=>{if(!stageDone&&waveDone){perkPick=makePerks();bannerT=0}});message(L('웨이브 ','第 ')+wave+L(' 방어 성공 · 고철 +',' 波防守成功 · 废铁 +')+bonus+(heal?L(' · 수리 +',' · 修复 +')+heal:''),2.2)}}
 if(breakT>0){breakT-=dt;if(breakT<=0)startWave()}}
function bossSlam(z){vib('heavy');const d=zDims(z);AudioFx.cue('slam',1,0);screenShake=shakeReduced?0:13;hitStop=.08;
 emit('ring',z.x,z.y,0,0,.5,30,'#ff8a5a',{grow:420,ry:.38});emit('ring',z.x,z.y,0,0,.7,20,'#ffd2a0',{grow:260,ry:.38});
 for(let i=0;i<Q(12);i++)emit('debris',z.x+rand(-60,60),z.y,rand(-240,240),rand(-460,-160),rand(.7,1.1),rand(4,8),'#5b5048',{g:1100,gy:z.y+rand(-10,10),vr:rand(-14,14)});
 puff(z.x,z.y,8,50,1.2,true,-20);decal('crack',z.x,z.y,90,7);
 // 지면 충격파가 타워에 도달하면 피해
 const travel=Math.max(.15,(585-z.x)/900);events.push({kind:'quake',t:0,dur:travel,x0:z.x,y:z.y});
 after(travel,()=>{if(sc!=='battle')return;hp=Math.max(0,hp-4);damageTaken+=4;towerHitT=.3;screenShake=shakeReduced?0:8;sparks(590,z.y-30,'#ffb27a',12,360);puff(590,z.y-10,5,30,.8,true);number(4,600,z.y-80,'#ff8a7a',true)})}
function stageWin(){if(stageDone)return;stageDone=true;const s=stageIdx;const ratio=hp/maxHP;const stars=ratio>=.7?3:ratio>=.35?2:1;const first=save.cleared<=s;
 const mat=Math.round((first?14:6)+s*(first?3:1.2)+stars*2),prt=Math.round((first?8:4)+s*(first?2:.8)+stars);
 clearInfo={stars,first,mat,prt,lootMat:loot.mat,lootParts:loot.parts,kills,ratio};
 save.mat+=mat+loot.mat;save.parts+=prt+loot.parts;track('stage_clear',{stage:s+1,stars});save.stars[s]=Math.max(save.stars[s]||0,stars);if(first)save.cleared=s+1;mission('clear');if(stars>=3)mission('stars3');autoEquip();persist();
 sc='clear';clearT=0;AudioFx.cue('win')}
function revive(){if(!failInfo||failInfo.endless&&false)return;save.mat-=failInfo.mat;save.parts-=failInfo.prt;persist();revived=true;stageDone=false;failInfo=null;sc='battle';hp=Math.ceil(maxHP*.5);
 for(const z of zs)if(z.x>380&&z.type!=='boss'){z.hp=0;kill(z,'blast')}zs=zs.filter(z=>z.hp>0);for(const z of zs){z.kbv+=600;z.stun=Math.max(z.stun,2)}explode(560,760,1.6,true);screenFlash=.6;screenFlashCol='255,240,200';message(L('부활! 탑 내구도 50% 복구','复活！塔耐久恢复50%'),2);AudioFx.cue('power',1,0)}
function stageFail(){if(stageDone)return;stageDone=true;vib('long');track('stage_fail',{stage:endless?'endless':stageIdx+1,wave});if(endless){const best=wave>save.endlessBest;save.endlessBest=Math.max(save.endlessBest,wave);failInfo={endless:true,best,mat:Math.floor(wave*2.4)+loot.mat,prt:Math.floor(wave*1.4)+loot.parts,wave};save.mat+=failInfo.mat;save.parts+=failInfo.prt;persist();sc='fail';clearT=0;return}failInfo={mat:Math.max(Math.floor(loot.mat*.5),wave>=2?Math.round((wave-1)/wavesTotal*(6+stageIdx*1.5)):0),prt:Math.max(Math.floor(loot.parts*.5),wave>=2?Math.round((wave-1)/wavesTotal*(3+stageIdx)):0),wave};save.mat+=failInfo.mat;save.parts+=failInfo.prt;persist();sc='fail';clearT=0}
function openCrate(c){c.got=true;mission('crate');const s=effS();spawnDrop('scrap',30+s*3,c.x,c.y-14,c.y);spawnDrop('energy',18,c.x,c.y-14,c.y);spawnDrop('mat',2+Math.floor(s/4),c.x,c.y-14,c.y);if(s>=4)spawnDrop('parts',1+Math.floor(s/5),c.x,c.y-14,c.y);sparks(c.x,c.y-14,'#bfffd0',12,300);AudioFx.cue('power')}
// 자동 플레이(밸런스 시뮬레이션용)
let botT=0;function botStep(dt){botT-=dt;if(botT>0)return;botT=.4;
 let best=-1,bc=1e9;for(let f=0;f<=floorsBuilt;f++){const wi=save.equip[f];if(wi<0||levels[wi]>=5)continue;const c=costOf(wi)*(levels[wi]<1?.5:1);if(c<bc){bc=c;best=wi}}
 if(best>=0&&coins>=costOf(best))buyWeapon(best);
 const n=zs.filter(z=>z.x>0).length,near=zs.filter(z=>z.x>380).length;
 if(skillOpen(0)&&skillCD[0]<=0&&energy>=SKILL_COST[0]&&n>=7)useSkill(0);
 if(skillOpen(2)&&skillCD[2]<=0&&energy>=SKILL_COST[2]&&near>=5)useSkill(2);
 if(skillOpen(1)&&skillCD[1]<=0&&energy>=SKILL_COST[1]&&near>=5)useSkill(1);
 for(const b of barrels){if(b.gone||b.drop<0)continue;let c=0;for(const z of zs)if(z.hp>0&&Math.abs(z.x-b.x)<120&&Math.abs(z.y-b.y)<85)c++;if(c>=4){popBarrel(b);break}}}
function botPerk(){if(!perkPick)return;const pr=['dmg','rate','repair','armor','scrapMul','fever','scrap','barrels','energy','skill'];let bi=0,bv=99;perkPick.opts.forEach((o,i)=>{let v=pr.indexOf(o.k);if(o.k==='repair'&&hp<maxHP*.5)v=-1;if(v<bv){bv=v;bi=i}});applyPerk(perkPick.opts[bi])}
function buyWeapon(i){const c=costOf(i);if(levels[i]>=5){message(L('최대 강화 완료','已强化至满级'),.8);return false}if(coins<c){message(L('고철이 부족하다','废铁不足'),.8);return false}
 coins-=c;levels[i]++;if(stageIdx===0&&!save.tips.tut1){save.tips.tut1=1;track('tut_upgrade',{})}if(levels[i]>1)mission('upgrade');message(LL(weapon[i].name)+' '+(levels[i]===1?L('설치!','安装！'):'Lv.'+levels[i]+L(' 강화!',' 强化！')),1.1);
 const m=MOUNTS[i];sparks(m.x,m.y,weapon[i].col,14,300);puff(m.x,m.y+10,4,22,.7,true);glowAt(m.x,m.y,60,'w',.25);tur[i].recoil=-6;AudioFx.cue('power');return true}

// ---------------------------------------------------------------- rendering
// 걷기: 정지 스프라이트를 상체/다리로 나눠 다리 앞뒤 교차 + 상체 흔들림
function drawFinger(x,y,label){const b=Math.sin(frame*7)*10;g.save();g.translate(x,y+b);g.globalAlpha=.95;g.beginPath();g.arc(0,-6,30+Math.sin(frame*7)*5,0,TAU);g.strokeStyle='rgba(255,230,140,.8)';g.lineWidth=4;g.stroke();txt('👆',4,40,54,'#fff','center',false);g.restore();
 if(label){g.save();const w=Math.max(200,label.length*22+40);rr(Math.min(730-w,Math.max(20,x-w/2)),y-108+b*.3,w,52,14,'#1b2232f2','#ffcf6a',2);txt(label,Math.min(730-w,Math.max(20,x-w/2))+w/2,y-82+b*.3,21,'#ffe2a0','center');g.restore()}}
function tutorialHint(){if(endless||stageDone||paused||dialog||perkPick)return;
 if(stageIdx===0&&!save.tips.tut1){const wi=save.equip[0];if(wi>=0&&coins>=costOf(wi)&&levels[wi]<5){drawFinger(98,1150,null);return}}
 if(stageIdx<=1&&!save.tips.tut2&&skillOpen(0)&&energy>=SKILL_COST[0]&&skillCD[0]<=0&&zs.length>=4){drawFinger(67,960,L('공습으로 한 번에 쓸어버리기!','用空袭一举扫清！'))}}
function walkDraw(im,x0,y0,w,h,ph,quad){const hip=quad?.55:.6,iw=im.width,ih=im.height,sy=ih*hip,sh=ih-sy,dy=h*hip,dh=h-dy,ov=ih*.03;const sw=Math.sin(ph),k=.3;
 for(let side=0;side<2;side++){const sx=side?iw*.48:0,ssw=iw*.52,s2=(side?-1:1)*sw*k;g.save();g.translate(x0+(side?w*.48:0)+w*.26,y0+dy);g.transform(1,0,s2,1,0,0);g.drawImage(im,sx,sy,ssw,sh,-w*.26,0,w*.52,dh);g.restore()}
 g.save();g.translate(0,-Math.abs(sw)*h*.012);g.drawImage(im,0,0,iw,sy+ov,x0,y0,w,dy+ov*h/ih);g.restore()}
function drawZombie(z){const d=zDims(z);const im=d.im;
 const gait=Math.sin(z.phase*(z.type==='hound'?1.3:1)),bob=Math.abs(gait)*(z.type==='hound'?3:2.6)*z.scale;
 const lift=-z.zh;g.save();g.globalAlpha=Math.max(.08,.28-lift/600);g.fillStyle='#110e1a';g.beginPath();g.ellipse(z.x,z.y,Math.max(15,d.w*.35)*(1-lift/500),Math.max(3,6*z.scale),0,0,TAU);g.fill();g.restore();
 if(z.type==='boss'&&z.wind>0){g.save();g.globalCompositeOperation='lighter';g.globalAlpha=z.wind;g.strokeStyle='#ff4a3a';g.lineWidth=4;g.beginPath();g.ellipse(z.x,z.y,60+z.wind*90,(60+z.wind*90)*.36,0,0,TAU);g.stroke();drawGlow(z.x,z.y-d.h*.5,d.h*.7,'r',.3*z.wind);g.restore()}
 if(!im){ellipse(z.x,z.y-30,18,30,'#6a7a5a');return}
 g.save();g.translate(z.x,z.y+z.zh-bob);if(z.emerge>0){const k=z.emerge/z.emergeMax;g.beginPath();g.rect(-d.w*1.2,-d.h*1.4,d.w*2.4,d.h*1.4);g.clip();g.translate(0,d.h*k*.95);g.rotate(Math.sin(frame*30)*.05*k)}
 const sq=z.squash/.14*.16;if(sq>0)g.scale(1+sq*.6,1-sq);
 if(z.wind>0&&z.type==='boss')g.scale(1-z.wind*.04,1+z.wind*.05);
 let rot=z.tilt+Math.sin(z.phase*.68)*.024;if(z.stun>0)rot+=Math.sin(frame*55+z.seed)*.035;if(z.frozen>0)rot=z.tilt*.3;
 if(z.shieldShake>0)g.translate(Math.sin(frame*90)*2.5,0);
 g.rotate(rot);g.transform(1,0,(z.frozen>0?0:Math.sin(z.phase)*.022),1,0,0);
 const x0=-d.w*.53,y0=-d.h;
 if(z.frozen>0||z.stun>0||z.emerge>0||qualityLow||z.type==='boss'&&z.wind>0)g.drawImage(im,x0,y0,d.w,d.h);else walkDraw(im,x0,y0,d.w,d.h,z.phase*(z.type==='hound'?1.3:1),z.type==='hound');
 const T=tints[d.key];

 if(z.bossIdx===3&&T){g.save();g.globalAlpha=.3;g.drawImage(T.char,x0,y0,d.w,d.h);g.restore()}
 if(T){if(z.frozen>0){g.globalAlpha=.62;g.drawImage(T.ice,x0,y0,d.w,d.h)}else if(z.slow>0){g.globalAlpha=.26;g.drawImage(T.ice,x0,y0,d.w,d.h)}
  if(z.burn>0){g.globalAlpha=.22+Math.sin(frame*30+z.seed)*.08;g.globalCompositeOperation='lighter';g.drawImage(T.fire,x0,y0,d.w,d.h);g.globalCompositeOperation='source-over'}
  if(z.stun>0&&Math.sin(frame*40+z.seed)>.2){g.globalAlpha=.28;g.globalCompositeOperation='lighter';g.drawImage(T.zap,x0,y0,d.w,d.h);g.globalCompositeOperation='source-over'}
  if(z.flash>0){g.globalAlpha=Math.min(1,z.flash/.09)*z.flashA;g.drawImage(T.w,x0,y0,d.w,d.h)}
  g.globalAlpha=1}
 if(z.type==='shield'&&z.shield>0&&z.shield<z.shieldMax*.55){g.strokeStyle='#1a1418';g.lineWidth=1.6;const sx=d.w*.24,sy=-d.h*.55;g.beginPath();g.moveTo(sx,sy);g.lineTo(sx+6,sy-d.h*.12);g.lineTo(sx+2,sy-d.h*.22);g.moveTo(sx,sy);g.lineTo(sx-5,sy+d.h*.15);g.lineTo(sx+4,sy+d.h*.26);g.moveTo(sx,sy);g.lineTo(sx+10,sy+d.h*.06);g.stroke()}
 if(z.type==='spitter'&&z.wind>0){g.globalCompositeOperation='lighter';drawGlow(d.w*.28,-d.h*.59,10+z.wind*16,'g',.4+z.wind*.6);g.globalCompositeOperation='source-over'}
 g.restore();
 if(z.frozen>0){// 얼음 결정
  g.save();g.globalAlpha=Math.min(1,z.frozen*3);for(let k=0;k<5;k++){const ox=(noise(z.seed+k)-.5)*d.w*.7,s=(10+noise(z.seed+k*3)*18)*z.scale;g.beginPath();g.moveTo(z.x+ox-s*.3,z.y+2);g.lineTo(z.x+ox+(noise(k+z.seed*2)-.5)*s*.4,z.y-s*1.6);g.lineTo(z.x+ox+s*.3,z.y+2);g.closePath();g.fillStyle='rgba(200,248,255,.85)';g.fill();g.strokeStyle='#5fb8d8';g.lineWidth=1.5;g.stroke()}g.restore()}
 if(z.stun>0&&!qualityLow){g.save();g.globalCompositeOperation='lighter';g.strokeStyle='#a8ecff';g.lineWidth=2;const [bx,by]=bodyPt(z,.75);for(let k=0;k<2;k++){g.beginPath();let x=bx+rand(-d.w*.3,d.w*.3),y=by+rand(-10,10);g.moveTo(x,y);for(let s=0;s<3;s++){x+=rand(-12,12);y+=rand(-12,12);g.lineTo(x,y)}g.stroke()}g.restore()}
 const elite=z.type!=='runner'&&z.type!=='scout'&&z.type!=='hound';
 if(elite&&z.hp<z.mhp){const bw=(z.type==='boss'?110:46)*Math.max(.7,z.scale),bx=z.x-bw/2,by=z.y+z.zh-d.h-10;g.fillStyle='#0b0d14cc';g.fillRect(bx-1,by-1,bw+2,7);g.fillStyle=z.type==='boss'?'#ff5a4a':'#ffb84a';g.fillRect(bx,by,bw*clamp(z.hp/z.mhp,0,1),5);if(z.shieldMax>0&&z.shield>0){g.fillStyle='#bfe8ff';g.fillRect(bx,by-5,bw*z.shield/z.shieldMax,3)}}}
function drawCorpse(cp){const im=imgs[cp.key];if(!im)return;const k=cp.t/cp.dur,fall=Math.min(1,cp.t/.32),a=k>.6?1-(k-.6)/.4:1;
 g.save();g.globalAlpha=a*.25;g.fillStyle='#110e1a';g.beginPath();g.ellipse(cp.x,cp.y,cp.w*.4,6,0,0,TAU);g.fill();
 g.globalAlpha=a;g.translate(cp.x,cp.y+cp.zh+fall*cp.h*.12);g.rotate(cp.rotDir*(fall*fall*(3-2*fall))*.62);
 g.drawImage(im,-cp.w*.53,-cp.h,cp.w,cp.h);const T=tints[cp.key];
 if(T){if(cp.tint==='char'){g.globalAlpha=a*.75;g.drawImage(T.char,-cp.w*.53,-cp.h,cp.w,cp.h)}else if(cp.tint==='zap'&&cp.t<.25){g.globalAlpha=a*.7;g.drawImage(T.w,-cp.w*.53,-cp.h,cp.w,cp.h)}
  if(cp.t<.08){g.globalAlpha=.8;g.drawImage(T.w,-cp.w*.53,-cp.h,cp.w,cp.h)}}
 g.restore()}
function drawDecal(d){const k=d.life/d.max;g.save();
 if(d.type==='scorch'){g.globalAlpha=Math.min(.55,k*1.2);g.drawImage(smokeSpr,d.x-d.size,d.y-d.size*.38,d.size*2,d.size*.76);g.globalAlpha=Math.min(.35,k);g.globalCompositeOperation='lighter';if(k>.85)g.drawImage(glow.o,d.x-d.size*.6,d.y-d.size*.2,d.size*1.2,d.size*.4)}
 if(d.type==='crack'){g.globalAlpha=Math.min(.8,k*2);g.strokeStyle='#1c1820';g.lineWidth=3;for(let i=0;i<7;i++){const a=noise(d.seed+i)*TAU;let x=d.x,y=d.y;g.beginPath();g.moveTo(x,y);for(let s=1;s<4;s++){x+=Math.cos(a+(noise(i*s+d.seed)-.5))*d.size*.3;y+=Math.sin(a+(noise(i*s*2+d.seed)-.5))*d.size*.11;g.lineTo(x,y)}g.stroke()}}
 if(d.type==='ice'){g.globalAlpha=Math.min(.7,k*2);g.fillStyle='rgba(190,245,255,.55)';g.beginPath();g.ellipse(d.x,d.y,d.size*1.3,d.size*.4,0,0,TAU);g.fill()}
 g.restore()}
function drawParticles(additive){for(let k=0;k<parts.n;k++){const p=parts.a[k];const add=p.type==='glow'||p.type==='fire'||p.type==='spark'||p.type==='ring';if(add!==additive)continue;const r=clamp(p.life/p.max,0,1);
 switch(p.type){
  case 'glow':drawGlow(p.x,p.y,p.size,p.col,r);break;
  case 'fire':drawGlow(p.x,p.y,p.size,r>.72?'y':r>.4?'o':'r',Math.min(1,r*1.5)*.85);if(r>.7)drawGlow(p.x,p.y,p.size*.4,'w',(r-.7)*2.5);break;
  case 'spark':g.globalAlpha=r;g.strokeStyle=p.col;g.lineWidth=p.size;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(p.x-p.vx*.035,p.y-p.vy*.035);g.stroke();break;
  case 'ring':g.globalAlpha=r*.9;g.strokeStyle=p.col;g.lineWidth=2+r*8;g.beginPath();g.ellipse(p.x,p.y,p.size,p.size*p.ry,0,0,TAU);g.stroke();break;
  case 'smoke':g.globalAlpha=r*.42*p.a;g.drawImage(smokeSpr,p.x-p.size,p.y-p.size,p.size*2,p.size*2);break;
  case 'dust':g.globalAlpha=r*.5;g.drawImage(dustSpr,p.x-p.size,p.y-p.size*.7,p.size*2,p.size*1.4);break;
  case 'debris':g.globalAlpha=Math.min(1,r*3);g.save();g.translate(p.x,p.y);g.rotate(p.rot);g.fillStyle=p.col;g.strokeStyle=OUT;g.lineWidth=1.5;g.beginPath();g.moveTo(-p.size,-p.size*.6);g.lineTo(p.size*.8,-p.size*.8);g.lineTo(p.size,p.size*.5);g.lineTo(-p.size*.5,p.size*.7);g.closePath();g.fill();g.stroke();g.restore();break;
  case 'casing':g.globalAlpha=Math.min(1,r*3);g.save();g.translate(p.x,p.y);g.rotate(p.rot);g.fillStyle='#e8b444';g.fillRect(-1.5,-3.5,3,7);g.fillStyle='#fff3b0';g.fillRect(-1.5,-3.5,1,7);g.restore();break;
  case 'drop':g.globalAlpha=Math.min(1,r*2);g.fillStyle='#8be6ff';g.beginPath();g.arc(p.x,p.y,p.size,0,TAU);g.fill();g.fillStyle='#ffffff';g.fillRect(p.x-p.size*.4,p.y-p.size*.5,p.size*.6,p.size*.6);break;
  case 'ice':g.globalAlpha=Math.min(1,r*2.5);g.save();g.translate(p.x,p.y);g.rotate(p.rot);g.fillStyle='#d6faff';g.strokeStyle='#5fb8d8';g.lineWidth=1.3;g.beginPath();g.moveTo(0,-p.size);g.lineTo(p.size*.45,p.size*.5);g.lineTo(-p.size*.45,p.size*.5);g.closePath();g.fill();g.stroke();g.restore();break;
  case 'goo':g.globalAlpha=Math.min(1,r*2);g.fillStyle=p.col;g.beginPath();g.arc(p.x,p.y,p.size,0,TAU);g.fill();break
  case 'burst':{const age=1-r,sc2=age<.25?.55+age/.25*.45:1+(age-.25)*.25;g.globalAlpha=r<.35?r/.35:1;g.save();g.translate(p.x,p.y);g.rotate(p.rot);g.scale(sc2,sc2*.86);for(let L=0;L<3;L++){const R=p.size*[1,.72,.42][L];g.beginPath();for(let k=0;k<24;k++){const a=k/24*TAU,rr3=R*(k%2?.62:1)*(.85+noise(k*7+L+p.rot)*.3);k?g.lineTo(Math.cos(a)*rr3,Math.sin(a)*rr3):g.moveTo(Math.cos(a)*rr3,Math.sin(a)*rr3)}g.closePath();g.fillStyle=['#e5482a','#ff9a2e','#fff1a6'][L];g.fill();if(L===0){g.strokeStyle=OUT;g.lineWidth=3;g.stroke()}}g.restore();break}}}
 g.globalAlpha=1}
function drawProjectiles(){for(let k=0;k<projs.n;k++){const p=projs.a[k];
 if(p.type==='bullet'){g.save();g.globalCompositeOperation='lighter';const L=58;g.strokeStyle='rgba(255,200,90,.5)';g.lineWidth=7;g.beginPath();g.moveTo(p.x-(p.vx||0)*L,p.y-(p.vy||0)*L);g.lineTo(p.x,p.y);g.stroke();g.strokeStyle='#fff6c8';g.lineWidth=2.4;g.stroke();drawGlow(p.x,p.y,9,'y',.9);g.restore()}
 else if(p.type==='shell'){const u=Math.min(1,p.t/p.dur),vx=(p.tx-p.sx),vy=(p.ty-p.sy)-p.arc*PI*Math.cos(PI*u);
  g.save();g.globalAlpha=.5+.5*Math.sin(p.t*30);g.strokeStyle='#ff5a40';g.lineWidth=2.5;const rr2=32*(1-u)+14;g.beginPath();g.ellipse(p.tx,p.ty,rr2,rr2*.4,0,0,TAU);g.stroke();g.restore();
  g.save();g.globalCompositeOperation='lighter';drawGlow(p.x,p.y,26,'o',.75);g.restore();g.save();g.translate(p.x,p.y);g.rotate(Math.atan2(vy,vx));g.beginPath();g.moveTo(14,0);g.quadraticCurveTo(10,-8,-6,-8);g.lineTo(-12,-5);g.lineTo(-12,5);g.lineTo(-6,8);g.quadraticCurveTo(10,8,14,0);inked('#5c6444',2.5);g.fillStyle='#e0b24a';g.fillRect(-4,-8,3,16);poly([-12,-5,-18,-9,-18,9,-12,5],'#3b4030',2);g.restore()}
 else if(p.type==='spit'){g.save();g.globalCompositeOperation='lighter';drawGlow(p.x,p.y,16,'g',.8);g.restore();ellipse(p.x,p.y,7,6,'#9fe05a','#2f4a1d',2)}
 else if(p.type==='bomb'){const u=Math.min(1,p.t/p.dur),a=Math.atan2((p.ty-p.sy)*2*u+.01,(p.tx-p.sx));g.save();g.translate(p.x,p.y);g.rotate(a);g.beginPath();g.ellipse(0,0,13,6.5,0,0,TAU);inked(vg(-6,6,'#8a93a2','#3a3f4a'),2);poly([-12,-4,-20,-9,-20,9,-12,4],'#4a505c',1.6);g.fillStyle='#e6b62e';g.fillRect(2,-6,3,12);g.restore()}}}
function drawBeams(){g.save();g.globalCompositeOperation='lighter';for(const b of beams){const k=clamp(b.life/b.max,0,1);
 if(b.type==='bolt'){for(let s=0;s<b.pts.length-1;s++){const [x1,y1]=b.pts[s],[x2,y2]=b.pts[s+1];const n=9,pts=[];for(let i=0;i<=n;i++){const u=i/n,j=i===0||i===n?0:(noise(b.seed+s*13+i)-.5)*34;const nx=-(y2-y1),ny=x2-x1,l=Math.hypot(nx,ny)||1;pts.push([x1+(x2-x1)*u+nx/l*j,y1+(y2-y1)*u+ny/l*j])}
   for(let pass=0;pass<3;pass++){g.globalAlpha=k*[.35,.8,1][pass];g.strokeStyle=['#2f8fff','#7fe0ff','#ffffff'][pass];g.lineWidth=[14,6,2.2][pass]*(s?0.8:1);g.lineJoin='round';g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke()}
   if(!qualityLow){const bi=3+((b.seed|0)%4),[bx,by]=pts[bi];g.globalAlpha=k*.7;g.strokeStyle='#9fe8ff';g.lineWidth=2;g.beginPath();g.moveTo(bx,by);g.lineTo(bx+(noise(b.seed+s)-.5)*50,by+(noise(b.seed*2+s)-.2)*40);g.stroke()}}}
 if(b.type==='jet'){const [mx,my]=muzzle(4);const age=b.max-b.life,reach=Math.min(1,age/b.hitAt);const ex=mx+(b.tx-mx)*reach,ey=my+(b.ty-my)*reach;const sag=18*reach;const cx=(mx+ex)/2,cy=(my+ey)/2-sag;
  const wob=Math.sin(frame*60)*1.5;for(let pass=0;pass<3;pass++){g.globalAlpha=k*[.3,.75,.95][pass];g.strokeStyle=['#2aa8e0','#8ce8ff','#f2feff'][pass];g.lineWidth=[22,11,4][pass]+wob;g.lineCap='round';g.beginPath();g.moveTo(mx,my);g.quadraticCurveTo(cx,cy,ex,ey);g.stroke()}
  if(reach>=1){drawGlow(ex,ey,26,'c',k*.9);for(const q of b.targets){if(q.hp<=0||q===b.target)continue;const [qx,qy]=bodyPt(q,.5);g.globalAlpha=k*.6;g.strokeStyle='#bff4ff';g.lineWidth=5;g.beginPath();g.moveTo(ex,ey);g.quadraticCurveTo((ex+qx)/2,Math.min(ey,qy)-20,qx,qy);g.stroke();drawGlow(qx,qy,18,'c',k*.8)}}}}
 g.restore()}
let bgCache=null;
function backdropStatic(){
 g.fillStyle=grad(0,98,0,1000,[[0,'#252841'],[.27,'#b76c72'],[.47,'#cd7d62'],[.6,'#66515c'],[1,'#37333c']]);g.fillRect(0,100,750,900);
 img('city',-15,150,800,420,.96);
 g.strokeStyle='#353848';g.lineWidth=23;g.beginPath();g.moveTo(-30,540);g.lineTo(780,360);g.stroke();g.strokeStyle='#666373';g.lineWidth=5;g.beginPath();g.moveTo(-30,527);g.lineTo(780,347);g.stroke();
 for(let i=0;i<7;i++){let x=30+i*110,y=528-i*25;rr(x,y,12,115,2,'#363743','#222631',2)}
 for(let i=0;i<75;i++){const x=noise(i*9+42)*690-20,y=490+noise(i*5+71)*65;const s=2+noise(i+7)*4;ellipse(x,y-12,s*.8,s,'#343746','#343746',1);g.strokeStyle='#31313d';g.lineWidth=2;g.beginPath();g.moveTo(x,y-7);g.lineTo(x-3,y+9);g.moveTo(x,y-7);g.lineTo(x+4,y+9);g.stroke();}
 g.fillStyle=grad(0,550,0,995,[[0,'#63606a'],[.5,'#514c54'],[1,'#302d39']]);g.fillRect(0,552,750,442);
 g.fillStyle='#4a454d';g.beginPath();g.moveTo(25,565);g.lineTo(720,570);g.lineTo(750,990);g.lineTo(0,990);g.fill();
 for(let i=0;i<57;i++){let x=noise(200+i*3)*750,y=595+noise(110+i*17)*395;g.strokeStyle=i%3?'#28263088':'#a99c9060';g.lineWidth=1+noise(i+40)*2;g.beginPath();g.moveTo(x,y);g.lineTo(x+noise(i*15+21)*20,y+9);g.lineTo(x+14,y+17);g.stroke()}
 g.save();g.translate(105,640);g.scale(.72,.72);rr(-95,-35,160,42,9,'#675a5a','#302b33',5);rr(-60,-73,100,48,10,'#544e56','#2f2b31',5);ellipse(-57,12,20,20,'#252733','#1a1b25',5);ellipse(32,12,20,20,'#252733','#1a1b25',5);g.restore();
 for(let i=0;i<4;i++){let x=100+i*145,y=886+(i%2)*25;g.save();g.translate(x,y);g.rotate(i*.1);rr(-22,-16,44,29,4,'#c38b5f','#262834',4);g.strokeStyle='#d8c09b';g.lineWidth=7;for(let j=0;j<3;j++){g.beginPath();g.moveTo(-19+j*14,-11);g.lineTo(-4+j*14,10);g.stroke()}g.restore()}}
const BGI={night:'bg1',dusk:'bg2',storm:'bg3',dawn:'bg4',fog:'bg5',inferno:'bg6'};
function backdrop(){const key=BGI[theme()]||'bg1',bi=imgs[key];
 if(bi){g.drawImage(bi,0,100,750,1000)}else{if(!bgCache&&imgs.city){const cv=mkCanvas(750,900),old=g;g=cv.getContext('2d');g.translate(0,-100);backdropStatic();g=old;bgCache=cv}if(bgCache)g.drawImage(bgCache,0,100);else backdropStatic()}
 if(!qualityLow){g.fillStyle='#d2b1a714';for(let i=0;i<14;i++){let x=(noise(i*8+20)*800+(frame*3*(i%3+1)))%820-35,y=640+noise(i*10)*320;g.beginPath();g.ellipse(x,y,15+noise(i)*22,4,0,0,TAU);g.fill()}}}
// 챕터 분위기: 밤 · 노을 · 폭풍 · 새벽
function themeEnv(){const th=theme();if(imgs[BGI[th]]){if(th==='inferno'){g.save();g.globalCompositeOperation='lighter';for(let k=0;k<4;k++)drawGlow(80+k*140,560+Math.sin(frame*2+k)*6,80,'r',.12);g.restore()}return}g.save();
 if(th==='night'){g.fillStyle='rgba(10,16,46,.48)';g.fillRect(0,100,750,900);g.globalCompositeOperation='lighter';drawGlow(120,190,90,'c',.18);g.globalCompositeOperation='source-over'}
 else if(th==='storm'){g.fillStyle='rgba(14,22,44,.58)';g.fillRect(0,100,750,900)}
 else if(th==='fog'){g.fillStyle='rgba(150,166,182,.2)';g.fillRect(0,100,750,900)}
 else if(th==='inferno'){g.fillStyle='rgba(120,12,30,.26)';g.fillRect(0,100,750,900);g.globalCompositeOperation='lighter';for(let k=0;k<5;k++)drawGlow(60+k*120,470+Math.sin(frame*2+k)*6,90,'r',.22);drawGlow(300,420,260,'o',.12);g.globalCompositeOperation='source-over'}
 else if(th==='dawn'){g.fillStyle='rgba(255,96,40,.1)';g.fillRect(0,100,750,900);g.globalCompositeOperation='lighter';drawGlow(560,330,260,'o',.16);g.globalCompositeOperation='source-over'}
 g.restore()}
// 원경 좀비 무리: 계속 꿈틀거리며 다가옴 (떼 습격 때 밀도·속도 증가)
let crowdSpr=null;
function farCrowd(){if(!crowdSpr){crowdSpr=[];for(let f=0;f<4;f++){const cv=mkCanvas(20,28),x=cv.getContext('2d');x.fillStyle='#1d1b27';x.strokeStyle='#1d1b27';x.lineCap='round';x.beginPath();x.arc(11,6,3.4,0,TAU);x.fill();x.fillRect(7,9,6,10);x.lineWidth=2;x.beginPath();x.moveTo(12,12);x.lineTo(18,11+f%2);x.moveTo(9,19);x.lineTo(7+(f-1.5)*1.6,27);x.moveTo(11,19);x.lineTo(13-(f-1.5)*1.6,27);x.stroke();crowdSpr.push(cv)}}
 const n=Math.min(qualityLow?40:110,Math.round((qualityLow?26:48)*Math.min(3.4,crowd)));g.save();for(let i=0;i<n;i++){const spd=6+noise(i*3.1)*10*(.6+crowd*.4);const x=((noise(i*7.3)*760+frame*spd)%780)-20,y=478+noise(i*5.7+1)*78,s=.75+noise(i*2.3)*.6+(y-478)/140;if(x>575)continue;
  const bob=Math.sin(frame*(5+noise(i)*3)+i)*1.4;g.globalAlpha=.42+(y-478)/220;g.drawImage(crowdSpr[(Math.floor(frame*6+i))%4],x-10*s*.55,y-27*s*.55+bob,20*s*.55,28*s*.55)}
 if(crowd>1.3){g.globalAlpha=(crowd-1.3)*.18;g.fillStyle='#b8402a';g.fillRect(0,440,560,130)}g.restore()}
let rainCache=null,fogSpr=null;
function fogLayer(){if(theme()!=='fog')return;if(!fogSpr){fogSpr=mkCanvas(64,64);const x=fogSpr.getContext('2d'),gr=x.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(205,215,225,.9)');gr.addColorStop(1,'rgba(205,215,225,0)');x.fillStyle=gr;x.fillRect(0,0,64,64)}
 g.save();g.fillStyle=grad(0,0,430,0,[[0,'rgba(196,206,218,.55)'],[.55,'rgba(196,206,218,.22)'],[1,'rgba(196,206,218,0)']]);g.fillRect(0,440,430,560);
 const n=qualityLow?6:12;for(let i=0;i<n;i++){const x=((noise(i*4.1)*900+frame*(8+noise(i)*10))%900)-150,y=560+noise(i*7.7)*400,r=110+noise(i*2.2)*90;g.globalAlpha=.24;g.drawImage(fogSpr,x-r,y-r*.5,r*2,r)}g.restore()}
function weather(){const th=theme();if(th==='storm'){g.save();g.strokeStyle='rgba(200,215,245,.5)';g.lineWidth=1.6;g.beginPath();const n=qualityLow?40:90;for(let i=0;i<n;i++){const x=(noise(i*3.3)*820+frame*-160*(1+noise(i)))%820,y=((noise(i*9.1)*900+frame*900*(.8+noise(i*2)*.4))%880)+120;const xx=x<0?x+820:x;g.moveTo(xx,y);g.lineTo(xx-7,y+22)}g.stroke();g.restore()}
 if((th==='dawn'||th==='inferno')&&!qualityLow&&Math.random()<(th==='inferno'?.6:.25))emit('fire',rand(0,560),rand(560,990),rand(-10,10),-rand(30,70),rand(1,2),rand(1.5,3),'',{grow:-1})}
// 정전: 어둠 레이어에 빛 구멍(총구·폭발·탑 조명)
let darkCv=null;
function blackout(){if(blackoutT<=0)return;const a=Math.min(1,blackoutT/1.2,(14-blackoutT)/1.0+.1)*.9;if(!darkCv)darkCv=mkCanvas(375,440);const d=darkCv.getContext('2d');d.setTransform(1,0,0,1,0,0);d.globalCompositeOperation='source-over';d.clearRect(0,0,375,440);d.fillStyle=`rgba(3,5,12,${a})`;d.fillRect(0,0,375,440);d.setTransform(.5,0,0,.5,0,0);d.globalCompositeOperation='destination-out';
 const hole=(x,y,r,k=1)=>{d.globalAlpha=k;d.drawImage(glow.w,x-r,y-120-r,r*2,r*2)};
 for(let i=0;i<5;i++){const m=MOUNTS[i];if(levels[i]>0&&m.floor>=0&&m.floor<=floorsBuilt){const [mx,my]=muzzle(i);hole(mx,my,60+flash[i]*900,1);hole(m.x,m.y,70,.7)}}
 hole(600,880,120,.6);let c2=0;for(let k=0;k<parts.n&&c2<40;k++){const p=parts.a[k];if((p.type==='glow'||p.type==='fire')&&p.size>12){hole(p.x,p.y,p.size*2.4,.8);c2++}}
 for(const b of beams){if(b.type==='bolt')for(const [x,y] of b.pts)hole(x,y,70,.9);if(b.type==='jet')hole(b.tx,b.ty,60,.7)}
 for(const c of crates)hole(c.x,c.y-20,60,.8);for(const r of runners)if(!r.done)hole(r.x,r.y-30,55,.9);
 d.globalAlpha=1;g.drawImage(darkCv,0,120,750,880)}
function towerCut(){return buildAnim?buildAnim.cur:FLOORS[Math.min(4,floorsBuilt)].cut}
function scaffold(y,prog){const x0=474,x1=736;g.save();
 for(let x=x0;x<=x1;x+=44){box(x-3,y-72,6,70,2,'#c9a24a',2)}
 g.strokeStyle='#8a6a24';g.lineWidth=3;for(let x=x0;x<x1-40;x+=44){g.beginPath();g.moveTo(x,y-6);g.lineTo(x+44,y-68);g.stroke()}
 box(x0-6,y-76,x1-x0+12,8,2,'#d4ad55',2);box(x0-8,y-8,x1-x0+16,12,3,vg(y-8,y+4,'#8a6a44','#5b4630'),2.5);hazard(x0+14,y-44,88,7);
 const cx=706;box(cx-5,y-180,10,108,2,'#e0b33c',2);for(let k=0;k<5;k++){g.strokeStyle='#9a7a24';g.lineWidth=2;g.beginPath();g.moveTo(cx-5,y-176+k*21);g.lineTo(cx+5,y-158+k*21);g.stroke()}
 box(cx-138,y-188,170,9,2,'#e0b33c',2);box(cx+8,y-196,22,18,3,'#4a505c',2);
 const sw=Math.sin(frame*1.3)*7;g.strokeStyle='#1a1a1a';g.lineWidth=1.5;g.beginPath();g.moveTo(cx-112,y-180);g.lineTo(cx-112+sw,y-118);g.stroke();box(cx-122+sw,y-120,20,12,2,'#5a5f69',1.5);
 if(prog!==undefined){box(cx-130+sw*.4,y-110,46,14,3,'#8d96a3',1.5)}
 const bl=Math.sin(frame*5)>0;g.globalCompositeOperation='lighter';drawGlow(cx,y-192,bl?22:12,'o',bl?.9:.5);g.restore()}
function tower(){const im=imgs[TOWER.img];const cut=towerCut();
 if(im){const sy=cut/1460*im.height;g.drawImage(im,0,sy,im.width,im.height-sy,TOWER.x,TOWER.y+cut*TS,TOWER.w,TOWER.h-cut*TS)}
 if(cut>2)scaffold(TOWER.y+cut*TS);
 if(towerHitT>0){g.save();g.globalCompositeOperation='lighter';g.globalAlpha=towerHitT*1.5;g.drawImage(glow.r,470,Math.max(420,TOWER.y+cut*TS),300,580);g.restore()}
 if(cut<=2){const p=(Math.sin(frame*3)+1)*.5;g.save();g.globalCompositeOperation='lighter';drawGlow(ANT.x,ANT.y,8+p*7+(STAGES[stageIdx].signal?signal*.3:0),STAGES[stageIdx].signal?'g':'c',.7+p*.3);g.restore()}
if(!noTurrets){for(let i=0;i<5;i++)drawTurret(i);for(let i=0;i<5;i++)drawOperator(i)}}
function drawField(){g.save();if(screenShake>0)g.translate(rand(-screenShake,screenShake),rand(-screenShake,screenShake)*.7);backdrop();themeEnv();farCrowd();
 for(let k=0;k<decals.n;k++)drawDecal(decals.a[k]);
 for(const e of events)if(e.kind==='quake'){const u=e.t/e.dur,x=e.x0+(585-e.x0)*u;g.save();g.globalAlpha=1-u*.5;puffless(x,e.y);g.restore()}
 for(let k=0;k<corpses.n;k++)drawCorpse(corpses.a[k]);
 const list=[];for(const z of zs)if(z.x>-120&&z.x<680)list.push([z.y,0,z]);for(const r of runners)list.push([r.y,1,r]);for(const c of crates)if(c.landed)list.push([c.y,2,c]);
 list.sort((a,b)=>a[0]-b[0]);for(const [,k,o] of list){if(k===0)drawZombie(o);else if(k===1)drawRunner(o);else drawCrate(o)}
 fogLayer();for(const b of barrels)drawBarrel(b);
 drawEvents(false);
 tower();
 for(const c of crates)if(!c.landed)drawCrate(c);
 drawParticles(false);drawProjectiles();
 g.save();g.globalCompositeOperation='lighter';drawParticles(true);g.restore();
 drawBeams();drawEvents(true);weather();
 g.restore();blackout();
 for(const d of drops)drawDrop(d);
 for(const f of floaters){g.save();g.globalAlpha=Math.min(1,f.life/f.max*1.6);const s=f.big?28:21,pop=1+Math.max(0,f.life/f.max-.75)*1.6;txt(typeof f.val==='number'?'-'+f.val:f.val,f.x,f.y,s*pop,f.col,'center');g.restore()}
 if(screenFlash>0){g.fillStyle=`rgba(${screenFlashCol},${Math.min(.5,screenFlash)})`;g.fillRect(0,122,750,878)}}
function drawBattle(){drawField();if(feverT>0){const p=.5+.5*Math.sin(frame*10),a=Math.min(1,feverT)*(.5+.3*p);g.save();g.globalAlpha=a;g.fillStyle=grad(0,0,90,0,[[0,'rgba(255,190,60,.7)'],[1,'rgba(255,190,60,0)']]);g.fillRect(0,122,90,878);g.fillStyle=grad(750,0,660,0,[[0,'rgba(255,190,60,.7)'],[1,'rgba(255,190,60,0)']]);g.fillRect(660,122,90,878);g.restore()}
 if(cine){const k=Math.min(1,cine.t/.4,(2.6-cine.t)/.4);g.fillStyle='#000';g.fillRect(0,122,750,90*k);g.fillRect(0,1000-90*k,750,90*k);g.save();g.globalAlpha=k;txt('BOSS',375,430,30,'#ff6a5a','center');txt(LL(cine.name),375,486,54,'#ffe2a0','center');g.restore()}
 if(waveCardT>0&&!cine){const k=Math.min(1,waveCardT/.4,(2.4-waveCardT)/.3+.2);g.save();g.globalAlpha=Math.max(0,k);txt('WAVE '+wave,375,420,58,'#ffe2a0','center');txt(wave===wavesTotal?L('마지막 웨이브!','最后一波！'):wave+' / '+wavesTotal,375,474,26,'#fff','center');g.restore()}
 drawUI();drawSkillButtons();tutorialHint();
 if(tutorialT>0&&!dialog&&!paused)drawTutorial();
 if(perkPick&&!dialog)drawPerkPick();
 if(dialog)drawDialog();
 if(paused)drawPauseMenu()}
function puffless(x,y){g.strokeStyle='#e8c49a';g.lineWidth=4;g.beginPath();g.ellipse(x,y,30,9,0,0,TAU);g.stroke();g.fillStyle='rgba(120,100,80,.35)';g.beginPath();g.ellipse(x,y-6,22,14,0,0,TAU);g.fill()}
const cardIcons=[];
function buildCardIcon(i){const m=MOUNTS[i],a=m.art,bi=imgs[m.key+'_base'],br=imgs[m.key+'_barrel'];if(!bi||!br)return null;
 const cv=mkCanvas(220,170),x=cv.getContext('2d');x.globalCompositeOperation='lighter';x.globalAlpha=.45;x.drawImage(glow[['y','b','o','r','c'][i]],10,0,200,170);x.globalAlpha=1;x.globalCompositeOperation='source-over';
 const ang=i===2?PI+.5:PI,ca=Math.cos(ang),sa=Math.sin(ang);
 // 경계 계산 후 카드에 맞춤
 const pts=[[-a.post[0],-a.post[1]],[bi.width-a.post[0],bi.height-a.post[1]]];for(const [px,py] of [[0,0],[br.width,0],[0,br.height],[br.width,br.height]]){const lx=px-a.piv[0],ly=py-a.piv[1],r=ang-a.inh;pts.push([lx*Math.cos(r)-ly*Math.sin(r),lx*Math.sin(r)+ly*Math.cos(r)])}
 let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const [px,py] of pts){x0=Math.min(x0,px);y0=Math.min(y0,py);x1=Math.max(x1,px);y1=Math.max(y1,py)}
 const sc=Math.min(204/(x1-x0),156/(y1-y0)),cx=110-(x0+x1)/2*sc,cy=85-(y0+y1)/2*sc;
 x.drawImage(bi,cx-a.post[0]*sc,cy-a.post[1]*sc,bi.width*sc,bi.height*sc);x.save();x.translate(cx,cy);x.rotate(ang-a.inh);x.drawImage(br,-a.piv[0]*sc,-a.piv[1]*sc,br.width*sc,br.height*sc);x.restore();return cv}
function buildCardIcons(){for(let i=0;i<5;i++)if(!cardIcons[i])cardIcons[i]=buildCardIcon(i)}

function drawBarrel(b){const bi=imgs.o_barrel;if(bi){g.save();g.translate(b.x,b.y+b.drop);const p=.5+.5*Math.sin(b.t*8);g.globalAlpha=.3;g.fillStyle='#110e1a';g.beginPath();g.ellipse(0,0,20,6,0,0,TAU);g.fill();g.globalAlpha=1;const h=54,w=h*bi.width/bi.height;g.drawImage(bi,-w/2,-h+3,w,h);
  g.save();g.globalCompositeOperation='lighter';drawGlow(w*.18,-h+4,8+p*7,'r',.6+.4*p);g.restore();
  if(barrelHint>0&&b.drop>=0){g.globalAlpha=.7+.3*p;box(-30,-90,60,24,10,'#3a1410ee',2);txt(L('터치!','点击！'),0,-78,15,'#ffd8a8','center',false);poly([-6,-66,6,-66,0,-58],'#ffd8a8',1.2)}g.restore();return}
 g.save();g.translate(b.x,b.y+b.drop);const p=.5+.5*Math.sin(b.t*8);
 g.globalAlpha=.3;g.fillStyle='#110e1a';g.beginPath();g.ellipse(0,0,20,6,0,0,TAU);g.fill();g.globalAlpha=1;
 box(-15,-40,30,40,5,vg(-40,0,'#e8503a','#b52a1e','#6e140e'),2.5);g.beginPath();g.ellipse(0,-40,15,5,0,0,TAU);inked('#c9402e',2);
 g.strokeStyle='#5a1008';g.lineWidth=2;for(const yy of [-28,-12]){g.beginPath();g.moveTo(-15,yy);g.lineTo(15,yy);g.stroke()}
 g.beginPath();g.moveTo(0,-26);g.quadraticCurveTo(7,-20,4,-15);g.quadraticCurveTo(0,-12,-4,-15);g.quadraticCurveTo(-7,-20,0,-26);g.fillStyle='#ffd23a';g.fill();
 g.save();g.globalCompositeOperation='lighter';drawGlow(0,-46,8+p*6,'r',.6+.4*p);g.restore();
 if(barrelHint>0&&b.drop>=0){g.globalAlpha=.7+.3*p;box(-30,-82,60,24,10,'#3a1410ee',2);txt(L('터치!','点击！'),0,-70,15,'#ffd8a8','center',false);poly([-6,-58,6,-58,0,-50],'#ffd8a8',1.2)}
 g.restore()}
function drawPerkPick(){const P2=perkPick;P2.t+=1/60;g.fillStyle='rgba(5,7,14,.78)';g.fillRect(0,0,750,1334);
 txt(L('보급 선택','补给选择'),375,330,44,'#ffe2a0','center');txt(L('하나를 골라 이번 작전에 적용','选择一项，本次行动生效'),375,382,19,'#c9d2de','center',false);if(!rerolled){button(215,800,320,70,'','blue');iconCell(262,835,13);txt(L('광고로 다시 뽑기','看广告重新抽取'),390,835,20,'#eaf4ff','center')}
 P2.opts.forEach((o,i)=>{const k=clamp((P2.t-i*.08)/.25,0,1),x=40+i*230,y=430+(1-k)*60;g.save();g.globalAlpha=k;
  const fr=imgs.ui_card_sel;if(fr)g.drawImage(fr,x-6,y-6,222,340);else panel(x,y,210,328,'#1d2232','#ffcf6a');rr(x+14,y+16,182,296,12,'#121826ee',null);
  const cx=x+105,cy=y+100;if(o.k==='dmg'){if(!cardIcons[o.w])buildCardIcons();if(cardIcons[o.w])g.drawImage(cardIcons[o.w],cx-80,cy-62,160,124)}
  else if(o.k==='rate'){iconBolt(cx-20,cy,26);iconBolt(cx+20,cy,26)}else if(o.k==='repair')iconCross(cx,cy,36);else if(o.k==='scrap'){iconNut(cx-22,cy+10,22);iconNut(cx+18,cy-8,26)}else if(o.k==='scrapMul'){iconNut(cx,cy,32);txt('+%',cx+30,cy+30,22,'#9dff9d','center')}
  else if(o.k==='skill')iconPlane(cx,cy,52);else if(o.k==='energy')iconCell(cx,cy,36);else if(o.k==='armor')iconBeam(cx,cy,36);else if(o.k==='barrels'){g.save();g.translate(cx,cy+34);g.scale(1.6,1.6);drawBarrel({x:0,y:0,drop:0,t:frame});g.restore()}else{g.save();g.globalCompositeOperation='lighter';drawGlow(cx,cy,60,'o',.8);g.restore();iconStar(cx,cy,34,true)}
  txt(LL(o.name),cx,y+196,23,'#fff4dc','center');paragraphs(o.k==='dmg'?LL(weapon[o.w].name)+' '+LL(o.desc):o.k==='scrap'?LL(o.desc)+' +'+o.v:LL(o.desc),x+26,y+238,16,'#c9d2de',170,24);
  g.restore()})}

// ---------------------------------------------------------------- 전투 UI
function drawUI(){const S=SD();
 g.fillStyle='#111322f2';g.fillRect(0,0,750,122);g.fillStyle='#181a2b';g.fillRect(0,1000,750,334);
 iconBtn(14,16,86,paused?'play':'pause');
 plate(112,18,296,76);txt(endless?LL(S.name)+L(' · 최고 ',' · 最高 ')+save.endlessBest:(S.ch+1)+'-'+(stageIdx%4+1)+'  '+LL(S.name),134,42,17,endless?'#ff9aba':CH[S.ch].col);txt(L('웨이브 ','波次 ')+Math.max(1,wave)+(endless?'':' / '+wavesTotal),134,72,25,'#ffdb63');
 plate(422,18,306,76);const ps=1+hudPulse.scrap*1.2,pe=1+hudPulse.energy*1.2;g.save();g.translate(455,57);g.scale(ps,ps);iconNut(0,0,15);g.restore();txt(''+coins,477,57,29,'#ffce55');
 g.save();g.translate(612,57);g.scale(pe,pe);iconBolt(0,0,15);g.restore();txt(''+Math.floor(energy),632,57,27,'#93e7fd');
 plate(21,132,342,96);txt(L('이번 작전 획득','本次获得'),40,146,14,'#9fb0c4','left',false);
 g.save();g.translate(58,168);g.scale(1+hudPulse.mat,1+hudPulse.mat);iconBeam(0,0,12);g.restore();txt(''+loot.mat,76,169,20,'#ffd8a8');
 g.save();g.translate(178,168);g.scale(1+hudPulse.parts,1+hudPulse.parts);iconGear(0,0,11);g.restore();txt(''+loot.parts,195,169,20,'#bfe2ff');
 crewNow().forEach((w,k)=>face(w,52+k*40,205,15));
 rr(24,236,339,14,6,'#1a1410',null);const fk=feverT>0?feverT/7:feverG/100;rr(26,238,335*clamp(fk,0,1),10,5,feverT>0?(Math.sin(frame*20)>0?'#fff0a0':'#ffb030'):'#d07a20',null);txt(feverT>0?L('아드레날린!','肾上腺素！'):L('아드레날린','肾上腺素'),30,244,11,feverT>0?'#fff':'#ffd8a8','left',false);
 plate(391,132,330,96);txt(L('탑 내구도','塔耐久'),410,150,16,'#cfe3ff','left',false);txt(Math.ceil(hp)+' / '+maxHP,700,150,16,hp/maxHP>.35?'#8df6ca':'#ff7679','right',false);
 rr(410,165,290,20,8,'#1a1e28',null);const hr=clamp(hp/maxHP,0,1);rr(412,167,286*hr,16,7,hr>.35?(towerHitT>0?'#ffd0d0':'#4fd38c'):'#ff5454',null);
 if(S.signal){txt(LL(S.gauge||['송신 ','发送 '])+Math.round(signal)+'%',410,205,15,'#a8ffd8','left',false);rr(480,198,220,12,5,'#1a2a24',null);rr(482,200,216*signal/100,8,4,'#6af0b8',null)}
 else{for(let k=0;k<3;k++)iconStar(424+k*26,206,10,hr>=[0,.35,.7][k]);txt(L('평가','评价'),506,206,14,'#9fb0c4','left',false)}
 if(bannerT>0){g.save();g.globalAlpha=Math.min(1,bannerT);if(imgs.ui_warn)g.drawImage(imgs.ui_warn,95,252,560,80);else rr(166,256,420,66,6,'#781c2be8','#f46a73',4);txt(banner,376,292,banner.length>18?20:banner.length>13?23:27,'#fff5d5','center');g.restore()}
 panel(14,1006,722,316,'#141724','#b38c55',14);txt(L('탑 무장','塔武装'),34,1036,23,'#fff4dc');g.save();txt(L('좀비가 떨군 ','用僵尸掉落的 '),150,1036,15,'#a9b3c2','left',false);g.restore();
 iconNut(LANG==='zh'?290:262,1036,9);txt(L('고철로 설치·강화   ▲ = 지금 강화 가능','废铁安装·强化  ▲ = 现在可强化'),LANG==='zh'?304:276,1036,15,'#a9b3c2','left',false);
 for(let j=0;j<5;j++)drawCard(j);
 button(22,1252,170,56,L('배속 ×','倍速 ×')+speed,'blue',22);button(204,1252,200,56,L('작전 메뉴','作战菜单'),'gold',22);
 rr(418,1254,312,52,12,'#1b1f2a','#4a5260',2);txt(L('남은 적 ','剩余敌人 ')+(toSpawn+zs.length+pending*3>0?(toSpawn+zs.length):0),574,1281,20,'#f5e7ce','center');
 if(qualityLow)txt(L('절약','省电'),722,112,13,'#8b9aa4','right',false)}
function drawCard(j){const x=28+j*142,y=1058,wi=save.equip[j],built=j<=floorsBuilt,sel=weaponSlot===j;
 const tex=imgs[sel?'ui_card_sel':'ui_card'];if(tex){if(sel)g.drawImage(tex,x-5,y-5,140,142);else g.drawImage(tex,x,y,130,132)}else panel(x,y,130,132,'#29313a','#7e8794',14);
 if(!built){g.save();g.globalAlpha=.5;rr(x+10,y+10,110,112,10,'#05070c',null);g.restore();iconLock(x+65,y+58,16);txt(LL(FLOORS[j].name),x+65,y+24,14,'#9aa3ae','center');
  rr(x+2,y+136,126,40,9,'#0e121bee','#3a4250',2);txt(L('미건설','未建造'),x+65,y+150,14,'#8b98a8','center',false);g.save();iconBeam(x+40,y+166,7);g.restore();txt(''+FLOORS[j].cost,x+52,y+166,13,'#8b98a8','left',false);return}
 if(wi<0){txt(LL(FLOORS[j].name),x+65,y+24,14,'#c9d2de','center');txt(L('빈 거치대','空炮位'),x+65,y+68,15,'#8b98a8','center',false);rr(x+2,y+136,126,40,9,'#0e121bee','#3a4250',2);txt(L('기지에서 장착','在基地装备'),x+65,y+156,13,'#8b98a8','center',false);return}
 const lev=levels[wi],cost=costOf(wi),can=coins>=cost&&lev<5;
 if(!cardIcons[wi])buildCardIcons();if(cardIcons[wi]){g.save();if(!lev)g.globalAlpha=.55;g.drawImage(cardIcons[wi],x+15,y+32,100,77);g.restore()}
 txt(LL(weapon[wi].name),x+65,y+24,17,lev?'#fff4dc':'#c9d2de','center');
 for(let k=0;k<5;k++){g.fillStyle=k<lev?weapon[wi].col:'#2a2f3a';g.strokeStyle=OUT;g.lineWidth=1.2;pathRect(x+22+k*18,y+108,14,8,3);g.fill();g.stroke()}
 if(save.tier[wi]>0)txt('★'+save.tier[wi],x+112,y+108,12,'#ffd65a','right',false);
 const pulse=.5+.5*Math.sin(frame*6);
 rr(x+2,y+136,126,40,9,can?(lev?'#173a26ee':'#1d3a2aee'):'#0e121bee',can?`rgba(140,255,180,${.5+.5*pulse})`:'#3a4250',can?3:2);
 if(lev>=5)txt('MAX',x+65,y+156,18,'#ffd65a','center');
 else{txt(lev?L('강화 ','强化 ')+'Lv'+(lev+1):L('설치','安装'),x+65,y+147,13,can?'#d8ffe4':'#c9d2de','center',false);costTag(x+65,y+165,iconNut,cost,can?'#9dff9d':'#ff9a8a',14)}
 if(can){g.save();g.translate(x+118,y+10);g.scale(1+pulse*.12,1+pulse*.12);g.beginPath();g.arc(0,0,15,0,TAU);inked('#2fbf5a',2.5);poly([0,-9,8,3,-8,3],'#ffffff',1.5);g.fillStyle='#fff';g.fillRect(-3,2,6,6);g.restore()}}
const SK_COL=[['#ff9a3a','#5a2a10','o'],['#5ab8ff','#10284a','b'],['#7ff0ff','#0e3a48','c']];
function skPath(x,y,w,h){const c=12;g.beginPath();g.moveTo(x+c,y);g.lineTo(x+w,y);g.lineTo(x+w,y+h-c);g.lineTo(x+w-c,y+h);g.lineTo(x,y+h);g.lineTo(x,y+c);g.closePath()}
function drawSkillButtons(){const names=[L('공습','空袭'),'EMP',L('빙결','冰冻')];
 // 도크: 필드 하단 왼쪽 금속 띠
 g.save();g.fillStyle=grad(0,893,0,1000,[[0,'rgba(10,12,20,0)'],[.35,'rgba(10,12,20,.78)'],[1,'rgba(10,12,20,.92)']]);g.beginPath();g.moveTo(0,893);g.lineTo(372,893);g.lineTo(392,1000);g.lineTo(0,1000);g.closePath();g.fill();
 g.strokeStyle='#b38c5566';g.lineWidth=2;g.beginPath();g.moveTo(0,894);g.lineTo(372,894);g.lineTo(392,1000);g.stroke();g.restore();
 for(let i=0;i<3;i++){const x=12+i*120,y=902,w=110,h=90,k=skillCD[i],ready=k<=0,open=skillOpen(i),aff=energy>=SKILL_COST[i],C=SK_COL[i],on=open&&ready&&aff;
  g.save();skPath(x,y,w,h);g.fillStyle=grad(0,y,0,y+h,[[0,open?C[1]:'#1a1d26'],[1,'#07080d']]);g.fill();g.clip();
  if(on){const p=.5+.5*Math.sin(frame*4+i);g.globalCompositeOperation='lighter';drawGlow(x+w*.5,y+h*.42,58,C[2],.35+.2*p);
   const sx=x-60+((frame*90+i*70)%(w+160));g.globalAlpha=.18;g.fillStyle='#ffffff';g.beginPath();g.moveTo(sx,y);g.lineTo(sx+22,y);g.lineTo(sx-8,y+h);g.lineTo(sx-30,y+h);g.closePath();g.fill();g.globalAlpha=1;g.globalCompositeOperation='source-over'}
  g.fillStyle=open?C[0]:'#3a3f4a';g.fillRect(x,y,w,4);
  const cx=x+w*.5,cy=y+38;
  if(!open){iconLock(cx,cy,13);g.restore();skPath(x,y,w,h);g.strokeStyle='#3a404c';g.lineWidth=2;g.stroke();txt(L('잠김','锁定'),cx,y+74,14,'#6f7888','center',false);continue}
  if(!on)g.globalAlpha=.55;
  if(i===0){iconPlane(cx-4,cy-6,30);iconBomb(cx+12,cy+15,8)}else if(i===1)iconBolt(cx,cy,19);else iconFlake(cx,cy,18);
  g.globalAlpha=1;
  if(!ready){const f=k/SKILL_CD[i];g.fillStyle='rgba(4,6,10,.72)';g.fillRect(x,y+h*(1-f),w,h*f);g.fillStyle=C[0];g.fillRect(x,y+h*(1-f)-2,w,2);txt(Math.ceil(k)+'',cx,cy,28,'#ffffff','center')}
  g.fillStyle='rgba(0,0,0,.45)';g.fillRect(x,y+h-24,w,24);
  txt(names[i],x+10,y+h-12,15,on?'#fff4dc':'#a9b3c2','left',false);
  g.save();iconBolt(x+w-34,y+h-12,6);g.restore();txt(''+SKILL_COST[i],x+w-26,y+h-12,14,aff?'#bff4ff':'#ff8a7a','left',false);
  g.restore();
  skPath(x,y,w,h);g.strokeStyle=on?C[0]:'#4a5260';g.lineWidth=on?2.5:2;g.stroke();
  if(on){g.save();g.globalAlpha=.4+.3*Math.sin(frame*5+i);g.strokeStyle=C[0];g.lineWidth=6;skPath(x-1,y-1,w+2,h+2);g.stroke();g.restore()}}}
function drawTutorial(){if(stageIdx!==0||wave<1)return;const j=0,x=28+j*142,y=1058;const wi=save.equip[0];if(wi<0||levels[wi]>=5)return;if(coins<costOf(wi))return;
 const p=.5+.5*Math.sin(frame*6);g.save();g.globalAlpha=.85;rr(x+20,y-80,240,50,12,'#1d3a2af2','#9fffbf',3);txt(L('▼ 고철이 모였다! 눌러서 강화','▼ 废铁够了！点击强化'),x+140,y-55,17,'#e6ffe8','center',false);g.restore();
 g.save();g.strokeStyle=`rgba(160,255,190,${.6+.4*p})`;g.lineWidth=4;pathRect(x-4,y-4,138,184,14);g.stroke();g.restore()}
function drawDialog(){const ln=dialog.lines[dialog.i];if(!ln)return;const who=ln[0],text=LL(ln[1]);const n=Math.min(text.length,Math.floor(dialog.t*38));
 g.save();g.fillStyle='rgba(5,7,14,.55)';g.fillRect(0,122,750,878);g.restore();
 g.fillStyle=grad(0,980,0,1334,[[0,'#0a0d16f0'],[1,'#05070cff']]);g.fillRect(0,990,750,344);
 panel(18,1010,714,300,'#141a28f2','#c69a5a',16);
 if(!who){paragraphs(text.slice(0,n),48,1080,25,'#ffe4a2',640,40);if(n>=text.length&&Math.sin(frame*6+dialog.t*6)>-.3)txt('▼ '+L('터치','点击'),712,1288,16,'#ffcf7a','right',false);return}
 if(who&&SURV[who]){portrait(who,36,1030,150);txt(LL(SURV[who].name),206,1046,28,'#ffe4a2');txt(LL(SURV[who].role),206+g.measureText(LL(SURV[who].name)).width+16,1048,16,'#9fb0c4','left',false)}
 paragraphs(text.slice(0,n),206,1098,23,'#f0eff7',500,36);
 if(n>=text.length&&Math.sin(frame*6+dialog.t*6)>-.3)txt('▼ '+L('터치','点击'),712,1288,16,'#ffcf7a','right',false);
 txt((dialog.i+1)+' / '+dialog.lines.length,36,1288,14,'#7a8698','left',false)}
function drawPauseMenu(){g.fillStyle='#05080fd8';g.fillRect(0,0,750,1334);panel(70,300,610,700,'#161c2c','#c69a5a',18);txt(L('작전 메뉴','作战菜单'),375,355,36,'#ffe2a0','center');
 button(130,410,490,80,L('▶ 계속하기','▶ 继续'),'green',28);button(130,510,490,80,L('다시 시작','重新开始'),'gold',28);button(130,610,490,80,L('작전 지도로','返回地图'),'blue',28);
 button(130,730,235,66,L('화질: ','画质：')+(qualityLow?L('절약','省电'):L('높음','高')),'gray',20);button(385,730,235,66,L('흔들림: ','晃动：')+(shakeReduced?L('끔','关'):L('켬','开')),'gray',20);
 button(130,816,235,66,'🌐 '+(LANG==='zh'?'中文':'한국어'),'gray',20);button(385,816,235,66,L('음악: ','音乐：')+(Music.on?L('켬','开'):L('끔','关')),'gray',20);
 button(130,898,235,66,L('작전 안내서','作战指南'),'blue',20);button(385,898,235,66,L('효과음: ','音效：')+onoff(AudioFx.enabled),'gray',20)}

// ---------------------------------------------------------------- 화면: 타이틀 · 스토리 · 지도 · 기지 · 결과 · 건설 · 엔딩
function title(){g.fillStyle='#0b0e18';g.fillRect(0,0,750,1334);img('cover_v8',0,0,750,700,1);g.fillStyle=grad(0,380,0,1000,[[0,'#0b0e1800'],[.55,'#0b0e18f0'],[1,'#0b0e18']]);g.fillRect(0,360,750,974);
 g.save();g.globalCompositeOperation='lighter';drawGlow(375,690,260,'o',.25+.08*Math.sin(frame*2));g.restore();
 txt('DEAD RUSH',375,660,92,'#ffcf6a','center');txt(L('마지막 신호','最后的信号'),375,745,42,'#ffffff','center');txt(L('생존자들과 함께, 한 층씩 탑을 쌓아 구조 신호를 보내라','与幸存者一起，一层层建塔，发出求救信号'),375,800,19,'#c9d2de','center',false);
 const cont=save.cleared>0||save.seenIntro;button(150,870,450,92,cont?L('작전 이어하기','继续行动'):L('작전 개시','开始行动'),'gold',34);
 button(150,982,450,76,L('기지 · 탑 건설','基地 · 建塔'),'blue',26);button(150,1074,218,70,L('작전 안내서','作战指南'),'gray',21);button(382,1074,218,70,L('설정','设置'),'gray',21);
 rr(560,24,170,54,12,'#151a28d8','#9fb4e8',2);txt(LANG==='zh'?'🌐 한국어':'🌐 中文',645,51,21,'#fff','center');
 if(LANG==='zh'){txt('抵制不良游戏，拒绝盗版游戏。注意自我保护，谨防受骗上当。',375,1196,15,'#8a96a8','center',false);txt('适度游戏益脑，沉迷游戏伤身。合理安排时间，享受健康生活。',375,1222,15,'#8a96a8','center',false)}
 txt('v12 · '+L('진행 ','进度 ')+save.cleared+' / '+STAGES.length,375,1300,14,'#5f6a7a','center',false)}
let storyIndex=0;
function story(){g.fillStyle='#111322';g.fillRect(0,0,750,1334);img(storyIndex%2?'story_v8':'cover_v8',0,0,750,700,.92);g.fillStyle=grad(0,370,0,1000,[[0,'#10162300'],[.65,'#0b101eef'],[1,'#0b101eff']]);g.fillRect(0,350,750,900);
 const S=STORY[storyIndex];rr(35,750,680,420,18,'#111a2be9','#c68f54',4);txt(L('기록 ','记录 ')+(storyIndex+1)+' / '+STORY.length,61,790,20,'#e5ad69');txt(LL(S[0]),62,850,42,'#ffe4a2');
 paragraphs(LL(S[1]),61,917,25,'#f0eff7',620,42);paragraphs(LL(S[2]),61,1083,20,'#88ecdf',624,31);
 button(125,1215,500,82,storyIndex===STORY.length-1?L('작전 지도 ▶','作战地图 ▶'):L('다음 ▶','下一页 ▶'),'red',30);txt(L('건너뛰기','跳过'),700,52,18,'#9fb0c4','right',false)}
function nodePos(s){const c=Math.floor(s/4),j=s%4;return [108+j*178,214+c*157+(j%2?12:-6)]}
function mapScreen(){g.fillStyle='#0d111b';g.fillRect(0,0,750,1334);g.save();if(imgs.bg_map){g.drawImage(imgs.bg_map,0,0,750,1334);g.fillStyle='rgba(10,12,20,.38)';g.fillRect(0,0,750,1334)}else{g.globalAlpha=.25;img('story_v8',0,0,750,1000)}g.restore();if(!imgs.bg_map){g.fillStyle=grad(0,0,0,1334,[[0,'#0d111bcc'],[.5,'#0d111bee'],[1,'#0d111b']]);g.fillRect(0,0,750,1334)}
 g.strokeStyle='#ffffff08';g.lineWidth=1;for(let x=0;x<750;x+=50){g.beginPath();g.moveTo(x,120);g.lineTo(x,1100);g.stroke()}for(let y=120;y<1100;y+=50){g.beginPath();g.moveTo(0,y);g.lineTo(750,y);g.stroke()}
 txt(L('작전 지도','作战地图'),30,56,36,'#ffe2a0');iconBeam(410,46,12);txt(''+save.mat,428,47,22,'#ffd8a8');iconGear(522,46,11);txt(''+save.parts,538,47,22,'#bfe2ff');
 {const G=nextGoal();rr(24,78,600,34,10,'#0d111bd8','#3a4250',1);txt(G[0],40,96,16,G[1],'left',false)}rr(640,18,86,94,14,'#171c28e8','#9fb4e8',2);txt('?',683,58,40,'#ffe2a0','center');txt(L('안내','指南'),683,96,14,'#c9d2de','center',false);
 for(let c=0;c<CH.length;c++){const y=142+c*157,on=save.cleared>=c*4;txt(LL(CH[c].name),30,y,18,on?CH[c].col:'#55606e','left');g.strokeStyle=on?CH[c].col+'55':'#2a3040';g.lineWidth=2;g.beginPath();g.moveTo(30,y+14);g.lineTo(720,y+14);g.stroke()}
 g.setLineDash([8,8]);g.strokeStyle='#ffffff30';g.lineWidth=4;g.beginPath();for(let s=0;s<STAGES.length;s++){const [x,y]=nodePos(s);s?g.lineTo(x,y):g.moveTo(x,y)}g.stroke();g.setLineDash([]);
 for(let s=0;s<STAGES.length;s++){const [x,y]=nodePos(s),open=s<=save.cleared,done=s<save.cleared,cur=s===Math.min(LAST,save.cleared),c=STAGES[s].ch;const p=.5+.5*Math.sin(frame*4);
  if(cur){g.save();g.globalCompositeOperation='lighter';drawGlow(x,y,60+p*10,'g',.45);g.restore()}
  g.beginPath();g.arc(x,y,32,0,TAU);inked(open?grad(0,y-32,0,y+32,[[0,done?'#5a4a2a':'#2f5a3a'],[1,'#141a24']]):'#1a1e28',3);g.strokeStyle=open?(done?'#ffcf6a':'#9fffbf'):'#3a4250';g.lineWidth=3;g.stroke();
  if(open)txt((c+1)+'-'+(s%4+1),x,y-1,20,'#fff','center');else iconLock(x,y,11);
  if(STAGES[s].ev.some(e=>e.t==='boss'))txt('☠',x+25,y-25,18,'#ff7a6a','center');
  if(done)for(let k=0;k<3;k++)iconStar(x-16+k*16,y+40,7,(save.stars[s]||0)>k);
  if(open)txt(LL(STAGES[s].name),x,y+(done?58:46),13,'#d8e0ea','center',false)}
 button(30,1150,330,84,L('기지 · 탑 건설','基地 · 建塔'),'blue',26);
 const eo=save.cleared>=8;button(390,1150,330,84,'',eo?'red':'gray');if(eo){txt(L('무한 습격','无尽袭击'),555,1180,26,'#fff0f0','center');txt(L('최고 웨이브 ','最高波次 ')+save.endlessBest,555,1212,15,'#ffc0c0','center',false)}else{iconLock(450,1192,12);txt(L('무한 습격','无尽袭击'),570,1180,22,'#a9b3c2','center');txt(L('2-4 클리어 시 해금','通关2-4后解锁'),570,1210,14,'#8b98a8','center',false)}
 button(30,1256,250,56,L('보상','奖励'),'gold',22);if(rewardBadge()){g.beginPath();g.arc(268,1260,11,0,TAU);g.fillStyle='#ff4a3a';g.fill();g.strokeStyle='#fff';g.lineWidth=2;g.stroke()}
 {const ab=adBoxLeft();button(292,1256,256,56,'',ab>0?'green':'gray');iconCell(322,1284,11);txt(L('보급 상자 ','补给箱 ')+ab+'/3',430,1284,19,ab>0?'#eafff0':'#8a96a8','center')}
 button(560,1256,160,56,L('처음 화면','标题'),'gray',18);
 if(save.cleared>=1&&save.floors===0)tip('map1',[['첫 작전 성공! 좀비가 떨군 자재로 탑을 올릴 수 있어요.','首战告捷！可以用僵尸掉落的建材建塔。'],['왼쪽 아래 「기지 · 탑 건설」에서 강화하고, 1-3을 깨면 1층을 지을 수 있어요.','在左下「基地·建塔」强化，通关1-3即可建造1层。'],['오른쪽 위 「?」 안내서에 전체 흐름이 정리돼 있어요.','右上「?」指南整理了完整流程。']]);
 const nb=nextBuild();if(nb>0){const p=.5+.5*Math.sin(frame*5);g.save();g.globalAlpha=.7+.3*p;rr(46,1112,300,32,10,'#1d3a2af2','#9fffbf',2);txt(L('▲ 새 층 건설 가능!','▲ 可以建造新楼层！'),196,1128,16,'#cfffe0','center',false);g.restore()}}
function nextBuild(){const f=save.floors+1;if(f>4)return 0;return save.cleared>=FLOORS[f].gate&&save.mat>=FLOORS[f].cost?f:0}
function tierCost(i){return Math.round(10*Math.pow(save.tier[i]+1,1.5))}
function armorCost(){return 15*(save.armor+1)+save.armor*save.armor*5}
const SUPS=[{k:'air',name:['공습 강화','空袭强化'],desc:['폭탄 피해 +20% · 2레벨마다 폭탄 +1','炸弹伤害 +20% · 每2级炸弹 +1'],icon:'bomb'},{k:'energy',name:['전력 회로','电力回路'],desc:['전력 충전 +15% · 시작 전력 +10','电力回复 +15% · 初始电力 +10'],icon:'bolt'},{k:'medic',name:['응급 수리','紧急修复'],desc:['웨이브 사이 수리 +2%','波次间修复 +2%'],icon:'cross'},{k:'scrap',name:['고철 수집','废铁收集'],desc:['시작 고철 +25','初始废铁 +25'],icon:'nut'}];
function supCost(k){const l=save.sup[k];return Math.round(12*Math.pow(l+1,1.45))}
function baseScreen(){autoEquip();g.fillStyle='#0d111b';g.fillRect(0,0,750,1334);if(imgs.bg_base){g.drawImage(imgs.bg_base,0,0,750,1334);g.fillStyle='rgba(8,10,18,.72)';g.fillRect(0,0,750,1334)}
 txt(L('생존 기지','生存基地'),30,58,34,'#ffe2a0');iconBeam(400,50,13);txt(''+save.mat,420,51,24,'#ffd8a8');iconGear(512,50,12);txt(''+save.parts,530,51,24,'#bfe2ff');rr(640,16,86,66,14,'#171c28e8','#9fb4e8',2);txt('?',683,49,36,'#ffe2a0','center');
 const tabs=[L('탑 건설','建塔'),L('무기 장착','武器装备'),L('지원 강화','支援强化')];tabs.forEach((t,k)=>{const x=24+k*238;rr(x,92,226,58,12,baseTab===k?'#3a2c18':'#171c28',baseTab===k?'#ffcf6a':'#3a4250',3);txt(t,x+113,121,22,baseTab===k?'#ffe2a0':'#9fb0c4','center')});
 if(baseTab===0)baseBuild();else if(baseTab===1)baseWeapons();else baseSupport();
 button(150,1220,450,80,L('◀ 작전 지도','◀ 作战地图'),'gold',26);
 if(baseTab===0)tip('base0',[['기지는 영구 성장 공간이에요. 전투에서 모은 🧱자재와 ⚙부품을 여기서 씁니다.','基地是永久成长空间。在这里使用战斗中收集的🧱建材和⚙零件。'],['탑 건설: 🧱자재로 새 층을 지으면 새 무기 자리와 동료가 생깁니다.','建塔：用🧱建材建造新楼层，解锁新炮位和伙伴。'],['층마다 필요한 스테이지 조건이 있어요. 조건은 각 층 칸에 표시됩니다.','每层有需要通关的关卡条件，显示在各楼层栏中。']]);
 else if(baseTab===1)tip('base1',[['무기 장착: 무기를 눌러 장착할 층을 바꿀 수 있어요. 위층일수록 사거리가 깁니다.','武器装备：点击武器更换楼层。楼层越高射程越远。'],['⚙부품으로 ★강화하면 그 무기의 피해가 영구히 올라갑니다.','用⚙零件★强化可永久提升该武器伤害。']]);
 else tip('base2',[['지원 강화: ⚙부품으로 공습·전력·수리·시작 고철을 영구히 강화합니다.','支援强化：用⚙零件永久强化空袭/电力/修复/初始废铁。']])}
function rowBox(y,h){rr(24,y,702,h,14,'#161c2a','#2e3646',2)}
function baseBuild(){// 탑 미리보기 + 층 목록
 g.save();rr(24,166,270,1030,14,'#121722','#2e3646',2);const im=imgs.tower_hd;if(im){const cut=FLOORS[save.floors].cut;const s=.62*TS*1.0;const W2=613*.41,H2=1460*.41,x0=40,y0=200;g.globalAlpha=.25;g.drawImage(im,x0,y0,W2,H2);g.globalAlpha=1;g.drawImage(im,0,cut,613,1460-cut,x0,y0+cut*.41,W2,(1460-cut)*.41);
  for(let f=0;f<5;f++){const yy=y0+FLOORS[f].ring[1]*.41;g.strokeStyle=f<=save.floors?'#9fffbf88':'#ffffff22';g.setLineDash([5,5]);g.beginPath();g.moveTo(x0,yy);g.lineTo(x0+W2,yy);g.stroke();g.setLineDash([])}}g.restore();
 txt(L('송신탑','信号塔'),159,1170,18,'#c9d2de','center',false);
 for(let f=4;f>=0;f--){const y=166+(4-f)*158,built=f<=save.floors,next=f===save.floors+1,gateOk=save.cleared>=FLOORS[f].gate;rr(310,y,416,148,14,built?'#18261e':'#161c2a',built?'#4fbf7a':next?'#c69a5a':'#2e3646',2);
  txt(LL(FLOORS[f].name),330,y+30,22,built?'#bfffd0':'#e6e0d0');const wi=save.equip[f];
  txt(built?(wi>=0?L('장착: ','装备：')+LL(weapon[wi].name):L('빈 거치대','空炮位')):(next&&!gateOk?L(STAGE_LABEL(FLOORS[f].gate)+' 클리어 필요',STAGE_LABEL(FLOORS[f].gate)+' 通关后'):L('미건설','未建造')),330,y+66,17,built?'#d8e0ea':next&&!gateOk?'#ff9a8a':'#8b98a8','left',false);
  if(built)txt(L('완공','已完工'),700,y+30,18,'#7fe0a0','right');
  else if(next){
   const can=gateOk&&save.mat>=FLOORS[f].cost;button(470,y+84,236,54,'',can?'green':'gray');iconBeam(530,y+111,11);txt(L('건설 ','建造 ')+FLOORS[f].cost,550,y+112,20,can?'#eafff0':'#a9b3c2','left')}
  else txt(L('아래층부터 건설','需先建造下层'),330,y+104,15,'#6a7488','left',false)}
 // 장갑 보강
 let y=958;rr(310,y,416,116,14,'#161c2a','#2e3646',2);txt(L('탑 장갑 보강  Lv.','塔装甲加固  Lv.')+save.armor,330,y+26,19,'#e6e0d0');txt(L('최대 내구도 +15 / 레벨','最大耐久 +15 / 级'),330,y+54,14,'#9fb0c4','left',false);
 if(save.armor<8){const can=save.mat>=armorCost();button(470,y+62,236,46,'',can?'green':'gray');iconBeam(530,y+85,10);txt(''+armorCost(),550,y+86,19,can?'#eafff0':'#a9b3c2','left')}else txt('MAX',690,y+86,22,'#ffd65a','right');
 y=1082;rr(310,y,416,116,14,'#161c2a','#2e3646',2);txt(L('포대 사전 배치  Lv.','炮台预先部署  Lv.')+save.prep,330,y+26,19,'#e6e0d0');txt(L('작전 시작 시 장착 무기 Lv.','开局时已装备武器 Lv.')+Math.max(1,save.prep+(save.prep<3?1:0))+(save.prep<3?L(' 설치',' 安装'):''),330,y+54,14,'#9fb0c4','left',false);
 if(save.prep<3){const can=save.mat>=prepCost();button(470,y+62,236,46,'',can?'green':'gray');iconBeam(530,y+85,10);txt(''+prepCost(),550,y+86,19,can?'#eafff0':'#a9b3c2','left')}else txt('MAX',690,y+86,22,'#ffd65a','right')}
function prepCost(){return [80,160,260][save.prep]||999}
function STAGE_LABEL(n){const s=n-1;return (Math.floor(s/4)+1)+'-'+(s%4+1)}
function baseWeapons(){txt(L('무기를 눌러 장착할 층을 바꾸세요. 부품으로 영구 강화(★)됩니다.','点击武器可更换装备楼层。用零件永久强化(★)。'),30,180,16,'#9fb0c4','left',false);
 const order=[0,3,4,1,2];order.forEach((i,k)=>{const y=200+k*196,own=owned(i);rowBox(y,182);
  const fr=imgs.ui_card;if(fr)g.drawImage(fr,38,y+14,150,154);if(!cardIcons[i])buildCardIcons();if(cardIcons[i]){g.save();if(!own)g.globalAlpha=.25;g.drawImage(cardIcons[i],50,y+48,126,97);g.restore()}
  txt(LL(weapon[i].name),206,y+34,26,own?'#fff4dc':'#6a7488');for(let s=0;s<TIER_MAX;s++)iconStar(206+LL(weapon[i].name).length*28+20+s*17,y+34,7,s<save.tier[i]);
  txt(LL(weapon[i].desc),206,y+70,16,'#9fb0c4','left',false);
  if(!own){iconLock(113,y+90,18);txt(L(STAGE_LABEL(weapon[i].unlock)+' 클리어 시 ',STAGE_LABEL(weapon[i].unlock)+' 通关后 ')+LL(SURV[weapon[i].crew].name)+L(' 합류',' 加入'),206,y+108,17,'#ff9a8a','left',false);return}
  face(weapon[i].crew,226,y+110,18);txt(LL(SURV[weapon[i].crew].name),252,y+110,15,'#c9d2de','left',false);
  const f=save.equip.indexOf(i);button(206,y+130,250,44,f>=0?L('장착: ','装备：')+LL(FLOORS[f].name):L('미장착 · 눌러서 장착','未装备 · 点击装备'),f>=0?'blue':'gray',16);
  if(save.tier[i]<TIER_MAX){const c=tierCost(i),can=save.parts>=c;button(472,y+100,236,74,'',can?'green':'gray');txt(L('강화 ★','强化 ★')+(save.tier[i]+1),590,y+123,17,can?'#eafff0':'#a9b3c2','center');iconGear(566,y+152,9);txt(''+c,580,y+153,17,can?'#eafff0':'#a9b3c2','left')}
  else txt('★ MAX',700,y+137,20,'#ffd65a','right')})}
function baseSupport(){txt(L('부품(⚙)으로 지원 장비를 강화합니다.','用零件(⚙)强化支援装备。'),30,180,16,'#9fb0c4','left',false);
 SUPS.forEach((S,k)=>{const y=200+k*220,l=save.sup[S.k];rowBox(y,204);const fr=imgs.ui_card;if(fr)g.drawImage(fr,40,y+22,150,154);
  const cx=115,cy=y+100;if(S.icon==='bomb'){iconPlane(cx-4,cy-14,48);iconBomb(cx+8,cy+28,15)}else if(S.icon==='bolt')iconBolt(cx,cy,34);else if(S.icon==='cross')iconCross(cx,cy,30);else iconNut(cx,cy,30);
  txt(LL(S.name),210,y+42,26,'#fff4dc');txt(LL(S.desc),210,y+80,16,'#9fb0c4','left',false);
  for(let s=0;s<SUP_MAX;s++){g.fillStyle=s<l?'#7fe0a0':'#2a2f3a';g.strokeStyle=OUT;g.lineWidth=1.5;pathRect(210+s*28,y+110,23,12,4);g.fill();g.stroke()}
  if(k===0&&!skillOpen(0)&&save.cleared<1)txt(L('1-2부터 사용','1-2开始可用'),400,y+116,14,'#ff9a8a','left',false);
  if(l<SUP_MAX){const c=supCost(S.k),can=save.parts>=c;button(470,y+132,236,56,'',can?'green':'gray');iconGear(540,y+160,10);txt(L('강화 ','强化 ')+c,556,y+161,19,can?'#eafff0':'#a9b3c2','left')}else txt('MAX',700,y+160,22,'#ffd65a','right')})}
function clearScreen(){if(!clearInfo){sc='map';return}drawField();g.fillStyle='#05080fcc';g.fillRect(0,0,750,1334);const C=clearInfo;panel(60,260,630,890,'#161c2c','#ffcf6a',18);
 txt(L('스테이지 클리어!','关卡通关！'),375,320,44,'#ffe2a0','center');txt((SD().ch+1)+'-'+(stageIdx%4+1)+'  '+LL(SD().name),375,370,22,'#c9d2de','center');
 for(let k=0;k<3;k++){const t=clamp((clearT-.3-k*.35)/.3,0,1),s=t<1?1+(1-t)*1.5:1;if(t>0){g.save();g.globalAlpha=t;g.translate(255+k*120,470);g.scale(s,s);iconStar(0,0,46,k<C.stars);g.restore()}else iconStar(255+k*120,470,46,false)}
 txt(L('탑 내구도 ','塔耐久 ')+Math.round(C.ratio*100)+'%  ·  '+L('처치 ','击杀 ')+C.kills,375,560,22,'#d8e0ea','center',false);
 rr(110,600,530,210,14,'#0f141e','#3a4250',2);txt(C.first?L('최초 클리어 보상','首次通关奖励'):L('반복 보상','重复奖励'),375,630,18,'#9fb0c4','center',false);
 iconBeam(200,690,18);txt(L('자재 ','建材 ')+'+'+(C.mat+C.lootMat),232,690,26,'#ffd8a8');txt('('+L('획득 ','拾取 ')+C.lootMat+')',232,724,15,'#8b98a8','left',false);
 iconGear(200,770,16);txt(L('부품 ','零件 ')+'+'+(C.prt+C.lootParts),232,770,26,'#bfe2ff');txt('('+L('획득 ','拾取 ')+C.lootParts+')',232,800,15,'#8b98a8','left',false);
 const nb=nextBuild();if(nb)txt(L('▲ ','▲ ')+LL(FLOORS[nb].name)+L(' 건설 가능!',' 可以建造！'),375,850,20,'#9fffbf','center');
 button(130,900,490,90,L('계속 ▶','继续 ▶'),'gold',30);
 if(!doubled){button(90,1030,370,80,'','green');iconCell(140,1070,15);txt(L('광고 보고 보상 2배','看广告奖励翻倍'),290,1070,21,'#eafff0','center')}else txt(L('보상 2배 받음!','已领取双倍奖励！'),275,1070,20,'#9fffbf','center');
 button(475,1030,185,80,L('공유','分享'),'blue',22)}
function failScreen(){if(!failInfo){sc='map';return}drawField();g.fillStyle='#14050acc';g.fillRect(0,0,750,1334);const F=failInfo;panel(60,300,630,760,'#1c1418','#ff7a7a',18);if(!revived){button(130,946,490,92,'','green');iconCell(196,992,16);txt(L('광고 보고 부활 (내구도 50%)','看广告复活（耐久50%）'),395,992,23,'#eafff0','center')}
 if(F.endless){txt(L('무한 습격 종료','无尽袭击结束'),375,365,44,'#ffb0c0','center');txt(L('도달 웨이브 ','到达波次 ')+F.wave,375,440,40,'#ffe2a0','center');if(F.best){const p=.5+.5*Math.sin(frame*6);g.save();g.globalAlpha=.6+.4*p;txt(L('신기록!','新纪录！'),375,495,26,'#9fffbf','center');g.restore()}else txt(L('최고 기록 ','最高纪录 ')+save.endlessBest,375,495,20,'#c9d2de','center',false);
  txt(L('획득 보상','获得奖励'),375,550,18,'#c9d2de','center',false);iconBeam(290,595,14);txt('+'+F.mat,312,596,22,'#ffd8a8');iconGear(420,595,13);txt('+'+F.prt,440,596,22,'#bfe2ff');
  button(130,640,490,86,L('다시 도전','再次挑战'),'red',30);button(130,746,490,80,L('기지 · 강화','基地 · 强化'),'blue',26);button(130,846,490,80,L('작전 지도','作战地图'),'gray',24);return}
 txt(L('방어선 붕괴','防线崩溃'),375,365,46,'#ff8a7a','center');txt(L('웨이브 ','第 ')+F.wave+' / '+wavesTotal+L('에서 탑이 무너졌다',' 波时塔倒塌了'),375,420,21,'#e6d0d0','center',false);
 txt(L('회수한 자재의 절반은 챙겼다','带回了一半拾取的材料'),375,480,18,'#c9d2de','center',false);iconBeam(290,530,14);txt('+'+F.mat,312,531,22,'#ffd8a8');iconGear(420,530,13);txt('+'+F.prt,440,531,22,'#bfe2ff');
 txt(L('팁: 기지에서 탑 장갑·무기 ★강화를 하고 다시 도전하세요','提示：在基地加固塔装甲、强化武器★后再挑战'),375,580,16,'#ffcf7a','center',false);
 button(130,640,490,86,L('다시 도전','再次挑战'),'red',30);button(130,746,490,80,L('기지 · 강화','基地 · 强化'),'blue',26);button(130,846,490,80,L('작전 지도','作战地图'),'gray',24)}
function buildScreen(){const B=buildAnim;B.t+=1/60;const u=clamp((B.t-.6)/2.6,0,1),e=u*u*(3-2*u);B.cur=B.from+(B.to-B.from)*e;
 const svStage=stageIdx;stageIdx=Math.min(LAST,Math.max(0,FLOORS[B.f].gate));g.save();backdrop();themeEnv();floorsBuilt=B.f;noTurrets=true;tower();noTurrets=false;stageIdx=svStage;
 if(u>0&&u<1){const y=TOWER.y+B.cur*TS;for(let k=0;k<2;k++){sparks(rand(480,730),y,'#ffd27a',2,260,-PI/2,1.2);if(Math.random()<.3)puff(rand(480,730),y,1,16,.6,true)}if(Math.random()<.2)AudioFx.cue('clang',.25,.15)}
 drawParticles(false);g.globalCompositeOperation='lighter';drawParticles(true);g.restore();fxTick(1/60);frame+=1/60;
 g.fillStyle=grad(0,0,0,240,[[0,'#05070cf0'],[1,'#05070c00']]);g.fillRect(0,0,750,240);
 txt(u<1?L('건설 중…','建造中…'):LL(FLOORS[B.f].name)+L(' 완공!',' 竣工！'),375,90,44,u<1?'#ffcf7a':'#9fffbf','center');
 if(u>=1){const wi=save.equip[B.f];if(wi>=0){const cw=weapon[wi].crew;g.fillStyle='#05070cd8';g.fillRect(0,1010,750,324);portrait(cw,40,1040,140);txt(LL(SURV[cw].name),200,1060,26,'#ffe4a2');paragraphs(LL(weapon[wi].name)+L(' 배치 완료! 여기가 내 자리야.',' 部署完成！这里就是我的位置。'),200,1110,22,'#f0eff7',500,34)}
  button(150,1240,450,76,L('확인','确认'),'gold',26)}
 else{g.fillStyle='#05070cd8';g.fillRect(0,1150,750,184)}}
function endingScreen(){endT+=1/60;frame+=1/60;g.save();stageIdx=LAST;endless=false;floorsBuilt=4;backdrop();g.fillStyle='rgba(255,140,80,.12)';g.fillRect(0,100,750,900);tower();
 const u=clamp(endT/4,0,1),e=1-(1-u)*(1-u),hx=900-e*(900-600),hy=60+e*(170-60);
 g.save();g.globalCompositeOperation='lighter';g.globalAlpha=.35;g.fillStyle=grad(hx,hy,hx-60,980,[[0,'#fff6d0'],[1,'#fff6d000']]);g.beginPath();g.moveTo(hx-14,hy+20);g.lineTo(hx+14,hy+20);g.lineTo(hx+120,980);g.lineTo(hx-200,980);g.closePath();g.fill();g.restore();
 const hi=imgs.o_heli;if(hi){g.save();g.translate(hx,hy);const w=300,h=w*hi.height/hi.width;g.drawImage(hi,-w*.5,-h*.55,w,h);if(u>=1){g.strokeStyle='#c9a24a';g.lineWidth=2;for(const dx of [-10,10]){g.beginPath();g.moveTo(dx,h*.3);g.lineTo(dx+Math.sin(endT*2)*4,150);g.stroke()}}g.restore()}else{
 g.save();g.translate(hx,hy);box(-60,-14,120,34,16,vg(-14,20,'#7d8a74','#4a5444'),3);poly([50,-6,120,-4,124,6,54,10],'#5a6452',2.5);poly([112,-16,124,-16,126,4,114,4],'#5a6452',2);g.beginPath();g.moveTo(-56,0);g.quadraticCurveTo(-54,-12,-34,-12);g.lineTo(-30,4);g.closePath();inked('#9fd8ff',2);
 box(-30,22,70,6,3,'#3a3f48',2);g.strokeStyle='#2a2e35';g.lineWidth=3;g.beginPath();g.moveTo(0,-14);g.lineTo(0,-22);g.stroke();g.globalAlpha=.4;g.fillStyle='#e8ecf2';g.beginPath();g.ellipse(0,-24,110+Math.sin(endT*40)*8,5,0,0,TAU);g.fill();g.globalAlpha=1;
 if(u>=1){g.strokeStyle='#c9a24a';g.lineWidth=2;for(const dx of [-10,10]){g.beginPath();g.moveTo(dx,28);g.lineTo(dx+Math.sin(endT*2)*4,150);g.stroke()}}g.restore()}g.restore();
 const t2=endT-3;if(t2>0){const lines=[L('구조 헬기가 송신탑 옥상에 도착했다.','救援直升机抵达了信号塔屋顶。'),L('지하에서 시작된 여섯 명의 탈출은','从地下开始的六人逃亡，'),L('한 층씩 쌓아 올린 탑 꼭대기에서 끝났다.','在一层层建起的塔顶画上了句号。')+'  ('+L('구조한 피난민 포함','含获救难民')+')',L('— 생존자 전원 구조 —','— 全员获救 —')];
  g.fillStyle='#05070cd0';g.fillRect(0,1000,750,334);lines.forEach((l,k)=>{const a=clamp((t2-k*1.2)/1,0,1);g.save();g.globalAlpha=a;txt(l,375,1050+k*50,k===3?28:21,k===3?'#ffe2a0':'#f0eff7','center',k===3);g.restore()});
  CREW_ORDER.forEach((w,k)=>{g.save();g.globalAlpha=clamp((t2-5)/1,0,1);face(w,150+k*90,940,30);g.restore()});
  if(t2>6)button(150,1250,450,70,L('처음 화면','标题画面'),'gold',24)}}
function onoff(v){return v?L('켬','开'):L('끔','关')}
function settingsScreen(){g.fillStyle='#0d111b';g.fillRect(0,0,750,1334);txt(L('설정','设置'),375,170,40,'#ffe2a0','center');
 button(130,240,490,76,L('화질: ','画质：')+(qualityLow?L('절약','省电'):L('높음','高')),'gray',24);txt(qualityManual?L('수동 설정됨','已手动设置'):L('기기 성능에 따라 자동 전환','根据设备性能自动切换'),375,334,16,'#9fb0c4','center',false);
 button(130,360,240,76,L('배경음악: ','音乐：')+onoff(Music.on),'gray',22);button(380,360,240,76,L('효과음: ','音效：')+onoff(AudioFx.enabled),'gray',22);
 button(130,456,240,76,L('흔들림: ','屏幕晃动：')+onoff(!shakeReduced),'gray',22);button(380,456,240,76,L('진동: ','手机振动：')+onoff(save.vib!==false),'gray',22);
 button(130,552,490,76,'🌐 '+(LANG==='zh'?'语言：简体中文':'언어: 한국어'),'gray',24);
 button(130,648,490,76,L('순화 연출(쓰러진 좀비 숨김): ','温和画面（隐藏倒地僵尸）：')+onoff(save.mild),'gray',20);
 button(130,744,490,76,L('개인정보 처리방침','隐私政策'),'blue',22);
 button(130,860,490,76,L('진행 초기화','重置进度'),'red',22);if(resetArm>0)txt(L('한 번 더 누르면 모든 진행이 지워집니다','再按一次将清除所有进度'),375,960,17,'#ff9a8a','center',false);
 button(150,1180,450,80,L('◀ 돌아가기','◀ 返回'),'gold',26)}
function privacyScreen(){g.fillStyle='#0d111b';g.fillRect(0,0,750,1334);txt(L('개인정보 처리방침','隐私政策'),375,120,34,'#ffe2a0','center');rr(40,170,670,960,16,'#141a28','#2e3646',2);
 const T2=L('1. 이 게임은 회원가입이 없으며, 개발자는 이름·전화번호·위치 같은 개인정보를 수집하지 않습니다.\n\n2. 게임 진행 기록(스테이지, 자재, 설정)은 이 기기 안에만 저장됩니다. 게임을 삭제하거나 저장 공간을 지우면 함께 지워집니다.\n\n3. 보상형 광고는 위챗·더우인 플랫폼이 제공합니다. 광고를 보여 주기 위해 플랫폼이 기기 정보를 처리할 수 있으며, 이는 각 플랫폼의 개인정보 정책을 따릅니다.\n\n4. 게임 개선을 위해 스테이지 시작·클리어·실패, 광고 시청 같은 익명 통계를 플랫폼 통계 기능으로 집계합니다. 개인을 식별하는 정보는 포함하지 않습니다.\n\n5. 공유 기능은 사용자가 직접 누를 때만 작동합니다.\n\n6. 문의: 게임 정보 페이지의 개발자 연락처로 보내 주세요.',
 '1. 本游戏无需注册，开发者不收集姓名、手机号、位置等个人信息。\n\n2. 游戏进度（关卡、建材、设置）仅保存在本设备中，删除游戏或清除缓存后将一并删除。\n\n3. 激励视频广告由微信/抖音平台提供。为展示广告，平台可能处理设备信息，相关处理遵循各平台的隐私政策。\n\n4. 为改进游戏，我们通过平台统计功能汇总关卡开始/通关/失败、广告观看等匿名数据，不包含可识别个人身份的信息。\n\n5. 分享功能仅在用户主动点击时使用。\n\n6. 联系方式：请通过游戏资料页中的开发者联系方式与我们联系。');
 paragraphs(T2,70,220,19,'#d8e0ea',610,32);button(150,1180,450,80,L('◀ 돌아가기','◀ 返回'),'gold',26)}
let resetArm=0,noTurrets=false,guideTip=null,guidePage=0,guideRet='title';
function tip(id,lines){if(save.tips[id])return false;save.tips[id]=1;persist();guideTip={lines,t:0};return true}
function lineCount(v,size,maxW){let n=0;for(const raw of v.split('\n')){let cur='';for(const ch of raw){if((cur+ch).length*size*.89>maxW&&cur){n++;cur=''}cur+=ch}n++}return n}
function drawGuideTip(){guideTip.t+=1/60;const L2=guideTip.lines.map(l=>LL(l));const cnt=L2.map(l=>lineCount(l,20,570));const tot=cnt.reduce((a,b)=>a+b,0);g.fillStyle='rgba(4,6,12,.72)';g.fillRect(0,0,750,1334);const h=120+tot*30+(L2.length-1)*16;const y0=600-h/2;panel(50,y0,650,h,'#141a28f4','#ffcf6a',18);txt('💡 '+L('안내','提示'),90,y0+46,28,'#ffe2a0');
 let yy=y0+96;L2.forEach((l,i)=>{txt('•',80,yy,20,'#ffcf6a','left',false);paragraphs(l,102,yy,20,'#f0eff7',570,30);yy+=cnt[i]*30+16});if(Math.sin(frame*6)>-.3)txt('▼ '+L('터치해서 닫기','点击关闭'),672,y0+h-22,15,'#ffcf7a','right',false)}
function nextGoal(){const f=save.floors+1;if(save.cleared>=STAGES.length)return [L('모든 작전 완료! 무한 습격으로 최고 기록에 도전','全部完成！挑战无尽袭击纪录'),'#9fffbf'];
 if(f<=4){const F=FLOORS[f];if(save.cleared>=F.gate&&save.mat>=F.cost)return [L('▲ 지금 기지에서 ','▲ 现在可在基地建造 ')+LL(F.name)+L(' 건설 가능!',''),'#9fffbf'];
  if(save.cleared>=F.gate)return [L('다음 목표: 자재 ','下一目标：建材 ')+save.mat+'/'+F.cost+L(' 모아 ',' → ')+LL(F.name)+L(' 건설',' 建造'),'#ffd8a8'];
  if(save.cleared>=F.gate-2)return [L('다음 목표: ','下一目标：')+STAGE_LABEL(F.gate)+L(' 클리어 → ',' 通关 → ')+LL(F.name)+L(' 건설 해금',' 解锁'),'#ffd8a8']}
 const s=save.cleared;return [L('다음 작전: ','下一行动：')+STAGE_LABEL(s+1)+' '+LL(STAGES[s].name),'#d8e0ea']}
const GUIDE=[
 {t:['게임 흐름','游戏流程'],body:'flow'},
 {t:['전투 조작','战斗操作'],items:[['🔩',['카드를 눌러 무기 설치·강화','点击卡片安装/强化武器'],['좀비가 떨군 고철로 삽니다. 카드에 초록 ▲가 뜨면 지금 강화할 수 있어요. 고철은 스테이지가 끝나면 사라지니 아끼지 말고 쓰세요.','用僵尸掉落的废铁购买。卡片出现绿色▲即可强化。废铁关卡结束后清零，尽管用。']],
  ['⚡',['스킬: 공습 · EMP · 빙결','技能：空袭·EMP·冰冻'],['전력(⚡)이 차면 왼쪽 아래 스킬을 쓸 수 있어요. 공습은 좀비가 가장 많이 모인 곳에 폭탄을 떨어뜨립니다.','电力(⚡)充满后可使用左下技能。空袭会轰炸僵尸最密集的地方。']],
  ['👆',['드럼통 · 보급 상자는 직접 터치','油桶/补给箱需亲手点击'],['빨간 드럼통은 좀비가 모였을 때 터치하면 대폭발! 낙하산 상자는 터치해서 회수하세요.','红色油桶在尸群聚集时点击引爆！降落伞箱子点击回收。']],
  ['🃏',['보급 선택 · 아드레날린','补给选择·肾上腺素'],['2웨이브마다 카드 1장을 골라 이번 판을 강화합니다. 처치 게이지가 차면 7초간 과열 사격!','每2波选择1张卡片强化本局。击杀槽满后7秒过载射击！']]]},
 {t:['탑 건설','建塔'],body:'tower'},
 {t:['영구 강화','永久强化'],items:[['🧱',['자재 → 탑 층 건설 · 장갑 · 사전 배치','建材 → 建楼层·装甲·预部署'],['정예·보스·상자에서 얻어요. 탑 장갑은 최대 내구도를, 사전 배치는 시작부터 무기가 설치된 상태로 만들어 줍니다.','从精英/首领/箱子获得。装甲提升最大耐久，预部署让武器开局即安装。']],
  ['⚙',['부품 → 무기 ★강화 · 지원 강화','零件 → 武器★强化·支援强化'],['무기 ★은 해당 무기 피해를 영구히 올립니다. 지원 강화는 공습·전력·수리·시작 고철을 늘려요.','武器★永久提升伤害。支援强化提升空袭/电力/修复/初始废铁。']],
  ['🔁',['무기 장착 바꾸기','更换武器装备'],['기지 → 무기 장착에서 무기를 누르면 장착할 층이 바뀝니다. 위층일수록 더 멀리 쏩니다.','基地→武器装备中点击武器可更换楼层。楼层越高射得越远。']]]},
 {t:['진행 팁','进阶提示'],items:[['⭐',['별 3개 = 탑 내구도 70% 이상','三星 = 塔耐久70%以上'],['별을 모으면 보상 화면에서 챕터 상자를 열 수 있어요.','收集星星可在奖励界面开启章节宝箱。']],
  ['💀',['실패해도 손해는 없다','失败也不亏'],['주운 자재·부품의 절반을 챙깁니다. 막히면 기지에서 강화하고 다시 도전하세요. 광고를 보면 한 번 부활할 수 있어요.','可带回一半拾取的建材/零件。卡关就去基地强化再挑战。看广告可复活一次。']],
  ['📅',['일일 미션 · 출석 · 무한 습격','每日任务·签到·无尽袭击'],['매일 미션 3개와 출석 보상이 갱신됩니다. 2-4 이후 무한 습격으로 재료를 모으세요.','每日刷新3个任务和签到奖励。2-4后可在无尽袭击中收集材料。']]]}];
function guideScreen(){g.fillStyle='#0d111b';g.fillRect(0,0,750,1334);if(imgs.bg_base){g.drawImage(imgs.bg_base,0,0,750,1334);g.fillStyle='rgba(8,10,18,.82)';g.fillRect(0,0,750,1334)}
 txt(L('작전 안내서','作战指南'),30,58,34,'#ffe2a0');const P=GUIDE[guidePage];
 GUIDE.forEach((q,k)=>{const x=24+k*142;rr(x,96,132,50,10,k===guidePage?'#3a2c18':'#171c28',k===guidePage?'#ffcf6a':'#3a4250',2);txt(LL(q.t),x+66,121,16,k===guidePage?'#ffe2a0':'#9fb0c4','center',false)});
 if(P.body==='flow'){const steps=[['⚔',['전투','战斗'],['좀비를 막는다','抵挡僵尸']],['🔩🧱⚙',['드롭 회수','回收掉落'],['고철·자재·부품','废铁·建材·零件']],['🏗',['기지에서 건설','基地建造'],['새 층 · 강화','新楼层·强化']],['📈',['더 높은 탑','更高的塔'],['새 무기 · 새 동료','新武器·新伙伴']],['🚁',['옥상에서 구조','屋顶获救'],['6장 엔딩','第6章结局']]];
  steps.forEach((st,k)=>{const y=190+k*170;rr(110,y,530,120,18,'#161c2a','#c69a5a',2);txt(st[0],170,y+60,34,'#fff','center',false);txt(LL(st[1]),240,y+44,28,'#ffe2a0');txt(LL(st[2]),240,y+86,19,'#c9d2de','left',false);if(k<4){poly([360,y+128,390,y+128,375,y+160],'#ffcf6a',2)}});
  paragraphs(L('지하 벙커에서 시작해, 좀비가 떨군 재료로 탑을 한 층씩 쌓아 옥상 송신기까지 올라가는 게임입니다. 전투(고철) ↔ 기지(자재·부품)를 오가며 강해집니다.','从地下掩体出发，用僵尸掉落的材料一层层建塔直到屋顶发射器。在战斗(废铁)与基地(建材·零件)之间往返变强。'),60,1060,19,'#d8e0ea',630,30)}
 else if(P.body==='tower'){const im=imgs.tower_hd,sc2=.56,tx=0,ty=172;if(im)g.drawImage(im,tx,ty,613*sc2,1460*sc2);
  for(let f=4;f>=0;f--){const ry=ty+FLOORS[f].ring[1]*sc2,rx=tx+FLOORS[f].ring[0]*sc2+40,wi=weapon.findIndex(w=>w.theme===f),done=f<=save.floors,y=176+(4-f)*168;
   g.strokeStyle=done?'#9fffbf':'#ffcf6a';g.lineWidth=2;g.setLineDash([5,5]);g.beginPath();g.moveTo(rx,ry);g.lineTo(350,y+56);g.stroke();g.setLineDash([]);g.beginPath();g.arc(rx,ry,6,0,TAU);g.fillStyle=done?'#9fffbf':'#ffcf6a';g.fill();
   rr(350,y,380,140,14,done?'#18261ef4':'#161c2af4',done?'#4fbf7a':'#c69a5a',2);txt(LL(FLOORS[f].name),368,y+30,22,done?'#bfffd0':'#ffe2a0');if(done)txt(L('✔ 완공','✔ 已建'),712,y+30,16,'#9fffbf','right');
   txt(L('무기: ','武器：')+(wi>=0?LL(weapon[wi].name):''),368,y+66,17,'#f0eff7','left',false);txt(L('담당: ','负责：')+(wi>=0?LL(SURV[weapon[wi].crew].name):''),368,y+92,16,'#c9d2de','left',false);
   txt(f?STAGE_LABEL(FLOORS[f].gate)+L(' 클리어 + 🧱',' 通关 + 🧱')+FLOORS[f].cost:L('처음부터 사용','初始可用'),368,y+120,16,f?'#ffcf7a':'#9fb0c4','left',false)}
  paragraphs(L('층을 지으면 새 무기 거치대가 생기고 그 층 담당 동료가 무기를 맡습니다. 건설은 기지 → 탑 건설 탭에서!','建造楼层会解锁新炮位，由对应伙伴操作武器。在基地→建塔中建造！'),40,1060,19,'#d8e0ea',670,30)}
 else P.items.forEach((it,k)=>{const y=180+k*235;rr(30,y,690,215,16,'#161c2af0','#2e3646',2);txt(it[0],95,y+70,46,'#fff','center',false);txt(LL(it[1]),160,y+44,24,'#ffe2a0');paragraphs(LL(it[2]),160,y+92,18,'#d8e0ea',530,30)});
 button(30,1210,200,80,'◀','gray',30);button(520,1210,200,80,'▶','gray',30);button(250,1210,250,80,L('닫기','关闭'),'gold',26);txt((guidePage+1)+' / '+GUIDE.length,375,1180,16,'#9fb0c4','center',false)}
function adBoxLeft(){const t=todayKey();if(!save.adBox||save.adBox.day!==t)save.adBox={day:t,n:0};return 3-save.adBox.n}
function rewardScreen(){dailyInit();g.fillStyle='#0d111b';g.fillRect(0,0,750,1334);if(imgs.bg_base){g.drawImage(imgs.bg_base,0,0,750,1334);g.fillStyle='rgba(8,10,18,.8)';g.fillRect(0,0,750,1334)}
 txt(L('보상','奖励'),30,58,34,'#ffe2a0');iconBeam(490,50,13);txt(''+save.mat,510,51,24,'#ffd8a8');iconGear(612,50,12);txt(''+save.parts,630,51,24,'#bfe2ff');
 // 출석
 rr(24,96,702,210,16,'#161c2af0','#c69a5a',2);txt(L('7일 출석','7日签到'),44,124,22,'#ffe2a0');const can=attCan(),day=save.att.streak%7;
 ATT.forEach((r,k)=>{const x=40+k*96,y=148,got=k<day||(k===day&&!can&&save.att.streak>0&&false),cur=k===day&&can;rr(x,y,86,110,10,cur?'#2f5a3a':k<day?'#1d2a22':'#1a1e28',cur?'#9fffbf':'#3a4250',2);txt((k+1)+L('일','天'),x+43,y+18,14,'#c9d2de','center',false);
  if(r.mat){iconBeam(x+28,y+56,10);txt(''+r.mat,x+42,y+57,15,'#ffd8a8','left',false)}if(r.parts){iconGear(x+28,y+(r.mat?84:56),9);txt(''+r.parts,x+42,y+(r.mat?85:57),15,'#bfe2ff','left',false)}if(k<day)txt('✔',x+70,y+18,16,'#9fffbf','center',false)});
 button(470,262,236,36,can?L('출석 보상 받기','领取签到'):L('내일 다시','明天再来'),can?'green':'gray',16);
 // 일일 미션
 rr(24,322,702,330,16,'#161c2af0','#2e3646',2);txt(L('일일 미션','每日任务'),44,350,22,'#ffe2a0');txt(L('매일 자정 갱신','每日零点刷新'),704,350,14,'#9fb0c4','right',false);
 save.daily.m.forEach((m,k)=>{const M=MISSIONS[m.i],y=376+k*90,done=m.p>=M.goal;rr(40,y,670,80,12,'#121722','#2e3646',1);txt(LL(M.name),60,y+26,18,'#f0eff7','left',false);rr(60,y+48,330,12,6,'#1a1e28',null);rr(60,y+48,330*m.p/M.goal,12,6,done?'#4fd38c':'#d08a20',null);txt(m.p+' / '+M.goal,400,y+54,14,'#c9d2de','left',false);
  const r=M.r;if(r.mat){iconBeam(500,y+40,10);txt(''+r.mat,514,y+41,16,'#ffd8a8','left',false)}if(r.parts){iconGear(500,y+40,9);txt(''+r.parts,514,y+41,16,'#bfe2ff','left',false)}
  if(m.c)txt(L('완료','已领'),650,y+40,17,'#7a8698','center');else button(580,y+18,120,46,L('받기','领取'),done?'green':'gray',17)});
 // 챕터 별 상자
 rr(24,668,702,520,16,'#161c2af0','#2e3646',2);txt(L('챕터 별 보상','章节星星奖励'),44,696,22,'#ffe2a0');txt(L('챕터마다 별 6개 · 12개','每章6星·12星'),704,696,14,'#9fb0c4','right',false);
 for(let c2=0;c2<6;c2++){const y=718+c2*76,st=chapterStars(c2);txt(LL(CH[c2].name),44,y+28,16,save.cleared>=c2*4?CH[c2].col:'#55606e','left',false);iconStar(330,y+28,10,true);txt(st+'/12',346,y+29,15,'#ffe2a0','left',false);
  for(let t=0;t<2;t++){const need=t?12:6,ok=st>=need,got=save.chest.includes(c2*2+t),x=430+t*140;button(x,y+6,128,48,got?L('받음','已领'):need+'★',got?'gray':ok?'green':'gray',16)}}
 button(150,1210,450,80,L('◀ 작전 지도','◀ 作战地图'),'gold',26)}

// ---------------------------------------------------------------- 입력
function toggleLang(){LANG=LANG==='zh'?'ko':'zh';persist();AudioFx.cue('ui')}
function advanceDialog(){const ln=dialog.lines[dialog.i];const len=ln?LL(ln[1]).length:0;if(dialog.t*38<len){dialog.t=99;return}dialog.i++;dialog.t=0;if(dialog.i>=dialog.lines.length){const d=dialog.done;dialog=null;if(d)d()}}
function afterClear(){const s=stageIdx,S=STAGES[s];sc='battle';stageDone=true;dialog={lines:S.clear,i:0,t:0,done:()=>{if(s===LAST&&!save.ended){save.ended=true;persist();sc='ending';endT=0}else{sc='map';if(nextBuild()){sc='base';baseTab=0}}}}}
function tryBuild(f){if(f!==save.floors+1||f>4)return;if(save.cleared<FLOORS[f].gate){message(L('스토리 진행이 더 필요하다','需要推进剧情'),1);return}if(save.mat<FLOORS[f].cost){AudioFx.cue('ui');return}
 save.mat-=FLOORS[f].cost;save.floors=f;autoEquip();persist();buildAnim={from:FLOORS[f-1].cut,to:FLOORS[f].cut,cur:FLOORS[f-1].cut,t:0,f};parts.n=0;sc='build';AudioFx.cue('power')}
function cycleEquip(i){const cur=save.equip.indexOf(i);const n=save.floors+1;if(cur>=0&&n===1)return;const nf=cur<0?0:(cur+1)%n;const other=save.equip[nf];save.equip[nf]=i;if(cur>=0)save.equip[cur]=other;persist();AudioFx.cue('ui')}
function touch(x,y){AudioFx.init();Music.kick();
 if(adShow)return;if(guideTip){guideTip=null;return}
 if(dialog){advanceDialog();return}
 if(sc==='battle'&&perkPick){if(perkPick.t<.35)return;if(!rerolled&&hit_(x,y,215,800,320,70)){showAd('reroll',()=>{rerolled=true;perkPick=makePerks()});return}for(let i=0;i<perkPick.opts.length;i++)if(hit_(x,y,40+i*230,430,210,330)){applyPerk(perkPick.opts[i]);return}return}
 if(sc==='title'){if(hit_(x,y,560,24,170,54)){toggleLang();return}
  if(hit_(x,y,150,870,450,92)){AudioFx.cue('ui');if(save.cleared===0){save.seenIntro=true;persist();startStage(0)}else sc='map';return}
  if(hit_(x,y,150,982,450,76)){sc='base';baseTab=0;return}if(hit_(x,y,150,1074,218,70)){sc='guide';guidePage=0;guideRet='title';track('guide_open',{from:'title'});return}if(hit_(x,y,382,1074,218,70)){sc='settings';retSc='title';resetArm=0;return}return}
 if(sc==='story'){AudioFx.cue('ui');if(y<100&&x>560){storyIndex=STORY.length}else storyIndex++;if(storyIndex>=STORY.length){save.seenIntro=true;persist();sc='map'}return}
 if(sc==='map'){if(hit_(x,y,640,18,86,94)){sc='guide';guidePage=0;guideRet='map';return}if(hit_(x,y,30,1256,250,56)){sc='reward';dailyInit();return}if(hit_(x,y,292,1256,256,56)){if(adBoxLeft()<=0){message(L('오늘 보급 상자는 모두 받았습니다','今日补给箱已领完'),1.2);return}showAd('box',()=>{save.adBox.n++;const c2=save.cleared;give({mat:12+Math.round(c2*2.2),parts:6+Math.round(c2*1.2)})});return}if(hit_(x,y,390,1150,330,84)){if(save.cleared>=8){AudioFx.cue('ui');startStage('endless')}else message(L('2-4를 클리어하면 열린다','通关2-4后解锁'),1.2);return}if(hit_(x,y,560,1256,160,56)){sc='title';return}
  for(let s=0;s<STAGES.length;s++){const [nx,ny]=nodePos(s);if(Math.hypot(x-nx,y-ny)<44){if(s<=save.cleared){AudioFx.cue('ui');startStage(s)}else message(L('이전 스테이지를 먼저 클리어하라','请先通关前一关'),1);return}}
  if(hit_(x,y,30,1150,330,84)){sc='base';baseTab=0;return}return}
 if(sc==='base'){if(hit_(x,y,640,16,86,66)){sc='guide';guidePage=2;guideRet='base';return}for(let k=0;k<3;k++)if(hit_(x,y,24+k*238,92,226,58)){baseTab=k;AudioFx.cue('ui');return}
  if(hit_(x,y,150,1220,450,80)){sc='map';return}
  if(baseTab===0){for(let f=1;f<=4;f++){const yy=166+(4-f)*158;if(hit_(x,y,470,yy+84,236,54)){tryBuild(f);return}}
   if(hit_(x,y,470,1144,236,46)&&save.prep<3&&save.mat>=prepCost()){save.mat-=prepCost();save.prep++;persist();AudioFx.cue('power');return}
   if(hit_(x,y,470,1020,236,46)&&save.armor<8&&save.mat>=armorCost()){save.mat-=armorCost();save.armor++;persist();AudioFx.cue('power')}return}
  if(baseTab===1){const order=[0,3,4,1,2];order.forEach((i,k)=>{const yy=200+k*196;if(!owned(i))return;if(hit_(x,y,206,yy+130,250,44)){cycleEquip(i);return}
    if(hit_(x,y,472,yy+100,236,74)&&save.tier[i]<TIER_MAX&&save.parts>=tierCost(i)){save.parts-=tierCost(i);save.tier[i]++;persist();AudioFx.cue('power')}});return}
  if(baseTab===2){SUPS.forEach((S,k)=>{const yy=200+k*220;if(hit_(x,y,470,yy+132,236,56)&&save.sup[S.k]<SUP_MAX&&save.parts>=supCost(S.k)){save.parts-=supCost(S.k);save.sup[S.k]++;persist();AudioFx.cue('power')}});return}return}
 if(sc==='guide'){if(hit_(x,y,30,1210,200,80)){guidePage=(guidePage+GUIDE.length-1)%GUIDE.length;return}if(hit_(x,y,520,1210,200,80)){guidePage=(guidePage+1)%GUIDE.length;return}if(hit_(x,y,250,1210,250,80)){sc=guideRet;return}for(let k=0;k<GUIDE.length;k++)if(hit_(x,y,24+k*142,96,132,50)){guidePage=k;return}return}
 if(sc==='reward'){if(hit_(x,y,150,1210,450,80)){sc='map';return}
  if(hit_(x,y,470,262,236,36)&&attCan()){const r=ATT[save.att.streak%7];save.att.streak++;save.att.last=todayKey();give(r);return}
  for(let k=0;k<save.daily.m.length;k++){const m=save.daily.m[k],M=MISSIONS[m.i],yy=376+k*90;if(hit_(x,y,580,yy+18,120,46)&&!m.c&&m.p>=M.goal){m.c=true;give(M.r);return}}
  for(let c2=0;c2<6;c2++)for(let t=0;t<2;t++){const yy=718+c2*76,xx=430+t*140;if(hit_(x,y,xx,yy+6,128,48)&&!save.chest.includes(c2*2+t)&&chapterStars(c2)>=(t?12:6)){save.chest.push(c2*2+t);give(chestReward(c2,t));return}}return}
 if(sc==='privacy'){if(hit_(x,y,150,1180,450,80))sc='settings';return}
 if(sc==='settings'){if(hit_(x,y,130,240,490,76)){qualityLow=!qualityLow;qualityManual=true;persist();return}
  if(hit_(x,y,130,360,240,76)){Music.toggle();save.music=Music.on;persist();return}if(hit_(x,y,380,360,240,76)){AudioFx.enabled=!AudioFx.enabled;save.sfx=AudioFx.enabled;persist();return}
  if(hit_(x,y,130,456,240,76)){shakeReduced=!shakeReduced;persist();return}if(hit_(x,y,380,456,240,76)){save.vib=save.vib===false;persist();vib('medium');return}
  if(hit_(x,y,130,552,490,76)){toggleLang();return}if(hit_(x,y,130,648,490,76)){save.mild=!save.mild;persist();return}if(hit_(x,y,130,744,490,76)){sc='privacy';return}
  if(hit_(x,y,130,860,490,76)){if(resetArm>0){const keep=LANG;Object.assign(save,{tips:{},daily:null,att:{last:'',streak:0},chest:[],prep:0,endlessBest:0,cleared:0,stars:[],mat:0,parts:0,floors:0,armor:0,tier:[0,0,0,0,0],equip:[0,-1,-1,-1,-1],sup:{air:0,energy:0,medic:0,scrap:0},seenIntro:false,ended:false,adBox:null});LANG=keep;persist();resetArm=0;message(L('초기화 완료','已重置'),1)}else resetArm=1;return}
  if(hit_(x,y,150,1180,450,80)){sc=retSc;return}return}
 if(sc==='clear'){if(clearT<1.2)return;if(hit_(x,y,130,900,490,90)){afterClear();return}if(!doubled&&hit_(x,y,90,1030,370,80)){showAd('double',()=>{doubled=true;const C=clearInfo;give({mat:C.mat+C.lootMat,parts:C.prt+C.lootParts})});return}if(hit_(x,y,475,1030,185,80)){shareGame();return}return}
 if(sc==='fail'){if(!revived&&hit_(x,y,130,946,490,92)){showAd('revive',revive);return}if(hit_(x,y,130,640,490,86)){startStage(failInfo&&failInfo.endless?'endless':stageIdx);return}if(hit_(x,y,130,746,490,80)){sc='base';baseTab=0;return}if(hit_(x,y,130,846,490,80)){sc='map';return}return}
 if(sc==='build'){if(buildAnim&&buildAnim.t>3.4&&y>1200){buildAnim=null;sc='base';baseTab=0}return}
 if(sc==='ending'){if(endT>9&&y>1240){sc='title'}return}
 if(sc!=='battle')return;
 if(paused){if(hit_(x,y,130,410,490,80)){paused=false;return}if(hit_(x,y,130,510,490,80)){paused=false;startStage(endless?'endless':stageIdx);return}if(hit_(x,y,130,610,490,80)){paused=false;if(endless&&wave>1){stageFail();return}sc='map';return}
  if(hit_(x,y,130,730,235,66)){qualityLow=!qualityLow;qualityManual=true;persist();return}if(hit_(x,y,385,730,235,66)){shakeReduced=!shakeReduced;persist();return}if(hit_(x,y,130,816,235,66)){toggleLang();return}if(hit_(x,y,385,816,235,66)){Music.toggle();save.music=Music.on;persist();return}if(hit_(x,y,385,898,235,66)){AudioFx.enabled=!AudioFx.enabled;save.sfx=AudioFx.enabled;persist();return}if(hit_(x,y,130,898,235,66)){paused=false;sc='guide';guidePage=1;guideRet='battle';paused=true;return}return}
 if(hit_(x,y,10,10,96,96)){paused=true;return}
 if(hit_(x,y,22,1252,170,56)){speed=speed===1?2:1;return}if(hit_(x,y,204,1252,200,56)){paused=true;return}
 for(const c of crates)if(c.landed&&Math.hypot(x-c.x,y-(c.y-14))<56){openCrate(c);return}
 for(const b of barrels)if(!b.gone&&b.drop>=0&&Math.hypot(x-b.x,y-(b.y-22))<50){popBarrel(b);return}
 if(y>=895&&y<=1000&&x<372){const i=Math.floor((x-12)/120);if(i>=0&&i<=2)useSkill(i);return}
 if(y>1050&&y<1240){const j=Math.floor((x-28)/142);if(j<0||j>4)return;weaponSlot=j;if(j>floorsBuilt){message(LL(FLOORS[j].name)+L(' 미건설 · 기지에서 자재로 건설',' 未建造 · 在基地用建材建造'),1.4);return}const wi=save.equip[j];if(wi<0){message(L('빈 거치대 · 기지에서 무기 장착','空炮位 · 在基地装备武器'),1.2);return}buyWeapon(wi)}}
function coords(px,py){if(API){const k=c.width/(info.windowWidth||375);return [(px*k-view.ox)/view.s,(py*k-view.oy)/view.s]}let r=c.getBoundingClientRect();return [(px-r.left)/r.width*W,(py-r.top)/r.height*H]}
if(API){API.onTouchEnd&&API.onTouchEnd(e=>{let p=(e.changedTouches||e.touches||[])[0];if(!p)return;let [x,y]=coords(p.clientX,p.clientY);touch(x,y)})}
else{c.addEventListener('pointerup',e=>{let [x,y]=coords(e.clientX,e.clientY);touch(x,y)})}
let perfAcc=0,perfFrames=0,perfBad=0;
function perf(dt){if(qualityManual||sc!=='battle'||paused)return;perfAcc+=dt;perfFrames++;if(perfAcc>=2){const fps=perfFrames/perfAcc;perfAcc=0;perfFrames=0;if(fps<45){perfBad++;if(perfBad>=2&&!qualityLow){qualityLow=true;message(T('저사양 모드 자동 적용'),1.2)}}else perfBad=0}}
function drawBanner(){if(bannerT>0&&sc!=='battle'&&bannerSc===sc){g.save();g.globalAlpha=Math.min(1,bannerT);rr(120,1150,510,60,12,'#3a1820ee','#ff8a8a',2);txt(banner,375,1180,20,'#fff','center',false);g.restore();bannerT-=1/60}}
function draw(dt){if(API){g.setTransform(1,0,0,1,0,0);g.fillStyle='#05070c';g.fillRect(0,0,c.width,c.height);g.setTransform(view.s,0,0,view.s,view.ox,view.oy)}else g.setTransform(1,0,0,1,0,0);
 g.clearRect(0,0,W,H);if(dialog){dialog.t+=Math.min(dt,.05)}
 if(sc!=='battle'&&sc!=='build'&&sc!=='ending')frame+=Math.min(dt,.05);
 if(sc==='title')title();else if(sc==='story')story();else if(sc==='map')mapScreen();else if(sc==='base')baseScreen();else if(sc==='settings')settingsScreen();else if(sc==='guide')guideScreen();else if(sc==='privacy')privacyScreen();else if(sc==='reward')rewardScreen();
 else if(sc==='battle'){tick(dt);drawBattle()}else if(sc==='clear'){clearT+=Math.min(dt,.05);clearScreen()}else if(sc==='fail'){clearT+=Math.min(dt,.05);failScreen()}else if(sc==='build')buildScreen();else if(sc==='ending')endingScreen();
 if(dialog&&sc!=='battle')drawDialog();if(guideTip)drawGuideTip();if(adShow)drawAd();drawBanner();wantMusic()}
if(!API&&typeof location!=='undefined'&&location.search.indexOf('debug=1')>=0){globalThis.__bepaDebug={STAGES,revive,get guideTip(){return guideTip},set guideTip(v){guideTip=v},set guidePage(v){guidePage=v},showAd,mission,DIFF,STAGE_K,touch,startStage,startWave,spawn,hit,useSkill,attack,muzzle,drawBattle,runEvent,save,persist,
 botPerk,get perk(){return perkPick},placeBarrels,get endless(){return endless},
 get state(){return {fever:feverT>0,civSaved,sc,stageIdx,wave,wavesTotal,toSpawn,pending,zs:zs.length,hp,maxHP,coins,energy,kills,loot,parts:parts.n,projs:projs.n,drops:drops.length,dialog:!!dialog,stageDone,signal,floorsBuilt,levels}},get enemies(){return zs},
 setLevels(a){levels=a.slice()},setRes(c2,e2){coins=c2;energy=e2},set sc(v){sc=v},get sc(){return sc},setQuality(v){qualityLow=v},set freeze(v){dbgFreeze=v},set bot(v){autoBot=v},skipDialog(){while(dialog){dialog.t=99;advanceDialog()}},
 step(n,dt=1/60){dbgFreeze=false;for(let i=0;i<n;i++){if(dialog){dialog.t=99;advanceDialog()}guideTip=null;if(perkPick&&autoBot)botPerk();tick(dt)}dbgFreeze=true},afterClear,tryBuild,setMounts,get clearInfo(){return clearInfo},setHP(v){hp=v}};}
function loop(now){let dt=last?(now-last)/1000:0;last=now;perf(Math.min(dt,.25));draw(Math.min(dt,.1));if(API){if(typeof requestAnimationFrame==='function')requestAnimationFrame(loop);else if(c.requestAnimationFrame)c.requestAnimationFrame(loop)}else requestAnimationFrame(loop)}
if(API){if(typeof requestAnimationFrame==='function')requestAnimationFrame(loop);else if(c.requestAnimationFrame)c.requestAnimationFrame(loop)}else requestAnimationFrame(loop);
})();
