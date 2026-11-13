#!/usr/bin/env python3
"""그림 넣기 도우미 — 받은 그림 폴더를 통째로 넣으면 파일 이름을 보고 게임 자리에 알아서 넣음

사용: python3 _dev/import_art.py <받은그림폴더> [게임폴더=doomsday]
  - 파일 이름은 '그림 프롬프트 전체' 목록 그대로 (jack_side_run.png, ch4_ground.png, cutin_ceo.png ...)
  - 4포즈 가로 그림은 4장으로 자르고, 얼굴 12개·소품 6개는 칸대로 자름
  - 효과(fx_*)는 검은 배경을 투명으로 바꿈
  - 좀비·보스 동작은 config.js 의 anim 높이 비율도 다시 계산
  - 모르는 이름은 '건너뜀' 목록으로 알려 줌 (이름만 고쳐서 다시 실행)
"""
import os, re, sys, json
import numpy as np
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else '.'
GAME = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
A = lambda *p: os.path.join(GAME, 'assets', *p)

SKIN_ID = {'배달원': 'delivery', '정장 히어로': 'suit', '정장히어로': 'suit', '산타': 'santa', '소방관': 'fire', '셰프': 'chef', '닌자': 'ninja',
           '해커 후드': 'hacker', '해커후드': 'hacker', '아이돌': 'idol', '우주복': 'space'}
CH_STAGE = {1: 'desert', 2: 'rest', 3: 'city', 4: 'neon', 5: 'bridge', 6: 'snow', 7: 'tunnel', 8: 'lab'}
CITIZEN = {'man': 'man', 'woman': 'woman', 'kid': 'clerk', 'elder': 'cleaner'}

done, skipped, anim_touched = [], [], set()


def mask_of(im, dark_bg=False):
    a = np.asarray(im.convert('RGB')).astype(np.int16)
    if dark_bg:
        return a.max(axis=2) > 40
    return a.min(axis=2) < 232


def runs(v, gap):
    """1차원 마스크에서 gap 이상 떨어진 덩어리 [시작, 끝) 목록"""
    idx = np.where(v)[0]
    if not len(idx):
        return []
    out, s, p = [], idx[0], idx[0]
    for i in idx[1:]:
        if i - p > gap:
            out.append([s, p + 1]); s = i
        p = i
    out.append([s, p + 1])
    return out


def to_n(rs, n, total):
    """덩어리를 정확히 n개로: 많으면 가장 가까운 것끼리 합치고, 적으면 같은 폭으로 자름"""
    rs = [r[:] for r in rs]
    while len(rs) > n:
        gaps = [rs[i + 1][0] - rs[i][1] for i in range(len(rs) - 1)]
        # 작은 조각은 가까운 이웃에 붙임
        k = int(np.argmin(gaps)); rs[k] = [rs[k][0], rs[k + 1][1]]; del rs[k + 1]
    if len(rs) < n:
        lo, hi = (rs[0][0], rs[-1][1]) if rs else (0, total)
        w = (hi - lo) / n
        rs = [[int(lo + i * w), int(lo + (i + 1) * w)] for i in range(n)]
    return rs


def crop_box(im, m, x0, x1, y0, y1, pad=8):
    sub = m[y0:y1, x0:x1]
    ys = np.where(sub.any(axis=1))[0]; xs = np.where(sub.any(axis=0))[0]
    if not len(ys):
        return im.crop((x0, y0, x1, y1))
    W, H = im.size
    return im.crop((max(0, x0 + xs[0] - pad), max(0, y0 + ys[0] - pad), min(W, x0 + xs[-1] + 1 + pad), min(H, y0 + ys[-1] + 1 + pad)))


def split_row(im, n, dark_bg=False):
    m = mask_of(im, dark_bg)
    rs = to_n(runs(m.any(axis=0), 10), n, im.size[0])
    return [crop_box(im, m, a, b, 0, im.size[1]) for a, b in rs]


def split_grid(im, rows, cols):
    m = mask_of(im)
    rr = to_n(runs(m.any(axis=1), 10), rows, im.size[1])
    out = []
    for y0, y1 in rr:
        cs = to_n(runs(m[y0:y1].any(axis=0), 10), cols, im.size[0])
        out += [crop_box(im, m, a, b, y0, y1) for a, b in cs]
    return out


def black_to_alpha(im):
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    lum = a.max(axis=2)
    alpha = np.clip((lum - 18) / 90, 0, 1)
    rgb = np.clip(a / np.maximum(alpha[..., None], 0.05), 0, 255)
    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')


def save(im, path, jpg=False, maxw=None):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if maxw and im.size[0] > maxw:
        im = im.resize((maxw, round(im.size[1] * maxw / im.size[0])), Image.LANCZOS)
    if jpg:
        im.convert('RGB').save(path, quality=88)
    else:
        im.save(path)
    done.append(os.path.relpath(path, GAME))


def handle(name, im):
    n = name.lower()
    m = re.match(r'^(jack|minho|sophie)_(top|side)_(idle|shoot|move|react|run|attack|defend|carry|cheer)$', n)
    if m:
        for i, p in enumerate(split_row(im, 4)):
            save(p, A('chars', m[1], f'{m[2]}_{m[3]}_{i}.png'))
        return True
    m = re.match(r'^(office|box|dancer|riot|bomber)_(walk|act)$', n)
    if m:
        pre = 'w' if m[2] == 'walk' else 'a'
        for i, p in enumerate(split_row(im, 4)):
            save(p, A('chars', 'anim', f'{m[1]}_{pre}{i}.png'))
        anim_touched.add(m[1]); return True
    m = re.match(r'^(bujang|isa|ceo)_act$', n)
    if m:
        for i, p in enumerate(split_row(im, 4)):
            save(p, A('chars', 'anim', f'{m[1]}_a{i}.png'))
        anim_touched.add(m[1]); return True
    m = re.match(r'^(bujang|isa|ceo)_full$', n)
    if m:
        save(im, A('chars', f'{m[1]}_full.png')); return True
    if n == 'citizens_faces':
        for i, p in enumerate(split_grid(im, 3, 4)):
            save(p.resize((200, 200)) if p.size[0] > 10 else p, A('npc', f'face_{i}.png'))
        return True
    m = re.match(r'^citizen_(man|woman|kid|elder)$', n)
    if m:
        for i, p in enumerate(split_row(im, 4)):
            save(p, A('npc', f'citizen_{CITIZEN[m[1]]}_{i}.png'))
        return True
    if n in ('dog_yageun', 'dog'):
        for i, p in enumerate(split_row(im, 4)):
            save(p, A('npc', f'dog_{i}.png'))
        return True
    m = re.match(r'^car_(safe|water|freeze|fan)_(top|side)$', n)
    if m:
        save(im, A('train', f'car_{m[1]}_{m[2]}.png')); return True
    m = re.match(r'^ch([1-8])_(ground|far|props|side|thumb)$', n)
    if m:
        c, k = m[1], m[2]
        if k == 'ground': save(im, A('ground', f'ch{c}.jpg'), jpg=True, maxw=1024)
        elif k == 'far': save(im, A('sky', f'ch{c}.jpg'), jpg=True, maxw=2048)
        elif k == 'side': save(im, A('story', f'ch{c}_side.jpg'), jpg=True, maxw=1600)
        elif k == 'thumb': save(im, A('stages', f'ch{c}_thumb.jpg'), jpg=True, maxw=900)
        else:
            for i, p in enumerate(split_grid(im, 2, 3)):
                save(p, A('props', f'ch{c}_p{i + 1}.png'))
        return True
    if n == 'lobby_bg':
        save(im, A('ui', 'lobby_bg.jpg'), jpg=True, maxw=1080); return True
    m = re.match(r'^comic_ch([1-8])$', n)
    if m:
        save(im, A('story', f'comic_ch{m[1]}.jpg'), jpg=True, maxw=1800); return True
    m = re.match(r'^cutin_(\w+)$', n)
    if m:
        save(im, A('ui', f'cutin_{m[1]}.jpg'), jpg=True, maxw=1600); return True
    m = re.match(r'^fx_(water|tornado|freeze|steam)$', n)
    if m:
        ps = split_row(im, 4, dark_bg=True)
        for i, p in enumerate(ps):
            save(black_to_alpha(p), A('fx', f'{m[1]}_{i}.png'))
        save(black_to_alpha(ps[2]), A('fx', f'{m[1]}.png'))   # 게임은 3번째 단계를 기본으로 씀
        return True
    m = re.match(r'^icon_(water|ice|wind)$', n)
    if m:
        save(im, A('icons', f'w_{m[1]}.png')); return True
    m = re.match(r'^skin_train_(\w+)_(top|side)$', n)
    if m:
        save(im, A('train', 'skins', f'{m[1]}_{m[2]}.png')); return True
    m = re.match(r'^skin_(jack|minho|sophie)_(.+?)_(top_(?:idle|shoot|move|react)|portrait)$', name, re.I)
    if m:
        sid = SKIN_ID.get(m[2].strip(), re.sub(r'\W+', '', m[2]).lower())
        if m[3].lower() == 'portrait':
            save(im, A('portraits', f'skin_{m[1].lower()}_{sid}.png'))
        else:
            for i, p in enumerate(split_row(im, 4)):
                save(p, A('chars', 'skins', f'{m[1].lower()}_{sid}', f'{m[3].lower()}_{i}.png'))
        return True
    return False


def height_of(path):
    im = Image.open(path); m = mask_of(im)
    ys = np.where(m.any(axis=1))[0]
    return (ys[-1] - ys[0] + 1) if len(ys) else im.size[1]


def update_anim():
    cfg = os.path.join(GAME, 'js', 'config.js')
    src = open(cfg, encoding='utf-8').read()
    m = re.search(r'\n  anim: (\{.*\}),\n', src)
    if not m:
        return
    js = re.sub(r'(\w+):', r'"\1":', m[1])
    data = json.loads(js)
    for nm in sorted(anim_touched):
        keys = ['w0', 'w1', 'w2', 'w3', 'a0', 'a1', 'a2', 'a3']
        hs = {k: height_of(A('chars', 'anim', f'{nm}_{k}.png')) for k in keys if os.path.exists(A('chars', 'anim', f'{nm}_{k}.png'))}
        base = hs.get('w0') or hs.get('a0')
        if not base:
            continue
        data[nm] = {k: round(v / base, 3) for k, v in hs.items()}
    line = '{' + ', '.join(f'{k}: {{' + ', '.join(f'{a}: {b}' for a, b in v.items()) + '}' for k, v in data.items()) + '}'
    src = src[:m.start(1)] + line + src[m.end(1):]
    open(cfg, 'w', encoding='utf-8').write(src)
    print('config.js anim 높이 비율 갱신:', ', '.join(sorted(anim_touched)))


def main():
    files = []
    for root, _, fs in os.walk(SRC):
        for f in fs:
            if os.path.splitext(f)[1].lower() in ('.png', '.jpg', '.jpeg', '.webp'):
                files.append(os.path.join(root, f))
    for f in sorted(files):
        name = os.path.splitext(os.path.basename(f))[0].strip()
        try:
            im = Image.open(f); im.load()
            if not handle(name, im.convert('RGBA') if im.mode == 'P' else im):
                skipped.append(os.path.basename(f))
        except Exception as e:
            skipped.append(f'{os.path.basename(f)} (오류: {e})')
    if anim_touched:
        update_anim()
    print(f'넣은 파일 {len(done)}개')
    for d in done:
        print('  +', d)
    if skipped:
        print(f'건너뜀 {len(skipped)}개 (이름 확인):')
        for s in skipped:
            print('  -', s)


if __name__ == '__main__':
    main()
