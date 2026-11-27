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
  // 데이터 정합성: 성을 잃거나 얻은 뒤 남는 낡은 값 (플레이어가 지도를 보는 'act' 단계 기준)
  if (G.phase !== 'act') return;
  const own = id => G.cities[id] && G.cities[id].owner;
  for (const c of Object.values(G.cities)) if (c.gov) { const g = G.people[c.gov]; if (!g || !g.alive || g.fac !== c.owner) bad('정합: 태수가 다른 세력', new Error(c.id)); }
  if (G.gov && own(G.gov) !== G.pfac) bad('정합: 내 태수 성을 잃음', new Error(G.gov));
  if (G.pfac && G.fronts) { const ids = new Set(T.frontsOf(G.pfac).map(f => f.id)); for (const [fid, S] of Object.entries(G.fronts)) for (const [k, g] of Object.entries(S.r || {})) if (g) { const pp = G.people[g]; if (!pp || !pp.alive || pp.fac !== G.pfac) bad('정합: 전선 자리에 남의 장수/죽은 장수', new Error(fid + ' ' + k)); else if (!ids.has(fid)) bad('정합: 사라진 전선에 장수 배치', new Error(fid + ' ' + k)); } }
  for (const a of G.armies) { if (a.state !== 'return' && !G.cities[a.to]) bad('정합: 군단 목적지 없음', new Error(a.id)); if (a.state === 'return' && own(a.home) !== a.fac && citiesOf_(a.fac).length) bad('정합: 귀환지가 남의 성', new Error(a.id)); }
  for (const f of Object.values(G.facs)) if (f.alive && f.id !== G.pfac && citiesOf_(f.id).length) { const r = G.people[f.ruler]; if (!r || !r.alive || (r.fac !== f.id && !f.guest)) bad('정합: 군주가 남의 세력/죽음인데 그대로', new Error(f.id)); }
  if (G.campaign && own(G.campaign.target) === G.pfac) bad('정합: 이미 얻은 성에 공략 허가 남음', new Error(G.campaign.target));
  if (G.pfac && G.city && own(G.city) && own(G.city) !== G.pfac && !G.inArmy && !G.jail && G.role !== 'ronin' && citiesOf_(G.pfac).length) bad('정합: 내가 적 성에 있음', new Error(G.role + ' 성' + citiesOf_(G.pfac).length + ' ' + G.pfac));
}
for (let r = 0; r < Math.min(runs, plans.length * 2); r++) {
  const [pid, sc] = plans[r % plans.length];
  stats.runs++;
  try { if (typeof pid === 'object') T.newRegressor(pid); else T.newGame(pid, sc, 'real'); T.G.diff = ['easy','normal','hard','nanse','tianming'][r % 5]; if (r % 2 === 0) for (let k = 0; k < 3; k++) { const c = T.cuBlank(); c.id = 'cu' + k; c.n = '만든' + k; c.female = k === 1; T.cuSummon(c); } } catch (e) { bad(`newGame ${pid} ${sc}`, e); continue; }
  for (let m = 0; m < maxMonths; m++) {
    const G = T.G; const ph = G.phase;
    try {
      if (ph === 'act') { T.endMonth(); stats.months++; }
      else if (ph === 'report') T.afterReport();
      else if (ph === 'event') { stats.events++; const ch = T.evChoices(); let i = ch.findIndex(c => !c.cost || G.gold >= c.cost); T.chooseEvent(Math.max(0, i)); T.afterEvent(); }
      else if (ph === 'battle') { stats.battles++; if (G.battle.stage === 'unit' && Math.random() < .6) { stats.tb = (stats.tb || 0) + 1; T.tbStart(); T.tbAuto(); if (T.G.phase === 'battle') throw new Error('전장 지휘가 끝나지 않음 turn=' + (T.G.battle.tb && T.G.battle.tb.turn)); } else T.autoBattle(); }
      else if (ph === 'battleEnd') { if (G.battle && G.battle.cap && !G.battle.capDone) try { T.captiveDo('release'); } catch (e) { bad('captive', e); } if (G.battle && (G.battle.kind === 'raise' || G.battle.kind === 'hduel')) { G.battle = null; G.phase = G.dead ? 'succession' : 'act'; if (G.pfac) T.dataClean(); } else T.afterBattle(); }
      else if (ph === 'succession') { stats.deaths++; const c = T.heirCands(); if (c.length) T.succeed(c[0]); else { T.G.over = { kind: 'end' }; T.G.phase = 'over'; } }
      else if (ph === 'over') { stats.overs++; if (process.env.V) console.log('  종료', typeof pid==='object'?'회귀자 '+pid.role:pid, sc, '→', G.year+'.'+G.month, JSON.stringify(G.over).slice(0,80)); break; }
      else { bad('알 수 없는 단계', new Error(ph)); break; }
      check();
    } catch (e) { bad(`${ph} ${pid} ${sc} ${G.year}.${G.month}`.replace(/ \d+\.\d+$/, ''), e); break; }
  }
}
console.log(`전장 지휘 ${stats.tb||0}회 · 판 ${stats.runs} · 진행한 달 ${stats.months} · 전투 ${stats.battles} · 사건 ${stats.events} · 사망/계승 ${stats.deaths} · 종료 ${stats.overs}`);
const ek = Object.entries(errors).sort((a, b) => b[1] - a[1]);
console.log(ek.length ? '오류 종류 ' + ek.length + '\n' + ek.map(([k, n]) => `  ${n}회  ${k}`).join('\n') : '오류 없음');
process.exit(ek.length ? 1 : 0);
