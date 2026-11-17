/* ============================== 화면: 홈 · 지도 · 전투 · 카드 · 결과 ============================== */
const TITLE=['심해 신전 수비대','深海神殿守卫'];
const TW_TXT={
  coral: [['산호 궁수','珊瑚弓手'],['빠른 가시 연사 (물리)','快速连射尖刺（物理）'],['관통 가시','穿透尖刺'],t=>[`${TSKILL.coral(t).every}발마다 일직선의 적을 모두 꿰뚫어요`,`每${TSKILL.coral(t).every}发贯穿一整条直线的敌人`]],
  bubble:[['거품 구슬','泡泡宝珠'],['맞은 적을 느리게 (마력)','命中减速（魔力）'],['거품 감옥','泡泡牢笼'],t=>[`${TSKILL.bubble(t).cd.toFixed(1)}초마다 가장 센 적을 ${TSKILL.bubble(t).dur.toFixed(1)}초 가둬요 (받는 피해 +30%)`,`每${TSKILL.bubble(t).cd.toFixed(1)}秒困住最强敌人${TSKILL.bubble(t).dur.toFixed(1)}秒（受伤+30%）`]],
  jelly: [['해파리 등대','水母灯塔'],['번개가 여러 적에게 튀어요 · 투명한 적을 드러내요','闪电连锁多个敌人 · 显形隐身敌人'],['과충전','过载'],t=>[`범위 안 적 전부 감전 ${TSKILL.jelly(t).dmg} + 기절`,`范围内全部敌人电击 ${TSKILL.jelly(t).dmg} 并眩晕`]],
  conch: [['소라 대포','海螺炮'],['멀리 쏘는 범위 폭발','远程范围爆炸'],['소용돌이','漩涡'],t=>[`${TSKILL.conch(t).cd.toFixed(1)}초마다 떨어진 자리에 ${TSKILL.conch(t).dur.toFixed(1)}초 소용돌이`,`每${TSKILL.conch(t).cd.toFixed(1)}秒在落点生成${TSKILL.conch(t).dur.toFixed(1)}秒漩涡`]],
  rune:  [['룬 등불','符文灯'],['주변 수호탑 정화력 증폭 + 광선 · 투명한 적을 드러내요','增幅周围塔攻击 + 光束 · 显形隐身敌人'],['공명','共鸣'],t=>[`주변 수호탑 공격 속도 +40% (${TSKILL.rune(t).dur.toFixed(1)}초)`,`周围守护塔攻速 +40%（${TSKILL.rune(t).dur.toFixed(1)}秒）`]],
};
const EN_TXT={
  minnow:[['그림자 치어','暗影小鱼'],['떼 지어 가속: 4마리 넘게 뭉치면 +25% 빨라져요. 범위 공격으로 흩으세요','成群加速：聚集4只以上移速+25%，用范围攻击打散']],
  crab:[['철갑게','铁甲蟹'],['껍질 닫기: 체력이 절반이 되면 3초간 갑옷 +30%. 마력(해파리·룬·거품)이 잘 들어요','闭壳：生命过半后3秒护甲+30%。魔力（水母/符文/泡泡）有效']],
  eel:[['전기뱀장어','电鳗'],['돌진: 반쯤 다치면 번쩍 돌진해요. 거품으로 늦추세요','冲刺：受伤过半会猛冲，用泡泡减速']],
  ray:[['그림자가오리','暗影鳐鱼'],['그림자 숨기: 주기적으로 투명. 해파리 등대·룬 등불·가드가 탄 탑 근처에서만 보여요','隐身：周期性隐形，只在水母灯塔/符文灯/卫士附近现形']],
  angler:[['등불아귀','灯笼鮟鱇'],['등불 치유: 주변 동료를 치료해요. 먼저 노리세요','灯光治疗：治疗周围同伴，优先击破']],
  squid:[['먹물오징어','墨汁乌贼'],['먹물: 수호탑을 가려 사거리·속도를 낮춰요. 탑을 눌러 닦으세요','喷墨：遮蔽守护塔降低射程和攻速，点击该塔擦掉']],
  horseshoe:[['투구게','鲎'],['분열: 쓰러지면 치어 3마리. 소라 대포로 한꺼번에','分裂：倒下生出3条小鱼，用海螺炮一网打尽']],
  turtle:[['바위거북','岩石龟'],['바위 껍질: 3초 안 맞으면 보호막 재생. 쉬지 말고 공격하거나 정화 룬으로','岩壳：3秒不挨打就恢复护盾。持续攻击或用净化符文']],
  elite:[['심연 대장게','深渊蟹将'],['호령: 주변 적 속도 +18%. 지나가면 생명 -3','号令：周围敌人移速+18%。漏过扣3生命']],
  boss:[['심연 아귀왕','深渊鮟鱇王'],['1구역 보스. 치어 떼 소환 → 모든 탑에 먹물 → 정예 소환','第1区域首领。召唤鱼群→全塔喷墨→召唤精英']],
  boss2:[['강철 거북','钢铁龟'],['2구역 보스. 두꺼운 장갑, 보호막을 두르고 가까운 탑 3개를 마비시켜요','第2区域首领。厚重装甲，生成护盾并瘫痪最近的3座塔']],
  boss3:[['용암 투구게 여왕','熔岩鲎女王'],['3구역 보스. 투구게를 낳고, 모든 적을 6초간 +35% 빠르게 해요','第3区域首领。产下鲎，并让全体敌人6秒内加速35%']],
  boss4:[['미궁의 대왕오징어','迷宫大王乌贼'],['4구역 보스. 모습을 감추고(드러내는 탑 필요), 먹물을 뿌리고 오징어를 불러요','第4区域首领。隐身（需显形塔）、喷墨并召唤乌贼']],
  boss5:[['심연의 핵','深渊之核'],['마지막 보스. 정예 소환·보호막·먹물·전체 회복·거북 소환을 차례로 써요','最终首领。依次使用召唤精英、护盾、喷墨、全体回复、召唤岩龟']]};
const MECH_TIP={
  gate:['수문: 갈림길에서 적이 갈 길이 정해져요. 해류가 2웨이브마다 바뀌고, 🔑 열쇠로 수문을 눌러 직접 바꿀 수 있어요','水闸：决定敌人在岔路走哪边。洋流每2波改变一次，也可用🔑钥匙点击水闸手动切换'],
  cur:['해류 띠: 화살표 구간에서는 적이 빨라져요','洋流带：箭头区段敌人会加速'],
  vent:['거품 기둥: 지나가는 적을 띄워 잠깐 멈추고, 뜬 적은 피해 +30%','泡泡柱：把经过的敌人托起片刻，悬空时受伤+30%'],
  hero:['가드를 누른 뒤 원하는 곳을 누르면 옮겨요. 아래 ⚓ 버튼은 내려찍기','点击卫士再点任意位置即可移动。下方⚓按钮是重击'],
};
let scr='loading',G=null,bgC=null,time=0,last=performance.now(),acc=0;
let ui={};
const AMB=[];for(let i=0;i<5;i++)AMB.push({x:Math.random()*W,y:120+Math.random()*560,v:(Math.random()<.5?-1:1)*(6+Math.random()*8),k:i<2?'shark':'fish',s:.8+Math.random()*.6});
const depthOf=i=>120+i*60+Math.floor(i/10)*400;

function enterBattle(si){
  G=new Game(si,{lv:SV.lv});bgC=renderBg(G.M);FX.length=0;acc=0;
  ui={combo:0,comboT:0,goldB:0,freeze:0,endT:0,clearW:0,sel:null,opt:null,overlay:'intro',speed:SV.opt.fast?2:1,shake:0,hurtT:0,tip:null,resultShown:false,newMech:[]};
  for(const m of['gate','cur','vent'])if((m==='gate'&&G.hasGate)||(m==='cur'&&G.hasCur)||(m==='vent'&&G.hasVent))if(!SV.seen[m])ui.newMech.push(m);
  ui.tut=si===0&&!SV.seen.tut?{i:0,t:0}:null;ui.tutSpot=0;
  
  {const S=G.S;if(si===0||si>0&&!S.fresh&&!S.boss&&!ui.newMech.length&&!ui.newCmd&&!TOWER_IDS.some(k=>UNLOCK[k]===si))ui.overlay=null;}
  SV.sel=si;persist();scr='battle';musicMode='battle';track('stage_start',{stage:si+1});
}
function dmgNum(X,Y,d,big){if(d<1)return;const v=Math.round(d),hv=v>=60||big;fx({k:'num',s:''+v,x:X+(Math.random()-.5)*10,y:Y-10,dx:(Math.random()-.5)*14,col:hv?'#ffe27a':'#fff',size:hv?15:v>=20?12:10,life:hv?.8:.6});}
function coins(X,Y,n){for(let i=0;i<n;i++)fx({k:'coin',x:X+(Math.random()-.5)*12,y:Y+(Math.random()-.5)*8,tx:100,ty:23,arc:(Math.random()-.5)*60,life:.5+Math.random()*.25,on:i?null:()=>{ui.goldB=1;sfx('coin');}});}
/* ---------- UI 부품: 요즘 모바일 게임풍(굵은 글씨·광택 그라데이션 버튼·남색 유리 패널) ---------- */
const NAVY='#0a1626';
const PAL={Y:['#ffe066','#ffb81f','#c26a00','#7a3d00'],B:['#5cc4ff','#2f86ea','#1a4fa8','#0e2c66'],G:['#7df08a','#2fc45a','#168a3a','#0c5222'],T:['#5ff0dc','#1fc0aa','#0f8474','#085046'],O:['#ffb066','#f07a1f','#b04a08','#6a2a00'],X:['#8795a6','#5b6878','#3c4654','#222a34']};
const BTN_MAP={'#3fd0c0':'Y','#3a8a9a':'B','#2a6a7a':'B','#6a8a9a':'B','#d0a030':'G','#555':'X','#345':'X','#444':'X','#a06a10':'O','#2a3a44':'X'};
function btn(x,b,label,col,size,sub){const P=PAL[BTN_MAP[col||'#3fd0c0']||col]||PAL.Y,r=Math.min(16,b.h/2.4);
  rr(x,b.x,b.y+5,b.w,b.h,r);x.fillStyle='rgba(0,0,0,.35)';x.fill();
  rr(x,b.x,b.y,b.w,b.h+2,r);x.fillStyle=P[2];x.fill();
  rr(x,b.x,b.y,b.w,b.h-3,r);const gr=x.createLinearGradient(0,b.y,0,b.y+b.h);gr.addColorStop(0,P[0]);gr.addColorStop(1,P[1]);x.fillStyle=gr;x.fill();
  x.save();rr(x,b.x+3,b.y+3,b.w-6,(b.h-3)*.42,r-3);x.fillStyle='rgba(255,255,255,.28)';x.fill();x.restore();
  rr(x,b.x,b.y,b.w,b.h+2,r);x.strokeStyle=NAVY;x.lineWidth=2.5;x.stroke();
  txt(x,label,b.x+b.w/2,b.y+b.h/2-(sub?7:1),size||15,'#fff','center',P[3],900);if(sub)txt(x,sub,b.x+b.w/2,b.y+b.h/2+12,10,'#fff','center',P[3],800);}
function panel(x,X,Y,w,h){rr(x,X,Y+6,w,h,22);x.fillStyle='rgba(0,0,0,.4)';x.fill();rr(x,X,Y,w,h,22);const gr=x.createLinearGradient(0,Y,0,Y+h);gr.addColorStop(0,'#214a78');gr.addColorStop(1,'#122a4a');x.fillStyle=gr;x.fill();x.strokeStyle=NAVY;x.lineWidth=3;x.stroke();
  rr(x,X+3,Y+3,w-6,h-6,19);x.strokeStyle='rgba(150,210,255,.28)';x.lineWidth=1.5;x.stroke();}
function pill(x,X,Y,w,h,col){rr(x,X,Y,w,h,h/2);x.fillStyle=col||'rgba(8,22,40,.8)';x.fill();x.strokeStyle='rgba(160,215,255,.22)';x.lineWidth=1.5;x.stroke();}
function roundBtn(x,X,Y,r,P,on){x.fillStyle='rgba(0,0,0,.35)';x.beginPath();x.arc(X,Y+3,r,0,7);x.fill();const gr=x.createLinearGradient(0,Y-r,0,Y+r);gr.addColorStop(0,P[0]);gr.addColorStop(1,P[2]);x.fillStyle=gr;x.beginPath();x.arc(X,Y,r,0,7);x.fill();
  x.strokeStyle=NAVY;x.lineWidth=2.5;x.stroke();x.strokeStyle=on?'rgba(255,255,255,.9)':'rgba(255,255,255,.3)';x.lineWidth=1.5;x.beginPath();x.arc(X,Y,r-3,Math.PI*1.15,Math.PI*1.85);x.stroke();}
/* 벡터 아이콘 */
function icon(x,n,X,Y,s,col){x.save();x.translate(X,Y);x.scale(s,s);x.strokeStyle=col||'#fff';x.fillStyle=col||'#fff';x.lineWidth=2.6;x.lineCap=x.lineJoin='round';
  if(n==='up'){for(const d of[-5,4]){x.beginPath();x.moveTo(-8,d+5);x.lineTo(0,d-4);x.lineTo(8,d+5);x.stroke();}}
  else if(n==='book'){rr(x,-10,-9,20,18,3);x.stroke();x.beginPath();x.moveTo(0,-9);x.lineTo(0,9);x.moveTo(-6,-3);x.lineTo(-3,-3);x.moveTo(3,-3);x.lineTo(6,-3);x.stroke();}
  else if(n==='gift'){rr(x,-9,-3,18,12,2);x.stroke();rr(x,-11,-8,22,6,2);x.stroke();x.beginPath();x.moveTo(0,-8);x.lineTo(0,9);x.stroke();x.beginPath();x.arc(-4,-11,3.5,0,7);x.arc(4,-11,3.5,0,7);x.stroke();}
  else if(n==='gear'){for(let i=0;i<8;i++){x.rotate(Math.PI/4);x.fillRect(-2.2,-11,4.4,5);}x.beginPath();x.arc(0,0,7,0,7);x.fill();x.globalCompositeOperation='destination-out';x.beginPath();x.arc(0,0,3,0,7);x.fill();}
  else if(n==='back'){x.lineWidth=3.2;x.beginPath();x.moveTo(4,-8);x.lineTo(-4,0);x.lineTo(4,8);x.stroke();}
  else if(n==='heart'){x.beginPath();x.moveTo(0,8);x.bezierCurveTo(-13,-2,-7,-11,0,-4);x.bezierCurveTo(7,-11,13,-2,0,8);x.fill();}
  else if(n==='gem'){x.beginPath();x.moveTo(0,-9);x.lineTo(7,-1);x.lineTo(0,9);x.lineTo(-7,-1);x.closePath();x.fill();x.fillStyle='rgba(255,255,255,.6)';x.beginPath();x.moveTo(0,-9);x.lineTo(3,-1);x.lineTo(0,2);x.lineTo(-3,-1);x.closePath();x.fill();}
  else if(n==='slam'){x.beginPath();x.arc(0,-8,2.6,0,7);x.stroke();x.beginPath();x.moveTo(0,-5);x.lineTo(0,9);x.moveTo(-5,-1);x.lineTo(5,-1);x.stroke();x.beginPath();x.arc(0,1,8,Math.PI*.1,Math.PI*.9);x.stroke();}
  else if(n==='torpedo'){x.beginPath();for(let i=0;i<16;i++){const a=i*Math.PI/8,r=i%2?4.5:10;x.lineTo(Math.cos(a)*r,Math.sin(a)*r);}x.closePath();x.fill();}
  else if(n==='tide'){for(const d of[-5,2,9]){x.beginPath();x.moveTo(-10,d);x.quadraticCurveTo(-5,d-6,0,d);x.quadraticCurveTo(5,d+6,10,d);x.stroke();}}
  else if(n==='pause'){x.fillRect(-5,-6,3.6,12);x.fillRect(1.4,-6,3.6,12);}
  else if(n==='lock'){rr(x,-6,-1,12,9,2);x.fill();x.beginPath();x.arc(0,-2,4,Math.PI,0);x.stroke();}
  x.restore();}
function coinChip(x,X,Y){pill(x,X-46,Y-14,92,28);x.fillStyle='#ffc53d';x.beginPath();x.arc(X-32,Y,10,0,7);x.fill();x.strokeStyle=NAVY;x.lineWidth=2;x.stroke();x.fillStyle='#fff3b0';x.beginPath();x.arc(X-32,Y,5.5,0,7);x.fill();txt(x,''+SV.coins,X+8,Y+1,14,'#fff','center',NAVY,900);}
function chip(x,X,Y,ic,col){x.fillStyle=col;x.beginPath();x.arc(X,Y,10,0,7);x.fill();x.strokeStyle='rgba(255,255,255,.35)';x.lineWidth=1.5;x.stroke();txt(x,ic,X,Y+1,11,'#fff');}
function backBtn(x){roundBtn(x,30,36,17,PAL.B);icon(x,'back',29,36,1);}
/* 대원 얼굴: 그림(art/crew_<id>)이 오면 그걸, 없으면 색 원 + 이름 첫 글자 */
function crewFace(x,c,X,Y,r,dim){x.save();x.globalAlpha*=dim?.4:1;const C=CREW[c];
  x.beginPath();x.arc(X,Y,r,0,7);x.closePath();const gr=x.createLinearGradient(0,Y-r,0,Y+r);gr.addColorStop(0,C.col);gr.addColorStop(1,shade(C.col,.45));x.fillStyle=gr;x.fill();
  const im=IMG['crew_'+c];x.save();x.beginPath();x.arc(X,Y,r-1,0,7);x.clip();
  if(c==='hero')drawHero(x,{x:X,y:Y+r*.45,face:1,lv:1,atk:0,moving:false,icon:1},0,false);
  else if(im){const s=r*2.2/Math.max(im.width,im.height);x.drawImage(im,X-im.width*s/2,Y-im.height*s/2+r*.1,im.width*s,im.height*s);}
  else{txt(x,LL(C.n).slice(0,1),X,Y+r*.06,r*1.05,'#fff','center',NAVY,900);}
  x.restore();x.strokeStyle=NAVY;x.lineWidth=Math.max(2,r*.12);x.beginPath();x.arc(X,Y,r,0,7);x.stroke();x.restore();}
function shade(c,f){const n=parseInt(c.slice(1),16);return `rgb(${Math.round((n>>16)*f)},${Math.round(((n>>8)&255)*f)},${Math.round((n&255)*f)})`;}
function drawCrewBadge(x,t){if(!t.crew)return;const rs=G.reso(t),bx=t.x+15,by=t.y-36+Math.sin(time*2+t.id)*1.5;if(rs)glow(x,bx,by,18,'rgba(255,210,63,.55)',.6+.3*Math.sin(time*4));crewFace(x,t.crew,bx,by,10);
  if(rs){x.strokeStyle='#ffd23f';x.lineWidth=2;x.beginPath();x.arc(bx,by,12,0,7);x.stroke();}}
function showTip(s,dur){ui.tip={s,t:dur||4};}
/* ---------- 이벤트 → 효과·소리 ---------- */
function drain(){
  for(const e of G.ev){switch(e.t){
    case'kill':{const key=ENEMIES[e.k].art||e.k,im=IMG['en_'+key];if(im)fx({k:'die',im,w:ENEMIES[e.k].ew||EW[e.k],x:e.x,y:e.y,face:e.f||1,life:isBoss(e.k)?1.2:.45});}{const big=isBoss(e.k)||e.k==='elite';dmgNum(e.x,e.y,e.vd,false);burst(e.x,e.y,big?'#ff8ad8':'#d9b6ff',big?40:12,big?150:90,big?4:2.8,big?.8:.45);fx({k:'disc',x:e.x,y:e.y,r:big?70:22,col:'#fff',life:big?.4:.18});fx({k:'ring',x:e.x,y:e.y,r0:4,r:big?80:26,col:'rgba(230,190,255,.9)',w:big?5:2.5,life:big?.5:.25});
      coins(e.x,e.y,big?8:e.g>=9?3:e.g>=5?2:1);ui.combo++;ui.comboT=1.6;sfxKill(ui.combo);
      if(ui.combo%10===0)fx({k:'num',s:L(`${ui.combo} 연속 정화!`,`${ui.combo} 连续净化！`),x:W/2,y:210,dx:0,col:'#ffd76a',size:22,life:1.1});
      if(big){ui.shake=isBoss(e.k)?.7:.3;ui.freeze=isBoss(e.k)?.18:.07;vib(isBoss(e.k)?120:40);if(isBoss(e.k))fx({k:'flash',col:'rgba(255,255,255,.5)',life:.35});}}break;
    case'leak':ui.hurtT=.5;ui.shake=.25;fx({k:'txt',s:'-'+e.n,x:TEMPLE.x,y:TEMPLE.y-60,col:'#ff6b8a',size:16,life:.9});sfx('leak');vib(30);break;
    case'build':burst(e.x,e.y,TCOL[e.k],14,70,2.5,.5);fx({k:'ring',x:e.x,y:e.y,r0:6,r:34,col:hexA(TCOL[e.k],.8),life:.4});sfx('build');break;
    case'awaken':burst(e.x,e.y-14,TCOL[e.k],30,120,3,.8);fx({k:'ring',x:e.x,y:e.y,r0:8,r:60,col:'rgba(255,226,122,.9)',w:5,life:.6});fx({k:'txt',s:L('각성!','觉醒！'),x:e.x,y:e.y-50,col:'#ffd76a',size:15,life:1.2});sfx('card');break;
    case'torp':fx({k:'ring',x:e.x,y:e.y,r0:6,r:e.r,col:'rgba(255,190,120,.95)',w:7,life:.45});burst(e.x,e.y,'#ffcf8a',30,160,3.5,.6);ui.shake=.4;sfx('boom');sfx('slam');vib(40);break;
    case'tide':fx({k:'flash',col:'rgba(120,220,255,.3)',life:.5});for(let i=0;i<5;i++)fx({k:'line',x:0,y:640-i*110,x2:W,y2:600-i*110,col:'rgba(180,240,255,.8)',w:8,life:.5+i*.08});ui.shake=.3;sfx('wave');sfx('vent');break;
    case'clamp':fx({k:'ring',x:e.x,y:e.y,r0:20,r:10,col:'rgba(200,210,230,.9)',life:.3});break;
    case'crew':{track('crew_skill',{c:e.k});const C=CREW[e.k],c=C.col,tw=C.tw;fx({k:'banner',s:`${LL(C.n)} · ${LL(C.sk)}!`,y:250,col:c,size:20,life:1.2});fx({k:'flash',col:hexA(c,.28),life:.4});sfx('card');vib(30);
      if(e.x)fx({k:'ring',x:e.x,y:e.y,r0:8,r:60,col:hexA(c,.95),w:5,life:.5});
      if(tw==='coral')for(const t of G.towers)if(t.k==='coral'||t.crew===e.k)fx({k:'ring',x:t.x,y:t.y,r0:6,r:40,col:hexA(c,.9),w:4,life:.5});
      if(tw==='bubble')for(let i=0;i<50;i++)fx({k:'bub',x:Math.random()*W,y:80+Math.random()*640,v:40+Math.random()*60,s:2+Math.random()*4,ph:Math.random()*6,life:1+Math.random()});
      if(tw==='jelly'){for(const o of G.enemies){fx({k:'zap',pts:[[o.x+(Math.random()-.5)*30,o.y-120],[o.x,o.y]],life:.25});fx({k:'disc',x:o.x,y:o.y,r:16,col:'#fff6b0',life:.2});}ui.shake=.3;sfx('storm');}
      if(tw==='rune')for(const t of G.towers)fx({k:'ring',x:t.x,y:t.y,r0:6,r:34,col:hexA(c,.9),w:3,life:.6});}break;
    case'revive':fx({k:'flash',col:'rgba(150,255,240,.4)',life:.6});fx({k:'banner',s:L('신전 결계 복구!','神殿结界修复！'),s2:L('생명 +10','生命 +10'),y:300,col:'#5ff0dc',size:22,life:1.6});ui.shake=.4;sfx('up');break;
    case'merge':{track('merge',{c:e.c,reso:e.reso?1:0});const C=CREW[e.c];fx({k:'ring',x:e.x,y:e.y,r0:30,r:6,col:hexA(e.reso?'#ffd23f':C.col,.95),w:4,life:.35});burst(e.x,e.y-20,e.reso?'#ffe27a':C.col,e.reso?22:12,90,2.6,.5);
      fx({k:'num',s:e.reso?L(`${LL(C.n)} 공명!`,`${LL(C.n)} 共鸣！`):L(`${LL(C.n)} 합체`,`${LL(C.n)} 合体`),x:e.x,y:e.y-44,dx:0,col:e.reso?'#ffd23f':'#fff',size:e.reso?15:12,life:1.1});sfx(e.reso?'up':'build');}break;
    case'unmerge':fx({k:'ring',x:e.x,y:e.y,r0:6,r:24,col:'rgba(255,255,255,.7)',life:.3});sfx('sell');break;
    case'crit':fx({k:'num',s:L('크리!','暴击！'),x:e.x,y:e.y-26,dx:0,col:'#ff9a5c',size:11,life:.6});break;
    case'pure':{fx({k:'ring',x:e.x,y:e.y,r0:6,r:30,col:'rgba(150,255,240,.95)',w:3,life:.4});burst(e.x,e.y,'#bffff4',8,70,2.2,.5);
      if(e.act!=='gift')fx({k:'num',s:{block:L('길막이!','拦路！'),shock:L('감전!','电击！'),sweep:L('역류 돌진!','逆流冲刺！')}[e.act],x:e.x,y:e.y-22,dx:0,col:'#9ffff0',size:12,life:.9});}break;
    case'up':burst(e.x,e.y-12,'#ffe27a',18,80,2.5,.6);fx({k:'ring',x:e.x,y:e.y,r0:8,r:40,col:'rgba(255,226,122,.8)',life:.5});sfx('up');break;
    case'sell':burst(e.x,e.y,'#7ff',10,50,2,.4);sfx('sell');break;
    case'clean':burst(e.x,e.y-14,'#bdf',10,50,2,.4);sfx('clean');break;
    case'gate':fx({k:'ring',x:e.x,y:e.y,r0:6,r:36,col:'rgba(255,215,106,.9)',life:.5});sfx('gate');break;
    case'slam':fx({k:'ring',x:e.x,y:e.y,r0:10,r:e.r,col:'rgba(140,240,255,.9)',w:6,life:.45});burst(e.x,e.y,'#bff',24,140,3,.5);ui.shake=.35;sfx('slam');vib(40);break;
    case'wave':sfx('wave');ui.pathT=2.5;fx({k:'banner',s:L(`웨이브 ${e.w} / ${G.S.waves}`,`第 ${e.w} / ${G.S.waves} 波`),s2:e.boss?L('⚠ 보스 등장!','⚠ 首领来袭！'):e.w===G.S.waves?L('마지막 웨이브','最后一波'):'',y:170,col:e.boss?'#ff8ad8':'#7ff',life:1.7});if(e.boss){ui.shake=.4;fx({k:'flash',col:'rgba(160,40,200,.3)',life:.5});}
      if(e.cur)fx({k:'txt',s:L('🌊 해류가 바뀌었어요','🌊 洋流改变了'),x:W/2,y:178,col:'#9ef',size:12,life:1.6});musicMode=e.boss?'boss':'battle';break;
    case'cards':sfx('mut');break;
    case'mut':break;
    case'vent':for(let i=0;i<8;i++)fx({k:'bub',x:e.x+(Math.random()-.5)*18,y:e.y,v:40+Math.random()*50,s:1.5+Math.random()*2.5,ph:Math.random()*6,life:.9});sfx('vent');break;
    case'trap':fx({k:'ring',x:e.x,y:e.y,r0:24,r:12,col:'rgba(160,240,255,.9)',life:.3});sfx('trap');break;
    case'storm':fx({k:'ring',x:e.x,y:e.y,r0:10,r:e.r,col:'rgba(255,240,140,.85)',w:4,life:.4});sfx('storm');break;
    case'reso':fx({k:'ring',x:e.x,y:e.y,r0:10,r:e.r,col:'rgba(210,150,255,.7)',w:3,life:.6});break;
    case'zap':fx({k:'zap',pts:e.pts,life:.2});for(const q of e.pts.slice(1))fx({k:'disc',x:q[0],y:q[1],r:10,col:'#fff6b0',life:.14});sfx('zap');break;
    case'pierce':fx({k:'line',x:e.x,y:e.y-18,x2:e.x2,y2:e.y2,col:'rgba(255,200,150,.95)',w:5,life:.25});sfx('spine');break;
    case'boom':if(e.small){fx({k:'ring',x:e.x,y:e.y,r0:3,r:e.r,col:'rgba(255,210,170,.8)',w:2.5,life:.25});break;}fx({k:'ring',x:e.x,y:e.y,r0:4,r:e.r,col:'rgba(255,210,170,.85)',w:4,life:.35});burst(e.x,e.y,'#ffd2aa',18,130,3,.45);fx({k:'disc',x:e.x,y:e.y,r:e.r,col:'#fff2dc',life:.22});ui.shake=Math.max(ui.shake,.14);sfx('boom');break;
    case'whirl':break;
    case'pop':burst(e.x,e.y,'#bff',6,60,2,.3);fx({k:'ring',x:e.x,y:e.y,r0:3,r:14,col:'rgba(190,250,255,.9)',w:2,life:.2});sfx('bub');break;
    case'hit':{const c=e.k==='spine'?'#ffb27a':e.k==='bolt'?'#aef6ff':'#fff';burst(e.x,e.y,c,3,70,1.8,.22);fx({k:'disc',x:e.x,y:e.y,r:9,col:c,life:.12});sfx('hit');}break;
    case'heal':fx({k:'ring',x:e.x,y:e.y,r0:8,r:e.r,col:'rgba(140,255,140,.6)',life:.5});break;
    case'ink':fx({k:'ink',x:e.x,y:e.y,tx:e.tx,ty:e.ty,life:.5});break;
    case'shell':fx({k:'ring',x:e.x,y:e.y,r0:6,r:22,col:'rgba(120,200,255,.8)',life:.4});break;
    case'dash':burst(e.x,e.y,'#fff27a',8,60,2,.3);break;
    case'hlv':fx({k:'txt',s:'LEVEL UP!',x:e.x,y:e.y-34,col:'#ffd76a',size:12,life:1});sfx('up');break;
    case'roar':ui.shake=.6;sfx('roar');fx({k:'flash',col:'rgba(160,40,200,.25)',life:.4});
      if(e.m)showTip({shield:L('보스가 보호막을 둘렀어요! 정화 룬이 잘 들어요','首领生成了护盾！净化符文很有效'),haste:L('모든 적이 빨라졌어요! 거품과 해일로 늦추세요','全体敌人加速了！用泡泡和海啸减速'),cloak:L('보스가 모습을 감췄어요! 해파리 등대·룬 등불·가드가 탄 탑 근처에서만 보여요','首领隐身了！只在水母灯塔/符文灯/卫士附近现形'),heal:L('심연이 모든 적을 치유했어요!','深渊治愈了全体敌人！')}[e.m],3.5);break;
    case'dark':ui.shake=.4;sfx('roar');fx({k:'flash',col:'rgba(0,0,0,.5)',life:.8});showTip(L('보스가 빛을 꺼뜨렸어요! 수호탑을 눌러 먹물을 닦으세요','首领熄灭了光芒！点击守护塔擦掉墨汁'),3);break;
    case'win':sfx('win');break;case'lose':sfx('lose');break;
  }}
  G.ev.length=0;
}
/* ---------- 전투 갱신 ---------- */
function updateBattle(dt){
  if(ui.artVer!==artVer){ui.artVer=artVer;bgC=renderBg(G.M);}
  if(ui.tip){ui.tip.t-=dt;if(ui.tip.t<=0)ui.tip=null;}
  if(ui.shake>0)ui.shake-=dt;if(ui.pathT>0)ui.pathT-=dt;if(ui.hurtT>0)ui.hurtT-=dt;
  if(ui.goldB>0)ui.goldB-=dt*4;if(ui.comboT>0){ui.comboT-=dt;if(ui.comboT<=0)ui.combo=0;}
  if(G.state==='run'&&!ui.overlay&&!tutOn())for(const k of crewKeys())if(!SV.seen['cs_'+k]&&G.crewReady(k)&&G.enemies.length>=3){SV.seen['cs_'+k]=1;persist();showTip(L(`${LL(CREW[k].n)}의 필살기 '${LL(CREW[k].sk)}' 준비! 아래 ${LL(CREW[k].n)} 얼굴을 누르세요`,`${LL(CREW[k].n)}的必杀技「${LL(CREW[k].sk)}」就绪！点击下方头像`),4.5);}
  if(ui.freeze>0){ui.freeze-=dt;}else
  if(!ui.overlay&&G.state==='run'){acc+=dt*ui.speed;let n=0;while(acc>=DT&&n<8){G.tick();acc-=DT;n++;if(G.state!=='run')break;}if(n>=8)acc=0;AL=Math.max(0,Math.min(1,acc/DT));}else AL=1;
  FDT=dt;
  drain();
  for(const e of G.enemies){if(!(e.vd>0))continue;e.vT=(e.vT||0)-dt;if(e.vT<=0){dmgNum(e.x,e.y-(e.vh||e.r),e.vd);e.vd=0;e.vT=.3;}}
  if(G.state==='run'&&G.wave>0&&!G.spawning&&!G.enemies.length&&ui.clearW!==G.wave&&G.wave<G.S.waves){ui.clearW=G.wave;fx({k:'banner',s:L(`웨이브 ${G.wave} 격퇴!`,`第 ${G.wave} 波击退！`),s2:L('다음 웨이브를 일찍 부르면 진주 보너스','提前召唤下一波可获珍珠奖励'),y:300,col:'#ffd76a',size:20,life:1.5});sfx('clear');}
  if((G.state==='win'||G.state==='lose')&&!ui.resultShown){if(!ui.endT){ui.endT=G.state==='win'?1.6:.9;ui.sel=null;if(G.state==='win'){fx({k:'banner',s:L('신전을 지켰어요!','守住神殿了！'),y:300,col:'#7fffd0',size:24,life:1.6});for(let i=0;i<6;i++)setTimeout(()=>{burst(60+Math.random()*330,200+Math.random()*300,['#ffe27a','#7ff','#ff9ad8','#bfffe8'][i%4],26,150,3,.9);sfx('coin');},i*220);}}
    ui.endT-=dt;if(ui.endT>0)return;}
  if(G.state==='card'&&!ui.overlay){ui.overlay='cards';ui.sel=null;}
  if((G.state==='win'||G.state==='lose')&&!ui.resultShown){ui.resultShown=true;ui.overlay='result';ui.sel=null;musicMode='calm';
    track(G.state==='win'?'stage_clear':'stage_fail',{stage:G.si+1,wave:G.wave,stars:G.stars(),lives:G.lives});
    const win=G.state==='win',st=G.stars(),first=win&&!SV.stars[G.si],c=stageCoins(G.si,st),fb=first?firstBonus(G.si):0;ui.reward={c,fb};SV.coins+=c+fb;
    mission('kill',G.kills);mission('awaken',G.awakened);mission('cmd',G.cmdUsed);mission('card',G.cardsPicked);if(win){mission('win',1);mission('star',st);SV.stars[G.si]=Math.max(SV.stars[G.si],st);}persist();}
  updateTut(dt);
}
/* ---------- 버튼 배치 ---------- */
const BAR={key:{x:416,y:716,r:15},wave:{x:262,y:752,w:114,h:40},speed:{x:416,y:772,r:20},pause:{x:424,y:23,r:16}};
const crewKeys=()=>CREW_IDS.filter(c=>G.joined(c));
const crewBtn=i=>({x:27+i*41,y:772,r:19});
/* 아래(또는 위)에서 올라오는 카드: 수호탑 정보·강화, 건설 고르기 */
function sheetY(y){return y>420?62:536;}
function towerSheet(t){const Y=sheetY(t.y),X=10,w=430,o={X,Y,w,h:196,sell:{x:X+104,y:Y+100,w:92,h:36}};
  if(t.lv>=MAX_TLV)o.max={x:X+206,y:Y+98,w:212,h:40};else if(t.lv===MAX_TLV-1)o.br=[{x:X+206,y:Y+98,w:103,h:40},{x:X+315,y:Y+98,w:103,h:40}];else o.up={x:X+206,y:Y+98,w:212,h:40};
  o.crew=crewKeys().map((c,i)=>({c,x:X+122+i*44,y:Y+170,r:17}));return o;}
function buildSheet(i){const s=G.M.spots[i],Y=s.y>420?62:572,X=10,w=430,ks=TOWER_IDS.filter(k=>UNLOCK[k]<OPEN_N||G.unlocked(k)),cw=Math.min(100,(w-20-(ks.length-1)*8)/ks.length);
  return {X,Y,w,h:152,cards:ks.map((k,j)=>({k,x:X+10+j*(cw+8),y:Y+10,w:cw,h:84})),build:{x:X+w-132,y:Y+104,w:120,h:38}};}
const hitC=(p,b,pad)=>Math.hypot(p.x-b.x,p.y-b.y)<b.r+(pad||4);
const hitR=(p,b)=>p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h;
/* ---------- 전투 터치 ---------- */
function tapBattle(p){
  if(ui.overlay)return tapOverlay(p);
  if(tapTut(p))return;
  if(hitC(p,BAR.pause,8)){ui.overlay='pause';sfx('tap');return;}
  if(p.y>740){
    const ks=crewKeys();for(let i=0;i<ks.length;i++)if(hitC(p,crewBtn(i),1)){const c=ks[i],T=G.crewTower(c);
      if(!T){if(!G.towers.length){showTip(L('먼저 수호탑을 지어요. 대원은 수호탑에 합체해서 싸워요','先建造守护塔。队员需要合体到塔上作战'),2.5);return;}
        ui.place=ui.place===c?null:c;ui.sel=null;sfx('tap');if(ui.place)showTip(L(`${LL(CREW[c].n)}을(를) 태울 수호탑을 누르세요 (★ 표시는 공명)`,`点击要让${LL(CREW[c].n)}合体的守护塔（★为共鸣）`),3);return;}
      if(G.crewSkill(c)){ui.sel=null;ui.place=null;}else{ui.sel={type:'tower',t:T};ui.opt=null;sfx('tap');}return;}
    if(hitR(p,BAR.wave)){if(G.callWave())ui.sel=null;return;}
    if(hitC(p,BAR.speed)){ui.speed=ui.speed===1?2:1;SV.opt.fast=ui.speed===2?1:0;persist();sfx('tap');return;}
    return;
  }
  if(p.y<=740&&ui.place){const c=ui.place;ui.place=null;for(const t of G.towers)if(Math.hypot(p.x-t.x,p.y-t.y+10)<28){G.merge(c,t);return;}sfx('tap');return;}
  const sel=ui.sel;
  if(sel&&sel.type==='spot'){const S=buildSheet(sel.i);if(p.x>=S.X&&p.x<=S.X+S.w&&p.y>=S.Y&&p.y<=S.Y+S.h){
      for(const c of S.cards)if(hitR(p,c)){if(!G.unlocked(c.k)){showTip(L(`${UNLOCK[c.k]}판을 깨면 합류해요`,`通关第${UNLOCK[c.k]}关后加入`),2);return;}ui.opt=c.k;sfx('tap');return;}
      if(ui.opt&&hitR(p,S.build)){if(G.build(sel.i,ui.opt)){ui.sel=null;ui.opt=null;}else{showTip(L('진주가 부족해요','珍珠不足'),1.5);sfx('tap');}}
      return;}}
  if(sel&&sel.type==='tower'){const S=towerSheet(sel.t),t=sel.t;if(p.x>=S.X&&p.x<=S.X+S.w&&p.y>=S.Y&&p.y<=S.Y+S.h){
      if(hitR(p,S.sell)){G.sell(t);ui.sel=null;}
      else if(S.up&&hitR(p,S.up)){if(!G.upgrade(t)){showTip(L('진주가 부족해요','珍珠不足'),1.5);sfx('tap');}}
      else if(S.br&&S.br.some(b=>hitR(p,b)))S.br.forEach((b,bi)=>{if(!hitR(p,b))return;if(ui.opt!=='br'+bi){ui.opt='br'+bi;sfx('tap');}else if(G.upgrade(t,bi)){ui.opt=null;}else{showTip(L('진주가 부족해요','珍珠不足'),1.5);sfx('tap');}});
      else if(t.crew&&hitR(p,{x:S.X+S.w-102,y:S.Y+154,w:88,h:34})){G.unmerge(t);sfx('tap');}
      else if(!t.crew)for(const b of S.crew)if(Math.hypot(p.x-(b.x+16),p.y-b.y)<b.r+4){G.merge(b.c,t);break;}
      return;}}
  ui.opt=null;
  for(const t of G.towers)if(Math.hypot(p.x-t.x,p.y-t.y+10)<24){if(G.clean(t))return;ui.sel={type:'tower',t};sfx('tap');return;}
  for(const k in G.M.gates){const gt=G.M.gates[k];if(Math.hypot(p.x-gt.x,p.y-gt.y)<24){if(!G.flipGate(k))showTip(L('🔑 수문 열쇠가 없어요 (2웨이브마다 1개)','🔑 没有水闸钥匙（每2波获得1把）'),2);ui.sel=null;return;}}
  for(let i=0;i<G.M.spots.length;i++){const s=G.M.spots[i];if(Math.hypot(p.x-s.x,p.y-s.y)<26&&!G.towers.some(t=>t.spot===i)){ui.sel={type:'spot',i};ui.opt=ui.tut&&ui.tut.i===4&&G.gold>=G.cost('bubble')?'bubble':TOWER_IDS.find(k=>G.unlocked(k)&&G.gold>=G.cost(k))||'coral';sfx('tap');return;}}
  ui.sel=null;
}
function overlayBtns(){
  const o=ui.overlay;
  if(o==='intro')return [{id:'go',x:W/2-100,y:604,w:200,h:50}];
  if(o==='cards')return G.cards.map((c,i)=>({id:'card'+i,x:40,y:330+i*112,w:370,h:96}));
  if(o==='pause')return [{id:'resume',x:W/2-110,y:244,w:220,h:48},{id:'guide',x:W/2-110,y:302,w:220,h:46},{id:'retry',x:W/2-110,y:358,w:220,h:46},{id:'map',x:W/2-110,y:414,w:220,h:46},
    {id:'sfx',x:W/2-110,y:478,w:106,h:40},{id:'bgm',x:W/2+4,y:478,w:106,h:40}];
  if(o==='result'){const b=[{id:'retry',x:W/2-150,y:520,w:140,h:48},{id:'map',x:W/2+10,y:520,w:140,h:48}];if(G.state==='lose'&&!G.revived)b.push({id:'revive',x:W/2-140,y:446,w:280,h:50});if(G.state==='win'&&ui.reward&&!ui.reward.dbl)b.push({id:'dbl',x:W/2-150,y:456,w:196,h:44});if(G.state==='win')b.push({id:'share',x:W/2+54,y:456,w:96,h:44});if(G.state==='win'&&G.si<OPEN_N-1)b.push({id:'next',x:W/2-110,y:580,w:220,h:52});return b;}
  return [];
}
function tapOverlay(p){
  for(const b of overlayBtns())if(hitR(p,b)){sfx('tap');const id=b.id;
    if(id==='go'){ui.overlay=null;for(const m of ui.newMech)SV.seen[m]=1;persist();}
    else if(id.startsWith('card')){G.pickCard(+id.slice(4));ui.overlay=null;sfx('card');}
    else if(id==='resume')ui.overlay=null;
    else if(id==='guide')openGuide('battle');
    else if(id==='retry')enterBattle(G.si);
    else if(id==='next'){if(G.si+1<OPEN_N)tryEnter(G.si+1);}
    else if(id==='revive')showAd('revive',()=>{if(G.revive()){ui.overlay=null;ui.resultShown=false;ui.endT=0;musicMode='battle';SV.coins-=ui.reward?ui.reward.c:0;persist();}});
    else if(id==='dbl')showAd('double',()=>{const c=ui.reward.c;SV.coins+=c;ui.reward.dbl=1;persist();fx({k:'banner',s:L(`코인 +${c}`,`金币 +${c}`),y:300,col:'#ffd23f',size:20,life:1.2});sfx('card');});
    else if(id==='share'){const r=shareGame();if(r==='copy')fx({k:'banner',s:L('주소를 복사했어요','链接已复制'),y:300,col:'#5ff0dc',size:18,life:1.2});}
    else if(id==='map'){mapArea=Math.floor(G.si/PER_AREA);scr='map';musicMode='calm';}
    else if(id==='sfx'){SV.opt.sfx^=1;persist();}else if(id==='bgm'){SV.opt.bgm^=1;persist();}
    else if(id==='lang'){LANG=LANG==='ko'?'zh':'ko';SV.lang=LANG;persist();}
    return;}
}
/* ---------- 전투 그리기 ---------- */
function activeSegs(){const M=G.M,on=new Set(),st=[...M.start];while(st.length){const id=st.pop();if(on.has(id))continue;on.add(id);const n=M.next[id];if(!n)continue;st.push(typeof n==='string'?n:n.to[M.gates[n.g].st]);}return on;}
function drawAmbient(x,dt,alpha){
  for(const a of AMB){a.x+=a.v*dt;if(a.x<-80)a.x=W+80;if(a.x>W+80)a.x=-80;x.save();x.translate(a.x,a.y+Math.sin(time*.6+a.s*9)*6);x.scale(a.v<0?-a.s:a.s,a.s);x.globalAlpha=alpha;x.fillStyle='#061820';
    if(a.k==='shark'){x.beginPath();x.moveTo(36,0);x.quadraticCurveTo(10,-12,-26,-3);x.lineTo(-40,-12);x.lineTo(-36,0);x.lineTo(-40,12);x.lineTo(-26,3);x.quadraticCurveTo(10,12,36,0);x.fill();x.beginPath();x.moveTo(0,-8);x.lineTo(-8,-20);x.lineTo(-12,-6);x.fill();}
    else{for(let i=0;i<5;i++){x.beginPath();x.ellipse(i*9-18,(i%2)*7,5,2.5,0,0,7);x.fill();}}
    x.restore();}x.globalAlpha=1;
}
function drawRays(x,a){x.save();x.globalCompositeOperation='lighter';for(let i=0;i<4;i++){const cx=60+i*110+Math.sin(time*.3+i)*30;const gr=x.createLinearGradient(0,0,0,H*.8);gr.addColorStop(0,`rgba(150,240,255,${.07*a})`);gr.addColorStop(1,'rgba(150,240,255,0)');
  x.fillStyle=gr;x.beginPath();x.moveTo(cx-14,0);x.lineTo(cx+20,0);x.lineTo(cx+90+Math.sin(time*.4+i)*20,H*.8);x.lineTo(cx-10,H*.8);x.closePath();x.fill();}x.restore();}
function drawBattle(dt){
  const x=g,M=G.M;x.setTransform(K,0,0,K,0,0);
  if(ui.shake>0&&SV.opt.shake!==0)x.translate((Math.random()-.5)*8*ui.shake,(Math.random()-.5)*8*ui.shake);
  x.drawImage(bgC,0,0,W,H);
  drawAmbient(x,dt,.35);
  if(IMG.islet){const w=56,h=w*IMG.islet.height/IMG.islet.width;M.spots.forEach((s,i)=>x.drawImage(IMG.islet,s.x-w/2,s.y-h*.36+islBob(i,time),w,h));}
  /* 물길: 그려진 길 대신 흐르는 플랑크톤 빛 알갱이. 준비 중·웨이브 시작·자리 고를 때만 잠깐 또렷하게 */
  const on=activeSegs(),hl=Math.max(G.state==='prep'?1:0,Math.min(1,ui.pathT||0),ui.sel&&ui.sel.type!=='hero'?.6:0);x.lineCap=x.lineJoin='round';
  for(const id in M.segs){const s=M.segs[id],act=on.has(id);
    if(hl>0&&act){segPath(x,s);x.strokeStyle=`rgba(200,170,255,${.35*hl})`;x.lineWidth=2;x.setLineDash([3,12]);x.lineDashOffset=-time*30;x.stroke();x.setLineDash([]);}
    const n=Math.floor(s.len/20);for(let i=0;i<n;i++){const d=(i*20+time*(act?26:8)+(i%3)*7)%s.len,P=segPos(s,d),o=Math.sin(i*1.7+time*1.3)*12;
      const a2=act?.4+.25*Math.sin(time*3+i):.08;x.globalAlpha=a2;x.fillStyle=i%4?'#bff6ff':'#e6c8ff';x.beginPath();x.arc(P.x-Math.sin(P.a)*o,P.y+Math.cos(P.a)*o,i%4?1.7:2.4,0,7);x.fill();}
    x.globalAlpha=1;}
  /* 해류 띠 */
  for(const c of M.cur){const s=M.segs[c.seg],len=c.d1-c.d0,fast=!(G.B.rev&&c.mul>1);for(let k=0;k<len;k+=20){const d=c.d0+((k+time*(fast?70:25))%len),P=segPos(s,d);
    x.save();x.translate(P.x,P.y);x.rotate(P.a);x.strokeStyle=fast?'rgba(150,240,255,.45)':'rgba(140,170,255,.35)';x.lineWidth=2;x.beginPath();x.moveTo(-5,-7);x.lineTo(3,0);x.lineTo(-5,7);x.stroke();x.restore();}}
  /* 거품 기둥 */
  for(const v of M.vents){x.fillStyle='#08242c';x.beginPath();x.ellipse(v.x,v.y,13,7,0,0,7);x.fill();x.strokeStyle=v.cd<=0?'rgba(160,250,255,.9)':'rgba(100,160,180,.5)';x.lineWidth=2;x.stroke();
    if(v.cd<=0)glow(x,v.x,v.y,22,'rgba(140,240,255,.5)',.6+.3*Math.sin(time*5));if(Math.random()<.15)fx({k:'bub',x:v.x+(Math.random()-.5)*10,y:v.y,v:25+Math.random()*20,s:1+Math.random()*2,ph:Math.random()*6,life:1.2});}
  /* 빈 자리 룬 */
  const cheap=Math.min(...TOWER_IDS.filter(k=>G.unlocked(k)).map(k=>G.cost(k)));
  M.spots.forEach((s,i)=>{if(G.towers.some(t=>t.spot===i))return;const can=G.gold>=cheap,p=.5+.5*Math.sin(time*3+i);
    x.beginPath();for(let j=0;j<6;j++){const a=j*Math.PI/3;x.lineTo(s.x+Math.cos(a)*13,s.y+Math.sin(a)*8);}x.closePath();x.fillStyle='rgba(10,40,50,.85)';x.fill();
    x.strokeStyle=can?`rgba(120,255,230,${.55+.4*p})`:'rgba(120,180,180,.35)';x.lineWidth=1.8;x.stroke();if(can)glow(x,s.x,s.y,18,'rgba(100,255,220,.35)',p);
    x.fillStyle=can?'#9ff':'#577';x.beginPath();x.moveTo(s.x,s.y-4);x.lineTo(s.x+3,s.y);x.lineTo(s.x,s.y+4);x.lineTo(s.x-3,s.y);x.closePath();x.fill();
    if(ui.sel&&ui.sel.type==='spot'&&ui.sel.i===i){x.strokeStyle='#fff';x.lineWidth=2;x.beginPath();x.ellipse(s.x,s.y,22,14,0,0,7);x.stroke();}});
  /* 수문 */
  for(const k in M.gates){const gt=M.gates[k],to=M.segs[gt.to[gt.st]],P=segPos(to,26),a=Math.atan2(P.y-gt.y,P.x-gt.x),fl=gt.flash>0?gt.flash:0;
    if(G.keys>0&&G.state!=='win')glow(x,gt.x,gt.y,28,'rgba(255,215,106,.5)',.4+.3*Math.sin(time*5));
    x.fillStyle='#1c2a30';x.beginPath();x.arc(gt.x,gt.y,15+fl*4,0,7);x.fill();x.strokeStyle='#e8c45a';x.lineWidth=2.5;x.stroke();
    x.save();x.translate(gt.x,gt.y);x.rotate(a);x.fillStyle='#ffe9a8';x.beginPath();x.moveTo(10,0);x.lineTo(-4,-7);x.lineTo(-1,0);x.lineTo(-4,7);x.closePath();x.fill();x.restore();
    if(G.keys>0)txt(x,'🔑',gt.x+14,gt.y-14,10,'#fff');}
  /* 사거리 */
  const sel=ui.sel;
  if(sel&&sel.type==='tower'){x.strokeStyle='#fff';x.lineWidth=2;x.setLineDash([5,5]);x.lineDashOffset=-time*20;x.beginPath();x.ellipse(sel.t.x,sel.t.y+6,26,13,0,0,7);x.stroke();x.setLineDash([]);}
  /* 소용돌이 */
  for(const z of G.zones){x.save();x.translate(z.x,z.y);x.globalAlpha=Math.min(1,z.t*2);for(let i=0;i<3;i++){x.rotate(time*4);x.strokeStyle=`rgba(150,220,255,${.5-i*.12})`;x.lineWidth=3;x.beginPath();x.arc(0,0,z.r*(1-i*.28),0,4.2);x.stroke();}x.restore();}
  drawTemple(x,time,ui.hurtT);
  /* 탑·적·영웅을 아래쪽이 앞에 오게 */
  const ents=[...G.towers.map(t=>({y:t.y,f:()=>{drawTower(x,t,time,sel&&sel.t===t);drawCrewBadge(x,t);}})),...G.enemies.map(e=>({y:e.y,f:()=>drawEnemy(x,e,time)})),...G.allies.map(a=>({y:a.y,f:()=>{a.fade=Math.min(1,a.t*2.5);drawEnemy(x,a,time);if(a.act==='block'){x.strokeStyle='rgba(150,255,240,.9)';x.lineWidth=3;x.beginPath();x.arc(a.x,a.y,a.r+12,-Math.PI/2,-Math.PI/2+Math.PI*2*a.t/a.T);x.stroke();}}}))];
  ents.sort((a,b)=>a.y-b.y);for(const e of ents)e.f();
  /* 룬 광선 */
  for(const t of G.towers)if(t.k==='rune'&&t.beam>0){x.strokeStyle='rgba(220,170,255,.85)';x.lineWidth=2.5;x.beginPath();x.moveTo(t.x,t.y-40);x.lineTo(t.beamX,t.beamY);x.stroke();x.strokeStyle='rgba(199,125,255,.3)';x.lineWidth=6;x.stroke();}
  /* 투사체 */
  for(const p of G.projs){x.save();x.translate(p.x,p.y);
    if(p.kind==='spine'){x.rotate(p.a||0);const gr=x.createLinearGradient(-22,0,8,0);gr.addColorStop(0,'rgba(255,140,60,0)');gr.addColorStop(1,'rgba(255,190,120,.85)');x.fillStyle=gr;x.fillRect(-22,-2,26,4);x.fillStyle='#fff3e0';x.beginPath();x.moveTo(11,0);x.lineTo(-4,-3.2);x.lineTo(-4,3.2);x.closePath();x.fill();}
    else if(p.kind==='bub'){x.strokeStyle='rgba(200,250,255,.95)';x.fillStyle='rgba(110,231,255,.35)';x.lineWidth=1.5;glow(x,0,0,12,'rgba(110,231,255,.5)');x.beginPath();x.arc(0,0,6.5,0,7);x.fill();x.stroke();x.fillStyle='#fff';x.beginPath();x.arc(-2,-2,1.6,0,7);x.fill();}
    else if(p.kind==='shell'){if(Math.random()<.6)fx({k:'p',x:p.x,y:p.y,vx:0,vy:8,col:'rgba(255,220,190,.7)',s:2.2,life:.3});glow(x,0,0,14,'rgba(255,200,160,.5)');x.scale(1.5,1.5);x.rotate(time*12);x.fillStyle=p.whirl?'#9ef':'#ffc9a8';x.beginPath();x.ellipse(0,0,6,4,0,0,7);x.fill();x.strokeStyle='#a0583a';x.lineWidth=1;x.stroke();if(p.whirl)glow(x,0,0,12,'rgba(150,230,255,.6)');}
    else if(p.kind==='bolt'){x.rotate(p.a||0);glow(x,0,0,9,'rgba(120,240,255,.7)');x.strokeStyle='#eaffff';x.lineWidth=2.5;x.lineCap='round';x.beginPath();x.arc(-8,0,10,-.9,.9);x.stroke();}
    x.restore();}
  if(ui.aim){x.fillStyle='rgba(255,180,90,.08)';x.fillRect(0,46,W,694);txt(x,L('💥 떨어뜨릴 곳을 누르세요','💥 点击落点'),W/2,130,14,'#ffcf8a','center','rgba(0,0,0,.8)');}
  /* 합체 고르기 */
  if(ui.place){const C=CREW[ui.place];for(const t of G.towers){const sig=C.tw===t.k,pu=.5+.5*Math.sin(time*6);x.strokeStyle=sig?'#ffd23f':'rgba(255,255,255,.85)';x.lineWidth=sig?3.5:2.5;x.setLineDash([6,5]);x.lineDashOffset=-time*25;x.beginPath();x.ellipse(t.x,t.y+6,28+pu*3,14+pu*1.5,0,0,7);x.stroke();x.setLineDash([]);
      if(sig)txt(x,L('★ 공명','★ 共鸣'),t.x,t.y-46,11,'#ffd23f','center',NAVY,900);}}
  drawFx(x,dt);
  if(ui.hurtT>0){const gr=x.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.7);gr.addColorStop(0,'rgba(255,0,60,0)');gr.addColorStop(1,`rgba(255,0,60,${ui.hurtT*.5})`);x.fillStyle=gr;x.fillRect(0,0,W,H);}
  drawRays(x,1);
  x.setTransform(K,0,0,K,0,0);
  drawHud(x);
  if(sel&&sel.type==='spot')drawBuildMenu(x,sel.i);
  if(sel&&sel.type==='tower')drawTowerMenu(x,sel.t);
  drawHints(x);
  if(ui.tip){const ty=tutOn()&&!ui.tut.wait?150:92;x.globalAlpha=Math.min(1,ui.tip.t*2);rr(x,24,ty,W-48,46,12);x.fillStyle='rgba(16,40,72,.94)';x.fill();x.strokeStyle=NAVY;x.lineWidth=2.5;x.stroke();wrap(x,ui.tip.s,W/2,ty+16,W-70,12,'#e8fbff',16);x.globalAlpha=1;}
  if(ui.overlay)drawOverlay(x);
}

function drawHud(x){
  let gr=x.createLinearGradient(0,0,0,74);gr.addColorStop(0,'rgba(4,14,30,.8)');gr.addColorStop(1,'rgba(4,14,30,0)');x.fillStyle=gr;x.fillRect(0,0,W,74);
  pill(x,10,9,72,28);icon(x,'heart',26,24,1,'#ff5f86');txt(x,''+G.lives,54,24,15,G.lives<=5?'#ff8aa0':'#fff','center',NAVY,900);
  pill(x,90,9,92,28);icon(x,'gem',106,23,1,'#5ff0ff');txt(x,''+G.gold,142,24,15+Math.max(0,ui.goldB)*4,ui.goldB>0?'#fff7c0':'#fff','center',NAVY,900);
  pill(x,192,9,196,28);txt(x,L(`웨이브 ${G.wave}/${G.S.waves}`,`第 ${G.wave}/${G.S.waves} 波`),206,23,12,'#fff','left',NAVY,900);
  {const bx=282,bw=94,n=G.S.waves,gap=2,sw=(bw-gap*(n-1))/n;for(let i=0;i<n;i++){rr(x,bx+i*(sw+gap),19,sw,8,2.5);x.fillStyle=i<G.wave-1?'#5ff0dc':i===G.wave-1?(G.spawning||G.enemies.length?'#ffd23f':'#5ff0dc'):'rgba(255,255,255,.16)';x.fill();}}
  roundBtn(x,BAR.pause.x,BAR.pause.y,15,PAL.B);icon(x,'pause',BAR.pause.x,BAR.pause.y,1);
  if(ui.combo>=3){const cp=Math.min(1,ui.comboT/.4);x.globalAlpha=cp;txt(x,'×'+ui.combo,W-12,86,20+Math.min(10,ui.combo*.3),ui.combo>=20?'#ff9ad8':ui.combo>=10?'#ffd23f':'#9ff','right',NAVY,900);txt(x,L('연속 정화','连续净化'),W-12,108,10,'#fff','right',NAVY,900);x.globalAlpha=1;}
  let cx=20;for(const m of G.mutList){chip(x,cx,56,MUTS[m].ic,'rgba(120,50,170,.9)');cx+=23;}
  if(G.mutList.length)cx+=6;for(const b of G.blessList){chip(x,cx,56,BLESS[b].ic,'rgba(190,130,20,.9)');cx+=23;}
  /* 아래: 떠 있는 버튼들 */
  gr=x.createLinearGradient(0,712,0,H);gr.addColorStop(0,'rgba(4,14,30,0)');gr.addColorStop(.5,'rgba(4,14,30,.78)');gr.addColorStop(1,'rgba(4,14,30,.92)');x.fillStyle=gr;x.fillRect(0,712,W,88);
  crewKeys().forEach((c,i)=>{const B=crewBtn(i),C=CREW[c],T=G.crewTower(c),cd=G.crewCd[c]||0,cdF=cd>0?cd/C.cd:0,rdy=!!T&&cdF<=0,pl=ui.place===c;
    if((rdy&&G.state==='run')||pl)glow(x,B.x,B.y,B.r+10,hexA(pl?'#ffd23f':C.col,.6),.55+.35*Math.sin(time*4+i));
    crewFace(x,c,B.x,B.y,B.r,!T&&!pl);
    if(T&&cdF>0){x.fillStyle='rgba(4,12,26,.55)';x.beginPath();x.moveTo(B.x,B.y);x.arc(B.x,B.y,B.r-1,-Math.PI/2,-Math.PI/2+cdF*Math.PI*2);x.closePath();x.fill();txt(x,''+Math.ceil(cd),B.x,B.y+1,15,'#fff','center',NAVY,900);}
    if(rdy||pl){x.strokeStyle=pl?'#ffd23f':C.col;x.lineWidth=3;x.beginPath();x.arc(B.x,B.y,B.r+1.5,0,7);x.stroke();}
    if(!T){pill(x,B.x-17,B.y+11,34,14,pl?'#c98a1a':'rgba(4,14,30,.9)');txt(x,L('합체','合体'),B.x,B.y+18,8.5,'#fff','center',null,900);}
    else if(G.reso(T)){txt(x,'★',B.x+B.r-3,B.y-B.r+4,11,'#ffd23f','center',NAVY,900);}
    txt(x,LL(C.n),B.x,B.y-B.r-7,9,'#fff','center',NAVY,900);});
  if(G.hasGate){const KB=BAR.key;roundBtn(x,KB.x,KB.y,KB.r,G.keys>0?PAL.Y:PAL.X);txt(x,'🔑',KB.x,KB.y-3,10,'#fff');txt(x,`${G.keys}/${G.keyMax}`,KB.x,KB.y+8,8,'#fff','center',NAVY,900);}
  const WB=BAR.wave;let lab,sub='',act=false;
  if(G.state==='prep'){lab=L('전투 시작','开始战斗');act=true;}
  else if(G.wave>=G.S.waves)lab=L('마지막 웨이브','最后一波');
  else if(G.spawning)lab=L('전투 중','战斗中');
  else{lab=L('다음 웨이브','下一波');sub=L(`일찍 부르면 +${Math.ceil(G.nextT)*EARLY_BONUS}`,`提前召唤 +${Math.ceil(G.nextT)*EARLY_BONUS}`);act=true;}
  const pu=act?Math.sin(time*5)*1.5:0;btn(x,{x:WB.x-pu,y:WB.y-pu,w:WB.w+pu*2,h:WB.h+pu*2},lab,act?'Y':'X',14,sub);
  const SB=BAR.speed;roundBtn(x,SB.x,SB.y,SB.r,ui.speed===2?PAL.O:PAL.B);txt(x,ui.speed===2?'2×':'1×',SB.x,SB.y+1,13,'#fff','center',NAVY,900);
}
function infoPanel(x,lines,anchorY){const h=20+lines.length*17,y=anchorY>520?70:H-76-h;rr(x,14,y,W-28,h,16);const gr=x.createLinearGradient(0,y,0,y+h);gr.addColorStop(0,'rgba(33,74,120,.96)');gr.addColorStop(1,'rgba(18,42,74,.96)');x.fillStyle=gr;x.fill();x.strokeStyle=NAVY;x.lineWidth=2.5;x.stroke();
  lines.forEach((l,i)=>txt(x,l[0],28,y+19+i*17,l[2]||11,l[1]||'#e8fbff','left',null,i===0?900:700));}
function sheetBg(x,S){rr(x,S.X,S.Y+5,S.w,S.h,20);x.fillStyle='rgba(0,0,0,.4)';x.fill();rr(x,S.X,S.Y,S.w,S.h,20);const gr=x.createLinearGradient(0,S.Y,0,S.Y+S.h);gr.addColorStop(0,'rgba(33,74,120,.97)');gr.addColorStop(1,'rgba(16,38,68,.97)');x.fillStyle=gr;x.fill();x.strokeStyle=NAVY;x.lineWidth=3;x.stroke();
  rr(x,S.X+3,S.Y+3,S.w-6,S.h-6,17);x.strokeStyle='rgba(150,210,255,.25)';x.lineWidth=1.5;x.stroke();}
function drawBuildMenu(x,i){
  const S=buildSheet(i);sheetBg(x,S);
  for(const c of S.cards){const lock=!G.unlocked(c.k),cost=G.cost(c.k),can=!lock&&G.gold>=cost,on=ui.opt===c.k;
    rr(x,c.x,c.y,c.w,c.h,12);x.fillStyle=on?'rgba(255,210,63,.22)':'rgba(8,22,40,.55)';x.fill();x.strokeStyle=on?'#ffd23f':'rgba(160,215,255,.25)';x.lineWidth=on?3:1.5;x.stroke();
    if(lock){icon(x,'lock',c.x+c.w/2,c.y+34,1.5,'#9fb0c4');txt(x,L(`${UNLOCK[c.k]}판`,`第${UNLOCK[c.k]}关`),c.x+c.w/2,c.y+66,10,'#9fb0c4','center',NAVY,900);continue;}
    x.globalAlpha=can?1:.5;towerIcon(x,c.k,c.x+c.w/2,c.y+38,1.15);x.globalAlpha=1;
    pill(x,c.x+c.w/2-26,c.y+c.h-24,52,19,'rgba(4,14,30,.85)');icon(x,'gem',c.x+c.w/2-15,c.y+c.h-15,.62,'#5ff0ff');txt(x,''+cost,c.x+c.w/2+7,c.y+c.h-14,11,can?'#fff':'#ff8aa0','center',null,900);}
  if(ui.opt){const T=TW_TXT[ui.opt];txt(x,LL(T[0]),S.X+16,S.Y+112,14,TCOL[ui.opt],'left',NAVY,900);const tw=x.measureText(LL(T[0])).width;const fc=CREW_IDS.find(c=>CREW[c].tw===ui.opt);if(fc&&G.joined(fc))txt(x,L(`★ ${LL(CREW[fc].n)}와(과) 공명`,`★ 与${LL(CREW[fc].n)}共鸣`),S.X+24+tw,S.Y+113,10,'#ffd23f','left',null,800);
    txt(x,LL(T[1]).slice(0,LANG==='zh'?22:26),S.X+16,S.Y+132,10,'#d8f2ff','left',null,700);btn(x,S.build,L('건설','建造'),G.gold>=G.cost(ui.opt)?'G':'X',15);}
}
function drawTowerMenu(x,t){
  const S=towerSheet(t),T=TW_TXT[t.k],tier=G.tier(),dm=G.dmg(t),cur=t.br?BRANCH[t.k].find(b=>b.id===t.br):null,c=G.upCost(t),can=G.gold>=c;sheetBg(x,S);
  rr(x,S.X+12,S.Y+12,82,124,14);x.fillStyle='rgba(8,22,40,.55)';x.fill();towerIcon(x,t.k,S.X+53,S.Y+60,1.5);
  for(let i=0;i<MAX_TLV;i++){x.fillStyle=i<t.lv?(t.lv>=MAX_TLV?'#ffd23f':'#5ff0dc'):'rgba(255,255,255,.18)';x.beginPath();x.arc(S.X+29+i*16,S.Y+122,5,0,7);x.fill();x.strokeStyle=NAVY;x.lineWidth=1.5;x.stroke();}
  txt(x,LL(T[0])+(cur?` · ${LL(cur.n)}`:''),S.X+106,S.Y+24,15,TCOL[t.k],'left',NAVY,900);
  txt(x,L(`정화력 ${dm.toFixed(1)} · 간격 ${G.rate(t).toFixed(2)}초`,`净化力 ${dm.toFixed(1)} · 间隔 ${G.rate(t).toFixed(2)}秒`)+(t.aura>0?L(`  · 증폭 +${Math.round(t.aura*100)}%`,`  · 增幅 +${Math.round(t.aura*100)}%`):''),S.X+106,S.Y+45,11,'#fff','left',null,700);
  const brI=ui.opt&&ui.opt.startsWith('br')?+ui.opt.slice(2):-1;
  wrap(x,brI>=0&&S.br?`${LL(BRANCH[t.k][brI].n)}: ${LL(BRANCH[t.k][brI].d)}`:cur?LL(cur.d):`✦ ${LL(T[2])} Lv${tier}: ${LL(T[3](tier))}`,S.X+106,S.Y+64,S.w-124,10,brI>=0?'#ffe27a':'#d8f2ff',13,'left');
  btn(x,S.sell,L(`판매 +${G.sellVal(t)}`,`出售 +${G.sellVal(t)}`),'X',11);
  if(S.up)btn(x,S.up,L(`강화   ◆ ${c}`,`升级   ◆ ${c}`),can?'G':'X',15);
  else if(S.max)btn(x,S.max,L('최고 단계','已满级'),'X',13);
  else S.br.forEach((b,j)=>{const on=brI===j;btn(x,b,on?L('각성!','觉醒！'):LL(BRANCH[t.k][j].n),on?(can?'Y':'X'):'B',on?14:11,on?'◆ '+c:(j?'B':'A')+L(' 각성 ◆',' 觉醒 ◆')+c);});
  /* 대원 합체 줄 */
  x.fillStyle='rgba(255,255,255,.12)';x.fillRect(S.X+12,S.Y+146,S.w-24,1.5);
  if(t.crew){const C=CREW[t.crew],rs=G.reso(t);crewFace(x,t.crew,S.X+40,S.Y+172,19);if(rs){x.strokeStyle='#ffd23f';x.lineWidth=3;x.beginPath();x.arc(S.X+40,S.Y+172,22,0,7);x.stroke();}
    txt(x,LL(C.n)+(rs?L('  공명!','  共鸣！'):''),S.X+66,S.Y+160,12,rs?'#ffd23f':C.col,'left',NAVY,900);txt(x,LL(C.td(G.trF(t))).slice(0,LANG==='zh'?16:22),S.X+66,S.Y+180,9.5,'#d8f2ff','left',null,700);}
  else{txt(x,L('대원 없음','无队员'),S.X+40,S.Y+164,10,'#9fb0c4','center',null,800);txt(x,L('혼자 싸움','独自作战'),S.X+40,S.Y+180,9,'#9fb0c4','center',null,700);}
  const xs=S.crew;if(xs.length){const x0=xs[0].x-30;if(!t.crew)txt(x,L('합체 ▸','合体 ▸'),x0+4,S.Y+172,11,'#ffe27a','left',NAVY,900);}
  for(const b of xs){if(t.crew)continue;const C=CREW[b.c],busy=G.crewTower(b.c),sig=C.tw===t.k;crewFace(x,b.c,b.x+16,b.y,b.r,!!busy&&!sig&&false);
    if(sig){x.strokeStyle='#ffd23f';x.lineWidth=2.5;x.beginPath();x.arc(b.x+16,b.y,b.r+3,0,7);x.stroke();txt(x,L('공명','共鸣'),b.x+16,b.y-b.r-6,8,'#ffd23f','center',NAVY,900);}
    if(busy){pill(x,b.x+3,b.y+10,26,12,'rgba(4,14,30,.85)');txt(x,L('이동','移动'),b.x+16,b.y+16,7.5,'#bfe6ff','center',null,900);}}
  if(t.crew){const ub={x:S.X+S.w-102,y:S.Y+154,w:88,h:34};btn(x,ub,L('내리기','卸下'),'B',12);S.unb=ub;}
}
function arrowHint(x,X,Y,s){const b=Math.sin(time*6)*5;x.fillStyle='#ffe27a';x.beginPath();x.moveTo(X,Y-6+b);x.lineTo(X-9,Y-20+b);x.lineTo(X+9,Y-20+b);x.closePath();x.fill();txt(x,s,X,Y-32+b,12,'#fff','center','rgba(0,0,0,.85)');}
function drawHints(x){drawTut(x);}
/* ---------- 1판 튜토리얼: 할 일을 하나씩 짚어 준다(화면을 막지 않고 어둡게만) ---------- */
const TUT=[
  {t:['빛나는 바위섬을 눌러 수호탑을 지어요','点击发光的岩岛建造守护塔'],
   tg:()=>{const s=G.M.spots[ui.tutSpot];return {x:s.x,y:s.y,r:32};},done:()=>(ui.sel&&ui.sel.type==='spot')||G.towers.length>0},
  {t:['저격수 코라의 "산호 궁수"예요. 건설을 눌러요','这是狙击手珂拉的「珊瑚弓手」。点击建造'],
   tg:()=>{if(!(ui.sel&&ui.sel.type==='spot'))return null;const b=buildSheet(ui.sel.i).build;return {x:b.x+b.w/2,y:b.y+b.h/2,r:46};},done:()=>G.towers.length>0,back:()=>!(ui.sel&&ui.sel.type==='spot')},
  {t:['준비 끝! "전투 시작"을 눌러요','准备完毕！点击「开始战斗」'],tg:()=>({x:BAR.wave.x+BAR.wave.w/2,y:BAR.wave.y+20,r:74}),done:()=>G.state==='run'},
  {t:['수호탑이 물든 생물을 씻어 내요. 다 씻긴 생물은 맑은 색으로 돌아와 잠깐 우리를 도와요!','守护塔会洗去被污染的生物。净化后它们恢复清澈，暂时帮助我们！'],tg:null,done:()=>G.purified>=4,minT:3.5},
  {t:['진주가 모였어요. 다른 바위섬에 하나 더 지어요. 거품 구슬은 적을 느리게 해요','珍珠够了。在另一座岩岛上再建一座。泡泡宝珠能让敌人变慢'],when:()=>G.gold>=G.cost('bubble'),
   tg:()=>{if(ui.sel&&ui.sel.type==='spot'){const b=buildSheet(ui.sel.i).build;return {x:b.x+b.w/2,y:b.y+b.h/2,r:46};}const i=G.M.spots.findIndex((s,j)=>!G.towers.some(t=>t.spot===j));if(i<0)return null;const s=G.M.spots[i];return {x:s.x,y:s.y,r:32};},done:()=>G.towers.length>=2},
  {t:['대원 코라를 수호탑에 태워요. 아래 코라를 누른 뒤 산호 궁수를 누르세요 (전용 탑이면 "공명"!)','让队员珂拉登上守护塔。点击下方珂拉，再点击珊瑚弓手（专属塔会「共鸣」！）'],when:()=>G.enemies.length>=2||G.wave>=2,
   tg:()=>{if(ui.place==='cora'){const t=G.towers.find(t=>t.k==='coral')||G.towers[0];return t?{x:t.x,y:t.y-6,r:32}:null;}const B=crewBtn(crewKeys().indexOf('cora'));return {x:B.x,y:B.y,r:28};},done:()=>!!G.crewTower('cora')},
  {t:['합체한 대원은 필살기를 써요! 코라 버튼을 눌러요','合体的队员可以使用必杀技！点击珂拉按钮'],when:()=>G.crewReady('cora')&&G.enemies.length>=2,
   tg:()=>{const B=crewBtn(crewKeys().indexOf('cora'));return {x:B.x,y:B.y,r:28};},done:()=>(G.crewCd.cora||0)>0},
  {t:['대장 가드도 탑에 태워요. 아래 가드를 누른 뒤 다른 수호탑을 누르세요. 주변 탑까지 강해져요','让队长卫士也登上塔。点击下方卫士，再点击另一座守护塔，周围的塔也会变强'],when:()=>G.towers.filter(t=>!t.crew).length>0,
   tg:()=>{if(ui.place==='hero'){const t=G.towers.find(t=>!t.crew);return t?{x:t.x,y:t.y-6,r:32}:null;}const B=crewBtn(0);return {x:B.x,y:B.y,r:28};},done:()=>!!G.crewTower('hero')},
  {t:['수호탑을 눌러 강화하면 훨씬 세져요','点击守护塔进行升级，会强很多'],when:()=>G.towers.length&&G.gold>=G.upCost(G.towers[0]),
   tg:()=>{if(ui.sel&&ui.sel.type==='tower'){const S=towerSheet(ui.sel.t);if(S.up)return {x:S.up.x+S.up.w/2,y:S.up.y+S.up.h/2,r:60};return null;}const t=G.towers[0];return {x:t.x,y:t.y-8,r:32};},done:()=>G.towers.some(t=>t.lv>=2)},
];
const TUT_SKIP={x:W-92,y:0,w:80,h:30};
function tutOn(){return ui.tut&&ui.tut.i<TUT.length&&!ui.overlay;}
function updateTut(dt){if(!ui.tut)return;const u=ui.tut;if(u.i>=TUT.length)return;const s=TUT[u.i];u.t+=dt;
  if(s.back&&s.back()&&!s.done()){u.i--;u.t=0;return;}
  if(s.when&&!s.when()&&!s.done()){u.wait=true;return;}u.wait=false;
  if(s.done()&&u.t>=(s.minT||0)){u.i++;u.t=0;sfx('coin');track('tut_step',{step:u.i});
    if(u.i>=TUT.length){SV.seen.tut=1;persist();fx({k:'banner',s:L('기본 익히기 끝!','新手教学完成！'),s2:L('남은 웨이브를 막아 보세요','守住剩下的波次吧'),y:400,col:'#ffd23f',size:22,life:1.8});}}}
function drawTut(x){if(!tutOn()||ui.tut.wait)return;const s=TUT[ui.tut.i],T=s.tg?s.tg():null,p=.5+.5*Math.sin(time*5);
  if(T){x.save();x.fillStyle='rgba(2,8,20,.5)';x.beginPath();x.rect(0,0,W,H);x.arc(T.x,T.y,T.r+p*3,0,7,true);x.fill('evenodd');x.restore();
    x.strokeStyle=`rgba(255,226,90,${.7+.3*p})`;x.lineWidth=3.5;x.beginPath();x.arc(T.x,T.y,T.r+p*3,0,7);x.stroke();
    const up=T.y>160,ay=up?T.y-T.r-12-p*8:T.y+T.r+12+p*8;x.fillStyle='#ffd23f';x.strokeStyle=NAVY;x.lineWidth=2.5;x.beginPath();
    if(up){x.moveTo(T.x,ay+8);x.lineTo(T.x-11,ay-8);x.lineTo(T.x+11,ay-8);}else{x.moveTo(T.x,ay-8);x.lineTo(T.x-11,ay+8);x.lineTo(T.x+11,ay+8);}x.closePath();x.fill();x.stroke();}
  const by=T&&T.y<420?640:66,bh=74;rr(x,12,by+4,W-24,bh,18);x.fillStyle='rgba(0,0,0,.35)';x.fill();rr(x,12,by,W-24,bh,18);const gr=x.createLinearGradient(0,by,0,by+bh);gr.addColorStop(0,'#fff8e0');gr.addColorStop(1,'#ffe9b0');x.fillStyle=gr;x.fill();x.strokeStyle=NAVY;x.lineWidth=3;x.stroke();
  x.save();x.beginPath();x.arc(46,by+bh/2,28,0,7);x.fillStyle='#2f86ea';x.fill();x.clip();drawHero(x,{x:46,y:by+bh/2+12,face:1,lv:1,atk:0,moving:false,icon:1},0,false);x.restore();x.strokeStyle=NAVY;x.lineWidth=2.5;x.beginPath();x.arc(46,by+bh/2,28,0,7);x.stroke();
  wrap(x,LL(s.t),84,by+(LL(s.t).length>34?24:37),W-150,13,'#1a2a40',18,'left');
  txt(x,`${ui.tut.i+1}/${TUT.length}`,W-30,by+16,10,'#8a6a2a','right',null,900);txt(x,L('건너뛰기','跳过'),W-30,by+bh-14,10,'#8a6a2a','right',null,900);}
function tapTut(p){if(!tutOn()||ui.tut.wait)return false;const by=(()=>{const T=TUT[ui.tut.i].tg?TUT[ui.tut.i].tg():null;return T&&T.y<420?640:66;})();
  if(p.x>W-90&&p.y>by+44&&p.y<by+74){ui.tut.i=TUT.length;SV.seen.tut=1;persist();sfx('tap');return true;}return false;}
/* ---------- 겹쳐 뜨는 창 ---------- */

function drawOverlay(x){
  x.fillStyle='rgba(0,8,16,.6)';x.fillRect(0,0,W,H);const o=ui.overlay,B=overlayBtns();
  if(o==='intro'){const S=G.S;panel(x,24,110,W-48,560);
    txt(x,`${LL(AREAS[S.area].n)} · ${G.si+1}`,W/2,140,12,'#bfe6ff','center',null,800);txt(x,LL(G.M.name),W/2,168,24,'#fff','center',NAVY,900);txt(x,L(`웨이브 ${S.waves}`,`${S.waves} 波`),W/2,196,12,'#bfe6ff','center',null,800);
    let y=222;const sec=(t,c)=>{x.fillStyle='rgba(255,255,255,.12)';x.fillRect(44,y,W-88,1.5);y+=18;txt(x,t,46,y,14,c,'left',NAVY,900);y+=22;};
    const nc=CREW_IDS.find(c=>CREW[c].join===G.si&&G.si>0);
    if(nc){const C=CREW[nc];sec(L('새 대원 합류!','新队员加入！'),'#9ffff0');crewFace(x,nc,72,y+14,24);txt(x,`${LL(C.n)} · ${LL(C.role)}`,108,y,13,C.col,'left',NAVY,900);
      y=wrap(x,L('합체 · ','合体 · ')+LL(C.td(1)),108,y+18,W-156,11,'#d8f2ff',15,'left');y=wrap(x,L(`★ ${LL(TW_TXT[C.tw][0])}에 타면 공명`,`★ 登上${LL(TW_TXT[C.tw][0])}即共鸣`),108,y,W-156,11,'#ffd23f',15,'left');y=wrap(x,`✦ ${LL(C.sk)}: ${LL(C.d)}`,108,y,W-156,11,'#9ff0e0',15,'left')+6;}
    const nt=TOWER_IDS.find(k=>UNLOCK[k]===G.si&&G.si>0);
    if(nt){sec(L('새 수호탑','新守护塔'),'#9ffff0');towerIcon(x,nt,72,y+12,.9);txt(x,LL(TW_TXT[nt][0]),104,y,13,TCOL[nt],'left',NAVY,900);y=wrap(x,LL(TW_TXT[nt][1]),104,y+18,W-150,11,'#d8f2ff',15,'left')+6;}
    if(S.fresh){sec(L('새로운 심연 생물','新的深渊生物'),'#ffb0f0');const e={k:S.fresh,x:72,y:y+16,a:0,r:ENEMIES[S.fresh].r,hp:1,mhp:1,shield:0,id:1,spawnT:0,inv:false,slow:0,slowT:0,stun:0,trap:0,lift:0,hitT:0,icon:1};
      drawEnemy(x,e,time);txt(x,LL(EN_TXT[S.fresh][0]),104,y,13,'#fff','left',NAVY,900);y=wrap(x,L('특기 · ','特技 · ')+LL(EN_TXT[S.fresh][1]),104,y+18,W-150,11,'#f0d8ff',15,'left');
      if(PURE[S.fresh])y=wrap(x,L('정화하면 · ','净化后 · ')+LL(PURE[S.fresh].d),104,y,W-150,11,'#9ffff0',15,'left');y+=6;}
    if(S.boss){sec(L('구역 보스','区域首领'),'#ffb0f0');txt(x,LL(EN_TXT[S.boss][0]),56,y,13,'#fff','left',NAVY,900);y=wrap(x,LL(EN_TXT[S.boss][1]),56,y+18,W-110,11,'#f0d8ff',15,'left')+4;}
    if(ui.newMech.length){sec(L('이 지도의 장치','本地图机关'),'#ffe27a');for(const m of ui.newMech){y=wrap(x,LL(MECH_TIP[m]),48,y,W-96,11,'#d8f2ff',15,'left')+4;}}
    if(G.mutList.length){sec(L('심연이 강해졌어요','深渊变强了'),'#e0b0ff');for(const m of G.mutList){txt(x,MUTS[m].ic+' '+LL(MUTS[m].n),56,y,11,'#e0b0ff','left',null,700);y+=16;}}
    {const my=avgLv();if(my<S.rec-1){y+=6;pill(x,40,y,W-80,30,'rgba(120,40,20,.7)');txt(x,L(`레벨이 낮아요 (권장 ${S.rec} · 내 평균 ${my.toFixed(1)}) · 홈 > 강화`,`队员等级偏低（推荐 ${S.rec} · 我的平均 ${my.toFixed(1)}）· 主页>强化`),W/2,y+15,11,'#ffd0b0','center',null,800);}}
    btn(x,B[0],L('출격 준비','准备出击'),'Y',16);return;}
  if(o==='cards'){panel(x,24,120,W-48,600);if(G.pendMut)txt(x,L('심연이 꿈틀거려요…','深渊在蠢动……'),W/2,150,18,'#e0b0ff','center','rgba(0,0,0,.5)');
    const m=MUTS[G.pendMut];if(m){rr(x,44,172,W-88,58,12);x.fillStyle='rgba(90,30,130,.6)';x.fill();x.strokeStyle='#b070ff';x.lineWidth=1.5;x.stroke();
    txt(x,L('이번 변이','本次变异'),62,190,10,'#d8b0ff','left');txt(x,m.ic+' '+LL(m.n),62,212,13,'#fff','left');}else{txt(x,L('신전의 축복','神殿的祝福'),W/2,200,22,'#ffe9a8','center','rgba(0,0,0,.5)');}
    txt(x,L('맞설 축복을 하나 고르세요','选择一张祝福来应对'),W/2,284,15,'#ffe9a8','center','rgba(0,0,0,.5)');txt(x,L(`수호탑 스킬 Lv${G.tier()}`,`守护塔技能 Lv${G.tier()}`),W/2,306,10,'#9fd');
    G.cards.forEach((c,i)=>{const b=B[i],p=.5+.5*Math.sin(time*3+i);rr(x,b.x,b.y,b.w,b.h,14);const gr=x.createLinearGradient(b.x,0,b.x+b.w,0);gr.addColorStop(0,'rgba(80,60,10,.95)');gr.addColorStop(1,'rgba(30,24,8,.95)');x.fillStyle=gr;x.fill();
      x.strokeStyle=`rgba(255,215,106,${.6+.4*p})`;x.lineWidth=2;x.stroke();x.fillStyle='rgba(255,215,106,.15)';x.beginPath();x.arc(b.x+48,b.y+b.h/2,30,0,7);x.fill();txt(x,BLESS[c].ic,b.x+48,b.y+b.h/2+1,28,'#fff');
      wrap(x,LL(BLESS[c].n),b.x+92,b.y+b.h/2-(LL(BLESS[c].n).length>22?8:0),b.w-108,14,'#fff6dc',18,'left');});return;}
  if(o==='pause'){panel(x,40,180,W-80,420);txt(x,L('일시정지','暂停'),W/2,214,20,'#fff','center',NAVY,900);
    btn(x,B[0],L('계속하기','继续'),'Y',16);btn(x,B[1],L('게임 방법','玩法说明'),'B',14);btn(x,B[2],L('다시 하기','重新开始'),'B',14);btn(x,B[3],L('지도로','返回地图'),'B',14);
    btn(x,B[4],L('효과음 ','音效 ')+(SV.opt.sfx?'ON':'OFF'),SV.opt.sfx?'T':'X',12);btn(x,B[5],L('음악 ','音乐 ')+(SV.opt.bgm?'ON':'OFF'),SV.opt.bgm?'T':'X',12);
    let y=540;const all=[...G.mutList.map(m=>[MUTS[m],'#e0b0ff']),...G.blessList.map(b=>[BLESS[b],'#ffe9a8'])];if(all.length){txt(x,L('변이·축복','变异·祝福'),W/2,y,11,'#9fd');y+=16;for(const [o2,c] of all.slice(-3)){txt(x,o2.ic+' '+LL(o2.n),W/2,y,10,c);y+=14;}}
    return;}
  if(o==='result'){const win=G.state==='win';panel(x,40,220,W-80,win&&G.si<OPEN_N-1?430:370);
    txt(x,win?L('신전을 지켰어요!','守住神殿了！'):L('신전이 함락됐어요','神殿失守了'),W/2,262,24,win?'#bfffe8':'#ffb0c8','center','rgba(0,0,0,.5)');
    const S2=G.S,rw=ui.reward||{c:0,fb:0};txt(x,`◆ +${rw.c*(rw.dbl?2:1)}`+(rw.fb?L(`  (첫 클리어 +${rw.fb})`,`（首通 +${rw.fb}）`):''),W/2,win?436:424,15,'#ffe27a','center','rgba(0,0,0,.5)');
    if(win){const st=G.stars();for(let i=0;i<3;i++){const on=i<st;txt(x,'★',W/2-56+i*56,320,44,on?'#ffd76a':'#345','center',on?'#a06a10':null);}
      txt(x,L(`남은 생명 ${G.lives} · 정화 ${G.kills}`,`剩余生命 ${G.lives} · 净化 ${G.kills}`),W/2,368,12,'#cde');
      if(S2.boss)wrap(x,LL(AREAS[S2.area].end),W/2,392,W-120,10.5,'#ffe9a8',14);
      else if(G.si<STAGE_N-1)txt(x,L(`다음: 수심 ${depthOf(G.si+1)}m`,`下一关：水深 ${depthOf(G.si+1)}米`),W/2,396,12,'#9fd');}
    else{txt(x,L(`웨이브 ${G.wave}/${G.S.waves}에서 무너졌어요`,`在第 ${G.wave}/${G.S.waves} 波失守`),W/2,320,13,'#cde');
      {const tips=[[L('대원 버튼을 아끼지 말고 써요. 필살기는 금방 다시 차요','别吝啬队员按钮，必杀技很快就会恢复')],[L('남은 진주로 수호탑을 강화하면 같은 자리에서 훨씬 세져요','用剩下的珍珠升级守护塔，同一位置会强很多')],[L('거품 구슬로 늦추면 다른 수호탑이 더 오래 정화해요','用泡泡宝珠减速，其他塔就能净化更久')],[L('홈 > 강화에서 레벨을 올리면 모든 판이 쉬워져요','在主页>强化中升级，所有关卡都会变简单')]];
        if(G.hasGate)tips.push([L('갈림길의 수문을 눌러 적을 긴 길로 돌려요','点击岔路的水闸，把敌人引到长路')]);if(G.S.kinds.includes('ray'))tips.push([L('투명한 가오리는 해파리 등대나 가드가 탄 탑 근처에서만 보여요','隐身鳐鱼只在水母灯塔或卫士附近现形')]);
        pill(x,60,346,W-120,24,'rgba(255,210,63,.18)');txt(x,L('다시 해볼 때 팁','再试一次的提示'),W/2,358,11,'#ffe27a','center',null,900);wrap(x,tips[(G.si*3+G.wave)%tips.length][0],W/2,388,W-130,12,'#eaf6ff',17);}}
    for(const b of B){if(b.id==='retry')btn(x,b,L('다시','重来'),'B',15);else if(b.id==='map')btn(x,b,L('지도','地图'),'B',15);else if(b.id==='next')btn(x,b,L('다음 판 ▶','下一关 ▶'),'Y',17);
      else if(b.id==='revive')btn(x,b,L('▶ 광고 보고 부활','▶ 看广告复活'),'G',16,L('생명 +10 · 한 판에 1번','生命 +10 · 每关1次'));else if(b.id==='dbl')btn(x,b,L('▶ 광고 보고 코인 2배','▶ 看广告金币翻倍'),'G',13);else if(b.id==='share')btn(x,b,L('공유','分享'),'B',13);}}
}
/* ---------- 매일 보상·미션 ---------- */
const today=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();};
function dailyInit(){const t=today();if(SV.day===t&&SV.mis.length===3)return;SV.day=t;let seed=0;for(const ch of t)seed=(seed*31+ch.charCodeAt(0))>>>0;
  const r=rng(seed),ids=Object.keys(MIS),pick=[];while(pick.length<3)pick.push({id:ids.splice(Math.floor(r()*ids.length),1)[0],p:0,got:0});SV.mis=pick;persist();}
function mission(id,n){for(const m of SV.mis)if(m.id===id&&!m.got)m.p=Math.min(MIS[id][0],m.p+n);}
const loginReady=()=>SV.login.last!==today();
const rewardBadge=()=>loginReady()||(typeof boxLeft==='function'&&boxLeft()===BOX_N)||SV.mis.some(m=>!m.got&&m.p>=MIS[m.id][0]);
const metaOpen=k=>k==='hero'||UNLOCK[k]<=Math.min(cleared(),OPEN_N-1);
const canUp=()=>[...TOWER_IDS,'hero',...CREW_IDS].some(k=>(CREW_IDS.includes(k)?CREW[k].join<=Math.min(cleared(),OPEN_N-1):metaOpen(k))&&SV.lv[k]<MAX_LV&&SV.coins>=lvCost(SV.lv[k]));
const avgLv=()=>{const ks=[...TOWER_IDS,'hero'].filter(metaOpen);return ks.reduce((a,k)=>a+SV.lv[k],0)/ks.length;};
dailyInit();
/* ---------- 공통 머리띠 ---------- */
function header(x,title,sub){let gr=x.createLinearGradient(0,0,0,110);gr.addColorStop(0,'rgba(4,14,30,.9)');gr.addColorStop(1,'rgba(4,14,30,0)');x.fillStyle=gr;x.fillRect(0,0,W,110);
  backBtn(x);txt(x,title,W/2,36,22,'#fff','center',NAVY,900);if(sub)txt(x,sub,W/2,62,11,'#bfe6ff','center',NAVY,800);coinChip(x,W-58,36);}
const hitBack=p=>Math.hypot(p.x-30,p.y-36)<26;
function seaBg(x,dt,tint){let gr=x.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#1d6a78');gr.addColorStop(.5,'#0d3a48');gr.addColorStop(1,'#03121c');x.fillStyle=gr;x.fillRect(0,0,W,H);
  if(IMG.bg_area1){x.globalAlpha=.55;x.drawImage(IMG.bg_area1,0,0,W,H);x.globalAlpha=1;}if(tint){x.fillStyle=tint;x.fillRect(0,0,W,H);}drawAmbient(x,dt,.4);drawRays(x,1.2);}
/* ---------- 이야기 ---------- */
let story=null;
function showStory(title,pages,then,vis){story={title,pages,i:0,then,t:0,vis};scr='story';}
function drawStory(dt){if(!story){scr='home';return;}const x=g;x.setTransform(K,0,0,K,0,0);seaBg(x,dt,story.tint||'rgba(0,5,15,.55)');story.t+=dt;
  const V=story.vis?story.vis[story.i]:'temple',cy=330;
  if(V==='abyss'){if(IMG.abyss_rift){x.save();x.translate(W/2,cy);x.rotate(time*.3);drawImg(x,IMG.abyss_rift,0,90,220);x.restore();}
    ['minnow','crab','eel','ray','minnow'].forEach((k,i)=>{const a=time*.5+i*1.26,e={k,x:W/2+Math.cos(a)*150,y:cy+Math.sin(a)*70+20,a:Math.cos(a+1.57)<0?Math.PI:0,r:12,hp:1,mhp:1,shield:0,id:i,spawnT:0,inv:false,slow:0,slowT:0,stun:0,trap:0,lift:0,hitT:0,prog:time*40};drawEnemy(x,e,time);});}
  else if(V==='crew'){['hero','cora','bogle','lumi'].forEach((k,i)=>{const X=70+i*103,Y=cy+30+Math.sin(time*2+i)*4;glow(x,X,Y,52,hexA(CREW[k].col,.3));crewFace(x,k,X,Y,36);txt(x,LL(CREW[k].n),X,Y+52,15,CREW[k].col,'center',NAVY,900);txt(x,LL(CREW[k].role),X,Y+70,10,'#d8f2ff','center',NAVY,800);});}
  else if(V&&V.startsWith('join_')){const c=V.slice(5),C=CREW[c],Y=cy+10;glow(x,W/2,Y,110,hexA(C.col,.35),.7+.3*Math.sin(time*2));crewFace(x,c,W/2,Y,64);txt(x,LL(C.role),W/2,Y+84,13,C.col,'center',NAVY,900);
    towerIcon(x,C.tw,W/2+96,Y+40,1);txt(x,L('★ 공명','★ 共鸣'),W/2+96,Y+70,10,'#ffd23f','center',NAVY,900);}
  else if(V==='pure'){const ph=(time*.6)%2,pu=ph>1;['crab','eel'].forEach((k,i)=>{const X=(W/2+(i?90:-90))/1.7,e={k,x:X,y:(cy+30)/1.7,a:0,r:16,hp:1,mhp:1,shield:0,id:i,spawnT:0,inv:false,slow:0,slowT:0,stun:0,trap:0,lift:0,hitT:0,prog:time*30,pure:pu?1:0};x.save();x.scale(1.7,1.7);drawEnemy(x,e,time);x.restore();
      if(Math.abs(ph-1)<.08)burst(X,cy+30,'#bffff4',3,80,2.5,.5);});txt(x,pu?L('맑아졌어요!','恢复清澈！'):L('물든 생물','被污染的生物'),W/2,cy-40,18,pu?'#9ffff0':'#e0b0ff','center',NAVY,900);drawFx(x,1/60);}
  else if(IMG.temple_gate){x.globalAlpha=.95;drawImg(x,IMG.temple_gate,W/2,430,260);x.globalAlpha=1;}
  if(story.title)txt(x,story.title,W/2,120,26,'#eaffff','center','rgba(10,40,70,.9)',900);
  panel(x,28,470,W-56,210);const s=LL(story.pages[story.i]),n=Math.floor(story.t*(LANG==='zh'?22:34));
  wrap(x,s.slice(0,n),W/2,512,W-100,15,'#f0fbff',24);
  txt(x,`${story.i+1} / ${story.pages.length}`,W/2,658,10,'#7ab');
  if(n>=s.length)txt(x,L('화면을 누르면 계속 ▶','点击继续 ▶'),W/2,710,13,`rgba(255,233,168,${.6+.4*Math.sin(time*5)})`);
  txt(x,L('건너뛰기','跳过'),W-44,36,12,'rgba(255,255,255,.6)');}
function tapStory(p){sfx('tap');const s=LL(story.pages[story.i]);if(p.y<60&&p.x>W-90){const f=story.then;story=null;f();return;}
  if(story.t*(LANG==='zh'?22:34)<s.length){story.t=99;return;}
  if(++story.i>=story.pages.length){const f=story.then;story=null;f();}else story.t=0;}
function tryEnter(si){const a=Math.floor(si/PER_AREA),nc=CREW_IDS.find(c=>CREW[c].join===si&&si>0&&!SV.seen['join_'+c]);
  const go=()=>{if(nc){SV.seen['join_'+nc]=1;persist();showStory(L(`${LL(CREW[nc].n)} 합류`,`${LL(CREW[nc].n)} 加入`),CREW[nc].joinTxt,()=>enterBattle(si),['join_'+nc,'join_'+nc]);}else enterBattle(si);};
  if(!SV.seen['a'+a]){SV.seen['a'+a]=1;persist();showStory(`${a+1}. ${LL(AREAS[a].n)}`,AREAS[a].intro,go);story.tint=AREAS[a].tint;}else go();}
/* ---------- 지도(판 고르기): 구역 5개를 좌우로 넘긴다 ---------- */
const NODE=[[118,170],[300,222],[196,282],[338,338],[124,396],[262,452],[364,510],[210,566],[96,622],[250,690]];
let mapArea=-1;
const MAPB={prev:{x:20,y:734,w:120,h:44},next:{x:W-140,y:734,w:120,h:44}};
function drawMap(dt){
  if(mapArea<0)mapArea=0;
  const x=g,a=mapArea,A=AREAS[a],cl=cleared();x.setTransform(K,0,0,K,0,0);seaBg(x,dt,A.tint);
  x.strokeStyle='rgba(180,140,255,.35)';x.lineWidth=3;x.setLineDash([6,8]);x.lineDashOffset=-time*20;x.beginPath();NODE.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.stroke();x.setLineDash([]);
  NODE.forEach((p,j)=>{const i=a*PER_AREA+j,open=i<=cl&&i<OPEN_N,boss=j===PER_AREA-1,cur=i===Math.min(cl,STAGE_N-1),r=boss?30:24;
    if(cur)glow(x,p[0],p[1],r*2,'rgba(255,215,106,.5)',.6+.4*Math.sin(time*4));
    roundBtn(x,p[0],p[1],r,!open?PAL.X:cur?PAL.Y:boss?PAL.O:SV.stars[i]?PAL.T:PAL.B,cur);
    if(open)txt(x,boss?'👑':''+(i+1),p[0],p[1]+1,boss?20:18,'#fff','center',NAVY,900);else icon(x,'lock',p[0],p[1],1.2,'#c8d2de');
    if(SV.stars[i])txt(x,'★'.repeat(SV.stars[i])+'☆'.repeat(3-SV.stars[i]),p[0],p[1]+r+10,11,'#ffd76a');
    txt(x,depthOf(i)+'m',p[0]+(p[0]<W/2?r+22:-r-22),p[1],10,'rgba(200,240,255,.6)');});
  const tot=SV.stars.reduce((p,q)=>p+q,0);header(x,LL(A.n),L(`${a+1}구역 · ★ ${tot}/${STAGE_N*3}`,`第${a+1}区域 · ★ ${tot}/${STAGE_N*3}`));
  txt(x,L(`권장 대원 레벨 ${recLv(a*PER_AREA)}~${recLv(a*PER_AREA+9)} · 내 평균 ${avgLv().toFixed(1)}`,`推荐队员等级 ${recLv(a*PER_AREA)}~${recLv(a*PER_AREA+9)} · 我的平均 ${avgLv().toFixed(1)}`),W/2,88,11,'#bfe');
  if(a===0){const n=Math.min(cleared(),OPEN_N);pill(x,W/2-150,700,300,30,'rgba(8,22,40,.85)');txt(x,n<OPEN_N?L(`다음 목표: ${n+1}판 깨기`,`下一个目标：通关第${n+1}关`)+(SV.stars.slice(0,n).some(v=>v<3)?L(' · 별 3개 모으기',' · 收集3星'):''):L('새 판은 그림이 준비되면 열려요','新关卡将在美术完成后开放'),W/2,715,12,'#ffe27a','center',NAVY,900);}
  if(a>0)btn(x,MAPB.prev,L('◀ 이전 구역','◀ 上一区域'),'#3a8a9a',12);
  if(a<AREAS.length-1){const ok=cl>=(a+1)*PER_AREA;btn(x,MAPB.next,ok?L('다음 구역 ▶','下一区域 ▶'):L('🔒 보스를 이기면','🔒 击败首领后'),ok?'#3a8a9a':'#444',12);}
}
function tapMap(p){if(hitBack(p)){scr='home';sfx('tap');return;}
  const cl=cleared(),a=mapArea;
  if(a>0&&hitR(p,MAPB.prev)){mapArea--;sfx('tap');return;}
  if(a<AREAS.length-1&&hitR(p,MAPB.next)&&cl>=(a+1)*PER_AREA){mapArea++;sfx('tap');return;}
  NODE.forEach((q,j)=>{const i=a*PER_AREA+j;if(Math.hypot(p.x-q[0],p.y-q[1])<30&&i<=cl&&i<OPEN_N){sfx('tap');tryEnter(i);}});}
/* ---------- 수호대 강화(판 밖 성장) ---------- */
/* ---------- 강화: 수호탑(혼자 싸울 때 힘) / 대원(합체했을 때 힘) ---------- */
let upTab=0;
const UPT=[{x:60,y:76,w:160,h:34},{x:230,y:76,w:160,h:34}];
const upRow=i=>({x:24,y:120+i*98,w:W-48,h:90});
const upKeys=()=>upTab?CREW_IDS:TOWER_IDS;
const upOpen=k=>TOWER_IDS.includes(k)?metaOpen(k):CREW[k].join<=Math.min(cleared(),OPEN_N-1);
function upEff(k,lv){return TOWER_IDS.includes(k)?masteryMul(lv):crewMul(lv);}
function drawUpgrade(dt){const x=g;x.setTransform(K,0,0,K,0,0);seaBg(x,dt,'rgba(0,10,20,.45)');header(x,L('강화','强化'));
  [L('수호탑','守护塔'),L('수비대원','守卫队员')].forEach((s,i)=>btn(x,UPT[i],s,upTab===i?'Y':'X',13));
  txt(x,upTab?L('대원은 수호탑에 합체했을 때 그 탑을 강하게 해요','队员合体到守护塔时会强化该塔'):L('수호탑이 혼자 싸울 때의 기본 정화력이에요','守护塔独自作战时的基础净化力'),W/2,124,10.5,'#bfe6ff','center',NAVY,800);
  upKeys().forEach((k,i)=>{const b=upRow(i),bb={...b,y:b.y+14},open=upOpen(k),lv=SV.lv[k],c=lvCost(lv),max=lv>=MAX_LV,can=open&&!max&&SV.coins>=c;panel(x,bb.x,bb.y,bb.w,bb.h);
    if(TOWER_IDS.includes(k)){x.globalAlpha=open?1:.35;towerIcon(x,k,bb.x+46,bb.y+52,1.1);x.globalAlpha=1;}else crewFace(x,k,bb.x+46,bb.y+45,30,!open);
    const name=TOWER_IDS.includes(k)?LL(TW_TXT[k][0]):`${LL(CREW[k].n)} · ${LL(CREW[k].role)}`;txt(x,name,bb.x+92,bb.y+22,14,TOWER_IDS.includes(k)?TCOL[k]:CREW[k].col,'left',NAVY,900);
    if(!open){const j=TOWER_IDS.includes(k)?UNLOCK[k]:CREW[k].join;txt(x,L(`${j}판을 깨면 합류`,`通关第${j}关后加入`),bb.x+92,bb.y+50,12,'#9fb0c4','left',null,800);return;}
    txt(x,`Lv ${lv}`+(max?' (MAX)':` → ${lv+1}`),bb.x+92,bb.y+45,13,'#fff','left',NAVY,900);
    const lab=TOWER_IDS.includes(k)?L('정화력','净化力'):L('합체 시 정화력','合体时净化力');
    txt(x,`${lab} ×${upEff(k,lv).toFixed(2)}`+(max?'':`  →  ×${upEff(k,lv+1).toFixed(2)}`),bb.x+92,bb.y+66,10.5,'#9ff0e0','left',null,800);
    if(!max)btn(x,{x:bb.x+bb.w-110,y:bb.y+24,w:98,h:42},'◆ '+c,can?'G':'X',14);});
}
function tapUpgrade(p){if(hitBack(p)){scr='home';sfx('tap');return;}UPT.forEach((b,i)=>{if(hitR(p,b)){upTab=i;sfx('tap');}});
  upKeys().forEach((k,i)=>{const b=upRow(i),bb={x:b.x+b.w-110,y:b.y+14+24,w:98,h:42},lv=SV.lv[k];if(!hitR(p,bb)||!upOpen(k)||lv>=MAX_LV)return;
    const c=lvCost(lv);if(SV.coins<c){sfx('tap');return;}SV.coins-=c;SV.lv[k]++;persist();sfx('up');burst(bb.x+50,bb.y+22,'#ffe27a',16,90,2.5,.6);});}
/* ---------- 도감: 적 스킬 · 수호탑 각성 · 지휘 스킬 ---------- */
let dexTab=0;
const DEXT=[{x:24,y:70,w:128,h:34},{x:161,y:70,w:128,h:34},{x:298,y:70,w:128,h:34}];
function drawDex(dt){const x=g;x.setTransform(K,0,0,K,0,0);seaBg(x,dt,'rgba(0,10,20,.6)');header(x,L('도감','图鉴'));
  [L('심연 생물','深渊生物'),L('수호탑','守护塔'),L('수비대원','守卫队员')].forEach((s,i)=>btn(x,DEXT[i],s,dexTab===i?'#3fd0c0':'#345',12));
  const cl=cleared();
  if(dexTab===0){const ks=[...Object.keys(KIND_AT),'elite',...BOSS_IDS];ks.forEach((k,i)=>{const y=118+i*45,E=ENEMIES[k],seen=isBoss(k)?cl>=BOSS_IDS.indexOf(k)*PER_AREA+6:k==='elite'?cl>=3:cl>=KIND_AT[k];
      rr(x,20,y,W-40,41,10);x.fillStyle=isBoss(k)?'rgba(70,20,90,.75)':'rgba(8,28,40,.8)';x.fill();
      if(!seen){txt(x,'？？？',60,y+21,14,'#567');txt(x,L('아직 만나지 못했어요','尚未遇到'),100,y+21,11,'#567','left');return;}
      x.save();x.beginPath();x.rect(20,y,64,41);x.clip();drawEnemy(x,{k,x:52,y:y+21,a:0,r:Math.min(13,E.r),hp:1,mhp:1,shield:0,id:i,spawnT:0,inv:false,slow:0,slowT:0,stun:0,trap:0,lift:0,hitT:0,icon:1},time);x.restore();
      txt(x,LL(EN_TXT[k][0]),90,y+13,12,isBoss(k)?'#ffb0f0':'#fff','left');if(PURE[k])txt(x,L('정화 → ','净化→')+LL(PURE[k].nm||PURE[k].n),W-30,y+13,9.5,'#9ffff0','right',null,800);wrap(x,LL(EN_TXT[k][1]),90,y+29,W-124,9.5,'#bcd',11,'left');});}
  else if(dexTab===1){TOWER_IDS.forEach((k,i)=>{const y=114+i*128,T=TW_TXT[k];panel(x,20,y,W-40,120);towerIcon(x,k,52,y+38,.85);txt(x,LL(T[0]),86,y+18,14,TCOL[k],'left');wrap(x,LL(T[1]),86,y+36,W-124,10,'#cde',12,'left');
      txt(x,`✦ ${LL(T[2])}: ${LL(T[3](1))}`,32,y+64,10,'#ffe9a8','left');
      BRANCH[k].forEach((b,j)=>txt(x,`${L('각성','觉醒')} ${j?'B':'A'} · ${LL(b.n)}: ${LL(b.d)}`,32,y+82+j*17,10,j?'#ffc9a8':'#a8e8ff','left'));});}
  else{CREW_IDS.forEach((k,i)=>{const y=112+i*98,C=CREW[k],open=C.join<=Math.min(cl,OPEN_N-1);panel(x,20,y,W-40,90);crewFace(x,k,60,y+45,30,!open);
      txt(x,LL(C.n),104,y+20,15,C.col,'left',NAVY,900);txt(x,LL(C.role),W-34,y+20,10,'#bfe6ff','right',null,700);
      if(!open){txt(x,L(`${C.join}판을 깨면 합류해요`,`通关第${C.join}关后加入`),104,y+50,11,'#9fb0c4','left',null,700);return;}
      txt(x,L('합체 · ','合体 · ')+LL(C.td(1)),104,y+40,9.5,'#d8f2ff','left',null,700);
      txt(x,C.tw?L(`★ 공명: ${LL(TW_TXT[C.tw][0])}에 타면 효과 ×${RESO_TRAIT}, 정화력 ×${RESO_DMG}`,`★ 共鸣：登上${LL(TW_TXT[C.tw][0])}时效果×${RESO_TRAIT}，净化力×${RESO_DMG}`):L('대장: 어느 탑에 타도 주변 탑을 이끌어요','队长：登上任何塔都能带领周围的塔'),104,y+57,9.5,'#ffd23f','left',null,700);
      txt(x,`✦ ${LL(C.sk)} (${C.cd}${L('초','秒')}): ${LL(C.d)}`.slice(0,LANG==='zh'?36:44),104,y+74,9.5,'#9ff0e0','left',null,700);});}
}
function tapDex(p){if(hitBack(p)){scr='home';sfx('tap');return;}DEXT.forEach((b,i)=>{if(hitR(p,b)){dexTab=i;sfx('tap');}});}
/* ---------- 보상: 출석 7일 · 하루 미션 3개 ---------- */
const RWB={login:{x:W/2-90,y:236,w:180,h:44},box:{x:W/2-120,y:672,w:240,h:50}};
const BOX_N=3,BOX_C=120;
const boxLeft=()=>BOX_N-((SV.box&&SV.box.day===today())?SV.box.n:0);
const misRow=i=>({x:24,y:356+i*96,w:W-48,h:86});
function drawReward(dt){const x=g;x.setTransform(K,0,0,K,0,0);seaBg(x,dt,'rgba(0,10,20,.55)');header(x,L('보상','奖励'));dailyInit();
  panel(x,20,84,W-40,210);txt(x,L('출석 보상','签到奖励'),W/2,106,14,'#ffe9a8');
  LOGIN.forEach((c,i)=>{const X=38+i*54,done=i<SV.login.n%7||(SV.login.n>0&&SV.login.n%7===0&&!loginReady()),cur=i===SV.login.n%7&&loginReady();rr(x,X,124,48,92,8);x.fillStyle=done?'rgba(40,110,90,.8)':cur?'rgba(150,110,20,.9)':'rgba(10,30,42,.9)';x.fill();
    if(cur){x.strokeStyle='#ffd76a';x.lineWidth=2;x.stroke();}txt(x,L(`${i+1}일`,`第${i+1}天`),X+24,140,10,'#bcd');txt(x,done?'✔':'◆',X+24,168,18,done?'#8fe':'#ffd76a');txt(x,''+c,X+24,198,11,'#ffe9a8');});
  btn(x,RWB.login,loginReady()?L('오늘 보상 받기','领取今日奖励'):L('내일 또 만나요','明天再来'),loginReady()?'#d0a030':'#555',14);
  txt(x,L('오늘의 미션','今日任务'),W/2,330,14,'#ffe9a8');
  SV.mis.forEach((m,i)=>{const b=misRow(i),M=MIS[m.id],ok=m.p>=M[0];panel(x,b.x,b.y,b.w,b.h);txt(x,LL(M[2]),b.x+16,b.y+26,13,'#fff','left');
    rr(x,b.x+16,b.y+48,200,12,6);x.fillStyle='rgba(0,0,0,.5)';x.fill();rr(x,b.x+16,b.y+48,Math.max(12,200*Math.min(1,m.p/M[0])),12,6);x.fillStyle=ok?'#7fe':'#3a8a9a';x.fill();txt(x,`${m.p}/${M[0]}`,b.x+116,b.y+55,9,'#fff');
    btn(x,{x:b.x+b.w-110,y:b.y+22,w:96,h:42},m.got?'✔':'◆ '+M[1],m.got?'#345':ok?'#d0a030':'#555',13);});
  drawFx(x,dt);
  {const n=boxLeft();btn(x,RWB.box,n>0?L(`▶ 광고 보고 상자 열기 (${n}/${BOX_N})`,`▶ 看广告开宝箱（${n}/${BOX_N}）`):L('오늘 상자는 다 열었어요','今日宝箱已开完'),n>0?'G':'X',13,n>0?L(`코인 +${BOX_C}`,`金币 +${BOX_C}`):'');}
}
function tapReward(p){if(hitBack(p)){scr='home';sfx('tap');return;}
  if(hitR(p,RWB.box)&&boxLeft()>0){showAd('box',()=>{if(!SV.box||SV.box.day!==today())SV.box={day:today(),n:0};SV.box.n++;SV.coins+=BOX_C;persist();burst(W/2,690,'#ffe27a',24,120,3,.7);fx({k:'txt',s:'+'+BOX_C,x:W/2,y:660,col:'#ffe27a',size:18,life:1});sfx('card');});return;}
  if(hitR(p,RWB.login)&&loginReady()){const c=LOGIN[SV.login.n%7];SV.coins+=c;SV.login.n++;SV.login.last=today();persist();sfx('card');burst(W/2,258,'#ffe27a',24,120,3,.7);fx({k:'txt',s:'+'+c,x:W/2,y:226,col:'#ffe27a',size:18,life:1});return;}
  SV.mis.forEach((m,i)=>{const b=misRow(i),M=MIS[m.id];if(hitR(p,{x:b.x+b.w-110,y:b.y+22,w:96,h:42})&&!m.got&&m.p>=M[0]){m.got=1;SV.coins+=M[1];persist();sfx('card');burst(b.x+b.w-62,b.y+43,'#ffe27a',20,110,3,.7);}});}
/* ---------- 홈 ---------- */
const HOME_BTN={start:{x:65,y:548,w:320,h:62},up:{x:27,y:626,w:124,h:72},dex:{x:163,y:626,w:124,h:72},rw:{x:299,y:626,w:124,h:72}};
const SETB={sfx:{x:65,y:178,w:156,h:44},bgm:{x:229,y:178,w:156,h:44},shake:{x:65,y:230,w:156,h:44},vib:{x:229,y:230,w:156,h:44},lang:{x:65,y:290,w:320,h:44},guide:{x:65,y:342,w:156,h:44},story:{x:229,y:342,w:156,h:44},priv:{x:65,y:394,w:320,h:40},reset:{x:65,y:452,w:320,h:40},close:{x:145,y:520,w:160,h:46}};
let resetArm=0;
let homeSet=false;
function dot(x,b){x.fillStyle='#ff3b5c';x.beginPath();x.arc(b.x+b.w-8,b.y+6,9,0,7);x.fill();x.strokeStyle='#fff';x.lineWidth=2;x.stroke();txt(x,'!',b.x+b.w-8,b.y+6.5,11,'#fff',null,null,900);}
function tile(x,b,ic,label){rr(x,b.x,b.y+4,b.w,b.h,18);x.fillStyle='rgba(0,0,0,.35)';x.fill();rr(x,b.x,b.y,b.w,b.h,18);const gr=x.createLinearGradient(0,b.y,0,b.y+b.h);gr.addColorStop(0,'rgba(40,90,150,.92)');gr.addColorStop(1,'rgba(18,42,80,.92)');x.fillStyle=gr;x.fill();x.strokeStyle=NAVY;x.lineWidth=2.5;x.stroke();
  rr(x,b.x+3,b.y+3,b.w-6,b.h-6,15);x.strokeStyle='rgba(150,210,255,.25)';x.lineWidth=1.5;x.stroke();icon(x,ic,b.x+b.w/2,b.y+30,1.5,'#bfe6ff');txt(x,label,b.x+b.w/2,b.y+62,13,'#fff','center',NAVY,900);}
function logo(x,Y){const T=LANG==='zh'?['深海神殿','守卫']:['심해 신전','수비대'];x.save();x.translate(W/2,Y);x.rotate(-.035);x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';
  [[T[0],0,34],[T[1],52,64]].forEach(([s,y,size])=>{x.font=`900 ${size}px ${FONT}`;x.strokeStyle=NAVY;x.lineWidth=size*.28;x.strokeText(s,0,y+4);x.strokeStyle='#123a6e';x.lineWidth=size*.2;x.strokeText(s,0,y);
    const gr=x.createLinearGradient(0,y-size/2,0,y+size/2);gr.addColorStop(0,'#ffffff');gr.addColorStop(.55,'#bff3ff');gr.addColorStop(1,'#4fd0ff');x.fillStyle=gr;x.fillText(s,0,y);});x.restore();}
function drawHome(dt){
  const x=g;x.setTransform(K,0,0,K,0,0);seaBg(x,dt,'rgba(0,10,30,.18)');
  if(Math.random()<.2)fx({k:'bub',x:Math.random()*W,y:H,v:30+Math.random()*40,s:1+Math.random()*3,ph:Math.random()*6,life:8});
  glow(x,W/2,400,190,'rgba(90,230,255,.22)',.8+.2*Math.sin(time*2));
  x.save();x.translate(W/2,500+Math.sin(time*1.2)*3);x.scale(1.75,1.75);x.translate(-TEMPLE.x,-TEMPLE.y);drawTemple(x,time,0);x.restore();
  drawHero(x,{x:W/2-92,y:478,face:1,lv:SV.lv.hero,atk:0,moving:false},time,false);
  drawFx(x,dt);
  logo(x,130);
  pill(x,W/2-120,232,240,26,'rgba(8,22,40,.6)');txt(x,L('잿빛 육지를 떠나, 바다에서 다시 살아가기','离开灰烬的陆地，在海中重新生活'),W/2,245,11.5,'#d8f2ff','center',null,700);
  roundBtn(x,30,36,17,PAL.B);icon(x,'gear',30,36,1);coinChip(x,W-58,36);
  const cl=Math.min(cleared(),OPEN_N),pu=Math.sin(time*3)*2,b=HOME_BTN.start;
  btn(x,{x:b.x-pu,y:b.y-pu*.5,w:b.w+pu*2,h:b.h+pu},L('출격','出击'),'Y',26,cl>=OPEN_N?L('다시 도전하기','再次挑战'):L(`${cl+1}판 · ${LL(AREAS[0].n)}`,`第${cl+1}关 · ${LL(AREAS[0].n)}`));
  tile(x,HOME_BTN.up,'up',L('강화','强化'));if(canUp())dot(x,HOME_BTN.up);
  tile(x,HOME_BTN.dex,'book',L('도감','图鉴'));
  tile(x,HOME_BTN.rw,'gift',L('보상','奖励'));if(rewardBadge())dot(x,HOME_BTN.rw);
  if(LANG==='zh'&&!homeSet)healthNote(x,742);
  if(loadBad)txt(x,L('그림을 다 받지 못했어요. 새로고침해 주세요','部分图片加载失败，请刷新页面'),W/2,544,11,'#ffb0b0','center',NAVY,800);
  txt(x,'v'+BUILD,W-8,H-10,9,'rgba(255,255,255,.3)','right',null,700);
  if(homeSet){x.fillStyle='rgba(2,8,20,.72)';x.fillRect(0,0,W,H);panel(x,45,120,W-90,462);txt(x,L('설정','设置'),W/2,150,20,'#fff','center',NAVY,900);
    const tg=(b,on,lab)=>btn(x,b,lab+(on?' ON':' OFF'),on?'T':'X',13);tg(SETB.sfx,SV.opt.sfx,L('효과음','音效'));tg(SETB.bgm,SV.opt.bgm,L('음악','音乐'));tg(SETB.shake,SV.opt.shake,L('화면 흔들림','画面震动'));tg(SETB.vib,SV.opt.vib,L('진동','振动'));
    btn(x,SETB.lang,LANG==='ko'?'언어: 한국어 → 中文':'语言：中文 → 한국어','B',14);btn(x,SETB.guide,L('게임 방법','玩法说明'),'B',13);btn(x,SETB.story,L('이야기','故事'),'B',13);btn(x,SETB.priv,L('개인정보 처리방침','隐私政策'),'X',12);
    const arm=resetArm>time;btn(x,SETB.reset,arm?L('정말 처음부터? 한 번 더 누르세요','真的重来？请再点一次'):L('진행 초기화','重置进度'),arm?'O':'X',arm?12:13);btn(x,SETB.close,L('닫기','关闭'),'Y',15);}
}
function tapHome(p){
  if(homeSet){if(hitR(p,SETB.shake)){SV.opt.shake^=1;persist();sfx('tap');}else if(hitR(p,SETB.vib)){SV.opt.vib^=1;persist();vib(30);sfx('tap');}else if(hitR(p,SETB.priv)){privOpen=true;sfx('tap');}
    else if(hitR(p,SETB.sfx)){SV.opt.sfx^=1;persist();sfx('tap');}else if(hitR(p,SETB.bgm)){SV.opt.bgm^=1;persist();sfx('tap');}else if(hitR(p,SETB.lang)){LANG=LANG==='ko'?'zh':'ko';SV.lang=LANG;persist();sfx('tap');}
    else if(hitR(p,SETB.guide)){homeSet=false;sfx('tap');openGuide('home');}
    else if(hitR(p,SETB.reset)){sfx('tap');if(resetArm>time){resetArm=0;homeSet=false;resetSave();dailyInit();FX.length=0;fx({k:'banner',s:L('처음부터 다시 시작해요','已重置，从头开始'),y:330,col:'#ffd23f',size:20,life:1.6});}else resetArm=time+3;}
    else if(hitR(p,SETB.story)){homeSet=false;sfx('tap');showStory(LL(TITLE),PROLOGUE,()=>{scr='home';},PROLOGUE_V);}else if(hitR(p,SETB.close)||p.y<120||p.y>582){homeSet=false;sfx('tap');}return;}
  if(Math.hypot(p.x-30,p.y-36)<26){homeSet=true;sfx('tap');return;}
  if(hitR(p,HOME_BTN.start)){sfx('tap');mapArea=-1;if(!SV.seen.pro){SV.seen.pro=1;persist();showStory(LL(TITLE),PROLOGUE,()=>{scr='map';},PROLOGUE_V);}else scr='map';return;}
  if(hitR(p,HOME_BTN.up)){sfx('tap');scr='upgrade';return;}if(hitR(p,HOME_BTN.dex)){sfx('tap');scr='dex';return;}if(hitR(p,HOME_BTN.rw)){sfx('tap');scr='reward';return;}}
/* ---------- 게임 방법(안내서) ---------- */
let guide={p:0,from:'home'};
const GUIDE=[
  {t:['목표: 신전을 지켜요','目标：守护神殿'],d:[['심연 동굴에서 보랏빛으로 물든 바다 생물이 신전으로 몰려와요.','被深渊染紫的海洋生物从深渊洞窟涌向神殿。'],['신전에 닿으면 생명이 줄고, 0이 되면 져요.','到达神殿会扣生命，归零即失败。'],['남은 생명 18 이상이면 별 3개, 10 이상이면 별 2개예요.','剩余生命18以上得3星，10以上得2星。']],v:'goal'},
  {t:['수호탑 짓기와 강화','建造与升级守护塔'],d:[['빛나는 바위섬을 누르면 아래에 카드가 나와요. 수호탑을 고르고 "건설".','点击发光的岩岛，下方会出现卡片。选好守护塔后点「建造」。'],['생물을 정화하면 진주를 얻어요. 진주로 더 짓거나 강화해요.','净化生物可获得珍珠，用来建造或升级。'],['3단계에서 한 번 더 올리면 "각성": A·B 두 갈래 중 하나를 골라요.','3级后再升一次即「觉醒」：从A/B两种路线中选一个。']],v:'tower'},
  {t:['수비대원 합체','守卫队员合体'],d:[['수호탑은 혼자서도 싸워요. 아래 대원 얼굴을 누르고 수호탑을 누르면 그 탑에 "합체"해요.','守护塔可以独自作战。点击下方队员头像再点击守护塔即可「合体」。'],['대원마다 특성이 더해져요(코라: 사거리·치명, 보글: 둔화, 루미: 연쇄). 전용 탑에 타면 "공명"으로 훨씬 강해져요.','每位队员会附加特性（珂拉：射程·暴击，泡泡：减速，露米：连锁）。登上专属塔会「共鸣」，强很多。'],['합체한 대원만 필살기를 써요. 대원은 이야기가 진행되며 합류해요.','只有合体的队员能使用必杀技。队员会随剧情加入。']],v:'crew'},
  {t:['정화: 죽이지 않고 되돌려요','净化：不是消灭，而是唤回'],d:[['다 씻긴 생물은 맑은 색으로 돌아와 잠깐 우리를 도와요.','被净化的生物会恢复清澈，暂时帮助我们。']],v:'pure'},
  {t:['웨이브·카드·성장','波次·卡牌·成长'],d:[['"다음 웨이브"를 일찍 부르면 남은 시간만큼 진주 보너스.','提前召唤「下一波」可按剩余时间获得珍珠奖励。'],['3웨이브마다 축복 카드를 1장 골라요. 4판부터는 그때 심연도 강해져요.','每3波选择1张祝福卡。从第4关起，深渊也会同时变强。'],['판을 깨면 코인. 홈 > 강화에서 수호탑·대원 레벨을 올리면 모든 판이 쉬워져요.','过关获得金币。在主页>队员中提升等级，所有关卡都会变简单。']],v:'grow'},
];
const GB={prev:{x:24,y:724,w:120,h:48},next:{x:W-144,y:724,w:120,h:48}};
function openGuide(from){track('guide_open',{from});guide={p:0,from};scr='guide';}
function drawGuide(dt){const x=g;x.setTransform(K,0,0,K,0,0);seaBg(x,dt,'rgba(0,10,25,.55)');header(x,L('게임 방법','玩法说明'),`${guide.p+1} / ${GUIDE.length}`);const P=GUIDE[guide.p];
  panel(x,18,92,W-36,620);txt(x,LL(P.t),W/2,128,20,'#ffe27a','center',NAVY,900);
  const V=P.v,cy=262;
  if(V==='goal'){if(IMG.abyss_rift)drawImg(x,IMG.abyss_rift,110,cy+40,96);if(IMG.temple_gate)drawImg(x,IMG.temple_gate,340,cy+60,120);
    for(let i=0;i<3;i++){const e={k:['minnow','crab','eel'][i],x:170+i*45+((time*30)%45),y:cy+10+i*6,a:0,r:10,hp:1,mhp:1,shield:0,id:i,spawnT:0,inv:false,slow:0,slowT:0,stun:0,trap:0,lift:0,hitT:0,prog:time*40,icon:1};drawEnemy(x,e,time);}
    icon(x,'heart',W/2,cy+76,1.4,'#ff5f86');txt(x,'20',W/2+24,cy+77,16,'#fff','left',NAVY,900);}
  else if(V==='tower'){['coral','bubble','jelly'].forEach((k,i)=>{towerIcon(x,k,110+i*115,cy+30,1.3);pill(x,110+i*115-28,cy+64,56,20);icon(x,'gem',110+i*115-16,cy+74,.65,'#5ff0ff');txt(x,''+TOWERS[k].cost,110+i*115+8,cy+75,11,'#fff','center',null,900);});}
  else if(V==='crew'){towerIcon(x,'coral',110,cy+20,1.2);txt(x,'+',190,cy+10,26,'#fff','center',NAVY,900);crewFace(x,'cora',260,cy+6,30);txt(x,'=',318,cy+10,26,'#fff','center',NAVY,900);
    towerIcon(x,'coral',380,cy+20,1.2);crewFace(x,'cora',395,cy-24,12);glow(x,380,cy,40,'rgba(255,210,63,.3)');txt(x,L('★ 공명!','★ 共鸣！'),380,cy+62,12,'#ffd23f','center',NAVY,900);txt(x,L('혼자 싸움','独自作战'),110,cy+62,11,'#bfe6ff','center',NAVY,800);}
  else if(V==='pure'){['minnow','crab','eel','ray'].forEach((k,i)=>{const Y=cy-36+i*40,A={k,x:80,y:Y,a:0,r:10,hp:1,mhp:1,shield:0,id:i,spawnT:0,inv:false,slow:0,slowT:0,stun:0,trap:0,lift:0,hitT:0,prog:time*30,icon:1};
      drawEnemy(x,A,time);txt(x,'→',116,Y,16,'#9ffff0','center',NAVY,900);drawEnemy(x,Object.assign({},A,{x:150,pure:1}),time);
      txt(x,LL(PURE[k].nm||PURE[k].n),184,Y-7,12,'#9ffff0','left',NAVY,900);txt(x,LL(PURE[k].d),184,Y+9,9.5,'#d8f2ff','left',null,700);});}
  else if(V==='grow'){btn(x,{x:W/2-80,y:cy-20,w:160,h:46},L('다음 웨이브','下一波'),'Y',14,L('일찍 부르면 +27','提前召唤 +27'));pill(x,W/2-60,cy+46,120,28);x.fillStyle='#ffc53d';x.beginPath();x.arc(W/2-42,cy+60,9,0,7);x.fill();txt(x,'+'+stageCoins(0,3),W/2+8,cy+61,14,'#fff','center',NAVY,900);}
  let y=V==='pure'?420:390;for(const d of P.d){y=wrap(x,'• '+LL(d),40,y,W-80,13,'#eaf6ff',20,'left')+8;}
  if(guide.p>0)btn(x,GB.prev,L('◀ 이전','◀ 上一页'),'B',14);btn(x,GB.next,guide.p<GUIDE.length-1?L('다음 ▶','下一页 ▶'):L('알겠어요','明白了'),'Y',14);}
function tapGuide(p){const back=()=>{if(guide.from==='battle'){scr='battle';ui.overlay='pause';}else scr='home';};
  if(hitBack(p)){sfx('tap');back();return;}if(guide.p>0&&hitR(p,GB.prev)){guide.p--;sfx('tap');return;}if(hitR(p,GB.next)){sfx('tap');if(guide.p<GUIDE.length-1)guide.p++;else back();}}
/* ---------- 로딩 ---------- */
let loadT=0,loadBad=false;
function drawLoading(dt){const x=g;x.setTransform(K,0,0,K,0,0);loadT+=dt;let gr=x.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#1d6a78');gr.addColorStop(1,'#03121c');x.fillStyle=gr;x.fillRect(0,0,W,H);
  logo(x,300);const got=MUST.filter(n=>IMG[n]).length,f=MUST.length?got/MUST.length:1;
  rr(x,75,450,300,18,9);x.fillStyle='rgba(4,14,30,.8)';x.fill();rr(x,75,450,Math.max(18,300*f),18,9);x.fillStyle='#5ff0dc';x.fill();rr(x,75,450,300,18,9);x.strokeStyle=NAVY;x.lineWidth=2.5;x.stroke();
  txt(x,Math.round(f*100)+'%',W/2,490,13,'#fff','center',NAVY,900);
  if(loadT>6)txt(x,L('인터넷이 느려 시간이 걸리고 있어요','网络较慢，请稍候'),W/2,522,12,'#bfe6ff','center',NAVY,800);
  if(LANG==='zh')healthNote(x,690);
  const nf=Object.keys(LOAD.fail).length;if((f>=1&&loadT>.4)||loadT>25||(nf&&got+nf>=MUST.length)){loadBad=f<1;scr='home';track('load_done',{ok:f>=1?1:0,sec:Math.round(loadT)});}}
function tapLoading(){}
function healthNote(x,Y){txt(x,'健康游戏忠告',W/2,Y-17,10.5,'rgba(255,233,168,.85)','center',null,900);
  ['抵制不良游戏，拒绝盗版游戏。','注意自我保护，谨防受骗上当。','适度游戏益脑，沉迷游戏伤身。','合理安排时间，享受健康生活。'].forEach((s,i)=>txt(x,s,W/2,Y+i*14,9.5,'rgba(230,245,255,.75)','center',null,700));}
/* ---------- 광고 창(테스트 광고 · 실패 문구) ---------- */
function drawAdLayer(dt){if(!AD)return;const x=g;x.setTransform(K,0,0,K,0,0);AD.t+=dt;x.fillStyle='rgba(2,8,20,.85)';x.fillRect(0,0,W,H);panel(x,50,300,W-100,200);
  if(AD.state==='fail'){txt(x,L('광고를 끝까지 보지 않았거나 불러오지 못했어요','广告未看完或加载失败'),W/2,370,12.5,'#fff','center',NAVY,800);txt(x,L('화면을 눌러 닫기','点击关闭'),W/2,440,12,'#bfe6ff','center',null,800);return;}
  txt(x,L('광고 (테스트)','广告（测试）'),W/2,350,18,'#ffe27a','center',NAVY,900);txt(x,L('실제 출시 때는 여기에 광고가 나와요','正式上线时这里会播放广告'),W/2,384,11,'#bfe6ff','center',null,800);
  const f=Math.min(1,AD.t/2);rr(x,90,420,W-180,14,7);x.fillStyle='rgba(4,14,30,.8)';x.fill();rr(x,90,420,Math.max(14,(W-180)*f),14,7);x.fillStyle='#ffd23f';x.fill();
  if(AD.t>=2){const cb=AD.cb,r=AD.reason;AD=null;track('ad_reward',{reason:r});if(cb)cb();}}
function tapAdLayer(){if(AD&&AD.state==='fail')AD=null;else if(!AD)return false;return true;}
/* ---------- 개인정보 ---------- */
let privOpen=false;
const PRIV=[['이 게임은 진행 기록(별·코인·설정)을 이 기기 안에만 저장해요.','本游戏仅在本设备中保存进度（星星、金币、设置）。'],['이름, 연락처 같은 개인 정보를 받거나 보내지 않아요.','不收集也不发送姓名、联系方式等个人信息。'],['광고와 통계는 위챗·더우인 등 플랫폼이 제공하며, 각 플랫폼의 개인정보 정책을 따라요.','广告与统计由微信、抖音等平台提供，遵循各平台的隐私政策。'],['설정 > 진행 초기화로 저장된 기록을 언제든 지울 수 있어요.','可随时在 设置 > 重置进度 中清除已保存的记录。']];
function drawPrivacy(x){x.fillStyle='rgba(2,8,20,.85)';x.fillRect(0,0,W,H);panel(x,30,150,W-60,480);txt(x,L('개인정보 처리방침','隐私政策'),W/2,184,18,'#fff','center',NAVY,900);
  let y=226;for(const p of PRIV)y=wrap(x,'• '+LL(p),52,y,W-104,12,'#eaf6ff',19,'left')+10;btn(x,{x:W/2-80,y:560,w:160,h:46},L('닫기','关闭'),'Y',15);}
/* ---------- 돌리기 ---------- */
const SCR={loading:[drawLoading,tapLoading],home:[drawHome,tapHome],map:[drawMap,tapMap],upgrade:[drawUpgrade,tapUpgrade],dex:[drawDex,tapDex],reward:[drawReward,tapReward],story:[drawStory,tapStory],guide:[drawGuide,tapGuide]};
let drawErrN=0;
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;time+=dt;
  for(const p of INPUT.taps.splice(0)){if(tapAdLayer())continue;if(privOpen){privOpen=false;sfx('tap');continue;}try{if(scr==='battle')tapBattle(p);else SCR[scr][1](p);}catch(err){console.error(err);}}
  try{if(scr==='battle'){updateBattle(dt);drawBattle(dt);}else{if(scr!=='home'&&scr!=='reward'&&scr!=='upgrade')FX.length=0;SCR[scr][0](dt);if(scr==='upgrade')drawFx(g,dt);}if(privOpen){g.setTransform(K,0,0,K,0,0);drawPrivacy(g);}drawAdLayer(dt);}catch(err){console.error(err);if(!drawErrN++)track('draw_error',{scr,msg:(''+err.message).slice(0,60)});if(DEBUG)throw err;}
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
function onAppHide(){if(scr==='battle'&&G&&!ui.overlay&&G.state==='run')ui.overlay='pause';persist();if(AC)AC.suspend();track('app_hide',{scr});}
function onAppShow(){if(AC)AC.resume();last=performance.now();}
document.addEventListener('visibilitychange',()=>{document.hidden?onAppHide():onAppShow();});
try{if(API&&API.onHide)API.onHide(onAppHide);if(API&&API.onShow)API.onShow(onAppShow);}catch(e){}
window.__dbg={get tutT(){if(!ui.tut||ui.tut.i>=TUT.length)return null;const s=TUT[ui.tut.i];return {i:ui.tut.i,wait:!!ui.tut.wait,tg:s.tg?s.tg():null};},enter:enterBattle,get G(){return G;},get ui(){return ui;},set scr(v){scr=v;},set area(v){mapArea=v;},set tab(v){dexTab=v;},story:showStory,tap:(x,y)=>INPUT.taps.push({x,y}),SV:()=>SV,AREAS,PROLOGUE};
