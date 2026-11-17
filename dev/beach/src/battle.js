/* ============================== 전투 화면 (타워 디펜스): 규칙(core.js)이 알려 준 일을 그림·소리·진동으로 바꾼다 ============================== */
const HN={tt:['퇀퇀','团团'],didi:['방울이','滴滴'],peng:['펑펑','砰砰'],shan:['반짝','闪闪'],dun:['둥둥','墩墩'],zhuo:['쫑쫑','啄啄']};
const HCOL={tt:'#ffb199',didi:'#9fd8ff',peng:'#ffcf7a',shan:'#ffe08a',dun:'#bfe6c8',zhuo:'#e6c8a8'};
const TROLE={tt:['만두 대포 · 범위 폭발 (땅의 적만)','包子炮 · 范围爆炸（仅地面）'],didi:['물총 · 빠른 연사와 둔화','水枪 · 连射并减速'],peng:['불꽃 · 먼 거리 폭발, 껍데기에 강함','烟花 · 远程爆炸，克制硬壳'],
  shan:['빛줄기 · 갑옷 무시, 비출수록 강해짐','光束 · 无视护甲，越照越强'],dun:['탁구 저격 · 가장 튼튼한 적을 강타','乒乓狙击 · 重击最结实的敌人'],zhuo:['편지 · 범위 둔화, 근처 처치 골드 +1','信件 · 范围减速，附近击杀金币+1']};
const BR={king:['왕만두','大包子','폭발 범위 +55%, 잠깐 기절','范围+55%，短暂眩晕'],twin:['쌍둥이 찜통','双层蒸笼','한 번에 2발 발사','一次发射 2 发'],ice:['얼음물','冰水','둔화 65%, 2초 지속','减速65%，持续2秒'],jet:['물대포','水炮','줄에 선 적을 모두 관통','穿透一线上的敌人'],
  dragon:['용 불꽃','龙焰','터진 자리에 3초 불길','落点燃烧 3 秒'],star:['별 폭죽','星花','작은 폭발 3개 추가','追加 3 次小爆炸'],rainbow:['무지개','彩虹','옆의 적 2마리에게 번짐','连锁到旁边 2 个敌人'],moon:['달빛','月光','비춘 적이 받는 피해 +35%','被照敌人受伤+35%'],
  smash:['스매시','扣杀','정예·보스에게 3배 피해','对精英和BOSS伤害3倍'],double:['더블 서브','双发球','2마리를 동시에 공격','同时攻击 2 个敌人'],express:['특급 배달','特快专递','근처 처치 골드 +3','附近击杀金币+3'],parcel:['소포 폭탄','包裹炸弹','피해 5배, 범위 +25%','伤害5倍，范围+25%']};
const rnd=(a,b)=>a+Math.random()*(b-a);
let run=null,B=null,paused=false,speed=1;

function startBattle(si,bonusGold){
  S.sel=si;const owned=TOWER_IDS.filter(id=>S.lv[id]);
  run=newGame(si,{seed:(Date.now()%100000)|0,lv:S.lv,owned,gold:bonusGold||0});
  B={parts:[],nums:[],rings:[],fly:[],flashes:[],decals:[],coins:[],pillars:[],pop:{},stop:0,wet:0,goldBump:0,lifeBump:0,shake:0,banner:null,sel:-1,pick:'',aim:'',endT:-1,tip:null,time:0,tide:0,leakFlash:0,adGold:!!bonusGold,map:mkMap(si),hint:0};
  paused=false;speed=S.opt.fast?2:1;scr='battle';wantMusic('play');S.stat.runs++;mission('run',1);track('stage_start',{stage:si+1});
  tip('start',L('빈 모래 자리를 눌러 타워를 짓고, 준비되면 시작을 눌러요','点空沙堆建塔，准备好就点开始'),8);persist();
}
function tip(key,text,sec){if(S.tips[key]||!B)return;S.tips[key]=1;B.tip={text,t:sec||6};}
function banner(text,big,col){B.banner={text,t:0,big:!!big,col:col||'#fff'};}
function shake(n){B.shake=Math.max(B.shake,n);}
/* ---------- 이펙트 도구: 번쩍임(빛 번짐) · 불똥 · 연기 · 별가루 · 자국 · 날아가는 동전 ---------- */
const ECOL={crab:'#ff8a65',jelly:'#c8e6ff',fish:'#6fb8ff',puffer:'#ffd76a',hermit:'#e9bd7e',octo:'#c9a2f2',gull:'#ffffff',elite:'#e2685c',boss:'#ff7a5c'};
const TCOL={tt:'#fff1d6',didi:'#8fd4ff',peng:'#ffb347',shan:'#ffe9a0',dun:'#ffffff',zhuo:'#ffc9d6'};
const GLOW={};
function glow(x,y,r,col,a){let c=GLOW[col];if(!c){c=GLOW[col]=mkCanvas(64,64);const q=c.getContext('2d'),gr=q.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.3,'rgba(255,255,255,.75)');gr.addColorStop(1,'rgba(255,255,255,0)');q.fillStyle=gr;q.fillRect(0,0,64,64);q.globalCompositeOperation='source-in';q.fillStyle=col;q.fillRect(0,0,64,64);}
  if(r<=0||a<=0)return;g.globalAlpha=Math.min(1,a);g.drawImage(c,x-r,y-r,r*2,r*2);g.globalAlpha=1;}
function P(kind,x,y,vx,vy,life,r,col,gr,drag){if(B.parts.length<420)B.parts.push({kind,x,y,vx,vy,life,t:0,r,col,gr:gr||0,drag:drag||1});}
function pick(c,i){return Array.isArray(c)?c[i%c.length]:c;}
function burst(x,y,n,col,sp,r){for(let i=0;i<n;i++){const a=Math.random()*6.283,v=rnd(.5,1)*(sp||2.2);P('dot',x,y,Math.cos(a)*v,Math.sin(a)*v-.8,rnd(16,30),rnd(.6,1)*(r||2.6),pick(col,i),.07);}}
function sparks(x,y,n,col,sp){for(let i=0;i<n;i++){const a=Math.random()*6.283,v=rnd(.5,1)*(sp||4);P('spark',x,y,Math.cos(a)*v,Math.sin(a)*v,rnd(7,13),rnd(1.2,2),pick(col,i),.04,.9);}}
function smoke(x,y,n,r){for(let i=0;i<n;i++)P('smoke',x+rnd(-r,r)*.5,y+rnd(-r,r)*.4,rnd(-.3,.3),rnd(-.7,-.2),rnd(28,44),rnd(.5,.9)*r,'#fff');}
function stars(x,y,n,col,sp){for(let i=0;i<n;i++){const a=Math.random()*6.283,v=rnd(.4,1)*(sp||3);P('star',x,y,Math.cos(a)*v,Math.sin(a)*v-1,rnd(24,42),rnd(2.6,4.4),pick(col,i),.06,.96);}}
function flash(x,y,r,col,life){B.flashes.push({x,y,r,col,t:0,life:life||6});}
function ring(x,y,r,col,w,life){B.rings.push({x,y,r,col,w:w||3,t:0,life:life||16});}
function decal(x,y,r,life){if(B.decals.length>14)B.decals.shift();B.decals.push({x,y,r,t:0,life:life||170});}
function coins(x,y,n){for(let i=0;i<n&&B.coins.length<40;i++)B.coins.push({sx:x,sy:y,cx:x+rnd(-40,40),cy:y-rnd(30,70),t:-i*3,T:rnd(24,32)});}
function floatTxt(x,y,s,col,sz){if(B.nums.length<46)B.nums.push({x,y,s,col,sz:sz||11,t:0});}
function hitStop(sec){B.stop=Math.max(B.stop,sec);}
const FW_COL=['#ff6b6b','#ffd93d','#6bcbff','#ff9ff3','#8ce99a'];
function boom(x,y,r,kind){
  if(kind==='fw'){flash(x,y,r*1.9,'#ffd27a',7);ring(x,y,r,'#ffe9a0',3,14);stars(x,y,12,FW_COL,3.6);sparks(x,y,6,'#fff',5);sfx('ex_fw');}
  else if(kind==='bun'){flash(x,y,r*1.7,'#ffffff',6);ring(x,y,r,'#ffffff',3.5,14);smoke(x,y,4,r*.55);sparks(x,y,5,['#fff','#ffe0b0'],4);decal(x,y,r*.6,110);sfx('ex_bun');}
  else if(kind==='bomb'){flash(x,y,r*2.6,'#ffd27a',10);ring(x,y,r,'#fff3c0',6,18);ring(x,y,r*1.5,'#ffb347',2.5,22);smoke(x,y,7,r*.6);sparks(x,y,16,['#fff','#ffd93d','#ff9f43'],7);burst(x,y,10,['#8a5a34','#5a3620'],4,3);decal(x,y,r*.75,260);shake(11);vib(50);hitStop(.07);sfx('ex_bomb');}
  else{flash(x,y,r*1.3,'#ffd0dc',5);ring(x,y,r,'#ffc9d6',2.5,14);for(let i=0;i<6;i++)P('paper',x,y,rnd(-2.4,2.4),rnd(-3,-.6),rnd(26,40),rnd(2.4,3.6),i%2?'#fff':'#ffc9d6',.1,.97);sfx('splash');}
}
function consumeFx(){
  for(const f of run.fx){switch(f.e){
    case 'hit':{const big=f.v>=30;if(big||f.weak)floatTxt(f.x+rnd(-7,7),f.y-12,Math.round(f.v),f.weak?'#ffb347':f.v>=120?'#ffd93d':'#fff',f.v>=120?15:f.v>=60?12:10);else if(f.res&&Math.random()<.3)floatTxt(f.x,f.y-12,L('단단!','硬！'),'#c8d6e4',9);
      if(B.flashes.length<26){flash(f.x,f.y,big?13:8,f.res?'#c8d6e4':'#ffffff',4);if(big||Math.random()<.4)sparks(f.x,f.y,big?3:2,f.res?'#c8d6e4':'#fff7d6',3);}sfx('hit');break;}
    case 'die':{const boss=f.k==='boss',el=f.k==='elite',col=ECOL[f.k]||'#fff';B.fly.push({k:boss?f.bk:f.k,x:f.x,y:f.y,t:0,r:ENEMIES[f.k].r});
      ring(f.x,f.y,ENEMIES[f.k].r*1.5,'#ffffff',3,12);burst(f.x,f.y,boss?26:el?12:6,[col,'#fff'],boss?5:2.8,boss?4:2.8);flash(f.x,f.y,ENEMIES[f.k].r*(boss?4:2.2),'#ffffff',boss?10:5);
      coins(f.x,f.y,boss?12:el?5:f.g>=12?2:1);floatTxt(f.x,f.y-18,'+'+f.g,'#ffd93d',boss?17:el?13:10);sfx('kill');
      if(boss){shake(12);vib(70);hitStop(.12);stars(f.x,f.y,24,FW_COL,6);smoke(f.x,f.y,6,22);}else if(el){shake(5);hitStop(.04);}break;}
    case 'blast':boom(f.x,f.y,f.r,f.kind);break;
    case 'splash':ring(f.x,f.y,9,'#bfe8ff',2,10);for(let i=0;i<3;i++)P('dot',f.x,f.y,rnd(-1.6,1.6),rnd(-2.6,-1),rnd(12,18),rnd(1.6,2.4),'#bfe8ff',.2);sfx('splash');break;
    case 'pingpong':flash(f.x,f.y,16,'#ffffff',5);sparks(f.x,f.y,5,['#fff','#ffb347'],5);ring(f.x,f.y,10,'#ffffff',2.5,9);break;
    case 'shoot':{const sp=run.spots[f.i];if(f.id!=='shan')flash(sp.x,sp.y-34,f.id==='tt'||f.id==='peng'?15:10,TCOL[f.id],4);if(f.id==='tt')smoke(sp.x,sp.y-36,1,7);sfx('s_'+f.id);break;}
    case 'build':{const sp=run.spots[f.i];B.pop[f.i]=B.time;ring(sp.x,sp.y+2,30,'#f3d596',4,16);smoke(sp.x,sp.y+4,5,12);sfx('build');mission('build',1);S.tips.t_build=1;break;}
    case 'up':{const sp=run.spots[f.i],ev=f.lv===4;B.pop[f.i]=B.time-.2;B.pillars.push({x:sp.x,y:sp.y,t:0,big:ev});stars(sp.x,sp.y-20,ev?22:9,['#ffd93d','#fff'],ev?5:3);ring(sp.x,sp.y,ev?46:30,'#ffe9a0',ev?5:3,ev?22:14);
      if(ev){banner(LL(BR[f.br]),0,'#ffd93d');vib(40);hitStop(.06);flash(sp.x,sp.y-20,70,'#ffe9a0',10);sfx('evolve');}else sfx('up');S.tips.t_up=1;break;}
    case 'sell':{const sp=run.spots[f.i];coins(sp.x,sp.y-10,4);smoke(sp.x,sp.y,4,12);floatTxt(sp.x,sp.y-24,'+'+f.g,'#ffd93d',13);sfx('sell');break;}
    case 'wave':if(f.boss){banner(L('보스 등장!','BOSS 来了！'),1,'#ffd93d');sfx('boss');wantMusic('boss');shake(6);}else{banner(L('파도 ','第 ')+f.w+L('',' 波'));sfx('horn');}S.tips.t_start=1;
      if(f.w===2)tip('up',L('타워를 누르면 강화할 수 있어요. 3단계 다음엔 두 갈래 중 하나!','点一下塔可以升级，3 级之后二选一进阶！'),7);if(f.w===3)tip('skill',L('아래 큰 파도·야자 폭탄은 급할 때 직접 써요','下方的大浪和椰子炸弹，紧急时自己放'),7);break;
    case 'waveClear':floatTxt(225,400,L('파도 막음! +','守住了！+')+f.g,'#ffd93d',17);coins(225,390,5);sfx('wclear');if(f.w===1)tip('early',L('다음 파도를 미리 부르면 남은 시간만큼 골드를 더 받아요','提前叫下一波，可按剩余时间多拿金币'),7);break;
    case 'bonus':floatTxt(330,700,'+'+f.g,'#ffd93d',15);coins(330,700,3);sfx('bonus');break;
    case 'leak':B.leakFlash=20;B.lifeBump=1;shake(6);vib(40);hitStop(.03);burst(f.x,GATE_Y-6,10,['#ff5a4a','#fff'],4,3);ring(f.x,GATE_Y,34,'#ff5a4a',4,16);floatTxt(f.x,f.y-26,'-'+f.n,'#ff5a4a',16);sfx('leak');break;
    case 'ink':{const sp=run.spots[f.i];burst(sp.x,sp.y-26,10,'#4a3a6a',3,3.4);sfx('ink');tip('ink',L('먹물에 맞은 타워는 멈춰요. 눌러서 닦아 줘요!','被墨汁喷到的塔会停工，点一下擦干净！'),7);break;}
    case 'inkClear':{const sp=run.spots[f.i];sfx('clear');burst(sp.x,sp.y-24,8,'#4a3a6a',3,3);stars(sp.x,sp.y-26,6,'#fff',3);break;}
    case 'summon':ring(f.x,f.y,40,'#ffffff',4,18);burst(f.x,f.y,10,'#fff',3);if(f.bk==='whale'){banner(L('고래 파도! 적이 빨라져요','鲸浪！敌人加速'),0,'#bfe8ff');sfx('tide');}break;
    case 'tide':B.tide=52;sfx('tide');shake(7);vib(40);break;
    case 'down':sfx('over');break;
    case 'revive':sfx('reward');stars(225,GATE_Y-10,30,['#ffd93d','#fff'],6);ring(225,GATE_Y,80,'#ffe9a0',6,24);break;
    case 'win':sfx('win');wantMusic('menu');B.endT=2.2;B.sel=-1;for(let i=0;i<60;i++)P('paper',rnd(0,450),rnd(-220,0),rnd(-1,1),rnd(2,5),120,rnd(3,5),FW_COL[i%5],0,1);break;
    case 'lose':B.endT=1.3;B.sel=-1;break;
  }}
  run.fx.length=0;
  if(run.en.some(e=>e.air))tip('air',L('갈매기는 길을 무시하고 날아와요. 퇀퇀·쫑쫑은 하늘을 못 맞혀요','海鸥会直接飞过来，团团和啄啄打不到空中'),7);
  if(run.en.some(e=>e.armor>=.5))tip('armor',L('단단한 적은 방울이·반짝의 마법, 소라게는 폭발에 약해요','硬壳敌人怕滴滴和闪闪的魔法，寄居蟹怕爆炸'),7);
}
function projPos(p){if(p.lob){const q=p.t/p.T;return [p.x,p.y-Math.sin(q*3.1416)*(p.k==='fw'?70:42)];}return [p.x,p.y];}
function battleTick(dt){
  B.time+=dt;if(B.tip&&(B.tip.t-=dt)<=0)B.tip=null;if(B.banner&&(B.banner.t+=dt)>1.6)B.banner=null;
  if(paused||adOv)return;
  if(B.stop>0)B.stop-=dt;else{const before=run.gold;advance(run,dt*speed);consumeFx();if(run.gold<before-1)B.goldBump=-1;}   // 큰 타격 때 아주 잠깐 멈춘다
  const f=Math.min(3,dt*60);B.shake*=Math.pow(.84,f);if(B.tide>0)B.tide-=f;if(B.wet>0)B.wet-=f;if(B.leakFlash>0)B.leakFlash-=f;B.goldBump*=Math.pow(.86,f);B.lifeBump*=Math.pow(.88,f);
  for(const p of run.pr){const q=projPos(p);(p.tr||(p.tr=[])).push(q[0],q[1]);if(p.tr.length>12)p.tr.splice(0,2);}
  if(Math.floor(B.time*20)!==Math.floor((B.time-dt)*20)){for(const z of run.zones)P('flame',z.x+rnd(-z.r,z.r)*.7,z.y+rnd(-z.r,z.r)*.5,rnd(-.2,.2),rnd(-1.2,-.6),rnd(14,22),rnd(3,5),'#ffb347');
    for(const sp of run.spots){const tw=sp.tw;if(tw&&tw.id==='shan'&&tw.tgt&&tw.ink<=0){const e=run.en.find(q=>q.id===tw.tgt);if(e)P('star',e.x+rnd(-6,6),e.y+rnd(-6,6),rnd(-.6,.6),rnd(-1.4,-.4),rnd(12,18),rnd(2,3),'#fff7c8',0,.95);}}}
  for(const p of B.parts){p.t+=f;p.x+=p.vx*f;p.y+=p.vy*f;p.vy+=p.gr*f;if(p.drag<1){const d=Math.pow(p.drag,f);p.vx*=d;p.vy*=d;}}B.parts=B.parts.filter(p=>p.t<p.life);
  for(const n of B.nums)n.t+=f;B.nums=B.nums.filter(n=>n.t<44);
  for(const r of B.rings)r.t+=f;B.rings=B.rings.filter(r=>r.t<r.life);
  for(const r of B.flashes)r.t+=f;B.flashes=B.flashes.filter(r=>r.t<r.life);
  for(const r of B.decals)r.t+=f;B.decals=B.decals.filter(r=>r.t<r.life);
  for(const r of B.pillars)r.t+=f;B.pillars=B.pillars.filter(r=>r.t<26);
  for(const o of B.fly)o.t+=f;B.fly=B.fly.filter(o=>o.t<9);
  for(const c of B.coins){c.t+=f;}{const n=B.coins.length;B.coins=B.coins.filter(c=>c.t<c.T);if(B.coins.length<n){B.goldBump=1;sfx('gold');}}
  if(run.ended&&B.endT>=0&&(B.endT-=dt)<0){B.endT=-1;endBattle();}
}
/* ---------- 타워와 자리 ---------- */
function drawBase(x,y,lv,br,ink){
  const hgt=[0,10,15,20,24][lv],w=25+lv*1.5,gold=lv>=4;
  g.fillStyle='rgba(60,40,20,.2)';g.beginPath();g.ellipse(x+3,y+7,w+4,10,0,0,6.2832);g.fill();
  g.lineWidth=2;g.strokeStyle=INK;g.lineJoin='round';
  g.fillStyle=gold?'#f0b860':'#e8bd72';g.beginPath();g.ellipse(x,y,w,9,0,0,3.1416);g.lineTo(x-w,y-hgt);g.ellipse(x,y-hgt,w,9,0,3.1416,0,true);g.closePath();g.fill();g.stroke();
  g.fillStyle=gold?'#ffd98a':'#f8d795';g.beginPath();g.ellipse(x,y-hgt,w,9,0,0,6.2832);g.fill();g.stroke();
  if(lv>=2){g.fillStyle=gold?'#f0b860':'#e8bd72';for(let i=0;i<5;i++){const a=3.1416+i*.7854,cx=x+Math.cos(a)*(w-2),cy=y-hgt-Math.sin(a)*-7;rr(cx-4,cy-9,8,8,2);g.fill();g.stroke();}}
  g.strokeStyle='rgba(150,100,50,.5)';g.lineWidth=1.4;g.beginPath();g.arc(x,y-hgt*.3,5,3.1416,0);g.stroke();
  if(lv>=3){g.strokeStyle=INK;g.lineWidth=2;g.beginPath();g.moveTo(x+w-3,y-hgt-2);g.lineTo(x+w-3,y-hgt-24);g.stroke();g.fillStyle=gold?'#ffd93d':RED;g.beginPath();g.moveTo(x+w-3,y-hgt-24);g.lineTo(x+w+11+Math.sin(B.time*5)*1.5,y-hgt-19);g.lineTo(x+w-3,y-hgt-14);g.closePath();g.fill();g.stroke();}
  return hgt;
}
function drawSpots(){
  const t=B.time,minC=Math.min.apply(null,run.owned.map(towerCost));
  run.spots.forEach((sp,i)=>{const tw=sp.tw,sel=B.sel===i;
    if(!tw){const can=run.gold>=minC,pu=can?Math.sin(t*4+i)*.5+.5:0;
      g.fillStyle='rgba(60,40,20,.16)';g.beginPath();g.ellipse(sp.x+2,sp.y+5,26,10,0,0,6.2832);g.fill();
      g.fillStyle=sel?'#fff1c4':'#f3d596';g.strokeStyle=sel?'#ff9f43':'rgba(120,80,40,.75)';g.lineWidth=sel?3:2;g.setLineDash(sel?[]:[5,4]);g.beginPath();g.ellipse(sp.x,sp.y,24,11,0,0,6.2832);g.fill();g.stroke();g.setLineDash([]);
      g.fillStyle=can?'rgba(255,255,255,'+(.7+pu*.3)+')':'rgba(255,255,255,.45)';g.strokeStyle=can?'#3a9478':'rgba(120,80,40,.5)';g.lineWidth=2;circ(sp.x,sp.y-3-pu*2,9);g.fill();g.stroke();
      g.strokeStyle=can?'#3a9478':'rgba(120,80,40,.6)';g.lineWidth=3;g.lineCap='round';g.beginPath();g.moveTo(sp.x-4.5,sp.y-3-pu*2);g.lineTo(sp.x+4.5,sp.y-3-pu*2);g.moveTo(sp.x,sp.y-7.5-pu*2);g.lineTo(sp.x,sp.y+1.5-pu*2);g.stroke();
      if(sel&&TOWERS[B.pick]){g.fillStyle='rgba(255,255,255,.16)';g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=2;g.setLineDash([7,5]);circ(sp.x,sp.y,TOWERS[B.pick].range);g.fill();g.stroke();g.setLineDash([]);}return;}
    if(sel){const st=towerStat(run,tw);g.fillStyle='rgba(255,255,255,.16)';g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=2;g.setLineDash([7,5]);circ(sp.x,sp.y,st.range);g.fill();g.stroke();g.setLineDash([]);}
  });
}
function drawTowers(){
  const t=B.time,order=run.spots.map((sp,i)=>i).filter(i=>run.spots[i].tw).sort((a,b)=>run.spots[a].y-run.spots[b].y);
  for(const i of order){const age=B.time-(B.pop[i]===undefined?-9:B.pop[i]);g.save();if(age<.42){const q=age/.42,dy=q<.5?-(1-q*2)*(1-q*2)*28:0,sq=q<.5?-.06:Math.sin((q-.5)*2*3.1416)*.18;g.translate(run.spots[i].x,run.spots[i].y+dy);g.scale(1+sq,1-sq);g.translate(-run.spots[i].x,-run.spots[i].y);}
    const sp=run.spots[i],tw=sp.tw,hgt=drawBase(sp.x,sp.y,tw.lv,tw.br),st=tw.anim>0?tw.anim/10:0,br=Math.sin(t*3+i)*.02;
    if(tw.lv>=4){g.fillStyle='rgba(255,217,61,'+(.22+Math.sin(t*4)*.06)+')';g.beginPath();g.ellipse(sp.x,sp.y-hgt-22,30,32,0,0,6.2832);g.fill();}
    drawImg(HERO_IMG[tw.id],sp.x,sp.y-hgt+4-st*4,46+tw.lv*2,{sx:1+br-st*.07,sy:1-br+st*.1,a:tw.ink>0?.75:1});
    for(let k=0;k<Math.min(3,tw.lv);k++){g.fillStyle=tw.lv>=4?'#ffd93d':'#fff';g.strokeStyle=INK;g.lineWidth=1.2;circ(sp.x-8+k*8,sp.y+13,3);g.fill();g.stroke();}
    if(tw.ink>0){g.fillStyle='rgba(50,38,80,.88)';circ(sp.x-5,sp.y-hgt-26,17);g.fill();circ(sp.x+11,sp.y-hgt-14,12);g.fill();circ(sp.x-12,sp.y-hgt-10,9);g.fill();icoHand(sp.x+16,sp.y-hgt+8,t,.42);}
    else if(tw.lv<4&&run.gold>=upCost(tw)&&B.sel!==i){const bo=Math.abs(Math.sin(t*4+i))*3;g.fillStyle='#5cc4a4';g.strokeStyle=INK;g.lineWidth=1.6;g.beginPath();g.moveTo(sp.x+20,sp.y-hgt-44-bo);g.lineTo(sp.x+28,sp.y-hgt-34-bo);g.lineTo(sp.x+23,sp.y-hgt-34-bo);g.lineTo(sp.x+23,sp.y-hgt-27-bo);g.lineTo(sp.x+17,sp.y-hgt-27-bo);g.lineTo(sp.x+17,sp.y-hgt-34-bo);g.lineTo(sp.x+12,sp.y-hgt-34-bo);g.closePath();g.fill();g.stroke();}
  g.restore();}
  // 등롱 빛줄기
  for(const sp of run.spots){const tw=sp.tw;if(!tw||tw.id!=='shan'||!tw.tgt||tw.ink>0||!tw.links)continue;let px=sp.x,py=sp.y-[0,10,15,20,24][tw.lv]-26;
    for(const id of tw.links){const e=run.en.find(q=>q.id===id);if(!e)break;const w=2+tw.ramp*.28;g.lineCap='round';g.strokeStyle='rgba(255,224,138,.45)';g.lineWidth=w+6+Math.sin(t*30)*1.5;g.beginPath();g.moveTo(px,py);g.lineTo(e.x,e.y);g.stroke();glow(e.x,e.y,9+tw.ramp*.8,'#ffe9a0',.8);glow(px,py,8,'#ffe9a0',.6);g.strokeStyle=tw.br==='rainbow'?'hsl('+((t*240)%360)+',90%,80%)':'#fffbe0';g.lineWidth=w;g.stroke();px=e.x;py=e.y;}}
}
function drawDecals(){
  for(const d of B.decals){const a=Math.min(1,(d.life-d.t)/50)*.28;g.fillStyle='rgba(70,45,25,'+a+')';g.beginPath();g.ellipse(d.x,d.y+2,d.r,d.r*.55,0,0,6.2832);g.fill();}
  if(B.wet>0){g.fillStyle='rgba(110,190,225,'+(B.wet/70*.16)+')';g.fillRect(0,100,W,GATE_Y-90);}
}
function drawEnemies(){
  const es=run.en.slice().sort((a,b)=>(a.air?1e4:0)+a.y-((b.air?1e4:0)+b.y)),t=run.t;
  for(const o of B.fly){const q=o.t/9,s=o.r*3.4*(1+q*.45);drawSpr(o.k,o.x,o.y,s,{a:1-q,sx:1+q*.2,sy:1-q*.25});drawSpr(o.k,o.x,o.y,s,{white:1,a:(1-q)*.85,sx:1+q*.2,sy:1-q*.25});}
  for(const e of es){const k=sprKey(e),size=e.r*3.4,bob=1+Math.sin(t*.2+e.ph)*.05,h=e.hit/6;let y=e.y+e.r*.25;
    if(e.air){g.fillStyle='rgba(60,40,20,.14)';g.beginPath();g.ellipse(e.x,e.y+26,e.r*.8,e.r*.3,0,0,6.2832);g.fill();y-=6+Math.sin(t*.15+e.ph)*3;}
    else{g.fillStyle='rgba(60,40,20,.18)';g.beginPath();g.ellipse(e.x,e.y+e.r*.8,e.r*.9,e.r*.32,0,0,6.2832);g.fill();if(e.k==='fish')y-=Math.abs(Math.sin(t*.16+e.ph))*8;}
    if(e.slow>0){g.fillStyle='rgba(150,215,255,.5)';g.beginPath();g.ellipse(e.x,e.y+e.r*.8,e.r*1.25,e.r*.48,0,0,6.2832);g.fill();g.strokeStyle='rgba(255,255,255,.8)';g.lineWidth=1;g.stroke();}
    if(e.shred>0)glow(e.x,y-e.r*.3,e.r*2.2,'#ffe9a0',.35);
    const o={sx:bob*(1+h*.2),sy:(2-bob)*(1-h*.16)};drawSpr(k,e.x,y-h*2,size,o);if(h>0)drawSpr(k,e.x,y-h*2,size,{sx:o.sx,sy:o.sy,white:1,a:h*.85});
    if(e.stun>0)for(let i=0;i<2;i++){const a=B.time*7+i*3.14;txt('★',e.x+Math.cos(a)*e.r*.8,e.y-e.r-8+Math.sin(a)*3,8,'#ffd93d','center',INK,2);}
    if(e.hp<e.max*.999||e.k==='elite'||e.k==='boss'){const w=Math.max(18,e.r*1.9),yy=y-size*.5-3;g.fillStyle='rgba(60,36,20,.75)';rr(e.x-w/2-1,yy-1,w+2,5.5,2.5);g.fill();g.fillStyle=e.armor>=.5?'#9fb8d0':e.k==='boss'?'#ff5a4a':e.hp<e.max*.35?'#ffb347':'#7ddc6a';rr(e.x-w/2,yy,w*Math.max(0,e.hp/e.max),3.5,1.7);g.fill();}
  }
}
const TRAIL={fw:'255,190,90',bun:'255,255,255',drop:'150,215,255',ball:'255,255,255',mail:'255,200,215'};
function drawProj(){
  for(const z of run.zones){glow(z.x,z.y,z.r*1.5,'#ff9f43',.3+Math.sin(B.time*9)*.08);}
  for(const p of run.pr){const q=projPos(p),x=q[0],y=q[1],tr=p.tr;
    if(tr&&tr.length>=4){g.lineCap='round';for(let i=2;i<tr.length;i+=2){const a=i/tr.length;g.strokeStyle='rgba('+TRAIL[p.k]+','+(a*.75)+')';g.lineWidth=(p.k==='ball'?4:p.k==='fw'?4.5:3.2)*a;g.beginPath();g.moveTo(tr[i-2],tr[i-1]);g.lineTo(tr[i],tr[i+1]);g.stroke();}}
    if(p.k==='fw'){glow(x,y,11,'#ffb347',.9);g.fillStyle='#fff7d6';circ(x,y,2.8);g.fill();if(Math.random()<.5)P('dot',x,y,rnd(-.4,.4),rnd(.2,1),rnd(8,14),rnd(1,1.8),'#ffd27a');}
    else if(p.k==='bun'){const s=1+Math.sin(p.t*.5)*.08;g.fillStyle='#fff';g.strokeStyle=INK;g.lineWidth=1.6;g.beginPath();g.ellipse(x,y,5.8*s,5.8/s,0,0,6.2832);g.fill();g.stroke();g.beginPath();g.arc(x,y-1,2.4,3.6,5.8);g.stroke();}
    else if(p.k==='drop'){glow(x,y,p.line?11:8,'#8fd4ff',.7);g.fillStyle='#c9ecff';g.strokeStyle='#3d8fd0';g.lineWidth=1.2;circ(x,y,p.line?5:3.6);g.fill();g.stroke();}
    else if(p.k==='ball'){glow(x,y,9,'#ffffff',.8);g.fillStyle='#fff';g.strokeStyle='#ff9f43';g.lineWidth=1.6;circ(x,y,3.8);g.fill();g.stroke();}
    else{g.save();g.translate(x,y);g.rotate(p.t*.25);g.fillStyle='#fff';g.strokeStyle=INK;g.lineWidth=1.4;rr(-7,-5,14,10,2);g.fill();g.stroke();g.fillStyle=RED;circ(0,0,2);g.fill();g.restore();}}
}
function drawFx(){
  for(const p of B.pillars){const q=p.t/26,w=(p.big?34:22)*(1-q*.5),gr=g.createLinearGradient(0,p.y-150,0,p.y);gr.addColorStop(0,'rgba(255,233,160,0)');gr.addColorStop(1,'rgba(255,240,190,'+(.8*(1-q))+')');g.fillStyle=gr;g.fillRect(p.x-w,p.y-150,w*2,154);}
  for(const r of B.rings){const q=r.t/r.life,e=1-Math.pow(1-q,3);g.globalAlpha=1-q;g.strokeStyle=r.col;g.lineWidth=Math.max(.5,r.w*(1-q));circ(r.x,r.y,r.r*(.3+.7*e));g.stroke();}g.globalAlpha=1;
  g.globalCompositeOperation='lighter';for(const r of B.flashes){const q=r.t/r.life;glow(r.x,r.y,r.r*(.6+q*.6),r.col,(1-q)*.9);}g.globalCompositeOperation='source-over';
  if(B.tide>0){const q=1-B.tide/52,y=40+q*720,a=1-q*.5;
    const gr=g.createLinearGradient(0,y-150,0,y);gr.addColorStop(0,'rgba(90,190,230,0)');gr.addColorStop(.75,'rgba(90,190,230,'+(.6*a)+')');gr.addColorStop(1,'rgba(190,235,250,'+(.85*a)+')');g.fillStyle=gr;
    g.beginPath();g.moveTo(0,y-150);g.lineTo(W,y-150);for(let x=W;x>=0;x-=15)g.lineTo(x,y+Math.sin(x*.05+B.time*9)*9+Math.sin(x*.13)*4);g.closePath();g.fill();
    for(let k=0;k<3;k++){g.strokeStyle='rgba(255,255,255,'+((.95-k*.28)*a)+')';g.lineWidth=5-k*1.4;g.lineCap='round';g.beginPath();for(let x=0;x<=W;x+=15){const yy=y-k*16+Math.sin(x*.05+B.time*9+k)*9+Math.sin(x*.13)*4;if(x)g.lineTo(x,yy);else g.moveTo(x,yy);}g.stroke();}
    g.fillStyle='rgba(255,255,255,'+(.9*a)+')';for(let i=0;i<14;i++){const x=(i*37+B.time*60)%W;circ(x,y+6+Math.sin(i*2.3+B.time*8)*8,2+(i%3));g.fill();}if(B.tide<3)B.wet=70;}
  for(const p of B.parts){const q=p.t/p.life,a=Math.min(1,(p.life-p.t)/8);
    if(p.kind==='spark'){g.strokeStyle=p.col;g.globalAlpha=a;g.lineWidth=p.r;g.lineCap='round';g.beginPath();g.moveTo(p.x,p.y);g.lineTo(p.x-p.vx*2.2,p.y-p.vy*2.2);g.stroke();}
    else if(p.kind==='smoke'){g.globalAlpha=.42*(1-q);g.fillStyle=p.col;circ(p.x,p.y,p.r*(.6+q*1.3));g.fill();}
    else if(p.kind==='star'){const s=p.r*(1-q*.5)*(.7+Math.sin(p.t*.9)*.3);g.globalAlpha=a;g.fillStyle=p.col;g.beginPath();g.moveTo(p.x,p.y-s);g.lineTo(p.x+s*.28,p.y-s*.28);g.lineTo(p.x+s,p.y);g.lineTo(p.x+s*.28,p.y+s*.28);g.lineTo(p.x,p.y+s);g.lineTo(p.x-s*.28,p.y+s*.28);g.lineTo(p.x-s,p.y);g.lineTo(p.x-s*.28,p.y-s*.28);g.closePath();g.fill();}
    else if(p.kind==='paper'){g.globalAlpha=a;g.fillStyle=p.col;g.save();g.translate(p.x,p.y);g.rotate(p.t*.2+p.r);g.fillRect(-p.r,-p.r*.6*Math.cos(p.t*.3),p.r*2,p.r*1.2*Math.cos(p.t*.3));g.restore();}
    else if(p.kind==='flame'){g.globalAlpha=1;glow(p.x,p.y,p.r*2.4*(1-q*.5),q<.4?'#ffe08a':'#ff8a3d',(1-q)*.8);}
    else{g.globalAlpha=a;g.fillStyle=p.col;circ(p.x,p.y,p.r*(1-q*.4));g.fill();}}
  g.globalAlpha=1;
  for(const c of B.coins){if(c.t<0)continue;const q=c.t/c.T,e=q*q,u=1-e,x=u*u*c.sx+2*u*e*c.cx+e*e*180,y=u*u*c.sy+2*u*e*c.cy+e*e*31;icoCoin(x,y,4.6*(1-q*.25));}
  for(const n of B.nums){const a=Math.min(1,(44-n.t)/12),pop=1+Math.max(0,(7-n.t)/7)*.8;g.globalAlpha=a;txt(n.s,n.x,n.y-Math.min(n.t,30)*.6,n.sz*pop,n.col,'center',INK,Math.max(2.4,n.sz*.24));}g.globalAlpha=1;
  if(B.aim==='bomb'){const x=PTR.down?PTR.x/K:225,y=PTR.down?PTR.y/K:400;g.fillStyle='rgba(255,90,74,.16)';g.strokeStyle='rgba(255,90,74,.95)';g.lineWidth=2.4;g.setLineDash([7,5]);g.lineDashOffset=-B.time*30;circ(x,y,SKILL.bomb.r);g.fill();g.stroke();g.setLineDash([]);g.lineDashOffset=0;}
  if(B.leakFlash>0){const a=B.leakFlash/20;const gr=g.createLinearGradient(0,GATE_Y-140,0,H);gr.addColorStop(0,'rgba(255,60,50,0)');gr.addColorStop(1,'rgba(255,60,50,'+(a*.45)+')');g.fillStyle=gr;g.fillRect(0,GATE_Y-140,W,H);}
  // 다음 파도 미리 보기: 길 입구에 말풍선
  if((run.ws==='prep'||run.ws==='gap')&&run.next){const d=run.next;run.paths.forEach((p,pi)=>{const gs=d.groups.filter(q=>q.path%run.paths.length===pi);if(!gs.length)return;const x=Math.max(70,Math.min(380,p.s[0].x)),y=96+Math.sin(B.time*3)*2,w=gs.length*44+10;
      g.fillStyle='rgba(255,253,243,.95)';g.strokeStyle=INK;g.lineWidth=1.8;rr(x-w/2,y-17,w,34,12);g.fill();g.stroke();g.beginPath();g.moveTo(x-6,y+17);g.lineTo(x,y+25);g.lineTo(x+6,y+17);g.fill();
      gs.forEach((q,k)=>{const xx=x-w/2+24+k*44,key=q.k==='boss'?run.S.boss:q.k;drawSpr(key,xx-7,y+1,26);txt('×'+q.n,xx+15,y+3,10,INK);});});}
}

/* ---------- 메뉴: 자리를 누르면 둘레에 고를 것이 뜬다. 한 번 누르면 설명, 한 번 더 누르면 실행 ---------- */
function menuCenter(sp){return {x:Math.max(168,Math.min(VW-168,sp.x*K)),y:Math.max(330,Math.min(1010,sp.y*K-20))};}
function roundBtn(x,y,r,on,off,fn,drawIn){g.fillStyle='rgba(60,36,20,.3)';circ(x,y+6,r);g.fill();g.fillStyle=off?'#d8d0c2':on?'#8ee0bf':CREAM;circ(x,y,r);g.fill();g.lineWidth=5;g.strokeStyle=on?'#2f8f6f':INK;g.stroke();drawIn();zone(x-r,y-r,r*2,r*2,fn);}
function costTag(x,y,c,ok){font(24);const w=g.measureText(String(c)).width+46;g.fillStyle=ok?'#fff6d6':'#e6ded0';rr(x-w/2,y-17,w,34,17);g.fill();g.lineWidth=3.5;g.strokeStyle=INK;g.stroke();icoCoin(x-w/2+18,y,11);txt(c,x+10,y+1,24,ok?INK:'#b0482f');}
function drawMenu(){
  if(B.sel<0||run.phase!=='run')return;const sp=run.spots[B.sel],tw=sp.tw,c=menuCenter(sp),R=146;let info=null;
  if(!tw){const ids=run.owned,n=ids.length;
    ids.forEach((id,k)=>{const a=-1.5708+(k-(n-1)/2)*(n>4?1.02:1.15),x=c.x+Math.cos(a)*R*(n>4?1.08:1),y=c.y+Math.sin(a)*R*(n>4?1.08:1)+ (n>4&&(k===0||k===n-1)?-10:0),cost=towerCost(id),ok=run.gold>=cost,on=B.pick===id;
      roundBtn(x,y,56,on,!ok,()=>{if(on){if(build(run,B.sel,id)){B.sel=-1;B.pick='';}else{sfx('nope');toast(L('골드가 모자라요','金币不够'));}}else{B.pick=id;sfx('btn');}},()=>{if(on){drawImg(HERO_IMG[id],x,y+40,74,{a:.35});txt('✓',x,y,60,'#1f7a5a','center','#fff',10);}else drawImg(HERO_IMG[id],x,y+44,84,{a:ok?1:.5});});
      costTag(x,y+62,cost,ok);});
    if(B.pick){const b=TOWERS[B.pick];info={t:LL(HN[B.pick])+'  ·  '+L('한 번 더 누르면 지어요','再点一次建造'),d:LL(TROLE[B.pick]),r:b.range*heroMul(1)};}
    else info={t:L('어떤 타워를 지을까요?','要建哪种塔？'),d:L('타워를 누르면 설명이 나와요','点一下塔可以看说明')};
  }else{const st=towerStat(run,tw),cost=upCost(tw),ok=run.gold>=cost;
    if(tw.lv<3){const on=B.pick==='up';roundBtn(c.x,c.y-R,60,on,!ok,()=>{if(on){if(upgrade(run,B.sel)){B.pick='';}else{sfx('nope');toast(L('골드가 모자라요','金币不够'));}}else{B.pick='up';sfx('btn');}},()=>{if(on)txt('✓',c.x,c.y-R,64,'#1f7a5a','center','#fff',10);else{g.fillStyle=ok?MINT:GREY_D;g.strokeStyle=INK;g.lineWidth=4;g.lineJoin='round';g.beginPath();g.moveTo(c.x,c.y-R-30);g.lineTo(c.x+28,c.y-R);g.lineTo(c.x+12,c.y-R);g.lineTo(c.x+12,c.y-R+26);g.lineTo(c.x-12,c.y-R+26);g.lineTo(c.x-12,c.y-R);g.lineTo(c.x-28,c.y-R);g.closePath();g.fill();g.stroke();}});costTag(c.x,c.y-R+66,cost,ok);}
    else if(tw.lv===3){BRANCH[tw.id].forEach((br,k)=>{const x=c.x+(k?1:-1)*104,y=c.y-R+26,on=B.pick===br;
        roundBtn(x,y,62,on,!ok,()=>{if(on){if(upgrade(run,B.sel,br)){B.pick='';}else{sfx('nope');toast(L('골드가 모자라요','金币不够'));}}else{B.pick=br;sfx('btn');}},()=>{if(on)txt('✓',x,y,64,'#1f7a5a','center','#fff',10);else{icoStar(x,y-12,26,1);txtFit(LL(BR[br]),x,y+30,20,104,INK);}});costTag(x,y+68,cost,ok);});}
    const on=B.pick==='sell',refund=Math.round(tw.spent*SELL);roundBtn(c.x,c.y+R,50,on,false,()=>{if(on){sell(run,B.sel);B.sel=-1;B.pick='';}else{B.pick='sell';sfx('btn');}},()=>{if(on)txt('✓',c.x,c.y+R,54,'#b0482f','center','#fff',9);else{icoCoin(c.x,c.y+R-8,17);txt(L('팔기','出售'),c.x,c.y+R+24,19,INK);}});costTag(c.x,c.y+R+58,'+'+refund,true);
    const name=LL(HN[tw.id])+(tw.br?' · '+LL(BR[tw.br]):'')+'  Lv.'+tw.lv+(tw.lv>=4?' MAX':'');
    if(B.pick==='sell')info={t:name,d:L('한 번 더 누르면 팔아요 (쓴 골드의 70% 돌려받음)','再点一次出售（返还 70% 金币）')};
    else if(BR[B.pick])info={t:LL(BR[B.pick])+'  ·  '+L('한 번 더 누르면 진화','再点一次进阶'),d:BR[B.pick][LANG==='zh'?3:2]};
    else if(B.pick==='up')info={t:name+'  →  Lv.'+(tw.lv+1),d:L('위력 ','威力 ')+Math.round(st.dmg/LV_DMG[tw.lv-1]*LV_DMG[tw.lv]*10)/10+L(' · 사거리 조금 늘어남 · 한 번 더 누르면 강화',' · 射程略增 · 再点一次升级')};
    else info={t:name,d:(tw.br?BR[tw.br][LANG==='zh'?3:2]:LL(TROLE[tw.id]))+'  ·  '+L('위력 ','威力 ')+Math.round(st.dmg*10)/10};
  }
  if(info){const y=sp.y*K>860?150:1086;panel(24,y,702,116,'#fffdf3',26,4);txtFit(info.t,375,y+38,28,660,INK);txtFit(info.d,375,y+82,22,660,'#8a6a4a');}
}
function skillBtn(x,key,label,ready,cdLeft,cdMax,fn,drawIco,active){
  const y=1238,w=124,h=84;btn(x,y,w,h,'',fn,{col:active?'#ffd93d':ready?'#7ad0ff':'#b9c6d0',dk:active?YEL_D:ready?'#3d8fd0':'#8b98a3',icon:(cx,cy)=>{drawIco(cx-34,cy);const cdn=cdLeft>0;txtFit(label,cx+22,cy-(cdn?12:0),19,64,INK);if(cdn)txt(Math.ceil(cdLeft/60),cx+22,cy+16,24,'#5a3620');}});
  if(!ready){g.fillStyle='rgba(40,24,12,.28)';rr(x,y,w*Math.min(1,cdLeft/cdMax),h,26);g.fill();}
}
function drawHud(){
  btn(14,16,76,72,'',()=>{paused=true;sfx('btn');},{col:CREAM,dk:'#d9c8a8',icon:(x,y)=>{g.fillStyle=INK;rr(x-14,y-15,10,30,4);g.fill();rr(x+4,y-15,10,30,4);g.fill();}});
  panel(104,18,150,66,CREAM,22);g.fillStyle='#ff5a4a';g.strokeStyle=INK;g.lineWidth=3.5;g.beginPath();g.moveTo(138,68);g.bezierCurveTo(108,46,122,26,138,40);g.bezierCurveTo(154,26,168,46,138,68);g.fill();g.stroke();txt(run.lives,200,53,32*(1+B.lifeBump*.5),run.lives<=5||B.lifeBump>.2?RED:INK);
  panel(268,18,180,66,CREAM,22);icoCoin(300,51,18);txtFit(Math.floor(run.gold),372,53,32*(1+Math.abs(B.goldBump)*.22),120,B.goldBump<-.2?'#b0482f':INK);
  panel(462,18,170,66,CREAM,22);txt(L('파도','波次'),500,53,19,'#a07a55');txt(Math.max(run.wave,0)+' / '+run.S.waves,576,53,29,INK);
  btn(646,16,90,72,speed>1?'x2':'x1',()=>{speed=speed>1?1:2;S.opt.fast=speed>1?1:0;sfx('btn');},{col:speed>1?YEL:CREAM,dk:speed>1?YEL_D:'#d9c8a8',tc:INK,sz:30});
  if(run.boss&&!run.boss.dead){bar(150,100,450,30,run.boss.hp/run.boss.max,'#ff6b6b');txt('BOSS',375,115,18,'#fff','center',INK,4);}
  // 아래: 스킬 둘 + 다음 파도
  const live=run.ws!=='prep';
  skillBtn(14,'tide',L('큰 파도','大浪'),live&&run.cd.tide<=0,live?run.cd.tide:0,SKILL.tide.cd*60,()=>{if(castTide(run)){mission('skill',1);}else sfx('nope');},(x,y)=>{g.strokeStyle='#fff';g.lineWidth=6;g.lineCap='round';g.beginPath();g.moveTo(x-18,y+8);g.quadraticCurveTo(x-6,y-22,x+8,y-2);g.quadraticCurveTo(x+14,y+8,x+20,y+2);g.stroke();},false);
  skillBtn(150,'bomb',L('야자 폭탄','椰子炸弹'),live&&run.cd.bomb<=0,live?run.cd.bomb:0,SKILL.bomb.cd*60,()=>{if(!live||run.cd.bomb>0){sfx('nope');return;}B.aim=B.aim==='bomb'?'':'bomb';B.sel=-1;sfx('btn');},(x,y)=>{g.fillStyle='#8a5a34';g.strokeStyle=INK;g.lineWidth=3.5;circ(x,y+3,17);g.fill();g.stroke();g.fillStyle='#5a3620';circ(x-6,y-1,2.6);g.fill();circ(x+5,y-1,2.6);g.fill();circ(x,y+8,2.6);g.fill();},B.aim==='bomb');
  const canCall=run.phase==='run'&&run.wave<run.S.waves&&(run.ws==='prep'||run.ws==='gap');
  if(run.ws==='prep'){const pu=1+Math.sin(B.time*5)*.02,need=!run.spots.some(sp=>sp.tw);g.save();g.translate(520,1280);g.scale(pu,pu);g.translate(-520,-1280);btn(300,1234,436,90,L('▶ 시작!','▶ 开始！'),()=>{if(need){sfx('nope');toast(L('먼저 타워를 하나 지어요','先建一座塔吧'));return;}sfx('btn');callWave(run);},{sz:42,off:false,col:need?GREY:RED,dk:need?GREY_D:RED_D});g.restore();
    if(!B.adGold&&run.si>0)btn(300,1150,436,64,L('▶ 광고 보고 시작 골드 +150','▶ 看广告开局金币 +150'),()=>showAd('gold',o=>{if(o){run.gold+=150;B.adGold=true;sfx('reward');}}),{col:YEL,dk:YEL_D,tc:INK,sz:24});}
  else if(canCall){const sec=Math.ceil(run.gapT/60),bonus=Math.round(run.gapT/60*BONUS_PER_SEC);btn(300,1234,436,90,'',()=>{sfx('btn');callWave(run);},{col:MINT,dk:MINT_D,icon:(x,y)=>{txt(L('다음 파도 부르기','提前叫下一波'),x,y-17,27,'#fff','center',INK);icoCoin(x-70,y+22,12);txt('+'+bonus+L('  ·  ','  ·  ')+sec+L('초 뒤 자동','秒后自动'),x+16,y+23,21,'#fff','center',INK,5);}});}
  else{panel(300,1238,436,84,'rgba(255,246,228,.85)',26,4);const left=run.en.length+run.queue.length;txt(run.wave>=run.S.waves?L('마지막 파도! 남은 적 ','最后一波！剩余 ')+left:L('남은 적 ','剩余敌人 ')+left,518,1281,26,INK);}
  if(B.aim==='bomb')txt(L('터뜨릴 곳을 눌러요','点一下要炸的地方'),375,1196,28,'#fff','center',INK,7);
  if(B.banner){const b=B.banner,q=Math.min(1,b.t*5),o=b.t>1.3?(1.6-b.t)/.3:1;g.globalAlpha=Math.max(0,o);const bh=b.big?120:90;g.fillStyle='rgba(60,36,20,.55)';g.fillRect(0,250-bh/2,VW*q,bh);g.fillStyle=b.big?'#ffd93d':'#fff';g.fillRect(0,250-bh/2-6,VW*q,5);g.fillRect(0,250+bh/2+1,VW*q,5);txt(b.text,375+(1-q)*120,250,b.big?70:50,b.col,'center',INK,b.big?16:12);g.globalAlpha=1;}
  if(B.tip&&B.sel<0){panel(24,1086,702,116,'#fffdf3',30);drawImg('tuantuan',84,1194,104);wrap(B.tip.text,150,B.tip.text.length>22?1126:1144,25,550,34,INK,'left',2);}
  // 첫 판 손가락
  if(run.si===0&&run.ws==='prep'&&B.sel<0&&!adOv){if(!run.spots.some(sp=>sp.tw)&&!S.tips.t_build){const sp=run.spots.slice().sort((a,b)=>Math.abs(a.y-300)-Math.abs(b.y-300))[0];icoHand(sp.x*K+26,sp.y*K+40,B.time);}else if(run.spots.some(sp=>sp.tw)&&!S.tips.t_start)icoHand(560,1330,B.time);}
}
function drawRevive(){
  g.fillStyle='rgba(40,24,12,.6)';g.fillRect(0,0,VW,VH);BT.length=0;panel(75,420,600,470,CREAM,36);
  drawImg('didi_sick',375,590,130);txt(L('마을 대문이 뚫렸어요!','镇门被攻破了！'),375,640,44,INK);txt(L('목숨 10으로 다시 버텨 볼까요? (한 판에 1번)','恢复 10 点生命再坚持一下？（每局 1 次）'),375,694,23,'#a07a55');
  btn(125,738,500,96,L('▶ 광고 보고 이어 하기','▶ 看广告继续'),()=>showAd('revive',o=>{if(o)revive(run);}),{col:YEL,dk:YEL_D,tc:INK,sz:32});
  btn(255,920,240,70,L('그만하기','不用了'),()=>{sfx('btn');giveUp(run);},{col:GREY,dk:GREY_D,sz:26});
}
function drawPause(){
  g.fillStyle='rgba(40,24,12,.6)';g.fillRect(0,0,VW,VH);BT.length=0;panel(115,380,520,560,CREAM,36);txt(L('잠깐 쉬는 중','暂停中'),375,450,46,INK);
  btn(175,510,400,96,L('계속하기','继续'),()=>{paused=false;sfx('btn');},{sz:36});
  btn(175,636,400,84,L('처음부터 다시','重新开始'),()=>{sfx('btn');track('stage_quit',{stage:run.si+1,wave:run.wave});startBattle(run.si);},{col:MINT,dk:MINT_D,sz:30});
  btn(175,746,400,84,L('나가기','退出'),()=>{sfx('btn');track('stage_quit',{stage:run.si+1,wave:run.wave});goHome();},{col:GREY,dk:GREY_D,sz:30});
  btn(175,856,190,64,L('음악 ','音乐 ')+(S.opt.bgm?'ON':'OFF'),()=>{S.opt.bgm^=1;musicSync();persist();},{col:CREAM,dk:'#d9c8a8',tc:INK,sz:22});
  btn(385,856,190,64,L('효과음 ','音效 ')+(S.opt.sfx?'ON':'OFF'),()=>{S.opt.sfx^=1;persist();},{col:CREAM,dk:'#d9c8a8',tc:INK,sz:22});
}
function drawBattle(){
  const sh=S.opt.shake?B.shake:0;g.save();if(sh>.4)g.translate(rnd(-sh,sh),rnd(-sh,sh));
  g.drawImage(B.map,0,0);g.save();g.scale(K,K);drawSea();drawDecals();drawSpots();drawEnemies();drawTowers();drawProj();drawFx();g.restore();g.restore();
  drawHud();drawMenu();
  if(run.phase==='revive')drawRevive();else if(paused)drawPause();
}
function drawSea(){ // 물결 반짝임과 파도선(배경 위에 살짝)
  const t=B.time;g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=2.5;g.lineCap='round';g.beginPath();for(let x=0;x<=W;x+=18){const y=shoreY(x)+2+Math.sin(x*.07+t*2)*2.5;if(x)g.lineTo(x,y);else g.moveTo(x,y);}g.stroke();
  g.strokeStyle='rgba(255,255,255,.3)';g.lineWidth=2;for(let i=0;i<5;i++){const x=40+i*92+Math.sin(t*.7+i)*14,y=74+(i%2)*22+Math.sin(t*1.3+i*2)*3;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+12,y-5,x+24,y);g.stroke();}
}

/* ---------- 조작 (누르기만) ---------- */
function battleDown(){}
function battleUp(x,y){
  if(paused||adOv||run.phase!=='run')return false;const lx=x/K,ly=y/K;
  if(B.aim==='bomb'){if(ly>60&&ly<735){if(castBomb(run,lx,ly)){B.aim='';mission('skill',1);}}return true;}
  let best=-1,bd=34*34;run.spots.forEach((sp,i)=>{const d=(sp.x-lx)**2+(sp.y-12-ly)**2;if(d<bd){bd=d;best=i;}});
  if(best>=0){const tw=run.spots[best].tw;if(tw&&tw.ink>0){cleanInk(run,best);return true;}B.sel=B.sel===best?-1:best;B.pick='';sfx('btn');return true;}
  if(B.sel>=0){B.sel=-1;B.pick='';return true;}return false;
}
