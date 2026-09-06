import { describe, expect, it } from "vitest";
import { resolveRange, toDayKey, zeroFill } from "./buckets";

describe("resolveRange", () => {
  it("spans the requested number of days inclusive of today", () => {
    const now = new Date("2026-09-06T13:45:00.000Z");

    expect(resolveRange("7d", now)).toEqual({
      days: 7,
      since: new Date("2026-08-31T00:00:00.000Z"),
    });
    expect(resolveRange("30d", now)).toEqual({
      days: 30,
      since: new Date("2026-08-08T00:00:00.000Z"),
    });
    expect(resolveRange("90d", now)).toEqual({
      days: 90,
      since: new Date("2026-06-09T00:00:00.000Z"),
    });
  });

  it("truncates to UTC midnight regardless of time of day", () => {
    const endOfDay = resolveRange("7d", new Date("2026-09-06T23:59:59.999Z"));
    const startOfDay = resolveRange("7d", new Date("2026-09-06T00:00:00.000Z"));

    expect(endOfDay.since).toEqual(startOfDay.since);
  });
});

describe("zeroFill", () => {
  const since = new Date("2026-09-01T00:00:00.000Z");

  it("returns one bucket per day when there are no rows", () => {
    const filled = zeroFill([], since, 5);

    expect(filled).toEqual([
      { count: 0, day: "2026-09-01" },
      { count: 0, day: "2026-09-02" },
      { count: 0, day: "2026-09-03" },
      { count: 0, day: "2026-09-04" },
      { count: 0, day: "2026-09-05" },
    ]);
  });

  it("fills gaps between sparse rows with zeroes", () => {
    const filled = zeroFill(
      [
        { count: 4, day: "2026-09-01" },
        { count: 7, day: "2026-09-04" },
      ],
      since,
      5
    );

    expect(filled.map((row) => row.count)).toEqual([4, 0, 0, 7, 0]);
  });

  it("keeps both boundary days", () => {
    const filled = zeroFill(
      [
        { count: 1, day: "2026-09-01" },
        { count: 9, day: "2026-09-05" },
      ],
      since,
      5
    );

    expect(filled.at(0)).toEqual({ count: 1, day: "2026-09-01" });
    expect(filled.at(-1)).toEqual({ count: 9, day: "2026-09-05" });
  });

  it("ignores rows outside the window", () => {
    const filled = zeroFill(
      [
        { count: 3, day: "2026-08-31" },
        { count: 5, day: "2026-09-02" },
      ],
      since,
      3
    );

    expect(filled).toEqual([
      { count: 0, day: "2026-09-01" },
      { count: 5, day: "2026-09-02" },
      { count: 0, day: "2026-09-03" },
    ]);
  });

  it("crosses a month boundary without drift", () => {
    const filled = zeroFill([], new Date("2026-08-30T00:00:00.000Z"), 4);

    expect(filled.map((row) => row.day)).toEqual([
      "2026-08-30",
      "2026-08-31",
      "2026-09-01",
      "2026-09-02",
    ]);
  });
});

describe("toDayKey", () => {
  it("formats in UTC, not local time", () => {
    expect(toDayKey(new Date("2026-09-06T23:30:00.000Z"))).toBe("2026-09-06");
  });
});
