import { describe, it, expect } from "vitest";
import { captureCarouselServer } from "@/lib/export/capture-server";

describe("captureCarouselServer", () => {
  it("screenshots a basic HTML carousel with playwright", async () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <section style="width: 1080px; height: 1350px; background: red;">Slide 1</section>
          <section style="width: 1080px; height: 1350px; background: blue;">Slide 2</section>
        </body>
      </html>
    `;
    const buffers = await captureCarouselServer(html, { pixelRatio: 1 });
    expect(buffers).toHaveLength(2);
    expect(buffers[0]).toBeInstanceOf(Buffer);
    expect(buffers[0].length).toBeGreaterThan(0);
    expect(buffers[1]).toBeInstanceOf(Buffer);
    expect(buffers[1].length).toBeGreaterThan(0);
  });
});
