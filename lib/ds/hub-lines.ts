/** Generate the curved connector SVG (center → N nodes) for the hub/concept
    diagrams. Endpoints match the flexbox space-between layout of `.children` /
    `.tools`. Supports 3 or 4 nodes; anything else clamps to 4. */
export function diagLines(
  count: number,
  o: { viewH: number; midY: number; endY: number }
): string {
  const n = count === 3 ? 3 : 4;
  const xs = n === 3 ? [110, 460, 810] : [110, 343, 577, 810];
  const headTop = o.endY - 4;
  const headBot = o.endY + 8;
  const paths = xs
    .map((x) => `<path class="stroke" d="M 460 96 Q 460 ${o.midY} ${x} ${o.endY}" />`)
    .join("");
  const heads = xs
    .map(
      (x) =>
        `<polygon class="head" points="${x - 8},${headTop} ${x + 8},${headTop} ${x},${headBot}" />`
    )
    .join("");
  return `<svg class="lines" viewBox="0 0 920 ${o.viewH}" preserveAspectRatio="none">${paths}${heads}</svg>`;
}
