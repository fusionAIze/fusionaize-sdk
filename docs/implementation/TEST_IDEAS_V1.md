# Test Ideas & Design Questions - v1 Basics

> Test strategies and open design questions for the fusionAIze SDK v1 foundation packages

## Package Overview

### 1. `@fusionaize/sdk-errors`
**Core functionality**: Error taxonomy, serializable errors, retry logic

**Test ideas**:
- ✅ **Unit tests for FusionAIzeError**
  - Test constructor with various options (details, cause, correlationId)
  - Test `toJSON()` serialization round-trip
  - Test `isRetryable()`, `isClientError()`, `isServerError()` with different error codes
  - Test `withDetails()` and `withCorrelationId()` chaining

- ✅ **Unit tests for specific error classes**
  - ConfigurationError, NetworkError, AuthenticationError, etc.
  - Ensure proper inheritance and name setting

- ✅ **Unit tests for utility functions**
  - `errorToJSON()` with generic Error and FusionAIzeError
  - `errorFromJSON()` round-trip consistency
  - `isRetryableError()` with various error types
  - Type guards (`isSerializableError`, `isFusionAIzeError`)

- ✅ **Integration tests**
  - Error serialization/deserialization across process boundaries
  - Error propagation in async contexts

**First test examples**:
```typescript
import { FusionAIzeError, ErrorCode, errorToJSON, errorFromJSON } from '@fusionaize/sdk-errors';

describe('FusionAIzeError', () => {
  it('creates error with details', () => {
    const error = new FusionAIzeError('Test', ErrorCode.InvalidRequest, {
      details: { field: 'value' }
    });
    expect(error.code).toBe(ErrorCode.InvalidRequest);
    expect(error.details).toEqual({ field: 'value' });
  });

  it('serializes and deserializes', () => {
    const original = new FusionAIzeError('Test', ErrorCode.NotFound);
    const json = errorToJSON(original);
    const restored = errorFromJSON(json);
    expect(restored.message).toBe(original.message);
    expect(restored.code).toBe(original.code);
  });
});
```

### 2. `@fusionaize/sdk-config`
**Core functionality**: Configuration loading, profile resolution, endpoint resolution

**Test ideas**:
- ✅ **Unit tests for ConfigLoader**
  - Test loading from multiple sources (env, profiles)
  - Test source priority ordering
  - Test profile inheritance resolution
  - Test validation errors

- ✅ **Unit tests for EnvConfigSource**
  - Test environment variable parsing (strings, numbers, booleans)
  - Test default values when env vars not set
  - Test NODE_ENV handling

- ✅ **Unit tests for ProfileConfigSource**
  - Test profile resolution with inheritance
  - Test missing profile handling
  - Test profile merging

- ✅ **Unit tests for EndpointResolver**
  - Test URL construction with/without paths
  - Test localhost detection
  - Test HTTPS detection

- ✅ **Integration tests**
  - Full configuration loading with real environment
  - Configuration validation with invalid inputs
  - Endpoint resolution with various base URLs

**First test examples**:
```typescript
import { ConfigLoader, EnvConfigSource } from '@fusionaize/sdk-config';

describe('ConfigLoader', () => {
  beforeEach(() => {
    // Setup environment variables
    process.env.FUSIONAIZE_GATE_ENDPOINT = 'https://api.example.com';
    process.env.FUSIONAIZE_API_KEY = 'test-key';
  });

  afterEach(() => {
    // Cleanup
    delete process.env.FUSIONAIZE_GATE_ENDPOINT;
    delete process.env.FUSIONAIZE_API_KEY;
  });

  it('loads config from environment', async () => {
    const loader = new ConfigLoader();
    const config = await loader.load();
    expect(config.gateEndpoint).toBe('https://api.example.com');
    expect(config.apiKey).toBe('test-key');
  });

  it('validates invalid URLs', async () => {
    process.env.FUSIONAIZE_GATE_ENDPOINT = 'not-a-url';
    const loader = new ConfigLoader();
    await expect(loader.load()).rejects.toThrow();
  });
});
```

### 3. `@fusionaize/sdk-auth`
**Core functionality**: Authentication providers, credential management, token refresh

**Test ideas**:
- ✅ **Unit tests for AuthProviders**
  - Test `ApiKeyAuthProvider` header generation
  - Test `BearerTokenAuthProvider` token refresh logic
  - Test `SessionAuthProvider` session headers
  - Test `CompositeAuthProvider` fallback behavior

- ✅ **Unit tests for CredentialStores**
  - Test `InMemoryCredentialStore` CRUD operations
  - Test `EnvironmentCredentialStore` read-only behavior
  - Test credential expiration validation

- ✅ **Unit tests for AuthResolver**
  - Test provider resolution from config (apiKey, token, session)
  - Test environment fallback
  - Test credential store integration

- ✅ **Integration tests**
  - End-to-end authentication flow
  - Token refresh scenarios
  - Multiple provider fallback chains

**First test examples**:
```typescript
import { ApiKeyAuthProvider, BearerTokenAuthProvider, AuthResolver } from '@fusionaize/sdk-auth';

describe('AuthProviders', () => {
  it('generates API key headers', async () => {
    const provider = new ApiKeyAuthProvider('test-key');
    const headers = await provider.getHeaders();
    expect(headers.Authorization).toBe('Bearer test-key');
  });

  it('resolves provider from config', async () => {
    const resolver = new AuthResolver();
    const provider = await resolver.resolve({
      apiKey: 'test-key'
    });
    expect(provider.getType()).toBe('apiKey');
  });
});
```

### 4. `@fusionaize/sdk-transport`
**Core functionality**: HTTP transport, retries, middleware, timeouts

**Test ideas**:
- ✅ **Unit tests for FetchTransport**
  - Test basic GET/POST requests
  - Test request/response serialization
  - Test error handling (HTTP errors, network errors)
  - Test timeout handling

- ✅ **Unit tests for Middleware**
  - Test `AuthMiddleware` header injection
  - Test `TracingMiddleware` trace propagation
  - Test `LoggingMiddleware` request/response logging
  - Test `TimeoutMiddleware` timeout setting

- ✅ **Unit tests for Retry Logic**
  - Test exponential backoff calculation
  - Test retry on specific status codes
  - Test max retry limit
  - Test retry predicate logic

- ✅ **Integration tests**
  - Full request/response cycle with mock server
  - Middleware chain execution order
  - Retry behavior with flaky endpoints

**First test examples**:
```typescript
import { FetchTransport, AuthMiddleware } from '@fusionaize/sdk-transport';
import { ApiKeyAuthProvider } from '@fusionaize/sdk-auth';

describe('FetchTransport', () => {
  let transport: FetchTransport;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    transport = new FetchTransport('https://api.example.com', mockFetch);
  });

  it('makes GET request', async () => {
    mockFetch.mockResolvedValue(new Response(
      JSON.stringify({ data: 'test' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    ));

    const response = await transport.request({
      method: 'GET',
      url: '/test'
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: 'test' });
  });
});
```

### 5. `@fusionaize/sdk-tracing`
**Core functionality**: Distributed tracing, span management, context propagation

**Test ideas**:
- ✅ **Unit tests for Trace Context**
  - Test W3C Trace Context format parsing/generation
  - Test custom header fallback
  - Test ID generation and validation

- ✅ **Unit tests for Span Management**
  - Test span creation with parent/child relationships
  - Test span events and attributes
  - Test span status setting
  - Test span timing

- ✅ **Unit tests for Async Context**
  - Test `TraceContextManager` with AsyncLocalStorage (Node.js)
  - Test context propagation across async boundaries
  - Test fallback behavior without AsyncLocalStorage

- ✅ **Integration tests**
  - End-to-end trace propagation through HTTP calls
  - Multi-span trace correlation
  - Trace export to external systems (optional)

**First test examples**:
```typescript
import { createSpan, endSpan, propagateTrace, extractTrace } from '@fusionaize/sdk-tracing';

describe('Tracing', () => {
  it('creates and ends span', () => {
    const span = createSpan('test-operation');
    expect(span.name).toBe('test-operation');
    expect(span.startTime).toBeGreaterThan(0);

    const endedSpan = endSpan(span, { status: 1 });
    expect(endedSpan.endTime).toBeDefined();
    expect(endedSpan.status.code).toBe(1);
  });

  it('propagates and extracts trace context', () => {
    const context = {
      traceId: '1234567890abcdef1234567890abcdef',
      spanId: '1234567890abcdef',
      traceFlags: 1
    };

    const headers = propagateTrace(context);
    expect(headers.traceparent).toBeDefined();

    const extracted = extractTrace(headers);
    expect(extracted?.traceId).toBe(context.traceId);
  });
});
```

## Open Design Questions

### 1. Error Serialization Boundaries
**Question**: Should `errorToJSON()` include stack traces by default?  
**Options**:
- ✅ Include always (good for debugging, bad for production)
- ✅ Include based on environment (NODE_ENV === 'development')
- ✅ Configurable via options parameter
- ✅ Never include (require explicit opt-in)

**Recommendation**: Configurable via options with environment-aware defaults.

### 2. Configuration Source Priority
**Question**: How should conflicting configuration sources be resolved?  
**Current**: Higher priority sources override lower ones.  
**Open issues**:
- Should there be a merge strategy for nested objects?
- How to handle array values (replace vs. concatenate)?
- Should environment variables always win over config files?

**Recommendation**: Simple override strategy for v1, consider advanced merging for v2.

### 3. Authentication Provider Chain
**Question**: How aggressive should the composite provider be?  
**Options**:
- ✅ Try all providers, use first that works
- ✅ Try providers in order, stop at first valid credentials
- ✅ Allow manual provider selection
- ✅ Support provider weights/priorities

**Current**: Try all providers, use first that works.  
**Open issue**: May cause unnecessary auth attempts (e.g., trying expired tokens).

### 4. Transport Middleware Ordering
**Question**: What's the correct middleware execution order?  
**Typical order**:  
1. Tracing (needs to be first to capture full request)
2. Authentication (adds auth headers)
3. Logging (should see final request)
4. Timeout (should be last before sending)

**Current**: First-added, first-executed (may need explicit ordering).

### 5. Async Context Propagation
**Question**: How to handle async context in browser environments?  
**Current**: Uses `AsyncLocalStorage` when available (Node.js).  
**Open issues**:
- Browser support requires different approach (AsyncContext, zones)
- Should we provide polyfills or require user implementation?
- How to handle context loss across microtasks?

**Recommendation**: Document limitation for browsers, provide adapter interface.

### 6. SSE/Streaming Support
**Question**: How to design streaming API for transport?  
**Current**: Placeholder `stream()` method.  
**Design decisions needed**:
- EventSource vs. ReadableStream vs. custom parser
- Backpressure handling
- Error recovery and reconnection
- Connection pooling

**Recommendation**: Start with simple EventSource wrapper, evolve based on use cases.

### 7. Credential Storage Security
**Question**: How to securely store credentials in different environments?  
**Current**: In-memory and environment variable stores.  
**Open issues**:
- Encrypted storage for sensitive credentials
- Platform-specific secure storage (Keychain, Credential Manager)
- Credential rotation automation

**Recommendation**: Add pluggable secure store interface for v2.

### 8. Trace Export & Integration
**Question**: Should tracing package include exporters?  
**Current**: No exporters, only context propagation.  
**Options**:
- Keep lightweight, require users to integrate with OpenTelemetry
- Provide basic console exporter for development
- Create separate `@fusionaize/sdk-telemetry` package

**Recommendation**: Basic console logger for dev, integration hooks for production.

## Testing Strategy

### Unit Testing
- **Framework**: Vitest (already configured)
- **Coverage goal**: >80% for core logic
- **Mock strategy**: Dependency injection for external services
- **Test location**: `__tests__` directories alongside source

### Integration Testing
- **Mock server**: MSW (Mock Service Worker) for HTTP
- **Environment testing**: Isolated env vars per test
- **Cross-package tests**: Test package interactions

### E2E Testing
- **Test scenarios**: Full SDK initialization → API call → response
- **Real services**: Optional tests against actual Gate instance
- **Performance tests**: Load testing for transport layer

## Implementation Notes

### Dependencies
- Ensure all package.json dependencies are correctly specified
- Watch for circular dependencies between packages
- Keep external dependencies minimal

### Type Safety
- Maintain strict TypeScript configuration
- Use discriminated unions for variant types
- Provide comprehensive type exports

### Documentation
- JSDoc comments for all public APIs
- Example code in README files
- Architecture decision records for major choices

## Next Steps

1. **Fix build dependencies** - Resolve module resolution issues
2. **Write initial test suite** - Start with sdk-errors and sdk-config
3. **Validate package boundaries** - Run `pnpm check:boundaries`
4. **Test integration scenarios** - Ensure packages work together
5. **Document public APIs** - Generate API documentation
6. **Performance profiling** - Identify bottlenecks in transport layer

## Migration Considerations

When updating these packages from placeholder implementations:

1. **Backward compatibility**: Maintain existing API surfaces where possible
2. **Deprecation strategy**: Use `@deprecated` JSDoc tags for old APIs
3. **Migration guides**: Document breaking changes between versions
4. **TypeScript compatibility**: Ensure type definitions are stable

---

*Last Updated: April 2025*  
*See also: [Package Specifications](../architecture/PACKAGE_SPECIFICATIONS.md)*