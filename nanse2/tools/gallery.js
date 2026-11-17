// 초상화 모아 보기: node tools/gallery.js out.html id1 id2 ...
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'sim.js'),'utf8').split('const ctx = makeCtx()')[0].replace("path.join(__dirname, '..', 'src')", JSON.stringify(path.join(__dirname,'..','src'))).replace(/process\.argv\[\d\]/g,'0');
eval(src+'; globalThis.mk=makeCtx;');
const T=mk().T; T.newGame('cao',200,'real');
const [out,...ids]=process.argv.slice(2);
const cells=ids.map(id=>{ const p=T.person(id); if(!p) return ''; const age=200-p.b; const fem=!!p.female; const cols={wei:'#2f5d9e',shu:'#2f8a57',wu:'#c2412d',yuan:'#a68a2a',dz:'#4b3b55',lvb:'#7a3b3b'};
  return `<div class="c"><div class="pt">${T.ptSvg(T.lookOf(p), Math.max(16,age), fem, cols[p.fac]||'#8a7a5a')}</div><b>${p.n}</b><small>${age}세</small></div>`; }).join('');
fs.writeFileSync(out,`<!doctype html><meta charset=utf8><style>body{background:#efe5cf;font:13px sans-serif;margin:8px}.g{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.c{display:flex;flex-direction:column;align-items:center}.pt{width:120px;height:120px;border-radius:50%;overflow:hidden;box-shadow:0 0 0 2px #f7f0e1,0 0 0 3px #0003}.pt svg{width:100%;height:100%;display:block}small{color:#6f6356}</style><div class="g">${cells}</div>`);
