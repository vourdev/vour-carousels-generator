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
