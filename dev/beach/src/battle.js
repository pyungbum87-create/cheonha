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
  B={parts:[],nums:[],rings:[],fly:[],shake:0,banner:null,sel:-1,pick:'',aim:'',endT:-1,tip:null,time:0,tide:0,leakFlash:0,adGold:!!bonusGold,map:mkMap(si),hint:0};
  paused=false;speed=S.opt.fast?2:1;scr='battle';wantMusic('bgm-play');S.stat.runs++;mission('run',1);track('stage_start',{stage:si+1});
  tip('start',L('빈 모래 자리를 눌러 타워를 짓고, 준비되면 시작을 눌러요','点空沙堆建塔，准备好就点开始'),8);persist();
}
function tip(key,text,sec){if(S.tips[key]||!B)return;S.tips[key]=1;B.tip={text,t:sec||6};}
function banner(text,big,col){B.banner={text,t:0,big:!!big,col:col||'#fff'};}
function shake(n){B.shake=Math.max(B.shake,n);}
function burst(x,y,n,col,sp,r){for(let i=0;i<n&&B.parts.length<300;i++){const a=Math.random()*6.283,v=rnd(.5,1)*(sp||2.2);B.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-.8,gr:.07,life:rnd(16,30),t:0,r:rnd(.6,1)*(r||2.6),col:Array.isArray(col)?col[i%col.length]:col});}}
function floatTxt(x,y,s,col,sz){if(B.nums.length<40)B.nums.push({x,y,s,col,sz:sz||11,t:0});}
const FW_COL=['#ff6b6b','#ffd93d','#6bcbff','#ff9ff3','#8ce99a'];

function consumeFx(){
  for(const f of run.fx){switch(f.e){
    case 'hit':if(f.v>=40||f.weak)floatTxt(f.x+rnd(-6,6),f.y-12,Math.round(f.v),f.weak?'#ff9f43':'#fff',f.v>=150?14:10);else if(f.res&&Math.random()<.25)floatTxt(f.x,f.y-12,L('단단!','硬！'),'#b8c4d0',9);sfx('hit');break;
    case 'die':{const boss=f.k==='boss';B.fly.push({k:boss?f.bk:f.k,x:f.x,y:f.y,t:0,r:ENEMIES[f.k].r});burst(f.x,f.y,boss?30:5,'#fff',boss?5:2.2);sfx('pop');floatTxt(f.x,f.y-16,'+'+f.g,'#ffd93d',boss?16:11);if(boss){shake(10);vib(60);}break;}
    case 'blast':B.rings.push({x:f.x,y:f.y,r:f.r,kind:f.kind,t:0});
      if(f.kind==='fw'){burst(f.x,f.y,9,FW_COL,3.4,3);sfx('boom');}else if(f.kind==='bun'){burst(f.x,f.y,6,'#fff',2.2,3.4);sfx('boom');}else if(f.kind==='bomb'){burst(f.x,f.y,24,['#ffe066','#ff9f43','#fff'],5,4);sfx('boom');shake(8);vib(40);}else{burst(f.x,f.y,5,['#fff','#ffb3c1'],1.8,2.6);sfx('splash');}break;
    case 'splash':burst(f.x,f.y,3,'#bfe8ff',1.8,2.2);sfx('splash');break;
    case 'pingpong':burst(f.x,f.y,4,'#fff',2.4,2.2);sfx('hit');break;
    case 'shoot':sfx(f.id==='shan'?'beam':'shoot',TOWER_IDS.indexOf(f.id));break;
    case 'build':sfx('pick');burst(run.spots[f.i].x,run.spots[f.i].y,14,['#f3c97a','#fff'],3,3);mission('build',1);S.tips.t_build=1;break;
    case 'up':sfx(f.lv===4?'awake':'pick');burst(run.spots[f.i].x,run.spots[f.i].y-10,f.lv===4?26:12,['#ffd93d','#fff'],4,3);if(f.lv===4){banner(LL(BR[f.br]),0,'#ffd93d');vib(40);}S.tips.t_up=1;break;
    case 'sell':sfx('coin');floatTxt(run.spots[f.i].x,run.spots[f.i].y-20,'+'+f.g,'#ffd93d',13);break;
    case 'wave':if(f.boss){banner(L('보스 등장!','BOSS 来了！'),1,'#ffd93d');sfx('boss');}else banner(L('파도 ','第 ')+f.w+L('',' 波'));sfx('wave');S.tips.t_start=1;
      if(f.w===2)tip('up',L('타워를 누르면 강화할 수 있어요. 3단계 다음엔 두 갈래 중 하나!','点一下塔可以升级，3 级之后二选一进阶！'),7);if(f.w===3)tip('skill',L('아래 큰 파도·야자 폭탄은 급할 때 직접 써요','下方的大浪和椰子炸弹，紧急时自己放'),7);break;
    case 'waveClear':floatTxt(225,400,L('파도 막음! +','守住了！+')+f.g,'#ffd93d',17);sfx('reward');if(f.w===1)tip('early',L('다음 파도를 미리 부르면 남은 시간만큼 골드를 더 받아요','提前叫下一波，可按剩余时间多拿金币'),7);break;
    case 'bonus':floatTxt(360,690,'+'+f.g,'#ffd93d',15);sfx('coin');break;
    case 'leak':B.leakFlash=18;sfx('wall');shake(4);vib(30);floatTxt(f.x,f.y-24,'-'+f.n+' ♥','#ff5a4a',14);break;
    case 'ink':sfx('ink');tip('ink',L('먹물에 맞은 타워는 멈춰요. 눌러서 닦아 줘요!','被墨汁喷到的塔会停工，点一下擦干净！'),7);break;
    case 'inkClear':sfx('clear');burst(run.spots[f.i].x,run.spots[f.i].y-24,8,'#4a3a6a',3,3);break;
    case 'summon':burst(f.x,f.y,10,'#fff',3);if(f.bk==='whale')banner(L('고래 파도! 적이 빨라져요','鲸浪！敌人加速'),0,'#bfe8ff');break;
    case 'boss':shake(6);break;
    case 'tide':B.tide=46;sfx('surge');shake(6);vib(40);break;
    case 'down':sfx('over');break;
    case 'revive':sfx('reward');burst(225,GATE_Y,30,['#ffd93d','#fff'],6,4);break;
    case 'win':sfx('win');B.endT=2;B.sel=-1;for(let i=0;i<50;i++)B.parts.push({x:rnd(0,450),y:rnd(-200,0),vx:rnd(-1,1),vy:rnd(2,5),gr:0,life:110,t:0,r:rnd(3,5),col:FW_COL[i%5]});break;
    case 'lose':B.endT=1.2;B.sel=-1;break;
  }}
  run.fx.length=0;
  if(run.en.some(e=>e.air))tip('air',L('갈매기는 길을 무시하고 날아와요. 퇀퇀·쫑쫑은 하늘을 못 맞혀요','海鸥会直接飞过来，团团和啄啄打不到空中'),7);
  if(run.en.some(e=>e.armor>=.5))tip('armor',L('단단한 적은 방울이·반짝의 마법, 소라게는 폭발에 약해요','硬壳敌人怕滴滴和闪闪的魔法，寄居蟹怕爆炸'),7);
}

function battleTick(dt){
  B.time+=dt;if(B.tip&&(B.tip.t-=dt)<=0)B.tip=null;if(B.banner&&(B.banner.t+=dt)>1.6)B.banner=null;
  if(paused||adOv)return;
  advance(run,dt*speed);consumeFx();
  const f=Math.min(3,dt*60);B.shake*=Math.pow(.86,f);if(B.tide>0)B.tide-=f;if(B.leakFlash>0)B.leakFlash-=f;
  for(const p of B.parts){p.t+=f;p.x+=p.vx*f;p.y+=p.vy*f;p.vy+=p.gr*f;}B.parts=B.parts.filter(p=>p.t<p.life);
  for(const n of B.nums)n.t+=f;B.nums=B.nums.filter(n=>n.t<44);
  for(const r of B.rings)r.t+=f;B.rings=B.rings.filter(r=>r.t<18);
  for(const o of B.fly)o.t+=f;B.fly=B.fly.filter(o=>o.t<16);
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
  for(const i of order){const sp=run.spots[i],tw=sp.tw,hgt=drawBase(sp.x,sp.y,tw.lv,tw.br),st=tw.anim>0?tw.anim/10:0,br=Math.sin(t*3+i)*.02;
    if(tw.lv>=4){g.fillStyle='rgba(255,217,61,'+(.22+Math.sin(t*4)*.06)+')';g.beginPath();g.ellipse(sp.x,sp.y-hgt-22,30,32,0,0,6.2832);g.fill();}
    drawImg(HERO_IMG[tw.id],sp.x,sp.y-hgt+4-st*4,46+tw.lv*2,{sx:1+br-st*.07,sy:1-br+st*.1,a:tw.ink>0?.75:1});
    for(let k=0;k<Math.min(3,tw.lv);k++){g.fillStyle=tw.lv>=4?'#ffd93d':'#fff';g.strokeStyle=INK;g.lineWidth=1.2;circ(sp.x-8+k*8,sp.y+13,3);g.fill();g.stroke();}
    if(tw.ink>0){g.fillStyle='rgba(50,38,80,.88)';circ(sp.x-5,sp.y-hgt-26,17);g.fill();circ(sp.x+11,sp.y-hgt-14,12);g.fill();circ(sp.x-12,sp.y-hgt-10,9);g.fill();icoHand(sp.x+16,sp.y-hgt+8,t,.42);}
    else if(tw.lv<4&&run.gold>=upCost(tw)&&B.sel!==i){const bo=Math.abs(Math.sin(t*4+i))*3;g.fillStyle='#5cc4a4';g.strokeStyle=INK;g.lineWidth=1.6;g.beginPath();g.moveTo(sp.x+20,sp.y-hgt-44-bo);g.lineTo(sp.x+28,sp.y-hgt-34-bo);g.lineTo(sp.x+23,sp.y-hgt-34-bo);g.lineTo(sp.x+23,sp.y-hgt-27-bo);g.lineTo(sp.x+17,sp.y-hgt-27-bo);g.lineTo(sp.x+17,sp.y-hgt-34-bo);g.lineTo(sp.x+12,sp.y-hgt-34-bo);g.closePath();g.fill();g.stroke();}
  }
  // 등롱 빛줄기
  for(const sp of run.spots){const tw=sp.tw;if(!tw||tw.id!=='shan'||!tw.tgt||tw.ink>0||!tw.links)continue;let px=sp.x,py=sp.y-[0,10,15,20,24][tw.lv]-26;
    for(const id of tw.links){const e=run.en.find(q=>q.id===id);if(!e)break;const w=2+tw.ramp*.28;g.lineCap='round';g.strokeStyle='rgba(255,224,138,.5)';g.lineWidth=w+5;g.beginPath();g.moveTo(px,py);g.lineTo(e.x,e.y);g.stroke();g.strokeStyle=tw.br==='rainbow'?'hsl('+((t*240)%360)+',90%,80%)':'#fffbe0';g.lineWidth=w;g.stroke();px=e.x;py=e.y;}}
}
function drawEnemies(){
  const es=run.en.slice().sort((a,b)=>(a.air?1e4:0)+a.y-((b.air?1e4:0)+b.y)),t=run.t;
  for(const o of B.fly){const q=o.t/16;drawSpr(o.k,o.x,o.y-q*14,o.r*3.4*(1+q*.3),{a:1-q});}
  for(const e of es){const k=sprKey(e),size=e.r*3.4,bob=1+Math.sin(t*.2+e.ph)*.05;let y=e.y+e.r*.25;
    if(e.air){g.fillStyle='rgba(60,40,20,.14)';g.beginPath();g.ellipse(e.x,e.y+26,e.r*.8,e.r*.3,0,0,6.2832);g.fill();y-=6+Math.sin(t*.15+e.ph)*3;}
    else{g.fillStyle='rgba(60,40,20,.18)';g.beginPath();g.ellipse(e.x,e.y+e.r*.8,e.r*.9,e.r*.32,0,0,6.2832);g.fill();if(e.k==='fish')y-=Math.abs(Math.sin(t*.16+e.ph))*8;}
    if(e.slow>0){g.fillStyle='rgba(120,200,255,.45)';g.beginPath();g.ellipse(e.x,e.y+e.r*.8,e.r*1.2,e.r*.45,0,0,6.2832);g.fill();}
    drawSpr(k,e.x,y,size,{sx:bob,sy:2-bob});if(e.hit>0)drawSpr(k,e.x,y,size,{sx:bob,sy:2-bob,white:1,a:e.hit/6*.7});
    if(e.stun>0)txt('★',e.x,e.y-e.r-9+Math.sin(t*.3)*2,9,'#ffd93d','center',INK,2);
    if(e.hp<e.max*.999||e.k==='elite'||e.k==='boss'){const w=Math.max(18,e.r*1.9),yy=y-size*.5-3;g.fillStyle='rgba(60,36,20,.7)';rr(e.x-w/2-1,yy-1,w+2,5.5,2.5);g.fill();g.fillStyle=e.armor>=.5?'#9fb8d0':e.k==='boss'?'#ff5a4a':'#7ddc6a';rr(e.x-w/2,yy,w*Math.max(0,e.hp/e.max),3.5,1.7);g.fill();}
  }
}
function drawProj(){
  for(const z of run.zones){g.fillStyle='rgba(255,140,60,'+(.18+Math.sin(B.time*9)*.06)+')';circ(z.x,z.y,z.r);g.fill();}
  for(const p of run.pr){let x=p.x,y=p.y;if(p.lob){const q=p.t/p.T;y-=Math.sin(q*3.1416)*(p.k==='fw'?70:42);}
    if(p.k==='fw'){g.fillStyle='#ffd93d';circ(x,y,3.4);g.fill();g.fillStyle='rgba(255,150,80,.6)';circ(x,y+6,2.4);g.fill();}
    else if(p.k==='bun'){g.fillStyle='#fff';g.strokeStyle=INK;g.lineWidth=1.6;circ(x,y,5.5);g.fill();g.stroke();}
    else if(p.k==='drop'){g.fillStyle='#8fd4ff';g.strokeStyle='#3d8fd0';g.lineWidth=1.3;circ(x,y,p.line?5.5:4);g.fill();g.stroke();}
    else if(p.k==='ball'){g.fillStyle='#fff';g.strokeStyle='#ff9f43';g.lineWidth=1.6;circ(x,y,4);g.fill();g.stroke();g.strokeStyle='rgba(255,255,255,.5)';g.lineWidth=3;g.beginPath();g.moveTo(x,y);g.lineTo(x-(p.tx-x)*.12,y-(p.ty-y)*.12);g.stroke();}
    else{g.save();g.translate(x,y);g.rotate(p.t*.2);g.fillStyle='#fff';g.strokeStyle=INK;g.lineWidth=1.4;rr(-7,-5,14,10,2);g.fill();g.stroke();g.fillStyle=RED;circ(0,0,2);g.fill();g.restore();}}
}
function drawFx(){
  for(const r of B.rings){const q=r.t/18,rad=r.r*(.45+.55*Math.min(1,q*1.6)),col=r.kind==='fw'?'255,170,80':r.kind==='bomb'?'255,224,102':r.kind==='mail'?'255,190,205':'255,255,255';
    g.fillStyle='rgba('+col+','+(.4*(1-q))+')';circ(r.x,r.y,rad);g.fill();g.strokeStyle='rgba('+col+','+(.9*(1-q))+')';g.lineWidth=2.4;g.stroke();}
  if(B.tide>0){const q=1-B.tide/46,y=60+q*700,gr=g.createLinearGradient(0,y-90,0,y+30);gr.addColorStop(0,'rgba(120,208,236,0)');gr.addColorStop(.7,'rgba(120,208,236,'+(.75*(1-q*.6))+')');gr.addColorStop(1,'rgba(255,255,255,'+(.9*(1-q*.6))+')');g.fillStyle=gr;g.beginPath();g.moveTo(0,y-90);g.lineTo(W,y-90);for(let x=W;x>=0;x-=30)g.lineTo(x,y+Math.sin(x*.05+B.time*8)*8);g.closePath();g.fill();}
  for(const p of B.parts){const a=Math.min(1,(p.life-p.t)/10);g.globalAlpha=a;g.fillStyle=p.col;circ(p.x,p.y,p.r);g.fill();}g.globalAlpha=1;
  for(const n of B.nums){const a=Math.min(1,(44-n.t)/12);g.globalAlpha=a;txt(n.s,n.x,n.y-n.t*.55,n.sz,n.col,'center',INK,Math.max(2.4,n.sz*.24));}g.globalAlpha=1;
  if(B.aim==='bomb'){const x=PTR.x/K,y=PTR.y/K;g.strokeStyle='rgba(255,90,74,.9)';g.lineWidth=2;g.setLineDash([6,5]);circ(PTR.down?x:225,PTR.down?y:400,SKILL.bomb.r);g.stroke();g.setLineDash([]);}
  if(B.leakFlash>0){g.fillStyle='rgba(255,60,50,'+(B.leakFlash/18*.3)+')';g.fillRect(0,GATE_Y-60,W,160);}
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
  panel(104,18,150,66,CREAM,22);g.fillStyle='#ff5a4a';g.strokeStyle=INK;g.lineWidth=3.5;g.beginPath();g.moveTo(138,68);g.bezierCurveTo(108,46,122,26,138,40);g.bezierCurveTo(154,26,168,46,138,68);g.fill();g.stroke();txt(run.lives,200,53,32,run.lives<=5?RED:INK);
  panel(268,18,180,66,CREAM,22);icoCoin(300,51,18);txtFit(Math.floor(run.gold),372,53,32,110,INK);
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
  if(B.banner){const b=B.banner,q=Math.min(1,b.t*5),o=b.t>1.3?(1.6-b.t)/.3:1;g.globalAlpha=Math.max(0,o);txt(b.text,375,250-(1-q)*30,b.big?70:50,b.col,'center',INK,b.big?16:12);g.globalAlpha=1;}
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
  g.drawImage(B.map,0,0);g.save();g.scale(K,K);drawSea();drawSpots();drawEnemies();drawTowers();drawProj();drawFx();g.restore();g.restore();
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
