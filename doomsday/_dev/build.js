/* 배포용 묶기: node _dev/build.js
   js 파일 12개 → js/all.min.js 1개 (압축), css/style.css → css/style.min.css, 빌드 번호(?v=) 자동 갱신.
   ★ js·css 를 고친 뒤 올리기 전에 꼭 실행. (그림 추가 시 순서: webp.py → bake.js → build.js)
   주소 뒤 ?src=1 을 붙이면 원본 파일들을 그대로 씀 (고치는 중 확인용) */
const fs = require('fs'), path = require('path');
const esbuild = require(process.env.ESBUILD || '/opt/npm-tools/node_modules/esbuild');
const root = path.resolve(__dirname, '..');
const SRC = ['js/config.js', 'assets/webp.js', 'js/i18n.js', 'js/platform.js', 'js/engine.js', 'js/models.js', 'js/sprites.js', 'js/fight.js', 'js/mini.js', 'js/game.js', 'js/ui.js'];
const rd = f => fs.readFileSync(path.join(root, f), 'utf8'), wr = (f, s) => fs.writeFileSync(path.join(root, f), s);

// 빌드 번호 = 한국 시간 MMDD-HHMM
const k = new Date(Date.now() + 9 * 3600e3), p2 = n => String(n).padStart(2, '0');
const BUILD = process.env.BUILD || p2(k.getUTCMonth() + 1) + p2(k.getUTCDate()) + '-' + p2(k.getUTCHours()) + p2(k.getUTCMinutes());
wr('js/platform.js', rd('js/platform.js').replace(/DX\.BUILD = '[^']*'/, "DX.BUILD = '" + BUILD + "'"));

let code = '';
for (const f of SRC) code += '/* ' + f + ' */\n' + rd(f) + '\n;\n';
const js = esbuild.transformSync(code, { minify: true, charset: 'utf8', legalComments: 'none', target: 'es2017' }).code;
wr('js/all.min.js', js);
const css = esbuild.transformSync(rd('css/style.css'), { loader: 'css', minify: true, charset: 'utf8' }).code;
wr('css/style.min.css', css);

let html = rd('index.html');
const loader = '<!-- build:js 배포판 = js/all.min.js 한 파일 (node _dev/build.js). 주소 뒤 ?src=1 이면 원본 파일들 -->\n' +
  '<script>(function(){var v=\'' + BUILD + '\',L=/[?&]src=1/.test(location.search)?' + JSON.stringify(SRC) + ':[\'js/all.min.js\'];' +
  'for(var i=0;i<L.length;i++)document.write(\'<script src="\'+L[i]+\'?v=\'+v+\'"><\\/script>\');})();</script>\n<!-- /build:js -->';
if (/<!-- build:js[\s\S]*?<!-- \/build:js -->/.test(html)) html = html.replace(/<!-- build:js[\s\S]*?<!-- \/build:js -->/, loader);
else {   // 처음: 낱개 <script> 줄들을 묶음 로더로 바꿈
  const re = /(<script src="(?:js|assets)\/[^"]+\.js\?v=[^"]*"><\/script>\s*)+/;
  if (!re.test(html)) throw new Error('index.html 에서 script 줄을 못 찾음');
  html = html.replace(re, loader + '\n');
}
html = html.replace(/href="css\/style(?:\.min)?\.css\?v=[^"]*"/, 'href="css/style.min.css?v=' + BUILD + '"');
wr('index.html', html);
const kb = n => (n / 1024).toFixed(0) + 'KB';
console.log('build', BUILD, '| js', kb(code.length), '→', kb(Buffer.byteLength(js)), '| css', kb(rd('css/style.css').length), '→', kb(Buffer.byteLength(css)));
