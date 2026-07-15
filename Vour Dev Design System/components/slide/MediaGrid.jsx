import React from "react";

/**
 * MediaGrid — 2×2 (or 1×3 / 1×4) grid of `ImagePlate`s. Fills `.diag-wrap`.
 *
 * Use for 3–4 screenshots of the same app, a feature grid, or a moodboard. Every cell should
 * use the SAME `ImagePlate` variant — never mix `window-mac` + `phone` + `plain` in one grid.
 *
 * More than 4 → split the slide.
 */
export function MediaGrid({
  children,
  columns = 2,     // 1 · 2 (default) · 3 · 4
  gap,             // px override; default is `--gap-body-asset` (40)
  style,
  ...rest
}) {
  const count = React.Children.count(children);
  if (count > 4) {
    // eslint-disable-next-line no-console
    console.warn(
      "MediaGrid holds up to 4 items — got " + count + ". Split into two slides."
    );
  }
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: gap ?? "var(--gap-body-asset)",
        alignItems: "stretch",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
