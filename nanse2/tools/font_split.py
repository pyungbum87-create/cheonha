# 글꼴 나누기(unicode-range 분할): 게임 글에 쓰는 글자 묶음(core)은 먼저, 나머지(ext)는 그 글자가 화면에 나올 때만 받는다.
# usage: python3 tools/font_split.py  (src/min.html을 만든 뒤. rebuild.sh가 자동으로 부른다)
import os, re
from fontTools.ttLib import TTFont
from fontTools import subset
R = os.path.join(os.path.dirname(__file__), '..')
s = open(os.path.join(R, 'src/min.html'), encoding='utf8').read()
used = set(ord(ch) for ch in s) | set(range(0x20, 0x7f))
def rng(cps):
    cps = sorted(cps); out = []; a = b = cps[0]
    for c in cps[1:]:
        if c == b + 1: b = c
        else: out.append((a, b)); a = b = c
    out.append((a, b)); return ','.join(f'U+{a:X}' if a == b else f'U+{a:X}-{b:X}' for a, b in out)
css = []
for src, fam, w in [('pretendard.woff2', 'Pretendard', '100 900'), ('gowunbatang-b.woff2', 'Gowun Batang', '400 900')]:
    full = os.path.join(R, 'fonts', src); have = set(TTFont(full).getBestCmap())
    core, ext = sorted(have & used), sorted(have - used)
    for part, cps in (('core', core), ('ext', ext)):
        o = subset.Options(); o.flavor = 'woff2'; o.layout_features = ['*']; o.name_IDs = ['*']; o.notdef_outline = True
        f = TTFont(full); sub = subset.Subsetter(o); sub.populate(unicodes=cps); sub.subset(f)
        out = os.path.join(R, 'fonts', src.replace('.woff2', f'.{part}.woff2')); f.flavor = 'woff2'; f.save(out)
        css.append(f'@font-face{{font-family:"{fam}";src:url(fonts/{os.path.basename(out)}) format("woff2");font-weight:{w};font-display:swap;unicode-range:{rng(cps)}}}')
        print(part, src, len(cps), round(os.path.getsize(out)/1024), 'KB')
open(os.path.join(R, 'src/fonts.css'), 'w', encoding='utf8').write('\n'.join(css))
# min.html에 나눈 글꼴을 넣는다(원래 한 덩어리 @font-face 두 줄을 바꿔치기), 첫 화면 글꼴만 미리 받기, 한국어 표시
import re as _re
p = os.path.join(R, 'src/min.html'); h = open(p, encoding='utf8').read()
h2 = _re.sub(r'@font-face\{font-family:"?Pretendard"?;src:url\(fonts/pretendard\.woff2\)[^}]*\}', lambda m: '\n'.join(c for c in css if 'Pretendard' in c), h)
h2 = _re.sub(r'@font-face\{font-family:"?Gowun Batang"?;src:url\(fonts/gowunbatang-b\.woff2\)[^}]*\}', lambda m: '\n'.join(c for c in css if 'Gowun' in c), h2)
h2 = h2.replace('href="fonts/pretendard.woff2" as="font"', 'href="fonts/pretendard.core.woff2" as="font"')
if '<html>' in h2: h2 = h2.replace('<html>', '<html lang="ko">', 1)
assert h2.count('unicode-range') == 4, '글꼴 바꿔치기 실패'
open(p, 'w', encoding='utf8').write(h2); print('min.html 글꼴 분할 적용')
