/* ============================== 판 밖 화면: 홈 · 영웅 · 보상 · 설정 · 결과, 그리고 전체 진행 ============================== */
const APP={hidden:false,t:0,toast:null,errs:0,lastErr:'',playSec:0,loadT:0,bot:false,resetArm:0};
let scr='load',RES=null;
const SN=[['모래사장','沙滩'],['갯바위','礁石滩'],['산호초','珊瑚礁'],['해적섬','海盗岛'],['용궁 입구','龙宫门口'],['등대 곶','灯塔岬'],['대나무 부두','竹码头'],['달빛 갯벌','月光滩涂'],['폭풍 방파제','风暴堤'],['용궁 대문','龙宫大门']];
function toast(s){APP.toast={s,t:2.2};}
function today(){const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}

/* ---------- 매일 보상 ---------- */
const MIS={run:[2,60,['출전 2번','出战 2 次']],kill:[120,80,['손님 120명 배불리기','喂饱 120 位客人']],skill:[5,60,['큰 파도·왕수박 5번 쓰기','使用大浪或大西瓜 5 次']],build:[12,60,['가게 12개 차리기','摆 12 个小吃摊']],
  win:[1,100,['한 판 클리어','通关 1 次']],up:[1,60,['가게 숙련 1번 올리기','提升 1 次摊位熟练度']]};
const CHEST=[[3,150],[6,250],[9,400],[12,600],[15,800],[18,1000],[21,1200],[24,1500],[27,1800],[30,2500]],LOGIN=[50,80,120,160,200,260,500],BOX_MAX=3;
function dailyInit(){const t=today();if(S.day===t&&S.mis.length===3)return;S.day=t;let seed=0;for(const ch of t)seed=(seed*31+ch.charCodeAt(0))>>>0;
  const r=makeRng(seed),ids=Object.keys(MIS),pick=[];while(pick.length<3)pick.push({id:ids.splice(Math.floor(r()*ids.length),1)[0],p:0,got:0});S.mis=pick;S.box={day:t,n:0};persist();}
function mission(id,n){for(const m of S.mis)if(m.id===id&&!m.got)m.p=Math.min(MIS[id][0],m.p+n);}
const idleRate=()=>40+30*S.cleared;
function idleAmt(){const h=Math.min(8,Math.max(0,(Date.now()-S.idleAt)/3600000));return Math.floor(h*idleRate());}
const starSum=()=>S.stars.reduce((a,b)=>a+b,0);
const loginReady=()=>S.login.last!==today();
const chestReady=()=>S.chest<CHEST.length&&starSum()>=CHEST[S.chest][0];
function rewardBadge(){return loginReady()||chestReady()||idleAmt()>=idleRate()||S.mis.some(m=>!m.got&&m.p>=MIS[m.id][0]);}
function gain(n,why){S.coins+=n;sfx('reward');toast('+'+n+L(' 동전',' 金币'));track('reward',{why,n});persist();}
const avgLv=()=>{const ids=TOWER_IDS.filter(id=>S.lv[id]);let s=0;for(const id of ids)s+=S.lv[id];return Math.round(s/ids.length);};

function goHome(){scr='home';run=null;B=null;paused=false;wantMusic('menu');dailyInit();S.sel=Math.max(0,Math.min(S.sel,S.cleared,STAGES.length-1));persist();}
function endBattle(){
  const won=run.won,si=run.si,unlock=[];let first=0;
  if(won){S.stat.wins++;mission('win',1);if(S.stars[si]===0)first=REWARD.first[si];S.stars[si]=Math.max(S.stars[si],run.stars);if(S.cleared<si+1)S.cleared=si+1;
    for(const id in UNLOCK)if(S.cleared>=UNLOCK[id]&&!S.lv[id]){S.lv[id]=1;unlock.push(id);}}
  mission('kill',run.kills);S.stat.kills+=run.kills;S.coins+=run.reward+first;
  RES={won,si,stars:run.stars,reward:run.reward,first,unlock,doubled:false,t:0,wave:run.wave,waves:run.S.waves};
  track(won?'stage_clear':'stage_fail',{stage:si+1,wave:run.wave,stars:run.stars,sec:Math.round(run.t/60)});scr='result';wantMusic('menu');persist();
}

/* ---------- 공통 조각 ---------- */
function topBar(title,back){
  if(back)btn(20,26,96,78,'',()=>{sfx('btn');goHome();},{col:CREAM,dk:'#d9c8a8',icon:(x,y)=>{g.strokeStyle=INK;g.lineWidth=8;g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(x+10,y-18);g.lineTo(x-12,y);g.lineTo(x+10,y+18);g.stroke();}});
  if(title)txt(title,375,66,44,'#fff','center',INK,12);
  panel(540,30,190,70,CREAM,22);icoCoin(574,65,19);txtFit(S.coins,646,66,30,110,INK);
}
function backdrop(dim){g.drawImage(BG,0,0);g.fillStyle='rgba(255,246,228,'+(dim||.5)+')';g.fillRect(0,0,VW,VH);}

function drawLoad(){
  g.fillStyle='#bfe9f5';g.fillRect(0,0,VW,VH);const n=MUST.filter(k=>IMG[k]).length,p=n/MUST.length;
  txt(L('퇀퇀 해변 수비대','团团守海滩'),375,520,64,'#fff','center',INK,16);bar(175,640,400,40,p,MINT);
  txt(APP.loadT>6?L('인터넷이 느려 시간이 걸리고 있어요','网络较慢，请稍等一下'):L('해변으로 가는 중…','正在前往海滩…'),375,720,26,INK);
  if(p>=1||APP.loadT>25){if(p<1)toast(L('그림을 다 받지 못했어요. 새로고침해 주세요','部分图片未加载，请刷新重试'));track('load_done',{sec:Math.round(APP.loadT),ok:p>=1?1:0});goHome();}
}

function drawHome(){
  backdrop(.42);const t=APP.t,si=S.sel,st=STAGES[si],own=TOWER_IDS.filter(id=>S.lv[id]);
  panel(20,30,210,70,CREAM,22);icoCoin(54,65,19);txtFit(S.coins,132,66,30,130,INK);
  btn(646,26,84,78,'',()=>{sfx('btn');scr='settings';},{col:CREAM,dk:'#d9c8a8',icon:(x,y)=>{g.fillStyle=INK;for(let i=-1;i<2;i++){rr(x-20,y+i*15-4,40,8,4);g.fill();}}});
  btn(552,26,84,78,'?',()=>{sfx('btn');APP.page=0;scr='guide';track('guide_open');},{col:CREAM,dk:'#d9c8a8',tc:INK,sz:44});
  txt(L('퇀퇀 해변 수비대','团团守海滩'),375,196,LANG==='zh'?92:74,'#fff','center',INK,20);
  txt(L('간식 가게를 차려 배고픈 바다 손님을 배불려 돌려보내요','摆好小吃摊，把馋嘴的小海怪喂饱送回家'),375,268,25,INK,'center','#fff',6);
  own.forEach((id,i)=>{const n=own.length,x=375+(i-(n-1)/2)*(n>4?112:128),b=Math.sin(t*3+i)*.03;drawImg(id==='tt'?'tt_cheer':HERO_IMG[id],x,520,id==='tt'?180:150,{sx:1+b,sy:1-b});});
  panel(60,560,630,330,CREAM,36);
  txt(L('제 ','第 ')+(si+1)+L(' 장 · ',' 关 · ')+LL(SN[si]),375,612,40,INK);
  for(let i=0;i<3;i++)icoStar(315+i*60,672,24,i<S.stars[si]);
  const ks=st.kinds.concat([st.boss]);ks.forEach((k,i)=>{const x=375+(i-(ks.length-1)/2)*Math.min(92,560/ks.length),boss=i===ks.length-1;drawSpr(k,x,762,boss?108:Math.min(78,480/ks.length));});
  const low=avgLv()<st.rec;txt(L('권장 가게 숙련 Lv.','推荐熟练度 Lv.')+st.rec+L('  ·  내 평균 Lv.','  ·  我的平均 Lv.')+avgLv(),375,826,24,low?RED:'#3a9478');
  txt(L('파도 ','共 ')+st.waves+L('번  ·  길 ',' 波  ·  路线 ')+st.paths.length+L('갈래  ·  가게 자리 ',' 条  ·  摊位 ')+st.spots,375,860,21,'#a07a55');
  if(si>0)btn(20,690,70,90,'‹',()=>{sfx('btn');S.sel--;},{col:CREAM,dk:'#d9c8a8',tc:INK,sz:56});
  if(si<Math.min(S.cleared,STAGES.length-1))btn(660,690,70,90,'›',()=>{sfx('btn');S.sel++;},{col:CREAM,dk:'#d9c8a8',tc:INK,sz:56});
  const pu=1+Math.sin(t*4)*.015;g.save();g.translate(375,975);g.scale(pu,pu);g.translate(-375,-975);btn(165,918,420,116,L('출전!','出发！'),()=>{sfx('btn');startBattle(S.sel);},{sz:56});g.restore();
  btn(50,1082,310,104,L('가게','小吃摊'),()=>{sfx('btn');scr='heroes';tipOnce('heroes',L('동전으로 가게 숙련을 올리면 모든 판에서 더 맛있어져요','用金币提升熟练度，每一关都更美味'));},{col:MINT,dk:MINT_D,sz:40,dot:TOWER_IDS.some(id=>S.lv[id]&&S.lv[id]<MAX_LV&&S.coins>=lvCost(S.lv[id]))});
  btn(390,1082,310,104,L('보상','奖励'),()=>{sfx('btn');scr='reward';},{col:YEL,dk:YEL_D,tc:INK,sz:40,dot:rewardBadge()});
  if(APP.playSec>1800){panel(150,300,450,74,'#fffdf3',30);txt(L('오래 했어요. 잠깐 쉬어 가요!','玩了很久啦，休息一下吧！'),375,338,26,INK);}
  if(LANG==='zh'){txt('抵制不良游戏，拒绝盗版游戏。注意自我保护，谨防受骗上当。',375,1232,17,'#7a5a3c');txt('适度游戏益脑，沉迷游戏伤身。合理安排时间，享受健康生活。',375,1258,17,'#7a5a3c');}
  txt('v'+BUILD+(Object.keys(IMG_FAIL).length?L(' · 그림 일부 실패: 새로고침',' · 部分图片失败：请刷新'):''),375,1306,17,'#a07a55');
}
function tipOnce(key,s){if(!S.tips[key]){S.tips[key]=1;toast(s);APP.toast.t=4;persist();}}

function drawHeroScr(){
  backdrop(.62);topBar(L('가게','小吃摊'),1);
  TOWER_IDS.forEach((id,i)=>{const y=128+i*172,own=!!S.lv[id],lv=S.lv[id]||0,b=TOWERS[id];
    panel(24,y,702,156,own?CREAM:'#e9e2d6',28);g.fillStyle=own?HCOL[id]:'#d6cec0';rr(36,y+12,132,132,22);g.fill();drawImg(HERO_IMG[id],102,y+140,118,{a:own?1:.45});
    txt(LL(HN[id]),186,y+38,34,own?INK:'#8f8475','left');
    if(own){font(34);txt('Lv.'+lv,200+g.measureText(LL(HN[id])).width,y+40,26,RED_D,'left');}
    txtFit(LL(TROLE[id]),186,y+80,21,own?326:500,'#8a6a4a','left');
    if(!own){txt(L('제 ','通关第 ')+UNLOCK[id]+L(' 장을 깨면 개업',' 关后开张'),186,y+122,22,'#8f8475','left');return;}
    txtFit(L('맛 ','美味 ')+Math.round(heroMul(lv)*100)+'%  ·  '+L('값 ','开摊 ')+b.cost+'  ·  '+L('주인 ','摊主 ')+LL(OWNER[id]),186,y+122,21,326,'#3a9478','left');
    if(lv>=MAX_LV)txt('MAX',620,y+78,30,'#d99a1e');
    else{const c=lvCost(lv);btn(524,y+30,186,96,'',()=>{if(S.coins<c){sfx('nope');toast(L('동전이 모자라요','金币不够'));return;}S.coins-=c;S.lv[id]=lv+1;mission('up',1);sfx('up');track('hero_up',{id,lv:lv+1});persist();},{col:S.coins>=c?RED:GREY,dk:S.coins>=c?RED_D:GREY_D,icon:(x,yy)=>{txt(L('숙련 올리기','提升熟练'),x,yy-18,24,'#fff','center',INK);icoCoin(x-36,yy+20,13);txt(c,x+12,yy+21,24,'#fff','center',INK,5);}});}
  });
  txt(L('숙련은 모든 판에서 그 가게의 맛을 올려요 (단계마다 +7%)','熟练度会提升该摊位在每一关的美味（每级 +7%）'),375,1190,22,INK);
  txt(L('판 안에서 가게 키우기(1~3단계·새 메뉴)는 그 판의 골드로 해요','关卡内的升级与新菜单使用当局金币'),375,1226,21,'#7a5a3c');
}
function drawReward(){
  backdrop(.6);topBar(L('보상','奖励'),1);const A={col:YEL,dk:YEL_D,tc:INK,sz:24};
  // 찜통 수익
  let y=128;panel(24,y,702,200,CREAM,28);const amt=idleAmt();txt(L('찜통 수익','蒸笼收益'),50,y+38,30,INK,'left');txt(L('꺼 둔 동안에도 모여요 · 1시간에 ','离线也会累积 · 每小时 ')+idleRate()+L(' · 최대 8시간',' · 最多 8 小时'),50,y+76,19,'#8a6a4a','left');
  icoCoin(70,y+140,24);txt(amt,106,y+142,40,INK,'left');
  btn(300,y+104,190,76,L('받기','领取'),()=>{S.idleAt=Date.now();gain(amt,'idle');},{off:amt<1,sz:30});
  btn(506,y+104,204,76,L('▶ 2시간치 더','▶ 再领 2 小时'),()=>showAd('idle',o=>{if(o)gain(idleRate()*2,'idle_ad');}),A);
  // 7일 출석
  y=348;panel(24,y,702,196,CREAM,28);txt(L('7일 출석','7 日签到'),50,y+38,30,INK,'left');const day=S.login.n%7,rdy=loginReady();
  LOGIN.forEach((v,i)=>{const x=44+i*74,done=i<day||(i===day&&!rdy&&S.login.n>0&&false);g.fillStyle=i<day?'#cfeedd':i===day&&rdy?'#ffe9a8':'#f1e7d3';rr(x,y+66,66,84,14);g.fill();g.lineWidth=3;g.strokeStyle=INK;g.stroke();txt(i+1,x+33,y+86,18,'#8a6a4a');icoCoin(x+33,y+112,11);txt(i<day?'✓':v,x+33,y+136,17,INK);});
  btn(572,y+72,138,76,rdy?L('받기','签到'):L('내일 또','明天见'),()=>{const v=LOGIN[S.login.n%7];S.login.n++;S.login.last=today();gain(v,'login');},{off:!rdy,sz:26});
  // 오늘의 임무
  y=564;panel(24,y,702,320,CREAM,28);txt(L('오늘의 임무','今日任务'),50,y+38,30,INK,'left');
  S.mis.forEach((m,i)=>{const d=MIS[m.id],yy=y+70+i*82,done=m.p>=d[0];txtFit(LL(d[2]),50,yy+22,25,360,INK,'left');bar(50,yy+44,330,22,m.p/d[0],MINT);txt(m.p+' / '+d[0],215,yy+55,15,'#fff','center',INK,3);
    icoCoin(420,yy+36,13);txt(d[1],458,yy+37,22,INK);
    if(m.got)txt(L('완료','已领取'),620,yy+36,24,'#3a9478');else btn(540,yy+4,170,66,L('받기','领取'),()=>{m.got=1;gain(d[1],'mission');},{off:!done,sz:26});});
  // 별 상자
  y=904;panel(24,y,702,150,CREAM,28);txt(L('별 상자','星星宝箱'),50,y+38,30,INK,'left');const ss=starSum();
  if(S.chest>=CHEST.length)txt(L('모두 받았어요!','全部领完啦！'),375,y+96,26,'#3a9478');
  else{const c=CHEST[S.chest];icoStar(64,y+98,18,1);bar(92,y+82,300,32,ss/c[0],YEL);txt(ss+' / '+c[0],242,y+98,18,'#fff','center',INK,4);icoCoin(424,y+98,14);txt(c[1],470,y+99,24,INK);
    btn(540,y+62,170,70,L('열기','打开'),()=>{S.chest++;gain(c[1],'chest');},{off:ss<c[0],sz:26});}
  // 무료 상자
  y=1074;panel(24,y,702,130,CREAM,28);const left=BOX_MAX-(S.box.day===today()?S.box.n:0),bv=100+60*S.cleared;drawImg('gift',76,y+110,84);
  txt(L('무료 선물 상자','免费礼盒'),130,y+44,28,INK,'left');txt(L('오늘 ','今天还剩 ')+left+' / '+BOX_MAX+L(' 남음 · 동전 ',' 次 · 金币 ')+bv,130,y+86,21,'#8a6a4a','left');
  btn(480,y+30,230,74,L('▶ 광고 보고 열기','▶ 看广告打开'),()=>showAd('box',o=>{if(o){if(S.box.day!==today())S.box={day:today(),n:0};S.box.n++;gain(bv,'box');}}),Object.assign({off:left<=0},A));
  txt(L('광고는 모두 보고 싶을 때만 봐요','所有广告都是自愿观看'),375,1256,20,'#8a6a4a');
}

function drawSettings(){
  backdrop(.6);topBar(L('설정','设置'),1);const C={col:CREAM,dk:'#d9c8a8',tc:INK,sz:30};
  const row=(i,label,on,fn)=>{const y=150+i*110;panel(60,y,630,92,CREAM,26);txt(label,96,y+47,30,INK,'left');btn(500,y+12,170,64,on?'ON':'OFF',()=>{sfx('btn');fn();persist();},{col:on?MINT:GREY,dk:on?MINT_D:GREY_D,sz:28});};
  row(0,L('음악','音乐'),S.opt.bgm,()=>{S.opt.bgm^=1;musicSync();});row(1,L('효과음','音效'),S.opt.sfx,()=>{S.opt.sfx^=1;});
  row(2,L('진동','振动'),S.opt.vib,()=>{S.opt.vib^=1;});row(3,L('화면 흔들림','画面震动'),S.opt.shake,()=>{S.opt.shake^=1;});
  btn(60,610,630,88,LANG==='zh'?'语言：中文  →  한국어':'언어: 한국어  →  中文',()=>{sfx('btn');LANG=LANG==='zh'?'ko':'zh';S.lang=LANG;persist();},C);
  btn(60,718,630,88,L('친구에게 알리기','分享给朋友'),()=>{sfx('btn');shareGame();},C);
  btn(60,826,630,88,L('개인정보 처리방침','隐私政策'),()=>{sfx('btn');scr='privacy';},C);
  const arm=APP.resetArm>0;btn(60,934,630,88,arm?L('한 번 더 누르면 모두 지워져요','再点一次将清空全部进度'):L('진행 초기화','重置进度'),()=>{if(arm){lsSet(SAVE_KEY,'');S=loadSave();APP.resetArm=0;toast(L('처음부터 다시 시작해요','已重置'));goHome();}else{APP.resetArm=3;sfx('nope');}},{col:arm?RED:GREY,dk:arm?RED_D:GREY_D,sz:28});
  txt(L('출전 ','出战 ')+S.stat.runs+L('번 · 클리어 ',' 次 · 通关 ')+S.stat.wins+L('번 · 배불린 손님 ',' 次 · 喂饱客人 ')+S.stat.kills,375,1090,22,'#7a5a3c');
  txt('v'+BUILD+' · '+PLAT,375,1130,20,'#a07a55');
}
const GUIDE=[
  [['이렇게 해요','怎么玩'],['① 빈 모래 자리를 눌러 간식 가게를 차려요.\n\n② 배고픈 바다 손님이 바다에서 길을 따라 마을로 와요.\n\n③ 가게가 간식을 던져 줘요. 머리 위 막대가 다 차면 배불러서 바다로 돌아가요.\n\n④ 놓친 손님은 마을 간식을 훔쳐 가요. 간식이 0이 되면 끝!\n\n⑤ 파도를 모두 넘기면 클리어. 간식을 18개 이상 지키면 별 3개예요.','① 点空沙堆摆小吃摊。\n\n② 馋嘴的小海怪会从海里沿着路走向小镇。\n\n③ 小吃摊会自动投喂。头顶的条满了，它就吃饱回海里。\n\n④ 没喂饱的客人会偷走小镇的点心，点心为 0 就结束！\n\n⑤ 撑过所有波次就通关，守住 18 份以上点心是 3 星。']],
  [['가게 6종','6 种小吃摊'],null],
  [['손님마다 입맛이 달라요','客人口味各不同'],['편식쟁이 (파란 막대: 복어·소라게·거북)\n→ 빙수와 차는 잘 먹어요. 소라게는 만두·팝콘을 특히 좋아해요.\n\n갈매기\n→ 길을 무시하고 날아와요. 만두와 찹쌀떡은 하늘까지 못 던져요.\n\n문어\n→ 가게에 먹물을 뿌려요. 가게를 눌러 닦아 주세요.\n\n거북\n→ 배가 반쯤 차면 신나서 달려요. 미리 느리게 해 두세요.\n\n보스\n→ 부하를 부르거나 가게를 멈추게 해요. 탕후루 왕꼬치가 3배로 먹여요.','挑食的客人（蓝条：河豚、寄居蟹、海龟）\n→ 爱吃刨冰和茶。寄居蟹特别爱包子和爆米花。\n\n海鸥\n→ 不走路，直接飞过来。包子和年糕扔不到天上。\n\n章鱼\n→ 会朝小吃摊喷墨汁，点一下摊位擦干净。\n\n海龟\n→ 吃到半饱会兴奋地冲刺，记得提前减速。\n\nBOSS\n→ 会叫帮手或让摊位停工。巨无霸糖葫芦能喂 3 倍。']],
  [['잘하는 요령','小窍门'],['· 길이 꺾이는 안쪽에 차리면 더 오래 먹일 수 있어요.\n\n· 가게를 누르면 키울 수 있어요. 3단계 다음엔 새 메뉴 두 가지 중 하나를 골라요.\n\n· 다음 파도를 미리 부르면 남은 시간만큼 골드를 더 받아요.\n\n· 큰 파도는 손님을 전부 뒤로 밀어내고, 왕수박은 누른 곳을 한꺼번에 먹여요.\n\n· 막히면 가게 화면에서 동전으로 숙련을 올려요. 모든 판에서 더 맛있어져요.\n\n· 가게를 팔면 쓴 골드의 70%를 돌려받아요.','· 把摊位摆在拐弯内侧，能喂得更久。\n\n· 点一下摊位可以升级，3 级之后从两种新菜单里选一个。\n\n· 提前叫下一波，可按剩余时间多拿金币。\n\n· 大浪会把客人全部推回去，大西瓜能一次喂饱一片。\n\n· 卡关时去小吃摊界面用金币提升熟练度，每一关都更美味。\n\n· 出售摊位可返还 70% 金币。']],
];
function drawGuide(){
  backdrop(.75);topBar(L('안내서','玩法指南'),1);const n=GUIDE.length,pg=Math.max(0,Math.min(n-1,APP.page||0)),G=GUIDE[pg];panel(40,140,670,960,CREAM,30);
  txt(LL(G[0]),375,196,36,RED_D);
  if(G[1])wrap(LL(G[1]),80,262,24,590,36,INK,'left');
  else TOWER_IDS.forEach((id,i)=>{const y=240+i*140;g.fillStyle=HCOL[id];rr(70,y,110,120,20);g.fill();g.lineWidth=3;g.strokeStyle=INK;g.stroke();stallIcon(id,125,y+96,1);txt(LL(HN[id]),200,y+30,28,INK,'left');wrap(LL(TROLE[id]),200,y+68,21,480,30,'#8a6a4a','left',2);});
  for(let i=0;i<n;i++){g.fillStyle=i===pg?RED:'#d9c8a8';circ(375+(i-(n-1)/2)*34,1070,9);g.fill();}
  btn(60,1124,300,88,L('‹ 앞으로','‹ 上一页'),()=>{sfx('btn');APP.page=pg-1;},{col:CREAM,dk:'#d9c8a8',tc:INK,sz:30,off:pg===0});
  btn(390,1124,300,88,pg===n-1?L('알겠어요!','知道啦！'):L('다음 ›','下一页 ›'),()=>{sfx('btn');if(pg===n-1)goHome();else APP.page=pg+1;},{sz:30});
}
function drawPrivacy(){
  backdrop(.75);topBar(L('개인정보 처리방침','隐私政策'),1);panel(40,140,670,900,CREAM,30);
  const s=L('이 게임은 이름·사진·전화번호·위치를 묻거나 모으지 않아요.\n\n게임 진행(동전, 영웅 레벨, 별, 설정)은 이 기기 안에만 저장돼요. 진행 초기화를 누르면 모두 지워져요.\n\n광고는 플랫폼(위챗·더우인)의 광고 기능으로 보여 주며, 어린이에게 맞는 광고 설정을 사용해요. 광고는 모두 직접 고를 때만 나와요.\n\n미성년자 이용 시간과 실명 확인은 플랫폼의 보호 기능을 그대로 따라요.\n\n문의: 게임 소개 화면의 연락처',
    '本游戏不会询问或收集姓名、照片、电话、位置等个人信息。\n\n游戏进度（金币、伙伴等级、星星、设置）仅保存在本设备内，点击“重置进度”即可全部清除。\n\n广告由平台（微信、抖音）的广告功能提供，并启用适合儿童的广告设置。所有广告都只在玩家主动选择时出现。\n\n未成年人游戏时长与实名认证，遵循平台的防沉迷功能。\n\n联系方式：见游戏简介页面');
  g.textAlign='left';wrap(s,76,196,24,600,38,INK,'left');
}

function drawResult(){
  backdrop(.55);const r=RES;r.t+=1/60;BT.length=0;panel(60,210,630,900,CREAM,40);
  drawImg(r.won?'tt_cheer':'didi_sick',375,400,r.won?230:150);
  txt(r.won?L('모두 배불렀어요!','全都喂饱啦！'):L('아쉬워요!','差一点点！'),375,470,56,r.won?RED:INK);
  txt(L('제 ','第 ')+(r.si+1)+L(' 장 · ',' 关 · ')+LL(SN[r.si])+(r.won?'':'  ·  '+L('파도 ','到第 ')+r.wave+' / '+r.waves+L('',' 波')),375,528,26,'#8a6a4a');
  for(let i=0;i<3;i++){const on=i<r.stars,pop=on?Math.min(1,Math.max(0,(r.t-.3-i*.25)*5)):1;icoStar(275+i*100,608,(i===1?46:40)*(on?(.6+.4*pop):1),on&&pop>0);}
  if(r.won&&r.stars<3)txt(L('간식을 18개 이상 지키면 별 3개','守住 18 份以上点心就是 3 星'),375,672,21,'#a07a55');
  if(!r.won)txt(L('가게 숙련을 올리거나, 길이 꺾이는 곳에 차려 봐요','试试提升熟练度，或把摊位摆在拐弯处'),375,672,23,'#a07a55');
  icoCoin(270,740,30);txt('+'+(r.reward*(r.doubled?2:1)+r.first),400,742,54,INK);
  if(r.first)txt(L('첫 클리어 보너스 +','首次通关奖励 +')+r.first,375,796,22,'#3a9478');
  let y=822;
  if(r.unlock.length){const id=r.unlock[0];g.fillStyle=HCOL[id];rr(110,y,530,84,24);g.fill();g.lineWidth=4;g.strokeStyle=INK;g.stroke();drawImg(HERO_IMG[id],170,y+82,84);txt(L('새 가게 ','新摊位 ')+r.unlock.map(q=>LL(HN[q])).join('·')+L(' 개업!',' 开张啦！'),400,y+43,30,INK);y+=98;}
  if(!r.doubled&&r.reward>0)btn(150,y,450,76,L('▶ 광고 보고 동전 2배','▶ 看广告金币翻倍'),()=>showAd('double',o=>{if(o){r.doubled=true;S.coins+=r.reward;sfx('reward');persist();}}),{col:YEL,dk:YEL_D,tc:INK,sz:30});
  if(r.won){btn(100,1012,270,76,L('한 번 더','再来一次'),()=>{sfx('btn');startBattle(r.si);},{col:MINT,dk:MINT_D,sz:28});
    btn(390,1012,260,76,r.si<STAGES.length-1?L('다음 장으로','下一关'):L('홈으로','回主页'),()=>{sfx('btn');if(r.si<STAGES.length-1)S.sel=r.si+1;goHome();},{sz:28});
    if(API||(typeof navigator!=='undefined'&&navigator.share))btn(610,226,64,60,'',()=>shareGame(),{col:CREAM,dk:'#d9c8a8',icon:(x,yy)=>{g.strokeStyle=INK;g.lineWidth=5;g.lineCap='round';g.beginPath();g.moveTo(x,yy+12);g.lineTo(x,yy-12);g.moveTo(x-10,yy-3);g.lineTo(x,yy-13);g.lineTo(x+10,yy-3);g.stroke();}});}
  else{btn(100,1012,270,76,L('가게 숙련 올리기','提升熟练度'),()=>{sfx('btn');goHome();scr='heroes';},{col:MINT,dk:MINT_D,sz:28});btn(390,1012,260,76,L('다시 도전','再挑战'),()=>{sfx('btn');startBattle(r.si);},{sz:28});}
}

/* ---------- 한 프레임 ---------- */
function draw(){
  if(API)g.setTransform(1,0,0,1,0,0),g.fillStyle='#bfe9f5',g.fillRect(0,0,cv.width,cv.height),g.setTransform(view.s,0,0,view.s,view.ox,view.oy);else g.setTransform(1,0,0,1,0,0);
  g.globalAlpha=1;BT=[];
  if(scr==='load')drawLoad();else if(scr==='home')drawHome();else if(scr==='battle')drawBattle();else if(scr==='result')drawResult();else if(scr==='heroes')drawHeroScr();else if(scr==='reward')drawReward();else if(scr==='settings')drawSettings();else if(scr==='guide')drawGuide();else drawPrivacy();
  if(adOv){BT.length=0;g.fillStyle='rgba(20,14,10,.88)';g.fillRect(0,0,VW,VH);txt(L('테스트 광고','测试广告'),375,600,54,'#fff');txt(L('출시 때 진짜 광고로 바뀌어요','上线后会换成正式广告'),375,670,26,'#d8c8b0');txt(Math.ceil(adOv.t),375,770,80,'#ffd93d');}
  if(APP.toast){const o=Math.min(1,APP.toast.t*3);g.globalAlpha=o;font(28);const w=Math.min(700,g.measureText(APP.toast.s).width+70);g.fillStyle='rgba(60,36,20,.9)';rr(375-w/2,1120,w,70,35);g.fill();txtFit(APP.toast.s,375,1156,28,w-40,'#fff');g.globalAlpha=1;}
}
function onDown(x,y){if(scr==='battle'&&B)battleDown(x,y);}
function onUp(x,y){
  if(adOv)return;
  if(scr==='battle'&&B&&B.drag&&PTR.moved){battleUp(x,y);return;}
  if(!PTR.moved){const s={x:PTR.sx,y:PTR.sy};for(let i=BT.length-1;i>=0;i--){const b=BT[i];if(hitR(PTR,b.x,b.y,b.w,b.h)&&hitR(s,b.x,b.y,b.w,b.h)){if(B)B.drag=null;b.fn();return;}}}
  if(scr==='battle'&&B)battleUp(x,y);
}
function botStep(){if(!run||scr!=='battle'||paused||run.phase==='revive'&&!revive(run))return;if(run.phase!=='run'||Math.random()>.2)return;
  const empty=run.spots.map((sp,i)=>i).filter(i=>!run.spots[i].tw),ids=run.owned;
  if(empty.length&&run.spots.length-empty.length<3+run.wave)build(run,empty[Math.floor(Math.random()*empty.length)],ids[Math.floor(Math.random()*ids.length)]);
  else{const up=run.spots.map((sp,i)=>i).filter(i=>run.spots[i].tw&&run.spots[i].tw.lv<4);if(up.length){const i=up[Math.floor(Math.random()*up.length)];upgrade(run,i,BRANCH[run.spots[i].tw.id][Math.floor(Math.random()*2)]);}}
  run.spots.forEach((sp,i)=>{if(sp.tw&&sp.tw.ink>0)cleanInk(run,i);});if(run.ws==='prep'&&run.spots.some(sp=>sp.tw))callWave(run);
  if(run.en.length>6){castTide(run);const e=run.en[0];castBomb(run,e.x,e.y);}}
let lastTs=0;
function frame(ts){
  const dt=Math.min(.1,Math.max(0,(ts-lastTs)/1000||0));lastTs=ts;APP.t+=dt;if(scr==='load')APP.loadT+=dt;if(APP.toast&&(APP.toast.t-=dt)<=0)APP.toast=null;if(APP.resetArm>0)APP.resetArm-=dt;
  try{adTick(dt);if(scr==='battle'&&B){APP.playSec+=dt;if(APP.bot)botStep();battleTick(dt);}draw();}
  catch(e){APP.errs++;APP.lastErr=String(e&&e.stack||e);if(APP.errs<4)track('draw_error',{m:String(e&&e.message||e).slice(0,80)});}
  requestAnimationFrame(frame);
}
function onAppHide(){APP.hidden=true;if(scr==='battle'&&run&&!run.ended)paused=true;if(AU.c)musicStop();persist();track('app_hide',{scr});}
function onAppShow(){APP.hidden=false;musicSync();}
if(API){API.onHide&&API.onHide(onAppHide);API.onShow&&API.onShow(onAppShow);
  try{const um=API.getUpdateManager&&API.getUpdateManager();if(um)um.onUpdateReady(()=>um.applyUpdate());}catch(e){}}
else document.addEventListener('visibilitychange',()=>document.hidden?onAppHide():onAppShow());

mkSprites();mkBg();MUST.forEach(n=>loadImg(n));LATER.forEach(n=>loadImg(n));OPT.forEach(n=>loadImg(n));dailyInit();track('app_open',{lang:LANG});
if(DEBUG)window.__bepaDebug={get S(){return S;},get run(){return run;},get B(){return B;},APP,TRK,go:s=>{if(s==='home')goHome();else scr=s;},start:i=>startBattle(i||0),bot:b=>{APP.bot=!!b;},speed:n=>{speed=n;},
  give:n=>{S.coins+=n;},unlockAll:()=>{TOWER_IDS.forEach(id=>{if(!S.lv[id])S.lv[id]=1;});S.cleared=5;},win:()=>{if(run)finish(run,true);},lose:()=>{if(run){run.lives=0;finish(run,false);}},
  au:()=>({state:AU.c&&AU.c.state,cur:MUS.cur,step:MUS.step,merr:MUS.err||0,mlast:MUS.last||'',serr:AU.err||0,slast:AU.lastErr||''}),sfx,wantMusic,
  scr:()=>scr,ad:()=>adOv,lang:l=>{LANG=l;},draw,core:{step,build,upgrade,sell,callWave,castTide,castBomb,cleanInk,inkTower,spawn,revive}};
requestAnimationFrame(frame);
