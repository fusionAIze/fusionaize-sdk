// Testing fixtures and utilities for fusionAIze SDK
// Main entry point exporting all testing utilities

// Re-export everything from all modules
export * from "./mock-transport.js";
export * from "./fixture-builders.js";
export * from "./mock-gate-server.js";
export * from "./stream-replay.js";
export * from "./contract-validation.js";
export * from "./test-utils.js";

// Legacy exports for backward compatibility
import type { AuthProvider } from "@fusionaize/sdk-auth";
import type { RunResponse, StreamEvent } from "@fusionaize/sdk-contracts";
import { ErrorCode, FusionAIzeError } from "@fusionaize/sdk-errors";

export class MockTransport {
  private responses: Array<{ matcher: (req: any) => boolean; response: any }> = [];

  mockResponse(matcher: (req: any) => boolean, response: any) {
    this.responses.push({ matcher, response });
  }

  async request<T>(req: any): Promise<T> {
    const match = this.responses.find((r) => r.matcher(req));
    if (match) {
      return match.response as T;
    }
    throw new FusionAIzeError("No mock response matched", ErrorCode.Internal);
  }
}

export const fixtures = {
  run: {
    success: {
      id: "run_mock_123",
      model: "claude-3-haiku",
      choices: [
        { message: { role: "assistant", content: "Mock response" }, finish_reason: "stop" },
      ],
    } satisfies RunResponse,
    error: new FusionAIzeError("Mock error", ErrorCode.InvalidRequest),
  },
};

export function mockRunResponse(overrides?: Partial<RunResponse>): RunResponse {
  return { ...fixtures.run.success, ...overrides };
}

export function mockStreamEvent(type: string, data: any): StreamEvent {
  return { type: `run.${type}` as any, data };
}

export class FakeAuthProvider implements AuthProvider {
  async getHeaders(): Promise<Record<string, string>> {
    return { Authorization: "Bearer fake" };
  }
}
