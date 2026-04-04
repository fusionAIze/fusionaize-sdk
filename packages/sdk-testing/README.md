# @fusionaize/sdk-testing

Testing fixtures and utilities for fusionAIze SDK.

## Purpose

Provides test fixtures, fake transports, contract fixtures, and mock response builders for testing fusionAIze integrations.

## When to use

- Writing unit tests for fusionAIze clients
- Mocking HTTP responses in integration tests
- Generating realistic contract fixtures
- Building test harnesses for SDK consumers

## Public exports

- `MockTransport` – configurable mock HTTP transport
- `fixtures` – pre‑defined request/response fixtures
- `mockRunResponse`, `mockStreamEvent` – mock builders
- `expectContract` – contract validation helpers
- `FakeAuthProvider` – auth provider for testing

## Example

```typescript
import { MockTransport, fixtures } from '@fusionaize/sdk-testing';

const transport = new MockTransport();
transport.mockResponse(fixtures.run.success);
```

## Dependency notes

Depends on `@fusionaize/sdk-core`, `@fusionaize/sdk-contracts`, and `@fusionaize/sdk-errors`.

## Stability

**Experimental** – Testing utilities may expand as SDK matures.