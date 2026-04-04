// Core types and utilities for the fusionAIze SDK

/**
 * Result type representing either success (ok) or failure (error)
 * @stable
 */
export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

/**
 * Create a successful Result
 * @stable
 */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Create a failed Result
 * @stable
 */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * Envelope for wrapping data with optional metadata
 * @stable
 */
export interface Envelope<T> {
  data: T;
  metadata?: Record<string, unknown>;
}

/**
 * JSON value type (string, number, boolean, null, array, or object)
 * @stable
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * JSON object type (record of JSON values)
 * @stable
 */
export type JsonObject = { [key: string]: JsonValue };

/**
 * Metadata for tracing and timestamps
 * @stable
 */
export interface Metadata {
  createdAt?: string;
  updatedAt?: string;
  traceId?: string;
  [key: string]: unknown;
}

/**
 * ISO 8601 timestamp string
 * @stable
 */
export type Timestamp = string; // ISO 8601

/**
 * Duration in milliseconds
 * @stable
 */
export type Duration = number; // milliseconds

/**
 * Get current timestamp in ISO 8601 format
 * @stable
 */
export function now(): Timestamp {
  return new Date().toISOString();
}
