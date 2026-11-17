// 회귀자 판을 돌리며 해마다 역사 일치도와 기억 상태를 출력한다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const src=fs.readFileSync(path.join(__dirname,'sim.js'),'utf8').split('const ctx = makeCtx()')[0].replace("path.join(__dirname, '..', 'src')", JSON.stringify(path.join(__dirname,'..','src'))).replace(/process\.argv\[\d\]/g,'0');
eval(src+'; globalThis.mk=makeCtx;');
for (const [sc, role] of [[184,'ronin'],[190,'ruler'],[196,'officer']]){
  const T=mk().T; const cs=T.regCities(sc,role), fac=(T.regFacs(sc)[0]||[])[0];
  T.newRegressor({name:'이현',role,focus:'ji',fac,city:cs[0],sc}); let G=T.G; const line=[];
  for(let k=0;k<12*15 && G.phase!=='over';k++){ const ph=G.phase;
    if(ph==='act'){ if(G.month===1) line.push(G.year+':'+G.reg.hist+'('+T.histMatch()+')'); T.endMonth(); }
    else if(ph==='report')T.afterReport(); else if(ph==='event'){T.chooseEvent(0);T.afterEvent();} else if(ph==='battle')T.autoBattle();
    else if(ph==='battleEnd'){ if(G.battle&&G.battle.kind==='raise'){G.battle=null;G.phase='act';} else T.afterBattle(); }
    else if(ph==='succession'){ const c=T.heirCands(); if(c.length)T.succeed(c[0]); else break; } G=T.G; }
  const m=T.memories()[0];
  console.log(`${sc} ${role} [${G.role}/${G.pfac}] 일치도(판도):`, line.join(' '));
  console.log('   기억 예:', m ? `${m.when} ${m.n} ${m.text.slice(0,40)}${m.broken?' (어긋남)':''}` : '없음');
}
