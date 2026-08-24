import { slideFilename, slideFilenames } from "@/lib/export/filenames";
import { titleToFilename, zipStore } from "@/lib/export/zip";

export function namedBlobs(blobs: Blob[]): { name: string; blob: Blob }[] {
  const names = slideFilenames(blobs.length);
  return blobs.map((blob, i) => ({ name: names[i], blob }));
}

/** The archive name for a deck whose title is missing or is entirely punctuation. */
const FALLBACK_DECK_NAME = "Carousel vourdev";

/**
 * Hand one blob to the browser as a file.
 *
 * The object URL is revoked on a later turn rather than on the next line: revoking it
 * immediately after `click()` races the browser's own fetch of that URL, and that race is
 * lost often enough to produce a download that silently saves nothing.
 */
function saveBlob(name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/**
 * Save a set of blobs as separate files.
 *
 * The clicks are staggered because browsers rate-limit a burst of programmatic downloads
 * from one gesture and silently drop the tail of it. That limitation is why the bulk path
 * below produces an archive instead: eight files from one click was always fighting the
 * browser, and the operator then had eight loose slides in a downloads folder with no
 * indication which deck they belonged to.
 */
export function downloadNamedBlobs(
  items: { name: string; blob: Blob }[],
): void {
  items.forEach(({ name, blob }, i) => {
    setTimeout(() => saveBlob(name, blob), i * 120);
  });
}

/**
 * Fetch remote images as blobs, in deck order.
 *
 * `<a download href="https://res.cloudinary.com/…">` does not download anything: the
 * attribute is ignored for a cross-origin URL, so the browser navigates to the image
 * instead of saving it. The bytes have to come back through fetch first, which also gives
 * each file a real name rather than Cloudinary's public id.
 *
 * Throws if any image cannot be fetched, so the caller can say so rather than appearing to
 * have done nothing.
 */
export async function fetchImageBlobs(urls: string[]): Promise<Blob[]> {
  return Promise.all(
    urls.map(async (url) => {
      const res = await fetch(url, { mode: "cors", credentials: "omit" });
      if (!res.ok) throw new Error(`${res.status} on ${url}`);
      return res.blob();
    }),
  );
}

/**
 * Save a whole deck as one archive named after its title.
 *
 * The slides go inside a folder of the same name rather than at the archive root. Every
 * desktop extractor handles a single-rooted archive by placing that one folder where the
 * user asked, so this is the shape that cannot scatter eight JPEGs across a downloads
 * folder — which is what a flat archive does to anyone using `unzip` directly.
 */
export async function downloadBlobsAsZip(
  blobs: Blob[],
  title?: string | null,
): Promise<string> {
  const folder = titleToFilename(title, FALLBACK_DECK_NAME);
  const zip = await zipStore(
    blobs.map((blob, i) => ({
      name: `${folder}/${slideFilename(i + 1)}`,
      blob,
    })),
  );
  saveBlob(`${folder}.zip`, zip);
  return `${folder}.zip`;
}

/** Same, for slides that live in Cloudinary rather than in memory. */
export async function downloadUrlsAsZip(
  urls: string[],
  title?: string | null,
): Promise<string> {
  return downloadBlobsAsZip(await fetchImageBlobs(urls), title);
}
