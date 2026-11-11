from pathlib import Path
from PIL import Image

Image.MAX_IMAGE_PIXELS = None

light = Path(
    r"C:\Users\Aroman EMESTHU\AppData\Roaming\Cursor\User\workspaceStorage"
    r"\70d34eb344df6bf12ae923c99a13f9e5\images"
)
candidates = sorted(light.glob("*.png"), key=lambda p: p.stat().st_size)
small = [p for p in candidates if 20_000 < p.stat().st_size < 80_000]
src = small[0]
print("source", src.name, src.stat().st_size)

out = Path("public")
out.mkdir(exist_ok=True)

logo = Image.open(src).convert("RGBA")
max_edge = 1600
if max(logo.size) > max_edge:
    logo.thumbnail((max_edge, max_edge), Image.Resampling.LANCZOS)


def knock_black(img: Image.Image, threshold: int = 28) -> Image.Image:
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 0 and r <= threshold and g <= threshold and b <= threshold:
                px[x, y] = (r, g, b, 0)
    return img


def trim(img: Image.Image, pad: int = 8) -> Image.Image:
    alpha = img.split()[-1]
    bbox = alpha.getbbox()
    if not bbox:
        return img
    l, t, r, b = bbox
    return img.crop((max(0, l - pad), max(0, t - pad), min(img.width, r + pad), min(img.height, b + pad)))


logo_clear = knock_black(logo.copy())
logo_clear = trim(logo_clear, pad=10)
logo_clear.save(out / "vita-logo.png", optimize=True)
w, h = logo_clear.size
print("logo", w, h)

crop = logo_clear.crop((0, 0, max(1, int(w * 0.42)), h))
mark = trim(crop, pad=6)
mark.save(out / "vita-symbol.png", optimize=True)

side = max(mark.size)
# App icon keeps a dark square plate for home-screen contrast.
canvas = Image.new("RGBA", (side + 48, side + 48), (13, 13, 13, 255))
canvas.paste(mark, ((canvas.width - mark.size[0]) // 2, (canvas.height - mark.size[1]) // 2), mark)
canvas.save(out / "vita-mark.png", optimize=True)

for size in (180, 192, 512):
    canvas.resize((size, size), Image.Resampling.LANCZOS).save(out / f"vita-mark-{size}.png", optimize=True)

print("symbol", mark.size)
print("mark", canvas.size)
print("ok")
