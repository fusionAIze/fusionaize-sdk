# @fusionaize/gate-control

Control‑plane/admin‑safe client for fusionAIze Gate.

## Purpose

Provides control‑plane and admin‑safe operations for Gate: health, routes, provider status, and inspect‑oriented client operations.

## When to use

- Building operator tools or dashboards
- Monitoring Gate health and provider status
- Inspecting routes and configuration
- Performing admin actions (e.g., reload providers)

## Public exports

- `ControlClient` – control‑plane client
- `health`, `routes`, `providers` – inspection endpoints
- `reloadProviders`, `updateRoute` – admin actions
- `metrics` – operational metrics
- `controlFromConfig` – factory from configuration

## Example

```typescript
import { ControlClient } from '@fusionaize/gate-control';

const control = new ControlClient(config);
const health = await control.health();
const routes = await control.routes();
```

## Dependency notes

Depends on all foundation SDK packages: `@fusionaize/sdk‑core`, `@fusionaize/sdk‑contracts`, `@fusionaize/sdk‑errors`, `@fusionaize/sdk‑config`, `@fusionaize/sdk‑auth`, `@fusionaize/sdk‑transport`, `@fusionaize/sdk‑tracing`.

## Stability

**Beta** – Control‑plane API is relatively stable but may see additions.