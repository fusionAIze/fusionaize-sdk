// Example tests for MockGateServer
import { beforeEach, describe, expect, it } from "vitest";
import { createRunRequest } from "../src/fixture-builders.js";
import { MockGateServer } from "../src/mock-gate-server.js";

describe("MockGateServer", () => {
  let server: MockGateServer;

  beforeEach(() => {
    server = new MockGateServer({
      baseURL: "http://localhost:9999",
      autoConfigureEndpoints: true,
    });
  });

  it("should respond to health check", async () => {
    const response = await server.transport.request({
      url: "/api/v1/health",
      method: "GET",
    });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("healthy");
  });

  it("should list providers", async () => {
    const response = await server.transport.request({
      url: "/api/v1/providers",
      method: "GET",
    });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items.length).toBeGreaterThan(0);
  });

  it("should create a run", async () => {
    const request = createRunRequest();

    const response = await server.transport.request({
      url: "/api/v1/runs",
      method: "POST",
      body: request,
    });

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();

    // Verify run was stored
    const runId = response.body.id;
    const runState = server.getRun(runId);
    expect(runState).toBeDefined();
    expect(runState?.request.model).toBe(request.model);
  });

  it("should get a run", async () => {
    // First create a run
    const request = createRunRequest();
    const createResponse = await server.transport.request({
      url: "/api/v1/runs",
      method: "POST",
      body: request,
    });

    const runId = createResponse.body.id;

    // Then retrieve it
    const getResponse = await server.transport.request({
      url: `/api/v1/runs/${runId}`,
      method: "GET",
    });

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.id).toBe(runId);
  });

  it("should list runs", async () => {
    // Create a few runs
    for (let i = 0; i < 3; i++) {
      await server.transport.request({
        url: "/api/v1/runs",
        method: "POST",
        body: createRunRequest(),
      });
    }

    const response = await server.transport.request({
      url: "/api/v1/runs",
      method: "GET",
    });

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(3);
    expect(response.body.has_more).toBe(false);
  });

  it("should get run status", async () => {
    const createResponse = await server.transport.request({
      url: "/api/v1/runs",
      method: "POST",
      body: createRunRequest(),
    });

    const runId = createResponse.body.id;

    const statusResponse = await server.transport.request({
      url: `/api/v1/runs/${runId}/status`,
      method: "GET",
    });

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.id).toBe(runId);
    expect(statusResponse.body.status).toBeDefined();
  });

  it("should stream run events", async () => {
    const request = createRunRequest({ stream: true });

    const createResponse = await server.transport.request({
      url: "/api/v1/runs",
      method: "POST",
      body: request,
    });

    const runId = createResponse.body.id;

    // Note: The mock returns SSE formatted strings
    const streamResponse = await server.transport.request({
      url: `/api/v1/runs/${runId}/stream`,
      method: "GET",
    });

    expect(streamResponse.status).toBe(200);
    expect(Array.isArray(streamResponse.body)).toBe(true);
  });

  it("should handle scenarios", async () => {
    // Create a successful run scenario
    const runState = server.scenarioSuccessfulRun("test_run_123");

    expect(runState.id).toBe("test_run_123");
    expect(runState.status.status).toBe("completed");
    expect(runState.response).toBeDefined();

    // Verify it's in the server state
    expect(server.getRun("test_run_123")).toBeDefined();
  });

  it("should record requests", async () => {
    await server.transport.request({
      url: "/api/v1/health",
      method: "GET",
    });

    await server.transport.request({
      url: "/api/v1/providers",
      method: "GET",
    });

    const recorded = server.getRecordedRequests();
    expect(recorded).toHaveLength(2);
    expect(recorded[0].options.url).toBe("/api/v1/health");
    expect(recorded[1].options.url).toBe("/api/v1/providers");
  });

  it("should reset state", async () => {
    // Create some state
    server.scenarioSuccessfulRun("run_1");
    server.scenarioSuccessfulRun("run_2");

    expect(server.getAllRuns()).toHaveLength(2);

    // Reset
    server.reset();

    // State should be cleared but endpoints still work
    expect(server.getAllRuns()).toHaveLength(0);

    // Health check should still work
    const response = await server.transport.request({
      url: "/api/v1/health",
      method: "GET",
    });

    expect(response.status).toBe(200);
  });
});
