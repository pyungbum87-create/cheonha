const fs=require('fs');const t=fs.readFileSync(process.argv[2],'utf8');const P=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
const old=new Map([...t.matchAll(/\["([a-z]+)","([가-힣]{1,5})",(\d+),(\d+),(\d+),(\d+),(\d+),(\d+),"/g)].map(m=>[m[1],{mu:+m[5],ji:+m[6],yong:+m[7],in:+m[8]}]));
let n=0,same=0,near=0,allSame=[];const diffs=[];
for(const p of P){const o=old.get(p.id);if(!o)continue;n++;let s=0;
 for(const k of['mu','ji','yong','in']){const scaled=Math.round(o[k]/5);if(scaled===p.stats[k])same++;if(Math.abs(scaled-p.stats[k])<=1)near++;if(scaled===p.stats[k])s++;diffs.push(p.stats[k]-o[k]/5);}
 if(s===4)allSame.push(p.name);}
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
console.log('겹치는 인물',n,'명, 비교 칸',n*4);console.log('기존÷5와 정확히 같은 칸',same,`(${(same/n/4*100).toFixed(0)}%)`,'· ±1 이내',near);
console.log('네 항목 모두 같은 인물',allSame.length,allSame.join(' '));
