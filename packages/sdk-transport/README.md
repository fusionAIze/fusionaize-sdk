# @fusionaize/sdk-transport

HTTP transport layer for fusionAIze SDK.

## Purpose

Provides HTTP wrapper, timeout/retry baseline, SSE/stream plumbing, and request middleware hooks for fusionAIze clients.

## When to use

- Making HTTP requests to fusionAIze APIs
- Handling retries, timeouts, and errors
- Streaming responses (Server‑Sent Events)
- Adding middleware (logging, tracing, metrics)

## Public exports

- `HttpTransport` – configurable HTTP client
- `request` – make a typed HTTP request
- `stream` – stream Server‑Sent Events
- `RetryPolicy`, `TimeoutPolicy` – policy definitions
- `middleware` – middleware composition utilities

## Example

```typescript
import { request } from '@fusionaize/sdk-transport';

const response = await request<RunResponse>({
  method: 'POST',
  url: '/v1/runs',
  body: runRequest,
});
```

## Dependency notes

Depends on `@fusionaize/sdk-core`, `@fusionaize/sdk-errors`, `@fusionaize/sdk-auth`, and `@fusionaize/sdk-tracing`.

## Stability

**Experimental/Beta** – Transport layer is relatively stable but may see extensions.