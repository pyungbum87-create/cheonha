/* ---------- 공성 장면: 우리가 칠 때는 성을 바라보고, 지킬 때는 성벽 위에서 ---------- */
function pxSiege(ctx, A){
  return A.view==='wall' ? pxWallTop(ctx, A) : pxAssault(ctx, A);
}
const SIEGE_PLAN_TXT = { starve:'고사 작전', tunnel:'땅굴', inside:'내응', flood:'수공', rams:'공성 병기', lure:'유인', rain:'화살비', scorch:'청야', oil:'끓는 기름', empty:'공성계', sally:'결사대' };

/* 우리가 성을 친다: 왼쪽에서 진격, 오른쪽 성벽 위에는 적 궁수 */
function pxAssault(ctx, A){
  const bg = inkBg(Object.assign({}, A, { castle:'R' })), vg = vignette(), R = seeded(hashStr('as' + A.seed + A.plan));
  const meWin = (A.myLoss/(A.myBefore||1)) <= (A.foeLoss/(A.foeBefore||1)), plan = A.plan || '';
  const w = 168, X0 = VW - w + 14, baseY = GY0 + 34, h = 54 + Math.round((A.wall||0)/3.2), top = baseY - h;
  const gx = X0 + 14, gw = 48, gh = Math.min(48, h*.62);
  const starving = plan==='starve' || A.grainLow;
  // 성벽 위 수비병
  const cvM = CORPS_V[A.myCorps], cvF = CORPS_V[A.foeCorps];
  const defs = []; for (let i = 0; i < 7; i++){ const x = 572 + i*10 + (R()-.5)*3; defs.push({ x, y: top + 1, ph: R()*6, bow: cvF==='ranged' ? i%4!==3 : i%2===0, fallT: meWin ? .74 + R()*.12 : (R() < .2 ? .5 + R()*.3 : null) }); }
  if (starving) defs.splice(0, 3);
  // 공격군
  const atk = [], N = 26, ladders = [496 + 0, 578, 604, 628].slice(plan==='rams' ? 1 : 0);
  for (let i = 0; i < N; i++){
    const lad = i < ladders.length*2 ? ladders[i % ladders.length] : null, climbIdx = lad != null ? Math.floor(i / ladders.length) : 0;
    const x0 = 30 + R()*200, y0 = 252 + R()*80, xt = lad != null ? lad - 4 + climbIdx*3 : 420 + R()*150, yt = lad != null ? baseY + 4 : 250 + R()*70;
    atk.push({ x0, y0, xt, yt, lad, climbIdx, t0: .06 + R()*.12, t1: .32 + R()*.12, ph: R()*6, type: i%5===4 ? 'bow' : i%7===3 ? 'shield' : 'spear', fallT: null });
  }
  const nFall = clamp(Math.round(A.myLoss/(A.myBefore||1)*2.2*N), 1, N - 4);
  atk.slice().sort(() => R() - .5).slice(0, nFall).forEach(m => { m.fallT = m.lad != null ? (meWin ? .52 + R()*.1 : .5 + R()*.25) : .2 + R()*.55; });
  const arrows = []; for (let i = 0; i < 34; i++){ const d = defs[(R()*defs.length)|0]; if (!d) break; arrows.push({ d, tg: atk[(R()*N)|0], t0: .1 + R()*.6, dur: .06 + R()*.03 }); }
  const myArrows = []; for (let i = 0; i < 18; i++) myArrows.push({ fx: 120 + R()*160, fy: 270 + R()*50, tx: 572 + R()*64, ty: top - 6 + R()*8, t0: .16 + R()*.5, dur: .07, fire: plan==='fire' || A.myT==='fire' });
  const pos = (m, t) => {
    const k = ease(cl01((t - m.t0)/(m.t1 - m.t0)));
    let x = lerp(m.x0, m.xt, k), y = lerp(m.y0, m.yt, k), climb = 0;
    if (m.lad != null && t > .42){ const top2 = top + 4 + m.climbIdx*16; climb = ease(cl01((t - .42 - m.climbIdx*.06)/.22)); y = lerp(m.yt, top2, climb); if (meWin && t > .72 && m.climbIdx===0){ y = top - 2; x = m.lad + 8; } }
    return [x, y, k < 1, climb];
  };
  return (t, prev) => {
    const tt = t*5.4;
    const shake = (plan==='rams' || plan==='tunnel') && [.47, .57, .67].some(h => t > h && t < h + .03) ? 4 : 0;
    const zk = ease(cl01((t - .18)/.4)), z = 1.04 + .26*zk, cx = lerp(VW/2, 505, zk), cy = lerp(VH/2, 215, zk);
    ctx.save(); ctx.translate(cx + (shake ? Math.sin(t*900)*shake : 0), cy); ctx.scale(z, z); ctx.translate(-cx, -cy);
    ctx.drawImage(bg, 0, 0);
    // 수공: 물결이 성벽 아래를 덮는다
    if (plan==='flood' && t > .18){ const k = ease(cl01((t - .18)/.25)); ctx.fillStyle = `rgba(70,110,140,${.55*k})`; ctx.fillRect(0, baseY - 6 - 10*k, VW*k*1.2, 40 + 30*k); ctx.strokeStyle = `rgba(230,240,250,${.6*k})`; ctx.lineWidth = 1.5; for (let i = 0; i < 14; i++){ const wx = (i*53 + tt*40) % (VW*k*1.2), wy = baseY - 4 + (i%3)*10; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx + 8, wy - 4, wx + 16, wy); ctx.stroke(); } }
    // 땅굴: 성벽 밑에서 흙먼지, 금이 간다
    if (plan==='tunnel' && t > .4){ const k = cl01((t - .4)/.3); ctx.strokeStyle = `rgba(20,12,6,${.8*k})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(600, baseY); ctx.lineTo(594, baseY - h*.4*k); ctx.lineTo(606, baseY - h*.7*k); ctx.lineTo(598, top + 6); ctx.stroke(); for (let i = 0; i < 4; i++) puff(ctx, 584 + i*12, baseY - 2 - k*14, 10 + k*30, .4*(1 - k*.5), '150,120,80'); if (A.ok && t > .62){ ctx.fillStyle = 'rgba(20,12,6,.85)'; ctx.beginPath(); ctx.moveTo(588, baseY); ctx.lineTo(594, top + h*.35); ctx.lineTo(612, top + h*.45); ctx.lineTo(618, baseY); ctx.fill(); } }
    // 성문: 내응이면 안에서 열리고, 충차가 두드린다
    const gateOpen = (plan==='inside' && A.ok && t > .42) || (meWin && t > .7);
    if (gateOpen){ const k = cl01((t - (plan==='inside' ? .42 : .7))/.08); glow(ctx, gx + gw/2, baseY - gh/2, 60*k, .7*k, '255,220,150'); ctx.fillStyle = `rgba(255,235,190,${.55*k})`; ctx.fillRect(gx + 6, baseY - gh + 14, gw - 12, gh - 14); }
    // 사다리
    ctx.strokeStyle = '#5a3a1c'; ctx.lineWidth = 2.2;
    for (const L of ladders){ if (t < .36) continue; const k = ease(cl01((t - .36)/.06)), lean = (meWin || t < .62) ? 0 : ease(cl01((t - .62)/.08))*.5; ctx.save(); ctx.translate(L - 8, baseY + 6); ctx.rotate(-.18 - lean); const lh = (baseY - top + 12)*k; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -lh); ctx.moveTo(8, 0); ctx.lineTo(8, -lh); for (let r = 6; r < lh; r += 8){ ctx.moveTo(0, -r); ctx.lineTo(8, -r); } ctx.stroke(); ctx.restore(); }
    // 충차
    if (plan==='rams' || A.myU==='spear'){ const arrive = ease(cl01((t - .1)/.3)), hit = [.47, .57, .67].reduce((s, h) => s + (t > h && t < h + .04 ? Math.sin((t - h)/.04*Math.PI) : 0), 0);
      const rx = lerp(260, gx - 46, arrive) + hit*10, ry = baseY + 14; ctx.fillStyle = '#5a3a1c'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(rx - 30, ry); ctx.lineTo(rx - 22, ry - 26); ctx.lineTo(rx + 26, ry - 26); ctx.lineTo(rx + 34, ry); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(rx - 16, ry - 10); ctx.lineTo(rx + 44 + hit*6, ry - 10); ctx.stroke(); ctx.fillStyle = '#6a625a'; ctx.beginPath(); ctx.arc(rx + 46 + hit*6, ry - 10, 5, 0, TWO_PI); ctx.fill();
      ctx.fillStyle = '#2a1a10'; for (const wx of [-20, 0, 22]){ ctx.beginPath(); ctx.arc(rx + wx, ry + 2, 5, 0, TWO_PI); ctx.fill(); }
      if (hit > .5){ puff(ctx, gx + 4, baseY - 10, 20, .5, '160,140,110'); sparkBurst(ctx, gx + 2, baseY - 12, hit, seeded(hashStr('r' + Math.floor(t*30))), 6); } }
    // 공격군
    const list = atk.map(m => [pos(m, t), m]).sort((a, b) => a[0][1] - b[0][1]);
    for (const [[x, y, mv, climb], m] of list){
      if (m.lad != null && climb > 0 && m.fallT == null && !meWin && t > .66 && m.climbIdx===0){}
      if (m.fallT != null && t > m.fallT){ const k = cl01((t - m.fallT)/.08); const fy = m.lad != null && climb > 0 ? lerp(y, baseY + 8, ease(k)) : y; ctx.save(); ctx.translate(x, fy); ctx.rotate(-1.4*k); ctx.translate(-x, -fy); blitFig(ctx, figSprite(m.type, A.myCol, 'idle'), x, fy, .62, false, 12, 37, 1 - cl01((t - m.fallT - .1)/.2)*.8); ctx.restore(); continue; }
      const pose = climb > 0 ? 'charge' : mv ? (Math.sin(tt*14 + m.ph) > 0 ? 'charge' : 'idle') : (m.type==='bow' ? 'charge' : Math.sin(tt*8 + m.ph) > .3 ? 'charge' : 'idle');
      blitFig(ctx, figSprite(m.type, A.myCol, pose), x, y - (mv ? Math.abs(Math.sin(tt*14 + m.ph))*1.5 : 0), climb > 0 ? .55 : .62 + (y - 240)/400, false, 12, 37);
    }
    // 수비병 (성벽 위)
    for (const d of defs){
      if (d.fallT != null && t > d.fallT){ const k = cl01((t - d.fallT)/.1), fy = lerp(d.y, baseY + 6, ease(k)); ctx.save(); ctx.translate(d.x, fy); ctx.rotate(1.6*k); ctx.translate(-d.x, -fy); blitFig(ctx, figSprite('bow', A.foeCol, 'idle'), d.x, fy, .55, true, 12, 37, 1 - k*.5); ctx.restore(); continue; }
      const shoot = Math.sin(tt*6 + d.ph) > 0;
      ctx.globalAlpha = starving ? .75 : 1;
      blitFig(ctx, figSprite(d.bow ? 'bow' : cvF==='heavy' ? 'shield' : 'spear', cvF==='heavy' && !d.bow ? shade(A.foeCol, .7) : A.foeCol, d.bow && shoot ? 'charge' : 'idle'), d.x, d.y + (starving ? 3 : 0), .55, true, 12, 37);
      ctx.globalAlpha = 1;
    }
    // 깃발
    if (!(meWin && t > .8)) drawBanner(ctx, 616, top - 4, 40, A.foeCol, tt, 1, 1, .8);
    else { const k = ease(cl01((t - .8)/.06)); drawBanner(ctx, 588, top - 4 + (1 - k)*30, 46, A.myCol, tt, -1, 2, .9); }
    drawBanner(ctx, 70, 270, 70, A.myCol, tt, -1, 0, 1); drawBanner(ctx, 150, 300, 70, A.myCol, tt, -1, 3, 1);
    // 정예 병종: 기병은 성 아래를 휩쓸고, 코끼리는 성문을 들이받고, 중보병은 방패 벽으로, 궁병은 엄호 사격
    { const k = ease(cl01((t - .1)/.4));
      if (cvM==='cav') for (let i = 0; i < 5; i++){ const x = 90 + i*40 + k*210 + Math.sin(tt*.6 + i)*10, y = 306 + (i%2)*20; blitFig(ctx, figSprite('cav', A.myCol, Math.sin(tt*3 + i) > 0 ? 'a' : 'b'), x, y, .72, false, 28, 38); }
      else if (cvM==='eleph') for (let i = 0; i < 2; i++){ const hit = t > .5 ? Math.abs(Math.sin((t - .5)*40))*8 : 0; drawElephant(ctx, lerp(110, gx - 62, k) - i*74 + hit, baseY + 30 + i*20, .82, false, A.myCol, tt + i); if (t > .5 && i===0 && hit > 6) puff(ctx, gx, baseY - 6, 18, .4, '160,140,110'); }
      else if (cvM==='heavy') for (let i = 0; i < 7; i++) blitFig(ctx, figSprite('shield', shade(A.myCol, .7), 'idle'), lerp(170, 500, k) + (i%2)*10, 258 + i*11, .66, false, 12, 37);
      else if (cvM==='ranged') for (let i = 0; i < 7; i++) blitFig(ctx, figSprite('bow', A.myCol, Math.sin(tt*5 + i) > 0 ? 'charge' : 'idle'), 330 + (i%2)*16, 256 + i*12, .64, false, 12, 37); }
    // 화살
    for (const a of arrows){ if (t < a.t0 || t > a.t0 + a.dur) continue; const k = (t - a.t0)/a.dur, p1 = pos(a.tg, a.t0 + a.dur), x = lerp(a.d.x - 6, p1[0], k), y = lerp(a.d.y - 22, p1[1] - 12, k) - Math.sin(k*Math.PI)*24;
      ctx.strokeStyle = 'rgba(30,20,10,.9)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 7, y - 3); ctx.stroke(); }
    for (const a of myArrows){ if (t < a.t0 || t > a.t0 + a.dur) continue; const k = (t - a.t0)/a.dur, x = lerp(a.fx, a.tx, k), y = lerp(a.fy, a.ty, k) - Math.sin(k*Math.PI)*60;
      ctx.strokeStyle = 'rgba(30,20,10,.9)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x - 7, y + 2); ctx.lineTo(x, y); ctx.stroke(); if (a.fire){ glow(ctx, x, y, 10, .7, '255,150,40'); } }
    if (plan==='fire' || A.myT==='fire'){ for (let i = 0; i < 5; i++){ const fx = 574 + i*13, on = t > .35 + i*.05; if (on){ paFx(ctx, 'fx_fire', fx, top - 12, 48, .9); flame(ctx, fx, top + 2, .9, tt + i, i*2); puff(ctx, fx + 4, top - 20 - ((tt*20 + i*9) % 40), 12, .25, '48,40,36'); } } }
    // 굶주림: 성 안에서 가는 연기 몇 줄기
    if (starving) for (let i = 0; i < 3; i++){ const ag = ((tt*.5 + i*.33) % 1); puff(ctx, 520 + i*40, top - 30 - ag*60, 6 + ag*14, .2*(1 - ag), '90,80,70'); }
    ctx.restore();
    ctx.drawImage(vg, 0, 0);
    if (t < .05){ ctx.fillStyle = `rgba(0,0,0,${1 - t/.05})`; ctx.fillRect(0, 0, VW, VH); }
    const pn = SIEGE_PLAN_TXT[plan];
    pxText('pxCap', `공성전 · <b style="color:${A.myCol}">${esc(A.myName)}</b>${pn ? ` <i>${pn}${A.ok===false ? ' 실패' : ''}</i>` : ''} 대 <b style="color:${A.foeCol}">${esc(A.foeName)}</b>`, 'pxcap' + (t > .03 && t < .92 ? ' on' : ''));
    let big = '', bc = '';
    if (plan==='inside' && A.ok && t > .42 && t < .58){ big = '성문이 안에서 열렸다!'; }
    else if (plan==='tunnel' && A.ok && t > .62 && t < .76){ big = '성벽 밑이 무너졌다!'; }
    else if (plan==='flood' && t > .3 && t < .45){ big = '강물이 성을 덮친다!'; }
    else if (t > .86){ big = `<span>아군 −${fmt(A.myLoss)}</span><span>적군 −${fmt(A.foeLoss)}</span>`; bc = 'score'; }
    pxText('pxBig', big, 'pxbig ' + bc + (big ? ' on' : ''));
    const cut = document.getElementById('pxCut'); if (cut) cut.style.opacity = 0;
  };
}

/* 우리가 성을 지킨다: 성벽 위에서 내려다보며 싸운다 */
function pxWallTop(ctx, A){
  const bg = inkBg(Object.assign({}, A, { castle:null })), vg = vignette(), R = seeded(hashStr('wt' + A.seed + A.plan));
  const meWin = (A.myLoss/(A.myBefore||1)) <= (A.foeLoss/(A.foeBefore||1)), plan = A.plan || '';
  const PY = 300; // 성가퀴 윗선
  const cvM = CORPS_V[A.myCorps], cvF = CORPS_V[A.foeCorps];
  const foes = []; for (let i = 0; i < 46; i++){ const x = 30 + R()*580; foes.push({ x0: x, x1: x + (320 - x)*.15, y0: 196 + R()*26, y1: PY - 4 + R()*6, t0: .04 + R()*.1, t1: .38 + R()*.16, ph: R()*6, cav: i%(cvF==='cav' ? 3 : 9)===0, fallT: null }); }
  const nF = clamp(Math.round(A.foeLoss/(A.foeBefore||1)*2.4*foes.length), 4, foes.length - 6); foes.slice().sort(() => R() - .5).slice(0, nF).forEach(f => f.fallT = .2 + R()*.6);
  const mine = []; for (let i = 0; i < 9; i++){ const x = 34 + i*72 + (R()-.5)*14; mine.push({ x, ph: R()*6, bow: i%3!==1, fallT: !meWin && R() < .35 ? .66 + R()*.2 : null }); }
  const ladders = [120, 268, 410, 548].map((x, i) => ({ x: x + (R()-.5)*20, t0: .44 + i*.04, push: meWin ? .6 + R()*.12 : null }));
  const shots = []; for (let i = 0; i < 40; i++){ const s = mine[(R()*mine.length)|0]; if (!s.bow) continue; shots.push({ s, f: foes[(R()*foes.length)|0], t0: .08 + R()*.7, dur: .05 + R()*.03 }); }
  const incoming = []; for (let i = 0; i < 10; i++) incoming.push({ x: 40 + R()*560, t0: .2 + R()*.5, fire: A.foeT==='fire' });
  const fpos = (f, t) => { const k = ease(cl01((t - f.t0)/(f.t1 - f.t0))); let y = lerp(f.y0, f.y1, k); if (meWin && t > .8){ y -= ease(cl01((t - .8)/.2))*50; } return [lerp(f.x0, f.x1, k), y, .36 + .45*cl01((y - 196)/(PY - 196)), k < 1]; };
  return (t, prev) => {
    const tt = t*5.4;
    const z = 1.03 + .03*ease(t);
    let sh = 0; if (incoming.some(a => t > a.t0 + .06 && t < a.t0 + .08)) sh = 2;
    ctx.save(); ctx.translate(VW/2 + Math.sin(t*800)*sh, VH/2); ctx.scale(z, z); ctx.translate(-VW/2, -VH/2);
    ctx.drawImage(bg, 0, 0);
    // 적군 깃발 (멀리)
    for (let i = 0; i < 4; i++) drawBanner(ctx, 90 + i*150, 212 + (i%2)*6, 34, A.foeCol, tt, 1, i, .55);
    // 적군
    const list = foes.map(f => [fpos(f, t), f]).sort((a, b) => a[0][1] - b[0][1]);
    for (const [[x, y, s, mv], f] of list){
      if (f.fallT != null && t > f.fallT){ const k = cl01((t - f.fallT)/.06); if (k >= 1 && t > f.fallT + .25) continue; ctx.save(); ctx.translate(x, y); ctx.rotate(1.3*k); ctx.translate(-x, -y); blitFig(ctx, figSprite(f.cav ? 'cav' : 'spear', A.foeCol, 'idle'), x, y, s, true, f.cav ? 28 : 12, f.cav ? 38 : 37, 1 - cl01((t - f.fallT - .08)/.15)); ctx.restore(); continue; }
      const pose = f.cav ? (mv ? (Math.sin(tt*16 + f.ph) > 0 ? 'a' : 'b') : 'idle') : (mv ? (Math.sin(tt*14 + f.ph) > 0 ? 'charge' : 'idle') : 'charge');
      blitFig(ctx, figSprite(f.cav ? 'cav' : cvF==='heavy' ? 'shield' : cvF==='ranged' && f.ph > 3 ? 'bow' : 'spear', cvF==='heavy' && !f.cav ? shade(A.foeCol, .7) : A.foeCol, pose), x, y, s, x > 320, f.cav ? 28 : 12, f.cav ? 38 : 37);
    }
    if (cvF==='eleph') for (let i = 0; i < 3; i++){ const k = ease(cl01((t - .08 - i*.04)/.42)), back = meWin && t > .8 ? ease(cl01((t - .8)/.2))*40 : 0, y = lerp(206, PY - 8, k) - back; drawElephant(ctx, 150 + i*170, y, .34 + .5*cl01((y - 196)/(PY - 196)), i===2, A.foeCol, tt + i); }
    // 우리 화살 (멀어질수록 작게)
    for (const a of shots){ if (t < a.t0 || t > a.t0 + a.dur) continue; const k = (t - a.t0)/a.dur, [fx, fy] = fpos(a.f, a.t0 + a.dur), x = lerp(a.s.x + 10, fx, k), y = lerp(PY - 40, fy - 10, k) - Math.sin(k*Math.PI)*40, L = 14*(1 - k) + 4;
      ctx.strokeStyle = 'rgba(30,20,10,.9)'; ctx.lineWidth = 2*(1 - k) + .8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (a.s.x < fx ? -1 : 1)*L*.4, y + L*.6); ctx.stroke(); if (plan==='rain') glow(ctx, x, y, 6, .3, '255,230,170'); }
    // 우리 병사 (성가퀴 뒤, 아랫몸은 가려진다)
    for (const m of mine){
      if (m.fallT != null && t > m.fallT){ const k = cl01((t - m.fallT)/.1); ctx.save(); ctx.translate(m.x, PY + 40); ctx.rotate(-1.2*k); ctx.translate(-m.x, -(PY + 40)); blitFig(ctx, figSprite('spear', A.myCol, 'idle'), m.x, PY + 40 + k*20, 1.35, false, 12, 37, 1 - k); ctx.restore(); continue; }
      const shoot = m.bow && Math.sin(tt*5 + m.ph) > -.2;
      blitFig(ctx, figSprite(m.bow || cvM==='ranged' ? 'bow' : cvM==='heavy' ? 'shield' : 'spear', cvM==='heavy' && !m.bow ? shade(A.myCol, .7) : A.myCol, shoot || (!m.bow && Math.sin(tt*7 + m.ph) > .4) ? 'charge' : 'idle'), m.x, PY + 42, 1.35, m.x > 320 && !m.bow ? true : false, 12, 37);
    }
    // 성가퀴 (앞쪽 돌 난간)
    const stone = '#b9a988', dk = '#7d6f56';
    ctx.fillStyle = stone; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.rect(-10, PY + 16, VW + 20, VH - PY); ctx.fill(); ctx.stroke();
    for (let x = -6; x < VW; x += 70){ ctx.beginPath(); ctx.rect(x, PY - 6, 44, 24); ctx.fill(); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(30,20,12,.3)'; ctx.lineWidth = 1; for (let y = PY + 28; y < VH; y += 12){ ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VW, y); ctx.stroke(); }
    ctx.fillStyle = dk; ctx.fillRect(-10, PY + 16, VW + 20, 4);
    // 사다리 끝이 난간 위로 올라온다
    for (const L of ladders){
      if (t < L.t0) continue;
      const up = ease(cl01((t - L.t0)/.05)), pushed = L.push != null && t > L.push ? ease(cl01((t - L.push)/.1)) : 0;
      if (pushed >= 1) continue;
      ctx.save(); ctx.translate(L.x, PY + 30); ctx.rotate(pushed*.9); ctx.globalAlpha = 1 - pushed*.6;
      ctx.strokeStyle = '#5a3a1c'; ctx.lineWidth = 3; const lh = 46*up; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-6, -lh); ctx.moveTo(6, 0); ctx.lineTo(6, -lh); for (let r = 8; r < lh; r += 9){ ctx.moveTo(-6, -r); ctx.lineTo(6, -r); } ctx.stroke();
      if (t > L.t0 + .08 && pushed < .3){ const c = ease(cl01((t - L.t0 - .08)/.08)); blitFig(ctx, figSprite('spear', A.foeCol, 'charge'), 0, -lh + 40 - c*26, 1.0, true, 12, 37); }
      ctx.restore();
      if (pushed > 0 && pushed < .5) puff(ctx, L.x + 10, PY + 10, 14, .4, '150,130,100');
    }
    // 끓는 기름·바위
    if (plan==='oil' && t > .48 && t < .7){ const k = (t - .48)/.22; for (let i = 0; i < 5; i++){ const x = 80 + i*120; paFx(ctx, 'fx_fire', x, PY + 6, 70*(1 - k*.4), .9*(1 - k*.3)); flame(ctx, x, PY + 18, 1.2*(1 - k*.5), tt + i, i); puff(ctx, x, PY - 10 - k*40, 14 + k*30, .35*(1 - k), '60,50,45'); } }
    // 적 화살이 날아와 난간에 박힌다
    for (const a of incoming){ if (t < a.t0 || t > a.t0 + .08) continue; const k = (t - a.t0)/.08, y = lerp(200, PY + 4, k), L = 4 + 18*k; ctx.strokeStyle = 'rgba(30,20,10,.95)'; ctx.lineWidth = 1 + 2*k; ctx.beginPath(); ctx.moveTo(a.x, y); ctx.lineTo(a.x - L*.3, y - L); ctx.stroke(); if (a.fire) glow(ctx, a.x, y, 10 + 10*k, .7, '255,150,40'); if (k > .85) sparkBurst(ctx, a.x, PY + 4, (k - .85)/.15, seeded(hashStr('i' + a.x)), 5); }
    // 깃발 (성벽 위)
    const lost = !meWin && t > .82;
    drawBanner(ctx, 22, PY + 18, 84, lost ? A.foeCol : A.myCol, tt, -1, 0, 1.1); drawBanner(ctx, VW - 22, PY + 18, 84, lost ? A.foeCol : A.myCol, tt, 1, 2, 1.1);
    ctx.restore();
    ctx.drawImage(vg, 0, 0);
    if (t < .05){ ctx.fillStyle = `rgba(0,0,0,${1 - t/.05})`; ctx.fillRect(0, 0, VW, VH); }
    const pn = SIEGE_PLAN_TXT[plan];
    pxText('pxCap', `수성전 · 성벽 위 <b style="color:${A.myCol}">${esc(A.myName)}</b>${pn ? ` <i>${pn}</i>` : ''} 대 <b style="color:${A.foeCol}">${esc(A.foeName)}</b>`, 'pxcap' + (t > .03 && t < .92 ? ' on' : ''));
    let big = '', bc = '';
    if (t > .6 && t < .72 && meWin) big = '사다리를 밀어냈다!';
    else if (t > .7 && t < .82 && !meWin) big = '적이 성벽을 넘었다!';
    else if (t > .86){ big = `<span>아군 −${fmt(A.myLoss)}</span><span>적군 −${fmt(A.foeLoss)}</span>`; bc = 'score'; }
    pxText('pxBig', big, 'pxbig ' + bc + (big ? ' on' : ''));
    const cut = document.getElementById('pxCut'); if (cut) cut.style.opacity = 0;
  };
}
