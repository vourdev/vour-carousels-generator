#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════╗
║              HTML SLIDE EXPORTER — by @vourdev                      ║
║  Converts HTML carousel slides → individual HD JPG/PNG images        ║
║                                                                      ║
║  Requirements:                                                       ║
║    pip install playwright                                            ║
║    playwright install chromium                                       ║
╚══════════════════════════════════════════════════════════════════════╝

Usage:
    python html_slide_exporter.py slides.html
    python html_slide_exporter.py slides.html --scale 2 --out ./exports
    python html_slide_exporter.py --help
"""

import argparse
import sys
import time
from pathlib import Path


# ── Dependency check ──────────────────────────────────────────────────────────
def check_deps():
    missing = []
    try:
        import playwright  # noqa: F401
    except ImportError:
        missing.append("playwright")

    if missing:
        print("❌ Missing dependencies. Install with:")
        print(f"   pip install {' '.join(missing)}")
        print("   playwright install chromium")
        sys.exit(1)


# ── Core exporter ─────────────────────────────────────────────────────────────
def export_slides(
    html_file: str,
    output_dir: str | None = None,
    selector: str = ".slide",
    scale: int = 2,           # Tetap di scale 2 agar HD, aman karena sekarang JPG
    fmt: str = "jpg",         # Default diubah ke jpg untuk API Buffer
    quality: int = 85,        # Kompresi 85 sangat optimal untuk size vs visual
    prefix: str = "slide",
    viewport_w: int = 1400,
    viewport_h: int = 2200,
    wait_ms: int = 1500,
    timeout: int = 30_000,
) -> list[Path]:
    """
    Screenshot every element matching `selector` in the HTML file.
    """
    from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

    src = Path(html_file).resolve()
    if not src.exists():
        raise FileNotFoundError(f"HTML file not found: {src}")

    if output_dir is None:
        output_dir = src.stem
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n{'─'*55}")
    print(f"  HTML Slide Exporter")
    print(f"{'─'*55}")
    print(f"  Source   : {src.name}")
    print(f"  Selector : {selector}")
    print(f"  Scale    : {scale}× ({scale}x HD output)")
    print(f"  Format   : {fmt.upper()} (Quality: {quality if fmt == 'jpg' else 'Lossless'})")
    print(f"  Output   : {out_dir.resolve()}")
    print(f"{'─'*55}\n")

    saved: list[Path] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )

        page = browser.new_page(
            viewport={"width": viewport_w, "height": viewport_h},
            device_scale_factor=scale,
        )

        url = f"file://{src}"
        print(f"  Loading: {url}")

        try:
            page.goto(url, wait_until="networkidle", timeout=timeout)
        except PWTimeout:
            print("  ⚠  networkidle timed out — falling back to domcontentloaded")
            page.goto(url, wait_until="domcontentloaded", timeout=timeout)

        if wait_ms > 0:
            print(f"  Waiting {wait_ms} ms for fonts / icons to render…")
            page.wait_for_timeout(wait_ms)

        slides = page.query_selector_all(selector)
        total = len(slides)

        if total == 0:
            print(f"\n❌  No elements found matching '{selector}'.")
            print("    Check that the selector matches your HTML structure.")
            browser.close()
            return []

        print(f"  Found {total} slide(s)\n")

        for i, slide in enumerate(slides, 1):
            name = f"{prefix}_{i:02d}.{fmt}"
            dest = out_dir / name

            screenshot_kwargs: dict = {"path": str(dest)}
            if fmt == "jpg":
                screenshot_kwargs["type"] = "jpeg"
                screenshot_kwargs["quality"] = quality
            else:
                screenshot_kwargs["type"] = "png"

            slide.screenshot(**screenshot_kwargs)

            # Compute actual pixel dimensions
            box = slide.bounding_box()
            if box:
                w = int(box["width"] * scale)
                h = int(box["height"] * scale)
                size_kb = dest.stat().st_size // 1024
                print(f"  [{i:02d}/{total}] {name}  —  {w}×{h} px  ({size_kb} KB)")
            else:
                print(f"  [{i:02d}/{total}] {name}")

            saved.append(dest)

        browser.close()

    print(f"\n✅  {len(saved)} image(s) saved → {out_dir.resolve()}\n")
    return saved


# ── CLI ───────────────────────────────────────────────────────────────────────
def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="html_slide_exporter",
        description="Export HTML carousel slides as individual HD images.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    p.add_argument("html_file", help="Path to the HTML file containing the slides.")

    p.add_argument(
        "--out", "-o",
        default=None,
        metavar="DIR",
        help="Output directory (default: HTML filename without extension)",
    )
    p.add_argument(
        "--selector", "-s",
        default=".slide",
        metavar="CSS",
        help="CSS selector to identify each slide (default: .slide)",
    )
    p.add_argument(
        "--scale", "-x",
        type=int,
        choices=[1, 2, 3, 4],
        default=2,
        metavar="N",
        help="Device pixel ratio for HD rendering: 1 / 2 / 3 / 4 (default: 2)",
    )
    p.add_argument(
        "--format", "-f",
        dest="fmt",
        choices=["png", "jpg"],
        default="jpg", # Default diubah ke JPG
        help="Image format — png (lossless) or jpg (smaller, default)",
    )
    p.add_argument(
        "--quality", "-q",
        type=int,
        default=85, # Default diubah ke 85
        metavar="1-100",
        help="JPEG quality 1–100, ignored for PNG (default: 85)",
    )
    p.add_argument(
        "--prefix", "-p",
        default="slide",
        help="Filename prefix, e.g. 'slide' → slide_01.jpg (default: slide)",
    )
    p.add_argument(
        "--wait", "-w",
        type=int,
        default=1500,
        metavar="MS",
        help="Extra milliseconds to wait after page load for fonts/icons (default: 1500)",
    )
    p.add_argument(
        "--viewport-w",
        type=int,
        default=1400,
        help="Viewport width before scaling (default: 1400)",
    )
    p.add_argument(
        "--viewport-h",
        type=int,
        default=2200,
        help="Viewport height before scaling (default: 2200)",
    )
    p.add_argument(
        "--timeout",
        type=int,
        default=30000,
        metavar="MS",
        help="Page load timeout in ms (default: 30000)",
    )

    return p


def main():
    check_deps()
    parser = build_parser()
    args = parser.parse_args()

    start = time.perf_counter()

    export_slides(
        html_file=args.html_file,
        output_dir=args.out,
        selector=args.selector,
        scale=args.scale,
        fmt=args.fmt,
        quality=args.quality,
        prefix=args.prefix,
        viewport_w=args.viewport_w,
        viewport_h=args.viewport_h,
        wait_ms=args.wait,
        timeout=args.timeout,
    )

    elapsed = time.perf_counter() - start
    print(f"  Total time: {elapsed:.1f}s")


if __name__ == "__main__":
    main()