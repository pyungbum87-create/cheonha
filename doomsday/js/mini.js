/* ==========================================================================
   mini.js — 웨이브 사이 미니게임 3종 (옆에서 보는 2D, 이미 있는 그림만 사용)
     parcel : 택배 쳐내기   — 택배 좀비가 던지는 상자를 타이밍 맞춰 탭 → 되받아치기 (민호 프라이팬)
     golf   : 골프공 받아치기 — 사장님 골프공을 리듬에 맞춰 탭 (소피 노트북). 아래 박자 줄을 보고 탭
     rescue : 휴게소 시민 구출 — 잭이 달리며 탭 = 점프로 좀비를 넘고, 시민에 닿으면 업고 구출
   배치·보상은 config.js 의 minigame 항목에서 수정
   ========================================================================== */
window.DX = window.DX || {};
(function (DX) {
  'use strict';
  const M = DX.MINI = {};
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const FONT = "'Black Han Sans', 'Noto Sans SC', sans-serif";
  const MINI_SPEED = 0.85;   // 미니게임 전체 속도 (낮을수록 느림)
  const L = (ko, zh) => (DX.L ? DX.L(ko, zh) : ko);
  let cv, g, st = null, raf = 0, last = 0, st0kind = '';

  const TITLE = () => ({
    parcel: [L('📦 택배 쳐내기!', '📦 击飞快递！'), L('상자가 원에 닿을 때 탭!', '箱子碰到圆圈时点击！')],
    golf: [L('⛳ 사장님 골프공 받아치기!', '⛳ 反击老板的高尔夫球！'), L('아래 박자 줄에 맞춰 탭!', '跟着下方节拍点击！')],
    rescue: [L('🏃 시민 구출 작전!', '🏃 市民营救行动！'), L('탭 = 점프 · 시민에게 닿으면 구출', '点击=跳跃 · 碰到市民即可营救')],
    boiler: [L('🔥 보일러를 살려라!', '🔥 救活锅炉！'), L('바늘이 초록 칸에 올 때 탭!', '指针进入绿色区域时点击！')],
    hack: [L('💻 문 암호 해킹!', '💻 破解门锁密码！'), L('바늘이 초록 칸에 올 때 탭!', '指针进入绿色区域时点击！')],
    sniper: [L('🎯 옥상 엄호 저격!', '🎯 屋顶掩护狙击！'), L('사람들에게 다가가는 좀비를 탭!', '点击接近市民的僵尸！')],
    gates: [L('🚂 운명의 갈림길!', '🚂 命运岔路！'), L('좌우로 끌어서 좋은 문을 통과! 숫자를 키워 보스를 이겨라', '左右拖动穿过好门！把数字变大打败首领')],
  });
  // 필요한 그림 (assets 경로). 없으면 코드 도형으로 대신 그림
  const CH = n => 'assets/chars/' + n + '.png';
  function need(kind, bgUrl) {
    const n = { bg: bgUrl };
    if (kind === 'parcel') {
      ['attack_0', 'attack_1', 'attack_2', 'defend_1', 'cheer_0'].forEach(k => n['h_' + k] = CH('minho/side_' + k));
      ['w0', 'w1', 'w2', 'w3', 'a0', 'a1', 'a2', 'a3'].forEach(k => n['z_' + k] = CH('anim/box_' + k));
      n.crate = 'assets/fx/crate.png';
    } else if (kind === 'golf') {
      ['attack_0', 'attack_1', 'attack_2', 'defend_1', 'cheer_0'].forEach(k => n['h_' + k] = CH('sophie/side_' + k));
      ['a0', 'a1', 'a2'].forEach(k => n['z_' + k] = CH('anim/ceo_' + k));
    } else if (kind === 'boiler') {
      n.train = 'assets/train/train_engine_side.png';
      ['w0', 'w1', 'w2', 'w3'].forEach(k => n['z_' + k] = CH('anim/office_' + k));
      n.h0 = CH('jack/side_defend_0'); n.h1 = CH('jack/side_cheer_0'); n.s0 = CH('sophie/side_attack_0'); n.s1 = CH('sophie/side_cheer_0');
    } else if (kind === 'gates') {
      n.bg = null; n.train = 'assets/train/train_engine_top.png'; n.car = 'assets/train/car_gun_top.png';
      ['w0', 'w1', 'w2', 'w3'].forEach(k => n['z_' + k] = CH('anim/office_' + k));
      n.boss = CH('anim/bujang_a0');
    } else if (kind === 'sniper') {
      ['w0', 'w1', 'w2', 'w3', 'a2', 'a3'].forEach(k => n['z_' + k] = CH('anim/office_' + k));
      for (const c of ['man', 'woman', 'clerk']) { n['c_' + c + '0'] = 'assets/npc/citizen_' + c + '_0.png'; n['c_' + c + '3'] = 'assets/npc/citizen_' + c + '_3.png'; }
      n.h0 = CH('minho/side_attack_0'); n.h1 = CH('minho/side_attack_2'); n.h2 = CH('minho/side_cheer_0');
    } else {
      [0, 1, 2, 3].forEach(i => { n['run' + i] = CH('jack/side_run_' + i); });
      [1, 2].forEach(i => { n['carry' + i] = CH('jack/side_carry_' + i); });
      n.hurt = CH('jack/side_defend_1'); n.cheer = CH('jack/side_cheer_1');
      ['w0', 'w1', 'w2', 'w3'].forEach(k => n['z_' + k] = CH('anim/office_' + k));
      for (const c of ['man', 'woman', 'clerk', 'cleaner']) { n['c_' + c + '0'] = 'assets/npc/citizen_' + c + '_0.png'; n['c_' + c + '3'] = 'assets/npc/citizen_' + c + '_3.png'; }
      [1, 2].forEach(i => { n['dog' + i] = 'assets/npc/dog_' + i + '.png'; });
    }
    return n;
  }
  async function loadAll(n) {
    const out = {}, SPR = DX.SPR;
    await Promise.all(Object.keys(n).map(async k => {
      if (!n[k] || !SPR.cut) return;
      const isBg = k === 'bg', isFx = k === 'crate' || k === 'train' || k === 'car';
      out[k] = await (isFx ? SPR.cut(n[k], k === 'train' ? 260 : 120, false) : SPR.cut(n[k], isBg ? 0 : 300, isBg));
    }));
    return out;
  }

  /* ---------------- 시작 / 종료 ---------------- */
  const queue = [];
  M.start = async function (kind, opt, done) {
    if (st) { queue.push([kind, opt, done]); return; }   // 앞 미니게임이 끝난 뒤 시작 (화면 겹침 방지)
    opt = opt || {};
    cv = document.getElementById('miniCv'); g = cv.getContext('2d');
    const sec = document.getElementById('mini');
    sec.classList.remove('hidden');
    if (kind === 'boiler' && opt.hack) st0kind = 'hack'; else st0kind = kind;
    st = { kind, tk: st0kind, done, opt, t: 0, phase: 'load', phaseT: 0, img: {}, score: 0, max: 1, combo: 0, maxCombo: 0, hp: 3, texts: [], parts: [], shake: 0, flash: 0, result: null };
    drawLoading();
    let bgUrl = kind === 'gates' ? null : (opt.bg || 'assets/story/ch2_side.jpg');
    if (bgUrl && opt.bgNew && DX.SPR.probe && await DX.SPR.probe(opt.bgNew)) { bgUrl = opt.bgNew; opt.tint = null; }   // 새 옆 배경 그림이 있으면 그걸로
    const img = await loadAll(need(kind, bgUrl));
    if (!st) return;
    st.img = img; st.phase = 'intro'; st.phaseT = opt.line ? 3.2 : 2.6;
    SETUP[kind](st);
    last = performance.now();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    DX.track && DX.track('minigame', { kind });
  };
  function finish() {
    if (st.phase === 'end') return;
    const rate = clamp(st.score / st.max, 0, 1);
    const grade = rate >= 0.9 ? 'S' : rate >= 0.7 ? 'A' : rate >= 0.45 ? 'B' : 'C';
    st.phase = 'end'; st.phaseT = 3.2; st.result = { kind: st.kind, rate, grade, score: st.score, max: st.max, maxCombo: st.maxCombo, saved: st.saved || 0, dogs: st.dogs || 0 };
    if (rate >= 0.45 && DX.S) DX.S.win(); else if (DX.S) DX.S.lose();
  }
  function close() {
    cancelAnimationFrame(raf);
    document.getElementById('mini').classList.add('hidden');
    const r = st.result, d = st.done; st = null;
    if (d) d(r);
    if (queue.length) { const q = queue.shift(); setTimeout(() => M.start(q[0], q[1], q[2]), 300); }
  }
  function loop(ts) {
    if (!st) return;
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016) * MINI_SPEED; last = ts;
    if (st.phase !== 'load') try { update(dt); if (st) draw(); } catch (e) { console.error(e); }
    if (st) raf = requestAnimationFrame(loop);
  }
  function update(dt) {
    st.shake = Math.max(0, st.shake - dt * 30); st.flash = Math.max(0, st.flash - dt);
    for (const t of st.texts) t.t += dt; st.texts = st.texts.filter(t => t.t < t.max);
    for (const p of st.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 900) * dt; p.r += (p.vr || 0) * dt; }
    st.parts = st.parts.filter(p => p.t < p.max);
    if (st.phase === 'intro') { st.phaseT -= dt; if (st.phaseT <= 0) st.phase = 'play'; return; }
    if (st.phase === 'end') { st.phaseT -= dt; if (st.phaseT <= 0) close(); return; }
    if (st.phase !== 'play') return;
    st.t += dt;
    UPD[st.kind](st, dt);
  }
  function down(x, y) {
    if (!st) return;
    if (st.phase === 'end' && st.phaseT < 2.0) { close(); return; }
    if (st.phase !== 'play') return;
    TAP[st.kind](st, x, y);
  }
  M.down = down;
  M.move = function (x) { if (st && st.phase === 'play' && MOVE[st.kind]) MOVE[st.kind](st, x); };
  M.active = () => !!st;
  M._step = function (n, dt, auto) { for (let i = 0; i < n && st && st.phase !== 'load'; i++) { update(dt || 1 / 30); if (auto && st && st.phase === 'play' && auto(st)) down(1, 1); } if (st && st.phase !== 'load') draw(); };
  M._st = () => st;

  /* ---------------- 공통 그리기 ---------------- */
  function size() {
    const d = Math.min(window.devicePixelRatio || 1, 2);
    const w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * d) || cv.height !== Math.round(h * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
    g.setTransform(d, 0, 0, d, 0, 0);
    // 무대: 가운데 띠 (세로 화면에서도 가로 무대). 바닥선 = floor
    const tall = st && st.kind === 'gates', sh = tall ? h * 0.8 : Math.min(h * 0.6, w * 1.0), sy = tall ? h * 0.13 : h * 0.46 - sh / 2;
    return { w, h, sy, sh, floor: sy + sh * 0.86, unit: tall ? Math.min(sh, w * 1.3) / 100 : sh / 100 };
  }
  function drawLoading() {
    const Z = size();
    g.clearRect(0, 0, Z.w, Z.h); g.fillStyle = '#05070c'; g.fillRect(0, 0, Z.w, Z.h);
    txt(L('준비 중...', '准备中...'), Z.w / 2, Z.h / 2, 26, '#fff');
  }
  function txt(s, x, y, sz, col, al, stroke) {
    g.font = sz + 'px ' + FONT; g.textAlign = al || 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    g.lineWidth = Math.max(3, sz / 5); g.strokeStyle = stroke || '#11131a'; g.strokeText(s, x, y);
    g.fillStyle = col || '#fff'; g.fillText(s, x, y);
  }
  // 그림 그리기: 발밑 기준(x, y), 높이 h, flip = 좌우반전
  function pose(im, x, y, h, flip, rot, alpha, flash) {
    if (!im) return;
    const w = h * im.width / im.height;
    g.save(); g.translate(x, y); if (rot) g.rotate(rot); if (flip) g.scale(-1, 1);
    g.globalAlpha = alpha == null ? 1 : alpha;
    g.drawImage(im, -w / 2, -h, w, h);
    if (flash > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, flash * 6); g.drawImage(im, -w / 2, -h, w, h); }
    g.restore();
  }
  // 배경: 무대 띠를 꽉 채움 (scroll = 가로 이동, 좌우 뒤집어 이어 붙임)
  function drawBg(Z, scroll, dark) {
    g.fillStyle = '#07090f'; g.fillRect(0, 0, Z.w, Z.h);
    const bg = st.img.bg;
    if (bg) {
      const bh = Z.sh, bw = bh * bg.width / bg.height;
      let x0 = -(((scroll || 0) + Math.max(0, (bw - Z.w) / 2)) % (bw * 2)); if (x0 > 0) x0 -= bw * 2;
      for (let x = x0, i = 0; x < Z.w; x += bw, i++) {
        g.save(); g.translate(x + (i % 2 ? bw : 0), Z.sy); if (i % 2) g.scale(-1, 1); g.drawImage(bg, 0, 0, bw, bh); g.restore();
      }
      if (st.opt.tint) { g.fillStyle = st.opt.tint; g.fillRect(0, Z.sy, Z.w, Z.sh); }
    } else { const gr = g.createLinearGradient(0, Z.sy, 0, Z.sy + Z.sh); gr.addColorStop(0, '#ff9a6a'); gr.addColorStop(1, '#5a3a2a'); g.fillStyle = gr; g.fillRect(0, Z.sy, Z.w, Z.sh); }
    if (dark) { g.fillStyle = 'rgba(0,0,0,' + dark + ')'; g.fillRect(0, Z.sy, Z.w, Z.sh); }
    // 위아래 검은 띠 + 테두리
    g.fillStyle = 'rgba(5,7,12,0.94)'; g.fillRect(0, 0, Z.w, Z.sy); g.fillRect(0, Z.sy + Z.sh, Z.w, Z.h - Z.sy - Z.sh);
    g.fillStyle = '#ffd34a'; g.fillRect(0, Z.sy - 3, Z.w, 3); g.fillRect(0, Z.sy + Z.sh, Z.w, 3);
  }
  function popText(s, x, y, col, sz, max) { st.texts.push({ s, x, y, col: col || '#fff', sz: sz || 30, t: 0, max: max || 0.9 }); }
  function burst(x, y, col, n, sp) { for (let i = 0; i < (n || 10); i++) { const a = rand(0, 6.28), v = rand(120, sp || 420); st.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, t: 0, max: rand(0.4, 0.8), s: rand(3, 7), col: col || '#ffd34a', r: 0 }); } }
  function drawCommon(Z) {
    for (const p of st.parts) {
      g.globalAlpha = clamp(1 - p.t / p.max, 0, 1);
      if (p.img) { g.save(); g.translate(p.x, p.y); g.rotate(p.r); const w = p.s * p.img.width / p.img.height; g.drawImage(p.img, -w / 2, -p.s / 2, w, p.s); g.restore(); }
      else { g.fillStyle = p.col; g.beginPath(); g.arc(p.x, p.y, p.s, 0, 6.28); g.fill(); }
    }
    g.globalAlpha = 1;
    for (const t of st.texts) {
      const r = t.t / t.max, sc = r < 0.15 ? 0.6 + r / 0.15 * 0.6 : 1.2 - Math.min(0.2, r - 0.15);
      g.globalAlpha = clamp((1 - r) * 2.5, 0, 1); txt(t.s, t.x, t.y - r * 30, Math.round(t.sz * sc), t.col); g.globalAlpha = 1;
    }
    // 위쪽 정보: 제목 · 점수 · 하트
    const tt = TITLE()[st.tk || st.kind];
    txt(tt[0], Z.w / 2, Math.max(28, Z.sy * 0.32), Math.min(30, Z.w / 13), '#ffd34a');
    txt(st.scoreLabel ? st.scoreLabel() : (st.score + ' / ' + st.max), Z.w / 2, Math.max(60, Z.sy * 0.7), 22, '#fff');
    if (st.hearts) { let s = ''; for (let i = 0; i < 3; i++) s += i < st.hp ? '❤️' : '🖤'; g.font = '20px sans-serif'; g.textAlign = 'right'; g.fillText(s, Z.w - 12, Math.max(60, Z.sy * 0.7)); }
    if (st.combo >= 3) txt(st.combo + ' COMBO', 14, Math.max(60, Z.sy * 0.7), 20, '#5fe1ff', 'left');
    if (st.flash > 0) { g.fillStyle = 'rgba(255,60,60,' + st.flash * 0.6 + ')'; g.fillRect(0, 0, Z.w, Z.h); }
    if (st.phase === 'intro') {
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, 0, Z.w, Z.h);
      const a = 1 - Math.max(0, st.phaseT - 1.3) / 0.3;
      g.globalAlpha = clamp(a, 0, 1);
      if (st.opt.line) txt(st.opt.line, Z.w / 2, Z.h * 0.42 - 54, Math.min(20, Z.w / 19), '#ff9a6a');
      txt(tt[0], Z.w / 2, Z.h * 0.42, Math.min(40, Z.w / 10), '#ffd34a');
      txt(tt[1], Z.w / 2, Z.h * 0.42 + 46, Math.min(22, Z.w / 18), '#fff');
      g.globalAlpha = 1;
    } else if (st.phase === 'play' && st.t < 6) txt(tt[1], Z.w / 2, Z.sy + Z.sh + Math.min(60, (Z.h - Z.sy - Z.sh) * 0.3), 18, '#cfe8ff');
    if (st.phase === 'end') {
      const r = st.result;
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 0, Z.w, Z.h);
      txt(r.grade, Z.w / 2, Z.h * 0.38, 96, { S: '#ffd34a', A: '#7dff8a', B: '#5fe1ff', C: '#ff8a8a' }[r.grade]);
      txt(r.rate >= 0.45 ? (st.opt.op ? L('구조 성공!!', '营救成功！！') : L('성공!!', '成功！！')) : L('아쉽다...', '可惜...'), Z.w / 2, Z.h * 0.38 + 76, 30, '#fff');
      if (st.phaseT < 2.0) txt(L('터치해서 계속', '点击继续'), Z.w / 2, Z.h * 0.38 + 124, 16, '#cfe8ff');
    }
  }
  function draw() {
    const Z = size();
    g.clearRect(0, 0, Z.w, Z.h);
    g.save();
    if (st.shake > 0 && (!DX.save || DX.save.shake !== false)) g.translate(rand(-st.shake, st.shake), rand(-st.shake, st.shake));
    DRAW[st.kind](st, Z);
    g.restore();
    drawCommon(Z);
  }

  const SETUP = {}, UPD = {}, TAP = {}, DRAW = {}, MOVE = {};

  /* ================= 1) 택배 쳐내기 =================
     상자는 포물선으로 날아와 T초에 민호 앞 '타격 원'에 도착. 원 근처에서 탭하면 되받아침 */
  const PARCEL_N = 16;
  SETUP.parcel = s => {
    s.hearts = true; s.max = PARCEL_N; s.hitN = 0; s.scoreLabel = () => '📦 ' + s.hitN + ' / ' + PARCEL_N; s.thrown = 0; s.next = 0.8; s.crates = []; s.swing = 0; s.hurt = 0; s.zAct = null; s.zT = 0; s.zHurt = 0;
  };
  function parcelPos(Z) { return { hx: Z.w * 0.2, zx: Z.w * 0.78, hitX: Z.w * 0.22 + Z.unit * 14, hitY: Z.floor - Z.unit * 34 }; }
  UPD.parcel = (s, dt) => {
    const Z = size(), P = parcelPos(Z);
    s.swing = Math.max(0, s.swing - dt); s.hurt = Math.max(0, s.hurt - dt); s.zHurt = Math.max(0, s.zHurt - dt);
    if (s.zAct) { s.zT += dt; if (s.zT > 0.75) s.zAct = null; }
    // 던지기 예약: 준비 동작(0.45초) → 던짐
    if (s.thrown < PARCEL_N) {
      s.next -= dt;
      if (s.next <= 0) {
        s.thrown++; s.zAct = 'throw'; s.zT = 0;
        const lvl = s.thrown / PARCEL_N, fly = rand(1.35, 1.6) - lvl * 0.5;
        const gold = Math.random() < 0.18;
        s.crates.push({ t: -0.45, T: fly, gold, st: 'fly', x: P.zx, y: Z.floor - Z.unit * 50, rot: 0 });
        s.next = rand(1.5, 2.0) - lvl * 0.6 + (Math.random() < 0.25 ? -0.5 : 0);   // 가끔 연속 투척
      }
    }
    for (const c of s.crates) {
      c.t += dt;
      if (c.st === 'fly') {
        if (c.t < 0) continue;
        const k = c.t / c.T, sx = P.zx - Z.unit * 10, sy = Z.floor - Z.unit * 55;
        c.x = sx + (P.hitX - sx) * k; c.y = sy + (P.hitY - sy) * k - Math.sin(Math.min(1, k) * Math.PI) * Z.unit * 38; c.rot += dt * 8;
        if (c.t > c.T + 0.14) {   // 못 쳐냄 → 맞음
          c.st = 'gone'; s.hp--; s.combo = 0; s.hurt = 0.5; s.shake = 10; s.flash = 0.35;
          popText(L('아야!', '哎呀！'), P.hx, Z.floor - Z.unit * 70, '#ff6a6a', 30); DX.S && DX.S.boom(false);
          burst(P.hitX, P.hitY, '#b5874f', 12);
          if (s.hp <= 0) { finish(); return; }
        }
      } else if (c.st === 'back') {
        c.bt += dt; const k = c.bt / 0.38;
        c.x = c.bx + (P.zx - c.bx) * k; c.y = c.by + (Z.floor - Z.unit * 45 - c.by) * k - Math.sin(Math.min(1, k) * Math.PI) * Z.unit * 16; c.rot -= dt * 18;
        if (k >= 1) { c.st = 'gone'; s.zHurt = 0.45; s.zAct = null; s.shake = 6; burst(P.zx, Z.floor - Z.unit * 45, '#ffd34a', 16); DX.S && DX.S.boom(false); popText(c.gold ? L('착불 반송!!', '到付退回！！') : L('반송!', '退回！'), P.zx, Z.floor - Z.unit * 80, c.gold ? '#ffd34a' : '#fff', c.gold ? 34 : 28); }
      }
    }
    s.crates = s.crates.filter(c => c.st !== 'gone');
    if (s.thrown >= PARCEL_N && !s.crates.length) finish();
  };
  TAP.parcel = (s) => {
    const Z = size(), P = parcelPos(Z);
    if (s.swing > 0.12) return;
    s.swing = 0.32;
    // 가장 가까이 온 상자
    let best = null, bd = 1e9;
    for (const c of s.crates) if (c.st === 'fly' && c.t > 0) { const d = Math.abs(c.t - c.T); if (d < bd) { bd = d; best = c; } }
    if (best && bd < 0.16) {
      const perfect = bd < 0.06;
      best.st = 'back'; best.bt = 0; best.bx = best.x; best.by = best.y;
      s.score += perfect ? 1 : 0.75; s.hitN++; s.combo++; s.maxCombo = Math.max(s.maxCombo, s.combo);
      if (best.gold) s.bonus = (s.bonus || 0) + 1;
      popText(perfect ? 'PERFECT!' : 'GOOD!', P.hitX, P.hitY - Z.unit * 22, perfect ? '#ffd34a' : '#7dff8a', perfect ? 32 : 26);
      burst(best.x, best.y, '#fff', 10); s.shake = 4; DX.S && DX.S.kill();
    } else { DX.S && DX.S.click(); }
  };
  DRAW.parcel = (s, Z) => {
    drawBg(Z, 0, 0.15);
    const P = parcelPos(Z), I = s.img, U = Z.unit;
    // 그림자
    g.fillStyle = 'rgba(0,0,0,0.35)';
    for (const x of [P.hx, P.zx]) { g.beginPath(); g.ellipse(x, Z.floor, U * 16, U * 3.5, 0, 0, 6.28); g.fill(); }
    // 택배 좀비
    let zi = I['z_w' + (Math.floor(s.t * 5) % 4)];
    if (s.zHurt > 0) zi = I.z_a2 || zi;
    else if (s.zAct === 'throw') zi = (s.zT < 0.45 ? I.z_a0 : I.z_a1) || zi;
    if (s.phase === 'end' && s.result && s.result.rate >= 0.45) zi = I.z_a3 || zi;
    pose(zi, P.zx + (s.zHurt > 0 ? U * 4 : 0), Z.floor, U * 52, false, 0, 1, s.zHurt);
    // 타격 원 (상자가 다가오면 줄어드는 원)
    let near = null; for (const c of s.crates) if (c.st === 'fly' && c.t > 0 && (!near || c.T - c.t < near.T - near.t)) near = c;
    g.lineWidth = 4; g.strokeStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.arc(P.hitX, P.hitY, U * 9, 0, 6.28); g.stroke();
    if (near) { const r = U * 9 * (1 + Math.max(0, near.T - near.t) * 2.2), ok = Math.abs(near.T - near.t) < 0.16; g.strokeStyle = ok ? '#7dff8a' : '#ffd34a'; g.lineWidth = 3; g.beginPath(); g.arc(P.hitX, P.hitY, r, 0, 6.28); g.stroke(); }
    // 민호
    let hi = I.h_attack_0;
    if (s.hurt > 0) hi = I.h_defend_1 || hi; else if (s.swing > 0.2) hi = I.h_attack_1 || hi; else if (s.swing > 0) hi = I.h_attack_2 || hi;
    if (s.phase === 'end' && s.result && s.result.rate >= 0.45) hi = I.h_cheer_0 || hi;
    pose(hi, P.hx, Z.floor, U * 50, false, 0, 1, 0);
    // 상자
    for (const c of s.crates) {
      if (c.t < 0) continue;
      const sz = U * 13;
      g.save(); g.translate(c.x, c.y); g.rotate(c.rot);
      if (I.crate) g.drawImage(I.crate, -sz / 2, -sz / 2, sz, sz); else { g.fillStyle = '#b5874f'; g.fillRect(-sz / 2, -sz / 2, sz, sz); }
      if (c.gold) { g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,200,40,0.45)'; g.fillRect(-sz / 2, -sz / 2, sz, sz); }
      g.restore();
    }
  };

  /* ================= 2) 골프공 받아치기 (리듬) =================
     박자표(beat): 정해진 리듬으로 공이 날아옴. 아래 박자 줄의 동그라미가 선에 닿을 때 탭 */
  const GOLF_PATTERNS = [[0, 1, 2, 3], [0, 1, 1.5, 2, 3], [0, 0.5, 1, 2, 2.5, 3], [0, 1, 2, 2.5, 3, 3.5], [0, 0.75, 1.5, 2, 3], [0, 0.5, 1, 1.5, 2, 3]];
  SETUP.golf = s => {
    const bpm = 84, beat = 60 / bpm;
    s.beat = beat; s.notes = []; let t = 2.2;
    const bars = [0, 1, 2, 3, 4, 5, 6].map(i => GOLF_PATTERNS[Math.min(GOLF_PATTERNS.length - 1, Math.floor(i * 1.3 + Math.random() * 1.5))]);
    for (const b of bars) { for (const k of b) s.notes.push({ at: t + k * beat, st: 'wait' }); t += 4 * beat; }
    s.max = s.notes.length; s.fly = 1.0; s.swing = 0; s.hurt = 0; s.zHurt = 0; s.end = t + 0.6; s.balls = [];
    s.scoreLabel = () => Math.round(s.score / s.max * 100) + '%';
  };
  function golfPos(Z) { return { hx: Z.w * 0.19, zx: Z.w * 0.8, hitX: Z.w * 0.19 + Z.unit * 13, hitY: Z.floor - Z.unit * 30 }; }
  UPD.golf = (s, dt) => {
    s.swing = Math.max(0, s.swing - dt); s.hurt = Math.max(0, s.hurt - dt); s.zHurt = Math.max(0, s.zHurt - dt);
    // 박자 소리 (메트로놈)
    const bi = Math.floor((s.t - 2.2) / s.beat); if (bi >= 0 && bi !== s.lastBeat && s.t < s.end - 0.6) { s.lastBeat = bi; if (DX.S && DX.S.pick) DX.S.pick(); }
    for (const n of s.notes) if (n.st === 'wait' && s.t > n.at + 0.15) {
      n.st = 'miss'; s.combo = 0; s.hurt = 0.35; s.shake = 6;
      const Z = size(), P = golfPos(Z); popText('MISS', P.hitX, P.hitY - Z.unit * 26, '#ff6a6a', 24, 0.6);
    }
    for (const b of s.balls) { b.t += dt; }
    s.balls = s.balls.filter(b => b.t < 0.5);
    if (s.t > s.end) finish();
  };
  TAP.golf = (s) => {
    const Z = size(), P = golfPos(Z);
    if (s.swing > 0.1) return;
    s.swing = 0.25;
    let best = null, bd = 1e9;
    for (const n of s.notes) if (n.st === 'wait') { const d = Math.abs(s.t - n.at); if (d < bd) { bd = d; best = n; } }
    if (best && bd < 0.15) {
      const perfect = bd < 0.06;
      best.st = 'hit'; s.score += perfect ? 1 : 0.6; s.combo++; s.maxCombo = Math.max(s.maxCombo, s.combo);
      s.balls.push({ t: 0, x: P.hitX, y: P.hitY, perfect });
      popText(perfect ? 'PERFECT!' : 'GOOD', P.hitX, P.hitY - Z.unit * 26, perfect ? '#ffd34a' : '#7dff8a', perfect ? 30 : 24, 0.6);
      burst(P.hitX, P.hitY, perfect ? '#c58aff' : '#fff', 8); DX.S && DX.S.kill();
    } else DX.S && DX.S.click();
  };
  DRAW.golf = (s, Z) => {
    drawBg(Z, 0, 0.3);
    const P = golfPos(Z), I = s.img, U = Z.unit;
    g.fillStyle = 'rgba(0,0,0,0.35)';
    for (const x of [P.hx, P.zx]) { g.beginPath(); g.ellipse(x, Z.floor, U * 16, U * 3.5, 0, 0, 6.28); g.fill(); }
    // 사장님: 공을 칠 순간에 스윙
    let swingNow = false;
    for (const n of s.notes) { const k = s.t - (n.at - s.fly); if (k > -0.12 && k < 0.18) swingNow = true; }
    const near = s.notes.some(n => n.st === 'wait' && n.at - s.fly - s.t > 0 && n.at - s.fly - s.t < 0.3);
    let zi = s.zHurt > 0 ? I.z_a2 : swingNow ? I.z_a1 : near ? I.z_a0 : I.z_a0;
    pose(zi, P.zx, Z.floor + Math.sin(s.t * 4) * 1.5, U * 54, false, 0, 1, s.zHurt);
    // 날아오는 공 (낮은 포물선)
    for (const n of s.notes) {
      if (n.st !== 'wait') continue;
      const k = 1 - (n.at - s.t) / s.fly; if (k < 0 || k > 1.15) continue;
      const sx = P.zx - U * 18, sy = Z.floor - U * 18;
      const x = sx + (P.hitX - sx) * k, y = sy + (P.hitY - sy) * k - Math.sin(Math.min(1, k) * Math.PI) * U * 22;
      g.fillStyle = '#fff'; g.strokeStyle = '#333'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, U * 2.6, 0, 6.28); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.arc(x + U * 3, y + U * 0.5, U * 2, 0, 6.28); g.fill();
    }
    // 되받아친 공 → 사장님에게 꽂힘
    for (const b of s.balls) {
      const k = b.t / 0.5, x = b.x + (P.zx - b.x) * k, y = b.y + (Z.floor - U * 50 - b.y) * k;
      g.strokeStyle = b.perfect ? '#c58aff' : '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - U * 8, y + U * 1); g.lineTo(x, y); g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, U * 2.6, 0, 6.28); g.fill();
      if (k > 0.95 && !b.hitDone) { b.hitDone = true; s.zHurt = 0.25; }
    }
    // 소피
    let hi = I.h_attack_0;
    if (s.hurt > 0) hi = I.h_defend_1 || hi; else if (s.swing > 0.15) hi = I.h_attack_1 || hi; else if (s.swing > 0) hi = I.h_attack_2 || hi;
    if (s.phase === 'end' && s.result && s.result.rate >= 0.45) hi = I.h_cheer_0 || hi;
    pose(hi, P.hx, Z.floor, U * 48, false, 0, 1, 0);
    // 박자 줄 (무대 아래)
    const by = Z.sy + Z.sh + Math.min(70, (Z.h - Z.sy - Z.sh) * 0.45), lx = Z.w * 0.18, spd = Z.w * 0.3;
    g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, by - 22, Z.w, 44);
    g.strokeStyle = '#ffd34a'; g.lineWidth = 4; g.beginPath(); g.moveTo(lx, by - 24); g.lineTo(lx, by + 24); g.stroke();
    for (const n of s.notes) {
      const x = lx + (n.at - s.t) * spd; if (x < -20 || x > Z.w + 20) continue;
      g.globalAlpha = n.st === 'wait' ? 1 : 0.25;
      g.fillStyle = n.st === 'hit' ? '#7dff8a' : n.st === 'miss' ? '#ff6a6a' : '#fff';
      g.beginPath(); g.arc(x, by, 13, 0, 6.28); g.fill(); g.strokeStyle = '#333'; g.lineWidth = 2; g.stroke();
    }
    g.globalAlpha = 1;
  };

  /* ================= 3) 휴게소 시민 구출 (달리기) =================
     잭이 자동으로 달림. 탭 = 점프(좀비 넘기). 시민·강아지에 닿으면 업고 구출 */
  const CITIZENS = ['man', 'woman', 'clerk', 'cleaner'];
  SETUP.rescue = s => {
    s.hearts = true; s.dur = 40; s.speed = 1; s.scroll = 0; s.objs = []; s.jy = 0; s.vy = 0; s.carry = 0; s.hurt = 0; s.inv = 0; s.saved = 0; s.dogs = 0;
    // 미리 배치: 시민 8명 + 강아지 1 + 좀비들 (거리 단위 = 화면 높이 비율)
    let x = 1.2; const list = [];
    for (let i = 0; i < 34; i++) {
      x += rand(0.55, 0.9);
      const r = Math.random();
      if (i === 11) list.push({ k: 'dog', x });
      else if (r < 0.42) list.push({ k: 'cit', x, c: CITIZENS[list.filter(o => o.k === 'cit').length % 4] });
      else { list.push({ k: 'zom', x }); if (Math.random() < 0.25 && i > 6) list.push({ k: 'zom', x: x + 0.16 }); }
    }
    s.objs = list; s.max = list.filter(o => o.k === 'cit').length + 1;
    s.scoreLabel = () => '🙋 ' + s.saved + ' / ' + (s.max - 1) + (s.dogs ? '  🐶' : '');
  };
  UPD.rescue = (s, dt) => {
    const Z = size(), U = Z.unit;
    s.speed = 0.5 + Math.min(0.3, s.t * 0.008);   // 화면 높이 기준 초당 이동
    const dx = s.speed * dt;
    s.scroll += dx * Z.sh;
    for (const o of s.objs) if (!o.done) o.x -= dx;   // o.x = 잭과의 거리 (무대 높이 단위)
    // 점프
    if (s.jy > 0 || s.vy > 0) { s.vy -= U * 450 * dt; s.jy = Math.max(0, s.jy + s.vy * dt); if (s.jy === 0) s.vy = 0; }
    s.carry = Math.max(0, s.carry - dt); s.hurt = Math.max(0, s.hurt - dt); s.inv = Math.max(0, s.inv - dt);
    // 충돌 (잭 위치 = 화면 왼쪽 25%)
    const jx = Z.w * 0.25;
    for (const o of s.objs) {
      if (o.done) { o.t = (o.t || 0) + dt; continue; }
      const ox = o.x * Z.sh + jx;
      if (Math.abs(ox - jx) < U * (o.k === 'zom' ? 6 : 9)) {
        if (o.k === 'zom') {
          if (s.jy < U * 10 && s.inv <= 0) { s.hp--; s.hurt = 0.6; s.inv = 1.0; s.combo = 0; s.shake = 10; s.flash = 0.35; popText(L('으악!', '呜哇！'), jx, Z.floor - U * 70, '#ff6a6a', 28); DX.S && DX.S.boom(false); if (s.hp <= 0) { finish(); return; } }
          else if (s.jy >= U * 10 && !o.jumped) { o.jumped = true; s.combo++; s.maxCombo = Math.max(s.maxCombo, s.combo); popText(L('넘었다!', '跳过！'), jx, Z.floor - U * 80, '#5fe1ff', 20, 0.6); }
        } else if (s.jy < U * 30) {
          o.done = true; o.t = 0; s.carry = 1.0; s.combo++; s.maxCombo = Math.max(s.maxCombo, s.combo);
          if (o.k === 'dog') { s.dogs++; s.score += 1; popText(L('멍멍이 구출!!', '救出狗狗！！'), jx, Z.floor - U * 78, '#ffd34a', 28); }
          else { s.saved++; s.score += 1; popText(L('구출!', '营救！'), jx, Z.floor - U * 78, '#7dff8a', 30); }
          burst(jx, Z.floor - U * 40, '#7dff8a', 12); DX.S && DX.S.level();
        }
      }
    }
    if (s.t >= s.dur || s.objs.every(o => o.done || o.x * Z.sh < -Z.w * 0.3)) finish();
  };
  TAP.rescue = (s) => {
    const Z = size();
    if (s.jy <= 0.5) { s.vy = Z.unit * 150; s.jy = 0.6; DX.S && DX.S.click(); }
  };
  DRAW.rescue = (s, Z) => {
    drawBg(Z, s.scroll * 0.8, 0.05);
    const I = s.img, U = Z.unit, jx = Z.w * 0.25;
    // 도로 줄무늬 (속도감)
    g.fillStyle = 'rgba(255,255,255,0.35)';
    for (let x = -((s.scroll * 1.0) % 120); x < Z.w; x += 120) g.fillRect(x, Z.floor + U * 4, 50, 4);
    for (const o of s.objs) {
      const x = o.x * Z.sh + Z.w * 0.25; if (x < -100 || x > Z.w + 120) continue;
      if (o.done) {   // 구출된 시민: 환호하며 위로 사라짐
        if (o.t > 0.9) continue;
        const im = o.k === 'dog' ? I.dog1 : I['c_' + o.c + '3'];
        pose(im, jx + U * 2, Z.floor - U * 30 - o.t * U * 60, U * (o.k === 'dog' ? 22 : 36), false, 0, 1 - o.t / 0.9);
        continue;
      }
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(x, Z.floor, U * 8, U * 2.2, 0, 0, 6.28); g.fill();
      if (o.k === 'zom') pose(I['z_w' + (Math.floor(s.t * 6 + o.x * 3) % 4)], x, Z.floor, U * 46, false);
      else if (o.k === 'dog') pose(I['dog' + (1 + Math.floor(s.t * 6) % 2)], x, Z.floor, U * 22, true);
      else { pose(I['c_' + o.c + '0'], x, Z.floor + Math.sin(s.t * 10 + o.x) * 1.2, U * 40, true); txt('HELP!', x, Z.floor - U * 46, 14, '#ffd34a'); }
    }
    // 잭
    const jy = Z.floor - s.jy;
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(jx, Z.floor, U * 10 * (1 - Math.min(0.5, s.jy / (U * 80))), U * 2.6, 0, 0, 6.28); g.fill();
    let im;
    if (s.phase === 'end' && s.result && s.result.rate >= 0.45) im = I.cheer;
    else if (s.hurt > 0.3) im = I.hurt;
    else if (s.carry > 0) im = I['carry' + (1 + Math.floor(s.t * 8) % 2)];
    else im = I['run' + (Math.floor(s.t * 10) % 4)];
    const blink = s.inv > 0 && Math.floor(s.t * 14) % 2;
    pose(im, jx, jy, U * (s.carry > 0 ? 50 : 46), false, s.jy > 0 ? -0.08 : 0, blink ? 0.4 : 1);
    // 남은 시간 막대
    const r = clamp(1 - s.t / s.dur, 0, 1);
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(Z.w * 0.2, Z.sy + 8, Z.w * 0.6, 8);
    g.fillStyle = r > 0.3 ? '#7dff8a' : '#ff6a6a'; g.fillRect(Z.w * 0.2, Z.sy + 8, Z.w * 0.6 * r, 8);
  };

  /* ================= 4) 보일러 (해킹) =================
     바늘이 좌우로 흔들림 → 초록 칸에서 탭하면 압력 +1. 다 채우면 열차 출발. 좀비가 열차에 닿으면 실패
     opt.hard = 칸 좁고 바늘 빠름(6장), opt.hack = 문 암호 해킹 화면(8장 연구원) */
  SETUP.boiler = s => {
    const hard = !!s.opt.hard;
    s.need = hard ? 8 : 7; s.max = s.need; s.ok = 0; s.ang = 0; s.dir = 1; s.spd = hard ? 2.2 : 1.6; s.zw = hard ? 0.17 : 0.24;
    s.zc = rand(0.3, 0.7); s.zDist = 1; s.zSpd = hard ? 0.05 : 0.04; s.puff = 0; s.win = 0; s.miss = 0;
    s.scoreLabel = () => (s.opt.hack ? '🔓 ' : '🔥 ') + s.ok + ' / ' + s.need;
  };
  UPD.boiler = (s, dt) => {
    if (s.win > 0) { s.win += dt; if (s.win > 1.4) finish(); return; }
    s.ang += s.dir * s.spd * dt * (1 + s.ok * 0.08);
    if (s.ang > 1) { s.ang = 1; s.dir = -1; } if (s.ang < 0) { s.ang = 0; s.dir = 1; }
    s.zDist -= s.zSpd * dt; s.puff = Math.max(0, s.puff - dt);
    if (s.zDist <= 0) { s.zDist = 0; s.shake = 10; s.flash = 0.4; DX.S && DX.S.boom(false); finish(); }
  };
  TAP.boiler = s => {
    if (s.win > 0) return;
    const Z = size();
    if (Math.abs(s.ang - s.zc) < s.zw / 2) {
      s.ok++; s.score = s.ok; s.combo++; s.maxCombo = Math.max(s.maxCombo, s.combo);
      s.zDist = Math.min(1, s.zDist + 0.06);
      popText(s.opt.hack ? L('딸깍!', '咔嗒！') : L('칙칙!', '嗤嗤！'), Z.w / 2, Z.sy + Z.sh * 0.25, '#7dff8a', 28);
      burst(Z.w * 0.2, Z.floor - Z.unit * 40, s.opt.hack ? '#7dff8a' : '#ffffff', 12); DX.S && DX.S.kill();
      s.zc = rand(0.15, 0.85);
      if (s.ok >= s.need) { s.win = 0.01; popText(s.opt.hack ? L('문이 열렸다!', '门开了！') : L('출발!!', '出发！！'), Z.w / 2, Z.sy + Z.sh * 0.4, '#ffd34a', 40, 1.4); DX.S && DX.S.level(); }
    } else {
      s.combo = 0; s.miss++; s.puff = 0.5; s.zDist -= 0.05; s.shake = 5;
      popText(L('삐익!', '哔！'), Z.w / 2, Z.sy + Z.sh * 0.25, '#ff6a6a', 24, 0.6); DX.S && DX.S.click();
    }
  };
  DRAW.boiler = (s, Z) => {
    drawBg(Z, s.win > 0 ? s.win * 400 : 0, s.opt.hack ? 0.55 : 0.2);
    const I = s.img, U = Z.unit;
    // 열차 (왼쪽) + 생존자
    const tx = Z.w * 0.2 - (s.win > 0 ? s.win * Z.w * 0.5 : 0);
    if (I.train && !s.opt.hack) pose(I.train, tx, Z.floor, U * 38, true);
    if (s.opt.hack) { g.fillStyle = '#3a4250'; g.fillRect(Z.w * 0.06, Z.floor - U * 60, U * 30, U * 60); g.fillStyle = '#c8d0dc'; g.fillRect(Z.w * 0.06 + U * 4, Z.floor - U * 54, U * 22, U * 50); txt(L('실험실', '实验室'), Z.w * 0.06 + U * 15, Z.floor - U * 66, 14, '#7dff8a'); }
    const hero = s.opt.hack ? (s.win > 0 ? I.s1 : I.s0) : (s.win > 0 ? I.h1 : I.h0);
    pose(hero, Z.w * 0.38, Z.floor, U * 42, false);
    // 다가오는 좀비 (오른쪽)
    const zx = Z.w * 0.42 + (Z.w * 0.55) * s.zDist;
    for (let k = 0; k < 3; k++) pose(I['z_w' + (Math.floor(s.t * 6 + k) % 4)], zx + k * U * 14, Z.floor + k * 2, U * (44 - k * 4), false, 0, 1 - k * 0.15);
    // 계기판 (위쪽 가운데)
    const cx = Z.w / 2, cy = Z.sy + Z.sh * 0.42, R = Math.min(Z.w * 0.32, Z.sh * 0.3);
    g.save();
    g.fillStyle = s.opt.hack ? 'rgba(10,30,15,0.9)' : 'rgba(30,25,20,0.88)'; g.strokeStyle = s.opt.hack ? '#7dff8a' : '#c9a35a'; g.lineWidth = 6;
    g.beginPath(); g.arc(cx, cy, R + 10, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
    const A = v => Math.PI + v * Math.PI;
    g.lineWidth = R * 0.22; g.strokeStyle = 'rgba(255,255,255,0.15)'; g.beginPath(); g.arc(cx, cy, R * 0.8, Math.PI, 0); g.stroke();
    g.strokeStyle = '#3ddc6a'; g.beginPath(); g.arc(cx, cy, R * 0.8, A(s.zc - s.zw / 2), A(s.zc + s.zw / 2)); g.stroke();
    g.strokeStyle = s.puff > 0 ? '#ff6a6a' : '#ffffff'; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(A(s.ang)) * R * 0.95, cy + Math.sin(A(s.ang)) * R * 0.95); g.stroke();
    g.fillStyle = '#ffd34a'; g.beginPath(); g.arc(cx, cy, 8, 0, 6.28); g.fill();
    g.restore();
    if (s.opt.hack) { let code = ''; for (let i = 0; i < s.need; i++) code += i < s.ok ? '' + ((i * 7 + 3) % 10) : '_'; txt(code.split('').join(' '), cx, cy + 26, 26, '#7dff8a'); }
    // 압력 칸
    for (let i = 0; i < s.need; i++) { g.fillStyle = i < s.ok ? '#ffd34a' : 'rgba(255,255,255,0.2)'; g.fillRect(cx - s.need * 14 + i * 28, cy + (s.opt.hack ? 46 : 18), 22, 12); }
    if (s.puff > 0 && !s.opt.hack) for (let k = 0; k < 3; k++) { g.fillStyle = 'rgba(255,255,255,' + s.puff + ')'; g.beginPath(); g.arc(tx + U * 6 + k * 14, Z.floor - U * 42 - k * 10, 16 + k * 6, 0, 6.28); g.fill(); }
    txt(L('좀비까지', '距僵尸') + ' ' + Math.round(s.zDist * 100) + 'm', Z.w * 0.78, Z.sy + 26, 16, s.zDist < 0.3 ? '#ff6a6a' : '#fff');
  };

  /* ================= 5) 옥상 엄호 저격 =================
     위쪽 옥상에 시민들, 아래에서 좀비가 기어오름 → 좀비를 탭해서 쏨. opt.dark = 어둠(탭한 곳에 조명탄) */
  SETUP.sniper = s => {
    s.dur = s.opt.dark ? 36 : 32; s.cits = [0, 1, 2].map(i => ({ alive: true, c: ['man', 'woman', 'clerk'][i] })); s.zs = []; s.next = 0.5; s.shot = 0; s.spawned = 0; s.flares = []; s.muzzle = 0;
    s.max = 1; s.hearts = false;
    s.scoreLabel = () => '🙋 ' + s.cits.filter(c => c.alive).length + ' / 3  🎯 ' + s.shot;
  };
  function snPos(Z, i) { return { x: Z.w * (0.32 + i * 0.18), y: Z.sy + Z.sh * 0.3 }; }
  UPD.sniper = (s, dt) => {
    const Z = size(), U = Z.unit;
    s.next -= dt; s.muzzle = Math.max(0, s.muzzle - dt);
    if (s.next <= 0 && s.t < s.dur - 2) {
      s.next = rand(0.9, 1.5) - Math.min(0.5, s.t * 0.015); s.spawned++;
      const alive = s.cits.map((c, i) => c.alive ? i : -1).filter(i => i >= 0);
      if (alive.length) { const ti = pick(alive), side = Math.random() < 0.5 ? -1 : 1; s.zs.push({ ti, x: side < 0 ? -40 : Z.w + 40, y: Z.floor, k: 0, sp: rand(0.09, 0.14) * (1 + s.t * 0.02), dead: 0, side }); }
    }
    for (const z of s.zs) {
      if (z.dead) { z.dead += dt; continue; }
      z.k += z.sp * dt;
      const tp = snPos(Z, z.ti), sx = z.side < 0 ? -40 : Z.w + 40;
      z.x = sx + (tp.x - sx) * Math.min(1, z.k); z.y = Z.floor + (tp.y - Z.floor) * Math.min(1, z.k);
      if (z.k >= 1) { z.dead = 0.01; z.ate = true; const c = s.cits[z.ti]; if (c.alive) { c.alive = false; s.flash = 0.3; s.shake = 8; popText(L('으악!', '呜哇！'), tp.x, tp.y - U * 30, '#ff6a6a', 26); DX.S && DX.S.boom(false); } }
    }
    s.zs = s.zs.filter(z => !z.dead || z.dead < 0.8);
    for (const f of s.flares) f.t += dt; s.flares = s.flares.filter(f => f.t < 2.6);
    if (s.t >= s.dur || !s.cits.some(c => c.alive)) {
      const alive = s.cits.filter(c => c.alive).length;
      s.score = alive / 3 * 0.7 + Math.min(1, s.shot / Math.max(1, s.spawned)) * 0.3; s.max = 1;
      s.saved = alive; finish();
    }
  };
  TAP.sniper = (s, x, y) => {
    const Z = size(), U = Z.unit;
    s.muzzle = 0.12; DX.S && DX.S.shot && DX.S.shot();
    if (s.opt.dark) s.flares.push({ x, y, t: 0 });
    let best = null, bd = U * 16;
    for (const z of s.zs) if (!z.dead) { const d = Math.hypot(z.x - x, z.y - U * 20 - y); if (d < bd) { bd = d; best = z; } }
    if (best) { best.dead = 0.01; s.shot++; s.combo++; s.maxCombo = Math.max(s.maxCombo, s.combo); burst(best.x, best.y - U * 20, '#8aff6a', 10); popText(L('명중!', '命中！'), best.x, best.y - U * 40, '#ffd34a', 22, 0.6); DX.S && DX.S.kill(); }
    else { s.combo = 0; }
    s.aimX = x; s.aimY = y;
  };
  DRAW.sniper = (s, Z) => {
    drawBg(Z, 0, s.opt.dark ? 0.2 : 0.1);
    const I = s.img, U = Z.unit;
    // 옥상
    const ry = Z.sy + Z.sh * 0.3;
    g.fillStyle = '#5b5f6b'; g.fillRect(Z.w * 0.22, ry, Z.w * 0.56, U * 6); g.fillStyle = '#3c3f48'; g.fillRect(Z.w * 0.24, ry + U * 6, Z.w * 0.52, Z.floor - ry - U * 6);
    for (let k = 0; k < 4; k++) { g.fillStyle = 'rgba(255,220,120,0.5)'; g.fillRect(Z.w * 0.28 + k * Z.w * 0.12, ry + U * 14, U * 7, U * 9); g.fillRect(Z.w * 0.28 + k * Z.w * 0.12, ry + U * 30, U * 7, U * 9); }
    s.cits.forEach((c, i) => { const p = snPos(Z, i); if (c.alive) pose(I['c_' + c.c + (s.phase === 'end' ? '3' : '0')], p.x, p.y + Math.sin(s.t * 9 + i) * 1.5, U * 24, i % 2 === 1); });
    for (const z of s.zs) {
      const a = z.dead ? 1 - z.dead / 0.8 : 1;
      const im = z.dead ? (z.ate ? I.z_w0 : I.z_a3) : I['z_w' + (Math.floor(s.t * 7 + z.ti) % 4)];
      pose(im, z.x, z.y + (z.dead && !z.ate ? z.dead * 60 : 0), U * 30, z.side > 0, z.dead && !z.ate ? z.dead * 2 : 0, a);
      if (s.opt.dark && !z.dead) { g.fillStyle = '#ff2a2a'; g.fillRect(z.x - 5, z.y - U * 26, 3, 3); g.fillRect(z.x + 2, z.y - U * 26, 3, 3); }
    }
    // 어둠 + 조명탄
    if (s.opt.dark) {
      g.save(); g.fillStyle = 'rgba(0,0,0,0.88)'; g.beginPath(); g.rect(0, Z.sy, Z.w, Z.sh);
      for (const f of s.flares) { const r = U * 30 * Math.min(1, f.t * 5) * (1 - f.t / 2.6 * 0.4); g.moveTo(f.x + r, f.y); g.arc(f.x, f.y, r, 0, 6.28, true); }
      g.fill('evenodd'); g.restore();
      for (const f of s.flares) { g.fillStyle = 'rgba(255,240,180,' + (1 - f.t / 2.6) + ')'; g.beginPath(); g.arc(f.x, f.y, 5, 0, 6.28); g.fill(); }
    }
    // 민호 (왼쪽 아래)
    pose(s.phase === 'end' && s.result && s.result.rate >= 0.45 ? I.h2 : s.muzzle > 0 ? I.h1 : I.h0, Z.w * 0.1, Z.floor, U * 34, false);
    if (s.aimX != null && s.muzzle > 0) { g.strokeStyle = '#ff3b3b'; g.lineWidth = 3; g.beginPath(); g.arc(s.aimX, s.aimY, 18, 0, 6.28); g.moveTo(s.aimX - 26, s.aimY); g.lineTo(s.aimX + 26, s.aimY); g.moveTo(s.aimX, s.aimY - 26); g.lineTo(s.aimX, s.aimY + 26); g.stroke(); }
    const r = clamp(1 - s.t / s.dur, 0, 1);
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(Z.w * 0.2, Z.sy + 8, Z.w * 0.6, 8); g.fillStyle = '#7dff8a'; g.fillRect(Z.w * 0.2, Z.sy + 8, Z.w * 0.6 * r, 8);
  };

  /* ================= 6) 운명의 갈림길 (게이트 러너) =================
     열차를 좌우로 끌어 숫자 문을 통과 (+ / × 는 화력 증가, - / ÷ 는 감소). 좀비 무리는 자동 사격으로 줄이고,
     부딪히면 그 수만큼 화력이 깎임. 마지막에 보스 무리와 화력 대결 */
  const GATE_OPS = [['+', 5], ['+', 8], ['+', 12], ['×', 2], ['×', 3], ['-', 6], ['-', 10], ['÷', 2]];
  SETUP.gates = s => {
    s.P = 10; s.x = 0.5; s.tx = 0.5; s.objs = []; s.dist = 0; s.next = 1.2; s.shotT = 0; s.bul = []; s.bossDone = false; s.max = 1;
    s.len = 42; s.seq = 0;
    s.scoreLabel = () => '💪 ' + Math.max(0, Math.floor(s.P));
  };
  function gApply(P, op) { return op[0] === '+' ? P + op[1] : op[0] === '×' ? P * op[1] : op[0] === '-' ? P - op[1] : Math.ceil(P / op[1]); }
  UPD.gates = (s, dt) => {
    const Z = size(), sp = 0.32;   // 화면 높이 기준 초당 내려오는 속도
    s.x += (s.tx - s.x) * Math.min(1, dt * 10);
    if (s.t < s.len) {
      s.next -= dt;
      if (s.next <= 0) {
        s.seq++;
        if (s.seq % 3 === 0) { const n = Math.round(6 + s.t * 1.1 + Math.random() * 8); s.objs.push({ k: 'pack', x: rand(0.25, 0.75), y: -0.1, n, n0: n }); s.next = 2.2; }
        else {
          // 좋은 문 하나 + 나쁜 문 하나 (가끔 둘 다 좋거나 둘 다 나쁨)
          const good = GATE_OPS.filter(o => o[0] === '+' || o[0] === '×'), bad = GATE_OPS.filter(o => o[0] === '-' || o[0] === '÷');
          let a = pick(good), b = Math.random() < 0.75 ? pick(bad) : pick(good);
          if (s.t > 20 && a[0] === '+') a = [a[0], a[1] + Math.round(s.t / 3)];
          if (Math.random() < 0.5) [a, b] = [b, a];
          s.objs.push({ k: 'gate', y: -0.1, l: a, r: b }); s.next = 2.4;
        }
      }
    } else if (!s.bossDone && !s.objs.some(o => o.k === 'boss')) {
      const N = Math.round(60 + s.t * 2.2);
      s.objs.push({ k: 'boss', x: 0.5, y: -0.15, n: N, n0: N });
    }
    // 자동 사격: 화력이 클수록 빨리
    s.shotT -= dt;
    if (s.shotT <= 0) { s.shotT = Math.max(0.05, 0.22 - Math.min(0.17, s.P / 400)); s.bul.push({ x: s.x + rand(-0.03, 0.03), y: 0.74 }); DX.S && DX.S.shot && DX.S.shot(); }
    for (const b of s.bul) b.y -= dt * 1.6;
    for (const o of s.objs) {
      o.y += sp * dt;
      if (o.k !== 'gate') for (const b of s.bul) if (!b.hit && Math.abs(b.x - o.x) < (o.k === 'boss' ? 0.3 : 0.12) && Math.abs(b.y - o.y) < 0.05) { b.hit = true; o.n -= Math.max(1, Math.round(s.P / 40)); o.hitT = 0.08; if (o.n <= 0) { o.dead = true; burst(o.x * Z.w, Z.sy + o.y * Z.sh, '#8aff6a', 14); popText(L('전멸!', '全灭！'), o.x * Z.w, Z.sy + o.y * Z.sh, '#8aff6a', 26, 0.7); DX.S && DX.S.kill(); } }
      if (o.hitT > 0) o.hitT -= dt;
      // 통과 / 충돌
      if (!o.done && o.y >= 0.72) {
        o.done = true;
        if (o.k === 'gate') {
          const op = s.x < 0.5 ? o.l : o.r, before = s.P;
          s.P = Math.max(0, gApply(s.P, op)); o.pick = s.x < 0.5 ? 'l' : 'r';
          const up = s.P >= before;
          popText((up ? '+' : '') + Math.round(s.P - before), s.x * Z.w, Z.sy + Z.sh * 0.6, up ? '#7dff8a' : '#ff6a6a', 34, 0.9);
          if (up) { burst(s.x * Z.w, Z.sy + Z.sh * 0.72, '#7dff8a', 16); DX.S && DX.S.level(); s.combo++; s.maxCombo = Math.max(s.maxCombo, s.combo); } else { s.shake = 6; s.combo = 0; DX.S && DX.S.click(); }
        } else if (!o.dead) {
          const n = Math.max(0, Math.ceil(o.n));
          if (o.k === 'boss') {
            s.bossDone = true; const win = s.P > n;
            s.score = win ? Math.min(1, 0.6 + (s.P - n) / Math.max(1, n) * 0.8) : Math.min(0.44, s.P / Math.max(1, n) * 0.44);
            s.shake = 14; s.flash = win ? 0 : 0.4; burst(Z.w / 2, Z.sy + Z.sh * 0.6, win ? '#ffd34a' : '#ff6a6a', 30, 600);
            popText(win ? L('보스 격파!!', '击败首领！！') : L('화력 부족...', '火力不足...'), Z.w / 2, Z.sy + Z.sh * 0.45, win ? '#ffd34a' : '#ff6a6a', 40, 1.4);
            s.P = Math.max(0, s.P - n); DX.S && DX.S.boom(true);
            setTimeout(() => { if (st === s) finish(); }, 900);
          } else if (Math.abs(o.x - s.x) > 0.2) { /* 옆으로 피함 */ } else { s.P = Math.max(0, s.P - n); s.shake = 8; s.flash = 0.25; popText('-' + n, s.x * Z.w, Z.sy + Z.sh * 0.6, '#ff6a6a', 30); DX.S && DX.S.boom(false); if (s.P <= 0) { s.score = 0; finish(); } }
        }
      }
    }
    s.objs = s.objs.filter(o => o.y < 1.2 && !(o.dead && o.y > 0.75));
    s.bul = s.bul.filter(b => !b.hit && b.y > -0.1);
  };
  MOVE.gates = (s, x) => { const Z = size(); s.tx = clamp(x / Z.w, 0.12, 0.88); };
  TAP.gates = (s, x) => MOVE.gates(s, x);
  DRAW.gates = (s, Z) => {
    const I = s.img, U = Z.unit;
    g.fillStyle = '#07090f'; g.fillRect(0, 0, Z.w, Z.h);
    // 도로
    g.fillStyle = '#2b2f38'; g.fillRect(0, Z.sy, Z.w, Z.sh);
    g.fillStyle = '#3a3f4a'; for (let i = 0; i < 14; i++) { const y = Z.sy + ((i / 14 + s.t * 0.32) % 1) * Z.sh; g.fillRect(Z.w / 2 - 3, y, 6, Z.sh / 28); }
    g.fillStyle = '#ffd34a'; g.fillRect(Z.w * 0.06, Z.sy, 4, Z.sh); g.fillRect(Z.w * 0.94 - 4, Z.sy, 4, Z.sh);
    for (const o of s.objs) {
      const y = Z.sy + o.y * Z.sh;
      if (o.k === 'gate') {
        for (const side of ['l', 'r']) {
          const op = o[side], good = op[0] === '+' || op[0] === '×', x0 = side === 'l' ? Z.w * 0.08 : Z.w * 0.52, w = Z.w * 0.4;
          g.globalAlpha = o.pick && o.pick !== side ? 0.25 : 0.85;
          g.fillStyle = good ? 'rgba(40,180,90,0.55)' : 'rgba(210,50,50,0.55)'; g.fillRect(x0, y - U * 7, w, U * 14);
          g.strokeStyle = good ? '#7dff8a' : '#ff6a6a'; g.lineWidth = 4; g.strokeRect(x0, y - U * 7, w, U * 14);
          txt(op[0] + op[1], x0 + w / 2, y, Math.round(U * 9), '#fff');
          g.globalAlpha = 1;
        }
      } else {
        const big = o.k === 'boss', cnt = Math.min(big ? 1 : 6, Math.ceil(o.n / 6) || 1);
        for (let k = 0; k < cnt; k++) {
          const zx = o.x * Z.w + (k - (cnt - 1) / 2) * U * 9, im = big ? I.boss : I['z_w' + (Math.floor(s.t * 7 + k) % 4)];
          pose(im, zx, y + U * 6 + (k % 2) * U * 3, U * (big ? 46 : 18), false, 0, o.dead ? 0.3 : 1, o.hitT > 0 ? 0.1 : 0);
        }
        g.fillStyle = big ? '#7a1020' : '#4a1520'; const bw = U * (big ? 26 : 16); g.fillRect(o.x * Z.w - bw / 2, y - U * (big ? 48 : 22), bw, U * 9);
        txt('' + Math.max(0, Math.ceil(o.n)), o.x * Z.w, y - U * (big ? 43.5 : 17.5), Math.round(U * 7), '#ff9a9a');
      }
    }
    // 총알
    g.fillStyle = '#ffe680'; for (const b of s.bul) g.fillRect(b.x * Z.w - 2, Z.sy + b.y * Z.sh - 8, 4, 12);
    // 열차 (기관차 + 화력에 따라 칸이 늘어남)
    const tx = s.x * Z.w, ty = Z.sy + Z.sh * 0.74, cars = Math.min(4, 1 + Math.floor(s.P / 40));
    for (let k = cars; k >= 1; k--) if (I.car) pose(I.car, tx, ty + U * 14 * k + U * 12, U * 14, false);
    if (I.train) pose(I.train, tx, ty + U * 12, U * 16, false);
    g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(tx - U * 10, ty - U * 12, U * 20, U * 8);
    txt('💪' + Math.max(0, Math.floor(s.P)), tx, ty - U * 8, Math.round(U * 6), '#7dff8a');
  };
})(window.DX);
