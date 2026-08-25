import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { crc32, titleToFilename, zipStore } from "@/lib/export/zip";

/** A byte pattern that is not all zeroes, so a wrong CRC cannot pass by accident. */
function bytes(n: number, seed: number): Uint8Array {
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) out[i] = (i * 31 + seed * 17) & 0xff;
  return out;
}

describe("crc32", () => {
  it("matches the published check value", () => {
    // The standard CRC-32 check: "123456789" -> 0xCBF43926.
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });

  it("is zero for empty input", () => {
    expect(crc32(new Uint8Array(0))).toBe(0);
  });
});

describe("titleToFilename", () => {
  it("keeps the title readable, spaces and all", () => {
    expect(titleToFilename("Kenapa index database nggak selalu bikin query cepat", "x")).toBe(
      "Kenapa index database nggak selalu bikin query cepat"
    );
  });

  it("removes only what a filesystem rejects", () => {
    expect(titleToFilename('JWT: bukan enkripsi / apa "bedanya"?', "x")).toBe(
      "JWT bukan enkripsi apa bedanya"
    );
  });

  it("keeps hyphens, which are ordinary characters in a title", () => {
    expect(titleToFilename("Rate-limit dan back-pressure", "x")).toBe(
      "Rate-limit dan back-pressure"
    );
  });

  it("falls back when the title is missing or is only punctuation", () => {
    expect(titleToFilename(undefined, "Carousel vourdev")).toBe("Carousel vourdev");
    expect(titleToFilename("", "Carousel vourdev")).toBe("Carousel vourdev");
    expect(titleToFilename("///", "Carousel vourdev")).toBe("Carousel vourdev");
  });

  it("never ends in a dot or a space, which Windows cannot open", () => {
    expect(titleToFilename("Judul lengkap...", "x")).toBe("Judul lengkap");
    expect(titleToFilename("  Judul  ", "x")).toBe("Judul");
  });

  it("truncates without leaving a trailing space", () => {
    const name = titleToFilename(`${"a".repeat(118)} bbbb`, "x");
    expect(name.length).toBeLessThanOrEqual(120);
    expect(name).not.toMatch(/\s$/);
  });
});

describe("zipStore", () => {
  it("produces an archive the system unzip accepts, with the bytes intact", async () => {
    const files = [
      { name: "Judul Deck/slide_01.jpg", data: bytes(4096, 1) },
      { name: "Judul Deck/slide_02.jpg", data: bytes(9001, 2) },
      { name: "Judul Deck/slide_03.jpg", data: bytes(1, 3) },
    ];

    const blob = await zipStore(
      files.map((f) => ({ name: f.name, blob: new Blob([f.data as BlobPart]) }))
    );
    expect(blob.type).toBe("application/zip");

    const dir = mkdtempSync(join(tmpdir(), "zip-test-"));
    const archive = join(dir, "deck.zip");
    writeFileSync(archive, Buffer.from(await blob.arrayBuffer()));

    // The real check: a third-party implementation verifying every CRC. A self-written
    // reader would only prove this file agrees with itself.
    const tested = execFileSync("unzip", ["-t", archive], { encoding: "utf8" });
    expect(tested).toMatch(/No errors detected/);

    execFileSync("unzip", ["-q", archive, "-d", dir]);
    expect(readdirSync(dir)).toContain("Judul Deck");
    for (const f of files) {
      const out = readFileSync(join(dir, f.name));
      expect(new Uint8Array(out)).toEqual(f.data);
    }
  });

  it("extracts into a single folder rather than scattering slides", async () => {
    const blob = await zipStore([
      { name: "Deck/slide_01.jpg", blob: new Blob([bytes(64, 1) as BlobPart]) },
      { name: "Deck/slide_02.jpg", blob: new Blob([bytes(64, 2) as BlobPart]) },
    ]);
    const dir = mkdtempSync(join(tmpdir(), "zip-root-"));
    const archive = join(dir, "deck.zip");
    writeFileSync(archive, Buffer.from(await blob.arrayBuffer()));

    const listing = execFileSync("unzip", ["-Z", "-1", archive], { encoding: "utf8" })
      .trim()
      .split("\n");
    const roots = new Set(listing.map((l) => l.split("/")[0]));
    expect([...roots]).toEqual(["Deck"]);
  });

  it("stores a non-ASCII entry name as UTF-8 and says so in the flags", async () => {
    const name = "Café ☕/slide_01.jpg";
    const blob = await zipStore([{ name, blob: new Blob([bytes(32, 5) as BlobPart]) }]);
    const buf = Buffer.from(await blob.arrayBuffer());

    // Asserted against the archive rather than against an extractor, because the
    // extractors disagree and both common ones are wrong. macOS ships Info-ZIP 6.00 from
    // 2009, which predates general-purpose bit 11 and transcodes the name through its own
    // table — and Ubuntu's build does the same, turning this entry into "Caf├й тШХ". Only
    // ditto and Windows Explorer read it as written. So the thing worth testing is what
    // this writer controls: the bytes on disk and the flag that declares them.
    expect(buf.readUInt32LE(0)).toBe(0x04034b50); // local file header

    const flags = buf.readUInt16LE(6);
    expect(flags & 0x800).toBe(0x800); // bit 11: the name is UTF-8

    const nameLen = buf.readUInt16LE(26);
    const stored = buf.subarray(30, 30 + nameLen);
    expect(stored.equals(Buffer.from(name, "utf8"))).toBe(true);
    // No stray transcoding: the length is the UTF-8 byte length, not the character count.
    expect(nameLen).toBe(Buffer.byteLength(name, "utf8"));
    expect(nameLen).toBeGreaterThan(name.length);
  });

  it("writes an empty archive rather than a malformed one", async () => {
    const blob = await zipStore([]);
    const dir = mkdtempSync(join(tmpdir(), "zip-empty-"));
    const archive = join(dir, "empty.zip");
    writeFileSync(archive, Buffer.from(await blob.arrayBuffer()));

    // Info-ZIP exits non-zero for an empty archive, so the exit code cannot be the
    // assertion. What distinguishes valid-but-empty from malformed is the message: an
    // unreadable file reports a format error instead.
    let out = "";
    try {
      out = execFileSync("unzip", ["-t", archive], { encoding: "utf8", stdio: "pipe" });
    } catch (err) {
      out = String((err as { stdout?: Buffer }).stdout ?? "");
    }
    expect(out).toMatch(/zipfile is empty/);
    expect(out).not.toMatch(/cannot find zipfile directory|not a zipfile/);
  });
});
