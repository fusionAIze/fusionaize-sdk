// Distributed tracing for fusionAIze SDK
// v1 tracing model with W3C Trace Context, span management, and async propagation

import type { TraceMetadata } from "@fusionaize/sdk-contracts";

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Trace context following W3C Trace Context specification
 * @stable
 */
export interface TraceContext {
  /** Trace ID (32 hex characters) */
  traceId: string;
  /** Parent ID (16 hex characters) */
  parentId?: string;
  /** Span ID (16 hex characters) */
  spanId: string;
  /** Trace flags (bit field, 1 = sampled) */
  traceFlags: number;
  /** Trace state (key-value pairs) */
  traceState?: string;
}

/**
 * Span representing a unit of work
 * @stable
 */
export interface Span {
  /** Span ID (16 hex characters) */
  id: string;
  /** Trace ID (32 hex characters) */
  traceId: string;
  /** Parent span ID (optional, 16 hex characters) */
  parentId?: string;
  /** Span name/operation */
  name: string;
  /** Span kind (client, server, producer, consumer, internal) */
  kind?: SpanKind;
  /** Span attributes (key-value pairs) */
  attributes: Record<string, string | number | boolean>;
  /** Span status */
  status: SpanStatus;
  /** Start time (high-resolution timestamp) */
  startTime: bigint;
  /** End time (high-resolution timestamp, set when span ends) */
  endTime?: bigint;
  /** Events attached to this span */
  events: SpanEvent[];
  /** Links to other spans */
  links: SpanLink[];
}

/**
 * Span kind
 * @stable
 */
export type SpanKind =
  | "client" // Outgoing request
  | "server" // Incoming request
  | "producer" // Message producer
  | "consumer" // Message consumer
  | "internal"; // Internal operation

/**
 * Span status
 * @stable
 */
export interface SpanStatus {
  /** Status code */
  code: SpanStatusCode;
  /** Optional description */
  description?: string;
}

/**
 * Span status code
 * @stable
 */
export enum SpanStatusCode {
  UNSET = 0,
  OK = 1,
  ERROR = 2,
}

/**
 * Span event
 * @stable
 */
export interface SpanEvent {
  /** Event name */
  name: string;
  /** Event timestamp (high-resolution) */
  time: bigint;
  /** Event attributes */
  attributes?: Record<string, string | number | boolean>;
}

/**
 * Span link
 * @stable
 */
export interface SpanLink {
  /** Linked trace ID */
  traceId: string;
  /** Linked span ID */
  spanId: string;
  /** Link attributes */
  attributes?: Record<string, string | number | boolean>;
}

/**
 * Tracer interface for creating and managing spans
 * @stable
 */
export interface Tracer {
  /** Start a new span */
  startSpan(name: string, options?: StartSpanOptions): Span;

  /** Get the current active span */
  getCurrentSpan(): Span | undefined;

  /** Run a function within a span context */
  withSpan<T>(span: Span, fn: () => T | Promise<T>): Promise<T>;

  /** Get current trace context */
  getTraceContext(): TraceContext | undefined;

  /** Inject trace context into headers */
  inject(headers: Record<string, string>): void;

  /** Extract trace context from headers */
  extract(headers: Record<string, string>): TraceContext | undefined;
}

/**
 * Options for starting a span
 * @stable
 */
export interface StartSpanOptions {
  /** Parent span (creates child span) */
  parent?: Span;
  /** Span kind */
  kind?: SpanKind;
  /** Initial attributes */
  attributes?: Record<string, string | number | boolean>;
  /** Links to other spans */
  links?: SpanLink[];
  /** Start time (defaults to now) */
  startTime?: bigint;
}

// ============================================================================
// ID GENERATION
// ============================================================================

/**
 * Generate a random trace ID (32 hex characters)
 * @stable
 */
export function generateTraceId(): string {
  // Use crypto.randomUUID if available, otherwise fallback
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    // Remove hyphens and take first 32 characters
    return crypto.randomUUID().replace(/-/g, "").slice(0, 32);
  }

  // Fallback for older environments
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Simple fallback (not cryptographically secure)
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate a random span ID (16 hex characters)
 * @stable
 */
export function generateSpanId(): string {
  // Generate 8 random bytes = 16 hex characters
  const bytes = new Uint8Array(8);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Validate trace ID format (32 hex characters)
 * @stable
 */
export function isValidTraceId(traceId: string): boolean {
  return /^[0-9a-f]{32}$/i.test(traceId);
}

/**
 * Validate span ID format (16 hex characters)
 * @stable
 */
export function isValidSpanId(spanId: string): boolean {
  return /^[0-9a-f]{16}$/i.test(spanId);
}

// ============================================================================
// CONTEXT PROPAGATION
// ============================================================================

/**
 * Propagate trace context to headers (W3C Trace Context format)
 * @stable
 */
export function propagateTrace(context: TraceContext): Record<string, string> {
  const headers: Record<string, string> = {};

  // W3C Trace Context format
  // traceparent: 00-{traceId}-{spanId}-{traceFlags}
  const traceparent = `00-${context.traceId}-${context.spanId}-${context.traceFlags.toString(16).padStart(2, "0")}`;
  headers["traceparent"] = traceparent;

  // Custom headers for compatibility
  headers["x-trace-id"] = context.traceId;
  headers["x-span-id"] = context.spanId;
  if (context.parentId) {
    headers["x-parent-span-id"] = context.parentId;
  }

  // Trace state if present
  if (context.traceState) {
    headers["tracestate"] = context.traceState;
  }

  return headers;
}

/**
 * Extract trace context from headers
 * Supports W3C Trace Context and custom headers
 * @stable
 */
export function extractTrace(headers: Record<string, string>): TraceContext | undefined {
  // Try W3C Trace Context first
  const traceparent = headers["traceparent"] || headers["Traceparent"];
  if (traceparent) {
    const parts = traceparent.split("-");
    if (parts.length === 4 && parts[0] === "00") {
      const traceId = parts[1] as string;
      const spanId = parts[2] as string;
      const flags = parts[3] as string;
      const traceFlags = Number.parseInt(flags, 16);

      if (isValidTraceId(traceId) && isValidSpanId(spanId)) {
        const result: TraceContext = {
          traceId,
          spanId,
          traceFlags,
        };
        const traceState = headers["tracestate"] || headers["Tracestate"];
        if (traceState) {
          result.traceState = traceState;
        }
        return result;
      }
    }
  }

  // Fallback to custom headers
  const traceId = headers["x-trace-id"] || headers["X-Trace-Id"];
  const spanId = headers["x-span-id"] || headers["X-Span-Id"] || generateSpanId();

  if (traceId && isValidTraceId(traceId)) {
    const result: TraceContext = {
      traceId,
      spanId: isValidSpanId(spanId) ? spanId : generateSpanId(),
      traceFlags: 1, // Assume sampled
    };
    const parentId = headers["x-parent-span-id"] || headers["X-Parent-Span-Id"];
    if (parentId) {
      result.parentId = parentId;
    }
    return result;
  }

  return undefined;
}

/**
 * Create a new trace context
 * @stable
 */
export function createTraceContext(options?: {
  traceId?: string;
  parentId?: string;
  sampled?: boolean;
}): TraceContext {
  const traceId = options?.traceId || generateTraceId();
  const spanId = generateSpanId();
  const traceFlags = options?.sampled !== false ? 1 : 0;

  const result: TraceContext = {
    traceId,
    spanId,
    traceFlags,
  };

  if (options?.parentId) {
    result.parentId = options.parentId;
  }

  return result;
}

// ============================================================================
// SPAN MANAGEMENT
// ============================================================================

/**
 * Create a new span
 * @stable
 */
export function createSpan(name: string, options?: StartSpanOptions): Span {
  const traceId = options?.parent?.traceId || generateTraceId();
  const parentId = options?.parent?.id;
  const spanId = generateSpanId();

  const span: Span = {
    id: spanId,
    traceId,
    name,
    kind: options?.kind || "internal",
    attributes: options?.attributes || {},
    status: { code: SpanStatusCode.UNSET },
    startTime: options?.startTime || getCurrentTime(),
    events: [],
    links: options?.links || [],
  };

  if (parentId) {
    span.parentId = parentId;
  }

  return span;
}

/**
 * End a span (set end time)
 * @stable
 */
export function endSpan(
  span: Span,
  options?: {
    status?: SpanStatusCode;
    description?: string;
    endTime?: bigint;
  },
): Span {
  const endTime = options?.endTime || getCurrentTime();
  const code = options?.status || span.status.code;
  const description = options?.description || span.status.description;

  const result: Span = {
    ...span,
    endTime,
    status: {
      code,
    },
  };

  if (description) {
    result.status.description = description;
  }

  return result;
}

/**
 * Add an event to a span
 * @stable
 */
export function addSpanEvent(
  span: Span,
  name: string,
  attributes?: Record<string, string | number | boolean>,
): Span {
  const event: any = {
    name,
    time: getCurrentTime(),
  };

  if (attributes) {
    event.attributes = attributes;
  }

  return {
    ...span,
    events: [...span.events, event],
  };
}

/**
 * Add attributes to a span
 * @stable
 */
export function addSpanAttributes(
  span: Span,
  attributes: Record<string, string | number | boolean>,
): Span {
  return {
    ...span,
    attributes: {
      ...span.attributes,
      ...attributes,
    },
  };
}

/**
 * Set span status
 * @stable
 */
export function setSpanStatus(span: Span, code: SpanStatusCode, description?: string): Span {
  const result: Span = {
    ...span,
    status: { code },
  };

  if (description) {
    result.status.description = description;
  }

  return result;
}

// ============================================================================
// ASYNC CONTEXT MANAGEMENT
// ============================================================================

/**
 * Async context manager for tracing
 * Uses AsyncLocalStorage when available, falls back to manual context passing
 * @beta
 */
export class TraceContextManager {
  private currentContext?: TraceContext;
  private currentSpan?: Span;

  // Use AsyncLocalStorage if available (Node.js 16+)
  private asyncLocalStorage: any;

  constructor() {
    try {
      // Try to import AsyncLocalStorage
      if (typeof require !== "undefined") {
        const { AsyncLocalStorage } = require("async_hooks");
        this.asyncLocalStorage = new AsyncLocalStorage();
      } else if (typeof AsyncLocalStorage !== "undefined") {
        this.asyncLocalStorage = new AsyncLocalStorage();
      }
    } catch {
      // AsyncLocalStorage not available
      this.asyncLocalStorage = undefined;
    }
  }

  /**
   * Get current trace context
   */
  getTraceContext(): TraceContext | undefined {
    if (this.asyncLocalStorage) {
      const store = this.asyncLocalStorage.getStore();
      return store?.traceContext;
    }
    return this.currentContext;
  }

  /**
   * Get current span
   */
  getCurrentSpan(): Span | undefined {
    if (this.asyncLocalStorage) {
      const store = this.asyncLocalStorage.getStore();
      return store?.currentSpan;
    }
    return this.currentSpan;
  }

  /**
   * Run a function within a trace context
   */
  async withTraceContext<T>(
    context: TraceContext,
    span: Span,
    fn: () => T | Promise<T>,
  ): Promise<T> {
    if (this.asyncLocalStorage) {
      return this.asyncLocalStorage.run({ traceContext: context, currentSpan: span }, fn);
    }

    // Fallback: manually set and clear context
    const previousContext = this.currentContext;
    const previousSpan = this.currentSpan;

    this.currentContext = context;
    this.currentSpan = span;

    try {
      const result = await fn();
      return result;
    } finally {
      this.currentContext = previousContext;
      this.currentSpan = previousSpan;
    }
  }
}

// ============================================================================
// DEFAULT TRACER IMPLEMENTATION
// ============================================================================

/**
 * Default tracer implementation
 * @stable
 */
export class DefaultTracer implements Tracer {
  private contextManager = new TraceContextManager();

  startSpan(name: string, options?: StartSpanOptions): Span {
    const parent = options?.parent || this.getCurrentSpan();
    return createSpan(name, { ...options, parent });
  }

  getCurrentSpan(): Span | undefined {
    return this.contextManager.getCurrentSpan();
  }

  async withSpan<T>(span: Span, fn: () => T | Promise<T>): Promise<T> {
    const context = this.getTraceContext() || createTraceContext();
    return this.contextManager.withTraceContext(context, span, fn);
  }

  getTraceContext(): TraceContext | undefined {
    return this.contextManager.getTraceContext();
  }

  inject(headers: Record<string, string>): void {
    const context = this.getTraceContext();
    if (context) {
      const traceHeaders = propagateTrace(context);
      Object.assign(headers, traceHeaders);
    }
  }

  extract(headers: Record<string, string>): TraceContext | undefined {
    return extractTrace(headers);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get current high-resolution time
 * Uses performance.now() when available, otherwise Date.now()
 */
function getCurrentTime(): bigint {
  if (typeof performance !== "undefined" && performance.now) {
    // Convert milliseconds to microseconds (bigint)
    return BigInt(Math.floor(performance.now() * 1000));
  }

  // Fallback to Date.now() in microseconds
  return BigInt(Date.now() * 1000);
}

/**
 * Convert TraceContext to TraceMetadata (for compatibility)
 * @stable
 */
export function toTraceMetadata(context: TraceContext): TraceMetadata {
  return {
    traceId: context.traceId,
    spanId: context.spanId,
    parentSpanId: context.parentId,
    traceFlags: context.traceFlags,
    attributes: {},
  };
}

/**
 * Convert TraceMetadata to TraceContext
 * @stable
 */
export function fromTraceMetadata(metadata: TraceMetadata): TraceContext {
  return {
    traceId: metadata.traceId,
    spanId: metadata.spanId || generateSpanId(),
    parentId: metadata.parentSpanId,
    traceFlags: metadata.traceFlags || 1,
  };
}

/**
 * Run a function with tracing
 * Creates a span, runs the function, and ends the span
 * @stable
 */
export async function withTrace<T>(
  name: string,
  fn: (span: Span) => T | Promise<T>,
  options?: StartSpanOptions,
): Promise<T> {
  const span = createSpan(name, options);

  try {
    const result = await fn(span);
    endSpan(span, { status: SpanStatusCode.OK });
    return result;
  } catch (error) {
    endSpan(span, {
      status: SpanStatusCode.ERROR,
      description: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

/**
 * Default tracer instance
 */
const defaultTracer = new DefaultTracer();

/**
 * Get the default tracer
 * @stable
 */
export function getTracer(): Tracer {
  return defaultTracer;
}

// Re-export TraceMetadata type from contracts for convenience
export type { TraceMetadata } from "@fusionaize/sdk-contracts";
