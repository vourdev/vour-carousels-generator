import { describe, it, expect } from "vitest";
import {
  revealedLength,
  elapsedSeconds,
  phaseAt,
  countSections,
  parseMeta,
  REVEAL_CHARS_PER_MS,
} from "@/app/create/_components/utils";

describe("revealedLength", () => {
  const T0 = 1_000_000;

  it("reveals nothing before any time has passed", () => {
    expect(revealedLength(T0, T0, 500)).toBe(0);
  });

  it("reveals everything once the full duration has elapsed", () => {
    const total = 3000;
    const fullDuration = total / REVEAL_CHARS_PER_MS;
    expect(revealedLength(T0, T0 + fullDuration, total)).toBe(total);
    // and stays clamped well past the end
    expect(revealedLength(T0, T0 + fullDuration * 10, total)).toBe(total);
  });

  it("is monotonic across the reveal", () => {
    const total = 2000;
    let prev = -1;
    for (let ms = 0; ms <= 10_000; ms += 137) {
      const n = revealedLength(T0, T0 + ms, total);
      expect(n).toBeGreaterThanOrEqual(prev);
      expect(n).toBeLessThanOrEqual(total);
      prev = n;
    }
  });

  it("keeps the old 4-chars-per-15ms pace when the tab is focused", () => {
    // 15ms of wall clock should reveal ~4 characters, as the previous tick-based
    // implementation did — the fix changes the driver, not the speed.
    expect(revealedLength(T0, T0 + 15, 1000)).toBe(4);
    expect(revealedLength(T0, T0 + 150, 1000)).toBe(40);
  });

  it("jumps to the correct offset after a throttled gap instead of crawling", () => {
    // This is the whole point: a hidden tab fires the timer once per second rather
    // than every 15ms. Tick-based reveal would advance 4 chars; clock-based lands
    // where the reveal actually should be.
    const afterOneThrottledSecond = revealedLength(T0, T0 + 1000, 5000);
    expect(afterOneThrottledSecond).toBe(266);
    expect(afterOneThrottledSecond).toBeGreaterThan(4);
  });

  it("never returns a negative or NaN length for a clock that moves backwards", () => {
    expect(revealedLength(T0, T0 - 5000, 500)).toBe(0);
    expect(revealedLength(T0, Number.NaN, 500)).toBe(0);
  });

  it("handles empty text", () => {
    expect(revealedLength(T0, T0 + 99999, 0)).toBe(0);
  });
});

describe("elapsedSeconds", () => {
  it("reports real elapsed time, not tick count", () => {
    expect(elapsedSeconds(1000, 1000)).toBe(0);
    expect(elapsedSeconds(1000, 5400)).toBe(4);
    expect(elapsedSeconds(1000, 121_000)).toBe(120);
  });

  it("floors at zero when the clock moves backwards", () => {
    expect(elapsedSeconds(5000, 1000)).toBe(0);
  });
});

describe("phaseAt", () => {
  it("advances one phase every 4s and then holds on the last", () => {
    expect(phaseAt(0, 0, 4)).toBe(0);
    expect(phaseAt(0, 3999, 4)).toBe(0);
    expect(phaseAt(0, 4000, 4)).toBe(1);
    expect(phaseAt(0, 11_000, 4)).toBe(2);
    expect(phaseAt(0, 60_000, 4)).toBe(3); // held, never wraps
  });

  it("is safe for a job with no phases", () => {
    expect(phaseAt(0, 10_000, 0)).toBe(0);
  });
});

describe("carousel HTML helpers", () => {
  it("counts slide sections", () => {
    expect(countSections('<section class="a">x</section><section>y</section>')).toBe(2);
    expect(countSections("<p>no slides</p>")).toBe(0);
  });

  it("reads the vourdev-meta block", () => {
    const html = `<script type="application/json" id="vourdev-meta">
      {"title":"Judul","caption":"Cap","hashtags":["fyp","backend"]}
    </script><section></section>`;
    expect(parseMeta(html)).toEqual({
      title: "Judul",
      caption: "Cap",
      hashtags: ["fyp", "backend"],
    });
  });

  it("falls back when the meta block is missing or malformed", () => {
    expect(parseMeta("<section></section>")).toEqual({
      title: "Untitled",
      caption: "",
      hashtags: [],
    });
    const broken = '<script id="vourdev-meta">{not json</script>';
    expect(parseMeta(broken)).toEqual({ title: "Untitled", caption: "", hashtags: [] });
  });
});
