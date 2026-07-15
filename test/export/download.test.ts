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
