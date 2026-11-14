#!/usr/bin/env python3
"""용량 줄이기: assets 안 png/jpg 옆에 같은 이름 .webp 를 만들고 assets/webp.js 목록을 씀.
게임은 목록에 있으면 webp 를 받음 (원본은 그대로 → 굽기·그림 넣기에 계속 사용). 그림을 바꾸면 다시 실행.
사용: python3 _dev/webp.py"""
import os, json
from PIL import Image
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
A = os.path.join(ROOT, 'assets')
SKIP = ('baked', 'font', 'music')
done, saved = [], 0
for root, dirs, files in os.walk(A):
    if os.path.relpath(root, A).split(os.sep)[0] in SKIP: continue
    for f in files:
        ext = os.path.splitext(f)[1].lower()
        if ext not in ('.png', '.jpg', '.jpeg'): continue
        src = os.path.join(root, f); dst = os.path.splitext(src)[0] + '.webp'
        rel = os.path.relpath(src, ROOT).replace(os.sep, '/')
        if 'app_icon' in f or f in ('share.jpg',): continue   # 앱 아이콘·공유 그림은 원본 형식 필요
        if not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src):
            im = Image.open(src)
            if im.mode == 'P': im = im.convert('RGBA')
            if ext == '.png':
                im.save(dst, 'WEBP', quality=88, alpha_quality=90, method=6)
            else:
                im.convert('RGB').save(dst, 'WEBP', quality=78, method=6)
        a, b = os.path.getsize(src), os.path.getsize(dst)
        if b < a * 0.9: done.append(rel); saved += a - b
        else: os.remove(dst)
done.sort()
js = """/* 자동 생성 (_dev/webp.py): webp 로 바꿔 받는 그림 목록 */
window.DX = window.DX || {};
(function (DX) {
  var old = /OS (1[0-3])_/.test(navigator.userAgent) || /bake=1/.test(location.search);   // iOS 13 이하는 webp 못 읽음, 굽기 때는 원본
  DX.WEBP = new Set(old ? [] : %s);
  DX.img = function (u) {
    if (!u || typeof u !== 'string' || !DX.WEBP.size) return u;
    var q = u.indexOf('?'), p = q < 0 ? u : u.slice(0, q);
    if (p.indexOf('../') === 0) p = p.slice(3);
    return DX.WEBP.has(p) ? u.replace(/\\.(png|jpe?g)(\\?|$)/i, '.webp$2') : u;
  };
  (function walk(o) { for (var k in o) { var v = o[k]; if (typeof v === 'string') o[k] = DX.img(v); else if (v && typeof v === 'object') walk(v); } })(DX.CONFIG || {});
})(window.DX);
""" % json.dumps(done, ensure_ascii=False)
open(os.path.join(A, 'webp.js'), 'w', encoding='utf-8').write(js)
# CSS 안의 그림 주소도 webp 로
cssp = os.path.join(ROOT, 'css', 'style.css'); css = open(cssp, encoding='utf-8').read()
import re
def rep(m):
    u = m.group(1); p = u[3:] if u.startswith('../') else u
    return 'url(' + (re.sub(r'\.(png|jpe?g)$', '.webp', u) if p in done else u) + ')'
css2 = re.sub(r'url\(([^)"\']+\.(?:png|jpe?g))\)', rep, css)
if css2 != css: open(cssp, 'w', encoding='utf-8').write(css2)
print('webp', len(done), '개, 줄어든 용량', round(saved / 1e6, 1), 'MB')
