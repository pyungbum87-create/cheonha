// 내 장수 전공 성장 측정: 조조 휘하 내 장수를 전선 선봉에 10년 세워 능력 변화를 본다. usage: node tools/grow_test.js
const fs=require('fs');let src=fs.readFileSync('/home/claude/cheonha/nanse2/tools/act_test.js','utf8');
src=src.split('const T = ctx.T, res')[0]+`
const T = ctx.T; const ST = { m:'무', i:'지', l:'통', c:'인', g:'정' };
const res = [];
for (let r = 0; r < 6; r++){
  T.newGame('cao', 200, 'real'); const G = T.GG; G.talks = [];
  T.META.custom = [{ id:'cuX', n:'이현', age:22, st:{ mu:12, ji:10, yong:12, in:8, jeong:8 }, tr:['명장'], look:{ img:'face01' }, w:'geom', pers:'yongjang' }];
  T.cuSummon(T.META.custom[0]); const cu = G.people.cuX; const F = T.frontsOf(G.pfac)[0]; cu.city = F.my[0]; T.frSetRole(F.id, 'van', 'cuX');
  const npc = Object.values(G.people).find(p => p.fac===G.pfac && p.alive && p.id!==G.pid && p.id!=='cuX' && !p.custom && (p.m||0) < 75 && !p.army); npc.city = F.my[0];
  T.frSetRole(F.id, 'adv', npc.id);
  const b0 = { cu:{ m:cu.m, l:cu.l, i:cu.i }, np:{ m:npc.m, l:npc.l, i:npc.i } };
  for (let m = 0; m < 120; m++){ G.phase = 'act'; G.talks = []; try { T.endMonth(); } catch(e){ console.log('ERR', e.message); break; } if (G.over || G.dead) break; G.phase = 'act';
    if (!T.frontsOf(G.pfac).some(f => T.frState(f.id).r.van==='cuX')){ const F2 = T.frontsOf(G.pfac)[0]; if (F2 && !cu.army){ cu.city = F2.my[0]; T.frSetRole(F2.id, 'van', 'cuX'); } }
    if (!T.frontsOf(G.pfac).some(f => T.frState(f.id).r.adv===npc.id)){ const F2 = T.frontsOf(G.pfac).find(f => T.frState(f.id).r.van==='cuX'); if (F2 && !npc.army && npc.alive){ npc.city = F2.my[0]; T.frSetRole(F2.id, 'adv', npc.id); } } }
  res.push([b0, { cu:{ m:cu.m, l:cu.l, i:cu.i }, np:{ m:npc.m, l:npc.l, i:npc.i, n:npc.n } }, G.duels||0]);
}
for (const [a, b] of res) console.log('내 장수 무', a.cu.m, '→', b.cu.m, '통', a.cu.l, '→', b.cu.l, '지', a.cu.i, '→', b.cu.i, ' | 일반 참모', b.np.n, '지', a.np.i, '→', b.np.i, '무', a.np.m, '→', b.np.m);
console.log('META 기록', JSON.stringify(T.META.custom[0].gr));
`;
fs.writeFileSync('/tmp/grow2.js', src.replace("path.join(__dirname, '..', 'src')","'/home/claude/cheonha/nanse2/src'")); require('/tmp/grow2.js');
