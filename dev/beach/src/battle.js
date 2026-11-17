/* ============================== 전투 화면 (타워 디펜스 · 간식으로 배불려 돌려보내기): 규칙(core.js)이 알려 준 일을 그림·소리·진동으로 바꾼다 ============================== */
const HN={tt:['만두 찜통','包子蒸笼'],didi:['빙수 가게','刨冰摊'],peng:['팝콘 수레','爆米花车'],shan:['등롱 찻집','灯笼茶摊'],dun:['탕후루 가게','糖葫芦摊'],zhuo:['찹쌀떡 가게','年糕摊']};
const OWNER={tt:['퇀퇀','团团'],didi:['방울이','滴滴'],peng:['펑펑','砰砰'],shan:['반짝','闪闪'],dun:['둥둥','墩墩'],zhuo:['쫑쫑','啄啄']};
const HCOL={tt:'#ffb199',didi:'#9fd8ff',peng:'#ffcf7a',shan:'#bfe6c8',dun:'#ffc2cf',zhuo:'#e6dcc0'};
const TROLE={tt:['만두를 던져 여럿을 한꺼번에 먹여요 (땅의 손님만)','扔包子，一次喂饱一片（仅地面）'],didi:['빙수를 빠르게 뿌려요 · 먹으면 느려짐','快速撒刨冰 · 吃了会变慢'],peng:['팝콘이 멀리 날아가 펑! · 껍데기 손님이 좋아함','爆米花飞得远，砰！· 硬壳客最爱'],
  shan:['차 향기 · 편식쟁이도 잘 먹고, 오래 맡을수록 잘 먹음','茶香 · 挑食的也爱吃，闻得越久吃得越多'],dun:['탕후루 꼬치 · 가장 배고픈 큰 손님에게 한 방','糖葫芦串 · 专喂最饿的大块头'],zhuo:['끈적한 찹쌀떡 · 여럿을 느리게, 근처 팁 +1','黏黏年糕 · 减速一片，附近小费+1']};
const BR={king:['왕만두','大肉包','범위 +55%, 먹느라 잠깐 멈춤','范围+55%，吃得停一下'],twin:['쌍찜통','双层蒸笼','한 번에 만두 2개','一次扔 2 个包子'],ice:['팥빙수','红豆冰','65% 느려짐, 2초','减速65%，持续2秒'],jet:['슬러시 물줄기','冰沙喷泉','한 줄로 선 손님을 모두 먹임','喂到一整排客人'],
  dragon:['매운 팝콘','麻辣爆米花','떨어진 자리에 3초 동안 매운 향','落点留下 3 秒麻辣香'],star:['캐러멜 팝콘','焦糖爆米花','작은 팝콘이 3번 더 터짐','再爆 3 次小爆米花'],rainbow:['꽃차','花茶','옆의 손님 2명에게도 향이 번짐','茶香飘到旁边 2 位客人'],moon:['진한 보이차','浓普洱','향을 맡은 손님이 35% 더 잘 먹음','闻到的客人多吃 35%'],
  smash:['왕꼬치','巨无霸糖葫芦','정예·보스에게 3배','喂精英和BOSS 3 倍'],double:['쌍꼬치','双串','2명을 동시에 먹임','同时喂 2 位'],express:['소문난 맛집','网红摊','근처 팁 +3','附近小费+3'],parcel:['왕찹쌀떡','大年糕','5배로 먹이고 범위 +25%','喂 5 倍，范围+25%']};
const rnd=(a,b)=>a+Math.random()*(b-a);
let run=null,B=null,paused=false,speed=1;

function startBattle(si,bonusGold){
  S.sel=si;const owned=TOWER_IDS.filter(id=>S.lv[id]);
  run=newGame(si,{seed:(Date.now()%100000)|0,lv:S.lv,owned,gold:bonusGold||0});
  B={parts:[],nums:[],rings:[],fly:[],flashes:[],decals:[],coins:[],pillars:[],pop:{},stop:0,wet:0,goldBump:0,lifeBump:0,shake:0,banner:null,sel:-1,pick:'',aim:'',endT:-1,tip:null,time:0,tide:0,leakFlash:0,adGold:!!bonusGold,map:mkMap(si),hint:0};
  paused=false;speed=S.opt.fast?2:1;scr='battle';wantMusic('play');S.stat.runs++;mission('run',1);track('stage_start',{stage:si+1});
  tip('start',L('빈 모래 자리를 눌러 간식 가게를 차리고, 준비되면 시작을 눌러요','点空沙堆摆小吃摊，准备好就点开始'),8);persist();
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
  if(kind==='fw'){flash(x,y,r*1.5,'#fff3c0',6);ring(x,y,r,'#fff3c0',3,14);for(let i=0;i<11;i++){const a=Math.random()*6.283,v=rnd(1.4,3.6);P('pop',x,y,Math.cos(a)*v,Math.sin(a)*v-1.6,rnd(22,34),rnd(2.6,3.8),i%3?'#fff6d0':'#ffd24d',.16,.97);}sfx('ex_fw');}
  else if(kind==='bun'){flash(x,y,r*1.6,'#ffffff',6);ring(x,y,r,'#ffffff',3.5,14);smoke(x,y,5,r*.55);burst(x,y,4,['#fff','#ffe9c8'],2.2,2.4);sfx('ex_bun');}
  else if(kind==='bomb'){flash(x,y,r*2.4,'#ff8a8a',9);ring(x,y,r,'#ff6b6b',6,18);ring(x,y,r*1.4,'#5cc46a',3,22);burst(x,y,16,['#ff5a5a','#ff8a8a','#3fa650'],6,4);burst(x,y,8,'#3a2a20',4,1.6);decal(x,y,r*.75,240);shake(11);vib(50);hitStop(.07);sfx('ex_bomb');}
  else{flash(x,y,r*1.2,'#ffffff',5);ring(x,y,r,'#fffdf6',4,16);for(let i=0;i<6;i++)P('pop',x,y,rnd(-2,2),rnd(-2.4,-.6),rnd(22,32),rnd(2.6,3.6),'#fffdf6',.14,.96);sfx('splash');}
}
function consumeFx(){
  for(const f of run.fx){switch(f.e){
    case 'hit':{const big=f.v>=30;if(big||f.weak)floatTxt(f.x+rnd(-7,7),f.y-12,Math.round(f.v),f.weak?'#ffb347':f.v>=120?'#ffd93d':'#fff',f.v>=120?15:f.v>=60?12:10);else if(f.res&&Math.random()<.3)floatTxt(f.x,f.y-12,L('편식!','挑食！'),'#c8d6e4',9);
      if(B.flashes.length<26){flash(f.x,f.y,big?13:8,f.res?'#c8d6e4':'#ffffff',4);if(big||Math.random()<.4)burst(f.x,f.y,big?3:2,['#fff3d6','#f0d9a8'],1.8,1.6);}sfx('hit');break;}
    case 'die':{const boss=f.k==='boss',el=f.k==='elite',col=ECOL[f.k]||'#fff';B.fly.push({k:boss?f.bk:f.k,x:f.x,y:f.y,t:0,r:ENEMIES[f.k].r,air:f.air,dir:f.x<225?-1:1});
      ring(f.x,f.y,ENEMIES[f.k].r*1.5,'#ffd0dc',3,12);for(let i=0;i<(boss?10:el?5:2);i++)P('heart',f.x+rnd(-8,8),f.y-6,rnd(-.8,.8),rnd(-1.8,-.9),rnd(26,38),rnd(3,4.4),'#ff7a9a',0,.98);flash(f.x,f.y,ENEMIES[f.k].r*(boss?4:1.8),'#fff3d6',boss?10:5);if(boss||el||Math.random()<.22)floatTxt(f.x,f.y-30,boss?L('배 터지겠다!','撑死啦！'):L('배불러!','吃饱啦！'),'#fff',boss?15:10);
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
      if(f.w===2)tip('up',L('가게를 누르면 키울 수 있어요. 3단계 다음엔 두 가지 새 메뉴 중 하나!','点一下小吃摊可以升级，3 级之后新菜单二选一！'),7);if(f.w===3)tip('skill',L('아래 큰 파도·왕수박은 급할 때 직접 써요','下方的大浪和大西瓜，紧急时自己放'),7);break;
    case 'waveClear':floatTxt(225,400,L('모두 배불렀어요! +','都吃饱啦！+')+f.g,'#ffd93d',17);coins(225,390,5);sfx('wclear');if(f.w===1)tip('early',L('다음 파도를 미리 부르면 남은 시간만큼 골드를 더 받아요','提前叫下一波，可按剩余时间多拿金币'),7);break;
    case 'bonus':floatTxt(330,700,'+'+f.g,'#ffd93d',15);coins(330,700,3);sfx('bonus');break;
    case 'leak':B.leakFlash=20;B.lifeBump=1;shake(6);vib(40);hitStop(.03);burst(f.x,GATE_Y-6,10,['#fff','#ffe0b0'],4,3);tip('leak',L('놓친 손님은 마을 간식을 훔쳐 가요. 간식이 0이 되면 끝!','没喂饱的客人会偷走小镇的点心，点心为 0 就结束！'),7);ring(f.x,GATE_Y,34,'#ff5a4a',4,16);floatTxt(f.x,f.y-26,'-'+f.n,'#ff5a4a',16);sfx('leak');break;
    case 'ink':{const sp=run.spots[f.i];burst(sp.x,sp.y-26,10,'#4a3a6a',3,3.4);sfx('ink');tip('ink',L('먹물 장난! 먹물 묻은 가게는 멈춰요. 눌러서 닦아 줘요','墨汁恶作剧！被喷到的小吃摊会停工，点一下擦干净'),7);break;}
    case 'inkClear':{const sp=run.spots[f.i];sfx('clear');burst(sp.x,sp.y-24,8,'#4a3a6a',3,3);stars(sp.x,sp.y-26,6,'#fff',3);break;}
    case 'summon':ring(f.x,f.y,40,'#ffffff',4,18);burst(f.x,f.y,10,'#fff',3);if(f.bk==='whale'){banner(L('고래 파도! 적이 빨라져요','鲸浪！敌人加速'),0,'#bfe8ff');sfx('tide');}break;
    case 'tide':B.tide=52;sfx('tide');shake(7);vib(40);break;
    case 'down':sfx('over');break;
    case 'revive':sfx('reward');stars(225,GATE_Y-10,30,['#ffd93d','#fff'],6);ring(225,GATE_Y,80,'#ffe9a0',6,24);break;
    case 'win':sfx('win');wantMusic('menu');B.endT=2.2;B.sel=-1;for(let i=0;i<60;i++)P('paper',rnd(0,450),rnd(-220,0),rnd(-1,1),rnd(2,5),120,rnd(3,5),FW_COL[i%5],0,1);break;
    case 'lose':B.endT=1.3;B.sel=-1;break;
  }}
  run.fx.length=0;
  if(run.en.some(e=>e.air))tip('air',L('갈매기는 길을 무시하고 날아와요. 만두와 찹쌀떡은 하늘까지 못 던져요','海鸥会直接飞过来，包子和年糕扔不到天上'),7);
  if(run.en.some(e=>e.armor>=.5))tip('armor',L('편식쟁이(파란 막대)는 빙수와 차를 잘 먹어요. 소라게는 만두와 팝콘을 좋아해요','挑食的客人（蓝条）爱吃刨冰和茶，寄居蟹最爱包子和爆米花'),7);
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
  for(const o of B.fly)o.t+=f;B.fly=B.fly.filter(o=>o.t<38);
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
    const sp=run.spots[i],tw=sp.tw,hgt=IMG['tw_'+tw.id]?(drawShadow(sp.x,sp.y),14):drawBase(sp.x,sp.y,tw.lv,tw.br),st=tw.anim>0?tw.anim/10:0,br=Math.sin(t*3+i)*.02;
    if(tw.lv>=4){g.fillStyle='rgba(255,217,61,'+(.22+Math.sin(t*4)*.06)+')';g.beginPath();g.ellipse(sp.x,sp.y-hgt-22,30,32,0,0,6.2832);g.fill();}
    if(IMG['tw_'+tw.id])drawImg('tw_'+tw.id,sp.x,sp.y+12-st*3,66+tw.lv*3,{sx:1+br-st*.06,sy:1-br+st*.09,a:tw.ink>0?.75:1});else drawStall(tw.id,sp.x,sp.y-hgt+3,(.9+tw.lv*.045)*(1+br-st*.06),(.9+tw.lv*.045)*(1-br+st*.09),t,st,tw.ink>0?.75:1);
    for(let k=0;k<Math.min(3,tw.lv);k++){g.fillStyle=tw.lv>=4?'#ffd93d':'#fff';g.strokeStyle=INK;g.lineWidth=1.2;circ(sp.x-8+k*8,sp.y+13,3);g.fill();g.stroke();}
    if(tw.ink>0){g.fillStyle='rgba(50,38,80,.88)';circ(sp.x-5,sp.y-hgt-26,17);g.fill();circ(sp.x+11,sp.y-hgt-14,12);g.fill();circ(sp.x-12,sp.y-hgt-10,9);g.fill();icoHand(sp.x+16,sp.y-hgt+8,t,.42);}
    else if(tw.lv<4&&run.gold>=upCost(tw)&&B.sel!==i){const bo=Math.abs(Math.sin(t*4+i))*3;g.fillStyle='#5cc4a4';g.strokeStyle=INK;g.lineWidth=1.6;g.beginPath();g.moveTo(sp.x+20,sp.y-hgt-44-bo);g.lineTo(sp.x+28,sp.y-hgt-34-bo);g.lineTo(sp.x+23,sp.y-hgt-34-bo);g.lineTo(sp.x+23,sp.y-hgt-27-bo);g.lineTo(sp.x+17,sp.y-hgt-27-bo);g.lineTo(sp.x+17,sp.y-hgt-34-bo);g.lineTo(sp.x+12,sp.y-hgt-34-bo);g.closePath();g.fill();g.stroke();}
  g.restore();}
  // 등롱 빛줄기
  for(const sp of run.spots){const tw=sp.tw;if(!tw||tw.id!=='shan'||!tw.tgt||tw.ink>0||!tw.links)continue;let px=sp.x,py=sp.y-[0,10,15,20,24][tw.lv]-26;
    for(const id of tw.links){const e=run.en.find(q=>q.id===id);if(!e)break;const w=2+tw.ramp*.28;g.lineCap='round';g.strokeStyle='rgba(255,255,255,.4)';g.lineWidth=w+6+Math.sin(t*30)*1.5;g.beginPath();g.moveTo(px,py);g.lineTo(e.x,e.y);g.stroke();glow(e.x,e.y,9+tw.ramp*.8,'#ffe9a0',.8);glow(px,py,8,'#ffe9a0',.6);g.strokeStyle=tw.br==='rainbow'?'#ffc2d6':tw.br==='moon'?'#e9c9a0':'#fffaf0';g.lineWidth=w;g.stroke();px=e.x;py=e.y;}}
}
function drawDecals(){
  for(const d of B.decals){const a=Math.min(1,(d.life-d.t)/50)*.28;g.fillStyle='rgba(70,45,25,'+a+')';g.beginPath();g.ellipse(d.x,d.y+2,d.r,d.r*.55,0,0,6.2832);g.fill();}
  if(B.wet>0){g.fillStyle='rgba(110,190,225,'+(B.wet/70*.16)+')';g.fillRect(0,100,W,GATE_Y-90);}
}
function drawEnemies(){
  const es=run.en.slice().sort((a,b)=>(a.air?1e4:0)+a.y-((b.air?1e4:0)+b.y)),t=run.t;
  for(const o of B.fly){const q=o.t/38,e2=q*q,hop=Math.abs(Math.sin(q*3.1416*4))*9,x=o.air?o.x+o.dir*e2*260:o.x+Math.sin(q*9)*3,y=o.air?o.y-e2*120:o.y+(60-o.y)*e2-hop,s=o.r*3.4*(1.12-q*.3),a=q>.72?(1-q)/.28:1;drawSpr(o.k,x,y,s,{a,sx:1.08,sy:.96});}
  for(const e of es){const k=sprKey(e),size=e.r*3.4,bob=1+Math.sin(t*.2+e.ph)*.05,h=e.hit/6;let y=e.y+e.r*.25;
    if(e.air){g.fillStyle='rgba(60,40,20,.14)';g.beginPath();g.ellipse(e.x,e.y+26,e.r*.8,e.r*.3,0,0,6.2832);g.fill();y-=6+Math.sin(t*.15+e.ph)*3;}
    else{g.fillStyle='rgba(60,40,20,.18)';g.beginPath();g.ellipse(e.x,e.y+e.r*.8,e.r*.9,e.r*.32,0,0,6.2832);g.fill();if(e.k==='fish')y-=Math.abs(Math.sin(t*.16+e.ph))*8;}
    if(e.slow>0){g.fillStyle='rgba(150,215,255,.5)';g.beginPath();g.ellipse(e.x,e.y+e.r*.8,e.r*1.25,e.r*.48,0,0,6.2832);g.fill();g.strokeStyle='rgba(255,255,255,.8)';g.lineWidth=1;g.stroke();}
    if(e.shred>0)glow(e.x,y-e.r*.3,e.r*2.2,'#ffe9a0',.35);
    const o={sx:bob*(1+h*.2),sy:(2-bob)*(1-h*.16)};drawSpr(k,e.x,y-h*2,size,o);if(h>0)drawSpr(k,e.x,y-h*2,size,{sx:o.sx,sy:o.sy,white:1,a:h*.85});
    if(e.stun>0)for(let i=0;i<2;i++){const a=B.time*7+i*3.14;txt('★',e.x+Math.cos(a)*e.r*.8,e.y-e.r-8+Math.sin(a)*3,8,'#ffd93d','center',INK,2);}
    if(e.hp<e.max*.999||e.k==='elite'||e.k==='boss'){const w=Math.max(18,e.r*1.9),yy=y-size*.5-3,full=Math.max(0,Math.min(1,1-e.hp/e.max));g.fillStyle=e.armor>=.5?'rgba(40,70,110,.8)':'rgba(60,36,20,.75)';rr(e.x-w/2-1,yy-1,w+2,5.5,2.5);g.fill();g.fillStyle=full>.7?'#7ddc6a':full>.35?'#ffd24d':'#ffb347';rr(e.x-w/2,yy,Math.max(1.5,w*full),3.5,1.7);g.fill();}
  }
}
const TRAIL={fw:'255,236,170',bun:'255,255,255',drop:'190,232,255',ball:'255,150,150',mail:'255,255,255'};
function drawProj(){
  for(const z of run.zones){glow(z.x,z.y,z.r*1.5,'#ff6b4a',.26+Math.sin(B.time*9)*.07);}
  for(const p of run.pr){const q=projPos(p),x=q[0],y=q[1],tr=p.tr;
    if(tr&&tr.length>=4){g.lineCap='round';for(let i=2;i<tr.length;i+=2){const a=i/tr.length;g.strokeStyle='rgba('+TRAIL[p.k]+','+(a*.7)+')';g.lineWidth=(p.k==='fw'?4.5:3.2)*a;g.beginPath();g.moveTo(tr[i-2],tr[i-1]);g.lineTo(tr[i],tr[i+1]);g.stroke();}}
    g.strokeStyle=INK;g.lineWidth=1.3;
    if(p.k==='fw'){g.fillStyle='#fff6d0';for(const d of [[-2.6,-1],[2.6,-.6],[0,2.4],[0,-3]]){circ(x+d[0],y+d[1],2.9);g.fill();g.stroke();}g.fillStyle='#ffd24d';circ(x,y,2.2);g.fill();}                       // 팝콘
    else if(p.k==='bun'){const s=1+Math.sin(p.t*.5)*.08;g.fillStyle='#fff';g.lineWidth=1.6;g.beginPath();g.ellipse(x,y,5.8*s,5.8/s,0,0,6.2832);g.fill();g.stroke();g.beginPath();g.arc(x,y-1,2.4,3.6,5.8);g.stroke();}   // 만두
    else if(p.k==='drop'){g.save();g.translate(x,y);g.rotate(p.t*.3);g.fillStyle='#eaf8ff';g.strokeStyle='#5aa8dc';rr(-(p.line?5:3.6),-(p.line?5:3.6),p.line?10:7.2,p.line?10:7.2,2);g.fill();g.stroke();g.fillStyle='#ff9ab0';circ(0,0,1.4);g.fill();g.restore();}  // 빙수 얼음
    else if(p.k==='ball'){const a=Math.atan2(p.ty-y,p.tx-x);g.save();g.translate(x,y);g.rotate(a);g.strokeStyle='#c9a15f';g.lineWidth=1.6;g.beginPath();g.moveTo(-9,0);g.lineTo(9,0);g.stroke();g.strokeStyle='#8a1f1a';g.lineWidth=1;for(let i=0;i<3;i++){g.fillStyle='#e8362e';circ(-4+i*5.2,0,2.9);g.fill();g.stroke();}g.restore();}  // 탕후루
    else{const s=1+Math.sin(p.t*.6)*.12;g.fillStyle='#fffdf6';g.lineWidth=1.4;g.beginPath();g.ellipse(x,y,6.4*s,5.2/s,0,0,6.2832);g.fill();g.stroke();}}                                                              // 찹쌀떡
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
    else if(p.kind==='pop'){g.globalAlpha=a;g.fillStyle=p.col;g.strokeStyle='rgba(90,54,32,.55)';g.lineWidth=.9;circ(p.x,p.y,p.r);g.fill();g.stroke();}
    else if(p.kind==='heart'){const s=p.r*(1+Math.sin(p.t*.5)*.12);g.globalAlpha=a;g.fillStyle=p.col;g.beginPath();g.moveTo(p.x,p.y+s);g.bezierCurveTo(p.x-s*1.7,p.y-s*.2,p.x-s*.7,p.y-s*1.4,p.x,p.y-s*.45);g.bezierCurveTo(p.x+s*.7,p.y-s*1.4,p.x+s*1.7,p.y-s*.2,p.x,p.y+s);g.fill();}
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
      roundBtn(x,y,56,on,!ok,()=>{if(on){if(build(run,B.sel,id)){B.sel=-1;B.pick='';}else{sfx('nope');toast(L('골드가 모자라요','金币不够'));}}else{B.pick=id;sfx('btn');}},()=>{if(on){stallIcon(id,x,y+34,.35);txt('✓',x,y,60,'#1f7a5a','center','#fff',10);}else stallIcon(id,x,y+36,ok?1:.5);});
      costTag(x,y+62,cost,ok);});
    if(B.pick){const b=TOWERS[B.pick];info={t:LL(HN[B.pick])+'  ·  '+L('한 번 더 누르면 차려요','再点一次开张'),d:LL(TROLE[B.pick]),r:b.range*heroMul(1)};}
    else info={t:L('어떤 가게를 차릴까요?','要摆哪种小吃摊？'),d:L('가게를 누르면 설명이 나와요','点一下可以看说明')};
  }else{const st=towerStat(run,tw),cost=upCost(tw),ok=run.gold>=cost;
    if(tw.lv<3){const on=B.pick==='up';roundBtn(c.x,c.y-R,60,on,!ok,()=>{if(on){if(upgrade(run,B.sel)){B.pick='';}else{sfx('nope');toast(L('골드가 모자라요','金币不够'));}}else{B.pick='up';sfx('btn');}},()=>{if(on)txt('✓',c.x,c.y-R,64,'#1f7a5a','center','#fff',10);else{g.fillStyle=ok?MINT:GREY_D;g.strokeStyle=INK;g.lineWidth=4;g.lineJoin='round';g.beginPath();g.moveTo(c.x,c.y-R-30);g.lineTo(c.x+28,c.y-R);g.lineTo(c.x+12,c.y-R);g.lineTo(c.x+12,c.y-R+26);g.lineTo(c.x-12,c.y-R+26);g.lineTo(c.x-12,c.y-R);g.lineTo(c.x-28,c.y-R);g.closePath();g.fill();g.stroke();}});costTag(c.x,c.y-R+66,cost,ok);}
    else if(tw.lv===3){BRANCH[tw.id].forEach((br,k)=>{const x=c.x+(k?1:-1)*104,y=c.y-R+26,on=B.pick===br;
        roundBtn(x,y,62,on,!ok,()=>{if(on){if(upgrade(run,B.sel,br)){B.pick='';}else{sfx('nope');toast(L('골드가 모자라요','金币不够'));}}else{B.pick=br;sfx('btn');}},()=>{if(on)txt('✓',x,y,64,'#1f7a5a','center','#fff',10);else{icoStar(x,y-12,26,1);txtFit(LL(BR[br]),x,y+30,20,104,INK);}});costTag(x,y+68,cost,ok);});}
    const on=B.pick==='sell',refund=Math.round(tw.spent*SELL);roundBtn(c.x,c.y+R,50,on,false,()=>{if(on){sell(run,B.sel);B.sel=-1;B.pick='';}else{B.pick='sell';sfx('btn');}},()=>{if(on)txt('✓',c.x,c.y+R,54,'#b0482f','center','#fff',9);else{icoCoin(c.x,c.y+R-8,17);txt(L('팔기','出售'),c.x,c.y+R+24,19,INK);}});costTag(c.x,c.y+R+58,'+'+refund,true);
    const name=LL(HN[tw.id])+(tw.br?' · '+LL(BR[tw.br]):'')+'  Lv.'+tw.lv+(tw.lv>=4?' MAX':'');
    if(B.pick==='sell')info={t:name,d:L('한 번 더 누르면 팔아요 (쓴 골드의 70% 돌려받음)','再点一次出售（返还 70% 金币）')};
    else if(BR[B.pick])info={t:LL(BR[B.pick])+'  ·  '+L('한 번 더 누르면 새 메뉴','再点一次上新菜'),d:BR[B.pick][LANG==='zh'?3:2]};
    else if(B.pick==='up')info={t:name+'  →  Lv.'+(tw.lv+1),d:L('맛 ','美味 ')+Math.round(st.dmg/LV_DMG[tw.lv-1]*LV_DMG[tw.lv]*10)/10+L(' · 닿는 거리 조금 늘어남 · 한 번 더 누르면 키움',' · 范围略增 · 再点一次升级')};
    else info={t:name,d:(tw.br?BR[tw.br][LANG==='zh'?3:2]:LL(TROLE[tw.id]))+'  ·  '+L('맛 ','美味 ')+Math.round(st.dmg*10)/10};
  }
  if(info){const y=sp.y*K>860?150:1086;panel(24,y,702,116,'#fffdf3',26,4);txtFit(info.t,375,y+38,28,660,INK);txtFit(info.d,375,y+82,22,660,'#8a6a4a');}
}
function skillBtn(x,key,label,ready,cdLeft,cdMax,fn,drawIco,active){
  const y=1238,w=124,h=84;btn(x,y,w,h,'',fn,{col:active?'#ffd93d':ready?'#7ad0ff':'#b9c6d0',dk:active?YEL_D:ready?'#3d8fd0':'#8b98a3',icon:(cx,cy)=>{drawIco(cx-34,cy);const cdn=cdLeft>0;txtFit(label,cx+22,cy-(cdn?12:0),19,64,INK);if(cdn)txt(Math.ceil(cdLeft/60),cx+22,cy+16,24,'#5a3620');}});
  if(!ready){g.fillStyle='rgba(40,24,12,.28)';rr(x,y,w*Math.min(1,cdLeft/cdMax),h,26);g.fill();}
}
function drawHud(){
  btn(14,16,76,72,'',()=>{paused=true;sfx('btn');},{col:CREAM,dk:'#d9c8a8',icon:(x,y)=>{g.fillStyle=INK;rr(x-14,y-15,10,30,4);g.fill();rr(x+4,y-15,10,30,4);g.fill();}});
  panel(104,18,150,66,CREAM,22);icoBun(138,52,21);txt(run.lives,200,53,32*(1+B.lifeBump*.5),run.lives<=5||B.lifeBump>.2?RED:INK);
  panel(268,18,180,66,CREAM,22);icoCoin(300,51,18);txtFit(Math.floor(run.gold),372,53,32*(1+Math.abs(B.goldBump)*.22),120,B.goldBump<-.2?'#b0482f':INK);
  panel(462,18,170,66,CREAM,22);txt(L('파도','波次'),500,53,19,'#a07a55');txt(Math.max(run.wave,0)+' / '+run.S.waves,576,53,29,INK);
  btn(646,16,90,72,speed>1?'x2':'x1',()=>{speed=speed>1?1:2;S.opt.fast=speed>1?1:0;sfx('btn');},{col:speed>1?YEL:CREAM,dk:speed>1?YEL_D:'#d9c8a8',tc:INK,sz:30});
  if(run.boss&&!run.boss.dead){bar(150,100,450,30,1-run.boss.hp/run.boss.max,'#ffb347');txt('BOSS · '+L('배부름','饱腹'),375,115,18,'#fff','center',INK,4);}
  // 아래: 스킬 둘 + 다음 파도
  const live=run.ws!=='prep';
  skillBtn(14,'tide',L('큰 파도','大浪'),live&&run.cd.tide<=0,live?run.cd.tide:0,SKILL.tide.cd*60,()=>{if(castTide(run)){mission('skill',1);}else sfx('nope');},(x,y)=>{g.strokeStyle='#fff';g.lineWidth=6;g.lineCap='round';g.beginPath();g.moveTo(x-18,y+8);g.quadraticCurveTo(x-6,y-22,x+8,y-2);g.quadraticCurveTo(x+14,y+8,x+20,y+2);g.stroke();},false);
  skillBtn(150,'bomb',L('왕수박','大西瓜'),live&&run.cd.bomb<=0,live?run.cd.bomb:0,SKILL.bomb.cd*60,()=>{if(!live||run.cd.bomb>0){sfx('nope');return;}B.aim=B.aim==='bomb'?'':'bomb';B.sel=-1;sfx('btn');},(x,y)=>{g.fillStyle='#3fa650';g.strokeStyle=INK;g.lineWidth=3.5;circ(x,y+2,18);g.fill();g.stroke();g.strokeStyle='#1f6b34';g.lineWidth=3;for(const d of [-8,0,8]){g.beginPath();g.moveTo(x+d,y-14);g.quadraticCurveTo(x+d*1.5,y+2,x+d,y+18);g.stroke();}},B.aim==='bomb');
  const canCall=run.phase==='run'&&run.wave<run.S.waves&&(run.ws==='prep'||run.ws==='gap');
  if(run.ws==='prep'){const pu=1+Math.sin(B.time*5)*.02,need=!run.spots.some(sp=>sp.tw);g.save();g.translate(520,1280);g.scale(pu,pu);g.translate(-520,-1280);btn(300,1234,436,90,L('▶ 시작!','▶ 开始！'),()=>{if(need){sfx('nope');toast(L('먼저 가게를 하나 차려요','先摆一个小吃摊吧'));return;}sfx('btn');callWave(run);},{sz:42,off:false,col:need?GREY:RED,dk:need?GREY_D:RED_D});g.restore();
    if(!B.adGold&&run.si>0)btn(300,1150,436,64,L('▶ 광고 보고 시작 골드 +150','▶ 看广告开局金币 +150'),()=>showAd('gold',o=>{if(o){run.gold+=150;B.adGold=true;sfx('reward');}}),{col:YEL,dk:YEL_D,tc:INK,sz:24});}
  else if(canCall){const sec=Math.ceil(run.gapT/60),bonus=Math.round(run.gapT/60*BONUS_PER_SEC);btn(300,1234,436,90,'',()=>{sfx('btn');callWave(run);},{col:MINT,dk:MINT_D,icon:(x,y)=>{txt(L('다음 파도 부르기','提前叫下一波'),x,y-17,27,'#fff','center',INK);icoCoin(x-70,y+22,12);txt('+'+bonus+L('  ·  ','  ·  ')+sec+L('초 뒤 자동','秒后自动'),x+16,y+23,21,'#fff','center',INK,5);}});}
  else{panel(300,1238,436,84,'rgba(255,246,228,.85)',26,4);const left=run.en.length+run.queue.length;txt(run.wave>=run.S.waves?L('마지막 파도! 남은 손님 ','最后一波！剩余 ')+left:L('남은 손님 ','剩余客人 ')+left,518,1281,26,INK);}
  if(B.aim==='bomb')txt(L('수박을 떨어뜨릴 곳을 눌러요','点一下要扔西瓜的地方'),375,1196,28,'#fff','center',INK,7);
  if(B.banner){const b=B.banner,q=Math.min(1,b.t*5),o=b.t>1.3?(1.6-b.t)/.3:1;g.globalAlpha=Math.max(0,o);const bh=b.big?120:90;g.fillStyle='rgba(60,36,20,.55)';g.fillRect(0,250-bh/2,VW*q,bh);g.fillStyle=b.big?'#ffd93d':'#fff';g.fillRect(0,250-bh/2-6,VW*q,5);g.fillRect(0,250+bh/2+1,VW*q,5);txt(b.text,375+(1-q)*120,250,b.big?70:50,b.col,'center',INK,b.big?16:12);g.globalAlpha=1;}
  if(B.tip&&B.sel<0){panel(24,1086,702,116,'#fffdf3',30);drawImg('tuantuan',84,1194,104);wrap(B.tip.text,150,B.tip.text.length>22?1126:1144,25,550,34,INK,'left',2);}
  // 첫 판 손가락
  if(run.si===0&&run.ws==='prep'&&B.sel<0&&!adOv){if(!run.spots.some(sp=>sp.tw)&&!S.tips.t_build){const sp=run.spots.slice().sort((a,b)=>Math.abs(a.y-300)-Math.abs(b.y-300))[0];icoHand(sp.x*K+26,sp.y*K+40,B.time);}else if(run.spots.some(sp=>sp.tw)&&!S.tips.t_start)icoHand(560,1330,B.time);}
}
function drawRevive(){
  g.fillStyle='rgba(40,24,12,.6)';g.fillRect(0,0,VW,VH);BT.length=0;panel(75,420,600,470,CREAM,36);
  drawImg('didi_sick',375,590,130);txt(L('간식을 다 뺏겼어요!','点心全被偷走了！'),375,640,44,INK);txt(L('간식 10개를 다시 채워 볼까요? (한 판에 1번)','补充 10 份点心再坚持一下？（每局 1 次）'),375,694,23,'#a07a55');
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
  if(IMG['bg_'+(run.S.theme+1)])return;
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
