// 세력 생존 측정: 플레이어를 영향력 없는 재야로 두고 AI끼리 굴려, 위·촉·오가 언제 사라지는지 본다.
// usage: node tools/survival.js [판 수/시나리오=6] [개월=240] [시나리오들=190,196,200,207]
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..', 'src');
let html = fs.readFileSync(path.join(root, 'game_src.html'), 'utf8');
html = html.replace('/*@@INK@@*/', ['ink1.js', 'ink2.js', 'ink3.js'].map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n'));
const code = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).sort((a, b) => b.length - a.length)[0];
const store = {}, el = () => ({ style: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, appendChild() {}, setAttribute() {}, querySelector: () => null, querySelectorAll: () => [] });
const ctx = { __SIM: true, console, Math, JSON, Date, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, requestAnimationFrame: () => 0,
  localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
  document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: el, addEventListener() {}, body: el(), documentElement: el(), fonts: { ready: Promise.resolve() } },
  navigator: { language: 'ko', vibrate() {} }, location: { search: '', hash: '' }, addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }),
  performance: { now: () => Date.now() }, URLSearchParams, btoa, atob, escape, unescape, encodeURIComponent, decodeURIComponent, Promise, Object, Array, Number, String, Set, Map, Symbol, Error, isNaN, parseInt, parseFloat };
ctx.window = ctx.globalThis = ctx.self = ctx; vm.createContext(ctx); vm.runInContext(code, ctx);
const T = ctx.T, runs = +(process.argv[2] || 6), months = +(process.argv[3] || 240), scs = (process.argv[4] || '190,196,200,207').split(',').map(Number);
const WATCH = ['wei', 'shu', 'wu'], NAME = { wei: '조조', shu: '유비', wu: '손씨' };
for (const sc of scs) {
  const dead = { wei: [], shu: [], wu: [] }, peak = { wei: [], shu: [], wu: [] }, at10 = { wei: [], shu: [], wu: [] }, killer = {};
  for (let r = 0; r < runs; r++) {
    const cs = T.regCities(sc, 'ronin'); T.newRegressor({ name: '관찰', role: 'ronin', focus: 'ji', city: cs[r % cs.length], sc, mode: process.env.MODE || 'real' }); T.G.diff = 'normal'; let flips = 0, prevOwn = Object.fromEntries(Object.values(T.G.cities).map(c => [c.id, c.owner]));
    const G = () => T.G, cnt = f => Object.values(G().cities).filter(c => c.owner === f).length;
    const gone = {}, pk = { wei: 0, shu: 0, wu: 0 };
    for (let m = 0; m < months; m++) {
      const g = G(); const ph = g.phase;
      try {
        if (ph === 'act') T.endMonth(); else if (ph === 'report') T.afterReport();
        else if (ph === 'event') { const ch = T.evChoices(); T.chooseEvent(Math.max(0, ch.findIndex(c => !c.cost || g.gold >= c.cost))); T.afterEvent(); }
        else if (ph === 'battle') T.autoBattle(); else if (ph === 'battleEnd') { if (g.battle && (g.battle.kind === 'raise' || g.battle.kind === 'hduel')) { g.battle = null; g.phase = 'act'; } else T.afterBattle(); }
        else if (ph === 'succession') { const c = T.heirCands(); if (c.length) T.succeed(c[0]); else { if (process.env.V) console.log('  계승자 없음', G().year); break; } } else { if (process.env.V) console.log('  멈춤', ph, G().year, JSON.stringify(G().over||'').slice(0,60)); break; }
      } catch (e) { console.log('오류', e.message); break; }
      if (process.env.DBG && G().month === 1) { const F = G().facs[process.env.DBG], r = F && T.person(F.ruler); console.log('   ', G().year, process.env.DBG, F && F.alive, r && r.n, r && r.alive, r && r.fac, '성', cnt(process.env.DBG), JSON.stringify(F && F.guest), 'match', T.histMatch ? T.histMatch() : '?'); }
      G().hp = 100; for (const c of Object.values(G().cities)) { if (prevOwn[c.id] !== c.owner) { flips++; prevOwn[c.id] = c.owner; } }
      const y = G().year + (G().month - 1) / 12;
      for (const f of WATCH) { const n = cnt(f); pk[f] = Math.max(pk[f], n); if (y - sc >= 10 && at10[f].length < r + 1) at10[f].push(n); if (!gone[f] && pk[f] && !(G().facs[f] && G().facs[f].alive)) { gone[f] = y; const top = Object.entries(Object.values(G().cities).reduce((a, c) => (c.owner && (a[c.owner] = (a[c.owner] || 0) + 1), a), {})).sort((a, b) => b[1] - a[1])[0]; killer[f + ':' + (top && top[0])] = (killer[f + ':' + (top && top[0])] || 0) + 1; } }
    }
    (globalThis.FL = globalThis.FL || []).push(flips);
    for (const f of WATCH) { dead[f].push(gone[f] ? Math.round((gone[f] - sc) * 10) / 10 : null); peak[f].push(pk[f]); }
  }
  console.log(`\n[${sc}년 시작 · ${runs}판 · ${months / 12}년]`);
  for (const f of WATCH) { const d = dead[f].filter(x => x !== null); if (!peak[f].some(x => x)) continue; console.log(`  ${NAME[f]}: 멸망 ${d.length}/${runs}판` + (d.length ? ` (평균 ${(d.reduce((a, b) => a + b, 0) / d.length).toFixed(1)}년 만)` : '') + ` · 최대 성 ${peak[f].join('/')} · 10년 뒤 성 ${at10[f].join('/')}`); }
  console.log('  멸망 당시 최강 세력:', JSON.stringify(killer), '· 성 주인 바뀐 횟수', globalThis.FL.join('/')); globalThis.FL = [];
  const fin = Object.entries(Object.values(T.G.cities).reduce((a, c) => (a[c.owner || '-'] = (a[c.owner || '-'] || 0) + 1, a), {})).sort((a, b) => b[1] - a[1]); console.log('  마지막 판 끝 판도:', fin.map(x => x.join(':')).join(' '));
}
