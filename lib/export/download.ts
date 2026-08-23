import { slideFilenames } from "@/lib/export/filenames";

export function namedBlobs(blobs: Blob[]): { name: string; blob: Blob }[] {
  const names = slideFilenames(blobs.length);
  return blobs.map((blob, i) => ({ name: names[i], blob }));
}

/**
 * Save a set of blobs as files.
 *
 * Two things here are not incidental. The object URL is revoked on a later turn rather
 * than on the next line: revoking it immediately after `click()` races the browser's own
 * fetch of that URL, and a deck of eight slides fired in a tight loop is exactly where
 * that race is lost. And the clicks are staggered, because browsers rate-limit a burst of
 * programmatic downloads from one gesture and silently drop the tail of it.
 */
export function downloadNamedBlobs(items: { name: string; blob: Blob }[]): void {
  items.forEach(({ name, blob }, i) => {
    setTimeout(() => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    }, i * 120);
  });
}

/**
 * Save remote images as files.
 *
 * `<a download href="https://res.cloudinary.com/…">` does not download anything: the
 * attribute is ignored for a cross-origin URL, so the browser navigates to the image
 * instead of saving it. The bytes have to come back through fetch first, which also gives
 * the file a real name rather than Cloudinary's public id.
 *
 * Throws if any image cannot be fetched, so the caller can say so rather than appearing to
 * have done nothing.
 */
export async function downloadUrlsAsFiles(urls: string[]): Promise<void> {
  const blobs = await Promise.all(
    urls.map(async (url) => {
      const res = await fetch(url, { mode: "cors", credentials: "omit" });
      if (!res.ok) throw new Error(`${res.status} on ${url}`);
      return res.blob();
    })
  );
  downloadNamedBlobs(namedBlobs(blobs));
}
