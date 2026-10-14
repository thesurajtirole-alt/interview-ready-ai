import { describe, it, expect } from "vitest";
import { parseModelJson } from "../lib/ai/parse-json";

describe("parseModelJson", () => {
  it("parses clean JSON", () => {
    expect(parseModelJson('{"a":1,"b":[1,2]}')).toEqual({ a: 1, b: [1, 2] });
  });

  it("strips a markdown code fence", () => {
    const raw = '```json\n{"ok":true}\n```';
    expect(parseModelJson(raw)).toEqual({ ok: true });
  });

  it("repairs a trailing comma before ] and }", () => {
    expect(parseModelJson('{"a":[1,2,],}')).toEqual({ a: [1, 2] });
  });

  it("handles a fence and a trailing comma together", () => {
    const raw = '```json\n{"items":["x","y",]}\n```';
    expect(parseModelJson(raw)).toEqual({ items: ["x", "y"] });
  });

  it("throws a clear error when it cannot be repaired", () => {
    expect(() => parseModelJson("this is not json")).toThrow(
      "Could not parse the AI's response as JSON"
    );
  });
});
