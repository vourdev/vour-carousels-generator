// Scopes LLM-authored CSS to a single slide fragment.
//
// A `custom` mockup/hook ships its own <style> block. Emitted verbatim it applies
// to the WHOLE document, so one slide's `section{}` or `.geser{}` rule silently
// shifts every other slide (this is why "Geser" drifted between slides). Every
// selector is prefixed with the fragment's scope class instead, which also means
// a rule targeting shared chrome (`section`, `h1`, `.geser`) degrades to a
// descendant selector that matches nothing — the slide chrome becomes unreachable.

/** At-rules whose body is a nested rule list: recurse and scope the inside. */
const NESTED_AT_RULE = /^@(media|supports|layer|container)\b/i;
/** At-rules whose body is not element selectors: pass through untouched. */
const OPAQUE_AT_RULE = /^@(keyframes|-\w+-keyframes|font-face|page|counter-style|property|font-feature-values)\b/i;

/** Split a selector list on top-level commas (commas inside :is()/:not() stay). */
function splitSelectors(list: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    else if (c === "," && depth === 0) {
      out.push(list.slice(start, i));
      start = i + 1;
    }
  }
  out.push(list.slice(start));
  return out.map((s) => s.trim()).filter(Boolean);
}

function prefixSelectorList(list: string, scope: string): string {
  return splitSelectors(list)
    .map((sel) => {
      // `&` and `:scope` mean "the fragment root itself".
      if (/^[&]|^:scope\b/.test(sel)) return sel.replace(/^&|^:scope\b/, scope);
      return `${scope} ${sel}`;
    })
    .join(", ");
}

/**
 * Prefix every selector in `css` with `scope` (e.g. ".cm-3").
 * Declarations are never touched; `@import` is dropped (no network at export time).
 */
export function scopeCss(css: string, scope: string): string {
  // Comments can hide braces/semicolons — strip them before the brace scan.
  const src = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out: string[] = [];

  let i = 0;
  while (i < src.length) {
    // Find the prelude (everything up to the next "{" or ";").
    let j = i;
    while (j < src.length && src[j] !== "{" && src[j] !== ";") j++;

    // Statement at-rule with no block (@import, @charset, @namespace).
    if (j >= src.length || src[j] === ";") {
      const stmt = src.slice(i, j).trim();
      if (stmt && !/^@import\b/i.test(stmt)) out.push(`${stmt};`);
      i = j + 1;
      continue;
    }

    const prelude = src.slice(i, j).trim();

    // Walk to the matching "}" so nested blocks stay with their parent.
    let depth = 1;
    let k = j + 1;
    while (k < src.length && depth > 0) {
      if (src[k] === "{") depth++;
      else if (src[k] === "}") depth--;
      k++;
    }
    const body = src.slice(j + 1, depth === 0 ? k - 1 : k);

    if (OPAQUE_AT_RULE.test(prelude)) {
      out.push(`${prelude}{${body}}`);
    } else if (NESTED_AT_RULE.test(prelude)) {
      out.push(`${prelude}{${scopeCss(body, scope)}}`);
    } else if (prelude.startsWith("@")) {
      // Unknown at-rule: keep it, but do not pretend to understand its body.
      out.push(`${prelude}{${body}}`);
    } else if (prelude) {
      out.push(`${prefixSelectorList(prelude, scope)}{${body}}`);
    }

    i = k;
  }

  return out.join("\n");
}
