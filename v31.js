/* ============================================================================
   천하등용 v31 — 진단 리포트 적용 (2026-11-15)
   한국어(index.html)·중국어(zh.html) 공용. 본편 스크립트 다음에 불러온다.
   이 파일 하나만 고치면 두 언어판에 함께 반영된다.

   1단계 진행 벽: 소프트 공적 한도 · 군영/진행 통합 · 시나리오 난이도 · 세력 보정 · 명성 5R
   2단계 첫 경험: 해 보며 배우는 튜토리얼 · 첫 판 전설 3택 · 패배 처방 · 작은 글자
   3단계 정리:   관문 돌파 메뉴 숨김 · 난이도 2단계 · 숨은 모드 버튼 제거
   4단계 출시:   저장 내보내기·불러오기
   ========================================================================== */
(function(){
'use strict';
const ZH=document.documentElement.lang.startsWith('zh');
const T=(ko,zh)=>ZH?zh:ko;
const BAL={
  // 공적: 하루 첫 FULL판은 100%, 이후는 LATE 비율 (딱딱한 한도 대신 소프트 한도)
  meritFull:3, meritLate:.5,
  // 군영 비용 배율: 하루 1~2판 기준 약 2~3달에 최고 단계 (v30 표 × COST)
  cost:14,
  // 광고 추가 공적: 이번 판 공적의 30% (광고 없이도 약 1.3배 시간이면 같은 지점)
  adMerit:.3,
  // 시나리오 일반 난이도 마지막 라운드 적 체력 배율 (v30: 5, 7.5, 12, 7.5, 15, 5 → 자동 플레이로 첫 도전 약 70~80%)
  scnHp:{hwanggeon:5,bandongtak:2.7,gwando:5.5,jeokbyeok:3.2,ireung:3.7,ojangwon:1.45},
  // 세력 보정 (시나리오에서 그 세력 장수 공격력·책략 배율). 자동 플레이로 맞춘 값
  fac:[1.1,.88,1.5,1.18],
  // 명성은 이 라운드부터
  fameFrom:5,
};
window.CHEONHA_BAL=BAL;

/* ---------------- 저장: 통합 진행(scnU) · 하루 판수(m31) · 튜토리얼 ---------------- */
let raw=null;try{raw=JSON.parse(localStorage.getItem('cheonha-save')||'null');}catch(e){}
SAVE.scnU=SCN.map(()=>[0,0,0,0]);SAVE.m31={date:'',n:0};SAVE.tut31=0;SAVE.fl31=0;
if(raw){
  if(Array.isArray(raw.scnU))raw.scnU.forEach((r,i)=>{if(i<SCN.length&&Array.isArray(r))for(let t=0;t<4;t++)SAVE.scnU[i][t]=Math.max(0,Math.min(3,r[t]|0));});
  if(raw.m31&&typeof raw.m31==='object'){SAVE.m31.date=String(raw.m31.date||'');SAVE.m31.n=Math.max(0,raw.m31.n|0);}
  SAVE.tut31=raw.tut31?1:0;SAVE.fl31=raw.fl31?1:0;
}
if(!SAVE.v31){
  // 군영 5개 → 1개: 단계는 가장 높은 값, 공적은 모두 더함
  for(const F of SAVE.muF||[])for(const k in SAVE.mu)SAVE.mu[k]=Math.max(SAVE.mu[k]|0,F[k]|0);
  SAVE.merit=(SAVE.merit|0)+(SAVE.meritF||[]).reduce((a,v)=>a+(v|0),0);SAVE.meritF=[0,0,0,0];
  // 세력별 시나리오 별 → 하나로 (세력·예전 기록 중 가장 높은 별)
  for(let i=0;i<SCN.length;i++)for(let t=0;t<4;t++){let s=SAVE.scnU[i][t];
    for(const F of SAVE.scnF||[])s=Math.max(s,(F[i]&&F[i][t])|0);
    if(SAVE.scnD&&SAVE.scnD[i])s=Math.max(s,SAVE.scnD[i][t]|0);SAVE.scnU[i][t]=s;}
  // 어려움 이상 별은 '어려움'으로 모음 (지옥·극상 숨김)
  for(const r of SAVE.scnU)r[1]=Math.max(r[1],r[2],r[3]);
  if(raw&&(raw.games|0)>0)SAVE.tut31=1;   // 이미 해 본 사람에게는 튜토리얼 생략
  SAVE.v31=1;save();
}

/* ---------------- 1. 군영 하나 ---------------- */
window.CMU=()=>SAVE.mu;
for(const m of MU){const c=m.cost;m.cost=l=>Math.round(c(l)*BAL.cost);}
window.V30SetStars=(i,t,st)=>{SAVE.scnU[i][t]=Math.max(SAVE.scnU[i][t]|0,st);};
window.scnStarsAt=(i,t)=>(SAVE.scnU[i]&&SAVE.scnU[i][t])|0;
window.scnOpen=i=>i===0||scnStarsAt(i-1,0)>=1;
window.scnTierOpen=(i,t)=>t<=1&&scnOpen(i)&&(t===0||scnStarsAt(i,0)>0);

/* 공적: 소프트 한도 */
function m31Today(){if(SAVE.m31.date!==todayKey()){SAVE.m31={date:todayKey(),n:0};}return SAVE.m31;}
function meritRate(){return m31Today().n<BAL.meritFull?1:BAL.meritLate;}
window.mcapLeft=()=>1e9;
window.earnMerit=function(win){const g=G;let m=g.round*2+(g.bossKills||0)*10+(g.legends||0)*5+(g.meritBonus||0)+(win?100:0);
  if(g.mode==='end')m*=1.3;if(g.scn)m*=DIFF[g.scnTier||0].merit;
  const rate=meritRate();m=Math.round(m*rate);g.meritRate=rate;m31Today().n++;
  SAVE.merit+=m;SAVE.games=(SAVE.games|0)+1;SAVE.storyF=storyF;save();return m;};
window.v30AdLeft=()=>1;
window.v30AdBonus=()=>Math.max(1,Math.round(((G&&(G.baseEarned||G.earned))||0)*BAL.adMerit));
window.rewardGrant=function(kind,g){
  if(!rewardPending||rewardPending.game!==g||G!==g||!canReward(kind))return false;
  if(kind==='supply'){g.adSupplyUsed=true;g.gold+=60;g.goldPulse=.5;g.txt.push({x:W/2,y:50,s:REWARD_TXT.supplyBonus,t:0,c:'#ffdf84',big:1});sfx('coin');}
  else{const bonus=v30AdBonus();g.adMeritUsed=true;g.adMeritBonus=bonus;g.earned+=bonus;SAVE.merit+=bonus;sfx('fame');}
  SAVE.rewardAds.count++;save();updateTitle();
  try{window.CH_TRACK&&CH_TRACK('ad_reward',{placement:kind,real:!!rewardProvider()});}catch(e){}
  if(kind==='supply')refreshRewardPause();else{const b=document.querySelector('#rRow [data-reward-ad]');if(b)b.remove();refreshRewardResult();}
  return true;};
window.refreshRewardResult=function(){if(!G||!G.over)return;
  document.getElementById('rStats').innerHTML=finishStats().map(([k,v])=>`<div class="stat"><b>${Number(v).toLocaleString()}</b><span>${k}</span></div>`).join('');
  const late=G.meritRate!=null&&G.meritRate<1?T(` · 오늘 ${BAL.meritFull}판 이후라 ${Math.round(G.meritRate*100)}%`,` · 今日第${BAL.meritFull}局后 ${Math.round(G.meritRate*100)}%`):'';
  document.getElementById('rSub').textContent=G.resultHead+' · '+REWARD_TXT.cost+' +'+(G.earned||0)+late+' ('+REWARD_TXT.hold+' '+SAVE.merit.toLocaleString()+')';
  document.getElementById('rRewardHint').textContent=G.adMeritUsed?REWARD_TXT.claimed+' · '+REWARD_TXT.bonus+' +'+G.adMeritBonus:REWARD_TXT.resultIntro+' · '+REWARD_TXT.daily+' '+rewardRemaining()+'/'+REWARD_DAILY_CAP+' · '+(rewardProvider()?REWARD_TXT.real:REWARD_TXT.demo);};
window.renderCamp=function(){const L=document.getElementById('campList');const old=document.getElementById('v30ctabs');if(old)old.remove();
  const n=m31Today().n,left=Math.max(0,BAL.meritFull-n);
  document.getElementById('meritTxt').textContent=T('보유 공적 ','持有功绩 ')+SAVE.merit.toLocaleString()+(left?T(` · 오늘 ${left}판 더 공적 100%`,` · 今日还有${left}局功绩100%`):T(` · 오늘은 공적 ${Math.round(BAL.meritLate*100)}%`,` · 今日功绩${Math.round(BAL.meritLate*100)}%`));
  L.innerHTML='';
  for(const m of MU){const lv=SAVE.mu[m.k]|0,max=lv>=m.max,c=max?0:m.cost(lv);const row=document.createElement('div');row.className='opt';
    row.innerHTML=`<span>${m.n} <small>${m.d} · ${lv}/${m.max}</small></span>`;const b=document.createElement('button');b.className='btn';b.style.minWidth='110px';b.style.padding='8px 12px';b.style.fontSize='15px';
    b.textContent=max?T('최고 단계','最高'):`${T('공적','功绩')} ${c.toLocaleString()}`;b.disabled=max||SAVE.merit<c;
    b.onclick=()=>{if(SAVE.merit<c||max)return;SAVE.merit-=c;SAVE.mu[m.k]=lv+1;save();sfx('fame');renderCamp();updateTitle();};row.append(b);L.append(row);}};
window.updateTitle=(o=>function(){o.apply(this,arguments);const st=document.getElementById('scnTxt');
  if(st){const tot=SAVE.scnU.reduce((a,r)=>a+(r[0]|0)+(r[1]|0),0);const nx=SCN.findIndex((S,i)=>!(SAVE.scnU[i][0]|0));st.textContent=T('별 ','星 ')+tot+'/'+SCN.length*6+(nx>=0?T(' · 다음: ',' · 下一个：')+SCN[nx].n:T(' · 모두 정복',' · 全部征服'));}
  const mt=document.getElementById('meritTop');if(mt)mt.textContent=mt.textContent.replace(/[\d,]+/,SAVE.merit.toLocaleString());})(updateTitle);
/* 시나리오 화면: 세력 탭은 '이번 판 출전 세력' 고르기 */
window.renderScn=(o=>function(){o.apply(this,arguments);const t=document.querySelector('#scnSel .tag');
  if(t)t.textContent=T('출전할 세력을 고르세요. 그 세력 장수만 등용돼요. 진행과 군영은 모든 세력이 함께 써요.','选择出战势力，只会招募该势力武将。进度与军营所有势力共用。');})(renderScn);

/* ---------------- 1. 시나리오 난이도 · 세력 보정 ---------------- */
SCN.forEach(S=>{if(BAL.scnHp[S.id]!=null)S.hp=BAL.scnHp[S.id];});
window.buffs=(o=>function(){o.apply(this,arguments);if(!G||!G.scn||G.onlyF==null)return;const k=BAL.fac[G.onlyF]||1;if(k===1)return;
  for(const u of G.slots)if(u){u.atk*=k;u.spow*=k;}})(buffs);

/* ---------------- 1. 명성은 5라운드부터 ---------------- */
window.fameUp=(o=>function(){if(G&&G.round<BAL.fameFrom){flash(T(`명성은 ${BAL.fameFrom}라운드부터 올릴 수 있어요. 처음엔 등용이 먼저예요`,`名声第${BAL.fameFrom}回合起可提升，先招募吧`));sfx('bad');return;}return o.apply(this,arguments);})(fameUp);

/* ---------------- 1. 안내 문구 ---------------- */
{const t=document.querySelector('#camp p.tag[style*="font-size:13px"]');if(t)t.textContent=T('판을 마칠 때마다 공적을 얻습니다. 라운드·적장 격파·전설 등용·도감 등록·승리가 공적이 됩니다. 군영은 모든 모드·세력이 함께 씁니다.','每局结束都会获得功勋。回合、击败敌将、传说武将、图鉴登记、胜利都会带来功勋。军营所有模式与势力共用。');}
if(window.V30INTRO&&V30INTRO.scn)V30INTRO.scn[3]=T(`어려움은 정예 적과 전장 변이가 붙어요. 공적으로 군영을 키우면 모든 세력이 강해져요 (하루 첫 ${BAL.meritFull}판은 공적 100%).`,`困难会出现精锐敌军与战场变异。功绩用于军营，所有势力共享（每日前${BAL.meritFull}局功绩100%）。`);

/* ---------------- 2. 해 보며 배우는 튜토리얼 ---------------- */
const TUT=[
  {t:T('등용을 눌러 장수를 불러오세요','点击招募，召来武将'),s:T('금 30마다 1명 · 금이 모이는 대로 계속','每30金1名 · 有金就继续招'),x:582,y:329,r:34,done:g=>g.recruits>=3},
  {t:T('같은 장수 2명이면 합칠 수 있어요','两名同样武将即可合成'),s:T('장수를 누르고 오른쪽 [합성] · 같은 세력 3명, 아무나 4명도 돼요','点武将后按右侧[合成] · 同势力3名、任意4名也可'),x:582,y:198,r:30,done:g=>g.merges>=1,need:g=>g.sel>=0&&!!mergeOptions(g.sel),pick:true},
  {t:T('합성할수록 등급이 올라요','越合成等级越高'),s:T('병졸 > 무장 > 명장 > 전설(3명 중 골라요) > 신화','兵卒 > 武将 > 名将 > 传说（三选一）> 神话'),done:(g,dt)=>(g.tutT=(g.tutT||0)+dt)>6},
];
function tutOn(){return G&&!SAVE.tut31&&(G.mode==='end'||G.mode==='scn')&&!G.over;}
window.update=(o=>function(dt){o.apply(this,arguments);if(!tutOn())return;const g=G;g.tut=g.tut||0;const st=TUT[g.tut];
  if(st&&st.done(g,dt)){g.tut++;g.tutT=0;sfx('pick');if(g.tut>=TUT.length){SAVE.tut31=1;save();}}
  // 첫 판: 4라운드에 전설 3택 한 번 확정
  if(!SAVE.fl31&&g.round>=4&&!g.legends&&!g.choice){const s=freeSlot();if(s>=0){SAVE.fl31=1;save();
    const pool=U.filter(v=>v.g===3&&(g.onlyF==null||v.f===g.onlyF)&&!(g.scn&&g.scn.ban===v.f)).map(v=>v.id),opts=[];
    while(opts.length<3&&pool.length)opts.push(pool.splice((Math.random()*pool.length)|0,1)[0]);
    g.banner={a:T('천하의 인재가 찾아왔다','天下英才来投'),b:T('전설 장수 1명을 골라요','选择一名传说武将'),t:2.6,c:'#f2c14e'};
    g.choice={slot:s,opts};openPick();}}})(update);
window.update.__v31=1;
window.render=(o=>function(){o.apply(this,arguments);if(!tutOn()||G.paused||G.choice)return;const st=TUT[G.tut||0];if(!st)return;
  const c=ctx,pulse=.5+.5*Math.sin(G.t*6);c.save();
  // 안내 상자
  const bw=330,bx=(W-bw)/2-40,by=58;c.fillStyle='rgba(20,12,6,.86)';c.strokeStyle='#f2c14e';c.lineWidth=1.5;rr(c,bx,by,bw,46,8);c.fill();c.stroke();
  txt(st.t,bx+bw/2,by+19,14,'#ffe7a8','center');txt(st.s,bx+bw/2,by+37,11,'#f6ead2','center');
  // 가리키기
  let x=st.x,y=st.y;if(st.pick&&!(G.sel>=0&&mergeOptions(G.sel))){const i=G.slots.findIndex((u,k)=>u&&mergeOptions(k));if(i>=0){[x,y]=slotXY(i);}else x=null;}
  if(x!=null){c.strokeStyle=`rgba(255,223,132,${.5+.5*pulse})`;c.lineWidth=3;c.beginPath();c.arc(x,y,(st.r||26)+pulse*5,0,TAU);c.stroke();}
  c.restore();})(render);

/* ---------------- 2. 패배 처방 한 줄 ---------------- */
function advice(why){const g=G,n=g.slots.filter(Boolean).length,leg=g.slots.filter(u=>u&&u.d.g>=3).length;
  if(g.round<=6)return T('초반에는 금이 모이는 대로 바로 등용하세요. 장수 수가 곧 힘이에요.','前期有金就招募，武将数量就是战力。');
  if(/적장|敌将/.test(why)||g.walls<g.walls0&&g.bossEsc)return T('적장은 제한 시간 안에 잡아야 해요. 전설을 만들고 세력 강화로 공격력을 올리세요.','敌将须限时击破。合成传说并强化势力攻击。');
  if(g.gold>=90)return T(`금 ${g.gold}이 남았어요. 칸이 차면 세력 강화(왼쪽 위)에 바로 쓰세요.`,`剩余${g.gold}金。格子满时立即用于势力强化（左上）。`);
  if(n<20)return T('빈 칸이 많았어요. 등용을 더 해서 칸을 채우세요.','空位太多，多招募填满格子。');
  if(!leg)return T('전설이 없었어요. 같은 등급 4명 혼합 합성으로 등급을 빨리 올려 보세요.','没有传说武将。试试同等级4名混合合成，快速升级。');
  if(g.scn&&(SAVE.mu.atk|0)<10)return T('군영의 정예 훈련을 올리면 모든 장수가 강해져요.','提升军营的精锐训练，所有武将都会变强。');
  return T('인연(같이 두면 강해지는 조합)을 맞추고 세력 강화를 한 세력에 모아 보세요.','凑齐缘分组合，并把势力强化集中在一个势力。');}
window.defeat=(o=>function(why){if(G&&!G.over){G.v31why=why;}const r=o.apply(this,arguments);try{const el=document.getElementById('rSub');
  let a=document.getElementById('rAdvice');if(!a){a=document.createElement('p');a.id='rAdvice';a.style.cssText='margin:4px 0 0;color:#ffe08a;font-size:15px';el.after(a);}a.textContent='💡 '+advice(why||'');a.hidden=false;}catch(e){}return r;})(defeat);
window.victory=(o=>function(){const a=document.getElementById('rAdvice');if(a)a.hidden=true;return o.apply(this,arguments);})(victory);

/* ---------------- 2. 작은 글자 키우기 (폰에서 약 12px 이상) ---------------- */
window.txt=(o=>function(s,x,y,size){if(typeof size==='number'&&size<10.5)arguments[3]=10.5;return o.apply(this,arguments);})(txt);

/* ---------------- 3. 메뉴 정리 · 난이도 2단계 ---------------- */
['mLegion','m20','mDaily'].forEach(id=>{const b=document.getElementById(id);if(b){b.hidden=true;b.style.display='none';}});
window.renderDiff=(o=>function(){if(storyTier>1)storyTier=1;o.apply(this,arguments);
  document.querySelectorAll('#storyDifficulties .diff-tab').forEach((b,t)=>{if(t>1)b.remove();});})(renderDiff);

/* ---------------- 4. 저장 내보내기·불러오기 (설정) ---------------- */
function box(title,val,ok){const o=document.createElement('div');o.style.cssText='position:fixed;inset:0;z-index:90;background:rgba(10,6,3,.78);display:flex;align-items:center;justify-content:center';
  o.innerHTML=`<div style="width:min(460px,92vw);background:#2a1c11;border:2px solid #f2c14e;border-radius:14px;padding:14px 16px;color:#f6ead2;font-size:14px"><h3 style="margin:0 0 6px;color:#f2c14e">${title}</h3><textarea style="width:100%;height:110px;font-size:11px;background:#1a110a;color:#f6ead2;border:1px solid #6a4a2a;border-radius:6px"></textarea><p class="m" style="margin:6px 0;min-height:1em;color:#ffb08a"></p><div style="display:flex;gap:8px;justify-content:center"></div></div>`;
  const ta=o.querySelector('textarea'),row=o.querySelector('div>div'),msg=o.querySelector('.m');ta.value=val||'';
  const mk=(t,f)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.onclick=f;row.append(b);};
  if(ok)mk(T('불러오기','导入'),()=>ok(ta.value.trim(),msg));else mk(T('복사','复制'),()=>{ta.select();try{navigator.clipboard.writeText(ta.value);msg.textContent=T('복사했어요','已复制');}catch(e){document.execCommand('copy');}});
  mk(T('닫기','关闭'),()=>o.remove());document.body.append(o);if(!ok)ta.select();}
function exportSave(){const d={v:31,save:localStorage.getItem('cheonha-save'),legion:localStorage.getItem('cheonha_legion_v2')};
  box(T('저장 내보내기 · 이 글을 메모에 보관하세요','导出存档 · 请保存这段文字'),'CH1:'+btoa(unescape(encodeURIComponent(JSON.stringify(d)))));}
function importSave(){box(T('저장 불러오기 · 내보낸 글을 붙여 넣으세요','导入存档 · 粘贴导出的文字'),'',(s,msg)=>{try{if(!s.startsWith('CH1:'))throw 0;const d=JSON.parse(decodeURIComponent(escape(atob(s.slice(4)))));
    if(!d.save||typeof JSON.parse(d.save)!=='object')throw 0;localStorage.setItem('cheonha-save',d.save);if(d.legion)localStorage.setItem('cheonha_legion_v2',d.legion);location.reload();}
  catch(e){msg.textContent=T('글이 올바르지 않아요. 전체를 그대로 붙여 넣으세요.','文字不正确，请完整粘贴。');}});}
(function(){const back=document.getElementById('optBack');if(!back)return;const row=document.createElement('div');row.className='row';row.style.cssText='gap:8px;justify-content:center;margin:6px 0';
  const mk=(t,f)=>{const b=document.createElement('button');b.className='btn';b.style.cssText='font-size:14px;padding:7px 14px';b.textContent=t;b.onclick=f;row.append(b);};
  mk(T('저장 내보내기','导出存档'),exportSave);mk(T('저장 불러오기','导入存档'),importSave);back.parentNode.insertBefore(row,back);})();

window.__v31={BAL,advice,meritRate,TUT};
try{updateTitle();}catch(e){}
})();
