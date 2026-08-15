#!/usr/bin/env python3
"""Compress painted maps and sprites for phone download."""

from pathlib import Path
from PIL import Image

ROOT = Path("/workspace/public")


def fit(im: Image.Image, long_side: int) -> Image.Image:
    w, h = im.size
    longest = max(w, h)
    if longest <= long_side:
        return im
    scale = long_side / longest
    return im.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.Resampling.LANCZOS)


def save_jpg(im: Image.Image, dest: Path, long_side: int, quality: int) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    rgb = fit(im.convert("RGB"), long_side)
    rgb.save(dest, "JPEG", quality=quality, optimize=True, progressive=True)
    print(f"wrote {dest} {rgb.size} {dest.stat().st_size // 1024}KB q={quality}")


def save_webp(im: Image.Image, dest: Path, long_side: int, quality: int) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    out = fit(im.convert("RGBA"), long_side)
    out.save(dest, "WEBP", quality=quality, method=6)
    print(f"wrote {dest} {out.size} {dest.stat().st_size // 1024}KB q={quality}")


def shrink_webp(src: Path, dest: Path, long_side: int, max_kb: int) -> None:
    im = Image.open(src)
    for q in (78, 70, 62, 54, 46):
        save_webp(im, dest, long_side, q)
        if dest.stat().st_size <= max_kb * 1024:
            return
    save_webp(im, dest, min(long_side, 320), 46)


def main() -> None:
    for name in ("hulao", "chibi", "qishan"):
        src = ROOT / "maps" / f"{name}.png"
        if not src.exists():
            src = ROOT / "maps" / f"{name}.jpg"
        im = Image.open(src)
        save_jpg(im, ROOT / "maps" / f"{name}.jpg", 2048, 76)
        save_jpg(im, ROOT / "maps" / f"{name}-thumb.jpg", 480, 72)

    for folder, long_side, max_kb in (("units", 384, 140), ("towers", 384, 140), ("ui", 192, 40)):
        for src in sorted((ROOT / folder).glob("*.png")):
            dest = src.with_suffix(".webp")
            shrink_webp(src, dest, long_side, max_kb)

    print("done")


if __name__ == "__main__":
    main()
