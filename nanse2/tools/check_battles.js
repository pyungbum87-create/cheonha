const fs=require('fs');const B=JSON.parse(fs.readFileSync(process.argv[2],'utf8')).battles;const P=new Map(JSON.parse(fs.readFileSync(process.argv[3],'utf8')).map(p=>[p.id,p]));
const C=new Set(JSON.parse(fs.readFileSync(process.argv[4],'utf8')).map(c=>c.id));const errs=[];const ids=new Set();
for(const b of B){if(ids.has(b.id))errs.push('중복 '+b.id);ids.add(b.id);if(!C.has(b.at))errs.push(b.id+' 성 없음 '+b.at);
 const who=[...(b.a?.leaders||[]),...(b.b?.leaders||[]),...(b.duels||[]).flatMap(d=>[d[0],d[1]])];
 for(const w of who){const p=P.get(w);if(!p){errs.push(b.id+' 인물 없음 '+w);continue;}
  if(p.born>b.year-12)errs.push(`${b.id} ${p.name} 나이 ${b.year-p.born}`);if(p.died&&p.died<b.year)errs.push(`${b.id} ${p.name} 이미 사망(${p.died})`);}
}
console.log('전투·사건',B.length,'건 (대',B.filter(b=>b.scale==='large').length,'중',B.filter(b=>b.scale==='mid').length,'소',B.filter(b=>b.scale==='small').length,'사건',B.filter(b=>b.scale==='event').length,') 일기토',B.reduce((s,b)=>s+(b.duels||[]).length,0),'회 분기',B.reduce((s,b)=>s+(b.branches||[]).length,0),'개');
console.log(errs.length?'오류\n'+errs.join('\n'):'오류 없음');
