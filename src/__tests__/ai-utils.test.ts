import { describe, it, expect } from "vitest";
import { extractJSON } from "@/lib/ai-utils";

describe("extractJSON", () => {
  it("parses valid JSON directly", () => {
    const result = extractJSON<{ name: string }>('{"name": "test"}');
    expect(result).toEqual({ name: "test" });
  });

  it("extracts JSON from markdown code block", () => {
    const text = 'Some text\n```json\n{"key": "value"}\n```\nMore text';
    const result = extractJSON<{ key: string }>(text);
    expect(result).toEqual({ key: "value" });
  });

  it("extracts raw JSON object from text", () => {
    const text = 'Here is the result: {"status": "ok"} end';
    const result = extractJSON<{ status: string }>(text);
    expect(result).toEqual({ status: "ok" });
  });

  it("returns null for non-JSON text", () => {
    expect(extractJSON("no json here")).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(extractJSON("{invalid}")).toBeNull();
  });
});
