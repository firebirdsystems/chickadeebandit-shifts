import { describe, it, expect } from "vitest";
import {
  outcomeUnknown, storedDiffers, SAVED_AS_FIRST,
  rotationInsertStatements, ROTATION_ROWS_PER_INSERT, MAX_ROTATION_DAYS, MAX_BOUND_PARAMS,
} from "../src/logic.js";

const err = (props, message = "hub text") => Object.assign(new Error(message), props);

describe("outcomeUnknown", () => {
  it("is unknown with no status, a 400, or a 5xx other than 507", () => {
    for (const e of [new TypeError("Failed to fetch"), err({ status: 0 }), err({ status: 400 }), err({ status: 500 }), err({ status: 503 })]) {
      expect(outcomeUnknown(e)).toBe(true);
    }
  });
  it("is known for a refusal", () => {
    for (const e of [err({ status: 403 }), err({ status: 404 }), err({ status: 409 }), err({ status: 413 }), err({ status: 429 }), err({ status: 507 })]) {
      expect(outcomeUnknown(e)).toBe(false);
    }
  });
  it("reads back on a duplicate: a retry that landed collides on its own pinned id", () => {
    for (const e of [err({ status: 400, code: "UNIQUE_CONSTRAINT" }), err({ status: 400 }, "UNIQUE constraint failed: x.id")]) {
      expect(outcomeUnknown(e)).toBe(true);
    }
  });
});

describe("storedDiffers", () => {
  const fields = { title: "Leak", count: 2, date: "", note: "" };
  it("treats a stored row matching the form as the same, as text", () => {
    expect(storedDiffers({ id: "x", title: "Leak", count: "2", date: null, note: "" }, fields)).toBe(false);
  });
  it("sees an edit made since the first try", () => {
    expect(storedDiffers({ title: "Leak", count: 1, date: "", note: "" }, fields)).toBe(true);
  });
  it("ignores stored columns the form does not hold", () => {
    expect(storedDiffers({ title: "Leak", count: 2, date: "", note: "", created_at: "now" }, fields)).toBe(false);
  });
});

describe("rotationInsertStatements", () => {
  const rows = (n) => Array.from({ length: n }, (_, i) => ({ id: `s${i}`, shift_type_id: "t", date: `d${i}` }));

  it("keeps every statement under the bound-value budget and the batch under 25 statements", () => {
    const statements = rotationInsertStatements(rows(MAX_ROTATION_DAYS), "now");
    expect(statements.length).toBeLessThanOrEqual(25);
    for (const s of statements) {
      expect(s.params.length).toBeLessThanOrEqual(MAX_BOUND_PARAMS);
      expect(s.params.length).toBe((s.sql.match(/\?/g) ?? []).length);
    }
  });

  it("sends every pinned id exactly once, in order", () => {
    const statements = rotationInsertStatements(rows(40), "now");
    expect(statements.length).toBe(Math.ceil(40 / ROTATION_ROWS_PER_INSERT));
    const ids = statements.flatMap(s => s.params.filter((_, i) => i % 5 === 0));
    expect(ids).toEqual(rows(40).map(r => r.id));
  });

  it("refuses a rotation longer than the cap", () => {
    expect(rotationInsertStatements(rows(MAX_ROTATION_DAYS + 1), "now")).toBe(null);
  });
});

describe("SAVED_AS_FIRST", () => {
  it("is the guide's line", () => {
    expect(SAVED_AS_FIRST).toBe("Saved as first entered — check it and update what changed.");
  });
});
