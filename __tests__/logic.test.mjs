import { describe, it, expect } from "vitest";
import {
  addDays,
  isoWeekStart,
  daysInRange,
  weekdayLabel,
  monthDayLabel,
  relativeDay,
  generateRotation,
  groupByDate,
  groupByType,
  canManage,
  claimsFor,
  openSpots,
  hasClaim,
  chunkIds,
  MAX_BOUND_PARAMS,
} from "../src/logic.js";

describe("date helpers", () => {
  it("addDays handles month/year rollover", () => {
    expect(addDays("2026-06-09", 1)).toBe("2026-06-10");
    expect(addDays("2026-06-30", 1)).toBe("2026-07-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("isoWeekStart returns the Monday of the week", () => {
    // 2026-06-09 is a Tuesday
    expect(isoWeekStart("2026-06-09")).toBe("2026-06-08");
    // 2026-06-08 is a Monday — should return itself
    expect(isoWeekStart("2026-06-08")).toBe("2026-06-08");
    // 2026-06-14 is a Sunday — week started Monday 2026-06-08
    expect(isoWeekStart("2026-06-14")).toBe("2026-06-08");
  });

  it("daysInRange returns inclusive list", () => {
    expect(daysInRange("2026-06-08", "2026-06-10")).toEqual([
      "2026-06-08", "2026-06-09", "2026-06-10",
    ]);
  });

  it("weekdayLabel and monthDayLabel format correctly", () => {
    expect(weekdayLabel("2026-06-09")).toBe("Tue");
    expect(monthDayLabel("2026-06-09")).toBe("Jun 9");
  });

  it("relativeDay labels today/tomorrow/other", () => {
    const today = "2026-06-09";
    expect(relativeDay("2026-06-09", today)).toBe("Today");
    expect(relativeDay("2026-06-10", today)).toBe("Tomorrow");
    expect(relativeDay("2026-06-12", today)).toBe("Fri Jun 12");
  });
});

describe("generateRotation", () => {
  const range = ["2026-06-08", "2026-06-10"]; // Mon, Tue, Wed

  it("round-robins members across the date range", () => {
    const result = generateRotation(range[0], range[1], ["a", "b"], "round-robin");
    expect(result).toEqual([
      { date: "2026-06-08", member_id: "a" },
      { date: "2026-06-09", member_id: "b" },
      { date: "2026-06-10", member_id: "a" },
    ]);
  });

  it("assigns by weekday consistently", () => {
    const result = generateRotation("2026-06-08", "2026-06-15", ["a", "b"], "weekday");
    // Monday (dow=1) -> b, Tuesday (dow=2) -> a (1 % 2 vs 2 % 2)
    const monday = result.find(r => r.date === "2026-06-08");
    const nextMonday = result.find(r => r.date === "2026-06-15");
    expect(monday.member_id).toBe(nextMonday.member_id);
  });

  it("returns null assignments when no members given", () => {
    const result = generateRotation(range[0], range[1], [], "round-robin");
    expect(result.every(r => r.member_id === null)).toBe(true);
  });
});

describe("grouping helpers", () => {
  const shifts = [
    { id: "1", date: "2026-06-08", shift_type_id: "cook" },
    { id: "2", date: "2026-06-08", shift_type_id: "clean" },
    { id: "3", date: "2026-06-09", shift_type_id: "cook" },
  ];

  it("groupByDate groups shifts by date", () => {
    const map = groupByDate(shifts);
    expect(map.get("2026-06-08")).toHaveLength(2);
    expect(map.get("2026-06-09")).toHaveLength(1);
  });

  it("groupByType groups shifts by shift_type_id", () => {
    const map = groupByType(shifts);
    expect(map.get("cook")).toHaveLength(2);
    expect(map.get("clean")).toHaveLength(1);
  });
});

describe("claim helpers", () => {
  const claims = [
    { id: "c1", shift_id: "s1", member_id: "a" },
    { id: "c2", shift_id: "s1", member_id: "b" },
    { id: "c3", shift_id: "s2", member_id: "a" },
  ];

  it("claimsFor returns the claims on one shift", () => {
    expect(claimsFor(claims, "s1")).toHaveLength(2);
    expect(claimsFor(claims, "s3")).toHaveLength(0);
  });

  it("openSpots subtracts claims from capacity, never below zero", () => {
    expect(openSpots({ id: "s1", capacity: 3 }, claims)).toBe(1);
    expect(openSpots({ id: "s1", capacity: 1 }, claims)).toBe(0);
    expect(openSpots({ id: "s2" }, claims)).toBe(0); // capacity defaults to 1
    expect(openSpots({ id: "s3" }, claims)).toBe(1);
  });

  it("hasClaim checks a member's claim on a shift", () => {
    expect(hasClaim(claims, "s1", "a")).toBe(true);
    expect(hasClaim(claims, "s2", "b")).toBe(false);
  });
});

describe("canManage", () => {
  it("allows adults and admins, denies kids and null", () => {
    expect(canManage({ role: "adult" })).toBe(true);
    expect(canManage({ role: "admin" })).toBe(true);
    expect(canManage({ role: "child" })).toBe(false);
    expect(canManage(null)).toBe(false);
  });
});

// Every `IN (…)` this app builds from an id list has to stay under D1's
// 100-bound-parameter ceiling: deleting a duty loads the claims of every shift
// it scheduled, and "my shifts" resolves up to 200 claim ids.
describe("chunkIds", () => {
  const ids = Array.from({ length: 200 }, (_, i) => `s${i}`);

  it("never exceeds the bound-parameter budget", () => {
    expect(chunkIds(ids).every(c => c.length <= MAX_BOUND_PARAMS)).toBe(true);
  });
  it("preserves every id exactly once, in order", () => {
    expect(chunkIds(ids).flat()).toEqual(ids);
  });
  it("returns nothing for an empty list", () => {
    expect(chunkIds([])).toEqual([]);
  });
});
