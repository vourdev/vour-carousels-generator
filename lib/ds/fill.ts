export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function fillTemplate(template: string, vars: Record<string, string>): string {
  // 1. Resolve optional blocks {{#key}}…{{/key}} first.
  let out = template.replace(
    /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (_m, key: string, inner: string) => (vars[key] ? inner : "")
  );
  // 2. Replace named slots {{key}} with escaped values (blank if missing).
  out = out.replace(/\{\{(\w+)\}\}/g, (_m, key: string) =>
    vars[key] != null ? escapeHtml(vars[key]) : ""
  );
  return out;
}
