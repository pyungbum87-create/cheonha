/* ==========================================================================
   engine.js — 초경량 WebGL2 로우폴리 툰 렌더러 (외부 라이브러리 없음)
   - 같은 모양(상자/구/원기둥...)은 GPU 인스턴싱으로 한 번에 그림 → 좀비 수백 마리도 가볍게
   - 툰 셰이딩(계단식 명암) + 림라이트 + 안개
   - 이 파일은 보통 수정할 필요 없음
   ========================================================================== */
window.DX = window.DX || {};
(function (DX) {
  'use strict';
  const E = {};
  let gl = null, cv = null, prog = null;
  const U = {};
  const meshes = {};
  let cssW = 1, cssH = 1, dpr = 1;
  const proj = new Float32Array(16), view = new Float32Array(16), vp = new Float32Array(16);
  const STRIDE = 21; // mat4(16) + color(4) + emissive(1)

  E.dprCap = 2;
  E.cam = { pos: [0, 20, 20], target: [0, 0, 0], fov: 50 };
  E.env = {
    fog: [0.86, 0.66, 0.45], fogNear: 50, fogFar: 150,
    light: [0.45, 0.85, 0.35], sky: [1.0, 0.9, 0.75], ground: [0.55, 0.4, 0.3], ambient: 0.42
  };

  /* ---------------- 수학 ---------------- */
  const M4 = {
    ident(o) { o.fill(0); o[0] = o[5] = o[10] = o[15] = 1; return o; },
    mul(o, a, b) {
      for (let i = 0; i < 4; i++) {
        const a0 = a[i], a1 = a[i + 4], a2 = a[i + 8], a3 = a[i + 12];
        o[i] = a0 * b[0] + a1 * b[1] + a2 * b[2] + a3 * b[3];
        o[i + 4] = a0 * b[4] + a1 * b[5] + a2 * b[6] + a3 * b[7];
        o[i + 8] = a0 * b[8] + a1 * b[9] + a2 * b[10] + a3 * b[11];
        o[i + 12] = a0 * b[12] + a1 * b[13] + a2 * b[14] + a3 * b[15];
      }
      return o;
    },
    persp(o, fovy, asp, n, f) {
      const t = 1 / Math.tan(fovy / 2);
      o.fill(0); o[0] = t / asp; o[5] = t; o[10] = (f + n) / (n - f); o[11] = -1; o[14] = 2 * f * n / (n - f);
      return o;
    },
    lookAt(o, e, c, up) {
      let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2];
      let l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l;
      let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
      l = Math.hypot(xx, xy, xz) || 1; xx /= l; xy /= l; xz /= l;
      const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
      o[0] = xx; o[1] = yx; o[2] = zx; o[3] = 0;
      o[4] = xy; o[5] = yy; o[6] = zy; o[7] = 0;
      o[8] = xz; o[9] = yz; o[10] = zz; o[11] = 0;
      o[12] = -(xx * e[0] + xy * e[1] + xz * e[2]);
      o[13] = -(yx * e[0] + yy * e[1] + yz * e[2]);
      o[14] = -(zx * e[0] + zy * e[1] + zz * e[2]);
      o[15] = 1;
      return o;
    }
  };
  E.M4 = M4;

  /* ---------------- 변환 스택 (모델 조립용) ---------------- */
  const T = { m: null, st: [], sp: 0 };
  for (let i = 0; i < 24; i++) T.st.push(new Float32Array(16));
  T.m = T.st[0];
  T.reset = function () { T.sp = 0; T.m = T.st[0]; M4.ident(T.m); return T; };
  T.push = function () { const n = T.st[T.sp + 1]; n.set(T.m); T.sp++; T.m = n; return T; };
  T.pop = function () { T.sp--; T.m = T.st[T.sp]; return T; };
  T.tr = function (x, y, z) {
    const m = T.m;
    m[12] += m[0] * x + m[4] * y + m[8] * z;
    m[13] += m[1] * x + m[5] * y + m[9] * z;
    m[14] += m[2] * x + m[6] * y + m[10] * z;
    return T;
  };
  T.ry = function (a) {
    if (!a) return T;
    const m = T.m, c = Math.cos(a), s = Math.sin(a);
    for (let i = 0; i < 3; i++) { const c0 = m[i], c2 = m[8 + i]; m[i] = c0 * c - c2 * s; m[8 + i] = c0 * s + c2 * c; }
    return T;
  };
  T.rx = function (a) {
    if (!a) return T;
    const m = T.m, c = Math.cos(a), s = Math.sin(a);
    for (let i = 0; i < 3; i++) { const c1 = m[4 + i], c2 = m[8 + i]; m[4 + i] = c1 * c + c2 * s; m[8 + i] = -c1 * s + c2 * c; }
    return T;
  };
  T.rz = function (a) {
    if (!a) return T;
    const m = T.m, c = Math.cos(a), s = Math.sin(a);
    for (let i = 0; i < 3; i++) { const c0 = m[i], c1 = m[4 + i]; m[i] = c0 * c + c1 * s; m[4 + i] = -c0 * s + c1 * c; }
    return T;
  };
  T.sc = function (x, y, z) {
    const m = T.m; if (y === undefined) { y = x; z = x; }
    for (let i = 0; i < 3; i++) { m[i] *= x; m[4 + i] *= y; m[8 + i] *= z; }
    return T;
  };
  E.T = T;

  /* ---------------- 색상 ---------------- */
  const colCache = {};
  E.col = function (c) {
    if (Array.isArray(c)) return c;
    let r = colCache[c];
    if (r) return r;
    let h = String(c).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16);
    r = [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    colCache[c] = r;
    return r;
  };

  /* ---------------- 지오메트리 ---------------- */
  function pushTri(arr, a, b, c) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    for (const p of [a, b, c]) arr.push(p[0], p[1], p[2], nx, ny, nz);
  }
  function geoCube() {
    const a = [], h = 0.5;
    const v = (x, y, z) => [x * h, y * h, z * h];
    const quad = (p0, p1, p2, p3) => { pushTri(a, p0, p1, p2); pushTri(a, p0, p2, p3); };
    quad(v(-1, -1, 1), v(1, -1, 1), v(1, 1, 1), v(-1, 1, 1));
    quad(v(1, -1, -1), v(-1, -1, -1), v(-1, 1, -1), v(1, 1, -1));
    quad(v(-1, 1, 1), v(1, 1, 1), v(1, 1, -1), v(-1, 1, -1));
    quad(v(-1, -1, -1), v(1, -1, -1), v(1, -1, 1), v(-1, -1, 1));
    quad(v(1, -1, 1), v(1, -1, -1), v(1, 1, -1), v(1, 1, 1));
    quad(v(-1, -1, -1), v(-1, -1, 1), v(-1, 1, 1), v(-1, 1, -1));
    return a;
  }
  function geoIco(sub) {
    const t = (1 + Math.sqrt(5)) / 2;
    let V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
    let F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    const norm = p => { const l = Math.hypot(p[0], p[1], p[2]); return [p[0] / l * 0.5, p[1] / l * 0.5, p[2] / l * 0.5]; };
    V = V.map(norm);
    for (let s = 0; s < sub; s++) {
      const F2 = [], cache = {};
      const mid = (i, j) => {
        const k = i < j ? i + '_' + j : j + '_' + i;
        if (cache[k] !== undefined) return cache[k];
        const a = V[i], b = V[j];
        V.push(norm([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]));
        return (cache[k] = V.length - 1);
      };
      for (const [a, b, c] of F) { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); F2.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); }
      F = F2;
    }
    const out = [];
    for (const [a, b, c] of F) {
      const A = V[a], B = V[b], C = V[c];
      const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      if (nx * (A[0] + B[0] + C[0]) + ny * (A[1] + B[1] + C[1]) + nz * (A[2] + B[2] + C[2]) < 0) pushTri(out, A, C, B);
      else pushTri(out, A, B, C);
    }
    return out;
  }
  function geoCyl(n, topR) {
    const a = [], tr = topR === undefined ? 0.5 : topR;
    for (let i = 0; i < n; i++) {
      const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2;
      const b0 = [Math.cos(a0) * 0.5, -0.5, Math.sin(a0) * 0.5], b1 = [Math.cos(a1) * 0.5, -0.5, Math.sin(a1) * 0.5];
      const t0 = [Math.cos(a0) * tr, 0.5, Math.sin(a0) * tr], t1 = [Math.cos(a1) * tr, 0.5, Math.sin(a1) * tr];
      if (tr > 0) { pushTri(a, b0, t1, b1); pushTri(a, b0, t0, t1); pushTri(a, [0, 0.5, 0], t1, t0); }
      else pushTri(a, b0, [0, 0.5, 0], b1);
      pushTri(a, [0, -0.5, 0], b0, b1);
    }
    return a;
  }
  function geoPlane() { const a = []; pushTri(a, [-0.5, 0, 0.5], [0.5, 0, 0.5], [0.5, 0, -0.5]); pushTri(a, [-0.5, 0, 0.5], [0.5, 0, -0.5], [-0.5, 0, -0.5]); return a; }
  function geoDisc(n, inner) {
    const a = [];
    for (let i = 0; i < n; i++) {
      const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2;
      const o0 = [Math.cos(a0) * 0.5, 0, Math.sin(a0) * 0.5], o1 = [Math.cos(a1) * 0.5, 0, Math.sin(a1) * 0.5];
      if (inner > 0) {
        const i0 = [Math.cos(a0) * inner, 0, Math.sin(a0) * inner], i1 = [Math.cos(a1) * inner, 0, Math.sin(a1) * inner];
        pushTri(a, i0, i1, o1); pushTri(a, i0, o1, o0);
      } else pushTri(a, [0, 0, 0], o1, o0);
    }
    return a;
  }

  /* ---------------- 셰이더 ---------------- */
  const VS = `#version 300 es
  layout(location=0) in vec3 aPos;
  layout(location=1) in vec3 aNor;
  layout(location=2) in vec4 m0;
  layout(location=3) in vec4 m1;
  layout(location=4) in vec4 m2;
  layout(location=5) in vec4 m3;
  layout(location=6) in vec4 aCol;
  layout(location=7) in float aEmi;
  uniform mat4 uVP;
  out vec3 vN; out vec3 vW; out vec4 vC; out float vE;
  void main(){
    mat4 M = mat4(m0,m1,m2,m3);
    vec4 w = M * vec4(aPos,1.0);
    vW = w.xyz; vN = mat3(M) * aNor; vC = aCol; vE = aEmi;
    gl_Position = uVP * w;
  }`;
  const FS = `#version 300 es
  precision mediump float;
  in vec3 vN; in vec3 vW; in vec4 vC; in float vE;
  uniform vec3 uL, uCam, uFog, uSky, uGround;
  uniform vec2 uFogR;
  uniform float uAmb;
  out vec4 o;
  void main(){
    vec3 n = normalize(vN);
    float d = dot(n, uL);
    float band = d > 0.5 ? 1.0 : (d > 0.08 ? 0.74 : 0.5);
    vec3 amb = mix(uGround, uSky, n.y*0.5+0.5) * uAmb;
    vec3 c = vC.rgb * (band * (1.0-uAmb*0.6) + amb);
    vec3 vd = normalize(uCam - vW);
    float rim = pow(1.0 - max(dot(n, vd), 0.0), 3.0);
    c += rim * 0.22 * uSky * band;
    c = mix(c, vC.rgb * 1.25, clamp(vE,0.0,1.0)) + vC.rgb * max(vE-1.0,0.0);
    float f = smoothstep(uFogR.x, uFogR.y, length(vW - uCam));
    c = mix(c, uFog, f * (1.0 - min(vE,1.0)*0.6));
    o = vec4(c, vC.a);
  }`;
  function sh(type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  function makeMesh(name, verts) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
    const ib = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, ib);
    gl.bufferData(gl.ARRAY_BUFFER, 4 * STRIDE * 64, gl.DYNAMIC_DRAW);
    for (let i = 0; i < 4; i++) {
      gl.enableVertexAttribArray(2 + i);
      gl.vertexAttribPointer(2 + i, 4, gl.FLOAT, false, STRIDE * 4, i * 16);
      gl.vertexAttribDivisor(2 + i, 1);
    }
    gl.enableVertexAttribArray(6); gl.vertexAttribPointer(6, 4, gl.FLOAT, false, STRIDE * 4, 64); gl.vertexAttribDivisor(6, 1);
    gl.enableVertexAttribArray(7); gl.vertexAttribPointer(7, 1, gl.FLOAT, false, STRIDE * 4, 80); gl.vertexAttribDivisor(7, 1);
    gl.bindVertexArray(null);
    const mk = () => ({ data: new Float32Array(STRIDE * 256), n: 0 });
    meshes[name] = { vao, ib, count: verts.length / 6, b: [mk(), mk(), mk()] };
  }

  E.init = function (canvas) {
    cv = canvas;
    try { gl = cv.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: false, powerPreference: 'high-performance' }); }
    catch (e) { gl = null; }
    if (!gl) return false;
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    for (const u of ['uVP', 'uL', 'uCam', 'uFog', 'uSky', 'uGround', 'uFogR', 'uAmb']) U[u] = gl.getUniformLocation(prog, u);
    makeMesh('cube', geoCube());
    makeMesh('ico', geoIco(1));
    makeMesh('ico0', geoIco(0));
    makeMesh('cyl', geoCyl(8));
    makeMesh('cyl12', geoCyl(12));
    makeMesh('cone', geoCyl(6, 0));
    makeMesh('plane', geoPlane());
    makeMesh('disc', geoDisc(14, 0));
    makeMesh('ring', geoDisc(20, 0.4));
    gl.enable(gl.CULL_FACE);
    E.resize();
    return true;
  };
  E.resize = function () {
    dpr = Math.min(window.devicePixelRatio || 1, E.dprCap);
    cssW = cv.clientWidth || 1; cssH = cv.clientHeight || 1;
    const w = Math.round(cssW * dpr), h = Math.round(cssH * dpr);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  };
  E.size = () => ({ w: cssW, h: cssH });

  /* ---------------- 그리기 큐 ---------------- */
  E.begin = function () { for (const k in meshes) { const b = meshes[k].b; b[0].n = b[1].n = b[2].n = 0; } };
  // pass: 0 불투명, 1 반투명, 2 발광(가산)
  E.draw = function (mesh, col, emi, alpha, pass) {
    const me = meshes[mesh]; if (!me) return;
    const p = pass !== undefined ? pass : (alpha !== undefined && alpha < 1 ? 1 : 0);
    const B = me.b[p];
    if ((B.n + 1) * STRIDE > B.data.length) { const nd = new Float32Array(B.data.length * 2); nd.set(B.data); B.data = nd; }
    const o = B.n * STRIDE, d = B.data, m = T.m;
    for (let i = 0; i < 16; i++) d[o + i] = m[i];
    const c = Array.isArray(col) ? col : E.col(col);
    d[o + 16] = c[0]; d[o + 17] = c[1]; d[o + 18] = c[2]; d[o + 19] = alpha === undefined ? 1 : alpha;
    d[o + 20] = emi || 0;
    B.n++;
  };
  // 자주 쓰는 형태: 위치/크기/회전 상자
  E.box = function (mesh, x, y, z, sx, sy, sz, ry, col, emi, alpha, pass) {
    T.reset().tr(x, y, z).ry(ry || 0).sc(sx, sy, sz);
    E.draw(mesh, col, emi, alpha, pass);
  };
  E.instanceCount = function () { let n = sn; for (const k in meshes) { const b = meshes[k].b; n += b[0].n + b[1].n + b[2].n; } return n; };

  E.render = function () {
    E.resize();
    gl.viewport(0, 0, cv.width, cv.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const c = E.cam;
    M4.persp(proj, c.fov * Math.PI / 180, cssW / cssH, 0.5, 400);
    M4.lookAt(view, c.pos, c.target, [0, 1, 0]);
    M4.mul(vp, proj, view);
    gl.useProgram(prog);
    gl.uniformMatrix4fv(U.uVP, false, vp);
    const L = E.env.light, ll = Math.hypot(L[0], L[1], L[2]);
    gl.uniform3f(U.uL, L[0] / ll, L[1] / ll, L[2] / ll);
    gl.uniform3fv(U.uCam, c.pos);
    gl.uniform3fv(U.uFog, E.env.fog);
    gl.uniform3fv(U.uSky, E.env.sky);
    gl.uniform3fv(U.uGround, E.env.ground);
    gl.uniform2f(U.uFogR, E.env.fogNear, E.env.fogFar);
    gl.uniform1f(U.uAmb, E.env.ambient);
    gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.disable(gl.BLEND);
    for (const k in meshes) drawB(meshes[k], 0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    for (const k in meshes) drawB(meshes[k], 1);
    drawSprites();
    gl.enable(gl.BLEND); gl.depthMask(false);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    for (const k in meshes) drawB(meshes[k], 2);
    gl.depthMask(true); gl.disable(gl.BLEND);
  };
  function drawB(me, p) {
    const B = me.b[p]; if (!B.n) return;
    gl.bindVertexArray(me.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, me.ib);
    gl.bufferData(gl.ARRAY_BUFFER, B.data.subarray(0, B.n * STRIDE), gl.DYNAMIC_DRAW);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, me.count, B.n);
  }

  // 3D 좌표 → 화면 좌표(CSS px)
  E.project = function (x, y, z) {
    const m = vp;
    const cx = m[0] * x + m[4] * y + m[8] * z + m[12];
    const cy = m[1] * x + m[5] * y + m[9] * z + m[13];
    const cw = m[3] * x + m[7] * y + m[11] * z + m[15];
    if (cw <= 0.01) return null;
    return { x: (cx / cw * 0.5 + 0.5) * cssW, y: (1 - (cy / cw * 0.5 + 0.5)) * cssH };
  };

  /* ---------------- 그림 캐릭터(스프라이트) ----------------
     카메라를 항상 바라보는 사각형에 그림을 붙여서 그림 (2.5D) */
  const SVS = `#version 300 es
  layout(location=0) in vec2 aC;
  layout(location=1) in vec4 iPos;   // xyz, rot
  layout(location=2) in vec4 iSize;  // w, h, anchorX, anchorY
  layout(location=3) in vec4 iUV;
  layout(location=4) in vec4 iTint;  // rgb 곱, a 투명도
  layout(location=5) in vec4 iAdd;   // rgb 더하기, w=좌우반전
  layout(location=6) in vec4 iAX;    // 월드 고정 사각형: 가로 축 (w=1이면 사용)
  layout(location=7) in vec4 iAY;    // 세로 축
  uniform mat4 uVP; uniform vec3 uRight, uUp;
  out vec2 vUV; out vec4 vT; out vec3 vA; out vec3 vW;
  void main(){
    vec2 l = vec2((aC.x - iSize.z) * iSize.x, (aC.y - iSize.w) * iSize.y);
    float c = cos(iPos.w), s = sin(iPos.w);
    l = vec2(l.x * c - l.y * s, l.x * s + l.y * c);
    vec3 w = iAX.w > 0.5 ? iPos.xyz + iAX.xyz * (aC.x - iSize.z) + iAY.xyz * (aC.y - iSize.w) : iPos.xyz + uRight * l.x + uUp * l.y;
    vW = w;
    float u = iAdd.w > 0.5 ? 1.0 - aC.x : aC.x;
    vUV = vec2(mix(iUV.x, iUV.z, u), mix(iUV.w, iUV.y, aC.y));
    vT = iTint; vA = iAdd.rgb;
    gl_Position = uVP * vec4(w, 1.0);
  }`;
  const SFS = `#version 300 es
  precision mediump float;
  in vec2 vUV; in vec4 vT; in vec3 vA; in vec3 vW;
  uniform sampler2D uTex; uniform vec3 uCam, uFog, uEnv; uniform vec2 uFogR;
  out vec4 o;
  void main(){
    vec4 t = texture(uTex, vUV);
    if (t.a < 0.01) discard;
    vec3 c = t.rgb * vT.rgb * uEnv + vA * t.a;
    float f = smoothstep(uFogR.x, uFogR.y, length(vW - uCam));
    c = mix(c, uFog * t.a, f);
    o = vec4(c, t.a) * vT.a;
  }`;
  const SST = 28;
  let sprog = null, svao = null, sib = null, stex = null;
  const SU = {};
  let sdata = new Float32Array(SST * 512), sn = 0, sdepth = new Float32Array(512), sorder = [];
  E.env.spriteTint = [1, 1, 1];
  function initSprites() {
    sprog = gl.createProgram();
    gl.attachShader(sprog, sh(gl.VERTEX_SHADER, SVS)); gl.attachShader(sprog, sh(gl.FRAGMENT_SHADER, SFS)); gl.linkProgram(sprog);
    if (!gl.getProgramParameter(sprog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(sprog));
    for (const u of ['uVP', 'uRight', 'uUp', 'uTex', 'uCam', 'uFog', 'uEnv', 'uFogR']) SU[u] = gl.getUniformLocation(sprog, u);
    svao = gl.createVertexArray(); gl.bindVertexArray(svao);
    const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
    sib = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, sib); gl.bufferData(gl.ARRAY_BUFFER, SST * 4 * 64, gl.DYNAMIC_DRAW);
    for (let i = 0; i < 7; i++) { gl.enableVertexAttribArray(1 + i); gl.vertexAttribPointer(1 + i, 4, gl.FLOAT, false, SST * 4, i * 16); gl.vertexAttribDivisor(1 + i, 1); }
    gl.bindVertexArray(null);
  }
  E.setSpriteTexture = function (canvas) {
    if (!sprog) initSprites();
    stex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, stex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  };
  // frame: DX.SPR.frames 항목, w/h: 월드 크기, rot: 화면상 회전, ax/ay: 기준점(0.5,0 = 발밑), tint [r,g,b,a], add [r,g,b], flip
  E.sprite = function (frame, x, y, z, w, h, rot, ax, ay, tint, add, flip) {
    if (!frame) return;
    if ((sn + 1) * SST > sdata.length) { const nd = new Float32Array(sdata.length * 2); nd.set(sdata); sdata = nd; sdepth = new Float32Array(sdata.length / SST); }
    const o = sn * SST, d = sdata;
    d[o] = x; d[o + 1] = y; d[o + 2] = z; d[o + 3] = rot || 0;
    d[o + 4] = w; d[o + 5] = h; d[o + 6] = ax === undefined ? 0.5 : ax; d[o + 7] = ay === undefined ? 0 : ay;
    d[o + 8] = frame.u0; d[o + 9] = frame.v0; d[o + 10] = frame.u1; d[o + 11] = frame.v1;
    d[o + 12] = tint ? tint[0] : 1; d[o + 13] = tint ? tint[1] : 1; d[o + 14] = tint ? tint[2] : 1; d[o + 15] = tint && tint[3] !== undefined ? tint[3] : 1;
    d[o + 16] = add ? add[0] : 0; d[o + 17] = add ? add[1] : 0; d[o + 18] = add ? add[2] : 0; d[o + 19] = flip ? 1 : 0;
    for (let k = 20; k < 28; k++) d[o + k] = 0;
    sn++;
  };
  // 월드에 고정된 그림 사각형 (열차 지붕/옆면 등). ax, ay = 가로/세로 축 벡터(크기 포함), bias = 정렬 보정(클수록 먼저 그림)
  E.quad = function (frame, x, y, z, ax, ay, anx, any, tint, add, flip, bias) {
    E.sprite(frame, x, y, z, 1, 1, 0, anx, any, tint, add, flip);
    const o = (sn - 1) * SST, d = sdata;
    d[o + 20] = ax[0]; d[o + 21] = ax[1]; d[o + 22] = ax[2]; d[o + 23] = 1;
    d[o + 24] = ay[0]; d[o + 25] = ay[1]; d[o + 26] = ay[2]; d[o + 27] = bias || 0;
  };
  function drawSprites() {
    if (!sn || !stex) { sn = 0; return; }
    const c = E.cam.pos;
    sorder.length = sn;
    for (let i = 0; i < sn; i++) { const o = i * SST, dx = sdata[o] - c[0], dy = sdata[o + 1] - c[1], dz = sdata[o + 2] - c[2]; sdepth[i] = Math.sqrt(dx * dx + dy * dy + dz * dz) + sdata[o + 27]; sorder[i] = i; }
    sorder.sort((a, b) => sdepth[b] - sdepth[a]);
    const sorted = new Float32Array(sn * SST);
    for (let i = 0; i < sn; i++) sorted.set(sdata.subarray(sorder[i] * SST, sorder[i] * SST + SST), i * SST);
    // 카메라 오른쪽/위 방향
    const right = [view[0], view[4], view[8]], up = [view[1], view[5], view[9]];
    gl.useProgram(sprog);
    gl.uniformMatrix4fv(SU.uVP, false, vp);
    gl.uniform3fv(SU.uRight, right); gl.uniform3fv(SU.uUp, up);
    gl.uniform3fv(SU.uCam, c); gl.uniform3fv(SU.uFog, E.env.fog); gl.uniform3fv(SU.uEnv, E.env.spriteTint);
    gl.uniform2f(SU.uFogR, E.env.fogNear, E.env.fogFar);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, stex); gl.uniform1i(SU.uTex, 0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); gl.disable(gl.CULL_FACE);
    gl.bindVertexArray(svao); gl.bindBuffer(gl.ARRAY_BUFFER, sib);
    gl.bufferData(gl.ARRAY_BUFFER, sorted, gl.DYNAMIC_DRAW);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, sn);
    gl.enable(gl.CULL_FACE);
    sn = 0;
    gl.useProgram(prog);
  }

  DX.E = E;
})(window.DX);
