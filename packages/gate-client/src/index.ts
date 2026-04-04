// Typed client for fusionAIze Gate data‑plane operations
// v1 Gate client with high-level API, streaming support, and ergonomic patterns

import type { ClientConfig } from "@fusionaize/sdk-config";
import type {
  RunRequest,
  RunResponse,
  RunStatus,
  RunListItem,
  StreamEvent,
  ListResponse,
  PaginationParams,
  CapabilityDescriptor,
  ProviderDescriptor,
  ToolCall,
  ToolResult,
  FinishReason,
  TraceMetadata,
} from "@fusionaize/sdk-contracts";
import type { AuthProvider } from "@fusionaize/sdk-auth";
import { Transport, createTransport, HttpError, isHttpError } from "@fusionaize/sdk-transport";
import { getTracer, TraceContext } from "@fusionaize/sdk-tracing";
import {
  FusionAIzeError,
  ErrorCode,
  NetworkError,
  TimeoutError,
  AuthenticationError,
  isRetryableError,
} from "@fusionaize/sdk-errors";

// ============================================================================
// CLIENT CONFIGURATION
// ============================================================================

/**
 * Gate client configuration
 * Extends base client config with Gate-specific options
 * @stable
 */
export interface GateClientConfig extends ClientConfig {
  /** Enable/disable streaming support */
  streamingEnabled?: boolean;
  /** Default timeout for streaming connections (ms) */
  streamingTimeout?: number;
  /** Whether to auto-connect capabilities on client creation */
  autoConnectCapabilities?: boolean;
}

/**
 * Default Gate client configuration
 * @stable
 */
export const DEFAULT_GATE_CONFIG: Required<Pick<
  GateClientConfig,
  | 'streamingEnabled'
  | 'streamingTimeout'
  | 'autoConnectCapabilities'
>> = {
  streamingEnabled: true,
  streamingTimeout: 30000,
  autoConnectCapabilities: true,
};

// ============================================================================
// CLIENT OPTIONS AND TYPES
// ============================================================================

/**
 * Options for creating a run
 * @stable
 */
export interface CreateRunOptions {
  /** Whether to stream the response */
  stream?: boolean;
  /** Optional trace metadata */
  trace?: TraceMetadata;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Additional headers */
  headers?: Record<string, string>;
}

/**
 * Options for streaming a run
 * @stable
 */
export interface StreamRunOptions {
  /** Callback for stream events */
  onEvent?: (event: StreamEvent) => void;
  /** Callback for stream errors */
  onError?: (error: Error) => void;
  /** Callback when stream completes */
  onComplete?: () => void;
  /** Connection timeout */
  timeout?: number;
  /** Additional headers */
  headers?: Record<string, string>;
}

/**
 * Options for listing runs
 * @stable
 */
export interface ListRunsOptions extends PaginationParams {
  /** Filter by status */
  status?: RunStatus["status"];
  /** Filter by model */
  model?: string;
  /** Filter by creation date after */
  createdAfter?: string;
  /** Filter by creation date before */
  createdBefore?: string;
}

/**
 * Run stream iterator
 * Yields stream events as they arrive
 * @stable
 */
export interface RunStream extends AsyncIterable<StreamEvent> {
  /** Cancel the stream */
  cancel(): Promise<void>;
  /** Get the run ID */
  getRunId(): string;
}

// ============================================================================
// GATE CLIENT IMPLEMENTATION
// ============================================================================

/**
 * Gate client for data-plane operations
 * Provides typed, high-level API for interacting with fusionAIze Gate
 * @stable
 */
export class GateClient {
  private transport: Transport;
  private authProvider?: AuthProvider;
  private config: GateClientConfig;
  private tracer = getTracer();
  private capabilities?: CapabilityDescriptor[];
  private providers?: ProviderDescriptor[];

  constructor(config: GateClientConfig) {
    this.config = { ...DEFAULT_GATE_CONFIG, ...config };
    
    // Create transport with middleware
    this.transport = createTransport({
      baseURL: this.config.gateEndpoint || 'http://localhost:8090',
      timeout: this.config.timeout,
      retries: this.config.retries,
      logger: this.config.requestLogging ? console : undefined,
    });
  }

  /**
   * Initialize the client (async setup)
   */
  async initialize(): Promise<this> {
    // Note: Auth provider resolution would happen here
    // For now, transport handles auth via middleware
    
    // Auto-connect capabilities if enabled
    if (this.config.autoConnectCapabilities) {
      try {
        await this.connectCapabilities();
      } catch (error) {
        // Log but don't fail initialization
        console.warn('Failed to fetch capabilities:', error);
      }
    }
    
    return this;
  }

  // ==========================================================================
  // CORE RUN OPERATIONS
  // ==========================================================================

  /**
   * Create a new run
   */
  async createRun(
    request: RunRequest,
    options?: CreateRunOptions
  ): Promise<RunResponse> {
    const traceContext = this.tracer.getTraceContext();
    const headers: Record<string, string> = {};
    
    // Inject trace context
    if (traceContext) {
      this.tracer.inject(headers);
    }
    
    // Add custom headers
    if (options?.headers) {
      Object.assign(headers, options.headers);
    }
    
    try {
      const response = await this.transport.request<RunResponse>({
        method: 'POST',
        url: '/v1/runs',
        body: request,
        headers,
        timeout: options?.timeout,
        trace: options?.trace,
        stream: options?.stream,
      });
      
      return response.body;
    } catch (error) {
      this.handleRequestError(error, 'createRun');
    }
  }

  /**
   * Get a run by ID
   */
  async getRun(runId: string): Promise<RunResponse> {
    try {
      const response = await this.transport.request<RunResponse>({
        method: 'GET',
        url: `/v1/runs/${runId}`,
      });
      
      return response.body;
    } catch (error) {
      this.handleRequestError(error, 'getRun', { runId });
    }
  }

  /**
   * Get run status
   */
  async getRunStatus(runId: string): Promise<RunStatus> {
    try {
      const response = await this.transport.request<RunStatus>({
        method: 'GET',
        url: `/v1/runs/${runId}/status`,
      });
      
      return response.body;
    } catch (error) {
      this.handleRequestError(error, 'getRunStatus', { runId });
    }
  }

  /**
   * List runs with filtering and pagination
   */
  async listRuns(options?: ListRunsOptions): Promise<ListResponse<RunListItem>> {
    const params = new URLSearchParams();
    
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.cursor) params.set('cursor', options.cursor);
    if (options?.status) params.set('status', options.status);
    if (options?.model) params.set('model', options.model);
    if (options?.createdAfter) params.set('created_after', options.createdAfter);
    if (options?.createdBefore) params.set('created_before', options.createdBefore);
    
    const queryString = params.toString();
    const url = `/v1/runs${queryString ? `?${queryString}` : ''}`;
    
    try {
      const response = await this.transport.request<ListResponse<RunListItem>>({
        method: 'GET',
        url,
      });
      
      return response.body;
    } catch (error) {
      this.handleRequestError(error, 'listRuns');
    }
  }

  /**
   * Cancel a run
   */
  async cancelRun(runId: string): Promise<void> {
    try {
      await this.transport.request({
        method: 'POST',
        url: `/v1/runs/${runId}/cancel`,
      });
    } catch (error) {
      this.handleRequestError(error, 'cancelRun', { runId });
    }
  }

  // ==========================================================================
  // STREAMING OPERATIONS
  // ==========================================================================

  /**
   * Stream a run (Server-Sent Events)
   * Returns an async iterator over stream events
   */
  async streamRun(runId: string, options?: StreamRunOptions): Promise<RunStream> {
    if (!this.config.streamingEnabled) {
      throw new Error('Streaming is disabled in client configuration');
    }
    
    const url = `/v1/runs/${runId}/stream`;
    let abortController: AbortController | undefined;
    
    // Create async iterator
    const iterator = (async function* () {
      try {
        // TODO: Implement SSE streaming with EventSource or fetch + ReadableStream
        // This is a placeholder implementation
        const response = await fetch(url, {
          method: 'GET',
          headers: options?.headers,
          signal: abortController?.signal,
        });
        
        if (!response.ok) {
          throw new HttpError(
            `Stream request failed: ${response.status}`,
            response.status,
            { response: await response.json().catch(() => ({})) }
          );
        }
        
        // Parse SSE stream
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response body is not readable');
        }
        
        const decoder = new TextDecoder();
        let buffer = '';
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  options?.onComplete?.();
                  return;
                }
                
                try {
                  const event = JSON.parse(data) as StreamEvent;
                  yield event;
                  options?.onEvent?.(event);
                } catch (parseError) {
                  console.warn('Failed to parse stream event:', parseError, data);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } catch (error) {
        options?.onError?.(error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    })();
    
    // Create stream object with cancel method
    const stream: RunStream = {
      [Symbol.asyncIterator]: () => iterator,
      cancel: async () => {
        abortController?.abort();
      },
      getRunId: () => runId,
    };
    
    return stream;
  }

  // ==========================================================================
  // CAPABILITIES AND PROVIDERS
  // ==========================================================================

  /**
   * Get available capabilities
   */
  async getCapabilities(): Promise<CapabilityDescriptor[]> {
    try {
      const response = await this.transport.request<{ capabilities: CapabilityDescriptor[] }>({
        method: 'GET',
        url: '/v1/capabilities',
      });
      
      this.capabilities = response.body.capabilities;
      return this.capabilities;
    } catch (error) {
      this.handleRequestError(error, 'getCapabilities');
    }
  }

  /**
   * Get provider information
   */
  async getProviders(): Promise<ProviderDescriptor[]> {
    try {
      const response = await this.transport.request<{ providers: ProviderDescriptor[] }>({
        method: 'GET',
        url: '/v1/providers',
      });
      
      this.providers = response.body.providers;
      return this.providers;
    } catch (error) {
      this.handleRequestError(error, 'getProviders');
    }
  }

  /**
   * Connect and cache capabilities/providers
   */
  async connectCapabilities(): Promise<{
    capabilities: CapabilityDescriptor[];
    providers: ProviderDescriptor[];
  }> {
    const [capabilities, providers] = await Promise.all([
      this.getCapabilities(),
      this.getProviders(),
    ]);
    
    return { capabilities, providers };
  }

  /**
   * Check if a capability is supported
   */
  hasCapability(capabilityId: string): boolean {
    return this.capabilities?.some(cap => cap.id === capabilityId) || false;
  }

  /**
   * Check if a model is supported by any provider
   */
  async isModelSupported(modelId: string): Promise<boolean> {
    if (!this.providers) {
      await this.getProviders();
    }
    
    return this.providers?.some(provider =>
      provider.models.some(model => model.id === modelId)
    ) || false;
  }

  // ==========================================================================
  // TOOL EXECUTION (CLIENT-SIDE)
  // ==========================================================================

  /**
   * Execute a tool call locally
   * This is a client-side helper, not a server operation
   */
  async executeTool(toolCall: ToolCall, handler: (call: ToolCall) => Promise<string>): Promise<ToolResult> {
    try {
      const output = await handler(toolCall);
      return {
        tool_call_id: toolCall.id,
        output,
      };
    } catch (error) {
      throw new Error(`Tool execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Submit tool results to continue a run
   */
  async submitToolResults(runId: string, results: ToolResult[]): Promise<RunResponse> {
    try {
      const response = await this.transport.request<RunResponse>({
        method: 'POST',
        url: `/v1/runs/${runId}/tool_results`,
        body: { results },
      });
      
      return response.body;
    } catch (error) {
      this.handleRequestError(error, 'submitToolResults', { runId });
    }
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Get the base URL
   */
  getBaseURL(): string {
    return this.config.gateEndpoint || 'http://localhost:8090';
  }

  /**
   * Check if client is initialized
   */
  isInitialized(): boolean {
    return !!this.transport;
  }

  /**
   * Close the client (cleanup resources)
   */
  async close(): Promise<void> {
    // Cleanup any ongoing streams or connections
    // Transport cleanup would happen here if needed
  }

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  private handleRequestError(error: unknown, operation: string, context?: Record<string, unknown>): never {
    // Enhance error with context
    if (error instanceof FusionAIzeError) {
      throw error.withDetails({
        operation,
        ...context,
      });
    }
    
    // Convert HTTP errors
    if (isHttpError(error)) {
      throw new NetworkError(
        `${operation} failed with HTTP ${error.status}`,
        {
          operation,
          status: error.status,
          ...context,
        }
      );
    }
    
    // Convert timeout errors
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new TimeoutError(
        `${operation} timed out`,
        {
          operation,
          ...context,
        }
      );
    }
    
    // Generic error
    throw new FusionAIzeError(
      `${operation} failed: ${error instanceof Error ? error.message : String(error)}`,
      ErrorCode.Internal,
      {
        operation,
        ...context,
        originalError: error,
      }
    );
  }
}

// ============================================================================
// CLIENT FACTORY
// ============================================================================

/**
 * Create a Gate client from configuration
 * @stable
 */
export async function createGateClient(config: GateClientConfig): Promise<GateClient> {
  const client = new GateClient(config);
  return client.initialize();
}

/**
 * Create a Gate client with default configuration
 * @stable
 */
export function createDefaultGateClient(baseURL?: string): GateClient {
  const config: GateClientConfig = {
    gateEndpoint: baseURL || 'http://localhost:8090',
    streamingEnabled: true,
    autoConnectCapabilities: true,
  };
  
  return new GateClient(config);
}

// ============================================================================
// TYPE GUARDS AND UTILITIES
// ============================================================================

/**
 * Check if an object is a RunStream
 * @stable
 */
export function isRunStream(obj: unknown): obj is RunStream {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    Symbol.asyncIterator in obj &&
    typeof (obj as any).cancel === 'function' &&
    typeof (obj as any).getRunId === 'function'
  );
}

/**
 * Check if a stream event indicates completion
 * @stable
 */
export function isCompletionEvent(event: StreamEvent): boolean {
  return event.type === 'run.finish' || event.type === 'run.error';
}

/**
 * Extract content from stream events
 * @stable
 */
export function* extractContentFromStream(stream: AsyncIterable<StreamEvent>): AsyncGenerator<string> {
  for await (const event of stream) {
    if (event.type === 'run.completion') {
      yield event.data.content;
    }
  }
}