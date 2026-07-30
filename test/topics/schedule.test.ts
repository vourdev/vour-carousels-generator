import { describe, it, expect } from "vitest";
import { MODE_COUNTS, scheduleDates } from "@/lib/topics/schedule";

describe("scheduleDates", () => {
  it("weekly: 7 consecutive days starting at the anchor (midnight)", () => {
    const dates = scheduleDates("weekly", new Date("2026-08-03T15:30:00"), MODE_COUNTS.weekly);
    expect(dates).toHaveLength(7);
    const days = dates.map((d) => new Date(d!).getDate());
    expect(days).toEqual([3, 4, 5, 6, 7, 8, 9]);
    // time zeroed
    expect(new Date(dates[0]!).getHours()).toBe(0);
  });

  it("monthly: 28 consecutive days, no gaps", () => {
    const dates = scheduleDates("monthly", new Date("2026-08-01T00:00:00"), MODE_COUNTS.monthly);
    expect(dates).toHaveLength(28);
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]!).getTime();
      const cur = new Date(dates[i]!).getTime();
      expect(cur - prev).toBe(24 * 60 * 60 * 1000);
    }
  });

  it("ideas: backlog entries get no dates", () => {
    const dates = scheduleDates("ideas", new Date(), 5);
    expect(dates).toHaveLength(5);
    expect(dates.every((d) => d === undefined)).toBe(true);
  });
});
