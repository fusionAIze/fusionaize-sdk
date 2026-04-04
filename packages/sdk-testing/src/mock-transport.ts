// Mock transport for testing - implements Transport interface with recording,
// matching, delays, and error injection capabilities

import type { TraceMetadata } from "@fusionaize/sdk-contracts";
import { ErrorCode, FusionAIzeError } from "@fusionaize/sdk-errors";
import type { Middleware, RequestOptions, Response, Transport } from "@fusionaize/sdk-transport";

export interface MockTransportOptions {
  baseURL?: string;
  defaultDelayMs?: number;
  failUnmatchedRequests?: boolean;
}

export interface MockResponse<T = unknown> {
  status: number;
  headers?: Record<string, string>;
  body: T;
  delayMs?: number;
}

export interface RequestMatcher {
  url?: string | RegExp;
  method?: string | RegExp;
  headers?: Record<string, string | RegExp>;
  body?: any | ((body: any) => boolean);
  query?: Record<string, string | RegExp>;
}

export interface RecordedRequest {
  id: string;
  timestamp: Date;
  options: RequestOptions;
  response?: Response<unknown>;
  error?: unknown;
}

export class MockTransport implements Transport {
  readonly baseURL: string;
  private responses: Array<{
    matcher: RequestMatcher;
    response: MockResponse<unknown>;
    times?: number; // number of times this response can be used
    used: number;
  }> = [];
  private recordedRequests: RecordedRequest[] = [];
  private middlewares: Middleware[] = [];
  private defaultDelayMs: number;
  private failUnmatchedRequests: boolean;
  private requestCounter = 0;

  constructor(options: MockTransportOptions = {}) {
    this.baseURL = options.baseURL || "http://localhost:9999";
    this.defaultDelayMs = options.defaultDelayMs || 0;
    this.failUnmatchedRequests = options.failUnmatchedRequests ?? true;
  }

  use(middleware: Middleware): this {
    this.middlewares.push(middleware);
    return this;
  }

  async request<T = unknown>(options: RequestOptions): Promise<Response<T>> {
    let currentOptions = options;

    // Apply request middleware
    for (const middleware of this.middlewares) {
      if (middleware.onRequest) {
        currentOptions = await middleware.onRequest(currentOptions);
      }
    }

    const requestId = `req_${++this.requestCounter}_${Date.now()}`;
    const recordedRequest: RecordedRequest = {
      id: requestId,
      timestamp: new Date(),
      options: currentOptions,
    };

    try {
      // Find matching response
      const matchIndex = this.findMatchingResponse(currentOptions);
      if (matchIndex === -1) {
        if (this.failUnmatchedRequests) {
          throw new FusionAIzeError(
            `No mock response matched for ${currentOptions.method} ${currentOptions.url}`,
            ErrorCode.Internal,
          );
        } else {
          // Return a default success response
          const defaultResponse: Response<T> = {
            status: 200,
            headers: { "content-type": "application/json" },
            body: {} as T,
          };
          recordedRequest.response = defaultResponse;
          this.recordedRequests.push(recordedRequest);
          return defaultResponse;
        }
      }

      const match = this.responses[matchIndex];
      match.used++;

      // Remove if times limit reached
      if (match.times !== undefined && match.used >= match.times) {
        this.responses.splice(matchIndex, 1);
      }

      // Apply delay if specified
      const delayMs = match.response.delayMs ?? this.defaultDelayMs;
      if (delayMs > 0) {
        await this.delay(delayMs);
      }

      const mockResponse = match.response;
      const response: Response<T> = {
        status: mockResponse.status,
        headers: mockResponse.headers || { "content-type": "application/json" },
        body: mockResponse.body as T,
      };

      recordedRequest.response = response;
      this.recordedRequests.push(recordedRequest);

      // Apply response middleware
      let processedResponse = response;
      for (const middleware of this.middlewares) {
        if (middleware.onResponse) {
          processedResponse = await middleware.onResponse(processedResponse);
        }
      }

      return processedResponse;
    } catch (error) {
      recordedRequest.error = error;
      this.recordedRequests.push(recordedRequest);

      // Apply error middleware
      let processedError = error;
      for (const middleware of this.middlewares) {
        if (middleware.onError) {
          processedError = await middleware.onError(processedError);
        }
      }
      throw processedError;
    }
  }

  async stream(options: RequestOptions): Promise<AsyncIterable<string>> {
    // Mock implementation for streaming
    // Returns an async iterator that yields SSE events
    const matchIndex = this.findMatchingResponse(options);
    if (matchIndex === -1) {
      throw new FusionAIzeError(
        `No mock stream response matched for ${options.method} ${options.url}`,
        ErrorCode.Internal,
      );
    }

    const match = this.responses[matchIndex];
    match.used++;

    if (match.times !== undefined && match.used >= match.times) {
      this.responses.splice(matchIndex, 1);
    }

    const mockResponse = match.response;
    if (!Array.isArray(mockResponse.body)) {
      throw new FusionAIzeError(
        "Mock stream response body must be an array of SSE events",
        ErrorCode.Internal,
      );
    }

    const events = mockResponse.body as string[];
    const delayMs = mockResponse.delayMs ?? this.defaultDelayMs;

    async function* generateEvents() {
      for (const event of events) {
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
        yield event;
      }
    }

    return generateEvents();
  }

  // Configuration methods

  mockResponse(
    matcher: RequestMatcher,
    response: MockResponse<unknown>,
    options?: { times?: number },
  ): this {
    this.responses.push({
      matcher,
      response,
      times: options?.times,
      used: 0,
    });
    return this;
  }

  mockSuccess<T>(
    matcher: RequestMatcher,
    body: T,
    options?: {
      status?: number;
      headers?: Record<string, string>;
      delayMs?: number;
      times?: number;
    },
  ): this {
    return this.mockResponse(
      matcher,
      {
        status: options?.status ?? 200,
        headers: options?.headers,
        body,
        delayMs: options?.delayMs,
      },
      { times: options?.times },
    );
  }

  mockError(
    matcher: RequestMatcher,
    error: {
      status: number;
      message: string;
      body?: any;
      headers?: Record<string, string>;
    },
    options?: {
      delayMs?: number;
      times?: number;
    },
  ): this {
    // Create a mock response that will throw an HttpError
    const errorBody = error.body || { error: { message: error.message } };

    // Store as a special response that will throw
    this.mockResponse(
      matcher,
      {
        status: error.status,
        headers: error.headers,
        body: errorBody,
        delayMs: options?.delayMs,
      },
      { times: options?.times },
    );

    return this;
  }

  mockNetworkError(
    matcher: RequestMatcher,
    options?: {
      delayMs?: number;
      times?: number;
    },
  ): this {
    this.mockResponse(
      matcher,
      {
        status: 0, // Network error
        body: null,
        delayMs: options?.delayMs,
      },
      { times: options?.times },
    );
    return this;
  }

  // Recording and inspection methods

  getRecordedRequests(): RecordedRequest[] {
    return [...this.recordedRequests];
  }

  getRequestCount(): number {
    return this.recordedRequests.length;
  }

  findRequests(matcher: RequestMatcher): RecordedRequest[] {
    return this.recordedRequests.filter((req) => this.matches(req.options, matcher));
  }

  clearRecordedRequests(): void {
    this.recordedRequests = [];
  }

  clearMockResponses(): void {
    this.responses = [];
  }

  reset(): void {
    this.clearRecordedRequests();
    this.clearMockResponses();
    this.middlewares = [];
  }

  // Helper methods

  private findMatchingResponse(options: RequestOptions): number {
    return this.responses.findIndex((r) => this.matches(options, r.matcher));
  }

  private matches(options: RequestOptions, matcher: RequestMatcher): boolean {
    // Match URL
    if (matcher.url) {
      if (typeof matcher.url === "string") {
        if (options.url !== matcher.url) return false;
      } else if (matcher.url instanceof RegExp) {
        if (!matcher.url.test(options.url)) return false;
      }
    }

    // Match method
    if (matcher.method) {
      if (typeof matcher.method === "string") {
        if (options.method !== matcher.method) return false;
      } else if (matcher.method instanceof RegExp) {
        if (!matcher.method.test(options.method)) return false;
      }
    }

    // Match headers
    if (matcher.headers) {
      for (const [key, value] of Object.entries(matcher.headers)) {
        const headerValue = options.headers?.[key.toLowerCase()] || options.headers?.[key];
        if (headerValue === undefined) return false;

        if (typeof value === "string") {
          if (headerValue !== value) return false;
        } else if (value instanceof RegExp) {
          if (!value.test(headerValue)) return false;
        }
      }
    }

    // Match body
    if (matcher.body !== undefined) {
      if (typeof matcher.body === "function") {
        if (!matcher.body(options.body)) return false;
      } else {
        // Simple deep equality (for testing, JSON.stringify comparison is sufficient)
        if (JSON.stringify(options.body) !== JSON.stringify(matcher.body)) return false;
      }
    }

    // Match query params (would need parsing from URL)
    // For now, we can skip query matching as it's complex without URL parsing
    // Could be enhanced later

    return true;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Convenience matchers

  static matchPath(path: string | RegExp): RequestMatcher {
    return {
      url: typeof path === "string" ? path : path,
    };
  }

  static matchMethod(method: string | RegExp): RequestMatcher {
    return { method };
  }

  static matchJSONBody(expected: any): RequestMatcher {
    return { body: expected };
  }

  static matchPartialBody(partial: any): RequestMatcher {
    return {
      body: (actual: any) => {
        try {
          const actualObj = typeof actual === "string" ? JSON.parse(actual) : actual;
          return this.isSubset(partial, actualObj);
        } catch {
          return false;
        }
      },
    };
  }

  private static isSubset(subset: any, superset: any): boolean {
    if (subset === superset) return true;
    if (subset == null || superset == null) return false;
    if (typeof subset !== "object" || typeof superset !== "object") return false;

    for (const key in subset) {
      if (!(key in superset)) return false;
      if (!this.isSubset(subset[key], superset[key])) return false;
    }
    return true;
  }
}
