# @fusionaize/gate-runtime

Runtime‑oriented Gate access helpers.

## Purpose

Provides runtime‑oriented helpers for Gate access: capability negotiation, run orchestration client abstractions, and higher‑level runtime patterns.

## When to use

- Building runtime orchestration layers on top of Gate
- Negotiating capabilities between client and server
- Implementing retry, fallback, or composition patterns
- Creating higher‑level abstractions for specific use cases

## Public exports

- `RuntimeClient` – runtime‑focused client wrapper
- `negotiateCapabilities` – capability discovery
- `orchestrateRun` – orchestration with retry/fallback
- `withRuntime` – runtime context manager
- `RuntimeError` – runtime‑specific error class

## Example

```typescript
import { RuntimeClient } from '@fusionaize/gate-runtime';

const runtime = new RuntimeClient(config);
const result = await runtime.orchestrateRun(request, {
  retries: 3,
  fallbackModels: ['claude-3-haiku', 'gpt-4'],
});
```

## Dependency notes

Depends on `@fusionaize/sdk‑core`, `@fusionaize/sdk‑contracts`, `@fusionaize/sdk‑errors`, `@fusionaize/sdk‑transport`, `@fusionaize/sdk‑tracing`.

## Stability

**Experimental** – Runtime helpers may evolve as patterns emerge.