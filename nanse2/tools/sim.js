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

function makeCtx() {
  const store = {};
  const el = () => ({ style: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, appendChild() {}, setAttribute() {}, querySelector: () => null, querySelectorAll: () => [] });
  const ctx = {
    __SIM: true, console, Math, JSON, Date, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, requestAnimationFrame: () => 0,
    localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: el, addEventListener() {}, body: el(), documentElement: el(), fonts: { ready: Promise.resolve() } },
    navigator: { language: 'ko', vibrate() {} }, location: { search: '', hash: '' }, addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }),
    performance: { now: () => Date.now() }, URLSearchParams, Promise, Object, Array, Number, String, Set, Map, Symbol, Error, isNaN, parseInt, parseFloat
  };
  ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { filename: 'game.js' });
  return ctx;
}

const ctx = makeCtx(), T = ctx.T;
const plans = [];
for (const sc of Object.keys(T.SCEN).map(Number)) {
  const S = T.SCEN[sc];
  for (const id of Object.values(S.rulers).slice(0, 3)) plans.push([id, sc]);
  for (const id of ['liubei', 'guanyu', 'cao', 'zhaoyun']) if (!Object.values(S.rulers).includes(id)) plans.push([id, sc]);
  for (const role of ['ronin', 'officer', 'ruler']) { const fac = (T.regFacs(sc)[0] || [])[0], cs = T.regCities(sc, role); if (role === 'ruler' && !cs.length) continue; plans.push([{ name: '이현', role, focus: 'ji', fac, city: cs[0], sc, mode: 'virtual' }, sc]); }
}
const errors = {}, stats = { runs: 0, months: 0, battles: 0, events: 0, deaths: 0, overs: 0 };
function bad(where, e) { const k = (e && e.message || String(e)) + ' @ ' + where; errors[k] = (errors[k] || 0) + 1; }
function check() {
  const G = T.G;
  for (const c of Object.values(G.cities)) { if (!Number.isFinite(c.troops) || c.troops < 0) bad('도시 병력', new Error(`${c.id} troops=${c.troops}`)); }
  for (const p of Object.values(G.people)) if (p.active && p.alive && !G.cities[p.city]) bad('인물 위치', new Error(`${p.id} city=${p.city}`));
  if (!Number.isFinite(G.gold)) bad('금', new Error('gold=' + G.gold));
}
for (let r = 0; r < Math.min(runs, plans.length * 2); r++) {
  const [pid, sc] = plans[r % plans.length];
  stats.runs++;
  try { if (typeof pid === 'object') T.newRegressor(pid); else T.newGame(pid, sc, 'real'); T.G.diff = ['easy','normal','hard','nanse','tianming'][r % 5]; } catch (e) { bad(`newGame ${pid} ${sc}`, e); continue; }
  for (let m = 0; m < maxMonths; m++) {
    const G = T.G; const ph = G.phase;
    try {
      if (ph === 'act') { T.endMonth(); stats.months++; }
      else if (ph === 'report') T.afterReport();
      else if (ph === 'event') { stats.events++; const ch = T.evChoices(); let i = ch.findIndex(c => !c.cost || G.gold >= c.cost); T.chooseEvent(Math.max(0, i)); T.afterEvent(); }
      else if (ph === 'battle') { stats.battles++; T.autoBattle(); }
      else if (ph === 'battleEnd') { if (G.battle && G.battle.cap && !G.battle.capDone) try { T.captiveDo('release'); } catch (e) { bad('captive', e); } if (G.battle && G.battle.kind === 'raise') { G.battle = null; G.phase = G.dead ? 'succession' : 'act'; } else T.afterBattle(); }
      else if (ph === 'succession') { stats.deaths++; const c = T.heirCands(); if (c.length) T.succeed(c[0]); else { T.G.over = { kind: 'end' }; T.G.phase = 'over'; } }
      else if (ph === 'over') { stats.overs++; if (process.env.V) console.log('  종료', typeof pid==='object'?'회귀자 '+pid.role:pid, sc, '→', G.year+'.'+G.month, JSON.stringify(G.over).slice(0,80)); break; }
      else { bad('알 수 없는 단계', new Error(ph)); break; }
      check();
    } catch (e) { bad(`${ph} ${pid} ${sc} ${G.year}.${G.month}`.replace(/ \d+\.\d+$/, ''), e); break; }
  }
}
console.log(`판 ${stats.runs} · 진행한 달 ${stats.months} · 전투 ${stats.battles} · 사건 ${stats.events} · 사망/계승 ${stats.deaths} · 종료 ${stats.overs}`);
const ek = Object.entries(errors).sort((a, b) => b[1] - a[1]);
console.log(ek.length ? '오류 종류 ' + ek.length + '\n' + ek.map(([k, n]) => `  ${n}회  ${k}`).join('\n') : '오류 없음');
process.exit(ek.length ? 1 : 0);
