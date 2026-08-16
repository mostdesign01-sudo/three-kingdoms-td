#!/usr/bin/env python3
"""Punch edge-connected near-black backdrop on unit/tower webps, then recrop."""

from pathlib import Path

from PIL import Image

ROOT = Path("/workspace/public")
FOLDERS = ("units", "towers")


def is_backdrop(r: int, g: int, b: int, a: int) -> bool:
    if a < 12:
        return True
    return max(r, g, b) < 32 and (r + g + b) < 66


def punch(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
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
        if not is_backdrop(r, g, b, a):
            continue
        if a:
            px[x, y] = (r, g, b, 0)
        stack.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    # Dark anti-aliased fringe next to cleared backdrop
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 16 or a > 210:
                continue
            if max(r, g, b) > 48:
                continue
            edge = False
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] < 12:
                    edge = True
                    break
            if edge:
                px[x, y] = (r, g, b, 0)

    bbox = im.getbbox()
    if not bbox:
        return im
    pad = 3
    x0, y0, x1, y1 = bbox
    return im.crop((max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad), min(h, y1 + pad)))


def main() -> None:
    for folder in FOLDERS:
        for src in sorted((ROOT / folder).glob("*.webp")):
            out = punch(Image.open(src))
            out.save(src, "WEBP", quality=78, method=6)
            print(f"punched {src} {out.size} {src.stat().st_size // 1024}KB")


if __name__ == "__main__":
    main()
