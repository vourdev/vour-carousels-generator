import { toBlob } from "html-to-image";

const SLIDE_W = 1080;
const SLIDE_H = 1350;
const READY_TIMEOUT_MS = 4000;

/** Resolve when `p` settles or after `ms` — never hangs. */
function withTimeout(p: Promise<unknown>, ms: number): Promise<void> {
  return Promise.race([
    p.then(() => undefined),
    new Promise<void>((r) => setTimeout(r, ms)),
  ]);
}

/** Load an assembled carousel document in a hidden, real-size iframe. */
function mountHiddenIframe(html: string): Promise<HTMLIFrameElement> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    Object.assign(iframe.style, {
      position: "fixed",
      left: "0",
      top: "0",
      width: `${SLIDE_W}px`,
      height: `${SLIDE_H}px`,
      border: "0",
      opacity: "0.01",
      pointerEvents: "none",
      zIndex: "-9999",
    });
    // Fallback in case onload never fires.
    const timer = setTimeout(() => resolve(iframe), READY_TIMEOUT_MS);
    iframe.onload = () => {
      clearTimeout(timer);
      resolve(iframe);
    };
    iframe.onerror = () => {
      clearTimeout(timer);
      reject(new Error("export iframe failed to load"));
    };
    iframe.srcdoc = html;
    document.body.appendChild(iframe);
  });
}

/** Pre-fetch SVGs from the Iconify API and replace <iconify-icon> elements.
    This eliminates reliance on runtime scripts, shadow DOM, and layout timing inside the hidden iframe. */
async function preFetchAndReplaceIcons(doc: Document): Promise<void> {
  const icons = Array.from(doc.querySelectorAll("iconify-icon")) as HTMLElement[];
  if (!icons.length) return;

  await Promise.all(
    icons.map(async (host) => {
      const iconAttr = host.getAttribute("icon");
      if (!iconAttr) return;

      let prefix = "lucide";
      let name = iconAttr;
      if (iconAttr.includes(":")) {
        const parts = iconAttr.split(":");
        prefix = parts[0];
        name = parts[1];
      } else if (iconAttr.includes("-")) {
        const idx = iconAttr.indexOf("-");
        prefix = iconAttr.substring(0, idx);
        name = iconAttr.substring(idx + 1);
      }

      try {
        const res = await fetch(`https://api.iconify.design/${prefix}/${name}.svg`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const svgText = await res.text();

        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
        const svgEl = svgDoc.querySelector("svg");
        if (!svgEl) return;

        // Copy classes and styles
        const style = host.getAttribute("style") || "";
        const className = host.getAttribute("class") || "";
        svgEl.setAttribute("class", className);
        svgEl.setAttribute("style", style);

        // Compute size from font-size style
        let size = "24";
        const sizeMatch = style.match(/font-size:\s*(\d+)px/i);
        if (sizeMatch) {
          size = sizeMatch[1];
        } else if (host.style.fontSize) {
          size = host.style.fontSize.replace("px", "");
        }
        svgEl.setAttribute("width", size);
        svgEl.setAttribute("height", size);

        host.replaceWith(svgEl);
      } catch (err) {
        console.error(`Failed to pre-fetch icon ${iconAttr}:`, err);
      }
    })
  );
}

/** Wait for fonts + Iconify to render — each capped so it can never hang. */
async function waitForReady(doc: Document, win: Window): Promise<void> {
  await withTimeout(doc.fonts.ready, READY_TIMEOUT_MS);

  const icons = Array.from(doc.querySelectorAll("iconify-icon")) as HTMLElement[];
  if (icons.length) {
    const allRendered = Promise.all(
      icons.map(
        (el) =>
          new Promise<void>((res) => {
            const check = () => {
              // Iconify renders into shadow DOM (open) or, in some builds, light DOM.
              if (el.shadowRoot?.querySelector("svg") || el.querySelector("svg")) return res();
              setTimeout(check, 50);
            };
            check();
          })
      )
    );
    await withTimeout(allRendered, READY_TIMEOUT_MS);
  }

  // Settle time for layout + paint.
  await new Promise<void>((r) => setTimeout(r, 100));
}

/** Copy each <iconify-icon>'s rendered SVG into the light DOM so it is captured. */
function inlineIcons(doc: Document): void {
  for (const el of Array.from(doc.querySelectorAll("iconify-icon"))) {
    const host = el as HTMLElement;
    const svg = host.shadowRoot?.querySelector("svg") ?? host.querySelector("svg");
    if (!svg) continue;
    const clone = svg.cloneNode(true) as SVGElement;
    const rect = host.getBoundingClientRect();
    if (rect.width) clone.setAttribute("width", `${rect.width}`);
    if (rect.height) clone.setAttribute("height", `${rect.height}`);
    clone.style.verticalAlign = "middle";
    host.replaceWith(clone);
  }
}

export async function captureCarousel(
  html: string,
  opts: { pixelRatio?: number; quality?: number } = {}
): Promise<Blob[]> {
  const pixelRatio = opts.pixelRatio ?? 1;
  const quality = opts.quality ?? 0.92;

  const iframe = await mountHiddenIframe(html);
  try {
    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win) throw new Error("export iframe has no document");
    
    // Replace all iconify-icon elements with pure SVG elements
    await preFetchAndReplaceIcons(doc);
    
    await waitForReady(doc, win);
    inlineIcons(doc);

    const sections = Array.from(doc.querySelectorAll("section")) as HTMLElement[];
    if (!sections.length) throw new Error("no slides found to export");

    const blobs: Blob[] = [];
    for (const section of sections) {
      const blob = await toBlob(section, {
        type: "image/png",
        pixelRatio,
        width: SLIDE_W,
        height: SLIDE_H,
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
