"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
 * The one easing in this component, shared with the grid toggle in the tab bar.
 *
 * Everything that moves here is the same gesture — a selection landing — so it gets one
 * curve rather than a different ease per control. Exponential-ish out: fast to start,
 * settling rather than stopping.
 */
const EASE = "cubic-bezier(0.2,0,0,1)";

/**
 * A slide-number badge, over artwork whose brightness is unknown.
 *
 * A deck alternates Paper and Ink surfaces, so neither a dark badge nor a light one is
 * readable on every slide. Dark fill plus a light hairline is: the fill carries it on Paper,
 * the hairline separates it on Ink. Fixed colors, not tokens — this sits on the artwork, not
 * on the app surface, so it must not follow the app's theme.
 */
const BADGE =
  "absolute rounded bg-black/72 text-white ring-1 ring-white/30 font-semibold tabular-nums";

/** Horizontal scrollbar, themed rather than left to the browser or hidden outright. */
const THIN_SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:var(--color-hairline-strong)_transparent] " +
  "[&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent " +
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-hairline-strong/60 " +
  "hover:[&::-webkit-scrollbar-thumb]:bg-hairline-strong";

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
  return !!el.closest(
    '[role="listbox"],[role="menu"],[role="combobox"],[role="option"],[role="menuitem"]',
  );
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
  const chromeRef = useRef<HTMLDivElement>(null);
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
  /** Combined height of the strip and the footer, subtracted from the frame's budget. */
  const [chromeH, setChromeH] = useState(0);
  const [gridWidth, setGridWidth] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);

  /* ── Sizing the frame ─────────────────────────────────────────────────────────
   * Two measurements, both of elements whose size does not depend on the frame, so
   * resizing the frame can never feed back into them:
   *
   *  - `ref` is this component's own root, which fills whatever the wizard gives it. The
   *    card inside is content-height, so the card shrinking does not shrink this.
   *  - `chromeRef` wraps the strip and the footer, whose heights come from their own
   *    contents.
   *
   * The frame then gets what is left. Doing it this way rather than making the frame
   * `flex-1` is what removes the dead band: `flex-1` made the card full height and centred a
   * 4:5 slide inside it, so a narrow panel showed 200px of nothing above and below. CSS
   * alone cannot do this — `aspect-ratio` on a div is ignored the moment both axes are
   * definite, and it needs both to be bounded. */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0) setBox({ w: r.width, h: r.height });
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mode]);

  useEffect(() => {
    const el = chromeRef.current;
    if (!el) {
      setChromeH(0);
      return;
    }
    const read = () => setChromeH(el.getBoundingClientRect().height);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mode, slideCount]);

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
  const scrollToPane = useCallback(
    (i: number, behavior: ScrollBehavior = "smooth") => {
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
      el.scrollTo({
        left: i * el.clientWidth,
        behavior: instant ? "auto" : behavior,
      });
    },
    [],
  );

  const go = useCallback(
    (i: number) => {
      const next = Math.max(0, Math.min(slideCount - 1, i));
      targetRef.current = next;
      setCurrentSlide(next);
      scrollToPane(next);
    },
    [slideCount, scrollToPane],
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
    [slideCount, onModeChange],
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
      strip.scrollTo({
        left: right - strip.clientWidth + 8,
        behavior: "smooth",
      });
    }
  }, [current, mode]);

  /* Fit, not fill: whichever axis runs out first sets the scale. `CARD_CHROME` is the
     CardContent padding plus the one gap between the frame and the strip — the only part of
     the card's own box that is not measured, and it is a constant of this file's markup. */
  const CARD_CHROME = 32 + 16;
  const availH = Math.max(0, box.h - chromeH - CARD_CHROME);
  const availW = Math.max(0, box.w - 32);
  const fit =
    availH > 0
      ? Math.min(availW / SLIDE_W, availH / SLIDE_H)
      : availW / SLIDE_W;
  const slideW = Math.floor(SLIDE_W * fit);
  const slideH = Math.floor(SLIDE_H * fit);
  const ready = slideW > 0 && !!html;
  const slides = Array.from({ length: slideCount }, (_, i) => i);

  /* ── Grid overview ─────────────────────────────────────────────────────────── */
  if (mode === "grid") {
    const cols = gridWidth < 380 ? 2 : gridWidth < 640 ? 3 : 4;
    const tileW = Math.max(
      1,
      Math.floor((gridWidth - GRID_GAP * (cols - 1)) / cols),
    );

    return (
      // Same shape as single view: the card hugs its rows rather than stretching, so eight
      // slides do not sit in the top half of a panel-height rectangle. `min-h-0` is what lets
      // the grid scroll once the rows outgrow the panel instead of the card overflowing it.
      <div className="h-full w-full flex justify-center items-start">
        <Card className={`w-full ${maxWidthClass} max-h-full`}>
          <CardContent className="p-4 flex flex-col gap-3 min-h-0">
            <div
              ref={gridRef}
              // The half-pixel padding is room for the selected tile's offset ring, which the
              // scroll container would otherwise clip along the top row.
              className="grid w-full min-h-0 overflow-y-auto content-start p-1 -m-1"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gap: GRID_GAP,
              }}
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
                    className={`relative overflow-hidden rounded-lg bg-white duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                      i === current
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-card shadow-[0_1px_2px_rgba(0,0,0,0.06),0_10px_24px_-12px_rgba(0,0,0,0.35)]"
                        : "ring-1 ring-hairline-strong/50 hover:ring-foreground/40 hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_20px_-12px_rgba(0,0,0,0.3)]"
                    }`}
                    style={{
                      height: (tileW * SLIDE_H) / SLIDE_W,
                      transitionProperty: "box-shadow, transform",
                      transitionTimingFunction: EASE,
                    }}
                  >
                    {html ? (
                      <SlideView
                        html={html}
                        index={i}
                        slideCount={slideCount}
                        width={tileW}
                      />
                    ) : (
                      <span className="absolute inset-0 animate-pulse bg-muted" />
                    )}
                    <span
                      className={`${BADGE} bottom-1 left-1 px-1.5 py-0.5 text-[10px]`}
                    >
                      {i + 1}
                    </span>
                  </button>
                ))}
            </div>

            <p className="text-[11px] text-center text-foreground/60">
              <span className="tabular-nums">{slideCount}</span> slide · klik
              salah satu untuk membukanya
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ── Single slide, with the strip below ────────────────────────────────────── */
  return (
    // The root fills the panel; the card inside hugs its content, so the frame is exactly as
    // tall as the slide it holds instead of a 4:5 slide adrift in a full-height rectangle.
    <div ref={ref} className="h-full w-full flex justify-center items-start">
      <Card className={`w-full ${maxWidthClass} max-h-full`}>
        <CardContent className="p-4 flex flex-col gap-4">
          {/* The frame, sized to the fit computed above. The snap track lives inside it: one
              pane per slide, each exactly as wide as the frame, so the pane index is
              scrollLeft over clientWidth. */}
          <div className="w-full flex justify-center">
            <div
              className="overflow-hidden rounded-md border border-hairline bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06),0_18px_40px_-24px_rgba(0,0,0,0.45)]"
              style={{ width: slideW, height: slideH }}
            >
              <div
                ref={scrollerRef}
                onScroll={onScroll}
                data-testid="slide-track"
                className="flex h-full w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {ready &&
                  slides.map((i) => (
                    <div key={i} className="shrink-0 snap-center h-full w-full">
                      <SlideView
                        html={html}
                        index={i}
                        slideCount={slideCount}
                        width={slideW}
                        label={`Slide ${i + 1} dari ${slideCount}`}
                      />
                    </div>
                  ))}

                {/* The deck is still assembling, or there is nothing to show yet. Without
                    this the card rendered as a blank rectangle with a working counter
                    underneath it. */}
                {!ready && (
                  <div className="h-full w-full animate-pulse bg-muted" />
                )}
              </div>
            </div>
          </div>

          {/* Measured as one block: whatever is left of the card's height is the frame's. */}
          <div ref={chromeRef} className="flex flex-col gap-4">
            {/* Thumbnail strip. Scrolls horizontally once the deck outgrows the card. */}
            {slideCount > 1 && (
              <div
                ref={stripRef}
                className={`flex gap-2.5 [justify-content:safe_center] overflow-x-auto overflow-y-hidden py-1 px-1 -mx-1 ${THIN_SCROLLBAR}`}
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
                    className={`relative shrink-0 overflow-hidden rounded-md bg-white duration-200 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                      i === current
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-card shadow-[0_1px_2px_rgba(0,0,0,0.08),0_6px_14px_-8px_rgba(0,0,0,0.4)]"
                        : "ring-1 ring-hairline-strong/50 hover:ring-foreground/40"
                    }`}
                    style={{
                      width: THUMB_W,
                      height: THUMB_H,
                      transitionProperty: "box-shadow, opacity, transform",
                      transitionTimingFunction: EASE,
                    }}
                  >
                    {html ? (
                      <SlideView
                        html={html}
                        index={i}
                        slideCount={slideCount}
                        width={THUMB_W}
                      />
                    ) : (
                      <span className="absolute inset-0 animate-pulse bg-muted" />
                    )}
                    <span
                      className={`${BADGE} bottom-0.5 left-0.5 px-1 text-[9px]`}
                    >
                      {i + 1}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Where you are in the deck, and the two controls for moving through it.
            Quiet on purpose: the strip above and a trackpad swipe are the primary way this
            gets navigated, so these are the fallback, not the headline. */}
            <div className="flex items-center justify-between gap-3 border-t border-hairline pt-3">
              <Button
                size="icon"
                variant="ghost"
                disabled={current === 0}
                onClick={() => go(current - 1)}
                aria-label="Slide sebelumnya"
                title="Slide sebelumnya (←)"
                className="size-8 text-foreground/70 hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
              </Button>

              {/* Polite, not assertive: this changes on every swipe, and a screen reader that
              interrupts itself on each one is worse than one that finishes the sentence. */}
              <span
                aria-live="polite"
                className="text-[11px] text-foreground/60"
              >
                Slide{" "}
                <strong className="font-semibold tabular-nums text-foreground">
                  {current + 1}
                </strong>{" "}
                dari <span className="tabular-nums">{slideCount}</span>
              </span>

              <Button
                size="icon"
                variant="ghost"
                disabled={current === slideCount - 1}
                onClick={() => go(current + 1)}
                aria-label="Slide berikutnya"
                title="Slide berikutnya (→)"
                className="size-8 text-foreground/70 hover:text-foreground"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
