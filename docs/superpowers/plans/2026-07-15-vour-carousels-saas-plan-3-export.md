# Vour Carousels SaaS — Plan 3: Client-Side Image Export

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax. Execution is INLINE (no subagents) per user preference.

**Goal:** From an assembled carousel HTML document, produce ordered HD JPEG images — one per `<section>` at 1080×1350 — entirely in the browser via `html-to-image`, matching the fidelity of the deleted `scripts/export-slider-content.py`, and let the user download them from `/preview`.

**Architecture:** A hidden off-screen `<iframe>` loads the assembled carousel document (its own fonts + Iconify + `<style>`). We wait for fonts and icons to finish, inline each `<iconify-icon>`'s rendered SVG into the light DOM (so it is captured), then run `html-to-image` per `<section>` at `pixelRatio: 2`, `quality: 0.92`. Blobs download as `slide_01.jpg … slide_NN.jpg`. No Cloudinary/Buffer yet (Plan 5).

**Tech Stack:** TypeScript · `html-to-image` · React (client component) · shadcn/ui Button · Vitest (pure helpers only).

## Global Constraints

- Repo root is the app root; imports use `@/*`.
- Match `export-slider-content.py`: **per-`<section>` capture** (not viewport), **`pixelRatio: 2`** (HD, anti-pixelation), sRGB (browser-native), **wait for fonts + Iconify** before capture, **JPEG quality 0.92** (script used 85; slightly higher to avoid visible compression). Output ordered `slide_01.jpg`, `slide_02.jpg`, …
- Anti-`pecah`: fonts must be loaded (`document.fonts.ready`) and Iconify icons must be inlined as real SVG in the light DOM before capture — `<iconify-icon>` renders into shadow DOM, which `html-to-image` does not capture.
- Export is browser-only. Pure helpers (filenames, ordering) are unit-tested; the capture path is verified by `npm run build` + manual `/preview` check.
- App UI uses **shadcn/ui** + the Vercel token set. Carousel content stays Vour Dev.
- Every task ends green (`npm test`) and is committed on the current branch.

---

### Task 1: Filenames helper (pure, TDD)

**Files:** Create `lib/export/filenames.ts`, `test/export/filenames.test.ts`.

**Interfaces:** `export function slideFilename(index: number): string` → 1-based, zero-padded to 2 digits, `.jpg` (e.g. `slideFilename(1) === "slide_01.jpg"`, `slideFilename(12) === "slide_12.jpg"`). `export function slideFilenames(count: number): string[]`.

- [ ] **Step 1: Failing test** `test/export/filenames.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { slideFilename, slideFilenames } from "@/lib/export/filenames";

describe("slideFilename", () => {
  it("1-based, zero-padded, .jpg", () => {
    expect(slideFilename(1)).toBe("slide_01.jpg");
    expect(slideFilename(12)).toBe("slide_12.jpg");
  });
  it("lists N names in order", () => {
    expect(slideFilenames(3)).toEqual(["slide_01.jpg", "slide_02.jpg", "slide_03.jpg"]);
  });
});
```

- [ ] **Step 2: Run → FAIL** (`npx vitest run test/export/filenames.test.ts`).

- [ ] **Step 3: Implement** `lib/export/filenames.ts`

```ts
export function slideFilename(index: number): string {
  return `slide_${String(index).padStart(2, "0")}.jpg`;
}

export function slideFilenames(count: number): string[] {
  return Array.from({ length: count }, (_, i) => slideFilename(i + 1));
}
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `git add lib/export/filenames.ts test/export/filenames.test.ts && git commit -m "feat(export): add slide filename helper"`

---

### Task 2: Install html-to-image + capture module (browser)

**Files:** Modify `package.json` (dep). Create `lib/export/capture.ts`.

**Interfaces:** `export async function captureCarousel(html: string, opts?: { pixelRatio?: number; quality?: number }): Promise<Blob[]>` — renders `html` in a hidden iframe, waits for readiness, inlines icons, captures each `<section>` to a JPEG blob (defaults `pixelRatio: 2`, `quality: 0.92`), resolves blobs in slide order, and removes the iframe.

- [ ] **Step 1: Install** — `npm install html-to-image`

- [ ] **Step 2: Implement** `lib/export/capture.ts`

```ts
import { toBlob } from "html-to-image";

const SLIDE_W = 1080;
const SLIDE_H = 1350;

/** Load an assembled carousel document in a hidden, real-size iframe. */
function mountHiddenIframe(html: string): Promise<HTMLIFrameElement> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    Object.assign(iframe.style, {
      position: "fixed",
      left: "-99999px",
      top: "0",
      width: `${SLIDE_W}px`,
      height: `${SLIDE_H}px`,
      border: "0",
    });
    iframe.onload = () => resolve(iframe);
    iframe.onerror = () => reject(new Error("export iframe failed to load"));
    iframe.srcdoc = html;
    document.body.appendChild(iframe);
  });
}

/** Wait for fonts + Iconify web components to finish rendering. */
async function waitForReady(doc: Document): Promise<void> {
  await doc.fonts.ready;
  const icons = Array.from(doc.querySelectorAll("iconify-icon")) as HTMLElement[];
  await Promise.all(
    icons.map(
      (el) =>
        new Promise<void>((res) => {
          // Iconify renders asynchronously; resolve once its shadow SVG exists.
          const check = () => {
            if (el.shadowRoot?.querySelector("svg")) return res();
            requestAnimationFrame(check);
          };
          check();
        })
    )
  );
  // Two frames to let layout + paint settle (mirrors the script's post-load wait).
  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
}

/** Copy each <iconify-icon>'s shadow SVG into the light DOM so it is captured. */
function inlineIcons(doc: Document): void {
  for (const el of Array.from(doc.querySelectorAll("iconify-icon"))) {
    const svg = (el as HTMLElement).shadowRoot?.querySelector("svg");
    if (!svg) continue;
    const clone = svg.cloneNode(true) as SVGElement;
    // Preserve sizing from the host element's computed box.
    const rect = (el as HTMLElement).getBoundingClientRect();
    clone.setAttribute("width", `${rect.width}`);
    clone.setAttribute("height", `${rect.height}`);
    clone.style.verticalAlign = "middle";
    el.replaceWith(clone);
  }
}

export async function captureCarousel(
  html: string,
  opts: { pixelRatio?: number; quality?: number } = {}
): Promise<Blob[]> {
  const pixelRatio = opts.pixelRatio ?? 2;
  const quality = opts.quality ?? 0.92;

  const iframe = await mountHiddenIframe(html);
  try {
    const doc = iframe.contentDocument;
    if (!doc) throw new Error("export iframe has no document");
    await waitForReady(doc);
    inlineIcons(doc);

    const sections = Array.from(doc.querySelectorAll("section")) as HTMLElement[];
    const blobs: Blob[] = [];
    for (const section of sections) {
      const blob = await toBlob(section, {
        type: "image/jpeg",
        quality,
        pixelRatio,
        width: SLIDE_W,
        height: SLIDE_H,
        // Do not skip fonts — we need them embedded for fidelity.
        skipFonts: false,
      });
      if (!blob) throw new Error("html-to-image returned no blob");
      blobs.push(blob);
    }
    return blobs;
  } finally {
    iframe.remove();
  }
}
```

- [ ] **Step 3: Typecheck** — `npx tsc --noEmit` clean.
- [ ] **Step 4: Commit** — `git add lib/export/capture.ts package.json package-lock.json && git commit -m "feat(export): capture carousel sections to HD JPEG blobs"`

---

### Task 3: Download helper (pure mapping + browser trigger)

**Files:** Create `lib/export/download.ts`, `test/export/download.test.ts`.

**Interfaces:** `export function namedBlobs(blobs: Blob[]): { name: string; blob: Blob }[]` (pure — pairs blobs with `slideFilenames`). `export function downloadNamedBlobs(items: { name: string; blob: Blob }[]): void` (browser — triggers an `<a download>` per item).

- [ ] **Step 1: Failing test** `test/export/download.test.ts` (tests the pure pairing only)

```ts
import { describe, it, expect } from "vitest";
import { namedBlobs } from "@/lib/export/download";

describe("namedBlobs", () => {
  it("pairs blobs with ordered slide filenames", () => {
    const blobs = [new Blob(["a"]), new Blob(["b"])];
    const named = namedBlobs(blobs);
    expect(named.map((n) => n.name)).toEqual(["slide_01.jpg", "slide_02.jpg"]);
    expect(named[0].blob).toBe(blobs[0]);
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement** `lib/export/download.ts`

```ts
import { slideFilenames } from "@/lib/export/filenames";

export function namedBlobs(blobs: Blob[]): { name: string; blob: Blob }[] {
  const names = slideFilenames(blobs.length);
  return blobs.map((blob, i) => ({ name: names[i], blob }));
}

export function downloadNamedBlobs(items: { name: string; blob: Blob }[]): void {
  for (const { name, blob } of items) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
}
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `git add lib/export/download.ts test/export/download.test.ts && git commit -m "feat(export): add blob naming + download helpers"`

---

### Task 4: Export button on `/preview` (shadcn, browser-verified)

**Files:** Create `app/preview/export-button.tsx`. Modify `app/preview/page.tsx` (pass assembled html + mount the button).

**Interfaces:** `export function ExportButton({ html }: { html: string })` — a client component (shadcn `Button`) that on click captures + downloads, showing a pending state and surfacing errors.

- [ ] **Step 1: Implement** `app/preview/export-button.tsx`

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { captureCarousel } from "@/lib/export/capture";
import { namedBlobs, downloadNamedBlobs } from "@/lib/export/download";

export function ExportButton({ html }: { html: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onExport() {
    setPending(true);
    setError("");
    try {
      const blobs = await captureCarousel(html);
      downloadNamedBlobs(namedBlobs(blobs));
    } catch (e) {
      setError(e instanceof Error ? e.message : "export failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={onExport} disabled={pending}>
        {pending ? "Exporting…" : "Export images"}
      </Button>
      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  );
}
```

- [ ] **Step 2: Wire into `app/preview/page.tsx`** — pass `sampleHtml` to `<ExportButton html={sampleHtml} />` (place it above/below `<PreviewFrame />`). Keep the existing static-hoist of `sampleHtml`.

- [ ] **Step 3: Build** — `npm run build` succeeds; `/preview` still routes.

- [ ] **Step 4: Manual verify** — `npm run dev`, sign in, open `/preview`, click **Export images**. Confirm 3 files download (`slide_01.jpg`..`slide_03.jpg`), each 1080×1350 (×2 = 2160×2700 px), vibrant, with the brand disc + icon rendered (not blank). If icons are missing, revisit `inlineIcons`/`waitForReady`; if fonts fall back, confirm `skipFonts:false` embedded them.

- [ ] **Step 5: Commit** — `git add app/preview && git commit -m "feat(export): add Export button to /preview"`

---

## Self-Review

**Spec coverage (Plan 3 = spec §6 export):** per-section capture, pixelRatio 2, fonts+icons wait, JPEG quality, ordered filenames, download → Tasks 1–4. Cloudinary/Buffer deferred to Plan 5.

**Risks / notes:**
- **Iconify shadow DOM** is the main fidelity risk — `inlineIcons` copies the rendered shadow SVG into light DOM before capture. If Iconify blocks on network for uncommon icons, `waitForReady` polls until the shadow SVG exists.
- **Web-font embedding** across the iframe: `html-to-image` embeds fonts from the iframe document's stylesheets (`skipFonts:false`); Google Fonts allows CORS. If a font falls back at capture, inline the carousel fonts as base64 `@font-face` in `carousel-css.ts` (spec §6 safeguard 1) as a follow-up.
- **Capture path is browser-only** — verified via build + manual `/preview`, not unit tests. Pure helpers (filenames, naming) are unit-tested.
- **No zip dependency** — downloads N individual files (browsers may prompt for multiple downloads; acceptable for a private single-user tool).
