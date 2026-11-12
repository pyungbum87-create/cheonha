/* ==========================================================================
   fight.js — 실내 침입 전투 (옆에서 보는 2D 연타 미니게임)
   - 화면을 터치할 때마다 생존자가 뚫어뻥을 휘두름
   - 좀비를 전부 창밖으로 날려버리면 승리
   - 밸런스는 config.js 의 invasion 에서 수정
   ========================================================================== */
window.DX = window.DX || {};
(function (DX) {
  'use strict';
  const F = DX.FIGHT = {};
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  let cv, g, st = null, raf = 0, last = 0;

  F.start = function (opt, done) {
    const SPR = DX.SPR;
    if (!SPR.hasFight()) { done({ win: true }); return; }
    const sec = document.getElementById('fight');
    cv = document.getElementById('fightCv'); g = cv.getContext('2d');
    sec.classList.remove('hidden');
    const types = opt.types.filter(t => SPR.fight[t]);
    st = {
      done, t: 0, time: opt.time || 12, phase: 'intro', phaseT: 1.1,
      jack: { hp: 3, state: 'ready', st: 0, cd: 0, push: 0 },
      zs: [], queue: [], kills: 0, total: opt.count, combo: 0,
      shake: 0, hitstop: 0, flash: 0, texts: [], stars: [], result: null, hits: opt.hits || {}
    };
    for (let i = 0; i < opt.count; i++) st.queue.push({ type: types.length ? pick(types) : 'office', at: 0.3 + i * rand(0.7, 1.1) });
    last = performance.now();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  };

  function layout() {
    const d = Math.min(window.devicePixelRatio || 1, 2);
    const w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * d) || cv.height !== Math.round(h * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
    g.setTransform(d, 0, 0, d, 0, 0);
    const bg = DX.SPR.fight.bg;
    const bw = Math.max(w * 1.55, h * 0.9), bh = bw * bg.height / bg.width;
    const bx = (w - bw) / 2, by = h * 0.47 - bh / 2;
    return { w, h, bg, bw, bh, bx, by, floor: by + bh * 0.72, ch: bh * 0.48, jx: w * 0.24 };
  }

  function tap() {
    if (!st || st.phase !== 'go') return;
    const J = st.jack;
    if (J.cd > 0 || J.state === 'hurt') return;
    J.state = 'swing'; J.st = 0.16; J.cd = 0.13; J.push = 1;
    DX.S && DX.S.click();
    const L = layout();
    const reach = L.ch * 0.95;
    let target = null, bd = 1e9;
    for (const z of st.zs) {
      if (z.state === 'fly') continue;
      const dx = z.x - L.jx;
      if (dx > -L.ch * 0.2 && dx < reach && dx < bd) { bd = dx; target = z; }
    }
    if (!target) return;
    target.hp--; target.flash = 0.1; target.x += L.ch * 0.18; target.state = 'walk'; target.st = 0;
    st.combo++; st.shake = Math.max(st.shake, 6); st.hitstop = 0.04;
    burst(target.x - L.ch * 0.15, L.floor - L.ch * 0.6, '#ffe066', 8);
    text(target.x, L.floor - L.ch * 1.05, DX.T(pick(['퍽!', '빡!', '콰직!', '뽁!'])), '#ffffff', 26);
    DX.S && DX.S.kill();
    if (target.hp <= 0) {
      target.state = 'fly'; target.vx = rand(600, 900); target.vy = -rand(700, 950); target.rot = 0; target.vr = rand(8, 14);
      st.kills++; st.shake = 14; st.hitstop = 0.09; st.flash = 0.12;
      text(target.x, L.floor - L.ch * 1.3, DX.T(pick(['창밖으로~!', '퇴근!!', '안녕히 가세요~', '홈런!!'])), '#ffd23d', 30);
      DX.S && DX.S.boom(false);
      if (navigator.vibrate) { try { navigator.vibrate(30); } catch (e) {} }
    }
  }
  function text(x, y, s, col, size) { st.texts.push({ x, y, s, col, size, t: 0 }); }
  function burst(x, y, col, n) { for (let i = 0; i < n; i++) { const a = rand(0, 6.28), sp = rand(200, 500); st.stars.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, max: rand(0.25, 0.45), col, s: rand(5, 10) }); } }

  function update(dt) {
    const L = layout();
    if (st.hitstop > 0) { st.hitstop -= dt; return; }
    st.t += dt; st.shake = Math.max(0, st.shake - dt * 40); st.flash = Math.max(0, st.flash - dt);
    const J = st.jack;
    J.cd -= dt; J.push = Math.max(0, J.push - dt * 6);
    if (J.st > 0) { J.st -= dt; if (J.st <= 0) J.state = 'ready'; }
    if (st.phase === 'intro') { st.phaseT -= dt; if (st.phaseT <= 0) st.phase = 'go'; }
    else if (st.phase === 'go') {
      st.time -= dt;
      for (const q of st.queue) { q.at -= dt; if (q.at <= 0 && !q.spawned) { q.spawned = true; st.zs.push({ type: q.type, x: L.w + L.ch * 0.5, hp: st.hits[q.type] || 2, state: 'walk', st: 0, ph: rand(0, 6), spd: rand(0.55, 0.8), flash: 0 }); } }
      for (const z of st.zs) {
        z.flash = Math.max(0, z.flash - dt);
        if (z.state === 'fly') continue;
        z.ph += dt * 9;
        const dx = z.x - L.jx;
        if (z.state === 'walk') {
          if (dx > L.ch * 0.55) z.x -= L.ch * z.spd * dt;
          else { z.state = 'lunge'; z.st = 0.45; }
        } else if (z.state === 'lunge') {
          z.st -= dt;
          if (z.st <= 0) {
            if (dx < L.ch * 0.75 && J.state !== 'hurt') {
              J.hp--; J.state = 'hurt'; J.st = 0.45; st.shake = 16; st.combo = 0;
              text(L.jx, L.floor - L.ch * 1.1, DX.T('아야!'), '#ff6b5b', 26);
              DX.S && DX.S.boom(false);
              for (const o of st.zs) if (o.state !== 'fly') o.x += L.ch * 0.25;
            }
            z.state = 'walk';
          }
        }
      }
      st.zs = st.zs.filter(z => !(z.state === 'fly' && (z.y > L.h || z.x > L.w + 400)));
      if (st.kills >= st.total) finish(true);
      else if (J.hp <= 0 || st.time <= 0) finish(false);
    } else if (st.phase === 'end') {
      st.phaseT -= dt;
      if (st.phaseT <= 0) { close(); return; }
    }
    for (const z of st.zs) if (z.state === 'fly') { z.vy += 2200 * dt; z.x += z.vx * dt; z.y = (z.y || 0) + z.vy * dt; z.rot += z.vr * dt; }
    for (const s of st.stars) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 600 * dt; }
    st.stars = st.stars.filter(s => s.t < s.max);
    for (const t of st.texts) t.t += dt;
    st.texts = st.texts.filter(t => t.t < 0.8);
  }
  function finish(win) { st.phase = 'end'; st.phaseT = 1.2; st.result = { win, kills: st.kills }; if (win) { st.flash = 0.2; DX.S && DX.S.level(); } }
  function close() {
    cancelAnimationFrame(raf);
    document.getElementById('fight').classList.add('hidden');
    const r = st.result, d = st.done; st = null;
    d(r);
  }

  function drawPose(img, x, y, h, rot, flip, alpha, flash) {
    if (!img) return;
    const w = h * img.width / img.height;
    g.save(); g.translate(x, y); g.rotate(rot || 0); if (flip) g.scale(-1, 1);
    g.globalAlpha = alpha === undefined ? 1 : alpha;
    g.drawImage(img, -w / 2, -h, w, h);
    if (flash > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, flash * 7); g.drawImage(img, -w / 2, -h, w, h); }
    g.restore();
  }
  function draw() {
    const L = layout(), S = DX.SPR.fight;
    g.clearRect(0, 0, L.w, L.h);
    g.fillStyle = 'rgba(5,7,12,0.88)'; g.fillRect(0, 0, L.w, L.h);
    g.save();
    if (st.shake > 0 && DX.save.shake !== false) g.translate(rand(-st.shake, st.shake), rand(-st.shake, st.shake));
    g.drawImage(L.bg, L.bx, L.by, L.bw, L.bh);
    // 생존자
    const J = st.jack, jf = S.jack;
    const jImg = J.state === 'swing' ? jf[1] : J.state === 'hurt' ? jf[2] : jf[0];
    const jb = J.state === 'ready' ? Math.sin(st.t * 6) * 2 : 0;
    drawPose(jImg, L.jx + J.push * 10, L.floor + jb, L.ch * (J.state === 'swing' ? 1.05 : 1), J.state === 'hurt' ? -0.15 : 0, false, 1, 0);
    // 좀비
    const zs = st.zs.slice().sort((a, b) => b.x - a.x);
    for (const z of zs) {
      const f = S[z.type] || S.office; if (!f) continue;
      const img = z.state === 'fly' ? f[2] : z.state === 'lunge' ? f[1] : f[0];
      const bob = z.state === 'walk' ? Math.abs(Math.sin(z.ph)) * 6 : 0;
      const lean = z.state === 'lunge' ? -0.12 + Math.sin(st.t * 40) * 0.03 : Math.sin(z.ph) * 0.05;
      drawPose(img, z.x, L.floor - bob + (z.y || 0), L.ch * (z.type === 'box' ? 1.0 : 0.98), z.state === 'fly' ? z.rot : lean, false, 1, z.flash);
    }
    for (const s of st.stars) { g.globalAlpha = 1 - s.t / s.max; g.fillStyle = s.col; g.beginPath(); g.arc(s.x, s.y, s.s, 0, 6.28); g.fill(); }
    g.globalAlpha = 1;
    g.restore();
    // 글자
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    for (const t of st.texts) {
      const sc = t.t < 0.1 ? 0.6 + t.t * 5 : 1.1;
      g.globalAlpha = Math.min(1, (0.8 - t.t) * 3);
      g.font = Math.round(t.size * sc) + "px 'Black Han Sans', 'Noto Sans SC', sans-serif";
      g.lineWidth = 6; g.strokeStyle = '#11131a'; g.strokeText(t.s, t.x, t.y - t.t * 40); g.fillStyle = t.col; g.fillText(t.s, t.x, t.y - t.t * 40);
    }
    g.globalAlpha = 1;
    // 상단 정보
    const top = Math.max(60, L.by - 70);
    g.font = "26px 'Black Han Sans', 'Noto Sans SC', sans-serif"; g.lineWidth = 6; g.strokeStyle = '#000';
    const title = DX.T('🚨 실내 침입! 연타로 쫓아내라');
    g.strokeText(title, L.w / 2, top); g.fillStyle = '#ff6b5b'; g.fillText(title, L.w / 2, top);
    const tb = Math.max(0, st.time / 12);
    g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(L.w * 0.15, top + 26, L.w * 0.7, 12);
    g.fillStyle = tb < 0.3 ? '#ff4a4a' : '#ffd23d'; g.fillRect(L.w * 0.15, top + 26, L.w * 0.7 * Math.min(1, tb), 12);
    g.font = "22px 'Black Han Sans', 'Noto Sans SC', sans-serif";
    g.textAlign = 'left'; g.fillStyle = '#ff5a6a'; g.fillText('♥'.repeat(Math.max(0, J.hp)) + '♡'.repeat(Math.max(0, 3 - J.hp)), L.w * 0.15, top + 58);
    g.textAlign = 'right'; g.fillStyle = '#fff'; g.fillText(DX.L('격퇴 ', '击退 ') + st.kills + ' / ' + st.total, L.w * 0.85, top + 58);
    g.textAlign = 'center';
    // 안내 / 결과
    const by = L.by + L.bh + 60;
    if (st.phase === 'intro') {
      g.font = "40px 'Black Han Sans', 'Noto Sans SC', sans-serif"; g.lineWidth = 8;
      g.strokeText('READY...', L.w / 2, L.h * 0.47); g.fillStyle = '#fff'; g.fillText('READY...', L.w / 2, L.h * 0.47);
    } else if (st.phase === 'go') {
      g.font = "30px 'Black Han Sans', 'Noto Sans SC', sans-serif"; g.lineWidth = 6;
      const pulse = 1 + Math.sin(st.t * 12) * 0.06;
      g.save(); g.translate(L.w / 2, by); g.scale(pulse, pulse);
      g.strokeText(DX.T('👆 화면 연타!!'), 0, 0); g.fillStyle = '#ffd23d'; g.fillText(DX.T('👆 화면 연타!!'), 0, 0); g.restore();
      if (st.combo >= 3) { g.font = "24px 'Black Han Sans', 'Noto Sans SC', sans-serif"; g.strokeText(st.combo + ' HIT', L.w / 2, by + 40); g.fillStyle = '#fff'; g.fillText(st.combo + ' HIT', L.w / 2, by + 40); }
    } else if (st.phase === 'end') {
      const w = st.result.win;
      g.font = "48px 'Black Han Sans', 'Noto Sans SC', sans-serif"; g.lineWidth = 9;
      g.strokeText(DX.T(w ? '격퇴 성공!!' : '격퇴 실패...'), L.w / 2, L.h * 0.47);
      g.fillStyle = w ? '#ffd23d' : '#ff6b5b'; g.fillText(DX.T(w ? '격퇴 성공!!' : '격퇴 실패...'), L.w / 2, L.h * 0.47);
    }
    if (st.flash > 0) { g.fillStyle = 'rgba(255,255,255,' + Math.min(0.5, st.flash * 3) + ')'; g.fillRect(0, 0, L.w, L.h); }
  }
  function loop(ts) {
    if (!st) return;
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
    try { update(dt); if (st) draw(); } catch (e) { console.error(e); }
    if (st) raf = requestAnimationFrame(loop);
  }
  F.tap = tap;
  F.active = () => !!st;
  // 테스트용
  F._step = function (n, dt) { for (let i = 0; i < n && st; i++) update(dt || 1 / 30); if (st) draw(); };
})(window.DX);
