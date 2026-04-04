# @fusionaize/sdk-contracts

Contracts and type definitions for fusionAIze API interactions.

## Purpose

Defines the canonical request/response shapes, stream event types, trace metadata, and pagination contracts used across the fusionAIze stack.

## When to use

- Implementing a client that calls fusionAIze APIs
- Defining server-side handlers that need to conform to fusionAIze contracts
- Building tools that validate or generate fusionAIze API payloads
- Creating mocks or fixtures for testing

## Public exports

- `RunRequest`, `RunResponse` – core execution contracts
- `ToolCall`, `ToolResult` – tool invocation shapes
- `StreamEvent` – union of all stream event types
- `TraceMetadata` – trace and correlation metadata
- `Pagination`, `ListResponse` – pagination contracts

## Example

```typescript
import type { RunRequest, RunResponse } from '@fusionaize/sdk-contracts';

const request: RunRequest = {
  model: 'claude-3-haiku',
  messages: [{ role: 'user', content: 'Hello' }],
};

const response: RunResponse = {
  id: 'run_123',
  model: 'claude-3-haiku',
  choices: [{ message: { role: 'assistant', content: 'Hi there!' } }],
};
```

## Dependency notes

Depends on `@fusionaize/sdk-core` for base types.

## Stability

**Beta** – Contracts are expected to evolve as the fusionAIze API matures, but breaking changes will be documented.