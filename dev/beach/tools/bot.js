#!/usr/bin/env node
/* 자동 플레이 봇: 화면 없이 한 판을 끝까지 돌려 밸런스를 잰다.  node tools/bot.js [판수]
   none   = 아무것도 안 지음 (반드시 져야 함)
   casual = 4초에 한 번 생각하고 가끔 딴짓, 스킬은 거의 안 씀, 파도를 미리 부르지 않음
   good   = 1초에 한 번 생각, 좋은 자리부터 짓고 올리고, 스킬과 먹물 닦기를 제때 씀 */
const fs=require('fs'),path=require('path'),vm=require('vm');
const src=['data.js','core.js'].map(f=>fs.readFileSync(path.join(__dirname,'../src',f),'utf8')).join('\n');
const m={exports:{}};vm.runInNewContext(src,{module:m,Math,console,Set,Map,Array,Object});
const C=m.exports;
const WEIGHT={didi:2,tt:2,peng:2,shan:1.5,dun:1,zhuo:1};
function owned(si){return C.TOWER_IDS.filter(id=>!C.UNLOCK[id]||C.UNLOCK[id]<=si);}

const HM=!!process.env.HARD;
function bot(seed,style,si,lvl){
  const ids=owned(si),lv={};ids.forEach(id=>lv[id]=lvl);
  const s=C.newGame(si,{seed,lv,owned:ids,hard:HM,sauces:HM&&process.env.SOY?{salt:1,soy:1}:{}});let a=(seed*7919+17)>>>0;const R=()=>{a=a+0x6D2B79F5|0;let q=Math.imul(a^a>>>15,1|a);q=q+Math.imul(q^q>>>7,61|q)^q;return((q^q>>>14)>>>0)/4294967296;};
  const order=s.spots.map((sp,i)=>i).sort((a,b)=>C.stageGeo(si).spots[b].cov-C.stageGeo(si).spots[a].cov);
  const every=style==='good'?60:240;let minLives=20;
  for(let tick=0;tick<60*60*25&&!s.ended;tick++){
    C.step(s);s.fx.length=0;if(s.lives<minLives)minLives=s.lives;
    if(s.phase==='pick'){const pr=['taste','bun2','pop','skew','tea','reach','frost','sticky','sauce','tip','sale','life','coin'];let k=0;if(style==='good'){let bv=99;s.picks.forEach((c,j)=>{const v=pr.indexOf(c);if(v<bv){bv=v;k=j;}});}else k=Math.floor(R()*s.picks.length);C.pickCard(s,k);continue;}
    if(s.phase==='revive'){if(style==='good'||style==='casual')C.revive(s);else C.giveUp(s);continue;}
    if(style==='none'){if(s.ws==='prep')C.callWave(s);continue;}
    if(tick%every)continue;if(style==='casual'&&R()<.3)continue;
    // 짓기·올리기
    for(let guard=0;guard<4;guard++){
      const tws=s.spots.filter(sp=>sp.tw),empty=order.filter(i=>!s.spots[i].tw),want=Math.min(s.spots.length,3+Math.floor(s.wave*.8));
      if(empty.length&&tws.length<want){const cnt={};ids.forEach(id=>cnt[id]=0);tws.forEach(sp=>cnt[sp.tw.id]++);let id=ids[0],bv=1e9;for(const q of ids){const v=(cnt[q]+.5)/WEIGHT[q];if(v<bv){bv=v;id=q;}}
        if(style==='casual'&&R()<.35)id=ids[Math.floor(R()*ids.length)];
        if(!C.build(s,empty[style==='casual'&&R()<.3?Math.floor(R()*empty.length):0],id))break;}
      else{let best=-1,bc=1e9;order.forEach(i=>{const tw=s.spots[i].tw;if(tw&&tw.lv<4){const c=C.upCost(tw,s)*(1+tw.lv*.15);if(c<bc){bc=c;best=i;}}});
        if(best<0)break;const tw=s.spots[best].tw;if(!C.upgrade(s,best,C.BRANCH[tw.id][Math.floor(R()*2)]))break;}
    }
    if(s.ws==='prep'&&(style==='good'||tick>600))C.callWave(s);
    if(style==='good'){
      s.spots.forEach((sp,i)=>{if(sp.tw&&sp.tw.ink>0)C.cleanInk(s,i);});
      const near=()=>{let bi=-1,bn=0;s.spots.forEach((sp,i)=>{if(!sp.tw)return;const n=s.en.filter(e=>(e.x-sp.x)**2+(e.y-sp.y)**2<130*130).length;if(n>bn){bn=n;bi=i;}});return bn>=3||s.en.some(e=>e.k==='boss')?bi:-1;};
      if(s.sauce>=1&&s.en.length>=4){const i=near();if(i>=0)C.castSauce(s,i,s.kinds.soy?'soy':undefined);}if(s.lock>0)C.wipeJar(s);
      if(s.ws==='gap'&&s.gapT>180&&s.lives>=18)C.callWave(s);
    }else{if(s.sauce>=1&&s.en.length>3&&R()<.35){const t=s.spots.map((sp,i)=>i).filter(i=>s.spots[i].tw);if(t.length)C.castSauce(s,t[Math.floor(R()*t.length)]);}if(R()<.5)s.spots.forEach((sp,i)=>{if(sp.tw&&sp.tw.ink>0)C.cleanInk(s,i);});}
  }
  if(!s.ended&&process.env.DBG)console.log('STALL',style,s.ws,s.wave,'en',s.en.length,'q',s.queue.length,'gapT',s.gapT,'phase',s.phase,s.en.slice(0,3).map(e=>e.k+' d'+Math.round(e.d)+'/'+Math.round(e.len)+' hp'+Math.round(e.hp)+' st'+e.stun+' sl'+e.slow+' air'+e.air).join(';'));
  return {won:s.won,wave:s.wave,sec:s.t/60,stars:s.stars,lives:s.lives,minLives,ended:s.ended,gold:s.gold,tw:s.spots.filter(sp=>sp.tw).map(sp=>sp.tw.id[0]+sp.tw.lv).join('')};
}
const N=+process.argv[2]||40,avg=(a,f)=>a.reduce((x,y)=>x+f(y),0)/a.length;let bad=0;
for(const si of (process.env.ONLY?process.env.ONLY.split(',').map(x=>+x-1):[0,4,9,16,19,27,29,39,45,49])){const rec=Math.min(40,C.STAGES[si].rec+(HM?C.HARD.lv:0));
  for(const [style,lvl] of [['none',rec],['casual',rec],['good',rec],['good',Math.max(1,rec-4)]]){
    if(lvl!==rec&&si===0)continue;const r=[];const runs=style==='none'?2:N;
    for(let i=0;i<runs;i++){try{r.push(bot(500+i*13+si*71,style,si,lvl));}catch(e){bad++;console.log('오류',e.stack);break;}}if(!r.length)continue;
    const wins=r.filter(x=>x.won),st=[0,1,2,3].map(k=>r.filter(x=>x.stars===k).length);if(r.some(x=>!x.ended))bad++;if(style==='none'&&wins.length)bad++;
    console.log(`${String(si+1).padStart(2)}판 hp${C.STAGES[si].hp.toFixed(2)} Lv${String(lvl).padEnd(2)} ${style.padEnd(6)} 클리어 ${(wins.length/r.length*100).toFixed(0).padStart(3)}%  ${avg(r,x=>x.sec).toFixed(0)}초  파도 ${avg(r,x=>x.wave).toFixed(1)}/${C.STAGES[si].waves}  남은목숨 ${avg(r,x=>x.lives).toFixed(1)}  별0/1/2/3 ${st.join('/')}  ${r[0].tw}`);
  }
}
function hz(fps){const ids=owned(2),s=C.newGame(2,{seed:5,owned:ids});C.build(s,0,'tt');C.build(s,1,'didi');C.callWave(s);let g=0;while(!s.ended&&g++<fps*60*25){C.advance(s,1/fps);s.fx.length=0;if(s.phase==='pick')C.pickCard(s,0);if(s.phase==='revive')C.giveUp(s);}return s.t+'|'+s.wave+'|'+s.kills+'|'+s.gold;}
const a=hz(60),b=hz(120),c=hz(90);console.log('주사율 60/90/120Hz',a,b,c,a===b&&b===c?'같음':'다름!');if(a!==b||b!==c)bad++;

if(bad){console.log('실패',bad);process.exit(1);}
