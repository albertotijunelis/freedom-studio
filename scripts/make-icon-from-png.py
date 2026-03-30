"""Generate app icons from the captured FS.png screenshot."""
from PIL import Image, ImageFilter
import os

SRC = r"C:\Users\alber\Downloads\FS.png"
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "apps", "desktop", "build")
os.makedirs(OUT_DIR, exist_ok=True)

src = Image.open(SRC).convert("RGBA")

# We'll place the FS art centered on a square black canvas with padding
# Target: 256x256 master, then downscale for ICO sizes

def make_square_icon(src_img, size):
    """Place src centered on a square black canvas, scaled to fit with padding."""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 255))

    # Use 70% of canvas for the art, rest is padding
    usable = int(size * 0.75)
    
    # Scale src proportionally to fit in usable area
    src_w, src_h = src_img.size
    scale = min(usable / src_w, usable / src_h)
    new_w = max(1, int(src_w * scale))
    new_h = max(1, int(src_h * scale))
    
    resized = src_img.resize((new_w, new_h), Image.NEAREST if size <= 48 else Image.LANCZOS)
    
    # Center on canvas
    x = (size - new_w) // 2
    y = (size - new_h) // 2
    canvas.paste(resized, (x, y), resized)
    
    return canvas

# Generate all icon sizes
sizes = [256, 128, 64, 48, 32, 16]
icons = []
for s in sizes:
    icon = make_square_icon(src, s)
    icons.append(icon)
    # Also save individual PNGs for Linux
    png_dir = os.path.join(OUT_DIR, "icons")
    os.makedirs(png_dir, exist_ok=True)
    icon.save(os.path.join(png_dir, f"{s}x{s}.png"))

# Save ICO with all sizes
ico_path = os.path.join(OUT_DIR, "icon.ico")
icons[0].save(ico_path, format="ICO", sizes=[(s, s) for s in sizes], append_images=icons[1:])
print(f"Saved {ico_path} ({os.path.getsize(ico_path)} bytes)")

# Save 512x512 PNG for macOS/general use
master = make_square_icon(src, 512)
master.save(os.path.join(OUT_DIR, "icon.png"))
print(f"Saved icon.png (512x512)")

# Save 1024x1024 for macOS icns
master_large = make_square_icon(src, 1024)
master_large.save(os.path.join(OUT_DIR, "icon_1024.png"))
print("Done!")
