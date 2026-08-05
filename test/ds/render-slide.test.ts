import { describe, it, expect } from "vitest";
import { renderSlide, renderDeviceHook } from "@/lib/ds/render-slide";

describe("renderSlide", () => {
  it("renders a cover with an accent span", () => {
    const html = renderSlide({ role: "cover", eyebrow: "BACKEND", headline: "Idempotency now", accentWord: "Idempotency" });
    expect(html).toContain("<section");
    expect(html).toContain('class="a"');
    expect(html).toContain("Idempotency");
    expect(html).toContain("BACKEND");
  });

  it("renders a point with fallback card when no mockup/card", () => {
    const html = renderSlide({ role: "point", counter: "02 / 05", eyebrow: "WHY", headline: "It matters", body: "because." });
    expect(html).toContain("02 / 05");
    expect(html).toContain("card-peach");
  });

  it("renders a point WITH a legacy card when provided", () => {
    const html = renderSlide({ role: "point", counter: "1/1", eyebrow: "E", headline: "H", body: "b",
      card: { icon: "box", title: "Title", body: "Body", tone: "peach" } });
    expect(html).toContain("card-peach");
    expect(html).toContain("<svg");
    expect(html).not.toContain("iconify-icon");
  });

  it("renders a terminal mockup with mac chrome", () => {
    const html = renderSlide({
      role: "point", counter: "02/07", eyebrow: "CODE", headline: "Test", body: "desc",
      mockup: {
        type: "terminal",
        filename: "auth.ts",
        lines: [
          { text: "// verify token", style: "cmt" },
          { text: 'const secret = "abc";', style: "plain" },
          { text: "jwt.verify(token)", style: "kw" },
        ],
      },
    });
    expect(html).toContain("terminal-bar");
    expect(html).toContain("auth.ts");
    expect(html).toContain('class="cmt"');
    expect(html).toContain('class="kw"');
    expect(html).not.toContain("card-peach");
  });

  it("renders a comparison mockup with vertical flex container and panels", () => {
    const html = renderSlide({
      role: "point", counter: "03/07", eyebrow: "VS", headline: "Compare", body: "desc",
      mockup: {
        type: "comparison",
        loserLabel: "Base64",
        loserLine: "Bisa di-decode siapa aja",
        winnerLabel: "AES Encryption",
        winnerLine: "Butuh key untuk decrypt",
        winnerRationale: "Enkripsi melindungi data",
      },
    });
    expect(html).toContain("h1 class=\"compact mt-24\"");
    expect(html).toContain("display:flex;flex-direction:column;gap:20px;width:100%");
    expect(html).toContain("diag-bars");
    expect(html).toContain("panel loser");
    expect(html).toContain("Base64");
    expect(html).toContain("AES Encryption");
    expect(html).toContain("Enkripsi melindungi data");
    expect(html).not.toContain("card-peach");
  });

  it("renders a steps mockup with numbered badges", () => {
    const html = renderSlide({
      role: "point", counter: "05/07", eyebrow: "HOW TO", headline: "Steps", body: "desc",
      mockup: {
        type: "steps",
        items: [
          { title: "Install deps", body: "npm install" },
          { title: "Configure", body: "Set env vars" },
          { title: "Deploy", body: "Run build" },
        ],
      },
    });
    expect(html).toContain("card-amber");
    expect(html).toContain("Install deps");
    expect(html).toContain("Configure");
    expect(html).toContain("Deploy");
    expect(html).not.toContain("card-peach");
  });

  it("renders a callout mockup as dark banner", () => {
    const html = renderSlide({
      role: "point", counter: "04/07", eyebrow: "WARNING", headline: "Caution", body: "desc",
      mockup: {
        type: "callout",
        icon: "alert-triangle",
        text: "Never store secrets in JWT payload",
      },
    });
    expect(html).toContain("background:#1F0904");
    expect(html).toContain("<svg");
    expect(html).not.toContain("iconify-icon");
    expect(html).toContain("Never store secrets in JWT payload");
    expect(html).not.toContain("card-peach");
  });

  it("renders card icons as inline svg, never iconify-icon", () => {
    const html = renderSlide({
      role: "point", counter: "1/1", eyebrow: "E", headline: "H", body: "b",
      mockup: { type: "card", icon: "server", title: "T", body: "B", tone: "sky" },
    });
    expect(html).toContain("<svg");
    expect(html).not.toContain("iconify-icon");
    expect(html).not.toContain("ICON_INJECT");
  });

  it("renders a bigstat mockup with large number", () => {
    const html = renderSlide({
      role: "point", counter: "03/07", eyebrow: "METRIC", headline: "Speed", body: "desc",
      mockup: {
        type: "bigstat",
        number: "3×",
        unit: "faster",
        caption: "Concurrent render vs sync render",
      },
    });
    expect(html).toContain("font-size:96px");
    expect(html).toContain("3×");
    expect(html).toContain("faster");
    expect(html).toContain("Concurrent render vs sync render");
    expect(html).not.toContain("card-peach");
  });

  it("prefers mockup over legacy card field", () => {
    const html = renderSlide({
      role: "point", counter: "02/05", eyebrow: "E", headline: "H", body: "b",
      card: { icon: "box", title: "Card Title", body: "Card Body", tone: "mint" },
      mockup: { type: "callout", icon: "check-circle", text: "Mockup wins" },
    });
    expect(html).toContain("Mockup wins");
    expect(html).not.toContain("Card Title");
  });

  it("renders a flow mockup with nodes and arrows", () => {
    const html = renderSlide({
      role: "point", counter: "02/07", eyebrow: "ALUR", headline: "Flow", body: "desc",
      mockup: {
        type: "flow",
        steps: [{ label: "Request" }, { label: "Handler", focus: true }, { label: "DB" }],
        note: "Alur singkat.",
      },
    });
    expect(html).toContain('class="diag-flow"');
    expect(html).toContain('class="arrow"');
    expect(html).toContain('class="node filled"');
    expect(html).toContain("Handler");
    expect(html).toContain('class="catatan');
    expect(html).toContain("Alur singkat.");
    expect(html).not.toContain("FLOW_NODES_INJECT");
    expect(html).not.toContain("NOTE_INJECT");
    expect(html).not.toContain("card-peach");
  });

  it("renders a concept mockup with parent + child nodes", () => {
    const html = renderSlide({
      role: "point", counter: "03/07", eyebrow: "TERM", headline: "HTTP", body: "desc",
      mockup: { type: "concept", parent: "HTTP", children: ["GET", "POST", "PUT", "DELETE"], note: "4 verb inti." },
    });
    expect(html).toContain('class="diag-hub"');
    expect(html).toContain('class="node filled big"');
    expect(html).toContain('class="children"');
    expect(html).toContain('class="lines"');
    expect(html).toContain("DELETE");
    expect(html).toContain('class="catatan');
    expect(html).not.toContain("CONCEPT_CHILDREN_INJECT");
    expect(html).not.toContain("CONCEPT_LINES_INJECT");
    expect(html).not.toContain("CONCEPT_PARENT_INJECT");
    expect(html).not.toContain("card-peach");
  });

  it("renders a hub mockup with inline-svg tool glyphs", () => {
    const html = renderSlide({
      role: "point", counter: "04/07", eyebrow: "HUB", headline: "API", body: "desc",
      mockup: {
        type: "hub", center: "API",
        tools: [
          { icon: "database", label: "DB" },
          { icon: "cloud", label: "CDN" },
          { icon: "server", label: "Node" },
        ],
      },
    });
    expect(html).toContain('class="diag-icon-hub"');
    expect(html).toContain('class="glyph"');
    expect(html).toContain("<svg");
    expect(html).toContain('class="lines"');
    expect(html).toContain("CDN");
    expect(html).not.toContain("iconify-icon");
    expect(html).not.toContain("HUB_TOOLS_INJECT");
    expect(html).not.toContain("HUB_LINES_INJECT");
    expect(html).not.toContain("HUB_CENTER_INJECT");
    expect(html).not.toContain("card-peach");
  });

  it("renders a checklist mockup with ticks", () => {
    const html = renderSlide({
      role: "point", counter: "07/07", eyebrow: "RECAP", headline: "Ringkasan", body: "desc",
      mockup: { type: "checklist", items: ["Idempotency", "Retry-safe", "Key unik"], note: "Simpan ya." },
    });
    expect(html).toContain('class="checklist');
    expect(html).toContain('class="tick"');
    expect(html).toContain("Retry-safe");
    expect(html).toContain('class="catatan');
    expect(html).not.toContain("CHECKLIST_ITEMS_INJECT");
    expect(html).not.toContain("card-peach");
  });

  it("does not let user text equal to a sentinel corrupt injection", () => {
    // A checklist item literally equal to the later NOTE_INJECT sentinel must
    // render as its own list item, and the real note must still render — proving
    // the single-pass injector never re-scans injected content.
    const html = renderSlide({
      role: "point", counter: "1/1", eyebrow: "E", headline: "H", body: "b",
      mockup: { type: "checklist", items: ["NOTE_INJECT", "real"], note: "actual note" },
    });
    expect(html).toContain('<li><span class="tick">✓</span> NOTE_INJECT</li>');
    expect(html).toContain('class="catatan-body">actual note<');
  });

  it("renders an outro CTA highlight with strong + sub", () => {
    const html = renderSlide({
      role: "outro", eyebrow: "KESIMPULAN", headline: "Mulai sekarang",
      accentWord: "sekarang", body: "Ringkas.",
      cta: { strong: "Simpan & bagikan", sub: "Biar gampang dicari lagi." },
    });
    expect(html).toContain('class="highlight');
    expect(html).toContain('class="strong"');
    expect(html).toContain("Simpan &amp; bagikan");
    expect(html).toContain('class="sub"');
    expect(html).toContain("Biar gampang dicari lagi.");
    expect(html).toContain("KESIMPULAN");
  });

  it("omits the CTA sub-line when not provided", () => {
    const html = renderSlide({ role: "outro", headline: "Done", cta: { strong: "Follow" } });
    expect(html).toContain('class="strong"');
    expect(html).not.toContain('class="sub"');
  });

  it("preserves $-sequences in terminal code lines verbatim", () => {
    const html = renderSlide({
      role: "point", counter: "02/05", eyebrow: "E", headline: "H", body: "b",
      mockup: { type: "terminal", filename: "sh", lines: [{ text: "echo $$ a$&b", style: "plain" }] },
    });
    expect(html).toContain("echo $$ a$&amp;b");
    expect(html).not.toContain("TERMINAL_LINES_INJECT");
  });

  it("preserves $-sequences in steps copy verbatim", () => {
    const html = renderSlide({
      role: "point", counter: "02/05", eyebrow: "E", headline: "H", body: "b",
      mockup: { type: "steps", items: [
        { title: "Cost $$", body: "pay $& now" },
        { title: "Two", body: "second" },
      ] },
    });
    expect(html).toContain("Cost $$");
    expect(html).toContain("pay $&amp; now");
    expect(html).not.toContain("STEPS_HTML_INJECT");
  });

  it("escapes user text", () => {
    const html = renderSlide({ role: "outro", headline: "<script>x", cta: { strong: "Save" } });
    expect(html).not.toContain("<script>x");
    expect(html).toContain("&lt;script&gt;x");
  });

  it("renders a full-hero cover (no hook) with hero headline", () => {
    const html = renderSlide({ role: "cover", eyebrow: "BACKEND", headline: "Idempotency", accentWord: "Idempotency" });
    expect(html).toContain("hero");
    expect(html).not.toContain("HOOK_INJECT");
    expect(html).toContain("Geser");
    expect(html).toContain("cover-editorial");
    expect(html).toContain("ce-lead");
  });

  it("renders a compact cover with a device hook", () => {
    const html = renderSlide({
      role: "cover", eyebrow: "MISKONSEPSI", headline: "JWT bukan enkripsi", accentWord: "enkripsi",
      hook: { kind: "device", chrome: "browser", label: "app.tsx",
        lines: [{ text: "decode(jwt)", style: "kw" }] },
    });
    expect(html).toContain('h1 class="compact');
    expect(html).toContain('class="urlbar"');
    expect(html).not.toContain("HOOK_INJECT");
    expect(html).toContain("MISKONSEPSI");
  });

  it("sanitizes a custom cover hook", () => {
    const html = renderSlide({
      role: "cover", eyebrow: "E", headline: "H", accentWord: "H",
      hook: { kind: "custom", html: '<div class="x">ok</div><script>alert(1)</script>' },
    });
    expect(html).toContain('<div class="x">ok</div>');
    expect(html).not.toContain("alert(1)");
  });

  it("preserves $ sequences in a custom hook verbatim (no replace() expansion)", () => {
    const html = renderSlide({
      role: "cover", eyebrow: "E", headline: "H", accentWord: "H",
      hook: { kind: "custom", html: '<div class="dollar">$& $$ $` $\' cost=$50</div>' },
    });
    // $-sequences must survive unchanged; String.replace would collapse/expand them.
    expect(html).toContain('<div class="dollar">$& $$ $` $\' cost=$50</div>');
  });
});

describe("renderDeviceHook", () => {
  it("renders browser chrome with a url pill and styled lines", () => {
    const html = renderDeviceHook({
      kind: "device", chrome: "browser", label: "app.vourdev.com",
      lines: [
        { text: "// readable by anyone", style: "cmt" },
        { text: "decode(jwt)", style: "kw" },
      ],
    });
    expect(html).toContain('class="diag-wrap');
    expect(html).toContain('class="urlbar"');
    expect(html).toContain("app.vourdev.com");
    expect(html).toContain('class="cmt"');
    expect(html).toContain('class="kw"');
  });
  it("renders terminal chrome with a filename title", () => {
    const html = renderDeviceHook({
      kind: "device", chrome: "terminal", label: "jwt.ts",
      lines: [{ text: "const t = 1", style: "plain" }],
    });
    expect(html).toContain('class="title"');
    expect(html).toContain("jwt.ts");
    expect(html).not.toContain('class="urlbar"');
  });
  it("preserves $-sequences in device code lines verbatim", () => {
    const html = renderDeviceHook({
      kind: "device", chrome: "terminal", label: "sh",
      lines: [{ text: "echo $'x' $$ a$&b", style: "plain" }],
    });
    // escapeHtml turns & -> &amp; and ' -> &#39; but must NOT collapse/re-inject
    // any $-sequence ($', $$, $&). Bare String.replace would corrupt these.
    expect(html).toContain("echo $&#39;x&#39; $$ a$&amp;b");
    expect(html).not.toContain("DEVICE_LINES_INJECT");
  });
});

describe("cover Ink surface", () => {
  it("renders a hookless cover on the Ink surface", () => {
    const html = renderSlide({
      role: "cover", eyebrow: "HOT TAKE", headline: "DevOps Bukan Jabatan", accentWord: "Bukan",
    });
    expect(html).toContain("cover-ink");
  });

  it("renders a cover WITH a hook on the Ink surface", () => {
    const html = renderSlide({
      role: "cover", eyebrow: "CODE REVIEW", headline: "Kebiasaan yang Bikin Kodemu Dibenci", accentWord: "Dibenci",
      hook: { kind: "device", chrome: "terminal", lines: [{ text: "npm run lint", style: "plain" }] },
    });
    expect(html).toContain("cover-ink");
  });
});

describe("cover badge hook", () => {
  it("renders the badge role and strike when struck", () => {
    const html = renderSlide({
      role: "cover", eyebrow: "HOT TAKE", headline: "DevOps Bukan Jabatan", accentWord: "Bukan",
      hook: { kind: "badge", role: "DevOps Engineer", sub: "// satu job title", struck: true },
    });
    expect(html).toContain("cover-badge");
    expect(html).toContain("DevOps Engineer");
    expect(html).toContain("cover-strike");
    expect(html).toContain("cover-ink");
    expect(html).not.toContain("BADGE_ROLE_INJECT");
  });

  it("omits the strike when not struck and applies the eyebrowLine default", () => {
    const html = renderSlide({
      role: "cover", eyebrow: "X", headline: "Y Bukan Z", accentWord: "Bukan",
      hook: { kind: "badge", role: "Sysadmin" },
    });
    expect(html).not.toContain("cover-strike");
    expect(html).toContain("ID · 2026");
  });
});

describe("cover nocgrid hook", () => {
  it("emits exactly cols*rows nodes and the banner", () => {
    const html = renderSlide({
      role: "cover", eyebrow: "RISK", headline: "Satu Typo, Semua Mati", accentWord: "Mati",
      hook: { kind: "nocgrid", cols: 6, rows: 3, state: "down", banner: "100% PACKET LOSS" },
    });
    const nodeCount = (html.match(/class="node/g) ?? []).length;
    expect(nodeCount).toBe(18);
    expect(html).toContain("100% PACKET LOSS");
    expect(html).toContain("cover-noc");
    expect(html).not.toContain("NODES_INJECT");
  });

  it("applies defaults (6x3, down, banner) when fields are omitted", () => {
    const html = renderSlide({
      role: "cover", eyebrow: "R", headline: "Semua Down", accentWord: "Down",
      hook: { kind: "nocgrid" },
    });
    const nodeCount = (html.match(/class="node/g) ?? []).length;
    expect(nodeCount).toBe(18);
    expect(html).toContain("100% PACKET LOSS");
  });
});

describe("cover door hook", () => {
  it("renders the label and hand, and shows the pull handle by default", () => {
    const html = renderSlide({
      role: "cover", eyebrow: "MISKONSEPSI", headline: "Cantik Tapi Nggak Kepakai", accentWord: "Nggak Kepakai",
      hook: { kind: "door", label: "DORONG" },
    });
    expect(html).toContain("cover-door");
    expect(html).toContain("DORONG");
    expect(html).toContain("handle");
    expect(html).not.toContain("LABEL_INJECT");
  });

  it("hides the handle when pull is false and defaults the label", () => {
    const html = renderSlide({
      role: "cover", eyebrow: "M", headline: "Salah Desain", accentWord: "Salah",
      hook: { kind: "door", pull: false },
    });
    expect(html).not.toContain('class="handle"');
    expect(html).toContain("DORONG");
  });
});

describe("custom mockup and cover css", () => {
  it("renders a slide with a custom mockup and optional custom CSS", () => {
    const html = renderSlide({
      role: "point",
      counter: "04/05",
      eyebrow: "CUSTOM HTML",
      headline: "Custom Slide",
      body: "Ini adalah slide dengan mockup kustom.",
      mockup: {
        type: "custom",
        html: "<div class='my-special-class'>Halo Dunia</div>",
        css: ".my-special-class { color: red; }"
      }
    });

    expect(html).toContain("<style>.my-special-class { color: red; }</style>");
    expect(html).toContain("<div class='my-special-class'>Halo Dunia</div>");
  });

  it("renders a custom cover hook with custom css", () => {
    const html = renderSlide({
      role: "cover",
      eyebrow: "COVER DUST",
      headline: "Custom Cover",
      hook: {
        kind: "custom",
        html: "<div class='cover-special'>Special Content</div>",
        css: ".cover-special { font-size: 50px; }"
      }
    });

    expect(html).toContain("<style>.cover-special { font-size: 50px; }</style>");
    expect(html).toContain("<div class='cover-special'>Special Content</div>");
  });
});
