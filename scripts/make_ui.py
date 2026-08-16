#!/usr/bin/env python3
"""Paint Kingdom Rush-chunky UI chrome in a 三国 ink / lacquer / antique-gold palette."""

from math import cos, pi, sin
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

OUT = Path("/workspace/public/ui")
OUT.mkdir(parents=True, exist_ok=True)
MAPS = Path("/workspace/public/maps")


def save(im: Image.Image, name: str) -> None:
    dest = OUT / name
    im.save(dest, "WEBP", quality=84, method=6)
    print(f"wrote {dest} {im.size} {dest.stat().st_size}B")


def wood(size, dark=False):
    w, h = size
    im = Image.new("RGB", (w, h), (62, 40, 24) if not dark else (36, 22, 14))
    d = ImageDraw.Draw(im, "RGBA")
    base = (90, 58, 32) if not dark else (54, 34, 20)
    hi = (140, 96, 52) if not dark else (86, 56, 32)
    for y in range(0, h, 7):
        shade = 8 if (y // 7) % 2 == 0 else -6
        col = (base[0] + shade, base[1] + shade, base[2] + shade, 90)
        d.line([(0, y), (w, y + 2)], fill=col, width=3)
    for x in range(12, w, 28):
        d.line([(x, 0), (x + 4, h)], fill=(*hi, 28), width=2)
    return im.filter(ImageFilter.GaussianBlur(0.4))


def gold_ring(d, box, width=6):
    d.ellipse(box, outline=(224, 184, 74, 255), width=width)
    inset = [box[0] + width, box[1] + width, box[2] - width, box[3] - width]
    d.ellipse(inset, outline=(90, 60, 20, 180), width=2)


def circle_btn(size, fill, icon_fn, lacquer=False):
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im, "RGBA")
    m = 6
    d.ellipse((m + 3, m + 5, size - m + 1, size - m + 3), fill=(10, 6, 4, 160))
    d.ellipse((m, m, size - m, size - m), fill=fill)
    gold_ring(d, (m, m, size - m, size - m), 5)
    if lacquer:
        d.ellipse((m + 10, m + 8, size - m - 10, size // 2), fill=(255, 220, 180, 28))
    icon_fn(d, size)
    return im.filter(ImageFilter.GaussianBlur(0.3))


def icon_back(d, s):
    c = s // 2
    d.polygon([(c + 16, c - 18), (c - 18, c), (c + 16, c + 18)], fill=(246, 230, 184, 255))
    d.rectangle((c + 8, c - 7, c + 22, c + 7), fill=(246, 230, 184, 255))


def icon_pause(d, s):
    c = s // 2
    d.rounded_rectangle((c - 16, c - 18, c - 5, c + 18), 3, fill=(246, 230, 184, 255))
    d.rounded_rectangle((c + 5, c - 18, c + 16, c + 18), 3, fill=(246, 230, 184, 255))


def icon_cancel(d, s):
    c = s // 2
    for a, b in [((c - 16, c - 16), (c + 16, c + 16)), ((c + 16, c - 16), (c - 16, c + 16))]:
        d.line([a, b], fill=(246, 230, 184, 255), width=8)


def icon_upgrade(d, s):
    c = s // 2
    d.polygon([(c, c - 22), (c + 20, c + 4), (c + 8, c + 4), (c + 8, c + 20), (c - 8, c + 20), (c - 8, c + 4), (c - 20, c + 4)], fill=(232, 196, 74, 255))
    d.regular_polygon((c, c - 6, 7), 5, 0, fill=(255, 236, 160, 255))


def icon_sell(d, s):
    c = s // 2
    d.ellipse((c - 18, c - 6, c + 18, c + 22), fill=(196, 148, 58, 255))
    d.pieslice((c - 16, c - 22, c + 16, c - 2), 200, 340, fill=(160, 110, 40, 255))
    d.ellipse((c - 6, c - 2, c + 6, c + 10), fill=(246, 220, 140, 255))


def speed_pips(n):
    def draw(d, s):
        c = s // 2
        gap = 14
        start = c - (n - 1) * gap / 2
        for i in range(n):
            x = start + i * gap
            d.polygon([(x - 7, c - 16), (x + 9, c), (x - 7, c + 16)], fill=(246, 230, 184, 255))
    return draw


def star(on=True):
    s = 96
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im, "RGBA")
    c = s // 2
    pts = []
    for i in range(5):
        a = -pi / 2 + i * 2 * pi / 5
        pts.append((c + cos(a) * 36, c + sin(a) * 36))
        a2 = a + pi / 5
        pts.append((c + cos(a2) * 15, c + sin(a2) * 15))
    fill = (232, 188, 64, 255) if on else (70, 50, 32, 220)
    d.polygon(pts, fill=fill)
    if on:
        d.polygon(pts, outline=(255, 236, 160, 255))
    else:
        d.polygon(pts, outline=(120, 90, 40, 200))
    return im.filter(ImageFilter.GaussianBlur(0.4))


def medallion():
    s = 160
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    wood_im = wood((s, s)).convert("RGBA")
    mask = Image.new("L", (s, s), 0)
    ImageDraw.Draw(mask).ellipse((6, 6, s - 6, s - 6), fill=255)
    im.paste(wood_im, (0, 0), mask)
    d = ImageDraw.Draw(im, "RGBA")
    gold_ring(d, (6, 6, s - 6, s - 6), 7)
    d.ellipse((18, 16, s - 18, s // 2), fill=(255, 220, 170, 30))
    return im


def call_flag():
    im = Image.new("RGBA", (128, 160), (0, 0, 0, 0))
    d = ImageDraw.Draw(im, "RGBA")
    d.rectangle((18, 8, 26, 150), fill=(90, 70, 40, 255))
    d.polygon([(26, 12), (112, 40), (26, 72)], fill=(154, 28, 28, 255))
    d.polygon([(26, 12), (112, 40), (26, 72)], outline=(224, 184, 74, 255))
    d.ellipse((12, 4, 32, 24), fill=(224, 184, 74, 255))
    return im.filter(ImageFilter.GaussianBlur(0.3))


def title_plaque():
    w, h = 720, 160
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im, "RGBA")
    d.polygon([(40, 16), (680, 16), (710, 80), (680, 144), (40, 144), (10, 80)], fill=(139, 30, 30, 255))
    d.polygon([(40, 16), (680, 16), (710, 80), (680, 144), (40, 144), (10, 80)], outline=(224, 184, 74, 255))
    d.polygon([(56, 30), (664, 30), (688, 80), (664, 130), (56, 130), (32, 80)], outline=(246, 220, 140, 180), width=3)
    d.rectangle((348, 0, 372, 18), fill=(196, 148, 58, 255))
    d.ellipse((340, 0, 380, 22), fill=(224, 184, 74, 255))
    return im


def board_frame():
    w, h = 1600, 900
    base = wood((w, h), dark=True)
    d = ImageDraw.Draw(base, "RGBA")
    d.rectangle((0, 0, w, h), outline=(224, 184, 74, 230), width=14)
    d.rectangle((18, 18, w - 18, h - 18), outline=(90, 60, 24, 200), width=6)
    for x, y in ((40, 40), (w - 40, 40), (40, h - 40), (w - 40, h - 40)):
        d.ellipse((x - 16, y - 16, x + 16, y + 16), fill=(196, 148, 58, 255))
    return base.convert("RGBA")


def _ellipse_mask(size, feather=90):
    w, h = size
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse((8, 8, w - 8, h - 8), fill=255)
    if feather:
        mask = mask.filter(ImageFilter.GaussianBlur(feather))
    return mask


def _place_land(board, src, box, fade=0.88):
    x, y, tw, th = box
    im = src.resize((tw, th), Image.Resampling.LANCZOS).convert("RGBA")
    im = ImageEnhance.Color(im).enhance(1.05)
    im = ImageEnhance.Brightness(im).enhance(fade)
    im.putalpha(_ellipse_mask((tw, th), max(48, min(tw, th) // 7)))
    board.alpha_composite(im, (x, y))


def campaign_board():
    w, h = 1600, 900
    land = Image.new("RGBA", (w, h), (28, 18, 10, 255))
    wash = ImageDraw.Draw(land, "RGBA")
    wash.ellipse((40, 80, 780, 860), fill=(46, 78, 36, 255))
    wash.ellipse((420, 20, 1180, 620), fill=(36, 72, 88, 255))
    wash.ellipse((820, 160, 1580, 880), fill=(92, 78, 48, 255))
    land = land.filter(ImageFilter.GaussianBlur(28))

    hulao = Image.open(MAPS / "hulao.jpg")
    chibi = Image.open(MAPS / "chibi.jpg")
    qishan = Image.open(MAPS / "qishan.jpg")
    _place_land(land, hulao, (20, 160, 860, 620), 0.9)
    _place_land(land, chibi, (430, 30, 820, 560), 0.86)
    _place_land(land, qishan, (780, 180, 800, 600), 0.9)

    ink = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(ink, "RGBA")
    path = [(352, 486), (520, 420), (800, 306), (1000, 380), (1216, 468)]
    d.line(path, fill=(154, 28, 28, 90), width=10)
    for i in range(0, 42):
        t = i / 41
        x = path[0][0] * (1 - t) * (1 - t) + path[2][0] * 2 * t * (1 - t) + path[4][0] * t * t
        y = path[0][1] * (1 - t) * (1 - t) + path[2][1] * 2 * t * (1 - t) + path[4][1] * t * t
        d.ellipse((x - 4, y - 4, x + 4, y + 4), fill=(180, 36, 28, 210))
    # compass rose, KR-style corner mark
    cx, cy = 148, 760
    d.ellipse((cx - 46, cy - 46, cx + 46, cy + 46), outline=(224, 184, 74, 160), width=3)
    d.polygon([(cx, cy - 40), (cx + 8, cy), (cx, cy + 12), (cx - 8, cy)], fill=(224, 184, 74, 200))
    d.polygon([(cx, cy + 40), (cx - 8, cy), (cx, cy - 12), (cx + 8, cy)], fill=(90, 60, 24, 200))
    land = Image.alpha_composite(land, ink)

    board = board_frame()
    board.alpha_composite(land)
    frame = ImageDraw.Draw(board, "RGBA")
    frame.rectangle((0, 0, w - 1, h - 1), outline=(224, 184, 74, 230), width=14)
    frame.rectangle((18, 18, w - 19, h - 19), outline=(90, 60, 24, 200), width=6)
    vignette = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    vd = ImageDraw.Draw(vignette)
    vd.rectangle((0, 0, w, 110), fill=(18, 10, 6, 110))
    vd.rectangle((0, h - 90, w, h), fill=(18, 10, 6, 130))
    return Image.alpha_composite(board, vignette).filter(ImageFilter.GaussianBlur(0.2))


def wood_bar():
    w, h = 480, 72
    im = wood((w, h)).convert("RGBA")
    d = ImageDraw.Draw(im, "RGBA")
    d.rectangle((2, 2, w - 3, h - 3), outline=(224, 184, 74, 255), width=4)
    d.rectangle((8, 8, w - 9, h - 9), outline=(40, 24, 12, 180), width=2)
    return im


def plaque_wood():
    w, h = 360, 88
    im = wood((w, h)).convert("RGBA")
    d = ImageDraw.Draw(im, "RGBA")
    d.rounded_rectangle((2, 2, w - 3, h - 3), 12, outline=(224, 184, 74, 255), width=5)
    d.rounded_rectangle((10, 10, w - 11, h - 11), 8, outline=(90, 60, 24, 160), width=2)
    return im


def icon_play(d, s):
    c = s // 2
    d.polygon([(c - 14, c - 20), (c + 20, c), (c - 14, c + 20)], fill=(246, 230, 184, 255))


def flag_pin():
    im = Image.new("RGBA", (96, 140), (0, 0, 0, 0))
    d = ImageDraw.Draw(im, "RGBA")
    d.rectangle((20, 8, 28, 128), fill=(90, 70, 40, 255))
    d.polygon([(28, 10), (86, 38), (28, 66)], fill=(154, 28, 28, 255))
    d.polygon([(28, 10), (86, 38), (28, 66)], outline=(224, 184, 74, 255))
    d.ellipse((14, 118, 34, 136), fill=(40, 28, 16, 180))
    return im.filter(ImageFilter.GaussianBlur(0.3))


if __name__ == "__main__":
    iron = (58, 40, 26, 255)
    lacquer = (139, 30, 30, 255)
    save(circle_btn(128, iron, icon_back), "btn-back.webp")
    save(circle_btn(128, iron, icon_pause), "btn-pause.webp")
    save(circle_btn(128, iron, icon_pause), "icon-pause.webp")
    save(circle_btn(128, iron, icon_play), "icon-play.webp")
    save(circle_btn(128, iron, speed_pips(2)), "icon-speed.webp")
    save(circle_btn(128, lacquer, icon_cancel, True), "btn-cancel.webp")
    save(circle_btn(128, lacquer, icon_cancel, True), "icon-cancel.webp")
    save(circle_btn(128, iron, speed_pips(1)), "btn-speed-1.webp")
    save(circle_btn(128, iron, speed_pips(2)), "btn-speed-2.webp")
    save(circle_btn(128, iron, speed_pips(3)), "btn-speed-3.webp")
    save(circle_btn(128, (70, 48, 22, 255), icon_upgrade), "icon-upgrade.webp")
    save(circle_btn(128, (70, 48, 22, 255), icon_sell), "icon-sell.webp")
    save(star(True), "star-on.webp")
    save(star(False), "star-off.webp")
    save(star(True), "icon-star.webp")
    save(medallion(), "medallion.webp")
    save(call_flag(), "call-flag.webp")
    save(flag_pin(), "flag-pin.webp")
    save(title_plaque(), "title-plaque.webp")
    save(campaign_board(), "campaign-board.webp")
    save(wood_bar(), "wood-bar.webp")
    save(plaque_wood(), "plaque-wood.webp")
