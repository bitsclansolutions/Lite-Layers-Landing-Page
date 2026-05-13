"""
Processes all scene images:
  1. Detects and removes watermarks (text/logo overlays) using OpenCV inpainting
  2. Upscales to 4K (3840x2160) with Lanczos + unsharp-mask sharpening
"""

import cv2
import numpy as np
from pathlib import Path

SCENES_DIR = Path(r"C:\Users\azhar\OneDrive\Desktop\General\Lite Layers Landing\public\scenes")
TARGET_W, TARGET_H = 3840, 2160
JPEG_QUALITY = 96


def remove_watermark(img):
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    mask = np.zeros((h, w), dtype=np.uint8)

    # --- pass 1: scan bottom 30% for bright text (light watermarks on dark/mid bg) ---
    roi_y = int(h * 0.70)
    roi = gray[roi_y:, :]
    _, bright = cv2.threshold(roi, 180, 255, cv2.THRESH_BINARY)
    k_close = cv2.getStructuringElement(cv2.MORPH_RECT, (18, 3))
    bright_closed = cv2.morphologyEx(bright, cv2.MORPH_CLOSE, k_close)
    cnts, _ = cv2.findContours(bright_closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for cnt in cnts:
        x, y, cw, ch = cv2.boundingRect(cnt)
        if cw / max(ch, 1) > 2.5 and 80 < cv2.contourArea(cnt) < 60000:
            cv2.rectangle(mask, (x - 6, roi_y + y - 6), (x + cw + 6, roi_y + y + ch + 6), 255, -1)

    # --- pass 2: scan full image for dark text on light bg (dark watermarks) ---
    _, dark = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    dark_closed = cv2.morphologyEx(dark, cv2.MORPH_CLOSE, k_close)
    cnts2, _ = cv2.findContours(dark_closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for cnt in cnts2:
        x, y, cw, ch = cv2.boundingRect(cnt)
        # Only very wide, thin strips — typical of watermark text
        if cw / max(ch, 1) > 5 and ch < h * 0.04 and cv2.contourArea(cnt) < 30000:
            cv2.rectangle(mask, (x - 4, y - 4), (x + cw + 4, y + ch + 4), 255, -1)

    if mask.any():
        result = cv2.inpaint(img, mask, inpaintRadius=7, flags=cv2.INPAINT_TELEA)
        watermark_px = int(mask.any(axis=1).sum())
        return result, watermark_px
    return img, 0


def upscale_4k(img):
    h, w = img.shape[:2]
    scale = min(TARGET_W / w, TARGET_H / h)
    if scale <= 1.0:
        # Already large enough — just sharpen
        up = img.copy()
    else:
        new_w, new_h = int(w * scale), int(h * scale)
        up = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)

    # Unsharp mask: adds crisp detail after upscaling
    blur = cv2.GaussianBlur(up, (0, 0), sigmaX=2.0)
    sharpened = cv2.addWeighted(up, 1.45, blur, -0.45, 0)
    return sharpened


def process(path):
    img = cv2.imread(str(path))
    if img is None:
        print(f"  [SKIP] could not read {path.name}")
        return

    h0, w0 = img.shape[:2]

    # Step 1 — watermark removal
    cleaned, wm_rows = remove_watermark(img)
    wm_note = f"removed ~{wm_rows} rows" if wm_rows else "none detected"

    # Step 2 — upscale to 4K
    final = upscale_4k(cleaned)
    h1, w1 = final.shape[:2]

    cv2.imwrite(str(path), final, [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY])
    print(f"  {path.name:30s}  {w0}x{h0} -> {w1}x{h1}   watermark: {wm_note}")


if __name__ == "__main__":
    files = sorted(SCENES_DIR.glob("*.jpg"))
    print(f"Processing {len(files)} scene images...\n")
    for f in files:
        process(f)
    print("\nDone.")
