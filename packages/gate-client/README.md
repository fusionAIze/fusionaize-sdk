# @fusionaize/gate-client

Typed client for fusionAIze Gate data‑plane operations.

## Purpose

Provides a typed, ergonomic client for calling fusionAIze Gate's data‑plane APIs: run execution, listing, status, and streaming.

## When to use

- Building an application that calls fusionAIze Gate
- Executing runs with typed requests/responses
- Streaming run progress and completions
- Integrating Gate into custom workflows

## Public exports

- `GateClient` – main client class
- `createRun`, `getRun`, `listRuns` – core operations
- `streamRun` – Server‑Sent Events stream
- `cancelRun` – cancel an in‑progress run
- `clientFromConfig` – factory from configuration

## Example

```typescript
import { GateClient } from '@fusionaize/gate-client';

const client = new GateClient({ endpoint: 'http://localhost:8090' });
const run = await client.createRun({
  model: 'claude-3-haiku',
  messages: [{ role: 'user', content: 'Hello' }],
});
```

## Dependency notes

Depends on all foundation SDK packages: `@fusionaize/sdk‑core`, `@fusionaize/sdk‑contracts`, `@fusionaize/sdk‑errors`, `@fusionaize/sdk‑config`, `@fusionaize/sdk‑auth`, `@fusionaize/sdk‑transport`, `@fusionaize/sdk‑tracing`.

## Stability

**Beta** – Client API is relatively stable but may see additions as Gate evolves.