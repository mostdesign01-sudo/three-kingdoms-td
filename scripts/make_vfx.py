#!/usr/bin/env python3
"""Paint tiny VFX cards: crescent, slash mark, bagua, dust, rune, talisman, spear."""

from math import cos, pi, sin
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

OUT = Path("/workspace/public/vfx")
OUT.mkdir(parents=True, exist_ok=True)


def save(im: Image.Image, name: str) -> None:
    dest = OUT / name
    im.save(dest, "WEBP", quality=82, method=6)
    print(f"wrote {dest} {im.size} {dest.stat().st_size}B")


def crescent() -> Image.Image:
    im = Image.new("RGBA", (512, 256), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # Wide 偃月 blade: gold rim, green core
    for i, (col, w) in enumerate(
        (
            ((80, 40, 8, 40), 42),
            ((210, 170, 50, 90), 28),
            ((60, 160, 70, 200), 18),
            ((230, 220, 120, 230), 8),
        )
    ):
        d.arc((30 + i, 20 + i, 482 - i, 420 - i), 200, 340, fill=col, width=w)
    # tip flare
    d.ellipse((430, 70, 490, 130), fill=(255, 230, 140, 180))
    d.ellipse((40, 150, 90, 200), fill=(40, 120, 50, 120))
    return im.filter(ImageFilter.GaussianBlur(0.6))


def slash_mark() -> Image.Image:
    im = Image.new("RGBA", (384, 192), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.polygon([(20, 110), (360, 40), (370, 70), (30, 150)], fill=(30, 18, 8, 150))
    d.polygon([(28, 118), (350, 52), (358, 68), (36, 138)], fill=(180, 140, 40, 90))
    d.line([(40, 128), (340, 62)], fill=(255, 220, 90, 160), width=3)
    return im.filter(ImageFilter.GaussianBlur(0.8))


def bagua() -> Image.Image:
    s = 512
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = s // 2
    d.ellipse((18, 18, s - 18, s - 18), outline=(90, 60, 10, 220), width=10)
    d.ellipse((28, 28, s - 28, s - 28), outline=(230, 190, 70, 240), width=6)
    d.ellipse((70, 70, s - 70, s - 70), fill=(18, 28, 16, 140), outline=(80, 160, 90, 180), width=4)
    # yin-yang
    d.pieslice((170, 170, 342, 342), 90, 270, fill=(240, 220, 140, 220))
    d.pieslice((170, 170, 342, 342), 270, 450, fill=(20, 40, 24, 220))
    d.ellipse((214, 186, 298, 270), fill=(20, 40, 24, 220))
    d.ellipse((214, 242, 298, 326), fill=(240, 220, 140, 220))
    d.ellipse((242, 214, 270, 242), fill=(240, 220, 140, 255))
    d.ellipse((242, 270, 270, 298), fill=(20, 40, 24, 255))
    # 8 trigrams as gold bars
    patterns = [
        (1, 1, 1),
        (1, 1, 0),
        (1, 0, 1),
        (0, 1, 1),
        (1, 0, 0),
        (0, 1, 0),
        (0, 0, 1),
        (0, 0, 0),
    ]
    for i, pat in enumerate(patterns):
        a = -pi / 2 + i * pi / 4
        cx = c + cos(a) * 190
        cy = c + sin(a) * 190
        for k, bit in enumerate(pat):
            ox = -cos(a) * (k - 1) * 16
            oy = -sin(a) * (k - 1) * 16
            px, py = cx + ox, cy + oy
            dx, dy = -sin(a) * 22, cos(a) * 22
            if bit:
                d.line([(px - dx, py - dy), (px + dx, py + dy)], fill=(240, 200, 70, 240), width=6)
            else:
                d.line([(px - dx, py - dy), (px - dx * 0.2, py - dy * 0.2)], fill=(240, 200, 70, 240), width=6)
                d.line([(px + dx * 0.2, py + dy * 0.2), (px + dx, py + dy)], fill=(240, 200, 70, 240), width=6)
    return im.filter(ImageFilter.GaussianBlur(0.4))


def dust() -> Image.Image:
    im = Image.new("RGBA", (128, 80), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for cx, cy, r, a in (
        (40, 50, 22, 90),
        (64, 42, 28, 110),
        (90, 52, 20, 80),
        (52, 58, 14, 70),
    ):
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(150, 120, 70, a))
    return im.filter(ImageFilter.GaussianBlur(2.2))


def rune() -> Image.Image:
    im = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((8, 8, 88, 88), outline=(80, 160, 90, 180), width=3)
    d.line([(48, 18), (48, 78)], fill=(230, 200, 80, 230), width=5)
    d.line([(22, 48), (74, 48)], fill=(230, 200, 80, 230), width=5)
    d.arc((22, 22, 74, 74), 20, 200, fill=(180, 230, 160, 200), width=4)
    return im


def talisman() -> Image.Image:
    im = Image.new("RGBA", (96, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.polygon([(16, 8), (80, 8), (84, 118), (12, 118)], fill=(236, 210, 120, 240))
    d.polygon([(20, 12), (76, 12), (78, 112), (18, 112)], fill=(250, 230, 150, 255))
    d.line([(48, 22), (48, 100)], fill=(180, 30, 30, 240), width=6)
    d.line([(28, 40), (68, 40)], fill=(180, 30, 30, 240), width=5)
    d.line([(30, 70), (66, 86)], fill=(180, 30, 30, 220), width=4)
    d.rectangle((22, 18, 74, 108), outline=(160, 110, 30, 200), width=2)
    return im


def spear() -> Image.Image:
    im = Image.new("RGBA", (384, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.polygon([(8, 32), (300, 18), (370, 32), (300, 46)], fill=(210, 220, 235, 40))
    d.polygon([(20, 32), (280, 24), (360, 32), (280, 40)], fill=(230, 240, 255, 200))
    d.polygon([(240, 28), (372, 32), (240, 36)], fill=(255, 255, 255, 230))
    return im.filter(ImageFilter.GaussianBlur(0.5))


def glow() -> Image.Image:
    im = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for r, a in ((120, 30), (80, 70), (40, 140), (16, 200)):
        d.ellipse((128 - r, 128 - r, 128 + r, 128 + r), fill=(80, 220, 140, a))
    return im.filter(ImageFilter.GaussianBlur(3))


if __name__ == "__main__":
    save(crescent(), "slash.webp")
    save(slash_mark(), "slash-mark.webp")
    save(bagua(), "bagua.webp")
    save(dust(), "dust.webp")
    save(rune(), "rune.webp")
    save(talisman(), "talisman.webp")
    save(spear(), "spear.webp")
    save(glow(), "glow.webp")
