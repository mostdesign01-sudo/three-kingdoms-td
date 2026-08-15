#!/usr/bin/env python3
"""Process generated art, then compress for phone download."""

from pathlib import Path
from PIL import Image

SRC = Path("/opt/cursor/artifacts/assets")
ROOT = Path("/workspace/public")

MAPS = {
    "map-hulao.png": "hulao",
    "map-chibi.png": "chibi",
    "map-qishan.png": "qishan",
}

KEYED = {
    "unit-guanyu.png": ("units/guanyu.webp", 384),
    "unit-zhaoyun.png": ("units/zhaoyun.webp", 384),
    "unit-zhuge.png": ("units/zhuge.webp", 384),
    "unit-lubu.png": ("units/lubu.webp", 384),
    "unit-scout.png": ("units/scout.webp", 384),
    "unit-infantry.png": ("units/infantry.webp", 384),
    "unit-cavalry.png": ("units/cavalry.webp", 384),
    "unit-armored.png": ("units/armored.webp", 384),
    "unit-elite.png": ("units/elite.webp", 384),
    "unit-soldier.png": ("units/soldier.webp", 384),
    "tower-ballista-1.png": ("towers/ballista-1.webp", 384),
    "tower-ballista-2.png": ("towers/ballista-2.webp", 384),
    "tower-ballista-3.png": ("towers/ballista-3.webp", 384),
    "tower-thunder-1.png": ("towers/thunder-1.webp", 384),
    "tower-thunder-2.png": ("towers/thunder-2.webp", 384),
    "tower-thunder-3.png": ("towers/thunder-3.webp", 384),
    "tower-barracks-1.png": ("towers/barracks-1.webp", 384),
    "tower-barracks-2.png": ("towers/barracks-2.webp", 384),
    "tower-barracks-3.png": ("towers/barracks-3.webp", 384),
    "tower-sage-1.png": ("towers/sage-1.webp", 384),
    "tower-sage-2.png": ("towers/sage-2.webp", 384),
    "tower-sage-3.png": ("towers/sage-3.webp", 384),
    "ui-coin.png": ("ui/coin.webp", 192),
    "ui-heart.png": ("ui/heart.webp", 192),
    "ui-horn.png": ("ui/horn.webp", 192),
    "ui-skull.png": ("ui/skull.webp", 192),
    "portrait-guanyu.png": ("ui/portrait-guanyu.webp", 192),
    "portrait-zhaoyun.png": ("ui/portrait-zhaoyun.webp", 192),
    "portrait-zhuge.png": ("ui/portrait-zhuge.webp", 192),
    "icon-ballista.png": ("ui/icon-ballista.webp", 192),
    "icon-thunder.png": ("ui/icon-thunder.webp", 192),
    "icon-barracks.png": ("ui/icon-barracks.webp", 192),
    "icon-sage.png": ("ui/icon-sage.webp", 192),
    "decal-pad.png": ("ui/pad.webp", 192),
}


def is_key(r: int, g: int, b: int) -> bool:
    magenta = r > 150 and b > 130 and g < 120 and (r + b) - 2 * g > 140
    pink = r > 210 and b > 180 and g > 120 and g < 220 and r > g + 18
    return magenta or pink


def chroma(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_key(r, g, b):
                px[x, y] = (r, g, b, 0)

    seen = bytearray(w * h)
    stack = []
    for x in range(w):
        stack.append((x, 0))
        stack.append((x, h - 1))
    for y in range(h):
        stack.append((0, y))
        stack.append((w - 1, y))
    while stack:
        x, y = stack.pop()
        if x < 0 or y < 0 or x >= w or y >= h:
            continue
        i = y * w + x
        if seen[i]:
            continue
        seen[i] = 1
        r, g, b, a = px[x, y]
        backdrop = a < 12 or is_key(r, g, b) or (a < 80 and r > 140 and b > 120 and g < 140)
        if not backdrop:
            continue
        if a:
            px[x, y] = (r, g, b, 0)
        stack.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    return crop_alpha(im)


def crop_alpha(im: Image.Image) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return im
    pad = 4
    x0, y0, x1, y1 = bbox
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(im.width, x1 + pad)
    y1 = min(im.height, y1 + pad)
    return im.crop((x0, y0, x1, y1))


def fit(im: Image.Image, long_side: int) -> Image.Image:
    w, h = im.size
    longest = max(w, h)
    if longest <= long_side:
        return im
    scale = long_side / longest
    return im.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.Resampling.LANCZOS)


def main() -> None:
    for src, name in MAPS.items():
        im = Image.open(SRC / src).convert("RGB")
        dest = ROOT / "maps" / f"{name}.jpg"
        dest.parent.mkdir(parents=True, exist_ok=True)
        plate = fit(im, 2048)
        plate.save(dest, "JPEG", quality=76, optimize=True, progressive=True)
        thumb = fit(im, 480)
        thumb.save(ROOT / "maps" / f"{name}-thumb.jpg", "JPEG", quality=72, optimize=True)
        print(f"wrote {dest} {dest.stat().st_size // 1024}KB")
    for src, (dest, width) in KEYED.items():
        im = chroma(Image.open(SRC / src))
        out = ROOT / dest
        out.parent.mkdir(parents=True, exist_ok=True)
        fit(im, width).save(out, "WEBP", quality=78, method=6)
        print(f"wrote {out} {out.stat().st_size // 1024}KB")


if __name__ == "__main__":
    main()
