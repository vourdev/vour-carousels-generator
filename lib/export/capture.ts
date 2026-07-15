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
          const check = () => {
            if (el.shadowRoot?.querySelector("svg")) return res();
            requestAnimationFrame(check);
          };
          check();
        })
    )
  );
  // Two frames to let layout + paint settle (mirrors the script's post-load wait).
  await new Promise<void>((r) =>
    requestAnimationFrame(() => requestAnimationFrame(() => r()))
  );
}

/** Copy each <iconify-icon>'s shadow SVG into the light DOM so it is captured. */
function inlineIcons(doc: Document): void {
  for (const el of Array.from(doc.querySelectorAll("iconify-icon"))) {
    const host = el as HTMLElement;
    const svg = host.shadowRoot?.querySelector("svg");
    if (!svg) continue;
    const clone = svg.cloneNode(true) as SVGElement;
    const rect = host.getBoundingClientRect();
    clone.setAttribute("width", `${rect.width}`);
    clone.setAttribute("height", `${rect.height}`);
    clone.style.verticalAlign = "middle";
    host.replaceWith(clone);
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
