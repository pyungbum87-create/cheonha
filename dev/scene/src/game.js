const VER='v2';
/* ============================== SAVE ============================== */
const SAVE={stars:{},opt:{bgm:1,sfx:1,vib:1},hint:{key:'',n:0},adCount:0,lastAd:0,plays:0};
try{const s=JSON.parse(localStorage.getItem('tt-scene')||'null');if(s&&typeof s==='object'){if(s.stars&&typeof s.stars==='object')for(const k in s.stars)SAVE.stars[k]=Math.min(3,s.stars[k]|0);
  if(s.opt)Object.assign(SAVE.opt,s.opt);if(s.hint)Object.assign(SAVE.hint,s.hint);for(const k of ['adCount','lastAd','plays'])SAVE[k]=Math.max(0,+s[k]||0);}}catch(e){}
function save(){try{localStorage.setItem('tt-scene',JSON.stringify(SAVE));}catch(e){}}
const dkey=(d=new Date())=>`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
function buzz(ms){if(!SAVE.opt.vib)return;try{if(navigator.vibrate)navigator.vibrate(ms);}catch(e){}}
const FREE_HINTS=3;
function hintsLeft(){if(SAVE.hint.key!==dkey()){SAVE.hint={key:dkey(),n:0};}return Math.max(0,FREE_HINTS-SAVE.hint.n);}

/* ============================== ART ============================== */
const ART={};function load(n){if(ART[n]!==undefined)return;ART[n]=null;const im=new Image();im.onload=()=>{ART[n]=im;};im.onerror=()=>{delete ART[n];};im.src='art/'+n+'.webp';}
for(const n of ('tuantuan tuantuan_sleep tt_cheer door l1_bg2 shutter clock sign broom knob hat l3_bg curtain cushion shoe shade drawer rugc hargow siumai charsiu xiaolong eggtart sesame didi didi_sick l2_bg blanket tea thermo tissue pillow panda '+
  'l4_bg web duster fu lantern paper bin l5_bg bucket rocket tube incense fbox muffs peng_shock pengpeng l6_bg candle flashlight jar matches plantern lid shan_scared shanshan '+
  'l7_bg balloon_d balloon flags cake candle2 gift l8_bg gull para_c para_o shell lunch pail l9_bg l9_bg_b l10_bg hawthorn sdragon kite drum lion envelope dundun zhuozhuo').split(' '))load(n);

/* ============================== LEVELS ==============================
   Positions are fractions of the square scene (0..1). Each task names how it is solved:
   tap · drag (to a target) · swipe (in a direction) · rub (sweep spots with the object). */
const LEVELS=[
 {id:1,title:'帮团团开店',intro:'天亮啦，团团还在睡懒觉! 帮他把小店开起来',bg:'l1_bg2',time:180,
  objs:[
   {id:'shutter',img:'door',x:.42,y:.385,w:.40,h:.42,z:1},
   {id:'clock',img:'clock',x:.235,y:.525,w:.08,z:2,shake:1},
   {id:'tt',img:'tuantuan',x:.50,y:.80,w:.21,z:3,sleep:1},
   {id:'sign',img:'sign',x:.86,y:.84,w:.11,z:4,rot:.25},
   {id:'broom',img:'broom',x:.09,y:.88,w:.10,z:5,rot:-.12},
   {id:'knob',hot:1,x:.765,y:.51,r:.05},{id:'fl1',hot:1,x:.765,y:.497,r:0,fire:'flame',fs:.8,steam:1}],
  tasks:[
   {id:'wake',kind:'tap',obj:'tt',label:'叫醒团团'},
   {id:'clock',kind:'tap',obj:'clock',label:'关掉闹钟'},
   {id:'sign',kind:'drag',obj:'sign',to:{x:.43,y:.14,r:.1},snap:{x:.43,y:.21},label:'挂上招牌'},
   {id:'shutter',kind:'swipe',obj:'shutter',dir:'up',label:'打开店门'},
   {id:'sweep',kind:'rub',obj:'broom',spots:[[.30,.90],[.62,.93],[.80,.80],[.40,.74]],label:'把地扫干净'},
   {id:'stove',kind:'tap',obj:'knob',on:['fl1'],label:'点火蒸点心'}],
  eggs:[{x:.36,y:.48,r:.05,s:'早呀团团!',need:'shutter'},{x:.45,y:.49,r:.045,s:'我要吃包子!',need:'shutter'},{x:.515,y:.52,r:.04,s:'喵~',need:'shutter'},
        {x:.80,y:.25,r:.1,s:'看起来好好吃'},{x:.92,y:.45,r:.05,s:'锅里在煮汤'},{x:.09,y:.55,r:.06,s:'梅花开了'}]},
 {id:2,title:'滴滴感冒了',intro:'下雨天滴滴着凉了，快照顾他!',bg:'l2_bg',time:180,
  objs:[
   {id:'didi',img:'didi_sick',x:.40,y:.615,w:.27,z:3,shiver:1,happy:'didi',hw:.17},
   {id:'blanket',img:'blanket',x:.20,y:.88,w:.16,z:4,rot:-.08},
   {id:'tea',img:'tea',x:.63,y:.445,w:.065,z:4},
   {id:'thermo',img:'thermo',x:.885,y:.62,w:.08,z:4,hide:1,rot:.5},
   {id:'pillow',img:'pillow',x:.885,y:.615,w:.13,z:5},
   {id:'tissue',img:'tissue',x:.70,y:.83,w:.10,z:4,hide:1},
   {id:'panda',img:'panda',x:.70,y:.80,w:.11,z:5}],
  tasks:[
   {id:'b',kind:'drag',obj:'blanket',to:{x:.40,y:.62,r:.15},snap:{x:.43,y:.665},keep:1,label:'盖好被子'},
   {id:'t',kind:'drag',obj:'tea',to:{x:.40,y:.62,r:.15},snap:{x:.36,y:.60},label:'喝姜茶'},
   {id:'p',kind:'swipe',obj:'pillow',dir:'left',move:[-.1,.02],label:'找体温计'},
   {id:'m',kind:'drag',obj:'thermo',needs:'p',to:{x:.40,y:.62,r:.15},snap:{x:.36,y:.60},label:'量体温'},
   {id:'q',kind:'swipe',obj:'panda',dir:'right',move:[.12,0],label:'找纸巾'},
   {id:'x',kind:'drag',obj:'tissue',needs:'q',to:{x:.40,y:.62,r:.15},snap:{x:.36,y:.60},label:'擦鼻涕'}],
  eggs:[{x:.5,y:.33,r:.09,s:'雨下得好大'},{x:.81,y:.31,r:.05,s:'小熊也来陪你'},{x:.89,y:.32,r:.04,s:'嘟嘟~'},{x:.09,y:.53,r:.06,s:'灯亮啦'},{x:.08,y:.29,r:.07,s:'小红花'}]},
 {id:3,title:'点心去哪了',intro:'点心们溜出来玩捉迷藏啦! 找到 8 个点心',bg:'l3_bg',time:180,
  objs:[
   {id:'curtain',img:'curtain',x:.343,y:.335,w:.10,h:.27,z:2},
   {id:'cushion',img:'cushion',x:.44,y:.565,w:.10,z:2},
   {id:'shade',img:'shade',x:.837,y:.322,w:.14,z:2},
   {id:'drawer',img:'drawer',x:.76,y:.57,w:.085,z:2},
   {id:'rug',img:'rugc',x:.75,y:.80,w:.11,z:1},
   {id:'shoe',img:'shoe',x:.885,y:.70,w:.11,z:3},
   {id:'fan',hot:1,x:.5,y:.11,r:.07},{id:'box',hot:1,x:.77,y:.44,r:.045}],
  tasks:[
   {id:'d1',kind:'swipe',obj:'curtain',dir:'left',move:[-.075,0],reveal:'hargow',label:'虾饺'},
   {id:'d2',kind:'swipe',obj:'cushion',dir:'right',move:[.11,.03],reveal:'siumai',label:'烧卖'},
   {id:'d3',kind:'swipe',obj:'shade',dir:'up',move:[0,-.085],reveal:'eggtart',label:'蛋挞'},
   {id:'d4',kind:'swipe',obj:'drawer',dir:'down',move:[0,.09],reveal:'charsiu',label:'叉烧包'},
   {id:'d5',kind:'swipe',obj:'rug',dir:'up',move:[0,-.05],rot:.35,reveal:'sesame',label:'芝麻球'},
   {id:'d6',kind:'tap',obj:'shoe',move:[.03,.02],rot:1.1,reveal:'xiaolong',label:'小笼包'},
   {id:'d7',kind:'tap',obj:'fan',reveal:'hargow',label:'虾饺'},
   {id:'d8',kind:'tap',obj:'box',reveal:'xiaolong',label:'小笼包'}],
  eggs:[{x:.48,y:.33,r:.08,s:'外面天气真好'},{x:.95,y:.5,r:.05,s:'点心还没找齐，不能出门哦'},{x:.08,y:.55,r:.07,s:'小心别碰倒花盆'},{x:.18,y:.29,r:.07,s:'好漂亮的梅花'}]},
 {id:4,title:'过年大扫除',intro:'快过年啦! 把家里打扫干净，挂上福字和灯笼',bg:'l4_bg',time:180,
  objs:[
   {id:'w1',img:'web',x:.09,y:.13,w:.15,z:1},{id:'w2',img:'web',x:.93,y:.13,w:.13,z:1},{id:'w3',img:'web',x:.93,y:.43,w:.11,z:1},
   {id:'duster',img:'duster',x:.33,y:.84,w:.09,z:5,rot:-.3},
   {id:'fu',img:'fu',x:.84,y:.44,w:.12,z:4,rot:.15},
   {id:'lan1',img:'lantern',x:.60,y:.86,w:.10,z:4},{id:'lan2',img:'lantern',x:.73,y:.90,w:.10,z:4},
   {id:'pa1',img:'paper',x:.45,y:.79,w:.06,z:3},{id:'pa2',img:'paper',x:.15,y:.90,w:.06,z:3},
   {id:'bin',img:'bin',x:.92,y:.86,w:.09,z:2},
   {id:'tt',img:'tt_cheer',x:.5,y:.8,w:.2,z:6,hide:1,atEnd:1,say:'干干净净过新年!'}],
  tasks:[
   {id:'webs',kind:'rub',obj:'duster',head:[0,-.36],spots:[[.09,.13,'w1'],[.93,.13,'w2'],[.93,.43,'w3']],label:'扫掉蜘蛛网'},
   {id:'fuz',kind:'drag',obj:'fu',to:{x:.51,y:.36,r:.12},snap:{x:.51,y:.35},keep:1,label:'贴福字'},
   {id:'l1',kind:'drag',obj:'lan1',to:[{x:.223,y:.2,r:.1,snap:{x:.223,y:.245}},{x:.785,y:.2,r:.1,snap:{x:.785,y:.245}}],keep:1,swing:1,label:'挂灯笼'},
   {id:'l2',kind:'drag',obj:'lan2',to:[{x:.223,y:.2,r:.1,snap:{x:.223,y:.245}},{x:.785,y:.2,r:.1,snap:{x:.785,y:.245}}],keep:1,swing:1,label:'挂灯笼'},
   {id:'p1',kind:'drag',obj:'pa1',to:{x:.92,y:.84,r:.09},snap:{x:.92,y:.8},label:'捡纸团'},
   {id:'p2',kind:'drag',obj:'pa2',to:{x:.92,y:.84,r:.09},snap:{x:.92,y:.8},label:'捡纸团'}],
  eggs:[{x:.18,y:.33,r:.09,s:'梅花开了'},{x:.15,y:.54,r:.06,s:'先喝口茶'},{x:.43,y:.47,r:.04,s:'咚咚咚'},{x:.84,y:.63,r:.07,s:'里面都是年货'}]},
 {id:5,title:'砰砰点错烟花',intro:'砰砰放烟花闯祸啦! 快帮他收拾',bg:'l5_bg',time:180,
  objs:[
   {id:'fl1',hot:1,x:.105,y:.56,r:0,fire:'flame',fs:1.6,lit:1},{id:'fl2',hot:1,x:.40,y:.57,r:0,fire:'flame',fs:1.1,lit:1},
   {id:'peng',img:'peng_shock',x:.66,y:.82,w:.20,z:3,shiver:1,happy:'pengpeng',hw:.17,happyMsg:'谢谢大家!'},
   {id:'bucket',img:'bucket',x:.93,y:.90,w:.10,z:5},
   {id:'rocket',img:'rocket',x:.36,y:.17,w:.08,z:2,rot:.8},
   {id:'tube',img:'tube',x:.24,y:.85,w:.08,z:2},
   {id:'fbox',img:'fbox',x:.08,y:.90,w:.11,z:2},{id:'incense',img:'incense',x:.17,y:.92,w:.05,z:3},
   {id:'muffs',img:'muffs',x:.47,y:.90,w:.10,z:4}],
  tasks:[
   {id:'e1',kind:'drag',obj:'bucket',to:{x:.11,y:.55,r:.12},ret:1,off:['fl1'],label:'扑灭树丛的火'},
   {id:'e2',kind:'drag',obj:'bucket',to:{x:.40,y:.56,r:.1},ret:1,off:['fl2'],label:'扑灭石桌的火'},
   {id:'e3',kind:'swipe',obj:'rocket',dir:'down',move:[0,.63],rot:-.3,label:'取下屋顶的烟花'},
   {id:'e4',kind:'drag',obj:'rocket',needs:'e3',to:{x:.24,y:.82,r:.1},snap:{x:.24,y:.8},fw:1,label:'重新放烟花'},
   {id:'e5',kind:'drag',obj:'incense',to:{x:.905,y:.66,r:.1},snap:{x:.905,y:.62},label:'把香拿远'},
   {id:'e6',kind:'drag',obj:'muffs',to:{x:.66,y:.76,r:.11},snap:{x:.66,y:.72},label:'给砰砰戴耳罩'}],
  eggs:[{x:.48,y:.54,r:.06,s:'过年好!'},{x:.74,y:.07,r:.05,s:'月亮好圆'},{x:.29,y:.33,r:.05,s:'红灯笼亮堂堂'},{x:.78,y:.45,r:.05,s:'梯子有点晃'}]},
 {id:6,title:'闪闪怕黑',intro:'阁楼好黑，闪闪害怕了! 把这里变亮',bg:'l6_bg',time:180,dark:.62,
  objs:[
   {id:'shan',img:'shan_scared',x:.5,y:.83,w:.22,z:4,shiver:1,happy:'shanshan',hw:.19,happyMsg:'不怕啦!'},
   {id:'lamp',hot:1,x:.5,y:.10,r:0,fire:'glow'},{id:'switch',hot:1,x:.876,y:.36,r:.05},
   {id:'candle',img:'candle',x:.43,y:.515,w:.055,z:3,fire:'flame',fs:.6,top:1},
   {id:'matches',img:'matches',x:.93,y:.53,w:.08,z:3},
   {id:'chest',hot:1,x:.17,y:.72,r:.1},{id:'flash',img:'flashlight',x:.2,y:.58,w:.1,z:3,hide:1},
   {id:'jar',img:'jar',x:.805,y:.43,w:.07,z:2,hide:1},{id:'lid',img:'lid',x:.805,y:.445,w:.15,z:3}],
  tasks:[
   {id:'s1',kind:'tap',obj:'switch',on:['lamp'],label:'打开电灯'},
   {id:'s2',kind:'drag',obj:'matches',to:{x:.43,y:.5,r:.08},snap:{x:.43,y:.45},on:['candle'],label:'点亮蜡烛'},
   {id:'s3',kind:'tap',obj:'chest',label:'打开箱子'},
   {id:'s4',kind:'drag',obj:'flash',needs:'s3',to:{x:.5,y:.8,r:.12},snap:{x:.5,y:.78},label:'给闪闪手电筒'},
   {id:'s5',kind:'swipe',obj:'lid',dir:'up',lift:1,label:'掀开盖子'},
   {id:'s6',kind:'tap',obj:'jar',needs:'s5',flies:1,label:'放出萤火虫'}],
  eggs:[{x:.5,y:.36,r:.08,s:'月亮出来了'},{x:.11,y:.29,r:.05,s:'旧篮子'},{x:.13,y:.43,r:.05,s:'圆点盒子'},{x:.6,y:.6,r:.05,s:'小板凳'}]},
 {id:7,title:'惊喜生日会',intro:'今天是团团的生日! 趁他回来前布置好',bg:'l7_bg',time:180,
  objs:[
   {id:'flags',img:'flags',x:.32,y:.86,w:.24,z:4},
   {id:'b1',img:'balloon_d',x:.80,y:.88,w:.08,z:4},{id:'b2',img:'balloon_d',x:.62,y:.92,w:.08,z:4},
   {id:'cake',img:'cake',x:.10,y:.57,w:.12,z:3},
   {id:'candle',img:'candle2',x:.45,y:.93,w:.035,z:5,fire:'flame',fs:.5,top:1},
   {id:'gift',img:'gift',x:.15,y:.88,w:.10,z:4},
   {id:'tt',img:'tt_cheer',x:.86,y:.6,w:.18,z:6,hide:1,atEnd:1,say:'哇! 谢谢大家!'}],
  tasks:[
   {id:'g1',kind:'drag',obj:'flags',to:{x:.52,y:.28,r:.13},snap:{x:.52,y:.3},keep:1,label:'挂彩旗'},
   {id:'g2',kind:'hold',obj:'b1',img:'balloon',w:.1,move:[-.08,-.5],bob:1,label:'吹气球'},
   {id:'g3',kind:'hold',obj:'b2',img:'balloon',w:.1,move:[-.32,-.53],bob:1,label:'吹气球'},
   {id:'g4',kind:'drag',obj:'cake',to:{x:.5,y:.5,r:.12},snap:{x:.5,y:.47},keep:1,label:'摆好蛋糕'},
   {id:'g5',kind:'drag',obj:'candle',needs:'g4',to:{x:.5,y:.4,r:.08},snap:{x:.5,y:.375},keep:1,on:['candle'],label:'插上蜡烛'},
   {id:'g6',kind:'drag',obj:'gift',to:{x:.64,y:.5,r:.1},snap:{x:.65,y:.48},keep:1,label:'放好礼物'}],
  eggs:[{x:.16,y:.27,r:.08,s:'星星出来了'},{x:.5,y:.12,r:.07,s:'灯笼灯'},{x:.87,y:.4,r:.07,s:'团团快回来了!'},{x:.1,y:.65,r:.06,s:'软软的沙发'}],endFw:1},
 {id:8,title:'海边野餐',intro:'在海边野餐，小心海鸥来抢吃的!',bg:'l8_bg',time:180,
  objs:[
   {id:'gull',img:'gull',x:.62,y:.17,w:.13,z:5,bob:1},{id:'lunch',img:'lunch',x:.6,y:.64,w:.11,z:3,hide:1},
   {id:'para',img:'para_c',x:.24,y:.53,w:.06,z:2},
   {id:'pail',img:'pail',x:.82,y:.86,w:.11,z:4},{id:'shell',img:'shell',x:.38,y:.82,w:.08,z:2,hide:1},
   {id:'tt',img:'tt_cheer',x:.5,y:.43,w:.14,z:6,hide:1,atEnd:1,say:'野餐开始啦!'}],
  tasks:[
   {id:'h1',kind:'tap',obj:'gull',move:[.5,-.3],lift:1,label:'赶走海鸥'},
   {id:'h2',kind:'drag',obj:'lunch',needs:'h1',to:{x:.5,y:.42,r:.15},snap:{x:.42,y:.4},keep:1,label:'抢回点心盒'},
   {id:'h3',kind:'tap',obj:'para',img:'para_o',w:.2,move:[0,-.06],label:'撑开遮阳伞'},
   {id:'h4',kind:'rub',obj:'pail',head:[.3,.35],dirt:'sand',spots:[[.34,.80],[.42,.84]],label:'挖沙子'},
   {id:'h5',kind:'drag',obj:'shell',needs:'h4',to:{x:.5,y:.42,r:.15},snap:{x:.58,y:.41},keep:1,label:'捡贝壳'},
   {id:'h6',kind:'drag',obj:'pail',needs:'h4',to:{x:.5,y:.26,r:.15},ret:1,label:'打一桶海水'}],
  eggs:[{x:.37,y:.08,r:.06,s:'太阳好晒'},{x:.85,y:.2,r:.07,s:'椰子!'},{x:.1,y:.48,r:.04,s:'小石头'},{x:.3,y:.25,r:.06,s:'浪花哗啦啦'}]},
 {id:9,title:'找不同',intro:'夜市里有 7 处不一样，快找出来!',bg:'l9_bg',diff:'l9_bg_b',time:150,
  aspect:.75,objs:[{id:'d1',hot:1,x:.511,y:.134,r:.05},{id:'d2',hot:1,x:.37,y:.37,r:.07},{id:'d3',hot:1,x:.421,y:.548,r:.04},{id:'d4',hot:1,x:.349,y:.548,r:.04},
        {id:'d5',hot:1,x:.87,y:.552,r:.06},{id:'d6',hot:1,x:.898,y:.198,r:.07},{id:'d7',hot:1,x:.939,y:.912,r:.06}],
  tasks:[1,2,3,4,5,6,7].map(i=>({id:'f'+i,kind:'tap',obj:'d'+i,label:'不同'+i})),eggs:[]},
 {id:10,title:'小镇庙会',intro:'庙会开张啦! 帮大家玩得开开心心',bg:'l10_bg',time:200,
  objs:[
   {id:'tt',img:'tuantuan',x:.5,y:.74,w:.15,z:3},{id:'dun',img:'dundun',x:.3,y:.80,w:.17,z:3},{id:'zhuo',img:'zhuozhuo',x:.7,y:.70,w:.14,z:3},
   {id:'drum',hot:1,x:.86,y:.80,r:.1},{id:'lion',img:'lion',x:.52,y:.92,w:.14,z:5,hide:1},
   {id:'haw',img:'hawthorn',x:.78,y:.47,w:.05,z:4,rot:.4},
   {id:'kite',img:'kite',x:.80,y:.14,w:.15,z:2},
   {id:'stall',hot:1,x:.93,y:.46,r:.07},{id:'drag',img:'sdragon',x:.9,y:.36,w:.08,z:4,hide:1},
   {id:'lamp',hot:1,x:.38,y:.38,r:.06}],
  tasks:[
   {id:'k1',kind:'tap',obj:'drum',label:'敲响大鼓'},
   {id:'k2',kind:'drag',obj:'lion',needs:'k1',to:{x:.17,y:.52,r:.14},snap:{x:.18,y:.5},keep:1,dance:1,label:'舞狮上台'},
   {id:'k3',kind:'drag',obj:'haw',to:{x:.3,y:.78,r:.11},snap:{x:.3,y:.74},label:'给墩墩糖葫芦'},
   {id:'k4',kind:'swipe',obj:'kite',dir:'down',move:[-.05,.42],rot:.2,label:'取下风筝'},
   {id:'k5',kind:'drag',obj:'kite',needs:'k4',to:{x:.7,y:.68,r:.11},snap:{x:.7,y:.64},label:'风筝给啄啄'},
   {id:'k6',kind:'hold',obj:'stall',label:'做糖画'},
   {id:'k7',kind:'drag',obj:'drag',needs:'k6',to:{x:.5,y:.72,r:.1},snap:{x:.5,y:.68},label:'糖画给团团'},
   {id:'k8',kind:'tap',obj:'lamp',reveal:'envelope',label:'找到红包'}],
  eggs:[{x:.85,y:.1,r:.08,s:'许个愿吧'},{x:.07,y:.85,r:.06,s:'花开富贵'},{x:.5,y:.2,r:.08,s:'庙会开张啦'}],endFw:1}];

/* ============================== PLAY STATE ============================== */
const W=390;let H=780,KS=1,DPR=1,INS={t:0,b:0};
let P=null,scr='home';
function SC(){if(P&&P.L.diff){const top=INS.t+96,a=P.L.aspect||1,s=Math.min(W-12,((H-INS.b-172-top)/2-3)/a),sh=s*a;return{x:(W-s)/2,y:top,s,sh,dy:sh+6};}return{x:0,y:INS.t+104,s:W,sh:W};}            // scene rect on screen
const toS=(x,y)=>{const c=SC();return{x:c.x+x*c.s,y:c.y+y*c.sh};};
const toN=(x,y)=>{const c=SC();return{x:(x-c.x)/c.s,y:(y-c.y)/c.sh};};
function startLevel(i){const L=LEVELS[i];P={i,L,t:L.time,el:0,done:new Set(),reveals:[],objs:{},parts:[],floats:[],stamps:[],hint:null,hintsUsed:0,drag:null,over:false,won:false,dirt:{},tick:0,used:new Set(),ff:[]};
  for(const o of L.objs)P.objs[o.id]=Object.assign({ax:0,ay:0,alpha:1,vis:!o.hide,sx:1,sy:1,hop:0},o,{x0:o.x,y0:o.y});
  for(const t of L.tasks)if(t.kind==='rub')P.dirt[t.id]=t.spots.map(([x,y,o])=>({x,y,a:1,o,sand:t.dirt==='sand'}));setChipTop();
  SAVE.plays++;save();$('mTitle').textContent=L.title;renderChips();show('play');banner(L.intro);sfx('start');}
function taskFor(objId){return P.L.tasks.find(t=>t.obj===objId&&!P.done.has(t.id)&&(!t.needs||P.done.has(t.needs)));}
function complete(t,x,y){if(P.done.has(t.id))return;P.done.add(t.id);sfx('good',P.done.size);buzz(20);
  const p=toS(x,y);burst(p.x,p.y,24,['#ffd94a','#fff','#7be08c','#ff8fa3']);P.stamps.push({x,y,t:0});P.floats.push({x:p.x,y:p.y-24,s:t.label+' ✓',t:0});
  if(t.reveal)P.reveals.push({img:t.reveal,x,y,t:0});
  for(const q of P.L.tasks)if(q.needs===t.id){const o=P.objs[q.obj];o.vis=true;o.hop=1;}
  const all=P.done.size===P.L.tasks.length;
  if(all){for(const o of Object.values(P.objs))if(o.atEnd){o.vis=true;o.hop=1;if(o.say)setTimeout(()=>P&&P.floats.push(Object.assign(toS(o.x,o.y-.14),{s:o.say,t:0})),300);}if(P.L.endFw)fireworks(5);}
  const kid=Object.values(P.objs).find(o=>o.happy);if(kid&&all){kid.img=kid.happy;kid.w=kid.hw;kid.shiver=0;kid.hop=1;kid.y-=.04;P.floats.push(Object.assign(toS(kid.x,kid.y-.15),{s:kid.happyMsg||'我好啦!',t:0}));}
  else if(kid){kid.hop=.6;P.floats.push(Object.assign(toS(kid.x+.08,kid.y-.12),{s:'❤',t:0,soft:1}));}renderChips();const PP=P;if(P.done.size===P.L.tasks.length)setTimeout(()=>{if(P===PP)win();},P.L.endFw||Object.values(P.objs).some(o=>o.atEnd)?2200:1200);}
function fireworks(n){const c=SC();for(let k=0;k<n;k++){const x=c.x+c.s*(.15+Math.random()*.7),y=c.y+c.s*(.06+Math.random()*.2),col=['#ffd94a','#ff8fa3','#9fd3ff','#8fd19e','#ffb13b'][k%5];
  for(let i=0;i<28;i++){const a=i/28*Math.PI*2,v=90+Math.random()*50;P.parts.push({k:'f',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1.2,c:col,r:2.4,delay:k*.25});}}setTimeout(()=>sfx('boom'),0);setTimeout(()=>sfx('boom'),500);}
function setChipTop(){const c=SC();document.documentElement.style.setProperty('--sceneBot',((c.y+c.sh+(c.dy||0))*KS)+'px');}
function burst(x,y,n,cols){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=60+Math.random()*160;P.parts.push({k:'s',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-40,life:.6+Math.random()*.4,c:cols[i%cols.length],r:2+Math.random()*3});}}
function banner(s){P.banner={s,t:2.6};}

/* ---------- what each solved task changes in the picture ---------- */
const FX={
  wake(o){o.sleep=0;o.hop=1;P.floats.push(Object.assign(toS(o.x,o.y-.14),{s:'早上好!',t:0}));sfx('yawn');},
  clock(o){o.shake=0;},
  sign(o,t){o.x=t.snap.x;o.y=t.snap.y;o.rot=0;o.swing=1;},
  shutter(o){o.lift=1;sfx('whoosh');},
  sweep(o){o.x=o.x0;o.y=o.y0;o.rot=-.12;},
};
function applyFx(t){const o=P.objs[t.obj];if(FX[t.id]&&!P.L.objs.find(q=>q.id==='didi')){FX[t.id](o,t);return;}const sn=t._snap||t.snap;
  if(t.ret){o.back=1;}else if(sn){o.x=sn.x;o.y=sn.y;o.x0=o.x;o.y0=o.y;o.rot=0;o.back=0;if(!t.keep)o.lift=1;else o.z=6;if(t.swing)o.swing=1;}
  if(t.kind==='rub'){o.back=1;}if(t.img)o.img=t.img;if(t.w)o.w=t.w;if(t.lift)o.lift=1;if(t.bob)o.bob=1;if(t.dance)o.dance=1;
  if(t.on)for(const id of t.on){P.objs[id].lit=1;sfx('fire');}
  if(t.off)for(const id of t.off){const q=P.objs[id];q.lit=0;sfx('water');const p=toS(q.x,q.y-.03);for(let i=0;i<14;i++)P.parts.push({k:'puff',x:p.x+(Math.random()-.5)*30,y:p.y,vx:(Math.random()-.5)*20,vy:-30-Math.random()*30,life:1.3,r:7});burst(p.x,p.y,12,['#9fd3ff','#ffffff']);}
  if(t.fw){o.lift=1;fireworks(3);}
  if(t.flies){for(let i=0;i<16;i++)P.ff.push({x:o.x,y:o.y-.03,vx:(Math.random()-.5)*.3,vy:-Math.random()*.3,ph:Math.random()*7});sfx('reward');}if(t.move){o.tmx=t.move[0];o.tmy=t.move[1];}if(t.rot!=null)o.trot=t.rot;if(t.obj==='fan')o.spin=1;}

/* ---------- input ---------- */
function objAt(nx,ny){const list=Object.values(P.objs).filter(o=>o.vis&&o.alpha>.3).sort((a,b)=>(b.z||0)-(a.z||0));
  for(const o of list){if(o.hot){if(Math.hypot(nx-o.x,ny-o.y)<o.r)return o;continue;}const im=ART[o.img];if(!im)continue;
    const w=o.w*(o.sleep?1.25:1),h=o.h||o.w*im.height/im.width;if(Math.abs(nx-o.x-(o.mx||0))<w*.5&&Math.abs(ny-o.y-(o.my||0))<h*.5)return o;}return null;}
function down(px,py){if(!P||P.over)return;const c0=SC();if(c0.dy&&py>c0.y+c0.dy-3)py-=c0.dy;const n=toN(px,py);if(n.y<0||n.y>1)return;const o=objAt(n.x,n.y),t=o&&taskFor(o.id);
  P.drag={o,t,sx:n.x,sy:n.y,lx:n.x,ly:n.y,moved:0,ox:o?o.x-n.x:0,oy:o?o.y-n.y:0,start:performance.now()};
  if(t&&(t.kind==='drag'||t.kind==='rub')){o.back=0;if(o.mx||o.my){o.x+=o.mx||0;o.y+=o.my||0;o.x0=o.x;o.y0=o.y;o.mx=o.my=0;o.tmx=o.tmy=null;P.drag.ox=o.x-n.x;P.drag.oy=o.y-n.y;}sfx('pick');o.z0=o.z;o.z=9;o.rot=t.kind==='rub'?-.5:0;}
  if(t&&t.kind==='hold'){sfx('pick');}}
function move(px,py){const d=P&&P.drag;if(!d)return;const n=toN(px,py);d.moved=Math.max(d.moved,Math.hypot(n.x-d.sx,n.y-d.sy));
  if(d.t&&(d.t.kind==='drag'||d.t.kind==='rub')){d.o.x=n.x+d.ox;d.o.y=n.y+d.oy;}
  if(d.t&&d.t.kind==='rub'){const o=d.o,im=ART[o.img],h=im?o.w*im.height/im.width:.12,hd=d.t.head,hx=o.x+(hd?hd[0]*o.w:-.01),hy=o.y+h*(hd?hd[1]:.38);let any=false;
    for(const s of P.dirt[d.t.id])if(s.a>0&&Math.hypot(s.x-hx,s.y-hy)<.085){s.a=Math.max(0,s.a-.34);any=true;if(s.o){const q=P.objs[s.o];q.alpha=s.a;if(s.a<=0)q.vis=false;}if(Math.random()<.5){const p=toS(s.x,s.y);P.parts.push({k:'d',x:p.x,y:p.y,vx:(Math.random()-.5)*60,vy:-20-Math.random()*40,life:.5,c:'#e9d3b0',r:3+Math.random()*3});}}
    if(any&&performance.now()-(P.swT||0)>140){P.swT=performance.now();sfx('sweep');}
    if(P.dirt[d.t.id].every(s=>s.a<=0)){complete(d.t,hx,hy);applyFx(d.t);d.o.z=d.o.z0;P.drag=null;}}
  d.lx=n.x;d.ly=n.y;}
function up(){const d=P&&P.drag;if(!d)return;P.drag=null;const o=d.o,t=d.t;
  if(t&&t.kind==='drag'){o.z=o.z0;for(const q of P.L.tasks.filter(q=>q.obj===o.id&&q.kind==='drag'&&!P.done.has(q.id)&&(!q.needs||P.done.has(q.needs)))){
      const tg=(Array.isArray(q.to)?q.to:[q.to]).find(g=>!P.used.has(g)&&Math.hypot(o.x-g.x,o.y-g.y)<g.r);
      if(tg){P.used.add(tg);q._snap=tg.snap||q.snap||{x:tg.x,y:tg.y};complete(q,q._snap.x,q._snap.y);applyFx(q);return;}}o.back=1;sfx('nope');return;}
  if(t&&t.kind==='hold'){o.grow=0;o.wig=.4;sfx('nope');P.floats.push(Object.assign(toS(o.x,o.y-.08),{s:'按住不放哦',t:0,soft:1}));return;}
  if(t&&t.kind==='rub'){o.z=o.z0;o.back=1;return;}
  if(t&&t.kind==='swipe'){const dy=d.ly-d.sy,dx=d.lx-d.sx;const ok=t.dir==='up'?dy<-.06:t.dir==='down'?dy>.06:t.dir==='left'?dx<-.06:dx>.06;
    if(ok){complete(t,o.x,o.y);applyFx(t);}else{o.wig=.4;sfx('nope');if(d.moved<.02)hintArrow(o,t);}return;}
  if(d.moved>.03)return;
  if(t&&t.kind==='tap'){complete(t,o.x,o.y);applyFx(t);return;}
  // not a task: little surprises, or a gentle "nope"
  for(const e of P.L.eggs){if((!e.need||P.done.has(e.need))&&Math.hypot(d.sx-e.x,d.sy-e.y)<e.r){P.floats.push(Object.assign(toS(e.x,e.y-.05),{s:e.s,t:0,soft:1}));sfx('egg');return;}}
  if(o){o.wig=.4;}const p=toS(d.sx,d.sy);P.floats.push({x:p.x,y:p.y,s:'?',t:0,soft:1});sfx('nope');}
function hintArrow(o,t){P.hint={t:t,life:2};}

/* ---------- hint / time / skip ---------- */
function useHint(){if(!P||P.over)return;const t=P.L.tasks.find(t=>!P.done.has(t.id));if(!t)return;
  const go=()=>{P.hint={t,life:6};P.hintsUsed++;sfx('hint');};
  if(hintsLeft()>0){SAVE.hint.n++;save();updHintBtn();go();}else showAd('看广告获得提示',()=>{show('play');go();});}
function addTime(){showAd('看广告加 60 秒',()=>{P.t+=60;P.over=false;show('play');banner('时间 +60 秒');sfx('reward');});}
function skipLevel(){showAd('看广告跳过本关',()=>{for(const t of P.L.tasks)if(!P.done.has(t.id)){P.done.add(t.id);applyFx(t);}show('play');renderChips();const PP=P;setTimeout(()=>{if(P===PP)win();},500);});}

/* ---------- frame update ---------- */
function update(dt){if(!P||P.over||P.won)return;P.el+=dt;P.t-=dt;if(P.t<=0){P.t=0;timeUp();}
  for(const o of Object.values(P.objs)){const k=Math.min(1,dt*8);if(o.tmx!=null){o.mx=(o.mx||0)+(o.tmx-(o.mx||0))*k;o.my=(o.my||0)+(o.tmy-(o.my||0))*k;}if(o.trot!=null)o.rot=(o.rot||0)+(o.trot-(o.rot||0))*k;if(o.hop>0)o.hop=Math.max(0,o.hop-dt*1.8);if(o.wig>0)o.wig=Math.max(0,o.wig-dt);if(o.swing>0)o.swing=Math.max(0,o.swing-dt*.6);
    if(o.lift){o.ay-=dt*1.6;o.alpha=Math.max(0,o.alpha-dt*1.4);if(o.alpha<=0)o.vis=false;}
    if(o.back){o.x+=(o.x0-o.x)*Math.min(1,dt*10);o.y+=(o.y0-o.y)*Math.min(1,dt*10);o.rot=(o.rot||0)+((o.rot0??(LEVELS[P.i].objs.find(q=>q.id===o.id).rot||0))-(o.rot||0))*Math.min(1,dt*10);if(Math.hypot(o.x-o.x0,o.y-o.y0)<.002)o.back=0;}}
  const hd=P.drag;if(hd&&hd.t&&hd.t.kind==='hold'&&hd.moved<.05){hd.hk=(performance.now()-hd.start)/1000/(hd.t.dur||1.2);hd.o.grow=Math.min(1,hd.hk);
    if((P.pumpT=(P.pumpT||0)-dt)<=0){P.pumpT=.22;sfx('pump');}if(hd.hk>=1){hd.o.grow=0;complete(hd.t,hd.o.x,hd.o.y);applyFx(hd.t);P.drag=null;}}
  for(const f of P.ff){f.ph+=dt;f.vx+=(Math.random()-.5)*dt*1.2;f.vy+=(Math.random()-.5)*dt*1.2;const sp=Math.hypot(f.vx,f.vy);if(sp>.18){f.vx*=.18/sp;f.vy*=.18/sp;}f.x+=f.vx*dt;f.y+=f.vy*dt;
    if(f.x<.05||f.x>.95)f.vx*=-1;if(f.y<.05||f.y>.9)f.vy*=-1;}
  const clk=P.objs.clock;if(clk&&clk.shake){P.tick-=dt;if(P.tick<=0){P.tick=1.1;sfx('ring');}}
  for(const o of Object.values(P.objs))if(o.lit&&o.steam&&Math.random()<dt*6){const p=toS(o.x,o.y-.06);P.parts.push({k:'puff',x:p.x+(Math.random()-.5)*16,y:p.y,vx:(Math.random()-.5)*10,vy:-25-Math.random()*20,life:1.4,r:6});}
  for(const p of P.parts){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.delay>0){p.delay-=dt;p.life+=dt;p.x-=p.vx*dt;p.y-=p.vy*dt;continue;}if(p.k==='s'){p.vy+=260*dt;}else if(p.k==='f'){p.vy+=70*dt;p.vx*=.985;p.vy*=.985;}else if(p.k==='puff')p.r+=dt*10;}P.parts=P.parts.filter(p=>p.life>0);
  for(const f of P.floats)f.t+=dt;P.floats=P.floats.filter(f=>f.t<1.3);for(const s of P.stamps)s.t+=dt;for(const r of P.reveals)r.t+=dt;P.reveals=P.reveals.filter(r=>r.t<1.4);
  if(P.hint){P.hint.life-=dt;if(P.hint.life<=0)P.hint=null;}if(P.banner){P.banner.t-=dt;if(P.banner.t<=0)P.banner=null;}
  // nudge: after a quiet spell, the next answer glows a little
  P.idle=(P.idle||0)+dt;
  const s=Math.ceil(P.t);if(s!==P.lastS){P.lastS=s;$('mTime').textContent=s+'s';$('mTime').classList.toggle('low',s<=20);}}
function timeUp(){P.over=true;sfx('over');$('tuN').textContent=`${P.done.size} / ${P.L.tasks.length}`;show('timeup');}
function win(){if(!P||P.won)return;P.won=true;const st=P.t>90&&P.hintsUsed===0?3:P.t>30&&P.hintsUsed<=1?2:1;const k=P.L.id;SAVE.stars[k]=Math.max(SAVE.stars[k]||0,st);save();
  $('wStars').innerHTML=[0,1,2].map(i=>`<i class="st${i<st?' on':''}" style="animation-delay:${.2+i*.25}s"></i>`).join('');$('wTime').textContent=Math.round(P.el)+'s';
  sfx('win');const now=Date.now();
  const go=()=>show('win');if(SAVE.plays>2&&now-SAVE.lastAd>90e3&&SAVE.plays%3===0){SAVE.lastAd=now;save();showAd('',go);}else go();}

/* ============================== DRAW ============================== */
const CV=document.getElementById('cv'),ctx=CV.getContext('2d');
function drawObj(o){const g=ctx,c=SC();if(!o.vis||o.hot)return;let im=ART[o.img];if(o.sleep&&ART.tuantuan_sleep)im=ART.tuantuan_sleep;if(!im)return;
  const w=o.w*c.s*(o.sleep&&ART.tuantuan_sleep?1.3:1),h=(o.h?o.h*c.s:w*im.height/im.width),p=toS(o.x+(o.mx||0),o.y+o.ay+(o.my||0));let rot=o.rot||0,sx=1,sy=1,dy=0;
  if(o.shake)rot+=Math.sin(performance.now()/40)*.12;if(o.shiver)rot+=Math.sin(performance.now()/30)*.025;if(o.wig)rot+=Math.sin(o.wig*40)*.08;if(o.swing)rot+=Math.sin(o.swing*14)*.25*o.swing;
  if(o.hop){dy=-Math.sin(o.hop*Math.PI)*28;sy=1+Math.sin(o.hop*Math.PI*2)*.06;sx=2-sy;}const T=performance.now()/1000;if(o.bob)dy+=Math.sin(T*3+o.x*9)*5;if(o.dance){dy-=Math.abs(Math.sin(T*6))*10;rot+=Math.sin(T*6)*.12;}if(o.grow){sx*=1+.45*o.grow;sy*=1+.45*o.grow;}
  const glow=(P.hint&&P.hint.t.obj===o.id)||(P.idle>25&&taskFor(o.id)&&Math.sin(performance.now()/300)>.6);
  g.save();g.globalAlpha=o.alpha;g.translate(p.x,p.y+dy);g.rotate(rot);g.scale(sx,sy);
  if(o.sleep&&!ART.tuantuan_sleep){g.rotate(-Math.PI/2.1);g.globalAlpha*=.98;}
  // soft contact shadow so cut-out objects sit in the painted room
  if(!o.h&&o.id!=='sign'){g.fillStyle='rgba(90,50,20,.18)';g.beginPath();g.ellipse(0,(o.sleep&&!ART.tuantuan_sleep?0:h*.46),w*.42,h*.07,0,0,7);g.fill();}
  if(glow){g.shadowColor='rgba(255,230,120,.95)';g.shadowBlur=18;}
  g.drawImage(im,-w/2,-h/2,w,h);g.restore();
  if(o.sleep){const t=performance.now()/1000;g.fillStyle='#5b3520';g.font='900 16px "PingFang SC",sans-serif';for(let i=0;i<3;i++){const k=(t*.6+i/3)%1;g.globalAlpha=1-k;g.fillText('z',p.x+10+k*26+i*4,p.y-20-k*40);}g.globalAlpha=1;}}
function render(){const g=ctx;g.setTransform(KS*DPR,0,0,KS*DPR,0,0);g.fillStyle='#fbefdc';g.fillRect(0,0,W,H);if(!P||scr==='home')return;
  const c=SC(),bg=ART[P.L.bg];g.save();g.beginPath();g.rect(c.x,c.y,c.s,c.sh);if(c.dy)g.rect(c.x,c.y+c.dy,c.s,c.sh);g.clip();
  if(bg)g.drawImage(bg,c.x,c.y,c.s,c.sh);else{g.fillStyle='#f3dcb8';g.fillRect(c.x,c.y,c.s,c.sh);}if(c.dy&&ART[P.L.diff])g.drawImage(ART[P.L.diff],c.x,c.y+c.dy,c.s,c.sh);
  // dust on the floor until swept
  for(const k in P.dirt)for(const s of P.dirt[k]){if(s.a<=0||s.o)continue;const p=toS(s.x,s.y);g.globalAlpha=s.a;if(s.sand){g.fillStyle='#e9c486';g.beginPath();g.ellipse(p.x,p.y,30,13,0,0,7);g.fill();g.fillStyle='#f6dca6';g.beginPath();g.ellipse(p.x-4,p.y-4,20,7,0,0,7);g.fill();g.globalAlpha=1;continue;}g.fillStyle='rgba(120,85,50,.55)';
    for(let i=0;i<6;i++){g.beginPath();g.arc(p.x+Math.cos(i*1.7)*9,p.y+Math.sin(i*2.3)*4,3+(i%3),0,7);g.fill();}g.fillStyle='rgba(200,180,150,.6)';g.beginPath();g.ellipse(p.x,p.y,16,6,0,0,7);g.fill();g.globalAlpha=1;}
  const hook=P.L.tasks.find(t=>t.kind==='drag'&&!P.done.has(t.id)&&P.drag&&P.drag.t===t);
  if(hook)for(const q of P.L.tasks.filter(q=>q.obj===hook.obj&&q.kind==='drag'&&!P.done.has(q.id)&&(!q.needs||P.done.has(q.needs))))for(const tg of (Array.isArray(q.to)?q.to:[q.to])){if(P.used.has(tg))continue;const p=toS(tg.x,tg.y),r=tg.r*c.s;g.strokeStyle='rgba(255,230,120,.9)';g.setLineDash([6,6]);g.lineWidth=3;g.beginPath();g.arc(p.x,p.y,r,0,7);g.stroke();g.setLineDash([]);}
  for(const o of Object.values(P.objs).sort((a,b)=>(a.z||0)-(b.z||0)))drawObj(o);
  if(P.L.dark){const a=P.L.dark*(1-P.done.size/P.L.tasks.length);if(a>.01){g.fillStyle=`rgba(12,14,48,${a})`;g.fillRect(c.x,c.y,c.s,c.s);}}
  for(const o of Object.values(P.objs))if(o.lit&&o.fire){let x=o.x+(o.mx||0),y=o.y+(o.my||0);if(o.top&&ART[o.img]){const im=ART[o.img];y-=o.w*im.height/im.width/2;}const p=toS(x,y);
    if(o.fire==='glow'){const gl=g.createRadialGradient(p.x,p.y,4,p.x,p.y,c.s*.45);gl.addColorStop(0,'rgba(255,225,150,.55)');gl.addColorStop(1,'rgba(255,225,150,0)');g.fillStyle=gl;g.fillRect(c.x,c.y,c.s,c.s);}else flameAt(g,p.x,p.y,o.fs||1);}
  for(const f of P.ff){const p=toS(f.x,f.y),a=.6+.4*Math.sin(f.ph*6);const gl=g.createRadialGradient(p.x,p.y,0,p.x,p.y,12);gl.addColorStop(0,`rgba(225,255,140,${a})`);gl.addColorStop(1,'rgba(225,255,140,0)');g.fillStyle=gl;g.beginPath();g.arc(p.x,p.y,12,0,7);g.fill();}
  const hd=P.drag;if(hd&&hd.t&&hd.t.kind==='hold'&&hd.hk>0){const o=hd.o,p=toS(o.x,o.y);g.strokeStyle='#ffd94a';g.lineWidth=6;g.lineCap='round';g.beginPath();g.arc(p.x,p.y,34,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,hd.hk));g.stroke();}
  if(c.dy){for(const t of P.L.tasks)if(P.done.has(t.id)){const o=P.objs[t.obj];for(const dy of [0,c.dy]){const p=toS(o.x,o.y);g.strokeStyle='#e8524a';g.lineWidth=3.5;g.beginPath();g.arc(p.x,p.y+dy,o.r*c.s,0,7);g.stroke();}}}
  for(const p of P.parts){if(p.delay>0)continue;g.globalAlpha=Math.min(1,p.life*2);if(p.k==='puff'){g.fillStyle='rgba(255,255,255,.5)';g.beginPath();g.arc(p.x,p.y,p.r,0,7);g.fill();}else{g.fillStyle=p.c;g.beginPath();g.arc(p.x,p.y,p.r,0,7);g.fill();}}g.globalAlpha=1;
  for(const s of P.stamps){const p=toS(s.x,s.y),k=Math.min(1,s.t*5),sc=1.6-.6*k;g.save();g.translate(p.x,p.y);g.scale(sc,sc);g.globalAlpha=Math.min(1,s.t*5)*.95;
    g.fillStyle='#4fae6a';g.strokeStyle='#fff';g.lineWidth=3;g.beginPath();g.arc(0,0,13,0,7);g.fill();g.stroke();g.strokeStyle='#fff';g.lineWidth=3.5;g.beginPath();g.moveTo(-6,0);g.lineTo(-1,5);g.lineTo(7,-5);g.stroke();g.restore();}
  for(const r of P.reveals){const im=ART[r.img];if(!im)continue;const p=toS(r.x,r.y);let x=p.x,y=p.y,s;
    if(r.t<.7){const k=r.t/.7;s=Math.sin(Math.min(1,k*1.6)*Math.PI*.6)*1.25;y-=k*30;}else{const k=(r.t-.7)/.7,e=k*k;s=1.1-.6*e;x+=(W/2-x)*e;y=y-30+((c.y+c.s+20)-(y-30))*e;}
    const sz=50*s;g.save();g.shadowColor='rgba(255,230,120,.9)';g.shadowBlur=14;g.drawImage(im,x-sz/2,y-sz/2,sz,sz*im.height/im.width);g.restore();}
  if(P.hint){const t=P.hint.t,o=P.objs[t.obj],p=toS(o.x+(o.mx||0),o.y+(o.my||0)),r=(o.r||o.w*.6)*c.s,k=(performance.now()/600)%1;
    g.strokeStyle=`rgba(255,80,80,${1-k*.6})`;g.lineWidth=4;g.beginPath();g.arc(p.x,p.y,r*(1+k*.2),0,7);g.stroke();drawHand(p,t);}
  g.restore();
  g.textAlign='center';g.textBaseline='middle';
  for(const f of P.floats){const a=f.t<1?1:1-(f.t-1)/.3,y=f.y-f.t*26;g.globalAlpha=Math.max(0,a);g.font=`900 ${f.soft?17:18}px "PingFang SC","Hiragino Sans GB",sans-serif`;
    const w=g.measureText(f.s).width+20;g.fillStyle=f.soft?'rgba(255,255,255,.92)':'#4fae6a';g.beginPath();g.roundRect(f.x-w/2,y-15,w,30,15);g.fill();g.fillStyle=f.soft?'#5b3520':'#fff';g.fillText(f.s,f.x,y+1);}g.globalAlpha=1;
  if(P.banner){const b=P.banner,a=Math.min(1,b.t*2,(2.6-b.t)*4),y=c.y+c.s*.5;g.globalAlpha=a;g.font='900 17px "PingFang SC","Hiragino Sans GB",sans-serif';const w=Math.min(W-30,g.measureText(b.s).width+40);
    g.fillStyle='rgba(91,53,32,.88)';g.beginPath();g.roundRect(W/2-w/2,y-24,w,48,24);g.fill();g.fillStyle='#fff';g.fillText(b.s,W/2,y+1);g.globalAlpha=1;}}
function flameAt(g,x,y,s){const t=performance.now()/90;const gl=g.createRadialGradient(x,y-6*s,2,x,y-6*s,34*s);gl.addColorStop(0,'rgba(255,200,90,.6)');gl.addColorStop(1,'rgba(255,200,90,0)');g.fillStyle=gl;g.beginPath();g.arc(x,y-6*s,34*s,0,7);g.fill();
  for(let i=0;i<5;i++){const fx=x+(i-2)*4*s,fh=(13+Math.sin(t+i*1.3)*4)*s;g.fillStyle=i%2?'#ffb13b':'#ff6a3c';g.beginPath();g.ellipse(fx,y-fh/2,3.4*s,fh/2,0,0,7);g.fill();}g.fillStyle='#fff3b0';g.beginPath();g.ellipse(x,y-4*s,2.4*s,5*s,0,0,7);g.fill();}
function drawHand(p,t){const g=ctx,k=(performance.now()/900)%1;let x=p.x,y=p.y;
  if(t.kind==='swipe'){const D={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[t.dir];x+=D[0]*k*60;y+=D[1]*k*60;}else if(t.kind==='drag'){const tg=Array.isArray(t.to)?t.to.find(g=>!P.used.has(g)):t.to,q=toS(tg.x,tg.y);x+=(q.x-p.x)*k;y+=(q.y-p.y)*k;}else if(t.kind==='rub'){const s=P.dirt[t.id].find(s=>s.a>0);if(s){const q=toS(s.x,s.y);x+=(q.x-p.x)*k;y+=(q.y-p.y)*k;}}
  else if(t.kind==='hold'){y+=Math.min(1,k*2)*4;}else{y+=Math.sin(k*Math.PI*2)*5;}
  g.font='34px sans-serif';g.fillText('👆',x+10,y+26);}

/* ============================== UI ============================== */
const $=id=>document.getElementById(id);
const SHEETS=['home','playUI','timeup','win','ad'];
function show(id){for(const s of SHEETS)$(s).hidden=!(s===id||(s==='playUI'&&(id==='play'||id==='timeup'||id==='ad'&&P&&!P.won)));scr=id==='home'?'home':'play';musicSync();if(id==='home')renderHome();}
function renderChips(){const L=$('chips');L.innerHTML='';for(const t of P.L.tasks){const d=document.createElement('div');const ok=P.done.has(t.id);d.className='chip'+(ok?' ok':' q');d.textContent=ok?t.label:'?';L.append(d);}
  $('mProg').textContent=`${P.done.size}/${P.L.tasks.length}`;$('mBar').style.setProperty('--p',(P.done.size/P.L.tasks.length*100)+'%');updHintBtn();}
function updHintBtn(){const n=hintsLeft();$('bHint').querySelector('small').textContent=n>0?n:'▶';$('bHint').classList.toggle('ready',n>0);}
function renderHome(){const L=$('lvList');L.innerHTML='';LEVELS.forEach((lv,i)=>{const b=document.createElement('button');b.className='lv'+(lv.locked?' lock':'');const st=SAVE.stars[lv.id]||0;
  b.innerHTML=`<div class="th" style="${lv.bg?`background-image:url(art/${lv.bg}.webp)`:''}">${lv.locked?'<span>画画中…</span>':''}</div><b>${lv.id}. ${lv.title}</b><i class="ss">${[0,1,2].map(k=>`<em class="${k<st?'on':''}"></em>`).join('')}</i>`;
  b.onclick=()=>{auInit();if(lv.locked){sfx('nope');b.classList.add('shake');setTimeout(()=>b.classList.remove('shake'),400);return;}sfx('btn');startLevel(i);};L.append(b);});}
let adCb=null,adT=null;
function showAd(label,cb){adCb=cb;$('adLabel').textContent=label||'广告';let n=3;$('adN').textContent=n;const wasOver=P&&P.over;show('ad');if(P)P.over=true;clearInterval(adT);
  adT=setInterval(()=>{n--;$('adN').textContent=n;if(n<=0){clearInterval(adT);if(P)P.over=wasOver;const f=adCb;adCb=null;SAVE.adCount++;SAVE.lastAd=Date.now();save();f&&f();}},1000);}

/* ============================== LOOP, INPUT, BOOT ============================== */
function resize(){const vw=innerWidth,vh=innerHeight;DPR=Math.min(2.5,devicePixelRatio||1);KS=vw/W;H=Math.max(600,vh/KS);CV.width=Math.round(vw*DPR);CV.height=Math.round(vh*DPR);CV.style.width=vw+'px';CV.style.height=vh+'px';
  const pr=getComputedStyle($('insProbe'));INS={t:(parseFloat(pr.paddingTop)||0)/KS,b:(parseFloat(pr.paddingBottom)||0)/KS};document.documentElement.style.setProperty('--sceneTop',(SC().y*KS)+'px');document.documentElement.style.setProperty('--sceneBot',((SC().y+SC().s)*KS)+'px');}
let last=0;function frame(now){const dt=Math.min(.05,(now-(last||now))/1000);last=now;if(scr==='play')update(dt);render();requestAnimationFrame(frame);}
let pid=null;
CV.addEventListener('pointerdown',e=>{auInit();if(pid!==null||scr!=='play')return;pid=e.pointerId;try{CV.setPointerCapture(pid);}catch(_){}if(P)P.idle=0;down(e.clientX/KS,e.clientY/KS);});
CV.addEventListener('pointermove',e=>{if(e.pointerId===pid)move(e.clientX/KS,e.clientY/KS);});
for(const ev of ['pointerup','pointercancel'])CV.addEventListener(ev,e=>{if(e.pointerId!==pid)return;pid=null;up();});
function tap(id,fn){$(id).addEventListener('click',e=>{auInit();sfx('btn');fn(e);});}
tap('bBack',()=>{P=null;show('home');setChipTop();});tap('bTime',addTime);tap('bHint',useHint);tap('bSkip',skipLevel);
tap('tuMore',addTime);tap('tuRetry',()=>startLevel(P.i));tap('tuHome',()=>{P=null;show('home');});
tap('wNext',()=>{const n=P.i+1;if(LEVELS[n]&&!LEVELS[n].locked)startLevel(n);else{P=null;show('home');}});tap('wHome',()=>{P=null;show('home');});
tap('bSnd',()=>{const on=!(SAVE.opt.bgm||SAVE.opt.sfx);SAVE.opt.bgm=SAVE.opt.sfx=on?1:0;save();applySound();$('bSnd').classList.toggle('off',!on);});
for(const ev of ['pointerdown','touchend','click'])document.addEventListener(ev,()=>{auInit();if(AU.c&&!MUSIC.src)musicSync();},{capture:true,passive:true});
document.addEventListener('visibilitychange',()=>musicSync());
addEventListener('resize',resize);resize();$('bSnd').classList.toggle('off',!(SAVE.opt.bgm||SAVE.opt.sfx));show('home');requestAnimationFrame(frame);
window.__sp={get P(){return P;},startLevel,down,move,up,toS,LEVELS,SAVE};
