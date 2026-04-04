import { describe, expect, it } from "vitest";
import { err, now, ok } from "../src/index";

describe("@fusionaize/sdk-core", () => {
  it("should create ok result", () => {
    const result = ok("value");
    expect(result.ok).toBe(true);
    expect(result.value).toBe("value");
  });

  it("should create err result", () => {
    const result = err(new Error("fail"));
    expect(result.ok).toBe(false);
    expect(result.error.message).toBe("fail");
  });

  it("should generate ISO timestamp", () => {
    const ts = now();
    expect(typeof ts).toBe("string");
    expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
