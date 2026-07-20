import { describe, it, expect } from "vitest";
import { sanitizeHookHtml } from "@/lib/ds/sanitize";

describe("sanitizeHookHtml", () => {
  it("strips <script> blocks", () => {
    const out = sanitizeHookHtml('<div>ok</div><script>alert(1)</script>');
    expect(out).toContain("<div>ok</div>");
    expect(out).not.toContain("alert(1)");
    expect(out.toLowerCase()).not.toContain("<script");
  });
  it("strips inline event handlers", () => {
    const out = sanitizeHookHtml('<img src="x" onerror="alert(1)">');
    expect(out).not.toMatch(/onerror/i);
    expect(out).toContain('src="x"');
  });
  it("strips javascript: urls", () => {
    const out = sanitizeHookHtml('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toMatch(/javascript:/i);
  });
  it("keeps benign styled markup", () => {
    const html = '<div class="hook" style="color:red"><span>hi</span></div>';
    expect(sanitizeHookHtml(html)).toBe(html);
  });
});
