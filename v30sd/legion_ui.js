/* 军团征战 / 관문 돌파 — UI. Canvas only (no DOM), 640×360 logical like the host game, so the same file
   runs in a web page and in a WeChat/Douyin mini-game (the host passes canvas + touches in through the adapter).
   Every picture goes through art(key) with a drawn fallback: ChatGPT can add images later without code changes.
   adapter: {canvas, lang, units, factions, portrait(id), mob(key), art(key), load(), store(obj), onExit(), ads:{rewarded(kind,done)}, raf}
   returns  {touch(type:'down'|'up', canvasX, canvasY), close()}                                                                   */
(function(root){
'use strict';
const C=root.LEGION_CORE;
const T={
 ko:{title:'관문 돌파',back:'나가기',chap:n=>`제${n}장`,gate:'관문',boss:'보스',enemy:'적군',ally:'아군 편성',roster:'보유 장수',start:'출진',conquer:'정벌',
  today:'오늘의 조건',syn:'조합 효과',none:'없음',traits:'전장 조건',read:'적장이 우리 편성을 읽고 병종을 바꿨어요!',tip:(a,b)=>`적 ${a} 많음 → ${b} 유리`,
  train:'훈련',gold:'금',exp:'경험치',lv:'Lv',full:'칸이 가득 찼어요. 바꿀 칸을 먼저 누르세요',need:'장수 3명을 편성하세요',win:'관문 돌파!',lose:'패배…',
  next:'다음 관문',retry:'다시 도전',map:'관문 목록',adDouble:'▶ 광고 보고 보상 2배',adRetry:'▶ 광고 보고 병력 +20% 재도전',newGen:'새 장수 합류',
  lvup:'레벨 업',speed:'배속',skip:'건너뛰기',noGold:'금이 부족해요',locked:'이전 관문을 먼저 돌파하세요',replayHint:'깬 관문은 매일 조건이 바뀌어요 · 별 3개에 도전!',
  starBonus:'새 별 보너스',tapSlot:'칸을 누른 뒤 장수를 고르면 그 자리에 들어가요',star3:'★ 승리  ★ 병력 50%↑  ★ 전원 생존',done:'받음',form:'진형',order:'군령 카드',orderTip:'출전 전에 군령을 하나 선택해 아군을 강화합니다',pickOrder:'군령 선택'},
 zh:{title:'军团征战',back:'返回',chap:n=>`第${n}章`,gate:'关卡',boss:'首领',enemy:'敌军',ally:'我军编队',roster:'拥有武将',start:'出征',conquer:'征伐',
  today:'今日条件',syn:'组合效果',none:'无',traits:'战场条件',read:'敌将看穿了我军编队，更换了兵种！',tip:(a,b)=>`敌方${a}多 → ${b}有利`,
  train:'训练',gold:'金',exp:'经验',lv:'Lv',full:'位置已满，请先点要替换的位置',need:'请编入3名武将',win:'攻破关隘!',lose:'战败…',
  next:'下一关',retry:'再次挑战',map:'关卡列表',adDouble:'▶ 看广告奖励翻倍',adRetry:'▶ 看广告兵力+20%再战',newGen:'新武将加入',
  lvup:'升级',speed:'倍速',skip:'跳过',noGold:'金不足',locked:'请先攻破前一关',replayHint:'已攻破的关卡每天条件都会变化 · 挑战三星！',
  starBonus:'新星奖励',tapSlot:'先点位置，再选武将，即可放入该位置',star3:'★ 胜利  ★ 兵力50%↑  ★ 全员存活',done:'已领取',form:'阵形',order:'军令牌',orderTip:'出征前选择一道军令强化我军',pickOrder:'选择军令'}};
const FONT="'PingFang SC','Microsoft YaHei','Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR','Noto Sans SC',sans-serif";
const COL={bg:'#1d140d',panel:'#2a1c11',line:'#6b4a2a',gold:'#f2c14e',text:'#f6ead2',dim:'#c9a35a',red:'#c8432f',ally:'#5ad06a',foe:'#ff6a5a'};
const GRC=['#9b958a','#c47a3a','#dfe6ef','#f2c14e','#ff5a3a'];
const ROMAN=['','','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ','Ⅸ','Ⅹ'];
/* every image key the UI asks for (sizes in LEGION_GUIDE.md). Missing keys are drawn by code. */
const ART_KEYS=['map_bg','bg_plain','bg_gate','bg_castle','bg_river','bg_mountain','bg_forest','type_inf','type_cav','type_arc','type_str',
  'gate_node','gate_boss','gate_lock','star','star_off','frame_0','frame_1','frame_2','frame_3','frame_4','fx_hit','fx_arrow','fx_heal','fx_buff','ground','reserve_ally','reserve_foe','brush_stroke','seal','vs','aura','shield','flag_0','flag_1','flag_2','flag_3'].concat(['inf','cav','arc','str'].flatMap(t=>['sol_'+t+'_ally','sol_'+t+'_foe'])).concat(Object.keys(C.D.skills).map(s=>'fx_'+s));

function mount(ad){
  C.lang.cur=ad.lang==='zh'?'zh':'ko';C.setUnits(ad.units,ad.factions);
  const L=T[C.lang.cur],D=C.D,UID=C.UID,tx=C.tx,W=640,H=360,TS=D.curve.teamSize,ORDERS=root.LEGION_ORDERS||[];
  const cv=ad.canvas,g=cv.getContext('2d'),raf=ad.raf||(f=>requestAnimationFrame(f)),art=k=>ad.art?ad.art(k):null;
  let S=C.loadSave(ad.load&&ad.load());const save=()=>{try{ad.store(S);}catch(e){}};save();
  let k=1,ox=0,oy=0,BT=[],down=null,scr=null,alive=true,toastM=null,last=0,ov=null;
  const dayNum=()=>Math.floor((Date.now()-new Date().getTimezoneOffset()*6e4)/864e5);
  /* ---------- drawing helpers ---------- */
  function rr(x,y,w,h,r,fill,stroke,lw){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();
    if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw||1.5;g.stroke();}}
  function text(s,x,y,size,color,align,bold,maxW){s=String(s);let f=size;g.font=`${bold?'bold ':''}${f}px ${FONT}`;
    if(maxW){while(f>8&&g.measureText(s).width>maxW){f-=1;g.font=`${bold?'bold ':''}${f}px ${FONT}`;}}
    g.fillStyle=color||COL.text;g.textAlign=align||'left';g.textBaseline='middle';g.fillText(s,x,y);}
  function wrap(s,x,y,size,color,maxW,lh){g.font=`${size}px ${FONT}`;let line='',yy=y;for(const ch of String(s)){if(g.measureText(line+ch).width>maxW){text(line,x,yy,size,color);line=ch;yy+=lh;}else line+=ch;}if(line)text(line,x,yy,size,color);return yy+lh;}
  function btn(x,y,w,h,label,fn,o){o=o||{};const dis=!!o.dis;rr(x,y,w,h,o.r||8,dis?'#33281d':(o.fill||'#3a2716'),dis?'#5a4a36':(o.stroke||COL.dim),o.lw||1.5);
    if(label)text(label,x+w/2,y+h/2+1,o.size||13,dis?'#8a7a66':(o.color||COL.text),'center',true,w-8);
    if(fn)BT.push({x,y,w,h,fn:dis?(o.why?()=>toast(o.why):null):fn});}
  const hit=(x,y,w,h,fn)=>BT.push({x,y,w,h,fn});
  function img(key,x,y,w,h){const im=art(key);if(im){g.drawImage(im,x,y,w,h);return true;}return false;}
  function face(id,x,y,s,grade){const im=ad.portrait(id);const u=UID[id];
    if(im)g.drawImage(im,x,y,s,s);else{g.fillStyle=u&&ad.factions[u.f]?ad.factions[u.f].c:'#555';g.fillRect(x,y,s,s);text(u?(u.sn||u.n)[0]:'?',x+s/2,y+s/2,s*.45,'#fff','center',true);}
    if(!img('frame_'+grade,x-s*.06,y-s*.06,s*1.12,s*1.12)){g.strokeStyle=GRC[grade]||GRC[1];g.lineWidth=2;g.strokeRect(x,y,s,s);}}
  function badge(t,x,y,r){if(img('type_'+t,x-r,y-r,r*2,r*2))return;const ty=D.types[t];g.beginPath();g.arc(x,y,r,0,7);g.fillStyle=ty.c;g.fill();g.strokeStyle='#fff';g.lineWidth=1.2;g.stroke();
    text(tx(ty.s),x,y+.5,r*1.15,'#fff','center',true);}
  function star(x,y,r,on){if(img(on?'star':'star_off',x-r,y-r,r*2,r*2))return;g.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr2=i%2?r*.45:r;g.lineTo(x+Math.cos(a)*rr2,y+Math.sin(a)*rr2);}
    g.closePath();g.fillStyle=on?COL.gold:'#4a3a2a';g.fill();g.strokeStyle=on?'#fff6':'#0006';g.lineWidth=1;g.stroke();}
  function toast(m){toastM={m,t:1.6};}
  function topbar(title,backFn,extra){g.fillStyle='#2a1c11';g.fillRect(0,0,W,34);g.fillStyle=COL.line;g.fillRect(0,34,W,2);
    btn(6,5,72,24,'← '+L.back,backFn,{size:12});text(title,88,18,15,COL.gold,'left',true,380);
    text(`${L.gold} ${S.gold}`,W-10,18,13,COL.text,'right',true);if(extra)extra();}
  function panel(x,y,w,h,title){rr(x,y,w,h,10,'#2a1c11e6',COL.line,1.5);if(title)text(title,x+10,y+13,12,COL.dim,'left',true);}
  const gname=G=>`${L.chap(G.c+1)} ${tx(G.chapter.n)}${G.round>1?' '+(ROMAN[G.round]||G.round):''}`;
  /* ---------- map ---------- */
  function openMap(ch){ov=null;scr={k:'map',ch:ch!==undefined?ch:Math.floor(Math.min(S.cleared,9999)/D.curve.gatesPerChapter)};}
  function drawMap(){const GP=D.curve.gatesPerChapter,maxCh=Math.floor(S.cleared/GP),ch=scr.ch;
    if(!img('map_bg',0,0,W,H)){const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#3b2a1a');gr.addColorStop(1,'#1d140d');g.fillStyle=gr;g.fillRect(0,0,W,H);}
    topbar(L.title,()=>{alive=false;ad.onExit&&ad.onExit();},()=>text(`★ ${C.totalStars(S)}`,W-80,18,13,COL.gold,'right',true));
    const info=C.chapterOf(ch*GP+1);
    btn(150,46,34,30,'‹',ch>0?()=>scr.ch--:null,{dis:ch<=0,size:18});btn(456,46,34,30,'›',ch<maxCh?()=>scr.ch++:null,{dis:ch>=maxCh,size:18});
    text(`${L.chap(ch+1)} · ${tx(info.ch.n)}${info.round>1?' '+(ROMAN[info.round]||info.round):''}`,W/2,61,17,COL.gold,'center',true,260);
    const P=[];for(let i=0;i<GP;i++){const row=i<5?0:1,col=row?4-(i-5):i;P.push([80+col*120,row?268:148]);}
    g.strokeStyle='#6b4a2a';g.lineWidth=6;g.setLineDash([2,10]);g.lineCap='round';g.beginPath();P.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.stroke();g.setLineDash([]);
    for(let i=0;i<GP;i++){const n=ch*GP+i+1,[x,y]=P[i],boss=i===GP-1,open=n<=S.cleared+1,done=n<=S.cleared,cur=n===S.cleared+1,r=boss?30:24;
      if(cur){g.beginPath();g.arc(x,y,r+7+Math.sin(last*.005)*2,0,7);g.fillStyle='#f2c14e44';g.fill();}
      if(!img(open?(boss?'gate_boss':'gate_node'):'gate_lock',x-r,y-r,r*2,r*2)){g.beginPath();g.arc(x,y,r,0,7);g.fillStyle=!open?'#3a3028':boss?'#7a2a1e':done?'#3d5a2e':'#5a3d22';g.fill();
        g.strokeStyle=open?(boss?'#ff9a6a':COL.gold):'#5a4a36';g.lineWidth=3;g.stroke();}
      text(n,x,y+1,boss?17:15,open?'#fff':'#8a7a66','center',true);if(boss)text(L.boss,x,y-r-9,11,'#ff9a6a','center',true);
      for(let s=0;s<3;s++)star(x-14+s*14,y+r+10,6,(S.stars[n]||0)>s);
      hit(x-r-6,y-r-6,r*2+12,r*2+24,()=>open?openForm(n):toast(L.locked));}
    text(L.replayHint,W/2,H-16,12,COL.dim,'center',false,600);}
  /* ---------- formation ---------- */
  function openForm(n){const replay=n<=S.cleared,pt=S.team.filter(id=>UID[id]).map(id=>C.typeOf(UID[id]));
    const G=C.gate(n,replay?dayNum():0,pt);let form=S.form;if(!D.forms[form]||D.forms[form].unlock>Math.max(1,S.cleared+1))form='feng';
    scr={k:'form',G,replay,team:S.team.filter(id=>S.gens[id]&&UID[id]).slice(0,TS),form,page:0,sel:-1,order:ORDERS.some(o=>o.id===S.order)?S.order:(ORDERS[0]&&ORDERS[0].id)};ov=null;}
  const foeList=G=>G.foes.map(f=>f.gen?{u:UID[f.gen],lv:f.lv}:{mob:f.mob,type:f.type,lv:f.lv});
  function formsOpen(){return Object.keys(D.forms).filter(f=>D.forms[f].unlock<=Math.max(1,S.cleared+1));}
  function drawForm(){const s=scr,G=s.G;g.fillStyle=COL.bg;g.fillRect(0,0,W,H);
    topbar(`${L.gate} ${G.n} · ${gname(G)} ${G.k}/${D.curve.gatesPerChapter}${G.boss?' · '+L.boss:''}${s.replay?' · '+L.today:''}`,()=>openMap(G.c));
    /* enemy panel */
    panel(6,42,200,312,L.enemy);const foes=foeList(G);
    miniForm(14,62,184,132,G.form,foes,true);
    text(`${L.form}: ${tx(D.forms[G.form].n)}`,14,204,11,COL.text,'left',true,184);
    let y=220;const fs=C.synergies(foes);if(fs.length){text(fs.map(x=>tx(x.n)).join(' · '),14,y,11,'#ff9a8a','left',true,184);y+=16;}
    text(L.traits,14,y,11,COL.dim,'left',true);y+=15;
    if(!G.traits.length){text(L.none,14,y,11,'#8a7a66');y+=15;}
    for(const t of G.traits){const tr=D.traits[t];rr(12,y-7,188,32,6,'#3a2716');text(tx(tr.n),18,y+2,11,COL.gold,'left',true,176);text(tx(tr.d),18,y+16,10,COL.text,'left',false,176);y+=36;}
    if(G.boss)wrap(L.read,14,Math.min(y+4,330),10,'#ff9a6a',184,13);
    /* ally panel */
    panel(212,42,216,312,L.ally);const F=D.forms[s.form],fo=formsOpen(),fi=fo.indexOf(s.form);
    btn(220,58,26,24,'‹',()=>{s.form=fo[(fi-1+fo.length)%fo.length];},{size:15});btn(394,58,26,24,'›',()=>{s.form=fo[(fi+1)%fo.length];},{size:15});
    text(tx(F.n),320,70,14,COL.gold,'center',true,140);text(tx(F.d),320,92,10,COL.text,'center',false,200);
    const team=s.team.map(id=>({u:UID[id],lv:S.gens[id].lv}));
    for(let i=0;i<TS;i++){const sl=F.slots[i],x=sl.col===0?352:268,yy=104+sl.y*104,id=s.team[i];
      rr(x-30,yy-4,60,66,8,s.sel===i?'#5a3d22':'#241811',s.sel===i?COL.gold:COL.line,s.sel===i?2.5:1.2);
      if(id){const u=UID[id];face(id,x-19,yy,38,u.g);badge(C.typeOf(u),x+18,yy+4,8);text(`${u.sn||u.n} ${L.lv}${S.gens[id].lv}`,x,yy+51,10,COL.text,'center',true,56);}
      else text('+',x,yy+26,22,'#6b4a2a','center',true);
      text(sl.col===0?'▶':'',x+35,yy+26,10,'#6b4a2a','center');
      hit(x-30,yy-4,60,66,()=>tapSlot(i));}
    // selected slot → training
    let ty=272;if(s.sel>=0&&s.team[s.sel]){const id=s.team[s.sel],r=S.gens[id],c=C.trainCost(r.lv);
      btn(222,ty-10,196,22,`${L.train} ${L.lv}${r.lv}→${r.lv+1} · ${L.gold} ${c}`,()=>{if(C.train(S,id)){save();}else toast(L.noGold);},{size:11,dis:S.gold<c,why:L.noGold});ty+=18;}
    const syn=C.synergies(team);text(`${L.syn}: ${syn.length?syn.map(x=>tx(x.n)).join(' · '):L.none}`,220,ty+4,11,syn.length?'#7be08c':'#8a7a66','left',true,200);
    const tip=counterTip(foes);if(tip)text(tip,220,ty+19,10,COL.dim,'left',false,200);
    // Optional command cards are applied via the core's existing battle trait modifier table.
    if(ORDERS.length){const oc=ORDERS.find(o=>o.id===s.order)||ORDERS[0];
      btn(222,295,196,16,L.order+' · '+tx(oc.n)+'  ▾',()=>{ov={k:'orders'};},{size:10,stroke:'#cda663',fill:'#41301a'});}
    btn(232,315,176,33,s.replay?L.conquer:L.start,()=>startBattle(),{fill:COL.red,stroke:COL.gold,size:15,dis:s.team.length<TS,why:L.need});
    /* roster panel */
    panel(434,42,200,312,`${L.roster} (${Object.keys(S.gens).filter(i=>UID[i]).length})`);
    const ids=Object.keys(S.gens).filter(i=>UID[i]).sort((a,b)=>(UID[b].g-UID[a].g)||(S.gens[b].lv-S.gens[a].lv)),per=12,pages=Math.max(1,Math.ceil(ids.length/per));s.page=Math.min(s.page,pages-1);
    ids.slice(s.page*per,s.page*per+per).forEach((id,i)=>{const x=442+(i%3)*64,y=62+Math.floor(i/3)*64,u=UID[id],inT=s.team.indexOf(id);
      rr(x,y,60,60,7,inT>=0?'#5a3d22':'#241811',inT>=0?COL.gold:COL.line,inT>=0?2:1);face(id,x+11,y+3,38,u.g);badge(C.typeOf(u),x+52,y+8,7);
      if(S.gens[id].isNew){g.fillStyle=COL.red;g.beginPath();g.arc(x+6,y+6,4,0,7);g.fill();}
      text(`${u.sn||u.n} ${S.gens[id].lv}`,x+30,y+51,9,COL.text,'center',true,58);if(inT>=0)text(inT+1,x+8,y+40,11,COL.gold,'center',true);
      hit(x,y,60,60,()=>tapRoster(id));});
    btn(442,322,30,24,'‹',s.page>0?()=>s.page--:null,{dis:s.page<=0});btn(596,322,30,24,'›',s.page<pages-1?()=>s.page++:null,{dis:s.page>=pages-1});
    text(`${s.page+1}/${pages}`,534,334,11,COL.dim,'center');}
  function miniForm(x,y,w,h,form,mem,enemy){rr(x,y,w,h,8,'#241811');const F=D.forms[form];
    mem.forEach((m,i)=>{const sl=F.slots[i]||{col:1,y:.5},cx=enemy?(sl.col===0?x+50:x+w-50):(sl.col===0?x+w-50:x+50),cy=y+6+sl.y*(h-48);
      if(m.u)face(m.u.id,cx-17,cy-4,34,m.u.g);else{const im=ad.mob(m.mob);if(im){const hh=34,ww=hh*im.width/im.height;g.drawImage(im,cx-ww/2,cy-4,ww,hh);}else{g.fillStyle='#a8312a';g.fillRect(cx-17,cy-4,34,34);}}
      badge(m.u?C.typeOf(m.u):m.type,cx+17,cy,7);text(`${m.u?(m.u.sn||m.u.n)+' ':''}${L.lv}${m.lv}`,cx,cy+38,9,COL.text,'center',true,90);});}
  function counterTip(foes){const c={};for(const f of foes){const t=f.u?C.typeOf(f.u):f.type;c[t]=(c[t]||0)+1;}
    const top=Object.keys(c).sort((a,b)=>c[b]-c[a])[0];const ct=C.counterOf(top);return ct&&c[top]>=2?L.tip(tx(D.types[top].n),tx(D.types[ct].n)):'';}
  function tapSlot(i){const s=scr;if(s.sel<0){s.sel=i;return;}if(s.sel===i){if(s.team[i])s.team.splice(i,1);s.sel=-1;return;}
    const a=s.team[s.sel],b=s.team[i];if(a&&b){s.team[s.sel]=b;s.team[i]=a;}s.sel=-1;}
  function tapRoster(id){const s=scr;delete S.gens[id].isNew;const at=s.team.indexOf(id);
    if(s.sel>=0){if(at>=0&&at!==s.sel){const o=s.team[s.sel];s.team[at]=o;s.team[s.sel]=id;s.team=s.team.filter(Boolean);}
      else if(s.sel<s.team.length)s.team[s.sel]=id;else s.team.push(id);s.sel=-1;return;}
    if(at>=0)s.team.splice(at,1);else if(s.team.length<TS)s.team.push(id);else toast(L.full);}
  /* ---------- battle ---------- */
  function startBattle(boost){const s=scr.k==='form'?scr:scr.from;S.team=s.team.slice();S.form=s.form;save();
    const team=s.team.map(id=>({u:UID[id],lv:S.gens[id].lv}));
    const selected=ORDERS.find(o=>o.id===s.order);
    S.order=selected?selected.id:S.order;save();
    const battleTraits=s.G.traits.slice();if(selected)battleTraits.push(selected.trait);
    const bt=C.newBattle(team,foeList(s.G),{formA:s.form,formB:s.G.form,traits:battleTraits,seed:(s.G.seed+Date.now())>>>0,boost});
    scr={k:'battle',from:s,G:s.G,bt,order:selected&&selected.id,sp:S.sp||1,fx:[],acc:0,end:0,res:null};ov=null;}
  /* battle view: every troop is a squad of small soldiers (count follows HP), the general rides a banner.
     Art keys (all optional): bg_<chapter art> 640×260 sky/fortress strip · ground 640×140 · vs 64×64 ·
     sol_<type>_<ally|foe> 48×48 soldier (feet at bottom centre) · flag_<faction> 40×56 · aura · shield 128×128 */
  const SQ=16,BY=150,BH=190;
  function upos(f){const ally=f.side===0;let x=ally?(f.col===0?250:150):(f.col===0?390:490);
    if(f.adv)x+=(ally?1:-1)*f.adv;const s0=scr&&scr.intro!==undefined?Math.max(0,1-scr.intro/1.2):0;x+=(ally?-1:1)*s0*s0*230;return{x,y:BY+f.y*BH};}
  function bgDraw(G){const im=art('bg_'+G.chapter.art);
    if(im&&im.width/im.height>2.45){const h=420,w=h*im.width/im.height;g.drawImage(im,(W-w)/2,-60,w,h);return;}if(im){const h=Math.min(H,W*im.height/im.width);g.drawImage(im,0,0,W,h);}else{const gr=g.createLinearGradient(0,0,0,240);gr.addColorStop(0,'#c98b4a');gr.addColorStop(1,'#7a5a3a');g.fillStyle=gr;g.fillRect(0,0,W,240);}
    if(!img('ground',0,220,W,140)){const gr=g.createLinearGradient(0,170,0,H);gr.addColorStop(0,'rgba(176,132,82,0)');gr.addColorStop(.25,'#b08452');gr.addColorStop(1,'#7a5634');g.fillStyle=gr;g.fillRect(0,170,W,H-170);
      g.fillStyle='#0000000f';for(let i=0;i<40;i++){const x=(i*97)%W,y=230+((i*53)%120);g.beginPath();g.ellipse(x,y,14,3,0,0,7);g.fill();}}}
  function vsBar(bt,G){const hA=bt.A.reduce((a,f)=>a+f.hp,0),mA=bt.A.reduce((a,f)=>a+f.max,0),hB=bt.B.reduce((a,f)=>a+f.hp,0),mB=bt.B.reduce((a,f)=>a+f.max,0);
    const lead=s=>s.find(f=>f.isGen);const la=lead(bt.A),lb=lead(bt.B);
    rr(70,8,232,24,5,'#0b1a33',COL.gold,1.5);rr(72,10,228*hA/mA,20,4,'#2f6fd0');rr(338,8,232,24,5,'#330b0b',COL.gold,1.5);rr(340+228*(1-hB/mB),10,228*hB/mB,20,4,'#c23a2a');
    text(la?`${la.u.n} (${L.lv}${la.lv})`:L.ally,80,20,12,'#fff','left',true,200);
    text(lb?`${lb.u.n} (${L.lv}${lb.lv})`:`${L.gate} ${G.n}`,560,20,12,'#fff','right',true,200);
    if(!img('vs',W/2-26,-2,52,52)){g.save();g.translate(W/2,20);g.rotate(Math.PI/4);rr(-17,-17,34,34,4,'#3a2716',COL.gold,2.5);g.restore();text('VS',W/2,21,15,COL.gold,'center',true);}
    text(`${Math.max(0,Math.ceil(bt.limit-bt.t))}`,W/2,52,13,'#fff','center',true);}
  function reserve(){if(img('reserve_ally',-10,150,250,60)&&img('reserve_foe',400,150,250,60))return;for(let sd=0;sd<2;sd++){const x0=sd?468:2,c=sd?'#5a1a14':'#14284a';g.strokeStyle=c;g.lineWidth=1;for(let i=0;i<26;i++){const x=x0+(i%13)*13+(i>12?6:0),y=196+(i>12?10:0);g.fillStyle=c;g.globalAlpha=i>12?.55:.4;g.fillRect(x,y-12,6,12);g.beginPath();g.arc(x+3,y-14,3,0,7);g.fill();g.beginPath();g.moveTo(x+5,y-8);g.lineTo(x+8,y-26);g.stroke();if(i%4===0){g.fillStyle=sd?'#c23a2a':'#2f6fd0';g.fillRect(x+8,y-38+Math.sin(last*.004+i)*1.5,10,12);}}}g.globalAlpha=1;}
  function drawBattle(dt){const s=scr,bt=s.bt,G=s.G;s.intro=(s.intro||0)+dt;const sh=s.intro>1.1&&s.intro<1.45?(Math.random()-.5)*6:0;g.save();g.translate(sh,sh*.5);bgDraw(G);reserve();
    if(!bt.done&&s.intro>1.2){s.acc+=dt*s.sp;let n=0;while(s.acc>=D.curve.tick&&!bt.done&&n++<200){s.acc-=D.curve.tick;for(const e of C.step(bt))onEv(e);}}
    // melee squads march to the middle in the first seconds, ranged ones hold
    for(const f of bt.A.concat(bt.B))if(D.types[f.type].range==='melee')f.adv=Math.min(f.col===0?40:30,bt.t*45);
    const all=bt.A.concat(bt.B).sort((a,b)=>upos(a).y-upos(b).y);for(const f of all)drawUnit(f,dt);
    for(let i=s.fx.length-1;i>=0;i--){const e=s.fx[i];e.t+=dt;if(e.t>e.life){s.fx.splice(i,1);continue;}drawFx(e);}
    g.restore();vsBar(bt,G);
    btn(6,40,58,22,'← '+L.back,()=>{scr=s.from;},{size:10});
    btn(W-136,40,62,22,`${L.speed} ${s.sp}x`,()=>{s.sp=s.sp===1?2:s.sp===2?4:1;S.sp=s.sp;save();},{size:10});
    btn(W-68,40,62,22,L.skip,()=>{C.finish(bt);s.fx.length=0;},{size:10,dis:S.cleared<G.n,why:L.locked});
    let tx0=70;for(const t of G.traits){const nm=tx(D.traits[t].n);g.font=`bold 10px ${FONT}`;const w=g.measureText(nm).width+12;rr(tx0,42,w,18,9,'#000a');text(nm,tx0+w/2,51,10,COL.gold,'center',true);tx0+=w+4;}
    const sa=bt.synA.map(x=>tx(x.n)).join(' · '),sb=bt.synB.map(x=>tx(x.n)).join(' · ');
    if(sa){rr(4,H-22,Math.min(300,sa.length*11+14),18,9,'#000a');text(sa,10,H-13,10,'#9fe8a8','left',true,290);}if(sb){rr(W-4-Math.min(300,sb.length*11+14),H-22,Math.min(300,sb.length*11+14),18,9,'#000a');text(sb,W-10,H-13,10,'#ffb0a0','right',true,290);}
    if(bt.done){s.end+=dt;if(!s.res){s.res=C.settle(S,G,s.from.team,bt);save();}if(s.end>.6&&!ov)ov={k:'result'};}}
  function onEv(e){const s=scr;if(e.k==='hit'){const a=upos(e.a),d=upos(e.d);e.a.lunge=.22;e.d.flash=.15;
      const ranged=D.types[e.a.type].range==='ranged';
      if(ranged)for(let i=0;i<(e.big?7:3);i++)s.fx.push({k:'arrow',x1:a.x+(i%3-1)*12,y1:a.y-6+(i%2)*8,x2:d.x+(Math.random()*30-15),y2:d.y+(Math.random()*16-8),t:-i*.03,life:.3,str:e.a.type==='str'});
      s.fx.push({k:'num',x:d.x+(Math.random()*40-20),y:d.y-34-Math.random()*14,s:'-'+e.v,c:e.big?'#ffd94a':'#fff',big:e.big,t:0,life:.9});
      if(e.big&&s.fx.filter(fx=>fx.k==='boom').length<7)s.fx.push({k:'boom',x:d.x,y:d.y,t:0,life:.45,key:'fx_'+e.a.skill});}
    else if(e.k==='heal'){const d=upos(e.d);s.fx.push({k:'num',x:d.x,y:d.y-34,s:'+'+e.v,c:'#7be08c',t:0,life:.9});s.fx.push({k:'boom',x:d.x,y:d.y,t:0,life:.45,key:'fx_heal',c:'#7be08c'});}
    else if(e.k==='skill'){
      const p=upos(e.f);e.f.aura=.8;
      s.fx.push({k:'banner',x:p.x,y:p.y-58,s:tx(D.skills[e.sk]),t:0,life:1.1});
      // Decorative FX only. All damage, targeting and skill balance stay inside legion_core.js.
      const k=e.sk==='heal'?'fx_heal':({'qinglong':'fx_qinglong','eastwind':'fx_eastwind','firewall':'fx_firewall','wushuang':'fx_wushuang'})[e.sk];
      if(k&&s.fx.length<65){
        const area=e.sk==='eastwind'||e.sk==='firewall'||e.sk==='wushuang';
        const x=area?(e.f.side===0?400:240):p.x+(e.f.side===0?36:-36);
        const y=area?202:p.y-15;
        s.fx.push({k:'boom',x,y,t:0,life:.52,key:k,c:'#f2c14e'});
      }
    }}
  // procedural soldier when no sprite: 4 troop silhouettes in side colours
  function soldier(t,side,fac,x,y,sc,ph){const key=`sol_${t}_${side?'foe':'ally'}`,im=art(key);const flip=side===1;
    g.save();g.translate(x,y);if(flip)g.scale(-1,1);g.scale(sc,sc);
    if(im){g.drawImage(im,-12,-24,24,24);g.restore();return;}
    const body=side?'#b8362a':(ad.factions[fac]?ad.factions[fac].c:'#2c5aa8'),bob=Math.sin(ph)*1.2;
    if(t==='cav'){g.fillStyle='#6b4a2a';g.fillRect(-9,-9,17,7);g.fillRect(-8,-3,2,4);g.fillRect(5,-3,2,4);g.fillRect(7,-13,4,6);}
    g.fillStyle=body;g.fillRect(-4,(t==='cav'?-19:-15)+bob,8,9);g.fillStyle='#f1c9a0';g.beginPath();g.arc(0,(t==='cav'?-22:-18)+bob,3.2,0,7);g.fill();
    g.fillStyle=side?'#5a1a12':'#1a2a4a';g.fillRect(-3.5,(t==='cav'?-26:-22)+bob,7,2.5);
    if(t!=='cav'){g.fillStyle='#3a2716';g.fillRect(-3,-6,2,6);g.fillRect(1,-6,2,6);}
    g.strokeStyle='#e8e0d0';g.lineWidth=1.3;g.beginPath();
    if(t==='inf'||t==='cav'){g.moveTo(3,(t==='cav'?-12:-8)+bob);g.lineTo(9,(t==='cav'?-30:-26)+bob);}
    else if(t==='arc'){g.strokeStyle='#c9a35a';g.arc(5,-13+bob,6,-1.2,1.2);}else{g.strokeStyle='#f2c14e';g.moveTo(4,-10+bob);g.lineTo(7,-16+bob);}
    g.stroke();g.restore();}
  function drawUnit(f,dt){const p=upos(f),dir=f.side===0?1:-1;let x=p.x,y=p.y;if(f.lunge>0){f.lunge-=dt;x+=dir*8*Math.sin(Math.max(0,f.lunge)/.22*Math.PI);}
    const n=f.alive?Math.max(1,Math.ceil(SQ*f.hp/f.max)):0,ph=last*.008;g.save();
    if(f.aura>0){f.aura-=dt;g.globalAlpha=Math.min(1,f.aura*2);if(!img('aura',x-40,y-44,80,70)){const gr=g.createRadialGradient(x,y-10,6,x,y-10,44);gr.addColorStop(0,'#ffe58a');gr.addColorStop(1,'#ffb00000');g.fillStyle=gr;g.beginPath();g.ellipse(x,y-10,46,34,0,0,7);g.fill();}g.globalAlpha=1;}
    g.fillStyle='#0003';g.beginPath();g.ellipse(x,y+6,42,12,0,0,7);g.fill();if(scr.intro<1.5){g.fillStyle='rgba(205,175,125,.4)';for(let q=0;q<3;q++){g.beginPath();g.arc(x-dir*(36+q*16),y+2-q*3,10+q*5,0,7);g.fill();}}
    const mob=!f.isGen&&f.side===1&&!art('sol_'+f.type+'_foe')?ad.mob(f.id):null;
    for(let i=0;i<SQ;i++){if(i>=n)continue;const r=Math.floor(i/4),c=i%4,sx=x+(c-1.5)*14*dir-(r-1.5)*5*dir,sy=y+(r-1.5)*8+(c-1.5)*1.5;
      if(mob){const hh=28,ww=hh*mob.width/mob.height;g.save();g.translate(sx,sy);g.drawImage(mob,-ww/2,-hh+Math.sin(ph+i)*.8,ww,hh);g.restore();}
      else soldier(f.type,f.side,f.fac,sx,sy,1.05+r*.05,ph+i);}
    if(!f.alive){g.globalAlpha=.5;text('✕',x,y-10,18,'#000','center',true);g.globalAlpha=1;}
    if(f.flash>0){f.flash-=dt;g.globalAlpha=.35;g.fillStyle='#fff';g.beginPath();g.ellipse(x,y-10,34,22,0,0,7);g.fill();g.globalAlpha=1;}
    if(f.fx.guard>0&&!img('shield',x-40,y-50,80,70)){g.strokeStyle='#ffd94acc';g.lineWidth=2.5;g.beginPath();g.ellipse(x,y-10,40,30,0,0,7);g.stroke();g.fillStyle='#ffd94a22';g.fill();}
    // banner: general portrait on a flag pole, or the troop name for plain soldiers
    const bx=x-dir*30,byy=y-44;g.strokeStyle='#3a2716';g.lineWidth=2;g.beginPath();g.moveTo(bx,y-2);g.lineTo(bx,byy-6);g.stroke();
    {const fk=f.isGen?'flag_'+f.fac:(f.side?'flag_2':'flag_0'),ch=f.isGen?(ad.factions[f.fac]||{n:'?'}).n[0]:tx(D.types[f.type].s);if(img(fk,bx-3,byy-12,22,33))text(ch,bx+8,byy+3,10,'#fff','center',true);else{rr(bx,byy-6,16,20,2,f.isGen&&ad.factions[f.fac]?ad.factions[f.fac].c:(f.side?'#8a2a20':'#2a4a8a'),'#f2c14e',1);text(ch,bx+8,byy+4,10,'#fff','center',true);}if(f.isGen)face(f.id,x-13,byy-30,26,f.u.g);}
    if(f.alive){const w=50,hb=y+10;rr(x-w/2,hb,w,5,2,'#000b');rr(x-w/2,hb,Math.max(0,w*f.hp/f.max),5,2,f.side?COL.foe:COL.ally);rr(x-w/2,hb+6,w*f.gauge/100,3,1,COL.gold);
      text(f.isGen?(f.u.sn||f.u.n):tx(D.types[f.type].n),x,hb+17,10,'#fff','center',true,70);
      if(f.fx.stun>0)text('★',x,y-40,13,'#ffd94a','center',true);if(f.fx.burn>0)text('🔥',x+22,y-26,12,'#fff','center');
      if(f.fx.atkUp>0)text('▲',x+26,y-14,11,'#ffb84a','center',true);if(f.fx.atkDown>0||f.fx.slow>0)text('▼',x+26,y-2,11,'#9fd3ff','center',true);}
    g.restore();}
  function drawFx(e){if(e.t<0)return;const a=1-e.t/e.life;g.save();
    if(e.k==='arrow'){const q=e.t/e.life,x=e.x1+(e.x2-e.x1)*q,y=e.y1+(e.y2-e.y1)*q-Math.sin(q*Math.PI)*30,ang=Math.atan2(e.y2-e.y1-Math.cos(q*Math.PI)*30*Math.PI,e.x2-e.x1);
      if(e.str){g.fillStyle='#b98aff';g.beginPath();g.arc(x,y,3,0,7);g.fill();}else if(!img('fx_arrow',x-8,y-3,16,6)){g.strokeStyle='#fff';g.lineWidth=1.5;g.beginPath();g.moveTo(x-Math.cos(ang)*8,y-Math.sin(ang)*8);g.lineTo(x,y);g.stroke();}}
    else if(e.k==='num'){g.globalAlpha=Math.min(1,a*2);text(e.s,e.x,e.y-e.t*28,e.big?18:13,e.c,'center',true);}
    else if(e.k==='boom'){g.globalAlpha=a;const r=20+e.t*80;if(!img(e.key,e.x-r,e.y-r,r*2,r*2)&&!img('fx_hit',e.x-r,e.y-r,r*2,r*2)){g.strokeStyle=e.c||'#ffd94a';g.lineWidth=4*a+1;g.beginPath();g.arc(e.x,e.y-10,r*.6,0,7);g.stroke();}}
    else if(e.k==='banner'){g.globalAlpha=Math.min(1,a*3);g.font=`bold 14px ${FONT}`;const w=g.measureText(e.s).width+20;if(!img('brush_stroke',e.x-w/2-14,e.y-17,w+28,34))rr(e.x-w/2,e.y-12,w,24,12,'#000c',COL.gold,1.5);else img('seal',e.x+w/2-2,e.y-15,14,14);text(e.s,e.x,e.y,14,COL.gold,'center',true);}
    g.restore();}
  // Command card selector. Does not change the deterministic core battle engine.
  function drawOrders(){const s=scr;g.fillStyle='rgba(5,5,8,.82)';g.fillRect(0,0,W,H);
    panel(115,34,410,288,L.order);text(L.orderTip,W/2,75,11,COL.dim,'center',false,380);
    ORDERS.forEach((o,i)=>{const x=136+(i%2)*188,y=101+Math.floor(i/2)*90,sel=s.order===o.id;
      btn(x,y,176,80,o.icon+' '+tx(o.n),()=>{s.order=o.id;S.order=o.id;save();ov=null;},{fill:sel?'#654623':'#302116',stroke:sel?COL.gold:COL.line,size:14});
      text(tx(o.d),x+88,y+60,11,COL.text,'center',false,160);});
    btn(245,291,150,24,'← '+L.back,()=>{ov=null;},{size:12});}
  /* ---------- result ---------- */
  function drawResult(){const s=scr,r=s.res,G=s.G;g.fillStyle='#000a';g.fillRect(0,0,W,H);rr(170,30,300,300,16,'#2a1c11',COL.gold,2);
    text(r.win?L.win:L.lose,W/2,58,22,r.win?COL.gold:'#ff9a8a','center',true);
    for(let i=0;i<3;i++)star(W/2-36+i*36,92,14,r.stars>i);text(L.star3,W/2,116,9,COL.dim,'center',false,280);
    let y=138;text(`${L.gold} +${r.gold}${r.bonus?` (${L.starBonus} +${r.bonus})`:''} · ${L.exp} +${r.exp}`,W/2,y,12,COL.text,'center',true,280);y+=20;
    const ups=Object.entries(r.ups).filter(([,v])=>v>0).map(([id,v])=>`${UID[id].sn||UID[id].n} +${v}`);if(ups.length){text(`${L.lvup}: ${ups.join(', ')}`,W/2,y,11,'#7be08c','center',true,280);y+=18;}
    if(r.unlock){face(r.unlock,W/2-110,y-4,30,UID[r.unlock].g);text(`${L.newGen}: ${UID[r.unlock].n}`,W/2-72,y+11,13,COL.gold,'left',true,200);y+=34;}
    const by=Math.max(y+6,214);
    btn(196,by,248,32,r.win?L.next:L.retry,()=>{if(r.win){const n=Math.min(G.n+1,S.cleared+1);openForm(n);}else{scr=s.from;ov=null;}},{fill:COL.red,stroke:COL.gold,size:14});
    const used=s.adUsed;
    if(r.win)btn(196,by+38,248,26,used?L.done:L.adDouble,used?null:()=>rewarded('legion_double',()=>{s.adUsed=1;S.gold+=r.gold;for(const id of s.from.team)C.addExp(S.gens[id],r.exp);save();}),{size:12,dis:used});
    else btn(196,by+38,248,26,L.adRetry,()=>rewarded('legion_retry',()=>{scr=s.from;startBattle(1.2);}),{size:12});
    btn(196,by+70,248,24,L.map,()=>openMap(Math.floor((G.n-1)/D.curve.gatesPerChapter)),{size:12});}
  function rewarded(kind,done){if(ad.ads&&ad.ads.rewarded)ad.ads.rewarded(kind,done);else done();}
  /* ---------- loop + input ---------- */
  function frame(t){if(!alive)return;const dt=Math.min(.1,last?(t-last)/1000:0);last=t;
    k=Math.min(cv.width/W,cv.height/H);ox=(cv.width-W*k)/2;oy=(cv.height-H*k)/2;
    g.setTransform(1,0,0,1,0,0);g.fillStyle='#120c07';g.fillRect(0,0,cv.width,cv.height);g.setTransform(k,0,0,k,ox,oy);
    g.save();g.beginPath();g.rect(0,0,W,H);g.clip();BT=[];
    if(scr.k==='map')drawMap();else if(scr.k==='form')drawForm();else drawBattle(dt);
    if(ov&&ov.k==='result'){BT=[];drawResult();}else if(ov&&ov.k==='orders'){BT=[];drawOrders();}
    if(toastM){toastM.t-=dt;g.font=`bold 13px ${FONT}`;const w=g.measureText(toastM.m).width+28;g.globalAlpha=Math.min(1,toastM.t*3);rr(W/2-w/2,H-64,w,30,15,'#000d');text(toastM.m,W/2,H-49,13,'#fff','center',true);g.globalAlpha=1;if(toastM.t<=0)toastM=null;}
    g.restore();raf(frame);}
  function find(px,py){const x=(px-ox)/k,y=(py-oy)/k;for(let i=BT.length-1;i>=0;i--){const b=BT[i];if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h)return b;}return null;}
  function touch(type,px,py){if(type==='down'){down=find(px,py);}else if(type==='up'){const b=find(px,py);if(b&&down&&b.x===down.x&&b.y===down.y&&b.fn)b.fn();down=null;}}
  openMap();raf(frame);
  return{touch,close(){alive=false;},get save(){return S;},debug:{get scr(){return scr;},get ov(){return ov;},openForm,startBattle}};}
root.LEGION={mount,T,ART_KEYS,core:C};
})(typeof window!=='undefined'?window:typeof GameGlobal!=='undefined'?GameGlobal:globalThis);
