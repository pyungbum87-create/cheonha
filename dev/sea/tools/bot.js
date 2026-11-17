// 자동 플레이 봇: node tools/bot.js [판번호|all] [실력 good|mid]
const fs=require('fs'),vm=require('vm'),path=require('path');
const ctx={console,Math,Set,Object,Array,JSON};vm.createContext(ctx);
for(const f of ['data.js','core.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f),'utf8'),ctx);
vm.runInContext('this.Game=Game;this.stageInfo=stageInfo;this.buildMap=buildMap;this.TOWERS=TOWERS;this.recLv=recLv;this.CMD=CMD;this.dist=dist',ctx);
const {Game}=ctx;
function play(si,skill){
  const mlv=Math.max(1,ctx.recLv(si)+(+process.env.DLV||0));const lv={};for(const k of ['coral','bubble','jelly','conch','rune','hero'])lv[k]=mlv;const g=new Game(si,{lv}),M=g.M,good=skill==='good',weak=skill==='weak';const order=M.spots.map((_,i)=>i);if(weak)order.sort((a,b)=>((a*7)%5)-((b*7)%5));
  // 자리 순서: 신전에 가까운(늦게 지나가는) 자리보다 덮는 길이 많은 자리 먼저 = 이미 정렬됨
  const plan=good?['coral','bubble','jelly','coral','conch','rune','jelly','coral','conch','bubble','coral','jelly']:['coral','coral','jelly','bubble','coral','conch','jelly','coral','bubble','conch','coral','jelly'];
  let pi=0,steps=0;g.moveHero(M.spots[0].x,M.spots[0].y+10);
  g.callWave();
  while(g.state!=='win'&&g.state!=='lose'&&steps<60*60*25){
    if(g.state==='card'){const pref=['skill','allDmg','hero','lives','gold','discount','coral','jelly','conch','bubble','rune','vent','key','reverse'];let bi=0,bv=99;g.cards.forEach((c,i)=>{const v=pref.indexOf(c);if(v<bv){bv=v;bi=i;}});g.pickCard(good?bi:0);continue;}
    if(steps%30===0){
      // 짓기
      while(pi<M.spots.length){let k=plan[pi%plan.length];if(!g.unlocked(k))k='coral';if(g.gold>=g.cost(k)+(g.towers.length>=4?40:0)+(weak?60:0)){g.build(order[pi],k);pi++;}else break;}
      // 강화
      if(pi>=Math.min(M.spots.length,6)||g.wave>3){const t=g.towers.filter(t=>t.lv<4).sort((a,b)=>a.lv-b.lv)[0];if(t&&g.gold>=g.upCost(t))g.upgrade(t,good?0:(t.id%2));}
      // 먹물 닦기(잘하는 봇)
      if(good)for(const t of g.towers)if(t.ink>0)g.clean(t);
      // 영웅 스킬
      if(good){const n=g.enemies.filter(e=>ctx.dist(e.x,e.y,g.hero.x,g.hero.y)<80).length;if(n>=3)g.cmd('slam');if(g.enemies.length>=5)for(const k of ['jelly','bubble','coral','conch','rune'])g.crewSkill(k);}
      else if(steps%600===0){g.cmd('slam');if(!weak)for(const k of ['jelly','bubble','coral'])g.crewSkill(k);}
      // 수문: 긴 길로
      if(good&&!process.env.NOGATE&&g.keys>0)for(const k in M.gates){const G=M.gates[k],L=G.to.map(id=>M.segs[id].len);const want=L[0]>=L[1]?0:1;if(G.st!==want&&g.spawning)g.flipGate(k);}
      if(g.nextT>0&&g.nextT<WAVE_GAP_EARLY)g.callWave();
    }
    const lw=g.wave;g.tick();steps++;if(process.env.TRACE&&g.wave!==lw)console.log("w",g.wave,"lives",g.lives,"gold",g.gold,"towers",g.towers.map(t=>t.k[0]+t.lv).join(""),"ens",g.enemies.length);
  }
  return {si,state:g.state,lost:g.lost,lives:g.lives,wave:g.wave,stars:g.stars(),towers:g.towers.length,gold:g.gold,muts:g.mutList.join(','),bl:g.blessList.join(',')};
}
const WAVE_GAP_EARLY=-1;
const arg=process.argv[2]||'all',sk=process.argv[3]||'good';
const list=arg==='all'?[...Array(50).keys()]:arg.includes('-')?(()=>{const [a,b]=arg.split('-').map(Number);return [...Array(b-a+1).keys()].map(x=>x+a);})():[+arg];
for(const si of list){const r=play(si,sk);console.log(JSON.stringify(r));}
