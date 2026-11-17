/* ============================== 화면: 홈 · 지도 · 전투 · 카드 · 결과 ============================== */
const TITLE=['심해 신전 수비대','深海神殿守卫'];
const TW_TXT={
  coral: [['산호 궁수','珊瑚弓手'],['빠른 가시 연사 (물리)','快速连射尖刺（物理）'],['관통 가시','穿透尖刺'],t=>[`${TSKILL.coral(t).every}발마다 일직선의 적을 모두 꿰뚫어요`,`每${TSKILL.coral(t).every}发贯穿一整条直线的敌人`]],
  bubble:[['거품 구슬','泡泡宝珠'],['맞은 적을 느리게 (마력)','命中减速（魔力）'],['거품 감옥','泡泡牢笼'],t=>[`${TSKILL.bubble(t).cd.toFixed(1)}초마다 가장 센 적을 ${TSKILL.bubble(t).dur.toFixed(1)}초 가둬요 (받는 피해 +30%)`,`每${TSKILL.bubble(t).cd.toFixed(1)}秒困住最强敌人${TSKILL.bubble(t).dur.toFixed(1)}秒（受伤+30%）`]],
  jelly: [['해파리 등대','水母灯塔'],['번개가 여러 적에게 튀어요 · 투명한 적을 드러내요','闪电连锁多个敌人 · 显形隐身敌人'],['과충전','过载'],t=>[`범위 안 적 전부 감전 ${TSKILL.jelly(t).dmg} + 기절`,`范围内全部敌人电击 ${TSKILL.jelly(t).dmg} 并眩晕`]],
  conch: [['소라 대포','海螺炮'],['멀리 쏘는 범위 폭발','远程范围爆炸'],['소용돌이','漩涡'],t=>[`${TSKILL.conch(t).cd.toFixed(1)}초마다 떨어진 자리에 ${TSKILL.conch(t).dur.toFixed(1)}초 소용돌이`,`每${TSKILL.conch(t).cd.toFixed(1)}秒在落点生成${TSKILL.conch(t).dur.toFixed(1)}秒漩涡`]],
  rune:  [['룬 등불','符文灯'],['주변 수호탑 공격력 증폭 + 광선 · 투명한 적을 드러내요','增幅周围塔攻击 + 光束 · 显形隐身敌人'],['공명','共鸣'],t=>[`주변 수호탑 공격 속도 +40% (${TSKILL.rune(t).dur.toFixed(1)}초)`,`周围守护塔攻速 +40%（${TSKILL.rune(t).dur.toFixed(1)}秒）`]],
};
const EN_TXT={
  minnow:[['그림자 치어','暗影小鱼'],['떼 지어 가속: 4마리 넘게 뭉치면 +25% 빨라져요. 범위 공격으로 흩으세요','成群加速：聚集4只以上移速+25%，用范围攻击打散']],
  crab:[['철갑게','铁甲蟹'],['껍질 닫기: 체력이 절반이 되면 3초간 갑옷 +30%. 마력(해파리·룬·거품)이 잘 들어요','闭壳：生命过半后3秒护甲+30%。魔力（水母/符文/泡泡）有效']],
  eel:[['전기뱀장어','电鳗'],['돌진: 반쯤 다치면 번쩍 돌진해요. 거품으로 늦추세요','冲刺：受伤过半会猛冲，用泡泡减速']],
  ray:[['그림자가오리','暗影鳐鱼'],['그림자 숨기: 주기적으로 투명. 해파리 등대·룬 등불·가드 근처에서만 보여요','隐身：周期性隐形，只在水母灯塔/符文灯/卫士附近现形']],
  angler:[['등불아귀','灯笼鮟鱇'],['등불 치유: 주변 동료를 치료해요. 먼저 노리세요','灯光治疗：治疗周围同伴，优先击破']],
  squid:[['먹물오징어','墨汁乌贼'],['먹물: 수호탑을 가려 사거리·속도를 낮춰요. 탑을 눌러 닦으세요','喷墨：遮蔽守护塔降低射程和攻速，点击该塔擦掉']],
  horseshoe:[['투구게','鲎'],['분열: 쓰러지면 치어 3마리. 소라 대포로 한꺼번에','分裂：倒下生出3条小鱼，用海螺炮一网打尽']],
  turtle:[['바위거북','岩石龟'],['바위 껍질: 3초 안 맞으면 보호막 재생. 쉬지 말고 공격하거나 정화 룬으로','岩壳：3秒不挨打就恢复护盾。持续攻击或用净化符文']],
  elite:[['심연 대장게','深渊蟹将'],['지휘: 주변 적 속도 +18%. 지나가면 생명 -3','指挥：周围敌人移速+18%。漏过扣3生命']],
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
let scr='home',G=null,bgC=null,time=0,last=performance.now(),acc=0;
let ui={};
const AMB=[];for(let i=0;i<5;i++)AMB.push({x:Math.random()*W,y:120+Math.random()*560,v:(Math.random()<.5?-1:1)*(6+Math.random()*8),k:i<2?'shark':'fish',s:.8+Math.random()*.6});
const depthOf=i=>120+i*60+Math.floor(i/10)*400;

function enterBattle(si){
  G=new Game(si,{lv:SV.lv});bgC=renderBg(G.M);FX.length=0;acc=0;
  ui={combo:0,comboT:0,goldB:0,freeze:0,endT:0,clearW:0,sel:null,opt:null,overlay:'intro',speed:SV.opt.fast?2:1,shake:0,hurtT:0,tip:null,resultShown:false,newMech:[]};
  for(const m of['gate','cur','vent'])if((m==='gate'&&G.hasGate)||(m==='cur'&&G.hasCur)||(m==='vent'&&G.hasVent))if(!SV.seen[m])ui.newMech.push(m);
  if(si===0&&!SV.seen.hero)ui.newMech.push('hero');
  for(const k in CMD)if(CMD[k].from===si&&si>0)ui.newCmd=k;
  {const S=G.S;if(si>0&&!S.fresh&&!S.boss&&!ui.newMech.length&&!ui.newCmd&&!TOWER_IDS.some(k=>UNLOCK[k]===si))ui.overlay=null;}
  SV.sel=si;persist();scr='battle';musicMode='battle';
}
function dmgNum(X,Y,d,big){if(d<1)return;const v=Math.round(d),hv=v>=60||big;fx({k:'num',s:''+v,x:X+(Math.random()-.5)*10,y:Y-10,dx:(Math.random()-.5)*14,col:hv?'#ffe27a':'#fff',size:hv?15:v>=20?12:10,life:hv?.8:.6});}
function coins(X,Y,n){for(let i=0;i<n;i++)fx({k:'coin',x:X+(Math.random()-.5)*12,y:Y+(Math.random()-.5)*8,tx:100,ty:23,arc:(Math.random()-.5)*60,life:.5+Math.random()*.25,on:i?null:()=>{ui.goldB=1;sfx('coin');}});}
function showTip(s,dur){ui.tip={s,t:dur||4};}
/* ---------- 이벤트 → 효과·소리 ---------- */
function drain(){
  for(const e of G.ev){switch(e.t){
    case'kill':{const key=ENEMIES[e.k].art||e.k,im=IMG['en_'+key];if(im)fx({k:'die',im,w:ENEMIES[e.k].ew||EW[e.k],x:e.x,y:e.y,face:e.f||1,life:isBoss(e.k)?1.2:.45});}{const big=isBoss(e.k)||e.k==='elite';dmgNum(e.x,e.y,e.vd,false);burst(e.x,e.y,big?'#ff8ad8':'#d9b6ff',big?40:12,big?150:90,big?4:2.8,big?.8:.45);fx({k:'disc',x:e.x,y:e.y,r:big?70:22,col:'#fff',life:big?.4:.18});fx({k:'ring',x:e.x,y:e.y,r0:4,r:big?80:26,col:'rgba(230,190,255,.9)',w:big?5:2.5,life:big?.5:.25});
      coins(e.x,e.y,big?8:e.g>=9?3:e.g>=5?2:1);ui.combo++;ui.comboT=1.6;sfxKill(ui.combo);
      if(ui.combo%10===0)fx({k:'num',s:L(`${ui.combo} 연속!`,`${ui.combo} 连击！`),x:W/2,y:210,dx:0,col:'#ffd76a',size:22,life:1.1});
      if(big){ui.shake=isBoss(e.k)?.7:.3;ui.freeze=isBoss(e.k)?.18:.07;vib(isBoss(e.k)?120:40);if(isBoss(e.k))fx({k:'flash',col:'rgba(255,255,255,.5)',life:.35});}}break;
    case'leak':ui.hurtT=.5;ui.shake=.25;fx({k:'txt',s:'-'+e.n,x:TEMPLE.x,y:TEMPLE.y-60,col:'#ff6b8a',size:16,life:.9});sfx('leak');vib(30);break;
    case'build':burst(e.x,e.y,TCOL[e.k],14,70,2.5,.5);fx({k:'ring',x:e.x,y:e.y,r0:6,r:34,col:hexA(TCOL[e.k],.8),life:.4});sfx('build');break;
    case'awaken':burst(e.x,e.y-14,TCOL[e.k],30,120,3,.8);fx({k:'ring',x:e.x,y:e.y,r0:8,r:60,col:'rgba(255,226,122,.9)',w:5,life:.6});fx({k:'txt',s:L('각성!','觉醒！'),x:e.x,y:e.y-50,col:'#ffd76a',size:15,life:1.2});sfx('card');break;
    case'torp':fx({k:'ring',x:e.x,y:e.y,r0:6,r:e.r,col:'rgba(255,190,120,.95)',w:7,life:.45});burst(e.x,e.y,'#ffcf8a',30,160,3.5,.6);ui.shake=.4;sfx('boom');sfx('slam');vib(40);break;
    case'tide':fx({k:'flash',col:'rgba(120,220,255,.3)',life:.5});for(let i=0;i<5;i++)fx({k:'line',x:0,y:640-i*110,x2:W,y2:600-i*110,col:'rgba(180,240,255,.8)',w:8,life:.5+i*.08});ui.shake=.3;sfx('wave');sfx('vent');break;
    case'clamp':fx({k:'ring',x:e.x,y:e.y,r0:20,r:10,col:'rgba(200,210,230,.9)',life:.3});break;
    case'up':burst(e.x,e.y-12,'#ffe27a',18,80,2.5,.6);fx({k:'ring',x:e.x,y:e.y,r0:8,r:40,col:'rgba(255,226,122,.8)',life:.5});sfx('up');break;
    case'sell':burst(e.x,e.y,'#7ff',10,50,2,.4);sfx('sell');break;
    case'clean':burst(e.x,e.y-14,'#bdf',10,50,2,.4);sfx('clean');break;
    case'gate':fx({k:'ring',x:e.x,y:e.y,r0:6,r:36,col:'rgba(255,215,106,.9)',life:.5});sfx('gate');break;
    case'slam':G.hero.vS=1;fx({k:'ring',x:e.x,y:e.y,r0:10,r:e.r,col:'rgba(140,240,255,.9)',w:6,life:.45});burst(e.x,e.y,'#bff',24,140,3,.5);ui.shake=.35;sfx('slam');vib(40);break;
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
    case'boom':fx({k:'ring',x:e.x,y:e.y,r0:4,r:e.r,col:'rgba(255,210,170,.85)',w:4,life:.35});burst(e.x,e.y,'#ffd2aa',18,130,3,.45);fx({k:'disc',x:e.x,y:e.y,r:e.r,col:'#fff2dc',life:.22});ui.shake=Math.max(ui.shake,.14);sfx('boom');break;
    case'whirl':break;
    case'pop':burst(e.x,e.y,'#bff',6,60,2,.3);fx({k:'ring',x:e.x,y:e.y,r0:3,r:14,col:'rgba(190,250,255,.9)',w:2,life:.2});sfx('bub');break;
    case'hit':{const c=e.k==='spine'?'#ffb27a':e.k==='bolt'?'#aef6ff':'#fff';burst(e.x,e.y,c,3,70,1.8,.22);fx({k:'disc',x:e.x,y:e.y,r:9,col:c,life:.12});sfx('hit');}break;
    case'heal':fx({k:'ring',x:e.x,y:e.y,r0:8,r:e.r,col:'rgba(140,255,140,.6)',life:.5});break;
    case'ink':fx({k:'ink',x:e.x,y:e.y,tx:e.tx,ty:e.ty,life:.5});break;
    case'shell':fx({k:'ring',x:e.x,y:e.y,r0:6,r:22,col:'rgba(120,200,255,.8)',life:.4});break;
    case'dash':burst(e.x,e.y,'#fff27a',8,60,2,.3);break;
    case'hlv':fx({k:'txt',s:'LEVEL UP!',x:e.x,y:e.y-34,col:'#ffd76a',size:12,life:1});sfx('up');break;
    case'roar':ui.shake=.6;sfx('roar');fx({k:'flash',col:'rgba(160,40,200,.25)',life:.4});
      if(e.m)showTip({shield:L('보스가 보호막을 둘렀어요! 정화 룬이 잘 들어요','首领生成了护盾！净化符文很有效'),haste:L('모든 적이 빨라졌어요! 거품과 해일로 늦추세요','全体敌人加速了！用泡泡和海啸减速'),cloak:L('보스가 모습을 감췄어요! 해파리 등대·룬 등불·가드 근처에서만 보여요','首领隐身了！只在水母灯塔/符文灯/卫士附近现形'),heal:L('심연이 모든 적을 치유했어요!','深渊治愈了全体敌人！')}[e.m],3.5);break;
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
    const win=G.state==='win',st=G.stars(),first=win&&!SV.stars[G.si],c=stageCoins(G.si,st),fb=first?firstBonus(G.si):0;ui.reward={c,fb};SV.coins+=c+fb;
    mission('kill',G.kills);mission('awaken',G.awakened);mission('cmd',G.cmdUsed);mission('card',G.cardsPicked);if(win){mission('win',1);mission('star',st);SV.stars[G.si]=Math.max(SV.stars[G.si],st);}persist();}
  if(G.si===0&&G.wave>=2&&!SV.seen.hero2){SV.seen.hero2=1;persist();showTip(LL(MECH_TIP.hero),5);}
}
/* ---------- 버튼 배치 ---------- */
function buildBtns(s){const out=[];TOWER_IDS.forEach((k,i)=>{const a=-Math.PI/2+i*Math.PI*2/5;let x=s.x+Math.cos(a)*56,y=s.y+Math.sin(a)*52;x=Math.max(24,Math.min(W-24,x));y=Math.max(72,Math.min(728,y));out.push({k,x,y});});return out;}
function towerBtns(t){const cx=Math.max(64,Math.min(W-64,t.x)),y=Math.max(84,t.y-58);return t.lv===MAX_TLV-1?[{k:'br0',x:cx-46,y},{k:'br1',x:cx,y:y-8},{k:'sell',x:cx+46,y}]:[{k:'up',x:cx-30,y},{k:'sell',x:cx+30,y}];}
const BAR={slam:{x:30,y:772,r:22},torpedo:{x:79,y:772,r:22},tide:{x:128,y:772,r:22},hero:{x:173,y:772,r:17},key:{x:211,y:772,r:15},wave:{x:234,y:752,w:140,h:40},speed:{x:416,y:772,r:20},pause:{x:424,y:23,r:16}};
const hitC=(p,b,pad)=>Math.hypot(p.x-b.x,p.y-b.y)<b.r+(pad||4);
const hitR=(p,b)=>p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h;
/* ---------- 전투 터치 ---------- */
function tapBattle(p){
  if(ui.overlay)return tapOverlay(p);
  if(hitC(p,BAR.pause,8)){ui.overlay='pause';sfx('tap');return;}
  if(ui.aim){const k=ui.aim;ui.aim=null;if(p.y<740){G.cmd(k,p.x,p.y);return;}}
  if(p.y>740){
    for(const k in CMD)if(hitC(p,BAR[k],1)){if(G.si<CMD[k].from){showTip(L(`${CMD[k].from}판을 깨면 열려요`,`通关第${CMD[k].from}关后解锁`),2);return;}
      if(!G.cmdReady(k)){sfx('tap');return;}if(k==='torpedo'){ui.aim=k;ui.sel=null;showTip(L('어뢰를 떨어뜨릴 곳을 누르세요','点击鱼雷落点'),2.5);sfx('tap');}else{G.cmd(k);ui.sel=null;}return;}
    if(hitC(p,BAR.hero)){ui.sel={type:'hero'};sfx('tap');return;}
    if(hitR(p,BAR.wave)){if(G.callWave())ui.sel=null;return;}
    if(hitC(p,BAR.speed)){ui.speed=ui.speed===1?2:1;SV.opt.fast=ui.speed===2?1:0;persist();sfx('tap');return;}
    return;
  }
  const sel=ui.sel;
  if(sel&&sel.type==='spot'){for(const b of buildBtns(G.M.spots[sel.i]))if(hitC(p,{x:b.x,y:b.y,r:21})){
      if(!G.unlocked(b.k)){showTip(L(`${UNLOCK[b.k]}판을 깨면 열려요`,`通关第${UNLOCK[b.k]}关后解锁`),2);return;}
      if(ui.opt===b.k){if(G.build(sel.i,b.k)){ui.sel=null;ui.opt=null;}else{showTip(L('진주가 부족해요','珍珠不足'),1.5);sfx('tap');}}else{ui.opt=b.k;sfx('tap');}return;}}
  if(sel&&sel.type==='tower'){for(const b of towerBtns(sel.t))if(hitC(p,{x:b.x,y:b.y,r:22})){const t=sel.t;
      if(b.k==='sell'){G.sell(t);ui.sel=null;}
      else if(b.k==='up'){if(!G.upgrade(t)&&t.lv<MAX_TLV){showTip(L('진주가 부족해요','珍珠不足'),1.5);sfx('tap');}}
      else{const bi=+b.k.slice(2);if(ui.opt!==b.k){ui.opt=b.k;sfx('tap');}else if(G.upgrade(t,bi)){ui.opt=null;}else{showTip(L('진주가 부족해요','珍珠不足'),1.5);sfx('tap');}}
      return;}}
  if(sel&&sel.type==='hero'){const h=G.hero;if(Math.hypot(p.x-h.x,p.y-h.y)>20){G.moveHero(p.x,p.y);fx({k:'ring',x:p.x,y:p.y,r0:14,r:4,col:'rgba(120,255,220,.9)',life:.35});ui.sel=null;sfx('tap');SV.seen.hero=1;persist();return;}}
  ui.opt=null;
  if(Math.hypot(p.x-G.hero.x,p.y-G.hero.y+6)<22){ui.sel={type:'hero'};sfx('tap');return;}
  for(const t of G.towers)if(Math.hypot(p.x-t.x,p.y-t.y+10)<24){if(G.clean(t))return;ui.sel={type:'tower',t};sfx('tap');return;}
  for(const k in G.M.gates){const gt=G.M.gates[k];if(Math.hypot(p.x-gt.x,p.y-gt.y)<24){if(!G.flipGate(k))showTip(L('🔑 수문 열쇠가 없어요 (2웨이브마다 1개)','🔑 没有水闸钥匙（每2波获得1把）'),2);ui.sel=null;return;}}
  for(let i=0;i<G.M.spots.length;i++){const s=G.M.spots[i];if(Math.hypot(p.x-s.x,p.y-s.y)<26&&!G.towers.some(t=>t.spot===i)){ui.sel={type:'spot',i};ui.opt=null;sfx('tap');return;}}
  ui.sel=null;
}
function overlayBtns(){
  const o=ui.overlay;
  if(o==='intro')return [{id:'go',x:W/2-90,y:640,w:180,h:48}];
  if(o==='cards')return G.cards.map((c,i)=>({id:'card'+i,x:40,y:330+i*112,w:370,h:96}));
  if(o==='pause')return [{id:'resume',x:W/2-110,y:250,w:220,h:46},{id:'retry',x:W/2-110,y:306,w:220,h:46},{id:'map',x:W/2-110,y:362,w:220,h:46},
    {id:'sfx',x:W/2-110,y:430,w:106,h:40},{id:'bgm',x:W/2+4,y:430,w:106,h:40},{id:'lang',x:W/2-110,y:478,w:220,h:40}];
  if(o==='result'){const b=[{id:'retry',x:W/2-150,y:520,w:140,h:48},{id:'map',x:W/2+10,y:520,w:140,h:48}];if(G.state==='win'&&G.si<OPEN_N-1)b.push({id:'next',x:W/2-110,y:580,w:220,h:52});return b;}
  return [];
}
function tapOverlay(p){
  for(const b of overlayBtns())if(hitR(p,b)){sfx('tap');const id=b.id;
    if(id==='go'){ui.overlay=null;for(const m of ui.newMech)SV.seen[m]=1;persist();}
    else if(id.startsWith('card')){G.pickCard(+id.slice(4));ui.overlay=null;sfx('card');}
    else if(id==='resume')ui.overlay=null;
    else if(id==='retry')enterBattle(G.si);
    else if(id==='next')tryEnter(G.si+1);
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
  if(IMG.islet){const w=68,h=w*IMG.islet.height/IMG.islet.width;M.spots.forEach((s,i)=>x.drawImage(IMG.islet,s.x-w/2,s.y-h*.36+islBob(i,time),w,h));}
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
  if(sel&&sel.type==='tower'){x.fillStyle=hexA(TCOL[sel.t.k],.1);x.strokeStyle=hexA(TCOL[sel.t.k],.6);x.lineWidth=1.5;x.beginPath();x.arc(sel.t.x,sel.t.y,G.range(sel.t),0,7);x.fill();x.stroke();}
  if(sel&&sel.type==='spot'&&ui.opt){const s=M.spots[sel.i],r=TOWERS[ui.opt].range;x.fillStyle=hexA(TCOL[ui.opt],.1);x.strokeStyle=hexA(TCOL[ui.opt],.6);x.lineWidth=1.5;x.beginPath();x.arc(s.x,s.y,r,0,7);x.fill();x.stroke();}
  /* 소용돌이 */
  for(const z of G.zones){x.save();x.translate(z.x,z.y);x.globalAlpha=Math.min(1,z.t*2);for(let i=0;i<3;i++){x.rotate(time*4);x.strokeStyle=`rgba(150,220,255,${.5-i*.12})`;x.lineWidth=3;x.beginPath();x.arc(0,0,z.r*(1-i*.28),0,4.2);x.stroke();}x.restore();}
  drawTemple(x,time,ui.hurtT);
  /* 탑·적·영웅을 아래쪽이 앞에 오게 */
  const ents=[...G.towers.map(t=>({y:t.y,f:()=>drawTower(x,t,time,sel&&sel.t===t)})),...G.enemies.map(e=>({y:e.y,f:()=>drawEnemy(x,e,time)})),{y:G.hero.y+2,f:()=>drawHero(x,G.hero,time,sel&&sel.type==='hero')}];
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
  drawFx(x,dt);
  if(ui.hurtT>0){const gr=x.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.7);gr.addColorStop(0,'rgba(255,0,60,0)');gr.addColorStop(1,`rgba(255,0,60,${ui.hurtT*.5})`);x.fillStyle=gr;x.fillRect(0,0,W,H);}
  drawRays(x,1);
  x.setTransform(K,0,0,K,0,0);
  drawHud(x);
  if(sel&&sel.type==='spot')drawBuildMenu(x,sel.i);
  if(sel&&sel.type==='tower')drawTowerMenu(x,sel.t);
  drawHints(x);
  if(ui.tip){x.globalAlpha=Math.min(1,ui.tip.t*2);rr(x,24,92,W-48,46,12);x.fillStyle='rgba(8,24,36,.88)';x.fill();x.strokeStyle='rgba(120,240,255,.5)';x.lineWidth=1.5;x.stroke();wrap(x,ui.tip.s,W/2,108,W-70,12,'#e8fbff',16);x.globalAlpha=1;}
  if(ui.overlay)drawOverlay(x);
}
function chip(x,X,Y,ic,col){x.fillStyle=col;x.beginPath();x.arc(X,Y,10,0,7);x.fill();x.strokeStyle='#06090d';x.lineWidth=2;x.stroke();txt(x,ic,X,Y+1,11,'#fff');}
function drawHud(x){
  let gr;x.fillStyle='#0d222c';x.fillRect(0,0,W,44);x.fillStyle='#06090d';x.fillRect(0,44,W,3);
  glow(x,22,23,14,'rgba(255,120,170,.6)');txt(x,'♥',22,23,18,'#ff7aa8');txt(x,''+G.lives,48,23,16,'#fff','left','rgba(0,0,0,.6)');
  x.fillStyle='#7ff';x.beginPath();x.moveTo(98,15);x.lineTo(105,23);x.lineTo(98,31);x.lineTo(91,23);x.closePath();x.fill();txt(x,''+G.gold,112,23,16+Math.max(0,ui.goldB)*5,ui.goldB>0?'#fff':'#e6ffff','left','rgba(0,0,0,.6)');
  if(ui.combo>=3){const cp=Math.min(1,ui.comboT/.4);x.globalAlpha=cp;txt(x,'×'+ui.combo,W-34,84,18+Math.min(10,ui.combo*.3),ui.combo>=20?'#ff9ad8':ui.combo>=10?'#ffd76a':'#bff','center','rgba(0,0,0,.7)',900);txt(x,L('연속','连击'),W-34,104,9,'#cde');x.globalAlpha=1;}
  txt(x,L(`웨이브 ${G.wave}/${G.S.waves}`,`第 ${G.wave}/${G.S.waves} 波`),262,17,13,'#fff');txt(x,`${G.si+1}. ${LL(G.M.name)}`,262,33,10,'#9fd');
  x.fillStyle='rgba(255,255,255,.15)';x.beginPath();x.arc(BAR.pause.x,BAR.pause.y,BAR.pause.r,0,7);x.fill();x.fillStyle='#fff';x.fillRect(418,16,4,14);x.fillRect(426,16,4,14);
  let cx=16;for(const m of G.mutList){chip(x,cx,58,MUTS[m].ic,'rgba(110,40,150,.85)');cx+=22;}
  if(G.mutList.length)cx+=6;for(const b of G.blessList){chip(x,cx,58,BLESS[b].ic,'rgba(150,110,20,.85)');cx+=22;}
  /* 아래 막대 */
  x.fillStyle='#0d222c';x.fillRect(0,742,W,58);x.fillStyle='#06090d';x.fillRect(0,739,W,3);
  const h=G.hero;
  for(const k in CMD){const B=BAR[k],C=CMD[k],lock=G.si<C.from,cd=G.cmdCd[k],cdF=cd>0?cd/(C.cd*G.B.heroCd):0,rdy=!lock&&cdF<=0,aim=ui.aim===k;
    x.fillStyle=lock?'#1a2228':rdy?(aim?'#a06a10':'#1d5a6a'):'#24343e';x.beginPath();x.arc(B.x,B.y,B.r,0,7);x.fill();x.strokeStyle=lock?'#345':rdy?(aim?'#ffd76a':'#8ff'):'#567';x.lineWidth=2.5;x.stroke();
    if(cdF>0){x.fillStyle='rgba(0,0,0,.55)';x.beginPath();x.moveTo(B.x,B.y);x.arc(B.x,B.y,B.r,-Math.PI/2,-Math.PI/2+cdF*Math.PI*2);x.closePath();x.fill();}
    if(rdy&&G.state==='run')glow(x,B.x,B.y,B.r+8,'rgba(120,240,255,.35)',.5+.3*Math.sin(time*4));
    txt(x,lock?'🔒':C.ic,B.x,B.y-2,lock?13:17,'#fff');txt(x,lock?L(`${C.from}판`,`第${C.from}关`):cdF>0?Math.ceil(cd)+'s':LL(C.n).slice(0,LANG==='zh'?2:2),B.x,B.y+15,8,'#cff','center','rgba(0,0,0,.8)');}
  const HB=BAR.hero;x.fillStyle=ui.sel&&ui.sel.type==='hero'?'#2a7a8a':'#22404a';x.beginPath();x.arc(HB.x,HB.y,HB.r,0,7);x.fill();x.strokeStyle='#e8c45a';x.lineWidth=2;x.stroke();
  x.save();x.beginPath();x.arc(HB.x,HB.y,HB.r-2,0,7);x.clip();drawHero(x,{x:HB.x,y:HB.y+8,face:1,lv:h.lv,atk:0,moving:false},0,false);x.restore();
  if(G.hasGate){const KB=BAR.key;x.fillStyle='#2c2a1a';x.beginPath();x.arc(KB.x,KB.y,KB.r,0,7);x.fill();x.strokeStyle='#e8c45a';x.lineWidth=2;x.stroke();txt(x,'🔑',KB.x,KB.y-3,11,'#fff');txt(x,`${G.keys}/${G.keyMax}`,KB.x,KB.y+9,8,'#ffe9a8');}
  const WB=BAR.wave;let lab,act=false;
  if(G.state==='prep'){lab=L('▶ 첫 웨이브','▶ 开始第一波');act=true;}
  else if(G.wave>=G.S.waves)lab=L('마지막 웨이브','最后一波');
  else if(G.spawning)lab=L('몰려오는 중…','敌人来袭中…');
  else{lab=L(`▶ 다음 +${Math.ceil(G.nextT)*EARLY_BONUS}`,`▶ 下一波 +${Math.ceil(G.nextT)*EARLY_BONUS}`);act=true;}
  const pl=act?.5+.5*Math.sin(time*5):0;rr(x,WB.x,WB.y,WB.w,WB.h,14);gr=x.createLinearGradient(0,WB.y,0,WB.y+WB.h);gr.addColorStop(0,act?'#3fd0c0':'#2a3a44');gr.addColorStop(1,act?'#1a7a8a':'#1a262e');x.fillStyle=gr;x.fill();
  x.strokeStyle=act?`rgba(200,255,250,${.5+.5*pl})`:'#456';x.lineWidth=2;x.stroke();txt(x,lab,WB.x+WB.w/2,WB.y+WB.h/2+1,13,'#fff','center','rgba(0,0,0,.4)');
  if(act&&G.state!=='prep'&&G.nextT>0){x.fillStyle='rgba(255,255,255,.35)';x.fillRect(WB.x+10,WB.y+WB.h-5,(WB.w-20)*(G.nextT/WAVE_GAP),2);}
  const SB=BAR.speed;x.fillStyle=ui.speed===2?'#a06a10':'#22404a';x.beginPath();x.arc(SB.x,SB.y,SB.r,0,7);x.fill();x.strokeStyle='#e8c45a';x.lineWidth=2;x.stroke();txt(x,ui.speed===2?'▶▶':'▶',SB.x,SB.y,ui.speed===2?11:13,'#fff');
}
function infoPanel(x,lines,anchorY){const h=18+lines.length*17,y=anchorY>520?60:H-66-h;rr(x,16,y,W-32,h,10);x.fillStyle='rgba(16,42,54,.97)';x.fill();x.strokeStyle='#06090d';x.lineWidth=3;x.stroke();
  lines.forEach((l,i)=>txt(x,l[0],28,y+17+i*17,l[2]||11,l[1]||'#e8fbff','left',null,i===0?900:700));}
function drawBuildMenu(x,i){
  const s=G.M.spots[i];
  for(const b of buildBtns(s)){const lock=!G.unlocked(b.k),c=G.cost(b.k),can=!lock&&G.gold>=c,on=ui.opt===b.k;
    x.fillStyle=on?'rgba(30,70,80,.98)':'rgba(10,24,32,.92)';x.beginPath();x.arc(b.x,b.y,on?24:21,0,7);x.fill();x.strokeStyle=lock?'#455':on?'#fff':TCOL[b.k];x.lineWidth=on?3:2;x.stroke();
    if(lock){txt(x,'🔒',b.x,b.y-2,14,'#fff');txt(x,L(`${UNLOCK[b.k]}판`,`第${UNLOCK[b.k]}关`),b.x,b.y+14,8,'#9ab');continue;}
    x.save();x.beginPath();x.arc(b.x,b.y,20,0,7);x.clip();towerIcon(x,b.k,b.x,b.y+4,.62);x.restore();
    rr(x,b.x-17,b.y+13,34,13,6);x.fillStyle='rgba(0,0,0,.75)';x.fill();txt(x,''+c,b.x,b.y+20,9,can?'#7ff':'#ff7a8a');
    if(on){x.strokeStyle=`rgba(255,255,255,${.5+.5*Math.sin(time*8)})`;x.lineWidth=2;x.beginPath();x.arc(b.x,b.y,28,0,7);x.stroke();}}
  if(ui.opt){const T=TW_TXT[ui.opt],tier=G.tier();infoPanel(x,[[LL(T[0])+L('   — 한 번 더 누르면 건설','   — 再点一次建造'),TCOL[ui.opt],14],[LL(T[1])],[`✦ ${LL(T[2])} Lv${tier}: ${LL(T[3](tier))}`,'#ffe9a8']],s.y);}
}
function drawTowerMenu(x,t){
  for(const b of towerBtns(t)){const on=ui.opt===b.k;x.fillStyle=on?'rgba(60,50,10,.98)':'rgba(10,24,32,.94)';x.beginPath();x.arc(b.x,b.y,on?25:22,0,7);x.fill();const c=G.upCost(t),can=G.gold>=c;
    if(b.k==='up'){const max=t.lv>=MAX_TLV;x.strokeStyle=max?'#e8c45a':can?'#7f7':'#a55';x.lineWidth=2.5;x.stroke();txt(x,max?'MAX':'⬆',b.x,b.y-4,max?11:16,max?'#ffd76a':'#fff');if(!max)txt(x,''+c,b.x,b.y+11,9,can?'#7ff':'#ff7a8a');}
    else if(b.k==='sell'){x.strokeStyle='#e8c45a';x.lineWidth=2;x.stroke();txt(x,'💎',b.x,b.y-4,12,'#fff');txt(x,'+'+G.sellVal(t),b.x,b.y+11,9,'#ffe9a8');}
    else{const j=+b.k.slice(2),B=BRANCH[t.k][j];x.strokeStyle=on?'#fff':j?'#ffc9a8':'#a8e8ff';x.lineWidth=on?3:2.5;x.stroke();txt(x,j?'B':'A',b.x,b.y-9,10,j?'#ffc9a8':'#a8e8ff');txt(x,LL(B.n).slice(0,LANG==='zh'?4:5),b.x,b.y+2,8,'#fff');txt(x,''+c,b.x,b.y+13,9,can?'#7ff':'#ff7a8a');}}
  const T=TW_TXT[t.k],tier=G.tier(),dm=G.dmg(t),brI=ui.opt&&ui.opt.startsWith('br')?+ui.opt.slice(2):-1,cur=t.br?BRANCH[t.k].find(b=>b.id===t.br):null;
  if(brI>=0&&t.lv===MAX_TLV-1){const B=BRANCH[t.k][brI];infoPanel(x,[[`${L('각성','觉醒')} ${brI?'B':'A'} · ${LL(B.n)}`+L('   — 한 번 더 누르면 각성','   — 再点一次觉醒'),'#ffd76a',14],[LL(B.d)],[L('공격력도 함께 크게 올라요 (되돌릴 수 없어요)','攻击力也会大幅提升（不可撤销）'),'#9cc']],t.y);return;}
  infoPanel(x,[[`${LL(T[0])}  Lv${t.lv}`+(cur?` · ${LL(cur.n)}`:''),TCOL[t.k],14],[L(`공격 ${dm.toFixed(1)} · 사거리 ${Math.round(G.range(t))} · 간격 ${G.rate(t).toFixed(2)}초`,`攻击 ${dm.toFixed(1)} · 射程 ${Math.round(G.range(t))} · 间隔 ${G.rate(t).toFixed(2)}秒`)],
    [`✦ ${LL(T[2])} Lv${tier}: ${LL(T[3](tier))}`,'#ffe9a8'],cur?[LL(cur.d),'#ffd76a']:t.lv===MAX_TLV-1?[L('다음 강화는 각성: A·B 중 하나를 골라요','下次升级为觉醒：从A/B中选择'),'#ffd76a']:t.aura>0?[L(`룬 증폭 +${Math.round(t.aura*100)}%`,`符文增幅 +${Math.round(t.aura*100)}%`),'#d6b0ff']:[LL(T[1]),'#9cc']],t.y);
}
function arrowHint(x,X,Y,s){const b=Math.sin(time*6)*5;x.fillStyle='#ffe27a';x.beginPath();x.moveTo(X,Y-6+b);x.lineTo(X-9,Y-20+b);x.lineTo(X+9,Y-20+b);x.closePath();x.fill();txt(x,s,X,Y-32+b,12,'#fff','center','rgba(0,0,0,.85)');}
function drawHints(x){
  if(ui.overlay||G.si!==0)return;
  if(!G.towers.length&&!(ui.sel&&ui.sel.type==='spot')){const s=G.M.spots[0];arrowHint(x,s.x,s.y-12,L('룬 자리를 눌러 수호탑 세우기','点击符文位建造守护塔'));}
  else if(G.state==='prep'&&G.towers.length&&!ui.sel)arrowHint(x,BAR.wave.x+BAR.wave.w/2,BAR.wave.y-2,L('준비되면 시작!','准备好就开始！'));
}
/* ---------- 겹쳐 뜨는 창 ---------- */
function panel(x,X,Y,w,h){rr(x,X,Y+5,w,h,14);x.fillStyle='rgba(0,0,0,.45)';x.fill();rr(x,X,Y,w,h,14);x.fillStyle='#14323f';x.fill();x.strokeStyle='#06090d';x.lineWidth=3.5;x.stroke();rr(x,X+4,Y+4,w-8,h-8,10);x.strokeStyle='rgba(120,220,230,.22)';x.lineWidth=1.5;x.stroke();}
const BTN_MAP={'#3fd0c0':'#25c2ae','#3a8a9a':'#2f7f96','#2a6a7a':'#2a6478','#6a8a9a':'#55788c','#d0a030':'#f0b429','#555':'#4a5560','#345':'#33424e','#444':'#3c4650','#a06a10':'#c98a1a'};
function shade(c,f){const n=parseInt(c.slice(1),16);return `rgb(${Math.round((n>>16)*f)},${Math.round(((n>>8)&255)*f)},${Math.round((n&255)*f)})`;}
function btn(x,b,label,col,size){const c=BTN_MAP[col||'#3fd0c0']||'#25c2ae';rr(x,b.x,b.y+4,b.w,b.h,11);x.fillStyle='#06090d';x.fill();rr(x,b.x,b.y+3,b.w,b.h,11);x.fillStyle=shade(c,.6);x.fill();rr(x,b.x,b.y,b.w,b.h-2,11);x.fillStyle=c;x.fill();
  x.save();rr(x,b.x,b.y,b.w,b.h-2,11);x.clip();x.fillStyle='rgba(255,255,255,.16)';x.fillRect(b.x,b.y,b.w,(b.h-2)*.45);x.restore();rr(x,b.x,b.y,b.w,b.h+1,11);x.strokeStyle='#06090d';x.lineWidth=3;x.stroke();txt(x,label,b.x+b.w/2,b.y+b.h/2,size||15,'#fff','center','#06090d',900);}
function drawOverlay(x){
  x.fillStyle='rgba(0,8,16,.6)';x.fillRect(0,0,W,H);const o=ui.overlay,B=overlayBtns();
  if(o==='intro'){const S=G.S;panel(x,24,90,W-48,610);
    txt(x,`${LL(AREAS[S.area].n)} · ${G.si+1}`,W/2,120,12,'#9fd');txt(x,LL(G.M.name),W/2,148,24,'#fff','center','rgba(0,0,0,.5)');txt(x,L(`수심 ${depthOf(G.si)}m · 웨이브 ${S.waves}`,`水深 ${depthOf(G.si)}米 · ${S.waves} 波`),W/2,176,12,'#bfe');
    let y=206;
    const sec=(t,c)=>{x.fillStyle='rgba(255,255,255,.08)';x.fillRect(44,y,W-88,1);y+=16;txt(x,t,46,y,13,c,'left');y+=20;};
    sec(L('⚔ 이번 판의 양쪽 힘','⚔ 本关双方实力'),'#ffe9a8');
    {const my=avgLv(),low=my<S.rec-.5;txt(x,L(`권장 숙련 Lv${S.rec} · 내 평균 Lv${my.toFixed(1)}`,`推荐熟练 Lv${S.rec} · 我的平均 Lv${my.toFixed(1)}`)+(low?L('  ⚠ 강화 추천','  ⚠ 建议强化'):''),56,y,12,low?'#ffb080':'#bff','left');y+=18;}
    txt(x,L(`수호탑 스킬 Lv${S.sTier}`,`守护塔技能 Lv${S.sTier}`),56,y,12,'#bff','left');y+=18;
    txt(x,L(`심연 적 체력 ×${S.hp.toFixed(2)}`,`深渊敌人生命 ×${S.hp.toFixed(2)}`),56,y,12,'#f9c','left');y+=18;
    if(G.mutList.length){for(const m of G.mutList){txt(x,MUTS[m].ic+' '+LL(MUTS[m].n),56,y,11,'#e0b0ff','left');y+=16;}}
    else{txt(x,L('심연 변이 없음 (3웨이브마다 하나씩 생겨요)','暂无深渊变异（每3波出现一个）'),56,y,11,'#a8c','left');y+=16;}
    if(S.boss){sec(L('👑 구역 보스','👑 区域首领'),'#ffb0f0');txt(x,LL(EN_TXT[S.boss][0]),56,y,13,'#fff','left');y=wrap(x,LL(EN_TXT[S.boss][1]),56,y+18,W-110,11,'#e8c8f0',15,'left');y+=4;}
    if(ui.newCmd){const C=CMD[ui.newCmd];sec(L('🆕 새 지휘 스킬','🆕 新指挥技能'),'#ffe9a8');txt(x,C.ic+' '+LL(C.n),56,y,13,'#bff','left');y=wrap(x,LL(C.d),56,y+18,W-110,11,'#cde',15,'left');y+=4;}
    if(S.fresh){sec(L('🆕 새로운 적','🆕 新敌人'),'#ffe9a8');const e={k:S.fresh,x:72,y:y+14,a:0,r:ENEMIES[S.fresh].r,hp:1,mhp:1,shield:0,id:1,spawnT:0,inv:false,slow:0,slowT:0,stun:0,trap:0,lift:0,hitT:0};
      drawEnemy(x,e,time);txt(x,LL(EN_TXT[S.fresh][0]),100,y+4,13,'#fff','left');y=wrap(x,LL(EN_TXT[S.fresh][1]),100,y+22,W-150,11,'#cde',15,'left');y+=6;}
    const nt=TOWER_IDS.find(k=>UNLOCK[k]===G.si&&G.si>0);
    if(nt){sec(L('🆕 새 수호탑','🆕 新守护塔'),'#ffe9a8');towerIcon(x,nt,72,y+10,.8);txt(x,LL(TW_TXT[nt][0]),100,y,13,TCOL[nt],'left');y=wrap(x,LL(TW_TXT[nt][1]),100,y+18,W-150,11,'#cde',15,'left');y+=6;}
    if(ui.newMech.length){sec(L('💡 이 지도의 장치','💡 本地图机关'),'#ffe9a8');for(const m of ui.newMech){y=wrap(x,LL(MECH_TIP[m]),48,y,W-96,11,'#dff',15,'left');y+=4;}}
    else if(G.si>0){sec(L('💡 요령','💡 提示'),'#ffe9a8');y=wrap(x,L('3웨이브마다 축복 카드를 고르고, 그때 심연도 변이해요. 변이에 맞춰 카드를 고르세요','每3波可选一张祝福卡，同时深渊也会变异。根据变异来选卡吧'),48,y,W-96,11,'#dff',15,'left');}
    btn(x,B[0],L('출격 준비','准备出击'));return;}
  if(o==='cards'){panel(x,24,120,W-48,600);if(G.pendMut)txt(x,L('심연이 꿈틀거려요…','深渊在蠢动……'),W/2,150,18,'#e0b0ff','center','rgba(0,0,0,.5)');
    const m=MUTS[G.pendMut];if(m){rr(x,44,172,W-88,58,12);x.fillStyle='rgba(90,30,130,.6)';x.fill();x.strokeStyle='#b070ff';x.lineWidth=1.5;x.stroke();
    txt(x,L('이번 변이','本次变异'),62,190,10,'#d8b0ff','left');txt(x,m.ic+' '+LL(m.n),62,212,13,'#fff','left');}else{txt(x,L('신전의 축복','神殿的祝福'),W/2,200,22,'#ffe9a8','center','rgba(0,0,0,.5)');}
    txt(x,L('맞설 축복을 하나 고르세요','选择一张祝福来应对'),W/2,284,15,'#ffe9a8','center','rgba(0,0,0,.5)');txt(x,L(`수호탑 스킬 Lv${G.tier()}`,`守护塔技能 Lv${G.tier()}`),W/2,306,10,'#9fd');
    G.cards.forEach((c,i)=>{const b=B[i],p=.5+.5*Math.sin(time*3+i);rr(x,b.x,b.y,b.w,b.h,14);const gr=x.createLinearGradient(b.x,0,b.x+b.w,0);gr.addColorStop(0,'rgba(80,60,10,.95)');gr.addColorStop(1,'rgba(30,24,8,.95)');x.fillStyle=gr;x.fill();
      x.strokeStyle=`rgba(255,215,106,${.6+.4*p})`;x.lineWidth=2;x.stroke();x.fillStyle='rgba(255,215,106,.15)';x.beginPath();x.arc(b.x+48,b.y+b.h/2,30,0,7);x.fill();txt(x,BLESS[c].ic,b.x+48,b.y+b.h/2+1,28,'#fff');
      wrap(x,LL(BLESS[c].n),b.x+92,b.y+b.h/2-(LL(BLESS[c].n).length>22?8:0),b.w-108,14,'#fff6dc',18,'left');});return;}
  if(o==='pause'){panel(x,40,180,W-80,420);txt(x,L('일시정지','暂停'),W/2,214,20,'#fff');
    btn(x,B[0],L('계속하기','继续'));btn(x,B[1],L('다시 하기','重新开始'),'#6a8a9a');btn(x,B[2],L('지도로','返回地图'),'#6a8a9a');
    btn(x,B[3],L('효과음 ','音效 ')+(SV.opt.sfx?'ON':'OFF'),SV.opt.sfx?'#3fd0c0':'#555',12);btn(x,B[4],L('음악 ','音乐 ')+(SV.opt.bgm?'ON':'OFF'),SV.opt.bgm?'#3fd0c0':'#555',12);btn(x,B[5],L('언어: 한국어 → 中文','语言：中文 → 한국어'),'#6a8a9a',12);
    let y=540;const all=[...G.mutList.map(m=>[MUTS[m],'#e0b0ff']),...G.blessList.map(b=>[BLESS[b],'#ffe9a8'])];if(all.length){txt(x,L('변이·축복','变异·祝福'),W/2,y,11,'#9fd');y+=16;for(const [o2,c] of all.slice(-3)){txt(x,o2.ic+' '+LL(o2.n),W/2,y,10,c);y+=14;}}
    return;}
  if(o==='result'){const win=G.state==='win';panel(x,40,220,W-80,win&&G.si<STAGE_N-1?430:370);
    txt(x,win?L('신전을 지켰어요!','守住神殿了！'):L('신전이 함락됐어요','神殿失守了'),W/2,262,24,win?'#bfffe8':'#ffb0c8','center','rgba(0,0,0,.5)');
    const S2=G.S,rw=ui.reward||{c:0,fb:0};txt(x,`◆ +${rw.c}`+(rw.fb?L(`  (첫 클리어 +${rw.fb})`,`（首通 +${rw.fb}）`):''),W/2,win?468:420,15,'#ffe27a','center','rgba(0,0,0,.5)');
    if(win){const st=G.stars();for(let i=0;i<3;i++){const on=i<st;txt(x,'★',W/2-56+i*56,320,44,on?'#ffd76a':'#345','center',on?'#a06a10':null);}
      txt(x,L(`남은 생명 ${G.lives} · 처치 ${G.kills}`,`剩余生命 ${G.lives} · 击退 ${G.kills}`),W/2,368,12,'#cde');
      if(S2.boss)wrap(x,LL(AREAS[S2.area].end),W/2,392,W-120,10.5,'#ffe9a8',14);
      else if(G.si<STAGE_N-1)txt(x,L(`다음: 수심 ${depthOf(G.si+1)}m`,`下一关：水深 ${depthOf(G.si+1)}米`),W/2,396,12,'#9fd');}
    else{txt(x,L(`웨이브 ${G.wave}/${G.S.waves}에서 무너졌어요`,`在第 ${G.wave}/${G.S.waves} 波失守`),W/2,320,13,'#cde');
      wrap(x,L('팁: 갈림길은 수문으로 긴 쪽으로 돌리고, 투명한 가오리는 해파리 등대로 드러내요','提示：用水闸把敌人引到长路，用水母灯塔显形隐身鳐鱼'),W/2,360,W-120,12,'#ffe9a8',17);}
    btn(x,B[0],L('다시','重来'),'#6a8a9a');btn(x,B[1],L('지도','地图'),'#6a8a9a');if(B[2])btn(x,B[2],L('다음 판 ▶','下一关 ▶'),'#3fd0c0',17);}
}
/* ---------- 매일 보상·미션 ---------- */
const today=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();};
function dailyInit(){const t=today();if(SV.day===t&&SV.mis.length===3)return;SV.day=t;let seed=0;for(const ch of t)seed=(seed*31+ch.charCodeAt(0))>>>0;
  const r=rng(seed),ids=Object.keys(MIS),pick=[];while(pick.length<3)pick.push({id:ids.splice(Math.floor(r()*ids.length),1)[0],p:0,got:0});SV.mis=pick;persist();}
function mission(id,n){for(const m of SV.mis)if(m.id===id&&!m.got)m.p=Math.min(MIS[id][0],m.p+n);}
const loginReady=()=>SV.login.last!==today();
const rewardBadge=()=>loginReady()||SV.mis.some(m=>!m.got&&m.p>=MIS[m.id][0]);
const metaOpen=k=>k==='hero'||UNLOCK[k]<=Math.min(cleared(),OPEN_N-1);
const canUp=()=>[...TOWER_IDS,'hero'].some(k=>metaOpen(k)&&SV.lv[k]<MAX_LV&&SV.coins>=lvCost(SV.lv[k]));
const avgLv=()=>{const ks=[...TOWER_IDS,'hero'].filter(metaOpen);return ks.reduce((a,k)=>a+SV.lv[k],0)/ks.length;};
dailyInit();
/* ---------- 공통 머리띠 ---------- */
function coinChip(x,X,Y){rr(x,X-44,Y-13,88,26,13);x.fillStyle='#0d222c';x.fill();x.strokeStyle='#06090d';x.lineWidth=2.5;x.stroke();x.fillStyle='#f0b429';x.beginPath();x.arc(X-30,Y,8,0,7);x.fill();x.lineWidth=2;x.stroke();txt(x,'◆',X-30,Y+.5,9,'#6a4200');txt(x,''+SV.coins,X+8,Y+1,13,'#ffe9a8','center','#06090d',900);}
function header(x,title,sub){let gr=x.createLinearGradient(0,0,0,100);gr.addColorStop(0,'rgba(2,14,22,.95)');gr.addColorStop(1,'rgba(2,14,22,0)');x.fillStyle=gr;x.fillRect(0,0,W,100);
  x.fillStyle='rgba(255,255,255,.15)';x.beginPath();x.arc(30,36,18,0,7);x.fill();txt(x,'‹',30,34,26,'#fff');txt(x,title,W/2,36,20,'#fff','center','rgba(0,0,0,.5)');if(sub)txt(x,sub,W/2,60,11,'#9fd');coinChip(x,W-58,36);}
const hitBack=p=>Math.hypot(p.x-30,p.y-36)<26;
function seaBg(x,dt,tint){let gr=x.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#1d6a78');gr.addColorStop(.5,'#0d3a48');gr.addColorStop(1,'#03121c');x.fillStyle=gr;x.fillRect(0,0,W,H);
  if(IMG.bg_area1){x.globalAlpha=.55;x.drawImage(IMG.bg_area1,0,0,W,H);x.globalAlpha=1;}if(tint){x.fillStyle=tint;x.fillRect(0,0,W,H);}drawAmbient(x,dt,.4);drawRays(x,1.2);}
/* ---------- 이야기 ---------- */
let story=null;
function showStory(title,pages,then){story={title,pages,i:0,then,t:0};scr='story';}
function drawStory(dt){const x=g;x.setTransform(K,0,0,K,0,0);seaBg(x,dt,story.tint||'rgba(0,5,15,.55)');story.t+=dt;
  if(IMG.temple_gate){x.globalAlpha=.9;drawImg(x,IMG.temple_gate,W/2,430,260);x.globalAlpha=1;}
  if(story.title)txt(x,story.title,W/2,120,26,'#eaffff','center','rgba(10,40,70,.9)',900);
  panel(x,28,470,W-56,210);const s=LL(story.pages[story.i]),n=Math.floor(story.t*(LANG==='zh'?22:34));
  wrap(x,s.slice(0,n),W/2,512,W-100,15,'#f0fbff',24);
  txt(x,`${story.i+1} / ${story.pages.length}`,W/2,658,10,'#7ab');
  if(n>=s.length)txt(x,L('화면을 누르면 계속 ▶','点击继续 ▶'),W/2,710,13,`rgba(255,233,168,${.6+.4*Math.sin(time*5)})`);
  txt(x,L('건너뛰기','跳过'),W-44,36,12,'rgba(255,255,255,.6)');}
function tapStory(p){sfx('tap');const s=LL(story.pages[story.i]);if(p.y<60&&p.x>W-90){const f=story.then;story=null;f();return;}
  if(story.t*(LANG==='zh'?22:34)<s.length){story.t=99;return;}
  if(++story.i>=story.pages.length){const f=story.then;story=null;f();}else story.t=0;}
function tryEnter(si){const a=Math.floor(si/PER_AREA);if(!SV.seen['a'+a]){SV.seen['a'+a]=1;persist();showStory(`${a+1}. ${LL(AREAS[a].n)}`,AREAS[a].intro,()=>enterBattle(si));story.tint=AREAS[a].tint;}else enterBattle(si);}
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
    x.fillStyle=open?(boss?'#4a1f5e':j===4?'#5a4a1a':'#14505e'):'#1a2a32';x.beginPath();x.arc(p[0],p[1],r,0,7);x.fill();x.strokeStyle=cur?'#ffd76a':open?'#7ff':'#3a4a52';x.lineWidth=3;x.stroke();
    txt(x,open?(boss?'👑':''+(i+1)):'🔒',p[0],p[1]+1,boss?20:16,'#fff');
    if(SV.stars[i])txt(x,'★'.repeat(SV.stars[i])+'☆'.repeat(3-SV.stars[i]),p[0],p[1]+r+10,11,'#ffd76a');
    txt(x,depthOf(i)+'m',p[0]+(p[0]<W/2?r+22:-r-22),p[1],10,'rgba(200,240,255,.6)');});
  const tot=SV.stars.reduce((p,q)=>p+q,0);header(x,LL(A.n),L(`${a+1}구역 · ★ ${tot}/${STAGE_N*3}`,`第${a+1}区域 · ★ ${tot}/${STAGE_N*3}`));
  txt(x,L(`권장 숙련 Lv${recLv(a*PER_AREA)}~${recLv(a*PER_AREA+9)} · 내 평균 Lv${avgLv().toFixed(1)}`,`推荐熟练 Lv${recLv(a*PER_AREA)}~${recLv(a*PER_AREA+9)} · 我的平均 Lv${avgLv().toFixed(1)}`),W/2,88,11,'#bfe');
  if(a===0)txt(x,L(`지금은 ${OPEN_N}판까지 (새 그림체로 다듬는 중)`,`目前开放到第${OPEN_N}关（新画风打磨中）`),W/2,716,11,'#ffe9a8','center','#06090d');
  if(a>0)btn(x,MAPB.prev,L('◀ 이전 구역','◀ 上一区域'),'#3a8a9a',12);
  if(a<AREAS.length-1){const ok=cl>=(a+1)*PER_AREA;btn(x,MAPB.next,ok?L('다음 구역 ▶','下一区域 ▶'):L('🔒 보스를 이기면','🔒 击败首领后'),ok?'#3a8a9a':'#444',12);}
}
function tapMap(p){if(hitBack(p)){scr='home';sfx('tap');return;}
  const cl=cleared(),a=mapArea;
  if(a>0&&hitR(p,MAPB.prev)){mapArea--;sfx('tap');return;}
  if(a<AREAS.length-1&&hitR(p,MAPB.next)&&cl>=(a+1)*PER_AREA){mapArea++;sfx('tap');return;}
  NODE.forEach((q,j)=>{const i=a*PER_AREA+j;if(Math.hypot(p.x-q[0],p.y-q[1])<30&&i<=cl&&i<OPEN_N){sfx('tap');tryEnter(i);}});}
/* ---------- 수호대 강화(판 밖 성장) ---------- */
const upRow=i=>({x:24,y:104+i*104,w:W-48,h:94});
function drawUpgrade(dt){const x=g;x.setTransform(K,0,0,K,0,0);seaBg(x,dt,'rgba(0,10,20,.45)');header(x,L('수호대 강화','守卫队强化'),L('숙련 1마다 공격력 +7%','每级熟练 攻击 +7%'));
  [...TOWER_IDS,'hero'].forEach((k,i)=>{const b=upRow(i),open=metaOpen(k),lv=SV.lv[k],c=lvCost(lv),max=lv>=MAX_LV,can=open&&!max&&SV.coins>=c;panel(x,b.x,b.y,b.w,b.h);
    if(k==='hero'){x.save();x.beginPath();x.rect(b.x,b.y,90,b.h);x.clip();drawHero(x,{x:b.x+46,y:b.y+54,face:1,lv:1,atk:0,moving:false},0,false);x.restore();}else towerIcon(x,k,b.x+46,b.y+56,1.15);
    const name=k==='hero'?L('가드 (영웅·지휘 스킬)','卫士（英雄·指挥技能）'):LL(TW_TXT[k][0]);
    txt(x,name,b.x+96,b.y+24,14,k==='hero'?'#bff':TCOL[k],'left');
    if(!open){txt(x,L(`🔒 ${UNLOCK[k]}판을 깨면 합류`,`🔒 通关第${UNLOCK[k]}关后加入`),b.x+96,b.y+52,12,'#9ab','left');return;}
    txt(x,`Lv ${lv}`+(max?' (MAX)':` → ${lv+1}`),b.x+96,b.y+48,13,'#fff','left');
    txt(x,L(`공격력 ×${masteryMul(lv).toFixed(2)}`,`攻击 ×${masteryMul(lv).toFixed(2)}`)+(max?'':`  →  ×${masteryMul(lv+1).toFixed(2)}`),b.x+96,b.y+70,11,'#9fd','left');
    if(!max){const bb={x:b.x+b.w-112,y:b.y+26,w:100,h:44};btn(x,bb,'◆ '+c,can?'#d0a030':'#555',14);}});
}
function tapUpgrade(p){if(hitBack(p)){scr='home';sfx('tap');return;}
  [...TOWER_IDS,'hero'].forEach((k,i)=>{const b=upRow(i),bb={x:b.x+b.w-112,y:b.y+26,w:100,h:44},lv=SV.lv[k];if(!hitR(p,bb)||!metaOpen(k)||lv>=MAX_LV)return;
    const c=lvCost(lv);if(SV.coins<c){sfx('tap');return;}SV.coins-=c;SV.lv[k]++;persist();sfx('up');burst(bb.x+50,bb.y+22,'#ffe27a',16,90,2.5,.6);});}
/* ---------- 도감: 적 스킬 · 수호탑 각성 · 지휘 스킬 ---------- */
let dexTab=0;
const DEXT=[{x:24,y:70,w:128,h:34},{x:161,y:70,w:128,h:34},{x:298,y:70,w:128,h:34}];
function drawDex(dt){const x=g;x.setTransform(K,0,0,K,0,0);seaBg(x,dt,'rgba(0,10,20,.6)');header(x,L('도감','图鉴'));
  [L('심연 생물','深渊生物'),L('수호탑','守护塔'),L('지휘 스킬','指挥技能')].forEach((s,i)=>btn(x,DEXT[i],s,dexTab===i?'#3fd0c0':'#345',12));
  const cl=cleared();
  if(dexTab===0){const ks=[...Object.keys(KIND_AT),'elite',...BOSS_IDS];ks.forEach((k,i)=>{const y=118+i*45,E=ENEMIES[k],seen=isBoss(k)?cl>=BOSS_IDS.indexOf(k)*PER_AREA+6:k==='elite'?cl>=3:cl>=KIND_AT[k];
      rr(x,20,y,W-40,41,10);x.fillStyle=isBoss(k)?'rgba(70,20,90,.75)':'rgba(8,28,40,.8)';x.fill();
      if(!seen){txt(x,'？？？',60,y+21,14,'#567');txt(x,L('아직 만나지 못했어요','尚未遇到'),100,y+21,11,'#567','left');return;}
      x.save();x.beginPath();x.rect(20,y,64,41);x.clip();drawEnemy(x,{k,x:52,y:y+21,a:0,r:Math.min(13,E.r),hp:1,mhp:1,shield:0,id:i,spawnT:0,inv:false,slow:0,slowT:0,stun:0,trap:0,lift:0,hitT:0,icon:1},time);x.restore();
      txt(x,LL(EN_TXT[k][0]),90,y+13,12,isBoss(k)?'#ffb0f0':'#fff','left');wrap(x,LL(EN_TXT[k][1]),90,y+29,W-124,9.5,'#bcd',11,'left');});}
  else if(dexTab===1){TOWER_IDS.forEach((k,i)=>{const y=114+i*128,T=TW_TXT[k];panel(x,20,y,W-40,120);towerIcon(x,k,52,y+38,.85);txt(x,LL(T[0]),86,y+18,14,TCOL[k],'left');wrap(x,LL(T[1]),86,y+36,W-124,10,'#cde',12,'left');
      txt(x,`✦ ${LL(T[2])}: ${LL(T[3](1))}`,32,y+64,10,'#ffe9a8','left');
      BRANCH[k].forEach((b,j)=>txt(x,`${L('각성','觉醒')} ${j?'B':'A'} · ${LL(b.n)}: ${LL(b.d)}`,32,y+82+j*17,10,j?'#ffc9a8':'#a8e8ff','left'));});}
  else{Object.keys(CMD).forEach((k,i)=>{const y=120+i*100,C=CMD[k],open=cl>=C.from;panel(x,20,y,W-40,90);txt(x,C.ic,58,y+45,30,'#fff');txt(x,LL(C.n),100,y+26,15,'#bff','left');
      wrap(x,LL(C.d),100,y+48,W-140,11,'#cde',14,'left');txt(x,open?L(`재사용 ${C.cd}초`,`冷却 ${C.cd}秒`):L(`🔒 ${C.from}판을 깨면 열려요`,`🔒 通关第${C.from}关后解锁`),100,y+74,10,open?'#9fd':'#f9a','left');});
    wrap(x,L('지휘 스킬의 위력은 가드의 숙련과 판 안에서 오른 가드 레벨을 따라가요. 축복 카드 "가드 강화"는 재사용 시간도 줄여요.','指挥技能的威力取决于卫士的熟练度和关卡内的卫士等级。祝福卡「卫士强化」还能缩短冷却。'),W/2,450,W-80,11,'#9bc',16);}
}
function tapDex(p){if(hitBack(p)){scr='home';sfx('tap');return;}DEXT.forEach((b,i)=>{if(hitR(p,b)){dexTab=i;sfx('tap');}});}
/* ---------- 보상: 출석 7일 · 하루 미션 3개 ---------- */
const RWB={login:{x:W/2-90,y:236,w:180,h:44}};
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
}
function tapReward(p){if(hitBack(p)){scr='home';sfx('tap');return;}
  if(hitR(p,RWB.login)&&loginReady()){const c=LOGIN[SV.login.n%7];SV.coins+=c;SV.login.n++;SV.login.last=today();persist();sfx('card');burst(W/2,258,'#ffe27a',24,120,3,.7);fx({k:'txt',s:'+'+c,x:W/2,y:226,col:'#ffe27a',size:18,life:1});return;}
  SV.mis.forEach((m,i)=>{const b=misRow(i),M=MIS[m.id];if(hitR(p,{x:b.x+b.w-110,y:b.y+22,w:96,h:42})&&!m.got&&m.p>=M[0]){m.got=1;SV.coins+=M[1];persist();sfx('card');burst(b.x+b.w-62,b.y+43,'#ffe27a',20,110,3,.7);}});}
/* ---------- 홈 ---------- */
const HOME_BTN={start:{x:W/2-110,y:548,w:220,h:58},up:{x:24,y:620,w:128,h:48},dex:{x:161,y:620,w:128,h:48},rw:{x:298,y:620,w:128,h:48},sfx:{x:W/2-150,y:690,w:94,h:36},bgm:{x:W/2-47,y:690,w:94,h:36},lang:{x:W/2+56,y:690,w:94,h:36}};
function dot(x,b){x.fillStyle='#ff4f6a';x.beginPath();x.arc(b.x+b.w-6,b.y+6,7,0,7);x.fill();txt(x,'!',b.x+b.w-6,b.y+6.5,10,'#fff');}
function drawHome(dt){
  const x=g;x.setTransform(K,0,0,K,0,0);seaBg(x,dt,'rgba(0,10,25,.25)');
  if(Math.random()<.2)fx({k:'bub',x:Math.random()*W,y:H,v:30+Math.random()*40,s:1+Math.random()*3,ph:Math.random()*6,life:8});
  x.save();x.translate(W/2,480);x.scale(1.9,1.9);x.translate(-TEMPLE.x,-TEMPLE.y);drawTemple(x,time,0);x.restore();
  drawFx(x,dt);
  glow(x,W/2,180,160,'rgba(120,255,220,.18)');
  txt(x,LL(TITLE),W/2,150,LANG==='zh'?40:36,'#eaffff','center','rgba(20,60,90,.9)',900);
  txt(x,L('잿빛 육지를 떠나, 바다에서 다시 살아가기','离开灰烬的陆地，在海中重新生活'),W/2,194,13,'#bfe9ff');
  coinChip(x,W-58,36);
  const cl=Math.min(cleared(),OPEN_N);btn(x,HOME_BTN.start,cl>=OPEN_N?L('다시 도전','再次挑战'):cl?L(`출격 · ${cl+1}판`,`出击 · 第${cl+1}关`):L('출격','出击'),'#3fd0c0',20);
  btn(x,HOME_BTN.up,L('수호대 강화','强化'),'#3a8a9a',13);if(canUp())dot(x,HOME_BTN.up);
  btn(x,HOME_BTN.dex,L('도감','图鉴'),'#3a8a9a',13);
  btn(x,HOME_BTN.rw,L('보상','奖励'),'#3a8a9a',13);if(rewardBadge())dot(x,HOME_BTN.rw);
  btn(x,HOME_BTN.sfx,L('효과음 ','音效 ')+(SV.opt.sfx?'ON':'OFF'),SV.opt.sfx?'#2a6a7a':'#555',11);btn(x,HOME_BTN.bgm,L('음악 ','音乐 ')+(SV.opt.bgm?'ON':'OFF'),SV.opt.bgm?'#2a6a7a':'#555',11);btn(x,HOME_BTN.lang,LANG==='ko'?'中文':'한국어','#2a6a7a',11);
  txt(x,L('이야기 다시 보기','重看故事'),W/2,752,11,'rgba(200,230,255,.6)');
  txt(x,'v'+BUILD,W-8,H-10,9,'rgba(255,255,255,.35)','right');
}
function tapHome(p){
  if(hitR(p,HOME_BTN.start)){sfx('tap');mapArea=-1;if(!SV.seen.pro){SV.seen.pro=1;persist();showStory(LL(TITLE),PROLOGUE,()=>{scr='map';});}else scr='map';return;}
  if(hitR(p,HOME_BTN.up)){sfx('tap');scr='upgrade';return;}if(hitR(p,HOME_BTN.dex)){sfx('tap');scr='dex';return;}if(hitR(p,HOME_BTN.rw)){sfx('tap');scr='reward';return;}
  if(p.y>738&&p.y<766&&Math.abs(p.x-W/2)<80){sfx('tap');showStory(LL(TITLE),PROLOGUE,()=>{scr='home';});return;}
  if(hitR(p,HOME_BTN.sfx)){SV.opt.sfx^=1;persist();}if(hitR(p,HOME_BTN.bgm)){SV.opt.bgm^=1;persist();}if(hitR(p,HOME_BTN.lang)){LANG=LANG==='ko'?'zh':'ko';SV.lang=LANG;persist();}}
/* ---------- 돌리기 ---------- */
const SCR={home:[drawHome,tapHome],map:[drawMap,tapMap],upgrade:[drawUpgrade,tapUpgrade],dex:[drawDex,tapDex],reward:[drawReward,tapReward],story:[drawStory,tapStory]};
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;time+=dt;
  for(const p of INPUT.taps.splice(0)){try{if(scr==='battle')tapBattle(p);else SCR[scr][1](p);}catch(err){console.error(err);}}
  try{if(scr==='battle'){updateBattle(dt);drawBattle(dt);}else{if(scr!=='home'&&scr!=='reward'&&scr!=='upgrade')FX.length=0;SCR[scr][0](dt);if(scr==='upgrade')drawFx(g,dt);}}catch(err){console.error(err);if(DEBUG)throw err;}
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&scr==='battle'&&G&&!ui.overlay&&G.state==='run')ui.overlay='pause';if(AC){document.hidden?AC.suspend():AC.resume();}});
window.__dbg={enter:enterBattle,get G(){return G;},get ui(){return ui;},set scr(v){scr=v;},set area(v){mapArea=v;},set tab(v){dexTab=v;},story:showStory,tap:(x,y)=>INPUT.taps.push({x,y}),SV:()=>SV,AREAS,PROLOGUE};
