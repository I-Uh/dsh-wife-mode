"""Crop the source poster into the right-edge wallpaper band.

The character block is kept and the poster's info columns, logo caption, photo
strip, and checklist are dropped. Run after changing the crop box, then rebuild
the client bundle so the new artwork is embedded.

Usage: python scripts/crop.py [path-to-source-image]
"""

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets"

# The poster the wallpaper was cropped from (a local attachment path).
DEFAULT_SOURCE = Path(
    r"C:\Users\Lenovo\.dsh\attachments\v1\objects\87"
    r"\87e5dfde6128ed30911ac3fc639e5d4cda2ad03f1da95478643eb01cb5501f90"
)

# Character band: the right-hand info columns, the logo caption, the photo
# strip, and the bottom checklist all fall outside this box.
BOX = (215, 70, 705, 1150)


def main() -> None:
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SOURCE
    if not source.exists():
        raise SystemExit(f"source image not found: {source}")

    OUT.mkdir(exist_ok=True)
    image = Image.open(source).convert("RGB")
    crop = image.crop(BOX)

    crop.save(OUT / "wallpaper.jpg", quality=90, optimize=True)
    crop.save(OUT / "wallpaper.webp", quality=82, method=6)

    for name in ("wallpaper.jpg", "wallpaper.webp"):
        path = OUT / name
        print(f"{name}: {crop.width}x{crop.height}, {path.stat().st_size // 1024} KiB")


if __name__ == "__main__":
    main()
