(()=>{"use strict";
/* ============================== 심해 신전 수비대 · 밸런스 표 (숫자는 여기서만 고친다) ==============================
   좌표는 논리 화면 450×800. 적은 위쪽 심연 동굴에서 나와 물길을 따라 맨 아래 신전 문으로 온다.
   밸런스 기준(킹덤러시류): 한 판 4~6분 · 8~13웨이브 · 별은 남은 생명 18↑/10↑ · 권장 숙련으로 첫 도전 승률 70~80% · 난이도 톱니(구역 첫 판↓, 5번째 정예, 10번째 보스)
   수호탑 '골드당 피해' 는 비슷하게(공격형 0.22~0.27, 보조형 0.07~0.13 + 효과) 맞춘다 */
const W=450,H=800,TICK=60,TEMPLE={x:225,y:704};
const TOWER_IDS=['coral','bubble','jelly','conch','rune'];
/* cls: phy 물리(갑옷에 약함) · mag 마력(갑옷 무시) · exp 폭발(갑옷 절반) */
const TOWERS={
  coral: {cost:60, range:104,cd:.55,dmg:7.5, cls:'phy',proj:'spine',speed:620},
  bubble:{cost:70, range:100,cd:1.1,dmg:5,  cls:'mag',proj:'bub',  speed:300,slow:.38,slowT:1.6},
  jelly: {cost:100,range:108,cd:1.3,dmg:15, cls:'mag',chain:3,fall:.72,reveal:true},
  conch: {cost:110,range:150,cd:2.4,dmg:28, cls:'exp',proj:'shell',speed:330,aoe:42},
  rune:  {cost:90, range:92, cd:.22,dmg:2.6,cls:'mag',beam:true,aura:.15,reveal:true},
};
const LV_DMG=[1,1.75,2.7,4.1],LV_RANGE=[1,1.08,1.16,1.24],UP_COST=[.85,1.35,2.4],SELL=.7,MAX_TLV=4;   // 4단계 = 각성(두 갈래 중 하나)
const OPEN_N=6;   // 지금 열어 둔 판 수(새 그림체 그림이 있는 범위). 그림이 다 오면 STAGE_N 으로
const UNLOCK={coral:0,bubble:0,jelly:0,conch:6,rune:8};   // 그림이 오기 전까지 뒤로 미룸(원래 2, 5)      // 몇 번째 판(0부터)부터 쓸 수 있는가
/* 각성 갈래: 3단계에서 4단계로 올릴 때 하나를 고른다 */
const BRANCH={
  coral: [{id:'storm',n:['산호 폭풍','珊瑚风暴'],d:['연사 +50%, 관통이 더 자주','射速 +50%，更频繁贯穿']},{id:'venom',n:['독가시','毒刺'],d:['맞은 적에 독(3초)과 갑옷 깎기','命中附带中毒(3秒)并削弱护甲']}],
  bubble:[{id:'frost',n:['빙결 거품','冰结泡泡'],d:['둔화 +20%, 감옥 1.6배','减速 +20%，牢笼 1.6倍']},{id:'blast',n:['거품 폭탄','泡泡炸弹'],d:['거품이 터지며 주변 피해','泡泡爆裂造成范围伤害']}],
  jelly: [{id:'tempest',n:['폭풍 해파리','风暴水母'],d:['번개 연쇄 +3, 과충전 더 자주','闪电连锁 +3，过载更频繁']},{id:'paralyze',n:['마비 해파리','麻痹水母'],d:['번개에 맞으면 25% 확률로 기절','被闪电击中有25%几率眩晕']}],
  conch: [{id:'giant',n:['대왕 소라','巨型海螺'],d:['폭발 범위 1.5배, 피해 +25%','爆炸范围1.5倍，伤害 +25%']},{id:'triple',n:['삼연 소라','三连海螺'],d:['한 번에 세 발을 쏨','一次发射三发']}],
  rune:  [{id:'amp',n:['증폭 룬','增幅符文'],d:['주변 증폭 +20%, 공명 강화','周围增幅 +20%，共鸣强化']},{id:'purge',n:['정화 룬','净化符文'],d:['보호막에 3배, 재생 막기, 광선 +80%','对护盾3倍，阻止再生，光束 +80%']}],
};
/* 수호탑 고유 스킬: 판이 지날수록 단계가 오른다(6판마다 +1, 최대 5). 판 안의 축복 카드로 더 오른다 */
const sTierOf=i=>Math.min(5,1+Math.floor(i/6));
const TSKILL={
  coral: t=>({every:Math.max(3,7-t),mul:2.2+.4*t,len:170}),          // 관통 가시: N발마다 일직선 관통
  bubble:t=>({cd:Math.max(4,8.5-t),dur:.9+.35*t}),                    // 거품 감옥: 가장 센 적을 가둠(받는 피해 +30%)
  jelly: t=>({cd:Math.max(6,11.5-t),dmg:16*t,stun:.35+.1*t}),         // 과충전: 범위 안 전부 감전·기절
  conch: t=>({cd:Math.max(5,10.5-t),r:40+4*t,dur:1.8+.5*t,dps:5*t,slow:.4}),   // 소용돌이
  rune:  t=>({cd:Math.max(7,13.5-t),dur:1.8+.6*t,haste:.4}),          // 공명: 주변 수호탑 공격 속도 +40%
};
/* 판 밖 성장: 숙련(코인으로 올림). 수호탑마다 따로, 가드도 따로 */
const MAX_LV=40;
const masteryMul=lv=>1+.07*(lv-1);
const lvCost=lv=>Math.round(35*Math.pow(lv,1.15)/5)*5;
const recLv=i=>1+Math.round(i*.5);   // 첫 클리어 보상만으로 권장 숙련의 80~100%를 채울 수 있게 맞춤(나머지는 출석·미션·다시 하기)
/* 영웅 가드 + 지휘 스킬 3종 */
const HERO={sp:95,range:96,cd:.6,dmg:10,cls:'phy',lvXp:[0,12,30,60,100]};
const CMD={
  slam:{ic:'⚓',cd:22,r:72,dmg:85,stun:.9,from:0,n:['닻 내려찍기','铁锚重击'],d:['가드 주변을 내려찍어 정화·기절','重击卫士周围，净化并眩晕']},
};
/* 수비대원: 수호탑마다 맡은 대원이 있고, 그 대원의 수호탑을 하나라도 지으면 대원 스킬이 열린다.
   스킬 위력은 그 대원 수호탑의 수·단계(pw)와 대원 레벨을 따라간다 */
const CREW={
  hero:  {n:['가드','卫士'],role:['수비대장','守卫队长'],bio:['전쟁을 버린 잠수 공병. 이번엔 지키기로 했다','抛下战争的潜水工兵。这一次选择守护']},
  coral: {n:['코라','珂拉'],role:['산호 저격수','珊瑚狙击手'],bio:['사냥꾼의 딸. 산호 가시로 백 걸음 밖 치어를 맞힌다','猎人的女儿。能用珊瑚刺射中百步外的小鱼'],
          sk:['집중 사격','集中射击'],d:['5초 동안 모든 산호 궁수가 2배 빠르게 쏴요','5秒内所有珊瑚弓手射速翻倍'],cd:26,dur:5},
  bubble:{n:['보글','泡泡'],role:['거품 기술자','泡泡技师'],bio:['군함 정비병 출신. 무기 대신 거품을 만든다','曾是军舰维修兵。如今不造武器，只造泡泡'],
          sk:['거품 폭우','泡泡暴雨'],d:['모든 적을 4초 동안 크게 늦추고 조금 정화해요','4秒内大幅减速全体敌人并少量净化'],cd:30,slow:.6,dur:4,dmg:10},
  jelly: {n:['루미','露米'],role:['해파리 조련사','水母驯养师'],bio:['등대지기의 손녀. 해파리들이 할머니 대신 불을 밝힌다','灯塔看守人的孙女。水母们替奶奶点亮灯火'],
          sk:['번개 폭풍','雷暴'],d:['화면의 모든 적에게 번개를 내려 정화·기절','对全屏敌人降下闪电，净化并眩晕'],cd:34,dmg:26,stun:.8},
  conch: {n:['소라','螺螺'],role:['포술장','炮术长'],bio:['늙은 포병. 포탄 대신 소라 껍데기를 쏜다','老炮兵。如今发射的不是炮弹，而是海螺'],
          sk:['일제 포격','齐射'],d:['모든 소라 대포가 가장 앞선 적에게 한꺼번에 쏴요','所有海螺炮同时轰击最前方的敌人'],cd:32},
  rune:  {n:['아린','雅琳'],role:['신전 사제','神殿祭司'],bio:['신전에서 태어난 아이. 결계의 노래를 안다','在神殿出生的孩子，懂得结界之歌'],
          sk:['결계의 노래','结界之歌'],d:['6초 동안 모든 수호탑의 정화력 +40%','6秒内所有守护塔净化力 +40%'],cd:36,dur:6,amp:.4},
};
/* 정화: 오염도(체력)를 다 씻어 내면 원래 모습으로 돌아와 잠깐 우리 편이 된다 */
const PURE={
  minnow:{act:'gift',gold:1,n:['진주 선물','赠送珍珠'],d:['고마워하며 진주 1개를 주고 떠나요','留下1颗珍珠后离开']},
  crab:  {act:'block',t:2.5,n:['길막이','拦路'],d:['그 자리에서 2.5초 동안 뒤따르던 적을 막아 줘요','原地拦住后面的敌人2.5秒']},
  eel:   {act:'shock',n:3,dmg:18,stun:.6,r:80,n2:['감전','电击'],d:['주변 적 3마리를 감전시켜요','电击周围3个敌人']},
  ray:   {act:'sweep',len:170,dmg:22,sp:150,n:['역류 돌진','逆流冲刺'],d:['왔던 길을 거슬러 헤엄치며 적을 밀쳐 정화해요','沿来路逆游，撞击并净化敌人']},
  elite: {act:'block',t:4,stun:1,n:['큰 길막이','巨型拦路'],d:['4초 동안 길을 막고 주변 적을 기절시켜요','拦路4秒并眩晕周围敌人']},
};


/* 적: 모든 몹에 스킬이 하나씩. from = 몇 번째 판(0부터)부터 스킬을 쓰는가 */
const ENEMIES={
  minnow:   {hp:12, sp:66,r:8, gold:2, cost:.45,school:.25,from:1},           // 떼 지어 가속: 주변에 치어가 4마리 이상이면 +25%
  crab:     {hp:58, sp:30,r:12,gold:6, cost:1.3,armor:.45,clamp:[.5,.3,3],from:2}, // 껍질 닫기: 체력 절반 아래로 떨어지면 3초 동안 갑옷 +30%
  eel:      {hp:36, sp:50,r:10,gold:5, cost:1,  dash:2.2,from:1},             // 돌진: 반쯤 다치면 번쩍 돌진
  ray:      {hp:44, sp:46,r:13,gold:6, cost:1.25,phase:[4,2.5],from:3},       // 그림자 숨기: 주기적으로 투명
  angler:   {hp:92, sp:28,r:13,gold:11,cost:2.4,heal:[4,.08,72],from:6},      // 등불 치유: 주변 동료 회복
  squid:    {hp:72, sp:38,r:12,gold:9, cost:2,  ink:[7,100,4],from:11},       // 먹물: 수호탑 시야를 가림(눌러서 닦기)
  horseshoe:{hp:125,sp:26,r:14,gold:12,cost:2.8,armor:.3,split:3,from:15},    // 분열: 쓰러지면 치어 3마리
  turtle:   {hp:300,sp:18,r:17,gold:25,cost:6,  armor:.3,shell:.3,from:21},   // 바위 껍질: 3초 안 맞으면 보호막 재생
  elite:    {hp:520,sp:23,r:18,gold:45,cost:11, armor:.3,leak:3,command:[80,.18],art:'crab',ew:66,tint:'#ffb040'}, // 지휘: 주변 적 속도 +18%
  /* 구역 보스: art = 쓸 그림, ph = 체력 비율에 따른 패턴 */
  boss: {hp:6000,sp:12,r:30,gold:150,cost:0,armor:.2,leak:12,ew:110,ph:[[.7,'summon','minnow',7],[.45,'ink',3.5],[.22,'summon','elite',2]]},
  boss2:{hp:6600,sp:11,r:30,gold:180,cost:0,armor:.45,leak:12,art:'turtle',ew:120,tint:'#7fa0c0',ph:[[.75,'shield',.25],[.5,'jam',3,4],[.25,'shield',.3]]},
  boss3:{hp:6400,sp:13,r:30,gold:200,cost:0,armor:.3,leak:12,art:'horseshoe',ew:120,tint:'#ff8a4a',ph:[[.7,'summon','horseshoe',3],[.45,'haste',.35,6],[.2,'summon','horseshoe',4]]},
  boss4:{hp:6200,sp:14,r:30,gold:220,cost:0,armor:.2,leak:12,art:'squid',ew:118,tint:'#4fd08a',ph:[[.75,'cloak',4],[.5,'ink',4],[.3,'summon','squid',4],[.15,'cloak',5]]},
  boss5:{hp:6800,sp:12,r:34,gold:400,cost:0,armor:.3,leak:20,art:'boss',ew:130,tint:'#d070ff',ph:[[.8,'summon','elite',2],[.6,'shield',.2],[.45,'ink',4],[.3,'heal',.12],[.15,'summon','turtle',2]]},
};
const BOSS_IDS=['boss','boss2','boss3','boss4','boss5'];
const KIND_AT={minnow:0,crab:0,eel:1,ray:3,angler:6,squid:11,horseshoe:15,turtle:21};

/* ---------- 지도: 굽은 물길. segs = 곡선 제어점, next = 다음 구간(문자) 또는 수문{g,to:[왼,오]} ----------
   cur = [구간,시작t,끝t,속도배수] 해류 띠 · vent = [구간,t] 거품 기둥 */
const LAYOUTS=[
  {name:['굽이 해구','蜿蜒海沟'],segs:{a:[[225,58],[225,128],[110,190],[95,290],[230,340],[350,400],[345,500],[200,545],[105,610],[175,670],[225,704]]},start:['a'],next:{}},
  {name:['해류 협곡','洋流峡谷'],segs:{a:[[120,58],[120,150],[300,200],[365,285],[250,350],[100,400],[88,500],[230,560],[345,620],[265,680],[225,704]]},start:['a'],next:{},cur:[['a',.2,.36,1.55],['a',.58,.72,1.55]]},
  {name:['갈림 수문','分流水闸'],segs:{a:[[225,58],[225,120],[222,196]],b:[[222,196],[110,236],[68,340],[105,440],[215,482]],c:[[222,196],[305,262],[300,402],[215,482]],
    d:[[215,482],[305,540],[315,620],[235,672],[225,704]]},start:['a'],next:{a:{g:'g1',to:['b','c']},b:'d',c:'d'}},
  {name:['쌍둥이 동굴','双子洞窟'],segs:{a:[[80,58],[82,160],[160,240],[225,300]],b:[[370,58],[378,168],[298,240],[225,300]],
    c:[[225,300],[228,360],[100,430],[118,540],[300,585],[330,652],[225,704]]},start:['a','b'],next:{a:'c',b:'c'},vent:[['c',.22],['c',.62]]},
  {name:['소용돌이 해역','漩涡海域'],segs:{a:[[225,58],[370,112],[410,250],[362,400],[232,452],[108,402],[88,272],[168,190],[292,218],[312,318],[232,362],[212,432],[198,520],[118,592],[198,662],[225,704]]},start:['a'],next:{},vent:[['a',.55]]},
  {name:['급류 갈림길','急流岔路'],segs:{a:[[225,58],[225,142]],b:[[225,142],[118,182],[66,282],[88,402],[158,462],[225,502]],c:[[225,142],[332,202],[342,332],[282,432],[225,502]],
    d:[[225,502],[148,562],[168,642],[225,704]]},start:['a'],next:{a:{g:'g1',to:['b','c']},b:'d',c:'d'},cur:[['c',.08,.92,1.6]],vent:[['d',.3]]},
  {name:['심연의 둥지','深渊巢穴'],segs:{a:[[96,58],[108,150],[225,232]],b:[[354,58],[342,150],[225,232]],
    c:[[225,232],[92,300],[80,420],[225,500]],d:[[225,232],[358,300],[370,420],[225,500]],e:[[225,500],[305,572],[252,650],[225,704]]},
    start:['a','b'],next:{a:{g:'g1',to:['c','d']},b:{g:'g1',to:['c','d']},c:'e',d:'e'},vent:[['e',.35]],cur:[['c',.15,.5,1.45],['d',.5,.85,1.45]]},
];
/* ---------- 이야기와 구역: 5구역 × 10판 = 50판 ---------- */
const AREAS=[
  {n:['빛 잃은 산호 숲','失光珊瑚林'],boss:'boss',tint:null,lays:[0,1,2,3,5,0,4,2,5,6],
    intro:[['피난민들이 처음 자리 잡은 얕은 산호 숲.','难民们最初落脚的浅海珊瑚林。'],['빛을 잃은 산호 사이로 첫 번째 심연의 무리가 나타났어요.','失去光芒的珊瑚之间，第一批深渊之群出现了。']],
    end:['아귀왕이 쓰러지자 그 등에서 녹슨 군용 표식이 떨어졌어요. 오염은 더 아래, 옛 군항에서 오고 있어요.','鮟鱇王倒下时，背上掉下一块生锈的军用标识。污染来自更深处的旧军港。']},
  {n:['가라앉은 항구','沉没港湾'],boss:'boss2',tint:'rgba(40,55,70,.42)',lays:[1,2,5,0,6,3,2,4,5,6],
    intro:[['전쟁 때 폭격으로 가라앉은 군항.','战争中被轰炸沉没的军港。'],['부서진 군함 사이로 기름과 녹이 바다를 물들이고 있어요.','破碎的军舰之间，油污和铁锈染黑了海水。']],
    end:['강철 거북의 등껍질은 군함의 장갑판이었어요. 누군가 바다 밑에 무언가를 계속 버렸던 거예요.','钢铁龟的背甲原来是军舰的装甲板。有人一直在往海底丢弃什么。']},
  {n:['열수 분출구','热泉喷口'],boss:'boss3',tint:'rgba(110,40,10,.32)',lays:[3,4,0,5,6,2,1,3,4,6],vent:1,
    intro:[['바다 밑 화산이 끓는 곳. 피난민들의 마지막 에너지원이에요.','海底火山沸腾之处，是难民们最后的能源。'],['심연이 이곳의 열을 삼키며 점점 강해지고 있어요.','深渊正吞噬这里的热量，变得越来越强。']],
    end:['여왕의 껍질 속에 빛나는 금속 조각이 박혀 있었어요. "심연 폭탄"… 전쟁의 마지막 무기 이름이었죠.','女王的壳里嵌着发光的金属碎片。「深渊炸弹」……那是战争最后的武器之名。']},
  {n:['해초 미궁','海藻迷宫'],boss:'boss4',tint:'rgba(10,70,30,.34)',lays:[4,5,2,6,1,3,5,0,2,6],cur:1,
    intro:[['거대한 해초 숲이 미로처럼 얽힌 곳.','巨大的海藻林如迷宫般交错。'],['길을 잃은 피난선의 흔적이 곳곳에 남아 있어요.','到处都是迷途难民船留下的痕迹。']],
    end:['검은 장막이 걷히자 해구 끝에서 거대한 보랏빛 문이 보였어요.','黑幕散去，海沟尽头出现了一扇巨大的紫色之门。']},
  {n:['심연의 문','深渊之门'],boss:'boss5',tint:'rgba(50,0,70,.45)',lays:[6,5,4,2,3,6,5,4,2,6],cur:1,vent:1,
    intro:[['전쟁이 버린 심연 폭탄이 잠든 곳.','被战争遗弃的深渊炸弹沉睡之处。'],['여기를 막지 못하면 바다도 육지처럼 죽어요.','若不能在此阻止，大海也会像陆地一样死去。']],
    end:['심연의 핵이 잠잠해지자 바다에 다시 빛이 돌아왔어요. 육지는 아직 잿빛이지만, 사람들은 바다에서 다시 살아가는 법을 배웠어요.','深渊之核平息后，光芒重回大海。陆地依旧灰暗，但人们学会了在海中重新生活。']},
];
const PROLOGUE=[
  ['전쟁은 끝나지 않았어요. 불타 버린 땅에는 더 이상 아무것도 자라지 않았죠.','战争从未停止。烧焦的大地上，再也长不出任何东西。'],
  ['살아남은 사람들은 바다로 내려왔어요. 깊은 바다 밑 고대 신전의 "숨결 결계" 안에서만 숨을 쉴 수 있었거든요.','幸存者们潜入大海。只有在深海古神殿的「呼吸结界」中，人才能呼吸。'],
  ['하지만 전쟁 때 바다에 버린 무기와 폐기물이 잠든 "심연"을 깨웠어요. 보랏빛으로 물든 바다 생물들이 신전으로 몰려와요.','然而战争时丢进大海的武器和废料，唤醒了沉睡的「深渊」。被染成紫色的海洋生物涌向神殿。'],
  ['전쟁을 버린 잠수 공병 "가드". 이번엔 부수지 않고, 지키기로 했어요.','抛下战争的潜水工兵「卫士」。这一次，他选择守护，而不是摧毁。'],
];
const PER_AREA=10,STAGE_N=AREAS.length*PER_AREA;
const START_LIVES=20,WAVE_GAP=9,EARLY_BONUS=3,CARD_EVERY=3;
const KEYS={start:1,every:2,max:3};
const VENT={lift:1.1,cd:3.5,amp:.3};
const SAFE=85;   // 심연 동굴에서 나와 이만큼 헤엄칠 때까지는 수호탑이 노리지 않는다(나오자마자 잡혀서 적이 안 보이는 것 방지). 동굴 근처엔 자리도 두지 않는다
const STAR_LIVES=[18,10];     // 남은 생명 18 이상 ★3, 10 이상 ★2
/* 판 i 정보: 1구역은 손으로 다듬은 표, 그 뒤는 규칙으로 만든다 */
const STAGE_FIX=[
  {spots:9, waves:8},{spots:9, waves:8},{spots:10,waves:9},{spots:10,waves:9},{spots:10,waves:10},
  {spots:10,waves:10,cur:[['a',.3,.46,1.5]],vent:[['a',.66]]},{spots:11,waves:11},{spots:11,waves:10,cur:[['c',.3,.7,1.35]],vent:[['d',.4],['b',.5]]},{spots:11,waves:12},{spots:12,waves:12},
];
const HPK=3.2,HPA=.26,BUDK=1.4,BUDCAP=24;   // 적 체력 기본 배수 · 구역당 추가 · 판당 예산 증가 · 예산 상한
const EASE={0:.72,1:.85,39:.93,43:.88};   // 봇 검사에서 튀게 어려웠던 판만 살짝 낮춤
const SAW=[.88,.93,.97,1,1.06,.95,1,1.04,1.08,1];   // 구역 안 난이도 톱니(첫 판 쉽게, 5번째 정예, 9번째 고비)
function stageInfo(i){
  const a=Math.floor(i/PER_AREA),n=i%PER_AREA,A=AREAS[a],F=a===0?STAGE_FIX[n]:null,lay=A.lays[n],L=LAYOUTS[lay];
  const U=Object.keys(KIND_AT).filter(k=>KIND_AT[k]<=i&&k!=='minnow'),kinds=['minnow',...U.slice(-5)].sort((p,q)=>ENEMIES[p].cost-ENEMIES[q].cost);
  const fr=Object.keys(KIND_AT).find(k=>KIND_AT[k]===i&&i>0);if(fr){kinds.splice(kinds.indexOf(fr),1);kinds.splice(Math.min(2,kinds.length),0,fr);}
  const last=Object.keys(L.segs).find(id=>!L.next[id]),first=L.start[0];
  const cur=F?F.cur||[]:A.cur?[[first,.4,.85,1.45]]:[],vent=F?F.vent||[]:A.vent?[[last,.45]]:[];
  return {i,area:a,n,lay,mir:a===0?(n===5||n===7||n===8?1:0):(i%2),spots:F?F.spots:9+Math.min(3,Math.floor(n/3)+(a>=2?1:0)),waves:F?F.waves:8+Math.min(5,Math.floor(n/2)+Math.min(2,a)),
    mid:n===4,boss:n===PER_AREA-1?A.boss:'',kinds,fresh:fr||'',cur,vent,
    hp:HPK*masteryMul(recLv(i))*SAW[n]*(1+a*HPA)*(EASE[i]||1),budget:11+Math.min(BUDCAP,i*BUDK),gold:200+Math.min(160,i*6),sTier:sTierOf(i),startMut:Math.min(4,Math.floor(i/8)),rec:recLv(i)};
}
function waveDef(si,w){
  const S=stageInfo(si),last=w===S.waves,budget=S.budget*(1+.33*(w-1)),ks=S.kinds.slice(0,Math.min(S.kinds.length,1+Math.ceil(w*.7))),groups=[];
  const n=w<3?1:w<6?2:3,nStart=LAYOUTS[S.lay].start.length;
  for(let j=0;j<n;j++){const k=ks[(w*2+j*3+si)%ks.length],E=ENEMIES[k],cnt=Math.max(1,Math.round(budget/n/E.cost));
    groups.push({k,n:cnt,gap:k==='minnow'?.32:E.cost>2.5?1.5:.75,delay:j*3.4,start:(w+j)%nStart});}
  if(S.fresh&&w===2)groups.push({k:S.fresh,n:Math.max(1,Math.round(2.6/ENEMIES[S.fresh].cost)),gap:1.4,delay:1,start:0});
  if(w%4===0&&!last&&si>=3)groups.push({k:'elite',n:1+Math.floor(si/20),gap:3,delay:2,start:w%nStart});
  if(last&&S.boss)groups.push({k:S.boss,n:1,gap:1,delay:4,start:0});
  else if(last)groups.push({k:'elite',n:S.mid?3:1+Math.floor(si/12),gap:2.6,delay:3,start:0});
  return {w,groups,hp:S.hp*(1+.11*(w-1)),bonus:20+4*w};
}
/* 보상(코인): 이기면 기본 × 별, 지면 조금. 첫 클리어 보너스 */
const REWARD={base:130,stage:.15,star:[0,.7,.85,1],lose:.25};
const stageCoins=(i,st)=>Math.round(REWARD.base*(1+REWARD.stage*i)*(st?REWARD.star[st]:REWARD.lose));
const firstBonus=i=>150+i*30+(i%PER_AREA===PER_AREA-1?400:0);
const LOGIN=[100,150,200,250,300,400,600];
const MIS={kill:[300,150,['심연 생물 300마리 물리치기','击退300只深渊生物']],win:[3,200,['3판 이기기','赢得3关']],star:[6,180,['별 6개 모으기','收集6颗星']],
  awaken:[2,150,['수호탑 2번 각성시키기','觉醒守护塔2次']],cmd:[8,150,['지휘 스킬 8번 쓰기','使用指挥技能8次']],card:[6,120,['축복 카드 6장 고르기','选择6张祝福卡']]};

/* ---------- 카드: 3웨이브마다 축복 1장을 고르고, 심연도 변이 1개를 얻는다 ---------- */
const BLESS={
  allDmg:  {ic:'⚔',n:['모든 수호탑 공격력 +18%','全体守护塔攻击 +18%']},
  coral:   {ic:'🪸',n:['산호 궁수 연사 +35%','珊瑚弓手射速 +35%'],need:'coral'},
  bubble:  {ic:'🫧',n:['거품 둔화 +15%, 감옥 +0.5초','泡泡减速 +15%，牢笼 +0.5秒'],need:'bubble'},
  jelly:   {ic:'⚡',n:['해파리 번개 연쇄 +2','水母闪电连锁 +2'],need:'jelly'},
  conch:   {ic:'🐚',n:['소라 대포 폭발 범위 +35%','海螺炮爆炸范围 +35%'],need:'conch'},
  rune:    {ic:'🔮',n:['룬 등불 증폭 +12%','符文灯增幅 +12%'],need:'rune'},
  skill:   {ic:'✦',n:['모든 수호탑 스킬 +1단계','全体守护塔技能 +1级']},
  gold:    {ic:'💎',n:['진주 수확: 즉시 +120, 웨이브마다 +15','珍珠收获：立即 +120，每波 +15']},
  lives:   {ic:'💗',n:['신전 수복: 생명 +5','神殿修复：生命 +5']},
  hero:    {ic:'🤖',n:['가드 강화: 공격 +50%, 스킬 쿨 -25%','卫士强化：攻击 +50%，技能冷却 -25%']},
  discount:{ic:'🏷',n:['건설·강화 비용 -15%','建造/升级费用 -15%']},
  reverse: {ic:'🌀',n:['역류: 빠른 해류가 느린 해류로','逆流：急流变缓流'],needCur:1},
  key:     {ic:'🔑',n:['수문 열쇠 +2, 최대 +1','水闸钥匙 +2，上限 +1'],needGate:1},
  vent:    {ic:'⛲',n:['거품 기둥 강화: 더 자주, 더 오래','泡泡柱强化：更频繁更持久'],needVent:1},
};

const MUTS={
  armor: {ic:'🛡',n:['단단한 껍질: 갑옷 +12%','坚硬外壳：护甲 +12%']},
  speed: {ic:'💨',n:['거센 물살: 이동 속도 +12%','汹涌水流：移速 +12%']},
  regen: {ic:'💚',n:['재생: 초당 체력 1.2% 회복','再生：每秒回复 1.2% 生命']},
  shield:{ic:'🔰',n:['심연 보호막: 체력 15% 보호막','深渊护盾：15% 生命护盾']},
  spawn: {ic:'🥚',n:['포자: 쓰러지면 30% 확률로 치어','孢子：倒下时 30% 几率生出小鱼']},
  shadow:{ic:'👁',n:['그림자 물듦: 일부가 주기적으로 투명','暗影侵染：部分敌人周期性隐身']},
  hp:    {ic:'❤',n:['비대화: 체력 +15%','巨大化：生命 +15%']},
};
const MUT_ORDER=['hp','armor','speed','shield','regen','spawn','shadow'];
/* 정해진 씨앗으로 고른다(무작위지만 같은 판은 항상 같은 순서) */
function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}

/* ============================== 게임 규칙: 화면·소리를 모르고 1/60초 고정 틱으로 돈다 (봇이 Node 에서 그대로 실행) ============================== */
const DT=1/TICK;
const dist=(a,b,c,d)=>Math.hypot(a-c,b-d);
const isBoss=k=>!!ENEMIES[k].ph;
/* ---------- 곡선 길 ---------- */
function catmull(pts){
  const out=[],P=[pts[0],...pts,pts[pts.length-1]];
  for(let i=1;i<P.length-2;i++){const p0=P[i-1],p1=P[i],p2=P[i+1],p3=P[i+2],n=Math.max(2,Math.ceil(dist(p1[0],p1[1],p2[0],p2[1])/4));
    for(let j=0;j<n;j++){const t=j/n,t2=t*t,t3=t2*t,f=k=>.5*(2*p1[k]+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3);out.push([f(0),f(1)]);}}
  out.push(pts[pts.length-1].slice());return out;
}
function mkSeg(id,pts){const p=catmull(pts),cum=[0];for(let i=1;i<p.length;i++)cum.push(cum[i-1]+dist(p[i-1][0],p[i-1][1],p[i][0],p[i][1]));return {id,p,cum,len:cum[cum.length-1]};}
function segPos(S,d){
  const c=S.cum;if(d<=0)return {x:S.p[0][0],y:S.p[0][1],a:Math.atan2(S.p[1][1]-S.p[0][1],S.p[1][0]-S.p[0][0])};
  if(d>=S.len){const n=S.p.length;return {x:S.p[n-1][0],y:S.p[n-1][1],a:Math.atan2(S.p[n-1][1]-S.p[n-2][1],S.p[n-1][0]-S.p[n-2][0])};}
  let lo=0,hi=c.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(c[m]<=d)lo=m;else hi=m;}
  const a=S.p[lo],b=S.p[hi],f=(d-c[lo])/((c[hi]-c[lo])||1);return {x:a[0]+(b[0]-a[0])*f,y:a[1]+(b[1]-a[1])*f,a:Math.atan2(b[1]-a[1],b[0]-a[0])};
}
const MAPS={};
function buildMap(si){
  if(MAPS[si])return MAPS[si];
  const S=stageInfo(si),Ldef=LAYOUTS[S.lay],mx=x=>S.mir?W-x:x,segs={};
  for(const id in Ldef.segs)segs[id]=mkSeg(id,Ldef.segs[id].map(q=>[mx(q[0]),q[1]]));
  const gates={};
  for(const id in Ldef.next){const n=Ldef.next[id];if(typeof n==='object'){const e=segs[id].p[segs[id].p.length-1];
    if(!gates[n.g])gates[n.g]={g:n.g,x:e[0],y:e[1],to:n.to.slice(),st:0};}}
  const cur=[...(Ldef.cur||[]),...S.cur].map(c=>({seg:c[0],d0:c[1]*segs[c[0]].len,d1:c[2]*segs[c[0]].len,mul:c[3]}));
  const vents=[...(Ldef.vent||[]),...S.vent].map(v=>{const P=segPos(segs[v[0]],v[1]*segs[v[0]].len);return {seg:v[0],d:v[1]*segs[v[0]].len,x:P.x,y:P.y,cd:0};});
  /* 수호탑 자리: 길에서 적당히 떨어진 바위 위, 길을 많이 덮는 곳부터 고른다 */
  const pts=[];for(const id in segs){const s=segs[id];for(let i=0;i<s.p.length;i+=2)pts.push(s.p[i]);}
  const cov=pts.filter((_,i)=>i%2===0),cnt=new Array(cov.length).fill(0),spots=[],caves=Ldef.start.map(id=>segs[id].p[0]);
  const cands=[];
  for(let y=84;y<=680;y+=6)for(let x=26;x<=424;x+=6){
    let md=1e9;for(const p of pts){const d=(p[0]-x)*(p[0]-x)+(p[1]-y)*(p[1]-y);if(d<md)md=d;}md=Math.sqrt(md);
    if(md<45||md>66||dist(x,y,TEMPLE.x,TEMPLE.y)<100||(Math.abs(x-TEMPLE.x)<92&&y>TEMPLE.y-118)||caves.some(c=>dist(x,y,c[0],c[1])<SAFE+35)||Object.values(gates).some(g=>dist(x,y,g.x,g.y)<34))continue;
    const near=[];cov.forEach((p,i)=>{if(dist(x,y,p[0],p[1])<105)near.push(i);});cands.push({x,y,near});
  }
  for(let k=0;k<S.spots;k++){
    let best=null,bs=-1;
    for(const c of cands){if(spots.some(s=>dist(s.x,s.y,c.x,c.y)<52))continue;let sc=0;for(const i of c.near)sc+=1/(1+cnt[i]*1.6);if(sc>bs){bs=sc;best=c;}}
    if(!best)break;spots.push({x:best.x,y:best.y});for(const i of best.near)cnt[i]++;
  }
  return MAPS[si]={si,name:Ldef.name,segs,start:Ldef.start,next:Ldef.next,gates,cur,vents,spots,caves};
}

/* ---------- 한 판 ---------- */
class Game{
  constructor(si,meta){
    this.lv={};for(const k of [...TOWER_IDS,'hero'])this.lv[k]=meta&&meta.lv&&meta.lv[k]||(meta&&meta.lv?1:recLv(si));
    this.cmdCd={slam:0};this.crewCd={};this.allies=[];this.ampT=0;this.purified=0;this.hasteT=0;this.hasteMul=0;this.cmdUsed=0;this.awakened=0;this.cardsPicked=0;
    const S=this.S=stageInfo(si);this.si=si;this.M=buildMap(si);
    for(const g in this.M.gates)this.M.gates[g].st=0;for(const v of this.M.vents)v.cd=0;
    this.t=0;this.gold=S.gold;this.lives=START_LIVES;this.lost=0;this.wave=0;this.nextT=0;this.spawning=false;this.spawnQ=[];
    this.towers=[];this.enemies=[];this.projs=[];this.zones=[];this.ev=[];this.uid=1;this.kills=0;
    this.rnd=rng(9001+si*7919);this.state='prep';this.cardedAt=0;this.cards=null;this.pendMut=null;
    this.mut={hp:0,armor:0,speed:0,shield:0,regen:0,spawn:0,shadow:0};this.mutList=[];
    this.B={dmg:0,coral:0,bubSlow:0,trap:0,chain:0,conchR:0,aura:0,tier:0,waveGold:0,hero:0,heroCd:1,disc:0,rev:false,ventCd:1,ventLift:0};this.blessList=[];
    this.hasGate=Object.keys(this.M.gates).length>0;this.hasCur=this.M.cur.length>0;this.hasVent=this.M.vents.length>0;
    this.keys=this.hasGate?KEYS.start:0;this.keyMax=KEYS.max;
    for(let i=0;i<S.startMut;i++)this.addMut(this.pickMut());
    this.hero={x:TEMPLE.x,y:TEMPLE.y-104,tx:null,ty:null,lv:1,xp:0,cd:0,sc:0,face:1,atk:0,moving:false};
  }
  /* ---- 계산 ---- */
  tier(){return this.S.sTier+this.B.tier;}
  tw(k){return masteryMul(this.lv[k]||1);}
  cost(k){return Math.round(TOWERS[k].cost*(1-this.B.disc));}
  upCost(t){return t.lv>=MAX_TLV?0:Math.round(TOWERS[t.k].cost*UP_COST[t.lv-1]*(1-this.B.disc));}
  sellVal(t){return Math.round(t.spent*SELL);}
  unlocked(k){return UNLOCK[k]<=this.si;}
  range(t){return TOWERS[t.k].range*LV_RANGE[t.lv-1]*(t.ink>0?.6:1);}
  dmg(t){return TOWERS[t.k].dmg*LV_DMG[t.lv-1]*this.tw(t.k)*(t.br==='giant'?1.25:t.br==='purge'?1.8:1)*(1+this.B.dmg)*(1+t.aura)*(this.ampT>0?1+CREW.rune.amp:1);}
  rate(t){return TOWERS[t.k].cd/(1+t.haste+(t.k==='coral'?this.B.coral:0)+(t.br==='storm'?.5:0))*(t.ink>0?1.5:1);}
  heroDmg(){return HERO.dmg*this.tw('hero')*(1+.22*(this.hero.lv-1))*(1+this.B.hero);}
  visible(e){return !e.inv||e.rev;}
  /* ---- 조작 ---- */
  build(spot,k){const c=this.cost(k);if(this.gold<c||!this.unlocked(k)||this.towers.some(t=>t.spot===spot))return false;
    const s=this.M.spots[spot],t={id:this.uid++,k,lv:1,x:s.x,y:s.y,spot,cd:.2,sc:0,shots:0,ink:0,haste:0,hasteT:0,aura:0,kick:0,ang:-Math.PI/2,spent:c,whirl:false,beam:0};
    t.sc=this.skillCdOf(t)*.5;this.gold-=c;this.towers.push(t);this.ev.push({t:'build',x:s.x,y:s.y,k});return true;}
  upgrade(t,b){const c=this.upCost(t);if(!c||this.gold<c)return false;if(t.lv===MAX_TLV-1){if(b!==0&&b!==1)return false;t.br=BRANCH[t.k][b].id;this.awakened++;}
    this.gold-=c;t.spent+=c;t.lv++;this.ev.push({t:t.lv===MAX_TLV?'awaken':'up',x:t.x,y:t.y,k:t.k});return true;}
  sell(t){this.gold+=this.sellVal(t);this.towers=this.towers.filter(x=>x!==t);this.ev.push({t:'sell',x:t.x,y:t.y});}
  clean(t){if(t.ink>0){t.ink=0;this.ev.push({t:'clean',x:t.x,y:t.y});return true;}return false;}
  flipGate(g){const G=this.M.gates[g];if(!G||this.keys<=0)return false;this.keys--;G.st^=1;G.flash=1;this.ev.push({t:'gate',x:G.x,y:G.y});return true;}
  moveHero(x,y){const h=this.hero;h.tx=Math.max(20,Math.min(W-20,x));h.ty=Math.max(70,Math.min(700,y));}
  cmdReady(k){return this.si>=CMD[k].from&&this.cmdCd[k]<=0&&this.state==='run';}
  cmd(k,x,y){if(!this.cmdReady(k))return false;const C=CMD[k],h=this.hero,m=this.tw('hero')*(1+.22*(h.lv-1))*(1+this.B.hero);
    if(k==='slam'){for(const e of this.enemies)if(!e.dead&&dist(e.x,e.y,h.x,h.y)<C.r+e.r){this.hurt(e,C.dmg*m,'exp');e.stun=Math.max(e.stun,isBoss(e.k)?.3:C.stun);}this.ev.push({t:'slam',x:h.x,y:h.y,r:C.r});}
    else if(k==='torpedo'){for(const e of this.enemies)if(!e.dead&&dist(e.x,e.y,x,y)<C.r+e.r)this.hurt(e,C.dmg*m*(dist(e.x,e.y,x,y)<C.r*.5?1:.7),'exp');this.ev.push({t:'torp',x,y,r:C.r});}
    else{for(const e of this.enemies){if(e.dead)continue;this.hurt(e,C.dmg*m,'mag');if(e.dead||isBoss(e.k))continue;e.kb=C.push*(e.k==='elite'?.5:1);e.slow=Math.max(e.slow,C.slow);e.slowT=Math.max(e.slowT,C.slowT);}this.ev.push({t:'tide'});}
    this.cmdCd[k]=C.cd*this.B.heroCd;this.cmdUsed++;return true;}
  crewPw(k){let p=0;for(const t of this.towers)if(t.k===k)p+=LV_DMG[t.lv-1];return p;}
  crewReady(k){return CREW[k]&&CREW[k].sk&&this.state==='run'&&!(this.crewCd[k]>0)&&this.towers.some(t=>t.k===k);}
  crewSkill(k){if(!this.crewReady(k))return false;const C=CREW[k],pw=Math.min(6,this.crewPw(k)),m=this.tw(k)*(1+this.B.dmg);
    if(k==='coral'){for(const t of this.towers)if(t.k==='coral'){t.haste=Math.max(t.haste,1);t.hasteT=C.dur;}}
    else if(k==='bubble'){for(const e of this.enemies){if(e.dead)continue;this.hurt(e,C.dmg*pw*m,'mag');if(!e.dead&&!isBoss(e.k)){e.slow=Math.max(e.slow,C.slow);e.slowT=Math.max(e.slowT,C.dur);}}}
    else if(k==='jelly'){for(const e of this.enemies){if(e.dead||e.spawnT>.45)continue;this.hurt(e,C.dmg*pw*m,'mag');if(!e.dead)e.stun=Math.max(e.stun,isBoss(e.k)?.2:C.stun);}}
    else if(k==='conch'){const tg=this.enemies.filter(e=>!e.dead).sort((a,b)=>b.prog-a.prog)[0];if(!tg)return false;for(const t of this.towers)if(t.k==='conch')this.projs.push({kind:'shell',x:t.x,y:t.y-16,tx:tg.x,ty:tg.y,tid:tg.id,sp:420,dmg:this.dmg(t)*1.6,cls:'exp',from:'conch',lv:t.lv,a:0,br:t.br});}
    else if(k==='rune'){this.ampT=C.dur;}
    this.crewCd[k]=C.cd;this.cmdUsed++;this.ev.push({t:'crew',k});return true;}
  /* 정화된 생물이 잠깐 우리 편이 된다 */
  purify(e){const P=PURE[e.k];this.purified++;if(!P||(this.allies.length>40&&P.act!=='gift'))return;
    const a={id:this.uid++,k:e.k,act:P.act,x:e.x,y:e.y,a:e.a,seg:e.seg,d:e.d,prog:e.prog,r:e.r,t:P.t||1.1,T:P.t||1.1,hit:new Set(),pure:1};
    if(P.act==='gift'){this.gold+=P.gold;a.t=a.T=.9;}
    else if(P.act==='shock'){const near=this.enemies.filter(o=>!o.dead&&o!==e&&dist(o.x,o.y,e.x,e.y)<P.r).sort((p,q)=>dist(p.x,p.y,e.x,e.y)-dist(q.x,q.y,e.x,e.y)).slice(0,P.n),pts=[[e.x,e.y]];
      for(const o of near){pts.push([o.x,o.y]);this.hurt(o,P.dmg*this.S.hp,'mag');if(!o.dead&&!isBoss(o.k))o.stun=Math.max(o.stun,P.stun);}if(near.length)this.ev.push({t:'zap',pts,pure:1});a.t=a.T=1.2;}
    else if(P.act==='sweep'){a.left=P.len;a.t=a.T=P.len/P.sp+.4;}
    else if(P.act==='block'&&P.stun){for(const o of this.enemies)if(!o.dead&&o!==e&&!isBoss(o.k)&&dist(o.x,o.y,e.x,e.y)<60)o.stun=Math.max(o.stun,P.stun);}
    this.allies.push(a);this.ev.push({t:'pure',x:e.x,y:e.y,k:e.k,act:P.act});}
  allyTick(dt){for(const a of this.allies){a.t-=dt;
      if(a.act==='sweep'&&a.left>0){const P=PURE[a.k],st=Math.min(a.left,P.sp*dt,a.d);a.left=st<=0?0:a.left-st;a.d-=st;a.prog-=st;const Q=segPos(this.M.segs[a.seg],a.d);a.x=Q.x;a.y=Q.y;a.a=Q.a+Math.PI;
        for(const o of this.enemies)if(!o.dead&&!a.hit.has(o.id)&&dist(o.x,o.y,a.x,a.y)<o.r+14){a.hit.add(o.id);this.hurt(o,P.dmg*this.S.hp,'mag');if(!o.dead&&!isBoss(o.k)){o.kb=Math.max(o.kb||0,18);}this.ev.push({t:'hit',x:o.x,y:o.y,k:'bolt'});}}
      else if(a.act==='gift'){a.y-=40*dt;a.x+=Math.cos(a.a)*30*dt;}
      else if(a.act==='shock'||a.left===0){a.y-=18*dt;}}
    this.allies=this.allies.filter(a=>a.t>0);}
  callWave(){if(this.state==='prep'){this.requestWave();return true;}
    if(this.state!=='run'||this.spawning||this.wave>=this.S.waves)return false;
    if(this.nextT>0)this.gold+=Math.ceil(this.nextT)*EARLY_BONUS;this.requestWave();return true;}
  requestWave(){
    if(this.wave>0&&this.wave%CARD_EVERY===0&&this.cardedAt!==this.wave){this.cardedAt=this.wave;this.cards=this.genCards();this.pendMut=this.si<3?null:this.pickMut();this.state='card';this.ev.push({t:'cards'});return;}
    this.startWave();
  }
  pickCard(i){if(this.state!=='card')return;const k=this.cards[i];this.applyBless(k);this.cardsPicked++;if(this.pendMut)this.addMut(this.pendMut);this.cards=null;this.state='run';this.startWave();}
  /* ---- 카드 ---- */
  pickMut(){const cand=MUT_ORDER.filter(k=>!((k==='shadow'||k==='spawn')&&this.mut[k]>=2));return cand[Math.floor(this.rnd()*cand.length)];}
  addMut(k){this.mut[k]++;this.mutList.push(k);this.ev.push({t:'mut',k});}
  genCards(){
    const ok=Object.keys(BLESS).filter(k=>{const b=BLESS[k];if(b.need&&!this.unlocked(b.need))return false;if(b.needCur&&(!this.hasCur||this.B.rev))return false;
      if(b.needGate&&!this.hasGate)return false;if(b.needVent&&!this.hasVent)return false;if(k==='discount'&&this.B.disc>=.44)return false;return true;});
    const out=[];while(out.length<3&&ok.length){const j=Math.floor(this.rnd()*ok.length);out.push(ok.splice(j,1)[0]);}return out;
  }
  applyBless(k){const B=this.B;this.blessList.push(k);
    switch(k){case'allDmg':B.dmg+=.18;break;case'coral':B.coral+=.35;break;case'bubble':B.bubSlow+=.15;B.trap+=.5;break;case'jelly':B.chain+=2;break;
      case'conch':B.conchR+=.35;break;case'rune':B.aura+=.12;break;case'skill':B.tier++;break;case'gold':this.gold+=120;B.waveGold+=15;break;
      case'lives':this.lives+=5;break;case'hero':B.hero+=.5;B.heroCd*=.75;break;case'discount':B.disc+=.15;break;case'reverse':B.rev=true;break;
      case'key':this.keyMax++;this.keys=Math.min(this.keyMax,this.keys+2);break;case'vent':B.ventCd*=.6;B.ventLift+=.5;break;}}
  /* ---- 파도 ---- */
  startWave(){
    this.wave++;const W_=waveDef(this.si,this.wave);this.state='run';this.spawning=true;this.nextT=0;
    if(this.wave>1)this.gold+=W_.bonus+this.B.waveGold;
    if(this.hasGate&&this.wave>1&&this.wave%KEYS.every===0)this.keys=Math.min(this.keyMax,this.keys+1);
    let gi=0,changed=false;for(const g in this.M.gates){const G=this.M.gates[g],st=Math.floor((this.wave-1)/2+gi)%2;if(st!==G.st){G.st=st;G.flash=1;changed=true;}gi++;}
    for(const gr of W_.groups)for(let j=0;j<gr.n;j++)this.spawnQ.push({k:gr.k,at:this.t+gr.delay+gr.gap*j,start:gr.start,hp:W_.hp});
    this.spawnQ.sort((a,b)=>a.at-b.at);this.ev.push({t:'wave',w:this.wave,boss:W_.groups.some(g=>isBoss(g.k)),cur:changed});
  }
  spawn(k,start,hpm,at){
    const E=ENEMIES[k],M=this.M,boss=isBoss(k),on=this.si>=(E.from||0),elite=k==='elite';
    let mhp=E.hp*(boss?this.S.hp:hpm)*(1+.15*this.mut.hp);
    const e={id:this.uid++,k,mhp,hp:mhp,sp:E.sp*(1+.12*this.mut.speed),r:E.r,armor:Math.min(.75,(E.armor||0)+.12*this.mut.armor),seg:at?at.seg:M.start[start],d:at?at.d:0,prog:at?at.prog:0,
      x:0,y:0,a:0,slow:0,slowT:0,stun:0,trap:0,lift:0,dashT:0,dashed:false,inv:false,rev:false,phT:0,phase:null,hT:2,iT:3,lastHit:9,shield:0,shellMax:0,spawnT:at?.2:.7,leak:E.leak||(E.cost>=5?2:1),dead:false,hitT:0,bossPh:0};
    e.shield=mhp*.15*this.mut.shield*(boss?.5:1);
    if(E.phase&&on)e.phase=E.phase;else if(this.mut.shadow&&!boss&&!elite&&this.rnd()<.12+.13*this.mut.shadow)e.phase=[4.5,2.2];
    if(e.phase)e.phT=e.phase[0]*this.rnd();
    if(E.shell&&on){e.shellMax=mhp*E.shell;e.shield+=e.shellMax;}
    if(at){e.d+=(this.rnd()-.5)*20;}
    const P=segPos(M.segs[e.seg],e.d);e.x=P.x;e.y=P.y;e.a=P.a;this.enemies.push(e);return e;
  }
  /* ---- 피해 ---- */
  hurt(e,d,cls){
    if(e.dead)return;const eff=cls==='phy'?e.armor:cls==='exp'?e.armor*.5:0;d*=(1-eff);if(e.trap>0||e.lift>0)d*=1+VENT.amp;
    e.lastHit=0;e.hitT=.12;e.vd=(e.vd||0)+d;if(e.shield>0){const a=Math.min(e.shield,d);e.shield-=a;d-=a;}
    e.hp-=d;if(e.hp<=0)this.kill(e);
  }
  kill(e){
    e.dead=true;const E=ENEMIES[e.k],gg=E.gold;this.gold+=gg;this.kills++;this.ev.push({t:'kill',x:e.x,y:e.y,k:e.k,g:gg,f:Math.cos(e.a)<0?-1:1,vd:e.vd||0});
    const h=this.hero;h.xp+=E.cost||8;while(h.lv<HERO.lvXp.length&&h.xp>=HERO.lvXp[h.lv]){h.lv++;this.ev.push({t:'hlv',x:h.x,y:h.y});}
    this.purify(e);const at={seg:e.seg,d:e.d,prog:e.prog};
    if(E.split&&this.si>=(E.from||0))for(let i=0;i<E.split;i++)this.spawn('minnow',0,e.mhp/E.hp*.9,at);
    else if(this.mut.spawn&&e.k!=='minnow'&&this.rnd()<.15+.15*this.mut.spawn)this.spawn('minnow',0,e.mhp/E.hp*.9,at);
  }
  /* ---- 한 틱 ---- */
  tick(){
    if(this.state!=='run')return;const dt=DT;this.t+=dt;const M=this.M,B=this.B;
    while(this.spawnQ.length&&this.spawnQ[0].at<=this.t){const q=this.spawnQ.shift();this.spawn(q.k,q.start,q.hp);}
    if(this.spawning&&!this.spawnQ.length){this.spawning=false;if(this.wave<this.S.waves)this.nextT=WAVE_GAP;}
    if(!this.spawning&&this.nextT>0){this.nextT-=dt;if(this.nextT<=0){this.nextT=0;this.requestWave();if(this.state!=='run')return;}}
    for(const v of M.vents)if(v.cd>0)v.cd-=dt;
    for(const g in M.gates)if(M.gates[g].flash>0)M.gates[g].flash-=dt;
    /* 적 */
    if(this.hasteT>0)this.hasteT-=dt;if(this.ampT>0)this.ampT-=dt;for(const k in this.crewCd)if(this.crewCd[k]>0)this.crewCd[k]-=dt;
    const blocks=this.allies.filter(a=>a.act==='block');for(const k in this.cmdCd)if(this.cmdCd[k]>0)this.cmdCd[k]-=dt;
    const cmdrs=this.enemies.filter(e=>!e.dead&&ENEMIES[e.k].command),minn=this.enemies.filter(e=>!e.dead&&e.k==='minnow');
    for(const e of this.enemies){
      if(e.dead)continue;const E=ENEMIES[e.k],on=this.si>=(E.from||0);e.ox=e.x;e.oy=e.y;
      if(e.spawnT>0)e.spawnT-=dt;if(e.hitT>0)e.hitT-=dt;e.lastHit+=dt;
      if(e.slowT>0){e.slowT-=dt;if(e.slowT<=0)e.slow=0;}
      if(e.stun>0)e.stun-=dt;if(e.trap>0)e.trap-=dt;if(e.lift>0)e.lift-=dt;if(e.dashT>0)e.dashT-=dt;
      if(e.purgeT>0)e.purgeT-=dt;if(e.cloakT>0){e.cloakT-=dt;e.inv=e.cloakT>0;}
      if(e.clampT>0){e.clampT-=dt;if(e.clampT<=0)e.armor-=E.clamp[1];}
      if(E.clamp&&on&&!e.clamped&&e.hp<e.mhp*E.clamp[0]){e.clamped=true;e.clampT=E.clamp[2];e.armor+=E.clamp[1];this.ev.push({t:'clamp',x:e.x,y:e.y});}
      if(e.poiT>0){e.poiT-=dt;this.hurt(e,e.poiD*dt,'mag');if(e.dead)continue;}
      if(this.mut.regen&&!(e.purgeT>0)&&e.hp<e.mhp)e.hp=Math.min(e.mhp,e.hp+e.mhp*.012*this.mut.regen*dt);
      if(e.shellMax&&!(e.purgeT>0)&&e.lastHit>3&&e.shield<e.shellMax){e.shield=e.shellMax;this.ev.push({t:'shell',x:e.x,y:e.y});}
      if(e.phase){e.phT+=dt;const cyc=e.phase[0]+e.phase[1],m=e.phT%cyc;const inv=m>e.phase[0];if(inv!==e.inv){e.inv=inv;}}
      if(E.dash&&on&&!e.dashed&&e.hp<e.mhp*.55){e.dashed=true;e.dashT=1.4;this.ev.push({t:'dash',x:e.x,y:e.y});}
      if(E.heal&&this.si>=(E.from||0)){e.hT-=dt;if(e.hT<=0){e.hT=E.heal[0];let n=0;for(const o of this.enemies)if(!o.dead&&o!==e&&!isBoss(o.k)&&dist(o.x,o.y,e.x,e.y)<E.heal[2]&&o.hp<o.mhp){o.hp=Math.min(o.mhp,o.hp+o.mhp*E.heal[1]);n++;}if(n)this.ev.push({t:'heal',x:e.x,y:e.y,r:E.heal[2]});}}
      if(E.ink&&on){e.iT-=dt;if(e.iT<=0){let bt=null,bd=E.ink[1];for(const t of this.towers){const d=dist(t.x,t.y,e.x,e.y);if(d<bd&&t.ink<=0){bd=d;bt=t;}}
        if(bt){bt.ink=E.ink[2];e.iT=E.ink[0];this.ev.push({t:'ink',x:e.x,y:e.y,tx:bt.x,ty:bt.y});}else e.iT=1;}}
      if(E.ph){const P=E.ph[e.bossPh];if(P&&e.hp/e.mhp<P[0]){e.bossPh++;this.bossAct(e,P);}}
      if(e.kb>0){const st=Math.min(e.kb,240*dt,e.d);e.kb=st<=0?0:e.kb-st;e.d-=st;e.prog-=st;const P=segPos(M.segs[e.seg],e.d);e.x=P.x;e.y=P.y;continue;}
      if(e.stun>0||e.trap>0||e.lift>0)continue;
      let v=e.sp*(1-e.slow)*(e.dashT>0?E.dash:1)*(this.hasteT>0?1+this.hasteMul:1);
      if(E.school&&on){let c=0;for(const o of minn)if(o!==e&&Math.abs(o.x-e.x)<40&&Math.abs(o.y-e.y)<40&&++c>=4)break;if(c>=4){v*=1+E.school;e.schooling=true;}else e.schooling=false;}
      if(cmdrs.length&&!E.command&&!E.ph)for(const c of cmdrs)if(dist(c.x,c.y,e.x,e.y)<ENEMIES[c.k].command[0]){v*=1+ENEMIES[c.k].command[1];break;}
      for(const c of M.cur)if(c.seg===e.seg&&e.d>=c.d0&&e.d<=c.d1){v*=(B.rev&&c.mul>1)?.62:c.mul;break;}
      if(e.spawnT>0)v*=.5;
      const d0=e.d;e.d+=v*dt;e.prog+=v*dt;
      for(const b of blocks)if(b.seg===e.seg&&b.d>=d0-1&&e.d>b.d-12){if(isBoss(e.k)){b.t=0;}else{const back=e.d-(b.d-12);e.d-=back;e.prog-=back;e.blocked=.2;}}
      if(!isBoss(e.k))for(const vt of M.vents)if(vt.seg===e.seg&&d0<vt.d&&e.d>=vt.d&&vt.cd<=0){e.lift=(VENT.lift+B.ventLift)*(e.k==='elite'?.5:1);vt.cd=VENT.cd*B.ventCd;this.ev.push({t:'vent',x:vt.x,y:vt.y});}
      let S=M.segs[e.seg];
      while(e.d>=S.len){const nx=M.next[e.seg];
        if(!nx){this.leak(e);break;}
        const ns=typeof nx==='string'?nx:nx.to[M.gates[nx.g].st];e.d-=S.len;e.seg=ns;S=M.segs[ns];}
      if(e.dead)continue;const P=segPos(S,e.d);e.x=P.x;e.y=P.y;e.a=P.a;
    }
    /* 드러내기: 해파리·룬·영웅 근처의 투명한 적은 보인다 */
    for(const e of this.enemies){if(!e.inv){e.rev=false;continue;}e.rev=dist(e.x,e.y,this.hero.x,this.hero.y)<HERO.range;
      if(!e.rev)for(const t of this.towers)if(TOWERS[t.k].reveal&&dist(t.x,t.y,e.x,e.y)<this.range(t)){e.rev=true;break;}}
    /* 수호탑 */
    for(const t of this.towers){t.aura=0;}
    for(const r of this.towers)if(r.k==='rune'){const a=TOWERS.rune.aura+.05*(r.lv-1)+B.aura+(r.br==='amp'?.2:0),rr=this.range(r);for(const t of this.towers)if(t!==r&&dist(t.x,t.y,r.x,r.y)<rr)t.aura=Math.max(t.aura,a);}
    for(const t of this.towers)this.towerTick(t,dt);
    /* 투사체 */
    for(const p of this.projs){const tg=p.tid?this.enemies.find(e=>e.id===p.tid&&!e.dead):null;if(tg){p.tx=tg.x;p.ty=tg.y;}
      const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy),st=p.sp*dt;
      if(d<=st+3){p.dead=true;this.impact(p,tg);}else{p.x+=dx/d*st;p.y+=dy/d*st;p.a=Math.atan2(dy,dx);}}
    this.projs=this.projs.filter(p=>!p.dead);
    /* 소용돌이 */
    for(const z of this.zones){z.t-=dt;for(const e of this.enemies)if(!e.dead&&dist(e.x,e.y,z.x,z.y)<z.r+e.r){this.hurt(e,z.dps*dt,'mag');if(!isBoss(e.k)){e.slow=Math.max(e.slow,z.slow);e.slowT=Math.max(e.slowT,.2);}}}
    this.zones=this.zones.filter(z=>z.t>0);
    /* 영웅 */
    this.heroTick(dt);this.allyTick(dt);
    this.enemies=this.enemies.filter(e=>!e.dead);
    if(this.lives<=0){this.lives=0;this.state='lose';this.ev.push({t:'lose'});return;}
    if(this.wave>=this.S.waves&&!this.spawning&&!this.spawnQ.length&&!this.enemies.length){this.state='win';this.ev.push({t:'win'});}
  }
  bossAct(e,P){const at={seg:e.seg,d:e.d+12,prog:e.prog},a=P[1];
    if(a==='summon'){for(let i=0;i<P[3];i++)this.spawn(P[2],0,this.S.hp*(P[2]==='minnow'?1.3:.6),at);this.ev.push({t:'roar',x:e.x,y:e.y});}
    else if(a==='ink'){for(const t of this.towers)t.ink=P[2];this.ev.push({t:'dark',x:e.x,y:e.y});}
    else if(a==='jam'){this.towers.slice().sort((p,q)=>dist(p.x,p.y,e.x,e.y)-dist(q.x,q.y,e.x,e.y)).slice(0,P[2]).forEach(t=>t.ink=P[3]);this.ev.push({t:'dark',x:e.x,y:e.y});}
    else if(a==='shield'){e.shield+=e.mhp*P[2];this.ev.push({t:'roar',x:e.x,y:e.y,m:'shield'});}
    else if(a==='haste'){this.hasteMul=P[2];this.hasteT=P[3];this.ev.push({t:'roar',x:e.x,y:e.y,m:'haste'});}
    else if(a==='cloak'){e.cloakT=P[2];this.ev.push({t:'roar',x:e.x,y:e.y,m:'cloak'});}
    else if(a==='heal'){for(const o of this.enemies)if(!o.dead)o.hp=Math.min(o.mhp,o.hp+o.mhp*P[2]);this.ev.push({t:'roar',x:e.x,y:e.y,m:'heal'});}
  }
  leak(e){e.dead=true;this.lives-=e.leak;this.lost+=e.leak;this.ev.push({t:'leak',x:e.x,y:e.y,n:e.leak});}
  stars(){return this.state!=='win'?0:this.lives>=STAR_LIVES[0]?3:this.lives>=STAR_LIVES[1]?2:1;}
  skillCdOf(t){const T=this.tier(),f=TSKILL[t.k](T);return f.cd||5;}
  target(t,r){let best=null,bp=-1;for(const e of this.enemies){if(e.dead||!this.visible(e)||e.prog<SAFE)continue;if(dist(e.x,e.y,t.x,t.y)<r+e.r*.5&&e.prog>bp){bp=e.prog;best=e;}}return best;}
  towerTick(t,dt){
    const T=TOWERS[t.k],tier=this.tier(),SK=TSKILL[t.k](tier),r=this.range(t);
    if(t.br==='tempest')SK.cd*=.6;else if(t.br==='storm')SK.every=Math.max(2,SK.every-1);else if(t.br==='frost')SK.dur*=1.6;else if(t.br==='amp')SK.dur*=1.5;
    if(t.ink>0)t.ink-=dt;if(t.kick>0)t.kick-=dt*4;if(t.hasteT>0){t.hasteT-=dt;if(t.hasteT<=0)t.haste=0;}if(t.beam>0)t.beam-=dt;
    t.cd-=dt;if(SK.cd)t.sc-=dt;
    const tg=this.target(t,r);if(tg)t.ang=Math.atan2(tg.y-t.y,tg.x-t.x);
    /* 스킬 */
    if(SK.cd&&t.sc<=0){
      if(t.k==='bubble'){let b=null;for(const e of this.enemies)if(!e.dead&&!isBoss(e.k)&&e.trap<=0&&dist(e.x,e.y,t.x,t.y)<r&&(!b||e.hp>b.hp))b=e;
        if(b){b.trap=(SK.dur+this.B.trap)*(b.k==='elite'?.5:1);t.sc=SK.cd;this.ev.push({t:'trap',x:b.x,y:b.y,id:b.id});}}
      else if(t.k==='jelly'){const hit=this.enemies.filter(e=>!e.dead&&dist(e.x,e.y,t.x,t.y)<r+e.r);
        if(hit.length>=2||hit.some(e=>e.k==='elite'||isBoss(e.k))){const dm=SK.dmg*LV_DMG[t.lv-1]*this.tw('jelly')*(1+this.B.dmg);for(const e of hit){this.hurt(e,dm,'mag');if(!e.dead)e.stun=Math.max(e.stun,isBoss(e.k)?.1:SK.stun);}
          t.sc=SK.cd;this.ev.push({t:'storm',x:t.x,y:t.y,r});}}
      else if(t.k==='conch'){if(!t.whirl&&tg){t.whirl=true;t.sc=SK.cd;}}
      else if(t.k==='rune'){if(tg){for(const o of this.towers)if(dist(o.x,o.y,t.x,t.y)<r+8){o.haste=SK.haste;o.hasteT=SK.dur;}t.sc=SK.cd;this.ev.push({t:'reso',x:t.x,y:t.y,r});}}
    }
    if(!tg||t.cd>0)return;
    t.cd=this.rate(t);t.kick=1;const dm=this.dmg(t);
    if(t.k==='jelly'){const pts=[[t.x,t.y-14]],hit=new Set();let cur=tg,dd=dm,n=T.chain+this.B.chain+(t.br==='tempest'?3:0);
      while(cur&&n>0){hit.add(cur.id);pts.push([cur.x,cur.y]);this.hurt(cur,dd,'mag');if(t.br==='paralyze'&&!cur.dead&&!isBoss(cur.k)&&this.rnd()<.25)cur.stun=Math.max(cur.stun,.5);dd*=T.fall;n--;
        let nx=null,nd=72;for(const e of this.enemies)if(!e.dead&&!hit.has(e.id)&&this.visible(e)&&e.prog>=SAFE){const d=dist(e.x,e.y,cur.x,cur.y);if(d<nd){nd=d;nx=e;}}cur=nx;}
      this.ev.push({t:'zap',pts});return;}
    if(t.k==='rune'){if(t.br==='purge'){tg.shield=Math.max(0,tg.shield-dm*2);tg.purgeT=2;}this.hurt(tg,dm,'mag');t.beam=.12;t.beamX=tg.x;t.beamY=tg.y;return;}
    if(t.k==='coral'){t.shots++;if(t.shots%SK.every===0){const a=t.ang,x2=t.x+Math.cos(a)*SK.len,y2=t.y+Math.sin(a)*SK.len;
      for(const e of this.enemies){if(e.dead)continue;const px=e.x-t.x,py=e.y-t.y,u=Math.max(0,Math.min(SK.len,px*Math.cos(a)+py*Math.sin(a))),qx=t.x+Math.cos(a)*u,qy=t.y+Math.sin(a)*u;
        if(dist(e.x,e.y,qx,qy)<e.r+8)this.hurt(e,dm*SK.mul,'phy');}
      this.ev.push({t:'pierce',x:t.x,y:t.y,x2,y2});return;}}
    if(t.br==='triple'){const c=this.enemies.filter(e=>!e.dead&&this.visible(e)&&dist(e.x,e.y,t.x,t.y)<r+e.r).sort((p,q)=>q.prog-p.prog);
      for(let i=0;i<3;i++){const g2=c[Math.min(i,c.length-1)]||tg;this.projs.push({kind:T.proj,x:t.x,y:t.y-16,tx:g2.x+(i-1)*8,ty:g2.y,tid:c.length>i?g2.id:0,sp:T.speed*(1-i*.08),dmg:dm*.55,cls:T.cls,from:t.k,lv:t.lv,a:t.ang,whirl:i===0&&t.whirl,br:t.br});}}
    else this.projs.push({kind:T.proj,x:t.x,y:t.y-16,tx:tg.x,ty:tg.y,tid:tg.id,sp:T.speed,dmg:dm,cls:T.cls,from:t.k,lv:t.lv,a:t.ang,whirl:t.k==='conch'&&t.whirl,br:t.br});
    if(t.k==='conch')t.whirl=false;
  }
  impact(p,tg){
    if(p.kind==='shell'){const R=TOWERS.conch.aoe*(1+this.B.conchR)*(p.br==='giant'?1.5:1);for(const e of this.enemies)if(!e.dead&&dist(e.x,e.y,p.tx,p.ty)<R+e.r)this.hurt(e,dist(e.x,e.y,p.tx,p.ty)<R*.5?p.dmg:p.dmg*.7,'exp');
      this.ev.push({t:'boom',x:p.tx,y:p.ty,r:R});
      if(p.whirl){const SK=TSKILL.conch(this.tier());this.zones.push({x:p.tx,y:p.ty,r:SK.r,t:SK.dur,T:SK.dur,dps:SK.dps*LV_DMG[p.lv-1]*this.tw('conch')*(1+this.B.dmg),slow:SK.slow});this.ev.push({t:'whirl',x:p.tx,y:p.ty});}
      return;}
    if(!tg)return;
    if(p.kind==='bub'){this.hurt(tg,p.dmg,'mag');if(!tg.dead&&!isBoss(tg.k)){tg.slow=Math.max(tg.slow,TOWERS.bubble.slow+this.B.bubSlow+(p.br==='frost'?.2:0));tg.slowT=TOWERS.bubble.slowT;}
      if(p.br==='blast'){for(const e of this.enemies)if(!e.dead&&e!==tg&&dist(e.x,e.y,tg.x,tg.y)<36+e.r){this.hurt(e,p.dmg*1.5,'mag');if(!e.dead&&!isBoss(e.k)){e.slow=Math.max(e.slow,.25);e.slowT=Math.max(e.slowT,1);}}this.ev.push({t:'boom',x:tg.x,y:tg.y,r:36});}this.ev.push({t:'pop',x:tg.x,y:tg.y});return;}
    this.hurt(tg,p.dmg,p.cls);if(p.br==='venom'&&!tg.dead){tg.poiT=3;tg.poiD=p.dmg*.45;if(!tg.shred){tg.shred=1;tg.armor=Math.max(0,tg.armor-.15);}}this.ev.push({t:'hit',x:tg.x,y:tg.y,k:p.kind});
  }
  heroTick(dt){
    const h=this.hero;h.ox=h.x;h.oy=h.y;if(h.atk>0)h.atk-=dt*4;h.moving=false;
    if(h.tx!==null){const dx=h.tx-h.x,dy=h.ty-h.y,d=Math.hypot(dx,dy),st=HERO.sp*dt;if(d<=st){h.x=h.tx;h.y=h.ty;h.tx=null;}else{h.x+=dx/d*st;h.y+=dy/d*st;h.face=dx>=0?1:-1;h.moving=true;}}
    h.cd-=dt;if(h.cd>0)return;
    let best=null,bd=HERO.range;for(const e of this.enemies){if(e.dead||e.prog<SAFE)continue;const d=dist(e.x,e.y,h.x,h.y);if(d<bd+e.r*.5&&(!best||e.prog>best.prog)){best=e;}}
    if(!best)return;h.cd=HERO.cd;h.atk=1;h.face=best.x>=h.x?1:-1;
    this.projs.push({kind:'bolt',x:h.x+h.face*10,y:h.y-12,tx:best.x,ty:best.y,tid:best.id,sp:700,dmg:this.heroDmg(),cls:'phy',from:'hero',lv:1,a:0});
  }
}

/* ============================== 플랫폼 층: 화면·터치·저장·언어·소리 (위챗·더우인 이식 때 이 파일만 손본다) ============================== */
const BUILD='1117-1941';
const VW=750,VH=1334,K=VW/W;
const cv=document.getElementById('game');const g=cv.getContext('2d');cv.width=VW;cv.height=VH;
function mkCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function safeCtx(x){const a=x.arc.bind(x);x.arc=(p,q,r,s,e,c)=>a(p,q,r>0?r:0,s,e,c);const el=x.ellipse.bind(x);x.ellipse=(p,q,rx,ry,ro,s,e,c)=>el(p,q,rx>0?rx:0,ry>0?ry:0,ro,s,e,c);return x;}
safeCtx(g);
const QS=new URLSearchParams(location.search),DEBUG=QS.get('debug')==='1';
/* ---------- 저장 ---------- */
const SAVE_KEY='deepsea_v1';
const DEF={stars:Array(STAGE_N).fill(0),coins:0,lv:{coral:1,bubble:1,jelly:1,conch:1,rune:1,hero:1},opt:{bgm:1,sfx:1,fast:0},lang:'',seen:{},sel:0,day:'',mis:[],login:{n:0,last:''}};
function loadSave(){let o=null;try{o=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}catch(e){}const s=JSON.parse(JSON.stringify(DEF));
  if(o&&typeof o==='object'){if(Array.isArray(o.stars))o.stars.forEach((v,i)=>{if(i<s.stars.length)s.stars[i]=Math.max(0,Math.min(3,+v||0));});if(o.opt)Object.assign(s.opt,o.opt);if(o.seen&&typeof o.seen==='object')s.seen=o.seen;if(typeof o.lang==='string')s.lang=o.lang;s.sel=+o.sel||0;
    s.coins=Math.max(0,+o.coins||0);if(o.lv)for(const k in s.lv)s.lv[k]=Math.max(1,Math.min(MAX_LV,+o.lv[k]||1));if(typeof o.day==='string')s.day=o.day;if(Array.isArray(o.mis))s.mis=o.mis.filter(m=>m&&MIS[m.id]);if(o.login){s.login.n=+o.login.n||0;s.login.last=''+(o.login.last||'');}}
  return s;}
let SV=loadSave();
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(SV));}catch(e){}}
const cleared=()=>{let n=0;while(n<SV.stars.length&&SV.stars[n]>0)n++;return n;};
/* ---------- 언어: 한국어 기기면 한국어, 그 밖은 중국어 ---------- */
let LANG=(()=>{const q=QS.get('lang');if(q==='zh'||q==='ko')return q;if(SV.lang==='zh'||SV.lang==='ko')return SV.lang;
  const l=navigator.language||'';return /^ko/i.test(l)?'ko':'zh';})();
const LL=a=>a[LANG==='zh'?1:0],L=(ko,zh)=>LANG==='zh'?zh:ko;
const FONT='"DS","PingFang SC","Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic","Microsoft YaHei",sans-serif';
/* ---------- 터치 ---------- */
const INPUT={down:null,taps:[]};
function toLogic(ev){const r=cv.getBoundingClientRect();return {x:(ev.clientX-r.left)/r.width*W,y:(ev.clientY-r.top)/r.height*H};}
cv.addEventListener('pointerdown',ev=>{ev.preventDefault();unlockAudio();const p=toLogic(ev);INPUT.down={x:p.x,y:p.y,t:performance.now()};});
cv.addEventListener('pointerup',ev=>{ev.preventDefault();const p=toLogic(ev),d=INPUT.down;INPUT.down=null;if(d&&Math.hypot(p.x-d.x,p.y-d.y)<26)INPUT.taps.push(p);});
cv.addEventListener('contextmenu',e=>e.preventDefault());
/* ---------- 소리: 전부 코드로 합성 (음원 파일 없음) ---------- */
let AC=null,MG=null,BG=null;
function unlockAudio(){if(AC){if(AC.state==='suspended')AC.resume();return;}try{AC=new (window.AudioContext||window.webkitAudioContext)();MG=AC.createGain();MG.gain.value=.55;MG.connect(AC.destination);
  BG=AC.createGain();BG.gain.value=SV.opt.bgm?.22:0;BG.connect(MG);startMusic();}catch(e){AC=null;}}
function tone(f,dur,type,vol,slide,delay){if(!AC||!SV.opt.sfx)return;const t0=AC.currentTime+(delay||0),o=AC.createOscillator(),gn=AC.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t0);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),t0+dur);gn.gain.setValueAtTime(0,t0);gn.gain.linearRampToValueAtTime(vol||.2,t0+.008);gn.gain.exponentialRampToValueAtTime(.001,t0+dur);
  o.connect(gn);gn.connect(MG);o.start(t0);o.stop(t0+dur+.02);}
function noise(dur,vol,fc){if(!AC||!SV.opt.sfx)return;const n=Math.floor(AC.sampleRate*dur),b=AC.createBuffer(1,n,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
  const s=AC.createBufferSource(),f=AC.createBiquadFilter(),gn=AC.createGain();s.buffer=b;f.type='lowpass';f.frequency.value=fc||900;gn.gain.value=vol||.2;s.connect(f);f.connect(gn);gn.connect(MG);s.start();}
const sfxGate={};
/* 연속 처치: 이어질수록 한 음씩 올라간다(5음계) */
const PENTA=[0,2,4,7,9];
function sfxKill(c){if(!AC||!SV.opt.sfx)return;const now=performance.now();if(sfxGate.k&&now-sfxGate.k<40)return;sfxGate.k=now;const n=Math.min(c,19),f=440*Math.pow(2,(PENTA[n%5]+12*Math.floor(n/5))/12);tone(f,.1,'triangle',.07,1.5);tone(f*2,.06,'sine',.03,1.2);}
function sfx(n){if(!AC||!SV.opt.sfx)return;const now=performance.now();if(sfxGate[n]&&now-sfxGate[n]<45)return;sfxGate[n]=now;
  switch(n){
    case'spine':tone(900,.06,'triangle',.06,1.6);break;
    case'bub':tone(420,.12,'sine',.08,2.2);break;
    case'zap':noise(.09,.07,4000);tone(1400,.07,'square',.03,.5);break;
    case'shell':tone(160,.2,'triangle',.12,.5);break;
    case'boom':noise(.25,.18,700);tone(90,.25,'sine',.18,.5);break;
    case'beam':tone(1200,.04,'sine',.02,1.1);break;
    case'kill':break;
    case'hit':noise(.03,.035,3200);break;
    case'coin':tone(1500,.05,'sine',.03,1.3);break;
    case'clear':[659,784,1046].forEach((f,i)=>tone(f,.22,'triangle',.1,1,i*.08));break;
    case'build':tone(330,.1,'triangle',.12,1.5);tone(495,.14,'triangle',.1,1.5,.07);break;
    case'up':[392,523,659].forEach((f,i)=>tone(f,.15,'triangle',.1,1.2,i*.06));break;
    case'sell':tone(500,.12,'triangle',.1,.6);break;
    case'leak':tone(200,.3,'sawtooth',.08,.5);break;
    case'wave':tone(220,.5,'sawtooth',.06,1.5);tone(330,.5,'sine',.08,1.5,.1);break;
    case'card':[523,659,784,1046].forEach((f,i)=>tone(f,.25,'sine',.08,1,i*.07));break;
    case'mut':tone(110,.6,'sawtooth',.08,.7);tone(116,.6,'sawtooth',.06,.7);break;
    case'gate':tone(260,.12,'square',.05,2);tone(390,.15,'triangle',.08,1.5,.08);break;
    case'slam':noise(.35,.25,500);tone(70,.35,'sine',.25,.4);break;
    case'vent':tone(300,.2,'sine',.05,3);break;
    case'trap':tone(700,.18,'sine',.07,.6);break;
    case'storm':noise(.2,.12,5000);tone(1800,.15,'square',.04,.3);break;
    case'win':[523,659,784,1046,1318].forEach((f,i)=>tone(f,.3,'triangle',.12,1,i*.1));break;
    case'lose':[392,330,262,196].forEach((f,i)=>tone(f,.35,'triangle',.1,1,i*.14));break;
    case'tap':tone(700,.04,'sine',.06);break;
    case'clean':noise(.12,.08,2500);break;
    case'roar':tone(70,.8,'sawtooth',.12,.6);noise(.6,.1,400);break;
  }}
/* 음악: 느린 심해 분위기(5음계 단조 아르페지오 + 낮은 패드). 전투 중엔 조금 빨라진다 */
let musicMode='calm',mStep=0,mNext=0;
const SCALE=[0,3,5,7,10,12,15,17],ROOT=110;
function startMusic(){setInterval(()=>{if(!AC||!BG)return;BG.gain.value=SV.opt.bgm?.22:0;if(!SV.opt.bgm)return;const ahead=AC.currentTime+.3;if(mNext<AC.currentTime)mNext=AC.currentTime+.05;
  const stepT=musicMode==='battle'?.24:musicMode==='boss'?.2:.36;
  while(mNext<ahead){const i=mStep%32,bar=Math.floor(mStep/8)%4,chord=[0,-4,-2,-5][bar];
    if(i%8===0)pad(ROOT*Math.pow(2,chord/12)/2,stepT*8);
    const pat=[0,2,4,2,5,4,2,1],n=SCALE[(pat[i%8]+(bar%2))%SCALE.length]+chord+(musicMode==='boss'?-12:0);
    if(i%2===0||musicMode!=='calm')pluck(ROOT*2*Math.pow(2,n/12),mNext,musicMode==='calm'?.05:.045);
    mNext+=stepT;mStep++;}},100);}
function pluck(f,t0,v){const o=AC.createOscillator(),gn=AC.createGain();o.type='triangle';o.frequency.value=f;gn.gain.setValueAtTime(0,t0);gn.gain.linearRampToValueAtTime(v,t0+.01);gn.gain.exponentialRampToValueAtTime(.001,t0+.9);o.connect(gn);gn.connect(BG);o.start(t0);o.stop(t0+1);}
function pad(f,dur){const t0=mNext;[1,1.5,2.01].forEach(m=>{const o=AC.createOscillator(),gn=AC.createGain();o.type='sine';o.frequency.value=f*m;gn.gain.setValueAtTime(0,t0);gn.gain.linearRampToValueAtTime(.05,t0+dur*.4);gn.gain.linearRampToValueAtTime(0,t0+dur);o.connect(gn);gn.connect(BG);o.start(t0);o.stop(t0+dur+.05);});}
function vib(ms){try{if(navigator.vibrate)navigator.vibrate(ms);}catch(e){}}

try{if(document.fonts){document.fonts.load('900 16px DS');document.fonts.load('700 16px DS');}}catch(e){}

/* ============================== 그림: 전부 코드로 그린 심해 발광 그림체 (그림 파일이 오면 바꿔 끼운다) ============================== */
/* 받은 그림(art/): 이름만 맞으면 코드 그림 대신 쓴다. 목록은 빌드가 채움 */
const ART=["abyss_rift", "bg_area1", "en_crab", "en_eel", "en_minnow", "en_ray", "hero_guard", "islet", "temple_gate", "tw_bubble_1", "tw_coral_1", "tw_jelly_1", "en_crab_p", "en_eel_p", "en_minnow_p", "en_ray_p"],IMG={};let artVer=0;
for(const n of ART){const im=new Image();im.onload=()=>{IMG[n]=im;artVer++;};im.src='art/'+n+'.webp?v='+BUILD;}
/* 그림 속 생물이 보는 방향(1=오른쪽)과 화면 폭(논리 px) */
const EFACE={};   // 받은 그림은 모두 오른쪽을 봄(왼쪽을 보는 그림이면 -1)
const EW={minnow:27,crab:46,eel:62,ray:60,angler:54,squid:56,horseshoe:54,turtle:66,elite:44,boss:120};
/* 움직임: 그림은 한 장, 동작은 코드가 만든다. AL = 틱 사이 보간(0~1), FDT = 이번 장면 시간
   GAIT = [걸음새, 간 거리당 박자, 꼬리 흔들림(몸 높이 비율), 조각 수]. 박자는 '간 거리'에 맞춰 돌아서 느려지면 헤엄도 느려지고 멈추면 멈춘다 */
let AL=1,FDT=.016;
const GAIT={minnow:['swim',.9,.2,5],crab:['walk',.5],eel:['swim',.5,.17,9],ray:['swim',.24,.11,8],angler:['swim',.35,.09,7],squid:['jet',.2],horseshoe:['walk',.4],turtle:['walk',.3],elite:['bob',.3],boss:['swim',.2,.05,9]};
function drawSwim(x,im,w,h,ph,amp,n,ov){const sw=im.width/n,dw=w/n;for(let i=0;i<n;i++){const t=1-i/(n-1),off=Math.sin(ph-i*.75)*amp*t*t;x.drawImage(im,i*sw,0,sw,im.height,-w/2+i*dw-ov,-h/2+off,dw+ov*2,h);}}
const islBob=(i,time)=>Math.sin(time*1.1+i*1.9)*1.6;
const lerpPos=o=>o.ox===undefined?[o.x,o.y]:[o.ox+(o.x-o.ox)*AL,o.oy+(o.y-o.oy)*AL];
function drawImg(x,im,cx,by,w){const h=w*im.height/im.width;x.drawImage(im,cx-w/2,by-h,w,h);}
const TCOL={coral:'#ff8a5c',bubble:'#6ee7ff',jelly:'#ffe066',conch:'#ffc9a8',rune:'#c77dff'};
function rr(x,X,Y,w,h,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath();}
function txt(x,s,X,Y,size,col,align,stroke,weight){x.font=`${weight||800} ${size}px ${FONT}`;x.textAlign=align||'center';x.textBaseline='middle';
  if(stroke){x.lineWidth=Math.max(2,size/5);x.strokeStyle=stroke;x.lineJoin='round';x.strokeText(s,X,Y);}x.fillStyle=col;x.fillText(s,X,Y);}
function wrap(x,s,X,Y,maxW,size,col,lh,align){x.font=`700 ${size}px ${FONT}`;const words=LANG==='zh'?s.split(''):s.split(' ');let line='',yy=Y;const sep=LANG==='zh'?'':' ';
  for(const w of words){const test=line?line+sep+w:w;if(x.measureText(test).width>maxW&&line){txt(x,line,X,yy,size,col,align,null,700);line=w;yy+=lh;}else line=test;}if(line)txt(x,line,X,yy,size,col,align,null,700);return yy+lh;}
function oct(x,X,Y,r,fill,stroke,lw){x.beginPath();for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;x.lineTo(X+Math.cos(a)*r,Y+Math.sin(a)*r*.62);}x.closePath();x.fillStyle=fill;x.fill();if(stroke){x.lineWidth=lw||1.5;x.strokeStyle=stroke;x.stroke();}}
function glow(x,X,Y,r,col,a){const gr=x.createRadialGradient(X,Y,0,X,Y,r);gr.addColorStop(0,col);gr.addColorStop(1,'rgba(0,0,0,0)');x.globalAlpha=a==null?1:a;x.fillStyle=gr;x.beginPath();x.arc(X,Y,r,0,7);x.fill();x.globalAlpha=1;}
function hexA(c,a){const n=parseInt(c.slice(1),16);return `rgba(${n>>16},${(n>>8)&255},${n&255},${a})`;}

/* ---------- 지도 배경 (판마다 한 번 그려 둔다) ---------- */
function segPath(x,s){x.beginPath();s.p.forEach((q,i)=>i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1]));}
function minPathDist(M,X,Y){let md=1e9;for(const id in M.segs){const P=M.segs[id].p;for(let i=0;i<P.length;i+=3){const d=(P[i][0]-X)**2+(P[i][1]-Y)**2;if(d<md)md=d;}}return Math.sqrt(md);}
function renderBg(M){
  const c=mkCanvas(VW,VH),x=safeCtx(c.getContext('2d'));x.setTransform(K,0,0,K,0,0);const R=rng(77+M.si*13);
  let gr;if(IMG.bg_area1){x.drawImage(IMG.bg_area1,0,0,W,H);}else{gr=x.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#2b8fa2');gr.addColorStop(.35,'#16647a');gr.addColorStop(.75,'#0c3d55');gr.addColorStop(1,'#072a40');x.fillStyle=gr;x.fillRect(0,0,W,H);
  // 먼 바닥: 흐릿한 모래 언덕과 바위 그림자 (길과 상관없이 깔림)
  for(let i=0;i<26;i++){const px=R()*W,py=120+R()*(H-120),rw=60+R()*120;x.fillStyle=`rgba(${R()<.5?'10,40,60':'30,70,80'},${.18+R()*.15})`;x.beginPath();x.ellipse(px,py,rw,rw*.35,0,0,7);x.fill();}
  for(let i=0;i<14;i++){const px=R()*W,py=200+R()*(H-200);x.fillStyle=`rgba(5,25,40,${.25+R()*.15})`;x.beginPath();x.moveTo(px-30-R()*30,py);
    for(let j=0;j<5;j++)x.lineTo(px-30+j*15+R()*10,py-12-R()*36);x.lineTo(px+40+R()*20,py);x.closePath();x.fill();}}
  {const tn=AREAS[Math.floor(M.si/PER_AREA)].tint;if(tn){x.fillStyle=tn;x.fillRect(0,0,W,H);}}
  // 아주 옅은 물살 띠: 길을 '파지' 않고 물빛만 살짝 밝게
  const segs=Object.values(M.segs);x.lineCap=x.lineJoin='round';
  for(const s of segs){segPath(x,s);x.strokeStyle='rgba(160,235,255,.045)';x.lineWidth=60;x.stroke();}
  for(const s of segs){segPath(x,s);x.strokeStyle='rgba(190,245,255,.04)';x.lineWidth=28;x.stroke();}
  // 가까운 꾸밈(길에서 떨어진 곳만): 해초 숲, 산호, 바위, 조개
  const CC=['#ff7a59','#c86bfa','#ff5d8f','#ffb347','#5be3c6','#7ab8ff'];
  if(!IMG.bg_area1)for(let i=0;i<120;i++){const px=10+R()*(W-20),py=80+R()*(H-110);const md=minPathDist(M,px,py);if(md<34||M.spots.some(s=>dist(s.x,s.y,px,py)<34)||dist(px,py,TEMPLE.x,TEMPLE.y)<84)continue;
    const col=CC[(R()*CC.length)|0],kind=R(),fade=Math.min(1,(md-30)/40);x.globalAlpha=.35+.45*fade;
    if(kind<.3){x.strokeStyle=R()<.5?'#2f8a5a':'#3fa070';x.lineCap='round';const n=2+(R()*3|0);for(let j=0;j<n;j++){let X=px+j*4-n*2,Y=py;x.lineWidth=2.5;x.beginPath();x.moveTo(X,Y);const h=20+R()*30;for(let k=1;k<=6;k++){X+=Math.sin(k*1.3+j)*3;Y-=h/6;x.lineTo(X,Y);}x.stroke();}}
    else if(kind<.55){x.strokeStyle=col;x.lineCap='round';const br=(X,Y,a,l,w)=>{if(l<3)return;const X2=X+Math.cos(a)*l,Y2=Y+Math.sin(a)*l;x.lineWidth=w;x.beginPath();x.moveTo(X,Y);x.lineTo(X2,Y2);x.stroke();br(X2,Y2,a-.5,l*.68,w*.75);br(X2,Y2,a+.45,l*.62,w*.75);};br(px,py,-Math.PI/2+(R()-.5)*.4,9+R()*6,3);}
    else if(kind<.75){for(let j=0;j<5;j++){x.fillStyle=col;x.beginPath();x.arc(px+(R()-.5)*12,py+(R()-.5)*8,2+R()*3,0,7);x.fill();}}
    else if(kind<.9){x.fillStyle='#24485a';x.beginPath();x.ellipse(px,py,8+R()*10,5+R()*5,0,0,7);x.fill();x.fillStyle='rgba(120,200,190,.25)';x.beginPath();x.ellipse(px-2,py-2,5,2.5,0,0,7);x.fill();}
    else{x.fillStyle=col;x.beginPath();x.ellipse(px,py,7+R()*5,4+R()*3,0,Math.PI,0);x.fill();}
    x.globalAlpha=1;}
  if(!IMG.bg_area1)for(let i=0;i<50;i++){const px=R()*W,py=60+R()*(H-120);if(minPathDist(M,px,py)<30)continue;glow(x,px,py,3+R()*3,R()<.5?'rgba(120,255,230,.9)':'rgba(200,140,255,.9)',.45);}
  // 심연 균열(적이 나오는 곳)
  for(const cvp of M.caves){const X=cvp[0],Y=cvp[1];if(IMG.abyss_rift){const w=118,h=w*IMG.abyss_rift.height/IMG.abyss_rift.width;x.drawImage(IMG.abyss_rift,X-w/2,Y-h/2,w,h);continue;}gr=x.createRadialGradient(X,Y,2,X,Y,44);gr.addColorStop(0,'#05000c');gr.addColorStop(.55,'rgba(30,0,50,.85)');gr.addColorStop(1,'rgba(30,0,50,0)');
    x.fillStyle=gr;x.beginPath();x.ellipse(X,Y,46,30,0,0,7);x.fill();x.strokeStyle='rgba(199,125,255,.5)';x.lineWidth=2;for(let k=0;k<2;k++){x.beginPath();x.ellipse(X,Y,22+k*10,12+k*7,0,0,7);x.stroke();}}
  // 떠 있는 바위섬(수호탑 자리): 아래 멀리 그림자, 뾰족한 밑바닥, 이끼·산호 윗면
  for(const s of M.spots){const r2=rng(s.x*7+s.y*13);if(IMG.islet){x.fillStyle='rgba(0,15,25,.28)';x.beginPath();x.ellipse(s.x+5,s.y+32,20,7,0,0,7);x.fill();continue;}
    x.fillStyle='rgba(0,15,25,.28)';x.beginPath();x.ellipse(s.x+5,s.y+32,20,7,0,0,7);x.fill();
    x.fillStyle='#26404a';x.beginPath();x.moveTo(s.x-27,s.y+2);x.lineTo(s.x-14,s.y+16);x.lineTo(s.x-6,s.y+28+r2()*6);x.lineTo(s.x+3,s.y+18);x.lineTo(s.x+10,s.y+24+r2()*6);x.lineTo(s.x+20,s.y+12);x.lineTo(s.x+27,s.y+2);x.closePath();x.fill();
    x.fillStyle='#1a2e36';x.beginPath();x.moveTo(s.x,s.y+6);x.lineTo(s.x-6,s.y+28);x.lineTo(s.x+3,s.y+18);x.closePath();x.fill();
    gr=x.createLinearGradient(0,s.y-16,0,s.y+10);gr.addColorStop(0,'#5a9a78');gr.addColorStop(1,'#2e5c52');x.fillStyle=gr;x.beginPath();x.ellipse(s.x,s.y,28,16,0,0,7);x.fill();
    x.strokeStyle='rgba(180,240,200,.35)';x.lineWidth=1.5;x.beginPath();x.ellipse(s.x,s.y-1,26,14,0,Math.PI*1.1,Math.PI*1.9);x.stroke();
    for(let j=0;j<4;j++){const an=r2()*7,rx=s.x+Math.cos(an)*22,ry=s.y+Math.sin(an)*11;x.fillStyle=CC[(r2()*CC.length)|0];x.beginPath();x.arc(rx,ry,1.6+r2()*1.6,0,7);x.fill();}}
  // 신전 바닥
  const T=TEMPLE;if(!IMG.temple_gate){x.fillStyle='rgba(0,8,10,.45)';x.beginPath();x.ellipse(T.x,T.y+16,82,28,0,0,7);x.fill();
  for(let k=0;k<3;k++){x.fillStyle=['#33504c','#456663','#5a7b76'][k];x.beginPath();x.ellipse(T.x,T.y+10-k*6,74-k*12,24-k*4,0,0,7);x.fill();}}
  gr=x.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.75);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,10,25,.55)');x.fillStyle=gr;x.fillRect(0,0,W,H);
  return c;
}
function drawTemple(x,t,hurt){
  const T=TEMPLE,X=T.x,Y=T.y-8,p=.6+.4*Math.sin(t*2);
  glow(x,X,Y-20,70,hurt>0?'rgba(255,80,100,.55)':'rgba(120,255,200,.35)',p);
  if(IMG.temple_gate){drawImg(x,IMG.temple_gate,X,T.y+30,150);return;}
  x.fillStyle='#5f7f78';for(const dx of[-34,34]){rr(x,X+dx-6,Y-46,12,46,3);x.fill();x.fillStyle='#86a8a0';rr(x,X+dx-8,Y-50,16,6,2);x.fill();x.fillStyle='#5f7f78';}
  x.fillStyle='#4d6a64';x.beginPath();x.moveTo(X-30,Y);x.lineTo(X-30,Y-38);x.quadraticCurveTo(X,Y-66,X+30,Y-38);x.lineTo(X+30,Y);x.closePath();x.fill();
  const gr=x.createLinearGradient(0,Y-50,0,Y);gr.addColorStop(0,'rgba(180,255,220,.95)');gr.addColorStop(1,'rgba(60,200,170,.6)');x.fillStyle=gr;
  x.beginPath();x.moveTo(X-20,Y);x.lineTo(X-20,Y-32);x.quadraticCurveTo(X,Y-52,X+20,Y-32);x.lineTo(X+20,Y);x.closePath();x.fill();
  x.save();x.translate(X,Y-24+Math.sin(t*2.5)*2);x.rotate(t*.8);x.fillStyle='#fff';x.globalAlpha=.9;x.beginPath();x.moveTo(0,-9);x.lineTo(6,0);x.lineTo(0,9);x.lineTo(-6,0);x.closePath();x.fill();x.restore();x.globalAlpha=1;
  x.fillStyle='#d9b45a';x.beginPath();x.moveTo(X-10,Y-62);x.lineTo(X,Y-74);x.lineTo(X+10,Y-62);x.closePath();x.fill();
}
/* ---------- 수호탑 ---------- */
function drawTower(x,t,time,sel){
  const X=t.x,Y=t.y,c=TCOL[t.k],lv=t.lv,s=1+(lv-1)*(IMG['tw_'+t.k+'_1']?.03:.09),kick=Math.max(0,t.kick||0);
  if(lv>=2)glow(x,X,Y,30,hexA(c,.35),.8);
  let tim=null;for(let l=lv;l>=1&&!tim;l--)tim=IMG['tw_'+t.k+'_'+l];
  if(tim){const aim=t.k==='coral'||t.k==='conch',dir=aim&&Math.cos(t.ang==null?0:t.ang)<0?-1:1,bob=t.spot===undefined?0:islBob(t.spot,time);
    if(t.vF===undefined)t.vF=dir;t.vF+=(dir-t.vF)*Math.min(1,FDT*8);const vf=Math.abs(t.vF)<.2?(t.vF<0?-.2:.2):t.vF,sq=1+kick*.08,sway=t.k==='jelly'?Math.sin(time*1.6+X)*.025:0;
    x.save();x.translate(X+(aim?-dir*kick*2.5:0),Y+11+bob);x.rotate(sway);x.scale(vf*s/sq,s*sq);drawImg(x,tim,0,0,Math.min(38,44*tim.width/tim.height));x.restore();
    if(kick>.55){x.globalCompositeOperation='lighter';glow(x,X+(aim?dir*14:0),Y-22+bob,22,hexA(c,.9),(kick-.55)*2);x.globalCompositeOperation='source-over';}}
  else{
  oct(x,X,Y+2,18*s,'#26313a',lv>=2?'#e8c45a':'#5c6b74',lv>=3?2.5:1.5);
  x.strokeStyle=hexA(c,.8);x.lineWidth=1.5;x.beginPath();x.ellipse(X,Y+2,12*s,7*s,0,0,7);x.stroke();
  x.save();x.translate(X,Y);x.scale(s,s);
  const a=t.ang==null?-Math.PI/2:t.ang;
  if(t.k==='coral'){x.lineCap='round';
    const br=(X1,Y1,an,l,w,d)=>{const X2=X1+Math.cos(an)*l,Y2=Y1+Math.sin(an)*l;x.strokeStyle=d>1?'#e8603f':d>0?'#ff7f5e':'#ffa078';x.lineWidth=w;x.beginPath();x.moveTo(X1,Y1);x.lineTo(X2,Y2);x.stroke();
      if(d<2){br(X2,Y2,an-.55,l*.7,w*.72,d+1);br(X2,Y2,an+.5,l*.66,w*.72,d+1);}else{x.fillStyle='#ffd6b8';x.beginPath();x.arc(X2,Y2,1.6,0,7);x.fill();}};
    br(-3,0,-1.75,10,5,0);br(3,0,-1.35,9,4.5,1);
    x.save();x.translate(0,-14);x.rotate(a);x.translate(-kick*3,0);x.fillStyle='#7a2e22';rr(x,-4,-3,12,6,3);x.fill();x.fillStyle='#fff0dc';x.beginPath();x.moveTo(15,0);x.lineTo(5,-3.5);x.lineTo(5,3.5);x.closePath();x.fill();x.restore();
  }else if(t.k==='bubble'){x.fillStyle='#3c5560';rr(x,-5,-12,10,12,2);x.fill();x.fillStyle='#d9b45a';rr(x,-8,-14,16,4,2);x.fill();
    const by=-25-kick*1.5;glow(x,0,by,18,'rgba(110,231,255,.6)');const gr=x.createRadialGradient(-3,by-4,1,0,by,11);gr.addColorStop(0,'#e8fdff');gr.addColorStop(.5,'rgba(110,231,255,.65)');gr.addColorStop(1,'rgba(40,140,200,.8)');
    x.fillStyle=gr;x.beginPath();x.arc(0,by,11,0,7);x.fill();x.strokeStyle='rgba(255,255,255,.7)';x.lineWidth=1.2;x.beginPath();x.arc(0,by,6,time*3,time*3+3.5);x.stroke();
  }else if(t.k==='jelly'){x.fillStyle='#2f4a66';rr(x,-5,-22,10,22,2);x.fill();x.fillStyle='#d9b45a';rr(x,-7,-24,14,3,1);x.fill();
    const jy=-31+Math.sin(time*3)*1.5,sq=1+Math.sin(time*6)*.06+kick*.15;glow(x,0,jy,20,'rgba(255,224,102,.55)');
    x.fillStyle='rgba(255,236,150,.9)';x.beginPath();x.ellipse(0,jy,10*sq,8/sq,0,Math.PI,0);x.fill();x.fillStyle='rgba(150,240,255,.6)';x.beginPath();x.ellipse(0,jy,10*sq,2.5,0,0,Math.PI);x.fill();
    x.strokeStyle='rgba(255,236,150,.85)';x.lineWidth=1.2;for(let i=-2;i<=2;i++){x.beginPath();x.moveTo(i*3.5,jy+1);x.quadraticCurveTo(i*3.5+Math.sin(time*5+i)*3,jy+6,i*3+Math.sin(time*4+i)*2,jy+11);x.stroke();}
    if(kick>.3){x.strokeStyle='#fff';x.lineWidth=1.5;for(let i=0;i<3;i++){const an=time*20+i*2;x.beginPath();x.moveTo(Math.cos(an)*12,jy+Math.sin(an)*10);x.lineTo(Math.cos(an)*17,jy+Math.sin(an)*14);x.stroke();}}
  }else if(t.k==='conch'){x.fillStyle='#3a4650';rr(x,-8,-8,16,8,2);x.fill();x.save();x.translate(0,-15);x.rotate(a);x.translate(-kick*4,0);
    const gr=x.createLinearGradient(-12,0,14,0);gr.addColorStop(0,'#e8a07a');gr.addColorStop(1,'#ffe0c8');x.fillStyle=gr;x.beginPath();x.moveTo(16,-5);x.quadraticCurveTo(4,-14,-10,-8);x.quadraticCurveTo(-16,0,-10,8);x.quadraticCurveTo(4,14,16,5);x.closePath();x.fill();
    x.strokeStyle='#b0664a';x.lineWidth=1.3;x.beginPath();x.arc(-6,0,5,0,5.5);x.stroke();x.beginPath();x.arc(-6,0,2,0,5);x.stroke();x.fillStyle='#5a2a20';x.beginPath();x.ellipse(15,0,2.5,4.5,0,0,7);x.fill();x.restore();
  }else if(t.k==='rune'){x.fillStyle='#4a3d66';rr(x,-13,-26,6,26,2);x.fill();rr(x,7,-26,6,26,2);x.fill();x.beginPath();x.moveTo(-13,-24);x.quadraticCurveTo(0,-38,13,-24);x.lineTo(13,-20);x.quadraticCurveTo(0,-32,-13,-20);x.closePath();x.fill();
    const p=.6+.4*Math.sin(time*4);glow(x,0,-14,18,'rgba(199,125,255,.7)',p);x.fillStyle=`rgba(220,170,255,${.5+.3*p})`;x.beginPath();x.ellipse(0,-13,6,10,0,0,7);x.fill();
    x.save();x.translate(0,-40+Math.sin(time*2)*2);x.rotate(time);x.strokeStyle='#e6c8ff';x.lineWidth=1.5;x.beginPath();x.moveTo(0,-5);x.lineTo(5,0);x.lineTo(0,5);x.lineTo(-5,0);x.closePath();x.stroke();x.restore();}
  x.restore();}
  if(lv>=3){x.fillStyle='#ffd76a';x.beginPath();const cy=Y-(tim?38:48)+Math.sin(time*3)*1.5;x.moveTo(X-6,cy+4);x.lineTo(X-6,cy-2);x.lineTo(X-3,cy+1);x.lineTo(X,cy-4);x.lineTo(X+3,cy+1);x.lineTo(X+6,cy-2);x.lineTo(X+6,cy+4);x.closePath();x.fill();}
  if(lv>=4){x.save();x.translate(X,Y+2);x.rotate(time*.8);x.strokeStyle='rgba(255,215,106,.85)';x.lineWidth=2;x.setLineDash([5,5]);x.beginPath();x.ellipse(0,0,26,15,0,0,7);x.stroke();x.setLineDash([]);x.restore();glow(x,X,Y-20,34,hexA(c,.35),.6+.3*Math.sin(time*3));}
  if(t.hasteT>0){x.strokeStyle=`rgba(255,230,120,${.5+.3*Math.sin(time*12)})`;x.lineWidth=2;x.beginPath();x.ellipse(X,Y+2,22,12,0,0,7);x.stroke();}
  if(t.ink>0){x.fillStyle='rgba(10,5,20,.85)';for(const q of[[-8,-14,9],[6,-20,8],[2,-6,10],[-3,-26,6]]){x.beginPath();x.arc(X+q[0],Y+q[1],q[2],0,7);x.fill();}
    txt(x,'👆',X+14,Y-30+Math.sin(time*6)*2,13,'#fff');}
  for(let i=0;i<lv;i++){x.fillStyle=lv>=3?'#ffd76a':'#cfe';x.beginPath();x.arc(X-6+i*6,Y+14,2,0,7);x.fill();}
}
function towerIcon(x,k,X,Y,s){const t={k,lv:1,x:0,y:0,ang:-Math.PI/4,kick:0};x.save();x.translate(X,Y+8*s);x.scale(s,s);drawTower(x,t,performance.now()/1000,false);x.restore();}
/* ---------- 적 ---------- */
function drawEnemy(x,e,time){
  const E=ENEMIES[e.k],r=e.r,face=Math.cos(e.a)<0?-1:1,sp=e.spawnT>0?1-e.spawnT/.7:1;
  const [EX,EY]=lerpPos(e);e.vL=(e.vL||0)+((e.lift>0?12:0)-(e.vL||0))*Math.min(1,FDT*7);
  let alpha=(e.inv?(e.rev?.55:.13):1)*(e.fade===undefined?1:e.fade);x.save();x.translate(EX,EY-e.vL-(e.lift>0?Math.sin(time*8)*1.5:0));
  if(sp<1){x.scale(sp,sp);alpha*=sp;}
  x.globalAlpha=alpha;glow(x,0,0,r*(e.pure?2.6:1.9),e.pure?'rgba(120,255,240,.5)':'rgba(140,60,220,.35)');
  const eim=(e.pure&&IMG['en_'+(E.art||e.k)+'_p'])||IMG['en_'+(E.art||e.k)];if(E.tint)glow(x,0,0,r*2.4,hexA(E.tint,.55),.6+.3*Math.sin(time*3));
  if(eim){const key=E.art||e.k,GT=GAIT[key]||GAIT.angler,w=e.icon?Math.min(34,EW[key]||34):(E.ew||EW[e.k]),h=w*eim.height/eim.width,still=e.stun>0||e.trap>0;
    const ph=(e.prog||0)*GT[1]*.35+e.id*1.3+(still?0:time*1.2),hs=1+Math.max(0,e.hitT||0)*1.1,ov=alpha<1?0:.3;e.vh=h/2;
    if(e.vF===undefined){e.vF=face;e.vA=0;}e.vF+=(face-e.vF)*Math.min(1,FDT*10);const vf=Math.abs(e.vF)<.2?(e.vF<0?-.2:.2):e.vF;
    const tilt=Math.max(-.6,Math.min(.6,Math.atan2(Math.sin(e.a),Math.abs(Math.cos(e.a)))))*.75;
    let paint;
    if(GT[0]==='swim'){e.vA+=(tilt-e.vA)*Math.min(1,FDT*6);x.scale(vf*hs,hs);x.rotate(e.vA);paint=()=>drawSwim(x,eim,w,h,ph,GT[2]*h,e.icon?6:GT[3],ov);}
    else if(GT[0]==='jet'){const pu=Math.sin(ph*1.4);e.vA+=(tilt-e.vA)*Math.min(1,FDT*6);x.scale(vf*hs*(1+pu*.07),hs*(1-pu*.07));x.rotate(e.vA);paint=()=>drawSwim(x,eim,w,h,ph*1.4,.05*h,6,ov);}
    else if(GT[0]==='walk'){const st=Math.sin(ph*2);x.scale(vf*hs,hs);x.rotate(st*.05);paint=()=>x.drawImage(eim,-w/2,-h/2-Math.abs(st)*1.5,w,h);}
    else{x.scale(vf*hs,hs);x.rotate(Math.sin(ph)*.07);paint=()=>x.drawImage(eim,-w/2,-h/2+Math.sin(ph*1.3)*2,w,h);}
    paint();if(e.hitT>0&&alpha>=1){x.globalCompositeOperation='lighter';x.globalAlpha=Math.min(1,e.hitT*9);paint();x.globalCompositeOperation='source-over';x.globalAlpha=alpha;}}
  else{x.scale(face*1.18,1.18);}const bob=Math.sin(time*6+e.id)*1.2;
  if(!eim)switch(E.art||e.k){
    case'minnow':{const w=Math.sin(time*14+e.id)*3;x.fillStyle='#2b2f5a';x.beginPath();x.moveTo(r+2,0);x.quadraticCurveTo(0,-r*.8,-r,0);x.quadraticCurveTo(0,r*.8,r+2,0);x.fill();
      x.beginPath();x.moveTo(-r+1,0);x.lineTo(-r-6,-4+w);x.lineTo(-r-6,4+w);x.closePath();x.fill();x.fillStyle='#d58bff';x.beginPath();x.arc(r*.45,-1.5,1.8,0,7);x.fill();break;}
    case'crab':{x.translate(0,bob*.5);x.strokeStyle='#38506a';x.lineWidth=2;for(let i=-1;i<=1;i++)for(const sd of[-1,1]){x.beginPath();x.moveTo(sd*6,2+i*3);x.lineTo(sd*(r+2),5+i*3+Math.sin(time*12+i)*2);x.stroke();}
      const gr=x.createLinearGradient(0,-r,0,r);gr.addColorStop(0,'#7d9bb8');gr.addColorStop(1,'#34465c');x.fillStyle=gr;x.beginPath();x.ellipse(0,0,r,r*.72,0,0,7);x.fill();
      x.strokeStyle='#b8d2e8';x.lineWidth=1.2;x.beginPath();x.ellipse(0,-1,r*.7,r*.45,0,Math.PI*1.1,Math.PI*1.9);x.stroke();
      x.fillStyle='#5a7896';for(const sd of[-1,1]){x.beginPath();x.ellipse(sd*(r-1),-r*.7,5,4,sd*.5,0,7);x.fill();}
      x.fillStyle='#ff6bd6';x.beginPath();x.arc(-3,-r*.55,1.8,0,7);x.arc(3,-r*.55,1.8,0,7);x.fill();break;}
    case'eel':{x.lineCap='round';const n=7;let px=r,py=0;x.strokeStyle=e.dashT>0?'#fff27a':'#3b4a2a';x.lineWidth=7;x.beginPath();x.moveTo(px,py);
      for(let i=1;i<=n;i++){px=r-i*4;py=Math.sin(time*10+i*.9)*3*(i/n+.3);x.lineTo(px,py);}x.stroke();x.strokeStyle='#e9d24a';x.lineWidth=1.5;x.setLineDash([3,4]);x.stroke();x.setLineDash([]);
      x.fillStyle='#4a5a30';x.beginPath();x.arc(r,0,4.5,0,7);x.fill();x.fillStyle='#ffef6a';x.beginPath();x.arc(r+1.5,-1.5,1.6,0,7);x.fill();
      if(e.dashT>0||Math.sin(time*7+e.id)>.8){x.strokeStyle='#bff';x.lineWidth=1;x.beginPath();x.moveTo(0,-6);x.lineTo(3,-10);x.lineTo(-1,-12);x.stroke();}break;}
    case'ray':{const f=Math.sin(time*5+e.id)*.25;x.fillStyle='#3a2f5c';x.beginPath();x.moveTo(r,0);x.quadraticCurveTo(0,-r*1.3-f*8,-r*.6,-r*.2);x.lineTo(-r*.6,r*.2);x.quadraticCurveTo(0,r*1.3+f*8,r,0);x.fill();
      x.strokeStyle='#3a2f5c';x.lineWidth=1.5;x.beginPath();x.moveTo(-r*.6,0);x.quadraticCurveTo(-r*1.2,Math.sin(time*6)*4,-r*1.8,0);x.stroke();
      x.fillStyle='#9b7dff';x.beginPath();x.arc(r*.55,-2.5,1.5,0,7);x.arc(r*.55,2.5,1.5,0,7);x.fill();if(e.inv&&e.rev){x.strokeStyle='#d6c6ff';x.lineWidth=1;x.stroke();}break;}
    case'angler':{x.translate(0,bob);const gr=x.createRadialGradient(-2,-3,1,0,0,r);gr.addColorStop(0,'#5a4a3a');gr.addColorStop(1,'#2a2018');x.fillStyle=gr;x.beginPath();x.arc(0,0,r,0,7);x.fill();
      x.fillStyle='#e8e0c0';for(let i=0;i<5;i++){x.beginPath();x.moveTo(r*.3+i*2,3);x.lineTo(r*.3+i*2+1,7);x.lineTo(r*.3+i*2+2,3);x.fill();}
      x.strokeStyle='#4a3a2a';x.lineWidth=1.5;x.beginPath();x.moveTo(2,-r+1);x.quadraticCurveTo(r,-r-12,r+5,-r-4);x.stroke();
      glow(x,r+5,-r-4,10,'rgba(160,255,140,.9)',.6+.4*Math.sin(time*5));x.fillStyle='#d8ffb0';x.beginPath();x.arc(r+5,-r-4,2.5,0,7);x.fill();
      x.fillStyle='#ffef8a';x.beginPath();x.arc(r*.4,-r*.35,2.2,0,7);x.fill();break;}
    case'squid':{x.translate(0,bob);x.strokeStyle='#7a3a6a';x.lineWidth=2.2;x.lineCap='round';for(let i=0;i<5;i++){x.beginPath();x.moveTo(-r*.5,(i-2)*2.5);x.quadraticCurveTo(-r-4,(i-2)*4+Math.sin(time*8+i)*3,-r-10,(i-2)*5+Math.sin(time*6+i)*4);x.stroke();}
      x.fillStyle='#a04c8a';x.beginPath();x.moveTo(r+4,0);x.quadraticCurveTo(r*.5,-r*.9,-r*.5,-r*.55);x.lineTo(-r*.5,r*.55);x.quadraticCurveTo(r*.5,r*.9,r+4,0);x.fill();
      x.fillStyle='#fff';x.beginPath();x.arc(0,-3,2.6,0,7);x.arc(0,3,2.6,0,7);x.fill();x.fillStyle='#111';x.beginPath();x.arc(.8,-3,1.3,0,7);x.arc(.8,3,1.3,0,7);x.fill();break;}
    case'horseshoe':{x.strokeStyle='#4a4030';x.lineWidth=2;x.beginPath();x.moveTo(-r,0);x.lineTo(-r-9,Math.sin(time*4)*2);x.stroke();
      const gr=x.createLinearGradient(0,-r,0,r);gr.addColorStop(0,'#8a7a50');gr.addColorStop(1,'#4a3e26');x.fillStyle=gr;x.beginPath();x.moveTo(r,0);x.quadraticCurveTo(r,-r*.9,0,-r*.9);x.quadraticCurveTo(-r,-r*.8,-r,0);x.quadraticCurveTo(-r,r*.8,0,r*.9);x.quadraticCurveTo(r,r*.9,r,0);x.fill();
      x.strokeStyle='#c8b480';x.lineWidth=1;x.beginPath();x.moveTo(r*.6,0);x.lineTo(-r*.8,0);x.stroke();x.fillStyle='#ff6bd6';x.beginPath();x.arc(r*.4,-4,1.5,0,7);x.arc(r*.4,4,1.5,0,7);x.fill();break;}
    case'turtle':{x.translate(0,bob*.4);x.fillStyle='#4f6a4a';for(const q of[[r*.6,-r*.75],[r*.6,r*.75],[-r*.6,-r*.75],[-r*.6,r*.75]]){x.beginPath();x.ellipse(q[0]+Math.sin(time*4)*1.5,q[1],5,3.5,0,0,7);x.fill();}
      x.beginPath();x.arc(r+3,0,5,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(r+5,-2,1.4,0,7);x.fill();
      const gr=x.createRadialGradient(-3,-4,2,0,0,r);gr.addColorStop(0,'#8a8f84');gr.addColorStop(1,'#3e4440');x.fillStyle=gr;x.beginPath();x.arc(0,0,r,0,7);x.fill();
      x.strokeStyle='#2c302c';x.lineWidth=1.3;for(let i=0;i<6;i++){const an=i*Math.PI/3;x.beginPath();x.moveTo(Math.cos(an)*r*.4,Math.sin(an)*r*.4);x.lineTo(Math.cos(an)*r*.95,Math.sin(an)*r*.95);x.stroke();}x.beginPath();x.arc(0,0,r*.4,0,7);x.stroke();break;}
    case'elite':{x.translate(0,bob);x.fillStyle='#4b3a7a';x.beginPath();x.moveTo(4,-r);x.quadraticCurveTo(r,-r*.6,6,0);x.quadraticCurveTo(10,r*.5,0,r*.7);x.quadraticCurveTo(-8,r,-4,r*.4);x.quadraticCurveTo(-r*.6,0,4,-r);x.fill();
      x.strokeStyle='#8a72d0';x.lineWidth=2.5;x.lineCap='round';x.beginPath();x.moveTo(-4,r*.4);x.quadraticCurveTo(-r*.7,r*.9,-4,r*1.1);x.stroke();
      x.fillStyle='#c0c8d8';x.beginPath();x.moveTo(-2,-r);x.lineTo(10,-r-2);x.lineTo(14,-r+6);x.lineTo(2,-r+8);x.closePath();x.fill();
      x.strokeStyle='#d8dce8';x.lineWidth=2;x.beginPath();x.moveTo(-6,-2);x.lineTo(r+8,-10);x.stroke();x.fillStyle='#f0f4ff';x.beginPath();x.moveTo(r+8,-10);x.lineTo(r+2,-13);x.lineTo(r+3,-7);x.closePath();x.fill();
      x.fillStyle='#ff4fd8';x.beginPath();x.arc(7,-r+3,2,0,7);x.fill();break;}
    case'boss':{x.translate(0,bob*1.5);const gr=x.createRadialGradient(-6,-8,4,0,0,r);gr.addColorStop(0,'#5a3a6a');gr.addColorStop(1,'#1e1028');x.fillStyle=gr;x.beginPath();x.arc(0,0,r,0,7);x.fill();
      x.fillStyle='#120818';x.beginPath();x.moveTo(r*.95,2);x.quadraticCurveTo(r*.3,r*.55,-r*.2,r*.35);x.quadraticCurveTo(r*.3,r*.2,r*.95,2);x.fill();
      x.fillStyle='#f4ecd0';for(let i=0;i<7;i++){const px=r*.05+i*r*.13;x.beginPath();x.moveTo(px,r*.28-i*1.2);x.lineTo(px+2.5,r*.48-i*1.5);x.lineTo(px+5,r*.26-i*1.2);x.fill();}
      x.strokeStyle='#3a2048';x.lineWidth=3;x.beginPath();x.moveTo(0,-r+2);x.quadraticCurveTo(r*.8,-r-26,r+10,-r-8);x.stroke();
      glow(x,r+10,-r-8,24,'rgba(255,120,220,.9)',.6+.4*Math.sin(time*4));x.fillStyle='#ffd0f4';x.beginPath();x.arc(r+10,-r-8,5,0,7);x.fill();
      x.fillStyle='#e8c45a';x.beginPath();x.moveTo(-r*.6,-r*.75);x.lineTo(-r*.55,-r*1.15);x.lineTo(-r*.3,-r*.9);x.lineTo(-r*.1,-r*1.2);x.lineTo(r*.05,-r*.9);x.lineTo(r*.25,-r*1.1);x.lineTo(r*.2,-r*.72);x.closePath();x.fill();
      x.fillStyle='#ff3a6a';x.beginPath();x.arc(r*.42,-r*.35,4.5,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(r*.46,-r*.38,1.5,0,7);x.fill();break;}
  }
  if(e.hitT>0&&!eim)glow(x,0,0,r*1.3,'rgba(255,255,255,.5)');x.restore();x.save();x.translate(EX,EY-e.vL);x.globalAlpha=alpha;
  if(e.clampT>0){x.strokeStyle='rgba(220,225,240,.9)';x.lineWidth=3;x.beginPath();x.arc(0,0,r+2,Math.PI*1.1,Math.PI*1.9);x.stroke();}
  if(e.poiT>0){x.fillStyle='rgba(140,255,120,.8)';for(let i=0;i<2;i++){x.beginPath();x.arc(Math.sin(time*5+i*3)*r*.6,-r*.4-((time*20+i*9)%12),1.8,0,7);x.fill();}}
  if(e.schooling){x.strokeStyle='rgba(220,180,255,.6)';x.lineWidth=1;x.beginPath();x.moveTo(-r-2,-3);x.lineTo(-r-9,-3);x.moveTo(-r-2,3);x.lineTo(-r-8,3);x.stroke();}
  if(e.shield>0){x.strokeStyle='rgba(120,200,255,.7)';x.lineWidth=2;x.beginPath();x.arc(0,0,r+4,0,7);x.stroke();}
  if(e.trap>0){const gr=x.createRadialGradient(-4,-6,2,0,-2,r+8);gr.addColorStop(0,'rgba(255,255,255,.5)');gr.addColorStop(1,'rgba(110,231,255,.25)');x.fillStyle=gr;x.beginPath();x.arc(0,-2,r+8,0,7);x.fill();x.strokeStyle='rgba(200,250,255,.9)';x.lineWidth=1.5;x.stroke();}
  if(e.slow>0&&e.slowT>0){x.fillStyle='rgba(150,230,255,.7)';for(let i=0;i<3;i++){const an=time*3+i*2.1;x.beginPath();x.arc(Math.cos(an)*r,Math.sin(an)*r*.5-2,1.8,0,7);x.fill();}}
  if(e.stun>0){x.fillStyle='#fff27a';for(let i=0;i<3;i++){const an=time*8+i*2.1;txt(x,'✦',Math.cos(an)*9,-r-8+Math.sin(an)*3,8,'#fff27a');}}
  if(e.hp<e.mhp||e.shield>0){const bw=E.ph?64:Math.max(18,r*2),by=-Math.max(r,e.vh||0)-(E.ph?8:6);x.fillStyle='rgba(0,0,0,.6)';x.fillRect(-bw/2-1,by-1,bw+2,5);
    x.fillStyle=E.ph?'#ff4fb0':'#c56bff';x.fillRect(-bw/2,by,bw*Math.max(0,e.hp/e.mhp),3);if(e.shield>0){x.fillStyle='#7cc8ff';x.fillRect(-bw/2,by-3,bw*Math.min(1,e.shield/e.mhp),2);}}
  x.restore();
}
/* ---------- 영웅: 기갑 수호자 가드 ---------- */
function drawHero(x,h,time,sel){
  const [HX,HY]=lerpPos(h);
  if(h.vF===undefined){h.vF=h.face;h.vP=0;h.lx=HX;h.ly=HY;}
  const mv=Math.hypot(HX-h.lx,HY-h.ly);h.lx=HX;h.ly=HY;h.vP+=Math.min(6,mv)*.2;h.vF+=(h.face-h.vF)*Math.min(1,FDT*12);if(h.vS>0)h.vS-=FDT*2.6;
  const vf=Math.abs(h.vF)<.2?(h.vF<0?-.2:.2):h.vF,walk=h.moving,step=walk?Math.abs(Math.sin(h.vP)):0,at=Math.max(0,h.atk||0),sw=Math.sin(at*Math.PI),sl=Math.max(0,h.vS||0);
  const X=HX,Y=HY+(walk?-step*3:Math.sin(time*2)*1.2);
  x.fillStyle='rgba(0,0,0,.35)';x.beginPath();x.ellipse(HX,HY+14,14-step*2,5-step,0,0,7);x.fill();
  if(sel){x.strokeStyle=`rgba(120,255,220,${.6+.3*Math.sin(time*8)})`;x.lineWidth=2;x.beginPath();x.ellipse(HX,HY+14,20,8,0,0,7);x.stroke();}
  if(IMG.hero_guard){
    if(walk&&Math.random()<.3)fx({k:'bub',x:HX-h.face*10+(Math.random()-.5)*6,y:HY+4,v:22+Math.random()*20,s:1+Math.random()*1.6,ph:Math.random()*6,life:.7});
    x.save();x.translate(X+h.face*sw*5,Y+14);x.scale(vf*(1+sl*.2),(1-sl*.26)*(1+(walk?0:Math.sin(time*2)*.012)));x.rotate((walk?.07:0)+sw*.2);drawImg(x,IMG.hero_guard,0,0,50);x.restore();
    if(at>0){x.strokeStyle=`rgba(170,245,255,${at})`;x.lineWidth=3*at+1;x.lineCap='round';x.beginPath();const c0=h.face>0?0:Math.PI;x.arc(X+h.face*6,Y-4,20+(1-at)*8,c0-1.1,c0+1.1);x.stroke();}
    x.fillStyle='#e8c45a';x.beginPath();x.arc(X-13,Y-26,6,0,7);x.fill();txt(x,''+h.lv,X-13,Y-26,8,'#3a2a00');return;}
  x.save();x.translate(X,Y);x.scale(h.face,1);
  x.fillStyle='#d8e0e8';rr(x,-8,4,6,9,2);x.fill();rr(x,2,4,6,9,2);x.fill();
  const gr=x.createLinearGradient(0,-14,0,6);gr.addColorStop(0,'#f4f8fc');gr.addColorStop(1,'#9aa8b8');x.fillStyle=gr;rr(x,-11,-12,22,18,6);x.fill();
  x.fillStyle='#e8c45a';rr(x,-11,-2,22,3,1);x.fill();
  x.fillStyle='#24323e';rr(x,-6,-22,16,12,5);x.fill();x.fillStyle='#6ff0ff';rr(x,-1,-19,10,5,2);x.fill();glow(x,4,-17,8,'rgba(110,240,255,.6)');
  x.fillStyle='#ff9a3c';x.beginPath();x.moveTo(-4,-22);x.lineTo(-1,-29);x.lineTo(2,-22);x.fill();
  x.save();x.translate(10,-4);x.rotate(h.atk>0?-.8*h.atk:.2);x.fillStyle='#8a96a8';rr(x,0,-2,16,4,2);x.fill();x.strokeStyle='#e8c45a';x.lineWidth=2.5;x.beginPath();x.arc(16,4,5,Math.PI*1.1,Math.PI*1.9+1);x.stroke();x.restore();
  x.fillStyle='#b8c4d0';x.beginPath();x.arc(-11,-6,5,0,7);x.fill();
  x.restore();
  x.fillStyle='#e8c45a';x.beginPath();x.arc(X-12,Y-24,6,0,7);x.fill();txt(x,''+h.lv,X-12,Y-24,8,'#3a2a00');
}
/* ---------- 효과 ---------- */
const FX=[];
function fx(o){FX.push(Object.assign({life:.5,t:0},o));if(FX.length>420)FX.splice(0,FX.length-420);}
function burst(X,Y,col,n,sp,size,life){for(let i=0;i<n;i++){const a=Math.random()*7,v=sp*(.4+Math.random()*.6);fx({k:'p',x:X,y:Y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-10,col,s:size*(.6+Math.random()*.6),life:life*(.6+Math.random()*.5)});}}
function drawFx(x,dt){
  for(const f of FX){f.t+=dt;const k=f.t/f.life;if(k>=1)continue;x.globalAlpha=1-k;
    switch(f.k){
      case'p':f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy-=12*dt;x.fillStyle=f.col;x.beginPath();x.arc(f.x,f.y,f.s*(1-k*.5),0,7);x.fill();break;
      case'bub':f.y-=f.v*dt;f.x+=Math.sin(f.t*5+f.ph)*.3;x.strokeStyle='rgba(200,250,255,.8)';x.lineWidth=1;x.beginPath();x.arc(f.x,f.y,f.s,0,7);x.stroke();break;
      case'ring':x.strokeStyle=f.col;x.lineWidth=f.w||3;x.beginPath();x.arc(f.x,f.y,f.r0+(f.r-f.r0)*Math.sqrt(k),0,7);x.stroke();break;
      case'txt':txt(x,f.s,f.x,f.y-k*22,f.size||11,f.col,'center','rgba(0,0,0,.7)');break;
      case'zap':x.strokeStyle='#fff6b0';x.lineWidth=2.2;x.beginPath();f.pts.forEach((p,i)=>{if(!i){x.moveTo(p[0],p[1]);return;}const q=f.pts[i-1];for(let j=1;j<=3;j++){const u=j/3;x.lineTo(q[0]+(p[0]-q[0])*u+(j<3?(Math.random()-.5)*10:0),q[1]+(p[1]-q[1])*u+(j<3?(Math.random()-.5)*10:0));}});x.stroke();
        x.strokeStyle='rgba(120,240,255,.5)';x.lineWidth=5;x.stroke();break;
      case'line':x.strokeStyle=f.col;x.lineWidth=(f.w||4)*(1-k);x.beginPath();x.moveTo(f.x,f.y);x.lineTo(f.x2,f.y2);x.stroke();break;
      case'ink':x.fillStyle='#1a0f2a';x.beginPath();x.arc(f.x+(f.tx-f.x)*k,f.y+(f.ty-f.y)*k-Math.sin(k*Math.PI)*30,5,0,7);x.fill();break;
      case'die':x.save();x.translate(f.x,f.y-k*16);x.scale(f.face*(1-k*.35),1-k*.35);x.rotate(k*1.1);{const hh=f.w*f.im.height/f.im.width;x.drawImage(f.im,-f.w/2,-hh/2,f.w,hh);}x.restore();break;
      case'coin':{const u=k*k*(3-2*k),cx=f.x+(f.tx-f.x)*u+Math.sin(k*Math.PI)*f.arc,cy=f.y+(f.ty-f.y)*u-Math.sin(k*Math.PI)*26;x.globalAlpha=1;x.fillStyle='#7ff';x.beginPath();x.moveTo(cx,cy-4.5);x.lineTo(cx+3.5,cy);x.lineTo(cx,cy+4.5);x.lineTo(cx-3.5,cy);x.closePath();x.fill();x.fillStyle='#fff';x.fillRect(cx-1,cy-2,1.4,1.4);if(k>.92&&!f.done){f.done=1;if(f.on)f.on();}}break;
      case'num':{const pop=k<.15?k/.15:1,sz=f.size*(.6+.4*pop)*(k<.15?1.25:1);x.globalAlpha=k<.6?1:1-(k-.6)/.4;txt(x,f.s,f.x+f.dx*k,f.y-18*k-8*Math.sin(Math.min(1,k*2)*Math.PI/2),sz,f.col,'center','rgba(0,0,0,.75)',900);}break;
      case'disc':x.fillStyle=f.col;x.globalAlpha=(1-k)*.6;x.beginPath();x.arc(f.x,f.y,f.r*(.4+.6*Math.sqrt(k)),0,7);x.fill();break;
      case'banner':{const a=k<.15?k/.15:k>.75?(1-k)/.25:1,yy=f.y-(1-Math.min(1,k/.15))*-14;x.globalAlpha=a;x.fillStyle='rgba(4,16,26,.72)';x.fillRect(0,yy-22,W,44);x.fillStyle=f.col;x.fillRect(0,yy-22,W,2);x.fillRect(0,yy+20,W,2);txt(x,f.s,W/2,yy+(f.s2?-5:1),f.size||22,'#fff','center','rgba(0,0,0,.6)',900);if(f.s2)txt(x,f.s2,W/2,yy+13,11,f.col);}break;
      case'flash':x.fillStyle=f.col;x.fillRect(0,0,W,H);break;
    }}
  x.globalAlpha=1;for(let i=FX.length-1;i>=0;i--)if(FX[i].t>=FX[i].life)FX.splice(i,1);
}

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
  
  {const S=G.S;if(si>0&&!S.fresh&&!S.boss&&!ui.newMech.length&&!ui.newCmd&&!TOWER_IDS.some(k=>UNLOCK[k]===si))ui.overlay=null;}
  SV.sel=si;persist();scr='battle';musicMode='battle';
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
    case'crew':{const C=CREW[e.k],c=TCOL[e.k];fx({k:'banner',s:`${LL(C.n)} · ${LL(C.sk)}!`,y:250,col:c,size:20,life:1.2});fx({k:'flash',col:hexA(c,.28),life:.4});sfx('card');vib(30);
      if(e.k==='coral')for(const t of G.towers)if(t.k==='coral')fx({k:'ring',x:t.x,y:t.y,r0:6,r:40,col:hexA(c,.9),w:4,life:.5});
      if(e.k==='bubble')for(let i=0;i<50;i++)fx({k:'bub',x:Math.random()*W,y:80+Math.random()*640,v:40+Math.random()*60,s:2+Math.random()*4,ph:Math.random()*6,life:1+Math.random()});
      if(e.k==='jelly'){for(const o of G.enemies){fx({k:'zap',pts:[[o.x+(Math.random()-.5)*30,o.y-120],[o.x,o.y]],life:.25});fx({k:'disc',x:o.x,y:o.y,r:16,col:'#fff6b0',life:.2});}ui.shake=.3;sfx('storm');}
      if(e.k==='rune')for(const t of G.towers)fx({k:'ring',x:t.x,y:t.y,r0:6,r:34,col:hexA(c,.9),w:3,life:.6});}break;
    case'pure':{fx({k:'ring',x:e.x,y:e.y,r0:6,r:30,col:'rgba(150,255,240,.95)',w:3,life:.4});burst(e.x,e.y,'#bffff4',8,70,2.2,.5);
      if(e.act!=='gift')fx({k:'num',s:{block:L('길막이!','拦路！'),shock:L('감전!','电击！'),sweep:L('역류 돌진!','逆流冲刺！')}[e.act],x:e.x,y:e.y-22,dx:0,col:'#9ffff0',size:12,life:.9});}break;
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
  if(!ui.overlay&&G.state==='prep'){acc+=dt;while(acc>=DT){G.heroTick(DT);acc-=DT;}AL=1;}
  if(G.state==='run'&&!ui.overlay)for(const k of crewKeys())if(!SV.seen['cs_'+k]&&G.crewReady(k)&&G.enemies.length>=3){SV.seen['cs_'+k]=1;persist();showTip(L(`${LL(CREW[k].n)}의 스킬 '${LL(CREW[k].sk)}' 준비 완료! 아래 ${LL(CREW[k].n)} 버튼을 누르세요`,`${LL(CREW[k].n)}的技能「${LL(CREW[k].sk)}」已就绪！点击下方按钮`),4.5);}
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
const BAR={slam:{x:30,y:772,r:22},key:{x:215,y:772,r:15},wave:{x:238,y:752,w:136,h:40},speed:{x:416,y:772,r:20},pause:{x:424,y:23,r:16}};
const crewKeys=()=>TOWER_IDS.filter(k=>G.unlocked(k));
const crewBtn=i=>({x:79+i*49,y:772,r:22});
/* 아래(또는 위)에서 올라오는 카드: 수호탑 정보·강화, 건설 고르기 */
function sheetY(y){return y>440?62:572;}
function towerSheet(t){const Y=sheetY(t.y),X=10,w=430,o={X,Y,w,h:152,sell:{x:X+104,y:Y+104,w:92,h:36}};
  if(t.lv>=MAX_TLV)o.max={x:X+206,y:Y+102,w:212,h:40};else if(t.lv===MAX_TLV-1)o.br=[{x:X+206,y:Y+102,w:103,h:40},{x:X+315,y:Y+102,w:103,h:40}];else o.up={x:X+206,y:Y+102,w:212,h:40};return o;}
function buildSheet(i){const s=G.M.spots[i],Y=sheetY(s.y),X=10,w=430,ks=TOWER_IDS.filter(k=>UNLOCK[k]<OPEN_N||G.unlocked(k)),cw=Math.min(100,(w-20-(ks.length-1)*8)/ks.length);
  return {X,Y,w,h:152,cards:ks.map((k,j)=>({k,x:X+10+j*(cw+8),y:Y+10,w:cw,h:84})),build:{x:X+w-132,y:Y+104,w:120,h:38}};}
const hitC=(p,b,pad)=>Math.hypot(p.x-b.x,p.y-b.y)<b.r+(pad||4);
const hitR=(p,b)=>p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h;
/* ---------- 전투 터치 ---------- */
function tapBattle(p){
  if(ui.overlay)return tapOverlay(p);
  if(hitC(p,BAR.pause,8)){ui.overlay='pause';sfx('tap');return;}
  if(p.y>740){
    if(hitC(p,BAR.slam,1)){if(G.cmdReady('slam')){G.cmd('slam');ui.sel=null;}else sfx('tap');return;}
    const ks=crewKeys();for(let i=0;i<ks.length;i++)if(hitC(p,crewBtn(i),1)){const k=ks[i];
      if(!G.towers.some(t=>t.k===k))showTip(L(`${LL(CREW[k].n)}의 스킬은 ${LL(TW_TXT[k][0])}을(를) 지으면 쓸 수 있어요`,`建造${LL(TW_TXT[k][0])}后可使用${LL(CREW[k].n)}的技能`),2.5);
      else if(!G.crewSkill(k))sfx('tap');else ui.sel=null;return;}
    if(hitR(p,BAR.wave)){if(G.callWave())ui.sel=null;return;}
    if(hitC(p,BAR.speed)){ui.speed=ui.speed===1?2:1;SV.opt.fast=ui.speed===2?1:0;persist();sfx('tap');return;}
    return;
  }
  const sel=ui.sel;
  if(sel&&sel.type==='spot'){const S=buildSheet(sel.i);if(p.x>=S.X&&p.x<=S.X+S.w&&p.y>=S.Y&&p.y<=S.Y+S.h){
      for(const c of S.cards)if(hitR(p,c)){if(!G.unlocked(c.k)){showTip(L(`${UNLOCK[c.k]}판을 깨면 합류해요`,`通关第${UNLOCK[c.k]}关后加入`),2);return;}ui.opt=c.k;sfx('tap');return;}
      if(ui.opt&&hitR(p,S.build)){if(G.build(sel.i,ui.opt)){ui.sel=null;ui.opt=null;}else{showTip(L('진주가 부족해요','珍珠不足'),1.5);sfx('tap');}}
      return;}}
  if(sel&&sel.type==='tower'){const S=towerSheet(sel.t),t=sel.t;if(p.x>=S.X&&p.x<=S.X+S.w&&p.y>=S.Y&&p.y<=S.Y+S.h){
      if(hitR(p,S.sell)){G.sell(t);ui.sel=null;}
      else if(S.up&&hitR(p,S.up)){if(!G.upgrade(t)){showTip(L('진주가 부족해요','珍珠不足'),1.5);sfx('tap');}}
      else if(S.br)S.br.forEach((b,bi)=>{if(!hitR(p,b))return;if(ui.opt!=='br'+bi){ui.opt='br'+bi;sfx('tap');}else if(G.upgrade(t,bi)){ui.opt=null;}else{showTip(L('진주가 부족해요','珍珠不足'),1.5);sfx('tap');}});
      return;}}
  if(sel&&sel.type==='hero'){const h=G.hero;if(Math.hypot(p.x-h.x,p.y-h.y)>20){G.moveHero(p.x,p.y);fx({k:'ring',x:p.x,y:p.y,r0:14,r:4,col:'rgba(120,255,220,.9)',life:.35});ui.sel=null;sfx('tap');SV.seen.hero=1;persist();return;}}
  ui.opt=null;
  if(Math.hypot(p.x-G.hero.x,p.y-G.hero.y+6)<22){ui.sel={type:'hero'};sfx('tap');return;}
  for(const t of G.towers)if(Math.hypot(p.x-t.x,p.y-t.y+10)<24){if(G.clean(t))return;ui.sel={type:'tower',t};sfx('tap');return;}
  for(const k in G.M.gates){const gt=G.M.gates[k];if(Math.hypot(p.x-gt.x,p.y-gt.y)<24){if(!G.flipGate(k))showTip(L('🔑 수문 열쇠가 없어요 (2웨이브마다 1개)','🔑 没有水闸钥匙（每2波获得1把）'),2);ui.sel=null;return;}}
  for(let i=0;i<G.M.spots.length;i++){const s=G.M.spots[i];if(Math.hypot(p.x-s.x,p.y-s.y)<26&&!G.towers.some(t=>t.spot===i)){ui.sel={type:'spot',i};ui.opt=TOWER_IDS.find(k=>G.unlocked(k)&&G.gold>=G.cost(k))||'coral';sfx('tap');return;}}
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
  const ents=[...G.towers.map(t=>({y:t.y,f:()=>drawTower(x,t,time,sel&&sel.t===t)})),...G.enemies.map(e=>({y:e.y,f:()=>drawEnemy(x,e,time)})),...G.allies.map(a=>({y:a.y,f:()=>{a.fade=Math.min(1,a.t*2.5);drawEnemy(x,a,time);if(a.act==='block'){x.strokeStyle='rgba(150,255,240,.9)';x.lineWidth=3;x.beginPath();x.arc(a.x,a.y,a.r+12,-Math.PI/2,-Math.PI/2+Math.PI*2*a.t/a.T);x.stroke();}}})),{y:G.hero.y+2,f:()=>drawHero(x,G.hero,time,sel&&sel.type==='hero')}];
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
  {const B=BAR.slam,C=CMD.slam,cd=G.cmdCd.slam,cdF=cd>0?cd/(C.cd*G.B.heroCd):0,rdy=cdF<=0;if(rdy&&G.state==='run')glow(x,B.x,B.y,B.r+10,'rgba(110,220,255,.45)',.55+.35*Math.sin(time*4));
    roundBtn(x,B.x,B.y,B.r,PAL.B,rdy);x.save();x.beginPath();x.arc(B.x,B.y,B.r-2,0,7);x.clip();x.globalAlpha=cdF>0?.45:1;drawHero(x,{x:B.x,y:B.y+10,face:1,lv:G.hero.lv,atk:0,moving:false},0,false);x.restore();
    if(cdF>0){x.fillStyle='rgba(4,12,26,.55)';x.beginPath();x.moveTo(B.x,B.y);x.arc(B.x,B.y,B.r-1,-Math.PI/2,-Math.PI/2+cdF*Math.PI*2);x.closePath();x.fill();txt(x,''+Math.ceil(cd),B.x,B.y+1,15,'#fff','center',NAVY,900);}
    txt(x,LL(CREW.hero.n),B.x,B.y-B.r-7,9,'#fff','center',NAVY,900);}
  crewKeys().forEach((k,i)=>{const B=crewBtn(i),C=CREW[k],has=G.towers.some(t=>t.k===k),cd=G.crewCd[k]||0,cdF=cd>0?cd/C.cd:0,rdy=has&&cdF<=0;
    if(rdy&&G.state==='run')glow(x,B.x,B.y,B.r+10,hexA(TCOL[k],.6),.55+.35*Math.sin(time*4+i));
    roundBtn(x,B.x,B.y,B.r,has?PAL.B:PAL.X,rdy);x.save();x.beginPath();x.arc(B.x,B.y,B.r-2,0,7);x.clip();x.globalAlpha=!has?.3:cdF>0?.45:1;towerIcon(x,k,B.x,B.y+8,.95);x.restore();x.globalAlpha=1;
    if(has&&cdF>0){x.fillStyle='rgba(4,12,26,.55)';x.beginPath();x.moveTo(B.x,B.y);x.arc(B.x,B.y,B.r-1,-Math.PI/2,-Math.PI/2+cdF*Math.PI*2);x.closePath();x.fill();txt(x,''+Math.ceil(cd),B.x,B.y+1,15,'#fff','center',NAVY,900);}
    if(rdy){x.strokeStyle=TCOL[k];x.lineWidth=2.5;x.beginPath();x.arc(B.x,B.y,B.r+1,0,7);x.stroke();}
    txt(x,LL(C.n),B.x,B.y-B.r-7,9,has?'#fff':'#8fa0b4','center',NAVY,900);});
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
  if(ui.opt){const T=TW_TXT[ui.opt],C=CREW[ui.opt];txt(x,LL(T[0]),S.X+16,S.Y+112,14,TCOL[ui.opt],'left',NAVY,900);const tw=x.measureText(LL(T[0])).width;txt(x,`${LL(C.role)} ${LL(C.n)}`,S.X+24+tw,S.Y+113,10,'#bfe6ff','left',null,700);
    txt(x,LL(T[1]).slice(0,LANG==='zh'?22:26),S.X+16,S.Y+132,10,'#d8f2ff','left',null,700);btn(x,S.build,L('건설','建造'),G.gold>=G.cost(ui.opt)?'G':'X',15);}
}
function drawTowerMenu(x,t){
  const S=towerSheet(t),T=TW_TXT[t.k],C=CREW[t.k],tier=G.tier(),dm=G.dmg(t),cur=t.br?BRANCH[t.k].find(b=>b.id===t.br):null,c=G.upCost(t),can=G.gold>=c;sheetBg(x,S);
  rr(x,S.X+12,S.Y+12,82,128,14);x.fillStyle='rgba(8,22,40,.55)';x.fill();towerIcon(x,t.k,S.X+53,S.Y+62,1.5);
  for(let i=0;i<MAX_TLV;i++){x.fillStyle=i<t.lv?(t.lv>=MAX_TLV?'#ffd23f':'#5ff0dc'):'rgba(255,255,255,.18)';x.beginPath();x.arc(S.X+29+i*16,S.Y+124,5,0,7);x.fill();x.strokeStyle=NAVY;x.lineWidth=1.5;x.stroke();}
  txt(x,LL(T[0])+(cur?` · ${LL(cur.n)}`:''),S.X+106,S.Y+24,15,TCOL[t.k],'left',NAVY,900);txt(x,`${LL(C.role)} ${LL(C.n)}`,S.X+S.w-16,S.Y+24,10,'#bfe6ff','right',null,700);
  txt(x,L(`정화력 ${dm.toFixed(1)} · 간격 ${G.rate(t).toFixed(2)}초`,`净化力 ${dm.toFixed(1)} · 间隔 ${G.rate(t).toFixed(2)}秒`)+(t.aura>0?L(`  · 룬 +${Math.round(t.aura*100)}%`,`  · 符文 +${Math.round(t.aura*100)}%`):''),S.X+106,S.Y+46,11,'#fff','left',null,700);
  const brI=ui.opt&&ui.opt.startsWith('br')?+ui.opt.slice(2):-1;
  wrap(x,brI>=0&&S.br?`${LL(BRANCH[t.k][brI].n)}: ${LL(BRANCH[t.k][brI].d)}`:cur?LL(cur.d):`✦ ${LL(T[2])} Lv${tier}: ${LL(T[3](tier))}`,S.X+106,S.Y+66,S.w-124,10,brI>=0?'#ffe27a':'#d8f2ff',14,'left');
  btn(x,S.sell,L(`판매 +${G.sellVal(t)}`,`出售 +${G.sellVal(t)}`),'X',11);
  if(S.up)btn(x,S.up,L(`강화   ◆ ${c}`,`升级   ◆ ${c}`),can?'G':'X',15);
  else if(S.max)btn(x,S.max,L('최고 단계','已满级'),'X',13);
  else S.br.forEach((b,j)=>{const on=brI===j;btn(x,b,on?L('각성!','觉醒！'):LL(BRANCH[t.k][j].n),on?(can?'Y':'X'):'B',on?14:11,on?'◆ '+c:(j?'B':'A')+L(' 각성 ◆',' 觉醒 ◆')+c);});
}
function arrowHint(x,X,Y,s){const b=Math.sin(time*6)*5;x.fillStyle='#ffe27a';x.beginPath();x.moveTo(X,Y-6+b);x.lineTo(X-9,Y-20+b);x.lineTo(X+9,Y-20+b);x.closePath();x.fill();txt(x,s,X,Y-32+b,12,'#fff','center','rgba(0,0,0,.85)');}
function drawHints(x){
  if(ui.overlay||G.si!==0)return;
  if(!G.towers.length&&!(ui.sel&&ui.sel.type==='spot')){const s=G.M.spots[0];arrowHint(x,s.x,s.y-12,L('룬 자리를 눌러 수호탑 세우기','点击符文位建造守护塔'));}
  else if(G.state==='prep'&&G.towers.length&&!ui.sel)arrowHint(x,BAR.wave.x+BAR.wave.w/2,BAR.wave.y-2,L('준비되면 시작!','准备好就开始！'));
}
/* ---------- 겹쳐 뜨는 창 ---------- */

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
      txt(x,L(`남은 생명 ${G.lives} · 정화 ${G.kills}`,`剩余生命 ${G.lives} · 净化 ${G.kills}`),W/2,368,12,'#cde');
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
function header(x,title,sub){let gr=x.createLinearGradient(0,0,0,110);gr.addColorStop(0,'rgba(4,14,30,.9)');gr.addColorStop(1,'rgba(4,14,30,0)');x.fillStyle=gr;x.fillRect(0,0,W,110);
  backBtn(x);txt(x,title,W/2,36,22,'#fff','center',NAVY,900);if(sub)txt(x,sub,W/2,62,11,'#bfe6ff','center',NAVY,800);coinChip(x,W-58,36);}
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
    roundBtn(x,p[0],p[1],r,!open?PAL.X:cur?PAL.Y:boss?PAL.O:SV.stars[i]?PAL.T:PAL.B,cur);
    if(open)txt(x,boss?'👑':''+(i+1),p[0],p[1]+1,boss?20:18,'#fff','center',NAVY,900);else icon(x,'lock',p[0],p[1],1.2,'#c8d2de');
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
function drawUpgrade(dt){const x=g;x.setTransform(K,0,0,K,0,0);seaBg(x,dt,'rgba(0,10,20,.45)');header(x,L('수비대원','守卫队员'),L('레벨 1마다 정화력 +7%','每级 净化力 +7%'));
  [...TOWER_IDS,'hero'].forEach((k,i)=>{const b=upRow(i),open=metaOpen(k),lv=SV.lv[k],c=lvCost(lv),max=lv>=MAX_LV,can=open&&!max&&SV.coins>=c;panel(x,b.x,b.y,b.w,b.h);
    if(k==='hero'){x.save();x.beginPath();x.rect(b.x,b.y,90,b.h);x.clip();drawHero(x,{x:b.x+46,y:b.y+54,face:1,lv:1,atk:0,moving:false},0,false);x.restore();}else towerIcon(x,k,b.x+46,b.y+56,1.15);
    const name=`${LL(CREW[k].n)} · ${k==='hero'?LL(CREW[k].role):LL(TW_TXT[k][0])}`;
    txt(x,name,b.x+96,b.y+24,14,k==='hero'?'#bff':TCOL[k],'left');
    if(!open){txt(x,L(`🔒 ${UNLOCK[k]}판을 깨면 합류`,`🔒 通关第${UNLOCK[k]}关后加入`),b.x+96,b.y+52,12,'#9ab','left');return;}
    txt(x,`Lv ${lv}`+(max?' (MAX)':` → ${lv+1}`),b.x+96,b.y+48,13,'#fff','left');
    txt(x,L(`정화력 ×${masteryMul(lv).toFixed(2)}`,`净化力 ×${masteryMul(lv).toFixed(2)}`)+(max?'':`  →  ×${masteryMul(lv+1).toFixed(2)}`),b.x+96,b.y+70,11,'#9fd','left');
    if(!max){const bb={x:b.x+b.w-112,y:b.y+26,w:100,h:44};btn(x,bb,'◆ '+c,can?'#d0a030':'#555',14);}});
}
function tapUpgrade(p){if(hitBack(p)){scr='home';sfx('tap');return;}
  [...TOWER_IDS,'hero'].forEach((k,i)=>{const b=upRow(i),bb={x:b.x+b.w-112,y:b.y+26,w:100,h:44},lv=SV.lv[k];if(!hitR(p,bb)||!metaOpen(k)||lv>=MAX_LV)return;
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
      txt(x,LL(EN_TXT[k][0]),90,y+13,12,isBoss(k)?'#ffb0f0':'#fff','left');wrap(x,LL(EN_TXT[k][1]),90,y+29,W-124,9.5,'#bcd',11,'left');});}
  else if(dexTab===1){TOWER_IDS.forEach((k,i)=>{const y=114+i*128,T=TW_TXT[k];panel(x,20,y,W-40,120);towerIcon(x,k,52,y+38,.85);txt(x,LL(T[0]),86,y+18,14,TCOL[k],'left');wrap(x,LL(T[1]),86,y+36,W-124,10,'#cde',12,'left');
      txt(x,`✦ ${LL(T[2])}: ${LL(T[3](1))}`,32,y+64,10,'#ffe9a8','left');
      BRANCH[k].forEach((b,j)=>txt(x,`${L('각성','觉醒')} ${j?'B':'A'} · ${LL(b.n)}: ${LL(b.d)}`,32,y+82+j*17,10,j?'#ffc9a8':'#a8e8ff','left'));});}
  else{['hero',...TOWER_IDS].forEach((k,i)=>{const y=112+i*98,C=CREW[k],open=k==='hero'||UNLOCK[k]<=Math.min(cl,OPEN_N-1);panel(x,20,y,W-40,90);
      if(k==='hero'){x.save();x.beginPath();x.rect(20,y,80,90);x.clip();drawHero(x,{x:60,y:y+50,face:1,lv:1,atk:0,moving:false},0,false);x.restore();}else{x.globalAlpha=open?1:.35;towerIcon(x,k,60,y+52,1.1);x.globalAlpha=1;}
      txt(x,LL(C.n),104,y+20,15,k==='hero'?'#bff':TCOL[k],'left',NAVY,900);txt(x,LL(C.role),W-34,y+20,10,'#bfe6ff','right',null,700);
      if(!open){txt(x,L(`${UNLOCK[k]}판을 깨면 합류해요`,`通关第${UNLOCK[k]}关后加入`),104,y+50,11,'#9fb0c4','left',null,700);return;}
      wrap(x,LL(C.bio),104,y+40,W-150,10,'#d8f2ff',13,'left');const sn=k==='hero'?CMD.slam.n:C.sk,sd=k==='hero'?CMD.slam:C;txt(x,`✦ ${LL(sn)} (${sd.cd}${L('초','秒')}): ${LL(sd.d)}`.slice(0,LANG==='zh'?40:46),104,y+74,9.5,'#ffe27a','left',null,700);});}
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
const HOME_BTN={start:{x:65,y:560,w:320,h:66},up:{x:27,y:654,w:124,h:80},dex:{x:163,y:654,w:124,h:80},rw:{x:299,y:654,w:124,h:80}};
const SETB={sfx:{x:85,y:300,w:280,h:50},bgm:{x:85,y:362,w:280,h:50},lang:{x:85,y:424,w:280,h:50},story:{x:85,y:486,w:280,h:50},close:{x:145,y:556,w:160,h:46}};
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
  tile(x,HOME_BTN.up,'up',L('대원','队员'));if(canUp())dot(x,HOME_BTN.up);
  tile(x,HOME_BTN.dex,'book',L('도감','图鉴'));
  tile(x,HOME_BTN.rw,'gift',L('보상','奖励'));if(rewardBadge())dot(x,HOME_BTN.rw);
  txt(x,'v'+BUILD,W-8,H-10,9,'rgba(255,255,255,.3)','right',null,700);
  if(homeSet){x.fillStyle='rgba(2,8,20,.72)';x.fillRect(0,0,W,H);panel(x,55,230,W-110,396);txt(x,L('설정','设置'),W/2,264,20,'#fff','center',NAVY,900);
    btn(x,SETB.sfx,L('효과음  ','音效  ')+(SV.opt.sfx?'ON':'OFF'),SV.opt.sfx?'T':'X',15);btn(x,SETB.bgm,L('음악  ','音乐  ')+(SV.opt.bgm?'ON':'OFF'),SV.opt.bgm?'T':'X',15);
    btn(x,SETB.lang,LANG==='ko'?'언어: 한국어 → 中文':'语言：中文 → 한국어','B',14);btn(x,SETB.story,L('이야기 다시 보기','重看故事'),'B',14);btn(x,SETB.close,L('닫기','关闭'),'Y',15);}
}
function tapHome(p){
  if(homeSet){if(hitR(p,SETB.sfx)){SV.opt.sfx^=1;persist();sfx('tap');}else if(hitR(p,SETB.bgm)){SV.opt.bgm^=1;persist();sfx('tap');}else if(hitR(p,SETB.lang)){LANG=LANG==='ko'?'zh':'ko';SV.lang=LANG;persist();sfx('tap');}
    else if(hitR(p,SETB.story)){homeSet=false;sfx('tap');showStory(LL(TITLE),PROLOGUE,()=>{scr='home';});}else if(hitR(p,SETB.close)||p.y<230||p.y>626){homeSet=false;sfx('tap');}return;}
  if(Math.hypot(p.x-30,p.y-36)<26){homeSet=true;sfx('tap');return;}
  if(hitR(p,HOME_BTN.start)){sfx('tap');mapArea=-1;if(!SV.seen.pro){SV.seen.pro=1;persist();showStory(LL(TITLE),PROLOGUE,()=>{scr='map';});}else scr='map';return;}
  if(hitR(p,HOME_BTN.up)){sfx('tap');scr='upgrade';return;}if(hitR(p,HOME_BTN.dex)){sfx('tap');scr='dex';return;}if(hitR(p,HOME_BTN.rw)){sfx('tap');scr='reward';return;}}
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

})();
