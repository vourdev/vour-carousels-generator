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

  it("round-trips a non-ASCII entry name", async () => {
    const blob = await zipStore([
      { name: "Café ☕/slide_01.jpg", blob: new Blob([bytes(32, 5) as BlobPart]) },
    ]);
    const dir = mkdtempSync(join(tmpdir(), "zip-utf8-"));
    const archive = join(dir, "deck.zip");
    writeFileSync(archive, Buffer.from(await blob.arrayBuffer()));

    // Extracted with ditto, which is the engine behind Finder's own unarchiving, rather
    // than with the `unzip` used above. macOS ships Info-ZIP 6.00 from 2009, which predates
    // general-purpose bit 11 and transcodes names through its own table instead — it turns
    // this entry into "Caf+? ???" and then refuses to create it. Nothing in the archive can
    // satisfy both readers, so the archive stays correct and the test uses the reader the
    // users actually double-click.
    const out = join(dir, "x");
    execFileSync("ditto", ["-x", "-k", archive, out]);
    // Normalized before comparing: APFS stores names decomposed (NFD), so the composed
    // string written here is not the string readdir hands back, though both are one name.
    const roots = readdirSync(out).map((n) => n.normalize("NFC"));
    expect(roots).toContain("Café ☕");
    expect(readdirSync(join(out, "Café ☕".normalize("NFD")))).toEqual(["slide_01.jpg"]);
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
