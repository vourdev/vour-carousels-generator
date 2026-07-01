#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════╗
║              HTML SLIDE EXPORTER — by @vourdev                      ║
║  Converts HTML carousel slides → individual HD PNG images            ║
║                                                                      ║
║  Requirements:                                                       ║
║    pip install playwright                                            ║
║    playwright install chromium                                       ║
╚══════════════════════════════════════════════════════════════════════╝

Usage:
    python html_slide_exporter.py slides.html
    python html_slide_exporter.py slides.html --scale 3 --out ./exports
    python html_slide_exporter.py slides.html --selector ".card" --format jpg
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
    scale: int = 2,
    fmt: str = "png",
    quality: int = 95,
    prefix: str = "slide",
    viewport_w: int = 1400,
    viewport_h: int = 2200,
    wait_ms: int = 1500,
    timeout: int = 30_000,
) -> list[Path]:
    """
    Screenshot every element matching `selector` in the HTML file.

    Parameters
    ----------
    html_file   : Path to the HTML file.
    output_dir  : Folder where images will be saved.
    selector    : CSS selector that identifies each slide (default: ".slide").
    scale       : Device pixel ratio for HD output.
                  1 = original size  (e.g. 1080 × 1920)
                  2 = 2× HD          (e.g. 2160 × 3840)  ← recommended
                  3 = 3× Ultra HD    (e.g. 3240 × 5760)
    fmt         : Output format — "png" (lossless) or "jpg" (smaller file).
    quality     : JPEG quality 1–100 (ignored for PNG).
    prefix      : Filename prefix, e.g. "slide" → slide_01.png
    viewport_w  : Browser viewport width  (px, before scale).
    viewport_h  : Browser viewport height (px, before scale).
    wait_ms     : Extra milliseconds to wait after page load
                  (gives web fonts / icons time to render).
    timeout     : Page load timeout in milliseconds.

    Returns
    -------
    List of Path objects pointing to the saved images.
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
    print(f"  Format   : {fmt.upper()}")
    print(f"  Output   : {out_dir.resolve()}")
    print(f"{'─'*55}\n")

    saved: list[Path] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            # Remove headless=False if you don't want to see the browser window
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )

        page = browser.new_page(
            viewport={"width": viewport_w, "height": viewport_h},
            # device_scale_factor is the key to HD output:
            # the browser renders at scale× the logical resolution
            device_scale_factor=scale,
        )

        # Load the HTML file (file:// URL keeps relative paths working)
        url = f"file://{src}"
        print(f"  Loading: {url}")

        try:
            page.goto(url, wait_until="networkidle", timeout=timeout)
        except PWTimeout:
            # networkidle may timeout on pages with long-polling; try domcontentloaded
            print("  ⚠  networkidle timed out — falling back to domcontentloaded")
            page.goto(url, wait_until="domcontentloaded", timeout=timeout)

        # Extra wait for web fonts & icon CDNs to finish rendering
        if wait_ms > 0:
            print(f"  Waiting {wait_ms} ms for fonts / icons to render…")
            page.wait_for_timeout(wait_ms)

        # Locate slides
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
        epilog="""
Examples
────────
  # Basic — export all .slide elements at 2× HD (default)
  python html_slide_exporter.py my_carousel.html

  # Ultra HD 3× output, saved to a custom folder
  python html_slide_exporter.py my_carousel.html --scale 3 --out ./exports

  # Different CSS selector
  python html_slide_exporter.py deck.html --selector ".card"

  # JPEG output (smaller files), quality 90
  python html_slide_exporter.py slides.html --format jpg --quality 90

  # Custom filename prefix and wait time for slow CDN fonts
  python html_slide_exporter.py slides.html --prefix tutorial --wait 3000

Output resolution guide
───────────────────────
  --scale 1  →  original design size  (e.g. 1080 × 1920)
  --scale 2  →  2× / Full 4K portrait  (e.g. 2160 × 3840)  ← default
  --scale 3  →  3× / Ultra HD          (e.g. 3240 × 5760)
        """,
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
        default="png",
        help="Image format — png (lossless, default) or jpg (smaller)",
    )
    p.add_argument(
        "--quality", "-q",
        type=int,
        default=95,
        metavar="1-100",
        help="JPEG quality 1–100, ignored for PNG (default: 95)",
    )
    p.add_argument(
        "--prefix", "-p",
        default="slide",
        help="Filename prefix, e.g. 'slide' → slide_01.png (default: slide)",
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
