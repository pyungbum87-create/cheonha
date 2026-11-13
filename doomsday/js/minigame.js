/* ==========================================================================
   minigame.js — 웨이브 사이 미니게임 5종 (기존 그림만 재활용)
     parcel : 택배 받아치기      (객차 · 잭)    상자가 노란 동그라미에 닿을 때 탭
     golf   : 사장님 골프공 받아치기 (소피)     위 공 = 화면 위쪽 탭 / 아래 공 = 아래쪽 탭
     sniper : 지붕 저격          (민호)        다가오는 좀비를 직접 터치, 드럼통 터치 = 광역 폭발
     boiler : 보일러 압력 맞추기  (기관실)      꾹 = 압력↑ / 떼기 = 압력↓, 초록 칸 안에 유지
     supply : 휴게소 보급 달리기  (소피)        왼쪽/오른쪽 터치로 줄 바꾸기, 연료·호두과자 줍고 장애물 피하기
   언제 나오는지·보상: config.js 의 minigames
   테스트: 주소 뒤에 ?mini=golf (또는 parcel/sniper/boiler/supply) &ms=3 (스테이지 0~7) 을 붙이면 바로 실행
   ========================================================================== */
window.DX = window.DX || {};
(function (DX) {
  'use strict';
  const M = DX.MINI = {};
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const FONT = "'Black Han Sans', 'Noto Sans SC', sans-serif";
  const L_ = (ko, zh) => DX.L ? DX.L(ko, zh) : ko;
  const snd = k => { try { DX.S && DX.S[k] && DX.S[k](); } catch (e) {} };
  const vib = k => { try { DX.vib && DX.vib(k); } catch (e) {} };
  let cv = null, g = null, st = null, raf = 0, last = 0, W = 360, H = 640;

  /* ---------- 그림 ---------- */
  const IM = {};
  function img(src) {
    if (!IM[src]) { const i = new Image(); i.src = src + (DX.BUILD ? '?v=' + DX.BUILD : ''); IM[src] = i; }
    const i = IM[src]; return i.complete && i.naturalWidth ? i : null;
  }
  const FXI = k => img('assets/fx/' + k + '.png');
  const PROP = k => img('assets/props/' + k + '.png');
  const PORT = i => img('assets/portraits/survivor' + (i + 1) + '.png');
  function pose(k, i) { const S = DX.SPR || {}, f = S.fight && S.fight[k]; if (f && f.length) return f[Math.min(i, f.length - 1)]; return (S.clean && S.clean[k]) || null; }
  function clean(k) { const S = DX.SPR || {}; return (S.clean && S.clean[k]) || pose(k, 0); }
  function fbg(k) { const S = DX.SPR || {}; return (S.fight && S.fight[k]) || null; }
  M.preload = function () {
    ['crate', 'bomb', 'explosion', 'smoke', 'barrel', 'gear', 'muzzle', 'sonic'].forEach(FXI);
    ['gas', 'box', 'wreck1', 'wreck2', 'barrel_siren'].forEach(PROP);
    [0, 1, 2].forEach(PORT);
  };

  /* ---------- 그리기 도우미 ---------- */
  function drawImg(im, x, y, h, o) {
    o = o || {};
    const iw = im ? (im.width || im.naturalWidth) : 1, ih = im ? (im.height || im.naturalHeight) : 1.4;
    const w = h * iw / ih, ax = o.ax == null ? 0.5 : o.ax, ay = o.ay == null ? 1 : o.ay;
    g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot); if (o.flip) g.scale(-1, 1);
    if (o.alpha != null) g.globalAlpha = o.alpha;
    if (im) g.drawImage(im, -w * ax, -h * ay, w, h);
    else { g.fillStyle = o.col || '#6a8a5a'; g.fillRect(-w * ax, -h * ay, w, h); }
    if (o.flash && im) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = o.flash; g.drawImage(im, -w * ax, -h * ay, w, h); }
    g.restore();
    return w;
  }
  function grad(top, bot) { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  // 옆에서 보는 실내 배경 (fight.js 와 같은 배치)
  function band(im, cy) {
    const ar = im ? im.height / im.width : 0.48;
    const bw = Math.max(W * 1.55, H * 0.9), bh = bw * ar, bx = (W - bw) / 2, by = H * (cy || 0.47) - bh / 2;
    return { im, bw, bh, bx, by, floor: by + bh * 0.72, ch: bh * 0.48 };
  }
  function cover(im, fy) {
    if (!im) return false;
    const iw = im.width || im.naturalWidth, ih = im.height || im.naturalHeight, s = Math.max(W / iw, H / ih), w = iw * s, h = ih * s;
    g.drawImage(im, (W - w) / 2, (H - h) * (fy == null ? 0.5 : fy), w, h); return true;
  }
  function ring(x, y, r, col, lw) { g.beginPath(); g.arc(x, y, Math.max(1, r), 0, 6.283); g.strokeStyle = col; g.lineWidth = lw || 3; g.stroke(); }
  function fitText(s, x, y, size, maxW, col, lw, align) {
    g.font = size + 'px ' + FONT; const m = g.measureText(s).width;
    if (maxW && m > maxW) { size = Math.max(10, Math.floor(size * maxW / m)); g.font = size + 'px ' + FONT; }
    g.textAlign = align || 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    g.lineWidth = lw == null ? Math.max(3, size * 0.22) : lw; g.strokeStyle = '#000'; if (g.lineWidth) g.strokeText(s, x, y);
    g.fillStyle = col || '#fff'; g.fillText(s, x, y);
  }
  function wrap(s, maxW, size) {
    g.font = size + 'px ' + FONT; const out = []; let cur = '';
    for (const ch of s) { if (g.measureText(cur + ch).width > maxW && cur) { out.push(cur); cur = ch === ' ' ? '' : ch; } else cur += ch; }
    if (cur) out.push(cur); return out;
  }
  function text(x, y, s, col, size, life) {
    for (let k = 0; k < 4; k++) { if (!st.texts.some(o => o.t < o.max * 0.7 && Math.abs(o.y - y) < 28 && Math.abs(o.x - x) < 110)) break; y -= 30; }
    if (st.texts.length > 8) st.texts.shift();
    st.texts.push({ x, y, s, col: col || '#fff', size: size || 24, t: 0, max: life || 0.8 });
  }
  function burst(x, y, col, n) { for (let i = 0; i < n; i++) { const a = rand(0, 6.28), sp = rand(150, 420); st.stars.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, max: rand(0.25, 0.45), col, s: rand(4, 9) }); } }
  function boom(k, x, y, h, life) { st.fx.push({ k, x, y, h, t: 0, max: life || 0.45 }); }
  function hurt(msg) { st.red = 0.7; st.shake = Math.max(st.shake, 9); st.combo = 0; vib('medium'); snd('lose'); return msg; }

  /* ================= 게임들 ================= */
  const GAMES = {};

  /* ---- 1. 택배 받아치기 ---- */
  GAMES.parcel = {
    title: () => L_('📦 택배 받아치기!', '📦 反击快递！'), who: 0,
    line: () => L_('택배 좀비가 객차로 상자를 던진다! 전부 돌려보내 주자!', '快递僵尸往车厢扔箱子！全部打回去！'),
    hint: () => [L_('상자가 노란 동그라미에 닿을 때 탭!', '箱子碰到黄圈时点击！'), L_('💣 착불 폭탄은 점수 2배', '💣 炸弹包裹双倍分')],
    geo() { const B = band(fbg('bg')), hh = B.ch; return { B, hh, floor: B.floor, hx: W * 0.22, zx: W * 0.8, tx: W * 0.22 + hh * 0.34, ty: B.floor - hh * 0.62, sx: W * 0.8 - hh * 0.25, sy: B.floor - hh * 0.78 }; },
    init(s) {
      const d = s.d, n = 10 + Math.min(6, s.stage); let t = 1.0;
      d.ps = [];
      for (let i = 0; i < n; i++) {
        const bomb = i > 2 && Math.random() < 0.22;
        d.ps.push({ t0: t, dur: rand(0.95, 1.3) * (1 - s.stage * 0.035) * (bomb ? 0.85 : 1), bomb, st: 'wait', u: 0 });
        t += rand(0.8, 1.25) * (1 - s.stage * 0.03);
        if (i > 3 && Math.random() < 0.2) t -= 0.4;   // 가끔 연속 투척
      }
      s.max = d.ps.reduce((a, p) => a + (p.bomb ? 4 : 2), 0);
      d.swing = 0; d.cd = 0; d.hurtT = 0; d.zhit = 0;
    },
    at(p, G) { const u = p.u; return [lerp(G.sx, G.tx, u), lerp(G.sy, G.ty, u) - Math.sin(Math.PI * clamp(u, 0, 1)) * H * 0.15]; },
    update(s, dt) {
      const d = s.d, G = this.geo();
      d.swing -= dt; d.cd -= dt; d.hurtT -= dt; d.zhit -= dt;
      for (const p of d.ps) {
        if (p.st === 'wait' && s.t >= p.t0) { p.st = 'fly'; snd('click'); }
        if (p.st === 'fly') {
          p.u += dt / p.dur;
          if (p.u > 1.12) {
            p.st = 'miss'; d.hurtT = 0.45;
            if (p.bomb) boom('explosion', G.tx, G.ty, G.hh * 0.8);
            text(G.hx, G.ty - G.hh * 0.5, hurt(L_('아야!', '哎哟！')), '#ff6b5b', 26);
          }
        } else if (p.st === 'back') {
          p.u -= dt / 0.32;
          if (p.u <= 0) {
            p.st = 'done'; d.zhit = 0.3; s.shake = Math.max(s.shake, p.bomb ? 12 : 5);
            burst(G.sx, G.sy, p.bomb ? '#ff9a3d' : '#ffe066', p.bomb ? 16 : 8);
            if (p.bomb) { boom('explosion', G.zx, G.sy, G.hh); snd('boom'); } else snd('kill');
          }
        }
      }
      if (d.ps.every(p => p.st === 'miss' || p.st === 'done')) finish();
    },
    down(s) {
      const d = s.d, G = this.geo();
      if (d.cd > 0 || d.hurtT > 0.25) return;
      d.swing = 0.18; d.cd = 0.2;
      let best = null;
      for (const p of d.ps) if (p.st === 'fly' && p.u >= 0.74 && p.u <= 1.08 && (!best || p.u > best.u)) best = p;
      if (!best) { text(G.tx, G.ty - 50, L_('헛스윙!', '挥空！'), '#c9d4e0', 20); s.combo = 0; return; }
      const perfect = best.u >= 0.87 && best.u <= 1.02;
      best.st = 'back'; best.u = Math.min(best.u, 1);
      s.score += (perfect ? 2 : 1) * (best.bomb ? 2 : 1); s.combo++;
      const [x, y] = this.at(best, G);
      burst(x, y, perfect ? '#ffd23d' : '#ffffff', perfect ? 12 : 6); boom('sonic', x, y, G.hh * 0.5, 0.25);
      text(x, y - 40, perfect ? L_('퍼펙트!!', '完美！！') : L_('받아쳤다!', '打回去！'), perfect ? '#ffd23d' : '#ffffff', perfect ? 30 : 24);
      s.shake = Math.max(s.shake, perfect ? 7 : 4); snd(perfect ? 'level' : 'kill'); vib('light');
    },
    draw(s) {
      const d = s.d, G = this.geo(), B = G.B;
      grad('#1d1712', '#0a0806'); if (B.im) g.drawImage(B.im, B.bx, B.by, B.bw, B.bh);
      const ready = s.phase === 'go' && d.ps.some(p => p.st === 'fly' && p.u >= 0.74 && p.u <= 1.08);
      g.globalAlpha = 0.9; ring(G.tx, G.ty, G.hh * 0.2 * (ready ? 1 + Math.sin(s.t * 30) * 0.06 : 1), ready ? '#ffd23d' : 'rgba(255,255,255,0.55)', ready ? 6 : 3); g.globalAlpha = 1;
      const throwing = d.ps.some(p => (p.st === 'wait' && p.t0 - s.t < 0.22) || (p.st === 'fly' && p.u < 0.12));
      drawImg(pose('box', d.zhit > 0 ? 2 : throwing ? 1 : 0), G.zx + (d.zhit > 0 ? 14 : 0), G.floor, G.hh);
      drawImg(pose('jack', d.hurtT > 0 ? 2 : d.swing > 0 ? 1 : 0), G.hx, G.floor, G.hh);
      for (const p of d.ps) if (p.st === 'fly' || p.st === 'back') {
        const [x, y] = this.at(p, G);
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(x, G.floor - 4, G.hh * 0.1, G.hh * 0.03, 0, 0, 6.28); g.fill();
        drawImg(p.bomb ? FXI('bomb') : FXI('crate'), x, y, G.hh * (p.bomb ? 0.22 : 0.25), { ay: 0.5, rot: s.t * (p.st === 'back' ? -14 : 5), col: '#b07a46' });
      }
    },
    label: s => L_('점수 ', '得分 ') + s.score,
    ratio: s => s.score / Math.max(1, s.max * 0.8),
  };

  /* ---- 2. 사장님 골프공 받아치기 (리듬) ---- */
  GAMES.golf = {
    title: () => L_('⛳ 사장님 골프공 받아치기!', '⛳ 反击老板的高尔夫球！'), who: 2,
    line: () => L_('사장님이 골프공을 날린다! 노트북으로 박자 맞춰 받아칠게!', '老板在打高尔夫球！我用笔记本跟着节奏打回去！'),
    hint: () => [L_('⬆️ 위로 오는 공 = 화면 위쪽 탭', '⬆️ 高球 = 点屏幕上半'), L_('⬇️ 아래로 오는 공 = 화면 아래쪽 탭', '⬇️ 低球 = 点屏幕下半')],
    geo() { const floor = H * 0.76, hh = Math.min(H * 0.3, W * 0.56); return { floor, hh, hx: W * 0.2, cx: W * 0.8, tx: W * 0.2 + hh * 0.3, lanes: [floor - hh * 0.8, floor - hh * 0.3], sy: floor - hh * 1.05, mid: floor - hh * 0.55 }; },
    init(s) {
      const d = s.d, beat = 60 / (100 + s.stage * 3); let k = 3;
      d.T = 1.15 - s.stage * 0.03; d.notes = []; d.swing = 0; d.hurtT = 0; d.ceo = 0; d.lf = [0, 0];
      for (let i = 0; i < 18; i++) {
        d.notes.push({ at: 0.4 + k * beat, lane: Math.random() < 0.5 ? 0 : 1, gold: i > 2 && Math.random() < 0.15, st: 'wait' });
        k += Math.random() < 0.3 + i * 0.025 ? 1 : 2;
      }
      s.max = d.notes.reduce((a, n) => a + (n.gold ? 3 : 2), 0);
    },
    pos(n, s, G) {
      if (n.st === 'back') return [n.x, n.y];
      const u = 1 - (n.at - s.t) / s.d.T, y0 = G.sy, y1 = G.lanes[n.lane];
      return [lerp(G.cx - G.hh * 0.35, G.tx, u), lerp(y0, y1, u) - Math.sin(Math.PI * clamp(u, 0, 1)) * H * (n.lane ? 0.06 : 0.12)];
    },
    update(s, dt) {
      const d = s.d, G = this.geo();
      d.swing -= dt; d.hurtT -= dt; d.ceo -= dt; d.lf[0] -= dt; d.lf[1] -= dt;
      for (const n of d.notes) {
        if (n.st === 'wait' && s.t >= n.at - d.T) { n.st = 'fly'; d.ceo = 0.25; snd('pick'); }
        else if (n.st === 'fly' && s.t > n.at + 0.18) { n.st = 'miss'; d.hurtT = 0.4; text(G.hx, G.lanes[0] - 30, hurt(L_('아야!', '哎哟！')), '#ff6b5b', 24); }
        else if (n.st === 'back') { n.vy += 900 * dt; n.x += n.vx * dt; n.y += n.vy * dt; if (n.x > W + 40 || n.y > H + 40) n.st = 'done'; if (n.x > G.cx - 30 && !n.bonk) { n.bonk = true; d.ceo = -0.3; } }
      }
      if (d.notes.every(n => n.st === 'done' || (n.st === 'miss' && s.t > n.at + 0.6))) finish();
    },
    down(s, x, y) {
      const d = s.d, G = this.geo(), lane = y < G.mid ? 0 : 1;
      d.swing = 0.16; d.lf[lane] = 0.15;
      let best = null, bd = 9;
      for (const n of d.notes) if (n.st === 'fly' && n.lane === lane) { const e = Math.abs(s.t - n.at); if (e < bd) { bd = e; best = n; } }
      if (!best || bd > 0.2) { s.combo = 0; text(G.tx + 30, G.lanes[lane] - 40, L_('헛스윙!', '挥空！'), '#c9d4e0', 18); return; }
      const [bx, by] = this.pos(best, s, G);
      const j = bd < 0.075 ? 2 : bd < 0.15 ? 1 : 0;
      best.st = 'back'; best.x = bx; best.y = by; best.vx = rand(700, 900); best.vy = -rand(250, 450);
      if (j) { s.score += j + (best.gold ? 1 : 0); s.combo++; } else s.combo = 0;
      text(bx + 20, by - 36, j === 2 ? L_('나이스 샷!!', '好球！！') : j === 1 ? L_('굿!', '不错！') : L_('삐끗...', '偏了…'), j === 2 ? '#ffd23d' : j ? '#7dff8a' : '#c9d4e0', j === 2 ? 28 : 22);
      burst(bx, by, j === 2 ? '#ffd23d' : '#ffffff', j === 2 ? 12 : 5); snd(j === 2 ? 'level' : 'kill'); vib('light');
    },
    draw(s) {
      const d = s.d, G = this.geo(), th = s.opt.theme || {};
      grad(th.skyTop || '#04120e', th.skyBottom || '#0e2e26');
      g.fillStyle = th.groundCol || '#1d2a25'; g.fillRect(0, G.floor, W, H - G.floor);
      g.fillStyle = 'rgba(255,255,255,0.06)'; for (let i = 0; i < 6; i++) g.fillRect(((i * 97 - s.t * 160) % (W + 120) + W + 120) % (W + 120) - 60, G.floor + 18 + (i % 3) * 22, 60, 5);
      const sp = g.createRadialGradient(G.cx, G.floor, 10, G.cx, G.floor, G.hh * 1.3); sp.addColorStop(0, 'rgba(255,230,120,0.35)'); sp.addColorStop(1, 'rgba(255,230,120,0)'); g.fillStyle = sp; g.fillRect(0, 0, W, H);
      // 위·아래 터치 칸
      for (let l = 0; l < 2; l++) {
        g.fillStyle = 'rgba(255,255,255,' + (d.lf[l] > 0 ? 0.12 : 0.03) + ')'; g.fillRect(0, l ? G.mid : 0, W, l ? H - G.mid : G.mid);
        ring(G.tx, G.lanes[l], G.hh * 0.11, 'rgba(255,255,255,0.7)', 3);
        fitText(l ? '⬇' : '⬆', G.tx, G.lanes[l], 18, 0, '#fff', 3);
      }
      g.strokeStyle = 'rgba(255,255,255,0.15)'; g.setLineDash([8, 8]); g.beginPath(); g.moveTo(0, G.mid); g.lineTo(W, G.mid); g.lineWidth = 2; g.stroke(); g.setLineDash([]);
      drawImg(clean('ceo'), G.cx + G.hh * 0.08, G.floor, G.hh * 1.08, { rot: d.ceo > 0 ? -0.18 : d.ceo < -0.1 ? 0.12 : 0, flash: d.ceo < -0.1 ? 0.4 : 0 });
      drawImg(pose('sophie', d.hurtT > 0 ? 2 : d.swing > 0 ? 1 : 0), G.hx, G.floor, G.hh);
      for (const n of d.notes) {
        if (n.st === 'wait' || n.st === 'done' || (n.st === 'miss' && s.t > n.at + 0.35)) continue;
        const [x, y] = this.pos(n, s, G), r = G.hh * 0.065;
        if (n.st === 'fly') { const a = (n.at - s.t) / 0.7; if (a > 0 && a < 1) ring(G.tx, G.lanes[n.lane], G.hh * 0.11 * (1 + a * 1.6), n.gold ? '#ffd23d' : '#7de3ff', 3); }
        g.beginPath(); g.arc(x, y, r, 0, 6.28); g.fillStyle = n.gold ? '#ffd23d' : '#ffffff'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#333'; g.stroke();
        g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.2, r * 0.18, 0, 6.28); g.arc(x + r * 0.3, y + r * 0.25, r * 0.18, 0, 6.28); g.fill();
      }
      if (s.combo >= 3 && s.phase === 'go') fitText(s.combo + ' COMBO', W / 2, G.floor + 40, 24, 0, '#ffd23d');
    },
    label: s => L_('점수 ', '得分 ') + s.score,
    ratio: s => s.score / Math.max(1, s.max * 0.8),
  };

  /* ---- 3. 지붕 저격 ---- */
  const SN_TYPES = [['office', 1], ['office', 1], ['dancer', 1], ['box', 2], ['riot', 2]];
  GAMES.sniper = {
    title: () => L_('🎯 지붕 저격! 뚫어뻥 사격', '🎯 车顶狙击！'), who: 1, dur: 18,
    line: () => L_('지붕 위로 좀비가 몰려와요! 하나씩 맞혀서 떨어뜨릴게요!', '僵尸冲上车顶了！一个个打下去！'),
    hint: () => [L_('다가오는 좀비를 직접 터치!', '直接点击靠近的僵尸！'), L_('🛢️ 굴러오는 드럼통을 쏘면 펑!', '🛢️ 打油桶会爆炸！')],
    geo() { return { hy: H * 0.5, ny: H * 0.86 }; },
    init(s) { const d = s.d; d.zs = []; d.spawnT = 0.4; d.spawned = 0; d.leaks = 0; d.barrelT = 4; d.barrel = null; d.tr = []; d.cd = 0; d.ax = W / 2; d.ay = H / 2; d.gun = 0; s.max = 1; },
    zp(z) { const G = this.geo(), k = Math.pow(z.z, 1.35), h = lerp(H * 0.05, H * 0.3, k); return { x: W / 2 + (z.x0 - 0.5) * W * lerp(0.55, 1.05, k) + (z.type === 'dancer' ? Math.sin(z.ph + z.z * 9) * W * 0.07 * k : 0), y: lerp(G.hy, G.ny, k) + (z.st === 'dead' ? z.dy : 0), h }; },
    update(s, dt) {
      const d = s.d, G = this.geo();
      d.cd -= dt; d.gun -= dt;
      d.spawnT -= dt;
      if (d.spawnT <= 0 && s.t < this.dur - 1.5) {
        d.spawnT = rand(0.55, 0.95) * (1 - s.stage * 0.045);
        const pool = SN_TYPES.slice(0, 2 + Math.min(3, Math.floor(s.stage / 2) + 1)), tp = pick(pool);
        d.zs.push({ type: tp[0], hp: tp[1], x0: rand(0.08, 0.92), z: 0, spd: 1 / (rand(3.2, 4.3) * (1 - s.stage * 0.03)), ph: rand(0, 6), st: 'live', open: false, fl: 0, dy: 0 });
        d.spawned++;
      }
      for (const z of d.zs) {
        z.fl -= dt;
        if (z.st === 'live') { z.z += z.spd * dt; if (z.z >= 1) { z.st = 'gone'; d.leaks++; text(W / 2, H * 0.7, hurt(L_('지붕에 올라탔다!', '爬上车顶了！')), '#ff6b5b', 24); } }
        else if (z.st === 'dead') { z.vy += 2400 * dt; z.dy += z.vy * dt; z.rot += z.vr * dt; z.dt += dt; if (z.dt > 0.8) z.st = 'gone'; }
      }
      d.zs = d.zs.filter(z => z.st !== 'gone');
      d.barrelT -= dt;
      if (!d.barrel && d.barrelT <= 0) { const dir = Math.random() < 0.5 ? 1 : -1; d.barrel = { x: dir > 0 ? -40 : W + 40, dir, z: rand(0.35, 0.6), rot: 0 }; d.barrelT = rand(4.5, 6.5); }
      if (d.barrel) { const b = d.barrel; b.x += b.dir * W * 0.3 * dt; b.rot += b.dir * 4 * dt; if (b.x < -60 || b.x > W + 60) d.barrel = null; }
      for (const t of d.tr) t.t += dt; d.tr = d.tr.filter(t => t.t < 0.1);
      if (s.t >= this.dur) finish();
    },
    kill(s, z, P) {
      z.st = 'dead'; z.vy = -700; z.dt = 0; z.rot = 0; z.vr = rand(-10, 10); s.score++; s.combo++;
      burst(P.x, P.y - P.h * 0.5, '#ffe066', 8); snd('kill');
      text(P.x, P.y - P.h - 10, pick([L_('명중!', '命中！'), L_('뽁!', '啵！'), L_('헤드샷!', '爆头！')]), '#ffffff', 22);
    },
    down(s, x, y) {
      const d = s.d, G = this.geo();
      if (d.cd > 0) return; d.cd = 0.1; d.gun = 0.08; d.ax = x; d.ay = y;
      d.tr.push({ x, y, t: 0 }); snd('shot');
      if (d.barrel) {
        const b = d.barrel, by = lerp(G.hy, G.ny, Math.pow(b.z, 1.35)), bh = lerp(H * 0.05, H * 0.3, Math.pow(b.z, 1.35)) * 0.4;
        if (Math.abs(x - b.x) < bh * 0.7 && Math.abs(y - (by - bh * 0.5)) < bh * 0.7) {
          d.barrel = null; boom('explosion', b.x, by - bh * 0.5, H * 0.22, 0.55); s.shake = 14; snd('boom'); vib('heavy');
          text(b.x, by - bh - 20, L_('드럼통 펑!!', '油桶爆炸！！'), '#ff9a3d', 30);
          for (const z of d.zs) if (z.st === 'live') { const P = this.zp(z); if (Math.hypot(P.x - b.x, (P.y - P.h * 0.5) - by) < W * 0.34) this.kill(s, z, P); }
          return;
        }
      }
      const hits = d.zs.filter(z => z.st === 'live').map(z => ({ z, P: this.zp(z) })).filter(o => { const w = o.P.h * 0.55; return x > o.P.x - w / 2 && x < o.P.x + w / 2 && y > o.P.y - o.P.h && y < o.P.y + 6; }).sort((a, b) => b.z.z - a.z.z);
      if (!hits.length) { s.combo = 0; burst(x, y, '#b9a58a', 4); return; }
      const { z, P } = hits[0];
      z.hp--; z.fl = 0.12;
      if (z.hp > 0) { z.open = true; z.z = Math.max(0, z.z - 0.06); text(P.x, P.y - P.h - 10, z.type === 'riot' ? L_('팅! 방패', '叮！盾牌') : L_('단단해!', '好硬！'), '#9fd8ff', 20); snd('click'); burst(x, y, '#9fd8ff', 5); return; }
      this.kill(s, z, P);
    },
    draw(s) {
      const d = s.d, G = this.geo();
      grad('#7cc6ff', '#c98a5a'); cover(fbg('bgRoof'), 0.5);
      g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 0, W, H);
      const list = d.zs.slice().sort((a, b) => a.z - b.z);
      const drawZ = z => { const P = this.zp(z), left = P.x < W / 2; drawImg(pose(z.type, z.st === 'dead' ? 2 : z.open ? 1 : 0), P.x, P.y, P.h, { flip: left, rot: z.st === 'dead' ? z.rot : 0, flash: z.fl > 0 ? 0.6 : 0 }); };
      for (const z of list) if (!d.barrel || z.z < d.barrel.z) drawZ(z);
      if (d.barrel) { const b = d.barrel, k = Math.pow(b.z, 1.35), by = lerp(G.hy, G.ny, k), bh = lerp(H * 0.05, H * 0.3, k) * 0.4; drawImg(FXI('barrel'), b.x, by - bh * 0.5, bh, { ay: 0.5, rot: b.rot, col: '#c0392b' }); }
      for (const z of list) if (d.barrel && z.z >= d.barrel.z) drawZ(z);
      // 총알 궤적 + 조준점
      const gx = W * 0.74, gy = H * 0.86;
      for (const t of d.tr) { g.strokeStyle = 'rgba(255,240,150,' + (1 - t.t * 10) + ')'; g.lineWidth = 4; g.beginPath(); g.moveTo(gx - 30, gy - H * 0.17); g.lineTo(t.x, t.y); g.stroke(); }
      if (s.phase === 'go') { ring(d.ax, d.ay, 16, 'rgba(255,80,80,0.9)', 2.5); g.fillStyle = 'rgba(255,80,80,0.9)'; g.fillRect(d.ax - 22, d.ay - 1, 44, 2); g.fillRect(d.ax - 1, d.ay - 22, 2, 44); }
      drawImg(clean('minho'), gx, H * 1.04, H * 0.3, { rot: clamp((d.ax - gx) / W, -0.4, 0.4) * 0.3 + (d.gun > 0 ? 0.03 : 0) });
      if (d.gun > 0) drawImg(FXI('muzzle'), gx - 34, gy - H * 0.18, H * 0.07, { ay: 0.5, rot: -1.2 });
    },
    label: s => L_('처치 ', '击倒 ') + s.score,
    ratio(s) { const d = s.d, far = d.zs.filter(z => z.st === 'live' && z.z < 0.3).length; return (s.score - d.leaks * 0.5) / Math.max(1, d.spawned - far); },
  };

  /* ---- 4. 보일러 압력 ---- */
  GAMES.boiler = {
    title: () => L_('🔥 보일러 압력 맞추기!', '🔥 锅炉压力调节！'), who: 1, dur: 16,
    line: () => L_('보일러 압력이 떨어졌어요! 석탄 넣을 테니 바늘 좀 봐 주세요!', '锅炉压力下降了！我来加煤，你盯着指针！'),
    hint: () => [L_('✋ 꾹 누르기 = 압력 올리기', '✋ 按住 = 加压'), L_('바늘을 초록 칸 안에 계속 유지!', '让指针保持在绿色区域！')],
    geo() { const B = band(fbg('bgEngine'), 0.3), R = Math.min(W * 0.36, H * 0.19); return { B, R, cx: W / 2, cy: H * 0.8 }; },
    init(s) { const d = s.d; d.p = 0.25; d.v = 0; d.c = 0.55; d.ct = 0.55; d.cT = 2.2; d.prog = 0; d.bursts = 0; d.need = 7; d.zw = 0.1 - Math.min(0.035, s.stage * 0.005); d.inZ = false; d.sh = 0; d.puff = 0; s.max = 100; },
    update(s, dt) {
      const d = s.d, G = this.geo();
      const acc = s.down ? 1.5 : -1.15;
      d.v = clamp(d.v + acc * dt, -0.75, 0.75); d.p += d.v * dt;
      if (d.p < 0) { d.p = 0; d.v = 0; }
      if (s.down) { d.sh += dt; if (d.sh > 0.3) { d.sh = 0; snd('click'); } }
      if (d.p >= 1) {
        d.p = 0.5; d.v = -0.2; d.bursts++; d.prog = Math.max(0, d.prog - 0.12);
        boom('smoke', G.cx, G.cy - G.R * 0.6, G.R * 1.6, 0.8); boom('smoke', W * 0.3, G.B.by + G.B.bh * 0.3, G.R * 1.2, 0.8);
        text(G.cx, G.cy - G.R - 30, hurt(L_('펑! 과열!!', '砰！过热！！')), '#ff6b5b', 30);
      }
      d.cT -= dt; if (d.cT <= 0) { d.ct = rand(0.3, 0.78); d.cT = rand(1.6, 2.6) * (1 - s.stage * 0.03); }
      d.c += clamp(d.ct - d.c, -0.2 * dt, 0.2 * dt);
      const was = d.inZ; d.inZ = Math.abs(d.p - d.c) <= d.zw;
      if (d.inZ) { d.prog += dt / d.need; s.score = Math.round(d.prog * 100); if (!was) snd('pick'); }
      d.puff -= dt; if (d.p > 0.82 && d.puff <= 0) { d.puff = 0.35; boom('smoke', G.cx + rand(-G.R, G.R) * 0.5, G.cy - G.R * 0.9, G.R * 0.5, 0.6); }
      if (d.prog >= 1) { d.prog = 1; s.score = 100; finish(); } else if (s.t >= this.dur) finish();
    },
    draw(s) {
      const d = s.d, G = this.geo(), B = G.B;
      grad('#2a1a10', '#0b0705'); if (B.im) g.drawImage(B.im, B.bx, B.by, B.bw, B.bh);
      // 화실 불빛 (압력 따라 밝아짐)
      const fx = B.bx + B.bw * 0.355, fy = B.by + B.bh * 0.62, fr = B.bh * (0.25 + d.p * 0.25);
      const fg = g.createRadialGradient(fx, fy, 4, fx, fy, fr); fg.addColorStop(0, 'rgba(255,170,60,' + (0.3 + d.p * 0.5) + ')'); fg.addColorStop(1, 'rgba(255,120,30,0)'); g.fillStyle = fg; g.fillRect(fx - fr, fy - fr, fr * 2, fr * 2);
      const mh = pose('minho', 0) ? B.ch : 0;
      if (mh) drawImg(pose('minho', s.down && Math.sin(s.t * 18) > 0 ? 1 : 0), B.bx + B.bw * 0.43, B.floor, mh, { flip: true });
      // 계기판
      const { cx, cy, R } = G;
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, cy - R - 50, W, H);
      drawImg(FXI('gear'), cx - R - 8, cy + 8, R * 0.55, { ay: 0.5, rot: s.t * (1 + d.p * 6) });
      drawImg(FXI('gear'), cx + R + 8, cy + 8, R * 0.45, { ay: 0.5, rot: -s.t * (1 + d.p * 6) });
      g.beginPath(); g.arc(cx, cy, R + 10, Math.PI, 0); g.lineTo(cx + R + 10, cy + 14); g.lineTo(cx - R - 10, cy + 14); g.closePath(); g.fillStyle = '#e8dcc0'; g.fill(); g.lineWidth = 8; g.strokeStyle = '#c9a227'; g.stroke();
      const A = p => Math.PI + clamp(p, 0, 1) * Math.PI;
      const arc = (a, b, col, w) => { g.beginPath(); g.arc(cx, cy, R * 0.82, A(a), A(b)); g.strokeStyle = col; g.lineWidth = w; g.stroke(); };
      arc(0, 1, '#bbb2a0', R * 0.16); arc(0.88, 1, '#e23b2e', R * 0.16);
      arc(d.c - d.zw, d.c + d.zw, d.inZ ? '#3dff6a' : '#2fb84e', R * 0.2);
      g.strokeStyle = '#3a3026'; g.lineWidth = 2;
      for (let i = 0; i <= 10; i++) { const a = A(i / 10); g.beginPath(); g.moveTo(cx + Math.cos(a) * R * 0.62, cy + Math.sin(a) * R * 0.62); g.lineTo(cx + Math.cos(a) * R * 0.7, cy + Math.sin(a) * R * 0.7); g.stroke(); }
      const na = A(d.p) + (d.p > 0.85 ? Math.sin(s.t * 60) * 0.03 : 0);
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(na) * R * 0.9, cy + Math.sin(na) * R * 0.9); g.strokeStyle = '#c0261c'; g.lineWidth = 5; g.lineCap = 'round'; g.stroke(); g.lineCap = 'butt';
      g.beginPath(); g.arc(cx, cy, R * 0.1, 0, 6.28); g.fillStyle = '#333'; g.fill();
      fitText(d.p > 0.85 ? L_('⚠ 과열 주의!', '⚠ 小心过热！') : d.inZ ? L_('좋아요! 유지!', '很好！保持！') : L_('초록 칸에 맞춰!', '对准绿色区域！'), cx, cy - R * 0.35, 18, R * 1.3, d.p > 0.85 ? '#ff6b5b' : d.inZ ? '#3dff6a' : '#ffffff', 4);
      // 진행 막대
      const bw = W * 0.7, bx = (W - bw) / 2, by = cy + 30;
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(bx, by, bw, 16); g.fillStyle = '#3dff6a'; g.fillRect(bx, by, bw * d.prog, 16); g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(bx, by, bw, 16);
      fitText(L_('압력 유지 ', '保持压力 ') + Math.round(d.prog * 100) + '%', W / 2, by + 36, 18, 0, '#fff', 4);
      if (s.phase === 'go') fitText(s.down ? L_('🔥 석탄 투입 중!', '🔥 加煤中！') : L_('✋ 꾹 누르면 압력 ↑', '✋ 按住加压 ↑'), W / 2, H - 22, 18, W * 0.9, s.down ? '#ffb347' : '#ffd23d', 4);
    },
    label: s => L_('압력 유지 ', '保持压力 ') + s.score + '%',
    ratio(s) { const d = s.d; if (d.prog >= 1) return clamp(1 - Math.max(0, s.t - (d.need + 2.5)) * 0.06 - d.bursts * 0.1, 0.62, 1); return d.prog * 0.75; },
  };

  /* ---- 5. 휴게소 보급 달리기 ---- */
  GAMES.supply = {
    title: () => L_('⛽ 휴게소 보급 달리기!', '⛽ 服务区补给冲刺！'), who: 2, dur: 16,
    line: () => L_('열차가 잠깐 멈췄어! 연료랑 호두과자 챙겨서 바로 돌아올게!', '列车临时停靠！我去拿燃料和核桃饼，马上回来！'),
    hint: () => [L_('👈 왼쪽 / 오른쪽 👉 터치로 줄 바꾸기', '👈 点左边 / 右边 👉 换道'), L_('⛽ 연료 · 🍪 호두과자 줍고, 차·좀비는 피하기!', '⛽ 捡燃料 · 🍪 核桃饼，躲开车和僵尸！')],
    lx: i => W * (0.5 + (i - 1) * 0.27),
    init(s) { const d = s.d; d.lane = 1; d.x = W / 2; d.objs = []; d.rowT = 0.6; d.hits = 0; d.stun = 0; d.inv = 0; d.scroll = 0; d.seen = 0; d.got = { gas: 0, box: 0 }; s.max = 1; },
    update(s, dt) {
      const d = s.d, ry = H * 0.82, sp = H * (0.5 + s.t * 0.016 + s.stage * 0.025);
      d.scroll += sp * dt; d.stun -= dt; d.inv -= dt;
      d.x += (this.lx(d.lane) - d.x) * Math.min(1, dt * 14);
      d.rowT -= dt;
      if (d.rowT <= 0 && s.t < this.dur - 1.2) {
        d.rowT = H * 0.3 / sp + rand(0, 0.25);
        const free = Math.floor(Math.random() * 3);
        for (let i = 0; i < 3; i++) {
          if (i === free) { if (Math.random() < 0.8) d.objs.push({ lane: i, y: -H * 0.08, kind: Math.random() < 0.5 ? 'gas' : 'box', st: 'live' }); continue; }
          if (Math.random() < 0.45 + s.stage * 0.03) d.objs.push({ lane: i, y: -H * 0.08, kind: pick(['car', 'car', 'zomb', 'barrel']), car: pick(['wreck1', 'wreck2']), zt: pick(['office', 'box', 'dancer']), st: 'live' });
          else if (Math.random() < 0.25) d.objs.push({ lane: i, y: -H * 0.08, kind: Math.random() < 0.5 ? 'gas' : 'box', st: 'live' });
        }
      }
      for (const o of d.objs) {
        if (o.st === 'live') {
          o.y += (sp + (o.kind === 'zomb' ? H * 0.12 : 0)) * dt;
          const item = o.kind === 'gas' || o.kind === 'box';
          if (Math.abs(o.y - ry) < H * 0.045 && Math.abs(this.lx(o.lane) - d.x) < W * 0.12) {
            if (item) { o.st = 'got'; o.t = 0; d.got[o.kind]++; s.score++; s.combo++; d.seen++; snd('pick'); burst(this.lx(o.lane), o.y - 20, '#ffe066', 8); text(this.lx(o.lane), o.y - 60, o.kind === 'gas' ? L_('+연료', '+燃料') : L_('+호두과자', '+核桃饼'), '#ffe066', 22); }
            else if (d.inv <= 0) { o.st = 'hit'; o.t = 0; d.hits++; d.stun = 0.5; d.inv = 1.2; text(d.x, ry - H * 0.2, hurt(L_('아야!', '哎哟！')), '#ff6b5b', 26); }
          } else if (item && o.y > ry + H * 0.05 && !o.passed) { o.passed = true; d.seen++; }
        } else { o.t += dt; o.y += sp * dt * 0.5; }
      }
      d.objs = d.objs.filter(o => o.y < H + 80 && !(o.st !== 'live' && o.t > 0.4));
      if (s.t >= this.dur) finish();
    },
    down(s, x) { const d = s.d; if (d.stun > 0) return; d.lane = clamp(d.lane + (x < W / 2 ? -1 : 1), 0, 2); snd('click'); },
    draw(s) {
      const d = s.d, th = s.opt.theme || {}, ry = H * 0.82;
      const gi = img('assets/ground/' + (th.groundImg || 'rest') + '.jpg') || img('assets/ground/rest.jpg');
      if (gi) { const tw = W, thh = W * gi.height / gi.width; for (let y = (d.scroll % thh) - thh; y < H; y += thh) g.drawImage(gi, 0, y, tw, thh + 1); }
      else grad('#4a4038', '#2a241f');
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 3; g.setLineDash([24, 22]); g.lineDashOffset = -d.scroll;
      for (const k of [0.365, 0.635]) { g.beginPath(); g.moveTo(W * k, 0); g.lineTo(W * k, H); g.stroke(); }
      g.setLineDash([]);
      for (const o of d.objs.slice().sort((a, b) => a.y - b.y)) {
        const x = this.lx(o.lane) + (o.st === 'hit' ? o.t * 400 * (o.lane < 1 ? -1 : 1) : 0), al = o.st === 'live' ? 1 : Math.max(0, 1 - o.t * 2.5);
        if (o.kind === 'gas' || o.kind === 'box') {
          if (o.st === 'live') { g.fillStyle = 'rgba(255,230,90,0.28)'; g.beginPath(); g.arc(x, o.y - H * 0.035, H * 0.05 * (1 + Math.sin(s.t * 8) * 0.08), 0, 6.28); g.fill(); }
          drawImg(PROP(o.kind), x, o.y - (o.st === 'got' ? o.t * 160 : 0), H * 0.075, { alpha: al, col: o.kind === 'gas' ? '#d33' : '#b07a46' });
        } else if (o.kind === 'car') drawImg(PROP(o.car), x, o.y + H * 0.02, H * 0.13, { alpha: al, col: '#556' });
        else if (o.kind === 'barrel') drawImg(PROP('barrel_siren'), x, o.y, H * 0.08, { alpha: al, col: '#a33' });
        else drawImg(clean(o.zt), x, o.y + Math.sin(s.t * 14 + o.lane) * 3, H * 0.13, { alpha: al, rot: Math.sin(s.t * 10 + o.lane) * 0.06 });
      }
      const blink = d.inv > 0 && Math.sin(s.t * 40) > 0;
      drawImg(clean('sophie'), d.x, ry + Math.abs(Math.sin(s.t * 14)) * -6, H * 0.16, { alpha: blink ? 0.4 : 1, rot: d.stun > 0 ? Math.sin(s.t * 30) * 0.25 : (this.lx(d.lane) - d.x) / W * 0.8 });
      if (s.phase === 'go') { g.globalAlpha = 0.5; fitText('👈', W * 0.12, H - 30, 30, 0, '#fff', 0); fitText('👉', W * 0.88, H - 30, 30, 0, '#fff', 0); g.globalAlpha = 1; }
    },
    label: s => '⛽ ' + s.d.got.gas + '  🍪 ' + s.d.got.box,
    ratio(s) { const d = s.d; return (s.score - d.hits * 0.7) / Math.max(1, d.seen); },
  };

  /* ================= 공통 흐름 ================= */
  M.games = GAMES;
  M.has = k => !!GAMES[k];
  function ensure() {
    if (cv) return;
    let sec = document.getElementById('mini');
    if (!sec) { sec = document.createElement('section'); sec.id = 'mini'; sec.className = 'hidden'; (document.getElementById('app') || document.body).appendChild(sec); }
    sec.style.cssText = 'position:absolute;inset:0;z-index:45;touch-action:none;background:#0b0d12;user-select:none;-webkit-user-select:none';
    cv = document.createElement('canvas'); cv.style.cssText = 'width:100%;height:100%;display:block'; sec.appendChild(cv);
    g = cv.getContext('2d');
    const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    sec.addEventListener('pointerdown', e => { e.preventDefault(); const p = pos(e); down(p[0], p[1]); });
    ['pointerup', 'pointercancel'].forEach(n => sec.addEventListener(n, () => { if (st) st.down = false; }));
  }
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth || 360; H = cv.clientHeight || 640;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  // opt: { stage(0~7), theme, reward(grade) → 보상 안내 문장 }
  M.start = function (key, opt, done) {
    const def = GAMES[key];
    if (!def) { if (done) done({ grade: 'B', ratio: 0.5, game: key }); return false; }
    ensure(); M.preload();
    document.getElementById('mini').classList.remove('hidden');
    resize();
    st = { key, def, opt: opt || {}, stage: (opt && opt.stage) || 0, done, t: 0, phase: 'intro', phaseT: 0, score: 0, max: 1, combo: 0, texts: [], stars: [], fx: [], shake: 0, red: 0, flash: 0, d: {}, down: false };
    def.init(st);
    last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    if (DX.track) DX.track('mini_start', { game: key, stage: st.stage + 1 });
    return true;
  };
  M.active = () => !!st;
  function go() { st.phase = 'go'; st.phaseT = 0; st.t = 0; snd('click'); }
  function finish() {
    if (!st || st.phase !== 'go') return;
    const r = clamp(st.def.ratio(st), 0, 1);
    const grade = r >= 0.85 ? 'S' : r >= 0.6 ? 'A' : r >= 0.35 ? 'B' : 'C';
    st.res = { game: st.key, grade, ratio: r, score: st.score };
    st.phase = 'end'; st.phaseT = 0; st.down = false;
    if (grade === 'S' || grade === 'A') { st.flash = 0.3; snd('win'); } else snd('lose');
    if (DX.track) DX.track('mini_result', { game: st.key, grade, stage: st.stage + 1 });
  }
  function close() {
    cancelAnimationFrame(raf);
    document.getElementById('mini').classList.add('hidden');
    const r = st.res, d = st.done; st = null;
    if (d) d(r);
  }
  function down(x, y) {
    if (!st) return;
    st.down = true;
    if (st.phase === 'intro') { if (st.phaseT > 0.6) go(); return; }
    if (st.phase === 'end') { if (st.phaseT > 1.0) close(); return; }
    if (st.def.down) st.def.down(st, x, y);
  }
  function update(dt) {
    st.phaseT += dt;
    if (st.phase === 'intro') { if (st.phaseT > 4.5) go(); }
    else if (st.phase === 'go') { st.t += dt; st.def.update(st, dt); }
    else if (st.phase === 'end' && st.phaseT > 4) { close(); return; }
    st.shake = Math.max(0, st.shake - dt * 30); st.red = Math.max(0, st.red - dt * 1.6); st.flash = Math.max(0, st.flash - dt);
    for (const p of st.stars) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt; }
    st.stars = st.stars.filter(p => p.t < p.max);
    for (const t of st.texts) t.t += dt; st.texts = st.texts.filter(t => t.t < t.max);
    for (const f of st.fx) f.t += dt; st.fx = st.fx.filter(f => f.t < f.max);
  }
  const GCOL = { S: '#ffd23d', A: '#7dff8a', B: '#7de3ff', C: '#b8b8b8' };
  function draw() {
    resize();
    const def = st.def;
    g.save(); if (st.shake > 0) g.translate(rand(-1, 1) * st.shake, rand(-1, 1) * st.shake);
    def.draw(st);
    for (const f of st.fx) { const k = f.t / f.max; drawImg(FXI(f.k), f.x, f.y, f.h * (0.6 + k * 0.6), { ay: 0.5, alpha: 1 - k * k }); }
    for (const p of st.stars) { g.globalAlpha = 1 - p.t / p.max; g.fillStyle = p.col; g.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); } g.globalAlpha = 1;
    for (const t of st.texts) { const k = t.t / t.max; g.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1; fitText(t.s, t.x, t.y - k * 30, Math.round(t.size * (k < 0.1 ? 1.3 - k * 3 : 1))); } g.globalAlpha = 1;
    g.restore();
    if (st.red > 0) { const rg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7); rg.addColorStop(0, 'rgba(255,0,0,0)'); rg.addColorStop(1, 'rgba(255,0,0,' + Math.min(0.55, st.red) + ')'); g.fillStyle = rg; g.fillRect(0, 0, W, H); }
    if (st.flash > 0) { g.fillStyle = 'rgba(255,255,255,' + Math.min(0.5, st.flash * 2) + ')'; g.fillRect(0, 0, W, H); }
    // 위쪽 정보
    if (st.phase !== 'intro') {
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, 0, W, 64);
      fitText(def.title(), W / 2, 20, 20, W * 0.9, '#ffd23d', 4);
      fitText(def.label(st), W / 2, 46, 18, W * 0.9, '#ffffff', 4);
      if (def.dur) { const k = clamp(1 - st.t / def.dur, 0, 1); g.fillStyle = k < 0.25 ? '#ff6b5b' : '#ffd23d'; g.fillRect(0, 62, W * k, 4); }
    }
    if (st.phase === 'intro') drawIntro(def);
    else if (st.phase === 'end') drawEnd();
  }
  function drawIntro(def) {
    g.fillStyle = 'rgba(0,0,0,0.62)'; g.fillRect(0, 0, W, H);
    const t = st.phaseT, pop = Math.min(1, t * 4);
    g.save(); g.translate(W / 2, H * 0.17); g.scale(pop, pop); fitText(def.title(), 0, 0, 32, W * 0.92, '#ffd23d', 7); g.restore();
    // 말하는 생존자 + 말풍선
    const pr = Math.min(W * 0.15, 64), px = W * 0.08 + pr, py = H * 0.32;
    const pi = PORT(def.who);
    g.save(); g.beginPath(); g.arc(px, py, pr, 0, 6.28); g.fillStyle = '#2b3a55'; g.fill(); g.clip();
    if (pi) g.drawImage(pi, px - pr, py - pr, pr * 2, pr * 2); g.restore();
    ring(px, py, pr, '#ffd23d', 4);
    const bx = px + pr + 14, bw = W - bx - W * 0.05, lines = wrap(def.line(), bw - 24, 18), bh = lines.length * 24 + 22, by = py - bh / 2;
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(bx, py - 8); g.lineTo(bx - 12, py); g.lineTo(bx, py + 8); g.fill();
    g.beginPath(); if (g.roundRect) g.roundRect(bx, by, bw, bh, 12); else g.rect(bx, by, bw, bh); g.fill();
    g.fillStyle = '#222'; g.font = '18px ' + FONT; g.textAlign = 'left'; g.textBaseline = 'middle';
    lines.forEach((l, i) => g.fillText(l, bx + 12, by + 22 + i * 24));
    const hs = def.hint();
    hs.forEach((h, i) => fitText(h, W / 2, H * 0.5 + i * 40, 22, W * 0.92, i ? '#ffffff' : '#7de3ff', 5));
    const pz = 1 + Math.sin(t * 6) * 0.05;
    g.save(); g.translate(W / 2, H * 0.72); g.scale(pz, pz);
    fitText(L_('👆 탭해서 시작!', '👆 点击开始！'), 0, 0, 28, W * 0.9, '#ffd23d', 6); g.restore();
    fitText(L_('잘하면 골드·체력·카드 보상!', '表现好可得金币·生命·卡牌！'), W / 2, H * 0.72 + 44, 17, W * 0.9, '#cfd8e3', 4);
  }
  function drawEnd() {
    const r = st.res, t = st.phaseT, col = GCOL[r.grade];
    g.fillStyle = 'rgba(0,0,0,' + Math.min(0.6, t * 2) + ')'; g.fillRect(0, 0, W, H);
    const s = t < 0.25 ? 2.2 - t * 4.8 : 1;
    g.save(); g.translate(W / 2, H * 0.38); g.scale(s, s); fitText(r.grade, 0, 0, 120, 0, col, 12); g.restore();
    const msg = { S: L_('완벽해!!', '完美！！'), A: L_('잘했어!', '干得好！'), B: L_('그럭저럭!', '还行！'), C: L_('아쉽다...', '可惜…') }[r.grade];
    fitText(msg, W / 2, H * 0.38 + 90, 30, W * 0.9, col, 6);
    fitText(st.def.label(st), W / 2, H * 0.38 + 132, 20, W * 0.9, '#ffffff', 4);
    const rw = st.opt.reward ? st.opt.reward(r.grade) : '';
    if (rw) wrap(rw, W * 0.86, 20).forEach((l, i) => fitText(l, W / 2, H * 0.38 + 172 + i * 28, 20, W * 0.92, '#ffd23d', 5));
    if (t > 1.0) fitText(L_('👆 탭해서 계속', '👆 点击继续'), W / 2, H * 0.86, 22, 0, '#ffffff', 5);
  }
  function loop(ts) {
    if (!st) return;
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
    try { update(dt); if (st) draw(); } catch (e) { console.error(e); }
    if (st) raf = requestAnimationFrame(loop);
  }
  // 테스트용
  M._step = function (n, dt) { for (let i = 0; i < n && st; i++) update(dt || 1 / 30); if (st) draw(); };
  M._st = () => st;
  M._tap = (x, y) => { down(x, y); if (st) st.down = false; };
  M._hold = v => { if (st) st.down = v; };

  // 주소에 ?mini=게임이름 이 있으면 로비에서 바로 실행
  try {
    const m = location.search.match(/[?&]mini=(\w+)/);
    if (m && GAMES[m[1]]) {
      const ms = +((location.search.match(/[?&]ms=(\d)/) || [])[1] || 0);
      const iv = setInterval(() => {
        if (!(DX.SPR && DX.SPR.ready && DX.state === 'lobby')) return;
        clearInterval(iv);
        const C = DX.CONFIG || {}, stg = (C.stages || [])[ms] || {};
        const again = () => M.start(m[1], { stage: ms, theme: stg.theme, reward: gr => (DX.MINI_REWARD ? DX.MINI_REWARD(gr, ms) : '') }, again);
        again();
      }, 300);
    }
  } catch (e) {}
})(window.DX);
