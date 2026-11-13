// 둠스데이 익스프레스 헤드리스 밸런스 시뮬레이터
// 사용: node sim.js <gameDir> <stageIdx> <runs> [metaHp metaDmg metaXp metaMag] [policy]
const fs = require('fs'), vm = require('vm'), path = require('path');
const dir = process.argv[2], stageIdx = +process.argv[3] || 0, runs = +process.argv[4] || 10;
const meta = { hp: +process.argv[5] || 0, dmg: +process.argv[6] || 0, xp: +process.argv[7] || 0, magnet: +process.argv[8] || 0 };
const skill = process.argv[9] || 'avg';   // avg = 경적·필살기 사용, 침입 절반 격퇴 / lazy = 아무것도 안 함
const deep = () => new Proxy(function () {}, { get: (t, k) => k === Symbol.toPrimitive ? () => 0 : k === 'length' ? 0 : deep(), apply: () => deep(), construct: () => deep(), set: () => true });
const store = {};
const ctx = {
  console, Math, Date, JSON, Promise, setTimeout, clearTimeout, Float32Array, Uint8Array, Uint16Array, Int32Array, Array, Object, Map, Set, Intl,
  performance: { now: () => 0 },
  navigator: { languages: ['ko-KR'], language: 'ko-KR', userAgent: 'node' },
  location: { search: '', protocol: 'http:', href: 'http://x/' },
  localStorage: { getItem: k => store[k] || null, setItem: (k, v) => store[k] = v, clear: () => {} },
  document: deep(), Image: function () {}, requestAnimationFrame: () => 0, addEventListener: () => {},
};
ctx.window = ctx; ctx.self = ctx;
vm.createContext(ctx);
const load = f => vm.runInContext(fs.readFileSync(path.join(dir, 'js', f), 'utf8'), ctx, { filename: f });
load('config.js'); load('i18n.js');
try { load('platform.js'); } catch (e) { console.error('platform', e.message); }
load('engine.js');
try { load('models.js'); } catch (e) { console.error('models', e.message); }
const DX = ctx.DX;
const HPX = +(process.env.HPX || 1), RX = +(process.env.RX || 1);
for (const st of DX.CONFIG.stages) for (const w of st.waves) { w.hp *= HPX; if (w.bossHp) w.bossHp *= HPX; w.rate *= RX; w.hordeSize = Math.round(w.hordeSize * RX); }
DX.SPR = { frames: {}, has: () => false, hasFight: () => true, chars: {}, fight: { bg: 1, jack: 1, office: 1, box: 1 }, load: () => Promise.resolve() };
DX.FIGHT = { start: (o, done) => done({ win: true }) };
let G = null, cardLog = [];
const pref = { mg: 10, drone: 9, tesla: 9, cannon: 8, flame: 7, barrel: 6, power: 6, armor: 5, haste: 5, crit: 3, magnet: 2, greed: 1 };
const UIo = {
  banner() {}, bossBar() {}, hideLevelUp() {}, result() {}, frame() {},
  onRunStart(g) { G = g; },
  bossSupply() { DX.bossSupplyDone(process.env.SUPPLY === '1'); },
  levelUp(cards) {
    let best = cards[0], bs = -1;
    for (const c of cards) { const s = (pref[c.id] || 1) + (c.evo ? 6 : 0) + Math.random() * 6; if (s > bs) { bs = s; best = c; } }
    DX.chooseCard(best);
  },
};
DX.UI = new Proxy(UIo, { get: (t, k) => t[k] || (() => {}) });
load('game.js');
DX.save.meta = meta; DX.save.mild = false;

const out = [];
for (let r = 0; r < runs; r++) {
  DX.startRun(stageIdx);
  const g = G; const dt = 1 / 30; let t = 0, minHp = 1, bossT = [], bossStart = -1, wasBoss = false, waveT = [];
  let lastWave = -1;
  while (t < 900) {
    if (DX.state === 'play') DX._update(dt);
    t += dt;
    if (g.waveIdx !== lastWave) { waveT.push(Math.round(g.t)); lastWave = g.waveIdx; }
    if (g.boss && !wasBoss) { bossStart = g.t; wasBoss = true; }
    if (!g.boss && wasBoss) { bossT.push(Math.round(g.t - bossStart)); wasBoss = false; }
    if (g.endT >= 0 || g.outcome) break;
    minHp = Math.min(minHp, g.hp / g.hpMax);
    if (skill === 'avg') {
      if (g.ult >= 1) DX.useUltimate();
      if (g.hornCd <= 0 && g.zs.filter(z => !z.dead && Math.abs(z.x) < 5 && z.z > -3 && z.z < g.layout.end + 3).length > 12) DX.useHorn();
      for (const k in g.inv) if (g.inv[k].t > 1.5 && Math.random() < 0.02) DX.startFight(+k);
    }
  }
  const o = g.outcome || { win: false, wave: g.waveIdx + 1, timeout: true };
  out.push({ win: o.win, wave: o.wave, t: Math.round(g.t), lv: g.level, gold: Math.round(o.gold || 0), minHp: +minHp.toFixed(2), boss: bossT.join('/'), waves: waveT.join(','), w: Object.entries(g.weapons).map(e => e.join('')).join(' ') });
}
const wins = out.filter(o => o.win).length;
const avg = k => Math.round(out.reduce((a, o) => a + o[k], 0) / out.length);
console.log(`S${stageIdx + 1} meta=${JSON.stringify(meta)} ${skill}: 클리어 ${wins}/${runs}  평균시간 ${avg('t')}s  평균Lv ${avg('lv')}  평균골드 ${avg('gold')}  평균도달웨이브 ${(out.reduce((a, o) => a + o.wave, 0) / runs).toFixed(1)}`);
if (process.env.V) for (const o of out) console.log(' ', JSON.stringify(o));
