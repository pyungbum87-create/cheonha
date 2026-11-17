const fs=require('fs'),path=require('path'),vm=require('vm');
const src=fs.readFileSync(path.join(__dirname,'sim.js'),'utf8').replace("path.join(__dirname, '..', 'src')", JSON.stringify(path.join(__dirname,'..','src'))).split('const ctx = makeCtx()')[0].replace(/process\.argv\[\d\]/g,'0');
eval(src+'; globalThis.mk=makeCtx;');
for (const pid of ['cao','liubei','sunjian']){
 const T=mk().T; T.newGame(pid,184,'real'); let G=T.G; const r0=G.role+'/'+G.pfac;
 let guard=0; while(!(G.year===190&&G.month>=2)&&guard++<200){ const ph=G.phase;
  if(ph==='act')T.endMonth(); else if(ph==='report')T.afterReport(); else if(ph==='event'){T.chooseEvent(0);T.afterEvent();} else if(ph==='battle')T.autoBattle(); else if(ph==='battleEnd'){ if(G.battle&&G.battle.kind==='raise'){G.battle=null;G.phase='act';} else T.afterBattle(); } else break; G=T.G;}
 const own={};Object.values(G.cities).forEach(c=>own[c.owner||'무주']=(own[c.owner||'무주']||0)+1);
 console.log(pid,'184:',r0,'→ 190.2:',G.role+'/'+G.pfac,'성',G.city,'| 세력별 성',JSON.stringify(own));
}
