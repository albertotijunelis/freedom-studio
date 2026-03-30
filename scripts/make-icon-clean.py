"""Generate a clean, professional Freedom Studio icon.
Bold 'FS' monogram on dark background with neon green accent.
"""
from PIL import Image, ImageDraw, ImageFont
import os
import sys

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "apps", "desktop", "build")
os.makedirs(OUT_DIR, exist_ok=True)
ICONS_DIR = os.path.join(OUT_DIR, "icons")
os.makedirs(ICONS_DIR, exist_ok=True)

# Colors
BG = (8, 8, 8, 255)
GREEN = (0, 255, 136, 255)
GREEN_DIM = (0, 180, 96, 255)

def make_icon(size):
    """Create a clean FS icon at the given size."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw rounded rectangle background
    margin = max(1, size // 16)
    r = max(2, size // 6)  # corner radius
    draw.rounded_rectangle(
        [margin, margin, size - margin - 1, size - margin - 1],
        radius=r,
        fill=BG,
        outline=GREEN_DIM,
        width=max(1, size // 64)
    )
    
    # Try to load a bold monospace font
    font_size = int(size * 0.48)
    font = None
    
    # Try common bold monospace fonts
    font_paths = [
        "C:/Windows/Fonts/consolab.ttf",   # Consolas Bold
        "C:/Windows/Fonts/courbd.ttf",      # Courier New Bold
        "C:/Windows/Fonts/lucon.ttf",       # Lucida Console
        "C:/Windows/Fonts/consola.ttf",     # Consolas Regular
        "C:/Windows/Fonts/cour.ttf",        # Courier New
    ]
    
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                font = ImageFont.truetype(fp, font_size)
                break
            except Exception:
                continue
    
    if font is None:
        font = ImageFont.load_default()
    
    text = "FS"
    
    # Get text bounding box
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    
    # Center text
    x = (size - tw) // 2 - bbox[0]
    y = (size - th) // 2 - bbox[1]
    
    # Draw glow effect (larger sizes only)
    if size >= 64:
        for dx in range(-2, 3):
            for dy in range(-2, 3):
                if dx == 0 and dy == 0:
                    continue
                draw.text((x + dx, y + dy), text, font=font, fill=(0, 255, 136, 40))
    
    # Draw the text
    draw.text((x, y), text, font=font, fill=GREEN)
    
    # Add a subtle bottom accent line
    line_y = size - margin - max(2, size // 16)
    line_margin = size // 4
    draw.line(
        [(line_margin, line_y), (size - line_margin, line_y)],
        fill=GREEN_DIM,
        width=max(1, size // 64)
    )
    
    return img

# Generate all sizes
sizes = [256, 128, 64, 48, 32, 16]
icons = {}
for s in sizes:
    icon = make_icon(s)
    icons[s] = icon
    icon.save(os.path.join(ICONS_DIR, f"{s}x{s}.png"))

# Save ICO (Windows) - needs specific sizes
ico_path = os.path.join(OUT_DIR, "icon.ico")
icons[256].save(
    ico_path,
    format="ICO",
    sizes=[(s, s) for s in sizes],
    append_images=[icons[s] for s in sizes[1:]]
)
print(f"Saved {ico_path} ({os.path.getsize(ico_path)} bytes)")

# Save PNG (512) for general use
icon_512 = make_icon(512)
icon_512.save(os.path.join(OUT_DIR, "icon.png"))
print(f"Saved icon.png (512x512)")

# Preview the 256 version
print(f"Saved {len(sizes)} sizes to {ICONS_DIR}")
print("Done!")
