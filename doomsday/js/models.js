/* ==========================================================================
   models.js — 로우폴리 3D 모델 (상자·구·원기둥 조립식)
   - 각 파츠: m=모양(cube/ico/cyl/cone), p=[x,y,z] 위치, s=[가로,세로,깊이] 크기, c=색 이름(config 색상표), a=애니메이션
   - 위치·크기 숫자를 바꾸면 모양이 바로 바뀜 (앞쪽이 +z)
   ========================================================================== */
window.DX = window.DX || {};
(function (DX) {
  'use strict';
  const E = DX.E, T = E.T;
  const MD = {};

  /* ---------------- 좀비 파츠 ---------------- */
  const base = () => [
    { m: 'cube', p: [-0.17, 0.42, 0], s: [0.22, 0.84, 0.24], c: 'pants', a: 'legL', pv: [-0.17, 0.84, 0] },
    { m: 'cube', p: [0.17, 0.42, 0], s: [0.22, 0.84, 0.24], c: 'pants', a: 'legR', pv: [0.17, 0.84, 0] },
    { m: 'cube', p: [0, 1.18, 0], s: [0.6, 0.72, 0.36], c: 'shirt' },
    { m: 'ico', p: [0, 1.8, 0.04], s: [0.54, 0.52, 0.52], c: 'skin', a: 'head', pv: [0, 1.55, 0] },
    { m: 'cube', p: [-0.11, 1.86, 0.28], s: [0.16, 0.16, 0.06], c: 'eye', a: 'head', pv: [0, 1.55, 0] },
    { m: 'cube', p: [0.13, 1.83, 0.28], s: [0.1, 0.1, 0.06], c: 'eye', a: 'head', pv: [0, 1.55, 0] },
    { m: 'cube', p: [-0.1, 1.85, 0.315], s: [0.07, 0.07, 0.03], c: 'pupil', a: 'head', pv: [0, 1.55, 0], lq: true },
    { m: 'cube', p: [0.14, 1.82, 0.315], s: [0.05, 0.05, 0.03], c: 'pupil', a: 'head', pv: [0, 1.55, 0], lq: true },
  ];
  const armsFwd = (col) => [
    { m: 'cube', p: [-0.41, 1.42, 0.28], s: [0.16, 0.16, 0.64], c: col || 'skin', a: 'armL', pv: [-0.41, 1.42, 0] },
    { m: 'cube', p: [0.41, 1.42, 0.28], s: [0.16, 0.16, 0.64], c: col || 'skin', a: 'armR', pv: [0.41, 1.42, 0] },
  ];
  MD.zombieParts = {
    office: base().concat(armsFwd(), [
      { m: 'cube', p: [0, 1.2, 0.19], s: [0.1, 0.46, 0.03], c: 'tie' },
      { m: 'cube', p: [0.05, 1.68, 0.29], s: [0.26, 0.2, 0.07], c: 'toast', a: 'head', pv: [0, 1.55, 0] },
      { m: 'cube', p: [0.38, 1.0, -0.05], s: [0.1, 0.38, 0.48], c: 'bag' },
    ]),
    box: base().concat(armsFwd(), [
      { m: 'cube', p: [0, 1.14, 0.02], s: [0.88, 0.88, 0.68], c: 'box', armor: true },
      { m: 'cube', p: [0, 1.59, 0.02], s: [0.9, 0.04, 0.22], c: 'tape', armor: true },
      { m: 'cube', p: [0, 1.14, 0.37], s: [0.22, 0.88, 0.02], c: 'tape', armor: true },
      { m: 'cube', p: [0, 2.06, 0.06], s: [0.52, 0.12, 0.56], c: 'cap', a: 'head', pv: [0, 1.55, 0] },
    ]),
    dancer: base().concat([
      { m: 'cube', p: [-0.42, 1.78, 0], s: [0.16, 0.64, 0.16], c: 'skin', a: 'upL', pv: [-0.42, 1.46, 0] },
      { m: 'cube', p: [0.42, 1.78, 0], s: [0.16, 0.64, 0.16], c: 'skin', a: 'upR', pv: [0.42, 1.46, 0] },
      { m: 'ico', p: [0, 2.0, -0.06], s: [0.8, 0.72, 0.74], c: 'hair', a: 'head', pv: [0, 1.55, 0] },
    ]),
    bomber: base().concat(armsFwd(), [
      { m: 'ico', p: [0, 1.08, 0.16], s: [0.92, 0.86, 0.84], c: 'belly', pulse: true },
      { m: 'cube', p: [0, 2.02, 0.0], s: [0.6, 0.08, 0.6], c: 'tie', a: 'head', pv: [0, 1.55, 0] },
      { m: 'cube', p: [0.3, 2.0, -0.2], s: [0.08, 0.06, 0.4], c: 'tie', a: 'head', pv: [0, 1.55, 0] },
      { m: 'cube', p: [-0.2, 1.72, 0.27], s: [0.1, 0.06, 0.04], c: 'cheek', a: 'head', pv: [0, 1.55, 0] },
      { m: 'cube', p: [0.22, 1.72, 0.27], s: [0.1, 0.06, 0.04], c: 'cheek', a: 'head', pv: [0, 1.55, 0] },
    ]),
    riot: base().concat(armsFwd('shirt'), [
      { m: 'cube', p: [0, 1.2, 0], s: [0.72, 0.8, 0.44], c: 'shirt' },
      { m: 'ico', p: [0, 1.92, 0.02], s: [0.62, 0.44, 0.62], c: 'helmet', a: 'head', pv: [0, 1.55, 0] },
      { m: 'cube', p: [0, 1.84, 0.27], s: [0.46, 0.16, 0.05], c: 'visor', a: 'head', pv: [0, 1.55, 0] },
      { m: 'cube', p: [0.05, 1.15, 0.62], s: [0.86, 1.15, 0.08], c: 'shield', a: 'armR', pv: [0.41, 1.42, 0] },
    ]),
  };

  function partAnim(a, ph, z) {
    // 반환: [rx, ry, rz]
    const atk = z.atk ? 2.2 : 1;
    switch (a) {
      case 'legL': return [Math.sin(ph) * 0.75, 0, 0];
      case 'legR': return [-Math.sin(ph) * 0.75, 0, 0];
      case 'armL':
        if (z.type === 'office') return [Math.sin(ph * 1.3) * 0.9 - 0.3, 0, -0.2];
        return [-0.1 + Math.sin(ph * atk + 1) * 0.3 * atk, 0, 0];
      case 'armR':
        if (z.type === 'office') return [-Math.sin(ph * 1.3) * 0.9 - 0.3, 0, 0.2];
        return [-0.1 + Math.sin(ph * atk) * 0.3 * atk, 0, 0];
      case 'upL': return [0, 0, 0.5 + Math.sin(ph * 0.8) * 0.55];
      case 'upR': return [0, 0, -0.5 - Math.sin(ph * 0.8 + 1.4) * 0.55];
      case 'head': return [0, 0, Math.sin(ph * 0.5) * 0.18];
    }
    return null;
  }

  const FLASH = [1, 1, 1], CHAR = E.col('#2b2422'), ICE = E.col('#bff8ff');
  // z: {type, x,y,z, yaw, ph, s(scale), flash, stun, burn(0~1), armor, tx,tz(기울기), lean, alpha, lq}
  MD.zombie = function (z, cfg, lq) {
    const parts = MD.zombieParts[z.model || z.type];
    const cols = cfg.colors;
    const bob = z.dead ? 0 : Math.abs(Math.sin(z.ph)) * 0.09;
    const jit = z.stun > 0 ? (Math.random() - 0.5) * 0.12 : 0;
    for (let i = 0; i < parts.length; i++) {
      const P = parts[i];
      if (P.armor && !z.armor) continue;
      if (lq && P.lq) continue;
      T.reset().tr(z.x + jit, z.y + bob + (z.lift || 0), z.z).ry(z.yaw).rx(z.tx || 0).rz(z.tz || 0).sc(z.s, z.s * (z.squash || 1), z.s);
      if (!z.dead) T.rx(0.16);
      const an = P.a && !z.frozen ? partAnim(P.a, z.ph, z) : null;
      if (an) {
        T.tr(P.pv[0], P.pv[1], P.pv[2]).rx(an[0]).rz(an[2]).tr(P.p[0] - P.pv[0], P.p[1] - P.pv[1], P.p[2] - P.pv[2]);
      } else T.tr(P.p[0], P.p[1], P.p[2]);
      if (P.pulse) { const k = 1 + Math.sin(z.ph * 0.6) * 0.08 + (z.swell || 0); T.sc(P.s[0] * k, P.s[1] * k, P.s[2] * k); }
      else T.sc(P.s[0], P.s[1], P.s[2]);
      let col = cols[P.c] || '#ff00ff', emi = 0;
      if (z.flash > 0) { col = FLASH; emi = 0.7; }
      else if (z.burn > 0) { col = lerpC(E.col(col), CHAR, z.burn); }
      else if (z.stun > 0) { col = lerpC(E.col(col), ICE, 0.6); emi = 0.5; }
      E.draw(P.m, col, emi, z.alpha === undefined ? 1 : z.alpha);
    }
  };
  const tmpC = [0, 0, 0];
  function lerpC(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  MD.lerpC = lerpC;

  MD.crown = function (z) {
    for (let i = 0; i < 5; i++) {
      T.reset().tr(z.x, z.y, z.z).ry(z.yaw).rx(z.tx || 0).rz(z.tz || 0).sc(z.s).rx(0.16).tr(0, 2.16, 0.04).ry(i * Math.PI * 2 / 5).tr(0, 0, 0.24).sc(0.14, 0.26, 0.06);
      E.draw('cube', '#ffd700', 0.5);
    }
    T.reset().tr(z.x, z.y, z.z).ry(z.yaw).rx(z.tx || 0).rz(z.tz || 0).sc(z.s).rx(0.16).tr(0, 2.06, 0.04).sc(0.56, 0.1, 0.56);
    E.draw('cyl12', '#ffcf3a', 0.4);
  };

  /* ---------------- 보스: 변이 거미 부장님 ---------------- */
  MD.boss = function (b, cfg) {
    const c = cfg.colors, s = b.s, fl = b.flash > 0;
    const col = k => fl ? FLASH : c[k];
    const emi = fl ? 0.7 : 0;
    // 다리 6개
    for (let i = 0; i < 6; i++) {
      const side = i < 3 ? -1 : 1, k = i % 3;
      const sw = Math.sin(b.ph + i * 1.7) * 0.35;
      T.reset().tr(b.x, b.y, b.z).ry(b.yaw).rx(b.tx || 0).rz(b.tz || 0).sc(s);
      T.tr(side * 0.45, 0.95, -0.35 + k * 0.38).ry(side * (0.5 - k * 0.5) + sw * 0.5).rz(side * -0.9);
      T.push().tr(0, 0.5, 0).sc(0.16, 1.0, 0.16); E.draw('cube', col('leg'), emi); T.pop();
      T.tr(0, 1.0, 0).rz(side * 2.0 + sw);
      T.tr(0, 0.55, 0).sc(0.12, 1.1, 0.12); E.draw('cube', col('leg'), emi);
    }
    T.reset().tr(b.x, b.y, b.z).ry(b.yaw).rx(b.tx || 0).rz(b.tz || 0).sc(s);
    const breathe = 1 + Math.sin(b.ph * 0.5) * 0.04;
    T.push().tr(0, 1.0, -0.25).sc(1.25 * breathe, 0.95, 1.4); E.draw('ico', col('body'), emi); T.pop();
    for (let i = 0; i < 6; i++) { T.push().tr(Math.sin(i * 2.1) * 0.45, 1.3 + Math.cos(i) * 0.2, -0.4 + Math.cos(i * 1.3) * 0.4).sc(0.28 + (i % 2) * 0.12); E.draw('ico', col('spots'), emi); T.pop(); }
    T.push().tr(0, 1.25, 0.55).rx(Math.sin(b.ph * 0.7) * 0.15).sc(0.8, 0.75, 0.75); E.draw('ico', col('skin'), emi); T.pop();
    const eyes = [[-0.18, 1.38, 0.88, 0.16], [0.2, 1.42, 0.86, 0.12], [0.02, 1.56, 0.84, 0.1]];
    for (const e of eyes) { T.push().tr(e[0], e[1], e[2]).sc(e[3]); E.draw('ico', fl ? FLASH : c.eye, 1.2); T.pop(); }
    T.push().tr(0, 1.08, 0.86).sc(0.36, 0.14 + Math.abs(Math.sin(b.ph)) * 0.08, 0.06); E.draw('cube', '#3a0f1f', 0); T.pop();
    T.push().tr(0, 0.8, 0.82).rx(0.4).sc(0.12, 0.4, 0.04); E.draw('cube', col('tie'), emi); T.pop();
  };

  /* ---------------- 생존자 ---------------- */
  MD.survivor = function (x, y, z, yaw, sv, gun, recoil, t) {
    const jk = sv.jacket, sk = sv.skin;
    T.reset().tr(x, y, z).ry(yaw).sc(0.95);
    T.push().tr(-0.15, 0.4, 0).sc(0.2, 0.8, 0.22); E.draw('cube', '#222833'); T.pop();
    T.push().tr(0.15, 0.4, 0).sc(0.2, 0.8, 0.22); E.draw('cube', '#222833'); T.pop();
    T.push().tr(0, 1.15, 0).sc(0.64, 0.78, 0.44); E.draw('cube', jk); T.pop();
    T.push().tr(0, 1.32, 0).sc(0.68, 0.06, 0.48); E.draw('cube', '#ffffff', 0, 0.3); T.pop();
    T.push().tr(0, 1.02, 0).sc(0.68, 0.06, 0.48); E.draw('cube', '#ffffff', 0, 0.3); T.pop();
    T.push().tr(0, 1.78, 0).sc(0.46, 0.46, 0.46); E.draw('ico', sk); T.pop();
    T.push().tr(0, 1.9, -0.02).sc(0.52, 0.32, 0.54); E.draw('ico', sv.helmet); T.pop();
    T.push().tr(0, 1.86, 0.2).sc(0.4, 0.1, 0.1); E.draw('cube', '#1c1f26'); T.pop();
    // 팔 + 무기
    const rc = recoil || 0;
    T.push().tr(0, 1.32, 0.3 - rc * 0.12);
    T.push().tr(-0.3, -0.05, -0.05).sc(0.14, 0.14, 0.5); E.draw('cube', '#ffd400'); T.pop();
    T.push().tr(0.3, -0.05, -0.05).sc(0.14, 0.14, 0.5); E.draw('cube', '#ffd400'); T.pop();
    if (gun === 'gold') {
      T.push().tr(0, 0, 0.3).sc(0.3, 0.26, 0.9); E.draw('cube', '#d9a520', 0.15); T.pop();
      T.push().tr(0, 0, 0.9).rx(Math.PI / 2).ry(t * 30).sc(0.22, 0.5, 0.22); E.draw('cyl', '#ffcf3a', 0.2); T.pop();
    } else {
      T.push().tr(0, 0, 0.32).sc(0.18, 0.2, 0.72); E.draw('cube', '#3a3f4a'); T.pop();
      T.push().tr(0, 0, 0.72).rx(Math.PI / 2).sc(0.08, 0.3, 0.08); E.draw('cyl', '#8b5a2b'); T.pop();
      T.push().tr(0, 0, 0.92).rx(Math.PI / 2).sc(0.24, 0.14, 0.24); E.draw('cyl', '#e8322f'); T.pop();
    }
    T.pop();
  };

  /* ---------------- 열차 ---------------- */
  function wheel(x, z, ang, col) {
    T.reset().tr(x, 0.5, z).rz(Math.PI / 2).ry(ang).sc(0.9, 0.22, 0.9);
    E.draw('cyl', col);
  }
  MD.engine = function (z0, C, wa, ghost) {
    const A = ghost ? 0.38 : 1, P = ghost ? 1 : 0;
    const body = ghost ? '#8ff3ff' : C.body, dark = ghost ? '#5fd9ff' : C.dark, trim = ghost ? '#bffaff' : C.trim;
    const L = 6.4;
    E.box('cube', 0, 0.85, z0 + L / 2, 2.8, 0.5, L, 0, dark, ghost ? 0.4 : 0, A, P);
    E.box('cube', 0, 2.0, z0 + 3.7, 2.6, 2.0, 5.0, 0, body, ghost ? 0.4 : 0, A, P);
    E.box('cube', 0, 3.25, z0 + 4.7, 2.3, 0.9, 2.6, 0, trim, ghost ? 0.4 : 0, A, P);
    // 앞 경사면
    T.reset().tr(0, 1.7, z0 + 1.05).rx(-0.55).sc(2.6, 1.4, 0.9); E.draw('cube', body, ghost ? 0.4 : 0, A, P);
    if (!ghost) {
      E.box('cube', 0, 3.3, z0 + 3.39, 1.9, 0.42, 0.06, 0, C.window, 0.8);
      // 줄무늬 제설판
      for (let i = 0; i < 6; i++) {
        T.reset().tr(-1.17 + i * 0.47, 0.75, z0 + 0.1).rx(0.5).sc(0.47, 0.7, 0.35);
        E.draw('cube', i % 2 ? C.stripe : '#1b1b1b');
      }
      E.box('cube', -0.8, 1.55, z0 + 0.62, 0.42, 0.3, 0.12, 0, '#fff6b0', 1.6);
      E.box('cube', 0.8, 1.55, z0 + 0.62, 0.42, 0.3, 0.12, 0, '#fff6b0', 1.6);
      T.reset().tr(0, 3.4, z0 + 1.9).sc(0.5, 1.0, 0.5); E.draw('cyl', '#2a2c31');
      T.reset().tr(0, 3.95, z0 + 1.9).sc(0.65, 0.18, 0.65); E.draw('cyl', '#1c1d21');
      // 측면 장갑판 + 리벳줄
      for (const sx of [-1, 1]) {
        E.box('cube', sx * 1.32, 2.0, z0 + 3.7, 0.08, 1.4, 4.6, 0, trim);
        E.box('cube', sx * 1.37, 2.55, z0 + 3.7, 0.04, 0.08, 4.4, 0, '#d8cfb2');
        E.box('cube', sx * 1.37, 1.45, z0 + 3.7, 0.04, 0.08, 4.4, 0, '#d8cfb2');
      }
      for (const wz of [1.6, 3.4, 5.2]) { wheel(-1.35, z0 + wz, wa, '#1d1e22'); wheel(1.35, z0 + wz, wa, '#1d1e22'); }
    }
    return L;
  };
  MD.CAR_LEN = 5.2;
  MD.car = function (z0, kind, C, wa, ghost, st) {
    const A = ghost ? 0.38 : 1, P = ghost ? 1 : 0, L = MD.CAR_LEN;
    const wood = ghost ? '#8ff3ff' : C.wood, dark = ghost ? '#5fd9ff' : C.dark;
    E.box('cube', 0, 0.85, z0 + L / 2, 2.7, 0.45, L, 0, dark, ghost ? 0.4 : 0, A, P);
    E.box('cube', 0, 1.2, z0 + L / 2, 2.8, 0.3, L - 0.2, 0, wood, ghost ? 0.4 : 0, A, P);
    if (ghost) {
      E.box('cube', 0, 2.0, z0 + L / 2, 2.4, 1.3, L - 0.8, 0, '#bffaff', 0.5, 0.25, 1);
      return;
    }
    // 옆 난간
    for (const sx of [-1, 1]) E.box('cube', sx * 1.35, 1.6, z0 + L / 2, 0.1, 0.5, L - 0.3, 0, '#5a3a26');
    for (const wz of [0.9, L - 0.9]) { wheel(-1.32, z0 + wz, wa, '#1d1e22'); wheel(1.32, z0 + wz, wa, '#1d1e22'); }
    // 연결부
    E.box('cube', 0, 0.9, z0 - 0.3, 0.5, 0.3, 0.7, 0, '#22252c');
    const cz = z0 + L / 2, t = st.t;
    if (kind === 'gun') {
      for (let i = 0; i < 6; i++) {
        T.reset().tr(-1.15 + (i % 2) * 2.3, 1.55, z0 + 0.7 + Math.floor(i / 2) * 1.85).sc(0.55, 0.38, 1.4); E.draw('ico', '#cdb88a');
      }
      E.box('cube', 0, 1.6, cz + 1.8, 0.8, 0.5, 0.6, 0.3, '#6b7d3a');
    } else if (kind === 'flame') {
      for (const sx of [-0.55, 0.55]) { T.reset().tr(sx, 1.95, cz).rx(Math.PI / 2).sc(0.95, L - 1.4, 0.95); E.draw('cyl12', '#c8452d'); }
      E.box('cube', 0, 2.5, cz, 0.3, 0.2, L - 1.4, 0, '#ffd400');
      for (const sx of [-1, 1]) for (const dz of [-1.3, 1.3]) {
        T.reset().tr(sx * 1.45, 1.9, cz + dz).rz(sx * Math.PI / 2).sc(0.32, 0.8, 0.32); E.draw('cyl', '#2d2f36');
        E.box('ico', sx * 1.9, 1.9, cz + dz, 0.22, 0.22, 0.22, 0, '#ff9a2a', 1.4 + Math.sin(t * 20 + dz) * 0.3);
      }
    } else if (kind === 'tesla') {
      E.box('cube', 0, 1.6, cz, 1.6, 0.5, 1.6, 0, '#3a3d46');
      for (let i = 0; i < 6; i++) { T.reset().tr(0, 2.0 + i * 0.4, cz).sc(1.05 - i * 0.09, 0.22, 1.05 - i * 0.09); E.draw('cyl12', i % 2 ? '#c8833a' : '#e0a35a'); }
      const pulse = 1 + Math.sin(t * 9) * 0.12;
      E.box('ico', 0, 4.65, cz, 0.85 * pulse, 0.85 * pulse, 0.85 * pulse, 0, '#7ff3ff', 1.5);
      T.reset().tr(0, 4.65, cz).sc(1.9 * pulse); E.draw('ico', '#3df2ff', 1, 0.18, 2);
      for (const dz of [-1.8, 1.8]) E.box('cube', 0, 1.7, cz + dz, 2.2, 0.4, 0.4, 0, '#2c2f36');
    } else if (kind === 'drone') {
      E.box('cube', 0, 1.42, cz, 2.3, 0.14, 3.6, 0, '#30343c');
      E.box('cube', 0, 1.5, cz, 0.18, 0.04, 1.6, 0, '#ffd400', 0.4);
      E.box('cube', -0.45, 1.5, cz, 0.18, 0.04, 1.6, 0, '#ffd400', 0.4);
      E.box('cube', 0.45, 1.5, cz, 0.18, 0.04, 1.6, 0, '#ffd400', 0.4);
      E.box('cube', -0.9, 1.6, cz + 2.0, 0.6, 0.4, 0.6, 0, '#6b7d3a');
      E.box('cube', 0.9, 1.6, cz - 2.0, 0.6, 0.4, 0.6, 0, '#6b7d3a');
    } else if (kind === 'cannon') {
      const yaw = st.cannonYaw || 0, rc = st.cannonRecoil || 0, twin = st.cannonTwin;
      T.reset().tr(0, 1.75, cz).sc(1.9, 0.6, 1.9); E.draw('cyl12', '#3d4250');
      T.reset().tr(0, 2.4, cz).ry(yaw).sc(1.5, 0.8, 1.8); E.draw('cube', '#5a6070');
      for (const bx of (twin ? [-0.32, 0.32] : [0])) {
        T.reset().tr(0, 2.45, cz).ry(yaw).tr(bx, 0, 1.4 - rc * 0.4).rx(Math.PI / 2).sc(0.32, 2.0, 0.32); E.draw('cyl', '#2a2d35');
        T.reset().tr(0, 2.45, cz).ry(yaw).tr(bx, 0, 2.4 - rc * 0.4).rx(Math.PI / 2).sc(0.42, 0.3, 0.42); E.draw('cyl', '#1a1c22');
      }
      E.box('cube', 0, 2.9, cz, 0.6, 0.12, 0.6, yaw, '#ff3b3b', 0.8);
    }
  };

  /* ---------------- 소품/이펙트 ---------------- */
  MD.leek = function (x, y, z, len, tilt, spin) {
    T.reset().tr(x, y, z).ry(spin || 0).rz(tilt || 0);
    T.push().tr(0, len * 0.2, 0).sc(len * 0.16, len * 0.4, len * 0.16); E.draw('cyl12', '#f6f8ef', 0.25); T.pop();
    T.push().tr(0, len * 0.5, 0).sc(len * 0.15, len * 0.22, len * 0.15); E.draw('cyl12', '#b7e28a', 0.2); T.pop();
    for (let i = 0; i < 4; i++) {
      T.push().tr(0, len * 0.62, 0).ry(i * 1.6).rz(0.25 + i * 0.06).tr(0, len * 0.22, 0).sc(len * 0.1, len * 0.48, len * 0.04);
      E.draw('cube', i % 2 ? '#3aa53a' : '#2f8f2f', 0.15); T.pop();
    }
    for (let i = 0; i < 5; i++) { T.push().tr((i - 2) * len * 0.03, -len * 0.04, 0).sc(len * 0.015, len * 0.1, len * 0.015); E.draw('cube', '#e8dcc0'); T.pop(); }
  };
  MD.barrel = function (x, y, z, rot, s) {
    T.reset().tr(x, y, z).rx(rot).rz(rot * 0.6).sc(s || 1);
    T.push().sc(1.0, 1.3, 1.0); E.draw('cyl12', '#a8612e'); T.pop();
    for (const ry of [-0.4, 0, 0.4]) { T.push().tr(0, ry * 1.3, 0).sc(1.06, 0.1, 1.06); E.draw('cyl12', '#2b2724'); T.pop(); }
    T.push().tr(0, 0.66, 0).sc(0.5, 0.05, 0.5); E.draw('cyl12', '#ffcc33', 0.8); T.pop();
  };
  MD.drone = function (x, y, z, t) {
    T.reset().tr(x, y, z).ry(t * 0.8);
    T.push().sc(0.6, 0.25, 0.6); E.draw('cube', '#2c3038'); T.pop();
    T.push().tr(0, -0.12, 0).sc(0.3, 0.15, 0.3); E.draw('cube', '#3df2ff', 1.2); T.pop();
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      T.push().tr(Math.cos(a) * 0.45, 0.05, Math.sin(a) * 0.45).sc(0.12, 0.08, 0.12); E.draw('cube', '#1b1d22'); T.pop();
      T.push().tr(Math.cos(a) * 0.45, 0.12, Math.sin(a) * 0.45).sc(0.55, 0.02, 0.55); E.draw('disc', '#c8d6e6', 0.3, 0.45, 1); T.pop();
    }
  };

  /* 배경 소품 */
  MD.prop = function (p, theme, t) {
    switch (p.k) {
      case 'rock':
        T.reset().tr(p.x, p.y, p.z).ry(p.r).rz(p.r2 * 0.2).sc(p.sx, p.sy, p.sz); E.draw('ico0', p.col); break;
      case 'mesa':
        E.box('cube', p.x, p.sy / 2, p.z, p.sx, p.sy, p.sz, p.r, p.col);
        E.box('cube', p.x, p.sy * 0.62, p.z, p.sx * 1.04, p.sy * 0.08, p.sz * 1.04, p.r, p.col2);
        E.box('cube', p.x, p.sy * 0.3, p.z, p.sx * 1.06, p.sy * 0.1, p.sz * 1.06, p.r, p.col2);
        break;
      case 'cactus':
        T.reset().tr(p.x, p.sy / 2, p.z).sc(0.5, p.sy, 0.5); E.draw('cyl', theme.plant);
        T.reset().tr(p.x + 0.45, p.sy * 0.55, p.z).sc(0.36, p.sy * 0.35, 0.36); E.draw('cyl', theme.plant);
        T.reset().tr(p.x - 0.45, p.sy * 0.7, p.z).sc(0.32, p.sy * 0.3, 0.32); E.draw('cyl', theme.plant);
        break;
      case 'tuft':
        E.box('cone', p.x, 0.25, p.z, 0.5, 0.5, 0.5, p.r, '#8a8f3a'); break;
      case 'building': {
        const h = p.sy;
        E.box('cube', p.x, h / 2, p.z, p.sx, h, p.sz, 0, p.col);
        E.box('cube', p.x, h + 0.2, p.z, p.sx * 1.04, 0.4, p.sz * 1.04, 0, '#2a2e38');
        const face = p.x < 0 ? p.x + p.sx / 2 + 0.02 : p.x - p.sx / 2 - 0.02;
        const rows = Math.min(8, Math.floor(h / 2.2));
        for (let r = 0; r < rows; r++) {
          const lit = ((p.seed * 13 + r * 7) % 10) / 10;
          const flick = Math.sin(t * 3 + p.seed + r) > -0.85;
          const col = lit > 0.55 && flick ? (lit > 0.85 ? p.neon : '#ffe7a3') : '#262a33';
          T.reset().tr(face, 1.6 + r * 2.2, p.z).sc(0.05, 0.9, p.sz * 0.8); E.draw('cube', col, lit > 0.55 && flick ? 1.1 : 0);
        }
        if (p.sign) {
          const on = Math.sin(t * 6 + p.seed) > -0.5;
          T.reset().tr(face + (p.x < 0 ? 0.3 : -0.3), h * 0.55, p.z + p.sz * 0.3).sc(0.2, h * 0.35, 0.7);
          E.draw('cube', on ? p.neon : '#333', on ? 1.6 : 0);
        }
        break;
      }
      case 'wreck':
        T.reset().tr(p.x, 0.6, p.z).ry(p.r).rz(p.r2 * 0.15).sc(2.0, 0.8, 3.8); E.draw('cube', p.col);
        T.reset().tr(p.x, 1.2, p.z).ry(p.r).tr(0, 0, -0.2).sc(1.7, 0.6, 1.9); E.draw('cube', p.col);
        T.reset().tr(p.x, 1.2, p.z).ry(p.r).tr(0, 0, 0.78).sc(1.6, 0.45, 0.05); E.draw('cube', '#7fa9c9', 0.2);
        break;
      case 'lamp':
        T.reset().tr(p.x, 2.5, p.z).sc(0.18, 5, 0.18); E.draw('cyl', '#55595f');
        E.box('cube', p.x + (p.x < 0 ? 0.6 : -0.6), 5.0, p.z, 1.3, 0.2, 0.4, 0, '#55595f');
        E.box('cube', p.x + (p.x < 0 ? 1.1 : -1.1), 4.85, p.z, 0.5, 0.15, 0.35, 0, '#ffe6a0', 1.6);
        break;
      case 'pillar':
        E.box('cube', p.x, 2, p.z, 1.2, 4, 1.2, 0, '#5a5f6b'); break;
      case 'pole':
        T.reset().tr(p.x, 3, p.z).sc(0.22, 6, 0.22); E.draw('cyl', '#6b4a32');
        E.box('cube', p.x, 5.6, p.z, 1.6, 0.14, 0.14, 0, '#5a3d28');
        for (const dx of [-0.65, 0.65]) E.box('cube', p.x + dx, 5.75, p.z, 0.1, 0.16, 0.1, 0, '#c9d6e0');
        break;
      case 'tower':
        for (const dx of [-1.1, 1.1]) for (const dz of [-1.1, 1.1]) { T.reset().tr(p.x + dx, 3, p.z + dz).sc(0.25, 6, 0.25); E.draw('cyl', '#5a3d28'); }
        T.reset().tr(p.x, 7.6, p.z).sc(3.4, 3.2, 3.4); E.draw('cyl12', '#8a6a4a');
        T.reset().tr(p.x, 9.5, p.z).sc(3.6, 0.8, 3.6); E.draw('cone', '#6a4a30');
        E.box('cube', p.x, 7.6, p.z + (p.x < 0 ? 1.0 : -1.0), 1.6, 0.4, 1.6, 0, '#c33b2a');
        break;
      case 'station':
        E.box('cube', p.x, 0.5, p.z, 4, 1, 14, 0, '#9a8a72');
        for (const dz of [-5.5, 0, 5.5]) { T.reset().tr(p.x - 1.2, 2.6, p.z + dz).sc(0.25, 3.2, 0.25); E.draw('cyl', '#4a3a2e'); }
        T.reset().tr(p.x - 0.4, 4.3, p.z).rz(p.x < 0 ? -0.18 : 0.18).sc(4.4, 0.3, 14.6); E.draw('cube', '#7a3a2a');
        E.box('cube', p.x - 0.4, 3.3, p.z - 7.2, 2.4, 0.8, 0.12, 0, '#2a5a8a');
        E.box('cube', p.x + 1.2, 1.4, p.z + 3, 1.0, 0.8, 1.0, 0.4, '#b5835a');
        break;
      case 'tumble': {
        const rx = p.x + Math.sin(t * 0.7 + p.seed) * 3;
        T.reset().tr(rx, 0.6 + Math.abs(Math.sin(t * 4 + p.seed)) * 0.5, p.z).rz(-t * 4).rx(t * 2).sc(1.1); E.draw('ico0', '#a8844a');
        break;
      }
      case 'billboard':
        for (const dz of [-1.8, 1.8]) { T.reset().tr(p.x, 4, p.z + dz).sc(0.3, 8, 0.3); E.draw('cyl', '#4a4e58'); }
        E.box('cube', p.x, 9, p.z, 0.4, 3.6, 6.2, 0, '#2a2e38');
        E.box('cube', p.x + (p.x < 0 ? 0.22 : -0.22), 9, p.z, 0.05, 3.2, 5.8, 0, p.neon, 0.9);
        E.box('cube', p.x + (p.x < 0 ? 0.25 : -0.25), 9.6, p.z - 1, 0.05, 0.6, 3.2, 0, '#ffffff', 1.2);
        E.box('cube', p.x + (p.x < 0 ? 0.25 : -0.25), 8.4, p.z + 0.8, 0.05, 1.2, 1.6, 0, '#1a1a1a', 0.2);
        break;
      case 'bus':
        T.reset().tr(p.x, 1.5, p.z).ry(p.r).rz(p.r2 * 0.1).sc(2.6, 2.4, 9); E.draw('cube', p.col);
        T.reset().tr(p.x, 2.0, p.z).ry(p.r).sc(2.65, 0.7, 8.2); E.draw('cube', '#7fa9c9', 0.25);
        T.reset().tr(p.x, 0.6, p.z).ry(p.r).sc(2.7, 0.3, 9.1); E.draw('cube', '#1d1e22');
        break;
      case 'traffic': {
        T.reset().tr(p.x, 2.6, p.z).sc(0.16, 5.2, 0.16); E.draw('cyl', '#3a3e46');
        E.box('cube', p.x, 5.2, p.z, 0.5, 1.4, 0.5, 0, '#22252b');
        const ph = Math.floor((t + p.seed) / 2) % 3;
        ['#ff3030', '#ffcc30', '#30ff70'].forEach((c, i) => E.box('cube', p.x + (p.x < 0 ? 0.26 : -0.26), 5.65 - i * 0.42, p.z, 0.06, 0.3, 0.3, 0, i === ph ? c : '#333', i === ph ? 1.6 : 0));
        break;
      }
      case 'truss': {
        const st = theme.steel;
        E.box('cube', p.x, 3.2, p.z, 0.4, 6.4, 0.4, 0, st);
        T.reset().tr(p.x, 3.2, p.z + 3).rx(0.75).sc(0.25, 8.2, 0.25); E.draw('cube', st);
        E.box('cube', p.x, 6.4, p.z + 3, 0.35, 0.35, 6.2, 0, st);
        E.box('cube', p.x, 1.0, p.z + 3, 0.3, 0.3, 6.2, 0, st);
        break;
      }
      case 'cliff':
        T.reset().tr(p.x, p.y, p.z).ry(p.r).sc(p.sx, p.sy, p.sz); E.draw('ico0', p.col); break;
      case 'wallseg': {
        const sx = p.x < 0 ? 1 : -1;
        E.box('cube', p.x, 6, p.z, 2, 12, 8.2, 0, theme.wall);
        E.box('cube', p.x + sx * 1.05, 6, p.z - 4, 0.3, 12, 0.6, 0, '#2a282e');
        T.reset().tr(p.x + sx * 1.2, 3.2, p.z).rx(Math.PI / 2).sc(0.4, 8.2, 0.4); E.draw('cyl', '#5a5040');
        T.reset().tr(p.x + sx * 1.2, 3.9, p.z).rx(Math.PI / 2).sc(0.25, 8.2, 0.25); E.draw('cyl', '#3a6a5a');
        const on = Math.sin(t * 5 + p.seed) > 0;
        E.box('cube', p.x + sx * 1.1, 7.5, p.z + 1, 0.2, 0.5, 0.9, 0, on ? theme.alarm : '#401010', on ? 2 : 0);
        if (on) { T.reset().tr(p.x + sx * 2.2, 0.08, p.z + 1).sc(5); E.draw('disc', theme.alarm, 1, 0.12, 2); }
        if (p.door) {
          E.box('cube', p.x + sx * 1.05, 2.2, p.z, 0.1, 4.4, 3.6, 0, '#55555e');
          for (let i = 0; i < 4; i++) E.box('cube', p.x + sx * 1.12, 0.4 + i * 1.1, p.z, 0.04, 0.4, 3.4, 0, i % 2 ? '#ffc400' : '#1b1b1b', 0.2);
          E.box('cube', p.x + sx * 1.12, 4.8, p.z, 0.04, 0.4, 1.6, 0, '#3dff6b', 1.4);
        }
        break;
      }
      case 'crate':
        E.box('cube', p.x, p.s / 2, p.z, p.s, p.s, p.s, p.r, '#8a6a3a');
        E.box('cube', p.x, p.s / 2, p.z, p.s * 1.02, p.s * 0.15, p.s * 1.02, p.r, '#5a4022');
        break;
    }
  };

  DX.MD = MD;
})(window.DX);
