#!/usr/bin/env node
/* 자동 플레이 봇: 화면 없이 한 판을 끝까지 돌려 밸런스를 잰다.  node tools/bot.js [판수]
   lazy   = 필살기도 안 쓰고 카드도 아무거나 (아주 어린 아이)
   casual = 필살기는 조금 늦게, 카드는 아무거나, 상자는 가끔 줍고 자리는 안 바꿈 (보통 사람)
   good   = 한 영웅에 카드를 몰고, 필살기를 적이 많을 때 쓰고, 먹물을 바로 닦음 */
const fs=require('fs'),path=require('path'),vm=require('vm');
const src=['data.js','core.js'].map(f=>fs.readFileSync(path.join(__dirname,'../src',f),'utf8')).join('\n');
const m={exports:{}};vm.runInNewContext(src,{module:m,Math,console,Set,Map,Array,Object});
const C=m.exports;
const TEAMS=[['tt','didi','peng'],['tt','didi','peng','shan'],['tt','didi','peng','shan','dun'],['tt','didi','peng','shan','dun'],['tt','zhuo','peng','shan','dun']];

function bot(seed,style,si,lvl){
  const lv={};TEAMS[si].forEach(id=>lv[id]=lvl);
  const s=C.newRun(seed,TEAMS[si],{stage:si,lv});const R=(n)=>((seed*2654435761+n*97)>>>0)/4294967296;let n=0,deadAt=null;
  for(let tick=0;tick<60*60*20;tick++){
    C.step(s);s.fx.length=0;if(s.ended)break;
    if(s.phase==='card'){
      let i=0;if(style==='good'){let best=-1;s.offer.forEach((c,k)=>{const h=c.hero&&s.heroes.find(x=>x&&x.id===c.hero);const v=(h?2+h.pips*2:1.5)+(c.id==='all_wall'&&s.wall<60?9:0);if(v>best){best=v;i=k;}});}
      else i=Math.floor(R(++n)*s.offer.length);
      C.pickCard(s,i);continue;
    }
    if(s.phase==='revive'){if(deadAt===null)deadAt=s.t/60;if(style==='lazy')C.giveUp(s);else C.revive(s);continue;}
    if(tick%30)continue; // 사람처럼 0.5초에 한 번만 판단
    if(style==='lazy')continue;
    for(const l of s.loot.slice())if(style==='good'||R(++n)<(l.k==='box'?.5:.2))C.tapField(s,l.x,l.y);
    for(const h of s.heroes){if(!h)continue;
      if(h.ink>0){if(style==='good'||R(++n)<.3)C.tapHero(s,h.slot);continue;}
      if(h.ult<1)continue;
      if(style==='good'){const near=s.en.filter(e=>e.y>200).length;if(near>=6||s.boss||s.wall<60)C.tryUlt(s,h.slot);}
      else if(R(++n)<.12)C.tryUlt(s,h.slot);}
  }
  return {won:!!s.won,wave:s.wave,sec:s.t/60,stars:s.stars,lv:s.lv,reward:s.reward,deadAt,revived:s.revived,ended:s.ended,dealt:s.heroes.filter(Boolean).map(h=>h.id+Math.round(h.dealt/1000)+'k').join(' ')};
}

const N=+process.argv[2]||100;
const avg=(a,f)=>a.reduce((x,y)=>x+f(y),0)/a.length;
let bad=0;
for(let si=0;si<C.STAGES.length;si++){
  const rec=C.STAGES[si].rec;
  for(const [style,lvl] of [['lazy',rec],['casual',rec],['good',rec],['casual',Math.max(1,rec-2)],['good',Math.max(1,rec-2)]]){
    if(si===0&&lvl!==rec)continue;if(lvl===rec-2&&style==='lazy')continue;
    const r=[];for(let i=0;i<N;i++){try{r.push(bot(1000+i*7+si*131,style,si,lvl));}catch(e){bad++;console.log('오류',style,i,e.stack);break;}}
    if(!r.length)continue;
    const wins=r.filter(x=>x.won),st=[0,1,2,3].map(k=>r.filter(x=>x.stars===k).length);
    const early=r.filter(x=>x.deadAt!==null&&x.deadAt<30).length,unfinished=r.filter(x=>!x.ended).length;if(unfinished)bad++;
    console.log(`${si+1}장 Lv${String(lvl).padEnd(2)} ${style.padEnd(7)} 클리어 ${(wins.length/r.length*100).toFixed(0).padStart(3)}%  ${avg(r,x=>x.sec).toFixed(0)}초  웨이브 ${avg(r,x=>x.wave).toFixed(1)}  카드 ${(avg(r,x=>x.lv)-1).toFixed(1)}  별0/1/2/3 ${st.join('/')}  부활 ${r.filter(x=>x.revived).length}  초반사망 ${early}  보상 ${avg(r,x=>x.reward).toFixed(0)}  ${r[0].dealt}`);
  }
}
// 60Hz·120Hz: 같은 시드를 다른 프레임 간격으로 돌려 결과가 같은지
function hz(fps){const s=C.newRun(77,TEAMS[2],{stage:2});let g=0;while(!s.ended&&g++<fps*60*20){C.advance(s,1/fps);s.fx.length=0;if(s.phase==='card')C.pickCard(s,0);if(s.phase==='revive')C.giveUp(s);}return s.t+'|'+s.wave+'|'+s.wall+'|'+s.kills;}
const a=hz(60),b=hz(120),c=hz(90);console.log('주사율 60/90/120Hz',a,b,c,a===b&&b===c?'같음':'다름!');if(a!==b||b!==c)bad++;
if(bad){console.log('실패',bad);process.exit(1);}
