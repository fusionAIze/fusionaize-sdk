// Contract validation helpers for testing
// Provides utilities to validate requests and responses against contracts

import type {
  ApprovalDecision,
  ApprovalRequest,
  FinishReason,
  ListResponse,
  Message,
  MessageRole,
  PaginationParams,
  ProviderDescriptor,
  RunListItem,
  RunRequest,
  RunResponse,
  RunStatus,
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
// TYPE GUARDS
// ============================================================================

export function isRunRequest(obj: unknown): obj is RunRequest {
  if (typeof obj !== "object" || obj === null) return false;

  const req = obj as Record<string, unknown>;
  return (
    typeof req.model === "string" && Array.isArray(req.messages) && req.messages.every(isMessage)
  );
}

export function isMessage(obj: unknown): obj is Message {
  if (typeof obj !== "object" || obj === null) return false;

  const msg = obj as Record<string, unknown>;
  return (
    typeof msg.role === "string" &&
    ["system", "user", "assistant", "tool"].includes(msg.role) &&
    typeof msg.content === "string"
  );
}

export function isToolDefinition(obj: unknown): obj is ToolDefinition {
  if (typeof obj !== "object" || obj === null) return false;

  const tool = obj as Record<string, unknown>;
  return (
    tool.type === "function" &&
    typeof tool.function === "object" &&
    tool.function !== null &&
    typeof (tool.function as any).name === "string"
  );
}

export function isToolCall(obj: unknown): obj is ToolCall {
  if (typeof obj !== "object" || obj === null) return false;

  const call = obj as Record<string, unknown>;
  return (
    typeof call.id === "string" &&
    call.type === "function" &&
    typeof call.function === "object" &&
    call.function !== null &&
    typeof (call.function as any).name === "string" &&
    typeof (call.function as any).arguments === "string"
  );
}

export function isToolResult(obj: unknown): obj is ToolResult {
  if (typeof obj !== "object" || obj === null) return false;

  const result = obj as Record<string, unknown>;
  return typeof result.tool_call_id === "string" && typeof result.output === "string";
}

export function isRunResponse(obj: unknown): obj is RunResponse {
  if (typeof obj !== "object" || obj === null) return false;

  const resp = obj as Record<string, unknown>;
  return (
    typeof resp.id === "string" &&
    typeof resp.model === "string" &&
    Array.isArray(resp.choices) &&
    resp.choices.length > 0 &&
    resp.choices.every(isRunChoice)
  );
}

export function isRunChoice(obj: unknown): obj is any {
  if (typeof obj !== "object" || obj === null) return false;

  const choice = obj as Record<string, unknown>;
  return (
    typeof choice.message === "object" &&
    choice.message !== null &&
    (choice.message as any).role === "assistant" &&
    typeof choice.finish_reason === "string"
  );
}

export function isStreamEvent(obj: unknown): obj is StreamEvent {
  if (typeof obj !== "object" || obj === null) return false;

  const event = obj as Record<string, unknown>;
  if (typeof event.type !== "string") return false;

  const validTypes = [
    "run.start",
    "run.completion",
    "run.tool_call",
    "run.tool_result",
    "run.finish",
    "run.error",
  ];

  return validTypes.includes(event.type);
}

export function isStatus(obj: unknown): obj is Status {
  if (typeof obj !== "object" || obj === null) return false;

  const status = obj as Record<string, unknown>;
  return (
    typeof status.status === "string" &&
    ["healthy", "degraded", "unhealthy"].includes(status.status) &&
    typeof status.timestamp === "string"
  );
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class ContractValidator {
  static validateRunRequest(request: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!isRunRequest(request)) {
      errors.push("Object is not a valid RunRequest");
      return { valid: false, errors, warnings };
    }

    const req = request as RunRequest;

    // Validate model
    if (!req.model.trim()) {
      errors.push("Model must not be empty");
    }

    // Validate messages
    if (req.messages.length === 0) {
      errors.push("Messages array must not be empty");
    }

    for (let i = 0; i < req.messages.length; i++) {
      const msg = req.messages[i];
      if (!msg.content.trim()) {
        warnings.push(`Message at index ${i} has empty content`);
      }
    }

    // Validate tools if present
    if (req.tools !== undefined) {
      if (!Array.isArray(req.tools)) {
        errors.push("Tools must be an array");
      } else {
        for (let i = 0; i < req.tools.length; i++) {
          if (!isToolDefinition(req.tools[i])) {
            errors.push(`Tool at index ${i} is not a valid ToolDefinition`);
          }
        }
      }
    }

    // Validate numeric ranges
    if (req.temperature !== undefined) {
      if (req.temperature < 0 || req.temperature > 2) {
        warnings.push("Temperature should be between 0 and 2");
      }
    }

    if (req.top_p !== undefined) {
      if (req.top_p < 0 || req.top_p > 1) {
        warnings.push("top_p should be between 0 and 1");
      }
    }

    if (req.max_tokens !== undefined) {
      if (req.max_tokens < 1) {
        errors.push("max_tokens must be at least 1");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static validateRunResponse(response: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!isRunResponse(response)) {
      errors.push("Object is not a valid RunResponse");
      return { valid: false, errors, warnings };
    }

    const resp = response as RunResponse;

    // Validate ID
    if (!resp.id.trim()) {
      errors.push("Run ID must not be empty");
    }

    // Validate model
    if (!resp.model.trim()) {
      errors.push("Model must not be empty");
    }

    // Validate choices
    if (resp.choices.length === 0) {
      errors.push("Choices array must not be empty");
    }

    for (let i = 0; i < resp.choices.length; i++) {
      const choice = resp.choices[i];

      // Validate finish reason
      const validFinishReasons: FinishReason[] = [
        "stop",
        "length",
        "tool_calls",
        "error",
        "cancelled",
        "timeout",
      ];
      if (!validFinishReasons.includes(choice.finish_reason)) {
        warnings.push(`Choice at index ${i} has unusual finish reason: ${choice.finish_reason}`);
      }

      // Validate tool calls if present
      if (choice.message.tool_calls !== undefined) {
        if (!Array.isArray(choice.message.tool_calls)) {
          errors.push(`Choice at index ${i}: tool_calls must be an array`);
        } else {
          for (let j = 0; j < choice.message.tool_calls.length; j++) {
            if (!isToolCall(choice.message.tool_calls[j])) {
              errors.push(`Choice at index ${i}, tool_call at index ${j} is not valid`);
            }
          }
        }
      }
    }

    // Validate usage if present
    if (resp.usage !== undefined) {
      if (
        resp.usage.prompt_tokens < 0 ||
        resp.usage.completion_tokens < 0 ||
        resp.usage.total_tokens < 0
      ) {
        warnings.push("Token usage contains negative values");
      }

      if (resp.usage.total_tokens !== resp.usage.prompt_tokens + resp.usage.completion_tokens) {
        warnings.push("Total tokens does not equal prompt + completion tokens");
      }
    }

    // Validate timestamps if present
    if (resp.created_at !== undefined) {
      if (!isValidISODate(resp.created_at)) {
        warnings.push("created_at is not a valid ISO date");
      }
    }

    if (resp.completed_at !== undefined) {
      if (!isValidISODate(resp.completed_at)) {
        warnings.push("completed_at is not a valid ISO date");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static validateStreamEvent(event: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!isStreamEvent(event)) {
      errors.push("Object is not a valid StreamEvent");
      return { valid: false, errors, warnings };
    }

    const evt = event as StreamEvent;

    // Event-specific validation
    switch (evt.type) {
      case "run.start":
        const startData = evt.data as any;
        if (!startData.id || !startData.model) {
          errors.push("run.start event missing id or model");
        }
        break;

      case "run.completion":
        const completionData = evt.data as any;
        if (typeof completionData.content !== "string") {
          errors.push("run.completion event content must be a string");
        }
        break;

      case "run.tool_call":
        if (!isToolCall(evt.data)) {
          errors.push("run.tool_call event data is not a valid ToolCall");
        }
        break;

      case "run.tool_result":
        if (!isToolResult(evt.data)) {
          errors.push("run.tool_result event data is not a valid ToolResult");
        }
        break;

      case "run.finish":
        const finishData = evt.data as any;
        if (!finishData.finish_reason) {
          errors.push("run.finish event missing finish_reason");
        }
        break;

      case "run.error":
        const errorData = evt.data as any;
        if (!errorData.error) {
          errors.push("run.error event missing error message");
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static validateStatus(status: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!isStatus(status)) {
      errors.push("Object is not a valid Status");
      return { valid: false, errors, warnings };
    }

    const stat = status as Status;

    // Validate timestamp
    if (!isValidISODate(stat.timestamp)) {
      warnings.push("timestamp is not a valid ISO date");
    }

    // Validate checks if present
    if (stat.checks !== undefined) {
      if (!Array.isArray(stat.checks)) {
        errors.push("checks must be an array");
      } else {
        for (let i = 0; i < stat.checks.length; i++) {
          const check = stat.checks[i];
          if (!check.name || !check.status) {
            errors.push(`Check at index ${i} missing name or status`);
          }

          const validStatuses = ["pass", "fail", "warn"];
          if (!validStatuses.includes(check.status)) {
            errors.push(`Check at index ${i} has invalid status: ${check.status}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static validateProviderDescriptor(provider: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic type check
    if (typeof provider !== "object" || provider === null) {
      errors.push("Provider must be an object");
      return { valid: false, errors, warnings };
    }

    const prov = provider as Record<string, unknown>;

    // Required fields
    if (typeof prov.id !== "string" || !prov.id.trim()) {
      errors.push("Provider must have a non-empty id");
    }

    if (typeof prov.name !== "string" || !prov.name.trim()) {
      errors.push("Provider must have a non-empty name");
    }

    // Models
    if (!Array.isArray(prov.models)) {
      errors.push("Provider must have a models array");
    } else if (prov.models.length === 0) {
      warnings.push("Provider has no models");
    } else {
      for (let i = 0; i < prov.models.length; i++) {
        const model = prov.models[i] as Record<string, unknown>;
        if (typeof model.id !== "string" || !model.id.trim()) {
          errors.push(`Model at index ${i} must have a non-empty id`);
        }
      }
    }

    // Capabilities
    if (!Array.isArray(prov.capabilities)) {
      errors.push("Provider must have a capabilities array");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// ============================================================================
// ASSERTION HELPERS (for use in tests)
// ============================================================================

export function assertValidRunRequest(request: unknown): asserts request is RunRequest {
  const result = ContractValidator.validateRunRequest(request);
  if (!result.valid) {
    throw new Error(`Invalid RunRequest: ${result.errors.join(", ")}`);
  }
}

export function assertValidRunResponse(response: unknown): asserts response is RunResponse {
  const result = ContractValidator.validateRunResponse(response);
  if (!result.valid) {
    throw new Error(`Invalid RunResponse: ${result.errors.join(", ")}`);
  }
}

export function assertValidStreamEvent(event: unknown): asserts event is StreamEvent {
  const result = ContractValidator.validateStreamEvent(event);
  if (!result.valid) {
    throw new Error(`Invalid StreamEvent: ${result.errors.join(", ")}`);
  }
}

export function assertValidStatus(status: unknown): asserts status is Status {
  const result = ContractValidator.validateStatus(status);
  if (!result.valid) {
    throw new Error(`Invalid Status: ${result.errors.join(", ")}`);
  }
}

// ============================================================================
// CONTRACT COMPLIANCE TESTING
// ============================================================================

export interface ComplianceTest {
  name: string;
  validate: (data: unknown) => ValidationResult;
  examples: unknown[];
}

export const complianceTests: Record<string, ComplianceTest> = {
  runRequest: {
    name: "Run Request Contract",
    validate: ContractValidator.validateRunRequest,
    examples: [
      {
        model: "claude-3-haiku",
        messages: [{ role: "user", content: "Hello" }],
      },
    ],
  },

  runResponse: {
    name: "Run Response Contract",
    validate: ContractValidator.validateRunResponse,
    examples: [
      {
        id: "run_123",
        model: "claude-3-haiku",
        choices: [
          {
            message: { role: "assistant", content: "Hello" },
            finish_reason: "stop",
          },
        ],
      },
    ],
  },

  streamEvent: {
    name: "Stream Event Contract",
    validate: ContractValidator.validateStreamEvent,
    examples: [
      { type: "run.start", data: { id: "run_1", model: "claude-3-haiku" } },
      { type: "run.completion", data: { content: "Hello" } },
      { type: "run.finish", data: { finish_reason: "stop" } },
    ],
  },

  status: {
    name: "Status Contract",
    validate: ContractValidator.validateStatus,
    examples: [{ status: "healthy", timestamp: new Date().toISOString() }],
  },
};

export function runComplianceTests(): Record<string, ValidationResult> {
  const results: Record<string, ValidationResult> = {};

  for (const [key, test] of Object.entries(complianceTests)) {
    // Test each example
    const exampleResults = test.examples.map((example) => test.validate(example));

    // Combine results
    const allValid = exampleResults.every((r) => r.valid);
    const allErrors = exampleResults.flatMap((r) => r.errors);
    const allWarnings = exampleResults.flatMap((r) => r.warnings);

    results[key] = {
      valid: allValid,
      errors: allErrors,
      warnings: allWarnings,
    };
  }

  return results;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function isValidISODate(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && date.toISOString() === dateString;
  } catch {
    return false;
  }
}

export function deepEquals(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function isSubset(subset: unknown, superset: unknown): boolean {
  if (subset === superset) return true;
  if (subset == null || superset == null) return false;
  if (typeof subset !== "object" || typeof superset !== "object") return false;

  const subsetObj = subset as Record<string, unknown>;
  const supersetObj = superset as Record<string, unknown>;

  for (const key in subsetObj) {
    if (!(key in supersetObj)) return false;
    if (!isSubset(subsetObj[key], supersetObj[key])) return false;
  }

  return true;
}

export function diffObjects(a: unknown, b: unknown): string[] {
  const differences: string[] = [];

  function compare(path: string, obj1: unknown, obj2: unknown) {
    if (obj1 === obj2) return;

    if (typeof obj1 !== typeof obj2) {
      differences.push(`${path}: types differ (${typeof obj1} vs ${typeof obj2})`);
      return;
    }

    if (typeof obj1 !== "object" || obj1 === null || obj2 === null) {
      if (obj1 !== obj2) {
        differences.push(`${path}: values differ (${obj1} vs ${obj2})`);
      }
      return;
    }

    const obj1Keys = Object.keys(obj1);
    const obj2Keys = Object.keys(obj2);

    // Check for missing keys in obj2
    for (const key of obj1Keys) {
      if (!obj2Keys.includes(key)) {
        differences.push(`${path}.${key}: missing in second object`);
      }
    }

    // Check for missing keys in obj1
    for (const key of obj2Keys) {
      if (!obj1Keys.includes(key)) {
        differences.push(`${path}.${key}: missing in first object`);
      }
    }

    // Compare common keys
    for (const key of obj1Keys) {
      if (obj2Keys.includes(key)) {
        compare(`${path}.${key}`, (obj1 as any)[key], (obj2 as any)[key]);
      }
    }
  }

  compare("$", a, b);
  return differences;
}
