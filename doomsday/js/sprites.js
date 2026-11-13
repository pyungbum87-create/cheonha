/* ==========================================================================
   sprites.js — 그림 캐릭터 불러오기 (자동 배경 제거 + 부품 자동 분리 + 아틀라스 생성)
   - config.js 의 art 항목에 적힌 그림 파일을 읽어서 게임용으로 자동 가공
   - full  : 완성 그림 1장 (달리는 모습)
   - parts : 부품 분리 시트 (머리/몸통/팔2/다리2 + 오른쪽 아래 완성본) → 죽을 때 부품이 흩어지는 연출에 사용
   - 흰 배경이어도 자동으로 지움. 수정할 필요 없음
   ========================================================================== */
window.DX = window.DX || {};
(function (DX) {
  'use strict';
  const SPR = DX.SPR = { ready: false, frames: {}, chars: {}, error: null };

  // 그림 1장 받기: 실패하면 최대 8회까지 다시 시도 (파일로 직접 열었을 때는 바로 내장본 사용)
  const isFile = (() => { try { return location.protocol === 'file:'; } catch (e) { return false; } })();
  function loadOnce(src) {
    return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('load ' + src)); i.src = src; });
  }
  async function loadImg(src, retry) {
    const n = retry == null ? (isFile || src.indexOf('data:') === 0 ? 0 : 8) : retry;
    for (let k = 0; ; k++) {
      try { return await loadOnce(k ? src + (src.indexOf('?') < 0 ? '?' : '&') + 'r=' + k : src); }
      catch (e) { if (k >= n) throw e; SPR.retries = (SPR.retries || 0) + 1; await new Promise(r => setTimeout(r, Math.min(2000, 300 * (k + 1)))); }
    }
  }
  const imgCache = {};
  const fetchImg = src => imgCache[src] || (imgCache[src] = loadImg(src));
  const ver = u => (u.indexOf('data:') === 0 || !DX.BUILD) ? u : u + (u.indexOf('?') < 0 ? '?v=' : '&v=') + DX.BUILD;
  SPR.progress = 0; SPR.total = 1; SPR.done = 0;
  const tick = () => { SPR.done++; SPR.progress = Math.min(1, SPR.done / SPR.total); if (SPR.onProgress) try { SPR.onProgress(SPR.progress); } catch (e) {} };
  // 이미지 → 픽셀 데이터 (파일로 직접 열어서 막히면 내장 백업본 사용)
  async function getPixels(url) {
    const tryOne = async (src) => {
      const img = await fetchImg(src);
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
      const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
      return g.getImageData(0, 0, c.width, c.height);
    };
    try { return await tryOne(ver(url)); }
    catch (e) {
      await ensureEmbed();
      if (DX.EMBED && DX.EMBED[url]) return await tryOne(DX.EMBED[url]);
      SPR.failed = (SPR.failed || 0) + 1;
      throw e;
    } finally { tick(); }
  }
  // 파일로 직접 열었을 때(보안 제한) 내장 백업 그림 불러오기
  let embedP = null;
  function ensureEmbed() {
    if (DX.EMBED) return Promise.resolve();
    if (!embedP) embedP = new Promise(res => { const sc = document.createElement('script'); sc.src = 'js/sprites_embed.js'; sc.onload = res; sc.onerror = res; document.head.appendChild(sc); });
    return embedP;
  }
  // 흰 배경 제거 (테두리에서 이어진 흰색만 지움 → 눈알 같은 안쪽 흰색은 유지)
  function removeBg(d) {
    const { width: W, height: H, data: p } = d;
    const cornerA = [0, W - 1, (H - 1) * W, H * W - 1].map(i => p[i * 4 + 3]);
    if (cornerA.some(a => a < 10)) return; // 이미 투명 배경
    const isW = i => Math.min(p[i * 4], p[i * 4 + 1], p[i * 4 + 2]) > 232;
    const bg = new Uint8Array(W * H), q = new Int32Array(W * H); let qh = 0, qt = 0;
    const push = i => { if (!bg[i] && isW(i)) { bg[i] = 1; q[qt++] = i; } };
    for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
    for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
    while (qh < qt) {
      const i = q[qh++], x = i % W, y = (i / W) | 0;
      if (x > 0) push(i - 1); if (x < W - 1) push(i + 1); if (y > 0) push(i - W); if (y < H - 1) push(i + W);
    }
    for (let i = 0; i < W * H; i++) {
      if (bg[i]) { p[i * 4 + 3] = 0; continue; }
      // 배경과 맞닿은 밝은 가장자리 픽셀은 반투명 처리
      const x = i % W, y = (i / W) | 0;
      if ((x > 0 && bg[i - 1]) || (x < W - 1 && bg[i + 1]) || (y > 0 && bg[i - W]) || (y < H - 1 && bg[i + W])) {
        const m = Math.min(p[i * 4], p[i * 4 + 1], p[i * 4 + 2]);
        if (m > 180) p[i * 4 + 3] = Math.max(0, 255 - (m - 180) * 3);
      }
    }
  }
  // 연결된 덩어리 찾기
  function components(d) {
    const { width: W, height: H, data: p } = d;
    const lab = new Int32Array(W * H), q = new Int32Array(W * H);
    const comps = [];
    for (let s = 0; s < W * H; s++) {
      if (lab[s] || p[s * 4 + 3] <= 40) continue;
      const id = comps.length + 1; let qh = 0, qt = 0; q[qt++] = s; lab[s] = id;
      let n = 0, sx = 0, sy = 0, x0 = W, x1 = 0, y0 = H, y1 = 0;
      while (qh < qt) {
        const i = q[qh++], x = i % W, y = (i / W) | 0;
        n++; sx += x; sy += y; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        const nb = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1];
        for (const j of nb) if (j >= 0 && !lab[j] && p[j * 4 + 3] > 40) { lab[j] = id; q[qt++] = j; }
      }
      comps.push({ id, n, cx: sx / n, cy: sy / n, x0, x1, y0, y1 });
    }
    return { lab, comps };
  }
  function crop(d, lab, ids, box) {
    const c = document.createElement('canvas'); const w = box.x1 - box.x0 + 1, h = box.y1 - box.y0 + 1;
    c.width = w; c.height = h;
    const g = c.getContext('2d'); const out = g.createImageData(w, h);
    const W = d.width;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const si = (box.y0 + y) * W + box.x0 + x;
      if (ids && !ids.has(lab[si])) continue;
      const di = (y * w + x) * 4, s4 = si * 4;
      out.data[di] = d.data[s4]; out.data[di + 1] = d.data[s4 + 1]; out.data[di + 2] = d.data[s4 + 2]; out.data[di + 3] = d.data[s4 + 3];
    }
    g.putImageData(out, 0, 0);
    return c;
  }
  function bboxAlpha(d) {
    const { width: W, height: H, data: p } = d; let x0 = W, x1 = 0, y0 = H, y1 = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (p[(y * W + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return { x0, x1, y0, y1 };
  }
  // 부품 시트 → 머리/몸통/팔/다리 자동 분류
  function splitParts(d) {
    const { lab, comps } = components(d);
    comps.sort((a, b) => b.n - a.n);
    const big = comps.filter(c => c.n > comps[0].n * 0.04);
    const small = comps.filter(c => big.indexOf(c) < 0);
    big.forEach(b => b.ids = new Set([b.id]));
    for (const s of small) {
      let best = big[0], bd = 1e18;
      for (const b of big) { const dd = (b.cx - s.cx) ** 2 + (b.cy - s.cy) ** 2; if (dd < bd) { bd = dd; best = b; } }
      best.ids.add(s.id);
      best.x0 = Math.min(best.x0, s.x0); best.x1 = Math.max(best.x1, s.x1); best.y0 = Math.min(best.y0, s.y0); best.y1 = Math.max(best.y1, s.y1);
    }
    const W = d.width, H = d.height;
    let rest = big.slice();
    const asm = rest.filter(c => c.cx > W * 0.6 && c.cy > H * 0.55).sort((a, b) => b.n - a.n)[0];
    if (asm) rest = rest.filter(c => c !== asm);
    rest.sort((a, b) => a.cy - b.cy);
    const out = {};
    if (rest.length >= 6) {
      out.head = rest[0];
      const legs = rest.slice(-2).sort((a, b) => a.cx - b.cx);
      out.legL = legs[0]; out.legR = legs[1];
      const mid = rest.slice(1, -2).sort((a, b) => a.cx - b.cx);
      out.armL = mid[0]; out.armR = mid[mid.length - 1];
      out.torso = mid.length >= 3 ? mid[Math.floor(mid.length / 2)] : mid[1];
    }
    // 몸 기준 좌표 (발 = 0, 키 = 1)
    const pts = Object.values(out);
    const by0 = Math.min(...pts.map(c => c.y0)), by1 = Math.max(...pts.map(c => c.y1));
    const bcx = (Math.min(...pts.map(c => c.x0)) + Math.max(...pts.map(c => c.x1))) / 2, bh = by1 - by0 || 1;
    const res = {};
    for (const k in out) {
      const c = out[k];
      res[k] = { canvas: crop(d, lab, c.ids, c), ox: ((c.x0 + c.x1) / 2 - bcx) / bh * 0.82, oy: (by1 - (c.y0 + c.y1) / 2) / bh * 0.9, h: (c.y1 - c.y0) / bh * 0.82 };
    }
    return res;
  }

  // 포즈 여러 개가 가로로 나열된 그림 → 왼쪽부터 n개로 나누기
  function splitPoses(d, n) {
    const { lab, comps } = components(d);
    comps.sort((a, b) => b.n - a.n);
    const main = comps.slice(0, n).sort((a, b) => a.cx - b.cx);
    main.forEach(m => m.ids = new Set([m.id]));
    for (const c of comps.slice(n)) {
      let best = main[0], bd = 1e18;
      for (const m of main) { const dd = Math.abs(m.cx - c.cx); if (dd < bd) { bd = dd; best = m; } }
      best.ids.add(c.id);
      best.x0 = Math.min(best.x0, c.x0); best.x1 = Math.max(best.x1, c.x1); best.y0 = Math.min(best.y0, c.y0); best.y1 = Math.max(best.y1, c.y1);
    }
    return main.map(m => crop(d, lab, m.ids, m));
  }
  SPR.hasTrain = () => SPR.ready && SPR.train && !!SPR.train.engine;
  SPR.hasFight = () => SPR.ready && SPR.fight && SPR.fight.bg && SPR.fight.jack;

  /* ---------- 바닥 질감 만들기 ---------- */
  function makeGround(kind) {
    const S = kind === 'gravel' ? 192 : 320, cv = document.createElement('canvas'); cv.width = cv.height = S;
    const g = cv.getContext('2d');
    let seed = { sand: 11, asphalt: 23, snow: 37, concrete: 41, planks: 53, gravel: 67 }[kind];
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const R = (a, b) => a + rnd() * (b - a);
    // 가장자리를 넘으면 반대편에도 그려서 이음새 없애기
    const wrap = (x, y, r, fn) => { for (const ox of [0, -S, S]) for (const oy of [0, -S, S]) if (x + ox > -r && x + ox < S + r && y + oy > -r && y + oy < S + r) fn(x + ox, y + oy); };
    const blob = (x, y, r, col) => wrap(x, y, r, (px, py) => { const gr = g.createRadialGradient(px, py, 0, px, py, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(px - r, py - r, r * 2, r * 2); });
    const dots = (n, r0, r1, cols) => { for (let i = 0; i < n; i++) { const x = R(0, S), y = R(0, S), r = R(r0, r1), c = cols[Math.floor(rnd() * cols.length)]; wrap(x, y, r, (px, py) => { g.fillStyle = c; g.beginPath(); g.ellipse(px, py, r, r * R(0.6, 1), R(0, 3), 0, 6.28); g.fill(); }); } };
    const crack = (n, col, w) => { for (let i = 0; i < n; i++) { let x = R(0, S), y = R(0, S), a = R(0, 6.28); const pts = [[x, y]]; for (let k = 0; k < 7; k++) { a += R(-0.8, 0.8); x += Math.cos(a) * R(6, 16); y += Math.sin(a) * R(6, 16); pts.push([x, y]); } wrap(pts[0][0], pts[0][1], 120, (px, py) => { const dx = px - pts[0][0], dy = py - pts[0][1]; g.strokeStyle = col; g.lineWidth = w; g.beginPath(); pts.forEach((p, j) => j ? g.lineTo(p[0] + dx, p[1] + dy) : g.moveTo(p[0] + dx, p[1] + dy)); g.stroke(); }); } };
    if (kind === 'sand') {
      g.fillStyle = '#d6a468'; g.fillRect(0, 0, S, S);
      for (let i = 0; i < 26; i++) blob(R(0, S), R(0, S), R(30, 90), rnd() < 0.5 ? 'rgba(255,226,170,0.35)' : 'rgba(150,95,50,0.22)');
      for (let i = 0; i < 14; i++) { const y = R(0, S); wrap(0, y, 40, (px, py) => { g.strokeStyle = 'rgba(255,235,190,0.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, py); for (let x = 0; x <= S; x += 16) g.lineTo(x, py + Math.sin(x / 30 + i) * 5); g.stroke(); }); }
      dots(140, 1.2, 3.2, ['#8e6440', '#a87a50', '#6e4c32', '#c49468']);
      dots(40, 3, 6, ['#9a7a5c', '#b08a66']); dots(40, 1, 2, ['rgba(255,240,210,0.8)']);
      crack(5, 'rgba(110,70,40,0.35)', 1.4);
      for (let i = 0; i < 8; i++) { const x = R(0, S), y = R(0, S); wrap(x, y, 14, (px, py) => { g.strokeStyle = '#8a8a3a'; g.lineWidth = 1.6; for (let k = 0; k < 7; k++) { g.beginPath(); g.moveTo(px, py); g.lineTo(px + R(-8, 8), py - R(5, 12)); g.stroke(); } }); }
    } else if (kind === 'asphalt') {
      g.fillStyle = '#4a4d57'; g.fillRect(0, 0, S, S);
      for (let i = 0; i < 20; i++) blob(R(0, S), R(0, S), R(30, 80), rnd() < 0.5 ? 'rgba(90,92,104,0.4)' : 'rgba(30,30,38,0.35)');
      dots(1600, 0.5, 1.3, ['rgba(140,140,150,0.6)', 'rgba(25,25,30,0.7)', 'rgba(100,100,110,0.5)']);
      for (let i = 0; i < 4; i++) { const x = R(0, S), y = R(0, S), w = R(40, 90), h = R(30, 70), a = R(0, 1); wrap(x, y, 100, (px, py) => { g.save(); g.translate(px, py); g.rotate(a); g.fillStyle = 'rgba(28,29,35,0.45)'; g.fillRect(-w / 2, -h / 2, w, h); g.restore(); }); }
      crack(9, 'rgba(18,18,22,0.75)', 1.6);
      for (let i = 0; i < 3; i++) { const x = R(0, S), y = R(0, S); wrap(x, y, 40, (px, py) => { g.fillStyle = 'rgba(230,200,60,0.45)'; g.fillRect(px, py, 6, R(18, 34)); }); }
      for (let i = 0; i < 4; i++) blob(R(0, S), R(0, S), R(14, 30), 'rgba(120,140,200,0.18)');
    } else if (kind === 'snow') {
      g.fillStyle = '#e8eef7'; g.fillRect(0, 0, S, S);
      for (let i = 0; i < 26; i++) blob(R(0, S), R(0, S), R(30, 90), rnd() < 0.5 ? 'rgba(255,255,255,0.7)' : 'rgba(150,170,210,0.25)');
      for (let i = 0; i < 10; i++) { const y = R(0, S); wrap(0, y, 40, (px, py) => { g.strokeStyle = 'rgba(160,180,220,0.25)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, py); for (let x = 0; x <= S; x += 16) g.lineTo(x, py + Math.sin(x / 40 + i) * 7); g.stroke(); }); }
      dots(60, 1, 2.5, ['rgba(120,140,180,0.5)']); dots(120, 0.6, 1.4, ['#ffffff']);
    } else if (kind === 'concrete') {
      g.fillStyle = '#5c6066'; g.fillRect(0, 0, S, S);
      for (let i = 0; i < 18; i++) blob(R(0, S), R(0, S), R(30, 80), rnd() < 0.5 ? 'rgba(120,124,130,0.35)' : 'rgba(30,32,36,0.3)');
      dots(900, 0.5, 1.2, ['rgba(150,150,155,0.5)', 'rgba(30,30,34,0.5)']);
      g.strokeStyle = 'rgba(25,26,30,0.7)'; g.lineWidth = 3; for (let i = 0; i <= S; i += S / 4) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, S); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(S, i); g.stroke(); }
      crack(6, 'rgba(20,20,24,0.6)', 1.3);
      for (let i = 0; i < 6; i++) blob(R(0, S), R(0, S), R(12, 30), 'rgba(80,60,40,0.3)');
    } else if (kind === 'planks') {
      const n = 8, ph = S / n;
      for (let i = 0; i < n; i++) {
        const c = ['#7a5536', '#6e4b2f', '#84603e', '#735034'][i % 4];
        g.fillStyle = c; g.fillRect(0, i * ph, S, ph);
        for (let k = 0; k < 6; k++) { g.strokeStyle = 'rgba(40,25,12,0.25)'; g.lineWidth = 1; g.beginPath(); const y = i * ph + R(3, ph - 3); g.moveTo(0, y); for (let x = 0; x <= S; x += 20) g.lineTo(x, y + Math.sin(x / 25 + k) * 1.5); g.stroke(); }
        g.fillStyle = 'rgba(20,12,6,0.85)'; g.fillRect(0, i * ph + ph - 3, S, 3);
        g.fillStyle = 'rgba(255,230,190,0.12)'; g.fillRect(0, i * ph, S, 2);
        for (const x of [S * 0.18, S * 0.82]) { g.fillStyle = '#3a3a40'; g.beginPath(); g.arc(x, i * ph + ph / 2, 3, 0, 6.28); g.fill(); }
      }
      for (let i = 0; i < 10; i++) blob(R(0, S), R(0, S), R(20, 60), 'rgba(30,18,8,0.2)');
    } else {
      g.fillStyle = '#6e6660'; g.fillRect(0, 0, S, S);
      dots(900, 2, 5, ['#8a827a', '#5a524c', '#9a9088', '#4a443f', '#7a6a5a']);
      dots(300, 1, 2, ['rgba(255,255,255,0.35)', 'rgba(0,0,0,0.35)']);
    }
    return cv;
  }

  // 아틀라스 (그림들을 큰 텍스처 한 장에 모음)
  function pack(items, size) {
    const atlas = document.createElement('canvas'); atlas.width = size; atlas.height = size;
    const g = atlas.getContext('2d');
    items.sort((a, b) => b.canvas.height - a.canvas.height);
    let x = 2, y = 2, rowH = 0;
    for (const it of items) {
      const w = it.canvas.width, h = it.canvas.height;
      if (x + w + 2 > size) { x = 2; y += rowH + 4; rowH = 0; }
      if (y + h + 2 > size) throw new Error('atlas full');
      g.drawImage(it.canvas, x, y);
      SPR.frames[it.name] = { u0: x / size, v0: y / size, u1: (x + w) / size, v1: (y + h) / size, aspect: w / h, meta: it.meta };
      x += w + 4; rowH = Math.max(rowH, h);
    }
    return atlas;
  }
  function scaled(canvas, s) {
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(canvas.width * s)); c.height = Math.max(1, Math.round(canvas.height * s));
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(canvas, 0, 0, c.width, c.height);
    return c;
  }

  SPR.load = async function () {
    const art = (DX.CONFIG && DX.CONFIG.art) || {};
    const items = [];
    { const C = DX.CONFIG || {}; let t = 0;
      for (const k in art) t += art[k].parts ? 2 : 1;
      for (const k in (C.trainArt || {})) t += (C.trainArt[k].top ? 1 : 0) + (C.trainArt[k].side ? 1 : 0);
      t += Object.keys(C.fightArt || {}).length; SPR.total = Math.max(1, t); SPR.done = 0;
      // 모든 그림을 동시에 받기 시작 (느린 인터넷에서 대기 시간 단축)
      const urls = [];
      for (const k in art) { urls.push(art[k].full); if (art[k].parts) urls.push(art[k].parts); }
      for (const k in (C.trainArt || {})) ['top', 'side'].forEach(f => C.trainArt[k][f] && urls.push(C.trainArt[k][f]));
      for (const k in (C.fightArt || {})) urls.push(C.fightArt[k]);
      urls.forEach(u => fetchImg(ver(u)).catch(() => {})); }
    for (const key in art) {
      const a = art[key];
      try {
        const fd = await getPixels(a.full); removeBg(fd);
        const bb = bboxAlpha(fd);
        let full = crop(fd, null, null, bb);
        const s = Math.min(1, 380 / full.height);
        full = scaled(full, s);
        items.push({ name: key + ':full', canvas: full });
        SPR.clean = SPR.clean || {}; SPR.clean[key] = full;   // 흰 배경 지운 전신 그림 (컷인 등 화면용)
        SPR.chars[key] = { full: key + ':full', parts: {}, height: a.height || 2.2, face: a.face || 1 };
        if (a.parts) {
          const pd = await getPixels(a.parts); removeBg(pd);
          const parts = splitParts(pd);
          for (const k in parts) {
            items.push({ name: key + ':' + k, canvas: scaled(parts[k].canvas, 0.55), meta: parts[k] });
            SPR.chars[key].parts[k] = { frame: key + ':' + k, ox: parts[k].ox, oy: parts[k].oy, h: parts[k].h };
          }
        }
      } catch (e) { console.warn('art load fail', key, e); }
    }
    // 열차 그림 (위에서 본 그림 + 옆에서 본 그림)
    const tr = (DX.CONFIG && DX.CONFIG.trainArt) || {};
    SPR.train = {};
    for (const key in tr) {
      try {
        const t = {};
        for (const face of ['top', 'side']) {
          if (!tr[key][face]) continue;
          const d = await getPixels(tr[key][face]); removeBg(d);
          let cv = crop(d, null, null, bboxAlpha(d));
          cv = scaled(cv, Math.min(1, 420 / Math.max(cv.width, cv.height)));
          items.push({ name: 'train:' + key + ':' + face, canvas: cv });
          t[face] = 'train:' + key + ':' + face;
        }
        if (t.top) SPR.train[key] = t;
      } catch (e) { console.warn('train art fail', key, e); }
    }
    // 실내 전투 그림 (2D 화면용: 아틀라스에 넣지 않고 따로 보관)
    const fa = (DX.CONFIG && DX.CONFIG.fightArt) || {};
    SPR.fight = {};
    for (const key in fa) {
      try {
        const d = await getPixels(fa[key]); if (!/\.jpe?g($|\?)/i.test(fa[key])) removeBg(d);   // jpg = 배경까지 그린 그림 → 흰색 안 지움
        if (key.indexOf('bg') === 0) { SPR.fight[key] = crop(d, null, null, bboxAlpha(d)); continue; }
        SPR.fight[key] = splitPoses(d, 3).map(c => scaled(c, Math.min(1, 340 / c.height)));
      } catch (e) { console.warn('fight art fail', key, e); }
    }
    // 포즈 그림이 없는 캐릭터: 전신 그림 1장을 대신 사용
    const ff = (DX.CONFIG && DX.CONFIG.fightFallback) || {};
    for (const key in ff) {
      if (SPR.fight[key]) continue;
      try {
        const d = await getPixels(ff[key].src); removeBg(d);
        let c = scaled(crop(d, null, null, bboxAlpha(d)), 1);
        c = scaled(c, Math.min(1, 340 / c.height));
        if (ff[key].flip) { const f = document.createElement('canvas'); f.width = c.width; f.height = c.height; const x = f.getContext('2d'); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); c = f; }
        const arr = [c, c, c]; arr.single = true; SPR.fight[key] = arr;
      } catch (e) { console.warn('fight fallback fail', key, e); }
    }
    // 효과 그림 (폭발·번개·연기 등, 이미 투명 배경)
    const fxa = (DX.CONFIG && DX.CONFIG.fxArt) || {};
    for (const key in fxa) {
      try {
        const d = await getPixels(fxa[key]);
        let cv = crop(d, null, null, bboxAlpha(d));
        cv = scaled(cv, Math.min(1, 150 / Math.max(cv.width, cv.height)));
        items.push({ name: 'fx:' + key, canvas: cv });
      } catch (e) { console.warn('fx art fail', key, e); }
    }
    // 길가 소품 그림 (폐차·경찰차·상자 등)
    const pa = (DX.CONFIG && DX.CONFIG.propArt) || {};
    for (const key in pa) {
      try {
        const d = await getPixels(pa[key]);
        let cv = crop(d, null, null, bboxAlpha(d));
        cv = scaled(cv, Math.min(1, 200 / Math.max(cv.width, cv.height)));
        items.push({ name: 'prop:' + key, canvas: cv });
      } catch (e) { console.warn('prop art fail', key, e); }
    }
    // 바닥 질감 (코드로 그림: 모래·아스팔트·눈·콘크리트·나무판·자갈) — 이어 붙여도 이음새가 안 보이게 그림
    for (const k of ['sand', 'asphalt', 'snow', 'concrete', 'planks', 'gravel']) items.push({ name: 'ground:' + k, canvas: makeGround(k) });
    if (!items.length) return false;
    let atlas;
    try { atlas = pack(items, 2048); } catch (e) { console.warn('atlas 2048 full → 4096'); SPR.frames = {}; atlas = pack(items, 4096); }
    DX.E.setSpriteTexture(atlas);
    SPR.atlas = atlas;
    SPR.ready = true;
    return true;
  };
  SPR.has = key => SPR.ready && !!SPR.chars[key];
})(window.DX);
