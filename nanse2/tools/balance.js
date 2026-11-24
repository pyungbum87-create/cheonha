// 밸런스 지표: 평범한 플레이어처럼 매달 평정 진언을 받아들이는 봇으로 난이도별 성장 곡선을 잰다.
// usage: node tools/balance.js [판수/난이도=4] [개월=180]
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
const T = ctx.T, runs = +(process.argv[2] || 4), months = +(process.argv[3] || 180);
const PLAYS = [['cao', 190], ['liubei', 200], ['sunquan', 200], ['yuanshao', 196], ['liubiao', 196]];
const DIFFS = ['easy', 'normal', 'hard', 'nanse', 'tianming'];
function playerTurn() {
  const G = T.G; if (G.role !== 'ruler' || G.phase !== 'act') return;
  const c = T.councilRuler(); if (!c) return;
  let guard = 0;
  for (const ch of c.choices) {
    if (G.ap <= 0 || guard++ > 6 || G.phase !== 'act') break;
    if (ch.end || ch.off) continue;
    try {
      if (ch.sheet === 'war') {
        const t = T.city(ch.arg), srcs = t.adj.map(T.city).filter(x => x.owner === G.pfac);
        T.ACT.war(t.id, srcs.map(s => ({ from: s.id, pct: .6, gens: T.peopleIn(s.id, G.pfac).sort((a, b) => (b.m + b.l) - (a.m + a.l)).slice(0, 2).map(p => p.id) })), 6);
      } else if (ch.act) T.ACT[ch.act](ch.arg, ch.arg2);
      else if (ch.cn && ch.grp === 'pt' && !/외면|지킨다|내버려|돌려|어렵다|때가/.test(ch.t)) T.CN[ch.cn](ch.arg, ch.arg2);
    } catch (e) { M.err = (M.err || 0) + 1; }
  }
}
const M = {};
const rows = [];
for (const diff of DIFFS) {
  const agg = { y3: [], y5: [], y10: [], end: [], gold: [], over: 0, unify: 0, lost: 0, wars: [], maxGold: [] };
  for (let r = 0; r < runs; r++) {
    const [pid, sc] = PLAYS[r % PLAYS.length];
    T.newGame(pid, sc, 'real'); T.G.diff = diff;
    let wars = 0, mg = 0;
    for (let m = 0; m < months; m++) {
      const G = T.G, ph = G.phase;
      try {
        if (ph === 'act') { const a0 = G.armies.filter(a => a.fac === G.pfac).length; playerTurn(); if (G.armies.filter(a => a.fac === G.pfac).length > a0) wars++; if (T.G.phase === 'act') T.endMonth(); }
        else if (ph === 'report') T.afterReport();
        else if (ph === 'event') { const ch = T.evChoices(); T.chooseEvent(Math.max(0, ch.findIndex(c => !c.cost || G.gold >= c.cost))); T.afterEvent(); }
        else if (ph === 'battle') T.autoBattle();
        else if (ph === 'battleEnd') { if (G.battle && G.battle.cap && !G.battle.capDone) try { T.captiveDo('release'); } catch (e) {} if (G.battle && (G.battle.kind === 'raise' || G.battle.kind === 'hduel')) { G.battle = null; G.phase = 'act'; } else T.afterBattle(); }
        else if (ph === 'succession') { const c = T.heirCands(); if (c.length) T.succeed(c[0]); else break; }
        else if (ph === 'over') { agg.over++; if (/unify|통일/.test(JSON.stringify(G.over))) agg.unify++; else agg.lost++; break; }
        else break;
      } catch (e) { M.err = (M.err || 0) + 1; M.last = e.message; break; }
      const y = m / 12, n = T.G.pfac ? T.citiesOf(T.G.pfac).length : 0; mg = Math.max(mg, T.G.gold);
      if (m === 36) agg.y3.push(n); if (m === 60) agg.y5.push(n); if (m === 120) agg.y10.push(n);
    }
    agg.end.push(T.G.pfac ? T.citiesOf(T.G.pfac).length : 0); agg.gold.push(Math.round(T.G.gold)); agg.wars.push(wars); agg.maxGold.push(Math.round(mg));
  }
  const avg = a => a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : '-';
  rows.push(`${diff.padEnd(9)} 성 3년 ${avg(agg.y3)} · 5년 ${avg(agg.y5)} · 10년 ${avg(agg.y10)} · 끝 ${avg(agg.end)} | 끝 금 ${avg(agg.gold)} (최대 ${avg(agg.maxGold)}) | 출진 ${avg(agg.wars)}회 | 통일 ${agg.unify} · 멸망 ${agg.lost}`);
}
console.log(rows.join('\n')); if (M.err) console.log('봇 오류', M.err, M.last || '');
