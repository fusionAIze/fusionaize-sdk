# Package Specifications

> Detailed architectural specifications for all 11 packages in the fusionAIze SDK monorepo

## Overview

This document provides detailed architectural specifications for each package in the fusionAIze SDK monorepo. Each specification includes:

1. **Purpose** - What the package exists to provide
2. **Public API** - What should be exported from the package
3. **Allowed Dependencies** - What other packages this package can depend on
4. **Not Allowed** - Explicit restrictions on content and dependencies
5. **Implementation Notes** - Key architectural considerations

## Package Categories

### Foundation Packages (`@fusionaize/sdk-*`)
Cross-cutting utilities, types, and infrastructure used throughout the fusionAIze ecosystem. These packages form the foundation layer and must be dependency-light, framework-agnostic, and free of business logic.

### Service Client Packages (`@fusionaize/gate-*`)
Type-safe clients for specific fusionAIze services. These packages implement business logic and depend on foundation packages for cross-cutting concerns.

### Testing Package (`@fusionaize/sdk-testing`)
Testing utilities shared across the ecosystem. This package is a dev-time dependency only and should not be required for runtime usage.

## Package Specifications

### 1. `@fusionaize/sdk-core`

**Purpose**: Foundational types, utilities, and abstractions that form the bedrock of the SDK. This package has zero dependencies and provides the primitive building blocks used by all other packages.

**Public API**:
- Core types: `Result<T, E>`, `JsonValue`, `JsonObject`, `Metadata`, `Timestamp`, `Duration`, `Envelope<T>`
- Utility functions: `ok()`, `err()`, `now()`
- Type predicates and guards for core types

**Allowed Dependencies**:
- None (zero-dependency foundation)

**Not Allowed**:
- Business logic or service-specific types
- HTTP/network utilities
- Configuration loading
- Authentication logic
- Any external dependencies beyond TypeScript built-ins
- Dependencies on other SDK packages

**Implementation Notes**:
- Must remain dependency-free to prevent dependency cycles
- All exports should be pure TypeScript types and simple utility functions
- No runtime dependencies on Node.js APIs (browser compatible)
- Use TypeScript's built-in types where possible (`Partial`, `Pick`, etc.)

---

### 2. `@fusionaize/sdk-contracts`

**Purpose**: API contracts, request/response types, and protocol definitions for fusionAIze services. Provides the type-safe interface definitions that clients and servers must agree on.

**Public API**:
- API request/response types: `RunRequest`, `RunResponse`, `ToolCall`, `ToolResult`
- Streaming types: `StreamEvent` (discriminated union)
- Pagination and list types: `Pagination`, `ListResponse<T>`
- Trace metadata: `TraceMetadata`

**Allowed Dependencies**:
- `@fusionaize/sdk-core` (for `JsonObject`, `Metadata` types)

**Not Allowed**:
- Implementation logic for serialization/deserialization
- HTTP client logic
- Authentication logic
- Error handling implementations
- Dependencies on other foundation packages beyond `sdk-core`

**Implementation Notes**:
- Types should be interfaces, not classes (when possible)
- Use discriminated unions for variant types (`StreamEvent`)
- All types should be serializable (no functions, no complex class hierarchies)
- Consider backward compatibility when extending types

---

### 3. `@fusionaize/sdk-errors`

**Purpose**: Canonical error taxonomy, serializable error types, and error utilities for consistent error handling across the SDK.

**Public API**:
- Error codes: `ErrorCode` enum
- Error types: `SerializableError`, `FusionAIzeError` class
- Conversion utilities: `errorToJSON()`, `errorFromJSON()`
- Type guards and predicates: `isRetryable()`, `isUserError()`

**Allowed Dependencies**:
- `@fusionaize/sdk-core` (for `JsonObject` type)

**Not Allowed**:
- HTTP error handling (transport layer concerns)
- Authentication-specific errors (except as error codes)
- Logging or telemetry logic
- Dependencies on other foundation packages beyond `sdk-core`

**Implementation Notes**:
- `FusionAIzeError` should extend the built-in `Error` class
- Error serialization should produce JSON-serializable objects
- Error codes should map to HTTP status codes where appropriate
- Maintain clear distinction between client (4xx) and server (5xx) errors

---

### 4. `@fusionaize/sdk-config`

**Purpose**: Configuration loading, profile resolution, validation, and type-safe configuration management for fusionAIze clients.

**Public API**:
- Configuration types: `ClientConfig`, `ProfileConfig`, `EnvironmentConfig`
- Loading functions: `loadConfig()`, `resolveProfile()`, `validateConfig()`
- Environment detection: `detectEnvironment()`, `getDefaultProfiles()`
- Profile management: `mergeProfiles()`, `applyOverrides()`

**Allowed Dependencies**:
- `@fusionaize/sdk-core` (for core types)
- `@fusionaize/sdk-errors` (for configuration validation errors)

**Not Allowed**:
- Authentication credential resolution (auth package concern)
- Secret management (use environment variables or external secret stores)
- Platform-specific configuration formats (YAML/TOML parsers)
- Dependencies on transport or tracing packages

**Implementation Notes**:
- Support multiple configuration sources (env vars, config files, defaults)
- Validate configuration at load time, not at runtime
- Use Zod or similar for runtime validation if needed
- Profile system should support inheritance and merging
- Consider security implications of configuration loading

---

### 5. `@fusionaize/sdk-auth`

**Purpose**: Authentication providers, token handling, credential management, and authentication header generation for fusionAIze services.

**Public API**:
- Authentication providers: `AuthProvider` interface, `TokenAuthProvider`, `ApiKeyAuthProvider`
- Token management: `TokenStore`, `TokenRefreshOptions`
- Credential types: `Credentials`, `ApiKey`, `BearerToken`
- Utilities: `createAuthHeaders()`, `validateCredentials()`

**Allowed Dependencies**:
- `@fusionaize/sdk-core` (for core types)
- `@fusionaize/sdk-config` (for configuration)
- `@fusionaize/sdk-errors` (for authentication errors)

**Not Allowed**:
- HTTP transport logic (transport package concern)
- Business logic or service-specific authentication
- Persistent storage of credentials
- Dependencies on tracing or transport packages

**Implementation Notes**:
- Support multiple authentication methods (API key, bearer token, OAuth2)
- Token refresh should be abstract and extensible
- Credentials should never be logged or exposed in error messages
- Consider secure storage options for different environments

---

### 6. `@fusionaize/sdk-transport`

**Purpose**: HTTP transport layer, request/response handling, retry logic, timeout management, and low-level HTTP communication.

**Public API**:
- Transport interface: `Transport`, `RequestOptions`, `Response<T>`
- Implementations: `FetchTransport`, `NodeHttpTransport`
- Retry logic: `RetryPolicy`, `RetryStrategy`
- Middleware: `Middleware`, `composeMiddleware()`
- Utilities: `createRequest()`, `parseResponse()`

**Allowed Dependencies**:
- `@fusionaize/sdk-core` (for core types)
- `@fusionaize/sdk-errors` (for transport errors)
- `@fusionaize/sdk-auth` (for authentication)
- `@fusionaize/sdk-tracing` (for trace propagation)

**Not Allowed**:
- Business logic or service-specific API calls
- Configuration loading (config package concern)
- Dependencies on service client packages (`gate-*`)
- Dependencies on testing package

**Implementation Notes**:
- Abstract over fetch/Node.js http for environment compatibility
- Support middleware for observability, logging, and customization
- Implement sensible default retry policies with exponential backoff
- Handle streaming responses as first-class citizens
- Consider connection pooling and keep-alive for performance

---

### 7. `@fusionaize/sdk-tracing`

**Purpose**: Distributed tracing, correlation ID propagation, trace context management, and observability utilities.

**Public API**:
- Trace types: `TraceContext`, `Span`, `SpanAttributes`
- Propagation: `TracePropagator`, `W3CTracePropagator`
- Utilities: `createTraceContext()`, `getCurrentTrace()`, `withTrace()`
- Integration: `TracingMiddleware` for transport

**Allowed Dependencies**:
- `@fusionaize/sdk-core` (for core types)
- `@fusionaize/sdk-contracts` (for `TraceMetadata`)

**Not Allowed**:
- Telemetry backend integrations (exporters should be external)
- Logging implementation (tracing data only)
- Business logic or service-specific tracing
- Dependencies on auth or transport packages

**Implementation Notes**:
- Support W3C Trace Context standard
- Provide lightweight in-memory tracing for development
- Integrate with OpenTelemetry if needed (as optional dependency)
- Trace context should propagate across async boundaries
- Consider performance impact of tracing in hot paths

---

### 8. `@fusionaize/sdk-testing`

**Purpose**: Testing utilities, mocks, fixtures, and test helpers shared across the fusionAIze SDK ecosystem.

**Public API**:
- Mock implementations: `MockTransport`, `MockAuthProvider`
- Test fixtures: `createTestConfig()`, `createTestTraceContext()`
- Assertion utilities: `assertResult()`, `assertError()`
- Integration helpers: `setupIntegrationTest()`, `teardownIntegrationTest()`

**Allowed Dependencies**:
- All foundation packages (`sdk-*`)
- Service client packages (`gate-*`) for integration testing

**Not Allowed**:
- Runtime dependencies required by production code
- Business logic that should live in other packages
- Heavy dependencies that increase bundle size

**Implementation Notes**:
- This package is dev-dependency only
- Mocks should implement the same interfaces as real implementations
- Fixtures should be configurable and reusable
- Consider test performance and isolation
- Document testing patterns and best practices

---

### 9. `@fusionaize/gate-client`

**Purpose**: Type-safe client for fusionAIze Gate data-plane operations, providing a clean, idiomatic API for interacting with the Gate service.

**Public API**:
- Client class: `GateClient` with methods for all Gate operations
- Operation types: `CreateRunOptions`, `StreamRunOptions`, `ListRunsOptions`
- Response types: `Run`, `RunList`, `ProviderStatus`
- Streaming: `RunStream`, `streamRun()`

**Allowed Dependencies**:
- All foundation packages (`sdk-core`, `sdk-contracts`, `sdk-errors`, `sdk-config`, `sdk-auth`, `sdk-transport`, `sdk-tracing`)
- `@fusionaize/gate-runtime` (for runtime helpers)
- `@fusionaize/gate-control` (for control plane operations if needed)

**Not Allowed**:
- Business logic unrelated to Gate service
- Provider-native implementation details
- UI-specific components or rendering logic
- Dependencies on testing package

**Implementation Notes**:
- Follow the adapter pattern: translate SDK types to/from API contracts
- Implement both promise-based and streaming APIs
- Handle authentication, retries, and tracing transparently
- Provide clear error messages and documentation
- Consider client-side validation of requests

---

### 10. `@fusionaize/gate-runtime`

**Purpose**: Runtime helpers for orchestration, fallback strategies, capability detection, and runtime optimizations for Gate operations.

**Public API**:
- Orchestration: `Orchestrator`, `FallbackStrategy`, `LoadBalancer`
- Capability detection: `CapabilityDetector`, `ModelMatcher`
- Runtime utilities: `RuntimeConfig`, `PerformanceMetrics`
- Integration helpers: `createRuntime()`, `configureRuntime()`

**Allowed Dependencies**:
- `@fusionaize/sdk-core`, `@fusionaize/sdk-contracts`, `@fusionaize/sdk-errors`, `@fusionaize/sdk-transport`, `@fusionaize/sdk-tracing`
- `@fusionaize/gate-client` (for client operations)

**Not Allowed**:
- Configuration loading (config package concern)
- Authentication logic (auth package concern)
- Transport implementation (transport package concern)
- Dependencies on testing package

**Implementation Notes**:
- Focus on runtime behavior, not API contracts
- Implement pluggable strategies for extensibility
- Consider performance and memory usage
- Provide sensible defaults with customization options
- Document orchestration patterns and trade-offs

---

### 11. `@fusionaize/gate-control`

**Purpose**: Control-plane/admin-safe client for health checks, route management, provider administration, and operational monitoring.

**Public API**:
- Admin client: `GateControlClient` with admin operations
- Management types: `HealthCheck`, `RouteConfig`, `ProviderConfig`
- Monitoring: `Metrics`, `LogsQuery`, `AlertRules`
- Operations: `manageRoutes()`, `updateProviders()`, `checkHealth()`

**Allowed Dependencies**:
- All foundation packages (`sdk-core`, `sdk-contracts`, `sdk-errors`, `sdk-config`, `sdk-auth`, `sdk-transport`, `sdk-tracing`)
- `@fusionaize/gate-client` (for underlying operations)
- `@fusionaize/gate-runtime` (for runtime integration)

**Not Allowed**:
- Data-plane business logic (gate-client concern)
- User-facing authentication (use admin credentials)
- UI components or dashboard rendering
- Dependencies on testing package

**Implementation Notes**:
- Separate from data-plane client for security boundaries
- Use admin authentication with appropriate permissions
- Implement idempotent operations where possible
- Provide detailed operational insights
- Consider audit logging and compliance requirements

---

## Dependency Graph Summary

```
sdk-core (0 dependencies)
  ├─ sdk-contracts
  ├─ sdk-errors
  └─ sdk-config
      └─ sdk-auth
          └─ sdk-transport
              └─ gate-client
                  ├─ gate-runtime
                  └─ gate-control
sdk-tracing
  └─ sdk-transport
sdk-testing (dev-only, depends on all)
```

## Dangerous Boundary Violations to Watch For

### 1. **Foundation → Service Dependencies**
- **Risk**: Creates circular dependencies and couples foundation to business logic
- **Example**: `sdk-core` importing `gate-client`
- **Detection**: `check-package-boundaries.mjs` script
- **Fix**: Move shared logic to appropriate foundation package

### 2. **Runtime → Testing Dependencies**
- **Risk**: Includes test utilities in production bundles
- **Example**: `gate-client` importing `sdk-testing`
- **Detection**: Build-time analysis and dependency checking
- **Fix**: Ensure `sdk-testing` is devDependency only

### 3. **Circular Foundation Dependencies**
- **Risk**: Creates unbreakable dependency cycles
- **Example**: `sdk-auth` → `sdk-transport` → `sdk-auth`
- **Detection**: Graph traversal in boundary check
- **Fix**: Extract shared logic to lower-level package

### 4. **Business Logic in Foundation Packages**
- **Risk**: Foundation packages become coupled to specific services
- **Example**: `sdk-core` containing Gate-specific types
- **Detection**: Code review and architecture validation
- **Fix**: Move business logic to appropriate service package

### 5. **External Dependencies in Foundation Packages**
- **Risk**: Increases bundle size and creates version conflicts
- **Example**: `sdk-core` depending on `axios` or `lodash`
- **Detection**: Package.json analysis
- **Fix**: Use native APIs or extract to higher-level package

## Validation Commands

```bash
# Validate package boundaries
pnpm check:boundaries

# Validate exports
pnpm check:exports

# Build all packages
pnpm build

# Run type checking
pnpm typecheck
```

---

*See also: [Package Boundaries](./PACKAGE_BOUNDARIES.md), [Architecture Overview](./OVERVIEW.md)*