/* ---------- 채색 연속 동작 (열쇠 자세 → 영상 → 프레임 띠) ---------- */
const PA_MAN = /*@@PAMAN@@*/{};
const PA = { img:{}, msk:{}, tint:new Map(), hot:{} };
function paImg(c){
  let o = PA.img[c];
  if (o === undefined){
    const m = PA_MAN[c]; if (!m){ PA.img[c] = null; return null; }
    o = paNew('art/anim/' + c + '.webp'); PA.img[c] = o;
    if (m.m) PA.msk[c] = paNew('art/anim/' + c + '_m.webp');
  }
  return o && o.complete && o.naturalWidth ? o : null;
}
/* 받기 실패하면 세 번까지 다시 받는다 */
function paNew(url){
  const o = new Image(); o.decoding = 'async'; let n = 0;
  o.onerror = () => { if (++n <= 3) setTimeout(() => { o.src = url + '?r=' + n; }, 1200*n); };
  o.src = url; return o;
}
/* 장면마다 그림이 섞이지 않게: 핵심 동작이 전부 받아진 뒤에만 그린 그림으로 바꾼다 */
let PA_READY = false;
function paReady(){
  if (PA_READY) return true;
  for (const c of PA_CORE) if (!paHas(c)) return false;
  return (PA_READY = true);
}
const PA_CORE = ['s_walk1', 's_walk2', 'w_atk', 'w_ret', 'a_draw', 'a_shot', 'c_gal1', 'c_gal2', 'r_gal1', 'r_gal2', 'q_gal1', 'q_gal2'];
function paHas(c){ return !!(PA_MAN[c] && paImg(c) && (!PA.msk[c] || (PA.msk[c].complete && PA.msk[c].naturalWidth))); }
const PA_FAM = {};
function paFam(f){ if (PA_FAM[f]) return true; for (const c in PA_MAN) if (c.startsWith(f + '_') && !paHas(c)) return false; return (PA_FAM[f] = true); }
function paOk(c){ if (!paImg(c)) return false; const k = PA.msk[c]; return !k || k.complete; }
function paAll(list){ for (const c of list) if (!paOk(c)) return false; return true; }
function paSrc(c, col){
  const im = paImg(c); if (!im) return null; const k = PA.msk[c];
  if (!col || !k || !(k.complete && k.naturalWidth)) return im;
  const key = c + '|' + col; let cv = PA.tint.get(key); if (cv) return cv;
  try {
    cv = document.createElement('canvas'); cv.width = im.naturalWidth; cv.height = im.naturalHeight;
    const L = document.createElement('canvas'); L.width = cv.width; L.height = cv.height; const lx = L.getContext('2d');
    lx.drawImage(k, 0, 0, L.width, L.height); lx.globalCompositeOperation = 'source-in'; lx.fillStyle = col; lx.fillRect(0, 0, L.width, L.height);
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
  if (o.noRider || o.vec || !paReady()) return null;
  const f = o.weapon === 'spear' ? 'q' : 'r', man = PA_MAN[f + '_gal1']; if (!man || !paFam(f)) return null;
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
  if (!paReady()) return null;
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
/* 쓰러짐: k 0~1 */
const PA_DIE = { spear:'s_die', shield:'w_die', cav:'c_fall' };
function paFigDie(type, col, k){
  const c = PA_DIE[type]; if (!c || !paReady() || !paOk(c)) return null;
  return paProxy(paAt(c, k), col, type === 'cav' ? 52 : 34);
}
/* 코끼리 */
function paEleph(c, x, y, sc, flip, col, t){
  if (!paOk('e_walk')) return false; const m = PA_MAN.e_walk;
  return paDraw(c, paLoop(['e_walk'], t*.18), x, y, 92*sc/m.w, flip, col);
}
setTimeout(() => { try { PA_CORE.forEach(paImg); setTimeout(() => { for (const c in PA_MAN) if (/^(r_|q_|s_|w_|a_|c_|e_|v_)/.test(c)) paImg(c); }, 1500); } catch(e){} }, 200);
/* 그린 효과 */
const PA_UI = {};
function paUi(n){ let o = PA_UI[n]; if (!o){ o = PA_UI[n] = paNew('art/ui/' + n + '.webp'); } return o.complete && o.naturalWidth ? o : null; }
function paFx(ctx, n, x, y, size, alpha, rot, flip){
  const im = paUi(n); if (!im || alpha <= 0) return;
  ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); if (flip) ctx.scale(-1, 1); ctx.globalAlpha = Math.min(1, alpha);
  ctx.drawImage(im, -size/2, -size/2, size, size); ctx.restore();
}
setTimeout(() => ['map_town', 'map_city', 'map_capital', 'map_village', 'mk_battle', 'fx_slash', 'fx_ink', 'fx_dust', 'fx_smoke', 'fx_fire', 'fx_arrows'].forEach(paUi), 300);
/* 배 */
function paShip(c, x, y, col, ph, flip){
  if (!paAll(['v_rock1', 'v_rock2'])) return false; const m = PA_MAN.v_rock1;
  return paDraw(c, paLoop(['v_rock1', 'v_rock2'], ph), x, y, 118/m.w, !!flip, col);
}
/* ---------- 그린 배경 (전장·행군·성벽) ---------- */
const PA_ART = {};
function paArt(n){ let o = PA_ART[n]; if (!o) o = PA_ART[n] = paNew('art/' + n + '.webp'); return o.complete && o.naturalWidth ? o : null; }
const PA_BG = { plain:'bf_plain', mountain:'bf_mountain', river:'bf_river', pass:'bf_pass' };
function paBg(terr){ return paArt(PA_BG[terr] || 'bf_plain'); }
function paTod(x, tod, W, H){
  const k = tod===TOD.night ? ['#6a77a0', 1] : tod===TOD.dusk ? ['#f7dcc0', 1] : tod===TOD.dawn ? ['#f3d6cc', 1] : null;
  if (!k) return;
  x.save(); x.globalCompositeOperation = 'multiply'; x.fillStyle = k[0]; x.fillRect(0, 0, W, H);
  if (tod===TOD.dusk){ x.globalCompositeOperation = 'screen'; const g = x.createLinearGradient(0, 0, 0, H*.5); g.addColorStop(0, 'rgba(255,140,70,.22)'); g.addColorStop(1, 'rgba(255,140,70,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H*.5); }
  if (tod===TOD.night){ x.globalCompositeOperation = 'source-over'; x.fillStyle = '#f4efd8'; x.beginPath(); x.arc(W*.8, H*.14, 12, 0, TWO_PI); x.fill(); }
  x.restore();
}
function paBgPaint(x, im, tod){
  const sw = im.naturalWidth, sh = sw*VH/VW, sy = Math.max(0, Math.min(im.naturalHeight - sh, im.naturalHeight*.42 - sh*HZ/VH));
  x.drawImage(im, 0, sy, sw, sh, 0, 0, VW, VH);
  paTod(x, tod, VW, VH);
}
/* 성벽: 그림 한 장(성벽+문루). left면 왼쪽에 뒤집어 그린다 */
const PA_WALL = { top:.45, base:1 };
function paWall(x, left, h){
  const im = paArt('siege_wall'); if (!im) return false;
  const baseY = GY0 + 34, top = baseY - h, k = (baseY - top)/((PA_WALL.base - PA_WALL.top)*im.naturalHeight);
  const w = im.naturalWidth*k, hh = im.naturalHeight*k, y = baseY - PA_WALL.base*hh;
  x.save(); if (left){ x.translate(VW, 0); x.scale(-1, 1); }
  const x0 = 524 - w/2; x.drawImage(im, 0, 0, im.naturalWidth*.3, im.naturalHeight, x0 - w*.3 + 1, y, w*.3, hh); x.drawImage(im, x0, y, w, hh); x.restore(); return true;
}
/* 행군 길: 좌우 뒤집어 이어 붙여 끝없이 흐르게 */
const PA_TK = { main:'tk_land', hill:'tk_hill', water:'tk_water' };
function paTrek(ctx, road, sc, W, H){
  const im = paArt(PA_TK[road] || 'tk_land'); if (!im) return false;
  const th = H*1.12, tw = im.naturalWidth*th/im.naturalHeight, y = H - th + (road==='water' ? H*.02 : 26);
  let ox = -((sc*.6) % (tw*2));
  for (let i = 0; ox + i*tw < W; i++){
    const x0 = ox + i*tw; if (x0 + tw < 0) continue;
    ctx.save(); if (i % 2){ ctx.translate(x0 + tw, 0); ctx.scale(-1, 1); ctx.drawImage(im, 0, y, tw, th); } else ctx.drawImage(im, x0, y, tw, th); ctx.restore();
  }
  return true;
}
setTimeout(() => { try { ['bf_plain', 'bf_mountain', 'bf_river', 'bf_pass', 'siege_wall', 'tk_land', 'tk_hill', 'tk_water', 'parapet'].forEach(paArt); ['bn_tall', 'bn_pennant', 'bn_std'].forEach(paUi); } catch(e){} }, 600);
/* 그림 한 장을 바닥 기준(가운데 아래)으로 */
function paUiDraw(c, n, x, y, w){ const im = paUi(n); if (!im) return false; const h = w*im.naturalHeight/im.naturalWidth; c.drawImage(im, x - w/2, y - h, w, h); return true; }
/* 공성 장비(사다리 l, 충차 m, 투석기 k) */
function paSiegeOk(f){ if (!paReady()) return false; for (const c in PA_MAN) if (c.startsWith(f + '_') && !paHas(c)) return false; return !!PA_MAN[f === 'l' ? 'l_up1' : f === 'm' ? 'm_hit' : 'k_fire']; }
setTimeout(() => { try { for (const c in PA_MAN) if (/^(l_|m_|k_|t_)/.test(c)) paImg(c); } catch(e){} }, 2500);
/* 깃발: 흰 천만 진영색으로 물들인다 */
const PA_BN = new Map();
function paBanner(n, col){
  const im = paUi(n); if (!im) return null; const key = n + '|' + col; let cv = PA_BN.get(key); if (cv) return cv;
  cv = document.createElement('canvas'); cv.width = im.naturalWidth; cv.height = im.naturalHeight; const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
  try {
    const d = x.getImageData(0, 0, cv.width, cv.height), p = d.data, c = parseInt(col.slice(1), 16), cr = c >> 16 & 255, cg = c >> 8 & 255, cb = c & 255;
    for (let i = 0; i < p.length; i += 4){ const r = p[i], g = p[i+1], b = p[i+2], mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (p[i+3] < 10 || mn < 150 || mx - mn > 80) continue; const L = (r + g + b)/765; p[i] = cr*L*1.05; p[i+1] = cg*L*1.05; p[i+2] = cb*L*1.05; }
    x.putImageData(d, 0, 0);
  } catch(e){}
  if (PA_BN.size > 40) PA_BN.clear(); PA_BN.set(key, cv); return cv;
}
function paDrawBanner(c, x, y, h, col, t, dir, ph, s){
  if (!/^#[0-9a-f]{6}$/i.test(col || '')) return false;
  const cv = paBanner('bn_tall', col); if (!cv) return false;
  const H = h*1.08, W = H*cv.width/cv.height;
  c.save(); c.translate(x, y); c.scale(dir, 1); c.transform(1, 0, Math.sin(t*3 + (ph||0))*.04, 1, 0, 0);
  c.drawImage(cv, -W*.07, -H, W, H); c.restore(); return true;
}
