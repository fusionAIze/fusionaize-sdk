// Runtime‑oriented Gate access helpers

import type { RunRequest, RunResponse } from "@fusionaize/sdk-contracts";
import { ErrorCode, FusionAIzeError } from "@fusionaize/sdk-errors";
import type { HttpTransport } from "@fusionaize/sdk-transport";

export class RuntimeError extends FusionAIzeError {
  constructor(message: string, code: ErrorCode = ErrorCode.Internal) {
    super(message, code);
    this.name = "RuntimeError";
  }
}

export class RuntimeClient {
  constructor(private transport: HttpTransport) {}

  async negotiateCapabilities() {
    const response = await this.transport.request<{ capabilities: string[] }>({
      method: "GET",
      url: "/v1/capabilities",
    });
    return response.body.capabilities;
  }

  async orchestrateRun(
    request: RunRequest,
    options?: { retries?: number; fallbackModels?: string[] },
  ): Promise<RunResponse> {
    const maxRetries = options?.retries ?? 3;
    const fallbacks: string[] = options?.fallbackModels ?? [];

    for (let i = 0; i <= maxRetries; i++) {
      try {
        const response = await this.transport.request<RunResponse>({
          method: "POST",
          url: "/v1/runs",
          body: request,
        });
        return response.body;
      } catch (error) {
        if (i < maxRetries && fallbacks.length > 0) {
          request.model = fallbacks[i % fallbacks.length] as string;
          continue;
        }
        break;
      }
    }
    throw new RuntimeError("Orchestration failed", ErrorCode.ServiceUnavailable);
  }
}
