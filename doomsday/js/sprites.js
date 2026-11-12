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
    if (!items.length) return false;
    const atlas = pack(items, 2048);
    DX.E.setSpriteTexture(atlas);
    SPR.atlas = atlas;
    SPR.ready = true;
    return true;
  };
  SPR.has = key => SPR.ready && !!SPR.chars[key];
})(window.DX);
