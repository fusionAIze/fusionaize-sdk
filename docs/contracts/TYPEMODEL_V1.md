# Type Model v1 - @fusionaize/sdk-contracts

> Client-side contract definitions for fusionAIze runtime/client interactions

## Overview

This document describes the v1 type model for `@fusionaize/sdk-contracts`, providing provider-neutral, Gate-first compatible TypeScript definitions for client-side interactions with fusionAIze services.

## File Structure

The type model is implemented in a single file for simplicity and ease of import:

```
packages/sdk-contracts/src/index.ts
```

### Import Structure

```typescript
// Core types from sdk-core
import type { JsonObject, JsonValue, Metadata, Timestamp } from "@fusionaize/sdk-core";

// All contract types defined and exported in the same file
// Re-exports of core types for convenience
export type { JsonObject, JsonValue, Metadata, Timestamp, Envelope, Result } from "@fusionaize/sdk-core";
```

## Type Categories

### 1. Core Types & Envelopes
**Purpose**: Foundation for all API responses and results

| Type | Stability | Description |
|------|-----------|-------------|
| `Status` | Beta | Health check and operational status |
| `Envelope<T>` (from sdk-core) | Stable | Standard response wrapper with metadata |
| `Result<T, E>` (from sdk-core) | Stable | Typed result for success/failure operations |

### 2. Capability Descriptors
**Purpose**: Describe provider capabilities and supported models

| Type | Stability | Description |
|------|-----------|-------------|
| `CapabilityDescriptor` | Beta | Describes a specific capability |
| `ProviderDescriptor` | Beta | Describes a provider with models and capabilities |

### 3. Message & Context Types
**Purpose**: Conversation and message handling

| Type | Stability | Description |
|------|-----------|-------------|
| `Message` | Stable | Single message in a conversation |
| `MessageRole` | Stable | Role of a message (system/user/assistant/tool) |

### 4. Tool Definitions & Invocations
**Purpose**: Function calling and tool execution

| Type | Stability | Description |
|------|-----------|-------------|
| `ToolDefinition` | Stable | Tool definition for function calling |
| `ToolCall` | Stable | Tool invocation from the model |
| `ToolResult` | Stable | Result of tool execution |
| `ToolChoice` | Stable | Tool calling configuration |

### 5. Run Request & Response
**Purpose**: Core run execution contracts

| Type | Stability | Description |
|------|-----------|-------------|
| `RunRequest` | Stable | Parameters for creating a run |
| `RunResponse` | Stable | Response from run execution |
| `RunChoice` | Stable | Choice in a run response |
| `TokenUsage` | Stable | Token usage statistics |
| `FinishReason` | Stable | Why a run finished |

### 6. Approval Workflow Types
**Purpose**: Human-in-the-loop approval workflows

| Type | Stability | Description |
|------|-----------|-------------|
| `ApprovalRequest` | Beta | Request for human approval |
| `ApprovalDecision` | Beta | Decision on an approval request |

### 7. Stream Event Types
**Purpose**: Streaming API events

| Type | Stability | Description |
|------|-----------|-------------|
| `StreamEvent` | Stable | Union of all stream events |
| `RunStartEvent` | Stable | Run started event |
| `RunCompletionEvent` | Stable | Content completion event |
| `RunToolCallEvent` | Stable | Tool call event |
| `RunToolResultEvent` | Stable | Tool result event |
| `RunFinishEvent` | Stable | Run finished event |
| `RunErrorEvent` | Stable | Run error event |

### 8. Trace Metadata
**Purpose**: Distributed tracing support

| Type | Stability | Description |
|------|-----------|-------------|
| `TraceMetadata` | Stable | Trace context metadata |

### 9. Pagination & Listing
**Purpose**: Standardized pagination patterns

| Type | Stability | Description |
|------|-----------|-------------|
| `PaginationParams` | Stable | Pagination parameters |
| `Pagination` | Stable | Alias for backward compatibility |
| `ListResponse<T>` | Stable | Standard list response |

### 10. Run Status & Operations
**Purpose**: Run management and status tracking

| Type | Stability | Description |
|------|-----------|-------------|
| `RunStatus` | Stable | Run status information |
| `RunListItem` | Stable | Run list item (summary view) |

## Modeling Decisions

### 1. Provider-Neutral Design
- **Decision**: Types avoid provider-specific fields in core contracts
- **Rationale**: Enables multi-provider compatibility and runtime flexibility
- **Implementation**: Provider-specific parameters go in `parameters?: JsonObject` field

### 2. Gate-First Compatibility
- **Decision**: Maintain compatibility with existing Gate API patterns
- **Rationale**: Smooth migration path for existing Gate users
- **Implementation**: 
  - `RunRequest` matches Gate's run creation endpoint
  - `StreamEvent` types match Gate's streaming events
  - `Pagination` aligns with Gate's pagination pattern

### 3. Strong TypeScript Typing
- **Decision**: Use discriminated unions, literal types, and strict interfaces
- **Rationale**: Compile-time safety and better developer experience
- **Implementation**:
  - `StreamEvent` as discriminated union with `type` discriminator
  - `FinishReason` as literal type union
  - `MessageRole` as literal type union

### 4. JSON Serializability
- **Decision**: All types are JSON-serializable
- **Rationale**: Enables network transmission and storage
- **Implementation**: No functions in interfaces, only data types

### 5. Extensibility Patterns
- **Decision**: Use optional fields and `JsonObject` for extensions
- **Rationale**: Allows evolution without breaking changes
- **Implementation**:
  - `metadata?: Metadata` for user-provided data
  - `parameters?: JsonObject` for provider-specific extensions
  - `attributes?: Record<string, string | number | boolean>` for trace metadata

### 6. Backward Compatibility
- **Decision**: Maintain compatibility with existing type names
- **Rationale**: Minimize breaking changes for existing users
- **Implementation**:
  - Keep `Pagination` as alias for `PaginationParams`
  - Maintain existing `StreamEvent` type names (`run.completion` not `run.content`)
  - Preserve field names from existing Gate API

## Stability Annotations

### Stable APIs (Suitable for Production Use)
These types have stable semantics and will maintain backward compatibility within major versions:

- **Core Envelopes**: `Envelope<T>`, `Result<T, E>`
- **Message Types**: `Message`, `MessageRole`
- **Tool Definitions**: `ToolDefinition`, `ToolCall`, `ToolResult`, `ToolChoice`
- **Run Contracts**: `RunRequest`, `RunResponse`, `RunChoice`, `TokenUsage`, `FinishReason`
- **Streaming**: `StreamEvent` and all event types
- **Tracing**: `TraceMetadata`
- **Pagination**: `PaginationParams`, `Pagination`, `ListResponse<T>`
- **Run Management**: `RunStatus`, `RunListItem`

### Beta APIs (May Evolve Based on Feedback)
These types are well-defined but may see refinements based on runtime experience:

- **Status Types**: `Status` - May expand with additional health check details
- **Capability Descriptors**: `CapabilityDescriptor`, `ProviderDescriptor` - May evolve as provider ecosystem grows
- **Approval Workflows**: `ApprovalRequest`, `ApprovalDecision` - May be refined based on real-world approval patterns

### Experimental APIs (Not Included in v1)
The following are intentionally omitted from v1 to keep the contract surface focused:

- Provider-specific configuration types
- Runtime orchestration strategies
- Advanced session management
- Complex cost tracking structures

## Usage Examples

### Basic Run Execution
```typescript
import { RunRequest, RunResponse } from '@fusionaize/sdk-contracts';

const request: RunRequest = {
  model: 'claude-3-haiku',
  messages: [
    { role: 'user', content: 'Hello, world!' }
  ],
  stream: false,
};

// Response would match RunResponse interface
```

### Streaming Events
```typescript
import { StreamEvent } from '@fusionaize/sdk-contracts';

function handleStreamEvent(event: StreamEvent) {
  switch (event.type) {
    case 'run.start':
      console.log(`Run ${event.data.id} started with model ${event.data.model}`);
      break;
    case 'run.completion':
      console.log(`Content: ${event.data.content}`);
      break;
    // ... other cases
  }
}
```

### Paginated Lists
```typescript
import { ListResponse, RunListItem, PaginationParams } from '@fusionaize/sdk-contracts';

async function listRuns(params: PaginationParams): Promise<ListResponse<RunListItem>> {
  // Implementation would return paginated runs
  return {
    items: [],
    has_more: false,
  };
}
```

## Evolution Strategy

### Versioning Approach
- **Major versions**: Breaking changes to stable APIs
- **Minor versions**: Additive changes only
- **Deprecation**: Mark deprecated APIs with `@deprecated` JSDoc tags

### Breaking Change Examples
- Removing or renaming fields in stable interfaces
- Changing type semantics in incompatible ways
- Removing exported types

### Non-Breaking Change Examples
- Adding new optional fields
- Adding new union variants to discriminated unions
- Adding new exported types
- Expanding literal type unions

## Integration with Other Packages

### Foundation Package Dependencies
- `@fusionaize/sdk-core`: Core types (`JsonObject`, `Metadata`, `Timestamp`, etc.)
- No other foundation package dependencies

### Consumer Packages
- `@fusionaize/gate-client`: Primary consumer for Gate API interactions
- `@fusionaize/gate-runtime`: Runtime helpers using contracts
- `@fusionaize/gate-control`: Control plane operations
- `@fusionaize/sdk-transport`: HTTP transport layer
- `@fusionaize/sdk-tracing`: Tracing integration
- `@fusionaize/sdk-testing`: Test utilities

## Validation

The type model has been validated with:

1. **TypeScript Compilation**: `pnpm build` succeeds for all packages
2. **Boundary Checks**: `pnpm check:boundaries` passes
3. **Export Validation**: All types properly exported
4. **Consumer Compatibility**: Existing consumers compile successfully

## Future Considerations

### Potential v2 Enhancements
1. **Enhanced Capability Modeling**: More detailed provider capability descriptors
2. **Cost Tracking**: Standardized cost and usage tracking types
3. **Session Management**: Long-lived conversation session types
4. **Advanced Orchestration**: Runtime strategy configuration types

### Extension Points
1. **Provider Plugins**: Type extensions for provider-specific features
2. **Middleware Hooks**: Event hooks and interception types
3. **Monitoring**: Enhanced observability and monitoring types

---

*Type Model Version: v1.0.0*  
*Last Updated: April 2025*  
*See also: [Package Specifications](../architecture/PACKAGE_SPECIFICATIONS.md)*