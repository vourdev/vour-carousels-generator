/**
 * A minimal ZIP writer, store-only.
 *
 * No library, for a reason that is not "fewer dependencies". Every file going in here is
 * already a JPEG, and deflating a JPEG saves nothing — a test deck of eight slides comes
 * out 0.2% smaller and takes an order of magnitude longer. The stored method writes the
 * bytes through untouched, which is both the correct choice and the small one: a general
 * zip library would ship ~100 KB of deflate to the browser to achieve nothing.
 *
 * Store-only also keeps the format small enough to be obviously correct: three record
 * types, no bit-level encoding. What is here is the whole spec that applies. ZIP64 is
 * deliberately absent — it starts mattering at 4 GB, and a carousel is about 2 MB.
 */

/**
 * CRC-32 (IEEE), which every zip entry carries and every extractor verifies.
 *
 * The table is built once on first use rather than at module load: the download path is
 * dynamically imported, so this file's cost should land when someone actually saves
 * something, not when the wizard mounts.
 */
let CRC_TABLE: Uint32Array | null = null;

function crcTable(): Uint32Array {
  if (CRC_TABLE) return CRC_TABLE;
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  CRC_TABLE = t;
  return t;
}

export function crc32(bytes: Uint8Array): number {
  const t = crcTable();
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++)
    c = t[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * MS-DOS date and time, which is what a zip entry stores.
 *
 * Two-second resolution and an epoch of 1980, both inherent to the format. Worth setting
 * properly anyway: entries left at zero extract with a 1980 timestamp, and a folder of
 * slides dated before the format existed looks like corruption to anyone who notices.
 */
function dosDateTime(d: Date): { time: number; date: number } {
  const year = Math.max(1980, d.getFullYear());
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

/** UTF-8 in entry names. Set alongside general-purpose bit 11 so extractors trust it. */
const UTF8_FLAG = 0x800;

const LOCAL_SIG = 0x04034b50;
const CENTRAL_SIG = 0x02014b50;
const EOCD_SIG = 0x06054b50;

export interface ZipEntry {
  /** Path inside the archive. Forward slashes, no leading slash. */
  name: string;
  blob: Blob;
}

/**
 * Pack entries into one archive.
 *
 * Order is preserved, which matters more than it sounds: extracting gives a folder of
 * slides, and the reader is meant to page through them in deck order. The names carry the
 * ordering (`slide_01.jpg`), so this only has to not shuffle them.
 */
export async function zipStore(entries: ZipEntry[]): Promise<Blob> {
  const now = new Date();
  const { time, date } = dosDateTime(now);
  const encoder = new TextEncoder();

  const locals: BlobPart[] = [];
  const centrals: Uint8Array<ArrayBuffer>[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const data = new Uint8Array(await entry.blob.arrayBuffer());
    const crc = crc32(data);

    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, LOCAL_SIG, true);
    lv.setUint16(4, 20, true); // version needed to extract: 2.0
    lv.setUint16(6, UTF8_FLAG, true);
    lv.setUint16(8, 0, true); // method 0 = stored
    lv.setUint16(10, time, true);
    lv.setUint16(12, date, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true); // compressed size == uncompressed, stored
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, name.length, true);
    lv.setUint16(28, 0, true); // no extra field
    local.set(name, 30);

    // The header, then the caller's blob rather than the copy read out of it: Blob already
    // holds these bytes, and handing them back keeps one copy in memory instead of two.
    locals.push(local, entry.blob);

    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, CENTRAL_SIG, true);
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, UTF8_FLAG, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, time, true);
    cv.setUint16(14, date, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint16(30, 0, true); // extra
    cv.setUint16(32, 0, true); // comment
    cv.setUint16(34, 0, true); // disk number
    cv.setUint16(36, 0, true); // internal attrs
    cv.setUint32(38, 0, true); // external attrs
    cv.setUint32(42, offset, true); // where this entry's local header starts
    central.set(name, 46);
    centrals.push(central);

    offset += local.length + data.length;
  }

  const centralSize = centrals.reduce((n, c) => n + c.length, 0);

  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, EOCD_SIG, true);
  ev.setUint16(4, 0, true); // this disk
  ev.setUint16(6, 0, true); // disk with the central directory
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true); // central directory starts after the last entry
  ev.setUint16(20, 0, true); // no archive comment

  return new Blob([...locals, ...centrals, eocd], { type: "application/zip" });
}

/**
 * What a filesystem rejects: path separators, the set Windows reserves, and control
 * characters. Spaces and hyphens are deliberately absent -- they are ordinary characters
 * in a title, and the whole point is that the file reads like the title.
 */
const ILLEGAL_IN_FILENAME = /[/\\:*?"<>|\x00-\x1f]/g;

/**
 * Turn a deck title into a filename a human recognises.
 *
 * Spaces stay. The title IS the name the operator knows the deck by — "Kenapa index
 * database nggak selalu bikin query cepat.zip" is the point of this feature, and slugging
 * it to kebab-case would be tidier for a URL and worse for the person opening a downloads
 * folder. Only what a filesystem actually rejects is removed.
 *
 * Capped at 120 characters because a title can run to 90 and the archive name also becomes
 * the folder name inside it; the extension has to survive the truncation.
 */
export function titleToFilename(
  title: string | undefined | null,
  fallback: string,
): string {
  const cleaned = (title ?? "")
    .replace(ILLEGAL_IN_FILENAME, " ")
    .replace(/\s+/g, " ")
    // Trailing dots and spaces are legal to create on Unix and unopenable on Windows.
    .replace(/^[\s.]+|[\s.]+$/g, "")
    .slice(0, 120)
    .trimEnd();
  return cleaned || fallback;
}
