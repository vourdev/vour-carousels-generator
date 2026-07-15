**PullQuote** — a standout quote, testimonial, or expert claim.

Use for lines you want to *point at*: a Rich Hickey aphorism, a Next.js docs sentence, a founder's tweet, a senior dev's Slack line. Fills its `.diag-wrap` (§17 single-mockup rule).

```jsx
<PullQuote author="Dan Abramov" role="React Core Team">
  Concurrent React is a <span className="a">mental model shift</span>, not a feature flag.
</PullQuote>

<PullQuote author="Next.js Docs" align="center">
  Server components are the default. Client components are the escape hatch.
</PullQuote>
```

**Rules of thumb**

- Quote body caps at ~18 words / 3 lines. Longer than that and it stops feeling like a pull-quote.
- One `<span className="a">` per quote (same as headline). Never two.
- `author` renders as ALL-CAPS orange mono — keep it to a name, no honorifics.
- `role` is optional; skip it if the author's name carries the authority alone.
- Never nest a PullQuote inside another mock. It IS the mock; place it directly in `.diag-wrap`.
