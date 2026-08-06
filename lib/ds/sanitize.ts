// Minimal allowlist sanitizer for the cover `custom` hook HTML.
// Output is screenshot-captured on the user's own device, so the blast radius
// is limited; this is defense-in-depth, not a full HTML security boundary.
export function sanitizeHookHtml(html: string): string {
  return html
    // Remove <script>…</script> entirely.
    .replace(/<\s*script\b[\s\S]*?<\s*\/\s*script\s*>/gi, "")
    // Remove any dangling opening/closing script tags.
    .replace(/<\s*\/?\s*script\b[^>]*>/gi, "")
    // Remove inline event-handler attributes: on*="…" | on*='…' | on*=word.
    // The boundary char before `on` may be whitespace OR a quote/slash closing the
    // preceding attribute (`<img src="x"onerror=…>`); capture and re-emit it so the
    // handler is stripped without breaking the preceding attribute.
    // `only=` / `once=` are not event handlers; exclude them by name. The match
    // stays otherwise generic on purpose — a missed handler is a security gap,
    // while an over-strip is only cosmetic, so the default leans to stripping.
    .replace(/([\s"'/])on(?!ly\s*=|ce\s*=)[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "$1")
    // Neutralize javascript: and data:text/html URLs in href/src.
    .replace(/(href|src)\s*=\s*("|')?\s*javascript:[^"'>\s]*/gi, '$1=$2#')
    // Support custom style blocks, but neutralize dangerous data schemas
    .replace(/(href|src)\s*=\s*("|')?\s*data:text\/html[^"'>\s]*/gi, '$1=$2#');
}
