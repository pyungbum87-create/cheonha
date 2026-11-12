/* ==========================================================================
   game.js — 게임 로직 (좀비 떼, 무기, 사망 연출, 레벨업, 보스, 고스트 열차)
   - 밸런스 숫자는 config.js에서 바꾸는 걸 추천
   ========================================================================== */
window.DX = window.DX || {};
(function (DX) {
  'use strict';
  const C = DX.CONFIG, E = DX.E, T = E.T, MD = DX.MD;
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  DX.util = { rand, clamp, lerp, pick };

  /* ================= 저장 데이터 ================= */
  const SAVE_KEY = 'doomsday_express_save_v3';
  const defSave = () => ({ gold: C.game.startGold, meta: { hp: 0, dmg: 0, xp: 0, magnet: 0 }, cleared: {}, best: {}, seenIntro: false, seenStory: {}, quality: 'high', qualityManual: false, sound: true, music: true, vibrate: true, shake: true, stage: 0, cam: 'far', supply: { day: '', n: 0 },
    lang: null, mild: undefined, daily: null, att: { last: '', streak: 0 }, tips: {}, hints: {}, statc: {}, firstRunDone: false });
  DX.save = defSave();
  try { const s = JSON.parse(DX.store.get(SAVE_KEY) || 'null'); if (s) DX.save = Object.assign(defSave(), s, { meta: Object.assign(defSave().meta, s.meta || {}), att: Object.assign(defSave().att, s.att || {}) }); } catch (e) {}
  if (!DX.LANG_FORCED && (DX.save.lang === 'ko' || DX.save.lang === 'zh')) DX.setLang(DX.save.lang);
  if (DX.save.mild === undefined) DX.save.mild = DX.lang() === 'zh' || !!DX.API;  // 순화 연출: 중국어·위챗·더우인 기본 켜짐
  DX.metaCost = function (k, lv) { const m = C.meta[k]; return Math.round(m.costBase * Math.pow(m.costGrow, lv) / 5) * 5; };
  DX.persist = function () { DX.store.set(SAVE_KEY, JSON.stringify(DX.save)); };

  /* ================= 사운드 (합성음, 파일 불필요) ================= */
  const S = DX.S = {};
  let actx = null, nbuf = null; const last = {};
  S.init = function () {
    if (actx) { try { if (actx.state === 'suspended') actx.resume(); } catch (e) {} return; }
    try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; }
    if (actx && DX.Music) DX.Music.attach(actx);
  };
  function ok(key, gap) { if (!actx || !DX.save.sound) return false; const n = performance.now(); if (last[key] && n - last[key] < gap) return false; last[key] = n; return true; }
  function tone(f, d, type, v, slide, delay) {
    try {
      const t = actx.currentTime + (delay || 0), o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
      g.gain.setValueAtTime(v || 0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + d + 0.03);
    } catch (e) {}
  }
  function noise(d, v, f, delay) {
    try {
      if (!nbuf) { nbuf = actx.createBuffer(1, actx.sampleRate, actx.sampleRate); const a = nbuf.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1; }
      const t = actx.currentTime + (delay || 0), s = actx.createBufferSource(); s.buffer = nbuf;
      const fl = actx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(f || 900, t); fl.frequency.exponentialRampToValueAtTime(50, t + d);
      const g = actx.createGain(); g.gain.setValueAtTime(v || 0.15, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      s.connect(fl); fl.connect(g); g.connect(actx.destination); s.start(t, Math.random() * 0.5); s.stop(t + d);
    } catch (e) {}
  }
  S.shot = () => { if (ok('shot', 45)) noise(0.06, 0.06, 2500); };
  S.boom = (big) => { if (ok('boom', 70)) { noise(big ? 1.0 : 0.5, big ? 0.32 : 0.2, big ? 1600 : 1100); tone(90, 0.4, 'sine', 0.15, -50); } };
  S.zap = () => { if (ok('zap', 90)) { tone(900, 0.22, 'sawtooth', 0.04, -700); noise(0.2, 0.08, 5000); } };
  S.flame = () => { if (ok('flame', 160)) noise(0.25, 0.05, 700); };
  S.kill = () => { if (ok('kill', 55)) tone(rand(170, 260), 0.07, 'square', 0.025, -110); };
  S.pick = () => { if (ok('pick', 50)) tone(rand(880, 1100), 0.05, 'sine', 0.025, 200); };
  S.level = () => { if (ok('level', 300)) { tone(523, 0.12, 'triangle', 0.07); tone(659, 0.12, 'triangle', 0.07, 0, 0.1); tone(1046, 0.3, 'triangle', 0.07, 0, 0.2); } };
  S.alarm = () => { if (ok('alarm', 800)) { tone(440, 0.25, 'square', 0.05, 0); tone(330, 0.25, 'square', 0.05, 0, 0.28); tone(440, 0.25, 'square', 0.05, 0, 0.56); } };
  S.roar = () => { if (ok('roar', 1000)) { tone(110, 1.0, 'sawtooth', 0.08, -60); noise(1.0, 0.2, 400); } };
  S.horn = () => { if (ok('horn', 500)) { tone(196, 0.9, 'sawtooth', 0.09, -20); tone(247, 0.9, 'sawtooth', 0.07, -25); noise(0.4, 0.15, 500); } };
  S.click = () => { if (ok('click', 60)) tone(700, 0.06, 'triangle', 0.06); };
  S.leek = () => { if (ok('leek', 100)) tone(1400, 0.6, 'sine', 0.05, -1250); };
  S.win = () => { if (ok('win', 1000)) [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, 'triangle', 0.08, 0, i * 0.13)); };
  S.lose = () => { if (ok('lose', 1000)) { tone(330, 0.35, 'triangle', 0.08, -100); tone(220, 0.7, 'triangle', 0.08, -90, 0.3); } };
  function vib(ms) { const m = Array.isArray(ms) ? 100 : ms; DX.vib(m >= 100 ? 'heavy' : m >= 45 ? 'medium' : 'light'); }

  /* ================= 상태 ================= */
  DX.state = 'lobby';
  let G = null;
  DX.getG = () => G;
  const world = { scroll: 0, t: 0, props: [], pebbles: [], theme: null, stageIdx: 0 };
  const GHOST_X = -7.5;
  let DECK = 1.35; // 열차 위 서는 높이 (그림 열차면 높아짐)

  function lowQ() { return DX.save.quality === 'low'; }
  function maxZ() { return lowQ() ? C.game.maxZombiesLow : C.game.maxZombies; }

  /* ================= 테마 / 배경 ================= */
  function applyTheme(idx) {
    world.stageIdx = idx;
    const th = C.stages[idx].theme;
    world.theme = th;
    E.env.fog = E.col(th.fog).slice(); E.env.fogNear = th.fogNear; E.env.fogFar = th.fogFar;
    E.env.light = th.light; E.env.sky = E.col(th.sky); E.env.ground = E.col(th.ground); E.env.ambient = th.ambient; E.env.spriteTint = th.spriteTint || [1, 1, 1];
    if (DX.UI) DX.UI.setSky(th.skyTop, th.skyBottom);
    buildProps(th);
  }
  function buildProps(th) {
    world.props = []; world.pebbles = [];
    const P = world.props;
    const seed = () => Math.floor(rand(0, 1000));
    if (th.props === 'desert') {
      for (let z = -190; z < 50; z += rand(5, 9)) {
        for (const side of [-1, 1]) {
          const x = side * rand(15, 24), s = rand(2.5, 5.5);
          P.push({ k: 'rock', x, y: s * 0.25, z: z + rand(-2, 2), sx: s * rand(0.8, 1.4), sy: s * rand(0.7, 1.3), sz: s * rand(0.8, 1.4), r: rand(0, 6), r2: rand(-1, 1), col: pick(th.rock) });
        }
      }
      for (let z = -190; z < 50; z += rand(16, 28)) for (const side of [-1, 1]) P.push({ k: 'mesa', x: side * rand(32, 48), z, sx: rand(8, 14), sy: rand(10, 22), sz: rand(8, 14), r: rand(0, 1), col: pick(th.rock), col2: '#e0a670' });
      for (let z = -190; z < 50; z += rand(6, 14)) {
        const side = Math.random() < 0.5 ? -1 : 1, x = side < 0 ? rand(-13, -10.5) : rand(4.5, 13);
        const r = Math.random();
        if (r < 0.4) P.push({ k: 'cactus', x, z, sy: rand(1.6, 3.2) });
        else if (r < 0.75) P.push({ k: 'rock', x, y: 0.2, z, sx: rand(0.6, 1.4), sy: rand(0.4, 0.9), sz: rand(0.6, 1.4), r: rand(0, 6), r2: 0, col: pick(th.rock) });
        else if (r < 0.9) P.push({ k: 'crate', x, z, s: rand(0.8, 1.3), r: rand(0, 1) });
        else P.push({ k: 'tumble', x, z, seed: seed() });
      }
      for (let z = -190; z < 50; z += 14) P.push({ k: 'pole', x: 3.4, z });
      P.push({ k: 'tower', x: 9, z: -120 }); P.push({ k: 'station', x: -13, z: -40 }); P.push({ k: 'tower', x: -16, z: 20 });
    } else if (th.props === 'city') {
      for (let z = -190; z < 50; z += 0) {
        const d = rand(8, 13);
        for (const side of [-1, 1]) {
          const w = rand(7, 11);
          P.push({ k: 'building', x: side * (13.5 + w / 2 + rand(0, 2)), z: z + d / 2, sx: w, sy: rand(9, 26), sz: d, col: pick(th.building), neon: pick(th.neon), sign: Math.random() < 0.45, seed: seed() });
        }
        z += d + rand(0.5, 2);
      }
      for (let z = -190; z < 50; z += 12) { P.push({ k: 'lamp', x: 11.5, z }); P.push({ k: 'lamp', x: -11.5, z: z + 6 }); }
      for (let z = -190; z < 50; z += 30) P.push({ k: 'traffic', x: Math.random() < 0.5 ? 10.5 : -10.5, z: z + rand(0, 10), seed: seed() });
      for (let z = -190; z < 50; z += rand(28, 40)) P.push({ k: 'billboard', x: Math.random() < 0.5 ? 12.5 : -12.8, z, neon: pick(th.neon) });
      for (let z = -190; z < 50; z += rand(10, 22)) {
        const side = Math.random() < 0.5 ? -1 : 1, x = side < 0 ? rand(-12, -10.5) : rand(4.5, 11);
        if (Math.random() < 0.25) P.push({ k: 'bus', x, z, r: rand(-0.4, 0.4), r2: rand(-1, 1), col: pick(['#e0a020', '#3a6ab0', '#3a9a5a']) });
        else P.push({ k: 'wreck', x, z, r: rand(0, 6), r2: rand(-1, 1), col: pick(['#7a3b3b', '#3b5a7a', '#8a8a7a', '#5a6e4a', '#9a7a3a']) });
      }
    } else if (th.props === 'bridge') {
      for (let z = -190; z < 50; z += 6.2) { P.push({ k: 'truss', x: th.deck[0] - 0.4, z }); P.push({ k: 'truss', x: th.deck[1] + 0.4, z }); }
      for (let z = -190; z < 50; z += rand(9, 15)) for (const side of [-1, 1]) {
        const s = rand(10, 22);
        P.push({ k: 'cliff', x: side * rand(32, 55), y: rand(-30, -10), z, sx: s * rand(0.8, 1.3), sy: s * rand(2, 3), sz: s, r: rand(0, 6), col: pick(th.cliff) });
      }
    } else if (th.props === 'tunnel') {
      let i = 0;
      for (let z = -190; z < 50; z += 8.2) { i++; P.push({ k: 'wallseg', x: th.walls[0] - 1, z, seed: seed(), door: i % 5 === 0 }); P.push({ k: 'wallseg', x: th.walls[1] + 1, z, seed: seed(), door: i % 7 === 3 }); }
      for (let z = -190; z < 50; z += rand(12, 20)) P.push({ k: 'crate', x: Math.random() < 0.5 ? rand(-11, -10) : rand(3, 4), z, s: rand(0.8, 1.4), r: rand(0, 1) });
    }
    if (th.props !== 'bridge') for (let i = 0; i < (lowQ() ? 40 : 90); i++) world.pebbles.push({ x: rand(-30, 30), z: rand(-190, 50), s: rand(0.15, 0.5), r: rand(0, 6) });
  }
  function updWorld(dt, speed) {
    const v = speed * dt;
    world.scroll += v; world.t += dt;
    for (const p of world.props) { p.z += v; if (p.z > 55) p.z -= 245; }
    for (const p of world.pebbles) { p.z += v; if (p.z > 50) { p.z -= 240; p.x = rand(-30, 30); } }
  }
  function drawWorld() {
    const th = world.theme;
    if (th.props === 'bridge') {
      E.box('plane', 0, -45, -70, 400, 1, 400, 0, '#6a5a4a');
      E.box('plane', 0, -44.5, -70, 26, 1, 400, 0, th.river, 0.3);
      const d0 = th.deck[0], d1 = th.deck[1];
      E.box('cube', (d0 + d1) / 2, -0.25, -70, d1 - d0, 0.5, 320, 0, th.groundCol);
      E.box('cube', (d0 + d1) / 2, -1.2, -70, d1 - d0 - 1, 1.4, 320, 0, '#3a3f48');
      const off = world.scroll % 3;
      for (let z = -150 + off; z < 45; z += 3) E.box('cube', (d0 + d1) / 2, 0.02, z, d1 - d0, 0.05, 0.12, 0, '#3a424c');
    } else {
      E.box('plane', 0, 0, -70, 320, 1, 320, 0, th.groundCol);
    }
    for (const tx of [0, GHOST_X]) {
      E.box('cube', tx, 0.05, -70, 4.4, 0.1, 320, 0, th.ballast);
      const off = world.scroll % 1.6;
      for (let z = -150 + off; z < 45; z += 1.6) E.box('cube', tx, 0.16, z, 3.4, 0.14, 0.42, 0, th.sleeper);
      E.box('cube', tx - 0.75, 0.3, -70, 0.14, 0.18, 320, 0, th.rail);
      E.box('cube', tx + 0.75, 0.3, -70, 0.14, 0.18, 320, 0, th.rail);
    }
    if (th.props === 'desert') { E.box('cube', 3.4 - 0.65, 5.6, -70, 0.04, 0.04, 320, 0, '#2a2a2a'); E.box('cube', 3.4 + 0.65, 5.6, -70, 0.04, 0.04, 320, 0, '#2a2a2a'); }
    if (th.props === 'tunnel') {
      const off = world.scroll % 10;
      for (let z = -150 + off; z < 45; z += 10) E.box('cube', -3.5, 0.06, z, 0.3, 0.04, 3, 0, '#ffd23d', 0.5);
    }
    for (const p of world.pebbles) if (Math.abs(p.x) > 2.5 && Math.abs(p.x - GHOST_X) > 2.5) E.box('cube', p.x, 0.05, p.z, p.s, 0.1, p.s * 1.3, p.r, th.ballast);
    for (const p of world.props) if (p.z > -175 && p.z < 52) MD.prop(p, th, world.t);
  }

  /* 날씨 */
  function updWeather(dt) {
    const th = world.theme, L = G.layout.end, lq = lowQ();
    const n = lq ? 0.5 : 1;
    if (th.weather === 'rain') {
      for (let i = 0; i < 6 * n; i++) part({ mesh: 'cube', x: rand(-18, 14), y: rand(14, 22), z: rand(-50, L + 8), vy: -45, vx: -3, s: 0.06, s1: 0.06, sy: 1.6, max: 0.5, col: '#b9c9ff', emi: 0.8, alpha: 0.45, pass: 1, drift: 0.4, streak: true });
      if (Math.random() < 0.004) { G.flash = 0.12; G.flashCol = '#d9e2ff'; }
    } else if (th.weather === 'dust') {
      if (Math.random() < 0.5 * n) part({ mesh: 'ico', x: rand(-30, -10), y: rand(0.5, 4), z: rand(-60, L), vx: rand(10, 16), vy: rand(-0.5, 0.5), s: rand(0.6, 1.4), s1: rand(2, 3.5), max: rand(1.5, 2.5), col: '#e8c08a', alpha: 0.25, pass: 1, drift: 0.6 });
    } else if (th.weather === 'sparks') {
      if (Math.random() < 0.08 * n) {
        const x = Math.random() < 0.5 ? th.walls[0] + 0.5 : th.walls[1] - 0.5, z = rand(-40, L);
        for (let i = 0; i < 10; i++) part({ mesh: 'cube', x, y: 9, z, vx: rand(-3, 3), vy: rand(-2, 2), vz: rand(-3, 3), g: -25, s: 0.1, s1: 0.03, max: rand(0.6, 1.1), col: pick(['#ffd23d', '#ff9a2a', '#ffffff']), emi: 2, pass: 2, alpha: 1, bounce: true });
      }
    } else if (th.weather === 'wind') {
      if (Math.random() < 0.3 * n) part({ mesh: 'cube', x: rand(-25, -5), y: rand(1, 10), z: rand(-60, L), vx: 30, s: 0.05, s1: 0.05, sx: 2.5, sy: 0.05, max: 0.8, col: '#ffffff', emi: 0.5, alpha: 0.25, pass: 1, drift: 0.3, streak: true });
    }
  }
  /* 지형 제약: 다리(deck) / 터널 벽 */
  function zoneX() {
    const th = world.theme;
    if (th.deck) return th.deck;
    if (th.walls) return [th.walls[0] + 0.6, th.walls[1] - 0.6];
    return null;
  }

  /* ================= 열차 ================= */
  function trainLayout(cars) {
    const out = []; let z = 6.4 + 0.6;
    for (const k of cars) { out.push({ kind: k, z0: z, cz: z + MD.CAR_LEN / 2 }); z += MD.CAR_LEN + 0.6; }
    return { cars: out, end: z - 0.6 };
  }
  function carOf(kind) { if (!G) return null; for (const c of G.layout.cars) if (c.kind === kind) return c; return null; }
  function drawGhostTrain(layout, wa, st) {
    // 고스트 열차는 왼쪽 선로에 반투명으로 (간단 버전: 같은 모델을 x 이동해서 그림)
    const tc = C.train.colors;
    const saveDraw = E.draw;
    E.draw = function (mesh, col, emi, alpha, pass) {
      const m = T.m, ox = m[12], oz = m[14];
      m[12] += GHOST_X; m[14] += st.ghostZ;
      saveDraw(mesh, '#22c8ff', 0.45, 0.2, 1);
      m[12] = ox; m[14] = oz;
    };
    try {
      MD.engine(0, tc, wa, false);
      for (const c of layout.cars) MD.car(c.z0, c.kind, tc, wa, false, st);
    } finally { E.draw = saveDraw; }
  }

  /* 그림 열차: 지붕(위에서 본 그림) + 양옆(옆에서 본 그림) 판을 3D로 세워서 조립 */
  const TOP_CAR = 1.6, TOP_ENGINE = 2.3;
  const GHOST_TINT = [0.45, 0.95, 1.0, 0.33], GHOST_ADD = [0.0, 0.12, 0.18];
  function drawTrainArt(layout, st, ghost) {
    const pieces = [{ kind: 'engine', z0: 0, L: 6.4, top: TOP_ENGINE }].concat(layout.cars.map((c, i) => ({ kind: c.kind, z0: c.z0, L: MD.CAR_LEN, top: TOP_CAR, idx: i })));
    const t = G ? G.t : world.t;
    const xo = ghost ? GHOST_X : 0, zo = ghost ? (st.ghostZ || 0) : 0;
    for (const p of pieces) {
      const art = SPR.train[p.kind] || SPR.train.gun; if (!art) continue;
      const ft = SPR.frames[art.top], fs = art.side ? SPR.frames[art.side] : null;
      const Lq = p.L * 1.1, W = Lq * ft.aspect, cz = p.z0 + p.L / 2 + zo;
      const inv = !ghost && G && p.idx !== undefined && G.inv && G.inv[p.idx];
      const pulse = inv ? 0.5 + 0.5 * Math.sin(t * 14) : 0;
      const jit = inv ? (Math.random() - 0.5) * 0.08 : Math.sin(t * 9 + p.z0) * 0.012;
      const tint = ghost ? GHOST_TINT : null, add = ghost ? GHOST_ADD : inv ? [0.55 * pulse, 0.02, 0.02] : null;
      if (!ghost) E.box('cube', xo, p.top / 2 + 0.05, cz, W * 0.9, p.top - 0.3, Lq * 0.88, 0, '#2a2c33');  // 지붕 그림보다 0.1 낮게 (겹쳐서 깜빡이지 않게)
      if (fs) {
        const hS = Lq / fs.aspect, sx = W / 2 - 0.04;
        E.quad(fs, xo + sx + jit, 0.12, cz, [0, 0, -Lq], [0, hS, 0], 0.5, 0, tint, add, false, ghost ? 8 : 5);
        E.quad(fs, xo - sx + jit, 0.12, cz, [0, 0, -Lq], [0, hS, 0], 0.5, 0, tint, add, false, ghost ? 8 : 5);
      }
      E.quad(ft, xo + jit, p.top, cz, [W, 0, 0], [0, 0, -Lq], 0.5, 0.5, tint, add, false, ghost ? 9 : 6);
      if (!ghost && p.kind === 'tesla') { const pu = 1 + Math.sin(t * 9) * 0.15; T.reset().tr(0, p.top + 1.3, cz).sc(1.6 * pu); E.draw('ico', '#3df2ff', 1, 0.22, 2); }
      if (!ghost && p.kind === 'engine' && Math.random() < 0.25) {
        const pp = { mesh: 'ico', x: rand(-0.2, 0.2), y: p.top + 2.0, z: 1.6, vx: rand(-0.3, 0.3), vy: rand(2.5, 4), vz: 0, s: 0.45, s1: 1.4, max: 1.0, col: '#e8e2d8', alpha: 0.4, pass: 1, drift: 0.7 };
        if (G) part(pp); else lobbyParts.push(Object.assign(pp, { life: 0, g: 0, rot: 0, vr: 0 }));
      }
    }
  }

  /* ================= 실내 침입 ================= */
  function updInvasion(dt) {
    const cfg = C.invasion; if (!cfg || !SPR.hasFight()) return;
    if (G.waveIdx + 1 >= cfg.firstWave && G.endT < 0 && G.layout.cars.length) {
      G.invT -= dt;
      if (G.invT <= 0) { G.invT = rand(cfg.every[0], cfg.every[1]); startInvasion(); }
    }
    for (const k in G.inv) {
      const v = G.inv[k]; v.t += dt;
      damageTrain(cfg.dps * v.n * dt);
      if (v.t > cfg.autoClear) {
        delete G.inv[k];
        const c = G.layout.cars[k]; if (c) FX.text(0, 4, c.cz, '자력 격퇴! (보상 없음)', '#cccccc', 15, 1.2);
      }
    }
  }
  function startInvasion() {
    const free = G.layout.cars.map((c, i) => i).filter(i => !G.inv[i]);
    if (!free.length) return;
    const idx = pick(free), cfg = C.invasion;
    const types = Object.keys(SPR.fight).filter(k => k !== 'bg' && k !== 'jack');
    G.inv[idx] = { n: Math.floor(rand(cfg.count[0], cfg.count[1] + 1)), t: 0, types };
    const c = G.layout.cars[idx];
    FX.text(0, 5, c.cz, '🚨 침입!!', '#ff4a4a', 26, 1.4, true);
    for (let i = 0; i < 6; i++) part({ mesh: 'cube', x: rand(-1, 1), y: TOP_CAR + 0.5, z: c.cz + rand(-2, 2), vx: rand(-5, 5), vy: rand(4, 9), vz: rand(-3, 3), g: -25, s: 0.25, max: 1, col: pick(['#7a5236', '#555']), bounce: true });
    if (DX.UI) DX.UI.banner('🚨 침입 발생!', '빨갛게 깜빡이는 칸을 터치해서 쫓아내세요', 'horde');
    S.alarm(); vib(80);
  }
  function invaded(kind) { if (!G.inv) return false; const i = G.layout.cars.findIndex(c => c.kind === kind); return i >= 0 && !!G.inv[i]; }
  DX.startFight = function (idx) {
    if (!G || DX.state !== 'play' || !G.inv[idx] || !DX.FIGHT) return false;
    const inv = G.inv[idx], cfg = C.invasion;
    DX.state = 'fight';
    DX.FIGHT.start({ count: inv.n, types: inv.types, time: cfg.fightTime, hits: cfg.hitsToKill }, res => {
      delete G.inv[idx];
      DX.track(res.win ? 'invasion_win' : 'invasion_fail', { stage: G.stageIdx + 1 });
      if (res.win) {
        DX.mission('fight');
        const g = cfg.reward.gold * inv.n;
        G.gold += g; G.ult = Math.min(1, G.ult + cfg.reward.ult); G.hp = Math.min(G.hpMax, G.hp + G.hpMax * cfg.reward.heal);
        if (DX.UI) DX.UI.banner('격퇴 성공!!', DX.L('골드 +' + g + ' · 필살기 충전 · 체력 회복', '金币 +' + g + ' · 大招充能 · 生命恢复'), 'win');
        S.win();
      } else {
        G.hp = Math.max(1, G.hp - G.hpMax * cfg.failDamage);
        if (DX.UI) DX.UI.banner('격퇴 실패...', '열차가 피해를 입었다', 'horde');
      }
      DX.state = 'play';
    });
    return true;
  };

  /* ================= 런 시작 ================= */
  DX.startRun = function (stageIdx) {
    const stg = C.stages[stageIdx];
    applyTheme(stageIdx);
    const meta = DX.save.meta;
    G = {
      stageIdx, stg, waveIdx: -1, waveT: 0, spawnAcc: 0, hordeDone: 0, waveDone: false,
      hpMaxBase: C.train.baseHp + meta.hp * C.meta.hp.per, hp: 0, hpMax: 0,
      level: 1, xp: 0, xpNeed: C.xpNeed(1), pendingLv: 0,
      kills: 0, gold: 0, combo: 0, comboT: 0, maxCombo: 0, rerolls: C.ads.rerollPerRun, stats: {}, inv: {}, invT: 8,
      weapons: { mg: 1 }, passives: {}, cars: ['gun'],
      zs: [], corpses: [], orbs: [], bullets: [], shells: [], bombs: [], drones: [], barrels: [], leeks: [], bolts: [], parts: [], sparts: [], decals: [], fires: [], ftexts: [],
      tm: { mg: [0, 0.1, 0.2], flame: 0, tesla: 1, cannon: 0.5, barrel: 2, flameFx: 0 },
      ult: 0, ultQueue: [], hornCd: 5, shield: 0, emergencyUsed: false, revived: false,
      boss: null, bossSpawned: false, timeScale: 1, hitstop: 0, slowmo: 0, slowmoT: 0, shake: 0, t: 0, wa: 0,
      cannonYaw: 0, cannonRecoil: 0, ghostZ: 2, aim: [0, 0, 0], recoil: [0, 0, 0], endT: -1, outcome: null,
      dmgMul: 1 + meta.dmg * C.meta.dmg.per, xpMul: 1 + meta.xp * C.meta.xp.per, timers: [],
    };
    G.layout = trainLayout(G.cars);
    recalc();
    G.hp = G.hpMax;
    DX.state = 'play';
    DX.mission('run'); DX.track('run_start', { stage: stageIdx + 1 });
    nextWave();
    if (DX.UI) DX.UI.onRunStart(G);
  };
  function recalc() {
    const p = G.passives;
    G.pMul = (1 + (p.power || 0) * C.passives.power.per) * G.dmgMul;
    G.haste = 1 / (1 + (p.haste || 0) * C.passives.haste.per);
    const nm = G.hpMaxBase * (1 + (p.armor || 0) * C.passives.armor.per);
    if (G.hpMax) G.hp += Math.max(0, nm - G.hpMax);
    G.hpMax = nm;
    G.magnet = C.magnetRange * (1 + (p.magnet || 0) * C.passives.magnet.per + (DX.save.meta.magnet || 0) * C.meta.magnet.per);
    G.crit = (p.crit || 0) * C.passives.crit.per;
    G.greed = 1 + (p.greed || 0) * C.passives.greed.per;
    G.layout = trainLayout(G.cars);
    // 드론 수
    const dl = G.weapons.drone;
    if (dl) { const n = C.weapons.drone.drones[dl - 1]; while (G.drones.length < n) G.drones.push({ x: 0, y: 6, z: 10, st: 'idle', cd: rand(0.5, 1.5), a: Math.random() * 6, tx: 0, tz: 0 }); }
  }

  /* ================= 웨이브 ================= */
  function nextWave() {
    G.waveIdx++;
    if (G.waveIdx >= G.stg.waves.length) { endRun(true); return; }
    const w = G.stg.waves[G.waveIdx];
    G.wave = w; G.waveT = 0; G.hordeDone = 0; G.bossSpawned = false; G.waveDone = false;
    if (G.waveIdx > 0) { G.hp = Math.min(G.hpMax, G.hp + G.hpMax * 0.1); collectAllOrbs(); }
    if (DX.UI) DX.UI.banner('WAVE ' + (G.waveIdx + 1), w.boss ? C.texts.bossAlert : pick(C.texts.waveSubs), w.boss ? 'boss' : 'wave');
    if (w.boss) S.alarm();
    // 보스 직전 보급 제안 (선택형 광고) — 고르는 동안 게임 멈춤
    const bs = C.ads.bossSupply;
    if (w.boss && bs && bs.on && (!bs.finalOnly || G.waveIdx === G.stg.waves.length - 1) && G.hp < G.hpMax * (bs.askBelow || 1) && (G.supplyN || 0) < bs.perRun && DX.UI && DX.UI.bossSupply) {
      G.supplyN = (G.supplyN || 0) + 1;
      DX.state = 'supply';
      DX.track('boss_supply_offer', { stage: G.stageIdx + 1, wave: G.waveIdx + 1 });
      DX.UI.bossSupply(bs, G);
    }
  }
  // 보급 결과: take=true 면 광고 시청 완료 → 보상 지급, false 면 그냥 진행
  DX.bossSupplyDone = function (take) {
    if (!G || DX.state !== 'supply') return;
    const bs = C.ads.bossSupply;
    if (take) {
      G.hp = Math.min(G.hpMax, G.hp + G.hpMax * bs.heal);
      if (bs.ult) G.ult = 1;
      G.shield = Math.max(G.shield, bs.shield);
      DX.track('boss_supply_take', { stage: G.stageIdx + 1, wave: G.waveIdx + 1 });
      if (DX.UI) DX.UI.banner('보급 도착!', DX.L('체력 회복 · 대파 폭격 충전 · 방어막 ' + bs.shield + '초', '生命恢复 · 大招充满 · 护盾 ' + bs.shield + ' 秒'), 'win');
      S.level();
    }
    DX.state = 'play';
  };
  function pickType(mix) {
    let tot = 0; for (const k in mix) tot += mix[k];
    let r = Math.random() * tot;
    for (const k in mix) { r -= mix[k]; if (r <= 0) return k; }
    return 'office';
  }
  function spawnZombie(type, x, z) {
    if (G.zs.length >= maxZ()) return null;
    const cfg = C.zombies[type], w = G.wave;
    const hp = cfg.hp * w.hp;
    const s = cfg.scale * rand(0.92, 1.08);
    const zb = { type, cfg, x, z, y: 0, yaw: 0, ph: rand(0, 6), s, hp, maxHp: hp, armor: cfg.armor ? cfg.armor * w.hp : 0,
      spd: cfg.speed * rand(0.85, 1.15), dps: cfg.dps, mass: cfg.mass || 1, kx: 0, kz: 0, stun: 0, flash: 0, burn: 0, burnT: 0, atk: false,
      onTrain: false, jump: null, r: 0.42 * s, dead: false, lastKind: 'shot', tf: Math.pow(Math.random(), 0.85), side: x < 0 ? -1 : x > 0 ? 1 : (Math.random() < 0.5 ? -1 : 1) };
    const zx = zoneX();
    if (zx && world.theme.deck && (x <= zx[0] + 0.01 || x >= zx[1] - 0.01)) { zb.climb = 1; zb.y = -2.4; }
    G.zs.push(zb);
    return zb;
  }
  function spawnPoint() {
    const r = Math.random(), L = G.layout.end, zx = zoneX();
    if (zx) {
      if (r < 0.62) return [rand(zx[0] + 0.5, zx[1] - 0.5), rand(-82, -62)];
      return [Math.random() < 0.6 ? zx[0] : zx[1], rand(-50, L * 0.6)];
    }
    if (r < 0.62) return [rand(-22, 22), rand(-82, -62)];
    const side = Math.random() < 0.5 ? -1 : 1;
    return [side * rand(20, 25), rand(-60, L * 0.6)];
  }
  function spawnHorde(n) {
    const zx = zoneX();
    const cx = zx ? rand(zx[0] + 3, zx[1] - 2) : rand(-14, 14), cz = rand(-90, -72);
    const side = Math.random() < 0.3;
    const sd = zx ? (Math.random() < 0.6 ? zx[0] : zx[1]) : (cx < 0 ? -1 : 1);
    for (let i = 0; i < n; i++) {
      let x, z;
      if (side) { x = zx ? sd : sd * rand(19, 27); z = rand(-50, -10) + rand(-6, 6); }
      else { x = cx + rand(-7, 7); z = cz + rand(-9, 9); if (zx) x = clamp(x, zx[0] + 0.5, zx[1] - 0.5); }
      spawnZombie(pickType(G.wave.mix), x, z);
    }
    if (DX.UI) DX.UI.banner(C.texts.hordeAlert, '', 'horde');
    S.alarm();
  }
  function spawnBoss() {
    const w = G.wave, cfg = C.bosses[w.boss] || C.bosses.bujang;
    const hp = cfg.hp * (w.bossHp || 1);
    const b = { type: 'boss', model: cfg.model === 'giant' ? cfg.base : null, giant: cfg.model === 'giant', cfg, x: -2, z: -70, y: 0, yaw: 0, ph: 0, s: cfg.scale * (w.bossHp > 2 ? 1.25 : 1), hp, maxHp: hp, armor: 0, spd: cfg.speed, dps: cfg.dps,
      mass: 999, kx: 0, kz: 0, stun: 0, flash: 0, burn: 0, burnT: 0, atk: false, onTrain: false, jump: null, r: 2.2, dead: false, boss: true, stompT: 5 };
    b.r = (b.giant ? 0.4 : 0.8) * b.s;
    G.zs.push(b); G.boss = b; G.bossSpawned = true;
    S.roar(); G.shake = Math.max(G.shake, 0.8);
    if (DX.UI) DX.UI.bossBar(true, DX.T(cfg.name), 1);
  }
  function updWave(dt) {
    const w = G.wave; if (!w || G.endT >= 0) return;
    G.waveT += dt;
    G.spawnAcc += w.rate * dt * (G.boss ? 0.6 : 1);
    while (G.spawnAcc >= 1) {
      G.spawnAcc -= 1;
      const p = spawnPoint();
      spawnZombie(pickType(w.mix), p[0], p[1]);
    }
    const hordeEvery = w.time / (w.hordes + 0.5);
    if (G.hordeDone < w.hordes && G.waveT > hordeEvery * (G.hordeDone + 0.8)) { G.hordeDone++; spawnHorde(w.hordeSize); }
    if (w.boss) { if (!G.bossSpawned && G.waveT > 3) spawnBoss(); }
    else if (G.waveT >= w.time) nextWave();
  }

  function later(t, fn) { G.timers.push({ t, fn }); }
  function updTimers(dt) {
    if (!G.timers.length) return;
    const run = [];
    for (const tm of G.timers) { tm.t -= dt; if (tm.t <= 0) run.push(tm); }
    G.timers = G.timers.filter(tm => tm.t > 0);
    for (const tm of run) tm.fn();
  }

  /* ================= 이펙트 ================= */
  const FX = DX.FX = {};
  function part(o) {
    const cap = lowQ() ? 450 : 1100;
    if (G.parts.length >= cap) G.parts.splice(0, 40);
    o.life = 0; if (o.drift === undefined) o.drift = 1; if (o.s1 === undefined) o.s1 = o.s;
    o.vx = o.vx || 0; o.vy = o.vy || 0; o.vz = o.vz || 0; o.g = o.g || 0; o.rot = o.rot || 0; o.vr = o.vr || 0;
    G.parts.push(o); return o;
  }
  FX.text = function (x, y, z, txt, col, size, life, big) { txt = DX.T(txt); if (G.ftexts.length > 60) G.ftexts.shift(); G.ftexts.push({ x, y, z, txt, col: col || '#fff', size: size || 18, t: 0, max: life || 0.9, big }); };
  FX.spark = function (x, y, z, n, col) {
    for (let i = 0; i < n; i++) part({ mesh: 'cube', x, y, z, vx: rand(-6, 6), vy: rand(1, 6), vz: rand(-6, 6), g: -20, s: rand(0.08, 0.16), s1: 0.02, max: rand(0.15, 0.3), col: col || '#fff2b0', emi: 1.6, pass: 2, alpha: 1 });
  };
  FX.goo = function (x, z, big) {
    G.decals.push({ x, z, r: big ? rand(3, 4.5) : rand(0.5, 0.9), a: 0.5, col: pick(['#5fae3a', '#7bc943', '#4f9a2f']), rot: rand(0, 6) });
    if (G.decals.length > 90) G.decals.shift();
    const n = big ? 24 : 5;
    for (let i = 0; i < n; i++) part({ mesh: 'cube', x, y: 1, z, vx: rand(-4, 4) * (big ? 2 : 1), vy: rand(2, 7), vz: rand(-4, 4) * (big ? 2 : 1), g: -25, s: rand(0.12, 0.28), max: rand(0.4, 0.8), col: pick(['#7bd84a', '#a6f06a', '#4f9a2f']), emi: 0.3, bounce: true });
  };
  FX.explode = function (x, z, r, style) {
    const lq = lowQ();
    const cols = style === 'leek' ? ['#9bff7a', '#ffe066', '#ffffff', '#59d45e'] : style === 'gas' ? ['#9bff4a', '#c6f08a', '#5fd02a', '#e8ff9a'] : ['#ff7b00', '#ffb000', '#ffe066', '#ff3d00'];
    part({ mesh: 'ring', x, y: 0.2, z, s: r * 0.5, s1: r * 2.6, max: 0.38, col: style === 'leek' || style === 'gas' ? '#c8ff8a' : '#ffd23d', emi: 1.6, pass: 2, alpha: 0.95, flat: true });
    part({ mesh: 'ico', x, y: 1, z, s: r * 0.8, s1: r * 1.8, max: 0.18, col: '#fff1b0', emi: 2, pass: 2, alpha: 0.7 });
    const n = lq ? 6 : 10 + Math.floor(r * 2);
    for (let i = 0; i < n; i++) {
      const a = rand(0, 6.28), d = rand(0, r * 0.5);
      part({ mesh: 'ico', x: x + Math.cos(a) * d, y: rand(0.4, 1.6), z: z + Math.sin(a) * d, vx: Math.cos(a) * rand(2, 7), vy: rand(2, 7), vz: Math.sin(a) * rand(2, 7), s: rand(0.7, 1.4) * r / 4, s1: rand(1.8, 2.8) * r / 4, max: rand(0.3, 0.6), col: pick(cols), emi: 1.6, pass: 2, alpha: 0.9 });
    }
    for (let i = 0; i < (lq ? 2 : 5); i++) part({ mesh: 'ico', x: x + rand(-1, 1), y: 1.2, z: z + rand(-1, 1), vx: rand(-1.5, 1.5), vy: rand(2, 4), vz: rand(-1.5, 1.5), s: r * 0.25, s1: r * 0.75, max: rand(0.9, 1.4), col: '#4a4440', alpha: 0.45, pass: 1 });
    for (let i = 0; i < (lq ? 4 : 10); i++) { const a = rand(0, 6.28); part({ mesh: 'cube', x, y: 0.6, z, vx: Math.cos(a) * rand(4, 11), vy: rand(6, 13), vz: Math.sin(a) * rand(4, 11), g: -32, s: rand(0.2, 0.45), max: rand(0.8, 1.3), col: pick(['#3a3330', '#5b4636', world.theme.groundCol]), bounce: true, vr: rand(-12, 12) }); }
    G.decals.push({ x, z, r: r * 0.9, a: 0.5, col: '#2a2420', rot: rand(0, 6) });
    G.shake = Math.max(G.shake, Math.min(1.2, r * 0.12));
    S.boom(r > 5);
    if (r > 5) vib(30);
  };
  function beam(x1, y1, z1, x2, y2, z2, w, col, emi, alpha) {
    const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1, h = Math.hypot(dx, dz), len = Math.hypot(h, dy) || 0.01;
    T.reset().tr((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2).ry(Math.atan2(dx, dz)).rx(-Math.atan2(dy, h)).sc(w, w, len);
    E.draw('cube', col, emi, alpha, 2);
  }

  /* ================= 피해 / 처치 ================= */
  function hullDist(x, z) {
    const hx = clamp(x, -1.45, 1.45), hz = clamp(z, 0, G.layout.end);
    return { d: Math.hypot(x - hx, z - hz), hx, hz };
  }
  let SRC = 'mg';
  function hit(z, dmg, kind, dx, dz, force, canCrit) {
    if (z.dead) return 0;
    const hp0 = z.hp + Math.max(0, z.armor);
    let crit = false;
    if (canCrit && G.crit > 0 && Math.random() < G.crit) { dmg *= 2; crit = true; }
    if (z.armor > 0) {
      z.armor -= dmg;
      if (z.armor <= 0) {
        dmg = -z.armor; z.armor = 0;
        if (Math.random() < 0.35) FX.text(z.x, 2.4, z.z, '택배 파손!', '#ffcf6b', 15, 0.8);
        const bch = artOf(z);
        if (bch && bch.parts.torso) { const keep = bch.parts; bch.parts = { torso: keep.torso }; burstParts(z, bch, 'blast', dx || 0, dz || -1, 6); bch.parts = keep; }
        for (let i = 0; i < 8; i++) part({ mesh: 'cube', x: z.x, y: 1.2, z: z.z, vx: rand(-5, 5), vy: rand(3, 8), vz: rand(-5, 5), g: -25, s: rand(0.2, 0.4), max: 1, col: pick(['#c08a57', '#e8d5a8']), bounce: true, vr: rand(-10, 10) });
      } else dmg = 0;
    }
    z.hp -= dmg; z.flash = 0.07; z.lastKind = kind;
    G.stats[SRC] = (G.stats[SRC] || 0) + Math.min(hp0, dmg);
    if (force && !z.boss) {
      const k = force / z.mass;
      z.kx += dx * k; z.kz += dz * k;
      if (z.onTrain && force > 8) { z.onTrain = false; z.jump = null; }
    }
    if ((crit && dmg >= 25 || dmg >= 90) && Math.random() < 0.6) FX.text(z.x + rand(-0.3, 0.3), 2.4 * (z.boss ? 2.5 : 1), z.z, Math.round(dmg) + (crit ? '!' : ''), crit ? '#ffd23d' : '#ffffff', crit ? 20 : 15, 0.6);
    if (z.hp <= 0) kill(z, kind, dx, dz, force);
    return dmg;
  }
  /* ---------- 그림 캐릭터 (2.5D) ---------- */
  const SPR = DX.SPR;
  function artOf(z) { const k = z.cfg && z.cfg.art; return k && SPR.has(k) ? SPR.chars[k] : null; }
  // 부품이 흩어지는 사망 연출
  function poof(z, big) {
    const n = big ? 26 : 8;
    for (let i = 0; i < n; i++) part({ mesh: 'ico', x: z.x + rand(-0.6, 0.6), y: rand(0.5, 2) * (big ? 3 : 1), z: z.z + rand(-0.6, 0.6), vx: rand(-2, 2), vy: rand(1, 3), vz: rand(-2, 2), s: big ? 1.2 : 0.5, s1: big ? 3 : 1.3, max: rand(0.4, 0.7), col: pick(['#ffffff', '#e8eef5', '#d8f0c8']), alpha: 0.8, pass: 1 });
    for (let i = 0; i < (big ? 12 : 3); i++) part({ mesh: 'cyl12', x: z.x, y: 1.2, z: z.z, vx: rand(-4, 4), vy: rand(5, 9), vz: rand(-4, 4), g: -25, s: 0.3, max: 0.8, col: '#ffcf3a', emi: 0.8, bounce: true, vr: rand(-10, 10) });
  }
  function burstParts(z, ch, kind, dx, dz, force, big) {
    if (DX.save.mild) { poof(z, big); return; }
    const H = ch.height * z.s, fl = (z.face || 1) * ch.face < 0;
    const dl = Math.hypot(dx || 0, dz || 0) || 1, ndx = (dx || 0) / dl, ndz = (dz || 0) / dl;
    const pw = (kind === 'leek' ? 1.5 : kind === 'shock' ? 0.6 : 1) * (big ? 1.4 : 1);
    const cap = lowQ() ? 160 : 420;
    for (const k in ch.parts) {
      const p = ch.parts[k], fr = SPR.frames[p.frame]; if (!fr) continue;
      const ph = p.h * H, ox = p.ox * H * (fl ? -1 : 1);
      if (G.sparts.length >= cap) G.sparts.shift();
      G.sparts.push({ fr, x: z.x + ox, y: z.y + p.oy * H, z: z.z, vx: (ndx * rand(4, 9) + ox * 2.5) * pw, vy: rand(6, 12) * pw, vz: (ndz * rand(4, 9) + rand(-2, 2)) * pw,
        rot: 0, vr: rand(-14, 14), w: ph * fr.aspect, h: ph, flip: fl, t: 0, max: rand(1.3, 1.9), shock: kind === 'shock', burn: kind === 'burn' ? 0.8 : 0, tint: z.cfg.artTint });
    }
  }
  function updSparts(dt) {
    const S2 = world.speed, zx = zoneX();
    for (const p of G.sparts) {
      p.t += dt; p.vy -= 30 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt + S2 * dt * (p.ground ? 1 : 0.6);
      p.rot += p.vr * dt;
      const off = world.theme.deck && zx && (p.x < zx[0] || p.x > zx[1]);
      if (!off && p.y < p.h * 0.3) { p.y = p.h * 0.3; p.vy *= -0.35; p.vx *= 0.55; p.vz *= 0.55; p.vr *= 0.5; if (Math.abs(p.vy) < 1.5) { p.vy = 0; p.ground = true; } }
    }
    G.sparts = G.sparts.filter(p => p.t < p.max && p.y > -40);
  }
  const FLASH_ADD = [0.65, 0.65, 0.65], SHOCK_ADD = [0.15, 0.55, 0.65];
  function drawSparts() {
    for (const p of G.sparts) {
      const a = Math.min(1, (p.max - p.t) * 3);
      const tt = p.burn ? [0.25, 0.22, 0.2, a] : p.tint ? [p.tint[0], p.tint[1], p.tint[2], a] : [1, 1, 1, a];
      E.sprite(p.fr, p.x, p.y, p.z, p.w, p.h, p.rot, 0.5, 0.5, tt, p.shock && p.t < 0.4 ? SHOCK_ADD : null, p.flip);
    }
  }
  function drawZSprite(z, ch, corpse) {
    const fr = SPR.frames[ch.full]; if (!fr) return;
    const sw = 1 + (z.swell || 0);
    const H = ch.height * z.s * sw;
    let bob = 0, rot = 0, sq = 1, y = z.y, ay = 0;
    if (!corpse) {
      const k = z.atk ? 1.6 : 1;
      bob = Math.abs(Math.sin(z.ph)) * 0.16 * (H / 2.3);
      rot = Math.sin(z.ph) * 0.09 * k + (z.lean || 0);
      sq = 1 - Math.abs(Math.cos(z.ph)) * 0.06;
      if (z.stun > 0) rot += (Math.random() - 0.5) * 0.25;
    } else {
      rot = z.rot || 0; sq = z.sq || 1;
      if (z.kind === 'shot') { ay = 0.5; y += H * (0.5 - 0.24 * Math.abs(Math.sin(rot))); }
    }
    const fl = (z.face || 1) * ch.face < 0;
    const base = z.cfg.artTint;
    const b = z.burn || 0;
    const tint = [(base ? base[0] : 1) * (1 - 0.72 * b), (base ? base[1] : 1) * (1 - 0.75 * b), (base ? base[2] : 1) * (1 - 0.78 * b), z.alpha === undefined ? 1 : z.alpha];
    const add = z.flash > 0 ? FLASH_ADD : z.stun > 0 ? SHOCK_ADD : null;
    E.sprite(fr, z.x, y + bob, z.z, H * fr.aspect * (2 - sq), H * sq, rot, 0.5, ay, tint, add, fl);
  }
  function updArtCorpse(c, dt) {
    const S2 = world.speed;
    c.t += dt; c.z += S2 * dt;
    if (c.kind === 'burn') {
      c.burn = Math.min(1, c.burn + dt * 2.5);
      c.sq = Math.max(0.05, 1 - Math.max(0, c.t - 0.3) * 1.6);
      if (Math.random() < 0.4) part({ mesh: 'cube', x: c.x + rand(-0.3, 0.3), y: rand(0.3, 1.6) * c.sq * c.s, z: c.z, vy: rand(1, 3), s: 0.12, s1: 0.02, max: 0.6, col: pick(['#2b2422', '#555', '#ff7b00']), emi: 0.4 });
      if (c.sq <= 0.06) c.done = true;
      return;
    }
    if (c.kind === 'drop') { c.vy -= 30 * dt; c.y += c.vy * dt; c.x += c.vx * dt; c.rot += c.vr * dt; if (c.y < -40) c.done = true; return; }
    // 총에 맞아 넘어짐
    c.rot = lerp(c.rot, c.rotT, Math.min(1, dt * 9));
    c.vy -= 30 * dt; c.y = Math.max(0, c.y + c.vy * dt);
    c.x += c.vx * dt; c.vx *= 0.9;
    const H = c.ch.height * c.s;
    c.lift = Math.abs(Math.sin(c.rot)) * H * 0.12;
    c.flash = Math.max(0, c.flash - dt);
    if (c.t > (DX.save.mild ? 0.25 : 0.8)) { c.alpha -= dt * (DX.save.mild ? 5 : 2.2); if (c.alpha <= 0) { c.done = true; if (DX.save.mild) poof(c, false); } }
  }

  function kill(z, kind, dx, dz, force) {
    z.dead = true;
    G.kills++; G.mKill = (G.mKill || 0) + 1;
    G.combo++; G.comboT = 2.2; if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    if ([100, 250, 500, 1000, 2000, 3000].indexOf(G.combo) >= 0 && DX.UI) DX.UI.comboPop(G.combo);
    G.gold += z.cfg.gold * G.greed * (1 + Math.min(0.5, G.combo / 400));
    G.ult = Math.min(1, G.ult + (z.boss ? 1 : 1 / C.ultimate.killsToCharge));
    dropOrb(z.x, z.z, z.cfg.xp);
    S.kill();
    if (z.boss) { bossDeath(z); return; }
    if (z.type === 'bomber' && !z.popped) { z.popped = true; bomberBoom(z, false); }
    const zx = zoneX();
    if (world.theme.deck && kind !== 'blast' && kind !== 'leek' && zx && (z.x < zx[0] - 0.2 || z.x > zx[1] + 0.2)) kind = 'drop';
    if (!DX.save.mild) FX.goo(z.x, z.z, false);
    if (Math.random() < 0.12) FX.text(z.x, 2.6, z.z, pick(C.texts.killPops), pick(['#ffffff', '#ffe066', '#9dff7a']), 16, 0.7);
    const ch = artOf(z);
    if (ch) {
      if (kind === 'blast' || kind === 'leek' || kind === 'shock') { burstParts(z, ch, kind, dx, dz, force); if (kind === 'shock') FX.spark(z.x, 1.2, z.z, 8, '#bffaff'); return; }
      const fl = (dx || 0) >= 0 ? 1 : -1;
      const ac = { ch, cfg: z.cfg, art: true, x: z.x, y: z.y, z: z.z, s: z.s, face: z.face, kind: kind === 'burn' ? 'burn' : kind === 'drop' ? 'drop' : 'shot', t: 0, rot: 0, rotT: -fl * rand(1.35, 1.6), vy: kind === 'drop' ? 1 : rand(2.5, 4), vx: fl * rand(1.5, 3), vr: rand(-6, 6), alpha: 1, burn: 0, sq: 1, flash: 0.08, swell: 0 };
      G.corpses.push(ac);
      if (G.corpses.length > (lowQ() ? 50 : 130)) G.corpses.shift();
      return;
    }
    // 시체 (사망 연출)
    const cp = { type: z.type, cfg: z.cfg, x: z.x, y: z.y, z: z.z, yaw: z.yaw, ph: z.ph, s: z.s, kind, t: 0, tx: 0, tz: 0, vtx: 0, vtz: 0, vx: 0, vy: 0, vz: 0, armor: false, burn: 0, flash: 0, stun: 0, dead: true, frozen: true, grounded: false, rest: 0, squash: 1, alpha: 1 };
    const fx = dx || 0, fz = dz || 0, fl = Math.hypot(fx, fz) || 1;
    if (kind === 'blast' || kind === 'leek') {
      const p = (kind === 'leek' ? 1.4 : 1) * (0.6 + Math.min(1.5, (force || 10) / 12));
      cp.vx = fx / fl * rand(5, 10) * p; cp.vz = fz / fl * rand(5, 10) * p; cp.vy = rand(8, 15) * p;
      cp.vtx = rand(-10, 10); cp.vtz = rand(-8, 8);
    } else if (kind === 'drop') {
      cp.vy = 1; cp.vx = Math.sign(z.x - (zx ? (zx[0] + zx[1]) / 2 : 0)) * 2; cp.vtx = rand(-4, 4); cp.vtz = rand(-4, 4);
      if (Math.random() < 0.5) FX.text(z.x, 2, z.z, pick(['으아아~', '추락!', '안녕히~']), '#ffffff', 15, 0.8);
    } else if (kind === 'shock') {
      cp.stun = 0.45;
    } else if (kind === 'burn') {
      cp.burn = 0.3;
    } else {
      cp.vx = fx / fl * rand(2, 4); cp.vz = fz / fl * rand(2, 4); cp.vy = rand(1.5, 3.5);
      // 맞은 방향 반대로 뒤로 넘어짐 (좀비 기준)
      const lx = Math.sin(z.yaw), lz = Math.cos(z.yaw);
      const back = (fx * lx + fz * lz) / fl; // +면 앞에서 밀림
      cp.vtx = back < 0 ? rand(5, 8) : -rand(5, 8);
      cp.vtz = rand(-2, 2);
    }
    G.corpses.push(cp);
    const cap = lowQ() ? 50 : 130;
    if (G.corpses.length > cap) { const o = G.corpses.shift(); }
  }
  function bossDeath(b) {
    DX.mission('boss'); DX.track('boss_kill', { stage: G.stageIdx + 1, wave: G.waveIdx + 1 });
    G.boss = null;
    G.gold += b.cfg.gold * G.greed;
    FX.text(b.x, 7, b.z, '콰-과-광!!', '#ffd23d', 40, 1.6, true);
    FX.text(b.x, 5, b.z, DX.L('+' + b.cfg.gold + ' 골드', '+' + b.cfg.gold + ' 金币'), '#ffe680', 20, 1.6);
    for (let i = 0; i < 5; i++) later(i * 0.16, () => { if (G.endT < 0) FX.explode(b.x + rand(-3, 3), b.z + rand(-3, 3), rand(4, 7), 'fire'); });
    FX.goo(b.x, b.z, true);
    G.slowmo = 0.25; G.slowmoT = 1.3; G.shake = 1.4;
    if (DX.UI) DX.UI.bossBar(false);
    vib([60, 40, 120]);
    // 보스 시체: 크게 날아감
    const bch = artOf(b);
    if (bch) burstParts(b, bch, 'leek', 0, -1, 20, true);
    else G.corpses.push({ type: 'boss', boss: true, giant: b.giant, model: b.model, cfg: b.cfg, x: b.x, y: 0, z: b.z, yaw: b.yaw, ph: b.ph, s: b.s, kind: 'blast', t: 0, tx: 0, tz: 0, vtx: rand(-3, 3), vtz: rand(2, 4), vx: 0, vy: 14, vz: -3, burn: 0, flash: 0, dead: true, grounded: false, rest: 0, squash: 1, alpha: 1 });
    // 주변 좀비 전부 날려버림
    SRC = 'misc';
    for (const z of G.zs) if (!z.dead && Math.hypot(z.x - b.x, z.z - b.z) < 12) hit(z, 9999, 'blast', z.x - b.x, z.z - b.z, 20, false);
    G.waveDone = true;
    later(1.6, () => { if (G.endT < 0) nextWave(); });
  }
  function bomberBoom(z, contact) {
    const b = z.cfg.boom;
    FX.explode(z.x, z.z, b.radius, 'gas');
    FX.text(z.x, 3, z.z, pick(C.texts.bomberPops), '#c6f08a', 20, 0.9);
    const prev = SRC; SRC = 'bomber';
    aoe(z.x, z.z, b.radius, b.dmgZombie * (G.wave ? Math.sqrt(G.wave.hp) : 1), 'blast', 11);
    SRC = prev;
    if (contact) damageTrain(b.dmgTrain);
    else if (hullDist(z.x, z.z).d < 2) damageTrain(b.dmgTrain * 0.4);
  }
  function damageTrain(a) {
    if (G.shield > 0 || G.endT >= 0) return;
    G.hp -= a; G.hurt = 0.15;
    if (!G.emergencyUsed && G.hp < G.hpMax * C.emergency.hpRatio && G.hp > 0) {
      G.emergencyUsed = true;
      G.shield = C.emergency.shieldTime;
      if (DX.UI) DX.UI.banner(C.texts.emergency, DX.L('열차 방어막 ' + G.shield + '초 작동!', '列车护盾启动 ' + G.shield + ' 秒！'), 'ghost');
      S.level();
    }
    if (G.hp <= 0) { G.hp = 0; endRun(false); }
  }

  /* ================= 경험치 / 레벨업 ================= */
  function dropOrb(x, z, v) {
    if (G.orbs.length > 220) { const o = G.orbs[Math.floor(Math.random() * G.orbs.length)]; o.v += v; o.s = Math.min(0.9, 0.35 + o.v * 0.02); return; }
    G.orbs.push({ x, z, y: 0.5, v, s: v > 5 ? 0.7 : v > 1 ? 0.48 : 0.36, fly: false, vx: rand(-2, 2), vz: rand(-2, 2), vy: rand(3, 6) });
  }
  function collectAllOrbs() { for (const o of G.orbs) o.fly = true; }
  function gainXp(v) {
    G.xp += v * G.xpMul;
    while (G.xp >= G.xpNeed) { G.xp -= G.xpNeed; G.level++; G.xpNeed = C.xpNeed(G.level); G.pendingLv++; }
  }
  function buildCards() {
    const opts = [];
    const W = C.weapons, P = C.passives;
    const owned = Object.keys(G.weapons).length;
    for (const id in W) {
      const lv = G.weapons[id] || 0;
      if (lv >= 5) continue;
      const w = W[id];
      const isNew = lv === 0;
      if (isNew && owned >= 6) continue;
      opts.push({ kind: 'weapon', id, lv: lv + 1, name: lv + 1 === 5 ? w.evoName : w.name, desc: w.desc[lv], icon: lv + 1 === 5 && w.evoIcon ? w.evoIcon : w.icon, isNew, evo: lv + 1 === 5, w: isNew ? (owned < 4 ? 3.2 : 1.5) : 3 });
    }
    for (const id in P) {
      const lv = G.passives[id] || 0; if (lv >= 5) continue;
      opts.push({ kind: 'passive', id, lv: lv + 1, name: P[id].name, desc: P[id].desc, emoji: P[id].icon, isNew: lv === 0, w: 1.4 });
    }
    const out = [];
    while (out.length < 3 && opts.length) {
      let tot = 0; for (const o of opts) tot += o.w;
      let r = Math.random() * tot, idx = 0;
      for (let i = 0; i < opts.length; i++) { r -= opts[i].w; if (r <= 0) { idx = i; break; } }
      out.push(opts.splice(idx, 1)[0]);
    }
    if (!out.length) out.push({ kind: 'heal', id: 'heal', lv: 0, name: '도시락 회복', desc: '열차 체력 40% 회복', emoji: '🍱' }, { kind: 'gold', id: 'gold', lv: 0, name: '비상금', desc: '골드 +80', emoji: '💰' });
    return out;
  }
  DX.rerollCards = function () {
    if (!G || DX.state !== 'levelup' || G.rerolls <= 0) return false;
    G.rerolls--;
    DX.UI.levelUp(buildCards(), G);
    return true;
  };
  DX.chooseCard = function (c) {
    if (c.kind === 'weapon') {
      const had = G.weapons[c.id] || 0;
      G.weapons[c.id] = c.lv;
      const car = C.weapons[c.id].car;
      if (!had && car && car !== 'gun' && G.cars.indexOf(car) < 0) G.cars.push(car);
    } else if (c.kind === 'passive') {
      G.passives[c.id] = c.lv;
      if (c.id === 'armor') G.hp = Math.min(G.hpMax * 2, G.hp + G.hpMax * 0.3);
    } else if (c.kind === 'heal') G.hp = Math.min(G.hpMax, G.hp + G.hpMax * 0.4);
    else if (c.kind === 'gold') G.gold += 80;
    recalc();
    G.hp = Math.min(G.hp, G.hpMax);
    G.pendingLv--;
    S.click();
    if (G.pendingLv > 0) { DX.UI.levelUp(buildCards(), G); }
    else { DX.state = 'play'; DX.UI.hideLevelUp(); }
  };

  /* ================= 필살기 / 고스트 싱크 ================= */
  DX.useUltimate = function () {
    if (!G || DX.state !== 'play' || G.ult < 1) return false;
    G.ult = 0;
    const targets = densest(C.ultimate.count, 9);
    targets.forEach((p, i) => G.ultQueue.push({ x: p[0], z: p[1], t: -i * 0.17, first: i === 0 }));
    if (DX.UI) DX.UI.banner(C.ultimate.name + '!!', '하늘에서 대파가 쏟아진다', 'ult');
    S.leek(); vib(40); DX.mission('ult'); DX.track('ult_use', {});
    return true;
  };
  // 비상 경적: 열차 주변 좀비를 한 번에 밀쳐내고 잠깐 기절 + 짧은 방어막
  DX.useHorn = function () {
    if (!G || DX.state !== 'play' || G.hornCd > 0) return false;
    const h = C.horn;
    G.hornCd = h.cd;
    G.shield = Math.max(G.shield, h.shield);
    SRC = 'horn';
    for (const z of G.zs) {
      if (z.dead) continue;
      const hd = hullDist(z.x, z.z);
      if (hd.d > h.radius) continue;
      const dx = z.x - hd.hx || (Math.random() - 0.5), dz = z.z - hd.hz || 0.01, l = Math.hypot(dx, dz) || 1;
      if (z.onTrain) { z.onTrain = false; z.x += Math.sign(z.x || 1) * 2.5; }
      z.stun = Math.max(z.stun, z.boss ? 0.3 : h.stun);
      hit(z, h.dmg * G.pMul, 'blast', dx / l, dz / l, h.force, false);
    }
    const L = G.layout.end;
    for (let i = 0; i < 3; i++) part({ mesh: 'ring', x: 0, y: 0.3, z: L * (0.2 + i * 0.3), s: 2, s1: h.radius * 2.6, max: 0.5, col: '#ffe066', emi: 1.6, pass: 2, alpha: 0.9, flat: true, drift: 0 });
    FX.text(0, 6, 2, '빠아아앙!!', '#ffe066', 36, 1.2, true);
    G.shake = Math.max(G.shake, 1.0);
    S.horn(); vib([40, 30, 60]); DX.mission('horn'); DX.track('horn_use', {});
    return true;
  };

  function densest(n, minSep) {
    const cand = G.zs.filter(z => !z.dead && z.z < G.layout.end + 4 && z.z > -70);
    const out = [];
    if (!cand.length) { for (let i = 0; i < n; i++) out.push([rand(-12, 12), rand(-40, -5)]); return out; }
    const sample = cand.length > 60 ? cand.filter(() => Math.random() < 60 / cand.length) : cand;
    const scored = sample.map(a => {
      let c = 0; for (const b of cand) { const dx = a.x - b.x, dz = a.z - b.z; if (dx * dx + dz * dz < 36) c++; }
      if (a.boss) c += 30;
      return { a, c };
    }).sort((p, q) => q.c - p.c);
    for (const s of scored) {
      if (out.length >= n) break;
      if (out.every(o => Math.hypot(o[0] - s.a.x, o[1] - s.a.z) > minSep)) out.push([s.a.x, s.a.z]);
    }
    while (out.length < n) { const s = pick(cand); out.push([s.x + rand(-3, 3), s.z + rand(-3, 3)]); }
    return out;
  }

  /* ================= 타겟팅 ================= */
  function nearest(x, z, range, filt) {
    let best = null, bd = range * range;
    for (const zb of G.zs) {
      if (zb.dead || (zb.jump && zb.jump.t < 1)) continue;
      if (filt && !filt(zb)) continue;
      const dx = zb.x - x, dz = zb.z - z;
      let d = dx * dx + dz * dz;
      if (zb.onTrain) d *= 0.1;
      if (d < bd) { bd = d; best = zb; }
    }
    return best;
  }
  // 공간 격자 (충돌 계산 가속)
  const grid = new Map(); const CELL = 3;
  function gkey(cx, cz) { return (cx + 500) * 2000 + (cz + 500); }
  function buildGrid() {
    grid.clear();
    for (const z of G.zs) {
      if (z.dead) continue;
      const k = gkey(Math.floor(z.x / CELL), Math.floor(z.z / CELL));
      let a = grid.get(k); if (!a) { a = []; grid.set(k, a); } a.push(z);
    }
  }
  function near(x, z, r, cb) {
    const x0 = Math.floor((x - r) / CELL), x1 = Math.floor((x + r) / CELL), z0 = Math.floor((z - r) / CELL), z1 = Math.floor((z + r) / CELL);
    for (let cx = x0; cx <= x1; cx++) for (let cz = z0; cz <= z1; cz++) {
      const a = grid.get(gkey(cx, cz)); if (!a) continue;
      for (const zb of a) if (!zb.dead) cb(zb);
    }
  }
  function aoe(x, z, r, dmg, kind, force) {
    near(x, z, r + 2.5, zb => {
      const dx = zb.x - x, dz = zb.z - z, d = Math.hypot(dx, dz);
      if (d < r + zb.r) hit(zb, dmg * (1 - 0.35 * Math.min(1, d / r)), kind, dx || rand(-1, 1), dz || rand(-1, 1), force, true);
    });
  }

  /* ================= 무기 업데이트 ================= */
  function gunSlots() {
    const c = carOf('gun'); const cz = c ? c.cz : 10;
    return [[-0.75, DECK, cz - 1.4], [0.75, DECK, cz + 0.3], [0, DECK, cz + 1.9]];
  }
  function updWeapons(dt) {
    const W = C.weapons, haste = G.haste, pm = G.pMul;
    // --- 기관총
    const ml = invaded('gun') ? 0 : (G.weapons.mg || 0);
    if (ml) {
      const w = W.mg, n = w.shooters[ml - 1], slots = gunSlots();
      for (let i = 0; i < n; i++) {
        const s = slots[i];
        G.tm.mg[i] -= dt;
        G.recoil[i] = Math.max(0, G.recoil[i] - dt * 8);
        const tg = nearest(s[0], s[2], w.range);
        if (!tg) continue;
        const tx = tg.x - s[0], tz = tg.z - s[2];
        G.aim[i] = Math.atan2(tx, tz);
        if (G.tm.mg[i] <= 0) {
          G.tm.mg[i] = w.rate[ml - 1] * haste * rand(0.85, 1.15);
          const d = Math.hypot(tx, tz) || 1, sp = 70;
          const a = G.aim[i] + rand(-0.04, 0.04);
          G.bullets.push({ x: s[0] + Math.sin(a) * 0.9, y: 2.6, z: s[2] + Math.cos(a) * 0.9, vx: Math.sin(a) * sp, vz: Math.cos(a) * sp, dmg: w.dmg[ml - 1] * pm, life: 0.6, pierce: w.pierce[ml - 1], gold: ml >= 5, hit: [] });
          G.recoil[i] = 1;
          part({ mesh: 'ico', x: s[0] + Math.sin(a) * 1.0, y: 2.6, z: s[2] + Math.cos(a) * 1.0, s: 0.45, s1: 0.1, max: 0.06, col: '#ffe9a0', emi: 2, pass: 2, alpha: 1, drift: 0 });
          S.shot();
        }
      }
    }
    // --- 화염방사
    SRC = 'flame';
    const fl = invaded('flame') ? 0 : (G.weapons.flame || 0);
    if (fl) {
      const w = W.flame, c = carOf('flame'), range = w.range[fl - 1];
      if (c) {
        G.tm.flame -= dt; G.tm.flameFx -= dt;
        const nozzles = [[-1, c.cz - 1.3], [-1, c.cz + 1.3], [1, c.cz - 1.3], [1, c.cz + 1.3]];
        if (G.tm.flameFx <= 0) {
          G.tm.flameFx = lowQ() ? 0.07 : 0.035;
          for (const nz of nozzles) {
            const sx = nz[0];
            part({ mesh: 'ico', x: sx * 1.9, y: 1.9, z: nz[1], vx: sx * rand(range * 1.1, range * 1.6), vy: rand(-0.5, 1.5), vz: rand(-3, 3), s: 0.35, s1: rand(1.3, 2.2) * (range / 10), max: 0.55, col: pick(['#ff7b00', '#ffb000', '#ffd23d', '#ff4d00']), emi: 1.5, pass: 2, alpha: 0.85, drift: 0.5 });
          }
          S.flame();
        }
        if (G.tm.flame <= 0) {
          const tick = 0.15; G.tm.flame = tick;
          for (const nz of nozzles) {
            const ox = nz[0] * 1.2, oz = nz[1];
            near(ox + nz[0] * range / 2, oz, range / 2 + 3, zb => {
              const dx = zb.x - ox, dz = zb.z - oz;
              if (dx * nz[0] < 0.1) return;
              const d = Math.hypot(dx, dz);
              if (d < range && Math.abs(dz) < d * 0.6 + 1.2) { zb.burn = Math.min(1, zb.burn + 0.25); zb.burnT = 1.2; hit(zb, w.dps[fl - 1] * tick * pm, 'burn', nz[0], 0, 0.6, true); }
            });
          }
          if (fl >= 5 && Math.random() < 0.35) {
            const nz = pick(nozzles);
            G.fires.push({ x: nz[0] * rand(4, range), z: nz[1] + rand(-3, 3), t: 0, max: 3, r: 2.2 });
          }
        }
      }
    }
    // --- 테슬라
    SRC = 'tesla';
    const tl = invaded('tesla') ? 0 : (G.weapons.tesla || 0);
    if (tl) {
      const w = W.tesla, c = carOf('tesla');
      G.tm.tesla -= dt;
      if (c && G.tm.tesla <= 0) {
        G.tm.tesla = w.cd[tl - 1] * haste;
        const strikes = tl >= 5 ? 2 : 1;
        let any = false;
        for (let s = 0; s < strikes; s++) {
          const pts = [[0, 4.65, c.cz]], hitSet = new Set();
          let cx = 0, cz = c.cz;
          for (let k = 0; k < w.chains[tl - 1]; k++) {
            const tg = nearest(cx, cz, k === 0 ? w.range : 9, zb => !hitSet.has(zb) && (s === 0 || k > 0 || Math.random() < 0.6));
            if (!tg) break;
            hitSet.add(tg); any = true;
            pts.push([tg.x, 1.3 * tg.s, tg.z]);
            tg.stun = Math.max(tg.stun, tg.boss ? 0.15 : 0.7);
            hit(tg, w.dmg[tl - 1] * pm, 'shock', 0, 0, 0, true);
            FX.spark(tg.x, 1.3, tg.z, 4, '#8af7ff');
            cx = tg.x; cz = tg.z;
          }
          if (pts.length > 1) G.bolts.push({ pts, t: 0, max: 0.3 });
        }
        if (any) S.zap();
      }
    }
    // --- 캐논
    const cl = invaded('cannon') ? 0 : (G.weapons.cannon || 0);
    G.cannonRecoil = Math.max(0, G.cannonRecoil - dt * 4);
    if (cl) {
      const w = W.cannon, c = carOf('cannon');
      G.tm.cannon -= dt;
      if (c) {
        const tg = nearest(0, c.cz - 6, w.range, zb => zb.z < c.cz);
        if (tg) {
          const want = Math.atan2(tg.x, tg.z - c.cz);
          let d = want - G.cannonYaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
          G.cannonYaw += d * Math.min(1, dt * 8);
          if (G.tm.cannon <= 0 && Math.abs(d) < 0.3) {
            G.tm.cannon = w.rate[cl - 1] * haste;
            const twin = cl >= 5;
            for (const bx of (twin ? [-0.32, 0.32] : [0])) {
              const sx = Math.sin(G.cannonYaw) * 2.6 + Math.cos(G.cannonYaw) * bx, sz = c.cz + Math.cos(G.cannonYaw) * 2.6 - Math.sin(G.cannonYaw) * bx;
              const lead = tg.boss ? 0 : 1;
              G.shells.push({ sx, sy: 2.45, sz, tx: tg.x + rand(-0.6, 0.6), tz: tg.z + lead * 2 + rand(-0.6, 0.6), t: 0, dur: 0.45, dmg: w.dmg[cl - 1] * pm, r: w.splash[cl - 1] });
              part({ mesh: 'ico', x: sx, y: 2.45, z: sz, s: 1.0, s1: 0.2, max: 0.1, col: '#ffe9a0', emi: 2, pass: 2, alpha: 1, drift: 0 });
            }
            G.cannonRecoil = 1; G.shake = Math.max(G.shake, 0.15);
            S.boom(false);
          }
        }
      }
    }
    // --- 드론
    const dl = invaded('drone') ? 0 : (G.weapons.drone || 0);
    if (dl) {
      const w = W.drone, c = carOf('drone'), home = c ? c.cz : 10;
      G.drones.forEach((d, i) => {
        d.a += dt * 1.6;
        if (d.st === 'idle') {
          const hx = Math.cos(d.a + i * 1.6) * 3, hz = home + Math.sin(d.a + i * 1.6) * 2.5;
          d.x = lerp(d.x, hx, dt * 3); d.z = lerp(d.z, hz, dt * 3); d.y = lerp(d.y, 5.5 + Math.sin(d.a * 2) * 0.4, dt * 3);
          d.cd -= dt;
          if (d.cd <= 0) { const t = densest(1, 0)[0]; if (G.zs.length) { d.tx = t[0]; d.tz = t[1]; d.st = 'go'; } else d.cd = 0.5; }
        } else if (d.st === 'go') {
          const dx = d.tx - d.x, dz = d.tz - d.z, dd = Math.hypot(dx, dz);
          const sp = 34 * dt;
          d.tz += world.speed * dt * 0.3;
          if (dd < sp + 0.3) {
            G.bombs.push({ x: d.x, y: d.y, z: d.z, vy: 0, dmg: w.dmg[dl - 1] * pm, r: w.radius[dl - 1] });
            d.st = 'back'; d.cd = w.cd[dl - 1] * haste;
          } else { d.x += dx / dd * sp; d.z += dz / dd * sp; d.y = lerp(d.y, 8, dt * 2); }
        } else {
          const hx = 0, hz = home, dx = hx - d.x, dz = hz - d.z, dd = Math.hypot(dx, dz), sp = 28 * dt;
          if (dd < sp + 0.5) d.st = 'idle'; else { d.x += dx / dd * sp; d.z += dz / dd * sp; }
        }
      });
    }
    // --- 드럼통
    const bl = G.weapons.barrel || 0;
    if (bl) {
      const w = W.barrel;
      G.tm.barrel -= dt;
      if (G.tm.barrel <= 0 && G.zs.length) {
        G.tm.barrel = w.cd[bl - 1] * haste;
        const ts = densest(w.count[bl - 1], 5);
        ts.forEach((t, i) => G.barrels.push({ x: t[0], z: t[1], y: 34 + i * 7, vy: -26, rot: rand(0, 6), dmg: w.dmg[bl - 1] * pm, r: w.radius[bl - 1] }));
      }
    }
  }

  function updProjectiles(dt) {
    const S2 = world.speed;
    // 총알
    for (const b of G.bullets) {
      const sp = Math.hypot(b.vx, b.vz) || 1;
      const steps = Math.max(1, Math.ceil(sp * dt / 0.6));
      const sdt = dt / steps;
      for (let k = 0; k < steps && b.life > 0; k++) {
        b.x += b.vx * sdt; b.z += b.vz * sdt; b.life -= sdt;
        near(b.x, b.z, 1.4, zb => {
          if (b.life <= 0 || b.hit.indexOf(zb) >= 0) return;
          if (zb.jump && zb.jump.t < 1) return;
          const dx = zb.x - b.x, dz = zb.z - b.z, rr = zb.r + 0.35;
          if (dx * dx + dz * dz < rr * rr) {
            SRC = 'mg';
            hit(zb, b.dmg, 'shot', b.vx / sp, b.vz / sp, 2.2, true);
            b.hit.push(zb);
            FX.spark(b.x, 1.4 * zb.s, b.z, 2, b.ghost ? '#9ff6ff' : '#fff2b0');
            if (b.pierce-- <= 0) b.life = 0;
          }
        });
      }
    }
    G.bullets = G.bullets.filter(b => b.life > 0);
    // 포탄
    for (const s of G.shells) {
      s.t += dt; s.tz += S2 * dt * 0.3;
      if (s.t >= s.dur) { s.done = true; FX.explode(s.tx, s.tz, s.r, 'fire'); SRC = 'cannon'; aoe(s.tx, s.tz, s.r, s.dmg, 'blast', 9); }
    }
    G.shells = G.shells.filter(s => !s.done);
    // 드론 폭탄
    for (const b of G.bombs) {
      b.vy -= 30 * dt; b.y += b.vy * dt; b.z += S2 * dt * 0.3;
      if (b.y <= 0.3) { b.done = true; FX.explode(b.x, b.z, b.r, 'fire'); SRC = 'drone'; aoe(b.x, b.z, b.r, b.dmg, 'blast', 10); }
    }
    G.bombs = G.bombs.filter(b => !b.done);
    // 드럼통
    for (const b of G.barrels) {
      b.vy -= 22 * dt; b.y += b.vy * dt; b.rot += dt * 6; b.z += S2 * dt * 0.3;
      if (b.y <= 0.8) { b.done = true; FX.explode(b.x, b.z, b.r, 'fire'); SRC = 'barrel'; aoe(b.x, b.z, b.r, b.dmg, 'blast', 12); FX.text(b.x, 3, b.z, '쾅!', '#ffb000', 22, 0.6); }
    }
    G.barrels = G.barrels.filter(b => !b.done);
    // 대파 (필살기)
    for (const q of G.ultQueue) {
      q.t += dt;
      if (q.t >= 0 && !q.spawned) { q.spawned = true; G.leeks.push({ x: q.x, z: q.z, y: 46, vy: -60, spin: rand(0, 6), first: q.first }); }
    }
    G.ultQueue = G.ultQueue.filter(q => !q.spawned);
    for (const L of G.leeks) {
      L.y += L.vy * dt; L.spin += dt * 2; L.z += S2 * dt * 0.3;
      if (Math.random() < 0.8) part({ mesh: 'ico', x: L.x + rand(-0.5, 0.5), y: L.y + 4, z: L.z, vy: 6, s: 1.0, s1: 0.2, max: 0.35, col: pick(['#ffb000', '#ff7b00', '#fff1b0']), emi: 1.6, pass: 2, alpha: 0.8, drift: 0.3 });
      if (L.y <= 0.5) {
        L.done = true;
        const r = C.ultimate.radius;
        FX.explode(L.x, L.z, r, 'leek'); FX.explode(L.x, L.z, r * 0.6, 'fire');
        SRC = 'ult'; aoe(L.x, L.z, r, C.ultimate.dmg * G.pMul, 'leek', 16);
        if (L.first) FX.text(L.x, 4, L.z, '파-아-아!!', '#c8ff8a', 34, 1.2, true);
        G.hitstop = 0.05; G.slowmo = 0.45; G.slowmoT = 0.35;
        vib(50);
      }
    }
    G.leeks = G.leeks.filter(L => !L.done);
    // 불바다
    for (const f of G.fires) {
      f.t += dt; f.z += S2 * dt;
      if (Math.random() < 0.5) part({ mesh: 'ico', x: f.x + rand(-f.r, f.r) * 0.6, y: 0.3, z: f.z + rand(-f.r, f.r) * 0.6, vy: rand(2, 4), s: 0.5, s1: 1.1, max: 0.4, col: pick(['#ff7b00', '#ffb000', '#ff4d00']), emi: 1.4, pass: 2, alpha: 0.8 });
      SRC = 'flame';
      if (Math.random() < dt * 6) aoe(f.x, f.z, f.r, C.weapons.flame.dps[4] * 0.3 * G.pMul * 0.17, 'burn', 0);
    }
    G.fires = G.fires.filter(f => f.t < f.max);
    for (const b of G.bolts) b.t += dt;
    G.bolts = G.bolts.filter(b => b.t < b.max);
  }

  /* ================= 좀비 업데이트 ================= */
  function updZombies(dt) {
    const S2 = world.speed, drift = S2 * 0.32 * dt, L = G.layout.end;
    for (const z of G.zs) {
      if (z.dead) continue;
      z.flash = Math.max(0, z.flash - dt);
      if (z.burnT > 0) { z.burnT -= dt; if (z.burnT <= 0) z.burn = 0; }
      z.ph += dt * (z.boss ? 4 : 11) * (z.spd / 6);
      if (z.stun > 0) z.stun -= dt;
      z.x += z.kx * dt; z.z += z.kz * dt;
      const damp = Math.pow(0.02, dt); z.kx *= damp; z.kz *= damp;
      // 점프 (댄서)
      if (z.jump) {
        const j = z.jump; j.t += dt / j.dur;
        const p = Math.min(1, j.t);
        z.x = lerp(j.sx, j.tx, p); z.z = lerp(j.sz, j.tz, p); z.y = Math.sin(Math.PI * p) * 5 + p * DECK;
        z.yaw = Math.atan2(j.tx - j.sx, j.tz - j.sz);
        if (p >= 1) { z.jump = null; z.onTrain = true; z.y = DECK; FX.text(z.x, 3.5, z.z, '착지 성공~☆', '#ff7bd5', 15, 0.8); }
        continue;
      }
      if (z.onTrain) {
        z.x = clamp(z.x, -1.1, 1.1); z.z = clamp(z.z, 7.2, L - 0.3); z.y = DECK;
        z.atk = true;
        if (z.stun <= 0) damageTrain(z.dps * 1.6 * dt);
        continue;
      }
      if (z.climb) {
        z.y += dt * 2.6; z.z += drift; z.ph += dt * 6;
        z.yaw = z.x < 0 ? Math.PI / 2 : -Math.PI / 2;
        if (z.y >= 0) { z.y = 0; z.climb = 0; z.x += z.x < -3 ? 0.9 : -0.9; }
        continue;
      }
      if (z.y > 0) { z.y = Math.max(0, z.y - dt * 8); }
      const h = hullDist(z.x, z.z);
      const dx = h.hx - z.x, dz = h.hz - z.z, d = h.d || 0.001;
      // 이동 목표: 보스는 가장 가까운 곳, 일반 좀비는 열차 옆구리의 각자 정해진 위치 (열차 전체를 둘러쌈)
      let mx = dx, mz = dz;
      if (!z.boss) {
        const tz = z.tf * L, tx = z.side * (1.45 + z.r + (z.z < -1 ? 1.4 : 0.02));
        mx = tx - z.x; mz = tz - z.z;
      }
      const md = Math.hypot(mx, mz) || 0.001;
      z.yaw = d <= z.r + 0.12 ? Math.atan2(dx, dz) : Math.atan2(mx, mz);
      { const fx = d <= z.r + 0.12 ? dx : mx; if (Math.abs(fx) > 0.25) z.face = fx > 0 ? 1 : -1; }
      if (z.boss) {
        z.stompT -= dt;
        if (z.stompT <= 0) {
          z.stompT = 6;
          G.shake = Math.max(G.shake, 0.7); S.roar();
          const sm = z.cfg.summon || 'office', zx2 = zoneX();
          for (let i = 0; i < 6; i++) { let sx = z.x + rand(-4, 4); if (zx2) sx = clamp(sx, zx2[0] + 0.6, zx2[1] - 0.6); spawnZombie(sm, sx, z.z + rand(-4, 4)); }
          FX.text(z.x, 6 * (z.s / 3), z.z, { office: '야근 소환!!', bomber: '회식 소환!!', dancer: '댄스 타임!!', riot: '경비원 호출!!' }[sm] || '소환!!', '#ff6bd0', 22, 1.2);
        }
      }
      if (d > z.r + 0.12) {
        z.atk = false;
        if (z.stun <= 0) { const st2 = Math.min(z.spd * dt, md); z.x += mx / md * st2; z.z += mz / md * st2; }
        if (!z.boss) z.z += drift;
        // 댄서 점프 시작
        if (z.cfg.jumper && d < 5.5 && d > 1.2 && z.stun <= 0) {
          z.jump = { sx: z.x, sz: z.z, tx: rand(-0.9, 0.9), tz: rand(7.5, Math.max(8, L - 0.6)), t: 0, dur: 0.75 };
        }
      } else {
        z.atk = true;
        if (z.type === 'bomber' && !z.popped) { z.popped = true; z.dead = true; bomberBoom(z, true); FX.goo(z.x, z.z, false); continue; }
        if (z.stun <= 0) damageTrain(z.dps * dt);
      }
      if (z.type === 'bomber') z.swell = d < 7 ? (7 - d) / 7 * 0.3 : 0;
      // 지형 제약
      const zx = zoneX();
      if (zx) {
        if (world.theme.deck && !z.boss) {
          if (z.x < zx[0] - 0.3 || z.x > zx[1] + 0.3) { SRC = 'fall'; hit(z, 99999, 'drop', z.x < 0 ? -1 : 1, 0, 0, false); continue; }
        } else z.x = clamp(z.x, zx[0], zx[1]);
      }
      // 열차 안으로 파고들지 않게
      if (Math.abs(z.x) < 1.45 + z.r && z.z > -z.r && z.z < L + z.r) {
        const pushX = (1.45 + z.r) - Math.abs(z.x), pushZf = z.z + z.r, pushZb = L + z.r - z.z;
        const m = Math.min(pushX, pushZf, pushZb);
        if (m === pushX) z.x = Math.sign(z.x || 1) * (1.45 + z.r); else if (m === pushZf) z.z = -z.r; else z.z = L + z.r;
      }
      if (z.z > L + 30 || Math.abs(z.x) > 60 || z.z < -140) { z.dead = true; if (z.boss) { G.boss = null; } }
    }
    // 겹침 방지 (격자 이웃끼리)
    grid.forEach(arr => {
      for (let i = 0; i < arr.length; i++) {
        const a = arr[i]; if (a.dead || a.onTrain || a.jump) continue;
        for (let j = i + 1; j < arr.length; j++) {
          const b = arr[j]; if (b.dead || b.onTrain || b.jump) continue;
          const dx = b.x - a.x, dz = b.z - a.z, rr = a.r + b.r;
          const d2 = dx * dx + dz * dz;
          if (d2 < rr * rr && d2 > 1e-4) {
            const d = Math.sqrt(d2), o = (rr - d) * 0.5, nx = dx / d, nz = dz / d;
            const wa = a.boss ? 0.02 : 1, wb = b.boss ? 0.02 : 1;
            a.x -= nx * o * wa; a.z -= nz * o * wa; b.x += nx * o * wb; b.z += nz * o * wb;
          }
        }
      }
    });
    G.zs = G.zs.filter(z => !z.dead);
  }

  function updCorpses(dt) {
    const S2 = world.speed;
    for (const c of G.corpses) {
      if (c.art) { updArtCorpse(c, dt); continue; }
      c.t += dt;
      c.z += S2 * dt * (c.grounded ? 1 : 0.6);
      c.flash = Math.max(0, c.flash - dt);
      if (c.kind === 'shock') {
        c.stun = 0.4;
        if (c.t > 0.4 && !c.done) { c.done = true; shatter(c, ['#3df2ff', '#ffffff', E.col(c.cfg.colors.skin || '#8fd05a')]); }
        continue;
      }
      if (c.kind === 'burn') {
        c.burn = Math.min(1, c.burn + dt * 2.5);
        c.squash = Math.max(0.05, 1 - Math.max(0, c.t - 0.25) * 1.6);
        if (Math.random() < 0.4) part({ mesh: 'cube', x: c.x + rand(-0.3, 0.3), y: rand(0.3, 1.6) * c.squash * c.s, z: c.z, vy: rand(1, 3), vx: rand(-0.5, 0.5), s: 0.12, s1: 0.02, max: 0.6, col: pick(['#2b2422', '#555', '#ff7b00']), emi: 0.4 });
        if (c.squash <= 0.06) c.done = true;
        continue;
      }
      const HP = Math.PI / 2;
      const zx = zoneX(), offDeck = world.theme.deck && zx && (c.x < zx[0] - 0.2 || c.x > zx[1] + 0.2);
      if (!c.grounded) {
        c.vy -= 32 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.z += c.vz * dt;
        c.tx += c.vtx * dt; c.tz += c.vtz * dt;
        if (c.kind === 'shot' && Math.abs(c.tx) >= HP) { c.tx = Math.sign(c.tx) * HP; c.vtx = 0; }
        if (offDeck || c.kind === 'drop') { if (c.y < -40) c.done = true; continue; }
        if (c.y <= 0) {
          c.y = 0;
          if ((c.kind === 'blast' || c.kind === 'leek') && c.vy < -6) {
            c.vy *= -0.35; c.vx *= 0.5; c.vz *= 0.5; c.vtx *= 0.5; c.vtz *= 0.5;
            if (Math.random() < 0.5) part({ mesh: 'ico', x: c.x, y: 0.3, z: c.z, s: 0.5, s1: 1.4, max: 0.4, col: world.theme.groundCol, alpha: 0.5, pass: 1 });
          } else {
            c.grounded = true; c.vy = 0;
            c.ttx = c.kind === 'shot' ? (c.tx >= 0 ? HP : -HP) : Math.round((c.tx - HP) / Math.PI) * Math.PI + HP;
            c.ttz = Math.round(c.tz / Math.PI) * Math.PI;
          }
        }
      } else {
        c.rest += dt;
        const k = Math.min(1, dt * 9);
        c.tx = lerp(c.tx, c.ttx, k); c.tz = lerp(c.tz, c.ttz, k);
        c.x += c.vx * dt; c.z += c.vz * dt; c.vx *= 0.9; c.vz *= 0.9;
        if (c.rest > (c.boss ? 2.5 : 0.9)) {
          c.y -= dt * 1.4;
          if (Math.random() < 0.12) part({ mesh: 'cube', x: c.x + rand(-0.4, 0.4), y: 0.2, z: c.z + rand(-0.4, 0.4), vy: rand(1, 2.5), s: 0.15, s1: 0.03, max: 0.5, col: '#7bd84a', emi: 0.4 });
          if (c.y < -0.9 * c.s) c.done = true;
        }
      }
      c.lift = 0.2 * c.s * Math.abs(Math.sin(c.tx));
      if (c.z > G.layout.end + 40) c.done = true;
    }
    G.corpses = G.corpses.filter(c => !c.done);
  }
  function shatter(c, cols) {
    const n = lowQ() ? 8 : 16;
    for (let i = 0; i < n; i++) part({ mesh: 'cube', x: c.x + rand(-0.3, 0.3), y: rand(0.3, 1.9) * c.s, z: c.z + rand(-0.3, 0.3), vx: rand(-5, 5), vy: rand(2, 8), vz: rand(-5, 5), g: -28, s: rand(0.15, 0.32), s1: 0.05, max: rand(0.6, 1.1), col: pick(cols), emi: 0.6, bounce: true, vr: rand(-15, 15) });
    FX.spark(c.x, 1.2, c.z, 8, '#bffaff');
  }

  function updOrbs(dt) {
    const S2 = world.speed, L = G.layout.end, m2 = G.magnet;
    for (const o of G.orbs) {
      if (!o.fly) {
        o.vy -= 20 * dt; o.y += o.vy * dt; if (o.y < 0.45) { o.y = 0.45; o.vy = 0; o.vx *= 0.8; o.vz *= 0.8; }
        o.x += o.vx * dt; o.z += o.vz * dt + S2 * dt;
        const h = hullDist(o.x, o.z);
        if (h.d < m2) o.fly = true;
        if (o.z > L + 20) o.lost = true;
      } else {
        const tz = clamp(o.z, 1, L), dx = 0 - o.x, dz = tz - o.z, dy = 2 - o.y, d = Math.hypot(dx, dz, dy) || 0.01;
        const sp = 28 * dt;
        o.x += dx / d * sp; o.z += dz / d * sp; o.y += dy / d * sp;
        if (d < 1.2) { o.got = true; gainXp(o.v); S.pick(); }
      }
    }
    G.orbs = G.orbs.filter(o => !o.got && !o.lost);
  }
  function updParts(dt) {
    updSparts(dt);
    const S2 = world.speed;
    for (const p of G.parts) {
      p.life += dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt + S2 * dt * p.drift;
      p.rot += p.vr * dt;
      if (p.bounce && p.y < p.s / 2) { p.y = p.s / 2; p.vy *= -0.35; p.vx *= 0.6; p.vz *= 0.6; p.vr *= 0.6; }
      if (!p.g) { p.vx *= 0.95; p.vz *= 0.95; p.vy *= 0.97; }
    }
    G.parts = G.parts.filter(p => p.life < p.max);
    for (const d of G.decals) { d.z += S2 * dt; d.a -= dt * 0.12; }
    G.decals = G.decals.filter(d => d.a > 0 && d.z < G.layout.end + 40);
    for (const t of G.ftexts) { t.t += dt; t.y += dt * 1.6; t.z += S2 * dt * 0.5; }
    G.ftexts = G.ftexts.filter(t => t.t < t.max);
  }

  /* ================= 메인 업데이트 ================= */
  function update(rawDt) {
    world.speed = C.game.trainSpeed;
    // 히트스톱 & 슬로모
    if (G.hitstop > 0) { G.hitstop -= rawDt; return; }
    let ts = 1;
    if (G.slowmoT > 0) { G.slowmoT -= rawDt; ts = G.slowmo; }
    const dt = rawDt * ts;
    G.t += dt;
    G.wa += dt * world.speed / 0.45;
    updWorld(dt, world.speed);
    G.shake = Math.max(0, G.shake - rawDt * 2.5);
    G.hurt = Math.max(0, (G.hurt || 0) - rawDt);
    if (G.comboT > 0) { G.comboT -= dt; if (G.comboT <= 0) G.combo = 0; }
    if (G.hornCd > 0) G.hornCd -= dt;
    if (G.shield > 0) G.shield -= dt;
    G.ghostZ = lerp(G.ghostZ, 2 + Math.sin(G.t * 0.4) * 2.5, dt);
    if (G.endT >= 0) {
      G.endT += rawDt;
      if (G.endT > 2.2 && DX.state === 'play') { DX.state = 'result'; if (DX.UI) DX.UI.result(G.outcome); }
    } else updWave(dt);
    if (G.endT < 0) updInvasion(dt);
    updWeather(dt);
    updTimers(dt);
    buildGrid();
    updZombies(dt);
    buildGrid();
    if (G.endT < 0 || G.outcome && G.outcome.win) updWeapons(dt);
    updProjectiles(dt);
    updCorpses(dt);
    updOrbs(dt);
    updParts(dt);
    if (G.pendingLv > 0 && DX.state === 'play' && G.endT < 0) { DX.state = 'levelup'; S.level(); DX.UI.levelUp(buildCards(), G); }
  }

  function endRun(win) {
    if (G.endT >= 0) return;
    DX.mission('kill', G.mKill || 0); G.mKill = 0; DX.mission('combo', G.maxCombo, true);
    if (win) DX.mission('clear');
    DX.track(win ? 'run_clear' : 'run_fail', { stage: G.stageIdx + 1, wave: G.waveIdx + 1, sec: Math.round(G.t), kills: G.kills });
    G.endT = 0;
    const stg = G.stg;
    const out = { win, stageIdx: G.stageIdx, wave: Math.min(G.waveIdx + 1, stg.waves.length), kills: G.kills, maxCombo: G.maxCombo, gold: Math.round(G.gold), level: G.level, canRevive: !win && !G.revived && C.ads.revive, stats: G.stats, t: G.t, final: win && G.stageIdx === C.stages.length - 1 };
    if (win) {
      out.gold += stg.clearGold;
      DX.save.cleared[stg.id] = true;
      collectAllOrbs();
      SRC = 'misc';
      for (const z of G.zs) hit(z, 99999, 'blast', z.x, z.z - 5, 10, false);
      S.win();
      if (DX.UI) DX.UI.banner(C.texts.victory, C.texts.victorySub, 'win');
    } else {
      S.lose(); G.shake = 1.2; vib(200);
      for (let i = 0; i < 4; i++) later(i * 0.18, () => FX.explode(rand(-1.5, 1.5), rand(0, G.layout.end), rand(3, 5), 'fire'));
    }
    const best = DX.save.best[stg.id] || 0;
    if (out.wave > best) { DX.save.best[stg.id] = out.wave; out.newBest = true; }
    G.outcome = out;
  }
  DX.revive = function () {
    if (!G || !G.outcome || G.revived) return;
    G.revived = true; G.endT = -1; G.outcome = null;
    G.hp = G.hpMax * 0.5; G.shield = 4;
    SRC = 'misc';
    for (const z of G.zs) if (Math.abs(hullDist(z.x, z.z).d) < 14) hit(z, 99999, 'blast', z.x, z.z - G.layout.end / 2, 14, false);
    FX.explode(0, G.layout.end / 2, 10, 'leek');
    DX.state = 'play';
    if (DX.UI) DX.UI.banner('부활!', '비상 시동! 다시 달린다!', 'ghost');
  };
  DX.finishRun = function (double) {
    if (!G || !G.outcome) return;
    const o = G.outcome;
    DX.save.gold += Math.round(o.gold * (double ? 2 : 1));
    DX.persist();
    G = null;
    DX.state = 'lobby';
    applyTheme(DX.save.stage || 0);
  };
  DX.quitRun = function () { if (!G) return; G.outcome = G.outcome || { win: false, stageIdx: G.stageIdx, wave: G.waveIdx + 1, kills: G.kills, gold: Math.floor(G.gold * 0.5) }; DX.finishRun(false); };

  /* ================= 렌더 ================= */
  const lobby = { t: 0, cars: ['gun', 'flame', 'tesla'], layout: null };
  function render(dt) {
    E.begin();
    drawWorld();
    let L, cars, layout, st;
    if (G) {
      layout = G.layout;
      st = { t: G.t, cannonYaw: G.cannonYaw, cannonRecoil: G.cannonRecoil, cannonTwin: (G.weapons.cannon || 0) >= 5, ghostZ: G.ghostZ };
      L = layout.end;
    } else {
      lobby.layout = lobby.layout || trainLayout(lobby.cars);
      layout = lobby.layout; L = layout.end;
      st = { t: world.t, cannonYaw: 0, ghostZ: 3 };
    }
    // 열차
    if (SPR.hasTrain()) {
      DECK = TOP_CAR;
      drawTrainArt(layout, st, false);
    } else {
      DECK = 1.35;
      MD.engine(0, C.train.colors, G ? G.wa : world.t * 30, false);
      for (const c of layout.cars) MD.car(c.z0, c.kind, C.train.colors, G ? G.wa : world.t * 30, false, st);
    }
    // 연기
    if (Math.random() < 0.3 && (!G || G.parts.length < 900)) {
      const pp = { mesh: 'ico', x: rand(-0.2, 0.2), y: 4.2, z: 1.9, vx: rand(-0.3, 0.3), vy: rand(2.5, 4), vz: 0, s: 0.4, s1: 1.3, max: 1.0, col: '#7a746e', alpha: 0.3, pass: 1, drift: 0.7 };
      if (G) part(pp); else { lobbyParts.push(Object.assign(pp, { life: 0, g: 0, rot: 0, vr: 0 })); }
    }
    if (!G) {
      // 로비: 생존자 + 연기
      const slots = [[-0.75, DECK, layout.cars[0].cz - 1.4], [0.75, DECK, layout.cars[0].cz + 0.3], [0, DECK, layout.cars[0].cz + 1.9]];
      C.survivors.forEach((sv, i) => { if (sv.art && SPR.has(sv.art)) drawSurvivorSprite(slots[i], Math.PI + 0.6 * (i - 1) + Math.sin(world.t + i) * 0.4, SPR.chars[sv.art], 0, world.t + i, false); else MD.survivor(slots[i][0], slots[i][1], slots[i][2], Math.PI + Math.sin(world.t + i) * 0.6, sv, 'normal', 0, world.t); });
      for (const p of lobbyParts) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt + 8 * dt * p.drift; }
      for (let i = lobbyParts.length - 1; i >= 0; i--) if (lobbyParts[i].life > lobbyParts[i].max) lobbyParts.splice(i, 1);
      drawParts(lobbyParts);
      // 카메라: 천천히 회전
      const a = Math.sin(world.t * 0.25) * 0.35;
      E.cam.pos = [Math.sin(a) * 9, 11, L + 9];
      E.cam.target = [0, 1.0, L * 0.3];
      E.cam.fov = 50;
      E.render();
      return;
    }
    // 생존자
    const ml = G.weapons.mg || 0, n = ml ? C.weapons.mg.shooters[ml - 1] : 0, slots = gunSlots();
    for (let i = 0; i < Math.max(2, n); i++) {
      const sv = C.survivors[i % C.survivors.length];
      if (sv.art && SPR.has(sv.art)) drawSurvivorSprite(slots[i], i < n ? G.aim[i] : Math.PI, SPR.chars[sv.art], G.recoil[i], G.t + i, ml >= 5);
      else MD.survivor(slots[i][0], slots[i][1], slots[i][2], i < n ? G.aim[i] : Math.PI, sv, ml >= 5 ? 'gold' : 'normal', G.recoil[i], G.t);
    }
    // 방어막
    if (G.shield > 0) {
      const a = Math.min(1, G.shield) * (0.16 + Math.sin(G.t * 8) * 0.03);
      T.reset().tr(0, 1.5, L / 2).sc(6.5, 6, L + 5); E.draw('ico', '#5ff3ff', 1, a, 2);
      T.reset().tr(0, 1.5, L / 2).sc(6.6, 6.1, L + 5.1); E.draw('ico', '#bffaff', 1, a * 0.6, 1);
    }
    if (G.hurt > 0) { T.reset().tr(0, 1.8, L / 2).sc(3.2, 2.8, L + 0.4); E.draw('cube', '#ff3030', 1, G.hurt * 1.5, 2); }
    // 데칼
    for (const d of G.decals) { T.reset().tr(d.x, 0.06 + (d.r % 0.05), d.z).ry(d.rot).sc(d.r, 1, d.r * 0.75); E.draw('disc', d.col, 0, Math.min(0.55, d.a), 1); }
    for (const f of G.fires) { T.reset().tr(f.x, 0.08, f.z).sc(f.r * 2); E.draw('disc', '#ff6a00', 1.2, 0.35 * (1 - f.t / f.max), 2); }
    // 좀비
    const lq = lowQ();
    for (const z of G.zs) {
      T.reset().tr(z.x, 0.04, z.z).sc(z.r * 2.6, 1, z.r * 2.6); E.draw('disc', '#000000', 0, 0.28, 1);
      const zc = artOf(z);
      if (zc) drawZSprite(z, zc, false);
      else if (z.boss && !z.giant) MD.boss(z, z.cfg); else { MD.zombie(z, z.cfg, lq && !z.boss); if (z.cfg.crown) MD.crown(z); }
    }
    drawSparts();
    for (const c of G.corpses) { if (c.art) { drawZSprite(c, c.ch, true); continue; } if (c.boss && !c.giant) MD.boss(c, c.cfg); else { MD.zombie(c, c.cfg, true); if (c.cfg.crown) MD.crown(c); } }
    // 투사체
    for (const b of G.bullets) {
      const a = Math.atan2(b.vx, b.vz);
      T.reset().tr(b.x, b.y, b.z).ry(a).sc(b.gold ? 0.2 : 0.14, b.gold ? 0.2 : 0.14, 1.6);
      E.draw('cube', b.ghost ? '#9ff6ff' : b.gold ? '#ffd23d' : '#ffe9a0', 1.8, 1, 2);
    }
    for (const s of G.shells) {
      const p = s.t / s.dur, x = lerp(s.sx, s.tx, p), z = lerp(s.sz, s.tz, p), y = lerp(s.sy, 0.3, p) + Math.sin(Math.PI * p) * 4;
      E.box('ico', x, y, z, 0.45, 0.45, 0.45, 0, '#ffcf6b', 1.5);
    }
    for (const b of G.bombs) E.box('ico', b.x, b.y, b.z, 0.5, 0.6, 0.5, 0, '#222', 0);
    for (const d of G.drones) MD.drone(d.x, d.y, d.z, G.t * 10);
    for (const b of G.barrels) {
      MD.barrel(b.x, b.y, b.z, b.rot, 1.3);
      T.reset().tr(b.x, 0.06, b.z).sc(b.r * 2 * (1 - b.y / 60)); E.draw('ring', '#ff5030', 1.2, 0.6, 2);
    }
    for (const Lk of G.leeks) {
      MD.leek(Lk.x, Lk.y, Lk.z, 7, 0.25, Lk.spin);
      T.reset().tr(Lk.x, 0.06, Lk.z).sc(C.ultimate.radius * 2 * (1 - Lk.y / 60)); E.draw('ring', '#9bff7a', 1.2, 0.7, 2);
    }
    // 번개
    for (const b of G.bolts) {
      const a = 1 - b.t / b.max;
      for (let i = 0; i < b.pts.length - 1; i++) {
        const p0 = b.pts[i], p1 = b.pts[i + 1];
        let px = p0[0], py = p0[1], pz = p0[2];
        const seg = 4;
        for (let k = 1; k <= seg; k++) {
          const f = k / seg;
          const nx = lerp(p0[0], p1[0], f) + (k < seg ? rand(-0.7, 0.7) : 0), ny = lerp(p0[1], p1[1], f) + (k < seg ? rand(-0.5, 0.5) : 0), nz = lerp(p0[2], p1[2], f) + (k < seg ? rand(-0.7, 0.7) : 0);
          beam(px, py, pz, nx, ny, nz, 0.35, '#3df2ff', 1.5, 0.4 * a);
          beam(px, py, pz, nx, ny, nz, 0.12, '#ffffff', 2, a);
          px = nx; py = ny; pz = nz;
        }
      }
    }
    // 경험치 구슬
    for (const o of G.orbs) {
      T.reset().tr(o.x, o.y + Math.sin(G.t * 5 + o.x) * 0.12, o.z).ry(G.t * 3).sc(o.s); E.draw('ico0', '#7dff6b', 1.3);
    }
    drawParts(G.parts);
    // 카메라
    const sh = DX.save.shake === false ? 0 : G.shake * 0.6;
    const cv = C.camera[DX.save.cam] || C.camera.far;
    const k = Math.min(1, dt * 5);
    camCur.back = lerp(camCur.back, L + cv.back + L * cv.backGrow, k);
    camCur.y = lerp(camCur.y, cv.height + L * cv.grow, k);
    camCur.tz = lerp(camCur.tz, L * cv.aim - cv.ahead, k);
    camCur.ty = lerp(camCur.ty, DX.save.cam === 'near' ? 1.5 : 0, k);
    camCur.fov = lerp(camCur.fov, cv.fov, k);
    E.cam.pos = [rand(-sh, sh), camCur.y + rand(-sh, sh), camCur.back];
    E.cam.target = [0, camCur.ty, camCur.tz];
    E.cam.fov = camCur.fov;
    E.render();
  }
  const camCur = { back: 40, y: 24, tz: 0, ty: 0, fov: 50 }; // 카메라 값은 config.js 의 camera 에서 수정
  DX.toggleCam = function () { DX.save.cam = DX.save.cam === 'near' ? 'far' : 'near'; DX.persist(); return C.camera[DX.save.cam].label; };
  const GOLD_TINT = [1.15, 1.0, 0.55, 1];
  function drawSurvivorSprite(slot, aim, ch, recoil, t, gold) {
    const fr = SPR.frames[ch.full]; if (!fr) return;
    const sx = Math.sin(aim), sy = -Math.cos(aim); // 화면 기준 조준 방향 (위 = 앞)
    const left = sx < 0;
    const ang = clamp(Math.atan2(sy, Math.abs(sx)), -0.5, 1.1) * 0.55;
    const rot = left ? -ang : ang;
    const H = ch.height * (1 + (recoil || 0) * 0.05);
    const back = (recoil || 0) * 0.15 * (left ? 1 : -1);
    E.sprite(fr, slot[0] + back, slot[1] + Math.abs(Math.sin(t * 2)) * 0.03, slot[2], H * fr.aspect, H, rot, 0.5, 0, gold ? GOLD_TINT : null, null, left !== (ch.face < 0));
  }
  const lobbyParts = [];
  function drawParts(arr) {
    for (const p of arr) {
      const r = p.life / p.max, s = lerp(p.s, p.s1, r);
      const a = p.pass ? (p.alpha === undefined ? 1 : p.alpha) * (1 - r) : 1;
      if (p.flat) { T.reset().tr(p.x, p.y, p.z).sc(s, 1, s); }
      else if (p.streak) { T.reset().tr(p.x, p.y, p.z).sc(p.sx || s, p.sy || s, p.sz || s); }
      else { T.reset().tr(p.x, p.y, p.z).ry(p.rot).rx(p.rot * 0.7).sc(s); }
      E.draw(p.mesh, p.col, p.emi || 0, a, p.pass || 0);
    }
  }

  /* ================= 루프 ================= */
  let lastT = 0, fpsAcc = 0, fpsN = 0;
  DX.fps = 60;
  function frame(ts) {
    const dt = Math.min(0.05, (ts - lastT) / 1000 || 0.016);
    lastT = ts;
    fpsAcc += dt; fpsN++;
    if (fpsAcc > 1) { DX.fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; }
    try {
      if (G && DX.state === 'play') update(dt);
      else if (!G) { world.speed = 8; updWorld(dt, 8); }
      render(dt);
      DX.perf(dt);
      if (DX.Music) DX.Music.play(DX.state === 'lobby' || !G ? 'lobby' : (DX.state === 'result' ? '' : 'battle'));
      if (DX.UI) DX.UI.frame(G, dt);
    } catch (e) { console.error(e); DX.track('draw_error', { m: String(e && e.message || e).slice(0, 80) }); if (DX.UI && DX.UI.error) DX.UI.error(e); }
    requestAnimationFrame(frame);
  }

  DX.onAppHide = function () { if (DX.state === 'play' && DX.UI) DX.UI.pauseGame(); if (DX.Music) { DX.Music.hidden = true; DX.Music.stop(); } DX.persist(); DX.track('app_hide', { state: DX.state }); };
  DX.onAppShow = function () { if (DX.Music) DX.Music.hidden = false; };
  DX.boot = function () {
    const ok = E.init(document.getElementById('gl'));
    if (!ok) return false;
    E.dprCap = lowQ() ? 1.25 : 2;
    applyTheme(DX.save.stage || 0);
    DX.loadP = DX.SPR ? DX.SPR.load().catch(e => { console.warn(e); return false; }) : Promise.resolve(false);
    requestAnimationFrame(frame);
    return true;
  };
  DX.setQuality = function (q) { DX.save.quality = q; E.dprCap = q === 'low' ? 1.25 : 2; DX.persist(); buildProps(world.theme); };
  DX.previewStage = function (i) { DX.save.stage = i; DX.persist(); if (!G) applyTheme(i); };
  DX._dbg = { inv: () => G && startInvasion(), end: w => endRun(w), boss: k => { G.wave = Object.assign({}, G.wave, { boss: k }); spawnBoss(); }, spawn: (t, x, z) => spawnZombie(t, x, z) };
  DX._world = world;
  DX._update = update;
  DX._render = render;
})(window.DX);
