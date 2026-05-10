"""Resize the no-bullet-holes Variant B (transparent) for web use as
public/logos/discordmaxxer.png. 256x256 is plenty for the sidebar (24px) and
header (52px) renders, and the file stays under 50 KB."""
from __future__ import annotations
import os
from PIL import Image

HERE = os.path.dirname(__file__)
SRC = os.path.join(
    HERE, "..", "..", "discordmaxxer", "branding", "generated",
    "v0.5.6-icon-variant-B-TRANSPARENT.png"
)
OUT = os.path.join(HERE, "..", "public", "logos", "discordmaxxer.png")

img = Image.open(SRC).convert("RGBA")
# Tight bbox to fill the slot edge-to-edge — the source already has 5%
# padding from strip-cream-bg.py, so we crop again to the bbox.
bbox = img.getbbox()
if bbox is None:
    raise RuntimeError("source has no opaque pixels")
cropped = img.crop(bbox)
side = max(cropped.size)
square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
ox = (side - cropped.width) // 2
oy = (side - cropped.height) // 2
square.paste(cropped, (ox, oy), cropped)
resized = square.resize((256, 256), Image.LANCZOS)
resized.save(OUT, optimize=True)
print(f"wrote {OUT} -> 256x256, {os.path.getsize(OUT)} bytes")
