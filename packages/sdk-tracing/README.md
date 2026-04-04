# @fusionaize/sdk-tracing

Tracing and correlation metadata for fusionAIze SDK.

## Purpose

Provides trace IDs, correlation metadata, propagation helpers, and timing/operation context for observability.

## When to use

- Instrumenting code with trace identifiers
- Propagating trace context across service boundaries
- Adding timing and operation metadata to requests
- Building observability integrations

## Public exports

- `TraceContext` – trace and span context
- `generateTraceId`, `generateSpanId` – ID generation
- `propagateTrace` – inject/extract trace headers
- `withTrace` – wrap async operations with tracing
- `Timing` – operation timing utilities

## Example

```typescript
import { generateTraceId, withTrace } from '@fusionaize/sdk-tracing';

const traceId = generateTraceId();
const result = await withTrace(traceId, 'operation', async () => {
  // ... work
});
```

## Dependency notes

Depends on `@fusionaize/sdk-core` and `@fusionaize/sdk-contracts`.

## Stability

**Experimental** – Tracing APIs may evolve as observability needs mature.