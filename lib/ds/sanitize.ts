// Minimal allowlist sanitizer for the cover `custom` hook HTML.
// Output is screenshot-captured on the user's own device, so the blast radius
// is limited; this is defense-in-depth, not a full HTML security boundary.
export function sanitizeHookHtml(html: string): string {
  return html
    // Remove <script>…</script> and <style>…</style> entirely.
    .replace(/<\s*(script|style)[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    // Remove any dangling opening/closing script|style tags.
    .replace(/<\s*\/?\s*(script|style)\b[^>]*>/gi, "")
    // Remove inline event-handler attributes: on*="…" | on*='…' | on*=word.
    // The boundary char before `on` may be whitespace OR a quote/slash closing the
    // previous attribute (`<img src="x"onerror=…>`); capture and re-emit it so the
    // handler is stripped without breaking the preceding attribute.
    .replace(/([\s"'/])on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "$1")
    // Neutralize javascript: and data:text/html URLs in href/src.
    .replace(/(href|src)\s*=\s*("|')?\s*javascript:[^"'>\s]*/gi, '$1=$2#')
    .replace(/(href|src)\s*=\s*("|')?\s*data:text\/html[^"'>\s]*/gi, '$1=$2#');
}
