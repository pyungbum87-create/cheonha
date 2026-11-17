#!/usr/bin/env python3
"""배경 지우기: 단색 배경(흰색·회색·검정 상관없음) 위 그림을 투명 PNG로.
  python3 tools/cutout.py 입력.png 출력.png [x y w h]
가장자리와 이어진 배경만 지우므로 그림 안쪽의 어두운 부분은 남는다. 빛 번짐은 반투명으로 살린다."""
import sys, numpy as np
from PIL import Image
from scipy import ndimage
def cutout(im, box=None, thr=26, soft=70, pad=6):
    if box: x, y, w, h = box; im = im.crop((x, y, x + w, y + h))
    a = np.array(im.convert('RGB')).astype(float)
    edge = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]]); bg = np.median(edge, 0)
    d = np.sqrt(((a - bg) ** 2).sum(2))
    near = d < thr
    lab, _ = ndimage.label(near); border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bgmask = np.isin(lab, list(border))
    bgmask = ndimage.binary_opening(bgmask, iterations=1)
    alpha = np.ones(d.shape)
    # 배경 근처의 빛 번짐은 거리만큼 반투명
    far = ndimage.distance_transform_edt(bgmask)
    band = ndimage.distance_transform_edt(~bgmask) <= 5
    glowzone = (~bgmask) & (d < soft) & band
    alpha[bgmask] = 0
    ring = (~bgmask) & (ndimage.distance_transform_edt(~bgmask) <= 2)
    alpha[ring | glowzone] = np.clip((d[ring | glowzone] - thr * .5) / (soft - thr * .5), 0, 1)
    alpha[(~bgmask) & ~(ring | glowzone)] = 1
    am = np.maximum(alpha, 1e-3)[..., None]
    rgb = np.clip((a - bg * (1 - am)) / am, 0, 255)
    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    img = Image.fromarray(out, 'RGBA'); bb = img.getbbox()
    if bb: img = img.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(img.width, bb[2] + pad), min(img.height, bb[3] + pad)))
    return img
if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]; box = tuple(map(int, sys.argv[3:7])) if len(sys.argv) >= 7 else None
    cutout(Image.open(src), box).save(dst); print('saved', dst)
