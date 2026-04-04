# @fusionaize/sdk-auth

Authentication abstraction for fusionAIze SDK.

## Purpose

Provides token/session abstraction, auth header resolution, and authentication contract for fusionAIze clients.

## When to use

- Building a client that needs to authenticate with fusionAIze APIs
- Managing API keys, tokens, or session credentials
- Implementing auth middleware for HTTP requests
- Resolving authentication from configuration

## Public exports

- `AuthProvider` – interface for authentication providers
- `TokenAuth`, `ApiKeyAuth`, `SessionAuth` – concrete providers
- `resolveAuth` – resolve authentication from config
- `authHeaders` – generate headers for authenticated requests
- `refreshToken` – token refresh utilities

## Example

```typescript
import { resolveAuth, authHeaders } from '@fusionaize/sdk-auth';

const auth = await resolveAuth(config);
const headers = authHeaders(auth);
// headers: { Authorization: 'Bearer ...' }
```

## Dependency notes

Depends on `@fusionaize/sdk-core`, `@fusionaize/sdk-config`, and `@fusionaize/sdk-errors`.

## Stability

**Experimental** – Authentication mechanisms may evolve as the stack matures.