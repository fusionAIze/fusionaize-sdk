// General test utilities for fusionAIze SDK testing
// Provides setup/teardown helpers, assertions, and testing patterns

import type { AuthProvider } from "@fusionaize/sdk-auth";
import { ErrorCode, FusionAIzeError } from "@fusionaize/sdk-errors";
import type { Transport } from "@fusionaize/sdk-transport";

// ============================================================================
// TEST SETUP & TEARDOWN
// ============================================================================

export interface TestContext {
  startTime: Date;
  testName: string;
  metadata: Record<string, unknown>;
}

export function createTestContext(testName: string): TestContext {
  return {
    startTime: new Date(),
    testName,
    metadata: {},
  };
}

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message?: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(message || `Test timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ]);
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    shouldRetry?: (error: unknown, attempt: number) => boolean;
  } = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const delayMs = options.delayMs ?? 100;
  const shouldRetry = options.shouldRetry ?? (() => true);

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !shouldRetry(error, attempt)) {
        break;
      }

      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

export class Assert {
  static isDefined<T>(value: T | undefined | null, message?: string): asserts value is T {
    if (value === undefined || value === null) {
      throw new Error(message || `Expected value to be defined, got ${value}`);
    }
  }

  static isString(value: unknown, message?: string): asserts value is string {
    if (typeof value !== "string") {
      throw new Error(message || `Expected string, got ${typeof value}`);
    }
  }

  static isNumber(value: unknown, message?: string): asserts value is number {
    if (typeof value !== "number") {
      throw new Error(message || `Expected number, got ${typeof value}`);
    }
  }

  static isBoolean(value: unknown, message?: string): asserts value is boolean {
    if (typeof value !== "boolean") {
      throw new Error(message || `Expected boolean, got ${typeof value}`);
    }
  }

  static isObject(value: unknown, message?: string): asserts value is Record<string, unknown> {
    if (typeof value !== "object" || value === null) {
      throw new Error(message || `Expected object, got ${typeof value}`);
    }
  }

  static isArray(value: unknown, message?: string): asserts value is unknown[] {
    if (!Array.isArray(value)) {
      throw new Error(message || `Expected array, got ${typeof value}`);
    }
  }

  static matches(regex: RegExp, value: string, message?: string): void {
    if (!regex.test(value)) {
      throw new Error(message || `Expected string to match ${regex}, got ${value}`);
    }
  }

  static includes(substring: string, value: string, message?: string): void {
    if (!value.includes(substring)) {
      throw new Error(message || `Expected string to include "${substring}", got ${value}`);
    }
  }

  static deepEquals<T>(actual: T, expected: T, message?: string): void {
    const actualJson = JSON.stringify(actual);
    const expectedJson = JSON.stringify(expected);

    if (actualJson !== expectedJson) {
      throw new Error(message || `Expected ${expectedJson}, got ${actualJson}`);
    }
  }

  static approxEquals(actual: number, expected: number, epsilon = 0.0001, message?: string): void {
    if (Math.abs(actual - expected) > epsilon) {
      throw new Error(message || `Expected ${expected} ± ${epsilon}, got ${actual}`);
    }
  }

  static throws(fn: () => unknown, message?: string): Error {
    try {
      fn();
      throw new Error(message || "Expected function to throw");
    } catch (error) {
      if (error instanceof Error) {
        return error;
      }
      throw new Error(message || `Expected Error, got ${error}`);
    }
  }

  static async throwsAsync(fn: () => Promise<unknown>, message?: string): Promise<Error> {
    try {
      await fn();
      throw new Error(message || "Expected async function to throw");
    } catch (error) {
      if (error instanceof Error) {
        return error;
      }
      throw new Error(message || `Expected Error, got ${error}`);
    }
  }

  static isFusionAIzeError(error: unknown, code?: ErrorCode): asserts error is FusionAIzeError {
    if (!(error instanceof FusionAIzeError)) {
      throw new Error(`Expected FusionAIzeError, got ${error}`);
    }

    if (code !== undefined && error.code !== code) {
      throw new Error(`Expected error code ${code}, got ${error.code}`);
    }
  }
}

// ============================================================================
// MOCK HELPERS
// ============================================================================

export class MockHelpers {
  static createMockAuthProvider(headers: Record<string, string> = {}): AuthProvider {
    return {
      async getHeaders() {
        return { Authorization: "Bearer mock", ...headers };
      },
    };
  }

  static createFailingAuthProvider(error?: Error): AuthProvider {
    return {
      async getHeaders() {
        throw error || new FusionAIzeError("Mock auth failure", ErrorCode.AuthenticationFailed);
      },
    };
  }

  static createDelayedAuthProvider(delayMs: number): AuthProvider {
    return {
      async getHeaders() {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return { Authorization: "Bearer delayed" };
      },
    };
  }

  static createMockTransport(baseURL = "http://localhost:9999"): Transport {
    return {
      baseURL,
      async request(options) {
        return {
          status: 200,
          headers: { "content-type": "application/json" },
          body: { mock: true, url: options.url },
        };
      },
      use() {
        return this;
      },
    };
  }
}

// ============================================================================
// TEST FIXTURES
// ============================================================================

export interface TestFixture<T> {
  setup: () => Promise<T>;
  teardown: (context: T) => Promise<void>;
}

export class TestFixtureManager {
  private fixtures: Array<{ name: string; fixture: TestFixture<unknown>; context: unknown }> = [];

  async use<T>(name: string, fixture: TestFixture<T>): Promise<T> {
    const context = await fixture.setup();
    this.fixtures.push({ name, fixture, context });
    return context;
  }

  async teardownAll(): Promise<void> {
    // Teardown in reverse order (LIFO)
    for (let i = this.fixtures.length - 1; i >= 0; i--) {
      const { name, fixture, context } = this.fixtures[i];
      try {
        await fixture.teardown(context);
      } catch (error) {
        console.error(`Error tearing down fixture "${name}":`, error);
      }
    }
    this.fixtures = [];
  }

  getContext<T>(name: string): T | undefined {
    const entry = this.fixtures.find((f) => f.name === name);
    return entry?.context as T;
  }
}

// Common test fixtures
export const commonFixtures = {
  tempFile(): TestFixture<{ path: string; cleanup: () => Promise<void> }> {
    const fs = require("fs").promises;
    const os = require("os");
    const path = require("path");

    return {
      async setup() {
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "fusionaize-test-"));
        const filePath = path.join(tempDir, "test.json");

        return {
          path: filePath,
          cleanup: async () => {
            try {
              await fs.rm(tempDir, { recursive: true, force: true });
            } catch {
              // Ignore cleanup errors
            }
          },
        };
      },

      async teardown(context) {
        await context.cleanup();
      },
    };
  },

  mockServer(): TestFixture<{ baseURL: string; stop: () => Promise<void> }> {
    // This is a placeholder - in real tests you might use something like MSW or a real server
    return {
      async setup() {
        const baseURL = "http://localhost:9999";
        console.warn("Mock server fixture is a placeholder - implement with real server");

        return {
          baseURL,
          stop: async () => {
            // Nothing to stop
          },
        };
      },

      async teardown(context) {
        await context.stop();
      },
    };
  },

  isolatedEnv(): TestFixture<{ originalEnv: NodeJS.ProcessEnv }> {
    return {
      async setup() {
        const originalEnv = { ...process.env };

        return {
          originalEnv,
        };
      },

      async teardown(context) {
        // Restore original environment
        process.env = context.originalEnv;
      },
    };
  },
};

// ============================================================================
// PERFORMANCE TESTING
// ============================================================================

export interface PerformanceMetrics {
  durationMs: number;
  memoryUsage?: NodeJS.MemoryUsage;
  iterations?: number;
  opsPerSecond?: number;
}

export async function measurePerformance<T>(
  fn: () => Promise<T> | T,
  options: {
    iterations?: number;
    warmupIterations?: number;
  } = {},
): Promise<PerformanceMetrics & { result: T }> {
  const iterations = options.iterations ?? 1;
  const warmupIterations = options.warmupIterations ?? Math.min(10, Math.floor(iterations / 10));

  // Warmup
  for (let i = 0; i < warmupIterations; i++) {
    await fn();
  }

  // Measure memory before
  const memoryBefore = process.memoryUsage?.();

  // Run iterations
  const start = performance.now();
  let result: T;

  for (let i = 0; i < iterations; i++) {
    result = await fn();
  }

  const end = performance.now();

  // Measure memory after
  const memoryAfter = process.memoryUsage?.();

  const durationMs = end - start;
  const opsPerSecond = iterations > 0 ? iterations / (durationMs / 1000) : undefined;

  return {
    result: result!,
    durationMs,
    memoryUsage:
      memoryAfter && memoryBefore
        ? {
            rss: memoryAfter.rss - memoryBefore.rss,
            heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
            heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
            external: memoryAfter.external - memoryBefore.external,
            arrayBuffers: memoryAfter.arrayBuffers - memoryBefore.arrayBuffers,
          }
        : undefined,
    iterations,
    opsPerSecond,
  };
}

// ============================================================================
// SNAPSHOT TESTING
// ============================================================================

export class Snapshot {
  private static snapshots: Map<string, unknown> = new Map();

  static match(name: string, value: unknown): void {
    const serialized = JSON.stringify(value, null, 2);
    const key = `snapshot:${name}`;

    if (!this.snapshots.has(key)) {
      // First time - store snapshot
      this.snapshots.set(key, serialized);
      console.log(`Snapshot stored for "${name}"`);
      return;
    }

    const expected = this.snapshots.get(key) as string;
    if (serialized !== expected) {
      throw new Error(
        `Snapshot mismatch for "${name}"\nExpected:\n${expected}\n\nGot:\n${serialized}`,
      );
    }
  }

  static update(name: string, value: unknown): void {
    const serialized = JSON.stringify(value, null, 2);
    const key = `snapshot:${name}`;
    this.snapshots.set(key, serialized);
  }

  static clear(): void {
    this.snapshots.clear();
  }
}

// ============================================================================
// TEST PATTERNS
// ============================================================================

export async function testConcurrently<T>(
  tasks: Array<{
    name: string;
    task: () => Promise<T>;
    timeoutMs?: number;
  }>,
): Promise<Array<{ name: string; result: T; error?: Error }>> {
  const results = await Promise.allSettled(
    tasks.map(async ({ name, task, timeoutMs }) => {
      try {
        const result = timeoutMs
          ? await withTimeout(task(), timeoutMs, `Task "${name}" timed out`)
          : await task();
        return { name, result, error: undefined };
      } catch (error) {
        return { name, result: undefined as any, error: error as Error };
      }
    }),
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      return { name: tasks[index].name, result: undefined as any, error: result.reason };
    }
  });
}

export function createDataDrivenTest<T>(
  dataset: Array<{ name: string; data: T }>,
  testFn: (data: T) => Promise<void> | void,
): () => Promise<void> {
  return async () => {
    for (const { name, data } of dataset) {
      try {
        await testFn(data);
      } catch (error) {
        throw new Error(`Test case "${name}" failed: ${error}`);
      }
    }
  };
}
