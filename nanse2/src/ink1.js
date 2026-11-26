/* =====================================================================
   수묵 전장 연출 (640×360 고해상 캔버스 · 코드로 그린 먹과 안료)
   ===================================================================== */
const VW = 640, VH = 360, HZ = 150, GY0 = 200, GY1 = 338;
const TWO_PI = Math.PI*2;
const TOD = {
  dawn:  { top:'#8fa3b0', mid:'#e6d2b2', low:'#f5c58c', sun:'#fff0c8', sx:.74, sy:.5, far:'#a39fa0', mid2:'#7a7d7e', near:'#4b504e', fog:'255,232,200', gr:['#b89c64','#8e7948','#5e5334'], moon:0 },
  day:   { top:'#a2bccb', mid:'#dbe5df', low:'#efe9d4', sun:'#ffffff', sx:.28, sy:.34, far:'#a9b5b6', mid2:'#7f908d', near:'#4f5e59', fog:'242,242,228', gr:['#aba368','#80864f','#575d38'], moon:0 },
  dusk:  { top:'#5f4d66', mid:'#d4855c', low:'#f2b46a', sun:'#ffd9a0', sx:.24, sy:.52, far:'#8c6c68', mid2:'#5d4a4f', near:'#2f2a30', fog:'240,168,118', gr:['#8c6e4b','#6a5238','#43372a'], moon:0 },
  night: { top:'#0f1729', mid:'#22335a', low:'#4a5a80', sun:'#eef1f7', sx:.7, sy:.24, far:'#33436a', mid2:'#232f4b', near:'#131a2a', fog:'110,134,180', gr:['#3b4842','#2b362f','#1c2420'], moon:1 }
};
const sdOf = A => hashStr(String(A.seed));
function todOf(A){
  const fire = A.kind==='fight' && (A.myT==='fire' || A.foeT==='fire');
  const k = sdOf(A) % 4;
  return TOD[fire ? (k%2 ? 'night' : 'dusk') : ['dawn','day','dusk','day'][k]];
}
const rgba = (rgb, a) => `rgba(${rgb},${a})`;
const BGC = new Map();

function ridge(x, R, base, amp, step, color, fog, fa, floor){
  const pts = []; let h = 0;
  for (let px=-step; px<=VW+step*2; px+=step){ h = h*.5 + (R()-.5)*amp*1.7; pts.push([px, base + h]); }
  x.save();
  x.beginPath(); x.moveTo(-step, floor); x.lineTo(pts[0][0], pts[0][1]);
  for (let i=1;i<pts.length-1;i++){ const mx = (pts[i][0]+pts[i+1][0])/2, my = (pts[i][1]+pts[i+1][1])/2; x.quadraticCurveTo(pts[i][0], pts[i][1], mx, my); }
  x.lineTo(VW+step*2, floor); x.closePath();
  x.fillStyle = color; x.fill(); x.clip();
  const g = x.createLinearGradient(0, base-amp*1.2, 0, floor); g.addColorStop(0, rgba(fog,0)); g.addColorStop(1, rgba(fog,fa));
  x.fillStyle = g; x.fillRect(0, base-amp*2, VW, floor-(base-amp*2));
  // 능선 위 먹 번짐
  x.strokeStyle = 'rgba(20,14,10,.10)'; x.lineWidth = 1.4; x.beginPath();
  for (let i=0;i<pts.length;i++) i ? x.lineTo(pts[i][0], pts[i][1]+2) : x.moveTo(pts[i][0], pts[i][1]+2);
  x.stroke();
  x.restore();
}
function pine(x, px, py, s, tone, fogRgb, fa){
  x.save(); x.translate(px, py); x.scale(s, s);
  x.strokeStyle = tone; x.lineWidth = 2.2; x.lineCap = 'round';
  x.beginPath(); x.moveTo(0, 0); x.lineTo(0.5, -22); x.stroke();
  x.fillStyle = tone;
  for (let i=0;i<4;i++){ const yy = -8 - i*7, w = 13 - i*2.6; x.beginPath(); x.moveTo(-w, yy+5); x.quadraticCurveTo(-w*.4, yy-3, 0, yy-8); x.quadraticCurveTo(w*.4, yy-3, w, yy+5); x.quadraticCurveTo(0, yy+2, -w, yy+5); x.fill(); }
  x.restore();
}
function brushStrokes(x, R, n, y0, y1, dark, light, len){
  for (let i=0;i<n;i++){
    const px = R()*VW, py = y0 + R()*(y1-y0), l = len*(.4+R()), th = .6 + R()*1.8, dk = R() < .55;
    x.strokeStyle = dk ? dark.replace('A', (.04 + R()*.1).toFixed(3)) : light.replace('A', (.05 + R()*.1).toFixed(3));
    x.lineWidth = th; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + l*.5, py + (R()-.5)*3, px + l, py + (R()-.5)*2); x.stroke();
  }
}
function drawWall(x, left, h, tod){
  const w = 168, X0 = left ? -14 : VW - w + 14, baseY = GY0 + 34, top = baseY - h;
  const stone = mix(tod.near, '#c9b894', .42), dk = mix(stone, '#000000', .45);
  x.save();
  // 성벽 몸체
  let g = x.createLinearGradient(0, top, 0, baseY); g.addColorStop(0, mix(stone,'#ffffff',.18)); g.addColorStop(1, mix(stone,'#000000',.25));
  x.fillStyle = g; x.strokeStyle = INK; x.lineWidth = 2;
  x.beginPath(); x.rect(X0, top, w, h); x.fill(); x.stroke();
  // 성가퀴
  const tw = 14, n = Math.floor(w/ (tw*1.6));
  for (let i=0;i<n;i++){ const cx = X0 + 6 + i*tw*1.6; x.fillStyle = mix(stone,'#ffffff',.1); x.beginPath(); x.rect(cx, top-9, tw, 9); x.fill(); x.stroke(); }
  // 벽돌 줄눈
  x.strokeStyle = 'rgba(30,20,12,.28)'; x.lineWidth = 1;
  for (let yy=top+10; yy<baseY; yy+=11){ x.beginPath(); x.moveTo(X0, yy); x.lineTo(X0+w, yy); x.stroke(); for (let xx=X0 + ((yy/11|0)%2?10:0); xx<X0+w; xx+=20){ x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx, yy+11); x.stroke(); } }
  // 성문 (안쪽 끝)
  const gx = left ? X0 + w - 62 : X0 + 14, gw = 48, gh = Math.min(48, h*.62);
  x.fillStyle = '#1c130c'; x.strokeStyle = INK; x.lineWidth = 2;
  x.beginPath(); x.moveTo(gx, baseY); x.lineTo(gx, baseY-gh+14); x.quadraticCurveTo(gx+gw/2, baseY-gh-10, gx+gw, baseY-gh+14); x.lineTo(gx+gw, baseY); x.closePath(); x.fill(); x.stroke();
  x.strokeStyle = '#7a5a2a'; x.lineWidth = 1.5; for (let i=1;i<4;i++){ x.beginPath(); x.moveTo(gx+gw*i/4, baseY-gh+10); x.lineTo(gx+gw*i/4, baseY); x.stroke(); }
  // 문루 (기와지붕 2층)
  const tx = left ? X0 + w - 96 : X0 + 48, ty = top - 9;
  const roof = (cx, cy, rw, rh, c1) => { x.fillStyle = c1; x.strokeStyle = INK; x.lineWidth = 2; x.beginPath(); x.moveTo(cx-rw, cy); x.quadraticCurveTo(cx-rw*.55, cy-rh*.1, cx-rw*.7, cy-rh*.62); x.lineTo(cx-rw*.25, cy-rh*.82); x.quadraticCurveTo(cx, cy-rh*1.3, cx+rw*.25, cy-rh*.82); x.lineTo(cx+rw*.7, cy-rh*.62); x.quadraticCurveTo(cx+rw*.55, cy-rh*.1, cx+rw, cy); x.quadraticCurveTo(cx, cy-rh*.35, cx-rw, cy); x.closePath(); x.fill(); x.stroke(); };
  x.fillStyle = mix(stone,'#7a2a1a',.35); x.strokeStyle = INK; x.beginPath(); x.rect(tx-30, ty-34, 60, 34); x.fill(); x.stroke();
  x.fillStyle = '#2a1a10'; x.fillRect(tx-5, ty-26, 10, 14);
  roof(tx, ty-32, 44, 26, '#3a3f46');
  x.fillStyle = mix(stone,'#7a2a1a',.35); x.beginPath(); x.rect(tx-18, ty-62, 36, 24); x.fill(); x.stroke();
  roof(tx, ty-58, 32, 22, '#2d3238');
  // 깃대
  x.strokeStyle = INK; x.lineWidth = 2; x.beginPath(); x.moveTo(tx, ty-82); x.lineTo(tx, ty-108); x.stroke();
  x.restore();
}
function inkBg(A){
  const pb = paBg(A.terr), pw = !A.castle || paArt('siege_wall');
  const key = [A.terr, A.castle||'-', A.castle ? Math.round((A.wall||0)/10) : 0, A.kind, todOf(A)===TOD.night?'n':todOf(A)===TOD.dusk?'u':todOf(A)===TOD.dawn?'a':'d', A.seed, pb && pw ? 'P' : 'V'].join('|');
  let c = BGC.get(key); if (c) return c;
  if (BGC.size > 5) BGC.clear();
  const tod = todOf(A), R = seeded(hashStr('bg'+key)), terr = A.terr;
  c = document.createElement('canvas'); c.width = VW; c.height = VH;
  const x = c.getContext('2d');
  x.lineCap = 'round'; x.lineJoin = 'round';
  if (pb && pw){ paBgPaint(x, pb, tod); if (A.castle) paWall(x, A.castle==='L', 54 + Math.round((A.wall||0)/3.2)); BGC.set(key, c); return c; }
  // 하늘
  let g = x.createLinearGradient(0, 0, 0, HZ+40); g.addColorStop(0, tod.top); g.addColorStop(.6, tod.mid); g.addColorStop(1, tod.low);
  x.fillStyle = g; x.fillRect(0, 0, VW, HZ+60);
  const sx = tod.sx*VW, sy = tod.sy*HZ;
  g = x.createRadialGradient(sx, sy, 3, sx, sy, 120); g.addColorStop(0, rgba(tod.fog,.6)); g.addColorStop(1, rgba(tod.fog,0));
  x.fillStyle = g; x.fillRect(0, 0, VW, HZ+60);
  x.fillStyle = tod.sun; x.beginPath(); x.arc(sx, sy, tod.moon ? 13 : 21, 0, TWO_PI);
  if (tod.moon){ x.moveTo(sx+19, sy-4); x.arc(sx+8, sy-4, 11, 0, TWO_PI, true); x.fill('evenodd'); for (let i=0;i<46;i++){ x.fillStyle = `rgba(255,255,240,${.25+R()*.5})`; x.fillRect(R()*VW, R()*HZ*.8, 1.3, 1.3); } } else x.fill();
  // 먹 번진 구름
  for (let i=0;i<7;i++){ const cx = R()*VW, cy = 14 + R()*HZ*.55, rw = 70 + R()*110; const gg = x.createRadialGradient(cx, cy, 2, cx, cy, rw); gg.addColorStop(0, rgba(tod.fog, tod.moon ? .12 : .35)); gg.addColorStop(1, rgba(tod.fog, 0)); x.fillStyle = gg; x.save(); x.translate(cx, cy); x.scale(1, .16); x.translate(-cx, -cy); x.fillRect(cx-rw, cy-rw, rw*2, rw*2); x.restore(); }
  // 먼 산 삼중
  const big = terr==='mountain' ? 1.5 : terr==='pass' ? 1.2 : 1;
  ridge(x, R, HZ-44, 30*big, 52, tod.far, tod.fog, .55, HZ+60);
  ridge(x, R, HZ-22, 26*big, 44, tod.mid2, tod.fog, .5, HZ+60);
  ridge(x, R, HZ-6, 16*big, 34, tod.near, tod.fog, .42, HZ+60);
  // 먼 숲
  for (let i=0;i<34;i++) pine(x, R()*VW, HZ+4+R()*10, .55+R()*.3, mix(mix(tod.near,'#1d2a22',.35), tod.low, .4), tod.fog, 0);
  // 땅
  const gc = tod.gr;
  g = x.createLinearGradient(0, HZ+4, 0, VH); g.addColorStop(0, gc[0]); g.addColorStop(.45, gc[1]); g.addColorStop(1, gc[2]);
  x.fillStyle = g; x.beginPath(); x.moveTo(0, HZ+10);
  for (let px=0; px<=VW; px+=40) x.lineTo(px, HZ+8 + Math.sin(px/70+R())*3);
  x.lineTo(VW, VH); x.lineTo(0, VH); x.closePath(); x.fill();
  // 강
  if (terr==='river'){
    const y0 = HZ+16, y1 = HZ+50;
    g = x.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, mix('#7fa3b3', tod.low, .35)); g.addColorStop(1, mix('#4d7186', tod.near, .25));
    x.fillStyle = g; x.beginPath(); x.moveTo(0, y0+2);
    for (let px=0; px<=VW; px+=32) x.lineTo(px, y0 + Math.sin(px/55)*2.4);
    for (let px=VW; px>=0; px-=32) x.lineTo(px, y1 + Math.sin(px/48+1)*3);
    x.closePath(); x.fill();
    x.strokeStyle = 'rgba(255,255,255,.32)'; x.lineWidth = 1.2;
    for (let i=0;i<38;i++){ const px = R()*VW, py = y0+4+R()*(y1-y0-8), l = 14 + R()*34; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px+l/2, py-1.5, px+l, py); x.stroke(); }
    x.strokeStyle = INK; x.lineWidth = 1.5; x.globalAlpha = .5; x.beginPath(); x.moveTo(0, y1+3); for (let px=0; px<=VW; px+=32) x.lineTo(px, y1 + Math.sin(px/48+1)*3 + 2); x.stroke(); x.globalAlpha = 1;
    for (let i=0;i<26;i++){ const px = R()*VW, py = y1 + 2 + R()*4; x.strokeStyle = mix(tod.near, '#3a4a30', .5); x.lineWidth = 1.3; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px+2, py-8, px+4+R()*4, py-14-R()*8); x.stroke(); }
  }
  // 안개 띠
  g = x.createLinearGradient(0, HZ-14, 0, HZ+54); g.addColorStop(0, rgba(tod.fog,0)); g.addColorStop(.35, rgba(tod.fog, tod.moon ? .2 : .5)); g.addColorStop(1, rgba(tod.fog,0));
  x.fillStyle = g; x.fillRect(0, HZ-14, VW, 68);
  // 마른 붓 질감
  brushStrokes(x, R, 520, GY0-30, VH, 'rgba(25,16,8,A)', 'rgba(255,240,200,A)', 52);
  // 풀·바위
  for (let i=0;i<150;i++){ const px = R()*VW, py = GY0 + R()*(VH-GY0), s = .5 + (py-GY0)/(VH-GY0)*.9; x.strokeStyle = mix(gc[1], '#26301c', .5); x.globalAlpha = .55; x.lineWidth = 1.2*s; x.beginPath(); x.moveTo(px, py); x.lineTo(px-2*s, py-6*s); x.moveTo(px, py); x.lineTo(px+1*s, py-7*s); x.moveTo(px, py); x.lineTo(px+3*s, py-5*s); x.stroke(); x.globalAlpha = 1; }
  if (terr==='mountain'){
    for (let side=0; side<2; side++) for (let i=0;i<5;i++){
      const bx = side ? VW - 20 - R()*90 : 20 + R()*90, by = GY0 + R()*(GY1-GY0), s = 1 + (by-GY0)/(VH-GY0)*1.2;
      x.fillStyle = mix(gc[2], '#6e6658', .5); x.strokeStyle = INK; x.lineWidth = 1.6;
      x.beginPath(); x.moveTo(bx-18*s, by); x.lineTo(bx-12*s, by-16*s); x.lineTo(bx-2*s, by-26*s); x.lineTo(bx+12*s, by-14*s); x.lineTo(bx+20*s, by); x.closePath(); x.fill(); x.stroke();
      x.fillStyle = 'rgba(255,255,255,.18)'; x.beginPath(); x.moveTo(bx-2*s, by-26*s); x.lineTo(bx+12*s, by-14*s); x.lineTo(bx+2*s, by-6*s); x.closePath(); x.fill();
    }
    for (let i=0;i<14;i++) pine(x, R()<.5 ? 10+R()*120 : VW-10-R()*120, HZ+20+R()*50, .9+R()*.6, mix(tod.near,'#1d2a22',.5), tod.fog, .1);
  } else if (terr==='pass'){
    for (const left of [true, false]){
      const w = 170 + R()*30; x.fillStyle = mix(tod.near, '#4b463c', .55); x.strokeStyle = INK; x.lineWidth = 2;
      x.beginPath(); const ox = left ? 0 : VW;
      x.moveTo(ox, 0); x.lineTo(ox + (left?1:-1)*w*.9, 0); x.lineTo(ox + (left?1:-1)*w, 40); x.lineTo(ox + (left?1:-1)*(w*.72), 96); x.lineTo(ox + (left?1:-1)*(w*.95), 150); x.lineTo(ox + (left?1:-1)*(w*.6), GY0+14); x.lineTo(ox, GY0+30); x.closePath(); x.fill(); x.stroke(); x.save(); x.clip();
      x.strokeStyle = 'rgba(15,10,6,.32)'; x.lineWidth = 1.3;
      for (let i=0;i<22;i++){ const sy = 10 + i*9, sxx = left ? R()*w*.6 : VW - R()*w*.6; x.beginPath(); x.moveTo(sxx, sy); x.lineTo(sxx + (left?1:-1)*(30+R()*40), sy + R()*5); x.stroke(); }
      const gg = x.createLinearGradient(0,0,0,GY0); gg.addColorStop(0, 'rgba(0,0,0,.45)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gg; x.fillRect(left?0:VW-w-40, 0, w+40, GY0); x.restore();
      for (let i=0;i<4;i++) pine(x, ox + (left?1:-1)*(20+R()*90), 52 + R()*100, 1.1+R()*.5, mix(tod.near,'#1d2a22',.55), tod.fog, .05);
    }
    // 먼 관문
    const gx = VW/2 - 36, gy = HZ + 6; x.fillStyle = mix(tod.near, '#3a3028', .5); x.strokeStyle = INK; x.lineWidth = 1.6;
    x.beginPath(); x.rect(gx, gy-26, 72, 26); x.fill(); x.stroke(); x.fillStyle = '#17100a'; x.beginPath(); x.moveTo(gx+28, gy); x.lineTo(gx+28, gy-12); x.quadraticCurveTo(gx+36, gy-20, gx+44, gy-12); x.lineTo(gx+44, gy); x.fill();
    x.fillStyle = '#2b3036'; x.beginPath(); x.moveTo(gx-8, gy-26); x.quadraticCurveTo(gx+18, gy-30, gx+36, gy-48); x.quadraticCurveTo(gx+54, gy-30, gx+80, gy-26); x.quadraticCurveTo(gx+36, gy-34, gx-8, gy-26); x.fill(); x.stroke();
  } else {
    for (let i=0;i<10;i++) pine(x, R()<.5 ? 8+R()*140 : VW-8-R()*140, HZ+14+R()*38, .85+R()*.45, mix(tod.near,'#1d2a22',.5), tod.fog, .12);
  }
  if (A.castle) drawWall(x, A.castle==='L', 54 + Math.round((A.wall||0)/3.2), tod);
  // 종이결
  for (let i=0;i<2600;i++){ x.fillStyle = R()<.5 ? 'rgba(255,245,220,.05)' : 'rgba(30,20,10,.045)'; x.fillRect(R()*VW, R()*VH, 1 + R()*2, 1); }
  BGC.set(key, c);
  return c;
}
let VIGN = null;
function vignette(){
  if (VIGN) return VIGN;
  VIGN = document.createElement('canvas'); VIGN.width = VW; VIGN.height = VH;
  const x = VIGN.getContext('2d'), g = x.createRadialGradient(VW/2, VH/2, VH*.35, VW/2, VH/2, VW*.62);
  g.addColorStop(0, 'rgba(10,6,2,0)'); g.addColorStop(1, 'rgba(10,6,2,.55)'); x.fillStyle = g; x.fillRect(0, 0, VW, VH);
  return VIGN;
}
