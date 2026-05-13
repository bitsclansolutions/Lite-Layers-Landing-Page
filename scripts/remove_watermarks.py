"""
Targeted removal of tiled semi-transparent watermarks (e.g. Magnific AI).
Strategy:
  1. Background deviation — watermark pixels deviate from their local surroundings
  2. HSV desaturation — watermark text is desaturated vs the coloured background
  3. Combine masks, morphologically clean, multi-pass inpaint
"""

import cv2
import numpy as np
from pathlib import Path
from PIL import Image

SCENES_DIR = Path(r"C:\Users\azhar\OneDrive\Desktop\General\Lite Layers Landing\public\scenes")
JPEG_QUALITY = 96


def load(path):
    """Load JPEG regardless of non-standard headers."""
    img = cv2.imread(str(path))
    if img is None:
        pil = Image.open(path).convert("RGB")
        img = cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)
    return img


def build_mask(img):
    h, w = img.shape[:2]
    mask = np.zeros((h, w), dtype=np.uint8)

    # ── Method 1: local background deviation ─────────────────────────────────
    # Compare to a VERY heavy blur (background estimate).
    # Real texture deviates smoothly; sharp text deviates abruptly.
    blur_big  = cv2.GaussianBlur(img, (81, 81), 0)
    blur_sml  = cv2.GaussianBlur(img, (5,  5),  0)
    diff_big  = np.abs(img.astype(np.int16) - blur_big.astype(np.int16)).max(axis=2)
    diff_sml  = np.abs(img.astype(np.int16) - blur_sml.astype(np.int16)).max(axis=2)
    # Watermark: large deviation from global bg BUT small deviation from local blur
    # (text edges are local sharp spikes, not broad texture waves)
    sharp_local = (diff_big > 28) & (diff_sml < 45)
    dev_mask = sharp_local.astype(np.uint8) * 255

    # ── Method 2: desaturation in HSV ────────────────────────────────────────
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    S, V = hsv[:, :, 1], hsv[:, :, 2]
    # Watermark text = very low saturation AND not pitch-black
    desat_mask = ((S < 22) & (V > 60)).astype(np.uint8) * 255

    # ── Combine both signals ──────────────────────────────────────────────────
    combined = cv2.bitwise_and(dev_mask, desat_mask)

    # Morphological close — connect letters in a word into a blob
    k_word = cv2.getStructuringElement(cv2.MORPH_RECT, (24, 5))
    closed = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, k_word)

    # ── Filter blobs: keep only text-shaped regions ───────────────────────────
    cnts, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for cnt in cnts:
        x, y, cw, ch = cv2.boundingRect(cnt)
        area   = cv2.contourArea(cnt)
        aspect = cw / max(ch, 1)
        fill   = area / max(cw * ch, 1)   # how densely filled the bounding rect is

        if area < 60:                      # noise
            continue
        if area > 0.04 * w * h:           # too large → background region, not text
            continue
        if aspect < 1.5:                   # text words are wide relative to height
            continue
        if fill < 0.25:                    # too sparse → scattered pixels, not solid text
            continue

        cv2.rectangle(mask,
                      (max(0, x - 5), max(0, y - 5)),
                      (min(w, x + cw + 5), min(h, y + ch + 5)),
                      255, -1)

    # Extra dilation for clean inpainting boundary
    k_dil = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    mask  = cv2.dilate(mask, k_dil, iterations=2)
    return mask


def inpaint_clean(img, mask):
    if not mask.any():
        return img
    # Two-pass: NS (texture-aware) then Telea (edge-preserving)
    r1 = cv2.inpaint(img,  mask, inpaintRadius=14, flags=cv2.INPAINT_NS)
    r2 = cv2.inpaint(r1,   mask, inpaintRadius=10, flags=cv2.INPAINT_TELEA)
    return r2


def process(path):
    img  = load(path)
    h, w = img.shape[:2]

    mask    = build_mask(img)
    pct     = 100 * mask.astype(bool).sum() / (h * w)
    cleaned = inpaint_clean(img, mask)

    cv2.imwrite(str(path), cleaned, [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY])
    status = f"masked {pct:.1f}% of pixels" if mask.any() else "no watermark detected"
    print(f"  {path.name:28s} {w}x{h}   {status}")


if __name__ == "__main__":
    files = sorted(SCENES_DIR.glob("*.jpg"))
    print(f"Removing watermarks from {len(files)} images...\n")
    for f in files:
        process(f)
    print("\nDone.")
