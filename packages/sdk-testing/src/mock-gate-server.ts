// Mock Gate Server helper for simulating Gate API
// Provides a high-level mock server that can be used for integration testing

import type {
  ApprovalDecision,
  ApprovalRequest,
  ListResponse,
  PaginationParams,
  ProviderDescriptor,
  RunListItem,
  RunRequest,
  RunResponse,
  RunStatus,
  Status,
  StreamEvent,
} from "@fusionaize/sdk-contracts";
import { ErrorCode, FusionAIzeError } from "@fusionaize/sdk-errors";
import type { RequestOptions, Response, Transport } from "@fusionaize/sdk-transport";
import {
  createApprovalDecision,
  createApprovalRequest,
  createListResponse,
  createProviderDescriptor,
  createRunCompletionEvent,
  createRunErrorEvent,
  createRunFinishEvent,
  createRunListItem,
  createRunRequest,
  createRunResponse,
  createRunStartEvent,
  createRunStatus,
  createStatus,
} from "./fixture-builders.js";
import { MockTransport, type MockTransportOptions, type RequestMatcher } from "./mock-transport.js";

export interface MockGateServerOptions extends MockTransportOptions {
  /** Base path for API endpoints */
  basePath?: string;
  /** Default delay for responses in ms */
  responseDelayMs?: number;
  /** Whether to automatically handle common endpoints */
  autoConfigureEndpoints?: boolean;
  /** Initial list of runs */
  initialRuns?: RunListItem[];
  /** Initial list of providers */
  providers?: ProviderDescriptor[];
}

export interface MockRunState {
  id: string;
  request: RunRequest;
  status: RunStatus;
  response?: RunResponse;
  streamEvents?: StreamEvent[];
  approvalRequests?: ApprovalRequest[];
}

export class MockGateServer {
  readonly transport: MockTransport;
  private basePath: string;
  private responseDelayMs: number;
  private runs: Map<string, MockRunState> = new Map();
  private providers: ProviderDescriptor[] = [];
  private requestCounter = 0;

  constructor(options: MockGateServerOptions = {}) {
    this.basePath = options.basePath || "/api/v1";
    this.responseDelayMs = options.responseDelayMs || 0;

    this.transport = new MockTransport({
      baseURL: options.baseURL || "http://localhost:9999",
      defaultDelayMs: options.responseDelayMs,
      failUnmatchedRequests: true,
    });

    if (options.initialRuns) {
      for (const run of options.initialRuns) {
        this.runs.set(run.id, {
          id: run.id,
          request: createRunRequest(),
          status: createRunStatus({ id: run.id, status: run.status }),
        });
      }
    }

    this.providers = options.providers || [
      createProviderDescriptor({ id: "anthropic", name: "Anthropic" }),
      createProviderDescriptor({ id: "openai", name: "OpenAI" }),
    ];

    if (options.autoConfigureEndpoints !== false) {
      this.configureDefaultEndpoints();
    }
  }

  // ============================================================================
  // ENDPOINT CONFIGURATION
  // ============================================================================

  configureDefaultEndpoints(): void {
    // Health endpoint
    this.mockHealth();

    // Providers endpoint
    this.mockProviders();

    // Runs endpoints
    this.mockCreateRun();
    this.mockGetRun();
    this.mockListRuns();
    this.mockRunStatus();
    this.mockCancelRun();

    // Approvals endpoints
    this.mockCreateApproval();
    this.mockGetApproval();
    this.mockSubmitApprovalDecision();

    // Streaming endpoint
    this.mockStreamRun();
  }

  mockHealth(): void {
    this.transport.mockSuccess(
      { url: `${this.basePath}/health`, method: "GET" },
      createStatus({ status: "healthy" }),
    );
  }

  mockProviders(): void {
    this.transport.mockSuccess(
      { url: `${this.basePath}/providers`, method: "GET" },
      createListResponse(this.providers),
    );
  }

  mockCreateRun(): void {
    this.transport.mockResponse(
      { url: `${this.basePath}/runs`, method: "POST" },
      {
        status: 201,
        body: (options: RequestOptions) => {
          const requestBody = options.body as RunRequest;
          const runId = `run_${Date.now()}_${++this.requestCounter}`;

          const runState: MockRunState = {
            id: runId,
            request: requestBody,
            status: createRunStatus({
              id: runId,
              status: requestBody.stream ? "running" : "pending",
            }),
          };

          if (requestBody.stream) {
            // For streaming runs, generate events
            runState.streamEvents = [
              createRunStartEvent({ id: runId, model: requestBody.model }),
              createRunCompletionEvent({ content: "Hello" }),
              createRunCompletionEvent({ content: " world" }),
              createRunFinishEvent({ finish_reason: "stop" }),
            ];
          } else {
            // For non-streaming runs, generate a response
            runState.response = createRunResponse({
              id: runId,
              model: requestBody.model,
            });
            runState.status.status = "completed";
            runState.status.completed_at = new Date().toISOString();
          }

          this.runs.set(runId, runState);

          if (requestBody.stream) {
            // For streaming, return the run ID immediately
            return { id: runId };
          } else {
            return runState.response;
          }
        },
      },
    );
  }

  mockGetRun(): void {
    this.transport.mockResponse(
      {
        url: new RegExp(`${this.basePath}/runs/([^/]+)`),
        method: "GET",
      },
      {
        status: 200,
        body: (_options: RequestOptions, matchedGroups?: string[]) => {
          const runId = matchedGroups?.[1];
          if (!runId || !this.runs.has(runId)) {
            throw new FusionAIzeError("Run not found", ErrorCode.NotFound);
          }
          const runState = this.runs.get(runId)!;
          return runState.response || createRunResponse({ id: runId });
        },
      },
    );
  }

  mockListRuns(): void {
    this.transport.mockResponse(
      { url: `${this.basePath}/runs`, method: "GET" },
      {
        status: 200,
        body: (options: RequestOptions) => {
          const query = options.query || {};
          const limit = Number.parseInt(String(query.limit || "20"));
          const offset = Number.parseInt(String(query.offset || "0"));

          const allRuns = Array.from(this.runs.values()).map((run) =>
            createRunListItem({
              id: run.id,
              model: run.request.model,
              status: run.status.status,
              created_at: run.status.started_at || new Date().toISOString(),
              completed_at: run.status.completed_at,
            }),
          );

          const items = allRuns.slice(offset, offset + limit);
          return createListResponse(items, {
            has_more: offset + limit < allRuns.length,
            total: allRuns.length,
          });
        },
      },
    );
  }

  mockRunStatus(): void {
    this.transport.mockResponse(
      {
        url: new RegExp(`${this.basePath}/runs/([^/]+)/status`),
        method: "GET",
      },
      {
        status: 200,
        body: (_options: RequestOptions, matchedGroups?: string[]) => {
          const runId = matchedGroups?.[1];
          if (!runId || !this.runs.has(runId)) {
            throw new FusionAIzeError("Run not found", ErrorCode.NotFound);
          }
          return this.runs.get(runId)!.status;
        },
      },
    );
  }

  mockCancelRun(): void {
    this.transport.mockResponse(
      {
        url: new RegExp(`${this.basePath}/runs/([^/]+)/cancel`),
        method: "POST",
      },
      {
        status: 200,
        body: (_options: RequestOptions, matchedGroups?: string[]) => {
          const runId = matchedGroups?.[1];
          if (!runId || !this.runs.has(runId)) {
            throw new FusionAIzeError("Run not found", ErrorCode.NotFound);
          }

          const runState = this.runs.get(runId)!;
          runState.status.status = "cancelled";
          runState.status.completed_at = new Date().toISOString();

          return { success: true };
        },
      },
    );
  }

  mockCreateApproval(): void {
    // This would be called internally by the server when a run requires approval
    // Not typically called directly by clients
  }

  mockGetApproval(): void {
    this.transport.mockResponse(
      {
        url: new RegExp(`${this.basePath}/approvals/([^/]+)`),
        method: "GET",
      },
      {
        status: 200,
        body: () => {
          return createApprovalRequest();
        },
      },
    );
  }

  mockSubmitApprovalDecision(): void {
    this.transport.mockResponse(
      {
        url: new RegExp(`${this.basePath}/approvals/([^/]+)/decision`),
        method: "POST",
      },
      {
        status: 200,
        body: () => {
          return createApprovalDecision();
        },
      },
    );
  }

  mockStreamRun(): void {
    this.transport.mockResponse(
      {
        url: new RegExp(`${this.basePath}/runs/([^/]+)/stream`),
        method: "GET",
      },
      {
        status: 200,
        body: (_options: RequestOptions, matchedGroups?: string[]) => {
          const runId = matchedGroups?.[1];
          if (!runId || !this.runs.has(runId)) {
            throw new FusionAIzeError("Run not found", ErrorCode.NotFound);
          }

          const runState = this.runs.get(runId)!;
          if (!runState.streamEvents) {
            throw new FusionAIzeError("Run is not streaming", ErrorCode.InvalidRequest);
          }

          // Return events as SSE formatted strings
          return runState.streamEvents.map((event) => `data: ${JSON.stringify(event)}\n\n`);
        },
      },
    );
  }

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  addRun(runState: MockRunState): void {
    this.runs.set(runState.id, runState);
  }

  getRun(runId: string): MockRunState | undefined {
    return this.runs.get(runId);
  }

  getAllRuns(): MockRunState[] {
    return Array.from(this.runs.values());
  }

  clearRuns(): void {
    this.runs.clear();
  }

  addProvider(provider: ProviderDescriptor): void {
    this.providers.push(provider);
  }

  getProviders(): ProviderDescriptor[] {
    return [...this.providers];
  }

  clearProviders(): void {
    this.providers = [];
  }

  // ============================================================================
  // SCENARIO HELPERS
  // ============================================================================

  scenarioSuccessfulRun(runId?: string): MockRunState {
    const id = runId || `run_${Date.now()}_${++this.requestCounter}`;
    const request = createRunRequest();
    const response = createRunResponse({ id });
    const status = createRunStatus({ id, status: "completed" });

    const runState: MockRunState = {
      id,
      request,
      status,
      response,
    };

    this.addRun(runState);
    return runState;
  }

  scenarioRunWithToolCalls(runId?: string): MockRunState {
    const id = runId || `run_${Date.now()}_${++this.requestCounter}`;
    const request = createRunRequest({
      tools: [
        {
          type: "function",
          function: {
            name: "get_weather",
            description: "Get weather for location",
            parameters: {
              type: "object",
              properties: {
                location: { type: "string" },
              },
              required: ["location"],
            },
          },
        },
      ],
      tool_choice: "auto",
    });

    const response = createRunResponse({
      id,
      choices: [
        {
          message: {
            role: "assistant",
            content: null,
            tool_calls: [
              {
                id: `tool_call_${Date.now()}`,
                type: "function",
                function: {
                  name: "get_weather",
                  arguments: JSON.stringify({ location: "San Francisco" }),
                },
              },
            ],
          },
          finish_reason: "tool_calls",
        },
      ],
    });

    const status = createRunStatus({ id, status: "completed" });

    const runState: MockRunState = {
      id,
      request,
      status,
      response,
    };

    this.addRun(runState);
    return runState;
  }

  scenarioStreamingRun(runId?: string): MockRunState {
    const id = runId || `run_${Date.now()}_${++this.requestCounter}`;
    const request = createRunRequest({ stream: true });

    const streamEvents: StreamEvent[] = [
      createRunStartEvent({ id, model: request.model }),
      createRunCompletionEvent({ content: "Hello" }),
      createRunCompletionEvent({ content: " " }),
      createRunCompletionEvent({ content: "world" }),
      createRunFinishEvent({ finish_reason: "stop" }),
    ];

    const status = createRunStatus({
      id,
      status: "completed",
      completed_at: new Date().toISOString(),
    });

    const runState: MockRunState = {
      id,
      request,
      status,
      streamEvents,
    };

    this.addRun(runState);
    return runState;
  }

  scenarioRunRequiringApproval(runId?: string): MockRunState {
    const id = runId || `run_${Date.now()}_${++this.requestCounter}`;
    const request = createRunRequest();
    const status = createRunStatus({
      id,
      status: "pending",
      progress: 50,
    });

    const runState: MockRunState = {
      id,
      request,
      status,
      approvalRequests: [createApprovalRequest({ id: `approval_${id}` })],
    };

    this.addRun(runState);
    return runState;
  }

  scenarioErroredRun(runId?: string, error?: string): MockRunState {
    const id = runId || `run_${Date.now()}_${++this.requestCounter}`;
    const request = createRunRequest();
    const status = createRunStatus({
      id,
      status: "failed",
      error: {
        code: "internal_error",
        message: error || "Something went wrong",
      },
      completed_at: new Date().toISOString(),
    });

    const runState: MockRunState = {
      id,
      request,
      status,
    };

    this.addRun(runState);
    return runState;
  }

  // ============================================================================
  // TRANSPORT DELEGATION
  // ============================================================================

  /** Delegate to the underlying transport */
  use(transport: any): this {
    this.transport.use(transport);
    return this;
  }

  /** Get recorded requests */
  getRecordedRequests() {
    return this.transport.getRecordedRequests();
  }

  /** Clear recorded requests */
  clearRecordedRequests() {
    this.transport.clearRecordedRequests();
  }

  /** Clear mock responses */
  clearMockResponses() {
    this.transport.clearMockResponses();
  }

  /** Reset entire server state */
  reset(): void {
    this.clearRuns();
    this.clearProviders();
    this.clearRecordedRequests();
    this.clearMockResponses();
    this.requestCounter = 0;
    this.configureDefaultEndpoints();
  }
}
