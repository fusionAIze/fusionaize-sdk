import type { RequestOptions } from "@fusionaize/sdk-transport";
// Example tests for MockTransport
import { beforeEach, describe, expect, it } from "vitest";
import { createRunRequest, createRunResponse } from "../src/fixture-builders.js";
import { MockTransport } from "../src/mock-transport.js";

describe("MockTransport", () => {
  let transport: MockTransport;

  beforeEach(() => {
    transport = new MockTransport({ baseURL: "http://localhost:9999" });
  });

  it("should match requests by URL", async () => {
    transport.mockSuccess(
      { url: "/api/v1/runs", method: "POST" },
      createRunResponse({ id: "run_123" }),
    );

    const response = await transport.request({
      url: "/api/v1/runs",
      method: "POST",
      body: createRunRequest(),
    });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe("run_123");
  });

  it("should match requests by regex URL", async () => {
    transport.mockSuccess(
      { url: /\/api\/v1\/runs\/.*/, method: "GET" },
      createRunResponse({ id: "run_456" }),
    );

    const response = await transport.request({
      url: "/api/v1/runs/run_456",
      method: "GET",
    });

    expect(response.body.id).toBe("run_456");
  });

  it("should match requests by method", async () => {
    transport.mockSuccess({ method: "GET" }, { status: 200, body: { success: true } });

    const response = await transport.request({
      url: "/any/path",
      method: "GET",
    });

    expect(response.body.success).toBe(true);
  });

  it("should match requests by partial body", async () => {
    const requestBody = { model: "claude-3-haiku", messages: [{ role: "user", content: "Hello" }] };

    transport.mockSuccess(
      MockTransport.matchPartialBody({ model: "claude-3-haiku" }),
      createRunResponse({ id: "run_matched" }),
    );

    const response = await transport.request({
      url: "/api/v1/runs",
      method: "POST",
      body: requestBody,
    });

    expect(response.body.id).toBe("run_matched");
  });

  it("should record requests", async () => {
    transport.mockSuccess(
      { url: "/test", method: "GET" },
      { status: 200, body: { recorded: true } },
    );

    await transport.request({ url: "/test", method: "GET" });
    await transport.request({ url: "/test2", method: "POST", body: { test: true } });

    const recorded = transport.getRecordedRequests();
    expect(recorded).toHaveLength(2);
    expect(recorded[0].options.url).toBe("/test");
    expect(recorded[1].options.url).toBe("/test2");
  });

  it("should simulate network errors", async () => {
    transport.mockNetworkError({ url: "/error", method: "GET" });

    await expect(transport.request({ url: "/error", method: "GET" })).rejects.toThrow(
      "No mock response matched",
    );
  });

  it("should simulate HTTP errors", async () => {
    transport.mockError(
      { url: "/not-found", method: "GET" },
      { status: 404, message: "Not Found" },
    );

    // Note: mockError creates a response that will be returned (not thrown)
    // The transport will return the error response
    const response = await transport.request({
      url: "/not-found",
      method: "GET",
    });

    expect(response.status).toBe(404);
  });

  it("should apply delays", async () => {
    const start = Date.now();
    transport.mockSuccess(
      { url: "/slow", method: "GET" },
      { status: 200, body: { slow: true }, delayMs: 100 },
    );

    await transport.request({ url: "/slow", method: "GET" });
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(100);
  });

  it("should support response limiting", async () => {
    transport.mockSuccess(
      { url: "/limited", method: "GET" },
      { status: 200, body: { count: 1 } },
      { times: 1 },
    );

    // First request succeeds
    const response1 = await transport.request({ url: "/limited", method: "GET" });
    expect(response1.body.count).toBe(1);

    // Second request fails (no match)
    await expect(transport.request({ url: "/limited", method: "GET" })).rejects.toThrow(
      "No mock response matched",
    );
  });

  it("should clear mocks and recordings", async () => {
    transport.mockSuccess({ url: "/test", method: "GET" }, { status: 200, body: { test: true } });

    await transport.request({ url: "/test", method: "GET" });
    expect(transport.getRecordedRequests()).toHaveLength(1);

    transport.clearRecordedRequests();
    expect(transport.getRecordedRequests()).toHaveLength(0);

    transport.clearMockResponses();

    await expect(transport.request({ url: "/test", method: "GET" })).rejects.toThrow(
      "No mock response matched",
    );
  });
});
