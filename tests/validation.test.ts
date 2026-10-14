import { describe, it, expect } from "vitest";
import {
  uuidSchema,
  answerTextSchema,
  interviewModeSchema,
  validateBody,
} from "../lib/validation";

describe("uuidSchema", () => {
  it("accepts a real UUID", () => {
    expect(
      uuidSchema.safeParse("e89d854f-2d37-400e-9e34-f981521a5683").success
    ).toBe(true);
  });

  it("rejects anything else", () => {
    expect(uuidSchema.safeParse("abc").success).toBe(false);
    expect(uuidSchema.safeParse("").success).toBe(false);
    expect(uuidSchema.safeParse(123).success).toBe(false);
  });
});

describe("answerTextSchema", () => {
  it("trims whitespace", () => {
    expect(answerTextSchema.parse("  hello  ")).toBe("hello");
  });

  it("rejects empty and whitespace-only answers", () => {
    expect(answerTextSchema.safeParse("").success).toBe(false);
    expect(answerTextSchema.safeParse("    ").success).toBe(false);
  });

  it("accepts exactly 4000 characters and rejects 4001", () => {
    expect(answerTextSchema.safeParse("a".repeat(4000)).success).toBe(true);
    expect(answerTextSchema.safeParse("a".repeat(4001)).success).toBe(false);
  });
});

describe("interviewModeSchema", () => {
  it("defaults to professional", () => {
    expect(interviewModeSchema.parse(undefined)).toBe("professional");
  });

  it("accepts the four tones and rejects others", () => {
    expect(interviewModeSchema.safeParse("pressure").success).toBe(true);
    expect(interviewModeSchema.safeParse("angry").success).toBe(false);
  });
});

describe("validateBody", () => {
  it("returns the data when valid", () => {
    const r = validateBody(answerTextSchema, " hi ");
    expect(r).toEqual({ success: true, data: "hi" });
  });

  it("returns a readable message when invalid", () => {
    const r = validateBody(answerTextSchema, "");
    expect(r).toEqual({ success: false, error: "Answer can't be empty." });
  });
});
