// usage: node build_people.js <people_dir> <stats.json> <equipment.json> <out.json>
const fs=require('fs'),path=require('path');
const [dir,statsF,eqF,out]=process.argv.slice(2);
const S=JSON.parse(fs.readFileSync(statsF,'utf8')),E=JSON.parse(fs.readFileSync(eqF,'utf8'));
const traits=new Set(S.traits.map(t=>t.key)),pers=new Set(S.personalities.map(p=>p.key)),wtypes=new Set(S.weaponTypes.map(w=>w.key)),named=new Map(E.named.map(n=>[n.id,n]));
const errs=[],people=[],ids=new Set();
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.csv')).sort()){
  const lines=fs.readFileSync(path.join(dir,f),'utf8').trim().split('\n');const head=lines.shift().split(',');
  lines.forEach((l,i)=>{const c=l.split(',');const at=`${f}:${i+2}`;
    if(c.length!==head.length){errs.push(`${at} 칸 수 ${c.length}≠${head.length}`);return;}
    const r=Object.fromEntries(head.map((h,j)=>[h,c[j]]));
    if(!/^[a-z][a-z0-9_]*$/.test(r.id))errs.push(`${at} id 형식 ${r.id}`);
    if(ids.has(r.id))errs.push(`${at} id 중복 ${r.id}`);ids.add(r.id);
    const st={};for(const k of['mu','yong','ji','jeong','in']){const v=+r[k];if(!(v>=1&&v<=20))errs.push(`${at} ${k}=${r[k]}`);st[k]=v;}
    const born=+r.born,died=r.died?+r.died:null;if(!(born>100&&born<230))errs.push(`${at} born ${r.born}`);if(died!==null&&died<born)errs.push(`${at} died<born`);
    if(!pers.has(r.pers))errs.push(`${at} 성격 ${r.pers}`);
    const tr=r.traits?r.traits.split('|'):[];tr.forEach(t=>{if(!traits.has(t))errs.push(`${at} 특성 ${t}`)});
    let weapon=null,horse=null,book=null;
    if(named.has(r.weapon)){const n=named.get(r.weapon);if(n.slot==='weapon')weapon=r.weapon;else if(n.slot==='horse'){horse=r.weapon;}else book=r.weapon;}
    else if(!wtypes.has(r.weapon))errs.push(`${at} 무기 ${r.weapon}`);
    const wtype=weapon?named.get(weapon).type:(wtypes.has(r.weapon)?r.weapon:'geom');
    if(!['m','f'].includes(r.sex))errs.push(`${at} 성별 ${r.sex}`);
    people.push({id:r.id,name:r.name,born,died,yearsEstimated:r.est==='e',stats:st,personality:r.pers,traits:tr,weaponType:wtype,equip:{weapon,horse,book},sex:r.sex,group:r.group});
  });
}
for(const n of E.named)if(n.owner184&&!ids.has(n.owner184))errs.push(`장비 ${n.id} 주인 없음 ${n.owner184}`);
if(errs.length){console.log('오류 '+errs.length+'건\n'+errs.join('\n'));process.exit(1);}
fs.writeFileSync(out,JSON.stringify(people));
const cnt={};people.forEach(p=>cnt[p.group]=(cnt[p.group]||0)+1);
console.log('장수',people.length,'명 · 여성',people.filter(p=>p.sex==='f').length,'명');console.log(Object.entries(cnt).sort((a,b)=>b[1]-a[1]).map(([g,n])=>g+' '+n).join(', '));
const g20={};people.forEach(p=>Object.entries(p.stats).forEach(([k,v])=>{if(v===20)(g20[k]=g20[k]||[]).push(p.name)}));console.log('20점:',JSON.stringify(g20));
