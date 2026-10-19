import { describe, it, expect } from "vitest";
import { formatRuntime, formatRating, formatYear } from "./format";

describe("formatRuntime", () => {
  it("formats hours and minutes", () => {
    expect(formatRuntime(152)).toBe("2h 32m");
  });
  it("formats minutes only when under an hour", () => {
    expect(formatRuntime(45)).toBe("45m");
  });
  it("returns empty string for null", () => {
    expect(formatRuntime(null)).toBe("");
  });
});

describe("formatRating", () => {
  it("returns 'Not available' for null", () => {
    expect(formatRating(null)).toBe("Not available");
  });
  it("appends suffix when provided", () => {
    expect(formatRating(94, "%")).toBe("94%");
  });
});

describe("formatYear", () => {
  it("extracts year from ISO date", () => {
    expect(formatYear("2008-07-18")).toBe("2008");
  });
  it("returns empty string for null", () => {
    expect(formatYear(null)).toBe("");
  });
});
