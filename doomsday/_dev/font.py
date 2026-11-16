#!/usr/bin/env python3
"""제목 글꼴 만들기: python3 _dev/font.py
게임 글(js, html, css)에 나오는 글자만 골라 3개 파일로 나눔 → 화면에 나오는 글자의 파일만 받음.
  assets/font/dx_base.woff  영문·숫자·기호
  assets/font/dx_ko.woff    한글 (Noto Sans CJK KR Black)
  assets/font/dx_zh.woff    한자 (Noto Sans CJK SC Black → 중국어 간체 모양)
새 글을 넣었는데 제목 글자가 다른 모양으로 나오면 다시 실행.
"""
import glob, os, re, sys
from fontTools.ttLib import TTFont, TTCollection
from fontTools import subset

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TTC = os.environ.get('TTC', '/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc')

def is_han(c): return 0x3400 <= c <= 0x4DBF or 0x4E00 <= c <= 0x9FFF or 0xF900 <= c <= 0xFAFF
def is_ko(c): return 0xAC00 <= c <= 0xD7A3 or 0x1100 <= c <= 0x11FF or 0x3130 <= c <= 0x318F

text = ''
for pat in ['index.html', 'js/*.js', 'css/*.css']:
    for p in glob.glob(os.path.join(ROOT, pat)):
        text += open(p, encoding='utf-8').read()
chars = set(ord(ch) for ch in text if ord(ch) >= 32)
chars |= set(range(0x20, 0x7F)) | {0x2026, 0x00B7, 0x3001, 0x3002, 0xFF01, 0xFF0C, 0xFF1F, 0xFF1A}

col = TTCollection(TTC)
pick = {'ko': 1, 'zh': 2, 'base': 1}   # 0 JP / 1 KR / 2 SC
groups = {'ko': [c for c in chars if is_ko(c)], 'zh': [c for c in chars if is_han(c)], 'base': [c for c in chars if not is_ko(c) and not is_han(c)]}
for k, cs in groups.items():
    f = col.fonts[pick[k]]
    cmap = f.getBestCmap(); cs = [c for c in cs if c in cmap]
    o = subset.Options(); o.flavor = 'woff'; o.hinting = False; o.notdef_outline = True
    s = subset.Subsetter(o); s.populate(unicodes=cs); s.subset(f)
    out = os.path.join(ROOT, 'assets', 'font', 'dx_' + k + '.woff')
    f.flavor = 'woff'; f.save(out)
    print(k, len(cs), '글자', os.path.getsize(out) // 1024, 'KB')
    col = TTCollection(TTC)   # subset 이 글꼴을 바꾸므로 다시 열기
