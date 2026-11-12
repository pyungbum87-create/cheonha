/* ==========================================================================
   fight.js — 실내 침입 전투 (옆에서 보는 2D 연타 미니게임)
   장면 3가지 (config.js 의 invasion.scenes 에서 수정)
     car    : 객차 안      — 오른쪽에서 오는 좀비를 연타
     engine : 기관실       — 양쪽에서 옴. 왼쪽/오른쪽 화면을 눌러 그쪽을 때림
     roof   : 열차 지붕 위 — 위에서 뛰어내리는 좀비 + "표지판 경보" 때는 손을 떼야 함
   좀비별 특징
     office : 기본          box : 단단함(밀려나지 않음)
     dancer : 깡충 뛰는 동안은 안 맞음   riot : 방패를 든 동안은 막힘 → 공격하려고 방패를 열 때 때리기
   배경 그림(bgEngine, bgRoof)이 없으면 코드로 그린 배경을 씀
   ========================================================================== */
window.DX = window.DX || {};
(function (DX) {
  'use strict';
  const F = DX.FIGHT = {};
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const FONT = "'Black Han Sans', 'Noto Sans SC', sans-serif";
  let cv, g, st = null, raf = 0, last = 0;

  F.start = function (opt, done) {
    const SPR = DX.SPR, C = DX.CONFIG.invasion;
    if (!SPR.hasFight()) { done({ win: true }); return; }
    const sec = document.getElementById('fight');
    cv = document.getElementById('fightCv'); g = cv.getContext('2d');
    sec.classList.remove('hidden');
    const scene = (C.scenes && C.scenes[opt.scene]) ? opt.scene : 'car';
    const sc = (C.scenes && C.scenes[scene]) || {};
    const types = (opt.types || []).filter(t => SPR.fight[t]);
    const hero = SPR.fight[opt.hero] ? opt.hero : 'jack';
    st = {
      done, t: 0, time: opt.time || 12, maxTime: opt.time || 12, phase: 'intro', phaseT: 1.3, scene, sc, hero,
      jack: { hp: 3, state: 'ready', st: 0, cd: 0, push: 0, dir: 1 },
      zs: [], queue: [], kills: 0, total: opt.count, combo: 0,
      shake: 0, hitstop: 0, flash: 0, texts: [], stars: [], result: null, hits: opt.hits || {},
      sign: null, signDone: false, taught: {}, theme: opt.theme || {},
    };
    for (let i = 0; i < opt.count; i++) {
      const type = types.length ? pick(types) : 'office';
      let side = 1, drop = false;
      if (scene === 'engine') side = i % 2 === 0 ? 1 : -1;
      if (scene === 'roof' && (type === 'dancer' || Math.random() < 0.35)) drop = true;
      st.queue.push({ type, side, drop, at: 0.3 + i * rand(0.75, 1.15) });
    }
    if (scene === 'roof') st.signAt = rand(3.5, 5.5);
    last = performance.now();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    DX.track('fight_scene', { scene, hero });
  };

  function layout() {
    const d = Math.min(window.devicePixelRatio || 1, 2);
    const w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * d) || cv.height !== Math.round(h * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
    g.setTransform(d, 0, 0, d, 0, 0);
    const S = DX.SPR.fight, key = st.sc.bg || 'bg';
    const bg = S[key] || null;
    const ar = bg ? bg.height / bg.width : 428 / 900;
    const bw = Math.max(w * 1.55, h * 0.9), bh = bw * ar;
    const bx = (w - bw) / 2, by = h * 0.47 - bh / 2;
    const both = st.scene === 'engine';
    return { w, h, bg, bw, bh, bx, by, floor: by + bh * (st.scene === 'roof' && !bg ? 0.66 : 0.72), ch: bh * 0.48, jx: both ? w * 0.5 : w * 0.24 };
  }

  // 터치: x = 화면 좌표 (기관실에서는 왼쪽/오른쪽 판단)
  function tap(px) {
    if (!st || st.phase !== 'go') return;
    const J = st.jack, L = layout();
    if (J.cd > 0 || J.state === 'hurt') return;
    if (st.scene === 'engine' && px != null) J.dir = px < L.w / 2 ? -1 : 1;
    J.state = 'swing'; J.st = 0.16; J.cd = 0.13; J.push = 1;
    DX.S && DX.S.click();
    // 표지판 경보 중에 휘두르면 머리 쾅
    if (st.sign && st.sign.phase === 'hit') { hurtHero(L, DX.T('쾅! 표지판에 박았다')); return; }
    const reach = L.ch * 0.95;
    let target = null, bd = 1e9;
    for (const z of st.zs) {
      if (z.state === 'fly' || z.state === 'drop') continue;
      const dx = (z.x - L.jx) * J.dir;
      if (dx > -L.ch * 0.2 && dx < reach && dx < bd) { bd = dx; target = z; }
    }
    if (!target) return;
    // 댄서: 깡충 뛰는 중엔 헛스윙
    if (target.type === 'dancer' && target.hop > 0) {
      text(target.x, L.floor - L.ch * 1.2, DX.T('헛스윙!'), '#c9b6ff', 24); st.combo = 0;
      teach('dancer', '💃 댄서는 땅에 내려왔을 때 때리세요!');
      return;
    }
    // 경찰: 방패를 든 동안은 막힘, 공격하려고 방패를 열면(lunge) 2배 피해
    if (target.type === 'riot' && target.state !== 'lunge') {
      target.x += L.ch * 0.05 * J.dir; st.shake = Math.max(st.shake, 4);
      burst(target.x - L.ch * 0.15 * J.dir, L.floor - L.ch * 0.6, '#9fd8ff', 6);
      text(target.x, L.floor - L.ch * 1.15, DX.T('팅!'), '#9fd8ff', 24);
      teach('riot', '🛡️ 방패가 열릴 때(달려들 때) 때리세요!');
      DX.S && DX.S.click();
      return;
    }
    let dmg = 1;
    if (target.type === 'riot') { dmg = 2; target.state = 'walk'; target.st = 0; text(target.x, L.floor - L.ch * 1.45, DX.T('방패 뚫림!'), '#ffd23d', 26); }
    target.hp -= dmg; target.flash = 0.1;
    if (target.type !== 'box') { target.x += L.ch * 0.18 * J.dir; target.state = 'walk'; target.st = 0; }
    st.combo++; st.shake = Math.max(st.shake, 6); st.hitstop = 0.04;
    burst(target.x - L.ch * 0.15 * J.dir, L.floor - L.ch * 0.6, '#ffe066', 8);
    text(target.x, L.floor - L.ch * 1.05, DX.T(pick(['퍽!', '빡!', '콰직!', '뽁!'])), '#ffffff', 26);
    DX.S && DX.S.kill();
    if (target.hp <= 0) knockOut(target, L, J.dir);
  }
  function knockOut(z, L, dir, msg) {
    z.state = 'fly'; z.vx = rand(600, 900) * dir; z.vy = -rand(700, 950); z.rot = 0; z.vr = rand(8, 14) * dir;
    st.kills++; st.shake = 14; st.hitstop = 0.09; st.flash = 0.12;
    const words = st.scene === 'roof' ? ['열차 밖으로~!', '추락!!', '바이바이~', '홈런!!'] : st.scene === 'engine' ? ['화구로 쏙!', '퇴근!!', '석탄행~', '홈런!!'] : ['창밖으로~!', '퇴근!!', '안녕히 가세요~', '홈런!!'];
    text(z.x, L.floor - L.ch * 1.3, msg || DX.T(pick(words)), '#ffd23d', 30);
    DX.S && DX.S.boom(false);
    if (navigator.vibrate) { try { navigator.vibrate(30); } catch (e) {} }
  }
  function hurtHero(L, msg) {
    const J = st.jack;
    if (J.state === 'hurt') return;
    J.hp--; J.state = 'hurt'; J.st = 0.45; st.shake = 16; st.combo = 0;
    text(L.jx, L.floor - L.ch * 1.1, msg || DX.T('아야!'), '#ff6b5b', 26);
    DX.S && DX.S.boom(false);
    for (const o of st.zs) if (o.state !== 'fly' && o.state !== 'drop') o.x += L.ch * 0.25 * Math.sign(o.x - L.jx || 1);
  }
  // 처음 만난 좀비 특징 알려주기 (한 번씩)
  function teach(key, msg) {
    if (st.taught[key]) return; st.taught[key] = true;
    const L = layout(); text(L.w / 2, Math.min(L.h - 140, L.by + L.bh + 20), DX.T(msg), '#ffffff', 20, 2.4);
  }
  function text(x, y, s, col, size, life) { st.texts.push({ x, y, s, col, size, t: 0, max: life || 0.8 }); }
  function burst(x, y, col, n) { for (let i = 0; i < n; i++) { const a = rand(0, 6.28), sp = rand(200, 500); st.stars.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, max: rand(0.25, 0.45), col, s: rand(5, 10) }); } }

  function spawn(q, L) {
    const z = { type: q.type, side: q.side, x: q.side > 0 ? L.w + L.ch * 0.5 : -L.ch * 0.5, y: 0, hp: st.hits[q.type] || 2, state: 'walk', st: 0, ph: rand(0, 6), spd: rand(0.55, 0.8), flash: 0, hop: 0, hopCd: rand(0.4, 1.0) };
    if (q.type === 'box') z.spd *= 0.75;
    if (q.type === 'dancer') z.spd *= 1.25;
    if (q.drop) { z.state = 'drop'; z.x = L.jx + q.side * rand(L.ch * 0.9, L.w * 0.6); z.y = -L.h * 0.8; z.vy = 0; }
    st.zs.push(z);
    if (q.type === 'riot') teach('riotSee', '🛡️ 경찰 좀비! 방패가 열릴 때 때리세요');
  }

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
      const el = st.maxTime - st.time;
      for (const q of st.queue) { q.at -= dt; if (q.at <= 0 && !q.spawned) { q.spawned = true; spawn(q, L); } }
      // 지붕: 표지판 경보 (경고 1.1초 → 위험 0.5초). 위험 순간 서 있는 좀비는 표지판에 맞고 날아감
      if (st.scene === 'roof' && !st.signDone && el > st.signAt) { st.signDone = true; st.sign = { phase: 'warn', t: 1.1 }; text(L.w / 2, L.floor - L.ch * 1.75, DX.T('⚠️ 표지판 접근! 손 떼!'), '#ff4a4a', 30, 1.2); DX.S && DX.S.alarm && DX.S.alarm(); }
      if (st.sign) {
        st.sign.t -= dt;
        if (st.sign.phase === 'warn' && st.sign.t <= 0) {
          st.sign = { phase: 'hit', t: 0.5, x: L.w + 60 };
          let n = 0;
          for (const z of st.zs) if (z.state === 'walk' || z.state === 'lunge') { knockOut(z, L, -1, DX.T('표지판 직격!')); n++; }
          if (n) text(L.w / 2, L.floor - L.ch * 1.75, DX.T('표지판이 좀비를 쓸어갔다!'), '#ffd23d', 24, 1.2);
        } else if (st.sign.phase === 'hit') { st.sign.x -= L.w * 3.2 * dt; if (st.sign.t <= 0) st.sign = null; }
      }
      for (const z of st.zs) {
        z.flash = Math.max(0, z.flash - dt);
        if (z.state === 'fly') continue;
        z.ph += dt * 9;
        if (z.state === 'drop') {   // 위에서 뛰어내림
          z.vy += 2600 * dt; z.y += z.vy * dt;
          if (z.y >= 0) { z.y = 0; z.state = 'walk'; st.shake = Math.max(st.shake, 5); burst(z.x, L.floor, '#d8c7a0', 6); }
          continue;
        }
        const dx = (z.x - L.jx) * z.side;
        if (z.type === 'dancer' && z.state === 'walk') {   // 댄서: 깡충깡충
          z.hopCd -= dt;
          if (z.hop > 0) { z.hop -= dt; z.y = -Math.sin((1 - z.hop / 0.5) * Math.PI) * L.ch * 0.45; }
          else { z.y = 0; if (z.hopCd <= 0 && dx > L.ch * 0.4) { z.hop = 0.5; z.hopCd = rand(0.9, 1.6); } }
        }
        if (z.state === 'walk') {
          if (dx > L.ch * 0.55) z.x -= z.side * L.ch * z.spd * (z.hop > 0 ? 1.8 : 1) * dt;
          else if (!(z.hop > 0)) { z.state = 'lunge'; z.st = z.type === 'riot' ? 0.7 : 0.45; }
        } else if (z.state === 'lunge') {
          z.st -= dt;
          if (z.st <= 0) {
            if (dx < L.ch * 0.75) hurtHero(L);
            z.state = 'walk';
          }
        }
      }
      st.zs = st.zs.filter(z => !(z.state === 'fly' && (z.y > L.h || z.x > L.w + 400 || z.x < -400)));
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
    st.texts = st.texts.filter(t => t.t < t.max);
  }
  function finish(win) { st.phase = 'end'; st.phaseT = 1.2; st.sign = null; st.result = { win, kills: st.kills }; if (win) { st.flash = 0.2; DX.S && DX.S.level(); } }
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

  /* ---------- 그림이 없을 때 코드로 그리는 배경 ---------- */
  // 글자가 화면보다 넓으면 줄여서 그리기
  function fitText(s, x, y, size, maxW, col, lw) {
    g.font = size + 'px ' + FONT; const w = g.measureText(s).width;
    if (w > maxW) { size = Math.max(12, Math.floor(size * maxW / w)); g.font = size + 'px ' + FONT; }
    g.lineWidth = lw || 6; g.strokeStyle = '#11131a'; g.strokeText(s, x, y); g.fillStyle = col; g.fillText(s, x, y);
  }
  function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function drawEngineRoom(L) {
    const { bx, by, bw, bh } = L, fl = L.floor;
    g.save(); rr(bx + bw * 0.04, by, bw * 0.92, bh * 0.86, 18); g.clip();
    let gr = g.createLinearGradient(0, by, 0, fl); gr.addColorStop(0, '#2b211e'); gr.addColorStop(1, '#4a3328'); g.fillStyle = gr; g.fillRect(bx, by, bw, bh);
    // 파이프
    g.strokeStyle = '#8a6a4a'; g.lineWidth = bh * 0.035;
    for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(bx, by + bh * (0.12 + i * 0.07)); g.lineTo(bx + bw, by + bh * (0.12 + i * 0.07)); g.stroke(); }
    // 보일러 화구 (가운데, 깜빡이는 불빛)
    const cx = bx + bw * 0.5, cy = by + bh * 0.45, r = bh * 0.2, fl1 = 0.75 + Math.sin(st.t * 13) * 0.12 + Math.random() * 0.08;
    g.fillStyle = '#3b3b42'; rr(cx - r * 1.6, cy - r * 1.4, r * 3.2, r * 2.9, 16); g.fill();
    gr = g.createRadialGradient(cx, cy, r * 0.1, cx, cy, r); gr.addColorStop(0, 'rgba(255,240,160,' + fl1 + ')'); gr.addColorStop(0.5, 'rgba(255,120,30,' + fl1 + ')'); gr.addColorStop(1, 'rgba(120,20,0,0.9)');
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, 6.28); g.fill();
    g.strokeStyle = '#1b1b20'; g.lineWidth = 6; g.stroke();
    // 압력계
    for (const k of [-1, 1]) {
      const gx = cx + k * r * 2.4, gy = by + bh * 0.3;
      g.fillStyle = '#e8e2d0'; g.beginPath(); g.arc(gx, gy, bh * 0.06, 0, 6.28); g.fill(); g.strokeStyle = '#6a5a3a'; g.lineWidth = 4; g.stroke();
      const a = -2.2 + Math.sin(st.t * 3 + k) * 0.5 + 2.6 * (1 - st.time / st.maxTime);
      g.strokeStyle = '#d62828'; g.lineWidth = 3; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx + Math.cos(a) * bh * 0.05, gy + Math.sin(a) * bh * 0.05); g.stroke();
    }
    // 바닥 철판
    g.fillStyle = '#55555e'; g.fillRect(bx, fl - 4, bw, bh); g.fillStyle = '#ffc400'; g.fillRect(bx, fl - 6, bw, 5);
    g.fillStyle = 'rgba(0,0,0,0.25)'; for (let x = bx; x < bx + bw; x += 48) g.fillRect(x, fl, 2, bh);
    // 석탄 더미
    g.fillStyle = '#18181c'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(bx + bw * 0.1 + i * 10, fl - 6 - (i % 3) * 8, 12, 0, 6.28); g.fill(); }
    // 붉은 조명
    g.fillStyle = 'rgba(255,90,20,' + (0.08 + Math.sin(st.t * 13) * 0.03) + ')'; g.fillRect(bx, by, bw, bh);
    g.restore();
    g.strokeStyle = '#ffc400'; g.lineWidth = 6; rr(bx + bw * 0.04, by, bw * 0.92, bh * 0.86, 18); g.stroke();
  }
  function drawRoof(L) {
    const { w, h } = L, fl = L.floor, th = st.theme;
    let gr = g.createLinearGradient(0, 0, 0, fl); gr.addColorStop(0, th.skyTop || '#7fb2e5'); gr.addColorStop(1, th.skyBottom || '#f7d49b'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    // 먼 산 (천천히 흐름)
    const off = (st.t * 60) % 240;
    g.fillStyle = 'rgba(120,70,50,0.55)';
    g.beginPath(); g.moveTo(0, fl - 10);
    for (let x = -240; x < w + 240; x += 120) { g.lineTo(x - off, fl - 60 - ((x / 120) % 2 ? 50 : 15)); g.lineTo(x - off + 60, fl - 70 - ((x / 120) % 3) * 18); }
    g.lineTo(w, fl - 10); g.closePath(); g.fill();
    // 바람 선
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 2;
    for (let i = 0; i < 14; i++) { const y = (i * 53) % (fl - 40) + 20, x = w - ((st.t * 900 + i * 197) % (w + 300)); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 70 + (i % 3) * 30, y); g.stroke(); }
    // 지붕
    g.fillStyle = '#7d8590'; g.fillRect(0, fl - 2, w, h * 0.06);
    g.fillStyle = '#ffc400'; g.fillRect(0, fl - 6, w, 5);
    g.fillStyle = '#4a5160'; g.fillRect(0, fl + h * 0.06 - 2, w, h);
    g.fillStyle = '#ffd23d'; for (let x = -((st.t * 900) % 80); x < w; x += 80) { g.beginPath(); g.moveTo(x, fl + h * 0.06); g.lineTo(x + 40, fl + h * 0.06); g.lineTo(x + 20, fl + h * 0.06 + 22); g.fill(); }
    g.fillStyle = '#5c636e'; for (let x = -((st.t * 900) % 260); x < w; x += 260) rr(x, fl - 24, 54, 20, 5), g.fill();
  }

  function draw() {
    const L = layout(), S = DX.SPR.fight;
    g.clearRect(0, 0, L.w, L.h);
    g.fillStyle = 'rgba(5,7,12,0.88)'; g.fillRect(0, 0, L.w, L.h);
    g.save();
    if (st.shake > 0 && DX.save.shake !== false) g.translate(rand(-st.shake, st.shake), rand(-st.shake, st.shake));
    if (L.bg) g.drawImage(L.bg, L.bx, L.by, L.bw, L.bh);
    else if (st.scene === 'engine') drawEngineRoom(L);
    else if (st.scene === 'roof') drawRoof(L);
    // 생존자
    const J = st.jack, jf = S[st.hero] || S.jack, one = !!jf.single;
    const jImg = J.state === 'swing' ? jf[1] : J.state === 'hurt' ? jf[2] : jf[0];
    const jb = J.state === 'ready' ? Math.sin(st.t * 6) * 2 : 0;
    const jr = J.state === 'hurt' ? -0.15 : one && J.state === 'swing' ? 0.28 : 0;
    drawPose(jImg, L.jx + J.push * 10 * J.dir, L.floor + jb, L.ch * (J.state === 'swing' ? 1.05 : 1) * (one ? 1.05 : 1), jr * J.dir, J.dir < 0, 1, J.state === 'hurt' && one ? 0.05 : 0);
    // 좀비
    const zs = st.zs.slice().sort((a, b) => Math.abs(b.x - L.jx) - Math.abs(a.x - L.jx));
    for (const z of zs) {
      const f = S[z.type] || S.office; if (!f) continue;
      const img = z.state === 'fly' ? f[2] : z.state === 'lunge' ? f[1] : f[0];
      const bob = z.state === 'walk' && !(z.hop > 0) ? Math.abs(Math.sin(z.ph)) * 6 : 0;
      let lean = z.state === 'lunge' ? -0.12 + Math.sin(st.t * 40) * 0.03 : Math.sin(z.ph) * 0.05;
      if (z.type === 'dancer' && z.hop > 0) lean = Math.sin(st.t * 20) * 0.25;
      const flip = z.side < 0;
      drawPose(img, z.x, L.floor - bob + (z.y || 0), L.ch * (z.type === 'box' ? 1.0 : 0.98), (z.state === 'fly' ? z.rot : lean) * (flip ? -1 : 1), flip, 1, z.flash);
      // 경찰 방패 표시: 방패 든 동안 파란 테두리, 열리면 노란 느낌표
      if (z.type === 'riot' && z.state !== 'fly' && z.state !== 'drop') {
        g.font = '28px ' + FONT; g.textAlign = 'center';
        if (z.state === 'lunge') { g.fillStyle = '#ffd23d'; g.fillText('❗', z.x, L.floor - L.ch * 1.15); }
        else { g.fillStyle = 'rgba(120,200,255,0.9)'; g.fillText('🛡️', z.x, L.floor - L.ch * 1.15); }
      }
    }
    // 표지판
    if (st.sign) {
      if (st.sign.phase === 'warn') { g.fillStyle = 'rgba(255,40,40,' + (0.12 + Math.abs(Math.sin(st.t * 14)) * 0.18) + ')'; g.fillRect(0, 0, L.w, L.h); }
      else { const sy = L.floor - L.ch * 1.25; g.fillStyle = '#2f3540'; g.fillRect(st.sign.x - 8, 0, 16, sy); g.fillStyle = '#1f7a3a'; rr(st.sign.x - 90, sy - 40, 180, 60, 8); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke(); g.fillStyle = '#fff'; g.font = '22px ' + FONT; g.textAlign = 'center'; g.fillText(DX.T('지옥역 →'), st.sign.x, sy - 2); }
    }
    for (const s of st.stars) { g.globalAlpha = 1 - s.t / s.max; g.fillStyle = s.col; g.beginPath(); g.arc(s.x, s.y, s.s, 0, 6.28); g.fill(); }
    g.globalAlpha = 1;
    g.restore();
    // 글자
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    for (const t of st.texts) {
      const sc = t.t < 0.1 ? 0.6 + t.t * 5 : 1.1;
      g.globalAlpha = Math.min(1, (t.max - t.t) * 3);
      fitText(t.s, Math.max(L.w * 0.08, Math.min(L.w * 0.92, t.x)), t.y - t.t * 40, Math.round(t.size * sc), L.w * 0.94, t.col);
    }
    g.globalAlpha = 1;
    // 상단 정보
    const top = Math.max(60, L.by - 70);
    fitText(DX.T(st.sc.title || '🚨 실내 침입! 연타로 쫓아내라'), L.w / 2, top, 26, L.w * 0.94, '#ff6b5b');
    const tb = Math.max(0, st.time / st.maxTime);
    g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(L.w * 0.15, top + 26, L.w * 0.7, 12);
    g.fillStyle = tb < 0.3 ? '#ff4a4a' : '#ffd23d'; g.fillRect(L.w * 0.15, top + 26, L.w * 0.7 * Math.min(1, tb), 12);
    g.font = '22px ' + FONT;
    g.textAlign = 'left'; g.fillStyle = '#ff5a6a'; g.fillText('♥'.repeat(Math.max(0, J.hp)) + '♡'.repeat(Math.max(0, 3 - J.hp)), L.w * 0.15, top + 58);
    g.textAlign = 'right'; g.fillStyle = '#fff'; g.fillText(DX.L('격퇴 ', '击退 ') + st.kills + ' / ' + st.total, L.w * 0.85, top + 58);
    g.textAlign = 'center';
    // 안내 / 결과
    const by = Math.min(L.h - 80, L.by + L.bh + 60);
    if (st.phase === 'intro') {
      g.font = '40px ' + FONT; g.lineWidth = 8;
      g.strokeText('READY...', L.w / 2, L.h * 0.47); g.fillStyle = '#fff'; g.fillText('READY...', L.w / 2, L.h * 0.47);
      fitText(DX.T(st.sc.hint || '👆 화면 연타!!'), L.w / 2, L.h * 0.47 + 48, 22, L.w * 0.92, '#ffd23d', 5);
    } else if (st.phase === 'go') {
      g.font = '28px ' + FONT; g.lineWidth = 6;
      const pulse = 1 + Math.sin(st.t * 12) * 0.06;
      const hint = st.sign ? DX.T('✋ 손 떼!!') : DX.T(st.sc.hint || '👆 화면 연타!!');
      g.save(); g.translate(L.w / 2, by); g.scale(pulse, pulse);
      fitText(hint, 0, 0, 28, L.w * 0.86, st.sign ? '#ff4a4a' : '#ffd23d'); g.restore();
      if (st.combo >= 3) { g.font = '24px ' + FONT; g.strokeText(st.combo + ' HIT', L.w / 2, by + 40); g.fillStyle = '#fff'; g.fillText(st.combo + ' HIT', L.w / 2, by + 40); }
      if (st.scene === 'engine') {   // 좌우 터치 영역 표시
        g.globalAlpha = 0.18 + (J.state === 'swing' ? 0.12 : 0); g.fillStyle = '#ffffff';
        g.fillRect(J.dir < 0 ? 0 : L.w / 2, L.h - 70, L.w / 2, 70); g.globalAlpha = 1;
        g.font = '26px ' + FONT; g.fillStyle = '#fff'; g.fillText('👈', L.w * 0.25, L.h - 35); g.fillText('👉', L.w * 0.75, L.h - 35);
      }
    } else if (st.phase === 'end') {
      const w = st.result.win;
      g.font = '48px ' + FONT; g.lineWidth = 9;
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
  F._st = () => st;
})(window.DX);
