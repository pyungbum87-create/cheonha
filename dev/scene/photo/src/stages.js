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
 probs:[P('wake','团团还在打呼噜','탄탄은 코를 골고','摄影师睡着啦！','사진사가 잠들었어!'),P('alarm','闹钟响个不停','자명종은 계속 울리고','闹钟抢镜了','자명종이 주인공'),P('sign','招牌躺在地上','간판은 바닥에 누웠고','招牌还没挂','간판을 못 달았어'),P('shutter','卷帘门还关着','셔터는 닫혀 있고','客人进不来','손님이 못 들어와'),P('dim','烧卖跑错了地方','샤오마이는 엉뚱한 곳에 있고','烧卖迷路了','길 잃은 샤오마이')],
 all:['开张大吉！','개점 대성공!'],none:['这家店还没醒','아직 잠든 가게'],pair:['11000','闹钟也叫不醒的团团','자명종도 못 깨운 탄탄'],
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
 open:[say('团团快回来了，快布置！','탄탄이 곧 와, 얼른 준비하자!','lili',2.2)],
 probs:[P('flags','彩旗没挂','깃발은 안 걸렸고','没有彩旗的派对','깃발 없는 파티'),P('bal','气球没吹','풍선은 쭈글하고','瘪气球派对','쭈글 풍선 파티'),P('cake','蛋糕藏不住','케이크는 그대로고','蛋糕还在沙发上','소파 위 케이크'),P('cand','蜡烛没插好','초는 바닥에 있고','蜡烛在地上','바닥에 있는 초'),P('gift','礼物没摆','선물은 안 놓였고','礼物还没放好','아직 못 놓은 선물')],
 all:['生日快乐，团团！','생일 축하해, 탄탄!'],none:['惊喜露馅啦！','깜짝 파티 들통!'],pair:['00110','蛋糕和蜡烛还没到位','케이크도 초도 아직'],
 tools:[ZHUO],
 objs:[{id:'flags',img:'flags',x:.68,y:.88,w:.22,z:4,r:.09,alt:[{if:'flags',x:.52,y:.30}]},{id:'bal',img:'balloon_d',x:.46,y:.92,w:.08,z:4,r:.07,alt:[{if:'bal',img:'balloon',w:.10,x:.28,y:.34}]},{id:'cake',img:'cake',x:.10,y:.56,w:.12,z:3,r:.08,alt:[{if:'cake',x:.5,y:.47}]},{id:'cand',img:'candle2',x:.86,y:.90,w:.035,z:5,r:.06,alt:[{if:'cand',x:.40,y:.49}]},{id:'gift',img:'gift',x:.92,y:.76,w:.10,z:4,r:.07,alt:[{if:'gift',x:.64,y:.48}]},{id:'hidE',img:'eggtart',x:.10,y:.68,w:.05,z:4,show:'!found'},{id:'door',hot:1,x:.87,y:.40,r:.10}],
 rules:[drag('flags',[.52,.28,.13],'!flags',set('flags')),use('zhuo','flags','!flags',['fly','zhuozhuo','tray','flags',.5,.1,.12],set('flags')),hold('bal','!bal',set('bal')),
  drag('cake',[.5,.5,.13],'!cake&tw',set('cake')),Object.assign(tap('cake','!cake&!tw',set('tw'),['fly','tt_cheer','door',[.82,.46],.4,.02,.14],['tone','nope'],['mood','shock'],say('咦？什么味道这么香？','어? 무슨 냄새가 이렇게 좋지?','door',1.6),['wait',.5],say('快藏好，团团走了！','휴, 탄탄이 갔어!','lili',1.4)),{lockq:1}),
  drag('cand',[.42,.5,.1],'!cand',set('cand')),drag('gift',[.64,.5,.11],'!gift',set('gift')),tap('hidE','',set('found'),['found'],say('沙发上藏着蛋挞！','소파에 에그타르트가!','hidE')),tap('door','',['wig','door',.3],say('嘘！团团在外面','쉿! 탄탄이 밖에 있어','door'))]}),
/* 11 visiting sick didi ------------------------------------------------ */
stage({id:11,title:'探望滴滴',ko:'방울이 병문안',goal:'探病合影',bg:'l2_bg',lili:[.77,.76,.18],hid:'thermo',
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
 all:['全镇都到齐啦！','온 동네가 다 모였어!'],none:['只有我和团团','나랑 탄탄뿐이야'],pair:['00011','少了砰砰和滴滴','펑펑과 방울이가 없어'],
 tools:[],
 objs:[{id:'tuan',img:'cam_clear',x:.88,y:.82,w:.18,z:6,r:.10},{id:'dun',img:'dundun',x:.14,y:.90,w:.15,z:5,r:.09,alt:[{if:'dun',x:.22,y:.62}]},{id:'zhuo',img:'zhuozhuo',x:.34,y:.88,w:.13,z:5,r:.08,alt:[{if:'zhuo',x:.34,y:.52}]},{id:'shan',img:'shanshan',x:.54,y:.90,w:.13,z:5,r:.08,alt:[{if:'shan',x:.66,y:.52}]},{id:'peng',img:'pengpeng',x:.70,y:.88,w:.14,z:5,r:.08,alt:[{if:'peng',x:.78,y:.62}]},{id:'didi',img:'didi',x:.44,y:.76,w:.12,z:4,r:.08,alt:[{if:'didi',x:.36,y:.67}]},{id:'hidL',hot:1,x:.08,y:.24,r:.07}],
 rules:[drag('dun',[.22,.62,.12],'!dun',set('dun')),drag('zhuo',[.34,.52,.11],'!zhuo',set('zhuo')),drag('shan',[.66,.52,.11],'!shan',set('shan')),drag('didi',[.36,.67,.10],'!didi',set('didi')),Object.assign(drag('peng',[.78,.62,.12],'!peng&!tw',set('tw'),['fx','confetti','peng'],['tone','note',880],say('砰砰太开心，先撒了彩纸！','펑펑이 신나서 색종이부터 뿌렸어!',[.6,.4],1.7)),{}),drag('peng',[.78,.62,.12],'!peng&tw',set('peng')),tap('hidL','!found',set('found'),['found'],say('灯笼后面有小脚印！','등롱 뒤에 작은 발자국이!','hidL'))]}),
/* ===================== SEASON 2 · 刺刺的四季相册 (Cici's four seasons) ===================== */
/* 21 watermelon --------------------------------------------------------------------------- */
stage({id:21,title:'西瓜大作战',ko:'수박 대소동',goal:'西瓜派对合影',bg:'s2_hill_sum',lili:[.46,.76,.18],hid:'cici_back',
 open:[say('听说小镇来了新朋友！先切西瓜！','동네에 새 친구가 왔대! 수박부터 자르자!','lili',2.4)],
 probs:[P('melon','西瓜还在滚','수박은 굴러가고','西瓜跑掉啦','수박이 도망갔어'),P('ants','蚂蚁在搬西瓜','개미는 수박을 나르고','蚂蚁也来野餐','개미도 소풍 왔어'),P('spr','洒水器乱喷','스프링클러는 마구 뿌리고','湿答答的野餐','축축한 소풍'),P('umb','阳伞倒了','파라솔은 쓰러졌고','晒得发烫','햇볕이 너무 뜨거워'),P('dun','墩墩热得睡着了','둥둥은 더워서 잠들었고','墩墩睡过头','둥둥이 늦잠 잤어')],
 all:['西瓜派对开始啦！','수박 파티 시작!'],none:['夏天乱成一团','정신없는 여름날'],pair:['10001','西瓜跑了，墩墩还在睡','수박은 도망가고 둥둥은 쿨쿨'],
 tools:[],
 objs:[{id:'mat',img:'cov_mat',x:.27,y:.74,w:.2,z:1},{id:'melon',img:'s2_melon',x:.86,y:.64,w:.11,z:3,r:.08,anim:'shake',calm:'melon',alt:[{if:'melon',x:.27,y:.70}]},{id:'slice',img:'s2_slice',x:.55,y:.92,w:.07,z:3},{id:'ants',img:'s2_ants',x:.42,y:.90,w:.12,z:3,show:'!ants',r:.07},
  {id:'spr',img:'s2_spr_on',x:.12,y:.60,w:.11,z:3,r:.07,alt:[{if:'spr',img:'s2_spr_off',w:.09}]},{id:'umb',img:'s2_umb',x:.74,y:.84,w:.13,rot:.5,z:4,r:.09,alt:[{if:'umb',rot:0,y:.78}]},
  {id:'dun',img:'s2_dun_sleep',x:.62,y:.62,w:.14,z:2,r:.08,alt:[{if:'dun',img:'dundun',w:.10,y:.58}]},{id:'hidC',img:'cici_back',x:.92,y:.86,w:.07,z:2,show:'!found'}],
 rules:[Object.assign(drag('melon',[.27,.70,.12],'!melon&!tw',set('tw'),['go','melon',.86,.64,.45],['tone','nope'],say('西瓜又滚回去啦！','수박이 또 굴러갔어!',[.7,.5],1.3),['off','melon']),{lockq:1}),drag('melon',[.27,.70,.12],'!melon&tw',set('melon')),
  swipe('ants','left','!ants',set('ants'),say('小蚂蚁，去那边吃吧','개미야, 저쪽에서 먹으렴','ants',1.3)),tap('spr','!spr',['fx','splash','spr'],set('spr')),rot('umb',-.5,'!umb',null,set('umb')),
  tap('dun','!dun',['wig','dun',.5],say('呼……好热……','쿨… 너무 더워…','dun',1.4)),tap('hidC','',set('found'),['found'],['mood','shock'],say('向日葵后面有一团小刺！','해바라기 뒤에 가시 뭉치가!','hidC',1.6))]}),
/* 22 fireflies ------------------------------------------------------------------------------ */
stage({id:22,title:'萤火虫之夜',ko:'반딧불이 밤',goal:'萤火虫合影',bg:'s2_hill_night',lili:[.46,.76,.18],hid:'cici_eyes',dark:{a:.3,off:'lan'},
 open:[say('夜里的山坡好黑呀……','밤 언덕은 너무 깜깜해…','lili',2.2)],
 probs:[P('lan','灯笼没点亮','등롱은 꺼져 있고','黑漆漆的夜','깜깜한 밤'),P('jar','瓶子空空的','유리병은 비어 있고','没抓到萤火虫','반딧불이를 못 모았어'),P('cic','知了吵个不停','매미는 계속 울고','知了大合唱','매미 대합창'),P('mos','蚊子嗡嗡叫','모기는 앵앵거리고','被蚊子咬啦','모기에 물렸어'),P('slip','拖鞋丢了一只','슬리퍼 한 짝은 없고','只穿一只拖鞋','슬리퍼 한 짝만')],
 all:['满天都是小星星','온 하늘에 작은 별'],none:['黑夜里什么都看不见','깜깜해서 아무것도 안 보여'],pair:['01001','灯亮了，瓶子却空了','등은 켜졌는데 병은 비었어'],
 tools:[SHAN],
 objs:[{id:'lan',img:'lantern',x:.24,y:.64,w:.08,z:3,r:.07},{id:'jar',img:'s2_jar',x:.60,y:.86,w:.08,z:3,r:.07,alt:[{if:'jar',img:'s2_jar_glow'}]},{id:'cic',img:'s2_cicada',x:.90,y:.24,w:.09,z:3,r:.07,show:'!cic'},
  {id:'fan',img:'s2_fan',x:.34,y:.90,w:.08,z:3,r:.07,show:'!mos'},{id:'slip',img:'s2_slipper',x:.80,y:.70,w:.07,z:3,r:.06,alt:[{if:'slip',x:.40,y:.84}]},{id:'hidC',img:'cici_eyes',x:.08,y:.90,w:.08,z:2,show:'!found'}],
 rules:[use('shan','lan','!lan',['fx','spark','lan'],set('lan'),say('灯笼亮啦！','등롱이 켜졌어!','lan',1.2)),
  hold('jar','!jar&!lan',['fx','spark','jar'],set('jar'),say('萤火虫飞进来了！','반딧불이가 들어왔어!','jar',1.3)),tap('jar','!jar&lan',['wig','jar',.5],['tone','nope'],say('太亮了，萤火虫不肯来','너무 밝아서 반딧불이가 안 와','jar',1.6)),
  Object.assign(swipe('cic','up','!cic&!tw',set('tw'),['go','cic',.6,.05,.4],['tone','nope'],say('知了又飞回来了！','매미가 또 돌아왔어!',[.7,.3],1.2),['go','cic',.90,.24,.4],['off','cic']),{lockq:1}),swipe('cic','up','!cic&tw',set('cic')),
  drag('fan',[.46,.70,.12],'!mos',set('mos'),say('扇一扇，蚊子跑啦','부채질하니 모기가 도망갔어','lili',1.3)),drag('slip',[.46,.76,.12],'!slip',set('slip')),
  tap('hidC','',set('found'),['found'],['mood','shock'],say('草丛里有一双小眼睛！','풀숲에 작은 눈 두 개가!','hidC',1.6))]}),
/* 23 quilts in the wind ---------------------------------------------------------------------- */
stage({id:23,title:'晒被子遇大风',ko:'이불 말리다 바람',goal:'晒被子合影',bg:'s2_post_sum',lili:[.42,.76,.18],hid:'cici_ball',
 open:[say('风把被子吹上天啦！','바람이 이불을 하늘로 날렸어!','lili',2.2)],
 probs:[P('quilt','被子飞走了','이불은 날아갔고','被子去旅行了','이불이 여행을 떠났어'),P('pegs','夹子撒了一地','빨래집게는 쏟아졌고','夹子满地跑','집게가 데굴데굴'),P('cat','小猫躺在路中间','고양이는 길에 누웠고','小猫不让路','비켜 주지 않는 고양이'),P('pot','花盆倒了','화분은 넘어졌고','花盆摔跤了','넘어진 화분'),P('cloud','乌云飘过来','먹구름이 다가오고','要下雨啦','비가 오려나 봐')],
 all:['被子晒得香喷喷','보송보송 마른 이불'],none:['风把一切都吹乱了','바람이 다 흐트러뜨렸어'],pair:['10001','被子飞了，乌云来了','이불은 날고 먹구름은 오고'],
 tools:[ZHUO],
 objs:[{id:'quilt',img:'s2_quilt',x:.80,y:.15,w:.15,z:5,r:.09,rot:-.2,alt:[{if:'quilt',x:.22,y:.62,rot:0,w:.17}]},{id:'pegs',img:'s2_pegs',x:.14,y:.86,w:.10,rot:1.1,z:3,r:.07,alt:[{if:'pegs',rot:0}]},
  {id:'cat',img:'cat_dry',x:.64,y:.86,w:.11,z:3,r:.07,alt:[{if:'cat',x:.90,y:.88}]},{id:'pot',img:'pot_bloom',x:.74,y:.64,w:.08,rot:.6,z:3,r:.07,alt:[{if:'pot',rot:0}]},
  {id:'cloud',img:'s2_cloud',x:.24,y:.12,w:.14,z:5,anim:'bob',show:'!cloud',r:.09},{id:'hidC',img:'cici_ball',x:.05,y:.66,w:.06,z:2,show:'!found'}],
 rules:[use('zhuo','quilt','!quilt',['fly','zhuozhuo','tray','quilt',.6,.2,.1],set('quilt'),say('啄啄把被子叼回来啦！','쫑쫑이 이불을 물어 왔어!',[.5,.35],1.4)),tap('pegs','!pegs',set('pegs')),
  hold('cat','!cat',set('cat'),say('喵～让开就让开','야옹~ 비켜 줄게','cat',1.2)),rot('pot',-.6,'!pot',null,set('pot')),
  Object.assign(swipe('cloud','left','!cloud&!tw',set('tw'),['go','cloud',.05,.12,.4],['tone','nope'],say('乌云又飘回来了！','먹구름이 다시 왔어!',[.4,.3],1.2),['go','cloud',.24,.12,.5],['off','cloud']),{lockq:1}),swipe('cloud','left','!cloud&tw',set('cloud')),
  tap('hidC','',set('found'),['found'],['mood','shock'],say('树丛边滚着一个小刺球！','덤불 옆에 가시 공이 굴러다녀!','hidC',1.6))]}),
/* 24 shaved ice shop ------------------------------------------------------------------------- */
stage({id:24,title:'冰沙小店',ko:'시원한 빙수 가게',goal:'冰沙店合影',bg:'s2_ice',lili:[.50,.76,.18],hid:'cici_post',
 open:[say('好热！冰沙都要化了！','너무 더워! 빙수가 다 녹겠어!','lili',2.2)],
 probs:[P('ice','冰沙化成水','빙수는 녹아 버렸고','一碗冰水','빙수 대신 얼음물'),P('efan','风扇没开','선풍기는 꺼져 있고','热得冒汗','땀이 줄줄'),P('didi','滴滴热晕了','방울이는 더위 먹었고','滴滴快化了','방울이가 녹겠어'),P('paper','纸团掉在地上','종이뭉치는 바닥에 있고','地上有纸团','바닥에 종이뭉치'),P('jar','果酱瓶滚到地上','잼 병은 바닥에 굴렀고','果酱瓶迷路了','길 잃은 잼 병')],
 all:['冰沙好凉快！','빙수 정말 시원해!'],none:['热得什么都化了','더워서 다 녹았어'],pair:['00110','滴滴和纸团都在地上','방울이도 종이뭉치도 바닥에'],
 tools:[{id:'iceT',img:'s2_ice_new',have:'got_ice',miss:['这里不需要冰沙','여긴 빙수가 필요 없어']}],
 objs:[{id:'bowl',img:'s2_ice_melt',x:.21,y:.53,w:.08,z:3,r:.06,alt:[{if:'ice',img:'s2_ice_new'}]},{id:'box',img:'s2_icebox',x:.84,y:.88,w:.13,z:3,r:.08},{id:'efan',img:'s2_efan',x:.92,y:.66,w:.09,z:3,r:.07,anim:'shake',calm:'!efan'},
  {id:'didi',img:'s2_didi_hot',x:.30,y:.88,w:.10,z:3,r:.07,alt:[{if:'didi',img:'didi',x:.70,y:.86,w:.08}]},{id:'bin',img:'bin',x:.07,y:.86,w:.08,z:2},{id:'paper',img:'paper',x:.62,y:.93,w:.05,z:3,show:'!paper',r:.06},
  {id:'jar',img:'s2_jar',x:.44,y:.93,w:.06,rot:1.4,z:3,r:.06,alt:[{if:'jar',x:.66,y:.52,rot:0}]},{id:'hidC',img:'cici_post',x:.28,y:.50,w:.07,z:2,show:'!found'}],
 rules:[tap('box','!got_ice',['fly','s2_ice_new',[.84,.84],'tray',.4,.05,.07],set('got_ice'),['tone','good'],say('盛了一碗新冰沙！','새 빙수를 담았어!',[.5,.86],1.3)),use('iceT','bowl','!ice',set('ice'),say('又冰又甜！','차갑고 달콤해!','bowl',1.2)),
  hold('efan','!efan',['fx','leaf','efan'],set('efan')),
  Object.assign(drag('didi',[.84,.84,.12],'!didi&!tw',set('tw'),['tone','nope'],say('冰箱盖着，打开才凉快','아이스박스가 닫혀 있어, 열어야 시원해','didi',1.5)),{lockq:1}),drag('didi',[.84,.84,.12],'!didi&tw',set('didi'),say('凉快多了！','훨씬 시원해!','didi',1.2)),
  drag('paper',[.07,.84,.08],'!paper',set('paper')),drag('jar',[.66,.52,.09],'!jar',set('jar')),
  tap('hidC','',set('found'),['found'],['mood','shock'],say('门边有个小身影！','문 옆에 작은 그림자가!','hidC',1.6))]}),
/* 25 lotus pond ------------------------------------------------------------------------------ */
stage({id:25,title:'荷塘划船',ko:'연못 뱃놀이',goal:'荷塘合影',bg:'s2_pond',lili:[.50,.76,.18],hid:'cici_eyes',
 open:[say('一起划船吧！咦，船卡住了？','같이 배 타자! 어, 배가 걸렸어?','lili',2.2)],
 probs:[P('boat','小船卡住了','배는 걸려 있고','船开不动','배가 안 움직여'),P('frog','青蛙跳上岸','개구리는 뭍에 올라왔고','青蛙迷路了','길 잃은 개구리'),P('bud','荷花还没开','연꽃은 오므렸고','花苞睡着了','잠든 꽃봉오리'),P('duck','小鸭子找不到妈妈','아기 오리는 길을 잃었고','小鸭子哭了','우는 아기 오리'),P('oar','船桨冲上岸','노는 뭍으로 밀려왔고','没有船桨','노가 없어')],
 all:['荷塘的夏天真美','아름다운 연못의 여름'],none:['小船还在原地','배는 그대로야'],pair:['10001','船卡住了，船桨也丢了','배도 걸리고 노도 잃었어'],
 tools:[DUN,DIDI],
 objs:[{id:'boat',img:'s2_boat',x:.66,y:.40,w:.20,rot:.3,z:3,r:.1,alt:[{if:'boat',rot:0,x:.46}]},{id:'frog',img:'s2_frog',x:.78,y:.70,w:.10,z:3,r:.07,alt:[{if:'frog',x:.30,y:.42,w:.08}]},
  {id:'bud',img:'s2_bud',x:.15,y:.45,w:.07,z:3,r:.07,alt:[{if:'bud',img:'s2_lotus',w:.09}]},{id:'duck',img:'s2_duck',x:.14,y:.86,w:.08,z:3,r:.07,alt:[{if:'duck',x:.82,y:.42,w:.06}]},
  {id:'oar',img:'s2_oar',x:.93,y:.60,w:.08,rot:.4,z:3,r:.07,alt:[{if:'oar',x:.36,y:.58,rot:1.3}]},{id:'hidC',img:'cici_eyes',x:.88,y:.49,w:.07,z:2,show:'!found'}],
 rules:[use('dun','boat','!boat',['fly','dundun','tray','boat',.6,.2,.1],['fx','splash','boat'],set('boat'),say('用力一推，船出来啦！','힘껏 밀었더니 배가 빠졌어!',[.5,.3],1.4)),
  Object.assign(drag('frog',[.30,.42,.1],'!frog&!tw',set('tw'),['go','frog',.78,.70,.4],['tone','nope'],say('呱！青蛙又跳回来了','개굴! 개구리가 또 뛰어왔어',[.7,.55],1.2),['off','frog']),{lockq:1}),drag('frog',[.30,.42,.1],'!frog&tw',set('frog')),
  use('didi','bud','!bud',['fx','drops','bud'],set('bud'),say('荷花开啦！','연꽃이 피었어!','bud',1.2)),drag('duck',[.82,.42,.1],'!duck',set('duck'),say('找到妈妈啦','엄마를 찾았어','duck',1.2)),drag('oar',[.36,.58,.1],'!oar',set('oar')),
  tap('hidC','',set('found'),['found'],['mood','shock'],say('石头后面有一双小眼睛！','바위 뒤에 작은 눈이!','hidC',1.6))]}),
/* 26 mid-autumn moon --------------------------------------------------------------------------- */
stage({id:26,title:'中秋赏月',ko:'추석 달맞이',goal:'中秋合影',bg:'s2_moon',lili:[.48,.76,.18],hid:'cici_eyes',
 open:[say('中秋节！咦，月亮怎么不见了？','추석이다! 어, 달이 어디 갔지?','lili',2.2)],
 probs:[P('cloud','乌云遮住月亮','먹구름이 달을 가렸고','月亮躲起来','달이 숨었어'),P('rab','兔子灯没亮','토끼등은 꺼져 있고','兔子灯睡着了','토끼등이 잠들었어'),P('box','月饼盒打不开','월병 상자는 안 열리고','月饼还在盒子里','월병은 아직 상자 속'),P('tea','茶洒了','차는 쏟아졌고','茶水流一地','차가 줄줄'),P('osm','桂花枝掉在地上','계화 가지는 떨어졌고','桂花没人看','아무도 안 본 계화')],
 all:['月圆人团圆','달도 둥글, 우리도 둥글'],none:['中秋夜一团乱','정신없는 추석 밤'],pair:['10010','月亮躲起来，茶也洒了','달은 숨고 차는 쏟아졌어'],
 tools:[SHAN],
 objs:[{id:'cloud',img:'s2_mcloud',x:.44,y:.10,w:.24,z:5,show:'!cloud',r:.12},{id:'rab',img:'s2_rab_off',x:.80,y:.62,w:.09,z:3,r:.07,alt:[{if:'rab',img:'s2_rab_on'}]},
  {id:'box',img:'s2_mbox',x:.30,y:.88,w:.12,z:3,r:.08,alt:[{if:'box',img:'s2_mbox_open',w:.13}]},{id:'tea',img:'s2_teaset',x:.64,y:.88,w:.11,z:3,r:.08,alt:[{if:'tea',img:'tea',w:.07}]},
  {id:'osm',img:'s2_osm',x:.12,y:.72,w:.10,rot:1,z:3,r:.07,alt:[{if:'osm',x:.22,y:.52,rot:.3}]},{id:'hidC',img:'cici_eyes',x:.90,y:.53,w:.07,z:2,show:'!found'}],
 rules:[swipe('cloud','right','!cloud',set('cloud'),['fx','spark',[.5,.12]],say('月亮出来啦！','달이 나왔어!',[.45,.25],1.3)),use('shan','rab','!rab',['fx','spark','rab'],set('rab')),
  Object.assign(tap('box','!box&!tw',set('tw'),['wig','box',.6],['tone','nope'],say('丝带系得好紧！再试一次','리본이 꽉 묶였어! 한 번 더','box',1.4)),{lockq:1}),tap('box','!box&tw',set('box')),
  tap('tea','!tea',set('tea')),drag('osm',[.22,.52,.1],'!osm',set('osm')),tap('hidC','',set('found'),['found'],['mood','shock'],say('石头后面有一双小眼睛！','바위 뒤에 작은 눈이!','hidC',1.6))]}),
/* 27 autumn leaves ------------------------------------------------------------------------------ */
stage({id:27,title:'落叶大扫除',ko:'낙엽 대청소',goal:'扫落叶合影',bg:'s2_court_aut',lili:[.50,.78,.18],hid:'cici_eyes',
 open:[say('风一吹，满院子都是叶子！','바람이 불어 마당이 낙엽투성이!','lili',2.2)],
 probs:[P('pile','落叶满地','낙엽은 흩어졌고','叶子到处飞','낙엽이 훨훨'),P('sq','松鼠藏橡果','다람쥐는 도토리를 숨기고','松鼠不理人','다람쥐가 모른 척'),P('lan','灯笼掉下来','등롱은 떨어졌고','灯笼在地上','바닥에 등롱'),P('mag','喜鹊吵吵闹闹','까치는 시끄럽고','喜鹊开会','까치 회의 중'),P('bask','篮子翻倒了','바구니는 뒤집혔고','篮子打滚','바구니가 데굴')],
 all:['院子干干净净','깨끗해진 마당'],none:['秋风把院子吹乱了','가을바람에 엉망이 된 마당'],pair:['10100','叶子和灯笼都在地上','낙엽도 등롱도 바닥에'],
 tools:[ZHUO],
 objs:[{id:'heap',img:'s2_leafpile',x:.26,y:.86,w:.15,z:2,alt:[{if:'pile',w:.20}]},{id:'lv',img:'s2_leaves',x:.70,y:.84,w:.15,z:3,show:'!pile',r:.09},{id:'sq',img:'s2_squirrel',x:.86,y:.64,w:.09,z:3,r:.07,alt:[{if:'sq',x:.94,y:.60,w:.07}]},
  {id:'lan',img:'lantern',x:.62,y:.66,w:.07,rot:1.2,z:3,r:.07,alt:[{if:'lan',x:.50,y:.12,rot:0}]},{id:'mag',img:'s2_magpie',x:.70,y:.08,w:.11,z:5,show:'!mag',r:.08},
  {id:'bask',img:'s2_bask',x:.40,y:.66,w:.08,rot:1.4,z:3,r:.07,alt:[{if:'bask',rot:0}]},{id:'hidC',img:'cici_eyes',x:.15,y:.60,w:.07,z:2,show:'!found'}],
 rules:[Object.assign(swipe('lv','left','!pile&!tw',set('tw'),['tone','nope'],say('风又把叶子吹回来了！再扫一次','바람이 낙엽을 또 날렸어! 한 번 더','lv',1.5)),{lockq:1}),swipe('lv','left','!pile&tw',set('pile')),
  hold('sq','!sq',set('sq'),say('分你一颗橡果！','도토리 하나 나눠 줄게!','sq',1.3)),use('zhuo','lan','!lan',['fly','zhuozhuo','tray','lan',.6,.2,.1],set('lan'),say('灯笼挂回去啦','등롱을 다시 걸었어',[.5,.25],1.2)),
  swipe('mag','up','!mag',set('mag')),tap('bask','!bask',set('bask')),tap('hidC','',set('found'),['found'],['mood','shock'],say('树丛里有一双小眼睛！','덤불 속에 작은 눈이!','hidC',1.6))]}),
/* 28 persimmons ------------------------------------------------------------------------------- */
stage({id:28,title:'柿子丰收',ko:'감 따기',goal:'摘柿子合影',bg:'s2_hill_aut',lili:[.44,.76,.18],hid:'cici_post',
 open:[say('柿子红了！可是挂得好高……','감이 빨갛게 익었어! 그런데 너무 높아…','lili',2.2)],
 probs:[P('kaki','柿子摘不到','감은 못 따고','篮子空空','바구니는 텅텅'),P('mag','喜鹊偷吃柿子','까치는 감을 쪼고','喜鹊吃饱了','배부른 까치'),P('lad','梯子摇摇晃晃','사다리는 흔들리고','梯子要倒了','사다리가 넘어지려 해'),P('green','青柿子混进来','덜 익은 감이 섞였고','柿子还是绿的','감이 아직 초록'),P('ball','皮球滚下山坡','공은 언덕을 굴러가고','皮球跑远了','공이 멀리 갔어')],
 all:['满满一篮红柿子','바구니 가득 빨간 감'],none:['柿子还挂在树上','감은 아직 나무에'],pair:['11000','柿子没摘，喜鹊先吃了','감은 못 따고 까치가 먼저 먹었어'],
 tools:[],
 objs:[{id:'br',img:'s2_kaki_br',x:.70,y:.10,w:.15,z:4,r:.09},{id:'bask',img:'s2_bask',x:.24,y:.88,w:.10,z:3,alt:[{if:'kaki',img:'s2_bask_full'}]},{id:'mag',img:'s2_magpie',x:.56,y:.18,w:.10,z:5,show:'!mag',r:.08},
  {id:'lad',img:'s2_ladder',x:.84,y:.60,w:.09,rot:.5,z:3,r:.08,alt:[{if:'lad',rot:0}]},{id:'green',img:'s2_kaki_green',x:.62,y:.90,w:.06,z:3,r:.06,alt:[{if:'green',x:.10,y:.60}]},
  {id:'ball',img:'s2_rball',x:.92,y:.86,w:.07,z:3,r:.06,anim:'shake',calm:'ball',alt:[{if:'ball',x:.34,y:.62}]},{id:'hidC',img:'cici_post',x:.96,y:.44,w:.07,z:2,show:'!found'}],
 rules:[use('poleT','br','!kaki',['fly','s2_kaki_green',[.70,.12],[.24,.86],.6,.2,.04],set('kaki'),say('柿子掉进篮子里啦！','감이 바구니에 쏙!','bask',1.3)),
  Object.assign(swipe('mag','right','!mag&!tw',set('tw'),['go','mag',.95,.12,.4],['tone','nope'],say('喜鹊又飞回来了！','까치가 또 왔어!',[.5,.3],1.2),['go','mag',.56,.18,.5],['off','mag']),{lockq:1}),swipe('mag','right','!mag&tw',set('mag')),
  rot('lad',-.5,'!lad',null,set('lad')),drag('green',[.10,.60,.1],'!green',set('green'),say('放在太阳下晒晒','햇볕에 두면 익을 거야','green',1.3)),drag('ball',[.34,.62,.1],'!ball',set('ball')),
  tap('hidC','',set('found'),['found'],['mood','shock'],say('树后面有个小家伙在偷看！','나무 뒤에서 누가 엿보고 있어!','hidC',1.6))]}),
/* 29 sports day ------------------------------------------------------------------------------ */
stage({id:29,title:'小镇运动会',ko:'동네 운동회',goal:'运动会合影',bg:'s2_field',lili:[.50,.74,.18],hid:'cici_ball',
 open:[say('运动会要开始了！咦，接力棒呢？','운동회가 시작돼! 어, 바통은?','lili',2.2)],
 probs:[P('baton','接力棒不见了','바통은 사라졌고','没法接力','이어달리기 못 해'),P('rope','拔河绳打结了','줄다리기 줄은 엉켰고','绳子乱成一团','줄이 엉망'),P('fin','终点线倒了','결승선은 쓰러졌고','找不到终点','결승선이 어디야'),P('ball','皮球滚走了','공은 굴러갔고','皮球去比赛了','공이 혼자 달려'),P('mega','喇叭没声音','확성기는 조용하고','没人喊开始','시작 구호가 없어')],
 all:['运动会开始啦！','운동회 시작!'],none:['运动会还没准备好','운동회 준비가 덜 됐어'],pair:['00011','球跑了，喇叭也不响','공은 도망가고 확성기도 조용'],
 tools:[PENG],
 objs:[{id:'baton',img:'s2_baton',x:.82,y:.86,w:.09,z:3,r:.07,alt:[{if:'baton',x:.50,y:.74,w:.07}]},{id:'rope',img:'s2_rope_knot',x:.26,y:.62,w:.15,z:3,r:.09,alt:[{if:'rope',img:'s2_rope'}]},
  {id:'fin',img:'s2_finish',x:.76,y:.60,w:.15,rot:.7,z:3,r:.09,alt:[{if:'fin',rot:0}]},{id:'ball',img:'s2_rball',x:.12,y:.88,w:.07,z:3,r:.06,anim:'shake',calm:'ball',alt:[{if:'ball',x:.86,y:.33,w:.05}]},
  {id:'mega',img:'s2_mega',x:.60,y:.90,w:.08,z:3,r:.06},{id:'hidC',img:'cici_ball',x:.62,y:.33,w:.05,z:2,show:'!found'}],
 rules:[drag('baton',[.50,.74,.12],'!baton',set('baton'),say('接力棒找到了！','바통 찾았다!','lili',1.2)),
  Object.assign(hold('rope','!rope&!tw',set('tw'),['wig','rope',.6],['tone','nope'],say('越解越乱！再慢慢来','풀수록 엉켜! 천천히 다시','rope',1.5)),{lockq:1}),hold('rope','!rope&tw',set('rope')),
  rot('fin',-.7,'!fin',null,set('fin')),drag('ball',[.86,.33,.1],'!ball',set('ball')),use('peng','mega','!mega',['fx','confetti','mega'],set('mega'),say('预备——开始！','준비~ 시작!','mega',1.3)),
  tap('hidC','',set('found'),['found'],['mood','shock'],say('台子边有个小刺球！','단상 옆에 가시 공이!','hidC',1.6))]}),
/* 30 harvest market ---------------------------------------------------------------------------- */
stage({id:30,title:'丰收市集',ko:'풍년 장터',goal:'丰收合影',bg:'s2_market_aut',lili:[.50,.80,.18],hid:'cici_back',
 open:[say('丰收市集好热闹！哎呀，东西都乱了','풍년 장터 북적북적! 어머, 다 엉망이야','lili',2.2)],
 probs:[P('corn','玉米撒了一地','옥수수는 쏟아졌고','玉米满地滚','옥수수가 데굴'),P('pump','南瓜滚走了','호박은 굴러갔고','南瓜去散步','호박이 산책 중'),P('scale','秤歪了','저울은 기울었고','秤不准了','저울이 엉터리'),P('rice','米袋破了','쌀자루는 터졌고','米撒出来了','쌀이 쏟아졌어'),P('hat','稻草人的帽子飞了','허수아비 모자는 날아갔고','稻草人晒太阳','햇볕 쬐는 허수아비')],
 all:['大丰收！','대풍년!'],none:['市集乱成一锅粥','엉망진창 장터'],pair:['00011','米袋破了，帽子也飞了','쌀자루는 터지고 모자는 날아가고'],
 tools:[DUN],
 objs:[{id:'scare',img:'s2_scare',x:.70,y:.64,w:.12,z:3},{id:'corn',img:'s2_corn',x:.36,y:.70,w:.14,z:3,r:.09,alt:[{if:'corn',x:.86,y:.44,w:.10}]},{id:'pump',img:'s2_pumpkin',x:.93,y:.93,w:.10,z:3,r:.07,anim:'shake',calm:'pump',alt:[{if:'pump',x:.40,y:.58}]},
  {id:'scale',img:'s2_scale',x:.28,y:.88,w:.10,rot:.5,z:3,r:.08,alt:[{if:'scale',rot:0}]},{id:'rice',img:'s2_rice_torn',x:.72,y:.92,w:.10,z:3,r:.07,alt:[{if:'rice',img:'s2_rice',w:.08}]},
  {id:'hat',img:'s2_strawhat',x:.16,y:.94,w:.09,rot:.4,z:4,r:.07,alt:[{if:'hat',x:.70,y:.55,rot:0}]},{id:'hidC',img:'cici_back',x:.77,y:.70,w:.05,z:2,show:'!found'}],
 rules:[drag('corn',[.86,.44,.1],'!corn',set('corn')),use('dun','pump','!pump',['fly','dundun','tray','pump',.6,.2,.1],set('pump'),say('墩墩接住南瓜啦！','둥둥이 호박을 잡았어!',[.5,.4],1.3)),
  rot('scale',-.5,'!scale',null,set('scale')),Object.assign(hold('rice','!rice&!tw',set('tw'),['tone','nope'],say('米还在漏！先系紧绳子','쌀이 새! 끈부터 꽉 묶자','rice',1.5)),{lockq:1}),hold('rice','!rice&tw',set('rice')),
  drag('hat',[.70,.55,.1],'!hat',set('hat'),say('稻草人戴好帽子啦','허수아비가 모자를 썼어','scare',1.2)),tap('hidC','',set('found'),['found'],['mood','shock'],say('稻草人后面有一团小刺！','허수아비 뒤에 가시 뭉치가!','hidC',1.6))]}),
/* 31 first snow ------------------------------------------------------------------------------ */
stage({id:31,title:'第一场雪',ko:'첫눈',goal:'初雪合影',bg:'s2_w_snow',lili:[.50,.78,.17],hid:'cici_post',
 open:[say('下雪啦！一起堆雪人吧！','눈이 왔다! 같이 눈사람 만들자!','lili',2.2)],
 probs:[P('nose','雪人没有鼻子','눈사람은 코가 없고','雪人看不见路','코 없는 눈사람'),P('scarf','雪人没围巾','눈사람은 목도리가 없고','雪人冷得发抖','추운 눈사람'),P('ice','地上结了冰','바닥은 꽁꽁 얼었고','滑倒啦','미끄러졌어'),P('lump','屋顶积雪要掉下来','지붕 눈덩이는 떨어지려 하고','雪团砸下来','눈덩이가 쿵'),P('cat','小猫冻坏了','고양이는 꽁꽁 얼었고','小猫冷冰冰','차가운 고양이')],
 all:['雪人完成啦！','눈사람 완성!'],none:['冰天雪地乱糟糟','꽁꽁 언 엉망진창'],pair:['11000','雪人什么都没有','아무것도 없는 눈사람'],
 tools:[],
 objs:[{id:'man',img:'s2_w_snowman',x:.22,y:.64,w:.13,z:3,r:.08,alt:[{if:'nose&scarf',img:'s2_w_snowman_ok'}]},{id:'scarf',img:'s2_w_scarf',x:.70,y:.92,w:.10,z:3,r:.07,show:'!scarf'},
  {id:'ice',img:'s2_w_icefloor',x:.42,y:.90,w:.14,z:2,r:.08,show:'!ice'},{id:'sand',img:'s2_w_sand',x:.08,y:.90,w:.08,z:3,r:.06},
  {id:'lump',img:'s2_w_lump',x:.90,y:.13,w:.13,z:5,show:'!lump',r:.08},{id:'cat',img:'s2_w_cat',x:.80,y:.70,w:.10,z:3,r:.07,alt:[{if:'cat',img:'cat_dry'}]},{id:'hidC',img:'cici_post',x:.97,y:.44,w:.06,z:2,show:'!found'}],
 rules:[use('carrotT','man','!nose',set('nose'),say('有鼻子啦！','코가 생겼어!','man',1.2)),drag('scarf',[.22,.64,.1],'!scarf',set('scarf')),drag('sand',[.42,.90,.1],'!ice',set('ice'),say('撒点沙子就不滑了','모래를 뿌리니 안 미끄러워','ice',1.3)),
  Object.assign(swipe('lump','down','!lump&!tw',set('tw'),['tone','nope'],['wig','lump',.6],say('雪团冻住了！再推一下','눈덩이가 얼어붙었어! 한 번 더','lump',1.4)),{lockq:1}),swipe('lump','down','!lump&tw',['fx','drops','lump'],set('lump')),
  hold('cat','!cat',set('cat'),say('喵～暖和了','야옹~ 따뜻해','cat',1.2)),tap('hidC','',set('found'),['found'],['mood','shock'],say('窗边有个小身影！','창가에 작은 그림자가!','hidC',1.6))]}),
/* 32 laba porridge --------------------------------------------------------------------------- */
stage({id:32,title:'腊八暖暖',ko:'납팔죽 끓이기',goal:'腊八节合影',bg:'s2_w_dim',lili:[.46,.80,.17],hid:'cici_eyes',
 open:[say('腊八节要喝热粥！可是店里好冷……','납팔절엔 따뜻한 죽! 그런데 가게가 추워…','lili',2.2)],
 probs:[P('snow','雪吹进门里','눈이 문 안으로 들어왔고','门口变成雪地','문 앞이 눈밭'),P('lid','蒸笼盖飞走了','찜통 뚜껑은 날아갔고','包子凉了','만두가 식었어'),P('cat','小猫冻得发抖','고양이는 덜덜 떨고','小猫打喷嚏','고양이 재채기'),P('dump','包子滚到地上','만두는 바닥에 굴렀고','包子跑掉了','만두가 도망갔어'),P('tea','茶壶倒了','찻주전자는 쓰러졌고','茶水流一地','차가 줄줄')],
 all:['暖暖的腊八节','따뜻한 납팔절'],none:['冷冰冰的小店','썰렁한 가게'],pair:['10100','雪吹进来，小猫冻坏了','눈은 들어오고 고양이는 꽁꽁'],
 tools:[ZHUO],
 objs:[{id:'snow',img:'s2_w_icefloor',x:.56,y:.62,w:.16,z:2,r:.09,show:'!snow'},{id:'lid',img:'lid',x:.86,y:.90,w:.09,z:3,r:.07,alt:[{if:'lid',x:.71,y:.36,w:.08}]},
  {id:'cat',img:'s2_w_cat',x:.76,y:.72,w:.09,z:3,r:.07,alt:[{if:'cat',img:'cat_dry'}]},{id:'dump',img:'xiaolong',x:.28,y:.92,w:.08,z:3,r:.07,alt:[{if:'dump',x:.10,y:.50,w:.06}]},
  {id:'tea',img:'s2_teaset',x:.20,y:.70,w:.10,z:3,r:.07,alt:[{if:'tea',img:'tea',w:.06}]},{id:'hidC',img:'cici_eyes',x:.60,y:.40,w:.05,z:1,show:'!found'}],
 rules:[Object.assign(swipe('snow','left','!snow&!tw',set('tw'),['tone','nope'],say('风又把雪吹进来了！再扫一次','바람이 눈을 또 들였어! 한 번 더','snow',1.5)),{lockq:1}),swipe('snow','left','!snow&tw',set('snow')),
  use('zhuo','lid','!lid',['fly','zhuozhuo','tray','lid',.6,.2,.1],set('lid'),say('盖子盖回去啦','뚜껑을 다시 덮었어',[.6,.3],1.2)),use('hotT','cat','!cat',set('cat'),say('抱着热水袋好暖和','물주머니를 안으니 따뜻해','cat',1.3)),
  drag('dump',[.10,.50,.1],'!dump',set('dump')),tap('tea','!tea',set('tea')),tap('hidC','',set('found'),['found'],['mood','shock'],say('门外有一双小眼睛！','문밖에 작은 눈이!','hidC',1.6))]}),
/* 33 ice lanterns ---------------------------------------------------------------------------- */
stage({id:33,title:'冰灯之夜',ko:'얼음 등불 밤',goal:'冰灯节合影',bg:'s2_w_ice',lili:[.50,.80,.16],hid:'cici_back',
 open:[say('冰灯好漂亮！小心地滑哦','얼음 등 정말 예뻐! 미끄러우니 조심','lili',2.2)],
 probs:[P('icicle','冰柱要掉下来','고드름은 떨어지려 하고','冰柱叮叮当当','고드름이 딸랑딸랑'),P('star','星星装饰掉了','별 장식은 떨어졌고','星星落地','바닥에 떨어진 별'),P('scarf','冰兔子好冷','얼음 토끼는 추워 보이고','冰兔子在发抖','떠는 얼음 토끼'),P('ice','路面结冰','길은 꽁꽁 얼었고','大家都滑倒','모두 미끄러졌어'),P('mit','手套丢了一只','장갑 한 짝은 잃어버렸고','一只手冻红了','손 하나가 빨개졌어')],
 all:['冰灯亮晶晶','반짝반짝 얼음 등'],none:['冰灯节乱成一团','엉망진창 얼음 등 축제'],pair:['00110','兔子冷，路也滑','토끼는 춥고 길은 미끄러워'],
 tools:[],
 objs:[{id:'icicle',img:'s2_w_icicle',x:.30,y:.14,w:.12,z:5,show:'!icicle',r:.08,anim:'shake',calm:'icicle'},{id:'star',img:'s2_w_star',x:.72,y:.92,w:.07,z:3,r:.06,alt:[{if:'star',x:.56,y:.12}]},
  {id:'rab',img:'s2_w_icerab',x:.80,y:.68,w:.12,z:3},{id:'scarf',img:'s2_w_scarf',x:.18,y:.92,w:.09,z:4,r:.07,alt:[{if:'scarf',x:.80,y:.71,w:.07}]},
  {id:'ice',img:'s2_w_icefloor',x:.36,y:.62,w:.15,z:2,r:.09,show:'!ice'},{id:'sand',img:'s2_w_sand',x:.92,y:.93,w:.07,z:3,r:.06},
  {id:'mit',img:'s2_w_mitten',x:.10,y:.70,w:.07,z:3,r:.06,show:'!mit'},{id:'hidC',img:'cici_back',x:.97,y:.60,w:.05,z:2,show:'!found'}],
 rules:[Object.assign(tap('icicle','!icicle&!tw',set('tw'),['wig','icicle',.6],['tone','nope'],say('冻得太紧了，再敲一下','꽁꽁 얼었어, 한 번 더','icicle',1.4)),{lockq:1}),tap('icicle','!icicle&tw',['fx','spark','icicle'],set('icicle')),
  drag('star',[.56,.12,.1],'!star',set('star')),drag('scarf',[.80,.68,.1],'!scarf',set('scarf'),say('冰兔子也暖和了','얼음 토끼도 따뜻해졌어','rab',1.3)),
  drag('sand',[.36,.62,.1],'!ice',set('ice')),drag('mit',[.50,.80,.12],'!mit',set('mit'),say('手套找到了！','장갑 찾았다!','lili',1.2)),tap('hidC','',set('found'),['found'],['mood','shock'],say('冰雕后面有一团小刺！','얼음 조각 뒤에 가시 뭉치가!','hidC',1.6))]}),
/* 34 dundun's cold --------------------------------------------------------------------------- */
stage({id:34,title:'墩墩感冒了',ko:'둥둥 감기',goal:'探病合影',bg:'s2_w_room',lili:[.40,.80,.17],hid:'cici_eyes',
 open:[say('墩墩感冒了，我们来照顾他！','둥둥이 감기에 걸렸어, 우리가 돌봐 주자!','lili',2.2)],
 probs:[P('quilt','被子掉在地上','이불은 바닥에 떨어졌고','墩墩冷得发抖','덜덜 떠는 둥둥'),P('hot','没有热水袋','물주머니가 없고','手脚冰凉','손발이 차가워'),P('tea','姜茶放得太远','생강차는 너무 멀리 있고','喝不到姜茶','생강차를 못 마셔'),P('tis','纸巾不见了','휴지는 안 보이고','阿嚏阿嚏','에취 에취'),P('win','窗户被风吹开','창문은 바람에 열렸고','冷风呼呼','찬바람 쌩쌩')],
 all:['墩墩快好起来','둥둥아 얼른 나아'],none:['墩墩病得更重了','둥둥이 더 아파졌어'],pair:['11000','被子和热水袋都没有','이불도 물주머니도 없어'],
 tools:[],
 objs:[{id:'dun',img:'s2_w_dunsick',x:.82,y:.66,w:.20,z:2,r:.1,alt:[{if:'quilt&hot&tea&tis&win',img:'dundun',w:.12,y:.62}]},{id:'quilt',img:'s2_w_quilt',x:.58,y:.92,w:.13,z:3,r:.08,show:'!quilt'},
  {id:'hot',img:'s2_w_hotbag',x:.12,y:.90,w:.07,z:3,r:.06,show:'!hot'},{id:'tea',img:'s2_w_ginger',x:.24,y:.70,w:.07,z:3,r:.06,alt:[{if:'tea',x:.70,y:.53,w:.06}]},
  {id:'tis',img:'s2_w_tissue',x:.34,y:.92,w:.08,z:3,r:.06,alt:[{if:'tis',x:.94,y:.78,w:.06}]},{id:'win',img:'s2_w_window',x:.58,y:.30,w:.22,z:2,show:'!win',r:.1},{id:'hidC',img:'cici_eyes',x:.05,y:.62,w:.06,z:2,show:'!found'}],
 rules:[drag('quilt',[.82,.66,.12],'!quilt',set('quilt'),say('盖好被子','이불을 덮어 줬어','dun',1.2)),drag('hot',[.82,.66,.12],'!hot',set('hot')),drag('tea',[.70,.53,.1],'!tea',set('tea')),drag('tis',[.82,.66,.12],'!tis',set('tis'),say('阿嚏！谢谢','에취! 고마워','dun',1.2)),
  Object.assign(tap('win','!win&!tw',set('tw'),['wig','win',.7],['tone','nope'],say('风太大，窗户又开了！','바람이 세서 창문이 또 열렸어!','win',1.4)),{lockq:1}),tap('win','!win&tw',set('win')),tap('hidC','',set('found'),['found'],['mood','shock'],say('花盆边有一双小眼睛！','화분 옆에 작은 눈이!','hidC',1.6))]}),
/* 35 new year market ------------------------------------------------------------------------- */
stage({id:35,title:'年货大集',ko:'설맞이 장보기',goal:'年货合影',bg:'s2_w_market',lili:[.50,.80,.16],hid:'cici_ball',
 open:[say('快过年了！年货准备好了吗？','곧 설이야! 설 준비 다 됐어?','lili',2.2)],
 probs:[P('cpl','春联还没贴','춘련은 아직 안 붙였고','门上空空的','문이 허전해'),P('candy','糖罐打翻了','사탕 항아리는 쏟아졌고','糖果满地','사탕이 데굴데굴'),P('list','购物单飞走了','장보기 목록은 날아갔고','忘了买什么','뭘 사야 하지'),P('wheel','推车掉了轮子','수레는 바퀴가 빠졌고','推车推不动','수레가 안 움직여'),P('lan','灯笼掉在地上','등롱은 바닥에 떨어졌고','灯笼睡着了','잠든 등롱')],
 all:['新年快乐！','새해 복 많이 받아!'],none:['年货还没准备好','설 준비가 아직이야'],pair:['00110','糖撒了，车也坏了','사탕은 쏟아지고 수레는 고장'],
 tools:[ZHUO],
 objs:[{id:'cpl',img:'s2_w_couplet',x:.74,y:.92,w:.10,z:3,r:.07,alt:[{if:'cpl',x:.36,y:.44,w:.06}]},{id:'candy',img:'s2_w_candy',x:.22,y:.90,w:.10,z:3,r:.07,show:'!candy'},
  {id:'list',img:'s2_w_list',x:.60,y:.18,w:.07,z:5,anim:'bob',show:'!list',r:.07},{id:'cart',img:'s2_w_cart',x:.58,y:.66,w:.16,z:3,alt:[{if:'wheel',img:'s2_w_cart_ok'}]},
  {id:'wheel',img:'s2_w_wheel',x:.12,y:.68,w:.06,z:3,r:.06,show:'!wheel'},{id:'lan',img:'lantern',x:.40,y:.94,w:.07,rot:.7,z:3,r:.07,alt:[{if:'lan',rot:0}]},{id:'hidC',img:'cici_ball',x:.06,y:.84,w:.05,z:2,show:'!found'}],
 rules:[use('zhuo','cpl','!cpl',['fly','zhuozhuo','tray','cpl',.6,.2,.1],set('cpl'),say('春联贴好啦！','춘련을 붙였어!',[.4,.35],1.3)),hold('candy','!candy',set('candy'),say('糖果都捡回来了','사탕을 다 주웠어','candy',1.2)),
  swipe('list','down','!list',set('list'),say('购物单抓住啦','장보기 목록 잡았다','lili',1.2)),
  Object.assign(drag('wheel',[.58,.66,.1],'!wheel&!tw',set('tw'),['go','wheel',.12,.68,.4],['tone','nope'],say('轮子又滚走了！','바퀴가 또 굴러갔어!','wheel',1.3),['off','wheel']),{lockq:1}),drag('wheel',[.58,.66,.1],'!wheel&tw',set('wheel')),
  rot('lan',-.7,'!lan',null,set('lan')),tap('hidC','',set('found'),['found'],['mood','shock'],say('花盆边有个小刺球！','화분 옆에 가시 공이!','hidC',1.6))]}),
];

/* ---------- difficulty: stage 1 is the gentle one, then help shrinks and puzzles deepen ---------- */
const diff=id=>({hints:id===1?3:id<=5?2:1,idle:id===1?8:id<=5?15:id<=10?25:0,zones:id<=2,ring:id<=12,toolRing:id<=5,slack:id<=5?.03:id<=12?.015:0,rub:id<=5?150:id<=12?185:225});
const time=id=>id===1?150:id<=5?140:id<=10?130:id<=15?125:120;
let uid=0;
function need(s,t,flag){for(const q of s.rules)if(q.t===t&&!q.do.some(d=>d[0]==='found'))q.if=(q.if||'').split('|').map(a=>a?a+'&'+flag:flag).join('|');}
/* a friend stays locked until found in the scene */
function gate(s,tool,img,x,y,w,zh,ko){const flag='has_'+tool,id='peek_'+tool;s.tools.find(t=>t.id===tool).have=flag;s.objs.push({id,img,x,y,w,z:2,show:'!'+flag,r:Math.max(.06,w*.7)});s.rules.push(tap(id,'',set(flag),['tone','good'],say(zh,ko,[x,Math.max(.2,y)])));}
/* an object starts hidden under another one */
function under(s,t,img,dir,w,zh,ko){const o=s.objs.find(q=>q.id===t),flag='open_'+t,id='cover_'+t;o.show=o.show?o.show+'&'+flag:flag;const dx={left:-.11,right:.11}[dir]||0,dy={up:-.1,down:.1}[dir]||0;s.objs.push({id,img,x:o.x,y:o.y,w,z:(o.z||3)+1,r:w*.7,alt:[{if:flag,x:o.x+dx,y:o.y+dy}]});s.rules.push(swipe(id,dir,'!'+flag,set(flag),say(zh,ko,[o.x,Math.max(.25,o.y-.04)],1.4)));}
function decoy(s,img,x,y,w,zh,ko){if(s.dec)return;s.dec=1;const id='decoy'+(++uid);s.objs.push({id,img,x,y,w,z:2,r:Math.max(.05,w*.65)});s.rules.push(tap(id,'',['wig',id,.5],say(zh,ko,[x,Math.max(.22,y)],1.4)));}
/* an object you pick up: it flies to the shelf and becomes a tool */
function pick(s,tool,img,x,y,w,zh,ko,miss){const flag='got_'+tool,id='item_'+tool;let t=s.tools.find(q=>q.id===tool);if(!t){t={id:tool,img,miss};s.tools.push(t);}t.have=flag;s.objs.push({id,img,x,y,w,z:3,show:'!'+flag,r:Math.max(.06,w*.75)});s.rules.push(tap(id,'',['fly',img,[x,y],'tray',.4,.05,.09],set(flag),['tone','good'],say(zh,ko,[.5,.86],1.5)));}
const at=n=>ST[n-1];
pick(at(21),'fanT','s2_fan',.94,.48,.06,'捡到一把扇子！','부채를 주웠어!',['这里不用扇','여긴 부채질 안 해도 돼']);{const s=at(21);s.rules.push(use('fanT','dun','!dun',set('dun'),say('凉快！我醒啦','시원해! 깼어','dun',1.3)));}
gate(at(22),'shan','shanshan',.70,.46,.06,'闪闪在亭子里打瞌睡','반짝이 정자에서 졸고 있었네');under(at(22),'slip','cov_basket','left',.10,'拖鞋在篮子下面！','슬리퍼가 바구니 밑에!');decoy(at(22),'lantern',.88,.62,.05,'这盏灯不用管','이 등은 그냥 둬');
gate(at(23),'zhuo','zhuozhuo',.95,.55,.06,'啄啄在邮筒边送信','쫑쫑이 우체통 옆에서 편지를 나르고 있었네');decoy(at(23),'hat',.55,.66,.05,'谁的草帽？','누구 밀짚모자지?');
decoy(at(24),'tea',.12,.52,.05,'这杯是客人的','이건 손님 거야');
gate(at(26),'shan','shanshan',.12,.52,.06,'闪闪在屋檐下赏月','반짝이 처마 밑에서 달을 보고 있었네');decoy(at(26),'s2_rab_on',.06,.40,.05,'这盏灯已经亮了','이 등은 벌써 켜졌어');
gate(at(27),'zhuo','zhuozhuo',.96,.62,.06,'啄啄在墙角捡叶子','쫑쫑이 담 모퉁이에서 낙엽을 줍고 있었네');
pick(at(28),'poleT','s2_pole',.06,.62,.06,'找到一根长竹竿！','긴 장대를 찾았어!',['竹竿够不到这里','장대가 여기엔 안 닿아']);decoy(at(28),'s2_squirrel',.90,.70,.06,'松鼠在吃橡果','다람쥐가 도토리를 먹는 중');
gate(at(29),'peng','pengpeng',.12,.33,.06,'砰砰在长椅上准备彩纸','펑펑이 벤치에서 색종이를 준비하고 있었네');under(at(29),'baton','cov_basket','left',.10,'接力棒在篮子下面！','바통이 바구니 밑에!');
gate(at(30),'dun','dundun',.05,.95,.06,'墩墩在花盆后面','둥둥이 화분 뒤에 있었네');decoy(at(30),'s2_pumpkin',.97,.50,.05,'这是摊位上的南瓜','이건 가게 호박이야');
pick(at(31),'carrotT','s2_w_carrot',.06,.62,.06,'找到一根胡萝卜！','당근을 찾았어!',['胡萝卜要给雪人','당근은 눈사람 코야']);decoy(at(31),'s2_w_mitten',.62,.62,.05,'谁的手套？先放着','누구 장갑이지? 그냥 두자');
gate(at(32),'zhuo','zhuozhuo',.44,.10,.05,'啄啄挂在钩子上取暖','쫑쫑이 고리에 매달려 있었네');pick(at(32),'hotT','s2_w_hotbag',.94,.70,.06,'找到热水袋！','물주머니를 찾았어!',['这里不冷','여긴 안 추워']);
decoy(at(33),'s2_w_icicle',.90,.30,.05,'这根冰柱很结实','이 고드름은 튼튼해');
decoy(at(34),'s2_w_star',.92,.40,.05,'这是墩墩的装饰','둥둥의 장식이야');
gate(at(35),'zhuo','zhuozhuo',.94,.30,.05,'啄啄在摊位上数糖葫芦','쫑쫑이 가게에서 탕후루를 세고 있었네');
gate(at(25),'dun','dundun',.92,.27,.06,'墩墩在柳树下乘凉','둥둥이 버드나무 아래서 쉬고 있었네');gate(at(25),'didi','didi',.06,.37,.05,'滴滴在绣球花里','방울이가 수국 사이에 있었네');
decoy(at(2),'tea',.10,.545,.06,'茶还热着呢','차가 아직 따뜻해');
decoy(at(3),'tissue',.11,.60,.07,'这不是垃圾','이건 쓰레기가 아니야');
gate(at(4),'shan','shanshan',.10,.45,.07,'闪闪躲在架子上！','반짝이 선반에 숨어 있었네!');
gate(at(6),'dun','dundun',.93,.34,.07,'墩墩在树后面玩！','둥둥이 나무 뒤에서 놀고 있었네!');decoy(at(6),'pail',.10,.60,.06,'这个小桶是别人的','이 양동이는 다른 사람 거야');
gate(at(7),'zhuo','zhuozhuo',.10,.60,.07,'啄啄在树丛里找信','쫑쫑이 덤불에서 편지를 찾고 있었네');decoy(at(7),'kite',.68,.20,.06,'这只风筝不用管','이 연은 그냥 둬');
gate(at(8),'didi','didi',.94,.60,.06,'滴滴在花丛里乘凉','방울이가 꽃덤불에서 쉬고 있었네');decoy(at(8),'shell',.60,.52,.05,'这是装饰品','이건 장식품이야');
gate(at(9),'dun','dundun',.72,.29,.06,'墩墩在亭子里躲风','둥둥이 정자에서 바람을 피하고 있었네');decoy(at(9),'paper',.20,.66,.05,'风吹来的纸团','바람에 날아온 종이뭉치');decoy(at(9),'hat',.92,.68,.06,'谁的帽子？','누구 모자지?');
under(at(10),'cand','cov_bundle','right',.10,'蜡烛藏在靠垫下','초가 쿠션 밑에 있었어');
decoy(at(11),'hat',.88,.30,.05,'小熊的帽子','곰돌이 모자');
{const s=at(12);s.objs.push({id:'lid',img:'lid',x:.80,y:.42,w:.15,z:5,r:.08,show:'!open'});s.rules.push(swipe('lid','up','!open',set('open'),['fx','steam','lid']));for(const t of ['har','siu','cha','eg'])need(s,t,'open');gate(s,'tuan','tt_cheer',.92,.70,.08,'团团在柜台后面！','탄탄이 카운터 뒤에 있었네!');}
gate(at(13),'shan','shanshan',.94,.25,.06,'闪闪在书架上看书','반짝이 책장에서 책을 읽고 있었네');decoy(at(13),'envelope',.86,.60,.05,'这是旧信封，空的','이건 빈 봉투야');decoy(at(13),'tissue',.14,.82,.06,'不是这个','이건 아니야');
{const s=at(14);s.tools[0].have='awake';s.rules.push(tap('zh','!awake',set('awake'),say('我醒啦，要我帮忙吗？','깼어, 도와줄까?','zh')));}under(at(14),'haw','cov_barrel','left',.09,'糖葫芦在这里！','탕후루가 여기 있네!');decoy(at(14),'lantern',.08,.82,.07,'这是别家的灯','이건 다른 집 등이야');
under(at(15),'shoe','cov_basket','left',.10,'鞋子躲在靠垫下','신발이 쿠션 밑에 있었어');decoy(at(15),'hat',.88,.62,.06,'帽子湿透了','모자가 흠뻑 젖었어');decoy(at(15),'paper',.34,.74,.05,'纸团软软的','종이뭉치가 흐물흐물해');
gate(at(16),'peng','pengpeng',.92,.46,.07,'砰砰躲在梯子后！','펑펑이 사다리 뒤에 있었네!');gate(at(16),'didi','didi',.06,.62,.06,'滴滴在树丛里','방울이가 덤불에 있었네');under(at(16),'gift','cov_box','right',.1,'礼物藏好啦','선물이 숨어 있었네');
gate(at(17),'shan','shanshan',.34,.70,.07,'闪闪也怕黑呢','반짝도 어둠이 무서웠구나');decoy(at(17),'hat',.86,.66,.05,'摊主的帽子','주인 아저씨 모자');decoy(at(17),'paper',.48,.88,.05,'看不清是什么','뭔지 안 보여');
under(at(18),'muffs','cov_box','right',.10,'耳罩找到了！','귀마개를 찾았어!');under(at(18),'jar','cov_basket','left',.09,'玻璃瓶在这里','유리병이 여기 있네');decoy(at(18),'hat',.14,.46,.06,'这不是乐器','이건 악기가 아니야');
gate(at(19),'zhuo','zhuozhuo',.70,.09,.06,'啄啄在树上休息','쫑쫑이 나무에서 쉬고 있었네');gate(at(19),'peng','pengpeng',.07,.62,.07,'砰砰在台子后面','펑펑이 무대 뒤에 있었네');under(at(19),'lion','blanket','left',.15,'舞狮藏在被子下！','사자가 이불 밑에 숨었네!');decoy(at(19),'paper',.60,.60,.05,'纸团不用管','종이뭉치는 그냥 둬');
under(at(20),'shan','cov_mat','right',.11,'闪闪在这里！','반짝이 여기 있네!');under(at(20),'didi','cov_bundle','left',.11,'滴滴藏在布包后面','방울이가 보따리 뒤에 숨어 있었네');
/* the little story a 5/5 photo unlocks */
const AFTER=[['那天的全家福，被团团挂在了店门口。','그날의 가족사진은 탄탄 가게 문 앞에 걸렸어요.'],['开张第一笼，三分钟就卖光啦。','첫 찜통은 3분 만에 다 팔렸어요.'],['墩墩答应，以后只在院子里玩球。','둥둥은 이제 마당에서만 공놀이하기로 했어요.'],['闪闪发现，阁楼的月亮最好看。','반짝은 다락에서 보는 달이 제일 예쁘다는 걸 알았어요.'],['狮子跳得太开心，把鞋都甩掉了。','사자는 너무 신나서 신발까지 벗겨졌어요.'],['海鸥后来成了点心店的常客。','갈매기는 나중에 딤섬 가게 단골이 됐어요.'],['那封信，是写给全镇的新年问候。','그 편지는 온 동네에 보내는 새해 인사였어요.'],['花店送给每家一朵小红花。','꽃가게는 집집마다 작은 꽃을 선물했어요.'],['风停了，气球还舍不得下来。','바람이 멎어도 풍선은 내려오기 싫어했어요.'],['团团吹蜡烛时，偷偷许了个愿。','탄탄은 초를 불며 몰래 소원을 빌었어요.'],['滴滴病好了，第一件事是去踩水。','방울이는 낫자마자 물웅덩이부터 밟으러 갔어요.'],['小猫学会了，闻到香味就排队。','고양이는 냄새가 나면 줄을 서게 됐어요.'],['第六封信写着：谢谢你来找我们。','여섯 번째 편지에는 찾아 줘서 고맙다고 적혀 있었어요.'],['评委说：这张照片，连灯笼都在笑。','심사위원은 등롱까지 웃는 사진이라고 했어요.'],['雨停后，天边出现了一道彩虹。','비가 그치자 하늘에 무지개가 떴어요.'],['朋友们约好，明年还一起来帮忙。','친구들은 내년에도 함께 돕기로 약속했어요.'],['夜市的灯，一直亮到了天亮。','야시장의 불빛은 날이 밝을 때까지 빛났어요.'],['墩墩戴着耳罩，也跟着节奏点头。','둥둥은 귀마개를 쓰고도 박자에 맞춰 고개를 끄덕였어요.'],['这一天，小镇的笑声传得好远。','그날 동네의 웃음소리는 아주 멀리까지 퍼졌어요.'],['照片挂上墙，小镇的故事还在继续。','사진이 벽에 걸리고, 동네 이야기는 계속돼요.'],['西瓜皮后面，藏着一排害羞的小刺。','수박 껍질 뒤에 수줍은 가시가 숨어 있었어요.'],['草丛里的小眼睛，一整晚都在偷看。','풀숲의 작은 눈이 밤새 몰래 보고 있었어요.'],['被子上的小刺，像一句悄悄的谢谢。','이불에 꽂힌 가시는 조용한 고맙다는 인사 같았어요.'],['冰箱旁多了一只吃了一半的小碗。','아이스박스 옆에 반쯤 먹은 작은 그릇이 남았어요.'],['水面上第一次映出了刺刺的笑脸。','물 위에 처음으로 콕콕이의 웃는 얼굴이 비쳤어요.'],['月饼盒后面，留着一块小小的月饼。','월병 상자 뒤에 작은 월병 하나를 남겨 두었어요.'],['叶子堆旁边，放着一顶叶子帽。','낙엽 더미 옆에 낙엽 모자를 놓아두었어요.'],['一颗柿子，从树后面滚了过来。','감 하나가 나무 뒤에서 굴러왔어요.'],['球筐里的“小刺球”，偷偷看完了比赛。','공 바구니 속 가시 공이 몰래 경기를 다 봤어요.'],['稻草人的帽子下，第一次传来一声谢谢。','허수아비 모자 밑에서 처음으로 고맙다는 말이 들렸어요.'],['雪地上的小脚印，停在雪人身后。','눈 위의 작은 발자국이 눈사람 뒤에서 멈췄어요.'],['窗外的小客人，下次一定请进来。','창밖의 작은 손님, 다음엔 꼭 안으로 초대할 거예요.'],['冰兔子戴上了红围巾。','얼음 토끼가 빨간 목도리를 둘렀어요.'],['床头的姜茶，是一份悄悄的关心。','머리맡의 생강차는 조용한 마음이었어요.'],['刺刺第一次说出了“新年快乐”。','콕콕이가 처음으로 "새해 복 많이 받아"라고 말했어요.']];
/* 5/5 story: three lines per stage, and one running mystery of the little footprints */
const C_='刺刺',L_='栗栗',T_='团团',D_='滴滴',N_='墩墩',Z_='啄啄',X_='闪闪',P_='砰砰',M_='小猫';
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
[[L_,'盒子里全是我们的照片！','상자에 우리 사진이 가득해!'],[T_,'原来它一直在帮我们收藏回忆。','계속 우리 추억을 모아 주고 있었구나.'],[M_,'喵～全镇合影，算我一个！','야옹~ 동네 사진, 나도 끼워 줘!']],
[[N_,'夏天就要吃西瓜！','여름엔 역시 수박이지!'],[L_,'西瓜皮后面……有一排小刺？','수박 껍질 뒤에… 작은 가시가 줄줄이?'],[N_,'是新搬来的邻居吧？','새로 이사 온 이웃인가 봐?']],
[[X_,'萤火虫好亮呀！','반딧불이 정말 밝다!'],[L_,'草丛里还有两颗星星在眨眼。','풀숲에서도 별 두 개가 깜박여.'],[Z_,'那不是星星，是一双眼睛！','별이 아니라 눈이야!']],
[[Z_,'被子晒得香喷喷！','이불이 보송보송해!'],[L_,'咦，被子上扎着一根小刺。','어, 이불에 작은 가시가 하나 꽂혀 있어.'],[L_,'是它帮我们追被子的吗？','그 친구가 이불 쫓는 걸 도와준 걸까?']],
[[D_,'冰沙好凉快！','빙수 정말 시원해!'],[N_,'冰箱旁边的小碗是谁吃的？','아이스박스 옆 작은 그릇은 누가 먹었지?'],[L_,'下次给它留一碗大的！','다음엔 큰 그릇으로 남겨 두자!']],
[[N_,'划船真好玩！','뱃놀이 정말 재밌다!'],[L_,'水里的倒影……多了一个小家伙！','물에 비친 모습에… 작은 친구가 하나 더 있어!'],[C_,'（小声）我……我也想坐船。','(작은 목소리로) 나… 나도 배 타고 싶어.']],
[[L_,'月亮出来了，好圆呀！','달이 나왔어, 정말 둥글다!'],[N_,'月饼盒后面……是不是有小刺？','월병 상자 뒤에… 작은 가시가?'],[X_,'给它也留一块月饼吧。','그 친구 몫도 하나 남겨 두자.']],
[[L_,'我用叶子编了一顶小帽子。','낙엽으로 작은 모자를 엮었어.'],[D_,'放在叶子堆旁边吧！','낙엽 더미 옆에 두자!'],[L_,'戴上帽子，刺就不扎人啦。','모자를 쓰면 가시가 안 찔려.']],
[[L_,'满满一篮红柿子！','바구니 가득 빨간 감!'],[Z_,'有一个柿子自己滚过来了？','감 하나가 혼자 굴러왔어?'],[L_,'树后面，叶子帽子在笑呢。','나무 뒤에서 낙엽 모자가 웃고 있어.']],
[[N_,'我拿到第一名！','내가 일등이야!'],[D_,'球筐里有个球在发抖……','공 바구니 속 공 하나가 떨고 있어…'],[L_,'下次一起跑吧，好吗？','다음엔 같이 달리자, 응?']],
[[L_,'稻草人的帽子戴好啦。','허수아비 모자를 씌웠어.'],[N_,'帽子底下怎么有刺刺的？','모자 밑에 왜 가시가 삐죽?'],[C_,'（小声）谢、谢谢你们的帽子。','(작은 목소리로) 모, 모자 고마워.']],
[[L_,'第一场雪！雪人堆好啦！','첫눈! 눈사람 완성!'],[N_,'雪地上有一串小脚印……','눈 위에 작은 발자국이 줄줄이…'],[L_,'脚印一直走到雪人后面。','발자국이 눈사람 뒤까지 이어져.']],
[[D_,'腊八粥热乎乎的！','납팔죽이 따끈따끈해!'],[Z_,'窗外有人在看我们！','창밖에서 누가 보고 있어!'],[L_,'下次一定请它进来一起喝。','다음엔 꼭 들어와서 같이 먹자고 해야지.']],
[[X_,'冰兔子看起来好冷呀。','얼음 토끼가 추워 보여.'],[D_,'把红围巾给它戴上吧！','빨간 목도리를 둘러 주자!'],[L_,'冰雕后面，叶子帽在偷偷笑。','얼음 조각 뒤에서 낙엽 모자가 웃고 있어.']],
[[N_,'阿嚏！好冷……','에취! 추워…'],[L_,'床头怎么多了一杯姜茶？','머리맡에 생강차가 언제 생겼지?'],[N_,'旁边还有一根小刺呢。','옆에 작은 가시도 하나 있어.']],
[[Z_,'春联贴好啦！','춘련 다 붙였어!'],[L_,'推车的轮子是谁找回来的？','수레 바퀴는 누가 찾아 왔을까?'],[C_,'（小声）是、是我……新年快乐！','(작은 목소리로) 나, 나야… 새해 복 많이 받아!']]];
ST.forEach((s,i)=>{s.after=AFTER[i];s.story=STORY[i];const a='end_'+String(i+1).padStart(2,'0');if(require('fs').existsSync(require('path').join(__dirname,'../art',a+'.webp')))s.endArt=a;});
/* side missions: stage 1-5 have 3, 6-12 have 4, 13-20 have 5, so a stage has 8 to 10 problems.
   f find · u find under a cover · g bring to Lili · h hold to blow up · b pick a tool, use it on a mess */
const NAME={hargow:['虾饺','새우만두'],siumai:['烧卖','샤오마이'],charsiu:['叉烧包','차슈바오'],xiaolong:['小笼包','샤오롱바오'],eggtart:['蛋挞','에그타르트'],sesame:['芝麻球','깨찰볼'],tea:['热茶','따뜻한 차'],shell:['贝壳','조개껍데기'],hat:['小帽子','작은 모자'],envelope:['小信封','작은 편지'],gift:['小礼物','작은 선물'],candle2:['小蜡烛','작은 초'],panda:['熊猫玩偶','판다 인형'],shoe:['小鞋子','작은 신발'],clock:['小闹钟','작은 시계'],jar:['玻璃瓶','유리병'],hawthorn:['糖葫芦','탕후루'],kite:['小风筝','작은 연'],sdragon:['糖画','설탕 그림'],tissue:['纸巾','휴지'],lantern:['小灯笼','작은 등롱'],plantern:['小花灯','작은 꽃등'],muffs:['耳罩','귀마개'],lunch:['点心盒','간식 상자'],thermo:['温度计','온도계'],flashlight:['小手电','작은 손전등'],find_pouch:['福袋','복주머니'],find_bell:['小铃铛','작은 방울'],find_orange:['小橘子','작은 귤'],find_yarn:['红线团','빨간 실타래'],find_dragonfly:['竹蜻蜓','대나무 잠자리'],find_top:['小陀螺','작은 팽이']};
const PAIR={broom2:['paper','扫把','빗자루','纸团扫干净了','종이뭉치를 쓸었어'],duster:['web','掸子','먼지떨이','蜘蛛网没有了','거미줄이 사라졌어'],hanky:['puddle','手帕','손수건','小水洼擦干了','작은 물웅덩이를 닦았어']};
function spots(s){const a=[[s.lili[0],s.lili[1],.13]];for(const o of s.objs){a.push([o.x,o.y,o.r||Math.max(.06,(o.w||.1)*.6)]);for(const q of o.alt||[])a.push([q.x??o.x,q.y??o.y,.07]);}for(const r of s.rules)if(r.to)a.push([r.to[0],r.to[1],.07]);return a;}
/* where loose things can sit in each picture: floors first, never walls or sky */
/* hand-picked resting places per picture: shelves, tables, benches and open floor */
const SPOT={spring_bg:[[.07,.47],[.2,.68],[.78,.67],[.12,.78],[.3,.92],[.62,.93],[.86,.8],[.93,.72],[.42,.68]],
l1_bg2:[[.09,.34],[.11,.545],[.93,.49],[.25,.81],[.5,.94],[.92,.8],[.8,.93],[.1,.72],[.6,.68]],
l3_bg:[[.67,.44],[.05,.53],[.33,.63],[.6,.86],[.35,.8],[.08,.72],[.93,.85],[.08,.91],[.5,.93]],
l6_bg:[[.1,.2],[.09,.33],[.48,.525],[.85,.46],[.93,.54],[.1,.84],[.3,.8],[.7,.8],[.9,.85],[.55,.93]],
l10_bg:[[.52,.76],[.3,.72],[.62,.72],[.45,.66],[.4,.93],[.58,.84],[.7,.92],[.2,.92]],
l8_bg:[[.3,.56],[.12,.7],[.32,.72],[.85,.64],[.7,.78],[.9,.82],[.35,.92],[.6,.92],[.08,.9],[.93,.93]],
post_bg:[[.52,.6],[.12,.72],[.3,.7],[.72,.72],[.9,.74],[.1,.9],[.35,.92],[.6,.92],[.88,.92]],
flower_bg:[[.3,.45],[.55,.45],[.1,.72],[.3,.7],[.7,.7],[.9,.72],[.5,.93],[.08,.62]],
hill_bg:[[.72,.53],[.2,.61],[.6,.62],[.1,.72],[.35,.72],[.7,.74],[.9,.7],[.5,.9],[.2,.88],[.82,.88]],
l2_bg:[[.07,.61],[.92,.37],[.87,.61],[.07,.82],[.38,.89],[.4,.82],[.76,.93],[.93,.92]],
lib_bg:[[.72,.46],[.25,.61],[.53,.61],[.1,.72],[.35,.73],[.6,.72],[.88,.7],[.12,.9],[.4,.91],[.65,.92],[.9,.9]],
l9_bg:[[.22,.71],[.1,.76],[.8,.72],[.5,.7],[.62,.82],[.42,.9],[.66,.93],[.58,.72],[.5,.92],[.72,.72],[.3,.78]],
l5_bg:[[.33,.61],[.29,.66],[.5,.66],[.12,.78],[.62,.78],[.75,.8],[.1,.92],[.5,.8],[.7,.93],[.93,.74],[.28,.76],[.5,.93]],
l7_bg:[[.40,.49],[.56,.49],[.1,.66],[.08,.88],[.3,.9],[.7,.9],[.92,.88],[.86,.76],[.93,.72],[.5,.93],[.2,.78],[.5,.84]],
stage_bg:[[.3,.44],[.5,.44],[.7,.44],[.1,.7],[.35,.66],[.62,.66],[.9,.7],[.1,.9],[.35,.9],[.6,.92],[.9,.92]],
s2_hill_sum:[[.08,.62],[.25,.60],[.55,.58],[.92,.62],[.12,.74],[.36,.62],[.66,.76],[.88,.72],[.30,.90],[.62,.80],[.20,.86]],
s2_hill_night:[[.08,.62],[.25,.56],[.55,.58],[.92,.70],[.12,.74],[.36,.62],[.66,.76],[.88,.80],[.22,.80],[.70,.90],[.50,.92]],
s2_post_sum:[[.08,.60],[.30,.62],[.55,.60],[.92,.70],[.10,.74],[.34,.92],[.55,.78],[.86,.76],[.24,.80],[.50,.92],[.80,.94]],
s2_ice:[[.05,.50],[.40,.62],[.60,.64],[.94,.78],[.10,.72],[.30,.74],[.62,.78],[.20,.93],[.50,.93],[.74,.94]],
s2_pond:[[.20,.56],[.40,.54],[.62,.56],[.80,.56],[.10,.66],[.32,.70],[.66,.68],[.92,.74],[.36,.92],[.62,.92],[.24,.82]],
s2_moon:[[.08,.58],[.30,.58],[.60,.58],[.84,.70],[.10,.84],[.44,.60],[.80,.84],[.92,.94],[.20,.94],[.50,.94]],
s2_court_aut:[[.08,.72],[.34,.62],[.70,.62],[.92,.76],[.10,.92],[.42,.72],[.56,.92],[.84,.92],[.36,.94],[.60,.72]],
s2_hill_aut:[[.08,.62],[.25,.60],[.55,.58],[.12,.74],[.36,.62],[.66,.76],[.88,.74],[.40,.92],[.78,.92],[.64,.66]],
s2_field:[[.08,.50],[.30,.50],[.55,.50],[.92,.50],[.10,.70],[.40,.60],[.64,.72],[.92,.72],[.30,.92],[.44,.92],[.92,.94]],
s2_market_aut:[[.36,.56],[.60,.56],[.20,.72],[.56,.66],[.46,.94],[.86,.94],[.18,.84],[.62,.80],[.40,.82],[.30,.62]],
s2_w_snow:[[.10,.70],[.34,.70],[.62,.74],[.92,.72],[.30,.80],[.62,.86],[.86,.86],[.14,.80],[.50,.94],[.92,.94]],
s2_w_dim:[[.06,.60],[.34,.66],[.88,.70],[.12,.80],[.30,.80],[.66,.80],[.80,.80],[.50,.94],[.66,.94],[.12,.94]],
s2_w_ice:[[.24,.70],[.62,.72],[.30,.80],[.66,.82],[.36,.92],[.56,.92],[.20,.80],[.70,.76],[.48,.60],[.60,.60]],
s2_w_room:[[.14,.80],[.46,.72],[.62,.72],[.24,.92],[.48,.92],[.72,.90],[.92,.92],[.62,.82],[.30,.80],[.86,.82]],
s2_w_market:[[.30,.60],[.44,.60],[.70,.62],[.24,.74],[.40,.72],[.80,.74],[.30,.82],[.62,.82],[.52,.94],[.86,.88]],
hall_bg:[[.08,.66],[.92,.66],[.25,.7],[.75,.7],[.15,.88],[.4,.9],[.65,.9],[.06,.8]]};
const TABLE={s2_ice:[.25,.56],l1_bg2:[.11,.545],l3_bg:[.67,.44],l6_bg:[.48,.525],flower_bg:[.42,.455],lib_bg:[.72,.46],l5_bg:[.33,.61],l7_bg:[.40,.49]};
function free(s,seed,ground){const a=spots(s);let best=null,bs=-9;for(const q of SPOT[s.bg].filter(q=>!ground||q[1]>=.66)){let d=9;for(const p of a)d=Math.min(d,Math.hypot(q[0]-p[0],q[1]-p[1])-p[2]);const j=Math.abs(Math.sin(q[0]*91+q[1]*37+seed*13))*.012;if(d+j>bs){bs=d+j;best=q;}}return best.slice();}
function side(s,list){const hard=s.id>=13?.058:s.id>=6?.065:.075,n0=s.rules.length;s.extra=[];list.forEach((e,i)=>{const id='x'+(i+1),k=e[0];let img=e[1],arg=e[2],[x,y]=free(s,s.id+i);if(k==='g'&&img==='tea'){const t=TABLE[s.bg];if(t&&spots(s).every(p=>Math.hypot(t[0]-p[0],t[1]-p[1])>p[2]+.02))[x,y]=t;else img='lunch';}const nm=NAME[img]||['',''];s.extra.push({id});
  if(k==='f'||k==='u'){s.objs.push({id,img,x,y,w:hard,z:2,show:'!'+id,r:Math.max(.05,hard*.8)});s.rules.push(tap(id,'',['fly',img,[x,y],'tray',.35,.05,.05],set(id),say('找到'+nm[0]+'啦！',nm[1]+' 찾았다!',[x,Math.max(.25,y)],1.2)));if(k==='u')under(s,id,arg,x<.5?'right':'left',.1,'下面有东西！','밑에 뭔가 있어!');}
  else if(k==='g'){s.objs.push({id,img,x,y,w:hard+.015,z:3,show:'!'+id,r:.065});s.rules.push(drag(id,[s.lili[0],s.lili[1],.11],'!'+id,set(id),say('谢谢！这个'+nm[0]+'正好！','고마워! '+nm[1]+' 딱 좋아!','lili',1.3)));}
  else if(k==='h'){s.objs.push({id,img:'balloon_d',x,y,w:.08,z:3,r:.07,alt:[{if:id,img:'balloon',w:.09,y:y-.14}]});s.rules.push(hold(id,'!'+id,set(id)));}
  else if(k==='b'){const [mess,tz,tk,dz,dk]=PAIR[img],t='t'+id,got='got_'+id;s.tools.push({id:t,img,have:got,miss:['这里用不上'+tz,'여긴 '+tk+'가 필요 없어']});s.objs.push({id:'p'+id,img,x,y,w:.08,z:3,show:'!'+got,r:.065});s.rules.push(tap('p'+id,'',['fly',img,[x,y],'tray',.35,.05,.08],set(got),['tone','good'],say('捡到'+tz+'！',tk+' 주웠다!',[.5,.86],1.2)));const [mx,my]=mess==='web'?[.92,.13]:free(s,s.id+i+40,true);s.objs.push({id,img:mess,x:mx,y:my,w:mess==='puddle'?.13:.09,z:2,show:'!'+id,r:.075});s.rules.push(use(t,id,'!'+id,set(id),say(dz,dk,[mx,Math.max(.25,my)],1.2)));}});
 for(const r of s.rules.slice(n0))r.x=1;}
const SIDE=[[['f','find_orange'],['f','sesame'],['g','tea']],[['f','hargow'],['g','lunch'],['f','xiaolong']],[['f','find_top'],['g','tea'],['u','panda','cov_basket']],[['f','find_yarn'],['g','find_bell'],['u','find_pouch','cov_box']],[['f','find_dragonfly'],['h'],['g','sdragon']],
[['f','find_orange'],['g','lunch'],['u','hargow','cov_basket'],['h']],[['f','find_pouch'],['u','find_bell','cov_box'],['g','find_orange'],['b','broom2']],[['f','find_bell'],['g','tea'],['u','find_dragonfly','cov_basket'],['b','hanky']],[['f','find_dragonfly'],['g','find_orange'],['u','find_top','cov_barrel'],['b','broom2']],[['f','find_bell'],['g','gift'],['u','find_pouch','cov_bundle'],['h']],
[['f','find_yarn'],['g','find_orange'],['u','find_top','cov_box'],['b','hanky']],[['f','xiaolong'],['g','tea'],['u','find_bell','cov_steamer'],['b','broom2']],
[['f','find_bell'],['g','tea'],['u','find_dragonfly','cov_box'],['u','find_yarn','cov_bundle'],['b','duster']],[['f','find_top'],['g','sdragon'],['u','find_orange','cov_barrel'],['h'],['b','broom2']],[['f','find_pouch'],['g','find_orange'],['u','lantern','cov_barrel'],['u','find_bell','cov_basket'],['b','hanky']],[['f','find_dragonfly'],['g','tea'],['u','find_top','cov_box'],['u','find_yarn','cov_basket'],['h']],[['f','find_bell'],['g','find_orange'],['u','find_pouch','cov_basket'],['u','find_top','cov_barrel'],['b','broom2']],[['f','find_dragonfly'],['g','find_orange'],['u','find_yarn','cov_box'],['u','find_bell','cov_bundle'],['h']],[['f','find_orange'],['g','hawthorn'],['u','find_pouch','cov_barrel'],['u','find_top','cov_basket'],['h']],[['f','find_pouch'],['g','find_orange'],['u','find_bell','cov_bundle'],['u','find_top','cov_box'],['h']]];
/* bag items, stages 2-5 */
{const s=at(2);need(s,'shutter','handle');s.rules.push(tap('shutter','!handle',['wig','shutter',.5],['tone','nope'],say('门卡住了，少个把手','문이 걸렸어, 손잡이가 없네','shutter',1.5)));pick(s,'knobT','knob',.16,.74,.06,'捡到一个门把手！','문 손잡이를 주웠어!',['这里用不上把手','여긴 손잡이가 필요 없어']);s.rules.push(use('knobT','shutter','!handle&!shutter',set('handle'),['tone','good'],say('装好了，往上推推看','달았어, 위로 밀어 봐','shutter',1.5)));}
{const s=at(3);s.rules=s.rules.filter(q=>!(q.t==='rug'&&q.on==='swipe'));pick(s,'dusterT','duster',.95,.50,.07,'找到掸子啦！','먼지떨이를 찾았어!',['这里不用掸','여긴 털 필요 없어']);s.rules.push(rub('dusterT','rug','!rug',set('rug'),say('地毯平整啦','양탄자가 평평해졌어','rug')));}
pick(at(4),'duster','duster',.60,.62,.08,'旧掸子还能用！','낡은 먼지떨이도 쓸 만해!');
{const s=at(5);s.objs=s.objs.filter(o=>o.id!=='haw');s.rules=s.rules.filter(q=>q.t!=='haw');s.objs.push({id:'stall',hot:1,x:.93,y:.46,r:.08});s.tools.push({id:'hawT',img:'hawthorn',have:'out',miss:['这个是给墩墩的','이건 둥둥 줄 거야']});s.rules.push(tap('stall','!out',['fly','hawthorn',[.93,.46],'tray',.4,.05,.05],set('out'),['tone','good'],say('买到糖葫芦啦！','탕후루를 샀어!',[.5,.86],1.5)));s.rules.push(use('hawT','dun','!haw',set('haw'),say('甜甜的！','달콤해!','dun')));}
SIDE.push([['f','find_orange'],['g','lunch'],['u','find_bell','cov_basket'],['h'],['b','broom2']],[['f','find_dragonfly'],['g','find_orange'],['u','find_top','cov_box'],['u','find_yarn','cov_bundle'],['h']],[['f','find_pouch'],['g','find_orange'],['u','find_bell','cov_barrel'],['u','find_top','cov_box'],['b','hanky']],[['f','find_bell'],['g','tea'],['u','find_orange','cov_box'],['u','find_dragonfly','cov_steamer'],['b','broom2']],[['f','find_top'],['g','find_orange'],['u','find_pouch','cov_basket'],['u','find_yarn','cov_bundle'],['h']],[['f','find_bell'],['g','find_orange'],['u','find_top','cov_box'],['u','find_dragonfly','cov_bundle'],['h']],[['f','find_pouch'],['g','lunch'],['u','find_bell','cov_barrel'],['u','find_yarn','cov_box'],['b','broom2']],[['f','find_dragonfly'],['g','find_orange'],['u','find_top','cov_bundle'],['h'],['b','hanky']],[['f','find_yarn'],['g','lunch'],['u','find_bell','cov_box'],['u','find_pouch','cov_barrel'],['h']],[['f','find_top'],['g','find_orange'],['u','find_dragonfly','cov_box'],['u','find_bell','cov_bundle'],['b','broom2']],[['f','find_bell'],['g','find_orange'],['u','find_yarn','cov_box'],['u','find_top','cov_bundle'],['h']],[['f','find_pouch'],['g','lunch'],['u','find_dragonfly','cov_steamer'],['u','find_bell','cov_box'],['b','broom2']],[['f','find_yarn'],['g','find_orange'],['u','find_top','cov_barrel'],['u','find_pouch','cov_bundle'],['h']],[['f','find_dragonfly'],['g','lunch'],['u','find_bell','cov_box'],['u','find_yarn','cov_basket'],['b','hanky']],[['f','find_top'],['g','find_orange'],['u','find_pouch','cov_box'],['u','find_bell','cov_barrel'],['h']]);
ST.forEach((s,i)=>side(s,SIDE[i]));
for(const s of ST){s.diff=diff(s.id);s.time=time(s.id);}
module.exports=ST;
