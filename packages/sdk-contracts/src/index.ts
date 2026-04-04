// Contracts and type definitions for fusionAIze API interactions
// v1 client-side contract model - provider-neutral, Gate-first compatible

import type { JsonObject, JsonValue, Metadata, Timestamp } from "@fusionaize/sdk-core";

// ============================================================================
// CORE TYPES & ENVELOPES
// ============================================================================

/**
 * Standard status object for health checks and operational status
 * @beta
 */
export interface Status {
  /** Overall status: "healthy", "degraded", "unhealthy" */
  status: "healthy" | "degraded" | "unhealthy";
  /** Detailed status checks */
  checks?: Array<{
    name: string;
    status: "pass" | "fail" | "warn";
    details?: JsonValue;
  }>;
  /** When this status was generated */
  timestamp: Timestamp;
}

// ============================================================================
// CAPABILITY DESCRIPTORS
// ============================================================================

/**
 * Describes a capability that a provider or runtime supports
 * @beta - Capability modeling may evolve as provider ecosystem expands
 */
export interface CapabilityDescriptor {
  /** Unique identifier for this capability */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what this capability enables */
  description?: string;
  /** Semantic version of the capability specification */
  version?: string;
  /** Optional constraints or parameters for this capability */
  constraints?: JsonObject;
  /** When this capability is available (e.g., "runtime", "deployment") */
  scope?: string[];
}

/**
 * Provider descriptor with supported models and capabilities
 * @beta
 */
export interface ProviderDescriptor {
  /** Provider identifier (e.g., "openai", "anthropic", "azure-openai") */
  id: string;
  /** Human-readable provider name */
  name: string;
  /** Supported models and their capabilities */
  models: Array<{
    id: string;
    name?: string;
    capabilities?: string[];
    constraints?: {
      maxTokens?: number;
      supportsTools?: boolean;
      supportsStreaming?: boolean;
    };
  }>;
  /** General capabilities offered by this provider */
  capabilities: CapabilityDescriptor[];
}

// ============================================================================
// MESSAGE & CONTEXT TYPES
// ============================================================================

/**
 * Message role in a conversation
 * @stable - Follows standard chat completion patterns
 */
export type MessageRole = "system" | "user" | "assistant" | "tool";

/**
 * A single message in a conversation
 * @stable
 */
export interface Message {
  role: MessageRole;
  content: string;
  /** Optional name to identify the speaker */
  name?: string;
  /** For tool messages, the ID of the tool call this responds to */
  tool_call_id?: string;
}

// ============================================================================
// TOOL DEFINITIONS & INVOCATIONS
// ============================================================================

/**
 * Tool definition for function calling
 * @stable - Compatible with OpenAI tool definitions
 */
export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters: JsonObject;
  };
}

/**
 * Tool choice configuration
 * @stable
 */
export type ToolChoice = 
  | "none"      // No tool calls
  | "auto"      // Model decides
  | { type: "function"; function: { name: string } };  // Specific function

/**
 * A tool invocation from the model
 * @stable
 */
export interface ToolCall {
  /** Unique identifier for this tool call */
  id: string;
  type: "function";
  function: {
    /** Name of the function to call */
    name: string;
    /** JSON string of arguments */
    arguments: string;
  };
}

/**
 * Result of a tool execution to be sent back to the model
 * @stable
 */
export interface ToolResult {
  /** ID of the tool call this result corresponds to */
  tool_call_id: string;
  /** Output from the tool execution */
  output: string;
}

// ============================================================================
// RUN REQUEST & RESPONSE
// ============================================================================

/**
 * Parameters for creating a new run
 * @stable - Core run execution contract
 */
export interface RunRequest {
  /** Model identifier to use for this run */
  model: string;
  /** Conversation messages */
  messages: Message[];
  /** Available tools for function calling */
  tools?: ToolDefinition[];
  /** Tool calling configuration */
  tool_choice?: ToolChoice;
  /** Maximum tokens to generate */
  max_tokens?: number;
  /** Sampling temperature (0-2) */
  temperature?: number;
  /** Nucleus sampling parameter (0-1) */
  top_p?: number;
  /** Whether to stream responses */
  stream?: boolean;
  /** Additional provider-specific parameters */
  parameters?: JsonObject;
  /** User-provided metadata */
  metadata?: Metadata;
}

/**
 * Possible finish reasons for a run
 * @stable
 */
export type FinishReason = 
  | "stop"        // Model generated a complete response
  | "length"      // Max tokens reached
  | "tool_calls"  // Model requested tool calls
  | "error"       // An error occurred
  | "cancelled"   // Run was cancelled by user
  | "timeout";    // Run timed out

/**
 * Choice in a run response
 * @stable
 */
export interface RunChoice {
  /** The assistant's message */
  message: {
    role: "assistant";
    content: string | null;
    /** Tool calls requested by the model */
    tool_calls?: ToolCall[];
  };
  /** Why the run finished */
  finish_reason: FinishReason;
}

/**
 * Token usage statistics
 * @stable
 */
export interface TokenUsage {
  /** Number of tokens in the prompt */
  prompt_tokens: number;
  /** Number of tokens in the completion */
  completion_tokens: number;
  /** Total tokens used */
  total_tokens: number;
}

/**
 * Response from a run execution
 * @stable
 */
export interface RunResponse {
  /** Unique identifier for this run */
  id: string;
  /** Model used for this run */
  model: string;
  /** Generated choices (typically one, but supports multiple) */
  choices: RunChoice[];
  /** Token usage statistics */
  usage?: TokenUsage;
  /** When the run was created */
  created_at?: Timestamp;
  /** When the run completed */
  completed_at?: Timestamp;
  /** User-provided metadata */
  metadata?: Metadata;
}

// ============================================================================
// APPROVAL WORKFLOW TYPES
// ============================================================================

/**
 * Request for human approval
 * @beta - Approval workflows may evolve based on runtime requirements
 */
export interface ApprovalRequest {
  /** Unique ID for this approval request */
  id: string;
  /** What requires approval (e.g., "tool_call", "cost_limit", "content_filter") */
  type: string;
  /** Context about what needs approval */
  context: JsonObject;
  /** Optional timeout for approval */
  timeout_seconds?: number;
  /** When this request was created */
  requested_at: Timestamp;
}

/**
 * Decision on an approval request
 * @beta
 */
export interface ApprovalDecision {
  /** Whether the request was approved */
  approved: boolean;
  /** Optional reason for the decision */
  reason?: string;
  /** Optional constraints or modifications */
  constraints?: JsonObject;
  /** When the decision was made */
  decided_at: Timestamp;
}

// ============================================================================
// STREAM EVENT TYPES
// ============================================================================

/**
 * Base stream event type
 * @stable - Core streaming contract
 */
export interface StreamEventBase {
  /** Event type discriminator */
  type: string;
  /** Event-specific data */
  data: JsonValue;
  /** Optional trace metadata */
  trace?: TraceMetadata;
}

/**
 * Run started event
 * @stable
 */
export interface RunStartEvent {
  type: "run.start";
  data: {
    id: string;
    model: string;
  };
}

/**
 * Content completion event (streaming)
 * @stable
 */
export interface RunCompletionEvent {
  type: "run.completion";
  data: {
    /** Content chunk */
    content: string;
  };
}

/**
 * Tool call event
 * @stable
 */
export interface RunToolCallEvent {
  type: "run.tool_call";
  data: ToolCall;
}

/**
 * Tool result event
 * @stable
 */
export interface RunToolResultEvent {
  type: "run.tool_result";
  data: ToolResult;
}

/**
 * Run finished event
 * @stable
 */
export interface RunFinishEvent {
  type: "run.finish";
  data: {
    finish_reason: FinishReason;
  };
}

/**
 * Run error event
 * @stable
 */
export interface RunErrorEvent {
  type: "run.error";
  data: {
    error: string;
    details?: JsonValue;
  };
}

/**
 * Union type of all possible stream events
 * @stable
 */
export type StreamEvent = 
  | RunStartEvent
  | RunCompletionEvent
  | RunToolCallEvent
  | RunToolResultEvent
  | RunFinishEvent
  | RunErrorEvent;

// ============================================================================
// TRACE METADATA
// ============================================================================

/**
 * Trace metadata for distributed tracing
 * @stable - Compatible with W3C Trace Context
 */
export interface TraceMetadata {
  /** Trace identifier */
  traceId: string;
  /** Span identifier */
  spanId?: string;
  /** Parent span identifier */
  parentSpanId?: string;
  /** Trace flags (e.g., sampled flag) */
  traceFlags?: number;
  /** Additional attributes */
  attributes?: Record<string, string | number | boolean>;
}

// ============================================================================
// PAGINATION & LISTING
// ============================================================================

/**
 * Pagination parameters
 * @stable
 */
export interface PaginationParams {
  /** Maximum number of items to return */
  limit?: number;
  /** Offset for pagination (alternative to cursor) */
  offset?: number;
  /** Cursor for pagination */
  cursor?: string;
}

/**
 * Standard list response
 * @stable
 */
export interface ListResponse<T> {
  /** The items in this page */
  items: T[];
  /** Cursor for the next page, if available */
  next_cursor?: string;
  /** Whether more items are available */
  has_more: boolean;
  /** Total count of items (if known) */
  total?: number;
}

/**
 * Pagination parameters (alias for PaginationParams for backward compatibility)
 * @stable
 */
export type Pagination = PaginationParams;

// ============================================================================
// RUN STATUS & OPERATIONS
// ============================================================================

/**
 * Run status information
 * @stable
 */
export interface RunStatus {
  /** Run ID */
  id: string;
  /** Current status */
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  /** Progress indicator (0-100) if applicable */
  progress?: number;
  /** When the run started */
  started_at?: Timestamp;
  /** When the run completed (if applicable) */
  completed_at?: Timestamp;
  /** Error information if failed */
  error?: {
    code: string;
    message: string;
    details?: JsonValue;
  };
}

/**
 * Run list item (summary view)
 * @stable
 */
export interface RunListItem {
  id: string;
  model: string;
  status: RunStatus["status"];
  created_at: Timestamp;
  completed_at?: Timestamp;
  metadata?: Metadata;
}

// ============================================================================
// RE-EXPORT CORE TYPES
// ============================================================================

// Re-export core types from sdk-core for convenience
export type { JsonObject, JsonValue, Metadata, Timestamp, Envelope, Result } from "@fusionaize/sdk-core";