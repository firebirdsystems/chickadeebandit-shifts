import { describe, it, expect } from "vitest";
import { failureLine, shiftClaimLine } from "../src/logic.js";

const err = (props, message = "hub text") => Object.assign(new Error(message), props);
const words = { action: "save the duty", thing: "duty" };

describe("failureLine", () => {
  it("names a duplicate by code, or by the hub's text while production lags", () => {
    expect(failureLine(err({ status: 400, code: "UNIQUE_CONSTRAINT" }), words)).toBe("That duty already exists.");
    expect(failureLine(err({ status: 400 }, "UNIQUE constraint failed: x.id"), words)).toBe("That duty already exists.");
  });
  it("names a refusal without asking for a retry", () => {
    expect(failureLine(err({ status: 403 }), words)).toBe("You don’t have permission to save the duty.");
    expect(failureLine(err({ status: 507 }), words)).toBe("The household’s storage is full — free up space first.");
    expect(failureLine(err({ status: 429 }), words)).toBe("Too many tries — wait a minute and try again.");
  });
  it("splits a write that changed nothing by the caller's re-read", () => {
    expect(failureLine(err({ found: false }), { ...words, found: false })).toBe("This duty has been removed.");
    expect(failureLine(err({ found: true }), { ...words, found: true })).toBe("You don’t have permission to save the duty.");
  });
  it("reads a 404 as removed and a 409 as changed", () => {
    expect(failureLine(err({ status: 404 }), words)).toBe("This duty has been removed.");
    expect(failureLine(err({ status: 409 }), words)).toBe("This duty was changed by someone else — check it first.");
  });
  it("asks for a retry only when retrying can work", () => {
    for (const e of [err({}), err({ status: 500 }), err({ status: 503 }), err({ status: 400 }), new TypeError("Failed to fetch"), undefined]) {
      expect(failureLine(e, words)).toBe("Couldn’t save the duty — try again.");
    }
    expect(failureLine(err({}), { ...words, found: undefined })).toBe("Couldn’t save the duty — try again.");
  });
  it("keeps a line the app wrote for the user, and never shows hub text", () => {
    expect(failureLine(err({ forUser: true }, "Pick a date first."), words)).toBe("Pick a date first.");
    expect(failureLine(err({ status: 500 }, "D1_ERROR: boom"), words)).not.toMatch(/D1_ERROR/);
  });
});

describe("shiftClaimLine", () => {
  it("names the slot-claims refusals the endpoint gives a reason for", () => {
    expect(shiftClaimLine(err({ status: 409, reason: "slot_full" }), "claim")).toBe("That shift was just filled.");
    expect(shiftClaimLine(err({ status: 409, reason: "slot_full" }), "assign")).toBe("That shift was just filled.");
    expect(shiftClaimLine(err({ status: 409, reason: "already_claimed" }), "claim")).toBe("You’re already on this shift.");
    expect(shiftClaimLine(err({ status: 409, reason: "already_claimed" }), "assign")).toBe("They’re already on this shift.");
  });
  it("reads a release's 404 as the claim being gone", () => {
    expect(shiftClaimLine(err({ status: 404 }), "release")).toBe("You’re no longer on this shift.");
    expect(shiftClaimLine(err({ status: 404 }), "unassign")).toBe("They’re no longer on this shift.");
  });
  it("splits an assign's 404 by whether the shift is still listed", () => {
    expect(shiftClaimLine(err({ status: 404 }), "assign", true)).toBe("That person is no longer in the household.");
    expect(shiftClaimLine(err({ status: 404 }), "assign", false)).toBe("This shift has been removed.");
    expect(shiftClaimLine(err({ status: 404 }), "assign")).toBe("Couldn’t assign the shift — try again.");
  });
  it("falls back to the table for everything else", () => {
    expect(shiftClaimLine(err({ status: 404 }), "claim")).toBe("This shift has been removed.");
    expect(shiftClaimLine(err({ status: 403 }), "assign")).toBe("You don’t have permission to assign the shift.");
    expect(shiftClaimLine(err({ status: 409 }), "claim")).toBe("This shift was changed by someone else — check it first.");
    expect(shiftClaimLine(err({ status: 429 }), "claim")).toBe("Too many tries — wait a minute and try again.");
    expect(shiftClaimLine(err({ status: 503 }), "release")).toBe("Couldn’t release the shift — try again.");
    expect(shiftClaimLine(new TypeError("Failed to fetch"), "claim")).toBe("Couldn’t claim the shift — try again.");
  });
});
