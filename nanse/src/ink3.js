/* ---------- 전투 장면 ---------- */
function pxFight(ctx, A){
  const bg = inkBg(A), vg = vignette(), R = seeded(hashStr('f' + A.seed + A.myT + A.foeT));
  const DUR = 5.2;
  const meWin = (A.myLoss/(A.myBefore||1)) <= (A.foeLoss/(A.foeBefore||1));
  const tot = (A.myBefore + A.foeBefore) || 1;
  const laneY = (r, rows) => GY0 + 16 + r*(GY1-GY0-34)/Math.max(1, rows-1);
  const sides = [true, false].map(isMe => {
    const u = (isMe ? A.myU : A.foeU) || 'spear', tac = isMe ? A.myT : A.foeT, before = isMe ? A.myBefore : A.foeBefore, loss = isMe ? A.myLoss : A.foeLoss;
    let n = clamp(Math.round(40*Math.sqrt(2*before/tot)), 14, 60); const cav = u==='cav'; if (cav) n = Math.max(10, Math.round(n*.62));
    const rows = cav ? 5 : 7;
    return { isMe, u, tac, col: isMe ? A.myCol : A.foeCol, before, loss, n, cav, rows, cols: Math.ceil(n/rows), dir: isMe ? 1 : -1, x0: isMe ? 226 : 414, men: [], bf: isMe ? A.myBf : A.foeBf, win: isMe===meWin, nm: isMe ? A.myName : A.foeName };
  });
  for (const S of sides){
    for (let c=0;c<S.cols;c++) for (let r=0;r<S.rows;r++){
      if (S.men.length >= S.n) break;
      let type = S.cav ? 'cav' : (S.u==='bow' ? (c<2 ? 'spear' : 'bow') : (S.cols>3 && c>=S.cols-2 ? 'bow' : 'spear'));
      if (S.tac==='wall' && c<2 && type!=='cav') type = 'shield';
      const y = laneY(r, S.rows) + (R()-.5)*6 + (c%2 ? 3 : 0);
      S.men.push({ S, c, r, type, ph: R()*6.28, y, s: .85 + .6*(y-GY0)/(GY1-GY0), fallT:null });
    }
    const nF = S.loss > 0 ? clamp(Math.round(S.loss/(S.before||1)*1.6*S.men.length), 2, Math.round(S.men.length*.9)) : 0;
    S.men.map(m => [m.c + R()*2.4, m]).sort((a,b) => a[0]-b[0]).slice(0, nF).forEach(([, m], i) => { m.fallT = .50 + (i/Math.max(1, nF))*.32 + R()*.03; });
  }
  const extras = [];
  for (const S of sides) if (S.tac==='ambush'){
    for (let i=0;i<(S.cav ? 9 : 14);i++){
      const ty = laneY(i%7, 7) + (R()-.5)*8, fy = HZ + 26 + R()*26;
      extras.push({ S, fl:true, type: S.cav ? 'cav' : 'spear', ph:R()*6.28, fx: S.isMe ? 560 + R()*60 : 20 + R()*60, fy, tx: S.isMe ? 350 + R()*80 : 290 - R()*80, ty, t0:.20 + R()*.07, t1:.45 + R()*.05, c:2, s: Math.max(.6, .85 + .6*(ty-GY0)/(GY1-GY0)), fallT:null });
    }
  }
  const contactX = 320 + (meWin ? 9 : -9);
  const advAt = (S, t) => {
    const a0 = S.tac==='charge' ? 82*ease(cl01((t-.10)/.30)) : S.tac==='wall' ? 60*ease(cl01((t-.28)/.2)) : 78*ease(cl01((t-.24)/.22));
    const contact = S.isMe ? contactX - S.x0 : S.x0 - contactX;
    let a = a0 + (contact - a0)*ease(cl01((t-.40)/.09));
    if (t > .86){ const k = ease(cl01((t-.86)/.14)); a += S.win ? 14*k : -30*k; }
    if (t > .5 && t < .86) a += Math.sin(t*60 + (S.isMe ? 0 : 2))*2.2;
    return a;
  };
  const dxOf = m => (m.S.cav ? 28 : 15)*m.s*(m.S.tac==='wall' ? .78 : 1);
  const posOf = (m, t) => {
    if (m.fl){ const k = ease(cl01((t-m.t0)/(m.t1-m.t0))); return [lerp(m.fx, m.tx, k) + (k>=1 ? Math.sin(t*50 + m.ph)*2 : 0), lerp(m.fy, m.ty, k)]; }
    const S = m.S; return [S.x0 + S.dir*(advAt(S, t) - m.c*dxOf(m)) + (m.c<3 && t>.5 && t<.86 ? Math.sin(t*70 + m.ph)*1.6 : 0), m.y];
  };
  const arrows = [], zones = [];
  for (const S of sides) if (S.tac==='fire'){
    const O = sides.find(z => z!==S), shooters = S.men.filter(m => m.type==='bow'), pool = shooters.length ? shooters : S.men;
    [.15, .205, .26, .315].forEach(t0 => { for (let i=0;i<9;i++) arrows.push({ S, sh: pool[(R()*pool.length)|0], tg: O.men[(R()*Math.min(O.men.length, 30))|0], t0: t0 + R()*.02, dur:.07 + R()*.02 }); });
    const burn = S.bf ? S : O, cand = burn.men.filter(m => m.c < 6);
    for (let i=0;i<Math.min(12, cand.length);i++) zones.push({ fig: cand[(R()*cand.length)|0], tl: S.bf ? .44 + i*.02 : .20 + i*.022 + R()*.02, sz: .8 + R()*.5 });
  }
  const gens = sides.map(S => { const h = hashStr(S.nm || 'x'); return { S, gen:true, y: laneY(3, 7) + 4, s: .9, weapon: ['spear','blade','spear','sword'][h%4], horse: ['#6a4326','#d9d3c4','#2c2420','#8a5a32'][(h>>3)%4], ph: (h%100)/16 }; });
  const banners = []; for (const S of sides) [[2, 1], [Math.max(3, Math.floor(S.cols/2)), 5], [Math.max(4, S.cols-2), 2]].forEach(([c, r], i) => banners.push({ S, ban:true, c, r, y: laneY(r, 7) + 3, s: .85 + .6*(laneY(r, 7)-GY0)/(GY1-GY0), ph: i*1.7 }));
  const sparks = []; for (let i=0;i<44;i++) sparks.push({ ts: .47 + i/44*.37 + R()*.01, x: 320 + (R()-.5)*72, y: GY0 + 18 + R()*104, sd: 1 + (R()*9999|0) });
  const everyone = [...sides[0].men, ...sides[1].men, ...extras, ...gens, ...banners];

  return (t, prev) => {
    const tt = t*DUR;
    ctx.save();
    const z = 1.035 + .045*ease(cl01(t/.95));
    let sh = 0, shy = 0;
    if (t > .46 && t < .56){ const k = 1 - (t-.46)/.10; sh = Math.sin(t*900)*6*k; shy = Math.cos(t*770)*3*k; } else if (t >= .56 && t < .86){ sh = Math.sin(t*500)*1.1; shy = Math.cos(t*430)*.8; }
    ctx.translate(VW/2 + sh, VH/2 + shy); ctx.scale(z, z); ctx.translate(-VW/2, -VH/2);
    ctx.drawImage(bg, 0, 0);
    if (A.terr==='river'){ ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1.2; for (let i=0;i<22;i++){ const wx = (i*67 + tt*16*(1 + i%3))%(VW+30) - 15, wy = HZ + 20 + (i*7)%28, wl = 10 + (i%4)*5; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + wl, wy); ctx.stroke(); } }
    const list = everyone.filter(m => !(m.fl && t < m.t0)).map(m => [m.gen ? m.y + 14 : m.y, m]).sort((a,b) => a[0]-b[0]);
    const melee = t > .46 && t < .86;
    for (const [, m] of list){
      const S = m.S;
      if (m.ban){
        const x = S.x0 + S.dir*(advAt(S, t) - m.c*15*m.s), a = m.fallT;
        drawBanner(ctx, x, m.y, 56*m.s, S.col, tt, -S.dir, m.ph, m.s*.95); continue;
      }
      if (m.gen){
        const x = S.x0 + S.dir*(advAt(S, t) + 8), mv = Math.abs(advAt(S, t+.012) - advAt(S, t)) > .03;
        const sw = melee ? Math.sin(tt*10 + m.ph) : 0;
        drawHorseman(ctx, x, m.y + 16, .5*m.s*1.15, !S.isMe, S.col, { t: tt + m.ph, g: tt*2.4, run: mv, wa: melee ? -.7 + sw*.8 : -1.0, lean: melee ? .12 : 0, weapon: m.weapon, horse: m.horse });
        continue;
      }
      const [x, y] = posOf(m, t), flip = !S.isMe, s = m.s;
      const ft = m.type==='cav', mv = Math.abs(posOf(m, t + .012)[0] - x) > .25;
      let pose = 'idle';
      if (ft) pose = mv ? (Math.sin(tt*16 + m.ph) > 0 ? 'a' : 'b') : 'idle';
      else if (m.type==='bow') pose = (S.tac==='fire' && t > .14 && t < .36) ? 'charge' : 'idle';
      else if (m.type==='shield') pose = 'wall';
      else if (melee && m.c < 4) pose = Math.sin(tt*9 + m.ph) > 0 ? 'charge' : 'idle';
      else if (mv && (S.tac==='charge' || t > .4)) pose = 'charge';
      const spr = figSprite(m.type, S.col, ft && pose==='idle' ? 'idle' : pose), ax = ft ? 28 : 12, ay = ft ? 38 : 37;
      const bob = mv ? Math.abs(Math.sin(tt*14 + m.ph))*1.6*s : 0;
      if (m.fallT != null && t > m.fallT){
        const k = cl01((t - m.fallT)/.05), al = 1 - cl01((t - m.fallT - .06)/.25)*.8;
        ctx.save(); ctx.translate(x, y); ctx.rotate((S.isMe ? -1 : 1)*1.45*ease(k)); ctx.translate(-x, -y);
        blitFig(ctx, spr, x, y, s, flip, ax, ay, al); ctx.restore();
        if (k < 1) puff(ctx, x, y - 4, 16*s, .4*(1-k), '150,130,100');
      } else blitFig(ctx, spr, x, y - bob, s, flip, ax, ay);
    }
    // 화살
    for (const a of arrows){
      if (t < a.t0 || t > a.t0 + a.dur) continue;
      const k = (t - a.t0)/a.dur, p0 = posOf(a.sh, a.t0), p1 = posOf(a.tg, a.t0 + a.dur), hg = 70;
      const at = q => [lerp(p0[0], p1[0], q), lerp(p0[1] - 16, p1[1] - 10, q) - Math.sin(q*Math.PI)*hg];
      const [x, y] = at(k), [x2, y2] = at(Math.max(0, k - .14));
      ctx.strokeStyle = 'rgba(40,24,12,.85)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x, y); ctx.stroke();
      glow(ctx, x, y, 14, .7, '255,150,40'); ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, TWO_PI); ctx.fill();
    }
    // 불길과 연기
    zones.forEach((zn, zi) => {
      if (t < zn.tl) return;
      const [fx, fy] = posOf(zn.fig, t), grow = cl01((t - zn.tl)/.05);
      glow(ctx, fx, fy - 12, 40*zn.sz, .42*grow, '255,130,40');
      for (let j=0;j<3;j++) flame(ctx, fx + (j-1)*5, fy + 1 - (j%2), zn.sz*grow*(.8 + j*.15), tt + zi, zi*1.7 + j*2.3);
      for (let j=0;j<3;j++){ const age = ((tt*.9 + zi*.37 + j*.8) % 2.4)/2.4; puff(ctx, fx + Math.sin(age*5 + zi)*7 + age*14, fy - 22 - age*70, 9 + age*30, .34*(1-age)*grow, '48,40,36'); }
    });
    // 돌격 먼지
    for (const S of sides) if (S.tac==='charge'){
      const fronts = S.men.filter(m => m.c===0 && m.r%2===0);
      const j0 = Math.max(0, Math.floor((t - .12 - .17)/.03)), j1 = Math.min(13, Math.floor((t - .12)/.03));
      for (let j=j0;j<=j1;j++){ const tj = .12 + j*.03, age = t - tj; if (age < 0 || age > .17) continue;
        for (const m of fronts){ const p = posOf(m, tj); puff(ctx, p[0] - S.dir*8, p[1] - 4 - age*40, 10 + age*120, .3*(1 - age/.17), '176,154,120'); } }
    }
    if (t > .42 && t < .9){ const k = cl01((t - .42)/.45); for (let i=0;i<6;i++) puff(ctx, 320 + (i-2.5)*22, GY0 + 40 + (i%3)*34 - k*14, 30 + k*46, .22*(1 - k*.6), '170,150,120'); }
    // 방진 충격파
    for (const S of sides) if (S.tac==='wall' && t > .47 && t < .56){ const k = (t - .47)/.09; ctx.strokeStyle = `rgba(255,236,170,${.7*(1-k)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(S.isMe ? contactX - 6 : contactX + 6, GY0 + 70, 10 + k*60, 22 + k*80, 0, 0, TWO_PI); ctx.stroke(); }
    // 기습 등장 연기
    for (const m of extras){ const age = t - m.t0; if (age >= 0 && age < .08) puff(ctx, m.fx, m.fy, 16 + age*260, .45*(1 - age/.08), '120,150,100'); }
    // 백병전 불꽃
    for (const sp of sparks){ const age = t - sp.ts; if (age < 0 || age > .035) continue; sparkBurst(ctx, sp.x, sp.y, age/.035, seeded(sp.sd), 6); }
    ctx.restore();
    // 컷인 번쩍
    const cutOn = t > .36 && t < .5 && (BEATS[A.myT]===A.foeT && !A.myBf || BEATS[A.foeT]===A.myT && !A.foeBf);
    ctx.drawImage(vg, 0, 0);
    if (t > .355 && t < .375 && cutOn){ ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, VW, VH); }
    if (t > .465 && t < .49){ ctx.fillStyle = `rgba(255,248,220,${.5*(1 - (t-.465)/.025)})`; ctx.fillRect(0, 0, VW, VH); }
    if (t < .06){ ctx.fillStyle = `rgba(0,0,0,${1 - t/.06})`; ctx.fillRect(0, 0, VW, VH); }
    const cut = document.getElementById('pxCut'); if (cut) cut.style.opacity = cutOn ? Math.min(1, (t-.36)*30, (.5-t)*30) : 0;
    pxText('pxCap', `<b style="color:${A.myCol}">${esc(A.myName)}</b> ${TAC[A.myT][0]} <i>대</i> ${TAC[A.foeT][0]} <b style="color:${A.foeCol}">${esc(A.foeName)}</b>`, 'pxcap' + (t > .03 && t < .9 ? ' on' : ''));
    let big = '', bc = '';
    if ((A.myBf || A.foeBf) && t > .55 && t < .75){ big = A.myBf ? '역풍! 불길이 아군 쪽으로' : '역풍! 불길이 적진으로 번진다'; bc = A.myBf ? 'bad' : ''; }
    else if (t > .86){ big = `<span>아군 −${fmt(A.myLoss)}</span><span>적군 −${fmt(A.foeLoss)}</span>`; bc = 'score'; }
    pxText('pxBig', big, 'pxbig ' + bc + (big ? ' on' : ''));
  };
}

/* ---------- 일기토 장면 ---------- */
function pxDuel(ctx, A){
  const bg = inkBg(Object.assign({}, A, { castle:null })), vg = vignette(), R = seeded(hashStr('d' + A.seed));
  let rounds = A.rounds && A.rounds.length ? A.rounds : (A.win ? [{ k:'w', mh:100, fh:55 }, { k:'d', mh:90, fh:45 }, { k:'w', mh:90, fh:0 }] : [{ k:'l', mh:60, fh:100 }, { k:'d', mh:50, fh:90 }, { k:'l', mh:0, fh:90 }]);
  const N = rounds.length, T0 = .17, slot = (.80 - T0)/N, FY = 300, SC = 1.5;
  const wOf = nm => ['spear','blade','spear','sword'][hashStr(nm||'x')%4], hOf = nm => ['#6a4326','#d9d3c4','#2c2420','#8a5a32'][(hashStr(nm||'x')>>3)%4];
  const wMe = wOf(A.myName), wFoe = wOf(A.foeName), hMe = hOf(A.myName), hFoe = hOf(A.foeName);
  const loserMe = !A.win && !A.draw, winnerMe = !!A.win;
  const crowd = []; for (let i=0;i<9;i++){ const isMe = i < 5, y = GY0 + 60 + (i%3)*26 + R()*6; crowd.push({ isMe, x: isMe ? 30 + (i%3)*34 + R()*10 : VW - 30 - ((i-5)%3)*34 - R()*10, y, s: .62 + .45*(y-GY0)/(GY1-GY0), ph: R()*6 }); }
  const OFF0 = 168, OFFC = 64;
  const offOf = u => u < .34 ? lerp(OFF0, OFFC, ease(u/.34)) : u < .42 ? OFFC : lerp(OFFC, OFF0, ease((u-.42)/.58));
  return (t, prev) => {
    const tt = t*5.4;
    let i = -1, u = 0;
    if (t >= T0){ i = Math.min(N-1, Math.floor((t - T0)/slot)); u = cl01((t - T0 - i*slot)/slot); if (t >= .80){ i = N-1; u = 1; } }
    const rd = i >= 0 ? rounds[i] : null;
    const imp = i >= 0 && u > .36 && t < .80 ? Math.exp(-(u - .36)*6.5) : (t >= .80 ? 0 : 0);
    const clash = i >= 0 && u >= .335 && u < .46 && t < .80;
    let off = t < T0 ? OFF0 : t >= .80 ? OFF0 : offOf(u);
    if (t < T0) off = OFF0 - 18*ease(t/T0);
    // 카메라
    const z = 1.03 + (clash ? .05 : 0) + .04*imp + .03*ease(cl01(t/.9));
    let sh = 0, shy = 0; if (i >= 0 && u > .34 && u < .52){ const k = Math.exp(-(u - .34)*9); sh = Math.sin(t*1100)*7*k; shy = Math.cos(t*900)*4*k; }
    ctx.save(); ctx.translate(VW/2 + sh, 230 + shy); ctx.scale(z, z); ctx.translate(-VW/2, -230);
    ctx.drawImage(bg, 0, 0);
    // 관중 + 깃발
    const finished = t >= .84;
    for (const c of crowd){ const cheer = finished && (c.isMe === winnerMe) && !A.draw, bob = cheer ? Math.abs(Math.sin(tt*10 + c.ph))*5*c.s : 0; blitFig(ctx, figSprite('spear', c.isMe ? A.myCol : A.foeCol, 'idle'), c.x, c.y - bob, c.s, !c.isMe, 12, 37); }
    drawBanner(ctx, 92, 262, 96, A.myCol, tt, -1, 0, 1.15); drawBanner(ctx, VW - 92, 262, 96, A.foeCol, tt, 1, 2, 1.15);
    // 장수
    const dirs = [true, false];
    let tips = [];
    for (const isMe of dirs){
      const mineRes = rd ? (rd.k==='d' ? 0 : (rd.k==='w') === isMe ? 1 : -1) : 0;
      const dir = isMe ? -1 : 1;
      let x = 320 + dir*(off + (mineRes < 0 ? 30*imp : 0));
      let wa = lerp(-1.05, .55, ease(cl01((u - .27)/.1)));
      if (u > .40) wa = lerp(.55, -.55, ease(cl01((u - .40)/.3)));
      if (i < 0 || t < T0) wa = -1.05 + Math.sin(tt*3 + (isMe?0:2))*.08;
      if (t >= .80) wa = (isMe === winnerMe && !A.draw) ? -1.35 : -.2;
      let lean = i < 0 ? 0 : (u < .34 ? .16*ease(u/.34) : mineRes > 0 ? .16 : mineRes < 0 ? -.32*imp : 0);
      let rear = mineRes < 0 ? imp*.9 : (t >= .80 && isMe === winnerMe && !A.draw ? .8*ease(cl01((t - .8)/.06)) : 0);
      const moving = t >= T0 && t < .80 && ((u < .36) || (u > .42));
      const g = tt*1.8 + (isMe ? 0 : .5);
      const col = isMe ? A.myCol : A.foeCol;
      if (t >= .80 && ((isMe && loserMe) || (!isMe && !A.win && false))){}
      const isLoser = (t >= .80 && !A.draw && (isMe ? loserMe : !loserMe));
      if (isLoser){
        const k = ease(cl01((t - .80)/.12)), bolt = ease(cl01((t - .83)/.17));
        drawHorseman(ctx, x + dir*(bolt*160), FY, SC, !isMe, col, { t: tt, g: tt*3, run: true, noRider:true, horse: isMe ? hMe : hFoe, rear: .2 });
        const rx = x + dir*(18 + k*30), ry = FY - 60 + k*58;
        ctx.save(); ctx.translate(rx, ry); ctx.rotate(dir*(-1)*-1.6*k*(isMe ? -1 : 1)); ctx.translate(-rx, -ry);
        blitFig(ctx, figSprite(isMe ? 'spear' : 'spear', col, 'idle'), rx, ry + 38*1.3, 1.5, !isMe, 12, 37); ctx.restore();
        continue;
      }
      const tip = drawHorseman(ctx, x, FY, SC, !isMe, col, { t: tt + (isMe?0:1), g, run: moving, wa, lean: lean*(isMe?1:1), rear, weapon: isMe ? wMe : wFoe, horse: isMe ? hMe : hFoe });
      tips.push(tip);
    }
    // 충돌 연출
    if (rd && u > .335 && u < .62 && t < .80){
      const k = cl01((u - .335)/.2), cx = 320, cy = 190;
      glow(ctx, cx, cy, 120*(1 - k*.5), .75*(1 - k), '255,230,170');
      if (rd.k==='w'){ slashArc(ctx, cx, cy + 6, 66, -2.5, .6, k, false); }
      else if (rd.k==='l'){ slashArc(ctx, cx, cy + 6, 66, -2.5, .6, k, true); }
      else { slashArc(ctx, cx, cy + 6, 62, -2.6, .3, k, false); slashArc(ctx, cx, cy + 6, 62, -2.6, .3, k, true); }
      sparkBurst(ctx, cx, cy + 12, k, seeded(hashStr('s' + i)), 16, '#fff0b8');
      if (rd.k!=='d'){ const lx = rd.k==='w' ? 320 + (off + 6) : 320 - (off + 6); inkSplat(ctx, lx, 214 + k*10, 26*(.5 + k), .65*(1 - k*.5), '110,22,16', seeded(hashStr('i' + i))); }
      if (u > .335 && u < .37){ ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(0, 0, VW, VH); }
    }
    ctx.restore();
    ctx.drawImage(vg, 0, 0);
    // 체력 막대
    const hpAt = side => { const prevR = i > 0 ? rounds[i-1] : null, base = prevR ? (side ? prevR.mh : prevR.fh) : 100; if (i < 0) return 100; const cur = side ? rd.mh : rd.fh; return t >= .80 ? (side ? rounds[N-1].mh : rounds[N-1].fh) : lerp(base, cur, cl01((u - .36)/.12)); };
    const bar = (x0, w, hp, col, rt) => { ctx.fillStyle = 'rgba(8,5,2,.7)'; ctx.fillRect(x0 - 2, 38, w + 4, 11); ctx.fillStyle = '#3a1410'; ctx.fillRect(x0, 40, w, 7); ctx.fillStyle = col; const ww = w*cl01(hp/100); ctx.fillRect(rt ? x0 + w - ww : x0, 40, ww, 7); ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(rt ? x0 + w - ww : x0, 40, ww, 2); };
    bar(18, 252, hpAt(true), '#d9b04a', false); bar(VW - 18 - 252, 252, hpAt(false), '#c2452f', true);
    if (t < .02){ ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH); }
    if (t > .80 && A.died){ ctx.fillStyle = `rgba(0,0,0,${.55*cl01((t - .86)/.1)})`; ctx.fillRect(0, 0, VW, VH); }
    const cut = document.getElementById('pxCut'); if (cut) cut.style.opacity = t > .02 && t < .19 ? Math.min(1, (t-.02)*30, (.19-t)*30) : 0;
    pxText('pxCap', `일기토 · <b style="color:${A.myCol}">${esc(A.myName)}</b> <i>대</i> <b style="color:${A.foeCol}">${esc(A.foeName)}</b>${i >= 0 && t < .80 ? ` · ${i+1}합` : ''}`, 'pxcap' + (t > .2 && t < .92 ? ' on' : ''));
    const big = t > .84 ? (A.died ? '그대가 쓰러졌다…' : A.draw ? '승부를 가리지 못했다' : A.win ? (A.cap ? `${esc(A.foeName)} 생포!` : '일기토 승리!') : (A.fled ? '말머리를 돌렸다' : '일격을 허용했다')) : '';
    pxText('pxBig', big, 'pxbig ' + (A.win ? 'win' : 'bad') + (big ? ' on' : ''));
  };
}
