// Fixture builders for all contract types
// Provides factory functions to create test data with sensible defaults

import type {
  ApprovalDecision,
  ApprovalRequest,
  CapabilityDescriptor,
  ListResponse,
  Message,
  MessageRole,
  PaginationParams,
  ProviderDescriptor,
  RunChoice,
  RunCompletionEvent,
  RunErrorEvent,
  RunFinishEvent,
  RunListItem,
  RunRequest,
  RunResponse,
  RunStartEvent,
  RunStatus,
  RunToolCallEvent,
  RunToolResultEvent,
  Status,
  StreamEvent,
  TokenUsage,
  ToolCall,
  ToolDefinition,
  ToolResult,
  TraceMetadata,
} from "@fusionaize/sdk-contracts";
import { ErrorCode, FusionAIzeError } from "@fusionaize/sdk-errors";

// ============================================================================
// CORE FIXTURE FACTORIES
// ============================================================================

export function createMessage(overrides?: Partial<Message>): Message {
  return {
    role: "user",
    content: "Hello, world!",
    ...overrides,
  };
}

export function createToolDefinition(overrides?: Partial<ToolDefinition>): ToolDefinition {
  return {
    type: "function",
    function: {
      name: "get_weather",
      description: "Get the current weather for a location",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string" },
          unit: { type: "string", enum: ["celsius", "fahrenheit"] },
        },
        required: ["location"],
      },
      ...overrides?.function,
    },
    ...overrides,
  };
}

export function createToolCall(overrides?: Partial<ToolCall>): ToolCall {
  return {
    id: `tool_call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type: "function",
    function: {
      name: "get_weather",
      arguments: JSON.stringify({ location: "San Francisco", unit: "celsius" }),
      ...overrides?.function,
    },
    ...overrides,
  };
}

export function createToolResult(overrides?: Partial<ToolResult>): ToolResult {
  return {
    tool_call_id: "tool_call_123",
    output: JSON.stringify({ temperature: 22, condition: "sunny" }),
    ...overrides,
  };
}

export function createRunChoice(overrides?: Partial<RunChoice>): RunChoice {
  return {
    message: {
      role: "assistant",
      content: "The weather in San Francisco is 22°C and sunny.",
      ...overrides?.message,
    },
    finish_reason: "stop",
    ...overrides,
  };
}

export function createTokenUsage(overrides?: Partial<TokenUsage>): TokenUsage {
  return {
    prompt_tokens: 100,
    completion_tokens: 50,
    total_tokens: 150,
    ...overrides,
  };
}

export function createRunResponse(overrides?: Partial<RunResponse>): RunResponse {
  return {
    id: `run_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    model: "claude-3-haiku",
    choices: [createRunChoice()],
    usage: createTokenUsage(),
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createRunRequest(overrides?: Partial<RunRequest>): RunRequest {
  return {
    model: "claude-3-haiku",
    messages: [createMessage()],
    max_tokens: 1000,
    temperature: 0.7,
    stream: false,
    ...overrides,
  };
}

// ============================================================================
// STREAM EVENT FIXTURES
// ============================================================================

export function createRunStartEvent(overrides?: Partial<RunStartEvent["data"]>): RunStartEvent {
  return {
    type: "run.start",
    data: {
      id: `run_${Date.now()}`,
      model: "claude-3-haiku",
      ...overrides,
    },
  };
}

export function createRunCompletionEvent(
  overrides?: Partial<RunCompletionEvent["data"]>,
): RunCompletionEvent {
  return {
    type: "run.completion",
    data: {
      content: "Hello",
      ...overrides,
    },
  };
}

export function createRunToolCallEvent(
  overrides?: Partial<RunToolCallEvent["data"]>,
): RunToolCallEvent {
  return {
    type: "run.tool_call",
    data: createToolCall(overrides),
  };
}

export function createRunToolResultEvent(
  overrides?: Partial<RunToolResultEvent["data"]>,
): RunToolResultEvent {
  return {
    type: "run.tool_result",
    data: createToolResult(overrides),
  };
}

export function createRunFinishEvent(overrides?: Partial<RunFinishEvent["data"]>): RunFinishEvent {
  return {
    type: "run.finish",
    data: {
      finish_reason: "stop",
      ...overrides,
    },
  };
}

export function createRunErrorEvent(overrides?: Partial<RunErrorEvent["data"]>): RunErrorEvent {
  return {
    type: "run.error",
    data: {
      error: "Something went wrong",
      details: { code: "internal_error" },
      ...overrides,
    },
  };
}

// Type guard to check event type
export function isStreamEventOfType<T extends StreamEvent["type"]>(
  event: StreamEvent,
  type: T,
): event is Extract<StreamEvent, { type: T }> {
  return event.type === type;
}

// ============================================================================
// STATUS & HEALTH FIXTURES
// ============================================================================

export function createStatus(overrides?: Partial<Status>): Status {
  return {
    status: "healthy",
    timestamp: new Date().toISOString(),
    checks: [
      { name: "database", status: "pass" },
      { name: "cache", status: "pass" },
    ],
    ...overrides,
  };
}

export function createCapabilityDescriptor(
  overrides?: Partial<CapabilityDescriptor>,
): CapabilityDescriptor {
  return {
    id: "function_calling",
    name: "Function Calling",
    description: "Supports tool/function calling",
    version: "1.0.0",
    scope: ["runtime"],
    ...overrides,
  };
}

export function createProviderDescriptor(
  overrides?: Partial<ProviderDescriptor>,
): ProviderDescriptor {
  return {
    id: "anthropic",
    name: "Anthropic",
    models: [
      {
        id: "claude-3-haiku",
        name: "Claude 3 Haiku",
        capabilities: ["function_calling", "streaming"],
        constraints: {
          maxTokens: 4096,
          supportsTools: true,
          supportsStreaming: true,
        },
      },
    ],
    capabilities: [createCapabilityDescriptor()],
    ...overrides,
  };
}

// ============================================================================
// APPROVAL WORKFLOW FIXTURES
// ============================================================================

export function createApprovalRequest(overrides?: Partial<ApprovalRequest>): ApprovalRequest {
  return {
    id: `approval_${Date.now()}`,
    type: "tool_call",
    context: {
      tool_name: "execute_payment",
      amount: 100,
      currency: "USD",
    },
    requested_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createApprovalDecision(overrides?: Partial<ApprovalDecision>): ApprovalDecision {
  return {
    approved: true,
    reason: "Approved by system policy",
    decided_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// RUN STATUS & LISTING FIXTURES
// ============================================================================

export function createRunStatus(overrides?: Partial<RunStatus>): RunStatus {
  return {
    id: `run_${Date.now()}`,
    status: "completed",
    progress: 100,
    started_at: new Date(Date.now() - 5000).toISOString(),
    completed_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createRunListItem(overrides?: Partial<RunListItem>): RunListItem {
  return {
    id: `run_${Date.now()}`,
    model: "claude-3-haiku",
    status: "completed",
    created_at: new Date(Date.now() - 10000).toISOString(),
    completed_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// PAGINATION FIXTURES
// ============================================================================

export function createPaginationParams(overrides?: Partial<PaginationParams>): PaginationParams {
  return {
    limit: 20,
    offset: 0,
    ...overrides,
  };
}

export function createListResponse<T>(
  items: T[],
  overrides?: Partial<ListResponse<T>>,
): ListResponse<T> {
  const limit = 20; // default page size
  return {
    items,
    has_more: items.length >= limit,
    total: items.length,
    ...overrides,
  };
}

// ============================================================================
// TRACING FIXTURES
// ============================================================================

export function createTraceMetadata(overrides?: Partial<TraceMetadata>): TraceMetadata {
  return {
    traceId: generateTraceId(),
    spanId: generateSpanId(),
    traceFlags: 1,
    ...overrides,
  };
}

// ============================================================================
// SCENARIO BUILDERS (COMMON TEST SCENARIOS)
// ============================================================================

export const scenarios = {
  // Basic successful run
  successfulRun: (overrides?: {
    request?: Partial<RunRequest>;
    response?: Partial<RunResponse>;
  }) => ({
    request: createRunRequest(overrides?.request),
    response: createRunResponse(overrides?.response),
  }),

  // Run with tool calls
  runWithToolCalls: () => ({
    request: createRunRequest({
      tools: [createToolDefinition()],
      tool_choice: "auto",
    }),
    response: createRunResponse({
      choices: [
        createRunChoice({
          message: {
            role: "assistant",
            content: null,
            tool_calls: [createToolCall()],
          },
          finish_reason: "tool_calls",
        }),
      ],
    }),
  }),

  // Run with streaming
  streamingRun: () => ({
    request: createRunRequest({ stream: true }),
    events: [
      createRunStartEvent(),
      createRunCompletionEvent({ content: "Hello" }),
      createRunCompletionEvent({ content: " world" }),
      createRunFinishEvent(),
    ] as StreamEvent[],
  }),

  // Run that requires approval
  runRequiringApproval: () => ({
    request: createRunRequest(),
    approvalRequest: createApprovalRequest(),
  }),

  // Run with error
  erroredRun: (error?: Partial<RunErrorEvent["data"]>) => ({
    request: createRunRequest(),
    errorEvent: createRunErrorEvent(error),
  }),

  // Rate limited request
  rateLimited: () => ({
    request: createRunRequest(),
    error: new FusionAIzeError("Rate limit exceeded", ErrorCode.RateLimited),
  }),

  // Authentication failure
  authenticationFailure: () => ({
    request: createRunRequest(),
    error: new FusionAIzeError("Invalid API key", ErrorCode.AuthenticationFailed),
  }),
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateTraceId(): string {
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

function generateSpanId(): string {
  return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

export function generateRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function generateMessage(role: MessageRole = "user", content?: string): Message {
  const defaultContent = {
    system: "You are a helpful assistant.",
    user: "Hello, how are you?",
    assistant: "I'm doing well, thank you for asking!",
    tool: "Tool execution result",
  };

  return {
    role,
    content: content ?? defaultContent[role],
  };
}

// ============================================================================
// FIXTURE COLLECTIONS (LEGACY COMPATIBILITY)
// ============================================================================

export const fixtures = {
  run: {
    success: createRunResponse(),
    error: new FusionAIzeError("Mock error", ErrorCode.InvalidRequest),
  },
  message: {
    user: createMessage({ role: "user" }),
    assistant: createMessage({ role: "assistant" }),
    system: createMessage({ role: "system" }),
  },
  tool: {
    definition: createToolDefinition(),
    call: createToolCall(),
    result: createToolResult(),
  },
  status: {
    healthy: createStatus({ status: "healthy" }),
    degraded: createStatus({ status: "degraded" }),
    unhealthy: createStatus({ status: "unhealthy" }),
  },
};

// Re-export legacy functions for backward compatibility
export { mockRunResponse } from "./index.js";
export { mockStreamEvent } from "./index.js";
