"""초상화 시트를 잘라 portraits/<id>.webp 로 저장한다.
usage: python3 tools/slice_portraits.py <시트 이미지> <시트 번호> [칸 수=4]
"""
import json, os, sys
from PIL import Image
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
img_path, sheet = sys.argv[1], sys.argv[2]
n = int(sys.argv[3]) if len(sys.argv) > 3 else 4
ids = json.load(open(os.path.join(root, 'data', 'portrait_sheets.json'), encoding='utf8'))[sheet]
im = Image.open(img_path).convert('RGB'); W, H = im.size
cw, ch = W / n, H / n; m = 0.025  # 칸 사이 선을 피하려고 가장자리를 조금 잘라 낸다
out = os.path.join(root, 'portraits'); os.makedirs(out, exist_ok=True)
for i, pid in enumerate(ids):
    r, c = divmod(i, n)
    box = (round(c*cw + cw*m), round(r*ch + ch*m), round((c+1)*cw - cw*m), round((r+1)*ch - ch*m))
    cell = im.crop(box); s = min(cell.size); cell = cell.crop((0, 0, s, s)).resize((min(256, s), min(256, s)), Image.LANCZOS)
    cell.save(os.path.join(out, pid + '.webp'), 'WEBP', quality=82, method=6)
print(f'시트 {sheet}: {len(ids)}명 저장 ({W}x{H})')
