**InfoCard** — the editorial workhorse. Opaque pastel background (Update 2: never transparent).

```jsx
<InfoCard tone="peach" icon="lucide:file-text"
  title="Token rationale"
  body="WHY and WHEN to use each color, not just the hex value." />

<InfoCard tone="stone" label="SCRAPED">
  primary: #C62828
</InfoCard>
<InfoCard tone="peach" label="DESIGNED" labelTone="var(--ed-orange)">
  primary: #C62828
  Deep warm red. Reserved exclusively for purchase-path actions.
</InfoCard>
```

Tones map to topic (§5): `mint`=success, `sky`=tooling, `pink`=design, `amber`=highlight, `stone`=loser/scraped, `peach`=neutral/default.
