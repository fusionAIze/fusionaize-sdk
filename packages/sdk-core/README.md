# @fusionaize/sdk-core

Core types and utilities for the fusionAIze SDK.

## Purpose

Provides foundational types, result/envelope utilities, shared metadata primitives, and small, dependency-light helpers.

## When to use

- Building other foundation packages
- Needing basic TypeScript primitives for fusionAIze contracts
- Implementing lightweight utilities that should not depend on transport, auth, or domain logic

## Public exports

- `Result<T, E>` – typed result envelope
- `Envelope<T>` – standard response wrapper
- `Metadata` – shared metadata primitives
- `Timestamp`, `Duration` – time utilities
- `JsonValue`, `JsonObject` – JSON type helpers

## Example

```typescript
import { Result, Envelope } from '@fusionaize/sdk-core';

const result: Result<string, Error> = Result.ok('success');
const envelope: Envelope<string> = { data: 'value', metadata: {} };
```

## Dependency notes

This package has **zero runtime dependencies**. It is meant to be lightweight and widely usable.

## Stability

**Beta** – API is relatively stable but may see small adjustments as the SDK matures.