/* ---------- 병사·장수 그림 ---------- */
const FIGS = new Map();
function figSprite(type, col, pose){
  if (typeof paFig === 'function'){ const pf = paFig(type, col, pose); if (pf) return pf; }
  const key = type+'|'+col+'|'+pose; let c = FIGS.get(key); if (c) return c;
  const S = 2, W = type==='cav' ? 56 : 36, H = 40;
  c = document.createElement('canvas'); c.width = W*S; c.height = H*S;
  const x = c.getContext('2d'); x.scale(S, S); x.lineCap = 'round'; x.lineJoin = 'round';
  if (type==='cav') drawCavFig(x, col, pose); else drawFootFig(x, type, col, pose);
  FIGS.set(key, c); return c;
}
function drawFootFig(x, type, col, pose){
  const charge = pose==='charge', dk = shade(col, .55);
  x.fillStyle = 'rgba(30,20,10,.25)'; x.beginPath(); x.ellipse(12, 37, 8.5, 2.3, 0, 0, TWO_PI); x.fill();
  x.strokeStyle = INK; x.lineWidth = 2.3;
  const st = charge ? 4.2 : 1.6;
  x.beginPath(); x.moveTo(10, 26); x.lineTo(10-st, 36); x.moveTo(14, 26); x.lineTo(14+st, 36); x.stroke();
  x.fillStyle = col; x.lineWidth = 1.4;
  x.beginPath(); x.moveTo(7.5, 14); x.lineTo(16.5, 14); x.lineTo(18, 28); x.lineTo(6, 28); x.closePath(); x.fill(); x.stroke();
  x.fillStyle = dk; x.fillRect(8.2, 21, 7.6, 2.6);
  x.fillStyle = '#625a4e'; x.beginPath(); x.ellipse(8, 15, 3, 2.2, 0, 0, TWO_PI); x.ellipse(16, 15, 3, 2.2, 0, 0, TWO_PI); x.fill();
  x.fillStyle = '#dcb88e'; x.beginPath(); x.arc(12, 10, 3.7, 0, TWO_PI); x.fill(); x.lineWidth = 1.2; x.stroke();
  x.fillStyle = '#3b352e'; x.beginPath(); x.arc(12, 9.2, 4.2, Math.PI, 0); x.closePath(); x.fill();
  x.fillStyle = col; x.beginPath(); x.arc(12, 4.6, 1.5, 0, TWO_PI); x.fill();
  if (type==='bow'){
    x.strokeStyle = '#5a3a1c'; x.lineWidth = 1.8; x.beginPath(); x.arc(20, 19, 9, -1.25, 1.25); x.stroke();
    x.strokeStyle = 'rgba(240,240,230,.9)'; x.lineWidth = .7; x.beginPath(); x.moveTo(20+9*Math.cos(-1.25), 19+9*Math.sin(-1.25)); x.lineTo(charge ? 15 : 19.5, 19); x.lineTo(20+9*Math.cos(1.25), 19+9*Math.sin(1.25)); x.stroke();
    if (charge){ x.strokeStyle = '#4a3220'; x.lineWidth = 1; x.beginPath(); x.moveTo(15, 19); x.lineTo(30, 19); x.stroke(); x.fillStyle = '#e8ecf0'; x.fillRect(30, 18.2, 2.4, 1.6); }
    x.strokeStyle = col; x.lineWidth = 2.4; x.beginPath(); x.moveTo(16, 17); x.lineTo(19, 19); x.stroke();
  } else {
    const a = charge ? -.12 : -1.28, L = charge ? 22 : 23, hx = 16, hy = 21;
    const ex = hx + L*Math.cos(a), ey = hy + L*Math.sin(a);
    x.strokeStyle = '#6b4a28'; x.lineWidth = 1.9; x.beginPath(); x.moveTo(hx - 5*Math.cos(a), hy - 5*Math.sin(a)); x.lineTo(ex, ey); x.stroke();
    x.fillStyle = '#e4e8ee'; x.strokeStyle = INK; x.lineWidth = .8; x.beginPath(); x.moveTo(ex + 4.2*Math.cos(a), ey + 4.2*Math.sin(a)); x.lineTo(ex + 1*Math.cos(a+1.7), ey + 1*Math.sin(a+1.7)); x.lineTo(ex + 1*Math.cos(a-1.7), ey + 1*Math.sin(a-1.7)); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = col; x.beginPath(); x.moveTo(ex, ey); x.lineTo(ex - 6*Math.cos(a) + 1, ey - 6*Math.sin(a) + 3); x.lineTo(ex - 4*Math.cos(a) - 1, ey - 4*Math.sin(a) + 4.5); x.closePath(); x.fill();
    x.strokeStyle = col; x.lineWidth = 2.4; x.beginPath(); x.moveTo(15, 17); x.lineTo(hx, hy); x.stroke();
    if (type==='shield' || pose==='wall'){ x.fillStyle = shade(col, .75); x.strokeStyle = INK; x.lineWidth = 1.4; x.beginPath(); x.ellipse(19.5, 21, 4.6, 7.4, 0, 0, TWO_PI); x.fill(); x.stroke(); x.fillStyle = '#d6b060'; x.beginPath(); x.arc(19.5, 21, 1.6, 0, TWO_PI); x.fill(); }
    else { x.fillStyle = shade(col, .7); x.strokeStyle = INK; x.lineWidth = 1.2; x.beginPath(); x.ellipse(6, 21, 3.1, 5.4, 0, 0, TWO_PI); x.fill(); x.stroke(); }
  }
}
function drawCavFig(x, col, pose){
  const run = pose==='a' || pose==='b', ext = pose==='a';
  x.fillStyle = 'rgba(30,20,10,.25)'; x.beginPath(); x.ellipse(26, 38, 16, 2.6, 0, 0, TWO_PI); x.fill();
  const hc = '#6c4527', hd = '#3d2614';
  const leg = (hx, a1, a2, c1) => { x.strokeStyle = c1; x.lineWidth = 3; x.beginPath(); x.moveTo(hx, 28); const kx = hx + a1, ky = 33; x.lineTo(kx, ky); x.lineTo(kx + a2, 38.5); x.stroke(); };
  const s = run ? (ext ? 1 : -1) : 0;
  leg(14, -3*s - 1, -5*s, hd); leg(35, 4*s, 6*s, hd);
  x.strokeStyle = INK; x.lineWidth = 1.2;
  x.fillStyle = hc; x.beginPath(); x.ellipse(25, 26, 14, 6.4, 0, 0, TWO_PI); x.fill(); x.stroke();
  x.beginPath(); x.moveTo(34, 24); x.quadraticCurveTo(40, 14, 44, 12); x.lineTo(48, 16); x.quadraticCurveTo(42, 22, 38, 31); x.closePath(); x.fill(); x.stroke();
  x.beginPath(); x.ellipse(47, 14.5, 5, 2.6, .75, 0, TWO_PI); x.fill(); x.stroke();
  x.strokeStyle = hd; x.lineWidth = 1.8; x.beginPath(); x.moveTo(36, 22); x.quadraticCurveTo(40, 13, 44, 10); x.stroke();
  x.strokeStyle = INK; x.lineWidth = 1.2; x.beginPath(); x.moveTo(11, 24); x.quadraticCurveTo(4, 26, 3 + (run ? s*2 : 0), 33); x.stroke();
  leg(18, 3*s + 1, 5*s, hc); leg(31, -4*s, -6*s, hc);
  x.fillStyle = col; x.strokeStyle = INK; x.lineWidth = 1; x.beginPath(); x.moveTo(12, 22); x.lineTo(28, 21); x.lineTo(29, 30); x.lineTo(20, 33); x.lineTo(11, 31); x.closePath(); x.fill(); x.stroke();
  x.fillStyle = col; x.lineWidth = 1.2; x.beginPath(); x.moveTo(20, 11); x.lineTo(28, 11); x.lineTo(29, 24); x.lineTo(19, 24); x.closePath(); x.fill(); x.stroke();
  x.fillStyle = shade(col, .55); x.fillRect(20, 17, 8, 2.2);
  x.fillStyle = '#dcb88e'; x.beginPath(); x.arc(24, 7, 3.4, 0, TWO_PI); x.fill(); x.stroke();
  x.fillStyle = '#3b352e'; x.beginPath(); x.arc(24, 6.4, 3.9, Math.PI, 0); x.closePath(); x.fill();
  x.fillStyle = col; x.beginPath(); x.arc(24, 2.2, 1.4, 0, TWO_PI); x.fill();
  const hx = 28, hy = 16, ex = 54, ey = pose==='idle' ? 4 : 13;
  x.strokeStyle = '#6b4a28'; x.lineWidth = 1.8; x.beginPath(); x.moveTo(hx - 6, hy + 2); x.lineTo(ex, ey); x.stroke();
  x.fillStyle = '#e4e8ee'; x.strokeStyle = INK; x.lineWidth = .8; x.beginPath(); x.moveTo(ex + 3, ey - .4); x.lineTo(ex - 2, ey - 1.6); x.lineTo(ex - 2, ey + 1.6); x.closePath(); x.fill(); x.stroke();
  x.strokeStyle = col; x.lineWidth = 2.4; x.beginPath(); x.moveTo(26, 14); x.lineTo(hx, hy); x.stroke();
}
function blitFig(ctx, spr, x, y, sc, flip, ax, ay, alpha){
  if (spr.__pa) return paBlit(ctx, spr, x, y, sc, flip, alpha);
  ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
  if (alpha != null && alpha < 1) ctx.globalAlpha = Math.max(0, alpha);
  ctx.drawImage(spr, -ax*sc, -ay*sc, spr.width/2*sc, spr.height/2*sc); ctx.restore();
}
/* 기마 장수 (벡터, 매 프레임 그림) — o:{g,run,wa,lean,t,rot,horse,weapon,noRider,hurt} */
function drawHorseman(c, x, y, sc, flip, col, o){
  { const pr = paRider(c, x, y, sc, flip, col, o); if (pr) return pr; }
  const t = o.t || 0, g = o.g || 0, hc = o.horse || '#6a4326', hd = shade(hc, .55), run = o.run;
  c.save(); c.translate(x, y); c.scale(flip ? -sc : sc, sc);
  if (o.rot){ c.translate(0, -24); c.rotate(o.rot); c.translate(0, 24); }
  c.lineCap = c.lineJoin = 'round';
  c.fillStyle = 'rgba(30,20,10,.3)'; c.beginPath(); c.ellipse(0, 1, 40, 5, 0, 0, TWO_PI); c.fill();
  const rear = o.rear || 0;
  const leg = (hx, hy, ph, c1) => {
    const a = run ? Math.sin(g*TWO_PI + ph) : Math.sin(t*2 + ph)*.1, kx = hx + a*11 - rear*6, ky = hy + 10 - rear*4, fx = kx + Math.sin(a*1.3 - .6)*10 - rear*7, fy = ky + 9 + Math.max(0, -a)*0 - rear*6;
    c.strokeStyle = INK; c.lineWidth = 4.8; c.beginPath(); c.moveTo(hx, hy); c.lineTo(kx, ky); c.lineTo(fx, Math.min(0, fy)); c.stroke();
    c.strokeStyle = c1; c.lineWidth = 3; c.beginPath(); c.moveTo(hx, hy); c.lineTo(kx, ky); c.lineTo(fx, Math.min(0, fy)); c.stroke();
  };
  leg(-19, -22, 2.4, hd); leg(22, -22, 3.9, hd);
  c.strokeStyle = INK; c.lineWidth = 1.6;
  const tail = Math.sin(t*14)*5*(run?1:.3);
  c.strokeStyle = INK; c.lineWidth = 3.2; c.beginPath(); c.moveTo(-26, -32); c.quadraticCurveTo(-40, -30 + tail, -46 - (run?4:0), -14 + tail*1.4); c.stroke();
  c.strokeStyle = hd; c.lineWidth = 1.8; c.beginPath(); c.moveTo(-26, -32); c.quadraticCurveTo(-40, -30 + tail, -46 - (run?4:0), -14 + tail*1.4); c.stroke();
  c.fillStyle = hc; c.strokeStyle = INK; c.lineWidth = 1.7;
  c.beginPath(); c.ellipse(0, -30, 29, 11.5, -rear*.18, 0, TWO_PI); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.13)'; c.beginPath(); c.ellipse(-2, -34, 20, 4, 0, 0, TWO_PI); c.fill();
  c.fillStyle = hc; c.strokeStyle = INK;
  c.beginPath(); c.moveTo(18, -38); c.quadraticCurveTo(30, -50, 40, -55); c.lineTo(47, -48); c.quadraticCurveTo(37, -40, 28, -22); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(47, -50, 9, 4.8, .75 + rear*.1, 0, TWO_PI); c.fill(); c.stroke();
  c.fillStyle = hd; c.beginPath(); c.moveTo(40, -57); c.lineTo(43, -64); c.lineTo(45, -56); c.closePath(); c.fill();
  c.strokeStyle = hd; c.lineWidth = 2.4; c.beginPath(); c.moveTo(21, -42); c.quadraticCurveTo(31, -53 + Math.sin(t*12)*1.4, 39, -58); c.stroke();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(49, -51.5, 1, 0, TWO_PI); c.fill();
  c.strokeStyle = '#b8352a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(42, -52); c.lineTo(52, -48); c.stroke();
  leg(-9, -22, 0, hc); leg(31, -22, 1.4, hc);
  // 말 갑옷 천
  c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 1.3;
  const fl = Math.sin(t*10)*2;
  c.beginPath(); c.moveTo(-22, -38); c.lineTo(8, -40); c.lineTo(10, -24 + fl); c.lineTo(-4, -16 + fl*1.5); c.lineTo(-20, -20 + fl); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-21, -34, 30, 2.2);
  if (o.noRider){ c.restore(); return null; }
  // 기수
  c.save(); c.translate(0, -40); c.rotate(o.lean || 0);
  const LK = o.look || null;
  c.fillStyle = LK && LK.cape ? LK.cape : shade(col, .5); c.globalAlpha = .9; c.strokeStyle = INK; c.lineWidth = 1.2;
  const cf = Math.sin(t*11)*4;
  c.beginPath(); c.moveTo(-5, -22); c.quadraticCurveTo(-24, -18 + cf, -40, -8 + cf*1.6 + (run?-6:0)); c.quadraticCurveTo(-26, -4 + cf, -6, 6); c.closePath(); c.fill(); c.stroke(); c.globalAlpha = 1;
  c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(-6, 8); c.lineTo(8, 8); c.lineTo(12, 1); c.lineTo(-8, 1); c.closePath(); c.fill(); c.stroke();
  const fw = LK && LK.fat ? 1.25 : 1;
  c.save(); c.scale(fw, 1);
  c.fillStyle = LK && LK.robe ? LK.robe : shade(col, .9); c.beginPath(); c.moveTo(-6, -21); c.lineTo(7, -21); c.lineTo(8, 2); c.lineTo(-7, 2); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = LK && LK.armor ? LK.armor : '#c9ccd2'; c.fillRect(-4.5, -17, 10, 7); c.strokeRect(-4.5, -17, 10, 7);
  c.fillStyle = '#6a625a'; c.beginPath(); c.ellipse(-6, -20, 4.6, 3, 0, 0, TWO_PI); c.ellipse(7, -20, 4.6, 3, 0, 0, TWO_PI); c.fill();
  c.restore();
  if (LK) riderHead(c, LK, col, cf, run);
  else {
    c.fillStyle = '#dcb88e'; c.beginPath(); c.arc(1, -29, 5.2, 0, TWO_PI); c.fill(); c.lineWidth = 1.3; c.stroke();
    c.fillStyle = '#2a251f'; c.beginPath(); c.arc(1, -30, 6, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#2a251f'; c.fillRect(3.2, -29, 1.4, 1.4);
    c.strokeStyle = col; c.lineWidth = 3.4; c.beginPath(); c.moveTo(1, -35); c.quadraticCurveTo(-8, -42 + cf*.6, -18 - (run?5:0), -36 + cf*1.4); c.stroke();
    c.strokeStyle = INK; c.lineWidth = .8; c.beginPath(); c.moveTo(1, -35); c.quadraticCurveTo(-8, -42 + cf*.6, -18 - (run?5:0), -36 + cf*1.4); c.stroke();
  }
  // 팔 + 무기
  const wa = o.wa == null ? -1.0 : o.wa, sx = 5, sy = -19, hx = sx + 14*Math.cos(wa*.4 + .2), hy = sy + 9 + 6*Math.sin(wa*.4);
  const wt = o.weapon || 'spear', L = { sword:40, bow:40, mace:46, blade:64, spear:76, halberd:78, snake:82 }[wt] || 76, back = wt==='sword' || wt==='bow' ? 6 : wt==='mace' ? 10 : 16;
  if (wt==='bow'){ c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.arc(-8, -12, 13, -1.9, 1.2); c.stroke(); c.strokeStyle = '#7a5530'; c.lineWidth = 1.4; c.beginPath(); c.arc(-8, -12, 13, -1.9, 1.2); c.stroke(); }
  const bx = hx - back*Math.cos(wa), by = hy - back*Math.sin(wa), tx = hx + (L-back)*Math.cos(wa), ty = hy + (L-back)*Math.sin(wa);
  c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.moveTo(bx, by); c.lineTo(tx, ty); c.stroke();
  c.strokeStyle = wt==='sword' || wt==='bow' ? '#dfe3e8' : wt==='mace' ? '#4a4038' : '#7a5530'; c.lineWidth = 1.9; c.beginPath(); c.moveTo(bx, by); c.lineTo(tx, ty); c.stroke();
  const ca = Math.cos(wa), sa = Math.sin(wa);
  c.fillStyle = '#eef1f5'; c.strokeStyle = INK; c.lineWidth = 1;
  if (wt==='blade'){ c.beginPath(); c.moveTo(tx - 14*ca, ty - 14*sa); c.quadraticCurveTo(tx - 14*ca - 11*sa, ty - 14*sa + 11*ca, tx + 7*ca - 13*sa, ty + 7*sa + 13*ca); c.lineTo(tx + 6*ca, ty + 6*sa); c.lineTo(tx - 2*ca, ty - 2*sa); c.closePath(); c.fill(); c.stroke(); }
  else if (wt==='spear' || wt==='halberd'){ c.beginPath(); c.moveTo(tx + 10*ca, ty + 10*sa); c.lineTo(tx - 1*ca - 3*sa, ty - 1*sa + 3*ca); c.lineTo(tx - 1*ca + 3*sa, ty - 1*sa - 3*ca); c.closePath(); c.fill(); c.stroke();
    if (wt==='halberd'){ c.beginPath(); c.moveTo(tx - 4*ca, ty - 4*sa); c.quadraticCurveTo(tx - 1*ca + 12*sa, ty - 1*sa - 12*ca, tx - 12*ca + 9*sa, ty - 12*sa - 9*ca); c.quadraticCurveTo(tx - 8*ca + 4*sa, ty - 8*sa - 4*ca, tx - 10*ca, ty - 10*sa); c.closePath(); c.fill(); c.stroke(); } }
  else if (wt==='snake'){ c.beginPath(); c.moveTo(tx - 2*ca, ty - 2*sa); for (let k = 0; k <= 5; k++){ const d = k*3.2, w = (k%2 ? 3.4 : -3.4)*(1 - k/7); c.lineTo(tx + d*ca - w*sa, ty + d*sa + w*ca); } c.lineTo(tx + 19*ca, ty + 19*sa); for (let k = 5; k >= 0; k--){ const d = k*3.2, w = (k%2 ? 3.4 : -3.4)*(1 - k/7) + (k%2 ? -2 : 2); c.lineTo(tx + d*ca - w*sa*.4, ty + d*sa + w*ca*.4); } c.closePath(); c.fill(); c.stroke(); }
  else if (wt==='mace'){ c.fillStyle = '#5a524a'; c.beginPath(); c.arc(tx, ty, 5, 0, TWO_PI); c.fill(); c.stroke(); c.fillStyle = '#8a8278'; for (let k = 0; k < 6; k++){ const a = k*TWO_PI/6; c.beginPath(); c.arc(tx + Math.cos(a)*5, ty + Math.sin(a)*5, 1.6, 0, TWO_PI); c.fill(); } }
  if (wt!=='sword' && wt!=='bow' && wt!=='mace'){ c.fillStyle = '#c23a2a'; c.beginPath(); c.moveTo(tx - 7*ca, ty - 7*sa); c.quadraticCurveTo(tx - 12*ca - 5*sa + Math.sin(t*16)*2, ty - 12*sa + 5*ca + 4, tx - 17*ca + Math.sin(t*16 + 1)*3, ty - 17*sa + 8); c.lineTo(tx - 10*ca, ty - 10*sa + 2); c.closePath(); c.fill(); }
  c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.moveTo(sx, sy); c.lineTo(hx, hy); c.stroke();
  c.strokeStyle = col; c.lineWidth = 3.4; c.beginPath(); c.moveTo(sx, sy); c.lineTo(hx, hy); c.stroke();
  c.fillStyle = '#dcb88e'; c.beginPath(); c.arc(hx, hy, 2.3, 0, TWO_PI); c.fill();
  c.restore(); c.restore();
  // 무기 끝 월드 좌표 (회전 무시)
  const lx = (flip ? -1 : 1)*sc;
  const rl = o.lean || 0, cr = Math.cos(rl), sr = Math.sin(rl);
  const px0 = tx*cr - ty*sr, py0 = tx*sr + ty*cr - 40;
  return { x: x + px0*lx, y: y + py0*sc };
}

/* 기수의 얼굴·쓰개·수염: 장수 생김새 자료(피부, 쓰개, 수염, 소품)를 따른다 */
const RSKIN = { a:'#e8c49a', b:'#d6a676', c:'#b04a32', d:'#a8724c', e:'#f2d6b6' };
function riderHead(c, L, col, cf, run){
  const sk = RSKIN[L.skin] || '#dcb88e', hc = L.hc || '#2a251f', bc = L.bc || '#1a140f', ex = L.extra || '', HAIR = '#1a140f';
  c.lineCap = c.lineJoin = 'round';
  if (L.beard==='long'){ c.fillStyle = bc; c.strokeStyle = INK; c.lineWidth = .8; c.beginPath(); c.moveTo(-2, -26); c.quadraticCurveTo(5 + cf*.15, -15, 3 + cf*.35, -4); c.quadraticCurveTo(-1, -12, -4, -25); c.closePath(); c.fill(); c.stroke(); }
  if (ex.includes('pheasant')){ for (const [d, k] of [[-1, 0], [1, .5]]){ c.strokeStyle = '#7a1f16'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(1 + d*2, -35); c.bezierCurveTo(-4 + d*3, -52 + cf*.4, -18 + d*3, -58 + cf*.8, -30 - (run?6:0) + d*2, -50 + cf*1.2 + k*4); c.stroke(); c.strokeStyle = '#e0b050'; c.lineWidth = .9; c.stroke(); } }
  c.fillStyle = sk; c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.arc(1, -29, 5.2, 0, TWO_PI); c.fill(); c.stroke();
  if (L.beard==='wild' || L.beard==='full'){ c.fillStyle = bc; c.beginPath(); c.arc(2, -27, 4.8, .05, Math.PI - .05); c.fill(); if (L.beard==='wild'){ c.strokeStyle = bc; c.lineWidth = 1.5; for (const a of [.35, 1.05, 1.75, 2.4]){ c.beginPath(); c.moveTo(2 + Math.cos(a)*4, -27 + Math.sin(a)*4); c.lineTo(2 + Math.cos(a)*8, -27 + Math.sin(a)*8); c.stroke(); } } }
  else if (L.beard==='long'){ c.fillStyle = bc; c.beginPath(); c.arc(2, -27, 4.6, .1, Math.PI - .1); c.fill(); }
  else if (L.beard==='goatee' || L.beard==='mustache' || L.beard==='stub'){ c.strokeStyle = bc; c.lineWidth = L.beard==='stub' ? .8 : 1.3; c.beginPath(); c.moveTo(-.5, -26.8); c.quadraticCurveTo(2.5, -25.6, 5.6, -26.8); c.stroke(); if (L.beard==='goatee'){ c.beginPath(); c.moveTo(3, -25.4); c.lineTo(3.6, -21.5); c.stroke(); } }
  c.fillStyle = HAIR; c.strokeStyle = INK; c.lineWidth = 1.1;
  if (L.hat==='helmet'){
    c.fillStyle = hc; c.beginPath(); c.arc(1, -30.5, 6.3, Math.PI, 0); c.lineTo(7.6, -28.5); c.lineTo(-5.6, -28.5); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = shade(hc, 1.4); c.fillRect(-4.2, -33.6, 9.8, 1.3);
    c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.moveTo(1, -36.6); c.lineTo(1, -40); c.stroke();
    if (ex.includes('plumeW') || ex.includes('plumeR')){ c.fillStyle = ex.includes('plumeW') ? '#f3f0e8' : '#c23a2a'; c.beginPath(); c.moveTo(1, -40); c.quadraticCurveTo(-6, -44 + cf*.4, -13 - (run?4:0), -36 + cf); c.quadraticCurveTo(-5, -38, 1, -38.5); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = .6; c.stroke(); }
  } else if (L.hat==='band'){
    c.beginPath(); c.arc(1, -30.5, 5.8, Math.PI, 0); c.closePath(); c.fill();
    c.fillStyle = hc; c.fillRect(-4.8, -33, 11.4, 2.8); c.strokeRect(-4.8, -33, 11.4, 2.8);
    c.strokeStyle = hc; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-4.5, -32); c.quadraticCurveTo(-10, -31 + cf*.5, -16 - (run?5:0), -28 + cf*1.2); c.stroke();
  } else if (L.hat==='scholar'){
    c.beginPath(); c.arc(1, -30.5, 5.8, Math.PI, 0); c.closePath(); c.fill();
    c.fillStyle = hc; c.beginPath(); c.moveTo(-4, -33); c.lineTo(-3, -41); c.lineTo(6, -41); c.lineTo(6.5, -33); c.closePath(); c.fill(); c.stroke();
  } else if (L.hat==='crown'){
    c.beginPath(); c.arc(1, -30.5, 5.8, Math.PI, 0); c.closePath(); c.fill();
    c.fillStyle = hc; c.fillRect(-1, -38, 5, 4); c.strokeRect(-1, -38, 5, 4); c.fillRect(-6, -39.5, 15, 1.8); c.strokeRect(-6, -39.5, 15, 1.8);
    c.strokeStyle = '#c23a2a'; c.lineWidth = .8; for (const x of [-5, 8]){ c.beginPath(); c.moveTo(x, -38); c.lineTo(x, -33); c.stroke(); }
  } else if (L.hat==='cap'){
    c.beginPath(); c.arc(1, -30.5, 5.8, Math.PI, 0); c.closePath(); c.fill();
    c.fillStyle = hc; c.beginPath(); c.moveTo(-3, -34); c.lineTo(-2, -39); c.lineTo(5, -39); c.lineTo(6, -34); c.closePath(); c.fill(); c.stroke();
  } else {
    c.beginPath(); c.arc(1, -30.5, 5.8, Math.PI, 0); c.closePath(); c.fill(); c.beginPath(); c.arc(-.5, -36.5, 2.6, 0, TWO_PI); c.fill();
  }
  c.fillStyle = '#1a140f'; c.fillRect(3.3, -29.6, 1.5, 1.3);
  if (ex.includes('patch')){ c.fillStyle = '#1a140f'; c.beginPath(); c.ellipse(4, -29.2, 1.9, 1.5, 0, 0, TWO_PI); c.fill(); c.strokeStyle = '#1a140f'; c.lineWidth = .6; c.beginPath(); c.moveTo(-3, -31.5); c.lineTo(5.5, -28.4); c.stroke(); }
}
/* 깃발 (펄럭임) */
function drawBanner(c, x, y, h, col, t, dir, ph, s){
  if (paDrawBanner(c, x, y, h, col, t, dir, ph, s)) return;
  c.save(); c.translate(x, y); c.scale(dir, 1);
  c.strokeStyle = INK; c.lineWidth = 2.2*s; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -h); c.stroke();
  const w = 26*s, hh = 38*s, wv = k => Math.sin(t*9 + ph + k*2.2)*3.4*s*k;
  c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 1.5*s;
  c.beginPath(); c.moveTo(0, -h);
  for (let i=1;i<=6;i++) c.lineTo(w*i/6, -h + wv(i/6));
  for (let i=6;i>=0;i--) c.lineTo(w*i/6 - (i===6?5*s:0), -h + hh + wv(i/6)*1.2 - (i===6?7*s:0));
  c.closePath(); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.moveTo(0, -h+hh*.42); for (let i=1;i<=6;i++) c.lineTo(w*i/6, -h+hh*.42 + wv(i/6)); for (let i=6;i>=0;i--) c.lineTo(w*i/6, -h+hh*.58 + wv(i/6)); c.closePath(); c.fill();
  c.fillStyle = '#d9b04a'; c.beginPath(); c.arc(0, -h-2*s, 2.6*s, 0, TWO_PI); c.fill();
  c.restore();
}
/* ---------- 효과 ---------- */
function puff(c, x, y, r, a, rgb){
  const g = c.createRadialGradient(x, y, r*.1, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; c.fillRect(x-r, y-r, r*2, r*2);
}
function glow(c, x, y, r, a, rgb){
  c.globalCompositeOperation = 'lighter'; puff(c, x, y, r, a, rgb); c.globalCompositeOperation = 'source-over';
}
function flame(c, x, y, s, t, ph){
  { const im = typeof paUi === 'function' && paUi('fx_fire'); if (im){ const f = 1 + .12*Math.sin(t*30 + (ph||0)), w = 26*s*f, h = w*im.naturalHeight/im.naturalWidth; c.save(); c.globalAlpha = .95; c.drawImage(im, x - w/2, y - h*.92, w, h); c.restore(); return; } }
  const f = 1 + .2*Math.sin(t*38 + ph), h = 17*s*f;
  for (const [k, col] of [[1,'#c8321a'],[.74,'#ff7d24'],[.46,'#ffc93c'],[.22,'#fff3b8']]){
    c.fillStyle = col; c.beginPath(); c.moveTo(x - 5.5*s*k, y);
    c.quadraticCurveTo(x - 7*s*k, y - h*.5*k, x + Math.sin(t*21 + ph)*2.4*s, y - h*k);
    c.quadraticCurveTo(x + 7*s*k, y - h*.5*k, x + 5.5*s*k, y); c.closePath(); c.fill();
  }
}
function inkSplat(c, x, y, r, a, rgb, R){
  c.fillStyle = `rgba(${rgb},${a})`;
  for (let i=0;i<9;i++){ const an = R()*TWO_PI, d = R()*r, rr = 1 + R()*r*.22; c.beginPath(); c.arc(x + Math.cos(an)*d, y + Math.sin(an)*d*.7, rr, 0, TWO_PI); c.fill(); }
}
function slashArc(c, cx, cy, r, a0, a1, k, flip){
  const sp = (flip ? -1 : 1);
  c.save(); c.translate(cx, cy); c.scale(sp, 1); c.lineCap = 'round';
  for (const [w, col, al] of [[11, 'rgba(20,12,6,'+(.55*(1-k))+')', 1], [6, 'rgba(255,240,200,'+(.9*(1-k))+')', 1], [2.6, 'rgba(255,255,255,'+(1-k)+')', 1]]){
    c.strokeStyle = col; c.lineWidth = w*(1-k*.5); c.beginPath(); c.arc(0, 0, r, a0, a0 + (a1-a0)*Math.min(1, k*2.2 + .25)); c.stroke();
  }
  c.restore();
}
function sparkBurst(c, x, y, k, R, n, col){
  c.save(); c.translate(x, y); c.strokeStyle = col || '#fff6c8'; c.lineCap = 'round';
  for (let i=0;i<n;i++){ const a = R()*TWO_PI, d1 = 6 + k*(14 + R()*26), d2 = d1 + 4 + R()*9; c.globalAlpha = 1 - k; c.lineWidth = 1.2 + R()*1.2; c.beginPath(); c.moveTo(Math.cos(a)*d1, Math.sin(a)*d1*.8); c.lineTo(Math.cos(a)*d2, Math.sin(a)*d2*.8); c.stroke(); }
  c.globalAlpha = 1; c.restore();
}
