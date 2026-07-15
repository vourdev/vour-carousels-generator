**BigStat** — one standout metric, editorial style.

Use for slides whose whole message is a single number. Fills its `.diag-wrap` (§17). Never pair two BigStats side-by-side; use two slides or a Comparison-Bars.

```jsx
<BigStat
  number="3×"
  unit="faster"
  captionEyebrow="[benchmark]"
  caption="React 18 concurrent render vs React 17 sync render"
/>

<BigStat number="80%" unit="less code" caption="Server components vs client-only" />
<BigStat number="12 detik" caption="Rata-rata cold-start Next.js edge di production" />
```

**Rules of thumb**

- Keep `number` under 6 characters. Use `×`, `%`, `k+`, or a unit label instead of long words.
- `unit` is optional but usually reads better than baking the unit into `number`.
- One BigStat per slide (§17). No side-by-side pairs.
- Wrap the whole component in `.diag-wrap` on a mockup slide so it obeys §14 proportions.
- Caption is Nunito 500 · 32px — the same size as slide body. Keep it to one line.
