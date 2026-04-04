// Canonical error taxonomy and serializable errors for fusionAIze SDK
// v1 error model with typed error codes, serializable errors, and retry logic

import type { JsonObject } from "@fusionaize/sdk-core";

/**
 * Canonical error codes for fusionAIze SDK
 * Categorized by HTTP status code equivalence where applicable
 * @stable
 */
export enum ErrorCode {
  // Client errors (4xx equivalent)
  InvalidRequest = "invalid_request",           // 400
  AuthenticationFailed = "authentication_failed", // 401
  PermissionDenied = "permission_denied",       // 403
  NotFound = "not_found",                       // 404
  Conflict = "conflict",                        // 409
  RateLimited = "rate_limited",                 // 429
  ValidationFailed = "validation_failed",       // 422
  UnsupportedOperation = "unsupported_operation", // 405
  RequestTimeout = "request_timeout",           // 408

  // Server errors (5xx equivalent)
  Internal = "internal",                        // 500
  ServiceUnavailable = "service_unavailable",   // 503
  GatewayTimeout = "gateway_timeout",           // 504
  BadGateway = "bad_gateway",                  // 502
  NotImplemented = "not_implemented",          // 501

  // SDK-specific errors (no direct HTTP equivalent)
  ConfigurationError = "configuration_error",
  NetworkError = "network_error",
  SerializationError = "serialization_error",
  DeserializationError = "deserialization_error",
  TimeoutError = "timeout_error",
  Cancelled = "cancelled",
}

/**
 * Serializable error representation for transmission and storage
 * @stable
 */
export interface SerializableError {
  /** Canonical error code */
  code: ErrorCode;
  /** Human-readable error message */
  message: string;
  /** Optional structured error details */
  details?: JsonObject | undefined;
  /** Optional stack trace (should be omitted in production) */
  stack?: string | undefined;
  /** When this error occurred (ISO 8601) */
  timestamp?: string | undefined;
  /** Optional correlation ID for tracing */
  correlationId?: string | undefined;
}

/**
 * Base error class for all fusionAIze SDK errors
 * Provides serialization, retry logic, and error categorization
 * @stable
 */
export class FusionAIzeError extends Error {
  readonly code: ErrorCode;
  readonly details?: JsonObject | undefined;
  readonly timestamp: string;
  readonly correlationId?: string | undefined;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.Internal,
    options?: {
      details?: JsonObject | undefined;
      cause?: unknown;
      correlationId?: string | undefined;
    }
  ) {
    super(message);
    this.name = "FusionAIzeError";
    this.code = code;
    this.details = options?.details;
    this.timestamp = new Date().toISOString();
    this.correlationId = options?.correlationId;

    if (options?.cause instanceof Error) {
      this.cause = options.cause;
    } else if (options?.cause) {
      this.cause = options.cause;
    }

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, FusionAIzeError.prototype);
  }

  /**
   * Convert error to serializable JSON representation
   */
  toJSON(): SerializableError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      stack: this.stack,
      timestamp: this.timestamp,
      correlationId: this.correlationId,
    };
  }

  /**
   * Determine if this error is likely retryable
   * Based on error code and optional details
   */
  isRetryable(): boolean {
    // Network and server errors are generally retryable
    const retryableCodes = [
      ErrorCode.ServiceUnavailable,
      ErrorCode.GatewayTimeout,
      ErrorCode.BadGateway,
      ErrorCode.RateLimited,
      ErrorCode.RequestTimeout,
      ErrorCode.NetworkError,
      ErrorCode.TimeoutError,
    ];

    return retryableCodes.includes(this.code);
  }

  /**
   * Determine if this is a client error (4xx equivalent)
   */
  isClientError(): boolean {
    const clientErrorCodes = [
      ErrorCode.InvalidRequest,
      ErrorCode.AuthenticationFailed,
      ErrorCode.PermissionDenied,
      ErrorCode.NotFound,
      ErrorCode.Conflict,
      ErrorCode.RateLimited,
      ErrorCode.ValidationFailed,
      ErrorCode.UnsupportedOperation,
      ErrorCode.RequestTimeout,
    ];

    return clientErrorCodes.includes(this.code);
  }

  /**
   * Determine if this is a server error (5xx equivalent)
   */
  isServerError(): boolean {
    const serverErrorCodes = [
      ErrorCode.Internal,
      ErrorCode.ServiceUnavailable,
      ErrorCode.GatewayTimeout,
      ErrorCode.BadGateway,
      ErrorCode.NotImplemented,
    ];

    return serverErrorCodes.includes(this.code);
  }

  /**
   * Create a new error with additional details
   */
  withDetails(details: JsonObject): FusionAIzeError {
    return new FusionAIzeError(this.message, this.code, {
      details: { ...this.details, ...details },
      cause: this.cause,
      correlationId: this.correlationId,
    });
  }

  /**
   * Create a new error with a correlation ID
   */
  withCorrelationId(correlationId: string): FusionAIzeError {
    return new FusionAIzeError(this.message, this.code, {
      details: this.details,
      cause: this.cause,
      correlationId,
    });
  }
}

// ============================================================================
// SPECIFIC ERROR TYPES (convenience classes)
// ============================================================================

/**
 * Error for configuration-related issues
 * @stable
 */
export class ConfigurationError extends FusionAIzeError {
  constructor(message: string, details?: JsonObject | undefined) {
    super(message, ErrorCode.ConfigurationError, { details });
    this.name = "ConfigurationError";
  }
}

/**
 * Error for network-related issues
 * @stable
 */
export class NetworkError extends FusionAIzeError {
  constructor(message: string, details?: JsonObject | undefined) {
    super(message, ErrorCode.NetworkError, { details });
    this.name = "NetworkError";
  }
}

/**
 * Error for authentication failures
 * @stable
 */
export class AuthenticationError extends FusionAIzeError {
  constructor(message: string, details?: JsonObject | undefined) {
    super(message, ErrorCode.AuthenticationFailed, { details });
    this.name = "AuthenticationError";
  }
}

/**
 * Error for authorization failures
 * @stable
 */
export class AuthorizationError extends FusionAIzeError {
  constructor(message: string, details?: JsonObject | undefined) {
    super(message, ErrorCode.PermissionDenied, { details });
    this.name = "AuthorizationError";
  }
}

/**
 * Error for validation failures
 * @stable
 */
export class ValidationError extends FusionAIzeError {
  constructor(message: string, details?: JsonObject | undefined) {
    super(message, ErrorCode.ValidationFailed, { details });
    this.name = "ValidationError";
  }
}

/**
 * Error for timeouts
 * @stable
 */
export class TimeoutError extends FusionAIzeError {
  constructor(message: string, details?: JsonObject | undefined) {
    super(message, ErrorCode.TimeoutError, { details });
    this.name = "TimeoutError";
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert any Error to a SerializableError
 * Preserves fusionAIze error details when available
 * @stable
 */
export function errorToJSON(error: Error): SerializableError {
  if (error instanceof FusionAIzeError) {
    return error.toJSON();
  }

  // Try to extract code from generic errors
  let code = ErrorCode.Internal;
  if ((error as any).code && Object.values(ErrorCode).includes((error as any).code)) {
    code = (error as any).code as ErrorCode;
  }

  return {
    code,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a FusionAIzeError from a SerializableError
 * @stable
 */
export function errorFromJSON(json: SerializableError): FusionAIzeError {
  return new FusionAIzeError(json.message, json.code, {
    details: json.details,
    correlationId: json.correlationId,
  });
}

/**
 * Check if an error is retryable
 * Handles both FusionAIzeError and generic errors
 * @stable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof FusionAIzeError) {
    return error.isRetryable();
  }

  // Default retryable for network-ish errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("timeout") ||
      message.includes("network") ||
      message.includes("connection") ||
      message.includes("retry") ||
      (error as any).code === "ECONNRESET" ||
      (error as any).code === "ETIMEDOUT"
    );
  }

  return false;
}

/**
 * Create a standardized error for invalid requests
 * @stable
 */
export function invalidRequestError(message: string, details?: JsonObject | undefined): FusionAIzeError {
  return new FusionAIzeError(message, ErrorCode.InvalidRequest, { details });
}

/**
 * Create a standardized error for not found resources
 * @stable
 */
export function notFoundError(message: string, details?: JsonObject | undefined): FusionAIzeError {
  return new FusionAIzeError(message, ErrorCode.NotFound, { details });
}

/**
 * Create a standardized error for conflicts
 * @stable
 */
export function conflictError(message: string, details?: JsonObject | undefined): FusionAIzeError {
  return new FusionAIzeError(message, ErrorCode.Conflict, { details });
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for SerializableError
 * @stable
 */
export function isSerializableError(error: unknown): error is SerializableError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    Object.values(ErrorCode).includes((error as any).code)
  );
}

/**
 * Type guard for FusionAIzeError
 * @stable
 */
export function isFusionAIzeError(error: unknown): error is FusionAIzeError {
  return error instanceof FusionAIzeError;
}