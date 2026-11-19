/* 团团小镇闹哄哄 — canvas build. One file for web, WeChat (wx) and Douyin (tt). No DOM is used for the game itself. */
const STAGES=/*@@STAGES@@*/[];
const BUILD='DEVBUILD';
const AD_UNIT={rewarded:''}; /* put the platform's rewarded-video ad unit id here; empty = 3-second test ad */
const INTERSTITIAL_ON=false;
const PF=(typeof tt!=='undefined'&&tt.createCanvas)?tt:(typeof wx!=='undefined'&&wx.createCanvas)?wx:null;
const now=()=>Date.now();
const QS=(()=>{const o={};if(!PF&&typeof location!=='undefined')location.search.slice(1).split('&').forEach(p=>{const i=p.indexOf('=');if(i>0)o[p.slice(0,i)]=decodeURIComponent(p.slice(i+1));});return o;})();
const TEST_OPEN_ALL=QS.all==='1'||QS.debug==='1';
/* ---------- save ---------- */
const KEY='tt-photo-v2';
function sget(){try{return PF?PF.getStorageSync(KEY):localStorage.getItem(KEY);}catch(e){return null;}}
let SAVE={alb:{},last:{},found:{}};try{const s=JSON.parse(sget()||'null');if(s&&s.alb)SAVE=Object.assign(SAVE,s);}catch(e){}
function persist(){try{const v=JSON.stringify(SAVE);PF?PF.setStorageSync(KEY,v):localStorage.setItem(KEY,v);}catch(e){}}
let LANG='zh';const T=(zh,ko)=>LANG==='ko'?ko:zh;
function pickLang(){if(QS.lang==='zh'||QS.lang==='ko')return QS.lang;if(SAVE.lang)return SAVE.lang;let nl='',tz='';try{nl=(PF?PF.getSystemInfoSync().language:navigator.language||'').toLowerCase();}catch(e){}if(PF)return /^ko/.test(nl)?'ko':'zh';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch(e){}if(/^zh/.test(nl)||/Shanghai|Chongqing|Harbin|Urumqi|Hong_Kong|Macau|Taipei/.test(tz))return 'zh';return /^ko/.test(nl)?'ko':'zh';}
/* ---------- stats: register the same names in the WeChat / Douyin admin page ---------- */
const TR=[];function track(n,d){d=d||{};TR.push([n,d]);if(TR.length>400)TR.shift();try{if(PF&&PF.reportEvent)PF.reportEvent(n,d);else if(PF&&PF.reportAnalytics)PF.reportAnalytics(n,d);}catch(e){}}
/* ---------- screen ---------- */
const cv=PF?PF.createCanvas():document.getElementById('cv');const g=cv.getContext('2d');
const mk=(w,h)=>{const c=PF?PF.createCanvas():document.createElement('canvas');c.width=w;c.height=h;return c;};
let W=375,H=667,K=1,DPR=1,OX=0,winW=375,winH=667,SAFE=0,TOP=8,SS=351,VW=351,PX=12,PY=64;const TRAY=84;
function fit(){try{if(PF){const i=PF.getSystemInfoSync();winW=i.windowWidth;winH=i.windowHeight;DPR=Math.min(3,i.pixelRatio||2);SAFE=(i.safeArea&&i.safeArea.top)||i.statusBarHeight||0;}else{winW=innerWidth;winH=innerHeight;DPR=Math.min(3,devicePixelRatio||1);const pr=document.getElementById('probe');SAFE=pr?parseFloat(getComputedStyle(pr).paddingTop)||0:0;}}catch(e){}
 let cw=winW;if(cw/winH>.7)cw=winH*.5625;K=cw/375;H=winH/K;OX=(winW-cw)/2;cv.width=Math.round(winW*DPR);cv.height=Math.round(winH*DPR);if(!PF){cv.style.width=winW+'px';cv.style.height=winH+'px';}
 TOP=SAFE/K+(PF?46:0)+8;SS=VW=Math.max(220,Math.min(351,H-TOP-56-TRAY-8-46-10-60-12));PX=(W-SS)/2;PY=TOP+54;}
/* ---------- art: core first, each stage when it is opened ---------- */
const CORE=['logo_zh','logo_ko','lili_basic','lili_shock','lili_joy','lili_worry','paw','tt_cheer','flashlight','clock','fu','tuantuan','cat_dry'];
function stageKeys(st){const k=new Set([st.bg,'lili_basic','lili_shock','lili_joy','lili_worry','tt_cheer']);if(st.hid)k.add(st.hid);for(const o of st.objs){if(o.img)k.add(o.img);for(const a of o.alt||[])if(a.img)k.add(a.img);}for(const t of st.tools)k.add(t.img);for(const r of st.rules)for(const d of r.do)if(d[0]==='tmp'&&d[2].img)k.add(d[2].img);else if(d[0]==='fly')k.add(d[1]);return [...k];}
const SUB={};function sub(n){if(!PF||!PF.loadSubpackage)return Promise.resolve();return SUB[n]||(SUB[n]=new Promise(res=>{try{PF.loadSubpackage({name:n,success:()=>res(),fail:()=>{SUB[n]=null;res();}});}catch(e){res();}}));}
const ART={},PEND={};
const S2=n=>/^(s2_|cici_)/.test(n);
const pathOf=n=>(n.startsWith('th_')?'thumb/'+n.slice(3):n.startsWith('end_')?'story/'+n:S2(n)?'season2/'+n:'art/'+n)+'.webp';
function loadImg(n,tries){tries=tries||0;if(ART[n])return Promise.resolve(true);if(PEND[n]&&!tries)return PEND[n];const p=(n.startsWith('end_')?sub('story'):S2(n)?sub('season2'):Promise.resolve()).then(()=>new Promise(res=>{const im=PF?PF.createImage():new Image();im.onload=()=>{ART[n]=im;if(S)refreshPV();res(true);};im.onerror=()=>{if(tries<7)setTimeout(()=>loadImg(n,tries+1).then(res),500*(tries+1));else{track('img_fail',{n});res(false);}};im.src=pathOf(n)+(PF?'':'?v='+BUILD+(tries?'&r='+tries:''));}));if(!tries)PEND[n]=p;return p;}
let LOADING=null;
function ensure(list,done){list=[...new Set(list)].filter(n=>n&&!ART[n]);if(!list.length){done();return;}const Ld=LOADING={ok:0,n:list.length,t0:now(),done:false};const fin=()=>{if(Ld.done)return;Ld.done=true;if(LOADING===Ld)LOADING=null;done();};Ld.fin=fin;list.forEach(n=>loadImg(n).then(()=>{Ld.ok++;if(Ld.ok>=Ld.n)fin();}));}
/* ---------- rules ---------- */
const cond=(c,v)=>!c||c.split('|').some(a=>a.split('&').every(t=>t[0]==='!'?!v[t.slice(1)]:!!v[t]));
let S=null,L=null,UI='home',M=[];
const topM=()=>M[M.length-1];const MT={};const openM=n=>{if(!M.includes(n)){M.push(n);MT[n]=now();}};const closeM=n=>{M=M.filter(x=>x!==n);};
const obj=id=>L.objs.find(o=>o.id===id);
function view(o,v,tmp){let r={img:o.img,x:o.x,y:o.y,w:o.w,h:o.h,rot:o.rot||0,hide:false};if(o.show&&!cond(o.show,v))r.hide=true;for(const a of o.alt||[])if(cond(a.if,v)){for(const k of ['img','x','y','w','h','rot'])if(a[k]!==undefined)r[k]=a[k];if(a.hide)r.hide=true;}const t=tmp&&tmp[o.id];if(t){Object.assign(r,t);if(t.hide===undefined&&t.show)r.hide=false;}return r;}
const allP=st=>st.probs.concat(st.extra||[]);const probsDone=v=>allP(L).filter(p=>v[p.id]).length;
function probsDoneOf(st,v){return allP(st).filter(p=>v[p.id]).length;}
function blank(st){const v={};for(const p of allP(st))v[p.id]=false;return v;}
function vFrom(st,l){const v=blank(st);st.probs.forEach((p,i)=>{v[p.id]=l.mask[i]==='0';});(st.extra||[]).forEach((p,i)=>{v[p.id]=(l.x||'')[i]==='1';});return v;}
function start(i){M=[];const st=STAGES[i];let ks=stageKeys(st);if(st.wall)for(const id of Object.keys(SAVE.last||{}))ks=ks.concat(stageKeys(STAGES.find(q=>q.id===+id)||st));return new Promise(res=>ensure(ks,()=>{begin(i);res();setTimeout(()=>{if(STAGES[i+1])stageKeys(STAGES[i+1]).forEach(n=>loadImg(n));},2500);}));}
function begin(i){track('stage_start',{stage:STAGES[i].id});if(STAGES[i].wall)buildWall();L=STAGES[i];S={i,v:blank(L),found:false,phase:'playing',t:L.time||120,tmp:{},fx:{},rub:{},rot:{},q:[],qw:0,parts:[],fly:[],bubble:null,drag:null,g:null,flash:0,mood:'worry',idle:0,hint:0,hintR:null,zone:null,comp:false,hints:L.diff.hints,used:{},paused:false,timeAd:false,hintAd:false,adRound:false,cardT:1.5};
 if(AD.missStage!==L.id){AD.miss=0;AD.missStage=L.id;AD.next={time:0,detail:0,free:0};}S.t+=AD.next.time;S.hints+=AD.next.free;S.detailReady=AD.next.detail;AD.next={time:0,detail:0,free:0};AD.played++;
 M=[];UI='play';music('play');if(L.id===2&&!SAVE.tipI){SAVE.tipI=1;persist();setTimeout(()=>toast(T('下面的道具会帮你：手电筒照出大概位置，加时钟多20秒','아래 아이템이 도와줘요: 손전등은 대략적인 위치, 시계는 20초 추가'),4200),1700);}refreshPV();S.q.push(['wait',1.4]);enqueue(L.open||[]);}
function goHome(){music('menu');S=null;L=null;M=[];UI='home';maybeSign();}
function enqueue(ops){S.q.push(...ops);}
const at=p=>{if(Array.isArray(p))return{x:p[0],y:p[1]};if(p==='tray')return{x:.5,y:1.08};if(p==='lili')return{x:L.lili[0],y:L.lili[1]-L.lili[2]*.5};const o=obj(p);const w=view(o,S.v,S.tmp);return{x:w.x,y:w.y};};
function runOp(d){const k=d[0];
 if(k==='set'){const was=S.v[d[1]],h0=L.tools.filter(t=>cond(t.have,S.v)).length;S.v[d[1]]=true;if(!was&&L.tools.filter(t=>cond(t.have,S.v)).length>h0)setTimeout(()=>tone('pick'),120);if(!was){if(allP(L).some(p=>p.id===d[1])){tone('good');const q=allP(L).find(p=>p.id===d[1]);celebrate(q.at||d[1]);S.mood=probsDone(S.v)>=2?'joy':'basic';}refreshPV();}}
 else if(k==='clr'){S.v[d[1]]=false;refreshPV();}
 else if(k==='found'){S.found=true;tone('good');refreshPV();}
 else if(k==='say'){const p=at(d[2]||'lili');S.bubble={t:d[1],x:p.x*SS,y:(p.y-.13)*SS,life:d[3]||1.9};}
 else if(k==='wig')S.fx[d[1]]=d[2]||.7;
 else if(k==='wait')S.qw=d[1];
 else if(k==='tmp'){S.tmp[d[1]]=Object.assign({},S.tmp[d[1]],d[2]);}
 else if(k==='off'){delete S.tmp[d[1]];}
 else if(k==='go'){const o=obj(d[1]),w=view(o,S.v,S.tmp);S.fly.push({mv:d[1],x0:w.x,y0:w.y,x1:d[2],y1:d[3],t:0,dur:d[4]||.5,arc:d[5]||0});S.qw=d[4]||.5;}
 else if(k==='fly'){const a=at(d[2]),b=at(d[3]);S.fly.push({img:d[1],x0:a.x,y0:a.y,x1:b.x,y1:b.y,t:0,dur:d[4]||.6,arc:d[5]||.15,w:d[6]||.09});S.qw=(d[4]||.6);}
 else if(k==='fx')particles(d[1],d[2]);
 else if(k==='mood')S.mood=d[1];
 else if(k==='tone')tone(d[1],d[2]);
 else if(k==='zone')S.zone={x:d[1],y:d[2],r:d[3],t:d[4]||4};
 else if(k==='pv')openPV();}
function pump(dt){if(S.qw>0){S.qw-=dt;return;}let guard=0;while(S.q.length&&S.qw<=0&&guard++<40)runOp(S.q.shift());}
function fire(r){if(r.lockq&&S.q.length)return false;enqueue(r.do);return true;}
const find=(on,t,tool)=>L.rules.find(r=>r.on===on&&r.t===t&&(!tool||r.tool===tool)&&cond(r.if,S.v));
function celebrate(id){const p=at(Array.isArray(id)||obj(id)?id:'lili');for(let i=0;i<22;i++){const a=Math.random()*7,v=50+Math.random()*90;S.parts.push({x:p.x*SS,y:p.y*SS,vx:Math.cos(a)*v,vy:Math.sin(a)*v-30,life:.7,r:2.4,c:['#ffd94a','#ff8fa3','#fff','#7fc9a2'][i%4]});}}
function particles(kind,where){const p=at(where);const n={drops:16,spark:20,confetti:40,splash:20,steam:14,leaf:14}[kind]||14;for(let i=0;i<n;i++){const a=Math.random()*6.28,v=40+Math.random()*90;
  if(kind==='drops'||kind==='splash')S.parts.push({x:p.x*SS+(Math.random()-.5)*26,y:p.y*SS-30,vx:(Math.random()-.5)*60,vy:-60-Math.random()*60,g:300,life:.7,r:3,c:'#8ccbf2'});
  else if(kind==='confetti')S.parts.push({x:p.x*SS,y:p.y*SS,vx:Math.cos(a)*v*1.3,vy:Math.sin(a)*v-80,g:150,life:1.3,r:3.2,c:['#ffd94a','#ff8fa3','#9fd3ff','#8fd19e','#ffb13b'][i%5]});
  else if(kind==='steam')S.parts.push({x:p.x*SS+(Math.random()-.5)*30,y:p.y*SS,vx:(Math.random()-.5)*14,vy:-30-Math.random()*25,life:1.2,r:6,c:'rgba(255,255,255,.65)'});
  else if(kind==='leaf')S.parts.push({x:p.x*SS,y:p.y*SS,vx:60+Math.random()*90,vy:(Math.random()-.5)*50,life:1,r:3,c:'#8fd19e'});
  else S.parts.push({x:p.x*SS,y:p.y*SS,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.8,r:2.6,c:'#ffe58a'});}}
function slots(){const n=L.tools.length+1;const a=L.tools.map((t,i)=>({id:t.id,tool:t,x:VW*(i+.5)/n,y:SS+TRAY/2+4,r:36}));a.push({id:'preview',x:VW*(n-.5)/n,y:SS+TRAY/2+4,r:36});return a;}
/* ---------- drawing helpers ---------- */
const fnt=(sz,f)=>(f?'':'600 ')+sz+'px '+(f||FZ);
const GOALKO=['설날 가족사진','개업 기념사진','거실 단체사진','다락방 단체사진','장터 단체사진','바닷가 단체사진','우체국 단체사진','꽃가게 단체사진','언덕 단체사진','생일 단체사진','병문안 단체사진','딤섬 단체사진','도서관 단체사진','야시장 단체사진','빗속 단체사진','친구들 단체사진','야시장 불빛','음악회 단체사진','장터 큰 단체사진','온 동네 단체사진','수박 파티 단체사진','반딧불이 단체사진','빨래 날 단체사진','빙수 가게 단체사진','연못 단체사진','추석 단체사진','낙엽 청소 단체사진','감 따기 단체사진','운동회 단체사진','풍년 장터 단체사진'];
const SPK={'刺刺':'콕콕이','团团':'탄탄','栗栗':'리리','滴滴':'방울이','墩墩':'둥둥','闪闪':'반짝','啄啄':'쫑쫑','小猫':'고양이','砰砰':'펑펑'};
const C={paper:'#fbefdc',ink:'#5b3520',soft:'#8a6448',red:'#d8473a',redd:'#a8332a',gold:'#f2b52c',goldd:'#bd8a1a',cream:'#fff8ec',line:'#e7cfa9',tray:'#f3dcb8'};
const FZ='"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Apple SD Gothic Neo","Malgun Gothic",sans-serif',FB='"PingFang SC","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
function rr(c,x,y,w,h,r){r=Math.max(0,Math.min(r,w/2,h/2));c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function tx(s,x,y,sz,col,al,mw,f){g.font=fnt(sz,f);g.fillStyle=col||C.ink;g.textAlign=al||'center';g.textBaseline='middle';if(mw)g.fillText(s,x,y,mw);else g.fillText(s,x,y);}
const WR={};function lines(s,mw,sz,f){const key=sz+'|'+mw+'|'+(f?1:0)+'|'+s;if(WR[key])return WR[key];g.font=fnt(sz,f);const out=[];for(const pa of String(s).split('\n')){let line='';for(const ch of pa){if(line&&g.measureText(line+ch).width>mw){out.push(line);line=ch;}else line+=ch;}out.push(line);}return WR[key]=out;}
function para(s,x,y,mw,sz,col,al,lh,f){const ls=lines(s,mw,sz,f);ls.forEach((l,i)=>tx(l,x,y+i*lh,sz,col,al,0,f));return ls.length*lh;}
function sprite(c,n,x,y,w,o){o=o||{};const im=ART[n];if(!im)return;const h=o.h||w*im.height/im.width;c.save();c.globalAlpha=o.a===undefined?1:o.a;c.translate(x,y);c.rotate(o.r||0);c.scale(o.sx||1,o.sy||1);c.drawImage(im,-w/2,-h/2,w,h);c.restore();}
function pic(n,x,y,sz,r){const im=ART[n];if(!im)return;const k=Math.min(sz/im.width,sz/im.height);sprite(g,n,x,y,im.width*k,{r:r||0});}
/* buttons and scrolling: regions are rebuilt every frame while drawing */
let BT=[],PRESS=null,SCR=null,SY=0,CLIP=null;
function hit(id,x,y,w,h,cb){y-=SY;if(CLIP){const y1=Math.max(y,CLIP.y),y2=Math.min(y+h,CLIP.y+CLIP.h);if(y2-y1<14)return;y=y1;h=y2-y1;}BT.push({id,x,y,w,h,cb});}
function btn(id,x,y,w,h,label,st,cb,sz){const dn=PRESS===id?3:0;const q=st==='red'?[C.red,C.redd,'#fff']:st==='gold'?[C.gold,C.goldd,C.ink]:st==='off'?['#eadfca','#d9c9a9','#b09a7c']:st==='paper'?[C.paper,C.line,C.ink]:[C.cream,C.line,C.ink];const r=Math.min(14,h/2.6);
 g.fillStyle=q[1];rr(g,x,y+4,w,h,r);g.fill();g.fillStyle=q[0];rr(g,x,y+dn,w,h,r);g.fill();if(label)tx(label,x+w/2,y+h/2+dn+1,sz||17,q[2],'center',w-8);hit(id,x,y,w,h+4,cb);return dn;}
function dim(a,cb){g.fillStyle='rgba(70,38,20,'+(a===undefined?.72:a)+')';g.fillRect(-W-OX/K,-H,W*3+2*OX/K,H*3);BT=[];SCR=null;hit('_',-999,-999,9999,9999,cb||null);}
function box(x,y,w,h,gold){g.fillStyle='rgba(60,30,10,.25)';rr(g,x,y+5,w,h,16);g.fill();if(gold){g.fillStyle=C.gold;rr(g,x-3,y-3,w+6,h+6,18);g.fill();}g.fillStyle=C.cream;rr(g,x,y,w,h,16);g.fill();}
function scrollBegin(st,x,y,w,h,ch){st.max=Math.max(0,ch-h);st.y=Math.max(0,Math.min(st.max,st.y||0));SCR={x,y,w,h,st};g.save();g.beginPath();g.rect(x,y,w,h);g.clip();g.translate(0,-st.y);SY=st.y;CLIP={y,h};}
function scrollEnd(){g.restore();SY=0;CLIP=null;if(SCR&&SCR.st.max>0){const s=SCR,k=s.h/(s.h+s.st.max);g.fillStyle='rgba(91,53,32,.25)';rr(g,s.x+s.w-4,s.y+s.st.y/s.st.max*(s.h-s.h*k),3,s.h*k,2);g.fill();}}
/* ---------- scene ---------- */
function scene(c,ox,oy,s,st,v,tmp,fxs,rots,mood,found,photo){const t=now()/1000;
 if(ART[st.bg])c.drawImage(ART[st.bg],ox,oy,s,s);else{c.fillStyle='#e9c9a0';c.fillRect(ox,oy,s,s);}
 if(st.tint){c.fillStyle=st.tint;c.fillRect(ox,oy,s,s);}
 const list=st.objs.slice().sort((a,b)=>(a.z||0)-(b.z||0));let drawn=false;
 const lili=()=>{if(!st.lili)return;drawn=true;const k={joy:'lili_joy',shock:'lili_shock',worry:'lili_worry'}[mood]||'lili_basic';const lw=st.lili[2];c.fillStyle='rgba(90,50,20,.17)';c.beginPath();c.ellipse(ox+st.lili[0]*s,oy+(st.lili[1]+lw*.56)*s,lw*s*.4,lw*s*.08,0,0,7);c.fill();sprite(c,k,ox+st.lili[0]*s,oy+st.lili[1]*s,lw*s);};
 for(const o of list){if(!drawn&&(o.z||0)>2)lili();if(o.hot)continue;const w=view(o,v,tmp);if(w.hide||!w.img)continue;const f=!photo&&fxs[o.id]>0?Math.sin(t*34)*.09*Math.min(1,fxs[o.id]*2):0;let dy=0,r=w.rot+f+(rots&&rots[o.id]||0);if(!photo&&o.anim==='bob'&&!w.still)dy=Math.sin(t*3+o.x*9)*.012;if(!photo&&o.anim==='shake'&&!cond(o.calm,v))r+=Math.sin(t*26)*.12;if(w.y>.48&&!w.h&&ART[w.img]){const ih=w.w*ART[w.img].height/ART[w.img].width;c.fillStyle='rgba(90,50,20,.16)';c.beginPath();c.ellipse(ox+w.x*s,oy+(w.y+ih*.47)*s,Math.max(.1,w.w*s*.42),Math.max(.1,ih*s*.08),0,0,7);c.fill();}sprite(c,w.img,ox+w.x*s,oy+(w.y+dy)*s,w.w*s,{r,h:w.h?w.h*s:0});}
 if(st.wall)for(let i=0;i<5;i++){const x=ox+(.25+i*.125)*s,y=oy+.27*s,w=.105*s;c.fillStyle='#fff8ec';c.strokeStyle='#8a5a37';c.lineWidth=s/260;c.fillRect(x-w/2,y-w/2,w,w*1.1);c.strokeRect(x-w/2,y-w/2,w,w*1.1);const q=WALL[i];if(q)c.drawImage(q,x-w*.44,y-w*.44,w*.88,w*.88);else{c.fillStyle='#ead7b6';c.fillRect(x-w*.44,y-w*.44,w*.88,w*.88);}}
 if(!drawn)lili();
 if(st.dark){const a=st.dark.a*(st.dark.off&&cond(st.dark.off,v)?0:1)*(st.dark.fade?1-probsDoneOf(st,v)/allP(st).length*.85:1);if(a>.01){c.fillStyle='rgba(12,14,48,'+a+')';c.fillRect(ox,oy,s,s);}}
 if(st.rain){c.strokeStyle='rgba(190,220,255,.55)';c.lineWidth=s/300;for(let i=0;i<46;i++){const x=(i*37.3%100)/100,y=((i*61.7+(photo?0:t*90))%100)/100;c.beginPath();c.moveTo(ox+x*s,oy+y*s);c.lineTo(ox+(x-.012)*s,oy+(y+.05)*s);c.stroke();}}
 if(photo&&found&&st.hid)sprite(c,st.hid,ox+.92*s,oy+.09*s,.09*s,{r:.12});
 if(photo&&st.fog&&!cond(st.fog,v)){const gr=c.createRadialGradient(ox+s/2,oy+s/2,s*.34,ox+s/2,oy+s/2,s*.72);gr.addColorStop(0,'rgba(240,244,248,0)');gr.addColorStop(1,'rgba(240,244,248,.82)');c.fillStyle=gr;c.fillRect(ox,oy,s,s);}}
let WALL=[];function shot(st,l,sz){const c=mk(sz,sz);photoInto(c.getContext('2d'),sz,st,vFrom(st,l),l.found,l.zoom);return c;}
function buildWall(){WALL=[];const pool=Object.assign({},SAVE.last,SAVE.bestShot||{});const ids=Object.keys(pool).map(Number).filter(i=>i!==20).sort((a,b)=>b-a).slice(0,5);for(const id of ids){const st=STAGES.find(q=>q.id===id);if(st)WALL.push(shot(st,pool[id],170));}}
function bubble(b){const zh=LANG==='ko'?b.t[1]:b.t[0],ko='',a=Math.min(1,b.life*3);g.save();g.globalAlpha=a;g.font=fnt(18);const w1=g.measureText(zh).width;g.font=fnt(11,FB);const w=Math.min(VW-8,Math.max(w1,ko?g.measureText(ko).width:0)+26),h=ko?50:36;const x=Math.max(w/2+4,Math.min(VW-w/2-4,b.x)),y=Math.max(30,Math.min(SS-30,b.y)),tp=y-h/2;
 g.fillStyle='#fffdf7';g.strokeStyle=C.ink;g.lineWidth=2.5;const tx0=Math.max(x-w/2+22,Math.min(x+w/2-22,b.x));rr(g,x-w/2,tp,w,h,16);g.fill();g.stroke();g.beginPath();g.moveTo(tx0-9,tp+h-3);g.lineTo(tx0,tp+h+9);g.lineTo(tx0+9,tp+h-3);g.closePath();g.fill();g.beginPath();g.moveTo(tx0-9,tp+h-2);g.lineTo(tx0,tp+h+9);g.lineTo(tx0+9,tp+h-2);g.stroke();
 tx(zh,x,ko?y-7:y+1,18,C.ink,'center',w-10);if(ko)tx(ko,x,y+13,11,C.soft,'center',w-10,FB);g.restore();}
function zoneMark(x,y,r){g.save();g.setLineDash([7,6]);g.lineWidth=3;g.strokeStyle='rgba(255,246,190,.95)';g.beginPath();g.ellipse(x*SS,y*SS,r*SS,r*SS*.72,0,0,7);g.stroke();g.restore();}
function finger(x,y){g.save();g.strokeStyle='rgba(255,255,255,.95)';g.lineWidth=4;g.beginPath();g.arc(x,y,17,0,7);g.stroke();g.strokeStyle='rgba(216,71,58,.9)';g.lineWidth=2;g.stroke();g.translate(x+7,y+10);g.rotate(-.35);g.fillStyle='#fff8ec';g.strokeStyle=C.ink;g.lineWidth=2.5;rr(g,-7,0,14,30,7);g.fill();g.stroke();rr(g,-13,16,26,22,9);g.fill();g.stroke();g.fillStyle='#fff8ec';g.fillRect(-5.5,12,11,12);g.restore();}
function guide(){if(L.id!==1||SAVE.tut||S.cardT>0||S.phase!=='playing')return;if(probsDone(S.v)>=2){SAVE.tut=1;persist();toast(T('做得好！随时都可以拍照哦','잘했어요! 언제든 촬영할 수 있어요'),2800);track('tut_done');return;}if(S.q.length||S.drag||S.g)return;const r=nextRule()[0];if(!r)return;const o=obj(r.t),w=view(o,S.v,S.tmp);let ex=w.x*SS,ey=w.y*SS,fx=ex,fy=ey;
 if(r.tool){const q=slots().find(q=>q.id===r.tool);fx=q.x;fy=q.y;}else if(r.on==='drag'){ex=r.to[0]*SS;ey=r.to[1]*SS;}else if(r.on==='rot'){ex+=r.goal/1.6*SS;}else if(r.on==='swipe'){const D={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[r.dir];ex+=D[0]*.1*SS;ey+=D[1]*.1*SS;}
 const k=(now()/1500)%1,mv=fx!==ex||fy!==ey,e=mv?Math.min(1,k*1.5):0;finger(fx+(ex-fx)*e,fy+(ey-fy)*e+(mv?0:Math.sin(k*6.28)*5));}
function drawPlayArea(){g.save();g.translate(PX,PY);g.save();rr(g,0,0,SS,SS,14);g.clip();
 scene(g,0,0,SS,L,S.v,S.tmp,S.fx,S.rot,S.mood,S.found,false);
 if(L.diff.zones&&S.g&&S.g.to&&S.g.moving){const z=S.g.to;zoneMark(z[0],z[1],z[2]);}if(S.zone&&S.zone.t>0&&L.id===1)zoneMark(S.zone.x,S.zone.y,S.zone.r);
 for(const f of S.fly)if(f.img){const k=Math.min(1,f.t/f.dur);sprite(g,f.img,(f.x0+(f.x1-f.x0)*k)*SS,(f.y0+(f.y1-f.y0)*k-Math.sin(k*3.14)*f.arc)*SS,f.w*SS);}
 for(const q of S.parts){g.globalAlpha=Math.max(0,Math.min(1,q.life*2));g.fillStyle=q.c;g.beginPath();g.arc(q.x,q.y,q.r,0,7);g.fill();}g.globalAlpha=1;
 if(S.hold){const p=S.hold;g.strokeStyle='#ffd94a';g.lineWidth=6;g.lineCap='round';g.beginPath();g.arc(p.x,p.y,30,-1.57,-1.57+6.28*Math.min(1,p.k));g.stroke();}
 if(S.area&&S.area.t>0){const a=S.area,gl=g.createRadialGradient(a.x*SS,a.y*SS,SS*.04,a.x*SS,a.y*SS,SS*.33),al=Math.min(1,a.t)*.42;gl.addColorStop(0,'rgba(255,240,170,'+al+')');gl.addColorStop(1,'rgba(255,240,170,0)');g.fillStyle=gl;g.fillRect(0,0,SS,SS);}
 if(S.hint>0&&S.hintR){const q=S.hintR,k=(now()/600)%1;g.strokeStyle='rgba(255,80,80,'+(1-k*.6)+')';g.lineWidth=4;g.beginPath();g.arc(q.x*SS,q.y*SS,(q.r||.1)*SS*(1+k*.2),0,7);g.stroke();}
 g.restore();
 const tg=g.createLinearGradient(0,SS+6,0,SS+TRAY);tg.addColorStop(0,'#c98d55');tg.addColorStop(.12,'#b9783f');tg.addColorStop(1,'#9c6130');g.fillStyle=tg;rr(g,0,SS+6,VW,TRAY-8,16);g.fill();g.fillStyle='rgba(255,235,200,.28)';g.fillRect(14,SS+9,VW-28,2);
 for(const s of slots()){if(s.id==='preview'){g.save();g.translate(s.x,s.y);g.rotate(-.05);g.fillStyle='rgba(60,30,10,.3)';g.fillRect(-31,-30,66,68);g.fillStyle='#fffaf0';g.fillRect(-33,-34,66,68);g.drawImage(pvC,-29,-30,58,54);g.fillStyle='rgba(242,181,44,.75)';g.fillRect(-13,-39,26,10);g.restore();continue;}
  const have=cond(s.tool.have,S.v);g.fillStyle='rgba(60,30,10,.28)';g.beginPath();g.arc(s.x,s.y+1,31,0,7);g.fill();g.fillStyle='#f3e0bf';g.beginPath();g.arc(s.x,s.y,28,0,7);g.fill();if(!have){tx('?',s.x,s.y+1,24,'#a67f5a');continue;}
  if(S.drag&&S.drag.id===s.id)continue;if(S.hint>0&&S.hintTool===s.id){g.strokeStyle='rgba(255,80,80,.9)';g.lineWidth=4;g.beginPath();g.arc(s.x,s.y,33,0,7);g.stroke();}pic(s.tool.img,s.x,s.y,50);}
 if(S.drag)pic(S.drag.img,S.drag.x,S.drag.y,74,.08);
 guide();if(S.bubble)bubble(S.bubble);
 if(S.flash>0){g.fillStyle='rgba(255,255,255,'+Math.min(1,S.flash*3)+')';g.fillRect(-PX,-PY,W,H);}g.restore();}
/* ---------- play input (coordinates are relative to the scene's top-left) ---------- */
function objAt(nx,ny,tool){const list=L.objs.filter(o=>{const w=view(o,S.v,S.tmp);return o.hot?(!o.show||cond(o.show,S.v)):!w.hide;}).sort((a,b)=>(b.z||0)-(a.z||0));let best=null,bd=9;
 for(const o of list){const w=view(o,S.v,S.tmp);const r=o.r||Math.max(.055,(w.w||.1)*.55);const d=Math.hypot(nx-w.x,ny-w.y);if(d<r){const has=L.rules.some(q=>q.t===o.id&&cond(q.if,S.v)&&(tool?q.tool===tool:!q.tool));const score=d/r-(has?1:0);if(score<bd){bd=score;best=o;}}}return best;}
function gameDown(p){S.idle=0;for(const s of slots())if(Math.hypot(p.x-s.x,p.y-s.y)<s.r){if(s.id==='preview'){openPV();return;}if(!cond(s.tool.have,S.v))continue;S.drag={id:s.id,img:s.tool.img,x:p.x,y:p.y-34,lx:p.x,ly:p.y};tone('tap');return;}
 const nx=p.x/SS,ny=p.y/SS;if(ny>1||ny<0||nx<0||nx>1)return;const o=objAt(nx,ny);if(!o)return;const rs=L.rules.filter(r=>r.t===o.id&&!r.tool&&cond(r.if,S.v));const ges=rs.find(r=>['drag','swipe','rot','hold'].includes(r.on));
 S.g={o,x:p.x,y:p.y,moved:0,ges,rs,t0:now(),to:ges&&ges.on==='drag'?ges.to:null,r0:S.rot[o.id]||0};if(ges&&ges.on==='hold')S.hold={x:p.x,y:p.y,k:0};}
function gameMove(p){const G=S.g;if(G){G.moved=Math.max(G.moved,Math.hypot(p.x-G.x,p.y-G.y));if(G.ges&&G.ges.on==='drag'&&G.moved>8){S.tmp[G.o.id]=Object.assign({},S.tmp[G.o.id],{x:p.x/SS,y:p.y/SS});G.moving=true;}
  if(G.ges&&G.ges.on==='rot'&&G.moved>4){S.rot[G.o.id]=Math.max(-.9,Math.min(.9,G.r0+(p.x-G.x)/SS*1.6));const r=G.ges;if(r.over!==undefined&&S.rot[G.o.id]<r.goal+r.over&&!G.warned){G.warned=true;if(r.overDo)enqueue(r.overDo);}}return;}
 const d=S.drag;if(!d)return;const dist=Math.hypot(p.x-d.lx,p.y-d.ly);d.x=p.x;d.y=p.y-34;d.lx=p.x;d.ly=p.y;const o=objAt(d.x/SS,d.y/SS,d.id);if(!o)return;const r=find('rub',o.id,d.id);if(!r)return;const key=r.id;S.rub[key]=(S.rub[key]||0)+dist;if(Math.random()<.3)S.parts.push({x:d.x,y:d.y+14,vx:(Math.random()-.5)*50,vy:-30,life:.4,r:3,c:'#fff'});if(S.rub[key]>(r.need||L.diff.rub)){S.rub[key]=0;if(fire(r))S.rubbed=now();}}
function gameUp(p){if(!S||S.phase!=='playing')return;const G=S.g;if(G){S.g=null;S.hold=null;const o=G.o,r=G.ges;const dx=(p.x-G.x)/SS,dy=(p.y-G.y)/SS;
  if(r&&r.on==='drag'&&G.moving){const w=S.tmp[o.id];const ok=Math.hypot(w.x-r.to[0],w.y-r.to[1])<r.to[2]+L.diff.slack;delete S.tmp[o.id];if(ok)fire(r);else tone('nope');return;}
  if(r&&r.on==='rot'&&G.moved>=6){const a=S.rot[o.id];if(Math.abs(a-r.goal)<(r.tol||.12)){delete S.rot[o.id];fire(r);}else refreshPV();return;}
  if(r&&r.on==='swipe'&&G.moved>16){const ok=r.dir==='up'?dy<-.05:r.dir==='down'?dy>.05:r.dir==='left'?dx<-.05:dx>.05;if(ok){fire(r);return;}S.fx[o.id]=.5;return;}
  if(G.moved<12){const t=G.rs.find(q=>q.on==='tap');if(t){tone(/cat/.test(view(o,S.v,S.tmp).img||'')?'meow':'tap');fire(t);}else{S.fx[o.id]=.5;tone('tap');}}return;}
 const d=S.drag;if(!d)return;S.drag=null;const o=objAt(d.x/SS,d.y/SS,d.id);if(!o)return;const r=find('use',o.id,d.id);if(r){fire(r);return;}if(now()-(S.rubbed||0)<400)return;if(!find('rub',o.id,d.id)){const t=L.tools.find(q=>q.id===d.id);S.fx[o.id]=.6;tone('nope');if(t.miss){const w=view(o,S.v,S.tmp);S.bubble={t:t.miss,x:w.x*SS,y:(w.y-.13)*SS,life:1.5};}}}
/* ---------- hints ---------- */
function nextRule(){const shown=r=>{const o=obj(r.t);return !o||!o.show||cond(o.show,S.v);};return L.rules.filter(r=>cond(r.if,S.v)&&shown(r)&&(!r.tool||cond(L.tools.find(t=>t.id===r.tool).have,S.v))&&r.do.some(d=>d[0]==='set'&&!S.v[d[1]]));}
function mainRule(){const rs=nextRule();return rs.filter(r=>r.do.some(d=>d[0]==='set'&&allP(L).some(p=>p.id===d[1])))[0]||rs[0];}
function detailHint(){const r=mainRule();if(!r)return;const o=obj(r.t),w=view(o,S.v,S.tmp);S.fx[o.id]=1.4;S.hintR={x:w.x,y:w.y,r:o.r||Math.max(.07,(w.w||.1)*.6)};S.hint=4;S.hintTool=r.tool||null;}
function useHint(){if(!S||S.phase!=='playing')return;if(S.hints>0||S.detailReady)tone('hint');if(S.detailReady){S.detailReady=0;detailHint();return;}if(S.hints<=0){if(S.hintAd){tone('nope');return;}ask('看广告，获得详细提示','광고 보고 자세한 힌트 받기',()=>requestRewarded('hint',()=>{S.hintAd=true;detailHint();}));return;}const r=mainRule();if(!r)return;S.hints--;const o=obj(r.t),w=view(o,S.v,S.tmp);S.fx[o.id]=1.4;if(L.diff.ring){S.hintR={x:w.x,y:w.y,r:o.r||Math.max(.07,(w.w||.1)*.6)};S.hint=2.8;S.hintTool=L.diff.toolRing?(r.tool||null):null;}}
function idleNudge(){const rs=nextRule();if(!rs.length)return;S.fx[rs[Math.floor(Math.random()*rs.length)].t]=.8;}
/* ---------- photo ---------- */
const pvC=mk(480,480),RESC=mk(640,640);
function decorate(c,sz,st,v){const n=probsDoneOf(st,v),tot=allP(st).length;if(n>=Math.ceil(tot*.6)){const y=sz*.012,w=sz/9;for(let i=0;i<9;i++){c.fillStyle=['#e8524a','#f2b52c','#7fc9a2','#7cc0ee'][i%4];c.beginPath();c.moveTo(i*w+w*.08,y);c.lineTo((i+1)*w-w*.08,y);c.lineTo((i+.5)*w,y+sz*.075);c.closePath();c.fill();}c.strokeStyle='#fff8ec';c.lineWidth=sz/170;c.beginPath();c.moveTo(0,y);c.lineTo(sz,y);c.stroke();}
 if(n===tot){const P=['#ffd94a','#ff8fa3','#9fd3ff','#8fd19e','#ffb13b'];for(let i=0;i<70;i++){const x=(i*73.7%100)/100*sz,y=(i*41.3%62)/100*sz+sz*.09;c.fillStyle=P[i%5];c.save();c.translate(x,y);c.rotate(i);c.fillRect(-sz/110,-sz/190,sz/55,sz/95);c.restore();}if(ART.tt_cheer){const w=sz*.2,h=w*ART.tt_cheer.height/ART.tt_cheer.width;c.drawImage(ART.tt_cheer,sz*.04,sz*.97-h,w,h);}c.strokeStyle='#f2b52c';c.lineWidth=sz/42;c.strokeRect(sz/84,sz/84,sz-sz/42,sz-sz/42);}}
function commitMood(v,st){const n=probsDoneOf(st,v);return n>=allP(st).length*.6?'joy':n>=1?'basic':'shock';}
function photoInto(c,sz,st,v,found,zoom,keepRot){c.save();c.clearRect(0,0,sz,sz);if(zoom){const z=1.55,cx=(st.comp&&st.comp[0])||.5,cy=(st.comp&&st.comp[1])||.55;c.translate(sz/2-cx*sz*z,sz/2-cy*sz*z);c.scale(z,z);}scene(c,0,0,sz,st,v,{},{},keepRot||{},commitMood(v,st),found,true);c.restore();decorate(c,sz,st,v);}
function refreshPV(){if(!S)return;photoInto(pvC.getContext('2d'),480,L,S.v,S.found,S.comp,S.rot);}
function openPV(){refreshPV();openM('pv');}
function titleOf(st,mask){if(st.titles[mask])return st.titles[mask];const u=st.probs.filter((p,i)=>mask[i]==='1');return [u.map(p=>p.f[0]).join('，')+'！',u.map(p=>p.f[1]).join(', ')+'!'];}
let RES=null,LAST=null;
function capture(reason){if(!S||S.phase!=='playing')return;S.phase='capturing';S.g=null;S.drag=null;S.hold=null;S.q=[];S.tmp={};closeM('pv');const v=JSON.parse(JSON.stringify(S.v)),mask=L.probs.map(p=>v[p.id]?'0':'1').join(''),found=S.found,zoom=S.comp,rots=Object.assign({},S.rot),stg=L;
 S.bubble={t:reason==='timeout'?['时间到！就拍现在的样子！','시간 됐다! 지금 모습 그대로 찰칵!']:['就是现在！咔嚓！','지금 이 순간이 좋아! 찰칵!'],x:VW/2,y:SS/2,life:1.2};tone('shutter');S.flash=.55;
 setTimeout(()=>{if(!S||L!==stg)return;photoInto(RESC.getContext('2d'),640,L,v,found,zoom,rots);const t=titleOf(L,mask),hadFound=!!SAVE.found[L.id],wasOpen=unlocked(S.i+1),A=SAVE.alb[L.id]=SAVE.alb[L.id]||{};const first=!A[mask];A[mask]=A[mask]||{n:0};A[mask].n++;const xs=(L.extra||[]).map(p=>v[p.id]?'1':'0').join(''),tot=allP(L).length,doneN=allP(L).filter(p=>v[p.id]).length;SAVE.last[L.id]={mask,found,zoom,x:xs};if(found)SAVE.found[L.id]=1;
  const dn0=doneN===tot?5:Math.min(4,Math.floor(doneN/tot*5)),prevBest=(SAVE.best=SAVE.best||{})[L.id]||0;if(dn0>prevBest)SAVE.best[L.id]=dn0;track('stage_photo',{stage:L.id,done:doneN,total:tot,reason});if(doneN===tot)track('stage_gold',{stage:L.id});const gotI=earnItems(dn0===5&&prevBest<5,found&&!hadFound);const bk=SAVE.bestShot=SAVE.bestShot||{};if(!bk[L.id]||dn0>=bk[L.id].n)bk[L.id]={mask,found,zoom,n:dn0,x:xs};
  let tag=(first?T('新照片！','새 사진 기록!'):T('同样的照片第'+A[mask].n+'次','같은 사진 '+A[mask].n+'번째'))+' · '+T('相册','사진첩')+' '+Object.keys(A).length+'/32'+(found?T(' · 获得隐藏贴纸',' · 숨은 스티커 획득'):'')+(dn0<5?T(' · 再解决'+(tot-doneN)+'个就有金色照片！',' · '+(tot-doneN)+'개 더 해결하면 황금 사진!'):'')+(gotI.length?T(' · 获得 ',' · 아이템 ')+gotI.join(', '):'');
  AD.sinceI++;AD.launchFirst=false;AD.miss=doneN<tot?AD.miss+1:0;let offer=false;if(AD.miss>=3){AD.next.free=1;tag+=T(' · 下次拍照送1个提示',' · 다음 촬영에 무료 힌트 1개 추가');if(!AD.offered[L.id]&&adOK()){AD.offered[L.id]=1;offer=true;}}
  if(!wasOpen&&STAGES[S.i+1]&&unlocked(S.i+1))setTimeout(()=>{tone('unlock');toast(T('新的关卡开放了！','새 단계가 열렸어요!'));},1500);tone('print');RES={t0:now(),title:t,tag,tier:dn0===5?3:dn0>=3?2:dn0>=1?1:0,gold:dn0===5,doneN,tot,offer,stage:L};S.phase='result';openM('result');
  if(dn0===5){tone('gold');confetti();if(!SAVE.seen||!SAVE.seen[L.id]){SAVE.seen=SAVE.seen||{};SAVE.seen[L.id]=1;setTimeout(()=>{if(L===stg&&topM()==='result')openStory(stg);},2100);}}
  const md=[prog('photo',1),prog('solve',doneN),first&&prog('newp',1),dn0===5&&prog('gold',1),found&&prog('found',1),prog('stages',1,L.id)].some(Boolean);if(md)setTimeout(()=>toast(T('每日任务完成！回首页领取奖励','오늘의 미션 완료! 홈에서 보상을 받으세요'),2600),dn0===5?400:1200);
  persist();LAST={stage:L.id,mask,title:t,reason,n:(LAST?LAST.n:0)+1};},750);}
/* ---------- story ---------- */
let STX=null,STC=null;
function openStory(st){ensure(st.endArt?[st.endArt]:stageKeys(st),()=>{STC=null;if(!(st.endArt&&ART[st.endArt])){const v=blank(st);allP(st).forEach(p=>{v[p.id]=true;});STC=mk(480,480);photoInto(STC.getContext('2d'),480,st,v,false,false);}STX={st,i:0,t0:now()};openM('story');music('story');});}
/* ---------- intro ---------- */
const INTRO=[{p:['lili_joy','tuantuan','cat_dry'],t:'欢迎来到团团小镇',kt:'탄탄 동네에 온 걸 환영해요',z:'新来的栗栗总是闹出小乱子，团团会帮大家拍下每一刻。',k:'새로 온 리리는 늘 작은 소동을 일으키고, 탄탄은 그 순간을 사진으로 남겨요.'},
 {p:['hanky','dundun','zhuozhuo'],t:'找到麻烦，动手解决',kt:'소동을 찾아 해결해요',z:'点一点、拖一拖，捡到的东西会放进下面的背包，再拖到需要的地方。',k:'누르고 끌어서 문제를 해결하세요. 주운 물건은 아래 가방에 들어가고, 필요한 곳으로 끌어다 쓸 수 있어요.'},
 {p:['flashlight','clock','fu'],t:'用道具帮帮忙',kt:'도구로 도와줘요',z:'手电筒照亮大概位置，加时钟多20秒，稀有的福气贴能解决一个麻烦。',k:'손전등은 대략적인 위치를, 시계는 20초를, 귀한 복 스티커는 문제 하나를 해결해 줘요.'},
 {p:['cam_clear','paw','lili_basic'],t:'什么时候拍都可以',kt:'언제든 찍을 수 있어요',z:'解决越多照片越好看，全部解决就有金色照片和小故事！',k:'언제든 찍을 수 있어요. 모두 풀면 황금 사진과 이야기가 열려요.'}];
let INI=0;function showIntro(i){INI=i;INTRO.forEach(q=>q.p.forEach(n=>loadImg(n)));M=M.filter(x=>x!=='set');openM('intro');}
function closeIntro(){track('guide_done');closeM('intro');SAVE.intro=1;persist();}
/* ---------- items: earned by playing, never by a draw ---------- */
const ITEMS=[['light','flashlight','手电筒','손전등'],['clock','clock','加时钟','시계'],['fu','fu','福气贴','복 스티커']];
function bag(){SAVE.items=SAVE.items||{light:2,clock:1,fu:0,v:2};if(SAVE.items.v!==2){SAVE.items.fu=0;SAVE.items.v=2;}return SAVE.items;}
function useItem(k){if(!S||S.phase!=='playing'||S.paused)return;const b=bag();if(b[k]<=0||S.used[k]){tone('nope');return;}if(k==='light'&&!nextRule().length){tone('nope');return;}if(k==='fu'&&probsDone(S.v)===allP(L).length){tone('nope');return;}b[k]--;S.used[k]=1;tone(k==='clock'?'clock':k==='light'?'hint':'gold');if(prog('item',1))toast(T('每日任务完成！','오늘의 미션 완료!'));persist();
 if(k==='light'){const rs=nextRule(),r=rs[Math.floor(Math.random()*rs.length)],w=view(obj(r.t),S.v,S.tmp);S.area={x:w.x<.5?.27:.73,y:w.y<.5?.27:.73,t:2.2};S.bubble={t:['好像在这附近……','이 근처인 것 같아…'],x:VW/2,y:SS*.5,life:1.4};}
 else if(k==='clock'){S.t+=20;S.bubble={t:['时间多了20秒！','시간이 20초 늘었어!'],x:VW/2,y:SS*.2,life:1.3};}
 else{const p=allP(L).find(q=>!S.v[q.id]);runOp(['set',p.id]);S.bubble={t:['福气到，麻烦解决！','복이 왔다, 문제 해결!'],x:VW/2,y:SS*.2,life:1.4};}}
function earnItems(first5,firstFound){const b=bag(),got=[];if(first5){b.light++;got.push(T('手电筒 +1','손전등 +1'));}if(firstFound){b.clock++;got.push(T('加时钟 +1','시계 +1'));}const gold=Object.values(SAVE.best||{}).filter(x=>x===5).length;if(first5&&(gold===10||gold===20)){b.fu++;got.push(T('福气贴 +1','복 스티커 +1'));}return got;}
/* ---------- daily sign-in: fixed rewards, no draw ---------- */
const SIGN=[['light',1],['clock',1],['light',1],['clock',1],['light',2],['clock',2],['light',3]];let SIGNDAY=0;
const dayStr=d=>d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
function maybeSign(){if(!Object.keys(SAVE.alb).length||M.length)return;const d=new Date(),sg=SAVE.sign=SAVE.sign||{day:0,last:''};if(sg.last===dayStr(d))return;SIGNDAY=sg.last===dayStr(new Date(d-864e5))?sg.day%7+1:1;openM('sign');}
function signGet(){const q=SIGN[SIGNDAY-1];bag()[q[0]]+=q[1];SAVE.sign={day:SIGNDAY,last:dayStr(new Date())};persist();closeM('sign');tone('reward');track('signin',{day:SIGNDAY});toast(T('领取成功！明天再来哦','받았어요! 내일 또 만나요'));}

/* ---------- missions: 3 a day (same 3 for everyone that day) + long-term goals. Rewards are flashlight / clock only. ---------- */
const MPOOL={photo:[3,'拍3张照片','사진 3장 찍기'],solve:[15,'解决15个小麻烦','소동 15개 해결하기'],newp:[2,'拍到2张新照片','새로운 사진 2장 찍기'],gold:[1,'拍1张金色照片','황금 사진 1장 찍기'],found:[1,'找到隐藏贴纸并拍下来','숨은 스티커 찾아서 찍기'],stages:[2,'在2个不同的关卡拍照','서로 다른 2개 단계에서 찍기'],item:[1,'使用1次道具','아이템 1번 쓰기']};
const MREW=['light','clock','light'];
function hashS(t){let h=7;for(const c of t)h=(h*31+c.charCodeAt(0))>>>0;return h;}
function daily(){const d=dayStr(new Date());let m=SAVE.dm;if(!m||m.day!==d){const rest=Object.keys(MPOOL).filter(k=>k!=='photo');let h=hashS(d);const pick=['photo'];let guard=0;while(pick.length<3&&guard++<50){const k=rest[h%rest.length];h=(Math.imul(h,1103515245)+12345)>>>0;if(!pick.includes(k))pick.push(k);}m=SAVE.dm={day:d,list:pick.map((k,i)=>({k,n:0,c:0,r:MREW[i]})),bonus:0,st:[]};}return m;}
function prog(k,v,id){const m=daily();let done=false;for(const q of m.list){if(q.k!==k||q.n>=MPOOL[k][0])continue;if(k==='stages'){if(!m.st.includes(id))m.st.push(id);q.n=Math.min(MPOOL[k][0],m.st.length);}else q.n=Math.min(MPOOL[k][0],q.n+v);if(q.n>=MPOOL[k][0]){done=true;track('mission_done',{k});}}return done;}
const goldN=()=>Object.values(SAVE.best||{}).filter(x=>x===5).length,foundN=()=>Object.keys(SAVE.found).length,stageN=()=>Object.keys(SAVE.alb).filter(k=>Object.keys(SAVE.alb[k]).length).length;
function photoN(){let t=0;for(const k in SAVE.alb)t+=Object.keys(SAVE.alb[k]).length;return t;}
const ACH=[['g5',goldN,5,'集齐5张金色照片','황금 사진 5장 모으기','light',2],['g10',goldN,10,'集齐10张金色照片','황금 사진 10장 모으기','clock',2],['g15',goldN,15,'集齐15张金色照片','황금 사진 15장 모으기','light',3],['g20',goldN,20,'集齐全部20张金色照片','황금 사진 20장 모두 모으기','clock',3],
 ['f5',foundN,5,'找到5个隐藏贴纸','숨은 스티커 5개 찾기','clock',1],['f10',foundN,10,'找到10个隐藏贴纸','숨은 스티커 10개 찾기','light',2],['f20',foundN,20,'找到全部20个隐藏贴纸','숨은 스티커 20개 모두 찾기','clock',2],
 ['p30',photoN,30,'相册里有30张照片','사진첩에 사진 30장','light',1],['p100',photoN,100,'相册里有100张照片','사진첩에 사진 100장','clock',2],['p200',photoN,200,'相册里有200张照片','사진첩에 사진 200장','light',3],
 ['s10',stageN,10,'在10个关卡拍过照','10개 단계에서 사진 찍기','clock',1],['s20',stageN,20,'走遍全镇20个地方','동네 20곳 모두 찍기','light',2]];
const IN=r=>r==='light'?T('手电筒','손전등'):T('加时钟','시계');
function give(list,x2){tone('reward');const b=bag();const t=list.map(([r,n])=>{n*=x2?2:1;b[r]+=n;return IN(r)+' +'+n;}).join('  ');persist();tone('good');toast(T('获得 ','받았어요: ')+t);}
function claimD(i,x2){const q=daily().list[i];if(q.c||q.n<MPOOL[q.k][0])return;const go=()=>{if(q.c)return;q.c=1;give([[q.r,1]],x2);track('mission_claim',{k:q.k,x2:x2?1:0});};if(x2)requestRewarded('mission',go);else go();}
function claimB(x2){const m=daily();if(m.bonus||m.list.some(q=>!q.c))return;const go=()=>{if(m.bonus)return;m.bonus=1;give([['light',1],['clock',1]],x2);track('mission_bonus',{x2:x2?1:0});};if(x2)requestRewarded('mission',go);else go();}
function claimA(a){SAVE.ach=SAVE.ach||{};if(SAVE.ach[a[0]]||a[1]()<a[2])return;SAVE.ach[a[0]]=1;give([[a[5],a[6]]]);track('ach_claim',{id:a[0]});}
function misDot(){const m=daily();if(m.list.some(q=>!q.c&&q.n>=MPOOL[q.k][0]))return true;if(!m.bonus&&m.list.every(q=>q.c))return true;const A=SAVE.ach||{};return ACH.some(a=>!A[a[0]]&&a[1]()>=a[2]);}
const MS={y:0};
function misRow(id,x,y,w,label,n,goal,rews,state,onClaim,onAd){g.fillStyle=state==='claim'?'#fff1c9':C.paper;rr(g,x,y,w,54,10);g.fill();const lw=w-136;tx(label,x+12,y+17,14,C.ink,'left',lw);
 const bw=lw-44;g.fillStyle=C.line;rr(g,x+12,y+35,bw,6,3);g.fill();g.fillStyle=n>=goal?C.gold:'#e8a64a';if(n>0){rr(g,x+12,y+35,Math.max(6,bw*Math.min(1,n/goal)),6,3);g.fill();}tx(Math.min(n,goal)+'/'+goal,x+18+bw,y+38,11,C.soft,'left',0,FB);
 let rx=x+w-128;rews.forEach(([r,c],i)=>{pic(r==='light'?'flashlight':'clock',rx+12,y+20,22);tx('×'+c,rx+12,y+42,11,C.ink);rx+=26;});
 const bx=x+w-74;if(state==='go')btn(id,bx,y+11,64,30,T('去完成','하러 가기'),'paper',()=>{closeM('mis');},13);else if(state==='done')btn(id,bx,y+11,64,30,T('已领取','받음'),'off',null,13);
 else if(onAd){btn(id,bx,y+4,64,22,T('领取','받기'),'gold',onClaim,13);const d=btn(id+'x2',bx,y+28,64,22,'','paper',onAd);g.fillStyle=C.red;g.beginPath();g.moveTo(bx+14,y+33+d);g.lineTo(bx+22,y+39+d);g.lineTo(bx+14,y+45+d);g.closePath();g.fill();tx(T('双倍','2배'),bx+40,y+39+d,12,C.ink);}
 else btn(id,bx,y+11,64,30,T('领取','받기'),'gold',onClaim,14);}
function drawMis(){dim();const m=daily(),A=SAVE.ach||{},bw=Math.min(350,W-30),bh=Math.min(H*.74,620),x=(W-bw)/2,y=(H-bh-60)/2,rw=bw-24;box(x,y,bw,bh);
 scrollBegin(MS,x+6,y+8,bw-12,bh-16,40+4*60+44+ACH.length*60+8);let yy=y+8;
 tx(T('每日任务','오늘의 미션'),x+14,yy+18,21,C.red,'left');tx(T('每天0点刷新','매일 0시에 바뀌어요'),x+bw-16,yy+20,11,C.soft,'right',0,FB);yy+=40;
 m.list.forEach((q,i)=>{const P=MPOOL[q.k],st=q.c?'done':q.n>=P[0]?'claim':'go';misRow('md'+i,x+12,yy,rw,T(P[1],P[2]),q.n,P[0],[[q.r,1]],st,()=>claimD(i,false),()=>claimD(i,true));yy+=60;});
 const cn=m.list.filter(q=>q.c).length;misRow('mb',x+12,yy,rw,T('领完3个任务的奖励','미션 3개 보상 모두 받기'),cn,3,[['light',1],['clock',1]],m.bonus?'done':cn>=3?'claim':'go',()=>claimB(false),()=>claimB(true));yy+=64;
 tx(T('成就','도전 과제'),x+14,yy+16,19,C.red,'left');yy+=36;
 const order=ACH.slice().sort((a,b)=>{const s=q=>A[q[0]]?2:q[1]()>=q[2]?0:1;return s(a)-s(b);});
 order.forEach(a=>{const v=a[1](),st=A[a[0]]?'done':v>=a[2]?'claim':'go';misRow('ac'+a[0],x+12,yy,rw,T(a[3],a[4]),v,a[2],[[a[5],a[6]]],st,()=>claimA(a));yy+=60;});
 scrollEnd();btn('misBack',(W-200)/2,y+bh+12,200,44,T('返回','돌아가기'),'gold',()=>closeM('mis'),17);}
/* ---------- ads: rewarded first. Swap nothing here: fill AD_UNIT and the platform ad is used. ---------- */
const AD={state:'IDLE',lastI:0,lastR:0,played:0,sinceI:0,launchFirst:true,paid:{},seq:0,offered:{},miss:0,missStage:0,next:{time:0,detail:0,free:0}};
let ADM=null,RV=null;
function adOK(){return true;}
function showRewarded(){if(PF&&AD_UNIT.rewarded&&PF.createRewardedVideoAd){return new Promise((res,rej)=>{try{if(!RV)RV=PF.createRewardedVideoAd({adUnitId:AD_UNIT.rewarded});const cl=r=>{RV.offClose&&RV.offClose(cl);res({isEnded:!r||r.isEnded!==false});};RV.onClose(cl);RV.load().then(()=>RV.show()).catch(e=>{RV.offClose&&RV.offClose(cl);rej(e);});}catch(e){rej(e);}});}
 return new Promise(res=>{ADM={n:3,t0:now(),res:e=>{ADM=null;closeM('ad');res({isEnded:e});}};openM('ad');});}
async function requestRewarded(type,grant){if(!adOK())return 'unavailable';if(AD.state!=='IDLE')return 'busy';const id=++AD.seq;AD.state='SHOWING';track('ad_open',{type});if(S)S.paused=true;let out='unavailable';
 try{const r=await Promise.race([showRewarded(),new Promise((_,x)=>setTimeout(()=>x(new Error('timeout')),60000))]);if(r&&r.isEnded===true){if(!AD.paid[id]){AD.paid[id]=1;grant();track('ad_reward',{type});AD.lastR=now();if(S)S.adRound=true;}out='completed';}else out='cancelled';}catch(e){toast(T('暂时没有广告，请稍后再试','지금은 광고가 없어요'));}
 if(S)S.paused=false;AD.state='IDLE';ADM=null;closeM('ad');return out;}
let ASK=null;function ask(zh,ko,fn){if(AD.state!=='IDLE'||!adOK())return;if(S)S.paused=true;ASK={zh,ko,fn};openM('ask');}
function askNo(){closeM('ask');ASK=null;if(S)S.paused=false;}
async function askYes(){const f=ASK&&ASK.fn;closeM('ask');ASK=null;if(f)await f();if(S&&AD.state==='IDLE')S.paused=false;}
/* ---------- sound ---------- */
const BGM={};let bgmNow='menu',TOUCHED=false,HIDDEN=false;
function bgm(k){if(!BGM[k]){let a;if(PF){a=PF.createInnerAudioContext();a.src='audio/'+k+'.mp3';}else{a=new Audio('audio/'+k+'.mp3?v='+BUILD);a.preload='none';}a.loop=true;a.volume=k==='menu'?.72:k==='story'?.7:.8;a._on=false;BGM[k]=a;}return BGM[k];}
function music(n){if(n)bgmNow=n;const want=SAVE.music!==false&&TOUCHED&&!HIDDEN;for(const k of ['menu','play','story']){if(k===bgmNow&&want){sub('audio').then(()=>{if(k!==bgmNow||SAVE.music===false||HIDDEN)return;const a=bgm(k);if(!a._on){a._on=true;try{const p=a.play();if(p&&p.catch)p.catch(()=>{a._on=false;});}catch(e){a._on=false;}}});}else if(BGM[k]&&BGM[k]._on){BGM[k]._on=false;try{BGM[k].pause();}catch(e){}}}}
const SFX=['tap','solve','nope','pick','shutter','print','gold','reward','hint','clock','tick','page','meow','unlock'],SB={},SP={};let SFXLOAD=false;
function loadSfx(){if(SFXLOAD)return;SFXLOAD=true;for(const n of SFX){if(PF){const pool=[];for(let i=0;i<2;i++){const a=PF.createInnerAudioContext();a.src='sfx/'+n+'.mp3';pool.push(a);}SP[n]={pool,i:0};}
 else if(AC&&window.fetch)fetch('sfx/'+n+'.mp3?v='+BUILD).then(r=>r.arrayBuffer()).then(b=>new Promise((ok,no)=>AC.decodeAudioData(b,ok,no))).then(buf=>{SB[n]=buf;}).catch(()=>{});}}
function sfx(n,vol){if(SAVE.sfx===false)return false;try{if(PF&&SP[n]){const q=SP[n],a=q.pool[q.i++%q.pool.length];a.volume=vol||.9;try{a.stop();}catch(e){}a.play();return true;}
 if(AC&&SB[n]){const src=AC.createBufferSource(),gn=AC.createGain();src.buffer=SB[n];gn.gain.value=vol||.9;src.connect(gn);gn.connect(AC.destination);src.start();return true;}}catch(e){}return false;}
let AC=null;function au(){try{if(!AC){if(PF)AC=PF.createWebAudioContext?PF.createWebAudioContext():null;else{const A=window.AudioContext||window.webkitAudioContext;AC=A?new A():null;}}if(AC&&AC.state&&AC.state!=='running'&&AC.resume)AC.resume();}catch(e){AC=null;}loadSfx();}
function beep(f,t,d,v0,ty){const v=Math.min(.5,v0*2.6),o=AC.createOscillator(),a=AC.createGain();o.type=ty||'sine';o.frequency.value=f;a.gain.setValueAtTime(.0001,AC.currentTime+t);a.gain.exponentialRampToValueAtTime(v,AC.currentTime+t+.01);a.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+t+d);o.connect(a);a.connect(AC.destination);o.start(AC.currentTime+t);o.stop(AC.currentTime+t+d+.03);}
function vib(ms){if(SAVE.vib===false)return;try{if(PF){PF.vibrateShort&&PF.vibrateShort({type:'light'});}else if(navigator.vibrate)navigator.vibrate(ms);}catch(e){}}
function tone(n,f){if(n==='good'||n==='nope'||n==='gold')vib(n==='nope'?12:18);if(SAVE.sfx===false)return;if(sfx({good:'solve'}[n]||n,n==='tick'?.6:n==='tap'?.75:.9))return;if(!AC)return;if(!{tap:1,good:1,nope:1,shake:1,note:1,shutter:1}[n])n=n==='gold'||n==='reward'||n==='unlock'||n==='pick'?'good':'tap';try{({tap:()=>beep(660,0,.07,.08),good:()=>[784,988,1319].forEach((q,i)=>beep(q,i*.07,.3,.09)),nope:()=>{beep(300,0,.12,.07,'triangle');beep(230,.08,.13,.06,'triangle');},shake:()=>{for(let i=0;i<6;i++)beep(170+i*25,i*.06,.05,.05,'triangle');},note:()=>beep(f||523,0,.45,.13),shutter:()=>{beep(1400,0,.03,.08,'square');beep(900,.05,.05,.07,'square');}})[n]();}catch(e){}}
function onHide(){HIDDEN=true;music();if(S&&S.phase==='playing'&&!S.paused){S.paused=true;S.bgPause=true;}persist();track('app_hide');}
function onShow(){HIDDEN=false;music();if(S&&S.bgPause&&S.phase==='playing')openM('pause');}
let TOAST=null;function toast(t,ms){TOAST={t,until:now()+(ms||2200)};}
let CONF=[];function confetti(){const P=['#ffd94a','#ff8fa3','#9fd3ff','#8fd19e','#ffb13b'];for(let i=0;i<40;i++)CONF.push({x:Math.random()*W,y:-10-Math.random()*120,vy:170+Math.random()*130,vx:(Math.random()-.5)*40,r:Math.random()*6,c:P[i%5]});}
function share(){track('share',{stage:L&&L.id});const title=T('我在团团小镇拍了一张有趣的照片，你也来试试！','탄탄 동네에서 재미있는 사진을 찍었어요!');if(PF){try{PF.shareAppMessage({title});}catch(e){}return;}const url=location.href.split('#')[0].split('?')[0];(async()=>{try{if(navigator.share){await navigator.share({title:T('团团小镇闹哄哄','탄탄 동네 소동'),text:title,url});return;}}catch(e){if(e&&e.name==='AbortError')return;}try{await navigator.clipboard.writeText(url);toast(T('链接已复制，发给朋友吧','링크를 복사했어요'));}catch(e){toast(url,4000);}})();}
/* ---------- screens ---------- */
const HS={y:0},AS={y:0},HLS={y:0},PS={y:0};let ALB=null,HALLC={},RESETARM=0,PAT=null;
function bg(){g.setTransform(1,0,0,1,0,0);g.fillStyle=C.paper;g.fillRect(0,0,cv.width,cv.height);g.setTransform(DPR*K,0,0,DPR*K,OX*DPR,0);
 if(!PAT){try{const p=mk(72,72),c=p.getContext('2d');c.fillStyle='rgba(216,71,58,.055)';c.beginPath();c.arc(18,18,7,0,7);c.fill();c.fillStyle='rgba(242,181,44,.08)';c.beginPath();c.arc(54,54,5,0,7);c.fill();PAT=g.createPattern(p,'repeat');}catch(e){PAT=1;}}if(PAT&&PAT!==1){g.fillStyle=PAT;g.fillRect(-OX/K,0,W+2*OX/K,H);}}
function unlocked(i){if(TEST_OPEN_ALL)return true;let last=-1;STAGES.forEach((st,k)=>{if(Object.keys(SAVE.alb[st.id]||{}).length)last=k;});return i<=last+1;}
function drawHome(){const x0=16,lg=LANG==='ko'?'logo_ko':'logo_zh',lim=ART[lg],lw=Math.min(250,W-110),lh0=lim?lw*lim.height/lim.width:60,bob=Math.sin(now()/600)*2;if(lim)g.drawImage(lim,(W-lw)/2,TOP-6+bob,lw,lh0);else tx(T('团团小镇闹哄哄','탄탄 동네 소동'),W/2,TOP+24,25,C.red);const sy=TOP-6+lh0+8;
 let total=0;STAGES.forEach(st=>{total+=Object.keys(SAVE.alb[st.id]||{}).length;});const gd=Object.values(SAVE.best||{}).filter(x=>x===5).length,fd=Object.keys(SAVE.found).length,N=STAGES.length;
 tx(T('金色照片 '+gd+'/'+N+' · 照片 '+total+'/'+N*32+' · 贴纸 '+fd+'/'+N,'황금 사진 '+gd+'/'+N+' · 사진 '+total+'/'+N*32+' · 스티커 '+fd+'/'+N),W/2,sy,11,C.soft,'center',W-30,FB);
 const ly=sy+12,lh=H-ly-118,cw=(W-x0*2-10)/2,chh=158,rows=Math.ceil(N/2);scrollBegin(HS,0,ly,W,lh,rows*(chh+12)+6);
 STAGES.forEach((st,i)=>{const x=x0+(i%2)*(cw+10),y=ly+4+Math.floor(i/2)*(chh+12);if(y-HS.y>ly+lh||y+chh-HS.y<ly)return;const open=unlocked(i),n=Object.keys(SAVE.alb[st.id]||{}).length,best=(SAVE.best||{})[st.id]||0,sc=best===5?3:best>=3?2:best>=1?1:0,dn=PRESS==='lv'+i?2:0;
  g.fillStyle=best===5?C.goldd:C.line;rr(g,x,y+3,cw,chh,13);g.fill();if(best===5){g.fillStyle=C.gold;rr(g,x-2,y-2+dn,cw+4,chh+4,14);g.fill();}g.fillStyle=C.cream;rr(g,x,y+dn,cw,chh,13);g.fill();
  const th='th_'+st.bg,ih=cw*.58;loadImg(th);g.save();rr(g,x+5,y+5+dn,cw-10,ih,9);g.clip();if(ART[th]){const im=ART[th];g.drawImage(im,0,im.height*.2,im.width,im.height*.6,x+5,y+5+dn,cw-10,ih);}else{g.fillStyle='#ead7b6';g.fillRect(x+5,y+5+dn,cw-10,ih);}if(!open){g.fillStyle='rgba(236,226,208,.72)';g.fillRect(x+5,y+5+dn,cw-10,ih);}g.restore();
  g.fillStyle=open?C.redd:'#a8977c';g.beginPath();g.arc(x+15,y+17+dn,14,0,7);g.fill();g.fillStyle=open?C.red:'#bfae93';g.beginPath();g.arc(x+15,y+15+dn,14,0,7);g.fill();tx(String(st.id),x+15,y+16+dn,15,'#fff');
  if(i===20){g.fillStyle='#4f9a5b';rr(g,x+cw-70,y+ih-18+dn,62,20,8);g.fill();tx(T('第二季','시즌2'),x+cw-39,y+ih-7+dn,12,'#fff');}
  if(!open){g.fillStyle='rgba(91,53,32,.75)';rr(g,x+cw-58,y+10+dn,50,20,8);g.fill();tx(T('未解锁','잠김'),x+cw-33,y+21+dn,12,'#fff');}
  tx(T(st.title,st.ko),x+8,y+ih+19+dn,15,open?C.ink:'#a8977c','left',cw-16);const yy=y+ih+38+dn;tx('★★★',x+8,yy,12,C.line,'left');if(sc)tx('★★★'.slice(0,sc),x+8,yy,12,C.gold,'left');tx(n+'/32'+(SAVE.found[st.id]?T(' · 贴纸',' · 스티커'):''),x+50,yy,11,C.soft,'left',cw-58,FB);
  g.fillStyle=C.line;rr(g,x+8,y+chh-12+dn,cw-16,5,3);g.fill();if(n){g.fillStyle=C.gold;rr(g,x+8,y+chh-12+dn,Math.max(5,(cw-16)*n/32),5,3);g.fill();}
  hit('lv'+i,x,y,cw,chh,()=>{if(open)start(i);else toast(T('先拍完上一关的照片吧','앞 단계 사진을 먼저 찍어 주세요'));});});scrollEnd();
 const by=H-108,bw=W-x0*2;const b3=(bw-16)/3;btn('toHall',x0,by,b3,44,T('纪念馆','기념관'),'gold',openHall,18);btn('toMis',x0+b3+8,by,b3,44,T('任务','미션'),'gold',()=>{MS.y=0;openM('mis');},18);if(misDot()){g.fillStyle='#e8402f';g.beginPath();g.arc(x0+b3*2+2,by+4,7,0,7);g.fill();g.strokeStyle='#fff';g.lineWidth=2;g.stroke();}btn('toSet',x0+b3*2+16,by,b3,44,T('设置','설정'),'gold',()=>{RESETARM=0;openM('set');},18);
 tx(T('抵制不良游戏，拒绝盗版游戏。注意自我保护，谨防受骗上当。','나쁜 게임은 멀리하고 불법 복제 게임은 거절해요. 스스로를 지키고 사기에 조심해요.'),W/2,H-46,9,C.soft,'center',W-20,FB);tx(T('适度游戏益脑，沉迷游戏伤身。合理安排时间，享受健康生活。','적당한 게임은 머리에 좋고, 지나치면 몸에 해로워요. 시간을 잘 나눠 건강하게 즐겨요.'),W/2,H-33,9,C.soft,'center',W-20,FB);tx('v'+BUILD,W/2,H-19,8.5,'#b9a585','center',0,FB);}
function drawPlay(){const x0=PX,tot=allP(L).length,n=probsDone(S.v);
 btn('back',x0,TOP,40,42,'','',goHome);g.strokeStyle=C.ink;g.lineWidth=3;g.lineCap='round';g.lineJoin='round';{const d=PRESS==='back'?3:0;g.beginPath();g.moveTo(x0+23,TOP+12+d);g.lineTo(x0+15,TOP+21+d);g.lineTo(x0+23,TOP+30+d);g.stroke();}
 const rx=x0+48,rw=SS-48-62;g.fillStyle=C.redd;rr(g,rx,TOP+3,rw,42,13);g.fill();const gr=g.createLinearGradient(0,TOP,0,TOP+42);gr.addColorStop(0,'#e2574a');gr.addColorStop(1,'#c93c30');g.fillStyle=gr;rr(g,rx,TOP,rw,42,13);g.fill();
 const pw=tot*10+4;tx(T(L.goal,GOALKO[L.id-1]||L.ko),rx+12,TOP+14,16,'#fff','left',rw-pw-22);const s=Math.ceil(S.t),tm=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');tx(T('还有 '+tm+' 开拍！','촬영까지 '+tm),rx+12,TOP+31,12,S.t<=20?'#ffe29a':'rgba(255,255,255,.95)','left');
 for(let i=0;i<tot;i++){const px=rx+rw-pw-4+i*10,on=i<n;g.fillStyle=on?'#ffd76a':'rgba(255,255,255,.28)';g.beginPath();g.ellipse(px+4,TOP+21,on?4.4:4,on?6.6:6,0,0,7);g.fill();}
 const hx=x0+SS-54;btn('hint',hx,TOP,54,42,T('提示','힌트'),S.hints<=0&&!S.detailReady?'off':'',useHint,15);g.fillStyle=C.gold;g.beginPath();g.arc(hx+50,TOP+2,9,0,7);g.fill();tx(String(S.hints+(S.detailReady?1:0)),hx+50,TOP+3,12,C.ink);
 drawPlayArea();
 const iy=PY+SS+TRAY+6,iw=(SS-14)/3,b=bag();ITEMS.forEach((it,i)=>{const x=x0+i*(iw+7),off=b[it[0]]<=0||S.used[it[0]];btn('it_'+it[0],x,iy,iw,40,'',off?'off':'',()=>useItem(it[0]));const d=PRESS==='it_'+it[0]?3:0;g.globalAlpha=off?.45:1;pic(it[1],x+22,iy+20+d,30);g.globalAlpha=1;tx(T(it[2],it[3]),x+42,iy+21+d,13,off?'#b09a7c':C.ink,'left',iw-48);g.fillStyle=off?'#b8a88c':C.red;g.beginPath();g.arc(x+iw-4,iy+2,9.5,0,7);g.fill();tx(String(b[it[0]]),x+iw-4,iy+3,12,'#fff');});
 let sy=iy+54,sx=x0,sw=SS;if(S.t<=30&&!S.timeAd&&adOK()&&S.phase==='playing'){btn('plus',sx,sy,64,52,'','',()=>ask('看广告，增加30秒','광고 보고 30초 늘리기',()=>requestRewarded('time',()=>{S.t+=30;S.timeAd=true;})));const d=PRESS==='plus'?3:0;tx(T('+30秒','+30초'),sx+32,sy+19+d,15,C.ink);tx(T('广告','광고'),sx+32,sy+37+d,10,C.soft,'center',0,FB);sx+=72;sw-=72;}
 if(L.comp){btn('comp',sx,sy,70,52,S.comp?T('近景','가까이'):T('全景','전체'),'gold',()=>{S.comp=!S.comp;refreshPV();},16);sx+=78;sw-=78;}
 const d=btn('shoot',sx,sy,sw,52,'','red',()=>capture('manual'));{const cx=sx+sw/2-58,cy=sy+26+d;g.fillStyle='#fff';rr(g,cx-17,cy-11,34,24,5);g.fill();rr(g,cx-8,cy-16,16,8,3);g.fill();g.fillStyle=C.red;g.beginPath();g.arc(cx,cy+1,7.5,0,7);g.fill();g.fillStyle='#ffe29a';g.beginPath();g.arc(cx,cy+1,4,0,7);g.fill();tx(T('现在拍照','지금 찍기'),sx+sw/2+14,sy+21+d,21,'#fff');tx(T('随时都能拍','언제든 찍을 수 있어요'),sx+sw/2+14,sy+40+d,10,'rgba(255,255,255,.92)','center',0,FB);}
 if(S.cardT>0){const t=1.5-S.cardT,a=t<.22?t/.22:t>1.2?Math.max(0,(1.5-t)/.3):1,sc=t<.22?.8+.2*t/.22:1;g.save();g.globalAlpha=a;g.translate(W/2,PY+SS*.45);g.scale(sc,sc);box(-110,-52,220,90);tx(T('第 '+L.id+' 关',L.id+'단계'),0,-30,15,C.soft);tx(T(L.title,L.ko),0,0,26,C.red,'center',200);g.restore();}}
function drawResult(){const R=RES;dim(.72);const ko=LANG==='ko',tagL=lines(R.tag,W-70,11,FB),pw=Math.min(296,W-70,H*.42),ph=pw+40,aftH=R.gold?90:0,offH=R.offer?96:0,totH=ph+12+aftH+22+tagL.length*14+8+offH+52;let y=Math.max(TOP,(H-totH)/2);
 const e=Math.min(1,(now()-R.t0)/520),ee=1-Math.pow(1-e,3);g.save();g.globalAlpha=e;g.translate(W/2,y+ph/2-(1-ee)*70);g.rotate(-.028+(1-ee)*.1);
 g.fillStyle='rgba(0,0,0,.3)';rr(g,-pw/2,-ph/2+8,pw,ph,6);g.fill();if(R.tier===3){g.fillStyle='rgba(255,214,90,.55)';rr(g,-pw/2-7,-ph/2-7,pw+14,ph+14,10);g.fill();g.fillStyle=C.gold;rr(g,-pw/2-3,-ph/2-3,pw+6,ph+6,8);g.fill();const gg=g.createLinearGradient(-pw/2,-ph/2,pw/2,ph/2);gg.addColorStop(0,'#ffe9a6');gg.addColorStop(.45,'#f7c64a');gg.addColorStop(1,'#fff0b8');g.fillStyle=gg;}else g.fillStyle=['#ece4d6',C.cream,'#fff3d6'][R.tier];
 rr(g,-pw/2,-ph/2,pw,ph,6);g.fill();g.drawImage(RESC,-pw/2+10,-ph/2+10,pw-20,pw-20);tx(R.title[ko?1:0],0,-ph/2+pw+9,18,C.ink,'center',pw-16);
 if(R.tier===3){const st=(now()-R.t0-550)/1300;if(st>0&&st<2){const k=st%1,bx=-pw/2-pw*.5+k*pw*2;g.save();rr(g,-pw/2,-ph/2,pw,ph,6);g.clip();const sg=g.createLinearGradient(bx,0,bx+pw*.5,0);sg.addColorStop(0,'rgba(255,255,255,0)');sg.addColorStop(.5,'rgba(255,255,255,.7)');sg.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=sg;g.fillRect(-pw/2,-ph/2,pw,ph);g.restore();}}
 const se=(now()-R.t0-450)/380;if(se>0){const k=Math.min(1,se),sc=1.9-.9*k;g.save();g.globalAlpha=k;g.translate(pw/2-42,-ph/2+42);g.rotate(-.24);g.scale(sc,sc);g.fillStyle='rgba(255,248,236,.88)';g.beginPath();g.arc(0,0,34,0,7);g.fill();g.strokeStyle=C.red;g.lineWidth=3;g.stroke();const a=R.doneN===R.tot?[T('完美','완벽'),T('全家福','단체사진')]:R.doneN===0?[T('翻车','엉망'),T('也好看','그래도 좋아')]:[R.doneN+'/'+R.tot,T('小惊喜','깜짝 장면')];tx(a[0],0,-8,19,C.red,'center',58);tx(a[1],0,13,13,C.red,'center',58);g.restore();}
 g.restore();y+=ph+12;
 if(R.gold){const bw=Math.min(330,W-36);g.fillStyle='rgba(255,248,236,.96)';rr(g,(W-bw)/2,y,bw,aftH-8,12);g.fill();tx(T('小镇日记 · 解锁','동네 일기 · 열림'),W/2,y+15,13,C.red);tx(R.stage.after[ko?1:0],W/2,y+35,14,C.ink,'center',bw-16);btn('reStory',W/2-52,y+48,104,26,T('看小故事','이야기 보기'),'gold',()=>openStory(R.stage),14);y+=aftH;}
 tx(T('分享给朋友','친구에게 공유'),W/2,y+8,14,C.cream);g.fillStyle=C.cream;g.fillRect(W/2-36,y+17,72,1);hit('share',W/2-60,y-6,120,28,share);y+=26;
 tagL.forEach((l,i)=>tx(l,W/2,y+6+i*14,11,C.cream,'center',0,FB));y+=tagL.length*14+10;
 if(R.offer){const bw=Math.min(330,W-36),bx=(W-bw)/2;g.fillStyle='rgba(255,248,236,.96)';rr(g,bx,y,bw,offH-8,12);g.fill();para(T('想发现更多小惊喜吗？看广告，下次拍照增加30秒和1条详细提示','깜짝 장면을 더 보고 싶나요? 광고를 보면 다음 촬영에 30초와 자세한 힌트 1개가 추가돼요'),W/2,y+16,bw-20,13,C.ink,'center',17);const hw=(bw-28)/2;adBtn('offerAd',bx+10,y+46,hw,32,async()=>{const r=await requestRewarded('next',()=>{AD.next.time=30;AD.next.detail=1;});R.offer=false;if(r==='completed')R.tag=T('下次拍照增加30秒和1条详细提示','다음 촬영에 30초와 자세한 힌트가 추가됩니다');});btn('offerNo',bx+18+hw,y+46,hw,32,T('不用了','괜찮아요'),'paper',()=>{R.offer=false;},14);y+=offH;}
 const rw=Math.min(340,W-36),rx=(W-rw)/2,a=(rw-16)/3.6;btn('again',rx,y,a,44,T('再拍一次','다시 찍기'),'',()=>start(S.i),15);btn('next',rx+a+8,y,a*1.6,44,S.i+1<STAGES.length?T('下一关','다음 단계'):T('纪念馆','기념관'),'gold',()=>{if(S.i+1<STAGES.length)start(S.i+1);else openHall();},19);btn('album',rx+a*2.6+16,y,a,44,T('相册','사진첩'),'',()=>{ALB=R.stage;AS.y=0;openM('album');},15);}
function adBtn(id,x,y,w,h,cb){const d=btn(id,x,y,w,h,'','paper',cb);const lb=T('看广告','광고 보기'),fs=h>36?17:14;g.font=fnt(fs);const tw=g.measureText(lb).width,lx=x+w/2-(tw+16)/2;g.fillStyle=C.red;g.beginPath();g.moveTo(lx,y+h/2-7+d);g.lineTo(lx+11,y+h/2+d);g.lineTo(lx,y+h/2+7+d);g.closePath();g.fill();tx(lb,lx+16,y+h/2+1+d,fs,C.ink,'left');}
function drawStory(){const X=STX;dim(.86);const ko=LANG==='ko',bw=Math.min(340,W-36),iw=bw-18,bh=iw+128,x=(W-bw)/2,y=Math.max(TOP,(H-bh)/2);box(x,y,bw,bh,true);g.save();rr(g,x+9,y+9,iw,iw,9);g.clip();const im=X.st.endArt&&ART[X.st.endArt];if(im)g.drawImage(im,x+9,y+9,iw,iw);else if(STC)g.drawImage(STC,x+9,y+9,iw,iw);g.restore();
 const q=X.st.story[X.i],a=Math.min(1,(now()-X.t0)/250),ty=y+iw+18;g.save();g.globalAlpha=a;g.translate(0,(1-a)*5);g.font=fnt(13);const nm=ko?(SPK[q[0]]||q[0]):q[0],ww=g.measureText(nm).width+18;g.fillStyle=C.red;rr(g,x+12,ty,ww,20,9);g.fill();tx(nm,x+12+ww/2,ty+11,13,'#fff');para(ko?q[2]:q[1],x+14,ty+38,bw-28,18,C.ink,'left',23);g.restore();
 const ny=y+bh-46;tx((X.i+1)+'/'+X.st.story.length,x+16,ny+17,13,C.soft,'left');btn('stSkip',x+bw-186,ny,70,34,T('跳过','건너뛰기'),'paper',()=>{closeM('story');STX=null;music(UI==='play'?'play':'menu');},15);btn('stNext',x+bw-108,ny,96,34,X.i+1<X.st.story.length?T('继续','계속'):T('完成','완료'),'gold',()=>{X.i++;X.t0=now();tone('page');if(X.i>=X.st.story.length){closeM('story');STX=null;music(UI==='play'?'play':'menu');}},16);}
function drawPV(){dim(.45,()=>closeM('pv'));const bw=Math.min(270,W-80),ko=LANG==='ko',bh=bw+38,x=(W-bw)/2,y=(H-bh)/2;g.fillStyle='rgba(0,0,0,.3)';rr(g,x,y+7,bw,bh,6);g.fill();g.fillStyle=C.cream;rr(g,x,y,bw,bh,6);g.fill();g.drawImage(pvC,x+8,y+8,bw-16,bw-16);tx(T('现在拍，会是什么样呢？','지금 찍으면 어떤 사진이 나올까?'),W/2,y+bw+10,17,C.ink,'center',bw-12);}
function drawAlbum(){dim();const st=ALB,A=SAVE.alb[st.id]||{},ks=Object.keys(A).sort(),bw=Math.min(350,W-30),bh=Math.min(H*.72,96+Math.max(1,ks.length)*38),x=(W-bw)/2,y=(H-bh-60)/2;box(x,y,bw,bh);tx(T('相册 ','사진첩 ')+ks.length+'/32',x+14,y+24,21,C.red,'left');tx(T(st.title,st.ko),x+14,y+47,12,C.soft,'left');
 scrollBegin(AS,x+8,y+62,bw-16,bh-72,ks.length*38);ks.forEach((m,i)=>{const yy=y+62+i*38;g.fillStyle=C.paper;rr(g,x+12,yy,bw-24,33,8);g.fill();tx((st.titles[m]?'★ ':'')+titleOf(st,m)[LANG==='ko'?1:0],x+22,yy+17,14,C.ink,'left',bw-80);tx('×'+A[m].n,x+bw-22,yy+17,11,C.soft,'right',0,FB);});scrollEnd();
 btn('albumBack',(W-200)/2,y+bh+12,200,44,T('返回','돌아가기'),'gold',()=>closeM('album'),17);}
function openHall(){let ks=[];const pool=Object.assign({},SAVE.last,SAVE.bestShot||{});for(const id of Object.keys(pool)){const st=STAGES.find(q=>q.id===+id);if(st)ks=ks.concat(stageKeys(st));}ensure(ks,()=>{HALLC={};for(const id of Object.keys(pool)){const st=STAGES.find(q=>q.id===+id);if(st)HALLC[id]=shot(st,pool[id],150);}HLS.y=0;openM('hall');});}
function drawHall(){dim();const bw=Math.min(350,W-30),bh=H*.74,x=(W-bw)/2,y=(H-bh-60)/2,cw=(bw-28-18)/4,gh=Math.ceil(STAGES.length/4)*(cw+22),ko=LANG==='ko';box(x,y,bw,bh);const dH=STAGES.length*(ko?50:36);
 scrollBegin(HLS,x+6,y+8,bw-12,bh-16,96+gh+dH+60);let yy=y+8;tx(T('小镇纪念馆','동네 기념관'),x+14,yy+18,21,C.red,'left');tx(T('每一关拍得最好的照片会挂在墙上','단계마다 가장 잘 찍은 사진이 벽에 걸려요'),x+14,yy+41,11.5,C.soft,'left',bw-28);yy+=58;
 STAGES.forEach((st,i)=>{const cx=x+14+(i%4)*(cw+6),cy=yy+Math.floor(i/4)*(cw+22);g.fillStyle=C.paper;rr(g,cx,cy,cw,cw+18,4);g.fill();const c=HALLC[st.id];if(c)g.drawImage(c,cx+3,cy+3,cw-6,cw-6);else{g.fillStyle='#ead7b6';g.fillRect(cx+3,cy+3,cw-6,cw-6);}tx(String(st.id),cx+cw/2,cy+cw+8,11,C.ink);});yy+=gh+10;
 let dn=0;STAGES.forEach(st=>{if(((SAVE.best||{})[st.id]||0)===5)dn++;});tx(T('小镇日记','동네 일기'),x+14,yy+12,21,C.red,'left');tx(T('已解锁 '+dn+'/'+STAGES.length,dn+'/'+STAGES.length+' 열림'),x+14,yy+34,11.5,C.soft,'left',0,FB);yy+=50;const rh=32;
 STAGES.forEach(st=>{const on=((SAVE.best||{})[st.id]||0)===5;g.fillStyle=C.paper;rr(g,x+12,yy,bw-24,rh,8);g.fill();if(on){tx(st.id+'. '+st.after[ko?1:0],x+20,yy+16,13.5,C.ink,'left',bw-40);hit('dy'+st.id,x+12,yy,bw-24,rh,()=>openStory(st));}else tx(st.id+'. ？？？ '+T('（全部解决后解锁）','(모두 해결하면 열립니다)'),x+20,yy+rh/2,13,'#bda98c','left',bw-40);yy+=rh+4;});scrollEnd();
 btn('hallBack',(W-200)/2,y+bh+12,200,44,T('返回','돌아가기'),'gold',()=>closeM('hall'),17);}
function drawSet(){dim();const on=v=>v?T('开','켜짐'):T('关','꺼짐');const rows=[['music',T('背景音乐','배경음악'),on(SAVE.music!==false)],['sfx',T('音效','효과음'),on(SAVE.sfx!==false)],['vib',T('振动','진동'),on(SAVE.vib!==false)],['lang',T('语言','언어'),LANG==='ko'?'한국어':'中文'],['guide',T('玩法说明','게임 방법'),'›'],['priv',T('隐私政策','개인정보 처리방침'),'›'],['reset',T('清除进度','진행 초기화'),RESETARM?T('再点一次确认','한 번 더 누르면 삭제'):'›']];
 const bw=Math.min(340,W-36),bh=70+rows.length*46,x=(W-bw)/2,y=(H-bh-60)/2;box(x,y,bw,bh);tx(T('设置','설정'),x+14,y+26,21,C.red,'left');
 rows.forEach((r,i)=>{const yy=y+48+i*46,d=PRESS==='set_'+r[0]?2:0;g.fillStyle=C.paper;rr(g,x+12,yy+d,bw-24,40,10);g.fill();tx(r[1],x+24,yy+21+d,16,C.ink,'left');tx(r[2],x+bw-24,yy+21+d,15,C.red,'right');hit('set_'+r[0],x+12,yy,bw-24,40,()=>setTap(r[0]));});
 tx(T('版本 ','버전 ')+BUILD,W/2,y+bh-12,11,C.soft,'center',0,FB);btn('setBack',(W-200)/2,y+bh+12,200,44,T('返回','돌아가기'),'gold',()=>closeM('set'),17);}
function setTap(k){if(k!=='reset')RESETARM=0;if(k==='music'){SAVE.music=SAVE.music===false;persist();music();}else if(k==='sfx'){SAVE.sfx=SAVE.sfx===false;persist();}else if(k==='vib'){SAVE.vib=SAVE.vib===false;persist();}
 else if(k==='lang'){LANG=LANG==='ko'?'zh':'ko';SAVE.lang=LANG;persist();}else if(k==='guide')showIntro(0);else if(k==='priv'){closeM('set');PS.y=0;openM('priv');}
 else if(k==='reset'){if(!RESETARM)RESETARM=1;else{try{PF?PF.removeStorageSync(KEY):localStorage.removeItem(KEY);}catch(e){}SAVE={alb:{},last:{},found:{}};RESETARM=0;M=[];UI='home';HS.y=0;showIntro(0);}}}
const PRIV=['《团团小镇闹哄哄》隐私政策\n\n1. 本游戏不收集姓名、照片、位置、联系方式等个人信息。\n\n2. 游戏进度只保存在你的手机上。删除游戏或清除数据后，进度会消失。\n\n3. 广告和数据统计由所在平台（微信、抖音）提供，并遵守平台的隐私规则。\n\n4. 未成年人请在家长陪伴下游戏，注意休息。\n\n5. 如有问题，可以通过游戏所在平台联系我们。','《탄탄 동네 소동》 개인정보 처리방침\n\n1. 이 게임은 이름, 사진, 위치, 연락처 같은 개인정보를 수집하지 않습니다.\n\n2. 게임 진행은 휴대폰 안에만 저장됩니다. 게임이나 데이터를 지우면 진행도 사라집니다.\n\n3. 광고와 통계는 해당 플랫폼(위챗, 더우인)이 제공하며, 플랫폼의 개인정보 규칙을 따릅니다.\n\n4. 미성년자는 보호자와 함께 플레이하고 쉬어 가며 즐겨 주세요.\n\n5. 문의는 게임이 올라간 플랫폼을 통해 해 주세요.'];
function drawPriv(){dim();const bw=Math.min(340,W-36),bh=H*.62,x=(W-bw)/2,y=(H-bh-60)/2,s=T(PRIV[0],PRIV[1]),f=LANG==='ko'?FB:FZ,ls=lines(s,bw-32,14,f);box(x,y,bw,bh);tx(T('隐私政策','개인정보 처리방침'),x+14,y+26,21,C.red,'left');scrollBegin(PS,x+8,y+46,bw-16,bh-56,ls.length*21+10);ls.forEach((l,i)=>tx(l,x+16,y+58+i*21,14,C.ink,'left',0,f));scrollEnd();btn('privBack',(W-200)/2,y+bh+12,200,44,T('返回','돌아가기'),'gold',()=>{closeM('priv');openM('set');},17);}
function drawPause(){dim();const bw=260,bh=132,x=(W-bw)/2,y=(H-bh)/2;box(x,y,bw,bh);tx(T('暂停中','일시정지'),W/2,y+38,24,C.red);btn('resume',x+30,y+74,bw-60,42,T('继续','계속'),'gold',()=>{closeM('pause');if(S){S.bgPause=false;S.paused=false;}},18);}
function drawSign(){dim();const bw=Math.min(344,W-30),bh=188,x=(W-bw)/2,y=(H-bh)/2,cw=(bw-24-24)/7;box(x,y,bw,bh);tx(T('每日签到','매일 출석'),W/2,y+26,22,C.red);tx(T('连续第 '+SIGNDAY+' 天','연속 '+SIGNDAY+'일째'),W/2,y+48,12,C.soft,'center',0,FB);
 SIGN.forEach((q,i)=>{const cx=x+12+i*(cw+4),cy=y+62,st=i+1<SIGNDAY?0:i+1===SIGNDAY?1:2;if(st===1){g.fillStyle=C.goldd;rr(g,cx,cy+2,cw,62,8);g.fill();}g.fillStyle=st===1?C.gold:C.paper;rr(g,cx,cy,cw,62,8);g.fill();g.globalAlpha=st===0?.4:1;tx(String(i+1),cx+cw/2,cy+11,11,C.ink);pic(q[0]==='light'?'flashlight':'clock',cx+cw/2,cy+31,24);tx('×'+q[1],cx+cw/2,cy+52,11,C.ink);g.globalAlpha=1;});
 btn('signGet',x+16,y+136,bw-32,42,T('领取','받기'),'gold',signGet,19);}
function drawIntro(){dim(.88);const q=INTRO[INI],ko=LANG==='ko',bw=Math.min(340,W-36),zl=lines(ko?q.k:q.z,bw-36,16),kl=[],bh=150+44+zl.length*23+kl.length*17+86,x=(W-bw)/2,y=(H-bh)/2;box(x,y,bw,bh,true);
 q.p.forEach((n,i)=>{const im=ART[n];if(!im)return;const k=Math.min(96/im.width,118/im.height),w=im.width*k,h=im.height*k;sprite(g,n,W/2+(i-1)*104,y+140-h/2+Math.sin(now()/415+i*1.3)*3,w);});
 tx(T(q.t,q.kt),W/2,y+172,24,C.red,'center',bw-20);let yy=y+204;zl.forEach((l,i)=>tx(l,W/2,yy+i*23,16,C.ink));yy+=zl.length*23+2;kl.forEach((l,i)=>tx(l,W/2,yy+i*17,12,C.soft,'center',0,FB));yy+=kl.length*17+8;
 INTRO.forEach((_,i)=>{g.fillStyle=i===INI?C.red:C.line;g.beginPath();g.arc(W/2+(i-1.5)*14,yy,4,0,7);g.fill();});const by=y+bh-58;btn('inSkip',x+14,by,(bw-36)*.38,44,T('跳过','건너뛰기'),'',closeIntro,16);btn('inNext',x+22+(bw-36)*.38,by,(bw-36)*.62,44,INI+1<INTRO.length?T('继续','계속'):T('开始','시작'),'gold',()=>{if(INI+1<INTRO.length)INI++;else closeIntro();},19);}
function drawAsk(){dim();const bw=Math.min(320,W-44),ko=LANG==='ko',bh=130,x=(W-bw)/2,y=(H-bh)/2;box(x,y,bw,bh);tx(ko?ASK.ko:ASK.zh,W/2,y+36,ko?17:20,C.red,'center',bw-20);const hw=(bw-40)/2,by=y+bh-62;adBtn('askYes',x+14,by,hw,44,askYes);btn('askNo',x+26+hw,by,hw,44,T('不用了','괜찮아요'),'paper',askNo,17);}
function drawAd(){dim(.9);const bw=280,bh=190,x=(W-bw)/2,y=(H-bh)/2,left=Math.max(0,ADM.n-Math.floor((now()-ADM.t0)/1000));if(left<=0){ADM.res(true);return;}box(x,y,bw,bh);tx(T('广告','광고'),W/2,y+30,22,C.red);tx(T('测试广告，不会播放真实广告','테스트 광고예요. 실제 광고는 나오지 않아요'),W/2,y+58,12,C.soft,'center',bw-20);tx(String(left),W/2,y+96,34,C.ink);btn('adClose',x+40,y+126,bw-80,42,T('中途关闭','중간에 닫기'),'paper',()=>ADM&&ADM.res(false),16);}
function drawLoad(){const Ld=LOADING,el=(now()-Ld.t0)/1000;if(el>25){Ld.fin();return;}if(el<.2)return;g.fillStyle=C.paper;g.fillRect(-OX/K-2,-2,W+2*OX/K+4,H+4);BT=[];SCR=null;hit('_',-999,-999,9999,9999,null);{const lg=ART[LANG==='ko'?'logo_ko':'logo_zh'];if(lg){const w=Math.min(280,W-60),h=w*lg.height/lg.width;g.drawImage(lg,(W-w)/2,H/2-30-h+Math.sin(now()/300)*3,w,h);}else pic('lili_joy',W/2,H/2-50+Math.sin(now()/250)*4,84);}tx(el>6?T('网络有点慢，请稍等一下','인터넷이 느려 시간이 걸리고 있어요'):T('加载中……','불러오는 중…'),W/2,H/2+18,16,C.ink);g.fillStyle=C.line;rr(g,W/2-100,H/2+40,200,10,5);g.fill();g.fillStyle=C.gold;rr(g,W/2-100,H/2+40,Math.max(10,200*Ld.ok/Ld.n),10,5);g.fill();}
const MD={mis:drawMis,result:drawResult,story:drawStory,pv:drawPV,album:drawAlbum,hall:drawHall,set:drawSet,priv:drawPriv,pause:drawPause,sign:drawSign,intro:drawIntro,ask:drawAsk,ad:drawAd};
function draw(){BT=[];SCR=null;bg();if(UI==='play'&&S)drawPlay();else drawHome();for(const m of M.slice()){if(m==='result'&&!RES)continue;if(m==='story'&&!STX)continue;if(m==='ask'&&!ASK)continue;if(m==='ad'&&!ADM)continue;if(m==='album'&&!ALB)continue;const a=Math.min(1,(now()-(MT[m]||0))/170),z=.93+.07*(1-(1-a)*(1-a));g.save();if(a<1&&m!=='result'){g.translate(W/2,H/2);g.scale(z,z);g.translate(-W/2,-H/2);}MD[m]();g.restore();}
 if(LOADING)drawLoad();
 for(const c of CONF){g.fillStyle=c.c;g.save();g.translate(c.x,c.y);g.rotate(c.r);g.fillRect(-4,-6,8,12);g.restore();}
 if(TOAST){if(now()>TOAST.until)TOAST=null;else{const ls=lines(TOAST.t,W*.72,15),h=ls.length*20+18;g.font=fnt(15);let mw=0;ls.forEach(l=>{mw=Math.max(mw,g.measureText(l).width);});g.fillStyle='rgba(70,38,20,.9)';rr(g,W/2-mw/2-16,H*.16,mw+32,h,12);g.fill();ls.forEach((l,i)=>tx(l,W/2,H*.16+19+i*20,15,'#fff'));}}}
/* ---------- input ---------- */
let DOWN=null;
function pDown(cx,cy){TOUCHED=true;au();music();const x=(cx-OX)/K,y=cy/K;PRESS=null;DOWN={x,y,moved:0,id:null,cb:null,scr:null,game:false};
 for(let i=BT.length-1;i>=0;i--){const b=BT[i];if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h){DOWN.id=b.id;DOWN.cb=b.cb;if(b.id!=='_')PRESS=b.id;break;}}
 if(SCR&&x>=SCR.x&&x<=SCR.x+SCR.w&&y>=SCR.y&&y<=SCR.y+SCR.h){DOWN.scr=SCR.st;DOWN.sy0=SCR.st.y;}
 if(!DOWN.id&&!M.length&&!LOADING&&UI==='play'&&S&&S.phase==='playing'&&!S.paused){DOWN.game=true;gameDown({x:x-PX,y:y-PY});}}
function pMove(cx,cy){if(!DOWN)return;const x=(cx-OX)/K,y=cy/K;DOWN.moved=Math.max(DOWN.moved,Math.hypot(x-DOWN.x,y-DOWN.y));if(DOWN.game){if(S)gameMove({x:x-PX,y:y-PY});return;}if(DOWN.scr&&DOWN.moved>6)DOWN.scr.y=Math.max(0,Math.min(DOWN.scr.max,DOWN.sy0-(y-DOWN.y)));if(DOWN.moved>10)PRESS=null;}
function pUp(cx,cy){const D=DOWN;DOWN=null;PRESS=null;if(!D)return;const x=(cx-OX)/K,y=cy/K;if(D.game){if(S)gameUp({x:x-PX,y:y-PY});return;}if(D.id&&D.moved<10&&D.cb){if(D.id!=='_')tone('tap');D.cb();}}
/* ---------- loop ---------- */
let last=0,PLAY_T=0,DERR=0;
function frame(){const t=now(),dt=Math.min(.05,(t-(last||t))/1000);last=t;
 if(S){if(S.cardT>0)S.cardT-=dt;if(S.phase==='playing'){if(!(S.cardT>0)&&!S.paused){const s0=Math.ceil(S.t);S.t-=dt;if(S.t>0&&S.t<=10&&Math.ceil(S.t)<s0)tone('tick');}S.idle+=dt;if(S.t<=0){S.t=0;capture('timeout');}if(L.diff.idle&&S.idle>L.diff.idle){S.idle=0;idleNudge();}if(S.phase==='playing')pump(dt);
   const G=S.g;if(G&&G.ges&&G.ges.on==='hold'&&G.moved<12){const k=(now()-G.t0)/1000/(G.ges.dur||1.1);if(S.hold)S.hold.k=k;if(k>=1){S.g=null;S.hold=null;fire(G.ges);}}
   if(!S.paused){PLAY_T+=dt;if(PLAY_T>=1800){PLAY_T=0;toast(T('已经玩了30分钟啦，休息一下眼睛吧','30분 동안 놀았어요. 눈을 잠깐 쉬어 가요'),4000);track('rest_tip');}}}
  for(const k in S.fx)S.fx[k]=Math.max(0,S.fx[k]-dt);if(S.hint>0)S.hint-=dt;if(S.zone)S.zone.t-=dt;if(S.area)S.area.t-=dt;
  for(const f of S.fly){f.t+=dt;if(f.mv){const k=Math.min(1,f.t/f.dur);S.tmp[f.mv]=Object.assign({},S.tmp[f.mv],{x:f.x0+(f.x1-f.x0)*k,y:f.y0+(f.y1-f.y0)*k-Math.sin(k*3.14)*f.arc});}}S.fly=S.fly.filter(f=>f.t<f.dur);
  for(const q of S.parts){q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;if(q.g)q.vy+=q.g*dt;}S.parts=S.parts.filter(q=>q.life>0);if(S.bubble){S.bubble.life-=dt;if(S.bubble.life<=0)S.bubble=null;}if(S.flash>0)S.flash=Math.max(0,S.flash-dt);}
 for(const c of CONF){c.y+=c.vy*dt;c.x+=c.vx*dt;c.r+=dt*6;}CONF=CONF.filter(c=>c.y<H+20);
 try{draw();}catch(e){g.setTransform(1,0,0,1,0,0);if(!DERR){DERR=1;track('draw_error',{m:String(e&&e.message).slice(0,80)});if(typeof console!=='undefined')console.error(e);}}
 requestAnimationFrame(frame);}
/* ---------- boot ---------- */
STAGES.forEach(st=>st.rules.forEach((r,i)=>{r.id=i;}));
fit();LANG=pickLang();CORE.forEach(n=>loadImg(n));
if(PF){PF.onTouchStart(e=>{const t=e.touches[0];if(t)pDown(t.clientX,t.clientY);});PF.onTouchMove(e=>{const t=e.touches[0];if(t)pMove(t.clientX,t.clientY);});const up=e=>{const t=e.changedTouches[0];if(t)pUp(t.clientX,t.clientY);};PF.onTouchEnd(up);PF.onTouchCancel&&PF.onTouchCancel(up);PF.onHide&&PF.onHide(onHide);PF.onShow&&PF.onShow(onShow);
 try{PF.showShareMenu&&PF.showShareMenu({withShareTicket:false});PF.onShareAppMessage&&PF.onShareAppMessage(()=>({title:'团团小镇闹哄哄：什么时候拍都好玩！'}));}catch(e){}
 try{const um=PF.getUpdateManager&&PF.getUpdateManager();if(um)um.onUpdateReady(()=>um.applyUpdate());}catch(e){}}
else{cv.addEventListener('pointerdown',e=>{try{cv.setPointerCapture(e.pointerId);}catch(_){}pDown(e.clientX,e.clientY);e.preventDefault();});cv.addEventListener('pointermove',e=>pMove(e.clientX,e.clientY));cv.addEventListener('pointerup',e=>pUp(e.clientX,e.clientY));cv.addEventListener('pointercancel',e=>pUp(e.clientX,e.clientY));
 addEventListener('resize',fit);document.addEventListener('visibilitychange',()=>document.hidden?onHide():onShow());
 window.__t={get S(){return S;},get L(){return L;},get M(){return M;},get SAVE(){return SAVE;},get LAST(){return LAST;},get LANG(){return LANG;},daily,MPOOL,ACH,bag,TR,AD,ART,STAGES,start,capture,goHome,runOp,view,cond,titleOf,SS:()=>SS,slots,
  client:(x,y)=>({x:OX+(PX+x)*K,y:(PY+y)*K}),btn:id=>{const b=BT.slice().reverse().find(q=>q.id===id);return b?{x:OX+(b.x+b.w/2)*K,y:(b.y+Math.min(b.h,40)/2)*K}:null;},ids:()=>BT.map(b=>b.id),pv:()=>pvC.toDataURL('image/jpeg',.82)};}
if(!SAVE.intro){SAVE.intro=1;persist();track('first_open');start(0);}else maybeSign();
requestAnimationFrame(frame);
if(!PF&&document.fonts&&document.fonts.addEventListener)document.fonts.addEventListener('loadingdone',()=>{for(const k in WR)delete WR[k];});
