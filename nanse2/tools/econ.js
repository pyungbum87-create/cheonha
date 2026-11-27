// 화면 없이 게임을 자동으로 돌려 튕김(오류)과 이상값을 찾는다.
// usage: node tools/sim.js [판 수=12] [최대 개월=240]
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..', 'src');
const runs = +(process.argv[2] || 12), maxMonths = +(process.argv[3] || 240);
let html = fs.readFileSync(path.join(root, 'game_src.html'), 'utf8');
const ink = ['ink1.js', 'ink2.js', 'ink3.js'].map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
html = html.replace('/*@@INK@@*/', ink);
const scripts = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const code = scripts.sort((a, b) => b.length - a.length)[0];

const citiesOf_ = f => Object.values(T.G.cities).filter(c => c.owner === f);
function makeCtx() {
  const store = {};
  const el = () => ({ style: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, appendChild() {}, setAttribute() {}, querySelector: () => null, querySelectorAll: () => [] });
  const ctx = {
    __SIM: true, console, Math, JSON, Date, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, requestAnimationFrame: () => 0,
    localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: el, addEventListener() {}, body: el(), documentElement: el(), fonts: { ready: Promise.resolve() } },
    navigator: { language: 'ko', vibrate() {} }, location: { search: '', hash: '' }, addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }),
    performance: { now: () => Date.now() }, URLSearchParams, btoa, atob, escape, unescape, encodeURIComponent, decodeURIComponent, Promise, Object, Array, Number, String, Set, Map, Symbol, Error, isNaN, parseInt, parseFloat
  };
  ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { filename: 'game.js' });
  return ctx;
}

const ctx = makeCtx(), T = ctx.T;
// 경제·성장 점검: 같은 시작에서 '아무것도 안 함' / '내정 투자' / '내정+조정(대군사 맡김)'을 비교한다
// usage: node tools/econ.js [판 수=6] [개월=120]
const N = +(process.argv[2] || 6), M = +(process.argv[3] || 120);
const rulers = [['cao', 200], ['liubei', 196], ['sunce', 196], ['yuanshao', 200], ['lvbu', 196], ['liubiao', 200]];
function act(G, mode){
  if (mode === 'none') return;
  const cs = T.citiesOf(G.pfac);
  for (let k = 0; k < 6 && G.ap > 0; k++){
    const low = cs.filter(c => c.dev < 10).sort((a, b) => a.dev - b.dev)[0];
    const wall = cs.filter(c => c.wall < T.maxWall(c)*.5).sort((a, b) => a.wall - b.wall)[0];
    const pool = cs.filter(c => (c.pool||0) >= 1000).sort((a, b) => b.pool - a.pool)[0];
    if (wall && G.gold >= T.wallCost(wall) + 150) T.doAct('repair', wall.id);
    else if (low && G.gold >= T.devCost(low) + 200) T.doAct('develop', low.id);
    else if (pool && G.gold >= 400) T.doAct('draft', pool.id);
    else break;
  }
}
function setCourt(G){
  const ids = T.npcs().filter(p => p.fac === G.pfac && p.alive && p.active && p.id !== G.pid);
  const by = f => ids.slice().sort((a, b) => f(b) - f(a)).filter(p => !(G.court && (G.court.gun === p.id || G.court.gunS.includes(p.id) || G.court.sang === p.id || G.court.sangS.includes(p.id) || G.court.elite.includes(p.id))));
  const i = by(p => p.i); if (i[0]) T.courtSet('gun', 0, i[0].id);
  const g = by(p => p.g || p.i); if (g[0]) T.courtSet('sang', 0, g[0].id); if (g[1]) T.courtSet('sangS', 0, g[1].id); if (g[2]) T.courtSet('sangS', 1, g[2].id);
  const m = by(p => p.m); for (let k = 0; k < 3 && m[k]; k++) T.courtSet('elite', k, m[k].id);
  G.frAuto = true;
}
const res = {};
for (const diff of ['normal', 'nanse']) for (const mode of ['none', 'build', 'court']) {
  const R = res[diff + '/' + mode] = { life: 0, n: 0, alive: 0, cities: 0, gold: 0, troops: 0, inc: 0 };
  for (let r = 0; r < N; r++) {
    const [pid, sc] = rulers[r % rulers.length];
    try { if (process.env.ONE) { const cs = T.regCities(196, 'ruler'); T.newRegressor({ name: '이현', role: 'ruler', focus: 'ji', fac: null, city: cs[r % cs.length], sc: 196, mode: 'virtual' }); } else T.newGame(pid, sc, 'real'); } catch (e) { console.log('start', e.message); continue; }
    const G = T.G; G.diff = diff; if (G.role !== 'ruler') continue;
    if (mode === 'court') setCourt(G);
    let m = 0;
    for (let s = 0; s < M*4 && m < M; s++) {
      const G = T.G, ph = G.phase;
      try {
        if (ph === 'act' && (G.role !== 'ruler' || !T.citiesOf(G.pfac).length)) break;
        if (ph === 'act') { if (mode === 'court' && m % 12 === 0) setCourt(G); act(G, mode); T.endMonth(); m++; }
        else if (ph === 'report') T.afterReport();
        else if (ph === 'event') { const ch = T.evChoices(); let i = ch.findIndex(c => !c.cost || G.gold >= c.cost); T.chooseEvent(Math.max(0, i)); T.afterEvent(); }
        else if (ph === 'battle') { T.autoBattle(); }
        else if (ph === 'battleEnd') { if (G.battle && G.battle.cap && !G.battle.capDone) T.captiveDo('release'); if (G.battle && (G.battle.kind === 'raise' || G.battle.kind === 'hduel')) { G.battle = null; G.phase = 'act'; } else T.afterBattle(); }
        else break;
      } catch (e) { break; }
    }
    const G2 = T.G; R.n++; R.life += m;
    const own = G2.pfac ? T.citiesOf(G2.pfac) : [];
    if (G2.role === 'ruler' && own.length) R.alive++;
    R.cities += own.length; R.gold += G2.gold; R.troops += own.reduce((a, c) => a + c.troops, 0); R.inc += G2.lastIncome || 0;
  }
}
console.log('난이도/방식      판  생존  평균성  평균금   평균병력  월수입  버틴달');
for (const [k, R] of Object.entries(res)) { const d = x => R.n ? Math.round(x / R.n) : 0; console.log(k.padEnd(14), String(R.n).padStart(3), String(R.alive).padStart(5), String(d(R.cities)).padStart(7), String(d(R.gold)).padStart(7), String(d(R.troops)).padStart(10), String(d(R.inc)).padStart(7), String(d(R.life)).padStart(6)); }
