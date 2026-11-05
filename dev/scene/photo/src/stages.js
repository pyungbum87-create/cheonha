/* 团团小镇闹哄哄 — 20 stages. Add a stage by adding one entry; build.py turns this into JSON.
   probs = 5 independent problems (flag names). objs = pictures or hot spots. rules = what the player can do.
   Every combination of solved/unsolved must stay reachable: `node qa.js` checks this. */
const say=(zh,ko,at,d)=>['say',[zh,ko],at,d];
const set=f=>['set',f];
const r=(on,t,iff,...d)=>({on,t,if:iff,do:d});
const tap=(t,iff,...d)=>r('tap',t,iff,...d);
const swipe=(t,dir,iff,...d)=>Object.assign(r('swipe',t,iff,...d),{dir});
const hold=(t,iff,...d)=>r('hold',t,iff,...d);
const drag=(t,to,iff,...d)=>Object.assign(r('drag',t,iff,...d),{to});
const rot=(t,goal,iff,over,...d)=>Object.assign(r('rot',t,iff,...d),{goal,over:over&&over.at,overDo:over&&over.do});
const use=(tool,t,iff,...d)=>Object.assign(r('use',t,iff,...d),{tool});
const rub=(tool,t,iff,...d)=>Object.assign(r('rub',t,iff,...d),{tool});
const P=(id,fz,fk,sz,sk,at)=>({id,f:[fz,fk],s:[sz,sk],at});
const DIDI={id:'didi',img:'didi',miss:['这里不用水呀','여긴 물이 필요 없어']},SHAN={id:'shan',img:'shanshan',miss:['这里已经很亮啦','여긴 이미 밝아']},DUN={id:'dun',img:'dundun',miss:['这个不能用球碰哦','이건 공으로 건드리면 안 돼']},ZHUO={id:'zhuo',img:'zhuozhuo',miss:['这个我拿不动！','이건 내가 못 들어!']},PENG={id:'peng',img:'pengpeng',miss:['这里不用撒彩纸','여긴 색종이가 필요 없어']},TUAN={id:'tuan',img:'tt_cheer',miss:['这里没人闻到香味','여긴 아무도 냄새를 못 맡아']};
const CLOTH={id:'cloth',img:'hanky',miss:['擦不动呀','닦이지 않아']},BROOM={id:'broom',img:'broom2',miss:['这里不用扫','여긴 안 쓸어도 돼']},DUSTER={id:'duster',img:'duster',miss:['这里没有灰','여긴 먼지가 없어']},PAIL={id:'pail',img:'pail',miss:['这里挖不动','여긴 못 파']};
function stage(o){o.tools=o.tools.map(t=>Object.assign({},t));o.time=o.time||120;o.titles=o.titles||{};o.probs.forEach((p,i)=>{const m=o.probs.map((_,k)=>k===i?'1':'0').join('');o.titles[m]=p.s;});o.titles['00000']=o.all;o.titles['11111']=o.none;o.titles[o.pair[0]]=[o.pair[1],o.pair[2]];delete o.all;delete o.none;delete o.pair;for(const q of o.probs)delete q.s;return o;}
const LILI_SAD=['mood','worry'];

const ST=[
/* 1 ---------------------------------------------------------------- */
stage({id:1,title:'春节合照大翻车',ko:'설날 가족사진',goal:'春节全家福',bg:'spring_bg',lili:[.53,.51,.21],hid:'paw',fog:'camera',
 open:[say('哎呀！大家还没准备好呢！','앗! 다들 아직 준비가 안 됐잖아!','lili',2),['wait',2],say('没关系，什么时候拍都好玩！','괜찮아, 언제 찍어도 재미있을 거야!','tuan',2.2)],
 probs:[P('puddle','地上还湿着','바닥은 아직 젖었고','地板还湿着的全家福','바닥만 촉촉한 가족사진'),P('cat','猫咪还气着','고양이는 아직 화났고','炸毛猫咪抢镜啦！','삐친 고양이가 주인공!'),P('pot','花儿在打盹','꽃은 졸고 있고','花儿还在打瞌睡','꽃도 졸고 있는 사진'),P('scroll','挂轴歪着呢','족자는 삐딱하고','挂轴歪了也要拍！','족자가 삐딱해도 찰칵!'),P('camera','镜头又起雾啦','카메라엔 또 김이 서렸네','雾蒙蒙的新年照','안개 속 설날 기념사진')],
 all:['大家都笑啦！','모두가 웃는 설날'],none:['还没准备好就咔嚓！','준비도 안 됐는데 찰칵!'],pair:['11000','猫咪和水坑的合影','고양이와 웅덩이의 합작'],
 tools:[BROOM,Object.assign({},CLOTH,{have:'frame'}),DIDI],
 objs:[{id:'drain',img:'drain',x:.91,y:.91,w:.12,z:1},{id:'puddle',img:'puddle',x:.63,y:.81,w:.30,z:2,show:'!puddle',r:.15},
  {id:'scroll',img:'banner',x:.74,y:.30,w:.135,z:2,r:.09,alt:[{if:'scroll',img:'scroll_ok',w:.125}]},{id:'pot',img:'pot_wilt',x:.21,y:.63,w:.17,z:2,alt:[{if:'pot',img:'pot_bloom'}]},
  {id:'cat',img:'cat_wet',x:.80,y:.63,w:.22,z:3,r:.12,alt:[{if:'catSafe',x:.37,y:.67},{if:'cat',img:'cat_dry'}]},{id:'tuan',img:'cam_fog',x:.42,y:.83,w:.19,z:4,r:.11,alt:[{if:'camera',img:'cam_clear'}]},
  {id:'lili',hot:1,x:.53,y:.51,r:.09},{id:'hidP',img:'paw',x:.09,y:.90,w:.05,z:3,show:'frame&!found'},{id:'frame',img:'frame',x:.115,y:.87,w:.19,z:5,r:.10,alt:[{if:'frame',x:.24,rot:-.05}]}],
 rules:[tap('frame','!frame',set('frame'),['wig','frame',.3],say('后面好像有东西！','뒤에 뭔가 있어!','frame'),['wait',.9],say('找到手帕啦！','손수건을 찾았어!',[.5,.92]),['tone','good']),
  tap('hidP','',set('found'),['found'],say('咦？谁来过这里呀？','어라? 여기 누가 다녀갔지?','hidP')),
  rub('broom','puddle','!puddle',['fx','splash','puddle'],set('puddle')),
  rub('cloth','cat','!cat&puddle|!cat&catSafe',set('cat')),
  Object.assign(rub('cloth','cat','!cat&!puddle&!catSafe&!tw',set('tw'),['tmp','cat',{img:'cat_dry'}],say('好舒服～','아, 개운해~','cat',.8),['tone','good'],['wait',.8],['go','cat',.68,.77,.5,.12],['tmp','cat',{img:'cat_wet'}],['fx','splash','puddle'],['tone','nope'],['mood','shock'],say('喵？！怎么又湿了！','야옹?! 왜 또 젖은 거야!',[.66,.3],1.4),['wait',1.1],say('糟糕！水坑还在呢！','이런! 웅덩이가 그대로잖아!',[.5,.3],1.6),['wait',.4],['go','cat',.80,.63,.45],['off','cat'],['zone',.37,.70,.10,5]),{lockq:1}),
  Object.assign(rub('cloth','cat','!cat&!puddle&!catSafe&tw',['tmp','cat',{img:'cat_dry'}],['wait',.3],['tmp','cat',{img:'cat_wet'}],['fx','splash','cat'],say('又湿啦！','또 젖었어!','cat',1),['off','cat'],['zone',.37,.70,.10,4]),{lockq:1}),
  drag('cat',[.37,.70,.11],'!catSafe&!cat',set('catSafe'),say('这里干干的！','여기는 뽀송해!',[.37,.5])),
  tap('cat','!cat',['wig','cat',.5],say('喵！我好湿！','야옹! 나 흠뻑 젖었어!','cat')),
  use('didi','pot','!pot',['fly','didi','tray','pot',.5,.1,.1],['fx','drops','pot'],set('pot'),say('哇！喝到水啦！','와! 물 마셨다!','pot')),
  Object.assign(use('didi','cat','!cat&!pot',['wig','cat',1],['tone','shake'],say('喵呜！抖抖抖！','부르르르!','cat',1),['wait',.5],['fx','drops','pot'],set('pot'),say('哇！喝到水啦！','와! 물 마셨다!','pot')),{lockq:1}),
  use('didi','cat','!cat&pot',['wig','cat',1],['tone','shake'],say('喵呜！抖抖抖！','부르르르!','cat',1)),
  use('didi','tuan','!camera',['wig','tuan',.7],['tone','nope'],say('哎呀，更模糊啦！','앗, 더 뿌옇게 됐네!','tuan')),
  rub('cloth','tuan','!camera',set('camera')),tap('tuan','',['pv']),
  use('broom','cat','!cat',['wig','cat',.6],['tone','nope'],say('我又不是灰尘！','난 먼지가 아니야!','cat')),
  use('cloth','pot','!pot',['wig','pot',.6],['tone','nope'],say('我想喝点水呀～','나한테 필요한 건 물이야~','pot')),use('cloth','puddle','!puddle',['wig','puddle',.6],['tone','nope'],say('这也太多水啦！','이건 나한테 너무 많아!','puddle')),
  tap('pot','!pot',['wig','pot',.5],say('我好渴……','목말라…','pot')),tap('puddle','!puddle',['wig','puddle',.5],say('哼！谁也别想踩我！','흥! 아무도 날 못 밟아!','puddle')),tap('lili','',say('哎呀，又被我弄乱啦！','앗, 내가 또 어질러 버렸네!','lili')),
  rot('scroll',-.23,'!scroll',{at:-.3,do:[['wig','scroll',.7],['tone','nope'],say('轻一点！我头晕啦！','살살! 나 어지러워!','scroll')]},set('scroll'))]}),
/* 2 shop opening ---------------------------------------------------- */
stage({id:2,title:'开张第一张',ko:'가게 개점 사진',goal:'开张纪念照',bg:'l1_bg2',lili:[.72,.79,.19],hid:'hat',
 open:[say('今天开张，可摄影师还在睡觉！','오늘 개점인데 사진사가 아직 자고 있어!','lili',2.4)],
 probs:[P('wake','团团还在打呼噜','퇀퇀은 코를 골고','摄影师睡着啦！','사진사가 잠들었어!'),P('alarm','闹钟响个不停','자명종은 계속 울리고','闹钟抢镜了','자명종이 주인공'),P('sign','招牌躺在地上','간판은 바닥에 누웠고','招牌还没挂','간판을 못 달았어'),P('shutter','卷帘门还关着','셔터는 닫혀 있고','客人进不来','손님이 못 들어와'),P('dim','烧卖跑错了地方','샤오마이는 엉뚱한 곳에 있고','烧卖迷路了','길 잃은 샤오마이')],
 all:['开张大吉！','개점 대성공!'],none:['这家店还没醒','아직 잠든 가게'],pair:['11000','闹钟也叫不醒的团团','자명종도 못 깨운 퇀퇀'],
 tools:[DIDI],
 objs:[{id:'shutter',img:'door',x:.42,y:.385,w:.40,h:.42,z:1,show:'!shutter',r:.14},{id:'clock',img:'clock',x:.235,y:.525,w:.08,z:2,anim:'shake',calm:'alarm',r:.07},{id:'tuan',img:'tuantuan_sleep',x:.42,y:.80,w:.27,z:3,r:.13,alt:[{if:'wake',img:'tuantuan',w:.18,y:.76}]},
  {id:'sign',img:'sign',x:.86,y:.87,w:.11,rot:.25,z:4,r:.08,alt:[{if:'sign',x:.43,y:.21,rot:0}]},{id:'siu',img:'siumai',x:.11,y:.88,w:.09,z:4,r:.07,alt:[{if:'dim',x:.79,y:.46}]},{id:'hatH',img:'hat',x:.93,y:.56,w:.06,z:2,show:'!found'}],
 rules:[Object.assign(tap('clock','!alarm&!wake',['tmp','tuan',{img:'tuantuan',w:.18,y:.76}],set('alarm'),say('终于安静了……','드디어 조용해졌다…','tuan',1.2),['wait',1.1],['off','tuan'],['tone','nope'],['mood','shock'],say('呼噜——又睡着啦！','드르렁~ 또 잠들었어!','tuan',1.6)),{lockq:1}),
  tap('clock','!alarm&wake',set('alarm')),drag('clock',[.42,.80,.14],'!alarm&!wake',set('wake'),say('早上好！吵死我啦！','좋은 아침! 시끄러워 죽겠네!','tuan')),
  use('didi','tuan','!wake',['fly','didi','tray','tuan',.5,.1,.1],['fx','drops','tuan'],set('wake'),say('凉凉的！我醒啦！','차가워! 깼어!','tuan')),
  tap('tuan','!wake',['wig','tuan',.6],say('再睡五分钟……','5분만 더…','tuan')),
  drag('sign',[.43,.16,.14],'!sign',set('sign')),swipe('shutter','up','!shutter',set('shutter'),['tone','shake']),
  drag('siu',[.79,.48,.12],'!dim',set('dim'),['fx','steam','siu']),tap('hatH','',set('found'),['found'],say('厨师帽藏在这里！','요리사 모자가 여기 있었네!','hatH'))]}),
/* 3 living room ball ------------------------------------------------ */
stage({id:3,title:'客厅乱糟糟',ko:'거실 공 소동',goal:'客厅合影',bg:'l3_bg',lili:[.60,.72,.19],hid:'panda',
 open:[say('墩墩玩球，把客厅弄乱啦！','둥둥이 공놀이하다 거실을 어질렀어!','lili',2.4)],
 probs:[P('cushion','靠垫掉在地上','쿠션은 바닥에 있고','靠垫离家出走','가출한 쿠션'),P('shoe','鞋子跑到地毯边','신발은 양탄자 옆에 있고','一只鞋在旅行','여행 중인 신발'),P('shade','灯罩歪着头','전등갓은 고개를 갸웃하고','歪头的台灯','고개 갸웃 스탠드'),P('rug','地毯翘着角','양탄자는 귀퉁이가 들렸고','地毯在招手','손 흔드는 양탄자'),P('paper','纸团没进垃圾桶','종이뭉치는 밖에 있고','差一点就进了','아깝게 빗나간 종이뭉치')],
 all:['干净得发光！','반짝반짝 거실!'],none:['墩墩比赛现场','둥둥의 경기장'],pair:['00011','歪歪的灯和翘翘的毯','삐딱한 스탠드와 들린 양탄자'],
 tools:[],
 objs:[{id:'dun',img:'dundun',x:.13,y:.74,w:.16,z:2,r:.07},{id:'cushion',img:'cushion',x:.36,y:.86,w:.11,z:3,r:.08,alt:[{if:'cushion',x:.44,y:.565}]},{id:'shoe',img:'shoe',x:.79,y:.87,w:.11,z:3,r:.08,alt:[{if:'shoe',x:.93,y:.71}]},
  {id:'shade',img:'shade',x:.837,y:.32,w:.14,rot:.35,z:3,r:.10,alt:[{if:'shade',rot:0}]},{id:'rug',img:'rugc',x:.72,y:.80,w:.11,z:1,show:'!rug',r:.08},{id:'paper',img:'paper',x:.49,y:.91,w:.06,z:3,show:'!paper',r:.06},{id:'bin',img:'bin',x:.075,y:.92,w:.09,z:2,r:.06},{id:'hidH',img:'panda',x:.645,y:.52,w:.05,z:2,show:'shoe&!found'}],
 rules:[drag('cushion',[.44,.565,.11],'!cushion',set('cushion')),drag('shoe',[.93,.72,.10],'!shoe',set('shoe')),rot('shade',-.35,'!shade',{at:-.25,do:[['wig','shade',.6],say('转太多啦！','너무 돌렸어!','shade')]},set('shade')),swipe('rug','up','!rug',set('rug')),
  Object.assign(drag('paper',[.075,.90,.09],'!paper&!tw',set('tw'),['fx','spark','bin'],['tmp','paper',{x:.075,y:.86,show:true}],['go','paper',.49,.91,.5,.12],['tone','nope'],['off','paper'],say('弹出来啦！墩墩：再投一次！','튕겨 나왔어! 둥둥: 한 번 더!','dun',1.8)),{lockq:1}),drag('paper',[.075,.90,.09],'!paper&tw',set('paper')),
  tap('dun','',['wig','dun',.5],say('我不是故意的嘛！','일부러 그런 거 아니야!','dun')),tap('hidH','',set('found'),['found'],say('小熊猫玩偶躲在这里！','판다 인형이 숨어 있었네!','hidH'))]}),
/* 4 attic ------------------------------------------------------------ */
stage({id:4,title:'阁楼停电了',ko:'다락 정전',goal:'阁楼合影',bg:'l6_bg',lili:[.50,.76,.19],hid:'flashlight',dark:{a:.58,off:'lamp'},
 open:[say('好黑呀！闪闪，能帮帮我吗？','깜깜해! 반짝아, 도와줄래?','lili',2.4)],
 probs:[P('lamp','电灯没有亮','전등은 꺼져 있고','一张黑黑的照片','깜깜한 사진'),P('chest','箱子还锁着','상자는 닫혀 있고','箱子里有什么？','상자 속엔 뭐가 있을까?'),P('jar','萤火虫还关着','반딧불이는 갇혀 있고','萤火虫想出来','나오고 싶은 반딧불이'),P('web','蜘蛛网还挂着','거미줄은 그대로고','蜘蛛也来合影','거미도 함께 찰칵'),P('lan','灯笼放在地上','등롱은 바닥에 있고','灯笼没挂好','못 건 등롱')],
 all:['亮堂堂的小阁楼','환한 다락방'],none:['什么都看不见！','아무것도 안 보여!'],pair:['10001','黑漆漆的灯笼合影','깜깜한 등롱 사진'],
 tools:[SHAN,DUSTER],
 objs:[{id:'bulb',hot:1,x:.5,y:.11,r:.09},{id:'sw',hot:1,x:.876,y:.36,r:.06},{id:'chest',hot:1,x:.17,y:.72,r:.10},{id:'flash',img:'flashlight',x:.2,y:.58,w:.09,z:4,show:'chest&!found',r:.06},{id:'jar',img:'jar',x:.805,y:.43,w:.07,z:2,r:.06},{id:'lid',img:'lid',x:.805,y:.445,w:.13,z:3,show:'!lidoff',r:.07},{id:'web',img:'web',x:.09,y:.13,w:.15,z:2,show:'!web',r:.09},{id:'lan',img:'plantern',x:.70,y:.87,w:.10,z:4,r:.08,alt:[{if:'lan',x:.74,y:.20}]}],
 rules:[Object.assign(tap('sw','!bulb&!lamp&!tw',set('tw'),['tone','note',660],['fx','spark','bulb'],say('亮了！……又灭了！','켜졌다! …또 꺼졌어!','bulb',1.5)),{lockq:1}),tap('sw','!bulb&tw',['tone','nope'],say('灯泡松了，要先照一照','전구가 헐거워, 먼저 비춰 봐','bulb')),
  use('shan','bulb','!bulb',['fly','shanshan','tray','bulb',.6,.1,.11],['fx','spark','bulb'],set('bulb'),say('找到啦，灯泡拧好了！','찾았다, 전구를 끼웠어!','bulb')),tap('sw','bulb&!lamp',set('lamp')),
  tap('chest','!chest',set('chest'),['fx','spark','chest']),swipe('lid','up','!lidoff',set('lidoff')),tap('jar','lidoff&!jar',set('jar'),['fx','spark','jar']),rub('duster','web','!web',set('web')),drag('lan',[.74,.20,.11],'!lan',set('lan')),tap('flash','',set('found'),['found'],say('手电筒！送给你当纪念','손전등! 기념으로 가져!','flash'))]}),
/* 5 temple fair chain ------------------------------------------------ */
stage({id:5,title:'庙会连环响',ko:'장터 연쇄 소동',goal:'庙会合影',bg:'l10_bg',lili:[.50,.72,.17],hid:'envelope',
 open:[say('招牌、狮子、风筝，全乱套啦！','간판, 사자, 연까지 다 엉망이야!','lili',2.4)],
 probs:[P('lion','狮子还在台下','사자는 무대 아래 있고','狮子怕上台','무대가 무서운 사자'),P('drum','大鼓没人敲','큰북은 조용하고','安静的大鼓','조용한 큰북'),P('kite','风筝挂在树上','연은 나무에 걸렸고','风筝不肯下来','내려오기 싫은 연'),P('sign','招牌还没挂','간판은 아직이고','没有招牌的庙会','간판 없는 장터'),P('haw','墩墩没吃到糖葫芦','둥둥은 탕후루를 못 먹었고','墩墩肚子饿','배고픈 둥둥')],
 all:['锣鼓喧天！','신나는 장터!'],none:['庙会还在打瞌睡','아직 졸고 있는 장터'],pair:['01100','鼓不响风筝也不下来','북도 조용, 연도 그대로'],
 tools:[],
 objs:[{id:'dun',img:'dundun',x:.3,y:.82,w:.16,z:3,r:.08},{id:'drum',hot:1,x:.86,y:.80,r:.10},{id:'lion',img:'lion',x:.60,y:.92,w:.14,z:5,r:.09,alt:[{if:'lion',x:.18,y:.5}]},{id:'haw',img:'hawthorn',x:.78,y:.47,w:.05,z:4,rot:.4,r:.07,alt:[{if:'haw',hide:1}]},{id:'kite',img:'kite',x:.80,y:.14,w:.15,z:2,r:.09,alt:[{if:'kite',x:.73,y:.87,rot:.2}]},{id:'sign',img:'sign',x:.10,y:.92,w:.10,rot:-.2,z:4,r:.07,alt:[{if:'sign',x:.5,y:.26,rot:0}]},{id:'lamp',hot:1,x:.38,y:.38,r:.06}],
 rules:[drag('lion',[.17,.52,.14],'!lion',set('lion'),['fx','confetti','lion']),
  Object.assign(tap('drum','lion&!drum&!kite',set('drum'),['tone','note',196],['fx','spark','drum'],['wig','kite',1],say('鼓声一响，风筝吓掉了！','북소리에 연이 놀라 떨어졌어!','kite',1.6),['wait',.8],set('kite')),{lockq:1}),tap('drum','!drum&!lion|!drum&kite',set('drum'),['tone','note',196]),
  swipe('kite','down','!kite',set('kite')),drag('sign',[.5,.22,.14],'!sign',set('sign')),drag('haw',[.3,.80,.12],'!haw',set('haw'),say('甜甜的！','달콤해!','dun')),tap('lamp','!found',set('found'),['found'],say('灯笼里藏着红包！','등롱 속에 빨간 봉투가!','lamp'))]}),
/* 6 beach ------------------------------------------------------------ */
stage({id:6,title:'海鸥抢野餐',ko:'해변 소풍',goal:'海边合影',bg:'l8_bg',lili:[.20,.72,.18],hid:'shell',
 open:[say('海鸥盯上点心盒啦！','갈매기가 간식 상자를 노려!','lili',2.2)],
 probs:[P('gull','海鸥还不走','갈매기는 안 떠났고','海鸥也想合影','갈매기도 찰칵'),P('para','伞还没撑开','파라솔은 접혀 있고','太阳好大','해가 너무 뜨거워'),P('lunch','点心盒放在沙子上','간식 상자는 모래 위에 있고','点心吃沙子','모래 먹는 간식'),P('dig','小铲子还没挖','모래는 아직 안 팠고','没挖到宝贝','보물을 못 찾았어'),P('water','小桶空空的','양동이는 비어 있고','空空的小桶','텅 빈 양동이')],
 all:['海风吹来好心情','바닷바람 좋은 날'],none:['海鸥赢了这一局','이번 판은 갈매기 승'],pair:['10100','海鸥盯着点心盒','간식 노리는 갈매기'],
 tools:[DUN,PAIL],
 objs:[{id:'gull',img:'gull',x:.62,y:.17,w:.13,z:5,anim:'bob',show:'!gull',r:.09},{id:'coco',hot:1,x:.85,y:.20,r:.08},{id:'lunch',img:'lunch',x:.62,y:.66,w:.11,z:3,r:.08,alt:[{if:'lunch',x:.42,y:.40}]},{id:'para',img:'para_c',x:.24,y:.50,w:.06,z:2,r:.07,alt:[{if:'para',img:'para_o',w:.2,y:.44}]},{id:'sand',hot:1,x:.42,y:.84,r:.11},{id:'shell',img:'shell',x:.42,y:.84,w:.08,z:2,show:'dig&!found',r:.06},{id:'sea',hot:1,x:.5,y:.26,r:.09}],
 rules:[use('dun','coco','!gull',['fly','dundun','tray','coco',.6,.2,.1],['fx','spark','coco'],['tone','note',330],say('椰子掉下来，吓跑海鸥！','코코넛이 떨어져 갈매기가 도망쳤어!','coco',1.6),set('gull')),use('dun','gull','!gull',['tone','nope'],say('不能打小鸟哦，打椰子树吧','새를 맞히면 안 돼, 야자나무를 노려 봐','gull',1.8)),
  drag('lunch',[.45,.42,.15],'!lunch&gull|!lunch&tw',set('lunch')),tap('para','!para',set('para')),rub('pail','sand','!dig',set('dig')),use('pail','sea','!water',['fx','splash','sea'],set('water')),tap('shell','',set('found'),['found'],say('好漂亮的贝壳！','예쁜 조개껍데기!','shell')),
  Object.assign(drag('lunch',[.45,.42,.15],'!lunch&!gull&!tw',set('tw'),['go','gull',.62,.56,.45,-.05],['tone','nope'],say('嘎！点心是我的！','까악! 간식은 내 거야!','gull',1.2),['wait',.8],['go','gull',.62,.17,.5],['off','gull']),{lockq:1})]}),
/* 7 post -------------------------------------------------------------- */
stage({id:7,title:'屋顶上的信',ko:'지붕 위 편지',goal:'邮局合影',bg:'post_bg',lili:[.60,.76,.18],hid:'gift',
 open:[say('啄啄的信被风吹上屋顶啦！','쫑쫑의 편지가 바람에 지붕으로 날아갔어!','lili',2.4)],
 probs:[P('letter','信还在屋顶','편지는 지붕에 있고','等信的邮筒','편지를 기다리는 우체통'),P('lan','灯笼没挂','등롱은 안 걸렸고','少了一盏灯','등롱이 하나 모자라'),P('paper','纸团满地跑','종이뭉치는 굴러다니고','门口有纸团','문 앞 종이뭉치'),P('bucket','水桶放错了','양동이는 엉뚱한 데 있고','水桶迷路了','길 잃은 양동이'),P('sign','告示牌是空的','게시판은 비어 있고','告示牌空空的','텅 빈 게시판')],
 all:['信送到啦！','편지 도착!'],none:['邮局忙成一团','정신없는 우체국'],pair:['10001','信和告示都不见了','편지도 게시도 없어'],
 tools:[ZHUO],
 objs:[{id:'env',img:'envelope',x:.37,y:.15,w:.07,z:3,rot:.2,r:.07,alt:[{if:'letter',x:.90,y:.40,rot:0,w:.06}]},{id:'lan',img:'lantern',x:.14,y:.90,w:.09,z:4,r:.07,alt:[{if:'lan',x:.245,y:.31}]},{id:'paper',img:'paper',x:.42,y:.88,w:.06,z:3,show:'!paper',r:.06},{id:'bin',img:'bin',x:.77,y:.84,w:.09,z:2,r:.06},{id:'bucket',img:'bucket',x:.30,y:.80,w:.10,z:3,r:.07,alt:[{if:'bucket',x:.43,y:.60}]},{id:'sign',img:'sign',x:.87,y:.92,w:.10,rot:.2,z:4,r:.07,alt:[{if:'sign',x:.355,y:.33,rot:0}]},{id:'hidG',img:'gift',x:.06,y:.60,w:.06,z:2,show:'lan&!found'}],
 rules:[Object.assign(use('zhuo','env','!letter&!tw',set('tw'),['fly','zhuozhuo','tray','env',.6,.2,.12],['fly','zhuozhuo','env',[.4,.56],.5,.1,.12],['tone','nope'],say('叼错啦，这是屋顶的瓦！','잘못 물었어, 이건 기왓장이야!',[.4,.46],1.6)),{lockq:1}),use('zhuo','env','!letter&tw',['fly','zhuozhuo','tray','env',.6,.2,.12],set('letter'),say('这次是信！投进邮筒啦','이번엔 편지야! 우체통에 쏙','env')),
  drag('lan',[.245,.31,.11],'!lan',set('lan')),drag('paper',[.77,.82,.09],'!paper',set('paper')),drag('bucket',[.43,.60,.11],'!bucket',set('bucket')),drag('sign',[.355,.33,.13],'!sign',set('sign')),tap('hidG','',set('found'),['found'],say('礼物躲在灌木里！','덤불에 선물이 숨어 있었네!','hidG'))]}),
/* 8 flowers ----------------------------------------------------------- */
stage({id:8,title:'花店开门啦',ko:'꽃가게 장식',goal:'花店合影',bg:'flower_bg',lili:[.50,.72,.19],hid:'tea',
 open:[say('花蔫了，灯笼也没挂！','꽃은 시들고 등롱도 못 걸었어!','lili',2.2)],
 probs:[P('p1','左边的花在打盹','왼쪽 꽃은 졸고','左边的花睡着了','왼쪽 꽃이 잠들었어'),P('p2','右边的花也在打盹','오른쪽 꽃도 졸고','右边的花睡着了','오른쪽 꽃이 잠들었어'),P('fu','福字没贴','복자는 안 붙었고','门上空空的','문이 허전해'),P('l1','左灯笼没挂','왼쪽 등롱은 없고','少了左灯笼','왼쪽 등롱이 없어'),P('l2','右灯笼没挂','오른쪽 등롱은 없고','少了右灯笼','오른쪽 등롱이 없어')],
 all:['花开富贵！','꽃이 활짝!'],none:['花店今天没开门','오늘은 쉬는 꽃가게'],pair:['00011','花开了灯还没挂','꽃은 피고 등은 아직'],
 tools:[DIDI,ZHUO],
 objs:[{id:'p1',img:'pot_wilt',x:.20,y:.84,w:.17,z:3,alt:[{if:'p1',img:'pot_bloom'}]},{id:'p2',img:'pot_wilt',x:.82,y:.84,w:.17,z:3,alt:[{if:'p2',img:'pot_bloom'}]},{id:'fu',img:'fu',x:.25,y:.47,w:.10,rot:.15,z:4,r:.08,alt:[{if:'fu',x:.79,y:.44,rot:0}]},{id:'l1',img:'lantern',x:.36,y:.90,w:.09,z:4,r:.07,alt:[{if:'l1',x:.355,y:.37}]},{id:'l2',img:'lantern',x:.66,y:.90,w:.09,z:4,r:.07,alt:[{if:'l2',x:.53,y:.37}]},{id:'hidT',img:'tea',x:.07,y:.58,w:.07,z:2,show:'!found'}],
 rules:[Object.assign(use('didi','p1','!p1&!tw',set('tw'),['fx','splash','p1'],['tone','nope'],say('水太多，都溢出来啦！再轻一点','물이 넘쳤어! 조금만 살살','p1',1.7)),{lockq:1}),use('didi','p1','!p1&tw',['fx','drops','p1'],set('p1')),use('didi','p2','!p2',['fx','drops','p2'],set('p2')),drag('fu',[.79,.44,.12],'!fu',set('fu')),
  use('zhuo','l1','!l1',['fly','zhuozhuo','tray','l1',.5,.1,.12],set('l1')),use('zhuo','l2','!l2',['fly','zhuozhuo','tray','l2',.5,.1,.12],set('l2')),drag('l1',[.355,.33,.11],'!l1',set('l1')),drag('l2',[.53,.33,.11],'!l2',set('l2')),tap('hidT','',set('found'),['found'],say('先喝杯茶吧','차 한잔 하고 해','hidT'))]}),
/* 9 wind ------------------------------------------------------------- */
stage({id:9,title:'大风来捣乱',ko:'바람 부는 언덕',goal:'山坡合影',bg:'hill_bg',lili:[.46,.76,.18],hid:'muffs',
 open:[say('风好大，东西都吹跑啦！','바람이 세서 물건이 다 날아가!','lili',2.2)],
 probs:[P('kite','风筝卡在树上','연은 나무에 걸렸고','风筝不下来','안 내려오는 연'),P('flags','彩旗掉了','깃발은 떨어졌고','没有彩旗','깃발이 없어'),P('b1','气球还没吹','풍선 하나는 쭈글하고','瘪瘪的气球','쭈글쭈글 풍선'),P('b2','另一个气球也瘪着','다른 풍선도 쭈글하고','又一个瘪气球','또 쭈글한 풍선'),P('para','伞被吹翻了','우산은 뒤집혔고','伞不听话','말 안 듣는 우산')],
 all:['风也来合影','바람도 함께 찰칵'],none:['全被风吹跑啦','바람이 다 가져갔어'],pair:['00110','两个瘪气球','쭈글한 풍선 둘'],
 tools:[DUN],
 objs:[{id:'kite',img:'kite',x:.86,y:.10,w:.14,z:2,r:.08,alt:[{if:'kite',x:.14,y:.80,rot:.2}]},{id:'flags',img:'flags',x:.30,y:.90,w:.22,z:4,r:.09,alt:[{if:'flags',x:.26,y:.47}]},{id:'b1',img:'balloon_d',x:.72,y:.88,w:.08,z:4,r:.07,alt:[{if:'b1',img:'balloon',w:.10,x:.60,y:.44}]},{id:'b2',img:'balloon_d',x:.88,y:.80,w:.08,z:4,r:.07,alt:[{if:'b2',img:'balloon',w:.10,x:.46,y:.44}]},{id:'para',img:'para_c',x:.64,y:.66,w:.06,z:3,r:.07,alt:[{if:'para',img:'para_o',w:.18,y:.58}]},{id:'hidM',img:'muffs',x:.92,y:.52,w:.07,z:2,show:'!found'}],
 rules:[use('dun','kite','!kite',['fly','dundun','tray','kite',.6,.2,.1],set('kite'),say('树枝一晃，风筝滑下来了！','가지가 흔들려 연이 미끄러졌어!',[.5,.3],1.5)),drag('flags',[.26,.47,.14],'!flags',set('flags')),hold('b1','!b1',set('b1')),hold('b2','!b2',set('b2')),
  Object.assign(tap('para','!para&!tw',set('tw'),['tmp','para',{img:'para_o',w:.18}],['go','para',.5,.2,.6,.1],['fx','leaf','para'],['tone','nope'],say('伞飞走啦！','우산이 날아갔어!',[.5,.3],1.2),['wait',.5],['go','para',.64,.66,.5,.1],['off','para']),{lockq:1}),tap('para','!para&tw',set('para')),tap('hidM','',set('found'),['found'],say('耳罩挂在石头边！','바위 옆에 귀마개가!','hidM'))]}),
/* 10 birthday --------------------------------------------------------- */
stage({id:10,title:'惊喜生日照',ko:'깜짝 생일 사진',goal:'生日合影',bg:'l7_bg',lili:[.25,.80,.19],hid:'eggtart',
 open:[say('团团快回来了，快布置！','퇀퇀이 곧 와, 얼른 준비하자!','lili',2.2)],
 probs:[P('flags','彩旗没挂','깃발은 안 걸렸고','没有彩旗的派对','깃발 없는 파티'),P('bal','气球没吹','풍선은 쭈글하고','瘪气球派对','쭈글 풍선 파티'),P('cake','蛋糕藏不住','케이크는 그대로고','蛋糕还在沙发上','소파 위 케이크'),P('cand','蜡烛没插好','초는 바닥에 있고','蜡烛在地上','바닥에 있는 초'),P('gift','礼物没摆','선물은 안 놓였고','礼物还没放好','아직 못 놓은 선물')],
 all:['生日快乐，团团！','생일 축하해, 퇀퇀!'],none:['惊喜露馅啦！','깜짝 파티 들통!'],pair:['00110','蛋糕和蜡烛还没到位','케이크도 초도 아직'],
 tools:[ZHUO],
 objs:[{id:'flags',img:'flags',x:.68,y:.88,w:.22,z:4,r:.09,alt:[{if:'flags',x:.52,y:.30}]},{id:'bal',img:'balloon_d',x:.46,y:.92,w:.08,z:4,r:.07,alt:[{if:'bal',img:'balloon',w:.10,x:.28,y:.34}]},{id:'cake',img:'cake',x:.10,y:.56,w:.12,z:3,r:.08,alt:[{if:'cake',x:.5,y:.47}]},{id:'cand',img:'candle2',x:.86,y:.90,w:.035,z:5,r:.06,alt:[{if:'cand',x:.40,y:.49}]},{id:'gift',img:'gift',x:.92,y:.76,w:.10,z:4,r:.07,alt:[{if:'gift',x:.64,y:.48}]},{id:'hidE',img:'eggtart',x:.10,y:.68,w:.05,z:4,show:'!found'},{id:'door',hot:1,x:.87,y:.40,r:.10}],
 rules:[drag('flags',[.52,.28,.13],'!flags',set('flags')),use('zhuo','flags','!flags',['fly','zhuozhuo','tray','flags',.5,.1,.12],set('flags')),hold('bal','!bal',set('bal')),
  drag('cake',[.5,.5,.13],'!cake&tw',set('cake')),Object.assign(tap('cake','!cake&!tw',set('tw'),['fly','tt_cheer','door',[.82,.46],.4,.02,.14],['tone','nope'],['mood','shock'],say('咦？什么味道这么香？','어? 무슨 냄새가 이렇게 좋지?','door',1.6),['wait',.5],say('快藏好，团团走了！','휴, 퇀퇀이 갔어!','lili',1.4)),{lockq:1}),
  drag('cand',[.42,.5,.1],'!cand',set('cand')),drag('gift',[.64,.5,.11],'!gift',set('gift')),tap('hidE','',set('found'),['found'],say('沙发上藏着蛋挞！','소파에 에그타르트가!','hidE')),tap('door','',['wig','door',.3],say('嘘！团团在外面','쉿! 퇀퇀이 밖에 있어','door'))]}),
/* 11 visiting sick didi ------------------------------------------------ */
stage({id:11,title:'探望滴滴',ko:'방울이 병문안',goal:'探病合影',bg:'l2_bg',lili:[.72,.78,.18],hid:'thermo',
 open:[say('下雨天滴滴感冒啦！','비 오는 날 방울이가 감기에 걸렸어!','lili',2.2)],
 probs:[P('blanket','被子没盖','이불은 안 덮였고','滴滴好冷','방울이가 추워'),P('tea','姜茶没喝','생강차는 그대로고','姜茶还热着','아직 뜨거운 생강차'),P('therm','体温没量','체온은 안 쟀고','不知道有没有发烧','열이 있는지 몰라'),P('tissue','鼻涕没擦','콧물은 그대로고','鼻涕亮晶晶','반짝이는 콧물'),P('cushion','靠垫掉在地上','쿠션은 바닥에 있고','靠垫滚下来了','굴러떨어진 쿠션')],
 all:['滴滴好起来啦！','방울이가 다 나았어!'],none:['阿嚏！','에취!'],pair:['10010','又冷又流鼻涕','춥고 콧물까지'],
 tools:[],
 objs:[{id:'didi',img:'didi_sick',x:.40,y:.615,w:.27,z:3,anim:'none',r:.13,alt:[{if:'blanket&tea&therm&tissue',img:'didi',w:.17,y:.58}]},{id:'blanket',img:'blanket',x:.20,y:.88,w:.16,rot:-.08,z:4,r:.09,alt:[{if:'blanket',x:.40,y:.67,rot:0}]},{id:'tea',img:'tea',x:.09,y:.42,w:.07,z:4,r:.06,alt:[{if:'tea',hide:1}]},{id:'therm',img:'thermo',x:.885,y:.62,w:.08,rot:.5,z:4,show:'pillow&!therm',r:.06},{id:'pillow',img:'pillow',x:.885,y:.615,w:.13,z:5,r:.09,alt:[{if:'pillow',x:.79}]},{id:'tissue',img:'tissue',x:.62,y:.84,w:.10,z:4,show:'panda&!tissue',r:.07},{id:'panda',img:'panda',x:.62,y:.81,w:.11,z:5,r:.08,alt:[{if:'panda',x:.50}]},{id:'cushion',img:'cushion',x:.90,y:.88,w:.10,z:4,r:.08,alt:[{if:'cushion',x:.87,y:.62}]},{id:'hidS',hot:1,x:.85,y:.28,r:.06}],
 rules:[drag('blanket',[.40,.66,.15],'!blanket',set('blanket')),Object.assign(drag('tissue',[.40,.62,.14],'!tissue&!tw',set('tw'),['wig','didi',1],['tone','shake'],say('阿——嚏！','에—취!','didi',1.2),['fx','confetti','didi']),{}),drag('tissue',[.40,.62,.14],'!tissue&tw',set('tissue')),
  drag('tea',[.40,.62,.14],'!tea',set('tea')),swipe('pillow','left','!pillow',set('pillow')),swipe('panda','left','!panda',set('panda')),drag('therm',[.40,.62,.14],'!therm',set('therm')),drag('cushion',[.87,.64,.10],'!cushion',set('cushion')),tap('hidS','!found',set('found'),['found'],say('小熊也来看你啦','곰돌이도 병문안 왔어','hidS'))]}),
/* 12 dim sum ----------------------------------------------------------- */
stage({id:12,title:'点心大逃亡',ko:'찜통 대탈출',goal:'点心合影',bg:'l1_bg2',lili:[.50,.78,.19],hid:'sesame',
 open:[say('点心全跑出来啦！','딤섬이 전부 도망쳤어!','lili',2)],
 probs:[P('har','虾饺在外面','새우만두는 밖에 있고','虾饺在散步','산책하는 새우만두'),P('siu','烧卖在外面','샤오마이는 밖에 있고','烧卖在跳舞','춤추는 샤오마이'),P('cha','叉烧包在外面','차슈바오는 밖에 있고','叉烧包在睡觉','자는 차슈바오'),P('eg','蛋挞在外面','에그타르트는 밖에 있고','蛋挞不想回家','집에 가기 싫은 에그타르트'),P('cat','小猫不肯走','고양이는 안 비키고','小猫守着门口','문 지키는 고양이')],
 all:['一笼都不少','한 찜통도 빠짐없이'],none:['点心开派对','딤섬들의 파티'],pair:['00011','蛋挞和猫咪是朋友','에그타르트와 고양이는 친구'],
 tools:[TUAN],
 objs:[{id:'har',img:'hargow',x:.12,y:.86,w:.08,z:4,r:.07,alt:[{if:'har',x:.74,y:.47}]},{id:'siu',img:'siumai',x:.30,y:.92,w:.08,z:4,r:.07,alt:[{if:'siu',x:.80,y:.45}]},{id:'cha',img:'charsiu',x:.72,y:.90,w:.08,z:4,r:.07,alt:[{if:'cha',x:.86,y:.47}]},{id:'eg',img:'eggtart',x:.40,y:.68,w:.07,z:4,r:.06,alt:[{if:'eg',x:.80,y:.52}]},{id:'cat',img:'cat_dry',x:.40,y:.46,w:.17,z:3,r:.10,alt:[{if:'cat',x:.14,y:.60,w:.14}]},{id:'hidK',img:'sesame',x:.93,y:.80,w:.05,z:2,show:'!found'}],
 rules:[Object.assign(drag('har',[.80,.47,.13],'!har&!tw',set('tw'),['fx','steam','har'],['tone','nope'],say('蒸笼太烫，它又跳出来啦！','찜통이 뜨거워서 다시 뛰쳐나왔어!',[.7,.4],1.7)),{}),drag('har',[.80,.47,.13],'!har&tw',set('har'),['fx','steam','har']),drag('siu',[.80,.47,.13],'!siu',set('siu')),drag('cha',[.80,.47,.13],'!cha',set('cha')),drag('eg',[.80,.47,.13],'!eg',set('eg')),
  use('tuan','cat','!cat',['fx','steam','cat'],set('cat'),say('好香！猫咪跟着香味走了','좋은 냄새! 고양이가 냄새를 따라갔어','cat',1.7)),tap('cat','!cat',['wig','cat',.5],say('喵～这里最舒服','야옹~ 여기가 제일 좋아','cat')),tap('hidK','',set('found'),['found'],say('芝麻球藏在灶台边！','깨찰볼이 화덕 옆에 있었네!','hidK'))]}),
/* 13 letters ------------------------------------------------------------ */
stage({id:13,title:'图书馆的五封信',ko:'도서관 편지 5통',goal:'图书馆合影',bg:'lib_bg',tint:'rgba(40,40,110,.10)',lili:[.52,.76,.18],hid:'envelope',
 open:[say('图书馆藏着五封信，一起找找吧','도서관에 편지 5통이 숨어 있대, 같이 찾자','lili',2.4)],
 probs:[P('l1','窗帘后有信','커튼 뒤 편지는 그대로고','窗帘的秘密','커튼의 비밀'),P('l2','靠垫下有信','쿠션 아래 편지도 그대로고','靠垫的秘密','쿠션의 비밀'),P('l3','灯罩下有信','전등갓 아래 편지도 있고','灯罩的秘密','전등갓의 비밀'),P('l4','抽屉里有信','서랍 속 편지도 있고','抽屉的秘密','서랍의 비밀'),P('l5','吊灯上有信','천장등 위 편지도 있고','吊灯的秘密','천장등의 비밀')],
 all:['五封信都找到啦！','편지 5통 모두 찾았어!'],none:['信还在睡觉','편지는 아직 숨어 있어'],pair:['11000','窗帘和靠垫都没翻','커튼도 쿠션도 안 들췄어'],
 tools:[SHAN],
 objs:[{id:'curtain',img:'curtain',x:.62,y:.25,w:.10,h:.27,z:2,r:.08,alt:[{if:'l1',x:.57}]},{id:'cushion',img:'cushion',x:.22,y:.68,w:.11,z:3,r:.08,alt:[{if:'l2',x:.34,y:.72}]},{id:'shade',img:'shade',x:.66,y:.46,w:.12,z:2,r:.09,alt:[{if:'l3',y:.38}]},{id:'drawer',img:'drawer',x:.40,y:.50,w:.085,z:2,r:.08,alt:[{if:'l4',y:.59}]},{id:'fan',hot:1,x:.54,y:.09,r:.09},{id:'kitty',img:'cat_dry',x:.22,y:.68,w:.16,z:2,show:'tw&!l2'},{id:'e1',img:'envelope',x:.63,y:.27,w:.05,z:1,show:'l1'},{id:'e2',img:'envelope',x:.22,y:.68,w:.05,z:1,show:'l2'},{id:'e3',img:'envelope',x:.66,y:.47,w:.05,z:1,show:'l3'},{id:'e4',img:'envelope',x:.40,y:.49,w:.05,z:1,show:'l4'},{id:'e5',img:'envelope',x:.54,y:.13,w:.05,z:5,show:'l5'},{id:'hidB',hot:1,x:.95,y:.45,r:.06}],
 rules:[swipe('curtain','left','!l1',set('l1')),Object.assign(swipe('cushion','right','!l2&!tw',set('tw'),['tone','nope'],say('喵！别吵我睡觉！','야옹! 잠 깨우지 마!',[.3,.52],1.7)),{}),swipe('cushion','right','!l2&tw',set('l2')),tap('cushion','!l2&tw',set('l2')),
  swipe('shade','up','!l3',set('l3')),swipe('drawer','down','!l4',set('l4')),use('shan','fan','!l5',['fly','shanshan','tray','fan',.6,.1,.11],['fx','spark','fan'],set('l5'),say('吊灯上真的有信！','천장등 위에 진짜 편지가!','fan')),tap('fan','!l5',['tone','nope'],say('太高了看不清，请闪闪帮忙','높아서 안 보여, 반짝에게 부탁해','fan')),tap('hidB','!found',set('found'),['found'],say('书架角落还有第六封！','책장 구석에 여섯 번째 편지가!','hidB'))]}),
/* 14 night market contest ----------------------------------------------- */
stage({id:14,title:'夜市摄影赛',ko:'야시장 사진대회',goal:'夜市合影',bg:'l9_bg',lili:[.60,.76,.17],hid:'kite',
 open:[say('今晚是夜市摄影大赛！','오늘 밤은 야시장 사진대회!','lili',2.2)],
 probs:[P('l1','灯笼掉了一盏','등롱 하나는 떨어졌고','少一盏灯','등이 하나 없어'),P('l2','又掉了一盏','또 하나도 떨어졌고','又少一盏灯','또 등이 없어'),P('haw','啄啄饿着肚子','쫑쫑은 배고프고','啄啄想吃糖葫芦','탕후루 먹고 싶은 쫑쫑'),P('dra','糖画没摆','설탕 그림은 안 놓였고','糖画还没好','아직인 설탕 그림'),P('env','奖状飞上屋檐','상장은 처마에 있고','奖状不见了','사라진 상장')],
 all:['冠军照片！','우승 사진!'],none:['评委也迷路了','심사위원도 길을 잃었어'],pair:['11000','两盏灯都没亮','등 두 개가 없어'],
 tools:[ZHUO],
 objs:[{id:'zh',img:'zhuozhuo',x:.40,y:.78,w:.13,z:3,r:.08},{id:'l1',img:'plantern',x:.76,y:.90,w:.08,z:4,r:.07,alt:[{if:'l1',x:.20,y:.36}]},{id:'l2',img:'plantern',x:.86,y:.84,w:.08,z:4,r:.07,alt:[{if:'l2',x:.60,y:.36}]},{id:'haw',img:'hawthorn',x:.92,y:.62,w:.05,z:4,rot:.3,r:.07,alt:[{if:'haw',hide:1}]},{id:'dra',img:'sdragon',x:.24,y:.92,w:.09,z:4,r:.07,alt:[{if:'dra',x:.16,y:.60}]},{id:'env',img:'envelope',x:.86,y:.30,w:.07,z:3,r:.07,alt:[{if:'env',x:.48,y:.62}]},{id:'hidKt',img:'kite',x:.05,y:.30,w:.06,z:2,show:'!found'}],
 rules:[drag('l1',[.20,.34,.12],'!l1',set('l1')),drag('l2',[.60,.34,.12],'!l2',set('l2')),Object.assign(drag('haw',[.40,.76,.11],'!haw&!tw',set('tw'),['wig','zh',.8],['tone','nope'],say('酸！再给一串！','셔! 하나 더 줘!','zh',1.4)),{}),drag('haw',[.40,.76,.11],'!haw&tw',set('haw')),drag('dra',[.16,.58,.12],'!dra',set('dra')),
  use('zhuo','env','!env',['fly','zhuozhuo','tray','env',.6,.15,.12],set('env')),tap('hidKt','',set('found'),['found'],say('小风筝藏在灯后！','등 뒤에 작은 연이!','hidKt'))]}),
/* 15 rain ---------------------------------------------------------------- */
stage({id:15,title:'突然下雨啦',ko:'소나기 소동',goal:'雨中合影',bg:'l5_bg',tint:'rgba(70,100,140,.25)',rain:1,comp:[.5,.62],lili:[.50,.72,.18],hid:'pail',
 open:[say('下雨啦！可以选全景或近景哦','비가 와! 전체나 가까이 구도를 고를 수 있어','lili',2.4)],
 probs:[P('para','伞没撑','우산은 안 폈고','淋成落汤鸡','물에 빠진 생쥐 꼴'),P('bucket','水桶没接水','양동이는 비어 있고','屋檐一直滴水','처마에서 뚝뚝'),P('blanket','桌子没盖','상은 안 덮였고','桌子淋湿了','젖은 상'),P('lan','灯笼在淋雨','등롱은 비 맞고','灯笼淋湿了','젖은 등롱'),P('shoe','鞋子在外面','신발은 밖에 있고','鞋子泡水了','물에 잠긴 신발')],
 all:['雨中也开心','비 와도 즐거워'],none:['大家都湿透了','모두 흠뻑 젖었어'],pair:['10100','淋雨的野餐桌','비 맞는 소풍 상'],
 tools:[],
 objs:[{id:'para',img:'para_c',x:.68,y:.74,w:.06,z:3,r:.07,alt:[{if:'para',img:'para_o',w:.2,x:.50,y:.56}]},{id:'bucket',img:'bucket',x:.20,y:.88,w:.10,z:4,r:.07,alt:[{if:'bucket',x:.80,y:.72}]},{id:'blanket',img:'blanket',x:.86,y:.88,w:.15,z:4,r:.09,alt:[{if:'blanket',x:.40,y:.56}]},{id:'lan',img:'lantern',x:.40,y:.86,w:.09,z:4,r:.07,alt:[{if:'lan',x:.50,y:.38}]},{id:'shoe',img:'shoe',x:.60,y:.90,w:.10,z:4,r:.08,alt:[{if:'shoe',x:.29,y:.62}]},{id:'hidPl',img:'pail',x:.11,y:.62,w:.07,z:2,show:'!found'}],
 rules:[tap('para','!para',set('para')),Object.assign(drag('bucket',[.80,.70,.11],'!bucket&!tw',set('tw'),['fx','splash','bucket'],['tone','nope'],say('水溅了我一身！','물이 튀었어!','bucket',1.4)),{}),drag('bucket',[.80,.70,.11],'!bucket&tw',set('bucket')),drag('blanket',[.40,.56,.13],'!blanket',set('blanket')),drag('lan',[.50,.36,.12],'!lan',set('lan')),drag('shoe',[.29,.62,.11],'!shoe',set('shoe')),tap('hidPl','',set('found'),['found'],say('小桶躲在灌木边！','작은 양동이가 덤불 옆에!','hidPl'))]}),
/* 16 joint ---------------------------------------------------------------- */
stage({id:16,title:'朋友一起来',ko:'친구들 합동 준비',goal:'朋友合影',bg:'l5_bg',lili:[.50,.74,.17],hid:'jar',
 open:[say('今天大家一起帮忙！','오늘은 다 같이 돕는 날!','lili',2)],
 probs:[P('flags','彩旗没挂','깃발은 안 걸렸고','彩旗在地上','바닥의 깃발'),P('conf','彩纸没撒','색종이는 안 뿌렸고','少了点热闹','조금 심심해'),P('glow','灯笼没发光','등롱은 어둡고','灯笼不亮','안 켜진 등롱'),P('pot','花没浇水','꽃은 시들었고','花没精神','기운 없는 꽃'),P('gift','礼物没摆','선물은 안 놓였고','礼物在角落','구석의 선물')],
 all:['朋友都到齐啦！','친구들이 다 모였어!'],none:['大家还在路上','다들 오는 중'],pair:['01100','彩纸和灯都没准备好','색종이도 등도 아직'],
 tools:[PENG,SHAN,DIDI],
 objs:[{id:'flags',img:'flags',x:.30,y:.88,w:.22,z:4,r:.09,alt:[{if:'flags',x:.5,y:.27}]},{id:'tbl',hot:1,x:.40,y:.56,r:.08},{id:'lan',img:'plantern',x:.70,y:.36,w:.09,z:3,r:.08},{id:'pot',img:'pot_wilt',x:.13,y:.70,w:.15,z:3,alt:[{if:'pot',img:'pot_bloom'}]},{id:'gift',img:'gift',x:.84,y:.88,w:.10,z:4,r:.07,alt:[{if:'gift',x:.40,y:.52}]},{id:'hidJ',img:'jar',x:.905,y:.60,w:.05,z:2,show:'!found'}],
 rules:[drag('flags',[.5,.27,.14],'!flags',set('flags')),use('peng','tbl','!conf',['fx','confetti','tbl'],['tone','note',880],set('conf')),use('shan','lan','!shanOn',set('shanOn'),['fx','spark','lan'],say('亮了一点，再热闹一下！','조금 밝아졌어, 더 신나게!','lan')),use('peng','lan','shanOn&!glow',['fx','confetti','lan'],set('glow')),use('peng','lan','!shanOn',['fx','confetti','lan'],['tone','nope'],say('灯还是暗的，先请闪闪','등이 어두워, 반짝 먼저','lan',1.6)),
  use('didi','pot','!pot',['fx','drops','pot'],set('pot')),drag('gift',[.40,.52,.11],'!gift',set('gift')),tap('hidJ','',set('found'),['found'],say('井边有一罐萤火虫！','우물가에 반딧불이 병이!','hidJ'))]}),
/* 17 night lights ---------------------------------------------------------- */
stage({id:17,title:'夜市停电了',ko:'야시장 조명 소동',goal:'夜市灯火',bg:'l9_bg',dark:{a:.6,fade:1},lili:[.60,.76,.17],hid:'cat_dry',
 open:[say('夜市的灯全灭了！','야시장 불이 다 꺼졌어!','lili',2)],
 probs:[P('a','左边的灯没亮','왼쪽 등은 꺼졌고','左边黑黑的','왼쪽이 깜깜해'),P('b','右边的灯没亮','오른쪽 등은 꺼졌고','右边黑黑的','오른쪽이 깜깜해'),P('c','牌坊的灯没亮','패루 등은 꺼졌고','牌坊看不见','패루가 안 보여'),P('stall','小摊没开张','가판대는 닫혔고','小摊还没开','아직 닫힌 가판대'),P('lan','手提灯没拿来','손등은 바닥에 있고','手提灯在地上','바닥의 손등')],
 all:['满街都亮啦！','온 거리가 환해!'],none:['黑乎乎的夜市','깜깜한 야시장'],pair:['11000','只有牌坊亮着','패루만 환해'],
 tools:[SHAN],
 objs:[{id:'a',hot:1,x:.20,y:.22,r:.09},{id:'b',hot:1,x:.84,y:.34,r:.09},{id:'c',hot:1,x:.56,y:.30,r:.07},{id:'stall',hot:1,x:.15,y:.62,r:.11},{id:'lan',img:'plantern',x:.42,y:.90,w:.09,z:4,r:.08,alt:[{if:'lan',x:.60,y:.60}]},{id:'hidC',hot:1,x:.88,y:.20,r:.07}],
 rules:[use('shan','a','!a',['fly','shanshan','tray','a',.5,.1,.1],['fx','spark','a'],set('a')),use('shan','b','!b',['fly','shanshan','tray','b',.5,.1,.1],['fx','spark','b'],set('b')),Object.assign(use('shan','c','!c&!tw',set('tw'),['fx','spark','c'],['tone','nope'],say('牌坊的灯是空的？看它的影子','패루 등이 비었네? 그림자를 봐','c',1.8)),{}),use('shan','c','!c&tw',['fx','spark','c'],set('c')),hold('stall','!stall',set('stall'),['fx','steam','stall']),drag('lan',[.60,.58,.12],'!lan',set('lan')),tap('hidC','!found',set('found'),['found'],say('屋顶上的猫也醒了','지붕 위 고양이도 깼어','hidC'))]}),
/* 18 concert ---------------------------------------------------------------- */
stage({id:18,title:'小小音乐会',ko:'작은 음악회',goal:'音乐会合影',bg:'stage_bg',lili:[.20,.80,.18],hid:'muffs',
 open:[say('音乐会开始前，把乐器都试一遍','음악회 전에 악기를 다 쳐 보자','lili',2.2)],
 probs:[P('drum','大鼓没响','큰북은 조용하고','鼓手迟到了','북 치는 친구가 늦었어'),P('bell','小钟没响','작은 종도 조용하고','小钟睡着了','작은 종이 잠들었어'),P('jar','玻璃瓶没响','유리병도 조용하고','瓶子没声音','소리 없는 병'),P('bucket','水桶鼓没响','양동이북도 조용하고','水桶还没准备好','아직 양동이북이 없어'),P('muffs','耳罩没戴','귀마개는 안 썼고','墩墩捂着耳朵','귀 막은 둥둥')],
 all:['全场鼓掌！','모두 박수!'],none:['音乐会还没开始','음악회는 아직이야'],pair:['00011','太吵啦，墩墩要捂耳朵','너무 시끄러워, 둥둥이 귀를 막아'],
 tools:[],
 objs:[{id:'dun',img:'dundun',x:.84,y:.74,w:.17,z:3,r:.09},{id:'drum',img:'drum',x:.50,y:.80,w:.15,z:4,r:.09},{id:'bell',img:'clock',x:.32,y:.48,w:.08,z:4,r:.07},{id:'jar',img:'jar',x:.50,y:.46,w:.07,z:4,r:.07},{id:'bucket',img:'bucket',x:.68,y:.47,w:.09,z:4,r:.07},{id:'muffs',img:'muffs',x:.62,y:.92,w:.09,z:5,r:.07,alt:[{if:'muffs',x:.84,y:.66}]},{id:'hidMf',img:'gift',x:.05,y:.42,w:.05,z:2,show:'!found'}],
 rules:[Object.assign(tap('drum','!drum&!muffs&!tw',set('tw'),['tone','note',130],['wig','dun',1],say('太响啦！先给墩墩戴耳罩','너무 커! 둥둥 귀마개부터','dun',1.8)),{}),tap('drum','!drum&tw|!drum&muffs',['tone','note',196],set('drum')),tap('bell','!bell',['tone','note',1047],set('bell')),tap('jar','!jar',['tone','note',784],set('jar')),tap('bucket','!bucket',['tone','note',294],set('bucket')),drag('muffs',[.84,.68,.11],'!muffs',set('muffs')),tap('hidMf','',set('found'),['found'],say('灌木后面有小礼物！','덤불 뒤에 작은 선물이!','hidMf'))]}),
/* 19 festival --------------------------------------------------------------- */
stage({id:19,title:'小镇大庙会',ko:'동네 대축제',goal:'庙会大合影',bg:'l10_bg',tint:'rgba(255,190,110,.10)',lili:[.50,.70,.17],hid:'drum',
 open:[say('学过的本领，今天都用上！','배운 솜씨를 오늘 다 써 보자!','lili',2.2)],
 probs:[P('lion','舞狮没上台','사자는 아직이고','舞狮还在睡','자는 사자'),P('kite','风筝没拿到','연은 나무에 있고','风筝挂住了','걸린 연'),P('dra','糖画没做好','설탕 그림은 안 됐고','糖画没好','아직인 설탕 그림'),P('conf','彩纸没撒','색종이는 아직이고','还差点热闹','조금 심심해'),P('lamp','花灯没亮','꽃등은 꺼졌고','花灯暗暗的','어두운 꽃등')],
 all:['小镇最热闹的一天！','동네 최고의 날!'],none:['庙会迟到啦','장터가 지각했어'],pair:['00011','彩纸和花灯都差一点','색종이도 꽃등도 조금 모자라'],
 tools:[ZHUO,PENG,SHAN],
 objs:[{id:'lion',img:'lion',x:.34,y:.90,w:.14,z:5,r:.09,alt:[{if:'lion',x:.18,y:.5}]},{id:'kite',img:'kite',x:.80,y:.14,w:.15,z:2,r:.09,alt:[{if:'kite',x:.70,y:.82,rot:.2}]},{id:'stall',hot:1,x:.93,y:.46,r:.08},{id:'dra',img:'sdragon',x:.86,y:.40,w:.08,z:4,show:'dra',r:.06},{id:'ground',hot:1,x:.5,y:.88,r:.09},{id:'lan',img:'plantern',x:.38,y:.38,w:.08,z:3,r:.07},{id:'hidD',hot:1,x:.07,y:.86,r:.06}],
 rules:[drag('lion',[.17,.52,.14],'!lion',set('lion')),Object.assign(use('zhuo','kite','!kite&!tw',set('tw'),['wig','kite',.8],['tone','nope'],say('线缠住了！再试一次','줄이 엉켰어! 한 번 더','kite',1.5)),{}),use('zhuo','kite','!kite&tw',['fly','zhuozhuo','tray','kite',.6,.15,.12],set('kite')),hold('stall','!dra',set('dra'),['fx','steam','stall']),use('peng','ground','!conf',['fx','confetti','ground'],set('conf')),use('shan','lan','!lamp',['fx','spark','lan'],set('lamp')),tap('hidD','!found',set('found'),['found'],say('花盆后面有小鼓！','화분 뒤에 작은 북이!','hidD'))]}),
/* 20 town photo -------------------------------------------------------------- */
stage({id:20,title:'小镇纪念照',ko:'동네 기념사진',goal:'全镇大合照',bg:'hall_bg',wall:1,lili:[.50,.60,.20],hid:'paw',
 open:[say('把大家请到照片墙前！','모두 사진 벽 앞으로 모시자!','lili',2.2),['wait',2.2],say('墙上都是我们拍的照片！','벽에 우리가 찍은 사진이 다 있어!','tuan',2)],
 probs:[P('dun','墩墩还没站好','둥둥은 아직이고','墩墩跑开了','둥둥이 달아났어'),P('zhuo','啄啄还没落下','쫑쫑도 아직이고','啄啄还在飞','쫑쫑은 아직 날아다녀'),P('shan','闪闪还没来','반짝도 아직이고','闪闪迟到了','반짝이 늦었어'),P('peng','砰砰还没来','펑펑도 아직이고','砰砰迟到了','펑펑이 늦었어'),P('didi','滴滴还没来','방울이도 아직이고','滴滴迟到了','방울이가 늦었어')],
 all:['全镇都到齐啦！','온 동네가 다 모였어!'],none:['只有我和团团','나랑 퇀퇀뿐이야'],pair:['00011','少了砰砰和滴滴','펑펑과 방울이가 없어'],
 tools:[],
 objs:[{id:'tuan',img:'cam_clear',x:.88,y:.82,w:.18,z:6,r:.10},{id:'dun',img:'dundun',x:.14,y:.90,w:.15,z:5,r:.09,alt:[{if:'dun',x:.22,y:.62}]},{id:'zhuo',img:'zhuozhuo',x:.34,y:.88,w:.13,z:5,r:.08,alt:[{if:'zhuo',x:.34,y:.52}]},{id:'shan',img:'shanshan',x:.54,y:.90,w:.13,z:5,r:.08,alt:[{if:'shan',x:.66,y:.52}]},{id:'peng',img:'pengpeng',x:.70,y:.88,w:.14,z:5,r:.08,alt:[{if:'peng',x:.78,y:.62}]},{id:'didi',img:'didi',x:.44,y:.76,w:.12,z:4,r:.08,alt:[{if:'didi',x:.36,y:.67}]},{id:'hidL',hot:1,x:.08,y:.24,r:.07}],
 rules:[drag('dun',[.22,.62,.12],'!dun',set('dun')),drag('zhuo',[.34,.52,.11],'!zhuo',set('zhuo')),drag('shan',[.66,.52,.11],'!shan',set('shan')),drag('didi',[.36,.67,.10],'!didi',set('didi')),Object.assign(drag('peng',[.78,.62,.12],'!peng&!tw',set('tw'),['fx','confetti','peng'],['tone','note',880],say('砰砰太开心，先撒了彩纸！','펑펑이 신나서 색종이부터 뿌렸어!',[.6,.4],1.7)),{}),drag('peng',[.78,.62,.12],'!peng&tw',set('peng')),tap('hidL','!found',set('found'),['found'],say('灯笼后面有小脚印！','등롱 뒤에 작은 발자국이!','hidL'))]}),
];

/* ---------- difficulty: stage 1 is the gentle one, then help shrinks and puzzles deepen ---------- */
const diff=id=>({hints:id===1?3:id<=5?2:1,idle:id===1?8:id<=5?15:id<=10?25:0,zones:id<=2,ring:id<=12,toolRing:id<=5,slack:id<=5?.03:id<=12?.015:0,rub:id<=5?150:id<=12?185:225});
const time=id=>id===1?120:id<=5?110:id<=10?100:id<=15?90:80;
let uid=0;
function need(s,t,flag){for(const q of s.rules)if(q.t===t&&!q.do.some(d=>d[0]==='found'))q.if=(q.if||'').split('|').map(a=>a?a+'&'+flag:flag).join('|');}
/* a friend stays locked until found in the scene */
function gate(s,tool,img,x,y,w,zh,ko){const flag='has_'+tool,id='peek_'+tool;s.tools.find(t=>t.id===tool).have=flag;s.objs.push({id,img,x,y,w,z:2,show:'!'+flag,r:Math.max(.06,w*.7)});s.rules.push(tap(id,'',set(flag),['tone','good'],say(zh,ko,[x,Math.max(.2,y)])));}
/* an object starts hidden under another one */
function under(s,t,img,dir,w,zh,ko){const o=s.objs.find(q=>q.id===t),flag='open_'+t,id='cover_'+t;o.show=o.show?o.show+'&'+flag:flag;const dx={left:-.11,right:.11}[dir]||0,dy={up:-.1,down:.1}[dir]||0;s.objs.push({id,img,x:o.x,y:o.y,w,z:(o.z||3)+1,r:w*.7,alt:[{if:flag,x:o.x+dx,y:o.y+dy}]});s.rules.push(swipe(id,dir,'!'+flag,set(flag),say(zh,ko,[o.x,Math.max(.25,o.y-.04)],1.4)));}
function decoy(s,img,x,y,w,zh,ko){const id='decoy'+(++uid);s.objs.push({id,img,x,y,w,z:2,r:Math.max(.05,w*.65)});s.rules.push(tap(id,'',['wig',id,.5],say(zh,ko,[x,Math.max(.22,y)],1.4)));}
/* an object you pick up: it flies to the shelf and becomes a tool */
function pick(s,tool,img,x,y,w,zh,ko,miss){const flag='got_'+tool,id='item_'+tool;let t=s.tools.find(q=>q.id===tool);if(!t){t={id:tool,img,miss};s.tools.push(t);}t.have=flag;s.objs.push({id,img,x,y,w,z:3,show:'!'+flag,r:Math.max(.06,w*.75)});s.rules.push(tap(id,'',['fly',img,[x,y],'tray',.4,.05,.09],set(flag),['tone','good'],say(zh,ko,[.5,.86],1.5)));}
const at=n=>ST[n-1];
decoy(at(2),'tea',.10,.545,.06,'茶还热着呢','차가 아직 따뜻해');
decoy(at(3),'tissue',.11,.60,.07,'这不是垃圾','이건 쓰레기가 아니야');
gate(at(4),'shan','shanshan',.10,.45,.07,'闪闪躲在架子上！','반짝이 선반에 숨어 있었네!');
gate(at(6),'dun','dundun',.93,.34,.07,'墩墩在树后面玩！','둥둥이 나무 뒤에서 놀고 있었네!');decoy(at(6),'pail',.10,.60,.06,'这个小桶是别人的','이 양동이는 다른 사람 거야');
gate(at(7),'zhuo','zhuozhuo',.10,.60,.07,'啄啄在树丛里找信','쫑쫑이 덤불에서 편지를 찾고 있었네');decoy(at(7),'kite',.68,.20,.06,'这只风筝不用管','이 연은 그냥 둬');
gate(at(8),'didi','didi',.94,.60,.06,'滴滴在花丛里乘凉','방울이가 꽃덤불에서 쉬고 있었네');decoy(at(8),'shell',.60,.52,.05,'这是装饰品','이건 장식품이야');
gate(at(9),'dun','dundun',.72,.29,.06,'墩墩在亭子里躲风','둥둥이 정자에서 바람을 피하고 있었네');decoy(at(9),'paper',.20,.66,.05,'风吹来的纸团','바람에 날아온 종이뭉치');decoy(at(9),'hat',.92,.68,.06,'谁的帽子？','누구 모자지?');
under(at(10),'cand','cushion','right',.10,'蜡烛藏在靠垫下','초가 쿠션 밑에 있었어');decoy(at(10),'lantern',.74,.84,.07,'这盏灯不用挂','이 등은 안 걸어도 돼');
decoy(at(11),'clock',.09,.42,.06,'还早呢','아직 이른걸');decoy(at(11),'hat',.88,.30,.05,'小熊的帽子','곰돌이 모자');
{const s=at(12);s.objs.push({id:'lid',img:'lid',x:.80,y:.42,w:.15,z:5,r:.08,show:'!open'});s.rules.push(swipe('lid','up','!open',set('open'),['fx','steam','lid']));for(const t of ['har','siu','cha','eg'])need(s,t,'open');gate(s,'tuan','tt_cheer',.92,.70,.08,'团团在柜台后面！','퇀퇀이 카운터 뒤에 있었네!');}
gate(at(13),'shan','shanshan',.94,.25,.06,'闪闪在书架上看书','반짝이 책장에서 책을 읽고 있었네');decoy(at(13),'envelope',.86,.60,.05,'这是旧信封，空的','이건 빈 봉투야');decoy(at(13),'tissue',.14,.82,.06,'不是这个','이건 아니야');
{const s=at(14);s.tools[0].have='awake';s.rules.push(tap('zh','!awake',set('awake'),say('我醒啦，要我帮忙吗？','깼어, 도와줄까?','zh')));}under(at(14),'haw','cushion','left',.09,'糖葫芦在这里！','탕후루가 여기 있네!');decoy(at(14),'lantern',.08,.82,.07,'这是别家的灯','이건 다른 집 등이야');
under(at(15),'shoe','cushion','left',.10,'鞋子躲在靠垫下','신발이 쿠션 밑에 있었어');decoy(at(15),'hat',.88,.62,.06,'帽子湿透了','모자가 흠뻑 젖었어');decoy(at(15),'paper',.34,.74,.05,'纸团软软的','종이뭉치가 흐물흐물해');
gate(at(16),'peng','pengpeng',.92,.46,.07,'砰砰躲在梯子后！','펑펑이 사다리 뒤에 있었네!');gate(at(16),'didi','didi',.06,.62,.06,'滴滴在树丛里','방울이가 덤불에 있었네');under(at(16),'gift','pillow','right',.11,'礼物藏好啦','선물이 숨어 있었네');
gate(at(17),'shan','shanshan',.34,.70,.07,'闪闪也怕黑呢','반짝도 어둠이 무서웠구나');decoy(at(17),'hat',.86,.66,.05,'摊主的帽子','주인 아저씨 모자');decoy(at(17),'paper',.48,.88,.05,'看不清是什么','뭔지 안 보여');
under(at(18),'muffs','cushion','right',.10,'耳罩找到了！','귀마개를 찾았어!');under(at(18),'jar','pillow','left',.10,'玻璃瓶在这里','유리병이 여기 있네');decoy(at(18),'hat',.14,.46,.06,'这不是乐器','이건 악기가 아니야');
gate(at(19),'zhuo','zhuozhuo',.70,.09,.06,'啄啄在树上休息','쫑쫑이 나무에서 쉬고 있었네');gate(at(19),'peng','pengpeng',.07,.62,.07,'砰砰在台子后面','펑펑이 무대 뒤에 있었네');under(at(19),'lion','blanket','left',.15,'舞狮藏在被子下！','사자가 이불 밑에 숨었네!');decoy(at(19),'paper',.60,.60,.05,'纸团不用管','종이뭉치는 그냥 둬');
under(at(20),'shan','cushion','right',.11,'闪闪在这里！','반짝이 여기 있네!');under(at(20),'didi','pillow','left',.11,'滴滴在枕头下睡觉','방울이가 베개 밑에서 자고 있었네');
/* the little story a 5/5 photo unlocks */
const AFTER=[['那天的全家福，被团团挂在了店门口。','그날의 가족사진은 퇀퇀 가게 문 앞에 걸렸어요.'],['开张第一笼，三分钟就卖光啦。','첫 찜통은 3분 만에 다 팔렸어요.'],['墩墩答应，以后只在院子里玩球。','둥둥은 이제 마당에서만 공놀이하기로 했어요.'],['闪闪发现，阁楼的月亮最好看。','반짝은 다락에서 보는 달이 제일 예쁘다는 걸 알았어요.'],['狮子跳得太开心，把鞋都甩掉了。','사자는 너무 신나서 신발까지 벗겨졌어요.'],['海鸥后来成了点心店的常客。','갈매기는 나중에 딤섬 가게 단골이 됐어요.'],['那封信，是写给全镇的新年问候。','그 편지는 온 동네에 보내는 새해 인사였어요.'],['花店送给每家一朵小红花。','꽃가게는 집집마다 작은 꽃을 선물했어요.'],['风停了，气球还舍不得下来。','바람이 멎어도 풍선은 내려오기 싫어했어요.'],['团团吹蜡烛时，偷偷许了个愿。','퇀퇀은 초를 불며 몰래 소원을 빌었어요.'],['滴滴病好了，第一件事是去踩水。','방울이는 낫자마자 물웅덩이부터 밟으러 갔어요.'],['小猫学会了，闻到香味就排队。','고양이는 냄새가 나면 줄을 서게 됐어요.'],['第六封信写着：谢谢你来找我们。','여섯 번째 편지에는 찾아 줘서 고맙다고 적혀 있었어요.'],['评委说：这张照片，连灯笼都在笑。','심사위원은 등롱까지 웃는 사진이라고 했어요.'],['雨停后，天边出现了一道彩虹。','비가 그치자 하늘에 무지개가 떴어요.'],['朋友们约好，明年还一起来帮忙。','친구들은 내년에도 함께 돕기로 약속했어요.'],['夜市的灯，一直亮到了天亮。','야시장의 불빛은 날이 밝을 때까지 빛났어요.'],['墩墩戴着耳罩，也跟着节奏点头。','둥둥은 귀마개를 쓰고도 박자에 맞춰 고개를 끄덕였어요.'],['这一天，小镇的笑声传得好远。','그날 동네의 웃음소리는 아주 멀리까지 퍼졌어요.'],['照片挂上墙，小镇的故事还在继续。','사진이 벽에 걸리고, 동네 이야기는 계속돼요.']];
/* 5/5 story: three lines per stage, and one running mystery of the little footprints */
const L_='栗栗',T_='团团',D_='滴滴',N_='墩墩',Z_='啄啄',X_='闪闪',P_='砰砰',M_='小猫';
const STORY=[
[[T_,'照片洗出来啦！','사진이 나왔어!'],[L_,'咦，角落里有个小脚印？','어? 구석에 작은 발자국이 있네?'],[T_,'是谁偷偷来看我们拍照？','누가 몰래 사진 찍는 걸 보러 왔을까?']],
[[T_,'第一笼，全卖光啦！','첫 찜통이 다 팔렸어!'],[L_,'门口又有小脚印！','문 앞에 또 작은 발자국이 있어!'],[D_,'它还拿走了一个小包子。','게다가 작은 만두도 하나 가져갔어.']],
[[N_,'以后我只在院子里玩球。','이제 마당에서만 공놀이할게.'],[L_,'那沙发上的脚印是谁的？','그럼 소파의 발자국은 누구 거야?'],[N_,'不是我！我的脚比较大！','나 아니야! 내 발은 더 크다고!']],
[[X_,'阁楼原来这么漂亮。','다락이 이렇게 예뻤구나.'],[L_,'箱子上有脚印，还少了一张旧照片。','상자에 발자국이 있고, 옛날 사진도 한 장 없어.'],[X_,'它在收集照片吗？','사진을 모으고 있는 걸까?']],
[[T_,'庙会成功啦！','장터 대성공!'],[Z_,'我在天上看到一个小影子跑过去。','하늘에서 작은 그림자가 달려가는 걸 봤어.'],[L_,'又是它！','또 그 녀석이야!']],
[[N_,'海鸥不抢点心了。','갈매기가 이제 간식을 안 뺏어.'],[D_,'沙滩上有一串小脚印，通向小镇。','모래사장에 작은 발자국이 마을로 이어져 있어.'],[L_,'它到底从哪里来？','도대체 어디서 온 걸까?']],
[[Z_,'这封信没有署名。','이 편지엔 이름이 없어.'],[L_,'上面只写着：明天见。','"내일 봐요"라고만 적혀 있네.'],[Z_,'信封上盖着小脚印！','봉투에 작은 발자국 도장이 찍혀 있어!']],
[[L_,'每家都收到了小红花。','집집마다 작은 꽃을 받았어.'],[X_,'有一朵被叼走了。','한 송이는 누가 물어 갔어.'],[L_,'小脚印也喜欢花吗？','작은 발자국도 꽃을 좋아하나?']],
[[N_,'风筝回来啦！','연이 돌아왔어!'],[Z_,'线上挂着一根橘色的毛。','줄에 주황색 털이 한 올 걸려 있어.'],[L_,'橘色的毛？','주황색 털?']],
[[T_,'谢谢大家！','모두 고마워!'],[L_,'蛋糕少了一小块。','케이크가 조금 없어졌어.'],[T_,'旁边的小脚印，好像在说生日快乐。','옆의 작은 발자국이 생일 축하한다고 말하는 것 같아.']],
[[D_,'阿嚏！我好啦。','에취! 다 나았어.'],[L_,'枕头边的小红花是谁放的？','베개 옆의 작은 꽃은 누가 뒀을까?'],[D_,'夜里，有个毛茸茸的朋友陪着我。','밤에 복슬복슬한 친구가 곁에 있어 줬어.']],
[[T_,'点心都回家了。','딤섬이 다 돌아왔어.'],[L_,'小猫，你怎么这么熟悉这里？','고양이야, 넌 왜 여길 이렇게 잘 알아?'],[M_,'喵～','야옹~ (못 들은 척)']],
[[L_,'还有第六封信！','여섯 번째 편지가 있어!'],[X_,'写着：你们的照片真好看。','"너희 사진 정말 예뻐"라고 적혀 있어.'],[L_,'这字……是用爪子写的！','이 글씨… 발톱으로 쓴 거야!']],
[[Z_,'我们得奖啦！','우리가 상을 받았어!'],[L_,'奖状背面有个小脚印。','상장 뒤에 작은 발자국이 있어.'],[N_,'难道评委也是它？','설마 심사위원도 그 녀석이야?']],
[[D_,'快看，彩虹！','저기 봐, 무지개!'],[L_,'屋檐下躲雨的，是那只小猫。','처마 밑에서 비를 피하는 건 그 고양이야.'],[X_,'它怀里抱着什么？','품에 뭘 안고 있지?']],
[[P_,'彩纸撒完啦！','색종이를 다 뿌렸어!'],[L_,'小猫在捡彩纸。','고양이가 색종이를 줍고 있어.'],[P_,'它要做什么呢？','뭘 하려는 걸까?']],
[[X_,'灯全亮了！','등이 다 켜졌어!'],[L_,'屋顶上有东西在发光。','지붕 위에서 뭔가 빛나.'],[X_,'是旧照片！它全都收着！','옛날 사진이야! 전부 모아 뒀어!']],
[[N_,'大家鼓掌！','모두 박수!'],[L_,'最后一排有个小观众。','맨 뒷줄에 작은 관객이 있어.'],[T_,'它也想和大家在一起吧。','그 친구도 모두와 함께하고 싶은가 봐.']],
[[T_,'今天是小镇最热闹的一天。','오늘은 동네에서 가장 신나는 날이야.'],[L_,'小猫，你愿意一起拍照吗？','고양이야, 같이 사진 찍을래?'],[M_,'喵！','야옹! (작은 상자를 밀어 준다)']],
[[L_,'盒子里全是我们的照片！','상자에 우리 사진이 가득해!'],[T_,'原来它一直在帮我们收藏回忆。','계속 우리 추억을 모아 주고 있었구나.'],[M_,'喵～全镇合影，算我一个！','야옹~ 동네 사진, 나도 끼워 줘!']]];
ST.forEach((s,i)=>{s.after=AFTER[i];s.story=STORY[i];const a='end_'+String(i+1).padStart(2,'0');if(require('fs').existsSync(require('path').join(__dirname,'../art',a+'.webp')))s.endArt=a;});
/* bag items, stages 2-5 */
{const s=at(2);need(s,'shutter','handle');s.rules.push(tap('shutter','!handle',['wig','shutter',.5],['tone','nope'],say('门卡住了，少个把手','문이 걸렸어, 손잡이가 없네','shutter',1.5)));pick(s,'knobT','knob',.16,.74,.06,'捡到一个门把手！','문 손잡이를 주웠어!',['这里用不上把手','여긴 손잡이가 필요 없어']);s.rules.push(use('knobT','shutter','!handle&!shutter',set('handle'),['tone','good'],say('装好了，往上推推看','달았어, 위로 밀어 봐','shutter',1.5)));}
{const s=at(3);s.rules=s.rules.filter(q=>!(q.t==='rug'&&q.on==='swipe'));pick(s,'dusterT','duster',.95,.50,.07,'找到掸子啦！','먼지떨이를 찾았어!',['这里不用掸','여긴 털 필요 없어']);s.rules.push(rub('dusterT','rug','!rug',set('rug'),say('地毯平整啦','양탄자가 평평해졌어','rug')));}
pick(at(4),'duster','duster',.60,.62,.08,'旧掸子还能用！','낡은 먼지떨이도 쓸 만해!');
{const s=at(5);s.objs=s.objs.filter(o=>o.id!=='haw');s.rules=s.rules.filter(q=>q.t!=='haw');s.objs.push({id:'stall',hot:1,x:.93,y:.46,r:.08});s.tools.push({id:'hawT',img:'hawthorn',have:'out',miss:['这个是给墩墩的','이건 둥둥 줄 거야']});s.rules.push(tap('stall','!out',['fly','hawthorn',[.93,.46],'tray',.4,.05,.05],set('out'),['tone','good'],say('买到糖葫芦啦！','탕후루를 샀어!',[.5,.86],1.5)));s.rules.push(use('hawT','dun','!haw',set('haw'),say('甜甜的！','달콤해!','dun')));}
for(const s of ST){s.diff=diff(s.id);s.time=time(s.id);}
module.exports=ST;
