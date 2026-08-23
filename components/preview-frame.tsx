"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SLIDE_W = 1080;
const SLIDE_H = 1350;

/** Strip thumbnail width. 4:5 makes it 90px tall, past the 40px floor for a dense desktop hit area. */
const THUMB_W = 72;
const THUMB_H = (THUMB_W * SLIDE_H) / SLIDE_W;

/** Gap between grid tiles, in px. Kept in JS because the tile scale is computed from it. */
const GRID_GAP = 12;

export type PreviewMode = "single" | "grid";

/**
 * One viewport onto the assembled deck.
 *
 * Every view of a slide — the big preview, a strip thumbnail, a grid tile — is this: an
 * iframe holding the *same* deck HTML, scaled and translated so one slide fills the frame.
 * No view re-renders or screenshots anything of its own, so a revision that changes `html`
 * updates all of them in the same commit, with nothing to invalidate by hand.
 *
 * Measured at roughly 25 ms per extra frame for an 8-slide deck (9 frames ≈ 300 ms to
 * painted). That is affordable because Chromium shares decoded font and image data across
 * same-origin srcdoc documents — 85% of the deck's 1.1 MB is inlined base64 fonts, which
 * would otherwise be decoded once per copy. It also holds at full height: an iframe as tall
 * as the whole deck costs the same as one clipped to a single slide, since offscreen slides
 * are laid out but never painted.
 */
function SlideView({
  html,
  index,
  slideCount,
  width,
  label,
}: {
  html: string;
  index: number;
  slideCount: number;
  /** Rendered width in px. The scale is this over the deck's native 1080. */
  width: number;
  /** Announced name. Omit where a wrapping control already carries the label. */
  label?: string;
}) {
  const scale = width / SLIDE_W;
  return (
    <iframe
      title={label ?? ""}
      aria-hidden={label ? undefined : true}
      tabIndex={-1}
      srcDoc={html}
      style={{
        width: SLIDE_W,
        height: SLIDE_H * slideCount,
        border: 0,
        transform: `scale(${scale}) translateY(-${index * SLIDE_H}px)`,
        transformOrigin: "top left",
        // Every view is pinned to one slide for its lifetime — moving between slides is the
        // scroller's job now, so there is no transform left to animate here.
        transitionProperty: "none",
        // Clicks belong to the thumbnail or tile wrapping this, not to the document inside.
        pointerEvents: "none",
      }}
    />
  );
}

/**
 * Is the keystroke destined for something the user is typing into?
 *
 * Arrow keys move the caret in every text field on this screen — the chat composer most of
 * all, where a revision request is a paragraph of Indonesian. Stealing them for slide
 * navigation would make the field unusable, so navigation only claims a key that nothing
 * else wants. Listbox and menu roles are included because Radix drives its own selects and
 * dropdowns with the same keys.
 */
function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.closest !== "function") return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  return !!el.closest('[role="listbox"],[role="menu"],[role="combobox"],[role="option"],[role="menuitem"]');
}

/**
 * The deck preview: one slide up close, the whole deck at a glance, or every slide at once.
 *
 * `mode` is controlled from the wizard because the toggle lives in the artifact panel's tab
 * bar, alongside Brief/Slide/Gambar/Jadwal, rather than inside this card.
 */
export function PreviewFrame({
  html,
  slideCount,
  maxWidthClass = "max-w-[540px]",
  mode = "single",
  onModeChange,
}: {
  html: string;
  slideCount: number;
  /** Cap on the rendered slide width. Overridden where the panel is user-resizable,
      since a fixed cap would make dragging the divider wider do nothing. */
  maxWidthClass?: string;
  mode?: PreviewMode;
  onModeChange?: (m: PreviewMode) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rafRef = useRef(0);
  /** Pane a programmatic scroll is flying towards, or null when the track is the user's. */
  const pendingRef = useRef<number | null>(null);
  const settleRef = useRef(0);
  /**
   * Where navigation is headed, updated synchronously.
   *
   * `currentSlide` is a render away and a smooth scroll animates, so neither state nor
   * `scrollLeft` is current when a second arrow key arrives 40 ms after the first. Holding
   * an arrow key down has to walk the deck, not fire the same jump repeatedly.
   */
  const targetRef = useRef(0);

  const [box, setBox] = useState({ w: 0, h: 0 });
  const [gridWidth, setGridWidth] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Both dimensions, because the slide is fitted to the smaller of the two. Width alone
  // made a 720px-wide panel render a 900px-tall slide, which pushed the strip and the
  // counter below the fold — the two controls the strip exists to sit next to.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    setBox({ w: r.width || el.offsetWidth || 540, h: r.height || el.offsetHeight || 0 });

    const ro = new ResizeObserver((entries) => {
      const { width: w, height: h } = entries[0].contentRect;
      if (w > 0) setBox({ w, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [mode]);

  // The grid measures its own container rather than each tile: one observer, and the tile
  // width is then exact, which a `repeat(auto-fill, …)` track would only be approximately.
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    setGridWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (w > 0) setGridWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [mode]);

  // A revision can drop a slide out from under the view, so the index is clamped where it
  // is read rather than corrected by an effect — the effect would render once with an index
  // that points past the end before fixing it.
  const current = slideCount > 0 ? Math.min(currentSlide, slideCount - 1) : 0;

  /* ── Which slide is showing is the scroll position ────────────────────────────
   * The big view is a horizontal scroll-snap track, one pane per slide, the way the deck
   * is actually read on Instagram and TikTok: a trackpad swipe moves it, and it settles on
   * a slide rather than between two. Everything that navigates — a thumbnail, an arrow
   * key, a grid tile — scrolls the track, and the track reports back which pane it landed
   * on. One direction of truth, so a user swipe and a programmatic jump cannot disagree. */
  const scrollToPane = useCallback((i: number, behavior: ScrollBehavior = "smooth") => {
    const el = scrollerRef.current;
    if (!el || !el.clientWidth) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const instant = reduced || behavior === "auto";

    // A smooth scroll animates through every pane between here and there, and each frame
    // of it fires `onScroll`. Left unguarded, those readings walk the index backwards while
    // the animation is still running — hold an arrow key and the deck stalls two slides in,
    // because the fifth keypress reads position 6 and asks for 5 again. So a programmatic
    // scroll declares where it is going, and readings are ignored until it arrives.
    if (!instant && Math.round(el.scrollLeft / el.clientWidth) !== i) {
      pendingRef.current = i;
      clearTimeout(settleRef.current);
      // If the user grabs the track mid-flight the scroll never reaches its target, so the
      // claim expires rather than deafening the track to them.
      settleRef.current = window.setTimeout(() => {
        pendingRef.current = null;
      }, 900);
    }
    el.scrollTo({ left: i * el.clientWidth, behavior: instant ? "auto" : behavior });
  }, []);

  const go = useCallback(
    (i: number) => {
      const next = Math.max(0, Math.min(slideCount - 1, i));
      targetRef.current = next;
      setCurrentSlide(next);
      scrollToPane(next);
    },
    [slideCount, scrollToPane]
  );

  /**
   * A grid tile: pick the slide, then drop back to reading it.
   *
   * Deliberately not `go` — the track does not exist yet in grid mode, so there is nothing
   * to scroll. Recording the target is enough: the realign effect below scrolls the track
   * to it the moment single view mounts.
   */
  const openSlide = useCallback(
    (i: number) => {
      const next = Math.max(0, Math.min(slideCount - 1, i));
      targetRef.current = next;
      setCurrentSlide(next);
      onModeChange?.("single");
    },
    [slideCount, onModeChange]
  );

  const onScroll = useCallback(() => {
    // Coalesced to one read per frame: a smooth scroll fires this dozens of times, and each
    // one would otherwise re-render every thumbnail to move a highlight one place.
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const el = scrollerRef.current;
      if (!el || !el.clientWidth) return;
      const i = Math.round(el.scrollLeft / el.clientWidth);
      if (i < 0 || i >= slideCount) return;

      const pending = pendingRef.current;
      if (pending !== null) {
        // Mid-flight frames of our own scroll. Only its arrival counts.
        if (i !== pending) return;
        pendingRef.current = null;
        clearTimeout(settleRef.current);
      }
      targetRef.current = i;
      setCurrentSlide(i);
    });
  }, [slideCount]);

  useEffect(() => {
    const raf = rafRef;
    const settle = settleRef;
    return () => {
      cancelAnimationFrame(raf.current);
      clearTimeout(settle.current);
    };
  }, []);

  // Realign after anything that invalidates pane width — coming back from the grid, or the
  // user dragging the split handle. Reads the index through a ref so this never runs in
  // response to the user's own scrolling, which would fight them mid-swipe.
  useEffect(() => {
    if (mode !== "single") return;
    scrollToPane(targetRef.current, "auto");
  }, [mode, box.w, slideCount, scrollToPane]);

  /* ── Keyboard navigation ──────────────────────────────────────────────────────
   * Single view only: in the grid every slide is already on screen, so a "previous"
   * has nothing to mean. */
  useEffect(() => {
    if (mode !== "single") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      // A modifier means the chord belongs to the browser or the OS (word-jump, history).
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      go(targetRef.current + (e.key === "ArrowRight" ? 1 : -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, go]);

  // Keep the active thumbnail in view. Done on the strip's own scrollLeft rather than
  // scrollIntoView, which would also scroll the panel behind it.
  useEffect(() => {
    const strip = stripRef.current;
    const el = thumbRefs.current[current];
    if (!strip || !el) return;
    const left = el.offsetLeft;
    const right = left + el.offsetWidth;
    if (left < strip.scrollLeft) {
      strip.scrollTo({ left: Math.max(0, left - 8), behavior: "smooth" });
    } else if (right > strip.scrollLeft + strip.clientWidth) {
      strip.scrollTo({ left: right - strip.clientWidth + 8, behavior: "smooth" });
    }
  }, [current, mode]);

  // Fit, not fill: whichever of the two axes runs out first sets the scale.
  const fit = box.h > 0 ? Math.min(box.w / SLIDE_W, box.h / SLIDE_H) : box.w / SLIDE_W;
  const slideW = Math.floor(SLIDE_W * fit);
  const slideH = Math.floor(SLIDE_H * fit);
  const ready = slideW > 0 && !!html;
  const slides = Array.from({ length: slideCount }, (_, i) => i);

  /* ── Grid overview ─────────────────────────────────────────────────────────── */
  if (mode === "grid") {
    const cols = gridWidth < 380 ? 2 : gridWidth < 640 ? 3 : 4;
    const tileW = Math.max(1, Math.floor((gridWidth - GRID_GAP * (cols - 1)) / cols));

    return (
      <Card className="w-full max-h-full">
        <CardContent className="p-4 flex flex-col gap-3 flex-1 min-h-0">
          <div
            ref={gridRef}
            className="grid w-full flex-1 min-h-0 overflow-y-auto content-start"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: GRID_GAP }}
          >
            {gridWidth > 0 &&
              slides.map((i) => (
                <button
                  key={i}
                  type="button"
                  // The rule flags any call reaching a ref, without distinguishing when. This
                  // one runs on click and never during render; the same call from the strip
                  // below is not flagged, which is what makes it a heuristic rather than a
                  // finding.
                  // eslint-disable-next-line react-hooks/refs
                  onClick={() => openSlide(i)}
                  aria-label={`Buka slide ${i + 1}`}
                  aria-current={i === current}
                  className={`relative overflow-hidden rounded-lg bg-white transition-[box-shadow,transform] duration-150 ease-out active:scale-[0.96] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                    i === current
                      ? "ring-2 ring-primary"
                      : "ring-1 ring-foreground/10 hover:ring-foreground/25"
                  }`}
                  style={{ height: (tileW * SLIDE_H) / SLIDE_W }}
                >
                  {html ? (
                    <SlideView html={html} index={i} slideCount={slideCount} width={tileW} />
                  ) : (
                    <span className="absolute inset-0 animate-pulse bg-muted" />
                  )}
                  <span className="absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums bg-foreground/70 text-background">
                    {i + 1}
                  </span>
                </button>
              ))}
          </div>

          <p className="text-[11px] text-muted-foreground text-center tabular-nums">
            {slideCount} slide · klik salah satu untuk membukanya
          </p>
        </CardContent>
      </Card>
    );
  }

  /* ── Single slide, with the strip below ────────────────────────────────────── */
  return (
    // `flex-1 min-h-0` on the content, not just the card: Card is a flex column, so without
    // it the content stays content-sized and the measured box below reports a height of 0.
    <Card className={`w-full ${maxWidthClass} max-h-full`}>
      <CardContent className="p-4 flex flex-col gap-4 flex-1 min-h-0">
        {/* The measured box, and inside it the snap track: one pane per slide, each pane
            exactly as wide as the box so the pane index is scrollLeft over clientWidth. */}
        <div ref={ref} className="flex-1 min-h-0 w-full">
          <div
            ref={scrollerRef}
            onScroll={onScroll}
            data-testid="slide-track"
            className="flex h-full w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {ready &&
              slides.map((i) => (
                <div
                  key={i}
                  className="shrink-0 snap-center h-full flex items-center justify-center"
                  style={{ width: box.w }}
                >
                  <div
                    className="overflow-hidden rounded-md border border-hairline bg-white"
                    style={{ width: slideW, height: slideH }}
                  >
                    <SlideView
                      html={html}
                      index={i}
                      slideCount={slideCount}
                      width={slideW}
                      label={`Slide ${i + 1} dari ${slideCount}`}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Thumbnail strip. Scrolls horizontally once the deck outgrows the card. */}
        {slideCount > 1 && (
          <div
            ref={stripRef}
            className="flex gap-2 overflow-x-auto overflow-y-hidden pb-1 px-0.5 -mx-0.5"
          >
            {slides.map((i) => (
              <button
                key={i}
                type="button"
                ref={(el) => {
                  thumbRefs.current[i] = el;
                }}
                onClick={() => go(i)}
                aria-label={`Slide ${i + 1}`}
                aria-current={i === current}
                className={`relative shrink-0 overflow-hidden rounded-md bg-white transition-[box-shadow,opacity,transform] duration-150 ease-out active:scale-[0.96] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                  i === current
                    ? "opacity-100 ring-2 ring-primary"
                    : "opacity-55 ring-1 ring-foreground/10 hover:opacity-100 hover:ring-foreground/25"
                }`}
                style={{ width: THUMB_W, height: THUMB_H }}
              >
                {html ? (
                  <SlideView html={html} index={i} slideCount={slideCount} width={THUMB_W} />
                ) : (
                  <span className="absolute inset-0 animate-pulse bg-muted" />
                )}
                <span className="absolute bottom-0.5 left-0.5 rounded px-1 text-[9px] font-semibold tabular-nums bg-foreground/70 text-background">
                  {i + 1}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Presenter Pagination Footer */}
        <div className="flex items-center justify-between border-t pt-3 mt-1 text-xs">
          <Button
            size="sm"
            variant="outline"
            disabled={current === 0}
            onClick={() => go(current - 1)}
            className="h-8 px-3 font-medium text-[11px]"
          >
            Prev
          </Button>

          <span className="font-mono text-[10px] text-muted-foreground font-semibold tabular-nums">
            Slide {current + 1} of {slideCount}
          </span>

          <Button
            size="sm"
            variant="outline"
            disabled={current === slideCount - 1}
            onClick={() => go(current + 1)}
            className="h-8 px-3 font-medium text-[11px]"
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
