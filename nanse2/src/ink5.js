/* 코끼리 (상병): 등에 병사를 태운 큰 몸집 */
function drawElephant(c, x, y, sc, flip, col, t){
  if (paEleph(c, x, y, sc, flip, col, t)) return;
  c.save(); c.translate(x, y); c.scale(flip ? -sc : sc, sc); const w = Math.sin(t*1.6), g = '#8d8478', gd = '#6e665c';
  c.lineJoin = c.lineCap = 'round'; c.strokeStyle = '#2a251f'; c.lineWidth = 1.6;
  c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(0, 2, 30, 6, 0, 0, TWO_PI); c.fill();
  c.fillStyle = gd; for (const [lx, ph] of [[-16, 0], [10, 1.6]]){ c.beginPath(); c.rect(lx + Math.sin(t*1.6 + ph)*3, -16, 9, 18); c.fill(); c.stroke(); }
  c.fillStyle = g; c.beginPath(); c.ellipse(-2, -26, 26, 17, 0, 0, TWO_PI); c.fill(); c.stroke();
  for (const [lx, ph] of [[-22, 1.6], [4, 0]]){ c.beginPath(); c.rect(lx + Math.sin(t*1.6 + ph)*3, -16, 10, 18); c.fill(); c.stroke(); }
  c.beginPath(); c.ellipse(24, -32, 13, 12, 0, 0, TWO_PI); c.fill(); c.stroke();
  c.fillStyle = gd; c.beginPath(); c.ellipse(17, -34, 7, 10, -.3, 0, TWO_PI); c.fill(); c.stroke();
  c.strokeStyle = g; c.lineWidth = 7; c.beginPath(); c.moveTo(34, -28); c.quadraticCurveTo(44, -14 + w*3, 38 + w*2, -2); c.stroke(); c.strokeStyle = '#2a251f'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(37.5, -28); c.quadraticCurveTo(47.5, -14 + w*3, 41.5 + w*2, -2); c.stroke();
  c.strokeStyle = '#f4ecd8'; c.lineWidth = 3; c.beginPath(); c.moveTo(30, -24); c.quadraticCurveTo(40, -20, 44, -27); c.stroke();
  c.fillStyle = '#1a140f'; c.beginPath(); c.arc(28, -35, 1.4, 0, TWO_PI); c.fill();
  c.strokeStyle = '#2a251f'; c.lineWidth = 1.4; c.fillStyle = col; c.beginPath(); c.rect(-18, -46, 30, 9); c.fill(); c.stroke(); c.fillStyle = '#b08050'; c.beginPath(); c.rect(-16, -56, 26, 11); c.fill(); c.stroke();
  c.fillStyle = '#dcb88e'; for (const hx of [-9, 3]){ c.beginPath(); c.arc(hx, -60, 3.6, 0, TWO_PI); c.fill(); c.stroke(); } c.beginPath(); c.moveTo(3, -60); c.lineTo(22, -72); c.stroke();
  c.restore();
}
/* ---------- 원정길 장면: 행군하는 군대와 길 위의 고비를 그림으로 ---------- */
let tkcv = null;
function runTrekCv(){
  const cv = document.getElementById('tkcv'), T = G && G.trek;
  if (!cv || !T){ if (tkcv){ cancelAnimationFrame(tkcv.raf); tkcv = null; } return; }
  if (tkcv && tkcv.cv===cv) return;
  if (tkcv) cancelAnimationFrame(tkcv.raf);
  const ctx = cv.getContext('2d'), W = cv.width, H = cv.height, L = trekLead(T.ids), rd = riderOf(L), col = facColor(G.pfac);
  const st = tkcv = { cv, raf:0, t0: performance.now() }, trekCorps = (() => { const F = T.front && frontsOf(G.pfac).find(f => f.id===T.front); return (F && frState(F.id).corps) || (corpsAvail(G.pfac)[0] || null); })();
  const R = seeded(hashStr('tk' + T.to + (T.road||'')));
  const trees = Array.from({ length: 14 }, () => ({ x: R()*900, s: .6 + R()*.7, k: R() })), hills = Array.from({ length: 6 }, () => ({ x: R()*900, w: 120 + R()*160, h: 40 + R()*70 }));
  const rocks = Array.from({ length: 6 }, () => ({ x: 200 + R()*400, d: R()*1.2, r: 5 + R()*7 }));
  const frame = now => {
    if (tkcv!==st || !document.body.contains(cv)) return;
    const t = (now - st.t0)/1000, road = T.road || 'main', ev = T.road && !T.done ? T.nodes[T.i] : null, halt = !T.road, sp = halt ? 0 : 46, sc = t*sp;
    if (!paTrek(ctx, road, sc, W, H)){ const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, road==='water' ? '#cfdfe6' : '#eadfc4'); sky.addColorStop(1, '#f4ecd8'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // 먼 산
    for (const h of hills){ const x = ((h.x - sc*.15) % 900 + 900) % 900 - 130, hh = h.h*(road==='hill' ? 1.6 : road==='water' ? .6 : 1); ctx.fillStyle = 'rgba(90,80,64,.22)'; ctx.beginPath(); ctx.moveTo(x, 120); ctx.lineTo(x + h.w/2, 120 - hh); ctx.lineTo(x + h.w, 120); ctx.fill(); }
    // 땅 또는 물
    if (road==='water'){ ctx.fillStyle = '#8fb6c8'; ctx.fillRect(0, 118, W, H); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.4; for (let i = 0; i < 22; i++){ const x = ((i*61 - sc*(.5 + (i%3)*.2)) % (W + 40) + W + 40) % (W + 40) - 20, y = 128 + (i*37 % 66); ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 7, y - 3, x + 14, y); ctx.stroke(); } }
    else { ctx.fillStyle = road==='hill' ? '#cdbf9c' : '#dccfa8'; ctx.fillRect(0, 118, W, H); ctx.fillStyle = road==='hill' ? '#b9a67c' : '#c9b888'; ctx.beginPath(); ctx.moveTo(0, 150); ctx.lineTo(W, 142); ctx.lineTo(W, 176); ctx.lineTo(0, 186); ctx.fill();
      for (const tr of trees){ const x = ((tr.x - sc*(.6 + tr.k*.3)) % 900 + 900) % 900 - 60, y = tr.k < .5 ? 132 : 196, s = tr.s*(tr.k < .5 ? .7 : 1.1); ctx.fillStyle = '#5a4630'; ctx.fillRect(x - 1.5*s, y - 14*s, 3*s, 14*s); ctx.fillStyle = road==='hill' ? 'rgba(60,84,58,.85)' : 'rgba(86,112,62,.8)'; ctx.beginPath(); ctx.moveTo(x - 10*s, y - 10*s); ctx.lineTo(x, y - 34*s); ctx.lineTo(x + 10*s, y - 10*s); ctx.fill(); } } }
    // 목적지 성 (도착하면 지평선에)
    if (T.done && paUiDraw(ctx, 'map_capital', W - 76, 124, 110)){} else if (T.done){ const x = W - 110; ctx.fillStyle = '#b9a988'; ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.5; ctx.fillRect(x, 92, 70, 30); ctx.strokeRect(x, 92, 70, 30); for (let i = 0; i < 5; i++) ctx.fillRect(x + i*15, 86, 9, 7); drawBanner(ctx, x + 35, 90, 30, '#a3322a', t*5, 1, 1, .8); }
    // 고비의 그림
    const hazard = ev && ['ambushR','bandit','pirates','scout','toll','deserter','rival','spycatch'].includes(ev), camp = ev && ['supply','refugee','inn','hermit','fisher','shortcut','merchant','veteran','harvest','defect','omen'].includes(ev);
    if (hazard && road==='water' && paShip(ctx, W - 90, 176, '#5a5048', t*.25, true)){} else if (hazard) for (let i = 0; i < 5; i++){ const x = W - 150 + i*24, y = (road==='water' ? 150 : 160) + (i%2)*10; if (road==='water'){ ctx.fillStyle = '#4a3a28'; ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x + 14, y); ctx.lineTo(x + 9, y + 6); ctx.lineTo(x - 9, y + 6); ctx.fill(); } blitFig(ctx, figSprite(i%2 ? 'bow' : 'spear', '#5a5048', Math.sin(t*6 + i) > 0 ? 'charge' : 'idle'), x, y, .62, true, 12, 37); }
    if (camp && paUiDraw(ctx, 'map_camp', W - 120, 168, 96)){} else if (camp){ const x = W - 130; ctx.fillStyle = '#8a6a44'; ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x - 22, 150); ctx.lineTo(x, 128); ctx.lineTo(x + 22, 150); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e6d8b4'; ctx.fillRect(x - 16, 150, 32, 16); ctx.strokeRect(x - 16, 150, 32, 16); puff(ctx, x + 8, 120 - (t*14 % 26), 6 + (t*4 % 6), .3, '120,110,100'); blitFig(ctx, figSprite('spear', '#8a7a5a', 'idle'), x + 36, 170, .56, true, 12, 37); }
    if (ev==='ambushR' || ev==='cliff') for (const r of rocks){ const k = ((t + r.d) % 1.4)/1.4, y = 40 + k*130; ctx.fillStyle = '#6a5c48'; ctx.beginPath(); ctx.arc(r.x + k*30, y, r.r, 0, TWO_PI); ctx.fill(); if (k > .9) puff(ctx, r.x + 30, 172, 14, .35, '150,130,100'); }
    // 행군 대열
    const baseY = road==='water' ? 158 : 168, bob = halt ? 0 : Math.sin(t*9)*1.5;
    if (road==='water') for (let b = 0; b < 3; b++){ const x = 80 + b*120, y = baseY + Math.sin(t*2 + b)*2; if (paShip(ctx, x, y + 14, col, t*.25 + b*.37)) continue; ctx.fillStyle = '#5a4630'; ctx.strokeStyle = '#2a1f16'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 46, y); ctx.lineTo(x + 46, y); ctx.lineTo(x + 34, y + 12); ctx.lineTo(x - 34, y + 12); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 46); ctx.stroke(); ctx.fillStyle = '#efe4c8'; ctx.beginPath(); ctx.moveTo(x + 2, y - 44); ctx.quadraticCurveTo(x + 30, y - 30, x + 2, y - 10); ctx.fill(); ctx.stroke(); for (let i = 0; i < 4; i++) blitFig(ctx, figSprite('spear', col, 'idle'), x - 26 + i*16, y + 2, .5, false, 12, 37); }
    else { for (let i = 0; i < 9; i++){ const x = 60 + i*26, y = baseY + (i%2)*8 + (halt ? 0 : Math.abs(Math.sin(t*9 + i))*1.6); blitFig(ctx, figSprite(i%4===3 ? 'bow' : 'spear', col, !halt && Math.sin(t*9 + i) > 0 ? 'charge' : 'idle'), x, y, .6, false, 12, 37); }
      if (paReady() && paOk('t_roll')) paDraw(ctx, paAt('t_roll', halt ? 0 : (t*1.1) % 1), 22, baseY + 20, 92/PA_MAN.t_roll.w, false, col);
      const cv_ = CORPS_V[trekCorps]; if (cv_==='eleph') for (let i = 0; i < 2; i++) drawElephant(ctx, 190 + i*64, baseY + 22 + i*6, .7, false, col, t*4 + i); else if (cv_==='cav') for (let i = 0; i < 3; i++) blitFig(ctx, figSprite('cav', col, !halt && Math.sin(t*10 + i) > 0 ? 'a' : halt ? 'idle' : 'b'), 380 + i*44, baseY + 16 + (i%2)*8, .7, false, 28, 38);
      drawBanner(ctx, 120, baseY - 6, 56, col, t*5, -1, 0, .9); drawHorseman(ctx, 330, baseY + 14 + bob, .78, false, col, { t: t*5, g: t*2.2, run: !halt, wa: -1.0, weapon: rd ? rd.weapon : 'spear', horse: rd ? rd.horse : '#6a4326', look: rd });
      if (!halt) for (let k = 0; k < 3; k++){ const ag = (t*1.6 + k/3) % 1; puff(ctx, 296 - ag*30, baseY + 12 - ag*8, 5 + ag*12, .25*(1 - ag), '176,154,120'); } }
    // 날씨
    if (ev==='rain' || ev==='storm'){ ctx.strokeStyle = 'rgba(70,90,110,.55)'; ctx.lineWidth = 1; for (let i = 0; i < 70; i++){ const x = (i*53 + t*260) % (W + 60) - 30, y = (i*97 + t*520) % H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 5, y + 13); ctx.stroke(); } ctx.fillStyle = ev==='storm' ? 'rgba(30,40,60,.28)' : 'rgba(60,70,90,.12)'; ctx.fillRect(0, 0, W, H); if (ev==='storm' && Math.sin(t*3.1) > .97){ ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(0, 0, W, H); } }
    if (ev==='snow'){ ctx.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 90; i++){ const x = (i*71 + t*40 + Math.sin(t + i)*10) % W, y = (i*53 + t*70) % H; ctx.fillRect(x, y, 2, 2); } ctx.fillStyle = 'rgba(240,244,250,.3)'; ctx.fillRect(0, 0, W, H); }
    if (ev==='plague'){ ctx.fillStyle = 'rgba(255,190,90,.14)'; ctx.fillRect(0, 0, W, H); }
    if (ev==='tiger'){ const x = W - 150 + Math.sin(t*2)*10; ctx.fillStyle = '#c98a2a'; ctx.strokeStyle = '#2a1f16'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.ellipse(x, 164, 20, 9, 0, 0, TWO_PI); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(x - 20, 158, 7, 0, TWO_PI); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#2a1f16'; for (let i = -1; i < 3; i++){ ctx.beginPath(); ctx.moveTo(x + i*8, 156); ctx.lineTo(x + i*8 + 2, 170); ctx.stroke(); } }
    if (ev==='fog') for (let i = 0; i < 9; i++) puff(ctx, (i*97 + t*18) % (W + 120) - 60, 90 + (i*41 % 90), 60, .34, '250,250,246');
    if (ev==='current'){ ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++){ const x = W - ((t*80 + i*110) % (W + 40)); ctx.beginPath(); ctx.moveTo(x, 190 + i*4); ctx.lineTo(x + 26, 190 + i*4); ctx.stroke(); } }
    st.raf = requestAnimationFrame(frame);
  };
  st.raf = requestAnimationFrame(frame);
}

/* ---------- 난전: 장수가 되어 직접 싸움터를 달린다 ----------
   자동으로 베고, 움직임만 조작한다. 식량고를 태우고, 고지를 차지하고, 적장을 노린다. 결과가 본 싸움의 사기와 병력에 이어진다. */
let MEL = null;
const MEL_W = 1900, MEL_T = 80, MEL_Z = 1.45, MEL_VW = 640/MEL_Z;
function meleeHtml(B){
  const hero = person(B.melee.hero) || person(B[B.ps].gid) || me(), T = meleeTier(B), Sc = meleeScene(B);
  return `<div class="melee"><div class="mel-top"><span class="mel-time" id="melT">${T.T}</span><div class="mel-hp"><i id="melHp" style="width:100%"></i></div><span class="mel-k">격파 <b id="melK">0</b></span></div>
    <div class="mel-wrap"><canvas id="mcv" width="${VW}" height="${VH}" aria-label="난전"></canvas><div class="mel-obj" id="melObj"></div><button class="mel-skill" id="melSkill" disabled><b>무쌍</b><i id="melG"></i></button><div class="mel-msg" id="melMsg"></div></div>
    <p class="tiny muted" style="margin:0"><b>${Sc.n} · ${T.n}</b> · ${esc(hero.n)} · 화면을 누른 채 끌어서 달린다. 가까운 적은 저절로 벤다. 기세가 차면 무쌍.</p></div>`;
}
function runMelee(){
  const cv = document.getElementById('mcv'), B = G && G.battle;
  if (!cv || !B || !B.melee || !B.melee.on){ if (MEL){ cancelAnimationFrame(MEL.raf); MEL.off && MEL.off(); MEL = null; } return; }
  if (MEL && MEL.cv===cv) return;
  if (MEL){ cancelAnimationFrame(MEL.raf); MEL.off && MEL.off(); }
  const ctx = cv.getContext('2d'), mine = B[B.ps], foe = B.ps==='att' ? B.def : B.att, hp_ = person(B.melee.hero) || person(mine.gid) || me(), fp = foe.gid && person(foe.gid), TR = meleeTier(B), SC = meleeScene(B), cM = battleCorps(B, mine.fid), cF = battleCorps(B, foe.fid), vM = CORPS_V[cM], vF = CORPS_V[cF];
  const myCol = facColor(mine.fid), foCol = facColor(foe.fid), rd = riderOf(hp_), frd = fp ? riderOf(fp) : null;
  const adv = clamp(Math.sqrt((mine.troops*(mine.morale/100))/(foe.troops*(foe.morale/100) || 1)), .6, 1.6);
  const bg = inkBg({ terr: TERRAIN[B.to] || 'plain', castle:null, seed: hashStr('mel' + B.to), myCol, foeCol: foCol });
  const R = seeded(hashStr('m' + B.to + B.round + G.month));
  const Y0 = 196, Y1 = 338, ry = () => Y0 + R()*(Y1 - Y0);
  const M = MEL = { cv, raf:0, t:0, last: performance.now(), ents:[], kills:0, gauge:0, dir:[0, 0], face:1, atkT:0, swing:0, flash:0, msgT:0, done:false,
    hero:{ x:120, y:270, hp:TR.hp, max:TR.hp, atk: 1 + hp_.m/45, spd: (118 + (hp_.l - 50)*.4)*(SC.wx==='snow' ? .85 : 1) }, depot:{ x: SC.k==='def' ? 1500 : SC.k==='att' ? 1560 : 1280, y: SC.k==='field' ? 214 : 266, hp: SC.k==='att' ? 20 : SC.wx==='rain' && SC.k==='field' ? 18 : 14, max: SC.k==='att' ? 20 : SC.wx==='rain' && SC.k==='field' ? 18 : 14, dead:false, lost:false }, hills:[{ x:600, y:300, p:0, own:false }, { x:980, y:215, p:0, own:false }],
    boss:{ x:1680, y:262, hp: 12 + (fp ? fp.m : 60)/5, max: 12 + (fp ? fp.m : 60)/5, cd:0, dead:false, hurt:0 }, volley:{ next:11, x:0, y:0, warn:0 }, rein:0, rock:{ next:7, x:0, y:0, t:0 }, spA:0, spE:0, fx:[] };
  // 정예 병종이 섞여 나온다: 기병은 빠르고 두 번 견디고, 중보병은 세 번 견디고, 코끼리는 크고 느리지만 둘레를 짓밟는다
  const spawn = (side, x, y, type) => { const v = side ? vF : vM, r = R(), e = { side, x, y: y ?? ry(), type: type || (R() < .22 ? 'bow' : R() < .5 ? 'shield' : 'spear'), hp: 1 + (side===1 && R() < .25 ? 1 : 0), cd: R(), ph: R()*6, dead:0, sp:1, k:null };
    if (v==='eleph' && r < .1){ e.k = 'eleph'; e.hp = 7; e.sp = .7; } else if (v==='cav' && r < .38){ e.k = 'cav'; e.type = 'cav'; e.hp = 2; e.sp = 1.6; } else if (v==='heavy' && r < .4){ e.k = 'heavy'; e.type = 'shield'; e.hp = 3; e.sp = .85; } else if (v==='ranged' && r < .4){ e.k = 'ranged'; e.type = 'bow'; e.hp = 2; }
    M.ents.push(e); };
  for (let i = 0; i < 40; i++) spawn(0, 20 + R()*260); for (let i = 0; i < Math.round(TR.cap*.9); i++) spawn(1, 380 + R()*1450);
  const msg = (t, bad) => { const e = document.getElementById('melMsg'); if (e){ e.textContent = t; e.className = 'mel-msg on' + (bad ? ' bad' : ''); } M.msgT = 2.4; };
  const objHtml = () => { const e = document.getElementById('melObj'); if (e) e.innerHTML = `<span class="${M.depot.dead ? 'ok' : ''}">${SC.k==='field' ? '량' : SC.k==='att' ? '문' : '차'} ${SC.depot}</span><span class="${M.hills[0].own ? 'ok' : ''}">고 남쪽 ${SC.hill}</span><span class="${M.hills[1].own ? 'ok' : ''}">고 북쪽 ${SC.hill}</span><span class="${M.boss.dead ? 'ok' : ''}">장 ${esc(foe.name)}</span>`; };
  objHtml(); msg(SC.k==='att' ? '성문을 부수고, 망루를 빼앗고, 수비대장을 노려라!' : SC.k==='def' ? '충차를 부수고, 사다리 거점을 치고, 적장을 노려라!' : '식량고를 태우고, 고지를 차지하고, 적장을 노려라!');
  // 조작: 끌기(가상 조이스틱)와 키보드
  let org = null; const keys = {};
  const pd = e => { org = [e.clientX, e.clientY]; e.preventDefault(); }, pm = e => { if (!org) return; const dx = e.clientX - org[0], dy = e.clientY - org[1], l = Math.hypot(dx, dy); M.dir = l < 8 ? [0, 0] : [dx/l, dy/l]; }, pu = () => { org = null; M.dir = [0, 0]; };
  const kd = e => { keys[e.key] = 1; if (e.key===' ') skill(); }, ku = e => { keys[e.key] = 0; };
  cv.addEventListener('pointerdown', pd); window.addEventListener('pointermove', pm); window.addEventListener('pointerup', pu); window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  M.off = () => { window.removeEventListener('pointermove', pm); window.removeEventListener('pointerup', pu); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  const sk = document.getElementById('melSkill');
  function skill(){ if (M.gauge < 30 || M.done) return; M.gauge = 0; M.flash = 1; Snd.sfx('special'); vib(60); const H = M.hero; for (const e of M.ents) if (e.side===1 && !e.dead && Math.hypot(e.x - H.x, e.y - H.y) < 130){ e.hp -= 5; if (e.hp <= 0) kill(e); } if (!M.boss.dead && Math.hypot(M.boss.x - H.x, M.boss.y - H.y) < 130){ M.boss.hp -= 5; M.boss.hurt = .3; } }
  if (sk) sk.onclick = skill;
  function kill(e){ e.dead = .001; if (e.side===1){ M.kills++; M.gauge = Math.min(30, M.gauge + 1); } }
  function finish(){
    if (M.done) return; M.done = true; M.off();
    const res = { kills: M.kills, depot: M.depot.dead, hills: M.hills.filter(h => h.own).length, boss: M.boss.dead, dead: M.hero.hp <= 0 }, lines = [], chips = [];
    const kl = Math.min(.2, res.kills*.0007*TR.rew); foe.troops = Math.max(100, Math.round(foe.troops*(1 - kl))); lines.push(`${J(hp_.n,'이')} 난전에서 ${res.kills}명을 베었다 (적 병력 -${Math.round(kl*100)}%).`);
    const mo = v => Math.round(v*Math.min(1.6, TR.rew));
    if (res.depot){ foe.morale = clamp(foe.morale - mo(15), 0, 130); if (SC.k==='att'){ B.wallK = Math.min(B.wallK ?? 1, .5); lines.push(`성문을 부쉈다! 성벽이 절반만 힘을 쓴다. 적 사기 -${mo(15)}.`); } else if (SC.k==='def') lines.push(`적의 충차를 부쉈다! 적 사기 -${mo(15)}.`); else lines.push(`적의 식량고가 불탔다! 적 사기 -${mo(15)}.`); chips.push([`${SC.depot} 파괴`, true]); }
    else if (SC.k==='def'){ mine.morale = clamp(mine.morale - 8, 0, 130); lines.push('충차가 성문에 닿았다. 아군 사기 -8.'); }
    if (res.hills){ mine.morale = clamp(mine.morale + 6*res.hills, 0, 130); lines.push(`고지 ${res.hills}곳을 차지했다. 아군 사기 +${6*res.hills}.`); chips.push([`고지 ${res.hills}`, true]); }
    if (TR.k >= 2 && !res.dead){ mine.morale = clamp(mine.morale + 8, 0, 130); lines.push(`${TR.n}의 싸움에서 살아 돌아왔다. 아군 사기 +8.`); }
    if (res.boss){ foe.morale = clamp(foe.morale - mo(15), 0, 130); foe.st.l = Math.round(foe.st.l*.85); lines.push(`${foe.name}을(를) 말에서 떨어뜨렸다! 적의 지휘가 흔들린다.`); chips.push(['적장 격파', true]); if (fp) rivalNote(fp.id, 'win'); }
    if (res.dead){ mine.morale = clamp(mine.morale - 12, 0, 130); lines.push(`${J(hp_.n,'이')} 다쳐 물러났다. 아군 사기 -12.`); if (hp_.id===G.pid) G.hp = clamp(G.hp - 10); chips.push(['부상', false]); }
    B.melee = { done:true, res, lines, chips }; B.log = (B.log||[]).concat(lines);
    Snd.sfx(res.dead ? 'lose' : 'win'); setTimeout(() => { MEL = null; save(); render(); }, 900);
  }
  let hudT = 0;
  const frame = now => {
    if (MEL!==M || !document.body.contains(cv)) return;
    const dt = Math.min(.05, (now - M.last)/1000); M.last = now;
    if (!M.done){ M.t += dt; step(dt); }
    draw(); hudT += dt; if (hudT > .15){ hudT = 0; hud(); }
    M.raf = requestAnimationFrame(frame);
  };
  function step(dt){
    const H = M.hero; let dx = M.dir[0], dy = M.dir[1];
    if (keys.ArrowLeft || keys.a) dx = -1; if (keys.ArrowRight || keys.d) dx = 1; if (keys.ArrowUp || keys.w) dy = -1; if (keys.ArrowDown || keys.s) dy = 1;
    const crowd = M.ents.reduce((n, e) => n + (e.side===1 && !e.dead && Math.abs(e.x - H.x) < 44 && Math.abs(e.y - H.y) < 34 ? 1 : 0), 0), slow = crowd >= 5 ? .35 : crowd >= 2 ? .6 : 1;
    H.mv = !!(dx || dy); H.x = clamp(H.x + dx*H.spd*slow*dt, 20, MEL_W - 20); H.y = clamp(H.y + dy*H.spd*.7*slow*dt, Y0, Y1); if (dx) M.face = dx > 0 ? 1 : -1;
    // 병사 보충: 싸움터가 늘 가득 차 있게
    const nA = M.ents.filter(e => e.side===0 && !e.dead).length, nE = M.ents.filter(e => e.side===1 && !e.dead).length, capA = 44 + 16*M.hills.filter(h => h.own).length;
    M.spA -= dt; if (M.spA <= 0 && nA < capA){ M.spA = .35; spawn(0, Math.max(0, H.x - 420 - R()*60)); }
    M.spE -= dt; if (M.spE <= 0 && nE < TR.cap*(M.depot.dead && SC.k==='field' ? .72 : 1)){ M.spE = M.depot.dead ? .6 : .32; R() < .4 && !M.depot.dead ? spawn(1, M.depot.x + R()*60 - 30, M.depot.y + 20 + R()*60) : spawn(1, Math.min(MEL_W, H.x + 460 + R()*120)); }
    if (M.rein < TR.rein.length && M.t > TR.rein[M.rein]){ M.rein++; msg(M.rein > 1 ? '적의 원군이 또 나타났다!' : '적의 원군이 나타났다!', true); Snd.sfx('horn'); for (let i = 0; i < 20 + TR.k*4; i++) spawn(1, H.x + 160 + R()*220, M.rein%2 ? Y0 + R()*30 : Y1 - R()*30); }
    if (SC.k==='def' && !M.depot.dead && !M.depot.lost){ M.depot.x -= 16*dt; if (M.depot.x < 150){ M.depot.lost = true; msg('충차가 성문에 닿았다!', true); } }
    if (SC.wx==='rock'){ const K = M.rock; if (K.t > 0){ K.t -= dt; if (K.t <= 0){ if (Math.hypot(H.x - K.x, (H.y - K.y)*1.4) < 46){ H.hp -= 10; vib(40); } for (const e of M.ents) if (!e.dead && Math.hypot(e.x - K.x, (e.y - K.y)*1.4) < 46) e.dead = .001; M.fx.push({ x:K.x, y:K.y, t:0, k:'hit' }); Snd.sfx('shield'); } } else if (M.t > K.next){ K.next = M.t + 6 + R()*4; K.x = H.x + (R() - .3)*220; K.y = ry(); K.t = 1.3; } }
    // 병사들의 싸움 (격자로 가까운 적을 찾는다)
    const grid = {}; for (const e of M.ents) if (!e.dead){ const k = (e.x/40)|0; (grid[k] = grid[k] || []).push(e); }
    for (const e of M.ents){
      if (e.dead){ e.dead += dt; continue; }
      const k = (e.x/40)|0; let tg = null, bd = 30;
      for (let q = k - 1; q <= k + 1; q++) for (const o of grid[q] || []) if (o.side!==e.side && !o.dead){ const d = Math.abs(o.x - e.x) + Math.abs(o.y - e.y)*.8; if (d < bd){ bd = d; tg = o; } }
      const dH = Math.hypot(H.x - e.x, H.y - e.y);
      if (e.side===1 && dH < 34){ e.cd -= dt; if (e.cd <= 0){ e.cd = 1.35; H.hp -= TR.dmg*(e.k==='eleph' ? 2.2 : e.k==='cav' ? 1.3 : 1); M.fx.push({ x:H.x, y:H.y - 20, t:0, k:'hit' }); } e.fight = true; continue; }
      if (tg){ e.fight = true; e.cd -= dt; if (e.cd <= 0){ e.cd = .8 + R()*.5; if (R() < (e.side===0 ? .34*adv : .34/adv)*(e.k==='eleph' ? 2.4 : e.k ? 1.3 : 1)){ tg.hp--; if (tg.hp <= 0){ tg.dead = .001; } } } continue; }
      e.fight = false;
      if (e.side===0){ e.x += 44*e.sp*dt; if (e.x > MEL_W - 60) e.x = MEL_W - 60; }
      else { if (dH < 170){ e.x += (H.x - e.x)/dH*52*e.sp*dt; e.y += (H.y - e.y)/dH*36*e.sp*dt; } else e.x -= 30*e.sp*dt; if (e.x < 10) e.dead = .001; }
    }
    if (M.ents.length > 260) M.ents = M.ents.filter(e => !e.dead || e.dead < .8);
    // 장수의 칼: 가까운 적을 저절로 벤다
    M.atkT -= dt; M.swing = Math.max(0, M.swing - dt*3);
    if (M.atkT <= 0){ let hit = 0; for (const e of M.ents) if (hit < 3 && e.side===1 && !e.dead && Math.hypot(e.x - H.x, (e.y - H.y)*1.3) < 48 && (e.x - H.x)*M.face > -14){ e.hp -= H.atk; hit++; if (e.hp <= 0) kill(e); }
      const D = M.depot; if (!D.dead && Math.hypot(D.x - H.x, D.y - H.y) < 58){ D.hp -= 1; hit++; M.fx.push({ x:D.x, y:D.y - 20, t:0, k:'hit' }); if (D.hp <= 0){ D.dead = true; msg('식량고가 불탄다! 적이 술렁인다'); Snd.sfx('fire'); objHtml(); } }
      const Bo = M.boss; if (!Bo.dead && Math.hypot(Bo.x - H.x, Bo.y - H.y) < 52){ Bo.hp -= H.atk*.8; Bo.hurt = .25; hit++; if (Bo.hp <= 0){ Bo.dead = true; msg(`${foe.name}을(를) 꺾었다!`); objHtml(); setTimeout(finish, 1400); } }
      if (hit){ M.atkT = .5; M.swing = 1; M.fx.push({ x:H.x + M.face*26, y:H.y - 18, t:0, k:'slash', f:M.face }); if (R() < .5) Snd.sfx(hit > 2 ? 'slash' : 'clash'); } else M.atkT = .1; }
    // 적장
    const Bo = M.boss; Bo.hurt = Math.max(0, Bo.hurt - dt); if (!Bo.dead){ const d = Math.hypot(H.x - Bo.x, H.y - Bo.y); if (d < 280 && d > 36){ Bo.x += (H.x - Bo.x)/d*70*dt; Bo.y += (H.y - Bo.y)/d*50*dt; } Bo.cd -= dt; if (d < 46 && Bo.cd <= 0){ Bo.cd = 1.25; H.hp -= 7 + (fp ? fp.m : 60)/14; M.fx.push({ x:H.x, y:H.y - 20, t:0, k:'hit' }); Snd.sfx('hit'); vib(30); } }
    // 고지
    for (const h of M.hills) if (!h.own && Math.hypot(H.x - h.x, H.y - h.y) < 58){ const near = M.ents.filter(e => e.side===1 && !e.dead && Math.hypot(e.x - h.x, e.y - h.y) < 58).length; if (near < 3){ h.p += dt; if (h.p >= 3){ h.own = true; msg('고지를 차지했다! 아군이 몰려든다'); Snd.sfx('drum'); objHtml(); } } }
    // 화살비 (피할 수 있다)
    const V = M.volley; if (V.warn > 0){ V.warn -= dt; if (V.warn <= 0){ if (Math.hypot(H.x - V.x, (H.y - V.y)*1.4) < 62){ H.hp -= 13; vib(40); } for (const e of M.ents) if (!e.dead && Math.hypot(e.x - V.x, (e.y - V.y)*1.4) < 62 && R() < .5) e.dead = .001; M.fx.push({ x:V.x, y:V.y, t:0, k:'volley' }); Snd.sfx('arrow'); } }
    else if (M.t > V.next && SC.wx!=='rain' && !(SC.k==='att' && M.hills.every(h => h.own))){ V.next = M.t + (SC.k==='att' ? 8 : 12); V.x = H.x + M.dir[0]*40; V.y = H.y; V.warn = 1.5; }
    for (const f of M.fx) f.t += dt; M.fx = M.fx.filter(f => f.t < .5);
    M.flash = Math.max(0, M.flash - dt*2.5); if (M.msgT > 0){ M.msgT -= dt; if (M.msgT <= 0){ const e = document.getElementById('melMsg'); if (e) e.className = 'mel-msg'; } }
    if (H.hp <= 0 || M.t >= TR.T) finish();
  }
  function hud(){ const H = M.hero, g = id => document.getElementById(id); const a = g('melT'), b = g('melHp'), c = g('melK'), d = g('melG'); if (a) a.textContent = Math.max(0, Math.ceil(TR.T - M.t)); if (b) b.style.width = clamp(H.hp/H.max*100, 0, 100) + '%'; if (c) c.textContent = M.kills; if (d) d.style.height = (M.gauge/30*100) + '%'; if (sk) sk.disabled = M.gauge < 30; }
  function draw(){
    const H = M.hero, VW_ = MEL_VW, cam = clamp(H.x - VW_*.42, 0, MEL_W - VW_), tt = M.t*5.4;
    ctx.setTransform(MEL_Z, 0, 0, MEL_Z, 0, VH*(1 - MEL_Z));
    const bx = -((cam*.4) % VW); ctx.drawImage(bg, bx, 0); ctx.drawImage(bg, bx + VW, 0);
    // 고지와 식량고, 화살비 예고
    for (const h of M.hills){ const x = h.x - cam; if (x < -90 || x > VW_ + 90) continue; ctx.fillStyle = h.own ? 'rgba(60,120,70,.25)' : 'rgba(90,70,40,.2)'; ctx.beginPath(); ctx.ellipse(x, h.y, 58, 30, 0, 0, TWO_PI); ctx.fill(); ctx.strokeStyle = h.own ? '#2f7a4a' : '#7a5a2a'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.stroke(); ctx.setLineDash([]); if (!h.own && h.p > 0){ ctx.strokeStyle = '#f3c95a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(x, h.y, 58, 30, 0, -Math.PI/2, -Math.PI/2 + TWO_PI*h.p/3); ctx.stroke(); } drawBanner(ctx, x, h.y - 6, 54, h.own ? myCol : foCol, tt, 1, 2, 1); }
    if (SC.k==='att'){ const wx = M.depot.x + 40 - cam; if (wx < VW_ + 10){ ctx.fillStyle = '#b9a988'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(wx, 150, 400, 200); ctx.strokeRect(wx, 150, 400, 200); for (let y = 150; y < 350; y += 22){ ctx.fillRect(wx - 8, y, 10, 13); ctx.strokeRect(wx - 8, y, 10, 13); } } }
    if (SC.wx==='rock' && M.rock.t > 0){ const x = M.rock.x - cam; ctx.fillStyle = `rgba(90,70,40,${.2 + .2*Math.abs(Math.sin(M.t*12))})`; ctx.beginPath(); ctx.ellipse(x, M.rock.y, 46, 32, 0, 0, TWO_PI); ctx.fill(); const k = 1 - M.rock.t/1.3; ctx.fillStyle = '#6a5c48'; ctx.beginPath(); ctx.arc(x + 40 - k*40, M.rock.y - 200 + k*200, 12, 0, TWO_PI); ctx.fill(); ctx.stroke(); }
    const D = M.depot, dx = D.x - cam;
    if (SC.k!=='field' && dx > -80 && dx < VW_ + 80){ ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
      if (SC.k==='att'){ ctx.fillStyle = D.dead ? '#2a1a10' : '#6a4a2a'; ctx.fillRect(dx + 18, D.y - 46, 26, 66); ctx.strokeRect(dx + 18, D.y - 46, 26, 66); if (!D.dead){ ctx.beginPath(); ctx.moveTo(dx + 18, D.y - 13); ctx.lineTo(dx + 44, D.y - 13); ctx.stroke(); } else flame(ctx, dx + 30, D.y - 10, 1.4, tt, 1); }
      else if (!D.dead){ ctx.fillStyle = '#5a3a1c'; ctx.beginPath(); ctx.moveTo(dx - 30, D.y); ctx.lineTo(dx - 22, D.y - 28); ctx.lineTo(dx + 26, D.y - 28); ctx.lineTo(dx + 34, D.y); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(dx + 16, D.y - 10); ctx.lineTo(dx - 46, D.y - 10); ctx.stroke(); ctx.fillStyle = '#2a1a10'; for (const w of [-20, 0, 22]){ ctx.beginPath(); ctx.arc(dx + w, D.y + 2, 5, 0, TWO_PI); ctx.fill(); } }
      else { flame(ctx, dx, D.y - 12, 1.4, tt, 2); puff(ctx, dx, D.y - 44 - ((tt*14) % 40), 16, .3, '48,40,36'); }
      if (!D.dead){ ctx.fillStyle = '#3a1410'; ctx.fillRect(dx - 24, D.y - 58, 48, 5); ctx.fillStyle = '#d9b04a'; ctx.fillRect(dx - 24, D.y - 58, 48*D.hp/D.max, 5); } }
    if (SC.k==='field' && dx > -80 && dx < VW_ + 80){ ctx.fillStyle = D.dead ? '#3a2a1a' : '#b9945a'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; for (const [ox, oy] of [[-22, 0], [8, -6], [-6, 12]]){ ctx.beginPath(); ctx.rect(dx + ox, D.y + oy - 22, 26, 22); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(dx + ox - 3, D.y + oy - 22); ctx.lineTo(dx + ox + 13, D.y + oy - 34); ctx.lineTo(dx + ox + 29, D.y + oy - 22); ctx.closePath(); ctx.fillStyle = D.dead ? '#2a1a10' : '#8a6a3a'; ctx.fill(); ctx.stroke(); ctx.fillStyle = D.dead ? '#3a2a1a' : '#b9945a'; } if (D.dead){ for (let i = 0; i < 3; i++){ flame(ctx, dx - 14 + i*16, D.y - 20, 1.3, tt + i, i*2); puff(ctx, dx + i*8, D.y - 50 - ((tt*14 + i*13) % 50), 16, .3, '48,40,36'); } } else { ctx.fillStyle = '#3a1410'; ctx.fillRect(dx - 24, D.y - 48, 48, 5); ctx.fillStyle = '#d9b04a'; ctx.fillRect(dx - 24, D.y - 48, 48*D.hp/D.max, 5); } }
    const V = M.volley; if (V.warn > 0){ const x = V.x - cam; ctx.fillStyle = `rgba(163,50,42,${.18 + .2*Math.abs(Math.sin(M.t*12))})`; ctx.beginPath(); ctx.ellipse(x, V.y, 62, 44, 0, 0, TWO_PI); ctx.fill(); ctx.strokeStyle = '#a3322a'; ctx.lineWidth = 2; ctx.stroke(); }
    // 사람들 (아래쪽이 앞)
    const list = M.ents.filter(e => { const x = e.x - cam; return x > -30 && x < VW_ + 30 && (!e.dead || e.dead < .6); }); list.push({ hero:1, y:H.y }); if (!M.boss.dead) list.push({ boss:1, y:M.boss.y }); list.sort((a, b) => a.y - b.y);
    for (const e of list){
      if (e.hero){ const x = H.x - cam; ctx.fillStyle = 'rgba(243,201,90,.35)'; ctx.beginPath(); ctx.ellipse(x, H.y + 4, 26, 9, 0, 0, TWO_PI); ctx.fill();
        drawHorseman(ctx, x, H.y + 6, .64, M.face < 0, myCol, { t: tt, g: tt*.45, run: H.mv, pa: M.swing > 0 ? { c:'strike', p: 1 - M.swing } : null, wa: M.swing > 0 ? -1.6 + (1 - M.swing)*2.2 : -1.0, lean: H.mv ? .1 : 0, weapon: rd ? rd.weapon : 'spear', horse: rd ? rd.horse : '#6a4326', look: rd }); continue; }
      if (e.boss){ const Bo = M.boss, x = Bo.x - cam; if (x < -60 || x > VW_ + 60) continue; drawHorseman(ctx, x, Bo.y + 6, .64, H.x < Bo.x, foCol, { t: tt + 2, g: tt*.4, run: true, wa: -1.0 + Math.sin(tt*2)*.5, weapon: frd ? frd.weapon : 'blade', horse: frd ? frd.horse : '#2c2420', look: frd, hurt: Bo.hurt > 0 });
        ctx.fillStyle = '#3a1410'; ctx.fillRect(x - 24, Bo.y - 62, 48, 5); ctx.fillStyle = '#c2452f'; ctx.fillRect(x - 24, Bo.y - 62, 48*Math.max(0, Bo.hp)/Bo.max, 5); ctx.font = '700 11px Pretendard, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#2a1410'; ctx.lineWidth = 3; ctx.strokeText(foe.name, x, Bo.y - 66); ctx.fillText(foe.name, x, Bo.y - 66); continue; }
      const x = e.x - cam, col = e.side ? foCol : myCol;
      const cav = e.type==='cav', SS = .76, ax = cav ? 28 : 12, ay = cav ? 38 : 37, hv = e.k==='heavy' ? shade(col, .7) : col;
      if (e.k==='eleph'){ if (e.dead){ ctx.globalAlpha = Math.max(0, 1 - e.dead/.6); drawElephant(ctx, x, e.y + 4, .62, !!e.side, col, 0); ctx.globalAlpha = 1; } else drawElephant(ctx, x, e.y + 4, .62, !!e.side, col, tt*.8 + e.ph); continue; }
      if (e.dead){ const pd = paFigDie(e.type, hv, Math.min(1, e.dead/.35)); if (pd){ blitFig(ctx, pd, x, e.y, SS, !!e.side, ax, ay, 1 - Math.max(0, e.dead - .35)/.25); continue; } }
      if (e.dead){ const k = Math.min(1, e.dead/.25); ctx.save(); ctx.translate(x, e.y); ctx.rotate((e.side ? 1 : -1)*1.4*k); ctx.translate(-x, -e.y); blitFig(ctx, figSprite(e.type, hv, 'idle'), x, e.y, SS, !!e.side, ax, ay, 1 - e.dead/.6); ctx.restore(); continue; }
      const on = Math.sin(tt*2.6 + e.ph) > 0, pose = cav ? (on ? 'a' : 'b') : (on ? 'charge' : 'idle');
      blitFig(ctx, figSprite(e.type, hv, pose), x, e.y - (e.fight ? 0 : Math.abs(Math.sin(tt*2.6 + e.ph))*1.4), SS, !!e.side, ax, ay);
    }
    for (const f of M.fx){ const x = f.x - cam, k = f.t/.5; if (f.k==='slash') slashArc(ctx, x, f.y, 34, f.f > 0 ? -1.2 : Math.PI - 1.2, 2.4, k, f.f < 0); else if (f.k==='hit') glow(ctx, x, f.y, 18*(1 + k), .7*(1 - k), '255,120,90'); else if (f.k==='volley'){ ctx.strokeStyle = `rgba(30,20,10,${1 - k})`; ctx.lineWidth = 1.4; for (let i = 0; i < 16; i++){ const ax = x - 56 + (i*37 % 112), ay = f.y - 34 + (i*23 % 68); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + 3, ay - 12); ctx.stroke(); } } }
    if (M.flash > 0){ glow(ctx, H.x - cam, H.y - 14, 150, .8*M.flash, '255,210,110'); for (let q = 0; q < 3; q++) slashArc(ctx, H.x - cam, H.y - 10, 80 + q*22, q*2.1 + M.t*8, 2.6, 1 - M.flash, false); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (SC.wx==='snow'){ ctx.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 70; i++) ctx.fillRect((i*71 + M.t*30 + Math.sin(M.t + i)*8) % VW, (i*53 + M.t*60) % VH, 2, 2); }
    if (SC.wx==='rain'){ ctx.strokeStyle = 'rgba(70,90,110,.5)'; ctx.lineWidth = 1; for (let i = 0; i < 60; i++){ const x = (i*53 + M.t*240) % (VW + 40) - 20, y = (i*97 + M.t*520) % VH; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 5, y + 13); ctx.stroke(); } }
    // 싸움터 전체 지도 (위쪽 띠)
    ctx.fillStyle = 'rgba(20,14,8,.6)'; ctx.fillRect(170, 8, 300, 12); const mx = v => 170 + v/MEL_W*300;
    ctx.fillStyle = M.depot.dead ? '#555' : '#d9b04a'; ctx.fillRect(mx(M.depot.x) - 2, 9, 4, 10); for (const h of M.hills){ ctx.fillStyle = h.own ? '#4f9a5c' : '#b08050'; ctx.fillRect(mx(h.x) - 2, 9, 4, 10); } if (!M.boss.dead){ ctx.fillStyle = '#e24b4a'; ctx.fillRect(mx(M.boss.x) - 2, 9, 4, 10); } ctx.fillStyle = '#fff'; ctx.fillRect(mx(H.x) - 1.5, 6, 3, 16);
    if (M.done){ ctx.fillStyle = 'rgba(20,14,8,.5)'; ctx.fillRect(0, 0, VW, VH); }
  }
  M.raf = requestAnimationFrame(frame);
}
