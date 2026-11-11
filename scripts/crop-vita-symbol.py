"""Crop the Vita pin symbol from the full lockup — no regeneration, cut text only."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "vita-logo.png"
OUT_DIR = ROOT / "public"


def main() -> None:
    im = Image.open(SRC).convert("RGBA")
    w, h = im.size
    px = im.load()

    # Find content bbox (non-near-black pixels)
    xs, ys = [], []
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 20:
                continue
            if r + g + b > 40:
                xs.append(x)
                ys.append(y)
    if not xs:
        raise SystemExit("no content")

    left, right, top, bottom = min(xs), max(xs), min(ys), max(ys)

    # Find where white text starts: tall white column after yellow symbol
    # Scan columns; yellow-dominant region then white-dominant text.
    cut = right
    yellow_seen = False
    gap_start = None
    for x in range(left, right + 1):
        yellow = white = other = 0
        for y in range(top, bottom + 1):
            r, g, b, a = px[x, y]
            if a < 20 or r + g + b < 40:
                continue
            if g > 120 and r > 140 and b < 100:
                yellow += 1
            elif r > 200 and g > 200 and b > 200:
                white += 1
            else:
                other += 1
        lit = yellow + white + other
        if lit == 0:
            if yellow_seen and gap_start is None:
                gap_start = x
            continue
        if yellow > white and yellow > other:
            yellow_seen = True
            gap_start = None
        elif yellow_seen and white > yellow * 2 and white > 8:
            # Text column — cut at start of preceding gap or this x
            cut = gap_start if gap_start is not None else x - 4
            break

    # Fallback: keep left 42% of content width (symbol is left of lockup)
    if cut >= right - 10:
        cut = left + int((right - left) * 0.42)

    pad = max(8, int((bottom - top) * 0.08))
    box = (
        max(0, left - pad),
        max(0, top - pad),
        min(w, cut + pad),
        min(h, bottom + pad),
    )
    symbol = im.crop(box)

    # Square canvas with black background for app icons
    sw, sh = symbol.size
    side = max(sw, sh)
    canvas = Image.new("RGBA", (side, side), (13, 13, 13, 255))
    canvas.paste(symbol, ((side - sw) // 2, (side - sh) // 2), symbol)

    def export(name: str, size: int | None = None) -> None:
        out = canvas.copy()
        if size:
            out = out.resize((size, size), Image.Resampling.LANCZOS)
        path = OUT_DIR / name
        out.convert("RGBA").save(path, "PNG")
        print("wrote", path.name, out.size)

    export("vita-symbol.png")
    export("vita-mark.png", 512)
    export("vita-mark-180.png", 180)
    export("vita-mark-192.png", 192)
    export("vita-mark-512.png", 512)
    # Favicon sizes
    export("favicon-32.png", 32)
    export("favicon-48.png", 48)
    print("cut_x", cut, "box", box)


if __name__ == "__main__":
    main()
