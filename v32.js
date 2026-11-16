/* ============================================================================
   천하등용 v32 — 광고 보상형 모델에 맞춘 재미·잔존 보강 (2026-11-16)
   한국어(index.html)·중국어(zh.html) 공용. v31.js 다음에 불러온다.

   1. 병법 카드: 3·8·13…라운드마다 3장 중 1장 (등급 운) + 광고로 다시 뽑기(판당 1회)
   2. 새 적: 방패병(둔화·화염·빙결 중에만 제 피해) · 군의관(주변 회복)
   3. 장수 조각·성급: 판이 끝나면 출전 장수 조각 → ★마다 그 장수 공격·책략 +5%
   4. 일일 임무 3개 + 끝없는 전장 주간 기록 보상
   5. 광고 자리(모두 선택): 이어하기 · 카드 다시 뽑기 · 결과 보상(+공적, 조각 2배) · 임무 2배 · 전장 보급
   숫자는 아래 B 한 곳에서 조절.
   ========================================================================== */
(function(){
'use strict';
const ZH=document.documentElement.lang.startsWith('zh');
const T=(ko,zh)=>ZH?zh:ko;
const B={
  cardFirst:3, cardEvery:5,                    // 카드가 나오는 라운드: 3, 8, 13 …
  gradeP:[.70,.24,.06], gradeM:[1,1.6,2.5],    // 보통·희귀·전설 확률과 효과 배율
  shieldMul:.6, shieldP:.12, healerP:.06,      // 방패병 피해 배율·비율, 군의관 비율
  healEvery:1.5, healAmt:.05, healR:64,
  starNeed:[5,15,30,60,100], starAtk:.05,      // 누적 조각 → ★1~5, ★마다 +5%
  shardCap:10,                                 // 한 판에서 얻는 조각 상한
  missionMerit:20, missionShard:3,
  week:[[15,30,3],[25,50,5],[35,80,8],[45,120,12],[60,200,20]],   // [끝없는 전장 라운드, 공적, 조각]
  cap:{revive:3,reroll:5,mission:3,old:8},     // 광고 자리별 하루 횟수
};
const S={auto:false};   // auto=true: 자동 플레이 측정용 (창 없이 첫 카드 선택, 이어하기 없음)
const ad=(place,cap)=>window.CH_AD?CH_AD.rewarded(place,{group:place,cap}):Promise.resolve(false);
const track=(ev,p)=>{try{window.CH_TRACK&&CH_TRACK(ev,p);}catch(e){}};
const ALIAS={m_gwanu:'gwanu',m_jegal:'jegal',m_jojo:'jojo',m_sonchaek:'sonchaek',m_yeopo:'yeopo',m_joun:'joun',m_jangbi:'jangbi',m_samaui:'samaui',m_juyu:'juyu',m_wonso:'wonso'};
const baseId=id=>ALIAS[id]||id;

/* ---------------- 저장 ---------------- */
let raw=null;try{raw=JSON.parse(localStorage.getItem('cheonha-save')||'null');}catch(e){}
SAVE.sh={};SAVE.q32={date:'',prog:{},got:{}};SAVE.w32={wk:'',best:0,got:[]};
if(raw){
  if(raw.sh&&typeof raw.sh==='object')for(const k in raw.sh)if(UID[k])SAVE.sh[k]=Math.max(0,raw.sh[k]|0);
  if(raw.q32&&typeof raw.q32==='object'){SAVE.q32.date=String(raw.q32.date||'');Object.assign(SAVE.q32.prog,raw.q32.prog||{});Object.assign(SAVE.q32.got,raw.q32.got||{});}
  if(raw.w32&&typeof raw.w32==='object'){SAVE.w32.wk=String(raw.w32.wk||'');SAVE.w32.best=raw.w32.best|0;SAVE.w32.got=Array.isArray(raw.w32.got)?raw.w32.got.map(v=>v|0):[];}
}
function weekKey(){const d=new Date();d.setDate(d.getDate()-((d.getDay()+6)%7));return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}
function Q(){if(SAVE.q32.date!==todayKey())SAVE.q32={date:todayKey(),prog:{},got:{}};return SAVE.q32;}
function WK(){if(SAVE.w32.wk!==weekKey())SAVE.w32={wk:weekKey(),best:0,got:[]};return SAVE.w32;}

/* ---------------- 3. 장수 조각·성급 ---------------- */
function stars(id){const n=SAVE.sh[baseId(id)]|0;let s=0;while(s<B.starNeed.length&&n>=B.starNeed[s])s++;return s;}
function addShard(id,n){id=baseId(id);const b=stars(id);SAVE.sh[id]=(SAVE.sh[id]|0)+n;return stars(id)>b;}
function randomShards(n){const pool=SAVE.seen.filter(id=>UID[id]&&UID[id].g>=1&&UID[id].g<=3&&stars(id)<5);const out={};
  if(!pool.length){SAVE.merit+=n*5;return out;}
  for(let i=0;i<n;i++){const id=pool[(Math.random()*pool.length)|0];out[id]=(out[id]|0)+1;addShard(id,1);}return out;}
function shardText(o){const ks=Object.keys(o);if(!ks.length)return '';return ks.slice(0,4).map(id=>UID[id].n+' +'+o[id]).join(', ')+(ks.length>4?T(' 외',' 等'):'');}
function runShards(g){const us=g.slots.filter(u=>u&&u.d.g>=1).sort((a,b)=>b.d.g-a.d.g),out={};let left=B.shardCap;
  for(const u of us){if(left<=0)break;const id=baseId(u.d.id);if(UID[id].g>3||stars(id)>=5)continue;const n=Math.min(left,u.d.g>=4?3:u.d.g===3?2:1);out[id]=(out[id]|0)+n;left-=n;}
  return out;}
function applyShards(o){const up=[];for(const id in o)if(addShard(id,o[id]))up.push(UID[id].n);return up;}

/* ---------------- 4. 일일 임무 · 주간 기록 ---------------- */
const MIS=[
  {id:'play',n:T('전투 2판 하기','进行2场战斗'),goal:2},
  {id:'boss',n:T('적장 6명 격파','击破6名敌将'),goal:6},
  {id:'merge',n:T('합성 20회','合成20次'),goal:20},
  {id:'legend',n:T('전설 장수 2명 얻기','获得2名传说武将'),goal:2},
  {id:'end',n:T('끝없는 전장 20라운드 도달','无尽战场到达20回合'),goal:20,max:1},
  {id:'scn',n:T('시나리오 1번 승리','剧本胜利1次'),goal:1},
  {id:'card',n:T('병법 카드 3장 고르기','选择3张兵法卡'),goal:3},
];
function todayMis(){let h=7;for(const c of todayKey())h=(h*31+c.charCodeAt(0))>>>0;const rest=MIS.slice(1),a=h%rest.length;let b=(h>>>5)%(rest.length-1);if(b>=a)b++;return [MIS[0],rest[a],rest[b]];}
function prog(k,v,max){const q=Q();q.prog[k]=max?Math.max(q.prog[k]|0,v):(q.prog[k]|0)+v;}
function claimable(){const q=Q(),w=WK();return todayMis().filter(m=>(q.prog[m.id]|0)>=m.goal&&!q.got[m.id]).length+B.week.filter((r,i)=>w.best>=r[0]&&!w.got.includes(i)).length;}

/* ---------------- 공용 창 ---------------- */
const CSS=document.createElement('style');CSS.textContent=`
.v32ov{position:fixed;inset:0;z-index:86;background:rgba(10,6,3,.82);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:10px;box-sizing:border-box;overflow:auto;color:#f6ead2;text-align:center}
.v32ov h3{margin:0;color:#f2c14e;font-size:20px}.v32ov p{margin:0;font-size:13px;opacity:.9}
.v32cards{display:flex;gap:10px;justify-content:center;flex-wrap:nowrap;width:100%;max-width:640px}
.v32card{flex:1;min-width:0;background:linear-gradient(#3a2416,#22140c);border:2px solid #8a6a3a;border-radius:10px;color:#f6ead2;padding:12px 8px;font-size:14px;display:flex;flex-direction:column;gap:6px;align-items:center;min-height:118px;justify-content:center}
.v32card b{font-size:17px}.v32card small{font-size:11px;letter-spacing:1px;opacity:.9}.v32card span{font-size:13px;line-height:1.35}
.v32card.g1{border-color:#6ab8ff;box-shadow:0 0 10px rgba(106,184,255,.45)}.v32card.g1 small{color:#9bd0ff}
.v32card.g2{border-color:#ffd94a;box-shadow:0 0 16px rgba(255,217,74,.7);background:linear-gradient(#5a3a12,#2a180a)}.v32card.g2 small{color:#ffe08a}
.v32btn{font-size:14px;padding:8px 16px;border-radius:6px;border:2px solid #f2c14e;background:#2a1810;color:#f6ead2;min-height:38px}
.v32btn.red{background:linear-gradient(#a8322a,#6a1c16)}.v32btn:disabled{opacity:.45}
.v32list{width:min(560px,96vw);display:flex;flex-direction:column;gap:6px}
.v32row{display:flex;align-items:center;gap:8px;background:rgba(60,38,22,.85);border:1px solid #6a4a2a;border-radius:8px;padding:7px 10px;text-align:left;font-size:14px}
.v32row .g{flex:1;min-width:0}.v32row small{display:block;font-size:11.5px;opacity:.8}
#bQuest{position:absolute;left:10px;top:10px;z-index:3;min-width:0;font-size:14px;padding:7px 12px}
#bQuest i{display:inline-block;width:8px;height:8px;border-radius:50%;background:#ff5a4a;margin-left:6px;vertical-align:middle}
.card .v32st{display:block;font-size:11px;color:#ffe08a}`;document.head.append(CSS);
function ov(html){const o=document.createElement('div');o.className='v32ov';o.innerHTML=html;['pointerdown','pointerup','touchstart','touchend','click'].forEach(k=>o.addEventListener(k,e=>e.stopPropagation()));document.body.append(o);return o;}
function btn(t,cls,f){const b=document.createElement('button');b.className='v32btn'+(cls?' '+cls:'');b.textContent=t;b.onclick=()=>{try{auInit();}catch(e){}f(b);};return b;}

/* ---------------- 1. 병법 카드 ---------------- */
const pct=v=>Math.round(v*100)+'%';
const CARDS=[
  {id:'atk',n:T('필승의 기세','必胜之势'),v:[.10,.16,.25],d:v=>T('모든 장수 공격력 +','全体武将攻击 +')+pct(v),f:(g,v)=>g.cd.atk*=1+v},
  {id:'spd',n:T('신속 행군','兵贵神速'),v:[.08,.13,.20],d:v=>T('모든 장수 공격 속도 +','全体武将攻速 +')+pct(v),f:(g,v)=>g.cd.spd*=1+v},
  {id:'skill',n:T('기책 종횡','奇策纵横'),v:[.15,.24,.38],d:v=>T('기술·책략 위력 +','技能·计策威力 +')+pct(v),f:(g,v)=>g.cd.skill*=1+v},
  {id:'range',n:T('고지 선점','抢占高地'),v:[.06,.10,.15],d:v=>T('사거리 +','射程 +')+pct(v),f:(g,v)=>g.cd.range*=1+v},
  {id:'boss',n:T('참장탈기','斩将夺旗'),v:[.20,.32,.50],d:v=>T('적장에게 주는 피해 +','对敌将伤害 +')+pct(v),f:(g,v)=>g.cd.boss*=1+v},
  {id:'slow',n:T('진흙 수렁','泥泞之计'),v:[.06,.10,.15],d:v=>T('새로 오는 적 이동 속도 −','新来敌军移速 −')+pct(v),f:(g,v)=>g.cd.slow*=1-v},
  {id:'gold',n:T('군량 징발','征调军粮'),v:[80,130,200],d:(v,g)=>T('즉시 금 +','立即获得金 +')+Math.round(v*(1+g.round/10)),f:(g,v)=>{const n=Math.round(v*(1+g.round/10));g.gold+=n;g.goldEarned+=n;g.goldPulse=.5;}},
  {id:'income',n:T('둔전 개간','屯田开垦'),v:[8,13,20],d:v=>T('라운드마다 금 +','每回合金 +')+v,f:(g,v)=>g.cd.income+=v},
  {id:'wall',n:T('성벽 보수','修缮城墙'),v:[1,1,2],min:1,d:v=>T('성벽 +','城墙 +')+v,f:(g,v)=>{g.walls+=v;g.walls0+=v;}},
];
const GN=[T('보통','普通'),T('희귀','稀有'),T('전설','传说')];
function rollCards(g){const pool=CARDS.slice(),out=[];
  while(out.length<3&&pool.length){const c=pool.splice((Math.random()*pool.length)|0,1)[0];const r=Math.random();let gr=r<B.gradeP[2]?2:r<B.gradeP[2]+B.gradeP[1]?1:0;if(c.min&&gr<c.min)gr=Math.random()<.8?1:2;
    out.push({c,gr,v:c.v[gr]});}return out;}
function takeCard(g,k){k.c.f(g,k.v);g.cd.n++;g.cd.list.push(k.c.id+k.gr);g.buffDirty=true;prog('card',1);
  g.txt.push({x:W/2,y:120,s:T('병법 · ','兵法 · ')+k.c.n,t:0,c:k.gr===2?'#ffd94a':k.gr===1?'#9bd0ff':'#f6ead2',big:1});try{sfx(k.gr?'legend':'pick');}catch(e){}
  track('card_pick',{id:k.c.id,grade:k.gr,round:g.round});}
function offerCard(g){const opts=rollCards(g);if(S.auto){takeCard(g,opts[0]);return;}
  g.hold=true;const o=ov(`<h3>${T('병법 카드','兵法卡')}</h3><p>${T('하나를 고르세요. 이번 판 끝까지 이어져요.','选择一张，效果持续到本局结束。')}</p><div class="v32cards"></div><div class="v32foot"></div>`);
  const row=o.querySelector('.v32cards'),foot=o.querySelector('.v32foot');
  const draw=list=>{row.innerHTML='';list.forEach(k=>{const b=document.createElement('button');b.className='v32card g'+k.gr;b.innerHTML=`<small>${GN[k.gr]}</small><b>${k.c.n}</b><span>${k.c.d(k.v,g)}</span>`;
    b.onclick=()=>{if(G!==g){o.remove();return;}takeCard(g,k);o.remove();g.hold=false;};row.append(b);});};
  draw(opts);
  if(!g.rerolled)foot.append(btn(T('광고 보고 다시 뽑기 (판당 1회)','看广告重抽（每局1次）'),'',async b=>{b.disabled=true;if(await ad('reroll',B.cap.reroll)){g.rerolled=true;b.remove();draw(rollCards(g));}else b.disabled=false;}));}

/* ---------------- 2. 새 적 ---------------- */
const KIND={shield:{n:T('방패병','盾兵'),d:T('둔화·화염·빙결 중에만 제대로 피해를 입어요. 책사가 필요해요.','只有在减速·燃烧·冰冻时才会受到全额伤害，需要谋士。')},
            healer:{n:T('군의관','军医'),d:T('주변 적을 회복시켜요. 먼저 쓰러뜨리세요.','会治疗周围敌军，优先击破。')}};
function kindFor(g){const r=g.round,hard=g.scn&&(g.scnTier|0)>=1?1.5:1;let sh=0,he=0;
  if(g.scn){if(g.scnI>=1&&r>=4)sh=B.shieldP;if(g.scnI>=3&&r>=6)he=B.healerP;}
  else if(g.mode==='end'){if(r>=12)sh=B.shieldP;if(r>=22)he=B.healerP;}
  return [sh*hard,he*hard];}
window.startRound=(o=>function(){const before=G.spawnQ.length;o.apply(this,arguments);const g=G,[sh,he]=kindFor(g);if(!sh&&!he)return;
  for(const q of g.spawnQ){if(q.type==='boss'||q.v32)continue;const k=Math.random();q.v32=k<he?'healer':k<he+sh?'shield':'none';
    if(q.v32==='healer')q.hp*=.8;}
  g.kindSeen=g.kindSeen||{};for(const k of ['shield','healer'])if(!g.kindSeen[k]&&g.spawnQ.some(q=>q.v32===k)){g.kindSeen[k]=1;if(!g.banner)g.banner={a:T('새 적 · ','新敌人 · ')+KIND[k].n,b:KIND[k].d,t:3.4,c:'#9bd0ff'};}})(startRound);
window.spawnEnemy=(o=>function(q){const n=G.enemies.length;o.apply(this,arguments);const e=G.enemies[n];if(!e)return;
  if(q.v32&&q.v32!=='none')e.kind=q.v32;if(G.cd&&!e.boss)e.spd*=G.cd.slow;})(spawnEnemy);
window.dmgEnemy=(o=>function(e,v){if(e.kind==='shield'&&!(e.slow>0||e.frz>0||e.burnT>0))arguments[1]=v*B.shieldMul;
  if(e.boss&&G.cd)arguments[1]=arguments[1]*G.cd.boss;return o.apply(this,arguments);})(dmgEnemy);
window.drawEnemy=(o=>function(e){o.apply(this,arguments);if(!e.kind)return;const c=ctx,x=e.x,y=e.y-24;c.save();
  if(e.kind==='shield'){const open=e.slow>0||e.frz>0||e.burnT>0;c.globalAlpha=open?.35:1;c.fillStyle='#5aa8ff';c.strokeStyle='#eaf4ff';c.lineWidth=1.2;
    c.beginPath();c.moveTo(x-5,y-5);c.lineTo(x+5,y-5);c.lineTo(x+5,y+1);c.quadraticCurveTo(x,y+7,x-5,y+1);c.closePath();c.fill();c.stroke();}
  else{c.fillStyle='#fff';c.beginPath();c.arc(x,y,6,0,TAU);c.fill();c.fillStyle='#2fae5a';c.fillRect(x-1.5,y-4.5,3,9);c.fillRect(x-4.5,y-1.5,9,3);}
  c.restore();})(drawEnemy);

/* ---------------- 판 진행 연결 ---------------- */
window.newGame=(o=>function(){const r=o.apply(this,arguments);if(G){G.cd={atk:1,spd:1,skill:1,range:1,boss:1,slow:1,income:0,n:0,list:[]};G.r32=G.round;G.cardDue=0;G.buffDirty=true;}return r;})(newGame);
window.buffs=(o=>function(){o.apply(this,arguments);const g=G;if(!g)return;const cd=g.cd;
  for(const u of g.slots)if(u){const st=1+B.starAtk*stars(u.d.id);u.atk*=st;u.spow*=st;
    if(cd){u.atk*=cd.atk;u.spow*=cd.skill;u.int/=cd.spd;u.range*=cd.range;}}})(buffs);
window.update=(o=>function(dt){const g=G;if(!g||g.hold)return;o.apply(this,arguments);if(G!==g||g.over||!g.cd)return;
  if(g.round!==g.r32){g.r32=g.round;if(g.cd.income){g.gold+=g.cd.income;g.goldEarned+=g.cd.income;}
    if(g.round>=B.cardFirst&&(g.round-B.cardFirst)%B.cardEvery===0)g.cardDue++;}
  for(const e of g.enemies)if(e.kind==='healer'&&e.hp>0){e.healT=(e.healT==null?B.healEvery:e.healT)-dt;if(e.healT<=0){e.healT=B.healEvery;let any=0;
    for(const t of g.enemies)if(t!==e&&!t.boss&&t.hp>0&&t.hp<t.max&&Math.hypot(t.x-e.x,t.y-e.y)<B.healR){t.hp=Math.min(t.max,t.hp+t.max*B.healAmt);any=1;}
    if(any&&g.fx.length<60)g.fx.push({k:'ring',x:e.x,y:e.y,r:B.healR,t:0,d:.35,c:'#7fe0a0'});}}
  if(g.cardDue>0&&!g.choice&&!g.hold&&(S.auto||SAVE.tut31||(g.tut|0)>=3)){g.cardDue--;offerCard(g);}})(update);

/* ---------------- 5. 광고: 이어하기 ---------------- */
window.defeat=(o=>function(why){const g=G;
  if(g&&!g.over&&!g.hold&&!S.auto&&!g.revived&&g.round>=3&&window.CH_AD&&CH_AD.used('revive')<B.cap.revive&&!g.enemies.some(e=>e.final&&e.escaped)){
    g.hold=true;const w=ov(`<h3>${T('성이 함락 직전입니다','城池即将陷落')}</h3><p>${why||''}</p><p>${T('이어하면 성 밖 적군을 물리치고 성벽 1칸으로 계속 싸워요 (판당 1회)','继续后击退城外敌军，以1格城墙继续战斗（每局1次）')}</p><div class="v32foot" style="display:flex;gap:10px"></div>`);
    const f=w.querySelector('.v32foot'),end=()=>{w.remove();g.hold=false;if(G===g)o.call(this,why);};
    f.append(btn(T('광고 보고 이어하기','看广告继续'),'red',async b=>{b.disabled=true;if(G!==g){w.remove();return;}
      if(await ad('revive',B.cap.revive)){g.revived=true;g.enemies=g.enemies.filter(e=>e.boss&&e.hp>0);for(const e of g.enemies)e.timer+=25;g.spawnQ=g.spawnQ.filter(q=>q.type==='boss');
        g.walls=Math.max(1,g.walls);g.gold+=60;g.banner={a:T('원군 도착','援军抵达'),b:T('성 밖 적군을 물리쳤다 · 금 +60','击退城外敌军 · 金 +60'),t:2.6,c:'#f2c14e'};w.remove();g.hold=false;track('revive',{round:g.round,mode:g.mode});}
      else b.disabled=false;}),btn(T('포기하고 결과 보기','放弃并查看结果'),'',end));
    return;}
  return o.apply(this,arguments);})(defeat);

/* ---------------- 판 종료: 임무 진행 · 주간 기록 · 조각 ---------------- */
window.earnMerit=(o=>function(win){const m=o.apply(this,arguments),g=G;
  prog('play',1);prog('boss',g.bossKills|0);prog('merge',g.merges|0);prog('legend',g.legends|0);if(g.mode==='end'){prog('end',g.round,1);const w=WK();w.best=Math.max(w.best,g.round);}if(win&&g.scn)prog('scn',1);
  g.shards=runShards(g);g.starUp=applyShards(g.shards);save();return m;})(earnMerit);
function resultLine(){const g=G;if(!g||!g.over)return;let p=document.getElementById('rV32');if(!p){p=document.createElement('p');p.id='rV32';p.style.cssText='margin:3px 0 0;color:#9bd0ff;font-size:14px;text-align:center;width:100%';document.getElementById('rSub').after(p);}
  const s=shardText(g.shards||{}),n=claimable();
  p.textContent=[s?T('장수 조각 · ','武将碎片 · ')+s+(g.shardX2?T(' (2배)','（双倍）'):''):'',g.starUp&&g.starUp.length?T('성급 상승 · ','升星 · ')+g.starUp.join(', '):'',n?T(`받을 임무 보상 ${n}개`,`可领取任务奖励 ${n}个`):''].filter(Boolean).join('  ·  ');p.hidden=!p.textContent;}
window.showResult=(o=>function(){const r=o.apply(this,arguments);resultLine();const b=document.querySelector('#rRow [data-reward-ad]');
  if(b)b.textContent=T('광고 보상 · 공적 +','广告奖励 · 功绩 +')+v30AdBonus()+T(' · 조각 2배',' · 碎片双倍');return r;})(showResult);
window.rewardGrant=(o=>function(kind,g){const r=o.apply(this,arguments);if(r&&kind!=='supply'&&g&&g.shards&&!g.shardX2){g.shardX2=1;const up=applyShards(g.shards);if(up.length)g.starUp=(g.starUp||[]).concat(up);
  for(const k in g.shards)g.shards[k]*=2;save();resultLine();}return r;})(rewardGrant);
/* 예전 광고 자리(전장 보급·결과 보상)의 하루 횟수 */
window.rewardRemaining=()=>Math.max(0,B.cap.old-rewardCount());
window.refreshRewardPause=function(){const b=document.getElementById('pRewardSupply'),d=document.getElementById('pRewardHint');if(!b||!d||!G)return;const rem=rewardRemaining();
  b.disabled=G.adSupplyUsed||rem<1;b.textContent=G.adSupplyUsed?REWARD_TXT.claimed:(rem<1?REWARD_TXT.cooldown:REWARD_TXT.supplyButton);d.textContent=REWARD_TXT.supplyDesc+' · '+(rewardProvider()?REWARD_TXT.real:REWARD_TXT.demo);};
window.refreshRewardResult=(o=>function(){o.apply(this,arguments);if(!G||!G.over)return;const h=document.getElementById('rRewardHint');
  h.textContent=G.adMeritUsed?REWARD_TXT.claimed+' · '+REWARD_TXT.bonus+' +'+G.adMeritBonus:T('광고는 모두 선택이에요 · 보면 공적과 조각을 더 받아요','广告均为自愿 · 观看可获得更多功绩与碎片')+' · '+(rewardProvider()?REWARD_TXT.real:REWARD_TXT.demo);})(refreshRewardResult);

/* ---------------- 임무 창 ---------------- */
function give(merit,sh,x2){const k=x2?2:1;SAVE.merit+=merit*k;const o=randomShards(sh*k);save();try{sfx('fame');updateTitle();}catch(e){}return T('공적 +','功绩 +')+merit*k+(shardText(o)?' · '+shardText(o):'');}
function openQuest(){const o=ov(`<h3>${T('오늘의 임무','今日任务')}</h3><p class="msg">${T('매일 바뀌어요. 조각으로 장수 성급(★)을 올려요.','每日更新。碎片可提升武将星级（★）。')}</p><div class="v32list a"></div><h3 style="font-size:16px;margin-top:4px">${T('주간 기록 · 끝없는 전장','周记录 · 无尽战场')}</h3><div class="v32list b"></div><div class="v32foot"></div>`);
  o.style.justifyContent='flex-start';o.style.background='rgba(16,10,6,.96)';const A=o.querySelector('.a'),Bx=o.querySelector('.b'),msg=o.querySelector('.msg');
  const draw=()=>{const q=Q(),w=WK();A.innerHTML='';Bx.innerHTML='';
    todayMis().forEach(m=>{const p=Math.min(m.goal,q.prog[m.id]|0),done=p>=m.goal,got=q.got[m.id];const r=document.createElement('div');r.className='v32row';
      r.innerHTML=`<div class="g">${m.n}<small>${p}/${m.goal} · ${T('공적','功绩')} ${B.missionMerit} · ${T('조각','碎片')} ${B.missionShard}</small></div>`;
      if(got)r.append(btn(T('받음','已领取'),'',()=>{})),r.lastChild.disabled=true;
      else if(done){r.append(btn(T('받기','领取'),'',()=>{q.got[m.id]=1;msg.textContent=give(B.missionMerit,B.missionShard);track('mission_claim',{id:m.id,x2:0});draw();}),
        btn(T('광고 2배','广告双倍'),'red',async b=>{b.disabled=true;if(await ad('mission',B.cap.mission)){q.got[m.id]=1;msg.textContent=give(B.missionMerit,B.missionShard,1);track('mission_claim',{id:m.id,x2:1});}draw();}));}
      A.append(r);});
    B.week.forEach((k,i)=>{const done=w.best>=k[0],got=w.got.includes(i);const r=document.createElement('div');r.className='v32row';
      r.innerHTML=`<div class="g">${T(k[0]+'라운드 도달','到达'+k[0]+'回合')}<small>${T('이번 주 최고 ','本周最高 ')+w.best} · ${T('공적','功绩')} ${k[1]} · ${T('조각','碎片')} ${k[2]}</small></div>`;
      const b=btn(got?T('받음','已领取'):T('받기','领取'),'',()=>{w.got.push(i);msg.textContent=give(k[1],k[2]);draw();});b.disabled=got||!done;r.append(b);Bx.append(r);});
    questBadge();};
  draw();o.querySelector('.v32foot').append(btn(T('닫기','关闭'),'',()=>o.remove()));}
function questBadge(){const b=document.getElementById('bQuest');if(!b)return;const n=claimable();b.innerHTML=T('임무','任务')+(n?'<i></i>':'');}
{const t=document.getElementById('title');if(t){const b=document.createElement('button');b.id='bQuest';b.className='btn';b.onclick=()=>{try{auInit();}catch(e){}openQuest();};t.append(b);}}
window.updateTitle=(o=>function(){o.apply(this,arguments);questBadge();})(updateTitle);

/* ---------------- 도감: 성급 표시 ---------------- */
window.renderCodex=(o=>function(){o.apply(this,arguments);try{if(codexTab!==0)return;const cards=document.querySelectorAll('#codexBody .card');let i=0;
  for(let g=0;g<5;g++)for(const u of U.filter(v=>v.g===g)){const c=cards[i++];if(!c||g<1||g>3)continue;const n=SAVE.sh[u.id]|0;if(!n&&!SAVE.seen.includes(u.id))continue;const s=stars(u.id);
    const e=document.createElement('span');e.className='v32st';e.textContent='★'.repeat(s)+'☆'.repeat(5-s)+(s<5?` ${T('조각','碎片')} ${n}/${B.starNeed[s]}`:T(' 최고',' 满星'))+(s?` · ${T('공격','攻击')} +${Math.round(s*B.starAtk*100)}%`:'');c.append(e);}}catch(e){}})(renderCodex);

/* ---------------- 안내 문구 ---------------- */
{const p=document.querySelector('#title .reward-intro');if(p)p.textContent=T('광고는 모두 선택이에요: 이어하기 · 카드 다시 뽑기 · 보상 추가 (브라우저는 테스트 모드)','广告均为自愿：继续战斗 · 重抽兵法卡 · 额外奖励（浏览器为测试模式）');}
window.__v32={B,S,stars,claimable,openQuest,todayMis,CARDS,rollCards,offerCard};
try{updateTitle();}catch(e){}
})();
