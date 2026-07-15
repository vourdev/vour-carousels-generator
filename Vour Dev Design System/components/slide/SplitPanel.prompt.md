**SplitPanel** — text on one side, image / diagram on the other. Fills `.diag-wrap`.

Use when a mockup + a short paragraph of context share equal weight. If either side dominates, use a full-bleed `ImagePlate` or a text-only slide instead.

```jsx
<SplitPanel
  eyebrow="[why it matters]"
  heading="Satu prompt, satu build."
  body="MiMoCode duduk di terminal, bukan tab lain. Nggak ada tab-switch, nggak ada copy-paste sidebar."
>
  <ImagePlate src="assets/mimocode.png" variant="window-mac" chromeLabel="MiMoCode" />
</SplitPanel>

{/* Image on the left, text on the right */}
<SplitPanel swap eyebrow="[demo]" heading="30 detik pertama" body="…">
  <ImagePlate src="…" variant="phone" />
</SplitPanel>
```

**Rules of thumb**

- The slide already has an h1; `SplitPanel` heading is a SUB-headline (48px, not 88 / 104 / 128).
- Body caps at 3 lines / ~20 words in the panel.
- The visual side is a single child — an `ImagePlate`, `.terminal`, or any `.diag-*` diagram. No stacks.
- `swap` flips the columns. Use it to break rhythm between two adjacent SplitPanel slides.
- One SplitPanel per slide (§17). Two SplitPanels vertically = wrong; make it a MediaGrid or two slides.
