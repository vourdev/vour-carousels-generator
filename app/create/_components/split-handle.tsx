"use client";

import { useRef, useState } from "react";

/**
 * Draggable divider between the chat pane and the preview pane.
 *
 * The width itself is NOT React state while the drag is running. A pointermove fires
 * dozens of times a second, and re-rendering the whole studio on each one drops frames
 * (the preview iframe re-lays-out every time). Instead the drag writes the `--panel-w`
 * custom property straight onto the container element and commits the final value to
 * state once, on pointerup — the transient-value rule from the React performance guide.
 *
 * Pointer capture matters here: the preview is an <iframe>, and without capture the
 * iframe swallows every pointermove the moment the cursor crosses into it, so the
 * divider would stick as soon as you dragged left.
 */

export const PANEL_MIN = 26;
export const PANEL_MAX = 70;
export const PANEL_DEFAULT = 44;

export function clampPanel(pct: number): number {
  return Math.min(PANEL_MAX, Math.max(PANEL_MIN, pct));
}

export function SplitHandle({
  containerRef,
  value,
  onCommit,
}: {
  /** Element carrying `--panel-w`; its box is the 100% the percentage is measured against. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  value: number;
  onCommit: (pct: number) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);
  const rectRef = useRef<DOMRect | null>(null);
  const latestRef = useRef(value);

  function write(pct: number) {
    latestRef.current = pct;
    containerRef.current?.style.setProperty("--panel-w", `${pct}%`);
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Ubah lebar panel preview"
      aria-valuenow={Math.round(value)}
      aria-valuemin={PANEL_MIN}
      aria-valuemax={PANEL_MAX}
      tabIndex={0}
      onPointerDown={(e) => {
        const box = containerRef.current;
        if (!box) return;
        e.preventDefault();
        rectRef.current = box.getBoundingClientRect();
        latestRef.current = value;
        draggingRef.current = true;
        setDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!draggingRef.current) return;
        const rect = rectRef.current;
        if (!rect) return;
        write(clampPanel(((rect.right - e.clientX) / rect.width) * 100));
      }}
      onPointerUp={(e) => {
        if (!draggingRef.current) return;
        draggingRef.current = false;
        setDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
        onCommit(latestRef.current);
      }}
      onDoubleClick={() => {
        write(PANEL_DEFAULT);
        onCommit(PANEL_DEFAULT);
      }}
      onKeyDown={(e) => {
        // Arrow keys move the divider itself, so the split is reachable without a pointer.
        const step = e.shiftKey ? 8 : 2;
        let next: number | null = null;
        if (e.key === "ArrowLeft") next = clampPanel(value + step); // panel grows leftward
        else if (e.key === "ArrowRight") next = clampPanel(value - step);
        else if (e.key === "Home") next = PANEL_DEFAULT;
        if (next === null) return;
        e.preventDefault();
        write(next);
        onCommit(next);
      }}
      className={`hidden lg:flex shrink-0 w-2 cursor-col-resize touch-none select-none items-center justify-center border-l border-hairline transition-colors focus-visible:outline-none focus-visible:bg-primary/25 ${
        dragging ? "bg-primary/25" : "bg-transparent hover:bg-primary/15"
      }`}
    >
      <span
        aria-hidden
        className={`h-8 w-0.75 rounded-full transition-colors ${
          dragging ? "bg-primary" : "bg-border"
        }`}
      />
    </div>
  );
}
