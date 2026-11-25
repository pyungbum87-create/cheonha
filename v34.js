/* ============================================================================
   천하등용 v34 — 장수 이름표 · 히든 장수 4명 · 전장 안내 표시 (2026-11-25)
   한국어(index.html)·중국어(zh.html) 공용. v33.js 다음에 불러온다.
   1. 이름표: 칸 아래에 장수 이름(등급 색). 본편 render가 V34Labels()를 부른다.
   2. 히든 장수: 호치 허저(위) · 금마초(촉) · 화신 육손(오) · 마왕 동탁(군웅). 그림은 원래 장수 것을 씀.
   3. 안내 표시: 같은 장수 합성 가능 ▲(세력 3·혼합 4는 표시 안 함), 히든 조합 가능 금색 고리, 성 밖 적 60명부터 붉은 테두리, 진동
   4. 처음 하는 사람은 설명 카드 없이 바로 튜토리얼 (타이틀에서 1번 누르면 시작)
   ========================================================================== */
(function(){
'use strict';
const ZH=document.documentElement.lang.startsWith('zh');
const T=(ko,zh)=>ZH?zh:ko;
const FS=ZH?'"PingFang SC","Hiragino Sans GB","Noto Sans SC",sans-serif':'"Gowun Dodum",sans-serif';

/* ---------------- 2. 히든 장수 ---------------- */
const M=[
 ['m_heojeo',T('호치 허저','虎痴许褚'),0,[100,80,40,64,32],T('허저','许褚'),'heojeo','smash',{sp:'quake',d:T('5초마다 주변 적을 내리쳐 기절시킴','每5秒震击周围敌军并使其眩晕')},['heojeo','hahudon','akjin']],
 ['m_macho',T('금마초','锦马超'),1,[100,90,50,80,34],T('마초','马超'),'macho','spear',{sp:'smite',d:T('4초마다 가장 강한 적에게 5배 일격','每4秒对最强敌人造成5倍一击')},['macho','madae','bangtong']],
 ['m_yukson',T('화신 육손','火神陆逊'),2,[72,97,100,88,86],T('육손','陆逊'),'yukson','talisman',{sp:'blaze',d:T('6초마다 적이 몰린 곳에 불바다','每6秒在敌军密集处燃起火海')},['yukson','yeomong','songwon']],
 ['m_dongtak',T('마왕 동탁','魔王董卓'),3,[90,96,76,56,64],T('동탁','董卓'),'dongtak','smash',{sp:'warlord',d:T('군웅 전체 공격력 +40%','群雄全体攻击+40%')},['dongtak','hwaung','gosun']],
];
window.MALIAS=window.MALIAS||{};
for(const [id,n,f,s,sn,base,wp,ex,rec] of M){if(UID[id])continue;add(id,n,f,4,s,sn,ex);UID[id]=U[U.length-1];
  MALIAS[id]=base;PALIAS[id]=base;WEAPON[id]=wp;if(window.SDV&&SDV.alias)SDV.alias[id]=base;
  RECIPES.push({out:id,in:rec});rec.forEach(k=>{try{KEEP.add(k);}catch(e){}});}
window.buffs=(o=>function(){o.apply(this,arguments);if(!G)return;if(G.slots.some(u=>u&&u.d.sp==='warlord'))for(const u of G.slots)if(u&&u.d.f===3)u.atk*=1.4;})(buffs);
window.update=(o=>function(dt){const g=G;o.apply(this,arguments);if(!g||G!==g||g.over||g.paused||g.hold)return;
  for(let i=0;i<g.slots.length;i++){const u=g.slots[i];if(!u||!u.d.sp)continue;const sp=u.d.sp;if(sp!=='quake'&&sp!=='smite'&&sp!=='blaze')continue;
    const [x,y]=slotXY(i);u.v34T=(u.v34T||0)+dt;
    const near=()=>g.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-x,e.y-y)<u.range);
    if(sp==='quake'&&u.v34T>5){const es=near();if(!es.length)continue;u.v34T=0;for(const e of es){dmgEnemy(e,u.atk*2,false);e.frz=Math.max(e.frz||0,e.boss?.5:1.2);}
      g.fx.push({k:'ring',x,y,r:u.range,t:0,d:.45,c:'#ffd27a'});g.shake=Math.max(g.shake,4);sfx('thud');}
    else if(sp==='smite'&&u.v34T>4){const es=near();if(!es.length)continue;u.v34T=0;const e=es.reduce((a,b)=>b.hp>a.hp?b:a);dmgEnemy(e,u.atk*5,true);
      g.fx.push({k:'xslash',x:e.x,y:e.y-6,t:0,d:.3,c:'#ffe08a',big:1});g.fx.push({k:'ring',x:e.x,y:e.y,r:26,t:0,d:.3,c:'#ffe08a'});sfx('slash');}
    else if(sp==='blaze'&&u.v34T>6){const es=near();if(!es.length)continue;u.v34T=0;let best=es[0],bn=-1;
      for(const e of es){const n=es.filter(o=>Math.hypot(o.x-e.x,o.y-e.y)<60).length;if(n>bn){bn=n;best=e;}}
      g.zones.push({x:best.x,y:best.y,r:64,t:0,d:4,tick:0,dps:u.spow*.9});g.fx.push({k:'ring',x:best.x,y:best.y,r:64,t:0,d:.5,c:'#ff7a3a'});sfx('flame');}
  }})(update);

/* ---------------- 1·3. 이름표와 안내 표시 ---------------- */
let hintAt=-1,canMerge=[],canHidden=[];
function hints(){if(Math.abs(G.t-hintAt)<.3)return;hintAt=G.t;canMerge=[];canHidden=[];
  for(let i=0;i<G.slots.length;i++)if(G.slots[i]){try{if(hiddenOption(i))canHidden[i]=1;else{const m=mergeOptions(i);if(m&&(m.kind==='pair'||m.kind==='ascend'))canMerge[i]=1;}}catch(e){}}}
window.V34Labels=function(){const g=G;if(!g)return;hints();const c=ctx,pulse=.5+.5*Math.sin(g.t*5);c.save();c.textAlign='center';c.textBaseline='middle';
  for(let i=0;i<g.slots.length;i++){const u=g.slots[i];if(!u||(g.drag&&g.drag.from===i&&g.drag.moved))continue;const [x,y]=slotXY(i);
    if(canHidden[i]){c.strokeStyle=`rgba(255,120,60,${.55+.45*pulse})`;c.lineWidth=2;c.beginPath();c.arc(x,y,25+pulse*2,0,TAU);c.stroke();}
    // 이름표
    const gr=u.d.g,name=u.d.sn||u.d.n;c.font=(gr>=3?'bold ':'')+'10px '+FS;const w=Math.max(26,c.measureText(name).width+8),ly=y+25;
    c.fillStyle=gr>=4?'rgba(70,20,10,.86)':'rgba(20,12,6,.74)';rr(c,x-w/2,ly-6.5,w,13,3);c.fill();
    if(gr>=3){c.strokeStyle=GR[gr].ring;c.lineWidth=.8;rr(c,x-w/2,ly-6.5,w,13,3);c.stroke();}
    c.fillStyle=gr===0?'#cdbfa6':GR[gr].ring;c.fillText(name,x,ly+.5);
    // 합성 가능 ▲
    if(canMerge[i]||canHidden[i]){const mx=x+19,my=y-17-pulse*2;c.fillStyle=canHidden[i]?'#ff6a3a':'#7fe0a0';c.strokeStyle='rgba(20,12,6,.9)';c.lineWidth=1.5;
      c.beginPath();c.moveTo(mx,my-5);c.lineTo(mx+5,my+3);c.lineTo(mx-5,my+3);c.closePath();c.stroke();c.fill();}}
  c.restore();};
window.render=(o=>function(){o.apply(this,arguments);const g=G;if(!g||g.over)return;const n=g.enemies.length;if(n<60)return;
  const a=Math.min(.5,(n-60)/20*.5)*(.6+.4*Math.sin(g.t*8)),c=ctx,y0=51,y1=(window.V33L?V33L.panel:566);c.save();
  const q=c.createRadialGradient(W/2,(y0+y1)/2,150,W/2,(y0+y1)/2,330);q.addColorStop(0,'rgba(255,40,20,0)');q.addColorStop(1,`rgba(255,40,20,${a})`);c.fillStyle=q;c.fillRect(0,y0,W,y1-y0);c.restore();})(render);
/* 진동 (설정의 화면 흔들림을 끄면 같이 꺼짐) */
window.sfx=(o=>function(n){if((n==='legend'||n==='musang'||n==='thunder')&&SAVE.opt.shake)try{navigator.vibrate&&navigator.vibrate(n==='legend'?35:18);}catch(e){}return o.apply(this,arguments);})(sfx);

/* ---------------- 4. 처음 하는 사람: 설명 카드 대신 바로 튜토리얼 ---------------- */
window.v30ShowIntro=(o=>function(k){if(!SAVE.tut31)return;return o.apply(this,arguments);})(v30ShowIntro);
window.__v34={M};
})();
