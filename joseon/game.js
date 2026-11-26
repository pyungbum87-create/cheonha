/* 조선 디펜스: 임진왜란 — BEPA 표준 틀
 * 정통 타워 디펜스 · 4스테이지 · 장수(배치+책략) · 공적·관직·본영 강화 · 한국어 / 简体中文
 * Canvas2D · 외부 CDN 없음 · 강제 광고 없음
 */
(()=>{'use strict';
const W=750,H=1334,TAU=Math.PI*2;
const VW=360,VH=640,K=W/VW;            // 내부 설계 좌표(360×640)를 750×1334에 맞춤
const TOP=34,BOT=560;
const PLATFORM=typeof wx!=='undefined'?'wx':typeof tt!=='undefined'?'tt':'web';
const API=PLATFORM==='wx'?wx:PLATFORM==='tt'?tt:null;
const c=API?API.createCanvas():document.getElementById('game');
let g=c.getContext('2d');
const info=API?(API.getSystemInfoSync?API.getSystemInfoSync():{windowWidth:375,windowHeight:667,pixelRatio:1}):null;
let dpr=1,view={s:1,ox:0,oy:0};
if(API){dpr=Math.min(2,info.pixelRatio||1);c.width=Math.max(1,Math.round((info.windowWidth||375)*dpr));c.height=Math.max(1,Math.round((info.windowHeight||667)*dpr));
 const s=Math.min(c.width/W,c.height/H);view={s,ox:(c.width-W*s)/2,oy:(c.height-H*s)/2};}
else{c.width=W;c.height=H;}
const BUILD='1126-1300';
const FONT='"PingFang SC","Apple SD Gothic Neo","Noto Sans KR","Noto Sans SC","Microsoft YaHei",sans-serif';
// 안전장치: 반지름이 음수면 그리기 전체가 멈추므로 0으로 보정
(function(){const P=Object.getPrototypeOf(g);if(!P||P.__safe)return;P.__safe=true;const oa=P.arc,oe=P.ellipse;
 if(oa)P.arc=function(x,y,r,a0,a1,ccw){return oa.call(this,x,y,r>0&&isFinite(r)?r:0,a0,a1,ccw)};
 if(oe)P.ellipse=function(x,y,rx,ry,rot,a0,a1,ccw){return oe.call(this,x,y,rx>0&&isFinite(rx)?rx:0,ry>0&&isFinite(ry)?ry:0,rot,a0,a1,ccw)}})();

// ---------------------------------------------------------------- 그림 (res/*.png 를 넣고 IMG_LIST에 이름 추가)
const imgs={},imgFail={};
const IMG_LIST=['tower_archer_1','tower_archer_2','tower_archer_3','tower_militia_1','tower_militia_2','tower_militia_3','tower_rocket_1','tower_rocket_2','tower_rocket_3',
 'tower_cannon_1','tower_cannon_2','tower_cannon_3','unit_militia','hero_kimsimin','enemy_s','enemy_g','enemy_h','enemy_a','enemy_b','gate','tile_grass','tile_road','enemy_s_walk','enemy_g_walk','enemy_a_walk','enemy_b_walk','enemy_h_walk','unit_militia_walk','hero_kimsimin_idle','hero_kimsimin_walk','hero_kimsimin_atk','icon_coin','icon_heart','icon_star','icon_hero','icon_shield','icon_drum','ui_hanji','icon_drum_zh','tower_archer_1_fire','tower_archer_2_fire','tower_archer_3_fire','tower_cannon_1_fire','tower_cannon_2_fire','tower_cannon_3_fire','tower_rocket_1_fire','tower_rocket_2_fire','tower_rocket_3_fire'];
IMG_LIST.push('atk_s','atk_g','atk_a','atk_b','atk_h','atk_m','walk_d','atk_d','walk_c','atk_c','dead_m','dead_s','dead_g','dead_a','dead_h','dead_b','icon_hist','icon_guide','icon_gear','icon_pause','icon_fast','icon_zoom','btn_frame','slot_base','walk_k','atk_k','hero_kwak_idle','hero_kwak_walk','hero_kwak_atk','icon_kwak','tower_archer_4a','tower_archer_4b','tower_militia_4a','tower_militia_4b','tower_rocket_4a','tower_rocket_4b','tower_cannon_4a','tower_cannon_4b');
// 첫 화면에 필요 없는 그림은 res2/ 묶음으로 뒤에서 받음 (첫 다운로드 줄이기)
const RES2=['tower_archer_4a','tower_archer_4b','tower_militia_4a','tower_militia_4b','tower_rocket_4a','tower_rocket_4b','tower_cannon_4a','tower_cannon_4b','hero_kwak_idle','hero_kwak_walk','hero_kwak_atk','icon_kwak','walk_k','atk_k','enemy_b','enemy_b_walk','atk_b','dead_b','walk_d','atk_d'];for(const n of RES2){const i=IMG_LIST.indexOf(n);if(i>=0)IMG_LIST.splice(i,1)}
// 배경(art/)·이야기 컷(story/)은 위챗·더우인에서 분包으로 받음 (주 패키지 4MB 제한)
const ART_LIST=['bg_1','bg_2','bg_3','bg_4','bg_sangju','bg_imjin','bg_title','bg_map'],STORY_LIST=['s13','s14','s15','s16','s17','s18','s19','s20','s21','s22','s23','s24','win','lose'].map(n=>'story_'+n);
// 동작 그림 메타: [칸폭, 칸높이, 발 x, 발 y] — 기준 자세 높이 180px
const ANIM={"hero_kwak_atk":[4, 0.6075, 0.9762, 0.9524],"walk_k":[8, 0.4446, 0.9762, 0.9524],"atk_k":[4, 0.6117, 0.9762, 0.9524],"atk_s":[4,0.7024,0.984,0.9626],"atk_g":[4,0.6831,0.9845,0.9278],"atk_a":[4,0.6779,0.9841,0.9524],"atk_b":[4,0.4604,0.9844,0.9375],"atk_h":[4,0.6073,0.9839,0.9677],"atk_m":[4,0.7161,0.9839,0.9677],"walk_d":[8,0.5743,0.984,0.9626],"atk_d":[4,0.7045,0.9839,0.9677],"walk_c":[4,0.5096,0.9839,0.9677],"atk_c":[4,0.3807,0.9851,0.8955],"hero_kimsimin_atk":[4,0.619,0.985,0.9]};
function animB(n,fi,x,by,h,flip){const im=imgs[n],m=ANIM[n];if(!im||!m)return false;const cw=im.width/m[0],ch=im.height,k=h/(m[3]*ch),w=cw*k,hh=ch*k,dx=-m[1]*cw*k,dy=by-m[2]*ch*k;
 if(flip){g.save();g.translate(x,0);g.scale(-1,1);g.drawImage(im,fi*cw,0,cw,ch,dx,dy,w,hh);g.restore()}else g.drawImage(im,fi*cw,0,cw,ch,x+dx,dy,w,hh);return true}
const MUST=['tower_archer_1','enemy_s','tile_grass','tile_road'];
function loadImg(name,tries=0){const im=API?(API.createImage?API.createImage():c.createImage()):new Image();im.onload=()=>{imgs[name]=im};im.onerror=()=>{if(tries<8)setTimeout(()=>loadImg(name,tries+1),600+tries*900);else imgFail[name]=1};
 im.src=(name.startsWith('bg_')?'art/'+name+'.jpg':name.startsWith('story_')?'story/'+name.slice(6)+'.jpg':(RES2.includes(name)?'res2/':'res/')+name+'.png')+(API?'':'?v='+BUILD+(tries?'r'+tries:''))}
IMG_LIST.forEach(n=>loadImg(n));
const SUBS={res2:()=>RES2.forEach(n=>loadImg(n)),art:()=>ART_LIST.forEach(n=>loadImg(n)),story:()=>STORY_LIST.forEach(n=>loadImg(n)),audio:()=>{Music.subOk=true}};
function loadSubs(){for(const k of Object.keys(SUBS)){if(typeof SUBS[k]!=='function')continue;if(API&&API.loadSubpackage){try{API.loadSubpackage({name:k,success:()=>SUBS[k](),fail:()=>{if(k!=='audio')SUBS[k]()}})}catch(e){SUBS[k]()}}else SUBS[k]()}}
function sprite(n,x,y,s){const im=imgs[n];if(!im)return false;g.drawImage(im,x-s/2,y-s/2,s,s);return true}
// 바닥 기준으로 그리기 (flip=true면 좌우 반전, 그림은 왼쪽을 보고 있음)
function spriteB(n,x,by,s,flip){const im=imgs[n];if(!im)return false;const w=s*im.width/Math.max(im.width,im.height),h=s*im.height/Math.max(im.width,im.height);
 if(flip){g.save();g.translate(x,0);g.scale(-1,1);g.drawImage(im,-w/2,by-h,w,h);g.restore()}else g.drawImage(im,x-w/2,by-h,w,h);return true}
// 가로 한 줄 프레임 시트(정사각 칸 n개) 그리기
const WALK={k:{n:8,per:.2},c:{n:8,per:.16,img:'s'},d:{n:8,per:.2},s:{n:8,per:.2},g:{n:8,per:.22},a:{n:8,per:.26},b:{n:8,per:.32},h:{n:8,per:.11}};
function stripB(n,count,fi,x,by,s,flip){const im=imgs[n];if(!im)return false;const cw=im.width/count,ch=im.height,w=s*cw/Math.max(cw,ch),h=s*ch/Math.max(cw,ch),sx=(fi%count)*cw;
 if(flip){g.save();g.translate(x,0);g.scale(-1,1);g.drawImage(im,sx,0,cw,ch,-w/2,by-h,w,h);g.restore()}else g.drawImage(im,sx,0,cw,ch,x-w/2,by-h,w,h);return true}
const pats={};function pat(n){if(pats[n])return pats[n];const im=imgs[n];if(!im||!g.createPattern)return null;try{pats[n]=g.createPattern(im,'repeat')}catch(e){pats[n]=null}return pats[n]}
// 아이콘(가운데 기준), 한지 질감 덧칠
function icon(n,x,y,s){if(n==='drum'&&LANG==='zh'&&imgs.icon_drum_zh)n='drum_zh';return sprite('icon_'+n,x,y,s)}
// 발사 동작 스트립: [칸폭,칸높이,물체x,물체y,물체폭,물체높이] — 물체를 정적 그림과 같은 크기 s로 그림
const FIRE={"archer_1":[112,154,2.0,2.0,107.3,150.0],"archer_2":[113,154,2.0,2.0,108.4,150.0],"archer_3":[125,154,2.0,2.0,120.0,150.0],"cannon_1":[209,127,55.9,2.0,150.0,121.6],"cannon_2":[178,121,25.6,2.0,150.0,115.3],"cannon_3":[187,140,33.8,4.8,150.0,131.9],"rocket_1":[167,188,18.1,35.2,145.4,150.0],"rocket_2":[163,165,8.0,37.3,150.0,124.9],"rocket_3":[186,155,33.8,4.9,150.0,146.8]};
function fireStrip(n,fi,x,by,s,flip){const im=imgs[n+'_fire'],m=FIRE[n.slice(6)];if(!im||!m)return false;const k=s/Math.max(m[4],m[5]),w=m[0]*k,h=m[1]*k,dx=-(m[2]+m[4]/2)*k,dy=by-(m[3]+m[5])*k;
 if(flip){g.save();g.translate(x,0);g.scale(-1,1);g.drawImage(im,fi*m[0],0,m[0],m[1],dx,dy,w,h);g.restore()}else g.drawImage(im,fi*m[0],0,m[0],m[1],x+dx,dy,w,h);return true}
function fireFrame(t){const a=t.fa==null?9:t.fa;if(t.kind==='archer')return a<.07?1:a<.2?2:a<.34?3:0;return a<.1?1:a<.26?2:a<.42?3:0}
function cover(n,dim){const im=imgs[n];if(!im)return false;const h=VH,w=h*im.width/im.height;g.drawImage(im,(VW-w)/2,0,w,h);if(dim){g.fillStyle=dim;g.fillRect(0,0,VW,VH)}return true}
function paper(x,y,w,h,r,a){if(typeof perf!=='undefined'&&perf.low)return;const p=pat('ui_hanji');if(!p)return;g.save();rr(x,y,w,h,r);g.clip();g.globalAlpha=a||.14;g.globalCompositeOperation='overlay';g.fillStyle=p;g.fillRect(x,y,w,h);g.restore()}

// ---------------------------------------------------------------- 언어
let LANG='ko';
try{if(API){const sl=((API.getSystemInfoSync&&API.getSystemInfoSync().language)||'').toLowerCase();LANG=sl.indexOf('ko')===0?'ko':'zh'}
 else{const langs=(typeof navigator!=='undefined'?(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||'']):[]).map(x=>(x||'').toLowerCase());
  let tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){}
  const zhTZ=/^Asia\/(Shanghai|Chongqing|Chungking|Harbin|Urumqi|Kashgar|Hong_Kong|Macau|Taipei)$/.test(tz)||tz==='PRC';
  if(langs[0]&&langs[0].indexOf('zh')===0)LANG='zh';else if(zhTZ&&!(langs[0]&&langs[0].indexOf('ko')===0))LANG='zh'}}catch(e){}
let LANG_FORCED=null;try{if(!API&&typeof location!=='undefined'){const m=location.search.match(/[?&]lang=(ko|zh)/);if(m)LANG_FORCED=m[1]}}catch(e){}if(LANG_FORCED)LANG=LANG_FORCED;
const L=(ko,zh)=>LANG==='zh'?zh:ko;
const LL=p=>Array.isArray(p)?(LANG==='zh'?p[1]:p[0]):(p||'');

// ---------------------------------------------------------------- 저장
const SAVE_KEY='bepa_joseon_v1';
const UP_KEYS=['archer','militia','rocket','cannon','gold','skill'];
const save={tips:{},stars:[],merit:0,meritTotal:0,up:{archer:0,militia:0,rocket:0,cannon:0,gold:0,skill:0},
 orders:null,beacon:{last:'',n:0},honor:[],farm:0,cart:null,statc:{},lastRank:0,histRead:[],seen:[],chal:[],hero:'kim',lang:null,music:true,sfx:true,shake:true,vib:true,plays:0,mild:null,quality:'auto',firstOpen:0};
try{const raw=API&&API.getStorageSync?API.getStorageSync(SAVE_KEY):typeof localStorage!=='undefined'?localStorage.getItem(SAVE_KEY):null;const v=raw?JSON.parse(raw):null;
 if(v){for(const k in save)if(v[k]!==undefined)save[k]=v[k];save.up=Object.assign({archer:0,militia:0,rocket:0,cannon:0,gold:0,skill:0},v.up||{});if(!save.beacon||typeof save.beacon!=='object')save.beacon={last:'',n:0};if(!Array.isArray(save.histRead))save.histRead=[]}}catch(e){}
if(!LANG_FORCED&&(save.lang==='ko'||save.lang==='zh'))LANG=save.lang;
if(!save.farm)save.farm=Date.now();
// 순화 연출: 중국어·위챗·더우인은 기본 켜짐 (쓰러진 모습 대신 연기로 사라짐)
if(save.mild==null)save.mild=PLATFORM!=='web'||LANG==='zh';
if(!save.firstOpen){save.firstOpen=Date.now();setTimeout(()=>{track('first_open',{lang:LANG,platform:PLATFORM});persist()},50)}
// 화질: auto는 전투 중 프레임이 낮으면 저사양으로 한 번 전환
const perf={low:save.quality==='low',acc:0,n:0,checked:false};
function persist(){save.lang=LANG;try{const v=JSON.stringify(save);if(API&&API.setStorageSync)API.setStorageSync(SAVE_KEY,v);else if(typeof localStorage!=='undefined')localStorage.setItem(SAVE_KEY,v)}catch(e){}}
function todayKey(){const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()}

// ---------------------------------------------------------------- 효과음(합성) · 배경음악(합성)
// 효과음 파일 (Pixabay, 상업 무료·표기 불필요) [파일, 음량] — 없으면 합성음으로 대체
const SFX={arrow:['sfx_arrow',.32],rocket:['sfx_rocket',.4],boom:['sfx_boom',.55],cannon:['sfx_cannon',.5],clash:['sfx_clash',.38],slash:['sfx_slash',.5],shot:['sfx_shot',.42],coin:['sfx_coin',.3],build:['sfx_build',.6],up:['sfx_up',.55],horn:['sfx_horn',.5],drum:['sfx_drum',.75],win:['sfx_win',.8],lose:['sfx_lose',.7]};
const AudioFx={ctx:null,enabled:save.sfx!==false,master:null,last:{},
 init(){if(this.ctx)return;try{let A=null;if(API&&API.createWebAudioContext){this.ctx=API.createWebAudioContext()}else{A=typeof AudioContext!=='undefined'?AudioContext:typeof webkitAudioContext!=='undefined'?webkitAudioContext:null;if(A)this.ctx=new A()}
  if(this.ctx){this.master=this.ctx.createGain();this.master.gain.value=.8;this.master.connect(this.ctx.destination)}}catch(e){this.ctx=null}this.loadSamples()},
 buf:{},pool:{},
 loadSamples(){for(const k in SFX){const n=SFX[k][0];if(this.buf[n]||this.pool[n])continue;
  if(API){if(!API.createInnerAudioContext)continue;try{this.pool[n]={i:0,a:[0,1,2].map(()=>{const a=API.createInnerAudioContext();a.src='res/snd/'+n+'.mp3';return a})}}catch(e){}continue}
  if(!this.ctx||typeof fetch==='undefined')continue;this.buf[n]=1;fetch('res/snd/'+n+'.mp3?v='+BUILD).then(r=>r.arrayBuffer()).then(ab=>new Promise((ok,no)=>{const p=this.ctx.decodeAudioData(ab,ok,no);if(p&&p.then)p.then(ok,no)})).then(b=>{this.buf[n]=b}).catch(()=>{this.buf[n]=0})}},
 sample(n,vol){const b=this.buf[n];if(b&&b!==1){try{const s=this.ctx.createBufferSource(),v=this.ctx.createGain();s.buffer=b;v.gain.value=vol;s.connect(v);v.connect(this.master);s.start();return true}catch(e){return false}}
  const P=this.pool[n];if(P){try{const a=P.a[P.i++%P.a.length];a.volume=Math.min(1,vol);a.stop&&a.stop();a.seek&&a.seek(0);a.play();return true}catch(e){return false}}return false},
 tone(type,f1,f2,dur,vol,delay,dest){const ctx=this.ctx,t0=ctx.currentTime+(delay||0),o=ctx.createOscillator(),v=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f1,t0);o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t0+dur);v.gain.setValueAtTime(vol,t0);v.gain.exponentialRampToValueAtTime(.0005,t0+dur);o.connect(v);v.connect(dest||this.master);o.start(t0);o.stop(t0+dur+.02)},
 noise(dur,vol,freq,q,delay,dest){const ctx=this.ctx,t0=ctx.currentTime+(delay||0),n=Math.max(1,Math.floor(ctx.sampleRate*dur)),b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
  const s=ctx.createBufferSource();s.buffer=b;const f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=freq;f.Q.value=q||1;const v=ctx.createGain();v.gain.setValueAtTime(vol,t0);v.gain.exponentialRampToValueAtTime(.0005,t0+dur);s.connect(f);f.connect(v);v.connect(dest||this.master);s.start(t0)},
 cue(k,gap=.06){if(!this.enabled||(!this.ctx&&!API))return;const now=Date.now()/1000;if(this.last[k]&&now-this.last[k]<gap)return;this.last[k]=now;
  const S=SFX[k];if(S&&this.sample(S[0],S[1]))return;if(!this.ctx)return;
  try{const T=this;switch(k){
   case 'arrow':T.noise(.05,.12,3200,3);break;
   case 'rocket':T.noise(.28,.14,1400,.8);T.tone('sawtooth',600,200,.25,.03);break;
   case 'boom':T.tone('sine',130,38,.35,.35);T.noise(.25,.18,300,.7);break;
   case 'die':T.tone('square',420,180,.07,.04);break;
   case 'leak':T.tone('sine',90,45,.35,.4);break;
   case 'build':T.tone('triangle',320,260,.07,.25);T.tone('triangle',380,300,.07,.2,.09);break;
   case 'up':T.tone('triangle',520,780,.12,.18);T.tone('triangle',780,1040,.14,.15,.1);break;
   case 'coin':T.tone('square',990,990,.05,.05);T.tone('square',1320,1320,.08,.05,.06);break;
   case 'horn':T.tone('sawtooth',196,220,.7,.06);T.tone('sawtooth',294,330,.7,.04);break;
   case 'clash':T.noise(.06,.14,3800,4);T.tone('square',1800,900,.04,.03);break;
   case 'slash':T.noise(.08,.16,2400,1.5);T.tone('triangle',300,120,.08,.08);break;
   case 'shot':T.noise(.09,.2,900,1.2);T.tone('square',160,60,.06,.05);break;
   case 'smash':T.tone('sine',90,30,.45,.45);T.noise(.35,.25,220,.6);break;
   case 'fire':T.noise(.4,.12,700,.5);break;
   case 'repair':[440,554,659].forEach((f,i)=>T.tone('triangle',f,f,.1,.12,i*.07));break;
   case 'drum':for(let i=0;i<4;i++)T.tone('sine',70,40,.3,.5,i*.32);break;
   case 'skill':T.tone('triangle',392,392,.4,.15);T.tone('triangle',523,523,.4,.12,.08);T.tone('triangle',659,659,.5,.1,.16);break;
   case 'win':[523,659,784,1046].forEach((f,i)=>T.tone('triangle',f,f,.25,.15,i*.12));break;
   case 'lose':[392,330,262].forEach((f,i)=>T.tone('sawtooth',f,f*.97,.35,.06,i*.25));break;
   case 'ui':T.tone('triangle',660,660,.05,.08);break;
   case 'reward':[784,988,1175,1568].forEach((f,i)=>T.tone('triangle',f,f,.18,.12,i*.07));break}}catch(e){}}};
// 배경음악: 국악 5음계(황·태·중·임·남)를 합성해 끊김 없이 반복. 저작권 문제 없음
const SCALE=[293.66,329.63,392,440,493.88,587.33,659.26,783.99];
const SONGS={
 menu:{spb:.42,mel:[3,-1,4,3,2,-1,1,-1,2,3,-1,2,1,-1,0,-1, 3,-1,5,4,3,-1,2,-1,1,2,-1,3,2,-1,-1,-1],drum:[0,8,16,24],vol:.05},
 battle:{spb:.22,mel:[0,-1,2,3,4,-1,3,2,3,-1,4,5,4,-1,3,-1, 5,-1,4,3,2,-1,3,-1,2,-1,1,2,0,-1,-1,-1],drum:[0,4,8,12,16,20,24,28],tap:[2,6,10,14,18,22,26,30],vol:.045},
 boss:{spb:.26,mel:[0,-1,0,1,-1,0,-1,-1,2,-1,1,-1,0,-1,-1,-1],drum:[0,2,4,6,8,10,12,14],vol:.05,low:true}};
const Music={on:save.music!==false,cur:'',next:0,step:0,hidden:false,gain:null,files:{menu:'audio/bgm_menu.mp3',battle:'audio/bgm_battle.mp3',boss:'audio/bgm_boss.mp3'},el:{},fail:{},playing:null,subOk:false,
 getEl(k){if(this.el[k])return this.el[k];if(!this.files[k])return null;try{let a;if(API){if(!API.createInnerAudioContext||!this.subOk)return null;a=API.createInnerAudioContext();a.src=this.files[k];a.onError&&a.onError(()=>{this.fail[k]=1})}
  else{if(typeof Audio==='undefined')return null;a=new Audio(this.files[k]+'?v='+BUILD);a.addEventListener('error',()=>{this.fail[k]=1})}a.loop=true;a.volume=k==='menu'?.45:.38;this.el[k]=a;return a}catch(e){this.fail[k]=1;return null}},
 fileTick(){const want=this.on&&!this.hidden&&this.cur&&!this.fail[this.cur]?this.cur:'';if(this.playing&&this.playing!==want){try{this.el[this.playing].pause()}catch(e){}this.playing=null}
  if(!want)return !!(this.cur&&!this.fail[this.cur]&&this.el[this.cur]);if(!API&&!AudioFx.ctx)return true;const a=this.getEl(want);if(!a)return false;if(this.playing!==want){this.playing=want;try{a.currentTime=0}catch(e){}try{const p=a.play();if(p&&p.catch)p.catch(()=>{this.playing=null})}catch(e){}}return true},
 play(k){if(this.cur===k)return;this.cur=k;this.step=0;this.next=0},
 stop(){this.cur=''},
 toggle(){this.on=!this.on},
 tick(){if(this.fileTick())return;const ctx=AudioFx.ctx;if(!ctx||!this.on||this.hidden||!this.cur||!SONGS[this.cur])return;const S=SONGS[this.cur];
  if(!this.gain){this.gain=ctx.createGain();this.gain.gain.value=1;this.gain.connect(AudioFx.master)}
  if(this.next<ctx.currentTime)this.next=ctx.currentTime+.05;
  while(this.next<ctx.currentTime+.3){const st=this.step%S.mel.length,n=S.mel[st],d=this.next-ctx.currentTime;
   try{if(n>=0){const f=SCALE[n]*(S.low?.5:1);AudioFx.tone('triangle',f,f*.995,S.spb*1.6,S.vol,d,this.gain);AudioFx.tone('sine',f*2,f*2,S.spb*.8,S.vol*.25,d,this.gain)}
    if(S.drum&&S.drum.indexOf(st)>=0)AudioFx.tone('sine',S.low?62:90,40,.28,S.low?.22:.14,d,this.gain);
    if(S.tap&&S.tap.indexOf(st)>=0)AudioFx.noise(.06,.05,2400,2,d,this.gain);
    if(st%16===0&&!S.tap)AudioFx.tone('sine',SCALE[0]*.5,SCALE[0]*.5,S.spb*8,S.vol*.6,d,this.gain)}catch(e){}
   this.next+=S.spb;this.step++}}};
function wantMusic(){if(sc==='loading'||sc==='clear'||sc==='fail'){Music.play('');return}
 if(sc==='battle'&&B&&B.phase==='play')Music.play(B.enemies.some(e=>e.E.boss)?'boss':'battle');else Music.play('menu')}
loadSubs();

// ---------------------------------------------------------------- 진동 · 통계 · 광고 · 공유 · 생명주기
let vibT=0;function vib(kind){if(save.vib===false)return;const now=Date.now();if(kind==='light'&&now-vibT<250)return;vibT=now;try{if(API&&API.vibrateShort)API.vibrateShort({type:kind==='heavy'?'heavy':kind==='medium'?'medium':'light'});else if(API&&API.vibrateLong&&kind==='long')API.vibrateLong();else if(typeof navigator!=='undefined'&&navigator.vibrate)navigator.vibrate(kind==='heavy'?60:kind==='medium'?35:15)}catch(e){}}
// 위챗 reportEvent / 더우인 reportAnalytics — 관리자 화면에 같은 이벤트 이름을 등록해야 집계됨 (README_KO.md 참고)
const STAT_LOG=[];function track(ev,data){data=data||{};try{STAT_LOG.push([ev,data]);if(STAT_LOG.length>200)STAT_LOG.shift();
 if(API&&PLATFORM==='wx'&&API.reportEvent)API.reportEvent(ev,data);else if(API&&PLATFORM==='tt'&&API.reportAnalytics)API.reportAnalytics(ev,data);
 save.statc[ev]=(save.statc[ev]||0)+1}catch(e){}}
const AD_UNIT={wx:'adunit-xxxxxxxxxxxxxxxx',tt:'xxxxxxxxxxxxxxxxxx'};// ← 플랫폼 광고 단위 ID로 교체
let adShow=null,adObj=null,adCb=null;
function showAd(place,cb0){if(adShow)return;track('ad_open',{place});const cb=()=>{track('ad_reward',{place});cb0()};
 if(API&&API.createRewardedVideoAd&&AD_UNIT[PLATFORM]&&AD_UNIT[PLATFORM].indexOf('xxxx')<0){try{if(!adObj){adObj=API.createRewardedVideoAd({adUnitId:AD_UNIT[PLATFORM]});adObj.onClose(r=>{const ok=!r||r.isEnded!==false;const f=adCb;adCb=null;if(ok&&f)f();else message(L('끝까지 시청해야 보상을 받아요','需完整观看才能获得奖励'),1.4)});adObj.onError(()=>{adCb=null;message(L('광고를 불러오지 못했어요','广告加载失败'),1.2)})}
  adCb=cb;adObj.show().catch(()=>adObj.load().then(()=>adObj.show()).catch(()=>{adCb=null;message(L('광고를 불러오지 못했어요','广告加载失败'),1.2)}))}catch(e){cb()}return}
 adShow={t:0,cb,place}}// 테스트 환경: 2초 가짜 광고
function drawAd(dt){adShow.t+=dt;g.fillStyle='rgba(0,0,0,.9)';g.fillRect(0,0,VW,VH);txt(L('광고 재생 중 (테스트)','广告播放中（测试）'),180,300,15,'#fff');rr(80,326,200,8,4,'#222');rr(81,327,198*Math.min(1,adShow.t/2),6,3,'#ffcf6a');
 txt(L('실제 출시판에서는 보상형 광고가 재생됩니다','正式版将播放激励视频广告'),180,356,9,'#9fb0c4');if(adShow.t>=2){const f=adShow.cb;adShow=null;f()}}
function shareGame(){track('share',{});const title=L('왜군을 막아 성문을 지켜라! 나는 ','守住城门，击退倭军！我已获得 ')+starTotal()+L('개의 별을 얻었다',' 颗星');
 if(API&&API.shareAppMessage){try{API.shareAppMessage({title})}catch(e){}}else message(L('공유는 위챗·더우인에서 동작해요','分享功能在微信/抖音中可用'),1.4)}
if(API){try{API.showShareMenu&&API.showShareMenu({withShareTicket:false});API.onShareAppMessage&&API.onShareAppMessage(()=>({title:L('조선 디펜스 — 성문을 지켜라!','朝鲜守城 — 守住城门！')}))}catch(e){}
 try{if(API.getUpdateManager){const um=API.getUpdateManager();um.onUpdateReady&&um.onUpdateReady(()=>{um.applyUpdate&&um.applyUpdate()})}}catch(e){}}
function onAppHide(){if(sc==='battle'&&B&&B.phase==='play')paused=true;Music.hidden=true;persist();track('app_hide',{sc})}
function onAppShow(){Music.hidden=false;Music.next=0;last=0}
if(API){try{API.onHide&&API.onHide(onAppHide);API.onShow&&API.onShow(onAppShow)}catch(e){}}
else if(typeof document!=='undefined'){document.addEventListener('visibilitychange',()=>{if(document.hidden)onAppHide();else onAppShow()})}

// ---------------------------------------------------------------- 데이터 (설계서 3-3 · 3-8)
const TOWERS={
 archer :{name:['궁수대','弓手台'],color:'#4f9a3e',cost:[65,100,145],dmg:[5,5.5,6.5],shots:[1,2,3],rate:[.8,.65,.55],range:[80,92,104],type:'phys',
  fx:[['화살 1발','射1箭'],['화살 2발 동시!','同时射2箭！'],['화살 3발 연사!','3箭齐射！']]},
 militia:{name:['의병 막사','义兵营'],short:['의병','义兵'],color:'#b5803d',cost:[65,100,145],hp:[45,90,135],sdmg:[2,3.5,8],srate:1,range:70,type:'phys',guard:[0,0,.3],
  fx:[['의병 3명','义兵3人'],['체력 2배 · 투구','体力翻倍 · 头盔'],['갑옷: 받는 피해 -30%','铠甲：受伤 -30%']]},
 rocket :{name:['신기전','神机箭'],color:'#c8402f',cost:[90,145,215],dmg:[12,13,16],shots:[1,2,3],rate:[1.4,1.4,1.3],range:[75,85,95],type:'fire',burn:[0,0,4],
  fx:[['불화살 1발','火箭1发'],['불화살 2발','火箭2发'],['3발 + 불길(지속 피해)','3发 + 灼烧(持续伤害)']]},
 cannon :{name:['총통','铳筒'],color:'#5b6378',cost:[110,200,290],dmg:[10,20,32],rate:[2.5,2.5,2.3],range:[80,90,100],splash:[30,36,44],stun:[0,0,.6],type:'blast',
  fx:[['포탄 범위 공격','炮弹范围攻击'],['폭발 범위 +20%','爆炸范围 +20%'],['큰 폭발 + 기절','大爆炸 + 眩晕']]}};
const TORDER=['archer','militia','rocket','cannon'];
const ENEMIES={
 s:{name:['창병','枪兵'],hp:30,spd:40,armor:0,gold:4,r:7,color:'#e6e2d8',atk:2,lives:1},
 g:{name:['조총병','铁炮兵'],hp:45,spd:34,armor:.15,gold:6,r:7,color:'#9fb4b0',atk:3,lives:1,shot:{range:72,rate:1.8,dmg:6}},
 k:{name:['은갑 대장','银甲大将'],hp:520,spd:24,armor:.35,gold:45,r:11,color:'#aab',atk:10,lives:3,mid:true,spr:'a'},
 d:{name:['방패병','盾兵'],hp:75,spd:31,armor:.2,gold:9,r:8,color:'#8a6a40',atk:3,lives:1,shield:.6},
 c:{name:['화공병','火攻兵'],hp:60,spd:30,armor:.1,gold:9,r:7,color:'#d0603a',atk:3,lives:1,spr:'s',siege:{range:64,rate:2.4,dmg:30}},
 h:{name:['기마무사','骑马武士'],hp:40,spd:75,armor:0,gold:7,r:9,color:'#e2b04a',atk:3,lives:1},
 a:{name:['갑옷무사','铠甲武士'],hp:110,spd:28,armor:.6,gold:12,r:9,color:'#8a68b0',atk:5,lives:1},
 b:{name:['흑철 대장','黑铁大将'],hp:1200,spd:20,armor:.4,gold:100,r:16,color:'#262626',atk:20,lives:5,boss:true,smash:{range:92,rate:8,dmg:80}}};
const HERO={name:['김시민','金时敏'],aura:75,atkDmg:6,atkRate:1,range:70,skillCd:50,skillDur:10,hp:150,hpLv:30,dmg:9,dmgLv:3,rate:.75,spd:78,reach:30,respawn:12};
// 장수 두 명: 김시민(타워 지휘·튼튼) / 곽재우(의병 지휘·빠름). 동래성 승리 시 곽재우 합류
const HEROES={kim:{id:'kim',name:['김시민','金时敏'],life:'1554~1592',spr:'hero_kimsimin',ic:'hero',walkH:36,idleH:42,atkH:40.7,hp:150,hpLv:30,dmg:9,dmgLv:3,rate:.75,spd:78,tAura:.15,mAura:.15,
  d:['진주목사. 주변 타워 공격 +15%, 튼튼함','晋州牧使。周围防御塔攻击 +15%，体魄强健']},
 kwak:{id:'kwak',name:['곽재우','郭再祐'],life:'1552~1617',spr:'hero_kwak',ic:'kwak',walkH:42,idleH:42,atkH:41,hp:120,hpLv:24,dmg:8,dmgLv:3,rate:.6,spd:104,tAura:0,mAura:.35,
  d:['붉은 옷의 의병장 "홍의장군". 주변 의병 공격 +35%, 빠름','红衣义兵将"红衣将军"。周围义兵攻击 +35%，行动迅速']}};
function heroUnlocked(k){return k==='kim'||(save.stars[1]||0)>0}
function applyHero(){const k=heroUnlocked(save.hero)?save.hero:'kim';Object.assign(HERO,HEROES[k])}
// 눌러서 쓰는 책략 2개 (설계서 3-2 개정: 관전형 → 손이 바쁜 전투)
const SK={fire:{name:['화차 일제사격','火车齐射'],cd:34,r:42,dmg:20,n:10},reinf:{name:['의병 증원','义兵增援'],cd:26,hp:70,dmg:5,life:14}};
const TOWER_HP=[100,150,220,300];
// 4단계 갈래: 3단계 다음에 둘 중 하나 (설계서 3-3)
const BR={archer:{a:{n:['편전대','片箭台'],d:['한 발 강타·멀리','单发重击·射程远'],cost:210,dmg:38,shots:1,rate:1.05,range:124,pierce:1},b:{n:['화전대','火箭台'],d:['불화살 3발+화상','3支火箭+灼烧'],cost:210,dmg:7,shots:3,rate:.55,range:108,burn:3,firearrow:1}},
 militia:{a:{n:['승병 암자','僧兵庵'],d:['강한 승병 3명','3名强壮僧兵'],cost:210,hp:240,sdmg:12,guard:.4},b:{n:['의병 본진','义兵本营'],d:['의병 4명·빨리 부활','4名义兵·快速复活'],cost:210,hp:160,sdmg:8,guard:.3,men:4,respawn:5}},
 rocket:{a:{n:['대신기전','大神机箭'],d:['큰 불화살 3발+화상','3发大火箭+灼烧'],cost:300,dmg:28,shots:3,rate:1.3,range:112,burn:7},b:{n:['화차','火车'],d:['불화살 6발 연사','6发火箭连射'],cost:300,dmg:16,shots:6,rate:1.5,range:96,burn:0}},
 cannon:{a:{n:['천자총통','天字铳筒'],d:['초대형 포탄·멀리','超大炮弹·射程远'],cost:400,dmg:75,rate:3.2,range:122,splash:52,stun:.6},b:{n:['비격진천뢰','飞击震天雷'],d:['시한폭탄·긴 기절','延时炸弹·长眩晕'],cost:400,dmg:42,rate:2.6,range:104,splash:46,stun:1.4,bomb:1}}};
function towerD(t){const base=TOWERS[t.kind];if(t.lv<3||!t.br)return base;if(t.D)return t.D;const b=BR[t.kind][t.br],D=Object.assign({},base,{pierce:b.pierce,firearrow:b.firearrow,bomb:b.bomb,men:b.men,respawn:b.respawn});
 for(const k of ['dmg','rate','range','shots','splash','stun','burn','hp','sdmg','guard']){if(Array.isArray(base[k]))D[k]=base[k].concat([b[k]!=null?b[k]:base[k][2]]);else if(b[k]!=null&&base[k]==null){D[k]=[0,0,0,b[k]]}}return t.D=D}
// 장수 기술: 레벨이 오를 때 3개 중 하나 고르기 (설계서 3-3 · 판마다 다른 고민)
const PERKS={gun:{n:['화포 지휘','火炮指挥'],d:['장수 주변 타워 공격 +15% 추가','将领周围防御塔攻击再 +15%']},
 blade:{n:['명장의 창','名将之枪'],d:['장수 공격력 +60%','将领攻击力 +60%']},
 swift:{n:['날랜 몸놀림','身手敏捷'],d:['장수 이동 +40%, 공격 속도 +33%','将领移速 +40%，攻速 +33%']},
 heal:{n:['군의관','军医'],d:['장수 회복 2배, 부활 12초→6초','将领回复翻倍，复活 12秒→6秒']},
 morale:{n:['사기 진작','鼓舞士气'],d:['의병이 받는 피해 -26%','义兵受到伤害 -26%']},
 fire:{n:['불화살 비','火箭雨'],d:['화차 대기 -30%, 불화살 14발','火车冷却 -30%，火箭14发']},
 call:{n:['의병 소집','召集义兵'],d:['의병 증원 3명, 대기 -20%','义兵增援3人，冷却 -20%']},
 wall:{n:['성벽 고수','死守城墙'],d:['목숨 +4 즉시','立即获得生命 +4']}};
function hasP(k){return B&&B.perks&&B.perks.includes(k)}
function offerPerks(){const pool=Object.keys(PERKS).filter(k=>!B.perks.includes(k));for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}if(pool.length)B.choice={opts:pool.slice(0,3),t:0}}
function pickPerk(i){const k=B.choice&&B.choice.opts[i];if(!k)return;B.perks.push(k);B.choice=null;if(k==='wall')B.lives+=4;if(B.H&&!B.H.dead)B.taps.push({x:B.H.x,y:B.H.y,t:.6,c:'#ffd34d'});AudioFx.cue('up');vib('medium');track('perk',{k})}
const SELL=.6,WAVE_GAP=18,LIVES=20;
const STAGES=[
 {name:['부산진','釜山镇'],year:['1592년 4월','1592年4月'],gold:240,hp:1,bg:'bg_1',
  story:[['s13','1592년 4월 13일, 부산 앞바다가 적의 배로 가득 찼다.','1592年4月13日，釜山海面布满了敌船。'],['s14','첨사 정발: "성을 지킨다! 한 걸음도 물러서지 마라!"','佥使郑拨：“死守城池！一步也不许后退！”']],
  intro:['왜군이 부산진에 상륙했다. 첨사 정발이 성을 지켰다.','倭军在釜山镇登陆。佥使郑拨率军守城。'],
  tip:['빈자리를 누르면 타워, 땅을 누르면 장수가 달려가요. 책략은 아래 단추!','点击空位建塔，点击地面将领就会冲过去。计策在下方按钮！'],
  path:[[180,30],[180,140],[70,140],[70,290],[290,290],[290,440],[180,440],[180,565]],
  waves:[[['s',5,1.2]],[['s',8,1]],[['s',6,1],['h',2,1.5]],[['s',9,.9]],[['s',8,.9],['g',4,1.2],['c',2,2]],[['s',10,.7],['h',4,1],['c',2,2]]]},
 {name:['동래성','东莱城'],year:['1592년 4월','1592年4月'],gold:270,hp:1.0,bg:'bg_2',
  story:[['s15','적의 사자: "길을 빌려 주면 해치지 않겠다."','敌方使者：“借道给我们，便不伤害你们。”'],['s16','송상현: "싸워 죽기는 쉬워도 길을 빌려주기는 어렵다."','宋象贤：“战死易，借道难。”']],
  intro:['동래부사 송상현이 "싸워 죽기는 쉬워도 길을 내주기는 어렵다"며 버텼다.','东莱府使宋象贤坚守城池：“战死易，借道难。”'],
  tip:['갑옷무사는 화살이 잘 안 박혀요. 신기전을 쓰세요.','铠甲武士不怕弓箭，请用神机箭。'],
  path:[[40,30],[40,130],[320,130],[320,240],[40,240],[40,370],[320,370],[320,480],[180,480],[180,565]],
  waves:[[['s',8,1]],[['g',6,1.1]],[['s',8,.8],['h',3,1.2]],[['a',2,2.5],['s',6,.9]],[['g',8,.9]],[['h',6,.8],['s',8,.7],['c',2,2]],[['a',4,2],['g',6,1],['c',3,1.8],['s',10,.6]]]},
 {name:['상주','尚州'],year:['1592년 4월','1592年4月'],gold:330,hp:1.1,bg:'bg_sangju',carts:[1,3,5],
  story:[['s17','적이 북으로 올라온다. 마을 사람들이 서둘러 피난길에 올랐다.','敌军北上，村民们匆忙踏上逃难之路。'],['s18','"피난 수레가 성문을 지날 때까지 적을 막아라!"','“在难民车通过城门之前，挡住敌人！”']],
  intro:['순변사 이일이 상주에 왔지만 군사가 턱없이 모자랐다. 백성이 피난할 시간을 벌어라.','巡边使李镒来到尚州，兵力却严重不足。为百姓撤离争取时间。'],
  tip:['피난 수레가 성문까지 가도록 지키세요. 방패병은 화살을 잘 막아요.','护送难民车抵达城门。盾兵擅长挡箭。'],
  mission:['임무: 피난 수레 3대를 성문까지 지키기','任务：护送3辆难民车抵达城门'],
  path:[[299, 30], [299, 119], [77, 119], [77, 259], [279, 259], [279, 399], [89, 399], [89, 480], [179, 480], [179, 565]],
  waves:[[['s',6,1.1]],[['s',6,1],['d',2,1.6]],[['g',5,1.1],['s',4,1]],[['d',4,1.4],['s',6,.9]],[['h',4,1.2],['g',4,1]],[['d',5,1.2],['c',2,2],['s',8,.8]],[['a',3,2],['d',4,1.2],['s',10,.6]]]},
 {name:['탄금대','弹琴台'],year:['1592년 4월','1592年4月'],gold:470,hp:1.62,bg:'bg_3',
  story:[['s19','신립은 남한강을 등지고 배수진을 쳤다.','申砬背靠南汉江，布下背水阵。'],['s20','흙먼지를 일으키며 적 기병이 몰려온다!','敌骑扬起漫天尘土，汹涌而来！']],
  intro:['신립이 충주 탄금대 들판에서 왜군과 맞섰다.','申砬在忠州弹琴台的原野上迎战倭军。'],
  tip:['기마무사는 빨라요. 의병 막사로 길을 막으세요.','骑马武士速度很快，用义兵营挡住道路。'],
  path:[[320,30],[320,170],[60,250],[300,390],[180,470],[180,565]],
  waves:[[['h',6,1]],[['s',12,.6]],[['h',8,.8]],[['a',4,1.8]],[['g',10,.8],['h',5,1]],[['s',15,.5],['a',3,2]],[['h',12,.6],['c',3,1.8]],[['a',6,1.5],['g',8,.8]],[['h',10,.6],['a',5,1.5],['s',15,.4]]]},
 {name:['임진강','临津江'],year:['1592년 5월','1592年5月'],gold:520,hp:1.8,bg:'bg_imjin',ford:{y:150,mul:.55},
  story:[['s21','"나루의 배를 모두 거두어라. 적이 강을 건너지 못하게!"','“把渡口的船全部收走，不让敌人渡江！”'],['s22','밤, 강 건너편에 적의 횃불이 끝없이 늘어섰다.','夜里，江对岸敌军的火把绵延不绝。']],
  intro:['도원수 김명원이 임진강을 지켰다. 적이 물러나는 척하자 조정은 서둘러 강을 건너 싸우라고 재촉했다.','都元帅金命元坚守临津江。敌军佯装撤退，朝廷急令渡江出击。'],
  tip:['강을 건너는 적은 느려져요. 강가에 타워를 모으세요.','渡江的敌人会减速，把防御塔集中在江边。'],
  mission:['임무: 여울을 건너는 적을 강가에서 막기','任务：在江边阻击涉水渡江的敌人'],
  path:[[304, 30], [304, 115], [76, 115], [76, 258], [278, 258], [278, 399], [84, 399], [84, 478], [178, 478], [178, 565]],
  waves:[[['s',10,.7]],[['h',6,.9]],[['d',5,1.2],['g',5,1]],[['a',4,1.8],['s',8,.7]],[['h',10,.6],['c',3,1.6]],[['d',8,1],['g',8,.8]],[['a',6,1.4],['h',6,.8]],[['s',16,.4],['d',6,1],['c',3,1.5]],[['a',8,1.2],['g',10,.6],['h',8,.6]]]},
 {name:['진주성','晋州城'],year:['1592년 10월','1592年10月'],gold:630,hp:1.55,bg:'bg_4',
  intro:['진주목사 김시민이 3,800명으로 2만 왜군을 막아냈다.','晋州牧使金时敏以三千八百人击退两万倭军。'],
  tip:['마지막 웨이브에 대장이 와요. 책략을 아껴 두세요.','最后一波会出现大将，请保留计策。'],
  path:[[60,30],[60,200],[180,200],[180,100],[300,100],[300,340],[60,340],[60,460],[180,460],[180,565]],
  waves:[[['s',12,.6]],[['g',10,.8]],[['a',5,1.6]],[['h',10,.6]],[['s',15,.5],['g',8,.7]],[['a',8,1.3]],[['h',14,.5],['c',3,1.6]],[['g',14,.6],['a',4,1.5],['c',3,1.6]],[['s',20,.4],['h',10,.6]],[['a',10,1.1],['g',10,.6]],[['b',1,0],['a',6,1.5],['s',20,.5]]]}];

// ---------------------------------------------------------------- 역사 카드 · 역사 도감 (출처: 한국민족문화대백과사전, 조선왕조실록 등)
// 판 보강: 중간 대장 · 진주성 이야기
STAGES[2].waves[6].push(['k',1,2]);STAGES[3].waves[6].push(['k',1,2]);STAGES[4].waves[5].push(['k',1,2]);STAGES[4].waves[8].push(['k',1,2]);STAGES[5].waves[5].push(['k',1,2]);
STAGES.push({name:['2차 진주성','第二次晋州城'],year:['1593년 6월','1593年6月'],gold:720,hp:1.45,bg:'bg_4',night:true,carts:[2,5,8],
  story:[['s22','1593년 6월, 진주성 밖이 다시 적의 횃불로 가득 찼다. 지난 패배를 갚으려 온 대군이었다.','1593年6月，晋州城外再次布满敌军火把。这是为雪前耻而来的大军。'],['s24','김천일·황진·최경회는 성에 남아 끝까지 싸우기로 했다. "백성이 빠져나갈 시간을 벌어라!"','金千镒、黄进、崔庆会决定留守城中，战斗到底。“为百姓撤离争取时间！”']],
  intro:['1593년 6월, 왜군 9만여 명이 진주성을 다시 에워쌌다. 이번에는 밤낮없는 공격이다.','1593年6月，九万余倭军再次包围晋州城。这一次，攻击昼夜不停。'],
  tip:['밤이라 적이 쉬지 않고 몰려와요. 수레가 지나는 길목에 의병을 세우세요.','夜间敌军源源不断。在难民车经过的路口布置义兵。'],
  mission:['임무: 밤새 버티며 피난 수레 3대를 성문까지 지키기','任务：坚守一夜，护送3辆难民车抵达城门'],
  path:STAGES[5].path,
  waves:[[['s',14,.55]],[['g',10,.7],['d',4,1.2]],[['h',10,.6]],[['a',6,1.4],['c',2,1.6]],[['d',8,1],['g',8,.7]],[['s',18,.4],['h',8,.6],['k',1,2]],[['a',8,1.2],['c',3,1.5]],[['g',14,.55],['d',6,1]],[['h',14,.5],['a',5,1.4]],[['s',22,.35],['c',4,1.4],['k',1,2]],[['a',10,1],['g',10,.6]],[['b',1,0],['k',1,2],['a',6,1.4],['s',20,.45]]]});
STAGES[5].story=[['s23','김시민은 여인과 노약자에게도 남자 옷을 입혀 군사가 많아 보이게 했다.','金时敏让妇女和老弱也换上男装，使守军看起来人数众多。'],['s24','엿새 밤낮의 공격, 성 위의 화포와 불화살이 적을 막아 냈다.','六天六夜的攻击中，城头的火炮与火箭挡住了敌人。']];
const HIST=[
 {who:['정발','郑拨'],life:'1553~1592',title:['부산진 전투','釜山镇之战'],year:['1592년 4월 (음력)','1592年4月（农历）'],
  facts:[['왜군 제1군 1만 8천여 명이 부산 앞바다에 나타났다. 임진왜란의 첫 전투였다.','约一万八千名倭军第一军出现在釜山海面，壬辰倭乱的第一场战斗打响。'],
   ['부산진 첨사 정발은 군사와 백성을 성으로 모아 끝까지 싸우다 전사했다.','釜山镇佥使郑拨召集军民入城，坚守到最后，战死沙场。'],
   ['봉화 연락이 제대로 되지 않아 조정은 나흘째에야 침공 소식을 알았다.','烽火传讯不畅，朝廷直到第四天才得知入侵的消息。']],
  lesson:['위기는 오기 전에 준비해야 한다.','危机到来之前，就要做好准备。']},
 {who:['송상현','宋象贤'],life:'1551~1592',title:['동래성 전투','东莱城之战'],year:['1592년 4월 (음력)','1592年4月（农历）'],
  facts:[['왜군은 "길을 빌려 달라"는 나무패를 내걸었다.','倭军举起木牌，要求“借道”。'],
   ['동래부사 송상현은 "싸워 죽기는 쉬워도 길을 빌려주기는 어렵다(戰死易 假道難)"고 답했다.','东莱府使宋象贤答道：“战死易，借道难。”'],
   ['성이 무너지자 그는 조복을 갖춰 입고 앉은 채 순절했다.','城破之时，他身着朝服端坐，以身殉节。']],
  lesson:['지켜야 할 원칙을 끝까지 지킨 사람은 오래 기억된다.','坚守原则到最后的人，会被长久铭记。']},
 {who:['신립','申砬'],life:'1546~1592',title:['탄금대 전투','弹琴台之战'],year:['1592년 4월 28일 (음력)','1592年4月28日（农历）'],
  facts:[['신립은 8천여 명으로 충주에서 왜군을 막으려 했다.','申砬率八千余人在忠州阻击倭军。'],
   ['부하 김여물 등은 험한 조령(문경새재)에서 막자고 했지만, 신립은 기병을 쓰려고 넓은 들판을 골랐다.','部将金汝岉等人建议在险峻的鸟岭设防，申砬却为发挥骑兵选择了开阔的原野。'],
   ['남한강을 등지고 배수진을 쳤으나 앞이 논이라 말이 달리기 어려웠고, 정찰도 막혀 크게 졌다.','他背靠南汉江布下背水阵，但阵前多为水田，战马难以驰骋，侦察又被阻断，最终大败。']],
  lesson:['내 강점만 믿지 말고 지형과 정보, 다른 사람의 의견을 살펴라.','不要只依赖自己的长处，要看清地形、掌握情报，并倾听他人的意见。']},
 {who:['김시민','金时敏'],life:'1554~1592',title:['진주대첩','晋州大捷'],year:['1592년 10월 · 임진왜란 3대 대첩','1592年10月 · 壬辰倭乱三大捷之一'],
  facts:[['10월 5일부터 10일까지, 진주목사 김시민은 3,800여 명으로 2만여 명의 왜군을 막아냈다.','10月5日至10日，晋州牧使金时敏以三千八百余人击退两万余倭军。'],
   ['미리 화약과 총통을 만들어 두었고, 노약자와 여성에게도 남장을 시켜 군사가 많아 보이게 했다.','他事先制造火药和铳筒，还让老弱和妇女换上男装，使守军看起来人数更多。'],
   ['성 밖에서는 곽재우 등 의병이 적의 뒤를 흔들었다. 김시민은 이 싸움에서 입은 총상으로 끝내 숨졌다.','城外，郭再祐等义兵袭扰敌后。金时敏在此战中中弹负伤，最终殉国。']],
  lesson:['미리 준비하고 관군·의병·백성이 힘을 합치면 몇 배의 적도 막을 수 있다.','提前准备，官军、义兵与百姓同心协力，便能抵挡数倍之敌。']},
 {who:['유성룡','柳成龙'],life:'1542~1607',title:['징비록','《惩毖录》'],year:['전쟁이 끝난 뒤','战争结束之后'],
  facts:[['전쟁 중 군무를 총괄한 유성룡은 벼슬에서 물러난 뒤, 임진왜란의 원인과 경과를 돌아보며 『징비록』을 썼다.','战争期间总管军务的柳成龙辞官后，回顾壬辰倭乱的起因与经过，写下了《惩毖录》。'],
   ['제목은 『시경』의 "지난 잘못을 징계하여 뒤의 근심을 삼간다(予其懲而毖後患)"에서 따왔다.','书名取自《诗经》：“予其惩而毖后患。”'],
   ['특히 전쟁 초반의 패전 원인을 자세히 적어 뒷날의 경계로 삼게 했다.','书中尤其详细记录了战争初期的败因，以警示后人。']],
  lesson:['실패를 숨기지 않고 기록해야 같은 잘못을 되풀이하지 않는다.','不掩饰失败、如实记录，才能避免重蹈覆辙。']}];
const HIST_TIPS=[['임진왜란은 1592년부터 1598년까지 7년 동안 이어졌다.','壬辰倭乱从1592年持续到1598年，共七年。'],
 ['당시 기록은 음력이다. 4월 13일은 양력으로 5월 23일이다.','当时的记录使用农历，4月13日相当于公历5月23日。'],
 ['진주대첩·한산도 대첩·행주대첩을 임진왜란 3대 대첩이라 부른다.','晋州大捷、闲山岛大捷、幸州大捷被称为壬辰倭乱三大捷。'],
 ['의병은 관직 없는 선비와 백성이 스스로 일으킨 군대다. 1593년 정월에는 2만 2천여 명에 이르렀다.','义兵是由没有官职的士人和百姓自发组成的军队，1593年正月已达两万两千余人。'],
 ['「동래부순절도」와 「부산진순절도」는 1760년 변박이 다시 그린 기록화다.','《东莱府殉节图》与《釜山镇殉节图》是1760年卞璞重新绘制的纪实画。']];
HIST.splice(2,0,{who:['이일','李镒'],life:'1538~1601',title:['상주 전투','尚州之战'],year:['1592년 4월 25일 (음력)','1592年4月25日（农历）'],
  facts:[['순변사 이일이 상주에 왔을 때 남은 관군은 60여 명뿐이어서, 급히 백성 800여 명을 모았다.','巡边使李镒抵达尚州时，官军只剩六十余人，只得仓促召集八百余名百姓。'],
   ['훈련도 제대로 못 한 군사로 맞섰다가 4월 25일 크게 졌고, 이일은 홀로 말을 타고 빠져나갔다.','未经训练的军队仓促迎战，4月25日大败，李镒单骑脱身。'],
   ['판관 권길, 종사관 윤섬 등은 끝까지 남아 싸우다 목숨을 잃었다.','判官权吉、从事官尹暹等人坚守到最后，壮烈牺牲。']],
  lesson:['군사와 준비는 하루아침에 만들어지지 않는다.','军队与准备，非一朝一夕可成。']});HIST.splice(4,0,{who:['유극량','刘克良'],life:'?~1592',title:['임진강 전투','临津江之战'],year:['1592년 5월 (음력)','1592年5月（农历）'],
  facts:[['도원수 김명원 등이 약 1만 3천 명으로 임진강을 지켰다. 물살이 세서 왜군은 며칠 동안 강을 건너지 못했다.','都元帅金命元等人率约一万三千人坚守临津江。水流湍急，倭军数日无法渡江。'],
   ['왜군이 강가에 군사 몇만 남기고 물러나자, 적이 약해졌다는 보고를 믿은 조정은 빨리 싸우라고 재촉했다.','倭军只在江边留下少数兵力后撤，朝廷听信敌军已弱的报告，催促尽快出战。'],
   ['유극량은 적의 꾀라며 강을 건너는 것을 반대했지만 명령에 따라 건넜고, 5월 17일 기습을 받아 신할 등과 함께 전사했다.','刘克良认为这是诱敌之计，反对渡江，但仍奉命渡江，5月17日遭伏击，与申硈等人一同战死。']],
  lesson:['적이 물러날 때일수록 서두르지 말고 의심하라.','敌人退却之时，越要沉住气、多加提防。']});
HIST.splice(HIST.length-1,0,{who:['김천일·황진·논개','金千镒·黄进·论介'],life:'1593',title:['2차 진주성 전투','第二次晋州城之战'],year:['1593년 6월 (음력)','1593年6月（农历）'],
  facts:[['1593년 6월, 왜군은 지난해의 패배를 갚으려 9만여 명으로 진주성을 다시 에워쌌다.','1593年6月，倭军为报去年之败，以九万余人再次包围晋州城。'],
   ['김천일·황진·최경회 등이 군사와 백성과 함께 9일 동안 싸웠으나, 6월 29일 성이 함락되었다.','金千镒、黄进、崔庆会等人与军民一同奋战九天，6月29日城池失陷。'],
   ['싸움이 끝난 뒤 논개는 촉석루 아래에서 적장을 끌어안고 남강에 뛰어들었다고 전한다.','据传战后，论介在矗石楼下抱住敌将，跃入南江。']],
  lesson:['진 싸움 속에서도 끝까지 지킨 사람들의 이름은 남는다.','即便在失败的战斗中，坚守到底的人也会被铭记。']});
function histUnlocked(k){return k<STAGES.length?(save.stars[k]||0)>0:(save.stars[STAGES.length-1]||0)>0}
let histCard=null,histT=0;
function openHist(k){histCard=k;histT=0;track('history_open',{k});if(!save.histRead.includes(k)){save.histRead.push(k);gainMerit(10);message(L('역사 공부! 공적 +10','学习历史！功勋 +10'),1.4)}persist()}
function drawHistCard(dt){histT+=dt;const H2=HIST[histCard];g.fillStyle='rgba(6,5,4,.82)';g.fillRect(0,0,VW,VH);
 rr(18,70,324,500,14,'#efe6d2','#8a6a45',2);rr(26,78,308,484,10,null,'#b5452f',1);
 txt('📜 '+L('역사 카드','历史卡片'),40,100,11,'#8a6a45','left','800');txt(H2.life,320,100,10,'#8a6a45','right','600');
 txt(LL(H2.title),180,134,24,'#2b2118','center','900');txt(LL(H2.who)+' · '+LL(H2.year),180,162,11,'#6b5236');
 let y=196;for(const f of H2.facts){txt('·',38,y,13,'#b5452f','left','900');const n=wrap(LL(f),50,y,272,12,'#2b2118',19,'left');y+=n*19+12}
 rr(34,y+4,292,0.1,0,null,'#c8b896',1);y+=24;txt(L('교훈','启示'),180,y,12,'#b5452f','center','900');y+=24;wrap(LL(H2.lesson),180,y,270,14,'#2b2118',21,'center');
 txt(L('출처: 한국민족문화대백과사전, 조선왕조실록 등','资料来源：《韩国民族文化大百科事典》《朝鲜王朝实录》等'),180,536,8,'#8a7a60');
 if(Math.sin(frame*6)>-.3)txt('▼ '+L('터치해서 닫기','点击关闭'),180,554,9,'#8a6a45')}
function heroRect(i){return {x:16,y:64+i*222,w:328,h:210}}
function heroScreen(){if(!cover('bg_map','rgba(18,14,10,.7)'))bg();txt(L('장수 고르기','选择将领'),20,26,18,'#f2e6c9','left','900');
 ['kim','kwak'].forEach((k,i)=>{const r=heroRect(i),Hh=HEROES[k],u=heroUnlocked(k),on=save.hero===k;rr(r.x,r.y,r.w,r.h,14,on?'#3a2f20':'#2b261e',on?'#ffd34d':'#5a4f3a',on?2.5:1.2);paper(r.x,r.y,r.w,r.h,14,.12);
  g.save();if(!u)g.globalAlpha=.35;stripB(Hh.spr+'_idle',8,Math.floor(frame*7)%8,r.x+70,r.y+r.h-22,150,false);g.restore();
  txt(LL(Hh.name),r.x+142,r.y+34,22,u?'#ffe2a0':'#6b665c','left','900');txt(Hh.life,r.x+142,r.y+58,10,'#a89a7c','left','600');
  wrap(LL(Hh.d),r.x+142,r.y+84,174,11,u?'#f2e6c9':'#6b665c',17,'left');
  txt(L('체력 ','体力 ')+Hh.hp+L(' · 공격 ',' · 攻击 ')+Hh.dmg+L(' · 속도 ',' · 速度 ')+Hh.spd,r.x+142,r.y+138,10,u?'#bcd8f0':'#5a564e','left','700');
  if(!u)txt('🔒 '+L('동래성 승리 시 합류','东莱城胜利后加入'),r.x+142,r.y+176,11,'#c9a070','left','800');
  else if(on){rr(r.x+142,r.y+160,110,34,9,'#5a3a14','#ffd34d',1.5);txt(L('출전 중','出征中'),r.x+197,r.y+177,13,'#ffd34d','center','900')}
  else button(r.x+142,r.y+160,110,34,L('출전시키기','派遣出征'),'gold',12)});
 button(80,530,200,50,L('◀ 돌아가기','◀ 返回'),'gray',15)}
function codexScreen(){bg();txt(L('역사 도감','历史图鉴'),20,26,18,'#f2e6c9','left','900');txt(L('읽을 때마다 처음 한 번 공적 +10','每张首次阅读功勋 +10'),340,26,9,'#a89a7c','right','500');
 const cst=Math.min(67,474/HIST.length),ch=cst-6;HIST.forEach((H2,k)=>{const y=50+k*cst,u=histUnlocked(k);rr(14,y,332,ch,10,u?'#2f2a22':'#24221e',u?'#8a7650':'#3a3630',1.5);
  txt(LL(H2.title),28,y+ch*.33,15,u?'#f2e6c9':'#6b665c','left','800');txt(LL(H2.who)+' ('+H2.life+')',28,y+ch*.7,10.5,u?'#c9bfa8':'#5a564e','left','600');
  if(u){txt(save.histRead.includes(k)?L('읽음','已读'):L('새 카드','新卡片'),334,y+22,11,save.histRead.includes(k)?'#8a8070':'#ffd34d','right','800');txt(L('눌러서 읽기','点击阅读'),334,y+ch*.7,9,'#a89a7c','right','500')}
  else txt('🔒 '+LL(STAGES[Math.min(k,STAGES.length-1)].name)+L(' 승리 시',' 胜利后解锁'),334,y+32,10,'#6b665c','right','600')});
 button(80,530,200,50,L('◀ 돌아가기','◀ 返回'),'gray',15)}

// ---------------------------------------------------------------- 성장: 공적 · 관직 · 본영 강화
const RANKS=[[0,['종9품 참봉','从九品 参奉']],[60,['종8품 봉사','从八品 奉事']],[160,['종7품 직장','从七品 直长']],[320,['종6품 현감','从六品 县监']],[540,['종5품 도사','从五品 都事']],[820,['종4품 군수','从四品 郡守']],[1200,['종3품 부사','从三品 府使']],[1700,['정3품 절도사','正三品 节度使']]];
function rankIdx(){let r=0;for(let i=0;i<RANKS.length;i++)if(save.meritTotal>=RANKS[i][0])r=i;return r}
const UPS={archer:{name:['궁수대 단련','弓手操练'],desc:['궁수대 공격 +8%','弓手台攻击 +8%']},militia:{name:['의병 훈련','义兵训练'],desc:['의병 체력 +12%','义兵体力 +12%']},
 rocket:{name:['화약 개량','火药改良'],desc:['신기전 공격 +8%','神机箭攻击 +8%']},cannon:{name:['포술 연마','炮术精研'],desc:['총통 범위 +8% · 공격 +5%','铳筒范围 +8% · 攻击 +5%']},
 gold:{name:['군량 비축','储备军粮'],desc:['시작 엽전 +15','初始铜钱 +15']},skill:{name:['성곽 정비','整修城郭'],desc:['책략 대기 -8%','计策冷却 -8%']}};
const UP_COST=[30,60,100,150,210],UP_MAX=5;
function upCost(k){return UP_COST[save.up[k]]||0}
function gainMerit(n){save.merit+=n;save.meritTotal+=n;const r0=save.lastRank||0,r1=rankIdx();if(r1>r0){save.lastRank=r1;message(L('승진! ','升迁！')+LL(RANKS[r1][1]),2);AudioFx.cue('reward')}persist()}
function starTotal(){let n=0;for(let i=0;i<STAGES.length;i++)n+=save.stars[i]||0;return n}

// ---------------------------------------------------------------- 포상: 장계 · 봉화 · 전공 · 둔전 · 보급 수레
const ORDERS=[{k:'kill',goal:120,name:['왜군 120명 격퇴','击退倭军120人'],r:30},{k:'clear',goal:2,name:['전투 2회 승리','取得2次胜利'],r:35},{k:'skill',goal:3,name:['책략 3회 사용','使用计策3次'],r:25},
 {k:'early',goal:5,name:['웨이브 조기 호출 5회','提前召唤敌波5次'],r:25},{k:'upgrade',goal:12,name:['전투 중 타워 강화 12회','战斗中强化防御塔12次'],r:30},{k:'stars3',goal:1,name:['별 3개로 승리','三星胜利1次'],r:40},{k:'block',goal:30,name:['의병이 왜군 30명 막기','义兵阻挡倭军30次'],r:30}];
function ordersInit(){const t=todayKey();if(save.orders&&save.orders.day===t)return;let h=0;for(const ch of t)h=(h*31+ch.charCodeAt(0))|0;const pool=ORDERS.map((m,i)=>i),pick=[];
 while(pick.length<3&&pool.length){h=(h*1103515245+12345)|0;pick.push(pool.splice(Math.abs(h)%pool.length,1)[0])}save.orders={day:t,m:pick.map(i=>({i,p:0,c:false}))};persist()}
function order(k,n=1){if(!save.orders||save.orders.day!==todayKey())ordersInit();for(const m of save.orders.m){const O=ORDERS[m.i];if(O.k===k&&!m.c&&m.p<O.goal){m.p=Math.min(O.goal,m.p+n);if(m.p>=O.goal)message(L('장계 완수! ','完成诏令！')+LL(O.name),1.6)}}}
const BEACON=[20,30,40,50,60,70,150];
function beaconCan(){return save.beacon.last!==todayKey()}
const HONOR=[[4,60],[8,100],[12,180]];// 별 수, 공적
const FARM_RATE=3,FARM_CAP=8;// 시간당 공적, 최대 시간
function farmAmount(){return Math.floor(Math.min(FARM_CAP,(Date.now()-save.farm)/3600000)*FARM_RATE)}
function cartLeft(){const t=todayKey();if(!save.cart||save.cart.day!==t)save.cart={day:t,n:0};return 3-save.cart.n}
function cartReward(){return 25+rankIdx()*4}
function rewardBadge(){ordersInit();if(beaconCan())return true;if(save.orders.m.some(m=>!m.c&&m.p>=ORDERS[m.i].goal))return true;if(HONOR.some((h,i)=>!save.honor.includes(i)&&starTotal()>=h[0]))return true;return farmAmount()>=FARM_RATE*4}

// ---------------------------------------------------------------- 기하
function buildPath(pts){const seg=[];let tot=0;for(let i=0;i<pts.length-1;i++){const [x1,y1]=pts[i],[x2,y2]=pts[i+1];const l=Math.hypot(x2-x1,y2-y1);seg.push({x1,y1,x2,y2,l,s:tot});tot+=l}return {pts,seg,len:tot}}
function posAt(P,d){if(d<=0)return {x:P.pts[0][0],y:P.pts[0][1]};for(const s of P.seg){if(d<=s.s+s.l){const t=(d-s.s)/s.l;return {x:s.x1+(s.x2-s.x1)*t,y:s.y1+(s.y2-s.y1)*t}}}const e=P.pts[P.pts.length-1];return {x:e[0],y:e[1]}}
function distSeg(px,py,s){const dx=s.x2-s.x1,dy=s.y2-s.y1;let t=((px-s.x1)*dx+(py-s.y1)*dy)/(s.l*s.l);t=Math.max(0,Math.min(1,t));const x=s.x1+dx*t,y=s.y1+dy*t;return {d:Math.hypot(px-x,py-y),x,y,along:s.s+s.l*t}}
function nearestOnPath(P,x,y){let best=null;for(const s of P.seg){const r=distSeg(x,y,s);if(!best||r.d<best.d)best=r}return best}
function makeSlots(P){const out=[];for(let d=40;d<P.len-30;d+=34){const a=posAt(P,d),b=posAt(P,d+2);let nx=-(b.y-a.y),ny=b.x-a.x;const n=Math.hypot(nx,ny)||1;nx/=n;ny/=n;
 for(const sg of [1,-1]){const x=a.x+nx*42*sg,y=a.y+ny*42*sg;if(x<22||x>VW-22||y<TOP+26||y>BOT-24)continue;if(nearestOnPath(P,x,y).d<32)continue;if(out.some(o=>Math.hypot(o.x-x,o.y-y)<44))continue;out.push({x,y,t:null,along:d})}}return out}

// ---------------------------------------------------------------- 상태
let sc='loading',B=null,paused=false,speed=1,popup=null,shakeT=0,frame=0,last=0,loadT=0;
let msg=null,guideTip=null,guidePage=0,guideRet='title',retSc='title',resetArm=0,dbgFreeze=false;
const floats=[];
function message(t,d){msg={t,d:d||1.4}}
function addFloat(x,y,t,col){for(let k=0;k<6&&floats.some(f=>f.life>.45&&Math.abs(f.x-x)<44&&Math.abs(f.y-y)<13);k++)y-=14;floats.push({x,y,t,c:col,life:.8,w:sc==='battle'&&y<BOT&&y>TOP})}
// ---- 카메라: 전장을 확대해 보여 주고 손가락으로 끌어서 이동 (설계서 5-3 개정)
const CAM={z:1.35,x:0,y:TOP,zoomed:true};
function camView(){const z=CAM.z;return {w:VW/z,h:(BOT-TOP)/z}}
function camClamp(){const v=camView();CAM.x=Math.max(0,Math.min(VW-v.w,CAM.x));CAM.y=Math.max(TOP,Math.min(BOT-v.h,CAM.y))}
function camReset(){CAM.z=CAM.zoomed?1.35:1;const v=camView();CAM.x=(VW-v.w)/2;CAM.y=BOT-v.h;camClamp()}
function w2s(x,y){return [(x-CAM.x)*CAM.z,TOP+(y-CAM.y)*CAM.z]}
function s2w(x,y){return [CAM.x+x/CAM.z,CAM.y+(y-TOP)/CAM.z]}
function camLook(x,y){const v=camView();CAM.x=x-v.w/2;CAM.y=y-v.h/2;camClamp()}
function shake(v){if(save.shake!==false)shakeT=Math.max(shakeT,v)}
function upMul(k,per){return 1+per*(save.up[k]||0)}

// ---------------------------------------------------------------- 전투
function startStage(i,chal){const S=STAGES[i],P=buildPath(S.path);
 applyHero();let gold=S.gold+15*save.up.gold+5*rankIdx();if(chal)gold=Math.round(gold*.85);
 B={i,S,P,slots:makeSlots(P),gold,lives:chal?10:LIVES,chal:!!chal,perks:[],choice:null,enemies:[],proj:[],fx:[],parts:[],corpses:[],wave:0,spawnQ:[],nextT:null,started:false,lastSpawnAt:0,
  hero:null,heroLv:1,skillCd:0,skillT:0,H:null,carts:[],cartsSafe:0,cartsLost:0,storyI:0,storyT:0,cd:{fire:0,reinf:0},aim:null,nums:[],bombs:[],reinf:[],eproj:[],coins:[],taps:[],slow:0,goldPulse:0,time:0,result:null,phase:'intro',revived:false,doubled:false,kills:0,banner:null,bossWarn:0,leakFlash:0};
 floats.length=0;if(S.story&&!(save.seen||[]).includes(i))B.phase='story';B.H=makeHero();camReset();popup=null;sc='battle';speed=1;paused=false;save.plays++;track('stage_start',{stage:i+1});persist()}
function skillCdMax(){return HERO.skillCd*Math.max(.5,1-.08*save.up.skill)}
// 몹 수 늘리기: 일반 적은 수 ×1.4, 체력 ×0.8, 엽전 ×0.75, 간격 ×0.72 (대장류는 그대로)
const CROWD={n:1.4,hp:.8,gold:.75,gap:.72};function crowdy(t){const E=ENEMIES[t];return !(E.boss||E.mid)}
// 보급 광고: 돈이 모자란 순간에 제안 (전투 엽전 2회/판, 본영 공적은 보급 수레 하루 3회와 공유)
const SUPPLY_MAX=2;let offer=null;
function supplyAmt(){return 100+25*B.i}
function offerSupply(force){if(!B||B.result||B.phase!=='play')return false;if((B.supplyUsed||0)>=SUPPLY_MAX){if(force)message(L('이번 전투 보급은 모두 받았어요','本场补给已用完'),1.1);return false}offer={t:0,kind:'gold'};track('ad_offer',{place:'supply',stage:B.i});return true}
function offerMerit(){if(cartLeft()<=0)return false;offer={t:0,kind:'merit'};track('ad_offer',{place:'cart_base'});return true}
function drawOffer(dt){offer.t+=dt;const a=Math.min(1,offer.t*5),gold=offer.kind==='gold';g.fillStyle='rgba(8,6,4,'+(.7*a)+')';g.fillRect(0,0,VW,VH);g.globalAlpha=a;
 rr(36,206,288,236,16,'#2f2a22','#c8a050',2);paper(36,206,288,236,16,.18);icon('coin',180,246,44);
 txt(gold?L('엽전이 모자라요!','铜钱不够了！'):L('공적이 모자라요!','功勋不够了！'),180,290,19,'#ffd34d','center','900');
 txt(gold?L('광고를 보면 보급대가 엽전을 가져와요','观看广告，补给队送来铜钱'):L('광고를 보면 의병 보급 수레가 와요','观看广告，义兵补给车到达'),180,314,11.5,'#e8dcc0','center','600');
 const amt=gold?supplyAmt():cartReward(),left=gold?SUPPLY_MAX-(B.supplyUsed||0):cartLeft();
 button(60,334,240,50,'',gold?'gold':'green',15);txt(L('▶ 광고 보고 ','▶ 看广告 ')+(gold?L('엽전 +','铜钱 +'):L('공적 +','功勋 +'))+amt,180,355,15,'#fff','center','900');txt((gold?L('이번 전투 남은 횟수 ','本场剩余 '):L('오늘 남은 횟수 ','今日剩余 '))+left,180,374,9.5,'#fff3c8','center','600');
 button(110,394,140,36,L('괜찮아요','不用了'),'gray',13);g.globalAlpha=1}
function tapOffer(x,y){if(offer.t<.3)return;if(hit(x,y,60,334,240,50)){const k=offer.kind;offer=null;if(k==='gold')showAd('supply',()=>{B.supplyUsed=(B.supplyUsed||0)+1;const n=supplyAmt();B.gold+=n;B.goldPulse=1;addFloat(130,TOP+16,L('보급 도착! 엽전 +','补给到达！铜钱 +')+n,'#ffd34d');AudioFx.cue('reward');vib('medium')});
  else showAd('cart',()=>{save.cart.n++;gainMerit(cartReward());AudioFx.cue('reward');message(L('의병 보급 수레 도착! 공적 +','义兵补给车到达！功勋 +')+cartReward(),1.4)});return}
 if(hit(x,y,110,394,140,36)||!hit(x,y,36,206,288,236))offer=null}
function queueWave(){const w=B.S.waves[B.wave];if(B.S.carts&&B.S.carts.includes(B.wave)){B.carts.push({cart:true,d:-10,x:B.S.path[0][0],y:B.S.path[0][1],hp:160,max:160,dead:false,hitT:0,face:1});B.banner={t:2,txt:L('피난 수레 출발! 성문까지 지켜라','难民车出发！护送至城门')};AudioFx.cue('horn')}let t=0;for(const [type,count0,gap0] of w){const cr=crowdy(type),count=cr?Math.round(count0*CROWD.n):count0,gap=cr?gap0*CROWD.gap:gap0;for(let k=0;k<count;k++){B.spawnQ.push({type,at:B.time+t});t+=gap}t+=1.5}
 B.wave++;B.nextT=null;B.lastSpawnAt=B.time+t;
 if(w.some(x=>x[0]==='b')){AudioFx.cue('drum');B.bossWarn=3;vib('heavy')}else if(w.some(x=>x[0]==='k')){AudioFx.cue('drum');vib('medium')}else AudioFx.cue('horn');
 B.banner={t:1.6,txt:L('웨이브 ','第')+B.wave+L('','波')+(w.some(x=>x[0]==='h')?L(' · 기마대 돌격!',' · 骑兵突袭！'):'')}}
function callWave(){if(B.wave>=B.S.waves.length)return;
 if(B.started&&B.nextT!=null){const left=Math.ceil(B.nextT);if(left>0){B.gold+=left;for(const k in B.cd)B.cd[k]=Math.max(0,B.cd[k]-left);addFloat(100,BOT-14,'+'+left,'#ffd34d');AudioFx.cue('coin');order('early')}}
 if(!B.started&&!save.tips.tut2)track('tutorial_step',{step:2});if(!B.started)save.tips.tut2=1;B.started=true;queueWave()}
function spawn(type){const E=ENEMIES[type],hp=Math.round(E.hp*B.S.hp*(B.chal?1.3:1)*(crowdy(type)?CROWD.hp:1));B.enemies.push({type,E,hp,max:hp,d:0,x:B.S.path[0][0],y:B.S.path[0][1],blocked:null,flash:0,dead:false,atkT:0})}
function auraMul(x,y,mil){const h=B.H;if(!h||h.dead)return 1;if(Math.hypot(h.x-x,h.y-y)>HERO.aura)return 1;return 1+(mil?HERO.mAura:HERO.tAura)+.04*(B.heroLv-1)+(!mil&&hasP('gun')?.15:0)}
// ---- 장수: 땅을 누르면 이동, 근접전, 체력, 부활
function heroHome(){const e=B.P.pts[B.P.pts.length-1],p=posAt(B.P,B.P.len-70);return {x:p.x+(p.x<180?26:-26),y:Math.min(BOT-30,p.y)}}
function heroMax(){return HERO.hp+HERO.hpLv*(B.heroLv-1)}
function makeHero(){const h=heroHome();return {isHero:true,x:h.x,y:h.y,tx:h.x,ty:h.y,hx:h.x,hy:h.y,hp:HERO.hp,dead:false,respawn:0,target:null,cd:0,face:-1,dist:0,moving:false,hitT:0}}
function moveHero(x,y){const H=B.H;if(!H)return;x=Math.max(14,Math.min(VW-14,x));y=Math.max(TOP+16,Math.min(BOT-14,y));B.taps.push({x,y,t:.45,c:'#9fd4ff'});
 if(H.dead){message(L('장수가 쓰러져 있어요 · 곧 돌아와요','将领已倒下 · 即将归来'),1);return}
 if(H.target){if(H.target.blocked===H)H.target.blocked=null;H.target=null}H.tx=x;H.ty=y;H.hx=x;H.hy=y;H.moving=true;if(!save.tips.tut3)track('tutorial_step',{step:3});save.tips.tut3=1;AudioFx.cue('ui');vib('light')}
function killUnit(u){u.dead=true;if(u.cart){B.cartsLost++;B.lives=Math.max(0,B.lives-3);for(const e of B.enemies)if(e.blocked===u)e.blocked=null;puff(u.x,u.y,14,'rgba(120,90,60,.8)',45,.7,5,0,'smoke');addFloat(u.x,u.y-30,L('피난 수레를 잃었다… 목숨 -3','难民车被毁……生命 -3'),'#ff8a7a');shake(.25);AudioFx.cue('leak');return}
 if(u.target&&u.target.blocked===u)u.target.blocked=null;u.target=null;
 if(u.isHero){u.respawn=hasP('heal')?6:HERO.respawn;puff(u.x,u.y,10,'rgba(150,130,110,.8)',40,.6,5,0,'smoke');addFloat(u.x,u.y-30,L('장수가 쓰러졌다!','将领倒下了！'),'#ff9a8a');AudioFx.cue('leak');vib('medium')}
 else{if(u.temp)u.life=0;else u.respawn=u.resp||10;B.corpses.push({type:'m',E:{r:6,color:'#c9a070'},x:u.x,y:u.y-6,face:u.face,t:1.1})}}
function hurtUnit(u,dmg){if(!u||u.dead)return;if(!u.isHero&&!u.cart&&hasP('morale'))dmg*=.74;if(u.guard)dmg*=1-u.guard;u.hp-=dmg;u.hitT=.15;if(u.hp<=0)killUnit(u)}
function updateHero(dt){const H=B.H;if(!H)return;if(H.hitT>0)H.hitT-=dt;
 if(H.dead){H.respawn-=dt;if(H.respawn<=0){const h=heroHome();Object.assign(H,{dead:false,hp:heroMax(),x:h.x,y:h.y,tx:h.x,ty:h.y,hx:h.x,hy:h.y,moving:false,target:null});B.taps.push({x:h.x,y:h.y,t:.6,c:'#ffd34d'});addFloat(h.x,h.y-30,L('장수 복귀','将领归来'),'#9fd4ff')}return}
 const mx=heroMax();if(!H.target)H.hp=Math.min(mx,H.hp+(hasP('heal')?10:5)*dt);
 if(H.target&&(H.target.dead||(H.target.blocked&&H.target.blocked!==H)))H.target=null;
 if(H.moving){const dx=H.tx-H.x,dy=H.ty-H.y,dd=Math.hypot(dx,dy),st=HERO.spd*(hasP('swift')?1.4:1)*dt;if(Math.abs(dx)>.5)H.face=dx>0?1:-1;if(dd<=st){H.x=H.tx;H.y=H.ty;H.moving=false}else{H.x+=dx/dd*st;H.y+=dy/dd*st;H.dist+=st}return}
 if(!H.target){let best=null,bd=1e9;for(const e of B.enemies){if(e.dead)continue;if(e.blocked&&e.blocked!==H)continue;const dd=Math.hypot(e.x-H.hx,e.y-H.hy);if(dd<=HERO.reach+18&&dd<bd){best=e;bd=dd}}
  if(best){H.target=best;if(!best.E.boss)best.blocked=H}}
 const tg=H.target;let goal=tg?{x:tg.x+(tg.x<H.x?12:-12),y:tg.y+4}:{x:H.hx,y:H.hy};
 const dx=goal.x-H.x,dy=goal.y-H.y,dd=Math.hypot(dx,dy),st=HERO.spd*(hasP('swift')?1.4:1)*dt;if(dd>1){if(Math.abs(dx)>.5)H.face=dx>0?1:-1;const mv=Math.min(dd,st);H.x+=dx/dd*mv;H.y+=dy/dd*mv;H.dist+=mv}
 if(tg){if(Math.hypot(tg.x-H.x,tg.y-H.y)>HERO.reach+40){if(tg.blocked===H)tg.blocked=null;H.target=null;return}H.face=tg.x>H.x?1:-1;
  if(dd<16){H.cd-=dt;if(H.cd<=0){H.cd=HERO.rate*(hasP('swift')?.75:1);H.swing=.26;H.swDir=Math.atan2(tg.y-H.y,tg.x-H.x);dealDamage(tg,(HERO.dmg+HERO.dmgLv*(B.heroLv-1))*upMul('skill',.04)*(hasP('blade')?1.6:1),'phys');AudioFx.cue('slash');puff(tg.x,tg.y-6,7,'#fff2c0',80,.18,2.2,0,'spark',tg.x-H.x,tg.y-H.y);puff(H.x,H.y+8,3,'rgba(170,140,100,.7)',25,.35,3,0,'smoke');tg.flash=.14;shake(.03)}}}
 if(H.swing>0)H.swing-=dt}
// ---- 책략: 단추를 누르고 전장을 누름
function skCd(k){return SK[k].cd*Math.max(.5,1-.08*save.up.skill)*(k==='fire'&&hasP('fire')?.7:k==='reinf'&&hasP('call')?.8:1)}
function castSkill(k,x,y){if(B.cd[k]>0)return;B.cd[k]=skCd(k);B.aim=null;order('skill');if(!save.tips.tut4)track('tutorial_step',{step:4});save.tips.tut4=1;vib('heavy');B.taps.push({x,y,t:.5,c:k==='fire'?'#ff9a4a':'#ffd27a'});
 if(k==='fire'){const S=SK.fire;AudioFx.cue('rocket');for(let i=0,nn=hasP('fire')?14:S.n;i<nn;i++){const a=Math.random()*TAU,r=Math.sqrt(Math.random())*S.r,tx=x+Math.cos(a)*r,ty=y+Math.sin(a)*r*.7;
   B.proj.push({kind:'rocket',sx:x-140+Math.random()*30,sy:BOT+30,x:x-140,y:BOT+30,px:x-140,py:BOT+30,tg:null,tx,ty,T:.55+i*.06,t:-i*.06/(.55+i*.06),arc:40,dmg:S.dmg,type:'fire',aoe:20,skill:true})}
  addFloat(x,y-40,LL(S.name)+'!','#ffb070')}
 else{const S=SK.reinf;for(let k2=0,nn=hasP('call')?3:2;k2<nn;k2++)B.reinf.push({temp:true,k:k2,x:x+(k2-(nn-1)/2)*16,y:y+4,hx:x+(k2-(nn-1)/2)*16,hy:y+4,hp:S.hp,max:S.hp,dead:false,life:S.life,target:null,cd:0,dist:0,face:1,hitT:0,pop:.4});
  puff(x,y+6,14,'rgba(170,140,100,.8)',45,.6,5,0,'smoke');AudioFx.cue('horn');addFloat(x,y-34,LL(S.name)+'!','#ffd27a')}}
function updateReinf(dt){const S=SK.reinf;for(const m of B.reinf){if(m.dead)continue;m.life-=dt;if(m.hitT>0)m.hitT-=dt;if(m.pop>0)m.pop-=dt;if(m.life<=0){m.dead=true;if(m.target&&m.target.blocked===m)m.target.blocked=null;puff(m.x,m.y,5,'rgba(170,140,100,.6)',20,.4,4,0,'smoke');continue}
  if(m.target&&(m.target.dead||m.target.blocked!==m))m.target=null;
  if(!m.target){let best=null,bd=1e9;for(const e of B.enemies){if(e.dead||e.blocked||e.E.boss)continue;const dd=Math.hypot(e.x-m.hx,e.y-m.hy);if(dd<=60&&dd<bd){best=e;bd=dd}}if(best){m.target=best;best.blocked=m}}
  const goal=m.target?{x:m.target.x+(m.k?6:-6),y:m.target.y+6}:{x:m.hx,y:m.hy};const dx=goal.x-m.x,dy=goal.y-m.y,dd=Math.hypot(dx,dy),st=95*dt,mv=Math.min(dd,st);if(dd>.5){m.x+=dx/dd*mv;m.y+=dy/dd*mv;m.dist+=mv;if(Math.abs(dx)>.5)m.face=dx>0?1:-1}
  if(m.atkA>0)m.atkA-=dt;
  if(m.target&&dd<14){m.cd-=dt;if(m.cd<=0){m.cd=1;m.atkA=.24;AudioFx.cue('clash',.08);dealDamage(m.target,S.dmg*auraMul(m.x,m.y,1),'phys')}}}
 B.reinf=B.reinf.filter(m=>!m.dead)}
// ---- 적의 반격: 조총병 사격 · 화공병 방화 · 대장 내려찍기
function towerHit(sl,dmg){const t=sl.t;if(!t||t.down||t.kind==='militia'||t.kind==='hero')return;if(t.max==null){t.max=TOWER_HP[t.lv];t.hp=t.max}t.hp-=dmg;t.hitT=.25;
 if(t.hp<=0){t.hp=0;t.down=true;AudioFx.cue('smash');shake(.2);vib('medium');puff(sl.x,sl.y,14,'rgba(90,80,70,.85)',40,.9,7,0,'smoke');puff(sl.x,sl.y-8,10,'#ff8a3a',50,.4,2.6,-30,'spark');addFloat(sl.x,sl.y-36,L('타워가 불탔다! 눌러서 수리','防御塔被烧毁！点击修理'),'#ff9a6a')}}
function unitsNear(x,y,r){const out=[];const H=B.H;if(H&&!H.dead&&Math.hypot(H.x-x,H.y-y)<=r)out.push(H);for(const m of B.reinf)if(!m.dead&&Math.hypot(m.x-x,m.y-y)<=r)out.push(m);
 for(const sl of B.slots)if(sl.t&&sl.t.men)for(const m of sl.t.men)if(!m.dead&&Math.hypot(m.x-x,m.y-y)<=r)out.push(m);return out}
function enemyAct(e,dt){const E=e.E;e.aiming=false;if(e.blocked)return;
 if(E.shot){const us=unitsNear(e.x,e.y,E.shot.range);if(us.length){e.aiming=true;e.face=us[0].x>e.x?1:-1;e.shT=(e.shT==null?.6:e.shT)-dt;if(e.shT<=0){e.shT=E.shot.rate;e.atkA=.28;const u=us[0];
   B.eproj.push({kind:'bullet',sx:e.x,sy:e.y-12,x:e.x,y:e.y-12,tx:u.x,ty:u.y-8,u,t:0,T:Math.hypot(u.x-e.x,u.y-e.y)/520+.03,dmg:E.shot.dmg});AudioFx.cue('shot',.12);puff(e.x+(e.face===1?8:-8),e.y-12,3,'rgba(220,220,210,.8)',18,.4,3,0,'smoke')}}}
 if(E.siege){let best=null,bd=1e9;for(const sl of B.slots){const t=sl.t;if(!t||t.down||t.kind==='militia'||t.kind==='hero')continue;const dd=Math.hypot(sl.x-e.x,sl.y-e.y);if(dd<=E.siege.range&&dd<bd){best=sl;bd=dd}}
  if(best){e.aiming=true;e.face=best.x>e.x?1:-1;e.shT=(e.shT==null?.8:e.shT)-dt;if(e.shT<=0){e.shT=E.siege.rate;e.atkA=.28;B.eproj.push({kind:'pot',sx:e.x,sy:e.y-14,x:e.x,y:e.y-14,tx:best.x,ty:best.y-4,sl:best,t:0,T:.6,arc:30,dmg:E.siege.dmg});AudioFx.cue('fire',.2)}}}
 if(E.smash){e.smT=(e.smT==null?4:e.smT)-dt;if(e.smT<=0){let best=null,bd=1e9;for(const sl of B.slots){const t=sl.t;if(!t||t.down||t.kind==='militia'||t.kind==='hero')continue;const dd=Math.hypot(sl.x-e.x,sl.y-e.y);if(dd<=E.smash.range&&dd<bd){best=sl;bd=dd}}
  if(best){e.smT=E.smash.rate;e.atkA=.28;B.eproj.push({kind:'smash',sx:e.x,sy:e.y-40,x:e.x,y:e.y-40,tx:best.x,ty:best.y,sl:best,t:0,T:.45,arc:60,dmg:E.smash.dmg});B.banner={t:1.2,txt:L('흑철 대장의 내려찍기!','黑铁大将的重击！')}}else e.smT=1}}}
function updateEproj(dt){for(const p of B.eproj){if(p.done)continue;p.t+=dt/p.T;const t=Math.min(1,p.t);p.x=p.sx+(p.tx-p.sx)*t;p.y=p.sy+(p.ty-p.sy)*t-(p.arc||0)*4*t*(1-t);
  if(p.kind==='pot'&&Math.random()<.6)puff(p.x,p.y,1,'#ff9a3a',10,.25,2,0,'spark');
  if(p.t>=1){p.done=true;if(p.kind==='bullet'){if(p.u&&!p.u.dead&&Math.hypot(p.u.x-p.tx,p.u.y-8-p.ty)<20)hurtUnit(p.u,p.dmg);puff(p.tx,p.ty,3,'#fff0c0',40,.15,1.6,0,'spark')}
   else if(p.kind==='pot'){towerHit(p.sl,p.dmg);puff(p.tx,p.ty,8,'#ff8a3a',55,.35,2.4,-20,'spark');puff(p.tx,p.ty,4,'rgba(90,80,70,.7)',20,.7,5,0,'smoke')}
   else if(p.kind==='smash'){towerHit(p.sl,p.dmg);for(const u of unitsNear(p.tx,p.ty,30))hurtUnit(u,30);AudioFx.cue('smash');shake(.35);vib('heavy');B.fx.push({x:p.tx,y:p.ty,t:.35,r:40,ring:true});puff(p.tx,p.ty,16,'#6b5a44',80,.5,3,160,'dot')}}}
 B.eproj=B.eproj.filter(p=>!p.done)}
// ---- 연출: 입자 · 투사체
function puff(x,y,n,col,spd,life,size,grav,kind,dirX,dirY){if(!B)return;for(let i=0;i<n;i++){if(B.parts.length>(perf.low?110:260))B.parts.shift();let a=Math.random()*TAU;if(dirX!=null){a=Math.atan2(dirY,dirX)+(Math.random()-.5)*1.6}
 const v=spd*(.4+Math.random()*.8);B.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-(kind==='smoke'?8:0),life:life*(.7+Math.random()*.6),max:life,size:size*(.7+Math.random()*.6),col,grav:grav||0,kind:kind||'dot'})}}
function shoot(kind,sx,sy,tg,dmg,type,extra){const tx=tg.x,ty=tg.y-6,d=Math.hypot(tx-sx,ty-sy);const delay=extra&&extra.delay||0;
 const P={kind,sx,sy,x:sx,y:sy,tg,tx,ty,dmg,type,t:0,px:sx,py:sy};
 if(kind==='arrow'||kind==='bolt'){P.T=d/430+.06;P.arc=10+d*.16}
 else if(kind==='rocket'){P.T=d/300+.05;P.arc=6+d*.08}
 else{P.T=.5+d/420;P.arc=34+d*.3;P.tg=null;P.tx=tg.x;P.ty=tg.y}
 Object.assign(P,extra||{});if(delay)P.t=-delay/P.T;B.proj.push(P)}
function dealDamage(e,dmg,type,quiet){if(e.dead)return;let m=1;if(type==='phys')m=1-e.E.armor;else if(type==='pierce')m=1-e.E.armor*.4;else if(type==='blast')m=1-e.E.armor/2;
 const v=dmg*m;e.hp-=v;if(quiet){if(e.hp>0)return}else{e.flash=.1;if(v>=9)B.nums.push({x:e.x+(Math.random()-.5)*8,y:e.y-22,v:Math.round(v),t:.7,c:type==='blast'?'#ffd27a':type==='fire'?'#ff9a5a':'#fff'})}if(!quiet&&!e.E.boss&&!e.blocked){const kb=type==='blast'?7:type==='fire'?3:1.5;e.d=Math.max(0,e.d-kb);const p=posAt(B.P,e.d);e.x=p.x;e.y=p.y}
 if(e.hp<=0){e.dead=true;const bty=crowdy(e.type)?Math.max(2,Math.round(e.E.gold*CROWD.gold)):e.E.gold;B.gold+=bty;B.kills++;order('kill');AudioFx.cue('die');B.coins.push({x:e.x,y:e.y-10,t:0,n:bty});if(e.E.boss){B.slow=1.2;B.fx.push({x:e.x,y:e.y,t:.6,r:60,ring:true})}if(e.blocked&&e.blocked.target===e)e.blocked.target=null;B.corpses.push({type:e.type,E:e.E,x:e.x,y:e.y,face:e.face,t:1.3});puff(e.x,e.y+e.E.r*.6,6,'rgba(150,120,80,.8)',30,.45,4,0,'smoke');if(e.E.boss){shake(.5);vib('heavy')}}}
function targetsIn(x,y,range,n){const es=B.enemies.filter(e=>!e.dead&&Math.hypot(e.x-x,e.y-y)<=range).sort((a,b)=>b.d-a.d);if(!es.length)return [];const out=[];for(let i=0;i<n;i++)out.push(es[i%es.length]);return out}
function pickTarget(x,y,range){let best=null;for(const e of B.enemies){if(e.dead)continue;if(Math.hypot(e.x-x,e.y-y)<=range&&(!best||e.d>best.d))best=e}return best}
function tick(dt){if(!B||B.phase!=='play'||paused||dbgFreeze)return;if(B.choice){B.choice.t+=dt;return}if(offer||adShow)return;let d=dt;if(B.slow>0){B.slow-=dt;d*=.3}for(let k=0;k<speed;k++)step(d)}
function step(dt){
 B.time+=dt;
 while(B.spawnQ.length&&B.spawnQ[0].at<=B.time)spawn(B.spawnQ.shift().type);
 if(B.started&&B.wave<B.S.waves.length&&B.nextT==null&&B.time>=B.lastSpawnAt)B.nextT=WAVE_GAP;
 if(B.nextT!=null){B.nextT-=dt;if(B.nextT<=0){B.nextT=null;queueWave()}}
 const prevLv=B.heroLv;B.heroLv=Math.min(5,1+Math.floor(Math.max(0,B.wave-1)/2));
 if(B.heroLv>prevLv){if(B.H&&!B.H.dead){B.H.hp+=HERO.hpLv;addFloat(B.H.x,B.H.y-30,L('장수 Lv','将领 Lv')+B.heroLv,'#9fd4ff')}AudioFx.cue('up');offerPerks()}
 for(const k in B.cd)if(B.cd[k]>0)B.cd[k]-=dt;if(B.goldPulse>0)B.goldPulse-=dt;for(const tp of B.taps)tp.t-=dt;B.taps=B.taps.filter(tp=>tp.t>0);for(const c of B.coins)c.t+=dt;B.coins=B.coins.filter(c=>{if(c.t>=.55){B.goldPulse=.15;return false}return true});
 for(const sl of B.slots)if(sl.t&&sl.t.hitT>0)sl.t.hitT-=dt;for(const bm of B.bombs){bm.t-=dt;if(bm.t<=0){for(const e of B.enemies)if(!e.dead&&Math.hypot(e.x-bm.x,e.y-bm.y)<=bm.splash){dealDamage(e,bm.dmg,'blast');if(!e.E.boss)e.stun=Math.max(e.stun||0,bm.stun)}B.fx.push({x:bm.x,y:bm.y,t:.35,r:bm.splash,ring:true});puff(bm.x,bm.y,16,'#ffb050',120,.3,3.2,0,'spark');puff(bm.x,bm.y,10,'rgba(110,100,90,.8)',36,.9,8,0,'smoke');B.fx.push({x:bm.x,y:bm.y,t:.7,r:bm.splash*.6,crater:true});AudioFx.cue('boom');shake(.18);vib('medium')}}B.bombs=B.bombs.filter(bm=>bm.t>0);for(const n of B.nums){n.t-=dt;n.y-=22*dt}B.nums=B.nums.filter(n=>n.t>0);
 updateHero(dt);updateReinf(dt);updateEproj(dt);
 if(B.skillCd>0)B.skillCd-=dt;if(B.skillT>0)B.skillT-=dt;if(B.banner&&B.banner.t>0)B.banner.t-=dt;if(B.bossWarn>0)B.bossWarn-=dt;if(B.leakFlash>0)B.leakFlash-=dt;
 for(const sl of B.slots)if(sl.t){if(sl.t.pop>0)sl.t.pop-=dt;if(sl.t.recoil>0)sl.t.recoil-=dt;if(sl.t.fa!=null)sl.t.fa+=dt}
 for(const c of B.carts){if(c.dead||c.safe)continue;if(c.hitT>0)c.hitT-=dt;const held=B.enemies.some(e=>!e.dead&&e.blocked===c);if(!held){c.d+=22*dt;const p=posAt(B.P,Math.max(0,c.d));c.face=p.x>c.x?1:p.x<c.x?-1:c.face;c.x=p.x;c.y=p.y}
  if(c.d>=B.P.len){c.safe=true;B.cartsSafe++;B.gold+=25;B.coins.push({x:c.x,y:c.y-20,t:0});addFloat(c.x,c.y-30,L('피난 성공! +25','撤离成功！+25'),'#9fffbf');AudioFx.cue('reward')}}
 B.carts=B.carts.filter(c=>!c.dead&&!c.safe);
 for(const e of B.enemies){if(e.dead)continue;if(e.flash>0)e.flash-=dt;
  if(!e.blocked&&B.carts.length){for(const c of B.carts){if(c.d>e.d&&c.d-e.d<13){e.blocked=c;break}}}
  if(e.blocked&&e.blocked.dead)e.blocked=null;if(e.burn>0){e.burn-=dt;dealDamage(e,e.burnD*dt,'fire',true);if(Math.random()<dt*10)puff(e.x+(Math.random()-.5)*8,e.y-8,1,'#ff8a3a',12,.35,2,-30,'spark');if(e.dead)continue}
  if(e.stun>0){e.stun-=dt;continue}
  enemyAct(e,dt);
  if(e.aiming){}else if(!e.blocked){e.d+=e.E.spd*(B.skillT>0?.7:1)*(B.S.ford&&e.y<B.S.ford.y?B.S.ford.mul:1)*dt;const p=posAt(B.P,e.d);e.x=p.x;e.y=p.y;
   if(e.d>=B.P.len){e.dead=true;if(B.skillT<=0){B.lives-=e.E.lives;shake(.25);AudioFx.cue('leak');vib('medium');B.leakFlash=.4}else addFloat(e.x,e.y-20,L('성벽이 막음','城墙挡住了'),'#9fd4ff')}}
  else{e.atkT-=dt;e.face=e.blocked.x>e.x?1:-1;if(e.atkT<=0){e.atkT=1;e.atkA=.28;const u=e.blocked;hurtUnit(u,e.E.atk);AudioFx.cue('clash',.08);puff((u.x+e.x)/2,u.y-8,4,'#fff0c0',60,.14,1.8,0,'spark',u.x-e.x,u.y-e.y);if(u.dead)e.blocked=null}}
  if(e.atkA>0)e.atkA-=dt}
 B.slots.forEach(sl=>{const t=sl.t;if(!t)return;
  if(t.kind==='hero'){t.cd-=dt;if(t.cd<=0){const tg=pickTarget(sl.x,sl.y,HERO.range);if(tg){t.cd=HERO.atkRate;shoot('bolt',sl.x,sl.y-18,tg,HERO.atkDmg+B.heroLv,'phys')}}return}
  if(t.kind==='militia'){updateMilitia(sl,t,dt);return}
  if(t.down){if(Math.random()<dt*6)puff(sl.x+(Math.random()-.5)*16,sl.y-10,1,'#ff8a3a',14,.5,2.4,-30,'spark');return}
  const D=towerD(t),Lv=t.lv;t.cd-=dt;if(t.cd>0)return;
  const rng=D.range[Lv]*(t.kind==='cannon'?1:1);const tg=pickTarget(sl.x,sl.y,rng);if(!tg)return;t.cd=D.rate[Lv];
  let dmg=D.dmg[Lv]*auraMul(sl.x,sl.y);t.ang=Math.atan2(tg.y-sl.y,tg.x-sl.x);t.recoil=.15;t.fa=0;
  t.fireT=.12;const tgs=targetsIn(sl.x,sl.y,rng,D.shots?D.shots[Lv]:1);
  if(t.kind==='archer'){dmg*=upMul('archer',.08);AudioFx.cue('arrow');tgs.forEach((e,i)=>shoot('arrow',sl.x+(i-(tgs.length-1)/2)*7,sl.y-26-Lv*3-(i%2)*3,e,dmg,D.pierce?'pierce':D.firearrow?'fire':'phys',{lv:Lv,delay:i*.05,burn:D.firearrow?D.burn[Lv]:0,big:D.pierce?1:0}))}
  else if(t.kind==='rocket'){dmg*=upMul('rocket',.08);AudioFx.cue('rocket');const ox=Math.cos(t.ang)*14,oy=Math.sin(t.ang)*8-14;puff(sl.x+ox,sl.y+oy,4+Lv*3,'rgba(200,190,170,.7)',22,.5,4,0,'smoke');tgs.forEach((e,i)=>shoot('rocket',sl.x+ox+(i-1)*5,sl.y+oy-i*3,e,dmg,'fire',{burn:D.burn[Lv],lv:Lv,delay:tgs.length>3?i*.07:0}))}
  else{dmg*=upMul('cannon',.05);AudioFx.cue('cannon',.1);const sp=D.splash[Lv]*upMul('cannon',.08)*(auraMul(sl.x,sl.y)>1?1.3:1);const ox=Math.cos(t.ang)*22,oy=Math.sin(t.ang)*10-8;puff(sl.x+ox,sl.y+oy,7,'rgba(220,210,190,.8)',26,.6,5,0,'smoke');puff(sl.x+ox,sl.y+oy,5,'#ffd27a',60,.18,2.4,0,'spark',Math.cos(t.ang),Math.sin(t.ang));shoot('ball',sl.x+ox,sl.y+oy,tg,dmg,'blast',{splash:sp,stun:D.stun[Lv],lv:Lv,bomb:D.bomb})}});
 for(const p of B.proj){if(p.done)continue;if(p.tg&&!p.tg.dead){p.tx=p.tg.x;p.ty=p.tg.y-6}
  p.t+=dt/p.T;if(p.t<0)continue;const t=Math.min(1,p.t),bx=p.sx+(p.tx-p.sx)*t,by=p.sy+(p.ty-p.sy)*t;p.px=p.x;p.py=p.y;p.gx=bx;p.gy=by;p.x=bx;p.y=by-p.arc*4*t*(1-t);
  if(p.kind==='rocket'&&Math.random()<.8)puff(p.x,p.y,1,'rgba(190,180,165,.55)',6,.45,3.2,0,'smoke');
  if(p.t>=1){p.done=true;
   if(p.aoe){for(const e of B.enemies)if(!e.dead&&Math.hypot(e.x-p.tx,e.y-p.ty)<=p.aoe)dealDamage(e,p.dmg,'fire');puff(p.tx,p.ty,8,'#ff9a4a',60,.3,2.6,0,'spark');puff(p.tx,p.ty,4,'rgba(110,100,90,.7)',22,.7,6,0,'smoke');B.fx.push({x:p.tx,y:p.ty,t:.5,r:10,crater:true});AudioFx.cue('boom',.09);shake(.06)}
   else if(p.kind==='ball'&&p.bomb){B.bombs.push({x:p.tx,y:p.ty,t:.7,dmg:p.dmg,splash:p.splash,stun:p.stun});puff(p.tx,p.ty,4,'rgba(120,110,95,.7)',14,.6,4,0,'smoke');AudioFx.cue('build',.1)}
   else if(p.kind==='ball'){for(const e of B.enemies)if(!e.dead&&Math.hypot(e.x-p.tx,e.y-p.ty)<=p.splash){dealDamage(e,p.dmg,'blast');if(p.stun&&!e.E.boss)e.stun=Math.max(e.stun||0,p.stun)}if(p.lv>=2){shake(.12);puff(p.tx,p.ty,10,'#ffb050',110,.25,3,0,'spark')}B.fx.push({x:p.tx,y:p.ty,t:.25,r:p.splash,ring:true});
    puff(p.tx,p.ty,12,'#6b5a44',70,.5,2.6,160,'dot');puff(p.tx,p.ty,8,'rgba(120,110,95,.75)',30,.8,7,0,'smoke');puff(p.tx,p.ty,6,'#ffcf6a',80,.18,2.2,0,'spark');B.fx.push({x:p.tx,y:p.ty,t:.6,r:p.splash*.6,crater:true});AudioFx.cue('boom');shake(.08)}
   else if(p.tg&&!p.tg.dead){if(p.kind==='arrow'&&p.tg.E.shield){p.dmg*=1-p.tg.E.shield;puff(p.x,p.y,3,'#d8c8a0',40,.15,1.6,0,'spark',-1,0);AudioFx.cue('clash',.15)}dealDamage(p.tg,p.dmg,p.type);if(p.burn){p.tg.burn=2.2;p.tg.burnD=p.burn}const dx=p.x-p.px,dy=p.y-p.py;
    if(p.kind==='rocket'){puff(p.x,p.y,7,'#ff9a4a',60,.25,2.4,0,'spark');puff(p.x,p.y,3,'rgba(160,150,140,.6)',16,.5,5,0,'smoke')}else puff(p.x,p.y,4,p.kind==='bolt'?'#9fd8ff':'#f2e6c9',50,.18,1.8,0,'spark',-dx,-dy)}
   else puff(p.x,p.y,3,'rgba(150,120,80,.7)',20,.3,3,0,'smoke')}}
 for(const q of B.parts){q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=q.grav*dt;if(q.kind==='smoke'){q.vx*=.96;q.vy*=.96;q.size+=dt*6}else{q.vx*=.92;q.vy*=.92}}
 B.parts=B.parts.filter(q=>q.life>0);for(const c2 of B.corpses)c2.t-=dt;B.corpses=B.corpses.filter(c2=>c2.t>0);
 B.proj=B.proj.filter(p=>!p.done);B.enemies=B.enemies.filter(e=>!e.dead);for(const f of B.fx)f.t-=dt;B.fx=B.fx.filter(f=>f.t>0);
 if(B.lives<=0){B.lives=0;endStage(false)}else if(B.wave>=B.S.waves.length&&!B.spawnQ.length&&!B.enemies.length)endStage(true)}
function updateMilitia(sl,t,dt){const D=towerD(t),Lv=t.lv,hpMax=D.hp[Lv]*upMul('militia',.12);
 if(!t.rally){const n=nearestOnPath(B.P,sl.x,sl.y);t.rally={x:n.x,y:n.y}}
 if(!t.men)t.men=[0,1,2].map(k=>({k,hp:hpMax,dead:false,respawn:0,x:t.rally.x,y:t.rally.y,target:null,cd:0}));
 while(t.men.length<(D.men||3))t.men.push({k:t.men.length,hp:hpMax,dead:false,respawn:0,x:t.rally.x,y:t.rally.y,target:null,cd:0,pop:.4});
 for(const m of t.men){m.resp=D.respawn;if(m.dead){m.respawn-=dt;if(m.respawn<=0){m.dead=false;m.hp=hpMax;m.x=t.rally.x;m.y=t.rally.y}continue}
  const home={x:t.rally.x+(m.k-1)*12-(m.k===3?18:0),y:t.rally.y+(m.k===1?-8:m.k===3?-2:6)};
  if(m.target&&(m.target.dead||m.target.blocked!==m))m.target=null;
  if(!m.target){let best=null;for(const e of B.enemies){if(e.dead||e.blocked||e.E.boss)continue;const dd=Math.hypot(e.x-t.rally.x,e.y-t.rally.y);if(dd<=D.range&&(!best||e.d>best.d))best=e}if(best){m.target=best;best.blocked=m;order('block')}}
  const goal=m.target?{x:m.target.x+(m.k-1)*6,y:m.target.y+8}:home;const dx=goal.x-m.x,dy=goal.y-m.y,dd=Math.hypot(dx,dy),st=90*dt;
  const mv=Math.min(dd,st);m.dist=(m.dist||0)+mv;if(dx<-.5)m.face=-1;else if(dx>.5)m.face=1;if(dd>st){m.x+=dx/dd*st;m.y+=dy/dd*st}else{m.x=goal.x;m.y=goal.y}
  if(m.atkA>0)m.atkA-=dt;if(m.hitT>0)m.hitT-=dt;
  if(m.target&&dd<14){m.cd-=dt;if(m.cd<=0){m.cd=D.srate;m.atkA=.24;AudioFx.cue('clash',.08);puff(m.target.x,m.target.y-6,3,'#fff0c0',50,.14,1.6,0,'spark',m.target.x-m.x,m.target.y-m.y);dealDamage(m.target,D.sdmg[Lv]*auraMul(m.x,m.y,1),'phys')}}}}
function endStage(win){if(B.result)return;const stars=win?(B.lives>=18?3:B.lives>=6?2:1):0;const prev=save.stars[B.i]||0;
 let merit=win?20+10*stars:4+2*Math.max(0,B.wave-1);const newStars=win?Math.max(0,stars-prev):0;merit+=newStars*15;
 let chalNew=false;if(win&&B.chal){save.chal=save.chal||[];if(!save.chal.includes(B.i)){save.chal.push(B.i);merit+=40;chalNew=true}}
 if(win&&B.i===1&&prev===0)setTimeout(()=>message(L('곽재우가 합류했어요! 전투 선택 화면 장수 단추에서 바꿀 수 있어요','郭再祐加入了！可在选择战斗画面的将领按钮中切换'),3),1600);
 B.result={win,stars,merit,newStars,chalNew};if(win){B.showHist=prev===0;save.stars[B.i]=Math.max(prev,stars);order('clear');if(stars===3)order('stars3')}
 gainMerit(merit);AudioFx.cue(win?'win':'lose');track(win?'stage_clear':'stage_fail',{stage:B.i+1,stars,wave:B.wave,lives:B.lives,chal:B.chal?1:0});sc=win?'clear':'fail';B.endT=0;popup=null;persist()}
function revive(){B.revived=true;B.lives=5;B.result=null;for(const e of B.enemies)if(e.d>B.P.len*.6){e.d=Math.max(0,e.d-120)}B.cd={fire:0,reinf:0};if(B.H&&B.H.dead)B.H.respawn=0;sc='battle';B.phase='play';message(L('부활! 목숨 5개로 다시 싸운다','复活！以5条命继续战斗'),1.8)}
function useSkill(){if(B.hero==null||B.skillCd>0)return;B.skillT=HERO.skillDur;B.skillCd=skillCdMax();shake(.15);AudioFx.cue('skill');vib('medium');order('skill');save.tips.tut4=1;addFloat(180,BOT-60,L('성벽 보강! 10초','城墙加固！10秒'),'#9fd4ff')}

// ---------------------------------------------------------------- 그리기 도우미 (360×640 좌표)
function txt(s,x,y,size,col,align,weight){g.font=(weight||'700')+' '+size+'px '+FONT;g.fillStyle=col||'#fff';g.textAlign=align||'center';g.textBaseline='middle';g.fillText(s,x,y)}
function rr(x,y,w,h,r,fill,stroke,lw){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();if(fill){g.fillStyle=fill;g.fill()}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw||1.5;g.stroke()}}
const BTN={gold:['#8a5a1f','#ffd27a'],blue:['#2f5f8a','#9fd0ff'],gray:['#3a3530','#8a8070'],red:['#7a2f2f','#ff9a8a'],green:['#3c7d43','#a8f0b0']};
function button(x,y,w,h,label,kind,size,dis){const k=BTN[kind||'gray'];rr(x,y,w,h,10,dis?'#2a2723':k[0],dis?'#444':k[1],1.5);txt(label,x+w/2,y+h/2,size||14,dis?'#777':'#fff')}
function hit(x,y,bx,by,bw,bh){return x>=bx&&x<=bx+bw&&y>=by&&y<=by+bh}
function wrap(s,x,y,maxW,size,col,lh,align){g.font='600 '+size+'px '+FONT;const out=[];for(const raw of s.split('\n')){let line='';for(const ch of raw){if(g.measureText(line+ch).width>maxW&&line&&'，。、；：！？）」』”’.,!?)"\''.indexOf(ch)<0){out.push(line);line=''}line+=ch}out.push(line)}
 out.forEach((l,i)=>txt(l,x,y+i*(lh||size+6),size,col,align||'center','600'));return out.length}
function panel(x,y,w,h){rr(x,y,w,h,14,'#2b261ef2','#8a7650',1.5)}
function bg(){const gr=g.createLinearGradient(0,0,0,VH);gr.addColorStop(0,'#2a2418');gr.addColorStop(1,'#14120f');g.fillStyle=gr;g.fillRect(0,0,VW,VH)}
function mountains(y,col){g.fillStyle=col;g.beginPath();g.moveTo(0,y);for(let x=0;x<=VW;x+=30)g.lineTo(x,y-18-14*Math.sin(x*.035)-10*Math.sin(x*.11));g.lineTo(VW,VH);g.lineTo(0,VH);g.closePath();g.fill()}
function drawFinger(x,y,label){const b=Math.sin(frame*7)*5;g.save();g.translate(x,y+b);g.beginPath();g.arc(0,-3,15+Math.sin(frame*7)*2.5,0,TAU);g.strokeStyle='rgba(255,230,140,.85)';g.lineWidth=2.5;g.stroke();txt('👆',2,20,26,'#fff','center','400');g.restore();
 if(label){g.font='700 11px '+FONT;const w=Math.max(100,g.measureText(label).width+24);const bx=Math.min(VW-w-8,Math.max(8,x-w/2));rr(bx,y-54+b*.3,w,26,8,'#1b2232f2','#ffcf6a',1.5);txt(label,bx+w/2,y-41+b*.3,11,'#ffe2a0')}}
function tip(id,lines){if(save.tips[id])return false;save.tips[id]=1;persist();guideTip={lines,t:0};return true}
function drawGuideTip(dt){guideTip.t+=dt;const ls=guideTip.lines.map(l=>LL(l));g.fillStyle='rgba(4,6,12,.72)';g.fillRect(0,0,VW,VH);
 g.font='600 12px '+FONT;let n=0;const cnt=ls.map(l=>{let c2=1,cur='';for(const ch of l){if(g.measureText(cur+ch).width>270&&cur){c2++;cur=''}cur+=ch}n+=c2;return c2});
 const h=70+n*18+(ls.length-1)*8,y0=300-h/2;rr(24,y0,312,h,12,'#141a28f4','#ffcf6a',1.5);txt('💡 '+L('안내','提示'),44,y0+24,14,'#ffe2a0','left');
 let yy=y0+52;ls.forEach((l,i)=>{txt('•',40,yy,12,'#ffcf6a','left');wrap(l,52,yy,270,12,'#f0eff7',18,'left');yy+=cnt[i]*18+8});if(Math.sin(frame*6)>-.3)txt('▼ '+L('터치해서 닫기','点击关闭'),320,y0+h-12,9,'#ffcf7a','right')}

// ---------------------------------------------------------------- 화면: 로딩 · 타이틀
function loadingScreen(dt){loadT+=dt;bg();const tot=IMG_LIST.length,done=IMG_LIST.filter(n=>imgs[n]).length,mustOk=MUST.every(n=>imgs[n]||imgFail[n]);
 txt(L('조선 디펜스','朝鲜守城'),180,270,32,'#f2e6c9','center','900');rr(80,320,200,8,4,'#1a1e28','#3a4250',1);rr(81,321,198*(tot?done/tot:Math.min(1,loadT/.6)),6,3,'#ffb84a');
 txt(L('불러오는 중… ','加载中… ')+Math.round((tot?done/tot:Math.min(1,loadT/.6))*100)+'%',180,350,11,'#c9d2de');
 if(loadT>6&&!mustOk)txt(L('인터넷이 느려 시간이 걸리고 있어요','网络较慢，请稍候'),180,372,10,'#ffcf7a');
 if((mustOk&&(done>=tot)&&loadT>.6)||loadT>25){sc='title';AudioFx.cue('ui')}}
function title(){const TY=imgs.bg_title?0:1;
 if(cover('bg_title')){const gt=g.createLinearGradient(0,0,0,220);gt.addColorStop(0,'rgba(20,12,8,.55)');gt.addColorStop(1,'rgba(20,12,8,0)');g.fillStyle=gt;g.fillRect(0,0,VW,220);const gb=g.createLinearGradient(0,400,0,VH);gb.addColorStop(0,'rgba(14,10,8,0)');gb.addColorStop(.35,'rgba(14,10,8,.75)');gb.addColorStop(1,'rgba(14,10,8,.95)');g.fillStyle=gb;g.fillRect(0,400,VW,VH-400)}
 else{bg();mountains(430,'#1f2a1c');mountains(470,'#17200f');spriteB('gate',180,562,240);g.save();g.globalAlpha=.25+.08*Math.sin(frame*2);g.fillStyle='#ff9a3a';g.beginPath();g.arc(180,240,120,0,TAU);g.fill();g.restore()}
 const ty=TY?200:112;g.save();g.shadowColor='rgba(0,0,0,.7)';g.shadowBlur=8;txt(L('조선 디펜스','朝鲜守城'),180,ty,40,'#f7ecd2','center','900');txt(L('임진왜란','壬辰倭乱'),180,ty+46,18,'#ffd27a','center','800');
 txt(L('장수가 되어 성문을 지켜라','化身将领，守住城门'),180,ty+78,12,'#f0e2c4','center','600');g.restore();
 const by=TY?330:462;button(80,by,200,54,L('출전','出征'),'gold',20);paper(80,by,200,54,10,.2);button(80,by+(TY?66:62),96,40,L('안내서','指南'),'gray',13);button(184,by+(TY?66:62),96,40,L('설정','设置'),'gray',13);
 rr(270,10,80,26,8,'#151a28d8','#9fb4e8',1);txt(LANG==='zh'?'🌐 한국어':'🌐 中文',310,23,11,'#fff');
 if(LANG==='zh'){txt('抵制不良游戏，拒绝盗版游戏。注意自我保护，谨防受骗上当。',180,574,7.5,'#8a96a8','center','500');txt('适度游戏益脑，沉迷游戏伤身。合理安排时间，享受健康生活。',180,588,7.5,'#8a96a8','center','500')}
 if(Object.keys(imgFail).length)txt(L('일부 그림을 받지 못했어요 · 새로고침 해 주세요','部分图片加载失败 · 请刷新'),180,606,8,'#ff9a8a');
 txt('v1 · '+BUILD+' · '+L('별 ','星 ')+starTotal()+'/'+STAGES.length*3,180,624,8,'#6f6a5e','center','500')}

// ---------------------------------------------------------------- 화면: 전투 선택(지도)
function nextGoal(){if(starTotal()>=STAGES.length*3)return [L('모든 전투 별 3개! 본영 강화를 완성해 보세요','全部三星！继续完成本营强化'),'#9fffbf'];
 for(let i=0;i<STAGES.length;i++)if(!(save.stars[i]>0))return [L('다음 목표: ','下一目标：')+LL(STAGES[i].name)+L(' 승리',' 胜利'),'#ffd8a8'];
 const nx=UP_KEYS.find(k=>save.up[k]<UP_MAX&&save.merit>=upCost(k));if(nx)return [L('▲ 본영에서 ','▲ 可在本营强化 ')+LL(UPS[nx].name)+L(' 강화 가능',''),'#9fffbf'];
 const h=HONOR.findIndex((x,i)=>!save.honor.includes(i));if(h>=0)return [L('다음 목표: 별 ','下一目标：星 ')+starTotal()+'/'+HONOR[h][0]+L(' → 전공 포상',' → 战功奖赏'),'#ffd8a8'];
 return [L('별 3개에 도전해 보세요','挑战三星吧'),'#d8e0ea']}
function unlocked(i){return i===0||(save.stars[i-1]||0)>0}
function mapRect(i){const st=Math.min(59,364/STAGES.length);return {x:24,y:108+i*st,w:312,h:st-5}}
function mapScreen(){if(!cover('bg_map','rgba(18,14,10,.55)')){bg();mountains(600,'#1c2418')}
 txt(L('전투 선택','选择战斗'),20,26,18,'#f2e6c9','left','900');
 {const hx=196,hy=25;rr(hx-17,hy-15,34,30,8,'#151a28d8','#c8a050',1);g.save();g.beginPath();rr(hx-16,hy-14,32,28,7);g.clip();icon(HEROES[save.hero].ic,hx,hy,34);g.restore();if(!save.tips.heroSeen&&heroUnlocked('kwak')){g.fillStyle='#ff4a3a';g.beginPath();g.arc(hx+15,hy-13,5,0,TAU);g.fill()}}
 if(!icon('hist',240,25,32)){rr(220,10,40,30,8,'#151a28d8','#c8a050',1);txt('📜',240,25,14,'#fff')}if(HIST.some((h,k)=>histUnlocked(k)&&!save.histRead.includes(k))){g.fillStyle='#ff4a3a';g.beginPath();g.arc(258,12,5,0,TAU);g.fill()}if(!icon('guide',286,25,30)){rr(266,10,40,30,8,'#151a28d8','#8a8070',1);txt('?',286,25,15,'#fff')}if(!icon('gear',332,25,30)){rr(312,10,40,30,8,'#151a28d8','#8a8070',1);txt('⚙',332,25,15,'#fff')}
 rr(16,48,328,52,10,'#211d16','#5a4f3a',1);txt(LL(RANKS[rankIdx()][1]),28,64,13,'#ffe2a0','left','800');
 const ri=rankIdx(),nextR=RANKS[ri+1];txt(L('공적 ','功勋 ')+save.merit,332,64,13,'#ffd34d','right','800');
 rr(28,78,304,8,4,'#3a3326');const p0=RANKS[ri][0],p1=nextR?nextR[0]:p0+1;rr(28,78,304*Math.min(1,(save.meritTotal-p0)/(p1-p0)),8,4,'#d8a840');
 txt(nextR?L('다음 품계까지 ','距下一品阶 ')+(p1-save.meritTotal):L('최고 품계','最高品阶'),332,93,8,'#a89a7c','right','500');
 for(let i=0;i<STAGES.length;i++){const r=mapRect(i),S=STAGES[i],u=unlocked(i);rr(r.x,r.y,r.w,r.h,12,u?'#2f2a22':'#24221e',u?'#7a6a48':'#3a3630',1.5);
  txt((i+1)+'. '+LL(S.name),r.x+16,r.y+r.h*.38,15,u?'#f2e6c9':'#6b665c','left','800');txt(LL(S.year)+' · '+L('웨이브 ','敌波 ')+S.waves.length,r.x+16,r.y+r.h*.76,9.5,u?'#b9ab8c':'#5a564e','left','500');
  if(u&&(save.stars[i]||0)>0){const done=(save.chal||[]).includes(i),bx=r.x+r.w-132,by=r.y+r.h/2-14.5;rr(bx,by,52,29,8,done?'#5a3a14':'#6b2a1e',done?'#ffd34d':'#e08a5a',1.2);txt(done?L('도전 ✓','挑战 ✓'):L('영웅 도전','英雄挑战'),bx+26,by+15,9.5,done?'#ffd34d':'#ffd0b0','center','800')}
  const st=save.stars[i]||0;for(let k=0;k<3;k++){if(imgs.icon_star){g.globalAlpha=k<st?1:.22;icon('star',r.x+r.w-66+k*20,r.y+r.h/2,20);g.globalAlpha=1}else txt('★',r.x+r.w-66+k*20,r.y+r.h/2,18,k<st?'#ffd34d':'#4a4538')}if(!u)txt('🔒',r.x+r.w-90,r.y+r.h/2,14,'#6b665c')}
 const [gt,gc]=nextGoal();txt(gt,180,487,11,gc,'center','700');
 button(16,500,104,58,L('본영 강화','本营强化'),'blue',13);button(128,500,104,58,L('포상','奖赏'),'gold',14);
 const cl=cartLeft();button(240,500,104,58,'',cl>0?'green':'gray',13,cl<=0);txt(L('보급 수레','补给车'),292,520,13,cl>0?'#fff':'#777');txt('▶ '+cl+'/3',292,540,10,cl>0?'#d8ffd8':'#777');
 if(rewardBadge()){g.fillStyle='#ff4a3a';g.beginPath();g.arc(226,506,6,0,TAU);g.fill()}
 if(UP_KEYS.some(k=>save.up[k]<UP_MAX&&save.merit>=upCost(k))){g.fillStyle='#ff4a3a';g.beginPath();g.arc(114,506,6,0,TAU);g.fill()}
 txt(L('둔전에 공적이 쌓이는 중: ','屯田积累功勋：')+farmAmount(),180,584,10,'#a8c89a','center','600')}

// ---------------------------------------------------------------- 화면: 본영 강화
function baseScreen(){bg();txt(L('본영 강화','本营强化'),20,26,18,'#f2e6c9','left','900');txt(L('공적 ','功勋 ')+save.merit,340,26,14,'#ffd34d','right','800');
 UP_KEYS.forEach((k,i)=>{const y=52+i*78,U=UPS[k],lv=save.up[k];rr(14,y,332,70,10,'#2b261e','#5a4f3a',1);
  paper(14,y,332,70,10,.12);if(TOWERS[k])spriteB('tower_'+k+'_'+Math.min(3,1+Math.floor(lv/2)),48,y+64,lv>=UP_MAX?60:54,false);else icon(k==='gold'?'coin':'hero',48,y+35,46);
  if(lv>=UP_MAX)rr(15,y+1,330,68,10,null,'#ffd34d',1.5);
  txt(LL(U.name),86,y+18,14,'#f2e6c9','left','800');txt(LL(U.desc),86,y+38,10,'#c9bfa8','left','600');
  for(let q=0;q<UP_MAX;q++){if(imgs.icon_star){g.globalAlpha=q<lv?1:.18;icon('star',92+q*17,y+55,15);g.globalAlpha=1}else rr(86+q*16,y+50,12,8,2,q<lv?'#ffd34d':'#3a3326')}
  if(lv>=UP_MAX)button(252,y+14,84,42,L('완료','已满'),'gray',13,true);else{const cst=upCost(k),ok=save.merit>=cst;button(252,y+14,84,42,'',ok?'gold':'gray',13,!ok);txt(L('강화','强化'),294,y+28,12,ok?'#fff':'#777');txt(String(cst),294,y+44,11,ok?'#ffe08a':'#777')}});
 button(80,530,200,50,L('◀ 돌아가기','◀ 返回'),'gray',15)}

// ---------------------------------------------------------------- 화면: 포상 (봉화 · 장계 · 전공 · 둔전)
function rewardScreen(){bg();ordersInit();txt(L('포상','奖赏'),20,26,18,'#f2e6c9','left','900');txt(L('공적 ','功勋 ')+save.merit,340,26,14,'#ffd34d','right','800');
 // 봉화 7일
 rr(12,48,336,92,10,'#2b261e','#5a4f3a',1);txt(L('봉화 7일','七日烽火'),24,64,13,'#ffe2a0','left','800');txt(L('하루 한 번 봉화를 올리세요','每天点燃一座烽火台'),24,80,9,'#a89a7c','left','500');
 const bn=save.beacon.n%7;for(let d=0;d<7;d++){const x=36+d*36,lit=d<bn,today=d===bn&&beaconCan();g.fillStyle='#4a4030';g.beginPath();g.moveTo(x-10,128);g.lineTo(x-6,104);g.lineTo(x+6,104);g.lineTo(x+10,128);g.closePath();g.fill();
  if(lit||today){g.save();g.globalAlpha=lit?1:.4+.3*Math.sin(frame*6);g.fillStyle='#ff9a3a';g.beginPath();g.moveTo(x-6,104);g.quadraticCurveTo(x,84,x+6,104);g.closePath();g.fill();g.restore()}
  txt(String(BEACON[d]),x,136,8,d===6?'#ffd34d':'#c9bfa8')}
 if(beaconCan())button(270,96,70,36,L('올리기','点燃'),'gold',12);else txt(L('내일 또','明日再来'),305,114,10,'#8a8070');
 // 오늘의 장계
 txt(L('오늘의 장계','今日诏令'),20,158,13,'#ffe2a0','left','800');
 save.orders.m.forEach((m,k)=>{const O=ORDERS[m.i],y=170+k*50;rr(12,y,336,44,8,'#2b261e','#4a4030',1);txt(LL(O.name),24,y+15,11,'#f0eff7','left','700');
  rr(24,y+28,200,6,3,'#3a3326');rr(24,y+28,200*m.p/O.goal,6,3,'#7ab36a');txt(m.p+'/'+O.goal,230,y+31,8,'#c9bfa8','left','500');
  if(m.c)txt(L('완료','已领'),306,y+22,11,'#8a8070');else{const ok=m.p>=O.goal;button(270,y+6,70,32,'+'+O.r,ok?'gold':'gray',12,!ok)}});
 // 전공 포상
 txt(L('전공 포상','战功奖赏')+'  ★'+starTotal(),20,338,13,'#ffe2a0','left','800');
 HONOR.forEach((h,i)=>{const x=12+i*114,got=save.honor.includes(i),ok=starTotal()>=h[0]&&!got;rr(x,350,108,60,8,'#2b261e',ok?'#ffd34d':'#4a4030',1.5);txt('★'+h[0],x+54,366,12,'#ffd34d');
  if(got)txt(L('받음','已领'),x+54,392,11,'#8a8070');else button(x+14,378,80,26,'+'+h[1],ok?'gold':'gray',11,!ok)});
 // 둔전
 const fa=farmAmount();rr(12,422,336,70,10,'#26301f','#5a7048',1);txt(L('둔전','屯田'),24,440,13,'#cfe8b0','left','800');txt(L('시간당 공적 3 · 최대 8시간','每小时功勋3 · 最多8小时'),24,458,9,'#a8c89a','left','500');txt(L('쌓인 공적 ','已积累 ')+fa,24,476,11,'#e8f4d8','left','700');
 button(196,436,70,42,L('받기','领取'),fa>0?'green':'gray',12,fa<=0);button(272,436,70,42,'',fa>0?'blue':'gray',11,fa<=0);txt('▶ x2',307,452,11,fa>0?'#fff':'#777');txt(L('광고','广告'),307,468,8,fa>0?'#cfe8ff':'#777');
 button(80,530,200,50,L('◀ 돌아가기','◀ 返回'),'gray',15)}
function collectFarm(mult){const n=farmAmount()*mult;if(n<=0)return;save.farm=Date.now();gainMerit(n);AudioFx.cue('reward');message(L('둔전 수확! 공적 +','屯田收获！功勋 +')+n,1.4)}

// ---------------------------------------------------------------- 화면: 설정 · 개인정보 · 안내서
function onoff(v){return v?L('켬','开'):L('끔','关')}
function settingsScreen(){bg();txt(L('설정','设置'),180,60,20,'#ffe2a0','center','900');
 button(40,100,136,44,L('배경음악: ','音乐：')+onoff(Music.on),'gray',12);button(184,100,136,44,L('효과음: ','音效：')+onoff(AudioFx.enabled),'gray',12);
 button(40,154,136,44,L('흔들림: ','屏幕晃动：')+onoff(save.shake!==false),'gray',12);button(184,154,136,44,L('진동: ','振动：')+onoff(save.vib!==false),'gray',12);
 const qn={auto:L('자동','自动'),high:L('높음','高'),low:L('낮음','低')}[save.quality]||'';button(40,208,136,44,L('화질: ','画质：')+qn+(save.quality==='auto'&&perf.low?L('(낮음)','(低)'):''),'gray',12);button(184,208,136,44,L('순화 연출: ','温和演出：')+onoff(!!save.mild),'gray',12);
 button(40,262,280,44,'🌐 '+(LANG==='zh'?'语言：简体中文':'언어: 한국어'),'gray',13);
 button(40,316,280,44,L('개인정보 처리방침','隐私政策'),'blue',13);
 button(40,384,280,44,L('진행 초기화','重置进度'),'red',13);if(resetArm>0)txt(L('한 번 더 누르면 모든 진행이 지워져요','再按一次将清除所有进度'),180,442,10,'#ff9a8a');
 txt(L('순화 연출: 쓰러진 병사가 바로 연기로 사라져요','温和演出：倒下的士兵会化作烟雾消失'),180,470,9,'#8a8070','center','500');
 button(80,530,200,50,L('◀ 돌아가기','◀ 返回'),'gray',15)}
function privacyScreen(){bg();txt(L('개인정보 처리방침','隐私政策'),180,50,17,'#ffe2a0','center','900');rr(16,76,328,436,10,'#141a28','#2e3646',1);
 wrap(L('1. 이 게임은 회원가입이 없으며, 개발자는 이름·전화번호·위치 같은 개인정보를 수집하지 않습니다.\n\n2. 게임 진행 기록(별, 공적, 설정)은 이 기기 안에만 저장됩니다. 게임을 삭제하거나 저장 공간을 지우면 함께 지워집니다.\n\n3. 보상형 광고는 위챗·더우인 플랫폼이 제공합니다. 광고를 보여 주기 위해 플랫폼이 기기 정보를 처리할 수 있으며, 이는 각 플랫폼의 개인정보 정책을 따릅니다.\n\n4. 게임 개선을 위해 전투 시작·승리·패배, 광고 시청 같은 익명 통계를 플랫폼 통계 기능으로 집계합니다. 개인을 알아볼 수 있는 정보는 포함되지 않습니다.\n\n5. 공유 기능은 사용자가 직접 누를 때만 동작합니다.',
  '1. 本游戏无需注册，开发者不收集姓名、手机号、位置等个人信息。\n\n2. 游戏进度（星级、功勋、设置）仅保存在本设备中，删除游戏或清除缓存后将一并删除。\n\n3. 激励视频广告由微信/抖音平台提供。为展示广告，平台可能处理设备信息，相关处理遵循各平台的隐私政策。\n\n4. 为改进游戏，我们通过平台统计功能汇总战斗开始/胜利/失败、广告观看等匿名数据，不包含可识别个人身份的信息。\n\n5. 分享功能仅在用户主动点击时使用。'),
  30,96,300,10.5,'#d8e0ea',16,'left');button(80,530,200,50,L('◀ 돌아가기','◀ 返回'),'gray',15)}
const GUIDE=[
 {t:['게임 흐름','游戏流程'],body:[['전투 선택 → 전투 → 별·공적 획득','选择战斗 → 战斗 → 获得星级和功勋'],['공적으로 본영에서 타워를 영구 강화','用功勋在本营永久强化防御塔'],['공적을 모으면 관직이 올라 시작 엽전이 늘어남','功勋累积可升迁，初始铜钱增加'],['포상: 봉화 7일 · 오늘의 장계 · 전공 포상 · 둔전','奖赏：七日烽火 · 今日诏令 · 战功奖赏 · 屯田']]},
 {t:['타워','防御塔'],body:[['궁수대: 빠른 화살. 갑옷무사에게 약함','弓手台：快速射箭，对铠甲武士较弱'],['의병 막사: 병사 3명이 길을 막음. 대장은 못 막음','义兵营：3名士兵挡路，挡不住大将'],['신기전: 갑옷을 무시하는 불화살','神机箭：无视铠甲的火箭'],['총통: 느리지만 넓은 범위 포격','铳筒：较慢但范围广的炮击'],['타워를 누르면 강화·판매 (판매 시 60% 돌려받음)','点击防御塔可强化/出售（返还60%）']]},
 {t:['장수와 책략','将领与计策'],body:[['땅을 누르면 장수 김시민이 달려가 직접 싸움. 쓰러지면 12초 뒤 부활','点击地面，将领金时敏会跑过去亲自作战。倒下12秒后复活'],['장수 주변 타워 공격 강화, 총통 범위 증가','将领周围的防御塔攻击提升，铳筒范围扩大'],['책략 단추를 누른 뒤 전장을 누르면 그곳에 화차 일제사격 · 의병 증원','按下计策按钮后点击战场，即可在该处发动火车齐射或义兵增援'],['화공병은 타워에 불을 지름. 타워를 눌러 수리','火攻兵会烧毁防御塔，点击防御塔进行修理'],['다음 웨이브를 일찍 부르면 남은 초만큼 엽전','提前召唤敌波可获得剩余秒数的铜钱']]}];
function guideScreen(){bg();txt(L('안내서','指南'),180,30,18,'#ffe2a0','center','900');
 GUIDE.forEach((p,k)=>{button(12+k*114,50,108,32,LL(p.t),k===guidePage?'gold':'gray',11)});
 rr(16,96,328,410,10,'#141a28','#2e3646',1);let y=120;for(const b of GUIDE[guidePage].body){txt('•',30,y,13,'#ffcf6a','left');const n=wrap(LL(b),44,y,286,12,'#f0eff7',18,'left');y+=n*18+14}
 button(80,530,200,50,L('◀ 돌아가기','◀ 返回'),'gray',15)}

// ---------------------------------------------------------------- 화면: 전투
function nextWaveInfo(){if(B.wave>=B.S.waves.length)return null;return B.S.waves[B.wave].map(([t,cn])=>LL(ENEMIES[t].name)+'×'+(crowdy(t)?Math.round(cn*CROWD.n):cn)).join('  ')}
function popupButtons(){if(!popup)return [];const sl=B.slots[popup.slot],btns=[];
 if(!sl.t){const opts=TORDER.map(k=>({k,label:LL(TOWERS[k].short||TOWERS[k].name),cost:TOWERS[k].cost[0],color:TOWERS[k].color}));
  const n=opts.length,R=56,v=camView(),cx=Math.max(CAM.x+R+24,Math.min(CAM.x+v.w-R-24,sl.x)),cy=Math.max(CAM.y+R+24,Math.min(CAM.y+v.h-R-34,sl.y));opts.forEach((o,i)=>{const a=-Math.PI/2+i*TAU/n;btns.push(Object.assign({},o,{x:cx+Math.cos(a)*R,y:cy+Math.sin(a)*R}))})}
 else if(sl.t.kind==='hero')btns.push({k:'info',label:LL(HERO.name),x:sl.x,y:sl.y-52,color:'#3a7fc1',cost:null});
 else{const D=TOWERS[sl.t.kind];if(sl.t.lv<2)btns.push({k:'up',desc:D.fx?LL(D.fx[sl.t.lv+1]):'',label:L('강화','强化'),cost:D.cost[sl.t.lv+1],x:sl.x-34,y:sl.y-46,color:'#3c8d4f'});else if(sl.t.lv===2){for(const [br,dx,dy] of [['a',-60,-40],['b',0,-78]]){const Bd=BR[sl.t.kind][br];btns.push({k:'br',br,desc:LL(Bd.d),label:LL(Bd.n),cost:Bd.cost,x:sl.x+dx,y:sl.y+dy,color:'#8a5a1f'})}}
  else btns.push({k:'max',label:sl.t.br?LL(BR[sl.t.kind][sl.t.br].n):L('최대','满级'),cost:null,x:sl.x-34,y:sl.y-46,color:'#555'});
  btns.push({k:'sell',label:L('판매','出售'),cost:-Math.floor(sl.t.spent*SELL),x:sl.x+(sl.t.lv===2?60:34),y:sl.y-(sl.t.lv===2?40:46),color:'#8a3b3b'});
  if(sl.t.max!=null&&sl.t.hp<sl.t.max)btns.push({k:'repair',label:L('수리','修理'),cost:repairCost(sl.t),x:sl.x,y:sl.y-(sl.t.lv===2?140:96),color:'#2f5f8a'})}
 const v=camView();for(const b of btns){b.x=Math.max(CAM.x+28,Math.min(CAM.x+v.w-28,b.x));b.y=Math.max(CAM.y+28,Math.min(CAM.y+v.h-36,b.y))}return btns}
function repairCost(t){return Math.max(5,Math.ceil((1-t.hp/t.max)*t.spent*.4))}
function uiButtons(){const n=B.S.waves.length,b=[];let label,sub='';
 if(!B.started)label=L('전투 시작','开始战斗');else if(B.wave<n&&B.nextT!=null){label=L('다음 웨이브','下一波');sub='+'+Math.ceil(B.nextT)+L(' 엽전',' 铜钱')}else if(B.wave<n)label=L('진행 중','进行中');else label=L('마지막 웨이브','最后一波');
 b.push({id:'wave',x:8,y:BOT+10,w:100,h:56,label,sub,on:!B.started||(B.wave<n&&B.nextT!=null)});
 for(const [k,x] of [['fire',114],['reinf',192]]){const cd=B.cd[k];b.push({id:k,x,y:BOT+10,w:74,h:56,label:LL(SK[k].name),sub:B.aim===k?L('전장을 누르세요','点击战场'):cd>0?Math.ceil(cd)+L('초','秒'):L('준비됨','就绪'),on:cd<=0})}
 b.push({id:'speed',x:274,y:BOT+10,w:38,h:56,label:'x'+speed,on:true});b.push({id:'menu',x:316,y:BOT+10,w:38,h:56,label:'Ⅱ',on:true});return b}
function drawNight(bh){g.save();g.globalCompositeOperation='multiply';g.fillStyle='rgb(78,96,170)';g.fillRect(0,TOP,VW,bh);g.restore();const t=performance.now()/1000;
 for(const [x,y,r] of [[40,TOP+20,70],[180,TOP+10,90],[320,TOP+30,70],[300,TOP+300,50],[50,TOP+380,50]]){const f=.8+Math.sin(t*7+x)*.1+Math.sin(t*13+y)*.05,gr=g.createRadialGradient(x,y,2,x,y,r*f);gr.addColorStop(0,'rgba(255,150,60,.42)');gr.addColorStop(1,'rgba(255,120,40,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2)}}
function drawBattle(dt){
 g.save();if(shakeT>0)g.translate((Math.random()-.5)*shakeT*30,(Math.random()-.5)*shakeT*30);
 g.beginPath();g.rect(0,TOP,VW,BOT-TOP);g.clip();g.fillStyle='#2e3a22';g.fillRect(0,TOP,VW,BOT-TOP);g.translate(0,TOP);g.scale(CAM.z,CAM.z);g.translate(-CAM.x,-CAM.y);
 // 땅·길
 const bgi=imgs[B.S.bg];if(bgi){const bh=VW*bgi.height/bgi.width;g.drawImage(bgi,0,TOP,VW,bh)}
 else{const gp=pat('tile_grass');if(gp){g.save();g.beginPath();g.rect(0,TOP,VW,BOT-TOP);g.clip();g.scale(.5,.5);g.fillStyle=gp;g.fillRect(0,TOP*2,VW*2,(BOT-TOP)*2);g.restore()}
 else{g.fillStyle='#3d5a32';g.fillRect(0,TOP,VW,BOT-TOP);g.fillStyle='rgba(255,255,255,.04)';for(let i=0;i<60;i++){const x=(i*97)%VW,y=TOP+((i*53)%(BOT-TOP));g.fillRect(x,y,2,2)}}
 g.lineCap='round';g.lineJoin='round';g.strokeStyle='rgba(43,33,24,.55)';g.lineWidth=36;g.beginPath();B.S.path.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.stroke();
 const rp=pat('tile_road');if(rp){g.save();g.scale(.5,.5);g.strokeStyle=rp;g.lineWidth=58;g.beginPath();B.S.path.forEach((p,i)=>i?g.lineTo(p[0]*2,p[1]*2):g.moveTo(p[0]*2,p[1]*2));g.stroke();g.restore()}
 else{g.strokeStyle='#a88d5f';g.lineWidth=28;g.stroke()}}
 if(B.S.night)drawNight(bgi?VW*bgi.height/bgi.width:BOT);
 const e0=B.S.path[B.S.path.length-1];if(B.skillT>0){g.fillStyle='rgba(90,160,216,.35)';g.beginPath();g.ellipse(e0[0],BOT-14,70,22,0,0,TAU);g.fill()}
 if(!spriteB('gate',e0[0],BOT+4,124)){rr(e0[0]-40,BOT-26,80,26,4,B.skillT>0?'#5aa0d8':'#6b4a2e','#2a1d12');txt(L('성문','城门'),e0[0],BOT-13,12,'#f2e6c9','center','800')}
 if(B.H&&!B.H.dead){const h=B.H;g.beginPath();g.ellipse(h.x,h.y+4,HERO.aura,HERO.aura*.62,0,0,TAU);g.fillStyle='rgba(90,160,216,.07)';g.fill();g.strokeStyle='rgba(140,200,250,.28)';g.lineWidth=1.2;g.setLineDash([5,5]);g.stroke();g.setLineDash([]);
  if(h.moving){g.strokeStyle='rgba(255,230,150,.8)';g.lineWidth=1.5;g.beginPath();g.ellipse(h.tx,h.ty+4,10,5,0,0,TAU);g.stroke();g.fillStyle='#d33';g.fillRect(h.tx-.8,h.ty-14,1.6,18);g.beginPath();g.moveTo(h.tx+.8,h.ty-14);g.lineTo(h.tx+9,h.ty-11);g.lineTo(h.tx+.8,h.ty-8);g.fill()}}
 B.slots.forEach((s,i)=>{
  if(!s.t){if(spriteB('slot_base',s.x,s.y+9,33,false)){if(popup&&popup.slot===i){g.strokeStyle='rgba(255,230,150,.9)';g.lineWidth=2;g.beginPath();g.ellipse(s.x,s.y+2,19,9,0,0,TAU);g.stroke()}return}
   const sel=popup&&popup.slot===i;g.fillStyle='rgba(60,40,20,.35)';g.beginPath();g.ellipse(s.x,s.y+3,17,9,0,0,TAU);g.fill();g.fillStyle=sel?'#c9a56a':'#9c7d4f';g.beginPath();g.ellipse(s.x,s.y,15,7.5,0,0,TAU);g.fill();g.strokeStyle=sel?'#ffe08a':'rgba(50,32,16,.8)';g.lineWidth=sel?2:1.2;g.stroke();
   g.fillStyle='rgba(255,240,200,.35)';g.beginPath();g.ellipse(s.x-3,s.y-2,8,3,0,0,TAU);g.fill();g.strokeStyle=sel?'#ffe08a':'rgba(255,236,190,.75)';g.lineWidth=1.6;g.beginPath();g.moveTo(s.x-4,s.y);g.lineTo(s.x+4,s.y);g.moveTo(s.x,s.y-3.5);g.lineTo(s.x,s.y+3.5);g.stroke();return}
  if(s.t.kind==='hero'){drawHero(s);return}
  const D=TOWERS[s.t.kind];if(popup&&popup.slot===i){g.beginPath();if(s.t.kind==='militia'&&s.t.rally)g.arc(s.t.rally.x,s.t.rally.y,D.range,0,TAU);else if(s.t.kind!=='militia')g.arc(s.x,s.y,towerD(s.t).range[s.t.lv],0,TAU);g.fillStyle='rgba(255,255,255,.08)';g.fill()}
  drawTower(s);const t=s.t;
  if(t.down){g.save();g.globalAlpha=.55+.15*Math.sin(frame*8);g.fillStyle='#ff7a2a';g.beginPath();g.ellipse(s.x,s.y-8,12,16,0,0,TAU);g.fill();g.restore();if(Math.sin(frame*4)>-.3)txt(L('수리','修理'),s.x,s.y-34,10,'#ffd0a0','center','900')}
  if(t.max!=null&&t.hp<t.max){const w=30,y=s.y+22;g.fillStyle='#200';g.fillRect(s.x-w/2,y,w,3.5);g.fillStyle=t.hp/t.max>.4?'#6fd06f':'#e85a3a';g.fillRect(s.x-w/2,y,w*t.hp/t.max,3.5);if(t.hitT>0){g.save();g.globalAlpha=t.hitT*2;g.fillStyle='#fff';g.beginPath();g.arc(s.x,s.y,20,0,TAU);g.fill();g.restore()}}});
 B.slots.forEach(s=>{if(s.t&&s.t.men)for(const m of s.t.men){if(m.dead)continue;const fl=m.target?m.target.x>m.x:m.face===1;if(imgs.unit_militia_walk){const lv=s.t.lv;m.guard=towerD(s.t).guard[lv];drawMan('unit_militia_walk',m,27+lv*2.5,fl);if(lv>0){const [ldx]=lunge(m.atkA,.24,fl?1:-1,7),bx=m.x+ldx+(fl?-5:5),by=m.y-18-lv;g.strokeStyle='#3a2a18';g.lineWidth=1;g.beginPath();g.moveTo(bx,by+12);g.lineTo(bx,by-4);g.stroke();g.fillStyle=lv===1?'#3f7fd0':'#d8342a';g.beginPath();g.moveTo(bx,by-4);g.lineTo(bx+(fl?-7:7),by-1);g.lineTo(bx,by+2);g.closePath();g.fill();if(lv>=2){g.fillStyle=lv===3?'#fff':'#ffd34d';g.beginPath();g.arc(bx,by-5,1.6,0,TAU);g.fill();g.strokeStyle='rgba(255,215,90,.8)';g.lineWidth=1.2;g.beginPath();g.ellipse(m.x,m.y+6,8,3,0,0,TAU);g.stroke()}}unitBar(m,towerD(s.t).hp[s.t.lv]*upMul('militia',.12),m.x,m.y-22,14,'#8fe08f');continue}if(spriteB('unit_militia',m.x,m.y+6,26,fl))continue;g.beginPath();g.arc(m.x,m.y,5,0,TAU);g.fillStyle='#f0c070';g.fill();g.strokeStyle='#3a2a10';g.lineWidth=1.5;g.stroke()}});
 for(const c of B.carts){const fl=c.face===1,x=c.x,y=c.y;g.save();g.translate(x,y);g.scale(fl?-1.35:1.35,1.35);g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(0,9,15,4,0,0,TAU);g.fill();
  g.fillStyle='#6b4423';g.fillRect(8,-2,12,2.5);rr(-12,-8,22,11,2,c.hitT>0?'#fff':'#9a6a38','#3a2410',1.2);g.fillStyle='#e8dcc0';g.beginPath();g.arc(-6,-11,5,0,TAU);g.fill();g.fillStyle='#7d93b5';g.beginPath();g.arc(1,-12,5.5,0,TAU);g.fill();g.fillStyle='#c9a070';g.beginPath();g.arc(6,-9,4,0,TAU);g.fill();
  for(const wx of [-8,6]){g.fillStyle='#4a2f18';g.beginPath();g.arc(wx,4,4.5,0,TAU);g.fill();g.strokeStyle='#c9a070';g.lineWidth=1;g.beginPath();g.arc(wx,4,2,0,TAU);g.stroke()}
  g.fillStyle='#f0d8b0';g.beginPath();g.arc(16,-8,3.2,0,TAU);g.fill();g.fillStyle='#e8e0d0';g.fillRect(13.5,-5,5,9);g.restore();unitBar(c,c.max,x,y-30,26,'#ffd27a');if(c.hp>=c.max-.5){g.fillStyle='#ffd27a';g.fillRect(x-13,y-30,26,3)}}
 for(const m of B.reinf){const fl=m.target?m.target.x>m.x:m.face===1,sz=27*(1+(m.pop>0?m.pop:0));g.save();if(m.life<3)g.globalAlpha=.4+.6*Math.abs(Math.sin(frame*8));if(!drawMan('unit_militia_walk',m,sz,fl)){g.fillStyle='#f0c070';g.beginPath();g.arc(m.x,m.y,5,0,TAU);g.fill()}g.restore();unitBar(m,m.max,m.x,m.y-20,16,'#ffd27a')}
 drawFieldHero();
 for(const f of B.fx)if(f.crater){g.globalAlpha=Math.min(.5,f.t);g.fillStyle='#3a2a18';g.beginPath();g.ellipse(f.x,f.y+2,f.r,f.r*.45,0,0,TAU);g.fill();g.globalAlpha=1}
 for(const c2 of B.corpses)drawCorpse(c2);
 for(const e of B.enemies){drawEnemy(e);const hy=imgs['enemy_'+(e.E.spr||e.type)]?e.y+e.E.r*.9-ESZ[e.type]-3:e.y-e.E.r-7;const bw=e.E.r*2+4;g.fillStyle='#300';g.fillRect(e.x-bw/2,hy,bw,3);g.fillStyle='#e33';g.fillRect(e.x-bw/2,hy,bw*Math.max(0,e.hp/e.max),3);if(e.E.boss||e.E.mid)txt(LL(e.E.name),e.x,hy-9,11,'#ffb0b0','center','800');if(e.E.siege&&!imgs.atk_c){const px=e.x+(e.face===1?8:-8),py=e.y-4;g.fillStyle='#5a3a20';g.beginPath();g.arc(px,py,4,0,TAU);g.fill();g.strokeStyle='#1a0f06';g.lineWidth=1;g.stroke();g.fillStyle='#ff8a3a';g.beginPath();g.arc(px,py-5,2.6+Math.sin(frame*20)*.8,0,TAU);g.fill();g.fillStyle='#ffe07a';g.beginPath();g.arc(px,py-5,1.2,0,TAU);g.fill()}}
 for(const p of B.proj)if(p.t>=0)drawProj(p);
 for(const n of B.nums){g.globalAlpha=Math.min(1,n.t*3);g.save();g.font='900 9px '+FONT;g.textAlign='center';g.lineWidth=2.5;g.strokeStyle='rgba(30,15,5,.85)';g.strokeText(n.v,n.x,n.y);g.fillStyle=n.c;g.fillText(n.v,n.x,n.y);g.restore();g.globalAlpha=1}
 for(const e of B.enemies)if(e.stun>0){for(let k=0;k<3;k++){const a=frame*6+k*2.1;g.fillStyle='#ffe07a';g.beginPath();g.arc(e.x+Math.cos(a)*7,e.y-24+Math.sin(a)*2.5,1.6,0,TAU);g.fill()}}
 for(const bm of B.bombs){const pl=.5+.5*Math.sin(frame*30);g.fillStyle='#2a2420';g.beginPath();g.arc(bm.x,bm.y,5,0,TAU);g.fill();g.fillStyle='rgba(255,'+(120+pl*100|0)+',60,.9)';g.beginPath();g.arc(bm.x+3,bm.y-4,1.5+pl*1.5,0,TAU);g.fill()}
 for(const p of B.eproj){if(p.kind==='bullet'){g.strokeStyle='rgba(255,240,190,.9)';g.lineWidth=1.6;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(p.x-(p.tx-p.sx)*.05,p.y-(p.ty-p.sy)*.05);g.stroke()}
  else{const r=p.kind==='smash'?7:4;g.fillStyle=p.kind==='smash'?'#2a2a2a':'#5a3a20';g.beginPath();g.arc(p.x,p.y,r,0,TAU);g.fill();g.fillStyle='#ff9a3a';g.beginPath();g.arc(p.x,p.y-r,r*.7,0,TAU);g.fill()}}
 for(const q of B.parts){const a=Math.max(0,q.life/q.max);g.globalAlpha=q.kind==='smoke'?a*.8:Math.min(1,a*1.5);g.fillStyle=q.col;g.beginPath();g.arc(q.x,q.y,q.size*(q.kind==='spark'?a:1),0,TAU);g.fill()}g.globalAlpha=1;
 for(const f of B.fx){if(f.crater)continue;g.globalAlpha=Math.max(0,f.t*3);g.beginPath();g.arc(f.x,f.y,f.ring?f.r*(1-f.t*2):f.r+(.3-f.t)*30,0,TAU);g.strokeStyle=f.ring?'#ffcf70':(f.c||'#fff');g.lineWidth=f.ring?3:2;g.stroke();g.globalAlpha=1}
 for(const tp of B.taps){const a=tp.t/.45;g.globalAlpha=Math.max(0,Math.min(1,a));g.strokeStyle=tp.c;g.lineWidth=2.5;g.beginPath();g.ellipse(tp.x,tp.y+4,22*(1-a)+6,(22*(1-a)+6)*.5,0,0,TAU);g.stroke();g.globalAlpha=1}
 for(const b of popupButtons())drawPopBtn(b);
 g.restore();
 drawEdgeArrows();
 if(B.aim){g.fillStyle=B.aim==='fire'?'rgba(255,110,40,.10)':'rgba(255,210,120,.08)';g.fillRect(0,TOP,VW,BOT-TOP);rr(14,TOP+8,VW-76,26,10,'rgba(20,14,10,.85)',B.aim==='fire'?'#ff9a4a':'#ffd27a',1.5);txt(B.aim==='fire'?L('불화살을 떨굴 곳을 누르세요','点击要落下火箭的位置'):L('의병을 부를 곳을 누르세요','点击要召唤义兵的位置'),14+(VW-76)/2,TOP+21,11.5,'#f7ecd2','center','800')}
 if(!B.result){const zx=VW-24,zy=TOP+20;if(imgs.icon_zoom){icon('zoom',zx,zy,30);g.fillStyle='#1d1812';g.beginPath();g.arc(zx+9,zy+9,7,0,TAU);g.fill();txt(CAM.zoomed?'−':'+',zx+9,zy+9,12,'#ffe08a','center','900')}else{rr(zx-17,zy-14,34,28,8,'rgba(20,14,10,.75)','#c8a050',1);txt(CAM.zoomed?'⊖':'⊕',zx,zy,15,'#f2e6c9','center','900')}}
 // HUD
 g.fillStyle='#1d1812';g.fillRect(0,0,VW,TOP);paper(0,0,VW,TOP,0,.18);g.fillStyle='#6b4a2e';g.fillRect(0,TOP-2,VW,2);
 if(icon('heart',18,TOP/2,22))txt(''+B.lives,32,TOP/2,16,'#ff8a80','left','800');else txt('♥ '+B.lives,12,TOP/2,16,'#ff7070','left','800');
 if(icon('coin',96,TOP/2,24))txt(''+B.gold,111,TOP/2,15,'#ffd34d','left','800');if((B.supplyUsed||0)<SUPPLY_MAX&&!B.result){const gx=86,gy=TOP/2+8;g.fillStyle='#3c7d43';g.beginPath();g.arc(gx,gy,6,0,TAU);g.fill();g.strokeStyle='#a8f0b0';g.lineWidth=1.2;g.stroke();txt('+',gx,gy+.5,10,'#fff','center','900')}else txt(L('엽전 ','铜钱 ')+B.gold,80,TOP/2,15,'#ffd34d','left','800');txt(L('웨이브 ','敌波 ')+Math.min(B.wave,B.S.waves.length)+'/'+B.S.waves.length,VW-10,TOP/2,13,'#e8dcc0','right','700');
 for(const c of B.coins){const k=Math.min(1,c.t/.55),e2=k*k,[c0x,c0y]=w2s(c.x,c.y),x=c0x+(96-c0x)*e2,y=c0y+(TOP/2-c0y)*e2-Math.sin(k*Math.PI)*40;if(!icon('coin',x,y,14-k*3)){g.fillStyle='#ffd34d';g.beginPath();g.arc(x,y,4,0,TAU);g.fill()}}
 if(B.goldPulse>0){g.save();g.globalAlpha=B.goldPulse*5;g.fillStyle='#ffe08a';g.beginPath();g.arc(96,TOP/2,15,0,TAU);g.fill();g.restore()}
 drawHeroBadge();if(B.S.carts){txt(L('수레 ','车 ')+B.cartsSafe+'/'+B.S.carts.length,232,TOP/2,11,'#ffd27a','left','800')}
 g.fillStyle='#1d1812';g.fillRect(0,BOT,VW,VH-BOT);paper(0,BOT,VW,VH-BOT,0,.16);g.fillStyle='#6b4a2e';g.fillRect(0,BOT,VW,2);
 for(const b of uiButtons()){rr(b.x,b.y,b.w,b.h,10,b.on?(b.id==='fire'?'#8a3a1e':b.id==='reinf'?'#2f5f8a':b.id==='wave'?'#7a4b1f':'#3a3530'):'#2a2723','#000');
  if(SK[b.id]&&B.cd[b.id]>0){g.save();g.beginPath();g.rect(b.x,b.y,b.w,b.h);g.clip();g.fillStyle='rgba(0,0,0,.45)';const fr=B.cd[b.id]/skCd(b.id),cx=b.x+b.w/2,cy=b.y+b.h/2;g.beginPath();g.moveTo(cx,cy);g.arc(cx,cy,b.w,-Math.PI/2,-Math.PI/2+TAU*fr);g.closePath();g.fill();g.restore()}
  if(B.aim===b.id||(SK[b.id]&&b.on)){g.strokeStyle=B.aim===b.id?'rgba(255,230,140,'+(.6+.4*Math.sin(frame*12))+')':'rgba(160,215,255,'+(.5+.4*Math.sin(frame*10))+')';g.lineWidth=3;rr(b.x-2,b.y-2,b.w+4,b.h+4,12,null,g.strokeStyle,3)}
  paper(b.x,b.y,b.w,b.h,10,.2);
  let ix=0;if(b.id==='wave'&&imgs.icon_drum){g.globalAlpha=b.on?1:.5;icon('drum',b.x+20,b.y+b.h/2,32);g.globalAlpha=1;ix=17}
  if(SK[b.id]){g.save();g.globalAlpha=b.on?1:.5;const im=b.id==='fire'?'tower_rocket_1':'unit_militia';spriteB(im,b.x+b.w/2,b.y+34,b.id==='fire'?30:28,false);g.restore();txt(b.label,b.x+b.w/2,b.y+43,LANG==='zh'?10:9.5,'#f2e6c9','center','800');txt(b.sub,b.x+b.w/2,b.y+53,8.5,B.aim===b.id?'#ffe08a':b.on?'#bcf0bc':'#d0c0a0','center','700');continue}
  if(b.id==='speed'&&imgs.icon_fast){g.globalAlpha=speed===2?1:.75;icon('fast',b.x+b.w/2,b.y+22,30);g.globalAlpha=1;txt('x'+speed,b.x+b.w/2,b.y+44,11,speed===2?'#ffe08a':'#f2e6c9','center','900');continue}
  if(b.id==='menu'&&imgs.icon_pause){icon('pause',b.x+b.w/2,b.y+b.h/2,32);continue}
  if(b.sub){txt(b.label,b.x+b.w/2+ix,b.y+20,b.w<125&&ix?12.5:14,'#f2e6c9','center','800');txt(b.sub,b.x+b.w/2+ix,b.y+40,ix?10:11,b.id==='wave'?'#ffd34d':'#bcd8f0','center','600')}else txt(b.label,b.x+b.w/2,b.y+b.h/2,b.w<60?15:14,b.on?'#f2e6c9':'#777','center','800')}
 const inf=nextWaveInfo();if(inf&&(B.nextT!=null||!B.started)){const w=B.S.waves[B.wave],hb=w.some(x=>x[0]==='b'||x[0]==='k'),hh=w.some(x=>x[0]==='h');rr(8,TOP+6,VW-58,22,8,'rgba(20,18,15,.8)');txt((hb?L('⚠ 대장 출현  ','⚠ 大将出现  '):hh?L('⚠ 기마대  ','⚠ 骑兵  '):L('다음: ','下一波：'))+inf,8+(VW-58)/2,TOP+17,10.5,hb?'#ff8080':hh?'#ffd34d':'#e8dcc0','center','700')}
 if(B.banner&&B.banner.t>0){g.globalAlpha=Math.min(1,B.banner.t*2);rr(60,TOP+40,VW-120,36,10,'rgba(20,18,15,.85)');txt(B.banner.txt,VW/2,TOP+58,14,'#f2e6c9','center','800');g.globalAlpha=1}
 if(B.bossWarn>0){const a=.35+.25*Math.sin(B.bossWarn*12);g.strokeStyle='rgba(220,40,40,'+a+')';g.lineWidth=10;g.strokeRect(5,TOP+5,VW-10,BOT-TOP-10);txt(L('북소리가 울린다… 대장이 온다!','战鼓响起……大将来了！'),VW/2,TOP+100,14,'#ff9090','center','900')}
 if(B.leakFlash>0){g.fillStyle='rgba(200,30,30,'+(B.leakFlash*.5)+')';g.fillRect(0,BOT-40,VW,40)}
 if(B.phase==='play'&&!paused)tutorialHint();
 if(B.choice&&B.phase==='play')drawChoice();if(B.phase==='story')drawStory(dt);if(B.phase==='intro')drawIntro();if(paused)drawPause()}
function tutorialHint(){if(popup)return;if(!save.tips.tutRep){const d=B.slots.find(s=>s.t&&s.t.down);if(d){const [fx,fy]=w2s(d.x,d.y);drawFinger(fx,fy,L('불탄 타워를 눌러 수리','点击烧毁的防御塔修理'));return}}
 if(B.i!==0)return;
 if(!save.tips.tut1){const s=B.slots.slice().sort((a,b)=>Math.abs(a.along-B.P.len*.45)-Math.abs(b.along-B.P.len*.45)).find(x=>!x.t);if(s){const [fx,fy]=w2s(s.x,s.y);drawFinger(fx,fy,L('빈자리를 눌러 타워 세우기','点击空位建造防御塔'));return}}
 if(save.tips.tut1&&!save.tips.tut2&&!B.started){drawFinger(74,BOT+30,L('준비되면 전투 시작!','准备好就开战！'));return}
 if(!save.tips.tut3&&B.wave>=1&&B.H&&!B.H.dead&&B.enemies.length){const e=B.enemies.reduce((a,b)=>a.d>b.d?a:b);const p=posAt(B.P,Math.min(B.P.len-40,e.d+50));const [fx,fy]=w2s(p.x,p.y);drawFinger(fx,fy,L('땅을 눌러 장수 보내기','点击地面派遣将领'));return}
 if(save.tips.tut3&&!save.tips.tut4&&B.cd.fire<=0&&!B.aim&&B.enemies.length>=4)drawFinger(151,BOT+30,L('화차로 한 번에!','用火车一网打尽！'))}
function drawStory(dt){const cut=B.S.story[B.storyI];B.storyT+=dt;g.fillStyle='#0d0b08';g.fillRect(0,0,VW,VH);const a=Math.min(1,B.storyT*3);g.globalAlpha=a;
 const im=imgs['story_'+cut[0]];const iw=VW-24,ih=iw*.75,iy=130;if(im){g.drawImage(im,12,iy,iw,ih);g.strokeStyle='#8a7650';g.lineWidth=2;g.strokeRect(12,iy,iw,ih)}
 else{rr(12,iy,iw,ih,6,'#2b261e','#8a7650',1.5);txt(LL(B.S.name),VW/2,iy+ih/2,22,'#6b5a40','center','900')}
 txt(LL(B.S.year)+' · '+LL(B.S.name),VW/2,104,12,'#b9ab8c','center','700');
 rr(16,iy+ih+16,VW-32,96,12,'#2b261e','#8a7650',1.5);paper(16,iy+ih+16,VW-32,96,12,.15);wrap(LL([cut[1],cut[2]]),VW/2,iy+ih+48,VW-70,14,'#f2e6c9',22);g.globalAlpha=1;
 for(let k=0;k<B.S.story.length;k++){g.fillStyle=k===B.storyI?'#ffd34d':'#5a4f3a';g.beginPath();g.arc(VW/2-(B.S.story.length-1)*8+k*16,iy+ih+130,4,0,TAU);g.fill()}
 if(Math.sin(frame*5)>-.4)txt(L('화면을 눌러 계속 ▶','点击屏幕继续 ▶'),VW/2,600,12,'#b9ab8c');rr(282,24,64,28,8,'#151a28d8','#8a8070',1);txt(L('건너뛰기','跳过'),314,38,11,'#fff','center','700')}
function choiceRect(i){return {x:22,y:206+i*92,w:316,h:82}}
function drawChoice(){const C=B.choice,a=Math.min(1,C.t*4);g.fillStyle='rgba(8,6,4,'+(.78*a)+')';g.fillRect(0,0,VW,VH);g.globalAlpha=a;
 icon(HERO.ic,180,128,64);txt(L('장수 Lv','将领 Lv')+B.heroLv+'!',180,172,22,'#ffd34d','center','900');txt(L('기술 하나를 고르세요','选择一项技能'),180,192,11,'#e8dcc0','center','600');
 C.opts.forEach((k,i)=>{const r=choiceRect(i),P=PERKS[k],dy=(1-a)*30*(i+1);rr(r.x,r.y+dy,r.w,r.h,12,'#2f2a22','#c8a050',2);paper(r.x,r.y+dy,r.w,r.h,12,.18);
  txt(LL(P.n),r.x+18,r.y+dy+28,17,'#ffe2a0','left','900');txt(LL(P.d),r.x+18,r.y+dy+56,11.5,'#f2e6c9','left','600');txt('▶',r.x+r.w-22,r.y+dy+r.h/2,16,'#c8a050','center','900')});
 if(B.perks.length){txt(L('보유: ','已有：')+B.perks.map(k=>LL(PERKS[k].n)).join(' · '),180,506,10,'#a89a7c','center','600')}g.globalAlpha=1}
function storyNext(skip){if(skip||B.storyI>=B.S.story.length-1){B.phase=B.i===0&&!save.stars[0]?'play':'intro';save.seen=save.seen||[];if(!save.seen.includes(B.i))save.seen.push(B.i);persist();return}B.storyI++;B.storyT=0;AudioFx.cue('ui')}
function drawIntro(){g.fillStyle='rgba(0,0,0,.72)';g.fillRect(0,0,VW,VH);rr(24,160,VW-48,320,16,'#2b261e','#8a7650',1.5);
 txt(LL(B.S.year),VW/2,204,12,'#b9ab8c');txt(LL(B.S.name),VW/2,238,28,'#f2e6c9','center','900');wrap(LL(B.S.intro),VW/2,284,VW-90,13,'#e8dcc0',20);wrap(L('팁: ','提示：')+LL(B.S.tip),VW/2,350,VW-90,11,'#ffd34d',17);
 if(B.S.mission)wrap(LL(B.S.mission),VW/2,400,VW-90,12,'#ffb070',17);else wrap('📜 '+LL(HIST_TIPS[save.plays%HIST_TIPS.length]),VW/2,396,VW-90,10.5,'#a8c8e0',16);
 if(Math.sin(frame*5)>-.4)txt(L('화면을 눌러 시작','点击屏幕开始'),VW/2,456,12,'#b9ab8c')}
function drawPause(){g.fillStyle='rgba(0,0,0,.72)';g.fillRect(0,0,VW,VH);txt(L('일시정지','暂停'),VW/2,200,24,'#f2e6c9','center','900');
 button(80,240,200,46,L('계속','继续'),'green',15);button(80,296,200,46,L('다시 시작','重新开始'),'gold',15);button(80,352,200,46,L('전투 선택','选择战斗'),'gray',15);
 button(80,420,96,40,L('음악 ','音乐 ')+onoff(Music.on),'gray',11);button(184,420,96,40,L('효과음 ','音效 ')+onoff(AudioFx.enabled),'gray',11);button(80,468,200,40,L('안내서','指南'),'blue',12)}
function lunge(t,dur,dir,dist){if(!(t>0))return [0,0];const k=1-t/dur;if(k<.35){const a=k/.35;return [-dist*.35*a*dir,-.3*a*dir]}const a=(k-.35)/.65,p=Math.sin(Math.min(1,a*1.6)*Math.PI*.5)*(1-a);return [dist*p*dir,.35*p*dir]}
function drawMan(n,m,sz,fl,dur){const fa=atkFrame(m.atkA,dur||.24),fight=m.target&&Math.hypot(m.target.x-m.x,m.target.y-m.y)<16;
 if(imgs.atk_m&&(fa>=0||fight)){const f=fa>=0?fa:0,lx=(f===2?3:0)*(fl?1:-1),d=()=>animB('atk_m',f,m.x+lx,m.y+6,sz*.97,fl);d();if(m.hitT>0){g.save();g.globalAlpha=.55;g.globalCompositeOperation='lighter';d();g.restore()}return true}
 const [dx,rot]=lunge(m.atkA,dur||.24,fl?1:-1,7);g.save();g.translate(m.x+dx,m.y+6);g.rotate(rot);const fi=Math.floor((m.dist||0)*.25)%8;const ok=stripB(n,8,fi,0,0,sz,fl);if(ok&&m.hitT>0){g.globalAlpha=.55;g.globalCompositeOperation='lighter';stripB(n,8,fi,0,0,sz,fl)}g.restore();return ok}
function drawEdgeArrows(){const v=camView();for(const e of B.enemies){if(e.dead)continue;const inX=e.x>=CAM.x&&e.x<=CAM.x+v.w,inY=e.y>=CAM.y&&e.y<=CAM.y+v.h;if(inX&&inY)continue;
  let [sx,sy]=w2s(e.x,e.y);sx=Math.max(14,Math.min(VW-14,sx));sy=Math.max(TOP+14,Math.min(BOT-14,sy));const [cx,cy]=w2s(CAM.x+v.w/2,CAM.y+v.h/2),a=Math.atan2(sy-cy,sx-cx);
  g.save();g.translate(sx,sy);g.rotate(a);g.globalAlpha=.85;g.fillStyle=e.E.boss?'#ff3030':'#e85a3a';g.beginPath();g.moveTo(9,0);g.lineTo(-6,-6);g.lineTo(-6,6);g.closePath();g.fill();g.strokeStyle='#300';g.lineWidth=1;g.stroke();g.restore()}}
function unitBar(u,max,x,y,w,col){if(u.hp>=max-.5)return;g.fillStyle='#200';g.fillRect(x-w/2,y,w,3);g.fillStyle=col;g.fillRect(x-w/2,y,w*Math.max(0,u.hp/max),3)}
function drawFieldHero(){const H=B.H;if(!H)return;
 if(H.dead){const h=heroHome();g.save();g.globalAlpha=.6;g.fillStyle='rgba(0,0,0,.4)';g.beginPath();g.ellipse(h.x,h.y+6,12,5,0,0,TAU);g.fill();icon(HERO.ic,h.x,h.y-8,26);g.restore();txt(Math.ceil(H.respawn)+'',h.x,h.y+16,11,'#ffd27a','center','900');return}
 const fl=H.face===1,moving=H.moving||(H.target&&Math.hypot(H.target.x-H.x,H.target.y-H.y)>16);
 const sp=HERO.spr;const draw=()=>{if(H.swing>0&&imgs[sp+'_atk']){const k=1-H.swing/.26,fi=k<.3?0:k<.55?1:k<.8?2:3,lx=(k>.3&&k<.8?6:0)*(fl?1:-1);return animB(sp+'_atk',fi,H.x+lx,H.y+8,HERO.atkH,fl)}
  if(moving&&imgs[sp+'_walk'])return stripB(sp+'_walk',8,Math.floor(H.dist*.2)%8,H.x,H.y+8,HERO.walkH,fl);
  // 공격 동작: 뒤로 젖힘(0~35%) → 앞으로 내지름(35~60%) → 복귀
  let rot=0,lx=0,sq=1;if(H.swing>0){const k=1-H.swing/.26;if(k<.35){const a=k/.35;rot=-.38*a;lx=-3*a}else if(k<.6){const a=(k-.35)/.25;rot=-.38+.85*a;lx=-3+13*a;sq=1+.08*Math.sin(a*Math.PI)}else{const a=(k-.6)/.4;rot=.47*(1-a);lx=10*(1-a)}}
  const dir=fl?1:-1;g.save();g.translate(H.x+lx*dir,H.y+8);g.rotate(dir*rot);g.scale(1/sq,sq);const ok=stripB(sp+'_idle',8,Math.floor(frame*7)%8,0,0,HERO.idleH,fl)||spriteB('hero_kimsimin',0,0,40,fl);g.restore();return ok};
 g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(H.x,H.y+8,11,4,0,0,TAU);g.fill();
 if(!draw()){g.fillStyle='#3a7fc1';g.beginPath();g.arc(H.x,H.y,8,0,TAU);g.fill()}
 if(H.hitT>0){g.save();g.globalAlpha=.5;g.globalCompositeOperation='lighter';draw();g.restore()}
 if(H.swing>0){const k=1-H.swing/.26;if(k>.35&&k<.85){const a=(k-.35)/.5,d=H.swDir||0,cx=H.x+Math.cos(d)*8,cy=H.y-8+Math.sin(d)*6;g.save();g.globalAlpha=1-a;g.lineCap='round';
  g.strokeStyle='#fff6d0';g.lineWidth=5*(1-a)+1;g.beginPath();g.arc(cx,cy,20+a*6,d-1.1+a*.4,d+1.1*a+.2);g.stroke();g.strokeStyle='rgba(255,200,90,.8)';g.lineWidth=2;g.beginPath();g.arc(cx,cy,26+a*6,d-.9+a*.4,d+.9*a+.2);g.stroke();g.restore()}}
 const mx=heroMax();g.fillStyle='#102030';g.fillRect(H.x-14,H.y-34,28,3.5);g.fillStyle='#5ab0f0';g.fillRect(H.x-14,H.y-34,28*Math.max(0,H.hp/mx),3.5);txt(''+B.heroLv,H.x-19,H.y-32.5,8,'#cfe8ff','center','900')}
function drawHeroBadge(){const H=B.H;if(!H)return;const x=170,y=TOP/2;g.save();if(H.dead)g.globalAlpha=.45;icon(HERO.ic,x,y,26);g.restore();
 if(H.dead)txt(Math.ceil(H.respawn)+'',x+20,y,12,'#ff9a8a','left','900');else{const mx=heroMax();g.fillStyle='#102030';g.fillRect(x+15,y-2,36,5);g.fillStyle='#5ab0f0';g.fillRect(x+15,y-2,36*Math.max(0,H.hp/mx),5)}}
// 배치·강화 메뉴 단추: 나무 원판 + 금테 + 그림 + 이름·가격 띠
function drawPopBtn(b){const afford=b.cost==null||b.cost<=B.gold||b.cost<0,r=25,dim=!afford;
 g.save();g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(b.x,b.y+r-2,r*.95,6,0,0,TAU);g.fill();
 const gr=g.createRadialGradient(b.x-6,b.y-8,4,b.x,b.y,r);gr.addColorStop(0,dim?'#4a4540':'#6b4a2e');gr.addColorStop(1,dim?'#2a2725':'#2e1d10');
 if(imgs.btn_frame){if(dim)g.globalAlpha=.55;sprite('btn_frame',b.x,b.y,r*2+6);g.globalAlpha=1;g.beginPath();g.arc(b.x,b.y,r,0,TAU)}else{g.beginPath();g.arc(b.x,b.y,r,0,TAU);g.fillStyle=gr;g.fill();paper(b.x-r,b.y-r,r*2,r*2,r,.18)}
 if(!imgs.btn_frame){g.lineWidth=3;g.strokeStyle=dim?'#6a6258':(b.k==='sell'?'#e08a7a':b.k==='up'?'#9fe0a0':'#e8b84a');g.stroke();g.lineWidth=1;g.strokeStyle='#1a0f06';g.beginPath();g.arc(b.x,b.y,r+1.6,0,TAU);g.stroke()}else if(!dim&&(b.k==='sell'||b.k==='up'||b.k==='repair')){g.lineWidth=2;g.strokeStyle=b.k==='sell'?'#e08a7a':b.k==='up'?'#9fe0a0':'#9fd0ff';g.beginPath();g.arc(b.x,b.y,r+3,0,TAU);g.stroke()}
 g.save();g.beginPath();g.arc(b.x,b.y,imgs.btn_frame?r-5:r-2,0,TAU);g.clip();if(dim)g.globalAlpha=.45;
 let drawn=false;
 if(TOWERS[b.k])drawn=spriteB('tower_'+b.k+'_1',b.x,b.y+r-5,b.k==='rocket'||b.k==='cannon'?44:40,false);
 else if(b.k==='hero'||b.k==='info')drawn=icon('hero',b.x,b.y,46);
 else if(b.k==='up'){const sl=B.slots[popup.slot];drawn=spriteB('tower_'+sl.t.kind+'_'+Math.min(3,sl.t.lv+2),b.x,b.y+r-5,40,false)}
 else if(b.k==='br'){const sl=B.slots[popup.slot];drawn=spriteB('tower_'+sl.t.kind+'_4'+b.br,b.x,b.y+r-4,44,false)}else if(b.k==='max'&&popup&&B.slots[popup.slot].t&&B.slots[popup.slot].t.br){const sl=B.slots[popup.slot];drawn=spriteB('tower_'+sl.t.kind+'_4'+sl.t.br,b.x,b.y+r-4,44,false)}else if(b.k==='sell')drawn=icon('coin',b.x,b.y-2,34);else if(b.k==='repair')drawn=icon('shield',b.x,b.y-2,32);else if(b.k==='max')drawn=icon('star',b.x,b.y-2,32);
 g.restore();
 if(b.k==='up'&&drawn){g.fillStyle='#3c8d4f';g.beginPath();g.moveTo(b.x+r-2,b.y-r+2);g.lineTo(b.x+r+8,b.y-r+14);g.lineTo(b.x+r-12,b.y-r+14);g.closePath();g.fill();g.strokeStyle='#0d2a12';g.lineWidth=1.2;g.stroke()}
 if(!drawn)txt(b.label,b.x,b.y,10.5,'#fff','center','800');
 // 이름·가격 띠
 const name=b.label,cost=b.cost==null?'':b.cost===0?L('무료','免费'):b.cost<0?'+'+(-b.cost):String(b.cost);
 g.font='800 9.5px '+FONT;const w1=g.measureText(name).width;g.font='800 10px '+FONT;const w2=cost?g.measureText(cost).width+(b.cost>0||b.cost<0?13:0):0;const W=Math.max(40,w1+w2+(cost?12:8)),y=b.y+r+5;
 rr(b.x-W/2,y-7,W,15,7,'rgba(24,16,10,.92)',dim?'#5a5248':'#a8823c',1);if(b.desc){g.font='800 9px '+FONT;const dw=g.measureText(b.desc).width+12;rr(b.x-dw/2,y+10,dw,14,7,'rgba(20,50,25,.92)','#6fd06f',1);txt(b.desc,b.x,y+17.5,9,'#c8ffc8','center','800')}
 let x0=b.x-W/2+5;txt(name,x0,y+.5,9.5,'#f2e6c9','left','800');x0+=w1+4;
 if(cost){if(b.cost!==0&&icon('coin',x0+5,y+.5,12))x0+=11;txt(cost,x0,y+.5,10,b.cost===0?'#cfe8ff':dim?'#999':'#ffe08a','left','800')}
 g.restore()}
function drawHero(s){const t=s.t,hp=1+(t.pop>0?t.pop:0);
 if(!stripB('hero_kimsimin_idle',8,Math.floor(frame*7)%8,s.x,s.y+14,54*hp,false)&&!spriteB('hero_kimsimin',s.x,s.y+14,50*hp,false)){g.fillStyle='#24486e';g.beginPath();g.ellipse(s.x,s.y+10,13,5,0,0,TAU);g.fill();rr(s.x-9,s.y-6,18,16,5,'#3a7fc1','#0f2236');
  g.beginPath();g.arc(s.x,s.y-11,7,0,TAU);g.fillStyle='#f1d3b0';g.fill();g.strokeStyle='#0f2236';g.lineWidth=1.5;g.stroke();g.fillStyle='#111';g.beginPath();g.ellipse(s.x,s.y-16,11,3,0,0,TAU);g.fill();g.fillRect(s.x-4,s.y-22,8,6);
  g.strokeStyle='#d33';g.lineWidth=2;g.beginPath();g.moveTo(s.x+11,s.y+8);g.lineTo(s.x+11,s.y-22);g.stroke();g.fillStyle='#d33';g.fillRect(s.x+11,s.y-22,9,7)}
 txt('Lv'+B.heroLv,s.x,s.y+22,10,'#cfe8ff','center','700')}
function drawTower(s){const t=s.t,Lv=t.lv,k=1+(t.pop>0?t.pop*1.2:0);g.save();g.translate(s.x,s.y);g.scale(k,k);
 const tn=Lv===3&&t.br?'tower_'+t.kind+'_4'+t.br:'tower_'+t.kind+'_'+(Lv+1);
 if(imgs[tn]||imgs[tn+'_fire']){const fl=t.ang!=null&&Math.cos(t.ang)>0.2;const rc=t.kind!=='archer'&&t.recoil>0?(fl?-1:1)*t.recoil*8:0;if(Lv===3){const a=t.fa!=null&&t.fa<.12?1.06:1;spriteB(tn,rc,16,72*a,fl&&t.kind!=='archer'&&t.kind!=='militia')}else if(!fireStrip(tn,fireFrame(t),rc,16,54+Lv*5,fl))spriteB(tn,rc,16,54+Lv*5,fl&&t.kind!=='archer');
  for(let q=0;q<=Lv;q++){g.fillStyle='#ffd34d';g.strokeStyle='#2b2118';g.lineWidth=1;g.beginPath();g.arc(-6+q*6,19,2.4,0,TAU);g.fill();g.stroke()}g.restore();return}
 g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(0,12,17,6,0,0,TAU);g.fill();const ol='#2a1d12';
 if(t.kind==='archer'){rr(-11,-6,22,18,3,'#8a5a2b',ol);g.strokeStyle=ol;g.lineWidth=1.5;g.beginPath();g.moveTo(-11,3);g.lineTo(11,3);g.stroke();
  g.fillStyle=['#3f6b3a','#2f5f8a','#a8322a'][Lv];g.beginPath();g.moveTo(-17,-6);g.lineTo(17,-6);g.lineTo(9,-17-Lv*2);g.lineTo(-9,-17-Lv*2);g.closePath();g.fill();g.stroke();g.fillStyle='#f1d3b0';g.beginPath();g.arc(0,-1,3.5,0,TAU);g.fill()}
 else if(t.kind==='militia'){rr(-12,-4,24,16,2,'#7a5530',ol);g.fillStyle='#3a2a18';g.fillRect(-4,3,8,9);g.fillStyle=['#d8b765','#cfa84a','#b98e2c'][Lv];g.beginPath();g.moveTo(-17,-3);g.lineTo(0,-18-Lv*2);g.lineTo(17,-3);g.closePath();g.fill();g.strokeStyle=ol;g.lineWidth=1.5;g.stroke();
  g.strokeStyle='#3a2a18';g.beginPath();g.moveTo(13,-3);g.lineTo(13,-26);g.stroke();g.fillStyle='#f4efe2';g.fillRect(13,-26,12,10);txt('義',19,-21,8,'#a8322a','center','900')}
 else if(t.kind==='rocket'){g.fillStyle='#3a2a18';g.beginPath();g.arc(-9,10,4,0,TAU);g.arc(9,10,4,0,TAU);g.fill();rr(-13,-2,26,10,2,'#8a5a2b',ol);g.save();g.rotate(-.35);rr(-12,-16,24,13,2,'#6d4422',ol);
  const n=3+Lv;for(let r=0;r<2;r++)for(let q=0;q<n;q++){g.fillStyle='#d8402f';g.beginPath();g.arc(-9+q*(18/(n-1)),-12+r*6,1.8,0,TAU);g.fill()}g.restore()}
 else{rr(-12,0,24,10,2,'#6d4422',ol);g.fillStyle='#3a2a18';g.beginPath();g.arc(-8,10,4,0,TAU);g.arc(8,10,4,0,TAU);g.fill();g.save();const a=t.ang==null?-Math.PI/2:t.ang;g.rotate(a);const rc=t.recoil>0?-t.recoil*20:0;
  rr(-4+rc,-4-Lv,20+Lv*3,8+Lv*2,3,['#9a7a3a','#a8843e','#c09040'][Lv],ol);g.fillStyle='#222';g.beginPath();g.arc(16+Lv*3+rc,0,2.5+Lv*.5,0,TAU);g.fill();g.restore()}
 for(let q=0;q<=Lv;q++){g.fillStyle='#ffd34d';g.beginPath();g.arc(-6+q*6,16,2.2,0,TAU);g.fill()}g.restore()}
const ESZ={k:44,s:30,c:30,d:31,g:30,h:40,a:34,b:60,m:27};
function drawProj(p){
 if(p.kind==='ball'){const h=(p.gy-p.y),sc=Math.max(.35,1-h/120),br=4.2+(p.lv||0)*.9;g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(p.gx,p.gy+4,5*sc,2.2*sc,0,0,TAU);g.fill();
  g.fillStyle='#2b2118';g.beginPath();g.arc(p.x,p.y,br,0,TAU);g.fill();g.fillStyle='rgba(255,255,255,.35)';g.beginPath();g.arc(p.x-1.3,p.y-1.3,1.3,0,TAU);g.fill();return}
 const a=Math.atan2(p.y-p.py,p.x-p.px);g.save();g.translate(p.x,p.y);g.rotate(a);
 if(p.kind==='rocket'){g.fillStyle='#ffb54a';g.beginPath();g.arc(-7,0,2.6+Math.random()*1.2,0,TAU);g.fill();g.strokeStyle='#d9c8a0';g.lineWidth=1.4;g.beginPath();g.moveTo(-6,0);g.lineTo(4,0);g.stroke();g.fillStyle='#b5452f';g.fillRect(2,-2,6,4)}
 else{g.strokeStyle=p.kind==='bolt'?'#cfe8ff':'#e9dcc0';g.lineWidth=1.5;g.beginPath();g.moveTo(-8,0);g.lineTo(4,0);g.stroke();g.fillStyle='#4a4038';g.beginPath();g.moveTo(6,0);g.lineTo(2,-2);g.lineTo(2,2);g.closePath();g.fill();
  if(p.big){g.scale(1.5,1.5)}if(p.kind==='arrow'&&p.burn){g.fillStyle='#ff8a3a';g.beginPath();g.arc(5,0,2.4+Math.random(),0,TAU);g.fill()}else if(p.kind==='arrow'&&p.lv>=2){g.fillStyle='rgba(255,220,120,.5)';g.beginPath();g.arc(4,0,2.6,0,TAU);g.fill()}g.strokeStyle=p.kind==='bolt'?'#7fd0ff':'#b5452f';g.lineWidth=1.2;g.beginPath();g.moveTo(-8,-1.8);g.lineTo(-6,0);g.lineTo(-8,1.8);g.stroke()}
 g.restore()}
const DEAD={k:'a',m:'m',s:'s',c:'s',d:'s',g:'g',a:'a',h:'h',b:'b'};
function drawCorpse(c2){if(save.mild){if(!c2.p){c2.p=1;puff(c2.x,c2.y,5,'rgba(190,180,165,.7)',22,.5,5,0,'smoke')}return}const dn='dead_'+DEAD[c2.type],r=c2.E.r,fl=c2.face===1,el=1.3-c2.t;
 if(imgs[dn]&&el>.12){const im=imgs[dn],w=(ESZ[c2.type]||27)*(c2.type==='h'||c2.type==='b'?1.25:1.15),h=w*im.height/im.width;g.save();g.globalAlpha=Math.max(0,Math.min(1,c2.t/.45));
  if(fl){g.translate(c2.x,0);g.scale(-1,1);g.drawImage(im,-w/2,c2.y+r*.9-h,w,h)}else g.drawImage(im,c2.x-w/2,c2.y+r*.9-h,w,h);g.restore();return}
 const k=imgs[dn]?el/.12/3:1-c2.t/.7;g.save();g.globalAlpha=Math.max(0,Math.min(1,c2.t/.4));g.translate(c2.x,c2.y+r*.9);g.rotate((fl?1:-1)*Math.min(1,k*3)*1.25);
 const wn='enemy_'+c2.type+'_walk',wk=WALK[c2.type];if(wk&&imgs[wn])stripB(wn,wk.n,0,0,0,ESZ[c2.type],fl);else if(!spriteB('enemy_'+c2.type,0,0,ESZ[c2.type],fl)){g.fillStyle=c2.E.color;g.beginPath();g.arc(0,-r,r*.8,0,TAU);g.fill()}
 g.restore()}
function atkFrame(t,dur){if(!(t>0))return -1;const k=1-t/dur;return k<.22?0:k<.48?1:k<.8?2:3}
function drawEnemy(e){const E=e.E;if(imgs['atk_'+e.type]){drawEnemy0(e);return}const [ldx,lrot]=lunge(e.atkA,.28,e.face===1?1:-1,E.boss?12:7);if(ldx||lrot){g.save();g.translate(e.x+ldx,e.y);g.rotate(lrot);g.translate(-e.x,-e.y)}const res=drawEnemy0(e);if(ldx||lrot)g.restore();return res}
function drawEnemy0(e){const E=e.E,r=E.r,x=e.x,y=e.y;
 if(e.px!=null&&!e.blocked&&!e.aiming){const dx=x-e.px;if(dx>.05)e.face=1;else if(dx<-.05)e.face=-1}e.px=x;
 const sp=E.spr||e.type,en='enemy_'+sp,wk=WALK[e.type],wn=en+'_walk',hgt=ESZ[e.type]*.97,fl=e.face===1,an='atk_'+e.type;
 if(imgs[an]){const fa=atkFrame(e.atkA,.28);let draw=null;
  if(fa>=0){const lx=(fa===2?4:fa===1?-2:0)*(fl?1:-1);draw=()=>animB(an,fa,x+lx,y+r*.9,hgt,fl)}
  else if(e.blocked||e.aiming||(e.stun>0))draw=()=>animB(an,e.type==='g'&&e.aiming?1:0,x,y+r*.9,hgt,fl);
  else if(imgs['walk_'+e.type]){const n=ANIM['walk_'+e.type][0],fi=Math.floor(e.d*(wk?wk.per:.2))%n;draw=()=>animB('walk_'+e.type,fi,x,y+r*.9,hgt,fl)}
  if(draw){g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.ellipse(x,y+r*.9,hgt*.28,hgt*.08,0,0,TAU);g.fill();draw();if(e.flash>0){g.save();g.globalAlpha=.55;g.globalCompositeOperation='lighter';draw();g.restore()}return}}
 if(wk&&imgs[wn]){const fi=e.blocked||e.aiming?0:Math.floor(e.d*wk.per)%wk.n;const dw=()=>stripB(wn,wk.n,fi,x,y+r*.9,ESZ[e.type],e.face===1);dw();
  if(e.flash>0){g.save();g.globalAlpha=.55;g.globalCompositeOperation='lighter';dw();g.restore()}return}
 if(imgs[en]){spriteB(en,x,y+r*.9,ESZ[e.type],e.face===1);
  if(e.flash>0){g.save();g.globalAlpha=.55;g.globalCompositeOperation='lighter';spriteB(en,x,y+r*.9,ESZ[e.type],e.face===1);g.restore()}return}
 g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(x,y+r*.8,r,r*.35,0,0,TAU);g.fill();const body=e.flash>0?'#fff':E.color;
 if(e.type==='h'){g.fillStyle=e.flash>0?'#fff':'#6b4423';g.beginPath();g.ellipse(x,y+2,r+3,r*.6,0,0,TAU);g.fill();g.strokeStyle='#222';g.lineWidth=1.2;g.stroke()}
 const by=y-(e.type==='h'?4:0);g.beginPath();g.arc(x,by,r*.8,0,TAU);g.fillStyle=body;g.fill();g.strokeStyle=E.boss?'#d33':'#222';g.lineWidth=E.boss?3:1.3;g.stroke();
 const hy=by-r*.7;g.fillStyle=E.boss?'#111':'#3b3b3b';g.beginPath();g.moveTo(x-r,hy+2);g.lineTo(x,hy-r*.5);g.lineTo(x+r,hy+2);g.closePath();g.fill();
 if(E.boss){g.strokeStyle='#d4a017';g.lineWidth=2.5;g.beginPath();g.moveTo(x-6,hy-4);g.lineTo(x-14,hy-16);g.moveTo(x+6,hy-4);g.lineTo(x+14,hy-16);g.stroke()}
 if(e.type==='s'){g.strokeStyle='#ccc';g.lineWidth=1.3;g.beginPath();g.moveTo(x+r,y+r);g.lineTo(x+r+3,y-r-6);g.stroke()}
 if(e.type==='g'){g.strokeStyle='#444';g.lineWidth=2;g.beginPath();g.moveTo(x-2,y+2);g.lineTo(x+r+6,y-3);g.stroke()}
 if(E.armor>=.5&&!E.boss){g.strokeStyle='#ddd';g.lineWidth=1;g.beginPath();g.arc(x,y,r*.55,0,TAU);g.stroke()}}

// ---------------------------------------------------------------- 화면: 승리 · 패배
function clearScreen(){const ci=imgs.story_win;if(ci){cover('story_win','rgba(10,6,4,.35)')}else drawBattle(0);if(B.showHist&&B.endT>1.2){B.showHist=false;openHist(B.i)}const r=B.result;if(!ci){g.fillStyle='rgba(0,0,0,.75)';g.fillRect(0,0,VW,VH)}rr(24,120,312,440,14,ci?'#2b261ed8':'#2b261ef2','#8a7650',1.5);
 txt(L('승리!','胜利！'),180,160,30,'#ffd34d','center','900');const tm=Math.round(B.time);txt((B.chal?L('영웅 도전 · ','英雄挑战 · '):'')+LL(B.S.name)+L(' · 목숨 ',' · 生命 ')+B.lives+L(' · 처치 ',' · 击败 ')+B.kills+' · '+Math.floor(tm/60)+':'+String(tm%60).padStart(2,'0'),180,196,11.5,'#e8dcc0');
 for(let k=0;k<3;k++){const a=Math.min(1,Math.max(0,(B.endT-.3-k*.25)*4));g.save();if(imgs.icon_star){g.globalAlpha=k<r.stars?a:.2;const sc=k<r.stars?1+(1-a)*.6:1;icon('star',130+k*50,250,46*sc)}else{g.globalAlpha=k<r.stars?a:1;txt('★',130+k*50,250,44,k<r.stars?'#ffd34d':'#4a4538')}g.restore()}
 txt(B.chal?L('영웅 도전은 목숨 10개로 시작해요','英雄挑战以10条生命开始'):L('★★★ 목숨 18 이상 · ★★ 6 이상 · ★ 승리','★★★ 生命18以上 · ★★ 6以上 · ★ 胜利'),180,282,9.5,'#a89a7c','center','600');
 txt((r.chalNew?L('도전 성공! ','挑战成功！'):'')+L('공적 +','功勋 +')+(r.merit*(B.doubled?2:1))+(r.newStars?L('  (새 별 보너스 포함)','  （含新星奖励）'):''),180,304,13,r.chalNew?'#ffb070':'#ffe2a0');
 if(B.i<STAGES.length-1)button(54,330,252,50,L('다음 전투: ','下一战：')+LL(STAGES[B.i+1].name),'green',15);else button(54,330,252,50,L('전투 선택','选择战斗'),'green',15);
 if(!B.doubled)button(54,390,166,46,'',  'blue',13);if(!B.doubled){txt('▶ '+L('공적 2배','功勋翻倍'),137,406,13,'#fff');txt(L('광고 보기','观看广告'),137,424,9,'#cfe8ff')}
 button(228,390,78,46,L('공유','分享'),'gray',12);button(54,500,252,40,'📜 '+L('역사 카드: ','历史卡片：')+LL(HIST[B.i].title),'gold',12);button(54,446,124,44,L('다시 하기','再来一次'),'gold',13);button(186,446,120,44,L('전투 선택','选择战斗'),'gray',13)}
function failScreen(){const ci=imgs.story_lose;if(ci)cover('story_lose','rgba(6,8,14,.4)');else{drawBattle(0);g.fillStyle='rgba(0,0,0,.75)';g.fillRect(0,0,VW,VH)}rr(24,140,312,400,14,ci?'#2b261ed8':'#2b261ef2','#8a7650',1.5);
 txt(L('성문이 뚫렸다','城门失守'),180,180,26,'#ff8080','center','900');
 wrap(B.wave>=B.S.waves.length?L('마지막 웨이브에서 무너졌어요. 책략을 아껴 보세요.','在最后一波失守。试着保留计策。'):L('웨이브 ','在第')+B.wave+L('에서 무너졌어요. 길이 꺾이는 곳에 타워를 모아 보세요.','波失守。试着把防御塔集中在道路拐角。'),180,216,260,11,'#e8dcc0',17);
 txt(L('공적 +','功勋 +')+B.result.merit,180,270,12,'#ffe2a0');
 if(!B.revived){button(54,296,252,56,'','blue',14);txt('▶ '+L('부활: 목숨 5개로 계속','复活：以5条命继续'),180,316,14,'#fff');txt(L('광고 보기','观看广告'),180,336,9,'#cfe8ff')}
 button(54,366,252,48,L('다시 하기','再来一次'),'gold',15);button(54,424,252,44,L('본영 강화','本营强化'),'gray',13);button(54,476,252,44,L('전투 선택','选择战斗'),'gray',13)}

// ---------------------------------------------------------------- 입력
function touch(x,y){AudioFx.init();if(AudioFx.ctx&&AudioFx.ctx.state==='suspended'&&AudioFx.ctx.resume)AudioFx.ctx.resume();
 if(adShow)return;if(offer){tapOffer(x,y);return}if(histCard!=null){if(histT>.4)histCard=null;return}if(guideTip){if(guideTip.t>.3)guideTip=null;return}
 if(sc==='loading')return;
 if(sc==='title'){if(hit(x,y,270,10,80,26)){toggleLang();return}const by=imgs.bg_title?462:330,by2=by+(imgs.bg_title?62:66);if(hit(x,y,80,by,200,54)){AudioFx.cue('ui');if(!save.stars[0]&&!save.tips.firstplay){save.tips.firstplay=1;startStage(0)}else{sc='map';tip('map',[['별을 모으면 다음 전투가 열려요','获得星级即可解锁下一场战斗'],['전투에서 얻은 공적으로 본영에서 타워를 영구 강화해요','用战斗获得的功勋在本营永久强化防御塔'],['포상에서 매일 봉화·장계·둔전 보상을 챙기세요','每天在奖赏中领取烽火、诏令和屯田奖励']])}return}
  if(hit(x,y,80,by2,96,40)){sc='guide';guidePage=0;guideRet='title';track('guide_open',{from:'title'});return}if(hit(x,y,184,by2,96,40)){sc='settings';retSc='title';resetArm=0;return}return}
 if(sc==='map'){if(hit(x,y,178,8,36,34)){sc='heroes';save.tips.heroSeen=heroUnlocked('kwak')?1:save.tips.heroSeen;AudioFx.cue('ui');return}if(hit(x,y,220,10,40,30)){sc='codex';return}if(hit(x,y,266,10,40,30)){sc='guide';guidePage=0;guideRet='map';track('guide_open',{from:'map'});return}if(hit(x,y,312,10,40,30)){sc='settings';retSc='map';resetArm=0;return}
  for(let i=0;i<STAGES.length;i++){const r=mapRect(i);if(unlocked(i)&&(save.stars[i]||0)>0&&hit(x,y,r.x+r.w-136,r.y,60,r.h)){AudioFx.cue('ui');startStage(i,true);message(L('영웅 도전: 적 체력 +30% · 목숨 10 · 엽전 -15%','英雄挑战：敌人体力 +30% · 生命10 · 铜钱 -15%'),2.2);return}if(hit(x,y,r.x,r.y,r.w,r.h)){if(unlocked(i)){AudioFx.cue('ui');startStage(i)}else message(L('이전 전투에서 먼저 이기세요','请先赢得前一场战斗'),1.2);return}}
  if(hit(x,y,16,500,104,58)){sc='base';tip('base',[['공적을 써서 타워를 영구 강화해요','消耗功勋永久强化防御塔'],['강화는 모든 전투에 적용돼요','强化对所有战斗生效']]);return}
  if(hit(x,y,128,500,104,58)){sc='reward';ordersInit();tip('reward',[['봉화 7일: 하루 한 번 눌러 공적 받기','七日烽火：每天点一次领取功勋'],['오늘의 장계: 조정의 명령 3개, 매일 바뀜','今日诏令：朝廷的3道命令，每日更新'],['둔전: 쉬는 동안에도 공적이 쌓임','屯田：离线时也会积累功勋']]);return}
  if(hit(x,y,240,500,104,58)){if(cartLeft()<=0){message(L('오늘 보급 수레는 모두 받았어요','今日补给车已领完'),1.2);return}showAd('cart',()=>{save.cart.n++;gainMerit(cartReward());AudioFx.cue('reward');message(L('의병 보급 수레 도착! 공적 +','义兵补给车到达！功勋 +')+cartReward(),1.4)});return}return}
 if(sc==='base'){UP_KEYS.forEach((k,i)=>{const yy=52+i*78;if(hit(x,y,252,yy+14,84,42)&&save.up[k]<UP_MAX&&save.merit<upCost(k)){if(!offerMerit())message(L('공적이 모자라요. 전투에서 모아 오세요','功勋不足，去战斗中获取吧'),1.2);return}if(hit(x,y,252,yy+14,84,42)&&save.up[k]<UP_MAX&&save.merit>=upCost(k)){save.merit-=upCost(k);save.up[k]++;persist();AudioFx.cue('up');track('base_up',{k,lv:save.up[k]})}});if(hit(x,y,80,530,200,50))sc='map';return}
 if(sc==='reward'){if(hit(x,y,80,530,200,50)){sc='map';return}
  if(hit(x,y,270,96,70,36)&&beaconCan()){const r2=BEACON[save.beacon.n%7];save.beacon.n++;save.beacon.last=todayKey();gainMerit(r2);AudioFx.cue('reward');message(L('봉화를 올렸다! 공적 +','点燃烽火！功勋 +')+r2,1.4);return}
  save.orders.m.forEach((m,k)=>{const O=ORDERS[m.i],yy=170+k*50;if(hit(x,y,270,yy+6,70,32)&&!m.c&&m.p>=O.goal){m.c=true;gainMerit(O.r);AudioFx.cue('reward')}});
  HONOR.forEach((h,i)=>{const xx=12+i*114;if(hit(x,y,xx+14,378,80,26)&&!save.honor.includes(i)&&starTotal()>=h[0]){save.honor.push(i);gainMerit(h[1]);AudioFx.cue('reward');message(L('임금의 하사품! 공적 +','御赐奖赏！功勋 +')+h[1],1.4)}});
  if(hit(x,y,196,436,70,42)){collectFarm(1);return}if(hit(x,y,272,436,70,42)&&farmAmount()>0){showAd('farm',()=>collectFarm(2));return}return}
 if(sc==='guide'){GUIDE.forEach((p,k)=>{if(hit(x,y,12+k*114,50,108,32))guidePage=k});if(hit(x,y,80,530,200,50)){sc=guideRet;if(guideRet==='battle')paused=true}return}
 if(sc==='privacy'){if(hit(x,y,80,530,200,50))sc='settings';return}
 if(sc==='heroes'){if(hit(x,y,80,530,200,50)){sc='map';return}['kim','kwak'].forEach((k,i)=>{const r=heroRect(i);if(hit(x,y,r.x,r.y,r.w,r.h)){if(!heroUnlocked(k)){message(L('동래성에서 이기면 곽재우가 합류해요','赢得东莱城后郭再祐将加入'),1.4);return}if(save.hero!==k){save.hero=k;persist();AudioFx.cue('up');vib('light');track('hero_pick',{k})}}});return}
 if(sc==='codex'){if(hit(x,y,80,530,200,50)){sc='map';return}const cst=Math.min(67,474/HIST.length);HIST.forEach((h,k)=>{if(hit(x,y,14,50+k*cst,332,cst-6)){if(histUnlocked(k))openHist(k);else message(L('해당 전투에서 이기면 열려요','赢得对应战斗后解锁'),1.2)}});return}
 if(sc==='settings'){if(hit(x,y,40,100,136,44)){Music.toggle();save.music=Music.on;persist();return}if(hit(x,y,184,100,136,44)){AudioFx.enabled=!AudioFx.enabled;save.sfx=AudioFx.enabled;persist();return}
  if(hit(x,y,40,154,136,44)){save.shake=save.shake===false;persist();return}if(hit(x,y,184,154,136,44)){save.vib=save.vib===false;persist();vib('medium');return}
  if(hit(x,y,40,208,136,44)){const o=['auto','high','low'];save.quality=o[(o.indexOf(save.quality)+1)%3];perf.low=save.quality==='low';perf.checked=save.quality!=='auto';persist();return}if(hit(x,y,184,208,136,44)){save.mild=!save.mild;persist();return}
  if(hit(x,y,40,262,280,44)){toggleLang();return}if(hit(x,y,40,316,280,44)){sc='privacy';return}
  if(hit(x,y,40,384,280,44)){if(resetArm>0){const keep=LANG;Object.assign(save,{tips:{},stars:[],merit:0,meritTotal:0,lastRank:0,up:{archer:0,militia:0,rocket:0,cannon:0,gold:0,skill:0},orders:null,beacon:{last:'',n:0},honor:[],farm:Date.now(),cart:null,plays:0,histRead:[]});LANG=keep;persist();resetArm=0;message(L('초기화 완료','已重置'),1)}else resetArm=1;return}
  if(hit(x,y,80,530,200,50)){sc=retSc;return}return}
 if(sc==='clear'){if(B.endT<.8)return;if(hit(x,y,54,330,252,50)){if(B.i<STAGES.length-1)startStage(B.i+1);else sc='map';return}
  if(!B.doubled&&hit(x,y,54,390,166,46)){showAd('double',()=>{B.doubled=true;gainMerit(B.result.merit);AudioFx.cue('reward')});return}
  if(hit(x,y,228,390,78,46)){shareGame();return}if(hit(x,y,54,500,252,40)){openHist(B.i);return}if(hit(x,y,54,446,124,44)){startStage(B.i,B.chal);return}if(hit(x,y,186,446,120,44)){sc='map';return}return}
 if(sc==='fail'){if(B.endT<.6)return;if(!B.revived&&hit(x,y,54,296,252,56)){showAd('revive',revive);return}if(hit(x,y,54,366,252,48)){startStage(B.i,B.chal);return}if(hit(x,y,54,424,252,44)){sc='base';return}if(hit(x,y,54,476,252,44)){sc='map';return}return}
 if(sc!=='battle')return;
 if(B.phase==='story'){if(B.storyT<.25)return;storyNext(hit(x,y,276,18,76,40));return}
 if(B.phase==='intro'){B.phase='play';return}
 if(B.choice){if(B.choice.t<.35)return;for(let i=0;i<3;i++){const r=choiceRect(i);if(hit(x,y,r.x,r.y,r.w,r.h)){pickPerk(i);return}}return}
 if(paused){if(hit(x,y,80,240,200,46)){paused=false;return}if(hit(x,y,80,296,200,46)){paused=false;startStage(B.i);B.phase='play';return}if(hit(x,y,80,352,200,46)){paused=false;sc='map';return}
  if(hit(x,y,80,420,96,40)){Music.toggle();save.music=Music.on;persist();return}if(hit(x,y,184,420,96,40)){AudioFx.enabled=!AudioFx.enabled;save.sfx=AudioFx.enabled;persist();return}if(hit(x,y,80,468,200,40)){sc='guide';guidePage=1;guideRet='battle';return}return}
 if(y>=BOT){for(const b of uiButtons())if(hit(x,y,b.x,b.y,b.w,b.h)){if(b.id==='wave'&&b.on)callWave();else if(SK[b.id]){if(B.aim===b.id)B.aim=null;else if(b.on){B.aim=b.id;AudioFx.cue('ui');vib('light')}else message(L('아직 준비 중이에요','尚在准备中'),.9)}else if(b.id==='speed')speed=speed===1?2:1;else if(b.id==='menu')paused=true;popup=null;return}return}
 if(y<TOP){if(x>78&&x<178&&!B.result){offerSupply(true)}return}
 if(hit(x,y,VW-41,TOP+6,34,28)&&!B.result){popup=null;CAM.zoomed=!CAM.zoomed;const [mx,my]=s2w(VW/2,(TOP+BOT)/2);CAM.z=CAM.zoomed?1.35:1;camLook(mx,my);AudioFx.cue('ui');return}
 [x,y]=s2w(x,y);
 if(B.aim){castSkill(B.aim,x,y);return}
 if(popup){for(const b of popupButtons())if(Math.hypot(b.x-x,b.y-y)<28){doPopup(b);return}popup=null;return}
 for(let i=0;i<B.slots.length;i++){const s=B.slots[i];if(Math.hypot(s.x-x,s.y-y)<20){popup={slot:i};AudioFx.cue('ui');return}}
 moveHero(x,y)}
function doPopup(b){const sl=B.slots[popup.slot];
 if(b.k==='hero'){popup=null;return}
 if(b.k==='repair'){if(B.gold>=b.cost){save.tips.tutRep=1;B.gold-=b.cost;sl.t.hp=sl.t.max;sl.t.down=false;sl.t.pop=.3;AudioFx.cue('repair');puff(sl.x,sl.y-6,10,'#9fe0ff',50,.5,2,-40,'spark');popup=null}else if(!offerSupply())addFloat(sl.x,sl.y-30,L('엽전 부족','铜钱不足'),'#ff8080');return}
 if(TOWERS[b.k]){if(B.gold>=b.cost){B.gold-=b.cost;sl.t={kind:b.k,lv:0,cd:0,spent:b.cost,pop:.3,hp:TOWER_HP[0],max:TOWER_HP[0]};puff(sl.x,sl.y+10,14,'rgba(170,140,100,.8)',45,.6,5,0,'smoke');if(!save.tips.tut1)track('tutorial_step',{step:1});save.tips.tut1=1;AudioFx.cue('build');vib('light');popup=null}else if(!offerSupply())addFloat(sl.x,sl.y-30,L('엽전 부족','铜钱不足'),'#ff8080');return}
 if(b.k==='up'){if(B.gold>=b.cost){B.gold-=b.cost;sl.t.lv++;sl.t.spent+=b.cost;sl.t.max=TOWER_HP[sl.t.lv];sl.t.hp=sl.t.max;sl.t.down=false;puff(sl.x,sl.y-6,14,'#ffd34d',55,.6,2.2,-40,'spark');puff(sl.x,sl.y+10,8,'rgba(170,140,100,.7)',30,.5,5,0,'smoke');sl.t.pop=.3;if(sl.t.men)sl.t.men.forEach(m=>{m.hp=TOWERS.militia.hp[sl.t.lv]*upMul('militia',.12)});AudioFx.cue('up');order('upgrade');{const F=TOWERS[sl.t.kind].fx;if(F)addFloat(sl.x,sl.y-40,LL(F[sl.t.lv]),'#9fffbf')}B.fx.push({x:sl.x,y:sl.y,t:.3,r:18,c:'#ffd34d'});popup=null}else if(!offerSupply())addFloat(sl.x,sl.y-30,L('엽전 부족','铜钱不足'),'#ff8080');return}
 if(b.k==='br'){if(B.gold>=b.cost){B.gold-=b.cost;const t=sl.t;t.lv=3;t.br=b.br;t.D=null;t.spent+=b.cost;t.max=TOWER_HP[3];t.hp=t.max;t.down=false;t.pop=.45;if(t.men){const Dm=towerD(t);t.men.forEach(m=>{m.hp=Dm.hp[3]*upMul('militia',.12)})}
  puff(sl.x,sl.y-10,22,'#ffd34d',75,.8,2.6,-50,'spark');puff(sl.x,sl.y+10,12,'rgba(170,140,100,.8)',40,.6,6,0,'smoke');B.fx.push({x:sl.x,y:sl.y,t:.4,r:30,ring:true});shake(.12);vib('heavy');AudioFx.cue('up');AudioFx.cue('horn');order('upgrade');addFloat(sl.x,sl.y-44,LL(BR[t.kind][b.br].n)+'!','#ffe08a');track('branch',{k:t.kind,br:b.br});popup=null}else if(!offerSupply())addFloat(sl.x,sl.y-30,L('엽전 부족','铜钱不足'),'#ff8080');return}
 if(b.k==='sell'){B.gold+=Math.floor(sl.t.spent*SELL);if(sl.t.men)sl.t.men.forEach(m=>{if(m.target)m.target.blocked=null});sl.t=null;AudioFx.cue('coin');popup=null;return}
 popup=null}
function toggleLang(){LANG=LANG==='zh'?'ko':'zh';persist();AudioFx.cue('ui')}
function coords(px,py){if(API){const k=c.width/(info.windowWidth||375);return [((px*k-view.ox)/view.s)/K,((py*k-view.oy)/view.s)/K]}const r=c.getBoundingClientRect();return [(px-r.left)/r.width*W/K,(py-r.top)/r.height*H/K]}
// 누르기와 끌기 구분: 8 이상 움직이면 전장 이동, 아니면 누르기
let drag=null;
function pDown(x,y){drag={sx:x,sy:y,cx:CAM.x,cy:CAM.y,moved:false,field:sc==='battle'&&B&&B.phase==='play'&&!paused&&y>TOP&&y<BOT}}
function pMove(x,y){if(!drag||!drag.field)return;const dx=x-drag.sx,dy=y-drag.sy;if(!drag.moved&&Math.hypot(dx,dy)>8)drag.moved=true;if(drag.moved){CAM.x=drag.cx-dx/CAM.z;CAM.y=drag.cy-dy/CAM.z;camClamp()}}
function pUp(x,y){const d=drag;drag=null;if(d&&d.moved)return;touch(x,y)}
if(API){const P=e=>{const p=(e.changedTouches||e.touches||[])[0];return p?coords(p.clientX,p.clientY):null};
 API.onTouchStart&&API.onTouchStart(e=>{const p=P(e);if(p)pDown(p[0],p[1])});API.onTouchMove&&API.onTouchMove(e=>{const p=P(e);if(p)pMove(p[0],p[1])});
 API.onTouchEnd&&API.onTouchEnd(e=>{const p=P(e);if(p)pUp(p[0],p[1])})}
else{c.addEventListener('pointerdown',e=>{const [x,y]=coords(e.clientX,e.clientY);pDown(x,y)});c.addEventListener('pointermove',e=>{if(e.buttons||e.pointerType==='touch'){const [x,y]=coords(e.clientX,e.clientY);pMove(x,y)}});
 c.addEventListener('pointerup',e=>{const [x,y]=coords(e.clientX,e.clientY);pUp(x,y)})}

// ---------------------------------------------------------------- 루프
function drawMsg(dt){if(!msg)return;msg.d-=dt;g.save();g.globalAlpha=Math.min(1,msg.d*2);g.font='700 12px '+FONT;const w=Math.min(340,g.measureText(msg.t).width+30);const my=histCard!=null?590:92;rr(180-w/2,my,w,32,10,'#1b2232f2','#ffcf6a',1.5);txt(msg.t,180,my+16,12,'#ffe2a0');g.restore();if(msg.d<=0)msg=null}
function draw(dt){if(API){g.setTransform(1,0,0,1,0,0);g.fillStyle='#05070c';g.fillRect(0,0,c.width,c.height);g.setTransform(view.s*K,0,0,view.s*K,view.ox,view.oy)}else g.setTransform(K,0,0,K,0,0);
 frame+=dt;if(shakeT>0)shakeT-=dt;
 if(sc==='loading')loadingScreen(dt);else if(sc==='title')title();else if(sc==='map')mapScreen();else if(sc==='base')baseScreen();else if(sc==='reward')rewardScreen();
 else if(sc==='settings')settingsScreen();else if(sc==='privacy')privacyScreen();else if(sc==='guide')guideScreen();else if(sc==='codex')codexScreen();else if(sc==='heroes')heroScreen();
 else if(sc==='battle'){tick(dt);drawBattle(dt)}else if(sc==='clear'){B.endT+=dt;clearScreen()}else if(sc==='fail'){B.endT+=dt;failScreen()}
 for(const f of floats){f.life-=dt;f.y-=24*dt;g.globalAlpha=Math.max(0,Math.min(1,f.life*2));const [fx,fy]=f.w&&sc==='battle'?w2s(f.x,f.y):[f.x,f.y];if(!(f.w&&(sc!=='battle'||(B&&(B.choice||B.phase!=='play'))||fy>BOT-6||fy<TOP+6)))txt(f.t,fx,fy,13,f.c,'center','800');g.globalAlpha=1}for(let i=floats.length-1;i>=0;i--)if(floats[i].life<=0)floats.splice(i,1);
 if(histCard!=null)drawHistCard(dt);drawMsg(dt);if(guideTip)drawGuideTip(dt);if(offer&&!adShow)drawOffer(dt);if(adShow)drawAd(dt);wantMusic();Music.tick()}
if(!API&&typeof location!=='undefined'&&location.search.indexOf('debug=1')>=0){globalThis.__bepaDebug={STAGES,TOWERS,save,persist,startStage,callWave,useSkill,revive,touch,showAd,order,gainMerit,
 get B(){return B},openHist,set histCard(v){histCard=v},set sc(v){sc=v},get sc(){return sc},set freeze(v){dbgFreeze=v},set guideTip(v){guideTip=v},get guideTip(){return guideTip},set paused(v){paused=v},
 CAM,camLook,pickPerk,branch(si,br){popup={slot:si};const t=B.slots[si].t;doPopup({k:'br',br,cost:BR[t.kind][br].cost})},castSkill,moveHero,repair(si){popup={slot:si};const t=B.slots[si].t;doPopup({k:'repair',cost:repairCost(t)})},build(si,k){popup={slot:si};doPopup({k,cost:k==='hero'?0:TOWERS[k].cost[0]})},up(si){popup={slot:si};const s=B.slots[si];doPopup({k:'up',cost:TOWERS[s.t.kind].cost[s.t.lv+1]})},
 step(n,dt=1/30){for(let i=0;i<n;i++){if(B&&B.phase==='play'&&sc==='battle')step(dt)}},draw(dt){draw(dt||1/60)},spawn,endStage,
 force(ev){if(ev==='boss'){B.bossWarn=3;spawn('b')}else if(ev==='leak'){B.leakFlash=.4;shake(.3)}else if(ev==='skill'){B.cd.fire=0;B.cd.reinf=0;castSkill('fire',180,300);castSkill('reinf',120,300)}else if(ev==='move'){moveHero(120,250)}else if(ev==='siege'){spawn('c');spawn('g')}else if(ev==='ad'){showAd('test',()=>{})}else if(ev==='tip'){guideTip={lines:[['테스트 안내','测试提示']],t:0}}}}}
let drawErr=0;
function loop(now){let dt=last?(now-last)/1000:0;last=now;if(save.quality==='auto'&&!perf.checked&&sc==='battle'&&B&&B.phase==='play'&&dt>0&&dt<.5){perf.acc+=dt;perf.n++;if(perf.acc>4){perf.checked=true;if(perf.n/perf.acc<38){perf.low=true;message(L('기기에 맞춰 화질을 낮췄어요 (설정에서 바꿀 수 있어요)','已根据设备降低画质（可在设置中更改）'),2.2);track('perf_low',{fps:Math.round(perf.n/perf.acc)})}}}dt=Math.min(dt,.05);try{draw(dt)}catch(e){drawErr++;try{g.restore();g.restore();g.restore()}catch(e2){}if(drawErr<5&&typeof console!=='undefined')console.error('draw error',e);if(drawErr===1)track('draw_error',{m:String(e&&e.message||e).slice(0,80),sc})}
 if(API){if(typeof requestAnimationFrame==='function')requestAnimationFrame(loop);else if(c.requestAnimationFrame)c.requestAnimationFrame(loop)}else requestAnimationFrame(loop)}
if(API){if(typeof requestAnimationFrame==='function')requestAnimationFrame(loop);else if(c.requestAnimationFrame)c.requestAnimationFrame(loop)}else requestAnimationFrame(loop);
})();
