#!/usr/bin/env python3
"""Resize and chroma-key generated art into public/."""

from pathlib import Path
from PIL import Image

SRC = Path("/opt/cursor/artifacts/assets")
ROOT = Path("/workspace/public")

MAPS = {
    "map-hulao.png": ("maps/hulao.png", 2048),
    "map-chibi.png": ("maps/chibi.png", 2048),
    "map-qishan.png": ("maps/qishan.png", 2048),
}

KEYED = {
    "unit-guanyu.png": ("units/guanyu.png", 512),
    "unit-zhaoyun.png": ("units/zhaoyun.png", 512),
    "unit-zhuge.png": ("units/zhuge.png", 512),
    "unit-lubu.png": ("units/lubu.png", 640),
    "unit-scout.png": ("units/scout.png", 420),
    "unit-infantry.png": ("units/infantry.png", 420),
    "unit-cavalry.png": ("units/cavalry.png", 520),
    "unit-armored.png": ("units/armored.png", 460),
    "unit-elite.png": ("units/elite.png", 480),
    "unit-soldier.png": ("units/soldier.png", 420),
    "tower-ballista-1.png": ("towers/ballista-1.png", 560),
    "tower-ballista-2.png": ("towers/ballista-2.png", 560),
    "tower-ballista-3.png": ("towers/ballista-3.png", 560),
    "tower-thunder-1.png": ("towers/thunder-1.png", 560),
    "tower-thunder-2.png": ("towers/thunder-2.png", 560),
    "tower-thunder-3.png": ("towers/thunder-3.png", 560),
    "tower-barracks-1.png": ("towers/barracks-1.png", 560),
    "tower-barracks-2.png": ("towers/barracks-2.png", 560),
    "tower-barracks-3.png": ("towers/barracks-3.png", 560),
    "tower-sage-1.png": ("towers/sage-1.png", 560),
    "tower-sage-2.png": ("towers/sage-2.png", 560),
    "tower-sage-3.png": ("towers/sage-3.png", 560),
    "ui-coin.png": ("ui/coin.png", 192),
    "ui-heart.png": ("ui/heart.png", 192),
    "ui-horn.png": ("ui/horn.png", 256),
    "ui-skull.png": ("ui/skull.png", 192),
    "portrait-guanyu.png": ("ui/portrait-guanyu.png", 256),
    "portrait-zhaoyun.png": ("ui/portrait-zhaoyun.png", 256),
    "portrait-zhuge.png": ("ui/portrait-zhuge.png", 256),
    "icon-ballista.png": ("ui/icon-ballista.png", 192),
    "icon-thunder.png": ("ui/icon-thunder.png", 192),
    "icon-barracks.png": ("ui/icon-barracks.png", 192),
    "icon-sage.png": ("ui/icon-sage.png", 192),
    "decal-pad.png": ("ui/pad.png", 256),
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

    # Flood leftover studio backdrop from the edges without eating black hair/armor.
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


def save(im: Image.Image, dest: Path, width: int) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if im.width > width:
        h = int(im.height * (width / im.width))
        im = im.resize((width, h), Image.Resampling.LANCZOS)
    im.save(dest, "PNG", optimize=True)
    print(f"wrote {dest} {im.size}")


def main() -> None:
    for src, (dest, width) in MAPS.items():
        im = Image.open(SRC / src).convert("RGB")
        save(im, ROOT / dest, width)
    for src, (dest, width) in KEYED.items():
        im = chroma(Image.open(SRC / src))
        save(im, ROOT / dest, width)


if __name__ == "__main__":
    main()
