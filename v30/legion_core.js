/* 军团征战 / 관문 돌파 — CORE (rules, data, gate generator, battle, save).
   No DOM, no canvas, no timers: runs the same in a browser, a WeChat/Douyin mini-game and in node tests.
   Everything that should grow later is a plain data table in D (types, forms, skills, synergies, traits,
   chapters, curve, unlocks). Add a row → the game picks it up. See LEGION_GUIDE.md.                     */
(function(root){
'use strict';
const D={};
/* ---------- tuning curve (one place to rebalance hundreds of gates) ---------- */
D.curve={teamSize:3,gatesPerChapter:10,lvPerGate:.72,bossLv:2,lateFrom:100,lateLv:.12,
  goldBase:30,goldPer:8,expBase:25,expPer:14,expNeed:45,trainCost:25,replayRate:.5,timeLimit:90,tick:.05};
/* ---------- troop types. beats = which types this one counters ---------- */
D.types={
 inf:{n:{ko:'창병',zh:'枪兵'},s:{ko:'창',zh:'枪'},range:'melee',spd:.9,hp:1.15,atk:.95,gauge:1,beats:['cav'],c:'#4f86c6'},
 cav:{n:{ko:'기병',zh:'骑兵'},s:{ko:'기',zh:'骑'},range:'melee',spd:1.25,hp:1,atk:1.05,gauge:1,beats:['arc'],c:'#c9583a'},
 arc:{n:{ko:'궁병',zh:'弓兵'},s:{ko:'궁',zh:'弓'},range:'ranged',spd:1,hp:.85,atk:1.08,gauge:1,beats:['inf'],c:'#4f9c41'},
 str:{n:{ko:'책사',zh:'谋士'},s:{ko:'책',zh:'谋'},range:'ranged',spd:1,hp:.8,atk:1,gauge:1.3,beats:[],c:'#8a5cc4'}};
D.counter={win:1.3,lose:.77};
D.genType={};            // optional override {unitId:'cav'} — otherwise derived from stats
/* ---------- formations. slots: col 0 = front line, 1 = back line; y 0..1. mods use the selector grammar ---------- */
D.forms={
 feng:{unlock:1,n:{ko:'봉시진',zh:'锋矢阵'},d:{ko:'선봉 공격 +25%, 선봉 받는 피해 +10%',zh:'先锋攻击+25%，先锋受伤+10%'},
   slots:[{col:0,y:.5},{col:1,y:.15},{col:1,y:.85}],mods:[{who:'front',stat:'atk',mul:1.25},{who:'front',stat:'taken',mul:1.1}]},
 he:{unlock:1,n:{ko:'학익진',zh:'鹤翼阵'},d:{ko:'원거리 공격 +20%',zh:'远程攻击+20%'},
   slots:[{col:0,y:.15},{col:1,y:.5},{col:0,y:.85}],mods:[{who:'ranged',stat:'atk',mul:1.2}]},
 fang:{unlock:1,n:{ko:'방원진',zh:'方圆阵'},d:{ko:'받는 피해 -20%, 공격 -10%',zh:'受到伤害-20%，攻击-10%'},
   slots:[{col:0,y:.3},{col:0,y:.7},{col:1,y:.5}],mods:[{who:'all',stat:'taken',mul:.8},{who:'all',stat:'atk',mul:.9}]},
 yan:{unlock:15,n:{ko:'안행진',zh:'雁行阵'},d:{ko:'모두 기력 충전 +25%',zh:'全体蓄力+25%'},
   slots:[{col:0,y:.15},{col:1,y:.5},{col:1,y:.85}],mods:[{who:'all',stat:'gauge',mul:1.25}]},
 chang:{unlock:30,n:{ko:'장사진',zh:'长蛇阵'},d:{ko:'속도 +20%, 체력 -10%',zh:'速度+20%，体力-10%'},
   slots:[{col:0,y:.5},{col:1,y:.2},{col:1,y:.8}],mods:[{who:'all',stat:'spd',mul:1.2},{who:'all',stat:'hp',mul:.9}]},
 yu:{unlock:60,n:{ko:'어린진',zh:'鱼鳞阵'},d:{ko:'선봉 체력 +40%, 후위 공격 +10%',zh:'先锋体力+40%，后卫攻击+10%'},
   slots:[{col:0,y:.5},{col:1,y:.2},{col:1,y:.8}],mods:[{who:'front',stat:'hp',mul:1.4},{who:'back',stat:'atk',mul:1.1}]}};
/* ---------- skills. kind: hit | all | heal | buff | debuff. pow = attack multiple ---------- */
D.skills={
 qinglong:{ko:'청룡언월',zh:'青龙偃月',kind:'hit',pow:3.2},roar:{ko:'호통',zh:'怒吼',kind:'debuff',pow:1.2,eff:'atkDown',dur:4},
 charge7:{ko:'칠진칠출',zh:'七进七出',kind:'hit',pow:2.6,hits:2},eastwind:{ko:'동남풍',zh:'借东风',kind:'all',pow:1.6},
 command:{ko:'호령',zh:'号令',kind:'buff',pow:.3,eff:'atkUp',dur:5},wushuang:{ko:'무쌍',zh:'无双',kind:'all',pow:2.2},
 firewall:{ko:'화계',zh:'火计',kind:'all',pow:1.3,eff:'burn',dur:4},conquer:{ko:'소패왕',zh:'小霸王',kind:'hit',pow:2.8},
 trap:{ko:'매복',zh:'埋伏',kind:'debuff',pow:1.4,eff:'stun',dur:2},snipe:{ko:'백보천양',zh:'百步穿杨',kind:'hit',pow:3.4},
 heal:{ko:'인덕',zh:'仁德',kind:'heal',pow:.22},charm:{ko:'경국',zh:'倾国',kind:'debuff',pow:.6,eff:'stun',dur:1.5},
 t_inf:{ko:'방진',zh:'方阵',kind:'buff',pow:0,eff:'guard',dur:4},t_cav:{ko:'돌격',zh:'突击',kind:'hit',pow:2.4},
 t_arc:{ko:'일제사격',zh:'齐射',kind:'all',pow:1.1},t_str:{ko:'책략',zh:'计策',kind:'all',pow:1.2,eff:'slow',dur:3}};
D.genSkill={gwanu:'qinglong',jangbi:'roar',joun:'charge7',jegal:'eastwind',jojo:'command',yeopo:'wushuang',juyu:'firewall',sonchaek:'conquer',
 samaui:'trap',hwangchung:'snipe',macho:'charge7',jangryo:'charge7',heojeo:'roar',yubi:'heal',songwon:'heal',choseon:'charm',dongtak:'roar',
 wonso:'command',yukson:'firewall',bangtong:'firewall'};
/* ---------- synergies (both sides get them). need: {faction,count} | {ids:[all]} | {any:[..],count} | {types:{t:n}} | {distinct:n} ---------- */
D.syn=[
 {id:'wei3',need:{faction:0,count:3},n:{ko:'위 3인',zh:'魏三人'},d:{ko:'체력 +20%, 받는 피해 -10%',zh:'体力+20%，受伤-10%'},mods:[{who:'all',stat:'hp',mul:1.2},{who:'all',stat:'taken',mul:.9}]},
 {id:'wei2',need:{faction:0,count:2},hide:'wei3',n:{ko:'위 2인',zh:'魏二人'},d:{ko:'체력 +10%',zh:'体力+10%'},mods:[{who:'all',stat:'hp',mul:1.1}]},
 {id:'shu3',need:{faction:1,count:3},n:{ko:'촉 3인',zh:'蜀三人'},d:{ko:'공격 +20%',zh:'攻击+20%'},mods:[{who:'all',stat:'atk',mul:1.2}]},
 {id:'shu2',need:{faction:1,count:2},hide:'shu3',n:{ko:'촉 2인',zh:'蜀二人'},d:{ko:'공격 +10%',zh:'攻击+10%'},mods:[{who:'all',stat:'atk',mul:1.1}]},
 {id:'wu3',need:{faction:2,count:3},n:{ko:'오 3인',zh:'吴三人'},d:{ko:'스킬 위력 +30%',zh:'技能威力+30%'},mods:[{who:'all',stat:'skill',mul:1.3}]},
 {id:'wu2',need:{faction:2,count:2},hide:'wu3',n:{ko:'오 2인',zh:'吴二人'},d:{ko:'스킬 위력 +15%',zh:'技能威力+15%'},mods:[{who:'all',stat:'skill',mul:1.15}]},
 {id:'qun3',need:{faction:3,count:3},n:{ko:'군웅 3인',zh:'群雄三人'},d:{ko:'속도 +20%',zh:'速度+20%'},mods:[{who:'all',stat:'spd',mul:1.2}]},
 {id:'qun2',need:{faction:3,count:2},hide:'qun3',n:{ko:'군웅 2인',zh:'群雄二人'},d:{ko:'속도 +10%',zh:'速度+10%'},mods:[{who:'all',stat:'spd',mul:1.1}]},
 {id:'taoyuan',need:{ids:['yubi','gwanu','jangbi']},n:{ko:'도원결의',zh:'桃园结义'},d:{ko:'공격 +30%, 체력 +20%',zh:'攻击+30%，体力+20%'},mods:[{who:'all',stat:'atk',mul:1.3},{who:'all',stat:'hp',mul:1.2}]},
 {id:'wolong',need:{ids:['jegal','bangtong']},n:{ko:'와룡봉추',zh:'卧龙凤雏'},d:{ko:'스킬 위력 +50%',zh:'技能威力+50%'},mods:[{who:'all',stat:'skill',mul:1.5}]},
 {id:'jinlan',need:{ids:['sonchaek','juyu']},n:{ko:'단금지교',zh:'断金之交'},d:{ko:'기력 충전 +30%',zh:'蓄力+30%'},mods:[{who:'all',stat:'gauge',mul:1.3}]},
 {id:'lianhuan',need:{ids:['yeopo','choseon']},n:{ko:'연환계',zh:'连环计'},d:{ko:'여포 공격 +40%',zh:'吕布攻击+40%'},mods:[{who:'id:yeopo',stat:'atk',mul:1.4}]},
 {id:'tiger',need:{any:['gwanu','jangbi','joun','macho','hwangchung'],count:2},n:{ko:'오호대장',zh:'五虎上将'},d:{ko:'공격 +15%',zh:'攻击+15%'},mods:[{who:'all',stat:'atk',mul:1.15}]},
 {id:'cav3',need:{types:{cav:3}},n:{ko:'철기 돌격',zh:'铁骑突击'},d:{ko:'속도 +30%',zh:'速度+30%'},mods:[{who:'cav',stat:'spd',mul:1.3}]},
 {id:'arc2',need:{types:{arc:2}},n:{ko:'화살비',zh:'箭雨'},d:{ko:'궁병 공격 +15%',zh:'弓兵攻击+15%'},mods:[{who:'arc',stat:'atk',mul:1.15}]},
 {id:'inf2',need:{types:{inf:2}},n:{ko:'창벽',zh:'枪林'},d:{ko:'창병 받는 피해 -15%',zh:'枪兵受伤-15%'},mods:[{who:'inf',stat:'taken',mul:.85}]},
 {id:'mix3',need:{distinct:3},n:{ko:'삼군 조화',zh:'三军协同'},d:{ko:'받는 피해 -8%',zh:'受伤-8%'},mods:[{who:'all',stat:'taken',mul:.92}]}];
/* ---------- gate traits (battlefield conditions). side: ally | enemy | both. Change every replay day ---------- */
D.traits={
 rain:{unlock:6,n:{ko:'폭우',zh:'暴雨'},d:{ko:'궁병 공격 -25%, 책사 스킬 +20%',zh:'弓兵攻击-25%，谋士技能+20%'},mods:[{side:'both',who:'arc',stat:'atk',mul:.75},{side:'both',who:'str',stat:'skill',mul:1.2}]},
 plain:{unlock:6,n:{ko:'평원',zh:'平原'},d:{ko:'기병 속도 +30%',zh:'骑兵速度+30%'},mods:[{side:'both',who:'cav',stat:'spd',mul:1.3}]},
 fort:{unlock:8,n:{ko:'성벽',zh:'城墙'},d:{ko:'적 받는 피해 -20%',zh:'敌军受伤-20%'},mods:[{side:'enemy',who:'all',stat:'taken',mul:.8}]},
 fire:{unlock:10,n:{ko:'건조한 바람',zh:'干风'},d:{ko:'모든 스킬 위력 +30%',zh:'全体技能+30%'},mods:[{side:'both',who:'all',stat:'skill',mul:1.3}]},
 fog:{unlock:12,n:{ko:'짙은 안개',zh:'浓雾'},d:{ko:'원거리 공격 -20%',zh:'远程攻击-20%'},mods:[{side:'both',who:'ranged',stat:'atk',mul:.8}]},
 river:{unlock:14,n:{ko:'강가',zh:'河畔'},d:{ko:'기병 속도 -25%, 창병 피해 -15%',zh:'骑兵速度-25%，枪兵受伤-15%'},mods:[{side:'both',who:'cav',stat:'spd',mul:.75},{side:'both',who:'inf',stat:'taken',mul:.85}]},
 elite:{unlock:20,n:{ko:'정예병',zh:'精兵'},d:{ko:'적 체력 +25%',zh:'敌军体力+25%'},mods:[{side:'enemy',who:'all',stat:'hp',mul:1.25}]},
 ambush:{unlock:25,n:{ko:'복병',zh:'伏兵'},d:{ko:'적 후위 기력 충전 +50%',zh:'敌后卫蓄力+50%'},mods:[{side:'enemy',who:'back',stat:'gauge',mul:1.5}]},
 morale:{unlock:6,n:{ko:'사기충천',zh:'士气高昂'},d:{ko:'아군 공격 +10%',zh:'我军攻击+10%'},mods:[{side:'ally',who:'all',stat:'atk',mul:1.1}]},
 night:{unlock:40,n:{ko:'야습',zh:'夜袭'},d:{ko:'근접 공격 +20%, 원거리 -10%',zh:'近战+20%，远程-10%'},mods:[{side:'both',who:'melee',stat:'atk',mul:1.2},{side:'both',who:'ranged',stat:'atk',mul:.9}]}};
/* ---------- chapters (names cycle; round 2+ gets a numeral). Art keys: bg_<art> ---------- */
D.chapters=[
 {n:{ko:'황건의 난',zh:'黄巾之乱'},art:'plain'},{n:{ko:'반동탁 연합',zh:'讨董联军'},art:'gate'},{n:{ko:'서주 쟁탈',zh:'徐州之争'},art:'castle'},
 {n:{ko:'관도 대전',zh:'官渡之战'},art:'plain'},{n:{ko:'장판파',zh:'长坂坡'},art:'river'},{n:{ko:'적벽 대전',zh:'赤壁之战'},art:'river'},
 {n:{ko:'형주 공방',zh:'荆州攻防'},art:'castle'},{n:{ko:'한중 쟁탈',zh:'汉中之争'},art:'mountain'},{n:{ko:'이릉 대전',zh:'夷陵之战'},art:'forest'},
 {n:{ko:'남만 정벌',zh:'南征'},art:'forest'},{n:{ko:'북벌',zh:'北伐'},art:'mountain'},{n:{ko:'오장원',zh:'五丈原'},art:'plain'},
 {n:{ko:'천하통일',zh:'天下一统'},art:'gate'}];
D.mobs=['m0','m1','m2','m3','m4','m5','m6','m7'];
/* first-clear unlocks; past the table every boss gate gives a random not-owned general of an allowed grade */
D.unlocks={2:'madae',4:'gamnyeong',6:'hwangchung',8:'jangryo',10:'yubi',13:'joun',16:'juyu',20:'gwanu',25:'jangbi',30:'jegal',40:'jojo',50:'yeopo'};
D.gradeAt=n=>n<12?1:n<35?2:n<120?3:4;      // highest enemy general grade at gate n
D.starters=['ugeum','gwanpyeong','jeongbo','hwaung','w_sp','s_ar','o_sp','q_ar'];
D.version='legion-2';

/* ---------- helpers ---------- */
const lang={cur:'ko'};const tx=o=>o?(o[lang.cur]||o.ko):'';
function rng(seed){let s=(seed>>>0)||0x9e3779b9;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296;};}
function hash(...a){let h=2166136261;for(const v of a){h^=(v|0);h=Math.imul(h,16777619);h^=h>>>13;}return h>>>0;}
const baseId=id=>id&&id.replace(/^m_/,'');
let UNITS=[],UID={},FACN=[];
function setUnits(units,factions){UNITS=units;UID={};units.forEach(u=>UID[u.id]=u);FACN=factions||[];}
function typeOf(u){if(D.genType[u.id])return D.genType[u.id];if(u.lt)return u.lt;if(/_sp$/.test(u.id))return'inf';if(/_ar$/.test(u.id))return'arc';
  const [mu,tong,ji]=u.s;if(ji>=88&&ji>mu)return'str';if(mu>=tong+8)return'cav';if(tong>mu)return'arc';return'inf';}
const counterOf=t=>Object.keys(D.types).find(k=>D.types[k].beats.includes(t));

/* ---------- gate generator: gate n is fully determined by (n, salt). salt 0 = first clear, day number = replays ---------- */
function chapterOf(n){const c=Math.floor((n-1)/D.curve.gatesPerChapter);const ch=D.chapters[c%D.chapters.length];return{c,round:Math.floor(c/D.chapters.length)+1,ch};}
function gate(n,salt,playerTypes){const C=D.curve,R=rng(hash(n,salt||0,7));const k=(n-1)%C.gatesPerChapter+1,boss=k===C.gatesPerChapter;
  let lv=1+(n-1)*C.lvPerGate+(boss?C.bossLv:0)+Math.max(0,n-C.lateFrom)*C.lateLv;if(salt)lv+=1;   // replays are a little harder
  const gmax=D.gradeAt(n),pool=UNITS.filter(u=>u.g>=1&&u.g<=gmax&&(gmax>=4||u.g<4));
  const pick=a=>a[Math.floor(R()*a.length)];const foes=[];
  const pGen=Math.min(.85,Math.max(0,(n-3)/30));
  for(let j=0;j<C.teamSize;j++){
    if((boss&&j===0)||R()<pGen){const u=pick(pool.filter(x=>!foes.some(f=>f.gen===x.id)));if(u){foes.push({gen:u.id,lv:Math.max(1,Math.round(lv-2*u.g))});continue;}}
    foes.push({mob:pick(D.mobs),type:pick(['inf','cav','arc']),lv:Math.round(lv)});}
  // boss gates read the player's line-up: their soldiers switch to the types that counter it
  if(boss&&playerTypes&&playerTypes.length){let i=0;for(const f of foes)if(f.mob){const c=counterOf(playerTypes[i++%playerTypes.length]);if(c)f.type=c;}}
  const forms=Object.keys(D.forms).filter(f=>D.forms[f].unlock<=n);
  const tpool=Object.keys(D.traits).filter(t=>D.traits[t].unlock<=n),tn=n<6?0:n<30?1:n<120?2:3,traits=[];
  while(traits.length<Math.min(tn,tpool.length)){const t=pick(tpool);if(!traits.includes(t))traits.push(t);}
  const{c,round,ch}=chapterOf(n);
  return{n,salt:salt||0,k,boss,c,round,chapter:ch,foes,form:pick(forms),traits,seed:hash(n,salt||0,99),
    gold:Math.round((C.goldBase+n*C.goldPer)*(boss?2:1)),exp:Math.round((C.expBase+n*C.expPer)*(boss?1.5:1))};}

/* ---------- selector grammar for mods ---------- */
function match(f,who){if(who==='all')return true;if(who==='front')return f.col===0;if(who==='back')return f.col===1;
  if(who==='ranged'||who==='melee')return D.types[f.type].range===who;if(D.types[who])return f.type===who;
  if(who.startsWith('id:'))return baseId(f.id)===who.slice(3);if(who.startsWith('faction:'))return f.fac===+who.slice(8);if(who==='gen')return f.isGen;if(who==='mob')return!f.isGen;return false;}
function synergies(members){const ids=members.map(m=>m.u?baseId(m.u.id):null).filter(Boolean),facs={},types={};
  for(const m of members){if(m.u)facs[m.u.f]=(facs[m.u.f]||0)+1;const t=m.u?typeOf(m.u):m.type;types[t]=(types[t]||0)+1;}
  const on=D.syn.filter(s=>{const q=s.need;if(q.faction!==undefined)return(facs[q.faction]||0)>=q.count;if(q.ids)return q.ids.every(i=>ids.includes(i));
    if(q.any)return q.any.filter(i=>ids.includes(i)).length>=q.count;if(q.types)return Object.keys(q.types).every(t=>(types[t]||0)>=q.types[t]);if(q.distinct)return Object.keys(types).length>=q.distinct;return false;});
  return on.filter(s=>!s.hide||!on.some(o=>o.id===s.hide));}

/* ---------- battle ---------- */
function fighter(src,side,slot,form){const isGen=!!src.u,u=src.u,type=isGen?typeOf(u):src.type,T=D.types[type],lv=src.lv;
  const s=isGen?u.s:[48+lv*1.5,48+lv*1.5,36+lv,30,30],grade=isGen?u.g:1;
  const atk=(s[0]*.6+s[1]*.25+s[2]*(type==='str'?.6:.1))*(1+.08*lv)*(1+.25*grade)*T.atk;
  const hp=(600+s[1]*14)*(1+.10*lv)*(1+.35*grade)*T.hp;const sl=D.forms[form].slots[slot]||{col:1,y:.5};
  return{side,slot,col:sl.col,y:sl.y,type,atk,hp,max:hp,def:Math.min(.5,.12+s[1]/700),spd:T.spd,gaugeR:T.gauge,skillMul:1,taken:1,
    gauge:0,cd:.3+slot*.15,skill:isGen?(D.genSkill[baseId(u.id)]||'t_'+type):'t_'+type,id:isGen?u.id:src.mob,isGen,u:isGen?u:null,fac:isGen?u.f:-1,lv,fx:{},alive:true};}
function applyMods(fs,mods){for(const m of mods)for(const f of fs){if(!match(f,m.who))continue;
  if(m.stat==='atk')f.atk*=m.mul;else if(m.stat==='hp'){f.hp*=m.mul;f.max*=m.mul;}else if(m.stat==='taken')f.taken*=m.mul;
  else if(m.stat==='spd')f.spd*=m.mul;else if(m.stat==='gauge')f.gaugeR*=m.mul;else if(m.stat==='skill')f.skillMul*=m.mul;}}
// teamA: [{u,lv}|{mob,type,lv}] in slot order. opt: {formA,formB,traits,seed,boost}
function newBattle(teamA,teamB,opt){const R=rng(opt.seed||1);
  const A=teamA.map((x,i)=>fighter(x,0,i,opt.formA)),B=teamB.map((x,i)=>fighter(x,1,i,opt.formB));
  const synA=synergies(teamA),synB=synergies(teamB);
  applyMods(A,D.forms[opt.formA].mods);applyMods(B,D.forms[opt.formB].mods);
  for(const s of synA)applyMods(A,s.mods);for(const s of synB)applyMods(B,s.mods);
  for(const t of opt.traits||[])for(const m of D.traits[t].mods){if(m.side!=='enemy')applyMods(A,[m]);if(m.side!=='ally')applyMods(B,[m]);}
  for(const f of A.concat(B)){f.hp=f.max=Math.round(f.max);}
  if(opt.boost)for(const f of A){f.max=Math.round(f.max*opt.boost);f.hp=f.max;}
  return{A,B,R,t:0,limit:D.curve.timeLimit,done:false,win:false,synA,synB};}
function pickTarget(me,foes){const live=foes.filter(f=>f.alive);if(!live.length)return null;
  if(D.types[me.type].range==='melee'){const fr=live.filter(f=>f.col===0);return(fr.length?fr:live).sort((a,b)=>Math.abs(a.y-me.y)-Math.abs(b.y-me.y))[0];}
  const good=live.filter(f=>D.types[me.type].beats.includes(f.type));return(good.length?good:live).sort((a,b)=>a.hp-b.hp)[0];}
function dmg(a,d,mult,R){const ta=D.types[a.type];let m=mult*(ta.beats.includes(d.type)?D.counter.win:D.types[d.type].beats.includes(a.type)?D.counter.lose:1);
  if(a.fx.atkUp>0)m*=1.3;if(a.fx.atkDown>0)m*=.75;
  return Math.max(1,Math.round(a.atk*m*(1-d.def)*d.taken*(d.fx.guard>0?.6:1)*(.9+R()*.2)));}
function hurt(t,v,ev,a,big){t.hp-=v;ev.push({k:'hit',a,d:t,v,big});if(t.hp<=0&&t.alive){t.hp=0;t.alive=false;ev.push({k:'die',f:t});}}
function cast(f,side,foes,R){const sk=D.skills[f.skill],ev=[{k:'skill',f,sk:f.skill}],p=sk.pow*f.skillMul;
  if(sk.kind==='hit'){for(let i=0;i<(sk.hits||1);i++){const t=pickTarget(f,foes);if(!t)break;hurt(t,dmg(f,t,p,R),ev,f,1);}}
  else if(sk.kind==='all'){for(const t of foes.filter(x=>x.alive)){hurt(t,dmg(f,t,p,R),ev,f,1);if(sk.eff&&t.alive)t.fx[sk.eff]=sk.dur;}}
  else if(sk.kind==='heal'){for(const t of side)if(t.alive){const v=Math.round(t.max*sk.pow*f.skillMul);t.hp=Math.min(t.max,t.hp+v);ev.push({k:'heal',d:t,v});}}
  else if(sk.kind==='buff'){for(const t of side)if(t.alive)t.fx[sk.eff]=sk.dur;}
  else if(sk.kind==='debuff'){const t=pickTarget(f,foes);if(t){t.fx[sk.eff]=sk.dur*(sk.eff==='stun'?f.skillMul:1);hurt(t,dmg(f,t,p,R),ev,f,1);}}
  return ev;}
function step(st){const dt=D.curve.tick,ev=[],R=st.R;st.t+=dt;
  for(const f of st.A.concat(st.B)){if(!f.alive)continue;for(const k in f.fx){f.fx[k]-=dt;if(f.fx[k]<=0)delete f.fx[k];}
    if(f.fx.burn>0){f.hp-=f.max*.012*dt*10;if(f.hp<=0){f.hp=0;f.alive=false;ev.push({k:'die',f});}}}
  for(const[side,foes]of[[st.A,st.B],[st.B,st.A]])for(const f of side){if(!f.alive||f.fx.stun>0)continue;
    f.cd-=dt*f.spd*(f.fx.slow>0?.6:1);f.gauge=Math.min(100,f.gauge+dt*(12+f.lv*.05)*f.gaugeR);
    if(f.gauge>=100){f.gauge=0;ev.push(...cast(f,side,foes,R));continue;}
    if(f.cd<=0){f.cd=1.2;const t=pickTarget(f,foes);if(!t)continue;hurt(t,dmg(f,t,1,R),ev,f,0);t.gauge=Math.min(100,t.gauge+4);}}
  const a=st.A.some(f=>f.alive),b=st.B.some(f=>f.alive);
  if(!a||!b||st.t>=st.limit){st.done=true;st.win=a&&(!b||share(st.A)>share(st.B));}
  return ev;}
const share=s=>s.reduce((h,f)=>h+f.hp,0)/s.reduce((m,f)=>m+f.max,0);
function finish(st){let n=0;while(!st.done&&n++<1e5)step(st);return st;}
function stars(st){if(!st.win)return 0;return 1+(share(st.A)>=.5?1:0)+(st.A.every(f=>f.alive)?1:0);}

/* ---------- save + growth ---------- */
function defSave(){return{v:2,cleared:0,gold:0,gens:{},team:[],form:'feng',stars:{},seen:{}};}
function loadSave(raw){const S=Object.assign(defSave(),raw||{});S.v=2;for(const id of D.starters)if(UID[id]&&!S.gens[id])S.gens[id]={lv:1,exp:0};return S;}
const needExp=lv=>lv*D.curve.expNeed;
function addExp(r,x){r.exp+=x;let up=0;while(r.exp>=needExp(r.lv)){r.exp-=needExp(r.lv);r.lv++;up++;}return up;}
const trainCost=lv=>Math.round(D.curve.trainCost*lv*(1+lv*.05));
function train(S,id){const r=S.gens[id],c=trainCost(r.lv);if(!r||S.gold<c)return false;S.gold-=c;r.lv++;r.exp=0;return true;}
function unlockFor(S,n){if(D.unlocks[n])return UID[D.unlocks[n]]&&!S.gens[D.unlocks[n]]?D.unlocks[n]:null;
  if(n%D.curve.gatesPerChapter)return null;const R=rng(hash(n,5)),pool=UNITS.filter(u=>u.g>=1&&u.g<=Math.min(3,D.gradeAt(n))&&!S.gens[u.id]);
  return pool.length?pool[Math.floor(R()*pool.length)].id:null;}
// apply a finished battle to the save; returns what the result screen shows
function settle(S,G,team,st){const win=st.win,first=win&&G.n>S.cleared,rate=first?1:(G.salt?D.curve.replayRate:.3);
  const gold=Math.round(G.gold*(win?rate:.15)),exp=Math.round(G.exp*(win?rate:.3)),sr=stars(st),old=S.stars[G.n]||0;let unlock=null;
  if(first){S.cleared=G.n;unlock=unlockFor(S,G.n);if(unlock)S.gens[unlock]={lv:Math.max(1,Math.round(G.n*.5)),exp:0,isNew:1};}
  if(sr>old)S.stars[G.n]=sr;const bonus=win?Math.max(0,sr-old)*Math.round(G.gold*.3):0;S.gold+=gold+bonus;
  const ups={};for(const id of team)ups[id]=addExp(S.gens[id],exp);
  return{win,first,gold,exp,bonus,stars:sr,newStars:sr>old,unlock,ups};}
function totalStars(S){let t=0;for(const k in S.stars)t+=S.stars[k];return t;}

const API={D,lang,tx,rng,hash,setUnits,typeOf,counterOf,gate,chapterOf,synergies,newBattle,step,finish,stars,share,
  loadSave,needExp,addExp,trainCost,train,settle,unlockFor,totalStars,get UID(){return UID;},get UNITS(){return UNITS;}};
root.LEGION_CORE=API;if(typeof module!=='undefined')module.exports=API;
})(typeof window!=='undefined'?window:typeof GameGlobal!=='undefined'?GameGlobal:globalThis);
