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
  lvup:'레벨 업',ko:'격파!',floor:n=>`${n}층`,go:'도전 ▶',introT:'관문 돌파',intro:['적의 성을 한 층씩 함락하는 탑 오르기예요.','장수 3명+증원군으로 출진! 자동 또는 수동(스킬·군략 직접 사용). 상성: 기병→궁병→창병→기병','10층마다 성주 보스! 깬 층은 매일 조건이 바뀌어 다시 도전할 수 있어요.'],introGo:'시작',speed:'배속',skip:'건너뛰기',noGold:'금이 부족해요',locked:'이전 관문을 먼저 돌파하세요',replayHint:'깬 관문은 매일 조건이 바뀌어요 · 별 3개에 도전!',
  starBonus:'새 별 보너스',tapSlot:'칸을 누른 뒤 장수를 고르면 그 자리에 들어가요',star3:'★ 승리  ★ 병력 50%↑  ★ 부대 손실 없음',done:'받음',form:'진형',order:'군령 카드',orderTip:'출전 전에 군령을 하나 선택해 아군을 강화합니다',pickOrder:'군령 선택',res:'증원',resLock:n=>`${n}관문 해금`,reinf:'증원군 도착!',auto:'자동',manual:'수동',cp:'군략',manTip:'수동: 금빛 장수를 눌러 스킬, 가운데 군략 카드로 전략 사용'},
 zh:{title:'军团征战',back:'返回',chap:n=>`第${n}章`,gate:'关卡',boss:'首领',enemy:'敌军',ally:'我军编队',roster:'拥有武将',start:'出征',conquer:'征伐',
  today:'今日条件',syn:'组合效果',none:'无',traits:'战场条件',read:'敌将看穿了我军编队，更换了兵种！',tip:(a,b)=>`敌方${a}多 → ${b}有利`,
  train:'训练',gold:'金',exp:'经验',lv:'Lv',full:'位置已满，请先点要替换的位置',need:'请编入3名武将',win:'攻破关隘!',lose:'战败…',
  next:'下一关',retry:'再次挑战',map:'关卡列表',adDouble:'▶ 看广告奖励翻倍',adRetry:'▶ 看广告兵力+20%再战',newGen:'新武将加入',
  lvup:'升级',ko:'击破!',floor:n=>`第${n}层`,go:'挑战 ▶',introT:'军团征战',intro:['逐层攻破敌城的爬塔玩法。','3名武将+援军出征！自动或手动(亲自释放技能·军略)。克制：骑兵→弓兵→枪兵→骑兵','每10层有城主首领！已攻破的层每天条件变化，可再次挑战。'],introGo:'开始',speed:'倍速',skip:'跳过',noGold:'金不足',locked:'请先攻破前一关',replayHint:'已攻破的关卡每天条件都会变化 · 挑战三星！',
  starBonus:'新星奖励',tapSlot:'先点位置，再选武将，即可放入该位置',star3:'★ 胜利  ★ 兵力50%↑  ★ 无部队损失',done:'已领取',form:'阵形',order:'军令牌',orderTip:'出征前选择一道军令强化我军',pickOrder:'选择军令',res:'援军',resLock:n=>`第${n}关解锁`,reinf:'援军到达!',auto:'自动',manual:'手动',cp:'军略',manTip:'手动：点金色武将释放技能，中间军略牌使用战略'}};
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
  /* ---------- v30 sound: synthesized war drums, gong and hit effects (no audio files) ---------- */
  const AU={c:null,mute:!!S.mute,next:0,step:0,lastHit:0};
  function auOn(){if(AU.c){if(AU.c.state!=='running')AU.c.resume();return;}try{const AC=root.AudioContext||root.webkitAudioContext;if(AC)AU.c=new AC();}catch(e){}}
  function tn(f,d,type,v,slide,delay){const c=AU.c;if(!c||AU.mute)return;const t=c.currentTime+(delay||0),o=c.createOscillator(),gn=c.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);
    if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,f*slide),t+d);gn.gain.setValueAtTime(v,t);gn.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(gn).connect(c.destination);o.start(t);o.stop(t+d+.02);}
  function nz(d,v,fc,delay){const c=AU.c;if(!c||AU.mute)return;const t=c.currentTime+(delay||0),n=Math.max(1,Math.floor(c.sampleRate*d)),b=c.createBuffer(1,n,c.sampleRate),a=b.getChannelData(0);
    for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);const so=c.createBufferSource();so.buffer=b;const fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=fc||1500;const gn=c.createGain();gn.gain.value=v;so.connect(fl).connect(gn).connect(c.destination);so.start(t);}
  const SFX={hit:()=>nz(.05,.09,2400),big:()=>{tn(95,.28,'sine',.32,.5);nz(.12,.16,900);},skill:()=>{tn(196,1.1,'sine',.16);tn(294,.9,'triangle',.07,0,.02);},
    die:()=>{nz(.28,.2,700);tn(72,.32,'sine',.22,.6);},win:()=>[523,659,784,1047].forEach((f,i)=>tn(f,.4,'triangle',.11,0,i*.13)),lose:()=>[392,330,262].forEach((f,i)=>tn(f,.45,'triangle',.09,0,i*.2)),
    tap:()=>tn(880,.05,'square',.025),gong:()=>{tn(110,2.2,'sine',.24);tn(165,1.7,'sine',.09);nz(.3,.06,500);}};
  function sfx(k){try{if(k==='hit'){const t=performance.now();if(t-AU.lastHit<90)return;AU.lastHit=t;}const FM={hit:['sfx_hit',.3],big:['sfx_drum',.5],gong:['sfx_gong',.5],win:['sfx_victory',.6]};if(FM[k]&&playF(FM[k][0],FM[k][1]))return;SFX[k]&&SFX[k]();}catch(e){}}
  const AF={};if(root.Audio)['bgm_legion','bgm_boss','bgm_menu','sfx_hit','sfx_gong','sfx_drum','sfx_victory'].forEach(k=>{try{const a=new root.Audio('audio/'+k+'.mp3');a.preload='auto';if(k.startsWith('bgm'))a.loop=true;AF[k]=a;}catch(e){}});
  function playF(k,v){const a=AF[k];if(!a||AU.mute)return false;try{const c=k.startsWith('bgm')?a:a.cloneNode();c.volume=v;if(!k.startsWith('bgm'))c.currentTime=0;const pr=c.play();if(pr&&pr.catch)pr.catch(()=>{});}catch(e){return false;}return true;}
  function bgmFile(want){if(AU.cur===want)return;if(AU.cur&&AF[AU.cur])try{AF[AU.cur].pause();}catch(e){}AU.cur=want;if(want){try{AF[want].currentTime=0;}catch(e){}playF(want,want==='bgm_legion'?.38:.5);}}
  const PENT=[294,330,392,440,494,587,659];
  const bgmTimer=setInterval(()=>{const c=AU.c;if(!c||AU.mute||!alive||c.state!=='running')return;const battle=scr&&scr.k==='battle'&&scr.bt&&!scr.bt.done;if(AF.bgm_legion){bgmFile(AU.mute?null:battle?(scr.G&&scr.G.boss&&AF.bgm_boss?'bgm_boss':'bgm_legion'):'bgm_menu');return;}
    const beat=60/(battle?112:70);if(AU.next<c.currentTime)AU.next=c.currentTime+.05;
    while(AU.next<c.currentTime+.3){const st=++AU.step,d=AU.next-c.currentTime;
      if(battle){if(st%4===1)tn(62,.38,'sine',.4,.55,d);else if(st%4===3)tn(74,.26,'sine',.24,.6,d);else nz(.03,.05,3000,d);
        if(st%2===0&&st%16<12)tn(PENT[(st*3+((st/8)|0))%PENT.length],beat*.45,'triangle',.045,0,d);AU.next+=beat/2;}
      else{if(st%2===1)tn(PENT[(st*5)%PENT.length]/2,beat*1.6,'triangle',.045,0,d);if(st%8===1)tn(98,beat*3,'sine',.06,0,d);AU.next+=beat;}}},60);
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
  const GC={};
  function drawMap(){const GP=D.curve.gatesPerChapter,maxCh=Math.floor(S.cleared/GP),ch=scr.ch;
    if(!img('map_bg',0,0,W,H)){const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#3b2a1a');gr.addColorStop(1,'#1d140d');g.fillStyle=gr;g.fillRect(0,0,W,H);}
    topbar(L.title,()=>{alive=false;ad.onExit&&ad.onExit();},()=>text(`★ ${C.totalStars(S)}`,W-80,18,13,COL.gold,'right',true));
    const info=C.chapterOf(ch*GP+1);
    btn(150,46,34,30,'‹',ch>0?()=>scr.ch--:null,{dis:ch<=0,size:18});btn(456,46,34,30,'›',ch<maxCh?()=>scr.ch++:null,{dis:ch>=maxCh,size:18});
    text(`${L.chap(ch+1)} · ${tx(info.ch.n)}${info.round>1?' '+(ROMAN[info.round]||info.round):''}`,W/2,61,17,COL.gold,'center',true,260);
    // v30: tower floors — plaques climbing the fortress, boss floor on top
    const P=[];for(let i=0;i<GP-1;i++)P.push([i%2?468:172,326-i*24.5]);P.push([W/2,94]);
    g.save();g.strokeStyle='rgba(255,220,150,.35)';g.lineWidth=2;g.setLineDash([3,6]);g.beginPath();P.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.stroke();g.restore();
    for(let i=0;i<GP;i++){const n=ch*GP+i+1,[x,y]=P[i],boss=i===GP-1,open=n<=S.cleared+1,done=n<=S.cleared,cur=n===S.cleared+1,w=boss?236:176,h=boss?40:24;
      const gt=GC[n]||(GC[n]=C.gate(n,0,[])),gen=gt.foes.find(f=>f.gen);
      g.save();if(cur){g.shadowColor='#ffd94a';g.shadowBlur=12+Math.sin(last*.006)*6;}
      if(!img(!open?'panel_lock':boss?'panel_boss':'panel_normal',x-w/2,y-h/2,w,h))rr(x-w/2,y-h/2,w,h,7,!open?'rgba(28,20,14,.86)':boss?'rgba(112,30,20,.94)':done?'rgba(44,58,32,.92)':'rgba(72,46,22,.94)',!open?'#5a4a36':cur?'#ffd94a':boss?'#ff9a6a':COL.gold,cur?2.5:1.5);if(done){g.save();g.globalAlpha=.25;g.fillStyle='#5ad06a';g.fillRect(x-w/2+4,y-h/2+3,w-8,h-6);g.restore();}g.restore();
      rr(x-w/2+3,y-h/2+3,boss?54:40,h-6,5,boss?'#3a0d08':'#2a1a0e');text(L.floor(n),x-w/2+3+(boss?27:20),y+1,boss?13:10,open?COL.gold:'#7a6a56','center',true,boss?50:38);
      const fx=x-w/2+(boss?62:47);let nx=fx;if(gen&&open&&UID[gen.gen]){face(gen.gen,fx,y-h/2+3,h-6,UID[gen.gen].g);nx=fx+h-2;}
      text(open?(gen&&UID[gen.gen]?UID[gen.gen].n:(boss?L.boss:L.gate+' '+n)):'🔒',nx,y+1,boss?15:11,open?'#f6ead2':'#7a6a56','left',true,w-(nx-x+w/2)-44);
      for(let k2=0;k2<3;k2++)star(x+w/2-36+k2*12,y,5,(S.stars[n]||0)>k2);
      if(cur&&!boss)text(L.go,i%2?x-w/2-6:x+w/2+6,y+1,11,'#ffd94a',i%2?'right':'left',true);
      hit(x-w/2,y-h/2,w,h,()=>open?openForm(n):toast(L.locked));}
    text(L.replayHint,W/2,H-6,10,COL.dim,'center',false,600);
    if(!S.intro){hit(0,0,W,H,()=>{});g.fillStyle='#000b';g.fillRect(0,0,W,H);rr(120,70,400,220,14,'#2a1c11',COL.gold,2);text(L.introT,W/2,98,18,COL.gold,'center',true);
      let yy=128;for(const line of L.intro)yy=wrap('· '+line,140,yy,12,COL.text,360,17)+4;
      btn(250,246,140,32,L.introGo,()=>{S.intro=1;save();},{fill:COL.red,stroke:COL.gold,size:14});}
    btn(W-176,5,34,24,AU.mute?'🔇':'♪',()=>{AU.mute=!AU.mute;S.mute=AU.mute;if(AU.mute)bgmFile(null);save();},{size:12});}
  /* ---------- formation ---------- */
  function openForm(n){const replay=n<=S.cleared,pt=S.team.filter(id=>UID[id]).map(id=>C.typeOf(UID[id]));
    const G=C.gate(n,replay?dayNum():0,pt);let form=S.form;if(!D.forms[form]||D.forms[form].unlock>Math.max(1,S.cleared+1))form='feng';
    const rs=D.resSlots?D.resSlots(n,0):0,team=S.team.filter(id=>S.gens[id]&&UID[id]).slice(0,TS+rs);
    if(team.length>=TS){const rest=Object.keys(S.gens).filter(i=>UID[i]&&!team.includes(i)).sort((a,b)=>(UID[b].g-UID[a].g)||(S.gens[b].lv-S.gens[a].lv));while(team.length<TS+rs&&rest.length)team.push(rest.shift());}
    scr={k:'form',G,replay,rs,team,form,page:0,sel:-1,order:ORDERS.some(o=>o.id===S.order)?S.order:(ORDERS[0]&&ORDERS[0].id)};ov=null;}
  const foeList=G=>G.foes.map(f=>f.gen?{u:UID[f.gen],lv:f.lv}:{mob:f.mob,type:f.type,lv:f.lv});
  function formsOpen(){return Object.keys(D.forms).filter(f=>D.forms[f].unlock<=Math.max(1,S.cleared+1));}
  function drawForm(){const s=scr,G=s.G;g.fillStyle=COL.bg;g.fillRect(0,0,W,H);
    topbar(`${L.gate} ${G.n} · ${gname(G)} ${G.k}/${D.curve.gatesPerChapter}${G.boss?' · '+L.boss:''}${s.replay?' · '+L.today:''}`,()=>openMap(G.c));
    /* enemy panel */
    panel(6,42,200,312,L.enemy);const foes=foeList(G);
    miniForm(14,62,184,132,G.form,foes,true);
    text(`${L.form}: ${tx(D.forms[G.form].n)}`,14,204,11,COL.text,'left',true,184);
    let y=220;const fres=(G.res||[]).map(f=>f.gen?{u:UID[f.gen],lv:f.lv}:{mob:f.mob,type:f.type,lv:f.lv});
    if(fres.length){text(`${L.res} ×${fres.length}`,14,y,11,'#ff9a8a','left',true);fres.forEach((m,j)=>{const x=70+j*28;if(m.u)face(m.u.id,x,y-11,22,m.u.g);else badge(m.type,x+11,y,9);});y+=18;}
    const fs=C.synergies(foes.concat(fres));if(fs.length){text(fs.map(x=>tx(x.n)).join(' · '),14,y,11,'#ff9a8a','left',true,184);y+=16;}
    text(L.traits,14,y,11,COL.dim,'left',true);y+=15;
    if(!G.traits.length){text(L.none,14,y,11,'#8a7a66');y+=15;}
    for(const t of G.traits){const tr=D.traits[t];rr(12,y-7,188,32,6,'#3a2716');text(tx(tr.n),18,y+2,11,COL.gold,'left',true,176);text(tx(tr.d),18,y+16,10,COL.text,'left',false,176);y+=36;}
    if(G.boss)wrap(L.read,14,Math.min(y+4,330),10,'#ff9a6a',184,13);
    /* ally panel */
    panel(212,42,216,312,L.ally);const F=D.forms[s.form],fo=formsOpen(),fi=fo.indexOf(s.form);
    btn(220,58,26,24,'‹',()=>{s.form=fo[(fi-1+fo.length)%fo.length];},{size:15});btn(394,58,26,24,'›',()=>{s.form=fo[(fi+1)%fo.length];},{size:15});
    text(tx(F.n),320,70,14,COL.gold,'center',true,140);text(tx(F.d),320,92,10,COL.text,'center',false,200);
    const team=s.team.map(id=>({u:UID[id],lv:S.gens[id].lv}));
    for(let i=0;i<TS;i++){const sl=F.slots[i],x=sl.col===0?352:268,yy=102+sl.y*80,id=s.team[i];
      rr(x-27,yy-4,54,50,8,s.sel===i?'#5a3d22':'#241811',s.sel===i?COL.gold:COL.line,s.sel===i?2.5:1.2);
      if(id){const u=UID[id];face(id,x-15,yy-1,30,u.g);badge(C.typeOf(u),x+17,yy+3,7);text(`${u.sn||u.n} ${L.lv}${S.gens[id].lv}`,x,yy+38,9,COL.text,'center',true,52);}
      else text('+',x,yy+22,22,'#6b4a2a','center',true);
      text(sl.col===0?'▶':'',x+32,yy+22,10,'#6b4a2a','center');
      hit(x-27,yy-4,54,50,()=>tapSlot(i));}
    // reinforcements: reserve squads march in when a front squad falls
    text(L.res,222,250,10,COL.dim,'left',true);
    for(let j=0;j<D.curve.resMax;j++){const i=TS+j,x=252+j*56,y=238,open=j<s.rs,id=s.team[i];
      rr(x,y,52,26,6,!open?'#1c140e':s.sel===i?'#5a3d22':'#241811',s.sel===i?COL.gold:open?COL.line:'#3a2a1a',s.sel===i?2:1);
      if(!open){text('🔒 '+L.resLock([5,15,30][j]||'?'),x+26,y+13,8,'#6b5a46','center',true,50);continue;}
      if(id){const u=UID[id];face(id,x+2,y+2,22,u.g);text(`${u.sn||u.n}`,x+38,y+9,9,COL.text,'center',true,26);text(`${L.lv}${S.gens[id].lv}`,x+38,y+20,8,COL.dim,'center',false,26);}
      else text('+',x+26,y+14,16,'#6b4a2a','center',true);
      hit(x,y,52,26,()=>tapSlot(i));}
    // selected slot → training
    let ty=276;if(s.sel>=0&&s.team[s.sel]){const id=s.team[s.sel],r=S.gens[id],c=C.trainCost(r.lv);
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
  function tapSlot(i){const s=scr;if(i>=TS+(s.rs||0))return;if(s.sel<0){s.sel=i;return;}if(s.sel===i){if(s.team[i])s.team.splice(i,1);s.sel=-1;return;}
    const a=s.team[s.sel],b=s.team[i];if(a&&b){s.team[s.sel]=b;s.team[i]=a;}s.sel=-1;}
  function tapRoster(id){const s=scr;delete S.gens[id].isNew;const at=s.team.indexOf(id);
    if(s.sel>=0){if(at>=0&&at!==s.sel){const o=s.team[s.sel];s.team[at]=o;s.team[s.sel]=id;s.team=s.team.filter(Boolean);}
      else if(s.sel<s.team.length)s.team[s.sel]=id;else s.team.push(id);s.sel=-1;return;}
    if(at>=0)s.team.splice(at,1);else if(s.team.length<TS+(s.rs||0))s.team.push(id);else toast(L.full);}
  /* ---------- battle ---------- */
  function startBattle(boost){sfx('gong');const s=scr.k==='form'?scr:scr.from;S.team=s.team.slice();S.form=s.form;save();
    const team=s.team.slice(0,TS).map(id=>({u:UID[id],lv:S.gens[id].lv})),resA=s.team.slice(TS,TS+(s.rs||0)).map(id=>({u:UID[id],lv:S.gens[id].lv}));
    const selected=ORDERS.find(o=>o.id===s.order);
    S.order=selected?selected.id:S.order;save();
    const battleTraits=s.G.traits.slice();if(selected)battleTraits.push(selected.trait);
    const bt=C.newBattle(team,foeList(s.G),{formA:s.form,formB:s.G.form,traits:battleTraits,seed:(s.G.seed+Date.now())>>>0,boost,resA,resB:foeList({foes:s.G.res||[]}),manual:!!S.manual});
    scr={k:'battle',from:s,G:s.G,bt,order:selected&&selected.id,sp:S.sp||1,fx:[],acc:0,end:0,res:null};ov=null;}
  /* battle view: every troop is a squad of small soldiers (count follows HP), the general rides a banner.
     Art keys (all optional): bg_<chapter art> 640×260 sky/fortress strip · ground 640×140 · vs 64×64 ·
     sol_<type>_<ally|foe> 48×48 soldier (feet at bottom centre) · flag_<faction> 40×56 · aura · shield 128×128 */
  const SQ=16,BY=150,BH=190;
  function upos(f){const ally=f.side===0;let x=ally?(f.col===0?250:150):(f.col===0?390:490);
    if(f.adv)x+=(ally?1:-1)*f.adv;const s0=scr&&scr.intro!==undefined?Math.max(0,1-scr.intro/1.2):0;x+=(ally?-1:1)*s0*s0*230;if(f.ent>0)x+=(ally?-1:1)*f.ent*f.ent*260;return{x,y:BY+f.y*BH};}
  function bgDraw(G){const im=art('bg_'+G.chapter.art);
    if(im&&im.width/im.height>2.45){const h=420,w=h*im.width/im.height;g.drawImage(im,(W-w)/2,-60,w,h);return;}if(im){const h=Math.min(H,W*im.height/im.width);g.drawImage(im,0,0,W,h);}else{const gr=g.createLinearGradient(0,0,0,240);gr.addColorStop(0,'#c98b4a');gr.addColorStop(1,'#7a5a3a');g.fillStyle=gr;g.fillRect(0,0,W,240);}
    if(!img('ground',0,220,W,140)){const gr=g.createLinearGradient(0,170,0,H);gr.addColorStop(0,'rgba(176,132,82,0)');gr.addColorStop(.25,'#b08452');gr.addColorStop(1,'#7a5634');g.fillStyle=gr;g.fillRect(0,170,W,H-170);
      g.fillStyle='#0000000f';for(let i=0;i<40;i++){const x=(i*97)%W,y=230+((i*53)%120);g.beginPath();g.ellipse(x,y,14,3,0,0,7);g.fill();}}}
  function vsBar(bt,G){let hA=bt.A.reduce((a,f)=>a+f.hp,0),mA=bt.A.reduce((a,f)=>a+f.max,0),hB=bt.B.reduce((a,f)=>a+f.hp,0),mB=bt.B.reduce((a,f)=>a+f.max,0);
    if(C.pool&&bt.pend){const pa=C.pool(bt,0),pb=C.pool(bt,1);hA=pa.hp;mA=pa.max;hB=pb.hp;mB=pb.max;}
    const lead=s=>s.find(f=>f.isGen);const la=lead(bt.A),lb=lead(bt.B);
    rr(70,8,232,24,5,'#0b1a33',COL.gold,1.5);rr(72,10,228*hA/mA,20,4,'#2f6fd0');rr(338,8,232,24,5,'#330b0b',COL.gold,1.5);rr(340+228*(1-hB/mB),10,228*hB/mB,20,4,'#c23a2a');
    text(la?`${la.u.n} (${L.lv}${la.lv})`:L.ally,80,20,12,'#fff','left',true,200);
    text(lb?`${lb.u.n} (${L.lv}${lb.lv})`:`${L.gate} ${G.n}`,560,20,12,'#fff','right',true,200);
    if(!img('vs',W/2-26,-2,52,52)){g.save();g.translate(W/2,20);g.rotate(Math.PI/4);rr(-17,-17,34,34,4,'#3a2716',COL.gold,2.5);g.restore();text('VS',W/2,21,15,COL.gold,'center',true);}
    text(`${Math.max(0,Math.ceil(bt.limit-bt.t))}`,W/2,52,13,'#fff','center',true);}
  function reserve(){if(img('reserve_ally',-10,150,250,60)&&img('reserve_foe',400,150,250,60))return;for(let sd=0;sd<2;sd++){const x0=sd?468:2,c=sd?'#5a1a14':'#14284a';g.strokeStyle=c;g.lineWidth=1;for(let i=0;i<26;i++){const x=x0+(i%13)*13+(i>12?6:0),y=196+(i>12?10:0);g.fillStyle=c;g.globalAlpha=i>12?.55:.4;g.fillRect(x,y-12,6,12);g.beginPath();g.arc(x+3,y-14,3,0,7);g.fill();g.beginPath();g.moveTo(x+5,y-8);g.lineTo(x+8,y-26);g.stroke();if(i%4===0){g.fillStyle=sd?'#c23a2a':'#2f6fd0';g.fillRect(x+8,y-38+Math.sin(last*.004+i)*1.5,10,12);}}}g.globalAlpha=1;}
  function drawBattle(dt){const s=scr,bt=s.bt,G=s.G;s.intro=(s.intro||0)+dt;if(s.shk>0)s.shk-=dt;const sh=(s.intro>1.1&&s.intro<1.45?(Math.random()-.5)*6:0)+(s.shk>0?(Math.random()-.5)*5:0);g.save();g.translate(sh,sh*.5);if(s.zoom){s.zoom.t+=dt;const zq=s.zoom.t/.38;if(zq>=1)s.zoom=null;else{const z=1+.08*Math.sin(zq*Math.PI);g.translate(s.zoom.x,s.zoom.y);g.scale(z,z);g.translate(-s.zoom.x,-s.zoom.y);}}bgDraw(G);reserve();
    if(s.stop>0)s.stop-=dt;else if(!bt.done&&s.intro>1.2){s.acc+=dt*s.sp;let n=0;while(s.acc>=D.curve.tick&&!bt.done&&n++<200){s.acc-=D.curve.tick;for(const e of C.step(bt))onEv(e);}}
    // melee squads march to the middle in the first seconds, ranged ones hold
    for(const f of bt.A.concat(bt.B))if(D.types[f.type].range==='melee')f.adv=Math.min(f.col===0?40:30,bt.t*45);
    const all=bt.A.concat(bt.B).sort((a,b)=>upos(a).y-upos(b).y);for(const f of all)drawUnit(f,dt);
    for(let i=s.fx.length-1;i>=0;i--){const e=s.fx[i];e.t+=dt;if(e.t>e.life){s.fx.splice(i,1);continue;}drawFx(e);}
    // v30 juice (render only): skill cut-in, boss intro card, victory burst
    if(s.cut){s.cut.t+=dt;const c=s.cut,q=Math.min(1,c.t/.18),out=c.t>.7?Math.min(1,(c.t-.7)/.2):0,dir=c.side?-1:1,x0=c.side?W+120:-120,x1=c.side?W-150:150,cx=x0+(x1-x0)*q+dir*-60*out;
      g.save();g.globalAlpha=1-out;if(!img('brush_stroke',cx-120,H/2-38,240,76)){g.fillStyle='#000b';g.fillRect(cx-110,H/2-30,220,60);}
      if(c.u)face(c.u.id,cx-(c.side?-40:100),H/2-30,60,c.u.g);text(c.name,cx+(c.side?-50:10),H/2+2,20,COL.gold,'left',true,150);img('seal',cx+(c.side?-70:118),H/2-26,22,22);g.restore();if(c.t>.9)s.cut=null;}
    if(G.boss&&s.intro<1.3&&!s.bossShown){const a=Math.min(1,s.intro/.25)*(s.intro>1.05?Math.max(0,1-(s.intro-1.05)/.25):1),bg=bt.B.find(f=>f.isGen);
      g.save();g.globalAlpha=a;g.fillStyle='#000a';g.fillRect(0,H/2-46,W,92);img('brush_stroke',W/2-170,H/2-40,340,80);if(bg)face(bg.id,W/2-150,H/2-32,64,bg.u.g);
      text(L.boss,W/2-70,H/2-14,13,'#ff9a6a','left',true);text(bg?bg.u.n:(L.gate+' '+G.n),W/2-70,H/2+12,24,COL.gold,'left',true,220);g.restore();}
    if(bt.done&&!s.vfx&&(sfx(bt.win?'win':'lose'),bt.win||(s.vfx=1,0))){s.vfx=1;for(let i=0;i<14;i++)s.fx.push({k:'boom',x:380+Math.random()*200,y:120+Math.random()*180,t:-Math.random()*.4,life:.6,key:'fx_hit',c:'#ffd94a'});s.shk=.3;}
    if(s.fl){s.fl.t+=dt;if(s.fl.t>.25)s.fl=null;else{g.save();g.globalAlpha=.22*(1-s.fl.t/.25);g.fillStyle=s.fl.c;g.fillRect(-10,-10,W+20,H+20);g.restore();}}
    g.restore();vsBar(bt,G);
    btn(6,40,58,22,'← '+L.back,()=>{scr=s.from;},{size:10});
    battleCtl(s,bt);
    btn(W-136,40,62,22,`${L.speed} ${s.sp}x`,()=>{s.sp=s.sp===1?2:s.sp===2?4:1;S.sp=s.sp;save();},{size:10});
    btn(W-68,40,62,22,L.skip,()=>{C.finish(bt);s.fx.length=0;},{size:10,dis:S.cleared<G.n,why:L.locked});
    let tx0=70;for(const t of G.traits){const nm=tx(D.traits[t].n);g.font=`bold 10px ${FONT}`;const w=g.measureText(nm).width+12;rr(tx0,42,w,18,9,'#000a');text(nm,tx0+w/2,51,10,COL.gold,'center',true);tx0+=w+4;}
    const sa=bt.synA.map(x=>tx(x.n)).join(' · '),sb=bt.synB.map(x=>tx(x.n)).join(' · ');
    if(sa){rr(4,H-22,Math.min(300,sa.length*11+14),18,9,'#000a');text(sa,10,H-13,10,'#9fe8a8','left',true,290);}if(sb){rr(W-4-Math.min(300,sb.length*11+14),H-22,Math.min(300,sb.length*11+14),18,9,'#000a');text(sb,W-10,H-13,10,'#ffb0a0','right',true,290);}
    if(bt.done){s.end+=dt;if(!s.res){s.res=C.settle(S,G,s.from.team,bt);save();}if(s.end>.6&&!ov)ov={k:'result'};}}
  /* reinforcements waiting, manual skill buttons, strategy (군략) cards */
  function battleCtl(s,bt){const man=!!bt.manual,pulse=.5+.5*Math.sin(last*.01);
    btn(W-204,40,64,22,man?'✋ '+L.manual:'⚙ '+L.auto,()=>{bt.manual=!bt.manual;S.manual=bt.manual;save();toast(bt.manual?L.manTip:L.auto);},{size:10,fill:man?'#5a2a1a':'#3a2716',stroke:man?COL.gold:COL.dim});
    // ally skill buttons (top-left)
    bt.A.forEach((f,i)=>{const x=6+i*42,y=66,ready=f.alive&&f.gauge>=100;
      rr(x,y,38,38,7,f.alive?'#241811e6':'#1a1a1ae6',ready&&man?COL.gold:COL.line,ready&&man?2+pulse*1.5:1);
      if(f.isGen)face(f.id,x+3,y+3,32,f.u.g);else badge(f.type,x+19,y+19,12);
      if(!f.alive){g.fillStyle='#000b';g.fillRect(x+1,y+1,36,36);}
      else{const q=f.gauge/100;g.fillStyle=ready?`rgba(255,210,80,${man?.25+.25*pulse:.2})`:'rgba(0,0,0,.45)';if(ready)g.fillRect(x+1,y+1,36,36);else g.fillRect(x+1,y+1,36,36*(1-q));}
      if(ready&&man)text('SKILL',x+19,y+44,8,COL.gold,'center',true);
      if(man&&ready)hit(x,y,38,38,()=>{for(const e of C.castNow(bt,f))onEv(e);});});
    // strategy cards (top-centre) share the 군략 gauge
    if(bt.cp&&D.cmds){const ids=Object.keys(D.cmds),cw=40,x0=W/2-(ids.length*(cw+6)-6)/2,full=bt.cp[0]>=100;
      ids.forEach((id,i)=>{const c=D.cmds[id],x=x0+i*(cw+6),y=62,on=full&&man;
        rr(x,y,cw,cw,7,on?'#4a2e14e6':'#241811cc',on?COL.gold:COL.line,on?2+pulse:1);text(c.icon,x+cw/2,y+15,15,on?'#fff':'#9a8a76','center',true);
        text(tx(c.n),x+cw/2,y+31,8,on?COL.gold:'#9a8a76','center',true,cw-2);if(on)hit(x,y,cw,cw,()=>{for(const e of C.useCmd(bt,0,id))onEv(e);});});
      const bw=ids.length*(cw+6)-6;rr(x0,106,bw,5,2,'#000b');rr(x0,106,bw*bt.cp[0]/100,5,2,full?COL.gold:'#8a6a3a');text(`${L.cp}${man?'':' · '+L.auto}`,W/2,117,8,full?COL.gold:COL.dim,'center',true);}
    // waiting reserves next to each army
    for(const side of[0,1]){const Q=((side?bt.QB:bt.QA)||[]).concat((bt.pend||[]).filter(p=>p.side===side).map(p=>p.f));if(!Q.length)continue;
      const bw=Q.length*24+38,bx=side?W-6-bw:6,by=side?66:120;rr(bx,by,bw,28,6,'#000a',side?'#8a3a2a':'#2a5a8a',1);
      text(L.res,side?bx+bw-16:bx+16,by+14,9,side?'#ffb0a0':'#9fe8a8','center',true,30);
      Q.forEach((f,j)=>{const x=side?bx+bw-32-(j+1)*24+2:bx+32+j*24,y=by+3;if(f.isGen)face(f.id,x,y,22,f.u.g);else badge(f.type,x+11,y+11,9);});}}
  /* v30: every skill gets a visible procedural effect (render only) */
  const SKC={qinglong:'#58e08a',charge7:'#9fd3ff',conquer:'#ff7a4a',snipe:'#ffd94a',t_cav:'#ffb060',eastwind:'#7be0b0',wushuang:'#c08aff',firewall:'#ff7a2a',t_arc:'#ffe08a',t_str:'#b98aff',roar:'#ff5a3a',trap:'#8a6aff',charm:'#ff8ad0',heal:'#7be08c',command:'#ffd94a',t_inf:'#9fd3ff'};
  const SKFX={qinglong:'slash',charge7:'slash',conquer:'slash',snipe:'slash',t_cav:'slash',eastwind:'swirl',wushuang:'ring',firewall:'flame',t_arc:'rain',t_str:'rune',roar:'ring',trap:'rune',charm:'swirl'};
  function skFx(s,sk,d,big){const c=SKC[sk]||'#ffd94a',k=SKFX[sk];if(s.fx.length>90)return;
    if(art('fx_'+sk)){s.fx.push({k:'boom',x:d.x,y:d.y-6,t:0,life:.5,key:'fx_'+sk,c});s.fx.push({k:'spark',x:d.x,y:d.y-8,t:0,life:.35,c});if(sk==='trap'||sk==='charm'||sk==='roar')s.fx.push({k:'stun',x:d.x,y:d.y-40,t:0,life:1,c});return;}
    if(!k)return;
    s.fx.push({k,x:d.x,y:d.y,t:0,life:k==='rain'?.55:.6,c,ang:Math.random()*Math.PI});s.fx.push({k:'spark',x:d.x,y:d.y-8,t:0,life:.35,c});
    if(sk==='trap'||sk==='charm'||sk==='roar')s.fx.push({k:'stun',x:d.x,y:d.y-40,t:0,life:1,c});}
  function onEv(e){const s=scr;
    if(e.k==='reinf'){e.f.ent=1;sfx('gong');const d=upos(e.f),dx=e.side?W-120:120;s.fx.push({k:'num',x:dx,y:150,s:L.reinf,c:e.side?'#ff9a8a':'#9fe8a8',big:1,t:0,life:1.4});
      for(let i=0;i<5;i++)s.fx.push({k:'rise',x:d.x+(e.side?40:-40)+(Math.random()*30-15),y:d.y,t:-i*.05,life:.8,c:'#d8c8a0'});s.shk=Math.max(s.shk||0,.12);return;}
    if(e.k==='cmd'){const c=D.cmds[e.id],col=e.id==='fire'?'#ff7a2a':e.id==='guard'?'#9fd3ff':'#ffd94a';sfx('skill');s.fl={c:col,t:0};s.shk=Math.max(s.shk||0,.2);
      s.fx.push({k:'banner',x:W/2,y:140,s:(e.side?'⚠ ':'')+c.icon+' '+tx(c.n),t:0,life:1.3});
      const tg=e.id==='fire'?(e.side?s.bt.A:s.bt.B):(e.side?s.bt.B:s.bt.A);for(const t of tg)if(t.alive){const q=upos(t);s.fx.push(e.id==='fire'?{k:'flame',x:q.x,y:q.y,t:0,life:.7,c:col,ang:0}:{k:e.id==='guard'?'rise':'aura',x:q.x,y:q.y,t:0,life:1,c:col});if(e.id==='fire')s.fx.push({k:'boom',x:q.x,y:q.y,t:0,life:.5,key:'fx_firewall',c:col});}
      return;}
    if(e.k==='die'){sfx('die');const d=upos(e.f);s.fx.push({k:'num',x:d.x,y:d.y-44,s:(L.ko||'격파!'),c:'#ff8a5a',big:1,t:0,life:1.1});s.shk=Math.max(s.shk||0,.18);return;}
  if(e.k==='hit'){const a=upos(e.a),d=upos(e.d);e.a.lunge=.22;e.d.flash=.15;if(e.a._u)e.a._u.anim={nx:e.a.side?-1:1,ny:0};sfx(e.big?'big':'hit');if(e.big){skFx(s,e.a.skill,d,1);if(!s.zoom||s.zoom.t>.2)s.zoom={t:0,x:d.x,y:d.y-10};s.stop=Math.max(s.stop||0,.06);s.shk=Math.max(s.shk||0,.14);}
      const ranged=D.types[e.a.type].range==='ranged';
      if(ranged)for(let i=0;i<(e.big?7:3);i++)s.fx.push({k:'arrow',x1:a.x+(i%3-1)*12,y1:a.y-6+(i%2)*8,x2:d.x+(Math.random()*30-15),y2:d.y+(Math.random()*16-8),t:-i*.03,life:.3,str:e.a.type==='str'});
      s.fx.push({k:'num',x:d.x+(Math.random()*40-20),y:d.y-34-Math.random()*14,s:'-'+e.v,c:e.big?'#ffd94a':'#fff',big:e.big,t:0,life:.9});
      if(e.big&&s.fx.filter(fx=>fx.k==='boom').length<7)s.fx.push({k:'boom',x:d.x,y:d.y,t:0,life:.45,key:'fx_'+e.a.skill});}
    else if(e.k==='heal'){const d=upos(e.d);s.fx.push({k:'num',x:d.x,y:d.y-34,s:'+'+e.v,c:'#7be08c',t:0,life:.9});s.fx.push({k:'boom',x:d.x,y:d.y,t:0,life:.45,key:'fx_heal',c:'#7be08c'});}
    else if(e.k==='skill'){
      const p=upos(e.f);e.f.aura=.8;e.f.dashT=.55;if(e.f._u)e.f._u.anim={nx:e.f.side?-1:1,ny:0};sfx('skill');{const sk=D.skills[e.sk],side=e.f.side===0?scr.bt.A:scr.bt.B,col=SKC[e.sk]||'#ffd94a';s.fl={c:col,t:0};
        if((sk.kind==='heal'||sk.kind==='buff')&&art('fx_'+e.sk)){const q=upos(e.f);s.fx.push({k:'boom',x:q.x,y:q.y-10,t:0,life:.6,key:'fx_'+e.sk,c:col});}
        if(sk.kind==='heal'||sk.kind==='buff')for(const t of side)if(t.alive){const q=upos(t);s.fx.push({k:sk.kind==='heal'?'rise':'aura',x:q.x,y:q.y,t:0,life:1,c:col});}}
      if(e.f.isGen&&!s.cut)s.cut={u:e.f.u,side:e.f.side,name:tx(D.skills[e.sk]),t:0};
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
  /* v30: generals as full-body SD in front of their squad (shared renderer sd/sdv.js), dash on skills, shake when hit */
  const LWP={inf:'spear',cav:'spear',arc:'bow',str:'talisman'};
  function v30Gen(f,x,y,dir,dt){const SD=root.SDV;if(!SD||!SD.on||!f.isGen)return false;
    if(!f._u)f._u={d:{id:f.id,g:f.u.g,f:f.u.f},wp:LWP[f.type]||'blade',_sd:{a:null,t:9,face:dir,ph:Math.random()*6}};
    let dx=0;if(f.dashT>0){f.dashT=Math.max(0,f.dashT-dt);const q=1-f.dashT/.55;dx=Math.sin(q*Math.PI)*46;}
    const hit=f.flash>0?(Math.random()-.5)*4:0;const gx=x+dir*(26+dx)+hit,gy=y+8;
    if(f.dashT>0){const q=1-f.dashT/.55,a=Math.sin(q*Math.PI);g.save();g.globalAlpha=.55*a;g.strokeStyle='#fff8e0';g.lineWidth=2;
      for(let i=0;i<6;i++){const ly=gy-48+i*8+((i*7)%5),len=18+((i*13)%14)+dx*.6;g.beginPath();g.moveTo(gx-dir*(14+i%3*4),ly);g.lineTo(gx-dir*(14+len),ly);g.stroke();}
      g.globalAlpha=.35*a;g.fillStyle='#c8a878';for(let i=0;i<4;i++){g.beginPath();g.arc(gx-dir*(10+i*9),gy+18-i,5+i*2.5*a,0,7);g.fill();}g.restore();}
    if(!f.alive){const t=f.deadT||0,q=Math.min(1,t/.38),e=q<1?q*q:1,bounce=t>.38&&t<.6?Math.sin((t-.38)/.22*Math.PI)*3:0;
      g.save();g.globalAlpha=.92;g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(gx-dir*20*e,gy+2,30*e+8,6,0,0,7);g.fill();
      g.translate(gx,gy-3*e-bounce);g.rotate(-dir*e*Math.PI/2);g.filter&&(g.filter='saturate(.55) brightness(.8)');f._u._sd.t=9;const ok=SD.unit(g,f._u,0,10*e);g.filter='none';g.restore();
      if(t<.5){g.save();g.globalAlpha=.5*(1-t/.5);g.fillStyle='#c8a878';for(let i=0;i<5;i++){g.beginPath();g.arc(gx-dir*(i*10),gy+2-i%2*3,6+t*20,0,7);g.fill();}g.restore();}
      return ok;}
    return SD.unit(g,f._u,gx,gy);}
  function soldier(t,side,fac,x,y,sc,ph,atk){const key=`sol_${t}_${side?'foe':'ally'}`,im=art(key),fr=art(key+'_frames');const flip=side===1;
    g.save();g.translate(x,y);if(flip)g.scale(-1,1);g.scale(sc,sc);
    if(fr){const fw=fr.width/3,fi=atk?2:(Math.floor(ph*.9)&1);g.drawImage(fr,fi*fw,0,fw,fr.height,-12,-24,24,24);g.restore();return;}if(im){g.drawImage(im,-12,-24,24,24);g.restore();return;}
    const body=side?'#b8362a':(ad.factions[fac]?ad.factions[fac].c:'#2c5aa8'),bob=Math.sin(ph)*1.2;
    if(t==='cav'){g.fillStyle='#6b4a2a';g.fillRect(-9,-9,17,7);g.fillRect(-8,-3,2,4);g.fillRect(5,-3,2,4);g.fillRect(7,-13,4,6);}
    g.fillStyle=body;g.fillRect(-4,(t==='cav'?-19:-15)+bob,8,9);g.fillStyle='#f1c9a0';g.beginPath();g.arc(0,(t==='cav'?-22:-18)+bob,3.2,0,7);g.fill();
    g.fillStyle=side?'#5a1a12':'#1a2a4a';g.fillRect(-3.5,(t==='cav'?-26:-22)+bob,7,2.5);
    if(t!=='cav'){g.fillStyle='#3a2716';g.fillRect(-3,-6,2,6);g.fillRect(1,-6,2,6);}
    g.strokeStyle='#e8e0d0';g.lineWidth=1.3;g.beginPath();
    if(t==='inf'||t==='cav'){g.moveTo(3,(t==='cav'?-12:-8)+bob);g.lineTo(9,(t==='cav'?-30:-26)+bob);}
    else if(t==='arc'){g.strokeStyle='#c9a35a';g.arc(5,-13+bob,6,-1.2,1.2);}else{g.strokeStyle='#f2c14e';g.moveTo(4,-10+bob);g.lineTo(7,-16+bob);}
    g.stroke();g.restore();}
  function drawUnit(f,dt){if(f.ent>0)f.ent=Math.max(0,f.ent-dt*1.1);const p=upos(f),dir=f.side===0?1:-1;let x=p.x,y=p.y;if(f.lunge>0){f.lunge-=dt;x+=dir*8*Math.sin(Math.max(0,f.lunge)/.22*Math.PI);}
    const n=f.alive?Math.max(1,Math.ceil(SQ*f.hp/f.max)):0,ph=last*.008;g.save();
    if(f.aura>0){f.aura-=dt;g.globalAlpha=Math.min(1,f.aura*2);if(!img('aura',x-40,y-44,80,70)){const gr=g.createRadialGradient(x,y-10,6,x,y-10,44);gr.addColorStop(0,'#ffe58a');gr.addColorStop(1,'#ffb00000');g.fillStyle=gr;g.beginPath();g.ellipse(x,y-10,46,34,0,0,7);g.fill();}g.globalAlpha=1;}
    if(f.alive){g.fillStyle='#0003';g.beginPath();g.ellipse(x,y+6,42,12,0,0,7);g.fill();}if(scr.intro<1.5){g.fillStyle='rgba(205,175,125,.4)';for(let q=0;q<3;q++){g.beginPath();g.arc(x-dir*(36+q*16),y+2-q*3,10+q*5,0,7);g.fill();}}
    const mob=!f.isGen&&f.side===1&&!art('sol_'+f.type+'_foe')?ad.mob(f.id):null;
    for(let i=0;i<SQ;i++){if(i>=n)continue;const r=Math.floor(i/4),c=i%4,sx=x+(c-1.5)*14*dir-(r-1.5)*5*dir,sy=y+(r-1.5)*8+(c-1.5)*1.5;
      if(mob){const hh=28,ww=hh*mob.width/mob.height;g.save();g.translate(sx,sy);g.drawImage(mob,-ww/2,-hh+Math.sin(ph+i)*.8,ww,hh);g.restore();}
      else soldier(f.type,f.side,f.fac,sx,sy,1.05+r*.05,ph+i,f.lunge>0);}
    if(!f.alive)f.deadT=(f.deadT||0)+dt;
    if(f.flash>0){f.flash-=dt;g.globalAlpha=.35;g.fillStyle='#fff';g.beginPath();g.ellipse(x,y-10,34,22,0,0,7);g.fill();g.globalAlpha=1;}
    if(f.fx.guard>0&&!img('shield',x-40,y-50,80,70)){g.strokeStyle='#ffd94acc';g.lineWidth=2.5;g.beginPath();g.ellipse(x,y-10,40,30,0,0,7);g.stroke();g.fillStyle='#ffd94a22';g.fill();}
    // banner: general portrait on a flag pole, or the troop name for plain soldiers
    const bx=x-dir*30,byy=y-44;if(!f.alive){const q=Math.min(1,f.deadT/.5);g.save();g.globalAlpha=Math.max(0,1-f.deadT/1.4);g.translate(bx,y-2);g.rotate(-dir*q*1.35);g.translate(-bx,-(y-2));}
    g.strokeStyle='#3a2716';g.lineWidth=2;g.beginPath();g.moveTo(bx,y-2);g.lineTo(bx,byy-6);g.stroke();
    {const fk=f.isGen?'flag_'+f.fac:(f.side?'flag_2':'flag_0'),ch=f.isGen?(ad.factions[f.fac]||{n:'?'}).n[0]:tx(D.types[f.type].s);if(img(fk,bx-3,byy-12,22,33))text(ch,bx+8,byy+3,10,'#fff','center',true);else{rr(bx,byy-6,16,20,2,f.isGen&&ad.factions[f.fac]?ad.factions[f.fac].c:(f.side?'#8a2a20':'#2a4a8a'),'#f2c14e',1);text(ch,bx+8,byy+4,10,'#fff','center',true);}if(!f.alive)g.restore();if(f.isGen&&!v30Gen(f,x,y,dir,dt)&&f.alive)face(f.id,x-13,byy-30,26,f.u.g);}
    if(f.alive){const w=50,hb=y+10;rr(x-w/2,hb,w,5,2,'#000b');rr(x-w/2,hb,Math.max(0,w*f.hp/f.max),5,2,f.side?COL.foe:COL.ally);rr(x-w/2,hb+6,w*f.gauge/100,3,1,COL.gold);
      text(f.isGen?(f.u.sn||f.u.n):tx(D.types[f.type].n),x,hb+17,10,'#fff','center',true,70);
      if(f.fx.stun>0)text('★',x,y-40,13,'#ffd94a','center',true);if(f.fx.burn>0)text('🔥',x+22,y-26,12,'#fff','center');
      if(f.fx.atkUp>0)text('▲',x+26,y-14,11,'#ffb84a','center',true);if(f.fx.atkDown>0||f.fx.slow>0)text('▼',x+26,y-2,11,'#9fd3ff','center',true);}
    g.restore();}
  function drawFx(e){if(e.t<0)return;const a=1-e.t/e.life;g.save();
    if(e.k==='arrow'){const q=e.t/e.life,x=e.x1+(e.x2-e.x1)*q,y=e.y1+(e.y2-e.y1)*q-Math.sin(q*Math.PI)*30,ang=Math.atan2(e.y2-e.y1-Math.cos(q*Math.PI)*30*Math.PI,e.x2-e.x1);
      if(e.str){g.fillStyle='#b98aff';g.beginPath();g.arc(x,y,3,0,7);g.fill();}else if(!img('fx_arrow',x-8,y-3,16,6)){g.strokeStyle='#fff';g.lineWidth=1.5;g.beginPath();g.moveTo(x-Math.cos(ang)*8,y-Math.sin(ang)*8);g.lineTo(x,y);g.stroke();}}
    else if(e.k==='slash'){const q=e.t/e.life,R2=24+q*26;g.translate(e.x,e.y-12);g.rotate(e.ang-.6+q*1.4);g.globalAlpha=Math.min(1,a*1.6);g.shadowColor=e.c;g.shadowBlur=14;
      g.fillStyle=e.c;g.beginPath();g.arc(0,0,R2,-1.25,1.25);g.arc(R2*.28,0,R2*.82,1.1,-1.1,true);g.closePath();g.fill();g.fillStyle='#fff';g.globalAlpha*=.8;g.beginPath();g.arc(0,0,R2,-.9,.9);g.arc(R2*.18,0,R2*.9,.8,-.8,true);g.closePath();g.fill();}
    else if(e.k==='spark'){const q=e.t/e.life;g.globalAlpha=a;g.strokeStyle=e.c;g.lineWidth=2;for(let i=0;i<9;i++){const an=i*.7+e.x;g.beginPath();g.moveTo(e.x+Math.cos(an)*(6+q*14),e.y+Math.sin(an)*(6+q*14));g.lineTo(e.x+Math.cos(an)*(10+q*30),e.y+Math.sin(an)*(10+q*30));g.stroke();}}
    else if(e.k==='swirl'){const q=e.t/e.life;g.globalAlpha=a;g.strokeStyle=e.c;g.lineCap='round';for(let i=0;i<3;i++){g.lineWidth=4-i;g.beginPath();g.arc(e.x,e.y-14,12+i*9+q*10,e.t*9+i*2.1,e.t*9+i*2.1+2.4);g.stroke();}
      g.fillStyle=e.c;for(let i=0;i<5;i++){const an=e.t*7+i*1.26;g.beginPath();g.ellipse(e.x+Math.cos(an)*(22+q*10),e.y-14+Math.sin(an)*12,4,2,an,0,7);g.fill();}}
    else if(e.k==='ring'){const q=e.t/e.life;g.globalAlpha=a;g.strokeStyle=e.c;g.lineWidth=6*a+1;g.beginPath();g.ellipse(e.x,e.y-6,12+q*46,6+q*20,0,0,7);g.stroke();g.lineWidth=2;g.beginPath();g.ellipse(e.x,e.y-6,6+q*30,3+q*13,0,0,7);g.stroke();}
    else if(e.k==='flame'){const q=e.t/e.life;g.globalAlpha=a;for(let i=0;i<7;i++){const fx=e.x+(i-3)*7,fy=e.y-q*40-((i*13)%10),r=(7-q*5)*(1-Math.abs(i-3)/5);g.fillStyle=i%2?'#ffd24a':e.c;g.beginPath();g.arc(fx,fy,Math.max(1,r),0,7);g.fill();}
      g.fillStyle='rgba(255,120,40,.35)';g.beginPath();g.ellipse(e.x,e.y+2,26,7,0,0,7);g.fill();}
    else if(e.k==='rain'){const q=e.t/e.life;g.globalAlpha=a;g.strokeStyle=e.c;g.lineWidth=2;for(let i=0;i<7;i++){const ox=e.x+(i-3)*9,oy=e.y-70+q*70-((i*17)%20);g.beginPath();g.moveTo(ox-4,oy-12);g.lineTo(ox,oy);g.stroke();}}
    else if(e.k==='rune'){g.translate(e.x,e.y-10);g.rotate(e.t*3);g.globalAlpha=a;g.strokeStyle=e.c;g.lineWidth=2;g.beginPath();g.arc(0,0,22,0,7);g.stroke();g.beginPath();for(let i=0;i<6;i++){const an=i*Math.PI/3;g.moveTo(Math.cos(an)*22,Math.sin(an)*22);g.lineTo(Math.cos(an+2.09)*22,Math.sin(an+2.09)*22);}g.stroke();}
    else if(e.k==='stun'){g.globalAlpha=a;g.fillStyle=e.c;for(let i=0;i<3;i++){const an=e.t*6+i*2.1;text('★',e.x+Math.cos(an)*14,e.y+Math.sin(an)*4,11,e.c,'center',true);}}
    else if(e.k==='rise'){const q=e.t/e.life;g.globalAlpha=a;g.fillStyle=e.c;for(let i=0;i<8;i++){const ox=e.x+((i*11)%26)-13,oy=e.y-q*46-((i*7)%18);g.beginPath();g.arc(ox,oy,2.2,0,7);g.fill();}text('+',e.x,e.y-20-q*30,14,e.c,'center',true);}
    else if(e.k==='aura'){const q=e.t/e.life;g.globalAlpha=a;g.strokeStyle=e.c;g.lineWidth=2.5;for(let i=0;i<2;i++){const yy=e.y-q*30-i*14;g.beginPath();g.ellipse(e.x,yy,28-i*6,8-i*2,0,0,7);g.stroke();}text('▲',e.x+24,e.y-26-q*20,11,e.c,'center',true);}
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
  function touch(type,px,py){if(type==='down'){auOn();if(!AU.unl){AU.unl=1;['bgm_legion','bgm_boss','bgm_menu'].forEach(k=>{const el=AF[k];if(!el)return;el.muted=true;try{const pr=el.play();if(pr&&pr.then)pr.then(()=>{el.pause();el.muted=false;}).catch(()=>{el.muted=false;});else{el.pause();el.muted=false;}}catch(e){el.muted=false;}});}down=find(px,py);}else if(type==='up'){const b=find(px,py);if(b&&down&&b.x===down.x&&b.y===down.y&&b.fn){sfx('tap');b.fn();}down=null;}}
  openMap();raf(frame);
  return{touch,close(){alive=false;clearInterval(bgmTimer);},get save(){return S;},debug:{get scr(){return scr;},get ov(){return ov;},openForm,startBattle}};}
root.LEGION={mount,T,ART_KEYS,core:C};
})(typeof window!=='undefined'?window:typeof GameGlobal!=='undefined'?GameGlobal:globalThis);
