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
  const L = (ko, zh) => (DX.L ? DX.L(ko, zh) : ko);
  let cv, g, st = null, raf = 0, last = 0;

  const TITLE = () => ({
    parcel: [L('📦 택배 쳐내기!', '📦 击飞快递！'), L('상자가 원에 닿을 때 탭!', '箱子碰到圆圈时点击！')],
    golf: [L('⛳ 사장님 골프공 받아치기!', '⛳ 反击老板的高尔夫球！'), L('아래 박자 줄에 맞춰 탭!', '跟着下方节拍点击！')],
    rescue: [L('🏃 시민 구출 작전!', '🏃 市民营救行动！'), L('탭 = 점프 · 시민에게 닿으면 구출', '点击=跳跃 · 碰到市民即可营救')],
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
      const isBg = k === 'bg', isFx = k === 'crate';
      out[k] = await (isFx ? SPR.cut(n[k], 120, false) : SPR.cut(n[k], isBg ? 0 : 300, isBg));
    }));
    return out;
  }

  /* ---------------- 시작 / 종료 ---------------- */
  M.start = async function (kind, opt, done) {
    opt = opt || {};
    cv = document.getElementById('miniCv'); g = cv.getContext('2d');
    const sec = document.getElementById('mini');
    sec.classList.remove('hidden');
    st = { kind, done, opt, t: 0, phase: 'load', phaseT: 0, img: {}, score: 0, max: 1, combo: 0, maxCombo: 0, hp: 3, texts: [], parts: [], shake: 0, flash: 0, result: null };
    drawLoading();
    const img = await loadAll(need(kind, opt.bg || 'assets/story/ch2_side.jpg'));
    if (!st) return;
    st.img = img; st.phase = 'intro'; st.phaseT = 1.6;
    SETUP[kind](st);
    last = performance.now();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    DX.track && DX.track('minigame', { kind });
  };
  function finish() {
    if (st.phase === 'end') return;
    const rate = clamp(st.score / st.max, 0, 1);
    const grade = rate >= 0.9 ? 'S' : rate >= 0.7 ? 'A' : rate >= 0.45 ? 'B' : 'C';
    st.phase = 'end'; st.phaseT = 2.0; st.result = { kind: st.kind, rate, grade, score: st.score, max: st.max, maxCombo: st.maxCombo };
    if (rate >= 0.45 && DX.S) DX.S.win(); else if (DX.S) DX.S.lose();
  }
  function close() {
    cancelAnimationFrame(raf);
    document.getElementById('mini').classList.add('hidden');
    const r = st.result, d = st.done; st = null;
    if (d) d(r);
  }
  function loop(ts) {
    if (!st) return;
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
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
    if (st.phase === 'end' && st.phaseT < 1.2) { close(); return; }
    if (st.phase !== 'play') return;
    TAP[st.kind](st, x, y);
  }
  M.down = down;
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
    const sh = Math.min(h * 0.6, w * 1.0), sy = h * 0.46 - sh / 2;
    return { w, h, sy, sh, floor: sy + sh * 0.86, unit: sh / 100 };
  }
  function drawLoading() {
    const Z = size();
    g.fillStyle = 'rgba(5,7,12,0.92)'; g.fillRect(0, 0, Z.w, Z.h);
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
    const tt = TITLE()[st.kind];
    txt(tt[0], Z.w / 2, Math.max(28, Z.sy * 0.32), Math.min(30, Z.w / 13), '#ffd34a');
    txt(st.scoreLabel ? st.scoreLabel() : (st.score + ' / ' + st.max), Z.w / 2, Math.max(60, Z.sy * 0.7), 22, '#fff');
    if (st.hearts) { let s = ''; for (let i = 0; i < 3; i++) s += i < st.hp ? '❤️' : '🖤'; g.font = '20px sans-serif'; g.textAlign = 'right'; g.fillText(s, Z.w - 12, Math.max(60, Z.sy * 0.7)); }
    if (st.combo >= 3) txt(st.combo + ' COMBO', 14, Math.max(60, Z.sy * 0.7), 20, '#5fe1ff', 'left');
    if (st.flash > 0) { g.fillStyle = 'rgba(255,60,60,' + st.flash * 0.6 + ')'; g.fillRect(0, 0, Z.w, Z.h); }
    if (st.phase === 'intro') {
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, 0, Z.w, Z.h);
      const a = 1 - Math.max(0, st.phaseT - 1.3) / 0.3;
      g.globalAlpha = clamp(a, 0, 1);
      txt(tt[0], Z.w / 2, Z.h * 0.42, Math.min(40, Z.w / 10), '#ffd34a');
      txt(tt[1], Z.w / 2, Z.h * 0.42 + 46, Math.min(22, Z.w / 18), '#fff');
      g.globalAlpha = 1;
    } else if (st.phase === 'play' && st.t < 3.5) txt(tt[1], Z.w / 2, Z.sy + Z.sh + Math.min(60, (Z.h - Z.sy - Z.sh) * 0.3), 18, '#cfe8ff');
    if (st.phase === 'end') {
      const r = st.result;
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 0, Z.w, Z.h);
      txt(r.grade, Z.w / 2, Z.h * 0.38, 96, { S: '#ffd34a', A: '#7dff8a', B: '#5fe1ff', C: '#ff8a8a' }[r.grade]);
      txt(r.rate >= 0.45 ? L('성공!!', '成功！！') : L('아쉽다...', '可惜...'), Z.w / 2, Z.h * 0.38 + 76, 30, '#fff');
      if (st.phaseT < 1.2) txt(L('터치해서 계속', '点击继续'), Z.w / 2, Z.h * 0.38 + 124, 16, '#cfe8ff');
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

  const SETUP = {}, UPD = {}, TAP = {}, DRAW = {};

  /* ================= 1) 택배 쳐내기 =================
     상자는 포물선으로 날아와 T초에 민호 앞 '타격 원'에 도착. 원 근처에서 탭하면 되받아침 */
  const PARCEL_N = 10;
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
        const lvl = s.thrown / PARCEL_N, fly = rand(1.15, 1.35) - lvl * 0.45;
        const gold = Math.random() < 0.18;
        s.crates.push({ t: -0.45, T: fly, gold, st: 'fly', x: P.zx, y: Z.floor - Z.unit * 50, rot: 0 });
        s.next = rand(1.25, 1.7) - lvl * 0.55 + (Math.random() < 0.25 ? -0.45 : 0);   // 가끔 연속 투척
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
    const bpm = 96, beat = 60 / bpm;
    s.beat = beat; s.notes = []; let t = 2.2;
    const bars = [0, 1, 2, 3, 4].map(i => GOLF_PATTERNS[Math.min(GOLF_PATTERNS.length - 1, Math.floor(i * 1.3 + Math.random() * 1.5))]);
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
    s.hearts = true; s.dur = 24; s.speed = 1; s.scroll = 0; s.objs = []; s.jy = 0; s.vy = 0; s.carry = 0; s.hurt = 0; s.inv = 0; s.saved = 0; s.dogs = 0;
    // 미리 배치: 시민 8명 + 강아지 1 + 좀비들 (거리 단위 = 화면 높이 비율)
    let x = 1.2; const list = [];
    for (let i = 0; i < 20; i++) {
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
    s.speed = 0.62 + Math.min(0.35, s.t * 0.012);   // 화면 높이 기준 초당 이동
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
})(window.DX);
