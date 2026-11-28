// 행동 전수 시험: 군주·장수·재야로 시작해 모든 행동(ACT)을 그럴듯한 인자로 눌러 보고, 오류·변화 없음을 찾는다.
// usage: node tools/act_test.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..', 'src');
let html = fs.readFileSync(path.join(root, 'game_src.html'), 'utf8');
const ink = ['ink1.js', 'ink2.js', 'ink3.js'].map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
html = html.replace('/*@@INK@@*/', ink).replace("globalThis.T = { ", "globalThis.T = { ACT, get GG(){ return G; }, ");
const code = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).sort((a, b) => b.length - a.length)[0];
const store = {}, el = () => ({ style: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, appendChild() {}, setAttribute() {}, querySelector: () => null, querySelectorAll: () => [] });
const ctx = { __SIM: true, console, Math, JSON, Date, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, requestAnimationFrame: () => 0,
  localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
  document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: el, addEventListener() {}, body: el(), documentElement: el(), fonts: { ready: Promise.resolve() } },
  navigator: { language: 'ko', vibrate() {} }, location: { search: '', hash: '' }, addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }),
  performance: { now: () => Date.now() }, URLSearchParams, btoa, atob, escape, unescape, encodeURIComponent, decodeURIComponent, Promise, Object, Array, Number, String, Set, Map, Symbol, Error, isNaN, parseInt, parseFloat };
ctx.window = ctx.globalThis = ctx.self = ctx; vm.createContext(ctx); vm.runInContext(code, ctx, { filename: 'game.js' });
const T = ctx.T, res = { ok: [], same: [], err: [] };
const snap = () => JSON.stringify(T.GG);
function tryAct(role, name, args){
  const G = T.GG; G.phase = 'act'; G.ap = 9; G.gold = Math.max(G.gold, 20000);
  const b = snap(); try { T.doAct(name, ...args); } catch (e) { res.err.push(`${role}.${name}(${args.join(',')}): ${e.message}`); return; }
  (snap() === b ? res.same : res.ok).push(`${role}.${name}`);
}
function setup(role){
  if (role === 'ruler') T.newGame('cao', 200, 'real'); else if (role === 'officer') T.newGame('zhaoyun', 200, 'real'); else { const cs = T.regCities(196, 'ronin'); T.newRegressor({ name: '이현', role: 'ronin', focus: 'ji', fac: null, city: cs[0], sc: 196, mode: 'virtual' }); }
  const G = T.GG; G.talks = []; return G;
}
const plan = {
  ruler: G => { const my = T.citiesOf(G.pfac), c = T.GG.cities[G.city], en = Object.values(G.cities).find(x => x.owner && x.owner !== G.pfac && c.adj.includes(x.id)) || Object.values(G.cities).find(x => x.owner && x.owner !== G.pfac);
    const nb = my.find(x => x.id !== c.id && c.adj.includes(x.id)) || my[1], gens = T.npcs().filter(p => p.fac === G.pfac && p.alive && p.active && p.id !== G.pid), g = gens[0], g2 = gens[5], ef = en.owner;
    return [['train', []], ['draft', [c.id]], ['study', ['i']], ['rest', []], ['repair', [(c.wall = 5, c.id)]], ['build', [c.id, 'tun']], ['develop', [c.id]], ['move', [nb.id]], ['transport', [c.id, nb.id, .3]],
      ['assign', [g2.id, nb.id]], ['autoAssign', []], ['scout', [en.id]], ['plot', ['rumor', en.id, g.id]], ['trap', [c.id]], ['requestSupport', [en.id]],
      ['social', [g.id, 'drink']], ['reward', [g.id]], ['promote', [g.id]], ['courtSet', ['sang', 0, g.id]], ['courtOff', ['sang', 0]], ['civic', ['relief']], ['jail', [g2.id]], ['release', [g2.id]],
      ['sendAid', [c.id, nb.id, .3]], ['diplo', [ef]], ['askAid', [ef]], ['war', [en.id, [{ from: (my.find(x => x.adj.includes(en.id)) || c).id, pct: .5, gens: [g.id] }], 4]]]; },
  officer: G => { const c = G.cities[G.city], en = Object.values(G.cities).find(x => x.owner && x.owner !== G.pfac && c.adj.includes(x.id)) || Object.values(G.cities).find(x => x.owner && x.owner !== G.pfac);
    return [['train', []], ['draft', []], ['study', ['m']], ['rest', []], ['audience', ['report']], ['audience', ['troops']], ['scout', [en.id]], ['requestSupport', [en.id]]]; },
  ronin: G => [['work', []], ['draft', []], ['study', ['c']], ['rest', []], ['seek', []]]
};
for (const role of ['ruler', 'officer', 'ronin']){ const G = setup(role); for (const [n, a] of plan[role](G)){ if (!T.ACT[n]) { res.err.push(`${role}.${n}: 없음`); continue; } setup(role); tryAct(role, n, a.map(x => x)); } }
// 인자는 setup 뒤 새 게임 기준으로 다시 계산해야 하므로 한 번 더(같은 시드 아님 → 변화 없음만 참고)
console.log(`작동 ${res.ok.length} · 변화 없음 ${res.same.length} · 오류 ${res.err.length}`);
if (res.same.length) console.log('변화 없음:', res.same.join(', '));
res.err.forEach(e => console.log('오류:', e));
