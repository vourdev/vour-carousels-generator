**MediaGrid** — 2×2 (or 1×3 / 1×4) grid of `ImagePlate`s. Fills `.diag-wrap`.

Use for 3–4 screenshots of the same app, a feature grid, a moodboard. Every cell uses the SAME `ImagePlate` variant — never mix `window-mac` + `phone` + `plain` in one grid.

```jsx
<MediaGrid columns={2}>
  <ImagePlate src="assets/screen-01.png" variant="phone" captionEyebrow="[01]" caption="Login" />
  <ImagePlate src="assets/screen-02.png" variant="phone" captionEyebrow="[02]" caption="Home" />
  <ImagePlate src="assets/screen-03.png" variant="phone" captionEyebrow="[03]" caption="Detail" />
  <ImagePlate src="assets/screen-04.png" variant="phone" captionEyebrow="[04]" caption="Settings" />
</MediaGrid>

{/* 3-up strip for a feature row */}
<MediaGrid columns={3}>
  <ImagePlate src="…" variant="framed" />
  <ImagePlate src="…" variant="framed" />
  <ImagePlate src="…" variant="framed" />
</MediaGrid>
```

**Rules of thumb**

- 3–4 images: `columns={2}` (2×2 or 2×2-with-3). More than 4: split into two slides.
- Every cell same `ImagePlate` variant. Same aspect ratio (omit `ratio`; the grid decides).
- Caption per cell is a numbered eyebrow (`[01]`, `[02]`) + a 1–2 word label. Nothing longer.
- One MediaGrid per slide (§17).
