/* 그림판 굽기: node _dev/bake.js  (playwright + 크롬 필요)
   게임을 '굽기 모드'로 열어 흰 배경 지우기·자르기·판 만들기를 한 뒤 assets/baked/ 에 webp 로 저장.
   그림을 바꾸면 config.js 의 game.artVersion 을 올리고 다시 실행
   v0.19: 크롬에서 무손실 PNG 로 받은 뒤 sharp(libwebp, effort 6)로 압축 → 같은 화질에 더 작게.
   환경변수 Q(그림 화질, 기본 72) AQ(투명 가장자리 화질, 기본 70) */
const path = require('path'), fs = require('fs'), http = require('http');
const PW = process.env.PW || '/opt/npm-tools/node_modules/playwright';
const { chromium } = require(PW);
const root = path.resolve(__dirname, '..'), out = path.join(root, 'assets', 'baked');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.json': 'application/json', '.woff': 'font/woff' };
const srv = http.createServer((q, r) => { let f = path.join(root, decodeURIComponent(q.url.split('?')[0].split('#')[0])); if (f.endsWith(path.sep)) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(8799);
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('http://localhost:8799/?bake=1&q=' + (process.env.Q || '0.75') + '#');
  await p.waitForFunction(() => window.DX && DX.SPR && DX.SPR.ready && DX.SPR._pageCanvas, null, { timeout: 600000 });
  const r = await p.evaluate(() => DX.SPR.exportBake(1, 'image/png'));
  fs.mkdirSync(out, { recursive: true });
  const sharp = require(process.env.SHARP || '/opt/npm-tools/node_modules/sharp');
  const Q = +(process.env.Q || 72), AQ = +(process.env.AQ || 70);
  const w = async (name, url, q) => { if (!url) return; const png = Buffer.from(url.split(',')[1], 'base64');
    const buf = await sharp(png).webp({ quality: q, alphaQuality: AQ, effort: 6, smartSubsample: true }).toBuffer();
    fs.writeFileSync(path.join(out, name), buf); console.log(name, (buf.length / 1e6).toFixed(2) + 'MB'); };
  for (const f of fs.readdirSync(out)) if (/^[gt]_.*\.webp$/.test(f)) fs.unlinkSync(path.join(out, f));
  let sl = 0; for (const n in (r.slots || {})) { const png = Buffer.from(r.slots[n].split(',')[1], 'base64'); const buf = await sharp(png).webp({ quality: n[0] === 'g' ? Q - 2 : Q, alphaQuality: AQ, effort: 6, smartSubsample: true }).toBuffer(); fs.writeFileSync(path.join(out, n), buf); sl += buf.length; }
  console.log('따로 파일', Object.keys(r.slots || {}).length + '개', (sl / 1e6).toFixed(2) + 'MB');
  await w('atlas0.webp', r.atlas0, Q); await w('atlas1.webp', r.atlas1, Q); await w('fight.webp', r.fight, Q - 4);
  if (!r.atlas1) try { fs.unlinkSync(path.join(out, 'atlas1.webp')); } catch (e) {}
  fs.writeFileSync(path.join(out, 'meta.json'), r.meta); console.log('meta.json', (r.meta.length / 1e3).toFixed(0) + 'KB');
  await b.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
