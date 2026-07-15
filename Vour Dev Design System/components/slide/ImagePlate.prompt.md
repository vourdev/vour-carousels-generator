**ImagePlate + ImagePlatePair** — editorial-framed image insert.

Use this for any real image on a slide: screenshot, IDE / terminal shot, product photo, logo, illustration. Wrapping ON by default — a thin `--ed-ink` outline + warm shadow echoes the diagram cards so the image sits INSIDE the slide's composition, not on top of it.

```jsx
{/* App / IDE / terminal — wrap with window-mac chrome */}
<ImagePlate
  src="assets/mimocode.png"
  variant="window-mac"
  chromeLabel="MiMoCode"
  ratio="4 / 3"
  captionEyebrow="[mockup]"
  caption="Kalau tinggal ketik, kenapa masih buka editor?"
/>

{/* Any web-app screenshot */}
<ImagePlate src="…" variant="window-web" url="app.example.com/dashboard" ratio="16 / 10" />

{/* Mobile screen */}
<ImagePlate src="…" variant="phone" ratio="9 / 19" />

{/* Logo or isolate — no frame, just rounded corners + soft shadow */}
<ImagePlate src="…" variant="plain" fit="contain" ratio="1 / 1" />

{/* Side-by-side comparison */}
<ImagePlatePair>
  <ImagePlate src="…" captionEyebrow="[before]" caption="ketik satu-satu" />
  <ImagePlate src="…" captionEyebrow="[after]"  caption="satu prompt selesai" />
</ImagePlatePair>
```

**Rules of thumb**

- Default variant is `framed`. Use `window-mac` for terminal / IDE / native app; `window-web` for web app; `phone` for iOS/Android; `plain` only for isolates (logos, cutouts).
- Drop it inside `.diag-wrap` on a mockup slide (obeys the §14 proportion contract) — no `ratio` needed, the plate fills the wrap.
- Give it a `ratio` when using it inline in a non-mockup slide, so the plate has a definite size.
- `fit="cover"` (default) crops to fill. Use `fit="contain"` when the whole image edges matter (logo, chart, screenshot with critical corners).
- Omit `src` while iterating — you get a striped `[image] / Drop screenshot here` placeholder.
- Caption is optional but recommended on mockup slides — one line explaining what the image is.
