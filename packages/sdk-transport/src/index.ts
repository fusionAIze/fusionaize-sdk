// HTTP transport layer for fusionAIze SDK
// v1 transport model with timeouts, retries, middleware, and SSE support

import type { AuthProvider } from "@fusionaize/sdk-auth";
import type { TraceMetadata } from "@fusionaize/sdk-contracts";
import { 
  NetworkError, 
  TimeoutError, 
  AuthenticationError,
  isRetryableError,
} from "@fusionaize/sdk-errors";

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * HTTP request options
 * @stable
 */
export interface RequestOptions {
  /** HTTP method */
  method: string;
  /** URL path (relative to base URL) or absolute URL */
  url: string;
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body (automatically serialized if object) */
  body?: unknown;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Number of retries for failed requests */
  retries?: number;
  /** Base delay between retries in milliseconds */
  retryDelay?: number;
  /** Maximum delay between retries in milliseconds */
  maxRetryDelay?: number;
  /** Whether to throw on non-2xx status codes */
  throwOnError?: boolean;
  /** Trace metadata for distributed tracing */
  trace?: TraceMetadata;
  /** Query parameters */
  query?: Record<string, string | number | boolean>;
  /** Whether to stream the response (SSE) */
  stream?: boolean;
}

/**
 * HTTP response
 * @stable
 */
export interface Response<T = unknown> {
  /** HTTP status code */
  status: number;
  /** Response headers */
  headers: Record<string, string>;
  /** Response body (parsed if JSON) */
  body: T;
  /** Original response object */
  rawResponse?: globalThis.Response;
}

/**
 * HTTP error with status code and response details
 * @stable
 */
export class HttpError extends NetworkError {
  readonly status: number;
  readonly response?: Response;

  constructor(
    message: string,
    status: number,
    options?: {
      response?: Response;
      details?: Record<string, unknown>;
      cause?: unknown;
    }
  ) {
    super(message, {
      ...options?.details,
      status,
      response: options?.response,
    });
    this.name = "HttpError";
    this.status = status;
    this.response = options?.response;
  }
}

/**
 * Middleware for processing requests and responses
 * @stable
 */
export interface Middleware {
  /** Process request before sending */
  onRequest?: (request: RequestOptions) => Promise<RequestOptions> | RequestOptions;
  /** Process response after receiving */
  onResponse?: <T>(response: Response<T>) => Promise<Response<T>> | Response<T>;
  /** Process error */
  onError?: (error: unknown) => Promise<unknown> | unknown;
}

/**
 * Transport interface for HTTP communication
 * @stable
 */
export interface Transport {
  /** Base URL for all requests */
  readonly baseURL: string;
  
  /** Send an HTTP request */
  request<T = unknown>(options: RequestOptions): Promise<Response<T>>;
  
  /** Stream an HTTP response (SSE) */
  stream?(options: RequestOptions): Promise<AsyncIterable<string>>;
  
  /** Add middleware */
  use(middleware: Middleware): this;
}

// ============================================================================
// RETRY STRATEGIES
// ============================================================================

/**
 * Retry strategy configuration
 * @stable
 */
export interface RetryStrategy {
  /** Maximum number of retries */
  maxRetries: number;
  /** Base delay between retries in milliseconds */
  baseDelay: number;
  /** Maximum delay between retries in milliseconds */
  maxDelay: number;
  /** Whether to retry on specific status codes */
  retryOnStatus?: number[];
  /** Custom retry predicate */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Calculate delay for a specific attempt */
  calculateDelay?: (attempt: number) => number;
}

/**
 * Default retry strategy with exponential backoff
 * @stable
 */
export const DEFAULT_RETRY_STRATEGY: RetryStrategy = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryOnStatus: [408, 429, 500, 502, 503, 504],
  shouldRetry: (error: unknown) => isRetryableError(error),
  calculateDelay: (attempt: number) => {
    const delay = DEFAULT_RETRY_STRATEGY.baseDelay * Math.pow(2, attempt);
    return Math.min(delay, DEFAULT_RETRY_STRATEGY.maxDelay);
  },
};

// ============================================================================
// MIDDLEWARE IMPLEMENTATIONS
// ============================================================================

/**
 * Authentication middleware
 * Adds authentication headers to requests
 * @stable
 */
export class AuthMiddleware implements Middleware {
  constructor(private authProvider: AuthProvider) {}

  async onRequest(request: RequestOptions): Promise<RequestOptions> {
    try {
      const authHeaders = await this.authProvider.getHeaders();
      return {
        ...request,
        headers: {
          ...request.headers,
          ...authHeaders,
        },
      };
    } catch (error) {
      throw new AuthenticationError('Failed to get authentication headers', {
        cause: error,
      });
    }
  }
}

/**
 * Tracing middleware
 * Adds trace headers to requests
 * @stable
 */
export class TracingMiddleware implements Middleware {
  constructor(
    private getTraceMetadata?: () => TraceMetadata | undefined
  ) {}

  onRequest(request: RequestOptions): RequestOptions {
    const trace = request.trace || this.getTraceMetadata?.();
    if (!trace) return request;

    const traceHeaders: Record<string, string> = {};
    
    // W3C Trace Context format
    if (trace.traceId) {
      traceHeaders['traceparent'] = `00-${trace.traceId}-${trace.spanId || '0000000000000000'}-01`;
    }
    
    // Custom headers
    if (trace.traceId) {
      traceHeaders['x-trace-id'] = trace.traceId;
    }
    if (trace.spanId) {
      traceHeaders['x-span-id'] = trace.spanId;
    }
    if (trace.parentSpanId) {
      traceHeaders['x-parent-span-id'] = trace.parentSpanId;
    }

    return {
      ...request,
      headers: {
        ...request.headers,
        ...traceHeaders,
      },
    };
  }
}

/**
 * Logging middleware
 * Logs requests and responses
 * @beta
 */
export class LoggingMiddleware implements Middleware {
  constructor(
    private logger: {
      debug: (message: string, data?: any) => void;
      info: (message: string, data?: any) => void;
      warn: (message: string, data?: any) => void;
      error: (message: string, data?: any) => void;
    } = console
  ) {}

  async onRequest(request: RequestOptions): Promise<RequestOptions> {
    this.logger.debug('HTTP request', {
      method: request.method,
      url: request.url,
      headers: this.sanitizeHeaders(request.headers),
      hasBody: !!request.body,
    });
    return request;
  }

  async onResponse<T>(response: Response<T>): Promise<Response<T>> {
    this.logger.debug('HTTP response', {
      status: response.status,
      headers: this.sanitizeHeaders(response.headers),
      hasBody: !!response.body,
    });
    return response;
  }

  async onError(error: unknown): Promise<unknown> {
    this.logger.error('HTTP error', { error });
    return error;
  }

  private sanitizeHeaders(headers?: Record<string, string>): Record<string, string> | undefined {
    if (!headers) return undefined;

    const sanitized: Record<string, string> = { ...headers };
    const sensitiveKeys = ['authorization', 'api-key', 'token', 'session-id'];
    
    for (const key of sensitiveKeys) {
      if (sanitized[key.toLowerCase()]) {
        sanitized[key.toLowerCase()] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}

/**
 * Timeout middleware
 * Adds request timeout
 * @stable
 */
export class TimeoutMiddleware implements Middleware {
  constructor(private defaultTimeout: number = 30000) {}

  async onRequest(request: RequestOptions): Promise<RequestOptions> {
    if (request.timeout !== undefined) return request;
    
    return {
      ...request,
      timeout: this.defaultTimeout,
    };
  }
}

// ============================================================================
// TRANSPORT IMPLEMENTATIONS
// ============================================================================

/**
 * Base transport implementation with middleware support
 * @stable
 */
export abstract class BaseTransport implements Transport {
  readonly baseURL: string;
  protected middlewares: Middleware[] = [];

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  use(middleware: Middleware): this {
    this.middlewares.push(middleware);
    return this;
  }

  async request<T = unknown>(options: RequestOptions): Promise<Response<T>> {
    let currentOptions = options;
    let response: Response<T>;

    // Apply request middleware
    for (const middleware of this.middlewares) {
      if (middleware.onRequest) {
        currentOptions = await middleware.onRequest(currentOptions);
      }
    }

    try {
      // Execute request with retries
      response = await this.executeRequestWithRetry<T>(currentOptions);
    } catch (error) {
      // Apply error middleware
      let processedError = error;
      for (const middleware of this.middlewares) {
        if (middleware.onError) {
          processedError = await middleware.onError(processedError);
        }
      }
      throw processedError;
    }

    // Apply response middleware
    let processedResponse = response;
    for (const middleware of this.middlewares) {
      if (middleware.onResponse) {
        processedResponse = await middleware.onResponse(processedResponse);
      }
    }

    return processedResponse;
  }

  /**
   * Execute request with retry logic
   */
  private async executeRequestWithRetry<T>(
    options: RequestOptions,
    attempt: number = 0
  ): Promise<Response<T>> {
    const maxRetries = options.retries ?? DEFAULT_RETRY_STRATEGY.maxRetries;
    const retryDelay = options.retryDelay ?? DEFAULT_RETRY_STRATEGY.baseDelay;
    const maxRetryDelay = options.maxRetryDelay ?? DEFAULT_RETRY_STRATEGY.maxDelay;

    try {
      return await this.executeRequest<T>(options);
    } catch (error) {
      // Check if we should retry
      const shouldRetry = 
        attempt < maxRetries &&
        DEFAULT_RETRY_STRATEGY.shouldRetry?.(error, attempt) !== false;

      if (!shouldRetry) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        retryDelay * Math.pow(2, attempt),
        maxRetryDelay
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Retry
      return this.executeRequestWithRetry<T>(options, attempt + 1);
    }
  }

  /**
   * Execute a single HTTP request
   * Must be implemented by concrete transports
   */
  protected abstract executeRequest<T>(options: RequestOptions): Promise<Response<T>>;

  /**
   * Create a timeout promise that rejects after specified milliseconds
   */
  protected createTimeoutPromise<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    if (timeoutMs <= 0) return promise;

    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => {
          reject(new TimeoutError(`Request timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  }
}

/**
 * Fetch-based transport (works in Node.js and browsers)
 * @stable
 */
export class FetchTransport extends BaseTransport {
  constructor(
    baseURL: string,
    private fetchImpl: typeof fetch = typeof fetch !== 'undefined' ? fetch : require('node-fetch')
  ) {
    super(baseURL);
  }

  protected async executeRequest<T>(options: RequestOptions): Promise<Response<T>> {
    const url = this.buildURL(options.url, options.query);
    const headers = this.buildHeaders(options.headers);
    const body = this.buildBody(options.body, headers);

    const init: RequestInit = {
      method: options.method,
      headers,
      body,
    };

    // Apply timeout if specified
    const timeout = options.timeout;
    let responsePromise = this.fetchImpl(url, init);

    if (timeout !== undefined && timeout > 0) {
      responsePromise = this.createTimeoutPromise(responsePromise, timeout);
    }

    const response = await responsePromise;

    // Parse response
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    let responseBody: T;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      responseBody = await response.json() as T;
    } else if (contentType?.includes('text/')) {
      responseBody = await response.text() as T;
    } else {
      responseBody = await response.arrayBuffer() as T;
    }

    const result: Response<T> = {
      status: response.status,
      headers: responseHeaders,
      body: responseBody,
      rawResponse: response,
    };

    // Throw on error if requested
    if (options.throwOnError !== false && !response.ok) {
      throw new HttpError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        { response: result }
      );
    }

    return result;
  }

  async stream(options: RequestOptions): Promise<AsyncIterable<string>> {
    // For SSE, we need to handle streaming differently
    // This is a placeholder implementation
    throw new Error('SSE streaming not yet implemented');
  }

  private buildURL(path: string, query?: Record<string, string | number | boolean>): string {
    // If path is absolute, use it directly
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return this.addQueryParams(path, query);
    }

    // Otherwise, combine with base URL
    const base = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${base}${normalizedPath}`;

    return this.addQueryParams(url, query);
  }

  private addQueryParams(url: string, query?: Record<string, string | number | boolean>): string {
    if (!query || Object.keys(query).length === 0) {
      return url;
    }

    const separator = url.includes('?') ? '&' : '?';
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      params.append(key, String(value));
    }

    return `${url}${separator}${params.toString()}`;
  }

  private buildHeaders(customHeaders?: Record<string, string>): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...customHeaders,
    };

    // Convert to HeadersInit format
    return headers;
  }

  private buildBody(body: unknown, headers: HeadersInit): BodyInit | undefined {
    if (body === undefined || body === null) {
      return undefined;
    }

    // Check if already a BodyInit
    if (
      typeof body === 'string' ||
      body instanceof ArrayBuffer ||
      body instanceof Blob ||
      body instanceof FormData ||
      body instanceof URLSearchParams
    ) {
      return body;
    }

    // Otherwise, stringify as JSON
    const headersObj = headers as Record<string, string>;
    if (headersObj['Content-Type']?.includes('application/json')) {
      return JSON.stringify(body);
    }

    // Fallback to string
    return String(body);
  }
}

// ============================================================================
// TRANSPORT FACTORY
// ============================================================================

/**
 * Create a transport instance with common middleware
 * @stable
 */
export function createTransport(options: {
  baseURL: string;
  authProvider?: AuthProvider;
  timeout?: number;
  retries?: number;
  traceMetadata?: TraceMetadata | (() => TraceMetadata | undefined);
  logger?: any;
}): Transport {
  const transport = new FetchTransport(options.baseURL);

  // Add timeout middleware
  if (options.timeout !== undefined) {
    transport.use(new TimeoutMiddleware(options.timeout));
  }

  // Add authentication middleware
  if (options.authProvider) {
    transport.use(new AuthMiddleware(options.authProvider));
  }

  // Add tracing middleware
  const getTraceMetadata = typeof options.traceMetadata === 'function' 
    ? options.traceMetadata
    : () => options.traceMetadata;
  transport.use(new TracingMiddleware(getTraceMetadata));

  // Add logging middleware if logger provided
  if (options.logger) {
    transport.use(new LoggingMiddleware(options.logger));
  }

  return transport;
}

/**
 * Create a simple transport without middleware
 * @stable
 */
export function createSimpleTransport(baseURL: string): Transport {
  return new FetchTransport(baseURL);
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Make an HTTP request using a simple transport
 * @stable
 */
export async function request<T = unknown>(
  url: string,
  options: Omit<RequestOptions, 'url'>
): Promise<Response<T>> {
  const transport = new FetchTransport('');
  return transport.request<T>({ ...options, url });
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for HttpError
 * @stable
 */
export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

/**
 * Type guard for Response
 * @stable
 */
export function isResponse<T = unknown>(obj: unknown): obj is Response<T> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'status' in obj &&
    'headers' in obj &&
    'body' in obj
  );
}