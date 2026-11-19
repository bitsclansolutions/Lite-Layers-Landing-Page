"""Turn the SEO/AEO keyword sheet into src/data/seo-pages.json.

Usage:
    python scripts/build_seo_data.py "C:/path/to/Litelayers SEO AEO Keywords US Based.xlsx"

Rules applied on top of the sheet:
  * Every keyword gets "free" at the start (primary, alt phrasing, AI variant,
    head term and every secondary keyword).
  * Meta titles and H1s start with "Free". Verb-led ones ("Change...", "Remove...")
    become "Free Tool to Change...", and guides become "Free Guide: ..." unless the
    text already says "Guide".
  * The brand is written "Lite Layers" everywhere, to match the rest of the site.
  * A title that grows past 60 characters drops its " | Lite Layers" suffix.

Re-run this whenever the sheet changes; the pages pick up the new JSON on the next build.
"""
import json
import re
import sys
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "data" / "seo-pages.json"
BRAND = "Lite Layers"
VERB_LED = ("Change ", "Remove ")


def brand(text):
    return re.sub(r"\bLitelayers\b", BRAND, text or "").strip()


def free_kw(kw):
    kw = (kw or "").strip()
    if not kw:
        return kw
    return kw if kw.lower().startswith("free ") else f"free {kw}"


def free_heading(text, page_type=None):
    text = brand(text)
    if text.lower().startswith("free"):
        return text
    if text.startswith(VERB_LED):
        return f"Free Tool to {text}"
    if page_type == "Guide" and "Guide" not in text.split("|")[0]:
        return f"Free Guide: {text}"
    return f"Free {text}"


def free_title(text, page_type=None):
    title = free_heading(text, page_type)
    suffix = f" | {BRAND}"
    if len(title) > 60 and title.endswith(suffix):
        title = title[: -len(suffix)]
    return title


def split_list(value):
    return [v.strip() for v in str(value or "").split(";") if v.strip()]


def read_sheet(wb, name):
    rows = list(wb[name].iter_rows(values_only=True))
    header = rows[0]
    return [dict(zip(header, r)) for r in rows[1:] if r and r[0]]


def slugify(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def main(xlsx):
    wb = openpyxl.load_workbook(xlsx, data_only=True)

    products = []
    for r in read_sheet(wb, "Product Pages"):
        h1 = brand(r["H1"])
        products.append({
            "id": r["ID"],
            "kind": "product",
            "category": r["Category"],
            "categoryId": slugify(r["Category"]),
            "subcategory": r["Subcategory"],
            "product": r["Target Product"],
            # "Perfume Background Generator" -> "Perfume"
            "productName": h1.replace(" Background Generator", ""),
            "primaryKeyword": free_kw(r["Primary Keyword"]),
            "altPhrasing": free_kw(r["Alt Phrasing"]),
            "aiVariant": free_kw(r["AI Variant"]),
            "headTerm": free_kw(r["Head Term (supporting)"]),
            "secondaryKeywords": [free_kw(k) for k in split_list(r["Secondary Keywords"])],
            "intent": r["Intent"],
            "slug": r["Slug"],
            "metaTitle": free_title(r["Meta Title"]),
            "metaDescription": brand(r["Meta Description"]),
            "h1": free_heading(h1),
            "faqs": [
                {"q": brand(r["AEO Question"]), "a": brand(r["AEO Answer"])},
                {"q": brand(r["FAQ 2 Question"]), "a": brand(r["FAQ 2 Answer"])},
                {"q": brand(r["FAQ 3 Question"]), "a": brand(r["FAQ 3 Answer"])},
            ],
            "scenes": split_list(r["Featured Scenes"]),
            "variants": split_list(r["Related Products (on-page)"]),
            "contentAngle": brand(r["Content Angle"]),
            "internalLinks": split_list(r["Internal Links"]),
            "priority": r["Priority"],
        })

    hubs = []
    for r in read_sheet(wb, "Hub Pages"):
        hubs.append({
            "id": r["ID"],
            "kind": "hub",
            "type": r["Page Type"],
            "primaryKeyword": free_kw(r["Primary Keyword"]),
            "secondaryKeywords": [free_kw(k) for k in split_list(r["Secondary Keywords"])],
            "intent": r["Intent"],
            "slug": r["Slug"],
            "metaTitle": free_title(r["Meta Title"], r["Page Type"]),
            "metaDescription": brand(r["Meta Description"]),
            "h1": free_heading(r["H1"], r["Page Type"]),
            "faqs": [{"q": brand(r["AEO Question"]), "a": brand(r["AEO Answer"])}],
            "linksTo": brand(r["Links To"]),
            "priority": r["Priority"],
        })

    slugs = [p["slug"] for p in products + hubs]
    dupes = {s for s in slugs if slugs.count(s) > 1}
    if dupes:
        sys.exit(f"Duplicate slugs in sheet: {sorted(dupes)}")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"products": products, "hubs": hubs}, indent=2, ensure_ascii=False) + "\n",
                   encoding="utf-8")

    long_titles = [p["metaTitle"] for p in products + hubs if len(p["metaTitle"]) > 60]
    print(f"Wrote {len(products)} product pages and {len(hubs)} hub pages to {OUT}")
    if long_titles:
        print("Titles over 60 characters:", *long_titles, sep="\n  ")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
