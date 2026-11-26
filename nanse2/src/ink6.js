/* ---------- 채색 연속 동작 (열쇠 자세 → 영상 → 프레임 띠) ---------- */
const PA_MAN = /*@@PAMAN@@*/{};
const PA = { img:{}, msk:{}, tint:new Map(), hot:{} };
function paImg(c){
  let o = PA.img[c];
  if (o === undefined){
    const m = PA_MAN[c]; if (!m){ PA.img[c] = null; return null; }
    o = new Image(); o.decoding = 'async'; o.src = 'art/anim/' + c + '.webp'; PA.img[c] = o;
    if (m.m){ const k = new Image(); k.src = 'art/anim/' + c + '_m.webp'; PA.msk[c] = k; }
  }
  return o && o.complete && o.naturalWidth ? o : null;
}
function paOk(c){ if (!paImg(c)) return false; const k = PA.msk[c]; return !k || k.complete; }
function paAll(list){ for (const c of list) if (!paOk(c)) return false; return true; }
function paSrc(c, col){
  const im = paImg(c); if (!im) return null; const k = PA.msk[c];
  if (!col || !k || !(k.complete && k.naturalWidth)) return im;
  const key = c + '|' + col; let cv = PA.tint.get(key); if (cv) return cv;
  try {
    cv = document.createElement('canvas'); cv.width = im.naturalWidth; cv.height = im.naturalHeight;
    const L = document.createElement('canvas'); L.width = cv.width; L.height = cv.height; const lx = L.getContext('2d');
    lx.drawImage(k, 0, 0); lx.globalCompositeOperation = 'source-in'; lx.fillStyle = col; lx.fillRect(0, 0, L.width, L.height);
    const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
    x.globalCompositeOperation = 'multiply'; x.globalAlpha = .9; x.drawImage(L, 0, 0);
    x.globalAlpha = 1; x.globalCompositeOperation = 'destination-in'; x.drawImage(im, 0, 0);
  } catch(e){ cv = im; }
  if (PA.tint.size > 160) PA.tint.clear();
  PA.tint.set(key, cv); return cv;
}
/* 한 번 동작: p 0~1 → 프레임 */
function paAt(c, p){ const m = PA_MAN[c]; return [c, Math.max(0, Math.min(m.n - 1, Math.floor(cl01(p)*m.n)))]; }
/* 이어 도는 동작(끝=다음 시작) */
function paLoop(list, p){
  let tot = 0; for (const c of list) tot += PA_MAN[c].n - 1;
  let k = Math.floor((((p % 1) + 1) % 1)*tot);
  for (const c of list){ const n = PA_MAN[c].n - 1; if (k < n) return [c, k]; k -= n; }
  return [list[0], 0];
}
function paDraw(ctx, cf, x, y, D, flip, col, alpha){
  const [c, f] = cf, m = PA_MAN[c], src = paSrc(c, col); if (!src) return false;
  ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
  if (alpha != null && alpha < 1) ctx.globalAlpha = Math.max(0, alpha);
  ctx.drawImage(src, f*m.s, 0, m.s, m.s, -m.ax*D, -m.ay*D, D, D); ctx.restore(); return true;
}
/* 기마 장수: o.pa = { c:'strike'|'wind'|..., p } 가 있으면 그 동작, 없으면 달리기/서기 */
function paRider(c, x, y, sc, flip, col, o){
  if (o.noRider || o.vec) return null;
  const f = o.weapon === 'spear' ? 'q' : 'r', man = PA_MAN[f + '_gal1']; if (!man) return null;
  let cf;
  if (o.pa){ const id = f + '_' + o.pa.c; if (!PA_MAN[id] || !paOk(id)) return null; cf = paAt(id, o.pa.p); }
  else if (o.run){ if (!paAll([f + '_gal1', f + '_gal2'])) return null; cf = paLoop([f + '_gal1', f + '_gal2'], (o.g || 0)*.5); }
  else if (f === 'r' && PA_MAN.r_walk1 && paAll(['r_walk1', 'r_walk2']) && o.walk){ cf = paLoop(['r_walk1', 'r_walk2'], (o.t || 0)*.12); }
  else { const id = f + '_gal1'; if (!paOk(id)) return null; cf = [id, 0]; }
  const D = 134*sc/man.w;
  c.save();
  if (o.rot){ c.translate(x, y - 24*sc); c.rotate(flip ? -o.rot : o.rot); c.translate(-x, -(y - 24*sc)); }
  c.fillStyle = 'rgba(30,20,10,.28)'; c.beginPath(); c.ellipse(x, y + 1, 44*sc, 5*sc, 0, 0, TWO_PI); c.fill();
  paDraw(c, cf, x, y, D, flip, col, o.hurt ? .55 + .45*Math.abs(Math.sin((o.t || 0)*20)) : null);
  c.restore();
  return { x: x + (flip ? -1 : 1)*55*sc, y: y - 70*sc };
}
/* 보병·기병 무리: figSprite 대신 쓰는 채색 프레임 (blitFig가 알아봄) */
const PA_FOOT = { spear:'s', shield:'w', bow:'a' };
function paFig(type, col, pose){
  const now = performance.now()/1000, hk = type + '|' + col;
  if (type === 'cav'){
    if (!paAll(['c_gal1', 'c_gal2'])) return null;
    const cf = pose === 'idle' ? ['c_gal1', 0] : paLoop(['c_gal1', 'c_gal2'], now*1.5);
    return paProxy(cf, col, 52);
  }
  const fm = PA_FOOT[type]; if (!fm) return null;
  if (pose === 'charge') PA.hot[hk] = now;
  const live = now - (PA.hot[hk] || -9) < .5;
  let cf;
  if (fm === 's'){ if (!paAll(['s_walk1', 's_walk2'])) return null; cf = live ? paLoop(['s_walk1', 's_walk2'], now*.8) : ['s_walk1', 0]; }
  else if (fm === 'w'){ if (!paAll(['w_atk', 'w_ret'])) return null; cf = live ? paLoop(['w_atk', 'w_ret'], now*.9) : ['w_atk', 0]; }
  else { if (!paAll(['a_shot', 'a_draw'])) return null; cf = live ? paLoop(['a_shot', 'a_draw'], now*.7) : ['a_draw', PA_MAN.a_draw.n - 1]; }
  return paProxy(cf, col, 34);
}
function paProxy(cf, col, hUnits){
  const m = PA_MAN[cf[0]], fam = PA_MAN[cf[0][0] === 'c' ? 'c_gal1' : cf[0][0] === 's' ? 's_walk1' : cf[0][0] === 'w' ? 'w_atk' : 'a_draw'];
  const src = paSrc(cf[0], col); if (!src) return null;
  return { __pa:1, src, col, f: cf[1], s: m.s, ax: m.ax, ay: m.ay, D: hUnits/(fam.h || .8) };
}
function paBlit(ctx, p, x, y, sc, flip, alpha){
  const D = p.D*sc;
  ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
  if (alpha != null && alpha < 1) ctx.globalAlpha = Math.max(0, alpha);
  if (p.col){ ctx.save(); ctx.globalAlpha *= .4; ctx.fillStyle = p.col; ctx.beginPath(); ctx.ellipse(0, 0, D*.2, D*.05, 0, 0, TWO_PI); ctx.fill(); ctx.restore(); }
  ctx.drawImage(p.src, p.f*p.s, 0, p.s, p.s, -p.ax*D, -p.ay*D, D, D); ctx.restore();
}
/* 코끼리 */
function paEleph(c, x, y, sc, flip, col, t){
  if (!paOk('e_walk')) return false; const m = PA_MAN.e_walk;
  return paDraw(c, paLoop(['e_walk'], t*.18), x, y, 92*sc/m.w, flip, col);
}
setTimeout(() => { try { for (const c in PA_MAN) if (/^(r_|q_|s_|w_|a_|c_|e_|v_)/.test(c)) paImg(c); } catch(e){} }, 1200);
/* 그린 효과 */
const PA_UI = {};
function paUi(n){ let o = PA_UI[n]; if (!o){ o = PA_UI[n] = new Image(); o.src = 'art/ui/' + n + '.webp'; } return o.complete && o.naturalWidth ? o : null; }
function paFx(ctx, n, x, y, size, alpha, rot, flip){
  const im = paUi(n); if (!im || alpha <= 0) return;
  ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); if (flip) ctx.scale(-1, 1); ctx.globalAlpha = Math.min(1, alpha);
  ctx.drawImage(im, -size/2, -size/2, size, size); ctx.restore();
}
setTimeout(() => ['fx_slash', 'fx_ink', 'fx_dust', 'fx_smoke', 'fx_fire', 'fx_arrows'].forEach(paUi), 900);
/* 배 */
function paShip(c, x, y, col, ph){
  if (!paAll(['v_rock1', 'v_rock2'])) return false; const m = PA_MAN.v_rock1;
  return paDraw(c, paLoop(['v_rock1', 'v_rock2'], ph), x, y, 118/m.w, false, col);
}
