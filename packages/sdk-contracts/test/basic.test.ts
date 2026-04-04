import { describe, expect, it } from "vitest";
import type { RunRequest, RunResponse, StreamEvent } from "../src/index";

describe("@fusionaize/sdk-contracts", () => {
  it("should define RunRequest shape", () => {
    const request: RunRequest = {
      model: "claude-3-haiku",
      messages: [{ role: "user", content: "Hello" }],
    };
    expect(request.model).toBe("claude-3-haiku");
  });

  it("should define RunResponse shape", () => {
    const response: RunResponse = {
      id: "run_123",
      model: "claude-3-haiku",
      choices: [{ message: { role: "assistant", content: "Hi" }, finish_reason: "stop" }],
    };
    expect(response.id).toBe("run_123");
  });

  it("should define StreamEvent union", () => {
    const event: StreamEvent = { type: "run.start", data: { id: "run_1", model: "claude" } };
    expect(event.type).toBe("run.start");
  });
});
