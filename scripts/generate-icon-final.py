"""Generate all icon formats from the FS-icon.png source."""
from PIL import Image
import os

SRC = r"C:\Users\alber\Downloads\FS-icon.png"
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "apps", "desktop", "build")
ICONS_DIR = os.path.join(OUT_DIR, "icons")
os.makedirs(ICONS_DIR, exist_ok=True)

src = Image.open(SRC).convert("RGBA")

# ICO sizes (Windows)
ico_sizes = [256, 128, 64, 48, 32, 16]
ico_images = []
for s in ico_sizes:
    resized = src.resize((s, s), Image.LANCZOS)
    ico_images.append(resized)
    resized.save(os.path.join(ICONS_DIR, f"{s}x{s}.png"))

# Save ICO
ico_path = os.path.join(OUT_DIR, "icon.ico")
ico_images[0].save(
    ico_path,
    format="ICO",
    sizes=[(s, s) for s in ico_sizes],
    append_images=ico_images[1:]
)
print(f"icon.ico: {os.path.getsize(ico_path)} bytes")

# Save PNG for Electron (512x512)
png_512 = src.resize((512, 512), Image.LANCZOS)
png_512.save(os.path.join(OUT_DIR, "icon.png"))
print("icon.png: 512x512")

# Save 1024x1024 for macOS
png_1024 = src.resize((1024, 1024), Image.LANCZOS)
png_1024.save(os.path.join(OUT_DIR, "icon_1024.png"))
print("icon_1024.png: 1024x1024")

# Copy source as master
src.save(os.path.join(OUT_DIR, "icon_master.png"))
print("All icons generated!")
